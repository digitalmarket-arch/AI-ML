/* AI Marg study features: learning methods built into the site.
   This file is the shared base. It holds:
   - study content, loaded on demand in small pieces: data/study/index.js (topics and quiz tags of every module),
     data/study/<moduleId>.js (one module's recall questions, Feynman checklist, Manana questions...), data/study/guide.js;
   - the learner's study progress, registered with core.js so it is saved, synced and merged like the rest;
   - the review scheduler (adaptive spaced repetition) and a simple memory model for retention;
   - the AI helper: "Copy prompt" for any AI app, and "Ask Gemini" for signed-in learners when switched on;
   - which modules a learner has started, small UI helpers, the Sanskrit method names and the Study room page (#study);
   - loading the feature scripts (assets/js/study-*.js) only when a page needs them.
   Feature scripts add pages and extras with AIM_STUDY.addRoute, on, setReflect and addHubCard.
   Plain script (no build step); exposes window.AIM_STUDY. */
(function () {
  'use strict';
  var C = window.AIM_CORE, D = window.AIM || {};
  var esc = C.esc;
  var app = function () { return window.AIM_APP; };
  var S = function () { return C.state; };

  /* ---------- loading scripts on demand ---------- */
  var loaded = {};
  function loadScript(url, attrs) {
    if (loaded[url]) return loaded[url];
    loaded[url] = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = url; s.async = true;
      Object.keys(attrs || {}).forEach(function (k) { s.setAttribute(k, attrs[k]); });
      s.onload = function () { resolve(); };
      s.onerror = function () { delete loaded[url]; s.remove(); reject(new Error('Part of the study tools did not load. Check your connection and try again.')); };
      document.head.appendChild(s);
    });
    return loaded[url];
  }

  /* ---------- study content ---------- */
  // index: every module's topics, quiz tags and number of Feynman key ideas (small; needed across modules)
  function ensureData() {
    if (D.study && D.study.modules) return Promise.resolve(D.study);
    return loadScript('data/study/index.js').then(function () { if (!D.study || !D.study.modules) throw new Error('Study content is missing.'); return D.study; });
  }
  // one module's full content (cards, feynman, socratic, nididhyasana, sravana)
  function ensureModule(mid) {
    return ensureData().then(function (st) {
      var md = st.modules[mid];
      if (!md) return null;
      if (md.cards) return md;
      return loadScript('data/study/' + mid + '.js').then(function () { return st.modules[mid].cards ? st.modules[mid] : null; });
    });
  }
  function ensureModules(mids) {
    var seen = {};
    return Promise.all((mids || []).filter(function (m) { if (seen[m]) return false; seen[m] = 1; return true; }).map(function (m) { return ensureModule(m).catch(function () { return null; }); }));
  }
  function ensureGuide() {
    return ensureData().then(function (st) { return st.guide || loadScript('data/study/guide.js').then(function () { return st.guide || null; }); });
  }
  function modIndex(mid) { return D.study && D.study.modules ? D.study.modules[mid] || null : null; }
  function modData(mid) { var m = modIndex(mid); return m && m.cards ? m : null; } // full content, once ensureModule(mid) has loaded it
  function guide() { return D.study ? D.study.guide || null : null; }
  // quiz question id -> { mid, topic, skill } (from each module's quizTags)
  var tagIndex = null;
  function qtag(qid) {
    if (!D.study || !D.study.modules) return null;
    if (!tagIndex) {
      tagIndex = {};
      Object.keys(D.study.modules).forEach(function (mid) {
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
  function localDay(isoTime) { var d = new Date(isoTime); return isNaN(d) ? '' : ymd(d); }

  // this browser's id: counters that can grow on two devices (reviews, answers, AI replies) are kept per device and added up
  var DEV = (function () {
    var id = '';
    try { id = localStorage.getItem('aimarg.dev') || ''; if (!/^[a-z0-9]{6,12}$/.test(id)) { id = Math.random().toString(36).slice(2, 10) || 'dev'; localStorage.setItem('aimarg.dev', id); } } catch (e) { id = 'dev'; }
    return id;
  })();

  /* ---------- study progress (parts of the saved state) ---------- */
  var isObj = function (o) { return !!o && typeof o === 'object' && !Array.isArray(o); };
  var BAD = /^(__proto__|constructor|prototype)$/;
  var own = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };
  var str = function (v, n) { return typeof v === 'string' ? v.slice(0, n) : ''; };
  var num = function (v, lo, hi, dflt) { v = Number(v); return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : dflt; };
  var day = function (v) { return /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? String(v) : ''; };
  var iso = function (v) { return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T[\d:.]+Z?$/.test(v) ? v.slice(0, 30) : ''; };
  var later = function (a, b) { return String(b || '') > String(a || '') ? b : a; };
  var earlier = function (a, b) { return !a ? (b || '') : !b ? a : String(b) < String(a) ? b : a; }; // the earlier of two times; '' when neither is set
  function cleanMap(o, fn) {
    var out = {};
    if (!isObj(o)) return out;
    Object.keys(o).forEach(function (k) { if (BAD.test(k) || k.length > 160) return; var v = fn(o[k], k); if (v !== undefined) out[k] = v; });
    return out;
  }
  // keep, for every key, the entry changed last (field 'at'); on a tie keep this device's. An entry with no 'at' never beats one with it.
  function mergeNewer(a, b) {
    var out = {};
    Object.keys(a || {}).forEach(function (k) { if (!BAD.test(k)) out[k] = a[k]; });
    Object.keys(b || {}).forEach(function (k) {
      if (BAD.test(k)) return;
      if (!own(out, k) || String((b[k] && b[k].at) || '') > String((out[k] && out[k].at) || '')) out[k] = b[k];
    });
    return out;
  }
  // per-device counters {device: [numbers]}: each device's own numbers only grow (or carry a time), so the larger wins
  function mergeDev(a, b) {
    var out = {};
    [a, b].forEach(function (o) { Object.keys(o || {}).forEach(function (k) { if (BAD.test(k)) return; var x = out[k], y = o[k]; out[k] = !x || String(y[2] || '') > String(x[2] || '') || (String(y[2] || '') === String(x[2] || '') && y[0] > x[0]) ? y : x; }); });
    return out;
  }
  function devSum(o, i) { return Object.keys(o || {}).reduce(function (s, k) { return s + (Number(o[k][i]) || 0); }, 0); }
  function cleanDev(o, width) {
    return cleanMap(o, function (v) { if (!Array.isArray(v)) return undefined; var r = []; for (var i = 0; i < width; i++) r.push(Math.floor(num(v[i], 0, 1e6, 0))); if (v[width]) r.push(iso(v[width])); return r; });
  }
  var OLD_TOMB = 90; // days after which a deletion marker is forgotten
  function freshTomb(v) { return !v.del || !v.at || daysBetween(localDay(v.at) || today(), today()) <= OLD_TOMB; }
  var PARTS = {
    // review cards: s = stability in days (recall about 90% after s days), d = difficulty 1-10, due = next review day,
    // first = day of the first successful recall, lg = last grade (1 Again ... 4 Easy). A card added but never reviewed has no 'at',
    // so any real review or removal from another device wins over it.
    srs: {
      normalize: function (o) {
        return cleanMap(o, function (v) {
          if (!isObj(v)) return undefined;
          return { s: num(v.s, 0, 3650, 0), d: num(v.d, 1, 10, 5), due: day(v.due) || today(), last: day(v.last), first: day(v.first), fr: day(v.fr), lg: Math.floor(num(v.lg, 0, 4, 0)),
            reps: Math.floor(num(v.reps, 0, 1e5, 0)), lapses: Math.floor(num(v.lapses, 0, 1e5, 0)), off: !!v.off, at: iso(v.at) };
        });
      },
      merge: mergeNewer
    },
    // review log: day -> {device: [cards reviewed, remembered, time]}; totals are the sum over devices
    rlog: {
      normalize: function (o) {
        var m = cleanMap(o, function (v, k) {
          if (!day(k)) return undefined;
          if (Array.isArray(v)) return { legacy: [Math.floor(num(v[0], 0, 1e5, 0)), Math.floor(num(v[1], 0, 1e5, 0))] }; // older copies: one pair per day
          var d = cleanDev(v, 2); return Object.keys(d).length ? d : undefined;
        });
        var ks = Object.keys(m).sort(); if (ks.length > 500) ks.slice(0, ks.length - 500).forEach(function (k) { delete m[k]; });
        return m;
      },
      merge: function (a, b) {
        var out = {};
        Object.keys(a || {}).concat(Object.keys(b || {})).forEach(function (k) { if (!BAD.test(k) && !own(out, k)) out[k] = mergeDev((a || {})[k], (b || {})[k]); });
        return out;
      }
    },
    // every quiz question answered. c = tries and right answers per device; n and r are their totals.
    // lr last result, p option picked last (-1 unknown), su how sure (0 not asked, 1-3), wrongAt last wrong (time),
    // fix = times answered right since then (a mistake is fixed by two of them on different days, 12+ hours apart).
    // f1 = when it was first answered right ('' when unknown: right answers saved before f1 existed stay undated).
    qa: {
      normalize: function (o) {
        return cleanMap(o, function (v) {
          if (!isObj(v)) return undefined;
          var c = cleanDev(v.c, 2);
          if (!Object.keys(c).length && (v.n || v.r)) { var n0 = Math.floor(num(v.n, 0, 1e5, 0)); c = { legacy: [n0, Math.floor(num(v.r, 0, n0, 0))] }; }
          var wrongAt = iso(v.wrongAt);
          var fix = (Array.isArray(v.fix) ? v.fix : []).map(function (x) { return iso(x) || (day(x) ? x + 'T12:00:00.000Z' : ''); }).filter(function (x) { return x && (!wrongAt || x > wrongAt); });
          return { c: c, n: devSum(c, 0), r: Math.min(devSum(c, 1), devSum(c, 0)), lr: v.lr ? 1 : 0, p: Math.floor(num(v.p, -1, 9, -1)), su: Math.floor(num(v.su, 0, 3, 0)),
            at: iso(v.at), wrongAt: wrongAt, fix: fix.sort().slice(-6), ok: (Array.isArray(v.ok) ? v.ok : []).map(iso).filter(Boolean).sort().slice(-6), src: str(v.src, 12), f1: iso(v.f1) };
        });
      },
      merge: function (a, b) {
        var out = {};
        Object.keys(a || {}).concat(Object.keys(b || {})).forEach(function (k) {
          if (BAD.test(k) || own(out, k)) return;
          var x = (a || {})[k], y = (b || {})[k];
          if (!x || !y) { out[k] = x || y; return; }
          var nw = String(y.at || '') > String(x.at || '') ? y : x, c = mergeDev(x.c, y.c), wrongAt = later(x.wrongAt, y.wrongAt);
          var fix = (x.fix || []).concat(y.fix || []).filter(function (t, i, arr) { return arr.indexOf(t) === i && (!wrongAt || t > wrongAt); }).sort().slice(-6);
          var okT = (x.ok || []).concat(y.ok || []).filter(function (t, i, arr) { return arr.indexOf(t) === i; }).sort().slice(-6);
          out[k] = { c: c, n: devSum(c, 0), r: Math.min(devSum(c, 1), devSum(c, 0)), lr: nw.lr, p: nw.p, su: nw.su, at: nw.at, wrongAt: wrongAt, fix: fix, ok: okT, src: nw.src, f1: earlier(x.f1, y.f1) };
        });
        return out;
      }
    },
    // module reflections, merged field by field: the Feynman text (fAt), each Manana answer (sAt[i]), the best Japa round, the Nididhyasana day
    refl: {
      normalize: function (o) {
        return cleanMap(o, function (v) {
          if (!isObj(v)) return undefined;
          var at = iso(v.at), soc = (Array.isArray(v.soc) ? v.soc : []).slice(0, 5).map(function (x) { return str(x, 1500); });
          var sAt = (Array.isArray(v.sAt) ? v.sAt : []).slice(0, 5).map(iso);
          while (sAt.length < soc.length) sAt.push(soc[sAt.length] ? at : '');
          return { feyn: str(v.feyn, 3000), ideas: Math.floor(num(v.ideas, 0, 10, 0)), fAt: iso(v.fAt) || (v.feyn ? at : ''), soc: soc, sAt: sAt,
            japa: Math.floor(num(v.japa, 0, 1000, 0)), nid: day(v.nid), nAt: iso(v.nAt) || (v.nid ? at : ''), at: at };
        });
      },
      merge: function (a, b) {
        var out = {};
        Object.keys(a || {}).concat(Object.keys(b || {})).forEach(function (k) {
          if (BAD.test(k) || own(out, k)) return;
          var x = (a || {})[k], y = (b || {})[k];
          if (!x || !y) { out[k] = x || y; return; }
          var f = String(y.fAt || '') > String(x.fAt || '') ? y : x, soc = [], sAt = [];
          for (var i = 0; i < Math.max((x.soc || []).length, (y.soc || []).length); i++) {
            var takeY = String((y.sAt || [])[i] || '') > String((x.sAt || [])[i] || '');
            soc.push(((takeY ? y : x).soc || [])[i] || ''); sAt.push(((takeY ? y : x).sAt || [])[i] || '');
          }
          var nd = String(y.nAt || '') > String(x.nAt || '') ? y : x;
          out[k] = { feyn: f.feyn, ideas: f.ideas, fAt: f.fAt, soc: soc, sAt: sAt, japa: Math.max(x.japa || 0, y.japa || 0), nid: nd.nid, nAt: nd.nAt, at: later(x.at, y.at) };
        });
        return out;
      }
    },
    // three-line summaries written after a video (Sravana), keyed 'moduleId|resourceId'
    sum: {
      normalize: function (o) { return cleanMap(o, function (v) { return isObj(v) && typeof v.t === 'string' ? { t: str(v.t, 800), at: iso(v.at) } : undefined; }); },
      merge: mergeNewer
    },
    // journal entries (Svadhyaya); a deleted entry keeps a marker (del) for 90 days so the deletion reaches other devices
    jr: {
      normalize: function (o) {
        return cleanMap(o, function (v) {
          if (!isObj(v)) return undefined;
          var e = { at: iso(v.at) || now(), learnt: str(v.learnt, 1500), confused: str(v.confused, 1500), next: str(v.next, 800), meth: str(v.meth, 200), conf: Math.floor(num(v.conf, 0, 5, 0)), mod: str(v.mod, 60), mins: Math.floor(num(v.mins, 0, 600, 0)), del: !!v.del };
          if (e.del) { e.learnt = e.confused = e.next = e.meth = ''; }
          return freshTomb(e) ? e : undefined;
        });
      },
      merge: mergeNewer
    },
    // focus sessions (Dharana); deletions keep a marker like the journal
    fs: {
      normalize: function (o) {
        return cleanMap(o, function (v) {
          if (!isObj(v)) return undefined;
          var e = { at: iso(v.at) || now(), mins: Math.floor(num(v.mins, 0, 600, 0)), plan: Math.floor(num(v.plan, 0, 600, 0)), done: !!v.done, intent: v.del ? '' : str(v.intent, 300), mod: str(v.mod, 60), del: !!v.del };
          return freshTomb(e) ? e : undefined;
        });
      },
      merge: mergeNewer
    },
    // Gemini replies used today, per device (added up across this person's devices)
    ai: {
      normalize: function (o) {
        if (!isObj(o) || !day(o.day)) return { day: '', d: {} };
        var d = cleanDev(o.d, 1);
        if (!Object.keys(d).length && o.n) d = { legacy: [Math.floor(num(o.n, 0, 1000, 0))] };
        return { day: o.day, d: d };
      },
      merge: function (a, b) {
        a = a || { day: '', d: {} }; b = b || { day: '', d: {} };
        if (a.day === b.day) return { day: a.day, d: mergeDev(a.d, b.d) };
        return a.day > b.day ? a : b;
      }
    },
    // Play mode (assets/js/game.js), registered here so every page merges it, even one that never opens Play.
    // first = first visit; goal = daily XP goal (20, 30 or 50) and goalAt = when it was chosen; rank = the highest rank
    // celebrated; goalDay = the last day the goal moment showed; badges[id] = when earned; e[fact] = the day a fact
    // was first recorded ('0000-00-00' when undated). Every rule gives the same result in either order.
    play: {
      normalize: function (o) {
        o = isObj(o) ? o : {};
        var out = {}, b = {}, e = {}, nb = 0, ne = 0;
        Object.keys(o).forEach(function (k) { if (!BAD.test(k)) out[k] = o[k]; }); // fields from a newer version stay
        if (isObj(o.badges)) Object.keys(o.badges).forEach(function (k) { var t = iso(o.badges[k]); if (t && nb < 100 && !BAD.test(k) && /^[a-z0-9-]{2,24}$/.test(k)) { b[k] = t; nb++; } });
        if (isObj(o.e)) Object.keys(o.e).forEach(function (k) { var d = day(o.e[k]); if (d && ne < 3000 && !BAD.test(k) && /^[a-z]{1,3}:[\w.\/:|~-]{1,120}$/.test(k)) { e[k] = d; ne++; } });
        out.first = iso(o.first);
        out.goal = [20, 30, 50].indexOf(Number(o.goal)) >= 0 ? Number(o.goal) : 30;
        out.goalAt = iso(o.goalAt);
        out.rank = Math.floor(num(o.rank, 0, 9, 0));
        out.goalDay = day(o.goalDay);
        out.badges = b; out.e = e;
        return out;
      },
      merge: function (a, b) {
        a = a || {}; b = b || {};
        var early = function (x, y) { return !x ? (y || '') : !y ? x : (String(y) < String(x) ? y : x); };
        var out = {}, badges = {}, e = {};
        [b, a].forEach(function (o) { Object.keys(o).forEach(function (k) { if (!BAD.test(k)) out[k] = o[k]; }); }); // unknown fields: this copy first
        [a.badges, b.badges].forEach(function (m) { Object.keys(m || {}).forEach(function (k) { if (!BAD.test(k)) badges[k] = early(badges[k], m[k]); }); });
        [a.e, b.e].forEach(function (m) { Object.keys(m || {}).forEach(function (k) { if (!BAD.test(k)) e[k] = early(e[k], m[k]); }); });
        var ga = String(a.goalAt || ''), gb = String(b.goalAt || '');
        var g = gb > ga ? b : ga > gb ? a : (Number(b.goal) > Number(a.goal) ? b : a); // newer change wins; a tie is decided by value, so the order never matters
        out.first = early(a.first, b.first);
        out.goal = g.goal; out.goalAt = g.goalAt || '';
        out.rank = Math.max(Number(a.rank) || 0, Number(b.rank) || 0);
        out.goalDay = later(a.goalDay, b.goalDay) || '';
        out.badges = badges; out.e = e;
        return out;
      }
    },
    // Watch mode (assets/js/watch.js), registered here like the play part, so every page merges it, even one that never
    // opens Watch mode. v[video id] = when it was marked watched, u[video id] = when it was un-marked: the later of the
    // two wins, as with core.js watched / unwatched (on the same time the mark wins). cur = where the learner is:
    // { v: video id, s: seconds, t: when (ms), c: the parts of that video really played, as [from, to) seconds }, or
    // null; the later t wins. On a course on another site, cur.x = '<module id>|<resource id>' (v is then a video next to
    // it). p[video id] = { s, t, c }: where the learner left the other videos they played (moved away from, finished or
    // un-marked), so coming back to one starts there and its parts played still add up; per video the later t wins, and
    // only the newest WATCH_PLACES are kept. The cur that loses a merge is kept with the places (as watch.js keeps the
    // place it replaces when the learner moves on), unless it is the winner itself or a course card. Fields from a
    // newer version are kept. Every rule gives the same result in either order, and in any grouping of three copies.
    watch: {
      normalize: function (o) {
        o = isObj(o) ? o : {};
        var out = {}, v = {}, u = {};
        Object.keys(o).forEach(function (k) { if (!BAD.test(k) && !WATCH_OWN.test(k)) out[k] = o[k]; });
        if (isObj(o.v)) Object.keys(o.v).forEach(function (id) { var t = wStamp(o.v[id]); if (t && wId(id)) v[id] = t; });
        if (isObj(o.u)) Object.keys(o.u).forEach(function (id) {
          var t = wStamp(o.u[id]);
          if (!t || !wId(id) || (own(v, id) && !(t > v[id]))) return;
          delete v[id]; u[id] = t;
        });
        out.v = v; out.u = u; out.cur = wCur(o.cur); out.p = wPlaces(o.p);
        return out;
      },
      merge: function (a, b) {
        a = isObj(a) ? a : {}; b = isObj(b) ? b : {};
        var out = {}, v = {}, u = {}, m = function (o, k) { return isObj(o[k]) ? o[k] : {}; };
        var av = m(a, 'v'), bv = m(b, 'v'), au = m(a, 'u'), bu = m(b, 'u'), ids = {};
        // a newer version's fields: from either copy; when both have one, the same value whichever copy comes first
        [a, b].forEach(function (o) {
          Object.keys(o).forEach(function (k) {
            if (BAD.test(k) || WATCH_OWN.test(k)) return;
            if (!own(out, k) || String(JSON.stringify(o[k])) > String(JSON.stringify(out[k]))) out[k] = o[k];
          });
        });
        [av, bv, au, bu].forEach(function (o) { Object.keys(o).forEach(function (id) { if (!BAD.test(id)) ids[id] = 1; }); });
        Object.keys(ids).forEach(function (id) {
          var on = later(av[id], bv[id]), off = later(au[id], bu[id]);
          if (on && !(String(off || '') > String(on))) v[id] = on; else if (off) u[id] = off;
        });
        out.v = v; out.u = u;
        var x = wCur(a.cur), y = wCur(b.cur), key = function (c) { return c.v + ' ' + c.s + ' ' + JSON.stringify(c.c || []) + ' ' + (c.x || ''); };
        out.cur = !x || !y ? x || y : y.t !== x.t ? (y.t > x.t ? y : x) : key(y) > key(x) ? y : x; // on the same time, the same pick in either order
        // the kept places: per video the later t wins (on the same time, the same pick either way)
        var pa = wPlaces(a.p), pb = wPlaces(b.p), p = {}, pk = function (c) { return c.s + ' ' + JSON.stringify(c.c || []); };
        var newer = function (e, f) { return !e || !f ? e || f : f.t !== e.t ? (f.t > e.t ? f : e) : pk(f) > pk(e) ? f : e; };
        Object.keys(pa).concat(Object.keys(pb)).forEach(function (id) { p[id] = newer(pa[id], pb[id]); });
        // the place that loses (an older cur, say in a video the other device then moved away from) is kept with the
        // places, as watch.js setCur does when the learner moves on: its parts played still count, and an un-mark's
        // place without parts still beats an older one with parts. Any loser that is not the winner itself is kept
        // (keeping only one of another video would give a different result in another grouping of three copies); a
        // course card is not (its v is only the video next to it, at 0:00)
        var lo = x && y ? (out.cur === x ? y : x) : null;
        if (lo && !lo.x && (lo.t !== out.cur.t || key(lo) !== key(out.cur))) p[lo.v] = newer(p[lo.v], wPlace(lo));
        out.p = wCap(p);
        return out;
      }
    }
  };
  // the watch part's helpers: a YouTube video id (11 letters, digits, - or _), a tick's time (an ISO time; older copies
  // may hold a day), a place { s, t, c } (null when it is not a good one), where the learner is (cur: a place of a
  // video, and x on a course on another site), and the kept places (p: at most WATCH_PLACES, the newest; watch.js
  // PLACES is the same number. A finished video takes a place too, so it is large: 200 places are about 10 KB)
  var WATCH_OWN = /^(?:v|u|cur|p)$/, WATCH_X = /^[A-Za-z0-9_-]{1,80}\|[A-Za-z0-9_.-]{1,120}$/, WATCH_PLACES = 200;
  function wId(id) { return /^[A-Za-z0-9_-]{11}$/.test(id) && !BAD.test(id); }
  function wStamp(t) { return typeof t === 'string' && t.length <= 40 && /^\d{4}-\d{2}-\d{2}/.test(t) ? t : ''; }
  function wPlace(c) {
    if (!isObj(c)) return null;
    var t = Number(c.t), s = Number(c.s);
    // (t below 1 is refused before it is rounded down: kept as 0, the next normalize would drop it)
    if (!isFinite(t) || t < 1 || !isFinite(s) || s < 0) return null;
    var out = { s: Math.floor(Math.min(s, 1e6)), t: Math.floor(Math.min(t, 864e13)) }, sp = C.spans ? C.spans(c.c, 100) : [];
    if (sp.length) out.c = sp;
    return out;
  }
  function wCur(c) {
    var pl = isObj(c) && wId(String(c.v)) ? wPlace(c) : null;
    if (!pl) return null;
    var out = { v: String(c.v), s: pl.s, t: pl.t };
    if (pl.c) out.c = pl.c;
    if (typeof c.x === 'string' && WATCH_X.test(c.x)) out.x = c.x;
    return out;
  }
  function wPlaces(o) {
    var out = {};
    if (isObj(o)) Object.keys(o).forEach(function (id) { var pl = wId(id) ? wPlace(o[id]) : null; if (pl) out[id] = pl; });
    return wCap(out);
  }
  // the newest WATCH_PLACES places (on the same time, the smaller video id first), so every copy keeps the same ones
  function wCap(o) {
    var ks = Object.keys(o), out = {};
    if (ks.length <= WATCH_PLACES) return o;
    ks.sort(function (a, b) { return o[b].t - o[a].t || (a < b ? -1 : a > b ? 1 : 0); });
    ks.slice(0, WATCH_PLACES).forEach(function (k) { out[k] = o[k]; });
    return out;
  }
  Object.keys(PARTS).forEach(function (k) { C.registerPart(k, PARTS[k]); });
  // A second copy of the Watch mode part, under its own key, which pages from before Watch mode never write. Why: such
  // a page (a tab left open from before the site was updated) does not know the watch part, so it keeps the first copy
  // of it that it ever read, and writes that old copy back with every save (and to the account copy when signed in),
  // over newer Watch progress made in another tab. So every save here also writes the part to WATCH_COPY, and a page
  // that loads merges it back in (the newer of each mark and place wins, as always). The copy also keeps core.js's
  // reset and restore signal ('aimarg.sync', which older pages write too) as it was when the copy was written, as
  // game.js does for the play part. After a Reset all progress, a sign-out that removes the progress from this device,
  // or a Restore from file, in any tab, the signal is another one: the copy is then never merged again, and it is
  // removed (it can hold the progress of someone who has left this device). It is left out too when the saved
  // progress has no watch part at all. This runs while the page loads, before cloud.js's first sync (after the page's
  // load event). The copy cannot tell whose progress it holds, so an older page's own Reset or Restore (signed in,
  // after that page's sync wrote its old part to the account) can lose Watch progress made in newer tabs since it
  // opened: a rare case, accepted (README says so).
  var WATCH_COPY = 'aimarg.watch.part';
  (function () {
    var ls = function () { return window.localStorage; }, main = null, copy = null, sig = null;
    try { main = JSON.parse(ls().getItem('aimarg.progress.v1') || 'null'); copy = JSON.parse(ls().getItem(WATCH_COPY) || 'null'); sig = ls().getItem('aimarg.sync'); } catch (e) {}
    var fresh = isObj(copy) && copy.sync === sig; // written after the last reset or restore
    if (fresh && isObj(main) && own(main, 'watch')) C.state.watch = PARTS.watch.merge(C.state.watch, PARTS.watch.normalize(copy.watch));
    else if (copy !== null && !fresh) { try { ls().removeItem(WATCH_COPY); } catch (e) {} } // from before a reset or restore, or damaged
    C.onSave(function (s) {
      try { if (isObj(s.watch)) ls().setItem(WATCH_COPY, JSON.stringify({ sync: ls().getItem('aimarg.sync'), watch: s.watch })); else ls().removeItem(WATCH_COPY); } catch (e) {}
    });
  })();

  /* ---------- review log helpers ---------- */
  function reviewLog(d) { var e = S().rlog[d] || {}; return [devSum(e, 0), devSum(e, 1)]; } // [reviewed, remembered] on day d, all devices
  function logReview(dn, dok, d) {
    var st = S(), t = d || today(), e = st.rlog[t] = st.rlog[t] || {}, mine = e[DEV] || [0, 0];
    e[DEV] = [Math.max(0, (mine[0] || 0) + dn), Math.max(0, (mine[1] || 0) + dok), now()];
  }

  /* ---------- review cards and the scheduler ---------- */
  // card ids: 'kt:<moduleId>:<i>' (key term i of the module), 'rc:<moduleId>:<cardKey>' (recall question of a lesson card; needs ensureModule)
  function reviewItem(id) {
    var p = String(id).split(':'), m = app() && app().modById[p[1]];
    if (!m) return null;
    if (p[0] === 'kt') {
      var t = (m.keyTerms || [])[Number(p[2])]; if (!t) return null;
      // the back also gives the everyday comparison, an example and the Hindi word, when the lesson card has them
      var back = t.meaning + (t.like ? '\n\n**Think of it like:** ' + t.like : '') + (t.example ? '\n\n**Example:** ' + t.example : '') + (t.hi ? '\n\n**In Hindi:** ' + t.hi : '');
      return { id: id, kind: 'term', mid: m.id, front: t.term, back: back, ask: 'What does this term mean?' };
    }
    if (p[0] === 'rc') {
      var md = modData(m.id), c = md && md.cards && md.cards[p[2]]; if (!c) return null;
      return { id: id, kind: 'recall', mid: m.id, card: p[2], front: c.recall, back: c.answer, ask: 'Answer from memory, then check.' };
    }
    return null;
  }
  // add cards to Daily review. A card that was removed comes back (with a fresh time, so the return reaches other devices);
  // a brand-new card carries no time, so it never overwrites review history from another device.
  function enroll(ids) {
    var st = S(), n = 0, t = today();
    (ids || []).forEach(function (id) {
      var c = st.srs[id];
      if (c && !c.off) return;
      st.srs[id] = c ? { s: c.s, d: c.d, due: t, last: c.last, first: c.first, fr: c.fr, lg: c.lg, reps: c.reps, lapses: c.lapses, off: false, at: now() }
        : { s: 0, d: 5, due: t, last: '', first: '', fr: '', lg: 0, reps: 0, lapses: 0, off: false, at: '' };
      n++;
    });
    if (n) C.save();
    return n;
  }
  function unenroll(id) { var c = S().srs[id]; if (c && !c.off) { c.off = true; c.at = now(); C.save(); } }
  function moduleReviewIds(m) { // key terms, plus recall cards once ensureModule(m.id) has loaded them
    var ids = (m.keyTerms || []).map(function (t, i) { return 'kt:' + m.id + ':' + i; });
    var md = modData(m.id);
    if (md && md.cards) Object.keys(md.cards).forEach(function (k) { ids.push('rc:' + m.id + ':' + k); });
    return ids;
  }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
  var LAPSE_S = 0.3; // a forgotten card's memory is weak: about 70% after one day, 28% after four
  // the entry a grade would produce (no saving): 1 Again (forgot), 2 Hard, 3 Good, 4 Easy
  function nextEntry(id, grade, day0) {
    var c = S().srs[id] || { s: 0, d: 5, reps: 0, lapses: 0 }, t = day0 || today();
    var d = Math.max(1, Math.min(10, (c.d || 5) + (3 - grade) * 0.7));
    var s, lapses = c.lapses || 0;
    if (grade === 1) { s = LAPSE_S; lapses++; }
    else if (!c.reps || c.s < 1) s = [0, 0, 1, 3, 6][grade];
    else {
      var since = c.last ? Math.max(1, daysBetween(c.last, t)) : c.s;
      var base = Math.max(c.s, Math.min(since, c.s * 2)); // credit a late review a little, but not fully
      var mult = { 2: 1.2, 3: 2.3, 4: 3.3 }[grade] * (1.15 - 0.03 * d);
      s = Math.min(365, Math.max(1, base * mult));
    }
    if (s >= 3) s = s * (0.95 + 0.1 * hash(id + t)); // spread cards so they do not all fall on one day
    var gap = s < 1 ? 0 : Math.round(s);
    return { s: Math.round(s * 100) / 100, d: Math.round(d * 10) / 10, due: addDays(t, gap), last: t, first: c.first || (grade >= 2 ? t : ''), fr: c.fr || t, lg: grade,
      reps: (c.reps || 0) + 1, lapses: lapses, off: false, at: now() };
  }
  function schedule(id, grade) {
    var st = S(), entry = nextEntry(id, grade);
    st.srs[id] = entry;
    logReview(1, grade >= 2 ? 1 : 0);
    C.logActivity(); C.save();
    return entry;
  }
  function dueIds(day0) {
    var st = S(), t = day0 || today();
    return Object.keys(st.srs).filter(function (id) { var c = st.srs[id]; return !c.off && c.due <= t; })
      .sort(function (x, y) { return st.srs[x].due.localeCompare(st.srs[y].due) || st.srs[x].s - st.srs[y].s; });
  }
  // new cards first graded on day d, across devices (fr = the day of a card's first grade)
  function newGradedOn(d) { var st = S(), t = d || today(); return Object.keys(st.srs).filter(function (id) { var c = st.srs[id]; return (c.fr || (c.reps === 1 ? c.last : '')) === t; }).length; }
  function newPerDay() { var p = (S().prefs.study || {}).newPerDay; return Math.max(5, Math.min(50, Math.floor(Number(p) || 15))); }
  function newLeftToday() { return Math.max(0, newPerDay() - newGradedOn(today())); }
  // the recall check on a lesson card, before the card is in regular review: it records how well the learner remembered
  // (difficulty and last grade) and brings the card back tomorrow, without counting as a review
  function learnStep(id, grade) {
    var st = S(), c = st.srs[id];
    if (c && (c.off || c.reps)) return c;
    if (!c) { enroll([id]); c = st.srs[id]; }
    if (grade < 2) { C.logActivity(); C.save(); return c; }
    var e = nextEntry(id, grade), t = today();
    e.s = Math.min(e.s, 1); e.due = addDays(t, 1); st.srs[id] = e;
    C.logActivity(); C.save();
    return e;
  }
  // every ticked lesson card (and the key terms of a ticked Key terms card) belongs in Daily review; cards the learner
  // removed stay removed. Runs when pages that count cards are drawn, so a restore or a sync is caught up.
  function enrollTicked() {
    var A = app(); if (!A || !A.readCards) return 0;
    var st = S(), n = 0, add = function (id) { if (!st.srs[id]) { st.srs[id] = { s: 0, d: 5, due: today(), last: '', first: '', fr: '', lg: 0, reps: 0, lapses: 0, off: false, at: '' }; n++; } };
    (D.modules || []).forEach(function (m) {
      A.readCards(m).forEach(function (c) {
        if (!A.readOn(m.id, c.key)) return;
        add('rc:' + m.id + ':' + c.key);
        if (c.key === 'keyTerms') (m.keyTerms || []).forEach(function (t, i) { add('kt:' + m.id + ':' + i); });
      });
    });
    if (n) C.save();
    return n;
  }
  // chance of recalling a card today, from its stability (90% at s days, falling off after)
  function recallChance(c, day0) {
    if (!c || c.off || !c.reps) return null;
    var t = Math.max(0, daysBetween(c.last || day0 || today(), day0 || today()));
    return Math.exp(Math.log(0.9) * t / Math.max(LAPSE_S, c.s || 0));
  }
  function retention(mid) { // average predicted recall of the learner's review cards (optionally one module)
    var st = S(), xs = [];
    Object.keys(st.srs).forEach(function (id) { if (mid && id.split(':')[1] !== mid) return; var r = recallChance(st.srs[id]); if (r != null) xs.push(r); });
    return xs.length ? { avg: xs.reduce(function (a, b) { return a + b; }, 0) / xs.length, n: xs.length } : { avg: null, n: 0 };
  }
  // days since a card was first recalled correctly, if it is still remembered (last grade Hard or better)
  function heldDays(c, day0) { return c && !c.off && c.first && c.lg >= 2 ? daysBetween(c.first, day0 || today()) : 0; }

  /* ---------- quiz answers ---------- */
  function recordAnswer(qid, correct, sure, src, picked) {
    var st = S(), x = st.qa[qid] || { c: {}, n: 0, r: 0, lr: 0, p: -1, su: 0, at: '', wrongAt: '', fix: [], ok: [], src: '', f1: '' };
    var mine = x.c[DEV] || [0, 0];
    x.c[DEV] = [mine[0] + 1, mine[1] + (correct ? 1 : 0), now()];
    x.n = devSum(x.c, 0); x.r = Math.min(devSum(x.c, 1), x.n);
    x.lr = correct ? 1 : 0; x.p = typeof picked === 'number' ? picked : -1; x.su = sure || 0; x.at = now(); x.src = src || x.src;
    // the first right answer keeps its time (Play mode dates its XP by it); an entry already right before f1 existed stays undated
    if (correct && !x.f1 && x.r === 1) x.f1 = x.at;
    if (!correct) { x.wrongAt = x.at; x.fix = []; }
    else if (x.wrongAt) x.fix = (x.fix || []).concat(x.at).slice(-6);
    if (correct) x.ok = (x.ok || []).concat(x.at).slice(-6); // recent right answers (any question)
    st.qa[qid] = x; C.save();
    emit('qa', qid, x);
    return x;
  }
  // right answers since the last mistake that count towards fixing it: on different days and at least 12 hours apart
  function fixCount(x) {
    var n = 0, lastT = 0, lastD = '';
    (x && x.fix || []).slice().sort().forEach(function (t) { var ms = Date.parse(t), d = localDay(t); if (!n || (d !== lastD && ms - lastT >= 12 * 3600e3)) { n++; lastT = ms; lastD = d; } });
    return n;
  }
  function isMistake(x) { return !!(x && x.wrongAt && fixCount(x) < 2); }

  /* ---------- which modules has the learner started ---------- */
  // Real work on the module itself: a lesson card ticked, its quiz, an exercise, a lab task, a reflection or review card,
  // or a video or course that belongs to this module alone. A playlist shared by several modules does not start all of them.
  var shareCount = null;
  function sharedBy(rid) {
    if (!shareCount) {
      shareCount = {};
      (D.modules || []).forEach(function (m) {
        var A = app(), mp = A && A.mainPicks ? A.mainPicks(m) : null, ids = {};
        (mp ? mp.list : []).forEach(function (r) { ids[r.id] = 1; });
        Object.keys(ids).forEach(function (id) { shareCount[id] = (shareCount[id] || 0) + 1; });
      });
    }
    return shareCount[rid] || 0;
  }
  function isStarted(m) {
    var A = app(), st = S(); if (!A || !m) return false;
    if (A.readCards(m).some(function (c) { return A.readOn(m.id, c.key); })) return true;
    if (st.quiz[m.id] && st.quiz[m.id].attempts) return true;
    if (A.exOf(m.id).some(function (e) { return st.ex[e.id] && (st.ex[e.id].done || st.ex[e.id].tries); }) || A.exOf(m.id).some(function (e) { return st.code[e.id] && st.code[e.id] !== e.starter; })) return true;
    var lab = A.labOf(m); if (lab && st.labs[lab.id] && Object.keys(st.labs[lab.id]).some(function (t) { return st.labs[lab.id][t]; })) return true;
    if (st.refl[m.id]) return true;
    if (Object.keys(st.srs).some(function (id) { return id.split(':')[1] === m.id && st.srs[id].reps > 0; })) return true;
    var mp = A.mainPicks(m);
    // a shared playlist is ticked and resumed per module on module pages (app.js tickKey): those keys name this module
    var own = function (r) { var k = m.id + '|' + r.id; return st.watched[k] || (st.pos[k] && (st.pos[k].i > 0 || st.pos[k].s > 60)); };
    return (mp ? mp.list : []).some(function (r) { return own(r) || (sharedBy(r.id) === 1 && (st.watched[r.id] || (st.pos[r.id] && st.pos[r.id].s > 60))); });
  }
  function startedModules() { return (D.modules || []).filter(isStarted).map(function (m) { return m.id; }); }

  /* ---------- events, routes, Reflect tab, Study room cards ---------- */
  // feature scripts are loaded when first needed; events and routes wait for them
  var FEAT = { review: 'study-review', reflect: 'study-reflect', focus: 'study-focus', practice: 'study-practice', mastery: 'study-mastery', methods: 'study-methods' };
  FEAT.play = 'game'; // Play mode, the game-style way through the same course (assets/js/game.js)
  FEAT.watch = 'watch'; // Watch mode, every recommended video one after another (assets/js/watch.js)
  var EVENT_FEAT = { overview: ['reflect', 'review'], 'card-read': ['reflect', 'review'], watch: ['reflect'], watched: ['reflect'], home: ['mastery'], progress: ['mastery'], hub: [] };
  var ROUTE_FEAT = [[/^review(?:~.*)?$/, 'review'], [/^(?:focus|journal)(?:~.*)?$/, 'focus'], [/^(?:mixed|mistakes)(?:~.*)?$/, 'practice'], [/^mastery(?:~.*)?$/, 'mastery'], [/^methods(?:~.*)?$/, 'methods']];
  ROUTE_FEAT.push([/^play(?:[-~].*)?$/, 'play']); // #play, #play-<module>, #play-<module>~<round>...; never #playground
  ROUTE_FEAT.push([/^watch(?:-.*)?$/, 'watch']); // #watch, #watch-<module>; never a module page's #m-<module>~watch tab
  var ready = {}, loadedFeat = {}; // ready: loading started (a promise); loadedFeat: the script has run
  function need(names) {
    return Promise.all((names || []).map(function (n) {
      if (ready[n]) return ready[n];
      ready[n] = loadScript('assets/js/' + FEAT[n] + '.js', { 'data-feature': n }).then(function () { loadedFeat[n] = true; }, function (e) { delete ready[n]; throw e; });
      return ready[n];
    }));
  }
  // the Study room shows a card from every study feature; Play mode and Watch mode are not ones, and their code loads
  // only on their own pages
  function needAll() { return need(Object.keys(FEAT).filter(function (n) { return n !== 'play' && n !== 'watch'; })); }
  var subs = {};
  function on(ev, fn) {
    var cs = document.currentScript, owner = cs && cs.getAttribute('data-feature');
    (subs[ev] = subs[ev] || []).push({ fn: fn, owner: owner || '' });
  }
  function run(ev, args, filter) {
    (subs[ev] || []).forEach(function (s) { if (filter && !filter(s)) return; try { s.fn.apply(null, args); } catch (e) { if (window.console) console.error(e); } });
  }
  function emit(ev) {
    var args = Array.prototype.slice.call(arguments, 1);
    if (ev === 'home' || ev === 'progress' || ev === 'overview') enrollTicked();
    var missing = (EVENT_FEAT[ev] || []).filter(function (n) { return !loadedFeat[n]; });
    run(ev, args);
    // features loaded now get the event too, once they are in (only their own handlers run, so nothing runs twice)
    if (missing.length) need(missing).then(function () { run(ev, args, function (s) { return missing.indexOf(s.owner) >= 0; }); }, function () {});
  }
  var routes = [];
  function addRoute(re, render, navKey) { routes.push({ re: re, render: render, nav: navKey || 'study' }); }
  function route(h) {
    enrollTicked();
    for (var i = 0; i < routes.length; i++) {
      var r = routes[i], m = typeof r.re === 'string' ? (h === r.re ? [h] : null) : r.re.exec(h);
      if (m) { r.render(m); return r.nav; }
    }
    for (var j = 0; j < ROUTE_FEAT.length; j++) {
      if (!ROUTE_FEAT[j][0].test(h) || loadedFeat[ROUTE_FEAT[j][1]]) continue;
      var A = app(), f = ROUTE_FEAT[j][1], name = f === 'play' ? 'Play mode' : f === 'watch' ? 'Watch mode' : '';
      A.setView('<div class="wrap stack"><p class="muted" role="status">Loading…</p></div>', 'Loading');
      need([f]).then(function () {
        if ((location.hash || '').replace(/^#/, '') === h) A.route();
      }, function (e) {
        if ((location.hash || '').replace(/^#/, '') !== h) return; // the learner has gone on to another page meanwhile
        // say which page did not load (Play mode and Watch mode are not study tools), and offer to try again
        A.setView('<div class="wrap stack"><h1>Could not load this page</h1>' +
          '<p class="callout">' + (name ? name + ' did not load. Check your connection and try again.' : esc(e.message)) + '</p>' +
          '<div class="row"><button type="button" class="btn btn-primary" data-study-retry>Try again</button><a class="btn" href="#home">Home</a></div></div>', 'Not loaded');
      });
      return f === 'play' || f === 'watch' ? f : 'study'; // the menu marks the page being loaded
    }
    return null;
  }
  var reflectFn = null;
  function setReflect(fn) { reflectFn = fn; }
  function renderReflect(m, el) {
    el.innerHTML = '<p class="muted" role="status">Loading…</p>';
    Promise.all([need(['reflect']), ensureModule(m.id)]).then(function () {
      if (!el.isConnected) return;
      if (reflectFn) reflectFn(m, el); else el.innerHTML = '<div class="empty">Reflection tools are coming soon.</div>';
    }, function (e) { if (el.isConnected) el.innerHTML = '<div class="callout">' + esc(e.message) + '</div>'; });
  }
  var hubCards = [];
  function addHubCard(order, fn) { hubCards.push({ order: order, fn: fn }); hubCards.sort(function (a, b) { return a.order - b.order; }); }

  // the learning methods' Sanskrit names (Devanagari is used only here and in the guide's names, as the learner asked)
  var SANS = {
    sravana: ['Śravaṇa', 'श्रवण', 'attentive listening'], manana: ['Manana', 'मनन', 'deep reflection'], nididhyasana: ['Nididhyāsana', 'निदिध्यासन', 'sustained contemplation'],
    abhyasa: ['Abhyāsa', 'अभ्यास', 'steady practice'], vairagya: ['Vairāgya', 'वैराग्य', 'letting go of what pulls you away'], svadhyaya: ['Svādhyāya', 'स्वाध्याय', 'self-study'],
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
  // Gemini needs: switched on, an App Check key (Firebase requires App Check for AI Logic), sign-in available and a signed-in learner
  function aiConfigured() { var K = window.AIM_CLOUD, c = AIC(); return !!(c.enabled && c.appCheckSiteKey && K && K.enabled()); }
  function aiOn() { var K = window.AIM_CLOUD; return aiConfigured() && !!K.status().user; }
  function aiOffered() { return aiConfigured(); }
  function aiCap() { return Math.max(1, Math.floor(AIC().dailyPerPerson || 10)); }
  function aiUsed() { var u = S().ai || {}; return u.day === today() ? devSum(u.d, 0) : 0; }
  function aiLeft() { return Math.max(0, aiCap() - aiUsed()); }
  var aiModel = null, aiBusy = false;
  function aiLoad() {
    if (aiModel) return aiModel;
    var K = window.AIM_CLOUD, a = K && K.app && K.app(), c = AIC();
    if (!a) return Promise.reject(new Error('Sign in first to use AI help.'));
    aiModel = Promise.all([import(K.SDK + 'firebase-app-check.js'), import(K.SDK + 'firebase-ai.js')]).then(function (mods) {
      var ac = mods[0], ai = mods[1];
      // App Check proves requests come from this site; reCAPTCHA Enterprise by default, v3 if configured. It must start before the model.
      ac.initializeAppCheck(a, { provider: c.appCheckProvider === 'v3' ? new ac.ReCaptchaV3Provider(c.appCheckSiteKey) : new ac.ReCaptchaEnterpriseProvider(c.appCheckSiteKey), isTokenAutoRefreshEnabled: true });
      var inst = ai.getAI(a, { backend: new ai.GoogleAIBackend() });
      var model = c.model || 'gemini-2.5-flash-lite', gen = { maxOutputTokens: 1024, temperature: 0.4 };
      if (/2\.5/.test(model)) gen.thinkingConfig = { thinkingBudget: 0 }; // short tutoring replies need no hidden thinking (it would eat the reply budget)
      return ai.getGenerativeModel(inst, { model: model, generationConfig: gen });
    }, function (e) { aiModel = null; throw e; });
    return aiModel;
  }
  function aiError(e) {
    var status = (e && e.customErrorData && e.customErrorData.status) || 0, t = String((e && e.code) || '') + ' ' + String((e && e.message) || e);
    if (window.console) console.error('Gemini:', e);
    if (/^timeout/.test(t.trim())) return 'Gemini did not answer in time. Try again, or use Copy prompt with any AI app.';
    if (status === 429 || /RESOURCE_EXHAUSTED|quota|429/i.test(t)) return 'The site\'s free AI quota is used up for now. Use Copy prompt with any AI app instead, or try again tomorrow.';
    if (status === 403 || status === 401 || /api-not-enabled|PERMISSION_DENIED|app.?check|appCheck|recaptcha|403|401/i.test(t)) return 'AI help is not set up correctly on this site. Use Copy prompt with any AI app instead.';
    if ((typeof navigator !== 'undefined' && navigator.onLine === false) || /Failed to fetch|NetworkError|ERR_INTERNET|network/i.test(t)) return 'No connection. Check your internet and try again.';
    if (/SAFETY|blocked|response-error/i.test(t)) return 'Gemini would not answer this. Try rewording it, or use Copy prompt with any AI app.';
    return 'Gemini could not answer just now. Try again in a minute, or use Copy prompt with any AI app.';
  }
  // ask Gemini; a reply counts towards the daily limit only when it arrives
  // opts: { maxOutputTokens, json (ask for JSON), raw (resolve { text, cut } instead of text) }
  function askAI(prompt, opts) {
    opts = opts || {};
    if (!aiOn()) return Promise.reject(new Error('Sign in to ask Gemini. You can always use Copy prompt with any AI app.'));
    if (aiLeft() <= 0) return Promise.reject(new Error('You have used today\'s Gemini replies. Use Copy prompt with any AI app, or come back tomorrow.'));
    if (aiBusy) return Promise.reject(new Error('Gemini is still answering your last question.'));
    aiBusy = true;
    var timer;
    var call = aiLoad().then(function (m) {
      if (!opts.maxOutputTokens && !opts.json) return m.generateContent(TUTOR + prompt);
      // a per-request generationConfig replaces the model's, so it carries every setting
      var model = AIC().model || 'gemini-2.5-flash-lite', gen = { maxOutputTokens: opts.maxOutputTokens || 1024, temperature: 0.4 };
      if (/2\.5/.test(model)) gen.thinkingConfig = { thinkingBudget: 0 };
      if (opts.json) gen.responseMimeType = 'application/json';
      return m.generateContent({ contents: [{ role: 'user', parts: [{ text: TUTOR + prompt }] }], generationConfig: gen });
    });
    var limit = new Promise(function (_, reject) { timer = setTimeout(function () { reject({ code: 'timeout' }); }, 45000); });
    return Promise.race([call, limit]).then(function (r) {
      clearTimeout(timer); aiBusy = false;
      var resp = r && r.response, text = resp && typeof resp.text === 'function' ? resp.text() : '';
      if (!text) throw { code: 'empty' };
      var st = S(), t = today();
      st.ai = st.ai && st.ai.day === t ? st.ai : { day: t, d: {} };
      var mine = st.ai.d[DEV] || [0]; st.ai.d[DEV] = [mine[0] + 1, now()]; C.save();
      var fr = resp.candidates && resp.candidates[0] && resp.candidates[0].finishReason, cut = fr === 'MAX_TOKENS';
      refreshAI();
      if (opts.raw) return { text: text, cut: cut };
      return cut ? text + '\n\n(This reply was cut short.)' : text;
    }).catch(function (e) {
      clearTimeout(timer); aiBusy = false; refreshAI();
      throw new Error(e && e.code === 'empty' ? 'Gemini sent an empty reply. Try again in a minute.' : aiError(e));
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
  // AI boxes: buttons are drawn from the current sign-in state and redrawn when it changes; clicks are handled in one place
  var aiPrompts = {}, aiLabels = {};
  function aiRow(id) {
    var left = aiLeft(), label = aiLabels[id] || 'Ask Gemini', what = aiLabels[id + ':what'] || '';
    return '<button type="button" class="btn btn-sm" data-ai-copy' + (what ? ' aria-label="Copy prompt for your AI app: ' + esc(what) + '"' : '') + '>Copy prompt for your AI app</button>' +
      (aiOn() ? '<button type="button" class="btn btn-sm btn-primary" data-ai-ask' + (left && !aiBusy ? '' : ' disabled') + (what ? ' aria-label="' + esc(label + ' (' + left + ' left today): ' + what) + '"' : '') + '>' + esc(label) + ' <span class="small">(' + left + ' left today)</span></button>'
        : aiOffered() ? '<span class="small muted"><a href="#account">Sign in</a> to ask Gemini here.</span>' : '');
  }
  function aiHTML(id, label, what) {
    aiLabels[id] = label || 'Ask Gemini'; if (what) aiLabels[id + ':what'] = what;
    return '<div class="ai-box stack-sm" data-ai="' + esc(id) + '"><div class="row ai-row">' + aiRow(id) + '</div>' +
      (aiOffered() ? '<p class="small muted ai-note">Ask Gemini sends your text to Google. Do not type personal details.</p>' : '') +
      '<div class="ai-out stack-sm" aria-live="polite" hidden></div></div>';
  }
  // opts.onAsk(button, outEl): the feature handles the Ask button itself (for example to turn a JSON reply into a quiz)
  var aiAsk = {};
  function bindAI(root, id, getPrompt, opts) { aiPrompts[id] = getPrompt; if (opts && opts.onAsk) aiAsk[id] = opts.onAsk; else delete aiAsk[id]; }
  function refreshAI() {
    Array.prototype.forEach.call(document.querySelectorAll('.ai-box[data-ai]'), function (box) {
      var row = box.querySelector('.ai-row'), id = box.getAttribute('data-ai'); if (!row) return;
      var had = row.contains(document.activeElement) && document.activeElement.hasAttribute('data-ai-ask');
      row.innerHTML = aiRow(id);
      if (had) { var b = row.querySelector('[data-ai-ask]'); if (b && !b.disabled) b.focus(); }
    });
  }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('[data-ai-copy],[data-ai-ask]'); if (!b) return;
    var box = b.closest('.ai-box[data-ai]'); if (!box) return;
    var id = box.getAttribute('data-ai'), get = aiPrompts[id]; if (!get) return;
    // the prompt function learns which button was pressed: Ask Gemini wants one complete reply, Copy prompt may start a chat
    var p = get({ mode: b.hasAttribute('data-ai-ask') ? 'gemini' : 'copy' }); if (!p) return;
    if (b.hasAttribute('data-ai-copy')) { copyText(TUTOR + p); return; }
    var out = box.querySelector('.ai-out');
    if (aiAsk[id]) { aiAsk[id](b, out, p); return; }
    b.disabled = true; out.hidden = false; out.innerHTML = '<p class="muted">Gemini is thinking…</p>';
    askAI(p).then(function (text) {
      out.innerHTML = '<div class="ai-reply">' + C.md(text) + '</div><p class="small muted">AI can be wrong. Check its answer against the lesson.</p>';
    }, function (e) {
      out.innerHTML = '<p class="small pub-bad" role="alert">' + esc(e.message) + '</p>';
    }).then(function () { out.tabIndex = -1; try { out.focus({ preventScroll: true }); } catch (e) {} });
  });
  // Try again, on a page whose script did not load (see route)
  document.addEventListener('click', function (ev) { var b = ev.target.closest && ev.target.closest('[data-study-retry]'); if (b && app()) app().route(); });
  if (window.AIM_CLOUD && window.AIM_CLOUD.on) window.AIM_CLOUD.on(function () { refreshAI(); emit('signin'); });
  window.addEventListener('aim:progress-replaced', function () { enrollTicked(); });
  // Reset all progress also forgets what Play mode keeps in this browser: the XP last seen, the way back to Play and
  // this tab's rounds (the synced part, state.play, is reset with the rest)
  window.addEventListener('aim:progress-reset', function () {
    try { localStorage.removeItem('aimarg.play.seen'); } catch (e) {}
    try { sessionStorage.removeItem('aimarg.play.back'); sessionStorage.removeItem('aimarg.play.sess'); } catch (e) {}
  });

  /* ---------- Study room (#study) ---------- */
  function viewHub() {
    var A = app();
    A.setView('<div class="wrap stack-lg">' + A.crumbs([['Home', 'home'], ['Study room']]) +
      '<header class="stack-sm"><h1>Study room</h1><p class="lede muted prose">Tools built on well-researched learning methods (recall instead of rereading, spaced review, mixed practice, reflection and focused sessions), alongside the Vedic study practices of ' + sans('smarana', { meaning: false }) + ', ' + sans('manana', { meaning: false }) + ' and ' + sans('dharana', { meaning: false }) + '.</p>' +
      '<p class="prose"><strong>New here?</strong> Open a module and read its lesson cards first. Each card you tick goes into Daily review; come back here when you have done a little.</p>' +
      '<div class="row"><a class="btn" href="#methods">How to learn: the 40 methods</a></div></header>' +
      '<div class="grid study-hub" id="study-hub"><p class="muted" role="status">Loading…</p></div></div>', 'Study room');
    needAll().then(function () {
      var hub = document.getElementById('study-hub'); if (!hub) return;
      hub.innerHTML = hubCards.map(function (c) { try { return c.fn() || ''; } catch (e) { return ''; } }).join('');
      emit('hub', A.main);
    }, function (e) { var hub = document.getElementById('study-hub'); if (hub) hub.innerHTML = '<div class="callout">' + esc(e.message) + '</div>'; });
  }
  addRoute('study', viewHub, 'study');
  // study reminders (#reminders, assets/js/remind.js); before How to learn, which stays the last card
  addHubCard(80, function () {
    return '<article class="card rm-hub" aria-labelledby="rm-hub-h"><h2 class="h-sub" id="rm-hub-h">Reminders</h2>' +
      '<p class="small muted">A gentle reminder on your phone or in your calendar, at a time you choose.</p>' +
      '<div class="row"><a class="btn" href="#reminders">Set up reminders</a></div></article>';
  });
  // every answer in a module quiz or level test is remembered (Mistakes notebook, Knowledge map, Mixed practice)
  on('answer', function (r) { if (r && r.q && r.q.id) recordAnswer(r.q.id, !!r.correct, r.sure || 0, r.mode === 'test' ? 'test' : 'quiz', r.picked); });

  // Released to everyone while LIVE is true. Set it to false to hide the study features again: then they show only
  // in a browser that opted in (open the site once with ?study=1, or set localStorage 'aimarg.study' to '1'; ?study=0 undoes it).
  var LIVE = true;
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
    document.documentElement.classList.add('has-study');
  })();
  // the Play mode link, right after Study. It shows in the drop-down menu only: study.css hides it in the wide header
  // row (1220px and wider), which is already full
  (function () {
    var nav = document.getElementById('site-nav'); if (!nav || nav.querySelector('a[href="#play"]')) return;
    var a = document.createElement('a'); a.href = '#play'; a.className = 'nav-play'; a.textContent = 'Play mode';
    var after = nav.querySelector('a[href="#study"]');
    if (after && after.nextSibling) nav.insertBefore(a, after.nextSibling); else nav.appendChild(a);
  })();
  // the Watch mode link, right after Play mode, and like it in the drop-down menu only (study.css)
  (function () {
    var nav = document.getElementById('site-nav'); if (!nav || nav.querySelector('a[href="#watch"]')) return;
    var a = document.createElement('a'); a.href = '#watch'; a.className = 'nav-watch'; a.textContent = 'Watch mode';
    var after = nav.querySelector('a[href="#play"]') || nav.querySelector('a[href="#study"]');
    if (after && after.nextSibling) nav.insertBefore(a, after.nextSibling); else nav.appendChild(a);
  })();
  // a learner who chose Play mode on this device gets its code a little after the page has loaded, so #play opens at once
  (function () {
    var prefetch = function () {
      setTimeout(function () {
        var p = S().prefs.play;
        if (p && p.start === 'play') need(['play']).then(null, function () {}); // offline: the Play page says so when opened
      }, 3000);
    };
    if (document.readyState === 'complete') prefetch(); else window.addEventListener('load', prefetch);
  })();
  window.AIM_STUDY = {
    // content
    ensureData: ensureData, ensureModule: ensureModule, ensureModules: ensureModules, ensureGuide: ensureGuide,
    modIndex: modIndex, modData: modData, guide: guide, qtag: qtag, question: question, questionSet: questionSet,
    // time
    now: now, today: today, addDays: addDays, daysBetween: daysBetween, localDay: localDay, device: DEV,
    // review
    reviewItem: reviewItem, enroll: enroll, unenroll: unenroll, moduleReviewIds: moduleReviewIds, nextEntry: nextEntry, schedule: schedule, dueIds: dueIds,
    newGradedOn: newGradedOn, newPerDay: newPerDay, newLeftToday: newLeftToday, learnStep: learnStep, enrollTicked: enrollTicked, recallChance: recallChance, retention: retention, heldDays: heldDays, reviewLog: reviewLog, logReview: logReview,
    // answers
    recordAnswer: recordAnswer, isMistake: isMistake, fixCount: fixCount,
    // modules
    isStarted: isStarted, startedModules: startedModules, sharedBy: sharedBy,
    // plumbing
    on: on, emit: emit, need: need, addRoute: addRoute, route: route, setReflect: setReflect, renderReflect: renderReflect, addHubCard: addHubCard,
    // UI
    sans: sans, SANS: SANS, aiOn: aiOn, aiOffered: aiOffered, aiLeft: aiLeft, aiCap: aiCap, askAI: askAI, aiHTML: aiHTML, bindAI: bindAI, refreshAI: refreshAI, copyText: copyText
  };
  // a focus session that is running (or just finished) shows its timer on every page
  try { if (localStorage.getItem('aimarg.focus')) need(['focus']); } catch (e) {}
})();
