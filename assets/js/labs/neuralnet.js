/* AI Marg lab: a mini neural-network playground (a simplified TensorFlow Playground).
   Plain classic script (ES2019). Registers window.AILabs.neuralnet. No libraries, no network.
   Real maths: a fully connected network, sigmoid output, binary cross-entropy loss,
   gradients by backpropagation, mini-batch gradient descent, Xavier/He initialisation, optional L2. */
(function () {
  'use strict';
  var Labs = (window.AILabs = window.AILabs || {});
  var mountCount = 0;

  /* ---------- constants ---------- */
  var N_TOTAL = 300, N_TRAIN = 200, BATCH = 10, PRETRAIN = 60;
  var LRS = [0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1, 3, 10];
  var L2S = [0, 0.0001, 0.001, 0.003, 0.01, 0.03, 0.1];
  var SPEEDS = [1, 3, 10];          // epochs trained per animation frame
  var THUMB = 16;                   // neuron pictures are worked out on a 16 x 16 grid
  var HIST_MAX = 1200;              // loss-curve points kept before thinning
  var LN2 = Math.LN2;               // loss of a network that always says 50/50

  var DATASETS = [
    { id: 'line', name: 'Line', desc: 'Two groups that one straight line can separate. The easy one.' },
    { id: 'circle', name: 'Circle', desc: 'A blue blob inside an orange ring. No single straight line can split them.' },
    { id: 'xor', name: 'XOR', desc: 'XOR (“exclusive or”): blue where x₁ and x₂ have the same sign, orange where the signs differ. Needs at least two lines.' },
    { id: 'spiral', name: 'Spiral', desc: 'Two arms that wind around each other. The hardest one.' }
  ];
  var ACTS = [
    { id: 'tanh', name: 'tanh', desc: 'tanh squashes any number into the range −1 to 1 (a smooth S-shaped curve).' },
    { id: 'relu', name: 'ReLU', desc: 'ReLU keeps positive numbers and turns negative ones into 0. Fast and very popular, but a neuron can “die” (output 0 for every point).' },
    { id: 'sigmoid', name: 'sigmoid', desc: 'sigmoid squashes any number into 0 to 1. In hidden layers it learns slowly, because its slope is never more than 0.25.' }
  ];
  var TASKS = [
    { id: 't1', text: 'Pick Circle, set 0 hidden layers and train for at least 200 epochs. See test accuracy stay stuck below 75%: with no hidden layer the network can only draw one straight line.' },
    { id: 't2', text: 'Solve XOR with exactly 1 hidden layer: reach 95% test accuracy.' },
    { id: 't3', text: 'Untangle the Spiral: reach 90% test accuracy. (Hint: try 2 hidden layers.)' },
    { id: 't4', text: 'Make training blow up: with tanh, set the learning rate to 3 or 10 and train until the training loss jumps above 1.5 (much worse than guessing).' }
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
  function sigmoid(z) {
    if (z >= 0) return 1 / (1 + Math.exp(-z));
    var e = Math.exp(z);
    return e / (1 + e);
  }
  // Binary cross-entropy written with the logit z (the number before the final sigmoid), so it never overflows:
  // -[y ln p + (1 - y) ln(1 - p)]  with  p = sigmoid(z)
  function bceLogit(z, y) { return Math.max(z, 0) - z * y + Math.log(1 + Math.exp(-Math.abs(z))); }
  function shuffle(a, rnd) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
  }
  function fmtLoss(v) { if (!isFinite(v)) return 'blew up'; if (v >= 100) return '> 99'; return v.toFixed(3); }
  function fmtPct(v) { return isFinite(v) ? Math.round(v * 100) + '%' : '—'; }
  function fmtInt(n) { try { return n.toLocaleString('en-IN'); } catch (e) { return String(n); } }
  function fmtW(w, lead) {
    var s = Math.abs(w).toFixed(2);
    if (lead) return (w < 0 ? '−' : '') + s;
    return (w < 0 ? ' − ' : ' + ') + s;
  }
  function fmtNum(v) { return v >= 1 ? String(v) : String(+v.toPrecision(2)); }

  /* ---------- datasets: 300 points in the square −1..1 x −1..1, 200 for training, 100 held back for testing ---------- */
  function makeData(id) {
    var seeds = { line: 11, circle: 23, xor: 37, spiral: 41 };
    var rnd = mulberry32(seeds[id] * 7919 + 1);
    var pts = [], i;
    function cl(v) { return clamp(v, -0.98, 0.98); }
    if (id === 'line') {
      for (i = 0; i < N_TOTAL; i++) {
        var s = i % 2 ? 1 : -1;
        pts.push({ x: cl(s * 0.42 + gauss(rnd) * 0.24), y: cl(s * 0.38 + gauss(rnd) * 0.24), c: i % 2 });
      }
    } else if (id === 'circle') {
      for (i = 0; i < N_TOTAL; i++) {
        var inner = i % 2 === 1;
        var r = inner ? 0.45 * Math.sqrt(rnd()) : 0.62 + 0.33 * rnd();
        var a = 2 * Math.PI * rnd();
        pts.push({ x: cl(r * Math.cos(a) + gauss(rnd) * 0.035), y: cl(r * Math.sin(a) + gauss(rnd) * 0.035), c: inner ? 1 : 0 });
      }
    } else if (id === 'xor') {
      for (i = 0; i < N_TOTAL; i++) {
        var px = rnd() * 1.9 - 0.95, py = rnd() * 1.9 - 0.95;
        px += px > 0 ? 0.05 : -0.05; py += py > 0 ? 0.05 : -0.05; // small gap along the axes
        pts.push({ x: cl(px), y: cl(py), c: px * py > 0 ? 1 : 0 });
      }
    } else {
      for (i = 0; i < N_TOTAL; i++) {
        var cls = i % 2, t = rnd();
        var rr = 0.08 + 0.86 * t;
        var th = t * 1.5 * 2 * Math.PI + (cls ? Math.PI : 0); // one and a half turns
        pts.push({ x: cl(rr * Math.cos(th) + gauss(rnd) * 0.03), y: cl(rr * Math.sin(th) + gauss(rnd) * 0.03), c: cls });
      }
    }
    shuffle(pts, rnd);
    return { train: pts.slice(0, N_TRAIN), test: pts.slice(N_TRAIN) };
  }

  /* ---------- the neural network ---------- */
  // sizes like [2, 4, 1] = 2 inputs, one hidden layer of 4 neurons, 1 output neuron.
  function Net(sizes, act, seed) {
    var rnd = mulberry32(seed);
    this.sizes = sizes.slice();
    this.act = act;
    this.actId = act === 'tanh' ? 0 : act === 'relu' ? 1 : 2;
    this.L = sizes.length - 1;
    this.W = []; this.b = []; this.gW = []; this.gb = []; this.z = []; this.a = []; this.d = [];
    for (var l = 0; l < this.L; l++) {
      var nin = sizes[l], nout = sizes[l + 1], isOut = l === this.L - 1;
      var relu = !isOut && act === 'relu';
      // He initialisation for ReLU layers, Xavier (Glorot) for tanh, sigmoid and the output layer
      var std = relu ? Math.sqrt(2 / nin) : Math.sqrt(2 / (nin + nout));
      var W = new Float64Array(nout * nin), b = new Float64Array(nout);
      for (var k = 0; k < W.length; k++) W[k] = gauss(rnd) * std;
      if (relu) b.fill(0.05); // a small positive bias so fewer ReLU neurons start out "dead"
      this.W.push(W); this.b.push(b);
      this.gW.push(new Float64Array(nout * nin)); this.gb.push(new Float64Array(nout));
    }
    for (l = 0; l <= this.L; l++) {
      this.z.push(new Float64Array(sizes[l])); this.a.push(new Float64Array(sizes[l])); this.d.push(new Float64Array(sizes[l]));
    }
  }
  // Forward pass: every neuron = activation(weighted sum of the previous layer + bias). Returns the output logit.
  Net.prototype.forward = function (x1, x2) {
    var a0 = this.a[0], L = this.L, actId = this.actId;
    a0[0] = x1; a0[1] = x2;
    for (var l = 0; l < L; l++) {
      var nin = this.sizes[l], nout = this.sizes[l + 1], W = this.W[l], b = this.b[l];
      var ain = this.a[l], z = this.z[l + 1], aout = this.a[l + 1], isOut = l === L - 1;
      for (var j = 0; j < nout; j++) {
        var s = b[j], row = j * nin;
        for (var i = 0; i < nin; i++) s += W[row + i] * ain[i];
        z[j] = s;
        if (isOut) aout[j] = sigmoid(s);
        else if (actId === 0) aout[j] = Math.tanh(s);
        else if (actId === 1) aout[j] = s > 0 ? s : 0;
        else aout[j] = 1 / (1 + Math.exp(-s));
      }
    }
    return this.z[L][0];
  };
  // One mini-batch of gradient descent. Backpropagation = the chain rule, applied layer by layer from the output back.
  Net.prototype.trainBatch = function (pts, idx, from, to, lr, l2) {
    var L = this.L, actId = this.actId, l, i, j, k;
    for (l = 0; l < L; l++) { this.gW[l].fill(0); this.gb[l].fill(0); }
    for (var q = from; q < to; q++) {
      var p = pts[idx[q]];
      var zo = this.forward(p.x, p.y);
      this.d[L][0] = sigmoid(zo) - p.c; // d(loss)/d(logit) for sigmoid + cross-entropy
      for (l = L - 1; l >= 0; l--) {
        var nin = this.sizes[l], nout = this.sizes[l + 1], W = this.W[l], gW = this.gW[l], gb = this.gb[l];
        var dout = this.d[l + 1], ain = this.a[l];
        for (j = 0; j < nout; j++) {
          var dj = dout[j], row = j * nin;
          gb[j] += dj;
          for (i = 0; i < nin; i++) gW[row + i] += dj * ain[i];
        }
        if (l > 0) {
          var din = this.d[l], zin = this.z[l];
          for (i = 0; i < nin; i++) {
            var s = 0;
            for (j = 0; j < nout; j++) s += W[j * nin + i] * dout[j];
            var ai = ain[i];
            din[i] = s * (actId === 0 ? 1 - ai * ai : actId === 1 ? (zin[i] > 0 ? 1 : 0) : ai * (1 - ai));
          }
        }
      }
    }
    var n = to - from;
    for (l = 0; l < L; l++) {
      var W2 = this.W[l], gW2 = this.gW[l], b2 = this.b[l], gb2 = this.gb[l];
      // L2 penalty (lambda / 2) * sum(w^2) adds lambda * w to each weight's gradient (biases are not penalised)
      for (k = 0; k < W2.length; k++) W2[k] -= lr * (gW2[k] / n + l2 * W2[k]);
      for (k = 0; k < b2.length; k++) b2[k] -= lr * gb2[k] / n;
    }
  };
  // Average loss and accuracy. alive (optional) records which ReLU neurons ever output more than 0.
  Net.prototype.evaluate = function (pts, alive) {
    var loss = 0, correct = 0, L = this.L;
    for (var i = 0; i < pts.length; i++) {
      var z = this.forward(pts[i].x, pts[i].y);
      loss += bceLogit(z, pts[i].c);
      if ((z > 0 ? 1 : 0) === pts[i].c) correct++;
      if (alive) {
        for (var l = 1; l < L; l++) {
          var a = this.a[l], al = alive[l - 1];
          for (var j = 0; j < a.length; j++) if (a[j] > 0) al[j] = 1;
        }
      }
    }
    return { loss: loss / pts.length, acc: correct / pts.length };
  };

  /* ---------- colours (read from the site's CSS variables at draw time) ---------- */
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
  function luminance(c) {
    function ch(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2]);
  }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a == null ? 1 : a) + ')'; }
  var VARS = ['--surface', '--surface-2', '--ink', '--muted', '--line', '--indigo', '--haldi', '--series-1', '--series-2', '--series-4', '--bad', '--font-body'];
  var themeCache = { key: '', T: null };
  function readTheme() {
    var cs = getComputedStyle(document.documentElement), raw = {}, key = '';
    for (var i = 0; i < VARS.length; i++) { raw[VARS[i]] = cs.getPropertyValue(VARS[i]).trim(); key += raw[VARS[i]] + '|'; }
    if (themeCache.key === key && themeCache.T) return themeCache.T;
    var T = {
      surface: toRgb(raw['--surface']), surface2: toRgb(raw['--surface-2']), ink: toRgb(raw['--ink']), muted: toRgb(raw['--muted']),
      line: toRgb(raw['--line']), indigo: toRgb(raw['--indigo']), haldi: toRgb(raw['--haldi']),
      c1: toRgb(raw['--series-1']), c0: toRgb(raw['--series-2']), test: toRgb(raw['--series-4']), bad: toRgb(raw['--bad']),
      font: raw['--font-body'] || 'system-ui, sans-serif'
    };
    T.dark = luminance(T.surface) < 0.2;
    T.strength = T.dark ? 0.6 : 0.55;
    themeCache = { key: key, T: T };
    return T;
  }
  // value v in −1..1  →  orange (negative) … page surface (0) … blue (positive)
  function paint(img, vals, count, fn, T, strength) {
    var d = img.data, s = T.surface, c1 = T.c1, c0 = T.c0;
    for (var k = 0; k < count; k++) {
      var v = fn(vals[k]);
      if (!(v === v)) v = 0;
      v = clamp(v, -1, 1);
      var c = v >= 0 ? c1 : c0, t = Math.pow(Math.abs(v), 0.85) * strength, o = k * 4;
      d[o] = s[0] + (c[0] - s[0]) * t;
      d[o + 1] = s[1] + (c[1] - s[1]) * t;
      d[o + 2] = s[2] + (c[2] - s[2]) * t;
      d[o + 3] = 255;
    }
  }
  function roundRect(g, x, y, w, h, r) {
    g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.arcTo(x + w, y, x + w, y + r, r);
    g.lineTo(x + w, y + h - r); g.arcTo(x + w, y + h, x + w - r, y + h, r);
    g.lineTo(x + r, y + h); g.arcTo(x, y + h, x, y + h - r, r);
    g.lineTo(x, y + r); g.arcTo(x, y, x + r, y, r); g.closePath();
  }
  function pill(g, T, text, x, y, align, size) {
    g.font = '600 ' + size + 'px ' + T.font;
    var w = g.measureText(text).width + 12, h = size + 8;
    var left = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
    g.beginPath(); roundRect(g, left, y, w, h, 5);
    g.fillStyle = rgba(T.surface, 0.9); g.fill();
    g.strokeStyle = rgba(T.line); g.lineWidth = 1; g.stroke();
    g.fillStyle = rgba(T.ink); g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText(text, left + 6, y + h / 2 + 0.5);
    return { x: left, y: y, w: w, h: h };
  }
  // Marching squares: draw the line where vals crosses `level` (vals sampled at cell centres of an n x n grid).
  function contour(g, vals, n, W, H, level) {
    var sx = W / n, sy = H / n;
    function f(p, q) { return p / (p - q); }
    g.beginPath();
    for (var j = 0; j < n - 1; j++) {
      for (var i = 0; i < n - 1; i++) {
        var a = vals[j * n + i] - level, b = vals[j * n + i + 1] - level;
        var c = vals[(j + 1) * n + i + 1] - level, d = vals[(j + 1) * n + i] - level;
        var idx = (a > 0 ? 8 : 0) | (b > 0 ? 4 : 0) | (c > 0 ? 2 : 0) | (d > 0 ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        var x0 = (i + 0.5) * sx, y0 = (j + 0.5) * sy, e = [];
        var T = (a > 0) !== (b > 0) ? [x0 + sx * f(a, b), y0] : null;
        var R = (b > 0) !== (c > 0) ? [x0 + sx, y0 + sy * f(b, c)] : null;
        var B = (d > 0) !== (c > 0) ? [x0 + sx * f(d, c), y0 + sy] : null;
        var Lf = (a > 0) !== (d > 0) ? [x0, y0 + sy * f(a, d)] : null;
        if (idx === 5 || idx === 10) {
          var m = (a + b + c + d) / 4;
          if ((idx === 10) === (m > 0)) e = [T, R, B, Lf]; else e = [T, Lf, R, B];
        } else {
          if (T) e.push(T); if (R) e.push(R); if (B) e.push(B); if (Lf) e.push(Lf);
        }
        for (var k = 0; k + 1 < e.length; k += 2) { g.moveTo(e[k][0], e[k][1]); g.lineTo(e[k + 1][0], e[k + 1][1]); }
      }
    }
    g.stroke();
  }
  function niceStep(range, target) {
    var raw = range / Math.max(1, target), p = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), m = raw / p;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
  }

  var ICON_PLAY = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false" style="flex:none"><path d="M3 1.5v11l9-5.5z" fill="currentColor"/></svg>';
  var ICON_PAUSE = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false" style="flex:none"><path d="M2.5 1.5h3v11h-3zM8.5 1.5h3v11h-3z" fill="currentColor"/></svg>';

  /* ================================================================ */
  function mount(root, ctx) {
    var P = 'nn' + (++mountCount) + '-';
    var listeners = [];
    function on(el, type, fn, opts) { el.addEventListener(type, fn, opts); listeners.push([el, type, fn, opts]); }
    var destroyed = false;

    function seg(name, items, current) {
      return items.map(function (it) {
        return '<button type="button" data-' + name + '="' + it[0] + '" aria-pressed="' + (it[0] === current ? 'true' : 'false') + '">' + it[1] + '</button>';
      }).join('');
    }
    var tasksHtml = TASKS.map(function (t) { return '<li data-task="' + t.id + '">' + t.text + '</li>'; }).join('');
    function svgDot(shape, cssVar, ring) {
      var stroke = ring ? ' stroke="currentColor" stroke-width="2"' : '';
      var body = shape === 'sq' ? '<rect x="3" y="3" width="10" height="10" style="fill:var(' + cssVar + ')"' + stroke + '/>' : '<circle cx="8" cy="8" r="5.2" style="fill:var(' + cssVar + ')"' + stroke + '/>';
      return '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false" style="flex:none;vertical-align:-3px;color:var(--ink)">' + body + '</svg>';
    }
    function legendItem(svg, text) { return '<span style="display:inline-flex;align-items:center;gap:5px">' + svg + text + '</span>'; }
    function lineSwatch(cssVar, dashed) {
      return '<svg width="22" height="10" viewBox="0 0 22 10" aria-hidden="true" focusable="false" style="flex:none"><line x1="1" y1="5" x2="21" y2="5" style="stroke:var(' + cssVar + ')" stroke-width="' + (dashed ? 1.5 : 2.5) + '"' + (dashed ? ' stroke-dasharray="3 3"' : '') + ' stroke-linecap="round"/></svg>';
    }
    var canvasWrapStyle = 'aspect-ratio:1 / 1';

    root.innerHTML =
      '<div class="lab">' +
        '<p class="lab-note"><strong>What you are seeing:</strong> every dot is a point with two numbers, x₁ (left to right) and x₂ (bottom to top), and a colour: blue or orange. ' +
        'The neural network gets only the two numbers and must learn the colour. The shaded background is its current guess for every spot, and the dark line is its <em>decision boundary</em> (where it is 50/50 unsure). ' +
        'In the diagram, each square is a <em>neuron</em> (a tiny calculator: it multiplies its inputs by <em>weights</em>, adds them up with a <em>bias</em>, then squashes the result with an <em>activation</em> function). ' +
        'Training repeats: guess, measure how wrong (the <em>loss</em>), work out which way to nudge every weight (<em>backpropagation</em>), nudge a little.</p>' +
        '<div class="lab-body">' +
          '<div class="stack-sm">' +
            '<div class="row-between">' +
              '<div class="row">' +
                '<button type="button" class="btn btn-primary" id="' + P + 'play" style="min-width:6.6em">' + ICON_PLAY + '<span>Play</span></button>' +
                '<button type="button" class="btn" id="' + P + 'step">Step</button>' +
                '<button type="button" class="btn" id="' + P + 'reset">Reset</button>' +
              '</div>' +
              '<div class="row small"><span class="muted" id="' + P + 'splbl">Speed</span>' +
                '<div class="seg" role="group" aria-labelledby="' + P + 'splbl">' + seg('speed', [['0', '1×'], ['1', '3×'], ['2', '10×']], '1') + '</div></div>' +
            '</div>' +
            '<div class="lab-stats" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr))">' +
              '<div class="stat"><div class="k">Epoch</div><div class="v" id="' + P + 'epoch">0</div></div>' +
              '<div class="stat"><div class="k">Train loss</div><div class="v" id="' + P + 'trl">—</div></div>' +
              '<div class="stat"><div class="k">Test loss</div><div class="v" id="' + P + 'tel">—</div></div>' +
              '<div class="stat"><div class="k">Test accuracy</div><div class="v" id="' + P + 'acc">—</div></div>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:12px;align-items:start">' +
              '<div class="stack-sm">' +
                '<div class="lab-canvas-wrap" id="' + P + 'mwrap" style="' + canvasWrapStyle + '"><canvas id="' + P + 'map" role="img" aria-label="Map of the data points with the network’s prediction shaded behind them"></canvas></div>' +
                '<div class="lab-legend">' +
                  legendItem(svgDot('ci', '--series-1'), 'Blue') + legendItem(svgDot('sq', '--series-2'), 'Orange') +
                  legendItem(svgDot('ci', '--surface-2', true), 'Outlined = test point') +
                '</div>' +
                '<p class="kbd-hint">Point at (or tap) the map to ask the network about any spot.</p>' +
              '</div>' +
              '<div class="stack-sm">' +
                '<div class="lab-canvas-wrap" id="' + P + 'dwrap" style="' + canvasWrapStyle + '"><canvas id="' + P + 'net" role="img" tabindex="0" style="touch-action:pan-y;outline-offset:-3px" aria-label="Network diagram"></canvas></div>' +
                '<div class="lab-legend">' + legendItem(lineSwatch('--series-1'), 'Positive weight') + legendItem(lineSwatch('--series-2'), 'Negative weight') + '<span style="display:inline">Thicker = stronger</span></div>' +
                '<p class="small muted" id="' + P + 'ncap" style="min-height:3em"></p>' +
              '</div>' +
            '</div>' +
            '<p class="small" id="' + P + 'msg" role="status" aria-live="polite" style="min-height:3em"></p>' +
            '<div class="lab-canvas-wrap" id="' + P + 'lwrap" style="aspect-ratio:auto;height:170px"><canvas id="' + P + 'loss" role="img" style="touch-action:pan-y" aria-label="Loss curve: training and test loss after every epoch"></canvas></div>' +
            '<div class="lab-legend">' + legendItem(lineSwatch('--ink'), 'Train loss') + legendItem(lineSwatch('--series-4'), 'Test loss') + legendItem(lineSwatch('--muted', true), '0.69 = coin-toss guessing') + '</div>' +
            '<p class="small muted"><strong style="color:var(--ink)">Loss</strong> = how wrong the predictions are (binary cross-entropy: 0 is perfect). <strong style="color:var(--ink)">Epoch</strong> = one pass over all 200 training points, in mini-batches (small groups) of 10. <strong style="color:var(--ink)">Test points</strong> = 100 points the network never trains on, so test accuracy shows whether it really learned the pattern.</p>' +
          '</div>' +
          '<div class="lab-controls">' +
            '<div class="control"><span class="control-label" id="' + P + 'dslbl">Data</span>' +
              '<div class="seg" role="group" aria-labelledby="' + P + 'dslbl">' + seg('ds', DATASETS.map(function (d) { return [d.id, d.name]; }), 'circle') + '</div>' +
              '<p class="small muted" id="' + P + 'dsdesc"></p></div>' +
            '<div class="control"><span class="control-label" id="' + P + 'hllbl">Hidden layers</span>' +
              '<div class="seg" role="group" aria-labelledby="' + P + 'hllbl">' + seg('layers', [['0', '0'], ['1', '1'], ['2', '2']], '1') + '</div>' +
              '<p class="small muted">Layers of neurons between the inputs and the output.</p></div>' +
            '<div class="control" id="' + P + 'n1c"><label for="' + P + 'n1">Neurons in hidden layer 1 <output id="' + P + 'n1out" for="' + P + 'n1">4</output></label>' +
              '<input type="range" id="' + P + 'n1" min="1" max="8" step="1" value="4"></div>' +
            '<div class="control" id="' + P + 'n2c"><label for="' + P + 'n2">Neurons in hidden layer 2 <output id="' + P + 'n2out" for="' + P + 'n2">4</output></label>' +
              '<input type="range" id="' + P + 'n2" min="1" max="8" step="1" value="4"></div>' +
            '<div class="control"><span class="control-label" id="' + P + 'actlbl">Activation</span>' +
              '<div class="seg" role="group" aria-labelledby="' + P + 'actlbl">' + seg('act', ACTS.map(function (a) { return [a.id, a.name]; }), 'tanh') + '</div>' +
              '<p class="small muted" id="' + P + 'actdesc"></p></div>' +
            '<div class="control"><label for="' + P + 'lr">Learning rate <output id="' + P + 'lrout" for="' + P + 'lr">0.1</output></label>' +
              '<input type="range" id="' + P + 'lr" min="0" max="' + (LRS.length - 1) + '" step="1" value="4">' +
              '<p class="small muted">How big a step every weight takes after each mini-batch. Too small: slow. Too big: chaos.</p></div>' +
            '<div class="control"><label for="' + P + 'l2">L2 regularisation <output id="' + P + 'l2out" for="' + P + 'l2">off</output></label>' +
              '<input type="range" id="' + P + 'l2" min="0" max="' + (L2S.length - 1) + '" step="1" value="0">' +
              '<p class="small muted">A small penalty for big weights (also called weight decay). It keeps the boundary smooth, but too much stops the network learning.</p></div>' +
            '<div class="row small"><input type="checkbox" id="' + P + 'showtest" checked><label for="' + P + 'showtest">Show test points</label></div>' +
            '<div class="stack-sm"><h4>Your tasks</h4><ul class="lab-tasks" id="' + P + 'tasks">' + tasksHtml + '</ul></div>' +
          '</div>' +
        '</div>' +
        '<p class="small muted"><strong style="color:var(--ink)">Why it matters in real ML:</strong> every deep-learning model, from the one that reads handwritten cheque amounts at a bank to the one that understands spoken Hindi, is trained with exactly this loop (forward pass, loss, backpropagation, small weight updates), and choosing the depth, activation and learning rate is everyday work for ML engineers.</p>' +
      '</div>';

    function $(id) { return root.querySelector('#' + P + id); }
    var mwrap = $('mwrap'), dwrap = $('dwrap'), lwrap = $('lwrap');
    var mcan = $('map'), dcan = $('net'), lcan = $('loss');
    var gm = mcan.getContext('2d'), gd = dcan.getContext('2d'), gl = lcan.getContext('2d');
    var btnPlay = $('play'), btnStep = $('step'), btnReset = $('reset');
    var elEpoch = $('epoch'), elTrl = $('trl'), elTel = $('tel'), elAcc = $('acc'), elMsg = $('msg'), elNcap = $('ncap');
    var elDsDesc = $('dsdesc'), elActDesc = $('actdesc');
    var elN1 = $('n1'), elN2 = $('n2'), elN1out = $('n1out'), elN2out = $('n2out'), elN1c = $('n1c'), elN2c = $('n2c');
    var elLr = $('lr'), elLrOut = $('lrout'), elL2 = $('l2'), elL2Out = $('l2out'), elShowTest = $('showtest');
    var taskEls = {};
    Array.prototype.forEach.call(root.querySelectorAll('[data-task]'), function (li) { taskEls[li.getAttribute('data-task')] = li; });

    /* ---------- state ---------- */
    var S = {
      ds: 'circle', layers: 1, n1: 4, n2: 4, act: 'tanh', lrIdx: 4, l2Idx: 0, speedIdx: 1, showTest: true,
      data: null, net: null, seedCounter: 0, trainRnd: null, idx: [],
      epoch: 0, trainLoss: NaN, testLoss: NaN, testAcc: NaN, trainAcc: NaN, diverged: false, dead: [],
      hist: { ep: [], tr: [], te: [] }, stride: 1,
      playing: false, sel: null, cursor: { c: 0, j: 0 }, netFocused: false, kbFocus: false,
      probe: null, hoverNode: null, msgKey: ''
    };
    var done = {};
    var dims = { dpr: 1, mw: 1, mh: 1, dw: 1, dh: 1, lw: 1, lh: 1 };
    var rafId = 0, gridDirty = true;
    var grid = { n: 0, vals: null, img: null, off: document.createElement('canvas'), key: '' };
    var thumbs = { vals: null, max: null, img: null, off: document.createElement('canvas') };
    thumbs.off.width = THUMB; thumbs.off.height = THUMB;

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

    /* ---------- building and training ---------- */
    function sizes() {
      var s = [2];
      if (S.layers >= 1) s.push(S.n1);
      if (S.layers >= 2) s.push(S.n2);
      s.push(1);
      return s;
    }
    function buildNet() {
      S.seedCounter++;
      var seed = (S.seedCounter * 2654435761 + 97) >>> 0;
      S.net = new Net(sizes(), S.act, seed);
      S.trainRnd = mulberry32((seed ^ 0x5bd1e995) >>> 0);
      S.idx = [];
      for (var i = 0; i < S.data.train.length; i++) S.idx.push(i);
      S.epoch = 0; S.diverged = false; S.stride = 1;
      S.hist = { ep: [], tr: [], te: [] };
      S.sel = null; S.hoverNode = null;
      S.cursor = { c: S.net.L, j: 0 };
      measure();
      record();
      gridDirty = true;
    }
    function measure() {
      var net = S.net, alive = null;
      if (net.actId === 1 && net.L > 1) {
        alive = [];
        for (var l = 1; l < net.L; l++) alive.push(new Uint8Array(net.sizes[l]));
      }
      var tr = net.evaluate(S.data.train, alive), te = net.evaluate(S.data.test);
      S.trainLoss = tr.loss; S.trainAcc = tr.acc; S.testLoss = te.loss; S.testAcc = te.acc;
      S.dead = [];
      if (alive) {
        alive.forEach(function (al) { var dcount = 0; for (var j = 0; j < al.length; j++) if (!al[j]) dcount++; S.dead.push(dcount); });
      }
      if (!isFinite(S.trainLoss) || !isFinite(S.testLoss)) S.diverged = true;
    }
    function record() {
      if (S.epoch % S.stride !== 0) return;
      var h = S.hist;
      h.ep.push(S.epoch); h.tr.push(S.trainLoss); h.te.push(S.testLoss);
      if (h.ep.length > HIST_MAX) {
        var ne = [], nt = [], nv = [];
        for (var i = 0; i < h.ep.length; i += 2) { ne.push(h.ep[i]); nt.push(h.tr[i]); nv.push(h.te[i]); }
        S.hist = { ep: ne, tr: nt, te: nv };
        S.stride *= 2;
      }
    }
    function trainEpoch(check) {
      if (S.diverged) return;
      var net = S.net, lr = LRS[S.lrIdx], l2 = L2S[S.l2Idx], idx = S.idx, n = idx.length;
      shuffle(idx, S.trainRnd);
      for (var s = 0; s < n; s += BATCH) net.trainBatch(S.data.train, idx, s, Math.min(n, s + BATCH), lr, l2);
      S.epoch++;
      measure();
      record();
      gridDirty = true;
      if (S.diverged) setPlaying(false);
      if (check) checkTasks();
    }
    function checkTasks() {
      var lr = LRS[S.lrIdx];
      if (S.ds === 'circle' && S.layers === 0 && S.epoch >= 200 && S.testAcc < 0.75) completeTask('t1');
      if (S.ds === 'xor' && S.layers === 1 && S.testAcc >= 0.95) completeTask('t2');
      if (S.ds === 'spiral' && S.testAcc >= 0.9) completeTask('t3');
      if (lr >= 1 && (S.diverged || S.trainLoss > 1.5)) completeTask('t4');
    }

    /* ---------- grids for the map and the neuron pictures ---------- */
    function selCol() { return S.sel ? S.sel.c : S.net.L; }
    function selIdx() { return S.sel ? S.sel.j : 0; }
    function computeGrid() {
      var n = clamp(Math.round(dims.mw / 6), 30, 64);
      if (grid.n !== n) {
        grid.n = n; grid.vals = new Float32Array(n * n); grid.off.width = n; grid.off.height = n;
        grid.img = grid.off.getContext('2d').createImageData(n, n);
      }
      var net = S.net, c = selCol(), j = selIdx(), vals = grid.vals, mx = 0;
      for (var r = 0; r < n; r++) {
        var y = 1 - (r + 0.5) * 2 / n;
        for (var q = 0; q < n; q++) {
          net.forward(-1 + (q + 0.5) * 2 / n, y);
          var v = net.a[c][j];
          vals[r * n + q] = v;
          if (v > mx) mx = v;
        }
      }
      grid.max = mx;
      // thumbnails for every neuron (one forward pass per thumbnail pixel gives all of them at once)
      var sz = net.sizes, cols = sz.length;
      if (!thumbs.vals || thumbs.vals.length !== cols || thumbs.vals.some(function (col, ci) { return col.length !== sz[ci]; })) {
        thumbs.vals = []; thumbs.max = [];
        for (var ci = 0; ci < cols; ci++) {
          var arr = [], mm = [];
          for (var k = 0; k < sz[ci]; k++) { arr.push(new Float32Array(THUMB * THUMB)); mm.push(0); }
          thumbs.vals.push(arr); thumbs.max.push(mm);
        }
        thumbs.img = thumbs.off.getContext('2d').createImageData(THUMB, THUMB);
      }
      for (ci = 0; ci < cols; ci++) for (k = 0; k < sz[ci]; k++) thumbs.max[ci][k] = 0;
      for (r = 0; r < THUMB; r++) {
        var ty = 1 - (r + 0.5) * 2 / THUMB;
        for (q = 0; q < THUMB; q++) {
          net.forward(-1 + (q + 0.5) * 2 / THUMB, ty);
          for (ci = 0; ci < cols; ci++) {
            var a = net.a[ci], tv = thumbs.vals[ci], tm = thumbs.max[ci];
            for (k = 0; k < a.length; k++) { tv[k][r * THUMB + q] = a[k]; if (a[k] > tm[k]) tm[k] = a[k]; }
          }
        }
      }
      gridDirty = false;
    }
    // turn a raw neuron value into −1..1 for colouring
    function normFn(c, maxv) {
      var net = S.net;
      if (c === 0) return function (v) { return v; };
      if (c === net.L) return function (v) { return 2 * v - 1; };
      if (net.actId === 0) return function (v) { return v; };
      if (net.actId === 2) return function (v) { return 2 * v - 1; };
      return function (v) { return maxv > 1e-9 ? v / maxv : 0; };
    }
    function neuronName(c, j) {
      var net = S.net;
      if (c === 0) return j === 0 ? 'input x₁' : 'input x₂';
      if (c === net.L) return 'the output neuron';
      return (net.L > 2 ? 'layer ' + c + ', ' : 'hidden layer, ') + 'neuron ' + (j + 1);
    }

    /* ---------- sizes ---------- */
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      dims.dpr = dpr;
      var r = mwrap.getBoundingClientRect();
      dims.mw = Math.max(1, Math.round(r.width)); dims.mh = Math.max(1, Math.round(r.height));
      mcan.width = Math.round(dims.mw * dpr); mcan.height = Math.round(dims.mh * dpr);
      r = dwrap.getBoundingClientRect();
      dims.dw = Math.max(1, Math.round(r.width)); dims.dh = Math.max(1, Math.round(r.height));
      dcan.width = Math.round(dims.dw * dpr); dcan.height = Math.round(dims.dh * dpr);
      r = lwrap.getBoundingClientRect();
      dims.lw = Math.max(1, Math.round(r.width)); dims.lh = Math.max(1, Math.round(r.height));
      lcan.width = Math.round(dims.lw * dpr); lcan.height = Math.round(dims.lh * dpr);
      gridDirty = true;
      requestDraw();
    }

    /* ---------- drawing: the map ---------- */
    function toPx(x, y) { return { x: (x + 1) / 2 * dims.mw, y: (1 - y) / 2 * dims.mh }; }
    function drawMap(T) {
      var g = gm, W = dims.mw, H = dims.mh, net = S.net, c = selCol(), j = selIdx();
      g.setTransform(dims.dpr, 0, 0, dims.dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.fillStyle = rgba(T.surface); g.fillRect(0, 0, W, H);
      if (!S.diverged) {
        paint(grid.img, grid.vals, grid.n * grid.n, normFn(c, grid.max), T, T.strength);
        grid.off.getContext('2d').putImageData(grid.img, 0, 0);
        g.imageSmoothingEnabled = true;
        g.drawImage(grid.off, 0, 0, W, H);
      }
      // faint axes through the middle
      g.strokeStyle = rgba(T.ink, 0.12); g.lineWidth = 1;
      g.beginPath(); g.moveTo(W / 2 + 0.5, 0); g.lineTo(W / 2 + 0.5, H); g.moveTo(0, H / 2 + 0.5); g.lineTo(W, H / 2 + 0.5); g.stroke();
      // decision boundary: where the network says exactly 50/50
      if (!S.diverged && c === net.L) {
        g.strokeStyle = rgba(T.ink, T.dark ? 0.75 : 0.7); g.lineWidth = 1.8; g.lineJoin = 'round';
        contour(g, grid.vals, grid.n, W, H, 0.5);
      }
      // points
      var r = clamp(W / 95, 2.6, 4.4);
      function dot(p, isTest) {
        var q = toPx(p.x, p.y), col = p.c ? T.c1 : T.c0;
        g.beginPath();
        if (p.c) g.arc(q.x, q.y, r, 0, Math.PI * 2);
        else g.rect(q.x - r * 0.9, q.y - r * 0.9, r * 1.8, r * 1.8);
        g.fillStyle = rgba(col);
        g.fill();
        if (isTest) { g.lineWidth = 1.6; g.strokeStyle = rgba(T.ink); }
        else { g.lineWidth = 1; g.strokeStyle = rgba(T.surface, 0.95); }
        g.stroke();
      }
      var i, tr = S.data.train, te = S.data.test;
      for (i = 0; i < tr.length; i++) dot(tr[i], false);
      if (S.showTest) for (i = 0; i < te.length; i++) dot(te[i], true);
      // axis names
      var fs = W < 330 ? 11 : 12;
      g.font = '600 ' + fs + 'px ' + T.font; g.fillStyle = rgba(T.muted); g.textBaseline = 'alphabetic';
      g.textAlign = 'right'; g.fillText('x₁ →', W - 6, H / 2 - 5);
      g.textAlign = 'left'; g.fillText('↑ x₂', W / 2 + 5, fs + 4);
      if (S.diverged) {
        pill(g, T, 'Training blew up. Press Reset.', W / 2, H / 2 - 14, 'center', 13);
      } else if (S.sel && c !== net.L) {
        pill(g, T, 'Showing ' + neuronName(c, j), 6, 6, 'left', fs);
      }
      // probe: ask the network about one spot
      if (S.probe && !S.diverged) {
        var pr = S.probe, pp = toPx(pr.x, pr.y);
        net.forward(pr.x, pr.y);
        var text;
        if (c === net.L) {
          var pb = net.a[net.L][0];
          text = pb >= 0.5 ? 'Blue, ' + Math.round(pb * 100) + '% sure' : 'Orange, ' + Math.round((1 - pb) * 100) + '% sure';
        } else {
          text = 'Output ' + net.a[c][j].toFixed(2);
        }
        g.beginPath(); g.arc(pp.x, pp.y, 7, 0, Math.PI * 2);
        g.lineWidth = 4; g.strokeStyle = rgba(T.surface, 0.9); g.stroke();
        g.lineWidth = 2; g.strokeStyle = rgba(T.ink); g.stroke();
        g.font = '600 ' + fs + 'px ' + T.font;
        var tw = g.measureText(text).width + 12, bx = pp.x + 12, by = pp.y - 30;
        if (bx + tw > W - 4) bx = pp.x - 12 - tw;
        if (by < 4) by = pp.y + 12;
        pill(g, T, text, bx, by, 'left', fs);
      }
    }

    /* ---------- drawing: the network diagram ---------- */
    function layout() {
      var W = dims.dw, H = dims.dh, sz = S.net.sizes, cols = sz.length;
      var top = 30, bottom = 10, left = 30, right = 10;
      var maxN = Math.max.apply(null, sz), availH = H - top - bottom, colW = (W - left - right) / cols;
      var s = clamp(Math.min(colW * 0.5, availH / maxN * 0.76), 14, 46);
      var pitch = Math.min(s * 1.5, availH / maxN);
      var nodes = [];
      for (var c = 0; c < cols; c++) {
        var col = [], n = sz[c], x = left + colW * (c + 0.5) - s / 2;
        var y0 = top + availH / 2 - (n * pitch) / 2 + (pitch - s) / 2;
        for (var j = 0; j < n; j++) col.push({ x: x, y: y0 + j * pitch, s: s, c: c, j: j });
        nodes.push(col);
      }
      return { nodes: nodes, s: s, colW: colW, left: left, top: top };
    }
    function drawNet(T) {
      var g = gd, W = dims.dw, H = dims.dh, net = S.net, Lay = layout(), nodes = Lay.nodes, s = Lay.s;
      g.setTransform(dims.dpr, 0, 0, dims.dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.fillStyle = rgba(T.surface); g.fillRect(0, 0, W, H);
      var fs = W < 330 ? 11 : 12, cols = nodes.length;
      // column titles
      g.font = '600 ' + fs + 'px ' + T.font; g.fillStyle = rgba(T.muted); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      for (var c = 0; c < cols; c++) {
        var title = c === 0 ? 'Input' : c === cols - 1 ? 'Output' : (cols > 3 ? 'Layer ' + c : 'Hidden');
        g.fillText(title, nodes[c][0].x + s / 2, 18);
      }
      // weights
      var sel = S.sel, focusC = sel ? sel.c : -1, focusJ = sel ? sel.j : -1;
      var wScale = clamp(s / 34, 0.6, 1.2);
      for (var l = 0; l < net.L; l++) {
        var W8 = net.W[l], nin = net.sizes[l], from = nodes[l], to = nodes[l + 1];
        for (var jj = 0; jj < to.length; jj++) {
          for (var ii = 0; ii < nin; ii++) {
            var w = W8[jj * nin + ii];
            if (!isFinite(w)) continue;
            var aw = Math.abs(w);
            var hot = !sel || sel.c === net.L || (focusC === l && focusJ === ii) || (focusC === l + 1 && focusJ === jj);
            var alpha = (0.18 + 0.82 * Math.min(1, aw / 2)) * (hot ? 1 : 0.18);
            var x1 = from[ii].x + s, y1 = from[ii].y + s / 2, x2 = to[jj].x, y2 = to[jj].y + s / 2, mx = (x1 + x2) / 2;
            g.beginPath(); g.moveTo(x1, y1); g.bezierCurveTo(mx, y1, mx, y2, x2, y2);
            g.strokeStyle = rgba(w >= 0 ? T.c1 : T.c0, alpha);
            g.lineWidth = (0.6 + Math.min(aw, 3) * 1.3) * wScale;
            g.stroke();
          }
        }
      }
      // neurons with their pictures
      var tctx = thumbs.off.getContext('2d');
      for (c = 0; c < cols; c++) {
        for (var j = 0; j < nodes[c].length; j++) {
          var nd = nodes[c][j];
          g.save();
          g.beginPath(); roundRect(g, nd.x, nd.y, s, s, 4); g.clip();
          if (!S.diverged && thumbs.vals) {
            paint(thumbs.img, thumbs.vals[c][j], THUMB * THUMB, normFn(c, thumbs.max[c][j]), T, Math.min(1, T.strength * 1.3));
            tctx.putImageData(thumbs.img, 0, 0);
            g.imageSmoothingEnabled = true;
            g.drawImage(thumbs.off, nd.x, nd.y, s, s);
          } else { g.fillStyle = rgba(T.surface2); g.fillRect(nd.x, nd.y, s, s); }
          g.restore();
          var isSel = sel && sel.c === c && sel.j === j && c !== net.L;
          var isHover = S.hoverNode && S.hoverNode.c === c && S.hoverNode.j === j;
          g.beginPath(); roundRect(g, nd.x, nd.y, s, s, 4);
          g.lineWidth = isSel ? 2.5 : isHover ? 2 : 1;
          g.strokeStyle = isSel ? rgba(T.ink) : isHover ? rgba(T.indigo) : rgba(T.line);
          g.stroke();
          var deadNeuron = net.actId === 1 && c > 0 && c < net.L && S.deadMask && S.deadMask[c - 1] && S.deadMask[c - 1][j];
          if (deadNeuron) {
            g.font = '600 ' + Math.max(9, Math.round(s * 0.26)) + 'px ' + T.font; g.fillStyle = rgba(T.muted); g.textAlign = 'center'; g.textBaseline = 'middle';
            g.fillText('dead', nd.x + s / 2, nd.y + s / 2);
          }
        }
      }
      // input labels
      g.font = '600 ' + (fs + 1) + 'px ' + T.font; g.fillStyle = rgba(T.ink); g.textAlign = 'right'; g.textBaseline = 'middle';
      g.fillText('x₁', nodes[0][0].x - 6, nodes[0][0].y + s / 2);
      g.fillText('x₂', nodes[0][1].x - 6, nodes[0][1].y + s / 2);
      // keyboard focus ring
      if (S.kbFocus && S.netFocused) {
        var cur = nodes[S.cursor.c] && nodes[S.cursor.c][S.cursor.j];
        if (cur) {
          g.beginPath(); roundRect(g, cur.x - 4, cur.y - 4, s + 8, s + 8, 6);
          g.lineWidth = 3; g.strokeStyle = rgba(T.haldi); g.stroke();
        }
      }
    }

    /* ---------- drawing: the loss curve ---------- */
    function drawLoss(T) {
      var g = gl, W = dims.lw, H = dims.lh, h = S.hist;
      g.setTransform(dims.dpr, 0, 0, dims.dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.fillStyle = rgba(T.surface); g.fillRect(0, 0, W, H);
      var pl = 42, pr = 12, pt = 12, pb = 24, pw = Math.max(10, W - pl - pr), ph = Math.max(10, H - pt - pb);
      var ep = h.ep.slice(), tr = h.tr.slice(), te = h.te.slice();
      if (ep.length && ep[ep.length - 1] !== S.epoch) { ep.push(S.epoch); tr.push(S.trainLoss); te.push(S.testLoss); }
      var maxE = Math.max(10, S.epoch), maxL = 0;
      for (var i = 0; i < tr.length; i++) {
        if (isFinite(tr[i]) && tr[i] > maxL) maxL = tr[i];
        if (isFinite(te[i]) && te[i] > maxL) maxL = te[i];
      }
      var choices = [0.8, 1, 1.5, 2, 3, 4], yMax = 4;
      for (i = 0; i < choices.length; i++) if (maxL * 1.05 <= choices[i]) { yMax = choices[i]; break; }
      function X(e) { return pl + e / maxE * pw; }
      function Y(v) { return pt + (1 - v / yMax) * ph; }
      var fs = 11;
      g.font = fs + 'px ' + T.font; g.textBaseline = 'middle';
      // horizontal grid + y labels
      var ys = yMax <= 1 ? 0.2 : yMax <= 2 ? 0.5 : 1;
      g.strokeStyle = rgba(T.line); g.lineWidth = 1; g.fillStyle = rgba(T.muted); g.textAlign = 'right';
      for (var v = 0; v <= yMax + 1e-9; v += ys) {
        var yy = Math.round(Y(v)) + 0.5;
        g.beginPath(); g.moveTo(pl, yy); g.lineTo(pl + pw, yy); g.stroke();
        g.fillText(v.toFixed(ys < 1 ? 1 : 0), pl - 6, yy);
      }
      // x labels
      var xs = niceStep(maxE, W < 400 ? 3 : 6);
      g.textAlign = 'center'; g.textBaseline = 'top';
      for (var e = 0; e <= maxE + 1e-9; e += xs) g.fillText(fmtInt(Math.round(e)), clamp(X(e), pl + 6, pl + pw - 10), pt + ph + 6);
      g.save();
      g.translate(11, pt + ph / 2); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('loss', 0, 0);
      g.restore();
      // coin-toss line
      g.setLineDash([4, 4]); g.strokeStyle = rgba(T.muted, 0.8); g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(pl, Y(LN2)); g.lineTo(pl + pw, Y(LN2)); g.stroke();
      g.setLineDash([]);
      // curves (clipped to the plot; values above the top are cut off)
      g.save();
      g.beginPath(); g.rect(pl, pt - 1, pw, ph + 2); g.clip();
      function curve(arr, col, wdt) {
        g.beginPath();
        var started = false;
        for (var k = 0; k < ep.length; k++) {
          var val = arr[k];
          if (!isFinite(val)) { started = false; continue; }
          var px = X(ep[k]), py = Y(Math.min(val, yMax * 1.5));
          if (!started) { g.moveTo(px, py); started = true; } else g.lineTo(px, py);
        }
        g.strokeStyle = rgba(col); g.lineWidth = wdt; g.lineJoin = 'round'; g.stroke();
      }
      curve(te, T.test, 2);
      curve(tr, T.ink, 2);
      g.restore();
      if (maxL > yMax) {
        g.font = '600 ' + fs + 'px ' + T.font; g.fillStyle = rgba(T.bad); g.textAlign = 'right'; g.textBaseline = 'top';
        g.fillText('↑ loss went off the top of the chart', pl + pw - 4, pt + 2);
      }
      g.font = fs + 'px ' + T.font; g.fillStyle = rgba(T.muted); g.textAlign = 'right'; g.textBaseline = 'bottom';
      g.fillText('epochs', pl + pw, pt + ph - 3);
    }

    /* ---------- text updates ---------- */
    function setText(el, t) { if (el.textContent !== t) el.textContent = t; }
    function syncStats() {
      setText(elEpoch, fmtInt(S.epoch));
      setText(elTrl, fmtLoss(S.trainLoss));
      setText(elTel, fmtLoss(S.testLoss));
      setText(elAcc, fmtPct(S.testAcc));
      var label = 'Map of the ' + S.ds + ' data with the network’s prediction shaded behind the points. Test accuracy ' + fmtPct(S.testAcc) + '.';
      if (mcan.getAttribute('aria-label') !== label) mcan.setAttribute('aria-label', label);
      updateMessage();
      updateCaption();
    }
    function dsName() { return DATASETS.filter(function (d) { return d.id === S.ds; })[0].name; }
    function updateMessage() {
      var key, html, lr = LRS[S.lrIdx], deadAll = -1, l;
      for (l = 0; l < S.dead.length; l++) if (S.dead[l] === S.net.sizes[l + 1]) { deadAll = l; break; }
      if (S.diverged) {
        key = 'div'; html = '<b>Training diverged:</b> the steps were so big that the numbers blew up to infinity. Lower the learning rate and press <b>Reset</b>.';
      } else if (lr >= 1 && S.trainLoss > 1.5) {
        key = 'chaos'; html = '<b>Learning rate ' + fmtNum(lr) + ' is far too big.</b> Each step jumps right over the bottom of the valley, so the loss shoots up and down instead of falling.';
      } else if (deadAll >= 0) {
        key = 'dead'; html = '<b>Every ReLU neuron in hidden layer ' + (deadAll + 1) + ' is “dead”</b> (it outputs 0 for every point), so no signal gets through and nothing can learn. Lower the learning rate and press <b>Reset</b>.';
      } else if (S.layers === 0 && S.ds !== 'line' && S.epoch >= 100 && S.testAcc < 0.8) {
        key = 'lin'; html = '<b>Stuck.</b> With no hidden layer the network can only draw one straight line, and no straight line separates the ' + dsName() + ' data. Add a hidden layer.';
      } else if (S.epoch >= 150 && S.testLoss - S.trainLoss > 0.12 && S.trainLoss < 0.25) {
        key = 'over'; html = '<b>Test loss is clearly higher than train loss:</b> the network is starting to memorise the training points (overfitting). A little L2 regularisation can help.';
      } else if (S.testAcc >= 0.95 && S.epoch > 0) {
        key = 'solved'; html = '<b>Solved:</b> ' + fmtPct(S.testAcc) + ' of the test points (which it never trained on) are on the right side of the boundary.';
      } else if (S.playing) {
        key = 'play'; html = 'Training… in every epoch the network sees all 200 training points, 10 at a time, and nudges every weight a little after each group.';
      } else if (S.epoch === 0) {
        key = 'fresh'; html = 'A fresh network with random weights, so its guesses are close to 50/50. Press <b>Play</b> to train it, or <b>Step</b> to train one epoch at a time.';
      } else {
        key = 'paused'; html = 'Paused after ' + fmtInt(S.epoch) + ' epochs. Press <b>Play</b> to keep training, or <b>Step</b> for one more epoch.';
      }
      if (key !== S.msgKey) { S.msgKey = key; elMsg.innerHTML = html; }
    }
    function updateCaption() {
      var net = S.net, t;
      if (!S.sel || S.sel.c === net.L) {
        t = 'Each square is a neuron, showing what it outputs at every spot of the map (blue = high, orange = low). Tap one to see it full size.';
      } else {
        var c = S.sel.c, j = S.sel.j;
        if (c === 0) {
          t = j === 0 ? 'Input x₁ is just the left–right position of a point (−1 at the left edge, +1 at the right).' : 'Input x₂ is just the bottom–top position of a point (−1 at the bottom, +1 at the top).';
        } else {
          var nin = net.sizes[c - 1], W = net.W[c - 1], b = net.b[c - 1][j], fn = net.act;
          if (c === 1) {
            t = 'Shown on the map: ' + fn + '(' + fmtW(W[j * nin], true) + ' × x₁' + fmtW(W[j * nin + 1]) + ' × x₂' + fmtW(b) + '). One neuron in the first layer can only draw one straight edge.';
          } else {
            t = 'Shown on the map: ' + fn + '(weighted sum of the ' + nin + ' neurons before it' + fmtW(b) + '). It combines their simple edges into a more complex shape.';
          }
          t += ' Tap it again (or press Esc) to go back.';
        }
      }
      setText(elNcap, t);
    }
    function syncControls() {
      Array.prototype.forEach.call(root.querySelectorAll('[data-ds]'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-ds') === S.ds ? 'true' : 'false'); });
      Array.prototype.forEach.call(root.querySelectorAll('[data-layers]'), function (b) { b.setAttribute('aria-pressed', +b.getAttribute('data-layers') === S.layers ? 'true' : 'false'); });
      Array.prototype.forEach.call(root.querySelectorAll('[data-act]'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-act') === S.act ? 'true' : 'false'); });
      Array.prototype.forEach.call(root.querySelectorAll('[data-speed]'), function (b) { b.setAttribute('aria-pressed', +b.getAttribute('data-speed') === S.speedIdx ? 'true' : 'false'); });
      setText(elDsDesc, DATASETS.filter(function (d) { return d.id === S.ds; })[0].desc);
      setText(elActDesc, ACTS.filter(function (a) { return a.id === S.act; })[0].desc);
      elN1.disabled = S.layers < 1; elN2.disabled = S.layers < 2;
      elN1c.style.opacity = S.layers < 1 ? '0.5' : ''; elN2c.style.opacity = S.layers < 2 ? '0.5' : '';
      setText(elN1out, S.layers < 1 ? 'not used' : String(S.n1));
      setText(elN2out, S.layers < 2 ? 'not used' : String(S.n2));
      var lr = fmtNum(LRS[S.lrIdx]);
      setText(elLrOut, lr); elLr.setAttribute('aria-valuetext', lr);
      var l2 = L2S[S.l2Idx] ? fmtNum(L2S[S.l2Idx]) : 'off';
      setText(elL2Out, l2); elL2.setAttribute('aria-valuetext', l2);
      btnPlay.innerHTML = (S.playing ? ICON_PAUSE : ICON_PLAY) + '<span>' + (S.playing ? 'Pause' : 'Play') + '</span>';
      btnPlay.disabled = S.diverged; btnStep.disabled = S.diverged;
      var sz = S.net.sizes, desc = 'Network diagram: 2 inputs';
      for (var l = 1; l < sz.length - 1; l++) desc += ', hidden layer ' + l + ' with ' + sz[l] + ' neuron' + (sz[l] > 1 ? 's' : '');
      desc += ', 1 output. Use the arrow keys to pick a neuron and show it on the map; Escape goes back.';
      if (dcan.getAttribute('aria-label') !== desc) dcan.setAttribute('aria-label', desc);
    }

    /* ---------- render loop ---------- */
    function requestDraw() { if (!rafId && !destroyed) rafId = requestAnimationFrame(tick); }
    function tick() {
      rafId = 0;
      if (destroyed) return;
      if (S.playing && !S.diverged) {
        var k = SPEEDS[S.speedIdx];
        for (var i = 0; i < k && S.playing; i++) trainEpoch(true);
      }
      draw();
      if (S.playing && !destroyed) rafId = requestAnimationFrame(tick);
    }
    function draw() {
      var T = readTheme();
      if (gridDirty && !S.diverged) computeGrid();
      // ReLU neurons that output 0 for every training point
      S.deadMask = [];
      if (S.net.actId === 1 && S.net.L > 1) {
        for (var l = 1; l < S.net.L; l++) {
          var m = [];
          for (var j = 0; j < S.net.sizes[l]; j++) m.push(thumbs.max && thumbs.max[l] && thumbs.max[l][j] <= 0 ? 1 : 0);
          S.deadMask.push(m);
        }
      }
      drawMap(T);
      drawNet(T);
      drawLoss(T);
      syncStats();
    }
    function setPlaying(p) {
      S.playing = !!p && !S.diverged;
      syncControls();
      if (S.playing) requestDraw();
    }

    /* ---------- actions ---------- */
    function handOff(el) {
      if (document.activeElement === el && el.disabled) btnReset.focus();
    }
    function rebuild() { buildNet(); syncControls(); requestDraw(); }
    on(btnPlay, 'click', function () { setPlaying(!S.playing); requestDraw(); });
    on(btnStep, 'click', function () {
      setPlaying(false);
      trainEpoch(true);
      syncControls();
      handOff(btnStep);
      requestDraw();
    });
    on(btnReset, 'click', function () { rebuild(); });
    function onSeg(attr, fn) {
      Array.prototype.forEach.call(root.querySelectorAll('[data-' + attr + ']'), function (b) {
        on(b, 'click', function () { fn(b.getAttribute('data-' + attr)); });
      });
    }
    onSeg('ds', function (v) { if (v === S.ds) return; S.ds = v; S.data = makeData(v); rebuild(); });
    onSeg('layers', function (v) { v = +v; if (v === S.layers) return; S.layers = v; rebuild(); });
    onSeg('act', function (v) { if (v === S.act) return; S.act = v; rebuild(); });
    onSeg('speed', function (v) { S.speedIdx = +v; syncControls(); });
    on(elN1, 'input', function () { var v = parseInt(elN1.value, 10) || 1; if (v !== S.n1) { S.n1 = v; rebuild(); } });
    on(elN2, 'input', function () { var v = parseInt(elN2.value, 10) || 1; if (v !== S.n2) { S.n2 = v; rebuild(); } });
    on(elLr, 'input', function () { S.lrIdx = clamp(parseInt(elLr.value, 10) || 0, 0, LRS.length - 1); syncControls(); syncStats(); });
    on(elL2, 'input', function () { S.l2Idx = clamp(parseInt(elL2.value, 10) || 0, 0, L2S.length - 1); syncControls(); });
    on(elShowTest, 'change', function () { S.showTest = elShowTest.checked; requestDraw(); });

    /* ---------- pointer: probe on the map ---------- */
    function localPos(e, el) { var r = el.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    var mapDown = null;
    function setProbeFrom(e) {
      var p = localPos(e, mcan);
      S.probe = { x: clamp(p.x / dims.mw * 2 - 1, -1, 1), y: clamp(1 - p.y / dims.mh * 2, -1, 1) };
      requestDraw();
    }
    on(mcan, 'pointerdown', function (e) {
      mapDown = e.pointerId;
      try { mcan.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      setProbeFrom(e);
    });
    on(mcan, 'pointermove', function (e) { if (e.pointerType === 'mouse' || mapDown === e.pointerId) setProbeFrom(e); });
    on(mcan, 'pointerup', function (e) { if (mapDown === e.pointerId) mapDown = null; });
    on(mcan, 'pointercancel', function () { mapDown = null; });
    on(mcan, 'pointerleave', function (e) { if (e.pointerType === 'mouse' && mapDown == null) { S.probe = null; requestDraw(); } });
    mcan.style.cursor = 'crosshair';

    /* ---------- pointer + keyboard: pick a neuron in the diagram ---------- */
    function hitNode(p) {
      var nodes = layout().nodes, best = null, pad = 6;
      for (var c = 0; c < nodes.length; c++) for (var j = 0; j < nodes[c].length; j++) {
        var nd = nodes[c][j];
        if (p.x >= nd.x - pad && p.x <= nd.x + nd.s + pad && p.y >= nd.y - pad && p.y <= nd.y + nd.s + pad) best = { c: c, j: j };
      }
      return best;
    }
    function select(node, toggle) {
      if (!node || node.c === S.net.L || (toggle && S.sel && S.sel.c === node.c && S.sel.j === node.j)) S.sel = null;
      else S.sel = { c: node.c, j: node.j };
      if (node) S.cursor = { c: node.c, j: node.j };
      gridDirty = true;
      requestDraw();
    }
    var netDown = null;
    on(dcan, 'pointerdown', function (e) { var p = localPos(e, dcan); netDown = { id: e.pointerId, x: p.x, y: p.y }; S.kbFocus = false; });
    on(dcan, 'pointerup', function (e) {
      if (!netDown || netDown.id !== e.pointerId) return;
      var p = localPos(e, dcan), d = netDown;
      netDown = null;
      if (Math.abs(p.x - d.x) > 10 || Math.abs(p.y - d.y) > 10) return;
      var hit = hitNode(p);
      if (hit) select(hit, true);
    });
    on(dcan, 'pointercancel', function () { netDown = null; });
    on(dcan, 'pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var hit = hitNode(localPos(e, dcan));
      var same = (hit && S.hoverNode && hit.c === S.hoverNode.c && hit.j === S.hoverNode.j) || (!hit && !S.hoverNode);
      dcan.style.cursor = hit ? 'pointer' : '';
      if (!same) { S.hoverNode = hit; requestDraw(); }
    });
    on(dcan, 'pointerleave', function () { if (S.hoverNode) { S.hoverNode = null; requestDraw(); } });
    on(dcan, 'focus', function () { S.netFocused = true; requestDraw(); });
    on(dcan, 'blur', function () { S.netFocused = false; requestDraw(); });
    on(dcan, 'keydown', function (e) {
      var sz = S.net.sizes, c = S.cursor.c, j = S.cursor.j, k = e.key;
      if (k === 'ArrowRight') { c = Math.min(sz.length - 1, c + 1); }
      else if (k === 'ArrowLeft') { c = Math.max(0, c - 1); }
      else if (k === 'ArrowDown') { j = j + 1; }
      else if (k === 'ArrowUp') { j = j - 1; }
      else if (k === 'Escape') { S.kbFocus = true; select({ c: S.net.L, j: 0 }, false); e.preventDefault(); return; }
      else if (k === 'Enter' || k === ' ') { S.kbFocus = true; select({ c: c, j: j }, true); e.preventDefault(); return; }
      else return;
      e.preventDefault();
      j = clamp(j, 0, sz[c] - 1);
      S.kbFocus = true;
      select({ c: c, j: j }, false);
    });

    /* ---------- theme + resize ---------- */
    function onTheme() { themeCache.key = ''; requestDraw(); }
    var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mql) { if (mql.addEventListener) mql.addEventListener('change', onTheme); else if (mql.addListener) mql.addListener(onTheme); }
    on(document, 'themechange', onTheme);
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { resize(); }); ro.observe(mwrap); ro.observe(dwrap); ro.observe(lwrap); }
    else on(window, 'resize', resize);

    /* ---------- starting state: Circle, 1 hidden layer of 4 tanh neurons, already trained for a short while ---------- */
    S.data = makeData(S.ds);
    buildNet();
    for (var pre = 0; pre < PRETRAIN; pre++) trainEpoch(false);
    S.msgKey = '';
    syncControls();
    resize();
    elMsg.innerHTML = 'This network (1 hidden layer of 4 neurons) has trained for ' + PRETRAIN + ' epochs and is starting to bend its boundary into a circle. Press <b>Play</b> to keep training.';
    S.msgKey = 'intro';

    return {
      destroy: function () {
        destroyed = true;
        S.playing = false;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
        if (ro) ro.disconnect();
        if (mql) { if (mql.removeEventListener) mql.removeEventListener('change', onTheme); else if (mql.removeListener) mql.removeListener(onTheme); }
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
        listeners = [];
        root.innerHTML = '';
      }
    };
  }

  Labs.neuralnet = {
    id: 'neuralnet',
    module: 'l3-nn-basics',
    title: 'Neural network playground',
    summary: 'Build a small neural network, train it live and watch it learn to separate blue points from orange ones, from a straight line to a spiral.',
    tasks: TASKS.map(function (t) { return { id: t.id, text: t.text }; }),
    mount: mount
  };
})();
