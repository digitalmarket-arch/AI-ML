/* AI Marg core helpers: storage, HTML helpers, video player, quiz engine.
   Plain script (no build step). Exposes window.AIM_CORE. */
(function () {
  'use strict';

  /* ---------------- storage (progress lives only in this browser) ---------------- */
  var KEY = 'aimarg.progress.v1';
  var memory = null;
  function blank() {
    return { v: 1, prefs: { lang: 'hi', theme: 'system' }, watched: {}, quiz: {}, ex: {}, code: {}, labs: {},
      projects: {}, modules: {}, notes: {}, last: null, log: {}, pos: {} };
  }
  // Make any stored or restored object safe to use: right shapes, numbers that are numbers.
  function normalize(d) {
    var b = blank();
    if (!d || typeof d !== 'object' || Array.isArray(d)) return b;
    Object.keys(b).forEach(function (k) {
      var isObj = b[k] && typeof b[k] === 'object';
      if (isObj ? (!d[k] || typeof d[k] !== 'object' || Array.isArray(d[k])) : d[k] === undefined) d[k] = b[k];
    });
    Object.keys(d.quiz).forEach(function (k) {
      var q = d.quiz[k] || {};
      d.quiz[k] = { best: Math.max(0, Math.min(100, Math.round(Number(q.best) || 0))), attempts: Math.max(0, parseInt(q.attempts, 10) || 0), last: Math.max(0, Math.min(100, Number(q.last) || 0)), at: String(q.at || '').slice(0, 10) };
    });
    ['lang', 'theme'].forEach(function (k) { if (typeof d.prefs[k] !== 'string') d.prefs[k] = b.prefs[k]; });
    if (['hi', 'en'].indexOf(d.prefs.lang) < 0) d.prefs.lang = 'hi';
    if (['system', 'light', 'dark'].indexOf(d.prefs.theme) < 0) d.prefs.theme = 'system';
    if (d.prefs.hpw != null) d.prefs.hpw = Math.max(3, Math.min(40, parseInt(d.prefs.hpw, 10) || 10));
    if (d.prefs.start != null && !/^\d{4}-\d{2}-\d{2}$/.test(String(d.prefs.start))) delete d.prefs.start;
    ['notes', 'code'].forEach(function (k) { Object.keys(d[k]).forEach(function (x) { if (typeof d[k][x] !== 'string') delete d[k][x]; }); });
    Object.keys(d.log).forEach(function (x) { d.log[x] = parseInt(d.log[x], 10) || 0; });
    // where each video or playlist was left: i = playlist index, n = playlist length, s = seconds, t = when
    Object.keys(d.pos).forEach(function (x) {
      var p = d.pos[x];
      if (!p || typeof p !== 'object') { delete d.pos[x]; return; }
      var num = function (v) { v = Number(v); return isFinite(v) && v > 0 ? v : 0; };
      d.pos[x] = { i: Math.floor(num(p.i)), n: Math.floor(num(p.n)), s: Math.floor(num(p.s)), t: num(p.t) };
    });
    d.v = 1;
    return d;
  }
  function load() {
    var data = null;
    try { data = JSON.parse(window.localStorage.getItem(KEY) || 'null'); } catch (e) { data = null; }
    if (!data && memory) data = memory;
    return normalize(data);
  }
  var state = load();
  var warned = false, saveHooks = [];
  // other parts (cloud sync) can listen for saves
  function onSave(fn) { saveHooks.push(fn); }
  function runHooks() { saveHooks.forEach(function (fn) { try { fn(state); } catch (e) {} }); }
  function save() {
    memory = state;
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); runHooks(); return true; }
    catch (e) {
      runHooks();
      if (!warned) { warned = true; setTimeout(function () { toast('This browser is not letting AI Marg save your progress (private mode or storage full). Use My progress > Download file to keep a copy.'); }, 0); }
      return false;
    }
  }
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function logActivity() { state.log[today()] = (state.log[today()] || 0) + 1; }
  // A streak survives until the end of today: if nothing is logged yet today, count from yesterday.
  function streak() {
    var d = new Date();
    function key(x) { return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }
    if (!state.log[key(d)]) d.setDate(d.getDate() - 1);
    var n = 0;
    while (state.log[key(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function resetAll() { state = blank(); save(); }
  function replaceState(obj) { state = normalize(obj); save(); }

  // Combine progress from two devices without losing anything: ticks and solved work are kept from both,
  // quiz bests take the higher score, playback positions take the newer one, differing notes are both kept.
  // Device settings (theme, language) and code drafts stay as they are on this device.
  function mergeState(localObj, remoteObj) {
    var copy = function (o) { try { return JSON.parse(JSON.stringify(o || null)); } catch (e) { return null; } };
    var a = normalize(copy(localObj)), b = normalize(copy(remoteObj));
    var keys = function (o) { return Object.keys(o || {}); };
    var isObj = function (o) { return !!o && typeof o === 'object' && !Array.isArray(o); };
    var earlier = function (x, y) { return !x ? y : !y ? x : (String(y) < String(x) ? y : x); };
    // entries that must be objects: skip junk from a damaged copy instead of letting it break pages
    ['ex', 'labs', 'projects', 'modules'].forEach(function (k) { keys(b[k]).forEach(function (i) { if (!isObj(b[k][i])) delete b[k][i]; }); });
    keys(b.watched).forEach(function (k) { a.watched[k] = earlier(a.watched[k], b.watched[k]); });
    keys(b.quiz).forEach(function (k) {
      var x = a.quiz[k], y = b.quiz[k];
      if (!x) { a.quiz[k] = y; return; }
      var newer = String(y.at) > String(x.at) ? y : x;
      a.quiz[k] = { best: Math.max(x.best, y.best), attempts: Math.max(x.attempts, y.attempts), last: newer.last, at: newer.at };
    });
    keys(b.ex).forEach(function (k) {
      var x = a.ex[k] || {}, y = b.ex[k] || {};
      if (x.done || y.done) a.ex[k] = { done: true, at: earlier(x.done && x.at, y.done && y.at) || x.at || y.at };
      else if (!a.ex[k]) a.ex[k] = y;
    });
    keys(b.code).forEach(function (k) { if (typeof a.code[k] !== 'string' || !a.code[k]) a.code[k] = b.code[k]; });
    keys(b.labs).forEach(function (k) {
      var x = a.labs[k] = a.labs[k] && typeof a.labs[k] === 'object' ? a.labs[k] : {};
      keys(b.labs[k]).forEach(function (t) { if (b.labs[k][t] && !x[t]) x[t] = b.labs[k][t]; });
    });
    keys(b.projects).forEach(function (k) {
      var y = b.projects[k], x = a.projects[k];
      if (!isObj(x)) { a.projects[k] = y; return; }
      x.steps = x.steps || {}; x.rubric = x.rubric || {}; x.links = x.links || {};
      keys(y.steps).forEach(function (i) { if (y.steps[i]) x.steps[i] = true; });
      keys(y.rubric).forEach(function (i) { if (!x.rubric[i]) x.rubric[i] = y.rubric[i]; });
      keys(y.links).forEach(function (i) { if (!x.links[i]) x.links[i] = y.links[i]; });
      if (y.done) x.done = true;
    });
    keys(b.modules).forEach(function (k) {
      var x = a.modules[k], y = b.modules[k] || {};
      if (!x) { a.modules[k] = y; return; }
      if (y.done && !x.done) a.modules[k] = y;
    });
    keys(b.notes).forEach(function (k) {
      var x = a.notes[k] || '', y = b.notes[k] || '';
      if (!y || x === y || x.indexOf(y) >= 0) return;
      if (!x || y.indexOf(x) >= 0) { a.notes[k] = y; return; }
      a.notes[k] = x + '\n\n--- From your other device ---\n' + y;
    });
    keys(b.log).forEach(function (d) { a.log[d] = Math.max(a.log[d] || 0, b.log[d] || 0); });
    keys(b.pos).forEach(function (k) { if (!a.pos[k] || (b.pos[k].t || 0) > (a.pos[k].t || 0)) a.pos[k] = b.pos[k]; });
    ['hpw', 'start'].forEach(function (k) { if (a.prefs[k] == null && b.prefs[k] != null) a.prefs[k] = b.prefs[k]; });
    if (!a.last && b.last) a.last = b.last;
    // parts not listed above (for example flashcard scores): keep them from both devices, this device first
    var known = blank();
    keys(b).forEach(function (k) {
      if (Object.prototype.hasOwnProperty.call(known, k)) return;
      if (a[k] === undefined) a[k] = b[k];
      else if (isObj(a[k]) && isObj(b[k])) keys(b[k]).forEach(function (i) { if (a[k][i] === undefined) a[k][i] = b[k][i]; });
    });
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
  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }
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
    this.minutes = opts.minutes || 0;
    this.i = 0; this.answers = {}; this.picks = {}; this.timer = null; this.deadline = 0;
    this.start();
  }
  Quiz.prototype.start = function () {
    var self = this;
    this.i = 0; this.answers = {}; this.picks = {};
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
    var nav = '<div class="row-between"><button class="btn btn-ghost" data-q="prev"' + (this.i === 0 ? ' disabled' : '') + '>← Previous</button>' +
      '<div class="row">' + checkBtn + (this.mode === 'test' ? '<span class="small muted num">' + Object.keys(this.answers).length + '/' + n + ' answered</span>' : '') +
      (last ? '<button class="btn btn-primary" data-q="finish">' + (this.mode === 'test' ? 'Submit test' : 'See my score') + '</button>'
            : '<button class="btn btn-primary" data-q="next">Next →</button>') + '</div></div>';
    this.root.innerHTML = '<div class="quiz">' + head + '<div class="q"><div class="q-text">' + inline(q.q) +
      (q.code ? '<pre><code>' + esc(q.code) + '</code></pre>' : '') + '</div><div class="q-opts">' + opts + '</div>' + explain + '</div>' +
      '<div class="bar" aria-hidden="true"><span style="width:' + pct(this.i + 1, n) + '%"></span></div>' + nav + '</div>';
    this.root.querySelectorAll('input[type=radio]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        if (self.mode === 'learn') { self.picks[q.id] = Number(inp.value); var cb = self.root.querySelector('[data-q=check]'); if (cb) cb.disabled = false; }
        else { self.answers[q.id] = Number(inp.value); self.renderNavOnly(); }
      });
    });
    this.root.querySelectorAll('[data-q]').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.getAttribute('data-q');
        if (a === 'prev') { self.i = Math.max(0, self.i - 1); self.render(); self.reveal(); }
        if (a === 'next') { self.i = Math.min(n - 1, self.i + 1); self.render(); self.reveal(); }
        if (a === 'finish') self.finish(false);
        if (a === 'check' && self.picks[q.id] != null) {
          self.answers[q.id] = self.picks[q.id]; self.render();
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
    get state() { return state; }, save: save, onSave: onSave, mergeState: mergeState, resetAll: resetAll, replaceState: replaceState, logActivity: logActivity, streak: streak, today: today,
    esc: esc, inline: inline, md: md, toast: toast, pct: pct,
    LANG_LABEL: LANG_LABEL, langChip: langChip, langRank: langRank,
    ytIds: ytIds, embedSrc: embedSrc, canEmbed: canEmbed, playerHTML: playerHTML, play: play, ensureYT: ensureYT,
    Quiz: Quiz
  };
})();
