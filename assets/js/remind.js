/* AI Marg study reminders: the Reminders page (#reminders) and the small check that keeps reminders working.
   Phone notifications are standard Web Push. This page asks for permission (only after a tap), registers sw.js and
   sends the browser's notification address with the chosen time to the reminder service (a Cloudflare Worker, see
   reminders/README.md), which sends the reminders. A calendar reminder (a Google Calendar link or an .ics file) works on
   any phone without any of that.
   app.js loads this file for #reminders, and about 3 s after any page loads while reminders are on in this browser.
   This browser's settings live in localStorage 'aimarg.remind' (never synced): { on, endpoint, time, days, open, skip,
   tz, url, key, savedAt, next, activeSent }, and stopped: true once the browser has dropped them.
   Plain ES5, like the rest of the site; every browser feature is checked before it is used. */

// The reminder service's address (its workers.dev address, no slash at the end). The site owner's Deploy to Cloudflare
// gives it (see README.md, "Reminder service"); it goes here in place of the placeholder. The page asks the service for
// its public key when reminders are turned on (GET /v1/key); a key given here as well (tests) is used instead. While the
// address is the placeholder, the page offers only the calendar reminder.
window.AIM_REMIND = window.AIM_REMIND || { url: 'REMINDERS_URL' };

(function () {
  'use strict';
  if (window.AIM_REMINDERS) return;
  var C = window.AIM_CORE, esc = C.esc;
  var CFG = window.AIM_REMIND || { url: '' };
  var KEY = 'aimarg.remind', WEEK = 7 * 864e5;
  var DAYS = [1, 2, 3, 4, 5, 6, 0]; // shown Monday first; stored as in JS getDay (0 = Sunday)
  var DNAME = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], DLONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'], MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var TITLE = 'AI Marg study time';
  var NET = 'Could not reach the reminder service. Check your connection and try again.';
  var noop = function () {};
  var app = function () { return window.AIM_APP; };

  /* ---------- small helpers ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function base() { var u = String(CFG.url || '').replace(/\/+$/, ''); return /^https?:\/\/[^\s\/]+/i.test(u) ? u : ''; }
  function b64u(s) {
    s = String(s).replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
    while (s.length % 4) s += '=';
    var bin = window.atob(s), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function b64uOf(buf) {
    var b = new Uint8Array(buf), s = '';
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return window.btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  // a public key (base64url) as bytes: a P-256 point (65 bytes starting with 4), or null
  function keyOf(k) { try { var b = b64u(typeof k === 'string' ? k : ''); return b.length === 65 && b[0] === 4 ? b : null; } catch (e) { return null; } }
  function configured() { return !!base(); }
  function zone() { try { var z = Intl.DateTimeFormat().resolvedOptions().timeZone; if (z && z.length <= 64) return z; } catch (e) {} return 'UTC'; }
  function today() { return C.today(); }
  function studiedToday() { var lg = C.state && C.state.log; return !!(lg && lg[today()] > 0); }
  function siteURL() { return location.protocol + '//' + location.host + location.pathname.replace(/[^\/]*$/, ''); }
  function within(p, ms) {
    return new Promise(function (resolve, reject) {
      var t = setTimeout(function () { reject(new Error('timeout')); }, ms);
      Promise.resolve(p).then(function (v) { clearTimeout(t); resolve(v); }, function (e) { clearTimeout(t); reject(e); });
    });
  }

  /* ---------- this browser's reminder settings ---------- */
  function load() { var r = null; try { r = JSON.parse(window.localStorage.getItem(KEY) || 'null'); } catch (e) { r = null; } return r && typeof r === 'object' ? r : null; }
  function store(r) { try { if (r) window.localStorage.setItem(KEY, JSON.stringify(r)); else window.localStorage.removeItem(KEY); return true; } catch (e) { return false; } }
  function okTime(t) { return typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t); }
  // "19:00", "7:00 pm", "07:00:00": the time as HH:MM, or null
  function parseTime(v) {
    var m = /^\s*(\d{1,2})[:.](\d{2})(?::\d{2}(?:\.\d+)?)?\s*(?:([ap])\.?\s*m\.?)?\s*$/i.exec(String(v || ''));
    if (!m) return null;
    var h = Number(m[1]), mi = Number(m[2]), ap = (m[3] || '').toLowerCase();
    if (mi > 59) return null;
    if (ap) { if (h < 1 || h > 12) return null; h = h % 12 + (ap === 'p' ? 12 : 0); } else if (h > 23) return null;
    return pad(h) + ':' + pad(mi);
  }
  function okDays(d) {
    if (!Array.isArray(d) || !d.length || d.length > 7) return null;
    var seen = {}, out = [];
    for (var i = 0; i < d.length; i++) { var x = d[i]; if (x !== Math.floor(x) || x < 0 || x > 6 || seen[x]) return null; seen[x] = 1; out.push(x); }
    return out.sort();
  }
  function defaults() {
    var p = C.state && C.state.prefs && C.state.prefs.play;
    return { time: '19:00', days: [0, 1, 2, 3, 4, 5, 6], open: p && p.start === 'play' ? 'play' : 'review', skip: true };
  }
  function settings(r) {
    var d = defaults(); r = r || {};
    return { time: okTime(r.time) ? r.time : d.time, days: okDays(r.days) || d.days, open: r.open === 'play' || r.open === 'review' ? r.open : d.open, skip: typeof r.skip === 'boolean' ? r.skip : d.skip };
  }

  /* ---------- words ---------- */
  // "7:00 pm" (a no-break space, so "pm" never starts a line on its own)
  function time12(t) { var h = Number(t.slice(0, 2)); return (h % 12 || 12) + ':' + t.slice(3, 5) + (h < 12 ? '\u00a0am' : '\u00a0pm'); }
  function joinAnd(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  function daysText(days) { return days.length === 7 ? 'every day' : joinAnd(DAYS.filter(function (d) { return days.indexOf(d) >= 0; }).map(function (d) { return DNAME[d]; })); }
  function whenText(s) { return daysText(s.days) + ' at ' + time12(s.time); }
  // the next reminder in this device's time: the first chosen day and time after now
  function nextLocal(s) {
    var now = new Date(), h = Number(s.time.slice(0, 2)), m = Number(s.time.slice(3, 5));
    for (var i = 0; i < 8; i++) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, h, m);
      if (d.getTime() > now.getTime() && s.days.indexOf(d.getDay()) >= 0) return d.getTime();
    }
    return 0;
  }
  // "Today at 7:00 pm", "Tomorrow at 7:00 pm", "Fri at 7:00 pm"
  function nextText(ms) {
    var d = new Date(ms), t0 = new Date(); t0.setHours(0, 0, 0, 0);
    var n = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - t0.getTime()) / 864e5);
    var day = n <= 0 ? 'Today' : n === 1 ? 'Tomorrow' : n < 7 ? DNAME[d.getDay()] : DNAME[d.getDay()] + ' ' + d.getDate() + ' ' + MONTH[d.getMonth()];
    return day + ' at ' + time12(pad(d.getHours()) + ':' + pad(d.getMinutes()));
  }

  /* ---------- what this browser can do ---------- */
  function supported() { var n = window.navigator; return !!(n && n.serviceWorker && window.PushManager && window.Notification); }
  function perm() { try { return window.Notification ? String(window.Notification.permission) : 'default'; } catch (e) { return 'default'; } }
  // iPhone and iPad (iPadOS says it is a Mac, but a Mac has no touch screen)
  function apple() { var n = window.navigator || {}, ua = n.userAgent || ''; return /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && (n.maxTouchPoints || 0) > 1); }
  function android() { return /Android/i.test((window.navigator || {}).userAgent || ''); }
  function standalone() {
    try { if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true; } catch (e) {}
    return (window.navigator || {}).standalone === true;
  }
  function registration() {
    try { return Promise.resolve(navigator.serviceWorker.getRegistration()).then(function (r) { return r || null; }, function () { return null; }); }
    catch (e) { return Promise.resolve(null); }
  }
  function currentSub() {
    return registration().then(function (reg) {
      if (!reg || !reg.pushManager) return null;
      return Promise.resolve(reg.pushManager.getSubscription()).then(function (s) { return s || null; }, function () { return null; });
    });
  }
  // the subscription was made with the service's key b (an old one, made with another key, cannot be used)
  function sameKey(sub, b) {
    try {
      var k = sub.options && sub.options.applicationServerKey; if (!k) return true; // the browser does not say: keep it
      var a = new Uint8Array(k); if (!b || a.length !== b.length) return false;
      for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
      return true;
    } catch (e) { return true; }
  }

  /* ---------- the reminder service ---------- */
  // the service's public key as bytes, for pushManager.subscribe: the one given in window.AIM_REMIND (tests), or the one
  // the service gives (GET /v1/key, a simple CORS request); rejects when the service is not reached or gives no usable key
  function serviceKey() {
    var given = keyOf(CFG.key);
    if (given) return Promise.resolve(given);
    if (!window.fetch || !base()) return Promise.reject(new Error('net'));
    return Promise.resolve().then(function () {
      return within(window.fetch(base() + '/v1/key', { method: 'GET', mode: 'cors', credentials: 'omit', cache: 'no-store' }), 20000);
    }).then(function (res) {
      return res.json().then(function (d) {
        var k = res.status === 200 && d && d.ok ? keyOf(d.key) : null;
        if (!k) throw new Error('key');
        return k;
      });
    });
  }
  // a simple CORS request (text/plain, no preflight); resolves { status, data }, rejects when the service is not reached
  function post(path, data) {
    if (!window.fetch || !base()) return Promise.reject(new Error('net'));
    return within(window.fetch(base() + path, { method: 'POST', mode: 'cors', credentials: 'omit', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify(data) }), 20000).then(function (res) {
      return res.json().then(function (d) { return { status: res.status, data: d }; }, function () { return { status: res.status, data: null }; });
    });
  }
  // a message sent while the page may be closing (navigator.sendBeacon, or fetch with keepalive); true once it is on its way
  function beacon(path, data) {
    var url = base() + path, body = JSON.stringify(data);
    if (!base()) return false;
    try { if (navigator.sendBeacon && navigator.sendBeacon(url, body)) return true; } catch (e) {}
    try {
      if (window.fetch) { window.fetch(url, { method: 'POST', mode: 'cors', credentials: 'omit', keepalive: true, headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: body }).then(null, noop); return true; }
    } catch (e) {}
    return false;
  }
  function subKeys(sub) {
    var j = {}; try { j = sub.toJSON ? sub.toJSON() : {}; } catch (e) { j = {}; }
    var k = j && j.keys ? j.keys : {};
    try { if (!k.p256dh && sub.getKey) k = { p256dh: b64uOf(sub.getKey('p256dh')), auth: b64uOf(sub.getKey('auth')) }; } catch (e) {}
    return { p256dh: k.p256dh, auth: k.auth };
  }
  function subBody(sub, s) {
    return { sub: { endpoint: sub.endpoint, keys: subKeys(sub) }, time: s.time, days: s.days.slice().sort(), tz: zone(), open: s.open, skip: !!s.skip, active: s.skip && studiedToday() ? today() : '' };
  }
  // the service's answer in plain words
  function why(res, test) {
    var e = res && res.data && res.data.error, st = res && res.status;
    if (st === 429) return test ? 'You sent several tests in the last hour. Please try again later.' : 'You changed your reminders many times in a short while. Please try again in an hour.';
    if (st === 503 || e === 'full') return 'The reminder service is full for now. Please use a calendar reminder below.';
    if (e === 'push-failed') { var c = Number(res.data.status); return 'The test could not be sent just now' + (c > 0 && c < 1000 ? ' (code ' + c + ')' : '') + '. Please try again in a few minutes.'; }
    if (st === 400) return 'The reminder service could not use these settings. Check the time and days, then try again.';
    return NET;
  }
  // after a save: this browser's copy of what the service now holds (key: the service's public key the address was made
  // with, kept from before when the save did not need it); false when this browser could not keep it (storage full or
  // blocked)
  function remember(sub, s, next, key) {
    var old = load();
    var r = { on: true, endpoint: sub.endpoint, time: s.time, days: s.days.slice().sort(), open: s.open, skip: !!s.skip, tz: zone(), url: base(), key: key ? b64uOf(key) : old && typeof old.key === 'string' ? old.key : '', savedAt: Date.now(), next: Number(next) || 0, activeSent: s.skip && studiedToday() ? today() : '' };
    if (old && old.activeSent === today()) r.activeSent = today();
    return store(r) ? r : false;
  }

  /* ---------- keeping reminders working (on every page while they are on) ---------- */
  var booted = false, resaving = false;
  // the Reminders card on My progress, if that page is open, drawn again in place (no new page, no focus move)
  function progressCard() {
    var el = document.getElementById('prog-remind'), A = app();
    if (!el || !A || !A.remindCard) return;
    try {
      var html = A.remindCard();
      if (html === el.outerHTML) return; // nothing changed: leave it (and the keyboard focus) alone
      var had = el.contains(document.activeElement);
      el.outerHTML = html;
      var a = had && document.querySelector('#prog-remind a');
      if (a) a.focus();
    } catch (e) {}
  }
  // the browser still has the notification address and allows notifications: send the settings again when the address
  // changed, the time zone changed, the service moved, or a week has passed (so the service never forgets an active
  // learner). When the address is gone or notifications are no longer allowed, the reminders are marked stopped, the
  // service is told to forget this device, and nothing asks the learner anything. Once stopped they stay stopped, even if
  // the browser allows notifications again later: the service no longer has this device, so only Turn back on (a tap,
  // which sends the settings again) starts them.
  function check() {
    var r = load();
    if (!r || !r.on || !configured() || !supported()) return Promise.resolve(null);
    var granted = perm() === 'granted';
    return (granted ? currentSub() : Promise.resolve(null)).then(function (sub) {
      r = load(); if (!r || !r.on) return null;
      if (!sub) {
        if (!r.stopped) { r.stopped = true; store(r); if (r.endpoint) beacon('/v1/unsubscribe', { endpoint: r.endpoint }); progressCard(); }
        return null;
      }
      if (r.stopped) return null;
      var stale = sub.endpoint !== r.endpoint || !(Date.now() - (Number(r.savedAt) || 0) < WEEK) || r.tz !== zone() || r.url !== base();
      if (!stale || resaving) return sub;
      resaving = true;
      return post('/v1/subscribe', subBody(sub, settings(r))).then(function (res) {
        resaving = false;
        var cur = load();
        if (res.status === 200 && res.data && res.data.ok && cur && cur.on) { remember(sub, settings(cur), res.data.next); progressCard(); }
        return sub;
      }, function () { resaving = false; return sub; }); // tried again on a later page
    }, function () { return null; });
  }
  // "I studied today" for the service, once a day, when the learner chose to skip days they have studied
  function pingActive() {
    var r = load(), t = today();
    if (!r || !r.on || r.stopped || !r.skip || !r.endpoint || r.activeSent === t || !studiedToday() || !configured()) return false;
    if (!beacon('/v1/active', { endpoint: r.endpoint, day: t })) return false;
    r.activeSent = t; store(r);
    return true;
  }
  // a reminder tapped in a browser that could not move this page: sw.js sends the address instead
  function listen() {
    try {
      if (!navigator.serviceWorker || !navigator.serviceWorker.addEventListener) return;
      navigator.serviceWorker.addEventListener('message', function (ev) {
        var d = ev && ev.data, u = d && typeof d.url === 'string' ? d.url : '', i = u.indexOf('#');
        if (!d || d.type !== 'aimarg-open' || i < 0 || u.slice(0, i).replace(/index\.html$/, '') !== siteURL()) return;
        if (location.hash !== u.slice(i)) location.hash = u.slice(i + 1);
      });
    } catch (e) {}
  }
  function boot() {
    if (booted) return;
    booted = true;
    listen();
    check().then(function () { pingActive(); }, function () { pingActive(); });
  }
  C.onSave(function () { pingActive(); });

  /* ---------- the page ---------- */
  var CSS = '.rm-fields{gap:18px}.rm-time input{font:inherit;color:var(--ink);background:var(--surface);border:1px solid var(--field-line);border-radius:var(--radius-sm);padding:8px 10px;min-height:44px;width:11rem;max-width:100%}' +
    // days: 4 to a row on phones (4 + 3) and 7 from 500 px, each at least 44 px; with large text the buttons keep
    // room for their names (3.2em) and wrap to more rows (old browsers without max() keep the plain 4 or 7 columns)
    '.rm-label,.rm-open legend{font-size:.92rem;font-weight:600}.rm-days{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-template-columns:repeat(auto-fill,minmax(max(44px,3.2em,25% - 6px),1fr));gap:6px;max-width:460px}' +
    '@media (min-width:500px){.rm-days{grid-template-columns:repeat(7,minmax(0,1fr));grid-template-columns:repeat(auto-fill,minmax(max(44px,3.2em,(100% - 36px) / 7 - 1px),1fr))}}' +
    '.rm-days .btn{padding:8px 2px;min-height:44px;min-width:0}.rm-day[aria-pressed="true"]{background:var(--indigo);border-color:var(--indigo);color:var(--on-indigo)}' +
    '.rm-open{border:0;margin:0;padding:0;min-width:0;display:flex;flex-direction:column;gap:2px}.rm-open legend{padding:0;margin-bottom:4px}' +
    '.rm-opt{display:flex;align-items:center;gap:10px;min-height:44px}.rm-opt input{flex:none;margin:0}' +
    '.rm-steps{margin:0;padding-left:1.4em}.rm-steps li+li{margin-top:.4em}#rm-cal-fields:empty{display:none}' +
    // an empty message line takes no room, but stays in place for screen readers (a hidden live region is not read)
    '.rm-live:empty{position:absolute;width:1px;height:1px;margin:0;overflow:hidden;clip:rect(0 0 0 0)}';
  function css() {
    if (document.getElementById('rm-css')) return;
    var s = document.createElement('style'); s.id = 'rm-css'; s.textContent = CSS; document.head.appendChild(s);
  }
  function opt(v, label, cur) { return '<label class="rm-opt"><input type="radio" name="rm-open" value="' + v + '"' + (v === cur ? ' checked' : '') + '><span>' + label + '</span></label>'; }
  // time and days (and, for phone notifications, which page to open and whether to skip studied days)
  function fieldsHTML(s, phone) {
    var h = '<div class="rm-fields stack" id="rm-fields">' +
      '<div class="control rm-time"><label for="rm-time">Time</label><input type="time" id="rm-time" value="' + esc(s.time) + '" step="60" required></div>' +
      '<div class="stack-sm"><span class="rm-label" id="rm-days-l">Days</span><div class="rm-days" role="group" aria-labelledby="rm-days-l">' +
      DAYS.map(function (d) { return '<button type="button" class="btn rm-day" data-day="' + d + '" aria-pressed="' + (s.days.indexOf(d) >= 0) + '" aria-label="' + DLONG[d] + '">' + DNAME[d] + '</button>'; }).join('') + '</div>' +
      // a message about the days shows right under them (the card's own message line can be off screen on a phone)
      '<p class="small rm-live" id="rm-days-live" role="status" aria-live="polite"></p></div>';
    if (phone) {
      h += '<fieldset class="rm-open"><legend>When I tap the reminder, open</legend>' + opt('review', 'Daily review', s.open) + opt('play', 'Play mode', s.open) + '</fieldset>' +
        '<label class="rm-opt"><input type="checkbox" id="rm-skip"' + (s.skip ? ' checked' : '') + '><span>Skip days when I have already studied</span></label>';
    }
    return h + '</div>';
  }
  // the form's settings, or null (with a message) when the time or days are missing
  function readFields(quiet, where) {
    var t = document.getElementById('rm-time'), v = parseTime(t && t.value);
    if (!v) { if (!quiet) { say('Choose a time for the reminder first.', true, where); if (t) t.focus(); } return null; }
    var days = [];
    Array.prototype.forEach.call(document.querySelectorAll('#rm-page .rm-day[aria-pressed="true"]'), function (b) { days.push(Number(b.getAttribute('data-day'))); });
    if (!days.length) { if (!quiet) say('Choose at least one day.', true, 'rm-days-live'); return null; }
    var o = document.querySelector('#rm-page input[name="rm-open"]:checked'), sk = document.getElementById('rm-skip'), st = settings(load());
    return { time: v, days: days.sort(), open: o ? o.value : st.open, skip: sk ? !!sk.checked : st.skip };
  }
  function homeScreenGuide() {
    var K = window.AIM_CLOUD, signIn = K && K.enabled && K.enabled();
    // newer Safari (iOS 26) keeps Share behind the ••• button, and its Add screen has an "Open as Web App" switch
    return '<p>On iPhone and iPad, notifications work once AI Marg is on your Home Screen.</p>' +
      // an app's own browser (Instagram, Facebook) has no Add to Home Screen
      '<p class="small muted">If you opened this link inside another app (such as Instagram or Facebook), open it in Safari first: tap the app\'s ••• menu and choose <strong>Open in Safari</strong> or <strong>Open in external browser</strong>.</p>' +
      '<ol class="rm-steps"><li><strong>Safari:</strong> tap Share (if you don\'t see it, tap the ••• button first), then <strong>Add to Home Screen</strong>. If you see <strong>Open as Web App</strong>, keep it switched on.</li>' +
      '<li><strong>Chrome on iPhone:</strong> tap Share, then <strong>Add to Home Screen</strong>.</li>' +
      '<li>Open AI Marg from its new icon, then go to <strong>My progress</strong> and tap <strong>Set up reminders</strong>.</li></ol>' +
      '<p class="small muted">This needs iOS 16.4 or newer. Progress on the Home Screen app is separate from Safari. ' +
      (signIn ? '<a href="#account">Sign in</a> to bring your progress along.' : 'To bring your progress along, use the Backup box on <a href="#progress">My progress</a>.') + '</p>';
  }
  // how to allow notifications again, for this device (the Home Screen app on iPhone has no address bar)
  function allowHelp() {
    if (apple()) return '<p>To allow them on iPhone or iPad: open <strong>Settings</strong>, then <strong>Notifications</strong>, then <strong>AI Marg</strong>, and turn on <strong>Allow Notifications</strong>.</p>';
    return '<p>To allow them in Chrome on Android:</p><ol class="rm-steps">' +
      '<li>Tap the icon to the left of the web address.</li>' +
      '<li>Tap <strong>Permissions</strong>, then <strong>Notifications</strong>, and choose <strong>Allow</strong>.</li>' +
      '<li>In your phone\'s <strong>Settings</strong>, open <strong>Apps</strong>, then <strong>Chrome</strong>, then <strong>Notifications</strong>, and turn them on.</li></ol>' +
      '<p class="small muted">In other browsers, open this site\'s settings and allow notifications.</p>';
  }
  // why the reminders stopped (p: the permission now; sub: the browser has a notification address again)
  function stoppedHTML(p, sub) {
    return '<p id="rm-status" tabindex="-1"><strong>Reminders stopped on this device.</strong></p>' +
      (p === 'denied' ? '<p>Notifications for AI Marg are blocked in this browser now.</p>' + allowHelp() + '<p>When they are allowed, press <strong>Turn back on</strong>.</p>'
        : p !== 'granted' ? '<p>This browser no longer allows notifications from AI Marg. Press <strong>Turn back on</strong> to start them again.</p>'
        : sub ? '<p>This browser allows notifications from AI Marg again. Press <strong>Turn back on</strong> to start the reminders again.</p>'
        : '<p>This browser has lost its notification address for AI Marg. This can happen after site data is cleared. Press <strong>Turn back on</strong> to start them again.</p>');
  }
  function onHTML(r) {
    var s = settings(r), nx = Number(r.next) > Date.now() ? Number(r.next) : nextLocal(s);
    return '<p id="rm-status" tabindex="-1"><strong>Reminders are on: ' + esc(whenText(s)) + '.</strong></p>' +
      (nx ? '<p id="rm-next">Next reminder: ' + esc(nextText(nx)) + '.</p>' : '') +
      '<p class="small muted">To change the time or days, edit them below and press Save changes.</p>';
  }
  function act(btns) { return btns.join(''); }
  var B_ON = '<button type="button" class="btn btn-primary" data-rm="on">Turn on reminders</button>';
  var B_BACK = '<button type="button" class="btn btn-primary" data-rm="on">Turn back on</button>';
  var B_SAVE = '<button type="button" class="btn btn-primary" data-rm="save">Save changes</button>';
  var B_TEST = '<button type="button" class="btn" data-rm="test">Send a test</button>';
  var B_OFF = '<button type="button" class="btn btn-ghost" data-rm="off">Turn off</button>';
  // the Phone notifications card as far as it is known without waiting: notset, unsupported, blocked, off, or local-on
  // (on or stopped, which getSubscription decides)
  function quickState() {
    if (!configured()) return 'notset';
    if (!supported()) return 'unsupported';
    var r = load();
    if (r && r.on) return 'local-on';
    return perm() === 'denied' ? 'blocked' : 'off';
  }
  var drawN = 0;
  function view() {
    var A = app(); css();
    var calFirst = apple() ? 'ics' : 'gcal', st0 = quickState();
    // the fixes for phone notifications, only where this browser can have them (not with the calendar alone)
    var helpHTML = st0 === 'notset' || st0 === 'unsupported' ? '' : '<details class="fold" id="rm-help"><summary>If reminders don\'t arrive</summary><div class="stack-sm small">' +
        '<p>Reminders usually just work. If one does not come, these fixes help. You do not need them to get started.</p>' +
        '<p><strong>Android phones that save battery:</strong> let Chrome run in the background, with no battery limit and with Autostart on where your phone has it. The names differ a little from phone to phone.</p>' +
        '<ul class="rm-steps">' +
          '<li><strong>Xiaomi, Redmi or POCO:</strong> Settings, Apps, Manage apps, Chrome. Turn on Autostart, and set Battery saver to No restrictions.</li>' +
          '<li><strong>Vivo or iQOO:</strong> Settings, Battery, Background power consumption management, Chrome: allow it. Also turn on Autostart for Chrome (Settings, Apps, Autostart).</li>' +
          '<li><strong>Oppo or Realme:</strong> Settings, Apps, App management, Chrome, Battery usage. Allow background activity and auto launch.</li>' +
          '<li><strong>OnePlus:</strong> Settings, Battery, Battery optimisation, Chrome: Don\'t optimise. On newer phones: Settings, Apps, Chrome, Battery usage, Allow background activity.</li>' +
          '<li><strong>Samsung:</strong> Settings, Apps, Chrome, Battery: Unrestricted. Also check that Chrome is not in Sleeping apps or Deep sleeping apps (Settings, Battery, Background usage limits).</li></ul>' +
        '<p><strong>Chrome\'s notifications:</strong> in your phone\'s Settings, Apps, Chrome, Notifications, keep them on.</p>' +
        '<p><strong>Cleaner apps:</strong> don\'t let cleaner or booster apps close Chrome.</p>' +
        '<p><strong>iPhone and iPad:</strong> open AI Marg from its Home Screen icon, not from Safari.</p>' +
        '<p>When reminders are on, press <strong>Send a test</strong> to check.</p></div></details>';
    var gcal = '<a class="btn" id="rm-gcal" href="https://calendar.google.com/calendar/render?action=TEMPLATE" target="_blank" rel="noopener" data-rm="gcal">Add to Google Calendar<span class="visually-hidden"> (opens in a new tab)</span></a>';
    var ics = '<button type="button" class="btn" data-rm="ics" id="rm-ics">Download calendar file (.ics)</button>';
    A.setView('<div class="wrap stack-lg rm-page" id="rm-page" style="max-width:760px">' + A.crumbs([['Home', 'home'], ['My progress', 'progress'], ['Reminders']]) +
      '<header class="stack-sm"><h1>Reminders</h1><p class="lede muted prose">Get a gentle reminder at a time you choose. Missing a day costs nothing.</p></header>' +
      '<section class="card stack" id="rm-phone" aria-labelledby="rm-phone-h"><h2 class="h-sub" id="rm-phone-h" tabindex="-1">Phone notifications</h2>' +
        '<div class="stack" id="rm-phone-body"></div><p class="small rm-live" id="rm-live" role="status" aria-live="polite"></p></section>' +
      '<section class="card stack" id="rm-cal" aria-labelledby="rm-cal-h"><h2 class="h-sub" id="rm-cal-h">Calendar reminder</h2>' +
        '<p>Works on any phone, even without notifications. Your calendar app reminds you.</p><div id="rm-cal-fields"></div>' +
        '<p class="small muted" id="rm-cal-when"></p><div class="row" id="rm-cal-btns">' + (calFirst === 'ics' ? ics + gcal : gcal + ics) + '</div>' +
        '<p class="small muted">The calendar file works with the iPhone Calendar, Outlook and most other calendar apps.</p>' +
        '<p class="small rm-live" id="rm-cal-live" role="status" aria-live="polite"></p></section>' +
      helpHTML +
      '<section class="stack-sm" id="rm-stored" aria-labelledby="rm-stored-h"><h2 class="h-sub" id="rm-stored-h">What is stored</h2>' +
        '<p class="prose">When phone notifications are on, our reminder service (it runs on Cloudflare) keeps this device\'s notification address, your chosen time, days and time zone, which page to open, and the last day you studied, as this browser knows it. No name, email or Google account. Turn off deletes it. The calendar reminder stores nothing with us.</p>' +
        '<p class="prose small muted">It also keeps whether to skip days you have studied, and when it last tried to send you a reminder or skipped one because you had studied. To run the schedule it keeps when you turned reminders on and last saved them, when your next reminder is due, and how many sends failed and tests you sent. This browser keeps its own copy of your reminder settings; it is not part of your synced progress. To stop misuse, the service also counts requests by a code made from your internet address, deleted within a few hours.</p></section>' +
      '</div>', 'Reminders');
    draw();
  }
  // the Phone notifications card (and where the time and days are asked), checked afresh each time
  function draw(after) {
    var body = document.getElementById('rm-phone-body'), cf = document.getElementById('rm-cal-fields');
    if (!body || !cf) return;
    // the time and days already on the page (chosen but not saved yet) stay when the card is drawn again
    var keep = readFields(true), n = ++drawN, st = quickState(), r = load(), s = keep || settings(r && r.on ? r : null), form = st === 'off' || st === 'local-on';
    var sum = '', btns = [];
    if (st === 'notset') sum = '<p>Phone notifications are not switched on for this site yet.</p><p class="small muted">You can still get a reminder from your calendar: see Calendar reminder below.</p>';
    else if (st === 'unsupported') {
      sum = apple() && !standalone() ? homeScreenGuide()
        : apple() ? '<p>This iPhone or iPad can\'t show website notifications yet. They need iOS 16.4 or newer.</p><p class="small muted">Use a calendar reminder below.</p>'
        : '<p>This browser can\'t show website notifications. Use a calendar reminder below.</p>' +
          // on Android this is most often an app's own browser (opened from Instagram, Facebook or WhatsApp): Chrome can
          (android() ? '<p class="small muted">To get phone notifications, open this page in Chrome: in the app\'s menu (⋮ or •••), choose <strong>Open in Chrome</strong> or <strong>Open in browser</strong>.</p>' : '');
    } else if (st === 'blocked') {
      sum = '<p id="rm-status" tabindex="-1"><strong>Notifications for AI Marg are blocked in this browser.</strong></p>' + allowHelp() + '<p>Then come back to this page and press <strong>Check again</strong>.</p>';
      btns = ['<button type="button" class="btn" data-rm="recheck">Check again</button>'];
    } else if (st === 'off') {
      sum = '<p>Choose a time and days. Then press <strong>Turn on reminders</strong>. Your browser will ask if AI Marg may show notifications: choose <strong>Allow</strong>.</p>';
      btns = [B_ON];
    } else sum = '<p class="muted" role="status">Checking your reminders…</p>';
    body.removeAttribute('aria-busy');
    body.innerHTML = '<div class="stack-sm" id="rm-sum">' + sum + '</div>' + (form ? fieldsHTML(s, true) : '') + (btns.length || form ? '<div class="row" id="rm-act">' + act(btns) + '</div>' : '');
    cf.innerHTML = form ? '' : fieldsHTML(s, false);
    calUpdate();
    if (st !== 'local-on') { if (after) after(st); return; }
    // on, or stopped: the browser still has the notification address, and notifications are still allowed
    var p = perm();
    (p === 'granted' ? currentSub() : Promise.resolve(null)).then(function (sub) {
      var sm = document.getElementById('rm-sum'), ac = document.getElementById('rm-act'), cur = load();
      if (n !== drawN || !sm || !ac) return;
      if (!cur || !cur.on) return draw(after);
      if (sub && !cur.stopped) {
        sm.innerHTML = onHTML(cur); ac.innerHTML = act([B_SAVE, B_TEST, B_OFF]);
        if (after) after('on');
      } else {
        // stopped stays stopped until Turn back on: the service was told to forget this device
        if (!cur.stopped) { cur.stopped = true; store(cur); if (cur.endpoint) beacon('/v1/unsubscribe', { endpoint: cur.endpoint }); }
        sm.innerHTML = stoppedHTML(p, !!sub); ac.innerHTML = act([B_BACK, B_OFF]);
        if (after) after('stopped');
      }
    });
  }
  // a message read out by screen readers (a fresh one is read even when it repeats)
  var sayT = {};
  function say(msg, bad, where) {
    var id = where || 'rm-live', el = document.getElementById(id); if (!el) return;
    el.className = 'small rm-live' + (bad ? ' pub-bad' : '');
    el.textContent = '';
    clearTimeout(sayT[id]);
    sayT[id] = setTimeout(function () { el.textContent = msg || ''; }, 60);
  }
  function focusEl(id) { var el = document.getElementById(id); if (el) { try { el.focus({ preventScroll: false }); } catch (e) { el.focus(); } } }
  var busy = false;
  function setBusy(btn, label) {
    busy = true;
    var body = document.getElementById('rm-phone-body'); if (body) body.setAttribute('aria-busy', 'true');
    Array.prototype.forEach.call(document.querySelectorAll('#rm-phone [data-rm]'), function (b) { b.setAttribute('aria-disabled', 'true'); b.classList.add('is-disabled'); });
    if (btn && label) { btn.setAttribute('data-was', btn.textContent); btn.textContent = label; }
  }
  function clearBusy() {
    busy = false;
    var body = document.getElementById('rm-phone-body'); if (body) body.removeAttribute('aria-busy');
    Array.prototype.forEach.call(document.querySelectorAll('#rm-phone [data-rm]'), function (b) {
      b.removeAttribute('aria-disabled'); b.classList.remove('is-disabled');
      if (b.hasAttribute('data-was')) { b.textContent = b.getAttribute('data-was'); b.removeAttribute('data-was'); }
    });
  }
  function askPermission() {
    return new Promise(function (resolve) {
      var done = false, fin = function (p) { if (!done) { done = true; resolve(String(p || perm())); } };
      try {
        var r = window.Notification.requestPermission(fin); // older Safari answers only through the callback
        if (r && typeof r.then === 'function') r.then(fin, function () { fin(perm()); });
      } catch (e) { fin(perm()); }
    });
  }
  // register sw.js, make (or reuse) the notification address with the service's key and send it with the settings;
  // resolves { sub, next, key }
  function subscribe(s, key) {
    var sw = navigator.serviceWorker, made = null;
    return Promise.resolve().then(function () { return within(sw.register('sw.js', { scope: './' }), 20000); }).then(function () {
      return within(sw.ready, 20000); // pushManager.subscribe needs an active worker
    }).then(function (reg) {
      return Promise.resolve(reg.pushManager.getSubscription()).then(function (old) {
        if (old && sameKey(old, key)) return old;
        return (old ? Promise.resolve(old.unsubscribe()).then(null, noop) : Promise.resolve()).then(function () {
          return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
        });
      });
    }).then(function (sub) {
      made = sub;
      return post('/v1/subscribe', subBody(sub, s));
    }).then(function (res) {
      if (res.status === 200 && res.data && res.data.ok) return { sub: made, next: res.data.next, key: key };
      var e = new Error(why(res)); e.res = res; throw e;
    }).then(null, function (e) {
      // nothing is left half on: the browser forgets the address the service did not take
      if (made) { try { Promise.resolve(made.unsubscribe()).then(null, noop); } catch (x) {} }
      throw e;
    });
  }
  function turnOn(btn) {
    var s = readFields(false);
    if (!s) return;
    if (!configured() || !supported()) return draw();
    setBusy(btn, 'Turning on…');
    say('');
    // the service's key is asked for first, in the same tap; the browser's question about notifications is not held up
    // by it (iPhone and iPad only allow that question straight from a tap)
    var key = serviceKey();
    key.then(null, noop); // a failure is dealt with once notifications are allowed
    askPermission().then(function (p) { // asked here, inside the tap
      if (p === 'denied') {
        clearBusy();
        var r = load(); if (r && r.on) { r.stopped = true; store(r); }
        draw(function () { focusEl('rm-status'); say('Notifications are blocked for AI Marg in this browser. The steps above show how to allow them.', true); });
        return;
      }
      if (p !== 'granted') { clearBusy(); say('AI Marg can remind you only if you allow notifications. Press the button again when you are ready.', true); return; }
      return key.then(function (k) { return subscribe(s, k); }).then(function (x) {
        clearBusy();
        if (!remember(x.sub, s, x.next, x.key)) {
          // this browser could not keep the settings, so this page could neither show the reminders nor turn them off:
          // nothing is left on (the service forgets the address, the browser drops it)
          beacon('/v1/unsubscribe', { endpoint: x.sub.endpoint });
          try { Promise.resolve(x.sub.unsubscribe()).then(null, noop); } catch (e) {}
          say('This browser could not save your reminder settings, so reminders are still off. You can use a calendar reminder below.', true);
          return;
        }
        draw(function () { focusEl('rm-status'); });
      }, function (e) {
        clearBusy();
        if (perm() === 'denied') return draw(function () { focusEl('rm-status'); });
        say(e && e.res ? e.message : NET, true);
      });
    });
  }
  function saveChanges(btn) {
    var s = readFields(false);
    if (!s) return;
    setBusy(btn, 'Saving…');
    say('');
    currentSub().then(function (sub) {
      if (!sub || perm() !== 'granted') { clearBusy(); return draw(function () { focusEl('rm-status'); }); }
      return post('/v1/subscribe', subBody(sub, s)).then(function (res) {
        if (!(res.status === 200 && res.data && res.data.ok)) { clearBusy(); return say(why(res), true); }
        var r = remember(sub, s, res.data.next), sm = document.getElementById('rm-sum'), cur = load();
        if (!r && cur && cur.on) {
          // this browser kept only its old copy (and sends that one again each week), so the service goes back to it too;
          // the button stays busy until the service has answered
          var old = settings(cur), f = document.getElementById('rm-fields');
          if (f) f.outerHTML = fieldsHTML(old, true);
          calUpdate();
          if (sm) sm.innerHTML = onHTML(cur);
          var back = function (done) {
            clearBusy();
            say(done ? 'This browser could not save your change, so your reminders stay as they were: ' + whenText(old) + '.'
              : 'This browser could not save your change, and the reminder service could not be set back just now. Press Save changes again in a little while.', true);
          };
          return post('/v1/subscribe', subBody(sub, old)).then(function (r2) { back(r2.status === 200 && r2.data && r2.data.ok); }, function () { back(false); });
        }
        clearBusy();
        // the service has the new settings (shown as they are, if this browser has no copy of its own to go back to)
        r = r || { on: true, time: s.time, days: s.days, open: s.open, skip: s.skip, next: Number(res.data.next) || 0 };
        if (sm) sm.innerHTML = onHTML(r);
        say('Saved. Next reminder: ' + nextText(Number(r.next) > Date.now() ? r.next : nextLocal(s)) + '.');
      }, function () { clearBusy(); say(NET, true); });
    });
  }
  function sendTest(btn) {
    setBusy(btn, 'Sending…');
    say('');
    currentSub().then(function (sub) {
      if (!sub) { clearBusy(); return draw(function () { focusEl('rm-status'); }); }
      return post('/v1/test', { endpoint: sub.endpoint }).then(function (res) {
        clearBusy();
        var e = res.data && res.data.error;
        if (res.status === 200 && res.data && res.data.ok) return say('Test sent. It should arrive within a minute.');
        if (res.status === 404 || e === 'not-found') return say('The reminder service does not know this device yet. Press Save changes, then try the test again.', true);
        if (res.status === 410 || e === 'gone') {
          // the push service says this address no longer works: the reminders have stopped
          Promise.resolve(sub.unsubscribe()).then(null, noop);
          var r = load(); if (r) { r.stopped = true; store(r); }
          return draw(function () { focusEl('rm-status'); say('This device\'s notification address no longer works. Press Turn back on to make a new one.', true); });
        }
        say(why(res, true), true);
      }, function () { clearBusy(); say(NET, true); });
    });
  }
  function turnOff(btn) {
    setBusy(btn, 'Turning off…');
    say('');
    var r = load(), ep = r && r.endpoint;
    currentSub().then(function (sub) {
      var endpoint = sub ? sub.endpoint : ep;
      var told = endpoint ? post('/v1/unsubscribe', { endpoint: endpoint }).then(function (res) { return res.status === 200; }, function () { return false; }) : Promise.resolve(true);
      return told.then(function (ok) {
        // an address the service could not be told about still stops: the browser forgets it, so the service's next
        // reminder to it fails and the service deletes it then
        var gone = sub ? Promise.resolve(sub.unsubscribe()).then(null, noop) : Promise.resolve();
        if (ep && sub && ep !== sub.endpoint) beacon('/v1/unsubscribe', { endpoint: ep });
        return gone.then(function () {
          store(null);
          clearBusy();
          draw(function () {
            focusEl('rm-phone-h');
            say(ok ? 'Reminders are off. Our reminder service no longer keeps anything for this device.' : 'Reminders are off on this device. The reminder service will delete its copy the next time it tries to send one.');
          });
        });
      });
    });
  }

  /* ---------- the calendar reminder ---------- */
  function firstDay(days) { // today, or the next chosen day
    var d = new Date(); d.setHours(0, 0, 0, 0);
    for (var i = 0; i < 7 && days.indexOf(d.getDay()) < 0; i++) d.setDate(d.getDate() + 1);
    return d;
  }
  // the day d (a local date) at h:m as the calendar's local time YYYYMMDDTHHMMSS, worked out in UTC so that a daylight
  // saving change on that day cannot move it (the calendar app places it in the time zone itself)
  function stamp(d, h, m) { var u = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), h, m)); return u.getUTCFullYear() + pad(u.getUTCMonth() + 1) + pad(u.getUTCDate()) + 'T' + pad(u.getUTCHours()) + pad(u.getUTCMinutes()) + '00'; }
  function byday(days) { return DAYS.filter(function (d) { return days.indexOf(d) >= 0; }).map(function (d) { return BYDAY[d]; }).join(','); }
  // the first reminder's start and end (15 minutes later), as calendar times
  function startEnd(s) {
    var d = firstDay(s.days), h = Number(s.time.slice(0, 2)), m = Number(s.time.slice(3, 5));
    return [stamp(d, h, m), stamp(d, h, m + 15)];
  }
  function details() { return 'A short AI Marg study session. ' + siteURL(); }
  function gcalURL(s) {
    var se = startEnd(s), q = function (x) { return encodeURIComponent(x); };
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + q(TITLE) + '&dates=' + se[0] + '/' + se[1] +
      '&ctz=' + q(zone()) + '&recur=' + q('RRULE:FREQ=WEEKLY;BYDAY=' + byday(s.days)) + '&details=' + q(details());
  }
  function icsEsc(t) { return String(t).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
  function fold(line) { // lines of at most 75 characters; the rest continue on lines that start with a space
    if (line.length <= 75) return line;
    var out = line.slice(0, 75), rest = line.slice(75);
    while (rest.length) { out += '\r\n ' + rest.slice(0, 74); rest = rest.slice(74); }
    return out;
  }
  function icsText(s) {
    var now = new Date(), utc = now.getUTCFullYear() + pad(now.getUTCMonth() + 1) + pad(now.getUTCDate()) + 'T' + pad(now.getUTCHours()) + pad(now.getUTCMinutes()) + pad(now.getUTCSeconds()) + 'Z';
    var uid = 'aimarg-' + now.getTime().toString(36) + '-' + Math.floor(Math.random() * 1e9).toString(36) + '@' + (location.hostname || 'ai-marg');
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AI Marg//Study reminder//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT', 'UID:' + uid, 'DTSTAMP:' + utc, 'DTSTART:' + startEnd(s)[0], 'DURATION:PT15M', 'RRULE:FREQ=WEEKLY;BYDAY=' + byday(s.days),
      'SUMMARY:' + icsEsc(TITLE), 'DESCRIPTION:' + icsEsc(details()),
      'BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(TITLE), 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'].map(fold).join('\r\n') + '\r\n';
  }
  // the calendar uses the time and days on the page
  function calUpdate() {
    var s = readFields(true), a = document.getElementById('rm-gcal'), w = document.getElementById('rm-cal-when'), cf = document.getElementById('rm-cal-fields');
    // when the time and days are in the Phone notifications card, say so (this card has no fields of its own then)
    var above = cf && !cf.firstChild ? ' To change it, use Time and Days above.' : '';
    if (w) w.textContent = s ? 'Your calendar will remind you ' + whenText(s) + '.' + above : 'Choose a time and at least one day.' + above;
    if (a && s) a.href = gcalURL(s);
  }
  function downloadIcs() {
    var s = readFields(false, 'rm-cal-live');
    if (!s) return;
    try {
      var blob = new Blob([icsText(s)], { type: 'text/calendar;charset=utf-8' }), url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = 'ai-marg-reminder.ics'; a.style.display = 'none';
      document.body.appendChild(a); a.click();
      setTimeout(function () { try { URL.revokeObjectURL(url); } catch (e) {} if (a.parentNode) a.parentNode.removeChild(a); }, 60000);
      say('Calendar file made. Open it to add the reminder to your calendar.', false, 'rm-cal-live');
    } catch (e) { say('This browser could not make the calendar file. Use Add to Google Calendar instead.', true, 'rm-cal-live'); }
  }

  /* ---------- taps and changes on the page ---------- */
  document.addEventListener('click', function (ev) {
    var t = ev.target && ev.target.closest && ev.target.closest('[data-rm], .rm-day');
    if (!t || !t.closest('#rm-page')) return;
    if (t.classList.contains('rm-day')) {
      var on = t.getAttribute('aria-pressed') === 'true';
      if (on && document.querySelectorAll('#rm-page .rm-day[aria-pressed="true"]').length === 1) { say('Keep at least one day.', true, 'rm-days-live'); return; }
      t.setAttribute('aria-pressed', on ? 'false' : 'true');
      say('', false, 'rm-days-live');
      calUpdate();
      return;
    }
    var a = t.getAttribute('data-rm');
    if (a === 'gcal') { if (!readFields(false, 'rm-cal-live')) ev.preventDefault(); else calUpdate(); return; }
    if (a === 'ics') { downloadIcs(); return; }
    if (busy || t.getAttribute('aria-disabled') === 'true') { ev.preventDefault(); return; }
    if (a === 'on') turnOn(t);
    else if (a === 'save') saveChanges(t);
    else if (a === 'test') sendTest(t);
    else if (a === 'off') turnOff(t);
    else if (a === 'recheck') draw(function (st) { focusEl(st === 'blocked' ? 'rm-status' : 'rm-phone-h'); say(st === 'blocked' ? 'Notifications are still blocked.' : 'Notifications are allowed now. Choose a time and turn on reminders.', st === 'blocked'); });
  });
  var onField = function (ev) { if (ev.target && ev.target.id === 'rm-time' && ev.target.closest('#rm-page')) calUpdate(); };
  document.addEventListener('input', onField);
  document.addEventListener('change', onField);

  window.AIM_REMINDERS = { view: view, boot: boot, check: check, pingActive: pingActive };
  var r0 = load();
  if (r0 && r0.on) boot();
})();
