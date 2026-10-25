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
  var S = function () { return C.state; };
  var main = document.getElementById('main');
  var currentCleanup = [];

  /* ---------- indexes ---------- */
  var modById = {}, resById = {}, exById = {}, projById = {}, levelById = {};
  D.levels.forEach(function (l) { levelById[l.id] = l; });
  D.modules.forEach(function (m, i) { modById[m.id] = m; m._i = i; });
  D.resources.forEach(function (r) {
    resById[r.id] = r;
    if (!r.videoId && !r.listId) { var ids = C.ytIds(r.url); r.videoId = r.videoId || ids.videoId; r.listId = r.listId || ids.listId; }
    if (!r.videoId && r.firstVideoUrl) r.videoId = C.ytIds(r.firstVideoUrl).videoId;
  });
  D.exercises.forEach(function (e) { exById[e.id] = e; });
  D.projects.forEach(function (p) { projById[p.id] = p; });
  function modulesOf(lv) { return D.modules.filter(function (m) { return m.level === lv; }); }
  function exOf(mid) { return D.exercises.filter(function (e) { return e.moduleId === mid; }); }
  function labOf(m) { return m.lab && LABS[m.lab] ? LABS[m.lab] : null; }
  function modNo(m) { var list = modulesOf(m.level); return m.level + '.' + (list.indexOf(m) + 1); }
  function levelName(lv) { var l = levelById[lv]; return l ? l.name : 'Level ' + lv; }

  /* ---------- progress maths ---------- */
  function moduleParts(m) {
    var st = S(), parts = [];
    // the watch step counts as done when ANY of the main picks (in any language) is marked finished
    var mp = mainPicks(m), mainIds = [mp.main, mp.second].filter(Boolean).map(function (r) { return r.id; });
    if (mainIds.length) { var w = mainIds.some(function (rid) { return !!st.watched[rid]; }); parts.push({ k: 'Watch the main lessons', done: w, n: w ? 1 : 0, of: 1 }); }
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
    var sum = 0; parts.forEach(function (p) { sum += p.of ? Math.min(1, p.n / p.of) : 0; });
    return Math.round(sum / parts.length * 100);
  }
  // a level = its modules (80%) + passing the level test (10%) + finishing one project (10%)
  function levelProgress(lv) {
    var ms = modulesOf(lv); if (!ms.length) return 0;
    var s = 0; ms.forEach(function (m) { s += moduleProgress(m); });
    var t = S().quiz['test-l' + lv], testDone = t && t.best >= 70 ? 1 : 0;
    var projDone = D.projects.some(function (p) { return p.level === lv && S().projects[p.id] && S().projects[p.id].done; }) ? 1 : 0;
    return Math.round((s / ms.length) * 0.8 + testDone * 10 + projDone * 10);
  }
  function overallProgress() { var s = 0; D.levels.forEach(function (l) { s += levelProgress(l.id); }); return D.levels.length ? Math.round(s / D.levels.length) : 0; }

  /* ---------- resources for a module ---------- */
  var VIDEO_TYPES = { playlist: 1, video: 1, course: 1, channel: 1 };
  var STATUS_RANK = { verified: 0, partial: 1, unverified: 2 };
  function watchList(m) {
    var pref = S().prefs.lang;
    var curated = (m.watch || []).map(function (w) { return w.id; });
    var list = D.resources.filter(function (r) { return (r.modules || []).indexOf(m.id) >= 0; });
    return list.sort(function (a, b) {
      var ca = curated.indexOf(a.id), cb = curated.indexOf(b.id);
      var la = C.langRank(a.language, pref), lb = C.langRank(b.language, pref);
      if (la !== lb) return la - lb;
      if (ca !== cb) return (ca < 0 ? 999 : ca) - (cb < 0 ? 999 : cb);
      var va = VIDEO_TYPES[a.type] ? 0 : 1, vb = VIDEO_TYPES[b.type] ? 0 : 1;
      if (va !== vb) return va - vb;
      return (STATUS_RANK[a.status] || 0) - (STATUS_RANK[b.status] || 0);
    });
  }
  var isHiLang = function (r) { return r.language === 'hindi' || r.language === 'hinglish'; };
  function langGroup(r) { return isHiLang(r) ? 'hi' : r.language === 'indian-english' ? 'in' : 'en'; }
  function mainPicks(m) {
    var list = watchList(m);
    var vids = list.filter(function (r) { return VIDEO_TYPES[r.type]; });
    var isVideo = function (r) { return r.type === 'playlist' || r.type === 'video'; };
    var order = S().prefs.lang === 'en' ? ['in', 'hi', 'en'] : ['hi', 'in', 'en'];
    var pickFrom = function (pred, exclude) {
      for (var gi = 0; gi < order.length; gi++) {
        var hit = vids.filter(function (r) { return langGroup(r) === order[gi] && pred(r) && r !== exclude && (!exclude || langGroup(r) !== langGroup(exclude)); })[0];
        if (hit) return hit;
      }
      return null;
    };
    var main = pickFrom(isVideo) || vids[0] || null;
    var second = main ? (pickFrom(function (r) { return isVideo(r) && langGroup(r) !== 'en'; }, main) ||
      pickFrom(function (r) { return langGroup(r) !== 'en'; }, main) || pickFrom(isVideo, main)) : null;
    return { list: list, main: main, second: second };
  }
  function noteFor(m, r) { var w = (m.watch || []).filter(function (x) { return x.id === r.id; })[0]; return w ? w.note : ''; }

  function resCard(r, opts) {
    opts = opts || {};
    var st = S(), watched = !!st.watched[r.id];
    var player = opts.player && C.canEmbed(r) ? C.playerHTML(r) : '';
    var note = opts.note ? '<div class="callout small">' + inline(opts.note) + '</div>' : '';
    var status = r.status === 'unverified' ? '<span class="chip chip-bad" title="We could not confirm this exact link. Use the search link if it fails.">link unconfirmed</span>' : '';
    var searchUrl = 'https://www.youtube.com/results?search_query=' + encodeURIComponent((r.title || '') + ' ' + (r.creator || ''));
    var isYT = /youtube\.com|youtu\.be/.test(r.url || '');
    return '<article class="res-card' + (opts.featured ? ' featured' : '') + '">' + player +
      '<div class="res-meta">' + C.langChip(r.language) + '<span class="chip chip-level">' + esc(r.type) + '</span>' +
      (r.approxHours ? '<span class="chip num">~' + esc(r.approxHours) + ' h</span>' : '') +
      '<span class="chip">' + esc(r.platform || '') + '</span>' + status + '</div>' +
      '<h4><a href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(r.title) + '</a></h4>' +
      '<div class="small muted">' + esc(r.creator || '') + (r.year ? ' · ' + esc(r.year) : '') + (r.cost ? ' · ' + esc(r.cost) : '') + '</div>' +
      note + (r.why ? '<p class="res-why">' + inline(r.why) + '</p>' : '') +
      (r.caveats ? '<details class="res-caveat"><summary>Heads-up</summary><p>' + inline(r.caveats) + '</p></details>' : '') +
      '<div class="res-actions"><label class="watched-toggle"><input type="checkbox" data-action="watched" data-id="' + esc(r.id) + '"' + (watched ? ' checked' : '') + '> I finished this</label>' +
      '<a class="btn btn-sm" href="' + esc(r.url) + '" target="_blank" rel="noopener">Open ' + (isYT ? 'on YouTube' : 'site') + ' ↗</a>' +
      (isYT && r.status !== 'verified' ? '<a class="btn btn-sm btn-ghost" href="' + esc(searchUrl) + '" target="_blank" rel="noopener">Search YouTube</a>' : '') +
      '</div></article>';
  }

  /* ---------- shell ---------- */
  var pendingFlush = [];
  function flushPending() { pendingFlush.slice().forEach(function (f) { try { f(); } catch (e) {} }); }
  window.addEventListener('pagehide', flushPending);
  function setView(html, title) {
    flushPending(); pendingFlush = [];
    currentCleanup.forEach(function (f) { try { f(); } catch (e) {} });
    currentCleanup = [];
    main.innerHTML = html;
    document.title = (title ? title + ' · ' : '') + (D.site.name || 'AI Marg');
    var h1 = main.querySelector('h1');
    if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
    try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); } catch (e) { window.scrollTo(0, 0); }
  }
  function crumbs(items) {
    return '<nav class="crumbs" aria-label="Breadcrumb">' + items.map(function (it, i) {
      return (i ? '<span aria-hidden="true">›</span>' : '') + (it[1] ? '<a href="#' + it[1] + '">' + esc(it[0]) + '</a>' : '<span>' + esc(it[0]) + '</span>');
    }).join('') + '</nav>';
  }
  function ring(p) { return '<div class="ring" style="--p:' + p + '" data-label="' + p + '%" role="img" aria-label="' + p + '% complete"></div>'; }
  function bar(p) { return '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + p + '"><span style="width:' + p + '%"></span></div>'; }
  function langSeg() {
    var l = S().prefs.lang;
    return '<div class="seg" role="group" aria-label="Video language preference">' +
      '<button type="button" data-action="lang" data-lang="hi" aria-pressed="' + (l === 'hi') + '">हिंदी / Hinglish first</button>' +
      '<button type="button" data-action="lang" data-lang="en" aria-pressed="' + (l === 'en') + '">Indian English first</button></div>';
  }
  function stations() {
    return '<div class="path">' + D.levels.map(function (l) {
      var p = levelProgress(l.id), ms = modulesOf(l.id);
      var hours = ms.reduce(function (s, m) { return s + (m.hours || 0); }, 0);
      return '<a class="station' + (p >= 100 ? ' done' : p > 0 ? ' started' : '') + '" href="#level-' + l.id + '">' +
        '<span class="fill" style="height:calc((100% - 44px) * ' + (p / 100) + ')"></span>' +
        '<span class="station-dot" aria-hidden="true">' + esc(l.glyph || firstGrapheme(l.sanskrit || '')) + '</span>' +
        '<span class="stack-sm"><span class="station-name"><span class="sa">' + esc(l.sanskrit) + '</span><b>' + esc(l.name) + '</b><span class="muted small">' + esc(l.meaning) + '</span></span>' +
        '<span><strong>Level ' + l.id + ': ' + esc(l.title) + '</strong></span>' +
        '<span class="small muted num">' + ms.length + ' modules' + (hours ? ' · ~' + hours + ' hours' : '') + ' · ' + esc(l.weeks || '') + ' weeks at 10 h/week (modules only)</span>' +
        bar(p) + '</span></a>';
    }).join('') + '</div>';
  }

  function firstGrapheme(str) {
    try { if (window.Intl && Intl.Segmenter) { var it = new Intl.Segmenter('hi', { granularity: 'grapheme' }).segment(str)[Symbol.iterator](); var f = it.next(); return f.done ? '' : f.value.segment; } } catch (e) {}
    return str.charAt(0);
  }

  /* ---------- views ---------- */
  function viewHome() {
    var st = S(), last = st.last && modById[st.last] ? modById[st.last] : null;
    var nRes = D.resources.length, nHi = D.resources.filter(function (r) { return r.language === 'hindi' || r.language === 'hinglish'; }).length;
    var nIn = D.resources.filter(function (r) { return r.language === 'indian-english'; }).length;
    var nQ = Object.keys(D.quizzes).reduce(function (s, k) { return s + D.quizzes[k].length; }, 0);
    var html = '<div class="wrap stack-lg">' +
      '<section class="hero"><div class="stack">' +
      '<span class="eyebrow">Free AI & ML course · हिंदी, Hinglish & Indian English</span>' +
      '<h1>From your first line of Python to building <em>AI agents</em>.</h1>' +
      '<p class="lede">A guided path through the best free videos from Indian teachers first, in Hindi, Hinglish and Indian English, with interactive labs, Python you can run in the browser, tests and tough projects. No fees, no sign-up.</p>' +
      '<div class="row"><a class="btn btn-primary" href="#start">Start here</a>' +
      (last ? '<a class="btn" href="#m-' + esc(last.id) + '">Continue: ' + esc(last.title) + '</a>' : '<a class="btn" href="#level-1">Open Level 1</a>') + '</div>' +
      '<div class="stack-sm"><span class="small muted">Show videos in</span>' + langSeg() + '</div>' +
      '</div>' + stations() + '</section>' +
      '<section class="stack"><div class="section-title"><h2>What you get</h2></div><div class="grid">' +
      featureCard('Indian teachers first', nRes + ' free playlists, courses and books. ' + nHi + ' are in Hindi or Hinglish and ' + nIn + ' in Indian English. Global English classics appear as extras.', '#library', 'Browse the library') +
      featureCard('Interactive labs', Object.keys(LABS).length + ' visual labs: drag points, move sliders and watch gradient descent, overfitting, K-Means and neural networks react.', '#labs', 'Open the labs') +
      featureCard('Python in your browser', D.exercises.length + ' auto-graded coding exercises. Write code, press Check, get instant feedback. Nothing to install.', '#practice', 'Start practising') +
      featureCard('Tests and tough projects', nQ + ' quiz questions, four level tests and ' + D.projects.length + ' portfolio projects built on Indian data and problems.', '#projects', 'See the projects') +
      '</div></section>' +
      '<section class="stack"><div class="section-title"><h2>How each module works</h2></div><ol class="stack-sm prose">' +
      '<li><strong>Read the overview.</strong> Plain-English explanation, key terms and a study plan.</li>' +
      '<li><strong>Watch.</strong> The main pick from an Indian teacher in your language, plus alternatives if a teacher does not click for you.</li>' +
      '<li><strong>Play with the lab.</strong> Where a concept is visual, a lab lets you feel it before you code it.</li>' +
      '<li><strong>Practise.</strong> Solve small Python exercises right on the page.</li>' +
      '<li><strong>Test yourself.</strong> Score 70% or more on the quiz, then move on. A level is complete when its modules are done, you pass the level test and you finish one project.</li></ol></section>' +
      (st.last || Object.keys(st.watched).length ? '<section class="card row-between"><div class="stack-sm"><strong>Your progress</strong><span class="small muted num">' + overallProgress() + '% of the course · ' + C.streak() + '-day streak</span></div><a class="btn" href="#progress">Open my progress</a></section>' : '') +
      '</div>';
    setView(html, 'Home');
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
    ev.preventDefault(); var t = document.getElementById(a.getAttribute('data-jump')); if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'start' }); var h = t.querySelector('h3'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }
  });
  function sectionsHTML(sections) {
    return (sections || []).map(function (s, i) {
      return '<section class="stack-sm" id="sec-' + i + '"><h3>' + esc(s.heading) + '</h3>' + (s.paragraphs || []).map(function (p) { return '<p>' + inline(p) + '</p>'; }).join('') +
        (s.bullets && s.bullets.length ? '<ul>' + s.bullets.map(function (b) { return '<li>' + inline(b) + '</li>'; }).join('') + '</ul>' : '') + '</section>';
    }).join('');
  }
  function viewStart() {
    var pg = D.pages.start || { title: 'Start here', sections: [] };
    setView('<div class="wrap stack-lg">' + crumbs([['Home', 'home'], ['Start here']]) +
      '<header class="stack-sm"><h1>' + esc(pg.title || 'Start here') + '</h1><p class="lede muted prose">Everything you need before Level 1: how the site works, free tools, time, cost and how to study well.</p></header>' +
      '<div class="two-col"><div class="prose stack">' + tocHTML(pg.sections) + sectionsHTML(pg.sections) + '</div>' +
      '<aside class="stack">' + plannerCard() + '<div class="card stack-sm"><strong>Ready?</strong><p class="small muted">Begin with the no-coding introduction, then Python.</p><a class="btn btn-primary" href="#m-' + esc((modulesOf(1)[0] || {}).id || '') + '">Open module 1.1</a></div></aside></div></div>', 'Start here');
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
    function calc() {
      var h = Number(hpw.value) || 10; document.getElementById('hpw-out').textContent = h + ' h';
      S().prefs.hpw = h; S().prefs.start = ps.value; C.save();
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
      '<header class="stack-sm"><h1>The roadmap</h1><p class="lede muted prose">Four levels, ' + D.modules.length + ' modules. Go in order the first time; later, jump to whatever you need.</p>' + langSeg() + '</header>' +
      D.levels.map(function (l) { return '<section class="stack">' + levelHeader(l, 'h2') + moduleList(l.id) + '</section>'; }).join('') + '</div>', 'Roadmap');
  }
  function levelHeader(l, tag) {
    return '<div class="level-head"><div class="level-glyph" aria-hidden="true">' + esc(l.sanskrit) + '</div><div class="stack-sm">' +
      '<span class="eyebrow">Level ' + l.id + ' · ' + esc(l.name) + ' (' + esc(l.meaning) + ')</span><' + tag + '><a href="#level-' + l.id + '" style="color:inherit;text-decoration:none">' + esc(l.title) + '</a></' + tag + '>' +
      '<div class="row">' + bar(levelProgress(l.id)).replace('class="bar"', 'class="bar" style="width:160px"') + '<span class="small muted num">' + levelProgress(l.id) + '%</span></div></div></div>';
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
      levelHeader(l, 'h1') +
      '<div class="two-col"><div class="stack-lg"><div class="prose stack-sm">' + (l.intro ? '<p>' + inline(l.intro) + '</p>' : '') +
      (l.howToStudy ? '<div class="callout">' + inline(l.howToStudy) + '</div>' : '') + '</div>' +
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
    var tabs = [['overview', 'Overview'], ['watch', 'Watch & read']];
    if (lab) tabs.push(['lab', 'Lab']);
    if (ex.length) tabs.push(['practice', 'Practice (' + ex.length + ')']);
    if (qz.length) tabs.push(['quiz', 'Quiz']);
    tabs.push(['notes', 'My notes']);
    var tab = tabArg || moduleTab[id] || 'overview';
    if (!tabs.some(function (t) { return t[0] === tab; })) tab = 'overview';
    var list = modulesOf(m.level), idx = list.indexOf(m), all = D.modules, gi = all.indexOf(m);
    var prev = all[gi - 1], next = all[gi + 1];
    var html = '<div class="wrap stack">' + crumbs([['Home', 'home'], ['Level ' + m.level + ' ' + (l ? l.name : ''), 'level-' + m.level], ['Module ' + modNo(m)]]) +
      '<header class="row-between"><div class="stack-sm"><span class="eyebrow">Module ' + modNo(m) + (m.hours ? ' · about ' + m.hours + ' hours' : '') + '</span><h1>' + esc(m.title) + '</h1></div>' + ring(moduleProgress(m)) + '</header>' +
      '<div class="tabs" role="tablist" aria-label="Module sections">' + tabs.map(function (t) { return '<button role="tab" type="button" id="tab-' + t[0] + '" aria-controls="tabpanel" data-tab="' + t[0] + '" aria-selected="' + (t[0] === tab) + '" tabindex="' + (t[0] === tab ? '0' : '-1') + '">' + esc(t[1]) + '</button>'; }).join('') + '</div>' +
      '<div class="two-col"><div class="tab-panel" id="tabpanel" role="tabpanel" aria-labelledby="tab-' + tab + '"></div><aside class="stack"><div class="stack" id="mod-side" data-mod="' + esc(m.id) + '">' + moduleSide(m) + '</div>' +
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
      moduleTab[id] = t;
      try { history.replaceState(null, '', '#m-' + id + '~' + t); } catch (e) {}
      currentCleanup.forEach(function (f) { try { f(); } catch (e) {} }); currentCleanup = [];
      tabBtns.forEach(function (b) { var on = b.getAttribute('data-tab') === t; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
      var panel = document.getElementById('tabpanel'); panel.setAttribute('aria-labelledby', 'tab-' + t);
      renderModuleTab(m, t, panel);
    }
    renderModuleTab(m, tab, document.getElementById('tabpanel'));
  }
  function refreshSide() {
    var el = document.getElementById('mod-side'); if (!el) return;
    var m = modById[el.getAttribute('data-mod')]; if (!m) return;
    el.innerHTML = moduleSide(m);
    var r = main.querySelector('header .ring'); if (r) { var p = moduleProgress(m); r.style.setProperty('--p', p); r.setAttribute('data-label', p + '%'); r.setAttribute('aria-label', p + '% complete'); }
  }
  function moduleSide(m) {
    var parts = moduleParts(m), done = S().modules[m.id] && S().modules[m.id].done;
    return '<div class="card stack-sm"><strong>Your progress here</strong><ul class="checklist small">' + parts.map(function (p) {
      return '<li>' + (p.done ? '✓ ' : '○ ') + esc(p.k) + ' <span class="muted num">' + esc(p.pctLike ? p.n + '%' : p.n + '/' + p.of) + '</span></li>';
    }).join('') + '</ul><button class="btn ' + (done ? '' : 'btn-haldi') + '" data-action="mod-done" data-id="' + esc(m.id) + '">' + (done ? 'Marked complete ✓ (undo)' : 'Mark module complete') + '</button></div>' +
      (m.tip ? '<div class="callout small"><strong>Tip:</strong> ' + inline(m.tip) + '</div>' : '');
  }
  function renderModuleTab(m, tab, el) {
    if (tab === 'overview') {
      el.innerHTML = '<div class="stack-lg"><div class="prose stack">' + (m.overview ? '<p>' + inline(m.overview) + '</p>' : '<p>' + esc((m.topics || []).join(', ')) + '</p>') +
        (m.whyItMatters ? '<div class="callout callout-indigo"><strong>Why it matters:</strong> ' + inline(m.whyItMatters) + '</div>' : '') + '</div>' +
        listBlock('You will be able to', m.outcomes) +
        listBlock('Study plan', m.studySteps, true) +
        (m.keyTerms && m.keyTerms.length ? '<section class="stack-sm"><h3>Key terms</h3><dl>' + m.keyTerms.map(function (k) { return '<div class="gloss-term"><dt>' + esc(k.term) + '</dt><dd>' + inline(k.meaning) + '</dd></div>'; }).join('') + '</dl></section>' : '') +
        (m.indiaExample ? '<section class="stack-sm"><h3>In India</h3><p class="prose">' + inline(m.indiaExample) + '</p></section>' : '') +
        listBlock('Common mistakes', m.commonMistakes) +
        listBlock('Check yourself (open tasks)', m.selfCheck) +
        listBlock('Topics covered', m.topics) +
        (m.prerequisites && m.prerequisites.length ? '<p class="small muted">Before this: ' + m.prerequisites.map(function (p) { return modById[p] ? '<a href="#m-' + esc(p) + '">' + esc(modById[p].title) + '</a>' : esc(p); }).join(', ') + '</p>' : '') +
        '</div>';
    } else if (tab === 'watch') {
      var mp = mainPicks(m), list = mp.list, mainPick = mp.main, otherLangPick = mp.second, group = langGroup;
      var GROUP_LABEL = { hi: 'Hindi / Hinglish', in: 'Indian English', en: 'English' };
      var rest = list.filter(function (r) { return r !== mainPick && r !== otherLangPick; });
      el.innerHTML = '<div class="stack-lg"><div class="row-between"><div class="small muted">' + list.length + ' resources for this module</div>' + langSeg() + '</div>' +
        (location.protocol === 'file:' ? '<div class="callout small">Opened as a file: YouTube may refuse to play embedded videos here. Use "Open on YouTube", or publish the site on GitHub Pages (see README).</div>' : '') +
        (mainPick ? '<section class="stack"><h3>Main pick · ' + GROUP_LABEL[group(mainPick)] + '</h3>' + resCard(mainPick, { player: true, featured: true, note: noteFor(m, mainPick) }) + '</section>' : '<div class="empty">Resources for this module are being added.</div>') +
        (otherLangPick ? '<section class="stack"><h3>Main pick in ' + GROUP_LABEL[group(otherLangPick)] + '</h3>' + resCard(otherLangPick, { player: true, note: noteFor(m, otherLangPick) }) + '</section>' : '') +
        (rest.length ? '<section class="stack"><h3>More options</h3>' + ['hi', 'in', 'en'].map(function (g) {
          var items = rest.filter(function (r) { return group(r) === g; });
          if (!items.length) return '';
          var gid = 'more-' + g, shown = 4;
          return '<div class="lang-group"><h4>' + esc(g === 'en' ? 'Global English (extras)' : GROUP_LABEL[g]) + ' <span class="chip num">' + items.length + '</span></h4><div class="grid" id="' + gid + '">' +
            items.map(function (r, i) { return '<div' + (i >= shown ? ' hidden' : '') + '>' + resCard(r, { note: noteFor(m, r) }) + '</div>'; }).join('') + '</div>' +
            (items.length > shown ? '<div><button class="btn btn-sm" type="button" data-more="' + gid + '">Show ' + (items.length - shown) + ' more</button></div>' : '') + '</div>';
        }).join('') + '</section>' : '') + '</div>';
      el.querySelectorAll('[data-more]').forEach(function (b) {
        b.addEventListener('click', function () { document.querySelectorAll('#' + b.getAttribute('data-more') + ' > [hidden]').forEach(function (x) { x.hidden = false; }); b.remove(); });
      });
    } else if (tab === 'lab') {
      var lab = labOf(m);
      el.innerHTML = '<div class="stack"><div class="stack-sm"><h2>' + esc(lab.title) + '</h2><p class="muted">' + esc(lab.summary || '') + '</p></div><div id="labroot"></div></div>';
      mountLab(lab, document.getElementById('labroot'));
    } else if (tab === 'practice') {
      var exs = exOf(m.id);
      el.innerHTML = '<div class="stack-lg"><div class="callout small">Write Python in the box and press <strong>Check</strong>. The first run downloads Python (about 12 MB, more if the exercise uses NumPy or pandas). After that your browser usually keeps it. Your code is saved on this device.</div>' +
        exs.map(function (e, i) { return '<section class="stack" id="exwrap-' + esc(e.id) + '"></section>' + (i < exs.length - 1 ? '<hr>' : ''); }).join('') + '</div>';
      exs.forEach(function (e) { mountExercise(e, document.getElementById('exwrap-' + e.id)); });
    } else if (tab === 'quiz') {
      var qz = D.quizzes[m.id], qs = S().quiz[m.id];
      el.innerHTML = '<div class="stack"><div class="row-between"><div class="stack-sm"><h2>Quiz</h2><span class="small muted">' + qz.length + ' questions · answers explained as you go · pass mark 70%</span></div>' +
        '<span id="quiz-best" class="chip num' + (qs && qs.best >= 70 ? ' chip-ok' : '') + '"' + (qs ? '' : ' hidden') + '>' + (qs ? 'Best: ' + esc(qs.best) + '% · ' + esc(qs.attempts) + ' attempt' + (qs.attempts > 1 ? 's' : '') : '') + '</span></div><div id="quizroot"></div></div>';
      var quiz = new C.Quiz(document.getElementById('quizroot'), { questions: qz, mode: 'learn', onFinish: function (r) { recordQuiz(m.id, r.score); } });
      currentCleanup.push(function () { quiz.destroy(); });
    } else if (tab === 'notes') {
      var note = S().notes[m.id] || '';
      el.innerHTML = '<div class="stack"><h2>My notes</h2><p class="small muted">Write what you learned in your own words (Hindi, English or Hinglish). Notes stay on this device. Copy them into your GitHub learning log every week.</p>' +
        '<label for="note-' + esc(m.id) + '" class="visually-hidden">Notes for ' + esc(m.title) + '</label><textarea id="note-' + esc(m.id) + '" rows="12" placeholder="Example: Gradient descent = walking downhill in small steps. Learning rate = step size. Too big → overshoot.">' + esc(note) + '</textarea><span class="small muted" id="note-status"></span></div>';
      var ta = el.querySelector('textarea'), t = null;
      var flushNote = function () { if (!t) return; clearTimeout(t); t = null; S().notes[m.id] = ta.value; C.save(); var st = document.getElementById('note-status'); if (st) st.textContent = 'Saved'; };
      ta.addEventListener('input', function () { clearTimeout(t); t = setTimeout(flushNote, 400); });
      pendingFlush.push(flushNote); currentCleanup.push(flushNote);
    }
  }
  function listBlock(title, arr, ordered) {
    if (!arr || !arr.length) return '';
    var tag = ordered ? 'ol' : 'ul';
    return '<section class="stack-sm"><h3>' + esc(title) + '</h3><' + tag + ' class="prose">' + arr.map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</' + tag + '></section>';
  }
  function recordQuiz(key, score) {
    var q = S().quiz[key] || { best: 0, attempts: 0 };
    q.best = Math.max(q.best, score); q.attempts++; q.last = score; q.at = C.today();
    S().quiz[key] = q; C.logActivity(); C.save(); refreshSide();
    var chip = document.getElementById('quiz-best');
    if (chip) { chip.hidden = false; chip.className = 'chip num' + (q.best >= 70 ? ' chip-ok' : ''); chip.textContent = 'Best: ' + q.best + '% · ' + q.attempts + ' attempt' + (q.attempts > 1 ? 's' : ''); }
    C.toast(score >= 70 ? 'Quiz passed with ' + score + '%. बढ़िया!' : 'Scored ' + score + '%. Review and try again.');
  }

  /* ---------- labs ---------- */
  function mountLab(meta, root) {
    if (!meta || !root) return;
    var st = S(); st.labs[meta.id] = st.labs[meta.id] || {};
    var ctx = {
      onTaskDone: function (tid) { if (!st.labs[meta.id][tid]) { st.labs[meta.id][tid] = true; C.logActivity(); C.save(); C.toast('Lab task complete'); refreshSide(); } },
      isTaskDone: function (tid) { return !!st.labs[meta.id][tid]; }
    };
    var alive = true, inst = null;
    currentCleanup.push(function () { alive = false; if (inst && inst.destroy) inst.destroy(); });
    root.innerHTML = '<div class="empty">Loading the lab…</div>';
    ensureLab(meta.id).then(function (lab) {
      if (!alive || !root.isConnected) return;
      root.innerHTML = '';
      try { inst = lab.mount(root, ctx); }
      catch (e) { root.innerHTML = '<div class="empty">This lab could not start in your browser (' + esc(e.message) + ').</div>'; }
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
        return '<a class="card stack-sm" href="#lab-' + esc(lab.id) + '" style="text-decoration:none;color:inherit"><span class="eyebrow">Module ' + modNo(m) + ' · ' + esc(m.title) + '</span><h3>' + esc(lab.title) + '</h3><p class="small muted">' + esc(lab.summary || '') + '</p>' +
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
  function mountExercise(e, root) {
    var saved = S().code[e.id], done = S().ex[e.id] && S().ex[e.id].done;
    var hintN = 0, solArmed = false;
    root.innerHTML = '<div class="ex"><div class="row-between"><h3>' + esc(e.title) + '</h3><div class="row">' +
      (done ? '<span class="chip chip-ok">Solved</span>' : '') + (e.optional ? '<span class="chip chip-hi">Optional</span>' : '') + '<span class="chip chip-level">' + esc(e.difficulty) + '</span>' +
      (e.packages && e.packages.length ? '<span class="chip">' + esc(e.packages.join(', ')) + '</span>' : '') + '</div></div>' +
      (e.concept ? '<span class="small muted">Practises: ' + inline(e.concept) + '</span>' : '') +
      (e.optional ? '<div class="callout small">Optional: this module needs no coding. Try this after Module 1.2 (Python), or just press <strong>Run</strong> and read the output.</div>' : '') +
      '<div class="prose">' + md(e.task) + '</div>' +
      '<div class="editor"><label class="visually-hidden" for="code-' + esc(e.id) + '">Code for ' + esc(e.title) + '</label><textarea id="code-' + esc(e.id) + '" spellcheck="false" autocapitalize="off" autocomplete="off">' + esc(saved != null ? saved : e.starter) + '</textarea></div>' +
      '<div class="row"><button class="btn btn-primary" data-x="check">Check</button><button class="btn" data-x="run">Run</button><button class="btn" data-x="stop" hidden>Stop</button>' +
      '<button class="btn btn-ghost" data-x="hint">Hint</button><button class="btn btn-ghost" data-x="reset">Reset</button><button class="btn btn-ghost" data-x="sol">Show solution</button><span class="kbd-hint">Ctrl/⌘ + Enter = Check</span></div>' +
      '<div class="stack-sm" data-x="hints"></div><div class="console" data-x="out" aria-live="polite"><span class="info">Output appears here.</span></div><ul class="checklist" data-x="results"></ul></div>';
    var ta = root.querySelector('textarea'), out = root.querySelector('[data-x=out]'), res = root.querySelector('[data-x=results]');
    var bStop = root.querySelector('[data-x=stop]'), t = null, busy = false;
    var flushCode = function () { if (!t) return; clearTimeout(t); t = null; if (e.id !== 'playground') { S().code[e.id] = ta.value; C.save(); } };
    ta.addEventListener('input', function () { clearTimeout(t); t = setTimeout(flushCode, 400); });
    pendingFlush.push(flushCode); currentCleanup.push(flushCode);
    currentCleanup.push(function () { if (busy) R.stop(); });
    function setBusy(b) { busy = b; root.querySelector('[data-x=check]').disabled = b; root.querySelector('[data-x=run]').disabled = b; bStop.hidden = !b; }
    ta.addEventListener('keydown', function (ev) {
      if (ev.key === 'Tab' && !ev.shiftKey) { ev.preventDefault(); var s = ta.selectionStart; ta.value = ta.value.slice(0, s) + '    ' + ta.value.slice(ta.selectionEnd); ta.selectionStart = ta.selectionEnd = s + 4; }
      if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); go(true); }
    });
    function line(cls, text) { var s = document.createElement('span'); s.className = cls; s.textContent = text; out.appendChild(s); }
    function go(withTests) {
      if (busy) return;
      flushCode();
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
            return '<li class="small"><span>' + (x.ok ? '✓ ' : '✗ ') + inline(x.name) + (!x.ok && x.hint ? '<br><span class="muted">Hint: ' + inline(x.hint) + '</span>' : '') + (!x.ok && x.error ? '<br><code>' + esc(x.error) + '</code>' + (FRIENDLY[et] ? '<br><span class="muted">' + esc(FRIENDLY[et]) + '</span>' : '') : '') + '</span></li>';
          }).join('');
          if (all.length && ok === all.length) {
            line('ok', '\nAll ' + all.length + ' checks passed in ' + ((Date.now() - started) / 1000).toFixed(1) + ' s. बढ़िया!\n');
            if (!(S().ex[e.id] && S().ex[e.id].done)) {
              S().ex[e.id] = { done: true, at: C.today() }; C.logActivity(); C.save(); C.toast('Exercise solved'); refreshSide();
              var hr = root.querySelector('.ex > .row-between .row'); if (hr && !hr.querySelector('.chip-ok')) hr.insertAdjacentHTML('afterbegin', '<span class="chip chip-ok">Solved</span>');
            }
          } else if (all.length) line('info', '\n' + ok + ' of ' + all.length + ' checks passed. Read the hints above.\n');
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
    root.querySelector('[data-x=reset]').addEventListener('click', function () { ta.value = e.starter; S().code[e.id] = e.starter; C.save(); });
    root.querySelector('[data-x=sol]').addEventListener('click', function (ev) {
      var b = ev.currentTarget;
      if (!e.solution) return;
      if (!solArmed) { solArmed = true; b.textContent = 'Sure? Click again to reveal'; setTimeout(function () { solArmed = false; b.textContent = 'Show solution'; }, 4000); return; }
      ta.value = e.solution; b.textContent = 'Solution shown'; solArmed = false;
    });
  }
  function viewPractice() {
    var st = S();
    setView('<div class="wrap stack-lg">' + crumbs([['Home', 'home'], ['Practice']]) +
      '<header class="stack-sm"><h1>Practice</h1><p class="lede muted prose">' + D.exercises.length + ' auto-graded Python exercises that run in your browser. Solve them in order inside each module, or jump straight in here.</p><div class="row"><a class="btn" href="#playground">Open the free Python playground</a></div></header>' +
      D.levels.map(function (l) {
        var ms = modulesOf(l.id).filter(function (m) { return exOf(m.id).length; });
        if (!ms.length) return '';
        return '<section class="stack"><h2>Level ' + l.id + ' · ' + esc(l.name) + '</h2><div class="module-list">' + ms.map(function (m) {
          return exOf(m.id).map(function (e) {
            var d = st.ex[e.id] && st.ex[e.id].done;
            return '<a class="module-row' + (d ? ' done' : '') + '" href="#ex-' + esc(e.id.replace(/^ex-/, '')) + '"><span class="idx num">' + (d ? '✓' : modNo(m)) + '</span><span><h3>' + esc(e.title) + '</h3><span class="meta"><span class="chip chip-level">' + esc(e.difficulty) + '</span><span class="chip">' + esc(m.title) + '</span></span></span><span></span></a>';
          }).join('');
        }).join('') + '</div></section>';
      }).join('') + (D.exercises.length ? '' : '<div class="empty">Exercises are being added.</div>') + '</div>', 'Practice');
  }
  function viewExercise(rid) {
    var e = exById['ex-' + rid] || exById[rid]; if (!e) return viewNotFound();
    var m = modById[e.moduleId];
    setView('<div class="wrap stack">' + crumbs([['Home', 'home'], ['Practice', 'practice'], [e.title]]) +
      '<header class="stack-sm"><span class="eyebrow">' + (m ? 'Module ' + modNo(m) + ' · ' + esc(m.title) : '') + '</span><h1>' + esc(e.title) + '</h1></header><div id="exroot"></div>' +
      (m ? '<p><a href="#m-' + esc(m.id) + '">Back to the module →</a></p>' : '') + '</div>', e.title);
    mountExercise(e, document.getElementById('exroot'));
  }
  function viewPlayground() {
    var pg = { id: 'playground', title: 'Python playground', difficulty: 'free', packages: [], task: 'Write any Python here and press **Run**. `numpy`, `pandas` and `scikit-learn` load automatically when you import them.', starter: 'import numpy as np\n\nmarks = np.array([72, 85, 64, 90, 78])\nprint("Average marks:", marks.mean())\nprint("Above 75:", marks[marks > 75])\n', solution: '', tests: '', hints: ['Use print(...) to see values.'] };
    setView('<div class="wrap stack">' + crumbs([['Home', 'home'], ['Practice', 'practice'], ['Playground']]) + '<header><h1>Python playground</h1></header><div id="exroot"></div></div>', 'Playground');
    mountExercise(pg, document.getElementById('exroot'));
    var root = document.getElementById('exroot');
    ['check', 'sol'].forEach(function (k) { var b = root.querySelector('[data-x=' + k + ']'); if (b) b.hidden = true; });
    var kh = root.querySelector('.kbd-hint'); if (kh) kh.hidden = true;
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
        return '<section class="stack"><h2>' + (g === 5 ? 'Grand capstones' : 'Level ' + g + ' · ' + esc(l ? l.name : '')) + '</h2><div class="grid">' + ps.map(projCard).join('') + '</div></section>';
      }).join('') + (D.projects.length ? '' : '<div class="empty">Projects are being added.</div>') + '</div>', 'Projects');
  }
  function viewProject(id) {
    var p = projById[id]; if (!p) return viewNotFound();
    var st = S().projects[id] = S().projects[id] || { steps: {}, rubric: {}, links: {} };
    st.steps = st.steps || {}; st.rubric = st.rubric || {}; st.links = st.links || {};
    var html = '<div class="wrap stack-lg">' + crumbs([['Home', 'home'], ['Projects', 'projects'], [p.title]]) +
      '<header class="stack-sm"><div class="row"><span class="eyebrow">' + (p.level === 5 ? 'Grand capstone' : 'Level ' + p.level + ' project') + '</span>' + stars(p.difficulty || 3) + '<span class="chip num">~' + esc(p.hours || '?') + ' hours</span></div><h1>' + esc(p.title) + '</h1><p class="lede muted prose">' + inline(p.tagline || '') + '</p></header>' +
      '<div class="two-col"><div class="stack-lg">' +
      '<section class="stack-sm prose"><h3>The brief</h3><p>' + inline(p.brief || '') + '</p>' + (p.why ? '<div class="callout callout-indigo"><strong>Why build this:</strong> ' + inline(p.why) + '</div>' : '') + (p.indiaContext ? '<p class="small muted">' + inline(p.indiaContext) + '</p>' : '') + '</section>' +
      (p.datasets && p.datasets.length ? '<section class="stack-sm"><h3>Data</h3><ul class="prose">' + p.datasets.map(function (d) { return '<li>' + (d.url ? '<a href="' + esc(d.url) + '" target="_blank" rel="noopener">' + esc(d.name) + '</a>' : '<strong>' + esc(d.name) + '</strong>') + (d.note ? ' · <span class="muted">' + inline(d.note) + '</span>' : '') + '</li>'; }).join('') + '</ul></section>' : '') +
      '<section class="stack-sm"><h3>Milestones</h3><ul class="checklist">' + (p.milestones || []).map(function (ms, i) {
        return '<li><label><input type="checkbox" data-action="pstep" data-id="' + esc(id) + '" data-i="' + i + '"' + (st.steps[i] ? ' checked' : '') + '><span><strong>' + esc(ms.title) + '</strong><br><span class="small muted">' + inline(ms.detail || '') + '</span></span></label></li>';
      }).join('') + '</ul></section>' +
      '<section class="stack-sm"><h3>Rubric: grade yourself honestly</h3><div class="table-wrap"><table class="simple"><thead><tr><th>Criterion</th><th>Basic</th><th>Good</th><th>Excellent</th></tr></thead><tbody>' +
      (p.rubric || []).map(function (r, i) {
        return '<tr><td><strong>' + esc(r.criterion) + '</strong></td>' + ['basic', 'good', 'excellent'].map(function (lv, k) {
          return '<td><label class="small" style="display:grid;grid-template-columns:20px 1fr;gap:6px"><input type="radio" name="rub-' + i + '" data-action="prub" data-id="' + esc(id) + '" data-i="' + i + '" value="' + (k + 1) + '"' + (st.rubric[i] === k + 1 ? ' checked' : '') + '><span>' + inline(r[lv] || '') + '</span></label></td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table></div><p class="small muted" id="rub-score"></p></section>' +
      listBlock('Stretch goals', p.stretch) + listBlock('Pitfalls to avoid', p.pitfalls) +
      '</div><aside class="stack">' + (p.freeStack ? '<div class="callout small"><strong>Free tools (₹0):</strong> ' + inline(p.freeStack) + '</div>' : '') +
      '<div class="card stack-sm"><strong>Deliverables</strong><ul class="small">' + (p.deliverables || []).map(function (d) { return '<li>' + inline(d) + '</li>'; }).join('') + '</ul></div>' +
      (p.skills && p.skills.length ? '<div class="card stack-sm"><strong>Skills you will use</strong><div class="row">' + p.skills.map(function (s) { return '<span class="chip">' + esc(s) + '</span>'; }).join('') + '</div></div>' : '') +
      '<div class="card stack-sm"><strong>Your links</strong><label class="small" for="pl-repo">GitHub repo</label><input type="text" id="pl-repo" data-action="plink" data-k="repo" data-id="' + esc(id) + '" value="' + esc(st.links.repo || '') + '" placeholder="https://github.com/you/project">' +
      '<label class="small" for="pl-demo">Live demo</label><input type="text" id="pl-demo" data-action="plink" data-k="demo" data-id="' + esc(id) + '" value="' + esc(st.links.demo || '') + '" placeholder="https://huggingface.co/spaces/...">' +
      '<button class="btn ' + (st.done ? '' : 'btn-haldi') + '" data-action="pdone" data-id="' + esc(id) + '">' + (st.done ? 'Completed ✓ (undo)' : 'Mark project complete') + '</button></div>' +
      (p.modules && p.modules.length ? '<div class="card stack-sm"><strong>Learn first</strong><ul class="small">' + p.modules.map(function (mid) { return modById[mid] ? '<li><a href="#m-' + esc(mid) + '">' + esc(modById[mid].title) + '</a></li>' : ''; }).join('') + '</ul></div>' : '') +
      '</aside></div></div>';
    setView(html, p.title);
    updateRubric(p, st);
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
      '<header class="stack-sm"><h1>Level tests</h1><p class="lede muted prose">Each test mixes the whole level. Answers are revealed only after you submit. Pass with 70% before moving on. Module quizzes live on each module page.</p></header><div class="grid">' +
      D.levels.map(function (l) {
        var q = D.quizzes['test-l' + l.id] || [], s = S().quiz['test-l' + l.id];
        return '<div class="card stack-sm"><span class="eyebrow">Level ' + l.id + ' · ' + esc(l.name) + '</span><h3>' + esc(l.title) + '</h3><span class="small muted">' + q.length + ' questions · ' + Math.max(15, Math.round(q.length * 1.5)) + ' minutes</span>' +
          (s ? '<span class="chip ' + (s.best >= 70 ? 'chip-ok' : '') + ' num">Best ' + esc(s.best) + '%</span>' : '') + '<a class="btn btn-primary" href="#test-l' + l.id + '">' + (s ? 'Retake' : 'Start') + ' test</a></div>';
      }).join('') + '</div>' +
      '<section class="stack"><h2>Module quizzes taken</h2>' + quizTable() + '</section></div>', 'Tests');
  }
  function quizTable() {
    var rows = D.modules.filter(function (m) { return S().quiz[m.id]; }).map(function (m) {
      var q = S().quiz[m.id];
      return '<tr><td><a href="#m-' + esc(m.id) + '">' + esc(modNo(m) + ' ' + m.title) + '</a></td><td class="num">' + esc(q.best) + '%</td><td class="num">' + esc(q.attempts) + '</td><td>' + (q.best >= 70 ? '<span class="chip chip-ok">passed</span>' : '<span class="chip">retry</span>') + '</td></tr>';
    });
    return rows.length ? '<div class="table-wrap"><table class="simple"><thead><tr><th>Module</th><th>Best</th><th>Attempts</th><th></th></tr></thead><tbody>' + rows.join('') + '</tbody></table></div>' : '<div class="empty">No quizzes taken yet. Every module has one.</div>';
  }
  function viewTest(lv) {
    var l = levelById[lv], q = D.quizzes['test-l' + lv]; if (!l || !q) return viewNotFound();
    var mins = Math.max(15, Math.round(q.length * 1.5));
    setView('<div class="wrap stack">' + crumbs([['Home', 'home'], ['Tests', 'tests'], ['Level ' + lv]]) +
      '<header class="stack-sm"><span class="eyebrow">Level ' + lv + ' · ' + esc(l.name) + '</span><h1>Level ' + lv + ' test</h1><p class="muted prose">' + q.length + ' questions. Optional ' + mins + '-minute timer. You will see your score and full explanations after you submit.</p></header>' +
      '<div id="testroot"><div class="card stack-sm"><label class="row"><input type="checkbox" id="timed" checked> Use the ' + mins + '-minute timer</label><div><button class="btn btn-primary" id="begin">Begin the test</button></div></div></div></div>', 'Level ' + lv + ' test');
    document.getElementById('begin').addEventListener('click', function () {
      var timed = document.getElementById('timed').checked;
      var quiz = new C.Quiz(document.getElementById('testroot'), { questions: q, mode: 'test', minutes: timed ? mins : 0, onFinish: function (r) { recordQuiz('test-l' + lv, r.score); } });
      currentCleanup.push(function () { quiz.destroy(); });
    });
  }

  /* ---------- library ---------- */
  var libState = { q: '', lang: 'all', level: 'all', type: 'all' };
  function viewLibrary() {
    var types = {}; D.resources.forEach(function (r) { types[r.type] = 1; });
    setView('<div class="wrap stack-lg">' + crumbs([['Home', 'home'], ['Library']]) +
      '<header class="stack-sm"><h1>Library</h1><p class="lede muted prose">Every free resource in the course, in one place. Filter by language, level or type.</p></header>' +
      '<div class="filters"><label class="visually-hidden" for="lib-q">Search</label><input type="search" id="lib-q" placeholder="Search: e.g. pandas, CampusX, transformers, NPTEL" value="' + esc(libState.q) + '">' +
      selectHTML('lib-lang', 'Language', [['all', 'All languages'], ['hi', 'Hindi + Hinglish'], ['indian-english', 'Indian English'], ['english', 'English']], libState.lang) +
      selectHTML('lib-level', 'Level', [['all', 'All levels'], ['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced'], ['expert', 'Expert']], libState.level) +
      selectHTML('lib-type', 'Type', [['all', 'All types']].concat(Object.keys(types).sort().map(function (t) { return [t, t]; })), libState.type) +
      '</div><div class="small muted num" id="lib-count"></div><div class="grid" id="lib-grid"></div></div>', 'Library');
    function apply() {
      libState.q = document.getElementById('lib-q').value.toLowerCase().trim();
      libState.lang = document.getElementById('lib-lang').value; libState.level = document.getElementById('lib-level').value; libState.type = document.getElementById('lib-type').value;
      var list = D.resources.filter(function (r) {
        if (libState.lang === 'hi' && !(r.language === 'hindi' || r.language === 'hinglish')) return false;
        if (libState.lang !== 'all' && libState.lang !== 'hi' && r.language !== libState.lang) return false;
        if (libState.level !== 'all' && r.level !== libState.level) return false;
        if (libState.type !== 'all' && r.type !== libState.type) return false;
        if (libState.q) { var hay = [r.title, r.creator, r.platform, (r.topics || []).join(' '), r.why].join(' ').toLowerCase(); if (hay.indexOf(libState.q) < 0) return false; }
        return true;
      });
      list = list.slice().sort(function (a, b) { return C.langRank(a.language, S().prefs.lang) - C.langRank(b.language, S().prefs.lang); });
      document.getElementById('lib-count').textContent = list.length + ' of ' + D.resources.length + ' resources · Hindi, Hinglish and Indian English teachers listed first';
      document.getElementById('lib-grid').innerHTML = list.slice(0, 300).map(function (r) { return resCard(r); }).join('') || '<div class="empty">Nothing matches. Clear a filter.</div>';
    }
    ['lib-q', 'lib-lang', 'lib-level', 'lib-type'].forEach(function (id) { document.getElementById(id).addEventListener(id === 'lib-q' ? 'input' : 'change', apply); });
    apply();
  }
  function selectHTML(id, label, opts, val) {
    return '<label class="visually-hidden" for="' + id + '">' + esc(label) + '</label><select id="' + id + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === val ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
  }

  /* ---------- glossary ---------- */
  function viewGlossary() {
    var list = D.glossary.slice().sort(function (a, b) { return a.term.localeCompare(b.term); });
    setView('<div class="wrap stack-lg">' + crumbs([['Home', 'home'], ['Glossary']]) +
      '<header class="stack-sm"><h1>Jargon buster</h1><p class="lede muted prose">' + list.length + ' AI and ML terms in plain English, with the Hindi word and an everyday example.</p><div class="row"><a class="btn btn-primary" href="#cards">Revise with flashcards</a></div></header>' +
      '<div class="filters"><label class="visually-hidden" for="g-q">Search terms</label><input type="search" id="g-q" placeholder="Search: overfitting, embedding, LoRA…"></div><dl id="g-list"></dl></div>', 'Glossary');
    function apply() {
      var q = document.getElementById('g-q').value.toLowerCase().trim();
      var f = list.filter(function (g) { return !q || (g.term + ' ' + g.simple + ' ' + (g.hindi || '')).toLowerCase().indexOf(q) >= 0; });
      document.getElementById('g-list').innerHTML = f.map(function (g) {
        var m = modById[g.moduleId];
        return '<div class="gloss-term"><dt>' + esc(g.term) + (g.hindi ? '<div class="small muted" lang="hi">' + esc(g.hindi) + '</div>' : '') + '</dt><dd class="stack-sm"><span>' + inline(g.simple) + '</span>' +
          (g.example ? '<span class="small muted">Example: ' + inline(g.example) + '</span>' : '') + (m ? '<a class="small" href="#m-' + esc(m.id) + '">Learn it in ' + esc(modNo(m) + ' ' + m.title) + '</a>' : '') + '</dd></div>';
      }).join('') || '<div class="empty">No term matches.</div>';
    }
    document.getElementById('g-q').addEventListener('input', apply); apply();
  }

  /* ---------- career + faq ---------- */
  function viewCareer() {
    var pg = D.pages.career || { title: 'Careers', sections: [] }, faq = D.pages.faq || [], src = D.pages.sources || [];
    setView('<div class="wrap stack-lg">' + crumbs([['Home', 'home'], ['Career & FAQ']]) +
      '<header class="stack-sm"><h1>' + esc(pg.title || 'Careers') + '</h1><p class="lede muted prose">What to do with these skills in India: jobs, freelancing and AI services for agencies.</p></header>' +
      '<div class="prose stack">' + tocHTML(pg.sections) + sectionsHTML(pg.sections) + '</div>' +
      (faq.length ? '<section class="stack"><h2>Frequently asked questions</h2><div class="stack-sm">' + faq.map(function (f) { return '<details class="fold"><summary>' + esc(f.q) + '</summary><div class="prose">' + md(f.a) + '</div></details>'; }).join('') + '</div></section>' : '') +
      (src.length ? '<section class="stack-sm"><h3>Sources checked</h3><ul class="small">' + src.map(function (s) { return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.label) + '</a> <span class="muted">(' + esc(s.checked || '') + ')</span></li>'; }).join('') + '</ul></section>' : '') +
      '</div>', 'Career & FAQ');
  }

  /* ---------- search ---------- */
  var searchQ = '';
  function viewSearch() {
    setView('<div class="wrap stack-lg">' + crumbs([['Home', 'home'], ['Search']]) +
      '<header class="stack-sm"><h1>Search</h1><p class="muted">Modules, labs, exercises, projects, glossary terms and videos.</p></header>' +
      '<div class="filters"><label class="visually-hidden" for="s-q">Search the course</label><input type="search" id="s-q" placeholder="Try: regression, RAG, CampusX, overfitting, LoRA" value="' + esc(searchQ) + '" autofocus></div><div id="s-out" class="stack-lg"></div></div>', 'Search');
    var inp = document.getElementById('s-q');
    function hit(text, q) { return String(text || '').toLowerCase().indexOf(q) >= 0; }
    function group(title, items) { return items.length ? '<section class="stack-sm"><h2 class="small eyebrow">' + esc(title) + ' · ' + items.length + '</h2><div class="module-list">' + items.slice(0, 12).join('') + '</div></section>' : ''; }
    function row(href, title, meta) { return '<a class="module-row" href="' + href + '"><span class="idx" aria-hidden="true">→</span><span><h3>' + esc(title) + '</h3><span class="meta"><span class="small muted">' + esc(meta) + '</span></span></span><span></span></a>'; }
    function apply() {
      var q = inp.value.toLowerCase().trim(); searchQ = inp.value;
      var out = document.getElementById('s-out');
      if (q.length < 2) { out.innerHTML = '<div class="empty">Type at least two letters.</div>'; return; }
      var mods = D.modules.filter(function (m) { return hit(m.title, q) || hit((m.topics || []).join(' '), q) || hit(m.overview, q); }).map(function (m) { return row('#m-' + m.id, modNo(m) + ' ' + m.title, levelName(m.level)); });
      var labs = Object.keys(LABS).map(function (k) { return LABS[k]; }).filter(function (l) { return hit(l.title, q) || hit(l.summary, q); }).map(function (l) { return row('#lab-' + l.id, l.title, 'Lab'); });
      var exs = D.exercises.filter(function (e) { return hit(e.title, q) || hit(e.concept, q) || hit(e.task, q); }).map(function (e) { return row('#ex-' + e.id.replace(/^ex-/, ''), e.title, (modById[e.moduleId] || {}).title || ''); });
      var prj = D.projects.filter(function (p) { return hit(p.title, q) || hit(p.tagline, q) || hit(p.brief, q); }).map(function (p) { return row('#' + p.id, p.title, p.level === 5 ? 'Capstone' : 'Level ' + p.level + ' project'); });
      var gl = D.glossary.filter(function (g) { return hit(g.term, q) || hit(g.hindi, q); }).map(function (g) { return row('#glossary', g.term + (g.hindi ? ' · ' + g.hindi : ''), g.simple); });
      var res = D.resources.filter(function (r) { return hit(r.title, q) || hit(r.creator, q) || hit((r.topics || []).join(' '), q); }).map(function (r) { return row('#m-' + r.modules[0] + '~watch', r.title, (r.creator || '') + ' · ' + (C.LANG_LABEL[r.language] || '')); });
      var html = group('Modules', mods) + group('Labs', labs) + group('Practice', exs) + group('Projects', prj) + group('Glossary', gl) + group('Videos and courses', res);
      out.innerHTML = html || '<div class="empty">Nothing found for “' + esc(inp.value) + '”.</div>';
    }
    inp.addEventListener('input', apply); apply(); inp.focus();
  }

  /* ---------- flashcards ---------- */
  function viewCards() {
    var st = S(); st.cards = st.cards || {};
    var lvSel = st.prefs.cardLevel || 'all';
    setView('<div class="wrap stack-lg">' + crumbs([['Home', 'home'], ['Glossary', 'glossary'], ['Flashcards']]) +
      '<header class="stack-sm"><h1>Flashcards</h1><p class="lede muted prose">Revise the jargon. Read the term, say the meaning out loud, then flip. Cards you know come back less often.</p>' +
      '<div class="row">' + selectHTML('card-level', 'Level', [['all', 'All levels'], ['1', 'Level 1'], ['2', 'Level 2'], ['3', 'Level 3'], ['4', 'Level 4']], lvSel) + '<span class="small muted num" id="card-count"></span></div></header>' +
      '<div id="card-root"></div></div>', 'Flashcards');
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
          (flipped ? '<div class="small muted" lang="hi">' + esc(g.hindi || '') + '</div><p class="prose" style="max-width:52ch">' + inline(g.simple) + '</p>' + (g.example ? '<p class="small muted prose" style="max-width:52ch">' + inline(g.example) + '</p>' : '') : '<p class="muted small">What does it mean?</p>') +
          '<div class="row" style="justify-content:center">' + (flipped ? '<button class="btn" data-c="again">Again</button><button class="btn btn-primary" data-c="know">I knew it</button>' : '<button class="btn btn-primary" data-c="flip">Flip card</button>') + '</div></div>';
        root.querySelectorAll('[data-c]').forEach(function (b) {
          b.addEventListener('click', function () {
            var c = b.getAttribute('data-c');
            if (c === 'flip') { flipped = true; draw(); root.querySelector('[data-c=know]').focus(); }
            else { st.cards[g.term] = c === 'know' ? Math.min(4, (st.cards[g.term] || 0) + 1) : 0; C.logActivity(); C.save(); next(); }
          });
        });
      }
      draw();
    }
    sel.addEventListener('change', function () { st.prefs.cardLevel = sel.value; C.save(); next(); });
    next();
  }

  /* ---------- progress ---------- */
  function viewProgress() {
    var st = S();
    var solved = Object.keys(st.ex).filter(function (k) { return st.ex[k] && st.ex[k].done; }).length;
    var labTasks = Object.keys(st.labs).reduce(function (s, k) { return s + Object.keys(st.labs[k] || {}).filter(function (t) { return st.labs[k][t]; }).length; }, 0);
    var passed = Object.keys(st.quiz).filter(function (k) { return st.quiz[k].best >= 70; }).length;
    var projDone = Object.keys(st.projects).filter(function (k) { return st.projects[k] && st.projects[k].done; }).length;
    setView('<div class="wrap stack-lg">' + crumbs([['Home', 'home'], ['My progress']]) +
      '<header class="row-between"><div class="stack-sm"><h1>My progress</h1><p class="muted">Saved only in this browser on this device. Export it to keep a backup or move devices.</p></div>' + ring(overallProgress()) + '</header>' +
      '<div class="lab-stats">' + stat('Course complete', overallProgress() + '%') + stat('Day streak', C.streak()) + stat('Exercises solved', solved + '/' + D.exercises.length) + stat('Quizzes passed', passed) + stat('Lab tasks', labTasks) + stat('Projects done', projDone + '/' + D.projects.length) + '</div>' +
      '<section class="stack">' + D.levels.map(function (l) { return '<div class="stack-sm"><div class="row-between"><a href="#level-' + l.id + '"><strong>Level ' + l.id + ' · ' + esc(l.name) + '</strong></a><span class="num small">' + levelProgress(l.id) + '%</span></div>' + bar(levelProgress(l.id)) + '</div>'; }).join('') + '</section>' +
      '<div class="two-col"><section class="stack"><h2>Quizzes</h2>' + quizTable() + '</section><aside class="stack">' + plannerCard() +
      '<div class="card stack-sm"><strong>Backup</strong><div class="row"><button class="btn btn-sm" data-action="export">Copy progress</button><button class="btn btn-sm" data-action="download">Download file</button></div>' +
      '<label class="small" for="import-box">Restore: paste a backup and press Restore</label><textarea id="import-box" rows="3" placeholder="{&quot;v&quot;:1, …}"></textarea><div class="row"><button class="btn btn-sm" data-action="import">Restore</button><button class="btn btn-sm btn-ghost" data-action="reset">Reset all progress</button></div></div>' +
      '</aside></div></div>', 'My progress');
    bindPlanner();
  }
  function stat(k, v) { return '<div class="stat"><div class="k">' + esc(k) + '</div><div class="v">' + esc(v) + '</div></div>'; }

  function viewNotFound() {
    setView('<div class="wrap stack"><h1>Page not found</h1><p class="muted">That link does not match anything here. <a href="#home">Go home</a> or open the <a href="#roadmap">roadmap</a>.</p></div>', 'Not found');
  }

  /* ---------- global actions (event delegation) ---------- */
  var resetArmed = false;
  document.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-action]'); if (!t) return;
    var a = t.getAttribute('data-action'), id = t.getAttribute('data-id'), st = S();
    if (a === 'play') { var r = resById[id]; if (r) { C.play(t.parentNode, r); st.last = st.last; } }
    else if (a === 'lang') { st.prefs.lang = t.getAttribute('data-lang'); C.save(); var y = window.scrollY; route(); window.scrollTo(0, y); }
    else if (a === 'mod-done') { var cur = st.modules[id] && st.modules[id].done; st.modules[id] = { done: !cur, at: C.today() }; if (!cur) C.logActivity(); C.save(); C.toast(cur ? 'Module marked as not complete' : 'Module complete. Next one!'); refreshSide(); }
    else if (a === 'pdone') { var p = st.projects[id] = st.projects[id] || {}; p.done = !p.done; if (p.done) C.logActivity(); C.save(); C.toast(p.done ? 'Project complete. Add it to your portfolio!' : 'Project marked as in progress'); t.textContent = p.done ? 'Completed ✓ (undo)' : 'Mark project complete'; t.className = 'btn ' + (p.done ? '' : 'btn-haldi'); }
    else if (a === 'export') { var txt = JSON.stringify(st); try { navigator.clipboard.writeText(txt).then(function () { C.toast('Progress copied'); }, function () { fallbackCopy(txt); }); } catch (e) { fallbackCopy(txt); } }
    else if (a === 'download') { var blob = new Blob([JSON.stringify(st, null, 1)], { type: 'application/json' }), aEl = document.createElement('a'); aEl.href = URL.createObjectURL(blob); aEl.download = 'ai-marg-progress-' + C.today() + '.json'; document.body.appendChild(aEl); aEl.click(); aEl.remove(); }
    else if (a === 'import') { try { var obj = JSON.parse(document.getElementById('import-box').value); if (!obj || typeof obj !== 'object' || obj.v !== 1) throw new Error('not a backup'); C.replaceState(obj); applyTheme(); C.toast('Progress restored'); route(); } catch (e) { C.toast('That text is not a valid AI Marg backup.'); } }
    else if (a === 'reset') { if (!resetArmed) { resetArmed = true; t.textContent = 'Click again to erase everything'; setTimeout(function () { resetArmed = false; t.textContent = 'Reset all progress'; }, 4000); return; } C.resetAll(); resetArmed = false; applyTheme(); C.toast('Progress reset'); route(); }
    else if (a === 'theme') { cycleTheme(); }
  });
  function fallbackCopy(txt) { var box = document.getElementById('import-box'); if (box) { box.value = txt; box.select(); } C.toast('Select the text in the box and copy it'); }
  document.addEventListener('change', function (ev) {
    var t = ev.target, a = t.getAttribute && t.getAttribute('data-action'), id = t.getAttribute && t.getAttribute('data-id'), st = S();
    if (!a) return;
    if (a === 'watched') { if (t.checked) { st.watched[id] = C.today(); C.logActivity(); } else delete st.watched[id]; C.save(); refreshSide(); C.toast(t.checked ? 'Marked as watched' : 'Removed from watched'); }
    else if (a === 'pstep') { var p = st.projects[id] = st.projects[id] || {}; p.steps = p.steps || {}; p.steps[t.getAttribute('data-i')] = t.checked; if (t.checked) C.logActivity(); C.save(); }
    else if (a === 'prub') { var q = st.projects[id] = st.projects[id] || {}; q.rubric = q.rubric || {}; q.rubric[t.getAttribute('data-i')] = Number(t.value); C.save(); updateRubric(projById[id], q); }
  });
  document.addEventListener('input', function (ev) {
    var t = ev.target; if (!t.getAttribute || t.getAttribute('data-action') !== 'plink') return;
    var id = t.getAttribute('data-id'), p = S().projects[id] = S().projects[id] || {}; p.links = p.links || {}; p.links[t.getAttribute('data-k')] = t.value; C.save();
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
    var raw = (location.hash || '').replace(/^#/, ''), h;
    try { h = decodeURIComponent(raw); } catch (e) { h = raw; }
    h = h || 'home';
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
    else if (h === 'career' || h === 'faq') { viewCareer(); navKey = 'career'; }
    else if (h === 'progress') viewProgress();
    else viewNotFound();
    } catch (err) { if (window.console) console.error(err); viewNotFound(); }
    document.querySelectorAll('.nav a').forEach(function (a) { if (a.getAttribute('href') === '#' + navKey) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    var nav = document.querySelector('.nav'); if (nav) nav.classList.remove('open');
    var mb = document.querySelector('.menu-btn'); if (mb) mb.setAttribute('aria-expanded', 'false');
  }
  window.addEventListener('hashchange', route);
  document.addEventListener('keydown', function (ev) {
    var tag = (ev.target && ev.target.tagName) || '';
    if (ev.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(tag) && !ev.ctrlKey && !ev.metaKey) { ev.preventDefault(); location.hash = 'search'; }
  });
  var menuBtn = document.querySelector('.menu-btn');
  if (menuBtn) menuBtn.addEventListener('click', function () { var nav = document.querySelector('.nav'); var open = nav.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', String(open)); });
  applyTheme();
  route();
  window.AIM_APP = { route: route, moduleProgress: moduleProgress, watchList: watchList };
})();
