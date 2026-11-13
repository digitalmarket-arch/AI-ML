#!/usr/bin/env node
/* Play mode plumbing checks, no browser needed. Run:  node scripts/check-play-sync.js
   What Play mode adds to the saved progress must merge safely between devices and tabs, and the new times kept on
   existing records (a question's first right answer, a quiz's first pass and first 100%, a lab task's tick) must be
   right. The site's own files run here as they do in the browser (data/*.js, core.js, study.js, study-review.js and
   app.js) in a sandbox with a stand-in window, document and storage. Days are the learner's local days, so every
   check runs twice: in India's time zone and in UTC. Prints "N passed, M failed"; the exit code is 1 if any failed.
   Set V=1 to see every check. */
'use strict';
var fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
var ROOT = path.join(__dirname, '..');
var ZONES = ['Asia/Kolkata', 'UTC'];

if (!process.env.AIM_PLAY_SYNC_TZ) {
  // one run per time zone, each in its own process (Node reads TZ when it starts)
  var total = 0, failed = 0;
  ZONES.forEach(function (tz) {
    var env = Object.assign({}, process.env, { TZ: tz, AIM_PLAY_SYNC_TZ: tz });
    var r = cp.spawnSync(process.execPath, [__filename], { env: env, encoding: 'utf8' });
    var out = (r.stdout || '') + (r.stderr || ''), m = /^RESULT (\d+) (\d+)$/m.exec(out);
    process.stdout.write(out.replace(/^RESULT .*\n?/m, ''));
    if (!m || (r.status !== 0 && m[2] === '0')) { failed++; console.log('FAIL [' + tz + '] the checks did not finish (exit ' + r.status + ')'); }
    if (m) { total += Number(m[1]); failed += Number(m[2]); }
  });
  console.log(total + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
}

var TZ = process.env.AIM_PLAY_SYNC_TZ, pass = 0, fail = 0;
function ok(c, msg, extra) {
  if (c) pass++; else fail++;
  if (!c || process.env.V) console.log((c ? 'PASS ' : 'FAIL ') + '[' + TZ + '] ' + msg + (!c && extra !== undefined ? '  -> ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)) : ''));
}
var J = function (o) { return JSON.parse(JSON.stringify(o)); };
var eq9 = function (a, b, msg) { ok(JSON.stringify(a) === JSON.stringify(b), msg, { got: a, want: b }); };
// the same content whatever the order of keys (merging in the other order may list keys in another order)
function canon(o) {
  if (Array.isArray(o)) return '[' + o.map(canon).join(',') + ']';
  if (o && typeof o === 'object') return '{' + Object.keys(o).sort().map(function (k) { return JSON.stringify(k) + ':' + canon(o[k]); }).join(',') + '}';
  return JSON.stringify(o === undefined ? null : o);
}
var own = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };

/* ---------- the sandbox: a stand-in browser for the site's scripts ---------- */
var RealDate = Date;
function makeDate(getNow) {
  function FakeDate() {
    if (!(this instanceof FakeDate)) return new RealDate(getNow()).toString();
    var a = Array.prototype.slice.call(arguments);
    return a.length ? new (Function.prototype.bind.apply(RealDate, [null].concat(a)))() : new RealDate(getNow());
  }
  FakeDate.prototype = RealDate.prototype; FakeDate.now = function () { return getNow(); }; FakeDate.UTC = RealDate.UTC; FakeDate.parse = RealDate.parse;
  return FakeDate;
}
// mode 'blocked': every call throws (site data blocked); 'readonly': reads give nothing and writes throw (old private
// modes)
function storage(m, mode) {
  var no = function () { throw new Error('storage refused'); };
  if (mode === 'blocked') return { getItem: no, setItem: no, removeItem: no };
  if (mode === 'readonly') return { getItem: function () { return null; }, setItem: no, removeItem: function () {} };
  return { getItem: function (k) { return own(m, k) ? m[k] : null; }, setItem: function (k, v) { m[k] = String(v); }, removeItem: function (k) { delete m[k]; } };
}
// an element that takes whatever the scripts do to it; nothing is really drawn
function el(tag) {
  var attrs = {}, cls = {};
  return {
    tagName: String(tag || 'div').toUpperCase(), style: {}, dataset: {}, isConnected: true, children: [], _html: '', textContent: '', firstElementChild: null, firstChild: null,
    get innerHTML() { return this._html; }, set innerHTML(v) { this._html = String(v); },
    classList: { add: function (c) { cls[c] = 1; }, remove: function (c) { delete cls[c]; }, toggle: function (c, on) { if (on === undefined ? !cls[c] : on) cls[c] = 1; else delete cls[c]; }, contains: function (c) { return !!cls[c]; } },
    setAttribute: function (k, v) { attrs[k] = String(v); }, getAttribute: function (k) { return own(attrs, k) ? attrs[k] : null; },
    removeAttribute: function (k) { delete attrs[k]; }, hasAttribute: function (k) { return own(attrs, k); },
    appendChild: function (c) { this.children.push(c); return c; }, insertBefore: function (c) { this.children.push(c); return c; }, remove: function () {},
    insertAdjacentHTML: function (where, h) { this._html = where === 'afterbegin' ? h + this._html : this._html + h; },
    querySelector: function () { return null; }, querySelectorAll: function () { return []; },
    addEventListener: function () {}, removeEventListener: function () {}, dispatchEvent: function () { return true; },
    focus: function () {}, blur: function () {}, scrollIntoView: function () {}, matches: function () { return false; }, closest: function () { return null; }, contains: function () { return false; },
    getBoundingClientRect: function () { return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }; }
  };
}
var T0 = Date.UTC(2026, 10, 12, 6, 0, 0); // 12 Nov 2026, 11:30 in India
function boot(opts) {
  opts = opts || {};
  var now = opts.now || T0, store = {}, sess = {}, timers = [], scripts = [], toasts = [], listeners = {}, byId = {}, docL = [];
  Object.keys(opts.store || {}).forEach(function (k) { store[k] = opts.store[k]; });
  Object.keys(opts.sess || {}).forEach(function (k) { sess[k] = opts.sess[k]; });
  var document = {
    readyState: 'complete', title: '', body: null, head: el('head'), documentElement: el('html'), currentScript: null,
    getElementById: function (id) { return byId[id] || (byId[id] = el('div')); },
    createElement: function (t) { var e = el(t); if (/^script$/i.test(t)) scripts.push(e); return e; },
    querySelector: function () { return null; }, querySelectorAll: function () { return []; },
    // kept so a check can fire a click or an input at them (fire below); nothing else calls them
    addEventListener: function (t, f, cap) { docL.push({ t: t, f: f, cap: cap === true || !!(cap && cap.capture) }); },
    removeEventListener: function (t, f) { docL = docL.filter(function (x) { return x.t !== t || x.f !== f; }); }, dispatchEvent: function () { return true; }
  };
  var sb = {
    document: document, location: { hash: opts.hash || '', href: 'http://localhost/', search: '', protocol: 'http:', pathname: '/' },
    history: { state: null, replaceState: function (s) { this.state = s; }, pushState: function () {}, scrollRestoration: 'auto' },
    navigator: { onLine: true, userAgent: 'node' }, localStorage: storage(store, opts.storage), sessionStorage: storage(sess, opts.storage),
    CustomEvent: function (type, init) { this.type = type; this.detail = init && init.detail; }, Event: function (type) { this.type = type; },
    setTimeout: function (f) { timers.push(f); return timers.length; }, clearTimeout: function () {}, setInterval: function () { return 0; }, clearInterval: function () {},
    addEventListener: function (t, f) { (listeners[t] = listeners[t] || []).push(f); }, removeEventListener: function (t, f) { listeners[t] = (listeners[t] || []).filter(function (x) { return x !== f; }); },
    dispatchEvent: function (e) { (listeners[e.type] || []).slice().forEach(function (f) { f(e); }); return true; },
    scrollTo: function () {}, scrollY: 0, innerHeight: 800, innerWidth: 390,
    console: console, JSON: JSON, Math: Math, Object: Object, String: String, Number: Number, Array: Array, Promise: Promise, Error: Error, RegExp: RegExp,
    isFinite: isFinite, isNaN: isNaN, parseInt: parseInt, parseFloat: parseFloat, encodeURIComponent: encodeURIComponent, decodeURIComponent: decodeURIComponent
  };
  sb.window = sb; sb.self = sb;
  sb.Date = makeDate(function () { return now; });
  vm.createContext(sb);
  var run = function (f) { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sb, { filename: f }); };
  ['course', 'resources', 'quizzes', 'exercises', 'projects', 'glossary', 'pages', 'labs'].forEach(function (f) { run('data/' + f + '.js'); });
  run('assets/js/core.js');
  // collect the parts study.js registers, and the messages the site would show
  var C = sb.AIM_CORE, reg = C.registerPart, parts = {};
  C.registerPart = function (k, spec) { parts[k] = spec; return reg(k, spec); };
  C.toast = function (m) { toasts.push(String(m)); };
  run('assets/js/study.js');
  run('assets/js/study-review.js');
  run('assets/js/app.js');
  // game: Play mode too (Parts A, B and C), as study.js loads it on a #play page; its screens draw into the stand-in
  // elements (main; pl-root for a redraw in place)
  if (opts.game) run('assets/js/game.js');
  return {
    sb: sb, C: C, ST: sb.AIM_STUDY, A: sb.AIM_APP, R: sb.AIM_PLAY_RULES, PL: sb.AIM_PLAY, byId: byId, parts: parts, store: store, sess: sess, scripts: scripts, toasts: toasts,
    setNow: function (t) { now = t; }, tick: function (ms) { now += ms || 1000; },
    // an event at the document's listeners: capture ones first, then the others, until one stops it
    fire: function (type, ev) {
      var stop = false; ev = ev || {}; ev.type = type; ev.defaultPrevented = false;
      ev.preventDefault = function () { ev.defaultPrevented = true; }; ev.stopPropagation = function () { stop = true; };
      docL.filter(function (x) { return x.t === type && x.cap; }).concat(docL.filter(function (x) { return x.t === type && !x.cap; })).forEach(function (x) { if (!stop) x.f(ev); });
      ev.stopped = stop;
      return ev;
    },
    flush: function () { while (timers.length) timers.shift()(); },
    later: function () { return new Promise(function (r) { setImmediate(r); }); } // let promise callbacks run
  };
}

/* ---------- random progress for the order checks (a fixed seed, so a failure can be repeated) ---------- */
function rng(seed) {
  return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
var BADGE_IDS = ['first-check', 'first-quiz', 'first-gate', 'first-stop', 'checks-50', 'permit-1', 'permit-4', 'lab-1', 'week-1', 'whole-road'];
var FACTS = ['qc:l1-python/overview', 'qc:l1-python/keyTerms', 'w:l1-python', 'st:l1-python', 'pm:p-l1-x/0', 'pd:p-l1-x', 'tm:l2-regression', 'fx:l1-python-q3', 'qc:l3-cv/selfCheck'];
function pick(r, a) { return a[Math.floor(r() * a.length)]; }
function isoAt(r) { return new RealDate(RealDate.UTC(2026, 9, 1) + Math.floor(r() * 60 * 86400e3)).toISOString(); }
function randomPlay(r) {
  var o = {}, n, i;
  if (r() < 0.85) { o.badges = {}; n = Math.floor(r() * 6); for (i = 0; i < n; i++) o.badges[pick(r, BADGE_IDS)] = r() < 0.9 ? isoAt(r) : pick(r, ['', 'x', 5, null, '2026-10-05']); }
  if (r() < 0.85) { o.e = {}; n = Math.floor(r() * 8); for (i = 0; i < n; i++) o.e[pick(r, FACTS)] = r() < 0.85 ? (r() < 0.15 ? '0000-00-00' : isoAt(r).slice(0, 10)) : pick(r, ['', 'yesterday', 3, '2026-10-05T10:00:00Z']); }
  if (r() < 0.7) o.goal = pick(r, [20, 30, 50, '50', 40, null, 'x']);
  if (r() < 0.7) o.goalAt = r() < 0.85 ? pick(r, [isoAt(r), '2026-10-10T10:00:00.000Z']) : pick(r, ['', 'soon', 7]); // the fixed time makes ties
  if (r() < 0.6) o.first = r() < 0.9 ? isoAt(r) : 'x';
  if (r() < 0.6) o.rank = pick(r, [0, 1, 3, 5, 9, 12, -2, 3.7, '4', 'x']);
  if (r() < 0.6) o.goalDay = r() < 0.9 ? isoAt(r).slice(0, 10) : 'x';
  return o;
}
var minT = function (x, y) { return !x ? y : !y ? x : (y < x ? y : x); };

/* ================= 1. the play part ================= */
var B = boot(), P = B.parts.play, C = B.C;
ok(!!P && typeof P.normalize === 'function' && typeof P.merge === 'function', 'study.js registers the play part with the other study parts');
(function () {
  var r = rng(20261112), runs = 200, sym = 0, safe = 0, kept = 0, goals = 0, other = 0, viaCore = 0, firstBad = null;
  for (var i = 0; i < runs; i++) {
    var ra = randomPlay(r), rb = randomPlay(r), a = P.normalize(J(ra)), b = P.normalize(J(rb));
    var ab = P.merge(J(a), J(b)), ba = P.merge(J(b), J(a));
    if (canon(ab) === canon(ba)) sym++; else if (!firstBad) firstBad = [a, b, ab, ba];
    // safe to repeat: merging the result with either copy again, or normalizing it, changes nothing
    if (canon(P.merge(J(ab), J(a))) === canon(ab) && canon(P.merge(J(b), J(ab))) === canon(ab) && canon(P.normalize(J(ab))) === canon(ab)) safe++;
    // nothing is lost and each badge and fact keeps its earlier time
    var lost = false;
    ['badges', 'e'].forEach(function (f) {
      Object.keys(a[f]).concat(Object.keys(b[f])).forEach(function (k) { if (ab[f][k] !== minT(a[f][k], b[f][k])) lost = true; });
      if (Object.keys(ab[f]).length !== Object.keys(Object.assign({}, a[f], b[f])).length) lost = true;
    });
    if (!lost) kept++;
    // goal: the newer choice wins; on the same time (or none) the larger goal, so the order never matters
    var wantG = b.goalAt > a.goalAt ? b : a.goalAt > b.goalAt ? a : (b.goal > a.goal ? b : a);
    if (ab.goal === wantG.goal && ab.goalAt === wantG.goalAt) goals++;
    if (ab.first === minT(a.first, b.first) && ab.rank === Math.max(a.rank, b.rank) && ab.goalDay === (b.goalDay > a.goalDay ? b.goalDay : a.goalDay)) other++;
    // the same through core.js, which normalizes both copies and the result
    var m1 = C.mergeState({ v: 2, play: J(ra) }, { v: 2, play: J(rb) }).play, m2 = C.mergeState({ v: 2, play: J(rb) }, { v: 2, play: J(ra) }).play;
    if (canon(m1) === canon(m2) && canon(m1) === canon(ab)) viaCore++;
  }
  ok(sym === runs, 'play: merging gives the same result in either order (' + runs + ' random pairs)', firstBad);
  ok(safe === runs, 'play: merging again with either copy, or normalizing the result, changes nothing (' + safe + '/' + runs + ')');
  ok(kept === runs, 'play: no badge or fact is ever lost, and each keeps the earlier time (' + kept + '/' + runs + ')');
  ok(goals === runs, 'play: goal and goalAt follow the newer choice, with a tie decided by value (' + goals + '/' + runs + ')');
  ok(other === runs, 'play: first is the earliest, rank the highest and goalDay the latest (' + other + '/' + runs + ')');
  ok(viaCore === runs, 'play: core mergeState gives the same in either order (' + viaCore + '/' + runs + ')');
})();
(function () {
  // ties and the newer choice, spelled out
  var t1 = '2026-11-01T10:00:00.000Z', t2 = '2026-11-02T10:00:00.000Z';
  var x = P.normalize({ goal: 50, goalAt: t1 }), y = P.normalize({ goal: 20, goalAt: t2 });
  ok(P.merge(x, y).goal === 20 && P.merge(y, x).goal === 20 && P.merge(y, x).goalAt === t2, 'play: a newer goal choice wins in both orders, even a smaller goal');
  var p = P.normalize({ goal: 20, goalAt: t1 }), q = P.normalize({ goal: 50, goalAt: t1 });
  ok(P.merge(p, q).goal === 50 && P.merge(q, p).goal === 50, 'play: the same choice time on two devices: the larger goal, in both orders');
  ok(P.merge(P.normalize({}), P.normalize({ goal: 50 })).goal === 50 && P.merge(P.normalize({ goal: 50 }), P.normalize({})).goal === 50, 'play: no choice time on either side: the larger goal');
  var u = P.normalize({ goal: 20 }), w = P.normalize({ goal: 50, goalAt: t1 });
  ok(P.merge(u, w).goal === 50 && P.merge(w, u).goal === 50 && P.merge(u, w).goalAt === t1, 'play: a timed choice beats the untimed default');
})();
(function () {
  // a copy merged with itself changes nothing, to the byte (no spurious "progress from your other device")
  var full = P.normalize({ first: '2026-11-01T09:00:00.000Z', goal: 50, goalAt: '2026-11-01T09:00:01.000Z', rank: 4, goalDay: '2026-11-11',
    badges: { 'first-check': '2026-11-01T09:05:00.000Z', 'permit-1': '2026-11-09T12:00:00.000Z' }, e: { 'qc:l1-python/overview': '2026-11-01', 'w:l1-python': '0000-00-00' }, future: { keep: 1 } });
  ok(JSON.stringify(P.merge(J(full), J(full))) === JSON.stringify(full), 'play: merging a copy with itself changes nothing');
  var e = boot(); e.C.state.play = J(full); e.C.save();
  var m = e.C.mergeState(e.C.state, J(e.C.state));
  ok(JSON.stringify(m) === JSON.stringify(e.C.state), 'play: core mergeState(state, the same copy) === state');
  ok(m.play.future && m.play.future.keep === 1, 'play: fields from a newer version are kept');
  ok(P.merge({ x: 1 }, { x: 2 }).x === 1 && P.merge({}, { y: 2 }).y === 2, 'play: unknown fields: this copy\'s value first, and a field only the other copy has is kept');
})();
(function () {
  // damaged or hand-edited input is cleaned, and the size limits hold
  var d = P.normalize(undefined);
  ok(JSON.stringify(d) === JSON.stringify({ first: '', goal: 30, goalAt: '', rank: 0, goalDay: '', badges: {}, e: {} }), 'play: nothing saved yet gives the defaults (Steady goal of 30 XP)', d);
  ['x', 5, [1, 2], null, true].forEach(function (v) { ok(canon(P.normalize(v)) === canon(d), 'play: junk (' + JSON.stringify(v) + ') gives the defaults'); });
  var j = P.normalize({ badges: [1], e: 'x', goal: 25, rank: 99, first: 5, goalAt: {}, goalDay: 'yesterday' });
  ok(j.goal === 30 && j.rank === 9 && j.first === '' && j.goalAt === '' && j.goalDay === '' && !Object.keys(j.badges).length && !Object.keys(j.e).length, 'play: damaged fields are cleaned', j);
  ok(P.normalize({ goal: '50' }).goal === 50 && P.normalize({ goal: 40 }).goal === 30 && P.normalize({ rank: 3.7 }).rank === 3 && P.normalize({ rank: -1 }).rank === 0 && P.normalize({ rank: 'x' }).rank === 0, 'play: goal is 20, 30 or 50, and rank a whole number from 0 to 9');
  var many = { badges: {}, e: {} }, i;
  for (i = 0; i < 150; i++) many.badges['b-' + i] = '2026-11-01T10:00:00.000Z';
  for (i = 0; i < 3500; i++) many.e['qc:m' + i + '/overview'] = '2026-11-01';
  var c = P.normalize(many);
  ok(Object.keys(c.badges).length === 100 && Object.keys(c.e).length === 3000, 'play: at most 100 badges and 3000 facts are kept', [Object.keys(c.badges).length, Object.keys(c.e).length]);
  var odd = P.normalize(JSON.parse('{"__proto__": {"polluted": 1}, "badges": {"__proto__": "2026-11-01T10:00:00.000Z", "Bad-Id": "2026-11-01T10:00:00.000Z", "x": "2026-11-01T10:00:00.000Z", "ok-id": "2026-11-01T10:00:00.000Z", "no-time": "2026-11-01"},' +
    ' "e": {"__proto__": "2026-11-01", "qc:l1-python/overview": "2026-11-01", "toolong:x": "2026-11-01", "qc:": "2026-11-01", "qc:a b": "2026-11-01", "w:l1-python": "2026-11-01T10:00:00Z"}}'));
  ok(Object.keys(odd.badges).join() === 'ok-id' && Object.keys(odd.e).join() === 'qc:l1-python/overview', 'play: badge ids and fact keys that do not fit, and values of the wrong kind, are dropped', odd);
  ok(!own(odd, '__proto__') && ({}).polluted === undefined && Object.prototype.polluted === undefined, 'play: a "__proto__" key is dropped and never reaches Object.prototype');
})();
(function () {
  // Reset all progress clears the play part and what Play keeps in this browser
  var e = boot({ store: { 'aimarg.play.seen': '{"xp":120,"questsDay":"2026-11-12"}', 'aimarg.other': 'x' }, sess: { 'aimarg.play.back': '{"href":"#play-l1-python","label":"Stop 1.2"}', 'aimarg.play.sess': '{"day":"2026-11-12","cards":2}' } });
  e.C.state.play = P.normalize({ goal: 50, goalAt: '2026-11-01T09:00:00.000Z', badges: { 'first-check': '2026-11-01T09:05:00.000Z' } });
  e.C.state.prefs.play = { start: 'play', lv: 2, calm: true };
  e.C.save();
  e.C.resetAll();
  ok(canon(e.C.state.play) === canon(P.normalize(undefined)) && e.C.state.prefs.play === undefined, 'reset: the play part and prefs.play are cleared', [e.C.state.play, e.C.state.prefs]);
  ok(!own(e.store, 'aimarg.play.seen') && !own(e.sess, 'aimarg.play.back') && !own(e.sess, 'aimarg.play.sess') && e.store['aimarg.other'] === 'x', 'reset: aimarg.play.seen, aimarg.play.back and aimarg.play.sess are removed, and nothing else', [Object.keys(e.store), Object.keys(e.sess)]);
})();
(function () {
  // prefs.play belongs to this device: a merge keeps this device's choice
  var e = boot();
  var m = e.C.mergeState({ v: 2, prefs: { play: { start: 'play', lv: 3, calm: false } } }, { v: 2, prefs: { play: { start: 'learn', lv: 1, calm: true } } });
  ok(m.prefs.play && m.prefs.play.start === 'play' && m.prefs.play.lv === 3 && m.prefs.play.calm === false, 'prefs.play stays as it is on this device after a merge', m.prefs);
  var n = e.C.mergeState({ v: 2, prefs: {} }, { v: 2, prefs: { play: { start: 'play' } } });
  ok(n.prefs.play === undefined, 'a device that never chose gets no prefs.play from the other copy', n.prefs);
})();

/* ================= 2. qa f1: when a question was first answered right ================= */
(function () {
  var e = boot(), ST = e.ST, x;
  x = ST.recordAnswer('q-new', false, 0, 'quiz', 1);
  ok(x.f1 === '', 'f1: a wrong first answer sets no f1', x);
  e.tick(60000); var t1 = new RealDate(T0 + 60000).toISOString();
  x = ST.recordAnswer('q-new', true, 2, 'quiz', 0);
  ok(x.f1 === t1 && x.f1 === x.at && x.r === 1, 'f1: the first right answer sets f1 to its time', x);
  e.tick(86400e3); x = ST.recordAnswer('q-new', true, 3, 'mixed', 0);
  ok(x.f1 === t1 && x.r === 2, 'f1: a later right answer keeps the first one\'s time', x);
  e.tick(86400e3); x = ST.recordAnswer('q-new', false, 0, 'mixed', 2); e.tick(86400e3); x = ST.recordAnswer('q-new', true, 0, 'mistakes', 0);
  ok(x.f1 === t1, 'f1: a wrong answer and a fix later do not move it', x);
  // older entries, saved before f1 existed
  e.C.state.qa['q-old'] = e.parts.qa.normalize({ q: { c: { legacy: [3, 2] }, at: '2026-10-01T10:00:00.000Z' } }).q;
  x = ST.recordAnswer('q-old', true, 0, 'quiz', 0);
  ok(x.f1 === '' && x.r === 3, 'f1: never set on an old entry that was already right (r > 1): it stays undated', x);
  e.C.state.qa['q-once'] = e.parts.qa.normalize({ q: { c: { legacy: [1, 1] } } }).q;
  x = ST.recordAnswer('q-once', true, 0, 'quiz', 0);
  ok(x.f1 === '' && x.r === 2, 'f1: never set on an old entry right once before f1 existed', x);
  e.C.state.qa['q-wrong'] = e.parts.qa.normalize({ q: { c: { legacy: [2, 0] }, wrongAt: '2026-10-01T10:00:00.000Z' } }).q;
  x = ST.recordAnswer('q-wrong', true, 0, 'mistakes', 0);
  ok(x.f1 === x.at && x.r === 1, 'f1: an old entry that was only ever wrong gets f1 on its first right answer', x);
  var saved = JSON.parse(e.store['aimarg.progress.v1']).qa;
  ok(saved['q-new'].f1 === t1 && saved['q-old'].f1 === '', 'f1: saved with the progress', [saved['q-new'].f1, saved['q-old'].f1]);
})();
(function () {
  var e = boot(), Q = e.parts.qa, n = function (v) { return Q.normalize({ q: v }).q; };
  ok(n({ c: { d1: [1, 1] }, f1: '2026-11-01T10:00:00.000Z' }).f1 === '2026-11-01T10:00:00.000Z' && n({ c: { d1: [1, 1] } }).f1 === '', 'f1: normalize keeps a time, and gives \'\' when there is none');
  ok(n({ c: { d1: [1, 1] }, f1: 'yesterday' }).f1 === '' && n({ c: { d1: [1, 1] }, f1: 5 }).f1 === '' && n({ c: { d1: [1, 1] }, f1: '2026-11-01' }).f1 === '', 'f1: normalize drops anything that is not a time');
  var a = n({ c: { d1: [1, 1, '2026-11-02T10:00:00.000Z'] }, at: '2026-11-02T10:00:00.000Z', f1: '2026-11-02T10:00:00.000Z' });
  var b = n({ c: { d2: [2, 1, '2026-11-03T10:00:00.000Z'] }, at: '2026-11-03T10:00:00.000Z', f1: '2026-11-01T08:00:00.000Z' });
  var nb = n({ c: { d2: [2, 1, '2026-11-03T10:00:00.000Z'] }, at: '2026-11-03T10:00:00.000Z' });
  var m = function (x, y) { return e.C.mergeState({ v: 2, qa: { q: J(x) } }, { v: 2, qa: { q: J(y) } }).qa.q; };
  ok(m(a, b).f1 === '2026-11-01T08:00:00.000Z' && m(b, a).f1 === '2026-11-01T08:00:00.000Z', 'f1: merged as the earlier of the two, in both orders');
  ok(m(a, nb).f1 === a.f1 && m(nb, a).f1 === a.f1, 'f1: a copy without f1 keeps the other copy\'s');
  ok(m(nb, n({ c: { d1: [1, 0] } })).f1 === '' && m(n({ c: { d1: [1, 0] } }), nb).f1 === '', 'f1: neither copy has one: none');
  ok(m(a, b).r === 2 && m(a, b).n === 3, 'f1: the answer counts still add up across devices', m(a, b));
})();

/* ================= 3. quiz passAt / perfAt: the first pass and the first 100% ================= */
(function () {
  var e = boot(), A = e.A, q = function (k) { return e.C.state.quiz[k]; }, at = function () { return new RealDate(T0 + 0).toISOString(); };
  ok(typeof A.recordQuiz === 'function', 'app.js offers recordQuiz');
  A.recordQuiz('l1-python', 50, true);
  ok(!own(q('l1-python'), 'passAt') && !own(q('l1-python'), 'perfAt'), 'passAt: not set below 70%', q('l1-python'));
  e.tick(3600e3); var tPass = new RealDate(T0 + 3600e3).toISOString();
  A.recordQuiz('l1-python', 80, true);
  ok(q('l1-python').passAt === tPass && !own(q('l1-python'), 'perfAt'), 'passAt: set on the first pass; perfAt waits for 100%', q('l1-python'));
  e.tick(3600e3); A.recordQuiz('l1-python', 90, true); A.recordQuiz('l1-python', 60, true);
  ok(q('l1-python').passAt === tPass, 'passAt: a later pass, or a lower score, does not move it', q('l1-python'));
  e.tick(3600e3); var tPerf = new RealDate(T0 + 3 * 3600e3).toISOString();
  A.recordQuiz('l1-python', 100, true);
  ok(q('l1-python').perfAt === tPerf && q('l1-python').passAt === tPass, 'perfAt: set on the first 100%', q('l1-python'));
  e.tick(3600e3); A.recordQuiz('l1-python', 100, true);
  ok(q('l1-python').perfAt === tPerf, 'perfAt: a second 100% does not move it');
  e.setNow(T0); A.recordQuiz('test-l1', 100, true);
  ok(q('test-l1').passAt === at() && q('test-l1').perfAt === at(), 'a first attempt at 100% sets both, with the same time', q('test-l1'));
  // passed before these times existed: the pass stays undated, a first 100% now is dated
  e.C.state.quiz['l1-stats'] = { best: 85, attempts: 2, last: 85, at: '2026-10-01' };
  A.recordQuiz('l1-stats', 100, true);
  ok(!own(q('l1-stats'), 'passAt') && q('l1-stats').perfAt === at(), 'an old pass stays undated; its first 100% is dated', q('l1-stats'));
  ok(e.toasts.length === 0, 'recordQuiz(key, score, true) shows no toast (Play shows the result itself)', e.toasts);
  A.recordQuiz('l1-tools', 75);
  ok(e.toasts.length === 1 && /passed with 75%/.test(e.toasts[0]), 'recordQuiz(key, score) still shows Learn\'s toast', e.toasts);
  var saved = JSON.parse(e.store['aimarg.progress.v1']).quiz['l1-python'];
  ok(saved.passAt === tPass && saved.perfAt === tPerf, 'passAt and perfAt are saved with the progress', saved);
})();
(function () {
  var e = boot();
  var junk = { v: 2, quiz: { a: { best: 80, attempts: 1, passAt: 'yesterday', perfAt: 5 }, b: { best: 100, attempts: 1, passAt: '2026-11-01T10:00:00.000Z', perfAt: '2026-11-01T10:00:00.000Z' }, c: { best: 90, attempts: 1, passAt: '', perfAt: null }, d: { best: 75, attempts: 1, passAt: '2026-11-01' } } };
  e.C.replaceState(J(junk));
  var s = e.C.state.quiz;
  ok(!own(s.a, 'passAt') && !own(s.a, 'perfAt') && !own(s.c, 'passAt') && !own(s.c, 'perfAt'), 'normalize: a passAt or perfAt that is not a time is dropped', [s.a, s.c]);
  ok(s.b.passAt === '2026-11-01T10:00:00.000Z' && s.b.perfAt === '2026-11-01T10:00:00.000Z', 'normalize: valid times are kept', s.b);
  ok(s.d.passAt === '2026-11-01', 'normalize: a day alone is kept, as core.js keeps other times (when() reads it as that day)', s.d);
  var t1 = '2026-11-01T10:00:00.000Z', t2 = '2026-11-05T10:00:00.000Z';
  var x = { best: 100, attempts: 3, last: 100, at: '2026-11-05', passAt: t2, perfAt: t2 }, y = { best: 80, attempts: 2, last: 80, at: '2026-11-02', passAt: t1 };
  var m = function (p, r) { return e.C.mergeState({ v: 2, quiz: { k: J(p) } }, { v: 2, quiz: { k: J(r) } }).quiz.k; };
  ok(m(x, y).passAt === t1 && m(y, x).passAt === t1, 'merge: passAt is the earlier of the two, in both orders');
  ok(m(x, y).perfAt === t2 && m(y, x).perfAt === t2, 'merge: perfAt from the only copy that has it, in both orders');
  ok(m(x, y).best === 100 && m(y, x).best === 100 && m(x, y).attempts === 3, 'merge: best and attempts as before');
  var old1 = { best: 85, attempts: 2, last: 85, at: '2026-10-01' }, old2 = { best: 60, attempts: 1, last: 60, at: '2026-10-03' };
  ok(!own(m(old1, old2), 'passAt') && !own(m(old1, old2), 'perfAt') && !own(m(old2, old1), 'passAt'), 'merge: old copies without them keep nothing (no empty keys)', m(old1, old2));
  var only = e.C.mergeState({ v: 2, quiz: {} }, { v: 2, quiz: { k: J(y) } }).quiz.k;
  ok(only.passAt === t1, 'merge: a quiz only the other copy has keeps its passAt');
  e.C.state.quiz.k = J(x); e.C.save();
  ok(JSON.stringify(e.C.mergeState(e.C.state, J(e.C.state))) === JSON.stringify(e.C.state), 'merge: a copy with passAt and perfAt merged with itself changes nothing');
})();

/* ================= 4. lab ticks carry their time ================= */
(function () {
  var e = boot(), C = e.C, A = e.A, ST = e.ST, t = '2026-11-12T06:00:00.000Z';
  var m = function (x, y) { return C.mergeState({ v: 2, labs: J(x) }, { v: 2, labs: J(y) }).labs; };
  ok(m({ L: { t1: t } }, {}).L.t1 === t && m({}, { L: { t1: t } }).L.t1 === t, 'labs: a timed tick is kept from either copy, as true is');
  var both = m({ L: { t1: true } }, { L: { t2: t } }), both2 = m({ L: { t2: t } }, { L: { t1: true } });
  ok(both.L.t1 === true && both.L.t2 === t && both2.L.t1 === true && both2.L.t2 === t, 'labs: old true ticks and timed ticks merge together, in both orders', [both, both2]);
  ok(m({ L: { t1: t } }, { L: { t1: false } }).L.t1 === t && m({ L: { t1: false } }, { L: { t1: t } }).L.t1 === t && m({ L: { t1: true } }, { L: { t1: '' } }).L.t1 === true, 'labs: an empty tick on one side never removes a tick');
  C.replaceState({ v: 2, labs: { L: { t1: t, t2: true } } });
  ok(C.state.labs.L.t1 === t && C.state.labs.L.t2 === true, 'labs: normalize keeps timed and true ticks as they are', C.state.labs);
  // every reader only asks whether a task is ticked: a module's lab with timed ticks counts as done
  var mod = e.sb.AIM.modules.filter(function (x) { return x.lab && A.labOf(x) && (A.labOf(x).tasks || []).length; })[0], lab = A.labOf(mod);
  C.state.labs[lab.id] = {}; lab.tasks.forEach(function (x) { C.state.labs[lab.id][x.id] = t; });
  var part = A.moduleParts(mod).filter(function (p) { return p.k === 'Lab tasks'; })[0];
  ok(part && part.done && part.n === lab.tasks.length, 'labs: timed ticks count as done in the module\'s progress (' + mod.id + ')', part);
  ok(ST.isStarted(mod), 'labs: and they start the module');
})();
(function () {
  // the lab page saves a finished task with its time: a stand-in lab finishes its first task when it starts
  var e = boot(), A = e.A, mod = e.sb.AIM.modules.filter(function (x) { return x.lab && A.labOf(x) && (A.labOf(x).tasks || []).length; })[0], lab = A.labOf(mod), tid = lab.tasks[0].id;
  e.sb.AILabs = {}; e.sb.AILabs[lab.id] = { mount: function (root, ctx) { ctx.onTaskDone(tid); return {}; } };
  e.setNow(T0 + 5000);
  e.sb.location.hash = '#lab-' + lab.id; A.route();
  return e.later().then(function () {
    var v = (e.C.state.labs[lab.id] || {})[tid];
    ok(v === new RealDate(T0 + 5000).toISOString(), 'labs: a task finished in the lab is saved with its time (C.stamp())', v);
    ok(e.toasts.indexOf('Lab task complete') >= 0, 'labs: the lab still says "Lab task complete"', e.toasts);
  });
})().then(function () {

/* ================= 5. app.js: lesson cards, setRead, the Back-to-Play bar ================= */
  var e = boot(), A = e.A, C = e.C, mods = e.sb.AIM.modules, cards = 0, same = 0, pref = 0, foot = 0;
  ok(['setRead', 'testRunner', 'ensureExamples', 'modulesOf', 'levelById', 'readCardHTML', 'cardBodies', 'recordQuiz', 'placeFigures', 'placeExamples'].every(function (k) { return !!A[k]; }), 'AIM_APP offers setRead, testRunner, ensureExamples, modulesOf and levelById');
  mods.forEach(function (m) {
    var cs = A.readCards(m), body = A.cardBodies(m);
    cs.forEach(function (c, i) {
      [true, false].forEach(function (done) {
        var plain = A.readCardHTML(m, c, i, cs.length, body[c.key], done);
        if (done) cards++;
        if (plain === A.readCardHTML(m, c, i, cs.length, body[c.key], done, {}) && plain === A.readCardHTML(m, c, i, cs.length, body[c.key], done, { idPrefix: '' })) same++;
        // every id and aria reference gets the prefix, and nothing else changes
        var p = A.readCardHTML(m, c, i, cs.length, body[c.key], done, { idPrefix: 'pl-' });
        var expect = plain.replace(/(id|aria-labelledby|aria-describedby)="(read-(?:h-|hint-)?)/g, '$1="pl-$2');
        if (p === expect && (p.match(/="pl-read-/g) || []).length === 5 && !/(id|aria-[a-z]+)="read-/.test(p)) pref++;
        var f = A.readCardHTML(m, c, i, cs.length, body[c.key], done, { idPrefix: 'pl-', foot: '<button data-pl="got">Got it</button>' });
        if (/<div class="read-foot"><button data-pl="got">Got it<\/button><\/div><\/section>$/.test(f) && !/data-action="read-card"|read-hint-/.test(f)) foot++;
      });
    });
  });
  ok(cards === 189, 'all 189 lesson cards are checked', cards);
  ok(same === cards * 2, 'readCardHTML without opts, with {} and with idPrefix \'\' gives the same HTML (' + same + ')');
  ok(pref === cards * 2, 'idPrefix goes in front of every id and aria reference, and changes nothing else (' + pref + ')');
  ok(foot === cards * 2, 'foot takes the place of Got it and its hint (' + foot + ')');

  var day = C.today(), log0 = C.state.log[day] || 0;
  e.setNow(T0 + 7000); var t = new RealDate(T0 + 7000).toISOString();
  ok(A.setRead('l1-python', 'overview', true) === true && C.state.read['l1-python/overview'] === t, 'setRead ticks a card with its time', C.state.read);
  ok(C.state.log[C.today()] === log0 + 1, 'setRead counts a tick as learning activity', C.state.log);
  ok(JSON.parse(e.store['aimarg.progress.v1']).read['l1-python/overview'] === t, 'setRead saves');
  e.tick(1000);
  ok(A.setRead('l1-python', 'overview', false) === true && C.state.read['l1-python/overview'] === '-' + new RealDate(T0 + 8000).toISOString() && C.state.log[C.today()] === log0 + 1, 'setRead un-ticks with a timed marker and logs nothing');
  ok(A.setRead('no-such-module', 'overview', true) === false && A.setRead('l1-python', 'bogus', true) === false && !own(C.state.read, 'no-such-module/overview') && !own(C.state.read, 'l1-python/bogus'), 'setRead refuses a module or card that does not exist');

  // the Back-to-Play bar: only for a #play… address, never on Play's own pages
  var draw = function (hash, back) {
    if (back === null) delete e.sess['aimarg.play.back']; else e.sess['aimarg.play.back'] = typeof back === 'string' ? back : JSON.stringify(back);
    e.sb.location.hash = hash; A.route();
    return e.sb.document.getElementById('main').innerHTML;
  };
  var h = draw('#tests', { href: '#play-l1-python', label: 'Stop 1.2' });
  // tts-skip (FIXPLAN lv-4): the page's Listen and the Hinglish switch leave the bar out
  ok(h.indexOf('<div class="play-back tts-skip" role="region" aria-label="Back to Play">') === 0 && /href="#play-l1-python"><span aria-hidden="true">‹<\/span><span>Back to Play: Stop 1\.2<\/span><\/a>/.test(h) && /data-action="play-back-close">Hide this bar</.test(h), 'back bar: a Learn page opened from Play starts with the bar (tts-skip)', h.slice(0, 400));
  ok(draw('#tests', null).indexOf('play-back') < 0, 'back bar: none without a way back');
  ok(draw('#tests', { href: '#playground', label: 'x' }).indexOf('play-back') < 0 && draw('#tests', { href: 'javascript:alert(1)', label: 'x' }).indexOf('play-back') < 0 && draw('#tests', { href: 'https://example.com/#play', label: 'x' }).indexOf('play-back') < 0 && draw('#tests', '{bad json').indexOf('play-back') < 0, 'back bar: none for an address that is not a Play page, or for damaged data');
  var x = draw('#tests', { href: '#play-l1-python~quiz', label: '<b>"Stop"</b>' });
  ok(x.indexOf('<b>') < 0 && x.indexOf('&lt;b&gt;&quot;Stop&quot;&lt;/b&gt;') >= 0, 'back bar: the label is shown as text, never as HTML');
  ok(draw('#home', { href: '#play', label: '' }).indexOf('<span>Back to Play</span>') > 0, 'back bar: without a label it says "Back to Play"');
  e.sess['aimarg.play.back'] = JSON.stringify({ href: '#play-l1-python', label: 'Stop 1.2' });
  ['play', 'play-l1-python', 'play-l1-python~overview', 'play-test-l1', 'play-warmup'].forEach(function (pr) {
    e.sb.location.hash = '#' + pr;
    ok(e.ST.route(pr) === 'play' && e.sb.document.getElementById('main').innerHTML.indexOf('play-back') < 0, 'back bar: never on a Play page (#' + pr + '), which the loader marks as Play in the menu');
  });

  /* ================= 6. study.js: loading Play mode ================= */
  var f = boot(), gameReq = function () { return f.scripts.filter(function (s) { return s.src === 'assets/js/game.js'; }); };
  ok(f.ST.route('playground') === null && f.ST.route('player') === null && f.ST.route('plays') === null && !gameReq().length, 'loader: #playground and other look-alikes are not Play pages');
  f.sb.location.hash = '#play';
  ok(f.ST.route('play') === 'play' && gameReq().length === 1 && gameReq()[0].getAttribute('data-feature') === 'play', 'loader: #play loads assets/js/game.js as the "play" feature');
  f.ST.route('play-l2-regression~terms');
  ok(gameReq().length === 1, 'loader: asked twice, game.js is fetched once');
  gameReq()[0].onerror();
  return f.later().then(function () {
    ok(/Could not load this page/.test(f.sb.document.getElementById('main').innerHTML), 'loader: when game.js cannot load, the page says "Could not load this page"');
    var g = boot();
    g.sb.location.hash = '#study'; g.A.route();
    ok(g.scripts.some(function (s) { return s.src === 'assets/js/study-review.js'; }) && !g.scripts.some(function (s) { return s.src === 'assets/js/game.js'; }), 'loader: the Study room loads the study features but not game.js');
    // prefetch: a learner who chose Play on this device gets game.js a little after the page loads
    var progress = function (start) { return JSON.stringify({ v: 2, prefs: { lang: 'hi', theme: 'system', play: { start: start } } }); };
    var yes = boot({ store: { 'aimarg.progress.v1': progress('play') } }), no = boot({ store: { 'aimarg.progress.v1': progress('learn') } }), none = boot();
    [yes, no, none].forEach(function (b) { b.flush(); });
    ok(yes.scripts.some(function (s) { return s.src === 'assets/js/game.js'; }), 'prefetch: prefs.play.start === \'play\' loads game.js after the page has loaded');
    ok(!no.scripts.some(function (s) { return s.src === 'assets/js/game.js'; }) && !none.scripts.some(function (s) { return s.src === 'assets/js/game.js'; }), 'prefetch: nothing for Learn learners');

    /* ================= 7. study-review.js: the warm-up's plan, grades and gaps ================= */
    var r = boot(), RST = r.ST;
    RST.enroll(['kt:l1-python:0', 'kt:l1-python:1', 'kt:l1-python:2']);
    RST.schedule('kt:l1-python:0', 3);
    r.C.state.srs['kt:l1-python:0'].due = RST.today(); // seen before and due today
    return RST.reviewPlan().then(function (plan) {
      ok(plan && Array.isArray(plan.due) && Array.isArray(plan.fresh) && Array.isArray(plan.newToday) && typeof plan.quota === 'number' && typeof plan.active === 'number' && plan.next && 'day' in plan.next && 'reviews' in plan.next && 'fresh' in plan.next, 'reviewPlan: { due, fresh, newToday, quota, active, next: { day, reviews, fresh } }', plan);
      ok(plan.due.join() === 'kt:l1-python:0' && plan.fresh.length === 2 && plan.newToday.length === 2 && plan.active === 3, 'reviewPlan: the due card and the two new ones', plan);
      ok(RST.reviewGrades[1][0] === 'Again' && RST.reviewGrades[3][0] === 'Good' && RST.reviewGrades[4][1] === 'It came at once', 'reviewGrades: Daily review\'s grade names');
      var g1 = RST.reviewGap('kt:l1-python:1', 1), g3 = RST.reviewGap('kt:l1-python:1', 3), g4 = RST.reviewGap('kt:l1-python:1', 4);
      ok(g1 === 'later today' && g3 === '3 days' && g4 === '6 days', 'reviewGap: when a new card would come back after Again, Good and Easy', [g1, g3, g4]);
    });
  });
}).then(function () {

  /* ================= 8. game.js Part B: what Play keeps, its device notes, the tabs and its copy of the play part ================= */
  var KEY = 'aimarg.progress.v1', KEEP = 'aimarg.play.keep', DAY = 864e5;
  var iso = function (ms) { return new RealDate(ms).toISOString(); };
  // a Play screen drawn in the sandbox (flush: the stylesheet wait, the save hook, the live messages)
  var game = function (o) { o = o || {}; o.game = true; var g = boot(o); g.flush(); return g; };
  var show = function (g, hash) { g.sb.location.hash = hash; g.A.route(); g.flush(); return g.sb.document.getElementById('main').innerHTML; };
  var tab = function (g, value) { g.sb.dispatchEvent({ type: 'storage', key: KEY, newValue: value }); }; // another tab saved
  var seenOf = function (g) { return JSON.parse(g.store['aimarg.play.seen'] || 'null'); };
  // a learner who started Play 6 days ago: 4 Watch stamps and 2 checked cards, all recorded (100 XP, Walker)
  var started = function (g) {
    var C = g.C, ST = g.ST, env = g.R.browserEnv(), t = ST.today(), past = ST.addDays(t, -5), e = {}, keys = [];
    g.sb.AIM.modules.forEach(function (m) { var k = env.watchKeys(m); if (k && k.length && keys.length < 5) keys.push({ mid: m.id, key: k[0] }); });
    var st = { v: 2, prefs: { lang: 'hi', theme: 'system' }, watched: {}, srs: {}, log: {}, last: keys[0].mid };
    keys.slice(0, 4).forEach(function (x) { st.watched[x.key] = iso(T0 - 5 * DAY); e['w:' + x.mid] = past; });
    ['overview', 'outcomes'].forEach(function (k) { st.srs['rc:' + keys[0].mid + ':' + k] = { s: 2, d: 5, due: ST.addDays(t, 3), last: past, first: past, fr: past, lg: 3, reps: 1, lapses: 0 }; e['qc:' + keys[0].mid + '/' + k] = past; });
    st.log[past] = 2;
    st.play = { first: iso(T0 - 6 * DAY), goal: 30, goalAt: iso(T0 - 6 * DAY), rank: 1, goalDay: '', badges: { 'first-check': iso(T0 - 5 * DAY) }, e: e };
    C.replaceState(st);
    return keys;
  };
  var stored = function (g) { return JSON.parse(g.store[KEY]).play; };

  // xp-1: a badge and XP Play shows are kept, so an undo in Learn cannot take them back
  (function () {
    var g = game(), C = g.C, PL = g.PL, keys = started(g), x5 = keys[4];
    C.setWatched(x5.key, true); C.save(); // Learn: the 5th video finished today
    ok(!C.state.play.badges['watch-5'] && PL.snap(true).total === 120, 'xp-1 setup: 120 XP with the 5th Watch stamp from Learn, "Good listener" not recorded yet');
    var road = show(g, '#play');
    ok(C.state.play.badges['watch-5'] && C.state.play.e['w:' + x5.mid] === g.ST.today() && stored(g).badges['watch-5'] && C.state.play.rank === 2, 'xp-1: the Road keeps what it shows: the badge, the Watch stamp (w fact) and the rank (Cyclist), saved', [C.state.play.badges, C.state.play.rank]);
    ok(/<p>Welcome back! Everything you learned is still counted\. New badge: Good listener\.<\/p>/.test(road), 'xp-1: the Road\'s banner names the badge kept quietly: "Welcome back! … New badge: Good listener."', road.slice(road.indexOf('pl-banner'), road.indexOf('pl-banner') + 300));
    ok(Array.isArray(seenOf(g).nb) && !seenOf(g).nb.length, 'xp-1: the banner names it once (seen.nb is emptied)', seenOf(g));
    C.setWatched(x5.key, false); C.save(); // Learn: the video un-ticked
    var after = show(g, '#play'), s = PL.snap(true);
    ok(s.total === 120 && s.rank.name === 'Cyclist' && C.state.play.badges['watch-5'] && !/New badge/.test(after), 'xp-1: after the un-tick in Learn: still 120 XP, Cyclist, Good listener (and no banner again)', [s.total, s.rank.name]);
    var bp = show(g, '#play-badges');
    ok(/Good listener<\/b><span class="small">Earned/.test(bp), 'xp-1: the Badges page still shows Good listener as earned');
  })();
  (function () {
    // the Badges page keeps it too, and the Road names it later; a wrong answer in Learn (fix list reset) takes nothing
    var g = game(), C = g.C, PL = g.PL, keys = started(g), x5 = keys[4];
    C.setWatched(x5.key, true); C.save();
    show(g, '#play-badges');
    ok(C.state.play.badges['watch-5'] && (seenOf(g).nb || []).join() === 'watch-5', 'xp-1: the Badges page records the badge and notes it for the Road (seen.nb)', seenOf(g));
    C.setWatched(x5.key, false); C.save();
    var road = show(g, '#play');
    ok(/New badge: Good listener\./.test(road) && PL.snap(true).total === 120, 'xp-1: back on the Road after the un-tick: "New badge: Good listener.", 120 XP', road.slice(road.indexOf('pl-banner'), road.indexOf('pl-banner') + 300));
  })();
  (function () {
    // two tabs: the Road open here, Learn ticks and un-ticks in the other tab (core's merge brings each save in)
    var g = game(), o = boot(), C = g.C, keys = started(g), x5 = keys[4];
    show(g, '#play');
    o.C.replaceState(JSON.parse(g.store[KEY])); // the other tab has the same progress
    o.C.setWatched(x5.key, true); o.C.save(); tab(g, o.store[KEY]); g.flush();
    ok(C.state.play.badges['watch-5'] && C.state.play.rank === 2 && stored(g).badges['watch-5'], 'xp-1 two tabs: progress from the other tab is kept at once (badge, rank floor), saved', C.state.play.rank);
    o.C.replaceState(JSON.parse(g.store[KEY])); o.C.setWatched(x5.key, false); o.C.save(); tab(g, o.store[KEY]); g.flush();
    var s = g.PL.snap(true);
    ok(s.total === 120 && s.rank.name === 'Cyclist' && C.state.play.badges['watch-5'], 'xp-1 two tabs: after the un-tick there, still 120 XP, Cyclist and the badge here', [s.total, s.rank.name]);
  })();

  // xp-2: a rank reached outside a round is kept (a focus session, then deleted)
  (function () {
    var g = game(), C = g.C, PL = g.PL;
    started(g);
    C.state.play.rank = 0; Object.keys(C.state.play.e).filter(function (k) { return /^w:/.test(k); }).forEach(function (k) { delete C.state.play.e[k]; });
    C.state.watched = {}; C.save(); // 20 XP: two cards
    show(g, '#play');
    ok(PL.snap(true).total === 20 && C.state.play.rank === 0, 'xp-2 setup: 20 XP, Starter', [PL.snap(true).total, C.state.play.rank]);
    C.state.fs = { fs1abc: { at: iso(T0 - 3600e3), mins: 25, plan: 25, done: true, intent: '', mod: '', del: false } }; C.save(); g.flush(); // the save hook, with the Road up
    ok(PL.snap(true).total === 30 && C.state.play.rank === 1 && stored(g).rank === 1, 'xp-2: a focus session saved while the Road is up raises the rank floor to Walker (the save hook), saved', C.state.play.rank);
    show(g, '#focus'); C.state.fs.fs1abc.del = true; C.save(); // the session deleted in the focus log
    var road = show(g, '#play'), s = PL.snap(true);
    ok(s.total === 20 && s.rank.name === 'Walker' && /Walker/.test(road), 'xp-2: after the session is deleted: 20 XP, and the rank stays Walker', [s.total, s.rank.name]);
    var h = show(g, '#play-help');
    ok(h.indexOf('Each thing earns XP once. Your rank and your badges never go down.') > 0 && h.indexOf('XP never goes down') < 0, 'xp-2: How Play works no longer says XP never goes down');
  })();

  // ux-7: a round's panel celebrates only what that round earned
  (function () {
    var g = game(), C = g.C, A = g.A, PL = g.PL, M = g.sb.AIM.modules;
    C.state.play.first = iso(T0 - 2 * DAY); C.save();
    A.recordQuiz(M[0].id, 100, true); // Learn: Stop 1.1's quiz, 100% (Quiz taker, First toll gate, Full marks)
    var before = PL.begin(M[1].id);
    ok(['first-quiz', 'first-gate', 'full-marks'].every(function (k) { return C.state.play.badges[k]; }) && (seenOf(g).nb || []).sort().join() === 'first-gate,first-quiz,full-marks', 'ux-7: a round\'s start keeps the badges earned in Learn and notes them for the Road', seenOf(g));
    A.recordQuiz(M[1].id, 20, true); // the toll gate in Play, not passed
    var h = PL.resultHTML({ before: before, title: 'You scored 20%' });
    ok(!/pl-m-badges|badges? earned|Badge earned/i.test(h), 'ux-7: a failed toll gate shows no badge moment for badges earned in Learn', h.slice(0, 600));
    var road = show(g, '#play');
    ok(/New badges: Quiz taker, First toll gate, Full marks\./.test(road), 'ux-7: the Road names them instead', road.slice(road.indexOf('pl-banner'), road.indexOf('pl-banner') + 300));
    // a badge earned in the round is still its moment
    var k = game(), b2;
    k.C.state.play.first = iso(T0 - 2 * DAY); k.C.save();
    b2 = k.PL.begin(M[0].id); k.A.recordQuiz(M[0].id, 80, true);
    var h2 = k.PL.resultHTML({ before: b2, title: 'Toll gate passed' });
    ok(/pl-m-badges/.test(h2) && /Quiz taker/.test(h2) && /First toll gate/.test(h2) && !(seenOf(k) || {}).nb, 'ux-7: badges earned in the round are celebrated in its panel (and not noted for the Road)', h2.slice(0, 600));
    // progress from another tab during a round: its badges are kept, left out of this round's panel, and noted
    var r = game(), b3;
    r.C.state.play.first = iso(T0 - 2 * DAY); r.C.save();
    r.sb.location.hash = '#play-' + M[2].id + '~terms'; // a round's page (app.js leaves it as it is on a sync)
    r.PL.draw('<h1 tabindex="-1">A round</h1>', 'A round'); b3 = r.PL.begin(M[2].id);
    var other = JSON.parse(r.store[KEY]); other.quiz[M[3].id] = { best: 100, attempts: 1, last: 100, at: r.ST.today(), passAt: iso(T0), perfAt: iso(T0) };
    tab(r, JSON.stringify(other)); r.flush(); // R1: a tab's progress is kept 250 ms later (a restore's second event may follow)
    ok(r.C.state.play.badges['first-gate'] && JSON.parse(r.store[KEY]).play.badges['first-gate'] && (seenOf(r).nb || []).indexOf('first-gate') >= 0, 'ux-7: a badge that comes in from another tab during a round is kept and noted for the Road', seenOf(r));
    r.PL.recordFact('tm:' + M[2].id);
    var h3 = r.PL.resultHTML({ before: b3, title: 'Term match done' });
    ok(!/pl-m-badges|First toll gate|Full marks|Quiz taker/.test(h3) && /\+/.test(h3), 'ux-7: and the round\'s panel does not celebrate it', h3.slice(0, 600));
    // R1's wait (final round): the round ends while another tab's progress is still waiting (less than 250 ms after its
    // save). That progress is kept quietly first, so the panel still celebrates only the round's own
    var q = game(), b5;
    q.C.state.play.first = iso(T0 - 2 * DAY); q.C.save();
    q.sb.location.hash = '#play-' + M[2].id + '~terms';
    q.PL.draw('<h1 tabindex="-1">A round</h1>', 'A round'); b5 = q.PL.begin(M[2].id);
    var o5 = JSON.parse(q.store[KEY]); o5.quiz[M[3].id] = { best: 100, attempts: 1, last: 100, at: q.ST.today(), passAt: iso(T0), perfAt: iso(T0) };
    q.store[KEY] = JSON.stringify(o5); tab(q, q.store[KEY]); // no flush: the 250 ms have not passed
    q.PL.recordFact('tm:' + M[2].id);
    var h5 = q.PL.resultHTML({ before: b5, title: 'Term match done' });
    ok(!/First toll gate|Full marks|Quiz taker/.test(h5) && q.C.state.play.badges['first-gate'], 'ux-7 with R1\'s wait: a round that ends within 250 ms of another tab\'s save does not celebrate that tab\'s badges', h5.slice(0, 600));
    q.flush();
    ok(['first-gate', 'first-quiz', 'full-marks'].every(function (k) { return (seenOf(q).nb || []).indexOf(k) >= 0; }), 'ux-7 with R1\'s wait: once the wait is over they are noted for the Road', seenOf(q));
    // and the round's own badge, earned after the other tab's save, is still its moment
    var w6 = game(), b6;
    w6.C.state.play.first = iso(T0 - 2 * DAY); w6.C.save();
    w6.sb.location.hash = '#play-' + M[0].id + '~overview';
    w6.PL.draw('<h1 tabindex="-1">A round</h1>', 'A round'); b6 = w6.PL.begin(M[0].id);
    var o6 = JSON.parse(w6.store[KEY]); o6.quiz[M[3].id] = { best: 100, attempts: 1, last: 100, at: w6.ST.today(), passAt: iso(T0), perfAt: iso(T0) };
    w6.store[KEY] = JSON.stringify(o6); tab(w6, w6.store[KEY]);
    w6.C.state.srs['rc:' + M[0].id + ':overview'] = { s: 2, d: 3, due: w6.ST.addDays(w6.ST.today(), 3), last: w6.ST.today(), first: w6.ST.today(), fr: w6.ST.today(), lg: 3, reps: 1, lapses: 0 };
    w6.PL.recordFact('qc:' + M[0].id + '/overview'); // the round's own step: the first card checked
    var h6 = w6.PL.resultHTML({ before: b6, title: 'Card 1 checked' });
    ok(/First check/.test(h6) && !/First toll gate|Full marks|Quiz taker/.test(h6), 'ux-7 with R1\'s wait: the round\'s own badge (First check, earned after the other tab\'s save) is still celebrated, and only it', h6.slice(0, 700));
  })();
  // ux-7 (recheck): the goal moment belongs to the round that met the goal. A goal met before the round (in Learn, say)
  // is not that round's news: a failed toll gate after it must not celebrate "Goal met for today"
  (function () {
    var g = game(), C = g.C, A = g.A, PL = g.PL, M = g.sb.AIM.modules, t = g.ST.today();
    C.state.play.first = iso(T0 - 2 * DAY); C.save();
    A.recordQuiz(M[0].id, 100, true); // Learn: Stop 1.1's quiz at 100% meets the goal (30 XP)
    var before = PL.begin(M[1].id);
    A.recordQuiz(M[1].id, 20, true); // Play: Stop 1.2's toll gate, 2 of 10
    var h = PL.resultHTML({ before: before, title: 'You scored 20%' }), s = PL.snap(true);
    ok(before.met && s.met && !/pl-m-goal|Goal met for today/.test(h) && C.state.play.goalDay !== t && !/pl-moment/.test(h),
      'ux-7: a failed toll gate after the goal was met in Learn has no goal moment (no big moment at all), and goalDay is not set', h.slice(0, 700));
    // the round that crosses the goal still shows it, once a day
    var k = game(), b2, b3; k.C.state.play.first = iso(T0 - 2 * DAY); k.C.state.play.goal = 20; k.C.save();
    k.PL.recordFact('tm:' + M[0].id); // 10 of 20 XP before the round
    b2 = k.PL.begin(M[1].id); k.PL.recordFact('tm:' + M[1].id); // the round: 20 of 20
    var h2 = k.PL.resultHTML({ before: b2, title: 'Term match done' });
    ok(!b2.met && /pl-m-goal/.test(h2) && /Goal met for today/.test(h2) && k.C.state.play.goalDay === t, 'ux-7: the round that crosses the goal shows the goal moment, and goalDay is today', h2.slice(0, 600));
    b3 = k.PL.begin(M[2].id); k.PL.recordFact('tm:' + M[2].id);
    ok(!/Goal met for today/.test(k.PL.resultHTML({ before: b3, title: 'Term match done' })), 'ux-7: and not again in the next round that day');
    // a round begun with yesterday's goal met and finished after midnight with today's goal met: today's news
    var m = game(), b4; m.C.state.play.first = iso(T0 - 2 * DAY); m.C.state.play.goal = 20; m.C.save();
    m.PL.recordFact('tm:' + M[0].id); m.PL.recordFact('tm:' + M[1].id);
    b4 = m.PL.begin(M[2].id); m.setNow(T0 + DAY);
    m.PL.recordFact('tm:' + M[2].id); m.PL.recordFact('tm:' + M[3].id);
    var h4 = m.PL.resultHTML({ before: b4, title: 'Term match done' });
    ok(b4.met && /Goal met for today/.test(h4) && m.C.state.play.goalDay === m.ST.today(), 'ux-7: a round that met the goal before midnight and meets the new day\'s goal after it shows the goal moment (here in its Also line)', [b4.day, m.ST.today(), m.C.state.play.goalDay]);
  })();

  // rb-4: the goal moment once a day across devices whose local days differ; goalDay only moves forward
  (function () {
    var g = game(), C = g.C, PL = g.PL, M = g.sb.AIM.modules, t = g.ST.today(), ahead = g.ST.addDays(t, 1);
    C.state.play.first = iso(T0 - 2 * DAY); C.state.play.goal = 20; C.state.play.goalDay = ahead; C.save(); // the other device is a day ahead
    var b = PL.begin(M[0].id); PL.recordFact('tm:' + M[0].id); PL.recordFact('tm:' + M[1].id); // 20 of 20 XP
    var h = PL.resultHTML({ before: b, title: 'x' });
    ok(PL.snap(true).met && !/Goal met for today/.test(h) && C.state.play.goalDay === ahead, 'rb-4: goalDay already ahead of today: no goal moment, and goalDay does not move back', [C.state.play.goalDay, ahead]);
    var k = game(); k.C.state.play.first = iso(T0 - 2 * DAY); k.C.state.play.goal = 20; k.C.state.play.goalDay = k.ST.addDays(t, -1); k.C.save();
    var b2 = k.PL.begin(M[0].id); k.PL.recordFact('tm:' + M[0].id); k.PL.recordFact('tm:' + M[1].id);
    var h2 = k.PL.resultHTML({ before: b2, title: 'x' });
    ok(/Goal met for today/.test(h2) && k.C.state.play.goalDay === t, 'rb-4: goalDay before today: the goal moment shows once and goalDay becomes today', k.C.state.play.goalDay);
    var b3 = k.PL.begin(M[2].id); k.PL.recordFact('tm:' + M[2].id);
    ok(!/Goal met for today/.test(k.PL.resultHTML({ before: b3, title: 'x' })), 'rb-4: not again in the next round');
  })();

  // rb-7: a badge id only a newer version knows is never a moment
  (function () {
    var g = game(), C = g.C, PL = g.PL, M = g.sb.AIM.modules;
    C.state.play.first = iso(T0 - 2 * DAY); C.save();
    var b = PL.begin(M[0].id);
    C.state.play.badges['night-owl'] = iso(T0); PL.recordFact('tm:' + M[0].id);
    var h = PL.resultHTML({ before: b, title: 'x' });
    ok(!/pl-m-badges|0 badges earned|Badge/.test(h) && C.state.play.badges['night-owl'], 'rb-7: an unknown badge id from a newer version is kept but makes no "0 badges earned" moment', h.slice(0, 400));
  })();

  // rb-3: with storage blocked or refusing writes, the session note lives in memory, so Continue moves on
  ['blocked', 'readonly'].forEach(function (mode) {
    var g = game({ storage: mode }), C = g.C, PL = g.PL, ST = g.ST, M = g.sb.AIM.modules, t = ST.today();
    C.state.play.first = iso(T0 - 2 * DAY);
    C.state.srs['kt:' + M[0].id + ':0'] = { s: 2, d: 5, due: t, last: ST.addDays(t, -3), first: ST.addDays(t, -3), fr: ST.addDays(t, -3), lg: 3, reps: 1, lapses: 0 };
    var n0 = PL.next().kind;
    PL.sessSet({ warm: true });
    ok(n0 === 'warmup' && PL.sess().warm === true && PL.next().kind !== 'warmup', 'rb-3 (' + mode + ' storage): after a warm-up (or one that could not load), Continue goes on', [n0, PL.sess(), PL.next().kind]);
    PL.sessSet({ cards: PL.sess().cards + 1 }); PL.sessSet({ cards: PL.sess().cards + 1 });
    ok(PL.sess().cards === 2 && PL.sess().warm === true, 'rb-3 (' + mode + ' storage): the cards count reaches 2, so quick questions can be offered', PL.sess());
    g.sb.dispatchEvent({ type: 'aim:progress-reset' });
    ok(PL.sess().cards === 0 && !PL.sess().warm, 'rb-3 (' + mode + ' storage): a reset forgets the in-memory note', PL.sess());
  });

  // rb-6: prefs.play or aimarg.play.seen saved as an array is replaced by an object
  (function () {
    var g = game({ store: { 'aimarg.play.seen': '[1,2]' } }), C = g.C, PL = g.PL;
    C.state.play.first = iso(T0 - 2 * DAY); C.state.prefs.play = []; C.save();
    ok(PL.calm() === false, 'rb-6: an array in prefs.play reads as no settings');
    PL.setPref('lv', 3); PL.setPref('calm', true); C.save();
    var p = JSON.parse(g.store[KEY]).prefs.play;
    ok(!Array.isArray(C.state.prefs.play) && p && p.lv === 3 && p.calm === true && typeof p.at === 'string', 'rb-6: setPref replaces it with an object, and the settings are saved', p);
    show(g, '#play');
    var s = seenOf(g);
    ok(s && !Array.isArray(s) && typeof s.xp === 'number', 'rb-6: an array in aimarg.play.seen is replaced by the note object', s);
  })();

  // lv-2 (core.js takeOther): Play's settings follow the tab that changed them last
  (function () {
    var a = boot(), b = boot(), at = iso(T0);
    a.C.state.prefs.play = { start: 'play', calm: true, lv: 2, at: at }; a.C.save();
    tab(b, a.store[KEY]);
    ok(b.C.state.prefs.play && b.C.state.prefs.play.calm === true && b.C.state.prefs.play.start === 'play' && b.C.state.prefs.play.at === at, 'lv-2: a tab that had no prefs.play takes the other tab\'s', b.C.state.prefs.play);
    b.A.setRead('l1-python', 'overview', true); // Got it in that tab
    ok(JSON.parse(b.store[KEY]).prefs.play.calm === true && JSON.parse(b.store[KEY]).prefs.play.start === 'play', 'lv-2: so its next save keeps Calm mode and start', JSON.parse(b.store[KEY]).prefs);
    var c = boot(); c.C.state.prefs.play = { start: 'learn', at: iso(T0 + 5000) };
    tab(c, a.store[KEY]);
    ok(c.C.state.prefs.play.start === 'learn' && c.C.state.prefs.play.at === iso(T0 + 5000), 'lv-2: a tab with newer settings keeps its own', c.C.state.prefs.play);
    var d = boot(); d.C.state.prefs.play = { start: 'learn' }; tab(d, a.store[KEY]);
    ok(d.C.state.prefs.play.start === 'play', 'lv-2: settings without a time give way to stamped ones', d.C.state.prefs.play);
    var junk = boot(); junk.C.state.prefs.play = { start: 'learn', at: iso(T0 - 5000) };
    [{ start: 'play', at: 5 }, ['x'], { start: 'play' }].forEach(function (pp) { var x = JSON.parse(a.store[KEY]); x.prefs.play = pp; tab(junk, JSON.stringify(x)); });
    ok(junk.C.state.prefs.play.start === 'learn', 'lv-2: another tab\'s settings with no time, a time that is not text, or an array are not taken', junk.C.state.prefs.play);
    var m = a.C.mergeState({ v: 2, prefs: { play: { start: 'learn', at: iso(T0 - 9000) } } }, { v: 2, prefs: { play: { start: 'play', at: iso(T0) } } });
    ok(m.prefs.play.start === 'learn', 'lv-2: the merge with the account copy (mergeState) still keeps each device\'s own settings', m.prefs.play);
  })();

  // lv-3: Play started on another device: the first Play page here marks this device as playing
  (function () {
    var g = game(); g.C.state.play.first = iso(T0 - 2 * DAY); g.C.save();
    show(g, '#play');
    var p = g.C.state.prefs.play;
    ok(p && p.start === 'play' && typeof p.at === 'string' && JSON.parse(g.store[KEY]).prefs.play.start === 'play', 'lv-3: prefs.play.start = play (stamped and saved) on the first Play page of this device', p);
    var h = game(); h.C.state.play.first = iso(T0 - 2 * DAY); h.C.state.prefs.play = { start: 'learn', at: iso(T0 - DAY) }; h.C.save();
    show(h, '#play');
    ok(h.C.state.prefs.play.start === 'learn', 'lv-3: an explicit Switch to Learn on this device stays');
    var k = game(); show(k, '#play-l1-python');
    ok(!(k.C.state.prefs.play && k.C.state.prefs.play.start), 'lv-3: nothing before Play has started anywhere');
  })();

  // xp-4: the Welcome left open while Play starts in another tab gives way to the Road
  (function () {
    var g = game(), w = show(g, '#play');
    ok(/Welcome to Play mode/.test(w), 'xp-4 setup: a new learner sees the Welcome');
    var other = JSON.parse(g.store[KEY] || JSON.stringify({ v: 2 })); other.play = { first: iso(T0), goal: 50, goalAt: iso(T0), rank: 0, goalDay: '', badges: {}, e: {} };
    tab(g, JSON.stringify(other)); g.flush();
    var road = g.sb.document.getElementById('main').innerHTML;
    ok(/The AI Road/.test(road) && !/Welcome to Play mode/.test(road) && g.C.state.play.goal === 50, 'xp-4: Start playing in another tab: the Road replaces the stale Welcome, and the goal chosen there stays', g.C.state.play.goal);
  })();

  // R1 (final review): progress from another tab is kept, saved and drawn 250 ms later. A reset or a restore there
  // comes as two storage events (its copy, merged here; then aimarg.sync, which makes this tab take that copy as it is),
  // and a save here between them would turn the restore into a merge in every tab. The two tabs share one storage: what
  // the other tab wrote is put in this tab's store before each event (the sandbox gives each boot its own)
  var restore = function (g, o) { // o: the other tab, which has just restored a backup (replaceState)
    var text = o.store[KEY], sig = o.store['aimarg.sync'];
    g.store[KEY] = text; tab(g, text); // 1. the copy: core merges it into this tab
    g.store['aimarg.sync'] = sig; g.sb.dispatchEvent({ type: 'storage', key: 'aimarg.sync', newValue: sig }); // 2. as it is
    return text;
  };
  // everything but the play part and this device's Play settings (the first Road page stamps prefs.play.start: lv-3)
  var noPlay = function (x) { var y = J(x); delete y.play; if (y.prefs) delete y.prefs.play; return canon(y); };
  (function () {
    var g = game(), o = boot(), C = g.C, keys = started(g), x5 = keys[4], waits = [], st0 = g.sb.setTimeout;
    show(g, '#play');
    g.sb.setTimeout = function (f, ms) { waits.push(ms); return st0(f, ms); };
    o.C.replaceState(JSON.parse(g.store[KEY])); o.C.setWatched(x5.key, true); o.C.save(); // the other tab: a 5th Watch stamp
    var text = o.store[KEY]; g.store[KEY] = text; tab(g, text);
    ok(g.store[KEY] === text && waits.indexOf(250) >= 0 && !C.state.play.badges['watch-5'], 'R1: another tab\'s save is not followed by a save here at once: Play waits 250 ms', waits);
    g.flush(); g.sb.setTimeout = st0;
    ok(g.store[KEY] !== text && stored(g).badges['watch-5'] && stored(g).e['w:' + x5.mid], 'R1: then it keeps and saves what came in (Good listener, the 5th Watch stamp)', stored(g).badges);
  })();
  (function () {
    // the Road is up; the backup (made on another device) has no play part, lacks this device's 1st Watch tick and has
    // a 5th one
    var g = game(), o = boot(), C = g.C, keys = started(g), x1 = keys[0], x5 = keys[4];
    show(g, '#play');
    var F = JSON.parse(g.store[KEY]); delete F.play; delete F.watched[x1.key]; F.watched[x5.key] = iso(T0 - 2 * DAY);
    o.C.replaceState(F);
    var text = restore(g, o); g.flush();
    var s = JSON.parse(g.store[KEY]), tp = JSON.parse(text).play || {}, main = g.sb.document.getElementById('main').innerHTML + (g.byId['pl-root'] || { innerHTML: '' }).innerHTML;
    ok(!s.watched[x1.key] && s.watched[x5.key] && !C.state.watched[x1.key] && !s.play.first && !C.state.play.first && (s.play.goalAt || '') === (tp.goalAt || ''),
      'R1: a backup restored in another tab while the Road is up stays as restored: the tick it lacks and the old play part do not come back', { watched: s.watched, play: s.play });
    ok(noPlay(s) === noPlay(JSON.parse(text)) && noPlay(C.state) === noPlay(JSON.parse(text)), 'R1: everything but the play part (and this device\'s Play settings) is exactly the backup; the play part holds only what Play works out from it');
    ok(/The AI Road/.test(main), 'R1: and the Road is drawn again from it');
    // a reset there (its copy, then reset:): nothing is saved here between the two either
    var h = game(), q = boot(); started(h); show(h, '#play');
    q.C.replaceState(JSON.parse(h.store[KEY])); q.C.resetAll();
    restore(h, q); h.flush();
    var hs = JSON.parse(h.store[KEY]);
    ok(!(hs.play && hs.play.first) && !h.C.state.play.first && !Object.keys(h.C.state.watched).length && !Object.keys(hs.watched || {}).length, 'R1: a reset in another tab clears this tab too', hs.play);
  })();
  (function () {
    // the Welcome is up (Play not started on this device); the backup has Play started (xp-4 routes to the Road)
    var g = game(), o = boot(), C = g.C, keys = started(g), x1 = keys[0], x5 = keys[4];
    C.state.play = { first: '', goal: 30, goalAt: '', rank: 0, goalDay: '', badges: {}, e: {} }; C.save();
    ok(/Welcome to Play mode/.test(show(g, '#play')), 'R1 setup: the Welcome is up');
    var F = JSON.parse(g.store[KEY]); delete F.watched[x1.key]; F.watched[x5.key] = iso(T0 - 2 * DAY);
    F.play = { first: iso(T0 - DAY), goal: 50, goalAt: iso(T0 - DAY), rank: 0, goalDay: '', badges: {}, e: {} };
    o.C.replaceState(F);
    var text = restore(g, o);
    ok(g.store[KEY] === text, 'R1: the Welcome does not give way (and save) between the two events');
    g.flush();
    var s = JSON.parse(g.store[KEY]), main = g.sb.document.getElementById('main').innerHTML;
    ok(/The AI Road/.test(main) && !s.watched[x1.key] && s.watched[x5.key] && s.play.first === F.play.first && s.play.goal === 50 && noPlay(s) === noPlay(JSON.parse(text)),
      'R1: then the Road replaces the Welcome, and the backup stays as restored (the tick it lacks does not come back)', { watched: Object.keys(s.watched).length, first: s.play.first });
  })();
  // R1-own-step (last look): a round's own step taken less than 250 ms after another tab's save, while Play still waits
  // to keep that tab's progress. What the step earns stays the round's: its panel celebrates the step's badge, the Road
  // does not name it, and its "+N XP" pops. Only what the other tab brought is quiet (its badges named on the Road, its
  // XP not popped)
  (function () {
    // the panel celebrates First check: its big moment, or its Also line (under a rank-up the other tab's XP brought)
    var celebrated = function (h) { return /<div class="pl-moment pl-m-badges">(?:(?!<div class="pl-moment)[\s\S])*First check/.test(h) || /<p class="pl-also small">Also: [^<]*Badge earned: First check/.test(h); };
    // the "+N XP" pops the save hook shows on the bar (nothing is drawn here: the root is given a bar to hold them)
    var popsOf = function (g) {
      var got = [], bar = el('div'), r = g.sb.document.getElementById('pl-root'), q = r.querySelector;
      bar.appendChild = function (c) { got.push(c.textContent); return c; };
      r.querySelector = function (s) { return s === '.pl-bar' ? bar : q.call(r, s); };
      return got;
    };
    [['a save that earns nothing (the study plan)', function (o) { o.prefs.hpw = 7; o.prefs.planAt = iso(T0); }, []],
      ['a save that earns badges (Stop 1.4\'s quiz at 100%)', function (o, g) { o.quiz[g.sb.AIM.modules[3].id] = { best: 100, attempts: 1, last: 100, at: g.ST.today(), passAt: iso(T0), perfAt: iso(T0) }; }, ['first-gate', 'first-quiz', 'full-marks']]
    ].forEach(function (v) {
      var g = game(), C = g.C, PL = g.PL, ST = g.ST, mid = g.sb.AIM.modules[0].id, t = ST.today(), b;
      C.state.play.first = iso(T0 - 2 * DAY); C.save();
      g.sb.location.hash = '#play-' + mid + '~overview'; // a card round's page
      PL.draw('<h1 tabindex="-1">A round</h1>', 'A round'); PL.inRound(true, true); b = PL.begin(mid); g.flush();
      var pops = popsOf(g), o = JSON.parse(g.store[KEY]);
      v[1](o, g); g.store[KEY] = JSON.stringify(o); tab(g, g.store[KEY]); // the other tab's save: Play waits 250 ms
      var x0 = PL.snap(true).total;
      // the round's own step, within the wait: the first lesson card checked (First check, +10 XP)
      C.state.srs['rc:' + mid + ':overview'] = { s: 2, d: 3, due: ST.addDays(t, 3), last: t, first: t, fr: t, lg: 3, reps: 1, lapses: 0 };
      PL.recordFact('qc:' + mid + '/overview');
      var x1 = PL.snap(true).total;
      g.flush(); // the wait ends (Play keeps what came in), then the step's save hook runs
      var h = PL.resultHTML({ before: b, title: 'Card 1 checked' }), nb = (seenOf(g) || {}).nb || [];
      ok(celebrated(h) && !/First toll gate|Full marks|Quiz taker/.test(h),
        'R1-own-step (' + v[0] + '): the badge the round\'s own step earned less than 250 ms after the other tab\'s save is still its panel\'s moment, and only it', h.slice(0, 700));
      ok(nb.indexOf('first-check') < 0 && v[2].every(function (k) { return nb.indexOf(k) >= 0; }) && stored(g).badges['first-check'],
        'R1-own-step (' + v[0] + '): it is kept, and the Road does not name it' + (v[2].length ? ' (it names the other tab\'s badges)' : ''), nb);
      ok(x1 - x0 === 10 && pops.join() === '+10 XP', 'R1-own-step (' + v[0] + '): the step\'s "+10 XP" pops' + (v[2].length ? ', and the other tab\'s XP does not' : ''), { pops: pops, x0: x0, x1: x1 });
    });
  })();

  // xp-5: a page left open past midnight works out today again when the learner comes back to it
  (function () {
    var g = game(), C = g.C, ex = g.A.exOf('l1-stats')[0];
    C.state.play.first = iso(T0 - 2 * DAY); C.state.ex[ex.id] = { done: true, at: g.ST.today() }; C.save();
    show(g, '#play');
    var rootEl = g.byId['pl-root'] || g.sb.document.getElementById('pl-root');
    rootEl.innerHTML = '';
    g.sb.dispatchEvent({ type: 'focus' });
    ok(rootEl.innerHTML === '', 'xp-5: coming back on the same day redraws nothing');
    g.setNow(T0 + DAY);
    g.sb.dispatchEvent({ type: 'focus' }); g.flush();
    ok(/The AI Road/.test(rootEl.innerHTML) && /<b>0<\/b>\/30 XP/.test(rootEl.innerHTML) && g.PL.snap().day === g.ST.today(), 'xp-5: coming back after midnight redraws the Road in place with today\'s ring (0/30 XP)', rootEl.innerHTML.slice(0, 300));
    rootEl.innerHTML = 'x'; g.sb.dispatchEvent({ type: 'focus' });
    ok(rootEl.innerHTML === 'x', 'xp-5: once only');
  })();

  // lv-1: a copy of the play part in this browser, merged back when Play loads, unless a reset or restore came later
  (function () {
    var g = game(), C = g.C, M = g.sb.AIM.modules, t = g.ST.today();
    C.save();
    ok(!g.store[KEEP], 'lv-1: no copy before Play has started (nothing to keep)');
    C.state.play.first = iso(T0 - DAY); C.state.play.goal = 50; C.state.play.goalAt = iso(T0 - DAY); C.state.play.rank = 2;
    C.state.play.badges['first-check'] = iso(T0 - DAY); C.state.play.e['tm:' + M[1].id] = t; C.state.play.e['qc:' + M[0].id + '/overview'] = t;
    C.save();
    var k = JSON.parse(g.store[KEEP]);
    ok(k && typeof k.t === 'number' && k.s === '' && JSON.stringify(k.play) === JSON.stringify(C.state.play), 'lv-1: a save writes { t, s (aimarg.sync then: none), play } to aimarg.play.keep', k);
    k.t = 1; g.store[KEEP] = JSON.stringify(k); C.save();
    ok(JSON.parse(g.store[KEEP]).t === 1, 'lv-1: a save that does not change the play part does not write it again');
    var copy = g.store[KEEP], fresh = JSON.parse(g.store[KEY]);
    // an old tab saved: its play part is the one from before Play started
    fresh.play = { first: '', goal: 30, goalAt: '', rank: 0, goalDay: '', badges: {}, e: {} };
    var stale = JSON.stringify(fresh);
    var n = game({ store: { 'aimarg.progress.v1': stale, 'aimarg.play.keep': copy } }), P = n.C.state.play;
    ok(P.first === C.state.play.first && P.goal === 50 && P.rank === 2 && P.badges['first-check'] && P.e['tm:' + M[1].id] === t && P.e['qc:' + M[0].id + '/overview'] === t, 'lv-1: a new tab merges the copy back: first, goal, rank, badges and facts', P);
    ok(JSON.parse(n.store[KEY]).play.e['tm:' + M[1].id] === t && n.PL.snap(true).total === 20, 'lv-1: saved, and the XP is back (20)', n.PL.snap(true).total);
    ok(/The AI Road/.test(show(n, '#play')), 'lv-1: #play shows the Road, not the Welcome');
    var r = game({ store: { 'aimarg.progress.v1': stale, 'aimarg.play.keep': copy, 'aimarg.sync': 'reset:' + (JSON.parse(copy).t + 1) } });
    ok(!r.C.state.play.first && !Object.keys(r.C.state.play.e).length && !r.store[KEEP], 'lv-1: a reset after the copy was written wins: nothing comes back, and the copy is removed', r.C.state.play);
    var old = JSON.parse(copy); old.t = T0 - 9000;
    var q = game({ store: { 'aimarg.progress.v1': stale, 'aimarg.play.keep': JSON.stringify(old), 'aimarg.sync': 'replace:' + (T0 - 5000) } });
    ok(!q.C.state.play.first && !q.store[KEEP], 'lv-1: so does a restore made after it (replace)');
    // a restore made before the copy: the copy was written with that signal (s)
    var pre = JSON.parse(copy); pre.s = 'replace:' + (pre.t - 1);
    var u = game({ store: { 'aimarg.progress.v1': stale, 'aimarg.play.keep': JSON.stringify(pre), 'aimarg.sync': pre.s } });
    ok(u.C.state.play.first === C.state.play.first && u.store[KEEP], 'lv-1: a restore made before the copy does not stop it');
    // R4 (final review): the device's clock moved back after the copy was written (its t is later than the reset's
    // time), then a reset on a Learn page: the signal is not the one the copy was written with, so the reset still wins
    var fut = JSON.parse(copy); fut.t = T0 + 3600e3;
    var w = game({ store: { 'aimarg.progress.v1': stale, 'aimarg.play.keep': JSON.stringify(fut), 'aimarg.sync': 'reset:' + T0 } });
    ok(!w.C.state.play.first && !Object.keys(w.C.state.play.e).length && !w.store[KEEP], 'R4: a reset after the copy wins even when the clock was moved back in between (the copy\'s t is later than the reset)', w.C.state.play);
    var same = JSON.parse(copy); same.t = T0 + 3600e3; same.s = 'reset:' + T0;
    var w2 = game({ store: { 'aimarg.progress.v1': stale, 'aimarg.play.keep': JSON.stringify(same), 'aimarg.sync': same.s } });
    ok(w2.C.state.play.first === C.state.play.first && w2.store[KEEP], 'R4: a copy written after that reset (with its signal) is still merged back', w2.C.state.play);
    // a copy from before s was kept: its time decides, as before
    var nos = JSON.parse(copy); delete nos.s;
    var w3 = game({ store: { 'aimarg.progress.v1': stale, 'aimarg.play.keep': JSON.stringify(nos), 'aimarg.sync': 'replace:' + (nos.t - 1) } });
    var w4 = game({ store: { 'aimarg.progress.v1': stale, 'aimarg.play.keep': JSON.stringify(nos), 'aimarg.sync': 'reset:' + (nos.t + 1) } });
    ok(w3.C.state.play.first === C.state.play.first && w3.store[KEEP] && !w4.C.state.play.first && !w4.store[KEEP], 'R4: a copy without s goes by its time (a restore before it: merged; a reset after it: removed)');
    // and the copy a page writes holds the signal of the reset or restore before it
    var z = game({ store: { 'aimarg.sync': 'replace:' + (T0 - 5) } }); z.C.state.play.first = iso(T0); z.C.save();
    ok(JSON.parse(z.store[KEEP]).s === 'replace:' + (T0 - 5), 'R4: the copy is written with the signal at that time (s)', JSON.parse(z.store[KEEP]));
    n.C.resetAll();
    ok(!n.store[KEEP] && !n.C.state.play.first, 'lv-1: Reset all progress removes the copy');
    var after = game({ store: { 'aimarg.progress.v1': n.store[KEY] } });
    ok(!after.C.state.play.first, 'lv-1: and nothing comes back in a new tab');
    var learn = boot(); learn.C.state.play.first = iso(T0); learn.C.save();
    ok(!learn.store[KEEP], 'lv-1: a Learn page without game.js writes no copy (only Play keeps one)');
    var blocked = game({ storage: 'blocked' }); blocked.C.state.play.first = iso(T0); blocked.C.save();
    ok(true, 'lv-1: with storage blocked, the copy never throws');
  })();

  /* ================= 9. game.js Part B: the flow and the words of Play's screens (the fix round's Group B) ================= */
  // a control inside the Play root, as a click's target: its attributes; closest() finds it for a selector that names one
  var ctl = function (attrs) {
    var c = el('button');
    Object.keys(attrs).forEach(function (k) { c.setAttribute(k, attrs[k]); });
    c.inRoot = true;
    c.closest = function (sel) { return (String(sel).match(/\[[a-z-]+/g) || []).some(function (n) { return c.hasAttribute(n.slice(1)); }) ? c : null; };
    return c;
  };
  // a click on such a control: detail 1 is a pointer (mouse or touch), 0 a key (Enter or Space)
  var press = function (g, attrs, detail) {
    var r = g.sb.document.getElementById('pl-root');
    r.contains = function (x) { return !!(x && x.inRoot); };
    return g.fire('click', { target: ctl(attrs), detail: detail || 0, button: 0 });
  };
  var mainOf = function (g) { return g.sb.document.getElementById('main').innerHTML; };
  var nb = function (t) { return String(t).replace(/ /g, ' '); }; // "Stop 1.2" may carry a no-break space
  var playing = function (g) { g.C.state.play.first = iso(T0 - 2 * DAY); g.C.save(); return g; };
  // every round of Level 1 done the Play way (cards ticked and checked, term match, toll gate) and the level test not
  // passed: Continue's next round is Checkpoint 1, while "You are here" moves on to Stop 2.1
  var doneL1 = function (g) {
    var A = g.A, M = g.sb.AIM.modules, past = g.ST.addDays(g.ST.today(), -3), L1 = M.filter(function (m) { return m.level === 1; });
    var st = { v: 2, prefs: { lang: 'hi', theme: 'system' }, read: {}, srs: {}, quiz: {}, log: {}, last: L1[L1.length - 1].id, play: { first: iso(T0 - 9 * DAY), goal: 30, goalAt: '', rank: 0, goalDay: '', badges: {}, e: {} } };
    L1.forEach(function (m) {
      A.readCards(m).forEach(function (c) { st.read[m.id + '/' + c.key] = iso(T0 - 3 * DAY); st.play.e['qc:' + m.id + '/' + c.key] = past; });
      st.play.e['tm:' + m.id] = past; st.quiz[m.id] = { best: 80, attempts: 1, last: 80, at: past, passAt: iso(T0 - 3 * DAY) };
    });
    st.quiz['test-l1'] = { best: 55, attempts: 1, last: 55, at: past };
    g.C.replaceState(st);
    return L1;
  };

  // ux-1: a first visit to a stop (Learn's "Play this module") or another Play page shows the Welcome first; Start
  // playing then opens the page asked for; Not now goes back to its module in Learn; How Play works opens as it is
  (function () {
    var g = game(), M = g.sb.AIM.modules, m = M[1], w = show(g, '#play-' + m.id), want = JSON.parse(g.sess['aimarg.play.want'] || 'null');
    ok(/<h1 tabindex="-1">Welcome to Play mode<\/h1>/.test(w) && w.indexOf('pl-ring') < 0 && want && want.h === 'play-' + m.id && !g.C.state.play.first, 'ux-1: a first visit to a stop draws the Welcome (no XP on show yet) and notes the page asked for in this tab', want);
    ok(w.indexOf('href="#m-' + m.id + '"') > 0 && /Not now, back to Learn/.test(w), 'ux-1: its Not now goes back to that module in Learn (#m-' + m.id + ')');
    press(g, { 'data-pl': 'start' }); g.flush();
    var stop = mainOf(g);
    ok(g.C.state.play.first && g.sb.location.hash === '#play-' + m.id && stop.indexOf('<h1 tabindex="-1">' + m.title + '</h1>') > 0 && !g.sess['aimarg.play.want'] && g.C.state.prefs.play.start === 'play',
      'ux-1: Start playing records the start and opens the stop asked for; the note is cleared', [g.sb.location.hash, g.sess['aimarg.play.want']]);
    var h = game(), hp = show(h, '#play-help'), nf = show(h, '#play-nope');
    ok(/<h1 tabindex="-1">How Play works<\/h1>/.test(hp) && /Not found on the road/.test(nf) && !h.C.state.play.first, 'ux-1: How Play works and a page that does not exist open as they are on a first visit');
    var b = show(h, '#play-badges');
    ok(/Welcome to Play mode/.test(b) && b.indexOf('href="#home"') > 0, 'ux-1: the first visit to Badges shows the Welcome too; Not now goes Home (no module)');
    show(h, '#play');
    ok(!h.sess['aimarg.play.want'], 'ux-1: the Road\'s own Welcome forgets a page asked for before');
    press(h, { 'data-pl': 'start' }); h.flush();
    ok(h.sb.location.hash.replace(/^#/, '') === 'play-' + M[0].id + '~overview', 'ux-1: so its Start playing goes to Continue\'s round (Stop 1.1, card 1)', h.sb.location.hash);
  })();

  // ux-2: a toll gate or checkpoint not passed: its panel offers the way back, not a Next round into the same round
  (function () {
    var g = game(), C = g.C, A = g.A, PL = g.PL, M = g.sb.AIM.modules, m = M[0], past = g.ST.addDays(g.ST.today(), -3);
    var st = { v: 2, prefs: { lang: 'hi', theme: 'system' }, read: {}, srs: {}, quiz: {}, log: {}, last: m.id, play: { first: iso(T0 - 5 * DAY), goal: 30, goalAt: '', rank: 0, goalDay: '', badges: {}, e: {} } };
    A.readCards(m).forEach(function (c) { st.read[m.id + '/' + c.key] = iso(T0 - 3 * DAY); st.play.e['qc:' + m.id + '/' + c.key] = past; });
    st.play.e['tm:' + m.id] = past; st.quiz[m.id] = { best: 40, attempts: 1, last: 40, at: past };
    C.replaceState(st); show(g, '#play');
    PL.sessSet({ warm: true }); // this tab's warm-up is done (its ticked cards are in review), so the toll gate is next
    g.sb.location.hash = '#play-' + m.id + '~quiz';
    ok(PL.next().href === '#play-' + m.id + '~quiz', 'ux-2 setup: Continue would open this same toll gate again', PL.next().href);
    var h = nb(PL.resultHTML({ title: 'You scored 40%', before: PL.begin(m.id) }));
    ok(h.indexOf('Next round') < 0 && h.indexOf('<a class="btn pl-wide" href="#play-' + m.id + '">Back to Stop 1.1</a>') > 0 && h.indexOf('href="#play-done"') > 0, 'ux-2: the failed toll gate\'s panel: "Back to Stop 1.1" and Done for today, no Next round', h.slice(h.indexOf('pl-go')));
    ok(/Back to Stop 1\.1/.test(PL.resultHTML({ before: PL.begin(m.id) })), 'ux-2: "Stop 1.1" in that label has a no-break space');
    C.state.quiz[m.id] = { best: 80, attempts: 2, last: 80, at: past, passAt: iso(T0) }; C.save();
    var p = PL.resultHTML({ title: 'Toll gate passed', before: PL.begin(m.id) });
    ok(/data-pl="next">Next round<\/a>/.test(p) && p.indexOf('Back to Stop') < 0, 'ux-2: a toll gate passed still offers Next round');
    var k = game(); doneL1(k); show(k, '#play'); k.PL.sessSet({ warm: true }); k.sb.location.hash = '#play-test-l1';
    var c = k.PL.resultHTML({ title: 'You scored 55%', before: k.PL.begin() });
    ok(k.PL.next().href === '#play-test-l1' && c.indexOf('Next round') < 0 && c.indexOf('<a class="btn pl-wide" href="#play">Back to the road</a>') > 0, 'ux-2: a failed checkpoint\'s panel: "Back to the road", no Next round', c.slice(c.indexOf('pl-go')));
  })();

  // ux-4: a result panel lists only the quests its round moved, under an h3, with one line of how many are done; the
  // Road keeps the full list, and its hands-on quest links to the current stop
  (function () {
    var g = playing(game()), A = g.A, PL = g.PL, M = g.sb.AIM.modules, m = M[0];
    var road = show(g, '#play');
    ok(road.indexOf('<span><a href="#play-' + m.id + '">Do 1 hands-on task</a></span>') > 0 && (road.match(/<section class="pl-quests" aria-labelledby="pl-q-h"><h2 [\s\S]*?<\/section>/) || [''])[0].split('<li').length - 1 === 3,
      'ux-4: the Road lists all 3 quests, and the hands-on one links to the current stop (Stop 1.1, whose Hands-on list opens Learn)');
    ok(PL.resultHTML({ before: PL.begin(m.id) }).indexOf('pl-res-q') < 0, 'ux-4: a round that moved no quest has no quest section in its panel');
    var before = PL.begin(m.id);
    A.setRead(m.id, 'overview', true); PL.recordFact('qc:' + m.id + '/overview'); // a card checked in the round
    var h = PL.resultHTML({ title: 'Card 1 checked', before: before }), q = (h.match(/<section class="pl-quests" aria-labelledby="pl-res-q">[\s\S]*?<\/section>/) || [''])[0];
    ok(/^<section class="pl-quests" aria-labelledby="pl-res-q"><h3 class="h-sub3" id="pl-res-q">Today's quests<\/h3>/.test(q) && q.split('<li').length - 1 === 2 && /Check 1 lesson card/.test(q) && /Check 2 lesson cards/.test(q) && !/hands-on/.test(q),
      'ux-4: the panel lists the 2 quests the card moved (under an h3: a11y-8), not the hands-on one', q);
    ok(/<\/ul><p class="small">1 of 3 quests done today\.<\/p><\/section>/.test(q), 'ux-4: then one line: "1 of 3 quests done today."', q.slice(-120));
    var r2 = show(g, '#play');
    ok(r2.indexOf('Do 1 hands-on task</a>') > 0, 'ux-4: the Road still lists all 3');
  })();

  // ux-5: at the road's end, the stops whose hands-on stamps are still open are named, with a link to the first
  (function () {
    var g = game(), C = g.C, A = g.A, M = g.sb.AIM.modules, past = g.ST.addDays(g.ST.today(), -3);
    var st = { v: 2, prefs: { lang: 'hi', theme: 'system' }, read: {}, srs: {}, quiz: {}, log: {}, last: M[M.length - 1].id, play: { first: iso(T0 - 9 * DAY), goal: 30, goalAt: '', rank: 0, goalDay: '', badges: {}, e: {} } };
    M.forEach(function (m) {
      A.readCards(m).forEach(function (c) { st.read[m.id + '/' + c.key] = iso(T0 - 3 * DAY); st.play.e['qc:' + m.id + '/' + c.key] = past; });
      st.play.e['tm:' + m.id] = past; st.quiz[m.id] = { best: 80, attempts: 1, last: 80, at: past, passAt: iso(T0 - 3 * DAY) };
    });
    [1, 2, 3, 4].forEach(function (lv) { st.quiz['test-l' + lv] = { best: 75, attempts: 1, last: 75, at: past, passAt: iso(T0 - 3 * DAY) }; });
    C.replaceState(st); g.PL.sessSet({ warm: true }); // this tab's warm-up is done
    var line = function () { var h = nb(show(g, '#play')), i = h.indexOf('You have travelled the whole road!'); return i < 0 ? '' : h.slice(i, h.indexOf('</section>', i)); };
    var a = line();
    ok(g.PL.next().kind === 'done' && /<p>27 stops still have hands-on stamps to earn\.<\/p><a class="pl-more" href="#play-l1-ai-basics">Go to Stop 1\.1<\/a>/.test(a), 'ux-5: the road\'s end: "27 stops still have hands-on stamps to earn." and a link to Stop 1.1', a);
    C.state.play.e['st:' + M[0].id] = past; C.save();
    ok(/26 stops still have hands-on stamps to earn\.<\/p><a class="pl-more" href="#play-l1-python">Go to Stop 1\.2<\/a>/.test(line()), 'ux-5: a stop cleared: 26, and the link goes to the first stop not cleared');
    M.slice(0, -1).forEach(function (m) { C.state.play.e['st:' + m.id] = past; }); C.save();
    ok(line().indexOf('<p>1 stop still has hands-on stamps to earn.</p><a class="pl-more" href="#play-' + M[M.length - 1].id + '">Go to Stop 4.') > 0, 'ux-5: one stop left: "1 stop still has hands-on stamps to earn.", with a link to it', line());
    C.state.play.e['st:' + M[M.length - 1].id] = past; C.save();
    var z = line();
    ok(z && !/hands-on stamps to earn/.test(z) && /Keep your memory fresh with the warm-up and quick questions\./.test(z), 'ux-5: every stop cleared: only the sentence from the SPEC', z);
    // ux-5 (recheck): with review cards due, the warm-up comes first; the Road's Next round card says the road is
    // travelled and names the stops still to clear too (not only the panel after the warm-up)
    var h = game(), H = h.C, t = h.ST.today(), st2 = J(st);
    M.slice(0, 2).forEach(function (m) { A.readCards(m).slice(0, 3).forEach(function (c) { st2.srs['rc:' + m.id + ':' + c.key] = { s: 2, d: 5, due: t, last: past, first: past, fr: past, lg: 3, reps: 1, lapses: 0 }; }); });
    H.replaceState(st2);
    var card = function () { var x = nb(show(h, '#play')), i = x.indexOf('id="pl-next-h"'); return i < 0 ? '' : x.slice(i, x.indexOf('</section>', i)); }, r = h.PL.next(), c1 = card();
    ok(r.kind === 'warmup' && r.stop && r.stop.kind === 'done' && /You have travelled the whole road!/.test(c1) && /<p>27 stops still have hands-on stamps to earn\.<\/p><a class="pl-more" href="#play-l1-ai-basics">Go to Stop 1\.1<\/a>/.test(c1) && /Continue · warm-up first \(\d+ cards\)/.test(c1),
      'ux-5: the road\'s end with the warm-up first: the Road\'s Next round card names the 27 stops still to clear, with a link, then Continue · warm-up first', c1);
    M.forEach(function (m) { H.state.play.e['st:' + m.id] = past; }); H.save();
    ok(!/hands-on stamps to earn/.test(card()) && /You have travelled the whole road!/.test(card()), 'ux-5: every stop cleared: that card has no such line');
  })();

  // ux-6: the Road at a level's end opens on the level of Continue's checkpoint; a level picked stays only while the
  // current stop is on the level it was picked at
  (function () {
    var g = game(), C = g.C;
    doneL1(g); g.PL.sessSet({ warm: true }); // this tab's warm-up is done: Continue is the checkpoint itself
    var pressed = function (h) { var m = /id="pl-lv-(\d)" data-pl="lv" data-lv="\d" aria-pressed="true"/.exec(h); return m ? Number(m[1]) : 0; };
    var cur = g.R.currentStop(C.state, g.R.browserEnv(), g.PL.snap(true).f), road = show(g, '#play');
    ok(cur.level === 2 && g.PL.next().href === '#play-test-l1' && pressed(road) === 1 && /Checkpoint 1 · Level test/.test(road), 'ux-6: all of Level 1 done, the level test not passed: the Road opens on Level 1, with Checkpoint 1 (Continue), not on Level 2 where "You are here" moved', [cur.level, pressed(road)]);
    press(g, { 'data-pl': 'lv', 'data-lv': '3' }); g.flush();
    var p = C.state.prefs.play;
    ok(p.lv === 3 && p.lvAt === 2 && typeof p.at === 'string' && pressed(g.sb.document.getElementById('pl-root').innerHTML) === 3 && pressed(show(g, '#play')) === 3, 'ux-6: a level picked (3) is kept with the current stop\'s level (lvAt 2) and shown while it stays', p);
    C.state.prefs.play.lvAt = 1; C.save();
    ok(pressed(show(g, '#play')) === 1, 'ux-6: once the current stop is on another level than the one it was picked at, the pick gives way');
    delete C.state.prefs.play.lvAt; C.save();
    ok(pressed(show(g, '#play')) === 1, 'ux-6: a pick saved without its level (an older copy) gives way too');
  })();

  // a11y-6: a round's page title says what it is, which stop, and that it is Play mode
  (function () {
    var g = playing(game()), PL = g.PL, M = g.sb.AIM.modules, m = M[1], d = g.sb.document, t = [];
    show(g, '#play');
    PL.roundPage({ screen: 'card', m: m, mid: m.id, key: 'overview' }, { title: 'Card 1 of 7', h1: m.title }); t.push(nb(d.title));
    PL.roundPage({ screen: 'terms', m: m, mid: m.id }, { title: 'Term match', h1: 'Term match' }); t.push(nb(d.title));
    PL.roundPage({ screen: 'quiz', m: m, mid: m.id }, { title: 'Toll gate', h1: 'Toll gate · pass at 70%' }); t.push(nb(d.title));
    PL.roundPage({ screen: 'test', lv: 1 }, { title: 'Checkpoint 1', h1: 'Checkpoint 1: Foundations' }); t.push(nb(d.title));
    PL.roundPage({ screen: 'warmup' }, { title: 'Warm-up', h1: 'Warm-up' }); t.push(nb(d.title));
    var site = g.sb.AIM.site && g.sb.AIM.site.name || 'AI Marg';
    eq9(t, ['Card 1 of 7: ' + m.title + ' · Stop 1.2 · Play mode', 'Term match · Stop 1.2 · Play mode', 'Toll gate · pass at 70% · Stop 1.2 · Play mode', 'Checkpoint 1: Foundations · Play mode', 'Warm-up · Play mode'].map(function (x) { return x + ' · ' + site; }),
      'a11y-6: the titles: "Card 1 of 7: Python from Zero · Stop 1.2 · Play mode", the term match and toll gate name their stop, no word twice');
  })();

  // a11y-8 and a11y-9: the goal ring's name starts with what it shows; the goal panel is a titled region, not an h2
  // before the page's h1
  (function () {
    var g = playing(game()), C = g.C, A = g.A, r = show(g, '#play');
    ok(/aria-label="0\/30 XP today\. Today(&#39;|&#x27;|')s XP and daily goal"/.test(r) && r.indexOf('Today: 0 of') < 0, 'a11y-9: the ring\'s name starts with its words "0/30 XP"', (r.match(/id="pl-ring"[^>]*>/) || [''])[0]);
    A.exOf('l1-python').slice(0, 2).forEach(function (x) { C.state.ex[x.id] = { done: true, at: g.ST.today() }; }); C.save();
    ok(/aria-label="40\/30 XP today, goal met\. Today/.test(show(g, '#play')), 'a11y-9: with the goal met: "40/30 XP today, goal met. …"');
    ok(/<div class="pl-goalp card" id="pl-goalp" role="region" aria-labelledby="pl-goalp-t" hidden><p class="h-sub3" id="pl-goalp-t"><b>Today(&#39;|&#x27;|')s XP<\/b><\/p>/.test(r) && !/<h2[^>]*>Today(&#39;|&#x27;|')s XP<\/h2>/.test(r), 'a11y-8: the goal panel is a region titled by a paragraph, so no h2 comes before the h1');
  })();

  // ux-9, ux-10, ux-18: How Play works explains term match, quests and badges; a checkpoint's XP in rows of its own;
  // plain wording
  (function () {
    var g = playing(game()), h = show(g, '#play-help'), body = (h.match(/<tbody>[\s\S]*?<\/tbody>/) || [''])[0];
    ok(body.split('<tr>').length - 1 === 17 && /<tr><td>A toll gate passed \(70% or more\)<\/td><td class="num">20<\/td><\/tr><tr><td>A checkpoint passed \(70% or more\)<\/td><td class="num">100<\/td><\/tr>/.test(body) &&
      /<tr><td>Full marks at a toll gate<\/td><td class="num">10<\/td><\/tr><tr><td>Full marks at a checkpoint<\/td><td class="num">50<\/td><\/tr>/.test(body) && body.indexOf('(a checkpoint') < 0, 'ux-10: the XP table: 17 rows, a checkpoint\'s pass (100) and full marks (50) each in a row of its own, no brackets');
    ok(h.indexOf('<p>A <b>term match</b> shows the meaning of a key term, and you pick the term. It is practice: it does not change your review.</p>') > 0 &&
      h.indexOf('<h2 class="h-sub" id="pl-hp-quests">Quests and badges</h2><p>Each day has 3 small quests that suggest what to try. They earn no XP of their own. Badges mark bigger steps, and a badge stays once you earn it.</p>') > 0, 'ux-9: How Play works explains the term match, and quests and badges');
    ok(h.indexOf('When a stop has every stamp, it is cleared.') > 0 && h.indexOf('Pressing Got it earns no XP. The quick check after it earns 10 XP, whatever you answer.') > 0 && h.indexOf('With every stamp') < 0 && h.indexOf('earns nothing') < 0, 'ux-18: "When a stop has every stamp, it is cleared." and "Pressing Got it earns no XP. The quick check after it earns 10 XP, whatever you answer."');
  })();

  // ux-12 and ux-18: the postcard leaves out counts that are 0 and counts hands-on tasks; no "about" before 1
  (function () {
    var g = playing(game()), C = g.C, A = g.A, t = g.ST.today(), tm = g.ST.addDays(t, 1), past = g.ST.addDays(t, -9), ex = A.exOf('l1-python')[0];
    var a = show(g, '#play-done');
    ok(a.indexOf('<p>Nothing done yet today.</p>') > 0 && a.indexOf('pl-counts') < 0, 'ux-12: nothing done today: one line, "Nothing done yet today.", instead of a row of zeros');
    C.state.ex[ex.id] = { done: true, at: t };
    C.state.srs['rc:l1-python:overview'] = { s: 2, d: 5, due: tm, last: past, first: past, fr: past, lg: 3, reps: 1, lapses: 0 }; C.save();
    var b = show(g, '#play-done');
    ok(b.indexOf('<ul class="pl-counts"><li><b class="num">1</b> hands-on task done</li></ul>') > 0 && b.indexOf('Nothing done yet') < 0, 'ux-12: an exercise solved today: "1 hands-on task done" and nothing for the counts that are 0');
    ok(b.indexOf('Coming up tomorrow: 1 review card<') > 0, 'ux-18: "Coming up tomorrow: 1 review card" (no "about" before 1)', (b.match(/id="pl-tmrw">[^<]*/) || [''])[0]);
    C.state.srs['rc:l1-python:outcomes'] = { s: 2, d: 5, due: tm, last: past, first: past, fr: past, lg: 3, reps: 1, lapses: 0 }; C.save();
    ok(show(g, '#play-done').indexOf('Coming up tomorrow: about 2 review cards<') > 0, 'ux-18: "about 2 review cards"');
    delete C.state.ex[ex.id]; C.state.play.e['tm:l1-python'] = t; C.save();
    var c = show(g, '#play-done');
    ok(/>10 of 30 XP</.test(c) && c.indexOf('Nothing done yet') < 0 && c.indexOf('pl-counts') < 0, 'ux-12: XP today from a term match alone: no count to show, and no "Nothing done yet today." under its 10 XP');
  })();

  // ux-15: the badge moment says "Earned today", not the badge's condition (which reads like a to-do)
  (function () {
    var g = playing(game()), A = g.A, PL = g.PL, m = g.sb.AIM.modules[0];
    show(g, '#play');
    var before = PL.begin(m.id);
    A.setRead(m.id, 'overview', true); PL.recordFact('qc:' + m.id + '/overview');
    var h = PL.resultHTML({ title: 'Card 1 checked', before: before });
    ok(/pl-m-badges/.test(h) && /<b>First check<\/b><span class="small">Earned today<\/span>/.test(h) && h.indexOf('Check your first lesson card') < 0, 'ux-15: the First check moment: "Earned today"', (h.match(/<div class="pl-moment[\s\S]*?<\/div>/) || [''])[0]);
  })();

  // ux-18: Continue with quick questions first says what the number counts
  (function () {
    var g = playing(game()), C = g.C, M = g.sb.AIM.modules, past = g.ST.addDays(g.ST.today(), -3);
    C.state.quiz[M[0].id] = { best: 40, attempts: 1, last: 40, at: past }; C.state.last = M[1].id; C.save();
    g.sess['aimarg.play.sess'] = JSON.stringify({ day: g.ST.today(), cards: 2, warm: true, quick: false });
    var r = show(g, '#play'), m = /Continue · quick questions first \(([^)]*)\)/.exec(r);
    ok(m && /^\d+ questions?$/.test(m[1]), 'ux-18: "Continue · quick questions first (2 questions)", not a bare number', m && m[0]);
  })();

  // xp-6: a double click on Save to my journal saves once and keeps saying so
  (function () {
    var g = playing(game()), C = g.C;
    show(g, '#play-done');
    var d = g.sb.document, ta = d.getElementById('pl-jr-t'), msg = d.getElementById('pl-jr-msg'), focused = 0;
    ta.id = 'pl-jr-t'; ta.focus = function () { focused++; };
    ta.value = 'Lists start at 0.'; g.tick(1000);
    press(g, { 'data-pl': 'jsave' }, 1); var n1 = Object.keys(C.state.jr || {}).length, m1 = msg.textContent;
    g.tick(120); press(g, { 'data-pl': 'jsave' }, 1); // the second click of a double click
    ok(n1 === 1 && m1 === 'Saved to your journal' && Object.keys(C.state.jr).length === 1 && msg.textContent === 'Saved to your journal' && !focused && ta.value === '',
      'xp-6: the second click finds the box emptied by the first: one entry, "Saved to your journal" stays, focus stays', [n1, msg.textContent, focused]);
    g.fire('input', { target: ta }); press(g, { 'data-pl': 'jsave' }, 1);
    ok(msg.textContent === 'Write one line first.' && focused === 1 && Object.keys(C.state.jr).length === 1, 'xp-6: after typing again, an empty Save asks for a line and moves focus to the box', [msg.textContent, focused]);
  })();

  // rb-1: a pointer click inside the Play root within 400 ms of a page being drawn is the second tap of a double tap:
  // it is dropped before anything acts on it; a key press never is, nor a click outside Play's page
  (function () {
    var g = playing(game()), seen = 0;
    show(g, '#play');
    g.sb.document.addEventListener('click', function () { seen++; }); // a listener after the guard (app.js's, a round's)
    var e1 = press(g, { 'data-pl': 'probe' }, 1);
    g.tick(399); var e2 = press(g, { 'data-pl': 'probe' }, 1), e3 = press(g, { 'data-pl': 'probe' }, 0);
    var out = el('a'); out.closest = function () { return null; };
    var e5 = g.fire('click', { target: out, detail: 1, button: 0 });
    g.tick(2); var e4 = press(g, { 'data-pl': 'probe' }, 1);
    ok(e1.defaultPrevented && e1.stopped && e2.defaultPrevented && e2.stopped, 'rb-1: pointer clicks 0 and 399 ms after the draw are dropped (default prevented, stopped)');
    ok(!e3.defaultPrevented && !e3.stopped && !e4.defaultPrevented && !e5.defaultPrevented && seen === 3, 'rb-1: a key press at once, a click outside Play\'s page and a pointer click 401 ms after the draw go through', seen);
    // (recheck) a result panel moves the page under the finger as a new page does: the second tap of a double tap on a
    // round's last control (a grade, Finish) must not land on its Next round or Done for today
    g.sb.document.getElementById('pl-result').parentNode = { removeChild: function () {} }; // the stand-in of the panel shown before
    g.tick(5000); g.PL.showResult(g.sb.document.getElementById('pl-res-at'), { title: 'Card 1 checked', next: false });
    var r1 = press(g, { 'data-pl': 'next' }, 1); g.tick(399); var r2 = press(g, { 'data-pl': 'next' }, 1), r3 = press(g, { 'data-pl': 'probe' }, 0);
    g.tick(2); var r4 = press(g, { 'data-pl': 'probe' }, 1);
    ok(r1.stopped && r1.defaultPrevented && r2.stopped && !r3.stopped && !r4.stopped, 'rb-1: pointer clicks 0 and 399 ms after a result panel is shown are dropped; a key press at once and a pointer click 401 ms after go through', [r1.stopped, r2.stopped, r3.stopped, r4.stopped]);
  })();

  /* ================= 10. game.js: the look and small accessibility fixes (the fix round's Group C) ================= */
  // a page's visible words: its HTML without the tags (and so without their attributes)
  var wordsOf = function (h) { return String(h).replace(/<[^>]*>/g, ' '); };
  // the ids that appear more than once in a page's HTML
  var twice = function (h) { var n = {}, out = [], re = /\sid="([^"]+)"/g, m; while ((m = re.exec(h))) { if (n[m[1]] === 1) out.push(m[1]); n[m[1]] = (n[m[1]] || 0) + 1; } return out; };

  // a11y-2: each goal radio has an id of its own (<name>-<xp>), so a redraw in place gives focus back to that very radio
  // (before, the first [data-pl=goal] matched: on How Play works the hidden one in the bar's closed panel)
  (function () {
    var g = playing(game()), hp = show(g, '#play-help'), rd = show(g, '#play'), w = show(game(), '#play');
    var radios = function (h, name) { var re = new RegExp('<input type="radio" id="(' + name + '-\\d+)" name="' + name + '" value="(\\d+)" data-pl="goal"', 'g'), m, out = []; while ((m = re.exec(h))) out.push(m[1] + '=' + m[2]); return out; };
    eq9(radios(hp, 'pl-goal-h').concat(radios(hp, 'pl-goal-b')), ['pl-goal-h-20=20', 'pl-goal-h-30=30', 'pl-goal-h-50=50', 'pl-goal-b-20=20', 'pl-goal-b-30=30', 'pl-goal-b-50=50'],
      'a11y-2: How Play works: each goal radio, on the page and in the bar\'s panel, has an id of its own');
    ok(radios(rd, 'pl-goal-b').length === 3 && radios(w, 'pl-goal-w').length === 3 && !twice(hp).length && !twice(rd).length && !twice(w).length, 'a11y-2: the Road\'s panel and the Welcome too; no id is used twice on a page', [twice(hp), twice(rd), twice(w)]);
  })();

  // lv-4: Listen and the Hinglish switch skip the Play bar, with the Road's week line and the goal panel (they come
  // before the page's heading), as they skip the Back-to-Play bar on Learn pages: both carry tts-skip
  (function () {
    var g = playing(game()), M = g.sb.AIM.modules, bad = [];
    // (a round's page through PL.roundPage: the rounds themselves need a real page to draw their content)
    var round = function () { g.PL.roundPage({ screen: 'terms', m: M[1], mid: M[1].id }, { title: 'Term match', h1: 'Term match' }); return mainOf(g); };
    ['#play', '#play-' + M[1].id, '#play-help', '#play-badges', '#play-done', 'round'].forEach(function (h) {
      var x = h === 'round' ? round() : show(g, h), top = x.indexOf('<div class="pl-top tts-skip" id="pl-top"><div class="pl-bar">'), h1 = x.indexOf('<h1');
      if (top < 0 || top > h1 || (x.indexOf('id="pl-week"') >= 0 && x.indexOf('id="pl-week"') > h1) || x.indexOf('id="pl-goalp"') > h1) bad.push(h);
    });
    ok(!bad.length, 'lv-4: on the Road, a Stop, How Play works, Badges, the Postcard and a round, the bar (with the Road\'s week line and the goal panel) is .pl-top.tts-skip, before the h1', bad);
    var list = function (f, name) { var m = new RegExp('var ' + name + ' = ((?:\'[^\']*\'\\s*\\+\\s*)*\'[^\']*\')').exec(fs.readFileSync(path.join(ROOT, f), 'utf8')); return m ? m[1].replace(/'\s*\+\s*'/g, '') : ''; };
    ok(/\.tts-skip,/.test(list('assets/js/speak.js', 'SKIP')) && /\.tts-skip,/.test(list('assets/js/hinglish.js', 'SKIP_SEL')), 'lv-4: speak.js (SKIP) and hinglish.js (SKIP_SEL) both leave .tts-skip out');
  })();

  // ux-20: "Stop 1.2" is written with a no-break space wherever the screens show it (the Back-to-Play bar's label, the
  // bars, eyebrows, Continue's line), so the number never wraps away from its word; the badges' pictures
  (function () {
    var g = playing(game()), PL = g.PL, R = g.R, M = g.sb.AIM.modules, m = M[1], seen = [];
    ok(typeof PL.stopLb === 'function' && PL.stopLb('1.2') === 'Stop\u00a01.2', 'ux-20: PL.stopLb("1.2") is "Stop 1.2" with a no-break space');
    var road = show(g, '#play');
    ok(/<b>Stop\u00a01\.1 · /.test(road) && /<a class="pl-stop[^"]*" href="#play-l1-ai-basics" aria-label="Stop\u00a01\.1, What is AI\?/.test(road), 'ux-20: the Road\'s Next round names "Stop 1.1 · …" with the no-break space; so do its stops\' names');
    ['#play', '#play-' + m.id, '#play-done', '#play-help', '#play-badges', 'round'].forEach(function (h) {
      var t = wordsOf(h === 'round' ? (PL.roundPage({ screen: 'quiz', m: m, mid: m.id }, { title: 'Toll gate', h1: 'Toll gate · pass at 70%' }), mainOf(g)) : show(g, h)), x = /.{0,24}Stop \d.{0,8}/.exec(t);
      if (x) seen.push(h + ': ' + x[0]);
    });
    ok(!seen.length, 'ux-20: no Play screen shows "Stop" and its number with a plain space between them', seen);
    var sp = show(g, '#play-' + m.id), outs = sp.match(/data-pl-out="[^"]*"/g) || [];
    ok(outs.length >= 4 && outs.every(function (x) { return x === 'data-pl-out="Stop\u00a01.2"'; }) && sp.indexOf('<span class="pl-btitle">Stop\u00a01.2</span>') > 0 && sp.indexOf('<p class="eyebrow">Level 1 · Stop\u00a01.2') > 0,
      'ux-20: the Stop page: its hands-on links take "Stop 1.2" (no-break space) to the Back-to-Play bar; the bar\'s title and the eyebrow have it too', outs);
    PL.goOut('');
    var b1 = JSON.parse(g.sess['aimarg.play.back'] || 'null');
    PL.roundPage({ screen: 'terms', m: m, mid: m.id }, { title: 'Term match', h1: 'Term match' }); PL.goOut('');
    var b2 = JSON.parse(g.sess['aimarg.play.back'] || 'null');
    ok(b1 && b1.label === 'Stop\u00a01.2' && b2 && b2.label === 'Stop\u00a01.2 · Term match', 'ux-20: the way back from the Stop and from a round: "Stop 1.2" and "Stop 1.2 · Term match", with the no-break space', [b1, b2]);
    // the 4 road permits' badges have their own picture: a small permit stamp with the level number (it was the
    // signpost, as on 5 other badges)
    var pics = [1, 2, 3, 4].map(function (lv) { var b = R.BADGES.filter(function (x) { return x.id === 'permit-' + lv; })[0]; return b ? PL.icon(b.icon) : ''; });
    ok(pics.every(function (s, k) { return s.indexOf('>' + (k + 1) + '</text>') > 0 && s !== PL.icon('signpost') && pics.indexOf(s) === k; }), 'ux-20: each road-permit badge has its own picture, a permit stamp with its level number', pics.map(function (s) { return s.slice(-60); }));
    // the bicycle without its L plate (its 5 px box filled in at 24 px); the roller with a wide drum and one wheel, so it
    // no longer looks like a second two-wheeler
    var bike = PL.icon('bicycle'), roll = PL.icon('roller'), drum = /<rect x="[\d.]+" y="[\d.]+" width="([\d.]+)" height="([\d.]+)"/.exec(roll);
    var corner = (bike.match(/[Mm]\s*[\d.]+[ ,][\d.]+/g) || []).filter(function (x) { var n = x.slice(1).trim().split(/[ ,]/).map(Number); return x.charAt(0) === 'M' && n[0] < 4 && n[1] < 8; });
    ok(!corner.length && (bike.match(/<circle/g) || []).length === 2 && drum && Number(drum[1]) > Number(drum[2]) && (roll.match(/<circle/g) || []).length === 1,
      'ux-20: the bicycle has no plate in its corner; the roller has a wide front drum (wider than tall) and one wheel', { corner: corner, drum: drum && drum.slice(1) });
  })();
}).then(function () {
  console.log(TZ + ': ' + pass + ' passed, ' + fail + ' failed');
  console.log('RESULT ' + pass + ' ' + fail);
  process.exit(fail ? 1 : 0);
}, function (err) {
  console.log('FAIL [' + TZ + '] the checks stopped: ' + (err && err.stack || err));
  console.log('RESULT ' + pass + ' ' + (fail + 1));
  process.exit(1);
});
