/* AI Marg lab: diffusion models. Part 1 adds noise to a tiny picture (the forward process) with a linear and a
   cosine noise schedule. Part 2 runs the process backwards on 2-D dots (DDPM ancestral sampling), using the exact
   score of a known mixture of Gaussians instead of a trained neural network.
   Plain classic script (ES2019). Registers window.AILabs.diffusion. No libraries, no network. */
(function () {
  'use strict';
  var Labs = (window.AILabs = window.AILabs || {});
  var mountCount = 0;

  /* ---------- constants ---------- */
  var T = 1000;                 // number of noise steps
  var IMG = 32;                 // picture is 32 x 32 pixels
  var SIG = 0.055;              // spread (standard deviation) of each little Gaussian blob in Part 2
  var SIG2 = SIG * SIG;
  var SPACING = 0.085;          // distance between neighbouring blob centres along the pattern
  var BAND = 2.5 * SIG;         // a dot within this distance of the pattern counts as "on the pattern"
  var NPTS = 400;               // dots in Part 2
  var VIEW_H = 2.3;             // Part 2 shows y from -2.3 to 2.3 (x wider on wide screens)
  var STEP_STOPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
  var MARK_HI = 0.2, MARK_LO = 0.0016;   // an honest "picture gone" mark has alpha-bar between these
  var NOISE_SEED = 2024, DEFAULT_SEED = 42, START_T = 200;
  var PLAY_RATE = T / 6;        // Play sweeps t from 0 to 1,000 in about 6 seconds

  var TASKS = [
    { id: 't1', text: 'Part 1: slide t up and, for each schedule, press its “gone” button at the first t where you can no longer make out the picture. Which schedule keeps the picture longer?' },
    { id: 't2', text: 'Part 2: press Run and bring the noise back to the pattern: at least 90% of the dots inside the shaded band, spread over at least 90% of the shape.' },
    { id: 't3', text: 'Part 2: after a run with many steps (200 or more), cut the sampling steps to 10 or fewer and run again with the same pattern and schedule. See the result get worse: fewer dots on the pattern, or less of the shape covered.' },
    { id: 't4', text: 'Part 2: tick “Show score arrows” and sample from pure noise down to t = 100 or lower with the arrows showing. Watch where they point early on, and near the end.' }
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
  // Indian digit grouping: 12,34,567
  function fmtIN(v, d) {
    var s = Math.abs(v).toFixed(d || 0), neg = v < 0 && parseFloat(s) !== 0;
    var i = s.indexOf('.'), ip = i < 0 ? s : s.slice(0, i), fp = i < 0 ? '' : s.slice(i);
    if (ip.length > 3) ip = ip.slice(0, -3).replace(/\B(?=(\d{2})+$)/g, ',') + ',' + ip.slice(-3);
    return (neg ? '−' : '') + ip + fp;
  }
  var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  function sup(n) { return String(n).split('').map(function (c) { return SUP[c] || c; }).join(''); }
  // compact = no spaces around ×, so the number fits on one line inside a narrow stat box on phones
  function fmtSci(v, compact) {
    var e = Math.floor(Math.log10(v)), m = v / Math.pow(10, e);
    if (m >= 9.95) { m /= 10; e++; }
    return m.toFixed(1) + (compact ? '×10' : ' × 10') + sup(e);
  }
  // alpha-bar: a share between 0 and 1
  function fmtAb(v, compact) {
    if (v >= 0.9995) return '1.00';
    if (v >= 0.1) return v.toFixed(2);
    if (v >= 0.001) return v.toPrecision(2);
    if (v <= 0) return '0';
    return fmtSci(v, compact);
  }
  function fmtSnr(v, compact) {
    if (!isFinite(v)) return '∞';
    if (v >= 100) return fmtIN(Math.round(v));
    if (v >= 10) return v.toFixed(1);
    if (v >= 1) return v.toFixed(2);
    if (v >= 0.001) return v.toPrecision(2);
    if (v <= 0) return '0';
    return fmtSci(v, compact);
  }
  function stepsWord(n) { return fmtIN(n) + (n === 1 ? ' step' : ' steps'); }
  function pct(v) { var p = v * 100; return (p > 0 && p < 9.95 ? p.toFixed(1) : String(Math.round(p))) + '%'; }
  function pctInt(v) { return Math.round(v * 100) + '%'; }

  /* ---------- noise schedules ---------- */
  // Linear (Ho et al., 2020): beta goes from 0.0001 to 0.02 in a straight line; alpha-bar_t = product of (1 - beta).
  function linearAbar() {
    var a = new Float64Array(T + 1), p = 1;
    a[0] = 1;
    for (var t = 1; t <= T; t++) { var b = 1e-4 + (0.02 - 1e-4) * (t - 1) / (T - 1); p *= 1 - b; a[t] = p; }
    return a;
  }
  // Cosine (Nichol & Dhariwal, 2021): alpha-bar_t = f(t)/f(0), f(t) = cos²(((t/T + s)/(1 + s)) · π/2), s = 0.008,
  // with each beta clipped at 0.999 (only the very last steps are affected).
  function cosineAbar() {
    var s = 0.008;
    function f(t) { var c = Math.cos((t / T + s) / (1 + s) * Math.PI / 2); return c * c; }
    var a = new Float64Array(T + 1), p = 1;
    a[0] = 1;
    for (var t = 1; t <= T; t++) { var b = Math.min(1 - f(t) / f(t - 1), 0.999); p *= 1 - b; a[t] = p; }
    return a;
  }
  var ABAR = null;
  function abars() { if (!ABAR) ABAR = { lin: linearAbar(), cos: cosineAbar() }; return ABAR; }
  var SCHED_NAME = { lin: 'linear', cos: 'cosine' };

  /* ---------- Part 1 pictures, drawn from simple shapes ---------- */
  function segD(u, v, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    var h = l2 ? clamp(((u - ax) * dx + (v - ay) * dy) / l2, 0, 1) : 0;
    var ex = u - ax - h * dx, ey = v - ay - h * dy;
    return Math.sqrt(ex * ex + ey * ey);
  }
  var PICS = {
    four: {
      label: 'Digit 4', name: 'digit 4',
      inside: function (u, v) {
        return segD(u, v, 0.62, 0.12, 0.62, 0.88) < 0.07 || segD(u, v, 0.62, 0.12, 0.2, 0.64) < 0.065 || segD(u, v, 0.17, 0.64, 0.84, 0.64) < 0.065;
      }
    },
    smile: {
      label: 'Smiley', name: 'smiley face',
      inside: function (u, v) {
        if (Math.abs(Math.hypot(u - 0.5, v - 0.5) - 0.39) < 0.045) return true;
        if (Math.hypot(u - 0.37, v - 0.38) < 0.065 || Math.hypot(u - 0.63, v - 0.38) < 0.065) return true;
        return Math.abs(Math.hypot(u - 0.5, v - 0.46) - 0.22) < 0.045 && v > 0.56;
      }
    },
    kite: {
      label: 'Kite', name: 'kite',
      inside: function (u, v) {
        if (Math.abs(u - 0.5) / 0.3 + Math.abs(v - 0.4) / 0.33 <= 1) return !(Math.abs(u - 0.5) < 0.02 || Math.abs(v - 0.4) < 0.02);
        if (v > 0.72 && v < 0.97) return Math.abs(u - (0.5 + 0.07 * Math.sin((v - 0.73) * 26))) < 0.032;
        return false;
      }
    }
  };
  var picCache = {};
  function picture(kind) {
    if (picCache[kind]) return picCache[kind];
    var out = new Float64Array(IMG * IMG), SS = 4, fn = PICS[kind].inside;
    for (var py = 0; py < IMG; py++) {
      for (var px = 0; px < IMG; px++) {
        var c = 0;
        for (var sy = 0; sy < SS; sy++) for (var sx = 0; sx < SS; sx++) if (fn((px + (sx + 0.5) / SS) / IMG, (py + (sy + 0.5) / SS) / IMG)) c++;
        out[py * IMG + px] = 2 * c / (SS * SS) - 1;   // pixels run from -1 (black) to +1 (white), as in real diffusion models
      }
    }
    picCache[kind] = out;
    return out;
  }
  var EPS = null;
  function noiseImage() {
    if (!EPS) { var r = mulberry32(NOISE_SEED); EPS = new Float64Array(IMG * IMG); for (var i = 0; i < EPS.length; i++) EPS[i] = gauss(r); }
    return EPS;
  }

  /* ---------- Part 2 patterns: many small Gaussian blobs placed evenly along a curve ---------- */
  // a finely sampled polyline of the curve; pattern() rescales it and then spaces the blob centres evenly along it
  function curve(fn, a0, a1, closed) {
    var M = 3000, P = [];
    for (var i = 0; i <= M; i++) P.push(fn(a0 + (a1 - a0) * i / M));
    return { raw: P, closed: closed };
  }
  function resample(P, closed) {
    var M = P.length - 1, L = [0], i;
    for (i = 1; i <= M; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    var tot = L[M], n = Math.max(2, Math.round(tot / SPACING)), out = [], j = 0, cnt = closed ? n : n + 1;
    for (var k = 0; k < cnt; k++) {
      var target = tot * k / n;
      while (j < M - 1 && L[j + 1] < target) j++;
      var f = clamp((target - L[j]) / ((L[j + 1] - L[j]) || 1), 0, 1);
      out.push([P[j][0] + (P[j + 1][0] - P[j][0]) * f, P[j][1] + (P[j + 1][1] - P[j][1]) * f]);
    }
    return out;
  }
  var PATS = {
    rings: {
      label: 'Two rings', name: 'two rings', centre: 'the empty middle of the rings',
      build: function () {
        return [curve(function (u) { return [0.5 * Math.cos(u), 0.5 * Math.sin(u)]; }, 0, 2 * Math.PI, true),
          curve(function (u) { return [Math.cos(u), Math.sin(u)]; }, 0, 2 * Math.PI, true)];
      }
    },
    heart: {
      label: 'Heart', name: 'heart', centre: 'the middle of the heart, inside the outline',
      build: function () {
        return [curve(function (u) {
          var s = Math.sin(u);
          return [16 * s * s * s, 13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u)];
        }, 0, 2 * Math.PI, true)];
      }
    },
    spiral: {
      label: 'Spiral', name: 'spiral', centre: 'one spot near the middle of the spiral',
      build: function () { return [curve(function (u) { var r = 0.12 + 0.105 * u; return [r * Math.cos(u), r * Math.sin(u)]; }, 0, 3.1 * Math.PI, false)]; }
    }
  };
  var patCache = {};
  function pattern(kind) {
    if (patCache[kind]) return patCache[kind];
    var built = PATS[kind].build(), x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, i, j;
    for (i = 0; i < built.length; i++) for (j = 0; j < built[i].raw.length; j++) {
      var p = built[i].raw[j];
      x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
    }
    // centre the shape and scale it to fit inside -1.05 .. 1.05 (real diffusion models also scale data to about -1 .. 1)
    var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, sc = 1.05 / Math.max((x1 - x0) / 2, (y1 - y0) / 2);
    var curves = [], mx = [], my = [];
    for (i = 0; i < built.length; i++) {
      var pts = resample(built[i].raw.map(function (q) { return [(q[0] - cx) * sc, (q[1] - cy) * sc]; }), built[i].closed);
      curves.push({ pts: pts, closed: built[i].closed });
      for (j = 0; j < pts.length; j++) { mx.push(pts[j][0]); my.push(pts[j][1]); }
    }
    var K = mx.length, mean = [0, 0];
    for (i = 0; i < K; i++) { mean[0] += mx[i] / K; mean[1] += my[i] / K; }
    patCache[kind] = { kind: kind, curves: curves, mx: new Float64Array(mx), my: new Float64Array(my), K: K, mean: mean };
    return patCache[kind];
  }

  /* ---------- Part 2 maths: the exact noised distribution of a Gaussian mixture ----------
     Data: x0 = one of K blob centres mu_k (all equally likely) + Gaussian wobble with spread SIG.
     After noising to step t: x_t = sqrt(ab)·x0 + sqrt(1 - ab)·noise, so each blob becomes a Gaussian centred at
     sqrt(ab)·mu_k with variance s2 = ab·SIG² + (1 - ab). Everything below follows exactly from that. */
  // Posterior weights of the blobs given x (softmax of -distance²/(2·s2)); returns E[mu | x_t] in out[0], out[1].
  function blobMean(x, y, sa, s2, P, wbuf, out) {
    var mx = P.mx, my = P.my, K = P.K, dmin = Infinity, k, d, dx, dy;
    for (k = 0; k < K; k++) { dx = x - sa * mx[k]; dy = y - sa * my[k]; d = dx * dx + dy * dy; wbuf[k] = d; if (d < dmin) dmin = d; }
    var Z = 0, ex = 0, ey = 0, cut = dmin + 60 * s2, inv = 1 / (2 * s2);  // terms below e^-30 are skipped
    for (k = 0; k < K; k++) {
      d = wbuf[k];
      if (d > cut) continue;
      var e = Math.exp((dmin - d) * inv);
      Z += e; ex += e * mx[k]; ey += e * my[k];
    }
    out[0] = ex / Z; out[1] = ey / Z;
  }
  // Score = gradient of log density of x_t = (sqrt(ab)·E[mu | x_t] − x_t) / s2.
  function scoreAt(x, y, ab, P, wbuf, out) {
    var sa = Math.sqrt(ab), s2 = ab * SIG2 + 1 - ab;
    blobMean(x, y, sa, s2, P, wbuf, out);
    out[0] = (sa * out[0] - x) / s2; out[1] = (sa * out[1] - y) / s2; out[2] = Math.sqrt(s2);
  }
  function newChain(patKind, sched, S, seed) {
    var r0 = mulberry32(seed), xs = new Float64Array(NPTS), ys = new Float64Array(NPTS), i;
    for (i = 0; i < NPTS; i++) { xs[i] = gauss(r0); ys[i] = gauss(r0); }   // x_T: pure noise
    var taus = [0];
    for (i = 1; i <= S; i++) taus.push(Math.round(i * T / S));            // respacing: S evenly spaced timesteps
    return { pat: patKind, sched: sched, S: S, seed: seed, xs: xs, ys: ys, taus: taus, i: S, rng: mulberry32((seed ^ 0x9E3779B9) >>> 0), sawHigh: false, notes: [] };
  }
  // One DDPM ancestral step from t = taus[i] to t' = taus[i-1], with the exact E[x0 | x_t] (equivalently, the exact score).
  function stepChain(ch, wbuf, mbuf) {
    if (ch.i <= 0) return;
    var AB = abars()[ch.sched], P = pattern(ch.pat);
    var t = ch.taus[ch.i], tp = ch.taus[ch.i - 1], a = AB[t], ap = AB[tp];
    var sa = Math.sqrt(a), s2 = a * SIG2 + 1 - a, shrink = SIG2 * sa / s2;
    var beta = 1 - a / ap;                                       // noise added between t' and t
    var c0 = Math.sqrt(ap) * beta / (1 - a), ct = Math.sqrt(1 - beta) * (1 - ap) / (1 - a);
    var sd = tp > 0 ? Math.sqrt(beta * (1 - ap) / (1 - a)) : 0;  // posterior spread; the last step adds no noise
    var xs = ch.xs, ys = ch.ys, rng = ch.rng;
    for (var n = 0; n < NPTS; n++) {
      var x = xs[n], y = ys[n];
      blobMean(x, y, sa, s2, P, wbuf, mbuf);
      var hx = mbuf[0] + shrink * (x - sa * mbuf[0]), hy = mbuf[1] + shrink * (y - sa * mbuf[1]);  // E[x0 | x_t]
      var nx = c0 * hx + ct * x, ny = c0 * hy + ct * y;
      if (sd > 0) { nx += sd * gauss(rng); ny += sd * gauss(rng); }
      xs[n] = nx; ys[n] = ny;
    }
    ch.i--;
  }
  function quality(xs, ys, P, cov) {
    var on = 0, b2 = BAND * BAND, K = P.K, mx = P.mx, my = P.my, k, c = 0;
    for (k = 0; k < K; k++) cov[k] = 0;
    for (var n = 0; n < NPTS; n++) {
      var dmin = Infinity, x = xs[n], y = ys[n];
      for (k = 0; k < K; k++) {
        var dx = x - mx[k], dy = y - my[k], d = dx * dx + dy * dy;
        if (d < dmin) dmin = d;
        if (d <= b2) cov[k] = 1;
      }
      if (dmin <= b2) on++;
    }
    for (k = 0; k < K; k++) c += cov[k];
    return { on: on / NPTS, cov: c / K };
  }
  function score1(q) { return Math.min(q.on, q.cov); }

  /* ---------- theme ---------- */
  var THEME_NAMES = ['--bg', '--surface', '--surface-2', '--ink', '--muted', '--line', '--indigo', '--haldi', '--sindoor', '--series-1', '--series-2', '--series-4'];
  function readTheme() {
    var cs = getComputedStyle(document.documentElement), TH = { key: '' };
    for (var i = 0; i < THEME_NAMES.length; i++) {
      var v = cs.getPropertyValue(THEME_NAMES[i]).trim();
      TH[THEME_NAMES[i].slice(2).replace('-', '')] = v || '#888';
      TH.key += v + '|';
    }
    TH.font = cs.getPropertyValue('--font-body').trim() || 'system-ui, sans-serif';
    return TH;
  }

  /* ---------- mount ---------- */
  function mount(root, ctx) {
    var P = 'dif' + (++mountCount) + '-';
    var listeners = [];
    function on(el, type, fn, opts) { el.addEventListener(type, fn, opts); listeners.push([el, type, fn, opts]); }
    var destroyed = false;

    function seg(id, label, attr, items, current) {
      return '<div class="control"><span class="control-label" id="' + P + id + 'lbl">' + label + '</span>' +
        '<div class="seg" role="group" aria-labelledby="' + P + id + 'lbl">' +
        items.map(function (it) { return '<button type="button" data-' + attr + '="' + it[0] + '" aria-pressed="' + (it[0] === current) + '">' + it[1] + '</button>'; }).join('') +
        '</div></div>';
    }
    function stat(id, k, sub) {
      return '<div class="stat"><div class="k" style="text-transform:none;letter-spacing:.02em">' + k + '</div><div class="v" id="' + P + id + '">—</div>' + (sub ? '<div class="small muted" id="' + P + id + 's">&nbsp;</div>' : '') + '</div>';
    }
    function legend(items) {
      return '<div class="lab-legend">' + items.map(function (it) { return '<span style="--c:var(' + it[0] + ')">' + it[1] + '</span>'; }).join('') + '</div>';
    }

    var top = document.createElement('div');
    top.className = 'lab';
    var TEQ = 't&nbsp;=&nbsp;';
    top.innerHTML =
      '<p class="lab-note"><strong>What you are seeing:</strong> a <em>diffusion model</em> (the kind of AI behind most image generators) learns to turn random noise into a picture. ' +
      'To train one, you first do the opposite: take a clean picture and mix in a little random noise (grainy static, like a badly tuned TV) at every step <em>t</em>, from ' + TEQ + '0 (clean) to ' + TEQ + '1,000 (pure noise). ' +
      'In <b>Part 1</b> you add noise to a tiny 32 × 32 pixel picture. In <b>Part 2</b> you run the process backwards: 400 random dots are nudged, step by step, back onto a pattern.</p>' +
      '<div class="control" style="gap:6px"><span class="control-label" id="' + P + 'partlbl">Choose a part</span>' +
        '<div class="seg" role="group" aria-labelledby="' + P + 'partlbl">' +
          '<button type="button" data-part="1" aria-pressed="true">Part 1: add noise</button>' +
          '<button type="button" data-part="2" aria-pressed="false">Part 2: remove noise</button>' +
        '</div></div>' +
      '<div class="lab-body">' +
        '<div class="stack-sm" id="' + P + 'left">' +
          '<h2 class="lab-h" id="' + P + 'head">Part 1: adding noise (the forward process)</h2>' +
          '<p class="small muted" data-p="1">Both noisy pictures use the same noise ε (epsilon: one fixed grid of random numbers) and the same recipe, ' +
            '<span style="white-space:nowrap">x<sub>t</sub> = √ᾱ<sub>t</sub> · x<sub>0</sub> + √(1 − ᾱ<sub>t</sub>) · ε</span>, where x<sub>0</sub> is the clean picture and ᾱ<sub>t</sub> (say “alpha-bar”) is the share of the mix that is still picture (the clean pixels are multiplied by √ᾱ<sub>t</sub>, so ᾱ<sub>t</sub> = 0.25 means the picture is at half strength). ' +
            'Only the <em>noise schedule</em> (the plan for how fast noise is added) differs. <b>Linear</b> adds a bit more fresh noise at every step (β, the fresh noise per step, grows in a straight line from 0.0001 to 0.02). <b>Cosine</b> follows a gentle cosine curve instead.</p>' +
          '<p class="small muted" data-p="2" hidden>Each dot starts as pure noise at ' + TEQ + '1,000. At every step the <em>sampler</em> (the code that runs the process backwards) moves each dot a little along the <em>score</em>: the direction in which the data becomes more likely, like walking uphill towards the crowd. It also adds a small random kick, except on the last step. ' +
            '<b>A real diffusion model learns this score with a neural network trained on millions of pictures.</b> Here we built the data ourselves from a known recipe (a <em>mixture of Gaussians</em>: lots of small round blobs of dots placed along a shape), so the lab can use the exact formula instead.</p>' +
          '<div class="lab-canvas-wrap" id="' + P + 'wrap"><canvas id="' + P + 'cv" role="img" style="touch-action:pan-y pinch-zoom" aria-label="Diffusion lab picture"></canvas></div>' +
          '<div class="stack-sm" id="' + P + 'info">' +
            '<div data-p="1">' + legend([['--series-2', 'Linear (dashed line)'], ['--series-1', 'Cosine (solid line)'], ['--ink', 'Now, and your “gone” marks']]) + '</div>' +
            '<div data-p="2" hidden>' + legend([['--series-1', 'Generated dots'], ['--haldi', 'Pattern band (the real data)'], ['--series-4', 'Score arrows']]) + '</div>' +
            '<div class="callout callout-indigo small" id="' + P + 'msg" role="status" aria-live="polite" style="min-height:3.2em"></div>' +
            '<div class="lab-stats" data-p="1" style="grid-template-columns:repeat(auto-fit,minmax(100px,1fr))">' + stat('t', 'Step t') + stat('alin', 'Linear ᾱ', true) + stat('acos', 'Cosine ᾱ', true) + '</div>' +
            '<p class="small muted" data-p="1" id="' + P + 'eq">&nbsp;</p>' +
            '<div class="lab-stats" data-p="2" hidden style="grid-template-columns:repeat(auto-fit,minmax(132px,1fr))">' + stat('stp', 'Step') + stat('t2', 'Noise level t') + stat('on', 'On the pattern') + stat('cov', 'Shape covered') + '</div>' +
            '<p class="small muted" data-p="2" hidden>“On the pattern” counts the dots inside the band. “Shape covered” is the share of the shape with at least one dot nearby. Pure noise already touches much of the shape by luck, and piling every dot on one spot gives a high “on the pattern” score, so a good result needs both numbers high.</p>' +
          '</div>' +
        '</div>' +
        '<div class="lab-controls">' +
          '<div class="stack" data-p="1">' +
            '<div class="control"><label for="' + P + 'tr">Noise step t <output id="' + P + 'tout" for="' + P + 'tr">' + START_T + '</output></label>' +
              '<input type="range" id="' + P + 'tr" min="0" max="' + T + '" step="1" value="' + START_T + '" aria-describedby="' + P + 'thelp">' +
              '<p class="small muted" id="' + P + 'thelp">' + TEQ + '0 is the clean picture and ' + TEQ + '1,000 is pure noise. You can also tap or drag sideways along a chart.</p>' +
              '<p class="kbd-hint">Keyboard: arrow keys move t by 1, Page Up and Page Down by 100.</p></div>' +
            '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">' +
              '<button type="button" class="btn btn-primary" id="' + P + 'play">Play</button>' +
              '<button type="button" class="btn" id="' + P + 'zero">Back to ' + TEQ + '0</button></div>' +
            '<div class="control"><span class="control-label">When does the picture disappear?</span>' +
              '<p class="small muted">Slide t up slowly. The moment you can no longer make out the picture in one of the two noisy images, press its button.</p>' +
              '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:4px">' +
                '<button type="button" class="btn btn-sm" id="' + P + 'mlin">Linear picture gone</button>' +
                '<button type="button" class="btn btn-sm" id="' + P + 'mcos">Cosine picture gone</button></div>' +
              '<p class="small" id="' + P + 'marks" style="margin-top:4px">Your marks: none yet.</p></div>' +
            '<div data-slot="1" hidden></div>' +
            seg('pic', 'Picture', 'pic', [['four', 'Digit 4'], ['smile', 'Smiley'], ['kite', 'Kite']], 'four') +
          '</div>' +
          '<div class="stack" data-p="2" hidden>' +
            '<div class="stack-sm"><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">' +
              '<button type="button" class="btn" id="' + P + 'step">Step</button>' +
              '<button type="button" class="btn btn-primary" id="' + P + 'run">Run</button>' +
              '<button type="button" class="btn" id="' + P + 'reset">Restart</button></div>' +
              '<p class="small muted">Step takes one step backwards. Restart puts the dots back to pure noise at ' + TEQ + '1,000.</p></div>' +
            '<div data-slot="2" hidden></div>' +
            '<div class="small" style="display:grid;grid-template-columns:20px minmax(0,1fr);gap:8px;align-items:start"><input type="checkbox" id="' + P + 'arrows" style="margin:3px 0 0">' +
              '<label for="' + P + 'arrows">Show score arrows: which way the exact formula pushes a dot sitting at that spot, at the current t</label></div>' +
            '<div class="control"><label for="' + P + 'steps">Sampling steps <output id="' + P + 'stepsout" for="' + P + 'steps">1,000</output></label>' +
              '<input type="range" id="' + P + 'steps" min="0" max="' + (STEP_STOPS.length - 1) + '" step="1" value="' + (STEP_STOPS.length - 1) + '" aria-valuetext="1,000 steps" aria-describedby="' + P + 'stepshelp">' +
              '<p class="small muted" id="' + P + 'stepshelp">The sampler may skip timesteps: with 10 steps it jumps ' + TEQ + '1,000 → 900 → 800 … → 0 (this is called <em>respacing</em>). Fewer steps means a faster but rougher result.</p></div>' +
            seg('sch', 'Noise schedule', 'sch', [['lin', 'Linear'], ['cos', 'Cosine']], 'lin') +
            seg('pat', 'Pattern (the real data)', 'pat', [['rings', 'Two rings'], ['heart', 'Heart'], ['spiral', 'Spiral']], 'rings') +
            '<div class="control"><label for="' + P + 'seed">Random seed</label>' +
              '<input type="number" id="' + P + 'seed" min="1" max="9999" step="1" value="' + DEFAULT_SEED + '" inputmode="numeric" style="width:8em" aria-describedby="' + P + 'seedhelp">' +
              '<p class="small muted" id="' + P + 'seedhelp">The seed fixes the starting noise and the random kicks, so two runs with the same seed can be compared fairly. Change it for a fresh set of dots.</p></div>' +
          '</div>' +
          '<div class="stack-sm"><h2 class="lab-h">Your tasks</h2><ul class="lab-tasks">' +
            TASKS.map(function (t) { return '<li data-task="' + t.id + '">' + t.text + '</li>'; }).join('') + '</ul></div>' +
        '</div>' +
      '</div>' +
      '<p class="small muted"><strong style="color:var(--ink)">Why it matters in real ML:</strong> Stable Diffusion and most modern image and video generators run exactly this loop, starting from random noise and removing a little at a time with a neural network’s estimate of the score, and their noise schedule and number of sampling steps decide how good the picture is and how long you wait for it.</p>';
    root.appendChild(top);

    function $(id) { return top.querySelector('#' + P + id); }
    var wrap = $('wrap'), cv = $('cv'), g = cv.getContext('2d');
    var elMsg = $('msg'), elHead = $('head');
    var elT = $('tr'), elTout = $('tout'), btnPlay = $('play'), btnZero = $('zero'), btnMLin = $('mlin'), btnMCos = $('mcos'), elMarks = $('marks');
    var elSteps = $('steps'), elStepsOut = $('stepsout'), elSeed = $('seed'), elArrows = $('arrows');
    var btnStep = $('step'), btnRun = $('run'), btnReset = $('reset');
    var stT = $('t'), stAl = $('alin'), stAls = $('alins'), stAc = $('acos'), stAcs = $('acoss'), elEq = $('eq');
    var stStep = $('stp'), stT2 = $('t2'), stOn = $('on'), stCov = $('cov');
    var partEls = top.querySelectorAll('[data-p]'), leftCol = $('left'), info = $('info'), slots = top.querySelectorAll('[data-slot]');
    var partBtns = top.querySelectorAll('[data-part]'), picBtns = top.querySelectorAll('[data-pic]'), patBtns = top.querySelectorAll('[data-pat]'), schBtns = top.querySelectorAll('[data-sch]');
    var taskEls = {};
    Array.prototype.forEach.call(top.querySelectorAll('[data-task]'), function (li) { taskEls[li.getAttribute('data-task')] = li; });

    /* ---------- state ---------- */
    var S = {
      part: 1, t: START_T, pic: 'four', marks: { lin: null, cos: null },
      pat: 'rings', sched: 'lin', stepsIdx: STEP_STOPS.length - 1, seed: DEFAULT_SEED, arrows: false
    };
    var chain = null, q = { on: 0, cov: 0 };
    var results = {};   // per pattern|schedule: the latest finished runs with many (>= 200) and few (<= 10) steps
    var wbuf = new Float64Array(512), mbuf = new Float64Array(3), covBuf = new Uint8Array(512);
    var play = { on: false, last: 0, acc: 0 };
    var run = { on: false, last: 0, acc: 0 };
    var tw = { active: false, f: 1, fx: new Float64Array(NPTS), fy: new Float64Array(NPTS) };
    var dims = { w: 1, h: 1, dpr: 1 };
    var rafId = 0, aspectRaf = 0, started = false, TH = null, lastLabel = '';
    var scrub = null, charts = [];
    var imgCanvas = document.createElement('canvas');
    imgCanvas.width = IMG; imgCanvas.height = IMG;
    var imgCtx = imgCanvas.getContext('2d'), imgData = imgCtx.createImageData(IMG, IMG);
    var mqReduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
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
      if (done[id]) return false;
      done[id] = true;
      markLi(id);
      if (ctx && ctx.onTaskDone) ctx.onTaskDone(id);
      return true;
    }
    var msgKey = '';
    function say(html, key) {
      if (key && key === msgKey) return;
      msgKey = key || '';
      elMsg.innerHTML = html.replace(/\bt = /g, 't&nbsp;=&nbsp;');   // keep "t = 1,000" on one line
    }

    /* ---------- Part 1 ---------- */
    function abAt(sched, t) { return abars()[sched][t]; }
    function snrOf(ab) { return ab >= 1 ? Infinity : ab / (1 - ab); }
    function updateStats1() {
      var al = abAt('lin', S.t), ac = abAt('cos', S.t);
      stT.textContent = fmtIN(S.t);
      stAl.textContent = fmtAb(al, true); stAls.textContent = 'SNR ' + fmtSnr(snrOf(al), true);
      stAc.textContent = fmtAb(ac, true); stAcs.textContent = 'SNR ' + fmtSnr(snrOf(ac), true);
      elEq.innerHTML = 'At t = ' + fmtIN(S.t) + ': linear x<sub>t</sub> = ' + Math.sqrt(al).toFixed(2) + ' × x<sub>0</sub> + ' + Math.sqrt(1 - al).toFixed(2) + ' × ε; ' +
        'cosine x<sub>t</sub> = ' + Math.sqrt(ac).toFixed(2) + ' × x<sub>0</sub> + ' + Math.sqrt(1 - ac).toFixed(2) + ' × ε. SNR (signal-to-noise ratio) = ᾱ ÷ (1 − ᾱ): above 1 the picture is stronger than the noise. ' +
        'The SNR chart uses a log scale (each grid line is 100 times the one below it), so very small values still show.';
      elTout.textContent = fmtIN(S.t);
      elT.setAttribute('aria-valuetext', 't = ' + fmtIN(S.t));
    }
    function setT(t, fromUser) {
      t = clamp(Math.round(t), 0, T);
      if (t === S.t && !fromUser) return;
      S.t = t;
      if (+elT.value !== t) elT.value = String(t);
      updateStats1();
      requestDraw();
    }
    function marksText() {
      var m = S.marks, parts = [];
      if (m.lin != null) parts.push('linear gone by t\u00a0=\u00a0' + fmtIN(m.lin));
      if (m.cos != null) parts.push('cosine gone by t\u00a0=\u00a0' + fmtIN(m.cos));
      elMarks.textContent = 'Your marks: ' + (parts.length ? parts.join('; ') + '.' : 'none yet.');
    }
    function mark(sched) {
      stopPlay();
      var t = S.t, ab = abAt(sched, t), nm = SCHED_NAME[sched];
      if (ab > MARK_HI) {
        say('At t = ' + fmtIN(t) + ' the ' + nm + ' picture still has ᾱ = ' + fmtAb(ab) + ': ' + pct(ab) + ' of the mix is picture, and most people can still make it out. Slide t further up, then try again.');
        return;
      }
      if (ab < MARK_LO) {
        say('By t = ' + fmtIN(t) + ' the ' + nm + ' picture is almost pure noise (ᾱ = ' + fmtAb(ab) + ') and has been for a while. Slide t back down to find the <em>first</em> step where you lose it.');
        return;
      }
      S.marks[sched] = t;
      marksText();
      requestDraw();
      var m = S.marks, other = sched === 'lin' ? 'cos' : 'lin';
      if (m[other] == null) {
        say('Marked: the ' + nm + ' picture is gone by t = ' + fmtIN(t) + '. Only ᾱ = ' + fmtAb(ab) + ' is left, so about ' + pct(ab) + ' of the mix is picture. Now find where the ' + SCHED_NAME[other] + ' picture disappears.');
      } else if (m.cos > m.lin) {
        var gap = m.cos - m.lin, first = completeTask('t1');
        say((first ? '<b>Task done.</b> ' : '') + 'The cosine schedule kept the picture about ' + fmtIN(gap) + ' steps longer (linear was gone by t = ' + fmtIN(m.lin) + ', cosine by t = ' + fmtIN(m.cos) + '). ' +
          'Linear adds noise fast in the first half, so many of its later steps are spent on almost pure noise. Cosine wipes out the picture more evenly, which gives a model more useful steps to learn from (Nichol and Dhariwal, 2021).');
      } else {
        say('Hmm: you marked the cosine picture as gone at t = ' + fmtIN(m.cos) + ', no later than the linear one (t = ' + fmtIN(m.lin) + '). Both images use exactly the same noise, so compare them side by side again around t = ' + fmtIN(m.lin) + ' and mark again.');
      }
    }
    function startPlay() {
      if (S.t >= T) setT(0, true);
      play.on = true; play.last = 0; play.acc = 0;
      btnPlay.textContent = 'Pause';
      requestDraw();
    }
    function stopPlay() {
      if (!play.on) return;
      play.on = false;
      btnPlay.textContent = 'Play';
    }

    /* ---------- Part 2 ---------- */
    function stepsNow() { return STEP_STOPS[S.stepsIdx]; }
    function chainT() { return chain ? chain.taus[chain.i] : T; }
    function freshChain() {
      chain = newChain(S.pat, S.sched, stepsNow(), S.seed);
      tw.active = false; tw.f = 1;
      q = quality(chain.xs, chain.ys, pattern(S.pat), covBuf);
      noteArrows();
    }
    function setRunning(v) {
      run.on = !!v; run.last = 0; run.acc = 0;
      btnRun.textContent = run.on ? 'Pause' : 'Run';
      syncButtons2();
      requestDraw();
    }
    function syncButtons2() { btnStep.disabled = !!(chain && chain.i <= 0); }
    function updateStats2() {
      var S2 = chain.S, doneSteps = S2 - chain.i;
      stStep.textContent = fmtIN(doneSteps) + ' / ' + fmtIN(S2);
      stT2.textContent = fmtIN(chainT());
      stOn.textContent = pctInt(q.on);
      stCov.textContent = pctInt(q.cov);
    }
    function settingsChanged(what) {
      var wasRunning = run.on;
      setRunning(false);
      freshChain();
      updateStats2();
      say(what + ' The dots are back to pure noise at t = 1,000. Press <b>Run</b>' + (wasRunning ? ' again' : '') + '.');
      requestDraw();
    }
    function stepRate() {
      var n = chain ? chain.S : stepsNow();
      return n <= 5 ? 2 : n <= 20 ? 4 : n / 4.5;
    }
    function useTween() { return stepRate() < 25 && !(mqReduce && mqReduce.matches); }
    function noteArrows() {
      if (!S.arrows || !chain) return;
      var t = chainT();
      if (t >= 500) chain.sawHigh = true;
      else if (chain.sawHigh && t <= 100 && !done.t4) {
        completeTask('t4');
        var note = '<b>Task done:</b> early on (high t) the arrows all point roughly to the middle, because from heavy noise the best guess is “somewhere near the centre of the data”. Near the end they point straight at the nearest part of the pattern.';
        if (run.on) chain.notes.push(note);
        else say(note);
      }
    }
    function oneStep() {
      if (!chain || chain.i <= 0) return;
      if (useTween()) { tw.fx.set(chain.xs); tw.fy.set(chain.ys); tw.f = 0; tw.active = true; }
      stepChain(chain, wbuf, mbuf);
      noteArrows();
    }
    function afterSteps() {
      q = quality(chain.xs, chain.ys, pattern(chain.pat), covBuf);
      updateStats2();
      syncButtons2();
      if (chain.i <= 0 && !tw.active) finishChain();
    }
    function finishChain() {
      if (chain.finished) return;
      chain.finished = true;
      if (run.on) setRunning(false);
      var key = chain.pat + '|' + chain.sched, rec = results[key] || (results[key] = {}), S2 = chain.S;
      var res = { S: S2, on: q.on, cov: q.cov };
      if (S2 >= 200) rec.many = res;
      if (S2 <= 10) rec.few = res;
      var nm = PATS[chain.pat].name, html;
      var stepsTxt = S2 === 1 ? 'a single step' : fmtIN(S2) + ' steps';
      if (q.on >= 0.9 && q.cov >= 0.9) {
        html = 'Finished after ' + stepsTxt + ': ' + pctInt(q.on) + ' of the dots are on the ' + nm + ' pattern, spread over ' + pctInt(q.cov) + ' of the shape. Starting from pure noise, the exact score led them back.';
        if (completeTask('t2')) html += ' <b>Task done:</b> you generated new data that looks like the real data.';
      } else if (q.cov < 0.3) {
        html = 'Finished in ' + stepsTxt + ', and the dots bunched up in one small area. From pure noise the sampler’s best guess for every dot is the same: the average of all the data, here ' + PATS[chain.pat].centre + '. Only ' + pctInt(q.cov) + ' of the shape is covered.';
      } else {
        html = 'Finished in ' + stepsTxt + ': only ' + pctInt(q.on) + ' of the dots landed on the pattern. Each big jump has to guess the clean point from a very noisy one, so many dots end up between the lines or in a blurry smear.';
      }
      if (S2 <= 10 && rec.many) html += ' (With ' + stepsWord(rec.many.S) + ': ' + pctInt(rec.many.on) + ' on the pattern, ' + pctInt(rec.many.cov) + ' covered.)';
      if (S2 >= 200 && rec.few && !done.t3) html += ' (With ' + stepsWord(rec.few.S) + ': ' + pctInt(rec.few.on) + ' on the pattern, ' + pctInt(rec.few.cov) + ' covered.)';
      if (rec.many && rec.few && !done.t3) {
        if (score1(rec.few) < score1(rec.many)) {
          completeTask('t3');
          html += ' <b>Task done:</b> fewer steps gave worse samples. That is the trade-off every image generator faces: more steps give better pictures, but you wait longer.';
        } else {
          html += ' This time ' + stepsWord(rec.few.S) + ' did about as well. Try 5 steps, or the linear schedule, to see a clear drop.';
        }
      } else if (S2 <= 10 && !rec.many && !done.t3) {
        html += ' To compare, run it once with many steps (200 or more), keeping the same pattern and schedule.';
      } else if (S2 >= 200 && !done.t3 && done.t2) {
        html += ' Next, try 10 steps.';
      }
      if (S.arrows && !chain.sawHigh && !done.t4) html += ' (For the arrows task, keep the arrows on from the very start: press <b>Restart</b>, then <b>Run</b>.)';
      for (var i = 0; i < chain.notes.length; i++) html += ' ' + chain.notes[i];
      chain.notes = [];
      say(html);
      setLabel();
    }

    /* ---------- drawing helpers ---------- */
    function font(size, weight) { return (weight || '400') + ' ' + size + 'px ' + TH.font; }
    function theme(force) { if (force || !TH || !(play.on || run.on || tw.active)) TH = readTheme(); return TH; }

    /* ---------- Part 1 drawing ---------- */
    function layout1() {
      var W = dims.w, H = dims.h, L = { tiles: [], charts: [], wide: W >= 520 };
      var pad, gap, lh, cap, ts, x, y, chH, cw, i;
      if (L.wide) {
        pad = 14; gap = 18; lh = 20; cap = 20;
        chH = clamp(Math.round(H * 0.44), 140, 260);
        ts = Math.floor(Math.min((W - 2 * pad - 2 * gap) / 3, H - 2 * pad - chH - 18 - lh - cap));
        x = Math.round((W - (3 * ts + 2 * gap)) / 2); y = pad + lh;
        ['x0', 'lin', 'cos'].forEach(function (k, j) { L.tiles.push({ k: k, x: x + j * (ts + gap), y: y, s: ts }); });
        cw = Math.floor((W - 2 * pad - 2 * gap) / 2);
        L.charts.push({ k: 'abar', x: pad, y: H - pad - chH, w: cw, h: chH });
        L.charts.push({ k: 'snr', x: W - pad - cw, y: H - pad - chH, w: cw, h: chH });
      } else {
        pad = 10; gap = 9; lh = 18; cap = 18;
        var unit = (W - 2 * pad - 2 * gap) / 2.6, big = Math.floor(unit), small = Math.floor(W - 2 * pad - 2 * gap - 2 * big);
        y = pad + lh;
        L.tiles.push({ k: 'x0', x: pad, y: y, s: small });
        L.tiles.push({ k: 'lin', x: pad + small + gap, y: y, s: big });
        L.tiles.push({ k: 'cos', x: pad + small + 2 * gap + big, y: y, s: big });
        var top0 = y + big + cap + 10;
        chH = Math.floor((H - top0 - pad - 14) / 2);
        L.charts.push({ k: 'abar', x: pad, y: top0, w: W - 2 * pad, h: chH });
        L.charts.push({ k: 'snr', x: pad, y: top0 + chH + 14, w: W - 2 * pad, h: chH });
      }
      for (i = 0; i < L.charts.length; i++) {
        var c = L.charts[i], ml = L.wide ? 44 : 40;
        c.px = c.x + ml; c.py = c.y + 22; c.pw = c.w - ml - 10; c.ph = c.h - 22 - 20;
      }
      return L;
    }
    function drawTile(tile) {
      var x0 = picture(S.pic), eps = noiseImage(), d = imgData.data, ab = tile.k === 'x0' ? 1 : abAt(tile.k, S.t);
      var a = Math.sqrt(ab), b = Math.sqrt(1 - ab);
      for (var i = 0; i < IMG * IMG; i++) {
        var v = a * x0[i] + b * eps[i];                    // x_t = sqrt(ab)·x0 + sqrt(1 - ab)·eps
        var c = Math.round(clamp((v + 1) / 2, 0, 1) * 255);
        d[i * 4] = c; d[i * 4 + 1] = c; d[i * 4 + 2] = c; d[i * 4 + 3] = 255;
      }
      imgCtx.putImageData(imgData, 0, 0);
      g.imageSmoothingEnabled = false;
      g.drawImage(imgCanvas, tile.x, tile.y, tile.s, tile.s);
      g.imageSmoothingEnabled = true;
      g.strokeStyle = TH.line; g.lineWidth = 1;
      g.strokeRect(tile.x - 0.5, tile.y - 0.5, tile.s + 1, tile.s + 1);
    }
    function tileLabel(tile, wide) {
      var x = tile.x, y = tile.y - 6;
      g.font = font(wide ? 13 : 12, '600'); g.textBaseline = 'alphabetic'; g.textAlign = 'left'; g.fillStyle = TH.ink;
      if (tile.k === 'x0') { g.fillText(wide ? 'Clean picture x₀' : 'Clean', x, y); }
      else {
        g.fillStyle = tile.k === 'lin' ? TH.series2 : TH.series1;
        g.fillRect(x, y - 9, 10, 10);
        g.fillStyle = TH.ink;
        g.fillText(tile.k === 'lin' ? 'Linear' : 'Cosine', x + 15, y);
      }
      g.font = font(wide ? 12.5 : 11.5); g.fillStyle = TH.ink; g.textBaseline = 'top';
      var capTxt = tile.k === 'x0' ? 't = 0' : 'ᾱ = ' + fmtAb(abAt(tile.k, S.t));
      g.fillText(capTxt, x, tile.y + tile.s + 5);
    }
    function chartY(c, k, v) {
      var f;
      if (k === 'abar') f = v;
      else f = v <= 0 ? -1 : (Math.log10(v) + 5) / 10;
      return c.py + (1 - f) * c.ph;
    }
    function chartX(c, t) { return c.px + t / T * c.pw; }
    function curveVal(k, sched, t) { var ab = abAt(sched, t); return k === 'abar' ? ab : snrOf(ab); }
    function drawChart(c, wide) {
      var k = c.k, i;
      g.textAlign = 'left'; g.textBaseline = 'top'; g.fillStyle = TH.ink; g.font = font(wide ? 13 : 12.5, '600');
      g.fillText(k === 'abar' ? 'ᾱ: share of the mix that is still picture' : 'Signal-to-noise ratio, SNR (log scale)', c.x, c.y);
      // grid + y ticks
      g.font = font(11); g.fillStyle = TH.muted; g.strokeStyle = TH.line; g.lineWidth = 1;
      var ticks = k === 'abar' ? (c.ph > 120 ? [0, 0.25, 0.5, 0.75, 1] : [0, 0.5, 1]) : (c.ph > 120 ? [-4, -2, 0, 2, 4] : [-4, 0, 4]);
      g.textAlign = 'right'; g.textBaseline = 'middle';
      for (i = 0; i < ticks.length; i++) {
        var tv = ticks[i], yy = Math.round(chartY(c, k, k === 'abar' ? tv : Math.pow(10, tv))) + 0.5;
        g.beginPath(); g.moveTo(c.px, yy); g.lineTo(c.px + c.pw, yy); g.stroke();
        var lab = k === 'abar' ? (tv === 0 ? '0' : tv === 1 ? '1' : String(tv)) : (tv === 0 ? '1' : tv === 2 ? '100' : '10' + sup(tv));
        g.fillText(lab, c.px - 6, yy);
      }
      // x ticks
      g.textAlign = 'center'; g.textBaseline = 'top';
      var xt = c.pw > 260 ? [0, 250, 500, 750, 1000] : [0, 500, 1000];
      for (i = 0; i < xt.length; i++) {
        var xx = Math.round(chartX(c, xt[i])) + 0.5;
        g.beginPath(); g.moveTo(xx, c.py); g.lineTo(xx, c.py + c.ph); g.stroke();
        g.textAlign = i === 0 ? 'left' : i === xt.length - 1 ? 'right' : 'center';
        g.fillText((i === xt.length - 1 ? 't = ' : '') + fmtIN(xt[i]), i === 0 ? xx - 3 : i === xt.length - 1 ? xx + 3 : xx, c.py + c.ph + 4);
      }
      if (k === 'snr') {
        // signal = noise reference line
        var y1 = Math.round(chartY(c, k, 1)) + 0.5;
        g.strokeStyle = TH.muted; g.setLineDash([3, 3]);
        g.beginPath(); g.moveTo(c.px, y1); g.lineTo(c.px + c.pw, y1); g.stroke();
        g.setLineDash([]);
        // label at the left, just under the line: both curves are above it there, and the "gone" marks are further right
        g.fillStyle = TH.muted; g.textAlign = 'left'; g.textBaseline = 'top';
        g.fillText('signal = noise', c.px + 6, y1 + 3);
      }
      g.strokeStyle = TH.muted; g.beginPath(); g.moveTo(c.px + 0.5, c.py); g.lineTo(c.px + 0.5, c.py + c.ph + 0.5); g.lineTo(c.px + c.pw, c.py + c.ph + 0.5); g.stroke();
      // curves
      g.save();
      g.beginPath(); g.rect(c.px, c.py - 2, c.pw, c.ph + 4); g.clip();
      ['lin', 'cos'].forEach(function (sched) {
        g.strokeStyle = sched === 'lin' ? TH.series2 : TH.series1; g.lineWidth = 2.2; g.lineJoin = 'round';
        g.setLineDash(sched === 'lin' ? [7, 4] : []);
        g.beginPath();
        var first = true;
        for (var t = k === 'abar' ? 0 : 1; t <= T; t += 2) {
          var v = curveVal(k, sched, t), yv = chartY(c, k, v);
          if (yv > c.py + c.ph + 50) yv = c.py + c.ph + 50;
          if (first) { g.moveTo(chartX(c, t), yv); first = false; } else g.lineTo(chartX(c, t), yv);
        }
        g.stroke();
      });
      g.setLineDash([]);
      // the learner's "gone" marks
      var tags = [];
      ['lin', 'cos'].forEach(function (sched) {
        var mt = S.marks[sched];
        if (mt == null) return;
        var mx = chartX(c, mt), my = Math.min(chartY(c, k, curveVal(k, sched, mt)), c.py + c.ph - 2);
        g.beginPath(); g.moveTo(mx, my - 6); g.lineTo(mx + 6, my); g.lineTo(mx, my + 6); g.lineTo(mx - 6, my); g.closePath();
        g.fillStyle = sched === 'lin' ? TH.series2 : TH.series1; g.fill();
        g.lineWidth = 1.5; g.strokeStyle = TH.ink; g.stroke();
        tags.push({ mx: mx, my: my });
      });
      g.font = font(11, '600'); g.textBaseline = 'middle'; g.textAlign = 'left';
      var lw = g.measureText('gone').width;
      tags.forEach(function (tg) { tg.lx = clamp(tg.mx - lw / 2, c.px + 2, c.px + c.pw - lw - 2); tg.ly = Math.max(c.py + 9, tg.my - 16); });
      if (tags.length === 2 && Math.abs(tags[0].lx - tags[1].lx) < lw + 8 && Math.abs(tags[0].my - tags[1].my) < 40) {
        // two marks close together: both labels say the same word, so draw one, above the higher diamond
        tags = [tags[0].my <= tags[1].my ? tags[0] : tags[1]];
      }
      tags.forEach(function (tg) {
        g.fillStyle = TH.surface; g.globalAlpha = 0.9; g.fillRect(tg.lx - 3, tg.ly - 8, lw + 6, 16); g.globalAlpha = 1;
        g.fillStyle = TH.ink; g.fillText('gone', tg.lx, tg.ly);
      });
      // current t
      var cx = Math.round(chartX(c, S.t)) + 0.5;
      g.strokeStyle = TH.ink; g.globalAlpha = 0.7; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(cx, c.py); g.lineTo(cx, c.py + c.ph); g.stroke();
      g.globalAlpha = 1;
      ['lin', 'cos'].forEach(function (sched) {
        if (k === 'snr' && S.t === 0) return;
        var yv = chartY(c, k, curveVal(k, sched, S.t));
        if (yv > c.py + c.ph + 1) return;
        g.beginPath(); g.arc(cx, yv, 4.5, 0, Math.PI * 2);
        g.fillStyle = sched === 'lin' ? TH.series2 : TH.series1; g.fill();
        g.lineWidth = 1.5; g.strokeStyle = TH.surface; g.stroke();
      });
      g.restore();
      if (k === 'abar') {
        // value tag for the current t
        g.font = font(11.5, '600'); g.fillStyle = TH.ink; g.textBaseline = 'top';
        var tag = 't = ' + fmtIN(S.t), tw2 = g.measureText(tag).width;
        var tx = clamp(cx + 6, c.px + 2, c.px + c.pw - tw2 - 2);
        if (cx + 6 + tw2 > c.px + c.pw - 2) tx = cx - 6 - tw2;
        g.textAlign = 'left';
        g.fillStyle = TH.surface; g.globalAlpha = 0.85; g.fillRect(tx - 2, c.py + 2, tw2 + 4, 15); g.globalAlpha = 1;
        g.fillStyle = TH.ink; g.fillText(tag, tx, c.py + 3);
      }
    }
    function paint1() {
      var L = layout1(), i;
      for (i = 0; i < L.tiles.length; i++) { drawTile(L.tiles[i]); tileLabel(L.tiles[i], L.wide); }
      charts = L.charts;
      for (i = 0; i < L.charts.length; i++) drawChart(L.charts[i], L.wide);
    }

    /* ---------- Part 2 drawing ---------- */
    function view2() { var ppu = dims.h / (2 * VIEW_H); return { ppu: ppu, cx: dims.w / 2, cy: dims.h / 2 }; }
    function paint2() {
      var W = dims.w, H = dims.h, V = view2(), i, j, k;
      // light grid, one line per unit
      g.strokeStyle = TH.line; g.lineWidth = 1;
      g.beginPath();
      for (k = -4; k <= 4; k++) {
        var gx = Math.round(V.cx + k * V.ppu) + 0.5, gy = Math.round(V.cy + k * V.ppu) + 0.5;
        if (gx > 0 && gx < W) { g.moveTo(gx, 0); g.lineTo(gx, H); }
        if (gy > 0 && gy < H) { g.moveTo(0, gy); g.lineTo(W, gy); }
      }
      g.stroke();
      // the pattern band (where real data lives)
      var Pt = pattern(chain.pat);
      g.save();
      g.globalAlpha = 0.34; g.strokeStyle = TH.haldi; g.lineWidth = 2 * BAND * V.ppu; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath();
      for (i = 0; i < Pt.curves.length; i++) {
        var cp = Pt.curves[i].pts;
        for (j = 0; j < cp.length; j++) {
          var px = V.cx + cp[j][0] * V.ppu, py = V.cy - cp[j][1] * V.ppu;
          if (j === 0) g.moveTo(px, py); else g.lineTo(px, py);
        }
        if (Pt.curves[i].closed) g.closePath();
      }
      g.stroke();
      g.restore();
      // score arrows at the current t
      if (S.arrows) {
        var ab = abars()[chain.sched][chainT()], sp = clamp(Math.round(W / 22), 26, 40), out = [0, 0, 0];
        var nx = Math.floor(W / sp), ny = Math.floor(H / sp), ox = (W - (nx - 1) * sp) / 2, oy = (H - (ny - 1) * sp) / 2;
        g.strokeStyle = TH.series4; g.fillStyle = TH.series4; g.lineWidth = 1.4; g.lineCap = 'round';
        g.beginPath();
        var dots = [];
        for (j = 0; j < ny; j++) {
          for (i = 0; i < nx; i++) {
            var ax = ox + i * sp, ay = oy + j * sp, wx = (ax - V.cx) / V.ppu, wy = (V.cy - ay) / V.ppu;
            scoreAt(wx, wy, ab, Pt, wbuf, out);
            var mag = Math.hypot(out[0], out[1]), u = mag * out[2];   // how many noise-widths away from likely data
            var len = sp * 0.82 * Math.tanh(u / 2.5);
            if (len < 3) { dots.push(ax, ay); continue; }
            var dx = out[0] / mag, dy = -out[1] / mag;
            var x1 = ax - dx * len / 2, y1 = ay - dy * len / 2, x2 = ax + dx * len / 2, y2 = ay + dy * len / 2, hl = Math.min(6, len * 0.45);
            g.moveTo(x1, y1); g.lineTo(x2, y2);
            g.moveTo(x2, y2); g.lineTo(x2 - hl * (dx * 0.88 - dy * 0.48), y2 - hl * (dy * 0.88 + dx * 0.48));
            g.moveTo(x2, y2); g.lineTo(x2 - hl * (dx * 0.88 + dy * 0.48), y2 - hl * (dy * 0.88 - dx * 0.48));
          }
        }
        g.stroke();
        for (i = 0; i < dots.length; i += 2) { g.beginPath(); g.arc(dots[i], dots[i + 1], 1.4, 0, Math.PI * 2); g.fill(); }
      }
      // the generated dots
      var r = clamp(W / 260, 1.7, 2.7), xs = chain.xs, ys = chain.ys, f = tw.active ? tw.f : 1;
      f = f * f * (3 - 2 * f);
      g.fillStyle = TH.series1;
      g.beginPath();
      for (i = 0; i < NPTS; i++) {
        var x = tw.active ? tw.fx[i] + (xs[i] - tw.fx[i]) * f : xs[i], y = tw.active ? tw.fy[i] + (ys[i] - tw.fy[i]) * f : ys[i];
        var qx = V.cx + x * V.ppu, qy = V.cy - y * V.ppu;
        if (qx < -5 || qx > W + 5 || qy < -5 || qy > H + 5) continue;
        g.moveTo(qx + r, qy); g.arc(qx, qy, r, 0, Math.PI * 2);
      }
      g.fill();
      // t label
      var t = chainT(), line1 = 't = ' + fmtIN(t), line2 = t >= T ? 'pure noise' : chain.i <= 0 && !tw.active ? 'finished' : 'step ' + fmtIN(chain.S - chain.i) + ' of ' + fmtIN(chain.S);
      g.font = font(14, '700');
      var w1 = g.measureText(line1).width;
      g.font = font(12);
      var w2 = g.measureText(line2).width, bw = Math.max(w1, w2) + 16;
      g.fillStyle = TH.surface; g.globalAlpha = 0.88; g.fillRect(8, 8, bw, 42); g.globalAlpha = 1;
      g.strokeStyle = TH.line; g.lineWidth = 1; g.strokeRect(8.5, 8.5, bw - 1, 41);
      g.fillStyle = TH.ink; g.textAlign = 'left'; g.textBaseline = 'top';
      g.font = font(14, '700'); g.fillText(line1, 16, 13);
      g.font = font(12); g.fillText(line2, 16, 31);
    }

    /* ---------- paint + loop ---------- */
    function setLabel() {
      var s;
      if (S.part === 1) {
        var al = abAt('lin', S.t), ac = abAt('cos', S.t);
        s = 'Forward process on the ' + PICS[S.pic].name + ' picture at step t = ' + fmtIN(S.t) + '. The linear schedule keeps ᾱ = ' + fmtAb(al) + ' of the picture and the cosine schedule keeps ' + fmtAb(ac) +
          '. Below, charts of ᾱ and of the signal-to-noise ratio for both schedules from t = 0 to 1,000' + (S.marks.lin != null || S.marks.cos != null ? ', with your “gone” marks.' : '.');
      } else {
        var t = chainT();
        s = 'Reverse process on the ' + PATS[chain.pat].name + ' pattern with the ' + SCHED_NAME[chain.sched] + ' schedule: ' + NPTS + ' dots at t = ' + fmtIN(t) + ', step ' + fmtIN(chain.S - chain.i) + ' of ' + fmtIN(chain.S) + '. ' +
          pctInt(q.on) + ' of the dots are on the pattern, covering ' + pctInt(q.cov) + ' of it.' + (S.arrows ? ' Score arrows are shown.' : '');
      }
      if (s !== lastLabel) { lastLabel = s; cv.setAttribute('aria-label', s); }
    }
    function paint() {
      if (destroyed || dims.w < 2) return;
      theme();
      g.setTransform(dims.dpr, 0, 0, dims.dpr, 0, 0);
      g.fillStyle = TH.surface; g.fillRect(0, 0, dims.w, dims.h);
      if (S.part === 1) paint1(); else paint2();
      if (!(play.on || run.on || tw.active)) setLabel();
    }
    function requestDraw() { if (!rafId && !destroyed) rafId = requestAnimationFrame(frame); }
    function frame(now) {
      rafId = 0;
      if (destroyed) return;
      var more = false;
      if (play.on) {
        var dt = play.last ? Math.min(0.1, (now - play.last) / 1000) : 0;
        play.last = now; play.acc += dt * PLAY_RATE;
        var n = Math.floor(play.acc);
        play.acc -= n;
        if (n) setT(S.t + n, false);
        if (S.t >= T) { stopPlay(); say('Pure noise at t = 1,000. Slide back to find where each picture disappeared, and press its “gone” button.', 'play-end'); }
        else more = true;
      }
      if (chain && (run.on || tw.active)) {
        var dt2 = run.last ? Math.min(0.1, (now - run.last) / 1000) : 0, rate = stepRate();
        run.last = now;
        if (tw.active) {
          tw.f += dt2 * rate;
          if (tw.f >= 1) { tw.f = 1; tw.active = false; }
          if (!tw.active) afterSteps();
          if (!tw.active && run.on && chain.i > 0) { oneStep(); afterSteps(); }
        } else if (run.on) {
          if (useTween()) { oneStep(); afterSteps(); }
          else {
            run.acc += dt2 * rate;
            var t0 = performance.now(), steps = 0;
            while (run.acc >= 1 && chain.i > 0) {
              oneStep(); run.acc -= 1; steps++;
              if (performance.now() - t0 > 12) break;   // slow phone: keep frames smooth, the run just takes longer
            }
            if (run.acc > 2) run.acc = 2;
            if (steps) afterSteps();
          }
        }
        more = more || run.on || tw.active;
      }
      paint();
      if (more) rafId = requestAnimationFrame(frame);
    }

    /* ---------- phone layout ----------
       style.css stacks .lab-body into one column at 820px, which would put the message and stats below every control.
       There, move them up to sit right after the main buttons of the current part. */
    var mqNarrow = window.matchMedia ? window.matchMedia('(max-width: 820px)') : null;
    function placeInfo() {
      if (destroyed) return;
      var narrow = !!(mqNarrow && mqNarrow.matches), slot = null;
      Array.prototype.forEach.call(slots, function (sl) {
        var mine = narrow && +sl.getAttribute('data-slot') === S.part;
        sl.hidden = !mine;
        if (mine) slot = sl;
      });
      var target = slot || leftCol;
      if (info.parentNode !== target) target.appendChild(info);
    }

    /* ---------- parts ---------- */
    function setPart(p) {
      if (p === S.part) return;
      stopPlay();
      if (run.on) setRunning(false);
      if (tw.active) { tw.active = false; tw.f = 1; afterSteps(); }
      S.part = p;
      Array.prototype.forEach.call(partBtns, function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-part') === p)); });
      Array.prototype.forEach.call(partEls, function (el) { el.hidden = +el.getAttribute('data-p') !== p; });
      elHead.textContent = p === 1 ? 'Part 1: adding noise (the forward process)' : 'Part 2: removing noise (the reverse process)';
      if (p === 2) {
        if (!chain) freshChain();
        updateStats2();
        if (chain.i >= chain.S) say('These ' + NPTS + ' dots are pure noise (t = 1,000). Press <b>Run</b> to remove the noise step by step and watch them find the ' + PATS[S.pat].name + ' pattern.');
        else if (chain.i <= 0) say('Part 2: your last run is on screen. Press <b>Run</b> to sample again from fresh noise, or change a setting first.');
        else say('Part 2: the dots are paused at t = ' + fmtIN(chainT()) + '. Press <b>Run</b> to carry on, or <b>Restart</b>.');
      } else {
        say('Part 1: slide t from 0 to 1,000 (or press <b>Play</b>) and watch both pictures dissolve into noise. Which one disappears first?');
      }
      cv.style.cursor = '';
      placeInfo();
      applyAspect();
      resize();
      requestDraw();
    }
    Array.prototype.forEach.call(partBtns, function (b) { on(b, 'click', function () { setPart(+b.getAttribute('data-part')); }); });

    /* ---------- Part 1 controls ---------- */
    on(elT, 'input', function () { stopPlay(); setT(+elT.value, true); });
    on(btnPlay, 'click', function () { if (play.on) stopPlay(); else startPlay(); });
    on(btnZero, 'click', function () { stopPlay(); setT(0, true); });
    Array.prototype.forEach.call(picBtns, function (b) {
      on(b, 'click', function () {
        S.pic = b.getAttribute('data-pic');
        Array.prototype.forEach.call(picBtns, function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        requestDraw();
      });
    });
    on(btnMLin, 'click', function () { mark('lin'); });
    on(btnMCos, 'click', function () { mark('cos'); });
    // scrub t along a chart: mouse on press, touch only once the finger moves sideways (a vertical swipe scrolls the page)
    function localPt(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function chartAt(p) {
      for (var i = 0; i < charts.length; i++) {
        var c = charts[i];
        if (p.x >= c.px - 6 && p.x <= c.px + c.pw + 6 && p.y >= c.py - 6 && p.y <= c.py + c.ph + 18) return c;
      }
      return null;
    }
    function tFromX(c, x) { return clamp((x - c.px) / c.pw, 0, 1) * T; }
    on(cv, 'pointerdown', function (e) {
      if (S.part !== 1) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      var p = localPt(e), c = chartAt(p);
      if (!c) return;
      scrub = { id: e.pointerId, c: c, touch: e.pointerType !== 'mouse' };
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      if (!scrub.touch) { stopPlay(); setT(tFromX(c, p.x), true); e.preventDefault(); }
    });
    on(cv, 'pointermove', function (e) {
      if (S.part !== 1) return;
      var p = localPt(e);
      if (scrub && scrub.id === e.pointerId) { stopPlay(); setT(tFromX(scrub.c, p.x), true); return; }
      if (e.pointerType === 'mouse') cv.style.cursor = chartAt(p) ? 'ew-resize' : '';
    });
    function endScrub(e, apply) {
      if (!scrub || scrub.id !== e.pointerId) return;
      if (apply && scrub.touch) { stopPlay(); setT(tFromX(scrub.c, localPt(e).x), true); }
      scrub = null;
    }
    on(cv, 'pointerup', function (e) { endScrub(e, true); });
    on(cv, 'pointercancel', function (e) { endScrub(e, false); });

    /* ---------- Part 2 controls ---------- */
    Array.prototype.forEach.call(patBtns, function (b) {
      on(b, 'click', function () {
        var v = b.getAttribute('data-pat');
        if (v === S.pat) return;
        S.pat = v;
        Array.prototype.forEach.call(patBtns, function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        settingsChanged('New pattern: ' + PATS[v].name + '.');
      });
    });
    Array.prototype.forEach.call(schBtns, function (b) {
      on(b, 'click', function () {
        var v = b.getAttribute('data-sch');
        if (v === S.sched) return;
        S.sched = v;
        Array.prototype.forEach.call(schBtns, function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        settingsChanged('Schedule: ' + SCHED_NAME[v] + '.');
      });
    });
    on(elSteps, 'input', function () {
      var idx = clamp(Math.round(+elSteps.value), 0, STEP_STOPS.length - 1);
      if (idx === S.stepsIdx) return;
      S.stepsIdx = idx;
      var n = stepsNow();
      elStepsOut.textContent = fmtIN(n);
      elSteps.setAttribute('aria-valuetext', fmtIN(n) + (n === 1 ? ' step' : ' steps'));
      settingsChanged('Sampling steps: ' + fmtIN(n) + '.');
    });
    on(elSeed, 'change', function () {
      var v = Math.round(+elSeed.value);
      if (!isFinite(v) || v < 1 || v > 9999) { elSeed.value = String(S.seed); say('The seed must be a whole number from 1 to 9,999.'); return; }
      elSeed.value = String(v);
      if (v === S.seed) return;
      S.seed = v;
      settingsChanged('Seed ' + v + ': a fresh set of random dots.');
    });
    on(elArrows, 'change', function () {
      S.arrows = elArrows.checked;
      if (S.arrows) {
        noteArrows();
        if (!done.t4) say('Score arrows on. Each arrow shows which way a dot at that spot would be pushed at the current t. Now run from t = 1,000 and watch them change as t falls.');
      }
      requestDraw();
    });
    on(btnStep, 'click', function () {
      if (!chain || chain.i <= 0) return;
      if (run.on) setRunning(false);
      if (tw.active) { tw.active = false; tw.f = 1; }
      oneStep();
      afterSteps();
      run.last = 0;
      requestDraw();
    });
    on(btnRun, 'click', function () {
      if (run.on) { setRunning(false); say('Paused at t = ' + fmtIN(chainT()) + '. Press <b>Run</b> to carry on.'); return; }
      if (!chain || chain.i <= 0) { freshChain(); updateStats2(); }
      setRunning(true);
      say('Running ' + fmtIN(chain.S) + (chain.S === 1 ? ' step' : ' steps') + ' from t = ' + fmtIN(chainT()) + ' down to 0…', 'run' + chain.S);
    });
    on(btnReset, 'click', function () {
      setRunning(false);
      freshChain();
      updateStats2();
      syncButtons2();
      say('Back to pure noise at t = 1,000. Press <b>Run</b> to sample again.');
      requestDraw();
    });

    /* ---------- theme, fonts, resize ---------- */
    function onTheme() { if (destroyed) return; theme(true); requestDraw(); }
    var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    function mqOn(m, fn) { if (m) { if (m.addEventListener) m.addEventListener('change', fn); else if (m.addListener) m.addListener(fn); } }
    function mqOff(m, fn) { if (m) { if (m.removeEventListener) m.removeEventListener('change', fn); else if (m.removeListener) m.removeListener(fn); } }
    mqOn(mql, onTheme);
    mqOn(mqNarrow, placeInfo);
    on(document, 'themechange', onTheme);
    function onFonts() { if (!destroyed) requestDraw(); }
    var fontSet = document.fonts && document.fonts.addEventListener ? document.fonts : null;
    if (fontSet) {
      on(fontSet, 'loadingdone', onFonts);
      if (fontSet.ready && fontSet.ready.then) fontSet.ready.then(onFonts, function () { /* ignore */ });
    }

    var curAspect = null;
    function wantAspect() {
      var wide = wrap.getBoundingClientRect().width >= 520;
      return S.part === 1 ? (wide ? '16 / 10' : '5 / 8') : (wide ? '4 / 3' : '1 / 1');
    }
    function applyAspect() {
      aspectRaf = 0;
      if (destroyed) return;
      var a = wantAspect();
      if (a !== curAspect) { curAspect = a; wrap.style.aspectRatio = a; }
    }
    function resize() {
      if (destroyed) return;
      // changing the wrapper's own size inside a ResizeObserver callback would loop, so defer it
      if (wantAspect() !== curAspect && !aspectRaf) aspectRaf = requestAnimationFrame(applyAspect);
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      var r = cv.getBoundingClientRect(), w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      if (w === dims.w && h === dims.h && dpr === dims.dpr && cv.width > 1) return;
      dims.w = w; dims.h = h; dims.dpr = dpr;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      // setting canvas.width wipes it: repaint now so there is no blank frame
      if (started) paint(); else requestDraw();
    }
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { resize(); }); ro.observe(wrap); }
    else on(window, 'resize', resize);

    /* ---------- start: Part 1 at t = 200 with the digit 4 ---------- */
    placeInfo();
    updateStats1();
    marksText();
    say('Start here: slide t from 0 to 1,000 (or press <b>Play</b>) and watch both pictures dissolve into noise. Which one disappears first?');
    applyAspect();
    resize();
    started = true;
    paint();

    return {
      destroy: function () {
        if (destroyed) return;
        destroyed = true;
        if (rafId) cancelAnimationFrame(rafId);
        if (aspectRaf) cancelAnimationFrame(aspectRaf);
        rafId = 0; aspectRaf = 0;
        play.on = false; run.on = false; tw.active = false;
        if (ro) ro.disconnect();
        mqOff(mql, onTheme);
        mqOff(mqNarrow, placeInfo);
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
        listeners = [];
        if (top.parentNode) top.parentNode.removeChild(top);
      }
    };
  }

  Labs.diffusion = {
    id: 'diffusion',
    module: 'l4-gen-vision',
    title: 'Diffusion: noise in, picture out',
    summary: 'Add noise to a tiny picture with two noise schedules, then run a diffusion sampler backwards with the exact score to turn pure noise into a pattern of dots.',
    tasks: TASKS.map(function (t) { return { id: t.id, text: t.text }; }),
    mount: mount
  };
})();
