/* AI Marg Play mode: the same course as short rounds that earn XP (experience points), stamps, ranks and badges.
   Every round shows the course's own content and saves into the same progress as Learn mode.
   Part A: the rules, pure functions with no DOM or storage, exported as window.AIM_PLAY_RULES (Node checks:
   scripts/check-play.js). Part B: the screens and the parts the rounds share. Part C: the six rounds. ES5, no build
   step; study.js loads it on #play routes.

   env: one adapter the rules read the course and study helpers through (browser: AIM_PLAY_RULES.browserEnv()).
     modules (course order), levels, quizzes, projects, exercises, labs    window.AIM
     readCards(m) -> [{ key, title }]; labOf(m) -> lab or null; exOf(mid) -> exercises     AIM_APP
     watchKeys(m) -> the watched[] keys that count for the Watch part (the best pick and Recommended videos, and
       '<module>|<resource>' for a shared playlist), null when the module has no Watch part   AIM_APP.mainPicks...
     moduleParts(m): Learn's own, only to check partsOf() against it                         AIM_APP
     question(qid), questionSet(qid), fixCount(x), isMistake(x), heldDays(card, day)        AIM_STUDY
     reviewLog(day) -> [graded, remembered]; newLeftToday() (both read the live progress)   AIM_STUDY
     today() -> local 'YYYY-MM-DD', the one today for every rule; localDay(iso) -> local day  AIM_STUDY
     state() -> C.state, for the calls given no state
   A fact: { k: key, kind, xp, day } (rv facts add n); day is the local day it first happened, '' when not known.
   Undated facts count in the total, never as today. */
(function () {
  'use strict';

  /* ---------- numbers and words (How Play works draws its tables from these) ---------- */
  var PASS = 70, UNDATED = '0000-00-00', MIN_DAY = '2000-01-01'; // core.js keeps an undated tick as '1970-01-01'
  var RV_CAP = 20, FS_CAP = 3, FS_MIN = 10, WARM_MAX = 10, MIN_TERMS = 4, QUICK_MAX = 3;
  var XP = { qc: 10, kt: 3, q: 5, qp: 20, qpTest: 100, qf: 10, qfTest: 50, w: 20, l: 10, x: 20, st: 50, pm: 10, pd: 50, tm: 10, fx: 10, rv: 2, fs: 10 };
  var XP_TABLE = [
    { kind: 'qc', label: 'Cards checked', what: 'A lesson card checked the first time (its quick check, any answer, or its first review)', xp: 10 },
    { kind: 'kt', label: 'Key terms reviewed', what: 'A key term reviewed the first time', xp: 3 },
    { kind: 'q', label: 'Questions right', what: 'A toll gate or checkpoint question right the first time', xp: 5 },
    // whatTest: How Play works shows a checkpoint's XP in a row of its own
    { kind: 'qp', label: 'Toll gates and checkpoints passed', what: 'A toll gate passed (70% or more)', xp: 20, xpTest: 100, whatTest: 'A checkpoint passed (70% or more)' },
    { kind: 'qf', label: 'Full marks', what: 'Full marks at a toll gate', xp: 10, xpTest: 50, whatTest: 'Full marks at a checkpoint' },
    { kind: 'w', label: 'Watch stamps', what: 'A stop\'s Watch stamp: its best video or a Recommended one finished', xp: 20 },
    { kind: 'l', label: 'Lab tasks', what: 'A lab task done', xp: 10 },
    { kind: 'x', label: 'Exercises solved', what: 'A coding exercise solved', xp: 20 },
    { kind: 'st', label: 'Stops cleared', what: 'A stop cleared: all its stamps', xp: 50 },
    { kind: 'pm', label: 'Project steps', what: 'A project step ticked', xp: 10 }, // Play never says "milestone": its stones are the milestones
    { kind: 'pd', label: 'Projects finished', what: 'A project finished', xp: 50 },
    { kind: 'tm', label: 'Term matches', what: 'A stop\'s term match finished the first time', xp: 10 },
    { kind: 'fx', label: 'Mistakes fixed', what: 'A past mistake answered right on two different days', xp: 10 },
    { kind: 'rv', label: 'Reviews', what: 'A review card graded, any grade (up to 20 a day)', xp: 2, cap: RV_CAP },
    { kind: 'fs', label: 'Focus sessions', what: 'A focus session of 10 minutes or more (up to 3 a day)', xp: 10, cap: FS_CAP }
  ];
  var LABEL = {}; XP_TABLE.forEach(function (r) { LABEL[r.kind] = r.label; });
  var KEEP = { qc: 1, tm: 1, w: 1, st: 1, pm: 1, pd: 1, fx: 1 };  // kept in play.e, so their day never moves
  var OBSERVE = { qc: 1, w: 1, st: 1, pm: 1, pd: 1, fx: 1 };      // what observe() records on first sight
  var HANDS = { l: 1, x: 1, pm: 1, w: 1 };
  var RANKS = [ // never called levels; icon names the vehicle marker the screens draw
    { i: 0, name: 'Starter', xp: 0, icon: 'footprints' }, { i: 1, name: 'Walker', xp: 30, icon: 'walker' },
    { i: 2, name: 'Cyclist', xp: 120, icon: 'bicycle' }, { i: 3, name: 'Scooter rider', xp: 300, icon: 'scooter' },
    { i: 4, name: 'Auto driver', xp: 700, icon: 'auto' }, { i: 5, name: 'Car driver', xp: 1400, icon: 'car' },
    { i: 6, name: 'Bus driver', xp: 2600, icon: 'bus' }, { i: 7, name: 'Navigator', xp: 4500, icon: 'compass' },
    { i: 8, name: 'Road builder', xp: 7500, icon: 'roller' }, { i: 9, name: 'Guide', xp: 12000, icon: 'signpost' }
  ];
  var GOALS = [{ id: 'light', name: 'Light', xp: 20, mins: 5 }, { id: 'steady', name: 'Steady', xp: 30, mins: 10 }, { id: 'strong', name: 'Strong', xp: 50, mins: 20 }], GOAL = 30;
  var STAMP_LABEL = { read: 'Read', watch: 'Watch', lab: 'Lab', code: 'Code', quiz: 'Quiz' };
  var CARD_STATE = { done: 'Done', check: 'Quick check left', learn: 'Read in Learn · check left', read: 'Checked · read it to finish', todo: 'Not started' };
  var CARD_KEYS = ['overview', 'outcomes', 'studySteps', 'keyTerms', 'indiaExample', 'commonMistakes', 'selfCheck'];
  var WEEK = [['Mon', 'Monday'], ['Tue', 'Tuesday'], ['Wed', 'Wednesday'], ['Thu', 'Thursday'], ['Fri', 'Friday'], ['Sat', 'Saturday'], ['Sun', 'Sunday']];
  var DAY_RE = /^\d{4}-\d{2}-\d{2}$/, ISO_RE = /^\d{4}-\d{2}-\d{2}T/, TEST_RE = /^test-l(\d+)$/;
  // study.js loads this file for ROUTE_RE (the same pattern), which never matches #playground
  var ROUTE_RE = /^play(?:[-~].*)?$/, TEST_ROUTE = /^play-test-l(\d+)$/, MOD_ROUTE = /^play-([a-z0-9-]+)(?:~([A-Za-z]+))?$/;
  var WORDS = { 'play-warmup': 'warmup', 'play-quick': 'quick', 'play-done': 'done', 'play-badges': 'badges', 'play-help': 'help' };

  /* ---------- helpers ---------- */
  var own = function (o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); };
  var obj = function (o) { return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; };
  var num = function (v) { v = Number(v); return isFinite(v) ? v : 0; };
  var dict = function () { return Object.create(null); }; // keys such as 'constructor' are plain keys here
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var isOn = function (v) { return !!v && String(v).charAt(0) !== '-'; }; // a card tick; '-' + time is an un-tick
  var plural = function (n, one) { return n + ' ' + one + (n === 1 ? '' : 's'); };
  var count = function (list, fn) { var n = 0; list.forEach(function (x) { if (fn(x)) n++; }); return n; };
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  // at local noon, as study.js does, so summer time never moves a day
  function addDays(day, n) { var d = new Date(day + 'T12:00:00'); d.setDate(d.getDate() + n); return ymd(d); }
  function daysBetween(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5); }
  function monday(day) { var d = new Date(day + 'T12:00:00'); if (isNaN(d)) return ''; d.setDate(d.getDate() - (d.getDay() + 6) % 7); return ymd(d); }
  // the local day of a saved time: an ISO time, or a day kept as it is (older copies); '' when not known
  function dayOf(v, env) {
    if (typeof v !== 'string') return '';
    var d = DAY_RE.test(v) ? v : ISO_RE.test(v) ? env.localDay(v) : '';
    return d && d >= MIN_DAY ? d : '';
  }
  function index(s, n) { var i = Number(s); return String(i) === String(s) && i >= 0 && i < n && Math.floor(i) === i ? i : -1; }
  var imul = Math.imul || function (a, b) { return ((a & 0xffff) * b + ((((a >>> 16) & 0xffff) * b & 0xffff) << 16)) | 0; };
  // FNV-1a, then mixed: seeded choices that look random but repeat on a reload
  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = imul(h, 16777619); }
    h ^= h >>> 16; h = imul(h, 0x85ebca6b); h ^= h >>> 13; h = imul(h, 0xc2b2ae35); h ^= h >>> 16;
    return h >>> 0;
  }

  /* ---------- the course, worked out once per env ---------- */
  function course(env) {
    if (env._play) return env._play;
    var c = { mods: env.modules || [], byId: dict(), ix: dict(), no: dict(), byLv: dict(), lvs: [], cards: dict(), cardKeys: [], cardSet: dict(), termKeys: [], lab: dict(), ex: dict(), watch: dict(), test: dict() };
    c.mods.forEach(function (m, i) {
      var l = c.byLv[m.level] || (c.byLv[m.level] = []);
      if (!l.length) c.lvs.push(m.level);
      l.push(m); c.byId[m.id] = m; c.ix[m.id] = i; c.no[m.id] = m.level + '.' + l.length;
      c.cards[m.id] = env.readCards(m) || [];
      c.cards[m.id].forEach(function (x) { var k = 'qc:' + m.id + '/' + x.key; c.cardKeys.push(k); c.cardSet[k] = 1; });
      (m.keyTerms || []).forEach(function (t, j) { c.termKeys.push('kt:' + m.id + ':' + j); });
      c.lab[m.id] = env.labOf(m) || null;
      c.ex[m.id] = (env.exOf(m.id) || []).filter(function (x) { return x && !x.optional; }); // the Code stamp's
      c.watch[m.id] = env.watchKeys(m) || null;
    });
    c.lvs.sort(function (a, b) { return a - b; });
    c.lvs.forEach(function (lv) { if (quizOf(env, 'test-l' + lv).length) c.test[lv] = 'test-l' + lv; });
    c.qN = 0; Object.keys(obj(env.quizzes)).forEach(function (k) { c.qN += quizOf(env, k).length; });
    try { Object.defineProperty(env, '_play', { value: c, configurable: true }); } catch (e) {}
    return c;
  }
  var quizOf = function (env, key) { var q = obj(env.quizzes)[key]; return Array.isArray(q) ? q : []; };
  var passedQuiz = function (st, key) { return num(obj(obj(st.quiz)[key]).best) >= PASS; };
  function stars(best) { best = num(best); return best >= 100 ? 3 : best >= 85 ? 2 : best >= PASS ? 1 : 0; }

  /* ---------- a module's parts: app.js moduleParts' rule, plus the day each was done ---------- */
  // [{ key: read|watch|lab|code|quiz, k: Learn's name, done, n, of, day }]; day: the latest card, task or exercise,
  // the first Watch tick, the quiz's first pass; '' when not known (any undated item makes the part undated)
  function partsOf(m, state, env) {
    var c = course(env), st = obj(state), out = [];
    var add = function (key, k, done, n, of, day) { var p = { key: key, k: k, done: done, n: n, of: of, day: done ? day : '' }; out.push(p); return p; };
    var span = function (list, val, first) {
      var n = 0, d0 = '', undated = false;
      list.forEach(function (x) { var v = val(x); if (!v) return; n++; var d = dayOf(v === true ? '' : String(v), env); if (!d) undated = true; else if (!d0 || (first ? d < d0 : d > d0)) d0 = d; });
      return { n: n, day: undated ? '' : d0 };
    };
    var cards = c.cards[m.id] || [], read = obj(st.read), r;
    if (cards.length) { r = span(cards, function (x) { var v = read[m.id + '/' + x.key]; return isOn(v) ? v : ''; }); add('read', 'Read the lesson cards', r.n === cards.length, r.n, cards.length, r.day); }
    var wk = c.watch[m.id], w = obj(st.watched);
    if (wk) { r = span(wk, function (k) { return w[k]; }, true); add('watch', 'Watch the main lesson', r.n > 0, r.n ? 1 : 0, 1, r.day); }
    var lab = c.lab[m.id];
    if (lab) {
      var tasks = lab.tasks || [], ticks = obj(obj(st.labs)[lab.id]);
      r = span(tasks, function (x) { return ticks[x.id]; }); add('lab', 'Lab tasks', r.n === tasks.length && tasks.length > 0, r.n, tasks.length, r.day);
    }
    var req = c.ex[m.id] || [], ex = obj(st.ex);
    if (req.length) { r = span(req, function (e) { var v = ex[e.id]; return v && v.done ? v.at || true : ''; }); add('code', 'Practice exercises', r.n === req.length, r.n, req.length, r.day); }
    if (quizOf(env, m.id).length) {
      var q = obj(obj(st.quiz)[m.id]), b = num(q.best), p = add('quiz', 'Quiz (70% to pass)', b >= PASS, b, 100, dayOf(q.passAt, env));
      p.pctLike = true; p.tries = num(q.attempts);
    }
    return out;
  }

  /* ---------- facts: everything learned, from the saved progress and play.e ---------- */
  function facts(state, env) {
    var c = course(env), st = obj(state), e = obj(obj(st.play).e), out = [], at = dict();
    var put = function (k, kind, xp, day, n) {
      if (k in at) return out[at[k]];
      var f = { k: k, kind: kind, xp: xp, day: day || '' };
      if (n) f.n = n;
      at[k] = out.length; out.push(f);
      return f;
    };
    var rec = function (k) { return own(e, k) && typeof e[k] === 'string' && DAY_RE.test(e[k]) ? e[k] : null; };
    // a kind Play keeps: the recorded day wins, so un-ticking and ticking again never moves it to today
    var kept = function (k, kind, day) { var r = rec(k); return put(k, kind, XP[kind], r === null ? day : r === UNDATED ? '' : r); };
    // cards checked and key terms reviewed: srs fr is the day of a card's first grade
    var srs = obj(st.srs);
    Object.keys(srs).forEach(function (id) {
      var cd = srs[id], fr = cd ? dayOf(cd.fr, env) : '', p = id.split(':'), m = p.length === 3 ? c.byId[p[1]] : null, k, r;
      if (!fr || !m) return;
      if (p[0] === 'rc') { k = 'qc:' + p[1] + '/' + p[2]; r = rec(k); if (c.cardSet[k]) put(k, 'qc', XP.qc, r === null ? fr : r === UNDATED ? '' : fr < r ? fr : r); } // the earlier
      else if (p[0] === 'kt' && index(p[2], (m.keyTerms || []).length) >= 0) put('kt:' + p[1] + ':' + p[2], 'kt', XP.kt, fr);
    });
    // authored questions right the first time, and mistakes fixed
    var qa = obj(st.qa);
    Object.keys(qa).forEach(function (qid) {
      var x = qa[qid];
      if (!x || typeof x !== 'object' || !env.question(qid)) return;
      if (num(x.r) >= 1) put('q:' + qid, 'q', XP.q, firstRight(x, env));
      if (x.wrongAt && env.fixCount(x) >= 2) kept('fx:' + qid, 'fx', fixedDay(x, env));
    });
    // toll gates and checkpoints passed, full marks
    var quiz = obj(st.quiz);
    Object.keys(quiz).forEach(function (key) {
      var q = quiz[key], test = TEST_RE.test(key);
      if (!q || typeof q !== 'object' || !(test || key in c.byId) || !quizOf(env, key).length) return;
      if (num(q.best) >= PASS) put('qp:' + key, 'qp', test ? XP.qpTest : XP.qp, dayOf(q.passAt, env));
      if (num(q.best) >= 100) put('qf:' + key, 'qf', test ? XP.qfTest : XP.qf, dayOf(q.perfAt, env));
    });
    // Watch stamps, and stops cleared: every part done (Mark complete does not count), on the latest part's day
    c.mods.forEach(function (m) {
      var parts = partsOf(m, st, env), all = parts.length > 0, last = '', dated = true;
      parts.forEach(function (p) {
        if (p.key === 'watch' && p.done) p.day = kept('w:' + m.id, 'w', p.day).day;
        if (!p.done) all = false;
        else if (!p.day) dated = false;
        else if (p.day > last) last = p.day;
      });
      if (all) kept('st:' + m.id, 'st', dated ? last : '');
    });
    // lab tasks (older ticks are true: undated), exercises (any; at is a day), project milestones and projects
    var labs = obj(st.labs), ex = obj(st.ex), pr = obj(st.projects);
    (env.labs || []).forEach(function (lab) {
      var ticks = obj(labs[lab.id]);
      (lab.tasks || []).forEach(function (t) { if (ticks[t.id]) put('l:' + lab.id + '/' + t.id, 'l', XP.l, dayOf(ticks[t.id], env)); });
    });
    (env.exercises || []).forEach(function (x) { var v = ex[x.id]; if (v && typeof v === 'object' && v.done) put('x:' + x.id, 'x', XP.x, dayOf(v.at, env)); });
    (env.projects || []).forEach(function (p) {
      var s = obj(pr[p.id]), steps = obj(s.steps), sAt = obj(s.stepsAt), n = (p.milestones || []).length;
      Object.keys(steps).forEach(function (i) { if (steps[i] && index(i, n) >= 0) kept('pm:' + p.id + '/' + i, 'pm', dayOf(sAt[i], env)); });
      if (s.done) kept('pd:' + p.id, 'pd', dayOf(s.doneAt, env));
    });
    // reviews graded on all devices, up to 20 a day
    Object.keys(obj(st.rlog)).sort().forEach(function (d) {
      var n = DAY_RE.test(d) ? Math.min(RV_CAP, Math.max(0, Math.floor(num((env.reviewLog(d) || [])[0])))) : 0;
      if (n > 0) put('rv:' + d, 'rv', n * XP.rv, d, n);
    });
    // focus sessions of 10+ minutes: the first 3 of a day
    var fs = obj(st.fs), fl = [], perDay = {};
    Object.keys(fs).forEach(function (id) { var s = fs[id]; if (s && typeof s === 'object' && !s.del && num(s.mins) >= FS_MIN) fl.push({ id: id, at: String(s.at || ''), day: dayOf(s.at, env) }); });
    fl.sort(function (a, b) { return a.at < b.at ? -1 : a.at > b.at ? 1 : a.id < b.id ? -1 : 1; });
    fl.forEach(function (s) { var d = s.day || UNDATED; perDay[d] = (perDay[d] || 0) + 1; if (perDay[d] <= FS_CAP) put('fs:' + s.id, 'fs', XP.fs, s.day); });
    // recorded facts whose source is gone (undone, un-ticked) or that only Play knows (term matches) still count
    Object.keys(e).forEach(function (k) {
      var r = rec(k), kind = k.slice(0, k.indexOf(':'));
      if (r !== null && KEEP[kind] === 1 && !(k in at)) put(k, kind, XP[kind], r === UNDATED ? '' : r);
    });
    return out;
  }
  // qa.f1; for older answers the earliest kept right answer, when every right answer is still kept
  function firstRight(x, env) {
    var d = x.f1 ? dayOf(x.f1, env) : '', ok = Array.isArray(x.ok) ? x.ok : [], first = '';
    if (d || !ok.length || num(x.r) > ok.length) return d;
    ok.forEach(function (t) { if (typeof t === 'string' && (!first || t < first)) first = t; });
    return dayOf(first, env);
  }
  // the right answer that made fixCount reach 2 (the Mistakes notebook's replay)
  function fixedDay(x, env) {
    var f = (Array.isArray(x.fix) ? x.fix : []).slice().sort();
    for (var k = 2; k <= f.length; k++) if (env.fixCount({ fix: f.slice(0, k) }) >= 2) return dayOf(f[k - 1], env);
    return '';
  }
  // facts by key, kept on the list (callers must not change a facts list)
  function byKey(f) {
    if (f && f._by) return f._by;
    var b = dict();
    (f || []).forEach(function (x) { b[x.k] = x; });
    try { Object.defineProperty(f, '_by', { value: b }); } catch (e) {}
    return b;
  }

  /* ---------- XP ---------- */
  function xp(f) { var s = 0; (f || []).forEach(function (x) { s += x.xp; }); return s; }
  function xpOn(f, day) { var s = 0; (f || []).forEach(function (x) { if (day && x.day === day) s += x.xp; }); return s; }
  // [{ kind, label, n, xp }] in XP_TABLE order, only kinds with facts; with day, only that day's
  function bySource(f, day) {
    var t = {};
    (f || []).forEach(function (x) {
      if (day && x.day !== day) return;
      var r = t[x.kind] || (t[x.kind] = { kind: x.kind, label: LABEL[x.kind] || x.kind, n: 0, xp: 0 });
      r.n += x.n || 1; r.xp += x.xp;
    });
    return XP_TABLE.filter(function (r) { return t[r.kind]; }).map(function (r) { return t[r.kind]; });
  }
  // what a round added: the new facts and the XP gained, never below 0 (a pop is never negative)
  function gained(before, after) {
    var b = byKey(before || []);
    return { xp: Math.max(0, xp(after) - xp(before)), list: (after || []).filter(function (x) { return !(x.k in b); }) };
  }
  function rankOf(total) { var i = 0; for (var j = 1; j < RANKS.length; j++) if (num(total) >= RANKS[j].xp) i = j; return i; }
  // ranks never go down: the higher of the XP's rank and the highest one celebrated (play.rank)
  function shownRank(total, state) { return Math.max(rankOf(total), Math.min(RANKS.length - 1, Math.max(0, Math.floor(num(obj(obj(state).play).rank))))); }
  function rankInfo(total, state) {
    var i = shownRank(total, state), r = RANKS[i], nx = RANKS[i + 1] || null;
    return { i: i, name: r.name, icon: r.icon, xp: r.xp, next: nx, toNext: nx ? Math.max(0, nx.xp - total) : 0, pct: nx ? Math.max(0, Math.min(1, (total - r.xp) / (nx.xp - r.xp))) : 1 };
  }
  function goalOf(state) { var g = num(obj(obj(state).play).goal); return GOALS.some(function (x) { return x.xp === g; }) ? g : GOAL; }
  // the Play bar: { f, total, today (XP), day, rank (rankInfo), goal, met }
  function summary(state, env) {
    var st = state || env.state(), f = facts(st, env), t = env.today(), total = xp(f), today = xpOn(f, t), goal = goalOf(st);
    return { f: f, total: total, today: today, day: t, rank: rankInfo(total, st), goal: goal, met: today >= goal };
  }

  /* ---------- learning days and the week (state.log) ---------- */
  function weekDots(state, today) {
    var log = obj(obj(state).log), mon = monday(today), days = [];
    for (var i = 0; i < 7 && mon; i++) { var d = addDays(mon, i); days.push({ day: d, short: WEEK[i][0], name: WEEK[i][1], on: num(log[d]) > 0, today: d === today, future: d > today }); }
    var n = count(days, function (d) { return d.on; });
    return { days: days, n: n, of: 3, steady: n >= 3 };
  }
  // days learned, steady weeks (3+ learning days, Monday to Sunday), the best week, this week
  function learningDays(state, today) {
    var log = obj(obj(state).log), weeks = {}, days = 0, steady = 0, best = 0;
    Object.keys(log).forEach(function (d) { var w = DAY_RE.test(d) && num(log[d]) > 0 ? monday(d) : ''; if (w) { days++; weeks[w] = (weeks[w] || 0) + 1; } });
    Object.keys(weeks).forEach(function (w) { if (weeks[w] >= 3) steady++; if (weeks[w] > best) best = weeks[w]; });
    return { days: days, steadyWeeks: steady, bestWeek: best, week: today ? weeks[monday(today)] || 0 : 0 };
  }
  // the last learning day before today and its distance (gap 0: none), for "Welcome back"
  function lastLearned(state, today) {
    var log = obj(obj(state).log), last = '';
    Object.keys(log).forEach(function (d) { if (DAY_RE.test(d) && d < today && num(log[d]) > 0 && d > last) last = d; });
    return { day: last, gap: last ? daysBetween(last, today) : 0 };
  }

  /* ---------- key terms for the term match ---------- */
  var wordCh = function (c) { return (c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 95; };
  function hasWord(text, word) { // the word on its own, any case
    var s = String(text).toLowerCase(), w = String(word).toLowerCase(), from = 0, i;
    while (w && (i = s.indexOf(w, from)) >= 0) {
      if (!wordCh(s.charCodeAt(i - 1)) && !wordCh(s.charCodeAt(i + w.length))) return true;
      from = i + 1;
    }
    return false;
  }
  var termCache = dict();
  // [{ i, term }] (i: index in m.keyTerms); a meaning that names its own term would give the answer away
  function usableTerms(m) {
    var hit = termCache[m.id], list = [];
    if (hit && hit.m === m) return hit.list;
    (m.keyTerms || []).forEach(function (t, i) { if (t && t.term && t.meaning && !hasWord(t.meaning, t.term)) list.push({ i: i, term: t }); });
    termCache[m.id] = { m: m, list: list };
    return list;
  }
  var seeded = function (ids, seed) { return ids.map(function (i) { return { i: i, h: hash(seed + '|' + i) }; }).sort(function (a, b) { return a.h - b.h || a.i - b.i; }).map(function (x) { return x.i; }); };
  // 3 options as indexes in m.keyTerms, the right one among them: 2 other usable terms of the module, picked and
  // ordered by a seed of (module, term, local day), so a reload shows the same ones; null if the term is not asked
  function pickOptions(m, termIndex, day) {
    var u = usableTerms(m).map(function (x) { return x.i; }), base = m.id + '|' + termIndex + '|' + day;
    if (u.indexOf(termIndex) < 0 || u.length < 3) return null;
    return seeded([termIndex].concat(seeded(u.filter(function (i) { return i !== termIndex; }), base + '|w').slice(0, 2)), base + '|o');
  }
  function termOrder(m, day) { return seeded(usableTerms(m).map(function (x) { return x.i; }), m.id + '|order|' + day); }

  /* ---------- stops, the current stop and Continue ---------- */
  // the stamp strip: Read 3/7, Watch, Lab 2/4, Code 0/5, Quiz best 60%
  function stamps(m, env, state) {
    return partsOf(m, state || env.state(), env).map(function (p) {
      return { key: p.key, label: STAMP_LABEL[p.key], icon: p.key, done: p.done, n: p.n, of: p.of, text: p.key === 'quiz' ? (p.tries ? 'best ' + p.n + '%' : '') : p.key === 'watch' ? '' : p.n + '/' + p.of };
    });
  }
  function hasTerms(m) { return usableTerms(m).length >= MIN_TERMS; }
  // the next round at one stop (cards ticked and checked, the term match, the toll gate), null when all are done.
  // Watch, Lab and Code never block Continue. { kind: card|terms|quiz, href, mid, no, stop, level, title, i, n, key, mins }
  function stopNext(m, state, env, f) {
    var st = obj(state || env.state()), c = course(env), by = byKey(f || facts(st, env)), read = obj(st.read), cards = c.cards[m.id] || [];
    var round = function (r) { r.mid = m.id; r.no = c.no[m.id]; r.stop = m.title; r.level = m.level; return r; };
    for (var i = 0; i < cards.length; i++) {
      var x = cards[i];
      if (!isOn(read[m.id + '/' + x.key]) || !by['qc:' + m.id + '/' + x.key]) return round({ kind: 'card', key: x.key, title: x.title, i: i + 1, n: cards.length, href: '#play-' + m.id + '~' + x.key, mins: cardMins(m, x.key) });
    }
    var tn = usableTerms(m).length, qz = quizOf(env, m.id);
    if (tn >= MIN_TERMS && !by['tm:' + m.id]) return round({ kind: 'terms', title: 'Term match', n: tn, href: '#play-' + m.id + '~terms', mins: Math.max(2, Math.round(tn * 0.4)) });
    if (qz.length && !passedQuiz(st, m.id)) return round({ kind: 'quiz', title: 'Toll gate', n: qz.length, href: '#play-' + m.id + '~quiz', mins: qz.length });
    return null;
  }
  function cardMins(m, key) { // reading at about 150 words a minute, plus the quick check
    var words = 0, add = function (v) {
      if (Array.isArray(v)) v.forEach(add);
      else if (v && typeof v === 'object') { add(v.term); add(v.meaning); add(v.like); add(v.example); }
      else if (v) words += String(v).split(' ').length;
    };
    add(m[key]); if (key === 'overview') add(m.whyItMatters);
    return Math.max(2, Math.round(words / 150) + 1);
  }
  // "You are here": state.last while its rounds are not done, else the next stop with rounds left after it, else the
  // first from the start (a new learner: Stop 1.1); null when every stop's rounds are done
  function currentStop(state, env, f) {
    var c = course(env), st = obj(state), mods = c.mods, i;
    var li = typeof st.last === 'string' && st.last in c.ix ? c.ix[st.last] : -1;
    var open = function (m) { return !!stopNext(m, st, env, f); };
    f = f || facts(st, env);
    if (li >= 0 && open(mods[li])) return mods[li];
    for (i = li + 1; i < mods.length; i++) if (open(mods[i])) return mods[i];
    for (i = 0; i < li; i++) if (open(mods[i])) return mods[i];
    return null;
  }
  function checkpoint(lv, c, env) {
    var n = quizOf(env, c.test[lv]).length;
    return { kind: 'checkpoint', lv: lv, key: c.test[lv], title: 'Checkpoint ' + lv, n: n, href: '#play-test-l' + lv, mins: Math.max(15, Math.round(n * 1.25)) };
  }
  // Continue leaving a level, from the stop the learner was at (state.last, its rounds done; else the stop before the
  // current one) to a later level or past the road's end: the first checkpoint not passed among those levels
  function crossing(st, env, cur) {
    var c = course(env), from = typeof st.last === 'string' && st.last in c.byId ? c.byId[st.last] : null;
    if (!from && cur && c.ix[cur.id] > 0) from = c.mods[c.ix[cur.id] - 1];
    if (!from || from === cur) return 0;
    var end = cur && c.ix[cur.id] > c.ix[from.id] ? cur.level - 1 : c.lvs[c.lvs.length - 1];
    for (var i = 0; i < c.lvs.length; i++) { var lv = c.lvs[i]; if (lv >= from.level && lv <= end && c.test[lv] && !passedQuiz(st, c.test[lv])) return lv; }
    return 0;
  }
  // the per-tab session note (sessionStorage 'aimarg.play.sess'), fresh when the local day changed
  function sessFresh(s, today) {
    return s && typeof s === 'object' && s.day === today ? { day: today, cards: Math.max(0, Math.floor(num(s.cards))), warm: !!s.warm, quick: !!s.quick } : { day: today, cards: 0, warm: false, quick: false };
  }
  // Continue: warm-up, quick questions, the current stop's next round (a checkpoint first when leaving a level), any
  // checkpoint left, the end. A warm-up or quick round carries stop: the round after it, which the Road describes
  function nextRound(state, env, sess, f) {
    var st = obj(state || env.state()); f = f || facts(st, env);
    var c = course(env), t = env.today(), s = sessFresh(sess, t), cur = currentStop(st, env, f), lv = crossing(st, env, cur), i;
    var stop = lv ? checkpoint(lv, c, env) : cur ? stopNext(cur, st, env, f) : null, est = warmEstimate(st, env);
    for (i = 0; !stop && i < c.lvs.length; i++) if (c.test[c.lvs[i]] && !passedQuiz(st, c.test[c.lvs[i]])) stop = checkpoint(c.lvs[i], c, env);
    if (!stop) stop = { kind: 'done', href: '', title: 'You have travelled the whole road!', warm: est > 0, quick: quickPool(st, env, '').list.length > 0 };
    if (!s.warm && est > 0 && num((env.reviewLog(t) || [])[0]) < 5) return { kind: 'warmup', href: '#play-warmup', title: 'Warm-up', cards: Math.min(WARM_MAX, est), mins: Math.max(2, Math.round(Math.min(WARM_MAX, est) / 2)), stop: stop };
    var qp = s.cards >= 2 && !s.quick ? quickPool(st, env, cur ? cur.id : '') : null;
    if (qp && qp.list.length) return { kind: 'quick', href: '#play-quick', title: 'Quick questions', n: qp.list.length, mins: qp.list.length, stop: stop };
    return stop;
  }
  // a toll gate's way on: the next stop, or after a level's last stop its checkpoint
  function nextStop(m, env) {
    var c = course(env), n = c.mods[c.ix[m.id] + 1];
    if ((!n || n.level !== m.level) && c.test[m.level]) return { kind: 'checkpoint', lv: m.level, href: '#play-test-l' + m.level, label: 'Checkpoint ' + m.level };
    return n ? { kind: 'stop', mid: n.id, href: '#play-' + n.id, label: 'Next stop: ' + c.no[n.id] + ' ' + n.title } : null;
  }
  // review cards ready now (seen before and due), by module; only cards Daily review can show (liveCard), as the
  // warm-up and the quests count them
  function dueByModule(state, env) {
    var c = course(env), t = env.today(), srs = obj(obj(state).srs), out = {};
    Object.keys(srs).forEach(function (id) { var cd = srs[id], mid = id.split(':')[1]; if (liveCard(srs, id, c) && num(cd.reps) > 0 && String(cd.due || '') <= t) out[mid] = (out[mid] || 0) + 1; });
    return out;
  }
  // a stop. cards[].state: done | check | learn (ticked before Play was first opened: read in Learn) | read (checked,
  // not ticked) | todo
  function stopState(m, env, state, f, due) {
    var st = obj(state || env.state()); f = f || facts(st, env);
    var c = course(env), by = byKey(f), read = obj(st.read), first = String(obj(st.play).first || ''), cards = c.cards[m.id] || [];
    var list = cards.map(function (x, i) {
      var v = read[m.id + '/' + x.key], on = isOn(v), ck = !!by['qc:' + m.id + '/' + x.key];
      var s = on && ck ? 'done' : on ? (!first || String(v) < first ? 'learn' : 'check') : ck ? 'read' : 'todo';
      return { key: x.key, title: x.title, i: i + 1, n: cards.length, read: on, checked: ck, state: s, label: CARD_STATE[s] };
    });
    var sts = stamps(m, env, st), q = obj(obj(st.quiz)[m.id]), best = num(q.best), tn = usableTerms(m).length, next = stopNext(m, st, env, f);
    return {
      id: m.id, m: m, no: c.no[m.id], level: m.level, title: m.title, hours: m.hours || 0,
      stamps: sts, stampsDone: count(sts, function (x) { return x.done; }), cards: list, cardsDone: count(list, function (x) { return x.state === 'done'; }),
      terms: { has: tn >= MIN_TERMS, n: tn, done: !!by['tm:' + m.id] },
      quiz: { has: quizOf(env, m.id).length > 0, n: quizOf(env, m.id).length, best: best, tries: num(q.attempts), passed: best >= PASS, stars: stars(best) },
      cleared: !!by['st:' + m.id], marked: !!obj(obj(st.modules)[m.id]).done, done: !next, next: next,
      due: (due || dueByModule(st, env))[m.id] || 0
    };
  }
  // a level's road: its stops with at most one chip each (here, cleared, marked, due), toll gates, checkpoint, projects
  function levelState(lv, state, env, f) {
    var st = obj(state || env.state()); f = f || facts(st, env);
    var c = course(env), due = dueByModule(st, env), cur = currentStop(st, env, f), lvl = (env.levels || []).filter(function (l) { return l.id === lv; })[0];
    var stops = (c.byLv[lv] || []).map(function (m) {
      var s = stopState(m, env, st, f, due);
      s.here = !!cur && cur.id === m.id;
      s.chip = s.here ? 'here' : s.cleared ? 'cleared' : s.marked ? 'marked' : s.due ? 'due' : '';
      return s;
    });
    var key = c.test[lv] || '', tq = obj(obj(st.quiz)[key]);
    var projects = (env.projects || []).filter(function (p) { return p.level === lv; }).map(function (p) {
      var s = obj(obj(st.projects)[p.id]), steps = obj(s.steps), n = (p.milestones || []).length, k = 0;
      for (var i = 0; i < n; i++) if (steps[i]) k++;
      return { id: p.id, title: p.title, done: !!s.done, n: k, of: n };
    });
    return {
      lv: lv, title: lvl ? lvl.title : 'Level ' + lv, stops: stops, here: cur && cur.level === lv ? cur.id : '', of: stops.length,
      cleared: count(stops, function (s) { return s.cleared; }), gates: count(stops, function (s) { return s.quiz.passed; }),
      test: { key: key, has: !!key, n: quizOf(env, key).length, best: num(tq.best), tries: num(tq.attempts), passed: !!key && num(tq.best) >= PASS },
      projects: projects, projectsDone: count(projects, function (p) { return p.done; })
    };
  }

  /* ---------- warm-up and quick questions ---------- */
  // a card Daily review can show and has not had removed: 'rc:<module>:<card>' or 'kt:<module>:<i>'
  function liveCard(srs, id, c) {
    var cd = srs[id], p = id.split(':'), m = p.length === 3 && p[1] in c.byId ? c.byId[p[1]] : null;
    if (!cd || cd.off || !m) return false;
    return p[0] === 'rc' ? !!c.cardSet['qc:' + p[1] + '/' + p[2]] : p[0] === 'kt' && index(p[2], (m.keyTerms || []).length) >= 0;
  }
  // a warm-up's cards now: seen and due, plus new ones up to today's new-card limit (Daily review's rule)
  function warmEstimate(state, env) {
    var c = course(env), t = env.today(), srs = obj(obj(state).srs), due = 0, fresh = 0;
    Object.keys(srs).forEach(function (id) { if (!liveCard(srs, id, c)) return; if (!num(srs[id].reps)) fresh++; else if (String(srs[id].due || '') <= t) due++; });
    return due + Math.min(fresh, Math.max(0, num(env.newLeftToday())));
  }
  // one Fix-it (the oldest open mistake not answered today), then up to 2 from other stops: wrong last time first,
  // then the least recently answered. Only toll gates already tried: never a level-test question, never a toll gate
  // before its first attempt. { fix, mixed, list: [{ qid, q, mid, kind: 'fix'|'mixed', label }] }
  function quickPool(state, env, currentMid) {
    var c = course(env), st = obj(state), qa = obj(st.qa), quiz = obj(st.quiz), t = env.today(), fixes = [], cands = [], mixed = [];
    var tried = function (set) { return typeof set === 'string' && set in c.byId && num(obj(quiz[set]).attempts) >= 1; };
    var item = function (x, kind) { return { qid: x.qid, q: x.q, mid: x.mid, kind: kind, label: kind === 'fix' ? 'Fix-it' : 'From Stop\u00a0' + c.no[x.mid] }; }; // a no-break space: "Stop 1.4" never wraps
    Object.keys(qa).forEach(function (qid) {
      var x = qa[qid], q = x && typeof x === 'object' ? env.question(qid) : null, set = q ? env.questionSet(qid) : null;
      if (q && tried(set) && env.isMistake(x) && !(x.at && env.localDay(x.at) === t)) fixes.push({ qid: qid, q: q, mid: set, w: String(x.wrongAt || ''), o: c.ix[set] });
    });
    fixes.sort(function (a, b) { return a.w < b.w ? -1 : a.w > b.w ? 1 : a.o - b.o || (a.qid < b.qid ? -1 : 1); });
    var fix = fixes.length ? item(fixes[0], 'fix') : null;
    c.mods.forEach(function (m) {
      if (m.id === currentMid || !tried(m.id)) return;
      quizOf(env, m.id).forEach(function (q, j) {
        var x = obj(q && qa[q.id]);
        if (q && q.id && !(fix && q.id === fix.qid)) cands.push({ qid: q.id, q: q, mid: m.id, wrong: num(x.n) > 0 && !x.lr ? 1 : 0, at: String(x.at || ''), o: c.ix[m.id] * 1000 + j });
      });
    });
    cands.sort(function (a, b) { return b.wrong - a.wrong || (a.at < b.at ? -1 : a.at > b.at ? 1 : a.o - b.o); });
    if (cands.length) mixed.push(cands[0]);
    var other = cands.filter(function (x) { return x.mid !== cands[0].mid; })[0] || cands[1]; // two stops when there are two
    if (other) mixed.push(other);
    mixed = mixed.map(function (x) { return item(x, 'mixed'); });
    return { fix: fix, mixed: mixed, list: (fix ? [fix] : []).concat(mixed).slice(0, QUICK_MAX) };
  }

  /* ---------- today's quests: worked out, never stored, no XP of their own ---------- */
  // [{ id: warm|new|hands, icon, text, n, of, done }]
  function quests(state, f, env) {
    var st = obj(state || env.state()); f = f || facts(st, env);
    var c = course(env), by = byKey(f), t = env.today(), srs = obj(st.srs), qa = obj(st.qa), read = obj(st.read), q = [];
    var today = function (fn) { return count(f, function (x) { return x.day === t && fn(x); }); };
    var qcToday = today(function (x) { return x.kind === 'qc'; });
    // 1. warm-up: review 5 cards, fewer when fewer were in review this morning (first graded, or their lesson card
    // ticked, before today) or can be reviewed today, so a card added today never changes it; none: check a card
    var before = function (v) { var d = isOn(v) ? dayOf(String(v), env) : ''; return !!d && d < t; };
    var base = 0, due = 0, fresh = 0;
    Object.keys(srs).forEach(function (id) {
      var cd = srs[id], p = id.split(':');
      if (!liveCard(srs, id, c) || !((cd.fr && String(cd.fr) < t) || before(read[p[1] + '/' + (p[0] === 'rc' ? p[2] : 'keyTerms')]))) return;
      base++;
      if (!num(cd.reps)) fresh++; else if (String(cd.due || '') <= t) due++;
    });
    var reviewed = num((env.reviewLog(t) || [])[0]), ready = reviewed + due + Math.min(fresh, Math.max(0, num(env.newLeftToday()))), of = Math.min(5, base, ready);
    q.push(of ? { id: 'warm', icon: 'warmup', text: 'Review ' + plural(of, 'card'), n: Math.min(of, reviewed), of: of } : { id: 'warm', icon: 'check', text: 'Check 1 lesson card', n: Math.min(1, qcToday), of: 1 });
    // 2. new ground: check 2 lesson cards; once every card was checked before today, answer 5 questions
    var left = count(c.cardKeys, function (k) { return !by[k] || by[k].day === t; });
    if (left) q.push({ id: 'new', icon: 'card', text: 'Check ' + plural(Math.min(2, left), 'lesson card'), n: Math.min(2, left, qcToday), of: Math.min(2, left) });
    else q.push({ id: 'new', icon: 'question', text: 'Answer 5 questions', n: Math.min(5, answeredOn(qa, env, t)), of: 5 });
    // 3. hands-on: a lab task, an exercise, a project milestone or a Watch stamp, dated today
    q.push({ id: 'hands', icon: 'hands', text: 'Do 1 hands-on task', n: Math.min(1, today(function (x) { return HANDS[x.kind] === 1; })), of: 1 });
    q.forEach(function (x) { x.done = x.n >= x.of; });
    return q;
  }

  // authored questions answered on a day, right or wrong (qa.at is the latest answer)
  function answeredOn(qa, env, day) { return count(Object.keys(qa), function (qid) { var x = qa[qid]; return !!x && !!x.at && !!env.question(qid) && env.localDay(x.at) === day; }); }
  // the postcard's day: { xp, cards checked, reviews graded (all of them), questions answered, mistakes fixed, hands-on
  // tasks done (the hands-on quest's rule: lab tasks, exercises, project steps and Watch stamps) }
  function dayCounts(state, f, env, day) {
    var st = obj(state || env.state()), t = day || env.today(); f = f || facts(st, env);
    var on = function (kind) { return count(f, function (x) { return x.kind === kind && x.day === t; }); };
    return { day: t, xp: xpOn(f, t), cards: on('qc'), reviews: num((env.reviewLog(t) || [])[0]), answered: answeredOn(obj(st.qa), env, t), fixed: on('fx'),
      hands: count(f, function (x) { return HANDS[x.kind] === 1 && x.day === t; }) };
  }
  // the postcard's flashback: a lesson card ticked 3 or more days ago, picked by the day; null when there is none
  function flashback(state, env, day) {
    var c = course(env), read = obj(obj(state || env.state()).read), t = day || env.today(), list = [];
    c.mods.forEach(function (m) {
      c.cards[m.id].forEach(function (x) { var v = read[m.id + '/' + x.key], d = isOn(v) ? dayOf(String(v), env) : ''; if (d && daysBetween(d, t) >= 3) list.push({ m: m, mid: m.id, no: c.no[m.id], key: x.key, title: x.title, day: d }); });
    });
    return list.length ? list[hash('flashback|' + t) % list.length] : null;
  }

  /* ---------- badges: earned once, kept forever ---------- */
  // the counts badges read, worked out once
  function badgeContext(state, f, env) {
    var st = obj(state || env.state()); f = f || facts(st, env);
    var c = course(env), by = byKey(f), quiz = obj(st.quiz), srs = obj(st.srs), t = env.today(), x = { n: {}, tried: 0, gates: 0, full: 0, permits: {}, permitBest: {}, labsDone: 0, labBest: { n: 0, of: 0 }, reviews: 0, held: 0 };
    f.forEach(function (y) { x.n[y.kind] = (x.n[y.kind] || 0) + 1; });
    var has = function (k) { return k in by; };
    x.cards = count(c.cardKeys, has); x.cardsOf = c.cardKeys.length; x.terms = count(c.termKeys, has); x.termsOf = c.termKeys.length; x.rightOf = c.qN;
    x.stops = count(c.mods, function (m) { return has('st:' + m.id); }); x.stopsOf = c.mods.length;
    c.mods.forEach(function (m) {
      var q = obj(quiz[m.id]);
      if (!quizOf(env, m.id).length) return;
      if (num(q.attempts) >= 1) x.tried++;
      if (num(q.best) >= PASS) x.gates++;
      if (num(q.best) >= 100) x.full++;
    });
    [1, 2, 3, 4].forEach(function (lv) { x.permitBest[lv] = num(obj(quiz['test-l' + lv]).best); x.permits[lv] = !!c.test[lv] && x.permitBest[lv] >= PASS; });
    (env.labs || []).forEach(function (lab) {
      var tasks = lab.tasks || [], ticks = obj(obj(st.labs)[lab.id]), k = count(tasks, function (y) { return ticks[y.id]; });
      if (tasks.length && k === tasks.length) x.labsDone++;
      if (tasks.length && (!x.labBest.of || k / tasks.length > x.labBest.n / x.labBest.of)) x.labBest = { n: k, of: tasks.length };
    });
    x.days = learningDays(st, t);
    Object.keys(obj(st.rlog)).forEach(function (d) { if (DAY_RE.test(d)) x.reviews += Math.max(0, num((env.reviewLog(d) || [])[0])); });
    Object.keys(srs).forEach(function (id) { x.held = Math.max(x.held, srs[id] ? num(env.heldDays(srs[id], t)) : 0); });
    return x;
  }
  var cnt = function (kind) { return function (x) { return x.n[kind] || 0; }; };
  var get = function (k) { return function (x) { return k.split('.').reduce(function (o, p) { return o[p]; }, x); }; };
  // a badge earned at a count; progress { n, of, text } reads "32 of 50 cards" ("Done" / "Not yet" for one thing)
  function B(group, id, name, cond, icon, val, of, unit) {
    var target = typeof of === 'function' ? of : function () { return of; };
    return { id: id, group: group, name: name, cond: cond, icon: icon,
      test: function (x) { return target(x) > 0 && val(x) >= target(x); },
      progress: function (x) { var o = target(x), n = Math.min(val(x), o); return { n: n, of: o, text: o === 1 ? (n ? 'Done' : 'Not yet') : n + ' of ' + o + ' ' + unit }; } };
  }
  function permit(lv) {
    return { id: 'permit-' + lv, group: 'Checkpoints', name: 'Road permit: Level ' + lv, cond: 'Pass Checkpoint ' + lv + ' (the Level ' + lv + ' test) with 70% or more', icon: 'permit' + lv,
      test: function (x) { return !!x.permits[lv]; },
      progress: function (x) { var b = x.permitBest[lv]; return { n: Math.min(b, PASS), of: PASS, text: x.permits[lv] ? 'Done' : b ? 'Best ' + b + '% · pass at 70%' : 'Not tried yet' }; } };
  }
  var BADGES = [
    B('Start', 'first-check', 'First check', 'Check your first lesson card', 'check', cnt('qc'), 1),
    B('Start', 'first-quiz', 'Quiz taker', 'Take any toll gate (module quiz)', 'quiz', get('tried'), 1),
    B('Start', 'first-gate', 'First toll gate', 'Pass any toll gate with 70% or more', 'gate', get('gates'), 1),
    B('Start', 'first-stop', 'First stop cleared', 'Earn every stamp at one stop', 'stop', cnt('st'), 1),
    B('Learning', 'checks-50', 'Card collector', 'Check 50 lesson cards', 'cards', cnt('qc'), 50, 'cards'),
    B('Learning', 'checks-all', 'Every card checked', 'Check every lesson card in the course', 'cards-all', get('cards'), get('cardsOf'), 'cards'),
    B('Learning', 'terms-50', 'Word finder', 'Review 50 key terms', 'terms', cnt('kt'), 50, 'key terms'),
    B('Learning', 'terms-all', 'Word master', 'Review every key term in the course', 'terms-all', get('terms'), get('termsOf'), 'key terms'),
    B('Learning', 'right-100', 'Hundred right', 'Answer 100 different quiz questions right', 'right', cnt('q'), 100, 'questions'),
    B('Learning', 'full-marks', 'Full marks', 'Score 100% at any toll gate', 'star', get('full'), 1),
    B('Learning', 'gates-10', 'Ten toll gates', 'Pass 10 toll gates', 'gates', get('gates'), 10, 'toll gates'),
    B('Learning', 'fixer-10', 'Mistake fixer', 'Fix 10 past mistakes (each answered right on two different days)', 'fix', cnt('fx'), 10, 'mistakes'),
    permit(1), permit(2), permit(3), permit(4),
    { id: 'lab-1', group: 'Hands-on', name: 'Lab explorer', cond: 'Finish every task in one lab', icon: 'lab',
      test: function (x) { return x.labsDone >= 1; },
      progress: function (x) { var b = x.labBest; return x.labsDone ? { n: 1, of: 1, text: 'Done' } : { n: b.n, of: b.of, text: b.n + ' of ' + b.of + ' tasks in one lab' }; } },
    B('Hands-on', 'code-10', 'Code builder', 'Solve 10 coding exercises', 'code', cnt('x'), 10, 'exercises'),
    B('Hands-on', 'watch-5', 'Good listener', 'Earn the Watch stamp at 5 stops', 'watch', cnt('w'), 5, 'Watch stamps'),
    B('Hands-on', 'project-1', 'Project builder', 'Finish a project', 'project', cnt('pd'), 1),
    B('Habit and memory', 'week-1', 'Steady week', 'Learn on 3 days in one week (Monday to Sunday)', 'week', get('days.bestWeek'), 3, 'learning days in one week'),
    B('Habit and memory', 'weeks-4', 'Steady month', 'Have 4 steady weeks of 3 learning days (they need not be in a row)', 'month', get('days.steadyWeeks'), 4, 'steady weeks'),
    B('Habit and memory', 'days-30', 'Thirty days', 'Learn on 30 days (they need not be in a row)', 'days', get('days.days'), 30, 'days'),
    B('Habit and memory', 'review-100', 'Memory builder', 'Grade 100 review cards', 'review', get('reviews'), 100, 'reviews'),
    B('Habit and memory', 'long-memory', 'Long memory', 'Keep a review card remembered for 21 days', 'memory', get('held'), 21, 'days'),
    { id: 'whole-road', group: 'Finale', name: 'The whole road', cond: 'Clear every stop and earn all 4 road permits', icon: 'road',
      test: function (x) { return x.stopsOf > 0 && x.stops >= x.stopsOf && x.permits[1] && x.permits[2] && x.permits[3] && x.permits[4]; },
      progress: function (x) { var p = count([1, 2, 3, 4], function (lv) { return x.permits[lv]; }); return { n: x.stops + p, of: x.stopsOf + 4, text: x.stops + ' of ' + x.stopsOf + ' stops · ' + p + ' of 4 permits' }; } }
  ];
  // the Badges page: [{ id, group, name, cond, icon, earned (ISO time or ''), on (condition true now), progress }]
  function badgeList(state, f, env) {
    var st = obj(state || env.state()), x = badgeContext(st, f, env), have = obj(obj(st.play).badges);
    return BADGES.map(function (b) { return { id: b.id, group: b.group, name: b.name, cond: b.cond, icon: b.icon, earned: typeof have[b.id] === 'string' ? have[b.id] : '', on: b.test(x), progress: b.progress(x) }; });
  }

  /* ---------- what Play writes into state.play ---------- */
  var recorded = function (e, k) { return own(e, k) && DAY_RE.test(String(e[k])); };
  // what to record, without changing state: e = { key: day } for new facts of the kinds kept ('0000-00-00' when
  // undated), badges = { id: true } earned now and not stored, n = how many
  function observe(state, f, env) {
    var st = obj(state || env.state()); f = f || facts(st, env);
    var P = obj(st.play), e = obj(P.e), have = obj(P.badges), out = { e: {}, badges: {}, n: 0 }, x = badgeContext(st, f, env);
    f.forEach(function (y) { if (OBSERVE[y.kind] === 1 && !recorded(e, y.k)) { out.e[y.k] = y.day || UNDATED; out.n++; } });
    BADGES.forEach(function (b) { if (!have[b.id] && b.test(x)) { out.badges[b.id] = true; out.n++; } });
    return out;
  }
  function ensurePlay(state) {
    var P = state.play = obj(state.play) === state.play ? state.play : {};
    if (obj(P.e) !== P.e) P.e = {};
    if (obj(P.badges) !== P.badges) P.badges = {};
    return P;
  }
  // write observe()'s result (badges get nowIso); returns how many were added, so the caller saves only then
  function applyObserved(state, obs, nowIso) {
    if (!state || !obs) return 0;
    var P = ensurePlay(state), n = 0;
    Object.keys(obs.e || {}).forEach(function (k) { if (!recorded(P.e, k)) { P.e[k] = obs.e[k]; n++; } });
    Object.keys(obs.badges || {}).forEach(function (id) { if (!P.badges[id]) { P.badges[id] = nowIso; n++; } });
    return n;
  }
  // record a fact once, when it happens: the quick check 'qc:<mid>/<card>', a term match 'tm:<mid>'
  function record(state, key, day) {
    var P = ensurePlay(state);
    if (recorded(P.e, key)) return false;
    P.e[key] = day || UNDATED;
    return true;
  }

  /* ---------- routes ---------- */
  // { screen: road|stop|card|terms|quiz|test|warmup|quick|done|badges|help|notfound, m, mid, key, lv }; null for
  // anything that is not a Play route (#playground among them)
  function parseRoute(hash, env) {
    var h = String(hash || '').replace(/^#/, ''), c, t, r, m, out;
    if (!ROUTE_RE.test(h)) return null;
    if (h === 'play') return { screen: 'road' };
    if (own(WORDS, h)) return { screen: WORDS[h] };
    c = course(env); t = TEST_ROUTE.exec(h);
    if (t) return c.test[t[1]] && String(Number(t[1])) === t[1] ? { screen: 'test', lv: Number(t[1]), key: c.test[t[1]] } : { screen: 'notfound' };
    r = MOD_ROUTE.exec(h); m = r && r[1] in c.byId ? c.byId[r[1]] : null;
    if (!m) return { screen: 'notfound' };
    out = { screen: 'stop', m: m, mid: m.id };
    if (r[2] === 'terms') out.screen = hasTerms(m) ? 'terms' : 'notfound';
    else if (r[2] === 'quiz') out.screen = quizOf(env, m.id).length ? 'quiz' : 'notfound';
    else if (r[2]) { out.screen = c.cards[m.id].some(function (x) { return x.key === r[2]; }) ? 'card' : 'notfound'; out.key = r[2]; }
    return out;
  }

  /* ---------- the env in the browser, built once ---------- */
  var benv = null;
  function browserEnv() {
    var A = window.AIM_APP, ST = window.AIM_STUDY, C = window.AIM_CORE, D = window.AIM || {};
    if (benv || !A || !ST || !C) return benv;
    benv = {
      modules: D.modules || [], levels: D.levels || [], quizzes: D.quizzes || {}, projects: D.projects || [], exercises: D.exercises || [], labs: D.labs || [],
      readCards: A.readCards, labOf: A.labOf, exOf: A.exOf, moduleParts: A.moduleParts,
      watchKeys: function (m) { // moduleParts' Watch rule: the best pick or a Recommended video, ticked (isTicked's keys)
        var mp = A.mainPicks(m), keys = [];
        if (!mp || !mp.main) return null;
        mp.list.forEach(function (r) { if (r === mp.main || A.isRecommended(mp, r)) { keys.push(r.id); if (A.isShared(r)) keys.push(m.id + '|' + r.id); } });
        return keys;
      },
      question: ST.question, questionSet: ST.questionSet, fixCount: ST.fixCount, isMistake: ST.isMistake, heldDays: ST.heldDays,
      reviewLog: ST.reviewLog, newLeftToday: ST.newLeftToday, today: ST.today, localDay: ST.localDay, addDays: ST.addDays, daysBetween: ST.daysBetween,
      state: function () { return C.state; }
    };
    return benv;
  }

  window.AIM_PLAY_RULES = {
    PASS: PASS, UNDATED: UNDATED, XP: XP, XP_TABLE: XP_TABLE, RV_CAP: RV_CAP, FS_CAP: FS_CAP, FS_MIN: FS_MIN, WARM_MAX: WARM_MAX, MIN_TERMS: MIN_TERMS,
    RANKS: RANKS, GOALS: GOALS, GOAL: GOAL, CARD_KEYS: CARD_KEYS, ROUTE_RE: ROUTE_RE,
    facts: facts, xp: xp, xpOn: xpOn, bySource: bySource, gained: gained, summary: summary, rankOf: rankOf, shownRank: shownRank, rankInfo: rankInfo, goalOf: goalOf,
    partsOf: partsOf, stamps: stamps, stars: stars, stopState: stopState, levelState: levelState, currentStop: currentStop, stopNext: stopNext, nextRound: nextRound,
    sessFresh: sessFresh, cardMins: cardMins, nextStop: nextStop, parseRoute: parseRoute, warmEstimate: warmEstimate, quickPool: quickPool,
    usableTerms: usableTerms, pickOptions: pickOptions, termOrder: termOrder,
    quests: quests, weekDots: weekDots, learningDays: learningDays, lastLearned: lastLearned, dayCounts: dayCounts, flashback: flashback, addDays: addDays, daysBetween: daysBetween,
    BADGES: BADGES, badgeContext: badgeContext, badgeList: badgeList, observe: observe, applyObserved: applyObserved, record: record, browserEnv: browserEnv
  };
})();

/* =====================================================================================================================
   Part B: the Play mode screens: the shell (routes, Play bar, Welcome, Road, Stop, Postcard, Badges, How Play works) and
   the parts the six rounds share. Rules come from AIM_PLAY_RULES (R); screens draw with AIM_APP.setView.
   PART B API, window.AIM_PLAY:
     registerRound(screen, fn(route))  card|terms|quiz|test|warmup|quick; route = R.parseRoute() { screen, m, mid, key, lv }
     roundPage(route, { title, h1, top, body, back })  a round's page: bar (way back to its stop), h1, body; = draw()
     draw(html, title, { back })       any round page in the root div.wrap.pl#pl-root; root(), inRound(on, quiet),
                                       onLeave(fn), later(fn, ms), atStop(mid)
     barHTML({ road } or { back: { href, text, name }, title }), refreshBar(), dotsHTML(states, label)
     snap() { f, total, today, day, rank, goal, met, badges }, begin(mid) (a round's "before"; it first keeps what
     was earned before the round), next(), go(round), sess(), sessSet(patch), calm(), still(), setPref(k, v) (a
     setting in prefs.play, stamped; the caller saves), pickLevel(lv) (the Road's level, kept while the current
     stop's level stays the same; the caller saves), recordFact(key), observeNow(), live(msg), pop(text, el)
     resultHTML(o), showResult(el, o)  o: { title, lead (HTML under the heading: the round's score line), before, after,
                                       extra, moment, momentLine, next, at, focus }
     icon(name), stoneHTML(no, lv, on, fill), barrierHTML(up, lift), permitHTML(lv, land), stampOn(el, text),
     goOut(href, label) (or a[data-pl-out="label"]); HTML: btn(href, text, cls, attrs), sec(id, h, body, cls, hc, tag),
     box(id, h, body, cls), sr(text), fmtDay, n0, pl(n, 'card'), stopLb(no) ("Stop 1.2" with a no-break space), esc, inline;
     R, env
   The shell's data-pl values: ring next start lv x learn calm jsave goal.
   A pointer click inside the Play root within 400 ms of a draw() or a showResult() is ignored (a double tap carried
   over from the last page or control); the card round and the warm-up do the same after swapping their own controls
   (msNow() is the guard's clock, tooSoon(ev, at) its test). The keyboard is never blocked.
   ===================================================================================================================== */
(function () {
  'use strict';
  // the screens need Learn's code and the study helpers (the Node checks load this file without them)
  if (typeof document === 'undefined' || !window.AIM_STUDY || !window.AIM_APP) return;
  var R = window.AIM_PLAY_RULES, A = window.AIM_APP, ST = window.AIM_STUDY, C = window.AIM_CORE;
  if (!R || !C || typeof ST.addRoute !== 'function' || typeof C.onSave !== 'function') return;
  var env = R.browserEnv(), esc = C.esc, inline = C.inline;
  // WANT (this tab): the Play page a first visit asked for, opened after the Welcome's Start playing
  var BACK = 'aimarg.play.back', WANT = 'aimarg.play.want', SS = 'sessionStorage', LS = 'localStorage';
  var NAMES = { card: 'Card round', terms: 'Term match', quiz: 'Toll gate', test: 'Checkpoint', warmup: 'Warm-up', quick: 'Quick questions' };
  var ROAD = { href: '#play', text: 'Road', name: 'Back to the road' };
  var rounds = {}, view = {}, cache = null, shown = -1, hookT = 0, timers = [], liveT = 0, goalOpen = false, banner = null, tip = null, cues = {}, flash = {}, tmrw = {}, drawnAt = -Infinity;
  var S = function () { return C.state; };

  /* ---------- helpers ---------- */
  var n0 = function (n) { return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
  var pl = function (n, one) { return n0(n) + ' ' + one + (n === 1 ? '' : 's'); };
  var about = function (n, one) { return (n === 1 ? '' : 'about ') + pl(n, one); }; // "about 3 cards", but "1 card"
  // the double-tap guard's clock: performance.now() never jumps (the system clock can be moved back, or frozen)
  var msNow = function () { return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now(); };
  // a pointer click (detail > 0) less than 400 ms after at is the second tap of a double tap; the keyboard never is
  var tooSoon = function (ev, at) { return ev.detail > 0 && msNow() - at < 400; };
  var count = function (l, fn) { var k = 0; l.forEach(function (x) { if (fn(x)) k++; }); return k; };
  var each = function (el, sel, fn) { Array.prototype.forEach.call(el.querySelectorAll(sel), fn); };
  var sr = function (t) { return '<span class="visually-hidden">' + t + '</span>'; };
  var btn = function (href, t, cls, x) { return '<a class="btn' + (cls ? ' ' + cls : '') + '" href="' + esc(href) + '"' + (x || '') + '>' + t + '</a>'; };
  // tag: the heading's tag, h2 unless given (a section inside a result panel, whose own heading is an h2, takes h3)
  var sec = function (id, h, body, cls, hc, tag) { var t = tag || 'h2'; return '<section class="' + (cls || '') + '" aria-labelledby="' + id + '"><' + t + ' class="' + (hc || 'h-sub') + '" id="' + id + '">' + h + '</' + t + '>' + body + '</section>'; };
  var box = function (id, h, body, cls) { return sec(id, h, body, 'card ' + (cls || ''), 'h-sub3'); };
  var mod = function (id) { return A.modById[id] || null; };
  var no = function (m) { return A.modNo(m); };
  // "Stop 1.2" with a no-break space, so the number never wraps away from its word (bars, eyebrows, the way back)
  var stopLb = function (n) { return 'Stop\u00a0' + n; };
  var lvTitle = function (lv) { var l = A.levelById[lv]; return l ? l.title : 'Level ' + lv; };
  function hash() { var h = (location.hash || '').replace(/^#/, ''); try { return decodeURIComponent(h); } catch (e) { return h; } }
  // storage can throw when site data is blocked, or refuse every write (old private modes): Play then keeps its notes
  // for this page in memory (mem, by storage and key), so the session note and the rest still work until it is closed
  var mem = {};
  function sraw(k, key) { try { return window[k].getItem(key); } catch (e) { return null; } }
  function sget(k, key) {
    var v = null;
    try { v = JSON.parse(sraw(k, key) || mem[k + ' ' + key] || 'null'); } catch (e) {}
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
  }
  function sput(k, key, v) {
    var t = v == null ? null : JSON.stringify(v);
    mem[k + ' ' + key] = t;
    try { if (t == null) window[k].removeItem(key); else window[k].setItem(key, t); } catch (e) {}
  }
  // '3 Nov' (the year too when it is not this year) from a day or an ISO time; '' when there is none
  function fmtDay(v) {
    var m = /^(\d{4})-(\d\d)-(\d\d)/.exec(typeof v === 'string' && v.indexOf('T') > 0 ? env.localDay(v) : String(v || ''));
    return !m || m[1] < '2000' ? '' : Number(m[3]) + ' ' + 'JanFebMarAprMayJunJulAugSepOctNovDec'.substr(m[2] * 3 - 3, 3) + (m[1] === env.today().slice(0, 4) ? '' : ' ' + m[1]);
  }
  function focusEl(el) { if (typeof el === 'string') el = document.getElementById(el); if (el) { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } } }

  /* ---------- state.play (synced) and prefs.play (this device; core keeps prefs unchecked) ---------- */
  function P() { var st = S(); if (!st.play || typeof st.play !== 'object') st.play = {}; return st.play; }
  var prefR = function () { var p = S().prefs.play; return p && typeof p === 'object' && !Array.isArray(p) ? p : {}; };
  function pref() { var p = S().prefs; if (!p.play || typeof p.play !== 'object' || Array.isArray(p.play)) p.play = {}; return p.play; }
  // every change to Play's settings on this device: at says when, so another tab of this browser takes the newer
  // settings instead of keeping its own (core.js takeOther). The caller saves
  function setPref(k, v) { var p = pref(); p[k] = v; p.at = C.stamp(); }
  function prefLv() { var v = Number(prefR().lv); return v >= 1 && v <= 4 && Math.floor(v) === v ? v : 0; }
  // the level of the current stop ("You are here"), 0 past the road's end
  function curLevel() { var cur = R.currentStop(S(), env, snap().f); return cur ? cur.level : 0; }
  // a level the learner picks for the Road is kept with the current stop's level (lvAt): the Road shows it only while
  // the current stop is still on that level, so an old pick never hides "You are here". The caller saves
  function pickLevel(lv) { setPref('lv', lv); setPref('lvAt', curLevel()); }
  function reduced() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function calm() { var c = prefR().calm; return typeof c === 'boolean' ? c : reduced(); }
  var still = function () { return calm() || reduced(); };
  function sess() { return R.sessFresh(sget(SS, 'aimarg.play.sess'), env.today()); }
  function sessSet(o) { var s = sess(); Object.keys(o || {}).forEach(function (k) { s[k] = o[k]; }); s = R.sessFresh(s, s.day); sput(SS, 'aimarg.play.sess', s); return s; }
  function seen() { return sget(LS, 'aimarg.play.seen') || {}; }
  function seenSet(o) { var s = seen(); Object.keys(o).forEach(function (k) { s[k] = o[k]; }); sput(LS, 'aimarg.play.seen', s); }

  /* ---------- a copy of the play part kept in this browser (aimarg.play.keep) ---------- */
  // A tab still running the code from before Play mode merges the play part only one level deep, and its next save
  // writes its own old copy back: Play's facts, badges and rank floor would be wiped. So this browser keeps a copy of
  // the play part, written after each save that changed it, and Play merges it back when it loads, unless a reset or
  // a restore came after it (aimarg.sync, which old and new code both write). s: aimarg.sync as it was when the copy
  // was written, so a later reset or restore is seen even when the device's clock was moved back in between
  var KEEP = 'aimarg.play.keep', keptText = ''; // keptText: the play part this page last copied
  C.onSave(function (st) {
    var p = st && st.play, t;
    if (!p || typeof p !== 'object' || !(p.first || (p.e && typeof p.e === 'object' && Object.keys(p.e).length))) return;
    t = JSON.stringify(p);
    if (t !== keptText) { keptText = t; sput(LS, KEEP, { t: Date.now(), s: sraw(LS, 'aimarg.sync') || '', play: p }); }
  });
  (function () {
    var k = sget(LS, KEEP), cur = sraw(LS, 'aimarg.sync') || '', sig = /^(?:reset|replace):(\d+)$/.exec(cur), m;
    if (!k || !k.play || typeof k.play !== 'object') return;
    // a reset or a restore since the copy: the signal is not the one it was written with (a copy without s: by time)
    if (sig && (typeof k.s === 'string' ? cur !== k.s : Number(sig[1]) >= (Number(k.t) || 0))) { sput(LS, KEEP, null); return; }
    m = C.mergeState(S(), { play: k.play }).play; // the play part's own merge; nothing else is taken from the copy
    if (JSON.stringify(m) !== JSON.stringify(S().play)) { S().play = m; C.save(); }
  })();

  /* ---------- numbers and recording ---------- */
  function snap(force) {
    if (cache && !force && cache.day === env.today()) return cache;
    var s = R.summary(S(), env), b = (S().play && S().play.badges) || {};
    s.badges = {}; Object.keys(b).forEach(function (k) { s.badges[k] = b[k]; });
    return (cache = s);
  }
  function begin(mid) {
    if (keepQuiet()) C.save(); // what was earned before the round is kept now: its panel celebrates only the round's own
    var s = snap(), b = {}, m = mod(mid);
    Object.keys(s).forEach(function (k) { b[k] = s[k]; });
    b.badges = {}; Object.keys(s.badges).forEach(function (k) { b.badges[k] = s.badges[k]; });
    b.mid = m ? mid : ''; b.stampKeys = m ? R.stamps(m, env, S()).filter(function (p) { return p.done; }).map(function (p) { return p.key; }) : [];
    b.quests = R.quests(S(), s.f, env); // the result panel lists only the quests the round moved
    return b;
  }
  function next() { return R.nextRound(S(), env, sess(), snap().f); }
  function go(r) { var h = String(typeof r === 'string' ? r : (r && r.href) || '').replace(/^#/, '') || 'play'; if (h === hash()) A.route(); else location.hash = h; }
  function atStop(mid) { if (mod(mid) && S().last !== mid) { S().last = mid; C.save(); } }
  function observeNow(s) { var o = R.observe(S(), (s || snap()).f, env); if (o.n && R.applyObserved(S(), o, C.stamp())) C.save(); return o; }
  function recordFact(key) { if (!R.record(S(), key, env.today())) return false; C.save(); return true; }
  // Play keeps what it shows: the kept facts and badges earned by now are recorded and the rank floor is raised, with
  // no moment, so an undo in Learn or another tab never takes back a badge, XP or a rank Play has shown.
  // { badges: the ids it recorded, n: how many things changed }; the caller saves when n > 0
  function keep() {
    var s = snap(), p = P(), o = R.observe(S(), s.f, env), k = { badges: Object.keys(o.badges), n: R.applyObserved(S(), o, C.stamp()) };
    if (s.rank.i > (Number(p.rank) || 0)) { p.rank = s.rank.i; k.n++; }
    return k;
  }
  // keep() where nothing is celebrated: a Play page drawn, a round's start (progress from elsewhere: synced()). After
  // the first visit, the badges it recorded are noted (seen.nb) for the Road's banner. Returns how many things changed
  // (the caller saves)
  function keepQuiet() {
    var k = keep();
    noteNb(k.badges);
    return k.n;
  }
  // badges kept quietly after the first visit, noted once each (seen.nb) for the Road's banner
  function noteNb(ids) {
    var nb;
    if (!ids.length || !P().first) return;
    nb = seen().nb; nb = Array.isArray(nb) ? nb.filter(function (id) { return typeof id === 'string'; }) : [];
    ids.forEach(function (id) { if (nb.indexOf(id) < 0) nb.push(id); });
    seenSet({ nb: nb.slice(-26) });
  }

  /* ---------- live region, timers, XP pop ---------- */
  function liveEl() {
    var el = document.getElementById('pl-live');
    if (!el) { el = document.createElement('p'); el.id = 'pl-live'; el.className = 'visually-hidden'; el.setAttribute('role', 'status'); (document.querySelector('.site-foot') || document.body).appendChild(el); }
    return el;
  }
  // emptied first, so the same words are read out again
  function live(msg) { var el = liveEl(); clearTimeout(liveT); el.textContent = ''; liveT = setTimeout(function () { el.textContent = msg || ''; }, 60); }
  function later(fn, ms) { var id = setTimeout(function () { timers.splice(timers.indexOf(id), 1); fn(); }, ms || 0); timers.push(id); return id; }
  // the default host: the result panel's XP line while a round's result is up (the bar has often scrolled away by
  // then), else the bar
  function pop(text, host) {
    var el0 = root();
    host = host || (el0 && (el0.querySelector('#pl-result .pl-res-xp') || el0.querySelector('.pl-bar')));
    if (!host) return;
    var el = document.createElement('span');
    el.className = 'pl-pop tts-skip'; el.setAttribute('aria-hidden', 'true'); el.textContent = text;
    host.appendChild(el);
    later(function () { if (el.parentNode) el.parentNode.removeChild(el); }, still() ? 1500 : 800);
  }

  /* ---------- pictures: 24 px line icons in currentColor, the milestone stone, the barrier, stamps ---------- */
  var I = {
    footprints: '<ellipse cx="8" cy="13" rx="2.5" ry="4"/><ellipse cx="16" cy="6" rx="2.5" ry="4"/><path d="M7 20h2M15 13h2"/>',
    walker: '<circle cx="13" cy="4" r="2"/><path d="M12.5 8 11 14l3 3 1 5M11 14l-3 7M12 9l-3 3v3M13 9l3 3 3 .5"/>',
    bicycle: '<circle cx="5.5" cy="16.5" r="3.5"/><circle cx="18.5" cy="16.5" r="3.5"/><path d="M5.5 16.5 9 10h7l2.5 6.5M9 10l3.5 6.5L16 10l-1-3h2.5M7.5 8h3"/>',
    scooter: '<circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M9 18h6M18 15 15.5 5H13M15.5 5h3M15 11H8.5A3.5 3.5 0 0 0 5 14.5v.5"/>',
    auto: '<path d="M3 16v-6a5 5 0 0 1 5-5h7l5 5v6zM15 5v5h5M3 16h18"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    car: '<path d="M3 16v-3.5L5 7h14l2 5.5V16zM3 12.5h18"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
    bus: '<rect x="4" y="3" width="16" height="15" rx="2"/><path d="M4 11h16M4 7h16M7 15h1M16 15h1M7 18v3M17 18v3"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    roller: '<rect x="1.5" y="13" width="11" height="8" rx="4"/><circle cx="18.5" cy="18" r="3"/><path d="M7 13V9.5h7M14 15V5h5.5v10M12.5 5h8.5M12.5 17h3"/>', // a wide drum in front
    signpost: '<path d="M11 22V2M11 4h7l2.5 2.5L18 9h-7M11 12H5l-2.5 2.5L5 17h6"/>',
    read: '<path d="M2 5h6a4 4 0 0 1 4 4v11a3 3 0 0 0-3-3H2zM22 5h-6a4 4 0 0 0-4 4v11a3 3 0 0 1 3-3h7z"/>',
    watch: '<rect x="2" y="4" width="20" height="14" rx="2"/><path d="M10 8.5v5l4.5-2.5zM8 21h8"/>',
    lab: '<path d="M9 3h6M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21.5h11.6a2 2 0 0 0 1.7-3L14 9V3M7 15h10"/>',
    code: '<path d="m8 6-6 6 6 6M16 6l6 6-6 6M14 3l-4 18"/>',
    quiz: '<circle cx="12" cy="12" r="9.5"/><path d="M9.2 9.3a2.9 2.9 0 1 1 4 2.7c-.8.3-1.2 1-1.2 1.8v.7M12 17.3v.2"/>',
    tick: '<path d="m4.5 12.5 5 5L19.5 7"/>',
    cross: '<path d="m6 6 12 12M18 6 6 18"/>',
    warm: '<path d="M20 11a8 8 0 0 0-14.3-4.5M4 13a8 8 0 0 0 14.3 4.5M5.5 2.5v4h4M18.5 21.5v-4h-4"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9z"/>'
  };
  // the 4 road permits' badges: a small permit stamp (a double ring) with the level number
  [1, 2, 3, 4].forEach(function (n) { I['permit' + n] = '<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="6.6" stroke-width="1.25"/><text x="12" y="15.6" text-anchor="middle" font-size="10" font-weight="800" fill="currentColor" stroke="none">' + n + '</text>'; });
  var ICON_OF = { warmup: 'warm', check: 'tick', card: 'read', question: 'quiz', hands: 'lab', right: 'tick', cards: 'read', 'cards-all': 'read', terms: 'read', 'terms-all': 'read',
    gate: 'quiz', gates: 'quiz', stop: 'signpost', fix: 'warm', project: 'roller', week: 'footprints', month: 'footprints', days: 'footprints', review: 'warm', memory: 'star', road: 'signpost' };
  function icon(k) {
    return '<svg class="pl-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (I[k] || I[ICON_OF[k]] || I.star) + '</svg>';
  }
  var STONE = '<path class="pl-sb" d="M5 46V19a15 15 0 0 1 30 0v27z"/><path class="pl-cap" d="M5 23v-4a15 15 0 0 1 30 0v4z"/>';
  function stoneHTML(n, lv, on, fill) {
    return '<span class="pl-stone pl-lv' + lv + (on ? ' is-on' : '') + (fill ? ' is-fill' : '') + '"><svg viewBox="0 0 40 48" aria-hidden="true" focusable="false">' + STONE + '</svg><span class="pl-sno num" aria-hidden="true">' + esc(n) + '</span></span>';
  }
  function barrierHTML(up, lift) {
    return '<span class="pl-barrier tts-skip' + (up || lift ? ' is-up' : '') + (lift ? ' is-lift' : '') + '" aria-hidden="true"><svg viewBox="0 0 120 110" focusable="false"><path class="pl-booth" d="M3 108V66h20v42zM1 66l12-8 12 8z"/>' +
      '<rect class="pl-post" x="26" y="86" width="8" height="22" rx="2"/><g class="pl-arm"><rect x="27" y="84" width="84" height="8" rx="4"/><path d="M42 88h9M62 88h9M82 88h9"/></g><circle cx="30" cy="88" r="3.5"/></svg></span>';
  }
  function permitHTML(lv, land) { return '<span class="pl-permit' + (land ? ' is-land' : '') + '"><span>Road permit</span> <span aria-hidden="true">·</span> <b>Level ' + esc(lv) + '</b></span>'; }
  function stampOn(el, text) {
    if (!el) return;
    each(el, '.pl-rstamp', function (x) { x.parentNode.removeChild(x); });
    el.classList.add('pl-rel');
    el.insertAdjacentHTML('beforeend', '<span class="pl-rstamp tts-skip" aria-hidden="true">' + esc(text || 'Checked') + '</span>');
  }
  // 16 pieces at most, in the brand colours, never in Calm mode
  function confetti() {
    var h = '', c = ['sindoor', 'indigo', 'haldi', 'ok'];
    for (var i = 0; i < 16 && !still(); i++) h += '<i style="--a:' + i * 22.5 + 'deg;--d:' + (44 + i * 37 % 48) + 'px;--c:var(--' + c[i % 4] + ')"></i>';
    return h && '<span class="pl-confetti tts-skip" aria-hidden="true">' + h + '</span>';
  }
  function dotsHTML(list, label) { return '<span class="pl-rdots" role="img" aria-label="' + esc(label) + '">' + list.map(function (s) { return '<i class="' + esc(s || '') + '"></i>'; }).join('') + '</span>'; }

  /* ---------- the Play bar ---------- */
  function rankLabel(s) { var r = s.rank; return 'Rank: ' + r.name + ', ' + n0(s.total) + ' XP' + (r.next ? ', ' + n0(r.toNext) + ' XP to the next rank' : ', the top rank') + '. Badges and stats'; }
  function rankInner(s) {
    return '<span class="pl-mk">' + icon(s.rank.icon) + '</span><span class="pl-rk"><b>' + esc(s.rank.name) + '</b><span class="num">' + n0(s.total) + ' XP</span></span>' +
      '<span class="pl-thin" aria-hidden="true"><i style="width:' + Math.round(s.rank.pct * 100) + '%"></i></span>';
  }
  // the name starts with the words the ring shows ("20/30 XP"), so a voice command naming them finds it
  function ringLabel(s) { return n0(s.today) + '/' + s.goal + ' XP today' + (s.met ? ', goal met' : '') + '. Today\'s XP and daily goal'; }
  function ringInner(s) {
    return '<span class="pl-dial' + (s.met ? ' is-met' : '') + '" style="--p:' + Math.min(100, Math.round(s.today / s.goal * 100)) + '" aria-hidden="true">' + (s.met ? icon('tick') : '') + '</span>' +
      '<span class="pl-gt num"><b>' + n0(s.today) + '</b>/' + s.goal + ' XP</span>';
  }
  function weekInner(w) {
    return '<span class="pl-dots" aria-hidden="true">' + w.days.map(function (d) { return '<i class="' + (d.on ? 'on' : '') + (d.today ? ' now' : '') + '"></i>'; }).join('') + '</span>' +
      '<span>' + (w.steady ? 'Steady week ✓ (' + w.n + ' learning days)' : w.n + ' of 3 learning days this week') + '</span>';
  }
  function srcHTML(s) {
    var rows = R.bySource(s.f, s.day);
    return '<p class="num"><b>' + n0(s.today) + ' of ' + s.goal + ' XP today</b>' + (s.met ? ' · goal met ✓' : '') + '</p>' + (rows.length
      ? '<ul class="pl-src">' + rows.map(function (r) { return '<li><span>' + esc(r.label) + ' (' + n0(r.n) + ')</span><b class="num">' + n0(r.xp) + ' XP</b></li>'; }).join('') + '</ul>'
      : '<p class="small muted">No XP yet today. A quick check on a lesson card earns 10 XP.</p>');
  }
  function goalPicker(name, cur, hint) {
    return '<fieldset class="pl-goals"><legend>Daily goal</legend>' + (hint || '') + R.GOALS.map(function (g) {
      return '<label class="pl-gopt"><input type="radio" id="' + name + '-' + g.xp + '" name="' + name + '" value="' + g.xp + '" data-pl="goal"' + (g.xp === cur ? ' checked' : '') + '><span><b>' + g.name + '</b>: ' + g.xp + ' XP, about ' + g.mins + ' minutes</span></label>';
    }).join('') + '</fieldset>';
  }
  function barHTML(o) {
    o = o || {};
    var s = snap(), b = o.back || ROAD;
    // tts-skip: Listen starts at the page's heading; the bar, the week line and the goal panel are not read
    return '<div class="pl-top tts-skip" id="pl-top"><div class="pl-bar">' + (o.road ? '<a class="pl-rank" id="pl-rank" href="#play-badges" aria-label="' + esc(rankLabel(s)) + '">' + rankInner(s) + '</a>'
      : '<a class="pl-back" href="' + esc(b.href) + '" aria-label="' + esc(b.name || 'Back to ' + b.text) + '"><span aria-hidden="true">‹</span> ' + esc(b.text) + '</a><span class="pl-btitle">' + esc(o.title || '') + '</span>') +
      '<button type="button" class="pl-ring" id="pl-ring" data-pl="ring" aria-controls="pl-goalp" aria-expanded="' + goalOpen + '" aria-label="' + esc(ringLabel(s)) + '">' + ringInner(s) + '</button></div>' +
      (o.road ? '<p class="pl-week" id="pl-week">' + weekInner(R.weekDots(S(), s.day)) + '</p>' : '') +
      // a titled region, not a heading: it comes before the page's h1
      '<div class="pl-goalp card" id="pl-goalp" role="region" aria-labelledby="pl-goalp-t"' + (goalOpen ? '' : ' hidden') + '><p class="h-sub3" id="pl-goalp-t"><b>Today\'s XP</b></p><div id="pl-src">' + srcHTML(s) + '</div>' +
      goalPicker('pl-goal-b', s.goal) + '</div></div>';
  }
  function refreshBar(s) {
    if (!root()) return;
    s = s || snap();
    var g = function (id) { return document.getElementById(id); }, rank = g('pl-rank'), ring = g('pl-ring'), wk = g('pl-week'), src = g('pl-src');
    if (rank) { rank.innerHTML = rankInner(s); rank.setAttribute('aria-label', rankLabel(s)); }
    if (ring) { ring.innerHTML = ringInner(s); ring.setAttribute('aria-label', ringLabel(s)); }
    if (wk) wk.innerHTML = weekInner(R.weekDots(S(), s.day));
    if (src) src.innerHTML = srcHTML(s);
  }
  function toggleGoal(open) {
    var p = document.getElementById('pl-goalp'), b = document.getElementById('pl-ring');
    if (!p || !b) return;
    goalOpen = open == null ? p.hidden : !!open;
    p.hidden = !goalOpen; b.setAttribute('aria-expanded', String(goalOpen));
  }
  function setGoal(g) {
    var x = R.GOALS.filter(function (y) { return y.xp === g; })[0], p = P();
    if (!x) return;
    p.goal = g; p.goalAt = C.stamp(); C.save();
    each(document, 'input[data-pl="goal"]', function (y) { if (y.name !== 'pl-goal-w') y.checked = Number(y.value) === g; });
    refreshBar();
    live('Daily goal: ' + x.name + ', ' + g + ' XP a day.');
  }

  /* ---------- drawing, the save hook, sync ---------- */
  function root() { var el = document.getElementById('pl-root'); return el && el.isConnected ? el : null; }
  // "Card 3 of 7" in full at any text size: game.css hides the card's own counter while the bar's title says it, so
  // while that title is cut short (larger text, a long XP number in the ring) the root has pl-tcut and the counter
  // shows again. Only barHTML() writes the title (draw(), redrawInPlace() call this); its box is watched (text size,
  // window, ring), and it is measured again once the fonts have loaded. The browser cuts it when its text is wider by
  // any fraction of a pixel, which the whole pixels of scrollWidth can miss, so the text's own width is compared too
  var titleRO = null;
  function titleCut(el) {
    var t = el && el.querySelector('.pl-btitle'), f = function () {
      if (!t.isConnected) return;
      var r = document.createRange(); r.selectNodeContents(t);
      el.classList.toggle('pl-tcut', t.scrollWidth > t.clientWidth || r.getBoundingClientRect().width > t.getBoundingClientRect().width + 0.01);
    };
    if (titleRO) titleRO.disconnect();
    titleRO = null;
    if (!t) return;
    f();
    if (typeof ResizeObserver === 'function') (titleRO = new ResizeObserver(f)).observe(t);
    var fr = document.fonts && document.fonts.ready; // a promise (in the first drafts of the API a method)
    if (fr && typeof fr.then === 'function') fr.then(f);
  }
  // o (shell screens): { screen, redraw: () -> html for a redraw in place, after: () after each draw, back }
  function draw(html, title, o) {
    o = o || {};
    A.setView('<div class="wrap pl' + (calm() ? ' pl-calm' : '') + '" id="pl-root">' + html + '</div>', title);
    drawnAt = msNow(); // a pointer click in the next 400 ms is the second tap of a double tap (see the click guard)
    titleCut(root());
    // silent: badges progress from elsewhere brought into a round (marked as it came in: arrived), which its result
    // panel leaves out; pend: those still to be named on the Road (synced); day: the day its numbers are for
    view = { on: true, screen: o.screen || 'round', round: !o.screen, redraw: o.redraw, after: o.after, back: o.back || title, quiet: false, silent: {}, pend: {} };
    var s = snap(); shown = s.total; seenSet({ xp: s.total }); view.day = s.day;
    A.onLeave(function () { view.on = false; clearTimeout(hookT); timers.forEach(clearTimeout); timers = []; if (titleRO) titleRO.disconnect(); });
    if (view.after) view.after();
    return root();
  }
  function inRound(on, quiet) { view.round = !!on; view.quiet = !!quiet; }
  // after any save while a Play screen is up (Learn's too): record what is new, pop the XP gained, update the bar
  C.onSave(function () { cache = null; if (view.on) { clearTimeout(hookT); hookT = setTimeout(afterSave, 250); } });
  function afterSave() {
    if (!view.on || !root()) return;
    if (tabWait) synced(); // another tab's progress still waiting (below) is kept quietly first, as it came first
    var s = snap(), grew = s.total - shown;
    if (keep().n) C.save(); // the rank floor too; a round's result panel still names the badges its own saves earned
    if (shown >= 0 && grew > 0) { pop('+' + n0(grew) + ' XP'); if (!view.quiet) live('Plus ' + n0(grew) + ' XP. Today ' + n0(s.today) + ' of ' + s.goal + '.'); }
    shown = s.total; seenSet({ xp: s.total });
    refreshBar(s);
  }
  // progress from another tab or device: overview screens redraw in place, a round only updates its bar.
  // Another tab's save comes as a storage event, and its reset or restore as two in a row: its copy (merged here), then
  // aimarg.sync (this tab then takes that copy as it is). A save here between the two would put the merged copy back,
  // and the restore would become a merge in every tab. So progress from a tab is kept, saved and drawn 250 ms later,
  // after both (each event starts the wait again). What it brings is marked at once (arrived), so that a step this
  // page takes during the wait stays its own
  var tabN = 0, tabWait = false;
  // progress that came in is no news here: its XP does not pop, and in a round the badges it can earn are left out of
  // the round's panel (silent) and wait to be named on the Road (pend). Taken at the event, after core's merge and
  // before this page's own next step
  function arrived() {
    if (!view.on || !root() || view.screen === 'welcome') return;
    var s = snap(); shown = s.total; seenSet({ xp: s.total });
    if (view.round) Object.keys(R.observe(S(), s.f, env).badges).forEach(function (id) { view.silent[id] = view.pend[id] = 1; });
  }
  function synced() {
    tabWait = false;
    if (!view.on || !root()) return;
    // Play started in another tab or on another device while the Welcome was up: the page asked for replaces it
    if (view.screen === 'welcome') { if (P().first) A.route(); return; }
    // what came in is kept, so an undo there cannot take back what this page shows. In a round only the badges marked
    // when it came (pend) are from elsewhere; any other is the round's own (a step since then), for its panel. Those
    // from elsewhere are named on the Road once kept (a restore's second event can take some away), also when the
    // round ended within the wait and recorded them itself
    var k = keep();
    if (k.n) C.save();
    noteNb(view.round ? Object.keys(view.pend || {}).filter(function (id) { return (P().badges || {})[id]; }) : k.badges); view.pend = {};
    if (!view.round && view.redraw) redrawInPlace(); else refreshBar();
  }
  window.addEventListener('aim:progress-replaced', function (ev) {
    var d = ev.detail || {}, n = ++tabN;
    cache = null; tabWait = false;
    if (d.cleared) return; // a cleared copy: app.js draws the page again
    arrived();
    if (!d.tab) return synced();
    tabWait = true; setTimeout(function () { if (n === tabN && tabWait) synced(); }, 250); // (afterSave may have run it)
  });
  window.addEventListener('aim:progress-reset', function () {
    cache = banner = null; flash = {}; tmrw = {}; mem = {}; keptText = '';
    sput(LS, KEEP, null);
    if (R.ROUTE_RE.test(hash())) go('#play');
  });
  // a Play page left open past midnight: when the learner comes back to it, today's numbers are worked out again
  // (no timers): an overview screen redraws in place, a round updates its bar
  function newDay() {
    if (!view.on || !root() || view.day === env.today()) return;
    cache = null; view.day = env.today();
    if (!view.round && view.redraw) redrawInPlace(); else refreshBar();
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') newDay(); });
  window.addEventListener('focus', newDay);
  function redrawInPlace() {
    var el = root(); if (!el || !view.redraw) return;
    // a candidate must be shown: a radio in the closed goal panel cannot take focus
    var y = window.scrollY, ae = document.activeElement, k = ae && ae !== el && el.contains(ae) ? ae : null, keep = {}, vis = function (x) { return x && x.offsetParent !== null ? x : null; },
      all = function (sel, fn) { return Array.prototype.filter.call(el.querySelectorAll(sel), function (x) { return vis(x) && fn(x); })[0]; };
    k = k && { id: k.id, sum: k.tagName === 'SUMMARY' && k.parentNode.id, pl: k.getAttribute('data-pl'), lv: k.getAttribute('data-lv'), href: k.getAttribute('href') };
    each(el, 'textarea[id], details[id]', function (x) { keep[x.id] = x.tagName === 'DETAILS' ? x.open : x.value; });
    el.innerHTML = view.redraw();
    titleCut(el); // the bar is drawn again too: its new title is the one to watch
    Object.keys(keep).forEach(function (id) { var x = document.getElementById(id); if (x && x.tagName === 'DETAILS') x.open = keep[id]; else if (x) x.value = keep[id]; });
    // focus goes back to the same control: by id, by its fold, by data-pl, by href; else the heading
    if (k) focusEl((k.id && vis(document.getElementById(k.id))) || (k.sum && all('summary', function (x) { return x.parentNode.id === k.sum; })) ||
      (k.pl && all('[data-pl]', function (x) { return x.getAttribute('data-pl') === k.pl && x.getAttribute('data-lv') === k.lv; })) ||
      (k.href && all('a[href]', function (x) { return x.getAttribute('href') === k.href; })) || el.querySelector('h1'));
    // focus that would fall to the page's body (the control could not take it) goes to the heading
    if (k && (!document.activeElement || document.activeElement === document.body)) focusEl(el.querySelector('h1'));
    try { window.scrollTo({ top: y, left: 0, behavior: 'instant' }); } catch (e) { window.scrollTo(0, y); } // the site scrolls smoothly; a redraw must not
    if (view.after) view.after();
  }

  /* ---------- result panel and moments ---------- */
  // what a round brought, biggest first: road permit, stop cleared, rank up, badges, goal met, all quests done
  function moments(before, after, g) {
    var out = [], ri = R.rankOf(after.total), silent = view.silent || {}, nb;
    g.list.forEach(function (x) { var m = /^qp:test-l(\d+)$/.exec(x.k); if (m) out.push({ kind: 'permit', lv: Number(m[1]) }); });
    g.list.forEach(function (x) { var m = x.kind === 'st' && mod(x.k.slice(3)); if (m) out.push({ kind: 'stop', m: m }); });
    if (ri > before.rank.i) out.push({ kind: 'rank', i: ri });
    // the round's own new badges: not those that came in quietly meanwhile, nor ids only a newer version knows
    nb = Object.keys(after.badges).filter(function (k) {
      return !before.badges[k] && !silent[k] && R.BADGES.some(function (b) { return b.id === k; }) && !out.some(function (x) { return 'permit-' + x.lv === k; });
    });
    if (nb.length) out.push({ kind: 'badges', ids: nb });
    // goalDay only moves forward: a device whose local day is behind another's does not show the goal again. Only the
    // round that met the goal shows it: a goal met before the round (in Learn, say) is not this round's news
    if (after.met && !(before.met && before.day === after.day) && String(P().goalDay || '') < after.day) out.push({ kind: 'goal' });
    if (seen().questsDay !== after.day && R.quests(S(), after.f, env).every(function (x) { return x.done; })) out.push({ kind: 'quests' });
    return out;
  }
  var badgesOf = function (ids) { return R.BADGES.filter(function (b) { return ids.indexOf(b.id) >= 0; }); };
  // a moment as [the big version, its one line]
  function moment(x) {
    var b = x.ids && badgesOf(x.ids), r = R.RANKS[x.i] || {}, k = x.kind, t = k === 'permit' ? 'Road permit: Level ' + x.lv : k === 'stop' ? stopLb(no(x.m)) + ' cleared' : k === 'rank' ? 'New rank: ' + r.name
      : k === 'goal' ? 'Goal met for today' : k === 'quests' ? 'All of today\'s quests are done' : b ? 'Badge' + (b.length > 1 ? 's' : '') + ' earned: ' + b.map(function (y) { return y.name; }).join(', ') : x.line || '';
    return ['<div class="pl-moment pl-m-' + k + '">' + (k === 'own' ? x.html
      : k === 'permit' ? confetti() + barrierHTML(true, true) + permitHTML(x.lv, true) + '<p><strong>Checkpoint cleared!</strong> Your road permit for Level ' + x.lv + ' is stamped.</p>'
      : k === 'stop' ? confetti() + stoneHTML(no(x.m), x.m.level, true, true) + '<p><strong>' + t + '!</strong> +50 XP. Every stamp of ' + esc(x.m.title) + ' is done.</p>'
      : k === 'rank' ? '<span class="pl-mk pl-drive">' + icon(r.icon) + '</span><p><strong>' + t + '.</strong> Your marker on the road changes too.</p>'
      : b ? '<p><strong>' + (b.length === 1 ? 'Badge earned' : b.length + ' badges earned') + '</strong></p><ul class="pl-badges">' + b.slice(0, 3).map(function (y) { return badgeTile(y, true); }).join('') + '</ul>' + (b.length > 3 ? '<p class="small">and ' + (b.length - 3) + ' more</p>' : '')
      : '<span class="' + (k === 'goal' ? 'pl-dial is-met pl-close' : 'pl-mk') + '">' + icon('tick') + '</span><p><strong>' + t + '</strong></p>') + '</div>', esc(t)];
  }
  function resultHTML(o) {
    o = o || {};
    var before = o.before || snap(), after = o.after || (observeNow(), snap()), g = R.gained(before.f, after.f), ms = moments(before, after, g), p = P(), m = mod(before.mid), st = [], ch;
    // the quests this round moved (count or done), against begin()'s; all of them when the start is not known
    var qs = R.quests(S(), after.f, env), bq = before.quests, moved = !bq ? qs : qs.filter(function (x) {
      return !bq.some(function (y) { return y.id === x.id && y.text === x.text && y.n === x.n && y.done === x.done; });
    });
    // each moment shows once: the rank celebrated and the day the goal was met are kept with the progress
    ms.forEach(function (x) {
      if (x.kind === 'rank' && x.i > (Number(p.rank) || 0)) ch = p.rank = x.i;
      if (x.kind === 'goal') ch = p.goalDay = after.day;
      if (x.kind === 'quests') seenSet({ questsDay: after.day });
    });
    if (ch) C.save();
    // the round's own moment (a barrier lift) comes after a road permit or a cleared stop
    if (o.moment) ms.splice(count(ms, function (x) { return x.kind === 'permit' || x.kind === 'stop'; }), 0, { kind: 'own', html: o.moment, line: o.momentLine });
    if (m && before.stampKeys) st = R.stamps(m, env, S()).filter(function (q) { return q.done && before.stampKeys.indexOf(q.key) < 0; }).map(function (q) { return q.label; });
    return '<section class="card pl-result" id="pl-result" aria-labelledby="pl-res-h"><h2 class="h-sub" id="pl-res-h" tabindex="-1">' + esc(o.title || 'Round done') + '</h2>' + (o.lead || '') +
      '<p class="pl-res-xp pl-rel"><span class="pl-xp num">' + (g.xp ? '+' + n0(g.xp) + ' XP' : 'No new XP this time') + '</span> <span class="muted num">Today ' + n0(after.today) + ' of ' + after.goal + ' XP' + (after.met ? ' · goal met ✓' : '') + '</span></p>' +
      (st.length ? '<p class="pl-res-st">' + icon('tick') + ' Stamp' + (st.length > 1 ? 's' : '') + ' earned: ' + st.join(', ') + '</p>' : '') +
      (ms.length ? moment(ms[0])[0] : '') + (ms.length > 1 ? '<p class="pl-also small">Also: ' + ms.slice(1).map(function (x) { return moment(x)[1]; }).join(' · ') + '</p>' : '') +
      (moved.length ? questsHTML(moved, 'pl-res-q', { tag: 'h3', sum: '<p class="small">' + count(qs, function (x) { return x.done; }) + ' of ' + pl(qs.length, 'quest') + ' done today.</p>' }) : '') +
      (o.extra || '') + (o.next === false ? '' : nextBlock()) + '</section>';
  }
  function showResult(el, o) {
    o = o || {};
    // the panel's top at the top of the window (html's scroll padding keeps it clear of the header): its heading, the
    // XP and the moment are then in view together
    var old = document.getElementById('pl-result'), panel, h, f = function () { if (h.isConnected) { focusEl(h); h.scrollIntoView({ block: 'start', behavior: still() ? 'instant' : 'smooth' }); } };
    if (old) old.parentNode.removeChild(old);
    el.insertAdjacentHTML(o.at || 'beforeend', resultHTML(o));
    panel = document.getElementById('pl-result'); h = document.getElementById('pl-res-h');
    // the panel and its scroll move the page under the finger: as after a draw, the second tap of a double tap on the
    // round's last control (a grade, Finish) is dropped, so it never lands on Next round or Done for today
    drawnAt = msNow();
    if (o.focus === 'later') later(f); else if (o.focus !== false) f();
    later(function () { each(panel, '.pl-confetti', function (c) { c.parentNode.removeChild(c); }); }, 1300);
    return panel;
  }
  // the next round is worked out again when pressed; at the road's end: the warm-up and quick questions. When the next
  // round is this same one (a toll gate or checkpoint not passed), a way back takes its place: Next round would start
  // it again and wipe the explanations below. The round's own Try again stays the way to retry
  function nextBlock() {
    var r = next(), here = R.parseRoute(hash(), env) || {}, same = !!r.href && r.href.slice(1) === hash();
    return '<div class="pl-go">' + (r.kind === 'done' ? doneOffer(r) : !same ? btn(r.href, 'Next round', 'btn-primary pl-wide', ' data-pl="next"')
      : here.m ? btn('#play-' + here.mid, 'Back to ' + stopLb(no(here.m)), 'pl-wide') : btn('#play', 'Back to the road', 'pl-wide')) + btn('#play-done', 'Done for today', 'pl-wide') + '</div>';
  }
  // every round is done; a stop is cleared only with its hands-on stamps too (Watch, Lab, Code, in Learn): the stops
  // still without them, and a way to the first
  function handsLeft() {
    var by = {}, left;
    snap().f.forEach(function (x) { if (x.kind === 'st') by[x.k.slice(3)] = 1; });
    left = (env.modules || []).filter(function (m) { return !by[m.id]; });
    return left.length ? '<p>' + pl(left.length, 'stop') + ' still ' + (left.length === 1 ? 'has' : 'have') + ' hands-on stamps to earn.</p><a class="pl-more" href="#play-' + esc(left[0].id) + '">Go to ' + stopLb(no(left[0])) + '</a>' : '';
  }
  function doneOffer(r) {
    return '<p><strong>You have travelled the whole road!</strong> Keep your memory fresh with the warm-up and quick questions.</p>' + handsLeft() +
      (r.warm ? btn('#play-warmup', 'Warm-up', 'btn-primary pl-wide') : '') + (r.quick ? btn('#play-quick', 'Quick questions', 'pl-wide') : '') +
      (r.warm || r.quick ? '' : '<p class="small muted">Nothing to review right now. Come back tomorrow.</p>');
  }

  /* ---------- parts the screens share ---------- */
  // o: { tag: the heading's tag (h3 inside a result panel), link: where the hands-on quest leads while it is not done
  // (the current stop, whose Hands-on list opens Learn), sum: HTML after the list }
  function questsHTML(q, id, o) {
    o = o || {};
    return sec(id, 'Today\'s quests', '<ul class="pl-qlist">' + q.map(function (x) {
      var t = esc(x.text);
      return '<li' + (x.done ? ' class="is-done"' : '') + '>' + icon(x.icon) + '<span>' + (x.id === 'hands' && o.link && !x.done ? '<a href="' + esc(o.link) + '">' + t + '</a>' : t) + '</span><span class="pl-qn num">' +
        (x.done ? icon('tick') + sr('Done') : '<span aria-hidden="true">' + x.n + ' / ' + x.of + '</span>' + sr(x.n + ' of ' + x.of)) + '</span></li>';
    }).join('') + '</ul>' + (o.sum || ''), 'pl-quests', 'h-sub3', o.tag);
  }

  function roundDesc(r, atStop) {
    var line = r.kind === 'card' ? 'Card ' + r.i + ' of ' + r.n + ': ' + r.title : r.kind === 'terms' ? 'Term match · ' + pl(r.n, 'term') : r.kind === 'quiz' ? 'Toll gate · ' + pl(r.n, 'question') + ' · 70% lifts the barrier' : '';
    return '<p class="pl-nd">' + (r.kind === 'checkpoint' ? '<b>Checkpoint ' + r.lv + ': ' + esc(lvTitle(r.lv)) + '</b><span>Level test · ' + pl(r.n, 'question') + ' · about ' + r.mins + ' min</span>'
      : !line ? '<b>' + esc(r.title || '') + '</b>' : (atStop ? '' : '<b>' + stopLb(esc(r.no)) + ' · ' + esc(r.stop) + '</b>') + '<span>' + esc(line) + ' · about ' + r.mins + ' min</span>') + '</p>';
  }
  // an earned badge says when (a moment: "Earned today"), as the Badges page does; its condition would read like a to-do
  function badgeTile(b, moment) {
    var won = moment || b.earned || b.on;
    return '<li class="pl-badge' + (won ? ' is-on' : '') + '"><span class="pl-bi">' + icon(b.icon) + '</span><span><b>' + esc(b.name) + '</b><span class="small">' +
      (won ? 'Earned ' + (fmtDay(b.earned) || 'today') : esc(b.cond) + '. ' + esc(b.progress.text)) + '</span></span></li>';
  }
  function ladderHTML(s) {
    return '<ol class="pl-ladder">' + R.RANKS.map(function (r) {
      var on = r.i === s.rank.i;
      return '<li class="' + (on ? 'is-on' : r.i < s.rank.i ? 'is-past' : '') + '"><span class="pl-mk">' + icon(r.icon) + '</span><b>' + r.name + '</b><span class="num">' + n0(r.xp) + ' XP</span>' + (on ? '<span class="pl-chip pl-chip-here">Your rank</span>' : '') + '</li>';
    }).join('') + '</ol>';
  }
  var foot = function (l) { return '<nav class="pl-foot" aria-label="More in Play mode">' + l.join('') + '</nav>'; };
  var LEARN = btn('#home', 'Switch to Learn', '', ' data-pl="learn"');
  var earnedN = function (bl) { return count(bl, function (b) { return b.earned || b.on; }); };

  /* ---------- S1 Welcome ---------- */
  var wGoal = 0; // the goal the Welcome's radios were drawn with
  // r: the Play page asked for (its route; h: its hash). A first visit to any of them starts here, so XP is explained
  // and a goal chosen before any XP shows (a stop opened from Learn's "Play this module", say). Start playing then
  // opens that page (noted in WANT; the Road's Welcome clears the note), and Not now goes back to its module in Learn
  function welcome(r, h) {
    r = r || { screen: 'road' };
    sput(SS, WANT, r.screen === 'road' ? null : { h: String(h || '') });
    var s = snap(), pic = '<svg class="pl-pic tts-skip" viewBox="0 0 320 96" aria-hidden="true" focusable="false"><rect class="pl-pic-road" y="70" width="320" height="20" rx="4"/><path class="pl-pic-line" d="M10 80h300"/>' +
      [34, 140, 246].map(function (x, i) { return '<g class="pl-lv' + (i + 1) + ' is-on" transform="translate(' + x + ' 14)">' + STONE + '</g>'; }).join('') + '</svg>';
    draw('<div class="pl-welcome stack">' + pic + '<h1 tabindex="-1">Welcome to Play mode</h1>' +
      '<ul class="pl-lines"><li>The same lessons, as short rounds.</li><li>Earn XP (experience points), stamps and badges as you learn.</li><li>Everything you do here also counts in Learn mode.</li></ul>' +
      (s.total > 0 ? '<p class="card pl-sum">Your learning so far already counts: <b class="num">' + n0(s.total) + ' XP</b> · Rank: <b>' + esc(s.rank.name) + '</b> · ' + pl(earnedN(R.badgeList(S(), s.f, env)), 'badge') + '</p>' : '') +
      goalPicker('pl-goal-w', (wGoal = R.goalOf(S())), '<p class="small muted">How much XP do you want to earn each day? You can change it at any time. Missing a day costs nothing.</p>') +
      '<div class="pl-go"><button type="button" class="btn btn-primary pl-wide" data-pl="start">Start playing</button>' + btn(r.mid ? '#m-' + r.mid : '#home', 'Not now, back to Learn', 'btn-ghost pl-wide') + '</div></div>', 'Play mode', { screen: 'welcome' });
  }
  function start() {
    var pick = root() && root().querySelector('input[name="pl-goal-w"]:checked'), p = P(), want = sget(SS, WANT), wr = want && typeof want.h === 'string' ? R.parseRoute(want.h, env) : null;
    sput(SS, WANT, null);
    if (!p.first) p.first = C.stamp();
    // only a goal the learner changed here is saved: the one drawn, left as it was, never wins over a goal chosen in
    // another tab or on another device
    if (pick && Number(pick.value) !== wGoal) { p.goal = Number(pick.value); p.goalAt = C.stamp(); }
    keep(); // earlier work counts, quietly: badges earned before the first visit are no news
    setPref('start', 'play');
    C.save();
    go(wr && wr.screen !== 'road' && wr.screen !== 'notfound' ? '#' + want.h : next()); // the page asked for, while it still is one
  }

  /* ---------- S2 Road ---------- */
  function nextCard(r) {
    // a warm-up or quick round carries the round after it in stop (a stop round's stop is its title)
    var d = r.stop && typeof r.stop === 'object' ? r.stop : r, label = r.kind === 'warmup' ? 'Continue · warm-up first (' + pl(r.cards, 'card') + ')' : r.kind === 'quick' ? 'Continue · quick questions first (' + pl(r.n, 'question') + ')' : 'Continue';
    // at the road's end with the warm-up or quick questions first: the stops still to clear, as after them
    return box('pl-next-h', 'Next round', r.kind === 'done' ? doneOffer(r) : roundDesc(d) + (d.kind === 'done' ? handsLeft() : '') + btn(r.href, esc(label), 'btn-primary pl-wide', ' data-pl="next"') +
      (d.mid ? '<a class="pl-more" href="#play-' + esc(d.mid) + '">Choose another round</a>' : ''), 'pl-next');
  }
  var CHIP = { here: ' You are here.', cleared: ' Cleared.', marked: ' Marked done in Learn.' };
  function roadList(L) {
    return '<ol class="pl-road" aria-label="Stops on Level ' + L.lv + '">' + L.stops.map(function (x) {
      var done = x.stamps.filter(function (p) { return p.done; }).map(function (p) { return p.label; }), due = pl(x.due, 'card') + ' ready to review';
      return '<li><a class="pl-stop' + (x.here ? ' is-here' : '') + '" href="#play-' + esc(x.id) + '" aria-label="' + esc(stopLb(x.no) + ', ' + x.title + '. ' + done.length + ' of ' + pl(x.stamps.length, 'stamp') +
        (done.length ? ': ' + done.join(', ') : '') + '.' + (x.chip === 'due' ? ' ' + due + '.' : CHIP[x.chip] || '')) + '">' + stoneHTML(x.no, x.level, x.cleared) +
        '<span class="pl-sbody"><span class="pl-stitle">' + esc(x.title) + '</span><span class="pl-stamps">' + x.stamps.map(function (p) { return '<span class="pl-st' + (p.done ? ' is-on' : '') + '">' + icon(p.icon) + '</span>'; }).join('') + '</span>' +
        (x.chip === 'here' ? '<span class="pl-chip pl-chip-here">' + icon(snap().rank.icon) + 'You are here</span>' : x.chip === 'cleared' ? '<span class="pl-chip pl-chip-ok">' + icon('tick') + 'Cleared</span>'
          : x.chip === 'marked' ? '<span class="pl-chip">Marked done in Learn</span>' : x.chip === 'due' ? '<span class="pl-chip">' + due + '</span>' : '') + '</span></a></li>';
    }).join('') + '</ol>';
  }
  function roadHTML() {
    var s = snap(), st = S(), cur = R.currentStop(st, env, s.f), nx = R.nextRound(st, env, sess(), s.f), d = nx.stop && typeof nx.stop === 'object' ? nx.stop : nx;
    // the level shown: the learner's pick while the current stop is on the level it was picked at; else the next
    // round's level when that round is a checkpoint (Continue leaves the level), else the current stop's
    var lv = prefLv() && Number(prefR().lvAt) === (cur ? cur.level : 0) ? prefLv() : d.kind === 'checkpoint' ? d.lv : cur ? cur.level : 1;
    var L = R.levelState(lv, st, env, s.f), bl = R.badgeList(st, s.f, env), t = L.test;
    return barHTML({ road: true }) + '<h1 tabindex="-1">The AI Road</h1>' +
      (banner ? '<div class="pl-banner callout" id="pl-banner"><p>' + (banner.kind === 'back' ? 'Welcome back! Everything you learned is still counted.' : banner.kind === 'xp' ? '<b class="num">+' + n0(banner.n) + ' XP</b> since your last visit (from Learn mode or another device).' : '') +
        (banner.nb.length ? (banner.kind === 'nb' ? '' : ' ') + 'New badge' + (banner.nb.length > 1 ? 's' : '') + ': ' + esc(banner.nb.join(', ')) + '.' : '') +
        '</p><button type="button" class="pl-x" data-pl="x" aria-label="Hide this message">' + icon('cross') + '</button></div>' : '') +
      nextCard(nx) + questsHTML(R.quests(st, s.f, env), 'pl-q-h', { link: cur ? '#play-' + cur.id : '' }) +
      sec('pl-lv-h', 'The road', '<div class="pl-lvbtns" role="group" aria-label="Choose a level">' + (env.levels || []).map(function (l) {
        return '<button type="button" class="btn pl-lvb" id="pl-lv-' + l.id + '" data-pl="lv" data-lv="' + l.id + '" aria-pressed="' + (l.id === lv) + '">Level ' + l.id + '</button>';
      }).join('') + '</div><p class="pl-lvsum">Level ' + lv + ' · ' + esc(L.title) + ' · ' + L.cleared + ' of ' + L.of + ' stops cleared</p>' + roadList(L) +
      (L.projects.length ? '<details class="pl-proj" id="pl-proj"><summary>Projects for this road: ' + pl(L.projects.length, 'project') + ' · ' + L.projectsDone + ' finished</summary><ul>' + L.projects.map(function (p) {
        return '<li><a href="#' + esc(p.id) + '" data-pl-out="The AI Road">' + esc(p.title) + '</a><span class="small muted">' + (p.done ? 'Finished ✓' : p.n + ' of ' + p.of + ' steps done') + '</span></li>';
      }).join('') + '</ul></details>' : '') +
      (t.has ? '<a class="pl-cp" href="#play-test-l' + lv + '">' + barrierHTML(t.passed) + '<span><b>Checkpoint ' + lv + ' · Level test · ' + pl(t.n, 'question') + '</b><span>' +
        (t.passed ? 'Road permit granted' : t.tries ? 'Best ' + t.best + '% · pass at 70%' : 'Ready when you are') + '</span></span></a>' : ''), 'pl-levels') +
      '<section class="card pl-tip" id="pl-tip" aria-labelledby="pl-tip-h"' + (tip ? '>' + tip : ' hidden>') + '</section>' +
      foot([btn('#play-badges', 'Badges and stats (' + earnedN(bl) + ' of ' + bl.length + ')'), btn('#play-help', 'How Play works'), LEARN]);
  }
  // one of the 15 learning-science methods, a new one each day; left out when the guide does not load
  function loadTip() {
    if (tip !== null) return;
    var day = env.today();
    ST.ensureGuide().then(function (g) {
      var l = g && Array.isArray(g.methods) ? g.methods.filter(function (x) { return x && x.group === 'science'; }) : [], x = l[Math.round(Date.parse(day + 'T12:00:00') / 864e5) % (l.length || 1)], el = document.getElementById('pl-tip');
      tip = x ? '<h2 class="h-sub3" id="pl-tip-h">Tip for the road</h2><p><b>' + esc(x.name) + '.</b> ' + inline(x.short || '') + '</p><a href="#methods~' + esc(x.id) + '" data-pl-out="The AI Road">Read about this method</a>' : '';
      if (el && tip) { el.innerHTML = tip; el.hidden = false; }
    }, function () { tip = ''; });
  }
  function road() {
    var s = snap(), sn = seen(), nb = badgesOf(Array.isArray(sn.nb) ? sn.nb : []).map(function (b) { return b.name; });
    // at most one banner, worked out before draw() notes the XP seen now. It also names, once, the badges Play kept
    // quietly since the last visit (seen.nb: earned in Learn or on another device)
    banner = R.lastLearned(S(), s.day).gap >= 3 && sn.backDay !== s.day ? { kind: 'back' } : typeof sn.xp === 'number' && s.total > sn.xp ? { kind: 'xp', n: s.total - sn.xp } : nb.length ? { kind: 'nb' } : null;
    if (banner) banner.nb = nb;
    if (Array.isArray(sn.nb) && sn.nb.length) seenSet({ nb: [] });
    draw(roadHTML(), 'Play mode', { screen: 'road', redraw: roadHTML, after: loadTip, back: 'The AI Road' });
  }

  /* ---------- S3 Stop ---------- */
  function stopHTML(m) {
    var s = snap(), x = R.stopState(m, env, S(), s.f), nx = R.nextStop(m, env), nm = nx && mod(nx.mid), r = x.next, lb = stopLb(x.no), ps = {}, q = x.quiz, ret = ST.retention(m.id), best = (A.mainPicks(m) || {}).main;
    var row = function (key, title, state, done, extra) {
      return '<li><a class="pl-row' + (done ? ' is-done' : '') + '" href="#play-' + esc(m.id) + '~' + key + '"><span class="pl-rmark">' + (done ? icon('tick') : '') + '</span><span><b>' + esc(title) + '</b><span class="small">' + esc(state) + (extra || '') + '</span></span><span aria-hidden="true">›</span></a></li>';
    };
    var hand = function (ic, title, body, status, tab, label) {
      return '<li>' + icon(ic) + '<div class="stack-sm"><p><b>' + title + '</b>' + (status ? ' <span class="small muted">· ' + status + '</span>' : '') + '</p>' + body + btn('#m-' + m.id + '~' + tab, label, '', ' data-pl-out="' + lb + '"') + '</div></li>';
    };
    x.stamps.forEach(function (p) { ps[p.key] = p; });
    return barHTML({ back: ROAD, title: lb }) + '<header class="stack-sm"><p class="eyebrow">Level ' + m.level + ' · ' + lb + (m.hours ? ' · about ' + m.hours + ' hours' : '') + '</p><h1 tabindex="-1">' + esc(m.title) + '</h1></header>' +
      '<ul class="pl-stampbar" aria-label="Stamps at this stop">' + x.stamps.map(function (p) {
        return '<li class="pl-stp' + (p.done ? ' is-on' : '') + '"><span class="pl-sti">' + icon(p.icon) + '</span><span><b>' + p.label + '</b>' + (p.text ? ' <span class="num">' + p.text + '</span>' : '') + sr(p.done ? ', done' : ', not done yet') + '</span></li>';
      }).join('') + '</ul>' +
      box('pl-next-h', r ? 'Next round here' : 'Every round here is done', r ? roundDesc(r, true) + btn(r.href, 'Continue', 'btn-primary pl-wide')
        : '<p>' + (x.cleared ? 'You cleared this stop. Well done!' : 'The hands-on stamps below are still open.') + '</p>' + (nx ? btn(nx.href, nm ? 'Go to the next stop' : 'Go to ' + nx.label, 'btn-primary pl-wide') : ''), 'pl-next') +
      sec('pl-rounds-h', 'Rounds', '<ol class="pl-rounds">' + x.cards.map(function (c) { return row(c.key, c.title, c.label, c.state === 'done'); }).join('') +
        (x.terms.has ? row('terms', 'Term match', x.terms.done ? 'Done' : 'Not done yet', x.terms.done) : '') +
        (q.has ? row('quiz', 'Toll gate', (q.tries ? 'Best ' + q.best + '%' : 'Not tried yet') + ' · pass at 70%', q.passed, q.stars ? ' · <span aria-hidden="true">' + '★★★☆☆☆'.substr(3 - q.stars, 3) + '</span>' + sr(q.stars + ' of 3 stars') : '') : '') + '</ol>') +
      sec('pl-hands-h', 'Hands-on', '<p class="small muted">These open in Learn mode. A bar at the top brings you back here.</p><ul class="pl-hands">' +
        (ps.watch ? hand('watch', 'Watch', (best ? '<p>' + esc(best.title) + '</p>' : '') + '<div id="pl-cues" class="pl-lesson">' + (cues[m.id] || '') + '</div>', ps.watch.done ? 'done' : '', 'watch', 'Open the video') : '') +
        (ps.lab ? hand('lab', 'Lab', '', ps.lab.n + ' of ' + pl(ps.lab.of, 'task'), 'lab', 'Open the lab') : '') +
        (ps.code ? hand('code', 'Code', '', ps.code.n + ' of ' + pl(ps.code.of, 'exercise') + ' solved', 'practice', 'Open the exercises') : '') +
        hand('read', 'Reflect (optional)', '<p>Explain it in your own words.</p>', '', 'reflect', 'Open Reflect') + '</ul>') +
      (ret && ret.n >= 5 && ret.avg != null ? '<p class="pl-mem">' + icon('warm') + '<span>Memory: about ' + Math.round(ret.avg * 100) + '% of this stop\'s review cards are still remembered.</span></p>' : '') +
      foot([btn('#m-' + m.id, 'Open this module in Learn', '', ' data-pl-out="' + lb + '"')].concat(nx ? [btn(nx.href, (nm ? 'Next stop: ' + no(nm) : esc(nx.label)) + ' <span aria-hidden="true">›</span>', '', nm ? ' aria-label="Next stop: ' + no(nm) + ', ' + esc(nm.title) + '"' : '')] : []));
  }
  function stop(m) {
    var h = function () { return stopHTML(m); };
    atStop(m.id);
    draw(h(), stopLb(no(m)) + ' · ' + m.title, { screen: 'stop', redraw: h, back: stopLb(no(m)), after: function () {
      // "While you watch:" the module's own listening cues, when its study content has them (each says what to listen for)
      if (!(m.id in cues) && document.getElementById('pl-cues')) ST.ensureModule(m.id).then(function (md) {
        var c = md && Array.isArray(md.sravana) ? md.sravana.slice(0, 3) : [], el = document.getElementById('pl-cues');
        cues[m.id] = c.length ? '<p class="small"><b>While you watch:</b></p><ul class="small">' + c.map(function (t) { return '<li>' + inline(t) + '</li>'; }).join('') + '</ul>' : '';
        if (el && view.screen === 'stop' && hash() === 'play-' + m.id) el.innerHTML = cues[m.id];
      }, function () { cues[m.id] = ''; });
    } });
  }

  /* ---------- S10 Postcard ---------- */
  function doneHTML() {
    var s = snap(), c = R.dayCounts(S(), s.f, env, s.day), due = ST.dueIds(env.addDays(s.day, 1)).length;
    // the day's counts, leaving out those that are 0; with none and no XP yet, one line says so
    var li = function (n, one, many) { return n ? '<li><b class="num">' + n0(n) + '</b> ' + (n === 1 ? one : many) + '</li>' : ''; };
    var rows = li(c.cards, 'card checked', 'cards checked') + li(c.reviews, 'review', 'reviews') + li(c.answered, 'question answered', 'questions answered') + li(c.fixed, 'mistake fixed', 'mistakes fixed') +
      li(c.hands, 'hands-on task done', 'hands-on tasks done');
    return barHTML({ back: ROAD, title: 'Today' }) + '<h1 tabindex="-1">' + (s.met ? 'Done for today' : 'Your day so far') + '</h1>' +
      box('pl-today-h', 'Today', '<p class="pl-big num">' + n0(s.today) + ' of ' + s.goal + ' XP' + (s.met ? ' · Goal met ✓' : '') + '</p>' +
        (rows ? '<ul class="pl-counts">' + rows + '</ul>' : s.today ? '' : '<p>Nothing done yet today.</p>')) +
      box('pl-tm-h', 'Next', '<p id="pl-tmrw">' + (tmrw[s.day] || (due ? 'Coming up tomorrow: ' + about(due, 'review card') : 'No review cards are due tomorrow yet.')) + '</p><p class="pl-week">' + weekInner(R.weekDots(S(), s.day)) + '</p>') +
      '<div id="pl-flash">' + (s.met && flash[s.day] || '') + '</div>' +
      box('pl-jr-h', 'Your journal', '<label for="pl-jr-t">One thing I learned today <span class="muted">(optional)</span></label><textarea id="pl-jr-t" maxlength="300" rows="3"></textarea>' +
        '<div class="row"><button type="button" class="btn" data-pl="jsave">Save to my journal</button><span class="small" id="pl-jr-msg"></span></div>') +
      '<div class="pl-go">' + btn('#play', 'Back to the road', 'btn-primary pl-wide') + btn('#home', 'Switch to Learn', 'pl-wide', ' data-pl="learn"') + '</div>';
  }
  // tomorrow from Daily review's own plan; the flashback: an example from a card read 3 or more days ago
  function doneAfter() {
    var s = snap(), day = s.day, fb = s.met && !(day in flash) && R.flashback(S(), env, day);
    if (!tmrw[day]) ST.need(['review']).then(function () { return ST.reviewPlan(); }).then(function (p) {
      var x = p && p.next, n = x ? (x.reviews || 0) + (x.fresh || 0) : 0, el = document.getElementById('pl-tmrw');
      tmrw[day] = x && x.day === env.addDays(day, 1) ? 'Coming up tomorrow: ' + about(n, 'review card') : x && x.day ? 'Your next review: ' + fmtDay(x.day) + ', ' + about(n, 'card') : 'No review cards are due tomorrow yet.';
      if (el) el.textContent = tmrw[day];
    }, function () {});
    if (fb) A.ensureExamples(fb.m).then(function (all) {
      var l = all && all[fb.key], x = Array.isArray(l) && l.length ? l[Math.round(Date.parse(day + 'T12:00:00') / 864e5) % l.length] : null, t = typeof x === 'string' ? { text: x } : x || {}, el = document.getElementById('pl-flash');
      if (!t.text) return;
      flash[day] = box('pl-fl-h', 'From your road', '<p class="small muted">An example from “' + esc(fb.title) + '” of ' + stopLb(esc(fb.no)) + ', which you read on ' + fmtDay(fb.day) + '</p><p class="pl-lesson">' + (t.title ? '<b>' + inline(t.title) + '</b> ' : '') + inline(t.text) + '</p>', 'pl-flash');
      if (el) el.innerHTML = flash[day];
    }, function () {});
  }
  function saveJournal() {
    var ta = document.getElementById('pl-jr-t'), msg = document.getElementById('pl-jr-msg'), text = ta ? ta.value.replace(/\r/g, '').trim().slice(0, 300) : '', st = S(), cur, say = text ? 'Saved to your journal' : 'Write one line first.';
    if (!ta) return;
    // the second tap of a double tap finds the box the first one emptied: the line was saved, and that stays said
    // (data-saved goes when the learner types again)
    if (!text && ta.hasAttribute('data-saved')) { if (msg) msg.textContent = 'Saved to your journal'; return; }
    if (text) {
      cur = R.currentStop(st, env, snap().f);
      if (!st.jr || typeof st.jr !== 'object') st.jr = {};
      // the same shape and id as a journal entry in the Study room (study-focus.js)
      st.jr['j' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)] = { at: new Date().toISOString(), learnt: text, confused: '', next: '', meth: '', conf: 0, mod: cur ? cur.id : '', mins: 0, del: false };
      C.logActivity(); C.save();
      ta.value = ''; ta.setAttribute('data-saved', '');
    } else focusEl(ta);
    if (msg) msg.textContent = say;
    live(say);
  }

  /* ---------- S11 Badges and stats ---------- */
  function badgesHTML() {
    var s = snap(), st = S(), bl = R.badgeList(st, s.f, env), x = R.badgeContext(st, s.f, env), groups = [], by = {};
    var stat = function (k, v) { return '<div><dt>' + k + '</dt><dd class="num">' + v + '</dd></div>'; };
    bl.forEach(function (b) { if (!by[b.group]) groups.push(b.group); (by[b.group] = by[b.group] || []).push(b); });
    return barHTML({ back: ROAD, title: 'Badges' }) + '<h1 tabindex="-1">Badges and stats</h1><dl class="pl-stats">' + stat('XP and rank', n0(s.total) + ' XP · ' + esc(s.rank.name)) +
      stat('Today', n0(s.today) + ' / ' + s.goal + ' XP') + stat('This week', R.weekDots(st, s.day).n + ' of 3 learning days') + stat('Days learned (all time)', n0(x.days.days)) +
      stat('Cards checked', n0(x.cards) + ' / ' + n0(x.cardsOf)) + stat('Questions right', n0(x.n.q || 0) + ' / ' + n0(x.rightOf)) + stat('Stops cleared', x.stops + ' / ' + x.stopsOf) + '</dl>' +
      '<p class="small muted">Day streak (the same as in the header): <span class="num">' + pl(C.streak(), 'day') + '</span></p>' +
      sec('pl-rk-h', 'Ranks', ladderHTML(s) + '<p>' + (s.rank.next ? '<b class="num">' + n0(s.rank.toNext) + ' XP</b> to the next rank (' + esc(s.rank.next.name) + ')' : 'You have the top rank.') + '</p>') +
      sec('pl-bg-h', 'Badges', '<p>' + earnedN(bl) + ' of ' + bl.length + ' earned. A badge stays once you earn it.</p>' + groups.map(function (g, i) {
        return '<h3 class="h-sub3" id="pl-bg' + i + '">' + esc(g) + '</h3><ul class="pl-badges" aria-labelledby="pl-bg' + i + '">' + by[g].map(function (b) { return badgeTile(b); }).join('') + '</ul>';
      }).join('')) +
      '<details class="pl-fold" id="pl-xps"><summary>Your XP by source</summary><table class="simple"><thead><tr><th scope="col">Source</th><th scope="col">How many</th><th scope="col">XP</th></tr></thead><tbody>' +
      R.bySource(s.f).map(function (r) { return '<tr><td>' + esc(r.label) + '</td><td class="num">' + n0(r.n) + '</td><td class="num">' + n0(r.xp) + '</td></tr>'; }).join('') +
      '<tr><th scope="row">Total</th><td></td><td class="num"><b>' + n0(s.total) + '</b></td></tr></tbody></table></details>' + foot([btn('#play', 'Back to the road'), btn('#play-help', 'How Play works')]);
  }

  /* ---------- S12 How Play works ---------- */
  function helpHTML() {
    var s = snap(), c = calm(), h = function (id, t, b) { return sec('pl-hp-' + id, t, b); };
    var row = function (what, xp) { return '<tr><td>' + esc(what) + '</td><td class="num">' + xp + '</td></tr>'; };
    return barHTML({ back: ROAD, title: 'Help' }) + '<h1 tabindex="-1">How Play works</h1><div class="pl-help stack-lg">' +
      h('same', 'Same course, two ways', '<p>Play mode shows the same lessons and questions as Learn mode, as short rounds. It is the same saved progress: a card you check here is ticked in Learn too.</p>' +
        '<p>The whole course is <b>the AI Road</b>: each level is a road, and each module is a <b>stop</b> on it. A <b>card round</b> is one lesson card and its <b>quick check</b>, a question you answer from memory.</p>') +
      h('xp', 'XP (experience points)', '<p>XP (experience points) are points you earn by learning. Each thing earns XP once. Your rank and your badges never go down. Pressing Got it earns no XP. The quick check after it earns ' + R.XP.qc + ' XP, whatever you answer.</p>' +
        // a checkpoint's XP gets its own row, after the toll gate's
        '<div class="table-wrap"><table class="simple"><thead><tr><th scope="col">You earn XP for</th><th scope="col">XP</th></tr></thead><tbody>' + R.XP_TABLE.map(function (r) { return row(r.what, r.xp) + (r.xpTest ? row(r.whatTest, r.xpTest) : ''); }).join('') + '</tbody></table></div>') +
      h('rank', 'Ranks', '<p>Your rank is a title that grows with your XP, shown as a vehicle on the road. Ranks never go down.</p>' + ladderHTML(s)) +
      h('stamps', 'Stops and stamps', '<p>A stop has up to 5 stamps: <b>Read</b> (all its lesson cards), <b>Watch</b> (the main video), <b>Lab</b> (all lab tasks), <b>Code</b> (all exercises) and <b>Quiz</b> (70% or more). When a stop has every stamp, it is cleared. Watch, Lab and Code open in Learn mode, with a bar that brings you back.</p>' +
        '<p>A <b>term match</b> shows the meaning of a key term, and you pick the term. It is practice: it does not change your review.</p>') +
      h('gates', 'Toll gates and checkpoints', '<p>A <b>toll gate</b> is a stop\'s quiz: 70% lifts the barrier. A <b>checkpoint</b> is a level\'s test: 70% gets you a <b>road permit</b> for that level. Your best score is kept, and you can try again at any time.</p>') +
      h('warm', 'Warm-up and quick questions', '<p>The <b>warm-up</b> is the same spaced review as Daily review: cards come back just before you would forget them. Each card you grade earns 2 XP, whatever the grade. <b>Quick questions</b> bring back a past mistake (Fix-it) and questions from earlier stops.</p>') +
      h('quests', 'Quests and badges', '<p>Each day has 3 small quests that suggest what to try. They earn no XP of their own. Badges mark bigger steps, and a badge stays once you earn it.</p>') +
      h('goal', 'Daily goal', '<p>Choose how much XP to earn each day. Missing a day costs nothing.</p>' + goalPicker('pl-goal-h', s.goal)) +
      h('week', 'Learning days and the week', '<p>A learning day is any day you learn something here. Three in one week (Monday to Sunday) make a steady week. A day off is fine: nothing is lost.</p>') +
      h('calm', 'Calm mode', '<p>Calm mode turns off moving effects, such as confetti. It starts on when your device asks for less motion.</p>' +
        '<button type="button" class="pl-switch" id="pl-calm" role="switch" data-pl="calm" aria-checked="' + c + '"><span class="pl-knob" aria-hidden="true"></span>Calm mode<span class="pl-sws" aria-hidden="true">' + (c ? 'On' : 'Off') + '</span></button>') +
      h('data', 'Your data', '<p>Play saves into the same progress as Learn. Nothing is shared with anyone. If you sign in, it syncs like the rest.</p>') + '</div>' + foot([btn('#play', 'Back to the road'), LEARN]);
  }
  function setCalm(on) {
    var el = root(), b = document.getElementById('pl-calm');
    setPref('calm', on); C.save();
    if (el) el.classList.toggle('pl-calm', on);
    if (b) { b.setAttribute('aria-checked', String(on)); b.lastChild.textContent = on ? 'On' : 'Off'; }
  }

  /* ---------- a round's page, and the route: every #play… page ---------- */
  // the bar with the way back to the round's stop (or the road), the h1, then o.body; a stop's round makes it current
  function roundPage(r, o) {
    var m = r.m, lb = m ? stopLb(no(m)) : '';
    // the page title says what the round is, its stop and Play: "Card 3 of 7: Python from Zero · Stop 1.2 · Play mode"
    // (the bar's title is left out when the h1 starts with it: "Term match · Stop 1.2 · Play mode")
    var title = (o.title && o.h1.indexOf(o.title) !== 0 ? o.title + ': ' : '') + o.h1 + (m ? ' · ' + lb : '') + ' · Play mode';
    if (m) atStop(m.id);
    return draw(barHTML({ back: m ? { href: '#play-' + m.id, text: lb, name: 'Back to ' + lb } : ROAD, title: o.title }) + (o.top || '') + '<h1 tabindex="-1">' + esc(o.h1) + '</h1>' + (o.body || ''),
      title, { back: o.back || (lb ? lb + ' · ' : '') + NAMES[r.screen] });
  }
  var cssReady = false, cssWait = [];
  (function () {
    var href = 'assets/css/game.css', link = document.querySelector('link[href="' + href + '"]');
    var done = function () { if (!cssReady) { cssReady = true; cssWait.forEach(function (f) { f(); }); cssWait = []; } };
    if (!link) { link = document.createElement('link'); link.rel = 'stylesheet'; link.href = href; document.head.appendChild(link); } else if (link.sheet) done();
    link.addEventListener('load', done); link.addEventListener('error', done);
    setTimeout(done, 1500); // at most 1.5 s: without it the screens still work with the site's own styles
  })();
  function plain(name, text, screen) {
    draw(barHTML({ back: ROAD }) + '<h1 tabindex="-1">' + esc(name) + '</h1><p>' + text + '</p><div class="pl-go">' + btn('#play', 'Go to the road', 'btn-primary pl-wide') + '</div>', name, { screen: screen, back: 'The AI Road' });
  }
  function render(mm) {
    var h = mm && mm[0] != null ? String(mm[0]) : hash(), r, fn, first, ch;
    sput(SS, BACK, null); // back in Play: Learn pages stop offering the way back
    goalOpen = false;
    if (!cssReady) {
      A.setView('<div class="wrap pl" id="pl-root"><h1>Play mode</h1><p class="muted" role="status">Loading…</p></div>', 'Play mode');
      cssWait.push(function () { if (hash() === h) A.route(); });
      return;
    }
    r = R.parseRoute(h, env) || { screen: 'notfound' };
    fn = rounds[r.screen];
    first = !(S().play && S().play.first);
    // a first visit to any Play page but How Play works and a page that does not exist starts with the Welcome
    if (first && r.screen !== 'help' && r.screen !== 'notfound') return welcome(r, h);
    // every Play page keeps what it shows (a first visit, straight to a stop or round, records the same, quietly)
    ch = keepQuiet();
    // Play already started on another device: this device is marked as playing too (a Switch to Learn here stays)
    if (!first && !prefR().start) { setPref('start', 'play'); ch++; }
    if (ch) C.save();
    if (r.screen === 'road') road();
    else if (r.screen === 'stop') stop(r.m);
    else if (r.screen === 'done') draw(doneHTML(), 'Done for today', { screen: 'done', redraw: doneHTML, after: doneAfter, back: 'Done for today' });
    else if (r.screen === 'badges') draw(badgesHTML(), 'Badges and stats', { screen: 'badges', redraw: badgesHTML, back: 'Badges and stats' });
    else if (r.screen === 'help') draw(helpHTML(), 'How Play works', { screen: 'help', redraw: helpHTML, back: 'How Play works' });
    else if (r.screen === 'notfound') plain('Not found on the road', 'This Play page does not exist. The link may be old or mistyped.', 'notfound');
    else if (!fn) roundPage(r, { title: NAMES[r.screen], h1: NAMES[r.screen], body: '<p>This round is not ready yet.</p><div class="pl-go">' + btn('#play', 'Back to the road', 'btn-primary pl-wide') + '</div>' });
    else try { fn(r); } catch (e) { if (window.console) console.error(e); plain(NAMES[r.screen], 'This round could not open. Try again, or go back to the road.', 'error'); }
  }
  // registered at once: study.js routes again as soon as this file has run
  ST.addRoute(R.ROUTE_RE, render, 'play');

  /* ---------- events, once ---------- */
  function goOut(href, label) {
    sput(SS, BACK, { href: '#' + (hash() || 'play'), label: String(label || view.back || '').slice(0, 80) });
    if (href) location.hash = String(href).replace(/^#/, '');
  }
  // a quick double tap: its second tap lands on whatever the first one drew in its place (the next page's Listen
  // button, say). A pointer click inside the root within 400 ms of a draw is dropped before anything sees it; the
  // keyboard (detail 0) is never blocked
  document.addEventListener('click', function (ev) {
    var el = root();
    if (el && el.contains(ev.target) && tooSoon(ev, drawnAt)) { ev.preventDefault(); ev.stopPropagation(); }
  }, true);
  document.addEventListener('click', function (ev) {
    var t = ev.target.closest && ev.target.closest('a[data-pl-out], [data-pl]'), el = root(), a = t && t.getAttribute('data-pl'), bn;
    if (!t || !el || !el.contains(t)) return;
    if (t.hasAttribute('data-pl-out')) goOut('', t.getAttribute('data-pl-out'));
    else if (a === 'ring') toggleGoal();
    else if (a === 'next') { ev.preventDefault(); go(next()); }
    else if (a === 'start') start();
    else if (a === 'lv') { pickLevel(Number(t.getAttribute('data-lv'))); C.save(); redrawInPlace(); live('Showing Level ' + prefLv() + ': ' + lvTitle(prefLv()) + '.'); }
    else if (a === 'x') {
      if (banner && banner.kind === 'back') seenSet({ backDay: env.today() });
      banner = null; bn = document.getElementById('pl-banner');
      if (bn) bn.parentNode.removeChild(bn);
      focusEl(el.querySelector('h1'));
    } else if (a === 'learn') { setPref('start', 'learn'); C.save(); } // the link goes on to Home
    else if (a === 'calm') setCalm(!calm());
    else if (a === 'jsave') saveJournal();
  });
  document.addEventListener('change', function (ev) {
    var t = ev.target, el = root();
    if (el && el.contains(t) && t.getAttribute('data-pl') === 'goal' && t.name !== 'pl-goal-w') setGoal(Number(t.value)); // the Welcome saves it with Start playing
  });
  // typing in the journal box again: an empty Save asks for a line again
  document.addEventListener('input', function (ev) { if (ev.target && ev.target.id === 'pl-jr-t') ev.target.removeAttribute('data-saved'); });
  document.addEventListener('keydown', function (ev) {
    var top = document.getElementById('pl-top');
    if (ev.key === 'Escape' && goalOpen && top && top.contains(document.activeElement)) { toggleGoal(false); focusEl('pl-ring'); }
  });
  liveEl();

  window.AIM_PLAY = {
    // a round registered while its placeholder is on screen draws at once
    registerRound: function (screen, fn) {
      var had = rounds[screen];
      if (!NAMES[screen] || typeof fn !== 'function') return;
      rounds[screen] = fn;
      if (!had && view.on && view.round && (R.parseRoute(hash(), env) || {}).screen === screen) A.route();
    },
    draw: draw, root: root, inRound: inRound, onLeave: function (fn) { A.onLeave(fn); }, later: later, atStop: atStop,
    barHTML: barHTML, refreshBar: refreshBar, dotsHTML: dotsHTML, snap: snap, begin: begin, next: next, go: go, sess: sess, sessSet: sessSet, calm: calm, still: still, setPref: setPref, pickLevel: pickLevel,
    msNow: msNow, tooSoon: tooSoon,
    recordFact: recordFact, observeNow: observeNow, live: live, pop: pop, resultHTML: resultHTML, showResult: showResult,
    icon: icon, stoneHTML: stoneHTML, barrierHTML: barrierHTML, permitHTML: permitHTML, stampOn: stampOn, confettiHTML: confetti,
    roundPage: roundPage, btn: btn, sec: sec, box: box, sr: sr, goOut: goOut, fmtDay: fmtDay, n0: n0, pl: pl, stopLb: stopLb, esc: esc, inline: inline, R: R, env: env
  };
})();

/* =====================================================================================================================
   Part C: the six rounds, each registered with the shell (window.AIM_PLAY): S4 card round, S5 term match, S6 toll gate,
   S7 checkpoint, S8 warm-up and S9 quick questions. They show the course's own content through Learn's functions and
   save through Learn's own calls (setRead, learnStep, recordQuiz, testRunner, schedule, recordAnswer), so whatever is
   learned here is the same saved progress. Every round ends with the shell's result panel.
   While a round is open the save hook stays quiet (PL.inRound(true, true)): nothing is read out over a question, and
   the round says its XP once, at its end.
   ===================================================================================================================== */
(function () {
  'use strict';
  var PL = window.AIM_PLAY, A = window.AIM_APP, ST = window.AIM_STUDY, C = window.AIM_CORE, D = window.AIM || {};
  if (!PL || !A || !ST || !C) return; // the shell did not start (the Node checks load this file without a page)
  var R = PL.R, env = PL.env, esc = PL.esc, inline = PL.inline, icon = PL.icon, sr = PL.sr, btn = PL.btn, n0 = PL.n0;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- what the rounds share ---------- */
  // keyboard focus to a heading, a question or a message, so a screen reader reads it out; html's scroll padding
  // keeps it clear of the sticky header
  function focusOn(el) {
    el = typeof el === 'string' ? $(el) : el;
    if (!el) return;
    if (!el.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY)$/.test(el.tagName)) el.setAttribute('tabindex', '-1');
    el.focus();
  }
  // a key the round may act on: never while typing in a field, on the Play bar or the site header, or held down
  function roundKey(ev, root) {
    var t = ev.target;
    if (ev.ctrlKey || ev.metaKey || ev.altKey || ev.repeat || !root.isConnected || !t || !t.tagName) return false;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return false;
    return t === document.body || (root.contains(t) && !t.closest('.pl-top'));
  }
  // the round's one XP message at its end, worded as the save hook words it
  function xpSay(before) {
    var s = PL.snap(), g = s.total - before.total;
    return g > 0 ? 'Plus ' + n0(g) + ' XP. Today ' + n0(s.today) + ' of ' + s.goal + '.' : '';
  }
  // the stop's stone (its number is in the words beside it) and the eyebrow line above a round's h1
  function eyebrow(m, what) {
    var cleared = PL.snap().f.some(function (x) { return x.k === 'st:' + m.id; }); // its cap fills once the stop is cleared
    return '<div class="pl-rtop">' + PL.stoneHTML('', m.level, cleared) + '<p class="eyebrow">' + PL.stopLb(A.modNo(m)) + ' · ' + (what || esc(m.title)) + '</p></div>';
  }
  function starsHTML(n) { return '<span aria-hidden="true">' + '★★★☆☆☆'.substr(3 - n, 3) + '</span>' + sr(n + ' of 3 stars'); }
  // "Lab", "Lab and Code", "Watch, Lab and Code"
  function andList(l) { return l.length > 1 ? l.slice(0, -1).join(', ') + ' and ' + l[l.length - 1] : l.join(''); }
  // the fewest right answers that make 70% (the quiz engine rounds the score)
  function passCount(n) { for (var k = 0; k < n; k++) if (Math.round(k / n * 100) >= R.PASS) return k; return n; }
  // Listen (and the Hinglish switch that comes with it), reading only root's text, or the part of it named by within
  function listen(root, label, within) { var S = window.AIM_SPEAK; return S && S.btn ? S.btn(root, label, within ? { within: within } : {}) : ''; }
  // the way on, for a round that ends with nothing new to count (no result panel)
  function goHTML(label) {
    var r = PL.next();
    return '<div class="pl-go">' + btn(r.href || '#play', label || 'Next round', 'btn-primary pl-wide', ' data-pl="next"') + btn('#play-done', 'Done for today', 'pl-wide') + '</div>';
  }
  // the quiz engine's own "Try again" starts afresh: the result panel of the try before goes
  function onRetry(el, fn) {
    el.addEventListener('click', function (ev) {
      if (!ev.target.closest('[data-q="retry"]')) return;
      var old = $('pl-result');
      if (old) old.parentNode.removeChild(old);
      if (fn) fn();
    }, true);
  }

  /* ---------- S4 card round: one lesson card exactly as in Learn, then its quick check ---------- */
  // Got it ticks the card as Learn's Got it does and earns no XP. The quick check is the card's own recall question,
  // answered from memory; it saves as Learn's recall check does (I remembered it = Good, Not yet = Again) and earns the
  // same XP for either answer, so honesty never costs anything.
  PL.registerRound('card', function (r) {
    var m = r.m, mid = m.id, key = r.key, cards = A.readCards(m), n = cards.length, i = 0, rc = 'rc:' + mid + ':' + key;
    while (i < n - 1 && cards[i].key !== key) i++;
    var before = PL.begin(mid), ss = R.stopState(m, env, C.state, before.f), stop = PL.stopLb(A.modNo(m)), lab = 'Card ' + (i + 1) + ' of ' + n;
    // got: the card is ticked; gotNow: ticked on this visit; data: the recall question (undefined while it loads,
    // null when it cannot load); practice: "Check yourself anyway" (nothing is saved)
    var q = { got: ss.cards[i].read, gotNow: false, checked: ss.cards[i].checked, data: undefined, wait: false, practice: false, graded: false, counted: false, alive: true };
    var swapAt = -Infinity; // when Got it, Show answer or a grade last swapped the controls under the learner's finger
    var day = PL.fmtDay(C.state.read[mid + '/' + key] || '');
    var foot = q.got ? '<p class="small muted">' + (day ? 'You read this card on ' + day + '.' : 'You have read this card.') + '</p>' + foldBtn('peek')
      : '<button type="button" class="btn btn-primary pl-wide" data-pl="got">Got it</button>';
    var root = PL.roundPage(r, { title: lab, h1: m.title, top: eyebrow(m, 'Card round'), back: stop + ' · Card ' + (i + 1),
      body: PL.dotsHTML(ss.cards.map(function (c, j) { return j === i ? 'here' : c.state === 'done' ? 'done' : ''; }), lab) +
        '<div id="pl-cw"><div>' + A.readCardHTML(m, cards[i], i, n, A.cardBodies(m)[key], q.got, { idPrefix: 'pl-', foot: foot }) + '</div></div>' +
        '<div id="pl-qc-at"></div><div id="pl-res-at"></div>' });
    var wrap = $('pl-cw'), card = wrap.querySelector('.read-card');
    card.querySelector('.read-body').id = 'pl-rbody';
    // the diagram and the examples arrive as on Learn's Overview tab: into the wrapper's first child while it is there
    if (m.figs) A.placeFigures(m, wrap);
    if (m.examples) A.placeExamples(m, wrap);
    PL.inRound(true, true);
    PL.onLeave(function () { q.alive = false; });
    load();
    if (q.got) { fold('peek'); panel(); } // read before: straight to the quick check

    function load() {
      ST.ensureModule(mid).then(function (md) { var c = md && md.cards && md.cards[key]; return c && c.recall ? c : null; }, function () { return null; }).then(function (c) {
        q.data = c;
        if (q.alive && q.wait) { q.wait = false; panel(); }
      });
    }
    function foldBtn(mode) {
      return '<button type="button" class="btn pl-wide" data-pl="fold" data-fold="' + mode + '" aria-controls="pl-rbody" aria-expanded="false">' + (mode === 'peek' ? 'Show the whole card' : 'Show the card again') + '</button>';
    }
    // 'peek': only the first block (a card read before); 'shut': closed, so the answer cannot be read off it; '': all
    function fold(mode) {
      var b = card.querySelector('[data-pl="fold"]'), peek = b && b.getAttribute('data-fold') === 'peek';
      card.classList.toggle('pl-peek', mode === 'peek');
      card.classList.toggle('pl-shut', mode === 'shut');
      if (b) { b.setAttribute('aria-expanded', String(!mode)); b.textContent = mode ? (peek ? 'Show the whole card' : 'Show the card again') : (peek ? 'Show less' : 'Hide the card'); }
    }
    // the quick check box: the question, loading, "already checked" or "could not load"
    function panel() {
      var b = $('pl-qc-b'), c = q.data, s = C.state.srs[rc];
      if (!b) {
        $('pl-qc-at').innerHTML = '<section class="card pl-qc" aria-labelledby="pl-qc-h"><h2 class="h-sub" id="pl-qc-h" tabindex="-1">Quick check</h2><div class="stack" id="pl-qc-b"></div></section>';
        b = $('pl-qc-b');
      }
      if (q.checked && !q.practice) b.innerHTML = '<p class="pl-say">' + icon('tick') + '<span>Already checked.' + (s && !s.off ? ' It is in your Daily review.' : '') + '</span></p><button type="button" class="btn pl-wide" data-pl="anyway">Check yourself anyway</button>';
      else if (c === undefined) { q.wait = true; b.innerHTML = '<p class="muted" role="status">Loading the question…</p>'; }
      else if (!c) b.innerHTML = '<p>The quick check could not load. Check your connection. You can still go on.</p><button type="button" class="btn pl-wide" data-pl="reload">Try to load it again</button>';
      else b.innerHTML = askHTML(c);
      // nothing left to answer: after Got it the round ends here (with no XP for the tick); otherwise offer the way on
      if (!((q.checked && !q.practice) || c === null) || $('pl-result')) return;
      if (q.gotNow) finish('Card ' + (i + 1) + (q.checked ? ' done' : ' read'), false);
      else if (!$('pl-res-at').firstChild) $('pl-res-at').innerHTML = goHTML();
    }
    function askHTML(c) {
      return '<div class="stack-sm pl-qc-q"><p class="small muted">Answer from memory:</p><p class="pl-lesson" id="pl-qc-rq"><strong>' + inline(c.recall) + '</strong></p>' +
        '<div class="row">' + listen('.pl-qc-q', 'Listen to the question') + '</div></div>' +
        '<button type="button" class="btn btn-primary pl-wide" data-pl="show" id="pl-qc-show">Show answer</button>' +
        '<div class="stack-sm" id="pl-qc-a" hidden><p class="pl-lesson" id="pl-qc-ans" tabindex="-1"><span class="pl-tag">Answer</span> ' + inline(c.answer || '') + '</p>' +
        '<div class="stack-sm" id="pl-qc-ask"><p id="pl-qc-how" tabindex="-1"><strong>How did it go?</strong></p><div class="pl-two" role="group" aria-labelledby="pl-qc-how">' +
        '<button type="button" class="btn pl-wide" data-pl="yes">I remembered it</button><button type="button" class="btn pl-wide" data-pl="no">Not yet</button></div></div></div>' +
        '<div class="stack-sm" id="pl-qc-msg"></div>';
    }
    function got() {
      if (q.got || !A.setRead(mid, key, true)) return;
      q.got = q.gotNow = true; swapAt = PL.msNow();
      // the card's recall question (and a Key terms card's terms) join Daily review now. No 'card-read' event: it would
      // load two study scripts that Play does not use
      ST.enrollTicked();
      card.classList.add('is-read');
      card.querySelector('.read-foot').innerHTML = foldBtn('shut');
      fold('shut');
      panel();
      focusOn('pl-qc-h');
      PL.live('Marked as read.' + ($('pl-result') ? ' ' + xpSay(before) : ''));
    }
    function grade(ok) {
      var first = !q.graded, e = null, now = env.today(), said, stays;
      q.graded = true; swapAt = PL.msNow();
      if (!q.practice) {
        e = ST.learnStep(rc, ok ? 3 : 1); // Not yet only enrols it, due in today's review; I remembered it brings it back tomorrow
        // once; a later try earns nothing more. Already recorded at the first grade: the card was checked in another tab
        // meanwhile, so this panel has nothing new to count ("No new XP this time")
        if (!PL.recordFact('qc:' + mid + '/' + key) && first) before = PL.begin(mid);
      }
      // where the card is now, from its saved entry: another tab may have graded it first (then it is due tomorrow)
      said = e && !e.off ? (e.due > now ? 'The card comes back tomorrow in your warm-up (Daily review).' : 'The card is in today\'s Daily review.') : '';
      stays = !!e && !e.off && e.due <= now;
      $('pl-qc-ask').hidden = true;
      $('pl-qc-msg').innerHTML = ok ? '<p class="pl-say" id="pl-qc-m">' + icon('tick') + '<span><strong>Well done.</strong> ' + (q.practice ? 'Nothing was saved: this card was already checked.' : said) + '</span></p>'
        : '<p id="pl-qc-m">That is fine: forgetting at first is normal.' + (q.practice || !said ? '' : stays ? ' The card stays in today\'s review, so you will see it again soon.' : ' ' + said) + '</p>' +
          '<div class="pl-two"><button type="button" class="btn pl-wide" data-pl="reread">Read the card again</button><button type="button" class="btn pl-wide" data-pl="again">Try again</button></div>';
      if (first && q.data.why) $('pl-qc-b').insertAdjacentHTML('beforeend', '<details class="pl-fold pl-deep"><summary>Think deeper (optional)</summary><div class="stack-sm pl-lesson"><p><strong>' + inline(q.data.why) + '</strong></p>' +
        '<p class="small muted">Think of the reason yourself first, then look.</p><details><summary>Show a model answer</summary><p>' + inline(q.data.whyAnswer || '') + '</p></details></div></details>');
      if (first && !q.practice) {
        PL.stampOn(card, 'Checked');
        finish('Card ' + (i + 1) + ' checked');
        PL.live((ok ? '' : stays ? 'That is fine: the card stays in today\'s review. ' : 'That is fine. ' + (said && said + ' ')) + xpSay(before));
      } else focusOn('pl-qc-m');
    }
    function finish(title, focus) {
      if (!q.counted) { q.counted = true; PL.sessSet({ cards: PL.sess().cards + 1 }); } // first, so Next round is right
      $('pl-res-at').innerHTML = '';
      PL.showResult($('pl-res-at'), { title: title, before: before, focus: focus });
    }
    root.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-pl]'), a = b && b.getAttribute('data-pl');
      // the second tap of a double tap, on the control just swapped in under the finger (Show the card again after Got
      // it, I remembered it after Show answer, Try again after a grade): a pointer click only, never the keyboard
      if (PL.tooSoon(ev, swapAt)) return;
      if (a === 'got') got();
      else if (a === 'fold') fold(b.getAttribute('aria-expanded') === 'true' ? b.getAttribute('data-fold') : '');
      // the answer is read out first, then "How did it go?" and the two answers after it
      else if (a === 'show') { $('pl-qc-a').hidden = false; $('pl-qc-show').hidden = true; swapAt = PL.msNow(); focusOn('pl-qc-ans'); }
      else if (a === 'yes' || a === 'no') grade(a === 'yes');
      else if (a === 'reread') {
        // the card opens above the reader: go straight to its top (a smooth scroll over a long card would take a while)
        fold('');
        card.scrollIntoView({ block: 'start', behavior: 'instant' });
        $('pl-read-h-' + key).focus({ preventScroll: true });
      }
      else if (a === 'again') { $('pl-qc-a').hidden = true; $('pl-qc-ask').hidden = false; $('pl-qc-show').hidden = false; $('pl-qc-msg').innerHTML = ''; focusOn('pl-qc-rq'); }
      else if (a === 'anyway') { q.practice = true; q.graded = false; panel(); focusOn(q.data ? 'pl-qc-rq' : 'pl-qc-h'); }
      else if (a === 'reload') { focusOn('pl-qc-h'); q.data = undefined; panel(); load(); }
    });
  });

  /* ---------- S5 term match: which term means this? Practice only: nothing goes into Daily review ---------- */
  PL.registerRound('terms', function (r) {
    var m = r.m, mid = m.id, kt = m.keyTerms, day = env.today(), before = PL.begin(mid);
    // queue: terms not matched yet (a miss goes to the end); opts: the options shown, as indexes in m.keyTerms
    var queue = R.termOrder(m, day), total = queue.length, tries = {}, firstTry = 0, missed = [], opts = [], picked = false;
    var root = PL.roundPage(r, { title: 'Term match', h1: 'Term match', top: eyebrow(m),
      body: '<p class="small muted">Read the meaning, then pick the term it describes. A term you miss comes back at the end. This is practice: it does not change your warm-up (Daily review).</p>' +
        '<div class="stack" id="pl-tm"></div><div id="pl-res-at"></div>' });
    PL.inRound(true, true);
    ask(false);

    function ask(focus) {
      var cur = queue[0], t = kt[cur], back = tries[cur] > 0, done = total - queue.length;
      // the same options on a reload; a term that comes back gets them in a new order
      opts = R.pickOptions(m, cur, back ? day + '~' + tries[cur] : day) || [cur];
      picked = false;
      $('pl-tm').innerHTML = '<p class="pl-tm-n"><b class="num">' + done + ' of ' + total + ' matched</b>' + (back ? ' · this term came back' : '') + '</p>' + A.bar(Math.round(done / total * 100), 'Terms matched') +
        '<section class="card stack pl-tm-q" aria-labelledby="pl-tm-h"><div class="stack-sm" id="pl-tm-p"><h2 class="h-sub3" id="pl-tm-h">Which term means this?</h2><p class="pl-lesson pl-tm-m">' + inline(t.meaning) + '</p></div>' +
        '<div class="row">' + listen('.pl-tm-q', 'Listen to the meaning', '.pl-tm-m') + '</div>' +
        '<div class="pl-opts" role="group" aria-labelledby="pl-tm-h">' + opts.map(function (k, j) {
          return '<button type="button" class="btn pl-opt" data-pl="opt" data-i="' + k + '" aria-keyshortcuts="' + (j + 1) + '"><span class="pl-key" aria-hidden="true">' + (j + 1) + '</span> <span class="pl-ot">' + esc(kt[k].term) + '</span></button>';
        }).join('') + '</div><div class="stack-sm pl-fb" id="pl-tm-fb" hidden></div></section>';
      if (focus) focusOn('pl-tm-p');
    }
    function pick(k) {
      var cur = queue[0], t = kt[cur], ok = k === cur;
      if (picked || opts.indexOf(k) < 0) return;
      picked = true;
      tries[cur] = (tries[cur] || 0) + 1;
      if (ok) { queue.shift(); if (tries[cur] === 1) firstTry++; } else { if (tries[cur] === 1) missed.push(cur); queue.push(queue.shift()); }
      // the right option and a wrong pick are marked by an icon and words, not by colour alone
      Array.prototype.forEach.call($('pl-tm').querySelectorAll('[data-pl="opt"]'), function (b) {
        var j = Number(b.getAttribute('data-i')), right = j === cur, mine = j === k;
        b.setAttribute('aria-disabled', 'true');
        if (right || mine) {
          b.classList.add(right ? 'is-right' : 'is-wrong');
          b.insertAdjacentHTML('beforeend', ' <span class="pl-ow">' + icon(right ? 'tick' : 'cross') + (right ? 'Right answer' : 'Your answer') + '</span>');
        }
        if (right && ok && !PL.still()) { b.classList.add('is-pulse', 'pl-rel'); PL.pop('✓', b); }
      });
      var fb = $('pl-tm-fb');
      fb.innerHTML = '<p class="pl-say' + (ok ? '' : ' is-no') + '">' + icon(ok ? 'tick' : 'cross') + '<span>' + (ok ? '<strong>Right!</strong>' : '<strong>Not quite.</strong> It is <b>' + esc(t.term) + '</b>.') + '</span></p>' +
        '<div class="stack-sm pl-lesson"><p><b>' + esc(t.term) + '</b>' + (t.hi ? ' <span class="term-hi">(' + esc(t.hi) + ')</span>' : '') + '</p>' +
        (t.like ? '<p><strong>Think of it like:</strong> ' + inline(t.like) + '</p>' : '') + (t.example ? '<p><strong>Example:</strong> ' + inline(t.example) + '</p>' : '') + '</div>' +
        '<button type="button" class="btn btn-primary pl-wide" data-pl="tnext">' + (queue.length ? 'Next' : 'See my result') + '</button>';
      fb.hidden = false;
      focusOn(fb);
    }
    function next() {
      if (!picked) return;
      if (queue.length) { ask(true); return; }
      $('pl-tm').innerHTML = '';
      PL.recordFact('tm:' + mid); // the first finished round at this stop earns 10 XP; later ones are practice
      PL.showResult($('pl-res-at'), { title: 'Term match done', before: before,
        lead: '<p class="pl-lead"><b class="num">' + total + ' of ' + total + ' matched</b> · ' + firstTry + ' on the first try</p>' +
          (missed.length ? '<p>Missed on the first try: ' + missed.map(function (k) { return '<b>' + esc(kt[k].term) + '</b>'; }).join(', ') + '.</p>' : '') });
      PL.live(xpSay(before));
    }
    root.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-pl]'), a = b && b.getAttribute('data-pl');
      if (a === 'opt') pick(Number(b.getAttribute('data-i')));
      else if (a === 'tnext') next();
    });
    // keys 1-3 pick an option; Enter goes on (a focused button or link keeps its own Enter)
    var onKey = function (ev) {
      if (!roundKey(ev, root) || !$('pl-tm-p')) return;
      if (!picked && /^[1-3]$/.test(ev.key) && opts[Number(ev.key) - 1] != null) { ev.preventDefault(); pick(opts[Number(ev.key) - 1]); }
      else if (picked && ev.key === 'Enter' && !ev.target.closest('a, summary, button:not([data-pl="opt"])')) { ev.preventDefault(); next(); }
    };
    document.addEventListener('keydown', onKey);
    PL.onLeave(function () { document.removeEventListener('keydown', onKey); });
  });

  /* ---------- S6 toll gate: the module quiz, on the same engine and with the same saving as Learn's Quiz tab ---------- */
  PL.registerRound('quiz', function (r) {
    var m = r.m, mid = m.id, qs = D.quizzes[mid] || [], n = qs.length, need = passCount(n), before = PL.begin(mid), q0 = C.state.quiz[mid], right = {};
    PL.roundPage(r, { title: 'Toll gate', h1: 'Toll gate · pass at 70%', top: eyebrow(m),
      // the pass mark is in the h1 and under the lamps: the intro does not say it a third time
      body: '<div class="pl-tg">' + PL.barrierHTML(!!q0 && q0.best >= R.PASS) + '<div class="stack-sm"><p>Each answer is explained as you go.</p>' +
        '<p id="pl-tg-best">' + bestHTML(q0) + '</p></div></div>' +
        '<div class="pl-lamps"><span class="pl-lampw" id="pl-lampw" aria-hidden="true"></span><p id="pl-lamp-t"></p></div><div id="pl-res-at"></div><div id="pl-quiz"></div>' });
    PL.inRound(true, true);
    lamps();
    var box = $('pl-quiz'), quiz = new C.Quiz(box, { questions: qs, mode: 'learn', key: mid, confidence: true, next: R.nextStop(m, env),
      // as Learn's Quiz tab: each answer is saved and remembered (Mistakes notebook, Knowledge map); no score toast,
      // because the result panel says it
      onAnswer: function (x) { C.logActivity(); C.save(); ST.emit('answer', x); right[x.q.id] = !!x.correct; lamps(); },
      onFinish: function (x) { A.recordQuiz(mid, x.score, true); result(x); } });
    PL.onLeave(function () { quiz.destroy(); });
    onRetry(box, function () { right = {}; lamps(); before = PL.begin(mid); }); // a new try counts its own XP

    function bestHTML(q) { return q && q.attempts ? '<b>Best ' + q.best + '%</b> · ' + starsHTML(R.stars(q.best)) : '<b>Not tried yet</b>'; }
    // one lamp lights for each right answer; the text says the same, so nothing rests on the picture
    function lamps() {
      var k = 0, h = '', j;
      Object.keys(right).forEach(function (id) { if (right[id]) k++; });
      for (j = 0; j < n; j++) h += '<i class="' + (j < k ? 'on' : '') + (j === need - 1 ? ' goal' : '') + '"></i>';
      $('pl-lampw').innerHTML = h;
      $('pl-lamp-t').innerHTML = 'Right so far: <b class="num">' + k + '</b> · ' + need + ' lifts the barrier';
    }
    // above the engine's own score box and review, which stay as they are
    function result(x) {
      var pass = x.score >= R.PASS, nx = R.nextStop(m, env), q = C.state.quiz[mid];
      // Continue never leads to hands-on work, so a pass says what still clears this stop: its open Watch, Lab and Code
      var open = R.stamps(m, env, C.state).filter(function (p) { return !p.done && /^(watch|lab|code)$/.test(p.key); }).map(function (p) { return p.label; });
      $('pl-tg-best').innerHTML = bestHTML(q);
      if (q && q.best >= R.PASS) document.querySelector('.pl-tg .pl-barrier').classList.add('is-up'); // the header's barrier stays up
      PL.showResult($('pl-res-at'), { before: before, focus: 'later', title: pass ? 'Toll gate passed' : 'You scored ' + x.score + '%',
        lead: pass ? '<p class="pl-lead"><b class="num">' + x.correct + ' of ' + x.total + ' right · ' + x.score + '%</b> · ' + starsHTML(R.stars(x.score)) + '</p>'
          : '<p>' + need + ' of ' + x.total + ' right lifts the barrier. Your best score is kept. Read the explanations below, then try again when you are ready.</p>',
        moment: pass ? PL.barrierHTML(true, true) + '<p><strong>The barrier is up!</strong> ' + (nx && nx.kind === 'checkpoint' ? 'Next comes Checkpoint ' + nx.lv + ', the level test.' : 'The road to the next stop is open.') + '</p>' : '',
        momentLine: 'The barrier is up',
        extra: pass && open.length ? '<a class="pl-more" href="#play-' + mid + '">To clear this stop, earn its ' + andList(open) + ' stamp' + (open.length > 1 ? 's' : '') + '.</a>' : '' });
      PL.live(xpSay(before));
    }
  });

  /* ---------- S7 checkpoint: the level test, on Learn's own test runner (one kept test for both) ---------- */
  PL.registerRound('test', function (r) {
    var lv = r.lv, before = PL.begin(), L = R.levelState(lv, C.state, env, before.f), n = (D.quizzes[r.key] || []).length, next = A.levelById[lv + 1];
    var li = function (t) { return '<li>' + t + '</li>'; };
    // the readiness line never blocks: the checkpoint is open at any time
    var ready = L.test.passed ? 'You have this road permit. You can take the checkpoint again at any time. Your best score is kept.'
      : L.gates >= L.of ? 'You have passed all ' + L.of + ' toll gates on this road.'
      : 'You have passed ' + L.gates + ' of ' + L.of + ' toll gates on this road. Many learners find it easier after all ' + L.of + ', but you can try now.';
    var root = PL.roundPage(r, { title: 'Checkpoint ' + lv, h1: 'Checkpoint ' + lv + ': ' + L.title, top: '<p class="eyebrow">Level ' + lv + ' · Level test</p>', back: 'Checkpoint ' + lv,
      body: '<div class="pl-tg">' + PL.barrierHTML(L.test.passed) + '<ul class="pl-facts">' + li(n + ' questions from all ' + L.of + ' stops') + li('Pass mark 70%') +
        li('Answers and explanations at the end') + li('If you leave part-way, your answers are kept') + '</ul></div><p class="pl-ready">' + ready + '</p><div id="pl-res-at"></div><div id="pl-test"></div>' });
    PL.inRound(true, true);
    var box = $('pl-test');
    // timer off by default in Play; onDone runs before the runner draws its score box into box, so the result goes above it
    A.testRunner(lv, box, { timed: false, quiet: true, onDone: result });
    onRetry(box, function () { before = PL.begin(); });
    root.addEventListener('click', function (ev) {
      if (!ev.target.closest('[data-pl="lvnext"]')) return;
      PL.pickLevel(lv + 1); C.save(); // the road opens on the next level; the link goes on to it
    });

    function result(x) {
      var pass = x.score >= R.PASS, out = ' data-pl-out="Checkpoint ' + lv + '"', had = before.f.some(function (y) { return y.k === 'qp:' + r.key; });
      // a first pass gets the shell's road permit moment ("Checkpoint cleared!", with the barrier lift); a later pass
      // lifts the barrier again
      PL.showResult($('pl-res-at'), { before: before, focus: 'later', title: pass ? 'Checkpoint ' + lv + ' passed' : 'You scored ' + x.score + '%',
        moment: pass && had ? PL.barrierHTML(true, true) + '<p><strong>The barrier is up!</strong> Your road permit for Level ' + lv + ' stays yours.</p>' : '', momentLine: 'The barrier is up',
        extra: pass && next ? btn('#play', 'Go to the Level ' + next.id + ' road', 'pl-wide', ' data-pl="lvnext"') : '',
        lead: pass ? '<p class="pl-lead"><b class="num">' + x.correct + ' of ' + x.total + ' right · ' + x.score + '%</b></p>'
          : '<p>' + passCount(x.total) + ' of ' + x.total + ' right passes the checkpoint. Your best score is kept. The explanations below show what to practise. Come back when you are ready.</p>' +
            '<div class="pl-go">' + btn('#mistakes', 'Fix your mistakes', 'pl-wide', out) + btn('#mixed', 'Practise your weak spots', 'pl-wide', out) + '</div>' });
      PL.live(xpSay(before));
    }
  });

  /* ---------- S8 warm-up: the first cards of Daily review, with its own scheduler, grades and order ---------- */
  PL.registerRound('warmup', function (r) {
    var before = PL.begin(), alive = true, w = null, G = null, swapAt = -Infinity; // swapAt: a card drawn or its answer shown
    var root = PL.roundPage(r, { title: 'Warm-up', h1: 'Warm-up',
      body: '<p class="small muted">The same cards and timing as Daily review. Each card you grade earns 2 XP, whatever the grade, so be honest.</p>' +
        '<div class="stack" id="pl-wu"><p class="muted" role="status">Loading your review cards…</p></div><div id="pl-res-at"></div>' });
    PL.inRound(true, true);
    var onKey = function (ev) {
      if (!w || !$('pl-wu-fr') || !roundKey(ev, root)) return;
      if (!w.shown && (ev.key === ' ' || ev.key === 'Spacebar') && !/^(A|BUTTON|SUMMARY)$/.test(ev.target.tagName)) { ev.preventDefault(); show(); }
      else if (w.shown && /^[1-4]$/.test(ev.key)) { ev.preventDefault(); grade(Number(ev.key)); }
    };
    document.addEventListener('keydown', onKey);
    PL.onLeave(function () { alive = false; document.removeEventListener('keydown', onKey); });
    ST.need(['review']).then(function () { return ST.reviewPlan(); }).then(start, function () {
      if (!alive) return;
      PL.sessSet({ warm: true }); // Continue goes on to the next round instead of here again
      $('pl-wu').innerHTML = '<p>The warm-up could not load. Check your connection. You can still go on.</p>' + goHTML('Continue');
    });

    function start(plan) {
      if (!alive) return;
      var q = (plan.due || []).concat(plan.newToday || []).slice(0, R.WARM_MAX);
      G = ST.reviewGrades;
      if (!q.length) {
        PL.sessSet({ warm: true });
        $('pl-wu').innerHTML = '<p><strong>Nothing to review right now.</strong> Cards come back here when it is time to review them. Each lesson card you check joins your warm-up.</p>' + goHTML('Continue');
        return;
      }
      w = { queue: q, total: q.length, cleared: {}, again: {}, seen: {}, shown: false };
      card(false);
    }
    function card(focus) {
      var id = w.queue[0], it = id && ST.reviewItem(id);
      if (!id) return finish();
      if (!it) { w.queue.shift(); if (!w.cleared[id]) w.total--; return card(focus); } // its content is missing: skipped, as in Daily review
      var done = Object.keys(w.cleared).length;
      w.shown = false; w.seen[id] = 1; // "Card 4 of 10" counts the cards met so far: one that comes back keeps its number
      swapAt = PL.msNow(); // the new card's Show answer lands where the grades were
      $('pl-wu').innerHTML = '<p><b class="num">Card ' + Object.keys(w.seen).length + ' of ' + w.total + '</b>' + (w.again[id] ? ' · this card came back' : '') + '</p>' + A.bar(Math.round(done / w.total * 100), 'Warm-up progress') +
        '<section class="card stack pl-wu-card" data-card="' + esc(id) + '" aria-labelledby="pl-wu-ask"><div class="stack-sm" id="pl-wu-fr"><p class="eyebrow">' + (it.kind === 'term' ? 'Key term' : 'Lesson recall') + ' · ' + PL.stopLb(A.modNo(A.modById[it.mid])) + '</p>' +
        '<p id="pl-wu-ask"><strong>' + esc(it.ask) + '</strong></p><div class="pl-lesson pl-wu-f">' + inline(it.front) + '</div></div>' +
        '<div class="row">' + listen('.pl-wu-card', 'Listen to this card') + '</div>' +
        '<div class="stack-sm" id="pl-wu-q"><button type="button" class="btn btn-primary pl-wide" data-pl="wshow">Show answer</button><p class="kbd-hint">or press <kbd>Space</kbd></p></div>' +
        '<div class="stack" id="pl-wu-a" hidden><div class="pl-lesson prose stack-sm" id="pl-wu-b">' + C.md(it.back) + '</div>' +
        '<p id="pl-wu-gq"><strong>How well did you remember it?</strong></p><div class="pl-grades" role="group" aria-labelledby="pl-wu-gq">' + [1, 2, 3, 4].map(function (g) {
          // each grade says when the card would come back: the scheduler's own preview, nothing saved
          return '<button type="button" class="btn pl-g" data-pl="wg" data-g="' + g + '" aria-keyshortcuts="' + g + '"><span><b>' + G[g][0] + '</b> · ' + ST.reviewGap(id, g) + '</span> <span class="small">' + G[g][1] + '</span></button>';
        }).join('') + '</div><p class="kbd-hint">Keys <kbd>1</kbd> to <kbd>4</kbd> pick a grade.</p></div></section>';
      if (focus) focusOn('pl-wu-fr');
    }
    function show() {
      if (!w || w.shown) return;
      w.shown = true; swapAt = PL.msNow();
      $('pl-wu-q').hidden = true; $('pl-wu-a').hidden = false;
      focusOn('pl-wu-b');
    }
    function grade(g) {
      if (!w || !w.shown || !(g >= 1 && g <= 4)) return;
      var id = w.queue.shift(), e = ST.schedule(id, g), d = ST.daysBetween(env.today(), e.due); // Daily review's own save, and today's review count
      if (g === 1) { w.again[id] = 1; w.queue.splice(Math.min(w.queue.length, 3), 0, id); } // forgotten: back after 3 other cards
      else { w.cleared[id] = 1; delete w.again[id]; }
      PL.live(G[g][0] + '. ' + (g === 1 ? 'This card comes back in a few cards.' : d === 1 ? 'Next review tomorrow.' : 'Next review in ' + d + ' days.'));
      card(true);
    }
    function finish() {
      var n = Object.keys(w.cleared).length, tomorrow = env.addDays(env.today(), 1);
      w = null;
      PL.sessSet({ warm: true }); // first, so Next round is right
      $('pl-wu').innerHTML = '';
      PL.showResult($('pl-res-at'), { title: 'Warm-up done', before: before, lead: '<p class="pl-lead"><b class="num">' + PL.pl(n, 'card') + ' reviewed</b><span id="pl-wu-tm"></span></p>',
        extra: '<a class="pl-more" href="#review" data-pl-out="Warm-up">Open the full Daily review</a>' });
      PL.live(xpSay(before));
      ST.reviewPlan().then(function (p) {
        var x = p && p.next, el = $('pl-wu-tm'), k = x ? (x.reviews || 0) + (x.fresh || 0) : 0;
        if (el && x && x.day) el.textContent = x.day === tomorrow ? ' · ' + (k === 1 ? '' : 'About ') + PL.pl(k, 'card') + ' will be ready tomorrow' : ' · Your next review: ' + PL.fmtDay(x.day);
      }, function () {});
    }
    root.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-pl]'), a = b && b.getAttribute('data-pl');
      // the second tap of a double tap on a grade would show the next card's answer before the learner tries to recall it
      if (PL.tooSoon(ev, swapAt)) return;
      if (a === 'wshow') show();
      else if (a === 'wg') grade(Number(b.getAttribute('data-g')));
    });
  });

  // a link in a round's lesson or quiz text that opens Learn (a module named in a card, say) keeps the way back here,
  // as the hands-on links do
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href^="#"]'), root = PL.root(), h = a && a.getAttribute('href').slice(1);
    if (!a || !root || !root.contains(a) || a.hasAttribute('data-pl-out') || R.ROUTE_RE.test(h) || !a.closest('.read-card, .pl-lesson, .quiz, .score-box, .fold')) return;
    PL.goOut('');
  });

  /* ---------- S9 quick questions: one past mistake (Fix-it) and up to 2 questions from earlier stops ---------- */
  PL.registerRound('quick', function (r) {
    var before = PL.begin(), cur = R.currentStop(C.state, env, before.f), pool = R.quickPool(C.state, env, cur ? cur.id : ''), list = pool.list, by = {}, fixed = {};
    list.forEach(function (x) { by[x.qid] = x; });
    PL.roundPage(r, { title: 'Quick questions', h1: 'Quick questions',
      body: list.length ? '<p>A few questions to keep earlier stops fresh' + (pool.fix ? ', starting with one you got wrong before (Fix-it)' : '') + '. Each answer is explained as you go.</p><div id="pl-res-at"></div><div id="pl-qq"></div>'
        : '<p><strong>No quick questions right now.</strong> They come from stops whose toll gate you have tried.</p>' + goHTML('Continue') });
    if (!list.length) { PL.sessSet({ quick: true }); return; } // Continue goes on to the next round
    PL.inRound(true, true);
    var box = $('pl-qq'), quiz = new C.Quiz(box, { questions: list.map(function (x) { return x.q; }), mode: 'learn', key: 'quick', confidence: true,
      // each answer saved once, as the Mistakes notebook and Mixed practice save theirs. No 'answer' event: it would
      // save the same answer a second time, as a quiz answer
      onAnswer: function (x) {
        var id = x.q.id, open = ST.isMistake(C.state.qa[id]), y = ST.recordAnswer(id, !!x.correct, x.sure || 0, by[id].kind === 'fix' ? 'mistakes' : 'mixed', x.picked);
        C.logActivity(); C.save();
        fixed[id] = open && !ST.isMistake(y);
      },
      onFinish: result });
    // each question says where it comes from ("Fix-it", "From Stop 1.4"), next to the engine's "Question 1 of 3"
    var draw = quiz.render;
    quiz.render = function () { draw.apply(quiz, arguments); label(); };
    label();
    PL.onLeave(function () { quiz.destroy(); });
    onRetry(box, function () { fixed = {}; before = PL.begin(); });

    function label() {
      var q = quiz.qs[quiz.i], at = box.querySelector('.quiz .chip-level'), x = q && by[q.id];
      if (at && x) at.insertAdjacentHTML('afterend', '<span class="chip' + (x.kind === 'fix' ? ' chip-hi' : '') + '">' + esc(x.label) + '</span>');
    }
    function result(x) {
      var nFixed = Object.keys(fixed).filter(function (id) { return fixed[id]; }).length, f = pool.fix && C.state.qa[pool.fix.qid];
      PL.sessSet({ quick: true }); // first, so Next round is right
      PL.showResult($('pl-res-at'), { before: before, focus: 'later', title: 'Quick questions done',
        lead: '<p class="pl-lead"><b class="num">' + x.correct + ' of ' + x.total + ' right</b>' + (nFixed ? ' · ' + PL.pl(nFixed, 'mistake') + ' fixed' : '') + '</p>' +
          (f && f.lr && ST.isMistake(f) ? '<p>Your Fix-it answer was right. Answer it right again on another day, and the mistake is fixed for good.</p>' : '') });
      PL.live(xpSay(before));
    }
  });
})();
