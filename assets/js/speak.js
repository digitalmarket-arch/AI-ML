/* AI Marg: read aloud.
   Uses the voices built into the learner's phone or browser (the Web Speech API): free, nothing to download, and it
   works offline on most phones. An Indian English voice is preferred; Hindi words in "(देवनागरी, roman)" brackets are
   said by a Hindi voice when the device has one (otherwise their roman spelling is read).
   Any button with data-tts-root reads aloud: data-tts-root is a selector for the part to read (the button's closest
   match, else the first match on the page, or "main"); data-tts-in narrows it; data-tts-from="view" starts at what is
   on screen. Elements read with data-tts-prefix first say that text. */
(function () {
  'use strict';
  var synth = window.speechSynthesis, Utter = window.SpeechSynthesisUtterance;
  var OK = !!(synth && Utter && typeof synth.speak === 'function');
  var html = document.documentElement;
  html.classList.add(OK ? 'tts' : 'no-tts');

  var ICON = {
    spk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>',
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 5h2v14H6zM19 5v14L9 12z" fill="currentColor"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M16 5h2v14h-2zM5 5v14l10-7z" fill="currentColor"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg>'
  };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  // a Listen button for app.js / core.js to place; nothing when this browser cannot read aloud
  function btn(rootSel, label, o) {
    if (!OK) return '';
    o = o || {};
    return '<button type="button" class="btn btn-sm btn-ghost tts-btn' + (o.icon ? ' tts-icon' : '') + '" data-tts-root="' + esc(rootSel) + '"' +
      (o.within ? ' data-tts-in="' + esc(o.within) + '"' : '') + ' aria-label="' + esc(label) + '" data-tts-label="' + esc(label) + '">' + ICON.spk +
      (o.icon ? '' : '<span class="tts-lbl">' + esc(o.text || 'Listen') + '</span>') + '</button>';
  }
  if (!OK) { window.AIM_SPEAK = { supported: false, btn: btn, stop: function () {}, icon: ICON.spk }; return; }

  /* ---------- preferences: this device only (voices differ between devices) ---------- */
  var KEY = 'aimarg.tts', RATES = [0.75, 1, 1.25, 1.5];
  var prefs = { rate: 1, voice: '', hindi: 'say' };
  try {
    var sv = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
    if (RATES.indexOf(sv.rate) >= 0) prefs.rate = sv.rate;
    if (typeof sv.voice === 'string') prefs.voice = sv.voice;
    if (sv.hindi === 'skip') prefs.hindi = 'skip';
  } catch (e) {}
  function savePrefs() { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) {} }

  /* ---------- voices ---------- */
  var voices = [];
  function loadVoices() { try { voices = synth.getVoices() || []; } catch (e) { voices = []; } fillVoices(); }
  function langOf(v) { return String(v.lang || '').replace('_', '-').toLowerCase(); }
  // Indian English first, then other English; natural/online voices sound better than basic ones
  function score(v, want) {
    var L = langOf(v), s;
    if (want === 'hi') { if (L === 'hi-in') s = 100; else if (L.indexOf('hi') === 0) s = 80; else return -1; }
    else { if (L === 'en-in') s = 100; else if (/^en-(gb|us|au|ie|nz|za)$/.test(L)) s = 50; else if (L.indexOf('en') === 0) s = 40; else return -1; }
    if (/natural|neural|online|enhanced|premium/i.test(v.name || '')) s += 20;
    if (/google/i.test(v.name || '')) s += 10;
    return s;
  }
  function best(want) { var b = null, bs = -1; voices.forEach(function (v) { var s = score(v, want); if (s > bs) { bs = s; b = v; } }); return b; }
  function enVoice() {
    if (prefs.voice) for (var i = 0; i < voices.length; i++) if (voices[i].voiceURI === prefs.voice && score(voices[i], 'en') >= 0) return voices[i];
    return best('en');
  }
  function hiVoice() { return best('hi'); }

  /* ---------- text: what to say ---------- */
  var DEVRUN = /[ऀ-ॿ][ऀ-ॿ‌‍ ]*/g;
  var GLOSS = /\(([ऀ-ॿ][ऀ-ॿ‌‍ ]*), ([a-z][a-z' -]*)\)/g;
  // symbols a voice would read oddly or not at all
  function tidy(s) {
    return String(s)
      .replace(/\s*(?:→|⟶|⇒)\s*/g, ', then ').replace(/\s*←\s*/g, ', from ')
      .replace(/(\d)\s*[×x]\s*(?=\d)/g, '$1 times ').replace(/\s*×\s*/g, ' times ').replace(/\s*÷\s*/g, ' divided by ')
      .replace(/(^|[\s(])[−–](?=\d)/g, '$1minus ').replace(/\s[−]\s/g, ' minus ')
      .replace(/\s*≈\s*/g, ' about ').replace(/\s*≤\s*/g, ' at most ').replace(/\s*≥\s*/g, ' at least ').replace(/\s*≠\s*/g, ' is not ')
      .replace(/²/g, ' squared').replace(/³/g, ' cubed')
      .replace(/\be\.g\.,?\s*/gi, 'for example, ').replace(/\bi\.e\.,?\s*/gi, 'that is, ').replace(/\bvs\.?(?=\s)/gi, 'versus')
      .replace(/[✓✔]/g, ' done: ').replace(/[✗✘]/g, ' not done: ').replace(/[○●◐⏱↓↑]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }
  // English text with Hindi words: [{lang, text}], said in turn
  function parts(text) {
    var hv = hiVoice(), say = prefs.hindi !== 'skip', out = [];
    // a bracket "(देवनागरी, roman)": the Hindi voice says the Devanagari; without one, the roman spelling is read in English
    text = text.replace(GLOSS, function (all, dev, rom) { return !say ? '' : hv ? '(' + dev + ')' : '(' + rom + ')'; });
    var last = 0, m;
    DEVRUN.lastIndex = 0;
    while ((m = DEVRUN.exec(text))) {
      push(out, 'en', text.slice(last, m.index));
      if (say && hv) push(out, 'hi', m[0]);
      last = DEVRUN.lastIndex;
    }
    push(out, 'en', text.slice(last));
    return out;
  }
  function push(out, lang, s) {
    s = lang === 'en' ? tidy(s.replace(/[()]/g, ' ')) : s.trim();
    if (!/[A-Za-z0-9ऀ-ॿ₹%]/.test(s)) return;
    if (lang === 'hi') { out.push({ lang: 'hi', text: s }); return; }
    chunks(s).forEach(function (c) { out.push({ lang: 'en', text: c }); });
  }
  // short pieces: some voices stop on long text. A sentence ends at . ! ? ; : followed by a space (not inside 0.01)
  function chunks(s) {
    var out = [], MAX = 160, sens = [], start = 0;
    for (var i = 0; i < s.length; i++) {
      if ('.!?;:।'.indexOf(s.charAt(i)) >= 0 && (i + 1 === s.length || /\s/.test(s.charAt(i + 1)))) { sens.push(s.slice(start, i + 1)); start = i + 1; }
    }
    if (start < s.length) sens.push(s.slice(start));
    sens.forEach(function (sen) {
      sen = sen.trim(); if (!sen) return;
      while (sen.length > MAX) {
        var cut = sen.lastIndexOf(', ', MAX); if (cut < 40) cut = sen.lastIndexOf(' ', MAX); if (cut < 40) cut = MAX;
        out.push(sen.slice(0, cut + 1).trim()); sen = sen.slice(cut + 1).trim();
      }
      if (sen) out.push(sen);
    });
    return out;
  }

  /* ---------- what to read on the page ---------- */
  var SKIP = 'button, input, select, textarea, nav, svg, pre, script, style, noscript, iframe, canvas, video, audio, .visually-hidden, .tts-skip, ' +
    '.read-foot, .read-progress, .crumbs, .tabs, .site-head, .prog-strip, footer, .toasts, #fc-chip, .tts-bar, [aria-hidden="true"], .q-sure, .bar, #mod-side, [hidden]';
  var BLOCK = /^(P|LI|DT|DD|H1|H2|H3|H4|H5|H6|FIGCAPTION|TD|TH|BLOCKQUOTE|SUMMARY|LABEL|CAPTION|LEGEND)$/;
  // on screen: not display:none or visibility:hidden, and not inside a closed fold (newer browsers keep a closed fold's
  // content laid out, so its size alone does not tell)
  function shown(e) {
    if (e.checkVisibility ? !e.checkVisibility({ visibilityProperty: true }) : !e.getClientRects().length) return false;
    for (var d = e.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) {
      if (!d.open) { var s = e.closest('summary'); if (!s || s.parentElement !== d) return false; }
    }
    return true;
  }
  function blocksIn(root) {
    var out = [], cur = null, disp = new Map();
    function blockOf(node) {
      for (var el = node.parentElement; el && el !== root; el = el.parentElement) {
        if (BLOCK.test(el.tagName)) return el;
        var d = disp.get(el); if (d === undefined) { d = getComputedStyle(el).display; disp.set(el, d); }
        if (d !== 'inline' && d !== 'contents') return el;
      }
      return root;
    }
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!/\S/.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
        var p = n.parentElement; if (!p || p.closest(SKIP)) return NodeFilter.FILTER_REJECT;
        // only what is on screen is read (not closed folds, hidden answers or other tabs); FAQ answers are read even when folded
        var open = p.closest('[data-tts-open]');
        if (!open && !shown(p)) return NodeFilter.FILTER_REJECT;
        if (!open && p.closest('summary')) return NodeFilter.FILTER_REJECT; // fold buttons ("Show model answer")
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    for (var n; (n = w.nextNode());) {
      var b = blockOf(n);
      if (!cur || cur.el !== b) { cur = { el: b, text: '' }; out.push(cur); }
      cur.text += n.nodeValue;
    }
    var heading = '', said = new Set();
    return out.map(function (x) {
      var t = x.text.replace(/\s+/g, ' ').trim();
      // "Option 2." before a quiz option, "Example 3." before an example: said once, before the first piece inside it
      var pe = x.el.closest && x.el.closest('[data-tts-prefix]'), pre = '';
      if (pe && root.contains(pe) && !said.has(pe)) { said.add(pe); pre = pe.getAttribute('data-tts-prefix'); }
      if (!pre && x.el.tagName === 'FIGCAPTION') pre = 'Diagram:';
      if (pre) t = pre + ' ' + t;
      if (/^H[1-6]$/.test(x.el.tagName)) heading = t;
      if (t && !/[.!?:;।]$/.test(t)) t += '.'; // a pause after headings and titles
      return { el: x.el, text: t, heading: heading };
    }).filter(function (x) { return /[A-Za-z0-9ऀ-ॿ]/.test(x.text); });
  }

  /* ---------- the player ---------- */
  var Q = [], qi = 0, playing = false, token = 0, wd = 0, srcBtn = null, srcLabel = '', started = false, fails = 0, lastUserScroll = 0;
  function readEl(root, o) {
    o = o || {};
    var list = blocksIn(root);
    if (!list.length) { showBar(); setMsg('There is nothing to read here.'); return; }
    var at = 0;
    if (o.fromView && window.scrollY > 120) { // start at what is on screen
      var top = topEdge();
      for (var i = 0; i < list.length; i++) { var r = list[i].el.getBoundingClientRect(); if (r.bottom > top + 4) { at = i; break; } }
    }
    stop(true);
    // the player names what is read: the given label, else the first heading of the part being read
    var h = root.querySelector('h1, h2, h3');
    Q = list; qi = at; srcBtn = o.button || null; srcLabel = o.label || (h ? h.textContent.replace(/\s+/g, ' ').trim() : '');
    setBtnState(srcBtn, true);
    showBar(); setMsg('');
    speakBlock();
  }
  function speakBlock() {
    if (qi >= Q.length) { finish(); return; }
    var b = Q[qi];
    if (!b.el.isConnected) { stop(); return; } // the page changed under us
    highlight(b.el); playing = true; updateBar();
    var ps = parts(b.text), t = ++token, i = 0;
    (function next() {
      if (t !== token) return;
      if (i >= ps.length) { qi++; speakBlock(); return; }
      var p = ps[i++], u = new Utter(p.text), v = p.lang === 'hi' ? hiVoice() : enVoice(), done = false;
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = p.lang === 'hi' ? 'hi-IN' : 'en-IN';
      u.rate = prefs.rate;
      var go = function () { if (done || t !== token) return; done = true; clearTimeout(wd); next(); };
      u.onstart = function () { started = true; fails = 0; };
      u.onend = go;
      u.onerror = function (e) {
        if (t !== token) return;
        var err = e && e.error;
        if (err === 'interrupted' || err === 'canceled') return; // our own stop or skip
        // a device whose voice keeps failing would otherwise "finish" the page in silence
        if (++fails >= 3 && !started || (!started && !voices.length)) { noVoice(); return; }
        go();
      };
      // some phones never report the end of a piece: move on after a generous time, but not while the tab is hidden
      var guard = function () { if (t !== token || done) return; if (document.hidden) { wd = setTimeout(guard, 2000); return; } go(); };
      clearTimeout(wd); wd = setTimeout(guard, 4000 + p.text.length * 120 / prefs.rate);
      try { synth.speak(u); } catch (e) { go(); }
    })();
  }
  function halt() { token++; clearTimeout(wd); try { synth.cancel(); } catch (e) {} }
  function pause() { if (!playing) return; halt(); playing = false; updateBar(); }
  function resume() { if (playing || !Q.length) return; if (qi >= Q.length) qi = 0; speakBlock(); } // starts the paragraph again
  function step(d) { if (!Q.length) return; halt(); qi = Math.max(0, Math.min(Q.length - 1, qi + d)); speakBlock(); }
  function finish() { halt(); playing = false; highlight(null); setBtnState(srcBtn, false); srcBtn = null; qi = Q.length; updateBar(true); }
  function stop(keepBar) {
    halt(); playing = false; highlight(null); setBtnState(srcBtn, false); srcBtn = null; Q = []; qi = 0;
    if (!keepBar) hideBar();
  }
  function noVoice() {
    halt(); playing = false; highlight(null); setBtnState(srcBtn, false); updateBar();
    setMsg('This browser has no reading voice. On an Android phone, install or update "Speech Services by Google". On a computer, try Chrome or Edge.');
  }

  /* ---------- highlight and follow ---------- */
  var lit = null;
  function highlight(el) {
    if (lit) lit.classList.remove('tts-on');
    lit = el; if (!el) return;
    // a folded FAQ answer opens while it is read
    for (var d = el.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) if (!d.open && d.closest('[data-tts-open]')) d.open = true;
    el.classList.add('tts-on');
    if (Date.now() - lastUserScroll < 5000) return; // the learner is scrolling: do not pull the page back
    var r = el.getBoundingClientRect(), top = topEdge(), bottom = window.innerHeight - barHeight() - 8;
    if (r.top >= top && r.bottom <= bottom) return;
    var room = bottom - top, y = r.height > room ? r.top - top - 8 : r.top - top - (room - r.height) / 2;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    try { window.scrollBy({ top: y, behavior: reduce ? 'auto' : 'smooth' }); } catch (e) { window.scrollBy(0, y); }
  }
  function topEdge() {
    var t = 0;
    ['.site-head', '.prog-strip', '.quiz-head'].forEach(function (s) { var e = document.querySelector(s); if (e) { var r = e.getBoundingClientRect(); if (r.top <= t + 2 && r.bottom > t && getComputedStyle(e).position === 'sticky') t = r.bottom; } });
    return t;
  }
  ['wheel', 'touchmove'].forEach(function (ev) { window.addEventListener(ev, function () { lastUserScroll = Date.now(); }, { passive: true }); });
  window.addEventListener('keydown', function (e) { if (/^(PageUp|PageDown|ArrowUp|ArrowDown|Home|End| )$/.test(e.key) && !/^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || '')) lastUserScroll = Date.now(); });

  /* ---------- the bar ---------- */
  var bar = null;
  function el(id) { return document.getElementById(id); }
  function makeBar() {
    if (bar) return bar;
    bar = document.createElement('div');
    bar.className = 'tts-bar'; bar.id = 'tts-bar'; bar.hidden = true;
    bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Read aloud');
    bar.innerHTML = '<div class="tts-row"><p class="tts-now" id="tts-now"></p><div class="tts-ctl">' +
      '<button type="button" class="btn btn-ghost icon-btn" data-tts-act="prev" aria-label="Previous paragraph" title="Previous paragraph">' + ICON.prev + '</button>' +
      '<button type="button" class="btn btn-primary icon-btn" data-tts-act="toggle" id="tts-toggle"></button>' +
      '<button type="button" class="btn btn-ghost icon-btn" data-tts-act="next" aria-label="Next paragraph" title="Next paragraph">' + ICON.next + '</button>' +
      '<button type="button" class="btn btn-ghost tts-rate" data-tts-act="rate" id="tts-rate"></button>' +
      '<button type="button" class="btn btn-ghost tts-more" data-tts-act="opts" id="tts-more" aria-expanded="false" aria-controls="tts-opts">Voice</button>' +
      '<button type="button" class="btn btn-ghost icon-btn" data-tts-act="stop" aria-label="Stop reading and close" title="Stop and close">' + ICON.close + '</button></div></div>' +
      '<div class="tts-opts stack-sm" id="tts-opts" hidden><div class="control"><label for="tts-voice">Voice</label><select id="tts-voice"></select></div>' +
      '<label class="tts-check"><input type="checkbox" id="tts-hindi"> Say the Hindi words in brackets</label><p class="small muted" id="tts-note"></p></div>' +
      '<p class="tts-msg small" id="tts-msg" role="status"></p>';
    document.body.appendChild(bar);
    bar.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-tts-act]'); if (!b) return;
      var a = b.getAttribute('data-tts-act');
      if (a === 'toggle') { if (playing) pause(); else resume(); }
      else if (a === 'prev') step(-1);
      else if (a === 'next') step(1);
      else if (a === 'rate') { prefs.rate = RATES[(RATES.indexOf(prefs.rate) + 1) % RATES.length]; savePrefs(); if (playing) { halt(); speakBlock(); } updateBar(); }
      else if (a === 'opts') { var o = el('tts-opts'), open = o.hidden; o.hidden = !open; b.setAttribute('aria-expanded', String(open)); fillVoices(); padPage(); }
      else if (a === 'stop') { var back = srcBtn; stop(); if (back && back.isConnected) back.focus(); }
    });
    bar.addEventListener('change', function (ev) {
      if (ev.target.id === 'tts-voice') { prefs.voice = ev.target.value; savePrefs(); if (playing) { halt(); speakBlock(); } }
      if (ev.target.id === 'tts-hindi') { prefs.hindi = ev.target.checked ? 'say' : 'skip'; savePrefs(); if (playing) { halt(); speakBlock(); } }
    });
    bar.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { var back = srcBtn; stop(); if (back && back.isConnected) back.focus(); } });
    if (window.ResizeObserver) new ResizeObserver(padPage).observe(bar);
    return bar;
  }
  function fillVoices() {
    var s = el('tts-voice'); if (!s) return;
    var en = voices.filter(function (v) { return score(v, 'en') >= 0; }).sort(function (a, b) { return score(b, 'en') - score(a, 'en'); });
    s.innerHTML = '<option value="">Automatic (best Indian English voice)</option>' + en.map(function (v) {
      return '<option value="' + esc(v.voiceURI) + '"' + (v.voiceURI === prefs.voice ? ' selected' : '') + '>' + esc(v.name + ' (' + v.lang + ')') + '</option>';
    }).join('');
    var h = el('tts-hindi'); if (h) h.checked = prefs.hindi !== 'skip';
    var n = el('tts-note');
    if (n) n.textContent = !voices.length ? 'No voices found yet on this device.' : hiVoice() ? 'Hindi words are said by: ' + hiVoice().name + '.' : 'This device has no Hindi voice, so Hindi words are read from their English spelling.';
  }
  function showBar() { makeBar().hidden = false; document.body.classList.add('tts-bar-on'); html.classList.add('tts-pad'); updateBar(); padPage(); }
  function hideBar() { if (!bar) return; bar.hidden = true; el('tts-opts').hidden = true; el('tts-more').setAttribute('aria-expanded', 'false'); document.body.classList.remove('tts-bar-on'); html.classList.remove('tts-pad'); }
  function barHeight() { return bar && !bar.hidden ? bar.offsetHeight : 0; }
  function padPage() { if (bar && !bar.hidden) html.style.setProperty('--tts-h', bar.offsetHeight + 'px'); }
  function setMsg(m) { var x = el('tts-msg'); if (x) { x.textContent = m; x.hidden = !m; } padPage(); }
  function updateBar(ended) {
    if (!bar) return;
    var b = Q[Math.min(qi, Q.length - 1)], what = (b && b.heading) || srcLabel || 'this page';
    el('tts-now').textContent = !Q.length ? 'Read aloud' : ended ? 'Finished: ' + (srcLabel || 'this page') + '. Press play to hear it again.' : (playing ? 'Reading ' : 'Paused ') + (qi + 1) + ' of ' + Q.length + ' · ' + what;
    var t = el('tts-toggle');
    t.innerHTML = playing ? ICON.pause : ICON.play;
    t.setAttribute('aria-label', playing ? 'Pause' : 'Play'); t.title = playing ? 'Pause' : 'Play';
    var r = el('tts-rate'); r.textContent = prefs.rate + '×'; r.setAttribute('aria-label', 'Reading speed ' + prefs.rate + ' times. Change speed');
  }
  function setBtnState(b, on) {
    if (!b || !b.isConnected) return;
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-label', (on ? 'Stop listening: ' : '') + (b.getAttribute('data-tts-label') || 'Listen'));
    var l = b.querySelector('.tts-lbl'); if (l) l.textContent = on ? 'Stop' : (b.getAttribute('data-tts-text') || 'Listen');
  }

  /* ---------- buttons anywhere ---------- */
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('[data-tts-root]'); if (!b) return;
    ev.preventDefault();
    if (b === srcBtn && Q.length) { stop(); return; } // the same button again: stop
    var sel = b.getAttribute('data-tts-root'), root = sel === 'main' ? document.getElementById('main') : (b.closest(sel) || document.querySelector('#main ' + sel));
    var inner = b.getAttribute('data-tts-in'); if (root && inner) root = root.querySelector(inner);
    if (!root) return;
    if (!b.hasAttribute('data-tts-text')) { var l = b.querySelector('.tts-lbl'); if (l) b.setAttribute('data-tts-text', l.textContent); }
    loadVoices();
    readEl(root, { button: b, fromView: b.getAttribute('data-tts-from') === 'view', label: b.getAttribute('data-tts-what') || '' });
  });
  // a new page or tab: stop (what was being read is gone)
  window.addEventListener('hashchange', function () { if (Q.length) stop(); });
  window.addEventListener('pagehide', function () { try { synth.cancel(); } catch (e) {} });

  loadVoices();
  if (synth.addEventListener) synth.addEventListener('voiceschanged', loadVoices); else synth.onvoiceschanged = loadVoices;

  window.AIM_SPEAK = {
    supported: true, btn: btn, icon: ICON.spk,
    readEl: function (root, o) { readEl(root, o); },
    stop: function () { if (Q.length || (bar && !bar.hidden)) stop(); },
    isPlaying: function () { return playing; },
    _blocks: blocksIn, _parts: parts // for tests
  };
})();
