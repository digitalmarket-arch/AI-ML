/* AI Marg app: router + views. Data comes from data/*.js (window.AIM). */
(function () {
  'use strict';
  var C = window.AIM_CORE, R = window.AIM_RUNNER, D = window.AIM || {};
  var esc = C.esc, inline = C.inline, md = C.md;
  ['levels', 'modules', 'resources', 'exercises', 'projects', 'glossary'].forEach(function (k) { if (!Array.isArray(D[k])) D[k] = []; });
  D.quizzes = D.quizzes || {}; D.pages = D.pages || {}; D.site = D.site || {};
  var LABS = {};
  (D.labs || []).forEach(function (l) { LABS[l.id] = l; });
  var labLoads = {};
  function ensureLab(id) {
    if (window.AILabs && window.AILabs[id]) return Promise.resolve(window.AILabs[id]);
    if (labLoads[id]) return labLoads[id];
    labLoads[id] = new Promise(function (resolve, reject) {
      var sc = document.createElement('script');
      sc.src = 'assets/js/labs/' + id + '.js';
      sc.onload = function () { if (window.AILabs && window.AILabs[id]) resolve(window.AILabs[id]); else reject(new Error('lab did not register')); };
      sc.onerror = function () { delete labLoads[id]; reject(new Error('could not download the lab')); };
      document.head.appendChild(sc);
    });
    return labLoads[id];
  }
  // diagrams for a module's reading live in assets/figures/<module>.js and load only when the Overview is opened
  var figLoads = {};
  function ensureFigures(mid) {
    if (window.AIFigures && window.AIFigures[mid]) return Promise.resolve(window.AIFigures[mid]);
    if (figLoads[mid]) return figLoads[mid];
    figLoads[mid] = new Promise(function (resolve) {
      var sc = document.createElement('script');
      sc.src = 'assets/figures/' + mid + '.js';
      sc.onload = function () { resolve((window.AIFigures && window.AIFigures[mid]) || []); };
      sc.onerror = function () { delete figLoads[mid]; resolve([]); };
      document.head.appendChild(sc);
    });
    return figLoads[mid];
  }
  var SAFE_SVG = function (svg) { return typeof svg === 'string' && /^\s*<svg[\s>]/i.test(svg) && !/<script|<foreignObject|\son[a-z]+\s*=|javascript:|(?:xlink:)?href\s*=\s*["']?(?!#)/i.test(svg); };
  function placeFigures(m, el) {
    // the Overview drawn now: if the learner switches tab (or the page is redrawn) before the diagram file arrives,
    // this content is gone and the diagrams must not land in whatever the panel shows by then
    var view = el.firstElementChild;
    ensureFigures(m.id).then(function (figs) {
      if (!view || !view.isConnected || view.parentNode !== el || !figs || !figs.length) return;
      el = view;
      var lastAt = {}; // figures that share an anchor keep their file order
      figs.forEach(function (f, i) {
        if (!SAFE_SVG(f.svg)) return;
        var fig = document.createElement('figure');
        fig.className = 'fig';
        fig.innerHTML = '<div class="fig-art">' + f.svg + '</div><figcaption><strong>' + esc(f.title || '') + '</strong>' + (f.caption ? ' ' + inline(f.caption) : '') + '</figcaption>';
        var svg = fig.querySelector('svg');
        if (svg) {
          svg.removeAttribute('width'); svg.removeAttribute('height');
          svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', f.alt || f.title || 'Diagram'); svg.setAttribute('focusable', 'false');
        }
        var key = el.querySelector('[data-sec="' + (f.after || 'overview') + '"]') ? (f.after || 'overview') : 'overview';
        var sec = el.querySelector('[data-sec="' + key + '"]'), inCard = sec && (sec.querySelector('.fig-slot') || sec.querySelector('.read-body'));
        var anchor = lastAt[key] || (inCard ? null : sec);
        if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(fig, anchor.nextSibling);
        else if (inCard) inCard.appendChild(fig);
        else return; // no lesson card to hold it
        lastAt[key] = fig;
      });
    });
  }
  var S = function () { return C.state; };
  var main = document.getElementById('main');
  var ST = function () { return window.AIM_STUDY || null; };
  var SPK = window.AIM_SPEAK || { btn: function () { return ''; }, stop: function () {} };
  var currentCleanup = [];

  /* ---------- indexes ---------- */
  var modById = {}, resById = {}, exById = {}, projById = {}, levelById = {};
  D.levels.forEach(function (l) { levelById[l.id] = l; });
  D.modules.forEach(function (m, i) { modById[m.id] = m; m._i = i; });
  D.resources.forEach(function (r) {
    resById[r.id] = r;
    if (!r.videoId && !r.listId) { var ids = C.ytIds(r.url); r.videoId = r.videoId || ids.videoId; r.listId = r.listId || ids.listId; }
    if (!r.videoId && r.firstVideoUrl) r.videoId = C.ytIds(r.firstVideoUrl).videoId;
    // a course hosted on another site that plays here only through its YouTube intro: that video is a preview, so it
    // is never tracked or ticked (the course is ticked by hand)
    r.intro = !!(r.videoId && !r.listId && !/youtube\.com|youtu\.be/.test(r.url || ''));
    // a resource in a few separate videos plays them as one small playlist (ids checked like videoId)
    if (r.parts && !(Array.isArray(r.parts) && r.parts.length > 1 && r.parts.every(function (x) { return /^[A-Za-z0-9_-]{11}$/.test(x); }))) delete r.parts;
  });
  D.exercises.forEach(function (e) { exById[e.id] = e; });
  D.projects.forEach(function (p) { projById[p.id] = p; });
  function modulesOf(lv) { return D.modules.filter(function (m) { return m.level === lv; }); }
  function exOf(mid) { return D.exercises.filter(function (e) { return e.moduleId === mid; }); }
  function labOf(m) { return m.lab && LABS[m.lab] ? LABS[m.lab] : null; }
  function modNo(m) { var list = modulesOf(m.level); return m.level + '.' + (list.indexOf(m) + 1); }
  function levelName(lv) { var l = levelById[lv]; return l ? l.name : 'Level ' + lv; }

  /* ---------- progress maths ---------- */
  /* ---------- lesson cards: the Overview tab is a stack of cards, each with a "Got it" tick ---------- */
  var READ_SECS = [['overview', 'The big idea'], ['outcomes', 'You will be able to'], ['studySteps', 'Study plan'], ['keyTerms', 'Key terms'], ['indiaExample', 'In India'], ['commonMistakes', 'Common mistakes'], ['selfCheck', 'Check yourself (open tasks)']];
  function readCards(m) {
    return READ_SECS.filter(function (x) { var v = m[x[0]]; return x[0] === 'overview' || (Array.isArray(v) ? v.length > 0 : !!v); }).map(function (x) { return { key: x[0], title: x[1] }; });
  }
  // read['moduleId/cardKey'] holds when a card was ticked, or '-' + when it was un-ticked (see core.js normalize)
  function readOn(mid, key) { var v = S().read[mid + '/' + key]; return !!v && String(v).charAt(0) !== '-'; }
  function readDone(m) { return readCards(m).filter(function (c) { return readOn(m.id, c.key); }).length; }
  var READ_PART = 'Read the lesson cards';
  // learners who finished every other part of a module before lesson cards existed keep their 100%:
  // their cards are ticked once (re-checked after a restore brings in an older copy)
  function migrateRead() {
    var st = S(); if (st.prefs.readMig) return;
    var stamp = new Date().toISOString();
    D.modules.forEach(function (m) {
      var others = moduleParts(m).filter(function (p) { return p.k !== READ_PART; });
      if (!others.length || !others.every(function (p) { return p.done; })) return;
      if (readCards(m).some(function (c) { return st.read[m.id + '/' + c.key]; })) return;
      readCards(m).forEach(function (c) { st.read[m.id + '/' + c.key] = stamp; });
    });
    st.prefs.readMig = 1; C.save();
  }
  function listHTML(arr, ordered) {
    var tag = ordered ? 'ol' : 'ul';
    return '<' + tag + '>' + (arr || []).map(function (x) { return '<li>' + inline(modLinks(x)) + '</li>'; }).join('') + '</' + tag + '>';
  }
  // Course text sometimes names a module by its internal id ("Python basics from l1-python help…"). Learners see the
  // module's number and name instead, as a link: "[1.2 Python from Zero](#m-l1-python)", which inline() then draws.
  // Ids that are already link targets (#m-l1-python) or part of a web address are left alone.
  function modLinks(s) {
    return String(s == null ? '' : s).replace(/(^|[^\w#\/.-])(l\d-[a-z0-9]+(?:-[a-z0-9]+)*)/g, function (all, pre, id) {
      var rest = '';
      while (!modById[id] && id.lastIndexOf('-') > 2) { rest = id.slice(id.lastIndexOf('-')) + rest; id = id.slice(0, id.lastIndexOf('-')); }
      var mm = modById[id];
      return mm ? pre + '[' + modNo(mm) + ' ' + String(mm.title).replace(/[[\]]/g, '') + '](#m-' + id + ')' + rest : all;
    });
  }
  function readBtnHTML(m, key, done) {
    var title = (READ_SECS.filter(function (x) { return x[0] === key; })[0] || [key, key])[1];
    return '<button type="button" class="btn btn-sm read-btn' + (done ? ' is-on' : ' btn-primary') + '" data-action="read-card" data-id="' + esc(m.id) + '" data-key="' + esc(key) + '" aria-pressed="' + done + '" aria-label="Got it: ' + esc(title) + '" aria-describedby="read-hint-' + esc(key) + '">' + (done ? '<span aria-hidden="true">✓ </span>' : '') + 'Got it</button>' +
      '<span class="small muted" id="read-hint-' + esc(key) + '">' + (done ? 'Read. Press again if you want to come back to it.' : 'Press when you have understood this card.') + '</span>';
  }
  function readCardHTML(m, c, i, n, body, done) {
    return '<section class="card read-card stack-sm' + (done ? ' is-read' : '') + '" data-sec="' + esc(c.key) + '" id="read-' + esc(c.key) + '" aria-labelledby="read-h-' + esc(c.key) + '">' +
      '<div class="read-head"><h2 class="h-sub" id="read-h-' + esc(c.key) + '" tabindex="-1">' + esc(c.title) + '</h2><span class="read-tools">' + SPK.btn('.read-card', 'Listen to this card: ' + c.title) + '<span class="small muted num tts-skip">Card ' + (i + 1) + ' of ' + n + '</span></span></div>' +
      '<div class="read-body prose stack-sm">' + body + '<div class="fig-slot"></div><div class="ex-slot" data-ex="' + esc(c.key) + '"></div></div>' +
      '<div class="read-foot">' + readBtnHTML(m, c.key, done) + '</div></section>';
  }
  // a text field may hold several paragraphs, separated by a blank line
  function parasHTML(s) {
    return String(s || '').split(/\n\s*\n/).map(function (p) { return p.trim(); }).filter(Boolean).map(function (p) { return '<p>' + inline(modLinks(p)) + '</p>'; }).join('');
  }
  // short everyday examples under a card's text and diagrams. They live in data/examples/<module>.js and load with the
  // lesson cards (data/course.js loads on every page, so it stays small); a module may also hold them inline
  var exLoads = {};
  function ensureExamples(m) {
    if (m.examples && typeof m.examples === 'object') return Promise.resolve(m.examples);
    var X = window.AIM && window.AIM.examples;
    if (X && X[m.id]) return Promise.resolve(X[m.id]);
    if (exLoads[m.id]) return exLoads[m.id];
    exLoads[m.id] = new Promise(function (resolve) {
      var sc = document.createElement('script');
      sc.src = 'data/examples/' + m.id + '.js';
      sc.onload = function () { resolve((window.AIM.examples || {})[m.id] || null); };
      sc.onerror = function () { delete exLoads[m.id]; resolve(null); };
      document.head.appendChild(sc);
    });
    return exLoads[m.id];
  }
  function placeExamples(m, el) {
    var view = el.firstElementChild; // as with the diagrams: only into the Overview drawn now
    ensureExamples(m).then(function (all) {
      if (!all || !view || !view.isConnected || view.parentNode !== el) return;
      Array.prototype.forEach.call(view.querySelectorAll('.ex-slot[data-ex]'), function (slot) { if (!slot.firstChild) slot.innerHTML = examplesHTML(all[slot.getAttribute('data-ex')]); });
    });
  }
  function examplesHTML(ex) {
    if (!Array.isArray(ex) || !ex.length) return '';
    return '<div class="ex-block"><h3 class="ex-h">Examples <span class="ex-hi">(उदाहरण, udaharan)</span></h3><ol class="ex-list" role="list">' + ex.map(function (x, j) {
      var t = typeof x === 'string' ? { text: x } : (x || {});
      return '<li data-tts-prefix="Example ' + (j + 1) + '.">' + (t.title ? '<strong class="ex-t">' + inline(t.title) + '</strong> ' : '') + inline(modLinks(t.text || '')) + '</li>';
    }).join('') + '</ol></div>';
  }
  function readProgressInner(m) {
    var cards = readCards(m), n = cards.length, d = readDone(m);
    var next = cards.filter(function (c) { return !readOn(m.id, c.key); })[0];
    return '<div class="row-between"><strong>Lesson cards read: <span class="num">' + d + ' of ' + n + '</span></strong><span class="row">' +
      SPK.btn('.read-cards', 'Listen to all the lesson cards', { text: 'Listen to all cards' }) +
      (next && d ? '<button type="button" class="btn btn-sm" data-action="read-next" data-id="' + esc(m.id) + '">Next unread card ↓</button>' : '') + '</span></div>' +
      bar(n ? Math.round(d / n * 100) : 0, 'Lesson cards read') +
      '<p class="small muted">' + (n && d === n ? 'You have read every card in this lesson. Next: <a href="#m-' + esc(m.id) + '~watch">watch the best pick</a>.' : 'Read each card, then press <strong>Got it</strong> at its end. Your ticks count towards this module\'s progress and are saved like the rest of it.') + '</p>';
  }
  // after "Got it": scroll to the next unread card (wrapping to the top), or to the summary when all are read
  function readGoNext(mid, afterKey) {
    var m = modById[mid]; if (!m) return;
    var cards = readCards(m), i0 = afterKey ? cards.map(function (c) { return c.key; }).indexOf(afterKey) + 1 : 0;
    var next = cards.slice(i0).concat(cards.slice(0, i0)).filter(function (c) { return !readOn(mid, c.key); })[0];
    var box = document.getElementById(next ? 'read-' + next.key : 'read-progress'), focusEl = next ? document.getElementById('read-h-' + next.key) : box;
    if (!box || !focusEl) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    box.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    try { focusEl.focus({ preventScroll: true }); } catch (e) { focusEl.focus(); }
  }
  // redraw the ticks and the summary in place (after a tick here, or progress arriving from another device)
  function readRefresh(m, live) {
    var box = document.getElementById('read-progress'); if (!m || !box) return;
    var refocus = function (el) { if (el) { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } } };
    readCards(m).forEach(function (c) {
      var card = document.getElementById('read-' + c.key), on = readOn(m.id, c.key); if (!card) return;
      var f = card.querySelector('.read-foot'), btn = f && f.querySelector('.read-btn');
      if (card.classList.contains('is-read') === on && btn && btn.getAttribute('aria-pressed') === String(on)) return;
      var hadFocus = f && f.contains(document.activeElement);
      card.classList.toggle('is-read', on);
      if (f) { f.innerHTML = readBtnHTML(m, c.key, on); if (hadFocus) refocus(f.querySelector('.read-btn')); }
    });
    // redraw the summary only when it changed, and keep keyboard focus on the same control
    var html = readProgressInner(m);
    if (box._html !== html) {
      var ae = document.activeElement, inBox = box.contains(ae) && ae !== box, act = inBox && ae.getAttribute('data-action'), href = inBox && ae.getAttribute('href');
      box.innerHTML = html; box._html = html;
      if (inBox) refocus((act && box.querySelector('[data-action="' + act + '"]')) || (href && box.querySelector('a[href="' + href + '"]')) || box);
    }
    var lv = document.getElementById('read-live'); if (lv && live) lv.textContent = live;
  }
  function moduleParts(m) {
    var st = S(), parts = [];
    var rc = readCards(m);
    if (rc.length) { var rd = readDone(m); parts.push({ k: READ_PART, done: rd === rc.length, n: rd, of: rc.length }); }
    // the watch step counts as done when the best pick, or any video or course marked Recommended, is finished
    // (for this module: see isTicked)
    var mp = mainPicks(m);
    if (mp.main) {
      var w = mp.list.some(function (r) { return isTicked(m.id, r) && (r === mp.main || isRecommended(mp, r)); });
      parts.push({ k: 'Watch the main lesson', done: w, n: w ? 1 : 0, of: 1 });
    }
    var lab = labOf(m);
    if (lab) { var t = lab.tasks || [], dn = t.filter(function (x) { return st.labs[lab.id] && st.labs[lab.id][x.id]; }).length; parts.push({ k: 'Lab tasks', done: dn === t.length && t.length > 0, n: dn, of: t.length }); }
    var ex = exOf(m.id).filter(function (e) { return !e.optional; });
    if (ex.length) { var sv = ex.filter(function (e) { return st.ex[e.id] && st.ex[e.id].done; }).length; parts.push({ k: 'Practice exercises', done: sv === ex.length, n: sv, of: ex.length }); }
    var qz = D.quizzes[m.id];
    if (qz && qz.length) { var b = st.quiz[m.id] ? st.quiz[m.id].best : 0; parts.push({ k: 'Quiz (70% to pass)', done: b >= 70, n: b, of: 100, pctLike: true }); }
    return parts;
  }
  function moduleProgress(m) {
    if (S().modules[m.id] && S().modules[m.id].done) return 100;
    var parts = moduleParts(m);
    if (!parts.length) return 0;
    // a finished part counts in full (a quiz passed with 70-99% is finished), an unfinished one by how far it got;
    // 100% (and the ✓ on the roadmap) only when every part is finished, never by rounding
    var sum = 0, all = true;
    parts.forEach(function (p) { if (!p.done) all = false; sum += p.done ? 1 : p.of ? Math.min(1, p.n / p.of) : 0; });
    return all ? 100 : Math.min(99, Math.round(sum / parts.length * 100));
  }
  // a level = its modules (80%) + passing the level test (10%) + finishing one project (10%)
  function levelRaw(lv) {
    var ms = modulesOf(lv); if (!ms.length) return 0;
    var s = 0; ms.forEach(function (m) { s += moduleProgress(m); });
    var t = S().quiz['test-l' + lv], testDone = t && t.best >= 70 ? 1 : 0;
    var projDone = D.projects.some(function (p) { return p.level === lv && S().projects[p.id] && S().projects[p.id].done; }) ? 1 : 0;
    return (s / ms.length) * 0.8 + testDone * 10 + projDone * 10;
  }
  function levelProgress(lv) { var raw = levelRaw(lv); return raw >= 100 ? 100 : Math.min(99, Math.round(raw)); } // "done" only when everything in the level is done
  // the whole course, Level 1 (beginner) to Level 4 (advanced): every level counts for a quarter
  function overallProgress() { var s = 0; D.levels.forEach(function (l) { s += levelProgress(l.id); }); return !D.levels.length ? 0 : s >= D.levels.length * 100 ? 100 : Math.min(99, Math.round(s / D.levels.length)); }
  function courseRaw() { var s = 0; D.levels.forEach(function (l) { s += levelRaw(l.id); }); return D.levels.length ? s / D.levels.length : 0; }
  // as text: a learner who has started sees "<1%", not "0%"
  function courseText() { var p = overallProgress(); return p === 0 && courseRaw() > 0 ? '<1%' : p + '%'; }
  function levelText(lv) { var p = levelProgress(lv); return p === 0 && levelRaw(lv) > 0 ? '<1%' : p + '%'; }
  function pctWords(t) { return t === '<1%' ? 'less than 1%' : t; }

  /* ---------- resources for a module ---------- */
  var VIDEO_TYPES = { playlist: 1, video: 1, course: 1, channel: 1 };
  var STATUS_RANK = { verified: 0, partial: 1, unverified: 2 };
  function watchList(m) {
    var curated = (m.watch || []).map(function (w) { return w.id; });
    var list = D.resources.filter(function (r) { return (r.modules || []).indexOf(m.id) >= 0; });
    return list.sort(function (a, b) {
      var ca = curated.indexOf(a.id), cb = curated.indexOf(b.id);
      var la = C.langRank(a.language), lb = C.langRank(b.language);
      if (la !== lb) return la - lb;
      if (ca !== cb) return (ca < 0 ? 999 : ca) - (cb < 0 ? 999 : cb);
      var va = VIDEO_TYPES[a.type] ? 0 : 1, vb = VIDEO_TYPES[b.type] ? 0 : 1;
      if (va !== vb) return va - vb;
      return (STATUS_RANK[a.status] || 0) - (STATUS_RANK[b.status] || 0);
    });
  }
  var isHiLang = function (r) { return r.language === 'hindi' || r.language === 'hinglish'; };
  function langGroup(r) { return isHiLang(r) ? 'hi' : r.language === 'indian-english' ? 'in' : 'en'; }
  // the best pick: pinned per module (m.best, chosen by review) or the first confirmed video from the curated list;
  // Hindi, Hinglish and Indian English count equally
  function mainPicks(m) {
    var list = watchList(m);
    var curated = (m.watch || []).map(function (w) { return w.id; });
    var isVideo = function (r) { return r.type === 'playlist' || r.type === 'video'; };
    var indian = function (r) { return langGroup(r) !== 'en'; };
    var good = function (r) { return curated.indexOf(r.id) >= 0 && r.status === 'verified'; };
    var first = function (pred) { return list.filter(pred)[0] || null; };
    var pinnedId = m.best || ((m.watch || []).filter(function (w) { return w.main; })[0] || {}).id;
    var best = (pinnedId ? first(function (r) { return r.id === pinnedId; }) : null) ||
      first(function (r) { return isVideo(r) && indian(r) && good(r); }) ||
      first(function (r) { return isVideo(r) && indian(r) && r.status === 'verified'; }) ||
      first(function (r) { return isVideo(r) && r.status !== 'unverified'; }) || first(isVideo) ||
      first(function (r) { return VIDEO_TYPES[r.type]; }) || list[0] || null;
    return { list: list, main: best, curated: curated };
  }
  function noteFor(m, r) { var w = (m.watch || []).filter(function (x) { return x.id === r.id; })[0]; return w ? w.note : ''; }
  // Marked Recommended (and counted for the watch step): a video or course from the module's reviewed list. Recommended
  // books, articles, tools and practice sites stay first among the other options, without the mark.
  function isRecommended(mp, r) { return mp.curated.indexOf(r.id) >= 0 && !!VIDEO_TYPES[r.type]; }

  /* ---------- ticks and video places, per module for a shared playlist ---------- */
  // A playlist that is the best pick or a Recommended option of several modules, each module's note naming its own part
  // ("watch Days 24-33"), is ticked and resumed per module on module pages: watched['<module>|<resource>'] and
  // pos['<module>|<resource>']. The Library (no module) uses the resource itself, and a tick there (or from before this
  // change) means the whole playlist: it counts for every module. Such a playlist never ticks itself on a module page:
  // the site cannot know where a module's part ends.
  var sharedRes = null;
  function isShared(r) {
    if (!sharedRes) {
      var n = {}; sharedRes = {};
      D.modules.forEach(function (m) { var mp = mainPicks(m); mp.list.forEach(function (x) { if (x.listId && (x === mp.main || isRecommended(mp, x))) n[x.id] = (n[x.id] || 0) + 1; }); });
      Object.keys(n).forEach(function (id) { if (n[id] > 1) sharedRes[id] = 1; });
    }
    return !!(r && sharedRes[r.id]);
  }
  // the key of a resource's tick and place: on a module page (mid) a shared playlist has its own key there
  function tickKey(mid, r) { return mid && modById[mid] && isShared(r) ? mid + '|' + r.id : r.id; }
  function isTicked(mid, r) { var w = S().watched; return !!(r && (w[r.id] || (mid && isShared(r) && w[mid + '|' + r.id]))); }
  // a learner's tick or un-tick of "I finished this" (mid: the module page it was on, if any)
  function setTick(mid, rid, on) {
    var r = resById[rid], k = r ? tickKey(mid, r) : rid, st = S();
    if (on || k === rid) { C.setWatched(k, on); return; }
    // un-ticking one module's part of a playlist ticked as a whole: the other modules that use it stay ticked
    var whole = st.watched[rid];
    if (whole) {
      (r.modules || []).forEach(function (x) {
        var kx = x + '|' + rid;
        if (x !== mid && modById[x] && !st.watched[kx] && !(String(st.unwatched[kx] || '') > String(whole))) { st.watched[kx] = whole; delete st.unwatched[kx]; }
      });
      C.setWatched(rid, false);
    }
    C.setWatched(k, false);
  }
  // a saved place's key -> { r, mid } (mid: the module page it belongs to, or null for the Library)
  function placeOf(k) {
    var st = S(), cut = k.indexOf('|'), r = resById[cut > 0 ? k.slice(cut + 1) : k];
    if (!r) return null;
    if (cut > 0) return modById[k.slice(0, cut)] ? { r: r, mid: k.slice(0, cut) } : null;
    var p = st.pos[k], m = p && p.m;
    // a shared playlist's own key belongs to the Library; any other video goes back to the module it was played in
    if (isShared(r)) return { r: r, mid: null };
    return { r: r, mid: m && modById[m] && (r.modules || []).indexOf(m) >= 0 ? m : ((resModule(r) || {}).id || null) };
  }

  function resCard(r, opts) {
    opts = opts || {};
    // opts.mod: the module page the card is on (a shared playlist is ticked and resumed per module there)
    var mid = opts.mod && modById[opts.mod] ? opts.mod : null, perMod = tickKey(mid, r) !== r.id, watched = isTicked(mid, r);
    var player = opts.player && C.canEmbed(r) ? C.playerHTML(r) : '';
    var note = opts.note ? '<div class="callout small">' + inline(modLinks(opts.note)) + '</div>' : '';
    // every link not fully confirmed is marked, as README and the FAQ say: 'unverified' (link not confirmed) or
    // 'partial' (link found, but some detail such as the uploader or free audit not confirmed)
    var status = r.status === 'unverified' ? '<span class="chip chip-bad" title="We could not confirm this exact link. Use the search link if it fails.">link unconfirmed</span>' :
      r.status === 'partial' ? '<span class="chip chip-warn" title="We found this link, but could not confirm every detail. Read the Heads-up before you start.">partly confirmed</span>' : '';
    var searchUrl = 'https://www.youtube.com/results?search_query=' + encodeURIComponent((r.title || '') + ' ' + (r.creator || ''));
    var isYT = /youtube\.com|youtu\.be/.test(r.url || '');
    var embeddable = C.canEmbed(r);
    return '<article class="res-card' + (opts.featured ? ' featured' : '') + '" data-res="' + esc(r.id) + '"' + (mid ? ' data-mod="' + esc(mid) + '"' : '') + '>' + player +
      '<div class="res-meta">' + C.langChip(r.language) + '<span class="chip chip-level">' + esc(r.type) + '</span>' + (opts.recommended ? '<span class="chip chip-rec">Recommended</span>' : '') + (embeddable && !r.intro ? posChip(r, mid) : '') +
      (r.approxHours ? '<span class="chip num">~' + esc(r.approxHours) + ' h</span>' : '') +
      '<span class="chip">' + esc(r.platform || '') + '</span>' + status + '</div>' +
      '<h3 class="res-title"><a href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(r.title) + '</a></h3>' +
      '<div class="small muted">' + esc(r.creator || '') + (r.year ? ' · ' + esc(r.year) : '') + (r.cost ? ' · ' + esc(r.cost) : '') + '</div>' +
      note + (r.why ? '<p class="res-why">' + inline(r.why) + '</p>' : '') +
      (r.caveats ? '<details class="res-caveat"><summary>Heads-up</summary><p>' + inline(r.caveats) + '</p></details>' : '') +
      (perMod ? '<p class="small muted">This playlist is shared with other modules, so it does not tick itself here. Tick “I finished this” when you have finished this module\'s part.</p>' : '') +
      (r.intro && embeddable ? '<p class="small muted">Play intro plays only the course\'s YouTube introduction. The course itself is on its own site: tick it yourself when you finish it.</p>' : '') +
      '<div class="res-actions">' + (embeddable && !player ? '<button type="button" class="btn btn-sm btn-primary" data-action="play-inline" data-id="' + esc(r.id) + '" aria-expanded="false">' + playLabel(r) + '</button>' : '') +
      '<label class="watched-toggle"><input type="checkbox" data-action="watched" data-id="' + esc(r.id) + '"' + (perMod ? ' data-mod="' + esc(mid) + '"' : '') + (watched ? ' checked' : '') + '> I finished this</label>' +
      '<a class="btn btn-sm" href="' + esc(r.url) + '" target="_blank" rel="noopener">Open ' + (isYT ? 'on YouTube' : 'site') + ' ↗</a>' +
      (isYT && r.status !== 'verified' ? '<a class="btn btn-sm btn-ghost" href="' + esc(searchUrl) + '" target="_blank" rel="noopener">Search YouTube</a>' : '') +
      '</div></article>';
  }

  /* ---------- in-site player and watch tracking ---------- */
  function fmtTime(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), x = sec % 60;
    return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (x < 10 ? '0' : '') + x;
  }
  // where a video or playlist was left (on module page mid: see tickKey), as a short line; '' when ticked or barely started
  function posText(r, mid) {
    var p = S().pos[tickKey(mid, r)];
    if (!p || isTicked(mid, r)) return '';
    if ((r.listId || r.parts) && p.n) return p.i > 0 || p.s > 5 ? (r.parts ? 'Part ' : 'Video ') + Math.min(p.i + 1, p.n) + ' of ' + p.n : '';
    return p.s > 5 ? 'Stopped at ' + fmtTime(p.s) : '';
  }
  function posChip(r, mid) { var t = posText(r, mid); return '<span class="chip chip-pos num" data-pos="' + esc(tickKey(mid, r)) + '"' + (t ? '' : ' hidden') + '>' + esc(t) + '</span>'; }
  function playLabel(r) { return '<span aria-hidden="true">▶ </span>' + (r.intro ? 'Play intro' : 'Play here'); }
  function eachWithAttr(sel, attr, id, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), function (el) { if (el.getAttribute(attr) === id) fn(el); }); }
  // redraw what shows a saved place (k: its key): the chips, and the Next up line and button
  function updatePos(k) {
    var cut = k.indexOf('|'), r = resById[cut > 0 ? k.slice(cut + 1) : k], t = r ? posText(r, cut > 0 ? k.slice(0, cut) : null) : '';
    eachWithAttr('[data-pos]', 'data-pos', k, function (el) { el.textContent = t; el.hidden = !t; });
    eachWithAttr('[data-pos-next]', 'data-pos-next', k, function (el) { el.textContent = t ? ' · ' + t : ''; });
    eachWithAttr('[data-pos-btn]', 'data-pos-btn', k, function (el) { el.textContent = t ? 'Resume' : 'Play'; });
  }
  function refreshPlaces() {
    var done = {};
    Array.prototype.forEach.call(document.querySelectorAll('[data-pos], [data-pos-next], [data-pos-btn]'), function (el) {
      var k = el.getAttribute('data-pos') || el.getAttribute('data-pos-next') || el.getAttribute('data-pos-btn');
      if (k && !done[k]) { done[k] = 1; updatePos(k); }
    });
  }
  function syncWatched(id, on) {
    var r = resById[id];
    eachWithAttr('input[data-action="watched"]', 'data-id', id, function (el) { el.checked = r ? isTicked(el.getAttribute('data-mod'), r) : !!S().watched[id]; });
    // an open player of it: an un-tick makes it track again (and forget what was watched before)
    eachWithAttr('.res-card', 'data-res', id, function (c) { var b = c.querySelector('.player'); if (b && b._aimPlayer && b._aimPlayer.sync) b._aimPlayer.sync(); });
    refreshSide(); refreshChecklist(); refreshPlaces();
    if (ST()) ST().emit('watched', id, on);
  }
  // a day of watching in the site's player counts for the day streak: once per resource and day, after a few minutes
  // of real playback (added up over that day's plays)
  var WATCH_DAY_SECS = 180, watchDay = {};
  window.addEventListener('aim:progress-reset', function () { watchDay = {}; }); // a fresh start: today can count again
  function watchedToday(rid, sec) {
    var d = C.today(), w = watchDay[rid];
    if (!w || w.d !== d) w = watchDay[rid] = { d: d, s: 0, logged: false };
    w.s += sec;
    if (!w.logged && w.s >= WATCH_DAY_SECS) { w.logged = true; C.logActivity(); C.save(); }
  }
  // mid: the module page the player is on (null in the Library)
  function startPlayer(box, r, mid) {
    mid = mid && modById[mid] ? mid : null;
    var k = tickKey(mid, r), track = !r.intro;
    var h = C.play(box, r, {
      getPos: track ? function () { return S().pos[k] || null; } : null,
      onPos: track ? function (p) {
        C.setPos(k, { i: p.i, n: p.n, s: p.s, c: p.c, v: p.v, m: mid || undefined });
        C.save(); updatePos(k);
      } : null,
      isDone: function () { return isTicked(mid, r); },
      // a course's intro video, and a shared playlist on a module page (which part is this module's?), never tick themselves
      onComplete: track && k === r.id ? function () {
        // forget the stop point: it sits at the very end, so a replay after unticking would end and re-tick at once
        // (forgetPos keeps a timed marker, so the account copy cannot bring the old place back)
        var st = S(); C.forgetPos(k);
        if (st.watched[k]) { C.save(); return; }
        C.setWatched(k, true); C.logActivity(); C.save(); syncWatched(r.id, true);
        C.toast(r.parts ? 'All parts watched: ticked as done' : r.listId ? 'Playlist finished: ticked as done' : 'Video finished: ticked as done');
      } : null,
      onWatch: function (sec) { watchedToday(r.id, sec); },
      onPlain: function () {
        var t = track ? posText(r, mid) : '';
        return 'The tracking player could not load (slow or blocked connection), so this is YouTube\'s plain player and nothing is saved while it plays.' +
          (r.intro ? '' : ' Tick “I finished this” yourself when you finish.') +
          (t && (r.listId || r.parts) ? ' You were on ' + t.charAt(0).toLowerCase() + t.slice(1) + ': choose it from the playlist menu in the player.' : '');
      }
    });
    box._aimPlayer = h;
    currentCleanup.push(function () { if (h) h.destroy(); });
  }
  function toggleInline(art, r, btn) {
    var box = art.querySelector('.player[data-inline]');
    if (box) {
      if (box._aimPlayer) box._aimPlayer.destroy();
      box.remove(); btn.innerHTML = playLabel(r); btn.setAttribute('aria-expanded', 'false');
      return;
    }
    box = document.createElement('div'); box.className = 'player'; box.setAttribute('data-inline', '');
    art.insertBefore(box, art.firstChild);
    startPlayer(box, r, art.getAttribute('data-mod'));
    btn.textContent = 'Close player'; btn.setAttribute('aria-expanded', 'true');
    try { box.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) { box.scrollIntoView(false); }
  }
  function gotoRes(id, andPlay) {
    var art = null; eachWithAttr('.res-card', 'data-res', id, function (el) { if (!art) art = el; });
    if (!art) return;
    var wrap = art.parentElement;
    if (wrap && wrap.hidden) {
      // shown out of a collapsed group: keep that group's "Show N more" count right
      wrap.hidden = false;
      var grp = wrap.parentElement, more = grp && grp.id ? document.querySelector('[data-more="' + grp.id + '"]') : null;
      var left = grp ? Array.prototype.filter.call(grp.children, function (x) { return x.hidden; }).length : 0;
      if (more) { if (left) more.textContent = 'Show ' + left + ' more'; else more.remove(); }
    }
    if (andPlay) {
      var facade = art.querySelector('.player-facade');
      var btn = art.querySelector('[data-action="play-inline"]');
      if (facade) facade.click(); else if (btn && btn.getAttribute('aria-expanded') !== 'true') btn.click();
    }
    // after the player opened at the top of the card: the card (and its player) at the top of the window
    try { art.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { art.scrollIntoView(); }
    // keyboard and screen-reader users land on the card, not back at the Next up button
    var link = art.querySelector('.res-title a'); if (link) { try { link.focus({ preventScroll: true }); } catch (e) { link.focus(); } }
  }
  // every resource of a module in study order: the main picks first, then the rest
  function checklistOrder(m) {
    var mp = mainPicks(m);
    return mp.main ? [mp.main].concat(mp.list.filter(function (r) { return r !== mp.main; })) : mp.list;
  }
  function resTicks(m) {
    var list = D.resources.filter(function (r) { return (r.modules || []).indexOf(m.id) >= 0; });
    return { n: list.filter(function (r) { return isTicked(m.id, r); }).length, of: list.length };
  }
  function checklistHTML(m) {
    var mid = m.id, order = checklistOrder(m), t = resTicks(m), mp = mainPicks(m);
    var next = order.filter(function (r) { return !isTicked(mid, r); })[0];
    var p = t.of ? Math.round(t.n / t.of * 100) : 0;
    // the place and the Play/Resume label follow the video while it plays (updatePos)
    var nt = next ? posText(next, mid) : '', nk = next ? tickKey(mid, next) : '';
    var nextHTML = next ? '<div class="next-up"><span class="eyebrow">Next up</span><strong>' + esc(next.title) + '</strong>' +
      '<span class="small muted">' + esc(next.creator || '') + ' · ' + esc(next.type) + '<span data-pos-next="' + esc(nk) + '">' + (nt ? ' · ' + esc(nt) : '') + '</span></span>' +
      '<div class="row">' + (C.canEmbed(next) ? '<button class="btn btn-sm btn-primary" type="button" data-action="goto-res" data-id="' + esc(next.id) + '" data-play="1"><span aria-hidden="true">▶ </span>' +
        (next.intro ? 'Play intro' : '<span data-pos-btn="' + esc(nk) + '">' + (nt ? 'Resume' : 'Play') + '</span>') + '</button>' :
        '<a class="btn btn-sm" href="' + esc(next.url) + '" target="_blank" rel="noopener">Open ↗</a>') +
      '<button class="btn btn-sm" type="button" data-action="goto-res" data-id="' + esc(next.id) + '">Show details</button></div></div>' :
      '<div class="callout small">Every resource in this module is ticked. Well done!</div>';
    return '<div class="row-between"><h2 class="h-sub">Your checklist</h2><span class="small muted num">' + t.n + ' of ' + t.of + ' finished</span></div>' +
      bar(p, 'Resources finished in this module') + nextHTML +
      '<details id="checklist-all"><summary>Tick off all ' + t.of + ' resources</summary><ul class="checklist small">' + order.map(function (r) {
        var perMod = tickKey(mid, r) !== r.id;
        return '<li><label><input type="checkbox" data-action="watched" data-id="' + esc(r.id) + '"' + (perMod ? ' data-mod="' + esc(mid) + '"' : '') + (isTicked(mid, r) ? ' checked' : '') + '><span>' + esc(r.title) +
          ' <span class="muted">· ' + esc(r.type) + (r === mp.main ? ' · best pick' : '') + '</span> ' + (C.canEmbed(r) && !r.intro ? posChip(r, mid) : '') + '</span></label></li>';
      }).join('') + '</ul></details>' +
      '<p class="small muted">Videos tick themselves once you have watched most of them here (skipping ahead does not count), and playlists remember which video you were on. Tick these yourself: a playlist shared with other modules, when you have finished this module\'s part; courses on other sites; books and tools. For module progress, finish the best pick or any video or course marked Recommended; the rest are extras.</p>';
  }
  function refreshChecklist() {
    var el = document.getElementById('watch-checklist'); if (!el) return;
    var m = modById[el.getAttribute('data-mod')]; if (!m) return;
    // nothing changed (progress saved in another tab, say): leave it as it is
    var html = checklistHTML(m); if (el._html === html) return;
    var d = document.getElementById('checklist-all'), open = d && d.open;
    // re-rendering removes the focused control (a checkbox, a Next up button): put keyboard focus back on its replacement
    var fk = focusKey(el);
    el.innerHTML = html; el._html = html;
    if (open) { d = document.getElementById('checklist-all'); if (d) d.open = true; }
    refocus(fk, function () { return el.querySelector('.next-up [data-action="goto-res"]') || el.querySelector('h2'); });
  }
  // most recent unfinished videos or playlists, newest first: [{ r, mid, k }] (mid: the module page it was watched on)
  function continueList(max) {
    var st = S();
    return Object.keys(st.pos).map(function (k) { var x = placeOf(k); if (x) x.k = k; return x; })
      .filter(function (x) { return x && !x.r.intro && tickKey(x.mid, x.r) === x.k && posText(x.r, x.mid); })
      .sort(function (a, b) { return (st.pos[b.k].t || 0) - (st.pos[a.k].t || 0); }).slice(0, max || 5);
  }
  function resModule(r) { var mid = (r.modules || []).filter(function (x) { return modById[x]; })[0]; return mid ? modById[mid] : null; }
  // each item opens the page it was watched on (its module's Watch tab, or the Library), shows its card and plays it
  function continueHTML(max) {
    var list = continueList(max);
    if (!list.length) return '';
    return '<ul class="continue-list">' + list.map(function (x) {
      var m = x.mid ? modById[x.mid] : null, r = x.r;
      return '<li><a href="' + (m ? '#m-' + esc(m.id) + '~watch' : '#library') + '" data-show-res="' + esc(r.id) + '" data-play="1"' + (m ? '' : ' data-q="' + esc(r.title) + '"') + '><strong>' + esc(r.title) + '</strong></a>' +
        '<span class="small muted num">' + esc(posText(r, x.mid)) + (m ? ' · Module ' + esc(modNo(m)) : ' · Library') + '</span></li>';
    }).join('') + '</ul>';
  }
  /* ---------- shell ---------- */
  var pendingFlush = [];
  function flushPending() { pendingFlush.slice().forEach(function (f) { try { f(); } catch (e) {} }); }
  window.addEventListener('pagehide', flushPending);
  // Keyboard focus across a redraw: remember which control inside root has focus, and focus the same one (or the
  // fallback) once root has been redrawn, so keyboard and screen-reader users keep their place.
  function focusKey(root) {
    var el = document.activeElement;
    if (!root || !el || el === root || !root.contains(el)) return null;
    var q = function (v) { return '"' + String(v).replace(/["\\]/g, '\\$&') + '"'; }, sel = el.tagName.toLowerCase();
    ['data-action', 'data-id', 'data-c', 'data-tab', 'data-key', 'href', 'name'].forEach(function (a) { if (el.hasAttribute(a)) sel += '[' + a + '=' + q(el.getAttribute(a)) + ']'; });
    if (el.id) sel = '[id=' + q(el.id) + ']';
    return { root: root, sel: sel, i: Math.max(0, [].indexOf.call(root.querySelectorAll(sel), el)) };
  }
  function refocus(k, fallback) {
    var ae = document.activeElement;
    if (!k || (ae && ae !== document.body && document.documentElement.contains(ae))) return; // focus was not lost
    var all = k.root.isConnected ? k.root.querySelectorAll(k.sel) : [], el = all[k.i] || all[0] || (typeof fallback === 'function' ? fallback() : fallback);
    if (!el) return;
    if (!el.matches('a[href], button, input, select, textarea, summary, [tabindex]')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }
  // quiet: a background redraw (progress arrived from another device or tab) keeps focus, scroll and the menu as they are
  var quiet = false;
  // leaving a page: save what is typed, close its players (they save their last place) and timers. route() does it
  // before the next page is drawn, so that page shows the progress just saved; setView again for its own callers.
  function leaveView() {
    flushPending(); pendingFlush = [];
    currentCleanup.forEach(function (f) { try { f(); } catch (e) {} });
    currentCleanup = [];
  }
  function setView(html, title) {
    leaveView();
    if (!quiet) { try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); } catch (e) {} }
    main.innerHTML = html;
    document.title = (title ? title + ' · ' : '') + (D.site.name || 'AI Marg');
    var h1 = main.querySelector('h1');
    if (h1) { h1.setAttribute('tabindex', '-1'); if (!quiet) h1.focus({ preventScroll: true }); }
    if (!quiet) { try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); } catch (e) { window.scrollTo(0, 0); } }
    watchAsides();
  }
  // Wide screens pin the sidebar of two-column pages while the page scrolls. A sidebar taller than the window cannot
  // be pinned: its lower part (Mark project complete, Take the level test, Open module 1.1) would stay below the
  // window until the end of the page, even when it has keyboard focus. Such a sidebar scrolls with the page instead.
  var asideRO = window.ResizeObserver ? new ResizeObserver(function () { fitAsides(); }) : null;
  function fitAsides() {
    Array.prototype.forEach.call(main.querySelectorAll('.two-col > aside'), function (a) {
      var top = parseFloat(getComputedStyle(a).top) || 76;
      a.classList.toggle('aside-tall', a.offsetHeight > window.innerHeight - top - 16);
    });
  }
  function watchAsides() {
    if (asideRO) { asideRO.disconnect(); Array.prototype.forEach.call(main.querySelectorAll('.two-col > aside'), function (a) { asideRO.observe(a); }); }
    fitAsides();
  }
  window.addEventListener('resize', fitAsides);
  function crumbs(items) {
    return '<nav class="crumbs" aria-label="Breadcrumb">' + items.map(function (it, i) {
      return (i ? '<span aria-hidden="true">›</span>' : '') + (it[1] ? '<a href="#' + it[1] + '">' + esc(it[0]) + '</a>' : '<span>' + esc(it[0]) + '</span>');
    }).join('') + '</nav>';
  }
  // what: e.g. "This module" (named in the label read out); text: the figure shown, when not just p + '%'
  function ring(p, what, text, cls, id) {
    text = text || p + '%';
    return '<div class="ring' + (cls ? ' ' + cls : '') + '"' + (id ? ' id="' + id + '"' : '') + ' style="--p:' + p + '" data-label="' + esc(text) + '" role="img" aria-label="' + esc((what ? what + ': ' : '') + pctWords(text) + ' complete') + '"></div>';
  }
  function bar(p, label, cls, text) { return '<div class="bar' + (cls ? ' ' + cls : '') + '" role="progressbar" aria-label="' + esc(label || 'Progress') + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + p + '"' + (text ? ' aria-valuetext="' + esc(pctWords(text)) + '"' : '') + '><span style="width:' + p + '%"></span></div>'; }
  // the whole course as one bar on Home; the same figure as My progress
  function courseProgHTML() {
    var t = courseText();
    return '<div class="course-prog stack-sm"><div class="course-prog-head"><span><strong>Whole course</strong> <span class="small muted">Level&nbsp;1&nbsp;(beginner) to Level&nbsp;4&nbsp;(advanced)</span></span><strong class="num">' + esc(t) + '</strong></div>' +
      bar(overallProgress(), 'Whole course progress', 'bar-course', t) + '</div>';
  }
  // pinned under the menu while the page scrolls (module, level and roadmap pages): the page's own figure, then the whole course
  function stripItem(id, what, sub, p, text, cls) {
    return '<div class="ps-item"><div class="ps-top"><span class="ps-what">' + esc(what) + (sub ? '<span class="ps-sub"> · ' + esc(sub) + '</span>' : '') + '</span><strong class="num ps-n" id="' + id + '-n">' + esc(text) + '</strong></div>' +
      '<div class="bar' + (cls ? ' ' + cls : '') + '" id="' + id + '" role="progressbar" aria-label="' + esc(what + (sub ? ', ' + sub : '')) + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + p + '" aria-valuetext="' + esc(pctWords(text)) + '"><span style="width:' + p + '%"></span></div></div>';
  }
  // own: [label, figure, text] for this module or level; left out on the roadmap
  function progStripHTML(own) {
    return '<div class="prog-strip" id="prog-strip">' + (own ? stripItem('ps-own', own[0], '', own[1], own[2]) : '') +
      stripItem('ps-course', 'Whole course', 'Level 1 to Level 4', overallProgress(), courseText(), 'bar-course') + '</div>';
  }
  function setStrip(id, p, text) {
    var b = document.getElementById(id), n = document.getElementById(id + '-n'); if (!b) return;
    b.setAttribute('aria-valuenow', p); b.setAttribute('aria-valuetext', pctWords(text));
    if (b.firstChild) b.firstChild.style.width = p + '%';
    if (n && n.textContent !== text) n.textContent = text;
  }
  function stations() {
    return '<div class="path">' + D.levels.map(function (l) {
      var p = levelProgress(l.id), ms = modulesOf(l.id);
      var hours = ms.reduce(function (s, m) { return s + (m.hours || 0); }, 0);
      return '<a class="station' + (p >= 100 ? ' done' : levelRaw(l.id) > 0 ? ' started' : '') + '" href="#level-' + l.id + '">' +
        '<span class="fill" style="height:calc((100% - 44px) * ' + (p / 100) + ')"></span>' +
        '<span class="station-dot" aria-hidden="true">' + esc(l.glyph || String(l.id)) + '</span>' +
        '<span class="stack-sm"><span class="station-name"><b>' + esc(l.name) + '</b><span class="muted small">' + esc(l.meaning) + '</span></span>' +
        '<span><strong>Level ' + l.id + ': ' + esc(l.title) + '</strong></span>' +
        '<span class="small muted num">' + ms.length + ' modules' + (hours ? ' · ~' + hours + ' hours' : '') + ' · ' + esc(l.weeks || '') + ' weeks at 10 h/week (modules only)</span>' +
        bar(p, 'Level ' + l.id + ' progress', '', levelText(l.id)) + '</span></a>';
    }).join('') + '</div>';
  }

  /* ---------- views ---------- */
  function viewHome() {
    var st = S(), last = st.last && modById[st.last] ? modById[st.last] : null;
    var nRes = D.resources.length, nHi = D.resources.filter(function (r) { return r.language === 'hindi' || r.language === 'hinglish'; }).length;
    var nIn = D.resources.filter(function (r) { return r.language === 'indian-english'; }).length;
    var nQ = Object.keys(D.quizzes).reduce(function (s, k) { return s + D.quizzes[k].length; }, 0);
    var html = '<div class="wrap stack-lg">' +
      '<section class="hero"><div class="stack">' +
      '<span class="eyebrow">Free AI & ML course · Videos in Hindi, Hinglish & Indian English</span>' +
      '<h1>From your first line of Python to building <em>AI agents</em>.</h1>' +
      '<p class="lede">A guided path through the best free videos from Indian teachers first, in Hindi, Hinglish and Indian English, with interactive labs, Python you can run in the browser, tests and tough projects. No fees, and no sign-up needed.</p>' +
      '<div class="row"><a class="btn btn-primary" href="#start">Start here</a>' +
      (last ? '<a class="btn" href="#m-' + esc(last.id) + '">Continue: ' + esc(last.title) + '</a>' : '<a class="btn" href="#level-1">Open Level 1</a>') + '</div>' +
      (courseRaw() > 0 ? courseProgHTML() : '') +
      '</div>' + stations() + '</section>' +
      (ST() ? '<div id="study-today"></div>' : '') +
      '<section class="stack"><div class="section-title"><h2>What you get</h2></div><div class="grid">' +
      featureCard('Indian teachers first', nRes + ' free playlists, courses and books. ' + nHi + ' are in Hindi or Hinglish and ' + nIn + ' in Indian English. Global English classics appear as extras.', '#library', 'Browse the library') +
      featureCard('Interactive labs', Object.keys(LABS).length + ' visual labs, one for every module: drag points, move sliders and watch gradient descent, SQL joins, neural networks, RAG search and AI agents react.', '#labs', 'Open the labs') +
      featureCard('Python in your browser', D.exercises.length + ' auto-graded coding exercises. Write code, press Check, get instant feedback. Nothing to install.', '#practice', 'Start practising') +
      featureCard('Tests and tough projects', nQ + ' quiz questions, four level tests and ' + D.projects.length + ' portfolio projects built on Indian data and problems.', '#projects', 'See the projects') +
      '</div></section>' +
      '<section class="stack"><div class="section-title"><h2>How each module works</h2></div><ol class="stack-sm prose">' +
      '<li><strong>Read the lesson cards.</strong> Short plain-English cards with diagrams, key terms and a study plan. Press Got it after each card to track your reading.</li>' +
      '<li><strong>Watch.</strong> The best pick, from an Indian teacher in Hindi, Hinglish or Indian English, plus other options if a teacher does not click for you.</li>' +
      '<li><strong>Play with the lab.</strong> Every module has a lab that lets you feel the idea before you code it.</li>' +
      '<li><strong>Practise.</strong> Solve small Python exercises right on the page.</li>' +
      '<li><strong>Test yourself.</strong> Score 70% or more on the quiz, then move on. A level is complete when its modules are done, you pass the level test and you finish one project.</li></ol></section>' +
      (st.last || Object.keys(st.watched).length || continueList(1).length ? '<section class="card stack-sm"><div class="row-between"><div class="stack-sm"><strong>Your progress</strong><span class="small muted num">' + esc(courseText()) + ' of the whole course · ' + C.streak() + '-day streak</span></div><a class="btn" href="#progress">Open my progress</a></div>' +
        (continueList(1).length ? '<div class="stack-sm"><span class="eyebrow">Continue watching</span>' + continueHTML(3) + '</div>' : '') + '</section>' : '') +
      '</div>';
    setView(html, 'Home');
    if (ST()) ST().emit('home', main);
  }
  function featureCard(t, body, href, cta) {
    return '<div class="card stack-sm"><h3>' + esc(t) + '</h3><p class="muted">' + esc(body) + '</p><a href="' + href + '">' + esc(cta) + ' →</a></div>';
  }

  function tocHTML(sections) {
    if (!sections || sections.length < 5) return '';
    return '<nav class="card-flat stack-sm" aria-label="On this page"><strong class="small">On this page</strong><ul class="small">' + sections.map(function (s, i) {
      return '<li><a href="#" data-jump="sec-' + i + '">' + esc(s.heading) + '</a></li>';
    }).join('') + '</ul></nav>';
  }
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('[data-jump]'); if (!a) return;
    ev.preventDefault(); jumpTo(document.getElementById(a.getAttribute('data-jump')));
  });
  // scroll to a part of the page and move keyboard focus there (its heading, a glossary term, or the part itself), so
  // the next Tab and a screen reader carry on from that place instead of from the link at the top
  function jumpTo(t, instant) {
    if (!t) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    try { t.scrollIntoView({ behavior: instant ? 'instant' : reduce ? 'auto' : 'smooth', block: 'start' }); } catch (e) { t.scrollIntoView(true); }
    var f = t.matches('h1, h2, h3, h4, dt') ? t : t.querySelector('h1, h2, h3, h4, dt') || t;
    if (!f.matches('a[href], button, input, select, textarea, summary, [tabindex]')) f.setAttribute('tabindex', '-1');
    try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); }
  }
  function sectionsHTML(sections) {
    return (sections || []).map(function (s, i) {
      return '<section class="stack-sm" id="sec-' + i + '"><div class="sec-head"><h2 class="h-sub">' + esc(s.heading) + '</h2>' + SPK.btn('section', 'Listen to this section: ' + s.heading) + '</div>' + (s.paragraphs || []).map(function (p) { return '<p>' + inline(p) + '</p>'; }).join('') +
        (s.bullets && s.bullets.length ? (s.bullets.every(function (b) { return /^\d+\.\s/.test(b); }) ? '<ol>' + s.bullets.map(function (b) { return '<li>' + inline(b.replace(/^\d+\.\s/, '')) + '</li>'; }).join('') + '</ol>' : '<ul>' + s.bullets.map(function (b) { return '<li>' + inline(b) + '</li>'; }).join('') + '</ul>') : '') + '</section>';
    }).join('');
  }
  function viewStart() {
    var pg = D.pages.start || { title: 'Start here', sections: [] };
    setView('<div class="wrap stack-lg">' + crumbs([['Home', 'home'], ['Start here']]) +
      '<header class="stack-sm"><h1>' + esc(pg.title || 'Start here') + '</h1><p class="lede muted prose">Everything you need before Level 1: how the site works, free tools, time, cost and how to study well.</p></header>' +
      '<div class="two-col"><div class="prose stack">' + tocHTML(pg.sections) + sectionsHTML(pg.sections) + '</div>' +
      '<aside class="stack start-aside">' + plannerCard() + '<div class="card stack-sm"><strong>Ready?</strong><p class="small muted">Begin with the no-coding introduction, then Python.</p><a class="btn btn-primary" href="#m-' + esc((modulesOf(1)[0] || {}).id || '') + '">Open module 1.1</a></div></aside></div></div>', 'Start here');
    bindPlanner();
  }

  function plannerCard() {
    var st = S(), hpw = st.prefs.hpw || 10, start = st.prefs.start || C.today();
    return '<div class="card stack" id="planner"><div class="stack-sm"><strong>Plan your journey</strong><span class="small muted">How many hours a week can you study?</span></div>' +
      '<div class="control"><label for="hpw">Hours per week <output id="hpw-out" class="num">' + esc(hpw) + ' h</output></label><input type="range" id="hpw" min="3" max="40" step="1" value="' + esc(hpw) + '"></div>' +
      '<div class="control"><label for="pstart">Start date</label><input type="date" id="pstart" value="' + esc(start) + '"></div>' +
      '<div id="plan-out" class="stack-sm"></div></div>';
  }
  function bindPlanner() {
    var hpw = document.getElementById('hpw'), ps = document.getElementById('pstart'), out = document.getElementById('plan-out');
    if (!hpw) return;
    // ev: the learner moved the slider or picked a date. Only then is the plan saved: the defaults shown on a first
    // visit are not a choice, so a plan already in the learner's account still arrives when they sign in.
    function calc(ev) {
      var h = Number(hpw.value) || 10; document.getElementById('hpw-out').textContent = h + ' h';
      if (ev) { C.setPlan(h, ps.value); C.save(); }
      var d0 = ps.value ? new Date(ps.value + 'T00:00:00') : new Date(), cum = 0;
      var rows = D.levels.map(function (l) {
        var mh = modulesOf(l.id).reduce(function (s, m) { return s + (m.hours || 20); }, 0);
        var ph = D.projects.filter(function (p) { return p.level === l.id; }).slice(0, 2).reduce(function (s, p) { return s + (p.hours || 15); }, 0);
        cum += mh + ph;
        var d = new Date(d0.getTime() + (cum / h) * 7 * 86400000);
        return '<tr><td>Level ' + l.id + ' · ' + esc(l.name) + '</td><td class="num">' + (mh + ph) + ' h</td><td class="num">' + d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + '</td></tr>';
      }).join('');
      out.innerHTML = '<div class="table-wrap"><table class="simple"><thead><tr><th>Level</th><th>Study</th><th>Finish by</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<p class="small muted">Includes module hours plus two projects per level. Total about ' + cum + ' hours, roughly ' + Math.ceil(cum / h) + ' weeks at ' + h + ' h/week.</p>';
    }
    hpw.addEventListener('input', calc); ps.addEventListener('change', calc); calc();
  }

  function viewRoadmap() {
    setView('<div class="wrap stack-lg">' + crumbs([['Home', 'home'], ['Roadmap']]) +
      '<header class="stack-sm"><h1>The roadmap</h1><p class="lede muted prose">Four levels, ' + D.modules.length + ' modules. Go in order the first time; later, jump to whatever you need.</p></header>' +
      progStripHTML() +
      D.levels.map(function (l) { return '<section class="stack">' + levelHeader(l, 'h2') + moduleList(l.id) + '</section>'; }).join('') + '</div>', 'Roadmap');
  }
  function levelHeader(l, tag, noBar) {
    return '<div class="level-head"><div class="level-glyph" aria-hidden="true">' + esc(l.glyph || String(l.id)) + '</div><div class="stack-sm">' +
      '<span class="eyebrow">Level ' + l.id + ' · ' + esc(l.name) + ' (' + esc(l.meaning) + ')</span><' + tag + '><a href="#level-' + l.id + '" style="color:inherit;text-decoration:none">' + esc(l.title) + '</a></' + tag + '>' + (noBar ? '' :
      '<div class="row">' + bar(levelProgress(l.id), 'Level ' + l.id + ' progress', '', levelText(l.id)).replace('class="bar"', 'class="bar" style="width:160px"') + '<span class="small muted num">' + esc(levelText(l.id)) + '</span></div>') + '</div></div>';
  }
  function moduleList(lv) {
    return '<div class="module-list">' + modulesOf(lv).map(function (m) {
      var p = moduleProgress(m), lab = labOf(m), ex = exOf(m.id);
      return '<a class="module-row' + (p >= 100 ? ' done' : '') + '" href="#m-' + esc(m.id) + '"><span class="idx num">' + (p >= 100 ? '✓' : modNo(m)) + '</span>' +
        '<span><h3>' + esc(m.title) + '</h3><span class="meta">' + (m.hours ? '<span class="chip num">~' + m.hours + ' h</span>' : '') +
        (lab ? '<span class="chip chip-en-in">Lab</span>' : '') + (ex.length ? '<span class="chip">' + ex.length + ' exercise' + (ex.length > 1 ? 's' : '') + '</span>' : '') +
        (D.quizzes[m.id] ? '<span class="chip">Quiz</span>' : '') + '</span></span>' + ring(p) + '</a>';
    }).join('') + '</div>';
  }

  function viewLevel(lv) {
    var l = levelById[lv]; if (!l) return viewNotFound();
    var tests = D.quizzes['test-l' + lv] || [], tb = S().quiz['test-l' + lv];
    var projs = D.projects.filter(function (p) { return p.level === lv; });
    setView('<div class="wrap stack-lg">' + crumbs([['Home', 'home'], ['Roadmap', 'roadmap'], ['Level ' + lv]]) +
      levelHeader(l, 'h1', true) +
      progStripHTML(['This level', levelProgress(lv), levelText(lv)]) +
      '<div class="two-col"><div class="stack-lg"><div class="prose stack-sm">' + (l.intro ? '<p>' + inline(modLinks(l.intro)) + '</p>' : '') +
      (l.howToStudy ? '<div class="callout">' + inline(modLinks(l.howToStudy)) + '</div>' : '') + '</div>' +
      '<section class="stack"><h2>Modules</h2>' + moduleList(lv) + '</section>' +
      (l.weeklyPlan && l.weeklyPlan.length ? '<section class="stack"><h2>Suggested schedule</h2><p class="small muted">At about 10 hours a week. Go slower or faster as you like; finishing matters more than speed.</p><div class="table-wrap"><table class="simple"><thead><tr><th>Weeks</th><th>What to do</th></tr></thead><tbody>' + l.weeklyPlan.map(function (w) { return '<tr><td class="num" style="white-space:nowrap">' + esc(w.weeks) + '</td><td>' + inline(w.focus) + '</td></tr>'; }).join('') + '</tbody></table></div></section>' : '') +
      (projs.length ? '<section class="stack"><h2>Projects for this level</h2><div class="grid">' + projs.map(projCard).join('') + '</div></section>' : '') +
      '</div><aside class="stack">' +
      (l.outcomes && l.outcomes.length ? '<div class="card stack-sm"><strong>After this level you can</strong><ul class="small">' + l.outcomes.map(function (o) { return '<li>' + inline(o) + '</li>'; }).join('') + '</ul></div>' : '') +
      (tests.length ? '<div class="card stack-sm"><strong>Level test</strong><p class="small muted">' + tests.length + ' tough questions across the level. Pass with 70%.</p>' + (tb ? '<span class="small num">Best score: ' + esc(tb.best) + '%</span>' : '') + '<a class="btn btn-primary" href="#test-l' + lv + '">Take the level ' + lv + ' test</a></div>' : '') +
      '</aside></div></div>', 'Level ' + lv + ' ' + l.name);
  }

  var moduleTab = {};
  function viewModule(id, tabArg) {
    var m = modById[id]; if (!m) return viewNotFound();
    S().last = id; C.save();
    var l = levelById[m.level], lab = labOf(m), ex = exOf(m.id), qz = D.quizzes[m.id] || [];
    var tabs = [['overview', 'Overview'], ['watch', 'Watch & read', 'Watch']];
    if (lab) tabs.push(['lab', 'Lab']);
    if (ex.length) tabs.push(['practice', 'Practice (' + ex.length + ')', 'Practice']);
    if (qz.length) tabs.push(['quiz', 'Quiz']);
    if (ST()) tabs.push(['reflect', 'Reflect']);
    tabs.push(['notes', 'My notes', 'Notes']);
    var tab = tabArg || moduleTab[id] || 'overview';
    if (!tabs.some(function (t) { return t[0] === tab; })) tab = 'overview';
    var list = modulesOf(m.level), idx = list.indexOf(m), all = D.modules, gi = all.indexOf(m);
    var prev = all[gi - 1], next = all[gi + 1];
    var html = '<div class="wrap stack">' + crumbs([['Home', 'home'], ['Level ' + m.level + ' ' + (l ? l.name : ''), 'level-' + m.level], ['Module ' + modNo(m)]]) +
      '<header class="row-between"><div class="stack-sm"><span class="eyebrow">Module ' + modNo(m) + (m.hours ? ' · about ' + m.hours + ' hours' : '') + '</span><h1>' + esc(m.title) + '</h1></div></header>' +
      progStripHTML(['This module', moduleProgress(m), moduleProgress(m) + '%']) +
      '<div class="tabs" role="tablist" aria-label="Module sections">' + tabs.map(function (t) { return '<button role="tab" type="button" id="tab-' + t[0] + '" aria-controls="tabpanel" data-tab="' + t[0] + '" aria-selected="' + (t[0] === tab) + '" tabindex="' + (t[0] === tab ? '0' : '-1') + '">' + (t[2] ? '<span class="t-long">' + esc(t[1]) + '</span><span class="t-short">' + esc(t[2]) + '</span>' : esc(t[1])) + '</button>'; }).join('') + '</div>' +
      '<div class="two-col' + (tab === 'lab' ? ' full' : '') + '" id="mod-cols"><div class="tab-panel" id="tabpanel" role="tabpanel" aria-labelledby="tab-' + tab + '"></div><aside class="stack"><div class="stack" id="mod-side" data-mod="' + esc(m.id) + '">' + moduleSide(m) + '</div>' +
      '<div class="row-between">' + (prev ? '<a class="btn btn-sm" href="#m-' + esc(prev.id) + '">← ' + esc(modNo(prev)) + '</a>' : '<span></span>') + (next ? '<a class="btn btn-sm" href="#m-' + esc(next.id) + '">' + esc(modNo(next)) + ' →</a>' : '') + '</div></aside></div></div>';
    setView(html, m.title);
    var tabBtns = Array.prototype.slice.call(main.querySelectorAll('[data-tab]'));
    tabBtns.forEach(function (b, i) {
      b.addEventListener('click', function () { switchTab(b.getAttribute('data-tab')); });
      b.addEventListener('keydown', function (ev) {
        var j = ev.key === 'ArrowRight' ? i + 1 : ev.key === 'ArrowLeft' ? i - 1 : ev.key === 'Home' ? 0 : ev.key === 'End' ? tabBtns.length - 1 : null;
        if (j === null) return;
        ev.preventDefault(); j = (j + tabBtns.length) % tabBtns.length; switchTab(tabBtns[j].getAttribute('data-tab'), true);
      });
    });
    function switchTab(t, focus) {
      try { window.scrollTo({ top: window.scrollY, behavior: 'instant' }); } catch (e) {}
      moduleTab[id] = t; SPK.stop();
      try { history.replaceState(history.state, '', '#m-' + id + '~' + t); } catch (e) {} // keeps the entry's scroll key
      currentCleanup.forEach(function (f) { try { f(); } catch (e) {} }); currentCleanup = [];
      tabBtns.forEach(function (b) { var on = b.getAttribute('data-tab') === t; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
      var panel = document.getElementById('tabpanel'); panel.setAttribute('aria-labelledby', 'tab-' + t);
      var cols = document.getElementById('mod-cols'); if (cols) cols.classList.toggle('full', t === 'lab');
      renderModuleTab(m, t, panel);
    }
    renderModuleTab(m, tab, document.getElementById('tabpanel'));
  }
  function refreshSide() {
    var el = document.getElementById('mod-side'); if (!el) return;
    var m = modById[el.getAttribute('data-mod')]; if (!m) return;
    var fk = focusKey(el); // e.g. "Mark module complete" pressed from the keyboard: keep focus on it
    el.innerHTML = moduleSide(m);
    refocus(fk);
    setStrip('ps-own', moduleProgress(m), moduleProgress(m) + '%');
    setStrip('ps-course', overallProgress(), courseText());
  }
  function moduleSide(m) {
    var parts = moduleParts(m), done = S().modules[m.id] && S().modules[m.id].done;
    return '<div class="card stack-sm"><strong>Your progress here</strong><ul class="checklist small">' + parts.map(function (p) {
      return '<li>' + (p.done ? '✓ ' : '○ ') + esc(p.k) + ' <span class="muted num">' + esc(p.pctLike ? p.n + '%' : p.n + '/' + p.of) + '</span></li>';
    }).join('') + '</ul>' + (function () { var t = resTicks(m); return t.of ? '<div class="small muted">Videos and courses ticked: <span class="num">' + t.n + ' of ' + t.of + '</span></div>' : ''; })() +
      '<button class="btn ' + (done ? '' : 'btn-haldi') + '" data-action="mod-done" data-id="' + esc(m.id) + '">' + (done ? 'Marked complete ✓ (undo)' : 'Mark module complete') + '</button></div>' +
      (m.tip ? '<div class="callout small"><strong>Tip:</strong> ' + inline(m.tip) + '</div>' : '');
  }
  function renderModuleTab(m, tab, el) {
    if (tab === 'reflect' && ST()) { ST().renderReflect(m, el); return; }
    if (tab === 'overview') {
      var pre = (m.prerequisites || []).filter(function (p) { return !/^\s*none\b/i.test(p); }).map(function (p) {
        var mm = /^(l\d-[a-z0-9-]+)\b\s*(.*)$/.exec(p);
        if (mm && modById[mm[1]]) return '<a href="#m-' + esc(mm[1]) + '">' + esc(modNo(modById[mm[1]]) + ' ' + modById[mm[1]].title) + '</a>' + (mm[2] ? ' <span class="muted">' + inline(modLinks(mm[2].replace(/^[:,\-–—\s]+/, ''))) + '</span>' : '');
        return inline(modLinks(p));
      });
      var cards = readCards(m);
      var body = {
        overview: (m.overview ? parasHTML(m.overview) : '<p>' + esc((m.topics || []).join(', ')) + '</p>') + (m.whyItMatters ? '<div class="callout callout-indigo"><strong>Why it matters:</strong> ' + inline(modLinks(m.whyItMatters)) + '</div>' : ''),
        outcomes: listHTML(m.outcomes), studySteps: listHTML(m.studySteps, true),
        keyTerms: '<dl>' + (m.keyTerms || []).map(function (k) {
          return '<div class="gloss-term"><dt>' + esc(k.term) + (k.hi ? ' <span class="term-hi">(' + esc(k.hi) + ')</span>' : '') + SPK.btn('.gloss-term', 'Listen: ' + k.term, { icon: true }) + '</dt><dd>' + inline(modLinks(k.meaning)) +
            (k.like ? '<span class="term-more"><strong>Think of it like:</strong> ' + inline(modLinks(k.like)) + '</span>' : '') +
            (k.example ? '<span class="term-more"><strong>Example:</strong> ' + inline(modLinks(k.example)) + '</span>' : '') + '</dd></div>';
        }).join('') + '</dl>',
        indiaExample: parasHTML(m.indiaExample),
        commonMistakes: listHTML(m.commonMistakes), selfCheck: listHTML(m.selfCheck)
      };
      el.innerHTML = '<div class="stack-lg">' + (pre.length ? '<div class="callout callout-indigo small"><strong>Before this:</strong> ' + pre.join('; ') + '</div>' : '') +
        '<div><div class="card read-progress stack-sm" id="read-progress" tabindex="-1">' + readProgressInner(m) + '</div><p class="visually-hidden" aria-live="polite" id="read-live"></p></div>' +
        '<div class="stack read-cards">' + cards.map(function (c, i) { return readCardHTML(m, c, i, cards.length, body[c.key], readOn(m.id, c.key)); }).join('') + '</div>' +
        listBlock('Topics covered', m.topics, false, 'topics') +
        '</div>';
      if (m.figs) placeFigures(m, el);
      if (m.examples) placeExamples(m, el);
      if (ST()) ST().emit('overview', m, el);
    } else if (tab === 'watch') {
      // one best pick, then every other option in one list: recommended ones first, global English last
      var mp = mainPicks(m), list = mp.list, best = mp.main, shown = 6;
      var rest = list.filter(function (r) { return r !== best; });
      el.innerHTML = '<div class="stack-lg"><section class="card stack-sm" id="watch-checklist" data-mod="' + esc(m.id) + '">' + checklistHTML(m) + '</section>' +
        (location.protocol === 'file:' ? '<div class="callout small">Opened as a file: YouTube may refuse to play embedded videos here. Use "Open on YouTube", or publish the site on GitHub Pages (see README).</div>' : '') +
        (best ? '<section class="stack"><h2 class="h-sub">Best pick</h2>' + resCard(best, { player: true, featured: true, note: noteFor(m, best), mod: m.id }) + '</section>' : '<div class="empty">Resources for this module are being added.</div>') +
        (rest.length ? '<section class="stack"><h2 class="h-sub">Other options <span class="chip num">' + rest.length + '</span></h2><div class="grid" id="more-all">' +
          rest.map(function (r, i) { return '<div' + (i >= shown ? ' hidden' : '') + '>' + resCard(r, { note: noteFor(m, r), recommended: isRecommended(mp, r), mod: m.id }) + '</div>'; }).join('') + '</div>' +
          (rest.length > shown ? '<div><button class="btn btn-sm" type="button" data-more="more-all">Show ' + (rest.length - shown) + ' more</button></div>' : '') + '</section>' : '') + '</div>';
      if (ST()) ST().emit('watch', m, el);
      el.querySelectorAll('[data-more]').forEach(function (b) {
        b.addEventListener('click', function () { document.querySelectorAll('#' + b.getAttribute('data-more') + ' > [hidden]').forEach(function (x) { x.hidden = false; }); b.remove(); });
      });
    } else if (tab === 'lab') {
      var lab = labOf(m);
      el.innerHTML = '<div class="stack"><div class="stack-sm"><h2>' + esc(lab.title) + '</h2><p class="muted">' + esc(lab.summary || '') + '</p></div><div id="labroot"></div></div>';
      mountLab(lab, document.getElementById('labroot'));
    } else if (tab === 'practice') {
      var exs = exOf(m.id);
      el.innerHTML = '<div class="stack-lg"><div class="callout small">Write Python in the box and press <strong>Check</strong>. The first run downloads Python (about 12 MB, more if the exercise uses NumPy or pandas). After that your browser usually keeps it. Your code is saved in this browser' + (cloudOn() ? ', and in your account if you sign in' : '') + '.</div>' +
        exs.map(function (e, i) { return '<section class="stack" id="exwrap-' + esc(e.id) + '"></section>' + (i < exs.length - 1 ? '<hr>' : ''); }).join('') + '</div>';
      exs.forEach(function (e) { mountExercise(e, document.getElementById('exwrap-' + e.id)); });
    } else if (tab === 'quiz') {
      var qz = D.quizzes[m.id], qs = S().quiz[m.id];
      el.innerHTML = '<div class="stack"><div class="row-between"><div class="stack-sm"><h2>Quiz</h2><span class="small muted">' + qz.length + ' questions · answers explained as you go · pass mark 70%</span></div>' +
        '<span id="quiz-best" class="chip num' + (qs && qs.best >= 70 ? ' chip-ok' : '') + '"' + (qs ? '' : ' hidden') + '>' + (qs ? 'Best: ' + esc(qs.best) + '% · ' + esc(qs.attempts) + ' attempt' + (qs.attempts > 1 ? 's' : '') : '') + '</span></div><div id="quizroot"></div></div>';
      var nm = D.modules[D.modules.indexOf(m) + 1];
      var nxt = nm ? { href: '#m-' + nm.id, label: 'Next: ' + modNo(nm) + ' ' + nm.title } : { href: '#tests', label: 'Take a level test' };
      if (nm && nm.level !== m.level) nxt = { href: '#test-l' + m.level, label: 'Take the level ' + m.level + ' test' };
      var quiz = new C.Quiz(document.getElementById('quizroot'), { questions: qz, mode: 'learn', key: m.id, confidence: !!ST(), next: nxt, onFinish: function (r) { recordQuiz(m.id, r.score); }, onAnswer: function (r) { if (ST()) ST().emit('answer', r); } });
      currentCleanup.push(function () { quiz.destroy(); });
    } else if (tab === 'notes') {
      var note = S().notes[m.id] || '';
      el.innerHTML = '<div class="stack"><h2>My notes</h2><p class="small muted">Write what you learned in your own words (Hindi, English or Hinglish). Notes are saved in this browser' + (cloudOn() ? ', and in your account if you sign in' : '') + '. Copy them into your GitHub learning log every week.</p>' +
        '<label for="note-' + esc(m.id) + '" class="visually-hidden">Notes for ' + esc(m.title) + '</label><textarea id="note-' + esc(m.id) + '" rows="12" placeholder="Example: Gradient descent = walking downhill in small steps. Learning rate = step size. Too big → overshoot.">' + esc(note) + '</textarea><span class="small muted" id="note-status"></span></div>';
      var ta = el.querySelector('textarea'), t = null;
      // data-dirty: typed but not saved yet, so a sync must not replace the text in the box (see aim:progress-replaced)
      var flushNote = function () { if (!t) return; clearTimeout(t); t = null; delete ta.dataset.dirty; C.setNote(m.id, ta.value); C.save(); var st = document.getElementById('note-status'); if (st) st.textContent = 'Saved'; };
      ta.addEventListener('input', function () { ta.dataset.dirty = '1'; clearTimeout(t); t = setTimeout(flushNote, 400); });
      pendingFlush.push(flushNote); currentCleanup.push(flushNote);
    }
  }
  function listBlock(title, arr, ordered, key) {
    if (!arr || !arr.length) return '';
    var tag = ordered ? 'ol' : 'ul';
    return '<section class="stack-sm"' + (key ? ' data-sec="' + key + '"' : '') + '><h2 class="h-sub">' + esc(title) + '</h2><' + tag + ' class="prose">' + arr.map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</' + tag + '></section>';
  }
  function recordQuiz(key, score) {
    var q = S().quiz[key] || { best: 0, attempts: 0 };
    q.best = Math.max(q.best, score); q.attempts++; q.last = score; q.at = C.today();
    S().quiz[key] = q; C.logActivity(); C.save(); refreshSide();
    var chip = document.getElementById('quiz-best');
    if (chip) { chip.hidden = false; chip.className = 'chip num' + (q.best >= 70 ? ' chip-ok' : ''); chip.textContent = 'Best: ' + q.best + '% · ' + q.attempts + ' attempt' + (q.attempts > 1 ? 's' : ''); }
    C.toast(score >= 70 ? 'Quiz passed with ' + score + '%. Well done!' : 'Scored ' + score + '%. Review and try again.');
  }

  /* ---------- labs ---------- */
  // Progress can change while a lab is open (a restore or a reset in another tab, ticks merged from another tab or
  // from the account copy), so the lab's ticks are looked up on every call, and the open lab then shows the ticks
  // saved now: through its syncTasks() when it has one, otherwise by starting the lab again.
  function mountLab(meta, root) {
    if (!meta || !root) return;
    var ticks = function () { var b = S().labs[meta.id]; return b && typeof b === 'object' ? b : {}; };
    var alive = true, inst = null, lab = null, shown = {}; // shown: the ticks the open lab shows
    var taskIds = function () { return ((lab && lab.tasks) || meta.tasks || []).map(function (t) { return t.id; }); };
    var ctx = {
      onTaskDone: function (tid) {
        shown[tid] = true;
        if (ticks()[tid]) return;
        var all = S().labs; if (!all[meta.id] || typeof all[meta.id] !== 'object') all[meta.id] = {};
        all[meta.id][tid] = true; C.logActivity(); C.save(); C.toast('Lab task complete'); refreshSide();
        setTimeout(syncLab, 0); // saving can merge in ticks another tab saved
      },
      isTaskDone: function (tid) { return !!ticks()[tid]; }
    };
    function start() {
      if (inst && inst.destroy) { try { inst.destroy(); } catch (e) {} }
      inst = null; root.innerHTML = ''; shown = {};
      taskIds().forEach(function (id) { shown[id] = !!ticks()[id]; });
      try { inst = lab.mount(root, ctx); }
      catch (e) { root.innerHTML = '<div class="empty">This lab could not start in your browser (' + esc(e.message) + ').</div>'; }
    }
    function syncLab() {
      if (!alive || !inst || !root.isConnected) return;
      if (!taskIds().some(function (id) { return !!ticks()[id] !== !!shown[id]; })) return;
      if (typeof inst.syncTasks === 'function') {
        taskIds().forEach(function (id) { shown[id] = !!ticks()[id]; });
        try { inst.syncTasks(); } catch (e) {}
        return;
      }
      var hadFocus = root.contains(document.activeElement);
      start();
      if (hadFocus) { // keep keyboard focus in the lab, not lost on the page
        root.setAttribute('tabindex', '-1');
        root.addEventListener('blur', function () { root.removeAttribute('tabindex'); }, { once: true });
        try { root.focus({ preventScroll: true }); } catch (e) {}
      }
    }
    window.addEventListener('aim:progress-replaced', syncLab);
    currentCleanup.push(function () { alive = false; window.removeEventListener('aim:progress-replaced', syncLab); if (inst && inst.destroy) inst.destroy(); });
    root.innerHTML = '<div class="empty">Loading the lab…</div>';
    ensureLab(meta.id).then(function (l) {
      if (!alive || !root.isConnected) return;
      lab = l;
      start();
    }, function (err) {
      if (alive) root.innerHTML = '<div class="empty">' + esc(err.message) + '. Check your connection and reload.</div>';
    });
  }
  function viewLabs() {
    var ids = Object.keys(LABS);
    var byModule = D.modules.filter(function (m) { return labOf(m); });
    setView('<div class="wrap stack-lg">' + crumbs([['Home', 'home'], ['Labs']]) +
      '<header class="stack-sm"><h1>Interactive labs</h1><p class="lede muted prose">Play first, then learn the maths. Each lab has small challenges; finishing them counts toward your module progress.</p></header>' +
      '<div class="grid">' + byModule.map(function (m) {
        var lab = labOf(m), t = lab.tasks || [], dn = t.filter(function (x) { return S().labs[lab.id] && S().labs[lab.id][x.id]; }).length;
        return '<a class="card stack-sm" href="#lab-' + esc(lab.id) + '" style="text-decoration:none;color:inherit"><span class="eyebrow">Module ' + modNo(m) + ' · ' + esc(m.title) + '</span><h2 class="h-sub3">' + esc(lab.title) + '</h2><p class="small muted">' + esc(lab.summary || '') + '</p>' +
          '<div class="row"><span class="chip num">' + dn + '/' + t.length + ' tasks</span></div></a>';
      }).join('') + (ids.length ? '' : '<div class="empty">Labs are loading.</div>') + '</div></div>', 'Labs');
  }
  function viewLab(id) {
    var lab = LABS[id]; if (!lab) return viewNotFound();
    var m = modById[lab.module];
    setView('<div class="wrap stack">' + crumbs([['Home', 'home'], ['Labs', 'labs'], [lab.title]]) +
      '<header class="stack-sm"><span class="eyebrow">' + (m ? 'Module ' + modNo(m) + ' · ' + esc(m.title) : 'Lab') + '</span><h1>' + esc(lab.title) + '</h1><p class="muted prose">' + esc(lab.summary || '') + '</p></header>' +
      '<div id="labroot"></div>' + (m ? '<p><a href="#m-' + esc(m.id) + '">Go to the module: videos, practice and quiz →</a></p>' : '') + '</div>', lab.title);
    mountLab(lab, document.getElementById('labroot'));
  }

  /* ---------- exercises ---------- */
  var FRIENDLY = {
    NameError: 'Python does not know this name. Check the spelling, capital letters, and that you defined it before using it.',
    SyntaxError: 'Python could not read this line. Look for a missing colon (:), bracket, quote or comma.',
    IndentationError: 'The spaces at the start of a line are wrong. Code inside if/for/def must be indented by 4 spaces.',
    TypeError: 'A value of the wrong type was used, e.g. adding text to a number, or calling a function with the wrong number of inputs.',
    ZeroDivisionError: 'Something was divided by zero.',
    IndexError: 'You asked for a position that does not exist in the list (remember: counting starts at 0).',
    KeyError: 'That key is not in the dictionary or DataFrame. Check the exact name.',
    AttributeError: 'This object does not have that method or property. Check spelling, or what type the object is.',
    ValueError: 'The value has the right type but a wrong value, e.g. converting "abc" to a number.',
    ModuleNotFoundError: 'That library is not available in the browser version of Python.',
    RuntimeError: 'Something stopped the program while it was running. Read the message above; for input(), type the value straight into your code instead.'
  };
  function mountExercise(e, root, opts) {
    opts = opts || {};
    var saved = S().code[e.id], done = S().ex[e.id] && S().ex[e.id].done;
    var hintN = 0, solArmed = false;
    root.innerHTML = '<div class="ex"><div class="row-between">' + (opts.hideTitle ? '<span></span>' : '<h2 class="h-sub">' + esc(e.title) + '</h2>') + '<div class="row">' +
      (done ? '<span class="chip chip-ok">Solved</span>' : '') + (e.optional ? '<span class="chip chip-hi">Optional</span>' : '') + (e.difficulty && e.difficulty !== 'free' ? '<span class="chip chip-level">' + esc(e.difficulty) + '</span>' : '') +
      (e.packages && e.packages.length ? '<span class="chip">' + esc(e.packages.join(', ')) + '</span>' : '') + '</div></div>' +
      (e.concept ? '<span class="small muted">Practises: ' + inline(e.concept) + '</span>' : '') +
      (e.optional ? '<div class="callout small">Optional: this module needs no coding. Try this after Module 1.2 (Python), or press <strong>Show solution</strong>, then <strong>Run</strong>, and read the output.</div>' : '') +
      '<div class="prose">' + md(e.task) + '</div>' +
      '<div class="editor"><label class="visually-hidden" for="code-' + esc(e.id) + '">Code for ' + esc(e.title) + '</label><textarea id="code-' + esc(e.id) + '" aria-describedby="keys-' + esc(e.id) + '" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off">' + esc(saved != null ? saved : e.starter) + '</textarea></div>' +
      // Tab indents inside the editor, so keyboard users need (and are told) another way out: Esc, then Tab
      '<p class="kbd-hint" id="keys-' + esc(e.id) + '">In the editor, Tab adds 4 spaces. To move on to the buttons, press Esc, then Tab.' + (e.tests ? ' Ctrl/⌘ + Enter = Check.' : '') + '</p>' +
      '<div class="row"><button class="btn btn-primary" data-x="check">Check</button><button class="btn" data-x="run">Run</button><button class="btn" data-x="stop" hidden>Stop</button>' +
      '<button class="btn btn-ghost" data-x="hint">Hint</button><button class="btn btn-ghost" data-x="reset">Reset</button><button class="btn btn-ghost" data-x="sol">Show solution</button></div>' +
      '<div class="stack-sm" data-x="hints"></div><div class="console" data-x="out" aria-live="polite"><span class="info">Output appears here.</span></div><ul class="checklist" data-x="results"></ul></div>';
    var ta = root.querySelector('textarea'), out = root.querySelector('[data-x=out]'), res = root.querySelector('[data-x=results]');
    var bStop = root.querySelector('[data-x=stop]'), t = null, busy = false;
    var flushCode = function () { if (!t) return; clearTimeout(t); t = null; if (e.id !== 'playground') { S().code[e.id] = ta.value; C.save(); } };
    function fit() { ta.style.height = 'auto'; ta.style.height = Math.max(220, ta.scrollHeight + 2) + 'px'; }
    ta.addEventListener('input', function () { clearTimeout(t); t = setTimeout(flushCode, 400); fit(); });
    setTimeout(fit, 0);
    pendingFlush.push(flushCode); currentCleanup.push(flushCode);
    currentCleanup.push(function () { if (busy) R.stop(); });
    function setBusy(b) { busy = b; root.querySelector('[data-x=check]').disabled = b; root.querySelector('[data-x=run]').disabled = b; bStop.hidden = !b; }
    // the code that runs is the code that is kept, also after Show solution or Reset (they change the editor without typing)
    function saveShown() { clearTimeout(t); t = null; if (e.id === 'playground') return; var was = S().code[e.id]; if (ta.value !== (was != null ? was : e.starter)) { S().code[e.id] = ta.value; C.save(); } }
    var escOut = false; // Esc, then Tab: move on to the buttons instead of indenting (explained under the editor)
    ta.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { escOut = true; return; }
      if (ev.key === 'Tab' && !ev.shiftKey && !ev.ctrlKey && !ev.altKey && !ev.metaKey) {
        if (escOut) { escOut = false; return; }
        ev.preventDefault();
        // insertText keeps Ctrl+Z working and fires 'input', so the spaces are saved like typed text
        var typed = false; try { typed = document.execCommand('insertText', false, '    '); } catch (x) {}
        if (!typed) { var s = ta.selectionStart; ta.value = ta.value.slice(0, s) + '    ' + ta.value.slice(ta.selectionEnd); ta.selectionStart = ta.selectionEnd = s + 4; ta.dispatchEvent(new Event('input')); }
        return;
      }
      if (!/^(Shift|Control|Alt|Meta)$/.test(ev.key)) escOut = false;
      if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); go(true); }
    });
    ta.addEventListener('blur', function () { escOut = false; });
    function line(cls, text) { var s = document.createElement('span'); s.className = cls; s.textContent = text; out.appendChild(s); }
    function go(withTests) {
      if (busy) return;
      saveShown();
      out.innerHTML = ''; res.innerHTML = '';
      if (R.status === 'running') line('info', 'Waiting for a previous program to finish… press Stop if it is stuck.\n');
      setBusy(true);
      var started = Date.now();
      R.run(ta.value, {
        tests: withTests ? e.tests : '', packages: e.packages || [],
        onStdout: function (txt, kind) {
          out.querySelectorAll('.info').forEach(function (n) { n.remove(); });
          if (out.childNodes.length > 2000) return;
          line(kind === 'stderr' ? 'err' : '', txt);
        },
        onStatus: function (txt) { if (!out.querySelector('.ok,.err,span:not(.info)')) { out.innerHTML = ''; line('info', txt + '\n'); } }
      }).then(function (r) {
        setBusy(false);
        out.querySelectorAll('.info').forEach(function (n) { n.remove(); });
        if (r.error) {
          line('err', (r.error.line ? 'Line ' + r.error.line + ': ' : '') + r.error.type + ': ' + r.error.message + '\n');
          if (FRIENDLY[r.error.type]) line('info', 'What this means: ' + FRIENDLY[r.error.type] + '\n');
        }
        if (!out.textContent.trim()) line('info', withTests ? 'Code ran with no printed output.\n' : 'Code ran with no printed output. Use print(...) to see values.\n');
        if (withTests) {
          var all = r.results || [], ok = all.filter(function (x) { return x.ok; }).length;
          res.innerHTML = all.map(function (x) {
            var et = x.error ? String(x.error).split(':')[0] : '';
            return '<li class="small ex-res ' + (x.ok ? 'ok' : 'bad') + '"><span>' + (x.ok ? '✓ ' : '✗ ') + inline(x.name) + (!x.ok && x.hint ? '<br><span class="muted">Hint: ' + inline(x.hint) + '</span>' : '') + (!x.ok && x.error ? '<br><code>' + esc(x.error) + '</code>' + (FRIENDLY[et] ? '<br><span class="muted">' + esc(FRIENDLY[et]) + '</span>' : '') : '') + '</span></li>';
          }).join('');
          if (all.length && ok === all.length) {
            line('ok', '\nAll ' + all.length + ' checks passed in ' + ((Date.now() - started) / 1000).toFixed(1) + ' s. Well done!\n');
            if (!(S().ex[e.id] && S().ex[e.id].done)) {
              S().ex[e.id] = { done: true, at: C.today() }; C.logActivity(); C.save(); C.toast('Exercise solved'); refreshSide();
              var hr = root.querySelector('.ex > .row-between .row'); if (hr && !hr.querySelector('.chip-ok')) hr.insertAdjacentHTML('afterbegin', '<span class="chip chip-ok">Solved</span>');
            }
          } else if (all.length) line('info', '\n' + ok + ' of ' + all.length + ' checks passed. Read the hints below.\n');
        }
      }).catch(function (err) { setBusy(false); out.innerHTML = ''; line('err', String(err.message || err) + '\n'); });
    }
    root.querySelector('[data-x=check]').addEventListener('click', function () { go(true); });
    root.querySelector('[data-x=run]').addEventListener('click', function () { go(false); });
    bStop.addEventListener('click', function () { R.stop(); setBusy(false); });
    root.querySelector('[data-x=hint]').addEventListener('click', function () {
      var hs = e.hints || [], box = root.querySelector('[data-x=hints]');
      if (hintN >= hs.length) { C.toast('No more hints. Try "Show solution".'); return; }
      var d = document.createElement('div'); d.className = 'callout small'; d.innerHTML = '<strong>Hint ' + (hintN + 1) + ':</strong> ' + inline(hs[hintN]); box.appendChild(d); hintN++;
    });
    // Reset asks first (a second click within 4 s), then offers Undo reset until the learner types again
    var bReset = root.querySelector('[data-x=reset]'), resetArmed = false, resetTimer = null, undoCode = null;
    function resetIdle() { clearTimeout(resetTimer); resetArmed = false; undoCode = null; bReset.textContent = 'Reset'; }
    function putCode(v) { ta.value = v; clearTimeout(t); t = null; if (e.id !== 'playground') { S().code[e.id] = v; C.save(); } fit(); }
    ta.addEventListener('input', function () { if (undoCode != null || resetArmed) resetIdle(); });
    bReset.addEventListener('click', function () {
      if (undoCode != null) { var back = undoCode; resetIdle(); putCode(back); C.toast('Your code is back.'); return; }
      if (ta.value === e.starter) { resetIdle(); return; }
      if (!resetArmed) { resetArmed = true; bReset.textContent = 'Sure? Click again to reset'; resetTimer = setTimeout(resetIdle, 4000); return; }
      var mine = ta.value; resetIdle(); putCode(e.starter); undoCode = mine; bReset.textContent = 'Undo reset';
      C.toast('The starting code is back. Press Undo reset to get your code back.');
    });
    root.querySelector('[data-x=sol]').addEventListener('click', function (ev) {
      var b = ev.currentTarget;
      if (!e.solution) return;
      if (!solArmed) { solArmed = true; b.textContent = 'Sure? Click again to reveal'; setTimeout(function () { solArmed = false; b.textContent = 'Show solution'; }, 4000); return; }
      ta.value = e.solution; b.textContent = 'Solution shown'; solArmed = false; fit();
    });
  }
  function viewPractice() {
    var st = S();
    setView('<div class="wrap stack-lg">' + crumbs([['Home', 'home'], ['Practice']]) +
      '<header class="stack-sm"><h1>Practice</h1><p class="lede muted prose">' + D.exercises.length + ' auto-graded Python exercises that run in your browser. Solve them in order inside each module, or jump straight in here.</p><div class="row"><a class="btn" href="#playground">Open the free Python playground</a></div></header>' +
      D.levels.map(function (l) {
        var ms = modulesOf(l.id).filter(function (m) { return exOf(m.id).length; });
        if (!ms.length) return '';
        return '<section class="stack"><h2>Level ' + l.id + ' · ' + esc(l.name) + '</h2>' + ms.map(function (m) {
          var exs = exOf(m.id);
          return '<div class="stack-sm"><h3 class="small eyebrow"><a href="#m-' + esc(m.id) + '~practice">' + esc(modNo(m) + ' ' + m.title) + '</a> · ' + exs.length + ' exercise' + (exs.length > 1 ? 's' : '') + '</h3><div class="module-list">' + exs.map(function (e, i) {
            var d = st.ex[e.id] && st.ex[e.id].done;
            return '<a class="module-row' + (d ? ' done' : '') + '" href="#ex-' + esc(e.id.replace(/^ex-/, '')) + '"><span class="idx num">' + (d ? '✓' : modNo(m) + '.' + (i + 1)) + '</span><span><h3>' + esc(e.title) + '</h3>' + (e.concept ? '<span class="small muted">' + inline(e.concept) + '</span>' : '') + '</span><span class="row">' + (e.optional ? '<span class="chip chip-hi">Optional</span>' : '') + (d ? '<span class="chip chip-ok">Solved</span>' : '<span class="chip chip-level">' + esc(e.difficulty) + '</span>') + '</span></a>';
          }).join('') + '</div></div>';
        }).join('') + '</section>';
      }).join('') + (D.exercises.length ? '' : '<div class="empty">Exercises are being added.</div>') + '</div>', 'Practice');
  }
  function viewExercise(rid) {
    var e = exById['ex-' + rid] || exById[rid]; if (!e) return viewNotFound();
    var m = modById[e.moduleId];
    setView('<div class="wrap stack">' + crumbs([['Home', 'home'], ['Practice', 'practice'], [e.title]]) +
      '<header class="stack-sm"><span class="eyebrow">' + (m ? 'Module ' + modNo(m) + ' · ' + esc(m.title) : '') + '</span><h1>' + esc(e.title) + '</h1></header><div id="exroot"></div>' +
      (m ? '<p><a href="#m-' + esc(m.id) + '">Back to the module →</a></p>' : '') + '</div>', e.title);
    mountExercise(e, document.getElementById('exroot'), { hideTitle: true });
  }
  function viewPlayground() {
    var pg = { id: 'playground', title: 'Python playground', difficulty: 'free', packages: [], task: 'Write any Python here and press **Run**. `numpy`, `pandas` and `scikit-learn` load automatically when you import them.', starter: 'import numpy as np\n\nmarks = np.array([72, 85, 64, 90, 78])\nprint("Average marks:", marks.mean())\nprint("Above 75:", marks[marks > 75])\n', solution: '', tests: '', hints: ['Use print(...) to see values.'] };
    setView('<div class="wrap stack">' + crumbs([['Home', 'home'], ['Practice', 'practice'], ['Playground']]) + '<header><h1>Python playground</h1></header><div id="exroot"></div></div>', 'Playground');
    mountExercise(pg, document.getElementById('exroot'), { hideTitle: true });
    var root = document.getElementById('exroot');
    ['check', 'sol'].forEach(function (k) { var b = root.querySelector('[data-x=' + k + ']'); if (b) b.hidden = true; });
  }

  /* ---------- projects ---------- */
  function stars(n) { var s = ''; for (var i = 1; i <= 5; i++) s += i <= n ? '●' : '○'; return '<span class="num" aria-label="Difficulty ' + n + ' of 5" style="color:var(--haldi-ink);letter-spacing:2px">' + s + '</span>'; }
  function projCard(p) {
    var st = S().projects[p.id] || {}, ms = p.milestones || [], dn = ms.filter(function (x, i) { return st.steps && st.steps[i]; }).length;
    return '<a class="card stack-sm" href="#' + esc(p.id) + '" style="text-decoration:none;color:inherit"><div class="row-between"><span class="eyebrow">' + (p.level === 5 ? 'Grand capstone' : 'Level ' + p.level) + '</span>' + stars(p.difficulty || 3) + '</div>' +
      '<h3>' + esc(p.title) + '</h3><p class="small muted">' + inline(p.tagline || '') + '</p><div class="row"><span class="chip num">~' + esc(p.hours || '?') + ' h</span>' +
      (ms.length ? '<span class="chip num">' + dn + '/' + ms.length + ' milestones</span>' : '') + (st.done ? '<span class="chip chip-ok">Done</span>' : '') + '</div></a>';
  }
  function viewProjects() {
    var groups = [1, 2, 3, 4, 5];
    setView('<div class="wrap stack-lg">' + crumbs([['Home', 'home'], ['Projects']]) +
      '<header class="stack-sm"><h1>Tough projects</h1><p class="lede muted prose">Projects turn watching into skill. Each one has a client-style brief, real datasets, milestones, a rubric and stretch goals. Put every finished project on GitHub with a clear README.</p></header>' +
      groups.map(function (g) {
        var ps = D.projects.filter(function (p) { return p.level === g; });
        if (!ps.length) return '';
        var l = levelById[g];
        return '<section class="stack"><h2>' + (g === 5 ? 'Grand capstones' : 'Level ' + g + ' · ' + esc(l ? l.name : '')) + '</h2><div class="' + (ps.length === 4 ? 'grid-4' : 'grid') + '">' + ps.map(projCard).join('') + '</div></section>';
      }).join('') + (D.projects.length ? '' : '<div class="empty">Projects are being added.</div>') + '</div>', 'Projects');
  }
  function viewProject(id) {
    var p = projById[id]; if (!p) return viewNotFound();
    var st = S().projects[id] = S().projects[id] || { steps: {}, rubric: {}, links: {} };
    st.steps = st.steps || {}; st.rubric = st.rubric || {}; st.links = st.links || {};
    var html = '<div class="wrap stack-lg">' + crumbs([['Home', 'home'], ['Projects', 'projects'], [p.title]]) +
      '<header class="stack-sm"><div class="row"><span class="eyebrow">' + (p.level === 5 ? 'Grand capstone' : 'Level ' + p.level + ' project') + '</span>' + stars(p.difficulty || 3) + '<span class="chip num">~' + esc(p.hours || '?') + ' hours</span></div><h1>' + esc(p.title) + '</h1><p class="lede muted prose">' + inline(p.tagline || '') + '</p></header>' +
      '<div class="two-col"><div class="stack-lg">' +
      '<section class="stack-sm prose"><h2 class="h-sub">The brief</h2><p>' + inline(p.brief || '') + '</p>' + (p.why ? '<div class="callout callout-indigo"><strong>Why build this:</strong> ' + inline(p.why) + '</div>' : '') + (p.indiaContext ? '<p class="small muted">' + inline(p.indiaContext) + '</p>' : '') + '</section>' +
      (p.datasets && p.datasets.length ? '<section class="stack-sm"><h2 class="h-sub">Data</h2><ul class="prose">' + p.datasets.map(function (d) { return '<li>' + (d.url ? '<a href="' + esc(d.url) + '" target="_blank" rel="noopener">' + esc(d.name) + '</a>' : '<strong>' + esc(d.name) + '</strong>') + (d.note ? ' · <span class="muted">' + inline(d.note) + '</span>' : '') + '</li>'; }).join('') + '</ul></section>' : '') +
      '<section class="stack-sm"><h2 class="h-sub">Milestones</h2><ul class="checklist">' + (p.milestones || []).map(function (ms, i) {
        return '<li><label><input type="checkbox" data-action="pstep" data-id="' + esc(id) + '" data-i="' + i + '"' + (st.steps[i] ? ' checked' : '') + '><span><strong>' + esc(ms.title) + '</strong><br><span class="small muted">' + inline(ms.detail || '') + '</span></span></label></li>';
      }).join('') + '</ul></section>' +
      '<section class="stack-sm"><h2 class="h-sub">Rubric: grade yourself honestly</h2><div class="table-wrap"><table class="simple rubric"><thead><tr><th>Criterion</th><th>Basic</th><th>Good</th><th>Excellent</th></tr></thead><tbody>' +
      (p.rubric || []).map(function (r, i) {
        return '<tr><td><strong>' + esc(r.criterion) + '</strong></td>' + ['basic', 'good', 'excellent'].map(function (lv, k) {
          return '<td data-label="' + ['Basic', 'Good', 'Excellent'][k] + '"><label class="small" style="display:grid;grid-template-columns:20px 1fr;gap:6px"><input type="radio" name="rub-' + i + '" data-action="prub" data-id="' + esc(id) + '" data-i="' + i + '" value="' + (k + 1) + '"' + (st.rubric[i] === k + 1 ? ' checked' : '') + '><span>' + inline(r[lv] || '') + '</span></label></td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table></div><p class="small muted" id="rub-score"></p></section>' +
      listBlock('Stretch goals', p.stretch) + listBlock('Pitfalls to avoid', p.pitfalls) +
      (window.AIM_PUBLISH ? window.AIM_PUBLISH.html(p, st) : '') +
      '</div><aside class="stack">' + (p.freeStack ? '<div class="callout small"><strong>Free tools (₹0):</strong> ' + inline(p.freeStack) + '</div>' : '') +
      '<div class="card stack-sm"><strong>Deliverables</strong><ul class="small">' + (p.deliverables || []).map(function (d) { return '<li>' + inline(d) + '</li>'; }).join('') + '</ul></div>' +
      (p.skills && p.skills.length ? '<div class="card stack-sm"><strong>Skills you will use</strong><ul class="small skill-list">' + p.skills.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></div>' : '') +
      '<div class="card stack-sm"><strong>Your links</strong><label class="small" for="pl-repo">GitHub repo</label><input type="text" id="pl-repo" data-action="plink" data-k="repo" data-id="' + esc(id) + '" value="' + esc(st.links.repo || '') + '" placeholder="https://github.com/you/project">' +
      '<label class="small" for="pl-demo">Live demo</label><input type="text" id="pl-demo" data-action="plink" data-k="demo" data-id="' + esc(id) + '" value="' + esc(st.links.demo || '') + '" placeholder="https://huggingface.co/spaces/...">' +
      '<button class="btn ' + (st.done ? '' : 'btn-haldi') + '" data-action="pdone" data-id="' + esc(id) + '">' + (st.done ? 'Completed ✓ (undo)' : 'Mark project complete') + '</button></div>' +
      (p.modules && p.modules.length ? '<div class="card stack-sm"><strong>Learn first</strong><ul class="small">' + p.modules.map(function (mid) { return modById[mid] ? '<li><a href="#m-' + esc(mid) + '">' + esc(modById[mid].title) + '</a></li>' : ''; }).join('') + '</ul></div>' : '') +
      '</aside></div></div>';
    setView(html, p.title);
    updateRubric(p, st);
    if (window.AIM_PUBLISH) window.AIM_PUBLISH.bind(main, p, st, { onLink: function (k, v) { var inp = document.getElementById('pl-' + k); if (inp) inp.value = v; } });
  }
  function updateRubric(p, st) {
    var el = document.getElementById('rub-score'); if (!el) return;
    var n = (p.rubric || []).length, got = 0, rated = 0;
    for (var i = 0; i < n; i++) if (st.rubric[i]) { got += st.rubric[i]; rated++; }
    el.textContent = rated ? 'Self-score: ' + got + ' / ' + (n * 3) + ' (' + rated + ' of ' + n + ' rated). Aim for "Good" or better on every row before calling it done.' : 'Pick one cell per row to self-assess.';
  }

  /* ---------- tests ---------- */
  function viewTests() {
    setView('<div class="wrap stack-lg">' + crumbs([['Home', 'home'], ['Tests']]) +
      '<header class="stack-sm"><h1>Level tests</h1><p class="lede muted prose">Each test mixes the whole level. Answers are revealed only after you submit. Pass with 70% before moving on. Module quizzes live on each module page.</p></header><div class="grid-4">' +
      D.levels.map(function (l) {
        var q = D.quizzes['test-l' + l.id] || [], s = S().quiz['test-l' + l.id], kept = testSaved('test-l' + l.id);
        return '<div class="card stack-sm"><span class="eyebrow">Level ' + l.id + ' · ' + esc(l.name) + '</span><h2 class="h-sub3">' + esc(l.title) + '</h2><span class="small muted">' + q.length + ' questions · ' + Math.max(15, Math.round(q.length * 1.5)) + ' minutes</span>' +
          (s ? '<span class="chip ' + (s.best >= 70 ? 'chip-ok' : '') + ' num">Best ' + esc(s.best) + '%</span>' : '') +
          (kept ? '<span class="small">Unfinished: <span class="num">' + kept.n + ' of ' + q.length + '</span> answered</span>' : '') +
          '<a class="btn btn-primary" href="#test-l' + l.id + '">' + (kept ? 'Resume' : s ? 'Retake' : 'Start') + ' test</a></div>';
      }).join('') + '</div>' +
      '<section class="stack"><h2>Quizzes and level tests taken</h2>' + quizTable() + '</section></div>', 'Tests');
  }
  // module quizzes and level tests taken. On a narrow phone the Attempts column is left out (style.css), so the
  // passed / retry result stays in view.
  function quizTable() {
    var row = function (href, name, q) {
      return '<tr><td><a href="' + esc(href) + '">' + esc(name) + '</a></td><td class="num">' + esc(q.best) + '%</td><td class="num q-att">' + esc(q.attempts) + '</td><td>' + (q.best >= 70 ? '<span class="chip chip-ok">passed</span>' : '<span class="chip">retry</span>') + '</td></tr>';
    };
    var testRows = D.levels.filter(function (l) { return S().quiz['test-l' + l.id]; }).map(function (l) { return row('#test-l' + l.id, 'Level ' + l.id + ' test', S().quiz['test-l' + l.id]); });
    var rows = D.modules.filter(function (m) { return S().quiz[m.id]; }).map(function (m) { return row('#m-' + m.id + '~quiz', modNo(m) + ' ' + m.title, S().quiz[m.id]); });
    rows = testRows.concat(rows);
    return rows.length ? '<div class="table-wrap"><table class="simple quiz-table"><thead><tr><th>Quiz or test</th><th>Best</th><th class="q-att">Attempts</th><th><span class="visually-hidden">Result</span></th></tr></thead><tbody>' + rows.join('') + '</tbody></table></div>' : '<div class="empty">No quizzes or tests taken yet. Every module has a quiz, and every level has a test.</div>';
  }
  function viewTest(lv) {
    var l = levelById[lv], q = D.quizzes['test-l' + lv]; if (!l || !q) return viewNotFound();
    var mins = Math.max(15, Math.round(q.length * 1.5)), key = 'test-l' + lv, kept = testSaved(key);
    setView('<div class="wrap stack">' + crumbs([['Home', 'home'], ['Tests', 'tests'], ['Level ' + lv]]) +
      '<header class="stack-sm"><span class="eyebrow">Level ' + lv + ' · ' + esc(l.name) + '</span><h1>Level ' + lv + ' test</h1><p class="muted prose">' + q.length + ' questions. Optional ' + mins + '-minute timer. You will see your score and full explanations after you submit.</p></header>' +
      '<div id="testroot"><div class="card stack test-start">' +
        (kept ? '<div class="callout stack-sm" id="test-kept"><p>You left this test part-way: <strong class="num">' + Math.min(kept.n, q.length) + ' of ' + q.length + '</strong> answered' + (kept.minutes ? ', <strong class="num">' + mmss(kept.left) + '</strong> left on the timer' : '') + '. Carry on where you stopped, or start again below.</p>' +
          '<button class="btn btn-primary" id="resume" style="width:100%">Resume the test</button></div>' : '') +
        '<ul class="small"><li>Pass mark 70% · ' + q.length + ' questions</li><li>Covers modules ' + lv + '.1 to ' + lv + '.' + modulesOf(lv).length + '</li>' +
        (S().quiz[key] ? '<li>Your best so far: ' + esc(S().quiz[key].best) + '%</li>' : '') + '<li>If you leave part-way, your answers and the time left are kept, so you can carry on later.</li></ul>' +
        '<label class="row"><input type="checkbox" id="timed" checked> Use the ' + mins + '-minute timer</label><button class="btn' + (kept ? '' : ' btn-primary') + '" id="begin" style="width:100%">' + (kept ? 'Start again' : 'Begin the test') + '</button></div></div></div>', 'Level ' + lv + ' test');
    // from = a test left part-way (Resume), or null for a fresh start (which also drops a kept one)
    var run = function (from) {
      var timed = from ? !!from.minutes : document.getElementById('timed').checked;
      var quiz = new C.Quiz(document.getElementById('testroot'), { questions: q, mode: 'test', key: key, minutes: timed ? mins : 0, resume: from,
        // every answer and step (and every few seconds on the timer) is kept in this browser until the test is submitted
        onChange: function (s) { testKeep(key, s); },
        onFinish: function (r) { testKeep(key, null); recordQuiz(key, r.score); }, onAnswer: function (r) { if (ST()) ST().emit('answer', r); } });
      liveTest = quiz;
      // closing or reloading the tab, or the phone putting it away, keeps the place too
      var keepNow = function () { quiz.changed(); };
      window.addEventListener('pagehide', keepNow); document.addEventListener('visibilitychange', keepNow);
      currentCleanup.push(function () {
        window.removeEventListener('pagehide', keepNow); document.removeEventListener('visibilitychange', keepNow);
        var s = quiz.onChange && quiz.snapshot();
        quiz.destroy(); if (liveTest === quiz) liveTest = null;
        if (s && s.n) C.toast('Your level ' + lv + ' test is kept (' + s.n + ' of ' + q.length + ' answered). Open it again to carry on.');
      });
      quiz.focusQ(); // keyboard and screen-reader users start at the first question, not at the top of the page
    };
    document.getElementById('begin').addEventListener('click', function () { run(null); });
    var rb = document.getElementById('resume'); if (rb) rb.addEventListener('click', function () { run(kept); });
  }
  // A level test left part-way (Back, a link, the search key, a reload, a closed tab) is kept in this browser: its
  // answers, the question it was on and the time left on its timer (the timer waits while the test is not open).
  // It is not part of the saved progress (no sync); Reset all progress clears it.
  var TEST_KEEP = 'aimarg.test.', liveTest = null;
  function testSaved(key) {
    var o = null; try { o = JSON.parse(localStorage.getItem(TEST_KEEP + key) || 'null'); } catch (e) { return null; }
    if (!o || typeof o !== 'object' || !o.answers || typeof o.answers !== 'object') return null;
    o.n = Object.keys(o.answers).length; o.minutes = Number(o.minutes) || 0; o.left = Math.max(0, Number(o.left) || 0);
    return o.n ? o : null;
  }
  function testKeep(key, snap) {
    try { if (snap && snap.n) localStorage.setItem(TEST_KEEP + key, JSON.stringify(snap)); else localStorage.removeItem(TEST_KEEP + key); } catch (e) {}
  }
  function mmss(ms) { var s = Math.floor(Math.max(0, ms) / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  window.addEventListener('aim:progress-reset', function () {
    if (liveTest) liveTest.onChange = null; // a test open while progress is reset is not kept either
    D.levels.forEach(function (l) { testKeep('test-l' + l.id, null); });
  });

  /* ---------- search matching (Search page, Library and Glossary) ---------- */
  // A query matches at the start of words: "rag" finds RAG and RAGAS but not "storage" or "averages", and "lora" finds
  // LoRA but not "exploratory". Every word of a longer query must match. The best matches come first: the exact name,
  // then the name holding the query as a whole word, then as a word start, then the same in the other fields.
  // Search and the Library/Glossary use the same fields, so "See all N" on Search opens a list of those N.
  var WORD_CH = '\\p{L}\\p{N}';
  function searchScorer(query) {
    var q = String(query || '').toLowerCase().replace(/\s+/g, ' ').trim();
    if (!q) return null;
    var rx = function (s, whole) {
      var lead = new RegExp('^[' + WORD_CH + ']', 'u').test(s) ? '(?:^|[^' + WORD_CH + '])' : '';
      return new RegExp(lead + s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + (whole ? '(?![' + WORD_CH + '])' : ''), 'iu');
    };
    var words = q.split(' '), whole = rx(q, true), start = rx(q, false), each = words.map(function (w) { return rx(w, false); });
    return function (fields) { // [[text, weight], …] with the item's name first
      var best = 0, texts = [];
      fields.forEach(function (f, i) {
        var t = f[0] == null ? '' : String(f[0]); if (!t) return;
        texts.push(t);
        var s = 0, n = t.toLowerCase().replace(/\s+/g, ' ').trim();
        // "RAG (Retrieval-Augmented Generation)" is an exact name for "rag" and for "retrieval-augmented generation"
        if (i === 0 && (n === q || n.replace(/\s*\([^)]*\)$/, '') === q || (/\(([^)]*)\)$/.exec(n) || [])[1] === q)) s = 100;
        else if (whole.test(t)) s = 40;
        else if (start.test(t)) s = 30;
        else if (words.length > 1 && each.every(function (r) { return r.test(t); })) s = 20;
        best = Math.max(best, s * (f[1] || 1));
      });
      if (!best && words.length > 1 && each.every(function (r) { return texts.some(function (t) { return r.test(t); }); })) best = 10;
      return best;
    };
  }
  // the items that match, best first (equal scores keep the list's own order)
  function searchRank(list, query, fields) {
    var score = searchScorer(query); if (!score) return list.slice();
    return list.map(function (x, i) { return { x: x, s: score(fields(x)), i: i }; }).filter(function (o) { return o.s > 0; })
      .sort(function (a, b) { return b.s - a.s || a.i - b.i; }).map(function (o) { return o.x; });
  }
  function resFields(r) { return [[r.title, 3], [r.creator, 2], [(r.topics || []).join(', '), 1], [r.platform, 1], [r.why, 1]]; }
  // Hindi, Hinglish and Indian English teachers first (the Library's order, and the Search order for equal matches)
  function byLang(list) { return list.slice().sort(function (a, b) { return C.langRank(a.language) - C.langRank(b.language); }); }
  function glossFields(g) { return [[g.term, 3], [g.simple, 1]]; }

  /* ---------- library ---------- */
  // Filters last while the learner moves Back and Forward. A link to the Library (menu, home page) opens the full
  // list, and "See all N" on Search opens it with that search only (see "links into the Library…" below).
  var LIB_PAGE = 48;
  function libDefaults(q) { return { q: q || '', lang: 'all', level: 'all', type: 'all', shown: LIB_PAGE }; }
  var libState = libDefaults();
  function cap(t) { t = String(t || ''); return t.charAt(0).toUpperCase() + t.slice(1); }
  // the course levels a resource is used in: the levels of its modules (its own "level" tag is a difficulty guess)
  function resLevels(r) { return (r.modules || []).map(function (id) { return modById[id] ? modById[id].level : 0; }); }
  function viewLibrary() {
    var types = {}; D.resources.forEach(function (r) { types[r.type] = 1; });
    setView('<div class="wrap stack-lg">' + crumbs([['Home', 'home'], ['Library']]) +
      '<header class="stack-sm"><h1>Library</h1><p class="lede muted prose">Every free resource in the course, in one place. Filter by language, by the course level that uses it, or by type.</p></header>' +
      '<div class="filters"><label class="visually-hidden" for="lib-q">Search</label><input type="search" id="lib-q" placeholder="Search: e.g. pandas, CampusX, transformers, NPTEL" value="' + esc(libState.q) + '">' +
      selectHTML('lib-lang', 'Language', [['all', 'All languages'], ['hi', 'Hindi + Hinglish'], ['indian-english', 'Indian English'], ['english', 'English']], libState.lang) +
      selectHTML('lib-level', 'Course level that uses it', [['all', 'All course levels']].concat(D.levels.map(function (l) { return [String(l.id), 'Level ' + l.id + ' · ' + l.name]; })), libState.level) +
      selectHTML('lib-type', 'Type', [['all', 'All types']].concat(Object.keys(types).sort().map(function (t) { return [t, cap(t)]; })), libState.type) +
      '</div><h2 class="visually-hidden">Resources</h2><div class="row-between"><div class="small muted num" id="lib-count"></div><button class="btn btn-sm" type="button" id="lib-reset" hidden>Clear filters</button></div><div class="grid" id="lib-grid"></div><div id="lib-more"></div></div>', 'Library');
    var lastList = [];
    function moreButton() {
      var shown = Math.min(libState.shown, lastList.length);
      document.getElementById('lib-count').textContent = 'Showing ' + shown + ' of ' + lastList.length + ' matching resources · ' + (libState.q.trim() ? 'best matches first' : 'Hindi, Hinglish and Indian English teachers listed first');
      document.getElementById('lib-more').innerHTML = shown < lastList.length ? '<button class="btn" type="button" id="lib-more-btn">Show ' + Math.min(LIB_PAGE, lastList.length - shown) + ' more</button>' : '';
      var mb = document.getElementById('lib-more-btn');
      if (mb) mb.addEventListener('click', function () {
        var from = shown, grid = document.getElementById('lib-grid');
        libState.shown = shown + LIB_PAGE;
        grid.insertAdjacentHTML('beforeend', lastList.slice(from, Math.min(libState.shown, lastList.length)).map(function (r) { return resCard(r); }).join(''));
        moreButton();
        // keyboard users continue at the first new card
        var first = grid.children[from]; var link = first && first.querySelector('.res-title a'); if (link) link.focus();
      });
    }
    function apply(keepShown) {
      if (!keepShown) libState.shown = LIB_PAGE;
      libState.q = document.getElementById('lib-q').value;
      libState.lang = document.getElementById('lib-lang').value; libState.level = document.getElementById('lib-level').value; libState.type = document.getElementById('lib-type').value;
      var list = D.resources.filter(function (r) {
        if (libState.lang === 'hi' && !(r.language === 'hindi' || r.language === 'hinglish')) return false;
        if (libState.lang !== 'all' && libState.lang !== 'hi' && r.language !== libState.lang) return false;
        if (libState.level !== 'all' && resLevels(r).indexOf(Number(libState.level)) < 0) return false;
        if (libState.type !== 'all' && r.type !== libState.type) return false;
        return true;
      });
      list = searchRank(byLang(list), libState.q, resFields); // language order; with a search, best matches first
      lastList = list;
      var shown = Math.min(libState.shown, list.length);
      document.getElementById('lib-grid').innerHTML = list.slice(0, shown).map(function (r) { return resCard(r); }).join('') || '<div class="empty stack-sm"><span>Nothing matches these filters.</span><div><button class="btn btn-sm" type="button" id="lib-clear">Clear filters</button></div></div>';
      moreButton();
      // any filter or search in use: say so, with one button that brings back the whole library
      var on = !!libState.q.trim() || libState.lang !== 'all' || libState.level !== 'all' || libState.type !== 'all';
      document.getElementById('lib-reset').hidden = !on || !list.length;
      var cb = document.getElementById('lib-clear'); if (cb) cb.addEventListener('click', clearAll);
    }
    function clearAll() {
      ['lib-lang', 'lib-level', 'lib-type'].forEach(function (id) { document.getElementById(id).value = 'all'; }); document.getElementById('lib-q').value = '';
      apply(); document.getElementById('lib-q').focus(); // the pressed button is gone: carry on from the search box
    }
    document.getElementById('lib-reset').addEventListener('click', clearAll);
    ['lib-q', 'lib-lang', 'lib-level', 'lib-type'].forEach(function (id) { document.getElementById(id).addEventListener(id === 'lib-q' ? 'input' : 'change', function () { apply(); }); });
    apply(true);
  }
  function selectHTML(id, label, opts, val) {
    return '<label class="visually-hidden" for="' + id + '">' + esc(label) + '</label><select id="' + id + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === val ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
  }

  /* ---------- glossary ---------- */
  var glossQ = '';
  function viewGlossary() {
    var list = D.glossary.slice().sort(function (a, b) { return a.term.localeCompare(b.term); });
    setView('<div class="wrap stack-lg">' + crumbs([['Home', 'home'], ['Glossary']]) +
      '<header class="stack-sm"><h1>Jargon buster</h1><p class="lede muted prose">' + list.length + ' AI and ML terms in plain English, each with an everyday example.</p><div class="row"><a class="btn btn-primary" href="#cards">Revise with flashcards</a></div></header>' +
      '<div class="filters"><label class="visually-hidden" for="g-q">Search terms</label><input type="search" id="g-q" placeholder="Search: overfitting, embedding, LoRA…" value="' + esc(glossQ) + '"></div>' +
      '<div class="row-between" id="g-filter" hidden><p class="small muted num" id="g-count"></p><button class="btn btn-sm" type="button" id="g-reset">Show all terms</button></div>' +
      '<nav class="az small" aria-label="Jump to letter">' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(function (L) { return list.some(function (g) { return g.term.charAt(0).toUpperCase() === L; }); }).map(function (L) { return '<a href="#" data-jump="g-' + L + '">' + L + '</a>'; }).join('') + '</nav><dl id="g-list"></dl></div>', 'Glossary');
    function apply() {
      var q = document.getElementById('g-q').value.trim(); glossQ = q;
      var seen = {};
      var f = searchRank(list, q, glossFields);
      // a search shows how many terms it keeps and how to see them all; its list is in best-match order, so the
      // A to Z letters (which jump through the full list) are hidden meanwhile
      main.querySelector('.az').hidden = !!q;
      document.getElementById('g-filter').hidden = !q;
      document.getElementById('g-count').textContent = q ? 'Showing ' + f.length + ' of ' + list.length + ' terms matching “' + q + '” · best matches first' : '';
      document.getElementById('g-list').innerHTML = f.map(function (g) {
        var m = modById[g.moduleId];
        var L = g.term.charAt(0).toUpperCase(), anchor = seen[L] || q ? '' : ' id="g-' + L + '"'; seen[L] = 1;
        return '<div class="gloss-term"' + anchor + '><dt>' + esc(g.term) + SPK.btn('.gloss-term', 'Listen: ' + g.term, { icon: true }) + '</dt><dd class="stack-sm"><span>' + inline(g.simple) + '</span>' +
          (g.example ? '<span class="small muted">Example: ' + inline(g.example) + '</span>' : '') + (m ? '<a class="small" href="#m-' + esc(m.id) + '">Learn it in ' + esc(modNo(m) + ' ' + m.title) + '</a>' : '') + '</dd></div>';
      }).join('') || '<div class="empty">No term matches.</div>';
    }
    document.getElementById('g-reset').addEventListener('click', function () { var b = document.getElementById('g-q'); b.value = ''; apply(); b.focus(); });
    document.getElementById('g-q').addEventListener('input', apply); apply();
  }

  /* ---------- career + faq ---------- */
  function viewCareer() {
    var pg = D.pages.career || { title: 'Careers', sections: [] }, faq = D.pages.faq || [], src = D.pages.sources || [];
    setView('<div class="wrap stack-lg">' + crumbs([['Home', 'home'], ['Career & FAQ']]) +
      '<header class="stack-sm"><h1>' + esc(pg.title || 'Careers') + '</h1><p class="lede muted prose">What to do with these skills in India: jobs, freelancing and AI services for agencies.</p></header>' +
      '<div class="prose stack">' + tocHTML(pg.sections) + sectionsHTML(pg.sections) + '</div>' +
      (faq.length ? '<section class="stack" id="faq-list" data-tts-open><h2>Frequently asked questions</h2><div class="stack-sm">' + faq.map(function (f) { return '<details class="fold"><summary>' + esc(f.q) + '</summary><div class="prose">' + md(f.a) + '</div></details>'; }).join('') + '</div></section>' : '') +
      (src.length ? '<section class="stack-sm"><h3>Sources checked</h3><ul class="small">' + src.map(function (s) { return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.label) + '</a> <span class="muted">(' + esc(s.checked || '') + ')</span></li>'; }).join('') + '</ul></section>' : '') +
      '</div>', 'Career & FAQ');
  }

  /* ---------- links into the Library, the Glossary and a module's videos ---------- */
  // A link to the Library or the Glossary opens the full list; "See all N" and the glossary results on Search carry
  // their search in data-q. A video or course found by Search (data-show-res) opens its module's Watch tab with that
  // card shown and focused, even when it sits under "Show N more".
  var pendingRes = null;
  document.addEventListener('click', function (ev) {
    if (ev.defaultPrevented || ev.button || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey || !ev.target.closest) return;
    var a = ev.target.closest('a[href="#library"], a[href="#glossary"], a[data-show-res]'); if (!a) return;
    var href = a.getAttribute('href');
    // data-play: start it too (Continue watching); a Library link also carries its search in data-q
    if (a.hasAttribute('data-show-res')) { pendingRes = { id: a.getAttribute('data-show-res'), hash: href, play: a.getAttribute('data-play') === '1' }; if (href !== '#library') return; }
    var q = a.getAttribute('data-q') || '', lib = href === '#library', before = lib ? JSON.stringify(libState) : glossQ;
    if (lib) libState = libDefaults(q); else glossQ = q;
    // that page is open already: no hashchange will come, so draw the new list now
    if (location.hash === href && before !== (lib ? JSON.stringify(libState) : glossQ)) route();
  });

  /* ---------- search ---------- */
  var searchQ = '';
  function viewSearch() {
    setView('<div class="wrap stack-lg">' + crumbs([['Home', 'home'], ['Search']]) +
      '<header class="stack-sm"><h1>Search</h1><p class="muted">Modules, labs, exercises, projects, glossary terms and videos.</p></header>' +
      '<div class="filters"><label class="visually-hidden" for="s-q">Search the course</label><input type="search" id="s-q" placeholder="Try: regression, RAG, CampusX, overfitting, LoRA" value="' + esc(searchQ) + '" autofocus></div><div id="s-out" class="stack-lg"></div></div>', 'Search');
    var inp = document.getElementById('s-q');
    // "See all N" opens the Library or the Glossary with this search only, other filters cleared (link handler above)
    function group(title, items, allHref, q) { return items.length ? '<section class="stack-sm"><h2 class="small eyebrow">' + esc(title) + ' · ' + items.length + '</h2><div class="module-list">' + items.slice(0, 12).join('') + '</div>' + (items.length > 12 && allHref ? '<a class="small" href="' + allHref + '" data-q="' + esc(q) + '">See all ' + items.length + ' →</a>' : '') + '</section>' : ''; }
    function row(href, title, meta, attrs) { return '<a class="module-row" href="' + esc(href) + '"' + (attrs || '') + '><span class="idx" aria-hidden="true">→</span><span><h3>' + esc(title) + '</h3><span class="meta"><span class="small muted">' + esc(meta) + '</span></span></span><span></span></a>'; }
    function apply() {
      var q = inp.value.trim(); searchQ = inp.value;
      var out = document.getElementById('s-out');
      if (q.length < 2) { out.innerHTML = '<div class="empty">Type at least two letters.</div>'; return; }
      var mods = searchRank(D.modules, q, function (m) { return [[m.title, 3], [(m.topics || []).join(', '), 1], [m.overview, 1]]; }).map(function (m) { return row('#m-' + m.id, modNo(m) + ' ' + m.title, levelName(m.level)); });
      var labs = searchRank(Object.keys(LABS).map(function (k) { return LABS[k]; }), q, function (l) { return [[l.title, 3], [l.summary, 1]]; }).map(function (l) { return row('#lab-' + l.id, l.title, 'Lab'); });
      var exs = searchRank(D.exercises, q, function (e) { return [[e.title, 3], [e.concept, 1], [e.task, 1]]; }).map(function (e) { return row('#ex-' + e.id.replace(/^ex-/, ''), e.title, (modById[e.moduleId] || {}).title || ''); });
      var prj = searchRank(D.projects, q, function (p) { return [[p.title, 3], [p.tagline, 1], [p.brief, 1]]; }).map(function (p) { return row('#' + p.id, p.title, p.level === 5 ? 'Capstone' : 'Level ' + p.level + ' project'); });
      var gl = searchRank(D.glossary, q, glossFields).map(function (g) { return row('#glossary', g.term, g.simple, ' data-q="' + esc(g.term) + '"'); });
      var res = searchRank(byLang(D.resources), q, resFields).map(function (r) { // the Library's order, so See all matches
        var m = resModule(r), meta = (r.creator || '') + ' · ' + (C.LANG_LABEL[r.language] || '');
        return m ? row('#m-' + m.id + '~watch', r.title, meta, ' data-show-res="' + esc(r.id) + '"') : row('#library', r.title, meta, ' data-q="' + esc(r.title) + '"');
      });
      var html = group('Modules', mods) + group('Labs', labs) + group('Practice', exs) + group('Projects', prj) + group('Glossary', gl, '#glossary', q) + group('Videos and courses', res, '#library', q);
      out.innerHTML = html || '<div class="empty">Nothing found for “' + esc(inp.value) + '”.</div>';
    }
    inp.addEventListener('input', apply); apply(); inp.focus();
  }

  /* ---------- flashcards ---------- */
  function viewCards() {
    var st = S(); st.cards = st.cards || {};
    var lastM = st.last && modById[st.last];
    var lvSel = st.prefs.cardLevel || (lastM ? String(lastM.level) : '1');
    setView('<div class="wrap stack-lg">' + crumbs([['Home', 'home'], ['Glossary', 'glossary'], ['Flashcards']]) +
      '<header class="stack-sm"><h1>Flashcards</h1><p class="lede muted prose">Revise the jargon. Read the term, say the meaning out loud, then flip. Cards you know come back less often.</p>' +
      '<div class="row">' + selectHTML('card-level', 'Level', [['all', 'All levels'], ['1', 'Level 1'], ['2', 'Level 2'], ['3', 'Level 3'], ['4', 'Level 4']], lvSel) + '<span class="small muted num" id="card-count"></span></div></header>' +
      '<div id="card-root" class="card-stage"></div></div>', 'Flashcards');
    var sel = document.getElementById('card-level');
    function deck() {
      var lv = sel.value;
      return D.glossary.filter(function (g) { var m = modById[g.moduleId]; return lv === 'all' || (m && String(m.level) === lv); });
    }
    function next() {
      var d = deck();
      document.getElementById('card-count').textContent = d.filter(function (g) { return (st.cards[g.term] || 0) >= 2; }).length + ' of ' + d.length + ' known';
      if (!d.length) { document.getElementById('card-root').innerHTML = '<div class="empty">No cards for this level yet.</div>'; return; }
      // weighted pick: unknown cards (score 0) far more likely than known ones
      var weights = d.map(function (g) { return 1 / Math.pow(3, st.cards[g.term] || 0); });
      var total = weights.reduce(function (a, b) { return a + b; }, 0), r = Math.random() * total, i = 0;
      while (r > weights[i] && i < d.length - 1) { r -= weights[i]; i++; }
      var g = d[i], flipped = false;
      var root = document.getElementById('card-root');
      function draw() {
        root.innerHTML = '<div class="card stack" style="min-height:260px;justify-content:center;text-align:center;align-items:center">' +
          '<span class="eyebrow">' + esc((modById[g.moduleId] || {}).title || 'Glossary') + '</span>' +
          '<div style="font-family:var(--font-display);font-size:var(--step-3);line-height:1.2">' + esc(g.term) + '</div>' +
          (flipped ? '<p class="prose" style="max-width:52ch">' + inline(g.simple) + '</p>' + (g.example ? '<p class="small muted prose" style="max-width:52ch">' + inline(g.example) + '</p>' : '') : '<p class="muted small">What does it mean?</p>') +
          '<div class="row" style="justify-content:center">' + (flipped ? '<button class="btn" data-c="again">Again</button><button class="btn btn-primary" data-c="know">I knew it</button>' : '<button class="btn btn-primary" data-c="flip">Flip card</button>') + '</div></div>';
        root.querySelectorAll('[data-c]').forEach(function (b) {
          b.addEventListener('click', function () {
            var c = b.getAttribute('data-c');
            if (c === 'flip') { flipped = true; draw(); root.querySelector('[data-c=know]').focus(); }
            else {
              st.cards[g.term] = c === 'know' ? Math.min(4, (st.cards[g.term] || 0) + 1) : 0; C.logActivity(); C.save(); next();
              var nf = document.querySelector('#card-root [data-c=flip]'); if (nf) nf.focus(); // the next card, not the top of the page
            }
          });
        });
      }
      draw();
    }
    sel.addEventListener('change', function () { st.prefs.cardLevel = sel.value; C.save(); next(); });
    next();
  }

  /* ---------- progress ---------- */
  // true once anything at all is recorded (a tick, a card read, a lab task, an exercise, a quiz, a note, a flashcard,
  // a day of activity), so "Nothing here yet" never shows next to real progress that rounds to 0% of the course
  function anyProgress(st) {
    var some = function (o, test) { return Object.keys(o || {}).some(function (k) { return test ? test(o[k], k) : !!o[k]; }); };
    return some(st.log) || some(st.watched) || some(st.quiz) || some(st.cards) || some(st.notes) ||
      some(st.ex, function (e) { return e && e.done; }) || some(st.labs, function (t) { return some(t); }) ||
      some(st.modules, function (m) { return m && m.done; }) || some(st.read, function (v) { return String(v).charAt(0) !== '-'; }) ||
      some(st.projects, function (p) { return p && (p.done || some(p.steps) || some(p.links) || some(p.rubric)); });
  }
  function viewProgress() {
    var st = S();
    // videos and courses ticked: each resource once (a shared playlist can be ticked for several modules)
    var ticked = Object.keys(Object.keys(st.watched).reduce(function (o, k) { var id = k.slice(k.indexOf('|') + 1); if (resById[id]) o[id] = 1; return o; }, {})).length;
    var solved = Object.keys(st.ex).filter(function (k) { return st.ex[k] && st.ex[k].done; }).length;
    var labTasks = Object.keys(st.labs).reduce(function (s, k) { return s + Object.keys(st.labs[k] || {}).filter(function (t) { return st.labs[k][t]; }).length; }, 0);
    // module quizzes and level tests are counted apart (both live in st.quiz)
    var withQuiz = D.modules.filter(function (m) { return D.quizzes[m.id] && D.quizzes[m.id].length; });
    var passed = withQuiz.filter(function (m) { return st.quiz[m.id] && st.quiz[m.id].best >= 70; }).length;
    var testsPassed = D.levels.filter(function (l) { var t = st.quiz['test-l' + l.id]; return t && t.best >= 70; }).length;
    var projDone = Object.keys(st.projects).filter(function (k) { return st.projects[k] && st.projects[k].done; }).length;
    setView('<div class="wrap stack-lg">' + crumbs([['Home', 'home'], ['My progress']]) +
      '<header class="row-between"><div class="stack-sm"><h1>My progress</h1><p class="muted" id="prog-saved">' + esc(savedLine()) + '</p></div>' + ring(overallProgress(), 'Whole course, Level 1 to Level 4', courseText(), 'ring-course') + '</header>' + saveWarn() +
      (!anyProgress(st) ? '<div class="callout row-between"><span>Nothing here yet. Your first step takes about 30 minutes.</span><a class="btn btn-primary" href="#start">Start here</a></div>' : '') +
      '<div class="lab-stats">' + stat('Whole course', courseText()) + stat('Day streak', C.streak()) + stat('Lesson cards read', D.modules.reduce(function (n, m) { return n + readDone(m); }, 0) + '/' + D.modules.reduce(function (n, m) { return n + readCards(m).length; }, 0)) + stat('Exercises solved', solved + '/' + D.exercises.length) + stat('Quizzes passed', passed + '/' + withQuiz.length) + stat('Level tests passed', testsPassed + '/' + D.levels.length) + stat('Lab tasks', labTasks) + stat('Projects done', projDone + '/' + D.projects.length) + stat('Videos & courses ticked', ticked) + '</div>' +
      (continueList(1).length ? '<section class="card stack-sm"><h2 class="h-sub">Continue watching</h2>' + continueHTML(5) + '</section>' : '') +
      (ST() ? '<div id="study-progress"></div>' : '') +
      '<section class="stack"><p class="small muted">Whole course: Level 1 (beginner) to Level 4 (advanced). Each level is a quarter of it. Inside a level, its modules count for 80%, passing its level test (70% or more) for 10% and finishing one of its projects for 10%. So a level reaches 100% only when all three are done.</p>' + D.levels.map(function (l) { return '<div class="stack-sm"><div class="row-between"><a href="#level-' + l.id + '"><strong>Level ' + l.id + ' · ' + esc(l.name) + '</strong></a><span class="num small">' + esc(levelText(l.id)) + '</span></div>' + bar(levelProgress(l.id), 'Level ' + l.id + ' progress', '', levelText(l.id)) + '</div>'; }).join('') + '</section>' +
      '<div class="two-col"><section class="stack"><h2>Quizzes and level tests</h2>' + quizTable() + '</section><aside class="stack">' +
      (cloudOn() ? '<div class="card stack-sm" id="prog-acct">' + acctCard() + '</div>' : '') +
      plannerCard() +
      '<div class="card stack-sm"><strong>Backup</strong><div class="row"><button class="btn btn-sm" data-action="export">Copy progress</button><button class="btn btn-sm" data-action="download">Download file</button></div>' +
      '<p class="small">Restore: choose the file you downloaded, or paste a copied backup into the box and press Restore.</p>' +
      '<div class="row"><button type="button" class="btn btn-sm" data-action="import-pick">Choose backup file</button><input type="file" id="import-file" data-action="import-file" accept=".json,application/json,text/plain" class="visually-hidden" tabindex="-1" aria-hidden="true"></div>' +
      '<label class="small" for="import-box">Backup text</label><textarea id="import-box" rows="3" placeholder="{&quot;v&quot;:1, …}"></textarea><div class="row"><button class="btn btn-sm" data-action="import">Restore</button><button class="btn btn-sm btn-ghost" data-action="reset">Reset all progress</button></div></div>' +
      '</aside></div></div>', 'My progress');
    bindPlanner();
    if (ST()) ST().emit('progress', main);
    // the sign-in status (a remembered session comes back a moment after the page is drawn) and save problems
    // change later: update those lines in place
    var upd = function () {
      var p = document.getElementById('prog-saved'); if (p) p.textContent = savedLine();
      var a = document.getElementById('prog-acct'), h = a && acctCard();
      if (a && a.getAttribute('data-h') !== h) { var fk = focusKey(a); a.innerHTML = h; a.setAttribute('data-h', h); refocus(fk); }
      var w = document.getElementById('save-warn'), wh = saveWarn(), hd = main.querySelector('header');
      if ((w ? w.getAttribute('data-h') : '') === wh) return;
      if (w) w.remove();
      if (wh && hd) { hd.insertAdjacentHTML('afterend', wh); document.getElementById('save-warn').setAttribute('data-h', wh); }
    };
    upd();
    if (cloudOn()) currentCleanup.push(K.on(upd));
    window.addEventListener('aim:save-status', upd);
    currentCleanup.push(function () { window.removeEventListener('aim:save-status', upd); });
  }
  // My progress: where progress is kept (depends on sign-in, and on whether this browser lets the site save at all)
  function savedLine() {
    var cs = cloudOn() ? K.status() : null;
    if (C.saveFailed) return 'Not saved: this browser is refusing to save your progress' + (cs && cs.user ? ', but it is still backed up to your account.' : '. See below.');
    if (!cs) return 'Saved only in this browser on this device. Export it to keep a backup or move devices.';
    if (cs.user) return 'Saved in this browser and backed up to your account.';
    if (cs.restoring) return cs.error ? 'Saved in this browser. Your account is not connected right now, so new progress is not backed up yet.' : 'Saved in this browser. Signing in to your account…';
    return 'Saved in this browser. Sign in to back it up and use it on other devices, or download a copy below.';
  }
  function saveWarn() {
    if (!C.saveFailed) return '';
    var cs = cloudOn() ? K.status() : null;
    return '<div class="callout" id="save-warn"><strong>Your progress is not being saved in this browser.</strong> The browser is refusing to store it (site data blocked, private browsing, or storage full)' +
      (cs && cs.user ? '. It is still backed up to your account while you stay signed in. To be safe, also press <strong>Download file</strong> below.'
        : ', so it will be lost when you close this page. Press <strong>Download file</strong> below to keep a copy' + (cs ? ', or <a href="#account">sign in</a> to back it up to your account.' : '.')) + '</div>';
  }
  function acctCard() {
    var cs = K.status();
    var txt = cs.user ? 'Signed in as ' + esc(cs.user.name || cs.user.email) + '. Progress is backed up and synced.'
      : cs.restoring ? (cs.error ? 'Not connected to your account right now. Your progress is still saved in this browser.' : 'Signing you in to your account…')
      : 'Sign in with Google to back up your progress and continue on any device.';
    return '<strong>Account</strong><span class="small muted">' + txt + '</span><a class="btn btn-sm" href="#account">' + (cs.user ? 'Manage account' : cs.restoring ? 'Open account' : 'Sign in') + '</a>';
  }
  function stat(k, v) { return '<div class="stat"><div class="k">' + esc(k) + '</div><div class="v">' + esc(v) + '</div></div>'; }

  function viewNotFound() {
    setView('<div class="wrap stack"><h1>Page not found</h1><p class="muted">That link does not match anything here. <a href="#home">Go home</a> or open the <a href="#roadmap">roadmap</a>.</p></div>', 'Not found');
  }

  /* ---------- account: optional sign-in to back up and sync progress ---------- */
  var K = window.AIM_CLOUD || null;
  function cloudOn() { return !!(K && K.enabled()); }
  function accountBody(st) {
    if (!st.enabled) return '<div class="callout">Sign-in is not switched on for this copy of the site. Your progress is saved in this browser. To move it to another device, use <a href="#progress">My progress</a> and its Backup box.</div>';
    var privacy = '<section class="stack-sm"><h2 class="h-sub">What is saved, and who can see it</h2><ul class="prose small">' +
      '<li>Only your course progress: ticks (including lesson cards read), quiz scores and answers, lab tasks, your review cards, reflections, journal entries, focus sessions, exercise answers and drafts, notes, project checklists and links, flashcard scores, where you stopped each video, and your study plan and display settings, together with your Google account ID.</li>' +
      '<li>Your name and email come from Google so you can see which account you used. No password is ever seen by this site.</li>' +
      '<li>It is stored with Google Firebase in Mumbai, India. Each account can read and write only its own copy. The site owner can see the stored data and the name and email of each account in the Firebase console, and uses them only to run this site. Nothing is sold, shared or used for ads.</li>' +
      '<li>You can delete your cloud copy below at any time. That removes your progress; to also remove your sign-in record, ask on <a href="https://github.com/digitalmarket-arch/AI-ML/issues" target="_blank" rel="noopener">GitHub</a> and give your account ID (do not post your email). It is shown on this page under More options while you are signed in, and right after you delete your cloud copy.</li>' +
      '<li>Signing in is optional: without it, progress stays in this browser.</li></ul></section>';
    if (!st.user) {
      // restoring: this browser was signed in before and the session is being brought back (or could not be yet);
      // reload: the sign-in library failed to load, and the browser only tries again after a reload
      var wait = st.state === 'loading';
      var btn = st.reload ? '<button class="btn btn-primary" type="button" data-action="cloud-reload">Reload the page</button>'
        : '<button class="btn btn-primary' + (wait ? ' is-disabled" aria-disabled="true"' : '"') + ' type="button" data-action="cloud-signin">' + (wait ? (st.restoring ? 'Signing in…' : 'Connecting…') : st.restoring ? 'Try again' : 'Sign in with Google') + '</button>';
      var gone = st.deletedId ? '<div class="callout small" role="status">Your cloud copy is deleted and you are signed out. Your account ID is <code>' + esc(st.deletedId) + '</code>: give it if you ask for your sign-in record to be removed (see below). Note it now, because it is not shown again after you reload or leave the site.</div>' : '';
      return gone + '<section class="card stack"><div class="stack-sm"><h2 class="h-sub">Keep your progress safe in your account</h2>' +
        '<ul class="prose"><li>Continue on your phone exactly where you stopped on your laptop.</li><li>Nothing is lost if you clear your browser or change devices.</li><li>What you have already done on this device is kept and added to your account.</li></ul></div>' +
        '<div class="row">' + btn + '</div>' +
        (st.error ? '<p class="small pub-bad" role="alert">' + esc(st.error) + '</p>' : '') + '</section>' + privacy;
    }
    var when = st.lastSync ? new Date(st.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    var line = st.state === 'syncing' ? 'Syncing…' : st.state === 'signing-out' ? 'Signing out… Your latest progress is backed up first.' : st.state === 'deleting' ? 'Deleting your cloud copy…'
      : st.error ? esc(st.error) : when ? 'Synced at ' + esc(when) + '. New progress syncs by itself within about half a minute.' : 'Ready.';
    return '<section class="card stack"><div class="stack-sm"><span class="eyebrow">Signed in</span><strong>' + esc(st.user.name || st.user.email) + '</strong>' + (st.user.name && st.user.email ? '<span class="small muted">' + esc(st.user.email) + '</span>' : '') + '</div>' +
      '<p class="small' + (st.error ? ' pub-bad' : ' muted') + '" role="status">' + line + '</p>' +
      '<div class="row"><button class="btn btn-sm" type="button" data-action="cloud-sync">Sync now</button><button class="btn btn-sm" type="button" data-action="cloud-signout">Sign out</button></div>' +
      '<details class="small"><summary>More options</summary><div class="stack-sm" style="margin-top:8px">' +
      '<div><button class="btn btn-sm" type="button" data-action="cloud-signout-clear">Sign out and remove progress from this device</button><p class="muted">Use this on a shared or office computer. Your progress stays safe in your account.</p></div>' +
      '<div><button class="btn btn-sm btn-ghost" type="button" data-action="cloud-delete">' + (cloudDeleteArmed ? 'Press again to delete for good' : 'Delete my cloud copy') + '</button><p class="muted">Removes your progress from the cloud and signs you out. This device keeps its own copy. If you are signed in on another device, sign out there first, or it will back up its copy again.</p></div>' +
      (st.user.uid ? '<p class="muted">Your account ID: <code>' + esc(st.user.uid) + '</code>. Give this when you ask for your sign-in record to be removed.</p>' : '') +
      '</div></details></section>' + privacy;
  }
  var cloudDeleteArmed = false;
  function viewAccount() {
    var st = K ? K.status() : { enabled: false };
    setView('<div class="wrap stack-lg" style="max-width:760px">' + crumbs([['Home', 'home'], ['My progress', 'progress'], ['Account']]) +
      '<header class="stack-sm"><h1>Your account</h1><p class="lede muted prose">Sign in with Google to back up your progress and use the course on more than one device.</p></header>' +
      '<div id="acct-body" class="stack-lg">' + accountBody(st) + '</div></div>', 'Account');
    if (K) {
      // redraw on each status change, keeping keyboard focus and an open "More options"
      var off = K.on(function (x) {
        var el = document.getElementById('acct-body'); if (!el) return;
        var fk = focusKey(el);
        var det = el.querySelector('details'), open = !!(det && det.open);
        el.innerHTML = accountBody(x);
        det = el.querySelector('details'); if (det && open) det.open = true;
        // the pressed button can be gone (signed in, signed out, cloud copy deleted): focus the new card's main button
        refocus(fk, function () { return el.querySelector('[data-action^="cloud-"]'); });
      });
      currentCleanup.push(off);
      if (!st.user) K.prepare();
    }
  }
  function updateAcctLink(st) {
    var a = document.getElementById('acct-link'); if (!a) return;
    if (!st || !st.enabled) { a.hidden = true; return; }
    a.hidden = false;
    if (st.user) {
      var nm = st.user.name || st.user.email || '?';
      var doing = { syncing: ', syncing', 'signing-out': ', signing out', deleting: ', deleting the cloud copy' }[st.state];
      var dot = doing ? 'is-syncing' : st.error ? 'is-error' : 'is-ok';
      a.innerHTML = '<span class="acct-badge ' + dot + '" aria-hidden="true">' + esc(nm.trim().charAt(0).toUpperCase()) + '</span>';
      a.setAttribute('aria-label', 'Account: ' + nm + (doing || (st.error ? ', sync problem' : ', synced')));
    } else {
      // a remembered session being restored is not "signed out": say so instead of offering Sign in
      var lbl = st.restoring ? (st.error ? 'Not synced' : 'Signing in…') : 'Sign in'; // short enough for the header on a phone
      a.innerHTML = '<svg class="acct-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg><span class="acct-text">' + lbl + '</span>';
      if (st.restoring) a.setAttribute('aria-label', 'Account: ' + (st.error ? 'not synced, could not connect' : 'signing in')); else a.removeAttribute('aria-label');
    }
  }
  if (K) { K.on(updateAcctLink); updateAcctLink(K.status()); }
  // after a merge, the ticks, links and note boxes of a page left open show what is saved now
  // (a box with focus, or with typing not saved yet, is left alone)
  function syncInputs() {
    var each = function (sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); }, st = S();
    each('input[data-action="watched"]', function (el) { var r = resById[el.getAttribute('data-id')]; el.checked = r ? isTicked(el.getAttribute('data-mod'), r) : !!st.watched[el.getAttribute('data-id')]; });
    each('input[data-action="pstep"]', function (el) { var p = st.projects[el.getAttribute('data-id')]; el.checked = !!(p && p.steps && p.steps[el.getAttribute('data-i')]); });
    each('input[data-action="plink"]', function (el) { var p = st.projects[el.getAttribute('data-id')], v = (p && p.links && p.links[el.getAttribute('data-k')]) || ''; if (el !== document.activeElement && el.value !== v) el.value = v; });
    each('[data-action="pdone"]', function (el) { var p = st.projects[el.getAttribute('data-id')], d = !!(p && p.done); el.textContent = d ? 'Completed ✓ (undo)' : 'Mark project complete'; el.className = 'btn ' + (d ? '' : 'btn-haldi'); });
    // a note box shows a newer note from another device unless typing in it is not saved yet (then this device's
    // edit is the newer one and replaces it); the cursor stays where it was
    each('textarea[id^="note-"]', function (ta) {
      var v = st.notes[ta.id.slice(5)] || ''; if (ta.dataset.dirty || ta.value === v) return;
      var on = ta === document.activeElement, a = ta.selectionStart, b = ta.selectionEnd;
      ta.value = v; if (on) { try { ta.setSelectionRange(Math.min(a, v.length), Math.min(b, v.length)); } catch (e) {} }
    });
  }
  // progress arrived from another device: redraw overview pages; leave pages with work in progress
  // (a quiz or test, a lab, code, a playing video, notes) as they are, and update only their progress panel
  window.addEventListener('aim:progress-replaced', function (ev) {
    var ae = document.activeElement, h = (location.hash || '').replace(/^#/, '') || 'home', cleared = !!(ev.detail && ev.detail.cleared);
    if (h === 'account') return; // it redraws itself from the sign-in status
    var typing = ae && /^(TEXTAREA|INPUT|SELECT)$/.test(ae.tagName) && ae.type !== 'checkbox' && ae.type !== 'radio';
    if (!cleared && (typing || !/^(home|start|roadmap|level-\d|labs|practice|projects|tests|progress|career|faq)$/.test(h))) { syncInputs(); refreshSide(); refreshChecklist(); refreshPlaces(); var sideEl = document.getElementById('mod-side'); readRefresh(sideEl && modById[sideEl.getAttribute('data-mod')]); if (!(ev.detail && ev.detail.tab)) C.toast('Progress from your other device has been added'); return; }
    // redraw in place: same scroll position, and keyboard focus back on the same link or button (not the page heading)
    var y = window.scrollY, fk = focusKey(main);
    quiet = true;
    try { route(); } finally { quiet = false; }
    window.scrollTo(0, y);
    refocus(fk, function () { return main.querySelector('h1'); });
  });

  /* ---------- global actions (event delegation) ---------- */
  var readLastPress = 0;
  document.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-action]'); if (!t) return;
    var a = t.getAttribute('data-action'), id = t.getAttribute('data-id'), st = S();
    if (a === 'play') { var r = resById[id], card = t.closest('.res-card'); if (r) startPlayer(t.parentNode, r, card && card.getAttribute('data-mod')); }
    else if (a === 'play-inline') { var ri = resById[id], art = t.closest('.res-card'); if (ri && art) toggleInline(art, ri, t); }
    else if (a === 'goto-res') { gotoRes(id, t.getAttribute('data-play') === '1'); }
    else if (a === 'cloud-signin' && K) { if (t.getAttribute('aria-disabled') !== 'true') K.signIn(); }
    else if (a === 'cloud-reload') { location.reload(); }
    else if (a === 'cloud-sync' && K) { K.syncNow().then(function (ok) { if (ok) C.toast('Synced'); }); }
    else if (a === 'cloud-signout' && K) { K.signOut(false); }
    else if (a === 'cloud-signout-clear' && K) { K.signOut(true); }
    else if (a === 'cloud-delete' && K) {
      if (!cloudDeleteArmed) {
        cloudDeleteArmed = true; t.textContent = 'Press again to delete for good';
        setTimeout(function () { cloudDeleteArmed = false; var b = document.querySelector('[data-action="cloud-delete"]'); if (b) b.textContent = 'Delete my cloud copy'; }, 6000);
      }
      else { cloudDeleteArmed = false; K.deleteCloudCopy().catch(function () { C.toast('Could not delete the cloud copy. Check your connection and try again.'); }); }
    }
    else if (a === 'read-card') {
      // a double click must not also press the next card's button, which the scroll brings under the pointer
      if (ev.detail > 1 || Date.now() - readLastPress < 600) return;
      readLastPress = Date.now();
      var rkey = t.getAttribute('data-key'), rmod = modById[id];
      if (rmod && rkey) {
        var ron = !readOn(id, rkey), rstamp = new Date().toISOString();
        st.read[id + '/' + rkey] = ron ? rstamp : '-' + rstamp;
        if (ron) C.logActivity();
        C.save(); refreshSide();
        var rn = readCards(rmod).length, rd2 = readDone(rmod);
        readRefresh(rmod, (ron ? 'Marked as read. ' : 'Marked as not read. ') + rd2 + ' of ' + rn + ' cards read.' + (ron && rd2 === rn ? ' You have read the whole lesson.' : ''));
        if (ST()) ST().emit('card-read', rmod, rkey, ron);
        if (ron) readGoNext(id, rkey);
      }
    }
    else if (a === 'read-next') { readGoNext(id, null); }
    else if (a === 'mod-done') { var cur = st.modules[id] && st.modules[id].done; C.setModuleDone(id, !cur); if (!cur) C.logActivity(); C.save(); C.toast(cur ? 'Module marked as not complete' : 'Module complete. Next one!'); refreshSide(); }
    else if (a === 'pdone') { var p = C.setProject(id, 'done', null, !(st.projects[id] && st.projects[id].done)); if (p.done) C.logActivity(); C.save(); C.toast(p.done ? 'Project complete. Add it to your portfolio!' : 'Project marked as in progress'); t.textContent = p.done ? 'Completed ✓ (undo)' : 'Mark project complete'; t.className = 'btn ' + (p.done ? '' : 'btn-haldi'); }
    else if (a === 'export') { var txt = JSON.stringify(st); try { navigator.clipboard.writeText(txt).then(function () { C.toast('Progress copied'); }, function () { fallbackCopy(txt); }); } catch (e) { fallbackCopy(txt); } }
    else if (a === 'download') { var blob = new Blob([JSON.stringify(st, null, 1)], { type: 'application/json' }), aEl = document.createElement('a'); aEl.href = URL.createObjectURL(blob); aEl.download = 'ai-marg-progress-' + C.today() + '.json'; document.body.appendChild(aEl); aEl.click(); aEl.remove(); }
    else if (a === 'import') { importBackup(document.getElementById('import-box').value, false); }
    else if (a === 'import-pick') { var fi = document.getElementById('import-file'); if (fi) fi.click(); }
    else if (a === 'reset') {
      // two presses on the same button: the first one arms this button only, so a button drawn again (another page and
      // back, a restore, progress arriving from another device) starts unarmed and needs two presses again
      if (t.getAttribute('data-armed') !== '1') {
        // while signed in, the account copy would quietly bring the progress back: say so, and point to a real fresh start
        if (cloudOn() && K.status().user) { C.toast('You are signed in, so your account copy would bring this progress back. To start over everywhere, delete your cloud copy on the Account page first, then reset.'); }
        t.setAttribute('data-armed', '1'); t.textContent = cloudOn() && K.status().user ? 'Click again to reset this device only' : 'Click again to erase everything';
        clearTimeout(t._disarm); t._disarm = setTimeout(function () { t.removeAttribute('data-armed'); t.textContent = 'Reset all progress'; }, 6000);
        return;
      }
      clearTimeout(t._disarm); t.removeAttribute('data-armed');
      C.resetAll(); applyTheme(); C.toast('Progress reset'); route();
    }
    else if (a === 'theme') { cycleTheme(); }
  });
  function fallbackCopy(txt) { var box = document.getElementById('import-box'); if (box) { box.value = txt; box.select(); } C.toast('Select the text in the box and copy it'); }
  // Restore: the text pasted into the box, or the file saved by "Download file" (fromFile)
  function importBackup(text, fromFile) {
    try {
      var obj = JSON.parse(String(text || '').replace(/^﻿/, ''));
      if (!obj || typeof obj !== 'object' || !(Math.floor(Number(obj.v)) >= 1) || !obj.watched || typeof obj.watched !== 'object') throw new Error('not a backup'); /* any format version (1, 2, or newer: its fields are kept); a real backup always has its ticks part */
      C.replaceState(obj); applyTheme(); C.toast('Progress restored'); route();
    } catch (e) { C.toast(fromFile ? 'That file is not an AI Marg backup. Choose the .json file saved by Download file.' : 'That text is not a valid AI Marg backup.'); }
  }
  function importFile(input) {
    var f = input.files && input.files[0]; if (!f) return;
    var done = function (text) { input.value = ''; importBackup(text, true); }; // the same file can be chosen again
    if (f.size > 5e6) { input.value = ''; C.toast('That file is too big to be an AI Marg backup. Choose the .json file saved by Download file.'); return; }
    var rd = new FileReader();
    rd.onload = function () { done(rd.result); };
    rd.onerror = function () { input.value = ''; C.toast('Could not read that file. Try again, or open it and paste its text into the box.'); };
    rd.readAsText(f);
  }
  document.addEventListener('change', function (ev) {
    var t = ev.target, a = t.getAttribute && t.getAttribute('data-action'), id = t.getAttribute && t.getAttribute('data-id'), st = S();
    if (!a) return;
    if (a === 'import-file') importFile(t);
    else if (a === 'watched') { setTick(t.getAttribute('data-mod'), id, t.checked); if (t.checked) C.logActivity(); C.save(); syncWatched(id, t.checked); C.toast(t.checked ? 'Marked as watched' : 'Removed from watched'); }
    else if (a === 'pstep') { C.setProject(id, 'step', t.getAttribute('data-i'), t.checked); if (t.checked) C.logActivity(); C.save(); }
    else if (a === 'prub') { var q = C.setProject(id, 'rubric', t.getAttribute('data-i'), Number(t.value)); C.save(); updateRubric(projById[id], q); }
  });
  document.addEventListener('input', function (ev) {
    var t = ev.target; if (!t.getAttribute || t.getAttribute('data-action') !== 'plink') return;
    C.setProject(t.getAttribute('data-id'), 'link', t.getAttribute('data-k'), t.value); C.save();
  });

  /* ---------- theme ---------- */
  function applyTheme() {
    var th = S().prefs.theme || 'system', root = document.documentElement;
    if (th === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', th);
    var b = document.getElementById('theme-btn');
    if (b) {
      var icons = {
        system: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg>',
        light: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
        dark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>'
      };
      b.setAttribute('aria-label', 'Theme: ' + th + '. Click to change.'); b.title = 'Theme: ' + th; b.innerHTML = icons[th] || icons.system;
    }
    document.dispatchEvent(new Event('themechange'));
  }
  function cycleTheme() { var order = ['system', 'light', 'dark'], th = S().prefs.theme || 'system'; S().prefs.theme = order[(order.indexOf(th) + 1) % 3]; C.save(); applyTheme(); C.toast('Theme: ' + S().prefs.theme); }

  /* ---------- router ---------- */
  var NAV = { roadmap: 'roadmap', labs: 'labs', practice: 'practice', projects: 'projects', tests: 'tests', library: 'library', glossary: 'glossary', career: 'career', progress: 'progress' };
  function route() {
    // leave the old page first (a playing video saves its last place, or ticks itself), so the new page shows that
    leaveView();
    migrateRead();
    var raw = (location.hash || '').replace(/^#/, ''), h;
    try { h = decodeURIComponent(raw); } catch (e) { h = raw; }
    h = h || 'home';
    if (h === 'main') h = 'home'; // "Skip to content" followed before the page had loaded (see index.html)
    var navKey = h;
    var m;
    try {
    if (h === 'home') viewHome();
    else if (h === 'start') viewStart();
    else if (h === 'roadmap') viewRoadmap();
    else if ((m = /^level-(\d)$/.exec(h))) { viewLevel(Number(m[1])); navKey = 'roadmap'; }
    else if ((m = /^m-(.+?)(?:~(\w+))?$/.exec(h))) { if (m[2]) moduleTab[m[1]] = m[2]; viewModule(m[1], m[2]); navKey = 'roadmap'; }
    else if (h === 'labs') viewLabs();
    else if ((m = /^lab-(.+)$/.exec(h))) { viewLab(m[1]); navKey = 'labs'; }
    else if (h === 'practice') viewPractice();
    else if (h === 'playground') { viewPlayground(); navKey = 'practice'; }
    else if ((m = /^ex-(.+)$/.exec(h))) { viewExercise(m[1]); navKey = 'practice'; }
    else if (h === 'projects') viewProjects();
    else if (/^p-/.test(h)) { viewProject(h); navKey = 'projects'; }
    else if (h === 'tests') viewTests();
    else if ((m = /^test-l(\d)$/.exec(h))) { viewTest(Number(m[1])); navKey = 'tests'; }
    else if (h === 'library') viewLibrary();
    else if (h === 'glossary') viewGlossary();
    else if (h === 'cards') { viewCards(); navKey = 'glossary'; }
    else if (h === 'search') viewSearch();
    else if (h === 'career' || h === 'faq') { viewCareer(); navKey = 'career'; if (h === 'faq' && !quiet) jumpTo(document.getElementById('faq-list'), true); }
    else if (h === 'progress') viewProgress();
    else if (h === 'account') { viewAccount(); navKey = 'progress'; }
    else if (ST() && (m = ST().route(h))) navKey = m;
    else viewNotFound();
    } catch (err) { if (window.console) console.error(err); viewNotFound(); }
    if (!quiet) { var pr = pendingRes; pendingRes = null; if (pr && location.hash === pr.hash) gotoRes(pr.id, pr.play); } // a video chosen in Search, or Continue watching
    document.querySelectorAll('.nav a').forEach(function (a) { if (a.getAttribute('href') === '#' + navKey) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    if (quiet) return; // a background redraw leaves an open menu open
    var nav = document.querySelector('.nav'); if (nav) nav.classList.remove('open');
    var mb = document.querySelector('.menu-btn'); if (mb) { mb.setAttribute('aria-expanded', 'false'); mb.textContent = 'Menu'; }
  }
  /* ---------- Back and Forward return to where the learner was ---------- */
  // Every history entry gets a key in history.state, and the page's scroll position is remembered under it while the
  // learner scrolls. A link makes a new entry (no key yet), which starts at the top; Back and Forward land on an entry
  // that has a key, and the page scrolls back to its place once it is drawn.
  var scrollAt = {}, curKey = null, keyN = 0;
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  function entryKey() {
    var hs = history.state && typeof history.state === 'object' ? history.state : null;
    if (hs && hs.aimKey) return { k: hs.aimKey, fresh: false };
    var k = Date.now().toString(36) + '.' + (keyN++);
    try { history.replaceState(Object.assign({}, hs, { aimKey: k }), '', location.href); } catch (e) {}
    return { k: k, fresh: true };
  }
  function restoreScroll(y) {
    var go = function () { try { window.scrollTo({ top: y, left: 0, behavior: 'instant' }); } catch (e) { window.scrollTo(0, y); } };
    go();
    // parts drawn a moment later (diagrams, a lab) can make the page tall enough only then
    var at = window.scrollY;
    if (Math.abs(at - y) > 2) setTimeout(function () { if (window.scrollY === at) go(); }, 200);
  }
  window.addEventListener('scroll', function () { if (curKey) scrollAt[curKey] = window.scrollY; }, { passive: true });
  window.addEventListener('hashchange', function () {
    var e = entryKey(), y = e.fresh ? 0 : scrollAt[e.k] || 0;
    curKey = e.k;
    route();
    if (y > 0) restoreScroll(y);
  });
  document.addEventListener('keydown', function (ev) {
    var tag = (ev.target && ev.target.tagName) || '';
    if (ev.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(tag) && !ev.ctrlKey && !ev.metaKey) { ev.preventDefault(); location.hash = 'search'; }
  });
  var menuBtn = document.querySelector('.menu-btn');
  function closeNav() { var n = document.querySelector('.nav'); if (n && n.classList.contains('open')) { n.classList.remove('open'); if (menuBtn) { menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.textContent = 'Menu'; } } }
  if (menuBtn) menuBtn.addEventListener('click', function () { var nav = document.querySelector('.nav'); var open = nav.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', String(open)); menuBtn.textContent = open ? 'Close' : 'Menu'; });
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') return;
    var n = document.querySelector('.nav.open'); if (!n) return;
    // keyboard focus on a menu link that is about to be hidden goes back to the Menu button
    var ae = document.activeElement, back = n.contains(ae) || !ae || ae === document.body;
    closeNav();
    if (back && menuBtn) menuBtn.focus();
  });
  document.addEventListener('click', function (ev) {
    if (!ev.target.closest) return;
    if (!document.querySelector('.nav.open')) return;
    if (ev.target.closest('.site-head a')) { closeNav(); return; } // any header link, even to the page already open
    if (!ev.target.closest('.site-head')) { ev.preventDefault(); ev.stopPropagation(); closeNav(); }
  }, true);
  // set before the first route(), so a study page opened directly (bookmark, reload) can draw itself
  window.AIM_APP = {
    route: route, moduleProgress: moduleProgress, watchList: watchList,
    // building blocks for the study features (assets/js/study*.js)
    setView: setView, crumbs: crumbs, ring: ring, bar: bar, main: main,
    onLeave: function (fn) { currentCleanup.push(fn); },
    S: S, modById: modById, resById: resById, levelById: levelById, modulesOf: modulesOf, modNo: modNo, levelName: levelName,
    labOf: labOf, exOf: exOf, mainPicks: mainPicks, readCards: readCards, readOn: readOn, readDone: readDone,
    moduleParts: moduleParts, levelProgress: levelProgress, overallProgress: overallProgress, refreshSide: refreshSide,
    isTicked: isTicked, tickKey: tickKey, isShared: isShared, isRecommended: isRecommended
  };  applyTheme();
  curKey = entryKey().k;
  route();

})();
