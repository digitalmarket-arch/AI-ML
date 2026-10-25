/* AI Marg lab: underfitting vs overfitting with polynomial curve fitting.
   Plain classic script (ES2019). Registers window.AILabs.overfit. No libraries, no network. */
(function () {
  'use strict';
  var Labs = (window.AILabs = window.AILabs || {});
  var mountCount = 0;

  /* ---------- constants ---------- */
  var MAX_DEG = 15;
  var N_MIN = 16;          // with at least 16 training dots, degree 15 can at most pass through every dot
  var N_MAX = 100;
  var N_TEST = 40;
  var PHI = 0.6180339887498949;
  var Y_MIN = -2.25, Y_MAX = 2.25;
  var RIDGE = 1e-14;       // tiny ridge term (per training point), only there to keep the maths stable.
                           // Checked against exact rational least squares: it changes no shown number.
  var CHART_LO = 1e-4, CHART_HI = 100;
  var SAMPLES = 301;
  var TWEEN_MS = 240;
  var START_SEED = 7;

  var RULES = {
    wave: { name: 'Wave', f: function (x) { return 0.9 * Math.sin(2.4 * Math.PI * x + 0.4); } },
    bend: { name: 'Bend', f: function (x) { return 4 * (x - 0.45) * (x - 0.45) - 0.8; } },
    line: { name: 'Line', f: function (x) { return 1.4 * x - 0.7; } }
  };

  var TASKS = [
    { id: 't1', text: 'Find the sweet spot: move the degree to the one with the lowest test error (the lowest hollow dot on the error chart).' },
    { id: 't2', text: 'Overfit on purpose: raise the degree until training error is almost 0 (below 0.02) while test error shoots above 1. Tip: fewer training points make this easier.' },
    { id: 't3', text: 'Cure overfitting with more data: at degree 10 or more, first see “Overfitting”. Then, without lowering the degree, add training points until the verdict says “Good fit”.' },
    { id: 't4', text: 'Feel the wobble: drag a filled dot up or down with a low degree (4 or less), then with a high degree (10 or more). Which curve jumps more?' }
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
  // standard normal (Box-Muller), cut off at ±2.5 so every dot stays inside the plot
  function gaussCut(rnd) {
    var u = 0;
    while (u === 0) u = rnd();
    var z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd());
    return z < -2.5 ? -2.5 : z > 2.5 ? 2.5 : z;
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function groupIN(n) {
    try { return Math.round(n).toLocaleString('en-IN'); } catch (e) { return String(Math.round(n)); }
  }
  // error values range from 0.000 to crores, so format them sensibly
  function fmtErr(v) {
    if (v == null || !isFinite(v)) return '—';
    if (v < 10) return v.toFixed(3);
    if (v < 1000) return v.toFixed(1);
    if (v < 1e5) return groupIN(v);
    if (v < 1e7) return (v / 1e5).toFixed(1) + ' lakh';
    if (v < 1e9) return (v / 1e7).toFixed(1) + ' crore';
    return '> 100 crore';
  }
  function fmtTick(v) {
    if (v >= 1000) return groupIN(v);
    if (v >= 1) return String(Math.round(v));
    return String(Number(v.toPrecision(1)));
  }

  /* ---------- the maths: least-squares polynomial fit ----------
     x in [0,1] is scaled to u = 2x - 1 in [-1,1]. The curve is written with Legendre polynomials
     P0(u)=1, P1(u)=u, P(k+1)(u) = ((2k+1) u Pk(u) - k P(k-1)(u)) / (k+1).
     Any polynomial of degree d is a mix of P0..Pd, so this is exactly the same family of curves as
     w0 + w1·x + ... + wd·x^d, but the numbers stay well-behaved up to degree 15.
     We minimise  sum (curve(u_i) - y_i)^2 + λ·|c|^2  by solving the normal equations
     (ΦᵀΦ + λI) c = Φᵀy  with a Cholesky factorisation. λ is tiny, so this is ordinary least squares. */
  function legendre(u, d, out) {
    out[0] = 1;
    if (d >= 1) out[1] = u;
    for (var k = 1; k < d; k++) out[k + 1] = ((2 * k + 1) * u * out[k] - k * out[k - 1]) / (k + 1);
    return out;
  }
  function choleskySolve(A, b, m, lam) {
    var L = new Float64Array(m * m), i, j, k, s;
    for (i = 0; i < m; i++) {
      for (j = 0; j <= i; j++) {
        s = A[i * m + j] + (i === j ? lam : 0);
        for (k = 0; k < j; k++) s -= L[i * m + k] * L[j * m + k];
        if (i === j) {
          if (!(s > 0)) return null;
          L[i * m + i] = Math.sqrt(s);
        } else {
          L[i * m + j] = s / L[j * m + j];
        }
      }
    }
    var z = new Float64Array(m), c = new Float64Array(m);
    for (i = 0; i < m; i++) {
      s = b[i];
      for (k = 0; k < i; k++) s -= L[i * m + k] * z[k];
      z[i] = s / L[i * m + i];
    }
    for (i = m - 1; i >= 0; i--) {
      s = z[i];
      for (k = i + 1; k < m; k++) s -= L[k * m + i] * c[k];
      c[i] = s / L[i * m + i];
      if (!isFinite(c[i])) return null;
    }
    return c;
  }
  function fitPoly(us, ys, d) {
    var m = d + 1, n = us.length, i, j, k;
    var A = new Float64Array(m * m), b = new Float64Array(m), phi = new Float64Array(m);
    for (k = 0; k < n; k++) {
      legendre(us[k], d, phi);
      for (i = 0; i < m; i++) {
        b[i] += phi[i] * ys[k];
        for (j = 0; j <= i; j++) A[i * m + j] += phi[i] * phi[j];
      }
    }
    var lam = RIDGE * Math.max(1, n);
    for (var attempt = 0; attempt < 8; attempt++) {
      var c = choleskySolve(A, b, m, lam);
      if (c) return c;
      lam *= 100; // only if rounding made the matrix look singular: a slightly bigger ridge fixes it
    }
    return new Float64Array(m);
  }
  function evalPoly(c, u) {
    var d = c.length - 1, p0 = 1, p1 = u, s = c[0];
    if (d >= 1) s += c[1] * u;
    for (var k = 1; k < d; k++) {
      var p2 = ((2 * k + 1) * u * p1 - k * p0) / (k + 1);
      s += c[k + 1] * p2;
      p0 = p1; p1 = p2;
    }
    return s;
  }

  /* ---------- data ----------
     Training dots come from a "golden ratio" sequence with a random start and a tiny jitter, so the
     first N dots are always spread across the whole range, and adding dots never moves the old ones.
     Each dot keeps its own random noise draw z, so the noise slider just scales it. */
  function makeData(seed) {
    var r = mulberry32(seed * 7919 + 17);
    var a = r(), pool = [], test = [], i, x;
    for (i = 0; i < N_MAX; i++) {
      x = (a + i * PHI) % 1;
      x = clamp(x + (r() - 0.5) * 0.012, 0.004, 0.996);
      pool.push({ x: x, z: gaussCut(r) });
    }
    var rt = mulberry32(seed * 104729 + 3);
    for (i = 0; i < N_TEST; i++) test.push({ x: (i + rt()) / N_TEST, z: gaussCut(rt) });
    return { pool: pool, test: test };
  }

  function readTheme() {
    var cs = getComputedStyle(document.documentElement);
    function g(n, fb) { var v = cs.getPropertyValue(n).trim(); return v || fb; }
    return {
      surface: g('--surface', '#fff'), surface2: g('--surface-2', '#eee'), ink: g('--ink', '#111'),
      muted: g('--muted', '#666'), line: g('--line', '#ddd'), haldi: g('--haldi', '#e2a400'),
      haldiSoft: g('--haldi-soft', '#fbf0cf'), ok: g('--ok', '#1d7a4b'), bad: g('--bad', '#b3261e'),
      s1: g('--series-1', '#2d388a'), s2: g('--series-2', '#c0402c'), s4: g('--series-4', '#12807f'),
      font: g('--font-body', 'system-ui, sans-serif'), mono: g('--font-mono', 'monospace')
    };
  }

  /* ================================================================ */
  function mount(root, ctx) {
    var P = 'of' + (++mountCount) + '-';
    var listeners = [];
    function on(el, type, fn, opts) { el.addEventListener(type, fn, opts); listeners.push([el, type, fn, opts]); }
    var destroyed = false;

    var tasksHtml = TASKS.map(function (t) { return '<li data-task="' + t.id + '">' + t.text + '</li>'; }).join('');
    function swatchLine(colour, dash, w) {
      return '<svg width="22" height="10" viewBox="0 0 22 10" aria-hidden="true" focusable="false" style="flex:none">' +
        '<line x1="1" y1="5" x2="21" y2="5" style="stroke:' + colour + ';stroke-width:' + w + ';stroke-linecap:round' + (dash ? ';stroke-dasharray:4 3' : '') + '"/></svg>';
    }
    function swatchDot(colour, hollow) {
      return '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false" style="flex:none">' +
        '<circle cx="6" cy="6" r="4.2" style="' + (hollow ? 'fill:var(--surface);stroke:' + colour + ';stroke-width:1.8' : 'fill:' + colour) + '"/></svg>';
    }
    var CHECK_ROW = 'display:grid;grid-template-columns:18px minmax(0,1fr);gap:10px;align-items:start';
    function legendItem(sw, text) {
      return '<div style="display:inline-flex;align-items:center;gap:6px">' + sw + text + '</div>';
    }

    root.innerHTML =
      '<div class="lab">' +
        '<p class="lab-note"><strong>What you are seeing:</strong> a hidden rule (the faint dashed curve) makes the dots, plus some random noise. ' +
        '<b>Filled dots</b> are training data: practice questions the model studies. <b>Hollow rings</b> are test data: exam questions it never sees while learning. ' +
        'The model is a <em>polynomial</em> curve (a curve made from x, x², x³ …). Its <em>degree</em> sets how bendy it may be. It is fitted by <em>least squares</em>: it picks the curve with the smallest average squared gap to the training dots. ' +
        'That average is the <em>MSE</em> (mean squared error); lower is better.</p>' +
        '<div class="lab-body">' +
          '<div class="stack-sm">' +
            '<div class="lab-canvas-wrap" id="' + P + 'wrap"><canvas id="' + P + 'plot" role="img" tabindex="0" style="outline-offset:-3px" aria-describedby="' + P + 'kbd" aria-label="Scatter plot of training and test dots with the fitted curve"></canvas></div>' +
            '<div class="control">' +
              '<label for="' + P + 'deg">Polynomial degree <output id="' + P + 'degout" for="' + P + 'deg">1</output></label>' +
              '<input type="range" id="' + P + 'deg" min="0" max="' + MAX_DEG + '" step="1" value="1">' +
              '<p class="small muted" id="' + P + 'degdesc"></p>' +
            '</div>' +
            '<div class="lab-stats">' +
              '<div class="stat"><div class="k">Train MSE</div><div class="v" id="' + P + 'train">—</div></div>' +
              '<div class="stat"><div class="k">Test MSE</div><div class="v" id="' + P + 'test">—</div></div>' +
              '<div class="stat" style="container-type:inline-size"><div class="k">Verdict</div><div class="v" id="' + P + 'verdict" style="font-family:var(--font-body);font-weight:700;font-size:.95rem;font-size:min(1.05rem,14cqi);line-height:calc(1.05rem * 1.6)">—</div></div>' +
            '</div>' +
            '<p class="small" id="' + P + 'msg" role="status" aria-live="polite" style="min-height:4.8em"></p>' +
            '<div class="lab-legend">' +
              legendItem(swatchLine('var(--muted)', true, 2), 'Hidden rule') +
              legendItem(swatchLine('var(--series-4)', false, 3), 'Model’s curve') +
              legendItem(swatchDot('var(--series-1)', false), 'Training dots') +
              legendItem(swatchDot('var(--series-2)', true), 'Test rings') +
            '</div>' +
            '<p class="kbd-hint" id="' + P + 'kbd">Drag a filled dot up or down to see how much the curve reacts. Keyboard: Tab to the plot, ← → picks a dot, ↑ ↓ moves it.</p>' +
            '<p class="small muted" style="margin-top:6px"><strong style="color:var(--ink)">Error chart.</strong> Training and test error (MSE) for every degree from 0 to 15, on a log scale: from 0.01 to 0.1 to 1 to 10, each step up means 10 times more error, so tiny and huge errors fit on one chart. The dashed line is the noise level: on new data, no curve can do much better than that. Tap a degree to try it.</p>' +
            '<div class="lab-canvas-wrap" id="' + P + 'ewrap" style="aspect-ratio:2/1;max-height:260px"><canvas id="' + P + 'err" role="img" aria-label="Error chart" style="touch-action:pan-y"></canvas></div>' +
            '<div class="lab-legend">' +
              legendItem(swatchLine('var(--series-1)', false, 2) .replace('</svg>', '<circle cx="11" cy="5" r="3" style="fill:var(--series-1)"/></svg>'), 'Training error') +
              legendItem(swatchLine('var(--series-2)', false, 2).replace('</svg>', '<circle cx="11" cy="5" r="3" style="fill:var(--surface);stroke:var(--series-2);stroke-width:1.6"/></svg>'), 'Test error') +
              legendItem(swatchLine('var(--muted)', true, 1.5), 'Noise level') +
            '</div>' +
          '</div>' +
          '<div class="lab-controls">' +
            '<div class="control"><label for="' + P + 'noise">Noise (how messy the dots are) <output id="' + P + 'noiseout" for="' + P + 'noise">0.25</output></label>' +
              '<input type="range" id="' + P + 'noise" min="0" max="0.5" step="0.05" value="0.25"></div>' +
            '<div class="control"><label for="' + P + 'n">Training points <output id="' + P + 'nout" for="' + P + 'n">20</output></label>' +
              '<input type="range" id="' + P + 'n" min="' + N_MIN + '" max="' + N_MAX + '" step="1" value="20">' +
              '<p class="small muted">There are always ' + N_TEST + ' test rings.</p>' +
              '<p class="small" id="' + P + 'nverdict"></p></div>' +
            '<div class="control"><span class="control-label" id="' + P + 'rulelbl">Hidden rule</span>' +
              '<div class="seg" role="group" aria-labelledby="' + P + 'rulelbl">' +
                '<button type="button" data-rule="wave" aria-pressed="true">Wave</button>' +
                '<button type="button" data-rule="bend" aria-pressed="false">Bend</button>' +
                '<button type="button" data-rule="line" aria-pressed="false">Line</button>' +
              '</div>' +
              '<p class="small muted">The model never sees this rule, only the dots. Switch rules and watch the lowest degree that gets “Good fit”: simpler rules need less bendy curves.</p></div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
              '<button type="button" class="btn btn-primary" id="' + P + 'new">New data</button>' +
              '<button type="button" class="btn" id="' + P + 'undo" disabled>Undo drags</button>' +
            '</div>' +
            '<div class="stack-sm small">' +
              '<div style="' + CHECK_ROW + '"><input type="checkbox" id="' + P + 'showtrue" checked><label for="' + P + 'showtrue">Show the hidden rule</label></div>' +
              '<div style="' + CHECK_ROW + '"><input type="checkbox" id="' + P + 'showtest" checked><label for="' + P + 'showtest">Show the test rings</label></div>' +
              '<div style="' + CHECK_ROW + '"><input type="checkbox" id="' + P + 'showgaps"><label for="' + P + 'showgaps">Show each test ring’s error (its gap to the curve)</label></div>' +
            '</div>' +
            '<div class="stack-sm"><h2 class="lab-h">Your tasks</h2><ul class="lab-tasks" id="' + P + 'tasks">' + tasksHtml + '</ul></div>' +
          '</div>' +
        '</div>' +
        '<p class="small muted"><strong style="color:var(--ink)">Why it matters in real ML:</strong> every real model, from a crop-yield predictor to a bank’s loan model, is chosen by watching the gap between training and test error: pick the simplest model that does well on unseen data, and get more data when it overfits. (In real projects you choose settings like the degree on a separate <em>validation</em> set and open the test set only once, at the very end.)</p>' +
      '</div>';

    function $(id) { return root.querySelector('#' + P + id); }
    var wrap = $('wrap'), canvas = $('plot'), ewrap = $('ewrap'), ecanvas = $('err');
    var g = canvas.getContext('2d'), ge = ecanvas.getContext('2d');
    var elDeg = $('deg'), elDegOut = $('degout'), elDegDesc = $('degdesc');
    var elNoise = $('noise'), elNoiseOut = $('noiseout'), elN = $('n'), elNOut = $('nout');
    var elTrain = $('train'), elTest = $('test'), elVerdict = $('verdict'), elMsg = $('msg'), elNVerdict = $('nverdict');
    var labEl = root.querySelector('.lab');
    var btnNew = $('new'), btnUndo = $('undo');
    var elShowTrue = $('showtrue'), elShowTest = $('showtest'), elShowGaps = $('showgaps');
    var ruleBtns = root.querySelectorAll('[data-rule]');
    var taskEls = {};
    Array.prototype.forEach.call(root.querySelectorAll('[data-task]'), function (li) { taskEls[li.getAttribute('data-task')] = li; });

    /* ---------- state ---------- */
    var S = {
      seed: START_SEED, rule: 'wave', deg: 1, noise: 0.25, n: 20,
      showTrue: true, showTest: true, showGaps: false,
      data: null, dy: new Float64Array(N_MAX),
      fits: [], errs: [], bestDeg: 0, verdict: 'U',
      curveTo: null, curveFrom: null, tweenStart: 0,
      drag: null, hover: -1, sel: -1, focused: false,
      resting: false, overfitSeen: {}, lowMove: 0, highMove: 0
    };
    var done = {};
    var dims = { w: 1, h: 1, ew: 1, eh: 1, sx: 1, sy: 1, esx: 1, esy: 1 };
    var rafId = 0;

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
    TASKS.forEach(function (t) {
      if (ctx && ctx.isTaskDone && ctx.isTaskDone(t.id)) { done[t.id] = true; markLi(t.id); }
    });
    function completeTask(id) {
      if (done[id]) return;
      done[id] = true;
      markLi(id);
      if (ctx && ctx.onTaskDone) ctx.onTaskDone(id);
    }

    /* ---------- model state ---------- */
    function baseY(i) { return RULES[S.rule].f(S.data.pool[i].x) + S.noise * S.data.pool[i].z; }
    function trainY(i) { return baseY(i) + S.dy[i]; }
    function testY(j) { return RULES[S.rule].f(S.data.test[j].x) + S.noise * S.data.test[j].z; }

    function sampleCurve(c) {
      var out = new Float64Array(SAMPLES);
      for (var i = 0; i < SAMPLES; i++) out[i] = clamp(evalPoly(c, 2 * (i / (SAMPLES - 1)) - 1), -12, 12);
      return out;
    }
    function displayedCurve(now) {
      if (!S.curveFrom) return S.curveTo;
      var t = (now - S.tweenStart) / TWEEN_MS;
      if (t >= 1) { S.curveFrom = null; return S.curveTo; }
      var e = easeOut(clamp(t, 0, 1)), out = new Float64Array(SAMPLES);
      for (var i = 0; i < SAMPLES; i++) out[i] = S.curveFrom[i] + (S.curveTo[i] - S.curveFrom[i]) * e;
      return out;
    }

    // refit every degree (0..15) so the error chart is always complete. Cheap: at most 100 dots.
    function refit() {
      var n = S.n, us = new Float64Array(n), ys = new Float64Array(n), i, d;
      for (i = 0; i < n; i++) { us[i] = 2 * S.data.pool[i].x - 1; ys[i] = trainY(i); }
      var tu = new Float64Array(N_TEST), ty = new Float64Array(N_TEST);
      for (i = 0; i < N_TEST; i++) { tu[i] = 2 * S.data.test[i].x - 1; ty[i] = testY(i); }
      S.fits = []; S.errs = [];
      var best = Infinity, bestD = 0;
      for (d = 0; d <= MAX_DEG; d++) {
        var c = fitPoly(us, ys, d), se = 0, st = 0, e;
        for (i = 0; i < n; i++) { e = evalPoly(c, us[i]) - ys[i]; se += e * e; }
        for (i = 0; i < N_TEST; i++) { e = evalPoly(c, tu[i]) - ty[i]; st += e * e; }
        S.fits.push(c);
        S.errs.push([se / n, st / N_TEST]);
        if (st / N_TEST < best) best = st / N_TEST;
      }
      // the lowest test error; if several degrees tie (only rounding apart, e.g. zero noise), pick the simplest
      for (d = 0; d <= MAX_DEG; d++) if (S.errs[d][1] <= best * (1 + 1e-9) + 1e-12) { bestD = d; break; }
      S.bestDeg = bestD;
      S.curveTo = sampleCurve(S.fits[S.deg]);
    }
    // Verdict: compare this degree's test error with the best test error over all degrees.
    function verdictOf(d) {
      var best = S.errs[S.bestDeg][1];
      var tol = best * 1.3 + 0.003;
      if (S.errs[d][1] <= tol) return 'G';
      return d < S.bestDeg ? 'U' : 'O';
    }

    /* ---------- UI text ---------- */
    function degText(d) {
      if (d === 0) return 'Degree 0: a flat line (the same guess, the average, for every x). Higher degree = bendier curve.';
      if (d === 1) return 'Degree 1: a straight, sloping line. Higher degree = bendier curve.';
      if (d === 2) return 'Degree 2: a curve with 1 bend (like a U).';
      return 'Degree ' + d + ': a curve with up to ' + (d - 1) + ' bends.';
    }
    function syncUI() {
      var d = S.deg, er = S.errs[d], v = S.verdict = verdictOf(d);
      elDeg.value = String(d);
      elDegOut.textContent = String(d);
      elDegDesc.textContent = degText(d);
      elNoiseOut.textContent = S.noise.toFixed(2);
      elNOut.textContent = String(S.n);
      elTrain.textContent = fmtErr(er[0]);
      elTest.textContent = fmtErr(er[1]);
      var vName = v === 'U' ? 'Underfitting' : v === 'O' ? 'Overfitting' : 'Good fit';
      elVerdict.textContent = vName;
      var vCol = v === 'U' ? 'var(--haldi-ink)' : v === 'O' ? 'var(--bad)' : 'var(--ok)';
      elVerdict.style.color = vCol;
      elNVerdict.innerHTML = 'Right now (degree ' + d + '): <b style="color:' + vCol + '">' + vName + '</b>, test error <span class="num">' + fmtErr(er[1]) + '</span>';
      var tr = '<span class="num">' + fmtErr(er[0]) + '</span>', te = '<span class="num">' + fmtErr(er[1]) + '</span>';
      var msg;
      if (v === 'U') {
        msg = '<b>Underfitting.</b> Degree ' + d + ' is too simple to follow the hidden rule, so it misses even the training dots: training error (' + tr + ') and test error (' + te + ') are both high. Try a higher degree.';
      } else if (v === 'G') {
        msg = '<b>Good fit.</b> Degree ' + d + ' follows the hidden rule without chasing every dot. Its test error (' + te + ') is close to the lowest of all 16 degrees' +
          (d === S.bestDeg ? '. In fact it <em>is</em> the lowest: the sweet spot.' : '.');
        if (S.noise === 0 && d >= 8) msg += ' With zero noise there is nothing random to memorise, so even a bendy curve does well.';
      } else if (er[1] > 3 * S.errs[S.bestDeg][1] + 0.05) {
        msg = '<b>Overfitting.</b> Degree ' + d + ' bends to get close to every training dot, so training error is low (' + tr + '). But it swings wildly between them and misses the test rings (test error ' + te + '). It has memorised the noise instead of learning the rule.';
      } else {
        msg = '<b>Overfitting (a little).</b> Degree ' + d + ' has started to chase the noise in the training dots: training error is low (' + tr + '), but test error (' + te + ') is clearly worse than at degree ' + S.bestDeg + ' (<span class="num">' + fmtErr(S.errs[S.bestDeg][1]) + '</span>). Extra bendiness is now hurting.';
      }
      elMsg.innerHTML = msg;
      var dragged = false;
      for (var i = 0; i < N_MAX; i++) if (S.dy[i] !== 0) { dragged = true; break; }
      btnUndo.disabled = !dragged;
      Array.prototype.forEach.call(ruleBtns, function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-rule') === S.rule ? 'true' : 'false'); });
      canvas.setAttribute('aria-label', 'Scatter plot: a degree ' + d + ' curve fitted to ' + S.n + ' training dots, with ' + N_TEST + ' test rings. Training error ' + fmtErr(er[0]) + ', test error ' + fmtErr(er[1]) + ': ' + vName.toLowerCase() + '.');
      ecanvas.setAttribute('aria-label', 'Error chart for degrees 0 to 15. Training error keeps falling as the degree grows. Test error is lowest at degree ' + S.bestDeg + ' (' + fmtErr(S.errs[S.bestDeg][1]) + '). Current degree ' + d + ' is highlighted.');
    }

    /* ---------- tasks ---------- */
    function checkTasks() {
      var d = S.deg, er = S.errs[d], v = S.verdict;
      // t1: the learner has settled on the best degree (released the slider / tapped the chart / used keys),
      // not just swept past it on the way to 15
      if (S.resting && d === S.bestDeg) completeTask('t1');
      if (er[0] < 0.02 && er[1] > 1 && er[1] > 20 * er[0]) completeTask('t2');
      // t3: remember the fewest training points that overfitted at degree >= 10, per hidden rule, data set,
      // degree and noise. Done when, on the same rule and data set, a degree at least as high gets a good fit
      // with at least 10 more points and no less noise: so it was the extra data that cured it.
      var base = S.rule + '|' + S.seed + '|';
      var key = base + d + '|' + S.noise.toFixed(2);
      if (d >= 10 && v === 'O' && (S.overfitSeen[key] == null || S.n < S.overfitSeen[key])) S.overfitSeen[key] = S.n;
      if (d >= 10 && v === 'G') {
        for (var k in S.overfitSeen) {
          if (!Object.prototype.hasOwnProperty.call(S.overfitSeen, k) || k.indexOf(base) !== 0) continue;
          var parts = k.split('|');
          if (+parts[2] <= d && +parts[3] <= S.noise + 1e-9 && S.n >= S.overfitSeen[k] + 10) { completeTask('t3'); break; }
        }
      }
      if (S.lowMove >= 0.3 && S.highMove >= 0.3) completeTask('t4');
    }

    /* ---------- actions ---------- */
    // how: 'move' while the learner is still sweeping, 'settle' once they let go (slider release,
    // chart tap, arrow key)
    function setDegree(d, how) {
      d = clamp(Math.round(d), 0, MAX_DEG);
      if (!(d >= 0)) d = S.deg;
      S.resting = how === 'settle';
      if (d !== S.deg) {
        var now = performance.now();
        var cur = displayedCurve(now);
        S.deg = d;
        S.curveTo = sampleCurve(S.fits[d]);
        if (!reducedMotion() && cur) { S.curveFrom = cur; S.tweenStart = now; } else S.curveFrom = null;
        syncUI(); requestDraw();
      }
      checkTasks();
    }
    function dataChanged() {
      S.curveFrom = null;
      refit(); syncUI(); checkTasks(); requestDraw();
    }
    function newData() {
      S.seed++;
      S.data = makeData(S.seed);
      for (var i = 0; i < N_MAX; i++) S.dy[i] = 0;
      S.sel = -1; S.hover = -1;
      dataChanged();
    }
    function moveDot(i, newY) {
      newY = clamp(newY, Y_MIN + 0.02, Y_MAX - 0.02);
      var old = trainY(i);
      S.dy[i] = newY - baseY(i);
      var delta = Math.abs(newY - old);
      if (S.deg <= 4) S.lowMove += delta;
      if (S.deg >= 10) S.highMove += delta;
      dataChanged();
    }

    /* ---------- geometry ---------- */
    function geomMain() {
      var small = dims.w < 480;
      var pl = small ? 30 : 38, pr = small ? 8 : 12, pt = small ? 8 : 10, pb = small ? 24 : 28;
      return { pl: pl, pt: pt, pw: Math.max(10, dims.w - pl - pr), ph: Math.max(10, dims.h - pt - pb), small: small };
    }
    function px(G, x) { return G.pl + x * G.pw; }
    function py(G, y) { return G.pt + (Y_MAX - y) / (Y_MAX - Y_MIN) * G.ph; }
    function yFromPx(G, p) { return Y_MAX - (p - G.pt) / G.ph * (Y_MAX - Y_MIN); }
    function geomErr() {
      var small = dims.ew < 480;
      var pl = small ? 40 : 48, pr = small ? 8 : 12, pt = 10, pb = 22;
      return { pl: pl, pt: pt, pw: Math.max(10, dims.ew - pl - pr), ph: Math.max(10, dims.eh - pt - pb), small: small };
    }

    // Backing store = CSS size × devicePixelRatio. The canvas fills its wrapper's padding box
    // (wrapper rect minus its 1px border), so measure the canvas box itself.
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      var r = canvas.getBoundingClientRect(), er = ecanvas.getBoundingClientRect();
      if (!r.width) { r = wrap.getBoundingClientRect(); er = ewrap.getBoundingClientRect(); }
      dims.w = Math.max(1, r.width); dims.h = Math.max(1, r.height);
      dims.ew = Math.max(1, er.width); dims.eh = Math.max(1, er.height);
      canvas.width = Math.max(1, Math.round(dims.w * dpr)); canvas.height = Math.max(1, Math.round(dims.h * dpr));
      ecanvas.width = Math.max(1, Math.round(dims.ew * dpr)); ecanvas.height = Math.max(1, Math.round(dims.eh * dpr));
      dims.sx = canvas.width / dims.w; dims.sy = canvas.height / dims.h;
      dims.esx = ecanvas.width / dims.ew; dims.esy = ecanvas.height / dims.eh;
      requestDraw();
    }

    /* ---------- drawing ---------- */
    function requestDraw() {
      if (!rafId && !destroyed) rafId = requestAnimationFrame(frame);
    }
    function frame(now) {
      rafId = 0;
      if (destroyed) return;
      var T = readTheme();
      drawMain(T, now);
      drawErr(T);
      if (S.curveFrom) requestDraw(); // keep going only while the curve is still morphing
    }

    function drawMain(T, now) {
      var w = dims.w, h = dims.h, G = geomMain(), i;
      g.setTransform(dims.sx, 0, 0, dims.sy, 0, 0);
      g.clearRect(0, 0, w, h);
      g.fillStyle = T.surface;
      g.fillRect(0, 0, w, h);

      // grid + y labels
      g.font = (G.small ? '11px ' : '12px ') + T.font;
      g.textBaseline = 'middle';
      g.textAlign = 'right';
      g.lineWidth = 1;
      for (var yv = -2; yv <= 2; yv++) {
        var yy = Math.round(py(G, yv)) + 0.5;
        g.strokeStyle = T.line;
        g.globalAlpha = yv === 0 ? 1 : 0.7;
        g.beginPath(); g.moveTo(G.pl, yy); g.lineTo(G.pl + G.pw, yy); g.stroke();
        g.globalAlpha = 1;
        g.fillStyle = T.muted;
        g.fillText(String(yv).replace('-', '−'), G.pl - 6, yy);
      }
      g.textAlign = 'center';
      g.textBaseline = 'alphabetic';
      g.fillText('input (x) →', G.pl + G.pw / 2, h - (G.small ? 7 : 9));
      g.save();
      g.translate(G.small ? 9 : 11, G.pt + G.ph / 2);
      g.rotate(-Math.PI / 2);
      g.textBaseline = 'middle';
      g.fillText('output (y) →', 0, 0);
      g.restore();

      g.save();
      g.beginPath(); g.rect(G.pl, G.pt, G.pw, G.ph); g.clip();

      // hidden rule (faint, dashed)
      var f = RULES[S.rule].f;
      if (S.showTrue) {
        g.strokeStyle = T.muted; g.lineWidth = 2; g.globalAlpha = 0.75;
        g.setLineDash([6, 5]);
        g.beginPath();
        for (i = 0; i <= 160; i++) { var xt = i / 160; if (i === 0) g.moveTo(px(G, xt), py(G, f(xt))); else g.lineTo(px(G, xt), py(G, f(xt))); }
        g.stroke();
        g.setLineDash([]); g.globalAlpha = 1;
      }

      var curve = displayedCurve(now);
      function curveAt(x) {
        var t = x * (SAMPLES - 1), k = Math.min(SAMPLES - 2, Math.floor(t)), fr = t - k;
        return curve[k] + (curve[k + 1] - curve[k]) * fr;
      }

      // gaps from each test ring to the curve (what test MSE averages, after squaring)
      if (S.showTest && S.showGaps) {
        g.strokeStyle = T.s2; g.lineWidth = 1.5; g.globalAlpha = 0.55;
        g.beginPath();
        for (i = 0; i < N_TEST; i++) {
          var tx = S.data.test[i].x, X = px(G, tx);
          g.moveTo(X, py(G, testY(i))); g.lineTo(X, py(G, clamp(curveAt(tx), Y_MIN - 1, Y_MAX + 1)));
        }
        g.stroke(); g.globalAlpha = 1;
      }

      // dragged dots: dotted line back to where they started
      g.strokeStyle = T.muted; g.lineWidth = 1.2; g.setLineDash([2, 3]);
      g.beginPath();
      for (i = 0; i < S.n; i++) {
        if (S.dy[i] === 0) continue;
        var dx = px(G, S.data.pool[i].x);
        g.moveTo(dx, py(G, baseY(i))); g.lineTo(dx, py(G, trainY(i)));
      }
      g.stroke(); g.setLineDash([]);

      // the model's curve (bold)
      g.strokeStyle = T.s4; g.lineWidth = 3; g.lineJoin = 'round'; g.lineCap = 'round';
      g.beginPath();
      for (i = 0; i < SAMPLES; i++) {
        var X2 = px(G, i / (SAMPLES - 1)), Y2 = py(G, clamp(curve[i], Y_MIN - 3, Y_MAX + 3));
        if (i === 0) g.moveTo(X2, Y2); else g.lineTo(X2, Y2);
      }
      g.stroke();
      g.restore();

      var rr = G.small ? 4 : 4.4;
      // test rings
      if (S.showTest) {
        g.lineWidth = 1.8;
        for (i = 0; i < N_TEST; i++) {
          g.beginPath();
          g.arc(px(G, S.data.test[i].x), py(G, testY(i)), rr - 0.4, 0, Math.PI * 2);
          g.fillStyle = T.surface; g.fill();
          g.strokeStyle = T.s2; g.stroke();
        }
      }
      // training dots
      g.lineWidth = 1.5;
      for (i = 0; i < S.n; i++) {
        g.beginPath();
        g.arc(px(G, S.data.pool[i].x), py(G, trainY(i)), rr, 0, Math.PI * 2);
        g.fillStyle = T.s1; g.fill();
        g.strokeStyle = T.surface; g.stroke();
      }
      // hover / drag / keyboard selection ring
      var ring = S.drag ? S.drag.idx : (S.focused && S.sel >= 0 ? S.sel : S.hover);
      if (ring >= 0 && ring < S.n) {
        g.beginPath();
        g.arc(px(G, S.data.pool[ring].x), py(G, trainY(ring)), rr + 4.5, 0, Math.PI * 2);
        g.strokeStyle = T.haldi; g.lineWidth = 2.5; g.stroke();
      }

      // degree tag, top-left
      var tag = 'degree ' + S.deg;
      g.font = '700 ' + (G.small ? 12 : 13) + 'px ' + T.font;
      var tw = g.measureText(tag).width;
      g.globalAlpha = 0.9; g.fillStyle = T.surface;
      g.fillRect(G.pl + 6, G.pt + 6, tw + 14, G.small ? 20 : 22);
      g.globalAlpha = 1;
      g.strokeStyle = T.s4; g.lineWidth = 1.5;
      g.strokeRect(G.pl + 6.5, G.pt + 6.5, tw + 13, (G.small ? 20 : 22) - 1);
      g.fillStyle = T.ink; g.textAlign = 'left'; g.textBaseline = 'middle';
      g.fillText(tag, G.pl + 13, G.pt + 6 + (G.small ? 10 : 11));
    }

    function drawErr(T) {
      var w = dims.ew, h = dims.eh, G = geomErr(), d, k;
      ge.setTransform(dims.esx, 0, 0, dims.esy, 0, 0);
      ge.clearRect(0, 0, w, h);
      ge.fillStyle = T.surface;
      ge.fillRect(0, 0, w, h);
      if (!S.errs.length) return;

      // log-scale range from the data, clipped to [0.0001, 100]
      var mn = Infinity, mx = 0, nv = S.noise * S.noise;
      for (d = 0; d <= MAX_DEG; d++) {
        for (k = 0; k < 2; k++) { var v = Math.max(S.errs[d][k], CHART_LO); if (v < mn) mn = v; if (v > mx) mx = v; }
      }
      if (nv > 0) { mn = Math.min(mn, nv); mx = Math.max(mx, nv); }
      // whole decades that cover the data (at least one decade)
      var lo = Math.max(CHART_LO, Math.pow(10, Math.floor(Math.log10(mn) + 1e-9)));
      var hi = Math.min(CHART_HI, Math.pow(10, Math.ceil(Math.log10(mx) - 1e-9)));
      if (hi <= lo * 1.0001) hi = lo * 10;
      var L0 = Math.log10(lo), L1 = Math.log10(hi);
      var colW = G.pw / (MAX_DEG + 1);
      function cx(dd) { return G.pl + (dd + 0.5) * colW; }
      function ly(val) { return G.pt + (L1 - Math.log10(clamp(val, lo, hi))) / (L1 - L0) * G.ph; }

      // highlight band for the current degree
      ge.fillStyle = T.haldiSoft;
      ge.fillRect(G.pl + S.deg * colW, G.pt, colW, G.ph);
      ge.strokeStyle = T.haldi; ge.lineWidth = 1;
      ge.strokeRect(G.pl + S.deg * colW + 0.5, G.pt + 0.5, colW - 1, G.ph - 1);

      // grid lines at powers of ten
      ge.font = (G.small ? '10px ' : '11px ') + T.font;
      ge.textAlign = 'right'; ge.textBaseline = 'middle';
      var step = G.ph / (L1 - L0) < 16 ? 2 : 1; // label every power of ten unless they would crowd
      if (L1 - L0 <= 2.01) {
        // narrow range: add faint lines (and labels) at 2× and 5× inside each decade
        for (k = Math.round(L0); k < Math.round(L1); k++) {
          [2, 5].forEach(function (m) {
            var mv = m * Math.pow(10, k), my = Math.round(ly(mv)) + 0.5;
            ge.strokeStyle = T.line; ge.globalAlpha = 0.45;
            ge.beginPath(); ge.moveTo(G.pl, my); ge.lineTo(G.pl + G.pw, my); ge.stroke();
            ge.globalAlpha = 0.85; ge.fillStyle = T.muted; ge.fillText(fmtTick(mv), G.pl - 5, my);
            ge.globalAlpha = 1;
          });
        }
      }
      for (k = Math.round(L0); k <= Math.round(L1); k++) {
        var gy = Math.round(ly(Math.pow(10, k))) + 0.5;
        ge.strokeStyle = T.line; ge.globalAlpha = 0.8;
        ge.beginPath(); ge.moveTo(G.pl, gy); ge.lineTo(G.pl + G.pw, gy); ge.stroke();
        ge.globalAlpha = 1;
        if ((k - Math.round(L0)) % step === 0 || k === Math.round(L1)) { ge.fillStyle = T.muted; ge.fillText(fmtTick(Math.pow(10, k)), G.pl - 5, gy); }
      }
      // degree labels
      ge.textAlign = 'center'; ge.textBaseline = 'alphabetic';
      var every = colW < 16 ? 3 : colW < 22 ? 2 : 1;
      for (d = 0; d <= MAX_DEG; d++) {
        var isCur = d === S.deg;
        if (!isCur && d % every !== 0) continue;
        ge.font = (isCur ? '700 ' : '') + (G.small ? '10px ' : '11px ') + T.font;
        ge.fillStyle = isCur ? T.ink : T.muted;
        ge.fillText(String(d), cx(d), h - 7);
      }

      // noise level (σ²): the best possible average test error on new data
      if (nv > 0 && nv >= lo && nv <= hi) {
        var ny = Math.round(ly(nv)) + 0.5;
        ge.strokeStyle = T.muted; ge.lineWidth = 1.5; ge.setLineDash([5, 4]);
        ge.beginPath(); ge.moveTo(G.pl, ny); ge.lineTo(G.pl + G.pw, ny); ge.stroke();
        ge.setLineDash([]);
      }

      function series(idx, colour, hollow) {
        ge.strokeStyle = colour; ge.lineWidth = 2; ge.lineJoin = 'round';
        ge.beginPath();
        for (var dd = 0; dd <= MAX_DEG; dd++) {
          var Y = ly(S.errs[dd][idx]);
          if (dd === 0) ge.moveTo(cx(dd), Y); else ge.lineTo(cx(dd), Y);
        }
        ge.stroke();
        for (dd = 0; dd <= MAX_DEG; dd++) {
          var val = S.errs[dd][idx], X = cx(dd), Yp = ly(val), r = dd === S.deg ? 5 : 3.4;
          ge.beginPath();
          if (val > hi) {
            // off the top of the chart: draw an up-arrow instead of a dot
            ge.moveTo(X, Yp - 1); ge.lineTo(X + r + 1, Yp + r * 1.6); ge.lineTo(X - r - 1, Yp + r * 1.6); ge.closePath();
            ge.fillStyle = colour; ge.fill();
            continue;
          }
          ge.arc(X, Yp, r, 0, Math.PI * 2);
          if (hollow) { ge.fillStyle = T.surface; ge.fill(); ge.lineWidth = 2; ge.strokeStyle = colour; ge.stroke(); }
          else { ge.fillStyle = colour; ge.fill(); ge.lineWidth = 1.5; ge.strokeStyle = T.surface; ge.stroke(); }
        }
      }
      series(0, T.s1, false);
      series(1, T.s2, true);

      // once the sweet spot has been found, label it
      if (done.t1) {
        var bx = cx(S.bestDeg), by = ly(S.errs[S.bestDeg][1]);
        ge.font = '700 ' + (G.small ? '10px ' : '11px ') + T.font;
        var lw = ge.measureText('lowest').width + 8, lh = G.small ? 14 : 15;
        // above the lowest test point (the test line rises on both sides of it), unless too close to the top
        var top = by - 9 - lh >= G.pt ? by - 9 - lh : by + 9;
        var left = clamp(bx - lw / 2, G.pl, G.pl + G.pw - lw);
        ge.globalAlpha = 0.92; ge.fillStyle = T.surface;
        ge.fillRect(left, top, lw, lh);
        ge.globalAlpha = 1;
        ge.fillStyle = T.ok; ge.textAlign = 'center'; ge.textBaseline = 'middle';
        ge.fillText('lowest', left + lw / 2, top + lh / 2 + 0.5);
      }
    }

    /* ---------- pointer: drag training dots ---------- */
    function localPos(e, el) { var r = el.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function hitTest(p, radius) {
      var G = geomMain(), best = -1, bd = radius * radius;
      for (var i = 0; i < S.n; i++) {
        var dx = px(G, S.data.pool[i].x) - p.x, dy = py(G, trainY(i)) - p.y, d2 = dx * dx + dy * dy;
        if (d2 <= bd) { bd = d2; best = i; }
      }
      return best;
    }
    on(canvas, 'pointerdown', function (e) {
      if (e.button != null && e.button > 0) return;
      var p = localPos(e, canvas);
      var idx = hitTest(p, e.pointerType === 'touch' ? 24 : 15);
      if (idx < 0) return;
      e.preventDefault();
      S.drag = { idx: idx, id: e.pointerId, off: py(geomMain(), trainY(idx)) - p.y };
      S.sel = idx;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      canvas.style.cursor = 'grabbing';
      requestDraw();
    });
    on(canvas, 'pointermove', function (e) {
      var p = localPos(e, canvas);
      if (S.drag && e.pointerId === S.drag.id) {
        moveDot(S.drag.idx, yFromPx(geomMain(), p.y + S.drag.off));
        return;
      }
      if (e.pointerType === 'mouse') {
        var h = hitTest(p, 15);
        if (h !== S.hover) { S.hover = h; canvas.style.cursor = h >= 0 ? 'grab' : ''; requestDraw(); }
      }
    });
    function endDrag(e) {
      if (!S.drag || e.pointerId !== S.drag.id) return;
      S.drag = null;
      canvas.style.cursor = S.hover >= 0 ? 'grab' : '';
      checkTasks(); requestDraw();
    }
    on(canvas, 'pointerup', endDrag);
    on(canvas, 'pointercancel', endDrag);
    on(canvas, 'pointerleave', function () { if (S.hover >= 0 && !S.drag) { S.hover = -1; canvas.style.cursor = ''; requestDraw(); } });

    /* ---------- keyboard on the plot ---------- */
    function sortedIdx() {
      var a = [];
      for (var i = 0; i < S.n; i++) a.push(i);
      a.sort(function (p, q) { return S.data.pool[p].x - S.data.pool[q].x; });
      return a;
    }
    on(canvas, 'focus', function () {
      var kb = true;
      try { kb = canvas.matches(':focus-visible'); } catch (err) { /* old browser: assume keyboard */ }
      S.focused = kb;
      if (!kb) return;
      if (S.sel < 0 || S.sel >= S.n) { var a = sortedIdx(); S.sel = a[Math.floor(a.length / 2)]; }
      requestDraw();
    });
    on(canvas, 'blur', function () { S.focused = false; requestDraw(); });
    on(canvas, 'keydown', function (e) {
      var k = e.key;
      if (k !== 'ArrowLeft' && k !== 'ArrowRight' && k !== 'ArrowUp' && k !== 'ArrowDown') return;
      e.preventDefault();
      if (S.sel < 0 || S.sel >= S.n) S.sel = sortedIdx()[0];
      if (k === 'ArrowLeft' || k === 'ArrowRight') {
        S.focused = true;
        var a = sortedIdx(), pos = a.indexOf(S.sel);
        pos = clamp(pos + (k === 'ArrowRight' ? 1 : -1), 0, a.length - 1);
        S.sel = a[pos];
        requestDraw();
      } else {
        S.focused = true;
        var stepY = e.shiftKey ? 0.5 : 0.1;
        moveDot(S.sel, trainY(S.sel) + (k === 'ArrowUp' ? stepY : -stepY));
      }
    });

    /* ---------- error chart: tap or drag to pick a degree ---------- */
    // Mouse: press picks a degree at once. Touch/pen: a tap or a sideways drag picks one; an up/down
    // swipe scrolls the page instead (touch-action: pan-y on this chart).
    var errPtr = null;
    function degFromErr(e) {
      var G = geomErr(), p = localPos(e, ecanvas);
      return clamp(Math.floor((p.x - G.pl) / (G.pw / (MAX_DEG + 1))), 0, MAX_DEG);
    }
    on(ecanvas, 'pointerdown', function (e) {
      if (e.button != null && e.button > 0) return;
      errPtr = { id: e.pointerId, x0: e.clientX, active: e.pointerType === 'mouse' };
      if (errPtr.active) {
        e.preventDefault();
        try { ecanvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        setDegree(degFromErr(e), 'move');
      }
    });
    on(ecanvas, 'pointermove', function (e) {
      if (!errPtr || errPtr.id !== e.pointerId) return;
      if (!errPtr.active && Math.abs(e.clientX - errPtr.x0) > 6) {
        errPtr.active = true;
        try { ecanvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
      if (errPtr.active) setDegree(degFromErr(e), 'move');
    });
    on(ecanvas, 'pointerup', function (e) {
      if (!errPtr || errPtr.id !== e.pointerId) return;
      errPtr = null;
      setDegree(degFromErr(e), 'settle');
    });
    on(ecanvas, 'pointercancel', function (e) { if (errPtr && errPtr.id === e.pointerId) errPtr = null; });
    ecanvas.style.cursor = 'pointer';

    /* ---------- controls ---------- */
    on(elDeg, 'input', function () { setDegree(+elDeg.value, 'move'); });
    on(elDeg, 'change', function () { setDegree(+elDeg.value, 'settle'); });
    on(elNoise, 'input', function () { S.noise = Math.round(+elNoise.value * 100) / 100; dataChanged(); });
    on(elN, 'input', function () {
      S.n = clamp(Math.round(+elN.value), N_MIN, N_MAX);
      if (S.sel >= S.n) S.sel = -1;
      if (S.hover >= S.n) S.hover = -1;
      dataChanged();
    });
    Array.prototype.forEach.call(ruleBtns, function (b) {
      on(b, 'click', function () {
        var r = b.getAttribute('data-rule');
        if (r === S.rule) return;
        S.rule = r;
        dataChanged();
      });
    });
    on(btnNew, 'click', newData);
    on(btnUndo, 'click', function () { for (var i = 0; i < N_MAX; i++) S.dy[i] = 0; dataChanged(); });
    on(elShowTrue, 'change', function () { S.showTrue = elShowTrue.checked; requestDraw(); });
    on(elShowTest, 'change', function () { S.showTest = elShowTest.checked; elShowGaps.disabled = !S.showTest; requestDraw(); });
    on(elShowGaps, 'change', function () { S.showGaps = elShowGaps.checked; requestDraw(); });

    /* ---------- theme + resize ---------- */
    function onTheme() { requestDraw(); }
    var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mql) { if (mql.addEventListener) mql.addEventListener('change', onTheme); else if (mql.addListener) mql.addListener(onTheme); }
    on(document, 'themechange', onTheme);
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { resize(); }); ro.observe(wrap); ro.observe(ewrap); }
    else on(window, 'resize', resize);

    /* ---------- starting state: wave rule, 20 training dots, degree 1 (clearly underfitting) ---------- */
    S.data = makeData(S.seed);
    refit();
    syncUI();
    resize();

    return {
      destroy: function () {
        if (destroyed) return;
        destroyed = true;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
        if (ro) ro.disconnect();
        if (mql) { if (mql.removeEventListener) mql.removeEventListener('change', onTheme); else if (mql.removeListener) mql.removeListener(onTheme); }
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
        listeners = [];
        if (labEl && labEl.parentNode === root) root.removeChild(labEl);
      }
    };
  }

  Labs.overfit = {
    id: 'overfit',
    module: 'l2-ml-foundations',
    title: 'Underfitting vs overfitting',
    summary: 'Fit curves of different bendiness to noisy dots and watch training error and test error split apart when a model memorises instead of learning.',
    tasks: TASKS.map(function (t) { return { id: t.id, text: t.text }; }),
    mount: mount
  };
})();
