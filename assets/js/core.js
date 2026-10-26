/* AI Marg core helpers: storage, HTML helpers, video player, quiz engine.
   Plain script (no build step). Exposes window.AIM_CORE. */
(function () {
  'use strict';

  /* ---------------- storage (progress lives only in this browser) ---------------- */
  var KEY = 'aimarg.progress.v1';
  // format version of the saved progress. 2: ticks and edits carry an ISO time, and un-ticks, cleared notes and
  // forgotten video places keep a timed marker (unwatched, notesAt, posOff, stepsAt...), so the newer action wins
  // when two copies are merged. A copy from a newer version keeps its number and every field this code does not know.
  var VERSION = 2;
  var memory = null;
  function blank() {
    return { v: VERSION, prefs: { lang: 'hi', theme: 'system' }, watched: {}, unwatched: {}, quiz: {}, ex: {}, code: {}, labs: {},
      projects: {}, modules: {}, notes: {}, notesAt: {}, last: null, log: {}, pos: {}, posOff: {}, read: {} };
  }
  // when something was done, as an ISO time (older copies hold a day 'YYYY-MM-DD'; compared as text, a day sorts first)
  function stamp() { return new Date().toISOString(); }
  // extra progress parts registered by other scripts (study features): each brings its own normalize and merge
  var parts = {};
  var isObj = function (o) { return !!o && typeof o === 'object' && !Array.isArray(o); };
  var own = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };
  // a time kept as text: an ISO time or an older 'YYYY-MM-DD' day ('' when it is neither)
  function when(v) { return typeof v === 'string' && v.length <= 40 && /^\d{4}-\d{2}-\d{2}/.test(v) ? v : ''; }
  function realDay(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s)); if (!m) return false;
    var x = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return x.getUTCMonth() === +m[2] - 1 && x.getUTCDate() === +m[3];
  }
  // keys that would reach Object.prototype when copied (a damaged or hand-edited copy) are dropped
  function bad(o) { if (o && typeof o === 'object') ['__proto__', 'constructor', 'prototype'].forEach(function (x) { if (own(o, x)) delete o[x]; }); }
  // Make any stored or restored object safe to use: right shapes, numbers that are numbers. Damaged entries are
  // dropped; fields this code does not know (written by a newer version) are kept as they are.
  function normalize(d) {
    var b = blank();
    if (!isObj(d)) d = b;
    Object.keys(b).forEach(function (k) {
      var obj = b[k] && typeof b[k] === 'object';
      if (obj ? !isObj(d[k]) : d[k] === undefined) d[k] = b[k];
    });
    Object.keys(b).forEach(function (k) { bad(d[k]); });
    // entries that must be objects: a damaged one would break a page (a project, a lab) or show as a 0% quiz
    ['ex', 'labs', 'projects', 'modules', 'quiz'].forEach(function (k) { Object.keys(d[k]).forEach(function (x) { if (isObj(d[k][x])) bad(d[k][x]); else delete d[k][x]; }); });
    Object.keys(d.quiz).forEach(function (k) {
      var q = d.quiz[k];
      q.best = Math.max(0, Math.min(100, Math.round(Number(q.best) || 0))); q.attempts = Math.max(0, parseInt(q.attempts, 10) || 0);
      q.last = Math.max(0, Math.min(100, Number(q.last) || 0)); q.at = String(q.at || '').slice(0, 10);
    });
    ['lang', 'theme'].forEach(function (k) { if (typeof d.prefs[k] !== 'string') d.prefs[k] = b.prefs[k]; });
    if (['hi', 'en'].indexOf(d.prefs.lang) < 0) d.prefs.lang = 'hi';
    if (['system', 'light', 'dark'].indexOf(d.prefs.theme) < 0) d.prefs.theme = 'system';
    if (d.prefs.hpw != null) d.prefs.hpw = Math.max(3, Math.min(40, parseInt(d.prefs.hpw, 10) || 10));
    if (d.prefs.start != null && !realDay(d.prefs.start)) delete d.prefs.start;
    // planAt: when the learner last changed the study plan on any device (not set while only the defaults are shown)
    if (d.prefs.planAt != null && !when(d.prefs.planAt)) delete d.prefs.planAt;
    ['notes', 'code'].forEach(function (k) { Object.keys(d[k]).forEach(function (x) { if (typeof d[k][x] !== 'string') delete d[k][x]; }); });
    // notesAt[module] = when the note was last edited; the newer edit wins as a whole when copies are merged
    Object.keys(d.notesAt).forEach(function (x) { if (!when(d.notesAt[x])) delete d.notesAt[x]; });
    // ticks: watched[id] = when it was ticked (truthy for every reader), unwatched[id] = when it was un-ticked.
    // Only the newer of the two stays; on the same time the tick wins.
    Object.keys(d.watched).forEach(function (x) { var v = d.watched[x]; if (!v) delete d.watched[x]; else if (!when(v)) d.watched[x] = '1970-01-01'; });
    Object.keys(d.unwatched).forEach(function (x) {
      var t = when(d.unwatched[x]);
      if (!t || (own(d.watched, x) && !(t > d.watched[x]))) delete d.unwatched[x];
      else delete d.watched[x];
    });
    // module "Mark complete": { done, at } where at is when it was pressed (an ISO time; older copies hold a day)
    Object.keys(d.modules).forEach(function (x) { var m = d.modules[x]; if (typeof m.done !== 'boolean') m.done = !!m.done; if (m.at != null && typeof m.at !== 'string') m.at = String(m.at); });
    // projects: steps/rubric/links maps, with stepsAt/rubricAt/linksAt (and doneAt for done) saying when each changed
    Object.keys(d.projects).forEach(function (x) {
      var p = d.projects[x];
      ['steps', 'rubric', 'links', 'stepsAt', 'rubricAt', 'linksAt'].forEach(function (f) {
        if (p[f] === undefined) return;
        if (!isObj(p[f])) { if (/At$/.test(f)) delete p[f]; else p[f] = {}; return; }
        bad(p[f]);
        if (/At$/.test(f)) Object.keys(p[f]).forEach(function (i) { if (!when(p[f][i])) delete p[f][i]; });
      });
      if (p.links) Object.keys(p.links).forEach(function (k) { if (typeof p.links[k] !== 'string') delete p.links[k]; });
      if (p.doneAt !== undefined && !when(p.doneAt)) delete p.doneAt;
    });
    // glossary flashcards: cards[term] = how well it is known
    if (d.cards !== undefined && !isObj(d.cards)) delete d.cards;
    Object.keys(d.log).forEach(function (x) { d.log[x] = parseInt(d.log[x], 10) || 0; });
    // where each video or playlist was left: i = playlist index, n = playlist length, s = seconds, t = when (ms).
    // posOff[id] = when a place was forgotten on purpose (the video was finished), so an older copy cannot bring it back.
    var num = function (v) { v = Number(v); return isFinite(v) && v > 0 ? v : 0; };
    Object.keys(d.posOff).forEach(function (x) { var t = num(d.posOff[x]); if (t) d.posOff[x] = t; else delete d.posOff[x]; });
    Object.keys(d.pos).forEach(function (x) {
      var p = d.pos[x];
      if (!isObj(p)) { delete d.pos[x]; return; }
      p.i = Math.floor(num(p.i)); p.n = Math.floor(num(p.n)); p.s = Math.floor(num(p.s)); p.t = num(p.t);
      if (own(d.posOff, x)) { if (d.posOff[x] >= p.t) delete d.pos[x]; else delete d.posOff[x]; }
    });
    // lesson cards: read['moduleId/cardKey'] = when the card was ticked (ISO time), or '-' + when it was
    // un-ticked, so the newer action wins when two devices disagree. Older copies held read[moduleId][cardKey].
    var rd = {};
    Object.keys(d.read).forEach(function (k) {
      var v = d.read[k];
      if (v && typeof v === 'object' && !Array.isArray(v)) Object.keys(v).forEach(function (c) { if (v[c] && typeof v[c] !== 'object') rd[k + '/' + c] = String(v[c]).slice(0, 31); });
      else if (v && typeof v !== 'object' && k.indexOf('/') > 0) rd[k] = String(v).slice(0, 31);
    });
    d.read = rd;
    Object.keys(parts).forEach(function (k) { try { d[k] = parts[k].normalize(d[k]); } catch (e) { d[k] = parts[k].normalize(undefined); } });
    // never downgrade: a copy written by a newer version keeps its number (and its fields, see above)
    var v = Math.floor(Number(d.v));
    d.v = isFinite(v) && v > VERSION ? v : VERSION;
    return d;
  }
  function registerPart(key, spec) { parts[key] = spec; state[key] = spec.normalize(state[key]); }
  var lastSeen = null; // the stored text this tab last wrote or read; anything else in storage came from another tab
  function load() {
    var data = null;
    try { lastSeen = window.localStorage.getItem(KEY); data = JSON.parse(lastSeen || 'null'); } catch (e) { data = null; }
    if (!data && memory) data = memory;
    return normalize(data);
  }
  var state = load();
  var warned = false, saveHooks = [];
  // true while the browser refuses to store progress (blocked site data, old private mode, storage full); My progress
  // shows a lasting warning, and 'aim:save-status' tells open pages when it changes
  var failing = false;
  function saveStatus(f) { if (f === failing) return; failing = f; setTimeout(function () { window.dispatchEvent(new CustomEvent('aim:save-status', { detail: { failed: failing } })); }, 0); }
  // other parts (cloud sync) can listen for saves
  function onSave(fn) { saveHooks.push(fn); }
  function runHooks() { saveHooks.forEach(function (fn) { try { fn(state); } catch (e) {} }); }
  // copy another copy's contents into the live progress object, so open pages and labs that hold parts of it keep working
  function assignInto(dst, src) {
    Object.keys(dst).forEach(function (k) { if (!Object.prototype.hasOwnProperty.call(src, k)) delete dst[k]; });
    Object.keys(src).forEach(function (k) {
      var x = dst[k], y = src[k];
      if (x && y && typeof x === 'object' && typeof y === 'object' && !Array.isArray(x) && !Array.isArray(y)) assignInto(x, y);
      else dst[k] = y;
    });
  }
  // another tab of the site saved: merge its work into this tab (a reset or a restore there replaces this tab's copy)
  function takeOther(text, replace) {
    var other; try { other = JSON.parse(text); } catch (e) { return false; }
    assignInto(state, replace ? normalize(other) : mergeState(state, other));
    lastSeen = text;
    return true;
  }
  function save() {
    memory = state;
    try {
      var cur = window.localStorage.getItem(KEY);
      if (cur && lastSeen !== null && cur !== lastSeen) takeOther(cur, false); // never overwrite what another tab just saved
      var text = JSON.stringify(state);
      window.localStorage.setItem(KEY, text); lastSeen = text; saveStatus(false); runHooks(); return true;
    }
    catch (e) {
      saveStatus(true);
      runHooks();
      if (!warned) { warned = true; setTimeout(function () { toast('This browser is not letting AI Marg save your progress (private mode or storage full). Use My progress > Download file to keep a copy.'); }, 0); }
      return false;
    }
  }
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function logActivity() { state.log[today()] = (state.log[today()] || 0) + 1; }
  // A learner's tick, un-tick, undo or edit, stamped with its time so that it wins over older copies when progress
  // is merged (another tab, the account copy). Readers keep checking truthiness: watched[id], modules[id].done,
  // projects[id].steps[i] / .done / .links[k], notes[id]. The caller saves.
  function setWatched(id, on) {
    var t = stamp();
    if (on) { state.watched[id] = t; delete state.unwatched[id]; } else { delete state.watched[id]; state.unwatched[id] = t; }
  }
  function setModuleDone(id, done) { state.modules[id] = { done: !!done, at: stamp() }; }
  function setNote(id, text) { state.notes[id] = String(text == null ? '' : text); state.notesAt[id] = stamp(); }
  // what: 'step' (milestone key ticked or not), 'rubric' (criterion key graded), 'link' (key 'repo' or 'demo'), 'done'
  function setProject(id, what, key, value) {
    var p = state.projects[id] = isObj(state.projects[id]) ? state.projects[id] : {}, t = stamp();
    if (what === 'done') { p.done = !!value; p.doneAt = t; return p; }
    var f = { step: 'steps', rubric: 'rubric', link: 'links' }[what]; if (!f) return p;
    var fa = f + 'At';
    if (!isObj(p[f])) p[f] = {};
    if (!isObj(p[fa])) p[fa] = {};
    p[f][key] = what === 'step' ? !!value : what === 'link' ? String(value == null ? '' : value) : value;
    p[fa][key] = t;
    return p;
  }
  // a video's place: setPos keeps where it stopped; forgetPos drops it for good (the video was finished)
  function setPos(id, p) {
    p = p || {};
    state.pos[id] = { i: Math.max(0, Math.floor(p.i || 0)), n: Math.max(0, Math.floor(p.n || 0)), s: Math.max(0, Math.floor(p.s || 0)), t: Date.now() };
    delete state.posOff[id];
  }
  function forgetPos(id) { delete state.pos[id]; state.posOff[id] = Date.now(); }
  // the study plan, only when the learner changes it (the planner's defaults are shown, never saved)
  function setPlan(hpw, start) {
    state.prefs.hpw = hpw;
    if (start) state.prefs.start = start; else delete state.prefs.start;
    state.prefs.planAt = stamp();
  }
  // A streak survives until the end of today: if nothing is logged yet today, count from yesterday.
  function streak() {
    var d = new Date();
    function key(x) { return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }
    if (!state.log[key(d)]) d.setDate(d.getDate() - 1);
    var n = 0;
    while (state.log[key(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function signal(kind) { try { window.localStorage.setItem('aimarg.sync', kind + ':' + Date.now()); } catch (e) {} }
  function resetAll() { assignInto(state, normalize(blank())); lastSeen = null; save(); signal('reset'); window.dispatchEvent(new CustomEvent('aim:progress-reset')); }
  function replaceState(obj) { assignInto(state, normalize(obj)); lastSeen = null; save(); signal('replace'); }
  window.addEventListener('storage', function (e) {
    if (e.key === KEY && e.newValue && e.newValue !== lastSeen) {
      if (takeOther(e.newValue, false)) window.dispatchEvent(new CustomEvent('aim:progress-replaced', { detail: { tab: true } }));
    } else if (e.key === 'aimarg.sync' && /^(reset|replace):/.test(e.newValue || '')) {
      var cur = null; try { cur = window.localStorage.getItem(KEY); } catch (x) {}
      var reset = /^reset/.test(e.newValue);
      if (takeOther(cur || JSON.stringify(blank()), true)) {
        if (reset) window.dispatchEvent(new CustomEvent('aim:progress-reset'));
        window.dispatchEvent(new CustomEvent('aim:progress-replaced', { detail: { tab: true, cleared: reset } }));
      }
    }
  });

  // Combine progress from two copies (two devices, or this device and its own earlier upload) so that nothing is
  // lost and nothing undone comes back. Every tick, un-tick, undo and edit carries its time, and the newer action
  // wins: a video un-ticked after it was ticked stays un-ticked, an edited note replaces the older text (notes are
  // never glued together), a finished video's forgotten place stays forgotten. Copies from before version 2 have
  // no times; for those, a tick or a filled-in value is kept from either copy, as before. Quiz bests take the higher
  // score, solved exercises and lab tasks are kept from both. Device settings (theme, language, code drafts) stay as
  // they are on this device; the study plan is shared (the newer change wins). Fields this code does not know are kept.
  function mergeState(localObj, remoteObj) {
    var copy = function (o) { try { return JSON.parse(JSON.stringify(o || null)); } catch (e) { return null; } };
    var a = normalize(copy(localObj)), b = normalize(copy(remoteObj));
    var keys = function (o) { return Object.keys(o || {}); };
    var union = function () { var seen = {}, out = []; Array.prototype.forEach.call(arguments, function (o) { keys(o).forEach(function (k) { if (!own(seen, k)) { seen[k] = 1; out.push(k); } }); }); return out; };
    var earlier = function (x, y) { return !x ? y : !y ? x : (String(y) < String(x) ? y : x); };
    var later = function (x, y) { return String(y || '') > String(x || '') ? y : x; };
    // videos and courses: the newer of the latest tick and the latest un-tick wins; on the same time the tick wins
    union(b.watched, b.unwatched).forEach(function (k) {
      var on = later(a.watched[k], b.watched[k]), off = later(a.unwatched[k], b.unwatched[k]);
      if (on && !(String(off || '') > String(on))) { a.watched[k] = on; delete a.unwatched[k]; }
      else { delete a.watched[k]; a.unwatched[k] = off; }
    });
    keys(b.quiz).forEach(function (k) {
      var x = a.quiz[k], y = b.quiz[k];
      if (!x) { a.quiz[k] = y; return; }
      var newer = String(y.at) > String(x.at) ? y : x;
      a.quiz[k] = Object.assign({}, y, x, { best: Math.max(x.best, y.best), attempts: Math.max(x.attempts, y.attempts), last: newer.last, at: newer.at });
    });
    keys(b.ex).forEach(function (k) {
      var x = a.ex[k] || {}, y = b.ex[k] || {};
      if (x.done || y.done) a.ex[k] = Object.assign({}, y, x, { done: true, at: earlier(x.done && x.at, y.done && y.at) || x.at || y.at });
      else if (!a.ex[k]) a.ex[k] = y;
    });
    keys(b.code).forEach(function (k) { if (typeof a.code[k] !== 'string' || !a.code[k]) a.code[k] = b.code[k]; });
    keys(b.labs).forEach(function (k) {
      var x = a.labs[k] = own(a.labs, k) && isObj(a.labs[k]) ? a.labs[k] : {};
      keys(b.labs[k]).forEach(function (t) { if (b.labs[k][t] && !x[t]) x[t] = b.labs[k][t]; });
    });
    // lesson cards: the newer tick or un-tick wins; on a tie a tick wins
    var bare = function (v) { return String(v || '').replace(/^-/, ''); };
    keys(b.read).forEach(function (k) {
      var x = a.read[k], y = b.read[k];
      if (!own(a.read, k) || bare(y) > bare(x) || (bare(y) === bare(x) && String(x).charAt(0) === '-')) a.read[k] = y;
    });
    // project milestones, rubric grades and links: per item the newer change wins (f = the values, fa = their times).
    // Items without a time on either side (older copies) follow keep(): a tick or a filled-in value is kept.
    var mergeItems = function (x, y, f, fa, keep) {
      var ys = isObj(y[f]) ? y[f] : {}, yt = isObj(y[fa]) ? y[fa] : {};
      union(ys, yt).forEach(function (i) {
        var xs = isObj(x[f]) ? x[f] : null, xt = isObj(x[fa]) ? x[fa] : {};
        var tx = String(xt[i] || ''), ty = String(yt[i] || '');
        if (ty > tx) {
          if (own(ys, i)) { if (!xs) xs = x[f] = {}; xs[i] = ys[i]; } else if (xs) delete xs[i];
          if (!isObj(x[fa])) x[fa] = {};
          x[fa][i] = ty;
        } else if (!ty && !tx && own(ys, i) && keep(xs ? xs[i] : undefined, ys[i])) { if (!xs) xs = x[f] = {}; xs[i] = ys[i]; }
      });
    };
    var ticked = function (xv, yv) { return !!yv && !xv; }, filled = function (xv) { return !xv; };
    keys(b.projects).forEach(function (k) {
      var y = b.projects[k], x = a.projects[k];
      if (!isObj(x)) { a.projects[k] = y; return; }
      mergeItems(x, y, 'steps', 'stepsAt', ticked);
      mergeItems(x, y, 'rubric', 'rubricAt', filled);
      mergeItems(x, y, 'links', 'linksAt', filled);
      var dx = String(x.doneAt || ''), dy = String(y.doneAt || '');
      if (dy > dx || (dy === dx && y.done && !x.done)) { x.done = !!y.done; if (dy) x.doneAt = dy; }
    });
    // module "Mark complete": the newer press wins; on the same time (or the same day, in older copies) done wins
    keys(b.modules).forEach(function (k) {
      var x = a.modules[k], y = b.modules[k];
      if (!x) { a.modules[k] = y; return; }
      var tx = String(x.at || ''), ty = String(y.at || '');
      if (ty > tx || (ty === tx && y.done && !x.done)) a.modules[k] = y;
    });
    // notes: the newer edit wins as a whole. Without times on either side (older copies), a note that contains the
    // other one wins, otherwise this device's note stays.
    union(b.notes, b.notesAt).forEach(function (k) {
      var tx = String(a.notesAt[k] || ''), ty = String(b.notesAt[k] || '');
      if (ty > tx) { if (own(b.notes, k)) a.notes[k] = b.notes[k]; else delete a.notes[k]; a.notesAt[k] = ty; return; }
      if (tx || ty) return;
      var x = a.notes[k] || '', y = b.notes[k] || '';
      if (y && y !== x && (!x || y.indexOf(x) >= 0)) a.notes[k] = y;
    });
    keys(b.log).forEach(function (d) { a.log[d] = Math.max(a.log[d] || 0, b.log[d] || 0); });
    // where each video was left: the newer place wins, and a place forgotten later (the video was finished) stays forgotten
    union(b.pos, b.posOff).forEach(function (k) {
      var pa = a.pos[k], pb = b.pos[k], p = pb && (!pa || (pb.t || 0) > (pa.t || 0)) ? pb : pa;
      var off = Math.max(a.posOff[k] || 0, b.posOff[k] || 0);
      if (off && (!p || off >= (p.t || 0))) { delete a.pos[k]; a.posOff[k] = off; }
      else if (p) { a.pos[k] = p; delete a.posOff[k]; }
    });
    // the study plan: the newer change wins; a device where the learner never set one takes it from the other copy
    var pa = String(a.prefs.planAt || ''), pb = String(b.prefs.planAt || '');
    if (pb > pa) ['hpw', 'start', 'planAt'].forEach(function (k) { if (b.prefs[k] != null) a.prefs[k] = b.prefs[k]; else delete a.prefs[k]; });
    else if (!pa) ['hpw', 'start'].forEach(function (k) { if (a.prefs[k] == null && b.prefs[k] != null) a.prefs[k] = b.prefs[k]; });
    if (!a.last && b.last) a.last = b.last;
    Object.keys(parts).forEach(function (k) { try { a[k] = parts[k].merge(a[k], b[k]); } catch (e) {} });
    // parts not listed above (for example flashcard scores, or parts of a newer version): kept from both copies, this one first
    var known = blank();
    keys(b).forEach(function (k) {
      if (own(known, k) || own(parts, k)) return;
      if (a[k] === undefined) a[k] = b[k];
      else if (isObj(a[k]) && isObj(b[k])) keys(b[k]).forEach(function (i) { if (a[k][i] === undefined) a[k][i] = b[k][i]; });
    });
    a.v = Math.max(a.v, b.v); // a copy from a newer version keeps its format number
    return normalize(a);
  }

  /* ---------------- HTML helpers ---------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function inline(s) {
    // escape first, then allow `code`, **bold**, and [text](https://link)
    var t = esc(s);
    t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.split(/(<code>[\s\S]*?<\/code>)/).map(function (seg, i) {
      return i % 2 ? seg : seg.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>');
    }).join('');
    t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    t = t.replace(/\[([^\]]+)\]\((#[A-Za-z0-9._~-]+)\)/g, '<a href="$2">$1</a>');
    return t;
  }
  function md(s) {
    // tiny, safe markdown: paragraphs, "- " bullet lists, ``` code blocks, inline code/bold/links
    if (!s) return '';
    var out = [], lines = String(s).replace(/\r/g, '').split('\n'), i = 0;
    while (i < lines.length) {
      var line = lines[i];
      if (/^```/.test(line)) {
        var buf = []; i++;
        while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
        i++; out.push('<pre><code>' + esc(buf.join('\n')) + '</code></pre>'); continue;
      }
      if (/^\s*[-*] /.test(line)) {
        var items = [];
        while (i < lines.length && /^\s*[-*] /.test(lines[i])) { items.push('<li>' + inline(lines[i].replace(/^\s*[-*] /, '')) + '</li>'); i++; }
        out.push('<ul>' + items.join('') + '</ul>'); continue;
      }
      if (/^\s*\d+[.)] /.test(line)) {
        var oitems = [];
        while (i < lines.length && /^\s*\d+[.)] /.test(lines[i])) { oitems.push('<li>' + inline(lines[i].replace(/^\s*\d+[.)] /, '')) + '</li>'); i++; }
        out.push('<ol>' + oitems.join('') + '</ol>'); continue;
      }
      if (!line.trim()) { i++; continue; }
      var para = [];
      while (i < lines.length && lines[i].trim() && !/^```/.test(lines[i]) && !/^\s*[-*] /.test(lines[i]) && !/^\s*\d+[.)] /.test(lines[i])) { para.push(lines[i]); i++; }
      out.push('<p>' + inline(para.join(' ')) + '</p>');
    }
    return out.join('');
  }
  // Short messages at the bottom of the screen. Each stays long enough to read (longer text stays longer). They stack
  // in one column and never cover each other: at most two show at once, further ones wait their turn (and make the
  // oldest one leave after a reading minimum). Screen readers hear each one from a polite live region that is always
  // on the page (inside the footer landmark); the visible boxes are hidden from them so nothing is read twice.
  var toastQ = [], toastOn = [], toastBox = null, toastLive = null;
  function toastMs(msg, least) { return least ? Math.min(6000, 1500 + msg.length * 30) : Math.min(10000, 2600 + msg.length * 50); }
  function toastParts() {
    if (!toastBox || !toastBox.isConnected) { toastBox = document.createElement('div'); toastBox.className = 'toasts'; toastBox.setAttribute('aria-hidden', 'true'); document.body.appendChild(toastBox); }
    if (!toastLive || !toastLive.isConnected) {
      toastLive = document.createElement('div');
      toastLive.className = 'visually-hidden'; toastLive.setAttribute('role', 'status'); toastLive.setAttribute('aria-live', 'polite'); toastLive.setAttribute('aria-atomic', 'false');
      (document.querySelector('.site-foot') || document.body).appendChild(toastLive);
    }
  }
  function toast(msg) {
    msg = msg == null ? '' : String(msg);
    if (!msg || !document.body || toastQ.indexOf(msg) >= 0 || toastOn.some(function (c) { return c.msg === msg; })) return; // already there
    toastQ.push(msg);
    if (toastQ.length > 3) toastQ.shift(); // a burst of messages: keep the newest few
    pumpToasts();
  }
  function pumpToasts() {
    toastParts();
    while (toastQ.length && toastOn.length < 2) {
      var msg = toastQ.shift(), t = document.createElement('div'), said = document.createElement('div');
      t.className = 'toast'; t.textContent = msg; toastBox.appendChild(t);
      said.textContent = msg; toastLive.appendChild(said);
      var c = { msg: msg, el: t, said: said, at: Date.now() };
      c.timer = setTimeout(endToast.bind(null, c), toastMs(msg));
      toastOn.push(c);
    }
    if (toastQ.length) { var o = toastOn[0]; clearTimeout(o.timer); o.timer = setTimeout(endToast.bind(null, o), Math.max(0, o.at + toastMs(o.msg, true) - Date.now())); }
  }
  function endToast(c) {
    clearTimeout(c.timer); c.el.remove(); c.said.remove();
    toastOn = toastOn.filter(function (x) { return x !== c; });
    pumpToasts();
  }
  if (document.body) toastParts(); // present before the first message, so that one is read out too
  function pct(a, b) { return b ? Math.round((a / b) * 100) : 0; }

  /* ---------------- languages ---------------- */
  var LANG_LABEL = { hindi: 'Hindi', hinglish: 'Hinglish', 'indian-english': 'Indian English', english: 'English' };
  var LANG_CHIP = { hindi: 'chip-hi', hinglish: 'chip-hi', 'indian-english': 'chip-en-in', english: 'chip-en' };
  function langChip(l) { return '<span class="chip ' + (LANG_CHIP[l] || '') + '">' + esc(LANG_LABEL[l] || l) + '</span>'; }
  // Hindi, Hinglish and Indian English teachers rank equally. Global English content is shown, but ranked last.
  function langRank(l) {
    var t = { hindi: 0, hinglish: 0, 'indian-english': 0, english: 1 };
    return t[l] != null ? t[l] : 2;
  }

  /* ---------------- YouTube helpers + player ---------------- */
  function ytIds(url) {
    var out = { videoId: '', listId: '' };
    if (!url) return out;
    var m = /[?&]list=([A-Za-z0-9_-]{10,})/.exec(url); if (m) out.listId = m[1];
    var v = /[?&]v=([A-Za-z0-9_-]{11})/.exec(url) || /youtu\.be\/([A-Za-z0-9_-]{11})/.exec(url) || /\/embed\/([A-Za-z0-9_-]{11})/.exec(url) || /\/shorts\/([A-Za-z0-9_-]{11})/.exec(url);
    if (v) out.videoId = v[1];
    return out;
  }
  function embedSrc(r) {
    var base = 'https://www.youtube-nocookie.com/embed/';
    if (r.videoId && r.listId) return base + r.videoId + '?list=' + r.listId + '&rel=0&autoplay=1';
    if (r.listId) return base + 'videoseries?list=' + r.listId + '&rel=0&autoplay=1';
    if (r.videoId) return base + r.videoId + '?rel=0&autoplay=1';
    return '';
  }
  function canEmbed(r) { return !!(r && (r.videoId || r.listId)) && !window.AIM_PREVIEW; }
  function playerHTML(r) {
    var thumb = r.videoId ? 'https://i.ytimg.com/vi/' + r.videoId + '/hqdefault.jpg' : '';
    var style = thumb ? ' style="background-image:url(\'' + thumb + '\')"' : '';
    var poster = thumb ? '' : '<span class="poster" aria-hidden="true"><span>' + esc(r.creator || '') + '</span><b>' + esc(r.title) + '</b></span>';
    return '<div class="player" data-player="' + esc(r.id) + '">' +
      '<button class="player-facade' + (thumb ? '' : ' no-thumb') + '" type="button" data-action="play" data-id="' + esc(r.id) + '"' + style + ' aria-label="Play: ' + esc(r.title) + '">' + poster +
      '<span class="play" aria-hidden="true"></span><span class="cap">' + (thumb ? esc(r.title) : '') + (r.listId ? (thumb ? ' · ' : '') + 'Playlist' : '') + '</span></button></div>';
  }
  function plainPlayer(container, r) {
    var src = embedSrc(r);
    if (!src) return;
    var f = document.createElement('iframe');
    f.src = src;
    f.title = r.title;
    f.loading = 'lazy';
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    f.allowFullscreen = true;
    container.innerHTML = '';
    container.appendChild(f);
  }

  // YouTube's player API lets the site notice when a video ends and which playlist video is playing.
  var ytWait = null, ytScript = false;
  function ensureYT(ms) {
    if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
    if (ytWait) return ytWait;
    ytWait = new Promise(function (resolve, reject) {
      var settled = false;
      var prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (typeof prev === 'function') { try { prev(); } catch (e) {} }
        if (!settled) { settled = true; resolve(window.YT); }
      };
      if (!ytScript) {
        ytScript = true;
        var sc = document.createElement('script');
        sc.src = 'https://www.youtube.com/iframe_api';
        sc.async = true;
        sc.onerror = function () { ytScript = false; if (!settled) { settled = true; ytWait = null; reject(new Error('blocked')); } };
        document.head.appendChild(sc);
      }
      setTimeout(function () { if (!settled) { settled = true; ytWait = null; reject(new Error('timeout')); } }, ms || 6000);
    });
    return ytWait;
  }

  // hooks: getPos() -> {i, s} or null; onPos({i, n, s}); onComplete(). Returns { destroy }.
  var nowPlaying = null; // one video at a time: starting another pauses this one
  function play(container, r, hooks) {
    hooks = hooks || {};
    var alive = true, player = null, timer = null, completed = false, played = false;
    // after completion the stop point is meaningless (the app forgets it), so stop reporting
    var report = function () {
      if (!player || typeof player.getCurrentTime !== 'function') return null;
      var p = { i: 0, n: 0, s: 0, d: 0 };
      try {
        p.s = player.getCurrentTime() || 0;
        p.d = player.getDuration() || 0;
        if (r.listId) { p.i = player.getPlaylistIndex() || 0; var pl = player.getPlaylist(); p.n = pl && pl.length ? pl.length : 0; }
      } catch (e) { return null; }
      if (hooks.onPos && !completed) hooks.onPos(p);
      return p;
    };
    var checkDone = function (p, ended) {
      if (completed || !p) return;
      var nearEnd = ended || (p.d > 0 && p.s / p.d >= 0.9);
      // the embedded player may only list a playlist's first 200 videos, so a 200+ list is never auto-completed
      var lastItem = !r.listId || (p.n > 0 && p.n < 200 && p.i >= p.n - 1);
      if (nearEnd && lastItem) { completed = true; if (hooks.onComplete) hooks.onComplete(); }
    };
    var stopTimer = function () { if (timer) { clearInterval(timer); timer = null; } };
    // a player that never started has nothing to report (a cued player says 0:00 and would wipe the saved place)
    var onHide = function () { if (alive && played && (document.visibilityState === 'hidden' || !document.visibilityState)) report(); };
    var destroy = function () {
      if (!alive) return;
      alive = false; stopTimer();
      document.removeEventListener('visibilitychange', onHide); window.removeEventListener('pagehide', onHide);
      if (nowPlaying === player) nowPlaying = null;
      if (player) { if (played) checkDone(report(), false); try { player.destroy(); } catch (e) {} player = null; }
    };
    document.addEventListener('visibilitychange', onHide); window.addEventListener('pagehide', onHide);
    container.innerHTML = '<div class="player-loading" role="status">Loading the player…</div>';
    ensureYT(6000).then(function (YT) {
      if (!alive) return;
      var holder = document.createElement('div');
      container.innerHTML = '';
      container.appendChild(holder);
      var pos = (hooks.getPos && hooks.getPos()) || null;
      var vars = { autoplay: 1, rel: 0, playsinline: 1 };
      var opts = { host: 'https://www.youtube-nocookie.com', width: '100%', height: '100%', playerVars: vars, events: {} };
      if (r.videoId) opts.videoId = r.videoId;
      if (r.listId) { vars.listType = 'playlist'; vars.list = r.listId; }
      if (!r.listId && pos && pos.s > 5) vars.start = Math.floor(pos.s);
      // resuming a playlist: loadPlaylist (which plays) jumps to the saved video, so do not autoplay video 1 first
      var resume = r.listId && pos && (pos.i > 0 || pos.s > 5);
      if (resume) vars.autoplay = 0;
      opts.events.onReady = function (e) {
        try { var fr = e.target.getIframe(); fr.title = r.title; fr.setAttribute('allowfullscreen', ''); } catch (err) {}
        if (resume) {
          try { e.target.loadPlaylist({ list: r.listId, listType: 'playlist', index: pos.i || 0, startSeconds: pos.s > 5 ? Math.floor(pos.s) : 0 }); } catch (err) {}
        }
      };
      opts.events.onStateChange = function (e) {
        var S = YT.PlayerState || { ENDED: 0, PLAYING: 1, PAUSED: 2 };
        if (!alive) return;
        if (e.data === S.PLAYING) {
          played = true;
          if (nowPlaying && nowPlaying !== player) { try { nowPlaying.pauseVideo(); } catch (err) {} }
          nowPlaying = player;
          stopTimer();
          timer = setInterval(function () {
            // the card was re-rendered away (e.g. a Library filter) without a destroy: clean up
            if (!document.documentElement.contains(container)) { destroy(); return; }
            checkDone(report(), false);
          }, 10000);
          report();
        } else if (e.data === S.PAUSED) { stopTimer(); checkDone(report(), false); }
        else if (e.data === S.ENDED) { stopTimer(); checkDone(report(), true); }
      };
      try { player = new YT.Player(holder, opts); } catch (err) { plainPlayer(container, r); }
    }, function () {
      if (alive) plainPlayer(container, r);
    });
    return { destroy: destroy };
  }

  /* ---------------- quiz engine ---------------- */
  // mode 'learn': feedback after each answer. mode 'test': feedback only at the end.
  function Quiz(root, opts) {
    this.root = root; this.qs = opts.questions || []; this.mode = opts.mode || 'learn';
    this.key = opts.key; this.title = opts.title || 'Quiz'; this.onFinish = opts.onFinish; this.next = opts.next || null;
    this.onAnswer = opts.onAnswer || null; this.askSure = !!opts.confidence; this.sure = {};
    this.minutes = opts.minutes || 0;
    this.i = 0; this.answers = {}; this.picks = {}; this.timer = null; this.deadline = 0;
    this.start();
  }
  Quiz.prototype.start = function () {
    var self = this;
    this.i = 0; this.answers = {}; this.picks = {}; this.sure = {};
    if (this.timer) clearInterval(this.timer);
    if (this.mode === 'test' && this.minutes) {
      this.deadline = Date.now() + this.minutes * 60000;
      this.timer = setInterval(function () { self.tick(); }, 1000);
    }
    this.render();
  };
  Quiz.prototype.tick = function () {
    var el = this.root.querySelector('[data-timer]');
    var left = Math.max(0, this.deadline - Date.now());
    if (el) { var m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000); el.textContent = m + ':' + String(s).padStart(2, '0'); }
    if (left <= 0) { clearInterval(this.timer); this.finish(true); }
  };
  Quiz.prototype.destroy = function () { if (this.timer) clearInterval(this.timer); };
  Quiz.prototype.render = function () {
    var q = this.qs[this.i], n = this.qs.length, self = this;
    if (!q) { this.root.innerHTML = '<div class="empty">No questions yet.</div>'; return; }
    var picked = this.answers[q.id];
    var reveal = this.mode === 'learn' && picked != null;
    var tentative = this.mode === 'learn' ? this.picks[q.id] : picked;
    var opts = q.options.map(function (o, k) {
      var cls = 'q-opt';
      if (reveal && k === q.answer) cls += ' correct';
      if (reveal && k === picked && k !== q.answer) cls += ' wrong';
      return '<label class="' + cls + '"><input type="radio" name="opt-' + esc(q.id) + '" value="' + k + '"' +
        ((reveal ? picked : tentative) === k ? ' checked' : '') + (reveal ? ' disabled' : '') + '><span>' + inline(o) + '</span></label>';
    }).join('');
    var head = '<div class="row-between' + (this.mode === 'test' ? ' quiz-head' : '') + '"><div class="row"><span class="chip chip-level num">Question ' + (this.i + 1) + ' of ' + n + '</span>' +
      '<span class="chip">' + esc(q.difficulty || '') + '</span></div>' +
      (this.mode === 'test' && this.minutes ? '<span class="chip chip-hi num" aria-live="off">⏱ <span data-timer>' + this.minutes + ':00</span></span>' : '') + '</div>';
    var explain = reveal ? '<div class="q-explain"><strong>' + (picked === q.answer ? 'Correct.' : 'Not quite.') + '</strong> ' + inline(q.explain) + '</div>' : '';
    var last = this.i === n - 1;
    var checkBtn = this.mode === 'learn' && !reveal ? '<button class="btn btn-primary" data-q="check"' + (tentative == null ? ' disabled' : '') + '>Check answer</button>' : '';
    // metacognition: how sure is the learner before seeing the answer (optional)
    var SURE = ['Guessing', 'Fairly sure', 'Certain'];
    var sureRow = this.askSure && this.mode === 'learn' ? (reveal ? (this.sure[q.id] ? '<div class="small muted">You said: ' + SURE[this.sure[q.id] - 1] + '.</div>' : '') :
      '<fieldset class="q-sure"><legend class="small muted">How sure are you? (optional)</legend><div class="seg" role="radiogroup">' + SURE.map(function (t, k) {
        return '<label><input type="radio" name="sure-' + esc(q.id) + '" value="' + (k + 1) + '"' + (self.sure[q.id] === k + 1 ? ' checked' : '') + '><span>' + t + '</span></label>'; }).join('') + '</div></fieldset>') : '';
    var nav = '<div class="row-between"><button class="btn btn-ghost" data-q="prev"' + (this.i === 0 ? ' disabled' : '') + '>← Previous</button>' +
      '<div class="row">' + checkBtn + (this.mode === 'test' ? '<span class="small muted num">' + Object.keys(this.answers).length + '/' + n + ' answered</span>' : '') +
      (last ? '<button class="btn btn-primary" data-q="finish">' + (this.mode === 'test' ? 'Submit test' : 'See my score') + '</button>'
            : '<button class="btn btn-primary" data-q="next">Next →</button>') + '</div></div>';
    this.root.innerHTML = '<div class="quiz">' + head + '<div class="q"><div class="q-text">' + inline(q.q) +
      (q.code ? '<pre><code>' + esc(q.code) + '</code></pre>' : '') + '</div><div class="q-opts">' + opts + '</div>' + sureRow + explain + '</div>' +
      '<div class="bar" aria-hidden="true"><span style="width:' + pct(this.i + 1, n) + '%"></span></div>' + nav + '</div>';
    this.root.querySelectorAll('input[name^="sure-"]').forEach(function (inp) { inp.addEventListener('change', function () { self.sure[q.id] = Number(inp.value); }); });
    this.root.querySelectorAll('input[name^="opt-"]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        if (self.mode === 'learn') { self.picks[q.id] = Number(inp.value); var cb = self.root.querySelector('[data-q=check]'); if (cb) cb.disabled = false; }
        else { self.answers[q.id] = Number(inp.value); self.renderNavOnly(); }
      });
    });
    this.root.querySelectorAll('[data-q]').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.getAttribute('data-q');
        if (a === 'prev' || a === 'next') {
          self.i = a === 'prev' ? Math.max(0, self.i - 1) : Math.min(n - 1, self.i + 1); self.render(); self.reveal();
          var qt = self.root.querySelector('.q-text'); if (qt) { qt.tabIndex = -1; try { qt.focus({ preventScroll: true }); } catch (e) { qt.focus(); } }
        }
        if (a === 'finish') self.finish(false);
        if (a === 'check' && self.picks[q.id] != null) {
          self.answers[q.id] = self.picks[q.id];
          if (self.onAnswer) { try { self.onAnswer({ q: q, picked: self.answers[q.id], correct: self.answers[q.id] === q.answer, sure: self.sure[q.id] || 0, mode: self.mode, key: self.key }); } catch (e) {} }
          self.render();
          var ex = self.root.querySelector('.q-explain'); if (ex) { ex.tabIndex = -1; ex.focus(); }
        }
      });
    });
    if (this.timer) this.tick();
  };
  Quiz.prototype.renderNavOnly = function () {
    var el = this.root.querySelector('.small.muted.num');
    if (el) el.textContent = Object.keys(this.answers).length + '/' + this.qs.length + ' answered';
  };
  Quiz.prototype.finish = function (timeUp) {
    if (this.timer) clearInterval(this.timer);
    var self = this, correct = 0;
    this.qs.forEach(function (q) { if (self.answers[q.id] === q.answer) correct++; });
    var score = pct(correct, this.qs.length);
    var passed = score >= 70;
    if (this.onAnswer && this.mode === 'test') this.qs.forEach(function (q) { if (self.answers[q.id] != null) { try { self.onAnswer({ q: q, picked: self.answers[q.id], correct: self.answers[q.id] === q.answer, sure: 0, mode: 'test', key: self.key }); } catch (e) {} } });
    if (this.onFinish) this.onFinish({ score: score, correct: correct, total: this.qs.length });
    var review = this.qs.map(function (q, idx) {
      var a = self.answers[q.id], ok = a === q.answer;
      var firstCode = q.code ? ' <code>' + esc(String(q.code).split('\n')[0].slice(0, 60)) + '</code>' : '';
      return '<details class="fold"' + (ok ? '' : ' open') + '><summary>' + (ok ? '✓ ' : '✗ ') + 'Q' + (idx + 1) + '. ' + inline(q.q) + firstCode + '</summary><div class="stack-sm">' +
        (q.code ? '<pre><code>' + esc(q.code) + '</code></pre>' : '') +
        '<div class="small">Your answer: <strong>' + (a == null ? 'not answered' : inline(q.options[a])) + '</strong></div>' +
        (ok ? '' : '<div class="small">Correct answer: <strong>' + inline(q.options[q.answer]) + '</strong></div>') +
        '<div class="q-explain">' + inline(q.explain) + '</div></div></details>';
    }).join('');
    this.root.innerHTML = '<div class="stack"><div class="card score-box"><div class="score-big">' + score + '%</div><div class="stack-sm">' +
      '<strong>' + (timeUp ? 'Time is up. ' : '') + correct + ' of ' + this.qs.length + ' correct. ' + (passed ? 'Passed. Well done!' : 'Pass mark is 70%. Review the explanations below and try again.') + '</strong>' +
      '<div class="row">' + (passed && this.next ? '<a class="btn btn-primary" href="' + esc(this.next.href) + '">' + esc(this.next.label) + ' →</a><button class="btn" data-q="retry">Try again</button>' : '<button class="btn btn-primary" data-q="retry">Try again</button>') + '</div></div></div>' +
      '<h3>Review your answers</h3><div class="stack-sm">' + review + '</div></div>';
    this.root.querySelector('[data-q="retry"]').addEventListener('click', function () { self.start(); self.reveal(); });
    this.reveal();
  };
  Quiz.prototype.reveal = function () {
    var r = this.root.getBoundingClientRect();
    if (r.top < 70 || r.top > window.innerHeight * 0.6) this.root.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  window.AIM_CORE = {
    get state() { return state; }, get saveFailed() { return failing; }, save: save, onSave: onSave, mergeState: mergeState, resetAll: resetAll, replaceState: replaceState, logActivity: logActivity, streak: streak, today: today, registerPart: registerPart,
    VERSION: VERSION, stamp: stamp, setWatched: setWatched, setModuleDone: setModuleDone, setNote: setNote, setProject: setProject, setPos: setPos, forgetPos: forgetPos, setPlan: setPlan,
    esc: esc, inline: inline, md: md, toast: toast, pct: pct,
    LANG_LABEL: LANG_LABEL, langChip: langChip, langRank: langRank,
    ytIds: ytIds, embedSrc: embedSrc, canEmbed: canEmbed, playerHTML: playerHTML, play: play, ensureYT: ensureYT,
    Quiz: Quiz
  };
})();
