/* AI Marg study feature: the recall check of each lesson card (recall and Why questions) and Recall mode on the Overview tab,
   the module Reflect tab (Feynman, Manana, Japa, Nididhyasana) and Sravana on the Watch tab.
   study.js loads this file when one of those pages needs it. Uses window.AIM_STUDY (assets/js/study.js) and window.AIM_APP (assets/js/app.js). */
(function () {
  'use strict';
  var ST = window.AIM_STUDY; if (!ST) return; // study features are switched off in this browser
  var C = window.AIM_CORE, esc = C.esc, inline = C.inline;
  var APP = function () { return window.AIM_APP; };
  var FEYN_MAX = 3000, SOC_MAX = 1500, SUM_MAX = 800; // the limits study.js keeps when it saves
  function reduced() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function focusEl(el) { if (!el) return; try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }
  function fmtDay(d) { try { return new Date(d + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); } catch (e) { return d; } }
  // words that only screen readers hear, so that buttons repeated on a page say what they act on
  function vh(t) { return t ? '<span class="visually-hidden">' + esc(t) + '</span>' : ''; }
  // a live region announces each new message once (cleared first, so the same words are read again)
  function announce(el, text) { if (!el) return; el.textContent = ''; setTimeout(function () { if (el.isConnected) el.textContent = text; }, 30); }
  // a link to the method's own entry on the How to learn page (#methods~<method id>), named for screen readers
  function how(id, label) { return '<a href="#methods~' + id + '">How and why this works' + vh(': ' + label) + '</a>'; }
  function methodLine(name, id, label) { return '<p class="small rf-method"><span class="muted">Method:</span> ' + name + ' · ' + how(id, label) + '</p>'; }

  /* ---------- autosave: debounced writes, flushed when the learner leaves the page or the tab ---------- */
  var pending = {};
  function later(key, fn, ms) {
    var p = pending[key]; if (p) clearTimeout(p.t);
    pending[key] = { fn: fn, t: setTimeout(function () { flush(key); }, ms || 600) };
  }
  function flush(key) { var p = pending[key]; if (!p) return; clearTimeout(p.t); delete pending[key]; try { p.fn(); } catch (e) { if (window.console) console.error(e); } }
  function flushAll() { Object.keys(pending).forEach(flush); }
  function dropAll() { Object.keys(pending).forEach(function (k) { clearTimeout(pending[k].t); delete pending[k]; }); }
  window.addEventListener('pagehide', flushAll);
  // after Reset all progress (here or in another tab) text typed a moment before must not bring the old progress back
  window.addEventListener('aim:progress-reset', dropAll);
  function flushOnLeave() { var a = APP(); if (a && a.onLeave) a.onLeave(flushAll); }

  /* ---------- reflections: C.state.refl[moduleId] = { feyn, ideas, fAt, soc[5], sAt[5], japa, nid, at } ---------- */
  function reflOf(mid) { var r = C.state.refl || {}; return r[mid] || null; }
  // fn(entry, time) changes the entry and stamps fAt (Feynman) or sAt[i] (Manana answer i) for the parts it changes; 'at' is stamped here
  function editRefl(mid, fn) {
    var st = C.state, t = ST.now(); if (!st.refl) st.refl = {};
    var e = st.refl[mid] || { feyn: '', ideas: 0, fAt: '', soc: [], sAt: [], japa: 0, nid: '', at: '' };
    fn(e, t); e.at = t; st.refl[mid] = e; C.save();
    return e;
  }
  function five(a) { a = (Array.isArray(a) ? a : []).slice(0, 5); while (a.length < 5) a.push(''); return a; }

  /* ---------- Feynman check: the cue rule and simple counts ---------- */
  // An idea is mentioned when the text, lowercased with spaces collapsed, contains one of its cues. A short cue (4 characters
  // or fewer) must start a word, so "api" is not found inside "rapid" and "mix" not inside "remix"; longer cues may sit
  // anywhere ("label" in "unlabelled"). It only finds words: it cannot tell a right explanation from a wrong one.
  function normText(t) { return String(t || '').toLowerCase().replace(/\s+/g, ' '); }
  function cueIn(t, cue) {
    var c = String(cue || '').toLowerCase(); if (!c.trim()) return false;
    if (c.length > 4) return t.indexOf(c) >= 0;
    for (var i = t.indexOf(c); i >= 0; i = t.indexOf(c, i + 1)) if (i === 0 || !/[a-z0-9]/.test(t.charAt(i - 1))) return true;
    return false;
  }
  function ideaHits(fy, text) {
    var t = normText(text);
    return (fy.keyIdeas || []).map(function (k) { return (k.cues || []).some(function (c) { return cueIn(t, c); }); });
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
     1. Lesson cards: the recall check (active recall + Why question) and Recall mode
     The check sits between the card text and Got it, so the learner meets it before moving on (app.js scrolls to the next
     card after Got it). Opening it hides the card text, so the answer comes from memory, not from the page above it.
     ===================================================================== */
  var GRADES = [[1, 'Again', 'I could not recall it'], [2, 'Hard', 'I got it with effort'], [3, 'Good', 'I recalled it'], [4, 'Easy', 'It came at once']];
  function cardContent(mid, key) { var md = ST.modData(mid), c = md && md.cards && md.cards[key]; return c && c.recall ? c : null; }
  function cardTitle(m, key) { var c = APP().readCards(m).filter(function (x) { return x.key === key; })[0]; return c ? c.title : key; }
  function rcId(mid, key) { return 'rc:' + mid + ':' + key; }
  function srsOf(id) { return (C.state.srs || {})[id] || null; }
  // 'new': never reviewed, so a rating here is the first learning step; 'review': already in spaced review (Daily review
  // keeps its schedule); 'off': the learner took it out of Daily review
  function rcState(id) { var c = srsOf(id); return !c ? 'new' : c.off ? 'off' : c.reps ? 'review' : 'new'; }
  function dueText(c, first) {
    var n = ST.daysBetween(ST.today(), c.due);
    if (n <= 0) return 'It is due in today\'s Daily review.';
    if (n === 1) return first ? 'Its first review is tomorrow, in Daily review.' : 'Its next review is tomorrow.';
    return (first ? 'Its first review is in ' : 'Its next review is in ') + n + ' days (on ' + fmtDay(c.due) + ').';
  }
  function statusHTML(id) {
    var c = srsOf(id), s = rcState(id);
    if (s === 'off') return 'You took this question out of <a href="#review">Daily review</a>, so it does not come back there.';
    if (s === 'review') return 'This question is in your <a href="#review">Daily review</a>. ' + esc(dueText(c, false));
    return '';
  }
  function subText(read) { return read ? 'answer from memory' : 'answer from memory before you press Got it'; }
  function checkHTML(m, key, c, read) {
    var id = 'rf-c-' + esc(key), title = cardTitle(m, key), sid = rcId(m.id, key), isNew = rcState(sid) === 'new';
    return '<details class="rf-check" data-rf-check="' + esc(key) + '" data-mid="' + esc(m.id) + '">' +
      '<summary><span class="rf-check-t">Recall check</span>' + vh(' for “' + title + '”') + ' <span class="small muted rf-check-sub">' + subText(read) + '</span></summary>' +
      '<div class="rf-check-body stack-sm">' +
      '<p class="small muted">Active recall: the card text is hidden while this is open. Answer from memory, then check. ' + how('active-recall', 'active recall') + '</p>' +
      '<p class="rf-q" id="' + id + '-q"><strong>' + inline(c.recall) + '</strong></p>' +
      '<label class="small" for="' + id + '-mine">Your answer (optional, not saved)</label>' +
      '<textarea class="rf-mine" id="' + id + '-mine" rows="2" aria-describedby="' + id + '-q"></textarea>' +
      '<div><button type="button" class="btn btn-sm" data-rf="show" aria-expanded="false" aria-controls="' + id + '-a"><span class="rf-bt">Show answer</span>' + vh(': ' + title) + '</button></div>' +
      '<div class="rf-ans stack-sm" id="' + id + '-a" hidden>' +
      '<p><span class="rf-tag">Answer</span> ' + inline(c.answer || '') + '</p>' +
      '<div class="rf-rate stack-sm" role="group" aria-labelledby="' + id + '-rl"' + (isNew ? '' : ' hidden') + '>' +
      '<p class="small" id="' + id + '-rl"><strong>How well did you remember?</strong>' + vh(' (' + title + ')') + ' Again brings it back in today\'s Daily review; Hard, Good or Easy bring it back tomorrow.</p>' +
      '<div class="row">' + GRADES.map(function (g) {
        return '<button type="button" class="btn btn-sm rf-grade" data-rf="rate" data-g="' + g[0] + '" aria-describedby="' + id + '-g' + g[0] + '">' + g[1] + '</button><span class="visually-hidden" id="' + id + '-g' + g[0] + '">' + g[2] + '</span>';
      }).join('') + '</div>' +
      '<p class="small muted rf-grade-key">Again: could not recall · Hard: with effort · Good: recalled it · Easy: came at once</p></div>' +
      '<p class="small rf-rated" tabindex="-1"' + (isNew ? ' hidden>' : '>' + statusHTML(sid)) + '</p></div>' +
      (c.why ? '<div class="rf-why stack-sm"><p><span class="rf-tag">Why?</span> ' + inline(c.why) + '</p>' +
        '<p class="small muted">Elaborative interrogation: think of the reason yourself before you look.</p>' +
        '<div><button type="button" class="btn btn-sm" data-rf="why" aria-expanded="false" aria-controls="' + id + '-w"><span class="rf-bt">Show a model answer</span>' + vh(' to the Why question: ' + title) + '</button></div>' +
        '<div class="rf-ans" id="' + id + '-w" hidden><p>' + inline(c.whyAnswer || '') + '</p></div></div>' : '') +
      '</div></details>';
  }
  function addCheck(m, key, card) {
    var c = cardContent(m.id, key); if (!c || card.querySelector('[data-rf-check]')) return;
    var body = card.querySelector('.read-body'); if (!body) return;
    // after the card text (and its diagrams, which app.js puts inside the text), before Got it
    body.insertAdjacentHTML('afterend', checkHTML(m, key, c, APP().readOn(m.id, key)));
    var d = card.querySelector('details.rf-check');
    d.addEventListener('toggle', function () { syncBody(card); }); // also when the browser opens it (find in page)
  }
  // the card text is hidden while its recall check is open, or while Recall mode covers it
  function syncBody(card) {
    var body = card && card.querySelector('.read-body'); if (!body) return;
    var d = card.querySelector('details.rf-check'), cover = card.querySelector('.rf-cover'), open = !!(d && d.open);
    if (cover) {
      cover.hidden = open; // the open check already asks the question
      if (open && cover.classList.contains('is-open')) setReveal(cover, false);
    }
    body.hidden = open || !!(cover && !cover.classList.contains('is-open'));
  }
  // change the page above an element without moving that element on the screen
  function keepInPlace(el, change) {
    var y0 = el.getBoundingClientRect().top;
    change();
    var dy = el.getBoundingClientRect().top - y0; if (Math.abs(dy) < 1) return;
    var h = document.documentElement, prev = h.style.scrollBehavior;
    h.style.scrollBehavior = 'auto'; window.scrollBy(0, dy); h.style.scrollBehavior = prev;
  }
  function setBtnText(b, t) { var s = b.querySelector('.rf-bt'); if (s) s.textContent = t; else b.textContent = t; }
  function setReveal(cover, on) {
    cover.classList.toggle('is-open', on);
    var b = cover.querySelector('[data-rf="reveal"]');
    if (b) { b.setAttribute('aria-expanded', String(on)); setBtnText(b, on ? 'Hide the card again' : 'Reveal the card'); }
  }
  // A rating here comes right after reading, so it is a learning step, not a spaced review: Again keeps the question due in
  // today's Daily review; Hard, Good or Easy bring it back tomorrow, whatever the grade; nothing is added to the review log.
  // A question already in spaced review keeps the schedule Daily review gave it, and one the learner removed stays out.
  function learnStep(id, g) {
    var c = srsOf(id);
    if (c && (c.off || c.reps)) return c;
    if (ST.learnStep) return ST.learnStep(id, g); // the scheduler's own learning step, once study.js has one (same rules)
    if (!c) ST.enroll([id]);
    if (g < 2) { C.logActivity(); C.save(); return srsOf(id); }
    // the scheduler's one-day first step is what a first review graded Hard gives; its review-log entry is taken back
    var e = ST.schedule(id, 2);
    ST.logReview(-1, -1); C.save();
    return e;
  }
  document.addEventListener('click', function (ev) {
    if (!ev.target.closest) return;
    // open or close a recall check: the card text above it hides or comes back, and the check stays where it was on screen
    var sum = ev.target.closest('details.rf-check > summary');
    if (sum) {
      ev.preventDefault();
      var d = sum.parentNode, card = d.closest('.read-card');
      keepInPlace(sum, function () { d.open = !d.open; syncBody(card); });
      return;
    }
    var b = ev.target.closest('[data-rf]'); if (!b) return;
    var act = b.getAttribute('data-rf');
    if (act === 'show' || act === 'why') {
      var reg = document.getElementById(b.getAttribute('aria-controls')); if (!reg) return;
      var open = b.getAttribute('aria-expanded') !== 'true';
      reg.hidden = !open; b.setAttribute('aria-expanded', String(open));
      if (act === 'show') setBtnText(b, open ? 'Hide answer' : 'Show answer');
      else setBtnText(b, open ? 'Hide the model answer' : 'Show a model answer');
    } else if (act === 'reveal') {
      var cv = b.closest('.rf-cover'); if (!cv) return;
      setReveal(cv, !cv.classList.contains('is-open'));
      syncBody(cv.closest('.read-card'));
    } else if (act === 'rate') {
      var box = b.closest('[data-rf-check]'), g = Number(b.getAttribute('data-g'));
      if (!box || !(g >= 1 && g <= 4)) return;
      var sid = rcId(box.getAttribute('data-mid'), box.getAttribute('data-rf-check'));
      var rate = box.querySelector('.rf-rate'), done = box.querySelector('.rf-rated');
      if (!done) return;
      var before = rcState(sid), entry = before === 'new' ? learnStep(sid, g) : null;
      if (!entry || entry.off) { // taken out of Daily review, or put into spaced review on another device meanwhile
        if (rate) rate.hidden = true;
        done.innerHTML = statusHTML(sid);
      } else if (g < 2) { // Again: read the card again and try once more
        done.innerHTML = '<span aria-hidden="true">↻ </span>Not yet, and that is useful to know. Close the recall check to read the card again, then try once more. It is also in today\'s <a href="#review">Daily review</a>.';
      } else {
        if (rate) rate.hidden = true;
        done.innerHTML = '<span aria-hidden="true">✓ </span>Saved. ' + esc(dueText(entry, true)) + ' Remembering it after a gap is what makes it stick. <a href="#review">Daily review</a>';
      }
      done.hidden = false;
      focusEl(done);
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
        '<div class="stack-sm rf-recall-t"><strong>Recall mode</strong><span class="small muted">You have read every card. Switch this on to see each card\'s question first: answer from memory, then reveal the card (active recall, ' + ST.sans('smarana') + '). ' + how('active-recall', 'active recall') + '</span></div>' +
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
            '<div><button type="button" class="btn btn-sm" data-rf="reveal" aria-expanded="false" aria-controls="' + esc(body.id) + '"><span class="rf-bt">Reveal the card</span>' + vh(': ' + c.title) + '</button></div></div>');
        }
      } else if (cover) cover.remove();
      syncBody(card);
    });
    var live = cardsEl.querySelector('#rf-recall-live');
    if (live) live.textContent = on ? 'Recall mode is on. Each card shows its question first.' : 'Recall mode is off. Every card is shown in full.';
  }

  ST.on('overview', function (m, el) {
    var cardsEl = el.querySelector('.read-cards'); if (!cardsEl || !cardsEl.isConnected) return;
    updateRecallSwitch(m, cardsEl);
    var go = function () {
      if (!cardsEl.isConnected) return;
      APP().readCards(m).forEach(function (c) {
        var card = document.getElementById('read-' + c.key);
        if (card && cardsEl.contains(card)) addCheck(m, c.key, card);
      });
    };
    if (ST.modData(m.id)) go(); else ST.ensureModule(m.id).then(go, function () {});
  });
  ST.on('card-read', function (m, key, on) {
    var card = document.getElementById('read-' + key); if (!card || !card.isConnected) return;
    var d = card.querySelector('details.rf-check');
    if (d) {
      var sub = d.querySelector('.rf-check-sub'); if (sub) sub.textContent = subText(on);
      // ticked with the check still open: show the card text again now, before app.js moves on to the next card
      if (on && d.open) { d.open = false; syncBody(card); }
    }
    updateRecallSwitch(m, card.closest('.read-cards'));
  });

  /* =====================================================================
     2. Reflect tab: Feynman, Manana ladder, Japa rounds, Nididhyasana
     (study.js has loaded this module's content before it calls this)
     ===================================================================== */
  ST.setReflect(function (m, el) {
    var have = ST.modData(m.id), md = have || {};
    var fy = md.feynman && md.feynman.prompt && (md.feynman.keyIdeas || []).length ? md.feynman : null;
    var soc = Array.isArray(md.socratic) ? md.socratic.filter(function (s) { return s && s.q; }).slice(0, 5) : [];
    var terms = (m.keyTerms || []).filter(function (t) { return t && t.term; });
    el.innerHTML = '<div class="stack-lg rf">' +
      '<div class="stack-sm"><h2>Reflect</h2><p class="muted prose">Four quiet ways to make this module your own: explain it simply, question it step by step, repeat its key terms, and sit with one question. What you write is saved with the rest of your progress.</p></div>' +
      (have ? '' : '<div class="callout small">Explain it simply, the question ladder and the quiet question for this module are coming soon. The key-term rounds below work already.</div>') +
      (fy ? feynHTML(m, fy) : have ? soonHTML('rf-feyn', 'Explain it simply', 'Feynman Technique', 'feynman-technique', 'Feynman Technique') : '') +
      (soc.length ? socHTML(m, soc) : have ? soonHTML('rf-soc', 'Question it, step by step', ST.sans('manana'), 'manana', 'Manana') : '') +
      japaHTML(m, terms) +
      (md.nididhyasana ? nidHTML(m, md.nididhyasana) : have ? soonHTML('rf-nid', 'Sit with one question', ST.sans('nididhyasana'), 'nididhyasana', 'Nididhyasana') : '') +
      '</div>';
    if (fy) bindFeyn(m, fy, el);
    if (soc.length) bindSoc(m, soc, el);
    if (terms.length) bindJapa(m, terms, el);
    if (md.nididhyasana) bindNid(m, el);
    flushOnLeave();
  });
  function soonHTML(id, title, name, mid, label) {
    return '<section class="card stack-sm" id="' + id + '" aria-labelledby="' + id + '-h"><h3 class="h-sub3" id="' + id + '-h">' + esc(title) + '</h3>' + methodLine(name, mid, label) +
      '<p class="small muted">Coming soon for this module.</p></section>';
  }

  /* ---- a) Feynman: explain it simply ---- */
  function feynHTML(m, fy) {
    var e = reflOf(m.id) || {};
    return '<section class="card stack rf-feyn" id="rf-feyn" aria-labelledby="rf-feyn-h">' +
      '<div class="stack-sm"><h3 class="h-sub3" id="rf-feyn-h">Explain it simply</h3>' +
      methodLine('Feynman Technique, with self-explanation', 'feynman-technique', 'Feynman Technique') +
      '<p class="small">Explain the module in your own words to the person below, as simply as you can. The places where you get stuck show you what to study again.</p></div>' +
      '<div class="callout callout-indigo"><span class="rf-tag">Your task</span> <span id="rf-feyn-task">' + inline(fy.prompt) + '</span></div>' +
      '<div class="stack-sm"><label for="rf-feyn-text"><strong>Your explanation</strong></label>' +
      '<textarea id="rf-feyn-text" rows="8" maxlength="' + FEYN_MAX + '" aria-describedby="rf-feyn-task rf-feyn-st" placeholder="Write as if you are talking to them: short sentences, everyday words.">' + esc(e.feyn || '') + '</textarea>' +
      '<span class="small muted" id="rf-feyn-st">' + (e.feyn ? 'Saved' : 'Saved as you type') + '</span></div>' +
      '<div class="row"><button type="button" class="btn btn-primary" id="rf-feyn-check">Check my explanation</button>' +
      '<button type="button" class="btn" id="rf-feyn-model-btn" aria-expanded="false" aria-controls="rf-feyn-model"' + (e.ideas > 0 ? '' : ' hidden') + '>See a model explanation</button></div>' +
      '<p class="visually-hidden" aria-live="polite" id="rf-feyn-live"></p>' +
      '<div id="rf-feyn-out" class="stack-sm">' + (e.ideas > 0 && e.feyn ? '<p class="small muted">Last check: your explanation mentioned ' + Math.min(e.ideas, fy.keyIdeas.length) + ' of ' + fy.keyIdeas.length + ' key ideas. Press Check again after you change it.</p>' : '') + '</div>' +
      '<div id="rf-feyn-model" class="rf-model stack-sm" hidden><p class="rf-tag">A model explanation</p><p>' + inline(fy.model || '') + '</p>' +
      '<p class="small muted">Yours does not need to match it. Borrow one plain phrase you like, then improve your own.</p></div>' +
      '<div class="stack-sm"><p class="small"><strong>AI check (optional)</strong> AI-based explanation assessment: a tutor reads your explanation against the key ideas and says what is right, missing or wrong.</p>' +
      ST.aiHTML('fey-' + m.id, 'Ask Gemini to check my explanation', 'your explanation') + '</div></section>';
  }
  function bindFeyn(m, fy, root) {
    var ta = root.querySelector('#rf-feyn-text'), st = root.querySelector('#rf-feyn-st'), out = root.querySelector('#rf-feyn-out'), live = root.querySelector('#rf-feyn-live');
    var mb = root.querySelector('#rf-feyn-model-btn'), model = root.querySelector('#rf-feyn-model');
    var save = function () {
      var v = ta.value.slice(0, FEYN_MAX), e = reflOf(m.id);
      if (!(e && e.feyn === v)) editRefl(m.id, function (x, t) { x.feyn = v; x.fAt = t; });
      if (st.isConnected) st.textContent = 'Saved';
    };
    ta.addEventListener('input', function () { st.textContent = 'Saving…'; later('feyn:' + m.id, save, 600); });
    root.querySelector('#rf-feyn-check').addEventListener('click', function () {
      flush('feyn:' + m.id);
      var text = ta.value.slice(0, FEYN_MAX);
      if (!text.trim()) { out.innerHTML = '<p class="small rf-warn">Write your explanation in the box first, then check it.</p>'; announce(live, 'Write your explanation in the box first, then check it.'); focusEl(ta); return; }
      var hits = ideaHits(fy, text), n = hits.filter(Boolean).length, total = hits.length;
      var stats = textStats(text), range = sentenceRange(fy.prompt), jar = jargonIn(fy, text);
      var missing = fy.keyIdeas.filter(function (k, i) { return !hits[i]; });
      var tooShort = !!range && stats.sentences < range[0];
      var msg, len = '';
      if (tooShort) msg = '<strong>Write it as full sentences first.</strong> The task asks for ' + range[0] + ' to ' + range[1] + ' sentences and you wrote ' + stats.sentences + '. Key words on their own do not explain anything to a listener: say what each idea means and why it matters.';
      else if (n === 0) msg = '<strong>You have made a start, and writing it down is the hardest part.</strong> The checker did not find words linked to any of the key ideas yet. Begin with the first one below in one plain sentence, then add the next.';
      else if (n < total) msg = '<strong>Your explanation mentions ' + n + ' of ' + total + ' key ideas.</strong> To make it complete, add one plain sentence about this: ' + inline(missing[0].idea);
      else msg = '<strong>Your explanation mentions all ' + total + ' key ideas.</strong> Now make sure each one is right: compare it with the model explanation, or ask an AI tutor below. Then read it aloud as if to your listener and swap any word they would not know.';
      if (range && !tooShort) {
        if (stats.sentences > range[1]) len = 'You wrote ' + stats.sentences + ' sentences; the task asks for ' + range[0] + ' to ' + range[1] + '. Try to say it in fewer: shorter is clearer.';
        else len = 'The length is right: ' + stats.sentences + ' sentences (the task asks for ' + range[0] + ' to ' + range[1] + ').';
      }
      out.innerHTML = '<p>' + msg + '</p>' +
        '<div class="lab-stats rf-stats"><div class="stat"><div class="k">Key ideas mentioned</div><div class="v num">' + n + ' of ' + total + '</div></div>' +
        '<div class="stat"><div class="k">Sentences</div><div class="v num">' + stats.sentences + '</div></div>' +
        '<div class="stat"><div class="k">Words</div><div class="v num">' + stats.words + '</div></div></div>' +
        (len ? '<p class="small">' + esc(len) + '</p>' : '') +
        '<ul class="rf-ideas">' + fy.keyIdeas.map(function (k, i) {
          return '<li class="' + (hits[i] ? 'is-on' : '') + '">' + (hits[i] ? '<span class="chip chip-ok">✓ Mentioned</span>' : '<span class="chip">Not yet</span>') + '<span>' + inline(k.idea) + '</span></li>';
        }).join('') + '</ul>' +
        (jar.length ? '<div class="stack-sm"><p class="small"><strong>Did you explain these in plain words?</strong> You used these technical words. Make sure each one is explained, or swap it for an everyday word.</p><div class="row">' +
          jar.map(function (j) { return '<span class="chip chip-en-in">' + esc(j) + '</span>'; }).join('') + '</div></div>' : '<p class="small">No technical words from this module\'s list: good for a beginner listener.</p>') +
        '<p class="small rf-caveat"><strong>What this check can and cannot do:</strong> it only looks for words linked to each key idea. It cannot tell a right explanation from a wrong one, and it can miss an idea you put in other words. To be sure, compare with the model explanation or use the AI check below.</p>';
      announce(live, tooShort ? 'Checked. The task asks for ' + range[0] + ' to ' + range[1] + ' sentences and you wrote ' + stats.sentences + '. Details below.'
        : 'Checked. Your explanation mentions ' + n + ' of ' + total + ' key ideas. Details below.');
      editRefl(m.id, function (x, t) { x.feyn = text; x.ideas = n; x.fAt = t; });
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
      methodLine(ST.sans('manana') + ', through Socratic questioning', 'manana', 'Manana') +
      '<p class="small">Answer each question in your own words before you open the hint or the model answer. Each step builds on the one before, so go in order.</p></div>' +
      '<ol class="rf-ladder">' + soc.map(function (s, i) {
        var id = 'rf-soc-' + i, n = i + 1;
        return '<li class="rf-step" data-i="' + i + '">' +
          '<div class="row-between"><span class="small muted num">Step ' + n + ' of ' + soc.length + '</span><span class="chip rf-step-st" id="' + id + '-st"></span></div>' +
          '<p class="rf-q" id="' + id + '-q"><strong>' + inline(s.q) + '</strong></p>' +
          '<label class="small" for="' + id + '">Your answer<span class="visually-hidden"> to step ' + n + '</span></label>' +
          '<textarea id="' + id + '" rows="3" maxlength="' + SOC_MAX + '" aria-describedby="' + id + '-q ' + id + '-st">' + esc(ans[i] || '') + '</textarea>' +
          '<div class="rf-folds">' +
          (s.hint ? '<details class="fold rf-fold"><summary>Hint' + vh(' for step ' + n) + '</summary><div><p>' + inline(s.hint) + '</p></div></details>' : '') +
          (s.answer ? '<details class="fold rf-fold"><summary>Show model answer' + vh(' for step ' + n) + '</summary><div><p>' + inline(s.answer) + '</p></div></details>' : '') + '</div>' +
          ST.aiHTML('soc-' + m.id + '-' + i, 'Ask Gemini about my step ' + n + ' answer', 'your step ' + n + ' answer') +
          '</li>';
      }).join('') + '</ol>' +
      '<p class="small muted" id="rf-soc-sum"></p><p class="visually-hidden" aria-live="polite" id="rf-soc-live"></p></section>';
  }
  function bindSoc(m, soc, root) {
    var steps = Array.prototype.slice.call(root.querySelectorAll('.rf-step'));
    var tas = steps.map(function (li) { return li.querySelector('textarea'); });
    var sum = root.querySelector('#rf-soc-sum'), live = root.querySelector('#rf-soc-live'), lastDone = null;
    function state() {
      var vals = tas.map(function (t) { return !!t.value.trim(); }), k = vals.indexOf(false), done = vals.filter(Boolean).length;
      steps.forEach(function (li, i) {
        var s = vals[i] ? 'done' : (k < 0 || i <= k) ? 'now' : 'later';
        li.classList.toggle('is-done', s === 'done'); li.classList.toggle('is-now', s === 'now'); li.classList.toggle('is-later', s === 'later');
        li.querySelector('.rf-step-st').textContent = s === 'done' ? '✓ Answered' : s === 'now' ? 'Your step now' : 'After step ' + (k + 1);
      });
      var text = done === soc.length ? 'You have answered every step. Open the model answers and compare, or ask an AI to question you further.' : done + ' of ' + soc.length + ' steps answered.';
      sum.textContent = text;
      if (lastDone !== null && done !== lastDone) announce(live, text); // only changes the learner makes are announced
      lastDone = done;
    }
    tas.forEach(function (ta, i) {
      ta.addEventListener('input', function () {
        state();
        later('soc:' + m.id + ':' + i, function () {
          var v = ta.value.slice(0, SOC_MAX), e = reflOf(m.id);
          if (e && (e.soc || [])[i] === v) return;
          editRefl(m.id, function (x, t) { var a = five(x.soc), s = five(x.sAt); a[i] = v; s[i] = t; x.soc = a; x.sAt = s; });
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
      methodLine(ST.sans('japa'), 'japa', 'Japa') +
      '<p class="small">Japa is the devotional repetition of a mantra or a sacred name in Hindu, Buddhist, Jain and Sikh practice. This site borrows only its calm, repeated form, not the religious practice: here you say what each key term of this module means, check, and go round again. Three calm rounds.</p></div>' +
      (terms.length ? '<div class="rf-japa-stage stack-sm" id="rf-japa-stage"></div>' +
        '<div class="row-between small muted"><span id="rf-japa-reps" class="num">Repetitions: 0</span><span id="rf-japa-best" class="num">' + (e.japa ? 'Best last round: ' + Math.min(e.japa, terms.length) + ' of ' + terms.length : '') + '</span></div>' +
        '<p class="visually-hidden" aria-live="polite" id="rf-japa-live"></p>' : '<p class="small muted">Key terms for this module are coming soon.</p>') +
      '</section>';
  }
  function bindJapa(m, terms, root) {
    var stage = root.querySelector('#rf-japa-stage'), live = root.querySelector('#rf-japa-live');
    var repsEl = root.querySelector('#rf-japa-reps'), bestEl = root.querySelector('#rf-japa-best');
    var N = terms.length, J = { round: 0, list: [], i: 0, shown: false, known: 0, miss: [], r1miss: [], reps: 0 };
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
        // the term and its meaning are announced once by the live region; the buttons carry no extra description
        h = head() + '<p class="rf-term" id="rf-japa-term">' + esc(t.term) + '</p>' +
          (J.shown ? '<div class="rf-ans"><p><span class="rf-tag">Meaning</span> ' + inline(t.meaning || '') + '</p></div>' +
            '<div class="row" role="group" aria-label="Did you know it?"><button type="button" class="btn btn-primary" data-j="knew" data-jf>I knew it</button><button type="button" class="btn" data-j="not">Not yet</button></div>'
            : '<p class="small">Say its meaning to yourself, slowly. Then check.</p><div><button type="button" class="btn btn-primary" data-j="show" data-jf>Show meaning</button></div>');
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
      if (J.round && J.i < J.list.length) announce(live, J.shown ? 'Meaning: ' + plain(terms[J.list[J.i]].meaning || '') : 'Term ' + (J.i + 1) + ' of ' + J.list.length + ': ' + terms[J.list[J.i]].term);
      else if (J.round) announce(live, stage.querySelector('p strong') ? stage.querySelector('p').textContent : '');
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
      methodLine(ST.sans('nididhyasana'), 'nididhyasana', 'Nididhyasana') +
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
      editRefl(m.id, function (x, t) { x.nid = a === 'done' ? ST.today() : ''; x.nAt = t; }); // nAt: the newer tick or undo wins on merge
      draw(true);
    });
    draw(false);
  }

  /* =====================================================================
     3. Watch tab: Sravana (attentive listening) with a three-line summary of the best pick
     Summaries are kept per module (C.state.sum['moduleId|resourceId']): several modules share one playlist, and each
     learns from its own part of it.
     ===================================================================== */
  var FALLBACK_CUES = ['Listen for the one main idea the speaker keeps coming back to.', 'Listen for one example you could retell to a friend.', 'Listen for one word you did not know, and how it is explained.'];
  function cuesHTML(m) { var md = ST.modData(m.id), cues = md && Array.isArray(md.sravana) && md.sravana.length ? md.sravana.slice(0, 3) : FALLBACK_CUES; return cues.map(function (c) { return '<li>' + inline(c) + '</li>'; }).join(''); }
  function sumKey(m, r) { return m.id + '|' + r.id; }
  // this module's summary. One saved before summaries were kept per module (its key is just the resource id) goes to the
  // first module that opens it; its old entry is emptied (with a fresh time, so other devices empty it too) so no other module takes it as well.
  function sumFor(m, r) {
    var map = C.state.sum || (C.state.sum = {}), k = sumKey(m, r), old = map[r.id];
    if (map[k]) return map[k];
    if (old && old.t) { var t = ST.now(); map[k] = { t: old.t, at: t }; map[r.id] = { t: '', at: t }; C.save(); return map[k]; }
    return null;
  }
  ST.on('watch', function (m, el) {
    var draw = function () {
      var host = el.querySelector('.stack-lg') || el; if (!el.isConnected || host.querySelector('#rf-srav')) return;
      var A = APP(), best = A.mainPicks(m).main, sum = best ? sumFor(m, best) : null, key = best ? sumKey(m, best) : '';
      var shared = !!best && ST.sharedBy && ST.sharedBy(best.id) > 1;
      var panel = document.createElement('section');
      panel.className = 'card stack-sm rf-srav'; panel.id = 'rf-srav'; panel.setAttribute('aria-labelledby', 'rf-srav-h');
      if (best) panel.setAttribute('data-res', best.id);
      panel.innerHTML = '<h2 class="h-sub" id="rf-srav-h">Listen with attention</h2>' + methodLine(ST.sans('sravana'), 'sravana', 'Sravana') +
        '<p class="small">Read these before you press play and give the video your full attention. Afterwards, write what you heard from memory.</p>' +
        '<div class="rf-srav-grid"><ul class="rf-listen small" id="rf-srav-cues">' + cuesHTML(m) + '</ul>' +
        (best ? '<div class="stack-sm rf-sum"><label for="rf-sum-text" class="small"><strong>After watching, write what you heard</strong> <span class="muted">(three lines about ' +
          (shared ? 'what “' + esc(best.title) + '” teaches for ' + esc(A.modNo(m) + ' ' + m.title) : '“' + esc(best.title) + '”') + ')</span></label>' +
          '<textarea id="rf-sum-text" rows="3" maxlength="' + SUM_MAX + '" aria-describedby="rf-sum-st" placeholder="1. The main idea…&#10;2. An example…&#10;3. One new word…">' + esc(sum ? sum.t : '') + '</textarea>' +
          '<span class="small muted" id="rf-sum-st">' + (sum && sum.t ? 'Saved' : 'Saved as you type') + '</span></div>' : '') + '</div>' +
        '<p class="visually-hidden" aria-live="polite" id="rf-srav-live"></p>';
      host.insertBefore(panel, host.firstChild);
      if (!best) return;
      var ta = panel.querySelector('#rf-sum-text'), st = panel.querySelector('#rf-sum-st');
      var save = function () {
        var v = ta.value.slice(0, SUM_MAX), map = C.state.sum || (C.state.sum = {}), cur = map[key];
        if ((cur ? cur.t : '') !== v) { map[key] = { t: v, at: ST.now() }; C.save(); }
        if (st.isConnected) st.textContent = 'Saved';
      };
      ta.addEventListener('input', function () { panel.classList.remove('rf-glow'); clearGo(); st.textContent = 'Saving…'; later('sum:' + key, save, 600); });
      flushOnLeave();
    };
    if (ST.modData(m.id)) draw(); else ST.ensureModule(m.id).then(draw, draw);
  });
  // a "Write what you heard" button next to the box the learner ticked: the page and the focus stay where they are
  function clearGo() { Array.prototype.forEach.call(document.querySelectorAll('.rf-srav-go'), function (x) { x.remove(); }); }
  function offerGo(box, panel, ta) {
    clearGo();
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'btn btn-sm rf-srav-go';
    b.innerHTML = 'Write what you heard <span aria-hidden="true">↑</span>';
    (box.closest('label') || box).insertAdjacentElement('afterend', b);
    b.addEventListener('click', function () {
      clearGo();
      try { panel.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }); } catch (e) { panel.scrollIntoView(); }
      focusEl(ta);
    });
  }
  ST.on('watched', function (rid, on) {
    var panel = document.getElementById('rf-srav');
    if (!panel || !panel.isConnected || panel.getAttribute('data-res') !== rid) return;
    if (!on) { clearGo(); panel.classList.remove('rf-glow'); return; }
    var ta = panel.querySelector('#rf-sum-text'), st = panel.querySelector('#rf-sum-st');
    if (!ta || ta.value.trim()) return;
    panel.classList.add('rf-glow');
    if (st) st.textContent = 'You finished it: write what you heard while it is fresh.';
    var a = document.activeElement, byHand = !!(a && a.matches && a.matches('input[data-action="watched"]') && a.getAttribute('data-id') === rid);
    if (byHand) offerGo(a, panel, ta);
    announce(panel.querySelector('#rf-srav-live'), byHand ? 'Best pick finished. Write what you heard while it is fresh: the button is next to the box you ticked.'
      : 'You finished the best pick. The box to write what you heard is at the top of this tab.');
  });
})();
