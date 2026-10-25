/* AI Marg lab: feature scaling, encoding and data leakage.
   Part 1: the 5 nearest neighbours of a loan applicant with no scaling, min-max scaling or standard scaling.
   Part 2: a city column as label encoding (0, 1, 2, 3) versus one-hot encoding.
   Part 3: standard scaling fitted on the training rows only (like a scikit-learn Pipeline) versus on all rows (leakage).
   Plain classic script (ES2019). Registers window.AILabs.scaling. No libraries, no network, no storage. */
(function () {
  'use strict';
  var Labs = (window.AILabs = window.AILabs || {});
  var mountCount = 0;

  /* ---------- constants ---------- */
  var K = 5;                                   // neighbours, in every part
  // Part 1: 30 applicants. Seed and query picked so the unscaled neighbours of a 31-year-old are all 45 or older.
  var P1_SEED = 2258, P1_N = 30, P1_QUERY = 19;
  var NAMES = ['Aarav', 'Priya', 'Rahul', 'Sneha', 'Vikram', 'Ananya', 'Arjun', 'Kavya', 'Rohan', 'Meera',
    'Karan', 'Divya', 'Suresh', 'Pooja', 'Aditya', 'Neha', 'Manoj', 'Lakshmi', 'Farhan', 'Ishaan',
    'Fatima', 'Gaurav', 'Anjali', 'Harpreet', 'Deepa', 'Ravi', 'Shreya', 'Joseph', 'Nisha', 'Tenzin'];
  var INC_LO = 0, INC_HI = 31e5, AGE_LO = 18, AGE_HI = 63;     // chart axes
  var SCALES = {
    none: { label: 'No scaling', short: 'None' },
    minmax: { label: 'Min-max', short: 'Min-max' },
    std: { label: 'Standard (z-score)', short: 'Standard' }
  };
  // Part 2
  var CITIES = ['Mumbai', 'Delhi', 'Pune', 'Chennai'];
  // Part 3: 40 loans from 2019 (training) and 20 from 2025 (test). Default risk depends on age and on income
  // compared with that year's normal pay. The seed gives no distance ties at any slider setting, so the
  // scores match scikit-learn's KNeighborsClassifier exactly.
  var P3 = { seed: 3975, ntr: 40, nte: 20, med: 7e5, ageInc: 0.25, sdl: 0.38, b0: -0.3, bAge: 1.6, bInc: 0.5 };
  var RISE_MAX = 10, RISE_START = 6;           // slider steps of 10%: 0% to 100%, starting at 60%
  var P3_START_ROW = 3;                        // 2025 row 4: its prediction flips when the scaler leaks
  var ANIM_MS = 450;

  var TASKS = [
    { id: 't1', part: 1, text: 'Part 1: switch from No scaling to Min-max or Standard scaling and watch the 5 nearest neighbours change.' },
    { id: 't2', part: 1, text: 'Part 1: find out which feature decides the distance when nothing is scaled, then answer the quick check under the table.' },
    { id: 't3', part: 2, text: 'Part 2: spot the fake order. With label encoding, measure Mumbai to Chennai (3 steps apart, as if they were the most different cities), then measure the same pair with one-hot.' },
    { id: 't4', part: 3, text: 'Part 3: let the scaler learn from all rows (the leak) and see the 2025 test score look better than the honest Pipeline score.' }
  ];

  /* ---------- small helpers ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) {
    var u = 0;
    while (u === 0) u = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  // Indian digit grouping: 1234567 -> 12,34,567
  function groupIN(s) { return s.length > 3 ? s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3) : s; }
  function inr(v) { return (v < 0 ? '−' : '') + '₹' + groupIN(String(Math.round(Math.abs(v)))); }
  function numIN(v, d) {
    var s = Math.abs(v).toFixed(d), i = s.indexOf('.');
    var ip = i < 0 ? s : s.slice(0, i), fp = i < 0 ? '' : s.slice(i);
    return (v < 0 && parseFloat(s) !== 0 ? '−' : '') + groupIN(ip) + fp;
  }
  function fx(v, d) { var s = Math.abs(v).toFixed(d); return (v < 0 && parseFloat(s) !== 0 ? '−' : '') + s; }
  function signed(v, d) { var s = Math.abs(v).toFixed(d); return parseFloat(s) === 0 ? s : (v < 0 ? '−' : '+') + s; }
  function sharePct(s) { return s > 0.9999 ? '> 99.99%' : s < 0.0001 ? '< 0.01%' : (100 * s).toFixed(1) + '%'; }
  function pct(c, n) { return n ? Math.round(100 * c / n) + '%' : '—'; }
  // population mean and SD (divide by n), the same as scikit-learn's StandardScaler (ddof = 0)
  function meanSd(arr) {
    var n = arr.length, m = 0, v = 0, i;
    for (i = 0; i < n; i++) m += arr[i];
    m /= n;
    for (i = 0; i < n; i++) v += (arr[i] - m) * (arr[i] - m);
    return { m: m, s: Math.sqrt(v / n) };
  }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  /* ---------- the example data ---------- */
  function makeApplicants() {
    var r = mulberry32(P1_SEED), a = [];
    for (var i = 0; i < P1_N; i++) {
      var age = 21 + Math.floor(r() * 40);
      var inc = Math.exp(Math.log(8e5) + 0.35 * (age - 40) / 19 + 0.55 * gauss(r));
      inc = Math.min(30e5, Math.max(2e5, inc));
      inc = Math.round(inc / 10000) * 10000;
      a.push({ i: i, name: NAMES[i], age: age, inc: inc });
    }
    return a;
  }
  function makeLoans() {
    var r = mulberry32(P3.seed), rows = [];
    for (var i = 0; i < P3.ntr + P3.nte; i++) {
      var age = 21 + Math.floor(r() * 40);
      var inc = Math.exp(Math.log(P3.med) + P3.ageInc * (age - 40) / 19 + P3.sdl * gauss(r));
      inc = Math.min(30e5, Math.max(2e5, inc));
      inc = Math.round(inc / 10000) * 10000;
      var z = P3.b0 - P3.bAge * (age - 40) / 10 - P3.bInc * Math.log(inc / P3.med);
      var y = r() < 1 / (1 + Math.exp(-z)) ? 1 : 0;      // 1 = defaulted, 0 = repaid
      rows.push({ age: age, base: inc, y: y, test: i >= P3.ntr });
    }
    return rows;
  }

  /* ---------- colour helpers (theme colours come from CSS variables) ---------- */
  var parseCtx = null;
  function toRgb(str) {
    if (!parseCtx) parseCtx = document.createElement('canvas').getContext('2d');
    parseCtx.fillStyle = '#000000';
    parseCtx.fillStyle = str || '#000000';
    var v = parseCtx.fillStyle;
    if (v.charAt(0) === '#') return [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16)];
    var m = v.match(/[\d.]+/g) || [0, 0, 0];
    return [+m[0], +m[1], +m[2]];
  }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function readTheme() {
    var cs = getComputedStyle(document.documentElement);
    function v(n) { return cs.getPropertyValue(n).trim(); }
    var T = {
      surface: v('--surface'), surface2: v('--surface-2'), ink: v('--ink'), muted: v('--muted'), line: v('--line'),
      indigo: v('--indigo'), haldi: v('--haldi'), s1: v('--series-1'), s2: v('--series-2'),
      font: v('--font-body') || 'system-ui, sans-serif', mono: v('--font-mono') || 'monospace'
    };
    T.indigoRgb = toRgb(T.indigo); T.s1Rgb = toRgb(T.s1); T.s2Rgb = toRgb(T.s2); T.inkRgb = toRgb(T.ink); T.haldiRgb = toRgb(T.haldi);
    return T;
  }

  /* ---------- small SVG swatches for the HTML legends ---------- */
  function swatch(kind, fill, stroke, sw, dash) {
    var p;
    if (kind === 'square') p = '<rect x="2.5" y="2.5" width="9" height="9"/>';
    else if (kind === 'star') p = '<polygon points="7,0.6 8.9,5 13.6,5.2 9.9,8.2 11.2,12.9 7,10.2 2.8,12.9 4.1,8.2 0.4,5.2 5.1,5"/>';
    else if (kind === 'line') p = '<path d="M1 12 L13 2"/>';
    else if (kind === 'patch') p = '<rect x="1" y="1" width="12" height="12" rx="2"/>';
    else p = '<circle cx="7" cy="7" r="' + (kind === 'ring' ? 5.2 : 5) + '"/>';
    return '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false" style="flex:none;overflow:visible;fill:' + fill +
      ';stroke:' + stroke + ';stroke-width:' + sw + (dash ? ';stroke-dasharray:' + dash : '') + '">' + p + '</svg>';
  }
  function legendItem(svg, text) { return '<i style="font-style:normal;display:inline-flex;align-items:center;gap:6px">' + svg + text + '</i>'; }

  /* ================================================================ */
  function mount(root, ctx) {
    var P = 'scl' + (++mountCount) + '-';
    var listeners = [];
    function on(el, type, fn, opts) { el.addEventListener(type, fn, opts); listeners.push([el, type, fn, opts]); }
    var destroyed = false;
    var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    /* ---------- data and fitted numbers ---------- */
    var A = makeApplicants();
    var incs = A.map(function (p) { return p.inc; }), ages = A.map(function (p) { return p.age; });
    var FIT1 = {
      incMin: Math.min.apply(null, incs), incMax: Math.max.apply(null, incs),
      ageMin: Math.min.apply(null, ages), ageMax: Math.max.apply(null, ages),
      inc: meanSd(incs), age: meanSd(ages)
    };
    // scaled value = (value - centre) / spread, for each feature
    function scaler(mode) {
      if (mode === 'minmax') return { ci: FIT1.incMin, si: FIT1.incMax - FIT1.incMin, ca: FIT1.ageMin, sa: FIT1.ageMax - FIT1.ageMin };
      if (mode === 'std') return { ci: FIT1.inc.m, si: FIT1.inc.s, ca: FIT1.age.m, sa: FIT1.age.s };
      return { ci: 0, si: 1, ca: 0, sa: 1 };
    }
    // the K nearest other applicants by Euclidean distance on the scaled features (ties: lower index first)
    function neighbours(q, mode) {
      var sc = scaler(mode), out = [];
      for (var j = 0; j < A.length; j++) {
        if (j === q) continue;
        var di = (A[j].inc - A[q].inc) / sc.si, da = (A[j].age - A[q].age) / sc.sa;
        var d2 = di * di + da * da;
        out.push({ j: j, di: di, da: da, d2: d2, d: Math.sqrt(d2), share: d2 > 0 ? di * di / d2 : 0 });
      }
      out.sort(function (a, b) { return a.d2 - b.d2 || a.j - b.j; });
      return out.slice(0, K);
    }
    var byIncome = A.map(function (p) { return p.i; }).sort(function (a, b) { return A[a].inc - A[b].inc || a - b; });
    var byAge = A.map(function (p) { return p.i; }).sort(function (a, b) { return A[a].age - A[b].age || A[a].inc - A[b].inc || a - b; });

    var L = makeLoans();
    var TRAIN = [], TEST = [];
    L.forEach(function (r, i) { (r.test ? TEST : TRAIN).push(i); });
    function incomeAt(r, riseIdx) { return r.test ? Math.round(r.base * (1 + riseIdx / 10) / 1000) * 1000 : r.base; }
    // Fit the scaler (on the training rows, or on all rows), scale everything, then a 5-NN model trained on 2019 predicts 2025.
    function evalLeak(riseIdx, all) {
      var fitIdx = all ? L.map(function (r, i) { return i; }) : TRAIN;
      var si = meanSd(fitIdx.map(function (i) { return incomeAt(L[i], riseIdx); }));
      var sa = meanSd(fitIdx.map(function (i) { return L[i].age; }));
      var zx = new Float64Array(L.length), zy = new Float64Array(L.length), i;
      for (i = 0; i < L.length; i++) { zx[i] = (incomeAt(L[i], riseIdx) - si.m) / si.s; zy[i] = (L[i].age - sa.m) / sa.s; }
      var pred = [], nbrs = [], votes = [], correct = 0, sumZ = 0;
      TEST.forEach(function (t) {
        var d = TRAIN.map(function (j, k) { var dx = zx[t] - zx[j], dy = zy[t] - zy[j]; return { d: dx * dx + dy * dy, j: j, k: k }; });
        d.sort(function (a, b) { return a.d - b.d || a.k - b.k; });
        var v = 0, ids = [];
        for (var k = 0; k < K; k++) { v += L[d[k].j].y; ids.push(d[k].j); }
        var p = v * 2 > K ? 1 : 0;
        pred.push(p); nbrs.push(ids); votes.push(v);
        if (p === L[t].y) correct++;
        sumZ += zx[t];
      });
      return { si: si, sa: sa, zx: zx, zy: zy, pred: pred, nbrs: nbrs, votes: votes, correct: correct, avgZ: sumZ / TEST.length, nFit: fitIdx.length };
    }

    /* ---------- state ---------- */
    var S = {
      part: 1,
      scale: 'none', query: P1_QUERY, hover: -1,
      enc: 'label', pa: 0, pb: 1, yaw: 0.62, pitch: 0.42,
      fitAll: false, rise: RISE_START, sel: P3_START_ROW,
      quiz: '', seenLabelMC: false, seenOneHotMC: false
    };
    var NB = null, NB0 = null;     // part 1: neighbours now, and with no scaling
    var R3 = null;                 // part 3: { honest, leak } at the current salary rise
    var done = {};

    /* ---------- DOM ---------- */
    var tasksHtml = TASKS.map(function (t) { return '<li data-task="' + t.id + '">' + t.text + '</li>'; }).join('');
    var queryOpts = byIncome.map(function (i) { return '<option value="' + i + '">' + A[i].name + ' · ' + A[i].age + ' yrs · ' + inr(A[i].inc) + '</option>'; }).join('');
    var cityOpts = CITIES.map(function (c, i) { return '<option value="' + i + '">' + c + '</option>'; }).join('');
    function stat(id, k) { return '<div class="stat" style="display:flex;flex-direction:column;justify-content:space-between"><div class="k">' + k + '</div><div class="v" id="' + P + id + '">—</div></div>'; }
    var thSticky = ' style="position:sticky;top:0;background:var(--surface);z-index:1;white-space:normal;vertical-align:bottom;min-width:5.5em"';

    var labEl = document.createElement('div');
    labEl.className = 'lab';
    labEl.innerHTML =
      '<p class="lab-note" id="' + P + 'note"></p>' +
      '<div class="control"><span class="control-label" id="' + P + 'partlbl">Part</span>' +
        '<div class="seg" role="group" aria-labelledby="' + P + 'partlbl">' +
          '<button type="button" data-part-btn="1" aria-pressed="true">1 · Scaling</button>' +
          '<button type="button" data-part-btn="2" aria-pressed="false">2 · Encoding</button>' +
          '<button type="button" data-part-btn="3" aria-pressed="false">3 · Leakage</button>' +
        '</div></div>' +
      '<div class="lab-body">' +
        '<div class="stack-sm">' +
          '<div class="lab-canvas-wrap" id="' + P + 'wrap"><canvas id="' + P + 'cv" tabindex="0" role="img" aria-label="Chart" style="outline-offset:-3px;touch-action:manipulation"></canvas></div>' +
          '<div class="lab-legend" id="' + P + 'legend"></div>' +
          '<div class="stack-sm" id="' + P + 'info">' +
          '<p class="small" id="' + P + 'readout" style="min-height:3.2em"></p>' +
          '<div class="lab-stats" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr))" data-part="1">' + stat('s1scale', 'Scaling') + stat('s1share', 'Income’s share') + stat('s1new', 'New vs unscaled') + stat('s1ages', 'Neighbours’ ages') + '</div>' +
          '<div class="lab-stats" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr))" data-part="2" hidden>' + stat('s2enc', 'Encoding') + stat('s2cols', 'Columns') + stat('s2pair', 'This pair') + stat('s2kinds', 'Different distances') + '</div>' +
          '<div class="lab-stats" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr))" data-part="3" hidden>' + stat('s3mean', 'Mean income used') + stat('s3sd', 'SD of income used') + stat('s3z', '2025 avg scaled income') + stat('s3acc', '2025 test accuracy') + '</div>' +
          '<p class="kbd-hint" id="' + P + 'kbd"></p>' +
          '</div>' +
          '<p class="visually-hidden" role="status" aria-live="polite" id="' + P + 'live"></p>' +
        '</div>' +
        '<div class="lab-controls">' +
          // part 1 controls
          '<div class="stack" data-part="1">' +
            '<div class="control"><span class="control-label" id="' + P + 'sclbl">Scaling</span>' +
              '<div class="seg" role="group" aria-labelledby="' + P + 'sclbl">' +
                '<button type="button" data-scale="none" aria-pressed="true">No scaling</button>' +
                '<button type="button" data-scale="minmax" aria-pressed="false">Min-max</button>' +
                '<button type="button" data-scale="std" aria-pressed="false">Standard</button>' +
              '</div>' +
              '<p class="small muted" id="' + P + 'scdesc"></p></div>' +
            '<div class="control"><label for="' + P + 'query">Query applicant</label>' +
              '<select id="' + P + 'query">' + queryOpts + '</select>' +
              '<p class="small muted">Or click or tap any dot on the chart to make that person the query.</p></div>' +
            '<div><button type="button" class="btn btn-sm" data-goto="2">Next: Part 2, encoding</button></div>' +
          '</div>' +
          // part 2 controls
          '<div class="stack" data-part="2" hidden>' +
            '<div class="control"><span class="control-label" id="' + P + 'enclbl">Encoding</span>' +
              '<div class="seg" role="group" aria-labelledby="' + P + 'enclbl">' +
                '<button type="button" data-enc="label" aria-pressed="true">Label encoding</button>' +
                '<button type="button" data-enc="onehot" aria-pressed="false">One-hot</button>' +
              '</div>' +
              '<p class="small muted" id="' + P + 'encdesc"></p></div>' +
            '<div class="row" style="gap:12px;align-items:flex-start">' +
              '<div class="control" style="flex:1 1 110px"><label for="' + P + 'ca">From city</label><select id="' + P + 'ca">' + cityOpts + '</select></div>' +
              '<div class="control" style="flex:1 1 110px"><label for="' + P + 'cb">To city</label><select id="' + P + 'cb">' + cityOpts + '</select></div>' +
            '</div>' +
            '<p class="small muted" id="' + P + 'p2hint"></p>' +
            '<div><button type="button" class="btn btn-sm" data-goto="3">Next: Part 3, leakage</button></div>' +
          '</div>' +
          // part 3 controls
          '<div class="stack" data-part="3" hidden>' +
            '<div class="control"><span class="control-label" id="' + P + 'fitlbl">The scaler learns its mean and SD from</span>' +
              '<div class="seg" role="group" aria-labelledby="' + P + 'fitlbl">' +
                '<button type="button" data-fit="train" aria-pressed="true">2019 rows only</button>' +
                '<button type="button" data-fit="all" aria-pressed="false">All rows (leak)</button>' +
              '</div>' +
              '<p class="small muted" id="' + P + 'fitdesc"></p></div>' +
            '<div class="control"><label for="' + P + 'rise">Salary rise, 2019 to 2025 <output id="' + P + 'riseout" for="' + P + 'rise"></output></label>' +
              '<input type="range" id="' + P + 'rise" min="0" max="' + RISE_MAX + '" step="1" value="' + RISE_START + '">' +
              '<p class="small muted">Prices rose just as much, so who repays still depends on age and on income compared with that year’s normal pay.</p></div>' +
            '<div class="control"><label for="' + P + 'sel">Look closer at a 2025 row</label>' +
              '<select id="' + P + 'sel"></select>' +
              '<p class="small muted">Or click or tap a big shape on the chart. Lines join it to the 5 training rows that vote on it.</p></div>' +
          '</div>' +
          '<div class="stack-sm" id="' + P + 'taskbox"><h2 class="lab-h">Your tasks</h2><ul class="lab-tasks" id="' + P + 'tasks">' + tasksHtml + '</ul></div>' +
        '</div>' +
      '</div>' +
      // part 1 details
      '<div class="stack-sm" data-part="1">' +
        '<h2 class="lab-h">Distance to each neighbour, split by feature</h2>' +
        '<p class="small muted">Euclidean distance = √(income gap² + age gap²), using the numbers after scaling. The two squared gaps add up, so the last column shows how much of that sum comes from income.</p>' +
        '<div class="table-wrap" style="position:relative;width:0;min-width:100%" tabindex="0" role="region" aria-label="Distance to each neighbour"><table class="simple num" style="white-space:nowrap" id="' + P + 't1"></table></div>' +
        '<p class="small" id="' + P + 'formula"></p>' +
        '<h2 class="lab-h" id="' + P + 'qh" style="margin-top:8px">Quick check</h2>' +
        '<p id="' + P + 'qtext">With no scaling, which feature decides who counts as nearest?</p>' +
        '<div class="row" role="group" aria-labelledby="' + P + 'qtext">' +
          '<button type="button" class="btn btn-sm" data-ans="inc" aria-pressed="false">Income</button>' +
          '<button type="button" class="btn btn-sm" data-ans="age" aria-pressed="false">Age</button>' +
          '<button type="button" class="btn btn-sm" data-ans="both" aria-pressed="false">Both about equally</button>' +
        '</div>' +
        '<p class="small" id="' + P + 'qfb" aria-live="polite"></p>' +
        '<p class="small muted">The scalers in this part learn from all 30 applicants, which is fine for exploring. Part 3 shows why a real model must learn them from the training rows only.</p>' +
      '</div>' +
      // part 2 details
      '<div class="stack-sm" data-part="2" hidden>' +
        '<div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));align-items:start">' +
          '<div class="stack-sm" style="min-width:0"><h2 class="lab-h">How each city becomes numbers</h2>' +
            '<div class="table-wrap" style="position:relative;width:0;min-width:100%" tabindex="0" role="region" aria-label="How each city becomes numbers"><table class="simple num" style="white-space:nowrap" id="' + P + 'tenc"></table></div></div>' +
          '<div class="stack-sm" style="min-width:0"><h2 class="lab-h">Distance between every pair of cities</h2>' +
            '<div class="table-wrap" style="position:relative;width:0;min-width:100%" tabindex="0" role="region" aria-label="Distance between every pair of cities"><table class="simple num" style="white-space:nowrap" id="' + P + 'tdist"></table></div></div>' +
        '</div>' +
        '<p class="small muted">scikit-learn calls label encoding of an input column <code>OrdinalEncoder</code> (its <code>LabelEncoder</code> is meant for the answer column). Without <code>categories=</code>, both encoders below sort the names alphabetically, so Chennai would get 0 and Pune 3: a different order, but just as made up.</p>' +
        '<h2 class="lab-h">The same in scikit-learn</h2>' +
        '<pre tabindex="0" aria-label="Python code for both encodings" style="width:0;min-width:100%"><code>' +
          'from sklearn.preprocessing import OrdinalEncoder, OneHotEncoder\n\n' +
          'order = [[\'Mumbai\', \'Delhi\', \'Pune\', \'Chennai\']]\n\n' +
          'label = OrdinalEncoder(categories=order)\n' +
          'label.fit_transform(df[[\'city\']])     # one column: Mumbai 0, Delhi 1, Pune 2, Chennai 3\n\n' +
          'onehot = OneHotEncoder(categories=order, sparse_output=False)\n' +
          'onehot.fit_transform(df[[\'city\']])    # four 0/1 columns: Mumbai [1, 0, 0, 0] ... Chennai [0, 0, 0, 1]' +
        '</code></pre>' +
      '</div>' +
      // part 3 details
      '<div class="stack-sm" data-part="3" hidden>' +
        '<p class="callout small" id="' + P + 'verdict"></p>' +
        '<h2 class="lab-h">Why did the score change?</h2>' +
        '<p class="small" id="' + P + 'why"></p>' +
        '<h2 class="lab-h">The 20 test rows from 2025</h2>' +
        '<p class="small muted">Scaled income = (income − mean) ÷ SD, with each scaler’s own mean and SD. The SD is the population SD (divide by n, ddof=0), which is what scikit-learn’s <code>StandardScaler</code> uses; pandas’ <code>.std()</code> divides by n − 1 instead. Rows in bold change their prediction when the scaler leaks.</p>' +
        '<div class="table-wrap" style="position:relative;width:0;min-width:100%;max-height:24em;overflow:auto" tabindex="0" role="region" aria-label="The 20 test rows from 2025"><table class="simple num" style="white-space:nowrap" id="' + P + 't3"></table></div>' +
        '<h2 class="lab-h">The scikit-learn code</h2>' +
        '<p class="small muted" id="' + P + 'codenote"></p>' +
        '<pre tabindex="0" aria-label="Python code for this way of scaling" style="width:0;min-width:100%"><code id="' + P + 'code"></code></pre>' +
      '</div>' +
      '<p class="small muted"><strong style="color:var(--ink)">Why it matters in real ML:</strong> models that measure distance or learn by gradient descent (KNN, K-Means, SVMs, neural networks) need scaled features, while tree models such as random forests mostly do not care. Unordered categories such as cities need one-hot encoding for most models. And every preparation step (scaling, encoding, filling gaps) must learn from the training rows only; a scikit-learn <code>Pipeline</code> does that for you, so your test score stays an honest preview.</p>';
    root.appendChild(labEl);

    function $(id) { return labEl.querySelector('#' + P + id); }
    var wrap = $('wrap'), canvas = $('cv'), g = canvas.getContext('2d');
    var elNote = $('note'), elLegend = $('legend'), elReadout = $('readout'), elLive = $('live'), elKbd = $('kbd');
    var elScDesc = $('scdesc'), elQuery = $('query'), elT1 = $('t1'), elFormula = $('formula'), elQfb = $('qfb');
    var elEncDesc = $('encdesc'), elCa = $('ca'), elCb = $('cb'), elP2hint = $('p2hint'), elTenc = $('tenc'), elTdist = $('tdist');
    var elFitDesc = $('fitdesc'), elRise = $('rise'), elRiseOut = $('riseout'), elSel = $('sel'), elVerdict = $('verdict'), elWhy = $('why'), elT3 = $('t3'), elCode = $('code'), elCodeNote = $('codenote');
    var partEls = labEl.querySelectorAll('[data-part]'), partBtns = labEl.querySelectorAll('[data-part-btn]');
    var scaleBtns = labEl.querySelectorAll('[data-scale]'), encBtns = labEl.querySelectorAll('[data-enc]'), fitBtns = labEl.querySelectorAll('[data-fit]'), ansBtns = labEl.querySelectorAll('[data-ans]');
    var taskEls = {};
    Array.prototype.forEach.call(labEl.querySelectorAll('[data-task]'), function (li) { taskEls[li.getAttribute('data-task')] = li; });
    function setText(el, s) { if (el.textContent !== s) el.textContent = s; }
    function setHtml(el, s) { if (el.innerHTML !== s) el.innerHTML = s; }
    function pressed(list, attr, val) { Array.prototype.forEach.call(list, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute(attr) === String(val))); }); }

    /* ---------- tasks ---------- */
    function markLi(id) {
      var li = taskEls[id];
      if (li && !li.classList.contains('done')) {
        li.classList.add('done');
        var sr = document.createElement('span');
        sr.className = 'visually-hidden';
        sr.textContent = ' (done)';
        li.appendChild(sr);
      }
    }
    TASKS.forEach(function (t) { if (ctx && ctx.isTaskDone && ctx.isTaskDone(t.id)) { done[t.id] = true; markLi(t.id); } });
    var pendingTaskMsg = '';
    function completeTask(id) {
      if (done[id]) return;
      done[id] = true;
      markLi(id);
      pendingTaskMsg = ' Task done: ' + TASKS.filter(function (t) { return t.id === id; })[0].text.split(':')[0] + ' task.';
      if (ctx && ctx.onTaskDone) ctx.onTaskDone(id);
    }
    var announceTimer = 0;
    // a short spoken summary; "later" waits until a slider or arrow key has settled, so the region is not flooded
    function announce(s, later) {
      if (announceTimer) { clearTimeout(announceTimer); announceTimer = 0; }
      var say = function () { announceTimer = 0; if (destroyed) return; elLive.textContent = s + pendingTaskMsg; pendingTaskMsg = ''; };
      if (later) announceTimer = setTimeout(say, 450); else say();
    }

    /* ---------- canvas size ---------- */
    var dims = { w: 1, h: 1, dpr: 1 };
    var rafId = 0;
    function resize() {
      if (destroyed) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      var r = canvas.getBoundingClientRect(), w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      if (w !== dims.w || h !== dims.h || dpr !== dims.dpr) {
        dims.w = w; dims.h = h; dims.dpr = dpr;
        canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
        draw();      // repaint at once: resizing the backing store has just cleared it
      }
    }
    function requestDraw() { if (!rafId && !destroyed) rafId = requestAnimationFrame(frame); }
    function frame(now) {
      rafId = 0;
      if (destroyed) return;
      stepAnim(now);
      draw();
      if (anim) requestDraw();
    }

    /* ---------- drawing helpers ---------- */
    function font(T, px, weight, mono) { return (weight || 400) + ' ' + px + 'px ' + (mono ? T.mono : T.font); }
    function haloText(T, s, x, y) {
      g.lineJoin = 'round'; g.lineWidth = 3.5; g.strokeStyle = T.surface; g.strokeText(s, x, y);
      g.fillStyle = T.ink; g.fillText(s, x, y);
    }
    function pill(T, s, x, y, px, bold, borderCol) {
      g.font = font(T, px, bold ? 700 : 600, true);
      var w = g.measureText(s).width + 10, h = px + 8;
      var x0 = clamp(x - w / 2, 2, dims.w - w - 2), y0 = y - h / 2;
      g.fillStyle = T.surface; g.strokeStyle = borderCol || T.line; g.lineWidth = 1;
      g.beginPath();
      if (g.roundRect) g.roundRect(x0, y0, w, h, 5); else g.rect(x0, y0, w, h);
      g.fill(); g.stroke();
      g.fillStyle = T.ink; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(s, x0 + w / 2, y + 0.5);
    }
    function starPath(x, y, r) {
      g.beginPath();
      for (var k = 0; k < 10; k++) {
        var a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r;
        if (k) g.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); else g.moveTo(x + rr * Math.cos(a), y + rr * Math.sin(a));
      }
      g.closePath();
    }
    function shape(kind, x, y, r) {
      g.beginPath();
      if (kind === 'square') { var s = r * 0.9; g.rect(x - s, y - s, 2 * s, 2 * s); }
      else g.arc(x, y, r, 0, Math.PI * 2);
    }
    function niceTitleFit(T, options, maxW, px, weight) {
      g.font = font(T, px, weight);
      for (var i = 0; i < options.length; i++) if (g.measureText(options[i]).width <= maxW) return options[i];
      return options[options.length - 1];
    }

    function draw() {
      if (destroyed || dims.w < 2) return;
      var T = readTheme();
      g.setTransform(dims.dpr, 0, 0, dims.dpr, 0, 0);
      g.fillStyle = T.surface; g.fillRect(0, 0, dims.w, dims.h);
      g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.setLineDash([]);
      if (S.part === 1) drawP1(T); else if (S.part === 2) { if (S.enc === 'label') drawLabel(T); else drawOneHot(T); } else drawP3(T);
    }

    /* ================= PART 1: scaling and nearest neighbours ================= */
    function geom1() {
      var small = dims.w < 480;
      var pl = small ? 44 : 58, pr = small ? 12 : 18, pt = small ? 12 : 16, pb = small ? 42 : 50;
      return { pl: pl, pt: pt, pw: Math.max(10, dims.w - pl - pr), ph: Math.max(10, dims.h - pt - pb), small: small };
    }
    function X1(G, inc) { return G.pl + (inc - INC_LO) / (INC_HI - INC_LO) * G.pw; }
    function Y1(G, age) { return G.pt + (1 - (age - AGE_LO) / (AGE_HI - AGE_LO)) * G.ph; }
    function dotR() { return clamp(dims.w / 140, 3.5, 5.5); }

    function drawP1(T) {
      var G = geom1(), i, x, y, q = A[S.query], qx = X1(G, q.inc), qy = Y1(G, q.age), r = dotR();
      // grid, ticks, axis titles
      g.lineWidth = 1; g.strokeStyle = T.line;
      g.font = font(T, G.small ? 11 : 12); g.fillStyle = T.muted;
      var step = G.small && G.pw < 260 ? 10e5 : 5e5;
      g.textAlign = 'center'; g.textBaseline = 'top';
      for (var v = 0; v <= 30e5; v += step) {
        x = X1(G, v);
        g.beginPath(); g.moveTo(x + 0.5, G.pt); g.lineTo(x + 0.5, G.pt + G.ph); g.stroke();
        g.fillText('₹' + (v / 1e5) + 'L', x, G.pt + G.ph + 6);
      }
      g.textAlign = 'right'; g.textBaseline = 'middle';
      for (var a = 20; a <= 60; a += 10) {
        y = Y1(G, a);
        g.beginPath(); g.moveTo(G.pl, y + 0.5); g.lineTo(G.pl + G.pw, y + 0.5); g.stroke();
        g.fillText(String(a), G.pl - 7, y);
      }
      g.fillStyle = T.ink; g.font = font(T, G.small ? 12 : 13, 600);
      g.textAlign = 'center'; g.textBaseline = 'bottom';
      g.fillText('Yearly income', G.pl + G.pw / 2, dims.h - 3);
      g.save(); g.translate(G.small ? 12 : 16, G.pt + G.ph / 2); g.rotate(-Math.PI / 2); g.textBaseline = 'middle';
      g.fillText('Age (years)', 0, 0); g.restore();

      g.save();
      g.beginPath(); g.rect(G.pl, G.pt, G.pw, G.ph); g.clip();
      // the neighbourhood: everyone at least as close as the 5th neighbour (a circle in the scaled space)
      var sc = scaler(S.scale), rad = NB[K - 1].d, ea = rad * sc.si, eb = rad * sc.sa;
      var yLo = AGE_LO - 10, yHi = AGE_HI + 10;
      var f0 = Math.asin(clamp((yLo - q.age) / eb, -1, 1)), f1 = Math.asin(clamp((yHi - q.age) / eb, -1, 1)), n = 72, k, f;
      g.beginPath();
      for (k = 0; k <= n; k++) { f = f0 + (f1 - f0) * k / n; x = X1(G, q.inc + ea * Math.cos(f)); y = Y1(G, q.age + eb * Math.sin(f)); if (k) g.lineTo(x, y); else g.moveTo(x, y); }
      for (k = n; k >= 0; k--) { f = f0 + (f1 - f0) * k / n; g.lineTo(X1(G, q.inc - ea * Math.cos(f)), Y1(G, q.age + eb * Math.sin(f))); }
      g.closePath();
      g.fillStyle = rgba(T.indigoRgb, 0.1); g.fill();
      g.setLineDash([5, 4]); g.strokeStyle = rgba(T.indigoRgb, 0.65); g.lineWidth = 1.5; g.stroke(); g.setLineDash([]);
      // lines from the query to its neighbours
      g.strokeStyle = rgba(T.s1Rgb, 0.8); g.lineWidth = 1.6;
      NB.forEach(function (nb) { g.beginPath(); g.moveTo(qx, qy); g.lineTo(X1(G, A[nb.j].inc), Y1(G, A[nb.j].age)); g.stroke(); });
      // everyone else
      var isNb = {};
      NB.forEach(function (nb, rank) { isNb[nb.j] = rank + 1; });
      for (i = 0; i < A.length; i++) {
        if (i === S.query || isNb[i]) continue;
        shape('circle', X1(G, A[i].inc), Y1(G, A[i].age), r);
        g.fillStyle = T.surface; g.fill(); g.strokeStyle = T.muted; g.lineWidth = 1.5; g.stroke();
      }
      // the unscaled neighbours, as dashed rings, so you can see who dropped out
      if (S.scale !== 'none') {
        g.setLineDash([3, 3]); g.strokeStyle = T.s2; g.lineWidth = 1.8;
        NB0.forEach(function (nb) { shape('circle', X1(G, A[nb.j].inc), Y1(G, A[nb.j].age), r + 5); g.stroke(); });
        g.setLineDash([]);
      }
      // the current neighbours
      NB.forEach(function (nb) {
        shape('circle', X1(G, A[nb.j].inc), Y1(G, A[nb.j].age), r + 1.5);
        g.fillStyle = T.s1; g.fill(); g.strokeStyle = T.surface; g.lineWidth = 1.5; g.stroke();
      });
      if (S.hover >= 0 && S.hover !== S.query) {
        shape('circle', X1(G, A[S.hover].inc), Y1(G, A[S.hover].age), r + 4);
        g.strokeStyle = T.ink; g.lineWidth = 1.5; g.stroke();
      }
      // the query
      starPath(qx, qy, r + 6);
      g.fillStyle = T.haldi; g.fill(); g.strokeStyle = T.ink; g.lineWidth = 1.5; g.stroke();
      // rank numbers
      g.font = font(T, G.small ? 11 : 12, 700); g.textAlign = 'left'; g.textBaseline = 'middle';
      NB.forEach(function (nb, rank) {
        var px = X1(G, A[nb.j].inc), py = Y1(G, A[nb.j].age), dx = px >= G.pl + G.pw - 22 ? -18 : 8;
        haloText(T, String(rank + 1), px + dx, py - 9);
      });
      g.restore();
    }

    function hit1(px, py, radius) {
      var G = geom1(), best = -1, bd = radius * radius;
      for (var i = 0; i < A.length; i++) {
        var dx = X1(G, A[i].inc) - px, dy = Y1(G, A[i].age) - py, d = dx * dx + dy * dy;
        if (d <= bd) { bd = d; best = i; }
      }
      return best;
    }

    var SC_DESC = {
      none: function () {
        return '<strong style="color:var(--ink)">No scaling:</strong> the distance uses the raw numbers, income in rupees and age in years. So a ₹1,000 income gap counts as much as a 1,000-year age gap!';
      },
      minmax: function () {
        return '<strong style="color:var(--ink)">Min-max scaling:</strong> (value − smallest) ÷ (largest − smallest), so each feature runs from 0 to 1. Income: ' +
          inr(FIT1.incMin) + ' → 0 and ' + inr(FIT1.incMax) + ' → 1. Age: ' + FIT1.ageMin + ' → 0 and ' + FIT1.ageMax + ' → 1.';
      },
      std: function () {
        return '<strong style="color:var(--ink)">Standard scaling (z-score):</strong> (value − mean) ÷ SD, so each feature gets mean 0 and SD 1 (SD = standard deviation, the typical distance from the mean). Income: mean ' +
          inr(FIT1.inc.m) + ', SD ' + inr(FIT1.inc.s) + '. Age: mean ' + FIT1.age.m.toFixed(1) + ', SD ' + FIT1.age.s.toFixed(1) +
          '. This is the population SD (divide by n), as in scikit-learn’s <code>StandardScaler</code> (ddof=0).';
      }
    };

    function updateP1() {
      NB = neighbours(S.query, S.scale);
      NB0 = neighbours(S.query, 'none');
      var q = A[S.query], none = S.scale === 'none';
      var in0 = {}; NB0.forEach(function (nb) { in0[nb.j] = true; });
      var kept = NB.filter(function (nb) { return in0[nb.j]; }).length;
      var share = NB.reduce(function (s, nb) { return s + nb.share; }, 0) / K;
      var nbAges = NB.map(function (nb) { return A[nb.j].age; }), nbIncs = NB.map(function (nb) { return A[nb.j].inc; });
      var aLo = Math.min.apply(null, nbAges), aHi = Math.max.apply(null, nbAges);
      setText($('s1scale'), SCALES[S.scale].short);
      setText($('s1share'), sharePct(share));
      setText($('s1new'), none ? '—' : (K - kept) + ' of ' + K);
      setText($('s1ages'), aLo + '–' + aHi);
      setHtml(elScDesc, SC_DESC[S.scale]());
      if (String(elQuery.value) !== String(S.query)) elQuery.value = String(S.query);

      // the readout under the chart
      var s = 'Query: <b>' + q.name + '</b>, ' + q.age + ', earning <span class="num">' + inr(q.inc) + '</span> a year. ' +
        'Nearest ' + K + ' with ' + (none ? 'no scaling' : SCALES[S.scale].label.toLowerCase() + ' scaling') + ': aged ' + aLo + ' to ' + aHi +
        ', earning <span class="num">' + inr(Math.min.apply(null, nbIncs)) + '</span> to <span class="num">' + inr(Math.max.apply(null, nbIncs)) + '</span>. ';
      if (none) s += 'Age hardly counts: income gaps are lakhs of rupees, age gaps are at most ' + (FIT1.ageMax - FIT1.ageMin) + ' years.';
      else s += (K - kept === 0 ? 'The same 5 as with no scaling.' : (K - kept) + ' of these 5 were not among the nearest with no scaling (dashed rings). Now age counts too.');
      setHtml(elReadout, s);

      // the table
      var rows = NB.map(function (nb, rank) {
        var p = A[nb.j];
        var gi = none ? inr(Math.abs(nb.di)) : Math.abs(nb.di).toFixed(3);
        var ga = none ? Math.abs(nb.da) + ' yrs' : Math.abs(nb.da).toFixed(3);
        var dd = none ? numIN(nb.d, 1) : nb.d.toFixed(3);
        return '<tr><td>' + (rank + 1) + '</td><td style="white-space:nowrap">' + p.name + ', ' + p.age + ', ' + inr(p.inc) + '</td><td>' + gi + '</td><td>' + ga + '</td><td>' + dd + '</td><td>' + sharePct(nb.share) + '</td></tr>';
      }).join('');
      setHtml(elT1, '<thead><tr><th>#</th><th>Neighbour</th><th>Income gap</th><th>Age gap</th><th>Distance</th><th>Income’s share</th></tr></thead><tbody>' + rows + '</tbody>');
      var n1 = NB[0];
      if (none) {
        var extra = n1.d - Math.abs(n1.di);
        elFormula.innerHTML = 'Nearest neighbour: √(' + numIN(Math.abs(n1.di), 0) + '² + ' + Math.abs(n1.da) + '²) = ' + numIN(n1.d, 1) +
          '. The ' + Math.abs(n1.da) + '-year age gap adds just ' + (extra < 0.001 ? extra.toPrecision(2) : extra.toFixed(3)) + ' to the distance.';
      } else {
        elFormula.innerHTML = 'Nearest neighbour: √(' + Math.abs(n1.di).toFixed(3) + '² + ' + Math.abs(n1.da).toFixed(3) + '²) = ' + n1.d.toFixed(3) + '. Both features now have a say.';
      }
      canvas.setAttribute('aria-label', 'Scatter chart of ' + P1_N + ' loan applicants: yearly income from left to right, age from bottom to top. Query applicant: ' + q.name + ', ' + q.age + ', ' + inr(q.inc) + '. ' +
        'With ' + SCALES[S.scale].label.toLowerCase() + ' scaling the 5 nearest are ' + NB.map(function (nb) { var p = A[nb.j]; return p.name + ' (' + p.age + ', ' + inr(p.inc) + ')'; }).join(', ') +
        '. Income makes up ' + sharePct(share) + ' of the distance on average.');
      return { kept: kept, share: share, aLo: aLo, aHi: aHi };
    }

    function setScale(mode, user) {
      S.scale = mode;
      pressed(scaleBtns, 'data-scale', mode);
      var info = updateP1();
      if (user && mode !== 'none' && info.kept < K) completeTask('t1');
      if (user) announce(SCALES[mode].label + '. ' + (mode === 'none' ? 'Income makes up ' + sharePct(info.share) + ' of the distance.' : (K - info.kept) + ' of the 5 nearest neighbours changed. Income makes up ' + sharePct(info.share) + ' of the distance.') + ' Neighbours aged ' + info.aLo + ' to ' + info.aHi + '.');
      requestDraw();
    }
    function setQuery(i, user, later) {
      if (i < 0 || i >= A.length) return;
      S.query = i;
      var info = updateP1();
      if (user && S.scale !== 'none' && info.kept < K) completeTask('t1');
      if (user) announce('Query: ' + A[i].name + ', ' + A[i].age + ', ' + inr(A[i].inc) + '. Nearest 5 aged ' + info.aLo + ' to ' + info.aHi + '.', later);
      requestDraw();
    }
    function answer(a) {
      S.quiz = a;
      pressed(ansBtns, 'data-ans', a);
      var msg;
      if (a === 'inc') {
        msg = '<b>Right.</b> Income gaps are in lakhs of rupees, while age gaps are at most ' + (FIT1.ageMax - FIT1.ageMin) + ' years, so with no scaling income makes up more than 99.99% of every squared distance. Scaling puts both features on a similar range.';
        completeTask('t2');
      } else if (a === 'age') msg = '<b>Not quite.</b> Pick No scaling and look at the “Income’s share” column. Who are the query’s neighbours: people of the same age, or people with the same income?';
      else msg = '<b>Not quite.</b> Pick No scaling and look at the “Income’s share” column. Is it anywhere near 50%?';
      elQfb.innerHTML = msg;
      if (a === 'inc' && pendingTaskMsg) announce(pendingTaskMsg.trim());
    }

    /* ================= PART 2: label encoding versus one-hot ================= */
    function encDist(a, b) { return S.enc === 'label' ? Math.abs(a - b) : (a === b ? 0 : Math.SQRT2); }
    function distStr(d) { return S.enc === 'label' ? String(d) : (d === 0 ? '0' : '1.41'); }
    function labelPos() {
      var small = dims.w < 480, m = Math.max(44, dims.w * 0.12), x0 = m, x1 = dims.w - m;
      // room for the title, the arc and the city names above the line; the "claims" go below it
      var top = 34 + (small ? 62 : 92) + 40, below = small ? 122 : 178;
      var y = Math.round(Math.max(top, Math.min(dims.h - below, (34 + dims.h) / 2 - (small ? 0 : 20))));
      return { y: y, xs: CITIES.map(function (c, i) { return x0 + i * (x1 - x0) / 3; }), x0: x0, x1: x1, small: small };
    }
    var CLAIMS = [
      'Chennai is 3 times as far from Mumbai as Delhi is.',
      'Delhi sits exactly halfway between Mumbai and Pune.',
      'Chennai (3) counts as “more” than Mumbai (0).'
    ];
    function drawLabel(T) {
      var LP = labelPos(), small = LP.small, i;
      g.textAlign = 'left'; g.textBaseline = 'top';
      g.fillStyle = T.ink;
      var title = niceTitleFit(T, ['Label encoding: each city becomes one number', 'Label encoding: one number per city', 'Label encoding'], dims.w - 28, small ? 13 : 15, 700);
      g.font = font(T, small ? 13 : 15, 700); g.fillText(title, 14, 12);
      // the number line
      g.strokeStyle = T.ink; g.lineWidth = 2;
      g.beginPath(); g.moveTo(LP.x0 - 26, LP.y); g.lineTo(LP.x1 + 22, LP.y); g.stroke();
      g.beginPath(); g.moveTo(LP.x1 + 30, LP.y); g.lineTo(LP.x1 + 20, LP.y - 6); g.lineTo(LP.x1 + 20, LP.y + 6); g.closePath(); g.fillStyle = T.ink; g.fill();
      g.font = font(T, small ? 13 : 15, 600, true); g.textAlign = 'center'; g.textBaseline = 'top';
      for (i = 0; i < 4; i++) {
        g.beginPath(); g.moveTo(LP.xs[i], LP.y - 7); g.lineTo(LP.xs[i], LP.y + 7); g.stroke();
        g.fillStyle = T.ink; g.fillText(String(i), LP.xs[i], LP.y + 13);
      }
      // the arc for the chosen pair
      var a = S.pa, b = S.pb, d = Math.abs(a - b);
      if (d > 0) {
        var xa = LP.xs[a], xb = LP.xs[b], yb = LP.y - 38, h = small ? 14 + 14 * d : 20 + 22 * d;
        g.strokeStyle = T.haldi; g.lineWidth = 3;
        g.beginPath(); g.moveTo(xa, yb); g.bezierCurveTo(xa, yb - h, xb, yb - h, xb, yb); g.stroke();
        pill(T, 'distance = |' + a + ' − ' + b + '| = ' + d, (xa + xb) / 2, yb - h * 0.75, small ? 12 : 14, true, T.haldi);
      }
      // cities
      for (i = 0; i < 4; i++) {
        var sel = i === a || i === b;
        shape('circle', LP.xs[i], LP.y, sel ? 10 : 8);
        g.fillStyle = sel ? T.haldi : T.indigo; g.fill(); g.strokeStyle = sel ? T.ink : T.surface; g.lineWidth = 2; g.stroke();
        g.font = font(T, small ? 13 : 15, sel ? 700 : 600); g.textAlign = 'center'; g.textBaseline = 'bottom';
        haloText(T, CITIES[i], LP.xs[i], LP.y - 15);
      }
      // what the numbers wrongly claim
      var fs = small ? 12 : 15, lh = small ? 18 : 26, x = Math.max(14, LP.x0 - 26), y = LP.y + (small ? 44 : 58);
      g.textAlign = 'left'; g.textBaseline = 'top';
      g.font = font(T, fs, 700); g.fillStyle = T.ink;
      g.fillText(niceTitleFit(T, ['What these numbers wrongly claim:', 'Wrong claims:'], dims.w - x - 8, fs, 700), x, y);
      g.font = font(T, fs, 400);
      CLAIMS.forEach(function (c, k) {
        var yy = y + lh * (k + 1);
        g.fillStyle = T.ink; g.fillText('✗', x, yy);
        g.fillText(niceTitleFit(T, [c, c.replace(' exactly', '').replace(' as far', ' as far')], dims.w - x - 30, fs, 400), x + 18, yy);
      });
    }

    // a regular tetrahedron: the 4 one-hot rows are its corners, every edge is √2 long
    var TET = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map(function (v) { return v.map(function (c) { return c / Math.sqrt(3); }); });
    var EDGES = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
    function tetraPts() {
      var cy = Math.cos(S.yaw), sy = Math.sin(S.yaw), cp = Math.cos(S.pitch), sp = Math.sin(S.pitch);
      var cx0 = dims.w / 2, cy0 = dims.h * 0.56, R = Math.min(dims.w * 0.36, dims.h * 0.38);
      return TET.map(function (v) {
        var x = v[0] * cy + v[2] * sy, z = -v[0] * sy + v[2] * cy, y = v[1];
        var y2 = y * cp - z * sp, z2 = y * sp + z * cp;
        var f = 3.2 / (3.2 - z2);
        return { x: cx0 + R * x * f, y: cy0 - R * y2 * f, z: z2, f: f };
      });
    }
    function drawOneHot(T) {
      var small = dims.w < 480, pts = tetraPts(), cx0 = dims.w / 2, cy0 = dims.h * 0.56;
      g.textAlign = 'left'; g.textBaseline = 'top'; g.fillStyle = T.ink;
      var title = niceTitleFit(T, ['One-hot: each city is a corner, and every edge is √2 ≈ 1.41', 'One-hot: every edge is √2 ≈ 1.41', 'One-hot'], dims.w - 28, small ? 13 : 15, 700);
      g.font = font(T, small ? 13 : 15, 700); g.fillText(title, 14, 12);
      var sel = [Math.min(S.pa, S.pb), Math.max(S.pa, S.pb)];
      var order = EDGES.slice().sort(function (e1, e2) { return (pts[e1[0]].z + pts[e1[1]].z) - (pts[e2[0]].z + pts[e2[1]].z); });
      order.forEach(function (e) {
        var isSel = e[0] === sel[0] && e[1] === sel[1], depth = ((pts[e[0]].z + pts[e[1]].z) / 2 + 1) / 2;
        g.strokeStyle = isSel ? T.haldi : rgba(T.inkRgb, 0.3 + 0.45 * depth); g.lineWidth = isSel ? 4 : 2;
        g.beginPath(); g.moveTo(pts[e[0]].x, pts[e[0]].y); g.lineTo(pts[e[1]].x, pts[e[1]].y); g.stroke();
      });
      order.forEach(function (e) {
        var isSel = e[0] === sel[0] && e[1] === sel[1];
        var mx = (pts[e[0]].x + pts[e[1]].x) / 2, my = (pts[e[0]].y + pts[e[1]].y) / 2;
        pill(T, isSel ? '√2 ≈ 1.41' : '1.41', mx, my, small ? 11 : 12, isSel, isSel ? T.haldi : T.line);
      });
      var vorder = [0, 1, 2, 3].sort(function (a, b) { return pts[a].z - pts[b].z; });
      vorder.forEach(function (i) {
        var p = pts[i], isSel = i === S.pa || i === S.pb, rr = (isSel ? 10 : 8) * p.f;
        shape('circle', p.x, p.y, rr);
        g.fillStyle = isSel ? T.haldi : T.indigo; g.fill(); g.strokeStyle = isSel ? T.ink : T.surface; g.lineWidth = 2; g.stroke();
        var dx = p.x - cx0, dy = p.y - cy0, dl = Math.sqrt(dx * dx + dy * dy) || 1;
        var lx = p.x + dx / dl * (rr + 14), ly = p.y + dy / dl * (rr + 14);
        g.textAlign = dx / dl > 0.35 ? 'left' : dx / dl < -0.35 ? 'right' : 'center';
        g.textBaseline = dy / dl > 0.35 ? 'top' : dy / dl < -0.35 ? 'bottom' : 'middle';
        g.font = font(T, small ? 13 : 14, isSel ? 700 : 600);
        var vec = '[' + CITIES.map(function (c, k) { return k === i ? '1' : '0'; }).join(', ') + ']';
        var nameY = ly, vecY = ly;
        if (!small) { if (g.textBaseline === 'bottom') nameY = ly - 16; else vecY = ly + (g.textBaseline === 'middle' ? 16 : 17); }
        haloText(T, CITIES[i], lx, nameY);
        if (!small) { g.font = font(T, 12, 400, true); haloText(T, vec, lx, g.textBaseline === 'bottom' ? ly : vecY); }
      });
    }
    function hit2(px, py) {
      var best = -1, bd = 26 * 26, pts;
      if (S.enc === 'label') { var LP = labelPos(); pts = LP.xs.map(function (x) { return { x: x, y: LP.y }; }); }
      else pts = tetraPts();
      for (var i = 0; i < 4; i++) { var dx = pts[i].x - px, dy = pts[i].y - py, d = dx * dx + dy * dy; if (d <= bd) { bd = d; best = i; } }
      return best;
    }

    function updateP2() {
      var label = S.enc === 'label', a = S.pa, b = S.pb, d = encDist(a, b);
      setText($('s2enc'), label ? 'Label' : 'One-hot');
      setText($('s2cols'), label ? '1' : '4');
      setText($('s2pair'), a === b ? '0' : distStr(d));
      setText($('s2kinds'), label ? '3 (1, 2, 3)' : '1 (all 1.41)');
      elEncDesc.innerHTML = label
        ? 'One column: Mumbai 0, Delhi 1, Pune 2, Chennai 3, in the order the cities were listed. The numbers look like amounts, so a model treats them as an order.'
        : 'Four yes/no columns, one per city: a 1 in the city’s own column and 0 elsewhere. No city is “bigger” than another.';
      setText(elP2hint, label ? 'Or click or tap two cities on the picture, one after the other.' : 'Or click or tap two cities on the picture, one after the other. Drag the picture to turn it round.');
      if (String(elCa.value) !== String(a)) elCa.value = String(a);
      if (String(elCb.value) !== String(b)) elCb.value = String(b);
      var A2 = CITIES[a], B2 = CITIES[b], s;
      if (a === b) s = 'You picked the same city twice, so the distance is 0. Pick two different cities.';
      else if (label) {
        s = 'Label encoding: ' + A2 + ' = ' + a + ' and ' + B2 + ' = ' + b + ', so their distance is |' + a + ' − ' + b + '| = <b>' + d + '</b>' +
          (d === 3 ? ', three times the Mumbai–Delhi distance, as if these two were the most different cities. ' : d === 1 ? ', the smallest gap any pair can have. ' : ', twice the Mumbai–Delhi distance. ') +
          'The codes even “say” Delhi (1) sits halfway between Mumbai (0) and Pune (2). None of this is true: the numbers only follow the order we typed the cities in.';
      } else {
        var va = CITIES.map(function (c, k) { return k === a ? 1 : 0; }), vb = CITIES.map(function (c, k) { return k === b ? 1 : 0; });
        s = 'One-hot: ' + A2 + ' = [' + va.join(', ') + '] and ' + B2 + ' = [' + vb.join(', ') + ']. They differ in exactly 2 columns, so the distance is √(1² + 1²) = √2 ≈ <b>1.41</b>. ' +
          'Every pair of cities differs in exactly 2 columns, so every pair is equally far apart: no fake order.';
      }
      setHtml(elReadout, s);
      // tables
      var head, body;
      if (label) {
        head = '<tr><th>City</th><th>city (as a number)</th></tr>';
        body = CITIES.map(function (c, i) { return '<tr' + (i === a || i === b ? ' style="font-weight:700"' : '') + '><td>' + c + '</td><td>' + i + '</td></tr>'; }).join('');
      } else {
        head = '<tr><th>City</th>' + CITIES.map(function (c) { return '<th>city_' + c + '</th>'; }).join('') + '</tr>';
        body = CITIES.map(function (c, i) { return '<tr' + (i === a || i === b ? ' style="font-weight:700"' : '') + '><td>' + c + '</td>' + CITIES.map(function (c2, k) { return '<td>' + (k === i ? 1 : 0) + '</td>'; }).join('') + '</tr>'; }).join('');
      }
      setHtml(elTenc, '<thead>' + head + '</thead><tbody>' + body + '</tbody>');
      var dh = '<tr><th><span class="visually-hidden">From</span></th>' + CITIES.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr>';
      var db = CITIES.map(function (c, i) {
        return '<tr><th scope="row" style="text-transform:none;letter-spacing:0;font-size:.95rem;color:var(--ink)">' + c + '</th>' + CITIES.map(function (c2, k) {
          var isSel = a !== b && ((i === a && k === b) || (i === b && k === a));
          return '<td' + (isSel ? ' style="font-weight:700;background:var(--indigo-soft);outline:2px solid var(--indigo);outline-offset:-2px"' : '') + '>' + distStr(encDist(i, k)) + (isSel ? '<span class="visually-hidden"> (chosen pair)</span>' : '') + '</td>';
        }).join('') + '</tr>';
      }).join('');
      setHtml(elTdist, '<thead>' + dh + '</thead><tbody>' + db + '</tbody>');
      canvas.setAttribute('aria-label', label
        ? 'Number line for label encoding: Mumbai at 0, Delhi at 1, Pune at 2, Chennai at 3. Chosen pair: ' + A2 + ' to ' + B2 + ', distance ' + d + '.'
        : 'Triangular pyramid for one-hot encoding: the four cities are its corners and all six edges are √2, about 1.41, long. Chosen pair: ' + A2 + ' to ' + B2 + ', distance ' + (a === b ? '0' : '1.41') + '.');
      canvas.style.touchAction = (S.part === 2 && !label) ? 'none' : 'manipulation';
      canvas.style.cursor = (S.part === 2 && !label) ? 'grab' : '';
    }
    function checkP2(user) {
      if (!user) return;
      var mc = (S.pa === 0 && S.pb === 3) || (S.pa === 3 && S.pb === 0);
      if (mc && S.enc === 'label') S.seenLabelMC = true;
      if (mc && S.enc === 'onehot') S.seenOneHotMC = true;
      if (S.seenLabelMC && S.seenOneHotMC) completeTask('t3');
    }
    function p2Summary() {
      var d = encDist(S.pa, S.pb);
      return CITIES[S.pa] + ' to ' + CITIES[S.pb] + ': distance ' + (S.pa === S.pb ? '0' : distStr(d)) + ' with ' + (S.enc === 'label' ? 'label encoding.' : 'one-hot encoding.');
    }
    function setEnc(e, user) {
      S.enc = e;
      pressed(encBtns, 'data-enc', e);
      updateP2(); checkP2(user);
      if (user) announce(p2Summary());
      requestDraw();
    }
    function setPair(a, b, user, later) {
      S.pa = a; S.pb = b;
      updateP2(); checkP2(user);
      if (user) announce(p2Summary(), later);
      requestDraw();
    }
    function tapCity(c) { if (c !== S.pb) setPair(S.pb, c, true); }

    /* ================= PART 3: leakage ================= */
    var disp = null, anim = null;   // what is drawn now (z positions + view), and a running transition
    function targetView() {
      var M = S.fitAll ? R3.leak : R3.honest;
      var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      [R3.honest, R3.leak].forEach(function (R) {
        for (var i = 0; i < L.length; i++) { x0 = Math.min(x0, R.zx[i]); x1 = Math.max(x1, R.zx[i]); y0 = Math.min(y0, R.zy[i]); y1 = Math.max(y1, R.zy[i]); }
      });
      var pad = 0.35;
      return { zx: Float64Array.from(M.zx), zy: Float64Array.from(M.zy), dom: [x0 - pad, x1 + pad, y0 - pad, y1 + pad] };
    }
    function startAnim() {
      var to = targetView();
      if (!disp || reduceMotion || S.part !== 3) { disp = to; anim = null; requestDraw(); return; }
      anim = { from: { zx: Float64Array.from(disp.zx), zy: Float64Array.from(disp.zy), dom: disp.dom.slice() }, to: to, t0: -1 };
      requestDraw();
    }
    function stepAnim(now) {
      if (!anim) return;
      if (anim.t0 < 0) anim.t0 = now;
      var t = clamp((now - anim.t0) / ANIM_MS, 0, 1), e = ease(t), F = anim.from, T2 = anim.to, i;
      var zx = new Float64Array(L.length), zy = new Float64Array(L.length);
      for (i = 0; i < L.length; i++) { zx[i] = F.zx[i] + (T2.zx[i] - F.zx[i]) * e; zy[i] = F.zy[i] + (T2.zy[i] - F.zy[i]) * e; }
      disp = { zx: zx, zy: zy, dom: F.dom.map(function (v, k) { return v + (T2.dom[k] - v) * e; }) };
      if (t >= 1) { disp = T2; anim = null; }
    }
    function geom3() {
      var small = dims.w < 480;
      var pl = small ? 40 : 52, pr = small ? 10 : 14, pt = small ? 10 : 14, pb = small ? 40 : 46;
      var pw = Math.max(10, dims.w - pl - pr), ph = Math.max(10, dims.h - pt - pb);
      var D = disp.dom, kx = pw / (D[1] - D[0]), ky = ph / (D[3] - D[2]), k = Math.min(kx, ky);
      // equal scale on both axes (so distances look right), widened to fill the plot
      var cx = (D[0] + D[1]) / 2, cy = (D[2] + D[3]) / 2, hx = pw / k / 2, hy = ph / k / 2;
      return { pl: pl, pt: pt, pw: pw, ph: ph, k: k, x0: cx - hx, x1: cx + hx, y0: cy - hy, y1: cy + hy, small: small };
    }
    function X3(G, z) { return G.pl + (z - G.x0) * G.k; }
    function Y3(G, z) { return G.pt + (G.y1 - z) * G.k; }
    function drawP3(T) {
      if (!disp) return;
      var G = geom3(), M = S.fitAll ? R3.leak : R3.honest, r = dotR(), i, x, y;
      var step = G.k < 26 ? 2 : 1;
      g.lineWidth = 1; g.font = font(T, G.small ? 11 : 12); g.fillStyle = T.muted;
      g.textAlign = 'center'; g.textBaseline = 'top';
      for (var v = Math.ceil(G.x0 / step) * step; v <= G.x1; v += step) {
        x = X3(G, v);
        g.strokeStyle = T.line; g.setLineDash(v === 0 ? [4, 4] : []);
        if (v === 0) g.strokeStyle = T.muted;
        g.beginPath(); g.moveTo(x + 0.5, G.pt); g.lineTo(x + 0.5, G.pt + G.ph); g.stroke();
        g.fillText(signed(v, 0), x, G.pt + G.ph + 5);
      }
      g.textAlign = 'right'; g.textBaseline = 'middle';
      for (v = Math.ceil(G.y0 / step) * step; v <= G.y1; v += step) {
        y = Y3(G, v);
        g.strokeStyle = v === 0 ? T.muted : T.line; g.setLineDash(v === 0 ? [4, 4] : []);
        g.beginPath(); g.moveTo(G.pl, y + 0.5); g.lineTo(G.pl + G.pw, y + 0.5); g.stroke();
        g.fillText(signed(v, 0), G.pl - 6, y);
      }
      g.setLineDash([]);
      g.fillStyle = T.ink; g.font = font(T, G.small ? 12 : 13, 600); g.textAlign = 'center'; g.textBaseline = 'bottom';
      g.fillText(G.small ? 'Income, scaled' : 'Income, scaled (0 = the scaler’s mean)', G.pl + G.pw / 2, dims.h - 3);
      g.save(); g.translate(G.small ? 11 : 14, G.pt + G.ph / 2); g.rotate(-Math.PI / 2); g.textBaseline = 'middle';
      g.fillText('Age, scaled', 0, 0); g.restore();

      g.save();
      g.beginPath(); g.rect(G.pl, G.pt, G.pw, G.ph); g.clip();
      // lines from the chosen 2025 row to the 5 training rows that vote on it
      var t = TEST[S.sel], tx = X3(G, disp.zx[t]), ty = Y3(G, disp.zy[t]);
      g.strokeStyle = rgba(T.inkRgb, 0.55); g.lineWidth = 1.5;
      M.nbrs[S.sel].forEach(function (j) { g.beginPath(); g.moveTo(tx, ty); g.lineTo(X3(G, disp.zx[j]), Y3(G, disp.zy[j])); g.stroke(); });
      // 2019 training rows
      TRAIN.forEach(function (j) {
        var c = L[j].y ? T.s2Rgb : T.s1Rgb;
        shape(L[j].y ? 'square' : 'circle', X3(G, disp.zx[j]), Y3(G, disp.zy[j]), r);
        g.fillStyle = rgba(c, 0.5); g.fill(); g.strokeStyle = rgba(c, 1); g.lineWidth = 1.2; g.stroke();
      });
      // 2025 test rows
      TEST.forEach(function (ti, k) {
        var px = X3(G, disp.zx[ti]), py = Y3(G, disp.zy[ti]), R = r + 2.5;
        if (k === S.sel) { shape('circle', px, py, R + 9); g.strokeStyle = T.haldi; g.lineWidth = 3; g.stroke(); }
        shape(L[ti].y ? 'square' : 'circle', px, py, R);
        g.fillStyle = L[ti].y ? T.s2 : T.s1; g.fill(); g.strokeStyle = T.ink; g.lineWidth = 1.6; g.stroke();
        if (M.pred[k] !== L[ti].y) { shape('circle', px, py, R + 4.5); g.strokeStyle = T.ink; g.lineWidth = 1.5; g.stroke(); }
      });
      g.restore();
    }
    function hit3(px, py) {
      if (!disp) return -1;
      var G = geom3(), best = -1, bd = 26 * 26;
      TEST.forEach(function (ti, k) { var dx = X3(G, disp.zx[ti]) - px, dy = Y3(G, disp.zy[ti]) - py, d = dx * dx + dy * dy; if (d <= bd) { bd = d; best = k; } });
      return best;
    }

    function code3(M, other) {
      var sc = (M.correct / P3.nte), so = (other.correct / P3.nte);
      function py(v) { return String(Math.round(v * 100) / 100); }
      if (S.fitAll) {
        return 'import numpy as np\n' +
          'from sklearn.preprocessing import StandardScaler\n' +
          'from sklearn.neighbors import KNeighborsClassifier\n\n' +
          '# X_2019, y_2019: 40 training rows; X_2025, y_2025: 20 test rows\n' +
          '# columns: income in rupees, age in years\n' +
          'X_all = np.vstack([X_2019, X_2025])\n\n' +
          'scaler = StandardScaler()\n' +
          'X_all_s = scaler.fit_transform(X_all)   # LEAK: mean and SD include the 2025 test rows\n' +
          'X_train_s, X_test_s = X_all_s[:40], X_all_s[40:]\n\n' +
          'model = KNeighborsClassifier(n_neighbors=5)\n' +
          'model.fit(X_train_s, y_2019)\n' +
          'print(model.score(X_test_s, y_2025))   # prints ' + py(sc) + (sc > so ? ': too rosy, the honest score is ' + py(so) : sc < so ? ', but the honest score is ' + py(so) : ', the same as the honest score here') + '\n';
      }
      return 'from sklearn.pipeline import Pipeline\n' +
        'from sklearn.preprocessing import StandardScaler\n' +
        'from sklearn.neighbors import KNeighborsClassifier\n\n' +
        '# X_2019, y_2019: 40 training rows; X_2025, y_2025: 20 test rows\n' +
        '# columns: income in rupees, age in years\n' +
        'pipe = Pipeline([\n' +
        '    (\'scale\', StandardScaler()),                     # learns mean and SD from X_2019 only\n' +
        '    (\'model\', KNeighborsClassifier(n_neighbors=5)),\n' +
        '])\n' +
        'pipe.fit(X_2019, y_2019)\n' +
        'print(pipe.score(X_2025, y_2025))   # prints ' + py(sc) + ': the honest score\n';
    }

    function updateP3(rebuildOpts) {
      R3 = { honest: evalLeak(S.rise, false), leak: evalLeak(S.rise, true) };
      var H = R3.honest, Lk = R3.leak, M = S.fitAll ? Lk : H, gap = Lk.correct - H.correct;
      var risePct = S.rise * 10;
      setText(elRiseOut, risePct + '%');
      setText($('s3mean'), inr(M.si.m));
      setText($('s3sd'), inr(M.si.s));
      setText($('s3z'), signed(M.avgZ, 2));
      setText($('s3acc'), pct(M.correct, P3.nte));
      elFitDesc.innerHTML = S.fitAll
        ? '<strong style="color:var(--ink)">Leak:</strong> the scaler learns from all ' + Lk.nFit + ' rows, the 20 test rows from 2025 included. That is like using 2025’s incomes while building a model in 2019.'
        : '<strong style="color:var(--ink)">Correct:</strong> the scaler learns from the ' + H.nFit + ' training rows only, then the same mean and SD are used on the test rows, just like a scikit-learn <code>Pipeline</code> does.';
      var pts = (gap >= 0 ? gap : -gap) * (100 / P3.nte);
      if (!S.fitAll) {
        elVerdict.innerHTML = '<b>Honest Pipeline score: ' + pct(H.correct, P3.nte) + '</b> (' + H.correct + ' of ' + P3.nte + ' right). The scaler learned only from 2019, exactly as a model launched in 2019 would.' +
          (gap > 0 ? ' Now switch to “All rows (leak)”.' : gap === 0 ? ' Here the leak would give the same score; raise the salary rise to see it matter.' : '');
      } else if (gap > 0) {
        elVerdict.innerHTML = '<b>Leaky score: ' + pct(Lk.correct, P3.nte) + '</b> (' + Lk.correct + ' of ' + P3.nte + ' right). The honest Pipeline score is ' + pct(H.correct, P3.nte) + ', so the leak makes the model look ' + pts + ' points better than it really is.';
      } else if (gap === 0) {
        elVerdict.innerHTML = '<b>Leaky score: ' + pct(Lk.correct, P3.nte) + '</b>, the same as the honest score at this salary rise. ' + (S.rise <= 3 ? 'The 2025 rows are not very different yet, so they barely move the mean and SD. Raise the salary rise.' : 'The leak moved the numbers but no prediction changed. Try another salary rise.');
      } else {
        elVerdict.innerHTML = '<b>Leaky score: ' + pct(Lk.correct, P3.nte) + '</b>, lower than the honest ' + pct(H.correct, P3.nte) + ': a leak can push the score either way, so you cannot even tell which way it is wrong.';
      }
      var flips = [];
      TEST.forEach(function (ti, k) { if (H.pred[k] !== Lk.pred[k]) flips.push(k); });
      var why;
      if (S.rise === 0) {
        why = 'With no salary rise, the 2025 rows look just like the 2019 rows, so adding them to the scaler hardly changes its mean (' + inr(H.si.m) + ' versus ' + inr(Lk.si.m) + ') or SD (' + inr(H.si.s) + ' versus ' + inr(Lk.si.s) + '). The leak still breaks the rule, it just has little to hide here.';
      } else {
        why = 'With the leak, the scaler also sees the 2025 rows. Their incomes are higher, so the mean income it learns rises from ' + inr(H.si.m) + ' to ' + inr(Lk.si.m) + ' and the SD from ' + inr(H.si.s) + ' to ' + inr(Lk.si.s) + '. ' +
          'That is why the 2025 rows look more ordinary: their average scaled income drops from ' + signed(H.avgZ, 2) + ' to ' + signed(Lk.avgZ, 2) + '. A bigger SD also shrinks every income gap, so age gets more say in who counts as a neighbour. ' +
          (flips.length ? 'That changes ' + flips.length + (flips.length === 1 ? ' prediction' : ' predictions') + ' (row' + (flips.length === 1 ? ' ' : 's ') + flips.map(function (k) { return k + 1; }).join(', ') + '). ' : 'This time no prediction changes. ') +
          'But in 2019 nobody could have known what 2025 incomes would look like, so a real model never gets this help. A scaler leak is unpredictable: with other data it can move the score less, not at all, or even down. Either way the leaky number is not a fair preview, and leaks from steps that use the answers (such as picking features with all the rows) can be far bigger.';
      }
      setHtml(elWhy, why);
      // table of the test rows
      var rowsHtml = TEST.map(function (ti, k) {
        var r = L[ti], flip = H.pred[k] !== Lk.pred[k], st = [];
        if (flip) st.push('font-weight:700');
        if (k === S.sel) st.push('background:var(--indigo-soft)');
        function cell(p) { return (p ? 'Defaulted' : 'Repaid') + (p === r.y ? ' ✓' : ' ✗') + '<span class="visually-hidden">' + (p === r.y ? ' (right)' : ' (wrong)') + '</span>'; }
        return '<tr' + (st.length ? ' style="' + st.join(';') + '"' : '') + '><td>' + (k + 1) + '</td><td>' + inr(incomeAt(r, S.rise)) + '</td><td>' + r.age + '</td><td>' + signed(H.zx[ti], 2) + '</td><td>' + signed(Lk.zx[ti], 2) +
          '</td><td>' + (r.y ? 'Defaulted' : 'Repaid') + '</td><td>' + cell(H.pred[k]) + '</td><td>' + cell(Lk.pred[k]) + '</td></tr>';
      }).join('');
      var now = ' · in use';
      setHtml(elT3, '<thead><tr><th' + thSticky + '>Row</th><th' + thSticky + '>Income</th><th' + thSticky + '>Age</th><th' + thSticky + '>Scaled income: 2019 only</th><th' + thSticky + '>Scaled income: all rows</th><th' + thSticky + '>Actually</th>' +
        '<th' + thSticky + '>Model: 2019 only' + (S.fitAll ? '' : now) + '</th><th' + thSticky + '>Model: all rows' + (S.fitAll ? now : '') + '</th></tr></thead><tbody>' + rowsHtml + '</tbody>');
      elCode.textContent = code3(M, S.fitAll ? H : Lk);
      setText(elCodeNote, S.fitAll ? 'The leaky way: the scaler is fitted before the split, on every row.' : 'The correct way: the Pipeline fits the scaler on the training rows only, then reuses its mean and SD on the test rows.');
      if (rebuildOpts) {
        elSel.innerHTML = TEST.map(function (ti, k) { var r = L[ti]; return '<option value="' + k + '">Row ' + (k + 1) + ' · ' + inr(incomeAt(r, S.rise)) + ' · age ' + r.age + '</option>'; }).join('');
      }
      if (String(elSel.value) !== String(S.sel)) elSel.value = String(S.sel);
      updateReadout3();
      canvas.setAttribute('aria-label', 'Scatter chart of scaled income (across) and scaled age (up): 40 training rows from 2019 and 20 test rows from 2025, salaries up ' + risePct + '%. ' +
        'Scaler fitted on ' + (S.fitAll ? 'all rows (leak)' : 'the 2019 training rows only') + '. The 2025 rows have average scaled income ' + signed(M.avgZ, 2) + '. ' +
        'The model gets ' + M.correct + ' of 20 test rows right (' + pct(M.correct, P3.nte) + '); the honest Pipeline score is ' + pct(H.correct, P3.nte) + '.');
      return gap;
    }
    function updateReadout3() {
      var M = S.fitAll ? R3.leak : R3.honest, k = S.sel, ti = TEST[k], r = L[ti], v = M.votes[k], p = M.pred[k];
      setHtml(elReadout, '2025 row ' + (k + 1) + ': income <span class="num">' + inr(incomeAt(r, S.rise)) + '</span>, age ' + r.age + ', actually <b>' + (r.y ? 'Defaulted' : 'Repaid') + '</b>. ' +
        'Scaled income ' + signed(M.zx[ti], 2) + '. Its 5 nearest 2019 rows: ' + v + ' Defaulted, ' + (K - v) + ' Repaid, so the model predicts <b>' + (p ? 'Defaulted' : 'Repaid') + '</b> ' + (p === r.y ? '(right).' : '(wrong).'));
    }
    function p3Summary() {
      var H = R3.honest, Lk = R3.leak, M = S.fitAll ? Lk : H;
      return (S.fitAll ? 'Scaler fitted on all rows, the leak. ' : 'Scaler fitted on the 2019 rows only. ') + 'Salary rise ' + (S.rise * 10) + '%. 2025 test accuracy ' + pct(M.correct, P3.nte) +
        (S.fitAll ? ', honest score ' + pct(H.correct, P3.nte) : '') + '. Average scaled income of the 2025 rows ' + signed(M.avgZ, 2) + '.';
    }
    function checkP3(user) { if (user && S.fitAll && R3.leak.correct > R3.honest.correct) completeTask('t4'); }
    function setFit(all, user) {
      S.fitAll = all;
      pressed(fitBtns, 'data-fit', all ? 'all' : 'train');
      updateP3(false); checkP3(user); startAnim();
      if (user) announce(p3Summary());
    }
    function setRise(idx, user) {
      idx = clamp(Math.round(idx), 0, RISE_MAX);
      if (idx === S.rise) return;
      S.rise = idx;
      if (String(elRise.value) !== String(idx)) elRise.value = String(idx);
      updateP3(true); checkP3(user); startAnim();
      if (user) announce(p3Summary(), true);
    }
    function setSel(k, user, later) {
      if (k < 0 || k >= TEST.length) return;
      S.sel = k;
      updateP3(false);
      if (user) announce(elReadout.textContent, later);
      requestDraw();
    }

    /* ---------- switching parts ---------- */
    var NOTES = {
      1: '<strong>What you are seeing:</strong> 30 loan applicants. Left to right is yearly income (₹2 to 30 lakh); bottom to top is age (21 to 60). The star is the <em>query</em> applicant and the numbered dots are the 5 applicants nearest to them by <em>Euclidean distance</em> (straight-line distance), the way K-Nearest Neighbours (KNN) picks them. The shaded patch holds everyone at least as close as the 5th neighbour. <em>Scaling</em> means putting every feature (input column) on a similar range: switch it on and watch who counts as “similar”.',
      2: '<strong>What you are seeing:</strong> a city column (Mumbai, Delhi, Pune, Chennai) turned into numbers, which models need. <em>Label encoding</em> gives each city one number; <em>one-hot encoding</em> gives each city its own yes/no column. Pick two cities to see the distance a model would measure between them.',
      3: '<strong>What you are seeing:</strong> 40 loans from 2019 (small shapes, the <em>training</em> rows the model learns from) and 20 from 2025 (big shapes, the <em>test</em> rows used to check it), after standard scaling. By 2025 salaries had risen, so the test rows sit further right. A 5-nearest-neighbour model learns from 2019 and predicts whether each 2025 borrower repaid. <em>Data leakage</em> means letting information from the test rows sneak into training. Choose where the scaler learns its mean and SD.'
    };
    var KBD = {
      1: 'Keyboard: focus the chart and use ← → to move the query to the next lower or higher income, ↑ ↓ for the next older or younger applicant.',
      2: 'Keyboard: focus the picture and use ← → to change the “To” city. With one-hot, ↑ ↓ and Shift + ← → turn the pyramid.',
      3: 'Keyboard: focus the chart and use ← → to look at the previous or next 2025 row.'
    };
    function legendHtml() {
      if (S.part === 1) {
        var items = [
          legendItem(swatch('star', 'var(--haldi)', 'var(--ink)', 1.2), 'Query applicant'),
          legendItem(swatch('circle', 'var(--series-1)', 'var(--surface)', 1.2), '5 nearest (numbered)'),
          legendItem(swatch('circle', 'var(--surface)', 'var(--muted)', 1.5), 'Other applicants'),
          legendItem(swatch('patch', 'rgba(127,127,200,.18)', 'var(--indigo)', 1.2, '3 2'), 'At least as close as the 5th')
        ];
        if (S.scale !== 'none') items.push(legendItem(swatch('ring', 'none', 'var(--series-2)', 1.6, '2.5 2'), 'Nearest with no scaling'));
        return items.join('');
      }
      if (S.part === 2) {
        return legendItem(swatch('circle', 'var(--indigo)', 'var(--surface)', 1.2), 'City') +
          legendItem(swatch('circle', 'var(--haldi)', 'var(--ink)', 1.2), 'The two cities you are measuring');
      }
      return legendItem(swatch('circle', 'var(--series-1)', 'var(--ink)', 1.2), 'Repaid') +
        legendItem(swatch('square', 'var(--series-2)', 'var(--ink)', 1.2), 'Defaulted') +
        '<i style="font-style:normal">Small: 2019 training row</i><i style="font-style:normal">Big: 2025 test row</i>' +
        legendItem(swatch('ring', 'none', 'var(--ink)', 1.4), 'Ring: model got it wrong') +
        legendItem(swatch('ring', 'none', 'var(--haldi)', 2.4), 'Row you are looking at');
    }
    function setPart(p, user) {
      S.part = p;
      pressed(partBtns, 'data-part-btn', p);
      Array.prototype.forEach.call(partEls, function (el) { el.hidden = el.getAttribute('data-part') !== String(p); });
      setHtml(elNote, NOTES[p]);
      setText(elKbd, KBD[p]);
      S.hover = -1;
      if (p === 1) updateP1();
      else if (p === 2) updateP2();
      else { updateP3(false); disp = targetView(); anim = null; }
      setHtml(elLegend, legendHtml());
      canvas.style.touchAction = (p === 2 && S.enc === 'onehot') ? 'none' : 'manipulation';
      canvas.style.cursor = (p === 2 && S.enc === 'onehot') ? 'grab' : '';
      if (user) announce('Part ' + p + ': ' + ['scaling', 'encoding', 'leakage'][p - 1] + '. ' + (p === 1 ? '' : p === 2 ? p2Summary() : p3Summary()));
      draw();
    }

    /* ---------- events: buttons, selects, slider ---------- */
    Array.prototype.forEach.call(partBtns, function (b) { on(b, 'click', function () { setPart(+b.getAttribute('data-part-btn'), true); }); });
    Array.prototype.forEach.call(labEl.querySelectorAll('[data-goto]'), function (b) {
      on(b, 'click', function () {
        setPart(+b.getAttribute('data-goto'), true);
        var pb = labEl.querySelector('[data-part-btn="' + b.getAttribute('data-goto') + '"]');
        if (pb) { pb.focus({ preventScroll: true }); labEl.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' }); }
      });
    });
    Array.prototype.forEach.call(scaleBtns, function (b) { on(b, 'click', function () { setScale(b.getAttribute('data-scale'), true); setHtml(elLegend, legendHtml()); }); });
    Array.prototype.forEach.call(encBtns, function (b) { on(b, 'click', function () { setEnc(b.getAttribute('data-enc'), true); }); });
    Array.prototype.forEach.call(fitBtns, function (b) { on(b, 'click', function () { setFit(b.getAttribute('data-fit') === 'all', true); }); });
    Array.prototype.forEach.call(ansBtns, function (b) { on(b, 'click', function () { answer(b.getAttribute('data-ans')); }); });
    on(elQuery, 'change', function () { setQuery(+elQuery.value, true); });
    on(elCa, 'change', function () { setPair(+elCa.value, S.pb, true); });
    on(elCb, 'change', function () { setPair(S.pa, +elCb.value, true); });
    on(elRise, 'input', function () { setRise(+elRise.value, true); });
    on(elRise, 'change', function () { setRise(+elRise.value, true); });
    on(elSel, 'change', function () { setSel(+elSel.value, true); });

    /* ---------- events: pointer + keyboard on the canvas ---------- */
    function localPos(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    var drag = { id: null, x: 0, y: 0, sx: 0, sy: 0, moved: false };
    on(canvas, 'pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      drag.moved = false;
      if (S.part === 2 && S.enc === 'onehot') {
        drag.id = e.pointerId; drag.x = drag.sx = e.clientX; drag.y = drag.sy = e.clientY;
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        canvas.style.cursor = 'grabbing';
      }
    });
    on(canvas, 'pointermove', function (e) {
      if (drag.id !== null && e.pointerId === drag.id) {
        var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (dx || dy) {
          // a press that travels more than a few pixels is a turn, not a tap on a city
          if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) > 5) drag.moved = true;
          S.yaw += dx * 0.012; S.pitch = clamp(S.pitch + dy * 0.012, -1.3, 1.3);
          drag.x = e.clientX; drag.y = e.clientY;
          requestDraw();
        }
        return;
      }
      if (e.pointerType !== 'mouse') return;
      var p = localPos(e);
      if (S.part === 1) {
        var h = hit1(p.x, p.y, 16);
        if (h !== S.hover) { S.hover = h; canvas.style.cursor = h >= 0 ? 'pointer' : ''; requestDraw(); }
      } else if (S.part === 2) {
        if (S.enc === 'label') canvas.style.cursor = hit2(p.x, p.y) >= 0 ? 'pointer' : '';
        else canvas.style.cursor = hit2(p.x, p.y) >= 0 ? 'pointer' : 'grab';
      } else canvas.style.cursor = hit3(p.x, p.y) >= 0 ? 'pointer' : '';
    });
    function endDrag(e) {
      if (drag.id === null || e.pointerId !== drag.id) return;
      drag.id = null;
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      if (S.part === 2 && S.enc === 'onehot') canvas.style.cursor = 'grab';
    }
    on(canvas, 'pointerup', endDrag);
    on(canvas, 'pointercancel', endDrag);
    on(canvas, 'pointerleave', function (e) { if (e.pointerType === 'mouse' && S.part === 1 && S.hover >= 0) { S.hover = -1; canvas.style.cursor = ''; requestDraw(); } });
    // clicks and taps (a click never fires for a scroll gesture, and only for the main mouse button)
    on(canvas, 'click', function (e) {
      if (drag.moved) { drag.moved = false; return; }
      var p = localPos(e), touchy = e.pointerType === 'touch' || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
      if (S.part === 1) {
        var h = hit1(p.x, p.y, touchy ? 26 : 18);
        if (h >= 0 && h !== S.query) setQuery(h, true);
      } else if (S.part === 2) {
        var c = hit2(p.x, p.y);
        if (c >= 0) tapCity(c);
      } else {
        var k = hit3(p.x, p.y);
        if (k >= 0 && k !== S.sel) setSel(k, true);
      }
    });
    function nextIn(list, cur, dir) { var i = list.indexOf(cur); return list[clamp(i + dir, 0, list.length - 1)]; }
    on(canvas, 'keydown', function (e) {
      var key = e.key, handled = true;
      if (S.part === 1) {
        if (key === 'ArrowRight' || key === 'ArrowLeft') setQuery(nextIn(byIncome, S.query, key === 'ArrowRight' ? 1 : -1), true, true);
        else if (key === 'ArrowUp' || key === 'ArrowDown') setQuery(nextIn(byAge, S.query, key === 'ArrowUp' ? 1 : -1), true, true);
        else handled = false;
      } else if (S.part === 2) {
        if (S.enc === 'onehot' && (key === 'ArrowUp' || key === 'ArrowDown')) { S.pitch = clamp(S.pitch + (key === 'ArrowUp' ? -0.15 : 0.15), -1.3, 1.3); requestDraw(); }
        else if (S.enc === 'onehot' && e.shiftKey && (key === 'ArrowLeft' || key === 'ArrowRight')) { S.yaw += key === 'ArrowLeft' ? -0.15 : 0.15; requestDraw(); }
        else if (key === 'ArrowRight' || key === 'ArrowLeft') {
          var nb = (S.pb + (key === 'ArrowRight' ? 1 : 3)) % 4;
          setPair(S.pa, nb, true, true);
        } else handled = false;
      } else {
        if (key === 'ArrowRight' || key === 'ArrowLeft') setSel(clamp(S.sel + (key === 'ArrowRight' ? 1 : -1), 0, TEST.length - 1), true, true);
        else handled = false;
      }
      if (handled) e.preventDefault();
    });

    /* ---------- layout: on phones the numbers sit under the controls, so the chart and its buttons share one screen ---------- */
    var infoEl = $('info'), taskBox = $('taskbox'), leftCol = wrap.parentNode;
    var mqNarrow = window.matchMedia ? window.matchMedia('(max-width: 820px)') : null;
    function placeInfo() {
      if (destroyed) return;
      if (mqNarrow && mqNarrow.matches) { if (infoEl.nextElementSibling !== taskBox) taskBox.parentNode.insertBefore(infoEl, taskBox); }
      else if (infoEl.parentNode !== leftCol) leftCol.insertBefore(infoEl, elLive);
    }
    if (mqNarrow) { if (mqNarrow.addEventListener) mqNarrow.addEventListener('change', placeInfo); else if (mqNarrow.addListener) mqNarrow.addListener(placeInfo); }
    placeInfo();

    /* ---------- theme, fonts, size ---------- */
    function onTheme() { if (!destroyed) requestDraw(); }
    var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mql) { if (mql.addEventListener) mql.addEventListener('change', onTheme); else if (mql.addListener) mql.addListener(onTheme); }
    on(document, 'themechange', onTheme);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!destroyed) requestDraw(); });
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { resize(); }); ro.observe(wrap); }
    else on(window, 'resize', resize);

    /* ---------- starting state ---------- */
    updateP3(true);
    disp = targetView();
    updateP2();
    setPart(1, false);
    resize();

    return {
      destroy: function () {
        if (destroyed) return;          // safe to call twice
        destroyed = true;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0; anim = null;
        if (announceTimer) clearTimeout(announceTimer);
        announceTimer = 0;
        if (ro) ro.disconnect();
        if (mql) { if (mql.removeEventListener) mql.removeEventListener('change', onTheme); else if (mql.removeListener) mql.removeListener(onTheme); }
        if (mqNarrow) { if (mqNarrow.removeEventListener) mqNarrow.removeEventListener('change', placeInfo); else if (mqNarrow.removeListener) mqNarrow.removeListener(placeInfo); }
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
        listeners = [];
        // remove only this lab's own element, never a newer lab mounted into the same root
        if (labEl.parentNode) labEl.parentNode.removeChild(labEl);
      }
    };
  }

  Labs.scaling = {
    id: 'scaling',
    module: 'l2-feature-eng',
    title: 'Scaling, encoding and leakage',
    summary: 'See why features need a common scale before measuring distance, why city names need one-hot encoding, and why a scaler must learn only from the training rows.',
    tasks: TASKS.map(function (t) { return { id: t.id, text: t.text }; }),
    mount: mount
  };
})();
