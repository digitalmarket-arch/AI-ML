/* AI Marg study feature: Focus sessions (Dharana) with Dhyana breath and Vairagya distraction-free mode; the Svadhyaya journal.
   Uses window.AIM_STUDY (assets/js/study.js) and window.AIM_APP (assets/js/app.js). */
(function () {
  'use strict';
  var ST = window.AIM_STUDY; if (!ST) return; // study features are switched off in this browser
  var C = window.AIM_CORE, D = window.AIM || {};
  var esc = C.esc;
  var A = function () { return window.AIM_APP; };
  var S = function () { return C.state; };
  var $ = function (id) { return document.getElementById(id); };

  var KEY = 'aimarg.focus';                 // the running session lives here (this device only)
  var MIN_C = 10, MAX_C = 90, PLAN_CAP = 180, ADD = 5, BREAK_MIN = 5;
  var BREATH_MS = 60000, IN_MS = 4000, CYCLE_MS = 10000;   // settling breath: in 4 s, out 6 s, for one minute
  var FRESH_MS = 3 * 3600000;               // a session this recent pre-fills the journal's minutes
  var LIST_STEP = 10;
  var METH = 'Method that helped most this week: '; // the weekly answer is kept as the last line of "What I learnt"
  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2.5h5"/></svg>';

  /* ---------- small helpers ---------- */
  var MODS = {};
  (D.modules || []).forEach(function (m) { if (m && m.id) MODS[m.id] = m; });
  function mod(id) { return typeof id === 'string' && Object.prototype.hasOwnProperty.call(MODS, id) ? MODS[id] : null; }
  function modNo(m) {
    var app = A(); if (app && app.modNo) return app.modNo(m);
    var list = (D.modules || []).filter(function (x) { return x.level === m.level; });
    return m.level + '.' + (list.indexOf(m) + 1);
  }
  function modLabel(m) { return modNo(m) + ' ' + m.title; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function fmtMins(n) { n = Math.max(0, Math.round(n)); if (n < 60) return n + ' min'; var h = Math.floor(n / 60), m = n % 60; return h + ' h' + (m ? ' ' + m + ' min' : ''); }
  function clockText(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return (h ? h + ':' + pad(m) : String(m)) + ':' + pad(x);
  }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dayOf(ms) { var d = new Date(ms); return isNaN(d.getTime()) ? '' : ymd(d); }
  function weekStart(day) { var wd = (new Date(day + 'T12:00:00').getDay() + 6) % 7; return ST.addDays(day, -wd); } // Monday
  function fmtDate(ms, withTime) {
    try {
      var d = new Date(ms), s = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
      return withTime ? s + ', ' + d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : s;
    } catch (e) { return ''; }
  }
  function longDay(day) { try { return new Date(day + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }); } catch (e) { return day; } }
  function shortDay(day) { try { return new Date(day + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short' }); } catch (e) { return day; } }
  function newId(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  // entry ids start with the time they were made ('j' + Date.now() in base 36), so edits keep an entry's place in the list
  function idTime(id) { var m = /^[jf]([0-9a-z]{8})/.exec(id); if (!m) return 0; var t = parseInt(m[1], 36); return t > 1.4e12 && t < 4e12 ? t : 0; }
  function str(v, n) { return typeof v === 'string' ? v.slice(0, n) : ''; }
  function prefs() {
    var p = S().prefs;
    if (!p.study || typeof p.study !== 'object' || Array.isArray(p.study)) p.study = {};
    return p.study;
  }
  function focusIn(el) { if (!el) return; try { el.focus({ preventScroll: false }); } catch (e) { el.focus(); } }
  function setText(id, s) { var el = $(id); if (el && el.textContent !== s) el.textContent = s; }
  function stat(k, v) { return '<div class="stat"><div class="k">' + esc(k) + '</div><div class="v">' + esc(String(v)) + '</div></div>'; }
  var reduceMQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reduced() { return !!(reduceMQ && reduceMQ.matches); }
  function parseParams(s) {
    var o = {};
    String(s || '').split('&').forEach(function (kv) {
      var i = kv.indexOf('=');
      if (i < 0) { if (mod(kv)) o.mod = kv; return; }
      var k = kv.slice(0, i), v = kv.slice(i + 1).slice(0, 80);
      if (k === 'mod' || k === 'fs') o[k] = v;
    });
    return o;
  }
  function modOptions(sel) {
    var html = '<option value="">No module</option>', seen = {};
    (D.levels || []).forEach(function (l) {
      var ms = (D.modules || []).filter(function (m) { return m.level === l.id; });
      if (!ms.length) return;
      html += '<optgroup label="' + esc('Level ' + l.id + (l.name ? ' · ' + l.name : '')) + '">' + ms.map(function (m) {
        seen[m.id] = 1;
        return '<option value="' + esc(m.id) + '"' + (m.id === sel ? ' selected' : '') + '>' + esc(modLabel(m)) + '</option>';
      }).join('') + '</optgroup>';
    });
    (D.modules || []).forEach(function (m) { if (!seen[m.id]) html += '<option value="' + esc(m.id) + '"' + (m.id === sel ? ' selected' : '') + '>' + esc(modLabel(m)) + '</option>'; });
    return html;
  }
  function say(msg) { // short status messages on the page (not the timer)
    var el = $('fc-live'); if (!el) return;
    el.textContent = '';
    setTimeout(function () { if (el.isConnected) el.textContent = msg; }, 60);
  }

  /* ---------- the running session (localStorage 'aimarg.focus'): wall-clock times, so it stays right while the tab sleeps ---------- */
  // { kind: 'focus'|'break', id, intent, mod, plan (minutes), b0 (breath began, ms), start (timer began, ms; after the breath),
  //   paused (ms paused so far), pauseAt (ms, while paused), dfm (distraction-free), ann (0 none, 1 start, 2 halfway announced),
  //   phase: 'run'|'done', mins, done, endAt (once finished) }
  var memRec = null, storeOk = true, cur = null;
  function cleanRec(r) {
    if (!r || typeof r !== 'object' || Array.isArray(r)) return null;
    var n = function (v) { v = Number(v); return isFinite(v) ? v : 0; };
    var kind = r.kind === 'break' ? 'break' : r.kind === 'focus' ? 'focus' : '';
    var start = n(r.start), plan = Math.round(n(r.plan));
    if (!kind || start <= 0 || plan < 1 || plan > PLAN_CAP) return null;
    var out = {
      v: 1, kind: kind, id: typeof r.id === 'string' && /^f[0-9a-z]{4,40}$/.test(r.id) ? r.id : newId('f'),
      intent: str(r.intent, 300), mod: mod(r.mod) ? r.mod : '', plan: plan, start: start,
      b0: n(r.b0) > 0 && n(r.b0) <= start ? n(r.b0) : 0, paused: Math.max(0, n(r.paused)), pauseAt: n(r.pauseAt) > 0 ? n(r.pauseAt) : 0,
      dfm: kind === 'focus' && !!r.dfm, ann: Math.max(0, Math.min(2, Math.floor(n(r.ann)))),
      phase: r.phase === 'done' ? 'done' : 'run', mins: Math.max(0, Math.round(n(r.mins))), done: !!r.done, endAt: n(r.endAt) > 0 ? n(r.endAt) : 0
    };
    if (out.phase === 'done') { if (kind === 'break') return null; out.dfm = false; out.pauseAt = 0; }
    return out;
  }
  function readRec() {
    if (!storeOk) return cleanRec(memRec);
    var raw;
    try { raw = localStorage.getItem(KEY); } catch (e) { return cleanRec(memRec); }
    var r = null; try { r = JSON.parse(raw || 'null'); } catch (e) { r = null; }
    return cleanRec(r);
  }
  function writeRec(r) { memRec = r; try { localStorage.setItem(KEY, JSON.stringify(r)); storeOk = true; } catch (e) { storeOk = false; } }
  function clearRec() { memRec = null; cur = null; try { localStorage.removeItem(KEY); } catch (e) {} }
  function elapsed(r, t) { if (t == null) t = Date.now(); var upTo = r.pauseAt ? Math.min(r.pauseAt, t) : t; return Math.max(0, upTo - r.start - r.paused); }
  function leftMs(r, t) { return Math.max(0, r.plan * 60000 - elapsed(r, t)); }
  function inBreath(r, t) { return !!r && r.kind === 'focus' && r.phase === 'run' && (t == null ? Date.now() : t) < r.start; }
  function endTime(r) { return r.start + r.paused + r.plan * 60000; }
  function viewOf(r, t) { if (!r) return 'setup'; if (r.kind === 'break') return 'break'; if (r.phase === 'done') return 'done'; return inBreath(r, t) ? 'breath' : 'run'; }

  /* ---------- one ticker for the chip and the page, aligned to the next change of the shown seconds ---------- */
  var tickT = null;
  function tick() {
    clearTimeout(tickT); tickT = null;
    var r = cur; if (!r) { updateChip(); return; }
    var t = Date.now();
    if (r.phase === 'run') {
      if (!r.pauseAt && !inBreath(r, t) && leftMs(r, t) <= 0) { complete(false, t - endTime(r) > 5000); return; }
      if (r.kind === 'focus' && !inBreath(r, t)) {
        var e = elapsed(r, t), total = r.plan * 60000, changed = false;
        if (r.ann < 1) { r.ann = 1; changed = true; if (e < 90000) announce('Focus session started: ' + plural(r.plan, 'minute') + '.'); }
        if (r.ann < 2 && e >= total / 2) { r.ann = 2; changed = true; if (e < total * 0.75) announce('Halfway there. ' + plural(Math.ceil((total - e) / 60000), 'minute') + ' left.'); }
        if (changed) writeRec(r);
      }
    }
    if (page && page.kind === 'focus' && viewOf(r, t) !== page.view) drawFocus(); else updateFocus(t);
    updateChip(t);
    if (r.phase !== 'run' || r.pauseAt) return;
    var wait;
    if (inBreath(r, t)) { var b0 = r.b0 || r.start - BREATH_MS; wait = Math.min(1000 - ((t - b0) % 1000), r.start - t); }
    else { var el = elapsed(r, t); wait = Math.min(1000 - (el % 1000), leftMs(r, t)); }
    tickT = setTimeout(tick, Math.max(20, wait + 8));
  }
  // polite announcements from the timer: only when it starts, at halfway and at the end (the end uses the toast)
  function announce(msg) {
    var el = $('fc-chip-live'); if (!el) return;
    el.textContent = '';
    setTimeout(function () { if (el.isConnected) el.textContent = msg; }, 150);
  }
  function applyDfm() { document.body.classList.toggle('fc-vairagya', !!(cur && cur.kind === 'focus' && cur.phase === 'run' && cur.dfm)); }
  // after any change to the session: distraction-free class, chip, page and the ticker
  function afterChange(opts) {
    applyDfm();
    if (page && page.kind === 'focus') { if (viewOf(cur) !== page.view || (opts && opts.redraw)) drawFocus(opts); else updateFocus(); }
    updateChip();
    tick();
  }
  function start(o) {
    var t = Date.now();
    cur = { v: 1, kind: 'focus', id: newId('f'), intent: o.intent, mod: o.mod, plan: o.plan, b0: o.breath ? t : 0, start: o.breath ? t + BREATH_MS : t,
      paused: 0, pauseAt: 0, dfm: !!o.dfm, ann: 0, phase: 'run', mins: 0, done: false, endAt: 0 };
    writeRec(cur);
    afterChange({ focus: true });
  }
  function startBreak() {
    var t = Date.now();
    cur = { v: 1, kind: 'break', id: newId('f'), intent: '', mod: '', plan: BREAK_MIN, b0: 0, start: t, paused: 0, pauseAt: 0, dfm: false, ann: 0, phase: 'run', mins: 0, done: false, endAt: 0 };
    writeRec(cur);
    afterChange({ focus: true });
  }
  // the timer reached zero (early = false) or the learner ended it (early = true)
  function complete(early, away) {
    var r = cur; if (!r || r.phase !== 'run') return;
    var t = Date.now(), endAt = early ? t : Math.min(t, endTime(r));
    var e = Math.min(elapsed(r, endAt), r.plan * 60000);
    if (r.kind === 'break') {
      clearRec(); afterChange();
      C.toast(early ? 'Break ended.' : 'Break over. Start your next session when you are ready.');
      return;
    }
    var mins = early ? Math.floor(e / 60000) : r.plan;
    if (mins < 1) {
      clearRec(); afterChange();
      C.toast('You ended before one minute, so this session was not saved.');
      return;
    }
    var st = S();
    st.fs[r.id] = { at: new Date(endAt).toISOString(), mins: mins, plan: r.plan, done: !early, intent: r.intent, mod: r.mod };
    prefs().focusLast = r.id;
    C.logActivity(); C.save();
    r.phase = 'done'; r.mins = mins; r.done = !early; r.endAt = endAt; r.dfm = false; r.pauseAt = 0;
    writeRec(r); cur = r;
    afterChange();
    C.toast(away ? 'Your focus session ended while you were away: ' + plural(mins, 'minute') + ' saved.'
      : early ? 'Session saved: ' + plural(mins, 'focused minute') + '.' : 'Session done: ' + plural(mins, 'focused minute') + '. Well done.');
    ST.emit('focus-done', r.id, st.fs[r.id]);
  }
  function setDfm(on) {
    var r = cur; if (!r || r.kind !== 'focus' || r.phase !== 'run') return;
    r.dfm = !!on; writeRec(r);
    afterChange();
    say(on ? 'Distraction-free mode is on.' : 'Distraction-free mode is off.');
  }

  /* ---------- the floating timer chip (outside main, on every page while a session runs) ---------- */
  var chipRO = null;
  function chipBody(r, v) {
    if (v === 'done') {
      return '<a class="fc-chip-link" href="#focus"><span class="fc-chip-ico fc-chip-ok" aria-hidden="true">✓</span><span class="fc-chip-k">Session done</span></a>' +
        '<button type="button" class="btn btn-sm btn-ghost fc-chip-btn" data-fc="dismiss" aria-label="Close the session done notice">Close</button>';
    }
    var k = v === 'breath' ? 'Settling breath' : v === 'break' ? 'Break' : r.pauseAt ? 'Paused' : 'Focus';
    return '<a class="fc-chip-link" href="#focus"><span class="fc-chip-ico">' + ICON + '</span><span class="fc-chip-k">' + k + '</span> <span class="fc-chip-t num"></span><span class="visually-hidden"> left. Open the focus page.</span></a>' +
      (r.dfm && (v === 'run' || v === 'breath') ? '<button type="button" class="btn btn-sm fc-chip-btn" data-fc="exit-dfm">Exit distraction-free mode</button>' : '');
  }
  function chipTime(r, v, t) { return v === 'breath' ? clockText(r.start - t) : clockText(leftMs(r, t)); }
  function measureChip() {
    var chip = $('fc-chip'), on = !!chip && !chip.classList.contains('fc-chip-quiet');
    document.body.classList.toggle('fc-chip-on', on);
    if (on) document.body.style.setProperty('--fc-chip-h', chip.offsetHeight + 'px');
  }
  function updateChip(t) {
    var r = cur, chip = $('fc-chip');
    if (!r) {
      if (chip) { var had = chip.contains(document.activeElement); chip.remove(); if (had && A()) focusIn(A().main); }
      if (chipRO) { chipRO.disconnect(); chipRO = null; }
      measureChip();
      return;
    }
    t = t || Date.now();
    if (!chip) {
      chip = document.createElement('aside');
      chip.id = 'fc-chip'; chip.className = 'fc-chip'; chip.setAttribute('aria-label', 'Focus timer');
      chip.innerHTML = '<div class="fc-chip-body"></div><p class="visually-hidden" id="fc-chip-live" aria-live="polite"></p>';
      document.body.appendChild(chip);
      chip.addEventListener('click', onChipClick);
      if (window.ResizeObserver) { chipRO = new ResizeObserver(measureChip); chipRO.observe(chip); }
    }
    var quiet = !!(page && page.kind === 'focus'), v = viewOf(r, t);
    var sig = [v, r.pauseAt ? 1 : 0, r.dfm ? 1 : 0, quiet ? 1 : 0].join('|');
    var body = chip.firstChild;
    if (chip._sig !== sig) {
      var ae = document.activeElement, inChip = chip.contains(ae) && ae !== chip, act = inChip && ae.getAttribute('data-fc');
      chip._sig = sig;
      chip.classList.toggle('fc-chip-quiet', quiet);
      chip.classList.toggle('fc-chip-done', v === 'done');
      chip.classList.toggle('fc-chip-two', !!(r.dfm && (v === 'run' || v === 'breath')));
      body.hidden = quiet;
      body.innerHTML = chipBody(r, v);
      if (inChip && !quiet) focusIn((act && body.querySelector('[data-fc="' + act + '"]')) || body.querySelector('a'));
      measureChip();
    }
    var tm = body.querySelector('.fc-chip-t');
    if (tm) { var s = chipTime(r, v, t); if (tm.textContent !== s) tm.textContent = s; }
  }
  function onChipClick(ev) {
    var b = ev.target.closest && ev.target.closest('[data-fc]'); if (!b) return;
    var a = b.getAttribute('data-fc');
    if (a === 'exit-dfm') setDfm(false);
    else if (a === 'dismiss') { clearRec(); afterChange(); }
  }

  /* ---------- the Focus page (#focus) ---------- */
  var page = null; // { kind: 'focus'|'journal', view, token, params, ... }
  function viewFocus(match) {
    var app = A();
    if (!app) { // the first page drawn on load runs before AIM_APP exists: draw just after
      setTimeout(function () { if (A() && /^#?focus(~|$)/.test(location.hash)) viewFocus(match); }, 0);
      return;
    }
    cur = readRec();
    var token = {};
    app.setView('<div class="wrap stack-lg fc-page" id="fc-root">' + app.crumbs([['Home', 'home'], ['Study room', 'study'], ['Focus session']]) +
      '<header class="stack-sm"><h1>Focus session</h1>' +
      '<p class="lede prose">Deep work with ' + ST.sans('dharana') + '. Choose one task, put everything else away and give it your full attention until the timer ends.</p>' +
      '<p class="small muted prose">Methods used here: deep work (focused learning sessions), ' + ST.sans('dharana', { meaning: false }) + ', a settling breath from ' + ST.sans('dhyana', { meaning: false }) +
      ' and distraction-free mode from ' + ST.sans('vairagya', { meaning: false }) + '. <a href="#methods">How these methods work</a></p></header>' +
      '<div id="fc-main" class="stack-lg"></div>' +
      '<section id="fc-log" class="stack" aria-labelledby="fc-log-h" hidden></section>' +
      '<p class="visually-hidden" id="fc-live" aria-live="polite"></p></div>', 'Focus session');
    page = { kind: 'focus', view: '', token: token, params: parseParams(match && match[1]) };
    var root = $('fc-root');
    root.addEventListener('click', onFocusClick);
    root.addEventListener('submit', function (ev) { ev.preventDefault(); startFromForm(); });
    root.addEventListener('change', onFocusChange);
    app.onLeave(function () { if (page && page.token === token) page = null; updateChip(); });
    drawFocus();
    tick();
  }
  ST.addRoute(/^focus(?:~(.*))?$/, viewFocus, 'study');

  function drawFocus(opts) {
    var box = $('fc-main'); if (!box || !page || page.kind !== 'focus') return;
    opts = opts || {};
    var ae = document.activeElement, had = opts.focus || (box.contains(ae) && ae !== box);
    var r = cur, v = viewOf(r);
    page.view = v;
    box.innerHTML = v === 'setup' ? setupHTML() : v === 'breath' ? breathHTML(r) : v === 'run' ? runHTML(r) : v === 'done' ? doneHTML(r) : breakHTML();
    var log = $('fc-log');
    if (log) { log.hidden = !(v === 'setup' || v === 'done'); if (!log.hidden) drawLog(); else log.innerHTML = ''; }
    updateFocus();
    if (had) focusIn(box.querySelector('h2'));
  }
  function focusPrefs() {
    var p = prefs();
    var len = p.focusLen === 50 ? '50' : p.focusLen === 'c' ? 'c' : '25';
    var cm = Math.round(Number(p.focusCustom)); if (!(cm >= MIN_C && cm <= MAX_C)) cm = 40;
    var mid = typeof p.focusMod === 'string' ? (mod(p.focusMod) ? p.focusMod : '') : (mod(S().last) ? S().last : '');
    return { len: len, custom: cm, mod: mid, breath: p.focusBreath !== false, dfm: p.focusDfm === true };
  }
  function setupHTML() {
    var p = focusPrefs(), sel = page.params.mod && mod(page.params.mod) ? page.params.mod : p.mod;
    var pick = function (v, label) { return '<label class="fc-pick"><input type="radio" name="fc-len" value="' + v + '"' + (p.len === v ? ' checked' : '') + '><span>' + label + '</span></label>'; };
    return '<section class="card stack fc-setup" aria-labelledby="fc-setup-h"><h2 class="h-sub" id="fc-setup-h" tabindex="-1">Plan your session</h2>' +
      '<form id="fc-form" class="stack" novalidate>' +
      '<div class="stack-sm"><label for="fc-intent"><strong>What will you do in this session?</strong></label>' +
      '<span class="small muted" id="fc-intent-hint">One clear task, for example "Solve the three NumPy exercises in Module 1.4" or "Watch the regression video and write five notes".</span>' +
      '<input type="text" id="fc-intent" maxlength="200" autocomplete="off" aria-describedby="fc-intent-hint">' +
      '<p class="small fc-err" id="fc-intent-err" hidden></p></div>' +
      '<fieldset class="fc-fieldset stack-sm"><legend><strong>Length</strong></legend><div class="fc-picks">' + pick('25', '25 minutes') + pick('50', '50 minutes') + pick('c', 'Custom') + '</div>' +
      '<div class="stack-sm fc-custom" id="fc-custom-row"' + (p.len === 'c' ? '' : ' hidden') + '><label for="fc-custom">Custom length in minutes (10 to 90)</label>' +
      '<input type="number" class="fc-num" id="fc-custom" min="' + MIN_C + '" max="' + MAX_C + '" step="1" inputmode="numeric" value="' + p.custom + '">' +
      '<p class="small fc-err" id="fc-custom-err" hidden></p></div></fieldset>' +
      '<div class="stack-sm"><label for="fc-mod"><strong>Module</strong> <span class="muted">(optional)</span></label><select id="fc-mod" class="fc-select">' + modOptions(sel) + '</select></div>' +
      '<div class="stack-sm">' +
      '<div class="fc-check"><input type="checkbox" id="fc-breath" aria-describedby="fc-breath-d"' + (p.breath ? ' checked' : '') + '><div class="stack-sm"><label for="fc-breath"><strong>Start with one minute of settling breath</strong></label>' +
      '<span class="small muted" id="fc-breath-d">' + ST.sans('dhyana') + '. Breathe in for 4 seconds and out for 6, following the words on screen. You can skip it.</span></div></div>' +
      '<div class="fc-check"><input type="checkbox" id="fc-dfm" aria-describedby="fc-dfm-d"' + (p.dfm ? ' checked' : '') + '><div class="stack-sm"><label for="fc-dfm"><strong>Distraction-free mode</strong></label>' +
      '<span class="small muted" id="fc-dfm-d">' + ST.sans('vairagya') + '. Hides the main menu, the footer, the next and previous module links, other video options and Continue watching until the session ends.</span></div></div>' +
      '</div><div class="row"><button type="submit" class="btn btn-primary">Start</button></div></form></section>';
  }
  function breathPhase(r, t) { var b0 = r.b0 || r.start - BREATH_MS; return ((t - b0) % CYCLE_MS + CYCLE_MS) % CYCLE_MS; }
  function breathHTML(r) {
    var p = breathPhase(r, Date.now());
    return '<section class="card stack fc-breath" aria-labelledby="fc-breath-h"><h2 class="h-sub" id="fc-breath-h" tabindex="-1">Settling breath</h2>' +
      '<p class="small muted prose">' + ST.sans('dhyana') + '. Sit comfortably, relax your shoulders and follow the words: in for 4 seconds, out for 6. If slow breathing feels uncomfortable, breathe normally or skip.</p>' +
      '<div class="fc-breath-stage">' + (reduced() ? '' : '<div class="fc-orb" aria-hidden="true" style="animation-delay:-' + Math.round(p) + 'ms"></div>') +
      '<p class="fc-say" id="fc-say"><span id="fc-say-w"></span> <span class="num" id="fc-say-n"></span></p></div>' +
      '<p class="small muted num">Your session starts in <span id="fc-breath-left"></span>.</p>' +
      '<div class="row"><button type="button" class="btn btn-primary" data-fc="skip">Skip to the timer</button><button type="button" class="btn btn-ghost" data-fc="cancel">Cancel session</button></div></section>';
  }
  function runHTML(r) {
    var m = mod(r.mod);
    return '<section class="card stack fc-run" aria-labelledby="fc-run-h"><h2 class="h-sub" id="fc-run-h" tabindex="-1">Session running</h2>' +
      '<div class="stack-sm"><span class="eyebrow">Your intention</span><p class="fc-intent">' + esc(r.intent) + '</p>' +
      (m ? '<p class="small">Module <a href="#m-' + esc(m.id) + '">' + esc(modLabel(m)) + '</a></p>' : '') + '</div>' +
      '<div class="fc-clock num" role="timer" aria-label="Time left" id="fc-time"></div>' +
      A().bar(0, 'Session progress') +
      '<p class="small muted num" id="fc-sofar"></p>' +
      '<div class="row"><button type="button" class="btn btn-primary" data-fc="pause">Pause</button><button type="button" class="btn" data-fc="add5">Add 5 minutes</button><button type="button" class="btn btn-ghost" data-fc="end">End early</button></div>' +
      '<div class="row"><button type="button" class="btn btn-sm" data-fc="dfm"></button></div>' +
      '<p class="small muted prose">If another thought comes up, jot it on paper and come back to your task. The timer keeps time even if you open other pages or close this tab.</p></section>';
  }
  function doneHTML(r) {
    var m = mod(r.mod);
    var href = '#journal~' + (m ? 'mod=' + m.id + '&' : '') + 'fs=' + r.id;
    return '<section class="card stack fc-done" aria-labelledby="fc-done-h"><h2 class="h-sub" id="fc-done-h" tabindex="-1">Session done</h2>' +
      '<p>' + (r.done ? 'You focused for <strong>' + esc(plural(r.mins, 'minute')) + '</strong>. Well done.' : 'You ended early after <strong>' + esc(r.mins + ' of ' + r.plan + ' minutes') + '</strong>. That still counts.') + '</p>' +
      (r.intent ? '<p class="small"><span class="muted">Your intention:</span> ' + esc(r.intent) + '</p>' : '') +
      (m ? '<p class="small">Module <a href="#m-' + esc(m.id) + '">' + esc(modLabel(m)) + '</a></p>' : '') +
      '<p class="small muted prose">Note what you learnt while it is fresh (' + ST.sans('svadhyaya', { meaning: false }) + '), or rest your mind for a few minutes before the next session.</p>' +
      '<div class="row"><a class="btn btn-primary" href="' + esc(href) + '">Write a short journal entry</a>' +
      '<button type="button" class="btn" data-fc="break">Start a 5-minute break</button><button type="button" class="btn btn-ghost" data-fc="new">Plan another session</button></div></section>';
  }
  function breakHTML() {
    return '<section class="card stack fc-run fc-break" aria-labelledby="fc-break-h"><h2 class="h-sub" id="fc-break-h" tabindex="-1">Break</h2>' +
      '<div class="fc-clock num" role="timer" aria-label="Break time left" id="fc-time"></div>' +
      '<p class="prose">Stand up and stretch, drink some water and look at something far away. Try to keep social media closed so your mind can rest.</p>' +
      '<div class="row"><button type="button" class="btn" data-fc="end-break">End break</button></div></section>';
  }
  function updateFocus(t) {
    if (!page || page.kind !== 'focus') return;
    var r = cur, v = page.view; if (!r) return;
    t = t || Date.now();
    if (v === 'breath') {
      var p = breathPhase(r, t), inn = p < IN_MS;
      setText('fc-say-w', inn ? 'Breathe in slowly' : 'Breathe out gently');
      setText('fc-say-n', String(inn ? Math.ceil((IN_MS - p) / 1000) : Math.ceil((CYCLE_MS - p) / 1000)));
      setText('fc-breath-left', clockText(r.start - t));
      var sy = $('fc-say'); if (sy) sy.className = 'fc-say ' + (inn ? 'is-in' : 'is-out');
    } else if (v === 'run' || v === 'break') {
      setText('fc-time', clockText(leftMs(r, t)));
      if (v !== 'run') return;
      var e = elapsed(r, t), pct = Math.min(100, Math.round(e / (r.plan * 60000) * 100));
      var bar = document.querySelector('#fc-main .bar');
      if (bar && bar.getAttribute('aria-valuenow') !== String(pct)) { bar.setAttribute('aria-valuenow', pct); if (bar.firstChild) bar.firstChild.style.width = pct + '%'; }
      setText('fc-sofar', 'Focused so far: ' + fmtMins(Math.floor(e / 60000)) + ' of ' + fmtMins(r.plan) + ' planned' + (r.pauseAt ? ' (paused)' : ''));
      setText('fc-run-h', r.pauseAt ? 'Session paused' : 'Session running');
      var box = $('fc-main');
      var pb = box.querySelector('[data-fc="pause"]'); if (pb && pb.textContent !== (r.pauseAt ? 'Resume' : 'Pause')) pb.textContent = r.pauseAt ? 'Resume' : 'Pause';
      var ab = box.querySelector('[data-fc="add5"]'); if (ab) ab.disabled = r.plan + ADD > PLAN_CAP;
      var db = box.querySelector('[data-fc="dfm"]'), dl = r.dfm ? 'Exit distraction-free mode' : 'Turn on distraction-free mode';
      if (db && db.textContent !== dl) db.textContent = dl;
    }
  }
  function fieldErr(id, msg) {
    var el = $(id), er = $(id + '-err'); if (!el || !er) return;
    er.textContent = msg; er.hidden = false;
    el.setAttribute('aria-invalid', 'true');
    var d = (el.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
    if (d.indexOf(er.id) < 0) d.push(er.id);
    el.setAttribute('aria-describedby', d.join(' '));
    focusIn(el);
  }
  function clearErr(ids) {
    ids.forEach(function (id) {
      var el = $(id), er = $(id + '-err'); if (!el || !er) return;
      er.hidden = true; er.textContent = ''; el.removeAttribute('aria-invalid');
      el.setAttribute('aria-describedby', (el.getAttribute('aria-describedby') || '').split(' ').filter(function (x) { return x && x !== er.id; }).join(' '));
      if (!el.getAttribute('aria-describedby')) el.removeAttribute('aria-describedby');
    });
  }
  function startFromForm() {
    if (cur) return;
    var intent = ($('fc-intent').value || '').replace(/\s+/g, ' ').trim();
    var lenEl = document.querySelector('input[name="fc-len"]:checked'), len = lenEl ? lenEl.value : '25';
    var plan = len === 'c' ? Number(($('fc-custom').value || '').trim() || NaN) : Number(len);
    clearErr(['fc-intent', 'fc-custom']);
    if (!intent) { fieldErr('fc-intent', 'Write one line about what you will do, for example "Finish the Pandas exercises".'); return; }
    if (len === 'c' && !(Math.floor(plan) === plan && plan >= MIN_C && plan <= MAX_C)) { fieldErr('fc-custom', 'Choose a whole number of minutes from 10 to 90.'); return; }
    var mid = $('fc-mod').value; if (!mod(mid)) mid = '';
    var breath = $('fc-breath').checked, dfm = $('fc-dfm').checked;
    var p = prefs();
    p.focusLen = len === 'c' ? 'c' : plan; if (len === 'c') p.focusCustom = plan;
    p.focusMod = mid; p.focusBreath = breath; p.focusDfm = dfm;
    C.save();
    start({ intent: intent, plan: plan, mod: mid, breath: breath, dfm: dfm });
  }
  function onFocusChange(ev) {
    if (ev.target && ev.target.name === 'fc-len') { var row = $('fc-custom-row'); if (row) row.hidden = ev.target.value !== 'c'; if (ev.target.value !== 'c') clearErr(['fc-custom']); }
  }
  function onFocusClick(ev) {
    var b = ev.target.closest && ev.target.closest('[data-fc]'); if (!b) return;
    var a = b.getAttribute('data-fc'), r = cur, t = Date.now();
    if (a === 'skip' && r && inBreath(r, t)) { r.start = t; writeRec(r); afterChange({ focus: true }); }
    else if (a === 'cancel' && r && r.phase === 'run') { clearRec(); afterChange({ focus: true }); say('Session cancelled. Nothing was saved.'); }
    else if (a === 'pause' && r && r.phase === 'run' && !inBreath(r, t)) {
      if (r.pauseAt) { r.paused += Math.max(0, t - r.pauseAt); r.pauseAt = 0; } else r.pauseAt = t;
      writeRec(r); afterChange(); say(r.pauseAt ? 'Paused.' : 'Resumed.');
    }
    else if (a === 'add5' && r && r.phase === 'run') { r.plan = Math.min(PLAN_CAP, r.plan + ADD); writeRec(r); afterChange(); say('Added 5 minutes. ' + clockText(leftMs(r)) + ' left.'); }
    else if ((a === 'end' || a === 'end-break') && r && r.phase === 'run') complete(true, false);
    else if (a === 'dfm' && r) setDfm(!r.dfm);
    else if (a === 'break') startBreak();
    else if (a === 'new') { clearRec(); afterChange({ focus: true }); }
    else if (a === 'del') delSession(b);
  }

  /* ---------- the focus log ---------- */
  function sessions() {
    var fs = S().fs || {};
    return Object.keys(fs).map(function (id) { var x = fs[id]; return { id: id, x: x, t: Date.parse(x.at) || 0 }; }).sort(function (a, b) { return b.t - a.t; });
  }
  function weekStats() {
    var t = ST.today(), ws = weekStart(t), out = { mins: 0, n: 0, done: 0 };
    sessions().forEach(function (s) { var d = dayOf(s.t); if (d >= ws && d <= t) { out.mins += s.x.mins; out.n++; if (s.x.done) out.done++; } });
    return out;
  }
  function drawLog() {
    var el = $('fc-log'); if (!el) return;
    var all = sessions(), w = weekStats(), total = all.reduce(function (a, s) { return a + s.x.mins; }, 0), t = ST.today();
    var days = [], per = {};
    for (var i = 6; i >= 0; i--) days.push(ST.addDays(t, -i));
    all.forEach(function (s) { var d = dayOf(s.t); per[d] = (per[d] || 0) + s.x.mins; });
    var max = Math.max(25, Math.max.apply(null, days.map(function (d) { return per[d] || 0; })));
    var bars = days.map(function (d) {
      var v = per[d] || 0, h = v ? Math.max(4, Math.round(v / max * 100)) : 0, today = d === t;
      return '<li class="' + (today ? 'is-today' : '') + '"><span class="visually-hidden">' + esc((today ? 'Today, ' : '') + longDay(d) + ': ' + (v ? plural(v, 'minute') : 'no focus time')) + '</span>' +
        '<span class="fc-bar-v num" aria-hidden="true">' + v + '</span><span class="fc-bar" aria-hidden="true"><span style="height:' + h + '%"></span></span>' +
        '<span class="fc-bar-d" aria-hidden="true">' + esc(today ? 'Today' : shortDay(d)) + '</span></li>';
    }).join('');
    var last = all.slice(0, 10);
    el.innerHTML = '<h2 class="h-sub" id="fc-log-h" tabindex="-1">Your focus log</h2>' +
      '<div class="lab-stats">' + stat('This week', fmtMins(w.mins)) + stat('Sessions this week', w.n) + stat('Finished as planned', w.done + ' of ' + w.n) + stat('All time', fmtMins(total)) + '</div>' +
      '<p class="small muted">The week starts on Monday. A session counts on the day it ended.</p>' +
      '<figure class="fc-week"><figcaption class="h-sub3">Focused minutes, last 7 days</figcaption><ol class="fc-bars">' + bars + '</ol></figure>' +
      '<h3 class="h-sub3">Last 10 sessions</h3>' +
      (last.length ? '<ul class="fc-log-list">' + last.map(function (s) {
        var m = mod(s.x.mod), when = fmtDate(s.t, true), name = s.x.intent || 'Focus session';
        return '<li class="fc-log-item"><div class="stack-sm fc-log-main"><strong>' + esc(name) + '</strong>' +
          '<span class="small muted num">' + esc(when + ' · ' + s.x.mins + ' of ' + s.x.plan + ' min') + '</span>' +
          (m ? '<span class="small"><a href="#m-' + esc(m.id) + '">Module ' + esc(modLabel(m)) + '</a></span>' : '') + '</div>' +
          '<div class="row fc-log-side"><span class="chip' + (s.x.done ? ' chip-ok' : '') + '">' + (s.x.done ? 'Finished' : 'Ended early') + '</span>' +
          '<button type="button" class="btn btn-sm btn-ghost" data-fc="del" data-id="' + esc(s.id) + '" aria-label="' + esc('Delete session: ' + name + ', ' + when) + '">Delete</button></div></li>';
      }).join('') + '</ul>' : '<div class="empty">No sessions yet. Plan one above: 25 minutes is a good start.</div>');
  }
  function delSession(btn) {
    var id = btn.getAttribute('data-id'), st = S(); if (!id || !st.fs[id]) return;
    var list = Array.prototype.slice.call(document.querySelectorAll('#fc-log [data-fc="del"]')), i = list.indexOf(btn);
    delete st.fs[id]; C.save();
    drawLog();
    var now = document.querySelectorAll('#fc-log [data-fc="del"]');
    focusIn(now[i] || now[i - 1] || $('fc-log-h'));
    say('Session deleted.');
  }

  /* ---------- the Learning journal (#journal) ---------- */
  var FALLBACK_METHODS = ['Active recall', 'Spaced repetition', 'Feynman technique', 'Deliberate practice', 'Interleaved practice', 'Elaborative interrogation', 'Self-explanation',
    'Deep work (focused learning)', 'Practice testing', 'Dual coding', 'Chunking', 'Metacognitive learning', 'Learning from errors and feedback', 'Project-based learning',
    'Progressive difficulty and scaffolding'].concat(['sravana', 'manana', 'nididhyasana', 'abhyasa', 'vairagya', 'svadhyaya', 'dharana', 'dhyana', 'smarana', 'japa'].map(function (k) {
    var x = ST.SANS && ST.SANS[k]; return x ? x[0] + ' (' + x[2] + ')' : k;
  })).concat(['Adaptive learning paths', 'AI-powered active recall', 'Adaptive spaced repetition', 'Socratic questioning', 'AI Feynman explanation check', 'Personalised deliberate practice',
    'AI-generated practice tests', 'Knowledge gap detection', 'Error analysis and feedback', 'Adaptive interleaving', 'Focused learning sessions', 'Reflective learning journal',
    'Progressive skill mastery', 'Project-based competency assessment', 'Long-term retention tracking']);
  var DEV = /[ऀ-ॿ]/;
  function methodNames() {
    var g = ST.guide(), list = g && Array.isArray(g.methods) ? g.methods.map(function (m) { return m && typeof m.name === 'string' ? m.name : ''; }).filter(function (n) { return n && !DEV.test(n); }) : [];
    return list.length ? list : FALLBACK_METHODS;
  }
  function splitLearnt(e) {
    var t = (e && e.learnt) || '', meth = e && typeof e.meth === 'string' ? e.meth : '';
    var i = t.lastIndexOf(METH);
    if (i >= 0 && (i === 0 || t.charAt(i - 1) === '\n') && t.indexOf('\n', i) < 0) { meth = meth || t.slice(i + METH.length).trim(); t = t.slice(0, i).replace(/\s+$/, ''); }
    return { learnt: t, meth: meth };
  }
  function created(id, e) { return idTime(id) || Date.parse(e && e.at) || 0; }
  function entries() {
    var jr = S().jr || {};
    return Object.keys(jr).filter(function (id) { return jr[id] && !jr[id].del; }).map(function (id) { return { id: id, e: jr[id], t: created(id, jr[id]) }; })
      .sort(function (a, b) { return b.t - a.t || String(b.e.at).localeCompare(String(a.e.at)); });
  }
  function weeklyAnswer(exceptId) { // this week's answer to "Which method helped you most?", if one was given
    var ws = weekStart(ST.today()), found = '';
    entries().some(function (x) { if (x.id === exceptId || dayOf(x.t) < ws) return false; var m = splitLearnt(x.e).meth; if (m) { found = m; return true; } return false; });
    return found;
  }
  function viewJournal(match) {
    var app = A();
    if (!app) {
      setTimeout(function () { if (A() && /^#?journal(~|$)/.test(location.hash)) viewJournal(match); }, 0);
      return;
    }
    cur = readRec();
    var token = {};
    app.setView('<div class="wrap stack-lg fc-page fc-journal" id="fc-jroot">' + app.crumbs([['Home', 'home'], ['Study room', 'study'], ['Learning journal']]) +
      '<header class="stack-sm"><h1>Learning journal</h1>' +
      '<p class="lede prose">' + ST.sans('svadhyaya') + '. A few honest lines after you study are metacognition (thinking about your own learning): they show what you really understand and what to do next.</p>' +
      '<p class="small muted prose">Methods used here: a reflective learning journal, metacognitive learning and knowledge gap detection (the "Still confusing" list). <a href="#methods">How these methods work</a></p></header>' +
      '<section class="card" id="fc-jform-box"></section>' +
      '<section class="stack" aria-labelledby="fc-jlist-h"><div class="row-between"><h2 class="h-sub" id="fc-jlist-h" tabindex="-1">Your entries</h2>' +
      '<div class="seg fc-jseg" role="group" aria-label="Which entries to show"><button type="button" data-j="view" data-v="all" aria-pressed="true">All entries <span class="num" id="fc-jn-all"></span></button>' +
      '<button type="button" data-j="view" data-v="conf" aria-pressed="false">Still confusing <span class="num" id="fc-jn-conf"></span></button></div></div>' +
      '<div class="row fc-jstatus"><p class="small" id="fc-live" aria-live="polite"></p><span id="fc-jundo"></span></div>' +
      '<div id="fc-jlist" class="stack"></div></section></div>', 'Learning journal');
    page = { kind: 'journal', token: token, params: parseParams(match && match[1]), edit: null, view: 'all', shown: LIST_STEP, undo: null, from: '' };
    var root = $('fc-jroot');
    root.addEventListener('click', onJournalClick);
    root.addEventListener('submit', function (ev) { ev.preventDefault(); saveEntry(); });
    app.onLeave(function () { if (page && page.token === token) page = null; });
    drawJForm();
    drawJList();
    ST.ensureData().then(function () { if (page && page.token === token) fillMethods(); }, function () { /* the built-in list stays */ });
  }
  ST.addRoute(/^journal(?:~(.*))?$/, viewJournal, 'study');

  // minutes (and module) from a focus session that has just finished
  function prefill() {
    var pr = page.params, st = S(), o = { mod: pr.mod && mod(pr.mod) ? pr.mod : '', mins: '', from: '' };
    var sid = pr.fs || prefs().focusLast, s = typeof sid === 'string' && Object.prototype.hasOwnProperty.call(st.fs, sid) ? st.fs[sid] : null;
    if (s) {
      var end = Date.parse(s.at) || 0;
      var fresh = Date.now() - end < FRESH_MS && !entries().some(function (x) { return x.t > end; });
      if (pr.fs || fresh) { o.mins = s.mins; o.from = sid; if (!o.mod && mod(s.mod)) o.mod = s.mod; }
    }
    return o;
  }
  function drawJForm() {
    var box = $('fc-jform-box'); if (!box || !page) return;
    var id = page.edit, e = id ? S().jr[id] : null;
    if (e && e.del) { page.edit = id = null; e = null; }
    var o = e ? { mod: e.mod, mins: e.mins || '', from: '' } : prefill();
    page.from = o.from;
    var sp = e ? splitLearnt(e) : { learnt: '', meth: '' };
    var answered = weeklyAnswer(id), showWeekly = !answered || !!sp.meth;
    var confs = [[1, 'Lost'], [2, 'Shaky'], [3, 'Okay'], [4, 'Good'], [5, 'Sure']];
    var ta = function (fid, label, hint, val, max, rows) {
      return '<div class="stack-sm"><label for="' + fid + '"><strong>' + label + '</strong></label>' + (hint ? '<span class="small muted" id="' + fid + '-hint">' + hint + '</span>' : '') +
        '<textarea id="' + fid + '" rows="' + rows + '" maxlength="' + max + '"' + (hint ? ' aria-describedby="' + fid + '-hint"' : '') + '>' + esc(val || '') + '</textarea>' +
        '<p class="small fc-err" id="' + fid + '-err" hidden></p></div>';
    };
    box.innerHTML = '<form id="fc-jform" class="stack fc-jform" novalidate aria-labelledby="fc-jform-h">' +
      '<h2 class="h-sub" id="fc-jform-h" tabindex="-1">' + (e ? esc('Edit entry from ' + fmtDate(created(id, e), true)) : 'New entry') + '</h2>' +
      '<p class="small muted prose">Answer any of these in a line or two, in your own words. Short and honest is best.</p>' +
      '<div class="stack-sm"><label for="fc-jmod"><strong>Module</strong> <span class="muted">(optional)</span></label><select id="fc-jmod" class="fc-select">' + modOptions(o.mod) + '</select></div>' +
      ta('fc-jlearnt', 'What did I learn?', '', sp.learnt, 1800, 3) +
      ta('fc-jconfused', 'What confused me?', 'Leave it empty if nothing did. Anything you write here also collects in the "Still confusing" list below.', e ? e.confused : '', 2000, 3) +
      ta('fc-jnext', 'What will I do next?', '', e ? e.next : '', 1000, 2) +
      '<fieldset class="fc-fieldset stack-sm"><legend><strong>How confident do I feel? 1 to 5</strong> <span class="small muted">(optional)</span></legend><div class="fc-picks">' +
      confs.map(function (c) { return '<label class="fc-pick fc-pick-conf"><input type="radio" name="fc-conf" value="' + c[0] + '"' + (e && e.conf === c[0] ? ' checked' : '') + '><span><b>' + c[0] + '</b> <small>' + c[1] + '</small></span></label>'; }).join('') +
      '</div></fieldset>' +
      '<div class="stack-sm"><label for="fc-jmins"><strong>Minutes studied</strong> <span class="muted">(optional)</span></label>' +
      (o.from ? '<span class="small muted" id="fc-jmins-hint">Filled in from the focus session you just finished.</span>' : '') +
      '<input type="number" class="fc-num" id="fc-jmins" min="0" max="600" step="1" inputmode="numeric" value="' + esc(String(o.mins)) + '"' + (o.from ? ' aria-describedby="fc-jmins-hint"' : '') + '>' +
      '<p class="small fc-err" id="fc-jmins-err" hidden></p></div>' +
      (showWeekly ? '<div class="stack-sm fc-weekly"><label for="fc-jmeth"><strong>This week\'s question: which method helped you most this week?</strong> <span class="muted">(optional)</span></label>' +
        '<span class="small muted" id="fc-jmeth-hint">Pick one from the list or type your own. <a href="#methods">See the methods</a>.</span>' +
        '<input type="text" id="fc-jmeth" list="fc-jmeth-list" maxlength="120" autocomplete="off" aria-describedby="fc-jmeth-hint" value="' + esc(sp.meth) + '"><datalist id="fc-jmeth-list">' +
        methodNames().map(function (n) { return '<option value="' + esc(n) + '"></option>'; }).join('') + '</datalist></div>'
        : '<p class="small muted">This week you said <strong>' + esc(answered) + '</strong> helped you most. The weekly question comes back on Monday.</p>') +
      '<div class="row"><button type="submit" class="btn btn-primary">' + (e ? 'Save changes' : 'Save entry') + '</button>' + (e ? '<button type="button" class="btn btn-ghost" data-j="cancel">Cancel edit</button>' : '') + '</div></form>';
  }
  function fillMethods() {
    var dl = $('fc-jmeth-list'); if (!dl) return;
    dl.innerHTML = methodNames().map(function (n) { return '<option value="' + esc(n) + '"></option>'; }).join('');
  }
  function jErr(id, msg) { fieldErr(id, msg); }
  function saveEntry() {
    if (!page || page.kind !== 'journal') return;
    var val = function (id) { var el = $(id); return el ? String(el.value || '').replace(/\r/g, '').trim() : ''; };
    var learnt = val('fc-jlearnt'), confused = val('fc-jconfused'), next = val('fc-jnext');
    var methEl = $('fc-jmeth'), meth = methEl ? methEl.value.replace(/\s+/g, ' ').trim().slice(0, 120) : null;
    var minsRaw = val('fc-jmins'), mins = minsRaw === '' ? 0 : Number(minsRaw);
    var ce = document.querySelector('input[name="fc-conf"]:checked'), conf = ce ? Number(ce.value) : 0;
    clearErr(['fc-jlearnt', 'fc-jmins']);
    if (!learnt && !confused && !next) { jErr('fc-jlearnt', 'Write at least one line: what you learnt, what confused you or what you will do next.'); return; }
    if (!(Math.floor(mins) === mins && mins >= 0 && mins <= 600)) { jErr('fc-jmins', 'Minutes must be a whole number from 0 to 600.'); return; }
    var mid = $('fc-jmod').value; if (!mod(mid)) mid = '';
    var st = S(), id = page.edit, old = id && st.jr[id] && !st.jr[id].del ? st.jr[id] : null;
    if (meth === null) meth = old ? splitLearnt(old).meth : '';
    var stored = learnt + (meth ? (learnt ? '\n\n' : '') + METH + meth : '');
    var entry = { at: ST.now(), learnt: stored, confused: confused, next: next, conf: conf, mod: mid, mins: mins, del: false };
    if (old) st.jr[id] = entry;
    else { id = newId('j'); st.jr[id] = entry; C.logActivity(); }
    var wasNew = !old, from = page.from, pf = prefs();
    if (wasNew && pf.focusLast) delete pf.focusLast;
    C.save();
    // the "Session done" notice has done its job once its journal entry is written
    if (wasNew && cur && cur.phase === 'done' && (from === cur.id || page.params.fs === cur.id)) { clearRec(); afterChange(); }
    page.edit = null; page.params = {}; page.view = 'all';
    try { if (/^#journal~/.test(location.hash)) history.replaceState(null, '', '#journal'); } catch (e) {}
    var idx = entries().map(function (x) { return x.id; }).indexOf(id);
    if (idx >= page.shown) page.shown = idx + 1;
    drawJForm(); drawJList();
    say(wasNew ? 'Entry saved.' : 'Changes saved.');
    var h = $('fc-jh-' + id); if (h) { focusIn(h); }
  }
  function aiPrompt(id) {
    var e = S().jr[id]; if (!e || e.del || !e.confused) return '';
    var m = mod(e.mod), sp = splitLearnt(e);
    return 'I am studying ' + (m ? 'the module "' + m.title + '" (module ' + modNo(m) + ')' : 'AI and machine learning') + ' on a free course site.' +
      (m && Array.isArray(m.topics) && m.topics.length ? ' The module covers: ' + m.topics.slice(0, 6).join(', ') + '.' : '') +
      '\nIn my learning journal I wrote that this confused me:\n"' + e.confused + '"' +
      (sp.learnt ? '\nWhat I did understand:\n"' + sp.learnt + '"' : '') +
      '\n\nPlease:\n1. Explain the confusing idea in simple terms, with one everyday Indian example.\n2. Ask me one short question to check that I understood.\n' +
      '3. Suggest one next step on the course site, choosing only from these: Daily review (spaced recall of key terms and lesson questions), ' +
      (m ? 'the Reflect tab of this module' : 'the Reflect tab of the module') + ' (explain the idea in my own words, then answer Manana questions), or Mixed practice in the Study room (quiz questions mixed from several modules). Say which one and why in one sentence.';
  }
  function entryHTML(x) {
    var e = x.e, sp = splitLearnt(e), m = mod(e.mod), when = fmtDate(x.t, true), meta = [];
    if (e.conf) meta.push('Confidence ' + e.conf + ' of 5');
    if (e.mins) meta.push(fmtMins(e.mins));
    var part = function (label, text) { return text ? '<div><dt>' + label + '</dt><dd>' + C.md(text) + '</dd></div>' : ''; };
    return '<article class="card stack-sm fc-jentry" id="fc-j-' + esc(x.id) + '" aria-labelledby="fc-jh-' + esc(x.id) + '">' +
      '<div class="row-between"><h3 class="h-sub3" id="fc-jh-' + esc(x.id) + '" tabindex="-1">' + esc(when) + '</h3>' + (meta.length ? '<span class="small muted num">' + esc(meta.join(' · ')) + '</span>' : '') + '</div>' +
      (m ? '<p class="small">Module <a href="#m-' + esc(m.id) + '">' + esc(modLabel(m)) + '</a></p>' : e.mod ? '<p class="small muted">A module that is no longer in the course</p>' : '') +
      '<dl class="fc-jdl">' + part('What I learnt', sp.learnt) + part('What confused me', e.confused) + part('What I will do next', e.next) + part('Method that helped most this week', sp.meth) + '</dl>' +
      '<div class="row"><button type="button" class="btn btn-sm" data-j="edit" data-id="' + esc(x.id) + '" aria-label="' + esc('Edit entry: ' + when) + '">Edit</button>' +
      '<button type="button" class="btn btn-sm btn-ghost" data-j="del" data-id="' + esc(x.id) + '" aria-label="' + esc('Delete entry: ' + when) + '">Delete</button></div>' +
      (e.confused ? ST.aiHTML('jr', 'Ask Gemini about my confusion') : '') + '</article>';
  }
  function confusingHTML(list) {
    if (!list.length) return '<div class="empty">Nothing here. When something confuses you, write it under "What confused me?" and it will collect here, grouped by module.</div>';
    var groups = {}, order = [];
    list.forEach(function (x) { var k = mod(x.e.mod) ? x.e.mod : ''; if (!groups[k]) { groups[k] = []; order.push(k); } groups[k].push(x); });
    var pos = function (k) { var m = mod(k); return m ? (D.modules || []).indexOf(m) : 1e6; };
    order.sort(function (a, b) { return pos(a) - pos(b); });
    return '<p class="small muted prose">Everything you wrote under "What confused me?", grouped by module. When an idea becomes clear, edit that entry and empty the box to take it off this list.</p>' +
      order.map(function (k, i) {
        var m = mod(k);
        return '<section class="card stack-sm fc-jgroup" aria-labelledby="fc-jg-' + i + '"><h3 class="h-sub3" id="fc-jg-' + i + '">' + (m ? '<a href="#m-' + esc(m.id) + '">Module ' + esc(modLabel(m)) + '</a>' : 'No module') + '</h3>' +
          '<ul class="fc-jconf">' + groups[k].map(function (x) { return '<li><div class="prose">' + C.md(x.e.confused) + '</div><span class="small muted">From your entry of ' + esc(fmtDate(x.t, true)) + '</span></li>'; }).join('') + '</ul>' +
          '<p class="small">Next steps: <a href="#review">Daily review</a>' + (m ? ' · <a href="#m-' + esc(m.id) + '~reflect">Reflect tab of this module</a>' : '') + ' · <a href="#study">Mixed practice in the Study room</a></p></section>';
      }).join('');
  }
  function drawJList() {
    var box = $('fc-jlist'); if (!box || !page) return;
    var list = entries(), conf = list.filter(function (x) { return !!x.e.confused; });
    setText('fc-jn-all', '(' + list.length + ')'); setText('fc-jn-conf', '(' + conf.length + ')');
    document.querySelectorAll('#fc-jroot [data-j="view"]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === page.view)); });
    if (page.view === 'conf') { box.innerHTML = confusingHTML(conf); return; }
    if (!list.length) { box.innerHTML = '<div class="empty">No entries yet. After you study, write two or three lines above. Entries are saved in this browser, and in your account if you sign in.</div>'; return; }
    var shown = list.slice(0, page.shown);
    box.innerHTML = shown.map(entryHTML).join('') +
      (list.length > shown.length ? '<div><button type="button" class="btn btn-sm" data-j="more">Show older entries (' + (list.length - shown.length) + ' more)</button></div>' : '');
    Array.prototype.forEach.call(box.querySelectorAll('.fc-jentry'), function (art) {
      var id = art.id.slice(5);
      ST.bindAI(art, 'jr', function () { return aiPrompt(id); });
    });
  }
  function setUndo(id) {
    var u = $('fc-jundo'); if (!u) return;
    u.innerHTML = id ? '<button type="button" class="btn btn-sm" data-j="undo" data-id="' + esc(id) + '">Undo</button>' : '';
  }
  function onJournalClick(ev) {
    var b = ev.target.closest && ev.target.closest('[data-j]'); if (!b || !page) return;
    var a = b.getAttribute('data-j'), id = b.getAttribute('data-id'), st = S();
    if (a === 'view') {
      page.view = b.getAttribute('data-v') === 'conf' ? 'conf' : 'all'; page.shown = LIST_STEP;
      drawJList();
    } else if (a === 'more') {
      var before = page.shown; page.shown += LIST_STEP; drawJList();
      var arts = document.querySelectorAll('#fc-jlist .fc-jentry h3'); focusIn(arts[before] || arts[arts.length - 1]);
    } else if (a === 'edit' && id && st.jr[id] && !st.jr[id].del) {
      page.edit = id; drawJForm();
      var fh = $('fc-jform-h'); if (fh) { try { fh.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' }); } catch (e) {} focusIn(fh); }
    } else if (a === 'cancel') {
      var was = page.edit; page.edit = null; drawJForm();
      var back = was && $('fc-jh-' + was); focusIn(back || $('fc-jform-h'));
    } else if (a === 'del' && id && st.jr[id] && !st.jr[id].del) {
      var e = st.jr[id];
      page.undo = { id: id, e: { at: e.at, learnt: e.learnt, confused: e.confused, next: e.next, conf: e.conf, mod: e.mod, mins: e.mins, del: false } };
      st.jr[id] = { at: ST.now(), learnt: '', confused: '', next: '', conf: 0, mod: '', mins: 0, del: true };
      C.save();
      if (page.edit === id) { page.edit = null; drawJForm(); }
      drawJList(); setUndo(id);
      say('Entry deleted.');
      focusIn($('fc-jlist-h'));
    } else if (a === 'undo' && page.undo && page.undo.id === id) {
      var u = page.undo; page.undo = null;
      st.jr[id] = Object.assign({}, u.e, { at: ST.now(), del: false });
      C.save();
      setUndo(null); drawJForm(); drawJList();
      say('Entry restored.');
      focusIn($('fc-jh-' + id) || $('fc-jlist-h'));
    }
  }

  /* ---------- distraction-free mode: mark the parts it hides (CSS :has covers the same in newer browsers) ---------- */
  ST.on('watch', function (m, el) { var more = el && el.querySelector('#more-all'); if (more && more.parentNode) more.parentNode.classList.add('fc-hide-more'); });
  function tagContinue(root) {
    if (!root || !root.querySelectorAll) return;
    Array.prototype.forEach.call(root.querySelectorAll('.continue-list'), function (ul) { if (ul.parentNode && ul.parentNode !== root) ul.parentNode.classList.add('fc-hide-cw'); });
  }
  ST.on('home', tagContinue);
  ST.on('progress', tagContinue);

  /* ---------- Study room cards ---------- */
  ST.addHubCard(30, function () {
    var w = weekStats(), r = cur, running = !!(r && r.phase === 'run');
    var line = running ? (r.kind === 'break' ? 'You are on a break.' : 'A session is running now.') :
      w.n ? 'This week: <strong>' + esc(fmtMins(w.mins)) + '</strong> focused in ' + esc(plural(w.n, 'session')) + '.' : 'No focus sessions this week yet.';
    return '<article class="card fc-hub" aria-labelledby="fc-hub-f"><h2 class="h-sub" id="fc-hub-f">Focus session</h2>' +
      '<p class="small">Deep work with ' + ST.sans('dharana', { meaning: false }) + '</p>' +
      '<p class="small muted">Choose one task, set a timer for 25 or 50 minutes and give it your full attention. Optional settling breath and distraction-free mode.</p>' +
      '<p id="fc-hub-week">' + line + '</p>' +
      '<div class="row"><a class="btn btn-primary" href="#focus">' + (running ? 'Back to your session' : 'Start a focus session') + '</a></div></article>';
  });
  ST.addHubCard(60, function () {
    var list = entries(), conf = list.filter(function (x) { return !!x.e.confused; }).length;
    return '<article class="card fc-hub" aria-labelledby="fc-hub-j"><h2 class="h-sub" id="fc-hub-j">Learning journal</h2>' +
      '<p class="small">' + ST.sans('svadhyaya', { meaning: false }) + ' and metacognition</p>' +
      '<p class="small muted">After you study, write what you learnt, what confused you and what you will do next.</p>' +
      '<p id="fc-hub-jn">' + (list.length ? esc(plural(list.length, 'entry', 'entries')) + (conf ? ' · ' + conf + ' still confusing' : '') : 'No entries yet.') + '</p>' +
      '<div class="row"><a class="btn btn-primary" href="#journal">' + (list.length ? 'Open your journal' : 'Write your first entry') + '</a></div></article>';
  });

  /* ---------- start: pick up a session that was running before this page loaded ---------- */
  cur = readRec();
  if (cur && cur.phase === 'run' && !cur.pauseAt && !inBreath(cur) && leftMs(cur) <= 0) complete(false, true);
  else { applyDfm(); updateChip(); tick(); }
  document.addEventListener('visibilitychange', function () { if (!document.hidden && cur) tick(); });
  window.addEventListener('pageshow', function (ev) { if (ev.persisted) { cur = readRec(); afterChange(); } });
  window.addEventListener('storage', function (ev) { // another tab started, paused or ended a session
    if (ev.key !== KEY && ev.key !== null) return;
    cur = readRec(); afterChange();
  });
})();
