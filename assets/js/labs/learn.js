/* AI Marg lab: "Teach the machine". A fruit vendor sorts mangoes into ripe and not ripe from two scores,
   skin colour and softness. The learner first writes the rule by hand (drags a straight line), then
   watches logistic regression learn its own line from the labelled examples, one example at a time,
   and tests both rules on new mangoes that neither of them ever learned from.
   Plain classic script (ES2019). Registers window.AILabs.learn. No libraries, no network, no storage. */
(function () {
  'use strict';
  var Labs = (window.AILabs = window.AILabs || {});
  var mountCount = 0;

  /* ---------- constants ---------- */
  // Picked so that: a hand-drawn rule can reach 85%+, the default rule cannot, the learned line is as good as
  // any straight line can be on the new mangoes, and the first 4 examples alone give a clearly worse line.
  var DATA_SEED = 176996;
  var N_TRAIN = 30, N_TEST = 24, N_MIN = 4, MAX_ADDED = 40;
  // Nature's rule behind the data: ripe is likely when 0.6 × colour + 0.4 × softness is above 5.
  var TRUE_A = 0.6, TRUE_B = 0.4, TRUE_D = 5, NOISE = 2.4;
  // Logistic regression trained by stochastic gradient descent (one example at a time).
  // A small L2 penalty (LAMBDA) keeps the weights finite, so there is always exactly one best line to settle on.
  var LR0 = 2, DECAY = 4, LAMBDA = 0.02;
  var TOL = 0.005;            // "settled": the slope (gradient) of the loss over all used examples is below this
  var MAX_PASSES = 400;       // a run that has not settled after this many passes pauses by itself
  // The machine's random-looking first guess. Its weights are about as large as the learned ones end up, so the
  // first nudges move the line visibly but do not throw it off the map.
  var START_GUESS = { w1: -1, w2: 2, b: 0.8 };
  var SHUFFLE_SEED = 7;
  var SPEEDS = { slow: 2, normal: 60, fast: 360 };   // examples per second
  var MISTAKE_MARGIN = 0.75;  // an added mango must be this far (in score points) from nature's line to count as a clear mistake
  var TILT_AREA = 0.03;       // task 3: mistakes must change the answer on at least 3% of the map
  var START_HANDLES = [{ c: 1.5, s: 7 }, { c: 8.5, s: 7 }];   // starting rule: "ripe if softness is more than 7"
  var MIN_GAP = 1;            // the two handles stay at least this far apart
  var LABEL = ['Not ripe', 'Ripe'];

  var TASKS = [
    { id: 't1', text: 'Write your own rule: drag the handles until your line gets at least 85% of the example mangoes right (with all 30 in use).' },
    { id: 't2', text: 'Switch to “Machine learns it” and let it learn from all 30 examples until its line settles. See it match or beat your rule on the new (hollow) mangoes.' },
    { id: 't3', text: 'Make 3 labelling mistakes (tap example mangoes to flip their labels, or add mangoes with the wrong label), let the machine learn again until it settles, and watch its line tilt away from the correct-labels line.' },
    { id: 't4', text: 'Set the slider to just 4 example mangoes and let the machine learn until it settles, then do the same with all 30. See that 4 examples give a worse score on the new mangoes.' }
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
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function sig(z) { return z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z)); }
  function round1(v) { return Math.round(v * 10) / 10; }
  function f1(v) { return (Math.round(v * 10) / 10).toFixed(1).replace('-', '−'); }
  function f2(v) { return (Math.round(v * 100) / 100).toFixed(2).replace('-', '−'); }
  function pctOf(r, n) { return n > 0 ? Math.round(100 * r / n) + '%' : '—'; }
  function fmtInt(n) {   // Indian digit grouping: 125000 -> 1,25,000
    var s = String(Math.round(n));
    if (s.length > 3) s = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3);
    return s;
  }
  function plural(n, one, many) { return fmtInt(n) + ' ' + (n === 1 ? one : many); }

  /* ---------- the mangoes ---------- */
  // Mangoes ripen along a path from green and hard to yellow and soft; each label is drawn at random from
  // nature's rule, so a few mangoes near the line go either way (as in real life).
  function makeData() {
    var r = mulberry32(DATA_SEED);
    function batch(n) {
      var pts = [];
      for (var i = 0; i < n; i++) {
        var base = 1 + 8 * r();
        var c = Math.round(clamp(base + (r() - 0.5) * 3.4, 0.3, 9.7) * 10) / 10;
        var s = Math.round(clamp(base + (r() - 0.5) * 3.4, 0.3, 9.7) * 10) / 10;
        var p = sig(NOISE * (TRUE_A * c + TRUE_B * s - TRUE_D));
        pts.push({ c: c, s: s, y: r() < p ? 1 : 0 });
      }
      return pts;
    }
    var train = batch(N_TRAIN), test = batch(N_TEST);
    train.forEach(function (p) { p.y0 = p.y; p.orig = true; });
    return { train: train, test: test };
  }
  // Scores run 0..10; the machine works with them rescaled to -1..1 so both weights start on an equal footing.
  function fx(v) { return v / 5 - 1; }
  // Every rule here is a straight line: a mango is called ripe when a × colour + b × softness > d.
  function ruleOfMachine(m) { return { a: m.w1 / 5, b: m.w2 / 5, d: m.w1 + m.w2 - m.b }; }
  function predict(L, p) { return L.a * p.c + L.b * p.s > L.d ? 1 : 0; }
  function score(L, pts) {
    var r = 0;
    for (var i = 0; i < pts.length; i++) if (predict(L, pts[i]) === pts[i].y) r++;
    return { right: r, n: pts.length };
  }
  function natureLabel(p) { return TRUE_A * p.c + TRUE_B * p.s > TRUE_D ? 1 : 0; }
  // A labelling mistake: a vendor's example whose label was flipped, or an added mango whose label is clearly
  // the opposite of what mangoes like it usually turn out to be.
  function isMistake(p) {
    if (p.orig) return p.y !== p.y0;
    var t = TRUE_A * p.c + TRUE_B * p.s - TRUE_D;
    return Math.abs(t) / Math.hypot(TRUE_A, TRUE_B) >= MISTAKE_MARGIN && natureLabel(p) !== p.y;
  }
  function correctLabel(p) { return p.orig ? p.y0 : isMistake(p) ? 1 - p.y : p.y; }

  // Average logistic loss (+ L2 penalty) and its gradient over a set of mangoes.
  function gradNorm(m, pts) {
    var g1 = 0, g2 = 0, gb = 0, n = pts.length;
    if (!n) return 0;
    for (var i = 0; i < n; i++) {
      var x1 = fx(pts[i].c), x2 = fx(pts[i].s), e = sig(m.w1 * x1 + m.w2 * x2 + m.b) - pts[i].y;
      g1 += e * x1; g2 += e * x2; gb += e;
    }
    g1 = g1 / n + LAMBDA * m.w1; g2 = g2 / n + LAMBDA * m.w2; gb /= n;
    return Math.sqrt(g1 * g1 + g2 * g2 + gb * gb);
  }
  // The exact best line for a set of mangoes (Newton's method), used to judge how far label mistakes moved it.
  function exactFit(pts) {
    var w = [0, 0, 0], n = pts.length;
    if (!n) return { w1: 0, w2: 0, b: 0 };
    for (var it = 0; it < 60; it++) {
      var H = [[LAMBDA, 0, 0], [0, LAMBDA, 0], [0, 0, 1e-9]], g = [LAMBDA * w[0], LAMBDA * w[1], 0];
      for (var i = 0; i < n; i++) {
        var x = [fx(pts[i].c), fx(pts[i].s), 1], q = sig(w[0] * x[0] + w[1] * x[1] + w[2]);
        for (var a = 0; a < 3; a++) {
          g[a] += (q - pts[i].y) * x[a] / n;
          for (var b = 0; b < 3; b++) H[a][b] += q * (1 - q) * x[a] * x[b] / n;
        }
      }
      var d = solve3(H, g);
      if (!d) break;
      w[0] -= d[0]; w[1] -= d[1]; w[2] -= clamp(d[2], -5, 5);
      if (Math.abs(d[0]) + Math.abs(d[1]) + Math.abs(d[2]) < 1e-9) break;
    }
    return { w1: w[0], w2: w[1], b: w[2] };
  }
  function solve3(A, v) {
    var M = A.map(function (row, i) { return row.concat([v[i]]); }), i, k, j;
    for (i = 0; i < 3; i++) {
      var p = i;
      for (k = i + 1; k < 3; k++) if (Math.abs(M[k][i]) > Math.abs(M[p][i])) p = k;
      var tmp = M[i]; M[i] = M[p]; M[p] = tmp;
      if (Math.abs(M[i][i]) < 1e-14) return null;
      for (k = 0; k < 3; k++) if (k !== i) { var f = M[k][i] / M[i][i]; for (j = i; j < 4; j++) M[k][j] -= f * M[i][j]; }
    }
    return [M[0][3] / M[0][0], M[1][3] / M[1][1], M[2][3] / M[2][2]];
  }
  // Share of the 0..10 map where two rules give different answers.
  function areaDiff(L1, L2) {
    var diff = 0, N = 40;
    for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) {
      var p = { c: (i + 0.5) * 10 / N, s: (j + 0.5) * 10 / N };
      if (predict(L1, p) !== predict(L2, p)) diff++;
    }
    return diff / (N * N);
  }
  // The rule in plain words, e.g. "ripe if 0.62 × colour + 0.38 × softness is more than 4.81".
  function ruleWords(L) {
    var s = Math.abs(L.a) + Math.abs(L.b);
    if (!(s > 1e-9)) return L.d < 0 ? 'every mango is ripe' : 'no mango is ripe';
    var a = L.a / s, b = L.b / s, d = L.d / s;
    if (Math.abs(b) < 0.005) return 'ripe if colour is ' + (a > 0 ? 'more' : 'less') + ' than ' + f1(d / a);
    if (Math.abs(a) < 0.005) return 'ripe if softness is ' + (b > 0 ? 'more' : 'less') + ' than ' + f1(d / b);
    var cmp = 'more';
    if (a < 0 && b < 0) { a = -a; b = -b; d = -d; cmp = 'less'; }
    var tc = f2(Math.abs(a)) + ' × colour', ts = f2(Math.abs(b)) + ' × softness', expr;
    if (a > 0 && b > 0) expr = tc + ' + ' + ts;
    else if (a > 0) expr = tc + ' − ' + ts;
    else expr = ts + ' − ' + tc;
    return 'ripe if ' + expr + ' is ' + cmp + ' than ' + f2(d);
  }

  /* ---------- colours (read from CSS variables at draw time) ---------- */
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
  function rgb(c, a) { return a == null ? 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')' : 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function luminance(c) {
    function ch(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2]);
  }
  var THEME_VARS = ['--surface', '--ink', '--muted', '--line', '--haldi', '--series-1', '--series-2', '--series-3', '--series-4', '--font-body'];
  var themeCache = { key: '', theme: null };
  function readTheme() {
    var cs = getComputedStyle(document.documentElement), raw = {}, key = '';
    for (var i = 0; i < THEME_VARS.length; i++) { raw[THEME_VARS[i]] = cs.getPropertyValue(THEME_VARS[i]).trim(); key += raw[THEME_VARS[i]] + '|'; }
    if (themeCache.key === key && themeCache.theme) return themeCache.theme;
    var T = {
      surface: toRgb(raw['--surface']), ink: toRgb(raw['--ink']), muted: toRgb(raw['--muted']), line: toRgb(raw['--line']),
      haldi: toRgb(raw['--haldi']), mac: toRgb(raw['--series-1']), you: toRgb(raw['--series-2']),
      cls: [toRgb(raw['--series-4']), toRgb(raw['--series-3'])],   // [not ripe = green-teal, ripe = mango yellow]
      font: raw['--font-body'] || 'system-ui, sans-serif'
    };
    T.dark = luminance(T.surface) < 0.2;
    themeCache = { key: key, theme: T };
    return T;
  }

  /* ---------- legend swatches (shape repeats the colour, so colour is never the only clue) ---------- */
  function swatch(kind, fill, stroke, sw) {
    var p;
    if (kind === 'diamond') p = '<polygon points="7,0.6 13.4,7 7,13.4 0.6,7"/>';
    else if (kind === 'ring') p = '<circle cx="7" cy="7" r="5.6"/>';
    else if (kind === 'line') p = '<path d="M0 7 H14"/>';
    else if (kind === 'dash') p = '<path d="M0 7 H14" stroke-dasharray="4 3"/>';
    else if (kind === 'dot') p = '<path d="M1 7 H14" stroke-dasharray="1.5 3" stroke-linecap="round"/>';
    else if (kind === 'cross') p = '<path d="M3 3 L11 11 M11 3 L3 11"/>';
    else p = '<circle cx="7" cy="7" r="5.2"/>';
    return '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false" style="flex:none;overflow:visible;fill:' + fill + ';stroke:' + stroke + ';stroke-width:' + sw + '">' + p + '</svg>';
  }
  var SW_RIPE = swatch('circle', 'var(--series-3)', 'var(--ink)', 0.9);
  var SW_UNRIPE = swatch('diamond', 'var(--series-4)', 'var(--ink)', 0.9);
  var SW_NEW_RIPE = swatch('ring', 'var(--surface)', 'var(--series-3)', 2.2);
  var SW_NEW_UNRIPE = swatch('diamond', 'var(--surface)', 'var(--series-4)', 2.2);
  var SW_WRONG = swatch('ring', 'none', 'var(--ink)', 1.5);
  var SW_CROSS = swatch('cross', 'none', 'var(--ink)', 1.8);
  // not a <span>: style.css draws an extra coloured dot before every span inside .lab-legend
  var SW_FADED = '<b aria-hidden="true" style="display:inline-flex;opacity:.35">' + swatch('circle', 'var(--series-3)', 'none', 0) + '</b>';
  function legendItem(svg, text) { return '<i style="font-style:normal;display:inline-flex;align-items:center;gap:6px">' + svg + text + '</i>'; }

  /* ================================================================ */
  function mount(root, ctx) {
    var P = 'learn' + (++mountCount) + '-';
    var listeners = [];
    function on(el, type, fn, opts) { el.addEventListener(type, fn, opts); listeners.push([el, type, fn, opts]); }
    var destroyed = false;
    var DATA = makeData();

    var tasksHtml = TASKS.map(function (t) { return '<li data-task="' + t.id + '">' + t.text + '</li>'; }).join('');
    function handleBtn(i) {
      return '<button type="button" id="' + P + 'h' + i + '" aria-describedby="' + P + 'kbd" style="position:absolute;left:0;top:0;width:30px;height:30px;margin:-15px 0 0 -15px;padding:0;border:0;border-radius:50%;background:transparent;pointer-events:none"></button>';
    }
    function chipSw(svg) { return '<span aria-hidden="true" style="display:inline-flex;padding:2px;border-radius:4px;background:var(--surface)">' + svg + '</span>'; }
    var rowTh = ' scope="row" style="text-transform:none;letter-spacing:0;font-size:.92rem;color:var(--ink);white-space:nowrap"';

    var top = document.createElement('div');
    top.className = 'lab';
    top.innerHTML =
      '<p class="lab-note"><strong>What you are seeing:</strong> a fruit vendor in Ratnagiri has checked 30 mangoes and labelled each one: ' +
        'yellow circles were <em>ripe</em>, green diamonds were <em>not ripe</em>. Left to right is the skin colour score (0 = fully green, 10 = fully yellow); ' +
        'bottom to top is the softness score (0 = rock hard, 10 = very soft). The straight line is a <em>rule</em>: mangoes on its yellow side are called ripe, the rest not ripe. ' +
        'Hollow shapes are 24 <em>new mangoes</em> that no rule ever learns from; they are kept aside as a fair test.</p>' +
      '<div class="lab-body">' +
        '<div class="stack-sm" id="' + P + 'left">' +
          '<div class="lab-canvas-wrap" id="' + P + 'wrap">' +
            '<canvas id="' + P + 'plot" tabindex="0" role="img" aria-label="Map of mangoes" aria-describedby="' + P + 'kbd" style="outline-offset:-3px;cursor:crosshair"></canvas>' +
            handleBtn(0) + handleBtn(1) +
          '</div>' +
          '<div class="lab-legend" id="' + P + 'legend"></div>' +
          '<p class="small" id="' + P + 'readout" style="min-height:3.2em"></p>' +
          '<p class="visually-hidden" role="status" aria-live="polite" id="' + P + 'live"></p>' +
          // scoreboard: under the map on wide screens, just after the mode buttons on phones (see placeMore)
          '<div class="stack-sm" id="' + P + 'scores">' +
          '<div class="table-wrap"><table class="simple" style="font-size:.92rem">' +
            '<caption class="visually-hidden">How many mangoes each rule gets right</caption>' +
            '<thead><tr><th scope="col">Rule</th><th scope="col">Example mangoes</th><th scope="col">New mangoes (test)</th></tr></thead>' +
            '<tbody>' +
              '<tr><th' + rowTh + '>' + swatch('line', 'none', 'var(--series-2)', 3) + ' Your rule</th><td id="' + P + 'utr"></td><td id="' + P + 'ute"></td></tr>' +
              '<tr><th' + rowTh + '>' + swatch('line', 'none', 'var(--series-1)', 3) + ' Machine</th><td id="' + P + 'mtr"></td><td id="' + P + 'mte"></td></tr>' +
            '</tbody></table></div>' +
          '<div class="lab-stats">' +
            '<div class="stat"><div class="k">Seen by machine</div><div class="v" id="' + P + 'sseen">0</div></div>' +
            '<div class="stat"><div class="k">Examples used</div><div class="v" id="' + P + 'sused">30</div></div>' +
            '<div class="stat"><div class="k">Wrong labels</div><div class="v" id="' + P + 'swrong">0</div></div>' +
          '</div>' +
          '</div>' +
        '</div>' +
        '<div class="lab-controls">' +
          '<div class="control"><span class="control-label" id="' + P + 'modelbl">Who makes the rule?</span>' +
            '<div class="seg" role="group" aria-labelledby="' + P + 'modelbl">' +
              '<button type="button" data-mode="you" aria-pressed="true">You write it</button>' +
              '<button type="button" data-mode="machine" aria-pressed="false">Machine learns it</button>' +
            '</div></div>' +
          '<div class="stack-sm" id="' + P + 'pyou">' +
            '<p class="small muted">Drag the two round handles on the map to move your line. Mangoes on the yellow side of it are called ripe.</p>' +
            '<p class="small" id="' + P + 'ruleyou"></p>' +
            '<div class="row"><button type="button" class="btn btn-sm" id="' + P + 'swap">Swap the ripe side</button></div>' +
          '</div>' +
          '<div class="stack-sm" id="' + P + 'pmac" hidden>' +
            '<p class="small muted">The machine starts with a random guess. Then it looks at the example mangoes one at a time; whenever it is wrong or unsure about one, it nudges its line a little towards the right answer.</p>' +
            '<div class="row">' +
              '<button type="button" class="btn btn-primary" id="' + P + 'learn">Let the machine learn</button>' +
              '<button type="button" class="btn btn-sm" id="' + P + 'step">Learn from 1 example</button>' +
              '<button type="button" class="btn btn-sm" id="' + P + 'restart">Start over</button>' +
            '</div>' +
            '<div class="control"><span class="control-label" id="' + P + 'speedlbl">Speed</span>' +
              '<div class="seg" role="group" aria-labelledby="' + P + 'speedlbl">' +
                '<button type="button" data-speed="slow" aria-pressed="false">Slow</button>' +
                '<button type="button" data-speed="normal" aria-pressed="true">Normal</button>' +
                '<button type="button" data-speed="fast" aria-pressed="false">Fast</button>' +
              '</div></div>' +
            '<p class="small" id="' + P + 'rulemac"></p>' +
            '<p class="small muted" id="' + P + 'status"></p>' +
            '<div class="small" id="' + P + 'history" hidden></div>' +
          '</div>' +
          '<h2 class="lab-h" id="' + P + 'mhead">The mangoes</h2>' +
          '<div class="control"><label for="' + P + 'n">Example mangoes to learn from <output id="' + P + 'nout" for="' + P + 'n" style="white-space:nowrap">30 of 30</output></label>' +
            '<input type="range" id="' + P + 'n" min="' + N_MIN + '" max="' + N_TRAIN + '" step="1" value="' + N_TRAIN + '">' +
            '<p class="small muted">Keeps only the first ones the vendor checked. The others fade out and nobody learns from them.</p></div>' +
          '<div class="control"><span class="control-label" id="' + P + 'addlbl">Label for mangoes you add</span>' +
            '<div class="seg" role="group" aria-labelledby="' + P + 'addlbl">' +
              '<button type="button" data-add="1" aria-pressed="true" style="display:inline-flex;align-items:center;gap:6px">' + chipSw(SW_RIPE) + 'Ripe</button>' +
              '<button type="button" data-add="0" aria-pressed="false" style="display:inline-flex;align-items:center;gap:6px">' + chipSw(SW_UNRIPE) + 'Not ripe</button>' +
            '</div>' +
            '<p class="small muted">Tap an empty spot on the map to add a mango with this label. Tap a filled mango to flip its label (a labelling mistake).</p></div>' +
          '<div class="row"><input type="checkbox" id="' + P + 'showtest" checked><label for="' + P + 'showtest" class="small">Show the new mangoes (hollow)</label></div>' +
          '<div class="row"><button type="button" class="btn btn-sm" id="' + P + 'reset">Reset the mangoes</button></div>' +
          '<div class="stack-sm"><h2 class="lab-h">Your tasks</h2><ul class="lab-tasks" id="' + P + 'tasks">' + tasksHtml + '</ul></div>' +
        '</div>' +
      '</div>' +
      // the explanation sits under the scoreboard on wide screens and below the controls on phones (see placeMore)
      '<div class="stack-sm" id="' + P + 'more">' +
        '<h2 class="lab-h">Rules vs learning</h2>' +
        '<p class="small"><strong>AI</strong> (artificial intelligence) means a machine doing a task that normally needs human judgement, like sorting mangoes. ' +
          'One way to build it is to <strong>write the rule yourself</strong>, as you do with the handles. <strong>Machine learning (ML)</strong> turns this round: ' +
          'you give the machine labelled examples and it <em>learns the rule from the data</em> by itself. When every example comes with the right answer ' +
          '(its <em>label</em>, here ripe or not ripe), this is called <strong>supervised learning</strong>.</p>' +
        '<p class="small">This machine uses <strong>logistic regression</strong> (a simple ML method). It gives colour and softness a <em>weight</em> each ' +
          '(how much that measurement counts), adds them up into one score, and turns the score into a chance of being ripe. Its line is where that chance is exactly 50%. ' +
          'Learning means adjusting the weights, one example at a time, so the examples get the right answer more often. A <em>pass</em> means it has looked at every example once.</p>' +
        '<p class="kbd-hint" id="' + P + 'kbd">Keyboard: Tab to a round handle and move it with the arrow keys (hold Shift for bigger steps). On the map, the arrow keys move a cross; Enter adds a mango there, or flips the label of the mango under the cross.</p>' +
      '</div>' +
      '<p class="small muted"><strong style="color:var(--ink)">Why it matters in real ML:</strong> spam filters, UPI fraud alerts and crop-disease apps all learn their rules from labelled examples like these, ' +
        'so they are only as good as their data: more examples give a better rule, wrong labels quietly bend it, and only a fair test on new data shows how good it really is.</p>';
    root.appendChild(top);

    function $(id) { return top.querySelector('#' + P + id); }
    var wrap = $('wrap'), canvas = $('plot'), g = canvas.getContext('2d');
    var hBtns = [$('h0'), $('h1')];
    var elLegend = $('legend'), elReadout = $('readout'), elLive = $('live');
    var elUtr = $('utr'), elUte = $('ute'), elMtr = $('mtr'), elMte = $('mte');
    var elSeen = $('sseen'), elUsed = $('sused'), elWrong = $('swrong');
    var panelYou = $('pyou'), panelMac = $('pmac'), elRuleYou = $('ruleyou'), elRuleMac = $('rulemac'), elStatus = $('status'), elHistory = $('history');
    var btnSwap = $('swap'), btnLearn = $('learn'), btnStep = $('step'), btnRestart = $('restart'), btnReset = $('reset');
    var elN = $('n'), elNout = $('nout'), elShowTest = $('showtest');
    var modeBtns = top.querySelectorAll('[data-mode]'), speedBtns = top.querySelectorAll('[data-speed]'), addBtns = top.querySelectorAll('[data-add]');
    var taskEls = {};
    Array.prototype.forEach.call(top.querySelectorAll('[data-task]'), function (li) { taskEls[li.getAttribute('data-task')] = li; });

    /* ---------- state ---------- */
    function freshExamples() { return DATA.train.map(function (p) { return { c: p.c, s: p.s, y: p.y0, y0: p.y0, orig: true }; }); }
    var S = {
      ex: freshExamples(), test: DATA.test, nUse: N_TRAIN, addLabel: 1, showTest: true, mode: 'you',
      // your rule: two handles and the unit "normal" that points into the ripe side
      h: [{ c: START_HANDLES[0].c, s: START_HANDLES[0].s }, { c: START_HANDLES[1].c, s: START_HANDLES[1].s }], rn: { c: 0, s: 1 },
      ruleTouched: false,
      // the machine
      m: { w1: START_GUESS.w1, w2: START_GUESS.w2, b: START_GUESS.b }, prevM: null,
      seen: 0, since: 0, passes: 0, passesSince: 0, order: null, pos: 0, rng: mulberry32(SHUFFLE_SEED),
      running: false, settled: false, capped: false, speed: 'normal', last: null,
      version: 0, rec: {}, notice: '', hover: null, kb: { c: 5, s: 5, on: false }, focusH: -1
    };
    var done = {};
    var D = { used: [], usedIdx: [], mistakes: 0, clean: null, userRule: null, macRule: null };
    var dims = { w: 1, h: 1, dpr: 1 };
    var rafId = 0, aspectRaf = 0, lastT = 0, budget = 0, liveTimer = 0;
    var labelPos = {};   // remembered on-canvas label spots, so labels do not jump about

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
    function completeTask(id, why) {
      if (done[id]) return;
      done[id] = true;
      markLi(id);
      announce('Task done: ' + why);
      if (ctx && ctx.onTaskDone) ctx.onTaskDone(id);
    }
    var pendingMsg = '';
    function announce(s) {
      // clear first so the same sentence twice is still read out; messages sent in the same moment are joined,
      // so a "Task done" message is not wiped by the message that follows it
      pendingMsg = pendingMsg ? pendingMsg + ' ' + s : s;
      elLive.textContent = '';
      if (liveTimer) clearTimeout(liveTimer);
      liveTimer = setTimeout(function () { liveTimer = 0; var m = pendingMsg; pendingMsg = ''; if (!destroyed) elLive.textContent = m; }, 30);
    }

    /* ---------- derived numbers ---------- */
    function userRule() {
      var n = S.rn, h = S.h[0];
      return { a: n.c, b: n.s, d: n.c * h.c + n.s * h.s };
    }
    function recompute() {
      D.usedIdx = []; D.used = [];
      for (var i = 0; i < S.ex.length; i++) if (!S.ex[i].orig || i < S.nUse) { D.usedIdx.push(i); D.used.push(S.ex[i]); }
      D.mistakes = D.used.filter(isMistake).length;
      D.clean = D.mistakes ? ruleOfMachine(exactFit(D.used.map(function (p) { return { c: p.c, s: p.s, y: correctLabel(p) }; }))) : null;
      refreshRules();
    }
    function refreshRules() { D.userRule = userRule(); D.macRule = ruleOfMachine(S.m); }
    function activeRule() { return S.mode === 'you' ? D.userRule : D.macRule; }
    function testShown() { return S.showTest; }

    /* ---------- the learning (one example at a time) ---------- */
    function shuffleOrder() {
      var a = S.order;
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(S.rng() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    }
    function learnOne() {
      var n = D.usedIdx.length;
      if (!n) return;
      if (!S.order || S.pos >= S.order.length) { S.order = S.order && S.order.length === n ? S.order : D.usedIdx.slice(); shuffleOrder(); S.pos = 0; }
      var i = S.order[S.pos++], p = S.ex[i], m = S.m;
      var x1 = fx(p.c), x2 = fx(p.s), prob = sig(m.w1 * x1 + m.w2 * x2 + m.b);
      var lr = LR0 / (1 + S.since / (DECAY * n)), e = p.y - prob;
      S.prevM = { w1: m.w1, w2: m.w2, b: m.b };
      // gradient step on the logistic loss for this one mango, plus the small L2 pull towards 0
      m.w1 += lr * (e * x1 - LAMBDA * m.w1);
      m.w2 += lr * (e * x2 - LAMBDA * m.w2);
      m.b += lr * e;
      S.seen++; S.since++;
      S.last = { i: i, prob: prob, y: p.y };
      refreshRules();
      if (S.pos >= S.order.length) endOfPass();
    }
    function endOfPass() {
      S.passes++; S.passesSince++;
      if (S.settled) return;
      if (gradNorm(S.m, D.used) < TOL) settle();
      else if (S.passesSince >= MAX_PASSES) {
        S.running = false; S.capped = true;
        announce(oneLabel() ? ONE_LABEL_MSG : 'The machine paused after ' + plural(S.passesSince, 'pass', 'passes') + ' without settling. Press “Let the machine learn” to keep going.');
      }
    }
    function settle() {
      S.settled = true; S.running = false; S.capped = false; S.last = null; S.prevM = null;
      var te = score(D.macRule, S.test), tr = score(D.macRule, D.used);
      announce('The machine’s line has settled after ' + plural(S.seen, 'example', 'examples') + ' seen. Its rule: ' + ruleWords(D.macRule) +
        '. It gets ' + tr.right + ' of ' + tr.n + ' examples and ' + te.right + ' of ' + te.n + ' new mangoes right.');
      var rec = S.rec[S.version] || (S.rec[S.version] = {});
      rec[S.nUse] = te.right;
      checkCompare();
      checkSettledTasks();
    }
    // task 2: the settled machine against your (moved) rule, on the new mangoes
    function checkCompare() {
      if (!S.settled || !S.ruleTouched || S.nUse !== N_TRAIN) return;
      var te = score(D.macRule, S.test), ute = score(D.userRule, S.test);
      if (te.right >= ute.right) {
        completeTask('t2', 'the machine learned a rule that gets ' + te.right + ' of ' + te.n + ' new mangoes right; yours gets ' + ute.right + '.');
      }
    }
    // tasks 3 and 4: judged at the moment the line settles
    function checkSettledTasks() {
      if (D.mistakes >= 3) {
        var withMistakes = ruleOfMachine(exactFit(D.used));
        if (D.clean && areaDiff(withMistakes, D.clean) >= TILT_AREA) completeTask('t3', 'the wrong labels pulled the learned line away from the correct-labels line.');
        else if (!done.t3) setNotice('The line hardly moved. Mistakes far from the line pull harder: try flipping mangoes deep inside a group.');
      }
      var rec = S.rec[S.version];
      if (rec && rec[N_MIN] != null && rec[N_TRAIN] != null) {
        if (rec[N_MIN] < rec[N_TRAIN]) completeTask('t4', 'with 4 examples the machine got ' + rec[N_MIN] + ' new mangoes right, with all 30 it got ' + rec[N_TRAIN] + '.');
        else if (!done.t4 && (S.nUse === N_MIN || S.nUse === N_TRAIN)) {
          setNotice('This time 4 examples did at least as well as 30 on the new mangoes (' + rec[N_MIN] + ' and ' + rec[N_TRAIN] + ' of ' + N_TEST +
            '), because of the mangoes you flipped or added. Press “Reset the mangoes”, then let it learn with 4 and with 30 again.');
        }
      }
    }
    function checkRuleTasks() {
      if (!S.ruleTouched) return;
      var tr = score(D.userRule, D.used);
      // judged on the same rounded percentage the scoreboard shows, so "85%" on screen always counts
      if (S.nUse === N_TRAIN && tr.n && Math.round(100 * tr.right / tr.n) >= 85) completeTask('t1', 'your rule gets ' + tr.right + ' of ' + tr.n + ' examples right (' + pctOf(tr.right, tr.n) + ').');
      checkCompare();
    }
    // with only one label in use there is no border to learn: the best line drifts off the map for ever
    function oneLabel() { for (var i = 1; i < D.used.length; i++) if (D.used[i].y !== D.used[0].y) return false; return D.used.length > 0; }
    var ONE_LABEL_MSG = 'Every example in use has the same label, so there is no border between ripe and not ripe to learn: the line just keeps drifting off the map. Flip a label back or press “Reset the mangoes”.';

    /* ---------- changes ---------- */
    function setNotice(s) { S.notice = s; }
    // The examples the machine learns from have changed: it keeps its current line but must learn again.
    function examplesChanged(newVersion) {
      if (newVersion) { S.version++; elHistory.hidden = true; }
      S.since = 0; S.passesSince = 0; S.order = null; S.pos = 0;
      S.settled = false; S.capped = false; S.last = null; S.prevM = null; S.hover = null;
      recompute();
      checkRuleTasks();   // e.g. a good rule drawn with the slider at 4 counts once the slider is back at 30
      requestRender();
    }
    function flip(i) {
      var p = S.ex[i];
      p.y = 1 - p.y;
      setNotice('');
      examplesChanged(true);
      var m = isMistake(p);
      announce('Flipped a mango at colour ' + f1(p.c) + ', softness ' + f1(p.s) + ' to ' + LABEL[p.y] + '.' +
        (m ? ' That is a labelling mistake.' : p.orig ? ' That is its correct label again.' : '') + ' Wrong labels: ' + D.mistakes + '.');
      setNotice('Flipped to ' + LABEL[p.y] + (m ? ': a labelling mistake.' : '.'));
    }
    function addMango(c, s) {
      var added = S.ex.length - N_TRAIN;
      if (added >= MAX_ADDED) { setNotice('That is the limit of ' + MAX_ADDED + ' added mangoes. Press “Reset the mangoes” to start again.'); announce(S.notice); requestRender(); return; }
      var p = { c: round1(clamp(c, 0, 10)), s: round1(clamp(s, 0, 10)), y: S.addLabel, orig: false };
      S.ex.push(p);
      examplesChanged(true);
      var mis = isMistake(p), border = !mis && natureLabel(p) !== p.y;
      var note = mis ? 'Mangoes like this usually turn out ' + LABEL[1 - p.y].toLowerCase() + ', so this is a labelling mistake.'
        : border ? 'It sits close to the border, so it does not count as a clear mistake.' : '';
      setNotice('Added a ' + LABEL[p.y].toLowerCase() + ' mango at colour ' + f1(p.c) + ', softness ' + f1(p.s) + '. ' + note);
      announce(S.notice + ' Wrong labels: ' + D.mistakes + '.');
    }
    function moveHandle(k, c, s) {
      var h = S.h[k], o = S.h[1 - k];
      c = clamp(c, 0, 10); s = clamp(s, 0, 10);
      if (Math.hypot(c - o.c, s - o.s) < MIN_GAP) return false;
      if (Math.abs(c - h.c) < 1e-9 && Math.abs(s - h.s) < 1e-9) return false;
      h.c = c; h.s = s;
      // keep the ripe side on the same side of the line as the line turns
      var dc = S.h[1].c - S.h[0].c, ds = S.h[1].s - S.h[0].s, len = Math.hypot(dc, ds);
      var nc = -ds / len, ns = dc / len;
      if (nc * S.rn.c + ns * S.rn.s < 0) { nc = -nc; ns = -ns; }
      S.rn = { c: nc, s: ns };
      S.ruleTouched = true;
      refreshRules();
      updateHandleLabels();
      checkRuleTasks();
      requestRender();
      return true;
    }
    function ruleSummary() {
      var tr = score(D.userRule, D.used), te = score(D.userRule, S.test);
      return 'Your rule: ' + ruleWords(D.userRule) + '. ' + tr.right + ' of ' + tr.n + ' examples right (' + pctOf(tr.right, tr.n) + '), ' +
        te.right + ' of ' + te.n + ' new mangoes right.';
    }
    function setMode(mode) {
      if (mode === S.mode) return;
      S.mode = mode;
      if (mode === 'you' && S.running) pause(true);
      Array.prototype.forEach.call(modeBtns, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === mode)); });
      panelYou.hidden = mode !== 'you';
      panelMac.hidden = mode !== 'machine';
      hBtns.forEach(function (b) { b.hidden = mode !== 'you'; });
      S.hover = null; setNotice('');
      announce(mode === 'you' ? 'You write the rule. ' + ruleSummary() : 'The machine learns the rule. ' + machineSummary());
      requestRender();
    }
    function machineSummary() {
      if (!S.seen) return 'It has not seen any examples yet. Press “Let the machine learn”.';
      var te = score(D.macRule, S.test);
      return 'Its rule so far: ' + ruleWords(D.macRule) + ', after ' + plural(S.seen, 'example', 'examples') + '. ' + te.right + ' of ' + te.n + ' new mangoes right.';
    }
    function start() {
      if (!D.used.length) return;
      if (S.settled) {
        setNotice('The line has already settled: more passes would hardly move it. Change the examples, or press “Start over”.');
        announce(S.notice);
        requestRender();
        return;
      }
      if (S.capped) S.passesSince = 0;   // a run that paused itself gets another full allowance of passes
      S.running = true; S.capped = false;
      lastT = 0; budget = 1;   // the first example is learned straight away
      setNotice('');
      announce('The machine is learning from ' + plural(D.used.length, 'example', 'examples') + '.');
      requestRender();
    }
    function pause(quiet) {
      if (!S.running) return;
      S.running = false;
      if (!quiet) announce('Paused after ' + plural(S.seen, 'example', 'examples') + '. ' + machineSummary());
      requestRender();
    }
    function restartMachine() {
      S.running = false;
      S.m = { w1: START_GUESS.w1, w2: START_GUESS.w2, b: START_GUESS.b };
      S.prevM = null; S.seen = 0; S.since = 0; S.passes = 0; S.passesSince = 0; S.order = null; S.pos = 0;
      S.rng = mulberry32(SHUFFLE_SEED); S.settled = false; S.capped = false; S.last = null;
      setNotice('');
      refreshRules();
      announce('The machine is back to its first guess and has seen no examples.');
      requestRender();
    }

    /* ---------- drawing ---------- */
    function geom() {
      var small = dims.w < 480;
      var pl = small ? 44 : 52, pr = small ? 10 : 14, pt = small ? 10 : 12, pb = small ? 42 : 46;
      return { pl: pl, pt: pt, pw: Math.max(10, dims.w - pl - pr), ph: Math.max(10, dims.h - pt - pb), small: small };
    }
    function toPx(Gm, c, s) { return { x: Gm.pl + c / 10 * Gm.pw, y: Gm.pt + (1 - s / 10) * Gm.ph }; }
    function toData(Gm, x, y) { return { c: (x - Gm.pl) / Gm.pw * 10, s: (1 - (y - Gm.pt) / Gm.ph) * 10 }; }
    function radius() { return clamp(dims.w / 120, 4.5, 6); }
    function font(T, px, weight) { return (weight || '400') + ' ' + px + 'px ' + T.font; }
    var BOX = [[0, 0], [10, 0], [10, 10], [0, 10]];
    // the part of the map on one side of a rule (Sutherland–Hodgman clipping of the square)
    function halfPlane(L, ripe) {
      var out = [];
      for (var i = 0; i < 4; i++) {
        var A = BOX[i], B = BOX[(i + 1) % 4];
        var fa = L.a * A[0] + L.b * A[1] - L.d, fb = L.a * B[0] + L.b * B[1] - L.d;
        if (!ripe) { fa = -fa; fb = -fb; }
        if (fa > 0) out.push(A);
        if ((fa > 0) !== (fb > 0) && fa !== fb) { var t = fa / (fa - fb); out.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]); }
      }
      return out;
    }
    // the piece of a rule's line inside the map, or null when the line misses the map
    function segment(L) {
      var pts = [];
      for (var i = 0; i < 4; i++) {
        var A = BOX[i], B = BOX[(i + 1) % 4];
        var fa = L.a * A[0] + L.b * A[1] - L.d, fb = L.a * B[0] + L.b * B[1] - L.d;
        if (fa === 0) pts.push(A);
        else if (fa * fb < 0) { var t = fa / (fa - fb); pts.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]); }
      }
      if (pts.length < 2) return null;
      var best = null, bd = -1;
      for (var p = 0; p < pts.length; p++) for (var q = p + 1; q < pts.length; q++) {
        var d = Math.hypot(pts[p][0] - pts[q][0], pts[p][1] - pts[q][1]);
        if (d > bd) { bd = d; best = [pts[p], pts[q]]; }
      }
      return bd > 1e-6 ? best : null;
    }
    function polyPath(Gm, poly) {
      g.beginPath();
      for (var i = 0; i < poly.length; i++) { var q = toPx(Gm, poly[i][0], poly[i][1]); if (i) g.lineTo(q.x, q.y); else g.moveTo(q.x, q.y); }
      g.closePath();
    }
    function drawRuleLine(Gm, L, colour, width, dash) {
      var sg = segment(L);
      if (!sg) return null;
      var a = toPx(Gm, sg[0][0], sg[0][1]), b = toPx(Gm, sg[1][0], sg[1][1]);
      g.save();
      g.setLineDash(dash || []);
      g.lineCap = dash && dash[0] < 3 ? 'round' : 'butt';
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y);
      g.lineWidth = width; g.strokeStyle = colour; g.stroke();
      g.restore();
      return [a, b];
    }
    function shapePath(ripe, x, y, r) {
      g.beginPath();
      if (ripe) g.arc(x, y, r, 0, Math.PI * 2);
      else { var q = r * 1.3; g.moveTo(x, y - q); g.lineTo(x + q, y); g.lineTo(x, y + q); g.lineTo(x - q, y); g.closePath(); }
    }
    function drawExample(T, Gm, p, r, used) {
      var q = toPx(Gm, p.c, p.s);
      shapePath(p.y === 1, q.x, q.y, r);
      if (!used) {
        g.fillStyle = rgb(T.cls[p.y], T.dark ? 0.28 : 0.3); g.fill();
        return;
      }
      g.fillStyle = rgb(T.cls[p.y]); g.fill();
      g.lineWidth = 1.2; g.strokeStyle = T.dark ? rgb(T.surface) : rgb(T.ink, 0.62); g.stroke();
      if (isMistake(p)) {
        // a small cross marks a labelling mistake
        var cx = q.x + r + 3, cy = q.y - r - 3, k = 3;
        g.beginPath(); g.moveTo(cx - k, cy - k); g.lineTo(cx + k, cy + k); g.moveTo(cx + k, cy - k); g.lineTo(cx - k, cy + k);
        g.lineCap = 'round';
        g.lineWidth = 4; g.strokeStyle = rgb(T.surface); g.stroke();
        g.lineWidth = 1.8; g.strokeStyle = rgb(T.ink); g.stroke();
      }
    }
    function drawTestMango(T, Gm, p, r) {
      var q = toPx(Gm, p.c, p.s);
      shapePath(p.y === 1, q.x, q.y, r - 0.6);
      g.fillStyle = rgb(T.surface); g.fill();
      g.lineWidth = 3.6; g.strokeStyle = T.dark ? rgb(T.surface) : rgb(T.ink, 0.55); g.stroke();
      g.lineWidth = 2.2; g.strokeStyle = rgb(T.cls[p.y]); g.stroke();
    }
    function ring(x, y, r, colour, width) {
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
      g.lineWidth = width; g.strokeStyle = colour; g.stroke();
    }
    function roundRect(x, y, w, h, r) {
      g.beginPath();
      g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.arcTo(x + w, y, x + w, y + r, r);
      g.lineTo(x + w, y + h - r); g.arcTo(x + w, y + h, x + w - r, y + h, r);
      g.lineTo(x + r, y + h); g.arcTo(x, y + h, x, y + h - r, r);
      g.lineTo(x, y + r); g.arcTo(x, y, x + r, y, r);
      g.closePath();
    }
    // Pick a spot for a text label among candidates: fewest mangoes and labels underneath, and stay put if possible.
    function placeLabel(key, w, h, cands, Gm, obstacles, pts, valid) {
      var best = null, bestScore = Infinity, prev = labelPos[key], r = radius() + 2;
      for (var i = 0; i < cands.length; i++) {
        var x = cands[i][0] - w / 2, y = cands[i][1] - h / 2;
        if (x < Gm.pl + 3 || y < Gm.pt + 3 || x + w > Gm.pl + Gm.pw - 3 || y + h > Gm.pt + Gm.ph - 3) continue;
        if (valid && !valid(x, y, w, h)) continue;
        var sc = 0, j;
        for (j = 0; j < pts.length; j++) { var p = pts[j]; if (p.x > x - r && p.x < x + w + r && p.y > y - r && p.y < y + h + r) sc += 10; }
        for (j = 0; j < obstacles.length; j++) { var o = obstacles[j]; if (x < o.x + o.w + 4 && x + w + 4 > o.x && y < o.y + o.h + 4 && y + h + 4 > o.y) sc += 100; }
        if (prev && Math.abs(prev.x - x) < 0.5 && Math.abs(prev.y - y) < 0.5) sc -= 5;
        sc += i * 0.001;
        if (sc < bestScore) { bestScore = sc; best = { x: x, y: y, w: w, h: h }; }
      }
      if (bestScore >= 100) best = null;   // better no label than one on top of another
      labelPos[key] = best;
      return best;
    }
    function pill(T, box, text, marker) {
      roundRect(box.x, box.y, box.w, box.h, 5);
      g.fillStyle = rgb(T.surface, 0.92); g.fill();
      g.lineWidth = 1; g.strokeStyle = rgb(T.ink, 0.3); g.stroke();
      var x = box.x + 7;
      if (marker) { marker(x, box.y + box.h / 2); x += 14; }
      g.fillStyle = rgb(T.ink);
      g.textAlign = 'left'; g.textBaseline = 'middle';
      g.fillText(text, x, box.y + box.h / 2 + 0.5);
    }

    function draw() {
      if (destroyed || dims.w < 2) return;
      var T = readTheme(), Gm = geom(), dpr = dims.dpr, r = radius(), i;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = rgb(T.surface);
      g.fillRect(0, 0, dims.w, dims.h);
      var act = activeRule(), you = S.mode === 'you';
      // the two sides of the active rule
      g.save();
      g.beginPath(); g.rect(Gm.pl, Gm.pt, Gm.pw, Gm.ph); g.clip();
      var ripePoly = halfPlane(act, true), unripePoly = halfPlane(act, false);
      if (unripePoly.length > 2) { polyPath(Gm, unripePoly); g.fillStyle = rgb(T.cls[0], T.dark ? 0.12 : 0.09); g.fill(); }
      if (ripePoly.length > 2) { polyPath(Gm, ripePoly); g.fillStyle = rgb(T.cls[1], T.dark ? 0.13 : 0.15); g.fill(); }
      g.restore();
      // grid and axes
      g.lineWidth = 1;
      g.strokeStyle = rgb(T.ink, T.dark ? 0.1 : 0.08);
      g.beginPath();
      for (i = 2; i < 10; i += 2) {
        var gx = Math.round(Gm.pl + Gm.pw * i / 10) + 0.5, gy = Math.round(Gm.pt + Gm.ph * i / 10) + 0.5;
        g.moveTo(gx, Gm.pt); g.lineTo(gx, Gm.pt + Gm.ph);
        g.moveTo(Gm.pl, gy); g.lineTo(Gm.pl + Gm.pw, gy);
      }
      g.stroke();
      g.strokeStyle = rgb(T.line);
      g.strokeRect(Math.round(Gm.pl) + 0.5, Math.round(Gm.pt) + 0.5, Math.round(Gm.pw) - 1, Math.round(Gm.ph) - 1);
      var fs = Gm.small ? 11 : 12;
      g.font = font(T, fs);
      g.fillStyle = rgb(T.muted);
      g.textBaseline = 'top';
      for (i = 0; i <= 10; i += 2) {
        g.textAlign = i === 0 ? 'left' : i === 10 ? 'right' : 'center';
        g.fillText(String(i), Gm.pl + Gm.pw * i / 10, Gm.pt + Gm.ph + 5);
      }
      g.textAlign = 'right';
      for (i = 0; i <= 10; i += 2) {
        g.textBaseline = i === 10 ? 'top' : i === 0 ? 'bottom' : 'middle';
        g.fillText(String(i), Gm.pl - 6, Gm.pt + Gm.ph * (1 - i / 10));
      }
      g.font = font(T, fs, '600');
      g.fillStyle = rgb(T.ink);
      g.textAlign = 'center'; g.textBaseline = 'bottom';
      g.fillText('Skin colour score (0 green, 10 yellow) →', Gm.pl + Gm.pw / 2, dims.h - 4);
      g.save();
      g.translate(fs * 0.5 + 4, Gm.pt + Gm.ph / 2);
      g.rotate(-Math.PI / 2);
      g.textBaseline = 'middle';
      g.fillText('Softness score (0 hard, 10 soft) →', 0, 0);
      g.restore();

      // lines: the other rule (dashed), the correct-labels line (dotted), the step before (faint), then the active rule
      g.save();
      g.beginPath(); g.rect(Gm.pl, Gm.pt, Gm.pw, Gm.ph); g.clip();
      var lines = [];
      if (!you && D.clean) { var cs = drawRuleLine(Gm, D.clean, rgb(T.muted), 2, [1.5, 4]); if (cs) lines.push({ key: 'clean', seg: cs, text: 'Correct labels', kind: 'dot', col: T.muted }); }
      if (you && S.seen > 0) { var ms = drawRuleLine(Gm, D.macRule, rgb(T.mac, 0.75), 1.6, [6, 4]); if (ms) lines.push({ key: 'mac', seg: ms, text: 'Machine', kind: 'dash', col: T.mac }); }
      if (!you) { var ys = drawRuleLine(Gm, D.userRule, rgb(T.you, 0.75), 1.6, [6, 4]); if (ys) lines.push({ key: 'you', seg: ys, text: 'Your rule', kind: 'dash', col: T.you }); }
      if (!you && S.prevM && S.speed === 'slow' && S.last) drawRuleLine(Gm, ruleOfMachine(S.prevM), rgb(T.mac, 0.3), 2, [3, 3]);
      var main = drawRuleLine(Gm, act, rgb(you ? T.you : T.mac), 2.6);
      if (main) lines.push({ key: 'main', seg: main, text: you ? 'Your rule' : 'Machine', kind: 'line', col: you ? T.you : T.mac });
      g.restore();

      // mangoes: unused (faded) first, then new mangoes, then the examples on top
      var shownPts = [];
      for (i = 0; i < S.ex.length; i++) if (S.ex[i].orig && i >= S.nUse) drawExample(T, Gm, S.ex[i], r, false);
      if (testShown()) for (i = 0; i < S.test.length; i++) { drawTestMango(T, Gm, S.test[i], r); shownPts.push(toPx(Gm, S.test[i].c, S.test[i].s)); }
      for (i = 0; i < D.used.length; i++) { drawExample(T, Gm, D.used[i], r, true); shownPts.push(toPx(Gm, D.used[i].c, D.used[i].s)); }
      // rings round the mangoes the active rule gets wrong
      g.beginPath();
      function wrongRing(p) {
        if (predict(act, p) === p.y) return;
        var q = toPx(Gm, p.c, p.s);
        g.moveTo(q.x + r + 4.5, q.y); g.arc(q.x, q.y, r + 4.5, 0, Math.PI * 2);
      }
      D.used.forEach(wrongRing);
      if (testShown()) S.test.forEach(wrongRing);
      g.lineWidth = 1.5; g.strokeStyle = rgb(T.ink, 0.85); g.stroke();
      // the mango the machine just learned from
      if (!you && S.last && S.ex[S.last.i]) {
        var lq = toPx(Gm, S.ex[S.last.i].c, S.ex[S.last.i].s);
        ring(lq.x, lq.y, r + 8.5, rgb(T.surface), 5);
        ring(lq.x, lq.y, r + 8.5, rgb(T.mac), 2.6);
      }
      // hover
      if (S.hover && S.hover.kind !== 'handle') {
        var hp = S.hover.kind === 'test' ? S.test[S.hover.i] : S.ex[S.hover.i];
        if (hp) { var hq = toPx(Gm, hp.c, hp.s); ring(hq.x, hq.y, r + 7, rgb(T.haldi), 2.5); }
      }
      // handles of your rule
      if (you) {
        for (i = 0; i < 2; i++) {
          var hh = toPx(Gm, S.h[i].c, S.h[i].s), hot = (S.hover && S.hover.kind === 'handle' && S.hover.i === i) || (drag && drag.k === i) || S.focusH === i;
          if (hot) ring(hh.x, hh.y, 13, rgb(T.haldi, 0.9), 3);
          g.beginPath(); g.arc(hh.x, hh.y, 8.5, 0, Math.PI * 2);
          g.fillStyle = rgb(T.surface); g.fill();
          g.lineWidth = 2.6; g.strokeStyle = rgb(T.you); g.stroke();
          g.beginPath(); g.arc(hh.x, hh.y, 3, 0, Math.PI * 2);
          g.fillStyle = rgb(T.you); g.fill();
          shownPts.push(hh);
        }
      }
      // labels: lines first, then the two sides
      g.font = font(T, 11, '700');
      var boxes = [];
      lines.slice().reverse().forEach(function (ln) {
        var w = g.measureText(ln.text).width + 28, h = 20, a = ln.seg[0], b = ln.seg[1];
        var dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, cands = [];
        [0.82, 0.18, 0.68, 0.32, 0.5].forEach(function (t) {
          [1, -1].forEach(function (sgn) {
            var off = 13 + Math.abs(nx) * w / 2 + Math.abs(ny) * h / 2;
            cands.push([a.x + dx * t + nx * off * sgn, a.y + dy * t + ny * off * sgn]);
          });
        });
        var box = placeLabel(ln.key, w, h, cands, Gm, boxes, shownPts);
        if (!box) return;
        boxes.push(box);
        pill(T, box, ln.text, function (x, y) {
          g.save();
          g.beginPath(); g.moveTo(x - 1, y); g.lineTo(x + 10, y);
          g.lineWidth = ln.kind === 'line' ? 3 : 2; g.strokeStyle = rgb(ln.col);
          g.setLineDash(ln.kind === 'dash' ? [4, 2] : ln.kind === 'dot' ? [1.5, 2.5] : []);
          g.lineCap = ln.kind === 'dot' ? 'round' : 'butt';
          g.stroke(); g.restore();
        });
      });
      [1, 0].forEach(function (cl) {
        var text = cl ? 'RIPE' : 'NOT RIPE', w = g.measureText(text).width + 28, h = 20, cands = [];
        for (var cy = 9.3; cy > 0.5; cy -= 0.9) for (var cx = 0.8; cx < 9.5; cx += 0.9) { var q = toPx(Gm, cl ? 10 - cx : cx, cl ? cy : 10 - cy); cands.push([q.x, q.y]); }
        var box = placeLabel('side' + cl, w, h, cands, Gm, boxes, shownPts, function (x, y, bw, bh) {
          var corners = [[x, y], [x + bw, y], [x, y + bh], [x + bw, y + bh]];
          for (var k = 0; k < 4; k++) {
            var d = toData(Gm, corners[k][0], corners[k][1]);
            var f = act.a * d.c + act.b * d.s - act.d, nrm = Math.hypot(act.a, act.b) || 1;
            // whole label on its own side, a little clear of the line
            if ((cl ? f : -f) / nrm < 0.15) return false;
          }
          return true;
        });
        if (!box) return;
        boxes.push(box);
        pill(T, box, text, function (x, y) {
          shapePath(cl === 1, x + 4.5, y, 4.2);
          g.fillStyle = rgb(T.cls[cl]); g.fill();
          g.lineWidth = 1; g.strokeStyle = T.dark ? rgb(T.surface) : rgb(T.ink, 0.62); g.stroke();
        });
      });
      // the keyboard cross
      if (S.kb.on) {
        var kq = toPx(Gm, S.kb.c, S.kb.s);
        // four ticks outside a ring, so a mango under the cross stays visible
        g.save();
        g.beginPath();
        g.moveTo(kq.x - 17, kq.y); g.lineTo(kq.x - 10, kq.y); g.moveTo(kq.x + 10, kq.y); g.lineTo(kq.x + 17, kq.y);
        g.moveTo(kq.x, kq.y - 17); g.lineTo(kq.x, kq.y - 10); g.moveTo(kq.x, kq.y + 10); g.lineTo(kq.x, kq.y + 17);
        g.lineCap = 'round';
        g.lineWidth = 4.5; g.strokeStyle = rgb(T.surface); g.stroke();
        g.lineWidth = 2; g.strokeStyle = rgb(T.ink); g.stroke();
        ring(kq.x, kq.y, 10, rgb(T.surface), 4);
        ring(kq.x, kq.y, 10, rgb(T.ink), 1.6);
        g.restore();
      }
      // place the invisible keyboard handles over the drawn ones
      for (i = 0; i < 2; i++) {
        var hp2 = toPx(Gm, S.h[i].c, S.h[i].s);
        hBtns[i].style.left = Math.round(hp2.x) + 'px';
        hBtns[i].style.top = Math.round(hp2.y) + 'px';
      }
    }

    /* ---------- text outside the canvas ---------- */
    var lastText = {};
    function setText(el, key, html) { if (lastText[key] !== html) { lastText[key] = html; el.innerHTML = html; } }
    function cell(sc) { return '<b class="num">' + pctOf(sc.right, sc.n) + '</b><br><span class="muted num" style="font-size:.85rem">' + sc.right + ' of ' + sc.n + '</span>'; }
    function updateText(full) {
      var uTr = score(D.userRule, D.used), uTe = score(D.userRule, S.test), mTr = score(D.macRule, D.used), mTe = score(D.macRule, S.test);
      setText(elUtr, 'utr', cell(uTr)); setText(elUte, 'ute', cell(uTe));
      setText(elMtr, 'mtr', cell(mTr)); setText(elMte, 'mte', cell(mTe));
      setText(elSeen, 'seen', fmtInt(S.seen));
      var added = S.ex.length - N_TRAIN;
      setText(elUsed, 'used', String(D.used.length) + (added ? ' <span class="small muted">(' + added + ' added)</span>' : ''));
      setText(elWrong, 'wrong', String(D.mistakes));
      var leg = [legendItem(SW_RIPE, 'Ripe'), legendItem(SW_UNRIPE, 'Not ripe')];
      if (testShown()) leg.push(legendItem(SW_NEW_RIPE + SW_NEW_UNRIPE, 'New mango (test)'));
      leg.push(legendItem(SW_WRONG, 'Ring: the rule gets it wrong'));
      if (D.mistakes) leg.push(legendItem(SW_CROSS, 'Wrong label'));
      if (S.nUse < N_TRAIN) leg.push(legendItem(SW_FADED, 'Faded: not used'));
      setText(elLegend, 'legend', leg.join(''));
      setText(elNout, 'nout', S.nUse + ' of ' + N_TRAIN);
      setText(elRuleYou, 'ruleyou', '<strong>Your rule:</strong> ' + ruleWords(D.userRule) + '.' + (segment(D.userRule) ? '' : ' (The line is off the map.)'));
      setText(elRuleMac, 'rulemac', '<strong>Machine’s rule' + (S.seen ? '' : ' (first guess)') + ':</strong> ' + ruleWords(D.macRule) + '.' +
        (segment(D.macRule) ? '' : ' Its line is off the map, so it calls every mango ' + LABEL[predict(D.macRule, { c: 5, s: 5 })].toLowerCase() + '.'));
      var passes = Math.floor(S.since / Math.max(1, D.used.length));
      var st;
      if (!S.seen) st = 'First guess: the machine has not seen any examples yet.';
      else if (S.running) st = 'Learning… ' + plural(S.seen, 'example', 'examples') + ' seen so far.';
      else if (S.settled) st = 'Settled: more passes would hardly move the line now (' + plural(S.seen, 'example', 'examples') + ' seen in all).';
      else if (S.capped) st = 'Paused after ' + plural(S.passesSince, 'pass', 'passes') + ' without settling.' + (oneLabel() ? ' ' + ONE_LABEL_MSG : '');
      else if (S.since === 0) st = 'The examples have changed. Let the machine learn again to update its line.';
      else st = 'Paused after ' + plural(S.seen, 'example', 'examples') + ' (' + plural(passes, 'full pass', 'full passes') + ' over the current examples).';
      setText(elStatus, 'status', st);
      var rec = S.rec[S.version], hist = [];
      if (rec) Object.keys(rec).map(Number).sort(function (a, b) { return b - a; }).forEach(function (k) {
        hist.push('<li>' + k + ' examples' + (added ? ' + ' + added + ' added' : '') + ': <b class="num">' + rec[k] + ' of ' + N_TEST + '</b> (' + pctOf(rec[k], N_TEST) + ')</li>');
      });
      if (hist.length) { elHistory.hidden = false; setText(elHistory, 'hist', '<strong>Score on new mangoes once settled:</strong><ul style="margin:2px 0 0">' + hist.join('') + '</ul>'); }
      setText(btnLearn, 'learnbtn', S.running ? 'Pause' : 'Let the machine learn');
      updateReadout();
      if (full || !S.running) updateAria(uTr, uTe, mTr, mTe);
    }
    function describePoint(kind, p) {
      var where = 'colour ' + f1(p.c) + ', softness ' + f1(p.s);
      if (kind === 'test') return 'New mango (' + where + '): it turned out ' + LABEL[p.y].toLowerCase() + '. Nobody learns from these; they only test the rules.';
      if (kind === 'unused') return 'Example (' + where + '), labelled ' + LABEL[p.y].toLowerCase() + ', but not used right now. Raise the slider to use it.';
      return 'Example (' + where + '), labelled ' + LABEL[p.y].toLowerCase() + (isMistake(p) ? ' (a labelling mistake)' : '') + '. Click or tap it to flip its label.';
    }
    function updateReadout() {
      var s;
      if (S.hover && S.hover.kind === 'handle') s = 'Handle of your line at colour ' + f1(S.h[S.hover.i].c) + ', softness ' + f1(S.h[S.hover.i].s) + '. Drag it to move your rule.';
      else if (S.hover) s = describePoint(S.hover.kind, S.hover.kind === 'test' ? S.test[S.hover.i] : S.ex[S.hover.i]);
      else if (S.notice) s = S.notice;
      else if (S.mode === 'machine' && S.last && S.ex[S.last.i]) {
        var L = S.last, p = S.ex[L.i], pr = Math.round(L.prob * 100), sure = L.y ? L.prob : 1 - L.prob;
        s = 'Just looked at an example labelled ' + LABEL[L.y].toLowerCase() + ' (colour ' + f1(p.c) + ', softness ' + f1(p.s) + '). ' +
          'Its line gave it a ' + pr + '% chance of being ripe, so ' +
          (sure < 0.5 ? 'it was wrong and nudged the line towards the right answer.' : sure < 0.9 ? 'it was right but unsure, and nudged the line a little.' : 'it was already sure, and the line hardly moved.');
      } else if (S.mode === 'machine' && S.settled) {
        var mtr = score(D.macRule, D.used), mte = score(D.macRule, S.test);
        s = 'The line has settled. It gets ' + mtr.right + ' of ' + mtr.n + ' examples and ' + mte.right + ' of ' + mte.n + ' new mangoes right.' +
          (S.ruleTouched ? '' : ' Now switch to “You write it” and drag your own line: can you ' + (mte.right === mte.n ? 'match' : 'beat') + ' it on the new mangoes?');
      } else if (S.mode === 'machine') s = S.seen ? 'Press “Let the machine learn” to carry on, or “Learn from 1 example” to watch one nudge at a time.' : 'Press “Let the machine learn” and watch its line move as it looks at the examples.';
      else {
        var tr = score(D.userRule, D.used);
        s = 'Your rule gets ' + tr.right + ' of ' + tr.n + ' example mangoes right (' + pctOf(tr.right, tr.n) + '). ' +
          (S.ruleTouched ? 'A ring marks each mango it gets wrong.' : 'Drag the round handles to do better; a ring marks each mango it gets wrong.') +
          (S.nUse < N_TRAIN && !done.t1 ? ' Only the first ' + S.nUse + ' examples are in use: move the slider back to 30 for the first task.' : '');
      }
      setText(elReadout, 'readout', s);
    }
    function updateAria(uTr, uTe, mTr, mTe) {
      var nR = D.used.filter(function (p) { return p.y === 1; }).length;
      var s = 'Map of ' + D.used.length + ' example mangoes (' + nR + ' labelled ripe, ' + (D.used.length - nR) + ' not ripe)' +
        (testShown() ? ' and ' + S.test.length + ' new test mangoes' : '') + ', by skin colour from left to right and softness from bottom to top, each from 0 to 10. ' +
        (S.mode === 'you' ? 'Your rule is shown: ' + ruleWords(D.userRule) + '. It gets ' + uTr.right + ' of ' + uTr.n + ' examples and ' + uTe.right + ' of ' + uTe.n + ' new mangoes right.'
          : 'The machine’s rule is shown' + (S.seen ? ' after ' + plural(S.seen, 'example', 'examples') + ' seen' : ' (its first guess)') + ': ' + ruleWords(D.macRule) +
            '. It gets ' + mTr.right + ' of ' + mTr.n + ' examples and ' + mTe.right + ' of ' + mTe.n + ' new mangoes right.') +
        (D.mistakes ? ' ' + plural(D.mistakes, 'example has', 'examples have') + ' a wrong label.' : '');
      if (canvas.getAttribute('aria-label') !== s) canvas.setAttribute('aria-label', s);
    }
    function updateHandleLabels() {
      for (var i = 0; i < 2; i++) {
        var s = 'Handle ' + (i + 1) + ' of your rule line, at colour ' + f1(S.h[i].c) + ', softness ' + f1(S.h[i].s);
        if (hBtns[i].getAttribute('aria-label') !== s) hBtns[i].setAttribute('aria-label', s);
      }
    }

    /* ---------- frame loop (runs only while learning, or once after a change) ---------- */
    function requestRender() { if (!rafId && !destroyed) rafId = requestAnimationFrame(frame); }
    var lastPassesShown = -1, lastTextT = 0;
    function frame(t) {
      rafId = 0;
      if (destroyed) return;
      if (S.running) {
        var dt = lastT ? Math.min(0.1, (t - lastT) / 1000) : 0;
        lastT = t;
        budget += dt * SPEEDS[S.speed];
        var guard = 0;
        while (budget >= 1 && S.running && guard < 40) { learnOne(); budget -= 1; guard++; }
        if (!S.running) budget = 0;
      }
      draw();
      // while learning, refresh the words around the map about 10 times a second (each change costs a page
      // layout), and the canvas description once per pass
      var full = !S.running || S.passes !== lastPassesShown;
      if (full || !S.running || t - lastTextT >= 100) {
        lastTextT = t;
        lastPassesShown = S.passes;
        updateText(full);
      }
      if (S.running) requestRender();
    }

    /* ---------- pointer + keyboard ---------- */
    function localPos(e) { var b = canvas.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; }
    function hitHandle(x, y, rad) {
      if (S.mode !== 'you') return -1;
      var Gm = geom(), best = -1, bd = rad * rad;
      for (var i = 0; i < 2; i++) { var q = toPx(Gm, S.h[i].c, S.h[i].s), d = (q.x - x) * (q.x - x) + (q.y - y) * (q.y - y); if (d <= bd) { bd = d; best = i; } }
      return best;
    }
    // nearest mango within rad px; examples in use win over new mangoes and faded ones
    function hitPoint(x, y, rad) {
      var Gm = geom(), best = null, bd = rad * rad, i;
      function test(kind, list, idx, pri) {
        var p = list[idx], q = toPx(Gm, p.c, p.s), d = (q.x - x) * (q.x - x) + (q.y - y) * (q.y - y) + pri;
        if (d <= bd) { bd = d; best = { kind: kind, i: idx }; }
      }
      for (i = 0; i < S.ex.length; i++) test(S.ex[i].orig && i >= S.nUse ? 'unused' : 'ex', S.ex, i, S.ex[i].orig && i >= S.nUse ? 60 : 0);
      if (testShown()) for (i = 0; i < S.test.length; i++) test('test', S.test, i, 30);
      return best;
    }
    function setHover(h) {
      var a = S.hover, same = (!a && !h) || (a && h && a.kind === h.kind && a.i === h.i);
      if (same) return;
      S.hover = h;
      canvas.style.cursor = !h ? 'crosshair' : h.kind === 'handle' ? 'grab' : h.kind === 'ex' ? 'pointer' : 'default';
      requestRender();
    }
    function hoverAt(x, y) {
      var hd = hitHandle(x, y, 14);
      if (hd >= 0) { setHover({ kind: 'handle', i: hd }); return; }
      setHover(hitPoint(x, y, radius() + 5));
    }
    var ptr = { id: null, x0: 0, y0: 0, moved: false, type: '' };
    var drag = null;
    on(canvas, 'pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (ptr.id !== null) return;
      ptr = { id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false, type: e.pointerType };
      S.kb.on = false;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      var p = localPos(e), hd = hitHandle(p.x, p.y, e.pointerType === 'mouse' ? 14 : 24);
      if (hd >= 0) {
        var d = toData(geom(), p.x, p.y);
        drag = { k: hd, dc: S.h[hd].c - d.c, ds: S.h[hd].s - d.s, moved: false };
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
      }
      requestRender();
    });
    on(canvas, 'pointermove', function (e) {
      var p = localPos(e);
      if (ptr.id === e.pointerId) {
        if (!ptr.moved && Math.abs(e.clientX - ptr.x0) + Math.abs(e.clientY - ptr.y0) > 8) ptr.moved = true;
        if (drag) {
          var d = toData(geom(), p.x, p.y);
          if (moveHandle(drag.k, d.c + drag.dc, d.s + drag.ds)) drag.moved = true;
        }
      } else if (e.pointerType === 'mouse' || e.pointerType === 'pen') hoverAt(p.x, p.y);
    });
    function endPointer(e, cancelled) {
      if (ptr.id !== e.pointerId) return;
      ptr.id = null;
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      var p = localPos(e);
      if (drag) {
        var moved = drag.moved;
        drag = null;
        if (moved) { setNotice(''); announce(ruleSummary()); }
        if (ptr.type === 'mouse') { S.hover = null; hoverAt(p.x, p.y); }
        requestRender();
        return;
      }
      if (cancelled || ptr.moved) return;
      tapAt(p.x, p.y, ptr.type !== 'mouse');
      if (ptr.type === 'mouse') { S.hover = null; hoverAt(p.x, p.y); }
    }
    function tapAt(x, y, touch) {
      var hit = hitPoint(x, y, radius() + (touch ? 12 : 5));
      if (hit && hit.kind === 'ex') { flip(hit.i); return; }
      if (hit && hit.kind === 'test') { setNotice('That is a new mango, kept aside for testing. Its label is what it really turned out to be, so it cannot be flipped.'); announce(S.notice); requestRender(); return; }
      if (hit && hit.kind === 'unused') { setNotice('That example is not being used right now. Move the slider up to use it.'); announce(S.notice); requestRender(); return; }
      var d = toData(geom(), x, y);
      if (d.c < -0.2 || d.c > 10.2 || d.s < -0.2 || d.s > 10.2) return;   // a tap on the axis labels does nothing
      addMango(d.c, d.s);
    }
    on(canvas, 'pointerup', function (e) { endPointer(e, false); });
    on(canvas, 'pointercancel', function (e) { endPointer(e, true); });
    on(canvas, 'pointerleave', function (e) { if (e.pointerType === 'mouse' && ptr.id === null) setHover(null); });
    on(canvas, 'focus', function () {
      var kb = false;
      try { kb = canvas.matches(':focus-visible'); } catch (err) { kb = false; }
      if (kb) { S.kb.on = true; requestRender(); }
    });
    on(canvas, 'blur', function () { if (S.kb.on) { S.kb.on = false; requestRender(); } });
    var kbTimer = 0;
    on(canvas, 'keydown', function (e) {
      var step = e.shiftKey ? 1 : 0.2, k = e.key, moved = false;   // steps of 0.2 keep the cross on the 0.1 grid mangoes snap to
      if (k === 'ArrowLeft') { S.kb.c = clamp(S.kb.c - step, 0, 10); moved = true; }
      else if (k === 'ArrowRight') { S.kb.c = clamp(S.kb.c + step, 0, 10); moved = true; }
      else if (k === 'ArrowUp') { S.kb.s = clamp(S.kb.s + step, 0, 10); moved = true; }
      else if (k === 'ArrowDown') { S.kb.s = clamp(S.kb.s - step, 0, 10); moved = true; }
      else if (k === 'Enter' || k === ' ') {
        e.preventDefault();
        S.kb.on = true;
        var q = toPx(geom(), S.kb.c, S.kb.s);
        tapAt(q.x, q.y, false);
        requestRender();
        return;
      } else return;
      e.preventDefault();
      S.kb.on = true;
      S.kb.c = Math.round(S.kb.c * 100) / 100; S.kb.s = Math.round(S.kb.s * 100) / 100;
      if (moved) {
        var Gm = geom(), q2 = toPx(Gm, S.kb.c, S.kb.s), h = hitPoint(q2.x, q2.y, radius() + 5);
        S.notice = h ? describePoint(h.kind, h.kind === 'test' ? S.test[h.i] : S.ex[h.i]) : 'Cross at colour ' + f1(S.kb.c) + ', softness ' + f1(S.kb.s) + '. Press Enter to add a ' + LABEL[S.addLabel].toLowerCase() + ' mango here.';
        if (kbTimer) clearTimeout(kbTimer);
        kbTimer = setTimeout(function () { kbTimer = 0; if (!destroyed) announce(S.notice); }, 400);
      }
      requestRender();
    });
    // the two handles, for keyboard users
    var hTimer = 0;
    hBtns.forEach(function (btn, k) {
      on(btn, 'keydown', function (e) {
        var step = e.shiftKey ? 1 : 0.25, dc = 0, ds = 0;
        if (e.key === 'ArrowLeft') dc = -step; else if (e.key === 'ArrowRight') dc = step;
        else if (e.key === 'ArrowUp') ds = step; else if (e.key === 'ArrowDown') ds = -step;
        else return;
        e.preventDefault();
        var h = S.h[k];
        if (!moveHandle(k, Math.round((h.c + dc) * 100) / 100, Math.round((h.s + ds) * 100) / 100)) {
          setNotice(Math.hypot(h.c + dc - S.h[1 - k].c, h.s + ds - S.h[1 - k].s) < MIN_GAP ? 'The two handles cannot sit on top of each other.' : 'The handle is at the edge of the map.');
          requestRender();
        } else setNotice('');
        if (hTimer) clearTimeout(hTimer);
        hTimer = setTimeout(function () { hTimer = 0; if (!destroyed) announce(ruleSummary()); }, 400);
      });
      on(btn, 'focus', function () { S.focusH = k; requestRender(); });
      on(btn, 'blur', function () { if (S.focusH === k) S.focusH = -1; requestRender(); });
    });

    /* ---------- controls ---------- */
    Array.prototype.forEach.call(modeBtns, function (b) { on(b, 'click', function () { setMode(b.getAttribute('data-mode')); }); });
    Array.prototype.forEach.call(speedBtns, function (b) {
      on(b, 'click', function () {
        S.speed = b.getAttribute('data-speed');
        Array.prototype.forEach.call(speedBtns, function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        requestRender();
      });
    });
    Array.prototype.forEach.call(addBtns, function (b) {
      on(b, 'click', function () {
        S.addLabel = +b.getAttribute('data-add');
        Array.prototype.forEach.call(addBtns, function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      });
    });
    on(btnSwap, 'click', function () {
      S.rn = { c: -S.rn.c, s: -S.rn.s };
      S.ruleTouched = true;
      refreshRules(); setNotice('');
      announce('Swapped sides. ' + ruleSummary());
      checkRuleTasks();
      requestRender();
    });
    on(btnLearn, 'click', function () { if (S.running) pause(false); else start(); });
    on(btnStep, 'click', function () {
      if (S.running) pause(true);
      if (!D.used.length) return;
      setNotice('');
      learnOne();
      var L = S.last, p = S.ex[L.i];
      announce('Learned from an example labelled ' + LABEL[L.y].toLowerCase() + ' at colour ' + f1(p.c) + ', softness ' + f1(p.s) +
        '. It gave it a ' + Math.round(L.prob * 100) + '% chance of being ripe. Examples seen: ' + fmtInt(S.seen) + '.' + (S.settled ? ' The line has settled.' : ''));
      requestRender();
    });
    on(btnRestart, 'click', restartMachine);
    on(elN, 'input', function () {
      var n = clamp(Math.round(+elN.value), N_MIN, N_TRAIN);
      if (n === S.nUse) return;
      S.nUse = n;
      setNotice('');
      examplesChanged(false);
    });
    on(elN, 'change', function () { announce('Using ' + S.nUse + ' of the vendor’s ' + N_TRAIN + ' examples' + (S.ex.length > N_TRAIN ? ', plus the ' + (S.ex.length - N_TRAIN) + ' you added.' : '.') + ' ' + ruleSummary()); });
    on(elShowTest, 'change', function () { S.showTest = elShowTest.checked; S.hover = null; requestRender(); });
    on(btnReset, 'click', function () {
      S.ex = freshExamples();
      setNotice('');
      examplesChanged(true);
      announce('The 30 example mangoes and their labels are back to how the vendor recorded them.');
    });

    /* ---------- theme, fonts, resize ---------- */
    function onTheme() { themeCache.key = ''; requestRender(); }
    var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mql) { if (mql.addEventListener) mql.addEventListener('change', onTheme); else if (mql.addListener) mql.addListener(onTheme); }
    on(document, 'themechange', onTheme);
    function onFonts() { if (!destroyed) requestRender(); }
    var fontSet = document.fonts && document.fonts.addEventListener ? document.fonts : null;
    if (fontSet) {
      on(fontSet, 'loadingdone', onFonts);
      if (fontSet.ready && fontSet.ready.then) fontSet.ready.then(onFonts, function () { /* ignore */ });
    }
    var curAspect = null;
    function wantAspect() { return wrap.getBoundingClientRect().width < 520 ? '1 / 1' : ''; }
    function applyAspect() {
      aspectRaf = 0;
      if (destroyed) return;
      var want = wantAspect();
      if (want !== curAspect) { curAspect = want; wrap.style.aspectRatio = want; }
    }
    function resize() {
      if (destroyed) return;
      // changing the box's own shape inside a ResizeObserver callback would loop, so do that in the next frame
      if (wantAspect() !== curAspect && !aspectRaf) aspectRaf = requestAnimationFrame(applyAspect);
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      var b = canvas.getBoundingClientRect(), w = Math.max(1, Math.round(b.width)), h = Math.max(1, Math.round(b.height));
      if (w !== dims.w || h !== dims.h || dpr !== dims.dpr) {
        dims.w = w; dims.h = h; dims.dpr = dpr;
        canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
        labelPos = {};
      }
      draw();   // repaint in the same callback, so there is never a blank frame
    }
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { resize(); }); ro.observe(wrap); }
    else on(window, 'resize', resize);

    // style.css stacks the lab into one column below 820px. Then the explanation moves below the controls, so on a
    // phone the mode buttons sit close under the map; on wide screens it fills the space under the scoreboard.
    var mqNarrow = window.matchMedia ? window.matchMedia('(max-width: 820px)') : null;
    var leftCol = $('left'), more = $('more'), scores = $('scores'), mhead = $('mhead'), body = top.querySelector('.lab-body');
    function placeMore() {
      if (destroyed) return;
      if (mqNarrow && mqNarrow.matches) {
        if (scores.nextElementSibling !== mhead) mhead.parentNode.insertBefore(scores, mhead);
        if (more.previousElementSibling !== body) top.insertBefore(more, body.nextSibling);
      } else {
        if (scores.previousElementSibling !== elLive) leftCol.insertBefore(scores, elLive.nextSibling);
        if (more.parentNode !== leftCol) leftCol.appendChild(more);
      }
    }
    if (mqNarrow) { if (mqNarrow.addEventListener) mqNarrow.addEventListener('change', placeMore); else if (mqNarrow.addListener) mqNarrow.addListener(placeMore); }
    placeMore();

    /* ---------- starting state ---------- */
    applyAspect();
    recompute();
    updateHandleLabels();
    resize();
    updateText(true);

    return {
      destroy: function () {
        // safe to call twice, and never touches a lab mounted into the same root later
        if (destroyed) return;
        destroyed = true;
        if (rafId) cancelAnimationFrame(rafId);
        if (aspectRaf) cancelAnimationFrame(aspectRaf);
        rafId = 0; aspectRaf = 0;
        [liveTimer, kbTimer, hTimer].forEach(function (t) { if (t) clearTimeout(t); });
        liveTimer = kbTimer = hTimer = 0;
        if (ro) ro.disconnect();
        if (mql) { if (mql.removeEventListener) mql.removeEventListener('change', onTheme); else if (mql.removeListener) mql.removeListener(onTheme); }
        if (mqNarrow) { if (mqNarrow.removeEventListener) mqNarrow.removeEventListener('change', placeMore); else if (mqNarrow.removeListener) mqNarrow.removeListener(placeMore); }
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
        listeners = [];
        if (top.parentNode) top.parentNode.removeChild(top);
      }
    };
  }

  Labs.learn = {
    id: 'learn',
    module: 'l1-ai-basics',
    title: 'Teach the machine: rules vs learning',
    summary: 'Sort mangoes into ripe and not ripe by drawing your own rule, then watch a machine learn its rule from labelled examples and compare both on new mangoes.',
    tasks: TASKS.map(function (t) { return { id: t.id, text: t.text }; }),
    mount: mount
  };
})();
