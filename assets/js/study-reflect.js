/* AI Marg study feature: Lesson-card recall and Why questions, Recall mode, the module Reflect tab (Feynman, Manana, Japa, Nididhyasana) and Sravana on the Watch tab.
   Uses window.AIM_STUDY (assets/js/study.js) and window.AIM_APP (assets/js/app.js). */
(function () {
  'use strict';
  var ST = window.AIM_STUDY; if (!ST) return; // study features are switched off in this browser
  var C = window.AIM_CORE, esc = C.esc, inline = C.inline;
  var APP = function () { return window.AIM_APP; };
  // app.js draws the first page just before it publishes AIM_APP: wait for it (one microtask is enough)
  function withApp(fn) { if (window.AIM_APP) { fn(); return; } Promise.resolve().then(function () { if (window.AIM_APP) fn(); }); }
  function dataReady() { return !!(window.AIM && window.AIM.study); }
  function reduced() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function focusEl(el) { if (!el) return; try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }
  function fmtDay(d) { try { return new Date(d + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); } catch (e) { return d; } }
  var HOW = '<a href="#methods">How and why this works</a>';
  function methodLine(name) { return '<p class="small rf-method"><span class="muted">Method:</span> ' + name + ' · ' + HOW + '</p>'; }

  /* ---------- autosave: debounced writes, flushed when the learner leaves the page or the tab ---------- */
  var pending = {};
  function later(key, fn, ms) {
    var p = pending[key]; if (p) clearTimeout(p.t);
    pending[key] = { fn: fn, t: setTimeout(function () { flush(key); }, ms || 600) };
  }
  function flush(key) { var p = pending[key]; if (!p) return; clearTimeout(p.t); delete pending[key]; try { p.fn(); } catch (e) { if (window.console) console.error(e); } }
  function flushAll() { Object.keys(pending).forEach(flush); }
  window.addEventListener('pagehide', flushAll);
  function flushOnLeave() { var a = APP(); if (a && a.onLeave) a.onLeave(flushAll); }

  /* ---------- reflections: C.state.refl[moduleId] = { feyn, ideas, soc[5], japa, nid, at } ---------- */
  function reflOf(mid) { var r = C.state.refl || {}; return r[mid] || null; }
  function editRefl(mid, fn) {
    var st = C.state; if (!st.refl) st.refl = {};
    var e = st.refl[mid] || { feyn: '', ideas: 0, soc: [], japa: 0, nid: '', at: '' };
    fn(e); e.at = ST.now(); st.refl[mid] = e; C.save();
    return e;
  }

  /* ---------- Feynman check: the cue rule and simple counts ---------- */
  // an idea is covered when the text, lowercased with spaces collapsed, contains at least one of its cues
  function normText(t) { return String(t || '').toLowerCase().replace(/\s+/g, ' '); }
  function ideaHits(fy, text) {
    var t = normText(text);
    return (fy.keyIdeas || []).map(function (k) {
      return (k.cues || []).some(function (c) { c = String(c || '').toLowerCase(); return !!c && t.indexOf(c) >= 0; });
    });
  }
  function reEsc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function jargonIn(fy, text) {
    var t = normText(text);
    return (fy.jargon || []).filter(function (j) {
      var w = normText(j).trim(); if (!w) return false;
      return new RegExp('(^|[^a-z0-9])' + reEsc(w) + '(s|es)?(?![a-z0-9])').test(t);
    });
  }
  var HAS_WORD = /[A-Za-z0-9ऀ-ॿ]/;
  function textStats(text) {
    var s = String(text || '').trim();
    return {
      words: s ? s.split(/\s+/).filter(function (w) { return HAS_WORD.test(w); }).length : 0,
      sentences: s ? s.split(/[.!?।]+(?=\s|$)|\n\s*\n/).filter(function (x) { return HAS_WORD.test(x); }).length : 0
    };
  }
  function sentenceRange(prompt) { var r = /(\d+)\s*(?:-|–|to)\s*(\d+)\s+sentences/i.exec(prompt || ''); return r ? [Number(r[1]), Number(r[2])] : null; }

  /* =====================================================================
     1. Lesson cards: "Check yourself" (active recall + why questions) and Recall mode
     ===================================================================== */
  var GRADES = [[1, 'Again', 'I could not recall it'], [2, 'Hard', 'I got it with effort'], [3, 'Good', 'I recalled it'], [4, 'Easy', 'It came at once']];
  function cardContent(mid, key) { var md = ST.modData(mid); return md && md.cards && md.cards[key] && md.cards[key].recall ? md.cards[key] : null; }
  function checkHTML(m, key, c, open) {
    var id = 'rf-c-' + esc(key), srs = (C.state.srs || {})['rc:' + m.id + ':' + key];
    var ratedToday = !!(srs && !srs.off && srs.reps && srs.last === ST.today()); // rated once today: no second review in the log
    return '<details class="rf-check" data-rf-check="' + esc(key) + '" data-mid="' + esc(m.id) + '"' + (open ? ' open' : '') + '>' +
      '<summary><span class="rf-check-t">Check yourself</span> <span class="small muted">recall and why</span></summary>' +
      '<div class="rf-check-body stack-sm">' +
      '<p class="small muted">Active recall: cover the card and answer from memory, then check. ' + HOW + '</p>' +
      '<p class="rf-q" id="' + id + '-q"><strong>' + inline(c.recall) + '</strong></p>' +
      '<label class="small" for="' + id + '-mine">Your answer (optional, not saved)</label>' +
      '<textarea class="rf-mine" id="' + id + '-mine" rows="2" aria-describedby="' + id + '-q"></textarea>' +
      '<div><button type="button" class="btn btn-sm" data-rf="show" aria-expanded="false" aria-controls="' + id + '-a">Show answer</button></div>' +
      '<div class="rf-ans stack-sm" id="' + id + '-a" hidden>' +
      '<p><span class="rf-tag">Answer</span> ' + inline(c.answer || '') + '</p>' +
      '<div class="rf-rate stack-sm" role="group" aria-labelledby="' + id + '-rl"' + (ratedToday ? ' hidden' : '') + '>' +
      '<p class="small" id="' + id + '-rl"><strong>How well did you remember?</strong> Your rating sets when this question comes back in your reviews.</p>' +
      '<div class="row">' + GRADES.map(function (g) {
        return '<button type="button" class="btn btn-sm rf-grade" data-rf="rate" data-g="' + g[0] + '" aria-describedby="' + id + '-g' + g[0] + '">' + g[1] + '</button><span class="visually-hidden" id="' + id + '-g' + g[0] + '">' + g[2] + '</span>';
      }).join('') + '</div>' +
      '<p class="small muted rf-grade-key">Again: could not recall · Hard: with effort · Good: recalled it · Easy: came at once</p></div>' +
      '<p class="small rf-rated" tabindex="-1"' + (ratedToday ? '><span aria-hidden="true">✓ </span>You rated this today. ' + esc(dueText(srs)) + ' <a href="#study">Study room</a>' : ' hidden>') + '</p></div>' +
      (c.why ? '<div class="rf-why stack-sm"><p><span class="rf-tag">Why?</span> ' + inline(c.why) + '</p>' +
        '<p class="small muted">Elaborative interrogation: think of the reason yourself before you look.</p>' +
        '<div><button type="button" class="btn btn-sm" data-rf="why" aria-expanded="false" aria-controls="' + id + '-w">Show a model answer</button></div>' +
        '<div class="rf-ans" id="' + id + '-w" hidden><p>' + inline(c.whyAnswer || '') + '</p></div></div>' : '') +
      '</div></details>';
  }
  function addCheck(m, key, card, open) {
    var c = cardContent(m.id, key); if (!c) return;
    var body = card.querySelector('.read-body'); if (!body) return;
    var have = body.querySelector('[data-rf-check]');
    if (have) { if (open) have.open = true; return; }
    body.insertAdjacentHTML('beforeend', checkHTML(m, key, c, open));
  }
  function dueText(entry) {
    var n = ST.daysBetween(ST.today(), entry.due);
    if (n <= 0) return 'It comes back in today\'s review.';
    if (n === 1) return 'It comes back for review tomorrow.';
    return 'It comes back for review in ' + n + ' days (on ' + fmtDay(entry.due) + ').';
  }
  // one listener for every lesson-card panel (show answer, rate, why, Recall mode reveal)
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('[data-rf]'); if (!b) return;
    var act = b.getAttribute('data-rf');
    if (act === 'show' || act === 'why' || act === 'reveal') {
      var reg = document.getElementById(b.getAttribute('aria-controls')); if (!reg) return;
      var open = b.getAttribute('aria-expanded') !== 'true';
      reg.hidden = !open; b.setAttribute('aria-expanded', String(open));
      if (act === 'show') b.textContent = open ? 'Hide answer' : 'Show answer';
      else if (act === 'why') b.textContent = open ? 'Hide the model answer' : 'Show a model answer';
      else { b.textContent = open ? 'Hide the card again' : 'Reveal the card'; var cv = b.closest('.rf-cover'); if (cv) cv.classList.toggle('is-open', open); }
    } else if (act === 'rate') {
      var box = b.closest('[data-rf-check]'), g = Number(b.getAttribute('data-g'));
      if (!box || !(g >= 1 && g <= 4)) return;
      var id = 'rc:' + box.getAttribute('data-mid') + ':' + box.getAttribute('data-rf-check');
      ST.enroll([id]);
      var entry = ST.schedule(id, g);
      var rate = box.querySelector('.rf-rate'), done = box.querySelector('.rf-rated');
      if (rate) rate.hidden = true;
      if (done) {
        done.hidden = false;
        done.innerHTML = '<span aria-hidden="true">✓ </span>Saved as <strong>' + esc(GRADES[g - 1][1]) + '</strong>. ' + esc(dueText(entry)) + ' <a href="#study">Study room</a>';
        focusEl(done);
      }
    }
  });

  // Recall mode: a switch above the cards (shown when every card is read) hides each card body behind its recall question
  function allRead(m) { var a = APP(); return a.readCards(m).length > 0 && a.readDone(m) === a.readCards(m).length; }
  function updateRecallSwitch(m, cardsEl) {
    if (!cardsEl || !cardsEl.isConnected) return;
    var bar = cardsEl.querySelector('#rf-recall');
    if (allRead(m)) {
      if (bar) return;
      cardsEl.insertAdjacentHTML('afterbegin', '<div class="rf-recall" id="rf-recall">' +
        '<div class="stack-sm rf-recall-t"><strong>Recall mode</strong><span class="small muted">You have read every card. Switch this on to see each card\'s question first: answer from memory, then reveal the card (active recall, ' + ST.sans('smarana') + '). ' + HOW + '</span></div>' +
        '<button type="button" class="btn btn-sm rf-switch" role="switch" aria-checked="false" id="rf-recall-btn"><span class="rf-track" aria-hidden="true"></span>Recall mode<span class="rf-onoff" aria-hidden="true">Off</span></button>' +
        '<p class="visually-hidden" aria-live="polite" id="rf-recall-live"></p></div>');
      var btn = cardsEl.querySelector('#rf-recall-btn');
      btn.addEventListener('click', function () { setRecall(m, cardsEl, btn.getAttribute('aria-checked') !== 'true'); });
    } else if (bar && bar.querySelector('#rf-recall-btn').getAttribute('aria-checked') !== 'true') bar.remove();
  }
  function setRecall(m, cardsEl, on) {
    var btn = cardsEl.querySelector('#rf-recall-btn'); if (!btn) return;
    btn.setAttribute('aria-checked', String(on));
    btn.querySelector('.rf-onoff').textContent = on ? 'On' : 'Off';
    cardsEl.classList.toggle('rf-recall-on', on);
    APP().readCards(m).forEach(function (c) {
      var card = document.getElementById('read-' + c.key); if (!card) return;
      var body = card.querySelector('.read-body'), cover = card.querySelector('.rf-cover'); if (!body) return;
      if (on) {
        if (!body.id) body.id = 'rf-body-' + c.key;
        var q = cardContent(m.id, c.key);
        if (!cover) {
          body.insertAdjacentHTML('beforebegin', '<div class="rf-cover stack-sm">' +
            '<p class="small muted">Recall first: answer from memory, then reveal the card.</p>' +
            '<p class="rf-q"><strong>' + (q ? inline(q.recall) : 'What do you remember from this card, “' + esc(c.title) + '”?') + '</strong></p>' +
            '<div><button type="button" class="btn btn-sm" data-rf="reveal" aria-expanded="false" aria-controls="' + esc(body.id) + '">Reveal the card</button></div></div>');
        }
        body.hidden = true;
      } else {
        if (cover) cover.remove();
        body.hidden = false;
      }
    });
    var live = cardsEl.querySelector('#rf-recall-live');
    if (live) live.textContent = on ? 'Recall mode is on. Each card shows its question first.' : 'Recall mode is off. Every card is shown in full.';
  }

  ST.on('overview', function (m, el) {
    var cardsEl = el.querySelector('.read-cards'); if (!cardsEl) return;
    var go = function () {
      if (!cardsEl.isConnected) return;
      var a = APP();
      a.readCards(m).forEach(function (c) {
        var card = document.getElementById('read-' + c.key);
        if (card && cardsEl.contains(card) && a.readOn(m.id, c.key)) addCheck(m, c.key, card, false);
      });
      updateRecallSwitch(m, cardsEl);
    };
    withApp(function () { if (dataReady()) go(); else ST.ensureData().then(go, go); });
  });
  ST.on('card-read', function (m, key, on) {
    var card = document.getElementById('read-' + key); if (!card) return;
    var cardsEl = card.closest('.read-cards');
    // drawn before app.js scrolls on to the next card, so the scroll lands in the right place
    var go = function () { if (!card.isConnected) return; if (on) addCheck(m, key, card, true); updateRecallSwitch(m, cardsEl); };
    if (dataReady()) go(); else ST.ensureData().then(go, go);
  });

  /* =====================================================================
     2. Reflect tab: Feynman, Manana ladder, Japa rounds, Nididhyasana
     ===================================================================== */
  ST.setReflect(function (m, el) {
    var md = ST.modData(m.id) || {}, have = !!ST.modData(m.id);
    var fy = md.feynman && md.feynman.prompt && (md.feynman.keyIdeas || []).length ? md.feynman : null;
    var soc = Array.isArray(md.socratic) ? md.socratic.filter(function (s) { return s && s.q; }).slice(0, 5) : [];
    var terms = (m.keyTerms || []).filter(function (t) { return t && t.term; });
    el.innerHTML = '<div class="stack-lg rf">' +
      '<div class="stack-sm"><h2>Reflect</h2><p class="muted prose">Four quiet ways to make this module your own: explain it simply, question it step by step, repeat its key terms, and sit with one question. What you write is saved with the rest of your progress.</p></div>' +
      (have ? '' : '<div class="callout small">Explain it simply, the question ladder and the quiet question for this module are coming soon. The key-term rounds below work already.</div>') +
      (fy ? feynHTML(m, fy) : have ? soonHTML('rf-feyn', 'Explain it simply', 'Feynman Technique') : '') +
      (soc.length ? socHTML(m, soc) : have ? soonHTML('rf-soc', 'Question it, step by step', ST.sans('manana')) : '') +
      japaHTML(m, terms) +
      (md.nididhyasana ? nidHTML(m, md.nididhyasana) : have ? soonHTML('rf-nid', 'Sit with one question', ST.sans('nididhyasana')) : '') +
      '</div>';
    if (fy) bindFeyn(m, fy, el);
    if (soc.length) bindSoc(m, soc, el);
    if (terms.length) bindJapa(m, terms, el);
    if (md.nididhyasana) bindNid(m, el);
    flushOnLeave();
  });
  function soonHTML(id, title, name) {
    return '<section class="card stack-sm" id="' + id + '" aria-labelledby="' + id + '-h"><h3 class="h-sub3" id="' + id + '-h">' + esc(title) + '</h3>' + methodLine(name) +
      '<p class="small muted">Coming soon for this module.</p></section>';
  }

  /* ---- a) Feynman: explain it simply ---- */
  function feynHTML(m, fy) {
    var e = reflOf(m.id) || {};
    return '<section class="card stack rf-feyn" id="rf-feyn" aria-labelledby="rf-feyn-h">' +
      '<div class="stack-sm"><h3 class="h-sub3" id="rf-feyn-h">Explain it simply</h3>' +
      methodLine('Feynman Technique, with self-explanation') +
      '<p class="small">Explain the module in your own words to the person below, as simply as you can. The places where you get stuck show you what to study again.</p></div>' +
      '<div class="callout callout-indigo"><span class="rf-tag">Your task</span> <span id="rf-feyn-task">' + inline(fy.prompt) + '</span></div>' +
      '<div class="stack-sm"><label for="rf-feyn-text"><strong>Your explanation</strong></label>' +
      '<textarea id="rf-feyn-text" rows="8" maxlength="4000" aria-describedby="rf-feyn-task rf-feyn-st" placeholder="Write as if you are talking to them: short sentences, everyday words.">' + esc(e.feyn || '') + '</textarea>' +
      '<span class="small muted" id="rf-feyn-st">' + (e.feyn ? 'Saved' : 'Saved as you type') + '</span></div>' +
      '<div class="row"><button type="button" class="btn btn-primary" id="rf-feyn-check">Check my explanation</button>' +
      '<button type="button" class="btn" id="rf-feyn-model-btn" aria-expanded="false" aria-controls="rf-feyn-model"' + (e.ideas > 0 ? '' : ' hidden') + '>See a model explanation</button></div>' +
      '<div id="rf-feyn-out" class="stack-sm" aria-live="polite">' + (e.ideas > 0 && e.feyn ? '<p class="small muted">Last check: ' + e.ideas + ' of ' + fy.keyIdeas.length + ' key ideas. Press Check again after you change it.</p>' : '') + '</div>' +
      '<div id="rf-feyn-model" class="rf-model stack-sm" hidden><p class="rf-tag">A model explanation</p><p>' + inline(fy.model || '') + '</p>' +
      '<p class="small muted">Yours does not need to match it. Borrow one plain phrase you like, then improve your own.</p></div>' +
      '<div class="stack-sm"><p class="small"><strong>AI check (optional)</strong> AI-based explanation assessment: a tutor reads your explanation against the key ideas.</p>' +
      ST.aiHTML('fey-' + m.id, 'Ask Gemini to check my explanation') + '</div></section>';
  }
  function bindFeyn(m, fy, root) {
    var ta = root.querySelector('#rf-feyn-text'), st = root.querySelector('#rf-feyn-st'), out = root.querySelector('#rf-feyn-out');
    var mb = root.querySelector('#rf-feyn-model-btn'), model = root.querySelector('#rf-feyn-model');
    var save = function () { var v = ta.value.slice(0, 4000), e = reflOf(m.id); if (e && e.feyn === v) { st.textContent = 'Saved'; return; } editRefl(m.id, function (x) { x.feyn = v; }); st.textContent = 'Saved'; };
    ta.addEventListener('input', function () { st.textContent = 'Saving…'; later('feyn:' + m.id, save, 600); });
    root.querySelector('#rf-feyn-check').addEventListener('click', function () {
      flush('feyn:' + m.id);
      var text = ta.value;
      if (!text.trim()) { out.innerHTML = '<p class="small rf-warn">Write your explanation in the box first, then check it.</p>'; focusEl(ta); return; }
      var hits = ideaHits(fy, text), n = hits.filter(Boolean).length, total = hits.length;
      var stats = textStats(text), range = sentenceRange(fy.prompt), jar = jargonIn(fy, text);
      var missing = fy.keyIdeas.filter(function (k, i) { return !hits[i]; });
      var msg;
      if (n === 0) msg = '<strong>You have made a start, and writing it down is the hardest part.</strong> The checker did not find any of the key ideas yet. Begin with the first one below in one plain sentence, then add the next.';
      else if (n < total) msg = '<strong>Good work: you covered ' + n + ' of ' + total + ' key ideas.</strong> To make it complete, add one plain sentence about this: ' + inline(missing[0].idea);
      else msg = '<strong>Excellent: you covered all ' + total + ' key ideas.</strong> Now polish it: read it aloud as if to your listener, and swap any word they would not know for an everyday one.';
      var len = '';
      if (range) {
        if (stats.sentences < range[0]) len = 'You wrote ' + stats.sentences + ' sentence' + (stats.sentences === 1 ? '' : 's') + '; the task asks for ' + range[0] + ' to ' + range[1] + '. One sentence per key idea is a good shape.';
        else if (stats.sentences > range[1]) len = 'You wrote ' + stats.sentences + ' sentences; the task asks for ' + range[0] + ' to ' + range[1] + '. Try to say it in fewer: shorter is clearer.';
        else len = 'The length is right: ' + stats.sentences + ' sentences (the task asks for ' + range[0] + ' to ' + range[1] + ').';
      }
      out.innerHTML = '<p>' + msg + '</p>' +
        '<div class="lab-stats rf-stats"><div class="stat"><div class="k">Key ideas</div><div class="v num">' + n + ' of ' + total + '</div></div>' +
        '<div class="stat"><div class="k">Sentences</div><div class="v num">' + stats.sentences + '</div></div>' +
        '<div class="stat"><div class="k">Words</div><div class="v num">' + stats.words + '</div></div></div>' +
        (len ? '<p class="small">' + esc(len) + '</p>' : '') +
        '<ul class="rf-ideas">' + fy.keyIdeas.map(function (k, i) {
          return '<li class="' + (hits[i] ? 'is-on' : '') + '">' + (hits[i] ? '<span class="chip chip-ok">✓ Covered</span>' : '<span class="chip">Not yet</span>') + '<span>' + inline(k.idea) + '</span></li>';
        }).join('') + '</ul>' +
        (jar.length ? '<div class="stack-sm"><p class="small"><strong>Did you explain these in plain words?</strong> You used these technical words. Make sure each one is explained, or swap it for an everyday word.</p><div class="row">' +
          jar.map(function (j) { return '<span class="chip chip-en-in">' + esc(j) + '</span>'; }).join('') + '</div></div>' : '<p class="small">No technical words from this module\'s list: good for a beginner listener.</p>') +
        '<p class="small muted">This check looks for typical phrases, so it can miss an idea you put in other words. Compare with the model explanation too.</p>';
      editRefl(m.id, function (x) { x.feyn = text.slice(0, 4000); x.ideas = n; });
      C.logActivity(); C.save();
      st.textContent = 'Saved';
      mb.hidden = false;
    });
    mb.addEventListener('click', function () {
      var open = mb.getAttribute('aria-expanded') !== 'true';
      model.hidden = !open; mb.setAttribute('aria-expanded', String(open));
      mb.textContent = open ? 'Hide the model explanation' : 'See a model explanation';
    });
    ST.bindAI(root, 'fey-' + m.id, function () {
      var text = ta.value.trim();
      if (!text) { C.toast('Write your explanation first, then ask.'); focusEl(ta); return ''; }
      return 'A learner is using the Feynman technique (explaining a topic in plain words, as if to someone who is new to it) for the module "' + m.title + '".\n' +
        'The task they were given (who they are explaining to): ' + fy.prompt + '\n\n' +
        'Key ideas a good explanation covers:\n' + fy.keyIdeas.map(function (k, i) { return (i + 1) + '. ' + k.idea; }).join('\n') + '\n\n' +
        'The learner\'s explanation:\n"""\n' + text + '\n"""\n\n' +
        'Reply in four short parts with these headings:\n' +
        '1. What is clear: what they explained well, quoting a phrase or two.\n' +
        '2. What is missing or wrong: go through the key ideas by number; say which are missing, unclear or wrong, with a one-line fix for each.\n' +
        '3. One word to explain better: pick one technical word they used (or needed) and show a plain way to say it to their listener.\n' +
        '4. One question to go deeper: ask one question that makes them think further about this topic.\n' +
        'Do not rewrite the whole explanation for them.';
    });
  }

  /* ---- b) Manana ladder: five Socratic questions in order ---- */
  function socHTML(m, soc) {
    var e = reflOf(m.id) || {}, ans = e.soc || [];
    return '<section class="card stack rf-socs" id="rf-soc" aria-labelledby="rf-soc-h">' +
      '<div class="stack-sm"><h3 class="h-sub3" id="rf-soc-h">Question it, step by step</h3>' +
      methodLine(ST.sans('manana') + ', through Socratic questioning') +
      '<p class="small">Answer each question in your own words before you open the hint or the model answer. Each step builds on the one before, so go in order.</p></div>' +
      '<ol class="rf-ladder">' + soc.map(function (s, i) {
        var id = 'rf-soc-' + i;
        return '<li class="rf-step" data-i="' + i + '">' +
          '<div class="row-between"><span class="small muted num">Step ' + (i + 1) + ' of ' + soc.length + '</span><span class="chip rf-step-st" id="' + id + '-st"></span></div>' +
          '<p class="rf-q" id="' + id + '-q"><strong>' + inline(s.q) + '</strong></p>' +
          '<label class="small" for="' + id + '">Your answer<span class="visually-hidden"> to step ' + (i + 1) + '</span></label>' +
          '<textarea id="' + id + '" rows="3" maxlength="1500" aria-describedby="' + id + '-q ' + id + '-st">' + esc(ans[i] || '') + '</textarea>' +
          '<div class="rf-folds">' +
          (s.hint ? '<details class="fold rf-fold"><summary>Hint</summary><div><p>' + inline(s.hint) + '</p></div></details>' : '') +
          (s.answer ? '<details class="fold rf-fold"><summary>Show model answer</summary><div><p>' + inline(s.answer) + '</p></div></details>' : '') + '</div>' +
          ST.aiHTML('soc-' + m.id + '-' + i, 'Ask Gemini to question me further') +
          '</li>';
      }).join('') + '</ol>' +
      '<p class="small muted" id="rf-soc-sum" aria-live="polite"></p></section>';
  }
  function bindSoc(m, soc, root) {
    var steps = Array.prototype.slice.call(root.querySelectorAll('.rf-step'));
    var tas = steps.map(function (li) { return li.querySelector('textarea'); });
    var sum = root.querySelector('#rf-soc-sum'), lastDone = -1;
    function state() {
      var vals = tas.map(function (t) { return !!t.value.trim(); }), k = vals.indexOf(false), done = vals.filter(Boolean).length;
      steps.forEach(function (li, i) {
        var s = vals[i] ? 'done' : (k < 0 || i <= k) ? 'now' : 'later';
        li.classList.toggle('is-done', s === 'done'); li.classList.toggle('is-now', s === 'now'); li.classList.toggle('is-later', s === 'later');
        li.querySelector('.rf-step-st').textContent = s === 'done' ? '✓ Answered' : s === 'now' ? 'Your step now' : 'After step ' + (k + 1);
      });
      if (done !== lastDone) {
        sum.textContent = done === soc.length ? 'You have answered every step. Open the model answers and compare, or ask an AI to question you further.' : done + ' of ' + soc.length + ' steps answered.';
        lastDone = done;
      }
    }
    tas.forEach(function (ta, i) {
      ta.addEventListener('input', function () {
        state();
        later('soc:' + m.id + ':' + i, function () {
          var v = ta.value.slice(0, 1500), e = reflOf(m.id);
          if (e && (e.soc || [])[i] === v) return;
          editRefl(m.id, function (x) { var a = (x.soc || []).slice(0, 5); while (a.length < 5) a.push(''); a[i] = v; x.soc = a; });
        }, 600);
      });
      ST.bindAI(steps[i], 'soc-' + m.id + '-' + i, function () {
        var text = ta.value.trim(), s = soc[i];
        if (!text) { C.toast('Write your answer first, then ask.'); focusEl(ta); return ''; }
        return 'A learner is working through a ladder of Socratic questions (questions that lead them to reason it out themselves) for the module "' + m.title + '". This is step ' + (i + 1) + ' of ' + soc.length + '.\n' +
          'Question: ' + s.q + '\n' +
          'Model answer (for you only; do not reveal it in full): ' + (s.answer || '') + '\n\n' +
          'The learner\'s answer:\n"""\n' + text + '\n"""\n\n' +
          'Reply in two short parts:\n' +
          '1. Feedback: say what is right in their answer, and what is missing or wrong, without giving the full model answer.\n' +
          '2. One follow-up question: ask exactly ONE Socratic question that helps them find the missing part by themselves.\n' +
          'Never give the full answer first. If their answer is already complete, say so and ask one question that takes the idea further.';
      });
    });
    state();
  }

  /* ---- c) Japa rounds: calm repetition of the key terms ---- */
  function japaHTML(m, terms) {
    var e = reflOf(m.id) || {};
    return '<section class="card stack rf-japa" id="rf-japa" aria-labelledby="rf-japa-h">' +
      '<div class="stack-sm"><h3 class="h-sub3" id="rf-japa-h">Repeat the key terms</h3>' +
      methodLine(ST.sans('japa')) +
      '<p class="small">Japa is the old Indian practice of repeating something slowly and steadily, so that it settles in the mind. Here you repeat this module\'s key terms: say what each one means, check, and go round again. Three calm rounds.</p></div>' +
      (terms.length ? '<div class="rf-japa-stage stack-sm" id="rf-japa-stage"></div>' +
        '<div class="row-between small muted"><span id="rf-japa-reps" class="num">Repetitions: 0</span><span id="rf-japa-best" class="num">' + (e.japa ? 'Best last round: ' + Math.min(e.japa, terms.length) + ' of ' + terms.length : '') + '</span></div>' +
        '<p class="visually-hidden" aria-live="polite" id="rf-japa-live"></p>' : '<p class="small muted">Key terms for this module are coming soon.</p>') +
      '</section>';
  }
  function bindJapa(m, terms, root) {
    var stage = root.querySelector('#rf-japa-stage'), live = root.querySelector('#rf-japa-live');
    var repsEl = root.querySelector('#rf-japa-reps'), bestEl = root.querySelector('#rf-japa-best');
    var N = terms.length, J = { round: 0, list: [], i: 0, shown: false, known: 0, miss: [], r1miss: [], reps: 0 };
    var say = function (t) { live.textContent = ''; setTimeout(function () { live.textContent = t; }, 30); };
    var plain = function (s) { var d = document.createElement('div'); d.innerHTML = inline(s); return d.textContent; };
    function start(r) {
      J.round = r; J.i = 0; J.shown = false; J.known = 0; J.miss = [];
      J.list = r === 2 ? J.r1miss.slice() : terms.map(function (t, i) { return i; });
      draw(true);
    }
    function head() { return '<p class="small muted num">Round ' + J.round + ' of 3' + (J.round === 2 ? ' (only the terms marked Not yet)' : J.round === 3 ? ' (every term, the last round)' : '') + ' · Term ' + (J.i + 1) + ' of ' + J.list.length + '</p>'; }
    function draw(focus) {
      var h, f;
      if (J.round === 0) {
        h = '<p>Round 1 goes through all ' + N + ' terms. Round 2 repeats only the ones you marked <strong>Not yet</strong>. Round 3 goes through every term once more.</p>' +
          '<div><button type="button" class="btn btn-primary" data-j="start" data-r="1" data-jf>Start round 1</button></div>';
      } else if (J.i < J.list.length) {
        var t = terms[J.list[J.i]];
        h = head() + '<p class="rf-term" id="rf-japa-term">' + esc(t.term) + '</p>' +
          (J.shown ? '<div class="rf-ans"><p><span class="rf-tag">Meaning</span> ' + inline(t.meaning || '') + '</p></div>' +
            '<div class="row" role="group" aria-label="Did you know it?"><button type="button" class="btn btn-primary" data-j="knew" data-jf>I knew it</button><button type="button" class="btn" data-j="not">Not yet</button></div>'
            : '<p class="small">Say its meaning to yourself, slowly. Then check.</p><div><button type="button" class="btn btn-primary" data-j="show" data-jf aria-describedby="rf-japa-term">Show meaning</button></div>');
      } else if (J.round === 1) {
        J.r1miss = J.miss.slice();
        h = '<p><strong>Round 1 done: you knew ' + J.known + ' of ' + N + '.</strong> ' + (J.r1miss.length ? 'Round 2 repeats the ' + J.r1miss.length + ' term' + (J.r1miss.length === 1 ? '' : 's') + ' you marked Not yet.' : 'You knew every term, so round 2 is not needed. The last round goes through every term once more.') + '</p>' +
          '<div><button type="button" class="btn btn-primary" data-j="start" data-r="' + (J.r1miss.length ? 2 : 3) + '" data-jf>' + (J.r1miss.length ? 'Start round 2' : 'Start the last round') + '</button></div>';
      } else if (J.round === 2) {
        h = '<p><strong>Round 2 done: ' + J.known + ' of ' + J.list.length + ' came back to you.</strong> The last round goes through all ' + N + ' terms once more, calmly.</p>' +
          '<div><button type="button" class="btn btn-primary" data-j="start" data-r="3" data-jf>Start the last round</button></div>';
      } else {
        var prev = (reflOf(m.id) || {}).japa || 0, score = J.known;
        if (score > prev) editRefl(m.id, function (x) { x.japa = score; });
        C.logActivity(); C.save();
        var best = Math.min(Math.max(prev, score), N);
        bestEl.textContent = 'Best last round: ' + best + ' of ' + N;
        h = '<p><strong>Last round done: you knew ' + score + ' of ' + N + '.</strong> ' + (score > prev ? 'That is your best so far, saved. ' : '') +
          (J.miss.length ? 'Still settling: ' + J.miss.map(function (k) { return esc(terms[k].term); }).join(', ') + '. Come back to them tomorrow; repeating over several days makes them stick.' : 'Every term is steady in your mind today.') + '</p>' +
          '<div><button type="button" class="btn" data-j="start" data-r="1" data-jf>Go again from round 1</button></div>';
      }
      stage.innerHTML = h;
      repsEl.textContent = 'Repetitions: ' + J.reps;
      f = stage.querySelector('[data-jf]');
      if (focus && f) focusEl(f);
      if (J.round && J.i < J.list.length) say(J.shown ? 'Meaning: ' + plain(terms[J.list[J.i]].meaning || '') : 'Term ' + (J.i + 1) + ' of ' + J.list.length + ': ' + terms[J.list[J.i]].term);
      else if (J.round) say(stage.querySelector('p strong') ? stage.querySelector('p').textContent : '');
    }
    stage.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-j]'); if (!b) return;
      var a = b.getAttribute('data-j');
      if (a === 'start') start(Number(b.getAttribute('data-r')) || 1);
      else if (a === 'show') { J.shown = true; J.reps++; draw(true); }
      else if (a === 'knew' || a === 'not') {
        if (a === 'knew') J.known++; else J.miss.push(J.list[J.i]);
        J.i++; J.shown = false; draw(true);
      }
    });
    draw(false);
  }

  /* ---- d) Nididhyasana: one question to sit with ---- */
  function nidHTML(m, q) {
    return '<section class="card stack-sm rf-nid" id="rf-nid" aria-labelledby="rf-nid-h">' +
      '<h3 class="h-sub3" id="rf-nid-h">Sit with one question</h3>' +
      methodLine(ST.sans('nididhyasana')) +
      '<p class="small">Read the question slowly. Later, in a quiet moment (a walk, the bus, before sleep), turn it over in your mind for a few minutes. Nothing to write.</p>' +
      '<blockquote class="rf-nid-q">' + inline(q) + '</blockquote>' +
      '<div class="row" id="rf-nid-row"></div></section>';
  }
  function bindNid(m, root) {
    var row = root.querySelector('#rf-nid-row');
    function draw(focus) {
      var d = (reflOf(m.id) || {}).nid || '', t = ST.today();
      row.innerHTML = d === t
        ? '<p class="rf-nid-done" tabindex="-1"><span aria-hidden="true">✓ </span><strong>You sat with this today.</strong> Come back to it another day if it keeps you thinking.</p><button type="button" class="btn btn-sm btn-ghost" data-nid="undo">Undo</button>'
        : '<button type="button" class="btn btn-primary" data-nid="done">I sat with this today</button>' + (d ? '<span class="small muted">Last time: ' + esc(fmtDay(d)) + '</span>' : '');
      if (focus) focusEl(row.querySelector(d === t ? '.rf-nid-done' : '[data-nid]'));
    }
    row.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-nid]'); if (!b) return;
      var a = b.getAttribute('data-nid');
      if (a === 'done') C.logActivity();
      editRefl(m.id, function (x) { x.nid = a === 'done' ? ST.today() : ''; });
      draw(true);
    });
    draw(false);
  }

  /* =====================================================================
     3. Watch tab: Sravana (attentive listening) with a three-line summary of the best pick
     ===================================================================== */
  var FALLBACK_CUES = ['Listen for the one main idea the speaker keeps coming back to.', 'Listen for one example you could retell to a friend.', 'Listen for one word you did not know, and how it is explained.'];
  function cuesHTML(m) { var md = ST.modData(m.id), cues = md && Array.isArray(md.sravana) && md.sravana.length ? md.sravana.slice(0, 3) : FALLBACK_CUES; return cues.map(function (c) { return '<li>' + inline(c) + '</li>'; }).join(''); }
  ST.on('watch', function (m, el) {
    withApp(function () {
      var host = el.querySelector('.stack-lg') || el; if (!host.isConnected || host.querySelector('#rf-srav')) return;
      var best = APP().mainPicks(m).main, sum = best ? (C.state.sum || {})[best.id] : null;
      var panel = document.createElement('section');
      panel.className = 'card stack-sm rf-srav'; panel.id = 'rf-srav'; panel.setAttribute('aria-labelledby', 'rf-srav-h');
      if (best) panel.setAttribute('data-res', best.id);
      panel.innerHTML = '<h2 class="h-sub" id="rf-srav-h">Listen with attention</h2>' + methodLine(ST.sans('sravana')) +
        '<p class="small">Read these before you press play and give the video your full attention. Afterwards, write what you heard from memory.</p>' +
        '<div class="rf-srav-grid"><ul class="rf-listen small" id="rf-srav-cues">' + cuesHTML(m) + '</ul>' +
        (best ? '<div class="stack-sm rf-sum"><label for="rf-sum-text" class="small"><strong>After watching, write what you heard</strong> <span class="muted">(three lines about “' + esc(best.title) + '”)</span></label>' +
          '<textarea id="rf-sum-text" rows="3" maxlength="800" aria-describedby="rf-sum-st" placeholder="1. The main idea…&#10;2. An example…&#10;3. One new word…">' + esc(sum ? sum.t : '') + '</textarea>' +
          '<span class="small muted" id="rf-sum-st">' + (sum && sum.t ? 'Saved' : 'Saved as you type') + '</span></div>' : '') + '</div>' +
        '<p class="visually-hidden" aria-live="polite" id="rf-srav-live"></p>';
      host.insertBefore(panel, host.firstChild);
      if (!dataReady()) ST.ensureData().then(function () { var ul = panel.querySelector('#rf-srav-cues'); if (ul && panel.isConnected) ul.innerHTML = cuesHTML(m); }, function () {});
      if (!best) return;
      var ta = panel.querySelector('#rf-sum-text'), st = panel.querySelector('#rf-sum-st');
      var save = function () {
        var v = ta.value.slice(0, 800), map = C.state.sum || (C.state.sum = {}), cur = map[best.id];
        if ((cur ? cur.t : '') === v) { st.textContent = 'Saved'; return; }
        map[best.id] = { t: v, at: ST.now() }; C.save(); st.textContent = 'Saved';
      };
      ta.addEventListener('input', function () { panel.classList.remove('rf-glow'); st.textContent = 'Saving…'; later('sum:' + best.id, save, 600); });
      flushOnLeave();
    });
  });
  ST.on('watched', function (rid, on) {
    if (!on) return;
    var panel = document.getElementById('rf-srav');
    if (!panel || panel.getAttribute('data-res') !== rid) return;
    var ta = panel.querySelector('#rf-sum-text'), st = panel.querySelector('#rf-sum-st');
    if (!ta || ta.value.trim()) return;
    panel.classList.add('rf-glow');
    if (st) st.textContent = 'You finished it: write what you heard while it is fresh.';
    var live = panel.querySelector('#rf-srav-live');
    if (live) live.textContent = 'You finished the best pick. The box to write what you heard is at the top of this tab.';
    // a video still open in the site may be playing (or full screen): only highlight, do not move the page or the focus
    var playing = !!document.fullscreenElement || !!document.querySelector('#main .player iframe, #main .player .player-loading');
    if (playing) return;
    try { panel.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' }); } catch (e) { panel.scrollIntoView(); }
    focusEl(ta);
  });
})();
