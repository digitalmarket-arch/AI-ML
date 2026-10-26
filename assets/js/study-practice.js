/* AI Marg study feature: Mixed practice (interleaving, confidence ratings), Mistakes notebook, AI practice tests and error analysis.
   Uses window.AIM_STUDY (assets/js/study.js) and window.AIM_APP (assets/js/app.js).
   study.js loads this file for #mixed, #mistakes and the Study room. It needs only the small study index (quiz tags and
   topics, ST.ensureData); the per-module content files are not used here. */
(function () {
  'use strict';
  var ST = window.AIM_STUDY; if (!ST) return; // study features are switched off in this browser
  var C = window.AIM_CORE, D = window.AIM || {};
  var esc = C.esc, inline = C.inline;
  var A = function () { return window.AIM_APP; };
  var S = function () { return C.state; };
  var $ = function (id) { return document.getElementById(id); };

  var SIZES = [10, 20];
  var MIN_MODULES = 2;      // mixed practice needs questions from at least this many started modules
  var MIN_CAL = 10;         // rated answers needed before calibration over time is shown
  var RETEST_MAX = 20;      // questions per mistakes re-test
  var RECENT_DAYS = 30;     // "recently" for right answers and fixed mistakes
  var AI_QS = 5;            // questions Gemini writes for a practice test
  var AI_TOKENS = 1536;     // Gemini's reply budget for them (a text reply in study.js gets 1,024)
  var SURE = { 3: 'Certain', 2: 'Fairly sure', 1: 'Guessing' };
  var HOW = '<a href="#methods">How these methods work</a>';
  var plural = function (n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); };
  var pctOf = function (r, n) { return n ? Math.round(r / n * 100) : 0; };

  /* ---------- device preferences (C.state.prefs.study) ---------- */
  function prefs() {
    var p = S().prefs;
    if (!p.study || typeof p.study !== 'object' || Array.isArray(p.study)) p.study = {};
    return p.study;
  }
  function prefN() { var n = Number(prefs().mxN); return SIZES.indexOf(n) >= 0 ? n : 10; }
  function prefLv() { var v = Number(prefs().mxLv); return v && A().levelById[v] ? v : 0; }
  // Distinct days, within RECENT_DAYS, the question was answered right since its last wrong answer. study.js keeps the
  // times of recent right answers of every question (qa.ok, merged across devices, also from module quizzes and level
  // tests); answers saved before it did that still have their right answers since the last mistake (qa.fix) and the
  // latest answer (qa.at, when it was right).
  function rightDays(qid) {
    var x = S().qa[qid], t = ST.today();
    if (!x || !x.lr) return 0;
    var times = (x.ok || []).concat(x.fix || [], x.at ? [x.at] : []), seen = {};
    times.forEach(function (f) {
      if (typeof f !== 'string' || (x.wrongAt && f <= x.wrongAt)) return;
      var d = ST.localDay(f); if (d && ST.daysBetween(d, t) <= RECENT_DAYS) seen[d] = 1;
    });
    return Object.keys(seen).length;
  }
  // the device-only log of right days that this page kept before study.js recorded qa.ok is not needed any more
  function dropOldLog() { var p = prefs(); if (Object.prototype.hasOwnProperty.call(p, 'mxRd')) { delete p.mxRd; C.save(); } }

  /* ---------- questions, modules and topics ---------- */
  // { q, set, mid, m, topic } for a quiz question id, or null when the question no longer exists
  function info(qid) {
    var q = ST.question(qid); if (!q) return null;
    var app = A(), set = ST.questionSet(qid), tag = ST.qtag(qid);
    var mid = app.modById[set] ? set : tag && app.modById[tag.mid] ? tag.mid : '';
    return { q: q, set: set, mid: mid, m: mid ? app.modById[mid] : null, topic: tag && tag.topic ? String(tag.topic) : '' };
  }
  function modLabel(m) { return 'Module ' + A().modNo(m) + ' · ' + m.title; }
  function topicKey(i) { return i.mid + '|' + i.topic; }
  // The modules the learner has started (ST.isStarted is the one rule for that) that have a quiz to draw from
  function startedModules() {
    var app = A();
    return ST.startedModules().map(function (id) { return app.modById[id]; }).filter(function (m) { return m && (D.quizzes[m.id] || []).length; });
  }
  // the latest thing the learner did in a module (ISO time or day; compared as text). The same kinds of work as
  // ST.isStarted: a playlist shared by several modules says nothing about which of them was studied, unless it was
  // ticked on this module's own page (app.js keeps that tick as 'moduleId|resourceId').
  function lastTouch(m) {
    var st = S(), app = A(), best = '', mp = app.mainPicks(m);
    var take = function (v) { v = String(v || '').replace(/^-/, ''); if (v > best) best = v; };
    app.readCards(m).forEach(function (c) { if (app.readOn(m.id, c.key)) take(st.read[m.id + '/' + c.key]); });
    (mp ? mp.list : []).forEach(function (r) { if (st.watched[r.id] && ST.sharedBy(r.id) === 1) take(st.watched[r.id]); take(st.watched[m.id + '|' + r.id]); }); // a tick for this module's part of a shared playlist
    if (st.quiz[m.id]) take(st.quiz[m.id].at);
    (D.quizzes[m.id] || []).forEach(function (q) { if (st.qa[q.id]) take(st.qa[q.id].at); });
    app.exOf(m.id).forEach(function (e) { var x = st.ex[e.id]; if (x && x.done) take(x.at); });
    if (st.refl[m.id]) take(st.refl[m.id].at);
    Object.keys(st.srs).forEach(function (id) { var c = st.srs[id]; if (id.split(':')[1] === m.id && c.reps > 0) take(c.last); });
    return best;
  }
  // right and tried counts per topic (module|topic) and per module, from every answer saved in C.state.qa
  function accuracy() {
    var qa = S().qa, topics = {}, mods = {};
    Object.keys(qa).forEach(function (qid) {
      var x = qa[qid], i = x && x.n ? info(qid) : null; if (!i || !i.mid) return;
      var mm = mods[i.mid] = mods[i.mid] || { n: 0, r: 0 }; mm.n += x.n; mm.r += x.r;
      if (!i.topic) return;
      var k = topicKey(i), tt = topics[k] = topics[k] || { n: 0, r: 0, mid: i.mid, topic: i.topic };
      tt.n += x.n; tt.r += x.r;
    });
    return { topics: topics, mods: mods };
  }
  // the topic with the lowest share right (at least 2 answers); else the module studied most recently
  function weakest() {
    var acc = accuracy(), app = A(), list = Object.keys(acc.topics).map(function (k) { return acc.topics[k]; })
      .filter(function (t) { return t.n >= 2 && app.modById[t.mid]; });
    list.sort(function (a, b) { return a.r / a.n - b.r / b.n || b.n - a.n || app.modById[a.mid]._i - app.modById[b.mid]._i || a.topic.localeCompare(b.topic); });
    if (list[0]) return { kind: 'topic', m: app.modById[list[0].mid], topic: list[0].topic, n: list[0].n, r: list[0].r };
    var best = null, bt = '';
    ST.startedModules().forEach(function (id) { var m = app.modById[id]; if (!m) return; var t = lastTouch(m); if (!best || t > bt) { best = m; bt = t; } });
    return best ? { kind: 'module', m: best } : null;
  }

  /* ---------- adaptive interleaving: weights, a weighted draw without repeats, then a mixed order ---------- */
  // Higher for a weak topic or module, a question answered wrong last time, or one not seen for a while;
  // lower for one answered right on two different days recently.
  function weight(q, acc, nowMs) {
    var st = S(), x = st.qa[q.id], i = info(q.id) || { mid: '', topic: '' };
    var ta = i.topic ? acc.topics[topicKey(i)] : null, ma = acc.mods[i.mid];
    var w = 1;
    w *= 1 + 2 * (1 - ((ta ? ta.r : 0) + 1) / ((ta ? ta.n : 0) + 2));   // weak topic: 1 to 3 (no answers yet = 2)
    w *= 1 + (1 - ((ma ? ma.r : 0) + 1) / ((ma ? ma.n : 0) + 2));       // weak module: 1 to 2
    if (x && x.n && !x.lr) w *= 3;                                      // wrong last time
    var days = x && x.at ? (nowMs - Date.parse(x.at)) / 864e5 : null;
    w *= days == null || !isFinite(days) ? 2 : days < 1 ? 0.6 : 1 + Math.min(days, 28) / 14; // not seen for a while: up to 3
    if (x && x.lr && rightDays(q.id) >= 2) w *= 0.25;                  // right on two different days recently
    return w;
  }
  function modOf(q) { var i = info(q.id); return i ? i.mid : ''; }
  // n questions drawn by weight, never the same one twice, and no module filling more than 60% of the quiz
  function pick(pool, n, rnd) {
    rnd = rnd || Math.random;
    var acc = accuracy(), nowMs = Date.now(), seen = {};
    var keyed = [];
    pool.forEach(function (q) {
      if (!q || seen[q.id]) return; seen[q.id] = 1;
      var w = Math.max(1e-6, weight(q, acc, nowMs));
      keyed.push({ q: q, mid: modOf(q), k: Math.pow(Math.max(rnd(), 1e-12), 1 / w) }); // weighted sampling (Efraimidis and Spirakis)
    });
    keyed.sort(function (a, b) { return b.k - a.k; });
    var cap = Math.ceil(n * 0.6), count = {}, out = [], rest = [];
    keyed.forEach(function (x) {
      if (out.length < n && (count[x.mid] || 0) < cap) { out.push(x); count[x.mid] = (count[x.mid] || 0) + 1; } else rest.push(x);
    });
    rest.forEach(function (x) { if (out.length < n) out.push(x); }); // too few other modules: allow more from one
    return interleave(out.map(function (x) { return x.q; }), rnd);
  }
  // order so the same module rarely comes twice in a row: each time take the module with the most questions left
  // that differs from the one just used
  function interleave(qs, rnd) {
    rnd = rnd || Math.random;
    var groups = {}, order = [];
    qs.forEach(function (q) { var m = modOf(q); if (!groups[m]) { groups[m] = []; order.push(m); } groups[m].push(q); });
    var out = [], prev = null;
    while (out.length < qs.length) {
      var cands = order.filter(function (m) { return groups[m].length && m !== prev; });
      if (!cands.length) cands = order.filter(function (m) { return groups[m].length; });
      var most = Math.max.apply(null, cands.map(function (m) { return groups[m].length; }));
      var top = cands.filter(function (m) { return groups[m].length === most; });
      var g = top[Math.floor(rnd() * top.length) % top.length];
      out.push(groups[g].shift()); prev = g;
    }
    return out;
  }
  function poolFor(mods) { var out = []; mods.forEach(function (m) { (D.quizzes[m.id] || []).forEach(function (q) { out.push(q); }); }); return out; }

  /* ---------- calibration: how often the learner was right at each level of sureness ---------- */
  function calGroups(items) { // items: [{ sure 0-3, right bool }]
    var g = { 1: { n: 0, r: 0 }, 2: { n: 0, r: 0 }, 3: { n: 0, r: 0 }, none: 0 };
    items.forEach(function (x) { if (g[x.sure]) { g[x.sure].n++; if (x.right) g[x.sure].r++; } else g.none++; });
    return g;
  }
  // every question whose latest answer was rated: module quizzes, mixed practice and mistakes re-tests ask how sure you are
  function calOverTime() {
    var qa = S().qa, items = [];
    Object.keys(qa).forEach(function (k) { var x = qa[k]; if (x && x.su > 0 && x.n > 0) items.push({ sure: x.su, right: !!x.lr }); });
    return calGroups(items);
  }
  function calMeaning(g) {
    var rated = g[1].n + g[2].n + g[3].n;
    if (!rated) return 'You did not rate how sure you were. Next time pick Guessing, Fairly sure or Certain before you check: it trains metacognition (knowing what you know and what you do not).';
    var acc = function (k) { return g[k].n ? g[k].r / g[k].n : null; };
    var wrongSure = g[3].n - g[3].r;
    if (wrongSure > 0 && acc(3) < 0.75) return 'You were Certain about ' + plural(wrongSure, 'wrong answer') + '. Feeling sure and being wrong points to a misconception (a wrong idea that feels right), so read those explanations slowly: this is where metacognition (knowing what you know) helps most.';
    if ([1, 2, 3].filter(function (k) { return g[k].n; }).length < 2) return 'You used only one level of sureness, so there is nothing to compare yet. Pick Guessing, Fairly sure or Certain honestly each time: it trains metacognition (knowing what you know and what you do not).';
    if (g[1].n >= 2 && acc(1) >= 0.6) return 'Your guesses were right more often than not: you know more than you think, so trust your first idea a little more.';
    var seq = [acc(1), acc(2), acc(3)].filter(function (x) { return x != null; });
    var rising = seq.every(function (x, i) { return !i || x >= seq[i - 1]; });
    if (rising) return 'Your sureness matched your results: you were right more often when you felt surer. This is good metacognition (knowing what you know), and it tells you where to spend your revision time.';
    return 'Your sureness did not match your results yet. Keep rating each answer: with practice you will learn to tell what you know from what you only half know (metacognition).';
  }
  function calRowsHTML(g, bars) {
    return '<ul class="mx-cal">' + [3, 2, 1].map(function (k) {
      var x = g[k], p = pctOf(x.r, x.n);
      return '<li><span class="mx-cal-k">' + esc(SURE[k]) + '<span class="visually-hidden">: </span></span>' +
        (bars ? '<span class="mx-cal-b" aria-hidden="true"><span style="width:' + (x.n ? p : 0) + '%"></span></span>' : '') +
        '<span class="mx-cal-v num">' + (x.n ? 'right ' + x.r + ' of ' + x.n + ' (' + p + '%)' : 'not used') + '</span></li>';
    }).join('') + '</ul>';
  }

  /* ---------- AI: parse a JSON array of questions defensively ---------- */
  // complete {...} objects found in text (used when the whole reply does not parse, e.g. it was cut off)
  function salvage(t) {
    var out = [], depth = 0, start = -1, inStr = false, escp = false;
    for (var i = 0; i < t.length; i++) {
      var ch = t[i];
      if (inStr) { if (escp) escp = false; else if (ch === '\\') escp = true; else if (ch === '"') inStr = false; continue; }
      if (ch === '"') { inStr = true; continue; }
      if (ch === '{') { if (depth === 0) start = i; depth++; }
      else if (ch === '}' && depth > 0) { depth--; if (depth === 0 && start >= 0) { try { out.push(JSON.parse(t.slice(start, i + 1))); } catch (e) {} start = -1; } }
    }
    return out;
  }
  function cleanQuestion(o) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
    var q = typeof o.q === 'string' ? o.q.trim() : '';
    var opts = o.options, ans = o.answer, ex = typeof o.explain === 'string' ? o.explain.trim() : '';
    if (!q || !ex || !Array.isArray(opts) || opts.length !== 4) return null;
    if (!opts.every(function (x) { return typeof x === 'string' && x.trim(); })) return null;
    opts = opts.map(function (x) { return x.trim(); });
    // options written as "A) ...", "B) ...": drop the letters (the quiz shows its own)
    if (opts.every(function (x, k) { return new RegExp('^\\(?' + 'ABCD'[k] + '[).:]\\s+', 'i').test(x); })) opts = opts.map(function (x) { return x.replace(/^\(?[A-D][).:]\s+/i, ''); });
    var lower = {}; opts.forEach(function (x) { lower[x.toLowerCase()] = 1; });
    if (Object.keys(lower).length !== 4) return null;
    if (typeof ans === 'string') { var mm = /^\s*([A-Da-d0-3])\s*[).:]?\s*$/.exec(ans); ans = mm ? (/\d/.test(mm[1]) ? Number(mm[1]) : 'abcd'.indexOf(mm[1].toLowerCase())) : NaN; }
    if (typeof ans !== 'number' || !isFinite(ans) || ans % 1 !== 0 || ans < 0 || ans > 3) return null;
    return { q: q.slice(0, 500), options: opts.map(function (x) { return x.slice(0, 200); }), answer: ans, explain: ex.slice(0, 800) };
  }
  // text: Gemini's reply; stopped: Gemini stopped at its length limit (ST.askAI with raw: true says so)
  // -> { questions: [...up to 5], dropped, error, cut (the reply stopped before the list was complete) }
  function parseQuestions(text, stopped) {
    var t = String(text == null ? '' : text), cut = !!stopped;
    t = t.replace(/```[a-zA-Z]*\s*/g, '').replace(/```/g, '').trim();
    var arr = null;
    var s = t.indexOf('['), e = t.lastIndexOf(']');
    if (s >= 0 && e > s) { try { arr = JSON.parse(t.slice(s, e + 1)); } catch (err) { arr = null; } }
    if (!Array.isArray(arr)) { try { var o = JSON.parse(t); if (o && Array.isArray(o.questions)) arr = o.questions; } catch (err) {} }
    if (!Array.isArray(arr)) {
      arr = salvage(s >= 0 ? t.slice(s) : t);
      if (s >= 0 && !/\]\s*$/.test(t)) cut = true; // the list was opened but never closed
    }
    var good = [], dropped = 0;
    arr.forEach(function (x) { var c = cleanQuestion(x); if (c) good.push(c); else dropped++; });
    good = good.slice(0, AI_QS);
    var error = '';
    if (!good.length && cut) error = 'Gemini\'s reply was cut short before it finished a question.';
    else if (!arr.length) error = 'Gemini\'s reply was not in the expected format.';
    else if (good.length < 3) error = (cut ? 'Gemini\'s reply was cut short: it' : 'Gemini') + ' wrote only ' + plural(good.length, 'usable question') + '.';
    return { questions: error ? [] : good, dropped: dropped, error: error, cut: cut && good.length < AI_QS };
  }

  /* ---------- small UI pieces ---------- */
  var timers = [];
  function announce(id, msg) {
    var el = $(id); if (!el) return;
    el.textContent = '';
    timers.push(setTimeout(function () { el.textContent = msg; }, 60));
  }
  function focusEl(el) { if (!el) return; try { el.focus({ preventScroll: false }); } catch (e) { el.focus(); } }
  function stat(k, v, id) { return '<div class="stat"' + (id ? ' id="' + id + '"' : '') + '><div class="k">' + esc(k) + '</div><div class="v">' + esc(String(v)) + '</div></div>'; }
  function fmtDay(d) { try { return new Date(String(d).slice(0, 10) + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); } catch (e) { return String(d).slice(0, 10); } }
  function fmtTime(ms) { try { return new Date(ms).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }).replace(/\s+/g, ' '); } catch (e) { return ''; } } // "11:00 am"
  function qTextHTML(q) { return '<div class="ms-qt">' + inline(q.q) + '</div>' + (q.code ? '<pre><code>' + esc(q.code) + '</code></pre>' : ''); }
  // a question's opening words as plain text, to tell its buttons apart in a screen reader's list of buttons
  function snippet(s) { var t = String(s || '').replace(/[`*_]/g, '').replace(/\s+/g, ' ').trim(); return t.length > 60 ? t.slice(0, 57).replace(/\s+\S*$/, '') + '…' : t; }
  // what each AI box acts on ("mistake 3, What does this print?"): study.js names its buttons with it (aiHTML's third
  // argument), and a code box that scrolls sideways in that mistake is named after it too
  var askWhat = {};
  // keeps a page usable while its content changes: code boxes in the notebook that scroll sideways (long lines on a phone)
  // get a keyboard stop. Code inside quizzes is core.js's (Quiz codeKeys).
  var QUIZ_ROOTS = '#mx-quiz, #ms-quiz, #mx-ai-quiz';
  function watchPage(root) {
    if (!root) return;
    var fix = function () {
      Array.prototype.forEach.call(root.querySelectorAll('pre'), function (p) {
        if (p.closest(QUIZ_ROOTS)) return;
        var wide = p.scrollWidth > p.clientWidth, mine = p.hasAttribute('data-mx-code');
        if (wide && !p.hasAttribute('tabindex')) {
          // a named region, like core.js's quiz code: "Code for mistake 3, What does this print?"
          var li = p.closest('[data-qid]'), what = li && askWhat['err-' + li.getAttribute('data-qid')];
          p.tabIndex = 0; p.setAttribute('data-mx-code', ''); p.setAttribute('role', 'region'); p.setAttribute('aria-label', 'Code for ' + (what || 'this question'));
        } else if (!wide && mine) { p.removeAttribute('tabindex'); p.removeAttribute('data-mx-code'); p.removeAttribute('role'); p.removeAttribute('aria-label'); }
      });
    };
    var ob = window.MutationObserver ? new MutationObserver(fix) : null;
    if (ob) ob.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'hidden'] });
    var t = null, onResize = function () { clearTimeout(t); t = setTimeout(fix, 150); };
    window.addEventListener('resize', onResize);
    root.addEventListener('toggle', fix, true); // a disclosure opened
    fix();
    A().onLeave(function () { if (ob) ob.disconnect(); clearTimeout(t); window.removeEventListener('resize', onResize); });
  }

  /* =================== Mixed practice (#mixed) =================== */
  var mx = null; // { token, quiz, aiQuiz, answers, qs }
  function viewMixed() {
    var app = A(), token = {};
    app.setView('<div class="wrap stack-lg mx-page">' + app.crumbs([['Home', 'home'], ['Study room', 'study'], ['Mixed practice']]) +
      '<header class="stack-sm"><h1>Mixed practice</h1>' +
      '<p class="lede prose">One quiz with questions from all the modules you have started, chosen to work on your weak spots.</p>' +
      '<ul class="mx-methods prose">' +
      '<li><strong>Interleaved practice:</strong> mixing topics makes you first work out which idea a question needs, which is what exams and real projects ask of you.</li>' +
      '<li><strong>Practice testing:</strong> answering questions from memory makes the memory stronger than reading your notes again, and shows you what you do not know yet.</li></ul>' +
      '<p class="small muted prose">The site picks more questions from topics and modules where you are often wrong, questions you missed last time and ones you have not seen for a while, and fewer that you got right on two different days (adaptive interleaving). ' + HOW + '</p>' +
      '<p class="small prose">' + ST.sans('abhyasa', { meaning: false }) + ', steady practice: come back for a short mixed quiz most days.</p></header>' +
      '<div id="mx-main" class="stack-lg"><p class="muted" role="status">Loading your questions…</p></div>' +
      '<p class="visually-hidden" id="mx-live" aria-live="polite"></p></div>', 'Mixed practice');
    mx = { token: token, quiz: null, aiQuiz: null, answers: {}, qs: [] };
    var main = $('mx-main');
    main.addEventListener('click', onMixedClick);
    main.addEventListener('change', onMixedChange);
    watchPage(main);
    app.onLeave(function () {
      timers.forEach(clearTimeout); timers = [];
      if (mx && mx.token === token) { if (mx.quiz) mx.quiz.destroy(); if (mx.aiQuiz) mx.aiQuiz.destroy(); mx = null; }
    });
    // the study index tags each question with its topic; without it everything still works, with topics untagged
    var go = function () { if (mx && mx.token === token && $('mx-main')) drawMixed(); };
    ST.ensureData().then(go, go);
  }
  ST.addRoute('mixed', viewMixed, 'study');

  function drawMixed() {
    var main = $('mx-main'); if (!main) return;
    dropOldLog();
    main.innerHTML = '<div id="mx-top" class="stack-lg">' + setupHTML() + '</div>' +
      '<section class="stack mx-run" id="mx-run" hidden aria-labelledby="mx-run-h"><div class="row-between"><h2 class="h-sub" id="mx-run-h" tabindex="-1">Your mixed quiz</h2>' +
      '<button type="button" class="btn btn-sm btn-ghost" data-mx="settings">Change settings</button></div><p class="small muted" id="mx-run-sub"></p><div id="mx-quiz"></div></section>' +
      '<section class="card stack-sm" id="mx-cal" aria-labelledby="mx-cal-h">' + calCardInner() + '</section>' +
      '<section class="card stack-sm mx-ai" id="mx-ai" aria-labelledby="mx-ai-h">' + aiCardInner() + '</section>' +
      '<p class="small"><a href="#mistakes">Open your mistakes notebook</a> to see every question you got wrong, with the right answer and why.</p>';
    // this box's Ask button makes a quiz, not a text reply: study.js hands the click to askGemini
    ST.bindAI(main, 'mx-gen', copyPrompt, { onAsk: function (btn) { askGemini(btn); } });
  }
  function setupHTML() {
    var app = A(), mods = startedModules();
    if (mods.length < MIN_MODULES) {
      var on = {}; mods.forEach(function (m) { on[m.id] = 1; });
      var next = (D.modules || []).filter(function (m) { return (D.quizzes[m.id] || []).length && !on[m.id]; })[0];
      return '<section class="card stack-sm mx-empty" id="mx-setup" aria-labelledby="mx-setup-h"><h2 class="h-sub" id="mx-setup-h" tabindex="-1">Start ' + (mods.length ? 'one more module' : 'two modules') + ' first</h2>' +
        '<p>Mixed practice mixes questions from the modules you have started, so it needs at least two. A module counts as started once you do some work on it: tick one of its lesson cards (Got it), finish its quiz, try one of its exercises or lab tasks, write a reflection on it or review one of its cards. Watching one of its videos counts too, but a long playlist shared by several modules counts only for the module page you watched it on.</p>' +
        '<p>' + (mods.length ? 'You have started: ' + mods.map(function (m) { return '<a href="#m-' + esc(m.id) + '">' + esc(modLabel(m)) + '</a>'; }).join(', ') + '.' : 'You have not started a module yet.') + '</p>' +
        '<div class="row">' + (next ? '<a class="btn btn-primary" href="#m-' + esc(next.id) + '">Open ' + esc(modLabel(next)) + '</a>' : '') + '<a class="btn" href="#roadmap">See all modules</a></div></section>';
    }
    var n = prefN(), lv = prefLv();
    var byLv = {}; mods.forEach(function (m) { byLv[m.level] = (byLv[m.level] || 0) + 1; });
    var lvs = (D.levels || []).filter(function (l) { return (byLv[l.id] || 0) >= MIN_MODULES; });
    if (lv && (byLv[lv] || 0) < MIN_MODULES) lv = 0;
    var hidden = (D.levels || []).some(function (l) { return byLv[l.id] && byLv[l.id] < MIN_MODULES; });
    return '<section class="card stack mx-setup" id="mx-setup" aria-labelledby="mx-setup-h"><h2 class="h-sub" id="mx-setup-h" tabindex="-1">Start a mixed quiz</h2>' +
      '<p class="small">You have started ' + plural(mods.length, 'module') + ': ' + mods.map(function (m) { return esc(app.modNo(m) + ' ' + m.title); }).join(', ') + '.</p>' +
      '<div class="mx-opts">' +
      '<fieldset class="mx-fs"><legend class="small">How many questions</legend><div class="seg mx-seg">' + SIZES.map(function (k) {
        return '<label><input type="radio" name="mx-n" value="' + k + '"' + (k === n ? ' checked' : '') + '><span>' + k + '</span></label>'; }).join('') + '</div></fieldset>' +
      '<div class="stack-sm mx-lv"><label class="small" for="mx-level">Questions from</label><select id="mx-level"><option value="">All levels (' + plural(mods.length, 'module') + ')</option>' +
      lvs.map(function (l) { return '<option value="' + l.id + '"' + (l.id === lv ? ' selected' : '') + '>Level ' + l.id + ' only (' + plural(byLv[l.id], 'module') + ')</option>'; }).join('') + '</select></div></div>' +
      (hidden ? '<p class="small muted">A level is listed once you have started two of its modules.</p>' : '') +
      '<div class="row"><button type="button" class="btn btn-primary" data-mx="start">Start mixed quiz</button></div>' +
      '<p class="small muted">Before you check each answer, say how sure you are. At the end you see how well your sureness matches your results.</p></section>';
  }
  function currentMods() {
    var lv = prefLv(), mods = startedModules();
    var inLv = lv ? mods.filter(function (m) { return m.level === lv; }) : mods;
    return inLv.length >= MIN_MODULES ? inLv : mods;
  }
  function onMixedChange(ev) {
    var t = ev.target;
    if (t.name === 'mx-n') { prefs().mxN = Number(t.value); C.save(); }
    if (t.id === 'mx-level') { prefs().mxLv = t.value ? Number(t.value) : 0; C.save(); }
  }
  function onMixedClick(ev) {
    if (!mx || !ev.target.closest) return;
    var b = ev.target.closest('[data-mx]'); if (!b) return;
    var a = b.getAttribute('data-mx');
    if (a === 'start' || a === 'again') startMixed();
    else if (a === 'settings') stopMixed();
  }
  function startMixed() {
    var mods = currentMods(); if (mods.length < MIN_MODULES) return;
    var n = prefN(), qs = pick(poolFor(mods), n);
    var used = {}; qs.forEach(function (q) { used[modOf(q)] = 1; });
    if (mx.quiz) mx.quiz.destroy();
    mx.answers = {}; mx.qs = qs;
    $('mx-top').hidden = true;
    var run = $('mx-run'); run.hidden = false;
    $('mx-run-sub').textContent = plural(qs.length, 'question') + ' from ' + plural(Object.keys(used).length, 'module') + ', mixed.' + (qs.length < n ? ' (Only ' + qs.length + ' questions are available.)' : '');
    var root = $('mx-quiz');
    if (!root._mxRetry) { // the quiz's own "Try again" starts the same questions afresh
      root.addEventListener('click', function (ev) { if (mx && ev.target.closest && ev.target.closest('[data-q="retry"]')) mx.answers = {}; }, true);
      root._mxRetry = true;
    }
    mx.quiz = new C.Quiz(root, { questions: qs, mode: 'learn', key: 'mixed', confidence: true,
      onAnswer: function (r) {
        ST.recordAnswer(r.q.id, r.correct, r.sure, 'mixed', r.picked);
        if (mx) mx.answers[r.q.id] = { right: !!r.correct, sure: r.sure || 0 };
      },
      onFinish: function () { C.logActivity(); C.save(); Promise.resolve().then(finishMixed); } });
    focusEl($('mx-run-h'));
    announce('mx-live', 'Mixed quiz started: ' + plural(qs.length, 'question') + '.');
  }
  function stopMixed() {
    if (mx.quiz) { mx.quiz.destroy(); mx.quiz = null; }
    $('mx-run').hidden = true; $('mx-quiz').innerHTML = '';
    var top = $('mx-top'); top.innerHTML = setupHTML(); top.hidden = false;
    var cal = $('mx-cal'); if (cal) cal.innerHTML = calCardInner();
    var wt = $('mx-ai-topic'); if (wt) wt.innerHTML = weakText(weakest());
    focusEl($('mx-setup-h'));
  }
  // after the quiz draws its score: add scores by module and by topic, and how sure the learner was
  function finishMixed() {
    if (!mx) return;
    var root = $('mx-quiz'), box = root && root.querySelector('.score-box'); if (!box) return;
    var app = A(), qs = mx.qs, ans = mx.answers, mods = {}, mOrder = [], tops = {}, tOrder = [], items = [], unanswered = 0;
    qs.forEach(function (q) {
      var i = info(q.id) || { mid: '', topic: '', m: null }, a = ans[q.id], right = !!(a && a.right);
      if (!a) unanswered++; else items.push({ sure: a.sure, right: right });
      if (!mods[i.mid]) { mods[i.mid] = { m: i.m, n: 0, r: 0 }; mOrder.push(i.mid); }
      mods[i.mid].n++; if (right) mods[i.mid].r++;
      var tk = topicKey(i);
      if (!tops[tk]) { tops[tk] = { m: i.m, topic: i.topic, n: 0, r: 0 }; tOrder.push(tk); }
      tops[tk].n++; if (right) tops[tk].r++;
    });
    mOrder.sort(function (x, y) { return (mods[x].m ? mods[x].m._i : 999) - (mods[y].m ? mods[y].m._i : 999); });
    tOrder.sort(function (x, y) { var a = tops[x], b = tops[y]; return a.r / a.n - b.r / b.n || (a.m ? a.m._i : 999) - (b.m ? b.m._i : 999) || a.topic.localeCompare(b.topic); });
    var g = calGroups(items), open = openMistakes().length;
    var sec = document.createElement('section');
    sec.className = 'card stack mx-res'; sec.setAttribute('aria-labelledby', 'mx-res-h');
    sec.innerHTML = '<h3 id="mx-res-h" tabindex="-1">Your results in detail</h3>' +
      (unanswered ? '<p class="small muted">' + plural(unanswered, 'question was', 'questions were') + ' not answered and count as not right.</p>' : '') +
      '<div class="mx-res-grid"><div class="stack-sm"><h4>By module</h4><div class="table-wrap"><table class="simple mx-tbl" id="mx-by-mod"><thead><tr><th scope="col">Module</th><th scope="col">Right</th></tr></thead><tbody>' +
      mOrder.map(function (k) { var x = mods[k]; return '<tr><td>' + (x.m ? '<a href="#m-' + esc(x.m.id) + '~quiz">' + esc(modLabel(x.m)) + '</a>' : 'Other') + '</td><td class="num">' + x.r + ' of ' + x.n + '</td></tr>'; }).join('') +
      '</tbody></table></div></div>' +
      '<div class="stack-sm"><h4>By topic</h4><div class="table-wrap"><table class="simple mx-tbl" id="mx-by-topic"><thead><tr><th scope="col">Topic</th><th scope="col">Right</th></tr></thead><tbody>' +
      tOrder.map(function (k) { var x = tops[k]; return '<tr><td>' + esc(x.topic || 'Not tagged yet') + (x.m ? ' <span class="small muted">(' + esc(app.modNo(x.m)) + ')</span>' : '') + '</td><td class="num">' + x.r + ' of ' + x.n + '</td></tr>'; }).join('') +
      '</tbody></table></div></div></div>' +
      '<div class="stack-sm mx-cal-now" id="mx-cal-now"><h4>How sure you were</h4>' + calRowsHTML(g, false) +
      (g.none && items.length ? '<p class="small muted">' + plural(g.none, 'answer') + ' not rated.</p>' : '') +
      '<p class="mx-meaning">' + esc(calMeaning(g)) + '</p></div>' +
      '<div class="row"><button type="button" class="btn btn-primary" data-mx="again">New mixed set</button><button type="button" class="btn" data-mx="settings">Change settings</button>' +
      '<a class="btn btn-ghost" href="#mistakes">Mistakes notebook' + (open ? ' (' + open + ' open)' : '') + '</a></div>';
    box.parentNode.insertBefore(sec, box.nextSibling);
    var cal = $('mx-cal'); if (cal) cal.innerHTML = calCardInner();
    var wt = $('mx-ai-topic'); if (wt) wt.innerHTML = weakText(weakest());
    box.tabIndex = -1; focusEl(box);
    announce('mx-live', 'Quiz finished. Your results by module and by topic are below your score.');
  }
  function calCardInner() {
    var g = calOverTime(), rated = g[1].n + g[2].n + g[3].n;
    return '<h2 class="h-sub" id="mx-cal-h">Do you know what you know?</h2>' +
      '<p class="small muted prose">Metacognitive learning: of all the answers you rated in module quizzes, mixed practice and mistakes re-tests, how often you were right at each level of sureness (the latest answer to each question counts).</p>' +
      (rated >= MIN_CAL ? '<div id="mx-cal-all">' + calRowsHTML(g, true) + '</div><p class="mx-meaning">' + esc(calMeaning(g)) + '</p>'
        : '<p id="mx-cal-all">Rate how sure you are on at least ' + MIN_CAL + ' answers to see this. So far: <span class="num">' + rated + '</span>.</p>');
  }

  /* ----- AI-generated practice test on the weakest topic ----- */
  function weakText(w) {
    if (!w) return 'Start a module first: the questions are written for the topic you need most.';
    if (w.kind === 'topic') return '<strong>Your weakest topic:</strong> ' + esc(w.topic) + ', in ' + esc(modLabel(w.m)) + ' (right ' + w.r + ' of ' + w.n + ' times).';
    return 'No topic has two answers yet, so this uses the module you studied most recently: <strong>' + esc(modLabel(w.m)) + '</strong>.';
  }
  function aiCardInner() {
    var w = weakest();
    return '<h2 class="h-sub" id="mx-ai-h">Make ' + AI_QS + ' new questions on my weakest topic</h2>' +
      '<p class="small muted prose">AI-generated practice tests: an AI writes fresh questions on the topic where you score lowest, so you can practise beyond the course\'s own quizzes.</p>' +
      '<p id="mx-ai-topic">' + weakText(w) + '</p>' +
      (w ? '<p class="small muted">Copy prompt gives you a prompt for ChatGPT, Gemini, Claude or any AI app: it asks you the questions one at a time and explains each answer.</p>' +
        ST.aiHTML('mx-gen', 'Make the questions here with Gemini', AI_QS + ' new questions on my weakest topic') : '') +
      '<p class="small" id="mx-ai-status" aria-live="polite"></p><div id="mx-ai-run" class="stack" hidden></div>';
  }
  function moduleBrief(m) {
    var ix = ST.modIndex(m.id), topics = (ix && ix.topics && ix.topics.length ? ix.topics : m.topics || []).slice(0, 8);
    var terms = (m.keyTerms || []).slice(0, 6).map(function (t) { return t.term; });
    return (topics.length ? 'The module covers: ' + topics.join('; ') + '.' : '') + (terms.length ? ' Key terms: ' + terms.join(', ') + '.' : '');
  }
  function subjectOf(w) { return w.kind === 'topic' ? '"' + w.topic + '" from the module "' + w.m.title + '"' : 'the module "' + w.m.title + '"'; }
  function copyPrompt() {
    var w = weakest(); if (!w) return '';
    return 'Please quiz me on ' + subjectOf(w) + ' of my free AI and machine learning course. ' + moduleBrief(w.m) + '\n\n' +
      'Ask me ' + AI_QS + ' multiple-choice questions, one at a time. Each question has 4 options labelled A to D and exactly one right answer. ' +
      'Wait for my reply before you go on. After each reply, tell me if I was right and explain why in two or three short sentences, then ask the next question. ' +
      'Start easy and make them a little harder as we go. After the last question, tell me my score out of ' + AI_QS + ' and the one idea I should revise.\n\nAsk the first question now.';
  }
  // The questions are kept short: 5 x (25 + 4 x 10 + 30) words is under 500 words, about 650 tokens, plus the JSON around
  // them; the reply may use up to AI_TOKENS tokens, so a slightly long reply is not cut off.
  function jsonPrompt(w) {
    return 'Write ' + AI_QS + ' new multiple-choice questions that test a beginner on ' + subjectOf(w) + ' of a free AI and machine learning course. ' + moduleBrief(w.m) + '\n' +
      'Rules: each question has exactly 4 different options and exactly one right answer. Mix easy and medium questions. Use everyday Indian examples (rupees, UPI, cricket, Indian cities) where they fit. No trick questions. ' +
      'Keep each question under 25 words, each option under 10 words and each explanation under 30 words, so the whole reply stays under 500 words.\n' +
      'Reply with ONLY a JSON array: no other text, no headings and no code fences. Use exactly this shape:\n' +
      '[{"q": "question text", "options": ["first option", "second option", "third option", "fourth option"], "answer": 0, "explain": "why the right option is right"}]\n' +
      '"answer" is the position (0, 1, 2 or 3) of the right option in "options".';
  }
  function askGemini(btn) {
    if (!mx) return;
    var w = weakest(), status = $('mx-ai-status'), run = $('mx-ai-run'), token = mx.token;
    if (!w || !status || !run || btn.disabled) return;
    btn.disabled = true;
    if (mx.aiQuiz) { mx.aiQuiz.destroy(); mx.aiQuiz = null; }
    run.hidden = true; run.innerHTML = '';
    status.removeAttribute('tabindex');
    status.textContent = 'Gemini is writing ' + AI_QS + ' questions…';
    var fail = function (msg) {
      status.innerHTML = '<span class="pub-bad" role="alert">' + esc(msg) + '</span>';
      status.tabIndex = -1; focusEl(status);
    };
    var p;
    // json: Gemini replies with JSON only; raw: the reply comes as { text, cut } (cut: stopped at the length limit)
    try { p = Promise.resolve(ST.askAI(jsonPrompt(w), { json: true, raw: true, maxOutputTokens: AI_TOKENS })); } catch (e) { p = Promise.reject(e); }
    p.then(function (reply) {
      if (!mx || mx.token !== token) return;
      var res = parseQuestions(reply && reply.text, reply && reply.cut);
      if (res.error) { fail(res.error + ' Try again, or use Copy prompt with any AI app.'); return; }
      var stamp = Date.now().toString(36);
      var qs = res.questions.map(function (q, i) { return { id: 'ai-' + stamp + '-' + i, q: q.q, options: q.options, answer: q.answer, explain: q.explain, difficulty: 'AI-written' }; });
      status.textContent = 'Gemini wrote ' + plural(qs.length, 'question') + (res.cut ? ' (its reply was cut short, so ' + plural(AI_QS - qs.length, 'question was', 'questions were') + ' left out)' : '') + '. They are below.';
      run.hidden = false;
      run.innerHTML = '<div class="callout small" id="mx-ai-warn"><strong>AI wrote these questions; they may contain mistakes.</strong> If an answer looks wrong, check it against the lesson. These answers are not saved to your progress.</div>' +
        '<h3 class="mx-ai-h3" id="mx-ai-qh" tabindex="-1">' + esc(w.kind === 'topic' ? w.topic : w.m.title) + ': ' + plural(qs.length, 'new question') + '</h3><div id="mx-ai-quiz"></div>';
      mx.aiQuiz = new C.Quiz($('mx-ai-quiz'), { questions: qs, mode: 'learn', key: 'ai' });
      focusEl($('mx-ai-qh'));
    }, function (e) {
      if (!mx || mx.token !== token) return;
      fail((e && e.message) || 'Gemini did not answer. Try again in a minute, or use Copy prompt with any AI app.');
    }).then(function () { ST.refreshAI(); }); // every Ask button on the page shows the replies left, and is enabled again unless none are left
  }

  /* =================== Mistakes notebook (#mistakes) =================== */
  function sortKey(i) { // course order; a level test after its level's modules
    if (i.m && i.set === i.m.id) return i.m._i * 2;
    var lv = /^test-l(\d)$/.exec(i.set || ''), last = -1;
    if (lv) (D.modules || []).forEach(function (m) { if (m.level === Number(lv[1])) last = m._i; });
    return lv ? last * 2 + 1 : 1e6;
  }
  function openMistakes() {
    var qa = S().qa, out = [];
    Object.keys(qa).forEach(function (qid) { if (ST.isMistake(qa[qid])) { var i = info(qid); if (i) { i.x = qa[qid]; out.push(i); } } });
    out.sort(function (a, b) { return sortKey(a) - sortKey(b) || String(a.q.id).localeCompare(String(b.q.id)); });
    return out;
  }
  // Where a mistake stands under the base's rule (ST.fixCount: right answers on different days, 12+ hours apart):
  // n = right answers that count so far, last = the latest one that counted, now = a right answer now would count,
  // next = the earliest time (ms) a right answer counts when that is later than now (0 when unknown).
  function fixInfo(x) {
    var f = ((x && x.fix) || []).slice().sort(), n = 0, last = '';
    for (var k = 1; k <= f.length; k++) { var c = ST.fixCount({ fix: f.slice(0, k) }); if (c > n) { n = c; last = f[k - 1]; } }
    var out = { n: n, last: last, now: ST.fixCount({ fix: f.concat(ST.now()) }) > n, next: 0 };
    if (n && !out.now) {
      var cand = Math.max(Date.parse(last) + 12 * 3600e3, new Date(ST.addDays(ST.localDay(last), 1) + 'T00:00:00').getTime());
      if (isFinite(cand) && ST.fixCount({ fix: f.concat(new Date(cand).toISOString()) }) > n) out.next = cand;
    }
    return out;
  }
  // the time of the right answer that fixed a mistake (the one that made it count twice), or ''
  function fixedAt(x) {
    if (!x || !x.wrongAt || ST.isMistake(x)) return '';
    var f = (x.fix || []).slice().sort();
    for (var k = 1; k <= f.length; k++) if (ST.fixCount({ fix: f.slice(0, k) }) >= 2) return f[k - 1];
    return '';
  }
  function fixedMistakes() {
    var qa = S().qa, t = ST.today(), out = [];
    Object.keys(qa).forEach(function (qid) {
      var x = qa[qid], at = fixedAt(x); if (!at) return;
      var day = ST.localDay(at); if (!day || ST.daysBetween(day, t) > RECENT_DAYS) return;
      var i = info(qid); if (i) { i.x = x; i.day = day; i.at = at; out.push(i); }
    });
    out.sort(function (a, b) { return b.at.localeCompare(a.at) || sortKey(a) - sortKey(b); });
    return out;
  }
  function rightToday(x) { var t = ST.today(); return (x.fix || []).some(function (f) { return ST.localDay(f) === t; }); }
  function groupOf(i) {
    if (i.m && i.set === i.m.id) return { key: i.m.id, title: modLabel(i.m), href: '#m-' + i.m.id + '~quiz', link: 'Open the module quiz' };
    var lv = /^test-l(\d)$/.exec(i.set || '');
    if (lv) return { key: i.set, title: 'Level ' + lv[1] + ' test', href: '#test-l' + lv[1], link: 'Open the level test' };
    return { key: 'other', title: 'Other questions', href: '', link: '' };
  }
  var ms = null; // { token, quiz, results, qs }
  function viewMistakes() {
    var app = A(), token = {};
    app.setView('<div class="wrap stack-lg ms-page">' + app.crumbs([['Home', 'home'], ['Study room', 'study'], ['Mistakes notebook']]) +
      '<header class="stack-sm"><h1>Mistakes notebook</h1>' +
      '<p class="lede prose">Every quiz question you have got wrong, in one place: what you picked, the right answer and why.</p>' +
      '<p class="prose"><strong>Error-based learning:</strong> a mistake you look at closely and then fix teaches you more than a question you got right the first time.</p>' +
      '<p class="small muted prose">A mistake counts as fixed after you answer it right on two different days, at least 12 hours apart, so the right idea has stayed with you overnight. ' + HOW + '</p></header>' +
      '<div id="ms-main" class="stack-lg"><p class="muted" role="status">Loading your mistakes…</p></div>' +
      '<p class="visually-hidden" id="ms-live" aria-live="polite"></p></div>', 'Mistakes notebook');
    ms = { token: token, quiz: null, results: [], qs: [] };
    var main = $('ms-main');
    main.addEventListener('click', onMistakesClick);
    watchPage(main);
    app.onLeave(function () {
      timers.forEach(clearTimeout); timers = [];
      if (ms && ms.token === token) { if (ms.quiz) ms.quiz.destroy(); ms = null; }
    });
    var go = function () { if (ms && ms.token === token && $('ms-main')) drawMistakes(); };
    ST.ensureData().then(go, go);
  }
  ST.addRoute('mistakes', viewMistakes, 'study');

  function drawMistakes() {
    var main = $('ms-main'); if (!main) return;
    main.innerHTML = '<section class="card stack-sm ms-top" id="ms-top" aria-labelledby="ms-top-h"></section>' +
      '<section class="stack ms-run" id="ms-run" hidden aria-labelledby="ms-run-h"><div class="row-between"><h2 class="h-sub" id="ms-run-h" tabindex="-1">Re-test</h2>' +
      '<button type="button" class="btn btn-sm btn-ghost" data-ms="stop">Back to the notebook</button></div><p class="small muted" id="ms-run-sub"></p><div id="ms-quiz"></div></section>' +
      '<div id="ms-lists" class="stack-lg"></div>';
    drawLists();
  }
  function drawLists() {
    var top = $('ms-top'), lists = $('ms-lists'); if (!top || !lists) return;
    var open = openMistakes(), fixed = fixedMistakes();
    var waiting = open.filter(function (i) { return rightToday(i.x); }).length;
    var any = Object.keys(S().qa).some(function (k) { return S().qa[k] && S().qa[k].n; });
    top.innerHTML = '<h2 class="h-sub" id="ms-top-h" tabindex="-1">Your mistakes</h2>' +
      '<div class="lab-stats">' + stat('Open mistakes', open.length, 'ms-n-open') + stat('Right today', waiting, 'ms-n-wait') + stat('Fixed (30 days)', fixed.length, 'ms-n-fixed') + '</div>' +
      (open.length ? '<div class="row"><button type="button" class="btn btn-primary" data-ms="retest">Re-test my mistakes (' + Math.min(open.length, RETEST_MAX) + ')</button></div>' +
        '<p class="small muted">' + (open.length > RETEST_MAX ? 'A re-test takes ' + RETEST_MAX + ' at a time, starting with those a right answer can move towards fixed now. ' : '') + 'A right answer counts towards fixing a mistake once a day, at least 12 hours after the last one that counted.</p>'
        : '<p>' + (any ? 'No open mistakes. Well done! New ones appear here whenever you get a quiz question wrong.' : 'No mistakes yet. Take a module quiz or <a href="#mixed">mixed practice</a>: any question you get wrong appears here with the right answer and why.') + '</p>');
    // open mistakes, grouped by module; numbered across the page so their buttons can be told apart
    var groups = [], byKey = {}, num = 0;
    open.forEach(function (i) { var g = groupOf(i); if (!byKey[g.key]) { byKey[g.key] = { g: g, items: [] }; groups.push(byKey[g.key]); } byKey[g.key].items.push(i); });
    lists.innerHTML = groups.map(function (gr, gi) {
      return '<section class="card stack-sm ms-group" aria-labelledby="ms-g-' + gi + '"><div class="row-between"><h2 class="h-sub" id="ms-g-' + gi + '">' + esc(gr.g.title) + ' <span class="chip num">' + gr.items.length + '</span></h2>' +
        (gr.g.href ? '<a class="small" href="' + esc(gr.g.href) + '">' + esc(gr.g.link) + '<span class="visually-hidden">: ' + esc(gr.g.title) + '</span></a>' : '') + '</div>' +
        '<ol class="ms-list">' + gr.items.map(function (i) { return itemHTML(i, ++num); }).join('') + '</ol></section>';
    }).join('') + recentHTML(fixed);
    open.forEach(function (i) { ST.bindAI(lists, 'err-' + i.q.id, function () { return errPrompt(i); }); });
  }
  function fixLine(x) {
    var fi = fixInfo(x), t = ST.today();
    if (!fi.n) return 'Answer it right on two different days, at least 12 hours apart, to fix it.';
    var d = ST.localDay(fi.last), said = d === t ? 'Right today' : 'Right on ' + fmtDay(d);
    if (fi.now) return said + '. Answer it right once more to fix it.';
    if (!fi.next) return said + '. Answer it right again on another day to fix it.';
    var at = new Date(fi.next), nd = ST.localDay(at.toISOString()), midnight = !at.getHours() && !at.getMinutes();
    var when = nd === t ? 'after ' + fmtTime(fi.next) + ' today'
      : (nd === ST.addDays(t, 1) ? 'tomorrow' : 'on ' + fmtDay(nd)) + (midnight ? '' : ' after ' + fmtTime(fi.next));
    return said + '. Answer it right again ' + when + ' to fix it.';
  }
  function itemHTML(i, num) {
    var q = i.q, x = i.x, f = Math.min(2, ST.fixCount(x)), p = x.p, what = 'mistake ' + num + ', ' + snippet(q.q);
    var known = typeof p === 'number' && p >= 0 && p < q.options.length;
    var last = known ? '<p class="small">Your last answer: <strong>' + inline(q.options[p]) + '</strong> ' + (p === q.answer ? '<span class="ms-ok">(right)</span>' : '<span class="ms-bad">(wrong)</span>') + '</p>'
      : '<p class="small muted">Your last answer was not saved.</p>';
    var wrongDay = x.wrongAt ? ST.localDay(x.wrongAt) : '';
    askWhat['err-' + q.id] = what;
    return '<li class="ms-item stack-sm" id="ms-' + esc(q.id) + '" data-qid="' + esc(q.id) + '">' + qTextHTML(q) +
      '<div class="row ms-meta"><span class="chip ms-fix' + (f ? ' is-half' : '') + '">Fixed ' + f + ' of 2</span>' + (i.topic ? '<span class="chip chip-level">' + esc(i.topic) + '</span>' : '') +
      (wrongDay ? '<span class="small muted">Wrong on ' + esc(fmtDay(wrongDay)) + '</span>' : '') + '</div>' +
      '<p class="small muted ms-fixline">' + esc(fixLine(x)) + '</p>' + last +
      '<details class="fold ms-why"><summary>Show the right answer and why<span class="visually-hidden"> (' + esc(what) + ')</span></summary><div class="stack-sm">' +
      '<p>Right answer: <strong>' + inline(q.options[q.answer]) + '</strong></p><div class="q-explain">' + inline(q.explain) + '</div>' +
      '<p class="small muted">Intelligent error analysis: ask an AI what wrong idea led you to your answer, and get a similar question to try.</p>' +
      ST.aiHTML('err-' + q.id, 'Ask Gemini why I got this wrong', what) + '</div></details></li>';
  }
  function recentHTML(fixed) {
    if (!fixed.length) return '';
    return '<section class="card stack-sm ms-recent" id="ms-recent" aria-labelledby="ms-recent-h"><h2 class="h-sub" id="ms-recent-h">Recently fixed</h2>' +
      '<p class="small muted">Answered right on two different days. They may still come back in mixed practice now and then.</p><ul class="ms-rlist">' +
      fixed.slice(0, 10).map(function (i) {
        return '<li data-qid="' + esc(i.q.id) + '"><span class="ms-rq">' + inline(i.q.q) + '</span> <span class="small muted">' + esc(groupOf(i).title) + ' · fixed on ' + esc(fmtDay(i.day)) + '</span></li>';
      }).join('') + '</ul>' + (fixed.length > 10 ? '<p class="small muted">And ' + (fixed.length - 10) + ' more.</p>' : '') + '</section>';
  }
  function letter(k) { return 'ABCD'.charAt(k) || String(k + 1); }
  function errPrompt(i) {
    var q = i.q, x = i.x, p = x.p;
    var opts = q.options.map(function (o, k) { return letter(k) + ') ' + o; }).join('\n');
    var mine = !x.lr && typeof p === 'number' && p >= 0 && p < q.options.length ? 'My answer: ' + letter(p) + ') ' + q.options[p]
      : 'I do not have my wrong answer saved' + (x.lr ? ' (my latest try was right, but I got it wrong before)' : '') + '.';
    return 'I got this multiple-choice question wrong in my AI and machine learning course' + (i.m ? ' (module "' + i.m.title + '")' : '') + '.\n\n' +
      'Question: ' + q.q + '\n' + (q.code ? 'Code:\n' + q.code + '\n' : '') + 'Options:\n' + opts + '\n' + mine + '\n' +
      'Right answer: ' + letter(q.answer) + ') ' + q.options[q.answer] + '\n' + 'The course\'s explanation: ' + q.explain + '\n\n' +
      'Please help me learn from this mistake:\n1. The likely misconception: what wrong idea probably made me pick my answer?\n' +
      '2. A plain explanation of the right idea, with an everyday example.\n' +
      '3. One similar practice question with 4 options. Put its answer and a one-line reason at the very end, after the word "Answer:", so I can try it first.';
  }
  function onMistakesClick(ev) {
    var b = ev.target.closest && ev.target.closest('[data-ms]'); if (!b || !ms) return;
    var a = b.getAttribute('data-ms');
    if (a === 'retest') startRetest();
    else if (a === 'stop') stopRetest();
  }
  function startRetest() {
    var open = openMistakes();
    if (!open.length) return;
    // first those a right answer can move towards fixed now, oldest wrong first; then mixed by module
    var can = {}; open.forEach(function (i) { can[i.q.id] = fixInfo(i.x).now ? 1 : 0; });
    open.sort(function (a, b) { return can[b.q.id] - can[a.q.id] || String(a.x.wrongAt).localeCompare(String(b.x.wrongAt)); });
    var qs = interleave(open.slice(0, RETEST_MAX).map(function (i) { return i.q; }));
    if (ms.quiz) ms.quiz.destroy();
    ms.results = []; ms.qs = qs;
    $('ms-top').hidden = true; $('ms-lists').hidden = true;
    $('ms-run').hidden = false;
    $('ms-run-sub').textContent = plural(qs.length, 'question') + ' you got wrong before. Take your time and read each explanation.';
    var root = $('ms-quiz');
    if (!root._msRetry) { root.addEventListener('click', function (ev) { if (ms && ev.target.closest && ev.target.closest('[data-q="retry"]')) ms.results = []; }, true); root._msRetry = true; }
    ms.quiz = new C.Quiz(root, { questions: qs, mode: 'learn', key: 'mistakes', confidence: true,
      onAnswer: function (r) {
        var before = S().qa[r.q.id], wasOpen = ST.isMistake(before), x = ST.recordAnswer(r.q.id, r.correct, r.sure, 'mistakes', r.picked);
        if (ms) ms.results.push({ id: r.q.id, right: !!r.correct, fixed: wasOpen && !ST.isMistake(x) });
      },
      onFinish: function () { C.logActivity(); C.save(); Promise.resolve().then(finishRetest); } });
    focusEl($('ms-run-h'));
    announce('ms-live', 'Re-test started: ' + plural(qs.length, 'question') + '.');
  }
  function finishRetest() {
    if (!ms) return;
    var root = $('ms-quiz'), box = root && root.querySelector('.score-box'); if (!box) return;
    var last = {}; ms.results.forEach(function (r) { last[r.id] = r; });
    var rs = Object.keys(last).map(function (k) { return last[k]; });
    var fixedNow = rs.filter(function (r) { return r.fixed; }).length;
    var stillOpen = rs.filter(function (r) { return r.right && !r.fixed && ST.isMistake(S().qa[r.id]); }).length;
    var wrong = rs.filter(function (r) { return !r.right; }).length;
    var them = stillOpen === 1 ? 'it' : 'them';
    var sec = document.createElement('section');
    sec.className = 'card stack-sm ms-res'; sec.setAttribute('aria-labelledby', 'ms-res-h');
    sec.innerHTML = '<h3 id="ms-res-h">What changed</h3><ul class="ms-res-list">' +
      '<li id="ms-res-fixed"><strong class="num">' + fixedNow + '</strong> fixed now (right on two different days)</li>' +
      '<li id="ms-res-wait"><strong class="num">' + stillOpen + '</strong> right, not fixed yet: answer ' + them + ' right again on another day, at least 12 hours later</li>' +
      '<li id="ms-res-wrong"><strong class="num">' + wrong + '</strong> still wrong: open the explanation and try again</li></ul>' +
      '<div class="row"><button type="button" class="btn btn-primary" data-ms="stop">Back to the notebook</button></div>';
    box.parentNode.insertBefore(sec, box.nextSibling);
    box.tabIndex = -1; focusEl(box);
  }
  function stopRetest() {
    if (ms.quiz) { ms.quiz.destroy(); ms.quiz = null; }
    $('ms-run').hidden = true; $('ms-quiz').innerHTML = '';
    $('ms-top').hidden = false; $('ms-lists').hidden = false;
    drawLists();
    focusEl($('ms-top-h'));
  }

  /* =================== Study room cards =================== */
  function mixedHubLine() {
    var n = startedModules().length;
    if (n < MIN_MODULES) return 'Start ' + (n ? 'one more module' : 'two modules') + ' to unlock mixed practice.';
    var w = weakest();
    return w && w.kind === 'topic' ? 'Weakest topic so far: <strong>' + esc(w.topic) + '</strong> (' + esc(A().modNo(w.m)) + '), right ' + w.r + ' of ' + w.n + '.'
      : 'Ready: questions from ' + plural(n, 'module') + ' you have started.';
  }
  function mistakesHubLine() {
    var n = openMistakes().length, f = fixedMistakes().length;
    return n ? '<strong class="num">' + plural(n, 'open mistake') + '</strong>' + (f ? ' · ' + f + ' fixed recently' : '') : f ? 'No open mistakes · ' + f + ' fixed recently.' : 'No mistakes saved yet.';
  }
  ST.addHubCard(40, function () {
    if (!A()) return '';
    var ready = startedModules().length >= MIN_MODULES;
    return '<article class="card mx-hub" aria-labelledby="mx-hub-h"><h2 class="h-sub" id="mx-hub-h">Mixed practice</h2>' +
      '<p class="small">Interleaved practice and practice testing</p>' +
      '<p class="small muted">One quiz that mixes questions from every module you have started, with more on your weak spots.</p>' +
      '<p id="mx-hub-line">' + mixedHubLine() + '</p>' +
      '<div class="row"><a class="btn' + (ready ? ' btn-primary' : '') + '" href="#mixed">' + (ready ? 'Start mixed practice' : 'Open mixed practice') + '</a></div></article>';
  });
  ST.addHubCard(50, function () {
    if (!A()) return '';
    return '<article class="card ms-hub" aria-labelledby="ms-hub-h"><h2 class="h-sub" id="ms-hub-h">Mistakes notebook</h2>' +
      '<p class="small">Error-based learning</p>' +
      '<p class="small muted">Every question you got wrong, with the right answer and why. Fix each one by answering it right on two different days.</p>' +
      '<p id="ms-hub-line">' + mistakesHubLine() + '</p>' +
      '<div class="row"><a class="btn" href="#mistakes">Open my mistakes</a></div></article>';
  });
  // the hub cards were drawn before the study index (topics) may have loaded: fill in the weakest topic once it is there
  ST.on('hub', function () {
    var up = function () { var a = $('mx-hub-line'), b = $('ms-hub-line'); if (a && a.isConnected) a.innerHTML = mixedHubLine(); if (b && b.isConnected) b.innerHTML = mistakesHubLine(); };
    ST.ensureData().then(up, up);
  });

  // for tests
  ST._practice = { startedModules: startedModules, lastTouch: lastTouch, poolFor: poolFor, weight: function (q) { return weight(q, accuracy(), Date.now()); },
    pick: pick, interleave: interleave, modOf: modOf, rightDays: rightDays, calGroups: calGroups, calOverTime: calOverTime, calMeaning: calMeaning,
    parseQuestions: parseQuestions, weakest: weakest, fixInfo: fixInfo, fixedAt: fixedAt, fixLine: fixLine,
    current: function () { return { mixed: mx && mx.qs ? mx.qs.map(function (q) { return q.id; }) : null, retest: ms && ms.qs ? ms.qs.map(function (q) { return q.id; }) : null }; },
    openMistakes: openMistakes, fixedMistakes: fixedMistakes, errPrompt: errPrompt, copyPrompt: copyPrompt, jsonPrompt: jsonPrompt };
})();
