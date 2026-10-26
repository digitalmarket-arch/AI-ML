/* AI Marg study feature: Daily review (Smarana): spaced repetition of key terms and lesson-card recall questions; retention tracking.
   Uses window.AIM_STUDY (assets/js/study.js) and window.AIM_APP (assets/js/app.js). */
(function () {
  'use strict';
  var ST = window.AIM_STUDY; if (!ST) return; // study features are switched off in this browser
  var C = window.AIM_CORE, D = window.AIM || {};
  var esc = C.esc, inline = C.inline;
  var A = function () { return window.AIM_APP; };
  var S = function () { return C.state; };
  var $ = function (id) { return document.getElementById(id); };

  var READ_ORDER = ['overview', 'outcomes', 'studySteps', 'keyTerms', 'indiaExample', 'commonMistakes', 'selfCheck'];
  var NEW_DEFAULT = 15, NEW_MIN = 5, NEW_MAX = 50;
  var AGAIN_GAP = 3;          // a forgotten card comes back after this many other cards (or at the end)
  var MIN_CARDS = 5;          // reviewed cards needed before the predicted recall is shown
  var MIN_WEEK_REVIEWS = 10;  // reviews in the last 8 weeks needed before the weekly chart is shown
  var GRADES = [null, ['Again', 'You forgot it'], ['Hard', 'You got it, with effort'], ['Good', 'You remembered it'], ['Easy', 'It came at once']];

  /* ---------- device preferences (C.state.prefs.study) ---------- */
  function prefs() {
    var p = S().prefs;
    if (!p.study || typeof p.study !== 'object' || Array.isArray(p.study)) p.study = {};
    return p.study;
  }
  function newPerDay() {
    var n = Math.round(Number(prefs().newPerDay));
    return isFinite(n) && n >= NEW_MIN && n <= NEW_MAX ? n : NEW_DEFAULT;
  }
  // new cards first reviewed today on this device (the daily limit counts cards, not presses)
  function newSeenToday() {
    var x = prefs().newToday;
    return x && x.day === ST.today() && Array.isArray(x.ids) ? x.ids.filter(function (i) { return typeof i === 'string'; }) : [];
  }
  function setNewSeen(ids) { prefs().newToday = { day: ST.today(), ids: ids.slice(-200) }; }

  /* ---------- cards ---------- */
  var dataState = 'idle', dataErr = '';
  function loadData() {
    return ST.ensureData().then(function () { dataState = 'ok'; }, function (e) { dataState = 'fail'; dataErr = (e && e.message) || 'Study content did not load.'; });
  }
  function parts(id) { var p = String(id).split(':'); return { kind: p[0], mid: p[1] || '', key: p.slice(2).join(':') }; }
  // can this card be shown? (a recall card needs its module's study content)
  function live(id) {
    if (!A()) return true;
    if (parts(id).kind === 'rc' && !D.study) return dataState !== 'fail';
    return !!ST.reviewItem(id);
  }
  function ktIds(m) { return (m.keyTerms || []).map(function (t, i) { return 'kt:' + m.id + ':' + i; }); }
  function hasRecall(mid, key) { var md = ST.modData(mid); return !!(md && md.cards && md.cards[key]); }
  function orderKey(id) {
    var p = parts(id), app = A(), m = app && app.modById[p.mid];
    var ci = p.kind === 'rc' ? READ_ORDER.indexOf(p.key) : 20 + (Number(p.key) || 0);
    return (m ? m._i : 999) * 1000 + (ci < 0 ? 19 : ci);
  }
  function byDue(st) {
    return function (x, y) { var a = st.srs[x], b = st.srs[y]; return a.due.localeCompare(b.due) || a.s - b.s || orderKey(x) - orderKey(y); };
  }
  function byNew(st) {
    return function (x, y) { return String(st.srs[x].at).localeCompare(String(st.srs[y].at)) || orderKey(x) - orderKey(y); };
  }
  // what today's review holds: due = seen before and due now; fresh = never reviewed; newToday = the fresh cards allowed today
  function counts() {
    var st = S(), t = ST.today(), due = [], fresh = [], active = 0;
    Object.keys(st.srs).forEach(function (id) {
      var c = st.srs[id]; if (!c || c.off || !live(id)) return;
      active++;
      if (!c.reps) fresh.push(id); else if (c.due <= t) due.push(id);
    });
    due.sort(byDue(st)); fresh.sort(byNew(st));
    var quota = Math.max(0, newPerDay() - newSeenToday().length);
    return { due: due, fresh: fresh, newToday: fresh.slice(0, quota), quota: quota, active: active };
  }
  // the next day with work after today: reviews already planned, or new cards that wait for tomorrow
  function nextInfo(cn) {
    var st = S(), t = ST.today(), best = null, n = 0;
    Object.keys(st.srs).forEach(function (id) { var c = st.srs[id]; if (c && !c.off && c.reps && c.due > t && live(id) && (!best || c.due < best)) best = c.due; });
    if (best) Object.keys(st.srs).forEach(function (id) { var c = st.srs[id]; if (c && !c.off && c.reps && c.due === best && live(id)) n++; });
    var waiting = cn.fresh.length - cn.newToday.length, tomorrow = ST.addDays(t, 1);
    if (waiting > 0 && (!best || best > tomorrow)) return { day: tomorrow, reviews: 0, fresh: Math.min(waiting, newPerDay()) };
    return { day: best, reviews: n, fresh: waiting > 0 && best === tomorrow ? Math.min(waiting, newPerDay()) : 0 };
  }

  /* ---------- the next interval for each grade: the same sums as ST.schedule, on a copy ---------- */
  function fnv(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
  function previewDays(id, grade) {
    var c = S().srs[id] || { s: 0, d: 5, reps: 0, lapses: 0 }, t = ST.today();
    var d = Math.max(1, Math.min(10, (c.d || 5) + (3 - grade) * 0.7));
    var s;
    if (grade === 1) s = 0;
    else if (!c.reps || !c.s) s = [0, 0, 1, 3, 6][grade];
    else {
      var since = c.last ? Math.max(1, ST.daysBetween(c.last, t)) : c.s;
      var base = Math.max(c.s, Math.min(since, c.s * 2));
      var mult = { 2: 1.2, 3: 2.3, 4: 3.3 }[grade] * (1.15 - 0.03 * d);
      s = Math.min(365, Math.max(1, base * mult));
    }
    if (s >= 3) s = s * (0.95 + 0.1 * fnv(id + t));
    return Math.round(s);
  }
  function gapText(n) { return n <= 0 ? 'later today' : n === 1 ? '1 day' : n + ' days'; }

  /* ---------- dates ---------- */
  function fmtDay(d) {
    try { return new Date(d + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }); } catch (e) { return d; }
  }
  function dayLabel(d) {
    var n = ST.daysBetween(ST.today(), d);
    return n <= 0 ? 'today' : n === 1 ? 'tomorrow (' + fmtDay(d) + ')' : fmtDay(d);
  }
  function shortDate(d) { var x = new Date(d + 'T12:00:00'); return [x.getDate(), x.toLocaleDateString('en-IN', { month: 'short' })]; }
  function weekStart(d) { var wd = (new Date(d + 'T12:00:00').getDay() + 6) % 7; return ST.addDays(d, -wd); } // Monday
  var plural = function (n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); };

  /* ---------- small UI pieces ---------- */
  function stat(k, v, id) { return '<div class="stat"' + (id ? ' id="' + id + '"' : '') + '><div class="k">' + esc(k) + '</div><div class="v">' + esc(String(v)) + '</div></div>'; }
  function modLabel(m) { return 'Module ' + A().modNo(m) + ' · ' + m.title; }
  var timers = [];
  function announce(msg) {
    var el = $('rv-live'); if (!el) return;
    el.textContent = '';
    timers.push(setTimeout(function () { el.textContent = msg; }, 60));
  }
  function focusEl(el) { if (!el) return; try { el.focus({ preventScroll: false }); } catch (e) { el.focus(); } }

  /* ---------- auto-add: ticking Got it on a lesson card adds its recall question (and the key terms) ---------- */
  function footNote(m, key, text) {
    if (!text) return;
    var side = $('mod-side'); if (side && side.getAttribute('data-mod') !== m.id) return;
    var card = $('read-' + key), foot = card && card.querySelector('.read-foot'); if (!foot) return;
    var el = foot.querySelector('.rv-added');
    if (!el) { el = document.createElement('span'); el.className = 'small rv-added'; foot.appendChild(el); }
    el.innerHTML = '<span aria-hidden="true">✓ </span>' + text;
  }
  ST.on('card-read', function (m, key, on) {
    if (!on || !m || !key) return;
    var done = function () {
      var ids = key === 'keyTerms' ? ktIds(m) : [];
      if (hasRecall(m.id, key)) ids.unshift('rc:' + m.id + ':' + key);
      // a card the learner removed stays removed (it can be added again with "Add a module")
      var st = S(), before = ids.filter(function (id) { return st.srs[id] && !st.srs[id].off; }).length;
      ids = ids.filter(function (id) { return !(st.srs[id] && st.srs[id].off); });
      if (!ids.length) return;
      var n = ST.enroll(ids);
      footNote(m, key, n ? 'Added ' + plural(n, 'card') + ' to your <a href="#review">daily review</a>.' : before ? 'Already in your <a href="#review">daily review</a>.' : '');
      refreshHub();
    };
    ST.ensureData().then(done, done);
  });

  // one-time catch-up for cards ticked before this feature existed
  var migTries = 0;
  function migrate() {
    var app = A();
    if (!app) { if (++migTries < 40) setTimeout(migrate, 50); return; }
    if (prefs().srsMig) return;
    var kt = [], rc = [];
    D.modules.forEach(function (m) {
      app.readCards(m).forEach(function (c) {
        if (!app.readOn(m.id, c.key)) return;
        rc.push([m.id, c.key]);
        if (c.key === 'keyTerms') kt = kt.concat(ktIds(m));
      });
    });
    if (!rc.length) { prefs().srsMig = 1; C.save(); return; }
    ST.ensureData().then(function () {
      var st = S(), ids = rc.filter(function (x) { return hasRecall(x[0], x[1]); }).map(function (x) { return 'rc:' + x[0] + ':' + x[1]; }).concat(kt);
      ids = ids.filter(function (id) { return !st.srs[id]; }); // never bring back a card that was removed
      if (ids.length) ST.enroll(ids);
      prefs().srsMig = 1; C.save();
      refreshHub();
      if (page && !sess) drawAll();
    }, function () { /* try again on the next visit */ });
  }
  setTimeout(migrate, 0);

  /* ---------- the review page (#review) ---------- */
  var page = null, sess = null;
  function viewReview() {
    var app = A();
    if (!app) { // the first page drawn on load runs before AIM_APP exists: draw just after
      setTimeout(function () { if (A() && /^#?review$/.test(location.hash)) viewReview(); }, 0);
      return;
    }
    var token = {};
    app.setView('<div class="wrap stack-lg rv-page">' + app.crumbs([['Home', 'home'], ['Study room', 'study'], ['Daily review']]) +
      '<header class="stack-sm"><h1>Daily review</h1>' +
      '<p class="lede prose">' + ST.sans('smarana') + '. Pulling an answer out of your memory makes it stronger than reading it again, and reviewing it just before you would forget makes it last.</p>' +
      '<p class="small muted prose">Methods used here: active recall, adaptive spaced repetition (cards you find hard come back sooner, easy ones wait longer) and long-term retention tracking. <a href="#methods">How these methods work</a></p></header>' +
      '<div id="rv-main" class="stack-lg"><p class="muted">Loading your review cards…</p></div></div>', 'Daily review');
    page = { token: token, observer: null };
    sess = null;
    $('rv-main').addEventListener('click', onClick);
    var onKey = function (ev) { keydown(ev); };
    document.addEventListener('keydown', onKey);
    app.onLeave(function () {
      document.removeEventListener('keydown', onKey);
      timers.forEach(clearTimeout); timers = [];
      if (page && page.observer) page.observer.disconnect();
      if (page && page.token === token) { page = null; sess = null; }
    });
    loadData().then(function () { if (page && page.token === token) drawAll(); });
  }
  ST.addRoute('review', viewReview, 'study');

  function drawAll() {
    var root = $('rv-main'); if (!root) return;
    root.innerHTML = (dataState === 'fail' ? '<div class="callout" role="alert">' + esc(dataErr) + ' Key-term cards still work; lesson-card questions come back when the content loads.</div>' : '') +
      '<section class="card stack rv-today" id="rv-today" aria-labelledby="rv-today-h"></section>' +
      '<p class="visually-hidden" id="rv-live" aria-live="polite"></p>' +
      '<div id="rv-more" class="stack-lg">' +
      '<section class="card stack rv-ret" id="rv-ret" aria-labelledby="rv-ret-h"></section>' +
      '<div class="grid rv-two"><section class="card stack-sm" id="rv-add" aria-labelledby="rv-add-h"></section>' +
      '<section class="card stack-sm" id="rv-ai" aria-labelledby="rv-ai-h"></section></div></div>';
    drawToday(); drawRet(); drawAdd(); drawAI();
  }

  /* ----- today ----- */
  function drawToday(focusHead) {
    var box = $('rv-today'); if (!box) return;
    var npd = newPerDay(), opts = '';
    for (var i = NEW_MIN; i <= NEW_MAX; i += 5) opts += '<option value="' + i + '"' + (i === npd ? ' selected' : '') + '>' + i + '</option>';
    box.classList.remove('rv-narrow');
    box.innerHTML = '<div class="row-between"><h2 class="h-sub" id="rv-today-h" tabindex="-1">Today\'s review</h2>' +
      '<div class="row rv-npd"><label for="rv-npd" class="small">New cards a day</label><select id="rv-npd">' + opts + '</select></div></div>' +
      '<div id="rv-today-body" class="stack">' + todayBody() + '</div>';
    $('rv-npd').addEventListener('change', function () {
      var v = Number(this.value); prefs().newPerDay = v; C.save();
      $('rv-today-body').innerHTML = todayBody(); drawRet(); refreshHub();
      announce('Up to ' + v + ' new cards a day.');
    });
    if (focusHead) focusEl($('rv-today-h'));
  }
  function todayBody() {
    var cn = counts(), npd = newPerDay(), n = cn.due.length + cn.newToday.length;
    if (!cn.active) {
      return '<div class="empty stack-sm rv-empty"><p><strong>Nothing to review yet.</strong></p>' +
        '<p>Tick <strong>Got it</strong> on lesson cards, or add a module below. Each lesson card you tick adds its recall question here, and the Key terms card adds the module\'s key terms.</p>' +
        '<div class="row rv-center"><a class="btn btn-sm" href="#roadmap">Open the roadmap</a></div></div>';
    }
    var stats = '<div class="lab-stats">' + stat('Due today', cn.due.length) + stat('New today', cn.newToday.length) + stat('New cards waiting', cn.fresh.length) + stat('Cards in review', cn.active) + '</div>';
    var wait = cn.fresh.length - cn.newToday.length;
    var expl = '<p class="small muted prose"><strong>Due today</strong>: cards you have reviewed before whose review day has come. <strong>New today</strong>: cards you have not seen yet; up to ' + npd + ' join each day so the review stays short' +
      (wait > 0 ? ', and the other ' + plural(wait, 'new card') + ' wait for the coming days' : '') + '.</p>';
    if (!n) {
      var nx = nextInfo(cn), what = [];
      if (nx.reviews) what.push(plural(nx.reviews, 'card') + ' due');
      if (nx.fresh) what.push('up to ' + plural(nx.fresh, 'new card'));
      return stats + '<div class="rv-done"><p><strong>All done for today.</strong> Next review: ' + (nx.day ? esc(dayLabel(nx.day)) + (what.length ? ' (' + what.join(', ') + ')' : '') : 'none planned') + '.</p></div>' + expl;
    }
    return stats + expl + '<div class="row"><button type="button" class="btn btn-primary" data-rv="start">Start review (' + plural(n, 'card') + ')</button>' +
      '<span class="small muted">One card at a time. Each answer is saved as you go.</span></div>';
  }

  /* ----- the session ----- */
  function startSession() {
    var cn = counts(), q = cn.due.concat(cn.newToday);
    if (!q.length) return;
    sess = { queue: q, total: q.length, cleared: {}, first: {}, again: {}, reviews: 0, shown: false, undo: null };
    var more = $('rv-more'); if (more) more.hidden = true;
    drawCard(true);
  }
  function drawCard(focusFront) {
    var box = $('rv-today'); if (!box || !sess) return;
    var id = sess.queue[0];
    if (!id) return finish(false);
    var it = ST.reviewItem(id), app = A();
    if (!it) { sess.queue.shift(); if (!sess.cleared[id]) sess.total = Math.max(0, sess.total - 1); return drawCard(focusFront); }
    var m = app.modById[it.mid], c = S().srs[id] || {};
    var done = Object.keys(sess.cleared).length, again = sess.queue.filter(function (x) { return sess.again[x]; }).length;
    var cardTitle = it.kind === 'recall' ? ((app.readCards(m).filter(function (x) { return x.key === it.card; })[0] || {}).title || '') : '';
    var grades = [1, 2, 3, 4].map(function (g) {
      var n = previewDays(id, g), due = ST.addDays(ST.today(), n);
      return '<button type="button" class="btn rv-g rv-g' + g + '" data-rv="grade" data-g="' + g + '" aria-keyshortcuts="' + g + '" title="' + esc(GRADES[g][1] + '. ' + (n ? 'Next review on ' + fmtDay(due) : 'Comes back later in this session')) + '">' +
        '<span class="rv-g-l">' + GRADES[g][0] + '</span><span class="visually-hidden">: next review ' + (n ? 'in ' : '') + '</span><span class="rv-g-h">' + gapText(n) + '</span><kbd aria-hidden="true">' + g + '</kbd></button>';
    }).join('');
    box.innerHTML = '<div class="row-between"><h2 class="h-sub" id="rv-today-h" tabindex="-1">Review session</h2>' +
      '<span class="small muted num" id="rv-prog">' + done + ' of ' + plural(sess.total, 'card') + ' done' + (again ? ' · ' + again + ' to see again' : '') + '</span></div>' +
      app.bar(sess.total ? Math.round(done / sess.total * 100) : 0, 'Review progress') +
      '<div class="rv-card stack" data-card="' + esc(id) + '">' +
      '<div class="row-between rv-meta"><a class="small" href="#m-' + esc(m.id) + '">' + esc(modLabel(m)) + '</a><span class="row">' +
      (c.reps ? '' : '<span class="chip chip-en-in">New</span>') + (sess.again[id] ? '<span class="chip chip-bad">Again</span>' : '') +
      '<span class="chip">' + (it.kind === 'term' ? 'Key term' : 'Recall question' + (cardTitle ? ': ' + esc(cardTitle) : '')) + '</span></span></div>' +
      '<p class="eyebrow" id="rv-ask">' + esc(it.ask) + '</p>' +
      '<div class="rv-front ' + (it.kind === 'term' ? 'is-term' : 'is-q') + '" id="rv-front" tabindex="-1">' + inline(it.front) + '</div>' +
      '<div class="stack-sm" id="rv-q-side"><p class="small muted">Try to answer in your head (or say it aloud), then show the answer.</p>' +
      '<div class="row"><button type="button" class="btn btn-primary" data-rv="show" aria-keyshortcuts="Space">Show answer</button><span class="kbd-hint">or press <kbd>Space</kbd></span></div></div>' +
      '<div class="stack" id="rv-a-side" hidden><div class="rv-back stack-sm" id="rv-back" tabindex="-1" role="group" aria-labelledby="rv-back-h"><h3 class="eyebrow" id="rv-back-h">Answer</h3><div class="prose">' + C.md(it.back) + '</div></div>' +
      '<div class="stack-sm"><p id="rv-gq"><strong>How well did you remember it?</strong></p>' +
      '<div class="rv-grades" role="group" aria-labelledby="rv-gq">' + grades + '</div>' +
      '<p class="small muted">Again: you forgot. Hard: you got it with effort. Good: you remembered. Easy: it came at once. Be honest: the timing works only if the grades are true.</p>' +
      '<p class="kbd-hint">Keys <kbd>1</kbd> to <kbd>4</kbd> pick a grade.</p></div></div></div>' +
      '<div class="row-between rv-tools"><div class="row">' + (sess.undo ? '<button type="button" class="btn btn-sm btn-ghost" data-rv="undo">Undo last grade</button>' : '') + '</div>' +
      '<div class="row"><button type="button" class="btn btn-sm btn-ghost" data-rv="remove">Remove from review</button><button type="button" class="btn btn-sm" data-rv="stop">Stop for now</button></div></div>';
    box.classList.add('rv-narrow');
    sess.shown = false;
    if (focusFront) focusEl($('rv-front'));
  }
  function reveal() {
    if (!sess || sess.shown) return;
    var q = $('rv-q-side'), a = $('rv-a-side'); if (!q || !a) return;
    sess.shown = true; q.hidden = true; a.hidden = false;
    focusEl($('rv-back'));
  }
  function grade(g) {
    if (!sess || !sess.shown || !(g >= 1 && g <= 4)) return;
    var id = sess.queue[0], st = S(), t = ST.today(); if (!id) return;
    var prev = st.srs[id] ? JSON.parse(JSON.stringify(st.srs[id])) : null, seen = newSeenToday();
    sess.undo = { id: id, day: t, prev: prev, prevLog: st.rlog[t] ? st.rlog[t].slice() : null, prevSeen: seen.slice(),
      queue: sess.queue.slice(), cleared: Object.assign({}, sess.cleared), first: Object.assign({}, sess.first), again: Object.assign({}, sess.again), reviews: sess.reviews };
    if ((!prev || !prev.reps) && seen.indexOf(id) < 0) { seen.push(id); setNewSeen(seen); }
    var entry = ST.schedule(id, g); // saves the card, the day's log and the preference above
    sess.reviews++;
    if (!Object.prototype.hasOwnProperty.call(sess.first, id)) sess.first[id] = g;
    sess.queue.shift();
    if (g === 1) { sess.again[id] = 1; sess.queue.splice(Math.min(sess.queue.length, AGAIN_GAP), 0, id); }
    else { sess.cleared[id] = 1; delete sess.again[id]; }
    var n = ST.daysBetween(t, entry.due);
    announce(GRADES[g][0] + '. ' + (g === 1 ? 'This card comes back later in this session.' : 'Next review ' + (n === 1 ? 'tomorrow.' : 'in ' + n + ' days.')));
    drawCard(true);
  }
  function undo() {
    var u = sess && sess.undo; if (!u) return;
    var st = S();
    if (u.prev) { var e = Object.assign({}, u.prev); e.at = ST.now(); st.srs[u.id] = e; }
    if (u.prevLog) st.rlog[u.day] = u.prevLog; else delete st.rlog[u.day];
    if (u.day === ST.today()) setNewSeen(u.prevSeen);
    C.save();
    sess.queue = u.queue; sess.cleared = u.cleared; sess.first = u.first; sess.again = u.again; sess.reviews = u.reviews; sess.undo = null;
    announce('Last grade undone. Grade the card again.');
    drawCard(true);
  }
  function removeCard() {
    if (!sess) return;
    var id = sess.queue[0]; if (!id) return;
    ST.unenroll(id);
    sess.queue = sess.queue.filter(function (x) { return x !== id; });
    if (!sess.cleared[id]) sess.total = Math.max(0, sess.total - 1);
    delete sess.again[id]; sess.undo = null;
    refreshHub();
    announce('Removed from your review. Add its module again below if you want it back.');
    drawCard(true);
  }
  function finish(stopped) {
    var box = $('rv-today'); if (!box || !sess) return;
    var ids = Object.keys(sess.first), n = ids.length, ok = ids.filter(function (id) { return sess.first[id] >= 2; }).length;
    var reps = sess.reviews; sess = null;
    var cn = counts(), left = cn.due.length + cn.newToday.length, nx = left ? null : nextInfo(cn);
    var next = left ? 'today (' + plural(left, 'card') + ' still waiting)' : nx.day ? dayLabel(nx.day) : 'none planned';
    box.innerHTML = '<h2 class="h-sub" id="rv-today-h" tabindex="-1">' + (stopped ? 'Stopped for now' : 'Review done') + '</h2>' +
      '<div class="lab-stats">' + stat('Cards reviewed', n) + stat('Remembered first time', n ? Math.round(ok / n * 100) + '%' : '–') + stat('Next review', left ? 'Today' : nx.day ? fmtDay(nx.day) : '–') + '</div>' +
      '<p class="prose">' + (n ? 'You remembered ' + ok + ' of ' + plural(n, 'card') + ' on the first try' + (reps > n ? ' (' + reps + ' answers in all, counting cards you saw again)' : '') + '. Cards you found hard come back sooner; easy ones wait longer.' : 'No cards were reviewed this time.') +
      ' Next review: ' + esc(next) + '.</p>' +
      '<div class="row"><button type="button" class="btn btn-primary" data-rv="home">Back to today\'s review</button><a class="btn" href="#study">Study room</a></div>';
    var more = $('rv-more'); if (more) more.hidden = false;
    drawRet(); drawAdd(); refreshHub();
    focusEl($('rv-today-h'));
  }
  function keydown(ev) {
    if (!sess || ev.ctrlKey || ev.metaKey || ev.altKey || ev.repeat) return;
    var t = ev.target, tag = (t && t.tagName) || '';
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || (t && t.isContentEditable)) return;
    if (!$('rv-front')) return;
    if (!sess.shown && (ev.key === ' ' || ev.key === 'Spacebar')) {
      if (/^(BUTTON|SUMMARY)$/.test(tag)) return; // a focused button handles Space itself
      ev.preventDefault(); reveal(); return;
    }
    if (sess.shown && /^[1-4]$/.test(ev.key)) { ev.preventDefault(); grade(Number(ev.key)); }
  }
  function onClick(ev) {
    var b = ev.target.closest && ev.target.closest('[data-rv]'); if (!b || !$('rv-main') || !$('rv-main').contains(b)) return;
    var a = b.getAttribute('data-rv');
    if (a === 'start') startSession();
    else if (a === 'show') reveal();
    else if (a === 'grade') grade(Number(b.getAttribute('data-g')));
    else if (a === 'undo') undo();
    else if (a === 'remove') removeCard();
    else if (a === 'stop') finish(true);
    else if (a === 'home') drawToday(true);
    else if (a === 'add') addModule(b.getAttribute('data-mid'));
  }

  /* ----- retention panel ----- */
  function weeks() {
    var st = S(), t = ST.today(), w0 = weekStart(t), out = [];
    for (var k = 7; k >= 0; k--) {
      var start = ST.addDays(w0, -7 * k), n = 0, ok = 0;
      for (var i = 0; i < 7; i++) { var d = ST.addDays(start, i); if (d > t) break; var lg = st.rlog[d]; if (lg) { n += lg[0]; ok += lg[1]; } }
      out.push({ start: start, n: n, ok: ok, pct: n ? Math.round(ok / n * 100) : null, now: k === 0 });
    }
    return out;
  }
  function colPath(x, y, w, h) {
    var r = Math.min(4, h, w / 2), b = y + h;
    return 'M' + x + ',' + b + 'V' + (y + r) + 'Q' + x + ',' + y + ' ' + (x + r) + ',' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) + 'V' + b + 'Z';
  }
  function weekName(w) { var sd = shortDate(w.start); return 'Week of ' + sd[0] + ' ' + sd[1] + (w.now ? ' (this week)' : ''); }
  function chartSVG(ws) {
    var W = 288, top = 24, base = 124, H = 160, slot = (W - 8) / ws.length, bw = 20;
    var desc = ws.map(function (w) { return weekName(w) + ': ' + (w.n ? w.pct + '% of ' + plural(w.n, 'review') : 'no reviews'); }).join('. ') + '.';
    var g = '<line class="rv-axis" x1="4" x2="' + (W - 4) + '" y1="' + base + '" y2="' + base + '"/>';
    ws.forEach(function (w, i) {
      var cx = 4 + slot * i + slot / 2, x = cx - bw / 2, sd = shortDate(w.start);
      if (w.n) {
        var h = Math.max(2, Math.round((base - top) * w.pct / 100)), y = base - h;
        g += '<g class="rv-col"><title>' + esc(weekName(w) + ': ' + w.pct + '% remembered (' + w.ok + ' of ' + plural(w.n, 'review') + ')') + '</title>' +
          '<rect class="rv-hit" x="' + (cx - slot / 2) + '" y="' + top + '" width="' + slot + '" height="' + (base - top) + '"/>' +
          '<path class="rv-bar" d="' + colPath(x, y, bw, h) + '"/>' +
          '<text class="rv-cap" x="' + cx + '" y="' + (y - 5) + '" text-anchor="middle">' + w.pct + '%</text></g>';
      } else {
        g += '<g><title>' + esc(weekName(w) + ': no reviews') + '</title><text class="rv-tick" x="' + cx + '" y="' + (base - 6) + '" text-anchor="middle">–</text></g>';
      }
      g += '<text class="rv-lab' + (w.now ? ' is-now' : '') + '" x="' + cx + '" y="' + (base + 16) + '" text-anchor="middle">' + sd[0] + '</text>' +
        '<text class="rv-lab' + (w.now ? ' is-now' : '') + '" x="' + cx + '" y="' + (base + 30) + '" text-anchor="middle">' + esc(sd[1]) + '</text>';
    });
    return '<svg class="rv-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-labelledby="rv-wk-t rv-wk-d" focusable="false"><title id="rv-wk-t">Percent of review answers remembered each week, last 8 weeks (bars show weeks starting on Monday)</title><desc id="rv-wk-d">' + esc(desc) + '</desc>' + g + '</svg>';
  }
  function drawRet() {
    var box = $('rv-ret'); if (!box) return;
    var st = S(), t = ST.today(), ret = ST.retention(), stg = { learn: 0, mat: 0, long: 0, fresh: 0 };
    Object.keys(st.srs).forEach(function (id) {
      var c = st.srs[id]; if (!c || c.off) return;
      if (!c.reps) stg.fresh++; else if (c.s < 7) stg.learn++; else if (c.s < 21) stg.mat++; else stg.long++;
    });
    var reviewed = stg.learn + stg.mat + stg.long;
    var recall = ret.avg != null && ret.n >= MIN_CARDS
      ? '<p class="rv-big"><span class="rv-big-v">' + Math.round(ret.avg * 100) + '%</span> <span class="muted">predicted recall today</span></p>' +
        '<p class="small muted prose">If you were quizzed on your ' + plural(ret.n, 'reviewed card') + ' right now, you would probably remember about ' + Math.round(ret.avg * ret.n) + ' of them. The estimate comes from how long each card has rested since its last review and how strong it was then. It falls a little every day and rises when you review.</p>'
      : '<p class="rv-big"><span class="muted">Predicted recall today: not enough reviews yet.</span></p><p class="small muted prose">Review at least ' + MIN_CARDS + ' cards' + (ret.n ? ' (you have reviewed ' + ret.n + ')' : '') + ' to see how much of what you studied you would remember today.</p>';
    var stages = '<div class="lab-stats">' + stat('Learning', stg.learn, 'rv-st-learn') + stat('Maturing', stg.mat, 'rv-st-mat') + stat('Long-term', stg.long, 'rv-st-long') + stat('Not yet reviewed', stg.fresh, 'rv-st-new') + '</div>' +
      '<p class="small muted prose">Each card has a memory strength: about how many days you can wait before your chance of recalling it falls to 9 in 10. <strong>Learning</strong> cards are under 7 days, <strong>maturing</strong> cards 7 to 20 days and <strong>long-term</strong> cards 21 days or more. Cards grow stronger each time you remember them and go back to learning when you forget.</p>';
    var ws = weeks(), total = ws.reduce(function (s, w) { return s + w.n; }, 0);
    var chart = total >= MIN_WEEK_REVIEWS
      ? '<figure class="rv-fig stack-sm">' + chartSVG(ws) + '<figcaption class="small muted">The share of your review answers graded Hard, Good or Easy (remembered) each week. A dash means no reviews that week.</figcaption></figure>' +
        '<details class="rv-tbl"><summary>Show these numbers as a table</summary><table class="simple"><caption class="visually-hidden">Reviews remembered each week</caption><thead><tr><th scope="col">Week</th><th scope="col">Reviews</th><th scope="col">Remembered</th></tr></thead><tbody>' +
        ws.map(function (w) { return '<tr><th scope="row">' + esc(weekName(w)) + '</th><td class="num">' + w.n + '</td><td class="num">' + (w.n ? w.ok + ' (' + w.pct + '%)' : '–') + '</td></tr>'; }).join('') + '</tbody></table></details>'
      : '<p class="small muted">Not enough reviews yet: this chart appears after ' + MIN_WEEK_REVIEWS + ' reviews in the last 8 weeks (you have ' + total + ').</p>';
    var fc = [], mx = 0;
    for (var i = 0; i < 7; i++) {
      var d = ST.addDays(t, i), n = 0;
      Object.keys(st.srs).forEach(function (id) { var c = st.srs[id]; if (c && !c.off && c.reps && (i === 0 ? c.due <= t : c.due === d) && live(id)) n++; });
      fc.push({ d: d, n: n }); mx = Math.max(mx, n);
    }
    var cn = counts();
    var forecast = reviewed
      ? '<ol class="rv-fc">' + fc.map(function (f, i) {
        return '<li><span class="rv-fc-d">' + esc(i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : fmtDay(f.d)) + '</span><span class="rv-fc-b" aria-hidden="true"><span style="width:' + (mx ? Math.round(f.n / mx * 100) : 0) + '%"></span></span><span class="rv-fc-n num">' + plural(f.n, 'card') + '</span></li>';
      }).join('') + '</ol><p class="small muted prose">Reviews already planned for each of the next 7 days. New cards are not counted here: up to ' + newPerDay() + ' join each day while any are waiting (' + cn.fresh.length + ' now).</p>'
      : '<p class="small muted">Not enough reviews yet: your forecast appears after your first review.</p>';
    box.innerHTML = '<div class="stack-sm"><h2 class="h-sub" id="rv-ret-h">Long-term retention</h2><p class="small muted">How well your reviewed cards are sticking, and what is coming up. Numbers come only from your own reviews on this site.</p></div>' +
      '<div class="rv-ret-grid"><div class="stack-sm"><h3 class="rv-h3">Today</h3>' + recall + '<h3 class="rv-h3">Cards by stage</h3>' + stages + '</div>' +
      '<div class="stack-sm"><h3 class="rv-h3">Remembered each week</h3>' + chart + '<h3 class="rv-h3">Next 7 days</h3>' + forecast + '</div></div>';
  }

  /* ----- add a module ----- */
  function startedModules() {
    var app = A(), st = S();
    return D.modules.filter(function (m) {
      if (app.readCards(m).some(function (c) { return app.readOn(m.id, c.key); })) return true;
      if (st.quiz[m.id] && st.quiz[m.id].attempts > 0) return true;
      return app.mainPicks(m).list.some(function (r) { return !!st.watched[r.id]; });
    });
  }
  function drawAdd(focusMid) {
    var box = $('rv-add'); if (!box) return;
    var st = S(), ms = startedModules(), npd = newPerDay();
    var rows = ms.map(function (m) {
      var ids = ST.moduleReviewIds(m), inRev = ids.filter(function (id) { return st.srs[id] && !st.srs[id].off; }).length, add = ids.length - inRev;
      var soon = !ST.modData(m.id);
      return '<li class="rv-mod"><div class="stack-sm"><a href="#m-' + esc(m.id) + '">' + esc(modLabel(m)) + '</a>' +
        '<span class="small muted" id="rv-ms-' + esc(m.id) + '" tabindex="-1">' + inRev + ' of ' + plural(ids.length, 'card') + ' in your review' + (soon ? '. Recall questions for this module are coming soon; its key terms can be added now.' : '') + '</span></div>' +
        (add ? '<button type="button" class="btn btn-sm" data-rv="add" data-mid="' + esc(m.id) + '">Add ' + plural(add, 'card') + '<span class="visually-hidden"> from ' + esc(modLabel(m)) + '</span></button>' : '<span class="chip chip-ok">All in review</span>') + '</li>';
    }).join('');
    box.innerHTML = '<h2 class="h-sub" id="rv-add-h">Add a module to my review</h2>' +
      '<p class="small muted">Adds every key term and lesson-card recall question of a module you have started. New cards join your review a few at a time (up to ' + npd + ' a day).</p>' +
      (ms.length ? '<ul class="rv-mods">' + rows + '</ul>' : '<p class="small">No modules started yet. Open one from the <a href="#roadmap">roadmap</a>: tick Got it on a lesson card, watch its video or try its quiz, and it appears here.</p>');
    if (focusMid) focusEl($('rv-ms-' + focusMid));
  }
  function addModule(mid) {
    var m = A().modById[mid]; if (!m) return;
    ST.ensureData().then(function () { return true; }, function () { return false; }).then(function () {
      if (!$('rv-add')) return;
      var n = ST.enroll(ST.moduleReviewIds(m));
      if (!sess) { var body = $('rv-today-body'); if (body) body.innerHTML = todayBody(); else drawToday(); }
      drawRet(); drawAdd(mid); refreshHub();
      announce(n ? 'Added ' + plural(n, 'card') + ' from ' + modLabel(m) + '. They join your review as new cards, up to ' + newPerDay() + ' a day.' : 'Every card of ' + modLabel(m) + ' is already in your review.');
    });
  }

  /* ----- AI-powered active recall ----- */
  function drawAI() {
    var box = $('rv-ai'); if (!box) return;
    var app = A(), st = S(), started = startedModules();
    var dflt = (st.last && app.modById[st.last]) ? st.last : started[0] ? started[0].id : D.modules[0] && D.modules[0].id;
    var opts = D.levels.map(function (l) {
      return '<optgroup label="' + esc('Level ' + l.id + ' · ' + l.name) + '">' + app.modulesOf(l.id).map(function (m) {
        return '<option value="' + esc(m.id) + '"' + (m.id === dflt ? ' selected' : '') + '>' + esc(app.modNo(m) + ' ' + m.title) + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
    box.innerHTML = '<h2 class="h-sub" id="rv-ai-h">Ask AI to quiz me</h2>' +
      '<p class="small muted">Active recall with an AI tutor: it asks you 5 short questions about a module, starting with the cards you forget most. Answer from memory before you look anything up.</p>' +
      '<div class="stack-sm"><label for="rv-ai-mod" class="small"><strong>Module</strong></label><select id="rv-ai-mod">' + opts + '</select></div>' +
      ST.aiHTML('rv-ai-box', 'Ask Gemini for 5 questions') +
      '<p class="small muted">Copy prompt works with ChatGPT, Gemini, Claude or any AI app: paste it, then answer each question as it comes.' + (ST.aiOffered() ? ' Ask Gemini (for signed-in learners) lists the 5 questions here with each answer folded away, so you can try first.' : '') + '</p>';
    var mode = 'copy', ai = box.querySelector('[data-ai="rv-ai-box"]');
    if (ai) ai.addEventListener('click', function (ev) { var t = ev.target.closest && ev.target.closest('[data-ai-ask],[data-ai-copy]'); if (t) mode = t.hasAttribute('data-ai-ask') ? 'gemini' : 'copy'; }, true);
    ST.bindAI(box, 'rv-ai-box', function () { return aiPrompt($('rv-ai-mod') && $('rv-ai-mod').value, mode); });
    var out = ai && ai.querySelector('.ai-out');
    if (out && window.MutationObserver && page) {
      if (page.observer) page.observer.disconnect();
      page.observer = new MutationObserver(function () { foldAnswers(out); });
      page.observer.observe(out, { childList: true, subtree: true });
    }
  }
  function weakCards(m) {
    var st = S();
    return Object.keys(st.srs).filter(function (id) { var c = st.srs[id]; return parts(id).mid === m.id && c && !c.off && c.reps > 0; })
      .map(function (id) { return { id: id, c: st.srs[id], it: ST.reviewItem(id), r: ST.recallChance(st.srs[id]) }; })
      .filter(function (x) { return x.it; })
      .sort(function (a, b) { return b.c.lapses - a.c.lapses || (a.r == null ? 1 : a.r) - (b.r == null ? 1 : b.r); })
      .slice(0, 5);
  }
  function aiPrompt(mid, mode) {
    var app = A(), m = app && app.modById[mid]; if (!m) return '';
    var terms = (m.keyTerms || []).slice(0, 12).map(function (t) { return '- ' + t.term + ': ' + t.meaning; }).join('\n');
    var weak = weakCards(m);
    var head = 'I am studying the module "' + m.title + '" (module ' + app.modNo(m) + ') of a free AI and machine learning course.\n\n' +
      (terms ? 'Key terms of this module:\n' + terms + '\n\n' : '') +
      (weak.length ? 'The review cards I find hardest (start with these):\n' + weak.map(function (x) {
        return '- ' + x.it.front + ' (correct answer: ' + x.it.back + ')' + (x.c.lapses ? ' - I forgot this ' + (x.c.lapses === 1 ? 'once' : x.c.lapses + ' times') : '');
      }).join('\n') + '\n\n' : 'I have not reviewed cards from this module yet, so use the key terms.\n\n');
    if (mode === 'gemini') {
      return head + 'Task: write 5 short recall questions (questions I answer from memory) about this module, starting with the cards I find hardest, then the key terms. ' +
        'Write each question on its own line as "Question 1:", "Question 2:" and so on. On the next line write "Answer:" and the answer in one or two sentences. Leave a blank line between questions. Do not use lists, headings or anything else.';
    }
    return head + 'Task: quiz me with 5 short recall questions (questions I answer from memory) about this module. Ask ONE question at a time, then stop and wait for my answer. ' +
      'After each answer, tell me in one or two sentences whether I was right, and give the correct answer if I was not. Then ask the next question. Never show an answer before I reply. ' +
      'Start with the cards I find hardest, then use the key terms. After my fifth answer, tell me which ideas I should review again.';
  }
  // Gemini's "Answer:" lines are folded under "Show answer" so the learner can try first (nodes are moved, never re-parsed)
  function foldAnswers(out) {
    var reply = out.querySelector('.ai-reply:not([data-rv-fold])'); if (!reply) return;
    reply.setAttribute('data-rv-fold', '1');
    var n = 0;
    Array.prototype.slice.call(reply.querySelectorAll('p, li')).forEach(function (el) {
      var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), tn, hit = null, idx = -1;
      while ((tn = w.nextNode())) { var mm = /\banswer\s*:/i.exec(tn.data); if (mm) { hit = tn; idx = mm.index; break; } }
      if (!hit) return;
      var r = document.createRange(); r.setStart(hit, idx); r.setEnd(el, el.childNodes.length);
      var frag = r.extractContents();
      var det = document.createElement('details'); det.className = 'rv-fold';
      var sum = document.createElement('summary'); sum.textContent = 'Show answer ' + (++n);
      var body = document.createElement('div'); body.appendChild(frag);
      det.appendChild(sum); det.appendChild(body); el.appendChild(det);
    });
  }

  /* ---------- Study room card ---------- */
  function hubLine(cn) {
    var n = cn.due.length + cn.newToday.length;
    if (!cn.active) return 'No cards yet. Tick <strong>Got it</strong> on lesson cards to add them.';
    if (!n) { var nx = nextInfo(cn); return 'All done for today.' + (nx.day ? ' Next review: ' + esc(dayLabel(nx.day)) + '.' : ''); }
    return '<strong class="num">' + plural(n, 'card') + '</strong> to review today (' + cn.due.length + ' due, ' + cn.newToday.length + ' new).';
  }
  function refreshHub() { var el = $('rv-hub-n'); if (el) el.innerHTML = hubLine(counts()); }
  ST.addHubCard(10, function () {
    var cn = counts(), n = cn.due.length + cn.newToday.length;
    return '<article class="card rv-hub" aria-labelledby="rv-hub-h"><h2 class="h-sub" id="rv-hub-h">Daily review</h2>' +
      '<p class="small">' + ST.sans('smarana', { meaning: false }) + ' with spaced repetition</p>' +
      '<p class="small muted">Recall key terms and lesson questions just before you would forget them. A few minutes a day.</p>' +
      '<p id="rv-hub-n">' + hubLine(cn) + '</p>' +
      '<div class="row"><a class="btn btn-primary" href="#review">' + (n ? 'Start review' : 'Open daily review') + '</a></div></article>';
  });
  ST.on('hub', function () { loadData().then(refreshHub); });
})();
