/* AI Marg Watch mode: the whole course as one long video path. Every video the module notes recommend, Level 1
   (beginner) to Level 4 (advanced), plays one after another in one player: the learner presses play once, and when a
   video ends the next one starts by itself. Nothing else to do: no reading, quizzes or labs.

   It saves into the same progress as Learn and Play:
   - state.watch (registered in study.js, so every page merges it): v / u = videos marked watched / un-marked (the later
     wins), cur = where the learner is (the video, its second, when, and the parts of it really played; x: a course on
     another site), p = the same for the other videos the learner played (moved away from, finished or un-marked; the
     newest PLACES), so coming back to one starts where it stopped and its parts played still add up. A page writes
     the place only when the learner chooses a video or plays one there, so a page left open never writes an old place
     over a newer one from another tab or device; a page where nothing has played yet moves on to that newer place;
   - a video counts as watched when it is marked here, or when Learn has ticked its step's resource for that module
     (unless it was un-marked here after that tick). It is marked by itself with the same honesty rule as Learn's
     player (core.js play): only the parts really played count, and most of the video (MOST) must have been played;
   - when every video of a step counts as watched, the step's resource is ticked in Learn for that module, the same
     tick as the module page's "I finished this" (AIM_APP.tickRes), unless it is a course on its own site that plays
     here only through its YouTube intro (app.js r.intro): the learner ticks that one in Learn. Watch mode never
     un-ticks Learn by itself; a course on another site is ticked and un-ticked by the learner's own "I finished this".
   This device only (localStorage 'aimarg.watch', never synced): auto (Autoplay, on unless false), rate (the playback
   speed last chosen in the player), seen (the welcome was shown), yt (videos whose owner lets them play on YouTube
   only: YouTube's errors 101 and 150; a removed or private video, error 100, is not one of them).
   A pointer click inside the page within 400 ms of a redraw of the controls is dropped (the second tap of a double
   tap, as in Play mode), and so is the second click of a slower double click (up to 0.6 s after its first click)
   when the controls moved; neither moves keyboard focus. The keyboard is never blocked. See the click guard below.

   The path comes from data/watch.js (format: README.md > "Watch mode"). This file loads it, and assets/css/watch.css,
   the first time a #watch page opens. ES5, no build step: study.js loads this file on #watch and #watch-<module>. */
(function () {
  'use strict';
  if (typeof document === 'undefined') return;
  var C = window.AIM_CORE, A = window.AIM_APP, ST = window.AIM_STUDY;
  if (!C || !A || !ST || typeof ST.addRoute !== 'function' || typeof A.tickRes !== 'function') return;
  var esc = C.esc;
  var VID = /^[A-Za-z0-9_-]{11}$/, ROUTE = /^watch(?:-(.*))?$/;
  var MOST = 0.8;          // the share of a video that must really be played (Learn's player uses the same)
  var SAMPLE_MS = 2000;    // how often the time played is added up while a video plays
  var SAVE_MS = 10000;     // how often the place is saved while a video plays, as Learn's player does (and on pause, end,
                           // hide and leave): each save redraws Home or My progress in another open tab
  var NEXT_S = 5, SKIP_S = 8; // the countdowns: to the next video, and past a video that cannot play here
  var GUESS = 600;         // the length guessed for a video when no length at all is known (10 minutes)
  var PLACES = 200;        // how many kept places there are (state.watch.p; study.js keeps as many): the newest 200, of
                           // videos moved away from, ended or un-marked (a finished video takes one too, so the cap is
                           // large: a video left part-way keeps its place through a few sessions of short videos)
  var CANT = { 2: 1, 5: 1, 100: 1, 101: 1, 150: 1 }; // YouTube's errors for a video that cannot play here
  var LS = 'aimarg.watch';
  var S = function () { return C.state; };
  function $(id) { return document.getElementById(id); }
  function hash() { var h = (location.hash || '').replace(/^#/, ''); try { return decodeURIComponent(h); } catch (e) { return h; } }
  var n0 = function (n) { return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
  var plural = function (n, one, many) { return n0(n) + ' ' + (n === 1 ? one : many || one + 's'); };
  var later = function (a, b) { a = String(a || ''); b = String(b || ''); return b > a ? b : a; };
  function reduced() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  // the double-tap guard (as Play mode's, game.js): drawnAt is when the controls last moved (a card or a status line
  // came or went, another item was drawn), by msNow(), a clock that never jumps (the system clock can be moved back)
  var drawnAt = -Infinity;
  function msNow() { return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now(); }

  /* ---------- the synced part (state.watch) and this device's settings ---------- */
  function W() {
    var st = S(), w = st.watch;
    if (!w || typeof w !== 'object' || Array.isArray(w)) w = st.watch = { v: {}, u: {}, cur: null, p: {} };
    if (!w.v || typeof w.v !== 'object') w.v = {};
    if (!w.u || typeof w.u !== 'object') w.u = {};
    if (!w.p || typeof w.p !== 'object' || Array.isArray(w.p)) w.p = {};
    return w;
  }
  // storage can throw (site data blocked) or refuse writes: the settings then last for this page only (memo)
  var memo = null;
  function dev() {
    var o = null;
    try { o = JSON.parse(window.localStorage.getItem(LS) || 'null'); } catch (e) { o = null; }
    if (!o || typeof o !== 'object' || Array.isArray(o)) o = memo ? JSON.parse(JSON.stringify(memo)) : {};
    if (!o.yt || typeof o.yt !== 'object' || Array.isArray(o.yt)) o.yt = {};
    return o;
  }
  function devSet(fn) { var o = dev(); fn(o); memo = o; try { window.localStorage.setItem(LS, JSON.stringify(o)); } catch (e) {} }
  function autoOn() { return dev().auto !== false; }
  function ytOnly(id, yo) { return !!(yo || dev().yt)[id]; } // yo: dev().yt read once for a whole list
  function setYtOnly(id, on) {
    if (ytOnly(id) === !!on) return;
    devSet(function (o) {
      if (on) { o.yt[id] = 1; var ks = Object.keys(o.yt); if (ks.length > 500) delete o.yt[ks[0]]; } else delete o.yt[id];
    });
  }

  /* ---------- loading the path and the styles ---------- */
  function data() { var w = window.AIM && window.AIM.watch; return w && typeof w === 'object' && Array.isArray(w.mods) ? w : null; }
  var dataWait = null;
  function loadData() {
    if (data()) return Promise.resolve(data());
    if (dataWait) return dataWait;
    dataWait = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'data/watch.js'; s.async = true;
      s.onload = function () { if (data()) resolve(data()); else { dataWait = null; reject(new Error('The video list is empty.')); } };
      s.onerror = function () { dataWait = null; if (s.parentNode) s.parentNode.removeChild(s); reject(new Error('The video list did not load. Check your connection and try again.')); };
      document.head.appendChild(s);
    });
    return dataWait;
  }
  var cssReady = false, cssWait = [];
  (function () {
    var href = 'assets/css/watch.css', link = document.querySelector('link[href="' + href + '"]');
    var done = function () { if (!cssReady) { cssReady = true; cssWait.forEach(function (f) { f(); }); cssWait = []; } };
    if (!link) { link = document.createElement('link'); link.rel = 'stylesheet'; link.href = href; document.head.appendChild(link); } else if (link.sheet) done();
    link.addEventListener('load', done); link.addEventListener('error', done);
    setTimeout(done, 1500); // at most 1.5 s: without it the page still works with the site's own styles
  })();

  /* ---------- the path ---------- */
  // P.items: everything the path plays, in order: a video { id, title, secs, step, mo, k (its number in the module) }
  // or a course on another site { x: true, step, mo }; each has n, its place in the path. P.mods: { m, i, steps,
  // items, videos }. A step: { r (resource), k, mid, mo, ids (the videos it plays), also (its videos that play
  // earlier) }. P.vids[id] = { it, steps (every step the video belongs to) }. P.xs['<module>|<resource>'] = a course on
  // another site. P.avg: the average known length. (The maps have no prototype: an id such as "constructor" is safe.)
  var P = null;
  function build(d) {
    var mods = [], items = [], vids = Object.create(null), xs = Object.create(null), pend = [], known = 0, nKnown = 0, seenMod = {};
    var add = function (it) { it.n = items.length; items.push(it); it.mo.items.push(it); };
    d.mods.forEach(function (dm) {
      var m = dm && A.modById[dm.id];
      if (!m || seenMod[m.id]) return;
      seenMod[m.id] = 1;
      var mo = { m: m, i: mods.length, steps: [], items: [], videos: [] };
      (Array.isArray(dm.steps) ? dm.steps : []).forEach(function (sd) {
        var r = sd && A.resById[sd.r];
        if (!r || !/^[vplx]$/.test(String(sd.k))) return;
        var step = { r: r, k: sd.k, mid: m.id, mo: mo, ids: [], also: [] };
        mo.steps.push(step);
        if (sd.k === 'x') { var xi = { x: true, step: step, mo: mo }; add(xi); xs[m.id + '|' + r.id] = xi; return; }
        (Array.isArray(sd.vids) ? sd.vids : []).forEach(function (v) {
          var id = Array.isArray(v) ? String(v[0]) : '';
          if (!VID.test(id) || step.ids.indexOf(id) >= 0 || step.also.indexOf(id) >= 0) return;
          // a video that already plays earlier in the path plays once only: it counts for this step too
          if (vids[id]) { step.also.push(id); vids[id].steps.push(step); return; }
          var secs = Math.max(0, Math.floor(Number(v[2]) || 0));
          var it = { id: id, title: String(v[1] || '').replace(/\s+/g, ' ').trim() || r.title, secs: secs, step: step, mo: mo, k: mo.videos.length };
          add(it); mo.videos.push(it); step.ids.push(id);
          vids[id] = { it: it, steps: [step] };
          if (secs) { known += secs; nKnown++; }
        });
        (Array.isArray(sd.also) ? sd.also : []).forEach(function (id) {
          id = String(id);
          if (VID.test(id) && step.ids.indexOf(id) < 0 && step.also.indexOf(id) < 0) { step.also.push(id); pend.push([id, step]); }
        });
      });
      mods.push(mo);
    });
    // "also" videos: they count for their step too; one that plays nowhere in the path is left out
    pend.forEach(function (x) {
      var vi = vids[x[0]];
      if (vi) { if (vi.steps.indexOf(x[1]) < 0) vi.steps.push(x[1]); } else x[1].also.splice(x[1].also.indexOf(x[0]), 1);
    });
    mods.forEach(function (mo) { mo.steps = mo.steps.filter(function (st) { return st.k === 'x' || st.ids.length || st.also.length; }); });
    return { mods: mods, items: items, vids: vids, xs: xs, avg: nKnown ? known / nKnown : GUESS };
  }
  function itOf(id) { var v = P && P.vids[id]; return v ? v.it : null; }
  function modOf(mid) { for (var i = 0; P && i < P.mods.length; i++) if (P.mods[i].m.id === mid) return P.mods[i]; return null; }

  /* ---------- what counts as watched ---------- */
  // when Learn ticked a step's resource for its module ('' when it is not ticked): a playlist shared by several modules
  // is ticked per module (app.js tickKey), and a tick of the whole playlist (in the Library) counts for every module
  function learnAt(step) {
    var w = S().watched, r = step.r, t = String(w[r.id] || '');
    return A.isShared(r) ? later(t, w[step.mid + '|' + r.id]) : t;
  }
  // since when a video counts as watched ('' when it does not): marked here, or its step's resource ticked in Learn,
  // whichever is later, unless it was un-marked here after that
  function doneAt(id) {
    var w = W(), on = String(w.v[id] || ''), vi = P && P.vids[id];
    if (vi) vi.steps.forEach(function (st) { on = later(on, learnAt(st)); });
    return on && !(String(w.u[id] || '') > on) ? on : '';
  }
  function isDone(it) { return it.x ? A.isTicked(it.step.mid, it.step.r) : !!doneAt(it.id); }
  function stepDone(st) { return st.k === 'x' ? A.isTicked(st.mid, st.r) : st.ids.concat(st.also).every(function (id) { return !!doneAt(id); }); }
  // videos watched, videos in all, and the seconds left (a video of unknown length counts as the average)
  function tally(list) {
    var n = 0, of = 0, left = 0, all = 0;
    list.forEach(function (it) { if (it.x) return; var s = it.secs || P.avg; of++; all += s; if (isDone(it)) n++; else left += s; });
    return { n: n, of: of, left: left, all: all };
  }
  // the next item of the path not watched yet, after it (null at the end); the one before it
  function upNext(it) { for (var i = it.n + 1; i < P.items.length; i++) if (!isDone(P.items[i])) return P.items[i]; return null; }
  function before(it) { return it.n > 0 ? P.items[it.n - 1] : null; }

  /* ---------- words ---------- */
  function fmtLen(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), x = sec % 60;
    return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (x < 10 ? '0' : '') + x;
  }
  // a time, always "about" (some lengths are guessed): "about 870 hours", or short for lists: "about 6 h"
  function aboutTime(sec, short) {
    if (sec < 3600) { var mi = Math.max(1, Math.round(sec / 60)); return 'about ' + n0(mi) + (short ? ' min' : mi === 1 ? ' minute' : ' minutes'); }
    var h = Math.round(sec / 3600);
    return 'about ' + n0(h) + (short ? ' h' : h === 1 ? ' hour' : ' hours');
  }
  function modName(m) { return 'Module ' + A.modNo(m) + ': ' + m.title; }
  // what a step that does not play here is: a course on another site, or a whole YouTube channel (many videos, not one)
  function isChannel(r) { return !!r && r.type === 'channel' && /youtube/i.test(r.platform || ''); }
  function offSite(r, cap) { var t = isChannel(r) ? 'a YouTube channel' : 'a course on another site'; return cap ? t.charAt(0).toUpperCase() + t.slice(1) : t; }
  // how the list names one: "A course on Coursera", "A course on its own website", "A YouTube channel"
  function offName(r) { return isChannel(r) ? 'A YouTube channel' : 'A course on ' + where(r); }
  // what it costs (Learn's own line for it), and on Coursera how to join for free: the Audit option, which Coursera
  // does not always show first
  function costHTML(r, cls) {
    var c = String(r.cost || '').trim(), au = /coursera/i.test(r.platform || '') ? 'On Coursera, choose the free Audit option when you join: only the certificate costs money.' : '';
    return c || au ? '<p class="small' + (cls || '') + ' wm-cost">' + (c ? '<strong>Cost:</strong> ' + esc(stop(c)) + (au ? ' ' : '') : '') + au + '</p>' : '';
  }
  // how the path names an item in "Up next"
  function label(it) { return it.x ? it.step.r.title + ', ' + offSite(it.step.r) : it.title; }
  // a title as the end of a sentence: a full stop, unless it already ends with one (or ? or !)
  function stop(t) { t = String(t || '').replace(/\s+$/, ''); return /[.?!]$/.test(t) ? t : t + '.'; }
  function ytUrl(id) { return 'https://www.youtube.com/watch?v=' + encodeURIComponent(id); }
  // where a course on another site is: its platform without a note in brackets ("Coursera (audit)" -> "Coursera",
  // "NPTEL"), or "its own website"
  function where(r) { var p = String(r.platform || '').replace(/\s*\([^)]*\)\s*$/, '').trim(); return !p || /^website\b/i.test(p) ? 'its own website' : p; }

  /* ---------- the page ---------- */
  // V: the page on screen (on: it is drawn; it: the current item; started: the learner started playing on it).
  // PL: its player (yt: the YouTube player; ready; want: a video asked for before it was ready; plain: only YouTube's
  // plain player could load). T: the current video's tracking (c: the parts really played, last: the previous reading).
  var V = { on: false }, PL = null, T = null;

  function render(mm) {
    var h = mm && mm[0] != null ? String(mm[0]) : hash(), mid = mm && mm[1] ? String(mm[1]) : '';
    if (!P || !cssReady) {
      A.setView('<div class="wrap stack wm" id="wm-root"><h1>Watch mode</h1><p class="muted" role="status">Loading the videos…</p></div>', 'Watch mode');
      loadData().then(function (d) {
        if (!P) P = build(d);
        var go = function () { if (hash() === h) A.route(); };
        if (cssReady) go(); else cssWait.push(go);
      }, function (e) {
        if (hash() !== h) return;
        A.setView('<div class="wrap stack wm" id="wm-root"><h1>Watch mode</h1><p class="callout" role="alert">' + esc(e.message) + '</p>' +
          '<div class="row"><button type="button" class="btn btn-primary" data-wm="retry">Try again</button><a class="btn" href="#home">Home</a></div></div>', 'Watch mode');
      });
      return;
    }
    if (mid && !modOf(mid)) {
      // a module of the course that the path leaves out (check-data only warns about it): its own page links here, so
      // say so and offer the way back; any other id is an old or mistyped link
      var km = Object.prototype.hasOwnProperty.call(A.modById, mid) ? A.modById[mid] : null;
      drawnAt = msNow(); // a new page under the pointer: the second press of a double click on Watch this module is dropped
      A.setView('<div class="wrap stack wm" id="wm-root"><h1>Watch mode</h1><p>' + (km ? esc(modName(km)) + ' has no videos in Watch mode yet.' : 'This module is not in Watch mode. The link may be old or mistyped.') + '</p>' +
        '<div class="row"><a class="btn btn-primary" href="#watch">Open Watch mode</a>' + (km ? '<a class="btn" href="#m-' + esc(mid) + '">Back to the module</a>' : '') + '</div></div>', 'Watch mode');
      return;
    }
    if (!dev().seen) { welcome(mid); return; }
    page(mid, false);
  }

  // the first visit on this device: what Watch mode is, then Start watching
  function welcome(mid) {
    var t = tally(P.items), mo = mid ? modOf(mid) : null;
    A.setView('<div class="wrap wm wm-welcome" id="wm-root"><div class="card stack wm-hello">' +
      '<h1>Watch mode</h1>' +
      '<p class="lede">Every recommended video of the course, from Level 1 (beginner) to Level 4 (advanced), one after another.</p>' +
      '<ul class="wm-points">' +
        '<li>Press play once. When a video ends, the next one starts by itself.</li>' +
        '<li>Nothing else to do: no reading, quizzes or labs. Just watch.</li>' +
        '<li>What you watch here counts in Learn mode too, and the other way round.</li>' +
        '<li>Go at your own pace. Missing a day costs nothing.</li></ul>' +
      '<p class="small muted num">' + plural(t.of, 'video') + (t.of ? ' · ' + aboutTime(t.all) + ' in all' : '') + (mo ? ' · starting at ' + esc(modName(mo.m)) : '') + '</p>' +
      '<div class="row"><button type="button" class="btn btn-primary" data-wm="start" data-mod="' + esc(mid) + '">Start watching</button>' +
      '<a class="btn" href="' + (mo ? '#m-' + esc(mid) : '#home') + '">Not now</a></div></div></div>', 'Watch mode');
  }

  // where the page starts: a module's first video not watched yet (its first video if all are; a module with nothing
  // of its own to play: the path, as below); else where the learner left off (the next one, when that video or course
  // was finished); else the first thing in the path not watched yet. A video starts at its own place (placeOf).
  function startAt(mid) {
    var cur = W().cur, i, it, mo = mid ? modOf(mid) : null;
    if (mo && mo.items.length) {
      var list = mo.videos.length ? mo.videos : mo.items;
      for (i = 0; i < list.length; i++) if (!isDone(list[i])) break;
      return spot(list[i] || list[0]);
    }
    if (cur && cur.x && P.xs[cur.x]) { it = P.xs[cur.x]; return spot(isDone(it) && upNext(it) || it); }
    it = cur && itOf(cur.v);
    if (it) return isDone(it) && (cur.x || cur.s <= 5) ? spot(upNext(it) || it) : spot(it);
    for (i = 0; i < P.items.length; i++) if (!isDone(P.items[i])) return spot(P.items[i]);
    for (i = 0; i < P.items.length; i++) if (!P.items[i].x) return spot(P.items[i]);
    return P.items[0] ? spot(P.items[0]) : null;
  }
  function spot(it) { return { it: it, s: startOf(it) }; }

  function page(mid, play) {
    if (mid && !modOf(mid)) mid = '';
    var at = startAt(mid), cur = W().cur;
    // setView first: it closes the page before (its player saves its place), which still uses V, PL and T
    A.setView('<div class="wrap stack-lg wm" id="wm-root">' + pageHTML(!!at) + '</div>', 'Watch mode');
    // follow: the page shows the learner's place, so a newer place from another tab or device may replace it while
    // nothing has played here (not a module the learner chose: that stays until they choose again). mid: the address
    // is still #watch-<module>; it becomes #watch once the learner plays or chooses something here (setCur), so a reload
    // before that shows the same module, and one after it carries on from the learner's place
    V = { on: false, it: null, started: false, timer: null, cdTimer: null, cd: null, savedAt: 0,
      follow: !(mid && modOf(mid).items.length), mid: mid, seenT: cur ? cur.t : 0, wantPlay: !!play };
    PL = { yt: null, ready: false, loading: false, plain: false, vid: '', want: null };
    T = null;
    V.on = true;
    A.onLeave(leave);
    document.addEventListener('visibilitychange', onHide); window.addEventListener('pagehide', onHide);
    window.addEventListener('resize', fitNow);
    if (window.ResizeObserver && $('wm-now')) { V.ro = new ResizeObserver(fitNow); V.ro.observe($('wm-now')); }
    drawCounts();
    // a page just drawn does not move the learner's place (the place stays where it was until they play or choose);
    // Start watching does: the learner chose to start here
    if (at) show(at.it, { play: play, start: at.s, quiet: true, mine: !!play });
    // Start watching: the video starts, so it comes into view (on a phone it is below the intro), with focus on it
    if (at && play) { bringNow(); focusTitle(); }
  }

  function pageHTML(any) {
    return '<header class="stack-sm wm-head"><h1>Watch mode</h1>' +
      '<p class="lede">Every recommended video of the course, Level 1 (beginner) to Level 4 (advanced), one after another. Press play, and the next one starts by itself.</p>' +
      '<p class="small muted">Go at your own pace: missing a day costs nothing.</p></header>' +
      '<div class="card stack-sm wm-total"><div class="wm-total-top"><strong class="num" id="wm-count"></strong><span class="small muted num" id="wm-left"></span></div>' +
      '<div class="bar bar-course" id="wm-bar" role="progressbar" aria-label="Videos watched in Watch mode" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span style="width:0%"></span></div></div>' +
      (location.protocol === 'file:' ? '<div class="callout small">Opened as a file: YouTube may refuse to play videos here. Use "Open on YouTube", or publish the site on GitHub Pages (see README).</div>' : '') +
      '<div class="wm-cols">' +
      (any ? '<section class="card wm-now" id="wm-now" aria-labelledby="wm-title">' +
        '<p class="small muted wm-where" id="wm-where"></p>' +
        '<h2 class="wm-title" id="wm-title" tabindex="-1"></h2>' +
        '<p class="small muted wm-by" id="wm-by"></p>' +
        '<div class="wm-stage"><div class="player wm-player" id="wm-player"></div><div class="wm-card" id="wm-card" hidden></div></div>' +
        '<p class="small muted wm-note" id="wm-note" role="status" hidden></p>' +
        '<div class="wm-status" id="wm-status" hidden></div>' +
        '<div class="wm-ctrls" id="wm-ctrls">' +
          '<button type="button" class="btn" data-wm="prev"><span aria-hidden="true">‹ </span>Previous</button>' +
          '<button type="button" class="btn" data-wm="next">Next<span aria-hidden="true"> ›</span></button>' +
          '<button type="button" class="btn wm-mark" data-wm="mark" aria-pressed="false">Mark as watched</button>' +
          '<a class="btn" id="wm-yt" data-wm="yt" href="https://www.youtube.com/" target="_blank" rel="noopener">Open on YouTube<span aria-hidden="true"> ↗</span></a>' +
          '<label class="wm-switch"><input type="checkbox" role="switch" id="wm-auto"' + (autoOn() ? ' checked' : '') + '><span>Autoplay</span></label>' +
        '</div>' +
        '<p class="small wm-upnext" id="wm-upnext"></p>' +
        '<p class="visually-hidden" id="wm-live" aria-live="polite"></p>' +
      '</section>' : '<div class="empty">There are no videos in Watch mode yet.</div>') +
      '<section class="stack wm-course" aria-labelledby="wm-course-h"><div class="stack-sm"><h2 class="h-sub" id="wm-course-h">All the videos, level by level</h2>' +
        '<p class="small muted">Open a module to see its videos. Press Play on any of them to watch it in the player.</p></div>' + levelsHTML() + '</section>' +
      '</div>';
  }

  function levelsHTML() {
    var byLv = {}, order = [];
    P.mods.forEach(function (mo) { var lv = mo.m.level; if (!byLv[lv]) { byLv[lv] = []; order.push(lv); } byLv[lv].push(mo); });
    return order.map(function (lv) {
      var l = A.levelById[lv] || {};
      return '<section class="stack-sm wm-lv" aria-labelledby="wm-lv-' + esc(lv) + '"><div class="wm-lvhead"><h3 class="h-sub3" id="wm-lv-' + esc(lv) + '">Level ' + esc(lv) + (l.title ? ': ' + esc(l.title) : '') + '</h3>' +
        '<span class="small muted num" data-wm-lv="' + esc(lv) + '"></span></div>' +
        byLv[lv].map(function (mo) {
          return '<details class="wm-mod" data-mi="' + mo.i + '"><summary><span class="wm-mt">' + esc(modName(mo.m)) + '</span>' +
            '<span class="small muted num wm-ms" data-wm-ms="' + mo.i + '"></span></summary><div class="wm-mbody"></div></details>';
        }).join('') + '</section>';
    }).join('');
  }

  // a module's steps and videos, drawn only when it is opened (never thousands of rows at once)
  function modHTML(mo) {
    var yo = dev().yt; // this device's "plays on YouTube only" marks, read once for the whole module
    var html = mo.steps.map(function (st) {
      var r = st.r;
      if (st.k === 'x') {
        return '<div class="wm-step wm-xstep"><p class="wm-xline"><strong>' + esc(offName(r)) + ':</strong> ' + esc(r.title) + '</p>' + costHTML(r, ' muted') +
          '<div class="row"><a class="btn btn-sm" href="' + esc(r.url) + '" target="_blank" rel="noopener" aria-label="Open ' + esc(r.title) + ' (opens in a new tab)">Open<span aria-hidden="true"> ↗</span></a>' +
          finBox(st) + '</div></div>';
      }
      var a = st.also.length, own = st.ids.length, what = st.k === 'l' ? 'playlist' : st.k === 'p' ? 'lesson' : 'video';
      return '<div class="wm-step"><div class="wm-sh"><h4 class="wm-st">' + esc(r.title) + '</h4><p class="small muted wm-sby">' + esc(r.creator || '') + ' ' + C.langChip(r.language) + '</p></div>' +
        (own ? '<ol class="wm-vids">' + st.ids.map(function (id) { return rowHTML(P.vids[id].it, yo); }).join('') + '</ol>' : '') +
        (a ? '<p class="small muted wm-also">' + (own ? plural(a, 'more video') + ' of this ' + what : 'Its ' + plural(a, 'video')) + ' ' + (a === 1 ? 'plays' : 'play') + ' earlier in the path' +
          ' (' + n0(st.also.filter(function (id) { return !!doneAt(id); }).length) + ' watched).</p>' : '') + '</div>';
    }).join('');
    return html || '<p class="small muted">No videos in this module yet.</p>';
  }
  // a video's row: the tick, then its title and Play (Play goes under the title when large text leaves no room)
  function rowHTML(it, yo) {
    var done = isDone(it), now = V.it === it;
    return '<li class="wm-v' + (done ? ' is-done' : '') + (now ? ' is-now' : '') + '" data-v="' + esc(it.id) + '">' +
      '<span class="wm-tk" aria-hidden="true">' + (done ? '✓' : '') + '</span><span class="wm-vb">' +
      '<span class="wm-vt"><span class="wm-vtt">' + esc(it.title) + '</span><span class="wm-vm small muted">' +
        (it.secs ? '<span class="num">' + fmtLen(it.secs) + '</span>' : '') + '<span class="visually-hidden">' + (done ? ' Watched.' : ' Not watched yet.') + '</span>' +
        (now ? '<span class="chip chip-en-in">Now playing</span>' : '') + (ytOnly(it.id, yo) ? '<span class="chip wm-yo">plays on YouTube only</span>' : '') + '</span></span>' +
      '<button type="button" class="btn btn-sm" data-wm="play" data-v="' + esc(it.id) + '" aria-label="Play: ' + esc(it.title) + '">Play</button></span></li>';
  }
  // "I finished this" for a course on another site: Learn's own tick of it, for this module
  function finBox(st) {
    return '<label class="wm-fin"><input type="checkbox" data-wm-fin="' + esc(st.mid + '|' + st.r.id) + '"' + (A.isTicked(st.mid, st.r) ? ' checked' : '') + '>' +
      '<span>I finished this<span class="visually-hidden">: ' + esc(st.r.title) + '</span></span></label>';
  }

  // the counts at the top, beside each level and on each module's line
  function drawCounts() {
    var c = $('wm-count'); if (!c || !P) return;
    var t = tally(P.items), p = t.of ? Math.round(t.n / t.of * 100) : 0;
    if (t.n < t.of) p = Math.min(99, p); // 100% only when every video is watched
    var txt = n0(t.n) + ' of ' + n0(t.of) + ' videos watched';
    c.textContent = txt;
    $('wm-left').textContent = !t.of ? '' : t.n >= t.of ? 'All watched. Well done!' : aboutTime(t.left) + ' left';
    var b = $('wm-bar');
    b.setAttribute('aria-valuenow', String(p)); b.setAttribute('aria-valuetext', txt);
    b.firstChild.style.width = (t.n && !p ? 1 : p) + '%'; // a first video watched shows as a sliver, not an empty bar
    var lv = {};
    P.mods.forEach(function (mo) {
      var x = tally(mo.items), k = mo.m.level, el = document.querySelector('[data-wm-ms="' + mo.i + '"]');
      lv[k] = lv[k] || { n: 0, of: 0 }; lv[k].n += x.n; lv[k].of += x.of;
      if (el) el.textContent = !mo.items.length ? (mo.steps.length ? 'Its videos play earlier in the path' : 'Nothing to watch here yet') :
        !x.of ? 'Courses on other sites' : x.n >= x.of ? 'All ' + n0(x.of) + ' watched' : n0(x.n) + ' of ' + n0(x.of) + ' watched · ' + aboutTime(x.left, true) + ' left';
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-wm-lv]'), function (el) { var x = lv[el.getAttribute('data-wm-lv')]; el.textContent = x ? n0(x.n) + ' of ' + n0(x.of) + ' watched' : ''; });
  }

  // the Now playing card: where it is, its title and maker, the controls and Up next
  function drawNow() {
    var it = V.it, h = $('wm-title');
    if (!it || !h) return;
    var m = it.mo.m, r = it.step.r, done = isDone(it), up = upNext(it), after = P.items[it.n + 1] || null;
    $('wm-where').textContent = 'Level ' + m.level + ' · ' + modName(m) + ' · ' + (it.x ? offSite(r, true) : 'Video ' + (it.k + 1) + ' of ' + it.mo.videos.length + ' in this module');
    h.textContent = it.x ? r.title : it.title;
    $('wm-by').innerHTML = '<span>' + esc(r.creator || '') + '</span> ' + C.langChip(r.language) +
      (!it.x && it.step.k !== 'v' ? ' <span class="wm-from">From: ' + esc(r.title) + '</span>' : '');
    var box = $('wm-ctrls'), mk = box.querySelector('[data-wm="mark"]'), yt = $('wm-yt'), pv = box.querySelector('[data-wm="prev"]'), nx = box.querySelector('[data-wm="next"]'), ae = document.activeElement;
    mk.hidden = yt.hidden = !!it.x;
    if (it.x && (ae === mk || ae === yt)) focusTitle(); // a hidden button cannot keep keyboard focus: it goes to the title
    var on = !it.x && done;
    mk.setAttribute('aria-pressed', String(on));
    // its label changes width ("Mark as watched", "Watched ✓"): on wider screens the controls after it move, so a change
    // counts as a redraw for the click guard (the second press of a double click on it must not open YouTube)
    if (mk._on !== on) { if (mk._on != null) drawnAt = msNow(); mk._on = on; mk.classList.toggle('is-on', on); mk.innerHTML = on ? 'Watched<span aria-hidden="true"> ✓</span>' : 'Mark as watched'; }
    if (!it.x) yt.href = ytUrl(it.id);
    setDisabled(pv, !before(it));
    setDisabled(nx, !up && !after); // Next: the next thing not watched yet, or (when all after it are) simply the next one
    $('wm-upnext').innerHTML = up ? 'Up next: <strong>' + esc(label(up)) + '</strong>' : after ? 'Everything after this one is watched.' : 'Nothing after this one: it is the end of the path.';
  }
  // a button that becomes disabled while it has keyboard focus hands focus to the title, so focus is never lost
  function setDisabled(b, off) {
    if (b.disabled === off) return;
    var had = off && document.activeElement === b;
    b.disabled = off;
    if (had) focusTitle();
  }
  // wide screens: the Now playing card stays in view (sticky, watch.css) only while it fits in the window
  function fitNow() { var n = $('wm-now'); if (n) n.classList.toggle('wm-stick', n.offsetHeight <= window.innerHeight - 92); }
  function focusTitle() { var h = $('wm-title'); if (h) { try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } } }
  function bringNow() {
    var n = $('wm-now'); if (!n) return;
    var r = n.getBoundingClientRect();
    if (r.top >= 60 && r.top < window.innerHeight * 0.4) return; // already in view
    drawnAt = msNow(); // the page moves under the pointer (also when nothing is drawn again: Play on the video on show)
    try { n.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }); } catch (e) { n.scrollIntoView(true); }
  }
  var sayT = 0;
  function say(text) {
    var l = $('wm-live'); if (!l) return;
    l.textContent = ''; clearTimeout(sayT);
    sayT = setTimeout(function () { if (l.isConnected) l.textContent = text; }, 60); // a new line is read even when it repeats the last one
  }

  // after any change: the counts, the Now playing card and the open modules (focus stays on the same control)
  function refresh() {
    if (!V.on || !P || !$('wm-root')) return;
    drawCounts(); drawNow();
    var card = $('wm-card');
    if (card && !card.hidden && V.it && V.it.x) swap(card, extCard(V.it));
    Array.prototype.forEach.call(document.querySelectorAll('#wm-root details.wm-mod'), function (d) {
      var body = d.querySelector('.wm-mbody'), mo = P.mods[Number(d.getAttribute('data-mi'))];
      if (!body || !mo) return;
      if (!d.open) { body.innerHTML = ''; body._h = ''; return; } // drawn again when opened
      swap(body, modHTML(mo));
    });
  }
  // replace el's contents with html, keeping keyboard focus on the same control
  function swap(el, html) {
    if (el._h === html) return;
    var ae = document.activeElement, key = null;
    if (ae && ae !== el && el.contains(ae)) {
      key = ['data-wm', 'data-v', 'data-wm-fin'].filter(function (k) { return ae.hasAttribute(k); }).map(function (k) { return '[' + k + '="' + String(ae.getAttribute(k)).replace(/["\\]/g, '\\$&') + '"]'; }).join('');
    }
    el.innerHTML = html; el._h = html;
    if (key) { var f = el.querySelector(key); if (f) { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } } else focusTitle(); }
  }
  function openMod(d) {
    var body = d.querySelector('.wm-mbody'), mo = P && P.mods[Number(d.getAttribute('data-mi'))];
    if (body && mo && d.open && !body.firstChild) { var h = modHTML(mo); body.innerHTML = h; body._h = h; }
  }

  // what an item is, in "the next ...": a video, a course (on another site) or a YouTube channel
  function kindOf(it) { return it.x ? (isChannel(it.step.r) ? 'YouTube channel' : 'course') : 'video'; }
  // the end of the path, or everything after item it watched: what is left before it, the same words at the end of a
  // video (endStatus) and on the last course card (extCard). n: how many; line: the sentence ('' when none); btn: Play
  // the first of them (cls: its class); all: nothing at all is left to watch
  function leftOf(it, cls) {
    var left = P.items.filter(function (x) { return !isDone(x); }), early = left.filter(function (x) { return x.n < it.n; }), n = early.length;
    return { all: !left.length, n: n,
      line: n ? plural(n, 'video or course', 'videos or courses') + ' before it ' + (n === 1 ? 'is' : 'are') + ' not watched yet.' : '',
      btn: n ? '<div class="row"><button type="button" class="' + cls + '" data-wm="first">Play the first of them</button></div>' : '' };
  }
  var ALL_DONE = '<p><strong>You have watched every video in Watch mode.</strong> Well done!</p>';
  // the cards that take the player's place: a course on another site, a video that cannot play here, a preview
  function extCard(it) {
    var r = it.step.r, done = A.isTicked(it.step.mid, r), nx = upNext(it), lf = nx ? null : leftOf(it, 'btn');
    // (the course's title is the heading just above the card; it may be reached with Previous too, so no "Next").
    // "Open it" is the start of the link's name, so a learner who says "click Open it" (voice control) reaches it.
    // Nothing after it to watch (the path's last course): what is left before it, with the way back to it (the card's
    // primary button stays Open it)
    return '<div class="stack-sm wm-cardin"><p class="eyebrow">' + offSite(r, true) + '</p>' +
      '<p>' + (isChannel(r) ? 'It is a whole YouTube channel, not one video, so it does not play here.' : 'It does not play here: it is a course on ' + esc(where(r)) + '.') +
      ' Open it in a new tab, and tick <strong>I finished this</strong> when you are done.</p>' + costHTML(r) +
      '<div class="row"><a class="btn btn-primary" data-wm="open" href="' + esc(r.url) + '" target="_blank" rel="noopener" aria-label="Open it: ' + esc(r.title) + ' (opens in a new tab)">Open it<span aria-hidden="true"> ↗</span></a>' +
      finBox(it.step) +
      (nx ? '<button type="button" class="btn' + (done ? ' btn-primary' : '') + '" data-wm="skip">' + (done ? (nx.x ? 'Next: ' + offSite(nx.step.r) : 'Next video') : 'Skip for now') + '</button>' : '') + '</div>' +
      (!lf ? '' : lf.all ? ALL_DONE : lf.n ? '<p class="small">' + lf.line + '</p>' + lf.btn : '') + '</div>';
  }
  // error 100: YouTube did not find the video (removed, or private), so it may not play on YouTube either; 101 and
  // 150: its owner lets it play on YouTube only; 2 and 5: something else went wrong here
  function errCard(it, code) {
    var why = code === 100 ? 'It may have been removed, or made private. You can check on YouTube, or skip it.' :
      (code === 101 || code === 150 ? 'Its owner lets it play on YouTube only.' : 'Something went wrong with it here.') + ' You can watch it on YouTube, or skip it. When you have watched it there, press Mark as watched.';
    return '<div class="stack-sm wm-cardin wm-err"><p class="wm-card-h"><strong>This video can\'t play inside AI Marg.</strong></p>' +
      '<p class="small">' + why + '</p>' +
      '<div class="row"><a class="btn btn-primary" data-wm="open" href="' + esc(ytUrl(it.id)) + '" target="_blank" rel="noopener">Open on YouTube<span aria-hidden="true"> ↗</span></a>' +
      (upNext(it) ? '<button type="button" class="btn" data-wm="go">Skip to next</button>' : '') + '</div>' +
      '<p class="small wm-cdline" id="wm-cdline" hidden></p></div>';
  }
  function previewCard(it) {
    return '<div class="stack-sm wm-cardin"><p class="wm-card-h"><strong>Videos do not play in this preview.</strong></p>' +
      '<div class="row"><a class="btn btn-primary" data-wm="open" href="' + esc(ytUrl(it.id)) + '" target="_blank" rel="noopener">Open on YouTube<span aria-hidden="true"> ↗</span></a></div></div>';
  }
  // what the player area shows: the player, or a card in its place
  function stage(card) {
    var box = $('wm-player'), c = $('wm-card');
    if (!box || !c) return;
    if (box.hidden !== !!card || c.hidden !== !card) drawnAt = msNow(); // the player and a card swap: the controls move
    box.hidden = !!card;
    c.hidden = !card;
    if (card) swap(c, card); else { c.innerHTML = ''; c._h = ''; }
  }
  // the line under the player (the countdown, Play next, the end of the path): the controls below it move only when it
  // opens, closes or changes (the countdown's number changes inside it each second without this, and is no redraw)
  function status(html) {
    var s = $('wm-status'); if (!s) return;
    if ((s._h || '') !== html || s.hidden !== !html) drawnAt = msNow();
    s.innerHTML = html; s._h = html; s.hidden = !html;
  }

  // make it the current item. o: { play (start it), start (seconds; else where it was left), focus (move focus to its
  // title), quiet (say nothing, and leave the learner's place as it is: the page has just been drawn, or follows a newer
  // place), mine (quiet, but the learner chose it: Start watching) }
  function show(it, o) {
    o = o || {};
    if (!V.on || !it) return;
    drawnAt = msNow(); // another item: the card and the controls are drawn again (see the click guard)
    stopCount(); status('');
    // leaving a video part-way: what was really played still counts, and its place is kept (setCur keeps it in p)
    if (T && T.played) { sample(false); checkDone(); saveNow(); }
    stopTimer();
    var was = V.it, start = o.start != null ? o.start : startOf(it);
    V.it = it;
    if (!o.quiet || o.mine) setCur(it, start); // the learner's choice: from now on it is their place
    drawNow(); rowMark(was); rowMark(it);
    if (it.x) { stopVideo(); T = null; stage(extCard(it)); }
    else if (!C.canEmbed({ videoId: it.id })) { T = null; stage(previewCard(it)); }
    else { stage(''); load(it, !!o.play, start); }
    if (!o.quiet) say(it.x ? offSite(it.step.r, true) + ': ' + stop(it.step.r.title) : (o.play ? 'Now playing: ' : 'Ready to play: ') + stop(it.title));
    if (o.focus) { bringNow(); focusTitle(); }
  }
  // an open module's row for this item, drawn again (its tick, Now playing): only that row, so even a module of
  // hundreds of videos stays quick (keyboard focus stays on the same button)
  function rowMark(it) {
    if (!it || it.x) return;
    var li = document.querySelector('#wm-root li.wm-v[data-v="' + it.id + '"]');
    if (!li) return;
    var body = li.closest('.wm-mbody'), ol = document.createElement('ol'), ae = document.activeElement, key = ae && ae !== li && li.contains(ae) ? ae.getAttribute('data-wm') : null;
    ol.innerHTML = rowHTML(it);
    var nu = ol.firstChild;
    li.parentNode.replaceChild(nu, li);
    if (body) body._h = ''; // drawn in parts now: the module's next full redraw must not be skipped as unchanged
    if (key) { var f = nu.querySelector('[data-wm="' + key + '"]'); if (f) { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } } }
  }

  /* ---------- the learner's place ---------- */
  // where video id was left: the newer of the current place (cur) and its own kept place (p); null when there is none
  function placeOf(id) {
    var w = W(), c = w.cur && !w.cur.x && w.cur.v === id ? w.cur : null, k = w.p[id], x = !c ? k : !k ? c : Number(k.t) > Number(c.t) ? k : c;
    return x ? { s: Math.max(0, Math.floor(Number(x.s) || 0)), c: C.spans(x.c, 100) } : null;
  }
  function startOf(it) { var x = it && !it.x ? placeOf(it.id) : null; return x ? x.s : 0; }
  function isCur(id) { var c = W().cur; return !!c && !c.x && c.v === id; }
  // keep video id's place (its second, the parts of it really played, when) among the newest PLACES; soft: not over a
  // place kept at the same time or later
  function keepPlace(id, s, c, t, soft) {
    var w = W(), o = { s: Math.max(0, Math.floor(Number(s) || 0)), t: Math.floor(Number(t) || Date.now()) }, sp = C.spans(c, 100), old = w.p[id];
    if (old && (soft ? Number(old.t) >= o.t : Number(old.t) > o.t)) return;
    if (sp.length) o.c = sp;
    w.p[id] = o;
    var ks = Object.keys(w.p);
    if (ks.length > PLACES) { ks.sort(function (a, b) { return w.p[b].t - w.p[a].t || (a < b ? -1 : a > b ? 1 : 0); }); ks.slice(PLACES).forEach(function (k) { delete w.p[k]; }); }
  }
  // the video nearest to a course on another site (the one before it, else the one after it)
  function nearVideo(it) {
    var i;
    for (i = it.n - 1; i >= 0; i--) if (!P.items[i].x) return P.items[i];
    for (i = it.n + 1; i < P.items.length; i++) if (!P.items[i].x) return P.items[i];
    return null;
  }
  // where the learner is now (state.watch.cur): a video, its second and the parts of it really played; or a course on
  // another site (x: '<module>|<resource>', with v the video before it, for copies of the site that do not know x).
  // The place it replaces is kept with the other videos' places (p), so going back to that video starts where it was
  // left, and what was played of it still adds up. Only the learner's own choices and playing here call this.
  function setCur(it, s, c) {
    if (!it) return;
    var w = W(), old = w.cur, nu = null;
    if (it.x) {
      var key = it.step.mid + '|' + it.step.r.id, near = nearVideo(it);
      if (near && !(old && old.x === key)) nu = { v: near.id, s: 0, t: Date.now(), x: key };
    } else {
      s = Math.max(0, Math.floor(Number(s) || 0));
      if (c || !old || old.x || old.v !== it.id || old.s !== s) { // (else nothing new to write)
        var keep = c || (placeOf(it.id) || {}).c;
        nu = { v: it.id, s: s, t: Date.now() };
        if (keep && keep.length) nu.c = C.spans(keep, 100);
      }
    }
    if (nu) {
      if (old && !old.x && (nu.x || old.v !== nu.v)) keepPlace(old.v, old.s, old.c, old.t, true);
      w.cur = nu; V.seenT = nu.t;
    }
    V.follow = true; // the page now shows the learner's place
    // #watch-<module>: the learner has chosen here, so from now on the address is the path itself, and a reload carries
    // on from their place (history.state keeps the scroll key app.js stores there)
    if (V.mid) { V.mid = ''; try { history.replaceState(history.state, '', '#watch'); } catch (e) {} }
    if (nu) C.save();
  }

  /* ---------- the player ---------- */
  // T: { id, c: the parts really played (from its place: they add up over visits), last: the previous reading, d: its
  // length, s: the second, played: it has played on this page, counted, dirty: played here since the last save, ended,
  // un: its un-mark that this page knows of (a newer one from elsewhere drops c, see aim:progress-replaced), go: a newer
  // second from elsewhere to start from when it plays }
  function load(it, play, start) {
    var pl = placeOf(it.id);
    T = { id: it.id, c: pl ? pl.c : [], last: null, d: 0, s: start || 0, played: false, counted: false, dirty: false, ended: false, un: String(W().u[it.id] || '') };
    if (play) V.started = true;
    if (PL.plain) { plainLoad(it, start, play); return; }
    if (PL.yt && PL.ready) {
      PL.vid = it.id; frameTitle(it.title);
      var o = { videoId: it.id, startSeconds: start > 5 ? Math.floor(start) : 0 };
      try { if (play) PL.yt.loadVideoById(o); else PL.yt.cueVideoById(o); } catch (e) {}
      return;
    }
    PL.want = { id: it.id, play: play, start: start };
    if (!PL.yt && !PL.loading) create();
  }
  function create() {
    var box = $('wm-player'), pl = PL;
    if (!box) return;
    pl.loading = true;
    box.innerHTML = '<div class="player-loading" role="status">Loading the player…</div>';
    // slow mobile data: keep waiting for the player (up to 20 s), and say why it takes long
    var slow = setTimeout(function () { var l = box.querySelector('.player-loading'); if (l) l.textContent = 'Still loading the player (slow connection)…'; }, 5000);
    C.ensureYT(20000).then(function (YT) {
      clearTimeout(slow); pl.loading = false;
      if (!V.on || PL !== pl || !pl.want) return;
      var w = pl.want, holder = document.createElement('div');
      // a video asked for before the player was ready plays only if it is still the current one
      var vars = { autoplay: w.play && V.it && V.it.id === w.id ? 1 : 0, rel: 0, playsinline: 1 };
      if (w.start > 5) vars.start = Math.floor(w.start);
      pl.want = null; pl.vid = w.id;
      box.innerHTML = ''; box.appendChild(holder);
      try {
        pl.yt = new YT.Player(holder, { host: 'https://www.youtube-nocookie.com', width: '100%', height: '100%', videoId: w.id, playerVars: vars,
          events: {
            onReady: function (e) { onReady(pl, e); },
            onStateChange: function (e) { onState(pl, e); },
            onError: function (e) { onError(pl, e); },
            onPlaybackRateChange: function (e) { if (PL === pl && e && Number(e.data) > 0) devSet(function (o) { o.rate = Number(e.data); }); }
          } });
      } catch (err) { pl.yt = null; plain(w); }
    }, function () { clearTimeout(slow); pl.loading = false; if (V.on && PL === pl) plain(pl.want); });
  }
  function frameTitle(t) { try { var f = PL.yt.getIframe(); if (f) f.title = t || 'YouTube video player'; } catch (e) {} }
  function onReady(pl, e) {
    if (PL !== pl || !V.on) return;
    pl.ready = true;
    try { var f = (e && e.target && e.target.getIframe) ? e.target.getIframe() : pl.yt.getIframe(); f.setAttribute('allowfullscreen', ''); } catch (err) {}
    frameTitle(V.it && !V.it.x ? V.it.title : '');
    // a video chosen while the player was getting ready
    if (pl.want) { var w = pl.want, it = itOf(w.id); pl.want = null; if (it) load(it, w.play, w.start); }
  }
  // the event is about the video on show (the player may still report on the one before for a moment)
  function same(pl) {
    try { var d = pl.yt.getVideoData && pl.yt.getVideoData(); if (d && d.video_id && d.video_id !== T.id) return false; } catch (e) {}
    return true;
  }
  function onState(pl, e) {
    if (PL !== pl || !V.on || !T || !same(pl)) return;
    var s = e && e.data, Y = (window.YT && window.YT.PlayerState) || { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3 };
    if (s === Y.PLAYING) {
      T.ended = false; V.wantPlay = false;
      if (!T.played) {
        T.played = true;
        // a newer place of this video came from another tab or device while it waited here: it starts from there
        if (T.go != null) { try { pl.yt.seekTo(T.go, true); } catch (err) {} T.go = null; }
        var rate = Number(dev().rate); // the speed chosen last time: YouTube starts each new video at normal speed
        if (rate > 0 && rate !== 1) { try { pl.yt.setPlaybackRate(rate); } catch (err) {} }
      }
      V.started = true;
      if (ytOnly(T.id)) { setYtOnly(T.id, false); rowMark(itOf(T.id)); } // it plays here after all
      stopCount(); status(''); // played again after its end, or during a countdown
      startTimer(); sample(true); saveNow(!isCur(T.id)); // playing it here makes it the learner's place
    } else if (s === Y.PAUSED) { stopTimer(); if (T.played) { sample(false); checkDone(); saveNow(); } }
    else if (s === Y.ENDED) { stopTimer(); if (T.played) { sample(false); checkDone(); } T.ended = true; ended(); }
    else if (T.played) sample(s === Y.BUFFERING); // a seek, or buffering (it goes on playing after)
  }
  // add up the time really played since the last reading: a jump made by dragging or skipping is not counted, nor the
  // same part twice (the parts are kept as spans, as in Learn's player). playing: whether it plays from now on
  function sample(playing) {
    if (!PL || !PL.yt || !T || typeof PL.yt.getCurrentTime !== 'function') return;
    var p;
    try { p = { s: Number(PL.yt.getCurrentTime()) || 0, d: Number(PL.yt.getDuration()) || 0 }; } catch (e) { return; }
    var now = Date.now(), l = T.last;
    if (p.d > 0) T.d = p.d;
    if (l && l.playing) {
      if (p.s !== l.s) T.dirty = true; // it played (or the learner moved it) on this page since the last save
      var ds = p.s - l.s, dt = (now - l.at) / 1000, rate = 1;
      try { rate = Math.max(1, Number(PL.yt.getPlaybackRate()) || 1); } catch (e) {}
      // moving on further than the clock allows (at the chosen speed) is a jump, not watching
      if (ds > 0 && ds <= dt * rate * 1.5 + 2) {
        T.c = C.spans(T.c.concat([[l.s, p.s]]), 100);
        var it = itOf(T.id);
        if (it) { try { A.watchedToday(it.step.r.id, ds / rate); } catch (e) {} } // a few minutes a day count as study activity
      }
    }
    T.last = { s: p.s, at: now, playing: playing };
    T.s = p.s;
  }
  // most of it really played: it counts as watched (once; again only after an un-mark)
  function checkDone() {
    if (!T || T.counted || !(T.d > 0) || C.spanLen(T.c) < MOST * T.d) return;
    T.counted = true;
    var it = itOf(T.id);
    if (it && !doneAt(it.id)) mark(it, true, false);
  }
  // the place of the video on show, when it has played on this page since the last save (claim: it has just started
  // playing here, so it becomes the learner's place). A page that has not played since then never writes its old place
  // over a newer one from another tab or device. Not once it has ended (the place has moved on: see ended)
  function saveNow(claim) {
    if (!T || !T.played || T.ended || !(T.dirty || claim)) return;
    T.dirty = false; V.savedAt = Date.now();
    setCur(itOf(T.id), T.s, T.c);
  }
  function startTimer() {
    stopTimer();
    V.timer = setInterval(function () {
      if (!V.on || !$('wm-player')) { stopTimer(); return; }
      sample(true); checkDone();
      if (Date.now() - V.savedAt >= SAVE_MS) saveNow();
    }, SAMPLE_MS);
  }
  function stopTimer() { if (V.timer) { clearInterval(V.timer); V.timer = null; } }
  // the video stops while the learner opens it (or a course) on another site: YouTube's player pauses; YouTube's plain
  // player (no pause from here) is made again for the same video, waiting for play, so it is still there afterwards
  function pausePlayer() {
    if (PL && PL.plain) { var b = $('wm-player'); if (b && b.querySelector('iframe') && V.it && !V.it.x) plainLoad(V.it, T ? T.s : 0, false); return; }
    if (PL && PL.yt && PL.ready) { try { PL.yt.pauseVideo(); } catch (e) {} }
  }
  // a course card takes the player's place: the video stops (the plain player is emptied)
  function stopVideo() {
    if (PL && PL.plain) { var b = $('wm-player'); if (b) b.innerHTML = ''; return; }
    pausePlayer();
  }
  // the end of a video: the next one after a short countdown (Autoplay), or a Play next button
  function ended() {
    var it = V.it;
    if (!it || it.x) return;
    var nx = upNext(it);
    // its second is forgotten (played again, it starts at its start; what was played still adds up until it counts),
    // and coming back later starts at the next item, where it was left (or at this one, when the path stops here)
    keepPlace(it.id, 0, isDone(it) ? null : T && T.c, Date.now());
    setCur(nx || it, startOf(nx || it));
    refresh();
    if (!nx) { endStatus(it); return; }
    if (autoOn()) countdown(NEXT_S, nx, 'next');
    else {
      status('<p><strong>Finished.</strong> Up next: ' + esc(label(nx)) + '</p><div class="row"><button type="button" class="btn btn-primary" data-wm="go">Play next</button></div>');
      say('Finished. Press Play next to go on.');
    }
  }
  // the end of video it, with nothing after it to watch: the last of the path, or everything after it watched already.
  // Says what is left: this video (not counted yet) and the ones before it not watched yet
  function endStatus(it) {
    var lf = leftOf(it, 'btn btn-primary');
    if (lf.all) { status(ALL_DONE); return; }
    status('<p><strong>' + (it.n === P.items.length - 1 ? 'That was the last video of the path.' : 'Everything after this video is watched.') + '</strong>' +
      (!isDone(it) ? ' This video does not count as watched yet: watch most of it, or press Mark as watched.' : '') +
      (lf.line ? ' ' + lf.line : '') + '</p>' + lf.btn);
  }
  // a countdown: kind 'next' (to the next video, under the player) or 'skip' (past a video that cannot play here, on its
  // card). The number counts down every second; screen readers hear it once, when it starts
  function countdown(secs, target, kind) {
    stopCount();
    V.cd = { left: secs, target: target, kind: kind };
    if (kind === 'next') {
      status('<p><span>Up next in <span class="num" id="wm-cd">' + secs + '</span> s:</span> <strong>' + esc(label(target)) + '</strong></p>' +
        '<div class="row"><button type="button" class="btn btn-primary" data-wm="go">Play now</button><button type="button" class="btn" data-wm="cancel">Cancel</button></div>');
      say('Finished. Up next in ' + secs + ' seconds: ' + stop(label(target)) + ' Press Cancel to stay here.');
    } else {
      var line = $('wm-cdline'), what = kindOf(target);
      if (line) { line.innerHTML = '<span>Skipping to the next ' + what + ' in <span class="num" id="wm-cd">' + secs + '</span> s.</span><button type="button" class="btn btn-sm" data-wm="cancel">Cancel</button>'; line.hidden = false; drawnAt = msNow(); }
      say('This video can\'t play inside AI Marg. Skipping to the next ' + what + ' in ' + secs + ' seconds. Press Cancel to stay.');
    }
    V.cdTimer = setInterval(function () {
      if (!V.on || !V.cd) { stopCount(); return; }
      V.cd.left--;
      var n = $('wm-cd'); if (n) n.textContent = String(Math.max(0, V.cd.left));
      if (V.cd.left > 0) return;
      // the countdown's own buttons go away with it: keyboard focus on one of them moves to the new title
      var t = V.cd.target, ae = document.activeElement;
      stopCount(); show(t, { play: true });
      if (ae && ae !== document.body && !ae.isConnected) focusTitle();
    }, 1000);
  }
  // (the skip line going away moves what is under it; the countdown's own ticks change only its number)
  function stopCount() { if (V.cdTimer) { clearInterval(V.cdTimer); V.cdTimer = null; } V.cd = null; var l = $('wm-cdline'); if (l) { if (!l.hidden) drawnAt = msNow(); l.hidden = true; l.innerHTML = ''; } }
  // keep: focus stays where it is (the Autoplay switch was turned off: it stays on screen, and a second Space on it must
  // turn Autoplay on again, not press the next button); else focus moves from the Cancel button that goes away
  function cancelCount(keep) {
    var cd = V.cd; if (!cd) return;
    stopCount();
    if (cd.kind === 'next') {
      status('<p>Autoplay stopped here. Up next: <strong>' + esc(label(cd.target)) + '</strong></p><div class="row"><button type="button" class="btn btn-primary" data-wm="go">Play next</button></div>');
      var b = document.querySelector('#wm-status [data-wm="go"]'); if (b && !keep) b.focus();
    } else if (!keep) {
      var s = document.querySelector('#wm-card [data-wm="go"]'); if (s) s.focus(); else focusTitle();
    }
    say('Stopped. Nothing plays until you choose.');
  }
  // the learner opened the video on YouTube: nothing moves on by itself while they watch it there (keyboard focus stays
  // on the link they pressed), so Mark as watched is still about that video when they come back
  function holdCount() {
    var cd = V.cd; if (!cd) return;
    stopCount();
    if (cd.kind === 'next') status('<p>Autoplay stopped here. Up next: <strong>' + esc(label(cd.target)) + '</strong></p><div class="row"><button type="button" class="btn btn-primary" data-wm="go">Play next</button></div>');
    say('Autoplay stopped while you watch on YouTube.');
  }
  function onError(pl, e) {
    if (PL !== pl || !V.on || !T || V.it.x || V.it.id !== T.id) return;
    var code = Number(e && e.data);
    if (!CANT[code]) return;
    stopTimer();
    var it = V.it;
    if (code === 101 || code === 150) setYtOnly(it.id, true); // the list marks it "plays on YouTube only" (not error 100: removed or private)
    stage(errCard(it, code)); rowMark(it);
    var nx = upNext(it);
    // Autoplay skips it, once the learner has started watching on this page; otherwise they choose
    if (nx && autoOn() && V.started) countdown(SKIP_S, nx, 'skip');
    else say('This video can\'t play inside AI Marg. ' + (nx ? 'Open it on YouTube, or skip to the next ' + kindOf(nx) + '.' : 'Open it on YouTube.'));
  }
  // only YouTube's plain player could load (its player API is blocked or too slow): videos play, but nothing is tracked.
  // w: what was asked for while the player was loading (it starts only if the learner asked to play it)
  function plain(w) {
    PL.plain = true; PL.want = null;
    var n = $('wm-note'), it = V.it, mine = !!(w && it && w.id === it.id);
    if (n) { n.textContent = 'The full player could not load (slow or blocked connection), so this is YouTube\'s plain player. The next video does not start by itself, and videos do not count by themselves: press Mark as watched when you finish one, then Next.'; n.hidden = false; }
    if (it && !it.x && C.canEmbed({ videoId: it.id })) plainLoad(it, mine ? w.start : T ? T.s : 0, mine && w.play);
  }
  // play: the learner asked to play it (Start watching, Next, Play...): only then does it start by itself
  function plainLoad(it, start, play) {
    var box = $('wm-player'); if (!box) return;
    var f = document.createElement('iframe'), src = C.embedSrc({ videoId: it.id }, { s: start || 0 });
    f.src = play ? src : src.replace(/([?&])autoplay=1&?/, '$1').replace(/[?&]$/, '');
    f.title = it.title;
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    f.allowFullscreen = true;
    box.innerHTML = ''; box.appendChild(f);
  }
  // the tab is hidden or the page is closing: keep the place (and what was played)
  function onHide(e) {
    if (e && e.type === 'visibilitychange' && document.visibilityState !== 'hidden') return;
    if (!V.on || !T || !T.played) return;
    sample(!!(T.last && T.last.playing)); checkDone(); saveNow();
  }
  // leaving the page: keep the place, then close the player and the timers
  function leave() {
    if (!V.on) return;
    if (T && T.played) { sample(false); checkDone(); saveNow(); }
    V.on = false; stopTimer(); stopCount(); clearTimeout(sayT);
    document.removeEventListener('visibilitychange', onHide); window.removeEventListener('pagehide', onHide);
    window.removeEventListener('resize', fitNow);
    if (V.ro) { V.ro.disconnect(); V.ro = null; }
    if (PL && PL.yt) { try { PL.yt.destroy(); } catch (e) {} }
    PL = null; T = null;
  }

  /* ---------- marking, and Learn's ticks ---------- */
  // on: mark it watched; off: un-mark it (it then counts only if it is watched or ticked in Learn again later)
  function mark(it, on, byHand) {
    var w = W(), t = C.stamp(), done = [];
    if (on) { w.v[it.id] = t; delete w.u[it.id]; } else { delete w.v[it.id]; w.u[it.id] = t; }
    if (!on && T && T.id === it.id) { T.c = []; T.counted = false; T.un = t; } // watched again from here, it counts again
    // ...and what was played before the un-mark does not come back from the saved places (with a newer time, so an
    // older copy of them from another tab or device does not bring it back either)
    if (!on && w.cur && !w.cur.x && w.cur.v === it.id && w.cur.c) { delete w.cur.c; w.cur.t = Date.now(); V.seenT = w.cur.t; }
    // ...and a newer kept place without parts, even when this copy has none for it (it is not the place here, say on
    // #watch-<module>): an older kept place with parts on another device then loses to it when the copies merge
    if (!on) keepPlace(it.id, (placeOf(it.id) || {}).s || 0, null, Date.now());
    if (on) {
      C.logActivity();
      // every step this video belongs to that is now fully watched: its resource is ticked in Learn for its module. Not a
      // course on its own site that plays here only through its YouTube intro (app.js r.intro, such as a course's set-up
      // video): Learn never ticks a course from its intro, and the learner ticks it there when they finish the course
      var vi = P.vids[it.id];
      (vi ? vi.steps : []).forEach(function (st) { if (!st.r.intro && stepDone(st) && A.tickRes(st.mid, st.r.id, true)) done.push(st); });
    }
    C.save();
    refresh();
    if (done.length) C.toast('Finished: ' + done.map(function (st) { return st.r.title; }).join('; ') + '. Ticked in Learn mode too.');
    if (byHand) say(on ? 'Marked as watched.' : 'Marked as not watched.');
  }
  // "I finished this" on a course from another site: Learn's own tick of it for that module
  function fin(mid, rid, on) {
    var changed = A.tickRes(mid, rid, on);
    if (changed) C.save();
    refresh();
    say(on ? 'Ticked as finished. It is ticked in Learn mode too.' : 'Not ticked as finished any more.');
  }

  /* ---------- events, once ---------- */
  // a quick double click or double tap: its second press lands on whatever moved into the place of the first (Play now
  // goes, and Mark as watched or Open on YouTube moves up; Play in the list scrolls Next under the finger). A pointer
  // click inside Watch mode within 400 ms of a redraw of the controls (drawnAt) is dropped before anything sees it, as
  // in Play mode; preventDefault also stops a link opening a tab and a label toggling its switch. So is the second click
  // of a double click as the system counts it (detail 2 or more: on Windows up to 500 ms after the first) when the
  // controls moved since the last single click that went through (pressAt), up to 600 ms after the double click's own
  // first click (firstAt: the last single click anywhere on the page, whether it went through or not, so a first press
  // dropped here, or one outside Watch mode that opened it, counts too). Not longer: the system goes on counting presses
  // at one spot (detail 3, 4...) for as long as each comes soon after the one before, and a learner pressing Next again
  // and again, or with a slower double-click speed, must not find it dead. The mousedown of a dropped click is dropped
  // too, so keyboard focus does not move to the control under the pointer either (the next Space or Enter would press
  // it). The keyboard (detail 0) is never blocked. (Registered before the click handler below, in the capture phase.)
  // firstAt starts when this file runs: the press on a link that opened Watch mode came just before, while these
  // listeners did not exist yet (only the second click of a double click within 600 ms of that can be dropped by it)
  var pressAt = -Infinity, firstAt = msNow();
  function stray(ev) { var t = msNow(); return ev.detail > 0 && (t - drawnAt < 400 || (ev.detail > 1 && drawnAt >= pressAt && t - firstAt < 600)); }
  document.addEventListener('click', function (ev) {
    var root = $('wm-root');
    if (ev.detail === 1) firstAt = msNow();
    if (!root || !ev.target || !root.contains(ev.target)) return;
    if (stray(ev)) { ev.preventDefault(); ev.stopPropagation(); return; }
    if (ev.detail === 1) pressAt = msNow();
  }, true);
  document.addEventListener('mousedown', function (ev) {
    var root = $('wm-root');
    if (ev.detail === 1) firstAt = msNow();
    if (root && ev.target && root.contains(ev.target) && stray(ev)) ev.preventDefault();
  }, true);
  document.addEventListener('click', function (ev) {
    var t = ev.target && ev.target.closest && ev.target.closest('[data-wm]'), root = $('wm-root');
    if (!t || !root || !root.contains(t)) return;
    var a = t.getAttribute('data-wm'), it;
    if (a === 'retry') { A.route(); return; }
    if (a === 'start') { devSet(function (o) { o.seen = 1; }); page(t.getAttribute('data-mod') || '', true); return; }
    if (!V.on || !P) return;
    if (a === 'yt' || a === 'open') { holdCount(); pausePlayer(); return; } // the link opens YouTube or the course in a new tab
    if (a === 'play') {
      it = itOf(t.getAttribute('data-v'));
      if (!it) return;
      if (it === V.it && PL && PL.yt && PL.ready && !PL.plain && $('wm-card').hidden) { try { PL.yt.playVideo(); } catch (e) {} V.started = true; bringNow(); focusTitle(); }
      else show(it, { play: true, focus: true });
    } else if (a === 'prev') { it = V.it && before(V.it); if (it) show(it, { play: true }); }
    // Next: the next thing not watched yet; when everything after this one is watched, simply the next one
    else if (a === 'next') { it = V.it && (upNext(V.it) || P.items[V.it.n + 1]); if (it) show(it, { play: true }); }
    // (a button that goes away hands focus to the new title)
    else if (a === 'go' || a === 'skip') { it = V.it && upNext(V.it); if (it) show(it, { play: true, focus: true }); }
    else if (a === 'first') { it = P.items.filter(function (x) { return !isDone(x); })[0]; if (it) show(it, { play: true, focus: true }); }
    else if (a === 'mark') { if (V.it && !V.it.x) mark(V.it, !isDone(V.it), true); }
    else if (a === 'cancel') cancelCount();
  });
  document.addEventListener('change', function (ev) {
    var t = ev.target, root = $('wm-root');
    if (!t || !root || !root.contains(t) || !V.on) return;
    if (t.id === 'wm-auto') {
      devSet(function (o) { o.auto = !!t.checked; });
      if (!t.checked && V.cd) cancelCount(true); // switched off during a countdown: nothing starts by itself (focus stays on the switch)
      say(t.checked ? 'Autoplay on: the next video starts by itself.' : 'Autoplay off: you start each video.');
    } else if (t.hasAttribute('data-wm-fin')) {
      var k = t.getAttribute('data-wm-fin'), cut = k.indexOf('|');
      fin(k.slice(0, cut), k.slice(cut + 1), !!t.checked);
    }
  });
  // a module's videos are drawn when it is opened ('toggle' does not bubble: listen on the way down)
  document.addEventListener('toggle', function (ev) {
    var d = ev.target;
    if (V.on && d && d.classList && d.classList.contains('wm-mod') && d.open) openMod(d);
  }, true);
  // progress was reset (Reset all progress, or a sign-out that removes the progress from this device, in this tab or
  // another): what was played here before it no longer counts, and is never saved into the cleared progress (this
  // event comes before aim:progress-replaced, on which app.js draws the page again: leaving it saves nothing)
  window.addEventListener('aim:progress-reset', function () {
    stopTimer();
    if (T) { T.played = false; T.dirty = false; T.counted = false; T.c = []; T.last = null; }
  });

  // progress from another tab or device: the counts and ticks follow. The video on show: un-marked there, what was
  // played of it here before no longer counts (as with an un-mark here); parts played there add up here. The place: a
  // newer one moves this page there, unless something has played here on the item on show (the player goes on), a
  // countdown runs, or the learner chose this module here (#watch-<module>) and has not played anything yet
  window.addEventListener('aim:progress-replaced', function () {
    if (!V.on || !P) return;
    var w = W(), c = w.cur;
    if (T) {
      var un = String(w.u[T.id] || '');
      if (un > T.un || (T.counted && !doneAt(T.id))) { T.c = []; T.counted = false; T.un = un; }
      // nothing has played here yet: the parts are read again from the saved place, as load() does (a Restore from file
      // in another tab may have replaced them)
      else if (!T.played) { var pl = placeOf(T.id); T.c = pl ? pl.c : []; T.un = un; }
      else if (c && !c.x && c.v === T.id && c.c) T.c = C.spans(T.c.concat(c.c), 100);
    }
    if (c && c.t > V.seenT && V.follow && !V.cd && !(T && T.played)) {
      V.seenT = c.t;
      var to = startAt('');
      if (to && to.it !== V.it) show(to.it, { start: to.s, quiet: true, play: V.wantPlay });
      // the same video, further on (another tab is playing it): it starts there when played here (no reload of the
      // player each time that tab saves)
      else if (to && T && !to.it.x && Math.abs(to.s - T.s) > 1) T.go = to.s;
    }
    refresh();
  });

  // registered at once: study.js routes again as soon as this file has run
  ST.addRoute(ROUTE, render, 'watch');
  window.AIM_WATCH = {
    // for checks: the path, what counts, and the page's state
    path: function () { return P; }, doneAt: doneAt, stepDone: stepDone, tally: function () { return P ? tally(P.items) : null; },
    current: function () { return V.on && V.it ? (V.it.x ? { x: V.it.step.r.id, mid: V.it.step.mid } : { v: V.it.id }) : null; }
  };
})();
