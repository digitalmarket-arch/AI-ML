/* AI Marg core helpers: storage, HTML helpers, video player, quiz engine.
   Plain script (no build step). Exposes window.AIM_CORE. */
(function () {
  'use strict';

  /* ---------------- storage (progress lives only in this browser) ---------------- */
  var KEY = 'aimarg.progress.v1';
  var memory = null;
  function blank() {
    return { v: 1, prefs: { lang: 'hi', theme: 'system' }, watched: {}, quiz: {}, ex: {}, code: {}, labs: {},
      projects: {}, modules: {}, notes: {}, last: null, log: {} };
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
  var warned = false;
  function save() {
    memory = state;
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); return true; }
    catch (e) {
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
  // Indian teachers always come first. Global English content is shown, but ranked last.
  function langRank(l, pref) {
    var hiFirst = { hindi: 0, hinglish: 0, 'indian-english': 1, english: 2 };
    var inEnFirst = { 'indian-english': 0, hinglish: 1, hindi: 1, english: 2 };
    var t = pref === 'en' ? inEnFirst : hiFirst;
    return t[l] != null ? t[l] : 3;
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
  function play(container, r) {
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
    get state() { return state; }, save: save, resetAll: resetAll, replaceState: replaceState, logActivity: logActivity, streak: streak, today: today,
    esc: esc, inline: inline, md: md, toast: toast, pct: pct,
    LANG_LABEL: LANG_LABEL, langChip: langChip, langRank: langRank,
    ytIds: ytIds, embedSrc: embedSrc, canEmbed: canEmbed, playerHTML: playerHTML, play: play,
    Quiz: Quiz
  };
})();
