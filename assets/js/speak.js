/* AI Marg: read aloud.
   Uses Neural AI Speech (/api/tts powered by Gemini TTS) by default for natural, fluid Hinglish and Indian English
   pronunciation without choppy voice switching, with automatic fallback to the browser's Web Speech API if offline.
   Any button with data-tts-root reads aloud: data-tts-root is a selector for the part to read (the button's closest
   match, else the first match on the page, or "main"); data-tts-in narrows it; data-tts-from="view" starts at what is
   on screen. Elements read with data-tts-prefix first say that text. */
(function () {
  'use strict';
  var synth = window.speechSynthesis, Utter = window.SpeechSynthesisUtterance;
  var BROWSER_OK = !!(synth && Utter && typeof synth.speak === 'function');
  var OK = true; // Always enabled via Neural AI TTS + Browser Speech fallback
  var html = document.documentElement;
  html.classList.add('tts');

  var ICON = {
    spk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>',
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 5h2v14H6zM19 5v14L9 12z" fill="currentColor"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M16 5h2v14h-2zM5 5v14l10-7z" fill="currentColor"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg>'
  };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function btn(rootSel, label, o) {
    o = o || {};
    var hl = window.AIM_HINGLISH && !o.noHinglish ? window.AIM_HINGLISH.btn(rootSel, label, o) : '';
    if (!OK) return hl;
    return hl + '<button type="button" class="btn btn-sm btn-ghost tts-btn' + (o.icon ? ' tts-icon' : '') + '" data-tts-root="' + esc(rootSel) + '"' +
      (o.within ? ' data-tts-in="' + esc(o.within) + '"' : '') + ' aria-label="' + esc(label) + '" data-tts-label="' + esc(label) + '">' + ICON.spk +
      (o.icon ? '' : '<span class="tts-lbl">' + esc(o.text || 'Listen') + '</span>') + '</button>';
  }

  /* ---------- preferences ---------- */
  var KEY = 'aimarg.tts', RATES = [0.75, 1, 1.25, 1.5];
  var NEURAL_VOICES = [
    { id: 'neural:Kore', name: 'Kore', label: 'AI Neural · Kore (Warm Indian teacher — Best for Hinglish)' },
    { id: 'neural:Puck', name: 'Puck', label: 'AI Neural · Puck (Energetic & conversational)' },
    { id: 'neural:Zephyr', name: 'Zephyr', label: 'AI Neural · Zephyr (Clear & calm)' },
    { id: 'neural:Charon', name: 'Charon', label: 'AI Neural · Charon (Deep & steady)' }
  ];
  var prefs = { rate: 1, voice: 'neural:Kore', hindi: 'say' };
  try {
    var sv = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
    if (RATES.indexOf(sv.rate) >= 0) prefs.rate = sv.rate;
    if (typeof sv.voice === 'string' && sv.voice) prefs.voice = sv.voice;
    if (sv.hindi === 'skip') prefs.hindi = 'skip';
  } catch (e) {}
  function savePrefs() { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) {} }
  function isNeuralVoice() { return !prefs.voice || prefs.voice.indexOf('neural:') === 0; }
  function neuralVoiceName() { return isNeuralVoice() ? (prefs.voice.split(':')[1] || 'Kore') : 'Kore'; }

  /* ---------- browser fallback voices ---------- */
  var voices = [];
  function loadVoices() {
    if (!BROWSER_OK) return;
    try { voices = synth.getVoices() || []; } catch (e) { voices = []; }
    fillVoices();
  }
  function langOf(v) { return String(v.lang || '').replace('_', '-').toLowerCase(); }
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
    if (prefs.voice && !isNeuralVoice()) {
      for (var i = 0; i < voices.length; i++) if (voices[i].voiceURI === prefs.voice && score(voices[i], 'en') >= 0) return voices[i];
    }
    return best('en');
  }
  function hiVoice() { return best('hi'); }

  /* ---------- text cleanup ---------- */
  var DEVRUN = /[ऀ-ॿ][ऀ-ॿ‌‍ ]*/g;
  var GLOSS = /\(([ऀ-ॿ][ऀ-ॿ‌‍ ]*), ([a-z][a-z' -]*)\)/g;
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

  function cleanForNeural(text, isHinglish) {
    var say = prefs.hindi !== 'skip';
    var s = String(text || '');
    s = s.replace(GLOSS, function (all, dev, rom) {
      if (!say) return '';
      return isHinglish ? '(' + rom + ')' : '(' + dev + ')';
    });
    if (window.AIM_HINGLISH && typeof window.AIM_HINGLISH.prepareSpeech === 'function') {
      s = window.AIM_HINGLISH.prepareSpeech(s, isHinglish);
    }
    return tidy(s);
  }

  // Smooth browser fallback parts: in Hinglish mode, DO NOT chop every Hindi word into a separate utterance!
  function parts(text, isHinglish) {
    var hv = hiVoice(), say = prefs.hindi !== 'skip', out = [];
    text = text.replace(GLOSS, function (all, dev, rom) { return !say ? '' : (!isHinglish && hv) ? '(' + dev + ')' : '(' + rom + ')'; });
    if (isHinglish) {
      var cleaned = tidy(text.replace(DEVRUN, ' ').replace(/[()]/g, ' '));
      chunks(cleaned).forEach(function (c) {
        out.push({ lang: hv ? 'hi' : 'en', text: c });
      });
      return out;
    }
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
  function chunks(s) {
    var out = [], MAX = 180, sens = [], start = 0;
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
        var open = p.closest('[data-tts-open]');
        if (!open && !shown(p)) return NodeFilter.FILTER_REJECT;
        if (!open && p.closest('summary')) return NodeFilter.FILTER_REJECT;
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
      var pe = x.el.closest && x.el.closest('[data-tts-prefix]'), pre = '';
      if (pe && root.contains(pe) && !said.has(pe)) { said.add(pe); pre = pe.getAttribute('data-tts-prefix'); }
      if (!pre && x.el.tagName === 'FIGCAPTION') pre = 'Diagram:';
      if (pre) t = pre + ' ' + t;
      if (/^H[1-6]$/.test(x.el.tagName)) heading = t;
      if (t && !/[.!?:;।]$/.test(t)) t += '.';
      return { el: x.el, text: t, heading: heading };
    }).filter(function (x) { return /[A-Za-z0-9ऀ-ॿ]/.test(x.text); });
  }

  /* ---------- Neural TTS Audio Cache & Prefetching ---------- */
  var clientAudioCache = new Map();
  var inFlightAudio = new Map();
  var activeAudio = null;

  function fetchNeuralAudio(text, isHl, vName) {
    var key = vName + '|' + (isHl ? 'hl' : 'en') + '|' + text;
    if (clientAudioCache.has(key)) {
      return Promise.resolve(clientAudioCache.get(key));
    }
    if (inFlightAudio.has(key)) {
      return inFlightAudio.get(key);
    }
    var p = fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text, isHinglish: isHl, voice: vName })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('TTS HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        inFlightAudio.delete(key);
        if (!data || !data.audioBase64) throw new Error('Empty audio');
        var dataUri = 'data:' + (data.mimeType || 'audio/wav') + ';base64,' + data.audioBase64;
        if (clientAudioCache.size > 60) {
          var first = clientAudioCache.keys().next().value;
          if (first) clientAudioCache.delete(first);
        }
        clientAudioCache.set(key, dataUri);
        return dataUri;
      })
      .catch(function (err) {
        inFlightAudio.delete(key);
        throw err;
      });
    inFlightAudio.set(key, p);
    return p;
  }

  function prefetchNextBlock(idx) {
    if (!isNeuralVoice() || idx >= Q.length) return;
    var nb = Q[idx];
    if (!nb || !nb.el || !nb.el.isConnected) return;
    var isHl = !!(window.AIM_HINGLISH && window.AIM_HINGLISH.isCardHinglish(nb.el));
    var txt = cleanForNeural(liveBlockText(nb), isHl);
    if (txt) {
      fetchNeuralAudio(txt, isHl, neuralVoiceName()).catch(function () {});
    }
  }

  /* ---------- the player ---------- */
  var Q = [], qi = 0, playing = false, loadingAudio = false, token = 0, wd = 0, srcBtn = null, srcLabel = '', started = false, fails = 0, lastUserScroll = 0;
  var activeRoot = null;
  function readEl(root, o) {
    o = o || {};
    activeRoot = root;
    var list = blocksIn(root);
    if (!list.length) { showBar(); setMsg('There is nothing to read here.'); return; }
    var at = 0;
    if (o.fromView && window.scrollY > 120) {
      var top = topEdge();
      for (var i = 0; i < list.length; i++) { var r = list[i].el.getBoundingClientRect(); if (r.bottom > top + 4) { at = i; break; } }
    }
    stop(true);
    activeRoot = root;
    var h = root.querySelector('h1, h2, h3');
    Q = list; qi = at; srcBtn = o.button || null; srcLabel = o.label || (h ? h.textContent.replace(/\s+/g, ' ').trim() : '');
    setBtnState(srcBtn, true);
    showBar(); setMsg('');
    speakBlock();
  }
  function liveBlockText(b) {
    if (!b || !b.el || !b.el.isConnected) return b ? b.text : '';
    var fresh = blocksIn(b.el);
    if (fresh.length === 1) return fresh[0].text;
    return b.text;
  }
  function speakBlock() {
    if (qi >= Q.length) { finish(); return; }
    var b = Q[qi];
    if (!b.el.isConnected) { stop(); return; }
    var isHl = !!(window.AIM_HINGLISH && window.AIM_HINGLISH.isCardHinglish(b.el));
    var curText = liveBlockText(b);
    highlight(b.el);
    playing = true;
    var t = ++token;

    if (isNeuralVoice()) {
      var neuralText = cleanForNeural(curText, isHl);
      loadingAudio = true;
      updateBar();
      prefetchNextBlock(qi + 1);
      fetchNeuralAudio(neuralText, isHl, neuralVoiceName())
        .then(function (dataUri) {
          if (t !== token) return;
          loadingAudio = false;
          updateBar();
          var aud = new Audio(dataUri);
          activeAudio = aud;
          aud.playbackRate = prefs.rate;
          aud.onended = function () {
            if (t !== token) return;
            activeAudio = null;
            qi++;
            speakBlock();
          };
          aud.onerror = function () {
            if (t !== token) return;
            activeAudio = null;
            speakBrowserFallback(curText, isHl, t);
          };
          var playPromise = aud.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function () {
              if (t !== token) return;
              activeAudio = null;
              speakBrowserFallback(curText, isHl, t);
            });
          }
        })
        .catch(function () {
          if (t !== token) return;
          loadingAudio = false;
          updateBar();
          speakBrowserFallback(curText, isHl, t);
        });
      return;
    }

    loadingAudio = false;
    updateBar();
    speakBrowserFallback(curText, isHl, t);
  }

  function speakBrowserFallback(curText, isHl, t) {
    if (!BROWSER_OK) {
      noVoice();
      return;
    }
    var ps = parts(curText, isHl), i = 0;
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
        if (err === 'interrupted' || err === 'canceled') return;
        if (++fails >= 3 && !started || (!started && !voices.length)) { noVoice(); return; }
        go();
      };
      var guard = function () { if (t !== token || done) return; if (document.hidden) { wd = setTimeout(guard, 2000); return; } go(); };
      clearTimeout(wd); wd = setTimeout(guard, 4000 + p.text.length * 120 / prefs.rate);
      try { synth.speak(u); } catch (e) { go(); }
    })();
  }

  function halt() {
    token++;
    loadingAudio = false;
    clearTimeout(wd);
    if (activeAudio) {
      try { activeAudio.pause(); activeAudio.src = ''; } catch (e) {}
      activeAudio = null;
    }
    if (BROWSER_OK) {
      try { synth.cancel(); } catch (e) {}
    }
  }
  function pause() { if (!playing) return; halt(); playing = false; updateBar(); }
  function resume() { if (playing || !Q.length) return; if (qi >= Q.length) qi = 0; speakBlock(); }
  function step(d) { if (!Q.length) return; halt(); qi = Math.max(0, Math.min(Q.length - 1, qi + d)); speakBlock(); }
  function finish() { halt(); playing = false; highlight(null); setBtnState(srcBtn, false); srcBtn = null; qi = Q.length; updateBar(true); }
  function stop(keepBar) {
    halt(); playing = false; highlight(null); setBtnState(srcBtn, false); srcBtn = null; Q = []; qi = 0;
    if (!keepBar) hideBar();
  }
  function noVoice() {
    halt(); playing = false; highlight(null); setBtnState(srcBtn, false); updateBar();
    setMsg('Could not play audio right now. Check your internet connection or try selecting another voice in the Voice menu.');
  }

  /* ---------- highlight and follow ---------- */
  var lit = null;
  function highlight(el) {
    if (lit) lit.classList.remove('tts-on');
    lit = el; if (!el) return;
    for (var d = el.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) if (!d.open && d.closest('[data-tts-open]')) d.open = true;
    el.classList.add('tts-on');
    if (Date.now() - lastUserScroll < 5000) return;
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
      '<button type="button" class="btn btn-ghost tts-more" data-tts-act="hinglish" id="tts-hl" aria-pressed="false" title="Switch active reading between English and Hinglish">Hinglish</button>' +
      '<button type="button" class="btn btn-ghost tts-more" data-tts-act="opts" id="tts-more" aria-expanded="false" aria-controls="tts-opts">Voice</button>' +
      '<button type="button" class="btn btn-ghost icon-btn" data-tts-act="stop" aria-label="Stop reading and close" title="Stop and close">' + ICON.close + '</button></div></div>' +
      '<div class="tts-opts stack-sm" id="tts-opts" hidden><div class="control"><label for="tts-voice">Voice engine</label><select id="tts-voice"></select></div>' +
      '<label class="tts-check"><input type="checkbox" id="tts-hindi"> Say the Hindi words in brackets</label><p class="small muted" id="tts-note"></p></div>' +
      '<p class="tts-msg small" id="tts-msg" role="status"></p>';
    document.body.appendChild(bar);
    bar.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-tts-act]'); if (!b) return;
      var a = b.getAttribute('data-tts-act');
      if (a === 'toggle') { if (playing) pause(); else resume(); }
      else if (a === 'prev') step(-1);
      else if (a === 'next') step(1);
      else if (a === 'rate') {
        prefs.rate = RATES[(RATES.indexOf(prefs.rate) + 1) % RATES.length];
        savePrefs();
        if (activeAudio) {
          activeAudio.playbackRate = prefs.rate;
          updateBar();
        } else if (playing) {
          halt(); speakBlock();
        } else {
          updateBar();
        }
      }
      else if (a === 'hinglish') {
        var target = activeRoot || (Q[qi] && Q[qi].el && Q[qi].el.closest('[data-sec], .card, section, #main')) || document.getElementById('main');
        if (target && window.AIM_HINGLISH) {
          var nextOn = target.getAttribute('data-hl-on') !== '1';
          window.AIM_HINGLISH.setCardMode(target, nextOn);
          if (playing) { halt(); speakBlock(); } else updateBar();
        }
      }
      else if (a === 'opts') { var o = el('tts-opts'), open = o.hidden; o.hidden = !open; b.setAttribute('aria-expanded', String(open)); fillVoices(); padPage(); }
      else if (a === 'stop') { var back = srcBtn; stop(); if (back && back.isConnected) back.focus(); }
    });
    bar.addEventListener('change', function (ev) {
      if (ev.target.id === 'tts-voice') { prefs.voice = ev.target.value; savePrefs(); fillVoices(); if (playing) { halt(); speakBlock(); } }
      if (ev.target.id === 'tts-hindi') { prefs.hindi = ev.target.checked ? 'say' : 'skip'; savePrefs(); if (playing) { halt(); speakBlock(); } }
    });
    bar.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { var back = srcBtn; stop(); if (back && back.isConnected) back.focus(); } });
    if (window.ResizeObserver) new ResizeObserver(padPage).observe(bar);
    return bar;
  }
  function fillVoices() {
    var s = el('tts-voice'); if (!s) return;
    var neuralOpts = NEURAL_VOICES.map(function (nv) {
      return '<option value="' + esc(nv.id) + '"' + (prefs.voice === nv.id ? ' selected' : '') + '>' + esc(nv.label) + '</option>';
    }).join('');
    var en = voices.filter(function (v) { return score(v, 'en') >= 0; }).sort(function (a, b) { return score(b, 'en') - score(a, 'en'); });
    var browserOpts = en.map(function (v) {
      return '<option value="' + esc(v.voiceURI) + '"' + (v.voiceURI === prefs.voice ? ' selected' : '') + '>Browser · ' + esc(v.name + ' (' + v.lang + ')') + '</option>';
    }).join('');
    s.innerHTML = '<optgroup label="AI Neural Voices (Natural Hinglish & Indian English)">' + neuralOpts + '</optgroup>' +
      (browserOpts ? '<optgroup label="Device Browser Voices (Offline)">' + browserOpts + '</optgroup>' : '');
    var h = el('tts-hindi'); if (h) h.checked = prefs.hindi !== 'skip';
    var n = el('tts-note');
    if (n) {
      n.textContent = isNeuralVoice()
        ? 'Using Gemini AI Neural Voice (' + neuralVoiceName() + ') tuned for natural conversational Hinglish & Indian English.'
        : 'Using offline browser voice. Switch to an AI Neural Voice above for smoother Hinglish pronunciation.';
    }
  }
  function showBar() { makeBar().hidden = false; document.body.classList.add('tts-bar-on'); html.classList.add('tts-pad'); updateBar(); padPage(); }
  function hideBar() { if (!bar) return; bar.hidden = true; el('tts-opts').hidden = true; el('tts-more').setAttribute('aria-expanded', 'false'); document.body.classList.remove('tts-bar-on'); html.classList.remove('tts-pad'); }
  function barHeight() { return bar && !bar.hidden ? bar.offsetHeight : 0; }
  function padPage() { if (bar && !bar.hidden) html.style.setProperty('--tts-h', bar.offsetHeight + 'px'); }
  function setMsg(m) { var x = el('tts-msg'); if (x) { x.textContent = m; x.hidden = !m; } padPage(); }
  function updateBar(ended) {
    if (!bar) return;
    var b = Q[Math.min(qi, Q.length - 1)], what = (b && b.heading) || srcLabel || 'this page';
    var isHl = !!(b && b.el && window.AIM_HINGLISH && window.AIM_HINGLISH.isCardHinglish(b.el));
    var langTag = isHl ? ' (Hinglish)' : '';
    var statePrefix = loadingAudio ? 'Loading neural audio' + langTag + ' · ' : (playing ? 'Reading' + langTag + ' ' : 'Paused' + langTag + ' ');
    el('tts-now').textContent = !Q.length ? 'Read aloud' : ended ? 'Finished: ' + (srcLabel || 'this page') + '. Press play to hear it again.' : statePrefix + (qi + 1) + ' of ' + Q.length + ' · ' + what;
    var t = el('tts-toggle');
    t.innerHTML = playing ? ICON.pause : ICON.play;
    t.setAttribute('aria-label', playing ? 'Pause' : 'Play'); t.title = playing ? 'Pause' : 'Play';
    var r = el('tts-rate'); r.textContent = prefs.rate + '×'; r.setAttribute('aria-label', 'Reading speed ' + prefs.rate + ' times. Change speed');
    var hBtn = el('tts-hl');
    if (hBtn) {
      hBtn.setAttribute('aria-pressed', String(isHl));
      hBtn.classList.toggle('is-on', isHl);
      hBtn.textContent = isHl ? 'Hinglish ✓' : 'Hinglish';
    }
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
    if (b === srcBtn && Q.length) { stop(); return; }
    var sel = b.getAttribute('data-tts-root'), root = sel === 'main' ? document.getElementById('main') : (b.closest(sel) || document.querySelector('#main ' + sel));
    var inner = b.getAttribute('data-tts-in'); if (root && inner) root = root.querySelector(inner);
    if (!root) return;
    if (!b.hasAttribute('data-tts-text')) { var l = b.querySelector('.tts-lbl'); if (l) b.setAttribute('data-tts-text', l.textContent); }
    loadVoices();
    readEl(root, { button: b, fromView: b.getAttribute('data-tts-from') === 'view', label: b.getAttribute('data-tts-what') || '' });
  });
  window.addEventListener('hashchange', function () { if (Q.length) stop(); });
  window.addEventListener('pagehide', function () { halt(); });

  loadVoices();
  if (BROWSER_OK) {
    if (synth.addEventListener) synth.addEventListener('voiceschanged', loadVoices); else synth.onvoiceschanged = loadVoices;
  }

  window.AIM_SPEAK = {
    supported: true, btn: btn, icon: ICON.spk,
    readEl: function (root, o) { readEl(root, o); },
    refreshCurrent: function () { if (playing && Q.length) { halt(); speakBlock(); } else if (bar && !bar.hidden) updateBar(); },
    stop: function () { if (Q.length || (bar && !bar.hidden)) stop(); },
    isPlaying: function () { return playing; },
    _blocks: blocksIn, _parts: parts
  };
})();
