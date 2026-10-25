/* AI Marg lab: Central Limit Theorem & sampling.
   Pick a population, set the sample size n, draw samples, and watch the
   histogram of sample means turn into a bell curve N(mu, sigma / sqrt(n)).
   Plain classic script (ES2019), no dependencies. Registers window.AILabs.clt. */
(function () {
  'use strict';
  var Labs = (window.AILabs = window.AILabs || {});
  var uid = 0;

  /* ---------- small helpers ---------- */
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function decimalsOf(step) {
    for (var d = 0; d < 5; d++) {
      var s = step * Math.pow(10, d);
      if (Math.abs(s - Math.round(s)) < 1e-6) return d;
    }
    return 4;
  }
  function trim(v, d) {
    var s = (+v.toFixed(d)).toString();
    return s === '-0' ? '0' : s;
  }
  function niceStep(span, maxTicks) {
    var raw = span / Math.max(1, maxTicks);
    if (!(raw > 0)) return 1;
    var p = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var m = raw / p;
    var s = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10;
    return s * p;
  }
  function group(v) {
    try { return Math.round(v).toLocaleString('en-IN'); } catch (e) { return String(Math.round(v)); }
  }
  function sig3(v) {
    if (!isFinite(v)) return '\u2014';
    var a = Math.abs(v);
    return v.toFixed(a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : 3);
  }
  // income values are stored in thousands of rupees; show to the nearest Rs 10
  function rupees(thousands) {
    if (!isFinite(thousands)) return '\u2014';
    return '\u20B9' + group(Math.round(thousands * 100) * 10);
  }
  function normalPdf(x, mu, s) {
    var z = (x - mu) / s;
    return Math.exp(-0.5 * z * z) / (s * 2.5066282746310002);
  }

  /* ---------- populations (all live on an integer grid lo..hi) ---------- */
  var POP_DEFS = [
    {
      id: 'die', label: 'Fair die', short: 'Fair die', lo: 1, hi: 6, noun: 'rolls', one: 'roll', title: 'Population: faces of a fair die',
      shape: 'flat (uniform)',
      desc: 'A fair Ludo die: faces 1 to 6 are all equally likely. A flat, <b>uniform</b> population (every value equally common).',
      weight: function () { return 1; },
      fmtMean: function (v) { return isFinite(v) ? v.toFixed(2) : '\u2014'; },
      fmtSD: sig3,
      tick: function (v, d) { return trim(v, d); },
      popRange: function (a, b) { return a === b ? 'Face ' + a : 'Faces ' + a + '\u2013' + b; },
      popUnit: 'of rolls'
    },
    {
      id: 'income', label: 'Household income', short: 'Income', lo: 0, hi: 120, noun: 'households', one: 'household', title: 'Population: monthly household income',
      shape: 'right-skewed (long tail of high earners)',
      desc: 'Monthly income of households in a town. Most earn \u20B910k\u2013\u20B930k, a few earn over \u20B975k, so the tail stretches right: <b>right-skewed</b>.',
      weight: function (x) {
        if (x <= 0) return 0;
        var z = (Math.log(x) - Math.log(18)) / 0.65;
        return Math.exp(-0.5 * z * z) / x;
      },
      fmtMean: rupees,
      fmtSD: rupees,
      tick: function (v, d) {
        if (Math.abs(v) < 1e-9) return '\u20B90';
        if (v >= 100) return '\u20B9' + trim(v / 100, d + 2) + 'L';
        return '\u20B9' + trim(v, d) + 'k';
      },
      popRange: function (a, b) { return a === b ? '\u20B9' + a + 'k' : '\u20B9' + a + 'k\u2013\u20B9' + b + 'k'; },
      popUnit: 'of households'
    },
    {
      id: 'marks', label: 'Exam marks', short: 'Exam marks', lo: 0, hi: 100, noun: 'students', one: 'student', title: 'Population: exam marks of two batches',
      shape: 'two humps (bimodal)',
      desc: 'Marks out of 100 for two batches: one batch scored around 35, the other around 75. Two humps: <b>bimodal</b>.',
      weight: function (m) {
        var a = (m - 35) / 9, b = (m - 75) / 8;
        return 0.5 * Math.exp(-0.5 * a * a) / 9 + 0.5 * Math.exp(-0.5 * b * b) / 8;
      },
      fmtMean: function (v) { return isFinite(v) ? v.toFixed(1) : '\u2014'; },
      fmtSD: sig3,
      tick: function (v, d) { return trim(v, d); },
      popRange: function (a, b) { return a === b ? a + ' marks' : a + '\u2013' + b + ' marks'; },
      popUnit: 'of students'
    }
  ];

  function buildPop(def) {
    var L = def.hi - def.lo + 1, p = new Float64Array(L), cdf = new Float64Array(L), tot = 0, i;
    for (i = 0; i < L; i++) { p[i] = Math.max(0, def.weight(def.lo + i)); tot += p[i]; }
    var acc = 0, mu = 0;
    for (i = 0; i < L; i++) { p[i] /= tot; acc += p[i]; cdf[i] = acc; mu += (def.lo + i) * p[i]; }
    cdf[L - 1] = 1;
    var v = 0;
    for (i = 0; i < L; i++) { var d = def.lo + i - mu; v += d * d * p[i]; }
    var o = {};
    for (var k in def) if (Object.prototype.hasOwnProperty.call(def, k)) o[k] = def[k];
    o.L = L; o.p = p; o.cdf = cdf; o.mu = mu; o.sigma = Math.sqrt(v);
    return o;
  }

  var POPS = null;
  function getPops() {
    if (!POPS) {
      POPS = {};
      for (var i = 0; i < POP_DEFS.length; i++) POPS[POP_DEFS[i].id] = buildPop(POP_DEFS[i]);
    }
    return POPS;
  }

  var TASKS = [
    { id: 't1', text: 'Set n = 1 and collect at least 500 means. Does the bottom chart copy the population\u2019s shape?' },
    { id: 't2', text: 'Choose Income (right-skewed), set n to 30 or more and collect 1,000 means. Spot the bell shape (try \u201CZoom in\u201D).' },
    { id: 't3', text: 'Quadruple n on the same population (e.g. 10 \u2192 40), with 200+ means each time, and see the SD of the means roughly halve.' },
    { id: 't4', text: 'Collect 1,000+ means in one run and get the SD of sample means within 5% of \u03C3/\u221An.' }
  ];

  var SINGLE_MS = 900;
  var BATCH_FRAMES = 36;

  function mount(root, ctx) {
    var pops = getPops();
    var P = 'clt' + (++uid) + '-';
    var rng = mulberry32(20240611);
    var reducedMQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var darkMQ = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    function reduced() { return !!(reducedMQ && reducedMQ.matches); }

    /* ---------- DOM ---------- */
    var segPop = '';
    for (var i = 0; i < POP_DEFS.length; i++) {
      segPop += '<button type="button" data-pop="' + POP_DEFS[i].id + '" aria-pressed="false">' + POP_DEFS[i].short + '</button>';
    }
    var quick = [1, 4, 10, 16, 30, 40], quickHtml = '';
    for (i = 0; i < quick.length; i++) {
      quickHtml += '<button type="button" class="btn btn-sm" data-n="' + quick[i] + '" aria-label="Set n to ' + quick[i] + '" style="min-width:36px;padding:4px 8px">' + quick[i] + '</button>';
    }
    var taskHtml = '';
    for (i = 0; i < TASKS.length; i++) taskHtml += '<li data-task="' + TASKS[i].id + '">' + TASKS[i].text + '</li>';
    var nt = 'style="text-transform:none;letter-spacing:0"';
    var th = 'style="text-transform:none;letter-spacing:0;padding:6px 8px;white-space:nowrap"';

    root.innerHTML =
      '<div class="lab">' +
        '<p class="lab-note"><strong>What you are seeing:</strong> the top chart is a whole <em>population</em> (every household, every student, or every possible die roll). ' +
        'Each time you draw a <em>sample</em> (a random handful of <i>n</i> values, shown as yellow dots), we work out its <em>mean</em> (average) and drop it into the bottom chart. ' +
        'Collect many sample means and look at their shape. <em>SD</em> means standard deviation: how far values typically sit from the average.</p>' +
        '<div class="lab-body">' +
          '<div class="stack-sm">' +
            '<div class="lab-canvas-wrap"><canvas role="img" tabindex="0" aria-label="Central Limit Theorem lab chart" aria-describedby="' + P + 'hint" style="outline-offset:-3px"></canvas></div>' +
            '<div class="lab-legend">' +
              '<span style="--c:var(--series-1)">Population</span>' +
              '<span style="--c:var(--series-3)">Values in one sample</span>' +
              '<span style="--c:var(--series-4)">Sample means</span>' +
              '<span style="--c:var(--series-2)">Bell curve N(\u03BC, \u03C3/\u221An)</span>' +
            '</div>' +
            '<p class="small muted" id="' + P + 'hint">Tap the top chart (or focus it and press Enter) to draw one sample. Hover a bar, or use the \u2190 \u2192 keys, to read it.</p>' +
            '<p class="small" aria-live="polite" data-r="status" style="min-height:1.6em"></p>' +
            '<div class="lab-stats">' +
              '<div class="stat"><div class="k">Population mean <span ' + nt + '>\u03BC</span></div><div class="v" data-s="mu"></div></div>' +
              '<div class="stat"><div class="k">Population SD <span ' + nt + '>\u03C3</span></div><div class="v" data-s="sigma"></div></div>' +
              '<div class="stat"><div class="k">Means collected</div><div class="v" data-s="count"></div></div>' +
              '<div class="stat"><div class="k">Mean of means</div><div class="v" data-s="mm"></div></div>' +
              '<div class="stat"><div class="k">SD of means</div><div class="v" data-s="sd"></div></div>' +
              '<div class="stat"><div class="k">Theory <span ' + nt + '>\u03C3/\u221An</span></div><div class="v" data-s="th"></div></div>' +
            '</div>' +
          '</div>' +
          '<div class="lab-controls">' +
            '<div class="control">' +
              '<span class="control-label" id="' + P + 'poplbl">Population</span>' +
              '<div class="seg" role="group" aria-labelledby="' + P + 'poplbl">' + segPop + '</div>' +
              '<p class="small muted" data-r="popdesc"></p>' +
            '</div>' +
            '<div class="control">' +
              '<label for="' + P + 'n"><span>Sample size <i>n</i></span><output for="' + P + 'n" data-r="nout" style="white-space:nowrap"></output></label>' +
              '<input type="range" id="' + P + 'n" min="1" max="50" step="1" value="10">' +
              '<div class="row" role="group" aria-label="Quick sample sizes" style="gap:4px"><span class="small muted">Quick:</span>' + quickHtml + '</div>' +
            '</div>' +
            '<div class="control">' +
              '<span class="control-label"><span>Draw samples</span><span class="val" data-r="countlbl"></span></span>' +
              '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px">' +
                '<button type="button" class="btn btn-primary" data-draw="1" style="padding-inline:6px">Draw 1</button>' +
                '<button type="button" class="btn" data-draw="100" style="padding-inline:6px">Draw 100</button>' +
                '<button type="button" class="btn" data-draw="1000" style="padding-inline:6px">Draw 1000</button>' +
              '</div>' +
            '</div>' +
            '<div class="control">' +
              '<span class="control-label" id="' + P + 'axislbl">Bottom chart</span>' +
              '<div class="seg" role="group" aria-labelledby="' + P + 'axislbl">' +
                '<button type="button" data-zoom="0" aria-pressed="true">Same scale as top</button>' +
                '<button type="button" data-zoom="1" aria-pressed="false">Zoom in</button>' +
              '</div>' +
            '</div>' +
            '<div class="row-between">' +
              '<span class="row" style="gap:8px"><input type="checkbox" id="' + P + 'curve" checked><label for="' + P + 'curve" class="small" style="font-weight:600">Show bell curve</label></span>' +
              '<button type="button" class="btn btn-sm btn-ghost" data-r="clear">Clear means</button>' +
            '</div>' +
            '<div class="stack-sm">' +
              '<h4 class="small" style="font-size:.92rem">Your runs for this population</h4>' +
              '<div class="table-wrap"><table class="simple" style="font-size:.88rem">' +
                '<thead><tr><th scope="col" ' + th + '>n</th><th scope="col" ' + th + '>Means</th><th scope="col" ' + th + '>SD of means</th><th scope="col" ' + th + '>\u03C3/\u221An</th></tr></thead>' +
                '<tbody data-r="runs"></tbody>' +
              '</table></div>' +
              '<p class="small muted" data-r="finding"></p>' +
            '</div>' +
            '<div class="stack-sm">' +
              '<h4 class="small" style="font-size:.92rem">Tasks</h4>' +
              '<ul class="lab-tasks">' + taskHtml + '</ul>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<p class="small muted"><strong>Why it matters in real ML:</strong> when you report a model\u2019s accuracy on 1,000 test examples, or average the loss over a mini-batch, the CLT says that average wobbles by about \u03C3/\u221An, which is where error bars and A/B tests come from.</p>' +
      '</div>';

    function q(sel) { return root.querySelector(sel); }
    function qa(sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
    var canvas = q('canvas');
    var wrap = q('.lab-canvas-wrap');
    var g = canvas.getContext('2d');
    var slider = q('#' + P + 'n');
    var curveBox = q('#' + P + 'curve');
    var el = {
      nout: q('[data-r="nout"]'), countlbl: q('[data-r="countlbl"]'), popdesc: q('[data-r="popdesc"]'),
      status: q('[data-r="status"]'), runs: q('[data-r="runs"]'), finding: q('[data-r="finding"]'),
      mu: q('[data-s="mu"]'), sigma: q('[data-s="sigma"]'), count: q('[data-s="count"]'),
      mm: q('[data-s="mm"]'), sd: q('[data-s="sd"]'), th: q('[data-s="th"]')
    };
    var popBtns = qa('[data-pop]'), zoomBtns = qa('[data-zoom]'), drawBtns = qa('[data-draw]'), nBtns = qa('[data-n]');
    var taskLis = {};
    qa('[data-task]').forEach(function (li) { taskLis[li.getAttribute('data-task')] = li; });

    /* ---------- state ---------- */
    var st = {
      popId: 'income', n: 10, showCurve: true, zoom: false,
      run: null, runs: { die: [], income: [], marks: [] }, best: {}, finding: {},
      last: null
    };
    var doneLocal = {};
    var anim = null, pending = 0, batchRate = 1, batchSize = 0, raf = 0, yDisp = 0, yInit = false;
    var hover = null;   // { panel: 'pop' | 'means', j: binIndex, x, y, kb }
    var W = 0, H = 0, dpr = 1, tall = false, lay = null, frameBins = null;
    var lastText = {};
    var destroyed = false;

    function pop() { return pops[st.popId]; }
    function theorySD() { return pop().sigma / Math.sqrt(st.n); }

    function setText(node, key, txt) {
      if (lastText[key] !== txt) { lastText[key] = txt; node.textContent = txt; }
    }
    function setHTML(node, key, html) {
      if (lastText[key] !== html) { lastText[key] = html; node.innerHTML = html; }
    }

    /* ---------- runs & sampling ---------- */
    function newRun() {
      var p = pop();
      st.run = {
        n: st.n, count: 0, sumD: 0, sumD2: 0, off: Math.round(st.n * p.mu),
        lattice: new Uint32Array(st.n * (p.hi - p.lo) + 1)
      };
      st.runs[p.id].push(st.run);
      st.last = null;
    }
    function endRun() {
      finishAnim();
      pending = 0;
      var r = st.run, list = st.runs[st.popId];
      if (!r) return;
      r.lattice = null;
      if (r.count === 0) {
        var ix = list.indexOf(r);
        if (ix >= 0) list.splice(ix, 1);
      }
      if (list.length > 12) list.splice(0, list.length - 12);
    }
    function runStats(r) {
      if (!r || r.count < 1) return { mean: NaN, sd: NaN };
      var mD = r.sumD / r.count;
      var sd = NaN;
      if (r.count > 1) sd = Math.sqrt(Math.max(0, (r.sumD2 - r.sumD * mD) / (r.count - 1))) / r.n;
      return { mean: (mD + r.off) / r.n, sd: sd };
    }
    function drawOne(keepVals) {
      var p = pop(), n = st.n, cdf = p.cdf, L = p.L, sum = 0, vals = keepVals ? new Array(n) : null;
      for (var i = 0; i < n; i++) {
        var u = rng(), a = 0, b = L - 1;
        while (a < b) { var m = (a + b) >> 1; if (cdf[m] > u) b = m; else a = m + 1; }
        var v = p.lo + a;
        sum += v;
        if (vals) vals[i] = v;
      }
      return { vals: vals, sum: sum };
    }
    function commit(sum) {
      var r = st.run, p = pop();
      r.lattice[sum - r.n * p.lo] += 1;
      r.count += 1;
      var d = sum - r.off;
      r.sumD += d;
      r.sumD2 += d * d;
    }
    function lastFrom(s) {
      return { vals: s.vals, sum: s.sum, mean: s.sum / st.n, no: st.run.count + 1 };
    }

    function finishAnim() {
      if (anim) { commit(anim.s.sum); anim = null; afterCommit(); }
    }

    function request(k) {
      if (destroyed) return;
      finishAnim();
      if (reduced()) {
        var s = null;
        for (var i = 0; i < k + pending; i++) {
          s = drawOne(i === k + pending - 1);
          if (i === k + pending - 1) st.last = lastFrom(s);
          commit(s.sum);
        }
        pending = 0;
        afterCommit();
        announceBatch(k);
      } else if (k === 1 && pending === 0) {
        var one = drawOne(true);
        st.last = lastFrom(one);
        anim = { t0: performance.now(), s: one, target: one.sum };
      } else {
        pending += k;
        batchRate = Math.max(1, Math.ceil(pending / BATCH_FRAMES));
        anim = null;
        batchSize = (batchSize || 0) + k;
      }
      kick();
    }

    function announceBatch(k) {
      var r = st.run, rs = runStats(r), p = pop();
      var msg;
      if (k === 1) {
        msg = 'Sample #' + group(r.count) + ': ' + st.n + ' ' + (st.n === 1 ? p.one : p.noun) + ', mean ' + p.fmtMean(st.last ? st.last.mean : rs.mean) + '.';
      } else {
        msg = 'Added ' + group(k) + ' sample means (' + group(r.count) + ' in total). SD of means ' + p.fmtSD(rs.sd) + ' vs theory ' + p.fmtSD(theorySD()) + '.';
      }
      setStatus(msg);
    }
    var statusExtra = '';
    function setStatus(msg) {
      setText(el.status, 'status', msg + (statusExtra ? ' ' + statusExtra : ''));
      statusExtra = '';
    }

    /* ---------- tasks ---------- */
    function isDone(id) {
      if (doneLocal[id]) return true;
      return !!(ctx && ctx.isTaskDone && ctx.isTaskDone(id));
    }
    function markDone(id) {
      if (doneLocal[id]) return;
      var already = !!(ctx && ctx.isTaskDone && ctx.isTaskDone(id));
      doneLocal[id] = true;
      if (taskLis[id]) taskLis[id].className = 'done';
      if (!already) {
        if (ctx && ctx.onTaskDone) ctx.onTaskDone(id);
        statusExtra = 'Task done!';
      }
    }
    function checkTasks() {
      var r = st.run, p = pop(), rs = runStats(r), th = theorySD();
      if (st.n === 1 && r.count >= 500) markDone('t1');
      if (p.id === 'income' && st.n >= 30 && r.count >= 1000) markDone('t2');
      if (r.count >= 1000 && isFinite(rs.sd) && Math.abs(rs.sd - th) / th <= 0.05) markDone('t4');
      if (r.count >= 200 && isFinite(rs.sd)) {
        st.best[p.id + '|' + st.n] = { sd: rs.sd, count: r.count };
        var partners = [];
        if (st.n * 4 <= 50) partners.push(st.n * 4);
        if (st.n % 4 === 0) partners.push(st.n / 4);
        for (var i = 0; i < partners.length; i++) {
          var b = st.best[p.id + '|' + partners[i]];
          if (!b || b.count < 200) continue;
          var small = partners[i] < st.n ? { n: partners[i], sd: b.sd } : { n: st.n, sd: rs.sd };
          var large = partners[i] < st.n ? { n: st.n, sd: rs.sd } : { n: partners[i], sd: b.sd };
          var ratio = large.sd / small.sd;
          st.finding[p.id] = 'n = ' + small.n + ' \u2192 ' + large.n + ' (4\u00D7 bigger): SD of means went ' + p.fmtSD(small.sd) + ' \u2192 ' + p.fmtSD(large.sd) +
            ' (\u00D7' + ratio.toFixed(2) + '). ' + (ratio >= 0.4 && ratio <= 0.62 ? 'Four times the sample, about half the spread, because \u221A4\u00A0=\u00A02.' : 'Theory says \u00D70.50; collect more means to steady it.');
          if (ratio >= 0.4 && ratio <= 0.62) markDone('t3');
        }
      }
    }
    function afterCommit() { checkTasks(); syncStats(); }

    /* ---------- UI sync ---------- */
    function syncControls() {
      var p = pop();
      popBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-pop') === st.popId ? 'true' : 'false'); });
      zoomBtns.forEach(function (b) { b.setAttribute('aria-pressed', (b.getAttribute('data-zoom') === '1') === st.zoom ? 'true' : 'false'); });
      nBtns.forEach(function (b) {
        var on = +b.getAttribute('data-n') === st.n;
        b.className = on ? 'btn btn-sm btn-primary' : 'btn btn-sm';
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (+slider.value !== st.n) slider.value = String(st.n);
      setText(el.nout, 'nout', 'n = ' + st.n + (st.n === 1 ? ' value' : ' values') + ' per sample');
      setHTML(el.popdesc, 'popdesc', p.desc);
      curveBox.checked = st.showCurve;
      syncStats();
    }
    function syncStats() {
      var p = pop(), r = st.run, rs = runStats(r), th = theorySD();
      setText(el.mu, 'mu', p.fmtMean(p.mu));
      setText(el.sigma, 'sigma', p.fmtSD(p.sigma));
      setText(el.count, 'count', group(r.count));
      setText(el.mm, 'mm', p.fmtMean(rs.mean));
      setText(el.sd, 'sd', p.fmtSD(rs.sd));
      setText(el.th, 'th', p.fmtSD(th));
      setText(el.countlbl, 'countlbl', group(r.count) + ' means so far');
      // runs table (most recent first, max 5)
      var list = st.runs[p.id], html = '', shown = 0;
      for (var i = list.length - 1; i >= 0 && shown < 5; i--) {
        var run = list[i];
        if (run.count === 0) continue;
        var s = runStats(run), cur = run === st.run;
        var td = '<td style="padding:6px 8px;white-space:nowrap">';
        html += '<tr' + (cur ? ' style="font-weight:700"' : '') + '>' + td + (cur ? '<span aria-hidden="true">\u25B8 </span><span class="visually-hidden">current run, </span>' : '') + run.n + '</td>' +
          td + group(run.count) + '</td>' + td + p.fmtSD(s.sd) + '</td>' + td + p.fmtSD(p.sigma / Math.sqrt(run.n)) + '</td></tr>';
        shown++;
      }
      if (!html) html = '<tr><td colspan="4" class="muted">No means yet. Press Draw.</td></tr>';
      setHTML(el.runs, 'runs', html);
      var f = st.finding[p.id];
      if (!f) {
        var sugg = st.n * 4 <= 50 ? st.n * 4 : (st.n % 4 === 0 ? st.n / 4 : 0);
        f = sugg ? 'Tip: note the SD of means, then set n = ' + sugg + ' (4\u00D7 ' + (sugg > st.n ? 'bigger' : 'smaller') + ') and collect 200+ means.' :
          'Tip: try n = 10, then n = 40 (4\u00D7 bigger), with 200+ means each.';
      }
      setText(el.finding, 'finding', f);
      // canvas description
      var lbl = 'Top chart: population of ' + p.label.toLowerCase() + ', ' + p.shape + ', mean ' + p.fmtMean(p.mu) + ', SD ' + p.fmtSD(p.sigma) + '. ' +
        'Bottom chart: histogram of ' + group(r.count) + ' sample means with n = ' + st.n +
        (r.count > 1 ? ', centred at ' + p.fmtMean(rs.mean) + ' with SD ' + p.fmtSD(rs.sd) + ' (theory ' + p.fmtSD(th) + ').' : '.');
      if (lastText.aria !== lbl) { lastText.aria = lbl; canvas.setAttribute('aria-label', lbl); }
    }

    function setN(n) {
      n = clamp(Math.round(n), 1, 50);
      if (n === st.n) return;
      endRun();
      st.n = n;
      newRun();
      hover = null;
      yInit = false;
      syncControls();
      setStatus('n is now ' + n + '. The bottom chart starts fresh, because means of ' + n + ' values form a new pile.');
      kick();
    }
    function setPop(id) {
      if (id === st.popId || !pops[id]) return;
      endRun();
      st.popId = id;
      newRun();
      hover = null;
      yInit = false;
      syncControls();
      setStatus('Population: ' + pops[id].label + '. Press Draw to start collecting sample means.');
      kick();
    }
    function clearMeans() {
      finishAnim();
      pending = 0;
      var r = st.run;
      r.count = 0; r.sumD = 0; r.sumD2 = 0;
      r.lattice.fill(0);
      st.last = null;
      hover = null;
      yInit = false;
      syncStats();
      setStatus('Cleared. Press Draw to collect new sample means.');
      kick();
    }

    /* ---------- layout & binning ---------- */
    function computeLayout() {
      var small = W < 480;
      var fs = small ? 11 : 12;
      var padL = small ? 30 : 40, padR = small ? 10 : 16;
      var y = 6;
      var L = { fs: fs, padL: padL, padR: padR, plotW: Math.max(40, W - padL - padR) };
      L.popTitleY = y + fs; y += fs + 6;
      L.popTop = y; L.popH = Math.round(H * (tall ? 0.2 : 0.23)); y += L.popH;
      L.popAxisY = y + fs + 3; y += fs + 8;
      L.stripTop = y; L.stripH = Math.max(38, Math.round(H * 0.12)); y += L.stripH + 8;
      L.meansTitleY = y + fs; y += fs + 6;
      L.meansTop = y; L.meansH = Math.max(40, H - y - fs - 10);
      L.meansAxisY = L.meansTop + L.meansH + fs + 4;
      return L;
    }
    function desiredBins() { return clamp(Math.round(lay.plotW / 6), 16, 60); }
    function popView() { var p = pop(); return { lo: p.lo - 0.5, hi: p.hi + 0.5 }; }
    function popK() {
      var p = pop();
      return Math.max(1, Math.round(p.L / desiredBins()));
    }
    function meansView() {
      var pv = popView();
      if (!st.zoom) return pv;
      var s = theorySD(), mu = pop().mu;
      return { lo: Math.max(pv.lo, mu - 5 * s), hi: Math.min(pv.hi, mu + 5 * s) };
    }
    function meansK(view) {
      var n = st.n;
      if (n === 1 && !st.zoom) return popK();
      var span = view.hi - view.lo, s = theorySD();
      var w = Math.min(span / desiredBins(), s / 3);
      w = Math.max(w, 2.5 * span / lay.plotW);
      return Math.max(1, Math.round(w * n));
    }
    function computeMeansBins() {
      var p = pop(), r = st.run, n = st.n, view = meansView(), k = meansK(view);
      var size = r.lattice.length, lat = r.lattice;
      var j0 = Math.max(0, Math.floor(((view.lo - p.lo) * n + 0.5) / k));
      var j1 = Math.min(Math.floor((size - 1) / k), Math.floor(((view.hi - p.lo) * n + 0.5) / k));
      var counts = [], maxH = 0;
      for (var j = j0; j <= j1; j++) {
        var a = j * k, b = Math.min(size - 1, a + k - 1), c = 0;
        for (var i = a; i <= b; i++) c += lat[i];
        var hgt = c * k / (b - a + 1);
        counts.push({ j: j, a: a, b: b, c: c, h: hgt });
        if (hgt > maxH) maxH = hgt;
      }
      var leftOut = 0, rightOut = 0;
      if (st.zoom && r.count) {
        var iL = Math.ceil((view.lo - p.lo) * n - 1e-9), iR = Math.floor((view.hi - p.lo) * n + 1e-9);
        for (i = 0; i < Math.min(size, iL); i++) leftOut += lat[i];
        for (i = Math.max(0, iR + 1); i < size; i++) rightOut += lat[i];
      }
      return { view: view, k: k, w: k / n, bins: counts, maxH: maxH, leftOut: leftOut, rightOut: rightOut };
    }
    function yTarget(mb) {
      var t = mb.maxH;
      if (st.showCurve && st.run.count >= 30) t = Math.max(t, st.run.count * mb.w * normalPdf(pop().mu, pop().mu, theorySD()));
      return Math.max(4, t * 1.15);
    }

    /* ---------- drawing ---------- */
    function readColors() {
      var cs = getComputedStyle(document.documentElement);
      function v(name, fb) { var x = cs.getPropertyValue(name); x = x ? x.trim() : ''; return x || fb; }
      return {
        bg: v('--bg', '#f4f4f9'), surface: v('--surface', '#fff'), surface2: v('--surface-2', '#ebecf5'),
        ink: v('--ink', '#161930'), muted: v('--muted', '#565b7a'), line: v('--line', '#d7d9e8'),
        indigo: v('--indigo', '#2d388a'), haldi: v('--haldi', '#e2a400'), haldiSoft: v('--haldi-soft', '#fbf0cf'),
        s1: v('--series-1', '#2d388a'), s2: v('--series-2', '#c0402c'), s3: v('--series-3', '#d99a00'), s4: v('--series-4', '#12807f'),
        font: v('--font-body', 'system-ui, sans-serif')
      };
    }
    function rr(x, y, w, h, r) {
      g.beginPath();
      g.moveTo(x + r, y);
      g.arcTo(x + w, y, x + w, y + h, r);
      g.arcTo(x + w, y + h, x, y + h, r);
      g.arcTo(x, y + h, x, y, r);
      g.arcTo(x, y, x + w, y, r);
      g.closePath();
    }
    function hash01(i) { var x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }
    function easeOut(t) { t = clamp(t, 0, 1); return 1 - (1 - t) * (1 - t) * (1 - t); }
    function easeInOut(t) { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

    function draw(now) {
      if (!lay || W < 10 || H < 10) return;
      var C = readColors(), p = pop(), L = lay, r = st.run, n = st.n, fs = L.fs;
      var fontN = fs + 'px ' + C.font, fontB = '600 ' + fs + 'px ' + C.font;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.fillStyle = C.surface;
      g.fillRect(0, 0, W, H);
      g.textBaseline = 'alphabetic';

      var pv = popView(), plotL = L.padL, plotW = L.plotW, plotR = plotL + plotW;
      function xP(v) { return plotL + (v - pv.lo) / (pv.hi - pv.lo) * plotW; }
      var mb = frameBins || computeMeansBins();
      var mv = mb.view;
      function xM(v) { return plotL + (v - mv.lo) / (mv.hi - mv.lo) * plotW; }

      /* --- population panel --- */
      g.font = fontB; g.fillStyle = C.ink; g.textAlign = 'left';
      g.fillText(p.title, plotL, L.popTitleY);
      if (W > 520) {
        g.font = fontN; g.fillStyle = C.muted; g.textAlign = 'right';
        g.fillText('tap here to draw a sample', plotR, L.popTitleY);
      }
      var kp = popK(), nbP = Math.ceil(p.L / kp), probs = [], maxp = 0, b, i;
      for (b = 0; b < nbP; b++) {
        var s0 = 0, cnt = Math.min(kp, p.L - b * kp);
        for (i = 0; i < cnt; i++) s0 += p.p[b * kp + i];
        probs.push(s0 * kp / cnt);
        if (s0 * kp / cnt > maxp) maxp = s0 * kp / cnt;
      }
      var popBase = L.popTop + L.popH, popScale = (L.popH - 6) / (maxp * 1.08);
      // zoom window (behind bars)
      if (st.zoom) {
        var zx0 = xP(mv.lo), zx1 = xP(mv.hi);
        g.globalAlpha = 0.55; g.fillStyle = C.haldiSoft;
        g.fillRect(zx0, L.popTop, zx1 - zx0, L.popH);
        g.globalAlpha = 1;
      }
      // grid line for population (percent)
      var pStep = niceStep(maxp * 1.08, 2), pd = decimalsOf(pStep * 100);
      g.strokeStyle = C.line; g.lineWidth = 1; g.font = fontN; g.fillStyle = C.muted; g.textAlign = 'right';
      for (var gv = pStep; gv < maxp * 1.08; gv += pStep) {
        var gy = Math.round(popBase - gv * popScale) + 0.5;
        g.beginPath(); g.moveTo(plotL, gy); g.lineTo(plotR, gy); g.stroke();
        g.fillText(trim(gv * 100, pd) + '%', plotL - 5, gy + 4);
      }
      var barPxP = plotW * kp / (pv.hi - pv.lo);
      var gapP = barPxP > 14 ? barPxP * 0.16 : (barPxP > 5 ? 1 : 0);
      for (b = 0; b < nbP; b++) {
        var va = p.lo + b * kp, cntb = Math.min(kp, p.L - b * kp);
        var x0 = xP(va - 0.5) + gapP / 2, x1 = xP(va + cntb - 0.5) - gapP / 2, hh = probs[b] * popScale;
        if (hh < 0.5) continue;
        var isHov = hover && hover.panel === 'pop' && hover.j === b;
        g.globalAlpha = isHov ? 0.6 : 0.3; g.fillStyle = C.s1;
        g.fillRect(x0, popBase - hh, x1 - x0, hh);
        g.globalAlpha = 1; g.fillStyle = C.s1;
        g.fillRect(x0, popBase - hh, x1 - x0, Math.min(2, hh));
      }
      g.strokeStyle = C.line; g.lineWidth = 1;
      g.beginPath(); g.moveTo(plotL, popBase + 0.5); g.lineTo(plotR, popBase + 0.5); g.stroke();
      if (st.zoom) {
        g.setLineDash([3, 3]); g.strokeStyle = C.haldi; g.lineWidth = 1.5;
        g.strokeRect(xP(mv.lo), L.popTop, xP(mv.hi) - xP(mv.lo), L.popH);
        g.setLineDash([]);
      }
      // mu line (population)
      drawMu(xP(p.mu), L.popTop, popBase, C, fontN, true);
      // population axis
      drawAxis(pv, xP, popBase, L.popAxisY, C, fontN);

      /* --- sample strip --- */
      var sT = L.stripTop, sH = L.stripH;
      g.fillStyle = C.surface2; rr(plotL - 4, sT, plotW + 8, sH, 6); g.fill();
      var last = st.last, t = anim ? now - anim.t0 : Infinity;
      g.font = fontN; g.textAlign = 'left'; g.fillStyle = C.muted;
      var labelY = sT + fs + 3;
      if (!last) {
        g.fillText(fit(['Your sample appears here: ' + n + ' random ' + (n === 1 ? p.one : p.noun) + ' picked from the population.',
          'Your sample of ' + n + ' ' + (n === 1 ? p.one : p.noun) + ' appears here.', 'Your sample appears here.'], plotW - 8), plotL + 4, labelY);
      } else {
        var head = 'Sample #' + group(last.no) + ': ' + n + ' ' + (n === 1 ? p.one : p.noun);
        g.fillText(head, plotL + 4, labelY);
        var hw = g.measureText(head).width;
        if (t >= SINGLE_MS * 0.55) {
          g.font = fontB; g.fillStyle = C.ink;
          g.fillText('  \u00B7  mean ' + p.fmtMean(last.mean), plotL + 4 + hw, labelY);
        }
        var dotTop = labelY + 5, dotBot = sT + sH - 6;
        var rad = (n <= 10 ? 4.5 : n <= 25 ? 3.8 : 3.2) * (W < 480 ? 0.85 : 1);
        var span = Math.max(0, dotBot - dotTop - 2 * rad);
        g.lineWidth = 1;
        for (i = 0; i < last.vals.length; i++) {
          var tApp = anim ? (n > 1 ? (i / (n - 1)) * 300 : 0) : -1e9;
          var prog = easeOut((t - tApp) / 220);
          if (prog <= 0) continue;
          var dx = xP(last.vals[i] + (hash01(i * 7 + 3) - 0.5) * Math.min(0.6, 6 / Math.max(1, plotW / (pv.hi - pv.lo))));
          var dyEnd = dotTop + rad + hash01(i * 13 + 1) * span;
          var dy = popBase + (dyEnd - popBase) * prog;
          g.globalAlpha = 0.9 * prog;
          g.beginPath(); g.arc(dx, dy, rad, 0, Math.PI * 2);
          g.fillStyle = C.s3; g.fill();
          g.strokeStyle = C.ink; g.globalAlpha = 0.35 * prog; g.stroke();
        }
        g.globalAlpha = 1;
        // mean marker in the strip
        var mT = SINGLE_MS * 0.55;
        if (t >= mT) {
          var ap = easeOut((t - mT) / 100);
          var mx = xP(last.mean), my = (dotTop + dotBot) / 2;
          var moveT = SINGLE_MS * 0.66;
          if (anim && t > moveT) {
            var mp = easeInOut((t - moveT) / (SINGLE_MS - moveT));
            var tgtX = xM(last.mean);
            var tgtY = L.meansTop + L.meansH - binHeightFor(mb, last.sum) - 7;
            mx = mx + (tgtX - mx) * mp;
            my = my + (tgtY - my) * mp;
          } else {
            g.globalAlpha = 0.5 * ap; g.strokeStyle = C.s4; g.lineWidth = 2;
            g.beginPath(); g.moveTo(xP(last.mean), dotTop - 2); g.lineTo(xP(last.mean), dotBot + 2); g.stroke();
          }
          g.globalAlpha = ap;
          diamond(mx, my, 7, C.s4, C.surface);
          g.globalAlpha = 1;
        }
      }

      /* --- means panel --- */
      var mTop = L.meansTop, mH = L.meansH, mBase = mTop + mH;
      var showCurve = st.showCurve && r.count >= 30;
      g.font = fontB; g.fillStyle = C.ink; g.textAlign = 'left';
      var mTitle = 'Sample means (n = ' + n + ') \u00B7 ' + group(r.count) + ' collected';
      g.fillText(mTitle, plotL, L.meansTitleY);
      if (st.showCurve && r.count < 30 && W > 420) {
        g.font = fontN; g.fillStyle = C.muted; g.textAlign = 'right';
        g.fillText('bell curve appears after 30 means', plotR, L.meansTitleY);
      } else if (st.zoom && W > 420) {
        g.font = fontN; g.fillStyle = C.muted; g.textAlign = 'right';
        g.fillText(W > 600 ? 'zoomed in on the yellow box above' : 'zoomed in', plotR, L.meansTitleY);
      }
      var yMax = yDisp > 0 ? yDisp : yTarget(mb);
      var yScale = (mH - 4) / yMax;
      // gridlines
      var yStep = niceStep(yMax, mH > 160 ? 4 : 3);
      if (yStep < 1) yStep = 1;
      g.strokeStyle = C.line; g.lineWidth = 1; g.font = fontN; g.fillStyle = C.muted; g.textAlign = 'right';
      for (gv = yStep; gv < yMax; gv += yStep) {
        gy = Math.round(mBase - gv * yScale) + 0.5;
        g.beginPath(); g.moveTo(plotL, gy); g.lineTo(plotR, gy); g.stroke();
        g.fillText(group(gv), plotL - 5, gy + 4);
      }
      g.save();
      g.beginPath(); g.rect(plotL, mTop - 2, plotW, mH + 2); g.clip();
      var barPx = plotW * mb.w / (mv.hi - mv.lo);
      var gapM = barPx > 14 ? barPx * 0.16 : (barPx > 5 ? 1 : 0);
      for (i = 0; i < mb.bins.length; i++) {
        var bn = mb.bins[i];
        if (!bn.c) continue;
        var bx0 = xM(p.lo + (bn.a - 0.5) / n) + gapM / 2, bx1 = xM(p.lo + (bn.b + 0.5) / n) - gapM / 2;
        var bh = bn.h * yScale;
        var hv = hover && hover.panel === 'means' && hover.j === bn.j;
        g.globalAlpha = hv ? 1 : 0.8; g.fillStyle = C.s4;
        g.fillRect(bx0, mBase - bh, Math.max(1, bx1 - bx0), bh);
        g.globalAlpha = 1;
        if (hv) { g.strokeStyle = C.ink; g.lineWidth = 1.5; g.strokeRect(bx0 + 0.75, mBase - bh + 0.75, Math.max(1, bx1 - bx0) - 1.5, bh - 0.75); }
      }
      if (showCurve) {
        var s = theorySD(), N = r.count, mu = p.mu, peakX = 0, peakY = Infinity;
        g.strokeStyle = C.s2; g.lineWidth = 2.25; g.lineJoin = 'round';
        g.beginPath();
        for (var px = 0; px <= plotW; px += 2) {
          var xv = mv.lo + (px / plotW) * (mv.hi - mv.lo);
          var yv = mBase - N * mb.w * normalPdf(xv, mu, s) * yScale;
          if (px === 0) g.moveTo(plotL + px, yv); else g.lineTo(plotL + px, yv);
          if (yv < peakY) { peakY = yv; peakX = plotL + px; }
        }
        g.stroke();
      }
      g.restore();
      // empty state
      if (r.count === 0 && !anim) {
        g.font = fontN; g.fillStyle = C.muted; g.textAlign = 'center';
        g.fillText(fit(['No sample means yet. Press \u201CDraw\u201D or tap the top chart.', 'No means yet. Press \u201CDraw\u201D.'], plotW - 8), plotL + plotW / 2, mTop + mH / 2 - 6);
      }
      g.strokeStyle = C.line; g.lineWidth = 1;
      g.beginPath(); g.moveTo(plotL, mBase + 0.5); g.lineTo(plotR, mBase + 0.5); g.stroke();
      drawMu(xM(p.mu), mTop, mBase, C, fontN, false);
      if (showCurve) {
        g.font = fontB; g.textAlign = 'left';
        var lblTxt = 'bell curve (theory)';
        var sPx = s / (mv.hi - mv.lo) * plotW;
        var lx = peakX + Math.max(10, sPx * 0.6), ly = Math.max(mTop + fs + 2, peakY - 6);
        if (lx + g.measureText(lblTxt).width > plotR - 2) { g.textAlign = 'right'; lx = peakX - Math.max(10, sPx * 0.6); }
        halo(lblTxt, lx, ly, C.s2, C.surface);
      }
      // overflow markers (zoom only)
      g.font = fontN; g.fillStyle = C.muted;
      if (mb.leftOut) { g.textAlign = 'left'; g.fillText('\u25C2 ' + group(mb.leftOut) + ' off chart', plotL + 2, mTop + fs); }
      if (mb.rightOut) { g.textAlign = 'right'; g.fillText(group(mb.rightOut) + ' off chart \u25B8', plotR - 2, mTop + fs + (st.showCurve && r.count < 30 ? 0 : 0)); }
      drawAxis(mv, xM, mBase, L.meansAxisY, C, fontN);

      /* --- tooltip --- */
      if (hover) drawTooltip(C, fontN, fontB, mb, xP, xM, popBase, popScale, probs, kp, yScale);
    }

    function binHeightFor(mb, sum) {
      var p = pop(), i = sum - st.n * p.lo, j = Math.floor(i / mb.k);
      var yMax = yDisp > 0 ? yDisp : yTarget(mb);
      for (var q2 = 0; q2 < mb.bins.length; q2++) {
        if (mb.bins[q2].j === j) {
          var bn = mb.bins[q2];
          return (bn.c + 1) * mb.k / (bn.b - bn.a + 1) * (lay.meansH - 4) / yMax;
        }
      }
      return 0;
    }
    function fit(options, maxW) {
      for (var i = 0; i < options.length; i++) if (g.measureText(options[i]).width <= maxW) return options[i];
      return options[options.length - 1];
    }
    function halo(txt, x, y, fill, edge) {
      g.lineJoin = 'round'; g.lineWidth = 4; g.strokeStyle = edge;
      g.strokeText(txt, x, y);
      g.fillStyle = fill; g.fillText(txt, x, y);
    }
    function diamond(x, y, s, fill, edge) {
      g.beginPath();
      g.moveTo(x, y - s); g.lineTo(x + s, y); g.lineTo(x, y + s); g.lineTo(x - s, y); g.closePath();
      g.fillStyle = fill; g.fill();
      g.lineWidth = 1.5; g.strokeStyle = edge; g.stroke();
    }
    function drawMu(x, top, base, C, fontN, label) {
      g.strokeStyle = C.ink; g.globalAlpha = 0.6; g.lineWidth = 1.25; g.setLineDash([4, 4]);
      g.beginPath(); g.moveTo(Math.round(x) + 0.5, top); g.lineTo(Math.round(x) + 0.5, base); g.stroke();
      g.setLineDash([]); g.globalAlpha = 1;
      if (label) {
        g.font = fontN; g.textAlign = 'left';
        halo('\u03BC = ' + pop().fmtMean(pop().mu), x + 5, top + lay.fs, C.ink, C.surface);
      }
    }
    function drawAxis(view, xf, base, labelY, C, fontN) {
      var p = pop(), span = view.hi - view.lo;
      var maxT = Math.max(3, Math.floor(lay.plotW / (p.id === 'income' ? 58 : 46)));
      var step = (p.id === 'die' && span <= 7) ? 1 : niceStep(span, maxT);
      var d = decimalsOf(step);
      g.font = fontN; g.fillStyle = C.muted; g.textAlign = 'center'; g.strokeStyle = C.line; g.lineWidth = 1;
      var lastR = -Infinity;
      for (var v = Math.ceil((view.lo - 1e-9) / step) * step; v <= view.hi + 1e-9; v += step) {
        var x = xf(v);
        g.beginPath(); g.moveTo(Math.round(x) + 0.5, base); g.lineTo(Math.round(x) + 0.5, base + 4); g.stroke();
        var txt = p.tick(v, d), w = g.measureText(txt).width;
        var tx = clamp(x, lay.padL - 6 + w / 2, W - 2 - w / 2);
        if (tx - w / 2 < lastR + 4) continue;
        g.fillText(txt, tx, labelY);
        lastR = tx + w / 2;
      }
    }
    function drawTooltip(C, fontN, fontB, mb, xP, xM, popBase, popScale, probs, kp, yScale) {
      var p = pop(), n = st.n, txt, ax, ay;
      if (hover.panel === 'pop') {
        var b = hover.j;
        if (b < 0 || b >= probs.length) return;
        var a = p.lo + b * kp, e = Math.min(p.hi, a + kp - 1), sp = 0;
        for (var i = a; i <= e; i++) sp += p.p[i - p.lo];
        txt = p.popRange(a, e) + ': ' + (sp * 100).toFixed(1) + '% ' + p.popUnit;
        ax = (xP(a - 0.5) + xP(e + 0.5)) / 2;
        ay = popBase - probs[b] * popScale;
      } else {
        var bn = null;
        for (var q2 = 0; q2 < mb.bins.length; q2++) if (mb.bins[q2].j === hover.j) bn = mb.bins[q2];
        if (!bn) return;
        var m1 = p.lo + bn.a / n, m2 = p.lo + bn.b / n;
        var pct = st.run.count ? (bn.c / st.run.count * 100).toFixed(1) : '0.0';
        txt = (bn.a === bn.b ? 'Mean ' + p.fmtMean(m1) : 'Means ' + p.fmtMean(m1) + '\u2013' + p.fmtMean(m2)) + ': ' + group(bn.c) + ' (' + pct + '%)';
        ax = (xM(p.lo + (bn.a - 0.5) / n) + xM(p.lo + (bn.b + 0.5) / n)) / 2;
        ay = lay.meansTop + lay.meansH - bn.h * yScale;
      }
      g.font = fontB;
      var w = g.measureText(txt).width + 16, h = lay.fs + 12;
      var x = clamp(ax - w / 2, 2, W - w - 2);
      var y = ay - h - 8;
      var minY = hover.panel === 'pop' ? 2 : lay.meansTop - lay.fs - 6;
      if (y < minY) y = minY;
      g.globalAlpha = 0.97; g.fillStyle = C.surface; rr(x, y, w, h, 6); g.fill();
      g.globalAlpha = 1; g.strokeStyle = C.line; g.lineWidth = 1; g.stroke();
      g.fillStyle = C.ink; g.textAlign = 'left';
      g.fillText(txt, x + 8, y + h - 7);
    }

    /* ---------- animation loop ---------- */
    function kick() { if (!raf && !destroyed) raf = requestAnimationFrame(frame); }
    function frame(now) {
      raf = 0;
      if (destroyed) return;
      var busy = false;
      if (anim) {
        if (now - anim.t0 >= SINGLE_MS) {
          commit(anim.s.sum);
          anim = null;
          afterCommit();
          announceBatch(1);
        } else busy = true;
      }
      if (!anim && pending > 0) {
        var k = Math.min(pending, batchRate), s = null;
        for (var i = 0; i < k; i++) {
          s = drawOne(i === k - 1);
          if (i === k - 1) st.last = lastFrom(s);
          commit(s.sum);
        }
        pending -= k;
        afterCommit();
        if (pending === 0) { announceBatch(batchSize); batchSize = 0; }
        busy = true;
      }
      frameBins = computeMeansBins();
      var tgt = yTarget(frameBins);
      if (!yInit || yDisp <= 0) { yDisp = tgt; yInit = true; }
      else if (Math.abs(yDisp - tgt) > tgt * 0.004) { yDisp += (tgt - yDisp) * 0.25; busy = true; }
      else yDisp = tgt;
      draw(now);
      frameBins = null;
      if (busy || pending > 0) kick();
    }

    /* ---------- sizing ---------- */
    function resize() {
      var rect = wrap.getBoundingClientRect();
      var wantTall = tall ? rect.width < 580 : rect.width < 540;
      if (wantTall !== tall) {
        tall = wantTall;
        wrap.style.aspectRatio = tall ? '1 / 1' : '';
        rect = wrap.getBoundingClientRect();
      }
      var cr = canvas.getBoundingClientRect();
      dpr = Math.min(3, window.devicePixelRatio || 1);
      W = Math.max(1, cr.width); H = Math.max(1, cr.height);
      var bw = Math.round(W * dpr), bh = Math.round(H * dpr);
      if (canvas.width !== bw) canvas.width = bw;
      if (canvas.height !== bh) canvas.height = bh;
      lay = computeLayout();
      kick();
    }
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { resize(); }); ro.observe(wrap); }
    else window.addEventListener('resize', resize);

    /* ---------- pointer & keyboard ---------- */
    function local(e) {
      var r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function regionAt(pt) {
      if (!lay) return null;
      if (pt.y <= lay.popAxisY + 2) return 'pop';
      if (pt.y >= lay.meansTitleY - lay.fs - 4) return 'means';
      return 'strip';
    }
    function hitBin(pt, region) {
      var p = pop(), x = pt.x;
      if (x < lay.padL || x > lay.padL + lay.plotW) return null;
      if (region === 'pop') {
        var pv = popView(), v = pv.lo + (x - lay.padL) / lay.plotW * (pv.hi - pv.lo);
        var j = Math.floor((Math.round(v) - p.lo) / popK());
        return j >= 0 && j < Math.ceil(p.L / popK()) ? { panel: 'pop', j: j } : null;
      }
      if (region === 'means') {
        var mb = computeMeansBins(), mv = mb.view;
        var vm = mv.lo + (x - lay.padL) / lay.plotW * (mv.hi - mv.lo);
        var jm = Math.floor(((vm - p.lo) * st.n + 0.5) / mb.k);
        for (var i = 0; i < mb.bins.length; i++) if (mb.bins[i].j === jm && mb.bins[i].c > 0) return { panel: 'means', j: jm };
      }
      return null;
    }
    function sameHover(a, b) { return (!a && !b) || (a && b && a.panel === b.panel && a.j === b.j); }
    function onMove(e) {
      var pt = local(e), reg = regionAt(pt);
      canvas.style.cursor = reg === 'pop' ? 'pointer' : 'default';
      var h = reg ? hitBin(pt, reg) : null;
      if (!sameHover(h, hover)) { hover = h; kick(); }
    }
    function onDown(e) {
      var pt = local(e), reg = regionAt(pt);
      if (reg === 'pop') { request(1); }
      var h = reg ? hitBin(pt, reg) : null;
      if (e.pointerType !== 'mouse' || !sameHover(h, hover)) { hover = h; kick(); }
    }
    function onLeave() { if (hover && !hover.kb) { hover = null; kick(); } }
    function onBlur() { if (hover && hover.kb) { hover = null; kick(); } }
    function onKey(e) {
      var key = e.key;
      if (key === 'Enter' || key === ' ' || key === 'Spacebar') { e.preventDefault(); request(1); return; }
      if (key === 'Escape') { hover = null; kick(); return; }
      if (key !== 'ArrowLeft' && key !== 'ArrowRight') return;
      e.preventDefault();
      var dir = key === 'ArrowRight' ? 1 : -1;
      var p = pop();
      if (st.run.count > 0) {
        var mb = computeMeansBins(), filled = mb.bins.filter(function (b) { return b.c > 0; });
        if (!filled.length) return;
        var idx = -1;
        if (hover && hover.panel === 'means') for (var i = 0; i < filled.length; i++) if (filled[i].j === hover.j) idx = i;
        if (idx < 0) {
          var cj = Math.floor(Math.round((p.mu - p.lo) * st.n) / mb.k);
          idx = 0;
          for (i = 0; i < filled.length; i++) if (Math.abs(filled[i].j - cj) < Math.abs(filled[idx].j - cj)) idx = i;
        } else idx = clamp(idx + dir, 0, filled.length - 1);
        var bn = filled[idx];
        hover = { panel: 'means', j: bn.j, kb: true };
        var m1 = p.lo + bn.a / st.n, m2 = p.lo + bn.b / st.n;
        setText(el.status, 'status', (bn.a === bn.b ? 'Mean ' + p.fmtMean(m1) : 'Means ' + p.fmtMean(m1) + ' to ' + p.fmtMean(m2)) + ': ' + group(bn.c) + ' of ' + group(st.run.count) + ' sample means.');
      } else {
        var nb = Math.ceil(p.L / popK());
        var j = hover && hover.panel === 'pop' ? clamp(hover.j + dir, 0, nb - 1) : Math.floor(Math.round(p.mu - p.lo) / popK());
        hover = { panel: 'pop', j: j, kb: true };
        var a = p.lo + j * popK(), e2 = Math.min(p.hi, a + popK() - 1), sp = 0;
        for (var v = a; v <= e2; v++) sp += p.p[v - p.lo];
        setText(el.status, 'status', p.popRange(a, e2) + ': ' + (sp * 100).toFixed(1) + '% ' + p.popUnit + '.');
      }
      kick();
    }
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('keydown', onKey);
    canvas.addEventListener('blur', onBlur);

    /* ---------- control listeners ---------- */
    function onPop(e) { setPop(e.currentTarget.getAttribute('data-pop')); }
    function onZoom(e) {
      var z = e.currentTarget.getAttribute('data-zoom') === '1';
      if (z === st.zoom) return;
      st.zoom = z; hover = null; yInit = false;
      syncControls(); kick();
    }
    function onDraw(e) { request(+e.currentTarget.getAttribute('data-draw')); }
    function onQuick(e) { setN(+e.currentTarget.getAttribute('data-n')); }
    function onSlider() { setN(+slider.value); }
    function onCurve() { st.showCurve = curveBox.checked; yInit = true; kick(); }
    var clearBtn = q('[data-r="clear"]');
    popBtns.forEach(function (b) { b.addEventListener('click', onPop); });
    zoomBtns.forEach(function (b) { b.addEventListener('click', onZoom); });
    drawBtns.forEach(function (b) { b.addEventListener('click', onDraw); });
    nBtns.forEach(function (b) { b.addEventListener('click', onQuick); });
    slider.addEventListener('input', onSlider);
    slider.addEventListener('change', onSlider);
    curveBox.addEventListener('change', onCurve);
    clearBtn.addEventListener('click', clearMeans);

    function onTheme() { kick(); }
    if (darkMQ) { if (darkMQ.addEventListener) darkMQ.addEventListener('change', onTheme); else if (darkMQ.addListener) darkMQ.addListener(onTheme); }
    document.addEventListener('themechange', onTheme);

    /* ---------- starting state: 400 samples of 10 households ---------- */
    for (var tid in taskLis) if (isDone(tid)) { doneLocal[tid] = true; taskLis[tid].className = 'done'; }
    newRun();
    for (i = 0; i < 400; i++) {
      var s0 = drawOne(i === 399);
      if (i === 399) st.last = lastFrom(s0);
      commit(s0.sum);
    }
    if (st.run.count >= 200) st.best[st.popId + '|' + st.n] = { sd: runStats(st.run).sd, count: st.run.count };
    syncControls();
    setText(el.status, 'status', 'To get you started we already drew 400 samples of 10 households each. Try n = 1, or n = 40, and press Draw 1000.');
    resize();

    return {
      destroy: function () {
        destroyed = true;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
        canvas.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerdown', onDown);
        canvas.removeEventListener('pointerleave', onLeave);
        canvas.removeEventListener('keydown', onKey);
        canvas.removeEventListener('blur', onBlur);
        popBtns.forEach(function (b) { b.removeEventListener('click', onPop); });
        zoomBtns.forEach(function (b) { b.removeEventListener('click', onZoom); });
        drawBtns.forEach(function (b) { b.removeEventListener('click', onDraw); });
        nBtns.forEach(function (b) { b.removeEventListener('click', onQuick); });
        slider.removeEventListener('input', onSlider);
        slider.removeEventListener('change', onSlider);
        curveBox.removeEventListener('change', onCurve);
        clearBtn.removeEventListener('click', clearMeans);
        if (darkMQ) { if (darkMQ.removeEventListener) darkMQ.removeEventListener('change', onTheme); else if (darkMQ.removeListener) darkMQ.removeListener(onTheme); }
        document.removeEventListener('themechange', onTheme);
        root.innerHTML = '';
      }
    };
  }

  Labs.clt = {
    id: 'clt',
    module: 'l1-stats',
    title: 'Sample means & the bell curve',
    summary: 'Draw many random samples, average each one, and watch those averages pile up into a bell curve, even when the population itself is lopsided.',
    tasks: TASKS,
    mount: mount
  };
})();
