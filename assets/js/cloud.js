/* AI Marg: optional sign-in with Google so progress is backed up and synced across devices.
   Plain script (no build step). Exposes window.AIM_CLOUD.
   - Uses Firebase Authentication (loaded only when someone opens the account page, signs in, or was signed in before).
   - Stores one document per learner in Cloud Firestore through its REST API (no big database SDK):
     progress/{uid} = { state: "<progress JSON>", v: 1, updatedAt }.
   - Every sync reads the cloud copy, merges it with this device (AIM_CORE.mergeState) and writes back only if
     something changed. The write is conditional on the copy that was read, so when two devices sync at the same
     moment the slower one reads again and merges instead of overwriting.
   The site works fully without signing in; progress then stays in this browser only. */
(function () {
  'use strict';
  var C = window.AIM_CORE;
  var CFG = window.AIM_FIREBASE || null;
  var SDK = 'https://www.gstatic.com/firebasejs/12.10.0/';
  var FLAG = 'aimarg.cloud';
  var MAX_BYTES = 900000; // a Firestore document holds up to 1 MiB, counted in UTF-8 bytes
  // sync 8 s after a change, at most every 30 s; a playing video saves its place every 10 s, so a change of
  // place alone waits up to 5 minutes (or until the tab is hidden). This keeps many learners within the free daily quota.
  var SOON = 8000, GAP = 30000, SLOW = 300000;
  var fb = null, user = null, loading = null, timer = null, suppress = false, busy = false, again = false, justSignedIn = false, deleting = false, leaving = false;
  var inflight = null, lastTry = 0, syncedSig = null, loose = false;
  var info = { state: 'off', user: null, lastSync: 0, error: '' };
  var subs = [];

  function enabled() {
    return !!(CFG && CFG.apiKey && CFG.projectId && CFG.authDomain) && !window.AIM_PREVIEW && /^https?:$/.test(location.protocol);
  }
  function emit() { subs.forEach(function (fn) { try { fn(status()); } catch (e) {} }); }
  function set(st, err) { info.state = st; info.error = err || ''; emit(); }
  function flag(on) { try { if (on) localStorage.setItem(FLAG, '1'); else localStorage.removeItem(FLAG); } catch (e) {} }
  function flagged() { try { return localStorage.getItem(FLAG) === '1'; } catch (e) { return false; } }
  function status() { return { enabled: enabled(), state: info.state, user: info.user, lastSync: info.lastSync, error: info.error, trimmed: info.trimmed || 0 }; }

  // Firebase app + auth only (about 65 KB compressed), loaded on demand
  function load() {
    if (loading) return loading;
    set('loading');
    loading = Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js')]).then(function (m) {
      var appMod = m[0], authMod = m[1];
      var app = appMod.initializeApp(CFG);
      var auth = authMod.getAuth(app);
      fb = { auth: auth, A: authMod, app: app };
      return new Promise(function (resolve) {
        var first = true;
        authMod.onAuthStateChanged(auth, function (u) {
          user = u || null; syncedSig = null;
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
    if (code === 'auth/web-storage-unsupported') return 'This browser is blocking the storage that sign-in needs (common in private windows). Try a normal window, or allow cookies for this site.';
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

  // wait for a sync that is already running
  function settle() { return inflight ? inflight.then(function () {}, function () {}) : Promise.resolve(); }

  // noUpload: after deleting the cloud copy, do not write it straight back
  var lastPushErr = null;
  function signOut(clearDevice, noUpload) {
    if (!fb || leaving || (deleting && !noUpload)) return Promise.resolve(false);
    leaving = true; clearTimeout(timer); timer = null;
    return settle().then(function () {
      // send the latest progress first, so nothing done on this device is lost
      return user && !noUpload ? push().then(function () { return true; }, function (e) { lastPushErr = e; return false; }) : true;
    }).then(function (saved) {
      if (clearDevice && !saved) {
        // never wipe progress that is not safely in the account yet
        leaving = false;
        var msg = 'Could not back up your latest progress, so nothing was removed and you are still signed in. ' + (lastPushErr && /too big/.test(String(lastPushErr.message)) ? 'Your progress is too large for the free cloud copy: download a copy from My progress first.' : 'Check your connection and try again.');
        set('signed-in', msg); C.toast(msg);
        return false;
      }
      return fb.A.signOut(fb.auth).then(function () {
        leaving = false; flag(false);
        info.lastSync = 0; syncedSig = null;
        if (clearDevice) { suppress = true; C.resetAll(); suppress = false; window.dispatchEvent(new CustomEvent('aim:progress-replaced', { detail: { cleared: true } })); }
        C.toast(clearDevice ? 'Signed out. Progress removed from this device; it is safe in your account.' : 'Signed out. Your progress stays on this device too.');
        return true;
      });
    }).then(null, function (e) { leaving = false; throw e; });
  }

  function docUrl(u) {
    return 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(CFG.projectId) + '/databases/(default)/documents/progress/' + encodeURIComponent(u.uid);
  }
  function call(method, body, query) {
    var u = user;
    if (!u) return Promise.reject(new Error('signed out'));
    return u.getIdToken().then(function (token) {
      return fetch(docUrl(u) + (query || ''), {
        method: method, cache: 'no-store',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      });
    });
  }
  // the cloud copy: parsed progress (or null), the exact text, and when it was last written
  function pull() {
    return call('GET').then(function (r) {
      if (r.status === 404) return { state: null, raw: '', time: '', exists: false };
      if (!r.ok) throw new Error('read ' + r.status);
      return r.json().then(function (j) {
        var s = (j && j.fields && j.fields.state && j.fields.state.stringValue) || '', st = null;
        if (s) { try { st = JSON.parse(s); } catch (e) { st = null; } }
        return { state: st, raw: s, time: (j && j.updateTime) || '', exists: true };
      });
    });
  }
  function bytes(s) { try { return new TextEncoder().encode(s).length; } catch (e) { return s.length * 3; } }
  // the cloud copy must stay under the free document size; when it would not, leave out (in this order) code drafts,
  // deletion markers, old review-log days and the oldest journal entries and focus sessions. They stay in this browser.
  function encode(state) {
    var s = JSON.stringify(state), fits = function (x) { return x.length * 3 <= MAX_BYTES || bytes(x) <= MAX_BYTES; };
    info.trimmed = 0;
    if (fits(s)) return s;
    var lite = JSON.parse(s);
    var dropTombs = function (o) { Object.keys(o || {}).forEach(function (k) { if (o[k] && o[k].del) delete o[k]; }); };
    var newest = function (o, n) { var ks = Object.keys(o || {}).sort(function (x, y) { return String(o[y].at).localeCompare(String(o[x].at)); }); ks.slice(n).forEach(function (k) { delete o[k]; }); return Math.max(0, ks.length - n); };
    var steps = [
      function () { lite.code = {}; },
      function () { dropTombs(lite.jr); dropTombs(lite.fs); },
      function () { var ks = Object.keys(lite.rlog || {}).sort(); ks.slice(0, Math.max(0, ks.length - 120)).forEach(function (k) { delete lite.rlog[k]; }); },
      function () { info.trimmed += newest(lite.fs, 200); }
    ];
    for (var i = 0; i < steps.length; i++) { steps[i](); s = JSON.stringify(lite); if (fits(s)) return s; }
    // then the journal, oldest entries first, keeping as many as fit
    var keys = Object.keys(lite.jr || {}).sort(function (x, y) { return String(lite.jr[y].at).localeCompare(String(lite.jr[x].at)); });
    var all = lite.jr, lo = 0, hi = keys.length;
    while (lo < hi) { var mid = Math.ceil((lo + hi) / 2), part = {}; keys.slice(0, mid).forEach(function (k) { part[k] = all[k]; }); lite.jr = part; if (fits(JSON.stringify(lite))) lo = mid; else hi = mid - 1; }
    var keep = {}; keys.slice(0, lo).forEach(function (k) { keep[k] = all[k]; }); lite.jr = keep; info.trimmed += keys.length - lo;
    s = JSON.stringify(lite);
    if (fits(s)) return s;
    throw new Error('too big');
  }
  // resolves 0 when written, or the HTTP status when another device changed the copy since it was read
  function write(s, remote, strict) {
    var q = !strict ? '' : remote.time ? '?currentDocument.updateTime=' + encodeURIComponent(remote.time) : remote.exists ? '' : '?currentDocument.exists=false';
    var body = { fields: { state: { stringValue: s }, v: { integerValue: '1' }, updatedAt: { timestampValue: new Date().toISOString() } } };
    return call('PATCH', body, q).then(function (r) {
      if (r.ok) return 0;
      if (q && (r.status === 409 || r.status === 404)) return r.status;
      if (q && r.status === 400) return r.text().then(function (t) { if (/FAILED_PRECONDITION/.test(t)) return 400; throw new Error('write 400'); });
      throw new Error('write ' + r.status);
    });
  }
  // what a sync would send, leaving out where videos were stopped
  function sig(s) { try { return JSON.stringify(s, function (k, v) { return this === s && k === 'pos' ? undefined : v; }); } catch (e) { return ''; } }
  // copy merged progress into the live progress object, so open pages and labs that hold parts of it keep working
  function assign(dst, src) {
    Object.keys(dst).forEach(function (k) { if (!Object.prototype.hasOwnProperty.call(src, k)) delete dst[k]; });
    Object.keys(src).forEach(function (k) {
      var x = dst[k], y = src[k];
      if (x && y && typeof x === 'object' && typeof y === 'object' && !Array.isArray(x) && !Array.isArray(y)) assign(x, y);
      else dst[k] = y;
    });
  }
  function adopt(merged) {
    suppress = true;
    try { assign(C.state, merged); C.save(); } finally { suppress = false; }
    window.dispatchEvent(new CustomEvent('aim:progress-replaced'));
  }
  // read the cloud copy, merge it into this device, write the result back if it differs
  function push(tries) {
    var who = user, n = tries || 0;
    return pull().then(function (remote) {
      if (!user || user !== who) throw new Error('signed out');
      if (remote.state) {
        var merged = C.mergeState(C.state, remote.state);
        if (JSON.stringify(merged) !== JSON.stringify(C.state)) adopt(merged);
      }
      var s = encode(C.state), g = sig(C.state);
      if (s === remote.raw) { syncedSig = g; return; }
      return write(s, remote, !loose && n < 2).then(function (code) {
        if (!code) { syncedSig = g; return; }
        // another device wrote in between: read again and merge; after two tries write without the condition
        if (n >= 1) loose = true;
        return push(n + 1);
      });
    });
  }
  function explain(e) {
    var m = String(e && e.message || e);
    if (/\b403\b/.test(m)) return 'The cloud copy refused this account. The site owner must publish the Firestore security rules from the README.';
    if (/write 404/.test(m)) return 'The cloud database is not set up yet. The site owner must create the Firestore database (README, "Turn on sign-in").';
    if (/\b429\b/.test(m)) return 'The cloud is busy or its free daily limit is used up. Your progress is saved on this device and will sync later.';
    if (/too big/.test(m)) return 'Your saved progress is too large for the free cloud copy (about 900 KB), so syncing has stopped. Download a copy from My progress, then shorten or delete long notes, journal entries or explanations.';
    if (/Failed to fetch|NetworkError|Load failed/i.test(m) || navigator.onLine === false) return 'Offline: your progress is saved on this device and will sync when you are back online.';
    return 'Could not sync just now (' + m + '). It will try again.';
  }
  function sync(reason) {
    if (!user || !enabled() || deleting || leaving) return Promise.resolve(false);
    if (busy) { again = true; return Promise.resolve(false); }
    clearTimeout(timer); timer = null;
    busy = true; lastTry = Date.now(); set('syncing');
    var who = user;
    inflight = push().then(function () {
      if (user !== who) return false;
      info.lastSync = Date.now(); set('signed-in');
      if (reason === 'sign-in') C.toast('Signed in. Your progress is backed up and synced.');
      return true;
    }, function (e) {
      if (user !== who) return false; // signed out meanwhile: nothing to report
      set('signed-in', explain(e));
      return false;
    }).then(function (ok) {
      busy = false; inflight = null;
      if (again) { again = false; if (user && !leaving && !deleting) schedule(1500); }
      return ok;
    });
    return inflight;
  }
  function schedule(ms) { clearTimeout(timer); timer = setTimeout(function () { timer = null; sync('save'); }, ms); }

  C.onSave(function (s) {
    if (!user || suppress || leaving || deleting) return;
    var minor = syncedSig !== null && sig(s) === syncedSig; // only a video's place changed since the last sync
    schedule(Math.max(SOON, lastTry + (minor ? SLOW : GAP) - Date.now()));
  });
  document.addEventListener('visibilitychange', function () {
    if (!user) return;
    if (document.visibilityState === 'hidden') { if (timer) sync('hide'); }
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
    // load sign-in ahead of the press: browsers (Safari above all) block a pop-up opened long after the click
    prepare: function () { if (enabled() && !fb && !loading) load().catch(function () {}); },
    syncNow: function () { return sync('manual'); },
    // the Firebase app (for the optional Gemini helper in study.js), once sign-in has loaded
    app: function () { return fb ? fb.app : null; },
    SDK: SDK,
    deleteCloudCopy: function () {
      if (!user || deleting || leaving) return Promise.resolve(false);
      clearTimeout(timer); timer = null;
      deleting = true;
      // let a running sync finish first, or its write would bring the copy back
      return settle().then(function () { return call('DELETE'); }).then(function (r) {
        if (!r.ok && r.status !== 404) throw new Error('delete ' + r.status);
        return signOut(false, true);
      }).then(function () { deleting = false; C.toast('Your cloud copy is deleted and you are signed out.'); return true; }, function (e) { deleting = false; throw e; });
    },
    on: function (fn) { subs.push(fn); return function () { subs = subs.filter(function (x) { return x !== fn; }); }; }
  };
})();
