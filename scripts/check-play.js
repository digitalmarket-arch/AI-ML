#!/usr/bin/env node
/* AI Marg Play mode rules check. Run:  node scripts/check-play.js
   Loads the course data and assets/js/game.js (Part A: window.AIM_PLAY_RULES) in a sandbox with a fake window, builds
   the env adapter from the data (with small copies of the app.js and study.js helpers it needs), and checks every rule
   on test progress. It runs itself twice, with TZ=UTC and TZ=Asia/Kolkata, because XP is dated by the learner's local
   day. Prints "N passed, M failed" and exits with code 1 if any check fails. V=1 prints the passing checks too. */
'use strict';
var fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
var ROOT = path.join(__dirname, '..');

/* ---------- the two time zones ---------- */
if (!process.env.PLAY_CHECK_TZ) {
  var total = 0, bad = 0;
  ['UTC', 'Asia/Kolkata'].forEach(function (tz) {
    var r = cp.spawnSync(process.execPath, [__filename], { env: Object.assign({}, process.env, { TZ: tz, PLAY_CHECK_TZ: tz }), encoding: 'utf8' });
    var out = String(r.stdout || '') + String(r.stderr || ''), m = /(\d+) passed, (\d+) failed\s*$/.exec(out);
    process.stdout.write(m ? out.slice(0, m.index) + 'TZ=' + tz + ': ' + m[0].trim() + '\n' : out + 'TZ=' + tz + ': did not finish\n');
    if (m) { total += Number(m[1]); bad += Number(m[2]); }
    if (!m || (r.status !== 0 && !Number(m[2]))) bad++;
  });
  console.log(total + ' passed, ' + bad + ' failed');
  process.exit(bad ? 1 : 0);
}

var passed = 0, failed = 0;
function ok(cond, msg, extra) {
  if (cond) passed++; else failed++;
  if (!cond || process.env.V) console.log((cond ? 'PASS ' : 'FAIL ') + msg + (!cond && extra !== undefined ? '  -> ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)) : ''));
  return !!cond;
}
var J = function (o) { return JSON.stringify(o); };
var eq = function (a, b, msg) { return ok(J(a) === J(b), msg, { got: a, want: b }); };

/* ---------- the course data and game.js ---------- */
function load(rel, sb) { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), sb, { filename: rel }); }
var data = { window: {} };
vm.createContext(data);
['course', 'resources', 'quizzes', 'exercises', 'projects', 'labs'].forEach(function (f) { load('data/' + f + '.js', data); });
var D = data.window.AIM;
var GAME_SRC = fs.readFileSync(path.join(ROOT, 'assets/js/game.js'), 'utf8');
var gsb = { window: { AIM: D } }; // no AIM_APP or AIM_STUDY: Part B (the screens) stays out
vm.createContext(gsb);
load('assets/js/game.js', gsb);
var R = gsb.window.AIM_PLAY_RULES;
if (!R) { console.log('FAIL game.js did not define window.AIM_PLAY_RULES'); console.log('0 passed, 1 failed'); process.exit(1); }

/* ---------- copies of the app.js helpers the env needs (app.js itself needs a page) ---------- */
var READ_SECS = [['overview', 'The big idea'], ['outcomes', 'You will be able to'], ['studySteps', 'Study plan'], ['keyTerms', 'Key terms'], ['indiaExample', 'In India'], ['commonMistakes', 'Common mistakes'], ['selfCheck', 'Check yourself (open tasks)']];
function readCards(m) {
  return READ_SECS.filter(function (x) { var v = m[x[0]]; return x[0] === 'overview' || (Array.isArray(v) ? v.length > 0 : !!v); }).map(function (x) { return { key: x[0], title: x[1] }; });
}
var LABS = {}; D.labs.forEach(function (l) { LABS[l.id] = l; });
function labOf(m) { return m.lab && LABS[m.lab] ? LABS[m.lab] : null; }
function exOf(mid) { return D.exercises.filter(function (e) { return e.moduleId === mid; }); }
function ytIds(url) {
  var out = { videoId: '', listId: '' }; if (!url) return out;
  var m = /[?&]list=([A-Za-z0-9_-]{10,})/.exec(url); if (m) out.listId = m[1];
  var v = /[?&]v=([A-Za-z0-9_-]{11})/.exec(url) || /youtu\.be\/([A-Za-z0-9_-]{11})/.exec(url) || /\/embed\/([A-Za-z0-9_-]{11})/.exec(url) || /\/shorts\/([A-Za-z0-9_-]{11})/.exec(url);
  if (v) out.videoId = v[1];
  return out;
}
var RES = D.resources.map(function (r0) { // app.js fills in the YouTube ids when it starts (copies here, data untouched)
  var r = Object.assign({}, r0);
  if (!r.videoId && !r.listId) { var ids = ytIds(r.url); r.videoId = r.videoId || ids.videoId; r.listId = r.listId || ids.listId; }
  if (!r.videoId && r.firstVideoUrl) r.videoId = ytIds(r.firstVideoUrl).videoId;
  return r;
});
function langRank(l) { var t = { hindi: 0, hinglish: 0, 'indian-english': 0, english: 1 }; return t[l] != null ? t[l] : 2; }
var VIDEO_TYPES = { playlist: 1, video: 1, course: 1, channel: 1 }, STATUS_RANK = { verified: 0, partial: 1, unverified: 2 };
function watchList(m) {
  var curated = (m.watch || []).map(function (w) { return w.id; });
  return RES.filter(function (r) { return (r.modules || []).indexOf(m.id) >= 0; }).sort(function (a, b) {
    var ca = curated.indexOf(a.id), cb = curated.indexOf(b.id), la = langRank(a.language), lb = langRank(b.language);
    if (la !== lb) return la - lb;
    if (ca !== cb) return (ca < 0 ? 999 : ca) - (cb < 0 ? 999 : cb);
    var va = VIDEO_TYPES[a.type] ? 0 : 1, vb = VIDEO_TYPES[b.type] ? 0 : 1;
    if (va !== vb) return va - vb;
    return (STATUS_RANK[a.status] || 0) - (STATUS_RANK[b.status] || 0);
  });
}
function langGroup(r) { return r.language === 'hindi' || r.language === 'hinglish' ? 'hi' : r.language === 'indian-english' ? 'in' : 'en'; }
function mainPicks(m) {
  var list = watchList(m), curated = (m.watch || []).map(function (w) { return w.id; });
  var isVideo = function (r) { return r.type === 'playlist' || r.type === 'video'; }, indian = function (r) { return langGroup(r) !== 'en'; };
  var good = function (r) { return curated.indexOf(r.id) >= 0 && r.status === 'verified'; }, first = function (p) { return list.filter(p)[0] || null; };
  var pinnedId = m.best || ((m.watch || []).filter(function (w) { return w.main; })[0] || {}).id;
  var best = (pinnedId ? first(function (r) { return r.id === pinnedId; }) : null) ||
    first(function (r) { return isVideo(r) && indian(r) && good(r); }) || first(function (r) { return isVideo(r) && indian(r) && r.status === 'verified'; }) ||
    first(function (r) { return isVideo(r) && r.status !== 'unverified'; }) || first(isVideo) || first(function (r) { return VIDEO_TYPES[r.type]; }) || list[0] || null;
  return { list: list, main: best, curated: curated };
}
function isRecommended(mp, r) { return mp.curated.indexOf(r.id) >= 0 && !!VIDEO_TYPES[r.type]; }
var PICKS = {}, SHARED = {};
(function () {
  var n = {};
  D.modules.forEach(function (m) { var mp = PICKS[m.id] = mainPicks(m); mp.list.forEach(function (x) { if (x.listId && (x === mp.main || isRecommended(mp, x))) n[x.id] = (n[x.id] || 0) + 1; }); });
  Object.keys(n).forEach(function (id) { if (n[id] > 1) SHARED[id] = 1; });
})();
function isTicked(st, mid, r) { var w = st.watched || {}; return !!(r && (w[r.id] || (mid && SHARED[r.id] && w[mid + '|' + r.id]))); }
var WATCH = {};
D.modules.forEach(function (m) {
  var mp = PICKS[m.id], keys = [];
  if (!mp.main) { WATCH[m.id] = null; return; }
  mp.list.forEach(function (r) { if (r === mp.main || isRecommended(mp, r)) { keys.push(r.id); if (SHARED[r.id]) keys.push(m.id + '|' + r.id); } });
  WATCH[m.id] = keys;
});
// Learn's moduleParts, as app.js writes it (reading the given progress): partsOf() must agree with it
function moduleParts(m, st) {
  var parts = [], rc = readCards(m), read = st.read || {};
  if (rc.length) { var rd = rc.filter(function (c) { var v = read[m.id + '/' + c.key]; return !!v && String(v).charAt(0) !== '-'; }).length; parts.push({ k: 'Read the lesson cards', done: rd === rc.length, n: rd, of: rc.length }); }
  var mp = PICKS[m.id];
  if (mp.main) { var w = mp.list.some(function (r) { return isTicked(st, m.id, r) && (r === mp.main || isRecommended(mp, r)); }); parts.push({ k: 'Watch the main lesson', done: w, n: w ? 1 : 0, of: 1 }); }
  var lab = labOf(m), labs = st.labs || {};
  if (lab) { var t = lab.tasks || [], dn = t.filter(function (x) { return labs[lab.id] && labs[lab.id][x.id]; }).length; parts.push({ k: 'Lab tasks', done: dn === t.length && t.length > 0, n: dn, of: t.length }); }
  var ex = exOf(m.id).filter(function (e) { return !e.optional; }), exs = st.ex || {};
  if (ex.length) { var sv = ex.filter(function (e) { return exs[e.id] && exs[e.id].done; }).length; parts.push({ k: 'Practice exercises', done: sv === ex.length, n: sv, of: ex.length }); }
  var qz = D.quizzes[m.id];
  if (qz && qz.length) { var b = st.quiz && st.quiz[m.id] ? st.quiz[m.id].best : 0; parts.push({ k: 'Quiz (70% to pass)', done: b >= 70, n: b, of: 100, pctLike: true }); }
  return parts;
}

/* ---------- copies of the study.js helpers ---------- */
var pad = function (n) { return (n < 10 ? '0' : '') + n; };
function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function addDays(day, n) { var d = new Date(day + 'T12:00:00'); d.setDate(d.getDate() + n); return ymd(d); }
function daysBetween(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000); }
function localDay(isoTime) { var d = new Date(isoTime); return isNaN(d) ? '' : ymd(d); }
function fixCount(x) {
  var n = 0, lastT = 0, lastD = '';
  (x && x.fix || []).slice().sort().forEach(function (t) { var ms = Date.parse(t), d = localDay(t); if (!n || (d !== lastD && ms - lastT >= 12 * 3600e3)) { n++; lastT = ms; lastD = d; } });
  return n;
}
function isMistake(x) { return !!(x && x.wrongAt && fixCount(x) < 2); }
function devSum(o, i) { return Object.keys(o || {}).reduce(function (s, k) { return s + (Number(o[k][i]) || 0); }, 0); }
function reviewLog(st, d) { var e = (st.rlog || {})[d] || {}; return [devSum(e, 0), devSum(e, 1)]; }
function newLeftToday(st, t) {
  var srs = st.srs || {}, p = ((st.prefs || {}).study || {}).newPerDay, per = Math.max(5, Math.min(50, Math.floor(Number(p) || 15)));
  var used = Object.keys(srs).filter(function (id) { var c = srs[id]; return (c.fr || (c.reps === 1 ? c.last : '')) === t; }).length;
  return Math.max(0, per - used);
}
var QIX = {};
Object.keys(D.quizzes).forEach(function (k) { (D.quizzes[k] || []).forEach(function (q) { QIX[q.id] = { q: q, set: k }; }); });

/* ---------- the env, for one copy of the progress ---------- */
var TODAY = '2026-11-12'; // a Thursday: its week runs from Monday 9 to Sunday 15 November
function makeEnv(st, today) {
  today = today || TODAY;
  return {
    modules: D.modules, levels: D.levels, quizzes: D.quizzes, projects: D.projects, exercises: D.exercises, labs: D.labs,
    readCards: readCards, labOf: labOf, exOf: exOf, watchKeys: function (m) { return WATCH[m.id] || null; },
    moduleParts: function (m) { return moduleParts(m, st); },
    question: function (qid) { return QIX[qid] ? QIX[qid].q : null; }, questionSet: function (qid) { return QIX[qid] ? QIX[qid].set : null; },
    fixCount: fixCount, isMistake: isMistake,
    heldDays: function (c, d) { d = d || today; return c && !c.off && c.first && c.lg >= 2 ? daysBetween(c.first, d) : 0; },
    reviewLog: function (d) { return reviewLog(st, d); }, newLeftToday: function () { return newLeftToday(st, today); },
    today: function () { return today; }, localDay: localDay, addDays: addDays, daysBetween: daysBetween,
    state: function () { return st; }
  };
}

/* ---------- test progress ---------- */
var ago = function (n) { return addDays(TODAY, -n); };
// an ISO time at a local hour of a day (so the local day is that day in every time zone)
var iso = function (day, h, mi) { return new Date(day + 'T' + pad(h == null ? 10 : h) + ':' + pad(mi || 0) + ':00').toISOString(); };
var NOW = iso(TODAY, 15);
function blank() {
  return { v: 2, prefs: { lang: 'hi', theme: 'system' }, watched: {}, unwatched: {}, quiz: {}, ex: {}, code: {}, labs: {}, projects: {}, modules: {}, notes: {}, notesAt: {},
    last: null, log: {}, pos: {}, posOff: {}, read: {}, srs: {}, rlog: {}, qa: {}, refl: {}, sum: {}, jr: {}, fs: {}, ai: { day: '', d: {} },
    play: { first: '', goal: 30, goalAt: '', rank: 0, goalDay: '', badges: {}, e: {} } };
}
// a review card first graded on day fr (reps 1, due the day after)
function card(fr, o) {
  var c = { s: 1, d: 5, due: fr ? addDays(fr, 1) : TODAY, last: fr || '', first: fr || '', fr: fr || '', lg: fr ? 3 : 0, reps: fr ? 1 : 0, lapses: 0, off: false, at: fr ? iso(fr) : '' };
  Object.keys(o || {}).forEach(function (k) { c[k] = o[k]; });
  return c;
}
// an answered question: o sets n, r, lr, at, wrongAt, fix, ok, f1...
function answer(o) {
  var x = { c: {}, n: 1, r: 1, lr: 1, p: 0, su: 0, at: NOW, wrongAt: '', fix: [], ok: [], src: 'quiz', f1: '' };
  Object.keys(o || {}).forEach(function (k) { x[k] = o[k]; });
  x.c = { dev1: [x.n, x.r, x.at] };
  return x;
}
var facts = function (st, today) { return R.facts(st, makeEnv(st, today)); };
var fact = function (f, k) { return f.filter(function (x) { return x.k === k; })[0] || null; };
var M = D.modules, MID = M.map(function (m) { return m.id; }), L1 = M.filter(function (m) { return m.level === 1; });
var lastOf = function (lv) { var l = M.filter(function (m) { return m.level === lv; }); return l[l.length - 1]; };
var mainKey = function (mid) { return WATCH[mid][0]; }; // the best pick's own key
// a stop with every round done the Play way: cards ticked and checked, term match done, toll gate passed
function finishRounds(st, m, day) {
  day = day || ago(5);
  readCards(m).forEach(function (c) { st.read[m.id + '/' + c.key] = iso(day); st.play.e['qc:' + m.id + '/' + c.key] = day; });
  st.play.e['tm:' + m.id] = day;
  st.quiz[m.id] = { best: 80, attempts: 1, last: 80, at: day, passAt: iso(day) };
}
// every part of a module done (the stop is cleared), each on day
function clearStop(st, m, day) {
  day = day || ago(5);
  readCards(m).forEach(function (c) { st.read[m.id + '/' + c.key] = iso(day); });
  st.watched[mainKey(m.id)] = iso(day);
  var lab = labOf(m); if (lab) { st.labs[lab.id] = {}; lab.tasks.forEach(function (t) { st.labs[lab.id][t.id] = iso(day); }); }
  exOf(m.id).forEach(function (e) { if (!e.optional) st.ex[e.id] = { done: true, at: day }; });
  st.quiz[m.id] = { best: 90, attempts: 1, last: 90, at: day, passAt: iso(day) };
}
function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ======================= 1. constants ======================= */
(function () {
  eq(R.RANKS.map(function (r) { return r.xp; }), [0, 30, 120, 300, 700, 1400, 2600, 4500, 7500, 12000], 'ranks: the 10 thresholds');
  eq(R.RANKS.map(function (r) { return r.name; }), ['Starter', 'Walker', 'Cyclist', 'Scooter rider', 'Auto driver', 'Car driver', 'Bus driver', 'Navigator', 'Road builder', 'Guide'], 'ranks: the 10 names');
  ok(R.RANKS.every(function (r, i) { return r.i === i && typeof r.icon === 'string' && r.icon; }), 'ranks: each has its index and an icon key');
  var cases = [[0, 0], [29, 0], [30, 1], [119, 1], [120, 2], [299, 2], [300, 3], [699, 3], [700, 4], [1399, 4], [1400, 5], [2599, 5], [2600, 6], [4499, 6], [4500, 7], [7499, 7], [7500, 8], [11999, 8], [12000, 9], [99999, 9]];
  ok(cases.every(function (x) { return R.rankOf(x[0]) === x[1]; }), 'rankOf: every threshold and the XP just below it', cases.map(function (x) { return x[0] + '->' + R.rankOf(x[0]); }).join(' '));
  var st = blank(); st.play.rank = 5;
  ok(R.shownRank(0, st) === 5 && R.shownRank(12000, st) === 9, 'the rank shown never goes below play.rank (and rises with XP)');
  st.play.rank = 2; ok(R.shownRank(1400, st) === 5, 'XP above play.rank shows the XP rank');
  var ri = R.rankInfo(200, blank());
  ok(ri.i === 2 && ri.name === 'Cyclist' && ri.toNext === 100 && Math.abs(ri.pct - 80 / 180) < 1e-9 && ri.next.name === 'Scooter rider', 'rankInfo: rank, XP to the next rank and the bar', ri);
  ok(R.rankInfo(20000, blank()).next === null && R.rankInfo(20000, blank()).pct === 1, 'rankInfo at the top rank');
  var want = { qc: 10, kt: 3, q: 5, qp: 20, qf: 10, w: 20, l: 10, x: 20, st: 50, pm: 10, pd: 50, tm: 10, fx: 10, rv: 2, fs: 10 };
  eq(R.XP_TABLE.map(function (r) { return r.kind; }), Object.keys(want), 'XP table: the 15 kinds in order');
  ok(R.XP_TABLE.every(function (r) { return r.xp === want[r.kind] && R.XP[r.kind] === r.xp && r.label && r.what; }), 'XP table: the XP of each kind, with a label and a description');
  ok(R.XP.qpTest === 100 && R.XP.qfTest === 50 && R.RV_CAP === 20 && R.FS_CAP === 3 && R.FS_MIN === 10, 'XP table: level tests 100 / 50, review cap 20, focus cap 3 of 10+ minutes');
  // ux-10: a checkpoint's XP has its own row on How Play works (whatTest), so the toll gate rows carry no brackets
  eq(R.XP_TABLE.filter(function (r) { return r.xpTest; }).map(function (r) { return [r.kind, r.what, r.xp, r.whatTest, r.xpTest]; }),
    [['qp', 'A toll gate passed (70% or more)', 20, 'A checkpoint passed (70% or more)', 100], ['qf', 'Full marks at a toll gate', 10, 'Full marks at a checkpoint', 50]], 'XP table (ux-10): the toll gate rows without brackets; a checkpoint\'s pass (100) and full marks (50) in rows of their own');
  ok(R.XP_TABLE.every(function (r) { return !/\(a checkpoint/.test(r.what) && (!r.xpTest || r.xpTest === R.XP[r.kind + 'Test']); }), 'XP table (ux-10): no "(a checkpoint: …)" left, and the checkpoint XP is the rules\' own');
  eq(R.GOALS.map(function (g) { return g.xp; }), [20, 30, 50], 'goals: Light 20, Steady 30, Strong 50');
  st = blank(); ok(R.goalOf(st) === 30, 'goal: Steady is the default');
  st.play.goal = 50; ok(R.goalOf(st) === 50, 'goal: a chosen goal');
  st.play.goal = 45; ok(R.goalOf(st) === 30, 'goal: an unknown value falls back to 30');
  ok(R.goalOf({}) === 30, 'goal: no play part yet');
  ok(R.BADGES.length === 26, 'badges: 26', R.BADGES.length);
  var ids = R.BADGES.map(function (b) { return b.id; }), groups = {};
  ok(ids.every(function (id, i) { return /^[a-z0-9-]{2,24}$/.test(id) && ids.indexOf(id) === i; }), 'badges: ids are unique and fit the saved format');
  R.BADGES.forEach(function (b) { groups[b.group] = (groups[b.group] || 0) + 1; });
  eq(groups, { Start: 4, Learning: 8, Checkpoints: 4, 'Hands-on': 4, 'Habit and memory': 5, Finale: 1 }, 'badges: the groups');
  eq(ids, ['first-check', 'first-quiz', 'first-gate', 'first-stop', 'checks-50', 'checks-all', 'terms-50', 'terms-all', 'right-100', 'full-marks', 'gates-10', 'fixer-10', 'permit-1', 'permit-2', 'permit-3', 'permit-4', 'lab-1', 'code-10', 'watch-5', 'project-1', 'week-1', 'weeks-4', 'days-30', 'review-100', 'long-memory', 'whole-road'], 'badges: the SPEC list');
  ok(R.BADGES.every(function (b) { return b.name && b.cond && b.icon && typeof b.test === 'function' && typeof b.progress === 'function'; }), 'badges: each has a name, a condition text, an icon, test() and progress()');
  // ux-18: plain wording for the conditions the review named
  var cond = {}; R.BADGES.forEach(function (b) { cond[b.id] = b.cond; });
  eq([cond['first-stop'], cond['weeks-4'], cond['days-30'], cond['permit-1'], cond['permit-4']], ['Earn every stamp at one stop', 'Have 4 steady weeks of 3 learning days (they need not be in a row)', 'Learn on 30 days (they need not be in a row)',
    'Pass Checkpoint 1 (the Level 1 test) with 70% or more', 'Pass Checkpoint 4 (the Level 4 test) with 70% or more'], 'badges (ux-18): "Earn every stamp at one stop", "(they need not be in a row)", a capital "Checkpoint 1"');
  ok(R.BADGES.every(function (b) { return !/not always in a row|checkpoint \d/.test(b.cond); }), 'badges (ux-18): no "not always in a row", no lower-case "checkpoint 1"');
})();

/* ======================= 2. an empty progress ======================= */
(function () {
  var st = blank(), env = makeEnv(st), f = R.facts(st, env);
  ok(Array.isArray(f) && f.length === 0 && R.xp(f) === 0, 'empty progress: no facts, 0 XP');
  var x = R.badgeContext(st, f, env), on = R.BADGES.filter(function (b) { return b.test(x); }).map(function (b) { return b.id; });
  ok(on.length === 0, 'empty progress: no badge fires', on);
  ok(R.BADGES.every(function (b) { var p = b.progress(x); return p && p.n === 0 && p.of > 0 && typeof p.text === 'string' && p.text; }), 'empty progress: every badge shows 0 progress with a text', R.BADGES.map(function (b) { return b.id + ':' + J(b.progress(x)); }).join(' '));
  var o = R.observe(st, f, env);
  ok(o.n === 0 && !Object.keys(o.e).length && !Object.keys(o.badges).length, 'empty progress: nothing to record', o);
  var bare = { v: 2 };
  ok(R.facts(bare, makeEnv(bare)).length === 0 && R.observe(bare, [], makeEnv(bare)).n === 0, 'a progress with no study parts and no play part: no facts, nothing recorded');
  var q = R.quests(st, f, env);
  eq(q.map(function (y) { return [y.id, y.text, y.n, y.of, y.done]; }), [['warm', 'Check 1 lesson card', 0, 1, false], ['new', 'Check 2 lesson cards', 0, 2, false], ['hands', 'Do 1 hands-on task', 0, 1, false]], 'empty progress: the three quests');
  var bl = R.badgeList(st, f, env);
  ok(bl.length === 26 && bl.every(function (b) { return b.earned === '' && b.on === false; }), 'empty progress: the badge list shows every badge, none earned');
})();

/* ======================= 3. every fact kind ======================= */
(function () {
  var st = blank(), m = M[1], mid = m.id; // Stop 1.2
  // qc and kt from the review cards
  st.srs['rc:' + mid + ':overview'] = card(TODAY);
  st.srs['rc:' + mid + ':outcomes'] = card(ago(10));
  st.srs['rc:' + mid + ':studySteps'] = card('', {}); // enrolled, never graded: not checked yet
  st.srs['rc:' + mid + ':noSuchCard'] = card(TODAY);
  st.srs['rc:nope:overview'] = card(TODAY);
  st.srs['kt:' + mid + ':3'] = card(ago(2));
  st.srs['kt:' + mid + ':99'] = card(ago(2));
  st.srs['kt:' + mid + ':x'] = card(ago(2));
  var f = facts(st);
  ok(fact(f, 'qc:' + mid + '/overview') && fact(f, 'qc:' + mid + '/overview').day === TODAY && fact(f, 'qc:' + mid + '/overview').xp === 10, 'qc: a card first graded today is checked today, 10 XP');
  ok(fact(f, 'qc:' + mid + '/outcomes').day === ago(10), 'qc: dated by srs fr');
  ok(!fact(f, 'qc:' + mid + '/studySteps'), 'qc: a card in review but never graded is not checked');
  ok(!fact(f, 'qc:' + mid + '/noSuchCard') && !fact(f, 'qc:nope/overview'), 'qc: only real lesson cards count');
  ok(fact(f, 'kt:' + mid + ':3').xp === 3 && fact(f, 'kt:' + mid + ':3').day === ago(2), 'kt: a key term first reviewed, 3 XP, dated by fr');
  ok(!fact(f, 'kt:' + mid + ':99') && !fact(f, 'kt:' + mid + ':x'), 'kt: only real key terms count');
  // the quick check recorded in play.e: the earlier of e and fr
  st.play.e['qc:' + mid + '/overview'] = ago(3);
  st.play.e['qc:' + mid + '/outcomes'] = ago(4);
  st.play.e['qc:' + mid + '/keyTerms'] = TODAY; // Play's quick check with "Not yet": no fr yet
  st.play.e['qc:' + mid + '/indiaExample'] = R.UNDATED;
  f = facts(st);
  ok(fact(f, 'qc:' + mid + '/overview').day === ago(3), 'qc: a recorded day earlier than fr wins');
  ok(fact(f, 'qc:' + mid + '/outcomes').day === ago(10), 'qc: fr earlier than the recorded day wins');
  ok(fact(f, 'qc:' + mid + '/keyTerms').day === TODAY && fact(f, 'qc:' + mid + '/keyTerms').xp === 10, 'qc: Play\'s quick check counts with any answer (recorded in play.e)');
  ok(fact(f, 'qc:' + mid + '/indiaExample').day === '' && fact(f, 'qc:' + mid + '/indiaExample').xp === 10, 'qc: recorded undated (0000-00-00) counts in the total, not today');
  ok(f.filter(function (x) { return x.k === 'qc:' + mid + '/overview'; }).length === 1, 'a fact appears once');

  // q: f1, then ok when r <= ok.length, else undated
  st = blank();
  var q1 = M[0].id + '-q01', q2 = M[0].id + '-q02', q3 = M[0].id + '-q03', q4 = M[0].id + '-q04', q5 = 'test-l1-q01';
  st.qa[q1] = answer({ r: 1, f1: iso(TODAY, 9), ok: [iso(ago(9))] });
  st.qa[q2] = answer({ n: 3, r: 2, f1: '', ok: [iso(ago(1)), iso(ago(3))] });
  st.qa[q3] = answer({ n: 9, r: 8, f1: '', ok: [iso(ago(6)), iso(ago(5)), iso(ago(4)), iso(ago(3)), iso(ago(2)), iso(ago(1))] });
  st.qa[q4] = answer({ n: 2, r: 0, lr: 0 });
  st.qa[q5] = answer({ r: 1, f1: iso(ago(1)) });
  st.qa['made-up-question'] = answer({ r: 1, f1: NOW });
  f = facts(st);
  ok(fact(f, 'q:' + q1).day === TODAY && fact(f, 'q:' + q1).xp === 5, 'q: dated by f1 (5 XP)');
  ok(fact(f, 'q:' + q2).day === ago(3), 'q: no f1, every right answer kept (r <= ok.length): the earliest ok');
  ok(fact(f, 'q:' + q3).day === '', 'q: no f1 and right answers not all kept: undated');
  ok(!fact(f, 'q:' + q4), 'q: never right: no fact');
  ok(fact(f, 'q:' + q5).day === ago(1), 'q: a level-test question counts too');
  ok(!fact(f, 'q:made-up-question'), 'q: only authored questions count');

  // qp / qf
  st = blank();
  st.quiz[M[0].id] = { best: 85, attempts: 2, last: 85, at: TODAY, passAt: iso(TODAY, 8) };
  st.quiz[M[1].id] = { best: 100, attempts: 1, last: 100, at: ago(2), passAt: iso(ago(2)), perfAt: iso(ago(2)) };
  st.quiz[M[2].id] = { best: 90, attempts: 1, last: 90, at: ago(30) };
  st.quiz[M[3].id] = { best: 60, attempts: 3, last: 60, at: TODAY };
  st.quiz['test-l1'] = { best: 100, attempts: 1, last: 100, at: TODAY, passAt: iso(TODAY), perfAt: iso(TODAY) };
  st.quiz.mixed = { best: 100, attempts: 1, last: 100, at: TODAY };
  f = facts(st);
  ok(fact(f, 'qp:' + M[0].id).xp === 20 && fact(f, 'qp:' + M[0].id).day === TODAY && !fact(f, 'qf:' + M[0].id), 'qp: a toll gate passed, 20 XP, dated by passAt');
  ok(fact(f, 'qp:' + M[1].id).day === ago(2) && fact(f, 'qf:' + M[1].id).xp === 10 && fact(f, 'qf:' + M[1].id).day === ago(2), 'qf: full marks, 10 XP, dated by perfAt');
  ok(fact(f, 'qp:' + M[2].id).day === '', 'qp: passed before passAt existed: undated');
  ok(!fact(f, 'qp:' + M[3].id), 'qp: 60% is not a pass');
  ok(fact(f, 'qp:test-l1').xp === 100 && fact(f, 'qf:test-l1').xp === 50, 'qp / qf: a checkpoint is worth 100 and 50');
  ok(!fact(f, 'qp:mixed') && !fact(f, 'qf:mixed'), 'qp: only module quizzes and level tests');

  // w: the module's Watch part
  st = blank();
  var a = M[0].id, b = M[5].id, cMod = M[1].id;
  st.watched[mainKey(a)] = iso(TODAY, 11);
  var sharedB = WATCH[b].filter(function (k) { return k.indexOf('|') > 0; })[0];
  st.watched[sharedB] = iso(ago(1)); // a shared playlist ticked on this module's page
  st.watched[mainKey(cMod)] = '1970-01-01'; // an old tick with no time
  var other = PICKS[M[2].id].list.filter(function (r) { return WATCH[M[2].id].indexOf(r.id) < 0; })[0];
  if (other) st.watched[other.id] = NOW; // a resource that does not count for the Watch part
  f = facts(st);
  ok(fact(f, 'w:' + a).xp === 20 && fact(f, 'w:' + a).day === TODAY, 'w: the best pick finished today, 20 XP');
  ok(fact(f, 'w:' + b) && fact(f, 'w:' + b).day === ago(1), 'w: a shared playlist ticked for this module (module|resource key)');
  ok(fact(f, 'w:' + cMod) && fact(f, 'w:' + cMod).day === '', 'w: a 1970-01-01 tick is undated');
  ok(!other || !fact(f, 'w:' + M[2].id), 'w: a video that is not the best pick or Recommended does not give the stamp');
  st.watched[WATCH[a][1]] = '1970-01-01';
  ok(fact(facts(st), 'w:' + a).day === '', 'w: when any qualifying tick is undated, the stamp is undated');
  delete st.watched[WATCH[a][1]];
  st.watched[WATCH[a][1]] = ago(3); // an older copy kept a day
  ok(fact(facts(st), 'w:' + a).day === ago(3), 'w: the earliest qualifying tick (a day kept by an older copy)');
  // the parity of watch keys with isTicked: every key in WATCH counts, and only those
  var wk = 0;
  D.modules.forEach(function (mm) { (WATCH[mm.id] || []).forEach(function (k) { var s2 = blank(); s2.watched[k] = NOW; if (moduleParts(mm, s2).filter(function (p) { return p.k === 'Watch the main lesson'; })[0].done && fact(facts(s2), 'w:' + mm.id)) wk++; }); });
  ok(wk === D.modules.reduce(function (n, mm) { return n + (WATCH[mm.id] || []).length; }, 0), 'w: every watch key of every module gives the Watch part and the w fact', wk);

  // l: lab tasks
  st = blank();
  var lab = labOf(M[0]);
  st.labs[lab.id] = {}; st.labs[lab.id][lab.tasks[0].id] = iso(TODAY); st.labs[lab.id][lab.tasks[1].id] = true; st.labs[lab.id][lab.tasks[2].id] = false;
  st.labs.nolab = { t1: iso(TODAY) };
  f = facts(st);
  ok(fact(f, 'l:' + lab.id + '/' + lab.tasks[0].id).xp === 10 && fact(f, 'l:' + lab.id + '/' + lab.tasks[0].id).day === TODAY, 'l: a lab task ticked with a time, 10 XP');
  ok(fact(f, 'l:' + lab.id + '/' + lab.tasks[1].id).day === '', 'l: an older tick (true) is undated');
  ok(!fact(f, 'l:' + lab.id + '/' + lab.tasks[2].id) && !fact(f, 'l:nolab/t1'), 'l: only ticked tasks of real labs');

  // x: exercises
  st = blank();
  var req = D.exercises.filter(function (e) { return !e.optional; }), e0 = req[0], e1 = req[1], eo = D.exercises.filter(function (e) { return e.optional; })[0];
  st.ex[e0.id] = { done: true, at: TODAY }; st.ex[e1.id] = { done: false, tries: 3 }; st.ex[eo.id] = { done: true, at: ago(1) }; st.ex.fake = { done: true, at: TODAY };
  f = facts(st);
  ok(fact(f, 'x:' + e0.id).xp === 20 && fact(f, 'x:' + e0.id).day === TODAY, 'x: an exercise solved, 20 XP, dated by ex.at');
  ok(!fact(f, 'x:' + e1.id) && !fact(f, 'x:fake'), 'x: unsolved or unknown exercises do not count');
  ok(fact(f, 'x:' + eo.id), 'x: an optional exercise counts too');

  // pm / pd: projects
  st = blank();
  var p = D.projects[0];
  st.projects[p.id] = { steps: { 0: true, 1: true, 2: false, 99: true }, stepsAt: { 0: iso(ago(3)), 1: iso(TODAY) }, done: true, doneAt: iso(TODAY) };
  st.projects['p-fake'] = { steps: { 0: true }, done: true };
  f = facts(st);
  ok(fact(f, 'pm:' + p.id + '/0').day === ago(3) && fact(f, 'pm:' + p.id + '/1').day === TODAY && fact(f, 'pm:' + p.id + '/0').xp === 10, 'pm: milestones ticked, 10 XP, dated by stepsAt');
  ok(!fact(f, 'pm:' + p.id + '/2') && !fact(f, 'pm:' + p.id + '/99'), 'pm: unticked or unknown milestones do not count');
  ok(fact(f, 'pd:' + p.id).xp === 50 && fact(f, 'pd:' + p.id).day === TODAY && !fact(f, 'pd:p-fake'), 'pd: a project finished, 50 XP, dated by doneAt');

  // tm: only from play.e
  st = blank(); st.play.e['tm:' + mid] = TODAY;
  f = facts(st);
  ok(fact(f, 'tm:' + mid).xp === 10 && fact(f, 'tm:' + mid).day === TODAY, 'tm: a term match recorded, 10 XP');

  // fx: a mistake fixed (two right answers on different days, 12+ hours apart)
  st = blank();
  var qa = M[0].id + '-q05', qb = M[0].id + '-q06', qc2 = M[0].id + '-q07';
  st.qa[qa] = answer({ n: 3, r: 2, wrongAt: iso(ago(3), 9), fix: [iso(ago(2), 9), iso(ago(1), 10)], ok: [iso(ago(2), 9), iso(ago(1), 10)] });
  st.qa[qb] = answer({ n: 2, r: 1, wrongAt: iso(ago(3), 9), fix: [iso(ago(2), 9)] });
  st.qa[qc2] = answer({ n: 4, r: 3, wrongAt: iso(ago(5), 9), fix: [iso(ago(4), 8), iso(ago(4), 22), iso(TODAY, 9)] });
  f = facts(st);
  ok(fact(f, 'fx:' + qa).xp === 10 && fact(f, 'fx:' + qa).day === ago(1), 'fx: fixed on the day the second right answer counted');
  ok(!fact(f, 'fx:' + qb), 'fx: one right answer since the mistake is not a fix');
  ok(fact(f, 'fx:' + qc2).day === TODAY, 'fx: two right answers on one day count once (the replay of fixCount)');

  // rv: reviews, capped at 20 a day
  st = blank();
  st.rlog[TODAY] = { dev1: [15, 10, NOW], dev2: [12, 8, NOW] };
  st.rlog[ago(1)] = { dev1: [5, 4, iso(ago(1))] };
  st.rlog[ago(2)] = { legacy: [3, 3] };
  f = facts(st);
  ok(fact(f, 'rv:' + TODAY).xp === 40 && fact(f, 'rv:' + TODAY).n === 20, 'rv: 27 reviews on two devices count as 20 (40 XP)');
  ok(fact(f, 'rv:' + ago(1)).xp === 10 && fact(f, 'rv:' + ago(2)).xp === 6, 'rv: 2 XP a review, older copies too');
  eq(R.bySource(f, TODAY), [{ kind: 'rv', label: 'Reviews', n: 20, xp: 40 }], 'bySource counts reviews, not days');

  // fs: focus sessions of 10+ minutes, 3 a day
  st = blank();
  for (var i = 0; i < 5; i++) st.fs['f' + i] = { at: iso(TODAY, 8 + i), mins: 25, plan: 25, done: true, intent: '', mod: '', del: false };
  st.fs.short = { at: iso(TODAY, 20), mins: 9, plan: 25, done: false, intent: '', mod: '', del: false };
  st.fs.gone = { at: iso(ago(1), 9), mins: 0, plan: 0, done: false, intent: '', mod: '', del: true };
  st.fs.old = { at: iso(ago(1), 9), mins: 10, plan: 10, done: true, intent: '', mod: '', del: false };
  f = facts(st);
  var fsToday = f.filter(function (x) { return x.kind === 'fs' && x.day === TODAY; });
  ok(fsToday.length === 3 && R.xpOn(f, TODAY) === 30, 'fs: at most 3 focus sessions a day (30 XP)', fsToday.map(function (x) { return x.k; }));
  eq(fsToday.map(function (x) { return x.k; }), ['fs:f0', 'fs:f1', 'fs:f2'], 'fs: the first 3 of the day count');
  ok(!fact(f, 'fs:short') && !fact(f, 'fs:gone') && fact(f, 'fs:old') && fact(f, 'fs:old').day === ago(1), 'fs: 9 minutes or deleted do not count; exactly 10 minutes does');
})();

/* ======================= 4. stops cleared ======================= */
(function () {
  var st = blank(), m = M[3], mid = m.id;
  clearStop(st, m, ago(5));
  st.read[mid + '/overview'] = iso(ago(2)); // the latest part
  var f = facts(st), s = fact(f, 'st:' + mid);
  ok(s && s.xp === 50 && s.day === ago(2), 'st: every part done, 50 XP, dated by the latest part', s);
  var lab = labOf(m);
  st.labs[lab.id][lab.tasks[0].id] = true;
  ok(fact(facts(st), 'st:' + mid).day === '', 'st: a part with an undated item makes the stop undated');
  st.labs[lab.id][lab.tasks[0].id] = iso(ago(5));
  delete st.quiz[mid].passAt;
  ok(fact(facts(st), 'st:' + mid).day === '', 'st: a quiz passed with no passAt makes it undated');
  st.quiz[mid].passAt = iso(ago(5));
  st.quiz[mid].best = 65;
  ok(!fact(facts(st), 'st:' + mid), 'st: a quiz under 70% leaves the stop not cleared');
  st.quiz[mid].best = 90;
  delete st.watched[mainKey(mid)];
  ok(!fact(facts(st), 'st:' + mid), 'st: the Watch part is needed');
  // Mark complete gives nothing
  var mk = blank();
  M.forEach(function (mm) { mk.modules[mm.id] = { done: true, at: NOW }; });
  ok(facts(mk).length === 0, 'Mark complete gives nothing: no stop cleared, no XP');
  // partsOf agrees with Learn's moduleParts on random progress
  var rnd = rng(7), diffs = [];
  for (var run = 0; run < 60; run++) {
    var r = blank();
    M.forEach(function (mm) {
      readCards(mm).forEach(function (c) { var x = rnd(); if (x < 0.5) r.read[mm.id + '/' + c.key] = iso(ago(Math.floor(rnd() * 9))); else if (x < 0.6) r.read[mm.id + '/' + c.key] = '-' + NOW; });
      (WATCH[mm.id] || []).forEach(function (k) { if (rnd() < 0.15) r.watched[k] = rnd() < 0.2 ? '1970-01-01' : iso(ago(2)); });
      PICKS[mm.id].list.forEach(function (res) { if (rnd() < 0.05) r.watched[res.id] = NOW; });
      var lb = labOf(mm); if (lb && rnd() < 0.6) { r.labs[lb.id] = {}; lb.tasks.forEach(function (t) { if (rnd() < 0.7) r.labs[lb.id][t.id] = rnd() < 0.3 ? true : NOW; }); }
      exOf(mm.id).forEach(function (e) { if (rnd() < 0.6) r.ex[e.id] = { done: rnd() < 0.8, at: TODAY }; });
      if (rnd() < 0.6) { var bst = Math.floor(rnd() * 101); r.quiz[mm.id] = { best: bst, attempts: 1, last: bst, at: TODAY }; }
    });
    var env = makeEnv(r);
    M.forEach(function (mm) {
      var a = R.partsOf(mm, r, env).map(function (p) { return [p.k, p.done, p.n, p.of]; }), b = moduleParts(mm, r).map(function (p) { return [p.k, p.done, p.n, p.of]; });
      if (J(a) !== J(b)) diffs.push(mm.id + ' ' + J(a) + ' vs ' + J(b));
    });
  }
  ok(diffs.length === 0, 'partsOf agrees with Learn\'s moduleParts on 60 random progress copies (27 modules each)', diffs.slice(0, 3));
  // stamps
  st = blank(); clearStop(st, M[1], ago(1)); st.read[M[1].id + '/overview'] = '-' + NOW; st.quiz[M[1].id] = { best: 60, attempts: 2, last: 60, at: TODAY };
  var sts = R.stamps(M[1], makeEnv(st), st);
  eq(sts.map(function (x) { return [x.key, x.label, x.done, x.text]; }), [['read', 'Read', false, '6/7'], ['watch', 'Watch', true, ''], ['lab', 'Lab', true, '4/4'], ['code', 'Code', true, '5/5'], ['quiz', 'Quiz', false, 'best 60%']], 'stamps: Read 6/7, Watch, Lab 4/4, Code 5/5, Quiz best 60%');
  var stEnv = makeEnv(st);
  ok(J(R.stamps(M[1], stEnv)) === J(sts), 'stamps: with no state given, env.state() is used');
  eq(R.stamps(M[0], makeEnv(blank()), blank()).map(function (x) { return x.key; }), ['read', 'watch', 'lab', 'quiz'], 'stamps: a module with only an optional exercise has no Code stamp');
  ok(R.stamps(M[0], makeEnv(blank()), blank()).filter(function (x) { return x.key === 'quiz'; })[0].text === '', 'stamps: a quiz not tried shows no score');
})();

/* ======================= 5. dates, farming and first visits ======================= */
(function () {
  // a learner with a lot of older, undated work opens Play for the first time: a big total, nothing today
  var st = blank();
  M.slice(0, 10).forEach(function (m) {
    readCards(m).forEach(function (c) { st.read[m.id + '/' + c.key] = '2026-01-15'; });
    st.watched[mainKey(m.id)] = '1970-01-01';
    var lab = labOf(m); st.labs[lab.id] = {}; lab.tasks.forEach(function (t) { st.labs[lab.id][t.id] = true; });
    exOf(m.id).forEach(function (e) { st.ex[e.id] = { done: true, at: '2026-02-01' }; });
    st.quiz[m.id] = { best: 100, attempts: 3, last: 100, at: '2026-02-01' };
    (D.quizzes[m.id] || []).forEach(function (q) { st.qa[q.id] = answer({ n: 9, r: 8, at: iso('2026-02-01'), ok: [iso('2026-02-01')] }); });
  });
  st.projects[D.projects[0].id] = { steps: { 0: true, 1: true }, done: true };
  var f = facts(st), total = R.xp(f);
  ok(total >= 2000 && R.xpOn(f, TODAY) === 0, 'first visit with old undated progress: a big total (' + total + ' XP), 0 XP today');
  var env = makeEnv(st), o = R.observe(st, f, env);
  ok(Object.keys(o.e).every(function (k) { return o.e[k] === R.UNDATED || /^\d{4}-\d{2}-\d{2}$/.test(o.e[k]); }) && o.e['w:' + M[0].id] === R.UNDATED && o.e['st:' + M[0].id] === R.UNDATED, 'observe: undated facts are recorded as 0000-00-00');
  ok(o.e['pm:' + D.projects[0].id + '/0'] === R.UNDATED && o.e['pd:' + D.projects[0].id] === R.UNDATED, 'observe: undated project facts too');
  var before = J(st);
  R.observe(st, f, env);
  ok(J(st) === before, 'observe does not change the progress');
  ok(R.applyObserved(st, o, NOW) === o.n && R.observe(st, R.facts(st, env), env).n === 0, 'applyObserved writes everything observe found; observing again finds nothing');
  ok(Object.keys(o.badges).length > 0 && Object.keys(o.badges).every(function (id) { return st.play.badges[id] === NOW; }), 'applyObserved stores badges with the time given');
  ok(R.xpOn(R.facts(st, env), TODAY) === 0 && R.xp(R.facts(st, env)) === total, 'recording changes neither the total nor today');

  // re-tick farming: recorded facts never move to today
  st = blank();
  var m = M[2], mid = m.id, p = D.projects[1];
  clearStop(st, m, ago(6));
  st.srs['rc:' + mid + ':overview'] = card(ago(6));
  st.projects[p.id] = { steps: { 0: true }, stepsAt: { 0: iso(ago(6)) } };
  env = makeEnv(st);
  R.applyObserved(st, R.observe(st, R.facts(st, env), env), iso(ago(6)));
  ok(st.play.e['w:' + mid] === ago(6) && st.play.e['st:' + mid] === ago(6) && st.play.e['pm:' + p.id + '/0'] === ago(6) && st.play.e['qc:' + mid + '/overview'] === ago(6), 'observe records w, st, pm and qc with their days');
  var t0 = R.xpOn(R.facts(st, env), TODAY);
  // un-tick and tick again today: the video, a lesson card, the milestone
  delete st.watched[mainKey(mid)]; st.unwatched[mainKey(mid)] = iso(TODAY, 9);
  st.read[mid + '/overview'] = '-' + iso(TODAY, 9);
  st.projects[p.id].steps[0] = false; st.projects[p.id].stepsAt[0] = iso(TODAY, 9);
  f = R.facts(st, env);
  ok(fact(f, 'w:' + mid) && fact(f, 'st:' + mid) && fact(f, 'pm:' + p.id + '/0'), 'un-ticked: the recorded facts still count');
  st.watched[mainKey(mid)] = iso(TODAY, 10); delete st.unwatched[mainKey(mid)];
  st.read[mid + '/overview'] = iso(TODAY, 10);
  st.projects[p.id].steps[0] = true; st.projects[p.id].stepsAt[0] = iso(TODAY, 10);
  f = R.facts(st, env);
  ok(fact(f, 'w:' + mid).day === ago(6) && fact(f, 'st:' + mid).day === ago(6) && fact(f, 'pm:' + p.id + '/0').day === ago(6) && fact(f, 'qc:' + mid + '/overview').day === ago(6), 're-tick farming: w, st, pm and qc keep their recorded days');
  ok(R.xpOn(f, TODAY) === t0 && t0 === 0, 're-tick farming: no new XP today', R.xpOn(f, TODAY));
  var o2 = R.observe(st, f, env);
  ok(!o2.e['w:' + mid] && !o2.e['st:' + mid] && !o2.e['pm:' + p.id + '/0'], 'observe never records a recorded fact again');

  // undone recorded facts still count
  st = blank(); p = D.projects[2];
  st.projects[p.id] = { steps: { 0: true }, stepsAt: { 0: iso(ago(2)) }, done: true, doneAt: iso(ago(2)) };
  env = makeEnv(st);
  R.applyObserved(st, R.observe(st, R.facts(st, env), env), NOW);
  st.projects[p.id].done = false; st.projects[p.id].doneAt = NOW;
  f = R.facts(st, env);
  ok(fact(f, 'pd:' + p.id) && fact(f, 'pd:' + p.id).day === ago(2) && fact(f, 'pd:' + p.id).xp === 50, 'an undone recorded fact (a project marked in progress again) still counts');
  st.play.e['st:no-such-module'] = ago(9);
  ok(fact(R.facts(st, env), 'st:no-such-module').xp === 50, 'a recorded fact counts even when its source is gone');
  st.play.e['q:' + M[0].id + '-q01'] = TODAY; st.play.e['zz:thing'] = TODAY;
  f = R.facts(st, env);
  ok(!fact(f, 'q:' + M[0].id + '-q01') && !fact(f, 'zz:thing'), 'play.e entries of kinds Play does not keep are ignored');

  // a wrong answer after a fix: no XP lost
  st = blank();
  var qid = M[0].id + '-q02';
  st.qa[qid] = answer({ n: 3, r: 2, wrongAt: iso(ago(5)), fix: [iso(ago(4)), iso(ago(3))], ok: [iso(ago(4)), iso(ago(3))], f1: iso(ago(4)) });
  env = makeEnv(st);
  R.applyObserved(st, R.observe(st, R.facts(st, env), env), NOW);
  var x0 = R.xp(R.facts(st, env));
  st.qa[qid] = answer({ n: 4, r: 2, lr: 0, at: NOW, wrongAt: NOW, fix: [], ok: [iso(ago(4)), iso(ago(3))], f1: iso(ago(4)) });
  f = R.facts(st, env);
  ok(R.xp(f) === x0 && fact(f, 'fx:' + qid) && fact(f, 'fx:' + qid).day === ago(3), 'a wrong answer after a fix: no XP lost (fx is kept)', [x0, R.xp(f)]);
  ok(R.gained(R.facts(st, env), f).xp === 0, 'gained() is never negative');

  // the goal cannot be met by Got it taps alone
  st = blank();
  M.slice(0, 3).forEach(function (mm) { readCards(mm).forEach(function (c) { st.read[mm.id + '/' + c.key] = iso(TODAY, 9); }); });
  st.log[TODAY] = 21;
  f = facts(st);
  ok(R.xpOn(f, TODAY) === 0 && R.xp(f) === 0, 'Got it taps alone earn 0 XP (the goal cannot be met by ticking cards)');
})();

/* ======================= 6. time zones ======================= */
(function () {
  // times near midnight: the fact's day is the learner's local day, in this time zone
  var st = blank(), t1 = new Date(Date.UTC(2026, 10, 11, 20, 0, 0)).toISOString(), t2 = new Date(Date.UTC(2026, 10, 12, 20, 30, 0)).toISOString();
  st.qa[M[0].id + '-q01'] = answer({ f1: t1 });
  st.qa[M[0].id + '-q02'] = answer({ f1: t2 });
  st.ex[D.exercises[0].id] = { done: true, at: '2026-11-12' };
  var f = facts(st), want = (localDay(t1) === TODAY ? 5 : 0) + (localDay(t2) === TODAY ? 5 : 0) + 20;
  ok(fact(f, 'q:' + M[0].id + '-q01').day === localDay(t1) && fact(f, 'q:' + M[0].id + '-q02').day === localDay(t2), 'facts use the local day of an ISO time (' + process.env.TZ + ': ' + localDay(t1) + ', ' + localDay(t2) + ')');
  ok(R.xpOn(f, TODAY) === want, 'today\'s XP follows the local day', [R.xpOn(f, TODAY), want]);
  ok(fact(f, 'x:' + D.exercises[0].id).day === '2026-11-12', 'a saved day (ex.at) is used as it is, never shifted by the time zone');
})();

/* ======================= 7. observe, record and the saved format ======================= */
(function () {
  var st = blank(), env;
  var m = M[0];
  clearStop(st, m, ago(1));
  st.srs['rc:' + m.id + ':overview'] = card(TODAY);
  st.srs['kt:' + m.id + ':0'] = card(TODAY);
  st.qa[m.id + '-q01'] = answer({ f1: NOW, wrongAt: iso(ago(3)), fix: [iso(ago(2)), iso(ago(1))], n: 3, r: 2 });
  st.projects[D.projects[0].id] = { steps: { 0: true }, stepsAt: { 0: NOW }, done: true, doneAt: NOW };
  st.rlog[TODAY] = { d: [3, 3, NOW] };
  st.fs.a = { at: NOW, mins: 30, plan: 30, done: true, intent: '', mod: '', del: false };
  env = makeEnv(st);
  var f = R.facts(st, env), o = R.observe(st, f, env);
  var kinds = {}; Object.keys(o.e).forEach(function (k) { kinds[k.slice(0, k.indexOf(':'))] = 1; });
  eq(Object.keys(kinds).sort(), ['fx', 'pd', 'pm', 'qc', 'st', 'w'], 'observe records exactly the kinds w, st, pm, pd, fx and qc');
  ok(Object.keys(o.e).every(function (k) { return /^[a-z]{1,3}:[\w.\/:|~-]{1,120}$/.test(k) && /^\d{4}-\d{2}-\d{2}$/.test(o.e[k]); }), 'observe: every key and day fits the play part\'s saved format');
  ok(o.badges['first-check'] && o.badges['first-quiz'] && o.badges['first-gate'] && o.badges['first-stop'] && o.badges['project-1'] && !o.badges['checks-50'], 'observe: the badges earned now', o.badges);
  st.play.badges['first-check'] = iso(ago(9));
  o = R.observe(st, f, env);
  ok(!o.badges['first-check'], 'observe: a stored badge is not earned again');
  ok(R.applyObserved(st, o, NOW) === o.n && st.play.badges['first-check'] === iso(ago(9)), 'applyObserved keeps the time of a badge already stored');
  var s2 = blank(); delete s2.play;
  ok(R.record(s2, 'tm:' + m.id, TODAY) === true && s2.play.e['tm:' + m.id] === TODAY, 'record: a term match recorded at the moment it is done (the play part is made when missing)');
  ok(R.record(s2, 'tm:' + m.id, addDays(TODAY, 1)) === false && s2.play.e['tm:' + m.id] === TODAY, 'record: only once; the first day stays');
  ok(R.record(s2, 'qc:' + m.id + '/overview') === true && s2.play.e['qc:' + m.id + '/overview'] === R.UNDATED, 'record with no day: 0000-00-00');
  var s3 = blank(); s3.play = 'damaged';
  ok(R.applyObserved(s3, { e: { 'w:x': TODAY }, badges: { 'first-check': true } }, NOW) === 2 && s3.play.e['w:x'] === TODAY && s3.play.badges['first-check'] === NOW, 'applyObserved repairs a damaged play part');
  // a badge stays once stored, even when its condition is no longer true
  var s4 = blank(); s4.play.badges['first-gate'] = NOW;
  var bl = R.badgeList(s4, R.facts(s4, makeEnv(s4)), makeEnv(s4)).filter(function (b) { return b.id === 'first-gate'; })[0];
  ok(bl.earned === NOW && bl.on === false, 'badgeList: a stored badge stays earned (with its time) even when the condition is false now');
})();

/* ======================= 8. current stop and Continue ======================= */
(function () {
  var st = blank(), env = makeEnv(st), sess = null, r;
  ok(R.currentStop(st, env) === M[0], 'current stop: a new learner is at Stop 1.1');
  r = R.nextRound(st, env, sess);
  ok(r.kind === 'card' && r.mid === M[0].id && r.key === 'overview' && r.i === 1 && r.n === readCards(M[0]).length && r.href === '#play-' + M[0].id + '~overview' && r.no === '1.1', 'Continue for a new learner: Stop 1.1, the overview card (Card 1)', r);
  ok(r.title === 'The big idea' && r.mins >= 2 && r.stop === M[0].title && r.level === 1, 'the round says its card title, minutes and stop', r);
  // progress from Learn mode: cards ticked but not checked
  st = blank(); st.last = M[1].id;
  readCards(M[1]).forEach(function (c) { st.read[M[1].id + '/' + c.key] = iso(ago(3)); });
  st.play.e['qc:' + M[1].id + '/overview'] = ago(1);
  env = makeEnv(st);
  r = R.nextRound(st, env, null);
  ok(r.kind === 'card' && r.mid === M[1].id && r.key === 'outcomes' && r.i === 2, 'Continue after reading in Learn: the first card not yet checked', r);
  // a checked card that is not ticked is a round too (Got it left)
  st.read[M[1].id + '/overview'] = '-' + NOW;
  ok(R.nextRound(st, env, null).key === 'overview', 'a card checked but un-ticked needs its round again');
  // after the cards: the term match, then the toll gate
  st = blank(); st.last = M[1].id;
  finishRounds(st, M[1]); delete st.play.e['tm:' + M[1].id]; delete st.quiz[M[1].id];
  env = makeEnv(st);
  r = R.nextRound(st, env, null);
  ok(r.kind === 'terms' && r.href === '#play-' + M[1].id + '~terms' && r.n === R.usableTerms(M[1]).length, 'after the cards: the term match', r);
  st.play.e['tm:' + M[1].id] = TODAY;
  r = R.nextRound(st, env, null);
  ok(r.kind === 'quiz' && r.href === '#play-' + M[1].id + '~quiz' && r.n === 10, 'then the toll gate', r);
  st.quiz[M[1].id] = { best: 60, attempts: 1, last: 60, at: TODAY };
  ok(R.nextRound(st, env, null).kind === 'quiz', 'the toll gate again while under 70%');
  st.quiz[M[1].id] = { best: 70, attempts: 2, last: 70, at: TODAY, passAt: NOW };
  r = R.nextRound(st, env, null);
  ok(R.currentStop(st, env) === M[2] && r.kind === 'card' && r.mid === M[2].id, 'a stop done: on to the next stop in course order', r);
  // hands-on parts never block
  ok(R.stopState(M[1], env, st).done === true && !R.stopState(M[1], env, st).cleared, 'a stop can have its rounds done without being cleared (Watch, Lab and Code never block)');
  // state.last with rounds left stays the current stop, even before others
  st = blank(); st.last = M[4].id; finishRounds(st, M[0]);
  ok(R.currentStop(st, makeEnv(st)) === M[4], 'current stop: state.last while its rounds are not done');
  finishRounds(st, M[4]);
  ok(R.currentStop(st, makeEnv(st)) === M[5], 'current stop: the next one after state.last');
  st.last = lastOf(4).id; finishRounds(st, lastOf(4));
  ok(R.currentStop(st, makeEnv(st)) === M[1], 'current stop: from the start when everything after state.last is done (Stop 1.1 is done, so 1.2)');
  st.last = 'no-such-module';
  ok(R.currentStop(st, makeEnv(st)) === M[1], 'current stop: an unknown state.last is ignored');

  // the checkpoint at a level's end
  [null, L1[2].id, lastOf(1).id].forEach(function (last) {
    var s = blank(); s.last = last;
    L1.forEach(function (mm) { finishRounds(s, mm); });
    var e = makeEnv(s), x = R.nextRound(s, e, null);
    ok(x.kind === 'checkpoint' && x.lv === 1 && x.href === '#play-test-l1' && x.key === 'test-l1' && x.n === 20, 'every Level 1 round done, test not passed: the Checkpoint first (state.last ' + last + ')', x);
    s.quiz['test-l1'] = { best: 65, attempts: 1, last: 65, at: TODAY };
    ok(R.nextRound(s, e, null).kind === 'checkpoint', 'the checkpoint again while under 70%');
    s.quiz['test-l1'] = { best: 75, attempts: 2, last: 75, at: TODAY, passAt: NOW };
    x = R.nextRound(s, e, null);
    ok(x.kind === 'card' && x.mid === M.filter(function (mm) { return mm.level === 2; })[0].id, 'checkpoint passed: on to the Level 2 road', x);
  });
  // the checkpoint is not offered in the middle of a level, nor while a level's stop has rounds left at state.last
  st = blank(); st.last = L1[3].id; L1.slice(0, 3).forEach(function (mm) { finishRounds(st, mm); });
  ok(R.nextRound(st, makeEnv(st), null).mid === L1[3].id, 'no checkpoint in the middle of a level');
  // the end of the road: every round done; checkpoints left first, then the end
  st = blank(); M.forEach(function (mm) { finishRounds(st, mm); }); st.last = lastOf(4).id;
  env = makeEnv(st);
  ok(R.currentStop(st, env) === null, 'current stop: none when every stop\'s rounds are done');
  r = R.nextRound(st, env, null);
  ok(r.kind === 'checkpoint' && r.lv === 4, 'leaving the last stop: Checkpoint 4 first', r);
  st.quiz['test-l4'] = { best: 80, attempts: 1, last: 80, at: TODAY, passAt: NOW };
  r = R.nextRound(st, env, null);
  ok(r.kind === 'checkpoint' && r.lv === 1, 'then any checkpoint not yet passed, from Level 1', r);
  [1, 2, 3].forEach(function (lv) { st.quiz['test-l' + lv] = { best: 80, attempts: 1, last: 80, at: TODAY, passAt: NOW }; });
  r = R.nextRound(st, env, null);
  ok(r.kind === 'done' && r.title === 'You have travelled the whole road!' && r.warm === false && typeof r.quick === 'boolean', 'everything done: the end of the road, with the warm-up and quick questions offered when they have something', r);

  // warm-up first
  st = blank();
  ['overview', 'outcomes'].forEach(function (k) { st.srs['rc:' + M[0].id + ':' + k] = card(ago(3), { due: ago(1) }); });
  st.srs['kt:' + M[0].id + ':0'] = card(ago(3), { due: addDays(TODAY, 2) });
  env = makeEnv(st);
  r = R.nextRound(st, env, null);
  ok(r.kind === 'warmup' && r.cards === 2 && r.href === '#play-warmup' && r.stop && r.stop.kind === 'card' && r.stop.mid === M[0].id, 'warm-up first when review cards are due (2 cards), with the stop round after it', r);
  ok(R.warmEstimate(st, env) === 2, 'warm-up estimate: due cards seen before');
  ok(R.nextRound(st, env, { day: TODAY, cards: 0, warm: true, quick: false }).kind === 'card', 'no second warm-up in this tab today');
  ok(R.nextRound(st, env, { day: ago(1), cards: 5, warm: true, quick: true }).kind === 'warmup', 'the session note resets when the day changes');
  st.rlog[TODAY] = { dev1: [5, 4, NOW] };
  ok(R.nextRound(st, env, null).kind === 'card', 'no warm-up after 5 reviews today');
  st.rlog[TODAY] = { dev1: [4, 4, NOW] };
  ok(R.nextRound(st, env, null).kind === 'warmup', 'warm-up while fewer than 5 reviews today');
  st = blank();
  for (var i = 0; i < 12; i++) st.srs['kt:' + M[0].id + ':' + (i % 10) + (i >= 10 ? 'x' : '')] = card('');
  env = makeEnv(st);
  ok(R.warmEstimate(st, env) === 10 && R.nextRound(st, env, null).cards === 10, 'new cards count up to the day\'s new-card limit (and real cards only)', R.warmEstimate(st, env));
  st.prefs.study = { newPerDay: 5 };
  Object.keys(st.srs).slice(0, 0).forEach(function () {});
  for (var j = 0; j < 5; j++) st.srs['kt:' + M[1].id + ':' + j] = card(TODAY); // 5 new cards already graded today
  Object.keys(st.srs).forEach(function (id) { if (id.indexOf(M[1].id) > 0) st.srs[id].due = addDays(TODAY, 1); });
  ok(R.warmEstimate(st, env) === 0 && R.nextRound(st, env, null).kind === 'card', 'no warm-up when only new cards wait and today\'s limit is used');
  st.srs['rc:' + M[0].id + ':overview'] = card(ago(2), { off: true, due: ago(1) });
  ok(R.warmEstimate(st, env) === 0, 'a card removed from review is not counted');

  // quick questions after 2 card rounds
  st = blank(); st.last = M[2].id;
  finishRounds(st, M[0]); finishRounds(st, M[1]);
  st.qa[M[0].id + '-q01'] = answer({ n: 1, r: 0, lr: 0, at: iso(ago(2)), wrongAt: iso(ago(2)) });
  env = makeEnv(st);
  ok(R.nextRound(st, env, { day: TODAY, cards: 2, warm: false, quick: false }).kind === 'quick', 'quick questions after 2 card rounds in this tab today');
  r = R.nextRound(st, env, { day: TODAY, cards: 2, warm: false, quick: false });
  ok(r.href === '#play-quick' && r.n === 3 && r.stop && r.stop.mid === M[2].id, 'quick round: up to 3 questions, then the stop round', r);
  ok(R.nextRound(st, env, { day: TODAY, cards: 1, warm: false, quick: false }).kind === 'card', 'no quick questions after 1 card round');
  ok(R.nextRound(st, env, { day: TODAY, cards: 4, warm: false, quick: true }).kind === 'card', 'quick questions once per tab per day');
  var none = blank(); none.last = M[0].id;
  ok(R.nextRound(none, makeEnv(none), { day: TODAY, cards: 3, warm: false, quick: false }).kind === 'card', 'no quick questions when none is eligible');

  // the stop's own Continue
  st = blank(); finishRounds(st, M[3]);
  ok(R.stopNext(M[3], st, makeEnv(st)) === null, 'stopNext: null when the stop\'s rounds are done');
  ok(R.stopNext(M[4], st, makeEnv(st)).key === 'overview', 'stopNext: limited to that stop');
  // the session note
  eq(R.sessFresh(null, TODAY), { day: TODAY, cards: 0, warm: false, quick: false }, 'sessFresh: a new note');
  eq(R.sessFresh({ day: TODAY, cards: '3', warm: 1, quick: 0 }, TODAY), { day: TODAY, cards: 3, warm: true, quick: false }, 'sessFresh: today\'s note, cleaned');
  eq(R.sessFresh({ day: ago(1), cards: 9, warm: true, quick: true }, TODAY), { day: TODAY, cards: 0, warm: false, quick: false }, 'sessFresh: yesterday\'s note starts again');
})();

/* ======================= 9. a stop and a level ======================= */
(function () {
  var st = blank(), m = M[1], mid = m.id;
  st.play.first = iso(ago(4));
  st.read[mid + '/overview'] = iso(ago(2)); st.play.e['qc:' + mid + '/overview'] = ago(2); // done
  st.read[mid + '/outcomes'] = iso(ago(1)); // ticked in Play's time, check left
  st.read[mid + '/studySteps'] = iso(ago(9)); // ticked before Play was first opened: read in Learn
  st.play.e['qc:' + mid + '/keyTerms'] = ago(1); // checked but not ticked
  st.modules[mid] = { done: true, at: NOW };
  st.srs['kt:' + mid + ':0'] = card(ago(5), { due: ago(1) }); st.srs['kt:' + mid + ':1'] = card(ago(5), { due: TODAY }); st.srs['kt:' + mid + ':2'] = card(ago(5), { due: addDays(TODAY, 3) });
  st.quiz[mid] = { best: 85, attempts: 2, last: 85, at: TODAY, passAt: NOW };
  var env = makeEnv(st), s = R.stopState(m, env, st);
  eq(s.cards.map(function (c) { return c.state; }), ['done', 'check', 'learn', 'read', 'todo', 'todo', 'todo'], 'stopState: card states');
  eq(s.cards.slice(0, 5).map(function (c) { return c.label; }), ['Done', 'Quick check left', 'Read in Learn · check left', 'Checked · read it to finish', 'Not started'], 'stopState: card state labels');
  ok(s.no === '1.2' && s.cardsDone === 1 && s.terms.has && s.terms.n === R.usableTerms(m).length && !s.terms.done, 'stopState: number, cards done, term match', s.no);
  ok(s.quiz.passed && s.quiz.best === 85 && s.quiz.stars === 2 && s.quiz.tries === 2 && s.marked && !s.cleared && s.due === 2, 'stopState: toll gate (2 stars), marked done in Learn, 2 review cards ready');
  ok(s.next && s.next.key === 'outcomes', 'stopState: the stop\'s Continue', s.next);
  ok([0, 69, 70, 84, 85, 99, 100].map(R.stars).join() === '0,0,1,1,2,2,3', 'stars: 70 / 85 / 100');
  st.last = mid;
  var lv = R.levelState(1, st, env);
  ok(lv.title === 'Foundations' && lv.of === L1.length && lv.stops.length === L1.length && lv.here === mid && lv.gates === 1 && lv.cleared === 0, 'levelState: the level\'s title, stops, toll gates', [lv.title, lv.here, lv.gates]);
  eq(lv.stops.map(function (x) { return x.chip; }), ['', 'here', '', '', '', '', ''], 'levelState: one chip each ("You are here")');
  st.last = M[0].id; lv = R.levelState(1, st, makeEnv(st));
  ok(lv.stops[1].chip === 'marked', 'levelState: "Marked done in Learn" when it is not the current stop');
  ok(lv.test.key === 'test-l1' && lv.test.n === 20 && !lv.test.passed && lv.projects.length === D.projects.filter(function (p) { return p.level === 1; }).length, 'levelState: the checkpoint and the projects of the road');
  var s2 = blank(); clearStop(s2, M[0]); s2.last = M[3].id; R.applyObserved(s2, R.observe(s2, R.facts(s2, makeEnv(s2)), makeEnv(s2)), NOW);
  ok(R.levelState(1, s2, makeEnv(s2)).stops[0].chip === 'cleared', 'levelState: "Cleared"');
  var s3 = blank(); s3.last = M[3].id; s3.srs['kt:' + M[0].id + ':0'] = card(ago(5), { due: ago(1) });
  ok(R.levelState(1, s3, makeEnv(s3)).stops[0].chip === 'due' && R.levelState(1, s3, makeEnv(s3)).stops[0].due === 1, 'levelState: "N cards ready to review"');
  // rb-5: review ids whose content is gone (a card key removed, a key term past the module's list, a removed card) are
  // not counted, as the warm-up and Daily review skip them
  ['rc:' + M[0].id + ':oldCard', 'kt:' + M[0].id + ':99', 'kt:' + M[0].id + ':x', 'rc:no-such-module:overview'].forEach(function (id) { s3.srs[id] = card(ago(5), { due: ago(1) }); });
  s3.srs['kt:' + M[0].id + ':1'] = card(ago(5), { due: ago(1), off: true });
  ok(R.levelState(1, s3, makeEnv(s3)).stops[0].due === 1 && R.stopState(M[0], makeEnv(s3), s3).due === 1 && R.warmEstimate(s3, makeEnv(s3)) === 1, 'rb-5: "N cards ready to review" counts only cards the review can show (1, as the warm-up)', R.stopState(M[0], makeEnv(s3), s3).due);
})();

/* ======================= 9b. the toll gate's way on, the postcard ======================= */
(function () {
  var env = makeEnv(blank()), last1 = lastOf(1), firstL2 = M.filter(function (m) { return m.level === 2; })[0];
  eq(R.nextStop(M[0], env), { kind: 'stop', mid: M[1].id, href: '#play-' + M[1].id, label: 'Next stop: 1.2 ' + M[1].title }, 'nextStop: the next stop of the level');
  eq(R.nextStop(last1, env), { kind: 'checkpoint', lv: 1, href: '#play-test-l1', label: 'Checkpoint 1' }, 'nextStop: after a level\'s last stop, its checkpoint');
  ok(R.nextStop(lastOf(4), env).href === '#play-test-l4' && firstL2.level === 2, 'nextStop: after the last stop of the road, Checkpoint 4');
  var st = blank();
  st.srs['rc:' + M[0].id + ':overview'] = card(TODAY); st.srs['rc:' + M[0].id + ':outcomes'] = card(ago(1));
  st.rlog[TODAY] = { a: [25, 20, NOW] };
  st.qa[M[0].id + '-q01'] = answer({ at: NOW, f1: NOW }); st.qa[M[0].id + '-q02'] = answer({ at: NOW, r: 0, lr: 0, n: 1 }); st.qa[M[0].id + '-q03'] = answer({ at: iso(ago(1)) });
  st.qa[M[0].id + '-q04'] = answer({ n: 3, r: 2, at: NOW, wrongAt: iso(ago(3)), fix: [iso(ago(2)), NOW] }); st.qa['not-authored'] = answer({ at: NOW });
  env = makeEnv(st);
  var d = R.dayCounts(st, R.facts(st, env), env);
  eq([d.day, d.cards, d.reviews, d.answered, d.fixed], [TODAY, 1, 25, 3, 1], 'dayCounts: cards checked, reviews (all, not capped), questions answered (right or wrong), mistakes fixed today');
  ok(d.xp === R.xpOn(R.facts(st, env), TODAY) && d.xp === 10 + 40 + 5 + 10, 'dayCounts: today\'s XP', d.xp);
  ok(d.hands === 0, 'dayCounts (ux-12): no hands-on task today', d.hands);
  // ux-12: the postcard's hands-on tasks done today, the hands-on quest's rule: lab tasks, exercises, project steps and
  // Watch stamps dated today (not another day's, not an undated old tick)
  var h = blank(), lab = labOf(M[1]), ex = exOf(M[1].id).filter(function (e) { return !e.optional; }), pr = D.projects[0];
  h.labs[lab.id] = {}; h.labs[lab.id][lab.tasks[0].id] = NOW; h.labs[lab.id][lab.tasks[1].id] = iso(ago(2)); h.labs[lab.id][lab.tasks[2].id] = true;
  h.ex[ex[0].id] = { done: true, at: TODAY }; h.ex[ex[1].id] = { done: true, at: ago(1) };
  h.projects[pr.id] = { steps: { 0: true, 1: true }, stepsAt: { 0: NOW, 1: iso(ago(3)) } };
  h.watched[mainKey(M[2].id)] = NOW;
  var he = makeEnv(h), hf = R.facts(h, he), hd = R.dayCounts(h, hf, he), hq = R.quests(h, hf, he).filter(function (q) { return q.id === 'hands'; })[0];
  ok(lab.tasks.length >= 3 && ex.length >= 2 && hd.hands === 4 && hd.cards === 0 && hd.answered === 0 && hq.done, 'dayCounts (ux-12): 4 hands-on tasks done today (a lab task, an exercise, a project step, a Watch stamp), as the hands-on quest counts them', hd);
  ok(R.dayCounts(h, hf, he, ago(1)).hands === 1 && R.dayCounts(h, hf, he, ago(2)).hands === 1, 'dayCounts (ux-12): another day counts that day\'s hands-on tasks (the exercise of yesterday, the lab task of 2 days ago)');
  // flashback: a card ticked 3+ days ago, the same all day
  st = blank(); st.read[M[0].id + '/overview'] = iso(ago(2)); st.read[M[0].id + '/outcomes'] = '-' + iso(ago(9));
  ok(R.flashback(st, makeEnv(st), TODAY) === null, 'flashback: none when no card was ticked 3 or more days ago');
  st.read[M[1].id + '/keyTerms'] = iso(ago(3)); st.read[M[2].id + '/overview'] = iso(ago(30)); st.read[M[3].id + '/overview'] = 'true';
  var fb = R.flashback(st, makeEnv(st), TODAY), seen = {};
  ok(fb && (fb.key === 'keyTerms' && fb.mid === M[1].id && fb.day === ago(3) || fb.mid === M[2].id && fb.day === ago(30)) && fb.title && fb.no, 'flashback: a dated card ticked 3+ days ago', fb);
  ok(J(R.flashback(st, makeEnv(st), TODAY)) === J(fb), 'flashback: the same card all day');
  for (var i = 0; i < 20; i++) { var x = R.flashback(st, makeEnv(st), addDays(TODAY, i)); seen[x.mid] = 1; }
  ok(Object.keys(seen).length >= 2 && Object.keys(seen).every(function (k) { return [M[0].id, M[1].id, M[2].id].indexOf(k) >= 0; }), 'flashback: other days pick other cards (only dated ticks, never an un-tick or an undated one)', Object.keys(seen));
  var bx = R.badgeContext(blank(), [], makeEnv(blank()));
  ok(bx.rightOf === 350 && bx.cardsOf === 189 && bx.stopsOf === 27, 'stats: 350 questions, 189 cards, 27 stops in the course');
})();

/* ======================= 10. quick questions ======================= */
(function () {
  var st = blank(), a = M[0].id, b = M[1].id, c = M[2].id, d = M[3].id;
  [a, b, c].forEach(function (mid) { st.quiz[mid] = { best: 60, attempts: 1, last: 60, at: ago(5) }; });
  st.quiz['test-l1'] = { best: 50, attempts: 1, last: 50, at: ago(5) };
  // open mistakes: in a level test (never used), in an untried quiz (never used), answered today (skipped), and two real ones
  st.qa['test-l1-q01'] = answer({ n: 1, r: 0, lr: 0, at: iso(ago(9)), wrongAt: iso(ago(9)) });
  st.qa[d + '-q01'] = answer({ n: 1, r: 0, lr: 0, at: iso(ago(8)), wrongAt: iso(ago(8)) });
  st.qa[a + '-q01'] = answer({ n: 2, r: 0, lr: 0, at: NOW, wrongAt: iso(ago(7)) });
  st.qa[b + '-q03'] = answer({ n: 1, r: 0, lr: 0, at: iso(ago(6)), wrongAt: iso(ago(6)) });
  st.qa[c + '-q04'] = answer({ n: 1, r: 0, lr: 0, at: iso(ago(4)), wrongAt: iso(ago(4)) });
  st.qa[b + '-q05'] = answer({ n: 3, r: 2, lr: 1, at: iso(ago(3)), wrongAt: iso(ago(5)), fix: [iso(ago(4)), iso(ago(3))] }); // fixed
  var env = makeEnv(st), p = R.quickPool(st, env, a);
  ok(p.fix && p.fix.qid === b + '-q03' && p.fix.label === 'Fix-it' && p.fix.kind === 'fix', 'Fix-it: the oldest open mistake, skipping test questions, untried quizzes and ones answered today', p.fix && p.fix.qid);
  ok(p.list.length === 3 && p.list[0] === p.fix && p.mixed.length === 2, 'quick questions: 1 Fix-it and 2 mixed');
  ok(p.mixed.every(function (x) { return x.mid !== a && (x.mid === b || x.mid === c) && x.label === 'From Stop\u00a0' + (x.mid === b ? '1.2' : '1.3'); }), 'mixed: from other stops whose toll gate was tried, labelled with the stop ("Stop 1.2" with a no-break space)', p.mixed.map(function (x) { return x.qid + ' ' + x.label; }));
  ok(p.mixed[0].qid === c + '-q04', 'mixed: wrong last time first', p.mixed[0].qid);
  ok(p.mixed[1].mid !== p.mixed[0].mid, 'mixed: two different stops when there are two');
  var all = [];
  for (var i = 0; i < 40; i++) {
    var s = blank();
    M.forEach(function (mm, k) { if (k % 2 === i % 2) s.quiz[mm.id] = { best: 50, attempts: 1, last: 50, at: TODAY }; });
    [1, 2, 3, 4].forEach(function (lv) { s.quiz['test-l' + lv] = { best: 40, attempts: 2, last: 40, at: TODAY }; (D.quizzes['test-l' + lv] || []).forEach(function (q) { s.qa[q.id] = answer({ n: 1, r: 0, lr: 0, at: iso(ago(20)), wrongAt: iso(ago(20)) }); }); });
    Object.keys(QIX).forEach(function (qid, k) { if (k % 7 === i % 7 && QIX[qid].set.indexOf('test-') < 0) s.qa[qid] = answer({ n: 1, r: 0, lr: 0, at: iso(ago(10 + (k % 5))), wrongAt: iso(ago(10 + (k % 5))) }); });
    var e = makeEnv(s), cur = R.currentStop(s, e);
    R.quickPool(s, e, cur ? cur.id : '').list.forEach(function (x) { all.push([QIX[x.qid].set, s.quiz[QIX[x.qid].set] ? s.quiz[QIX[x.qid].set].attempts : 0, cur && x.kind === 'mixed' && x.mid === cur.id]); });
  }
  ok(all.length > 0 && all.every(function (x) { return x[0].indexOf('test-') !== 0; }), 'quick questions never use a level-test question (' + all.length + ' picked)');
  ok(all.every(function (x) { return x[1] >= 1; }), 'quick questions never use a quiz the learner has not tried');
  ok(all.every(function (x) { return !x[2]; }), 'mixed questions never come from the current stop');
  // least recently answered, and the current stop's quiz never before its first attempt
  st = blank();
  st.quiz[a] = { best: 90, attempts: 1, last: 90, at: ago(3), passAt: iso(ago(3)) };
  (D.quizzes[a] || []).forEach(function (q, k) { st.qa[q.id] = answer({ at: iso(ago(1 + k)) }); });
  p = R.quickPool(st, makeEnv(st), b);
  ok(!p.fix && p.mixed.length === 2 && p.mixed[0].qid === a + '-q10' && p.mixed[1].qid === a + '-q09', 'mixed: the least recently answered first (one stop: two from it)', p.mixed.map(function (x) { return x.qid; }));
  ok(R.quickPool(st, makeEnv(st), a).list.length === 0, 'mixed: never from the current stop');
  st = blank(); st.qa[a + '-q01'] = answer({ n: 1, r: 0, lr: 0, at: iso(ago(3)), wrongAt: iso(ago(3)), src: 'mixed' });
  ok(R.quickPool(st, makeEnv(st), b).list.length === 0, 'a mistake made in mixed practice in a quiz not yet tried waits for the toll gate');
})();

/* ======================= 11. quests ======================= */
(function () {
  var st = blank(), env, q;
  ['overview', 'outcomes', 'studySteps'].forEach(function (k) { st.srs['rc:' + M[0].id + ':' + k] = card(ago(3), { due: ago(1) }); });
  st.rlog[TODAY] = { dev1: [1, 1, NOW] };
  env = makeEnv(st); q = R.quests(st, R.facts(st, env), env);
  ok(q[0].id === 'warm' && q[0].text === 'Review 3 cards' && q[0].n === 1 && q[0].of === 3 && !q[0].done, 'warm-up quest: the target is the cards in review when fewer than 5', q[0]);
  for (var i = 0; i < 9; i++) st.srs['kt:' + M[1].id + ':' + i] = card(ago(3), { due: ago(1) });
  st.rlog[TODAY] = { dev1: [6, 5, NOW] };
  env = makeEnv(st); q = R.quests(st, R.facts(st, env), env);
  ok(q[0].text === 'Review 5 cards' && q[0].n === 5 && q[0].done, 'warm-up quest: review 5 cards (6 reviewed)', q[0]);
  st = blank(); for (var j = 0; j < 8; j++) st.srs['kt:' + M[1].id + ':' + j] = card(ago(3), { due: addDays(TODAY, 4) });
  env = makeEnv(st); q = R.quests(st, R.facts(st, env), env);
  ok(q[0].text === 'Check 1 lesson card', 'warm-up quest: nothing can be reviewed today, so it asks for a card check instead', q[0]);
  // a new learner's first card: Got it puts it in review, the quick check ("Not yet") leaves it due today. The quest
  // stays "Check 1 lesson card", and done, all day
  st = blank(); st.read[M[0].id + '/overview'] = NOW; st.srs['rc:' + M[0].id + ':overview'] = card('');
  env = makeEnv(st); q = R.quests(st, R.facts(st, env), env);
  ok(q[0].text === 'Check 1 lesson card' && !q[0].done, 'warm-up quest: a card added to review today does not turn it into a review quest', q[0]);
  st.play.e['qc:' + M[0].id + '/overview'] = TODAY;
  q = R.quests(st, R.facts(st, env), env);
  ok(q[0].text === 'Check 1 lesson card' && q[0].done, 'warm-up quest: done after the first quick check, and it stays done', q[0]);
  // cards ticked in Learn before today and never reviewed are in review this morning
  st = blank(); ['overview', 'outcomes'].forEach(function (k) { st.read[M[0].id + '/' + k] = iso(ago(2)); st.srs['rc:' + M[0].id + ':' + k] = card(''); });
  env = makeEnv(st); q = R.quests(st, R.facts(st, env), env);
  ok(q[0].text === 'Review 2 cards' && q[0].n === 0, 'warm-up quest: cards ticked before today count, even if never reviewed', q[0]);
  // done stays done when more cards join the review later in the day
  st = blank(); ['overview', 'outcomes'].forEach(function (k) { st.srs['rc:' + M[0].id + ':' + k] = card(ago(3), { due: addDays(TODAY, 2), last: TODAY }); });
  st.srs['rc:' + M[0].id + ':studySteps'] = card(ago(3), { due: addDays(TODAY, 2) });
  st.rlog[TODAY] = { dev1: [2, 2, NOW] };
  env = makeEnv(st); q = R.quests(st, R.facts(st, env), env);
  ok(q[0].text === 'Review 2 cards' && q[0].done, 'warm-up quest: 2 reviewed of the 2 that could be', q[0]);
  for (var k2 = 0; k2 < 10; k2++) st.srs['kt:' + M[2].id + ':' + k2] = card('');
  st.read[M[2].id + '/keyTerms'] = NOW;
  q = R.quests(st, R.facts(st, env), env);
  ok(q[0].text === 'Review 2 cards' && q[0].done, 'warm-up quest: 10 new key terms added today leave a done quest done', q[0]);
  // new ground
  st = blank(); st.play.e['qc:' + M[0].id + '/overview'] = TODAY; st.play.e['qc:' + M[0].id + '/outcomes'] = ago(1);
  env = makeEnv(st); q = R.quests(st, R.facts(st, env), env);
  ok(q[0].text === 'Check 1 lesson card' && q[0].done && q[1].text === 'Check 2 lesson cards' && q[1].n === 1 && !q[1].done, 'new ground: cards checked today', q.slice(0, 2));
  // every card checked before today: answer 5 questions
  st = blank();
  M.forEach(function (mm) { readCards(mm).forEach(function (c) { st.play.e['qc:' + mm.id + '/' + c.key] = ago(1); }); });
  st.qa[M[0].id + '-q01'] = answer({ at: NOW }); st.qa[M[0].id + '-q02'] = answer({ at: NOW, r: 0, lr: 0, n: 1 }); st.qa['test-l1-q01'] = answer({ at: NOW }); st.qa[M[0].id + '-q03'] = answer({ at: iso(ago(1)) });
  env = makeEnv(st); q = R.quests(st, R.facts(st, env), env);
  ok(q[1].text === 'Answer 5 questions' && q[1].n === 3 && q[1].of === 5, 'new ground: once every card is checked, answer 5 questions (3 answered today, right or wrong)', q[1]);
  // checking the last cards today keeps the card quest for the day
  st = blank();
  M.forEach(function (mm) { readCards(mm).forEach(function (c) { st.play.e['qc:' + mm.id + '/' + c.key] = ago(1); }); });
  st.play.e['qc:' + M[0].id + '/overview'] = TODAY;
  env = makeEnv(st); q = R.quests(st, R.facts(st, env), env);
  ok(q[1].text === 'Check 1 lesson card' && q[1].done, 'new ground: the last card checked today still shows the card quest, done', q[1]);
  // hands-on
  st = blank(); var lab = labOf(M[0]); st.labs[lab.id] = {}; st.labs[lab.id][lab.tasks[0].id] = iso(ago(1));
  env = makeEnv(st); q = R.quests(st, R.facts(st, env), env);
  ok(q[2].text === 'Do 1 hands-on task' && !q[2].done, 'hands-on: yesterday\'s task does not count today');
  [function (s) { s.labs[lab.id][lab.tasks[1].id] = NOW; }, function (s) { s.ex[D.exercises[0].id] = { done: true, at: TODAY }; },
    function (s) { s.projects[D.projects[0].id] = { steps: { 0: true }, stepsAt: { 0: NOW } }; }, function (s) { s.watched[mainKey(M[0].id)] = NOW; }].forEach(function (fn, k) {
    var s = blank(); s.labs[lab.id] = {}; fn(s); var e = makeEnv(s);
    ok(R.quests(s, R.facts(s, e), e)[2].done, 'hands-on: ' + ['a lab task', 'an exercise', 'a project milestone', 'a Watch stamp'][k] + ' today');
  });
  var s4 = blank(); s4.qa[M[0].id + '-q01'] = answer({ f1: NOW }); var e4 = makeEnv(s4);
  ok(!R.quests(s4, R.facts(s4, e4), e4)[2].done, 'hands-on: a quiz answer is not a hands-on task');
})();

/* ======================= 12. week and learning days ======================= */
(function () {
  var st = blank();
  st.log['2026-11-09'] = 3; st.log['2026-11-11'] = 1; st.log['2026-11-08'] = 5; st.log['2026-11-13'] = 0;
  var w = R.weekDots(st, TODAY);
  eq(w.days.map(function (d) { return d.day; }), ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15'], 'week: Monday to Sunday of this week');
  eq(w.days.map(function (d) { return d.on; }), [true, false, true, false, false, false, false], 'week: a dot for each day with learning');
  ok(w.n === 2 && w.of === 3 && !w.steady && w.days[3].today && w.days[4].future && !w.days[2].future && w.days[0].short === 'Mon' && w.days[6].name === 'Sunday', 'week: 2 of 3 learning days, today and later days marked');
  st.log[TODAY] = 1;
  ok(R.weekDots(st, TODAY).steady === true && R.weekDots(st, '2026-11-15').days[0].day === '2026-11-09' && R.weekDots(st, '2026-11-16').days[0].day === '2026-11-16', 'week: a steady week at 3 days; Sunday ends the week');
  var ld = R.learningDays(st, TODAY);
  ok(ld.days === 4 && ld.week === 3 && ld.steadyWeeks === 1 && ld.bestWeek === 3, 'learning days: days, this week, steady weeks', ld);
  st = blank();
  // Saturday 10, Sunday 11 and Monday 12 October: three days in a row, but in two weeks
  ['2026-10-10', '2026-10-11', '2026-10-12', '2026-10-19', '2026-10-20', '2026-10-22', '2026-10-25', 'junk', '2026-10-28'].forEach(function (d) { st.log[d] = 2; });
  st.log['2026-10-27'] = 0;
  ld = R.learningDays(st, TODAY);
  ok(ld.days === 8 && ld.steadyWeeks === 1 && ld.bestWeek === 4 && ld.week === 0, 'learning days: weeks run Monday to Sunday (a Sunday belongs to the week before it)', ld);
  var gap = R.lastLearned(st, TODAY);
  ok(gap.day === '2026-10-28' && gap.gap === 15, 'lastLearned: the last learning day before today, 15 days ago', gap);
  ok(R.lastLearned(blank(), TODAY).gap === 0, 'lastLearned: none yet');
})();

/* ======================= 13. key terms ======================= */
(function () {
  var dropped = 0, usable = 0, fewest = 99;
  M.forEach(function (m) { var u = R.usableTerms(m); usable += u.length; dropped += (m.keyTerms || []).length - u.length; if (u.length < fewest) fewest = u.length; });
  ok(dropped === 16 && usable === 254, 'usableTerms: 16 of 270 key terms name themselves in their meaning and are left out', { dropped: dropped, usable: usable });
  ok(fewest >= R.MIN_TERMS, 'every stop has a term match (at least 4 usable terms)', fewest);
  var py = D.modules.filter(function (m) { return m.id === 'l1-python'; })[0], loop = py.keyTerms.map(function (t) { return t.term; }).indexOf('Loop');
  ok(loop >= 0 && R.usableTerms(py).every(function (x) { return x.i !== loop; }), 'usableTerms: "Loop" (its meaning says "loop") is left out');
  ok(R.usableTerms(py).every(function (x) { return x.term === py.keyTerms[x.i]; }), 'usableTerms: each with its index and the term itself');
  ok(R.usableTerms({ id: 'x', keyTerms: [{ term: 'Data', meaning: 'Metadata about rows' }, { term: 'Mean', meaning: 'The MEAN value' }, { term: 'C++', meaning: 'A language' }] }).map(function (x) { return x.i; }).join() === '0,2', 'usableTerms: whole words, any case');
  var m = M[4], u = R.usableTerms(m).map(function (x) { return x.i; }), allOk = true, differ = 0;
  u.forEach(function (ti) {
    var o = R.pickOptions(m, ti, TODAY), o2 = R.pickOptions(m, ti, TODAY), o3 = R.pickOptions(m, ti, addDays(TODAY, 1));
    if (!o || o.length !== 3 || J(o) !== J(o2) || o.indexOf(ti) < 0 || o.some(function (i, k) { return u.indexOf(i) < 0 || o.indexOf(i) !== k; })) allOk = false;
    if (J(o) !== J(o3)) differ++;
  });
  ok(allOk, 'pickOptions: 3 different usable terms of the module, the right one among them, the same again on a reload');
  ok(differ > 0, 'pickOptions: another day gives other options', differ);
  var pos = {}; M.forEach(function (mm) { R.usableTerms(mm).forEach(function (x) { var o = R.pickOptions(mm, x.i, TODAY); pos[o.indexOf(x.i)] = (pos[o.indexOf(x.i)] || 0) + 1; }); });
  ok(pos[0] > 40 && pos[1] > 40 && pos[2] > 40, 'pickOptions: the right answer is not always in the same place', pos);
  ok(R.pickOptions(py, loop, TODAY) === null, 'pickOptions: none for a term the round does not ask');
  var ord = R.termOrder(m, TODAY);
  ok(ord.slice().sort(function (a, b) { return a - b; }).join() === u.slice().sort(function (a, b) { return a - b; }).join() && J(ord) === J(R.termOrder(m, TODAY)), 'termOrder: every usable term once, the same on a reload');
})();

/* ======================= 14. badges ======================= */
(function () {
  // everything done: all 26 badges
  var st = blank();
  M.forEach(function (m, k) {
    var day = ago(60 - k);
    clearStop(st, m, day);
    st.quiz[m.id] = { best: 100, attempts: 2, last: 100, at: day, passAt: iso(day), perfAt: iso(day) };
    readCards(m).forEach(function (c) { st.srs['rc:' + m.id + ':' + c.key] = card(day, { first: day, lg: 3, due: addDays(TODAY, 30) }); });
    (m.keyTerms || []).forEach(function (t, i) { st.srs['kt:' + m.id + ':' + i] = card(day, { due: addDays(TODAY, 30) }); });
    (D.quizzes[m.id] || []).forEach(function (q) { st.qa[q.id] = answer({ f1: iso(day), at: iso(day) }); });
    st.play.e['tm:' + m.id] = day;
  });
  [1, 2, 3, 4].forEach(function (lv) { st.quiz['test-l' + lv] = { best: 80, attempts: 1, last: 80, at: ago(5), passAt: iso(ago(5)) }; });
  Object.keys(st.qa).slice(0, 10).forEach(function (qid) { st.qa[qid] = answer({ n: 3, r: 2, f1: iso(ago(30)), wrongAt: iso(ago(20)), fix: [iso(ago(19)), iso(ago(18))] }); });
  st.projects[D.projects[0].id] = { steps: { 0: true }, stepsAt: { 0: iso(ago(3)) }, done: true, doneAt: iso(ago(3)) };
  for (var d = 0; d < 40; d++) { st.log[ago(d)] = 2; if (d < 30) st.rlog[ago(d)] = { dev1: [4, 3, iso(ago(d))] }; }
  var env = makeEnv(st), f = R.facts(st, env), x = R.badgeContext(st, f, env), off = R.BADGES.filter(function (b) { return !b.test(x); }).map(function (b) { return b.id; });
  ok(off.length === 0, 'everything done: all 26 badges', off);
  ok(R.BADGES.every(function (b) { var p = b.progress(x); return p.n === p.of && p.text; }), 'everything done: every progress is full', R.BADGES.map(function (b) { return b.id + ' ' + J(b.progress(x)); }).filter(function (s) { return true; }).slice(0, 2));
  ok(x.cards === 189 && x.cardsOf === 189 && x.terms === 270 && x.termsOf === 270 && x.stops === 27 && x.held >= 21 && x.reviews === 120, 'badge counts: 189 cards, 270 terms, 27 stops, held 21+ days, 120 reviews', { cards: x.cards, terms: x.terms, stops: x.stops, held: x.held, reviews: x.reviews });
  var o = R.observe(st, f, env);
  ok(Object.keys(o.badges).length === 26, 'observe: all 26 badges at once (the welcome records them silently)');
  var t0 = Date.now(), runs = 200;
  for (var i = 0; i < runs; i++) R.facts(st, env);
  var ms = (Date.now() - t0) / runs;
  ok(ms < 20, 'facts() on a full course progress takes ' + ms.toFixed(2) + ' ms (' + f.length + ' facts)');

  // every count badge: one short of its target is not earned, the target is (counts set on an empty context)
  var base = R.badgeContext(blank(), [], makeEnv(blank())), J0 = J(base);
  var fresh = function () { var c = JSON.parse(J0); c.n = {}; return c; };
  var TH = {
    'first-check': function (c, v) { c.n.qc = v; return 1; }, 'checks-50': function (c, v) { c.n.qc = v; return 50; },
    'checks-all': function (c, v) { c.cards = v; return c.cardsOf; }, 'terms-50': function (c, v) { c.n.kt = v; return 50; },
    'terms-all': function (c, v) { c.terms = v; return c.termsOf; }, 'right-100': function (c, v) { c.n.q = v; return 100; },
    'fixer-10': function (c, v) { c.n.fx = v; return 10; }, 'first-quiz': function (c, v) { c.tried = v; return 1; },
    'first-gate': function (c, v) { c.gates = v; return 1; }, 'gates-10': function (c, v) { c.gates = v; return 10; },
    'full-marks': function (c, v) { c.full = v; return 1; }, 'first-stop': function (c, v) { c.n.st = v; return 1; },
    'code-10': function (c, v) { c.n.x = v; return 10; }, 'watch-5': function (c, v) { c.n.w = v; return 5; },
    'project-1': function (c, v) { c.n.pd = v; return 1; }, 'lab-1': function (c, v) { c.labsDone = v; return 1; },
    'week-1': function (c, v) { c.days.bestWeek = v; return 3; }, 'weeks-4': function (c, v) { c.days.steadyWeeks = v; return 4; },
    'days-30': function (c, v) { c.days.days = v; return 30; }, 'review-100': function (c, v) { c.reviews = v; return 100; },
    'long-memory': function (c, v) { c.held = v; return 21; }
  };
  var thBad = [];
  R.BADGES.forEach(function (b) {
    var set = TH[b.id]; if (!set) return;
    var lo = fresh(), hi = fresh(), of = set(lo, 0); set(lo, of - 1); set(hi, of);
    if (b.test(lo) || !b.test(hi) || b.progress(hi).n !== of || b.progress(lo).n !== of - 1 || b.progress(hi).of !== of) thBad.push(b.id);
  });
  ok(thBad.length === 0 && Object.keys(TH).length === 21, 'count badges (21): off one short of the target, on at it, progress n of target', thBad);
  [1, 2, 3, 4].forEach(function (lv) {
    var lo = fresh(), hi = fresh(); lo.permitBest[lv] = 69; hi.permits[lv] = true; hi.permitBest[lv] = 70;
    var b = R.BADGES.filter(function (x) { return x.id === 'permit-' + lv; })[0];
    ok(!b.test(lo) && b.test(hi) && b.progress(lo).text === 'Best 69% · pass at 70%' && b.progress(hi).text === 'Done', 'permit-' + lv + ': off at 69%, on at a pass');
  });
  var wr = R.BADGES.filter(function (x) { return x.id === 'whole-road'; })[0], w1 = fresh(), w2 = fresh();
  w1.stops = 27; w1.permits = { 1: true, 2: true, 3: true, 4: false }; w2.stops = 27; w2.permits = { 1: true, 2: true, 3: true, 4: true };
  ok(!wr.test(w1) && wr.test(w2) && wr.progress(w1).text === '27 of 27 stops · 3 of 4 permits', 'whole-road: every stop and all 4 permits');

  // each badge's condition, one at a time
  var one = function (fn) { var s = blank(); fn(s); var e = makeEnv(s), ff = R.facts(s, e), cx = R.badgeContext(s, ff, e); var on = {}; R.BADGES.forEach(function (b) { if (b.test(cx)) on[b.id] = b.progress(cx); }); return { on: on, x: cx, prog: function (id) { return R.BADGES.filter(function (b) { return b.id === id; })[0].progress(cx); } }; };
  var r = one(function (s) { s.srs['rc:' + M[0].id + ':overview'] = card(TODAY); });
  eq(Object.keys(r.on), ['first-check'], 'first-check: 1 card checked');
  r = one(function (s) { for (var k = 0; k < 32; k++) { var m = M[Math.floor(k / 7)], c = readCards(m)[k % 7]; if (c) s.play.e['qc:' + m.id + '/' + c.key] = ago(1); } });
  ok(r.prog('checks-50').text === r.x.n.qc + ' of 50 cards' && !r.on['checks-50'], 'checks-50: progress "N of 50 cards"', r.prog('checks-50'));
  r = one(function (s) { s.quiz[M[0].id] = { best: 40, attempts: 1, last: 40, at: TODAY }; });
  eq(Object.keys(r.on), ['first-quiz'], 'first-quiz: a toll gate tried');
  r = one(function (s) { s.quiz['test-l1'] = { best: 40, attempts: 1, last: 40, at: TODAY }; });
  eq(Object.keys(r.on), [], 'first-quiz: a level test is not a toll gate');
  ok(r.prog('permit-1').text === 'Best 40% · pass at 70%' && r.prog('permit-2').text === 'Not tried yet', 'permit progress: the best score, or not tried');
  r = one(function (s) { s.quiz[M[0].id] = { best: 100, attempts: 1, last: 100, at: TODAY, passAt: NOW, perfAt: NOW }; });
  eq(Object.keys(r.on), ['first-quiz', 'first-gate', 'full-marks'], 'first-gate and full-marks: a toll gate at 100%');
  r = one(function (s) { M.slice(0, 10).forEach(function (m) { s.quiz[m.id] = { best: 70, attempts: 1, last: 70, at: TODAY }; }); });
  ok(r.on['gates-10'] && !r.on['full-marks'], 'gates-10: 10 toll gates passed');
  r = one(function (s) { clearStop(s, M[0]); });
  ok(r.on['first-stop'] && r.on['first-gate'] && !r.on['watch-5'], 'first-stop: a stop cleared');
  r = one(function (s) { s.quiz['test-l3'] = { best: 70, attempts: 1, last: 70, at: TODAY }; });
  eq(Object.keys(r.on), ['permit-3'], 'permit-3: the Level 3 test passed');
  r = one(function (s) { var lab = labOf(M[0]); s.labs[lab.id] = {}; lab.tasks.forEach(function (t) { s.labs[lab.id][t.id] = true; }); var l2 = labOf(M[1]); s.labs[l2.id] = {}; s.labs[l2.id][l2.tasks[0].id] = true; });
  ok(r.on['lab-1'] && r.prog('lab-1').text === 'Done', 'lab-1: one lab with every task done');
  r = one(function (s) { var l2 = labOf(M[1]); s.labs[l2.id] = {}; l2.tasks.slice(0, 3).forEach(function (t) { s.labs[l2.id][t.id] = NOW; }); });
  ok(!r.on['lab-1'] && r.prog('lab-1').text === '3 of 4 tasks in one lab', 'lab-1 progress: the best lab', r.prog('lab-1'));
  r = one(function (s) { D.exercises.slice(0, 10).forEach(function (e) { s.ex[e.id] = { done: true, at: TODAY }; }); });
  ok(r.on['code-10'], 'code-10: 10 exercises solved');
  r = one(function (s) { M.slice(0, 5).forEach(function (m) { s.watched[mainKey(m.id)] = NOW; }); });
  ok(r.on['watch-5'] && Object.keys(r.on).length === 1, 'watch-5: 5 Watch stamps');
  r = one(function (s) { s.projects[D.projects[3].id] = { done: true, doneAt: NOW }; });
  eq(Object.keys(r.on), ['project-1'], 'project-1: a project finished');
  r = one(function (s) { ['2026-11-09', '2026-11-10', '2026-11-12'].forEach(function (d) { s.log[d] = 1; }); });
  eq(Object.keys(r.on), ['week-1'], 'week-1: 3 learning days in one week');
  r = one(function (s) { ['2026-11-08', '2026-11-09', '2026-11-12'].forEach(function (d) { s.log[d] = 1; }); });
  ok(!r.on['week-1'] && r.prog('week-1').text === '2 of 3 learning days in one week', 'week-1: 3 days across two weeks are not a steady week', r.prog('week-1'));
  r = one(function (s) { for (var w = 0; w < 4; w++) for (var k = 0; k < 3; k++) s.log[addDays('2026-08-03', w * 14 + k)] = 1; });
  ok(r.on['weeks-4'] && r.on['week-1'] && !r.on['days-30'], 'weeks-4: 4 steady weeks, not in a row');
  r = one(function (s) { for (var k = 0; k < 30; k++) s.log[addDays('2026-01-01', k * 4)] = 1; }); // never 3 in one week
  ok(r.on['days-30'] && !r.on['week-1'], 'days-30: 30 learning days, not in a row');
  r = one(function (s) { s.rlog[ago(1)] = { a: [60, 50, NOW] }; s.rlog[ago(2)] = { a: [30, 20, NOW], b: [10, 5, NOW] }; });
  ok(r.on['review-100'] && r.x.reviews === 100, 'review-100: 100 reviews in all (uncapped, all devices)');
  r = one(function (s) { s.srs['kt:' + M[0].id + ':0'] = card(ago(25), { first: ago(21), lg: 3 }); s.srs['kt:' + M[0].id + ':1'] = card(ago(40), { first: ago(40), lg: 1 }); });
  ok(r.on['long-memory'] && r.x.held === 21, 'long-memory: a card remembered for 21 days (a forgotten card does not count)', r.x.held);
  r = one(function (s) { s.srs['kt:' + M[0].id + ':0'] = card(ago(25), { first: ago(20), lg: 3 }); });
  ok(!r.on['long-memory'] && r.prog('long-memory').text === '20 of 21 days', 'long-memory: 20 days is not yet', r.prog('long-memory'));
  r = one(function (s) { M.slice(0, 26).forEach(function (m) { clearStop(s, m); }); [1, 2, 3, 4].forEach(function (lv) { s.quiz['test-l' + lv] = { best: 90, attempts: 1, last: 90, at: TODAY }; }); });
  ok(!r.on['whole-road'] && r.prog('whole-road').text === '26 of 27 stops · 4 of 4 permits', 'whole-road: one stop left', r.prog('whole-road'));
})();

/* ======================= 15. routes ======================= */
(function () {
  var env = makeEnv(blank()), bad = [];
  M.forEach(function (m) {
    var s = R.parseRoute('#play-' + m.id, env);
    if (!s || s.screen !== 'stop' || s.mid !== m.id || s.m !== m) bad.push(m.id);
    readCards(m).forEach(function (c) { var x = R.parseRoute('play-' + m.id + '~' + c.key, env); if (!x || x.screen !== 'card' || x.key !== c.key || x.mid !== m.id) bad.push(m.id + '~' + c.key); });
    if (R.parseRoute('play-' + m.id + '~terms', env).screen !== 'terms') bad.push(m.id + '~terms');
    if (R.parseRoute('play-' + m.id + '~quiz', env).screen !== 'quiz') bad.push(m.id + '~quiz');
    if (!R.ROUTE_RE.test('play-' + m.id + '~overview')) bad.push('loader ' + m.id);
  });
  ok(bad.length === 0 && M.length === 27, 'routes: all 27 module ids, their card keys, term match and toll gate', bad);
  ok(R.CARD_KEYS.length === 7 && R.CARD_KEYS.every(function (k) { return READ_SECS.some(function (x) { return x[0] === k; }); }), 'routes: the 7 card keys');
  [1, 2, 3, 4].forEach(function (lv) { var x = R.parseRoute('#play-test-l' + lv, env); ok(x && x.screen === 'test' && x.lv === lv && x.key === 'test-l' + lv, 'routes: checkpoint ' + lv); });
  eq(['play', 'play-warmup', 'play-quick', 'play-done', 'play-badges', 'play-help'].map(function (h) { return R.parseRoute(h, env).screen; }), ['road', 'warmup', 'quick', 'done', 'badges', 'help'], 'routes: road, warm-up, quick questions, postcard, badges, help');
  eq(['play-test-l5', 'play-test-l01', 'play-nope', 'play-l1-python~nope', 'play-l1-python~', 'play~x', 'play-constructor', 'play-__proto__~overview', 'play-L1-PYTHON'].map(function (h) { return R.parseRoute(h, env).screen; }), ['notfound', 'notfound', 'notfound', 'notfound', 'notfound', 'notfound', 'notfound', 'notfound', 'notfound'], 'routes: unknown levels, modules and rounds are "not found"');
  ok(['playground', '#playground', 'playground~x', 'play2', 'home', 'm-l1-python', 'replay'].every(function (h) { return R.parseRoute(h, env) === null; }), 'routes: never #playground or another page');
  ok(!R.ROUTE_RE.test('playground') && R.ROUTE_RE.test('play') && R.ROUTE_RE.test('play-l1-python~quiz') && R.ROUTE_RE.source === '^play(?:[-~].*)?$', 'routes: the loader pattern (the same as study.js) never matches playground');
  var study = fs.readFileSync(path.join(ROOT, 'assets/js/study.js'), 'utf8');
  ok(study.indexOf('/^play(?:[-~].*)?$/') < 0 || study.indexOf("[/^play(?:[-~].*)?$/, 'play']") >= 0, 'study.js loads game.js for the same pattern (when it registers one)');
})();

/* ======================= 16. the browser env helper and the files ======================= */
(function () {
  ok(R.browserEnv() === null, 'browserEnv() is null without AIM_APP and AIM_STUDY');
  var bsb = { window: { AIM: D } };
  var seen = {};
  bsb.window.AIM_CORE = { state: blank() };
  bsb.window.AIM_STUDY = { question: function () { return null; }, questionSet: function () { return null; }, fixCount: fixCount, isMistake: isMistake, heldDays: function () { return 0; },
    reviewLog: function () { return [0, 0]; }, newLeftToday: function () { return 15; }, today: function () { return TODAY; }, localDay: localDay, addDays: addDays, daysBetween: daysBetween };
  bsb.window.AIM_APP = { readCards: readCards, labOf: labOf, exOf: exOf, moduleParts: function () { return []; }, isRecommended: isRecommended,
    mainPicks: function (m) { seen[m.id] = 1; return PICKS[m.id]; }, isShared: function (r) { return !!SHARED[r.id]; } };
  vm.createContext(bsb); load('assets/js/game.js', bsb);
  var B = bsb.window.AIM_PLAY_RULES, env = B.browserEnv();
  ok(env && env === B.browserEnv() && env.state() === bsb.window.AIM_CORE.state, 'browserEnv() builds the env once from the globals');
  ok(['modules', 'levels', 'quizzes', 'projects', 'exercises', 'labs', 'readCards', 'watchKeys', 'labOf', 'exOf', 'moduleParts', 'question', 'questionSet', 'fixCount', 'isMistake', 'heldDays', 'reviewLog', 'newLeftToday', 'today', 'localDay', 'state'].every(function (k) { return env[k] != null; }), 'browserEnv(): every field of the env');
  ok(M.every(function (m) { return J(env.watchKeys(m)) === J(WATCH[m.id]); }), 'browserEnv(): watchKeys from mainPicks, isRecommended and isShared');
  var st = bsb.window.AIM_CORE.state; st.watched[mainKey(M[0].id)] = NOW;
  ok(B.facts(st, env).length === 1 && B.summary(null, env).total === 20 && B.summary(null, env).today === 20 && B.summary(null, env).rank.name === 'Starter', 'browserEnv(): facts and summary work on the live progress');

  var src = GAME_SRC, dev = /[\u0900-\u097F]/.exec(src);
  ok(!dev, 'game.js has no Devanagari');
  var css = path.join(ROOT, 'assets/css/game.css');
  if (fs.existsSync(css)) ok(!/[\u0900-\u097F]/.test(fs.readFileSync(css, 'utf8')), 'game.css has no Devanagari');
  if (fs.existsSync(css)) ok(fs.statSync(css).size <= 32 * 1024, 'game.css size: ' + fs.statSync(css).size + ' bytes, within 32 KB');
  // ES5 only: the code with comments and strings taken out has no ES2015+ syntax
  var code = src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:\\])\/\/[^\n]*/g, '$1').replace(/'(?:\\.|[^'\\\n])*'/g, "''").replace(/"(?:\\.|[^"\\\n])*"/g, '""');
  var es6 = [[/=>/, '=>'], [/`/, 'backtick'], [/\blet\b/, 'let'], [/\bconst\b/, 'const'], [/\?\.(?!\d)/, '?.'], [/\bclass\b/, 'class'], [/\.\.\.[A-Za-z_$[]/, 'spread']].filter(function (x) { return x[0].test(code); }).map(function (x) { return x[1]; });
  ok(es6.length === 0, 'game.js is ES5 (no arrow functions, template literals, let, const, ?., class or spread)', es6);
  var a = src.indexOf('Part B: the Play mode screens');
  ok(a > 0 && Buffer.byteLength(src, 'utf8') <= 220 * 1024, 'game.js size: ' + Buffer.byteLength(src, 'utf8') + ' bytes raw (Part A ' + Buffer.byteLength(src.slice(0, a), 'utf8') + '), within 220 KB');
  var gz = require('zlib').gzipSync(src, { level: 9 }).length;
  ok(gz <= 64 * 1024, 'game.js gzip size: ' + gz + ' bytes, within 64 KB');
})();

/* ======================= 17. game.css: the look and small accessibility rules (the fix round's Group C) ======================= */
(function () {
  var file = path.join(ROOT, 'assets/css/game.css');
  if (!fs.existsSync(file)) return;
  // the sheet as rules: { media: the @-blocks around it, sel, decl } (declarations hold no braces in game.css)
  var rules = [], s = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''), media = [], buf = '';
  for (var i = 0; i < s.length; i++) {
    var ch = s.charAt(i);
    if (ch === '{') {
      var head = buf.replace(/\s+/g, ' ').trim(); buf = '';
      if (head.charAt(0) === '@') { media.push(head); continue; }
      var j = s.indexOf('}', i);
      rules.push({ media: media.join(' '), sel: head, decl: s.slice(i + 1, j).replace(/\s+/g, ' ').trim() });
      i = j;
    } else if (ch === '}') { media.pop(); buf = ''; } else buf += ch;
  }
  // a declaration's value in the rule for exactly sel (inside the given @-block, '' for none)
  var val = function (sel, prop, at) {
    var r = rules.filter(function (x) { return x.sel === sel && x.media === (at || ''); }), v = null;
    r.forEach(function (x) { x.decl.split(';').forEach(function (d) { var k = d.indexOf(':'); if (k > 0 && d.slice(0, k).trim() === prop) v = d.slice(k + 1).trim(); }); });
    return v;
  };
  var has = function (sel, want, at) { return Object.keys(want).every(function (k) { return val(sel, k, at) === want[k]; }); };
  // the selectors of a list, split at its top-level commas
  var parts = function (sel) { var out = [], d = 0, cur = ''; for (var k = 0; k < sel.length; k++) { var c = sel.charAt(k); if (c === '(') d++; if (c === ')') d--; if (c === ',' && !d) { out.push(cur.trim()); cur = ''; } else cur += c; } out.push(cur.trim()); return out; };

  // a11y-1: the bar wraps; its parts start from their smallest width, so the ring drops to a line of its own only
  // when the text is too large to share one (at 100% text the bar keeps one line)
  ok(val('.pl-bar', 'flex-wrap') === 'wrap' && val('.pl-btitle', 'flex') === '1 1 0' && val('.pl-rank', 'flex') === '1 1 0' && val('.pl-rank', 'grid-template-columns') === 'auto 1fr' && val('.pl-rank', 'min-width') === null && val('.pl-rk', 'min-width') === null,
    'a11y-1: .pl-bar wraps; the title and the rank chip have flex-basis 0, the chip keeps its icon and longest word (no min-width: 0, a 1fr text column)');
  ok(val('.pl-lvb', 'white-space') === 'normal', 'a11y-1: the Level buttons wrap their words at large text (white-space: normal)');
  // a11y-3: Windows high contrast keeps the states drawn with colour alone
  var FC = '@media (forced-colors: active)';
  ok(has('.pl-st.is-on, .pl-dots i.on, .pl-rdots i.done, .pl-lampw i.on', { 'forced-color-adjust': 'none', background: 'CanvasText', color: 'Canvas', 'border-color': 'CanvasText' }, FC) &&
    has('.pl-lvb[aria-pressed="true"]', { 'forced-color-adjust': 'none', background: 'Highlight', color: 'HighlightText', 'border-color': 'Highlight' }, FC) &&
    has('.pl-dial', { 'forced-color-adjust': 'none', background: 'conic-gradient(Highlight calc(var(--p) * 1%), GrayText 0)' }, FC) && has('.pl-dial.is-met', { background: 'Highlight' }, FC) &&
    has('.pl-dial::before', { background: 'Canvas' }, FC) && has('.pl-knob::after, .pl-switch[aria-checked="true"] .pl-knob::after', { 'forced-color-adjust': 'none', background: 'CanvasText' }, FC),
    'a11y-3: the forced-colors block: done stamps, dots and lamps, the pressed level, the ring (met too) and the Calm knob (off and on) keep system colours');
  // a11y-4, a11y-7: the stamps on their own paper, sized in em (70 px and 116 px at 100% text)
  ok(val('.pl-permit', 'background') === 'var(--surface)', 'a11y-4: the road permit stamp has its own paper (--surface)');
  ok(has('.pl-rstamp', { width: '6.25em', height: '6.25em', 'font-size': '.7rem' }) && has('.pl-permit', { width: '9.8em', height: '9.8em', 'font-size': '.74rem' }) && val('.pl .read-card.pl-rel .read-head', 'padding-right') === 'calc(.7rem * 6.25 + 4px)' &&
    Math.round(6.25 * 0.7 * 16) === 70 && Math.round(9.8 * 0.74 * 16) === 116, 'a11y-7: the Checked and permit stamps are sized in em (70 px and 116 px at 100% text), the card head clears the stamp');
  // a11y-5: Calm mode stops the page gliding too
  ok(val('html:has(.pl-calm)', 'scroll-behavior') === 'auto', 'a11y-5: html:has(.pl-calm) { scroll-behavior: auto }');
  // a11y-10: light-mode graphics at 3:1
  ok(val('.pl-lampw i', 'border') === '2px solid var(--muted)' && val('.pl-lampw i.on', 'background') === 'var(--haldi-ink)' && val('.pl-stp', 'border') === '1.5px dashed var(--muted)' && val('.pl-badge', 'border') === '1.5px dashed var(--muted)' &&
    val('.pl-dial', 'box-shadow') === '0 0 0 1px var(--field-line)' && /var\(--line\) 0\)$/.test(val('.pl-dial', 'background') || ''), 'a11y-10: lamps ringed in --muted and lit in --haldi-ink; dashed stamp and badge edges in --muted; the ring\'s --field-line edge on its --line track');
  // ux-8: the quiz engine's own next link is secondary inside Play
  ok(has('.pl .score-box a.btn-primary', { background: 'var(--surface)', color: 'var(--indigo)', 'border-color': 'var(--line)' }) && val('.pl .score-box a.btn-primary:hover', 'border-color') === 'var(--indigo)',
    'ux-8: inside Play the score box\'s "Next stop" link looks secondary (with the secondary button\'s hover)');
  // ux-11, ux-13: "Card N of 7" once at every width; R3 (final review): and in full at any text size, so the card's own
  // counter is hidden only while the bar's title is not cut short (game.js sets pl-tcut on the root when it is)
  var cnt = rules.filter(function (x) { return /read-tools > \.num/.test(x.sel); });
  ok(val('.pl-btitle', 'display', '@media (max-width: 359px)') === 'none' && val('.pl:not(.pl-tcut) .read-head .read-tools > .num', 'display', '@media (min-width: 360px)') === 'none' &&
    cnt.length === 1 && cnt[0].media === '@media (min-width: 360px)',
    'ux-11, ux-13, R3: below 360 px the bar\'s title goes; from 360 px Learn\'s own card counter goes inside Play, unless the bar\'s title is cut (pl-tcut)', cnt);
  // ux-20: the "Your rank" chip keeps its own width
  ok(val('.pl-ladder .pl-chip', 'justify-self') === 'start', 'ux-20: the ladder\'s "Your rank" chip does not stretch');
  // ux-4 (recheck): the Road's hands-on quest link takes its whole row, a 44 px target (SPEC 0.6), not its line of text
  ok(val('.pl-qlist li', 'position') === 'relative' && has('.pl-qlist a::after', { content: '""', position: 'absolute', inset: '-1px' }), 'ux-4: the hands-on quest link\'s target is its whole quest row');
  // rb-2: a browser that does not know :is(), :where() or :has() drops a whole selector list, so each stands alone
  var mixed = rules.filter(function (x) { return /:(is|where|has)\(/.test(x.sel) && parts(x.sel).length > 1; }).map(function (x) { return x.sel; });
  ok(!mixed.length && val('.pl-peek .read-body > :not(:first-child), .pl-shut .read-body', 'display') === 'none' && val('.pl-peek .read-body > :is(ol, ul, dl):first-child > :not(:first-child)', 'display') === 'none',
    'rb-2: the card fold is two rules: the shut card and the peek do not depend on :is(); no rule mixes :is(), :where() or :has() into a list', mixed);
  // the colours these rules use pass in light and dark (style.css's tokens): 3:1 for graphics, 4.5:1 for text
  var css = fs.readFileSync(path.join(ROOT, 'assets/css/style.css'), 'utf8');
  var tok = function (block) { var o = {}, re = /--([a-z0-9-]+):\s*(#[0-9a-f]{6})/gi, m; while ((m = re.exec(block))) o[m[1]] = m[2]; return o; };
  var light = tok(/:root\s*\{([^}]*)\}/.exec(css)[1]), dark = tok((/:root\[data-theme="dark"\]\s*\{([^}]*)\}/.exec(css) || [])[1] || '');
  var lum = function (h) { return [1, 3, 5].map(function (k) { var x = parseInt(h.substr(k, 2), 16) / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }).reduce(function (a, x, k) { return a + x * [0.2126, 0.7152, 0.0722][k]; }, 0); };
  var cr = function (a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  [['light', light], ['dark', dark]].forEach(function (t) {
    var c = t[1], need = [['muted', 'bg', 3, 'an unlit lamp\'s ring and the dashed edges, on the page'], ['muted', 'surface', 3, 'those edges on their own --surface'], ['haldi-ink', 'surface', 3, 'a lit lamp against an unlit one'],
      ['field-line', 'surface', 3, 'the ring\'s edge on the ring button'], ['sindoor', 'surface', 4.5, 'the permit\'s text on its paper (a11y-4)'], ['indigo', 'surface', 4.5, 'the secondary "Next stop" link (ux-8)']];
    var bad = need.filter(function (n) { return !c[n[0]] || !c[n[1]] || cr(c[n[0]], c[n[1]]) < n[2]; }).map(function (n) { return n[3] + ' ' + (c[n[0]] && c[n[1]] ? cr(c[n[0]], c[n[1]]).toFixed(2) : 'no token'); });
    ok(Object.keys(c).length > 10 && !bad.length, 'a11y-4, a11y-10, ux-8 (' + t[0] + '): ' + need.map(function (n) { return n[3]; }).join('; ') + ' have the contrast they need', bad);
  });
})();

console.log(passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
