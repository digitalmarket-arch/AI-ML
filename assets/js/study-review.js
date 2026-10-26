/* AI Marg study feature: Daily review (Smarana): spaced repetition of key terms and lesson-card recall questions; retention tracking.
   Uses window.AIM_STUDY (assets/js/study.js) and window.AIM_APP (assets/js/app.js).
   study.js loads this file when a page needs it (#review, the Study room, a module's lesson cards). */
(function () {
  'use strict';
  var ST = window.AIM_STUDY; if (!ST) return; // study features are switched off in this browser
  var C = window.AIM_CORE, D = window.AIM || {};
  var esc = C.esc, inline = C.inline;
  var A = function () { return window.AIM_APP; };
  var S = function () { return C.state; };
  var $ = function (id) { return document.getElementById(id); };

  var READ_ORDER = ['overview', 'outcomes', 'studySteps', 'keyTerms', 'indiaExample', 'commonMistakes', 'selfCheck'];
  var NEW_MIN = 5, NEW_MAX = 50, NEW_STEP = 5; // the choices of the "New cards a day" setting (study.js keeps the value within 5 to 50)
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
  // The new-card limit is study.js's one rule, shared with every page that counts cards: ST.newPerDay() is the setting,
  // ST.newLeftToday() what is left of it today on all the learner's devices (a new card counts on the day of its first
  // grade, whatever the grade, so one forgotten and then remembered in the same session still counts once).
  function newPerDay() { return ST.newPerDay(); }
  // the device-only list of new cards graded today that this page kept before study.js counted first grades is not needed any more
  function dropOldList() { var p = prefs(); if (Object.prototype.hasOwnProperty.call(p, 'newToday')) { delete p.newToday; C.save(); } }

  /* ---------- study content: a module's recall questions are loaded when one of its cards is needed ---------- */
  var modState = {}; // moduleId -> 'ok' (loaded), 'none' (no study content yet), 'fail' (did not load; tried again next time)
  function loadMods(mids) {
    var seen = {};
    return Promise.all((mids || []).filter(function (mid) {
      if (!mid || seen[mid] || modState[mid] === 'ok' || modState[mid] === 'none') return false;
      seen[mid] = 1; return true;
    }).map(function (mid) {
      return ST.ensureModule(mid).then(function (md) { modState[mid] = md ? 'ok' : 'none'; }, function () { modState[mid] = 'fail'; });
    }));
  }
  function failedMods() { return Object.keys(modState).filter(function (k) { return modState[k] === 'fail'; }); }
  function parts(id) { var p = String(id).split(':'); return { kind: p[0], mid: p[1] || '', key: p.slice(2).join(':') }; }
  // modules with recall cards in the review
  function srsMods() {
    var st = S(), out = {};
    Object.keys(st.srs).forEach(function (id) { var p = parts(id); if (p.kind === 'rc' && st.srs[id] && !st.srs[id].off) out[p.mid] = 1; });
    return Object.keys(out);
  }
  // can this card be shown? A recall card needs its module's content; until that is known the card is counted
  function live(id) {
    if (!A()) return true;
    if (ST.reviewItem(id)) return true;
    var p = parts(id);
    return p.kind === 'rc' && !modState[p.mid];
  }
  function ktIds(m) { return (m.keyTerms || []).map(function (t, i) { return 'kt:' + m.id + ':' + i; }); }
  function orderKey(id) {
    var p = parts(id), app = A(), m = app && app.modById[p.mid];
    var ci = p.kind === 'rc' ? READ_ORDER.indexOf(p.key) : 20 + (Number(p.key) || 0);
    return (m ? m._i : 999) * 1000 + (ci < 0 ? 19 : ci);
  }
  // mix cards from different modules (interleaving): one card from each module in turn, each module keeping its own order
  function interleave(ids) {
    var groups = [], by = {}, out = [];
    ids.forEach(function (id) { var mid = parts(id).mid; if (!by[mid]) { by[mid] = []; groups.push(by[mid]); } by[mid].push(id); });
    for (var i = 0; out.length < ids.length; i++) groups.forEach(function (g) { if (i < g.length) out.push(g[i]); });
    return out;
  }
  // what today's review holds: due = seen before and due now (most overdue first; cards due the same day mixed across
  // modules); fresh = never reviewed (course order, mixed across modules); newToday = the fresh cards allowed today
  function counts() {
    var st = S(), t = ST.today(), due = [], fresh = [], active = 0;
    Object.keys(st.srs).forEach(function (id) {
      var c = st.srs[id]; if (!c || c.off || !live(id)) return;
      active++;
      if (!c.reps) fresh.push(id); else if (c.due <= t) due.push(id);
    });
    due.sort(function (x, y) { var a = st.srs[x], b = st.srs[y]; return a.due.localeCompare(b.due) || a.s - b.s || orderKey(x) - orderKey(y); });
    var byDay = [];
    due.forEach(function (id) { var d = st.srs[id].due, last = byDay[byDay.length - 1]; if (!last || last.d !== d) byDay.push(last = { d: d, ids: [] }); last.ids.push(id); });
    due = [].concat.apply([], byDay.map(function (b) { return interleave(b.ids); }));
    fresh = interleave(fresh.sort(function (x, y) { return orderKey(x) - orderKey(y); }));
    var quota = ST.newLeftToday();
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
  // days until the next review if the card got this grade now (the scheduler's own sums, nothing saved)
  function previewDays(id, grade) { return Math.max(0, ST.daysBetween(ST.today(), ST.nextEntry(id, grade).due)); }
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

  /* ---------- lesson cards ticked with Got it are in the review ---------- */
  // Every ticked lesson card adds its recall question (and the Key terms card the module's key terms). study.js keeps this
  // rule (ST.enrollTicked): it works it out from the saved progress (no one-time flag) whenever a page that counts cards is
  // drawn and after a restore or a sync, so ticks made before this feature existed or on another device all reach the
  // review. A card the learner removed keeps its 'off' entry and is never brought back; new cards carry no time stamp, so
  // they never replace review history from another device. A recall question whose module has no study content yet waits
  // in the review unseen (live() leaves it out of every count) and appears once the content does.
  function catchUp() { return ST.enrollTicked(); }
  // what a page needs before it counts cards: ticked cards added, and the content of every module with recall cards
  function prepare(withStarted) {
    try { catchUp(); } catch (e) { if (window.console) console.error(e); }
    return loadMods(srsMods().concat(withStarted ? ST.startedModules() : []));
  }

  function footNote(m, key, text) {
    if (!text) return;
    var side = $('mod-side'); if (side && side.getAttribute('data-mod') !== m.id) return;
    var card = $('read-' + key), foot = card && card.querySelector('.read-foot'); if (!foot || !foot.isConnected) return;
    var el = foot.querySelector('.rv-added');
    if (!el) { el = document.createElement('span'); el.className = 'small rv-added'; foot.appendChild(el); }
    el.innerHTML = '<span aria-hidden="true">✓ </span>' + text;
  }
  // Got it on a lesson card: its cards join the review at once (by study.js's rule above), and the card's footer says so.
  // A card the learner removed stays removed (it can be added again with "Add a module").
  ST.on('card-read', function (m, key, on) {
    if (!on || !m || !key) return;
    var ids = ['rc:' + m.id + ':' + key].concat(key === 'keyTerms' ? ktIds(m) : []), had = {}, st = S();
    ids.forEach(function (id) { had[id] = !!st.srs[id]; });
    catchUp();
    loadMods([m.id]).then(function () {
      var st2 = S(), shown = ids.filter(function (id) { return st2.srs[id] && !st2.srs[id].off && ST.reviewItem(id); }); // cards the review can show
      var n = shown.filter(function (id) { return !had[id]; }).length;
      footNote(m, key, n ? 'Added ' + plural(n, 'card') + ' to your <a href="#review">daily review</a>.' : shown.length ? 'Already in your <a href="#review">daily review</a>.' : '');
      refreshHub();
    });
  });

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
      '<p class="small muted prose">Methods used here: active recall, adaptive spaced repetition (cards you find hard come back sooner, easy ones wait longer), interleaving (cards from different modules are mixed, so you learn to tell similar ideas apart) and long-term retention tracking. <a href="#methods">How these methods work</a></p></header>' +
      '<div id="rv-main" class="stack-lg"><p class="muted" role="status">Loading your review cards…</p></div></div>', 'Daily review');
    page = { token: token, observer: null };
    sess = null;
    dropOldList();
    $('rv-main').addEventListener('click', onClick);
    var onKey = function (ev) { keydown(ev); };
    document.addEventListener('keydown', onKey);
    app.onLeave(function () {
      document.removeEventListener('keydown', onKey);
      timers.forEach(clearTimeout); timers = [];
      if (page && page.observer) page.observer.disconnect();
      if (page && page.token === token) { page = null; sess = null; }
    });
    prepare(true).then(function () { if (page && page.token === token) drawAll(); });
  }
  ST.addRoute('review', viewReview, 'study');

  function loadNote() {
    var n = failedMods().length; if (!n) return '';
    return '<div class="callout stack-sm" role="alert"><p>The lesson-card questions of ' + plural(n, 'module') + ' did not load. Check your connection and try again. Key-term cards still work, and the other questions come back when the content loads.</p>' +
      '<div class="row"><button type="button" class="btn btn-sm" data-rv="retry">Try again</button></div></div>';
  }
  function drawAll() {
    var root = $('rv-main'); if (!root) return;
    if (page && page.observer) { page.observer.disconnect(); page.observer = null; }
    root.innerHTML = '<div id="rv-note">' + loadNote() + '</div>' +
      '<section class="card stack rv-today" id="rv-today" aria-labelledby="rv-today-h"></section>' +
      '<p class="visually-hidden" id="rv-live" aria-live="polite"></p>' +
      '<div id="rv-more" class="stack-lg">' +
      '<section class="card stack rv-ret" id="rv-ret" aria-labelledby="rv-ret-h"></section>' +
      '<div class="grid rv-two"><section class="card stack-sm" id="rv-add" aria-labelledby="rv-add-h"></section>' +
      '<section class="card stack-sm" id="rv-ai" aria-labelledby="rv-ai-h"></section></div></div>';
    drawToday(); drawRet(); drawAdd(); drawAI();
  }
  // progress changed outside this page (another device or tab): redraw, keeping the learner's place
  function redraw() {
    var ae = document.activeElement, sel = null;
    if (ae && $('rv-main') && $('rv-main').contains(ae)) {
      sel = ae.id ? '#' + ae.id : ae.getAttribute('data-rv') ? '[data-rv="' + ae.getAttribute('data-rv') + '"]' + (ae.getAttribute('data-mid') ? '[data-mid="' + ae.getAttribute('data-mid') + '"]' : '') : null;
    }
    var mod = $('rv-ai-mod') && $('rv-ai-mod').value;
    drawAll();
    if (mod && $('rv-ai-mod')) $('rv-ai-mod').value = mod;
    var el = sel && document.querySelector('#rv-main ' + sel);
    if (el) focusEl(el);
  }
  window.addEventListener('aim:progress-replaced', function (ev) {
    if (ev.detail && ev.detail.cleared) return; // everything was cleared: the page is drawn again by app.js
    prepare(false).then(function () { refreshHub(); if (page && !sess && $('rv-main')) redraw(); });
  });

  /* ----- today ----- */
  function drawToday(focusHead) {
    var box = $('rv-today'); if (!box) return;
    var npd = newPerDay(), opts = '';
    for (var i = NEW_MIN; i <= NEW_MAX; i += NEW_STEP) opts += '<option value="' + i + '"' + (i === npd ? ' selected' : '') + '>' + i + '</option>';
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
    var expl = '<p class="small muted prose"><strong>Due today</strong>: cards you have reviewed before whose review day has come. <strong>New today</strong>: cards you have not seen yet; up to ' + npd + ' join each day (on all your devices together) so the review stays short' +
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
    var prev = st.srs[id] ? JSON.parse(JSON.stringify(st.srs[id])) : null;
    sess.undo = { id: id, day: t, prev: prev, ok: g >= 2 ? 1 : 0,
      queue: sess.queue.slice(), cleared: Object.assign({}, sess.cleared), first: Object.assign({}, sess.first), again: Object.assign({}, sess.again), reviews: sess.reviews };
    var entry = ST.schedule(id, g); // saves the card (a new card gets the day of its first grade, which the new-card limit counts) and this device's review count for today
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
    // the card goes back to how it was, with a fresh time so the undo also wins on the learner's other devices
    // (a new card loses its first-grade day again, so it no longer counts against today's new-card limit)
    if (u.prev) { var e = Object.assign({}, u.prev); e.at = ST.now(); st.srs[u.id] = e; }
    ST.logReview(-1, -u.ok, u.day); // this device's own count for that day, so the next sync keeps the lower number
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
    else if (a === 'retry') retry(b);
  }
  function retry(b) {
    b.disabled = true; b.textContent = 'Loading…';
    var token = page && page.token;
    prepare(true).then(function () {
      if (!page || page.token !== token || sess) return;
      drawAll();
      announce(failedMods().length ? 'Still not loaded. Check your connection.' : 'Loaded. Every card is back.');
      focusEl($('rv-today-h'));
    });
  }

  /* ----- retention panel ----- */
  function weeks() {
    var t = ST.today(), w0 = weekStart(t), out = [];
    for (var k = 7; k >= 0; k--) {
      var start = ST.addDays(w0, -7 * k), n = 0, ok = 0;
      for (var i = 0; i < 7; i++) { var d = ST.addDays(start, i); if (d > t) break; var lg = ST.reviewLog(d); n += lg[0]; ok += lg[1]; }
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
      if (!c.reps) { if (live(id)) stg.fresh++; } // like "New cards waiting": a question whose content is not here yet is not counted
      else if (c.s < 7) stg.learn++; else if (c.s < 21) stg.mat++; else stg.long++;
    });
    var reviewed = stg.learn + stg.mat + stg.long;
    var recall = ret.avg != null && ret.n >= MIN_CARDS
      ? '<p class="rv-big"><span class="rv-big-v">' + Math.round(ret.avg * 100) + '%</span> <span class="muted">predicted recall today</span></p>' +
        '<p class="small muted prose">If you were quizzed on your ' + plural(ret.n, 'reviewed card') + ' right now, you would probably remember about ' + Math.round(ret.avg * ret.n) + ' of them. The estimate comes from how long each card has rested since its last review and how strong it was then (a card you just forgot is weak and fades fast). It falls a little every day and rises when you review.</p>'
      : '<p class="rv-big"><span class="muted">Predicted recall today: not enough reviews yet.</span></p><p class="small muted prose">Review at least ' + MIN_CARDS + ' cards' + (ret.n ? ' (you have reviewed ' + ret.n + ')' : '') + ' to see how much of what you studied you would remember today.</p>';
    var stages = '<div class="lab-stats">' + stat('Learning', stg.learn, 'rv-st-learn') + stat('Maturing', stg.mat, 'rv-st-mat') + stat('Long-term', stg.long, 'rv-st-long') + stat('Not yet reviewed', stg.fresh, 'rv-st-new') + '</div>' +
      '<p class="small muted prose">Each card has a memory strength: about how many days you can wait before your chance of recalling it falls to 9 in 10. <strong>Learning</strong> cards are under 7 days, <strong>maturing</strong> cards 7 to 20 days and <strong>long-term</strong> cards 21 days or more. Cards grow stronger each time you remember them and go back to learning when you forget.</p>';
    var ws = weeks(), total = ws.reduce(function (s, w) { return s + w.n; }, 0);
    var chart = total >= MIN_WEEK_REVIEWS
      ? '<figure class="rv-fig stack-sm">' + chartSVG(ws) + '<figcaption class="small muted">The share of your review answers graded Hard, Good or Easy (remembered) each week, on all your devices. A dash means no reviews that week.</figcaption></figure>' +
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
  function startedMods() { var app = A(); return ST.startedModules().map(function (id) { return app.modById[id]; }).filter(Boolean); }
  function drawAdd(focusMid) {
    var box = $('rv-add'); if (!box) return;
    var st = S(), ms = startedMods(), npd = newPerDay();
    var rows = ms.map(function (m) {
      var ids = ST.moduleReviewIds(m), inRev = ids.filter(function (id) { return st.srs[id] && !st.srs[id].off; }).length, add = ids.length - inRev;
      var note = ST.modData(m.id) ? '' : modState[m.id] === 'fail' ? '. Its recall questions did not load; its key terms can be added now.' : '. Recall questions for this module are coming soon; its key terms can be added now.';
      return '<li class="rv-mod"><div class="stack-sm"><a href="#m-' + esc(m.id) + '">' + esc(modLabel(m)) + '</a>' +
        '<span class="small muted" id="rv-ms-' + esc(m.id) + '" tabindex="-1">' + inRev + ' of ' + plural(ids.length, 'card') + ' in your review' + note + '</span></div>' +
        (add ? '<button type="button" class="btn btn-sm" data-rv="add" data-mid="' + esc(m.id) + '">Add ' + plural(add, 'card') + '<span class="visually-hidden"> from ' + esc(modLabel(m)) + '</span></button>' : '<span class="chip chip-ok">All in review</span>') + '</li>';
    }).join('');
    box.innerHTML = '<h2 class="h-sub" id="rv-add-h">Add a module to my review</h2>' +
      '<p class="small muted">Adds every key term and lesson-card recall question of a module you have started. New cards join your review a few at a time (up to ' + npd + ' a day).</p>' +
      (ms.length ? '<ul class="rv-mods">' + rows + '</ul>' : '<p class="small">No modules started yet. Open one from the <a href="#roadmap">roadmap</a>: tick Got it on a lesson card, try its quiz or an exercise, or watch its video, and it appears here.</p>');
    if (focusMid) focusEl($('rv-ms-' + focusMid));
  }
  function addModule(mid) {
    var m = A().modById[mid]; if (!m) return;
    loadMods([mid]).then(function () {
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
    var app = A(), st = S(), started = ST.startedModules();
    var dflt = (st.last && app.modById[st.last]) ? st.last : started[0] ? started[0] : D.modules[0] && D.modules[0].id;
    var opts = D.levels.map(function (l) {
      return '<optgroup label="' + esc('Level ' + l.id + ' · ' + l.name) + '">' + app.modulesOf(l.id).map(function (m) {
        return '<option value="' + esc(m.id) + '"' + (m.id === dflt ? ' selected' : '') + '>' + esc(app.modNo(m) + ' ' + m.title) + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
    box.innerHTML = '<h2 class="h-sub" id="rv-ai-h">Ask AI to quiz me</h2>' +
      '<p class="small muted">Active recall with an AI tutor: it asks you 5 short questions about a module, starting with the cards you forget most. Answer from memory before you look anything up.</p>' +
      '<div class="stack-sm"><label for="rv-ai-mod" class="small"><strong>Module</strong></label><select id="rv-ai-mod">' + opts + '</select></div>' +
      ST.aiHTML('rv-ai-box', 'Ask Gemini for 5 questions', 'quiz questions on the module you picked') +
      '<p class="small muted">Copy prompt works with ChatGPT, Gemini, Claude or any AI app: paste it, then answer each question as it comes. The copied text names the terms and questions but not their answers, so you still answer from memory.' +
      (ST.aiOffered() ? ' Ask Gemini (for signed-in learners) lists the 5 questions here with each answer folded away, so you can try first.' : '') + '</p>';
    var mode = 'copy', ai = box.querySelector('[data-ai="rv-ai-box"]');
    // which button was pressed decides the prompt (this listener runs before study.js handles the click)
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
  // The learner pastes a copied prompt as their own first message, so it stays on screen above every question: it names the
  // key terms and the hardest questions but never their meanings or answers (the AI checks the answers itself). Gemini's
  // prompt is never shown, so it carries the course's answers, and the reply folds them away.
  function aiPrompt(mid, mode) {
    var app = A(), m = app && app.modById[mid]; if (!m) return '';
    var gem = mode === 'gemini', kts = (m.keyTerms || []).slice(0, 12), weak = weakCards(m);
    var forgot = function (x) { return x.c.lapses ? ' - I forgot this ' + (x.c.lapses === 1 ? 'once' : x.c.lapses + ' times') : ''; };
    var head = 'I am studying the module "' + m.title + '" (module ' + app.modNo(m) + ') of a free AI and machine learning course.\n\n' +
      (kts.length ? (gem ? 'Key terms of this module, with the course\'s meanings:\n' + kts.map(function (t) { return '- ' + t.term + ': ' + t.meaning; }).join('\n')
        : 'Key terms of this module (their meanings are left out on purpose, so I answer from memory):\n' + kts.map(function (t) { return '- ' + t.term; }).join('\n')) + '\n\n' : '') +
      (weak.length ? 'The review questions I find hardest (start with these):\n' + weak.map(function (x) {
        return '- ' + x.it.front + (gem ? ' (course answer: ' + x.it.back + ')' : '') + forgot(x);
      }).join('\n') + '\n\n' : 'I have not reviewed cards from this module yet, so use the key terms.\n\n');
    if (gem) {
      return head + 'Task: write 5 short recall questions (questions I answer from memory) about this module, starting with the cards I find hardest, then the key terms. ' +
        'Write each question on its own line as "Question 1:", "Question 2:" and so on. On the next line write "Answer:" and the answer in one or two sentences. Leave a blank line between questions. Do not use lists, headings or anything else.';
    }
    return head + 'Task: quiz me with 5 short recall questions (questions I answer from memory) about this module. Ask ONE question at a time, then stop and wait for my answer. ' +
      'After each answer, tell me in one or two sentences whether I was right, using what you know about this topic, and give the correct answer if I was not. Then ask the next question. Never show an answer before I reply. ' +
      'Start with the questions I find hardest, then use the key terms. After my fifth answer, tell me which ideas I should review again.';
  }

  // Gemini's "Answer:" parts are folded under "Show answer" so the learner can try first. A reply often has no blank lines,
  // so one paragraph may hold several questions: it is first split before each "Question N", then each answer is folded.
  // Nodes are only moved, never parsed again as HTML.
  var Q_MARK = /\b(?:question|q)\s*\d+\s*[:.)\-–]/gi, A_MARK = /\banswer\b\s*(?:\d+\s*)?[:\-–]/i;
  function textMap(el) {
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), nodes = [], s = '', tn;
    while ((tn = w.nextNode())) { nodes.push({ n: tn, at: s.length }); s += tn.data; }
    return { s: s, nodes: nodes };
  }
  function pointAt(map, i) {
    for (var k = map.nodes.length - 1; k >= 0; k--) if (map.nodes[k].at <= i) return [map.nodes[k].n, i - map.nodes[k].at];
    return null;
  }
  // start a range at a text position; a marker that opens an inline element (as in **Question 2:**) takes the element along
  function startAt(r, el, pt) {
    var node = pt[0];
    if (pt[1] === 0) { while (node.parentNode && node.parentNode !== el && !node.previousSibling) node = node.parentNode; r.setStartBefore(node); }
    else r.setStart(pt[0], pt[1]);
  }
  function splitQuestions(el) {
    var map = textMap(el), cuts = [], mm, blocks = [el];
    Q_MARK.lastIndex = 0;
    while ((mm = Q_MARK.exec(map.s))) if (map.s.slice(0, mm.index).trim()) cuts.push(mm.index);
    for (var k = cuts.length - 1; k >= 0; k--) { // from the end, so earlier positions stay valid
      var r = document.createRange(); startAt(r, el, pointAt(map, cuts[k])); r.setEnd(el, el.childNodes.length);
      var nb = document.createElement(el.tagName); nb.appendChild(r.extractContents());
      el.parentNode.insertBefore(nb, el.nextSibling);
      blocks.splice(1, 0, nb);
    }
    return blocks;
  }
  function fold(el, k) {
    var map = textMap(el), mm = A_MARK.exec(map.s); if (!mm) return false;
    var r = document.createRange(); startAt(r, el, pointAt(map, mm.index)); r.setEnd(el, el.childNodes.length);
    var frag = r.extractContents();
    var det = document.createElement('details'); det.className = 'rv-fold';
    var sum = document.createElement('summary'); sum.textContent = 'Show answer ' + k;
    var body = document.createElement('div'); body.appendChild(frag);
    det.appendChild(sum); det.appendChild(body); el.appendChild(det);
    return true;
  }
  function foldAnswers(out) {
    var reply = out.querySelector('.ai-reply:not([data-rv-fold])'); if (!reply) return;
    reply.setAttribute('data-rv-fold', '1');
    var n = 0;
    Array.prototype.slice.call(reply.querySelectorAll('p, li')).forEach(function (el) {
      splitQuestions(el).forEach(function (b) { if (fold(b, n + 1)) n++; });
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
  ST.on('hub', function () { prepare(false).then(refreshHub); });
})();
