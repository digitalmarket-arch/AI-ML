/* AI Marg study feature: Knowledge map: mastery stages, weak topics, next best steps; Today card on Home; study summary on My progress.
   Uses window.AIM_STUDY (assets/js/study.js) and window.AIM_APP (assets/js/app.js). */
(function () {
  'use strict';
  var ST = window.AIM_STUDY; if (!ST) return; // study features are switched off in this browser
  var C = window.AIM_CORE, D = window.AIM || {};
  var esc = C.esc;
  var A = function () { return window.AIM_APP; };
  var S = function () { return C.state; };
  var $ = function (id) { return document.getElementById(id); };
  var plural = function (n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); };
  var pc = function (x) { return Math.round(x * 100) + '%'; };
  var HOW = '<a href="#methods">How these methods work</a>';

  // the rules below are explained on the Knowledge map in the same words; change both together
  var PASS = 70;            // module quiz pass mark (%)
  var WEAK_ACC = 0.6, WEAK_MIN = 2;      // weak topic: accuracy below 60% with at least 2 answers (or any open mistake)
  var STRONG_ACC = 0.85, STRONG_MIN = 3; // strong topic: 85% or more with at least 3 answers
  var CAL_MIN = 10;         // rated answers needed before the calibration summary is shown
  var MANY_DUE = 10;        // this many reviews waiting today puts Daily review first
  var RET_CARDS = 5, RET_AVG = 0.8, RET_DAYS = 21; // Smarana: 5 reviewed cards, 80% predicted recall, one card held 21+ days
  var RET_SHOW = 5;         // reviewed cards needed before predicted recall is shown (as on the Daily review page)
  var MIN_MIXED = 2;        // mixed practice needs two started modules
  var SHOW_WEAK = 5;        // weak topics listed on the map
  var VIDEO_TYPES = { playlist: 1, video: 1, course: 1, channel: 1 };
  var STAGES = [
    { n: 1, label: 'Heard', sa: 'sravana' },
    { n: 2, label: 'Reflected', sa: 'manana' },
    { n: 3, label: 'Practised', sa: 'abhyasa' },
    { n: 4, label: 'Tested', sa: '' },
    { n: 5, label: 'Retained', sa: 'smarana' }
  ];
  var STATUS_TEXT = { done: 'done', todo: 'not yet', na: 'not needed in this module', soon: 'coming soon for this module' };
  var GLYPH = { done: '✓', todo: '', na: '–', soon: '…' };
  function glyphHTML(status) { return '<span class="mt-dot-i" aria-hidden="true">' + GLYPH[status] + '</span>'; }

  /* ---------- small helpers ---------- */
  function prefs() {
    var p = S().prefs;
    if (!p.study || typeof p.study !== 'object' || Array.isArray(p.study)) p.study = {};
    return p.study;
  }
  function modLabel(m) { return A().modNo(m) + ' ' + m.title; }
  function pad(n) { return String(n).padStart(2, '0'); }
  function localDay(iso) { var d = new Date(iso); return isNaN(d.getTime()) ? '' : d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function weekStart(day) { var wd = (new Date(day + 'T12:00:00').getDay() + 6) % 7; return ST.addDays(day, -wd); } // Monday
  function fmtMins(n) { n = Math.max(0, Math.round(n)); if (n < 60) return n + ' min'; var h = Math.floor(n / 60), m = n % 60; return h + ' h' + (m ? ' ' + m + ' min' : ''); }
  function fmtDay(day) { try { return new Date(day + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }); } catch (e) { return day; } }
  function hashIs(name) { return (location.hash || '').replace(/^#/, '') === name; }
  // the first page drawn on load runs before AIM_APP exists: run just after it is published
  function withApp(fn) { if (A()) { fn(); return; } setTimeout(function () { if (A()) fn(); }, 0); }
  function sansName(key) { return key ? ST.sans(key, { meaning: false }) : ''; }
  function stageName(s) { return esc(s.label) + (s.sa ? ' · ' + sansName(s.sa) : ''); }

  // the module a quiz question belongs to: its module quiz, or the module its level-test question is tagged with
  function qMod(qid) {
    var app = A(), set = ST.questionSet(qid);
    if (set && app.modById[set]) return set;
    var t = ST.qtag(qid);
    return t && app.modById[t.mid] ? t.mid : '';
  }
  // the module's own videos and courses: its best pick and the ones recommended for it
  function moduleVideos(m) {
    var mp = A().mainPicks(m);
    return mp.list.filter(function (r) { return r === mp.main || mp.curated.indexOf(r.id) >= 0; });
  }
  // a module counts as started (for Mixed practice) when a lesson card is ticked, a video watched, its quiz tried or an exercise solved
  function isStarted(m) {
    var st = S(), app = A();
    if (app.readCards(m).some(function (c) { return app.readOn(m.id, c.key); })) return true;
    if (moduleVideos(m).some(function (r) { return st.watched[r.id]; })) return true;
    if (st.quiz[m.id] && st.quiz[m.id].attempts > 0) return true;
    if ((D.quizzes[m.id] || []).some(function (q) { return st.qa[q.id] && st.qa[q.id].n > 0; })) return true;
    return app.exOf(m.id).some(function (e) { return st.ex[e.id] && st.ex[e.id].done; });
  }
  function startedCount() {
    var P = ST._practice; // Mixed practice decides when it is ready; use its own rule when it is there
    if (P && typeof P.startedModules === 'function') { try { return P.startedModules().length; } catch (e) {} }
    return (D.modules || []).filter(function (m) { return (D.quizzes[m.id] || []).length && isStarted(m); }).length;
  }
  function hasProgress() {
    var st = S(), keys = function (o) { return o && typeof o === 'object' ? Object.keys(o) : []; };
    if (keys(st.read).some(function (k) { return st.read[k] && String(st.read[k]).charAt(0) !== '-'; })) return true;
    if (keys(st.watched).length || keys(st.qa).length || keys(st.srs).length || keys(st.refl).length || keys(st.fs).length) return true;
    if (keys(st.quiz).some(function (k) { return st.quiz[k] && st.quiz[k].attempts > 0; })) return true;
    if (keys(st.ex).some(function (k) { return st.ex[k] && st.ex[k].done; })) return true;
    if (keys(st.labs).some(function (k) { return keys(st.labs[k]).some(function (t) { return st.labs[k][t]; }); })) return true;
    if (keys(st.jr).some(function (k) { return st.jr[k] && !st.jr[k].del; })) return true;
    return keys(st.modules).some(function (k) { return st.modules[k] && st.modules[k].done; });
  }
  // new review cards still allowed today (the Daily review page's own limit, kept in this device's preferences)
  function newQuota() {
    var p = prefs(), n = Math.round(Number(p.newPerDay));
    n = isFinite(n) && n >= 5 && n <= 50 ? n : 15;
    var x = p.newToday, seen = x && x.day === ST.today() && Array.isArray(x.ids) ? x.ids.filter(function (i) { return typeof i === 'string'; }).length : 0;
    return Math.max(0, n - seen);
  }

  /* ---------- everything the map needs, worked out from the saved progress ---------- */
  function snapshot() {
    var app = A(), st = S(), t = ST.today(), ready = !!D.study;
    var snap = { ready: ready, t: t, mods: {}, mistakesBy: {}, openAll: 0, topics: {}, cards: {}, due: 0, fresh: 0, active: 0, long: 0, progress: hasProgress() };
    // answers: open mistakes per module, accuracy per module topic
    var qa = st.qa || {};
    Object.keys(qa).forEach(function (qid) {
      var x = qa[qid]; if (!x || !ST.question(qid)) return;
      var mid = qMod(qid), open = ST.isMistake(x);
      if (open) { snap.openAll++; if (mid) snap.mistakesBy[mid] = (snap.mistakesBy[mid] || 0) + 1; }
      var tag = ST.qtag(qid);
      if (!x.n || !mid || !tag || !tag.topic) return;
      var k = mid + '|' + tag.topic, a = snap.topics[k] = snap.topics[k] || { mid: mid, topic: String(tag.topic), tries: 0, right: 0, qs: 0, last: 0, open: 0 };
      a.tries += x.n; a.right += x.r; a.qs++; a.last += x.lr ? 1 : 0; if (open) a.open++;
    });
    Object.keys(snap.topics).forEach(function (k) {
      var a = snap.topics[k];
      // accuracy blends every try (right / tries) with the latest answer to each question (right last time / questions)
      a.acc = (a.right / a.tries + a.last / a.qs) / 2;
      a.status = a.open > 0 || (a.tries >= WEAK_MIN && a.acc < WEAK_ACC) ? 'weak' : a.tries >= STRONG_MIN && a.acc >= STRONG_ACC ? 'strong' : 'mid';
    });
    // review cards
    var srs = st.srs || {};
    var live = function (id) { return String(id).split(':')[0] === 'rc' && !ready ? true : !!ST.reviewItem(id); };
    Object.keys(srs).forEach(function (id) {
      var c = srs[id]; if (!c || c.off || !live(id)) return;
      var mid = String(id).split(':')[1], b = snap.cards[mid] = snap.cards[mid] || { active: 0, reviewed: 0, due: 0, fresh: 0, long: 0 };
      snap.active++; b.active++;
      if (!c.reps) { snap.fresh++; b.fresh++; return; }
      b.reviewed++;
      if (c.due <= t) { snap.due++; b.due++; }
      if (c.s >= RET_DAYS) { snap.long++; b.long++; }
    });
    snap.today = snap.due + Math.min(snap.fresh, newQuota());
    snap.ret = ST.retention();
    // calibration: the latest rated answer to each question
    var cal = { n: 0, g: { 1: { n: 0, r: 0 }, 2: { n: 0, r: 0 }, 3: { n: 0, r: 0 } } };
    Object.keys(qa).forEach(function (qid) { var x = qa[qid]; if (x && x.n > 0 && x.su > 0 && cal.g[x.su] && ST.question(qid)) { cal.n++; cal.g[x.su].n++; if (x.lr) cal.g[x.su].r++; } });
    snap.cal = cal;
    // stages per module
    (D.modules || []).forEach(function (m) { snap.mods[m.id] = moduleInfo(m, snap); });
    // the current module: the one opened last, else the first unfinished one in course order
    var last = st.last && app.modById[st.last] ? app.modById[st.last] : null;
    snap.cur = last || (D.modules || []).filter(function (m) { return !snap.mods[m.id].pathDone; })[0] || (D.modules || [])[D.modules.length - 1] || null;
    snap.curIsLast = !!last;
    snap.weak = weakList(snap);
    return snap;
  }

  // the five stages of one module; each { status: done|todo|na|soon, line (HTML), todo: [actions] }
  function moduleInfo(m, snap) {
    var app = A(), st = S(), md = ST.modData(m.id), mid = m.id, lbl = modLabel(m);
    var s = [];
    var tag = function (list) { list.forEach(function (a) { a.no = app.modNo(m); }); return list; };
    // 1 Heard (Sravana): every lesson card ticked and the best pick (or a Recommended video) finished, or the module marked complete
    var cards = app.readCards(m), read = app.readDone(m), mp = app.mainPicks(m), needWatch = !!mp.main;
    var watched = needWatch && mp.list.some(function (r) { return st.watched[r.id] && (r === mp.main || (mp.curated.indexOf(r.id) >= 0 && VIDEO_TYPES[r.type])); });
    var marked = !!(st.modules[mid] && st.modules[mid].done);
    var s1 = { todo: [] };
    s1.status = marked || (read >= cards.length && (!needWatch || watched)) ? 'done' : 'todo';
    if (s1.status === 'todo') {
      if (read < cards.length) s1.todo.push({ id: 'read', href: '#m-' + mid + '~overview', title: 'Read the lesson cards of ' + lbl, short: 'Read the lesson cards',
        reason: (read ? esc(read + ' of ' + cards.length) + ' cards ticked so far.' : 'None of its ' + cards.length + ' cards is ticked yet.') + ' Read each one and press Got it: taking in the teaching fully is the first stage, ' + sansName('sravana') + '.',
        method: sansName('sravana') + ' · chunking' });
      if (needWatch && !watched) s1.todo.push({ id: 'watch', href: '#m-' + mid + '~watch', title: 'Watch the best pick for ' + lbl, short: 'Watch the best pick',
        reason: 'Finish the best-pick video (or one marked Recommended) and tick it.' + (md && Array.isArray(md.sravana) && md.sravana.length ? ' Listen for the cues on the Watch tab.' : ''), method: sansName('sravana') + ' · dual coding' });
    }
    s1.line = marked && read < cards.length ? 'Done: you marked the module complete.' : s1.status === 'done' ? 'Done: lesson cards read' + (needWatch ? ' and the main lesson watched.' : '.') :
      esc(read + ' of ' + cards.length) + ' lesson cards read' + (needWatch ? (watched ? '; main lesson watched.' : '; main lesson not watched yet.') : '.');
    s.push(s1);
    // 2 Reflected (Manana): Feynman check with all but one key idea covered, or at least 3 Manana answers written
    var r = (st.refl || {})[mid] || {};
    var ki = md && md.feynman && Array.isArray(md.feynman.keyIdeas) ? md.feynman.keyIdeas.length : 0;
    var socN = md && Array.isArray(md.socratic) ? md.socratic.filter(function (x) { return x && x.q; }).length : 0;
    var written = (Array.isArray(r.soc) ? r.soc : []).filter(function (x) { return typeof x === 'string' && x.trim(); }).length;
    var needIdeas = ki ? Math.max(1, ki - 1) : 0, ideas = Number(r.ideas) || 0;
    var s2 = { todo: [] };
    var can2 = ki > 0 || socN >= 3;
    s2.status = (ki > 0 && ideas >= needIdeas) || written >= 3 ? 'done' : can2 ? 'todo' : 'soon';
    if (s2.status === 'todo') s2.todo.push({ id: 'reflect', href: '#m-' + mid + '~reflect', title: 'Explain ' + lbl + ' in your own words', short: 'Reflect on it',
      reason: (ki ? (ideas ? 'The Feynman check found ' + esc(ideas + ' of ' + ki) + ' key ideas; cover at least ' + needIdeas + '.' : 'Explain it simply and press Check: cover at least ' + needIdeas + ' of its ' + ki + ' key ideas.') : '') +
        (socN >= 3 ? (ki ? ' Or a' : 'A') + 'nswer 3 of the ' + sansName('manana') + ' questions' + (written ? ' (' + written + ' written)' : '') + '.' : ''),
      method: sansName('manana') + ' · Feynman Technique' });
    s2.line = s2.status === 'done' ? 'Done: ' + (ki > 0 && ideas >= needIdeas ? esc(ideas + ' of ' + ki) + ' key ideas in your explanation.' : written + ' ' + sansName('manana') + ' answers written.') :
      s2.status === 'soon' ? 'The Reflect tools for this module are coming soon.' :
      (ki ? esc(ideas + ' of ' + ki) + ' key ideas covered (' + needIdeas + ' needed)' : '') + (ki && socN >= 3 ? ', or ' : '') + (socN >= 3 ? written + ' of 3 ' + sansName('manana') + ' answers' : '') + '.';
    s.push(s2);
    // 3 Practised (Abhyasa): every non-optional exercise solved and every lab task done
    var ex = app.exOf(mid).filter(function (e) { return !e.optional; }), exDone = ex.filter(function (e) { return st.ex[e.id] && st.ex[e.id].done; }).length;
    var lab = app.labOf(m), tasks = lab && Array.isArray(lab.tasks) ? lab.tasks : [];
    var labDone = tasks.filter(function (x) { return st.labs[lab.id] && st.labs[lab.id][x.id]; }).length;
    var s3 = { todo: [] };
    s3.status = !ex.length && !tasks.length ? 'na' : exDone >= ex.length && labDone >= tasks.length ? 'done' : 'todo';
    if (ex.length && exDone < ex.length) s3.todo.push({ id: 'practice', href: '#m-' + mid + '~practice', title: 'Solve the exercises of ' + lbl, short: 'Solve the exercises',
      reason: esc(exDone + ' of ' + ex.length) + ' exercises solved. Write the code, press Check and fix what the feedback shows.', method: sansName('abhyasa') + ' · deliberate practice' });
    if (tasks.length && labDone < tasks.length) s3.todo.push({ id: 'lab', href: '#m-' + mid + '~lab', title: 'Finish the lab of ' + lbl, short: 'Finish the lab',
      reason: esc(labDone + ' of ' + tasks.length) + ' lab tasks done. Before each step, say what you expect to happen.', method: sansName('abhyasa') + ' · progressive difficulty' });
    s3.line = s3.status === 'na' ? 'This module has no exercises or lab to do.' :
      [ex.length ? esc(exDone + ' of ' + ex.length) + ' exercises solved' : '', tasks.length ? esc(labDone + ' of ' + tasks.length) + ' lab tasks done' : ''].filter(Boolean).join('; ') + '.';
    s.push(s3);
    // 4 Tested: module quiz best of 70% or more and no open mistakes from this module
    var nq = (D.quizzes[mid] || []).length, q = st.quiz[mid], best = q ? q.best : 0, open = snap.mistakesBy[mid] || 0;
    var s4 = { todo: [] };
    s4.status = !nq && !open ? 'na' : (!nq || best >= PASS) && !open ? 'done' : 'todo';
    if (nq && best < PASS) s4.todo.push({ id: 'quiz', href: '#m-' + mid + '~quiz', title: (q && q.attempts ? 'Retake the quiz of ' : 'Take the quiz of ') + lbl, short: q && q.attempts ? 'Retake the quiz' : 'Take the quiz',
      reason: (q && q.attempts ? 'Your best score is ' + esc(best) + '%.' : 'Not tried yet.') + ' ' + PASS + '% passes; every explanation teaches something.', method: 'Practice testing' });
    if (open) s4.todo.push({ id: 'mistakes', href: '#mistakes', title: 'Re-test your mistakes in ' + lbl, short: 'Re-test your mistakes',
      reason: esc(plural(open, 'open mistake')) + ' from this module. A mistake is fixed when you answer it right on two different days.', method: 'Error-based learning' });
    s4.line = s4.status === 'na' ? 'This module has no quiz.' :
      (nq ? (q && q.attempts ? 'Best quiz score ' + esc(best) + '% (' + PASS + '% passes)' : 'Quiz not tried yet') : 'No quiz') + (open ? '; ' + esc(plural(open, 'open mistake')) + '.' : s4.status === 'done' ? '; no open mistakes.' : '.');
    s.push(s4);
    // 5 Retained (Smarana): 5+ reviewed cards, predicted recall 80%+ and one card held for 21+ days
    var ret = ST.retention(mid), b = snap.cards[mid] || { active: 0, reviewed: 0, due: 0, fresh: 0, long: 0 };
    var possible = ST.moduleReviewIds(m).filter(function (id) { return !!ST.reviewItem(id); }).length, needCards = Math.min(RET_CARDS, possible);
    var s5 = { todo: [] };
    s5.status = !possible && !ret.n ? 'na' : ret.n >= Math.max(1, needCards) && ret.avg != null && ret.avg >= RET_AVG && b.long >= 1 ? 'done' : 'todo';
    if (s5.status === 'todo') {
      if (b.due || b.fresh) s5.todo.push({ id: 'review', href: '#review', title: 'Review the cards of ' + lbl, short: 'Review its cards',
        reason: esc(plural(b.due + b.fresh, 'card')) + ' from this module ' + (b.due + b.fresh === 1 ? 'is' : 'are') + ' waiting in Daily review.', method: sansName('smarana') + ' · spaced repetition' });
      else if (b.active < needCards) s5.todo.push({ id: 'review', href: '#review', title: 'Add the cards of ' + lbl + ' to Daily review', short: 'Add its cards to Daily review',
        reason: 'Only ' + b.active + ' of its ' + possible + ' cards are in your review. Use “Add a module to my review” on the Daily review page.', method: sansName('smarana') + ' · spaced repetition' });
    }
    var nextDue = '';
    if (s5.status === 'todo' && !s5.todo.length) {
      Object.keys(S().srs || {}).forEach(function (id) { var c = S().srs[id]; if (c && !c.off && c.reps && id.split(':')[1] === mid && (!nextDue || c.due < nextDue)) nextDue = c.due; });
    }
    s5.line = s5.status === 'na' ? 'This module has no review cards.' : s5.status === 'done' ? 'Done: ' + esc(plural(ret.n, 'card')) + ' reviewed, predicted recall ' + pc(ret.avg) + ', ' + esc(plural(b.long, 'card')) + ' held for ' + RET_DAYS + ' days or more.' :
      (ret.n ? esc(plural(ret.n, 'card')) + ' reviewed (' + needCards + ' needed), predicted recall ' + pc(ret.avg) + ' (' + pc(RET_AVG) + ' needed), ' + esc(plural(b.long, 'card')) + ' held for ' + RET_DAYS + '+ days (1 needed).' :
        'No cards from this module reviewed yet (' + needCards + ' needed).') + (nextDue ? ' Memory grows with time: next review ' + esc(fmtDay(nextDue)) + '.' : '');
    s.push(s5);
    // highest continuous stage; a stage that is not needed, or not available yet, does not hold the learner back
    s.forEach(function (x) { tag(x.todo); });
    var cont = 0;
    for (var i = 0; i < s.length; i++) { if (s[i].status === 'todo') break; cont = i + 1; }
    var pathDone = s.slice(0, 4).every(function (x) { return x.status !== 'todo'; });
    var path = [];
    s.slice(0, 4).forEach(function (x) { path = path.concat(x.todo); });
    return { m: m, stages: s, cont: cont, pathDone: pathDone, path: path, recall: s5.todo, md: md };
  }

  /* ---------- weak spots (knowledge gap detection) ---------- */
  function weakList(snap) {
    var app = A();
    return Object.keys(snap.topics).map(function (k) { return snap.topics[k]; })
      .filter(function (a) { return a.status === 'weak' && app.modById[a.mid]; })
      .sort(function (a, b) { return a.acc - b.acc || b.open - a.open || b.tries - a.tries || app.modById[a.mid]._i - app.modById[b.mid]._i || a.topic.localeCompare(b.topic); });
  }
  function topicNumbers(a) {
    return 'right on ' + a.right + ' of ' + a.tries + ' tries; latest answer right on ' + a.last + ' of ' + plural(a.qs, 'question') + (a.open ? '; ' + plural(a.open, 'open mistake') : '');
  }
  // what to do for a weak topic: links that exist for this learner and module, best first
  function weakLinks(a, mixedOk) {
    var m = A().modById[a.mid], md = ST.modData(a.mid), out = [];
    if (mixedOk) out.push({ href: '#mixed', label: 'Mixed practice' });
    if (md && ((md.feynman && (md.feynman.keyIdeas || []).length) || (md.socratic || []).length)) out.push({ href: '#m-' + m.id + '~reflect', label: 'Reflect tab of ' + A().modNo(m) });
    if ((D.quizzes[m.id] || []).length) out.push({ href: '#m-' + m.id + '~quiz', label: 'Quiz of ' + A().modNo(m) });
    if (a.open) out.push({ href: '#mistakes', label: 'Mistakes notebook' });
    return out;
  }

  /* ---------- next best steps: a small rule engine (adaptive learning path) ---------- */
  function reviewAction(snap) {
    var n = snap.today;
    return { id: 'review', href: '#review', title: 'Daily review: ' + plural(n, 'card'),
      reason: (snap.due ? plural(snap.due, 'card') + ' ' + (snap.due === 1 ? 'is' : 'are') + ' due again' : 'No cards are due again') + (snap.today - snap.due ? ' and ' + (snap.today - snap.due) + ' new ' + (snap.today - snap.due === 1 ? 'one is' : 'ones are') + ' ready' : '') +
        ' today. Recalling them just before you would forget makes them last.', method: sansName('smarana') + ' · adaptive spaced repetition' };
  }
  function mistakesAction(snap) {
    return { id: 'mistakes', href: '#mistakes', title: 'Re-test your mistakes', reason: plural(snap.openAll, 'question') + ' you got wrong ' + (snap.openAll === 1 ? 'is' : 'are') + ' not fixed yet. Answer each right on two different days to fix it.', method: 'Error-based learning and feedback' };
  }
  // after a module is done (stages 1 to 4): the next unfinished module in its level, else the level test, a project, the next level
  function forward(snap, m) {
    var app = A(), lv = m.level, ms = app.modulesOf(lv), i = ms.indexOf(m);
    var order = ms.slice(i + 1).concat(ms.slice(0, i));
    var next = order.filter(function (x) { return !snap.mods[x.id].pathDone; })[0];
    if (next) return { id: 'next', href: '#m-' + next.id + '~overview', title: 'Start ' + modLabel(next), reason: 'Stages 1 to 4 of ' + esc(modLabel(m)) + ' are done. Next in Level ' + lv + ': read its lesson cards.', method: 'Progressive skill mastery' };
    var tk = 'test-l' + lv, tq = (D.quizzes[tk] || []).length, tb = S().quiz[tk];
    if (tq && !(tb && tb.best >= PASS)) return { id: 'test', href: '#' + tk, title: 'Take the Level ' + lv + ' test', reason: 'Every Level ' + lv + ' module has reached the Tested stage. Pass the level test with ' + PASS + '%' + (tb && tb.attempts ? ' (your best is ' + esc(tb.best) + '%)' : '') + '.', method: 'Practice testing · interleaved practice' };
    var projs = (D.projects || []).filter(function (p) { return p.level === lv; });
    if (projs.length && !projs.some(function (p) { return S().projects[p.id] && S().projects[p.id].done; })) {
      var p = projs[0];
      return { id: 'project', href: '#' + p.id, title: 'Build a Level ' + lv + ' project: ' + p.title, reason: 'A level is complete when its modules are done, you pass the level test and you finish one project.', method: 'Project-based learning' };
    }
    var later = (D.modules || []).filter(function (x) { return x.level > lv && !snap.mods[x.id].pathDone; })[0] || (D.modules || []).filter(function (x) { return !snap.mods[x.id].pathDone; })[0];
    if (later) return { id: 'next', href: '#m-' + later.id + '~overview', title: 'Start ' + modLabel(later), reason: (later.level > lv ? 'Level ' + lv + ' is complete. ' : '') + 'This is the next module you have not finished.', method: 'Progressive skill mastery' };
    return { id: 'done', href: '#projects', title: 'Build another project', reason: 'Every module has reached the Tested stage. Keep your memory fresh with Daily review and stretch yourself with a tougher project.', method: 'Project-based learning' };
  }
  function nextSteps(snap, max) {
    max = max || 3;
    var out = [], seen = {}, cur = snap.cur, info = cur ? snap.mods[cur.id] : null;
    var add = function (a) { if (!a || seen[a.href] || out.length >= max) return; seen[a.href] = 1; out.push(a); };
    var fresh = !snap.progress;
    // 0. a first visit: how the site works
    if (fresh) add({ id: 'start', href: '#start', title: 'Read Start here', reason: 'New here? It explains how the course works, the free tools you need and how to study well. About 30 minutes.', method: 'Progressive difficulty and scaffolding' });
    // 1. a big pile of reviews waits
    if (snap.today >= MANY_DUE) add(reviewAction(snap));
    // 2. open mistakes in the current module
    if (cur && snap.mistakesBy[cur.id]) {
      var nm = snap.mistakesBy[cur.id];
      add({ id: 'mistakes', href: '#mistakes', title: 'Re-test your mistakes in ' + modLabel(cur), short: 'Re-test your mistakes', no: A().modNo(cur), reason: plural(nm, 'question') + ' from this module ' + (nm === 1 ? 'is' : 'are') + ' still wrong. Answer each right on two different days to fix it.', method: 'Error-based learning · personalized deliberate practice' });
    }
    // 3. the current module's first missing stage, or where to go once it is done
    if (info) add(info.path.length ? info.path[0] : forward(snap, cur));
    // 4. the weakest topic
    var w = snap.weak[0];
    if (w) {
      var wm = A().modById[w.mid], links = weakLinks(w, startedCount() >= MIN_MIXED).filter(function (l) { return !seen[l.href]; })[0];
      if (links) add({ id: 'weak', href: links.href, title: (links.href === '#mixed' ? 'Mixed practice on your weak spot: ' : links.href === '#mistakes' ? 'Fix your weak spot: ' : 'Work on your weak spot: ') + w.topic,
        reason: 'In ' + esc(modLabel(wm)) + ' you were ' + esc(topicNumbers(w)) + '. ' + (links.href === '#mixed' ? 'Mixed practice picks more questions from weak topics.' : links.href.indexOf('~reflect') > 0 ? 'Explaining it in your own words shows what is missing.' : 'Answering again, then reading each explanation, closes the gap.'),
        method: 'Knowledge gap detection · personalized deliberate practice' });
    }
    // 5. a few reviews wait
    if (snap.today > 0) add(reviewAction(snap));
    // 6. open mistakes elsewhere
    if (snap.openAll > 0) add(mistakesAction(snap));
    // 7. the rest of the current module, in stage order, then its review cards
    if (info) { info.path.slice(1).forEach(add); info.recall.forEach(add); }
    // 8. a quiet close: a journal entry or a focus session
    if (snap.progress) {
      var jr = S().jr || {}, t = snap.t;
      var wroteToday = Object.keys(jr).some(function (k) { return jr[k] && !jr[k].del && localDay(jr[k].at) === t; });
      if (!wroteToday) add({ id: 'journal', href: '#journal', title: 'Write a short journal entry', reason: 'Three honest lines: what you learnt, what still confuses you and what you will do next.', method: sansName('svadhyaya') + ' · metacognitive learning' });
      add({ id: 'focus', href: '#focus', title: 'Start a focus session', reason: 'Pick one task from this list and give it 25 minutes of full attention.', method: sansName('dharana') + ' · deep work' });
    }
    return out;
  }

  /* ---------- HTML pieces ---------- */
  function stepsHTML(list, compact) {
    if (!list.length) return '<p class="small muted">Nothing to suggest right now.</p>';
    return '<ol class="mt-steps' + (compact ? ' mt-steps-sm' : '') + '" role="list">' + list.map(function (a, i) {
      var title = compact && a.short && a.no ? a.short + ' (Module ' + a.no + ')' : a.title;
      return '<li class="mt-step" data-step="' + esc(a.id) + '"><span class="mt-step-n num" aria-hidden="true">' + (i + 1) + '</span><div class="mt-step-b">' +
        '<a class="mt-step-a" href="' + esc(a.href) + '">' + esc(title) + '</a>' +
        '<p class="small mt-step-why">' + a.reason + '</p>' + (!compact && a.method ? '<p class="small muted mt-step-m">' + a.method + '</p>' : '') + '</div></li>';
    }).join('') + '</ol>';
  }
  function dotsHTML(info) {
    return '<ol class="mt-dots" role="list" aria-label="Stages for Module ' + esc(A().modNo(info.m)) + '">' + info.stages.map(function (x, i) {
      var s = STAGES[i];
      return '<li class="mt-dot is-' + x.status + '">' + glyphHTML(x.status) + '<span class="mt-dot-t">' + esc(s.label) + '</span><span class="visually-hidden">: ' + esc(STATUS_TEXT[x.status]) + '</span></li>';
    }).join('') + '</ol>';
  }
  function contText(info) { return info.cont ? 'Stage ' + info.cont + ' of 5: ' + STAGES[info.cont - 1].label : 'Not started'; }
  function topicsLine(snap, m) {
    var md = ST.modData(m.id), list = md && Array.isArray(md.topics) ? md.topics.slice() : [];
    Object.keys(snap.topics).forEach(function (k) { var a = snap.topics[k]; if (a.mid === m.id && list.indexOf(a.topic) < 0) list.push(a.topic); });
    if (!list.length) return snap.ready ? '<p class="small muted">Topic tags for this module are coming soon.</p>' : '';
    var word = { weak: 'weak', strong: 'strong', mid: 'getting there', none: 'not tried yet' };
    return '<div class="stack-sm"><p class="small"><strong>Topics</strong></p><ul class="mt-topics" role="list">' + list.map(function (tp) {
      var a = snap.topics[m.id + '|' + tp], st = a ? a.status : 'none';
      return '<li class="mt-topic is-' + st + '"><span class="mt-topic-n">' + esc(tp) + '</span> <span class="mt-topic-s">' + (st === 'weak' ? '<span aria-hidden="true">! </span>' : st === 'strong' ? '<span aria-hidden="true">✓ </span>' : '') + esc(word[st]) + (a ? ' · ' + pc(a.acc) : '') + '</span></li>';
    }).join('') + '</ul></div>';
  }
  function moduleRowHTML(snap, m) {
    var info = snap.mods[m.id], app = A();
    var cur = snap.cur === m;
    return '<li class="mt-mod' + (cur ? ' is-cur' : '') + '" id="mt-mod-' + esc(m.id) + '" data-mid="' + esc(m.id) + '">' +
      '<div class="mt-mod-head"><h4 class="mt-mod-h"><a href="#m-' + esc(m.id) + '"><span class="num mt-mod-no">' + esc(app.modNo(m)) + '</span> ' + esc(m.title) + '</a></h4>' +
      '<span class="small mt-mod-cont" data-cont="' + info.cont + '">' + esc(contText(info)) + (cur ? ' <span class="chip chip-en-in">' + (snap.curIsLast ? 'Opened last' : 'Up next') + '</span>' : '') + '</span></div>' +
      dotsHTML(info) +
      '<details class="mt-more"><summary>What each stage needs<span class="visually-hidden"> in Module ' + esc(app.modNo(m)) + '</span></summary><div class="stack-sm mt-more-b">' +
      '<ol class="mt-detail" role="list">' + info.stages.map(function (x, i) {
        var s = STAGES[i];
        return '<li class="is-' + x.status + '"><span class="mt-detail-k">' + s.n + ' ' + stageName(s) + '<span class="visually-hidden">, ' + esc(STATUS_TEXT[x.status]) + '</span></span> <span class="small">' + x.line + '</span>' +
          (x.todo.length ? ' <span class="mt-detail-go">' + x.todo.map(function (a) { return '<a class="small" href="' + esc(a.href) + '">' + esc(a.short) + '</a>'; }).join(' · ') + '</span>' : '') + '</li>';
      }).join('') + '</ol>' + topicsLine(snap, m) + '</div></details></li>';
  }
  function levelFilter() { var v = prefs().mtLv; return v === 'all' || (A().levelById[Number(v)] && Number(v)) ? (v === 'all' ? 'all' : Number(v)) : null; }
  function shownLevel(snap) { var f = levelFilter(); return f || (snap.cur ? snap.cur.level : 'all'); }
  function modsInner(snap) {
    var app = A(), show = shownLevel(snap);
    var lvs = (D.levels || []).filter(function (l) { return show === 'all' || l.id === show; });
    return lvs.map(function (l) {
      var ms = app.modulesOf(l.id), tested = ms.filter(function (m) { return snap.mods[m.id].stages[3].status === 'done'; }).length;
      return '<section class="stack-sm mt-level" aria-labelledby="mt-lv-' + l.id + '"><div class="row-between"><h3 id="mt-lv-' + l.id + '">Level ' + l.id + ' · ' + esc(l.name) + '</h3>' +
        '<span class="small muted num">' + tested + ' of ' + plural(ms.length, 'module') + ' tested</span></div>' +
        '<ol class="mt-mods" role="list">' + ms.map(function (m) { return moduleRowHTML(snap, m); }).join('') + '</ol></section>';
    }).join('');
  }
  function modsHTML(snap) {
    var show = shownLevel(snap);
    var btn = function (v, label) { return '<button type="button" data-mt-lv="' + v + '" aria-pressed="' + (String(show) === String(v)) + '">' + label + '</button>'; };
    return '<section class="stack mt-map" id="mt-map" aria-labelledby="mt-map-h"><div class="stack-sm"><h2 class="h-sub" id="mt-map-h">Your modules</h2>' +
      '<p class="small muted mt-legend">Each module shows its five stages: <span class="mt-key is-done">' + glyphHTML('done') + 'done</span> <span class="mt-key is-todo">' + glyphHTML('todo') + 'not yet</span> <span class="mt-key is-na">' + glyphHTML('na') + 'not needed</span> <span class="mt-key is-soon">' + glyphHTML('soon') + 'coming soon</span>. Open “What each stage needs” for the exact links.</p>' +
      '<div class="seg mt-seg" role="group" aria-label="Which level to show">' + (D.levels || []).map(function (l) { return btn(l.id, 'Level ' + l.id); }).join('') + btn('all', 'All levels') + '</div></div>' +
      '<div id="mt-mods" class="stack-lg">' + modsInner(snap) + '</div></section>';
  }
  function ladderHTML() {
    var rows = [
      'Every lesson card ticked with Got it, and the best pick (or a video marked Recommended) finished. Marking the module complete also counts.',
      'Your explanation in the Feynman box covers all the key ideas but one, or you have written answers to at least 3 of the module’s ' + sansName('manana') + ' questions.',
      'Every exercise solved (optional ones aside) and every lab task done. Modules without them skip this.',
      'A best quiz score of ' + PASS + '% or more, and no open mistakes from the module’s questions.',
      'At least ' + RET_CARDS + ' of the module’s review cards reviewed, a predicted recall of ' + pc(RET_AVG) + ' or more, and at least one card you have held for ' + RET_DAYS + ' days. This one takes weeks.'
    ];
    return '<section class="card stack-sm mt-ladder" id="mt-ladder" aria-labelledby="mt-ladder-h"><h2 class="h-sub" id="mt-ladder-h">The five stages</h2>' +
      '<p class="small"><a href="#methods~38">Progressive skill mastery</a>: a module moves from first hearing to lasting memory. Each stage is checked on its own, so you can reach stage 3 before stage 2; “Stage 2 of 5” means stages 1 and 2 are both done.</p>' +
      '<ol class="mt-ladder-l">' + STAGES.map(function (s, i) { return '<li><strong>' + esc(s.label) + '</strong>' + (s.sa ? ' · ' + sansName(s.sa) : '') + ': ' + rows[i] + '</li>'; }).join('') + '</ol>' +
      '<p class="small muted">The names come from the Vedic way of learning: ' + ST.sans('sravana') + ', ' + ST.sans('manana') + ', ' + ST.sans('abhyasa') + ' and ' + ST.sans('smarana') + '. ' + HOW + '</p></section>';
  }
  function weakHTML(snap) {
    var mixedOk = startedCount() >= MIN_MIXED, list = snap.weak.slice(0, SHOW_WEAK);
    var strong = Object.keys(snap.topics).filter(function (k) { return snap.topics[k].status === 'strong'; }).length;
    var tried = Object.keys(snap.topics).length;
    var body;
    if (!list.length) body = '<p>' + (tried ? 'No weak topics right now' + (strong ? ': ' + plural(strong, 'topic is', 'topics are') + ' strong.' : '.') + ' Keep answering quiz questions so this stays true.' : 'Answer a module quiz first. Your answers show which topics you know well and which need more work.') + '</p>';
    else body = '<ol class="mt-weak" role="list">' + list.map(function (a) {
      var m = A().modById[a.mid];
      return '<li class="mt-weak-i stack-sm" data-topic="' + esc(a.mid + '|' + a.topic) + '"><div class="row-between"><strong>' + esc(a.topic) + '</strong><span class="chip chip-bad num">' + pc(a.acc) + '<span class="visually-hidden"> accuracy</span></span></div>' +
        '<p class="small muted">' + esc(modLabel(m)) + ': ' + esc(topicNumbers(a)) + '.</p>' +
        '<p class="small mt-weak-do">What to do: ' + weakLinks(a, mixedOk).map(function (l) { return '<a href="' + esc(l.href) + '">' + esc(l.label) + '</a>'; }).join(' · ') + '</p></li>';
    }).join('') + '</ol>' + (snap.weak.length > SHOW_WEAK ? '<p class="small muted">And ' + plural(snap.weak.length - SHOW_WEAK, 'more weak topic') + ' in the modules below.</p>' : '');
    return '<section class="card stack-sm mt-weakbox" id="mt-weakbox" aria-labelledby="mt-weak-h"><h2 class="h-sub" id="mt-weak-h">Weak spots</h2>' +
      '<p class="small muted"><a href="#methods~33">Knowledge gap detection</a>, from your own quiz answers. A topic is weak when you got less than ' + pc(WEAK_ACC) + ' right (at least ' + WEAK_MIN + ' answers) or it has an open mistake; strong at ' + pc(STRONG_ACC) + ' or more (at least ' + STRONG_MIN + ' answers). Accuracy averages your right tries with how many questions you got right the last time.</p>' +
      body + (list.length && !mixedOk ? '<p class="small muted">Mixed practice opens once you have started two modules.</p>' : '') + '</section>';
  }
  function calHTML(snap) {
    var c = snap.cal, body;
    var SURE = { 3: 'Certain', 2: 'Fairly sure', 1: 'Guessing' };
    if (c.n < CAL_MIN) body = '<p class="small">When you rate how sure you are in <a href="#mixed">Mixed practice</a> or a <a href="#mistakes">mistakes re-test</a>, this shows whether your sureness matches your results. It appears after ' + CAL_MIN + ' rated answers; you have ' + c.n + ' so far.</p>';
    else {
      var acc = function (k) { return c.g[k].n ? c.g[k].r / c.g[k].n : null; };
      var used = [1, 2, 3].filter(function (k) { return c.g[k].n; });
      var wrongSure = c.g[3].n - c.g[3].r, meaning;
      if (wrongSure > 0 && acc(3) < 0.75) meaning = 'You felt Certain on ' + plural(wrongSure, 'answer') + ' that ' + (wrongSure === 1 ? 'was' : 'were') + ' wrong. Feeling sure and being wrong points to a wrong idea that feels right, so read those explanations slowly.';
      else if (used.length < 2) meaning = 'You used only one level of sureness, so there is nothing to compare yet. Rate each answer honestly.';
      else if (used.map(acc).every(function (x, i, arr) { return !i || x >= arr[i - 1]; })) meaning = 'You were right more often when you felt surer: your sense of what you know is working. Spend revision time where you felt unsure.';
      else meaning = 'Your sureness does not match your results yet. Keep rating each answer; with practice you learn to tell what you know from what you half know.';
      body = '<ul class="mt-cal" role="list">' + [3, 2, 1].map(function (k) {
        var g = c.g[k];
        return '<li><span class="mt-cal-k">' + SURE[k] + '</span><span class="num mt-cal-v">' + (g.n ? 'right ' + g.r + ' of ' + g.n + ' (' + pc(g.r / g.n) + ')' : 'not used') + '</span></li>';
      }).join('') + '</ul><p class="small">' + esc(meaning) + '</p><p class="small muted">From the last rated answer to each of ' + plural(c.n, 'question') + '.</p>';
    }
    return '<section class="card stack-sm mt-calbox" id="mt-cal" aria-labelledby="mt-cal-h"><h2 class="h-sub" id="mt-cal-h">How sure you were</h2><p class="small muted"><a href="#methods~12">Metacognitive learning</a>: knowing what you know.</p>' + body + '</section>';
  }
  function retHTML(snap) {
    var r = snap.ret, body;
    if (r.n < RET_SHOW) body = '<p class="small">Predicted recall appears after you have reviewed ' + RET_SHOW + ' cards in <a href="#review">Daily review</a>. You have reviewed ' + r.n + ' so far.</p>';
    else body = '<div class="lab-stats"><div class="stat"><div class="k">Predicted recall</div><div class="v" id="mt-ret-v">' + pc(r.avg) + '</div></div><div class="stat"><div class="k">Cards reviewed</div><div class="v">' + r.n + '</div></div><div class="stat"><div class="k">Held ' + RET_DAYS + '+ days</div><div class="v">' + snap.long + '</div></div></div>' +
      '<p class="small">The chance you would remember a card if asked today, averaged over the cards you have reviewed. It falls a little each day and rises when you review.</p>';
    return '<section class="card stack-sm mt-retbox" id="mt-ret" aria-labelledby="mt-ret-h"><h2 class="h-sub" id="mt-ret-h">Memory</h2><p class="small muted"><a href="#methods~40">Long-term retention tracking</a> with ' + sansName('smarana') + '.</p>' + body +
      '<div class="row"><a class="btn btn-sm" href="#review">' + (snap.today ? 'Daily review: ' + plural(snap.today, 'card') + ' today' : 'Open daily review') + '</a></div></section>';
  }
  function countStage(snap, i) { return (D.modules || []).filter(function (m) { return snap.mods[m.id].stages[i].status === 'done'; }).length; }
  function summaryHTML(snap) {
    var n = (D.modules || []).length, stat = function (k, v, id) { return '<div class="stat"><div class="k">' + k + '</div><div class="v num"' + (id ? ' id="' + id + '"' : '') + '>' + esc(v) + '</div></div>'; };
    return '<div class="lab-stats mt-sum">' + stat('Modules tested', countStage(snap, 3) + ' of ' + n, 'mt-sum-tested') + stat('Modules retained', countStage(snap, 4) + ' of ' + n, 'mt-sum-retained') +
      stat('Weak topics', snap.weak.length, 'mt-sum-weak') + stat('Predicted recall', snap.ret.n >= RET_SHOW ? pc(snap.ret.avg) : 'Not yet', 'mt-sum-recall') + '</div>';
  }

  /* ---------- the Knowledge map page (#mastery) ---------- */
  var page = null;
  function viewMap() {
    var app = A();
    if (!app) { setTimeout(function () { if (A() && hashIs('mastery')) viewMap(); }, 0); return; }
    var token = {};
    app.setView('<div class="wrap stack-lg mt-page">' + app.crumbs([['Home', 'home'], ['Study room', 'study'], ['Knowledge map']]) +
      '<header class="stack-sm"><h1>Knowledge map</h1>' +
      '<p class="lede prose">Where each module stands, from first hearing to lasting memory, which topics need more work, and the best next steps for you.</p>' +
      '<p class="small muted prose">Methods used here: progressive skill mastery, knowledge gap detection, adaptive learning paths, personalized deliberate practice, metacognitive learning and long-term retention tracking, with ' +
      sansName('sravana') + ', ' + sansName('manana') + ', ' + sansName('abhyasa') + ' and ' + sansName('smarana') + ' as its stages. ' + HOW + '</p></header>' +
      '<div id="mt-main" class="stack-lg"><p class="muted">Loading your knowledge map…</p></div>' +
      '<p class="visually-hidden" id="mt-live" aria-live="polite"></p></div>', 'Knowledge map');
    page = { token: token, fail: '' };
    var root = $('mt-main');
    root.addEventListener('click', onMapClick);
    var onReplaced = function () { if (page && page.token === token) drawMap(); };
    window.addEventListener('aim:progress-replaced', onReplaced);
    app.onLeave(function () { window.removeEventListener('aim:progress-replaced', onReplaced); if (page && page.token === token) page = null; });
    ST.ensureData().then(function () { if (page && page.token === token) drawMap(); }, function (e) { if (page && page.token === token) { page.fail = (e && e.message) || 'Study content did not load.'; drawMap(); } });
  }
  ST.addRoute('mastery', viewMap, 'study');

  function drawMap() {
    var root = $('mt-main'); if (!root || !page) return;
    var snap = snapshot();
    root.innerHTML = (page.fail ? '<div class="callout" role="alert">' + esc(page.fail) + ' Reflect stages and topics show again when it loads.</div>' : '') +
      '<section class="card stack mt-next" id="mt-next" aria-labelledby="mt-next-h"><div class="stack-sm"><h2 class="h-sub" id="mt-next-h">Your next steps</h2>' +
      '<p class="small muted">An <a href="#methods~26">adaptive learning path</a>: worked out from what you have done, so it changes as you study. Each step says why.</p></div>' + stepsHTML(nextSteps(snap, 3)) + '</section>' +
      summaryHTML(snap) + weakHTML(snap) + ladderHTML() + modsHTML(snap) +
      '<div class="grid mt-pair">' + calHTML(snap) + retHTML(snap) + '</div>';
  }
  function onMapClick(ev) {
    var b = ev.target.closest && ev.target.closest('[data-mt-lv]'); if (!b || !page) return;
    var v = b.getAttribute('data-mt-lv');
    prefs().mtLv = v === 'all' ? 'all' : Number(v); C.save();
    var snap = snapshot(), show = shownLevel(snap);
    Array.prototype.forEach.call(document.querySelectorAll('[data-mt-lv]'), function (x) { x.setAttribute('aria-pressed', String(String(show) === x.getAttribute('data-mt-lv'))); });
    var box = $('mt-mods'); if (box) box.innerHTML = modsInner(snap);
    var n = show === 'all' ? (D.modules || []).length : A().modulesOf(show).length;
    var live = $('mt-live'); if (live) { live.textContent = ''; setTimeout(function () { if (live.isConnected) live.textContent = 'Showing ' + (show === 'all' ? 'all levels' : 'Level ' + show) + ': ' + plural(n, 'module') + '.'; }, 40); }
  }

  /* ---------- Home: the Today card (#study-today) ---------- */
  function todayHTML(snap) {
    var n = snap.today;
    return '<section class="card stack-sm mt-today" aria-labelledby="mt-today-h"><div class="row-between mt-today-top"><h2 class="h-sub" id="mt-today-h">Today</h2>' +
      '<a class="small" href="#study">Study room</a></div>' +
      stepsHTML(nextSteps(snap, 2), true) +
      '<div class="row"><a class="btn btn-sm' + (n ? ' btn-primary' : '') + '" href="#review" id="mt-today-rv">' + (n ? 'Daily review (' + n + ')' : 'Daily review: none due') + '</a>' +
      '<a class="btn btn-sm" href="#focus">Focus session</a><a class="small mt-today-map" href="#mastery">Knowledge map</a></div></section>';
  }
  function inviteHTML() {
    return '<p class="mt-invite small"><a href="#study">Open the Study room</a>: daily review, focus sessions and a knowledge map that suggests your next step.</p>';
  }
  function fillToday() {
    var el = $('study-today'); if (!el) return;
    if (!hasProgress()) { el.innerHTML = inviteHTML(); return; }
    var draw = function () { var x = $('study-today'); if (x && A()) x.innerHTML = todayHTML(snapshot()); };
    if (D.study) draw(); else ST.ensureData().then(draw, draw);
  }
  ST.on('home', function () { withApp(fillToday); });

  /* ---------- My progress: the study summary card (#study-progress) ---------- */
  function progressHTML(snap) {
    var st = S(), n = (D.modules || []).length, t = snap.t, ws = weekStart(t);
    var mins = Object.keys(st.fs || {}).reduce(function (a, k) { var x = st.fs[k], d = x && localDay(x.at); return d && d >= ws && d <= t ? a + (x.mins || 0) : a; }, 0);
    var journal = Object.keys(st.jr || {}).filter(function (k) { return st.jr[k] && !st.jr[k].del; }).length;
    var stat = function (href, k, v, id) { return '<a class="stat mt-stat" href="' + href + '" id="' + id + '"><span class="k">' + k + '</span><span class="v num">' + esc(v) + '</span></a>'; };
    return '<section class="card stack-sm mt-prog" aria-labelledby="mt-prog-h"><div class="row-between"><h2 class="h-sub" id="mt-prog-h">Study: mastery and memory</h2><a class="small" href="#mastery">Open the knowledge map</a></div>' +
      '<p class="small muted">Modules at each mastery stage, out of ' + n + '. Each stage is counted on its own.</p>' +
      '<div class="lab-stats mt-stats">' + STAGES.map(function (s, i) { return stat('#mastery', s.n + ' ' + esc(s.label) + (s.sa ? '<span class="mt-stat-sa">' + sansName(s.sa) + '</span>' : ''), countStage(snap, i) + ' of ' + n, 'mt-pg-s' + s.n); }).join('') + '</div>' +
      '<div class="lab-stats mt-stats">' + stat('#review', 'Predicted recall', snap.ret.n >= RET_SHOW ? pc(snap.ret.avg) : 'Not yet', 'mt-pg-recall') + stat('#review', 'Cards in review', snap.active, 'mt-pg-cards') +
      stat('#focus', 'Deep work this week', fmtMins(mins), 'mt-pg-fs') + stat('#journal', 'Journal entries', journal, 'mt-pg-jr') + stat('#mistakes', 'Open mistakes', snap.openAll, 'mt-pg-ms') + '</div></section>';
  }
  function fillProgress() {
    var el = $('study-progress'); if (!el) return;
    var draw = function () { var x = $('study-progress'); if (x && A()) x.innerHTML = progressHTML(snapshot()); };
    if (D.study) draw(); else ST.ensureData().then(draw, draw);
  }
  ST.on('progress', function () { withApp(fillProgress); });

  /* ---------- Study room cards ---------- */
  function planInner() {
    var snap = D.study ? snapshot() : null;
    return '<h2 class="h-sub" id="mt-hub-plan-h">Today’s plan</h2><p class="small">Adaptive learning path</p>' +
      '<div id="mt-hub-steps">' + (snap ? stepsHTML(nextSteps(snap, 3), true) : '<p class="small muted">Working out your next steps…</p>') + '</div>' +
      '<div class="row"><a class="btn btn-primary" href="#mastery">Open the knowledge map</a></div>';
  }
  function mapLine(snap) {
    var n = (D.modules || []).length, cur = snap.cur && snap.mods[snap.cur.id];
    return (cur && snap.progress ? 'Module ' + esc(A().modNo(snap.cur)) + ': ' + esc(contText(cur)) + '. ' : '') + countStage(snap, 3) + ' of ' + n + ' modules tested · ' + plural(snap.weak.length, 'weak topic');
  }
  ST.addHubCard(5, function () {
    if (!A()) return '';
    return '<article class="card mt-hub mt-hub-plan" id="mt-hub-plan" aria-labelledby="mt-hub-plan-h">' + planInner() + '</article>';
  });
  ST.addHubCard(70, function () {
    if (!A()) return '';
    return '<article class="card mt-hub" id="mt-hub-map" aria-labelledby="mt-hub-map-h"><h2 class="h-sub" id="mt-hub-map-h">Knowledge map</h2>' +
      '<p class="small">Progressive skill mastery and knowledge gap detection</p>' +
      '<p class="small muted">Five stages for every module, from ' + sansName('sravana') + ' to ' + sansName('smarana') + ', and the topics your answers show are weak.</p>' +
      '<p id="mt-hub-line">' + (D.study ? mapLine(snapshot()) : '') + '</p>' +
      '<div class="row"><a class="btn" href="#mastery">Open the knowledge map</a></div></article>';
  });
  ST.on('hub', function () {
    var up = function () {
      if (!A()) return;
      var snap = snapshot(), a = $('mt-hub-steps'), b = $('mt-hub-line');
      if (a) a.innerHTML = stepsHTML(nextSteps(snap, 3), true);
      if (b) b.innerHTML = mapLine(snap);
    };
    withApp(function () { ST.ensureData().then(up, up); });
  });

  // for tests
  ST._mastery = { snapshot: function () { return snapshot(); }, nextSteps: function (n) { return nextSteps(snapshot(), n || 3); }, startedCount: startedCount, hasProgress: hasProgress };
})();
