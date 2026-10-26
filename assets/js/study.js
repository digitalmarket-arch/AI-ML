/* AI Marg study features: learning methods built into the site.
   This file is the shared base. It holds:
   - study content, loaded on demand from data/study.js (recall questions, Feynman checklists, Manana questions, guide);
   - the learner's study progress, registered with core.js so it is saved, synced and merged like the rest;
   - the review scheduler (adaptive spaced repetition) and a simple memory model for retention;
   - the AI helper: "Copy prompt" for any AI app, and "Ask Gemini" for signed-in learners when switched on;
   - small UI helpers, the Sanskrit method names, and the Study room page (#study).
   Feature scripts (assets/js/study-*.js) add pages and extras with AIM_STUDY.addRoute, on, setReflect and addHubCard.
   Plain script (no build step); exposes window.AIM_STUDY. */
(function () {
  'use strict';
  var C = window.AIM_CORE, D = window.AIM || {};
  var esc = C.esc, inline = C.inline;
  var app = function () { return window.AIM_APP; };
  var S = function () { return C.state; };

  /* ---------- study content: data/study.js, loaded the first time a study feature needs it ---------- */
  var dataP = null;
  function ensureData() {
    if (D.study) return Promise.resolve(D.study);
    if (dataP) return dataP;
    dataP = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'data/study.js'; s.async = true;
      s.onload = function () { if (D.study) resolve(D.study); else { dataP = null; reject(new Error('Study content is missing.')); } };
      s.onerror = function () { dataP = null; s.remove(); reject(new Error('Study content did not load. Check your connection and try again.')); };
      document.head.appendChild(s);
    });
    return dataP;
  }
  function modData(mid) { return D.study && D.study.modules ? D.study.modules[mid] || null : null; }
  function guide() { return D.study ? D.study.guide || null : null; }
  // quiz question id -> { mid, topic, skill } (from each module's quizTags)
  var tagIndex = null;
  function qtag(qid) {
    if (!D.study) return null;
    if (!tagIndex) {
      tagIndex = {};
      Object.keys(D.study.modules || {}).forEach(function (mid) {
        var t = D.study.modules[mid].quizTags || {};
        Object.keys(t).forEach(function (q) { tagIndex[q] = { mid: mid, topic: t[q].topic, skill: t[q].skill }; });
      });
    }
    return tagIndex[qid] || null;
  }
  // every quiz question by id (module quizzes and level tests)
  var qIndex = null;
  function question(qid) {
    if (!qIndex) {
      qIndex = {};
      Object.keys(D.quizzes || {}).forEach(function (k) { (D.quizzes[k] || []).forEach(function (q) { qIndex[q.id] = { q: q, set: k }; }); });
    }
    return qIndex[qid] ? qIndex[qid].q : null;
  }
  function questionSet(qid) { question(qid); return qIndex[qid] ? qIndex[qid].set : null; }

  /* ---------- time ---------- */
  function now() { return new Date().toISOString(); }
  function today() { return C.today(); } // the learner's local date, YYYY-MM-DD
  function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function addDays(day, n) { var d = new Date(day + 'T12:00:00'); d.setDate(d.getDate() + n); return ymd(d); }
  function daysBetween(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000); }

  /* ---------- study progress (parts of the saved state) ---------- */
  var isObj = function (o) { return !!o && typeof o === 'object' && !Array.isArray(o); };
  var BAD = /^(__proto__|constructor|prototype)$/;
  var str = function (v, n) { return typeof v === 'string' ? v.slice(0, n) : ''; };
  var num = function (v, lo, hi, dflt) { v = Number(v); return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : dflt; };
  var day = function (v) { return /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? String(v) : ''; };
  var iso = function (v) { return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T[\d:.]+Z?$/.test(v) ? v.slice(0, 30) : ''; };
  function cleanMap(o, fn) {
    var out = {};
    if (!isObj(o)) return out;
    Object.keys(o).forEach(function (k) { if (BAD.test(k) || k.length > 120) return; var v = fn(o[k], k); if (v !== undefined) out[k] = v; });
    return out;
  }
  // keep, for every key, the entry changed last (field 'at'); on a tie keep this device's
  function mergeNewer(a, b) {
    var out = {};
    Object.keys(a || {}).forEach(function (k) { if (!BAD.test(k)) out[k] = a[k]; });
    Object.keys(b || {}).forEach(function (k) {
      if (BAD.test(k)) return;
      var x = out[k], y = b[k];
      if (!Object.prototype.hasOwnProperty.call(out, k) || String((y && y.at) || '') > String((x && x.at) || '')) out[k] = y;
    });
    return out;
  }
  function newest(map, n) { // keep the n entries changed last
    var ks = Object.keys(map); if (ks.length <= n) return map;
    ks.sort(function (x, y) { return String(map[y].at).localeCompare(String(map[x].at)); });
    var out = {}; ks.slice(0, n).forEach(function (k) { out[k] = map[k]; }); return out;
  }
  var PARTS = {
    // review cards: s = stability in days (recall about 90% after s days), d = difficulty 1-10, due = next review day
    srs: {
      normalize: function (o) {
        return cleanMap(o, function (v) {
          if (!isObj(v)) return undefined;
          return { s: num(v.s, 0, 3650, 0), d: num(v.d, 1, 10, 5), due: day(v.due) || today(), last: day(v.last), reps: Math.floor(num(v.reps, 0, 1e5, 0)), lapses: Math.floor(num(v.lapses, 0, 1e5, 0)), off: !!v.off, at: iso(v.at) };
        });
      },
      merge: mergeNewer
    },
    // review log per day: [cards reviewed, cards remembered (Hard or better)]; the larger count wins so two devices are not added twice
    rlog: {
      normalize: function (o) {
        var m = cleanMap(o, function (v, k) { if (!day(k) || !Array.isArray(v)) return undefined; var n = Math.floor(num(v[0], 0, 1e5, 0)), ok = Math.floor(num(v[1], 0, n, 0)); return [n, ok]; });
        var ks = Object.keys(m).sort(); if (ks.length > 400) ks.slice(0, ks.length - 400).forEach(function (k) { delete m[k]; });
        return m;
      },
      merge: function (a, b) {
        var out = {}; Object.keys(a || {}).forEach(function (k) { out[k] = a[k]; });
        Object.keys(b || {}).forEach(function (k) { if (BAD.test(k)) return; var x = out[k]; out[k] = !x || b[k][0] > x[0] ? b[k] : x; });
        return out;
      }
    },
    // every quiz question answered: n tries, r right, lr last result, p option picked last (-1 unknown), su how sure (0 not asked, 1-3),
    // wrongAt last wrong, fix = days answered right since then
    qa: {
      normalize: function (o) {
        return cleanMap(o, function (v) {
          if (!isObj(v)) return undefined;
          var n = Math.floor(num(v.n, 0, 1e5, 0));
          return { n: n, r: Math.floor(num(v.r, 0, n, 0)), lr: v.lr ? 1 : 0, p: Math.floor(num(v.p, -1, 9, -1)), su: Math.floor(num(v.su, 0, 3, 0)), at: iso(v.at), wrongAt: iso(v.wrongAt),
            fix: (Array.isArray(v.fix) ? v.fix : []).map(day).filter(Boolean).slice(-5), src: str(v.src, 12) };
        });
      },
      merge: mergeNewer
    },
    // module reflections: Feynman text, Manana answers, Japa best round, Nididhyasana day
    refl: {
      normalize: function (o) {
        return cleanMap(o, function (v) {
          if (!isObj(v)) return undefined;
          return { feyn: str(v.feyn, 4000), ideas: Math.floor(num(v.ideas, 0, 10, 0)), soc: (Array.isArray(v.soc) ? v.soc : []).slice(0, 5).map(function (x) { return str(x, 1500); }),
            japa: Math.floor(num(v.japa, 0, 1000, 0)), nid: day(v.nid), at: iso(v.at) };
        });
      },
      merge: mergeNewer
    },
    // three-line summaries written after a video (Sravana)
    sum: {
      normalize: function (o) { return cleanMap(o, function (v) { return isObj(v) && typeof v.t === 'string' ? { t: str(v.t, 800), at: iso(v.at) } : undefined; }); },
      merge: mergeNewer
    },
    // journal entries (Svadhyaya)
    jr: {
      normalize: function (o) {
        return newest(cleanMap(o, function (v) {
          if (!isObj(v)) return undefined;
          return { at: iso(v.at) || now(), learnt: str(v.learnt, 2000), confused: str(v.confused, 2000), next: str(v.next, 1000), meth: str(v.meth, 200), conf: Math.floor(num(v.conf, 0, 5, 0)), mod: str(v.mod, 60), mins: Math.floor(num(v.mins, 0, 600, 0)), del: !!v.del };
        }), 400);
      },
      merge: mergeNewer
    },
    // focus sessions (Dharana)
    fs: {
      normalize: function (o) {
        return newest(cleanMap(o, function (v) {
          if (!isObj(v)) return undefined;
          return { at: iso(v.at) || now(), mins: Math.floor(num(v.mins, 0, 600, 0)), plan: Math.floor(num(v.plan, 0, 600, 0)), done: !!v.done, intent: str(v.intent, 300), mod: str(v.mod, 60) };
        }), 600);
      },
      merge: mergeNewer
    },
    // AI replies used today (shared by this person's devices: the larger count wins)
    ai: {
      normalize: function (o) { return isObj(o) && day(o.day) ? { day: o.day, n: Math.floor(num(o.n, 0, 1000, 0)) } : { day: '', n: 0 }; },
      merge: function (a, b) { a = a || { day: '', n: 0 }; b = b || { day: '', n: 0 }; if (a.day === b.day) return { day: a.day, n: Math.max(a.n, b.n) }; return a.day > b.day ? a : b; }
    }
  };
  Object.keys(PARTS).forEach(function (k) { C.registerPart(k, PARTS[k]); });

  /* ---------- review cards and the scheduler ---------- */
  // card ids: 'kt:<moduleId>:<i>' (key term i of the module), 'rc:<moduleId>:<cardKey>' (recall question of a lesson card)
  function reviewItem(id) {
    var p = String(id).split(':'), m = app() && app().modById[p[1]];
    if (!m) return null;
    if (p[0] === 'kt') {
      var t = (m.keyTerms || [])[Number(p[2])]; if (!t) return null;
      return { id: id, kind: 'term', mid: m.id, front: t.term, back: t.meaning, ask: 'What does this term mean?' };
    }
    if (p[0] === 'rc') {
      var md = modData(m.id), c = md && md.cards && md.cards[p[2]]; if (!c) return null;
      return { id: id, kind: 'recall', mid: m.id, card: p[2], front: c.recall, back: c.answer, ask: 'Answer from memory, then check.' };
    }
    return null;
  }
  function enroll(ids) {
    var st = S(), n = 0, t = today();
    (ids || []).forEach(function (id) {
      var c = st.srs[id];
      if (c && !c.off) return;
      st.srs[id] = { s: c ? c.s : 0, d: c ? c.d : 5, due: t, last: c ? c.last : '', reps: c ? c.reps : 0, lapses: c ? c.lapses : 0, off: false, at: now() };
      n++;
    });
    if (n) C.save();
    return n;
  }
  function unenroll(id) { var c = S().srs[id]; if (c && !c.off) { c.off = true; c.at = now(); C.save(); } }
  function moduleReviewIds(m) {
    var ids = (m.keyTerms || []).map(function (t, i) { return 'kt:' + m.id + ':' + i; });
    var md = modData(m.id);
    if (md && md.cards) Object.keys(md.cards).forEach(function (k) { ids.push('rc:' + m.id + ':' + k); });
    return ids;
  }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
  // grade: 1 Again (forgot), 2 Hard, 3 Good, 4 Easy. Intervals grow with each good recall, faster for easy cards, and reset on a lapse.
  function schedule(id, grade) {
    var st = S(), c = st.srs[id] || { s: 0, d: 5, reps: 0, lapses: 0 }, t = today();
    var d = Math.max(1, Math.min(10, (c.d || 5) + (3 - grade) * 0.7));
    var s;
    if (grade === 1) { s = 0; c.lapses = (c.lapses || 0) + 1; }
    else if (!c.reps || !c.s) s = [0, 0, 1, 3, 6][grade];
    else {
      var since = c.last ? Math.max(1, daysBetween(c.last, t)) : c.s;
      var base = Math.max(c.s, Math.min(since, c.s * 2)); // credit a late review a little, but not fully
      var mult = { 2: 1.2, 3: 2.3, 4: 3.3 }[grade] * (1.15 - 0.03 * d);
      s = Math.min(365, Math.max(1, base * mult));
    }
    if (s >= 3) s = s * (0.95 + 0.1 * hash(id + t)); // spread cards so they do not all fall on one day
    var entry = { s: Math.round(s * 10) / 10, d: Math.round(d * 10) / 10, due: addDays(t, Math.round(s)), last: t, reps: (c.reps || 0) + 1, lapses: c.lapses || 0, off: false, at: now() };
    st.srs[id] = entry;
    var lg = st.rlog[t] || [0, 0]; st.rlog[t] = [lg[0] + 1, lg[1] + (grade >= 2 ? 1 : 0)];
    C.logActivity(); C.save();
    return entry;
  }
  function dueIds(day0) {
    var st = S(), t = day0 || today();
    return Object.keys(st.srs).filter(function (id) { var c = st.srs[id]; return !c.off && c.due <= t; })
      .sort(function (x, y) { return st.srs[x].due.localeCompare(st.srs[y].due) || st.srs[x].s - st.srs[y].s; });
  }
  // chance of recalling a card today, from its stability (90% at s days, falling off after)
  function recallChance(c, day0) {
    if (!c || c.off || !c.reps) return null;
    if (!c.s) return 0.5;
    var t = Math.max(0, daysBetween(c.last || day0, day0 || today()));
    return Math.exp(Math.log(0.9) * t / c.s);
  }
  function retention(mid) { // average predicted recall of the learner's review cards (optionally one module)
    var st = S(), xs = [];
    Object.keys(st.srs).forEach(function (id) { if (mid && id.split(':')[1] !== mid) return; var r = recallChance(st.srs[id]); if (r != null) xs.push(r); });
    return xs.length ? { avg: xs.reduce(function (a, b) { return a + b; }, 0) / xs.length, n: xs.length } : { avg: null, n: 0 };
  }

  /* ---------- quiz answers ---------- */
  function recordAnswer(qid, correct, sure, src, picked) {
    var st = S(), x = st.qa[qid] || { n: 0, r: 0, lr: 0, p: -1, su: 0, at: '', wrongAt: '', fix: [], src: '' }, t = today();
    x.n++; if (correct) x.r++; x.lr = correct ? 1 : 0; x.p = typeof picked === 'number' ? picked : -1; x.su = sure || 0; x.at = now(); x.src = src || x.src;
    if (!correct) { x.wrongAt = x.at; x.fix = []; }
    else if (x.wrongAt && x.fix.indexOf(t) < 0) x.fix = x.fix.concat(t).slice(-5);
    st.qa[qid] = x; C.save();
    emit('qa', qid, x);
    return x;
  }
  // a mistake is "fixed" after two right answers on different days since the last wrong one
  function isMistake(x) { return !!(x && x.wrongAt && (x.fix || []).length < 2); }

  /* ---------- events, routes, Reflect tab, Study room cards ---------- */
  var subs = {};
  function on(ev, fn) { (subs[ev] = subs[ev] || []).push(fn); }
  function emit(ev) {
    var args = Array.prototype.slice.call(arguments, 1);
    (subs[ev] || []).forEach(function (fn) { try { fn.apply(null, args); } catch (e) { if (window.console) console.error(e); } });
  }
  var routes = [];
  function addRoute(re, render, navKey) { routes.push({ re: re, render: render, nav: navKey || 'study' }); }
  function route(h) {
    for (var i = 0; i < routes.length; i++) {
      var r = routes[i], m = typeof r.re === 'string' ? (h === r.re ? [h] : null) : r.re.exec(h);
      if (m) { r.render(m); return r.nav; }
    }
    return null;
  }
  var reflectFn = null;
  function setReflect(fn) { reflectFn = fn; }
  function renderReflect(m, el) {
    el.innerHTML = '<p class="muted">Loading…</p>';
    ensureData().then(function () { if (!el.isConnected) return; if (reflectFn) reflectFn(m, el); else el.innerHTML = '<div class="empty">Reflection tools are coming soon.</div>'; },
      function (e) { if (el.isConnected) el.innerHTML = '<div class="callout">' + esc(e.message) + '</div>'; });
  }
  var hubCards = [];
  function addHubCard(order, fn) { hubCards.push({ order: order, fn: fn }); hubCards.sort(function (a, b) { return a.order - b.order; }); }

  // the learning methods' Sanskrit names (Devanagari is used only here, as the learner asked)
  var SANS = {
    sravana: ['Śravaṇa', 'श्रवण', 'attentive listening'], manana: ['Manana', 'मनन', 'deep reflection'], nididhyasana: ['Nididhyāsana', 'निदिध्यासन', 'sustained contemplation'],
    abhyasa: ['Abhyāsa', 'अभ्यास', 'steady practice'], vairagya: ['Vairāgya', 'वैराग्य', 'freedom from distraction'], svadhyaya: ['Svādhyāya', 'स्वाध्याय', 'self-study'],
    dharana: ['Dhāraṇā', 'धारणा', 'single-pointed focus'], dhyana: ['Dhyāna', 'ध्यान', 'sustained attention'], smarana: ['Smaraṇa', 'स्मरण', 'recollection'], japa: ['Japa', 'जप', 'calm repetition']
  };
  // "Smarana (स्मरण): recollection", as HTML; the Devanagari is marked as Sanskrit for screen readers
  function sans(key, opts) {
    var x = SANS[key]; if (!x) return '';
    opts = opts || {};
    return '<span class="sans">' + esc(x[0]) + ' <span lang="sa">(' + x[1] + ')</span>' + (opts.meaning === false ? '' : '<span class="sans-m">: ' + esc(x[2]) + '</span>') + '</span>';
  }

  /* ---------- AI help: copy a prompt for any AI app, or ask Gemini (signed in, switched on, a few replies a day) ---------- */
  var AIC = function () { return window.AIM_AI || {}; };
  var TUTOR = 'You are a patient tutor for an Indian beginner who is learning AI and machine learning on a free course site. Reply in simple English (no Hindi), with short sentences. Explain any technical word in brackets the first time. Use everyday Indian examples when they help. Be kind and honest: say clearly when something is wrong. Keep the reply under 200 words unless the request says otherwise.\n\n';
  function aiOn() { var K = window.AIM_CLOUD, c = AIC(); return !!(c.enabled && K && K.enabled() && K.status().user); }
  function aiOffered() { var K = window.AIM_CLOUD; return !!(AIC().enabled && K && K.enabled()); }
  function aiLeft() { var cap = Math.max(1, Math.floor(AIC().dailyPerPerson || 10)), u = S().ai || {}; return u.day === today() ? Math.max(0, cap - (u.n || 0)) : cap; }
  var aiModel = null;
  function aiLoad() {
    if (aiModel) return aiModel;
    var K = window.AIM_CLOUD, a = K && K.app && K.app(), c = AIC();
    if (!a) return Promise.reject(new Error('Sign in first to use AI help.'));
    aiModel = Promise.all([import(K.SDK + 'firebase-ai.js'), c.appCheckSiteKey ? import(K.SDK + 'firebase-app-check.js') : Promise.resolve(null)]).then(function (mods) {
      var ai = mods[0], ac = mods[1];
      if (ac && c.appCheckSiteKey) { try { ac.initializeAppCheck(a, { provider: new ac.ReCaptchaV3Provider(c.appCheckSiteKey), isTokenAutoRefreshEnabled: true }); } catch (e) {} }
      var inst = ai.getAI(a, { backend: new ai.GoogleAIBackend() });
      return ai.getGenerativeModel(inst, { model: c.model || 'gemini-2.5-flash-lite', generationConfig: { maxOutputTokens: 800, temperature: 0.4 } });
    }, function (e) { aiModel = null; throw e; });
    return aiModel;
  }
  function askAI(prompt) {
    if (!aiOn()) return Promise.reject(new Error('Sign in to ask Gemini. You can always use Copy prompt with any AI app.'));
    if (aiLeft() <= 0) return Promise.reject(new Error('You have used today\'s Gemini replies. Use Copy prompt with any AI app, or come back tomorrow.'));
    var st = S(), t = today();
    st.ai = st.ai && st.ai.day === t ? st.ai : { day: t, n: 0 }; st.ai.n++; C.save();
    return aiLoad().then(function (m) { return m.generateContent(TUTOR + prompt); }).then(function (r) {
      var text = r && r.response && typeof r.response.text === 'function' ? r.response.text() : '';
      if (!text) throw new Error('Gemini sent an empty reply. Try again in a minute.');
      return text;
    }).catch(function (e) {
      var msg = String((e && (e.code || e.message)) || e);
      if (/quota|429|resource[-_ ]exhausted/i.test(msg)) throw new Error('The site\'s free AI quota for today is used up. Use Copy prompt with any AI app instead.');
      if (/app[-_ ]?check|permission|403/i.test(msg)) throw new Error('AI help is not set up correctly on this site yet. Use Copy prompt with any AI app instead.');
      if (/network|fetch|offline/i.test(msg)) throw new Error('No connection. Check your internet and try again.');
      throw e instanceof Error ? e : new Error(msg);
    });
  }
  function copyText(text) {
    var done = function () { C.toast('Prompt copied. Paste it into ChatGPT, Gemini, Claude or any AI app.'); };
    try { if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); }); } catch (e) {}
    fallbackCopy(text, done);
    return Promise.resolve();
  }
  function fallbackCopy(text, done) {
    var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
    ta.remove();
    if (ok) done(); else C.toast('Could not copy. Select the text and copy it yourself.');
  }
  // two buttons and an answer area; getPrompt() returns the prompt text (or '' to do nothing)
  function aiHTML(id, label) {
    var left = aiLeft();
    return '<div class="ai-box stack-sm" data-ai="' + esc(id) + '"><div class="row">' +
      '<button type="button" class="btn btn-sm" data-ai-copy>Copy prompt for your AI app</button>' +
      (aiOn() ? '<button type="button" class="btn btn-sm btn-primary" data-ai-ask' + (left ? '' : ' disabled') + '>' + esc(label || 'Ask Gemini') + ' <span class="small">(' + left + ' left today)</span></button>'
        : aiOffered() ? '<span class="small muted"><a href="#account">Sign in</a> to ask Gemini here.</span>' : '') +
      '</div><div class="ai-out stack-sm" aria-live="polite" hidden></div></div>';
  }
  function bindAI(root, id, getPrompt) {
    var box = root.querySelector('[data-ai="' + id + '"]'); if (!box) return;
    var out = box.querySelector('.ai-out'), ask = box.querySelector('[data-ai-ask]'), cp = box.querySelector('[data-ai-copy]');
    if (cp) cp.addEventListener('click', function () { var p = getPrompt(); if (p) copyText(TUTOR + p); });
    if (ask) ask.addEventListener('click', function () {
      var p = getPrompt(); if (!p) return;
      ask.disabled = true; out.hidden = false; out.innerHTML = '<p class="muted">Gemini is thinking…</p>';
      askAI(p).then(function (text) {
        out.innerHTML = '<div class="ai-reply">' + C.md(text) + '</div><p class="small muted">AI can be wrong. Check its answer against the lesson.</p>';
      }, function (e) {
        out.innerHTML = '<p class="small pub-bad" role="alert">' + esc(e.message) + '</p>';
      }).then(function () {
        var left = aiLeft(); ask.disabled = !left;
        var sm = ask.querySelector('.small'); if (sm) sm.textContent = '(' + left + ' left today)';
      });
    });
  }

  /* ---------- Study room (#study) ---------- */
  function viewHub() {
    var A = app();
    A.setView('<div class="wrap stack-lg">' + A.crumbs([['Home', 'home'], ['Study room']]) +
      '<header class="stack-sm"><h1>Study room</h1><p class="lede muted prose">Tools that use proven learning methods: recall instead of rereading, spaced review, mixed practice, reflection and focused sessions, with the Vedic practices of ' + sans('smarana', { meaning: false }) + ', ' + sans('manana', { meaning: false }) + ' and ' + sans('dharana', { meaning: false }) + ' alongside them.</p>' +
      '<div class="row"><a class="btn" href="#methods">How to learn: the 40 methods</a></div></header>' +
      '<div class="grid study-hub" id="study-hub">' + hubCards.map(function (c) { try { return c.fn() || ''; } catch (e) { return ''; } }).join('') + '</div></div>', 'Study room');
    emit('hub', A.main);
  }
  addRoute('study', viewHub, 'study');
  // every answer in a module quiz or level test is remembered (Mistakes notebook, Knowledge map, Mixed practice)
  on('answer', function (r) { if (r && r.q && r.q.id) recordAnswer(r.q.id, !!r.correct, r.sure || 0, r.mode === 'test' ? 'test' : 'quiz', r.picked); });

  // Released to everyone when LIVE is true; until then it shows only in a browser that opted in
  // (open the site once with ?study=1, or set localStorage 'aimarg.study' to '1'; ?study=0 turns it off again).
  var LIVE = false;
  var on_ = LIVE;
  try {
    if (/[?&]study=1\b/.test(location.search)) localStorage.setItem('aimarg.study', '1');
    if (/[?&]study=0\b/.test(location.search)) localStorage.removeItem('aimarg.study');
    on_ = on_ || localStorage.getItem('aimarg.study') === '1';
  } catch (e) {}
  if (!on_) return;
  // the Study link in the main menu, after Practice
  (function () {
    var nav = document.getElementById('site-nav'); if (!nav || nav.querySelector('a[href="#study"]')) return;
    var a = document.createElement('a'); a.href = '#study'; a.textContent = 'Study';
    var after = nav.querySelector('a[href="#practice"]');
    if (after && after.nextSibling) nav.insertBefore(a, after.nextSibling); else nav.appendChild(a);
  })();
  window.AIM_STUDY = {
    // content
    ensureData: ensureData, modData: modData, guide: guide, qtag: qtag, question: question, questionSet: questionSet,
    // time
    now: now, today: today, addDays: addDays, daysBetween: daysBetween,
    // review
    reviewItem: reviewItem, enroll: enroll, unenroll: unenroll, moduleReviewIds: moduleReviewIds, schedule: schedule, dueIds: dueIds, recallChance: recallChance, retention: retention,
    // answers
    recordAnswer: recordAnswer, isMistake: isMistake,
    // plumbing
    on: on, emit: emit, addRoute: addRoute, route: route, setReflect: setReflect, renderReflect: renderReflect, addHubCard: addHubCard,
    // UI
    sans: sans, SANS: SANS, aiOn: aiOn, aiOffered: aiOffered, aiLeft: aiLeft, askAI: askAI, aiHTML: aiHTML, bindAI: bindAI, copyText: copyText
  };
})();
