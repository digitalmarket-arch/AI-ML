/* AI Marg lab: LoRA (low-rank adaptation) and quantisation.
   Part 1: a 16 x 16 weight matrix W, a fine-tuning change dW (three smooth patterns plus a little noise) and the best
   rank-r LoRA patch B·A, found with an exact SVD (one-sided Jacobi). Then a to-scale calculator for real layer sizes.
   Part 2: GPU memory to run or LoRA-fine-tune an N-billion-weight model at 16, 8 and 4 bits, and a close-up of
   rounding 16 weights to 2^bits evenly spaced levels.
   Plain classic script (ES2019). Registers window.AILabs.lora. No libraries, no network, no storage. */
(function () {
  'use strict';
  var Labs = (window.AILabs = window.AILabs || {});
  var mountCount = 0;

  /* ---------- constants ---------- */
  var N = 16;                          // the toy layer is N x N
  var S_TRUE = [1.0, 0.6, 0.36];       // strengths of the three real patterns in dW
  var NOISE = 0.0028;                  // sd of the small noise added to dW (keeps rank-3 error near 3%)
  var NOISE_ONLY_SD = 0.073;           // sd of the "pure random noise" change (about the same overall size)
  var W_SEED = 4096, UPDATE_SEED = 21, QUANT_SEED = 77;
  var START_RANK = 1;
  var D_VALUES = [512, 768, 1024, 2048, 3072, 4096, 5120, 8192];
  var R_VALUES = [1, 2, 4, 8, 16, 32, 64, 128, 256];
  var START_D = 768, START_R = 16, START_L = 64;
  var GPUS = [
    { id: 'laptop', name: 'Laptop GPU', short: 'Laptop', gb: 6 },
    { id: 't4', name: 'Colab T4', short: 'T4', gb: 15 },
    { id: 'desk', name: 'Desktop GPU', short: 'Desktop', gb: 24 }
  ];
  var BITS = [16, 8, 4];
  var RUN_EXTRA = 0.2;                 // rough extra for running: 20% of the weights
  var TRAIN_EXTRA_GB = 2;              // rough extra on top of that for LoRA training
  var START_MODEL = 13;
  var QBITS = [8, 4, 3, 2];
  var OUTLIER_IDX = 10, OUTLIER_VALUE = 2.6;

  var TASKS = [
    { id: 't1', text: 'Find the smallest rank r whose patch B·A copies the change ΔW with less than 5% error (keep “Low-rank + noise” selected).' },
    { id: 't2', text: 'Work out why rank 1 is not enough for this change: compare the pattern-strength bars, then answer the question under them.' },
    { id: 't3', text: 'In the scale-up calculator, set d = 4,096 and r = 8, then type how many times fewer numbers LoRA trains than full fine-tuning.' },
    { id: 't4', text: 'Plan a QLoRA fine-tune on a free Colab T4: choose a 7B model, “Fine-tune with LoRA”, the T4 and 4-bit, and see it fit.' }
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
  function gauss(rnd) {
    var u = 0;
    while (u === 0) u = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd());
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function zeros(n) { var a = new Array(n); for (var i = 0; i < n; i++) a[i] = 0; return a; }
  function matrix(n, m) { var M = []; for (var i = 0; i < n; i++) M.push(zeros(m)); return M; }
  // Indian digit grouping: 1677216 -> 16,77,216
  function fmtIN(v, d) {
    var s = Math.abs(v).toFixed(d || 0), neg = v < 0 && parseFloat(s) !== 0;
    var i = s.indexOf('.'), ip = i < 0 ? s : s.slice(0, i), fp = i < 0 ? '' : s.slice(i);
    if (ip.length > 3) ip = ip.slice(0, -3).replace(/\B(?=(\d{2})+$)/g, ',') + ',' + ip.slice(-3);
    return (neg ? '−' : '') + ip + fp;
  }
  // counts: exact below a million, then millions / billions (the units ML papers use)
  function fmtShort(n) {
    if (n < 1e6) return fmtIN(n, 0);
    if (n < 1e9) { var m = n / 1e6; return (m < 10 ? m.toFixed(2) : m < 100 ? m.toFixed(1) : m.toFixed(0)) + ' million'; }
    var b = n / 1e9; return (b < 10 ? b.toFixed(2) : b < 100 ? b.toFixed(1) : b.toFixed(0)) + ' billion';
  }
  function fmtBytes(b) {
    if (b < 1e6) return (b / 1e3).toFixed(b < 1e4 ? 1 : 0) + ' KB';
    if (b < 1e9) return (b / 1e6).toFixed(b < 1e7 ? 2 : b < 1e8 ? 1 : 0) + ' MB';
    return (b / 1e9).toFixed(b < 1e10 ? 2 : 1) + ' GB';
  }
  function fmtGB(x) { return (x < 100 ? x.toFixed(1) : x.toFixed(0)); }
  function fmtErr(x) { return (100 * x).toFixed(1) + '%'; }
  function fmtShare(x) { var p = 100 * x; return (p >= 10 ? p.toFixed(0) : p >= 1 ? p.toFixed(1) : p.toPrecision(2)) + '%'; }
  function fmtTimes(x) { return Math.abs(x - Math.round(x)) < 1e-9 ? fmtIN(x, 0) : fmtIN(x, 1); }
  function fmtW(v, d) { var s = v.toFixed(d); return (v < 0 && parseFloat(s) !== 0 ? '−' + s.slice(1) : s.replace('-', '')); }
  function niceStep(raw) {
    var p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p;
  }

  /* ---------- maths: the toy layer ---------- */
  function smoothVec(rnd) {
    var v = zeros(N);
    for (var f = 1; f <= 3; f++) {
      var amp = gauss(rnd) / f, ph = rnd() * 2 * Math.PI;
      for (var i = 0; i < N; i++) v[i] += amp * Math.cos(Math.PI * f * (i + 0.5) / N + ph);
    }
    return v;
  }
  // Gram–Schmidt: makes the patterns independent, so dW has exactly 3 strong directions before the noise
  function orthonormal(vs) {
    var out = [], i, j;
    for (var k = 0; k < vs.length; k++) {
      var v = vs[k].slice();
      for (j = 0; j < out.length; j++) { var d = 0; for (i = 0; i < N; i++) d += v[i] * out[j][i]; for (i = 0; i < N; i++) v[i] -= d * out[j][i]; }
      var n = 0; for (i = 0; i < N; i++) n += v[i] * v[i]; n = Math.sqrt(n) || 1;
      for (i = 0; i < N; i++) v[i] /= n;
      out.push(v);
    }
    return out;
  }
  function makeW() {
    var rnd = mulberry32(W_SEED), M = matrix(N, N);
    for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) M[i][j] = gauss(rnd) * 0.5;
    return M;
  }
  function makeUpdate(seed, kind) {
    var rnd = mulberry32(seed), M = matrix(N, N), i, j, k;
    if (kind === 'noise') {
      for (i = 0; i < N; i++) for (j = 0; j < N; j++) M[i][j] = gauss(rnd) * NOISE_ONLY_SD;
      return M;
    }
    var U = orthonormal([smoothVec(rnd), smoothVec(rnd), smoothVec(rnd)]);
    var V = orthonormal([smoothVec(rnd), smoothVec(rnd), smoothVec(rnd)]);
    for (k = 0; k < 3; k++) for (i = 0; i < N; i++) for (j = 0; j < N; j++) M[i][j] += S_TRUE[k] * U[k][i] * V[k][j];
    for (i = 0; i < N; i++) for (j = 0; j < N; j++) M[i][j] += NOISE * gauss(rnd);
    return M;
  }
  // One-sided Jacobi SVD: M = U · diag(s) · Vᵀ with s sorted from biggest to smallest.
  // It rotates pairs of columns until every pair is perpendicular; the column lengths are then the singular values.
  function svd(M) {
    var m = M.length, n = M[0].length, A = M.map(function (r) { return r.slice(); }), V = matrix(n, n), i, j, p, q;
    for (i = 0; i < n; i++) V[i][i] = 1;
    for (var sweep = 0; sweep < 60; sweep++) {
      var off = 0;
      for (p = 0; p < n - 1; p++) {
        for (q = p + 1; q < n; q++) {
          var al = 0, be = 0, ga = 0;
          for (i = 0; i < m; i++) { al += A[i][p] * A[i][p]; be += A[i][q] * A[i][q]; ga += A[i][p] * A[i][q]; }
          if (ga === 0 || Math.abs(ga) <= 1e-15 * Math.sqrt(al * be)) continue;
          off = Math.max(off, Math.abs(ga) / Math.sqrt(al * be));
          var ze = (be - al) / (2 * ga), t = (ze >= 0 ? 1 : -1) / (Math.abs(ze) + Math.sqrt(1 + ze * ze));
          var c = 1 / Math.sqrt(1 + t * t), s = c * t;
          for (i = 0; i < m; i++) { var x = A[i][p], y = A[i][q]; A[i][p] = c * x - s * y; A[i][q] = s * x + c * y; }
          for (i = 0; i < n; i++) { var x2 = V[i][p], y2 = V[i][q]; V[i][p] = c * x2 - s * y2; V[i][q] = s * x2 + c * y2; }
        }
      }
      if (off < 1e-13) break;
    }
    var cols = [];
    for (j = 0; j < n; j++) {
      var nr = 0; for (i = 0; i < m; i++) nr += A[i][j] * A[i][j]; nr = Math.sqrt(nr);
      var u = zeros(m), v = zeros(n);
      for (i = 0; i < m; i++) u[i] = nr > 0 ? A[i][j] / nr : 0;
      for (i = 0; i < n; i++) v[i] = V[i][j];
      // fix the sign so the pictures do not flip: the biggest entry of u is positive
      var bi = 0; for (i = 1; i < m; i++) if (Math.abs(u[i]) > Math.abs(u[bi])) bi = i;
      if (u[bi] < 0) { for (i = 0; i < m; i++) u[i] = -u[i]; for (i = 0; i < n; i++) v[i] = -v[i]; }
      cols.push({ s: nr, u: u, v: v });
    }
    cols.sort(function (a, b) { return b.s - a.s; });
    return { s: cols.map(function (o) { return o.s; }), U: cols.map(function (o) { return o.u; }), V: cols.map(function (o) { return o.v; }) };
  }
  function fro(M) { var s = 0; for (var i = 0; i < M.length; i++) for (var j = 0; j < M[i].length; j++) s += M[i][j] * M[i][j]; return Math.sqrt(s); }
  // LoRA factors for rank r, split evenly: B = U_r·√Σ (16 x r), A = √Σ·V_rᵀ (r x 16), so B·A is the best rank-r copy of dW
  function factors(S, r) {
    var B = matrix(N, r), A = matrix(r, N), i, j, k;
    for (k = 0; k < r; k++) {
      var sq = Math.sqrt(S.s[k]);
      for (i = 0; i < N; i++) B[i][k] = S.U[k][i] * sq;
      for (j = 0; j < N; j++) A[k][j] = sq * S.V[k][j];
    }
    return { B: B, A: A };
  }
  function multiply(B, A) {
    var n = B.length, r = A.length, m = A[0].length, M = matrix(n, m);
    for (var i = 0; i < n; i++) for (var k = 0; k < r; k++) { var b = B[i][k]; if (b === 0) continue; for (var j = 0; j < m; j++) M[i][j] += b * A[k][j]; }
    return M;
  }
  function subtract(X, Y) { return X.map(function (row, i) { return row.map(function (v, j) { return v - Y[i][j]; }); }); }
  function maxAbs(M) { var m = 0; for (var i = 0; i < M.length; i++) for (var j = 0; j < M[i].length; j++) m = Math.max(m, Math.abs(M[i][j])); return m; }

  /* ---------- maths: memory + quantisation ---------- */
  function weightsGB(nB, bits) { return nB * bits / 8; }          // N billion weights × bits ÷ 8 bits per byte = GB (1 GB = 10⁹ bytes)
  function extraGB(w, mode) { return RUN_EXTRA * w + (mode === 'ft' ? TRAIN_EXTRA_GB : 0); }
  function makeQuantWeights(seed) {
    var rnd = mulberry32(seed), out = [];
    for (var i = 0; i < 16; i++) out.push(Math.round(clamp(gauss(rnd) * 0.42, -1.1, 1.1) * 1e4) / 1e4);
    return out;
  }
  // min–max quantisation: 2^bits evenly spaced levels from the smallest weight to the biggest, each weight rounded to the nearest
  function quantise(ws, bits) {
    var lo = Math.min.apply(null, ws), hi = Math.max.apply(null, ws), L = Math.pow(2, bits), step = (hi - lo) / (L - 1);
    var lv = [], q = [], e = [], sum = 0, mx = 0, mi = 0;
    for (var i = 0; i < ws.length; i++) {
      var k = step > 0 ? Math.round((ws[i] - lo) / step) : 0;
      k = clamp(k, 0, L - 1);
      var v = lo + k * step;
      lv.push(k); q.push(v); e.push(ws[i] - v);
      sum += Math.abs(ws[i] - v);
      if (Math.abs(ws[i] - v) > mx) { mx = Math.abs(ws[i] - v); mi = i; }
    }
    return { lo: lo, hi: hi, L: L, step: step, level: lv, q: q, e: e, avg: sum / ws.length, max: mx, maxIdx: mi, bits: bits };
  }

  /* ---------- theme ---------- */
  var THEME_NAMES = ['--bg', '--surface', '--surface-2', '--ink', '--muted', '--line', '--indigo', '--indigo-soft', '--haldi', '--haldi-soft', '--sindoor', '--ok', '--bad', '--series-1', '--series-2', '--series-3', '--series-4'];
  var scratch = null;
  function toRgb(str) {
    if (!scratch) scratch = document.createElement('canvas').getContext('2d');
    scratch.fillStyle = '#000';
    scratch.fillStyle = str || '#000';
    var v = scratch.fillStyle;
    if (v.charAt(0) === '#') return [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16)];
    var m = v.match(/[\d.]+/g) || [0, 0, 0];
    return [+m[0], +m[1], +m[2]];
  }
  function readTheme() {
    var cs = getComputedStyle(document.documentElement), T = { key: '', rgb: {} };
    for (var i = 0; i < THEME_NAMES.length; i++) {
      var n = THEME_NAMES[i], v = cs.getPropertyValue(n).trim();
      var k = n.slice(2).replace(/-(\w)/g, function (a, c) { return c.toUpperCase(); });
      T[k] = v; T.rgb[k] = toRgb(v); T.key += v + '|';
    }
    T.font = cs.getPropertyValue('--font-body').trim() || 'system-ui, sans-serif';
    return T;
  }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function mixRgb(a, b, t) { return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * t) + ',' + Math.round(a[1] + (b[1] - a[1]) * t) + ',' + Math.round(a[2] + (b[2] - a[2]) * t) + ')'; }
  // diverging colour: blue below zero, gold above zero, the background colour at zero
  function divColor(T, t) {
    t = clamp(t, -1, 1);
    return mixRgb(T.rgb.surface, t < 0 ? T.rgb.series1 : T.rgb.series3, Math.abs(t));
  }

  /* ---------- mount ---------- */
  function mount(root, ctx) {
    var P = 'lora' + (++mountCount) + '-';
    var listeners = [], timers = {}, destroyed = false;
    function on(el, type, fn, opts) { el.addEventListener(type, fn, opts); listeners.push([el, type, fn, opts]); }
    function later(key, ms, fn) {
      if (timers[key]) clearTimeout(timers[key]);
      timers[key] = setTimeout(function () { timers[key] = 0; if (!destroyed) fn(); }, ms);
    }
    // live-region text: while a slider moves, wait until it rests so screen readers are not flooded;
    // an immediate update cancels any older pending one so it can never be overwritten by stale text
    function setLive(key, node, html, delay, also) {
      if (timers[key]) { clearTimeout(timers[key]); timers[key] = 0; }
      var apply = function () { setHtml(node, key, html); if (also) also(); };
      if (delay) later(key, delay, apply); else apply();
    }

    /* ----- state ----- */
    var W = makeW();
    var S1 = { kind: 'low', seed: UPDATE_SEED, r: START_RANK, dW: null, svd: null, errs: [], rMin: 0, ba: null, left: null, fac: null, scaleW: 1, scaleD: 1, scaleF: 1, visited: {}, hover: null, qAnswered: false };
    var S2 = { di: D_VALUES.indexOf(START_D), ri: R_VALUES.indexOf(START_R), L: START_L, solved: false };
    var S3 = { n: START_MODEL, mode: 'run', bits: 16, gpu: 1 };
    var S4 = { bits: 4, seed: QUANT_SEED, base: makeQuantWeights(QUANT_SEED), outlier: false, hover: -1, Q: null };
    S1.scaleW = maxAbs(W);

    function rebuildUpdate() {
      S1.dW = makeUpdate(S1.seed, S1.kind);
      S1.svd = svd(S1.dW);
      var nd = fro(S1.dW);
      S1.errs = [];
      for (var r = 1; r <= N; r++) {
        var f = factors(S1.svd, r);
        S1.errs.push(fro(subtract(S1.dW, multiply(f.B, f.A))) / nd);
      }
      S1.rMin = 1;
      while (S1.rMin < N && !(S1.errs[S1.rMin - 1] < 0.05)) S1.rMin++;
      S1.scaleD = maxAbs(S1.dW);
      // B and A share one colour scale, fixed for this change: at rank r they hold its r strongest patterns
      var full = factors(S1.svd, N);
      S1.scaleF = Math.max(maxAbs(full.B), maxAbs(full.A)) || 1;
      rebuildRank();
    }
    function rebuildRank() {
      S1.fac = factors(S1.svd, S1.r);
      S1.ba = multiply(S1.fac.B, S1.fac.A);
      S1.left = subtract(S1.dW, S1.ba);
    }
    function quantWeights() {
      var ws = S4.base.slice();
      if (S4.outlier) ws[OUTLIER_IDX] = OUTLIER_VALUE;
      return ws;
    }
    rebuildUpdate();
    S4.Q = quantise(quantWeights(), S4.bits);

    /* ----- markup ----- */
    function stat(id, k, v) { return '<div class="stat"><div class="k">' + k + '</div><div class="v" id="' + P + id + '">' + (v || '—') + '</div></div>'; }
    function segHtml(lblId, label, attr, items, cur) {
      return '<div class="control"><span class="control-label" id="' + P + lblId + '">' + label + '</span>' +
        '<div class="seg" role="group" aria-labelledby="' + P + lblId + '">' +
        items.map(function (it) { return '<button type="button" ' + attr + '="' + it[0] + '" aria-pressed="' + String(String(it[0]) === String(cur)) + '">' + it[1] + '</button>'; }).join('') +
        '</div></div>';
    }
    function canvasWrap(id, h, label, cursor) {
      return '<div class="lab-canvas-wrap" id="' + P + id + 'wrap" style="aspect-ratio:auto;height:' + h + 'px">' +
        '<div aria-hidden="true" data-sentinel="1" style="position:absolute;left:0;right:0;top:0;height:0"></div>' +
        '<canvas id="' + P + id + '" role="img" style="touch-action:auto' + (cursor ? ';cursor:' + cursor : '') + '" aria-label="' + label + '"></canvas></div>';
    }
    function legend(items) {
      return '<div class="lab-legend">' + items.map(function (it) { return '<span style="--c:var(' + it[0] + ')">' + it[1] + '</span>'; }).join('') + '</div>';
    }
    var tasksHtml = TASKS.map(function (t) { return '<li data-task="' + t.id + '">' + t.text + '</li>'; }).join('');
    var dNow = D_VALUES[S2.di], rNow = R_VALUES[S2.ri];

    var labEl = document.createElement('div');
    labEl.className = 'lab';
    labEl.setAttribute('data-lab', 'lora');
    labEl.innerHTML =
      '<p class="lab-note"><strong>What you are seeing:</strong> a tiny model layer: a 16 × 16 grid of <em>weights</em> W (the numbers a model learned during pre-training). ' +
        '<em>Fine-tuning</em> (extra training for a new job, say answering questions about UPI payments in your bank’s style) wants to add a change ΔW (say “delta W”) to them. ' +
        '<em>LoRA</em> (Low-Rank Adaptation) keeps W frozen and learns the change as two thin matrices multiplied together: B (16 × r) times A (r × 16). ' +
        'The <em>rank</em> r sets how thin they are. Blue squares are below zero, gold squares above zero, pale ones close to zero.</p>' +

      '<h2 class="lab-h">Part 1: LoRA, a thin patch for a big grid</h2>' +
      '<div class="lab-body" id="' + P + 'body1">' +
        '<div class="stack-sm" id="' + P + 'left1">' +
          canvasWrap('mats', 400, 'Colour grids of the weights, the wanted change and the LoRA patch', 'crosshair') +
          '<p class="small" id="' + P + 'cell" style="min-height:3em">Hover over or tap a square to read its numbers.</p>' +
          '<div id="' + P + 'leftmore1" class="stack-sm">' +
            legend([['--series-1', 'Below zero'], ['--series-3', 'Above zero']]) +
            '<p class="small muted">Paler means closer to zero. ΔW, B·A and the leftover share one colour scale, so a pale leftover grid means LoRA copied the change well. W has its own scale.</p>' +
            '<div class="lab-stats" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr))">' +
              stat('srank', 'Rank r') + stat('strain', 'LoRA trains') + stat('serr', 'Error left') + stat('svs', 'vs full ΔW') +
            '</div>' +
          '</div>' +
          '<div id="' + P + 'svblock" class="stack-sm" style="margin-top:8px">' +
            '<h2 class="lab-h">How strong is each pattern in ΔW?</h2>' +
            '<p class="small muted">SVD (singular value decomposition, a standard maths tool) splits any grid into 16 simple patterns, strongest first. The best rank-r patch keeps the r strongest, shown in blue. ' +
              'Real LoRA finds B and A by training; here we jump straight to the best possible B and A for each rank.</p>' +
            canvasWrap('sv', 190, 'Bar chart of pattern strengths') +
            '<div class="card-flat stack-sm">' +
              '<p id="' + P + 'qtext"><strong>Question:</strong> why is rank 1 not enough for the low-rank change?</p>' +
              '<div class="stack-sm" role="group" aria-labelledby="' + P + 'qtext">' +
                '<button type="button" class="btn btn-sm" data-q="a" style="justify-content:flex-start;text-align:left">Rank 1 trains more numbers than the full ΔW.</button>' +
                '<button type="button" class="btn btn-sm" data-q="b" style="justify-content:flex-start;text-align:left">ΔW is built from 3 strong patterns, and a rank-1 patch can hold only 1 pattern.</button>' +
                '<button type="button" class="btn btn-sm" data-q="c" style="justify-content:flex-start;text-align:left">The small random noise in ΔW is too big for LoRA to copy.</button>' +
              '</div>' +
              '<p class="small" id="' + P + 'qfb" role="status" aria-live="polite"></p>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="lab-controls" id="' + P + 'ctl1">' +
          '<div class="control" id="' + P + 'rankctl"><label for="' + P + 'rank">Rank r (how thin B and A are) <output id="' + P + 'rankout" for="' + P + 'rank">' + START_RANK + '</output></label>' +
            '<input type="range" id="' + P + 'rank" min="1" max="16" step="1" value="' + START_RANK + '" aria-describedby="' + P + 'rankhelp">' +
            '<p class="small muted" id="' + P + 'rankhelp">B is 16 × r and A is r × 16, so LoRA trains 2 × 16 × r numbers. The full change ΔW has 16 × 16 = 256.</p></div>' +
          segHtml('kindlbl', 'Kind of change ΔW', 'data-kind', [['low', 'Low-rank + noise'], ['noise', 'Pure random noise']], 'low') +
          '<p class="small muted" style="margin-top:-8px">Changes from real fine-tuning behave like the first kind: a few strong patterns plus a little noise.</p>' +
          '<div><button type="button" class="btn btn-sm" id="' + P + 'new">New example change</button></div>' +
          '<div class="callout callout-indigo small" id="' + P + 'msg" role="status" aria-live="polite" style="min-height:4.2em"></div>' +
          '<div class="stack-sm" id="' + P + 'taskblock"><h2 class="lab-h">Your tasks</h2><ul class="lab-tasks" id="' + P + 'tasks">' + tasksHtml + '</ul></div>' +
        '</div>' +
      '</div>' +

      '<h2 class="lab-h" style="margin-top:12px">Scale it up: one layer of a real model</h2>' +
      '<p class="small muted">Real layers are far bigger. In a 7B model (7 billion weights) such as Llama 2 7B, a typical weight grid is 4,096 × 4,096. ' +
        'Full fine-tuning trains every number of each grid it changes: d × d. LoRA trains only B (d × r) and A (r × d): 2 × d × r numbers. (1 million = 10 lakh.)</p>' +
      '<div class="lab-body">' +
        '<div class="stack-sm">' +
          canvasWrap('scale', 280, 'To-scale drawing of a full weight grid and the two thin LoRA strips') +
          '<p class="small muted" id="' + P + 'scalecap" style="min-height:3em"></p>' +
          '<div class="lab-stats" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr))">' +
            stat('cfull', 'Full fine-tune') + stat('clora', 'LoRA trains') + stat('cshare', 'LoRA share') + stat('cfile', 'LoRA file') + stat('ctimes', 'Times fewer', '?') +
          '</div>' +
        '</div>' +
        '<div class="lab-controls">' +
          '<div class="control"><label for="' + P + 'd">Layer size d (a d × d grid) <output id="' + P + 'dout" for="' + P + 'd">' + fmtIN(dNow, 0) + '</output></label>' +
            '<input type="range" id="' + P + 'd" min="0" max="' + (D_VALUES.length - 1) + '" step="1" value="' + S2.di + '" aria-valuetext="' + fmtIN(dNow, 0) + '"></div>' +
          '<div class="control"><label for="' + P + 'r2">LoRA rank r <output id="' + P + 'r2out" for="' + P + 'r2">' + rNow + '</output></label>' +
            '<input type="range" id="' + P + 'r2" min="0" max="' + (R_VALUES.length - 1) + '" step="1" value="' + S2.ri + '" aria-valuetext="' + rNow + '"></div>' +
          '<div class="control"><label for="' + P + 'L">Grids changed by fine-tuning <output id="' + P + 'Lout" for="' + P + 'L">' + START_L + '</output></label>' +
            '<input type="range" id="' + P + 'L" min="1" max="160" step="1" value="' + START_L + '" aria-describedby="' + P + 'Lhelp">' +
            '<p class="small muted" id="' + P + 'Lhelp">Llama 2 7B has 32 blocks. LoRA often adapts 2 grids in each (the “query” and “value” parts of attention): 64 in all.</p></div>' +
          '<form class="control" id="' + P + 'ansform" novalidate>' +
            '<label for="' + P + 'ans">How many times fewer numbers does LoRA train than full fine-tuning?</label>' +
            '<div class="row"><input type="text" inputmode="decimal" autocomplete="off" id="' + P + 'ans" style="width:8em" aria-describedby="' + P + 'anshelp">' +
            '<button type="submit" class="btn btn-sm">Check</button></div>' +
            '<p class="small muted" id="' + P + 'anshelp">Use the two counts on the left (full ÷ LoRA). The number of grids does not change the answer.</p>' +
            '<p class="small" id="' + P + 'ansfb" role="status" aria-live="polite"></p>' +
          '</form>' +
        '</div>' +
      '</div>' +

      '<h2 class="lab-h" style="margin-top:12px">Part 2: Will the model fit on your GPU?</h2>' +
      '<p class="small muted">A GPU (graphics card, the chip that runs AI models fast) has its own memory, and the whole model must fit inside it. Normally each weight takes 16 bits (2 bytes). ' +
        '<em>Quantisation</em> stores each weight with fewer bits by rounding it: 8-bit takes 1 byte, 4-bit takes half a byte.</p>' +
      '<div class="lab-body">' +
        '<div class="stack-sm">' +
          canvasWrap('mem', 300, 'Bar chart of GPU memory needed at 16, 8 and 4 bits') +
          legend([['--ok', 'Fits on the chosen GPU'], ['--bad', 'Too big for it']]) +
          '<p class="small muted">Solid part: the weights (exact). Faded part on top: a rough extra (an estimate, not exact). Dashed lines: GPU memory sizes.</p>' +
          '<div class="lab-stats" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr))">' +
            stat('mw', 'Weights') + stat('mx', 'Rough extra') + stat('mt', 'Total (about)') + stat('mg', 'GPU memory') +
          '</div>' +
          '<p class="small" id="' + P + 'mformula"></p>' +
          '<p class="small muted" id="' + P + 'mfull"></p>' +
        '</div>' +
        '<div class="lab-controls">' +
          '<div class="control"><label for="' + P + 'n">Model size (billions of weights) <output id="' + P + 'nout" for="' + P + 'n">' + START_MODEL + 'B</output></label>' +
            '<input type="range" id="' + P + 'n" min="1" max="70" step="1" value="' + START_MODEL + '" aria-valuetext="' + START_MODEL + ' billion"></div>' +
          segHtml('modelbl', 'What do you want to do?', 'data-mode', [['run', 'Run it (chat)'], ['ft', 'Fine-tune with LoRA']], 'run') +
          segHtml('bitslbl', 'Number format for the weights', 'data-bits', [[16, '16-bit'], [8, '8-bit'], [4, '4-bit']], 16) +
          segHtml('gpulbl', 'GPU', 'data-gpu', GPUS.map(function (gp, k) { return [k, (k === 1 ? 'Colab T4' : gp.short) + '<span style="display:block;font-weight:400">' + gp.gb + ' GB</span>']; }), 1) +
          '<div class="callout small" id="' + P + 'verdict" role="status" aria-live="polite" style="min-height:3.2em"></div>' +
          '<p class="small muted">Colab T4: the free GPU in Google Colab (16 GB, about 15 GB usable). Laptop: a typical gaming laptop. Desktop: a high-end card such as the RTX 4090.</p>' +
        '</div>' +
      '</div>' +

      '<h2 class="lab-h" style="margin-top:12px">Quantisation up close: rounding 16 weights</h2>' +
      '<p class="small muted">With 4 bits you can write only 2⁴ = 16 different values (<em>levels</em>). Quantisation spreads the levels evenly from the smallest weight to the biggest, then rounds every weight to its nearest level. ' +
        'The model stores just the level number (0 to 15) for each weight, plus one shared scale and offset to turn levels back into values.</p>' +
      '<div class="lab-body">' +
        '<div class="stack-sm">' +
          canvasWrap('quant', 270, 'Chart of 16 weights rounded to quantisation levels', 'crosshair') +
          '<p class="small" id="' + P + 'qread" style="min-height:3em"></p>' +
          legend([['--ink', 'Original weight (circle)'], ['--indigo', 'Stored value (bar)'], ['--sindoor', 'Rounding error (line)']]) +
          '<div class="lab-stats" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr))">' +
            stat('ql', 'Levels') + stat('qs', 'Step size') + stat('qa', 'Average error') + stat('qm', 'Biggest error') + stat('qb', 'Storage') +
          '</div>' +
          '<details class="fold"><summary>See all 16 numbers</summary><div><div class="table-wrap" tabindex="0" role="region" aria-label="All 16 weights, their levels and rounding errors"><table class="simple num">' +
            '<thead><tr><th scope="col">Weight</th><th scope="col">Original</th><th scope="col">Level</th><th scope="col">Stored as</th><th scope="col">Error</th></tr></thead>' +
            '<tbody id="' + P + 'qbody"></tbody></table></div></div></details>' +
        '</div>' +
        '<div class="lab-controls">' +
          segHtml('qbitslbl', 'Bits per weight', 'data-qbits', QBITS.map(function (b) { return [b, b + '-bit']; }), 4) +
          '<div class="row"><button type="button" class="btn btn-sm" id="' + P + 'outlier" aria-pressed="false">Add an outlier weight</button>' +
            '<button type="button" class="btn btn-sm" id="' + P + 'qnew">New weights</button></div>' +
          '<div class="callout callout-indigo small" id="' + P + 'qmsg" role="status" aria-live="polite" style="min-height:3.2em"></div>' +
          '<p class="small muted">Hover over or tap a weight to read its numbers. Rounding is why a 4-bit model is slightly less accurate than the 16-bit original, usually only a little.</p>' +
        '</div>' +
      '</div>' +

      '<p class="small muted"><strong style="color:var(--ink)">Why it matters in real ML:</strong> this is how people fine-tune a 7B model on a free Colab GPU: QLoRA loads the frozen model in 4-bit and trains only small LoRA patches (often well under 1% of the weights), and the saved patch is a few MB instead of many GB.</p>';
    root.appendChild(labEl);

    function $(id) { return labEl.querySelector('#' + P + id); }
    var el = {
      cell: $('cell'), srank: $('srank'), strain: $('strain'), serr: $('serr'), svs: $('svs'), msg: $('msg'), qfb: $('qfb'),
      rank: $('rank'), rankout: $('rankout'), rankctl: $('rankctl'), ctl1: $('ctl1'), taskblock: $('taskblock'), left1: $('left1'), leftmore1: $('leftmore1'), newBtn: $('new'),
      d: $('d'), dout: $('dout'), r2: $('r2'), r2out: $('r2out'), L: $('L'), Lout: $('Lout'), scalecap: $('scalecap'),
      cfull: $('cfull'), clora: $('clora'), cshare: $('cshare'), cfile: $('cfile'), ctimes: $('ctimes'), ansform: $('ansform'), ans: $('ans'), ansfb: $('ansfb'),
      n: $('n'), nout: $('nout'), mw: $('mw'), mx: $('mx'), mt: $('mt'), mg: $('mg'), mformula: $('mformula'), mfull: $('mfull'), verdict: $('verdict'),
      qread: $('qread'), ql: $('ql'), qs: $('qs'), qa: $('qa'), qm: $('qm'), qb: $('qb'), qbody: $('qbody'), qmsg: $('qmsg'), outlier: $('outlier'), qnew: $('qnew')
    };
    var taskEls = {};
    Array.prototype.forEach.call(labEl.querySelectorAll('[data-task]'), function (li) { taskEls[li.getAttribute('data-task')] = li; });

    /* ----- tasks ----- */
    var done = {};
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
    function completeTask(id) {
      if (done[id]) return;
      done[id] = true;
      markLi(id);
      if (ctx && ctx.onTaskDone) ctx.onTaskDone(id);
    }

    /* ----- canvases ----- */
    var panels = {};
    function makePanel(id, heightFor, draw) {
      var canvas = $(id), wrap = $(id + 'wrap');
      var p = { id: id, canvas: canvas, wrap: wrap, g: canvas.getContext('2d'), w: 0, h: 0, dpr: 1, heightFor: heightFor, draw: draw, dirty: true, sentinel: wrap.querySelector('[data-sentinel]') };
      panels[id] = p;
      return p;
    }
    var theme = null;
    function getTheme() { if (!theme) theme = readTheme(); return theme; }
    function font(px, weight) { return (weight ? weight + ' ' : '') + px + 'px ' + getTheme().font; }
    function clearPanel(p, T) {
      var g = p.g;
      g.setTransform(p.dpr, 0, 0, p.dpr, 0, 0);
      g.clearRect(0, 0, p.w, p.h);
      g.fillStyle = T.surface; g.fillRect(0, 0, p.w, p.h);
    }
    // shrink a label until it fits the given width
    function fitFont(g, text, maxW, px, weight, minPx) {
      var f = px;
      g.font = font(f, weight);
      while (f > (minPx || 9) && g.measureText(text).width > maxW) { f -= 0.5; g.font = font(f, weight); }
      return f;
    }
    var rafId = 0;
    function requestPaint(id) {
      if (id) { if (panels[id]) panels[id].dirty = true; }
      else Object.keys(panels).forEach(function (k) { panels[k].dirty = true; });
      if (!rafId && !destroyed) rafId = requestAnimationFrame(paintDirty);
    }
    function paintDirty() {
      rafId = 0;
      if (destroyed) return;
      Object.keys(panels).forEach(function (k) { var p = panels[k]; if (p.dirty) paintPanel(p); });
    }
    function paintPanel(p) {
      p.dirty = false;
      if (p.w < 2 || p.h < 2) return;
      p.draw(p, getTheme());
    }
    // the wrapper height is a function of its width only; the sentinel inside it never changes height,
    // so setting the height here cannot trigger another resize notification
    function layoutPanel(p, force) {
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      var wr = p.wrap.getBoundingClientRect();
      if (wr.width < 2) return;
      var inner = Math.max(1, Math.round(wr.width - 2));
      var wantH = Math.round(p.heightFor(inner)) + 2;
      if (Math.round(wr.height) !== wantH) p.wrap.style.height = wantH + 'px';
      var r = p.canvas.getBoundingClientRect();
      var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      if (force || w !== p.w || h !== p.h || dpr !== p.dpr) {
        p.w = w; p.h = h; p.dpr = dpr;
        p.canvas.width = Math.round(w * dpr); p.canvas.height = Math.round(h * dpr);
        paintPanel(p);  // resizing wipes the canvas: repaint now so there is no blank frame
      }
    }
    function layoutAll(force) { Object.keys(panels).forEach(function (k) { layoutPanel(panels[k], force); }); }

    /* ===== Part 1: the matrices ===== */
    function matGeom(w) {
      var cols = w >= 600 ? 4 : 2, small = w < 420;
      var pad = small ? 8 : 12, gap = small ? 12 : 18;
      var c = clamp(Math.floor((w - 2 * pad - (cols - 1) * gap) / (16 * cols)), 4, 13);
      var pw = 16 * c, tw = cols * pw + (cols - 1) * gap, x0 = Math.max(pad, Math.round((w - tw) / 2));
      var labH = 36, gapY = 16, rows = 4 / cols, list = [];
      for (var k = 0; k < 4; k++) {
        var col = k % cols, row = Math.floor(k / cols);
        list.push({ x: x0 + col * (pw + gap), y: pad + row * (labH + pw + gapY) + labH });
      }
      var fy = pad + rows * (labH + pw) + (rows - 1) * gapY + gapY + 4;
      var cf = cols === 4 ? Math.max(4, Math.round(c * 0.75)) : Math.max(4, Math.round(c * 0.6));
      var textH = cols === 4 ? 0 : 40, flab = 18;
      return { cols: cols, pad: pad, gap: gap, c: c, pw: pw, x0: x0, tw: tw, labH: labH, list: list, fy: fy, cf: cf, textH: textH, flab: flab, h: fy + textH + flab + 16 * cf + pad, w: w };
    }
    function drawCells(p, M, x, y, c, scale, T) {
      var g = p.g, d = p.dpr, nr = M.length, nc = M[0].length;
      g.setTransform(1, 0, 0, 1, 0, 0);
      for (var i = 0; i < nr; i++) {
        var y0 = Math.round((y + i * c) * d), y1 = Math.round((y + (i + 1) * c) * d);
        for (var j = 0; j < nc; j++) {
          var x0 = Math.round((x + j * c) * d), x1 = Math.round((x + (j + 1) * c) * d);
          g.fillStyle = divColor(T, M[i][j] / scale);
          g.fillRect(x0, y0, x1 - x0, y1 - y0);
        }
      }
      g.setTransform(d, 0, 0, d, 0, 0);
      g.strokeStyle = T.line; g.lineWidth = 1;
      g.strokeRect(Math.round(x) - 0.5, Math.round(y) - 0.5, nc * c + 1, nr * c + 1);
    }
    function matInfo() {
      var r = S1.r;
      return [
        { M: W, scale: S1.scaleW, title: 'W (frozen)', sub: '256 numbers, not trained' },
        { M: S1.dW, scale: S1.scaleD, title: 'ΔW (wanted change)', sub: 'full fine-tune: 256' },
        { M: S1.ba, scale: S1.scaleD, title: 'B·A (LoRA, rank ' + r + ')', sub: 'trains ' + 32 * r + ' numbers' },
        { M: S1.left, scale: S1.scaleD, title: 'Leftover ΔW − B·A', sub: 'error ' + fmtErr(S1.errs[r - 1]) }
      ];
    }
    function drawMats(p, T) {
      var g = p.g, G = matGeom(p.w), info = matInfo(), k;
      clearPanel(p, T);
      g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      for (k = 0; k < 4; k++) {
        var it = info[k], pos = G.list[k];
        g.fillStyle = T.ink; fitFont(g, it.title, G.pw + G.gap - 4, 13, '700', 10);
        g.fillText(it.title, pos.x, pos.y - G.labH + 14);
        g.fillStyle = k === 3 && S1.errs[S1.r - 1] < 0.05 && S1.kind === 'low' ? T.ok : T.muted;
        fitFont(g, it.sub, G.pw + G.gap - 4, 12, k === 3 ? '600' : '', 9.5);
        g.fillText(it.sub, pos.x, pos.y - G.labH + 30);
        drawCells(p, it.M, pos.x, pos.y, G.c, it.scale, T);
      }
      // hovered square, outlined in every grid
      if (S1.hover) {
        g.strokeStyle = T.ink; g.lineWidth = 2;
        for (k = 0; k < 4; k++) g.strokeRect(G.list[k].x + S1.hover.j * G.c - 1, G.list[k].y + S1.hover.i * G.c - 1, G.c + 2, G.c + 2);
      }
      // the two thin factors B (16 x r) and A (r x 16)
      var r = S1.r, cf = G.cf, fac = S1.fac;
      var line1 = r < 8 ? 'LoRA’s two thin matrices' : 'LoRA’s two matrices (no longer thin)', nB = 16 * r;
      var txt = ['B: 16 × ' + r + ' = ' + nB + ' numbers', 'A: ' + r + ' × 16 = ' + nB + ' numbers', 'Together: ' + 2 * nB + ' to train (ΔW has 256)'];
      var stripTop = G.fy + G.textH + G.flab, bx, signW = 26;
      if (G.cols === 4) {
        var tx = G.list[0].x, maxTw = G.list[2].x - tx - 16;
        g.fillStyle = T.ink; fitFont(g, line1, maxTw, 13, '700', 10); g.fillText(line1, tx, stripTop + 12);
        g.fillStyle = T.muted;
        for (k = 0; k < 3; k++) { fitFont(g, txt[k], maxTw, 12, '', 9.5); g.fillText(txt[k], tx, stripTop + 34 + k * 19); }
        bx = Math.min(G.list[2].x, G.w - G.pad - (r * cf + signW + 16 * cf + 52));
      } else {
        var full = (r < 8 ? 'LoRA’s two thin matrices: ' : 'No longer thin: ') + 'B is 16 × ' + r + ', A is ' + r + ' × 16', sub2 = nB + ' + ' + nB + ' = ' + 2 * nB + ' numbers to train (ΔW has 256)';
        g.fillStyle = T.ink; fitFont(g, full, G.w - 2 * G.pad, 12.5, '700', 9.5); g.fillText(full, G.pad + 2, G.fy + 14);
        g.fillStyle = T.muted; fitFont(g, sub2, G.w - 2 * G.pad, 12, '', 9.5); g.fillText(sub2, G.pad + 2, G.fy + 32);
        var groupW = r * cf + signW + 16 * cf + 52;
        bx = Math.round((G.w - groupW) / 2);
      }
      var ax = bx + r * cf + signW, midA = stripTop + Math.max(r * cf / 2, 8);
      g.fillStyle = T.ink; g.font = font(12.5, '700'); g.textAlign = 'center';
      g.fillText('B', bx + r * cf / 2, stripTop - 5);
      g.fillText('A', ax + 8 * cf, stripTop - 5);
      g.font = font(16, '700'); g.textBaseline = 'middle';
      g.fillText('×', bx + r * cf + signW / 2, midA);
      g.textAlign = 'left'; g.font = font(12.5, '700');
      g.fillText('= B·A', ax + 16 * cf + 8, midA);
      g.textBaseline = 'alphabetic';
      drawCells(p, fac.B, bx, stripTop, cf, S1.scaleF, T);
      drawCells(p, fac.A, ax, stripTop, cf, S1.scaleF, T);
    }
    function matHit(p, x, y) {
      var G = matGeom(p.w);
      for (var k = 0; k < 4; k++) {
        var pos = G.list[k];
        if (x >= pos.x && x < pos.x + G.pw && y >= pos.y && y < pos.y + G.pw) return { i: Math.floor((y - pos.y) / G.c), j: Math.floor((x - pos.x) / G.c) };
      }
      return null;
    }
    function cellText() {
      var h = S1.hover;
      if (!h) return 'Hover over or tap a square to read its numbers.';
      return 'Row ' + (h.i + 1) + ', column ' + (h.j + 1) + ': W = ' + fmtW(W[h.i][h.j], 3) + ', ΔW = ' + fmtW(S1.dW[h.i][h.j], 3) +
        ', B·A = ' + fmtW(S1.ba[h.i][h.j], 3) + ', leftover = ' + fmtW(S1.left[h.i][h.j], 3) + '.';
    }

    /* ----- strengths bar chart ----- */
    function drawSV(p, T) {
      var g = p.g, w = p.w, h = p.h, small = w < 420;
      var pl = small ? 36 : 42, pr = 10, pt = 26, pb = 36, pw = w - pl - pr, ph = h - pt - pb;
      var s = S1.svd.s, yTop = s[0] * 1.12, step = niceStep(yTop / 4), i;
      clearPanel(p, T);
      function y(v) { return pt + ph * (1 - v / yTop); }
      g.lineWidth = 1; g.font = font(11); g.fillStyle = T.muted; g.textAlign = 'right'; g.textBaseline = 'middle';
      for (var v = 0; v <= yTop + 1e-9; v += step) {
        var yy = Math.round(y(v)) + 0.5;
        g.strokeStyle = v === 0 ? T.muted : rgba(T.rgb.muted, 0.22);
        g.beginPath(); g.moveTo(pl, yy); g.lineTo(pl + pw, yy); g.stroke();
        g.fillText(step < 0.1 ? v.toFixed(2) : v.toFixed(1), pl - 6, yy);
      }
      var bw = pw / N;
      for (i = 0; i < N; i++) {
        var x = pl + i * bw + bw * 0.16, bwi = bw * 0.68, yt = y(s[i]);
        g.fillStyle = i < S1.r ? T.indigo : rgba(T.rgb.muted, 0.45);
        g.fillRect(x, yt, bwi, Math.max(1, y(0) - yt));
      }
      if (S1.r < N) {
        var dx = Math.round(pl + S1.r * bw) + 0.5;
        g.strokeStyle = T.ink; g.lineWidth = 1.5; g.setLineDash([4, 3]);
        g.beginPath(); g.moveTo(dx, pt - 4); g.lineTo(dx, y(0)); g.stroke(); g.setLineDash([]);
      }
      g.fillStyle = T.muted; g.font = font(small ? 10.5 : 11); g.textAlign = 'center'; g.textBaseline = 'top';
      for (i = 0; i < N; i++) g.fillText(String(i + 1), pl + (i + 0.5) * bw, y(0) + 4);
      g.fillStyle = T.ink; g.font = font(12, '600'); g.textBaseline = 'bottom';
      g.fillText('Pattern number (strongest first)', pl + pw / 2, h - 2);
      g.textAlign = 'left'; g.textBaseline = 'top';
      g.fillText('Strength', 4, 4);
    }

    /* ===== scale-up calculator ===== */
    function scaleCounts() {
      var d = D_VALUES[S2.di], r = R_VALUES[S2.ri], L = S2.L;
      return { d: d, r: r, L: L, full: L * d * d, lora: L * 2 * d * r, perFull: d * d, perLora: 2 * d * r, ratio: d / (2 * r), share: 2 * r / d };
    }
    function scaleH(w) { return w >= 520 ? 280 : 430; }
    // geometry of the to-scale drawing: the full d x d grid is a square of side S, the strips are S·r/d thick
    function scaleGeom(w, h, C) {
      var wide = w >= 520, pad = 12, rho = C.r / C.d;
      var boxW = wide ? Math.min(Math.round(w * 0.5), h - 2 * pad) : w - 2 * pad, boxH = wide ? h - 2 * pad : 262;
      var lab = 22, gap = 6;
      var S = Math.max(10, Math.floor((Math.min(boxW, boxH) - lab - gap) / (1 + rho)));
      var t = S * rho, td = Math.max(2, t), tot = lab + td + gap + S;
      var ox = pad + Math.round((boxW - tot) / 2), oy = pad + Math.round((boxH - tot) / 2);
      return { wide: wide, pad: pad, boxW: boxW, boxH: boxH, gap: gap, S: S, t: t, td: td, sqx: ox + lab + td + gap, sqy: oy + lab + td + gap };
    }
    function drawScale(p, T) {
      var g = p.g, w = p.w, C = scaleCounts(), Gs = scaleGeom(w, p.h, C);
      var wide = Gs.wide, pad = Gs.pad, boxW = Gs.boxW, boxH = Gs.boxH, gap = Gs.gap, S = Gs.S, td = Gs.td, sqx = Gs.sqx, sqy = Gs.sqy;
      clearPanel(p, T);
      // full grid
      g.fillStyle = rgba(T.rgb.indigo, 0.16); g.fillRect(sqx, sqy, S, S);
      g.strokeStyle = T.indigo; g.lineWidth = 1.5; g.strokeRect(sqx + 0.75, sqy + 0.75, S - 1.5, S - 1.5);
      // B (d x r) on the left, A (r x d) on top
      g.fillStyle = T.haldi;
      g.fillRect(sqx - gap - td, sqy, td, S);
      g.fillRect(sqx, sqy - gap - td, S, td);
      g.fillStyle = T.ink; g.textAlign = 'center'; g.textBaseline = 'middle';
      var t1 = 'ΔW: ' + fmtIN(C.d, 0) + ' × ' + fmtIN(C.d, 0), t2 = fmtShort(C.perFull) + ' numbers';
      fitFont(g, t1, S - 12, 13, '700', 9); g.fillText(t1, sqx + S / 2, sqy + S / 2 - 9);
      fitFont(g, t2, S - 12, 12, '', 9); g.fillText(t2, sqx + S / 2, sqy + S / 2 + 9);
      var aLab = 'A: ' + fmtIN(C.r, 0) + ' × ' + fmtIN(C.d, 0), bLab = 'B: ' + fmtIN(C.d, 0) + ' × ' + fmtIN(C.r, 0);
      fitFont(g, aLab, S, 12, '700', 9); g.textBaseline = 'bottom';
      g.fillText(aLab, sqx + S / 2, sqy - gap - td - 4);
      g.save(); g.translate(sqx - gap - td - 6, sqy + S / 2); g.rotate(-Math.PI / 2);
      fitFont(g, bLab, S, 12, '700', 9); g.textBaseline = 'bottom'; g.fillText(bLab, 0, 0); g.restore();
      // bars: numbers to train, to scale
      var bx0, by0, bw;
      if (wide) { bx0 = pad + boxW + 28; by0 = pad + 26; bw = w - bx0 - pad; }
      else { bx0 = pad; by0 = pad + boxH + 22; bw = w - 2 * pad; }
      g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      var title = 'Numbers to train in ' + C.L + ' grid' + (C.L === 1 ? '' : 's') + ' (to scale)';
      g.fillStyle = T.ink; fitFont(g, title, bw, 13, '700', 9.5); g.fillText(title, bx0, by0);
      var rowsY = [by0 + 30, by0 + 92];
      var items = [
        { name: 'Full fine-tuning: ' + fmtShort(C.full), frac: 1, fill: rgba(T.rgb.indigo, 0.16), stroke: T.indigo },
        { name: 'LoRA: ' + fmtShort(C.lora) + ' (' + fmtShare(C.share) + ')', frac: C.share, fill: T.haldi, stroke: T.haldi }
      ];
      for (var k = 0; k < 2; k++) {
        var it = items[k], yy = rowsY[k];
        g.fillStyle = T.ink; fitFont(g, it.name, bw, 12.5, '600', 9.5); g.fillText(it.name, bx0, yy);
        var len = Math.max(2, bw * it.frac);
        g.fillStyle = it.fill; g.fillRect(bx0, yy + 8, len, 20);
        g.strokeStyle = it.stroke; g.lineWidth = 1.5; g.strokeRect(bx0 + 0.75, yy + 8.75, Math.max(0.5, len - 1.5), 18.5);
      }
    }

    /* ===== Part 2: memory chart ===== */
    function memData() {
      return BITS.map(function (b) {
        var wg = weightsGB(S3.n, b), ex = extraGB(wg, S3.mode);
        return { bits: b, w: wg, x: ex, t: wg + ex, fits: wg + ex <= GPUS[S3.gpu].gb };
      });
    }
    function memH(w) { return w >= 520 ? 300 : 290; }
    function drawMem(p, T) {
      var g = p.g, w = p.w, h = p.h, small = w < 440, D = memData(), i;
      var pl = small ? 38 : 46, pr = small ? 96 : 132, pt = 32, pb = 48, pw = w - pl - pr, ph = h - pt - pb;
      clearPanel(p, T);
      var maxV = 24;
      D.forEach(function (d) { maxV = Math.max(maxV, d.t); });
      var step = niceStep(maxV * 1.08 / 5), yTop = Math.ceil(maxV * 1.08 / step) * step;
      function y(v) { return pt + ph * (1 - v / yTop); }
      // grid + ticks
      g.lineWidth = 1; g.font = font(11); g.fillStyle = T.muted; g.textAlign = 'right'; g.textBaseline = 'middle';
      for (var v = 0; v <= yTop + 1e-9; v += step) {
        var yy = Math.round(y(v)) + 0.5;
        g.strokeStyle = v === 0 ? T.muted : rgba(T.rgb.muted, 0.2);
        g.beginPath(); g.moveTo(pl, yy); g.lineTo(pl + pw, yy); g.stroke();
        g.fillText(fmtIN(v, 0), pl - 6, yy);
      }
      g.fillStyle = T.ink; g.font = font(11.5, '600'); g.textAlign = 'right'; g.textBaseline = 'bottom';
      g.fillText('GB', pl - 6, pt - 14);
      // selected column background
      var gw = pw / 3, barW = Math.min(64, gw * 0.52);
      var sel = BITS.indexOf(S3.bits);
      g.fillStyle = rgba(T.rgb.indigo, 0.1);
      g.fillRect(pl + gw * sel + 4, pt - 26, gw - 8, ph + 26 + pb - 4);
      for (i = 0; i < 3; i++) {
        var d = D[i], cx = pl + gw * (i + 0.5), x0 = Math.round(cx - barW / 2), col = d.fits ? T.rgb.ok : T.rgb.bad;
        var yW = y(d.w), yT = y(d.t), y0 = y(0);
        g.fillStyle = rgba(col, 1); g.fillRect(x0, yW, barW, y0 - yW);
        g.fillStyle = rgba(col, 0.32); g.fillRect(x0, yT, barW, yW - yT);
        g.strokeStyle = rgba(col, 1); g.lineWidth = 1.5; g.strokeRect(x0 + 0.75, yT + 0.75, barW - 1.5, Math.max(0.5, y0 - yT - 1.5));
        g.fillStyle = T.ink; g.font = font(12, i === sel ? '700' : '600'); g.textAlign = 'center'; g.textBaseline = 'bottom';
        g.fillText(fmtGB(d.t) + ' GB', cx, yT - 4);
        g.textBaseline = 'top'; g.font = font(12.5, '700');
        g.fillText(d.bits + '-bit', cx, y0 + 6);
        g.fillStyle = d.fits ? T.ok : T.bad;
        var vt = d.fits ? '✓ fits' : '✗ too big';
        fitFont(g, vt, gw - 6, 11.5, '700', 8.5);
        g.fillText(vt, cx, y0 + 24);
      }
      // GPU lines with labels pushed apart so they never overlap
      var labs = GPUS.map(function (gp, k) { return { k: k, y: y(gp.gb), ly: y(gp.gb), text: (small ? gp.short : gp.name) + ' ' + gp.gb + ' GB' }; });
      labs.sort(function (a, b) { return a.y - b.y; });
      for (i = 1; i < labs.length; i++) if (labs[i].ly - labs[i - 1].ly < 14) labs[i].ly = labs[i - 1].ly + 14;
      var over = labs[labs.length - 1].ly - (pt + ph - 4);
      if (over > 0) for (i = 0; i < labs.length; i++) labs[i].ly -= over;
      labs.forEach(function (L) {
        var isSel = L.k === S3.gpu, yl = Math.round(L.y) + 0.5;
        g.strokeStyle = isSel ? T.ink : T.muted; g.lineWidth = isSel ? 2 : 1; g.setLineDash(isSel ? [7, 4] : [3, 4]);
        g.beginPath(); g.moveTo(pl, yl); g.lineTo(pl + pw + 6, yl); g.stroke(); g.setLineDash([]);
        g.fillStyle = isSel ? T.ink : T.muted; g.textAlign = 'left'; g.textBaseline = 'middle';
        fitFont(g, L.text, pr - 12, 11.5, isSel ? '700' : '', 9);
        g.fillText(L.text, pl + pw + 10, L.ly);
      });
    }

    /* ===== quantisation close-up ===== */
    function quantH(w) { return w >= 520 ? 340 : 330; }
    // main chart on top, the weight numbers under it, then a strip of rounding errors drawn much bigger
    function quantGeom(p) {
      var small = p.w < 440, pl = small ? 44 : 52, pr = small ? 58 : 70, pt = 14, stripH = 56, below = 24;
      var Q = S4.Q, span = (Q.hi - Q.lo) || 1, lo = Q.lo - 0.08 * span, hi = Q.hi + 0.08 * span;
      var ph = p.h - pt - 22 - 22 - stripH - below;
      return { small: small, pl: pl, pr: pr, pt: pt, pw: p.w - pl - pr, ph: ph, lo: lo, hi: hi, numY: pt + ph + 5, sy: pt + ph + 22 + 22, sh: stripH };
    }
    function drawQuant(p, T) {
      var g = p.g, G = quantGeom(p), Q = S4.Q, ws = quantWeights(), i;
      clearPanel(p, T);
      function y(v) { return G.pt + G.ph * (1 - (v - G.lo) / (G.hi - G.lo)); }
      var bw = G.pw / 16;
      if (S4.hover >= 0) { g.fillStyle = rgba(T.rgb.indigo, 0.12); g.fillRect(G.pl + S4.hover * bw, G.pt, bw, G.ph); }
      // levels
      var stepPx = Q.step / (G.hi - G.lo) * G.ph;
      if (stepPx >= 3) {
        g.strokeStyle = rgba(T.rgb.muted, 0.35); g.lineWidth = 1;
        for (var k = 0; k < Q.L; k++) { var ly = Math.round(y(Q.lo + k * Q.step)) + 0.5; g.beginPath(); g.moveTo(G.pl, ly); g.lineTo(G.pl + G.pw, ly); g.stroke(); }
      } else {
        g.fillStyle = rgba(T.rgb.muted, 0.14); g.fillRect(G.pl, y(Q.hi), G.pw, y(Q.lo) - y(Q.hi));
      }
      // value ticks on the left
      var vstep = niceStep((G.hi - G.lo) / 4);
      g.font = font(11); g.fillStyle = T.muted; g.textAlign = 'right'; g.textBaseline = 'middle';
      for (var v = Math.ceil(G.lo / vstep) * vstep; v <= G.hi + 1e-9; v += vstep) {
        var yy = Math.round(y(v)) + 0.5;
        if (Math.abs(v) < 1e-9) { g.strokeStyle = rgba(T.rgb.ink, 0.5); g.beginPath(); g.moveTo(G.pl, yy); g.lineTo(G.pl + G.pw, yy); g.stroke(); }
        g.fillText(fmtW(v, vstep < 0.1 ? 2 : 1), G.pl - 6, yy);
      }
      // level numbers on the right
      g.textAlign = 'left'; g.fillStyle = T.ink; g.font = font(11, '600');
      g.fillText('level ' + (Q.L - 1), G.pl + G.pw + 6, y(Q.hi));
      g.fillText('level 0', G.pl + G.pw + 6, y(Q.lo));
      if (stepPx < 3) { g.fillStyle = T.muted; g.font = font(10.5); g.fillText(fmtIN(Q.L, 0) + ' levels', G.pl + G.pw + 6, (y(Q.hi) + y(Q.lo)) / 2); }
      // weights: stored value = a short bar on its level, original = a small ring, error = the red line between them
      var half = Math.min(9, bw * 0.36);
      for (i = 0; i < 16; i++) {
        var cx = G.pl + (i + 0.5) * bw, yo = y(ws[i]), yq = y(Q.q[i]);
        g.fillStyle = T.indigo; g.fillRect(cx - half, yq - 1.5, 2 * half, 3);
        if (Math.abs(yo - yq) >= 0.5) {
          g.strokeStyle = T.sindoor; g.lineWidth = 2.5; g.beginPath(); g.moveTo(cx, yo); g.lineTo(cx, yq); g.stroke();
        }
        g.beginPath(); g.arc(cx, yo, 3.4, 0, Math.PI * 2);
        g.fillStyle = T.surface; g.fill(); g.lineWidth = 1.6; g.strokeStyle = T.ink; g.stroke();
      }
      g.strokeStyle = T.muted; g.lineWidth = 1;
      g.beginPath(); g.moveTo(G.pl + 0.5, G.pt); g.lineTo(G.pl + 0.5, G.pt + G.ph); g.stroke();
      g.fillStyle = T.muted; g.font = font(G.small ? 10 : 11); g.textAlign = 'center'; g.textBaseline = 'top';
      for (i = 0; i < 16; i++) g.fillText(String(i + 1), G.pl + (i + 0.5) * bw, G.numY);
      g.fillStyle = T.ink; g.font = font(11, '600'); g.textAlign = 'right';
      g.fillText('weight', G.pl - 6, G.numY);
      // error strip: the size of each rounding error, where the top line is half a step (the most it can ever be)
      var sy = G.sy, sh = G.sh, hs = Q.step / 2 || 1;
      g.fillStyle = T.ink; g.font = font(11.5, '700'); g.textAlign = 'left'; g.textBaseline = 'bottom';
      var stitle = 'Rounding error of each weight, zoomed in';
      fitFont(g, stitle, G.pw + G.pr - 4, 11.5, '700', 9);
      g.fillText(stitle, G.pl, sy - 6);
      g.strokeStyle = rgba(T.rgb.muted, 0.35); g.lineWidth = 1; g.setLineDash([3, 3]);
      g.beginPath(); g.moveTo(G.pl, Math.round(sy) + 0.5); g.lineTo(G.pl + G.pw, Math.round(sy) + 0.5); g.stroke(); g.setLineDash([]);
      g.strokeStyle = T.muted;
      g.beginPath(); g.moveTo(G.pl, Math.round(sy + sh) + 0.5); g.lineTo(G.pl + G.pw, Math.round(sy + sh) + 0.5); g.stroke();
      for (i = 0; i < 16; i++) {
        var eh = Math.abs(Q.e[i]) / hs * sh;
        g.fillStyle = i === S4.hover ? T.ink : T.sindoor;
        g.fillRect(G.pl + (i + 0.5) * bw - half / 2 - 1, sy + sh - eh, half + 2, eh);
      }
      g.fillStyle = T.muted; g.font = font(10.5); g.textAlign = 'right'; g.textBaseline = 'middle';
      g.fillText('½ step', G.pl - 6, sy);
      g.fillText('0', G.pl - 6, sy + sh);
      g.textAlign = 'left';
      g.fillText('= ' + fmtW(hs, 3), G.pl + G.pw + 6, sy);
    }
    function quantHit(p, x) {
      var G = quantGeom(p);
      if (x < G.pl || x > G.pl + G.pw) return -1;
      return clamp(Math.floor((x - G.pl) / (G.pw / 16)), 0, 15);
    }

    /* ----- panels ----- */
    var pMats = makePanel('mats', function (w) { return matGeom(w).h; }, drawMats);
    var pSV = makePanel('sv', function (w) { return w < 420 ? 190 : 200; }, drawSV);
    var pScale = makePanel('scale', scaleH, drawScale);
    var pMem = makePanel('mem', memH, drawMem);
    var pQuant = makePanel('quant', quantH, drawQuant);

    /* ===== text updates ===== */
    var lastText = {};
    function setText(node, key, v) { if (lastText[key] !== v) { lastText[key] = v; node.textContent = v; } }
    function setHtml(node, key, v) { if (lastText[key] !== v) { lastText[key] = v; node.innerHTML = v; } }

    function rankMessage() {
      var r = S1.r, e = S1.errs[r - 1], n = 32 * r;
      if (S1.kind === 'noise') {
        if (r < S1.rMin) {
          return '<b>Pure noise has no few strong patterns:</b> its strength bars shrink slowly instead of dropping after 3. Rank ' + r + ' still leaves ' + fmtErr(e) + ' of it. ' +
            'Getting below 5% needs rank ' + S1.rMin + ', which trains ' + 32 * S1.rMin + ' numbers, more than the 256 in ΔW itself. There is no shortcut.';
        }
        return '<b>Rank ' + r + ':</b> ' + fmtErr(e) + ' left, but only because B and A now hold ' + n + ' numbers, more than the 256 in ΔW itself. Pure noise has no shortcut.';
      }
      if (r < S1.rMin) {
        return '<b>Rank ' + r + ':</b> B·A copies only ' + (r === 1 ? 'the strongest pattern' : 'the ' + r + ' strongest patterns') + ', so ' + fmtErr(e) +
          ' of the change is left over. Look at the leftover grid: clear stripes remain.';
      }
      if (r === S1.rMin) return '<b>Rank ' + r + ':</b> only ' + fmtErr(e) + ' is left over, and it is just faint noise. LoRA trains ' + n + ' numbers instead of 256.';
      if (n < 256) return '<b>Rank ' + r + ':</b> ' + fmtErr(e) + ' left over. The extra patterns only copy tiny noise, while LoRA now trains ' + n + ' numbers.';
      return '<b>Rank ' + r + ':</b> ' + fmtErr(e) + ' left over, but B and A now hold ' + n + ' numbers, ' + (n === 256 ? 'as many as' : 'more than') +
        ' the 256 in ΔW. On a tiny 16 × 16 grid LoRA saves numbers only when r is below 8. On real layers (below) the saving is huge.';
    }
    function updatePart1(announce) {
      var r = S1.r, e = S1.errs[r - 1], n = 32 * r;
      el.rankout.textContent = String(r);
      setText(el.srank, 'srank', String(r));
      setText(el.strain, 'strain', n + ' of 256');
      setText(el.serr, 'serr', fmtErr(e));
      var ratio = 256 / n;
      setText(el.svs, 'svs', ratio > 1 ? fmtTimes(ratio) + '× fewer' : ratio === 1 ? 'the same' : fmtTimes(1 / ratio) + '× more');
      setText(el.cell, 'cell', cellText());
      var msg = rankMessage();
      setLive('msg', el.msg, msg, announce ? 450 : 0);
      var s = S1.svd.s;
      pMats.canvas.setAttribute('aria-label', 'Four 16 by 16 colour grids: the frozen weights W, the wanted change ΔW, the rank ' + r + ' LoRA patch B·A, and the leftover ΔW minus B·A. ' +
        'The patch trains ' + n + ' numbers instead of 256 and leaves ' + fmtErr(e) + ' error. Below them, the thin matrices B (16 by ' + r + ') and A (' + r + ' by 16).');
      pSV.canvas.setAttribute('aria-label', 'Bar chart of the 16 pattern strengths of ΔW, strongest first: ' + s.slice(0, 4).map(function (v) { return v.toFixed(2); }).join(', ') +
        ', and so on down to ' + s[N - 1].toFixed(3) + '. The first ' + r + ' are kept by the rank ' + r + ' patch.');
      requestPaint('mats'); requestPaint('sv');
    }

    function updateScale() {
      var C = scaleCounts();
      el.dout.textContent = fmtIN(C.d, 0); el.d.setAttribute('aria-valuetext', fmtIN(C.d, 0));
      el.r2out.textContent = String(C.r); el.r2.setAttribute('aria-valuetext', String(C.r));
      el.Lout.textContent = String(C.L);
      setText(el.cfull, 'cfull', fmtShort(C.full));
      setText(el.clora, 'clora', fmtShort(C.lora));
      setText(el.cshare, 'cshare', fmtShare(C.share));
      setText(el.cfile, 'cfile', fmtBytes(C.lora * 2));
      setText(el.ctimes, 'ctimes', S2.solved ? fmtTimes(C.ratio) + '×' : '?');
      var t = scaleGeom(pScale.w || 400, pScale.h || 280, C).t;
      var cap = 'Per grid: full fine-tuning trains ' + fmtIN(C.perFull, 0) + ' numbers; LoRA trains 2 × ' + fmtIN(C.d, 0) + ' × ' + C.r + ' = ' + fmtIN(C.perLora, 0) + '. ' +
        'Saved at 16-bit (2 bytes a number), the LoRA file is ' + fmtBytes(C.lora * 2) + '; a full update of all ' + C.L + ' grids would be ' + fmtBytes(C.full * 2) + '.';
      if (t < 2) cap += ' The gold strips are drawn 2 px thick so you can see them; truly to scale they would be ' + (t < 0.1 ? t.toFixed(2) : t.toFixed(1)) + ' px.';
      setText(el.scalecap, 'scalecap', cap);
      pScale.canvas.setAttribute('aria-label', 'To-scale drawing: a ' + fmtIN(C.d, 0) + ' by ' + fmtIN(C.d, 0) + ' square for the full change, with two thin strips B and A that are ' + C.r + ' wide. ' +
        'Bars: full fine-tuning trains ' + fmtShort(C.full) + ' numbers in ' + C.L + ' grids, LoRA trains ' + fmtShort(C.lora) + ', ' + fmtShare(C.share) + ' of that.');
      requestPaint('scale');
    }

    function updateMem(announce) {
      var D = memData(), sel = D[BITS.indexOf(S3.bits)], gpu = GPUS[S3.gpu];
      el.nout.textContent = S3.n + 'B'; el.n.setAttribute('aria-valuetext', S3.n + ' billion');
      setText(el.mw, 'mw', fmtGB(sel.w) + ' GB');
      setText(el.mx, 'mx', fmtGB(sel.x) + ' GB');
      setText(el.mt, 'mt', fmtGB(sel.t) + ' GB');
      setText(el.mg, 'mg', gpu.gb + ' GB');
      var extraTxt = S3.mode === 'ft'
        ? '20% + 2 GB = ' + fmtGB(sel.x) + ' GB for activations (the in-between results the model works out), the software, and training: the small LoRA patch, its optimiser (the part that decides each update) and the activations it must keep to learn from short examples.'
        : '20% = ' + fmtGB(sel.x) + ' GB for activations (the in-between results the model works out), the KV cache (its memory of the chat so far) and the software.';
      setHtml(el.mformula, 'mformula', '<b>Weights</b> = ' + S3.n + ' billion × ' + S3.bits + ' bits ÷ 8 = <b>' + fmtGB(sel.w) + ' GB</b> (8 bits make a byte; here 1 GB = 1 billion bytes). ' +
        '<b>Rough extra</b> (a guess, not exact): ' + extraTxt);
      setText(el.mfull, 'mfull', 'Compare full fine-tuning (training every weight with the usual Adam optimiser): roughly 16 bytes per weight, about ' + fmtIN(16 * S3.n, 0) + ' GB for ' + S3.n + 'B, before activations. That is why people use LoRA.');
      var v = sel.fits
        ? '<span aria-hidden="true" style="color:var(--ok);font-weight:700">✓</span> <b>Fits:</b> about ' + fmtGB(sel.t) + ' GB of the ' + gpu.name + '’s ' + gpu.gb + ' GB, with ' + fmtGB(gpu.gb - sel.t) + ' GB to spare.'
        : '<span aria-hidden="true" style="color:var(--bad);font-weight:700">✗</span> <b>Too big:</b> needs about ' + fmtGB(sel.t) + ' GB, but the ' + gpu.name + ' has ' + gpu.gb + ' GB. Try fewer bits, a smaller model or a bigger GPU.';
      if (S3.mode === 'ft' && S3.bits === 4) v += ' (4-bit base model + LoRA is called <em>QLoRA</em>.)';
      setLive('verdict', el.verdict, v, announce ? 400 : 0, function () {
        el.verdict.style.borderLeftColor = sel.fits ? 'var(--ok)' : 'var(--bad)';
        el.verdict.style.background = sel.fits ? 'var(--ok-soft, var(--surface-2))' : 'var(--bad-soft, var(--surface-2))';
      });
      pMem.canvas.setAttribute('aria-label', 'Bar chart of memory for a ' + S3.n + 'B model, ' + (S3.mode === 'ft' ? 'LoRA fine-tuning' : 'running for chat') + ': ' +
        D.map(function (d) { return d.bits + '-bit about ' + fmtGB(d.t) + ' GB (' + (d.fits ? 'fits' : 'too big') + ')'; }).join(', ') + '. The ' + gpu.name + ' has ' + gpu.gb + ' GB.');
      requestPaint('mem');
    }

    function quantReadText() {
      var Q = S4.Q, ws = quantWeights(), i = S4.hover >= 0 ? S4.hover : Q.maxIdx;
      return 'Weight ' + (i + 1) + (S4.hover >= 0 ? '' : ' (the biggest error)') + ': ' + fmtW(ws[i], 4) + ' is stored as level ' + Q.level[i] + ' of 0–' + (Q.L - 1) +
        ', which stands for ' + fmtW(Q.q[i], 4) + '. Rounding error ' + fmtW(Math.abs(Q.e[i]), 4) + '.';
    }
    function updateQuant(announce) {
      var Q = S4.Q = quantise(quantWeights(), S4.bits), ws = quantWeights();
      setText(el.ql, 'ql', fmtIN(Q.L, 0));
      setText(el.qs, 'qs', fmtW(Q.step, 4));
      setText(el.qa, 'qa', fmtW(Q.avg, 4));
      setText(el.qm, 'qm', fmtW(Q.max, 4));
      setText(el.qb, 'qb', (16 * Q.bits + 32) + ' bits');
      setText(el.qread, 'qread', quantReadText());
      var rows = '';
      for (var i = 0; i < 16; i++) rows += '<tr><td>' + (i + 1) + '</td><td>' + fmtW(ws[i], 4) + '</td><td>' + Q.level[i] + '</td><td>' + fmtW(Q.q[i], 4) + '</td><td>' + fmtW(Math.abs(Q.e[i]), 4) + '</td></tr>';
      setHtml(el.qbody, 'qbody', rows);
      var m = '<b>' + Q.bits + '-bit:</b> ' + fmtIN(Q.L, 0) + ' levels, ' + fmtW(Q.step, 4) + ' apart, so no weight is ever more than half a step (' + fmtW(Q.step / 2, 4) + ') off. ' +
        'Storage for these 16 weights: 16 × ' + Q.bits + ' = ' + 16 * Q.bits + ' bits, plus 32 bits for the shared scale and offset, against 256 bits at 16-bit.';
      if (S4.outlier) {
        var Q0 = quantise(S4.base, S4.bits);
        m = '<b>One outlier stretched the range:</b> weight ' + (OUTLIER_IDX + 1) + ' is ' + fmtW(OUTLIER_VALUE, 1) + ', so the same ' + fmtIN(Q.L, 0) + ' levels now spread over a range ' +
          fmtTimes(Math.round(10 * (Q.hi - Q.lo) / (Q0.hi - Q0.lo)) / 10) + '× as wide, and the average error grew from ' + fmtW(Q0.avg, 4) + ' to ' + fmtW(Q.avg, 4) + '. ' +
          'Real 4-bit methods round small blocks of weights separately, or keep rare big weights aside, to avoid this.';
      }
      setLive('qmsg', el.qmsg, m, announce ? 400 : 0);
      pQuant.canvas.setAttribute('aria-label', '16 weights rounded to ' + fmtIN(Q.L, 0) + ' levels (' + Q.bits + '-bit)' + (S4.outlier ? ', with one outlier' : '') +
        '. Average rounding error ' + fmtW(Q.avg, 4) + ', biggest ' + fmtW(Q.max, 4) + '.');
      requestPaint('quant');
    }

    /* ===== events: Part 1 ===== */
    on(el.rank, 'input', function () {
      var r = clamp(Math.round(+el.rank.value), 1, N);
      S1.visited[r] = true;
      if (r !== S1.r) { S1.r = r; rebuildRank(); updatePart1(true); }
    });
    on(el.rank, 'change', function () {
      S1.visited[S1.r] = true;
      if (S1.kind === 'low' && S1.r === S1.rMin && (S1.rMin === 1 || S1.visited[S1.rMin - 1])) completeTask('t1');
    });
    var kindBtns = labEl.querySelectorAll('[data-kind]');
    Array.prototype.forEach.call(kindBtns, function (b) {
      on(b, 'click', function () {
        var k = b.getAttribute('data-kind');
        if (k === S1.kind) return;
        S1.kind = k;
        Array.prototype.forEach.call(kindBtns, function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-kind') === k)); });
        rebuildUpdate(); updatePart1(false);
      });
    });
    on(el.newBtn, 'click', function () {
      S1.seed += 1;
      rebuildUpdate(); updatePart1(false);
    });
    var Q_FEEDBACK = {
      a: '<span aria-hidden="true" style="color:var(--bad);font-weight:700">✗</span> Not that: rank 1 trains just 32 numbers, far fewer than 256. Look at the strength bars instead.',
      b: '<span aria-hidden="true" style="color:var(--ok);font-weight:700">✓</span> <b>Right.</b> B·A is a sum of r simple patterns (each column of B times a row of A), so rank r can hold r patterns. This ΔW has 3 tall bars, so it needs rank 3; the other bars are tiny noise.',
      c: '<span aria-hidden="true" style="color:var(--bad);font-weight:700">✗</span> Not quite: with “Low-rank + noise”, the noise bars (4 to 16) are tiny. Rank 1 misses two of the three tall bars, and those are real patterns, not noise.'
    };
    Array.prototype.forEach.call(labEl.querySelectorAll('[data-q]'), function (b) {
      on(b, 'click', function () {
        var q = b.getAttribute('data-q');
        el.qfb.innerHTML = Q_FEEDBACK[q];
        if (q === 'b') completeTask('t2');
      });
    });
    on(pMats.canvas, 'pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var r = pMats.canvas.getBoundingClientRect(), h = matHit(pMats, e.clientX - r.left, e.clientY - r.top);
      var same = (h && S1.hover && h.i === S1.hover.i && h.j === S1.hover.j) || (!h && !S1.hover);
      if (!same) { S1.hover = h; setText(el.cell, 'cell', cellText()); requestPaint('mats'); }
    });
    on(pMats.canvas, 'pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      var r = pMats.canvas.getBoundingClientRect(), h = matHit(pMats, e.clientX - r.left, e.clientY - r.top);
      S1.hover = h; setText(el.cell, 'cell', cellText()); requestPaint('mats');
    });
    on(pMats.canvas, 'pointerleave', function (e) {
      if (e.pointerType !== 'mouse' || !S1.hover) return;
      S1.hover = null; setText(el.cell, 'cell', cellText()); requestPaint('mats');
    });

    /* ===== events: scale-up ===== */
    on(el.d, 'input', function () { S2.di = clamp(Math.round(+el.d.value), 0, D_VALUES.length - 1); updateScale(); });
    on(el.r2, 'input', function () { S2.ri = clamp(Math.round(+el.r2.value), 0, R_VALUES.length - 1); updateScale(); });
    on(el.L, 'input', function () { S2.L = clamp(Math.round(+el.L.value), 1, 160); updateScale(); });
    on(el.ansform, 'submit', function (e) {
      e.preventDefault();
      var raw = String(el.ans.value || '').replace(/[,\s×x]/gi, ''), v = parseFloat(raw), C = scaleCounts();
      if (!raw || !isFinite(v)) { el.ansfb.textContent = 'Type a number first, for example 12.'; return; }
      var right = Math.abs(v - C.ratio) <= Math.max(0.05, 0.005 * C.ratio);
      if (right) {
        S2.solved = true; updateScale();
        if (C.d === 4096 && C.r === 8) {
          el.ansfb.innerHTML = '<span aria-hidden="true" style="color:var(--ok);font-weight:700">✓</span> <b>Right: 256 times fewer.</b> 4,096 × 4,096 = 1,67,77,216 numbers against 2 × 4,096 × 8 = 65,536. In general the ratio is d ÷ (2 × r).';
          completeTask('t3');
        } else {
          el.ansfb.innerHTML = '<span aria-hidden="true" style="color:var(--ok);font-weight:700">✓</span> Right for d = ' + fmtIN(C.d, 0) + ' and r = ' + C.r + ': ' + fmtTimes(C.ratio) + ' times fewer. ' +
            (done.t3 ? '' : 'Now try the task’s setting: d = 4,096 and r = 8.');
        }
      } else {
        el.ansfb.innerHTML = '<span aria-hidden="true" style="color:var(--bad);font-weight:700">✗</span> Not quite. Divide the full count for one grid (d × d = ' + fmtIN(C.perFull, 0) + ') by the LoRA count (2 × d × r = ' + fmtIN(C.perLora, 0) + ').';
      }
    });

    /* ===== events: memory ===== */
    function checkT4() { if (S3.n === 7 && S3.mode === 'ft' && S3.gpu === 1 && S3.bits === 4 && memData()[2].fits) completeTask('t4'); }
    on(el.n, 'input', function () { S3.n = clamp(Math.round(+el.n.value), 1, 70); updateMem(true); checkT4(); });
    function segGroup(attr, apply) {
      var btns = labEl.querySelectorAll('[' + attr + ']');
      Array.prototype.forEach.call(btns, function (b) {
        on(b, 'click', function () {
          var v = b.getAttribute(attr);
          Array.prototype.forEach.call(btns, function (x) { x.setAttribute('aria-pressed', String(x.getAttribute(attr) === v)); });
          apply(v);
        });
      });
    }
    segGroup('data-mode', function (v) { S3.mode = v; updateMem(false); checkT4(); });
    segGroup('data-bits', function (v) { S3.bits = +v; updateMem(false); checkT4(); });
    segGroup('data-gpu', function (v) { S3.gpu = +v; updateMem(false); checkT4(); });

    /* ===== events: quantisation ===== */
    segGroup('data-qbits', function (v) { S4.bits = +v; updateQuant(false); });
    on(el.outlier, 'click', function () {
      S4.outlier = !S4.outlier;
      el.outlier.setAttribute('aria-pressed', String(S4.outlier));
      el.outlier.textContent = S4.outlier ? 'Remove the outlier' : 'Add an outlier weight';
      updateQuant(false);
    });
    on(el.qnew, 'click', function () { S4.seed += 1; S4.base = makeQuantWeights(S4.seed); S4.hover = -1; updateQuant(false); });
    on(pQuant.canvas, 'pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var i = quantHit(pQuant, e.clientX - pQuant.canvas.getBoundingClientRect().left);
      if (i !== S4.hover) { S4.hover = i; setText(el.qread, 'qread', quantReadText()); requestPaint('quant'); }
    });
    on(pQuant.canvas, 'pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      var i = quantHit(pQuant, e.clientX - pQuant.canvas.getBoundingClientRect().left);
      S4.hover = i; setText(el.qread, 'qread', quantReadText()); requestPaint('quant');
    });
    on(pQuant.canvas, 'pointerleave', function (e) {
      if (e.pointerType !== 'mouse' || S4.hover < 0) return;
      S4.hover = -1; setText(el.qread, 'qread', quantReadText()); requestPaint('quant');
    });

    /* ===== layout: on narrow screens the rank slider and its message sit right under the grids ===== */
    var mqNarrow = window.matchMedia ? window.matchMedia('(max-width: 820px)') : null;
    function placeRank() {
      if (destroyed) return;
      var narrow = !!(mqNarrow && mqNarrow.matches);
      if (narrow) {
        if (el.rankctl.parentNode !== el.left1) { el.left1.insertBefore(el.rankctl, el.leftmore1); el.left1.insertBefore(el.msg, el.leftmore1); }
      } else if (el.rankctl.parentNode !== el.ctl1) { el.ctl1.insertBefore(el.rankctl, el.ctl1.firstChild); el.ctl1.insertBefore(el.msg, el.taskblock); }
    }
    if (mqNarrow) { if (mqNarrow.addEventListener) mqNarrow.addEventListener('change', placeRank); else if (mqNarrow.addListener) mqNarrow.addListener(placeRank); }

    /* ===== theme, fonts, resize ===== */
    function onTheme() { theme = null; requestPaint(); }
    var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mql) { if (mql.addEventListener) mql.addEventListener('change', onTheme); else if (mql.addListener) mql.addListener(onTheme); }
    on(document, 'themechange', onTheme);
    function onFonts() { if (!destroyed) { theme = null; requestPaint(); } }
    var fontSet = document.fonts && document.fonts.addEventListener ? document.fonts : null;
    if (fontSet) {
      on(fontSet, 'loadingdone', onFonts);
      if (fontSet.ready && fontSet.ready.then) fontSet.ready.then(onFonts, function () { /* ignore */ });
    }
    var ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () { if (!destroyed) { layoutAll(false); updateScale(); } });
      Object.keys(panels).forEach(function (k) { ro.observe(panels[k].sentinel); });
    } else on(window, 'resize', function () { layoutAll(false); updateScale(); });

    /* ===== start ===== */
    placeRank();
    updatePart1(false);
    updateMem(false);
    updateQuant(false);
    layoutAll(true);
    updateScale();

    return {
      destroy: function () {
        if (destroyed) return;
        destroyed = true;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
        Object.keys(timers).forEach(function (k) { if (timers[k]) clearTimeout(timers[k]); timers[k] = 0; });
        if (ro) ro.disconnect();
        if (mql) { if (mql.removeEventListener) mql.removeEventListener('change', onTheme); else if (mql.removeListener) mql.removeListener(onTheme); }
        if (mqNarrow) { if (mqNarrow.removeEventListener) mqNarrow.removeEventListener('change', placeRank); else if (mqNarrow.removeListener) mqNarrow.removeListener(placeRank); }
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
        listeners = [];
        // remove only this lab's own element, never a newer lab mounted into the same root
        if (labEl.parentNode) labEl.parentNode.removeChild(labEl);
      }
    };
  }

  Labs.lora = {
    id: 'lora',
    module: 'l4-finetuning',
    title: 'LoRA and quantisation',
    summary: 'See how LoRA copies a fine-tuning change with two thin matrices, how few numbers it trains on real layers, and how 4-bit quantisation squeezes a 7B model onto a free GPU.',
    tasks: TASKS.map(function (t) { return { id: t.id, text: t.text }; }),
    mount: mount
  };
})();
