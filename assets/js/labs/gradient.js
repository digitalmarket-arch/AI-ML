/* AI Marg lab: gradient descent fitting a straight line (linear regression) to flat prices.
   Plain classic script (ES2019). Registers window.AILabs.gradient. No libraries, no network. */
(function () {
  'use strict';
  var Labs = (window.AILabs = window.AILabs || {});
  var mountCount = 0;

  /* ---------- constants ---------- */
  var X_MIN = 200, X_MAX = 2000;        // flat size axis, sq ft
  var Y_MIN = 0, Y_MAX = 160;           // price axis, ₹ lakh
  // Size is standardised with round numbers close to the data's own mean (~1,160) and SD (~440):
  // x = (sq ft − 1000) / 500. So b = predicted price of a 1,000 sq ft flat, w = lakh added per extra 500 sq ft.
  var X_CENTRE = 1000, X_SCALE = 500;
  var LR_MIN = 0.001, LR_MAX = 2, LR_DEFAULT = 0.1, SLIDER_MAX = 1000;
  var MAX_POINTS = 60;
  var MAX_PATH = 2400;
  var RUN_CAP = 5000;                   // steps in one Run before it pauses by itself
  var BLOWUP = 1e9;                     // a loss this big counts as "exploded"
  var START = { w: -15, b: 25 };        // a clearly bad first line: sloping down, far below the flats
  var VIEW_R = 60;                      // loss map shows the optimum ± 60 lakh (equal scale on both axes)
  var DATA_SEED = 2024;
  var OUTLIERS = [
    { size: 520, price: 150 },  // tiny flat, huge price
    { size: 1900, price: 30 },  // huge flat, tiny price
    { size: 460, price: 125 },
    { size: 1840, price: 15 }
  ];

  var TASKS = [
    { id: 't1', text: 'Press Run (or Step) until the loss is within 1% of the best possible loss.' },
    { id: 't2', text: 'Make it diverge (blow up): raise the learning rate until the loss grows with every step instead of shrinking.' },
    { id: 't3', text: 'Switch to Stochastic and take at least 20 steps. Watch the path zig-zag, with some steps even going uphill.' },
    { id: 't4', text: 'Add an outlier (a flat with a very odd price, far from the line, near the left or right edge), then Run until the line settles. Watch it tilt.' }
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
  function toX(size) { return (size - X_CENTRE) / X_SCALE; }
  function finite(v) { return typeof v === 'number' && isFinite(v); }

  // Indian digit grouping: 12,34,567.8
  function fmtIN(v, d) {
    var s = Math.abs(v).toFixed(d), neg = v < 0 && parseFloat(s) !== 0;
    var i = s.indexOf('.'), ip = i < 0 ? s : s.slice(0, i), fp = i < 0 ? '' : s.slice(i);
    if (ip.length > 3) ip = ip.slice(0, -3).replace(/\B(?=(\d{2})+$)/g, ',') + ',' + ip.slice(-3);
    return (neg ? '−' : '') + ip + fp;
  }
  var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  function fmtNum(v, d) {
    if (typeof v !== 'number' || isNaN(v)) return '—';
    if (!isFinite(v)) return v > 0 ? '∞' : '−∞';
    var a = Math.abs(v);
    if (a >= 1e7) {
      var e = Math.floor(Math.log10(a)), m = v / Math.pow(10, e);
      if (Math.abs(m) >= 9.95) { m /= 10; e++; }
      return m.toFixed(1).replace('-', '−') + '×10' + String(e).split('').map(function (c) { return SUP[c] || c; }).join('');
    }
    return fmtIN(v, d);
  }
  function fmtLr(lr) { return lr >= 1 ? lr.toFixed(2) : lr >= 0.01 ? lr.toFixed(3) : lr.toFixed(4); }
  function lrFromSlider(v) { return LR_MIN * Math.pow(LR_MAX / LR_MIN, v / SLIDER_MAX); }
  function sliderFromLr(lr) { return Math.round(SLIDER_MAX * Math.log(lr / LR_MIN) / Math.log(LR_MAX / LR_MIN)); }
  function niceStep(raw) {
    var p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p;
  }
  // Liang–Barsky: clip segment to rectangle; returns [x0,y0,x1,y1] or null. Keeps canvas away from huge coordinates.
  function clipSeg(x0, y0, x1, y1, rx, ry, rw, rh) {
    var t0 = 0, t1 = 1, dx = x1 - x0, dy = y1 - y0;
    var p = [-dx, dx, -dy, dy], q = [x0 - rx, rx + rw - x0, y0 - ry, ry + rh - y0];
    for (var i = 0; i < 4; i++) {
      if (p[i] === 0) { if (q[i] < 0) return null; }
      else {
        var r = q[i] / p[i];
        if (p[i] < 0) { if (r > t1) return null; if (r > t0) t0 = r; }
        else { if (r < t0) return null; if (r < t1) t1 = r; }
      }
    }
    return [x0 + t0 * dx, y0 + t0 * dy, x0 + t1 * dx, y0 + t1 * dy];
  }

  /* ---------- data: flats in Pune (size in sq ft, price in ₹ lakh) ---------- */
  function makeData() {
    var rnd = mulberry32(DATA_SEED), pts = [];
    for (var i = 0; i < 16; i++) {
      var size = Math.round((450 + i * 95 + (rnd() - 0.5) * 80) / 10) * 10;
      var price = Math.round((6 + 0.067 * size + gauss(rnd) * 6.5) * 2) / 2;  // about ₹6,700 per sq ft, plus noise
      pts.push({ size: size, price: price, user: false, moved: false });
    }
    return pts;
  }

  /* ---------- maths ---------- */
  // Loss = MSE = mean over flats of (w·x + b − price)².
  function lossAt(pts, w, b) {
    var s = 0;
    for (var i = 0; i < pts.length; i++) { var e = w * toX(pts[i].size) + b - pts[i].price; s += e * e; }
    return pts.length ? s / pts.length : 0;
  }
  // Gradient of the MSE: dL/dw = (2/n) Σ e·x, dL/db = (2/n) Σ e, where e = prediction − price.
  function gradBatch(pts, w, b) {
    var gw = 0, gb = 0, n = pts.length;
    for (var i = 0; i < n; i++) { var x = toX(pts[i].size), e = w * x + b - pts[i].price; gw += e * x; gb += e; }
    return { w: 2 * gw / n, b: 2 * gb / n };
  }
  function gradOne(p, w, b) { var x = toX(p.size), e = w * x + b - p.price; return { w: 2 * e * x, b: 2 * e }; }
  // Closed-form least squares (the exact best line) plus the shape of the loss bowl.
  // Around the optimum: L(w,b) = L* + [dw db]·M·[dw db]ᵀ with M = [[E(x²), E(x)], [E(x), 1]].
  function fitData(pts) {
    var n = pts.length, mx = 0, my = 0, i;
    for (i = 0; i < n; i++) { mx += toX(pts[i].size); my += pts[i].price; }
    mx /= n; my /= n;
    var vx = 0, cv = 0;
    for (i = 0; i < n; i++) { var dx = toX(pts[i].size) - mx; vx += dx * dx; cv += dx * (pts[i].price - my); }
    vx /= n; cv /= n;
    var w = vx > 1e-12 ? cv / vx : 0, b = my - w * mx;
    var exx = vx + mx * mx, tr = exx + 1, disc = Math.sqrt(Math.max(0, tr * tr / 4 - vx));
    var l1 = tr / 2 + disc, l2 = Math.max(tr / 2 - disc, 1e-9);
    var e1;
    if (Math.abs(mx) > 1e-12) { e1 = [mx, l1 - exx]; } else { e1 = exx >= 1 ? [1, 0] : [0, 1]; }
    var len = Math.hypot(e1[0], e1[1]) || 1;
    e1 = [e1[0] / len, e1[1] / len];
    return { n: n, mx: mx, my: my, exx: exx, vx: vx, w: w, b: b, L: lossAt(pts, w, b), l1: l1, l2: l2, e1: e1, e2: [-e1[1], e1[0]], lg: Math.sqrt(l1 * l2) };
  }
  function excess(F, w, b) { var dw = w - F.w, db = b - F.b; return F.exx * dw * dw + 2 * F.mx * dw * db + db * db; }

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
    var cs = getComputedStyle(document.documentElement), T = { key: '' };
    for (var i = 0; i < THEME_NAMES.length; i++) {
      var n = THEME_NAMES[i], v = cs.getPropertyValue(n).trim();
      T[n.slice(2).replace('-', '')] = v;
      T.key += v + '|';
    }
    T.font = cs.getPropertyValue('--font-body').trim() || 'system-ui, sans-serif';
    T.rgb = {};
    ['surface', 'indigo', 'sindoor', 'ink', 'ok', 'series4', 'series3', 'muted', 'bad'].forEach(function (k) { T.rgb[k] = toRgb(T[k]); });
    return T;
  }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  /* ---------- mount ---------- */
  function mount(root, ctx) {
    var P = 'gd' + (++mountCount) + '-';
    var listeners = [];
    function on(el, type, fn, opts) { el.addEventListener(type, fn, opts); listeners.push([el, type, fn, opts]); }
    var destroyed = false;

    var tasksHtml = TASKS.map(function (t) { return '<li data-task="' + t.id + '">' + t.text + '</li>'; }).join('');
    var legend = function (items) {
      return '<div class="lab-legend">' + items.map(function (it) { return '<span style="--c:var(' + it[0] + ')">' + it[1] + '</span>'; }).join('') + '</div>';
    };

    root.innerHTML =
      '<div class="lab">' +
        '<p class="lab-note"><strong>What you are seeing:</strong> on the left, 16 flats in Pune: size in square feet (sq ft) across, price in ₹ lakh (1 lakh = ₹1,00,000) going up. ' +
        'The blue line is the model’s guess, <em>price = w × x + b</em>, and each thin red line is a <em>residual</em> (the gap between a flat’s real price and the guess). ' +
        'On the right is the <em>loss map</em>: every spot on it is one possible line (one pair of w and b), shaded by its <em>loss</em> (MSE, mean squared error: square every gap, then take the average). ' +
        '<em>Gradient descent</em> starts somewhere and keeps stepping downhill, against the slope of the loss, towards the ★, the best possible line.</p>' +
        '<p class="small muted">Behind the scenes, size is <em>standardised</em> (shifted and shrunk to small numbers near 0): x = (sq ft − 1,000) ÷ 500. ' +
        'So <b>b</b> is the price the line predicts for a 1,000 sq ft flat, and <b>w</b> is how many lakh it adds for every extra 500 sq ft. This lets one learning rate suit both w and b.</p>' +
        '<div class="lab-body">' +
          '<div class="stack-sm">' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:16px;align-items:start">' +
              '<div class="stack-sm">' +
                '<span class="eyebrow">Flats: size vs price</span>' +
                '<div class="lab-canvas-wrap" id="' + P + 'swrap"><canvas id="' + P + 'scatter" role="img" style="touch-action:none" aria-label="Scatter plot of flat size against price, with the current straight line and its residuals"></canvas></div>' +
                '<p class="small" id="' + P + 'eq" style="min-height:3em"></p>' +
                legend([['--series-4', 'Flat'], ['--series-3', 'Added by you'], ['--indigo', 'Line (model)'], ['--sindoor', 'Residual (error)']]) +
              '</div>' +
              '<div class="stack-sm">' +
                '<span class="eyebrow">Loss map: each spot is one line</span>' +
                '<div class="lab-canvas-wrap" id="' + P + 'cwrap"><canvas id="' + P + 'contour" role="img" style="touch-action:none" aria-label="Loss map: slope w across, intercept b up, with rings of equal loss and the path gradient descent has taken"></canvas></div>' +
                '<p class="small muted" style="min-height:3em">Rings join lines with equal loss, like contour lines on a hill map; darker means lower loss. The arrow shows where the next step will land.</p>' +
                legend([['--indigo', 'Steps taken'], ['--ok', 'Best line ★'], ['--ink', 'Next step']]) +
              '</div>' +
            '</div>' +
            '<div class="callout callout-indigo small" id="' + P + 'msg" role="status" aria-live="polite" style="min-height:3.4em"></div>' +
            '<div class="lab-stats" style="grid-template-columns:repeat(auto-fit,minmax(104px,1fr))">' +
              '<div class="stat" style="display:flex;flex-direction:column;justify-content:space-between;gap:2px"><div class="k">Step</div><div class="v" id="' + P + 'steps">0</div></div>' +
              '<div class="stat" style="display:flex;flex-direction:column;justify-content:space-between;gap:2px"><div class="k">w (slope)</div><div class="v" id="' + P + 'w">—</div></div>' +
              '<div class="stat" style="display:flex;flex-direction:column;justify-content:space-between;gap:2px"><div class="k">b (intercept)</div><div class="v" id="' + P + 'b">—</div></div>' +
              '<div class="stat" style="display:flex;flex-direction:column;justify-content:space-between;gap:2px"><div class="k">Loss (MSE)</div><div class="v" id="' + P + 'loss">—</div></div>' +
              '<div class="stat" style="display:flex;flex-direction:column;justify-content:space-between;gap:2px"><div class="k">Best possible</div><div class="v" id="' + P + 'best">—</div></div>' +
              '<div class="stat" style="display:flex;flex-direction:column;justify-content:space-between;gap:2px"><div class="k">Typical gap</div><div class="v" id="' + P + 'rmse">—</div></div>' +
            '</div>' +
            '<p class="kbd-hint">Tip: tap the left chart to add a flat, or drag a dot to move it. Tap the loss map to start from that spot. “Typical gap” is √loss (called RMSE): roughly how many lakh a typical guess is off by.</p>' +
          '</div>' +
          '<div class="lab-controls">' +
            '<div class="control"><label for="' + P + 'lr">Learning rate (step size) <output id="' + P + 'lrout" for="' + P + 'lr">' + fmtLr(LR_DEFAULT) + '</output></label>' +
              '<input type="range" id="' + P + 'lr" min="0" max="' + SLIDER_MAX + '" step="1" value="' + sliderFromLr(LR_DEFAULT) + '" aria-valuetext="' + fmtLr(LR_DEFAULT) + '" aria-describedby="' + P + 'lrhelp">' +
              '<p class="small muted" id="' + P + 'lrhelp">Log scale from 0.001 to 2. Small steps are safe but slow; too big and every step overshoots the valley.</p></div>' +
            '<div class="control"><span class="control-label" id="' + P + 'modelbl">Each step looks at</span>' +
              '<div class="seg" role="group" aria-labelledby="' + P + 'modelbl">' +
                '<button type="button" data-mode="batch" aria-pressed="true">Batch: all flats</button>' +
                '<button type="button" data-mode="sgd" aria-pressed="false">Stochastic: 1 flat</button>' +
              '</div>' +
              '<p class="small muted">Batch uses every flat for each step. Stochastic (random) uses just one randomly picked flat, circled on the chart: much less work per step, but wobbly.</p></div>' +
            '<div class="stack-sm">' +
              '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">' +
                '<button type="button" class="btn" id="' + P + 'step">Step</button>' +
                '<button type="button" class="btn btn-primary" id="' + P + 'run">Run</button>' +
                '<button type="button" class="btn" id="' + P + 'reset">Reset</button>' +
              '</div>' +
              '<p class="small muted">Reset jumps to a new random starting line.</p>' +
            '</div>' +
            '<div class="control"><span class="control-label">Change the data</span>' +
              '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">' +
                '<button type="button" class="btn btn-sm" id="' + P + 'outlier">Add an outlier</button>' +
                '<button type="button" class="btn btn-sm" id="' + P + 'resetdata">Reset data</button>' +
              '</div></div>' +
            '<div class="small" style="display:grid;grid-template-columns:20px minmax(0,1fr);gap:8px;align-items:start"><input type="checkbox" id="' + P + 'showbest" style="margin:3px 0 0"><label for="' + P + 'showbest">Show the best possible line (worked out exactly with algebra)</label></div>' +
            '<div class="stack-sm"><h4>Your tasks</h4><ul class="lab-tasks" id="' + P + 'tasks">' + tasksHtml + '</ul></div>' +
          '</div>' +
        '</div>' +
        '<p class="small muted"><strong style="color:var(--ink)">Why it matters in real ML:</strong> almost every model, from this straight line to the huge networks behind chatbots, learns by this same downhill walk; the learning rate is one of the first settings engineers tune, and stochastic (or mini-batch) steps are how they train on millions of examples quickly.</p>' +
      '</div>';

    function $(id) { return root.querySelector('#' + P + id); }
    var swrap = $('swrap'), scanvas = $('scatter'), cwrap = $('cwrap'), ccanvas = $('contour');
    var sg = scanvas.getContext('2d'), cg = ccanvas.getContext('2d');
    var elMsg = $('msg'), elEq = $('eq'), elLr = $('lr'), elLrOut = $('lrout');
    var elSteps = $('steps'), elW = $('w'), elB = $('b'), elLoss = $('loss'), elBest = $('best'), elRmse = $('rmse');
    var btnStep = $('step'), btnRun = $('run'), btnReset = $('reset'), btnOutlier = $('outlier'), btnResetData = $('resetdata'), elShowBest = $('showbest');
    var modeBtns = root.querySelectorAll('[data-mode]');
    var taskEls = {};
    Array.prototype.forEach.call(root.querySelectorAll('[data-task]'), function (li) { taskEls[li.getAttribute('data-task')] = li; });

    /* ---------- state ---------- */
    var ORIG = makeData();
    var origFit = fitData(ORIG);
    var origRmse = Math.sqrt(origFit.L);
    var pts = ORIG.map(function (p) { return { size: p.size, price: p.price, user: false, moved: false }; });
    var F = fitData(pts);
    var S = {
      w: START.w, b: START.b, lr: LR_DEFAULT, mode: 'batch',
      steps: 0, path: [], loss: 0, startLoss: 0, running: false, runSteps: 0,
      upStreak: 0, diverging: false, blown: false, converged: false, goalShown: false,
      sgdSteps: 0, sgdUp: 0, nextIdx: 0, stepsSinceData: 0, lastDelta: null, bounce: 0, bounceShown: false, slowShown: false,
      outlierPreset: 0, showBest: false, dataVersion: 0, tiltShown: false, hover: -1
    };
    var sgdRnd = mulberry32(777), startRnd = mulberry32(4242);
    var view = { cw: F.w, cb: F.b, R: VIEW_R };
    var dims = { sw: 1, sh: 1, cw: 1, ch: 1, dpr: 1 };
    var rafId = 0, lastT = 0, acc = 0, needDraw = true;
    var heat = { canvas: document.createElement('canvas'), key: '' };
    var drag = null;
    var msgKey = '';
    var done = {};

    TASKS.forEach(function (t) { if (ctx && ctx.isTaskDone && ctx.isTaskDone(t.id)) { done[t.id] = true; markLi(t.id); } });
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
    function completeTask(id) {
      if (done[id]) return;
      done[id] = true;
      markLi(id);
      if (ctx && ctx.onTaskDone) ctx.onTaskDone(id);
    }

    /* ---------- messages ---------- */
    function say(key, html, tone) {
      if (key && key === msgKey) return;
      msgKey = key || '';
      elMsg.innerHTML = html;
      elMsg.className = 'callout small' + (tone === 'warn' || tone === 'good' ? '' : ' callout-indigo');
      elMsg.style.borderLeftColor = tone === 'warn' ? 'var(--bad)' : tone === 'good' ? 'var(--ok)' : '';
      elMsg.style.background = tone === 'warn' ? 'var(--bad-soft, var(--surface-2))' : tone === 'good' ? 'var(--ok-soft, var(--surface-2))' : '';
    }
    function L1(v) { return fmtNum(v, Math.abs(v) >= 1000 ? 0 : 1); }

    /* ---------- geometry ---------- */
    function sGeom() {
      var small = dims.sw < 360;
      var pl = small ? 44 : 50, pr = 14, pt = 12, pb = small ? 40 : 44;
      return { pl: pl, pt: pt, pw: Math.max(10, dims.sw - pl - pr), ph: Math.max(10, dims.sh - pt - pb) };
    }
    function sx(G, size) { return G.pl + (size - X_MIN) / (X_MAX - X_MIN) * G.pw; }
    function sy(G, price) { return G.pt + (1 - (price - Y_MIN) / (Y_MAX - Y_MIN)) * G.ph; }
    function sFromPx(G, x, y) {
      var size = X_MIN + (x - G.pl) / G.pw * (X_MAX - X_MIN), price = Y_MIN + (1 - (y - G.pt) / G.ph) * (Y_MAX - Y_MIN);
      return { size: clamp(Math.round(size / 5) * 5, X_MIN, X_MAX), price: clamp(Math.round(price * 2) / 2, Y_MIN, Y_MAX) };
    }
    function cGeom() {
      var small = dims.cw < 360;
      var pl = small ? 44 : 50, pr = 14, pt = 12, pb = small ? 40 : 44;
      var pw = Math.max(10, dims.cw - pl - pr), ph = Math.max(10, dims.ch - pt - pb);
      var upp = 2 * view.R / Math.min(pw, ph);  // lakh per pixel, same on both axes so "downhill" looks perpendicular to the rings
      return { pl: pl, pt: pt, pw: pw, ph: ph, upp: upp, wl: view.cw - pw / 2 * upp, bt: view.cb + ph / 2 * upp };
    }
    function cx(G, w) { return G.pl + (w - G.wl) / G.upp; }
    function cy(G, b) { return G.pt + (G.bt - b) / G.upp; }
    function inside(G, p) { return p.x >= G.pl && p.x <= G.pl + G.pw && p.y >= G.pt && p.y <= G.pt + G.ph; }

    var curAspect = null, aspectRaf = 0;
    function wantAspect() { return swrap.getBoundingClientRect().width >= 400 ? '4 / 3' : '1 / 1'; }
    function applyAspect() {
      aspectRaf = 0;
      if (destroyed) return;
      var a = wantAspect();
      if (a !== curAspect) { curAspect = a; swrap.style.aspectRatio = a; cwrap.style.aspectRatio = a; }
    }
    function resize() {
      // changing the wrapper's own size inside a ResizeObserver callback would loop, so defer it
      if (wantAspect() !== curAspect && !aspectRaf) aspectRaf = requestAnimationFrame(applyAspect);
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      // the canvas fills the wrapper inside its border, so measure the canvas box itself for a 1:1 pixel match
      var r1 = scanvas.getBoundingClientRect(), r2 = ccanvas.getBoundingClientRect();
      dims.dpr = dpr;
      dims.sw = Math.max(1, Math.round(r1.width)); dims.sh = Math.max(1, Math.round(r1.height));
      dims.cw = Math.max(1, Math.round(r2.width)); dims.ch = Math.max(1, Math.round(r2.height));
      scanvas.width = Math.round(dims.sw * dpr); scanvas.height = Math.round(dims.sh * dpr);
      ccanvas.width = Math.round(dims.cw * dpr); ccanvas.height = Math.round(dims.ch * dpr);
      heat.key = '';
      requestDraw();
    }

    /* ---------- core actions ---------- */
    function resetRunFlags() {
      S.upStreak = 0; S.diverging = false; S.converged = false; S.goalShown = false;
      S.sgdSteps = 0; S.sgdUp = 0; S.lastDelta = null; S.bounce = 0; S.bounceShown = false; S.slowShown = false; S.tiltShown = false;
    }
    function setRunning(v) {
      S.running = !!v;
      btnRun.textContent = S.running ? 'Pause' : 'Run';
      if (S.running) { S.runSteps = 0; acc = 0; lastT = 0; }
      syncButtons();
      requestDraw();
    }
    function syncButtons() {
      btnStep.disabled = S.blown;
      btnRun.disabled = S.blown;
      Array.prototype.forEach.call(modeBtns, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === S.mode)); });
    }
    function pickNext() { S.nextIdx = Math.floor(sgdRnd() * pts.length); }

    function setStart(w, b, why) {
      setRunning(false);
      S.w = w; S.b = b; S.blown = false;
      S.steps = 0; S.path = [{ w: w, b: b }];
      S.loss = lossAt(pts, w, b); S.startLoss = S.loss; S.stepsSinceData = 0;
      resetRunFlags();
      syncButtons();
      if (why === 'map') say('', 'New starting line picked on the loss map (loss ' + L1(S.loss) + '). Press <b>Step</b> or <b>Run</b> to walk downhill from here.');
      else if (why === 'reset') say('', 'New random start: loss ' + L1(S.loss) + ' (the best possible is ' + L1(F.L) + '). Press <b>Run</b> to watch it roll downhill.');
      else say('', 'The line starts in a bad spot: loss ' + L1(S.loss) + ', while the best possible is ' + L1(F.L) + '. Press <b>Step</b> to take one step downhill, or <b>Run</b> to keep going.');
      updateStats();
      requestDraw();
    }
    function randomStart() {
      var G = cGeom(), w = S.w, b = S.b;
      var halfW = G.pw / 2 * G.upp, halfB = G.ph / 2 * G.upp;
      for (var tries = 0; tries < 40; tries++) {
        w = view.cw + (startRnd() * 2 - 1) * halfW * 0.88;
        b = view.cb + (startRnd() * 2 - 1) * halfB * 0.88;
        if (Math.sqrt(excess(F, w, b) / F.lg) >= 0.7 * view.R) break;
      }
      setStart(w, b, 'reset');
    }
    function recentreIfNeeded(force) {
      var G = cGeom();
      var halfW = G.pw / 2 * G.upp, halfB = G.ph / 2 * G.upp;
      if (force || Math.abs(F.w - view.cw) > 0.7 * halfW || Math.abs(F.b - view.cb) > 0.7 * halfB) { view.cw = F.w; view.cb = F.b; heat.key = ''; }
    }
    function outlierInfo() {
      var count = 0;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        if (!p.user && !p.moved) continue;
        var r = Math.abs(p.price - (origFit.w * toX(p.size) + origFit.b));
        if (r >= Math.max(25, 3 * origRmse)) count++;
      }
      var tilt = origFit.w !== 0 ? (F.w - origFit.w) / Math.abs(origFit.w) : 0;
      return { count: count, tilt: tilt };
    }
    function dataChanged() {
      F = fitData(pts);
      S.dataVersion++;
      if (finite(S.loss)) S.loss = lossAt(pts, S.w, S.b);
      S.upStreak = 0; S.stepsSinceData = 0; S.converged = false; S.lastDelta = null; S.tiltShown = false; S.goalShown = false;
      if (S.nextIdx >= pts.length) pickNext();
      recentreIfNeeded(false);
      heat.key = '';
      updateStats();
      requestDraw();
    }
    function dataMessage(added) {
      var oi = outlierInfo();
      if (oi.count) {
        say('', (added ? 'Outlier added. ' : '') + 'The data changed, so the whole loss map changed too and the ★ moved: the best line is now ₹' + fmtIN(F.w * 200, 0) + ' per sq ft instead of ₹' + fmtIN(origFit.w * 200, 0) + '. The dashed grey line shows the old best line. Press <b>Run</b> and watch your line move.');
      } else {
        say('', 'The data changed, so the loss map changed too and the ★ moved. Press <b>Run</b> to let gradient descent catch up.');
      }
    }
    function addOutlier() {
      if (pts.length >= MAX_POINTS) { say('', 'That is enough flats for one chart (' + MAX_POINTS + '). Press <b>Reset data</b> to start over.'); return; }
      var o = OUTLIERS[S.outlierPreset % OUTLIERS.length];
      S.outlierPreset++;
      pts.push({ size: o.size, price: o.price, user: true, moved: true });
      dataChanged();
      say('', 'Added an outlier: a ' + fmtIN(o.size, 0) + ' sq ft flat priced at ₹' + o.price + ' lakh (maybe a typing mistake in the data). The ★ jumped: the best line is now ₹' + fmtIN(F.w * 200, 0) + ' per sq ft instead of ₹' + fmtIN(origFit.w * 200, 0) + '. Press <b>Run</b> and watch your line tilt.');
    }
    function resetData() {
      pts = ORIG.map(function (p) { return { size: p.size, price: p.price, user: false, moved: false }; });
      S.outlierPreset = 0;
      dataChanged();
      recentreIfNeeded(true);
      say('', 'Back to the original 16 flats. Press <b>Run</b> to fit them again.');
    }

    /* one gradient descent step */
    function doStep() {
      if (S.blown || !pts.length) return;
      var prevL = S.loss, g;
      if (S.mode === 'batch') g = gradBatch(pts, S.w, S.b);
      else g = gradOne(pts[S.nextIdx], S.w, S.b);
      var dw = -S.lr * g.w, db = -S.lr * g.b;
      S.w += dw; S.b += db;
      S.steps++; S.stepsSinceData++; S.runSteps++;
      S.loss = lossAt(pts, S.w, S.b);
      if (S.mode === 'sgd') { S.sgdSteps++; if (S.loss > prevL) S.sgdUp++; pickNext(); }
      if (finite(S.w) && finite(S.b)) {
        S.path.push({ w: S.w, b: S.b });
        if (S.path.length > MAX_PATH) S.path = S.path.filter(function (p, i, a) { return i % 2 === 0 || i === a.length - 1; });
      }
      var up = finite(S.loss) && finite(prevL) && S.loss - prevL > 1e-9 * Math.max(prevL, 1e-12) && S.loss - F.L > 1e-7 * Math.max(F.L, 1e-9);
      S.upStreak = up ? S.upStreak + 1 : 0;
      // "bounce": two steps in a row point in opposite directions (overshooting the valley floor)
      if (S.lastDelta && dw * S.lastDelta[0] + db * S.lastDelta[1] < 0) S.bounce++; else S.bounce = 0;
      S.lastDelta = [dw, db];
      afterStep(prevL, Math.hypot(dw, db));
      if (S.running && S.runSteps >= RUN_CAP) {
        setRunning(false);
        say('', 'Paused after ' + fmtIN(RUN_CAP, 0) + ' steps in one run. Press <b>Run</b> to continue.');
      }
    }

    function afterStep(prevL, moved) {
      // 1. blown up completely
      if (!finite(S.loss) || !finite(S.w) || !finite(S.b)) {
        S.blown = true; S.diverging = true;
        setRunning(false);
        completeTask('t2');
        say('blown', '<b>It blew up to infinity.</b> The numbers grew so big the computer can’t store them, so the run stopped. Lower the learning rate, then press <b>Reset</b> (or tap the loss map) to start again.', 'warn');
        return;
      }
      // 2. diverging: in batch mode the loss of a bowl-shaped problem can only grow if the step is too big
      var wasDiverging = S.diverging;
      var div = S.loss > BLOWUP ||
        (S.mode === 'batch' ? S.upStreak >= 3 : (S.upStreak >= 2 && S.loss > 25 * Math.max(S.startLoss, F.L)));
      if (div) {
        S.diverging = true;
        completeTask('t2');
        say('div', '<b>Diverging!</b> The loss is growing with every step. The learning rate is too big: every step jumps right over the valley and lands even higher on the other side. Lower the learning rate, then press <b>Reset</b>.', 'warn');
        if (S.loss > BLOWUP && S.running) {
          setRunning(false);
          say('', '<b>Diverging, so the run paused.</b> The loss is now ' + L1(S.loss) + ', astronomically big. Each step overshot further than the last. Lower the learning rate: you can even press <b>Step</b> to walk back, or <b>Reset</b>.', 'warn');
        }
        return;
      }
      if (wasDiverging && S.upStreak === 0 && S.loss < prevL) {
        S.diverging = false;
        say('calm', 'Phew: the loss is falling again (' + L1(S.loss) + ').');
      }
      // 3. stochastic zig-zag
      if (S.mode === 'sgd' && S.sgdSteps >= 20 && S.sgdUp >= 3 && !done.t3) {
        completeTask('t3');
        say('', 'See the zig-zag? Each stochastic step only listens to one flat, so ' + S.sgdUp + ' of these ' + S.sgdSteps + ' steps actually made the overall loss go <em>up</em>. On average it still heads for the ★, then jiggles around it instead of settling.', 'good');
      }
      // 4. goal: within 1% of the exact optimum
      var tol = 0.01 * F.L + 1e-9;
      if (S.loss - F.L <= tol && S.startLoss - F.L > 2 * tol) {
        if (!done.t1) completeTask('t1');
        if (!S.goalShown) {
          S.goalShown = true;
          if (msgKey !== 'tilt') say('goal', '<b>Goal reached:</b> loss ' + L1(S.loss) + ' is within 1% of the best possible ' + L1(F.L) + ', after ' + fmtIN(S.steps, 0) + ' steps.', 'good');
        }
      }
      // 5. outlier tilt
      var oi = outlierInfo();
      if (oi.count && S.stepsSinceData >= 1 && S.loss <= 1.02 * F.L + 1e-9 && !S.tiltShown) {
        S.tiltShown = true;
        if (Math.abs(oi.tilt) >= 0.1) {
          completeTask('t4');
          say('tilt', '<b>It tilted!</b> ' + (oi.count === 1 ? 'One odd flat' : oi.count + ' odd flats') + ' changed the slope from ₹' + fmtIN(origFit.w * 200, 0) + ' to ₹' + fmtIN(F.w * 200, 0) + ' per sq ft (compare the dashed grey line). The MSE squares each gap, so one huge gap pulls the line much harder than many small ones.', 'good');
        } else {
          say('', 'The line settled, but it barely tilted: that outlier sits near the middle, so it mostly lifts or lowers the line. Try one near the left or right edge.');
        }
      }
      // 6. converged (batch only): the steps have become too small to matter
      if (S.mode === 'batch' && moved < 1e-7 * (1 + Math.abs(S.w) + Math.abs(S.b)) && S.loss - F.L <= 1e-6 * (1 + F.L)) {
        S.converged = true;
        if (S.running) setRunning(false);
        if (msgKey !== 'tilt') say('conv', 'Settled after ' + fmtIN(S.steps, 0) + ' steps: at the bottom of the bowl the slope is flat, so each step shrinks to almost nothing. Loss ' + L1(S.loss) + ' = the best possible.', 'good');
        return;
      }
      // 7. gentle hints
      if (S.mode === 'batch' && S.bounce >= 3 && !S.bounceShown && !S.diverging) {
        S.bounceShown = true;
        say('', '<b>Bouncing:</b> each step overshoots the valley floor and lands on the other side (see the zig-zag on the map), yet the loss still falls. This learning rate is close to the limit.');
      }
      if (S.mode === 'batch' && !S.slowShown && S.steps >= 60 && S.lr < 0.02 && S.loss > 1.5 * F.L) {
        S.slowShown = true;
        say('', '<b>Tiny steps:</b> it is going the right way, but very slowly. Try a bigger learning rate.');
      }
    }

    /* ---------- stats + equation ---------- */
    var lastStats = {};
    function setText(el, key, v) { if (lastStats[key] !== v) { lastStats[key] = v; el.textContent = v; } }
    function updateStats() {
      setText(elSteps, 's', fmtIN(S.steps, 0));
      setText(elW, 'w', L1(S.w));
      setText(elB, 'b', L1(S.b));
      setText(elLoss, 'l', S.blown ? '∞' : L1(S.loss));
      setText(elBest, 'bl', L1(F.L));
      setText(elRmse, 'r', S.blown ? '∞' : '₹' + L1(Math.sqrt(S.loss)) + ' L');
      var lc = S.blown || S.diverging ? 'var(--bad)' : S.loss - F.L <= 0.01 * F.L + 1e-9 ? 'var(--ok)' : '';
      if (lastStats.lc !== lc) { lastStats.lc = lc; elLoss.style.color = lc; }
      var eq;
      if (S.blown) eq = 'Line now: the numbers are too big to draw.';
      else {
        var perSqft = S.w * 200, B = S.b - 2 * S.w;  // undo the standardising: price = (w/500)·sq ft + (b − 2w) lakh
        eq = 'Line now, in everyday units: price ≈ ₹' + fmtNum(perSqft, 0) + ' per sq ft × size ' + (B < 0 ? '− ' : '+ ') + '₹' + fmtNum(Math.abs(B), 1) + ' lakh. ' +
          'Best possible: ₹' + fmtIN(F.w * 200, 0) + ' per sq ft.';
      }
      setText(elEq, 'eq', eq);
    }
    function updateAria() {
      scanvas.setAttribute('aria-label', 'Scatter plot of ' + pts.length + ' flats, size against price, with the current line. ' + elEq.textContent);
      ccanvas.setAttribute('aria-label', 'Loss map with ' + S.steps + ' gradient descent steps. Current w ' + L1(S.w) + ', b ' + L1(S.b) + ', loss ' + L1(S.loss) + '; best possible w ' + L1(F.w) + ', b ' + L1(F.b) + ', loss ' + L1(F.L) + '.');
    }

    /* ---------- drawing ---------- */
    function requestDraw() {
      needDraw = true;
      if (!rafId && !destroyed) rafId = requestAnimationFrame(tick);
    }
    function stepsPerSecond() {
      var r = S.runSteps;
      return r < 25 ? 8 : r < 80 ? 25 : r < 400 ? 90 : 300;
    }
    function tick(now) {
      rafId = 0;
      if (destroyed) return;
      if (S.running) {
        if (!lastT) lastT = now;
        var dt = Math.min(0.1, (now - lastT) / 1000);
        lastT = now;
        acc += dt * stepsPerSecond();
        var n = Math.min(Math.floor(acc), 12);
        acc -= Math.floor(acc);
        for (var i = 0; i < n && S.running; i++) doStep();
        updateStats();
        needDraw = true;
      }
      if (needDraw) {
        needDraw = false;
        var T = readTheme();
        drawScatter(T);
        drawContour(T);
        if (!S.running) updateAria();
      }
      if (S.running) rafId = requestAnimationFrame(tick);
    }

    function font(T, px, weight) { return (weight ? weight + ' ' : '') + px + 'px ' + T.font; }

    function drawScatter(T) {
      var g = sg, W = dims.sw, H = dims.sh, G = sGeom(), i;
      g.setTransform(dims.dpr, 0, 0, dims.dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.fillStyle = T.surface; g.fillRect(0, 0, W, H);
      // grid + ticks
      g.lineWidth = 1; g.strokeStyle = T.line; g.fillStyle = T.muted; g.font = font(T, 11);
      g.textAlign = 'center'; g.textBaseline = 'top';
      for (var xs = 400; xs <= X_MAX; xs += 400) {
        var px = Math.round(sx(G, xs)) + 0.5;
        g.beginPath(); g.moveTo(px, G.pt); g.lineTo(px, G.pt + G.ph); g.stroke();
        var lab = fmtIN(xs, 0), half = g.measureText(lab).width / 2;
        g.fillText(lab, Math.min(px, W - 4 - half), G.pt + G.ph + 5);
      }
      g.textAlign = 'right'; g.textBaseline = 'middle';
      for (var ys = 0; ys <= Y_MAX; ys += 40) {
        var py = Math.round(sy(G, ys)) + 0.5;
        g.beginPath(); g.moveTo(G.pl, py); g.lineTo(G.pl + G.pw, py); g.stroke();
        g.fillText(String(ys), G.pl - 6, Math.max(py, G.pt + 6));
      }
      g.strokeStyle = T.muted; g.beginPath(); g.moveTo(G.pl + 0.5, G.pt); g.lineTo(G.pl + 0.5, G.pt + G.ph + 0.5); g.lineTo(G.pl + G.pw, G.pt + G.ph + 0.5); g.stroke();
      // axis titles
      g.fillStyle = T.ink; g.font = font(T, 12, '600'); g.textAlign = 'center'; g.textBaseline = 'bottom';
      g.fillText('Flat size (sq ft)', G.pl + G.pw / 2, H - 3);
      g.save(); g.translate(13, G.pt + G.ph / 2); g.rotate(-Math.PI / 2); g.textBaseline = 'middle'; g.fillText('Price (₹ lakh)', 0, 0); g.restore();

      g.save();
      g.beginPath(); g.rect(G.pl, G.pt, G.pw, G.ph); g.clip();
      function lineAt(w, b, color, width, dash) {
        if (!finite(w) || !finite(b)) return;
        var x0 = sx(G, X_MIN), x1 = sx(G, X_MAX);
        var y0 = sy(G, w * toX(X_MIN) + b), y1 = sy(G, w * toX(X_MAX) + b);
        var c = clipSeg(x0, y0, x1, y1, G.pl - 4, G.pt - 4, G.pw + 8, G.ph + 8);
        if (!c) return;
        g.strokeStyle = color; g.lineWidth = width; g.setLineDash(dash || []);
        g.beginPath(); g.moveTo(c[0], c[1]); g.lineTo(c[2], c[3]); g.stroke();
        g.setLineDash([]);
      }
      var oi = outlierInfo();
      if (oi.count) lineAt(origFit.w, origFit.b, rgba(T.rgb.muted, 0.8), 1.5, [5, 5]);
      if (S.showBest) lineAt(F.w, F.b, T.ok, 2, [7, 5]);
      // residuals
      var hi = S.mode === 'sgd' && !S.blown ? S.nextIdx : -1;
      if (finite(S.w) && finite(S.b)) {
        for (i = 0; i < pts.length; i++) {
          var p = pts[i], ppx = sx(G, p.size), ppy = sy(G, p.price);
          var ly = clamp(sy(G, S.w * toX(p.size) + S.b), G.pt - 10, G.pt + G.ph + 10);
          g.strokeStyle = i === hi ? T.sindoor : rgba(T.rgb.sindoor, 0.7);
          g.lineWidth = i === hi ? 2.5 : 1.2;
          g.beginPath(); g.moveTo(ppx, ppy); g.lineTo(ppx, ly); g.stroke();
        }
      }
      lineAt(S.w, S.b, T.indigo, 2.5);
      // points (circles = original flats, diamonds = added by you)
      var r = dims.sw < 360 ? 4.5 : 5;
      for (i = 0; i < pts.length; i++) {
        var q = pts[i], qx = sx(G, q.size), qy = sy(G, q.price), rr = (i === S.hover || (drag && drag.kind === 'pt' && drag.idx === i)) ? r + 1.5 : r;
        g.beginPath();
        if (q.user) { g.moveTo(qx, qy - rr - 1.5); g.lineTo(qx + rr + 1.5, qy); g.lineTo(qx, qy + rr + 1.5); g.lineTo(qx - rr - 1.5, qy); g.closePath(); g.fillStyle = T.series3; }
        else { g.arc(qx, qy, rr, 0, Math.PI * 2); g.fillStyle = T.series4; }
        g.fill();
        g.lineWidth = 1.5; g.strokeStyle = T.surface; g.stroke();
      }
      if (hi >= 0 && pts[hi]) {
        g.beginPath(); g.arc(sx(G, pts[hi].size), sy(G, pts[hi].price), r + 5, 0, Math.PI * 2);
        g.lineWidth = 2; g.strokeStyle = T.ink; g.stroke();
      }
      g.restore();
    }

    function buildHeat(T, G) {
      var key = [S.dataVersion, view.cw, view.cb, view.R, G.pw, G.ph, T.surface, T.indigo].join('|');
      if (heat.key === key) return;
      heat.key = key;
      var cell = 5, cols = Math.max(2, Math.ceil(G.pw / cell)), rows = Math.max(2, Math.ceil(G.ph / cell));
      heat.canvas.width = cols; heat.canvas.height = rows; heat.cols = cols; heat.rows = rows; heat.cell = cell;
      var hg = heat.canvas.getContext('2d'), img = hg.createImageData(cols, rows), d = img.data;
      var s = T.rgb.surface, c = T.rgb.indigo;
      for (var j = 0; j < rows; j++) {
        var b = G.bt - (j + 0.5) * cell * G.upp;
        for (var i = 0; i < cols; i++) {
          var w = G.wl + (i + 0.5) * cell * G.upp;
          var rad = Math.sqrt(excess(F, w, b) / F.lg) / view.R;  // 0 at the optimum, ~1 one view-radius away
          var v = clamp(1 - rad / 1.7, 0, 1), a = 0.03 + 0.3 * v * v;
          var k = (j * cols + i) * 4;
          d[k] = s[0] + (c[0] - s[0]) * a; d[k + 1] = s[1] + (c[1] - s[1]) * a; d[k + 2] = s[2] + (c[2] - s[2]) * a; d[k + 3] = 255;
        }
      }
      hg.putImageData(img, 0, 0);
    }

    function drawContour(T) {
      var g = cg, W = dims.cw, H = dims.ch, G = cGeom(), i;
      g.setTransform(dims.dpr, 0, 0, dims.dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.fillStyle = T.surface; g.fillRect(0, 0, W, H);
      buildHeat(T, G);
      g.save();
      g.beginPath(); g.rect(G.pl, G.pt, G.pw, G.ph); g.clip();
      g.imageSmoothingEnabled = true;
      g.drawImage(heat.canvas, 0, 0, heat.cols, heat.rows, G.pl, G.pt, heat.cols * heat.cell, heat.rows * heat.cell);
      // rings of equal loss: exact ellipses around the optimum
      var diag = Math.hypot(G.pw, G.ph) * G.upp;
      g.strokeStyle = rgba(T.rgb.indigo, 0.32); g.lineWidth = 1;
      for (var k = 1; k <= 40; k++) {
        var c = F.lg * Math.pow(k * view.R / 5, 2);
        var a1 = Math.sqrt(c / F.l1), a2 = Math.min(Math.sqrt(c / F.l2), 1e4 * view.R);
        if (a1 > diag) break;
        g.beginPath();
        for (var t = 0; t <= 72; t++) {
          var ang = t / 72 * Math.PI * 2, ca = Math.cos(ang) * a1, sa = Math.sin(ang) * a2;
          var w = F.w + ca * F.e1[0] + sa * F.e2[0], b = F.b + ca * F.e1[1] + sa * F.e2[1];
          var X = cx(G, w), Y = cy(G, b);
          if (t === 0) g.moveTo(X, Y); else g.lineTo(X, Y);
        }
        g.stroke();
      }
      g.restore();

      // axes + ticks
      var step = niceStep(view.R / 2.5);
      var wR = G.wl + G.pw * G.upp, bB = G.bt - G.ph * G.upp;
      g.lineWidth = 1; g.strokeStyle = rgba(T.rgb.muted, 0.25); g.fillStyle = T.muted; g.font = font(T, 11);
      g.textAlign = 'center'; g.textBaseline = 'top';
      var v;
      for (v = Math.ceil(G.wl / step) * step; v <= wR; v += step) {
        var px = Math.round(cx(G, v)) + 0.5;
        g.beginPath(); g.moveTo(px, G.pt); g.lineTo(px, G.pt + G.ph); g.stroke();
        if (px > G.pl + 8 && px < G.pl + G.pw - 4) g.fillText(fmtNum(v, 0), px, G.pt + G.ph + 5);
      }
      g.textAlign = 'right'; g.textBaseline = 'middle';
      for (v = Math.ceil(bB / step) * step; v <= G.bt; v += step) {
        var py = Math.round(cy(G, v)) + 0.5;
        g.beginPath(); g.moveTo(G.pl, py); g.lineTo(G.pl + G.pw, py); g.stroke();
        if (py > G.pt + 4 && py < G.pt + G.ph - 4) g.fillText(fmtNum(v, 0), G.pl - 6, py);
      }
      g.strokeStyle = T.muted; g.beginPath(); g.moveTo(G.pl + 0.5, G.pt); g.lineTo(G.pl + 0.5, G.pt + G.ph + 0.5); g.lineTo(G.pl + G.pw, G.pt + G.ph + 0.5); g.stroke();
      g.fillStyle = T.ink; g.font = font(T, 12, '600'); g.textAlign = 'center'; g.textBaseline = 'bottom';
      g.fillText('w (slope)', G.pl + G.pw / 2, H - 3);
      g.save(); g.translate(13, G.pt + G.ph / 2); g.rotate(-Math.PI / 2); g.textBaseline = 'middle'; g.fillText('b (intercept)', 0, 0); g.restore();

      g.save();
      g.beginPath(); g.rect(G.pl, G.pt, G.pw, G.ph); g.clip();
      var rx = G.pl - 20, ry = G.pt - 20, rw = G.pw + 40, rh = G.ph + 40;
      // path of steps taken
      var path = S.path;
      g.strokeStyle = rgba(T.rgb.indigo, 0.75); g.lineWidth = 1.6; g.lineJoin = 'round';
      g.beginPath();
      for (i = 1; i < path.length; i++) {
        var sg2 = clipSeg(cx(G, path[i - 1].w), cy(G, path[i - 1].b), cx(G, path[i].w), cy(G, path[i].b), rx, ry, rw, rh);
        if (sg2) { g.moveTo(sg2[0], sg2[1]); g.lineTo(sg2[2], sg2[3]); }
      }
      g.stroke();
      if (path.length <= 400) {
        g.fillStyle = rgba(T.rgb.indigo, 0.85);
        for (i = 1; i < path.length - 1; i++) {
          var dx = cx(G, path[i].w), dy = cy(G, path[i].b);
          if (dx > rx && dx < rx + rw && dy > ry && dy < ry + rh) { g.beginPath(); g.arc(dx, dy, 2.2, 0, Math.PI * 2); g.fill(); }
        }
      }
      // start marker
      if (path.length) {
        var s0x = cx(G, path[0].w), s0y = cy(G, path[0].b);
        if (s0x > rx && s0x < rx + rw && s0y > ry && s0y < ry + rh) {
          g.beginPath(); g.arc(s0x, s0y, 5, 0, Math.PI * 2); g.lineWidth = 1.8; g.strokeStyle = T.ink; g.stroke();
          g.fillStyle = T.muted; g.font = font(T, 11, '600'); g.textAlign = s0x > G.pl + G.pw - 40 ? 'right' : 'left'; g.textBaseline = 'middle';
          g.fillText('start', s0x + (g.textAlign === 'right' ? -9 : 9), s0y + (s0y > G.pt + G.ph - 12 ? -10 : 0));
        }
      }
      // optimum star
      var ox = cx(G, F.w), oy = cy(G, F.b);
      g.beginPath();
      for (i = 0; i < 10; i++) {
        var ra = i % 2 ? 4 : 9.5, an = -Math.PI / 2 + i * Math.PI / 5;
        if (i === 0) g.moveTo(ox + ra * Math.cos(an), oy + ra * Math.sin(an)); else g.lineTo(ox + ra * Math.cos(an), oy + ra * Math.sin(an));
      }
      g.closePath(); g.fillStyle = T.ok; g.fill(); g.lineWidth = 1.5; g.strokeStyle = T.surface; g.stroke();
      g.fillStyle = T.ok; g.font = font(T, 11, '700'); g.textAlign = 'left'; g.textBaseline = 'middle';
      g.fillText('best', ox + 12, oy - 9);

      // next step arrow + current point
      if (!S.blown && finite(S.w) && finite(S.b)) {
        var gr = S.mode === 'batch' ? gradBatch(pts, S.w, S.b) : (pts[S.nextIdx] ? gradOne(pts[S.nextIdx], S.w, S.b) : { w: 0, b: 0 });
        var nx = cx(G, S.w - S.lr * gr.w), ny = cy(G, S.b - S.lr * gr.b), curx = cx(G, S.w), cury = cy(G, S.b);
        var seg = clipSeg(curx, cury, nx, ny, rx, ry, rw, rh);
        var alen = Math.hypot(nx - curx, ny - cury);
        if (seg && alen > 3) {
          g.strokeStyle = T.ink; g.fillStyle = T.ink; g.lineWidth = 1.6; g.setLineDash([4, 3]);
          g.beginPath(); g.moveTo(seg[0], seg[1]); g.lineTo(seg[2], seg[3]); g.stroke(); g.setLineDash([]);
          if (seg[2] === nx && seg[3] === ny) {
            var ah = Math.atan2(ny - cury, nx - curx), hl = Math.min(9, alen * 0.6);
            g.beginPath(); g.moveTo(nx, ny);
            g.lineTo(nx - hl * Math.cos(ah - 0.45), ny - hl * Math.sin(ah - 0.45));
            g.lineTo(nx - hl * Math.cos(ah + 0.45), ny - hl * Math.sin(ah + 0.45));
            g.closePath(); g.fill();
          }
        }
        if (inside(G, { x: curx, y: cury })) {
          g.beginPath(); g.arc(curx, cury, 6.5, 0, Math.PI * 2);
          g.fillStyle = T.indigo; g.fill(); g.lineWidth = 2; g.strokeStyle = T.surface; g.stroke();
        } else {
          // off the map: point at it from the edge
          var mx = G.pl + G.pw / 2, my = G.pt + G.ph / 2, ddx = curx - mx, ddy = cury - my;
          var sc = Math.min((G.pw / 2 - 14) / Math.max(Math.abs(ddx), 1e-9), (G.ph / 2 - 14) / Math.max(Math.abs(ddy), 1e-9));
          var ex = mx + ddx * sc, ey = my + ddy * sc, an2 = Math.atan2(ddy, ddx);
          g.fillStyle = T.bad;
          g.beginPath(); g.moveTo(ex + 9 * Math.cos(an2), ey + 9 * Math.sin(an2));
          g.lineTo(ex + 7 * Math.cos(an2 + 2.4), ey + 7 * Math.sin(an2 + 2.4));
          g.lineTo(ex + 7 * Math.cos(an2 - 2.4), ey + 7 * Math.sin(an2 - 2.4));
          g.closePath(); g.fill();
          g.font = font(T, 11, '700'); g.textBaseline = 'middle';
          g.textAlign = ex > mx ? 'right' : 'left';
          g.fillText('off the map', ex + (ex > mx ? -12 : 12), clamp(ey + (ey < my ? 14 : -14), G.pt + 8, G.pt + G.ph - 8));
        }
      }
      g.restore();
    }

    /* ---------- pointer: scatter (add / drag flats) ---------- */
    function localPt(canvas, e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function hitPoint(p, rad) {
      var G = sGeom(), best = -1, bd = rad * rad;
      for (var i = 0; i < pts.length; i++) {
        var dx = sx(G, pts[i].size) - p.x, dy = sy(G, pts[i].price) - p.y, d = dx * dx + dy * dy;
        if (d <= bd) { bd = d; best = i; }
      }
      return best;
    }
    on(scanvas, 'pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      var p = localPt(scanvas, e), G = sGeom();
      var hit = hitPoint(p, e.pointerType === 'mouse' ? 12 : 22), added = false;
      if (hit < 0) {
        if (!inside(G, p)) return;
        if (pts.length >= MAX_POINTS) { say('', 'That is enough flats for one chart (' + MAX_POINTS + '). Press <b>Reset data</b> to start over.'); return; }
        var d = sFromPx(G, p.x, p.y);
        pts.push({ size: d.size, price: d.price, user: true, moved: true });
        hit = pts.length - 1; added = true;
      }
      drag = { kind: 'pt', idx: hit, id: e.pointerId, added: added, changed: added };
      try { scanvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      e.preventDefault();
      scanvas.style.cursor = 'grabbing';
      if (added) dataChanged(); else requestDraw();
    });
    on(scanvas, 'pointermove', function (e) {
      var p = localPt(scanvas, e);
      if (drag && drag.kind === 'pt' && drag.id === e.pointerId) {
        var d = sFromPx(sGeom(), p.x, p.y), q = pts[drag.idx];
        if (q && (q.size !== d.size || q.price !== d.price)) { q.size = d.size; q.price = d.price; q.moved = true; drag.changed = true; dataChanged(); }
      } else if (e.pointerType === 'mouse') {
        var h = hitPoint(p, 12);
        if (h !== S.hover) { S.hover = h; requestDraw(); }
        scanvas.style.cursor = h >= 0 ? 'grab' : 'crosshair';
      }
    });
    function endScatterDrag(e) {
      if (!drag || drag.kind !== 'pt' || drag.id !== e.pointerId) return;
      var wasAdded = drag.added, changed = drag.changed;
      drag = null;
      scanvas.style.cursor = 'crosshair';
      if (changed) dataMessage(wasAdded);
      requestDraw();
    }
    on(scanvas, 'pointerup', endScatterDrag);
    on(scanvas, 'pointercancel', endScatterDrag);
    on(scanvas, 'pointerleave', function () { if (S.hover !== -1 && !drag) { S.hover = -1; requestDraw(); } });

    /* ---------- pointer: loss map (pick a starting line) ---------- */
    function mapPick(e) {
      var G = cGeom(), p = localPt(ccanvas, e);
      var w = G.wl + clamp(p.x - G.pl, 0, G.pw) * G.upp, b = G.bt - clamp(p.y - G.pt, 0, G.ph) * G.upp;
      setStart(Math.round(w * 10) / 10, Math.round(b * 10) / 10, 'map');
    }
    on(ccanvas, 'pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (!inside(cGeom(), localPt(ccanvas, e))) return;
      drag = { kind: 'map', id: e.pointerId };
      try { ccanvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      e.preventDefault();
      mapPick(e);
    });
    on(ccanvas, 'pointermove', function (e) { if (drag && drag.kind === 'map' && drag.id === e.pointerId) mapPick(e); });
    function endMapDrag(e) { if (drag && drag.kind === 'map' && drag.id === e.pointerId) drag = null; }
    on(ccanvas, 'pointerup', endMapDrag);
    on(ccanvas, 'pointercancel', endMapDrag);
    ccanvas.style.cursor = 'crosshair';
    scanvas.style.cursor = 'crosshair';

    /* ---------- controls ---------- */
    on(elLr, 'input', function () {
      S.lr = lrFromSlider(+elLr.value);
      elLrOut.textContent = fmtLr(S.lr);
      elLr.setAttribute('aria-valuetext', fmtLr(S.lr));
      S.bounceShown = false; S.slowShown = false;
      requestDraw();
    });
    Array.prototype.forEach.call(modeBtns, function (btn) {
      on(btn, 'click', function () {
        var m = btn.getAttribute('data-mode');
        if (m === S.mode) return;
        S.mode = m; S.sgdSteps = 0; S.sgdUp = 0; S.upStreak = 0; S.converged = false; S.lastDelta = null; S.bounce = 0;
        if (m === 'sgd') { pickNext(); say('', '<b>Stochastic mode:</b> each step now uses only the circled flat, picked at random. Press <b>Run</b> and watch the path wobble.'); }
        else say('', '<b>Batch mode:</b> each step uses all ' + pts.length + ' flats, so it heads straight downhill.');
        syncButtons(); updateStats(); requestDraw();
      });
    });
    on(btnStep, 'click', function () {
      if (S.running) setRunning(false);
      var before = S.loss;
      doStep();
      if (S.steps === 1 && !S.diverging && !S.blown && msgKey !== 'conv') {
        say('', 'One step: w and b each moved a little against the slope, landing where the arrow pointed. Loss went from ' + L1(before) + ' to ' + L1(S.loss) + '.');
      }
      updateStats(); requestDraw();
    });
    on(btnRun, 'click', function () {
      if (S.running) { setRunning(false); updateStats(); return; }
      if (S.blown) return;
      setRunning(true);
      doStep();
      updateStats();
    });
    on(btnReset, 'click', function () { randomStart(); });
    on(btnOutlier, 'click', function () { addOutlier(); });
    on(btnResetData, 'click', function () { resetData(); });
    on(elShowBest, 'change', function () { S.showBest = elShowBest.checked; requestDraw(); });

    /* ---------- theme + resize ---------- */
    function onTheme() { heat.key = ''; requestDraw(); }
    var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mql) { if (mql.addEventListener) mql.addEventListener('change', onTheme); else if (mql.addListener) mql.addListener(onTheme); }
    on(document, 'themechange', onTheme);
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { resize(); }); ro.observe(swrap); ro.observe(cwrap); }
    else on(window, 'resize', resize);

    /* ---------- start ---------- */
    pickNext();
    applyAspect();
    resize();
    setStart(START.w, START.b, 'init');

    return {
      destroy: function () {
        destroyed = true;
        if (rafId) cancelAnimationFrame(rafId);
        if (aspectRaf) cancelAnimationFrame(aspectRaf);
        rafId = 0; aspectRaf = 0;
        if (ro) ro.disconnect();
        if (mql) { if (mql.removeEventListener) mql.removeEventListener('change', onTheme); else if (mql.removeListener) mql.removeListener(onTheme); }
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
        listeners = [];
        root.innerHTML = '';
      }
    };
  }

  Labs.gradient = {
    id: 'gradient',
    module: 'l2-regression',
    title: 'Gradient descent',
    summary: 'Watch gradient descent walk downhill on a loss map to fit a straight line to Pune flat prices, and see how the learning rate, stochastic steps and outliers change the walk.',
    tasks: TASKS,
    mount: mount
  };
})();
