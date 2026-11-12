/* AI Marg: Hinglish writings & neural/phonetic speech engine.
   Provides:
   1. Per-card and page-wide English <-> Hinglish text toggling (next to every Listen button).
   2. AI-powered conversational Hinglish rewriting via /api/hinglish (CampusX / Krish Naik style) with persistent localStorage caching + instant local fallback.
   3. Smooth Hinglish speech preparation that avoids choppy word-by-word voice switching.
   Exposes window.AIM_HINGLISH. */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- Persistent Client Cache for AI Hinglish Rewrites ---------- */
  var CACHE_KEY = 'aimarg.hl.cache.v2';
  var aiCache = {};
  try {
    aiCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') || {};
  } catch (e) {
    aiCache = {};
  }
  var saveTimer = null;
  function saveAiCache() {
    if (saveTimer) return;
    saveTimer = setTimeout(function () {
      saveTimer = null;
      try {
        var keys = Object.keys(aiCache);
        if (keys.length > 600) {
          keys.slice(0, keys.length - 500).forEach(function (k) { delete aiCache[k]; });
        }
        localStorage.setItem(CACHE_KEY, JSON.stringify(aiCache));
      } catch (e) {}
    }, 600);
  }

  /* ---------- Exact UI / Heading / Structural Overrides ---------- */
  var EXACT_MAP = {
    'The big idea': 'The big idea · Asli mudda',
    'You will be able to': 'You will be able to · Aap yeh seekh jaoge',
    'Study plan': 'Study plan · Padhne ka sahi tarika',
    'Key terms': 'Key terms · Zaroori technical shabd',
    'In India': 'In India · Bharat ke examples',
    'Common mistakes': 'Common mistakes · Aam galtiyan jo log karte hain',
    'Check yourself (open tasks)': 'Check yourself · Khud ko test karo',
    'Topics covered': 'Topics covered · Is module ke topics',
    'The brief': 'The brief · Project ka asli mudda',
    'Data': 'Data · Dataset',
    'Milestones': 'Milestones · Project ke padav',
    'Rubric: grade yourself honestly': 'Rubric · Apne kaam ko imaandari se jaancho',
    'Stretch goals': 'Stretch goals · Extra chunauti',
    'Pitfalls to avoid': 'Pitfalls to avoid · In galtiyon se bacho',
    'Deliverables': 'Deliverables · Kya submit karna hai',
    'Skills you will use': 'Skills you will use · Kaunse skills kaam aayenge',
    'Learn first': 'Learn first · Pehle yeh modules padho',
    'Frequently asked questions': 'Frequently asked questions · Aksar poochhe jaane wale sawal',
    'What you get': 'What you get · Aapko is course mein kya milega',
    'How each module works': 'How each module works · Har module kaise kaam karta hai',
    'Your checklist': 'Your checklist · Aapki checklist',
    'Best pick': 'Best pick · Sabse behtar video lecture',
    'Other options': 'Other options · Aur ache vikalp',
    'Review your answers': 'Review your answers · Apne jawab aur explanations dekho',
    'What does it mean?': 'Iska kya matlab hota hai?',
    'Lessons & exercises completion': 'Lessons aur exercises ka completion chart'
  };

  /* ---------- Instant Clause & Phrase Rules (Used Immediately While AI Refines) ---------- */
  var PHRASE_RULES = [
    ['Think of it like:', 'Isko aise samjho:'],
    ['Why it matters:', 'Yeh kyun zaroori hai:'],
    ['Why build this:', 'Yeh project kyun banana chahiye:'],
    ['Before this:', 'Isse pehle yeh aana chahiye:'],
    ['Free tools (₹0):', 'Bilkul free tools (₹0):'],
    ['What this means:', 'Iska seedha matlab hai:'],
    ['Try now:', 'Abhi khud try karo:'],
    ['About the evidence:', 'Research kya kehti hai:'],
    ['How sure are you? (optional)', 'Apne jawab par kitna bharosa hai? (optional)'],
    ['How well did you remember?', 'Aapko kitna acche se yaad raha?'],
    ['Explain it simply', 'Aasaan bhasha mein samjhao'],
    ['Question it, step by step', 'Sawal poochho, ek-ek step karke'],
    ['Repeat the key terms', 'Zaroori shabdon ko bina dekhe yaad karo'],
    ['This module explains', 'Is module mein hum samjhenge'],
    ['with no code and no maths', 'bina kisi code aur bina maths ke'],
    ['Think of a ', 'Maano ek '],
    ['Think of an ', 'Maano ek '],
    ['Think of ', 'Zara socho '],
    ['works the same way', 'bilkul isi tarah kaam karta hai'],
    ['work the same way', 'bilkul isi tarah kaam karte hain'],
    ['In normal programming', 'Normal programming mein'],
    ['In machine learning', 'Machine learning mein'],
    ['In deep learning', 'Deep learning mein'],
    ['In this module', 'Is module mein'],
    ['In this level', 'Is level mein'],
    ['In this lab', 'Is lab mein'],
    ['In this project', 'Is project mein'],
    ['In this exercise', 'Is exercise mein'],
    ['In plain words', 'Seedhe-saade shabdon mein'],
    ['in plain words', 'seedhe-saade shabdon mein'],
    ['In plain English', 'Aasaan bhasha mein'],
    ['in plain English', 'aasaan bhasha mein'],
    ['In simple words', 'Aasaan shabdon mein'],
    ['in simple words', 'aasaan shabdon mein'],
    ['By the end of this', 'Iske aakhir tak'],
    ['for example', 'jaise ki'],
    ['For example', 'Jaise ki'],
    ['such as', 'jaise ki'],
    ['Such as', 'Jaise ki'],
    ['as well as', 'aur saath hi'],
    ['instead of', 'ke bajaye'],
    ['Instead of', 'Ke bajaye'],
    ['because of', 'ki wajah se'],
    ['Because of', 'Ki wajah se'],
    ['so that', 'taaki'],
    ['So that', 'Taaki'],
    ['even if', 'chahe'],
    ['Even if', 'Chahe'],
    ['even though', 'halanki'],
    ['Even though', 'Halanki'],
    ['as soon as', 'jaise hi'],
    ['at least', 'kam se kam'],
    ['At least', 'Kam se kam'],
    ['at most', 'zyada se zyada'],
    ['At most', 'Zyada se zyada'],
    ['more than', 'se zyada'],
    ['less than', 'se kam'],
    ['fewer than', 'se kam'],
    ['step by step', 'step-by-step (ek-ek kadam karke)'],
    ['Step by step', 'Step-by-step (ek-ek kadam karke)'],
    ['line by line', 'ek-ek line karke'],
    ['one by one', 'ek-ek karke'],
    ['on your own', 'khud se'],
    ['on its own', 'apne aap'],
    ['by itself', 'apne aap'],
    ['in your own words', 'apne shabdon mein'],
    ['in your browser', 'seedha aapke browser mein'],
    ['in the browser', 'browser ke andar'],
    ['right answers', 'sahi jawab'],
    ['correct answer', 'sahi jawab'],
    ['wrong answer', 'galat jawab'],
    ['First,', 'Sabse pehle,'],
    ['Second,', 'Doosra,'],
    ['Third,', 'Teesra,'],
    ['Finally,', 'Aakhir mein,'],
    ['However,', 'Lekin,'],
    ['Therefore,', 'Isliye,'],
    ['Otherwise,', 'Warna,'],
    ['Remember that', 'Hamesha dhyan rakho ki'],
    ['Remember:', 'Yaad rakho:'],
    ['Keep in mind', 'Dhyan mein rakho'],
    ['Make sure', 'Pakka karo ki'],
    ['make sure', 'pakka karo ki'],
    ['Be careful', 'Savdhaan raho'],
    ['You will learn', 'Aap seekhoge'],
    ['you will learn', 'aap seekhoge'],
    ['You will see', 'Aap dekhoge'],
    ['you will see', 'aap dekhoge'],
    ['You can use', 'Aap use kar sakte ho'],
    ['you can use', 'aap use kar sakte ho'],
    ['You can', 'Aap kar sakte ho'],
    ['you can', 'aap kar sakte ho'],
    ['You need to', 'Aapko zaroorat hai'],
    ['you need to', 'aapko zaroorat hai'],
    ['we need to', 'humein zaroorat hai'],
    ['We need to', 'Humein zaroorat hai'],
    ['is called a ', 'ko kehte hain ek '],
    ['is called an ', 'ko kehte hain ek '],
    ['is called ', 'ko kehte hain '],
    ['are called ', 'ko kehte hain '],
    ['means that', 'ka matlab hai ki'],
    ['which means', 'jiska matlab hai'],
    ['That is why', 'Isi liye'],
    ['that is why', 'isi liye'],
    ['This means', 'Iska matlab hai'],
    ['this means', 'iska matlab hai'],
    ['When you ', 'Jab aap '],
    ['when you ', 'jab aap '],
    ['If you ', 'Agar aap '],
    ['if you ', 'agar aap '],
    ['from scratch', 'bilkul shuruat (scratch) se'],
    ['every day', 'har roz'],
    ['a lot of', 'bahut saara'],
    ['most of', 'zyadatar'],
    ['Most of', 'Zyadatar']
  ];

  function matchCase(src, replacement) {
    if (!src || !replacement) return replacement;
    if (src.charAt(0) === src.charAt(0).toUpperCase() && src.charAt(0) !== src.charAt(0).toLowerCase()) {
      return replacement.charAt(0).toUpperCase() + replacement.slice(1);
    }
    return replacement;
  }

  // Instant synchronous Hinglish converter (checks AI cache first, otherwise applies clean phrase rules)
  function toHinglish(str) {
    if (!str || typeof str !== 'string') return str;
    var trimmed = str.trim();
    if (!trimmed || !/[A-Za-z]/.test(trimmed)) return str;
    if (EXACT_MAP[trimmed]) {
      return str.replace(trimmed, EXACT_MAP[trimmed]);
    }
    if (aiCache[trimmed]) {
      return str.replace(trimmed, aiCache[trimmed]);
    }

    var saved = [];
    var s = str.replace(/\(([\u0900-\u097F][^)]*)\)|https?:\/\/\S+|\b[A-Za-z0-9_]+\([^)]*\)|\b[A-Za-z_][A-Za-z0-9_]*\.[A-Za-z0-9_]+\b/g, function (m) {
      saved.push(m);
      return '\u0001' + (saved.length - 1) + '\u0001';
    });

    for (var i = 0; i < PHRASE_RULES.length; i++) {
      var pat = PHRASE_RULES[i][0], rep = PHRASE_RULES[i][1];
      var escaped = pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var leadBoundary = /^[A-Za-z0-9]/.test(pat) ? '\\b' : '';
      var trailBoundary = /[A-Za-z0-9]$/.test(pat) ? '\\b' : '';
      var rx = new RegExp(leadBoundary + escaped + trailBoundary, 'gi');
      s = s.replace(rx, function (m) { return matchCase(m, rep); });
    }

    s = s.replace(/\u0001(\d+)\u0001/g, function (_, idx) { return saved[Number(idx)]; });
    return s;
  }

  /* ---------- Speech Preparation (No Word-by-Word Voice Chopping!) ---------- */
  // Importantly, we do NOT convert scattered words to Devanagari mid-sentence because that would cause
  // browser speech synthesis to split a single sentence into 10+ alternating voice utterances.
  function prepareSpeech(text, isHinglish) {
    if (!text) return '';
    var s = String(text);
    // Clean decorative UI separators so TTS reads smoothly
    s = s.replace(/\s*·\s*/g, ', ');
    return s;
  }

  /* ---------- DOM Text-Node Toggling & Async AI Refinement ---------- */
  var SKIP_SEL = 'button, input, select, textarea, nav, svg, pre, code, script, style, noscript, iframe, canvas, video, audio, ' +
    '.visually-hidden, .tts-skip, .hl-skip, .read-foot, .read-progress, .crumbs, .tabs, .site-head, .prog-strip, footer, .toasts, ' +
    '#fc-chip, .tts-bar, [aria-hidden="true"], .q-sure, .bar, #mod-side, .editor, .console, .term-hi, .ex-hi, [lang="sa"]';

  function collectTextNodes(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || !/[A-Za-z]/.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
        var p = n.parentElement;
        if (!p || p.closest(SKIP_SEL)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    for (var n; (n = walker.nextNode());) nodes.push(n);
    return nodes;
  }

  function transformElement(root, toHl, onRefined) {
    if (!root) return;
    var nodes = collectTextNodes(root);
    var toFetchNodes = [];
    var toFetchStrings = [];

    nodes.forEach(function (node) {
      if (toHl) {
        if (node._enText === undefined) node._enText = node.nodeValue;
        var enTrimmed = node._enText.trim();
        // Immediate local or cached conversion
        node.nodeValue = toHinglish(node._enText);
        // Queue for Gemini AI conversational Hinglish refinement if not yet cached and has meaningful prose
        if (enTrimmed.length >= 12 && !EXACT_MAP[enTrimmed] && !aiCache[enTrimmed]) {
          toFetchNodes.push(node);
          toFetchStrings.push(enTrimmed);
        }
      } else if (node._enText !== undefined) {
        node.nodeValue = node._enText;
      }
    });

    if (!toHl || !toFetchStrings.length) {
      if (onRefined) onRefined(false);
      return;
    }

    // Batch in chunks of 30 strings to /api/hinglish
    var batchNodes = toFetchNodes.slice(0, 35);
    var batchTexts = toFetchStrings.slice(0, 35);

    fetch('/api/hinglish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: batchTexts })
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !Array.isArray(data.translations)) {
          if (onRefined) onRefined(false);
          return;
        }
        var updatedAny = false;
        batchNodes.forEach(function (node, i) {
          var tr = data.translations[i];
          var origTrimmed = batchTexts[i];
          if (tr && origTrimmed) {
            aiCache[origTrimmed] = tr;
            if (node.isConnected && isCardHinglish(node.parentElement) && node._enText) {
              node.nodeValue = node._enText.replace(origTrimmed, tr);
              updatedAny = true;
            }
          }
        });
        if (updatedAny) saveAiCache();
        if (onRefined) onRefined(updatedAny);
      })
      .catch(function () {
        if (onRefined) onRefined(false);
      });
  }

  function setCardMode(root, on) {
    if (!root) return;
    if (on) root.setAttribute('data-hl-on', '1');
    else root.removeAttribute('data-hl-on');
    root.classList.toggle('is-hinglish', !!on);
    syncButtonsIn(root, !!on, !!on);
    transformElement(root, !!on, function (updated) {
      syncButtonsIn(root, root.getAttribute('data-hl-on') === '1', false);
      if (updated && window.AIM_SPEAK && window.AIM_SPEAK.isPlaying && window.AIM_SPEAK.isPlaying()) {
        if (typeof window.AIM_SPEAK.refreshCurrent === 'function') {
          window.AIM_SPEAK.refreshCurrent();
        }
      }
    });
  }

  function isCardHinglish(el) {
    if (!el) return false;
    var box = el.closest ? el.closest('[data-hl-on="1"]') : null;
    return !!box;
  }

  function syncButtonsIn(root, on, loading) {
    var btns = [];
    if (root.matches && root.matches('[data-hl-root]')) btns.push(root);
    if (root.querySelectorAll) {
      Array.prototype.forEach.call(root.querySelectorAll('[data-hl-root]'), function (b) {
        var target = resolveRoot(b);
        if (target === root) btns.push(b);
      });
    }
    if (root.id === 'main') {
      var headBtn = document.querySelector('.site-head [data-hl-root="main"]');
      if (headBtn) btns.push(headBtn);
    }
    btns.forEach(function (b) {
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
      var lbl = b.querySelector('.hl-lbl');
      if (lbl) {
        var customAll = b.getAttribute('data-hl-all');
        if (loading && on) {
          lbl.textContent = 'Hinglish…';
        } else {
          lbl.textContent = customAll ? (on ? 'English (all)' : 'Hinglish (all)') : (on ? 'Hinglish ✓' : 'Hinglish');
        }
      }
    });
  }

  function resolveRoot(btn) {
    var sel = btn.getAttribute('data-hl-root');
    if (!sel || sel === 'main') return document.getElementById('main');
    var root = btn.closest(sel) || document.querySelector('#main ' + sel);
    var inner = btn.getAttribute('data-hl-in');
    if (root && inner) root = root.querySelector(inner) || root;
    return root;
  }

  function btn(rootSel, label, o) {
    o = o || {};
    var isAll = rootSel === '.read-cards' || rootSel === 'main';
    var txt = o.hlText || (isAll && rootSel === '.read-cards' ? 'Hinglish (all)' : 'Hinglish');
    return '<button type="button" class="btn btn-sm btn-ghost hl-btn' + (o.icon ? ' hl-icon' : '') + '" data-hl-root="' + esc(rootSel) + '"' +
      (o.within ? ' data-hl-in="' + esc(o.within) + '"' : '') +
      (isAll && rootSel === '.read-cards' ? ' data-hl-all="1"' : '') +
      ' aria-pressed="false" aria-label="Toggle Hinglish: ' + esc(label || 'this card') + '" title="Switch between English and natural Hinglish">' +
      '<span class="hl-badge" aria-hidden="true">अ/A</span>' +
      (o.icon ? '' : '<span class="hl-lbl">' + esc(txt) + '</span>') + '</button>';
  }

  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('[data-hl-root]');
    if (!b) return;
    ev.preventDefault();
    var root = resolveRoot(b);
    if (!root) return;
    var nextOn = root.getAttribute('data-hl-on') !== '1';
    setCardMode(root, nextOn);
    Array.prototype.forEach.call(root.querySelectorAll('.read-card, .gloss-term, .card, section[id^="sec-"], .quiz, .ex, .lab, details.fold, details.rf-check, .lm-card'), function (sub) {
      if (nextOn) sub.setAttribute('data-hl-on', '1');
      else sub.removeAttribute('data-hl-on');
      sub.classList.toggle('is-hinglish', nextOn);
      syncButtonsIn(sub, nextOn, false);
    });
    if (window.AIM_SPEAK && window.AIM_SPEAK.isPlaying && window.AIM_SPEAK.isPlaying()) {
      if (typeof window.AIM_SPEAK.refreshCurrent === 'function') {
        window.AIM_SPEAK.refreshCurrent();
      }
    }
  });

  var mainEl = document.getElementById('main');
  if (mainEl && window.MutationObserver) {
    var mo = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        Array.prototype.forEach.call(m.addedNodes || [], function (node) {
          if (!node || node.nodeType !== 1) return;
          var activeBox = node.closest && node.closest('[data-hl-on="1"]');
          if (activeBox) {
            transformElement(node, true);
          }
          autoInjectTools(node);
        });
      });
    });
    mo.observe(mainEl, { childList: true, subtree: true });
  }

  function autoInjectTools(scope) {
    if (!scope || !scope.querySelectorAll) return;
    var SPK = window.AIM_SPEAK;
    if (!SPK || typeof SPK.btn !== 'function') return;

    var labs = scope.matches && scope.matches('.lab') ? [scope] : Array.prototype.slice.call(scope.querySelectorAll('.lab'));
    labs.forEach(function (lab) {
      if (lab.querySelector('.lab-hl-bar')) return;
      var bar = document.createElement('div');
      bar.className = 'row-between lab-hl-bar tts-skip';
      bar.innerHTML = '<span class="small muted">Interactive lab instructions & tasks</span><span class="read-tools">' +
        SPK.btn('.lab', 'Listen to this lab') + '</span>';
      lab.insertBefore(bar, lab.firstChild);
    });

    var studyCards = Array.prototype.slice.call(scope.querySelectorAll('.lm-card, .rv-card, details.rf-check > .rf-check-body'));
    studyCards.forEach(function (card) {
      if (card.querySelector('[data-hl-root]')) return;
      var sel = card.classList.contains('lm-card') ? '.lm-card' : card.classList.contains('rv-card') ? '.rv-card' : '.rf-check-body';
      var toolWrap = document.createElement('div');
      toolWrap.className = 'row tts-skip hl-card-tools';
      toolWrap.innerHTML = SPK.btn(sel, 'Listen to this card');
      var head = card.querySelector('h2, h3, h4');
      if (head && head.parentNode === card) head.insertAdjacentElement('afterend', toolWrap);
      else card.insertBefore(toolWrap, card.firstChild);
    });
  }

  window.AIM_HINGLISH = {
    toHinglish: toHinglish,
    prepareSpeech: prepareSpeech,
    btn: btn,
    setCardMode: setCardMode,
    isCardHinglish: isCardHinglish,
    autoInjectTools: autoInjectTools
  };
})();
