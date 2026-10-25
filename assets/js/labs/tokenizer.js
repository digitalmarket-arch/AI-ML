/* AI Marg lab: "tokenizer" — Byte-Pair Encoding (BPE): grow sub-word tokens out of single characters.
   Plain classic script (ES2019), no dependencies, works from file://. Registers window.AILabs.tokenizer. */
(function () {
  'use strict';
  var Labs = (window.AILabs = window.AILabs || {});
  var uid = 0;

  var SP = '▁'; // "▁" marks a word that comes after a space (the SentencePiece convention)
  var MIN_COUNT = 2; // stop when no pair appears at least twice (Hugging Face: min_frequency = 2)
  var MAX_MERGES = 400;
  var MAX_CHARS = 2000;
  var MAX_TRY = 300;
  var MAX_H = 1400; // tallest the text picture may grow (px)
  var STEP_MS = 110; // "Merge 10" plays one merge every STEP_MS
  var MAX_PX = 3500000; // cap on canvas backing-store pixels (keeps tall pictures light on phones)
  var T1_MERGES = 20, T2_LIMIT = 2.5, T4_MERGES = 30;

  var EN_LINES = [
    'The model reads the text one token at a time.',
    'The tokenizer cuts the text into small tokens.',
    'Each token can be one whole word or just part of the word.',
    'More data helps the model learn better.',
    'We are learning machine learning in India.',
    'Learning to read the tokens is the first step.',
    'The model learns the meaning of each token from the data.'
  ];
  var HI_LINES = [
    'भारत में बहुत सारी भाषाएँ बोली जाती हैं।',
    'मॉडल पाठ को छोटे टुकड़ों में पढ़ता है।',
    'मशीन लर्निंग सीखना मज़ेदार है।'
  ];
  var HG_LINES = ['Yaar, machine learning seekhna toh mazedaar hai!'];
  // Hindi translations of English lines above, so "More Hindi" really is more of the same content
  var HI_EXTRA = [
    'टोकनाइज़र पाठ को छोटे टोकन में काटता है।',
    'ज़्यादा डेटा से मॉडल बेहतर सीखता है।',
    'हम भारत में मशीन लर्निंग सीख रहे हैं।',
    'हर टोकन एक पूरा शब्द या शब्द का हिस्सा होता है।',
    'मॉडल डेटा से हर टोकन का मतलब सीखता है।'
  ];
  var PRESETS = {
    en: { label: 'Mostly English', text: EN_LINES.concat(HI_LINES, HG_LINES).join('\n') },
    hi: { label: 'More Hindi', text: EN_LINES.concat(HI_LINES, HI_EXTRA, HG_LINES).join('\n') }
  };
  // the same sentence in English, Hindi and Hinglish; none of these lines is in the training text
  var TRY_DEFAULT = ['The model learns to read the text.', 'मॉडल पाठ पढ़ना सीखता है।', 'model text padhna seekhta hai.'].join('\n');
  var tryDefaultWords = null; // words already in the starting "Try new text" box (filled on first mount)

  var LANGS = [
    { id: 'en', tag: 'EN', name: 'English', color: '--series-1' },
    { id: 'hi', tag: 'HI', name: 'Hindi', color: '--series-2' },
    { id: 'hg', tag: 'HG', name: 'Hinglish', color: '--series-4' }
  ];
  var LANG = { en: LANGS[0], hi: LANGS[1], hg: LANGS[2] };

  // common Hindi words typed in English letters; used only to label a Latin-script line as Hinglish
  var HG_WORDS = new Map();
  ('hai hain ho hoon hun tha thi kya kyun kyon kaise kaisa kab kahan kaun nahi nahin mein mujhe mera meri mere ' +
    'tera teri tum tumhara aap aapka hum hamara woh wo yeh ye aur ka ki ke ko se bhi toh sab kuch bahut bohot ' +
    'accha acha achha theek thik sahi yaar bhai abhi kal aaj phir jab lekin magar kyunki wala wali wale raha ' +
    'rahi rahe karna karo kar karte karta karti kiya gaya gayi hoga hogi chahiye sakta sakte sakti dekho chalo ' +
    'matlab seekh seekhna seekhta seekhte padh padhna padhta padhte likhna mazaa maza mazedaar dost ghar kaam ' +
    'paisa paise din raat pyaar dil haan ji ek').split(' ').forEach(function (w) { HG_WORDS.set(w, true); });

  var TASKS = [
    { id: 't1', text: 'Do at least 20 merges, then find the first merge that made a complete word (not just a piece of one) and tap it in the merge list.' },
    { id: 't2', text: 'Keep merging until an English word needs fewer than 2.5 tokens on average. How many does a Hindi word need at that point?' },
    { id: 't3', text: 'In “Try new text”, type a word that is not in the training text (try “relearning” or “tokenizing”) and watch it split into pieces the tokenizer already knows.' },
    { id: 't4', text: 'Do at least 30 merges, then switch the training text to “More Hindi”. Do the same Hindi sentences now need fewer tokens per word?' }
  ];

  /* ---------- text helpers ---------- */
  var RE_CHUNK, RE_WORDCH, RE_MARK;
  try {
    // zero-width (non-)joiners, used in some Devanagari spellings, stay inside their word
    RE_CHUNK = new RegExp('\\s+|[\\p{L}\\p{M}\\p{N}\\u200C\\u200D]+|[^\\s\\p{L}\\p{M}\\p{N}\\u200C\\u200D]+', 'gu');
    RE_WORDCH = new RegExp('[\\p{L}\\p{N}]', 'u');
    RE_MARK = new RegExp('^\\p{M}$', 'u');
  } catch (e) { // very old browsers: Latin + Devanagari only
    var LT = 'A-Za-z0-9\\u00C0-\\u024F\\u0900-\\u0963\\u0966-\\u097F\\u200C\\u200D';
    RE_CHUNK = new RegExp('\\s+|[' + LT + ']+|[^\\s' + LT + ']+', 'g');
    RE_WORDCH = new RegExp('[' + LT + ']');
    RE_MARK = /^[ऀ-ःऺ-ॏ॑-ॗॢॣ]$/;
  }
  var RE_SPACE = /^\s+$/;
  var RE_DEVA = /[ऀ-ॿ]/;
  var RE_LATIN = /[A-Za-z]/;

  function nfc(s) { try { return s.normalize('NFC'); } catch (e) { return s; } }
  function cps(s) { return Array.from(s); }
  function cpLen(s) { var n = 0; for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); if (c < 0xDC00 || c > 0xDFFF) n++; } return n; }
  function noSp(s) { return s.charAt(0) === SP ? s.slice(1) : s; }
  function spoken(s) { return s.replace(/▁/g, '(space)'); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function nfmt(n) { return Number(n).toLocaleString('en-IN'); }

  // Pre-tokenise one line: split at spaces, keep punctuation apart, and put ▁ on every word that follows a space
  // (or starts the line), like SentencePiece. Merges never cross these chunk borders.
  function splitLine(line) {
    var out = [], prevSpace = true, m;
    RE_CHUNK.lastIndex = 0;
    while ((m = RE_CHUNK.exec(line)) !== null) {
      var s = m[0];
      if (!s) { RE_CHUNK.lastIndex++; continue; }
      if (RE_SPACE.test(s)) { prevSpace = true; continue; }
      out.push({ s: (prevSpace ? SP : '') + s, word: RE_WORDCH.test(s) });
      prevSpace = false;
    }
    return out;
  }

  function lineLang(line, chunks) {
    var deva = 0, lat = 0;
    for (var i = 0; i < line.length; i++) {
      var ch = line.charAt(i);
      if (RE_DEVA.test(ch)) deva++; else if (RE_LATIN.test(ch)) lat++;
    }
    if (!deva && !lat) return '';
    if (deva >= lat) return 'hi';
    var n = 0, w = 0;
    chunks.forEach(function (c) { if (!c.word) return; w++; if (HG_WORDS.has(noSp(c.s).toLowerCase())) n++; });
    return (n >= 2 || (n >= 1 && w <= 3)) ? 'hg' : 'en';
  }

  // replace every (a, b) neighbour pair with the merged token, left to right; returns the same array if nothing changed
  function applyMerge(s, a, b, tok) {
    var out = null;
    for (var i = 0; i < s.length; i++) {
      if (i < s.length - 1 && s[i] === a && s[i + 1] === b) {
        if (!out) out = s.slice(0, i);
        out.push(tok); i++;
      } else if (out) out.push(s[i]);
    }
    return out || s;
  }
  // tokenise new text: start from characters and apply the first k merges in the order they were learned
  function encodeSyms(sym, merges, k) {
    for (var r = 0; r < k && sym.length > 1; r++) sym = applyMerge(sym, merges[r].a, merges[r].b, merges[r].tok);
    return sym;
  }

  function train(types) {
    var words = types.map(function (t) { return t.sym0; });
    var merges = [];
    while (merges.length < MAX_MERGES) {
      var pc = new Map(), best = null, ord = 0, w, i;
      for (w = 0; w < words.length; w++) {
        var s = words[w], n = types[w].n;
        for (i = 0; i < s.length - 1; i++) {
          var key = s[i] + '\u0000' + s[i + 1], e = pc.get(key);
          if (e) e.c += n; else pc.set(key, { c: n, o: ord++, a: s[i], b: s[i + 1] });
        }
      }
      // most frequent pair wins; a tie goes to the pair that shows up first in the text
      pc.forEach(function (cand) { if (!best || cand.c > best.c || (cand.c === best.c && cand.o < best.o)) best = cand; });
      if (!best || best.c < MIN_COUNT) break;
      var tie = false;
      pc.forEach(function (cand) { if (cand !== best && cand.c === best.c) tie = true; });
      var tok = best.a + best.b;
      for (w = 0; w < words.length; w++) words[w] = applyMerge(words[w], best.a, best.b, tok);
      merges.push({ a: best.a, b: best.b, tok: tok, count: best.c, rank: merges.length + 1, tie: tie, deva: RE_DEVA.test(tok), latin: !RE_DEVA.test(tok) && RE_LATIN.test(tok) });
    }
    return merges;
  }

  function buildCorpus(text) {
    var C = { lines: [], types: [], typeOf: new Map(), wordSet: new Map(), base: new Map() };
    nfc(text).split(/\r?\n/).forEach(function (raw) {
      var line = raw.replace(/\s+$/, '');
      if (!line.replace(/\s+/g, '')) return;
      var ch = splitLine(line);
      if (!ch.length) return;
      var L = { lang: lineLang(line, ch), chunks: [] };
      ch.forEach(function (c) {
        var ti = C.typeOf.get(c.s);
        if (ti === undefined) {
          ti = C.types.length;
          var sym = cps(c.s);
          C.types.push({ s: c.s, n: 0, sym0: sym, word: c.word });
          C.typeOf.set(c.s, ti);
          sym.forEach(function (x) { C.base.set(x, true); });
          if (c.word) C.wordSet.set(c.s, true);
        }
        C.types[ti].n++;
        L.chunks.push(ti);
      });
      C.lines.push(L);
    });
    C.baseSize = C.base.size;
    C.sym0 = C.types.map(function (t) { return t.sym0; });
    C.merges = train(C.types);
    // vocabulary after k merges (a merge that re-creates a token we already have adds nothing new)
    var vocab = new Map(C.base);
    C.vocabAt = [C.baseSize];
    C.madeBy = new Map();
    C.merges.forEach(function (m) {
      vocab.set(m.tok, true);
      C.vocabAt.push(vocab.size);
      if (!C.madeBy.has(m.tok)) C.madeBy.set(m.tok, m);
    });
    C.firstWord = 0;
    for (var i = 0; i < C.merges.length; i++) if (C.wordSet.has(C.merges[i].tok)) { C.firstWord = i + 1; break; }
    C.startTokens = 0;
    C.lines.forEach(function (L) { L.chunks.forEach(function (ti) { C.startTokens += C.sym0[ti].length; }); });
    C.fert0 = fertOf(C, function (ti) { return C.sym0[ti].length; });
    C.cache = null;
    return C;
  }

  // segmentation of every word type after k merges (cached; moving forward only applies the new merges)
  function segsAt(C, k) {
    var S = C.cache;
    if (!S || S.k > k) S = C.cache = { k: 0, segs: C.sym0.slice() };
    for (var r = S.k; r < k; r++) {
      var m = C.merges[r];
      for (var i = 0; i < S.segs.length; i++) S.segs[i] = applyMerge(S.segs[i], m.a, m.b, m.tok);
    }
    S.k = k;
    return S.segs;
  }

  // tokens per word ("fertility") for each language, counting word pieces only (punctuation left out)
  function fertOf(C, tokLen) {
    var acc = { en: { t: 0, w: 0 }, hi: { t: 0, w: 0 }, hg: { t: 0, w: 0 } };
    C.lines.forEach(function (L) {
      var a = acc[L.lang];
      if (!a) return;
      L.chunks.forEach(function (ti) { if (!C.types[ti].word) return; a.t += tokLen(ti); a.w++; });
    });
    ['en', 'hi', 'hg'].forEach(function (id) { var a = acc[id]; a.f = a.w ? a.t / a.w : 0; });
    return acc;
  }

  /* ---------- colour helpers (all colours come from the theme's CSS variables) ---------- */
  function parseColor(s) {
    if (!s) return null;
    s = s.trim();
    if (s.charAt(0) === '#') {
      var h = s.slice(1);
      if (h.length === 3 || h.length === 4) h = h.split('').map(function (c) { return c + c; }).join('');
      if (h.length >= 6) return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
      return null;
    }
    var m = s.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
    return m ? [+m[1], +m[2], +m[3]] : null;
  }
  function mix(a, b, t) { return [a[0] * t + b[0] * (1 - t), a[1] * t + b[1] * (1 - t), a[2] * t + b[2] * (1 - t)]; }
  function rgb(c) { return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; }
  function lum(c) { return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }

  var lastHtml = new WeakMap();
  function setHtml(node, html) { if (lastHtml.get(node) !== html) { lastHtml.set(node, html); node.innerHTML = html; } }

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) {
      for (var key in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, key)) continue;
        var v = attrs[key];
        if (v == null || v === false) continue;
        if (key === 'text') n.textContent = v;
        else if (key === 'html') n.innerHTML = v;
        else if (key === 'class') n.className = v;
        else n.setAttribute(key, v === true ? '' : String(v));
      }
    }
    if (kids) kids.forEach(function (kid) { if (kid != null) n.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid); });
    return n;
  }

  function mount(root, ctx) {
    if (!tryDefaultWords) {
      tryDefaultWords = new Map();
      TRY_DEFAULT.split('\n').forEach(function (line) { splitLine(nfc(line)).forEach(function (c) { if (c.word) tryDefaultWords.set(noSp(c.s), true); }); });
    }
    var pre = 'tok' + (++uid) + '-';
    var alive = true;
    var doneSet = {};
    TASKS.forEach(function (t) { doneSet[t.id] = !!(ctx && ctx.isTaskDone && ctx.isTaskDone(t.id)); });

    var preset = 'en';
    var C = buildCorpus(PRESETS.en.text);
    var REF = C; // the "Mostly English" tokenizer, kept for the More Hindi comparison
    var k = 0, segs = segsAt(C, 0), curTokens = C.startTokens;
    var curF = C.fert0, ghostF = null, ghostK = 0;
    var selTok = null, cursor = -1, hover = -1, focused = false;
    var justTok = null; // token made by the latest single merge step (drawn with a yellow fill)
    var anim = null, raf = 0, needLayout = true, pendingScroll = 0; // 1 = list needs scrolling, 2 = do it next frame
    var tryEdited = false, corpusTimer = 0, shownK = 0;
    var theme = null;

    /* ---------- DOM ---------- */
    root.innerHTML = '';
    var lab = el('div', { class: 'lab' });
    lab.appendChild(el('p', { class: 'lab-note', html:
      '<b>What you are seeing:</b> the training text cut into <b>tokens</b> (the pieces a language model actually reads). ' +
      'It starts as single characters (Unicode <b>code points</b>: the numbered characters computers use for every script), and <b>▁</b> marks the space before a word. ' +
      'Each <b>merge</b> finds the two neighbouring tokens that sit together most often (outlined in yellow) and glues them into one new token, ' +
      'which joins the <b>vocabulary</b> (the list of every token the tokenizer knows), so common words slowly become single tokens. This is <b>Byte-Pair Encoding (BPE)</b>, the idea behind GPT’s tokenizer. ' +
      'Grey boxes are still single characters; coloured boxes are learned pieces (the same piece always gets the same colour). ' +
      'Tap a token to see how it was built. A Hindi letter with a vowel sign, like कि, is two code points (क + ि), so it starts as two boxes.' }));

    var body = el('div', { class: 'lab-body' });
    var left = el('div', { class: 'stack-sm', style: 'min-width:0' });
    var wrap = el('div', { class: 'lab-canvas-wrap', style: 'aspect-ratio:auto;height:320px' });
    // taps only (no dragging), so let a finger on this tall picture still scroll the page
    var canvas = el('canvas', { role: 'img', tabindex: '0', 'aria-label': 'Training text cut into tokens', style: 'touch-action:manipulation;cursor:default;bottom:auto;height:320px' });
    wrap.appendChild(canvas);
    left.appendChild(wrap);
    var g = canvas.getContext('2d');

    var legend = el('div', { class: 'lab-legend', 'aria-hidden': 'true' }, [
      el('span', { style: '--c: var(--series-1)', text: 'EN English' }),
      el('span', { style: '--c: var(--series-2)', text: 'HI Hindi (Devanagari)' }),
      el('span', { style: '--c: var(--series-4)', text: 'HG Hinglish (Hindi in English letters)' }),
      el('span', { style: '--c: var(--haldi)', text: 'yellow fill = just merged, yellow outline = next pair' })
    ]);
    left.appendChild(legend);

    var info = el('p', { class: 'lab-note', 'aria-live': 'polite', style: 'color:var(--ink);line-height:1.75' });
    left.appendChild(info);

    function stat(label) {
      var v = el('div', { class: 'v', text: '0' });
      return { box: el('div', { class: 'stat' }, [el('div', { class: 'k', text: label }), v]), v: v };
    }
    var stMerges = stat('Merges done'), stVocab = stat('Vocabulary'), stTokens = stat('Tokens in text'), stShrink = stat('Text shorter by');
    var stats = el('div', { class: 'lab-stats' }, [stMerges.box, stVocab.box, stTokens.box, stShrink.box]);
    left.appendChild(stats);

    // fertility panel
    var fertBody = el('div', { class: 'stack-sm' });
    var fertText = el('p', { class: 'small', style: 'line-height:1.55;margin:0' });
    var ghostText = el('p', { class: 'small muted', style: 'line-height:1.55;margin:0', hidden: true });
    var fertBox = el('section', { style: 'border:1px solid var(--line);border-radius:var(--radius);padding:12px 14px;background:var(--surface);display:flex;flex-direction:column;gap:10px', 'aria-labelledby': pre + 'fert-h' }, [
      el('div', {}, [
        el('h4', { id: pre + 'fert-h', text: 'Tokens per word' }),
        el('p', { class: 'small muted', text: 'Also called fertility: how many pieces one word is cut into, on average (punctuation not counted). Fewer is cheaper and faster.' })
      ]),
      fertBody, fertText, ghostText,
      el('p', { class: 'small muted', style: 'line-height:1.5;margin:0', text: 'Byte-level tokenizers (like GPT-2’s) widen the gap: they start from UTF-8 bytes (the way computers store text), and each Devanagari letter takes 3 bytes while an English letter takes 1.' })
    ]);
    left.appendChild(fertBox);

    // merge list
    var mergeCount = el('span', { class: 'small muted num' });
    var mlist = el('ol', { style: 'list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(225px,1fr));gap:4px;max-height:236px;overflow:auto;overscroll-behavior:contain', 'aria-label': 'Merge rules in the order they were learned' });
    var emptyNote = el('li', { class: 'small muted', style: 'margin:0;padding:4px 2px;grid-column:1/-1', text: 'No merges yet: every token is a single character. Press “Merge once”.' });
    var nextLi = el('li', { class: 'small', style: 'margin:0;padding:4px 8px;border:1px dashed var(--haldi);border-radius:var(--radius-sm);color:var(--muted);grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:6px' });
    var rows = [];
    var mergeBox = el('section', { style: 'border:1px solid var(--line);border-radius:var(--radius);padding:12px 14px;background:var(--surface);display:flex;flex-direction:column;gap:8px', 'aria-labelledby': pre + 'ml-h' }, [
      el('div', { class: 'row-between' }, [el('h4', { id: pre + 'ml-h', text: 'Merge rules learned' }), mergeCount]),
      el('p', { class: 'small muted', text: 'Rank, the pair that was glued, the new token, and how many times the pair appeared. Tap a rule to find its token in the text.' }),
      mlist
    ]);
    left.appendChild(mergeBox);
    body.appendChild(left);

    // right column: controls
    var controls = el('div', { class: 'lab-controls' });
    var bOnce = el('button', { type: 'button', class: 'btn btn-primary', style: 'padding:9px 12px', text: 'Merge once' });
    var bTen = el('button', { type: 'button', class: 'btn', style: 'padding:9px 12px', text: 'Merge 10' });
    var bReset = el('button', { type: 'button', class: 'btn btn-ghost', style: 'padding:9px 12px', text: 'Reset' });
    var vocabId = pre + 'vocab';
    var vocabOut = el('output', { for: vocabId, class: 'num', text: '' });
    var vocabIn = el('input', { type: 'range', id: vocabId, min: '0', max: '0', step: '1', value: '0' });
    var vocabHint = el('div', { class: 'small muted' });
    var trainBox = el('div', { class: 'stack-sm' }, [
      el('div', { class: 'row' }, [bOnce, bTen, bReset]),
      el('div', { class: 'control' }, [el('label', { for: vocabId }, [el('span', { text: 'Target vocabulary size' }), vocabOut]), vocabIn, vocabHint])
    ]);
    controls.appendChild(trainBox);

    var corpusId = pre + 'corpus';
    var segBtns = {};
    var seg = el('div', { class: 'seg', role: 'group', 'aria-labelledby': pre + 'preset-l' });
    ['en', 'hi'].forEach(function (p) {
      var b = el('button', { type: 'button', 'aria-pressed': p === preset ? 'true' : 'false', text: PRESETS[p].label });
      b.addEventListener('click', function () { switchPreset(p); });
      segBtns[p] = b;
      seg.appendChild(b);
    });
    var corpusTa = el('textarea', { id: corpusId, rows: '7', maxlength: String(MAX_CHARS), spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off', style: 'min-height:150px;font-size:.95rem' });
    corpusTa.value = PRESETS.en.text;
    controls.appendChild(el('div', { class: 'control' }, [
      el('span', { class: 'control-label', id: pre + 'preset-l', text: 'Training text' }),
      seg,
      el('p', { class: 'small muted', text: 'Real LLM (large language model) training data is mostly English. “More Hindi” adds Hindi translations of five English lines.' }),
      el('label', { for: corpusId, class: 'small', style: 'font-weight:400;color:var(--muted)', text: 'The tokenizer learns only from this text. Edit it (up to 2,000 characters) and it retrains.' }),
      corpusTa
    ]));

    var tryId = pre + 'try';
    var tryTa = el('textarea', { id: tryId, rows: '3', maxlength: String(MAX_TRY), spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off', style: 'min-height:84px;font-size:.95rem' });
    tryTa.value = TRY_DEFAULT;
    var tryOut = el('div', { class: 'stack-sm', style: 'gap:10px' });
    var tryNote = el('p', { class: 'small', 'aria-live': 'polite', style: 'line-height:1.5' });
    controls.appendChild(el('div', { class: 'control' }, [
      el('label', { for: tryId }, [el('span', { text: 'Try new text' }), el('span', { class: 'small muted', style: 'font-weight:400', text: 'not used for training' })]),
      tryTa, tryOut, tryNote
    ]));

    var taskItems = {};
    var taskList = el('ul', { class: 'lab-tasks' });
    TASKS.forEach(function (t) {
      var li = el('li', {}, [el('span', { text: t.text })]);
      if (doneSet[t.id]) { li.classList.add('done'); li.appendChild(el('span', { class: 'visually-hidden', text: ' (done)' })); }
      taskItems[t.id] = li;
      taskList.appendChild(li);
    });
    controls.appendChild(el('div', { class: 'stack-sm' }, [el('h4', { text: 'Challenges' }), taskList]));
    body.appendChild(controls);
    lab.appendChild(body);

    lab.appendChild(el('p', { class: 'lab-note', html:
      '<b>Why it matters in real ML:</b> LLM services charge per token and can only read a fixed number of tokens at once, so a tokenizer trained mostly on English makes Hindi text cost more, run slower and fit less, which is why Indian teams such as AI4Bharat and Sarvam AI train tokenizers on far more Indian-language text.' }));
    lab.appendChild(el('p', { class: 'kbd-hint', text: 'Keyboard: focus the text picture and use the arrow keys to step through tokens (Esc clears). The vocabulary slider also takes arrow keys.' }));
    root.appendChild(lab);

    /* ---------- theme ---------- */
    function readTheme() {
      var cs = getComputedStyle(document.documentElement);
      function v(n, fb) { var x = cs.getPropertyValue(n).trim(); return x || fb; }
      var t = {
        surface: v('--surface', '#fff'), surface2: v('--surface-2', '#eee'), ink: v('--ink', '#000'), muted: v('--muted', '#777'),
        line: v('--line', '#ccc'), haldi: v('--haldi', '#fc0'), bad: v('--bad', '#c00'),
        font: v('--font-body', 'system-ui, sans-serif')
      };
      var sC = parseColor(t.surface) || [255, 255, 255], inkC = parseColor(t.ink) || [0, 0, 0];
      t.dark = lum(sC) < 0.4;
      t.lang = {}; t.langSoft = {};
      LANGS.forEach(function (l) {
        var c = v(l.color, t.ink);
        t.lang[l.id] = c;
        t.langSoft[l.id] = rgb(mix(parseColor(c) || inkC, sC, t.dark ? 0.26 : 0.14));
      });
      // No yellow or orange here: a yellow fill means "just merged" and a yellow outline means "next pair".
      var b = ['--series-1', '--series-2', '--series-4', '--ok'].map(function (n) { return parseColor(v(n, '')) || inkC; });
      var hues = [b[0], b[1], b[2], b[3], mix(b[0], b[1], 0.5), mix(b[0], b[2], 0.5)];
      t.fill = []; t.edge = [];
      (t.dark ? [[0.3, 0.7], [0.46, 0.85]] : [[0.15, 0.55], [0.3, 0.72]]).forEach(function (st) {
        hues.forEach(function (h) { t.fill.push(rgb(mix(h, sC, st[0]))); t.edge.push(rgb(mix(h, sC, st[1]))); });
      });
      t.key = [t.surface, t.ink, t.muted, t.haldi].concat(t.fill).join('|');
      return t;
    }
    function chipColor(tok, unk) {
      if (unk) return { fill: theme.surface, edge: theme.bad };
      if (cpLen(tok) <= 1) return { fill: theme.surface2, edge: theme.line };
      var i = hash(tok) % theme.fill.length;
      return { fill: theme.fill[i], edge: theme.edge[i] };
    }
    function chipHtml(tok, unk) {
      var c = chipColor(tok, unk);
      var inner = tok.charAt(0) === SP ? '<span style="color:' + theme.muted + '">' + SP + '</span>' + esc(tok.slice(1)) : esc(tok);
      return '<span style="display:inline-block;padding:0 4px;border:1px ' + (unk ? 'dashed' : 'solid') + ' ' + c.edge + ';border-radius:4px;background:' + c.fill +
        ';color:' + theme.ink + ';font-weight:500;line-height:1.5;white-space:pre"' + (unk ? ' title="Unknown: never seen in training"' : '') + '>' + inner + '</span>';
    }
    function tagHtml(lang) {
      var l = LANG[lang];
      return '<span style="font-size:.7rem;font-weight:700;letter-spacing:.04em;padding:0 6px;border-radius:999px;margin-right:6px;line-height:1.7;color:' +
        (l ? theme.lang[lang] : theme.muted) + ';background:' + (l ? theme.langSoft[lang] : theme.surface2) + '">' + (l ? l.tag : '··') + '</span>';
    }
    theme = readTheme();

    /* ---------- tasks ---------- */
    function complete(id) {
      if (doneSet[id]) return;
      doneSet[id] = true;
      var li = taskItems[id];
      if (li) { li.classList.add('done'); li.appendChild(el('span', { class: 'visually-hidden', text: ' (done)' })); }
      if (ctx && ctx.onTaskDone) ctx.onTaskDone(id);
      if (id === 't1') rows.forEach(tagRow);
    }
    function checkTasks() {
      if (!C.lines.length) return;
      if (!doneSet.t1 && k >= T1_MERGES && C.firstWord && C.firstWord <= k && selTok !== null && selTok === C.merges[C.firstWord - 1].tok) complete('t1');
      if (!doneSet.t2 && k > 0 && curF.en.w && curF.hi.w && curF.en.f < T2_LIMIT) complete('t2');
      if (!doneSet.t4 && preset === 'hi' && k >= T4_MERGES && ghostF && ghostF.hi.w && curF.hi.w && ghostF.hi.f - curF.hi.f >= 0.1) complete('t4');
    }

    /* ---------- state changes ---------- */
    function setK(nk, flash) {
      nk = clamp(nk, 0, C.merges.length);
      if (flash && nk === k + 1) justTok = C.merges[nk - 1].tok; else if (nk !== k) justTok = null;
      k = nk;
      if (selTok !== null && C.madeBy.has(selTok) && C.madeBy.get(selTok).rank > k) { selTok = null; cursor = -1; }
      update();
    }
    function stopAnim() { anim = null; }
    function reducedMotion() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
    function mergeBy(n) {
      var M = C.merges.length;
      if (anim) { anim.target = Math.min(M, anim.target + n); return; }
      var t = Math.min(M, k + n);
      if (t <= k) return;
      if (n === 1 || reducedMotion()) { setK(t, true); return; }
      anim = { target: t, last: 0 };
      requestDraw();
    }
    function kForVocab(v) { // fewest merges that reach vocabulary size v
      for (var i = 0; i < C.vocabAt.length; i++) if (C.vocabAt[i] >= v) return i;
      return C.merges.length;
    }

    function ghostAt(kk) { // the same lines, cut by the "Mostly English" tokenizer with the same number of merges
      var ka = Math.min(kk, REF.merges.length);
      ghostK = ka;
      var memo = new Map();
      return fertOf(C, function (ti) {
        var v = memo.get(ti);
        if (v === undefined) { v = encodeSyms(C.sym0[ti], REF.merges, ka).length; memo.set(ti, v); }
        return v;
      });
    }

    function update() {
      var M = C.merges.length;
      segs = segsAt(C, k);
      var tokens = 0;
      C.lines.forEach(function (L) { L.chunks.forEach(function (ti) { tokens += segs[ti].length; }); });
      curTokens = tokens;
      stMerges.v.textContent = String(k);
      stVocab.v.textContent = String(C.vocabAt[k]);
      stTokens.v.textContent = nfmt(tokens);
      stShrink.v.textContent = C.startTokens ? Math.round(100 * (1 - tokens / C.startTokens)) + '%' : '0%';
      vocabIn.max = String(C.vocabAt[M]);
      vocabIn.min = String(C.baseSize);
      vocabIn.value = String(C.vocabAt[k]);
      vocabIn.disabled = M === 0;
      vocabOut.textContent = String(C.vocabAt[k]);
      vocabHint.textContent = C.lines.length
        ? C.baseSize + ' starting characters + ' + plural(k, 'merge') + ' (training stops at ' + M + ')'
        : 'Type some training text first.';
      bOnce.disabled = k >= M;
      bTen.disabled = k >= M;
      bReset.disabled = k === 0;
      curF = fertOf(C, function (ti) { return segs[ti].length; });
      ghostF = preset === 'hi' ? ghostAt(k) : null;
      renderFert();
      updateRows();
      renderTry();
      renderInfo();
      updateAria();
      needLayout = true;
      requestDraw();
      checkTasks();
    }

    function retrain() {
      stopAnim();
      C = buildCorpus(corpusTa.value);
      k = Math.min(k, C.merges.length);
      selTok = null; cursor = -1; hover = -1; justTok = null; shownK = k;
      segs = segsAt(C, k);
      buildFert();
      buildRows();
      update();
      mlist.scrollTop = mlist.scrollHeight;
    }
    function syncSeg() { ['en', 'hi'].forEach(function (p) { segBtns[p].setAttribute('aria-pressed', p === preset ? 'true' : 'false'); }); }
    function switchPreset(p) {
      if (p === preset && corpusTa.value === PRESETS[p].text) return;
      preset = p;
      corpusTa.value = PRESETS[p].text;
      if (corpusTimer) { clearTimeout(corpusTimer); corpusTimer = 0; }
      syncSeg();
      retrain();
    }
    function onCorpusInput() {
      if (corpusTimer) clearTimeout(corpusTimer);
      corpusTimer = setTimeout(function () {
        corpusTimer = 0;
        if (!alive) return;
        var v = corpusTa.value;
        preset = v === PRESETS.en.text ? 'en' : v === PRESETS.hi.text ? 'hi' : 'custom';
        syncSeg();
        retrain();
      }, 300);
    }

    function select(tok, idx) {
      selTok = tok;
      if (tok === null) cursor = -1;
      else if (idx !== undefined) cursor = idx;
      else cursor = -1;
      renderInfo();
      markRows(true);
      updateAria();
      relayout(); // the yellow next-pair outlines only show when nothing is selected
      checkTasks();
    }

    /* ---------- side panels ---------- */
    function countTok(tok) {
      var n = 0;
      C.lines.forEach(function (L) { L.chunks.forEach(function (ti) { var s = segs[ti]; for (var i = 0; i < s.length; i++) if (s[i] === tok) n++; }); });
      return n;
    }
    function recipe(tok, out, seen) {
      var m = C.madeBy.get(tok);
      if (!m || m.rank > k || seen.has(m.rank)) return;
      recipe(m.a, out, seen);
      recipe(m.b, out, seen);
      seen.set(m.rank, true);
      out.push(m);
    }
    function renderInfo() {
      var M = C.merges.length, h;
      if (!C.lines.length) h = 'Type some text into “Training text” to train a tokenizer.';
      else if (selTok !== null) h = tokenInfo(selTok);
      else if (k < M) {
        var m = C.merges[k];
        h = '<b>Next merge #' + (k + 1) + ':</b> ' + chipHtml(m.a) + ' + ' + chipHtml(m.b) + ' → ' + chipHtml(m.tok) +
          '. These two sit side by side ' + plural(m.count, 'time') + ' in the training text, ' +
          (m.tie ? 'and no pair sits together more often (when pairs tie, the one that comes first in the text wins)' : 'more than any other pair') +
          ', so they become one new token. Their places are outlined in yellow.';
      } else if (M === 0) h = 'No pair of neighbouring tokens appears twice yet, so there is nothing to learn. Add more text.';
      else h = '<b>Training finished after ' + plural(M, 'merge') + ':</b> no pair of neighbouring tokens appears twice any more. ' +
        'Real tokenizers keep going for 30,000 to 200,000 tokens because they learn from billions of words.';
      setHtml(info, h);
    }
    function tokenInfo(tok) {
      var n = countTok(tok), m = C.madeBy.get(tok), s;
      var times = n ? 'It appears ' + plural(n, 'time') + ' in the text right now.' : 'It no longer appears on its own: later merges glued it into bigger tokens.';
      if (!m) {
        if (tok === SP) return chipHtml(tok) + ' is the word-start marker: it stands for the space before a word. ' + times;
        s = chipHtml(tok) + ' is a single character from the starting vocabulary. ' + times;
        if (RE_MARK.test(tok)) s += ' It is a Devanagari vowel sign or mark: a code point of its own, so it starts as a separate box.';
        return s;
      }
      s = chipHtml(tok) + ' was made by <b>merge #' + m.rank + '</b>: ' + chipHtml(m.a) + ' + ' + chipHtml(m.b) + '. ' + times;
      if (C.wordSet.has(tok)) {
        if (m.rank === C.firstWord) {
          s += k >= T1_MERGES ? ' <b>It is a complete word, and this is the first merge that made one!</b>'
            : ' <b>It is a complete word, the first one!</b> Do ' + plural(T1_MERGES - k, 'more merge') + ' to finish the challenge.';
        } else s += ' It is a complete word too, but an earlier merge already made one.';
      } else s += ' It is a piece of a word, not a whole word.';
      var steps = [];
      recipe(tok, steps, new Map());
      if (steps.length > 1) {
        var shown = steps.slice(-6);
        s += '<br><span class="small muted">Built in ' + plural(steps.length, 'step') + ': ' + (steps.length > 6 ? '… ' : '') +
          shown.map(function (x) { return esc(x.a) + ' + ' + esc(x.b) + ' → ' + esc(x.tok) + ' (#' + x.rank + ')'; }).join(' · ') + '</span>';
      }
      return s;
    }

    var fertRows = {};
    function buildFert() {
      fertBody.innerHTML = '';
      fertRows = {};
      LANGS.forEach(function (l) {
        if (!C.fert0[l.id].w) return;
        var fill = el('span', { style: 'position:absolute;left:0;top:0;bottom:0;width:0;border-radius:999px;background:var(' + l.color + ');transition:width .25s ease' });
        var ghost = el('span', { 'aria-hidden': 'true', style: 'position:absolute;top:-4px;bottom:-4px;width:3px;margin-left:-1.5px;border-radius:2px;background:var(--ink);display:none' });
        var track = el('span', { 'aria-hidden': 'true', style: 'position:relative;display:block;height:12px;border-radius:999px;background:var(--surface-2)' }, [fill, ghost]);
        var val = el('span', { class: 'mono num', style: 'text-align:right' });
        var name = el('span', { style: 'display:flex;align-items:center;gap:6px;min-width:0' }, [
          el('span', { 'aria-hidden': 'true', style: 'width:10px;height:10px;border-radius:50%;flex:none;background:var(' + l.color + ')' }),
          el('span', { text: l.name })
        ]);
        fertBody.appendChild(el('div', { style: 'display:grid;grid-template-columns:5.4rem minmax(0,1fr) 2.8rem;gap:10px;align-items:center;font-size:.93rem' }, [name, track, val]));
        fertRows[l.id] = { fill: fill, ghost: ghost, val: val };
      });
    }
    function renderFert() {
      var scale = 1;
      LANGS.forEach(function (l) {
        if (C.fert0[l.id].w) scale = Math.max(scale, C.fert0[l.id].f);
        if (ghostF && ghostF[l.id].w) scale = Math.max(scale, ghostF[l.id].f);
      });
      LANGS.forEach(function (l) {
        var r = fertRows[l.id];
        if (!r) return;
        var f = curF[l.id].f;
        r.fill.style.width = (100 * f / scale).toFixed(1) + '%';
        r.val.textContent = f.toFixed(2);
        if (ghostF && ghostF[l.id].w) { r.ghost.style.display = 'block'; r.ghost.style.left = (100 * ghostF[l.id].f / scale).toFixed(1) + '%'; }
        else r.ghost.style.display = 'none';
      });
      var en = curF.en, hi = curF.hi, s;
      if (en.w && hi.w) {
        var ratio = hi.f / en.f;
        if (k === 0) s = 'Before any merges every word is cut into single characters, so English (' + en.f.toFixed(2) + ') and Hindi (' + hi.f.toFixed(2) + ') start close together. Watch what the merges do.';
        else {
          var nd = 0, nl = 0;
          for (var i = 0; i < k; i++) { if (C.merges[i].deva) nd++; else if (C.merges[i].latin) nl++; }
          var why = ' ' + mergeMix(k, nl, nd);
          if (ratio >= 1.05) s = 'A Hindi word now needs <b>' + ratio.toFixed(1) + '×</b> as many tokens as an English word.' + why;
          else if (ratio <= 0.95) s = 'Right now a Hindi word needs fewer tokens than an English word (' + ratio.toFixed(1) + '×).' + why;
          else s = 'English and Hindi words need about the same number of tokens right now.' + why;
          s += ' At a made-up price of ₹1 per 1,000 tokens, 1,000 words cost about <b>₹' + en.f.toFixed(2) + '</b> in English and <b>₹' + hi.f.toFixed(2) + '</b> in Hindi.';
        }
      } else s = 'Add at least one English line and one Hindi (Devanagari) line to the training text to compare them.';
      setHtml(fertText, s);
      if (ghostF && ghostF.hi.w && hi.w) {
        ghostText.hidden = false;
        setHtml(ghostText, '<b style="color:var(--ink)">Thin upright marks:</b> the same sentences cut by the “Mostly English” tokenizer with ' + plural(ghostK, 'merge') +
          (ghostK < k ? ' (all it could learn)' : '') + '. Hindi: ' + ghostF.hi.f.toFixed(2) + ' → <b style="color:var(--ink)">' + hi.f.toFixed(2) + '</b> tokens per word' +
          (en.w ? '; English: ' + ghostF.en.f.toFixed(2) + ' → <b style="color:var(--ink)">' + en.f.toFixed(2) + '</b>' : '') +
          '. The merges are now shared between two languages.');
      } else ghostText.hidden = true;
    }

    // e.g. "18 of the 30 merges so far made English-letter pieces and only 12 made Hindi pieces."
    function mergeMix(kk, nl, nd) {
      var no = kk - nl - nd;
      if (kk === 1) return 'The one merge so far made ' + (nd ? 'a Hindi piece.' : nl ? 'an English-letter piece.' : 'a piece of punctuation or symbols.');
      var s = nl + ' of the ' + kk + ' merges so far made ' + (nl === 1 ? 'an English-letter piece' : 'English-letter pieces') + ' and ' +
        (nd * 2 <= nl ? 'only ' : '') + nd + ' made ' + (nd === 1 ? 'a Hindi piece' : 'Hindi pieces');
      return s + (no ? ' (' + no + ' made other pieces, such as punctuation).' : '.');
    }
    function tagRow(r) { // after challenge 1, label every merge that made a whole word
      if (r.tagged || !C.wordSet.has(r.m.tok)) return;
      r.tagged = true;
      r.b.children[1].appendChild(el('span', { class: 'chip chip-ok', style: 'font-size:.7rem;padding:0 6px', text: 'word' }));
      r.b.setAttribute('aria-label', r.b.getAttribute('aria-label') + ', a whole word');
    }
    function buildRows() {
      var keep = mlist.scrollTop, act = document.activeElement;
      var focusRank = act && mlist.contains(act) && act.getAttribute ? act.getAttribute('data-rank') : null;
      mlist.innerHTML = '';
      rows = [];
      mlist.appendChild(emptyNote);
      C.merges.forEach(function (m) {
        var b = el('button', { type: 'button', class: 'btn btn-sm', 'data-rank': String(m.rank), 'aria-pressed': 'false',
          'aria-label': 'Rule ' + m.rank + ': ' + spoken(m.a) + ' plus ' + spoken(m.b) + ' makes ' + spoken(m.tok) + ', seen ' + m.count + ' times',
          style: 'width:100%;height:100%;display:grid;grid-template-columns:2.1em minmax(0,1fr) auto;justify-content:stretch;align-items:center;gap:6px;font-weight:500;padding:4px 8px;text-align:left' });
        b.innerHTML = '<span class="mono small" style="color:var(--muted)">' + m.rank + '</span><span class="tk-pieces" style="display:flex;flex-wrap:wrap;align-items:center;gap:4px;min-width:0">' +
          chipHtml(m.a) + '<span aria-hidden="true" style="color:var(--muted)">+</span>' + chipHtml(m.b) + '<span aria-hidden="true" style="color:var(--muted)">→</span>' + chipHtml(m.tok) +
          '</span><span class="mono small" style="color:var(--muted)">×' + m.count + '</span>';
        var li = el('li', { style: 'margin:0' }, [b]);
        li.hidden = true;
        mlist.appendChild(li);
        var r = { li: li, b: b, m: m, vis: false, tagged: false };
        if (doneSet.t1) tagRow(r);
        rows.push(r);
      });
      mlist.appendChild(nextLi);
      updateRows();
      mlist.scrollTop = keep;
      if (focusRank && rows[+focusRank - 1] && rows[+focusRank - 1].vis) rows[+focusRank - 1].b.focus();
    }
    function updateRows() {
      var M = C.merges.length;
      for (var i = 0; i < rows.length; i++) {
        var vis = i < k;
        if (rows[i].vis !== vis) { rows[i].vis = vis; rows[i].li.hidden = !vis; }
      }
      emptyNote.hidden = k > 0 || M === 0;
      if (k < M) {
        var m = C.merges[k];
        nextLi.style.display = 'grid';
        setHtml(nextLi, '<span style="font-weight:700;color:var(--ink)">next #' + (k + 1) + '</span><span style="display:flex;flex-wrap:wrap;align-items:center;gap:4px;min-width:0">' +
          chipHtml(m.a) + '<span aria-hidden="true">+</span>' + chipHtml(m.b) + '<span aria-hidden="true">→</span>' + chipHtml(m.tok) + '</span><span class="mono">×' + m.count + '</span>');
      } else {
        nextLi.style.display = 'block';
        setHtml(nextLi, M ? 'Done: no pair appears twice any more.' : 'Nothing to merge yet: no pair appears twice.');
      }
      mergeCount.textContent = k + ' of ' + M;
      if (k > shownK) { pendingScroll = 1; requestDraw(); }
      shownK = k;
      markRows(false);
    }
    function markRows(scroll) {
      var target = selTok !== null && C.madeBy.has(selTok) ? C.madeBy.get(selTok).rank : 0;
      rows.forEach(function (r) {
        var on = r.m.rank === target && r.vis;
        if ((r.b.getAttribute('aria-pressed') === 'true') !== on) {
          r.b.setAttribute('aria-pressed', on ? 'true' : 'false');
          r.b.style.background = on ? 'var(--indigo-soft)' : '';
          r.b.style.borderColor = on ? 'var(--indigo)' : '';
        }
        if (on && scroll) {
          var lb = mlist.getBoundingClientRect(), ib = r.li.getBoundingClientRect();
          if (ib.top < lb.top || ib.bottom > lb.bottom) mlist.scrollTop += ib.top - lb.top - (lb.height - ib.height) / 2;
        }
      });
    }
    function onListClick(e) {
      var t = e.target;
      while (t && t !== mlist && !(t.getAttribute && t.getAttribute('data-rank'))) t = t.parentNode;
      if (!t || t === mlist) return;
      var m = C.merges[+t.getAttribute('data-rank') - 1];
      if (!m) return;
      select(selTok === m.tok ? null : m.tok);
    }
    mlist.addEventListener('click', onListClick);

    function renderTry() {
      var lines = nfc(tryTa.value).split(/\r?\n/).map(function (s) { return s.replace(/\s+$/, ''); })
        .filter(function (s) { return s.replace(/\s+/g, '').length > 0; });
      // a word the learner typed counts before one that was already in the box
      var html = '', hit = null, stuck = null, hitOwn = null, stuckOwn = null, unkTotal = 0;
      lines.slice(0, 6).forEach(function (line) {
        var ch = splitLine(line), lang = lineLang(line, ch), words = 0, wt = 0, unk = 0;
        var groups = [];
        ch.forEach(function (c, ci) {
          var toks = encodeSyms(cps(c.s), C.merges, k);
          if (c.word) { words++; wt += toks.length; }
          var bare = noSp(c.s), unseen = c.word && !C.wordSet.has(c.s) && !C.wordSet.has(SP + bare) && !C.wordSet.has(bare);
          if (unseen && cpLen(bare) >= 4 && toks.length >= 2) {
            var piece = toks.some(function (t) { return cpLen(noSp(t)) >= 2; }), own = !tryDefaultWords.has(bare);
            if (piece) { if (!hit) hit = bare; if (own && !hitOwn) hitOwn = bare; }
            else { if (!stuck) stuck = bare; if (own && !stuckOwn) stuckOwn = bare; }
          }
          var chipsH = toks.map(function (t) { var u = cpLen(t) === 1 && !C.base.has(t); if (u) unk++; return chipHtml(t, u); }).join('');
          var part = '<span style="display:inline-flex;flex-wrap:wrap;gap:2px;padding-bottom:2px' +
            (unseen ? ';border-bottom:2px dotted ' + theme.haldi : '') + '"' + (unseen ? ' title="Not in the training text"' : '') + '>' + chipsH + '</span>';
          // punctuation stuck to a word (no space before it) stays with that word when the line wraps
          if (ci > 0 && c.s.charAt(0) !== SP && groups.length) groups[groups.length - 1] += part; else groups.push(part);
        });
        var parts = groups.map(function (gp) { return '<span style="display:inline-flex;flex-wrap:wrap;gap:2px;margin-right:5px">' + gp + '</span>'; });
        unkTotal += unk;
        var sum = (LANG[lang] ? LANG[lang].name : 'Other') + ' · ' + plural(words, 'word') + ' → ' + plural(wt, 'token') +
          (words ? ' · <b style="color:var(--ink)">' + (wt / words).toFixed(2) + '</b> per word' : '') + (unk ? ' · ' + unk + ' unknown' : '');
        html += '<div style="display:flex;flex-direction:column;gap:2px"><div style="display:flex;flex-wrap:wrap;align-items:center;row-gap:4px;font-size:.95rem">' +
          tagHtml(lang) + parts.join('') + '</div><div class="small muted">' + sum + '</div></div>';
      });
      if (!lines.length) html = '<p class="small muted">Type something above to see how this tokenizer cuts it.</p>';
      else if (lines.length > 6) html += '<p class="small muted">Only the first 6 lines are shown.</p>';
      setHtml(tryOut, html);
      var note = 'Dotted line = word not in the training text.';
      if (unkTotal) note += ' Dashed red boxes are characters never seen in training: they become [UNK] (“unknown”). Byte-level tokenizers avoid this by falling back to raw bytes.';
      var good = hitOwn || (stuckOwn ? null : hit), bad = stuckOwn || stuck;
      if (tryEdited && good) note = '<b>“' + esc(good) + '” never appeared in the training text</b>, yet the tokenizer still handles it by reusing pieces it learned. ' + note;
      else if (tryEdited && bad) note = '“' + esc(bad) + '” is new, but no learned piece fits it yet, so it falls apart into single characters. Do more merges, or try a word that shares parts with the training text. ' + note;
      setHtml(tryNote, note);
      if (tryEdited && hitOwn) complete('t3');
    }
    function onTryInput() { tryEdited = true; renderTry(); }

    function updateAria() {
      canvas.setAttribute('aria-label', 'Training text cut into ' + curTokens + ' tokens after ' + plural(k, 'merge') +
        (selTok !== null ? '. Selected token: ' + spoken(selTok) : '') + '. Tap a token to see how it was built.');
    }

    /* ---------- canvas: layout + drawing ---------- */
    var dpr = 1, W = 0, H = 0, curH = 0, h0C = null;
    var chips = [], paraBoxes = [], pairs = [], LM = null;
    var wcache = new Map(), wfont = '';
    function metrics(width) {
      var s = width < 520;
      return { pad: s ? 8 : 12, h: s ? 20 : 25, fs: s ? 12.5 : 14.5, px: s ? 2.5 : 4, gap: s ? 1.5 : 2, wgap: s ? 4.5 : 7, rgap: s ? 3 : 5, pgap: s ? 7 : 10, stripe: 3, tfs: s ? 8.5 : 10 };
    }
    function fontStr(px, wt) { return (wt || 500) + ' ' + px + 'px ' + theme.font; }
    function textW(s) { var v = wcache.get(s); if (v === undefined) { v = g.measureText(s).width; wcache.set(s, v); } return v; }
    function tokW(tok, m) {
      var w = tok.charAt(0) === SP ? textW(SP) + (tok.length > 1 ? textW(tok.slice(1)) : 0) : textW(tok);
      return Math.max(Math.ceil(w) + 2 * m.px, Math.round(m.h * 0.6));
    }
    function glued(L, ci) { // chunk ci follows the previous one with no space (e.g. the "." after a word)
      return ci > 0 && ci < L.chunks.length && C.types[L.chunks[ci]].s.charAt(0) !== SP;
    }
    function layout(sg, width, rec) {
      var m = metrics(width);
      var f = fontStr(m.fs);
      if (f !== wfont) { wcache = new Map(); wfont = f; }
      g.font = fontStr(m.tfs, 700);
      var tagW = {};
      LANGS.forEach(function (l) { tagW[l.id] = Math.ceil(g.measureText(l.tag).width) + 10; });
      tagW[''] = Math.ceil(g.measureText('··').width) + 10;
      g.font = f;
      var x0 = m.pad + m.stripe + 7, maxX = width - m.pad, y = m.pad;
      var out = [], paras = [], prs = [];
      var nm = rec && selTok === null && k < C.merges.length ? C.merges[k] : null;
      for (var li = 0; li < C.lines.length; li++) {
        var L = C.lines[li], top = y, x = x0, tw = tagW[L.lang] || tagW[''];
        paras.push({ top: top, bottom: 0, lang: L.lang, tagX: x, tagW: tw });
        x += tw + 6;
        for (var ci = 0; ci < L.chunks.length; ci++) {
          var toks = sg[L.chunks[ci]], ws = [], gw = 0, j, cj;
          for (j = 0; j < toks.length; j++) { ws.push(tokW(toks[j], m)); gw += ws[j] + (j ? m.gap : 0); }
          if (!glued(L, ci)) {
            // a word and the punctuation stuck to it (no space between) wrap together, so "." never starts a row
            var need = gw;
            for (cj = ci + 1; cj < L.chunks.length && glued(L, cj); cj++) {
              sg[L.chunks[cj]].forEach(function (t) { need += m.gap + tokW(t, m); });
            }
            if (x > x0 && x + need > maxX) { x = x0; y += m.h + m.rgap; }
          }
          var start = out.length;
          for (j = 0; j < toks.length; j++) {
            if (x > x0 && x + ws[j] > maxX) { x = x0; y += m.h + m.rgap; }
            if (rec) out.push({ x: Math.round(x), y: y, w: ws[j], h: m.h, tok: toks[j] });
            x += ws[j] + m.gap;
          }
          if (nm) for (j = 0; j < toks.length - 1; j++) if (toks[j] === nm.a && toks[j + 1] === nm.b) { prs.push(start + j); j++; }
          if (!glued(L, ci + 1)) x += m.wgap - m.gap; // a wider gap only where the text has a space
        }
        paras[paras.length - 1].bottom = y + m.h;
        y += m.h + m.pgap;
      }
      if (rec) { chips = out; paraBoxes = paras; pairs = prs; LM = m; }
      return Math.ceil(y - m.pgap + m.pad);
    }
    var canH = 0, h0Key = '', h0 = 0, edge = 1;
    function layoutAll() {
      needLayout = false;
      var width = lastW > 0 ? lastW : wrap.clientWidth;
      if (!(width > 0)) return false;
      // The box is exactly as tall as the text. The merge buttons sit beside it (wide screens) or above it
      // (phones), so the shrinking text never moves a button under the learner's finger.
      var hk = 160;
      if (C.lines.length) {
        var key = width + '|' + wfont + '|' + C.startTokens + '|' + C.lines.length;
        if (key !== h0Key || C !== h0C) { h0 = layout(C.sym0, width, false); h0Key = key; h0C = C; }
        hk = layout(segs, width, true);
      } else { chips = []; paraBoxes = []; pairs = []; LM = metrics(width); h0 = 160; }
      var hNeed = Math.min(MAX_H, Math.max(160, hk));
      if (hNeed !== curH) { curH = hNeed; wrap.style.height = (hNeed + 2 * edge) + 'px'; }
      // The canvas itself keeps the height of the longest (all-characters) text and the box clips it, so a merge
      // only changes the box height and never re-allocates the big pixel buffer.
      var ch = Math.min(MAX_H, Math.max(160, h0, hk));
      var nd = Math.min(window.devicePixelRatio || 1, 3, Math.sqrt(MAX_PX / (width * ch)));
      if (ch !== canH || Math.abs(nd - dpr) > 1e-3 || width !== W) {
        canH = ch; dpr = nd;
        canvas.style.height = ch + 'px';
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(ch * dpr);
      }
      W = width; H = hNeed;
      if (selTok !== null && (cursor < 0 || cursor >= chips.length || chips[cursor].tok !== selTok)) {
        cursor = -1;
        for (var i = 0; i < chips.length; i++) if (chips[i].tok === selTok) { cursor = i; break; }
      }
      return true;
    }
    function rr(x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      g.beginPath();
      g.moveTo(x + r, y);
      g.arcTo(x + w, y, x + w, y + h, r);
      g.arcTo(x + w, y + h, x, y + h, r);
      g.arcTo(x, y + h, x, y, r);
      g.arcTo(x, y, x + w, y, r);
      g.closePath();
    }
    function draw() {
      if (!W || !H) return;
      var t = theme, m = LM;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.globalAlpha = 1;
      g.fillStyle = t.surface;
      g.fillRect(0, 0, W, H); // below H the box clips the canvas; every draw repaints all of 0..H
      if (!C.lines.length) {
        g.fillStyle = t.muted; g.font = fontStr(14); g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('Type some training text to start.', W / 2, H / 2);
        return;
      }
      var limit = H - m.pad;
      // language stripes + tags
      g.font = fontStr(m.tfs, 700); g.textAlign = 'center'; g.textBaseline = 'middle';
      paraBoxes.forEach(function (p) {
        if (p.top > limit) return;
        var col = t.lang[p.lang] || t.muted;
        g.fillStyle = col; rr(m.pad, p.top, m.stripe, Math.min(p.bottom, limit) - p.top, 1.5); g.fill();
        g.fillStyle = t.langSoft[p.lang] || t.surface2; rr(p.tagX, p.top + 4, p.tagW, m.h - 8, (m.h - 8) / 2); g.fill();
        g.fillStyle = col; g.fillText(LANG[p.lang] ? LANG[p.lang].tag : '··', p.tagX + p.tagW / 2, p.top + m.h / 2 + 0.5);
      });
      // token chips
      var dim = selTok !== null;
      g.font = fontStr(m.fs); g.textAlign = 'left'; g.textBaseline = 'middle';
      var spW = textW(SP), i, c;
      for (i = 0; i < chips.length; i++) {
        c = chips[i];
        if (c.y + c.h > limit + 1) break;
        var on = !dim || c.tok === selTok, a = on ? 1 : 0.28, col = chipColor(c.tok);
        g.globalAlpha = a;
        rr(c.x + 0.5, c.y + 0.5, c.w - 1, c.h - 1, 4);
        g.fillStyle = col.fill; g.fill();
        if (!dim && c.tok === justTok) { g.globalAlpha = 0.5; g.fillStyle = t.haldi; g.fill(); g.globalAlpha = a; }
        g.lineWidth = 1; g.strokeStyle = col.edge; g.stroke();
        var tx = c.x + m.px, ty = c.y + c.h / 2 + 0.5, rest = c.tok;
        if (rest.charAt(0) === SP) { g.fillStyle = t.muted; g.fillText(SP, tx, ty); tx += spW; rest = rest.slice(1); }
        if (rest) { g.fillStyle = t.ink; g.fillText(rest, tx, ty); }
      }
      g.globalAlpha = 1;
      // the pair that the next merge will glue (yellow)
      g.strokeStyle = t.haldi; g.lineWidth = 2.25;
      pairs.forEach(function (pi) {
        var p = chips[pi], q = chips[pi + 1];
        if (!p || !q || q.y + q.h > limit + 1) return;
        if (p.y === q.y) { rr(p.x - 2, p.y - 2, q.x + q.w - p.x + 4, p.h + 4, 6); g.stroke(); }
        else { rr(p.x - 2, p.y - 2, p.w + 4, p.h + 4, 6); g.stroke(); rr(q.x - 2, q.y - 2, q.w + 4, q.h + 4, 6); g.stroke(); }
      });
      // selected token: every place it occurs
      if (dim) {
        g.strokeStyle = t.ink; g.lineWidth = 2;
        for (i = 0; i < chips.length; i++) {
          c = chips[i];
          if (c.y + c.h > limit + 1) break;
          if (c.tok === selTok) { rr(c.x - 1, c.y - 1, c.w + 2, c.h + 2, 5); g.stroke(); }
        }
      }
      if (hover >= 0 && chips[hover] && hover !== cursor) {
        c = chips[hover];
        g.strokeStyle = t.muted; g.lineWidth = 1.5; rr(c.x - 1, c.y - 1, c.w + 2, c.h + 2, 5); g.stroke();
      }
      if (focused && cursor >= 0 && chips[cursor]) {
        c = chips[cursor];
        g.setLineDash([3, 3]); g.strokeStyle = t.ink; g.lineWidth = 1.5;
        rr(c.x - 4, c.y - 4, c.w + 8, c.h + 8, 7); g.stroke(); g.setLineDash([]);
      }
      if (chips.length && chips[chips.length - 1].y + chips[chips.length - 1].h > limit + 1) {
        g.fillStyle = t.muted; g.font = fontStr(12); g.textAlign = 'right'; g.textBaseline = 'bottom';
        g.fillText('… (the rest of the text is not drawn)', W - m.pad, H - 2);
      }
    }
    function frame(ts) {
      raf = 0;
      if (!alive) return;
      // scroll the merge list here, before any DOM writes, while the layout from the last frame is still valid
      if (pendingScroll === 2) { pendingScroll = 0; mlist.scrollTop = mlist.scrollHeight; }
      if (anim && (!anim.last || ts - anim.last >= STEP_MS)) {
        anim.last = ts;
        if (k < anim.target && k < C.merges.length) setK(k + 1, true);
        if (k >= anim.target || k >= C.merges.length) anim = null;
      }
      if (needLayout) layoutAll();
      draw();
      if (pendingScroll === 1) pendingScroll = 2;
      if (anim || pendingScroll) requestDraw();
    }
    function requestDraw() { if (!raf && alive) raf = requestAnimationFrame(frame); }
    function relayout() { needLayout = true; requestDraw(); }

    /* ---------- pointer + keyboard ---------- */
    function local(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function chipAt(p, reach) { // the chip under the point, or (for a finger) the nearest one within reach px
      var best = -1, bestD = Infinity, lim = H - (LM ? LM.pad : 0) + 1;
      for (var i = 0; i < chips.length; i++) {
        var c = chips[i];
        if (c.y + c.h > lim) break;
        var dx = p.x < c.x ? c.x - p.x : p.x > c.x + c.w ? p.x - c.x - c.w : 0;
        var dy = p.y < c.y ? c.y - p.y : p.y > c.y + c.h ? p.y - c.y - c.h : 0;
        var d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; best = i; if (!d) break; }
      }
      var r = Math.max(2.5, reach || 0);
      return bestD <= r * r ? best : -1;
    }
    var down = null;
    function onDown(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      down = { x: e.clientX, y: e.clientY, id: e.pointerId, touch: e.pointerType !== 'mouse' };
    }
    function onUp(e) {
      if (!down || down.id !== e.pointerId) return;
      var dx = e.clientX - down.x, dy = e.clientY - down.y, touch = down.touch;
      down = null;
      if (dx * dx + dy * dy > 100) return; // a scroll or drag, not a tap
      var i = chipAt(local(e), touch ? 12 : 2.5);
      if (i < 0) { if (selTok !== null) select(null); return; }
      if (chips[i].tok === selTok) select(null); else select(chips[i].tok, i);
    }
    function onCancel() { down = null; }
    function onMove(e) {
      if (e.pointerType !== 'mouse') return;
      var i = chipAt(local(e), 2.5);
      if (i !== hover) { hover = i; canvas.style.cursor = i >= 0 ? 'pointer' : 'default'; requestDraw(); }
    }
    function onLeave() { if (hover !== -1) { hover = -1; canvas.style.cursor = 'default'; requestDraw(); } }
    function rowNeighbour(i, dir) {
      if (i < 0) return 0;
      var c = chips[i], cx = c.x + c.w / 2, ty = null, j, best = i, bestD = Infinity;
      if (dir > 0) { for (j = i + 1; j < chips.length; j++) if (chips[j].y > c.y + 1) { ty = chips[j].y; break; } }
      else { for (j = i - 1; j >= 0; j--) if (chips[j].y < c.y - 1) { ty = chips[j].y; break; } }
      if (ty === null) return i;
      for (j = 0; j < chips.length; j++) {
        if (Math.abs(chips[j].y - ty) > 1) continue;
        var d = Math.abs(chips[j].x + chips[j].w / 2 - cx);
        if (d < bestD) { bestD = d; best = j; }
      }
      return best;
    }
    function onKey(e) {
      var n = chips.length, i = cursor;
      if (!n) return;
      if (e.key === 'ArrowRight') i = i < 0 ? 0 : Math.min(n - 1, i + 1);
      else if (e.key === 'ArrowLeft') i = i < 0 ? 0 : Math.max(0, i - 1);
      else if (e.key === 'ArrowDown') i = rowNeighbour(i, 1);
      else if (e.key === 'ArrowUp') i = rowNeighbour(i, -1);
      else if (e.key === 'Home') i = 0;
      else if (e.key === 'End') i = n - 1;
      else if (e.key === 'Escape') { if (selTok !== null) { e.preventDefault(); select(null); } return; }
      else return;
      e.preventDefault();
      if (chips[i].y + chips[i].h > H - LM.pad + 1) return;
      select(chips[i].tok, i);
    }
    function onFocus() {
      var fv = true;
      try { fv = canvas.matches(':focus-visible'); } catch (err) { /* older browser */ }
      focused = fv;
      if (fv) { wrap.style.outline = '3px solid var(--haldi)'; wrap.style.outlineOffset = '2px'; }
      requestDraw();
    }
    function onBlur() { focused = false; wrap.style.outline = ''; wrap.style.outlineOffset = ''; requestDraw(); }
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onCancel);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('keydown', onKey);
    canvas.addEventListener('focus', onFocus);
    canvas.addEventListener('blur', onBlur);

    /* ---------- controls ---------- */
    bOnce.addEventListener('click', function () { mergeBy(1); });
    bTen.addEventListener('click', function () { mergeBy(10); });
    bReset.addEventListener('click', function () { stopAnim(); setK(0, false); select(null); mlist.scrollTop = 0; });
    vocabIn.addEventListener('input', function () {
      stopAnim();
      var nk = kForVocab(+vocabIn.value);
      if (nk !== k) setK(nk, true); else vocabIn.value = String(C.vocabAt[k]);
    });
    corpusTa.addEventListener('input', onCorpusInput);
    tryTa.addEventListener('input', onTryInput);

    // one-column layout (phones): merge buttons and the "next merge" line go above the picture, so the text
    // you are changing sits right under your finger and the buttons never move while you tap
    var mqNarrow = window.matchMedia ? window.matchMedia('(max-width: 820px)') : null;
    function place() {
      var narrow = !!(mqNarrow && mqNarrow.matches);
      if (narrow && trainBox.parentNode !== left) { left.insertBefore(trainBox, wrap); left.insertBefore(info, wrap); }
      else if (!narrow && trainBox.parentNode !== controls) { controls.insertBefore(trainBox, controls.firstChild); left.insertBefore(info, legend.nextSibling); }
      info.style.minHeight = narrow ? '5.3em' : '';
    }
    function onNarrow() { place(); relayout(); }
    if (mqNarrow) { if (mqNarrow.addEventListener) mqNarrow.addEventListener('change', onNarrow); else if (mqNarrow.addListener) mqNarrow.addListener(onNarrow); }

    /* ---------- theme, fonts, resize ---------- */
    function onTheme() {
      if (!alive) return;
      var nt = readTheme();
      if (theme && nt.key === theme.key) return; // the site sets data-theme and fires 'themechange': rebuild once
      theme = nt;
      buildRows();
      update();
    }
    var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mq) { if (mq.addEventListener) mq.addEventListener('change', onTheme); else if (mq.addListener) mq.addListener(onTheme); }
    document.addEventListener('themechange', onTheme);
    var mo = null;
    if (window.MutationObserver) {
      mo = new MutationObserver(onTheme);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    }
    function onFonts() { if (!alive) return; wcache = new Map(); wfont = ''; relayout(); }
    var fonts = document.fonts && document.fonts.addEventListener ? document.fonts : null;
    if (fonts) fonts.addEventListener('loadingdone', onFonts);
    function onStatsWidth() {
      var narrowStats = left.getBoundingClientRect().width < 520;
      stats.style.gridTemplateColumns = narrowStats ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))';
    }
    var lastW = -1;
    function onResize(entries) {
      // only the width matters (the height is ours); reading it here means drawing never forces a layout
      var e = entries && entries[0], w = e && e.contentRect ? e.contentRect.width : wrap.clientWidth;
      if (Math.abs(w - lastW) < 0.5) return;
      lastW = w;
      edge = wrap.clientTop || 0; // border width (layout is fresh inside the observer)
      onStatsWidth();
      relayout(); // runs in the next animation frame, never inside the observer callback
    }
    var ro = null;
    function onWinResize() { onResize(null); }
    if (window.ResizeObserver) { ro = new ResizeObserver(onResize); ro.observe(wrap); }
    else window.addEventListener('resize', onWinResize);

    place();
    buildFert();
    buildRows();
    update();
    onStatsWidth();

    return {
      destroy: function () {
        alive = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0; anim = null;
        if (corpusTimer) clearTimeout(corpusTimer);
        corpusTimer = 0;
        canvas.removeEventListener('pointerdown', onDown);
        canvas.removeEventListener('pointerup', onUp);
        canvas.removeEventListener('pointercancel', onCancel);
        canvas.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerleave', onLeave);
        canvas.removeEventListener('keydown', onKey);
        canvas.removeEventListener('focus', onFocus);
        canvas.removeEventListener('blur', onBlur);
        mlist.removeEventListener('click', onListClick);
        corpusTa.removeEventListener('input', onCorpusInput);
        tryTa.removeEventListener('input', onTryInput);
        if (mq) { if (mq.removeEventListener) mq.removeEventListener('change', onTheme); else if (mq.removeListener) mq.removeListener(onTheme); }
        if (mqNarrow) { if (mqNarrow.removeEventListener) mqNarrow.removeEventListener('change', onNarrow); else if (mqNarrow.removeListener) mqNarrow.removeListener(onNarrow); }
        document.removeEventListener('themechange', onTheme);
        if (mo) mo.disconnect();
        if (fonts) fonts.removeEventListener('loadingdone', onFonts);
        if (ro) ro.disconnect(); else window.removeEventListener('resize', onWinResize);
        root.innerHTML = '';
      }
    };
  }

  Labs['tokenizer'] = {
    id: 'tokenizer',
    module: 'l3-transformers',
    title: 'Tokenizer (BPE) lab',
    summary: 'Train a tiny Byte-Pair Encoding tokenizer on English, Hindi and Hinglish text, merge by merge, and see why Hindi often needs more tokens per word.',
    tasks: TASKS.map(function (t) { return { id: t.id, text: t.text }; }),
    mount: mount
  };
})();
