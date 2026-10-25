/* AI Marg: optional sign-in with Google so progress is backed up and synced across devices.
   Plain script (no build step). Exposes window.AIM_CLOUD.
   - Uses Firebase Authentication (loaded only when someone signs in, or was signed in before).
   - Stores one document per learner in Cloud Firestore through its REST API (no big database SDK):
     progress/{uid} = { state: "<progress JSON>", v: 1, updatedAt }.
   - Every sync reads the cloud copy, merges it with this device (AIM_CORE.mergeState) and writes back,
     so nothing is lost when two devices are used.
   The site works fully without signing in; progress then stays in this browser only. */
(function () {
  'use strict';
  var C = window.AIM_CORE;
  var CFG = window.AIM_FIREBASE || null;
  var SDK = 'https://www.gstatic.com/firebasejs/12.10.0/';
  var FLAG = 'aimarg.cloud';
  var MAX_CHARS = 900000; // a Firestore document holds up to 1 MiB
  var fb = null, user = null, loading = null, timer = null, suppress = false, busy = false, again = false, justSignedIn = false, deleting = false;
  var info = { state: 'off', user: null, lastSync: 0, error: '' };
  var subs = [];

  function enabled() {
    return !!(CFG && CFG.apiKey && CFG.projectId && CFG.authDomain) && !window.AIM_PREVIEW && /^https?:$/.test(location.protocol);
  }
  function emit() { subs.forEach(function (fn) { try { fn(status()); } catch (e) {} }); }
  function set(st, err) { info.state = st; info.error = err || ''; emit(); }
  function flag(on) { try { if (on) localStorage.setItem(FLAG, '1'); else localStorage.removeItem(FLAG); } catch (e) {} }
  function flagged() { try { return localStorage.getItem(FLAG) === '1'; } catch (e) { return false; } }
  function status() { return { enabled: enabled(), state: info.state, user: info.user, lastSync: info.lastSync, error: info.error }; }

  // Firebase app + auth only (about 65 KB compressed), loaded on demand
  function load() {
    if (loading) return loading;
    set('loading');
    loading = Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js')]).then(function (m) {
      var appMod = m[0], authMod = m[1];
      var app = appMod.initializeApp(CFG);
      var auth = authMod.getAuth(app);
      fb = { auth: auth, A: authMod };
      return new Promise(function (resolve) {
        var first = true;
        authMod.onAuthStateChanged(auth, function (u) {
          user = u || null;
          info.user = u ? { name: u.displayName || '', email: u.email || '', uid: u.uid } : null;
          if (u) { flag(true); set('signed-in'); sync(justSignedIn ? 'sign-in' : 'restore'); justSignedIn = false; }
          else { flag(false); set('signed-out'); }
          if (first) { first = false; resolve(fb); }
        });
      });
    }, function (e) {
      loading = null;
      set('error', 'Could not load the sign-in service. Check your internet connection and try again.');
      throw e;
    });
    return loading;
  }

  function friendly(e) {
    var code = (e && e.code) || '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return '';
    if (code === 'auth/popup-blocked') return 'Your browser blocked the sign-in window. Allow pop-ups for this site, then press Sign in again.';
    if (code === 'auth/unauthorized-domain') return 'Sign-in is not allowed on this web address yet. The site owner must add ' + location.hostname + ' under Authentication > Settings > Authorized domains in Firebase.';
    if (code === 'auth/operation-not-allowed') return 'Google sign-in is switched off. The site owner must enable it under Authentication > Sign-in method in Firebase.';
    if (code === 'auth/network-request-failed') return 'No connection to Google. Check your internet and try again.';
    return 'Sign-in did not work (' + (code || (e && e.message) || 'unknown error') + '). Please try again.';
  }

  function signIn() {
    if (!enabled()) return Promise.resolve(false);
    return load().then(function () {
      var A = fb.A, provider = new A.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      set('loading'); justSignedIn = true;
      // a pop-up works on static hosting such as GitHub Pages; a redirect does not in browsers that block third-party storage
      return A.signInWithPopup(fb.auth, provider).then(function () { return true; }, function (e) {
        justSignedIn = false;
        var msg = friendly(e);
        set(user ? 'signed-in' : 'signed-out', msg);
        if (msg) C.toast(msg);
        return false;
      });
    }, function () { C.toast(info.error); return false; });
  }

  // noUpload: after deleting the cloud copy, do not write it straight back
  function signOut(clearDevice, noUpload) {
    if (!fb) return Promise.resolve();
    clearTimeout(timer); timer = null;
    // send the latest progress first, so nothing done on this device is lost
    var first = user && !noUpload ? push().catch(function () {}) : Promise.resolve();
    return first.then(function () { return fb.A.signOut(fb.auth); }).then(function () {
      flag(false);
      info.lastSync = 0;
      if (clearDevice) { suppress = true; C.resetAll(); suppress = false; window.dispatchEvent(new CustomEvent('aim:progress-replaced')); }
      C.toast(clearDevice ? 'Signed out. Progress removed from this device; it is safe in your account.' : 'Signed out. Your progress stays on this device too.');
    });
  }

  function docUrl() {
    return 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(CFG.projectId) + '/databases/(default)/documents/progress/' + encodeURIComponent(user.uid);
  }
  function call(method, body) {
    return user.getIdToken().then(function (token) {
      return fetch(docUrl(), {
        method: method,
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      });
    });
  }
  function pull() {
    return call('GET').then(function (r) {
      if (r.status === 404) return null;
      if (!r.ok) throw new Error('read ' + r.status);
      return r.json().then(function (j) {
        var s = j && j.fields && j.fields.state && j.fields.state.stringValue;
        if (!s) return null;
        try { return JSON.parse(s); } catch (e) { return null; }
      });
    });
  }
  function encode(state) {
    var s = JSON.stringify(state);
    if (s.length > MAX_CHARS) { var lite = JSON.parse(s); lite.code = {}; s = JSON.stringify(lite); }
    if (s.length > MAX_CHARS) throw new Error('too big');
    return s;
  }
  function write(state) {
    var body = { fields: { state: { stringValue: encode(state) }, v: { integerValue: '1' }, updatedAt: { timestampValue: new Date().toISOString() } } };
    return call('PATCH', body).then(function (r) { if (!r.ok) throw new Error('write ' + r.status); });
  }
  // read the cloud copy, merge it into this device, write the result back
  function push() {
    return pull().then(function (remote) {
      var merged = remote ? C.mergeState(C.state, remote) : C.state;
      if (remote && JSON.stringify(merged) !== JSON.stringify(C.state)) {
        suppress = true; C.replaceState(merged); suppress = false;
        window.dispatchEvent(new CustomEvent('aim:progress-replaced'));
      }
      return write(C.state);
    });
  }
  function sync(reason) {
    if (!user || !enabled() || deleting) return Promise.resolve(false);
    if (busy) { again = true; return Promise.resolve(false); }
    busy = true; set('syncing');
    return push().then(function () {
      info.lastSync = Date.now(); set('signed-in');
      if (reason === 'sign-in') C.toast('Signed in. Your progress is backed up and synced.');
      return true;
    }, function (e) {
      var m = String(e && e.message || e);
      var msg = /403/.test(m) ? 'The cloud copy refused this account. The site owner must publish the Firestore security rules from the README.'
        : /too big/.test(m) ? 'Your progress is too large to back up. Download a copy from My progress.'
        : /Failed to fetch|NetworkError|Load failed/i.test(m) ? 'Offline: your progress is saved on this device and will sync when you are back online.'
        : 'Could not sync just now (' + m + '). It will try again.';
      set('signed-in', msg);
      return false;
    }).then(function (ok) {
      busy = false;
      if (again) { again = false; schedule(1500); }
      return ok;
    });
  }
  function schedule(ms) { clearTimeout(timer); timer = setTimeout(function () { timer = null; sync('save'); }, ms); }

  C.onSave(function () { if (user && !suppress) schedule(8000); });
  document.addEventListener('visibilitychange', function () {
    if (!user) return;
    if (document.visibilityState === 'hidden') { if (timer) { clearTimeout(timer); timer = null; sync('hide'); } }
    else if (Date.now() - info.lastSync > 60000) sync('focus');
  });
  window.addEventListener('online', function () { if (user) sync('online'); });

  // someone who signed in before: restore the session quietly after the page has loaded
  if (enabled() && flagged()) {
    var start = function () { load().catch(function () {}); };
    if (document.readyState === 'complete') setTimeout(start, 300); else window.addEventListener('load', function () { setTimeout(start, 300); });
  } else if (enabled()) info.state = 'signed-out';

  window.AIM_CLOUD = {
    enabled: enabled, status: status, signIn: signIn, signOut: signOut,
    syncNow: function () { return sync('manual'); },
    deleteCloudCopy: function () {
      if (!user) return Promise.resolve(false);
      clearTimeout(timer); timer = null;
      deleting = true;
      return call('DELETE').then(function (r) {
        if (!r.ok && r.status !== 404) throw new Error('delete ' + r.status);
        return signOut(false, true);
      }).then(function () { deleting = false; C.toast('Your cloud copy is deleted and you are signed out.'); return true; }, function (e) { deleting = false; throw e; });
    },
    on: function (fn) { subs.push(fn); return function () { subs = subs.filter(function (x) { return x !== fn; }); }; }
  };
})();
