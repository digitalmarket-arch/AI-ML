/* AI Marg lab: the PyTorch training loop, step by step.
   A tiny neural network (1 input -> 8 tanh units -> 1 output, 25 weights) learns the seasonal shape of
   New Delhi's daily temperature, trained in plain JavaScript exactly the way PyTorch would do it:
   forward pass, MSE loss, backward (gradients ADDED into .grad), optimizer.step(), optimizer.zero_grad().
   Plain classic script (ES2019). Registers window.AILabs.trainloop. No libraries, no network, no storage. */
(function () {
  'use strict';
  var Labs = (window.AILabs = window.AILabs || {});
  var mountCount = 0;

  /* ---------- constants ---------- */
  var H = 8, NP = 3 * H + 1;              // 8 hidden units: W1 (8), b1 (8), W2 (8), b2 (1) = 25 weights
  var XC = 183, XS = 105;                 // day of year is scaled: x = (day − 183) ÷ 105
  var YC = 25, YS = 7;                    // temperature is scaled: y = (°C − 25) ÷ 7
  var N_DAYS = 96, N_VAL = 32;            // 64 training days + 32 validation days
  var NOISE = 1.6;                        // day-to-day weather noise, °C
  var DATA_SEED = 57, INIT_SEED = 7, SHUFFLE_SEED = 99, FINDER_SEED = 3, ONE_BATCH_SEED = 11;
  // New Delhi's average seasonal curve: a 3-harmonic fit to monthly mean temperatures
  var FOURIER = [25.14, -8.88, -0.54, -1.90, -1.51, -0.06, 0.48];
  var LR_MIN = 1e-4, LR_PER_DECADE = 20, LR_SLIDER_MAX = 100, LR_DEFAULT_POS = 40;  // 0.0001 … 10, default 0.01
  var EPOCH_CHOICES = [1, 2, 5, 10, 20, 50, 100, 200, 500], EPOCH_DEFAULT_IDX = 4;
  var FINDER_ITERS = 100, FINDER_LO = 1e-4, FINDER_HI = 10;
  var ZONE_LO_DIV = 6, ZONE_HI_DIV = 3;   // green zone: 6× to 3× smaller than the lr at the lowest loss
  var FAST_TARGET = 0.15, FAST_EPOCHS = 20, OVERFIT_TARGET = 0.002;
  var HIST_CAP = 4000, GHIST_CAP = 240, GHIST_SHOW = 60;
  var MONTH_START = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  var TASKS = [
    { id: 't1', text: 'Run one training step line by line: keep pressing Next line until you have run every line for one batch, from “for xb, yb in train_loader” down to optimizer.zero_grad().' },
    { id: 't2', text: 'Tick “Forget optimizer.zero_grad()” and keep training. Watch .grad pile up in the gradient chart until the training loss jumps to more than double its lowest value.' },
    { id: 't3', text: 'Run the LR finder, set the learning rate inside the green zone it marks, then press Reset and Run: reach a validation loss below 0.15 within 20 epochs (batch size 1 or 8). With the starting settings (SGD, lr 0.01) it takes about 70.' },
    { id: 't4', text: 'Turn on “Overfit one batch” and train until the training loss on those 8 days is below 0.002, almost zero. (Tip: Adam gets there much faster than SGD.)' }
  ];

  // the loop as shown; each "stop" of Next line runs one line (eval runs the last three together)
  var CODE = [
    { k: 'epoch', h: '<b style="color:var(--indigo)">for</b> epoch <b style="color:var(--indigo)">in</b> range(epochs):' },
    { k: 'batch', h: '    <b style="color:var(--indigo)">for</b> xb, yb <b style="color:var(--indigo)">in</b> train_loader:' },
    { k: 'forward', h: '        pred = model(xb)' },
    { k: 'loss', h: '        loss = loss_fn(pred, yb)' },
    { k: 'backward', h: '        loss.backward()' },
    { k: 'step', h: '        optimizer.step()' },
    { k: 'zero', h: '        optimizer.zero_grad()' },
    { k: 'eval', h: '    <b style="color:var(--indigo)">with</b> torch.no_grad():' },
    { k: 'eval', h: '        train_loss = loss_fn(model(xt), yt)' },
    { k: 'eval', h: '        val_loss = loss_fn(model(xv), yv)' }
  ];
  var CODE_PLAIN = {
    epoch: 'for epoch in range(epochs):', batch: 'for xb, yb in train_loader:', forward: 'pred = model(xb)',
    loss: 'loss = loss_fn(pred, yb)', backward: 'loss.backward()', step: 'optimizer.step()', zero: 'optimizer.zero_grad()',
    eval: 'with torch.no_grad():'
  };

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
  function finite(v) { return typeof v === 'number' && isFinite(v); }
  function shuffled(rnd, arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  // Indian digit grouping: 1234567 -> 12,34,567
  function fmtInt(n) {
    var s = String(Math.round(Math.abs(n)));
    if (s.length > 3) s = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3);
    return (n < 0 ? '−' : '') + s;
  }
  var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  function fmtSci(v) {
    var a = Math.abs(v), e = Math.floor(Math.log10(a)), m = v / Math.pow(10, e);
    if (Math.abs(m) >= 9.95) { m /= 10; e++; }
    return m.toFixed(1).replace('-', '−') + '×10' + String(e).split('').map(function (c) { return SUP[c] || c; }).join('');
  }
  // losses and gradient sizes: 3 significant figures, scientific only when tiny or huge
  function fmtNum(v) {
    if (typeof v !== 'number' || isNaN(v)) return '—';
    if (!isFinite(v)) return '∞';
    var a = Math.abs(v);
    if (a === 0) return '0';
    if (a >= 1e5 || a < 1e-4) return fmtSci(v);
    if (a >= 1000) return fmtInt(v);
    return String(+v.toPrecision(3)).replace('-', '−');
  }
  function fmtLr(v) { return String(+v.toPrecision(2)); }
  // labels for log-axis decades: plain numbers in the middle, 10ⁿ at the extremes
  function fmtDecade(v) {
    var e = Math.round(Math.log10(v));
    if (e >= 4 || e <= -5) return '10' + String(e).split('').map(function (c) { return SUP[c] || c; }).join('');
    return fmtNum(v);
  }
  function fmtC(v) { return finite(v) ? (Math.abs(v) < 9.95 ? v.toFixed(1) : Math.abs(v) < 1000 ? String(Math.round(v)) : fmtNum(v)) + ' °C' : 'huge'; }
  // a temperature reading or guess, in °C, with one decimal (scientific only when absurdly large)
  function fmtTemp(v) { return finite(v) ? (Math.abs(v) < 1000 ? v.toFixed(1).replace('-', '−') : fmtNum(v)) : 'a huge number'; }
  function typicalC(loss) { return YS * Math.sqrt(Math.max(0, loss)); }
  function lrFromPos(pos) { return +(LR_MIN * Math.pow(10, pos / LR_PER_DECADE)).toPrecision(2); }
  function posFromLr(lr) { return clamp(Math.round(Math.log10(lr / LR_MIN) * LR_PER_DECADE), 0, LR_SLIDER_MAX); }
  function dayLabel(d) {
    for (var m = 0; m < 12; m++) if (d < MONTH_START[m + 1]) return (d - MONTH_START[m] + 1) + ' ' + MONTHS[m];
    return d + '';
  }
  function niceStep(raw) {
    var p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p;
  }
  function plural(n, one, many) { return n === 1 ? one : many; }

  /* ---------- data: 96 days of New Delhi temperatures ---------- */
  function trueTemp(d) {
    var s = FOURIER[0];
    for (var h = 1; h <= 3; h++) { var a = 2 * Math.PI * h * d / 365; s += FOURIER[2 * h - 1] * Math.cos(a) + FOURIER[2 * h] * Math.sin(a); }
    return s;
  }
  function makeData() {
    var r = mulberry32(DATA_SEED), all = [], i;
    for (i = 0; i < N_DAYS; i++) {
      var d = Math.round(1 + (i + 0.5) * 364 / N_DAYS + (r() - 0.5) * 3);
      var t = Math.round((trueTemp(d) + gauss(r) * NOISE) * 10) / 10;
      all.push({ d: d, t: t, x: (d - XC) / XS, y: (t - YC) / YS, val: false });
    }
    var idx = [];
    for (i = 0; i < N_DAYS; i++) idx.push(i);
    idx = shuffled(r, idx);
    for (i = 0; i < N_VAL; i++) all[idx[i]].val = true;
    var train = all.filter(function (p) { return !p.val; }), val = all.filter(function (p) { return p.val; });
    var one = shuffled(mulberry32(ONE_BATCH_SEED), train).slice(0, 8);
    one.forEach(function (p) { p.one = true; });
    var floor = 0;
    val.forEach(function (p) { var e = (trueTemp(p.d) - YC) / YS - p.y; floor += e * e; });
    return { all: all, train: train, val: val, one: one, floor: floor / val.length };
  }

  /* ---------- the model: Linear(1, 8) -> Tanh -> Linear(8, 1) ---------- */
  // PyTorch's default nn.Linear start: weights and biases uniform in ±1/√(inputs to that layer)
  function initParams() {
    var r = mulberry32(INIT_SEED), p = new Float64Array(NP), j, b2 = 1 / Math.sqrt(H);
    for (j = 0; j < H; j++) p[j] = (r() * 2 - 1);            // W1
    for (j = 0; j < H; j++) p[H + j] = (r() * 2 - 1);        // b1
    for (j = 0; j < H; j++) p[2 * H + j] = (r() * 2 - 1) * b2;  // W2
    p[3 * H] = (r() * 2 - 1) * b2;                           // b2
    return p;
  }
  function predict(p, x) {
    var s = p[3 * H];
    for (var j = 0; j < H; j++) s += p[2 * H + j] * Math.tanh(p[j] * x + p[H + j]);
    return s;
  }
  function lossOn(p, pts) {
    var s = 0;
    for (var i = 0; i < pts.length; i++) { var e = predict(p, pts[i].x) - pts[i].y; s += e * e; }
    return pts.length ? s / pts.length : 0;
  }
  // backprop of MSE over one batch; ADDS the gradient into g, like loss.backward() adds into .grad
  var hbuf = new Float64Array(H);
  function backwardInto(p, batch, g) {
    var n = batch.length, L = 0;
    for (var i = 0; i < n; i++) {
      var x = batch[i].x, out = p[3 * H], j;
      for (j = 0; j < H; j++) { hbuf[j] = Math.tanh(p[j] * x + p[H + j]); out += p[2 * H + j] * hbuf[j]; }
      var e = out - batch[i].y, go = 2 * e / n;
      L += e * e;
      g[3 * H] += go;
      for (j = 0; j < H; j++) {
        g[2 * H + j] += go * hbuf[j];
        var dz = go * p[2 * H + j] * (1 - hbuf[j] * hbuf[j]);
        g[j] += dz * x;
        g[H + j] += dz;
      }
    }
    return L / n;
  }
  function norm(g) { var s = 0; for (var i = 0; i < g.length; i++) s += g[i] * g[i]; return Math.sqrt(s); }
  function allFinite(p) { for (var i = 0; i < p.length; i++) if (!isFinite(p[i])) return false; return true; }

  /* ---------- optimizers: torch.optim.SGD (no momentum) and torch.optim.Adam (defaults) ---------- */
  function makeOpt(kind) { return { kind: kind, t: 0, m: new Float64Array(NP), v: new Float64Array(NP) }; }
  function optStep(opt, p, g, lr) {
    var i;
    if (opt.kind === 'sgd') { for (i = 0; i < NP; i++) p[i] -= lr * g[i]; return; }
    var b1 = 0.9, b2 = 0.999, eps = 1e-8;
    opt.t++;
    var c1 = 1 - Math.pow(b1, opt.t), c2 = 1 - Math.pow(b2, opt.t);   // bias correction
    for (i = 0; i < NP; i++) {
      opt.m[i] = b1 * opt.m[i] + (1 - b1) * g[i];
      opt.v[i] = b2 * opt.v[i] + (1 - b2) * g[i] * g[i];
      p[i] -= lr * (opt.m[i] / c1) / (Math.sqrt(opt.v[i] / c2) + eps);
    }
  }

  /* ---------- theme ---------- */
  var THEME_NAMES = ['bg', 'surface', 'surface-2', 'ink', 'muted', 'line', 'indigo', 'indigo-soft', 'haldi', 'haldi-soft', 'sindoor', 'ok', 'bad', 'series-1', 'series-2', 'series-3', 'series-4'];
  function readTheme() {
    var cs = getComputedStyle(document.documentElement), T = {};
    THEME_NAMES.forEach(function (n) { T[n.replace('-', '')] = cs.getPropertyValue('--' + n).trim() || '#888'; });
    T.font = cs.getPropertyValue('--font-body').trim() || 'system-ui, sans-serif';
    // tints need more strength on a dark surface to read the same
    var m = /^#([0-9a-f]{6})$/i.exec(T.surface), lum = 1;
    if (m) { var n = parseInt(m[1], 16); lum = (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255; }
    T.dark = lum < 0.4;
    return T;
  }

  /* ---------- mount ---------- */
  function mount(root, ctx) {
    var P = 'tl' + (++mountCount) + '-';
    var listeners = [];
    function on(el, type, fn, opts) { el.addEventListener(type, fn, opts); listeners.push([el, type, fn, opts]); }
    var destroyed = false;
    var D = makeData();

    var tasksHtml = TASKS.map(function (t) { return '<li data-task="' + t.id + '">' + t.text + '</li>'; }).join('');
    var codeHtml = CODE.map(function (c, i) {
      return '<span data-line="' + i + '" style="display:block;padding:0 10px;white-space:pre">' + c.h + '</span>';
    }).join('');
    function stat(id, k) { return '<div class="stat"><div class="k">' + k + '</div><div class="v" id="' + P + id + '">—</div></div>'; }
    function mark(svg) { return '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style="vertical-align:-1px;margin-right:5px">' + svg + '</svg>'; }
    var legDot = function (c) { return mark('<circle cx="6" cy="6" r="4.5" fill="var(' + c + ')"/>'); };
    var legRing = function (c) { return mark('<circle cx="6" cy="6" r="4" fill="none" stroke="var(' + c + ')" stroke-width="2"/>'); };
    var legLine = function (c, dash) { return mark('<line x1="0" y1="6" x2="12" y2="6" stroke="var(' + c + ')" stroke-width="2.5"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>'); };
    var legBar = function (c) { return mark('<rect x="2" y="1" width="8" height="10" fill="var(' + c + ')"/>'); };

    var top = document.createElement('div');
    top.className = 'lab';
    top.innerHTML =
      '<p class="lab-note"><strong>What you are seeing:</strong> 96 days of daily temperatures in New Delhi (made-up readings that follow the city’s real seasons: cool January, scorching May and June, a dip when the monsoon arrives). ' +
        'Filled dots are the 64 <em>training</em> days the model learns from; hollow rings are 32 <em>validation</em> days it never learns from, used only to check it. ' +
        'The blue curve is a tiny neural network (1 input, 8 hidden units, 1 output: 25 adjustable numbers called <em>weights</em>) guessing the temperature for every day of the year. Each hidden unit passes its input through <em>tanh</em>, a smooth S-shaped curve, so together they can bend the line into a seasonal shape. ' +
        'Next to it is the PyTorch <em>training loop</em> that teaches it. Press <b>Next line</b> to run the loop one line at a time and see what each line does, or <b>Run</b> to train for many <em>epochs</em> (full passes over the training days).</p>' +
      '<p class="small muted">As in real code, the numbers are scaled to sit near 0 before training: x = (day − 183) ÷ 105 and y = (°C − 25) ÷ 7. So the losses below are on that scale: a loss of 0.05 means a typical error of about 7 × √0.05 ≈ 1.6 °C.</p>' +
      '<div class="lab-body">' +
        '<div class="stack">' +
          '<div style="display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start">' +
            '<div class="stack-sm" style="flex:1 1 380px;min-width:0">' +
              '<span class="eyebrow">Delhi temperature and the model’s guess</span>' +
              '<div class="lab-canvas-wrap" id="' + P + 'fitwrap"><canvas id="' + P + 'fit" role="img" style="touch-action:auto" aria-label="Temperature chart"></canvas></div>' +
              '<div class="lab-legend">' +
                '<span style="--c:var(--series-4)">Training day</span>' +
                '<i style="font-style:normal">' + legRing('--series-2') + 'Validation day</i>' +
                '<i style="font-style:normal">' + legLine('--indigo') + 'Model (pred)</i>' +
                '<i style="font-style:normal">' + legRing('--ink') + 'Current batch (xb)</i>' +
              '</div>' +
            '</div>' +
            '<div class="stack-sm" style="flex:1 1 340px;min-width:0">' +
              '<span class="eyebrow">The training loop in PyTorch</span>' +
              '<pre id="' + P + 'code" tabindex="0" role="region" aria-label="PyTorch training loop code. The line that just ran is highlighted." style="font-size:.78rem;padding:10px 0;line-height:1.6"><span style="display:inline-block;min-width:100%">' + codeHtml + '</span></pre>' +
              '<div style="display:flex;flex-wrap:wrap;gap:8px">' +
                '<button type="button" class="btn btn-primary" id="' + P + 'next" style="flex:1 1 auto">Next line</button>' +
                '<button type="button" class="btn" id="' + P + 'run" style="flex:1 1 auto;white-space:nowrap">Run 20 epochs</button>' +
                '<button type="button" class="btn" id="' + P + 'reset" style="flex:1 1 auto">Reset</button>' +
              '</div>' +
              '<p class="small muted num" id="' + P + 'prog" style="min-height:1.6em"></p>' +
              '<div class="callout callout-indigo small" id="' + P + 'msg" role="status" aria-live="polite" style="min-height:8.5em"></div>' +
            '</div>' +
          '</div>' +
          '<div class="lab-stats">' +
            stat('st-ep', 'Epochs done') + stat('st-steps', 'Steps') + stat('st-bl', 'Batch loss') +
            stat('st-tr', 'Train loss') + stat('st-va', 'Val loss') + stat('st-gn', '.grad size') +
          '</div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start">' +
            '<div class="stack-sm" style="flex:1 1 300px;min-width:0">' +
              '<div class="row-between"><span class="eyebrow" id="' + P + 'ctitle">Loss after each epoch</span>' +
                '<div class="seg" role="group" aria-label="Chart to show">' +
                  '<button type="button" data-view="loss" aria-pressed="true">Loss curves</button>' +
                  '<button type="button" data-view="finder" aria-pressed="false">LR finder</button>' +
                '</div></div>' +
              '<div class="lab-canvas-wrap" id="' + P + 'chartwrap" style="aspect-ratio:16/11"><canvas id="' + P + 'chart" role="img" style="touch-action:manipulation" aria-label="Loss chart"></canvas></div>' +
              '<div class="lab-legend" id="' + P + 'cleg"></div>' +
              '<p class="small muted" id="' + P + 'chelp"></p>' +
            '</div>' +
            '<div class="stack-sm" style="flex:1 1 300px;min-width:0">' +
              '<span class="eyebrow">Gradients: what .grad holds</span>' +
              '<div class="lab-canvas-wrap" id="' + P + 'gradwrap" style="aspect-ratio:16/11"><canvas id="' + P + 'grad" role="img" style="touch-action:auto" aria-label="Gradient chart"></canvas></div>' +
              '<div class="lab-legend">' +
                '<i style="font-style:normal">' + legBar('--indigo') + '.grad used by optimizer.step()</i>' +
                '<i style="font-style:normal">' + legDot('--ink') + 'That batch’s own gradient</i>' +
              '</div>' +
              '<p class="small muted">The <em>gradient</em> says, for each weight, which way and how strongly it pushes the loss up. Its size is the <em>norm</em>: √(sum of all 25 values squared). W1 and b1 are the first layer’s 8 weights and 8 <em>biases</em> (the biases are the starting offsets, also learned); W2 and b2 belong to the output layer.</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="lab-controls">' +
          '<h2 class="lab-h">Settings</h2>' +
          '<div class="control"><span class="control-label" id="' + P + 'optlbl">Optimizer</span>' +
            '<div class="seg" role="group" aria-labelledby="' + P + 'optlbl">' +
              '<button type="button" data-opt="sgd" aria-pressed="true">SGD</button>' +
              '<button type="button" data-opt="adam" aria-pressed="false">Adam</button>' +
            '</div>' +
            '<p class="small muted" id="' + P + 'opthelp"></p></div>' +
          '<div class="control"><label for="' + P + 'lr">Learning rate (lr) <output id="' + P + 'lrout" for="' + P + 'lr">0.01</output></label>' +
            '<input type="range" id="' + P + 'lr" min="0" max="' + LR_SLIDER_MAX + '" step="1" value="' + LR_DEFAULT_POS + '" aria-describedby="' + P + 'lrhelp">' +
            '<p class="small muted" id="' + P + 'lrhelp">How big each step is. Log scale from 0.0001 to 10: each notch is about 12% bigger, and every 20 notches is 10× bigger.</p></div>' +
          '<div class="control"><span class="control-label" id="' + P + 'bslbl">Batch size</span>' +
            '<div class="seg" role="group" aria-labelledby="' + P + 'bslbl">' +
              '<button type="button" data-bs="1" aria-pressed="false">1</button>' +
              '<button type="button" data-bs="8" aria-pressed="true">8</button>' +
              '<button type="button" data-bs="64" aria-pressed="false">All 64</button>' +
            '</div>' +
            '<p class="small muted" id="' + P + 'bshelp"></p></div>' +
          '<div class="control"><label for="' + P + 'epochs">Epochs per Run <output id="' + P + 'epout" for="' + P + 'epochs">20</output></label>' +
            '<input type="range" id="' + P + 'epochs" min="0" max="' + (EPOCH_CHOICES.length - 1) + '" step="1" value="' + EPOCH_DEFAULT_IDX + '" aria-valuetext="20 epochs"></div>' +
          '<div class="small" style="display:grid;grid-template-columns:20px minmax(0,1fr);gap:8px;align-items:start"><input type="checkbox" id="' + P + 'forget" style="margin:3px 0 0">' +
            '<label for="' + P + 'forget"><b>Forget <code>optimizer.zero_grad()</code></b>: a classic bug. PyTorch <em>adds</em> each new gradient onto .grad, so without this line old gradients pile up and every step reuses all of them.</label></div>' +
          '<div class="small" style="display:grid;grid-template-columns:20px minmax(0,1fr);gap:8px;align-items:start"><input type="checkbox" id="' + P + 'overfit" style="margin:3px 0 0">' +
            '<label for="' + P + 'overfit"><b>Overfit one batch</b>: a debugging check. Train a fresh model on just 8 days, over and over. A healthy model and loop can push that loss to almost zero; if yours cannot, something is broken.</label></div>' +
          '<div class="control"><button type="button" class="btn" id="' + P + 'find">Run LR finder</button>' +
            '<p class="small muted">The <em>LR finder</em> trains a copy of the model for up to 100 mini-batches while raising the learning rate from 0.0001 to 10, and plots the loss for each one (it stops early once the loss shoots up). Your own model is not changed. Tap or click its chart to pick a learning rate.</p></div>' +
          '<div class="small" style="display:grid;grid-template-columns:20px minmax(0,1fr);gap:8px;align-items:start"><input type="checkbox" id="' + P + 'true" style="margin:3px 0 0">' +
            '<label for="' + P + 'true">Show the true seasonal pattern (dashed grey): the smooth curve the readings were made from.</label></div>' +
          '<div class="stack-sm"><h2 class="lab-h">Your tasks</h2><ul class="lab-tasks" id="' + P + 'tasks">' + tasksHtml + '</ul></div>' +
        '</div>' +
      '</div>' +
      '<p class="small muted"><strong style="color:var(--ink)">Why it matters in real ML:</strong> every PyTorch project, from this 25-weight toy to models with billions of weights, runs this same five-line loop. Forgetting <code>zero_grad()</code> is one of the most common beginner bugs, and an LR finder plus “overfit one batch” are the first two checks experienced engineers run when a model refuses to learn.</p>';
    root.appendChild(top);

    function $(id) { return top.querySelector('#' + P + id); }
    var fitWrap = $('fitwrap'), fitC = $('fit'), chartWrap = $('chartwrap'), chartC = $('chart'), gradWrap = $('gradwrap'), gradC = $('grad');
    var fg = fitC.getContext('2d'), cg = chartC.getContext('2d'), gg = gradC.getContext('2d');
    var elMsg = $('msg'), elProg = $('prog');
    var btnNext = $('next'), btnRun = $('run'), btnReset = $('reset'), btnFind = $('find');
    var elLr = $('lr'), elLrOut = $('lrout'), elEp = $('epochs'), elEpOut = $('epout');
    var elForget = $('forget'), elOverfit = $('overfit'), elTrue = $('true');
    var elOptHelp = $('opthelp'), elBsHelp = $('bshelp'), elCTitle = $('ctitle'), elCLeg = $('cleg'), elCHelp = $('chelp');
    var statEls = { ep: $('st-ep'), steps: $('st-steps'), bl: $('st-bl'), tr: $('st-tr'), va: $('st-va'), gn: $('st-gn') };
    var optBtns = top.querySelectorAll('[data-opt]'), bsBtns = top.querySelectorAll('[data-bs]'), viewBtns = top.querySelectorAll('[data-view]');
    var lineEls = top.querySelectorAll('[data-line]');
    var taskEls = {};
    Array.prototype.forEach.call(top.querySelectorAll('[data-task]'), function (li) { taskEls[li.getAttribute('data-task')] = li; });

    /* ---------- state ---------- */
    var S = {
      optKind: 'sgd', lr: lrFromPos(LR_DEFAULT_POS), bs: 8, epochIdx: EPOCH_DEFAULT_IDX,
      forget: false, overfit: false, showTrue: false, view: 'loss',
      running: false, runLeft: 0, runEpochs: 0, runSteps: 0, runStartEpoch: 0, runNotes: [], stepAcc: 0, stepsPerSec: 0
    };
    var fresh = new Float64Array(NP);
    var finder = null;           // the LR finder sweep while it runs
    var zone = null;             // the last finder result that found a green zone
    var lastFinder = null;       // the last finder result, with or without a zone
    var done = {};
    var rafId = 0, needDraw = true, started = false;
    var dims = { dpr: 1, fit: [1, 1], chart: [1, 1], grad: [1, 1] };
    var hoverLr = null, tap = null;

    function trainSet() { return S.overfit ? D.one : D.train; }
    function bsNow() { return S.overfit ? 8 : S.bs; }
    function batchesPerEpoch() { return S.overfit ? 1 : Math.ceil(D.train.length / S.bs); }
    function cfgKey() { return S.optKind + '|' + bsNow() + '|' + (S.overfit ? 'one' : 'all'); }
    function cfgText(c) {
      var a = c.split('|');
      return (a[0] === 'sgd' ? 'SGD' : 'Adam') + (a[2] === 'one' ? ' in overfit-one-batch mode' : ' with batch size ' + a[1]);
    }
    function makeBatches(rnd) {
      if (S.overfit) return [D.one.slice()];
      var order = shuffled(rnd, D.train), out = [], bs = S.bs;
      for (var s = 0; s < order.length; s += bs) out.push(order.slice(s, s + bs));
      return out;
    }

    function resetModel() {
      S.p = initParams();
      S.ghost = null;
      S.grad = new Float64Array(NP);
      S.opt = makeOpt(S.optKind);
      S.rng = mulberry32(SHUFFLE_SEED);
      S.pc = 'start';            // the stop that ran last ('start' = nothing yet, next is the epoch line)
      S.inEpoch = false; S.epochBatches = []; S.bi = -1; S.xb = null; S.pred = null;
      S.batchLoss = null; S.batchLossAfter = null;
      S.epochsDone = 0; S.steps = 0; S.backwards = 0;
      S.gradNorm = 0; S.gradBefore = 0; S.freshNorm = 0;
      S.trLoss = lossOn(S.p, trainSet()); S.vaLoss = lossOn(S.p, D.val);
      S.hist = [{ e: 0, tr: S.trLoss, va: S.vaLoss }];
      S.gHist = [];
      S.blown = false;
      S.manual = null;
      S.sr = { cfg: cfgKey(), lrLo: Infinity, lrHi: 0, forget: S.forget };
      S.forgetMin = S.trLoss; S.forgetSteps = 0;
    }

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
    function completeTask(id) {
      if (done[id]) return false;
      done[id] = true;
      markLi(id);
      if (ctx && ctx.onTaskDone) ctx.onTaskDone(id);
      return true;
    }

    /* ---------- messages ---------- */
    function say(html, tone) {
      elMsg.innerHTML = html;
      elMsg.className = 'callout small' + (tone ? '' : ' callout-indigo');
      elMsg.style.borderLeftColor = tone === 'warn' ? 'var(--bad)' : tone === 'good' ? 'var(--ok)' : '';
      elMsg.style.background = tone === 'warn' ? 'var(--bad-soft, var(--surface-2))' : tone === 'good' ? 'var(--ok-soft, var(--surface-2))' : '';
    }
    function codeTag(s) { return '<code>' + s + '</code>'; }

    /* ---------- the loop, one stop at a time ---------- */
    function nextStop() {
      switch (S.pc) {
        case 'start': return 'epoch';
        case 'epoch': return 'batch';
        case 'batch': return 'forward';
        case 'forward': return 'loss';
        case 'loss': return 'backward';
        case 'backward': return 'step';
        case 'step': return S.forget ? (S.bi < S.epochBatches.length - 1 ? 'batch' : 'eval') : 'zero';
        case 'zero': return S.bi < S.epochBatches.length - 1 ? 'batch' : 'eval';
        default: return 'epoch';   // after 'eval'
      }
    }

    // runs one stop; returns an object with what happened (for messages)
    function execStop(name, manual) {
      var info = { name: name };
      if (manual) {
        if (name === 'batch') S.manual = ['batch'];
        else if (S.manual && name !== 'epoch' && name !== 'eval') S.manual.push(name);
        else S.manual = null;
      } else S.manual = null;

      if (name === 'epoch') {
        S.epochBatches = makeBatches(S.rng);
        S.bi = -1; S.inEpoch = true; S.xb = null; S.pred = null; S.ghost = null;
      } else if (name === 'batch') {
        S.bi++;
        S.xb = S.epochBatches[S.bi];
        S.pred = null; S.batchLoss = null; S.batchLossAfter = null; S.ghost = null;
      } else if (name === 'forward') {
        S.pred = S.xb.map(function (pt) { return predict(S.p, pt.x); });
      } else if (name === 'loss') {
        var s = 0;
        for (var i = 0; i < S.xb.length; i++) { var e = S.pred[i] - S.xb[i].y; s += e * e; }
        S.batchLoss = s / S.xb.length;
      } else if (name === 'backward') {
        fresh.fill(0);
        backwardInto(S.p, S.xb, fresh);
        S.gradBefore = norm(S.grad);
        for (var k = 0; k < NP; k++) S.grad[k] += fresh[k];
        S.freshNorm = norm(fresh);
        S.gradNorm = norm(S.grad);
        S.backwards++;
      } else if (name === 'step') {
        S.ghost = Float64Array.from(S.p);
        optStep(S.opt, S.p, S.grad, S.lr);
        S.steps++;
        S.gHist.push({ acc: S.gradNorm, fresh: S.freshNorm, n: S.backwards });
        if (S.gHist.length > GHIST_CAP) S.gHist.splice(0, S.gHist.length - GHIST_CAP);
        if (S.lr < S.sr.lrLo) S.sr.lrLo = S.lr;
        if (S.lr > S.sr.lrHi) S.sr.lrHi = S.lr;
        if (S.forget) S.sr.forget = true;
        S.batchLossAfter = allFinite(S.p) ? lossOn(S.p, S.xb) : Infinity;
        if (!allFinite(S.p)) { S.blown = true; info.blown = true; }
        if (S.forget) checkForgetJump(info);
      } else if (name === 'zero') {
        S.grad.fill(0);
        S.gradNorm = 0; S.backwards = 0;
        if (manual && S.manual && S.manual.join() === 'batch,forward,loss,backward,step,zero') {
          if (completeTask('t1')) info.t1 = true;
          S.manual = null;
        }
      } else if (name === 'eval') {
        S.trLoss = lossOn(S.p, trainSet());
        S.vaLoss = lossOn(S.p, D.val);
        S.epochsDone++;
        S.inEpoch = false; S.xb = null; S.pred = null; S.ghost = null;
        S.hist.push({ e: S.epochsDone, tr: S.trLoss, va: S.vaLoss });
        if (S.hist.length > HIST_CAP) S.hist = S.hist.filter(function (h, j, a) { return j % 2 === 0 || j === a.length - 1; });
        if (!finite(S.trLoss) || !finite(S.vaLoss)) { S.blown = true; info.blown = true; }
        checkEpochTasks(info);
      }
      S.pc = name;
      return info;
    }

    function checkForgetJump(info) {
      S.forgetSteps++;
      var L = S.blown ? Infinity : lossOn(S.p, trainSet());
      if (finite(L) && L < S.forgetMin) S.forgetMin = L;
      // only once .grad really holds more than one batch's gradient, so the pile-up is the cause
      var jump = S.forgetSteps >= 2 && S.backwards >= 2 && (!finite(L) || L > Math.max(2 * S.forgetMin, S.forgetMin + 0.05));
      if (jump && completeTask('t2')) {
        info.t2 = { L: L, min: S.forgetMin };
      }
    }
    function checkEpochTasks(info) {
      if (S.overfit && finite(S.trLoss) && S.trLoss < OVERFIT_TARGET && completeTask('t4')) info.t4 = true;
      if (!S.overfit && zone && zone.cfg === cfgKey() && S.sr.cfg === cfgKey() && !S.sr.forget &&
          S.sr.lrLo >= zone.lo * 0.999 && S.sr.lrHi <= zone.hi * 1.001 && S.epochsDone <= FAST_EPOCHS &&
          finite(S.vaLoss) && S.vaLoss < FAST_TARGET && completeTask('t3')) info.t3 = true;
    }

    /* ---------- explanations for Next line ---------- */
    function explain(info) {
      var n = info.name, h = '', bs = bsNow(), nb = S.epochBatches.length || batchesPerEpoch();
      if (n === 'epoch') {
        h = '<b>Epoch ' + fmtInt(S.epochsDone + 1) + ' starts.</b> One epoch is one full pass over the training data. ';
        if (S.overfit) h += 'In overfit-one-batch mode the loader hands out the same 8 days every epoch, so each epoch is a single step.';
        else if (bs >= D.train.length) h += 'With batch size “All 64”, the whole training set is one batch, so this epoch has just one step.';
        else h += 'The DataLoader (the helper that serves the data) has shuffled the 64 training days and dealt them into ' + nb + ' ' + plural(nb, 'batch', 'batches') + ' of ' + bs + (D.train.length % bs ? ' (the last one smaller)' : '') + '.';
      } else if (n === 'batch') {
        var days = S.xb.slice(0, 4).map(function (p) { return dayLabel(p.d); }).join(', ') + (S.xb.length > 4 ? ' …' : '');
        h = '<b>Batch ' + (S.bi + 1) + ' of ' + nb + '.</b> ' + codeTag('xb') + ' now holds ' + (S.xb.length === 1 ? '1 day' : S.xb.length + ' days') + ' (' + days + ') and ' + codeTag('yb') + ' their real temperatures. They are circled on the chart.';
      } else if (n === 'forward') {
        var i0 = 0, p0 = S.xb[i0];
        h = '<b>Forward pass:</b> ' + codeTag('pred = model(xb)') + ' makes the network guess a temperature for ' + (S.xb.length === 1 ? 'the day' : 'each day') + ' in the batch. ' +
          'For ' + dayLabel(p0.d) + ' it guesses ' + fmtTemp(YC + YS * S.pred[i0]) + ' °C; the real reading was ' + fmtTemp(p0.t) + ' °C. The grey lines on the chart are the gaps. Nothing is learned yet: this line only makes guesses.';
      } else if (n === 'loss') {
        h = '<b>Loss = ' + fmtNum(S.batchLoss) + '.</b> The loss function, ' + codeTag('nn.MSELoss()') + ' (mean squared error), squares each gap and takes the average, on the scaled numbers. ' +
          'That is a typical gap of about ' + fmtC(typicalC(S.batchLoss)) + ' on this batch. One number that says how wrong the model is.';
      } else if (n === 'backward') {
        h = '<b>Backward pass:</b> ' + codeTag('loss.backward()') + ' works out the <em>gradient</em>: for each of the 25 weights, which way and how strongly it pushes this loss up. PyTorch <em>adds</em> it into each weight’s ' + codeTag('.grad') + '. ';
        if (S.gradBefore > 0) h += '.grad size went from ' + fmtNum(S.gradBefore) + ' to ' + fmtNum(S.gradNorm) + ': the old gradients were never cleared, so this batch’s gradient (size ' + fmtNum(S.freshNorm) + ') was piled on top.';
        else h += '.grad size went from 0 to ' + fmtNum(S.gradNorm) + '.';
      } else if (n === 'step') {
        if (S.optKind === 'sgd') h = '<b>Update:</b> ' + codeTag('optimizer.step()') + ' nudges every weight against its gradient: weight −= lr × .grad, with lr = ' + fmtLr(S.lr) + '. ';
        else h = '<b>Update:</b> ' + codeTag('optimizer.step()') + ' with Adam moves each weight using running averages of its recent gradients (with a correction for the first few steps), so each weight moves by roughly lr = ' + fmtLr(S.lr) + ' or less, however big or small its gradient is. ';
        var moved = 0;
        if (S.ghost) for (var dd = 1; dd <= 365; dd += 8) { var xx = (dd - XC) / XS; moved = Math.max(moved, Math.abs(predict(S.p, xx) - predict(S.ghost, xx)) * YS); }
        h += (moved < 0.3 ? 'The curve barely moved (at most ' + moved.toFixed(2) + ' °C anywhere): small steps. ' : 'The dashed curve shows the model before this step; it moved by up to ' + fmtC(moved) + '. ') +
          'Loss on this batch: ' + fmtNum(S.batchLoss) + ' → ' + fmtNum(S.batchLossAfter) + '.';
        if (S.forget && S.backwards >= 2) h += ' <b>But</b> zero_grad() is switched off, so .grad held ' + S.backwards + ' batches’ gradients added together (size ' + fmtNum(S.gradNorm) + ', against ' + fmtNum(S.freshNorm) + ' for this batch alone), and it carries all of that into the next batch.';
        else if (S.forget) h += ' <b>But</b> zero_grad() is switched off, so this .grad stays, and the next batch’s gradient will be added on top of it.';
      } else if (n === 'zero') {
        h = codeTag('optimizer.zero_grad()') + ' resets every .grad back to 0, ready for the next batch. Without this line, each new gradient would pile on top of all the old ones.';
      } else if (n === 'eval') {
        h = '<b>Epoch ' + fmtInt(S.epochsDone) + ' done.</b> ' + codeTag('with torch.no_grad()') + ' tells PyTorch not to track gradients: here we only measure, we do not learn. ' +
          'Train loss ' + fmtNum(S.trLoss) + ', validation loss ' + fmtNum(S.vaLoss) + ' (on unseen days the typical error is about ' + fmtC(typicalC(S.vaLoss)) + '). One new point on each loss curve.';
      }
      return h;
    }
    function nextHint() {
      if (S.blown) return '';
      var nx = nextStop();
      return '<br><span class="muted">Next line: ' + codeTag(CODE_PLAIN[nx]) + (nx === 'eval' ? ' and the two loss lines under it' : '') + (S.forget && S.pc === 'step' ? ' (zero_grad() is skipped)' : '') + '</span>';
    }
    function pileWhy() {
      return S.optKind === 'sgd' ? 'so the steps grew too big and overshot'
        : 'so every step kept following old, out-of-date gradients and overshot (Adam keeps each step about lr in size, but its direction was stale)';
    }
    function taskNotes(info) {
      var out = [];
      if (info.t1) out.push('<b>Task done:</b> you ran one full training step by hand. Those five lines are all PyTorch training really is; the rest is repetition.');
      if (info.t2) out.push(finite(info.t2.L)
        ? '<b>The loss jumped</b> to ' + fmtNum(info.t2.L) + ', more than double its lowest value since you forgot zero_grad() (' + fmtNum(info.t2.min) + '). Old gradients kept piling into .grad, ' + pileWhy() + '. <b>Task done.</b>'
        : '<b>The loss blew up</b> to infinity: old gradients kept piling into .grad, ' + pileWhy() + '. <b>Task done.</b>');
      if (info.t3) out.push('<b>Task done:</b> validation loss ' + fmtNum(S.vaLoss) + ' after only ' + S.epochsDone + ' ' + plural(S.epochsDone, 'epoch', 'epochs') + ' with lr = ' + fmtLr(S.lr) + ' from the LR finder’s green zone' + (S.optKind === 'sgd' && S.bs === 8 ? '; the starting lr of 0.01 needs about 70 epochs to get there.' : '.'));
      if (info.t4) out.push('<b>Task done:</b> at epoch ' + fmtInt(S.epochsDone) + ' the training loss on the 8 days reached ' + fmtNum(S.trLoss) + ', almost zero: the model and loop work. But look at the validation loss, ' + fmtNum(S.vaLoss) + ': the model memorised 8 days instead of learning the seasons. That is overfitting, which is exactly what this check is meant to produce.');
      return out;
    }
    function blownMsg(notes) {
      say('<b>It blew up.</b> The weights grew so big that the computer could no longer store them (they became NaN, “not a number”). ' +
        (S.forget && S.backwards >= 2 ? 'Old gradients piling up in .grad ' + (S.optKind === 'sgd' ? 'made every step bigger than the last. ' : 'kept pushing the weights the same way, further and further. ') : 'The learning rate is too high: every step overshot and landed further away. ') +
        'Lower the learning rate' + (S.forget ? ' or untick “Forget optimizer.zero_grad()”' : '') + ', then press <b>Reset</b>.' +
        (notes && notes.length ? '<br>' + notes.join('<br>') : ''), 'warn');
    }

    /* ---------- actions ---------- */
    function onNext() {
      stopFinder(false);
      if (S.running) setRunning(false);
      if (S.blown) { blownMsg(); return; }
      var info = execStop(nextStop(), true);
      var notes = taskNotes(info);
      if (info.blown) { blownMsg(notes); afterChange(); return; }
      say(explain(info) + (notes.length ? '<br>' + notes.join('<br>') : '') + nextHint(), notes.length ? 'good' : '');
      afterChange();
    }
    function runEpochs() { return EPOCH_CHOICES[S.epochIdx]; }
    function setRunning(v) {
      if (v === S.running) return;
      S.running = v;
      if (v) {
        S.runLeft = runEpochs(); S.runEpochs = S.runLeft; S.runStartEpoch = S.epochsDone; S.runSteps = 0; S.runNotes = [];
        S.runStartVa = S.vaLoss;
        var dur = clamp(S.runLeft * 0.12, 0.6, 3);
        S.stepsPerSec = Math.max(1, S.runLeft * batchesPerEpoch() / dur);
        S.stepAcc = 1;
        S.ghost = null;
      }
      syncRunLabel();
      renderCode();
      requestDraw();
    }
    function syncRunLabel() {
      btnRun.textContent = S.running ? 'Pause' : 'Run ' + fmtInt(runEpochs()) + ' ' + plural(runEpochs(), 'epoch', 'epochs');
    }
    function onRun() {
      stopFinder(false);
      if (S.running) { setRunning(false); runSummary(true); afterChange(); return; }
      if (S.blown) { blownMsg(); return; }
      setRunning(true);
      say('Training: running the loop for ' + fmtInt(S.runEpochs) + ' ' + plural(S.runEpochs, 'epoch', 'epochs') + ' (' + fmtInt(S.runEpochs * batchesPerEpoch()) + ' steps)… Press <b>Pause</b> to stop.');
    }
    // a place where a frame may end: between whole training steps
    function atBoundary() { return S.pc === 'zero' || S.pc === 'eval' || S.pc === 'start' || (S.pc === 'step' && S.forget); }
    // run as many stops as this frame's time budget allows; whole optimizer steps are the unit of speed
    function runFrame(dt) {
      S.stepAcc += dt * S.stepsPerSec;
      var budget = Math.min(Math.floor(S.stepAcc), 4000), stepsDone = 0, guard = 0;
      S.stepAcc -= budget;
      while (S.running && guard++ < 60000) {
        if (stepsDone >= budget && atBoundary()) break;
        var name = nextStop(), info = execStop(name, false);
        if (name === 'step') { stepsDone++; S.runSteps++; }
        var notes = taskNotes(info);
        if (notes.length) S.runNotes = S.runNotes.concat(notes);
        if (info.blown) { setRunning(false); blownMsg(notes); return; }
        if (info.t2) { setRunning(false); say(notes.join('<br>') + ' Training paused so you can see it: look at the gradient chart.', 'good'); return; }
        if (notes.length) say(notes.join('<br>'), 'good');
        if (name === 'eval') {
          S.runLeft--;
          if (S.runLeft <= 0) { setRunning(false); runSummary(false); return; }
        }
      }
    }
    function runSummary(paused) {
      var ran = S.epochsDone - S.runStartEpoch, h;
      if (paused) h = 'Paused in epoch ' + fmtInt(S.epochsDone + (S.inEpoch ? 1 : 0)) + ' after ' + fmtInt(S.runSteps) + ' ' + plural(S.runSteps, 'step', 'steps') + '. Press <b>Run</b> to continue or <b>Next line</b> to go line by line.';
      else {
        h = 'Ran ' + fmtInt(ran) + ' ' + plural(ran, 'epoch', 'epochs') + ' (' + fmtInt(S.runSteps) + ' steps). Now train loss ' + fmtNum(S.trLoss) + ', validation loss ' + fmtNum(S.vaLoss) +
          ' (typical error on unseen days about ' + fmtC(typicalC(S.vaLoss)) + ').';
        var drop = S.runStartVa - S.vaLoss;
        if (S.overfit) {
          if (S.trLoss >= OVERFIT_TARGET) h += ' Each epoch here is just one step on the same 8 days, so try Epochs per Run = 500' + (S.optKind === 'sgd' ? ', and switch to Adam: plain SGD tends to get stuck on this.' : '.');
        } else if (S.forget) {
          h += ' zero_grad() is still switched off: in the gradient chart, watch the bars (the piled-up .grad) stand above the dots (each batch’s own gradient).';
          if (!done.t2 && S.forgetSteps > 15 * batchesPerEpoch()) h += ' Nothing dramatic yet? A bigger learning rate (try 0.05) makes the pile-up bite sooner.';
        } else if (finite(drop) && drop < 0.02 * S.runStartVa && S.vaLoss > 0.2) {
          h += ' That was slow. A bigger learning rate might help: the <b>LR finder</b> can suggest one.';
        } else if (S.vaLoss > S.trLoss * 1.5 && S.vaLoss > 0.12) {
          h += ' The validation loss is well above the training loss: the model fits the training days better than unseen ones.';
        }
        if (zone && zone.cfg === cfgKey() && !done.t3 && S.lr >= zone.lo * 0.999 && S.lr <= zone.hi * 1.001 && !S.overfit &&
            (S.sr.lrLo < zone.lo * 0.999 || S.sr.lrHi > zone.hi * 1.001 || S.sr.cfg !== cfgKey() || S.sr.forget)) {
          h += ' To count for the task, press <b>Reset</b> first, so the whole run uses the green-zone learning rate.';
        }
      }
      if (S.runNotes.length) h += '<br>' + S.runNotes.join('<br>');
      say(h, S.runNotes.length ? 'good' : '');
    }
    function onReset() {
      stopFinder(false);
      setRunning(false);
      resetModel();
      say('Reset: the same random starting weights as before (as if you had fixed the random seed), a fresh ' + (S.optKind === 'sgd' ? 'SGD' : 'Adam') + ' optimizer, .grad cleared and the loss curves wiped. Press <b>Next line</b> or <b>Run</b>.');
      afterChange();
    }

    /* ---------- LR finder ---------- */
    function startFinder() {
      if (S.running) setRunning(false);
      var L0 = lossOn(S.p, trainSet());
      if (S.blown || !allFinite(S.p) || !finite(L0)) {
        setView('finder');
        say('The LR finder starts from a copy of your model, but your model has blown up (its weights are too big to compute with), so there is nothing to sweep from. Press <b>Reset</b> first, then run the LR finder on the fresh model.', 'warn');
        return;
      }
      finder = { p: Float64Array.from(S.p), opt: makeOpt(S.optKind), g: new Float64Array(NP), rng: mulberry32(FINDER_SEED),
        batches: [], bi: 0, pts: [], best: Infinity, i: 0, acc: 0, L0: L0, cfg: cfgKey() };
      btnFind.textContent = 'Stop LR finder';
      setView('finder');
      say('LR finder running: training a copy of your model while the learning rate climbs from 0.0001 to 10…');
      requestDraw();
    }
    function finderIter() {
      var F = finder, lr = FINDER_LO * Math.pow(FINDER_HI / FINDER_LO, F.i / (FINDER_ITERS - 1));
      if (F.bi >= F.batches.length) { F.batches = makeBatches(F.rng); F.bi = 0; }
      F.g.fill(0);
      backwardInto(F.p, F.batches[F.bi++], F.g);
      optStep(F.opt, F.p, F.g, lr);
      var L = allFinite(F.p) ? lossOn(F.p, trainSet()) : Infinity;
      if (!finite(L)) L = Infinity;
      F.pts.push({ lr: lr, L: L });
      if (L < F.best) F.best = L;
      F.i++;
      if (F.i >= FINDER_ITERS || !finite(L) || (F.i > 10 && L > 4 * F.best)) finishFinder();
    }
    function finishFinder() {
      var F = finder, iMin = 0;
      finder = null;
      btnFind.textContent = 'Run LR finder';
      F.pts.forEach(function (q, i) { if (q.L < F.pts[iMin].L) iMin = i; });
      var lrMin = F.pts[iMin].lr, Lmin = F.pts[iMin].L;
      // where training turns unstable: the first big jump up from the best loss so far
      var run = Infinity, lrUnstable = null;
      for (var i = 0; i < F.pts.length; i++) {
        var L = F.pts[i].L;
        if (i >= 3 && (!finite(L) || L > 1.3 * run)) { lrUnstable = F.pts[i].lr; break; }
        if (L < run) run = L;
      }
      var res = { pts: F.pts, L0: F.L0, lrMin: lrMin, Lmin: Lmin, lrUnstable: lrUnstable, cfg: F.cfg, lo: 0, hi: 0, sug: 0, ok: false };
      if (Lmin < 0.9 * F.L0) {
        res.ok = true;
        res.lo = lrMin / ZONE_LO_DIV; res.hi = lrMin / ZONE_HI_DIV;
        res.sug = lrFromPos(posFromLr(Math.sqrt(res.lo * res.hi)));
        zone = res; lastFinder = res;
        say('<b>LR finder done.</b> As the learning rate grew, the loss fell faster and faster' +
          (lrUnstable && lrUnstable <= lrMin ? ', then from about ' + fmtLr(lrUnstable) + ' the steps got so big that it turned jagged (red area); its lowest point, at lr ≈ ' + fmtLr(lrMin) + ', came during that wobble, just before it shot up. ' :
            ', reached its lowest point at lr ≈ ' + fmtLr(lrMin) + ', then the steps got too big and it shot up. ') +
          'A good learning rate sits on the steep downhill part, a few times smaller than the lowest point: the green zone runs from ' + fmtLr(res.lo) + ' to ' + fmtLr(res.hi) + ' (try about ' + fmtLr(res.sug) + '). ' +
          'Tap or click the chart, or use the slider. (fastai, a popular deep-learning library, uses 10× smaller than the lowest point: safer, but slower.)', 'good');
      } else {
        zone = null; lastFinder = res;
        say(!finite(Lmin)
          ? '<b>LR finder stopped: the loss blew up straight away.</b> Your model’s weights are already so big that even the smallest learning rate throws them off (it was probably trained with a learning rate that was far too high). Press <b>Reset</b>, then run the LR finder again on the fresh model.'
          : '<b>LR finder done, but the loss hardly fell</b> during the sweep (lowest ' + fmtNum(Lmin) + ' against ' + fmtNum(F.L0) + ' at the start). ' +
            (F.L0 < 3 * D.floor ? 'Your model is already well trained, so there is little left to learn. ' : 'No learning rate in the sweep helped much from where your model is now (it may be stuck after a bad run). ') +
            'Press <b>Reset</b>, then run the LR finder again on the fresh model.');
      }
      requestDraw();
      updateTexts();
    }
    function stopFinder(announce) {
      if (!finder) return;
      finder = null;
      btnFind.textContent = 'Run LR finder';
      if (announce) say('LR finder stopped. Run it again to get a full sweep.');
      requestDraw();
    }

    /* ---------- settings ---------- */
    function syncSegs() {
      Array.prototype.forEach.call(optBtns, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-opt') === S.optKind)); });
      Array.prototype.forEach.call(bsBtns, function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-bs') === S.bs)); });
      Array.prototype.forEach.call(viewBtns, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === S.view)); });
    }
    function updateTexts() {
      var lrs = fmtLr(S.lr);
      elOptHelp.innerHTML = (S.optKind === 'sgd'
        ? 'SGD (stochastic gradient descent): weight −= lr × .grad. '
        : 'Adam: keeps running averages of each weight’s gradients and their squares, so every weight takes a step of roughly lr or less. ') +
        'In code: ' + codeTag('torch.optim.' + (S.optKind === 'sgd' ? 'SGD' : 'Adam') + '(model.parameters(), lr=' + lrs + ')');
      if (S.overfit) elBsHelp.innerHTML = 'Not used right now: overfit-one-batch mode always trains on the same 8 days.';
      else {
        var nb = batchesPerEpoch();
        elBsHelp.innerHTML = 'How many days each step looks at: ' + nb + ' ' + plural(nb, 'step', 'steps') + ' per epoch. In code: ' + codeTag('DataLoader(train_ds, batch_size=' + S.bs + ', shuffle=True)');
      }
      // zero_grad line display
      var z = lineEls[6];
      z.innerHTML = S.forget ? '<span style="color:var(--muted)">        # optimizer.zero_grad()</span>' : CODE[6].h;
      // chart title, legend, help
      if (S.view === 'loss') {
        elCTitle.textContent = 'Loss after each epoch';
        elCLeg.innerHTML = '<i style="font-style:normal">' + legLine('--series-4') + 'Train loss' + (S.overfit ? ' (the 8 days)' : '') + '</i>' +
          '<i style="font-style:normal">' + legLine('--series-2', '4 3') + 'Validation loss</i>' +
          '<i style="font-style:normal">' + legLine('--muted', '2 3') + (S.overfit ? 'Goal: 0.002' : 'Noise level') + '</i>';
        elCHelp.textContent = S.overfit
          ? 'Log scale: each grid line is 10× the one below. In this mode the train loss can dive far below the noise level, because the model memorises the 8 days, noise and all.'
          : 'Log scale: each grid line is 10× the one below. The noise level is the loss of the true seasonal curve itself: day-to-day weather no model can predict, so no honest model gets far below it on validation days.';
      } else {
        elCTitle.textContent = 'LR finder: loss against learning rate';
        elCLeg.innerHTML = '<i style="font-style:normal">' + legLine('--indigo') + 'Loss after each sweep step</i>' +
          '<i style="font-style:normal">' + mark('<rect x="1" y="1" width="10" height="10" fill="var(--ok)" opacity=".3" stroke="var(--ok)"/>') + 'Green zone</i>' +
          '<i style="font-style:normal">' + mark('<rect x="1" y="1" width="10" height="10" fill="var(--bad)" opacity=".25"/>') + 'Unstable</i>' +
          '<i style="font-style:normal">' + legLine('--ink', '3 2') + 'Your learning rate</i>';
        var stale = lastFinder && lastFinder.cfg !== cfgKey();
        elCHelp.innerHTML = !lastFinder ? 'Press <b>Run LR finder</b> to sweep the learning rate.' :
          stale ? 'This sweep was for ' + cfgText(lastFinder.cfg) + '. You have changed the settings since, so run the LR finder again.' :
          'Learning rate on a log scale. The loss is measured on all ' + (S.overfit ? '8 days' : '64 training days') + ' after each step. Tap or click to set the learning rate.';
      }
    }
    function setView(v) {
      S.view = v;
      syncSegs();
      updateTexts();
      requestDraw();
    }
    function configChanged() {
      S.sr.cfg = null;   // the run since the last Reset no longer used one setup throughout
    }
    function abandonEpoch(what) {
      // a new DataLoader: drop the unfinished epoch; .grad (stored on the weights) is kept
      var wasMid = S.inEpoch;
      S.pc = 'start'; S.inEpoch = false; S.epochBatches = []; S.bi = -1; S.xb = null; S.pred = null; S.ghost = null; S.manual = null;
      return wasMid ? ' The unfinished epoch was dropped' + (what || '') + '; the next line starts a fresh one.' : '';
    }
    function setLr(lr, announce) {
      S.lr = lr;
      elLr.value = String(posFromLr(lr));
      elLrOut.textContent = fmtLr(lr);
      elLr.setAttribute('aria-valuetext', fmtLr(lr));
      updateTexts();
      if (announce) {
        var inZone = zone && zone.cfg === cfgKey() && lr >= zone.lo * 0.999 && lr <= zone.hi * 1.001;
        say('Learning rate set to ' + fmtLr(lr) + (inZone ? ', inside the green zone. Now press <b>Reset</b> and <b>Run</b>.' : '.'));
      }
      requestDraw();
    }

    /* ---------- stats, code highlight, aria ---------- */
    var lastText = {};
    function setText(el, key, v) { if (lastText[key] !== v) { lastText[key] = v; el.textContent = v; } }
    function updateStats() {
      setText(statEls.ep, 'ep', fmtInt(S.epochsDone));
      setText(statEls.steps, 'st', fmtInt(S.steps));
      setText(statEls.bl, 'bl', S.batchLoss == null ? '—' : fmtNum(S.batchLoss));
      setText(statEls.tr, 'tr', fmtNum(S.trLoss));
      setText(statEls.va, 'va', fmtNum(S.vaLoss));
      setText(statEls.gn, 'gn', fmtNum(S.gradNorm));
      var prog;
      if (S.blown) prog = 'Blown up: press Reset.';
      else if (S.inEpoch) prog = 'Now in epoch ' + fmtInt(S.epochsDone + 1) + ', batch ' + Math.max(1, S.bi + 1) + ' of ' + S.epochBatches.length + (S.running ? ' (running)' : '') + '.';
      else prog = S.epochsDone ? 'Between epochs: ' + fmtInt(S.epochsDone) + ' done.' : 'Not started: the weights are random.';
      setText(elProg, 'prog', prog);
    }
    var lastHi = '';
    function renderCode() {
      var lines = [];
      if (!S.running && S.pc !== 'start') CODE.forEach(function (c, i) { if (c.k === S.pc) lines.push(i); });
      var key = (S.running ? 'R' : 'S') + lines.join(',') + (S.forget ? 'F' : '');
      if (key === lastHi) return;
      lastHi = key;
      Array.prototype.forEach.call(lineEls, function (el, i) {
        var hi = lines.indexOf(i) >= 0, inner = S.running && i >= 1 && i <= 6 && !(S.forget && i === 6);
        el.style.background = hi ? 'var(--indigo-soft)' : inner ? 'var(--haldi-soft)' : '';
        el.style.boxShadow = hi ? 'inset 4px 0 0 var(--indigo)' : inner ? 'inset 4px 0 0 var(--haldi)' : '';
        if (hi) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current');
      });
    }
    function updateAria() {
      fitC.setAttribute('aria-label', 'Chart of New Delhi temperatures across the year: 64 training days, 32 validation days and the model’s curve. ' +
        (S.blown ? 'The model has blown up.' : 'Validation loss ' + fmtNum(S.vaLoss) + ', a typical error of about ' + fmtC(typicalC(S.vaLoss)) + '.') +
        (S.xb && !S.running ? ' ' + S.xb.length + ' days of the current batch are circled.' : ''));
      if (S.view === 'loss') {
        chartC.setAttribute('aria-label', 'Loss curves over ' + S.epochsDone + ' epochs, log scale. Latest train loss ' + fmtNum(S.trLoss) + ', validation loss ' + fmtNum(S.vaLoss) + ', noise level ' + fmtNum(D.floor) + '.');
      } else {
        chartC.setAttribute('aria-label', !lastFinder ? 'LR finder chart, empty until you run the LR finder.' :
          'LR finder: loss against learning rate from 0.0001 to 10. Lowest loss ' + fmtNum(lastFinder.Lmin) + ' at learning rate ' + fmtLr(lastFinder.lrMin) + '.' +
          (lastFinder.ok ? ' Green zone ' + fmtLr(lastFinder.lo) + ' to ' + fmtLr(lastFinder.hi) + '.' : '') + ' Your learning rate is ' + fmtLr(S.lr) + '.');
      }
      var g = S.gHist.length ? S.gHist[S.gHist.length - 1] : null;
      gradC.setAttribute('aria-label', 'Gradient chart. .grad size now ' + fmtNum(S.gradNorm) + '.' +
        (g ? ' The last step used a .grad of size ' + fmtNum(g.acc) + ', while that batch’s own gradient had size ' + fmtNum(g.fresh) + '.' : ' No steps taken yet.'));
    }
    function afterChange() {
      updateStats();
      renderCode();
      requestDraw();
    }

    /* ---------- drawing ---------- */
    function requestDraw() {
      needDraw = true;
      if (!rafId && !destroyed) rafId = requestAnimationFrame(tick);
    }
    var lastFrame = 0;
    function tick(now) {
      rafId = 0;
      if (destroyed) return;
      var dt = lastFrame ? Math.min(0.05, (now - lastFrame) / 1000) : 1 / 60;
      lastFrame = now;
      if (S.running) {
        runFrame(dt);
        updateStats();
        renderCode();
        needDraw = true;
      }
      if (finder) {
        finder.acc += dt * 60;
        var n = Math.min(4, Math.floor(finder.acc));
        finder.acc -= n;
        for (var i = 0; i < n && finder; i++) finderIter();
        needDraw = true;
      }
      if (needDraw) paint();
      if (S.running || finder) rafId = requestAnimationFrame(tick);
      else lastFrame = 0;
    }
    function paint() {
      needDraw = false;
      var T = readTheme();
      drawFit(T);
      if (S.view === 'loss') drawLoss(T); else drawFinder(T);
      drawGrad(T);
      if (!S.running && !finder) updateAria();
    }
    function font(T, px, weight) { return (weight ? weight + ' ' : '') + px + 'px ' + T.font; }
    // muted note on a small surface-coloured patch, so grid lines do not run through it
    function placeholder(g, T, text, x, y, maxW) {
      g.font = font(T, 12); g.textAlign = 'center'; g.textBaseline = 'middle';
      var w = Math.min(g.measureText(text).width, maxW) + 12;
      g.fillStyle = T.surface; g.fillRect(x - w / 2, y - 10, w, 20);
      g.fillStyle = T.muted; g.fillText(text, x, y, maxW);
    }
    function prep(g, key) {
      var d = dims[key];
      g.setTransform(dims.dpr, 0, 0, dims.dpr, 0, 0);
      g.clearRect(0, 0, d[0], d[1]);
      return d;
    }

    function fitGeom() {
      var W = dims.fit[0], Hh = dims.fit[1], small = W < 360;
      var pl = small ? 34 : 40, pr = 10, pt = 10, pb = 26;
      return { W: W, H: Hh, small: small, pl: pl, pt: pt, pw: Math.max(10, W - pl - pr), ph: Math.max(10, Hh - pt - pb), t0: 5, t1: 40 };
    }
    function fx(G, d) { return G.pl + (d - 1) / 365 * G.pw; }
    function fy(G, t) { return G.pt + (1 - (t - G.t0) / (G.t1 - G.t0)) * G.ph; }
    function drawCurve(g, G, f) {
      g.beginPath();
      var pen = false;
      for (var px = 0; px <= G.pw; px += 2) {
        var d = 1 + px / G.pw * 365, v = f((d - XC) / XS), y;
        if (!finite(v)) { pen = false; continue; }
        y = clamp(fy(G, YC + YS * v), G.pt - 40, G.pt + G.ph + 40);
        if (!pen) { g.moveTo(G.pl + px, y); pen = true; } else g.lineTo(G.pl + px, y);
      }
      g.stroke();
    }
    function drawFit(T) {
      var g = fg, G = fitGeom(), i, m;
      prep(g, 'fit');
      g.fillStyle = T.surface; g.fillRect(0, 0, G.W, G.H);
      // grid
      g.lineWidth = 1; g.strokeStyle = T.line;
      for (m = 0; m <= 12; m++) { var x = Math.round(fx(G, MONTH_START[m])) + 0.5; g.beginPath(); g.moveTo(x, G.pt); g.lineTo(x, G.pt + G.ph); g.stroke(); }
      var tStep = G.ph < 200 ? 10 : 5;
      g.fillStyle = T.muted; g.font = font(T, 11); g.textAlign = 'right'; g.textBaseline = 'middle';
      for (var t = 10; t <= G.t1; t += tStep) {
        var y = Math.round(fy(G, t)) + 0.5;
        g.beginPath(); g.moveTo(G.pl, y); g.lineTo(G.pl + G.pw, y); g.stroke();
        g.fillText(String(t), G.pl - 5, y);
      }
      g.textAlign = 'center'; g.textBaseline = 'top';
      var every = G.pw / 12 < 28 ? 2 : 1;
      for (m = 0; m < 12; m += every) g.fillText(MONTHS[m], fx(G, (MONTH_START[m] + MONTH_START[m + 1]) / 2), G.pt + G.ph + 6);
      g.save(); g.translate(11, G.pt + G.ph / 2); g.rotate(-Math.PI / 2);
      g.fillStyle = T.ink; g.font = font(T, 11, '600'); g.textBaseline = 'middle'; g.fillText('°C', 0, 0); g.restore();

      g.save();
      g.beginPath(); g.rect(G.pl, G.pt, G.pw, G.ph); g.clip();
      if (S.showTrue) {
        g.strokeStyle = T.muted; g.lineWidth = 1.6; g.setLineDash([6, 4]);
        drawCurve(g, G, function (u) { return (trueTemp(u * XS + XC) - YC) / YS; });
        g.setLineDash([]);
      }
      var stepMode = !S.running && !S.blown;
      if (stepMode && S.ghost && (S.pc === 'step' || S.pc === 'zero')) {
        var gp = S.ghost;
        g.strokeStyle = T.indigo; g.globalAlpha = 0.45; g.lineWidth = 1.8; g.setLineDash([5, 4]);
        drawCurve(g, G, function (u) { return predict(gp, u); });
        g.setLineDash([]); g.globalAlpha = 1;
      }
      // residuals for the current batch, after the forward pass and before the update
      var showBatch = stepMode && S.xb && S.pc !== 'eval' && S.pc !== 'epoch' && S.pc !== 'start';
      if (showBatch && S.pred && (S.pc === 'forward' || S.pc === 'loss' || S.pc === 'backward')) {
        g.strokeStyle = T.muted; g.lineWidth = 1.4;
        for (i = 0; i < S.xb.length; i++) {
          var bx = fx(G, S.xb[i].d), by0 = fy(G, S.xb[i].t), by1 = clamp(fy(G, YC + YS * S.pred[i]), G.pt - 20, G.pt + G.ph + 20);
          g.beginPath(); g.moveTo(bx, by0); g.lineTo(bx, by1); g.stroke();
        }
      }
      if (!S.blown) {
        g.strokeStyle = T.indigo; g.lineWidth = 2.6; g.lineJoin = 'round';
        var pp = S.p;
        drawCurve(g, G, function (u) { return predict(pp, u); });
      }
      g.restore();
      // points
      var r = G.small ? 3.3 : 3.8;
      g.lineWidth = 1.8; g.strokeStyle = T.series2;
      for (i = 0; i < D.val.length; i++) {
        g.beginPath(); g.arc(fx(G, D.val[i].d), fy(G, D.val[i].t), r, 0, Math.PI * 2); g.stroke();
      }
      for (i = 0; i < D.train.length; i++) {
        var q = D.train[i];
        g.globalAlpha = S.overfit && !q.one ? 0.28 : 1;
        g.beginPath(); g.arc(fx(G, q.d), fy(G, q.t), r, 0, Math.PI * 2);
        g.fillStyle = T.series4; g.fill();
        g.lineWidth = 1; g.strokeStyle = T.surface; g.stroke();
      }
      g.globalAlpha = 1;
      var ring = showBatch ? S.xb : (S.overfit ? D.one : null);
      if (ring) {
        g.lineWidth = 1.8; g.strokeStyle = T.ink;
        for (i = 0; i < ring.length; i++) { g.beginPath(); g.arc(fx(G, ring[i].d), fy(G, ring[i].t), r + 3.2, 0, Math.PI * 2); g.stroke(); }
      }
      if (S.blown) {
        var bt = 'The model blew up: press Reset', bxc = G.pl + G.pw / 2, byc = G.pt + G.ph * 0.82;
        g.font = font(T, 13, '700'); g.textAlign = 'center'; g.textBaseline = 'middle';
        var bw = Math.min(g.measureText(bt).width, G.pw - 16) + 20;
        g.fillStyle = T.surface; g.fillRect(bxc - bw / 2, byc - 14, bw, 28);
        g.strokeStyle = T.bad; g.lineWidth = 1.5; g.strokeRect(bxc - bw / 2 + 0.5, byc - 13.5, bw - 1, 27);
        g.fillStyle = T.ink; g.fillText(bt, bxc, byc, G.pw - 16);
      }
    }

    function logTicks(lo, hi) {
      var out = [];
      for (var e = Math.ceil(Math.log10(lo) - 1e-9); e <= Math.floor(Math.log10(hi) + 1e-9); e++) out.push(Math.pow(10, e));
      return out;
    }
    function chartGeom(key) {
      var W = dims[key][0], Hh = dims[key][1];
      return { W: W, H: Hh, pl: 56, pr: 12, pt: 12, pb: 34, pw: Math.max(10, W - 68), ph: Math.max(10, Hh - 46) };
    }
    function drawLoss(T) {
      var g = cg, G = chartGeom('chart'), hist = S.hist, i;
      prep(g, 'chart');
      g.fillStyle = T.surface; g.fillRect(0, 0, G.W, G.H);
      var lo = Infinity, hi = 0;
      for (i = 0; i < hist.length; i++) {
        var a1 = hist[i].tr, a2 = hist[i].va;
        if (finite(a1) && a1 > 0) { if (a1 < lo) lo = a1; if (a1 > hi) hi = a1; }
        if (finite(a2) && a2 > 0) { if (a2 < lo) lo = a2; if (a2 > hi) hi = a2; }
      }
      var ref = S.overfit ? OVERFIT_TARGET : D.floor;
      lo = Math.min(lo, ref); hi = Math.max(hi, ref);
      if (!finite(lo)) { lo = 0.01; hi = 1; }
      var yLo = Math.pow(10, Math.floor(Math.log10(lo / 1.15))), yHi = Math.pow(10, Math.ceil(Math.log10(hi * 1.15)));
      yHi = Math.min(yHi, 1e8); if (yHi <= yLo * 10) yHi = yLo * 10;
      var lyLo = Math.log10(yLo), lyHi = Math.log10(yHi);
      var E = hist[hist.length - 1].e, xMax = Math.max(10, E);
      var xs = niceStep(xMax / (G.pw < 260 ? 4 : 6)); xMax = Math.ceil(xMax / xs) * xs;
      function X(e) { return G.pl + e / xMax * G.pw; }
      function Y(v) { return G.pt + (1 - (Math.log10(clamp(v, yLo, yHi)) - lyLo) / (lyHi - lyLo)) * G.ph; }
      // grid + labels
      g.lineWidth = 1; g.strokeStyle = T.line; g.fillStyle = T.muted; g.font = font(T, 11);
      g.textAlign = 'right'; g.textBaseline = 'middle';
      var ticks = logTicks(yLo, yHi), stepT = ticks.length > 6 ? 2 : 1;
      ticks.forEach(function (v, k) {
        var y = Math.round(Y(v)) + 0.5;
        g.beginPath(); g.moveTo(G.pl, y); g.lineTo(G.pl + G.pw, y); g.stroke();
        if (k % stepT === 0) g.fillText(fmtDecade(v), G.pl - 5, y);
      });
      g.textAlign = 'center'; g.textBaseline = 'top';
      for (var e = 0; e <= xMax + 1e-9; e += xs) {
        var x = Math.round(X(e)) + 0.5;
        g.beginPath(); g.moveTo(x, G.pt); g.lineTo(x, G.pt + G.ph); g.stroke();
        g.fillText(fmtInt(e), x, G.pt + G.ph + 5);
      }
      g.fillStyle = T.ink; g.font = font(T, 11, '600'); g.textBaseline = 'bottom';
      g.fillText('Epoch', G.pl + G.pw / 2, G.H - 2);
      g.save(); g.translate(11, G.pt + G.ph / 2); g.rotate(-Math.PI / 2); g.textBaseline = 'middle'; g.fillText('Loss (log scale)', 0, 0); g.restore();
      // reference line
      var yr = Y(ref);
      g.strokeStyle = T.muted; g.lineWidth = 1.5; g.setLineDash([2, 3]);
      g.beginPath(); g.moveTo(G.pl, yr); g.lineTo(G.pl + G.pw, yr); g.stroke(); g.setLineDash([]);
      g.fillStyle = T.muted; g.font = font(T, 11); g.textAlign = 'left'; g.textBaseline = 'top';
      g.fillText(S.overfit ? 'goal 0.002' : 'noise level', G.pl + 6, yr + 3);
      // lines
      g.save(); g.beginPath(); g.rect(G.pl, G.pt - 4, G.pw + 4, G.ph + 8); g.clip();
      var stride = Math.max(1, Math.floor(hist.length / 800)), idx = [];
      for (i = 0; i < hist.length; i += stride) idx.push(i);
      if (idx[idx.length - 1] !== hist.length - 1) idx.push(hist.length - 1);
      function line(keyName, color, dash) {
        g.strokeStyle = color; g.lineWidth = 2.2; g.setLineDash(dash || []); g.lineJoin = 'round';
        g.beginPath();
        var pen = false;
        for (var n = 0; n < idx.length; n++) {
          var k = idx[n], v = hist[k][keyName];
          if (!finite(v)) { pen = false; continue; }
          var px = X(hist[k].e), py = Y(Math.max(v, yLo));
          if (!pen) { g.moveTo(px, py); pen = true; } else g.lineTo(px, py);
        }
        g.stroke(); g.setLineDash([]);
        if (hist.length <= 40) {
          g.fillStyle = color;
          for (var j = 0; j < hist.length; j++) if (finite(hist[j][keyName])) { g.beginPath(); g.arc(X(hist[j].e), Y(Math.max(hist[j][keyName], yLo)), 2.6, 0, Math.PI * 2); g.fill(); }
        }
      }
      line('va', T.series2, [5, 4]);
      line('tr', T.series4);
      g.restore();
      if (hist.length === 1) placeholder(g, T, 'Each finished epoch adds a point here', G.pl + G.pw / 2, G.pt + G.ph * 0.3, G.pw - 12);
    }

    function drawFinder(T) {
      var g = cg, G = chartGeom('chart');
      prep(g, 'chart');
      g.fillStyle = T.surface; g.fillRect(0, 0, G.W, G.H);
      var res = finder ? { pts: finder.pts, L0: finder.L0, cfg: finder.cfg, running: true } : lastFinder;
      var lx0 = Math.log10(FINDER_LO), lx1 = Math.log10(FINDER_HI);
      function X(lr) { return G.pl + (Math.log10(lr) - lx0) / (lx1 - lx0) * G.pw; }
      var yTop = res ? Math.max(0.05, res.L0 * 1.3) : 1.3;
      var ys = niceStep(yTop / 4); yTop = Math.ceil(yTop / ys) * ys;
      function Y(v) { return G.pt + (1 - clamp(v, 0, yTop) / yTop) * G.ph; }
      // grid
      g.lineWidth = 1; g.strokeStyle = T.line; g.fillStyle = T.muted; g.font = font(T, 11);
      g.textAlign = 'right'; g.textBaseline = 'middle';
      for (var v = 0; v <= yTop + 1e-9; v += ys) { var y = Math.round(Y(v)) + 0.5; g.beginPath(); g.moveTo(G.pl, y); g.lineTo(G.pl + G.pw, y); g.stroke(); g.fillText(fmtNum(+v.toPrecision(3)), G.pl - 5, y); }
      g.textAlign = 'center'; g.textBaseline = 'top';
      var narrow = G.pw < 300;
      for (var e = -4; e <= 1; e++) {
        var x = Math.round(X(Math.pow(10, e))) + 0.5;
        g.beginPath(); g.moveTo(x, G.pt); g.lineTo(x, G.pt + G.ph); g.stroke();
        if (!narrow || e % 2 === 0 || e === 1) {
          var lab = fmtLr(Math.pow(10, e)), half = g.measureText(lab).width / 2;
          g.fillText(lab, clamp(x, G.pl + half, G.W - 2 - half), G.pt + G.ph + 5);
        }
      }
      g.fillStyle = T.ink; g.font = font(T, 11, '600'); g.textBaseline = 'bottom';
      g.fillText('Learning rate (log scale)', G.pl + G.pw / 2, G.H - 2);
      g.save(); g.translate(11, G.pt + G.ph / 2); g.rotate(-Math.PI / 2); g.textBaseline = 'middle'; g.fillText('Loss', 0, 0); g.restore();

      var stale = res && !res.running && res.cfg !== cfgKey();
      if (res && !res.running && res.lrUnstable) {
        var ux0 = X(res.lrUnstable);
        g.fillStyle = T.bad; g.globalAlpha = T.dark ? 0.13 : 0.08; g.fillRect(ux0, G.pt, G.pl + G.pw - ux0, G.ph); g.globalAlpha = 1;
        g.fillStyle = T.ink; g.font = font(T, 11, '700'); g.textAlign = 'right'; g.textBaseline = 'top';
        g.fillText('unstable', G.pl + G.pw - 4, G.pt + 4);
      }
      if (res && res.ok) {
        var zx0 = X(res.lo), zx1 = X(res.hi);
        g.fillStyle = stale ? T.muted : T.ok; g.globalAlpha = T.dark ? 0.3 : 0.16; g.fillRect(zx0, G.pt, zx1 - zx0, G.ph); g.globalAlpha = 1;
        g.strokeStyle = stale ? T.muted : T.ok; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(zx0 + 0.5, G.pt); g.lineTo(zx0 + 0.5, G.pt + G.ph); g.moveTo(zx1 - 0.5, G.pt); g.lineTo(zx1 - 0.5, G.pt + G.ph); g.stroke();
        g.fillStyle = T.ink; g.font = font(T, 11, '700'); g.textAlign = 'center'; g.textBaseline = 'top';
        var zl = stale ? 'old zone' : 'green zone', zc = (zx0 + zx1) / 2, zw = g.measureText(zl).width / 2;
        g.fillText(zl, clamp(zc, G.pl + zw + 2, G.pl + G.pw - zw - 2), G.pt + 4);
      }
      if (res && res.pts.length) {
        g.save(); g.beginPath(); g.rect(G.pl, G.pt - 2, G.pw, G.ph + 4); g.clip();
        g.strokeStyle = stale ? T.muted : T.indigo; g.lineWidth = 2.2; g.lineJoin = 'round';
        g.beginPath();
        res.pts.forEach(function (q, k) { var px = X(q.lr), py = Y(finite(q.L) ? q.L : yTop * 2); if (k === 0) g.moveTo(px, py); else g.lineTo(px, py); });
        g.stroke();
        g.restore();
        if (!res.running) {
          var mx = X(res.lrMin), my = Y(res.Lmin);
          g.beginPath(); g.arc(mx, my, 5, 0, Math.PI * 2); g.lineWidth = 2; g.strokeStyle = T.ink; g.stroke();
          g.fillStyle = T.ink; g.font = font(T, 11, '600'); g.textAlign = mx > G.pl + G.pw - 70 ? 'right' : 'left'; g.textBaseline = 'top';
          g.fillText('lowest', mx + (g.textAlign === 'right' ? -8 : 8), Math.min(my + 6, G.pt + G.ph - 14));
        }
      } else {
        placeholder(g, T, 'Press “Run LR finder” to sweep the learning rate', G.pl + G.pw / 2, G.pt + G.ph / 2, G.pw - 12);
      }
      // your learning rate
      var ux = X(clamp(S.lr, FINDER_LO, FINDER_HI));
      g.strokeStyle = T.ink; g.lineWidth = 1.6; g.setLineDash([4, 3]);
      g.beginPath(); g.moveTo(ux, G.pt); g.lineTo(ux, G.pt + G.ph); g.stroke(); g.setLineDash([]);
      g.fillStyle = T.ink; g.font = font(T, 11, '600'); g.textBaseline = 'bottom';
      g.textAlign = ux > G.pl + G.pw - 80 ? 'right' : 'left';
      g.fillText('your lr ' + fmtLr(S.lr), ux + (g.textAlign === 'right' ? -5 : 5), G.pt + G.ph - 4);
      if (hoverLr != null && !finder && hoverLr !== S.lr) {
        var hx = X(hoverLr);
        g.strokeStyle = T.muted; g.lineWidth = 1;
        g.beginPath(); g.moveTo(hx + 0.5, G.pt); g.lineTo(hx + 0.5, G.pt + G.ph); g.stroke();
        g.fillStyle = T.ink; g.font = font(T, 11); g.textBaseline = 'top';
        g.textAlign = hx > G.pl + G.pw - 70 ? 'right' : 'left';
        g.fillText('lr ' + fmtLr(hoverLr), hx + (g.textAlign === 'right' ? -5 : 5), G.pt + 20);
      }
    }

    function drawGrad(T) {
      var g = gg, W = dims.grad[0], Hh = dims.grad[1], i;
      prep(g, 'grad');
      g.fillStyle = T.surface; g.fillRect(0, 0, W, Hh);
      var pl = 50, pr = 12;
      var pw = Math.max(10, W - pl - pr);
      // top strip: the 25 numbers in .grad right now
      var stripTop = 22, stripH = clamp(Hh * 0.22, 36, 64), mid = stripTop + stripH / 2;
      g.fillStyle = T.ink; g.font = font(T, 11, '600'); g.textAlign = 'left'; g.textBaseline = 'top';
      g.fillText('.grad of all 25 weights now', 8, 5);
      var maxAbs = 0;
      for (i = 0; i < NP; i++) if (finite(S.grad[i]) && Math.abs(S.grad[i]) > maxAbs) maxAbs = Math.abs(S.grad[i]);
      g.fillStyle = T.muted; g.font = font(T, 11); g.textAlign = 'right';
      g.fillText(maxAbs > 0 ? 'tallest ±' + fmtNum(maxAbs) : 'all zero', W - 8, 5);
      var groups = [[0, H, 'W1'], [H, 2 * H, 'b1'], [2 * H, 3 * H, 'W2'], [3 * H, NP, 'b2']];
      var gap = 10, slots = NP, bw = (pw - gap * 3) / slots;
      g.strokeStyle = T.line; g.lineWidth = 1;
      g.beginPath(); g.moveTo(pl, Math.round(mid) + 0.5); g.lineTo(pl + pw, Math.round(mid) + 0.5); g.stroke();
      g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillStyle = T.muted;
      g.fillText('0', pl - 5, mid);
      groups.forEach(function (gr, gi) {
        var x0 = pl + gr[0] * bw + gi * gap;
        for (var k = gr[0]; k < gr[1]; k++) {
          var v = S.grad[k], hgt = maxAbs > 0 && finite(v) ? v / maxAbs * (stripH / 2 - 2) : 0;
          var bx = x0 + (k - gr[0]) * bw;
          g.fillStyle = T.indigo;
          if (Math.abs(hgt) > 0.3) g.fillRect(bx + bw * 0.15, hgt > 0 ? mid - hgt : mid, bw * 0.7, Math.abs(hgt));
        }
        g.fillStyle = T.muted; g.font = font(T, 10); g.textAlign = 'center'; g.textBaseline = 'top';
        g.fillText(gr[2], x0 + (gr[1] - gr[0]) * bw / 2, stripTop + stripH + 1);
      });
      // bottom: size of .grad at each of the last steps (log scale)
      var hTop = stripTop + stripH + 34, hb = 30, ph = Math.max(20, Hh - hTop - hb);
      g.fillStyle = T.ink; g.font = font(T, 11, '600'); g.textAlign = 'left'; g.textBaseline = 'bottom';
      g.fillText('Size of .grad at each step (last ' + GHIST_SHOW + ')', 8, hTop - 6);
      var hist = S.gHist.slice(-GHIST_SHOW), lo = Infinity, hi = 0;
      hist.forEach(function (q) { [q.acc, q.fresh].forEach(function (v) { if (finite(v) && v > 0) { if (v < lo) lo = v; if (v > hi) hi = v; } }); });
      if (!finite(lo)) { lo = 0.1; hi = 10; }
      var yLo = Math.pow(10, Math.floor(Math.log10(lo / 1.2))), yHi = Math.pow(10, Math.ceil(Math.log10(hi * 1.2)));
      if (yHi <= yLo * 10) yHi = yLo * 10;
      yHi = Math.min(yHi, 1e12);
      var lyLo = Math.log10(yLo), lyHi = Math.log10(yHi);
      function Y(v) { return hTop + (1 - (Math.log10(clamp(v, yLo, yHi)) - lyLo) / (lyHi - lyLo)) * ph; }
      g.strokeStyle = T.line; g.lineWidth = 1; g.fillStyle = T.muted; g.font = font(T, 11); g.textAlign = 'right'; g.textBaseline = 'middle';
      var ticks = logTicks(yLo, yHi), st = ticks.length > 5 ? 2 : 1;
      ticks.forEach(function (v, k) {
        var y = Math.round(Y(v)) + 0.5;
        g.beginPath(); g.moveTo(pl, y); g.lineTo(pl + pw, y); g.stroke();
        if (k % st === 0) g.fillText(fmtDecade(v), pl - 5, y);
      });
      g.strokeStyle = T.muted;
      g.beginPath(); g.moveTo(pl, hTop + ph + 0.5); g.lineTo(pl + pw, hTop + ph + 0.5); g.stroke();
      var sw = pw / GHIST_SHOW;
      if (!hist.length) placeholder(g, T, 'No steps yet', pl + pw / 2, hTop + ph / 2, pw - 12);
      for (i = 0; i < hist.length; i++) {
        var q = hist[i], bx = pl + pw - (hist.length - i) * sw;
        if (finite(q.acc) && q.acc > 0) { var y0 = Y(q.acc); g.fillStyle = T.indigo; g.fillRect(bx + sw * 0.12, y0, Math.max(1, sw * 0.76), hTop + ph - y0); }
      }
      for (i = 0; i < hist.length; i++) {
        var q2 = hist[i], cx = pl + pw - (hist.length - i - 0.5) * sw;
        if (finite(q2.fresh) && q2.fresh > 0) {
          g.beginPath(); g.arc(cx, Y(q2.fresh), Math.min(3, Math.max(1.8, sw * 0.32)), 0, Math.PI * 2);
          g.fillStyle = T.ink; g.fill(); g.lineWidth = 1; g.strokeStyle = T.surface; g.stroke();
        }
      }
      var lastG = hist.length ? hist[hist.length - 1] : null;
      if (lastG && lastG.n > 1 && finite(lastG.acc) && lastG.fresh > 0) {
        // zero_grad() was skipped: say how much bigger the piled-up .grad is than the batch's own gradient
        var at = 'last .grad: ' + fmtNum(lastG.acc / lastG.fresh) + '× its batch alone';
        g.font = font(T, 11, '700'); g.textAlign = 'right'; g.textBaseline = 'middle';
        var aw = g.measureText(at).width + 10;
        g.fillStyle = T.surface; g.fillRect(pl + pw - aw, hTop + 2, aw, 18);
        g.fillStyle = T.ink; g.fillText(at, pl + pw - 5, hTop + 11);
      }
      g.fillStyle = T.muted; g.font = font(T, 11); g.textBaseline = 'top';
      g.textAlign = 'right';
      g.fillText(S.steps ? 'step ' + fmtInt(S.steps) : '', pl + pw, hTop + ph + 5);
      g.textAlign = 'left';
      g.fillText(hist.length ? 'older ←' : '', pl, hTop + ph + 5);
    }

    /* ---------- pointer: pick a learning rate on the LR finder chart ---------- */
    function lrAtPx(clientX) {
      var r = chartC.getBoundingClientRect(), G = chartGeom('chart'), x = clientX - r.left;
      if (x < G.pl - 6 || x > G.pl + G.pw + 6) return null;
      var f = clamp((x - G.pl) / G.pw, 0, 1);
      return Math.pow(10, Math.log10(FINDER_LO) + f * (Math.log10(FINDER_HI) - Math.log10(FINDER_LO)));
    }
    on(chartC, 'pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (S.view !== 'finder' || finder) return;
      tap = { id: e.pointerId, x: e.clientX, y: e.clientY };
    });
    on(chartC, 'pointerup', function (e) {
      if (!tap || tap.id !== e.pointerId) return;
      var moved = Math.hypot(e.clientX - tap.x, e.clientY - tap.y);
      tap = null;
      if (moved > 10 || S.view !== 'finder' || finder) return;
      var lr = lrAtPx(e.clientX);
      if (lr == null) return;
      setLr(lrFromPos(posFromLr(lr)), true);
    });
    on(chartC, 'pointercancel', function () { tap = null; });
    on(chartC, 'pointermove', function (e) {
      if (e.pointerType !== 'mouse' || S.view !== 'finder') return;
      var lr = lrAtPx(e.clientX);
      var v = lr == null ? null : lrFromPos(posFromLr(lr));
      if (v !== hoverLr) { hoverLr = v; chartC.style.cursor = v == null ? '' : 'pointer'; requestDraw(); }
    });
    on(chartC, 'pointerleave', function () { if (hoverLr != null) { hoverLr = null; requestDraw(); } });

    /* ---------- controls ---------- */
    on(btnNext, 'click', onNext);
    on(btnRun, 'click', onRun);
    on(btnReset, 'click', onReset);
    on(btnFind, 'click', function () {
      if (finder) { stopFinder(true); return; }
      startFinder();
    });
    Array.prototype.forEach.call(viewBtns, function (b) { on(b, 'click', function () { setView(b.getAttribute('data-view')); }); });
    Array.prototype.forEach.call(optBtns, function (b) {
      on(b, 'click', function () {
        var k = b.getAttribute('data-opt');
        if (k === S.optKind) return;
        stopFinder(false);
        var zoneWasCurrent = zone && zone.cfg === cfgKey();
        S.optKind = k;
        S.opt = makeOpt(k);
        configChanged();
        syncSegs(); updateTexts();
        say('New optimizer: ' + codeTag('torch.optim.' + (k === 'sgd' ? 'SGD' : 'Adam') + '(model.parameters(), lr=' + fmtLr(S.lr) + ')') + '. The weights are kept' +
          (k === 'adam' ? '; a new Adam starts with empty running averages.' : '.') + (zoneWasCurrent ? ' The LR finder result was for the old optimizer: run it again.' : ''));
        afterChange();
      });
    });
    Array.prototype.forEach.call(bsBtns, function (b) {
      on(b, 'click', function () {
        var v = +b.getAttribute('data-bs');
        if (v === S.bs) return;
        stopFinder(false);
        var zoneWasCurrent = zone && zone.cfg === cfgKey();
        S.bs = v;
        syncSegs(); updateTexts();
        if (S.overfit) { say('Batch size ' + (v === 64 ? 'All 64' : v) + ' will be used when you leave overfit-one-batch mode.'); afterChange(); return; }
        configChanged();
        var extra = abandonEpoch(' (a new DataLoader deals new batches)');
        var nb = batchesPerEpoch();
        say('New DataLoader: ' + codeTag('batch_size=' + v) + ', so ' + nb + ' ' + plural(nb, 'step', 'steps') + ' per epoch.' + extra + (zoneWasCurrent ? ' The LR finder result was for the old batch size: run it again.' : ''));
        afterChange();
      });
    });
    on(elLr, 'input', function () { setLr(lrFromPos(+elLr.value), false); });
    on(elEp, 'input', function () {
      S.epochIdx = +elEp.value;
      var n = runEpochs();
      elEpOut.textContent = fmtInt(n);
      elEp.setAttribute('aria-valuetext', fmtInt(n) + ' ' + plural(n, 'epoch', 'epochs'));
      if (!S.running) syncRunLabel();
    });
    on(elForget, 'change', function () {
      S.forget = elForget.checked;
      if (S.forget) {
        S.forgetMin = lossOn(S.p, trainSet()); S.forgetSteps = 0;
        S.sr.forget = true;
        say('<b>' + codeTag('optimizer.zero_grad()') + ' is now commented out.</b> Each ' + codeTag('loss.backward()') + ' will add its gradient on top of everything already in .grad. Keep training (Run or Next line) and watch the gradient chart.', 'warn');
      } else {
        say('zero_grad() is back. The next time that line runs, .grad is cleared' + (S.gradNorm > 0 ? ' (right now it still holds old gradients, size ' + fmtNum(S.gradNorm) + ')' : '') + '.');
      }
      updateTexts();
      afterChange();
    });
    on(elOverfit, 'change', function () {
      stopFinder(false);
      setRunning(false);
      S.overfit = elOverfit.checked;
      resetModel();
      updateTexts(); syncSegs();
      if (S.overfit) say('<b>Overfit one batch:</b> a fresh model will train on just the 8 circled days, again and again (one step per epoch). If the model and loop are healthy, the training loss should fall almost to zero. Try Adam, lr around 0.1, and 500 epochs per Run.');
      else say('Back to normal training on all 64 training days, with a fresh model.');
      afterChange();
    });
    on(elTrue, 'change', function () { S.showTrue = elTrue.checked; requestDraw(); });

    /* ---------- theme, fonts, resize ---------- */
    function onTheme() { requestDraw(); }
    var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mql) { if (mql.addEventListener) mql.addEventListener('change', onTheme); else if (mql.addListener) mql.addListener(onTheme); }
    on(document, 'themechange', onTheme);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!destroyed) requestDraw(); });

    function resize() {
      if (destroyed) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 3), changed = false;
      [['fit', fitC], ['chart', chartC], ['grad', gradC]].forEach(function (pair) {
        var r = pair[1].getBoundingClientRect(), w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
        var d = dims[pair[0]];
        if (w !== d[0] || h !== d[1] || dpr !== dims.dpr || pair[1].width <= 1) {
          dims[pair[0]] = [w, h];
          pair[1].width = Math.round(w * dpr); pair[1].height = Math.round(h * dpr);
          changed = true;
        }
      });
      if (dpr !== dims.dpr) { dims.dpr = dpr; changed = true; }
      // setting canvas.width wipes it, so repaint right away rather than show a blank frame
      if (changed) { if (started) paint(); else needDraw = true; }
    }
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { resize(); }); ro.observe(fitWrap); ro.observe(chartWrap); ro.observe(gradWrap); }
    else on(window, 'resize', resize);

    /* ---------- start ---------- */
    resetModel();
    syncSegs();
    updateTexts();
    syncRunLabel();
    elLr.setAttribute('aria-valuetext', fmtLr(S.lr));
    say('The model starts with random weights, so its curve is nearly flat and far from the dots. Press <b>Next line</b> to run the loop one line at a time, or <b>Run 20 epochs</b> to train quickly.' + nextHint());
    resize();
    started = true;
    updateStats();
    renderCode();
    paint();

    return {
      destroy: function () {
        if (destroyed) return;
        destroyed = true;
        S.running = false; finder = null;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
        if (ro) ro.disconnect();
        if (mql) { if (mql.removeEventListener) mql.removeEventListener('change', onTheme); else if (mql.removeListener) mql.removeListener(onTheme); }
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
        listeners = [];
        if (top.parentNode) top.parentNode.removeChild(top);
      }
    };
  }

  Labs.trainloop = {
    id: 'trainloop',
    module: 'l3-pytorch',
    title: 'The PyTorch training loop',
    summary: 'Step through a real PyTorch training loop line by line as a tiny neural network learns Delhi’s seasons, then break it on purpose and debug it with an LR finder and the overfit-one-batch check.',
    tasks: TASKS,
    mount: mount
  };
})();
