/* AI Marg lab: K-Nearest Neighbours on past loans (repaid vs defaulted) plotted by income and existing EMIs.
   The learner sets K and the distance, adds or removes loans, and probes any spot to see its K neighbours vote.
   Plain classic script (ES2019). Registers window.AILabs.knn. No libraries, no network, no storage. */
(function () {
  'use strict';
  var Labs = (window.AILabs = window.AILabs || {});
  var mountCount = 0;

  /* ---------- constants ---------- */
  var K_MAX = 25;          // the slider runs 1, 3, 5 ... 25
  var K_COUNT = 13;        // how many odd K values that is
  var NB = K_MAX + 1;      // neighbours each map spot must know (one spare, for the exact boundary at K = 25)
  var CAP = NB + 4;        // list room per map spot: the spares mean removing a loan rarely forces a full recount
  var EXAMPLE_KS = [1, 5, 25];  // already plotted on the accuracy chart at the start
  var START_K = 5;
  var MAX_POINTS = 200;
  var DATA_SEED = 381;     // picked so leave-one-out accuracy climbs, peaks in the middle, then falls
  var DATA_N = 70;
  var INC_MIN = 20000, INC_MAX = 180000;  // scaled income 0 and 1, in rupees per month
  var EMI_MAX = 80000;                    // scaled EMIs 0 and 1 are ₹0 and ₹80,000 per month
  var CELL_PX = 4;         // background map resolution: one vote per 4 CSS pixels
  var MAX_NODES = 26000;
  var START_PROBE = { x: 0.4, y: 0.55 };
  var CLASSES = [
    { name: 'Repaid', cssVar: '--series-1', shape: 'circle' },
    { name: 'Defaulted', cssVar: '--series-2', shape: 'square' },
    { name: 'Paid late', cssVar: '--series-3', shape: 'diamond' }
  ];
  var TASKS = [
    { id: 't1', text: 'Slide K down to 1. Training accuracy jumps to 100%, but the map breaks into jagged islands around single loans. That is overfitting (memorising the data, noise included).' },
    { id: 't2', text: 'Find the best K: try at least 4 values of K, then leave the slider on the one with the highest leave-one-out accuracy (the accuracy chart keeps score).' },
    { id: 't3', text: 'Add a loan that looks mislabelled: a Defaulted point deep inside the Repaid area (or the other way round). See it get its own island at K = 1, then get out-voted at K = 5 or more.' },
    { id: 't4', text: 'Try a third class: add at least 3 “Paid late” loans close together in an empty corner. With a small K, KNN paints a third region for them.' }
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
  // Indian digit grouping: 120000 -> ₹1,20,000
  function inr(v) {
    var s = String(Math.round(Math.abs(v)));
    if (s.length > 3) s = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3);
    return '₹' + s;
  }
  function tickInr(v) {
    if (v === 0) return '₹0';
    if (v >= 100000) return '₹' + (v / 100000).toFixed(v % 100000 ? 1 : 0) + 'L';
    return '₹' + Math.round(v / 1000) + 'k';
  }
  function pct(c, n) { return n > 0 ? (100 * c / n).toFixed(1) + '%' : '—'; }
  function incomeOf(x) { return INC_MIN + x * (INC_MAX - INC_MIN); }
  function emiOf(y) { return y * EMI_MAX; }
  function round500(v) { return Math.round(v / 500) * 500; }
  // Euclidean distance is kept squared here: same order of neighbours, no square root needed.
  function dist(man, ax, ay, bx, by) {
    var dx = ax - bx, dy = ay - by;
    return man ? Math.abs(dx) + Math.abs(dy) : dx * dx + dy * dy;
  }
  function trueDist(man, d) { return man ? d : Math.sqrt(d); }

  /* ---------- the example data: 70 past loans, in scaled 0..1 units ---------- */
  function makeData() {
    var r = mulberry32(DATA_SEED), pts = [];
    for (var i = 0; i < DATA_N; i++) {
      var x = clamp(0.04 + 0.92 * Math.pow(r(), 1.25), 0.03, 0.97);
      var y = clamp(0.04 + 0.92 * r() * (0.45 + 0.75 * x), 0.03, 0.97);
      var inc = incomeOf(x), emi = emiOf(y);
      // Risk climbs fast once EMIs eat about half the income, and very low incomes are riskier anyway.
      // Each loan's outcome is drawn at random from that risk, so some loans near the line go either way.
      var z = 18 * (emi / inc - 0.47) + (inc < 40000 ? 1.4 : 0);
      var p = 1 / (1 + Math.exp(-z));
      pts.push({ x: x, y: y, c: r() < p ? 1 : 0, user: false });
    }
    return pts;
  }

  /* ---------- colour helpers (theme colours are read from CSS variables) ---------- */
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
  function rgbStr(c, a) { return a == null ? 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')' : 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function luminance(c) {
    function ch(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2]);
  }
  var themeCache = { key: '', theme: null };
  var THEME_VARS = ['--surface', '--surface-2', '--ink', '--muted', '--line', '--haldi', '--haldi-soft', '--series-1', '--series-2', '--series-3', '--series-4', '--font-body'];
  function readTheme() {
    var cs = getComputedStyle(document.documentElement), raw = {}, key = '';
    for (var i = 0; i < THEME_VARS.length; i++) { raw[THEME_VARS[i]] = cs.getPropertyValue(THEME_VARS[i]).trim(); key += raw[THEME_VARS[i]] + '|'; }
    if (themeCache.key === key && themeCache.theme) return themeCache.theme;
    var T = {
      surface: toRgb(raw['--surface']), surface2: toRgb(raw['--surface-2']), ink: toRgb(raw['--ink']), muted: toRgb(raw['--muted']),
      line: toRgb(raw['--line']), haldi: toRgb(raw['--haldi']), haldiSoft: toRgb(raw['--haldi-soft']), s4: toRgb(raw['--series-4']),
      cls: [toRgb(raw['--series-1']), toRgb(raw['--series-2']), toRgb(raw['--series-3'])],
      font: raw['--font-body'] || 'system-ui, sans-serif'
    };
    T.dark = luminance(T.surface) < 0.2;
    T.aMin = T.dark ? 0.08 : 0.07;  // tint strength of the background map at the least sure spots ...
    T.aMax = T.dark ? 0.36 : 0.3;   // ... and where every neighbour agrees
    themeCache = { key: key, theme: T };
    return T;
  }

  /* ---------- marker shapes (shape repeats the colour, so colour is never the only clue) ---------- */
  function shapePath(g, shape, x, y, r) {
    if (shape === 'square') { var s = r * 0.88; g.rect(x - s, y - s, 2 * s, 2 * s); }
    else if (shape === 'diamond') { var q = r * 1.3; g.moveTo(x, y - q); g.lineTo(x + q, y); g.lineTo(x, y + q); g.lineTo(x - q, y); g.closePath(); }
    else { g.moveTo(x + r, y); g.arc(x, y, r, 0, Math.PI * 2); }
  }
  function swatch(kind, fill, stroke, sw) {
    var p;
    if (kind === 'square') p = '<rect x="2.5" y="2.5" width="9" height="9"/>';
    else if (kind === 'diamond') p = '<polygon points="7,0.8 13.2,7 7,13.2 0.8,7"/>';
    else if (kind === 'line') p = '<path d="M1 11 C5 10 8 5 13 3"/>';
    else p = '<circle cx="7" cy="7" r="' + (kind === 'ring' ? 5 : 5.2) + '"/>';
    return '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false" style="flex:none;overflow:visible;fill:' + fill + ';stroke:' + stroke + ';stroke-width:' + sw + '">' + p + '</svg>';
  }
  function classSwatch(c) { return swatch(CLASSES[c].shape, 'var(' + CLASSES[c].cssVar + ')', 'var(--surface)', 1.2); }
  function legendItem(svg, text) { return '<i style="font-style:normal;display:inline-flex;align-items:center;gap:6px">' + svg + text + '</i>'; }

  /* ================================================================ */
  function mount(root, ctx) {
    var P = 'knn' + (++mountCount) + '-';
    var listeners = [];
    function on(el, type, fn, opts) { el.addEventListener(type, fn, opts); listeners.push([el, type, fn, opts]); }
    var destroyed = false;

    var tasksHtml = TASKS.map(function (t) { return '<li data-task="' + t.id + '">' + t.text + '</li>'; }).join('');
    var clsBtns = CLASSES.map(function (c, i) {
      return '<button type="button" data-cls="' + i + '" aria-pressed="' + (i === 0) + '" style="display:inline-flex;align-items:center;gap:5px;padding:6px 8px">' +
        '<span style="display:inline-flex;padding:2px;border-radius:4px;background:var(--surface)">' + classSwatch(i) + '</span>' + c.name + '</button>';
    }).join('');

    root.innerHTML =
      '<div class="lab">' +
        '<p class="lab-note"><strong>What you are seeing:</strong> each mark is a past loan from a small bank. Circles were repaid; squares <em>defaulted</em> (the borrower stopped paying). These two outcomes are the <em>classes</em> (groups) the model predicts. Left to right is the borrower’s monthly income; bottom to top is the EMIs (monthly loan instalments) they were already paying. ' +
        'These two <em>features</em> (the facts the model looks at) are <em>scaled</em> (squeezed to run from 0 to 1), so a step across the map counts as much as a step up it. ' +
        'K-Nearest Neighbours (KNN) judges a new applicant by finding the K closest past loans and letting them vote. ' +
        'The background shows that vote for every spot: deeper colour means more of the K neighbours agree, and the thin line is the <em>decision boundary</em> (where the prediction flips). ' +
        'Move over the map, or drag on a phone, to place the <em>probe</em> (a pretend new applicant) and see who its neighbours are.</p>' +
        '<div class="lab-body">' +
          '<div class="stack-sm" id="' + P + 'left">' +
            '<div class="lab-canvas-wrap" id="' + P + 'wrap"><canvas id="' + P + 'plot" tabindex="0" role="img" aria-label="Map of past loans" aria-describedby="' + P + 'kbd" style="outline-offset:-3px;cursor:crosshair"></canvas></div>' +
            '<div class="lab-legend" id="' + P + 'legend"></div>' +
            '<p class="small" id="' + P + 'readout" style="min-height:3.2em"></p>' +
            '<p class="visually-hidden" role="status" aria-live="polite" id="' + P + 'live"></p>' +
            '<div class="lab-stats" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr))">' +
              '<div class="stat"><div class="k">K</div><div class="v" id="' + P + 'sk">' + START_K + '</div></div>' +
              '<div class="stat"><div class="k">Training accuracy</div><div class="v" id="' + P + 'str">—</div></div>' +
              '<div class="stat"><div class="k">Leave-one-out</div><div class="v" id="' + P + 'sloo">—</div></div>' +
              '<div class="stat"><div class="k">Past loans</div><div class="v" id="' + P + 'sn">—</div></div>' +
            '</div>' +
          '</div>' +
          '<div class="lab-controls">' +
            '<div class="control"><label for="' + P + 'k">Neighbours who vote (K) <output id="' + P + 'kout" for="' + P + 'k">' + START_K + '</output></label>' +
              '<input type="range" id="' + P + 'k" min="1" max="' + K_MAX + '" step="2" value="' + START_K + '">' +
              '<p class="small muted">Odd numbers only, so two classes can never tie (three classes still can).</p></div>' +
            '<div class="control"><span class="control-label" id="' + P + 'distlbl">Distance</span>' +
              '<div class="seg" role="group" aria-labelledby="' + P + 'distlbl">' +
                '<button type="button" data-dist="euc" aria-pressed="true">Euclidean</button>' +
                '<button type="button" data-dist="man" aria-pressed="false">Manhattan</button>' +
              '</div>' +
              '<p class="small muted" id="' + P + 'distdesc"></p></div>' +
            '<div class="control"><span class="control-label" id="' + P + 'clslbl">Class of new loans</span>' +
              '<div class="seg" role="group" aria-labelledby="' + P + 'clslbl">' + clsBtns + '</div>' +
              '<p class="small muted">Click or tap an empty spot to add a loan of this class. Click a loan to remove it.</p></div>' +
            '<div class="row">' +
              '<button type="button" class="btn btn-sm" id="' + P + 'reset">Reset example data</button>' +
              '<button type="button" class="btn btn-sm" id="' + P + 'clear">Clear all loans</button>' +
            '</div>' +
            '<div class="stack-sm"><h4>Your tasks</h4><ul class="lab-tasks" id="' + P + 'tasks">' + tasksHtml + '</ul></div>' +
          '</div>' +
        '</div>' +
        // explanation, accuracy chart and keyboard hint: under the map on wide screens, below the controls on phones
        // container-type lets the chart's height follow this block's width (cqw) without an aspect-ratio + min-height
        // pair, which would give the chart a 480px minimum width and push a phone page sideways
        '<div class="stack-sm" id="' + P + 'more" style="container-type:inline-size">' +
          '<p class="small muted"><strong style="color:var(--ink)">Training accuracy</strong> checks each loan with the loan itself allowed to vote. <strong style="color:var(--ink)">Leave-one-out accuracy</strong> hides one loan, predicts it from all the others, and repeats for every loan. It is the fairer test, because no loan gets to vote for itself.</p>' +
          '<div class="row-between" style="margin-top:8px"><h4>Accuracy for each K you try</h4>' +
            '<button type="button" class="btn btn-sm" id="' + P + 'fill" aria-pressed="false">Show every K</button></div>' +
          '<p class="small muted">K = 1, 5 and 25 are filled in to start. Every K you choose with the slider is added. Where does leave-one-out accuracy peak?</p>' +
          '<div class="lab-legend">' +
            legendItem(swatch('circle', 'var(--series-4)', 'var(--surface)', 1), 'Leave-one-out (fair test)') +
            legendItem(swatch('ring', 'none', 'var(--muted)', 1.6), 'Training (loans vote for themselves)') +
          '</div>' +
          '<div class="lab-canvas-wrap" id="' + P + 'cwrap" style="aspect-ratio:auto;height:180px;height:clamp(150px,31.25cqw,220px)"><canvas id="' + P + 'chart" role="img" aria-label="Accuracy for each K tried" style="touch-action:auto"></canvas></div>' +
          '<p class="kbd-hint" id="' + P + 'kbd">Keyboard: focus the map, move the probe with the arrow keys (Shift for bigger steps), press Enter to add a loan there (or remove the one under the probe) and Delete to remove the nearest loan.</p>' +
        '</div>' +
        '<p class="small muted"><strong style="color:var(--ink)">Why it matters in real ML:</strong> KNN simply remembers past examples, so it lives or dies by scaling the features, choosing the distance and picking K with a fair test such as leave-one-out or cross-validation (testing on held-back slices of the data, one slice at a time): too small a K memorises noise, too big a K blurs away real patterns.</p>' +
      '</div>';

    function $(id) { return root.querySelector('#' + P + id); }
    var wrap = $('wrap'), canvas = $('plot'), cwrap = $('cwrap'), chart = $('chart'), leftCol = $('left'), more = $('more');
    var body = root.querySelector('.lab-body');
    var g = canvas.getContext('2d'), gc = chart.getContext('2d');
    var elLegend = $('legend'), elReadout = $('readout'), elLive = $('live');
    var elSK = $('sk'), elSTr = $('str'), elSLoo = $('sloo'), elSN = $('sn');
    var elK = $('k'), elKout = $('kout'), elDistDesc = $('distdesc'), btnFill = $('fill'), btnReset = $('reset'), btnClear = $('clear');
    var distBtns = root.querySelectorAll('[data-dist]'), clsBtnEls = root.querySelectorAll('[data-cls]');
    var taskEls = {};
    Array.prototype.forEach.call(root.querySelectorAll('[data-task]'), function (li) { taskEls[li.getAttribute('data-task')] = li; });

    /* ---------- state ---------- */
    var S = {
      pts: makeData(), K: START_K, man: false, cls: 0,
      probe: { x: START_PROBE.x, y: START_PROBE.y }, hover: -1,
      tried: {}, userTried: {}, userTriedCount: 0, kTouched: false, revealed: false, notice: ''
    };
    EXAMPLE_KS.forEach(function (k) { S.tried[k] = true; });
    var done = {};
    // M = the model's view of the training data (rebuilt when loans or the distance change)
    var M = { n: 0, present: [], counts: [0, 0, 0], nb: new Uint8Array(0), train: [], loo: [], wrong: new Uint8Array(0), pred: new Uint8Array(0) };
    // G = the background map: for every grid node its nearest loans (class, index, distance), then the vote for the current K
    var G = { nx: 0, ny: 0, ready: false, len: null, cls: null, idx: null, dst: null, cnt: null, pred: null, conf: null, predCount: [0, 0, 0], segs: [] };
    var dirty = { nbrs: true, votes: true, colours: true, base: true, chart: true };
    var dims = { w: 1, h: 1, dpr: 1, cw: 1, ch: 1 };
    var rafId = 0, aspectRaf = 0, lastTheme = null, lastReadout = '';
    var base = document.createElement('canvas'), bg = base.getContext('2d');
    var gridCanvas = document.createElement('canvas'), gg = gridCanvas.getContext('2d');

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
      if (done[id]) return;
      done[id] = true;
      markLi(id);
      announce('Task done: ' + TASKS.filter(function (t) { return t.id === id; })[0].text.split('. ')[0] + '.');
      if (ctx && ctx.onTaskDone) ctx.onTaskDone(id);
    }
    function announce(s) { elLive.textContent = s; }

    /* ---------- the KNN maths ---------- */
    // Votes over a list of neighbour classes (nearest first). Most votes wins; on a tie the class whose
    // neighbour is closest wins, because we walk the list in distance order and only switch on strictly more votes.
    var cnt3 = [0, 0, 0];
    function voteList(arr, off, len) {
      cnt3[0] = cnt3[1] = cnt3[2] = 0;
      var j, best = -1, bc = -1;
      for (j = 0; j < len; j++) cnt3[arr[off + j]]++;
      for (j = 0; j < len; j++) { var c = arr[off + j]; if (cnt3[c] > bc) { bc = cnt3[c]; best = c; } }
      return best;
    }

    // For every loan: the classes of the other loans, nearest first (up to K_MAX), plus accuracy for every odd K.
    function computeModel() {
      var pts = S.pts, n = pts.length, man = S.man, i, j, k;
      M.n = n;
      M.counts = [0, 0, 0];
      for (i = 0; i < n; i++) M.counts[pts[i].c]++;
      M.present = [0, 1, 2].filter(function (c) { return M.counts[c] > 0; });
      var L = Math.min(K_MAX, Math.max(0, n - 1));
      var nb = new Uint8Array(n * K_MAX), d = new Float64Array(n), idx = [];
      for (i = 0; i < n; i++) {
        idx.length = 0;
        for (j = 0; j < n; j++) { d[j] = dist(man, pts[i].x, pts[i].y, pts[j].x, pts[j].y); if (j !== i) idx.push(j); }
        idx.sort(function (a, b) { return d[a] - d[b] || a - b; });
        for (k = 0; k < L; k++) nb[i * K_MAX + k] = pts[idx[k]].c;
      }
      M.nb = nb;
      M.train = []; M.loo = [];
      var tmp = new Uint8Array(K_MAX + 1);
      for (var ki = 0; ki < K_COUNT; ki++) {
        var K = 2 * ki + 1, tc = 0, lc = 0;
        for (i = 0; i < n; i++) {
          var ci = pts[i].c;
          // training: the loan itself (distance 0) is its own nearest neighbour, then the K - 1 nearest others
          var kt = Math.min(K, n);
          tmp[0] = ci;
          for (k = 1; k < kt; k++) tmp[k] = nb[i * K_MAX + k - 1];
          if (voteList(tmp, 0, kt) === ci) tc++;
          // leave-one-out: only the K nearest others vote
          var kl = Math.min(K, n - 1);
          if (kl > 0 && voteList(nb, i * K_MAX, kl) === ci) lc++;
        }
        M.train.push(tc); M.loo.push(lc);
      }
    }
    // Per-loan prediction at the current K (to ring the loans the model gets wrong), and task 3 tracking.
    function computeAtK() {
      var pts = S.pts, n = pts.length, K = S.K, kt = Math.min(K, n), tmp = new Uint8Array(K_MAX + 1);
      M.wrong = new Uint8Array(n); M.pred = new Uint8Array(n);
      for (var i = 0; i < n; i++) {
        tmp[0] = pts[i].c;
        for (var k = 1; k < kt; k++) tmp[k] = M.nb[i * K_MAX + k - 1];
        var p = voteList(tmp, 0, kt);
        M.pred[i] = p; M.wrong[i] = p !== pts[i].c ? 1 : 0;
        if (pts[i].user && n >= 10) {
          if (isOddOneOut(i)) {
            if (K === 1) pts[i].sawIsland = true;
            if (K >= 5 && p !== pts[i].c) pts[i].sawIgnored = true;
            if (pts[i].sawIsland && pts[i].sawIgnored) completeTask('t3');
          }
        }
      }
    }
    // "Looks mislabelled": at least 4 of its 5 nearest other loans share one class that is not its own.
    function isOddOneOut(i) {
      if (M.n < 6) return false;
      var c = [0, 0, 0], own = S.pts[i].c;
      for (var k = 0; k < 5; k++) c[M.nb[i * K_MAX + k]]++;
      for (var q = 0; q < 3; q++) if (q !== own && c[q] >= 4) return true;
      return false;
    }
    // The K nearest loans to any spot (nearest first, ties by order added), with the vote.
    function neighboursAt(x, y) {
      var pts = S.pts, n = pts.length, d = new Float64Array(n), idx = [], i;
      for (i = 0; i < n; i++) { d[i] = dist(S.man, x, y, pts[i].x, pts[i].y); idx.push(i); }
      idx.sort(function (a, b) { return d[a] - d[b] || a - b; });
      var Ke = Math.min(S.K, n), cls = new Uint8Array(Ke);
      for (i = 0; i < Ke; i++) cls[i] = pts[idx[i]].c;
      var best = Ke ? voteList(cls, 0, Ke) : -1;
      var counts = [cnt3[0], cnt3[1], cnt3[2]];
      var ties = 0;
      for (i = 0; i < 3; i++) if (counts[i] === counts[best]) ties++;
      return { idx: idx.slice(0, Ke), Ke: Ke, best: best, counts: counts, tie: ties > 1, rK: Ke ? trueDist(S.man, d[idx[Ke - 1]]) : 0 };
    }

    /* ---------- the background map ---------- */
    function geom() {
      var small = dims.w < 480;
      var pl = small ? 50 : 60, pr = small ? 10 : 14, pt = 10, pb = small ? 40 : 46;
      return { pl: pl, pt: pt, pw: Math.max(10, dims.w - pl - pr), ph: Math.max(10, dims.h - pt - pb), small: small };
    }
    function toPx(Gm, x, y) { return { x: Gm.pl + x * Gm.pw, y: Gm.pt + (1 - y) * Gm.ph }; }
    function toData(Gm, px, py) { return { x: (px - Gm.pl) / Gm.pw, y: 1 - (py - Gm.pt) / Gm.ph }; }
    function pointRadius() { return clamp(dims.w / 130, 4, 5.5); }

    function gridSize() {
      var Gm = geom();
      var nx = Math.max(8, Math.round(Gm.pw / CELL_PX)), ny = Math.max(8, Math.round(Gm.ph / CELL_PX));
      while ((nx + 1) * (ny + 1) > MAX_NODES) { nx = Math.round(nx * 0.92); ny = Math.round(ny * 0.92); }
      if (nx !== G.nx || ny !== G.ny) { G.nx = nx; G.ny = ny; dirty.nbrs = true; }
    }
    // For every grid node: its nearest loans (at least NB of them, up to CAP), nearest first, ties by order added.
    // Changing K only re-counts votes; adding or removing a loan only patches these lists.
    function gridDist(man, x, y, px, py) {
      var dx = x - px, dy = y - py;
      return Math.fround(man ? (dx < 0 ? -dx : dx) + (dy < 0 ? -dy : dy) : Math.sqrt(dx * dx + dy * dy));
    }
    // plain number arrays of the loans, so the hot loops below never touch the loan objects
    var PX = new Float64Array(MAX_POINTS + 1), PY = new Float64Array(MAX_POINTS + 1), PC = new Uint8Array(MAX_POINTS + 1);
    function syncPointArrays() {
      for (var p = 0; p < S.pts.length; p++) { PX[p] = S.pts[p].x; PY[p] = S.pts[p].y; PC[p] = S.pts[p].c; }
    }
    function fillNode(node, x, y) {
      var n = S.pts.length, cap = Math.min(CAP, n), o = node * CAP, L = 0, man = S.man;
      var dst = G.dst, idx = G.idx, cls = G.cls;
      for (var p = 0; p < n; p++) {
        var d = gridDist(man, x, y, PX[p], PY[p]), q;
        if (L < cap) q = L++;
        else if (d < dst[o + cap - 1]) q = cap - 1;
        else continue;
        while (q > 0 && dst[o + q - 1] > d) { dst[o + q] = dst[o + q - 1]; idx[o + q] = idx[o + q - 1]; cls[o + q] = cls[o + q - 1]; q--; }
        dst[o + q] = d; idx[o + q] = p; cls[o + q] = PC[p];
      }
      G.len[node] = L;
    }
    function computeGridNeighbours() {
      var nx = G.nx, ny = G.ny, nodes = (nx + 1) * (ny + 1), node = 0;
      if (!G.len || G.len.length !== nodes) {
        G.len = new Uint8Array(nodes); G.cls = new Uint8Array(nodes * CAP);
        G.idx = new Uint16Array(nodes * CAP); G.dst = new Float32Array(nodes * CAP);
      }
      syncPointArrays();
      for (var j = 0; j <= ny; j++) for (var i = 0; i <= nx; i++) fillNode(node++, i / nx, j / ny);
      G.ready = true;
    }
    // A loan was just appended (it has the highest index, so it goes after any equal distance).
    function gridAddLast() {
      var pts = S.pts, n = pts.length, added = pts[n - 1], nOld = n - 1, man = S.man;
      var nx = G.nx, ny = G.ny, dst = G.dst, idx = G.idx, cls = G.cls, len = G.len, node = 0;
      for (var j = 0; j <= ny; j++) {
        for (var i = 0; i <= nx; i++, node++) {
          var o = node * CAP, L = len[node], d = gridDist(man, i / nx, j / ny, added.x, added.y), q;
          if (L < CAP && L === nOld) q = L++;                              // the list held every loan: just join it
          else if (L > 0 && d < dst[o + L - 1]) { if (L < CAP) q = L++; else q = CAP - 1; }
          else continue;
          while (q > 0 && dst[o + q - 1] > d) { dst[o + q] = dst[o + q - 1]; idx[o + q] = idx[o + q - 1]; cls[o + q] = cls[o + q - 1]; q--; }
          dst[o + q] = d; idx[o + q] = nOld; cls[o + q] = added.c;
          len[node] = L;
        }
      }
    }
    // Loan r was just spliced out: drop it from every list and shift later indices down by one.
    // The rest of each list is still the nearest loans in order; only a list that gets too short is recounted.
    function gridRemoved(r) {
      syncPointArrays();
      var n = S.pts.length, need = Math.min(NB, n), nx = G.nx, ny = G.ny, dst = G.dst, idx = G.idx, cls = G.cls, len = G.len, node = 0;
      for (var j = 0; j <= ny; j++) {
        for (var i = 0; i <= nx; i++, node++) {
          var o = node * CAP, L = len[node], w = 0;
          for (var q = 0; q < L; q++) {
            var id = idx[o + q];
            if (id === r) continue;
            idx[o + w] = id > r ? id - 1 : id; cls[o + w] = cls[o + q]; dst[o + w] = dst[o + q]; w++;
          }
          len[node] = w;
          if (w < need) fillNode(node, i / nx, j / ny);
        }
      }
    }
    function computeGridVotes() {
      var nx = G.nx, ny = G.ny, nodes = (nx + 1) * (ny + 1), Ke = Math.min(S.K, S.pts.length);
      if (!G.pred || G.pred.length !== nodes) { G.pred = new Uint8Array(nodes); G.cnt = new Uint8Array(nodes * 3); G.conf = new Float32Array(nodes); }
      G.predCount = [0, 0, 0];
      G.Ke = Ke;
      if (!Ke) return;
      var C = Math.max(1, M.present.length), cls = G.cls;
      for (var node = 0; node < nodes; node++) {
        var o = node * CAP, best = voteList(cls, o, Ke), share = cnt3[best] / Ke;
        G.pred[node] = best;
        G.cnt[node * 3] = cnt3[0]; G.cnt[node * 3 + 1] = cnt3[1]; G.cnt[node * 3 + 2] = cnt3[2];
        // confidence: 0 when the vote is as split as it can be, 1 when every neighbour agrees
        G.conf[node] = C > 1 ? clamp((share - 1 / C) / (1 - 1 / C), 0, 1) : 1;
        G.predCount[best]++;
      }
    }
    // Decision boundary, traced by marching squares on a field that is >= 0 where class c wins.
    // Two classes, odd K = 2m - 1: class a wins exactly when its m-th nearest loan is closer than class b's
    // m-th nearest, so "distance to b's m-th minus distance to a's m-th" is a smooth field whose zero line
    // is the true KNN boundary. At K = 1 with three classes, class c wins where its nearest loan is closer than
    // every other class's nearest, so "nearest other minus nearest c" is exact too. Otherwise (three classes,
    // K > 1) we fall back to "votes for c minus the best other class".
    function computeContour() {
      var segs = [];
      G.segs = segs;
      var pres = M.present, n = S.pts.length;
      if (pres.length < 2 || !G.Ke) return;
      var nx = G.nx, ny = G.ny, W = nx + 1, nodes = W * (ny + 1), f = new Float32Array(nodes), node;
      var exact = pres.length === 2 && G.Ke === S.K && S.K % 2 === 1;
      var exact1 = !exact && G.Ke === 1;
      var trace = pres.length === 2 ? [pres[0]] : pres;
      trace.forEach(function (c) {
        var i, j;
        if (exact1) {
          var cls1 = G.cls, dst1 = G.dst;
          for (node = 0; node < nodes; node++) {
            var o1 = node * CAP, L1 = G.len[node], dc = -1, dO = -1;
            for (var q1 = 0; q1 < L1 && (dc < 0 || dO < 0); q1++) {
              if (cls1[o1 + q1] === c) { if (dc < 0) dc = dst1[o1 + q1]; }
              else if (dO < 0) dO = dst1[o1 + q1];
            }
            var far1 = L1 < n ? dst1[o1 + L1 - 1] : 10;
            f[node] = (dO < 0 ? far1 : dO) - (dc < 0 ? far1 : dc);
          }
        } else if (exact) {
          var a = pres[0], b = pres[1], m = (S.K + 1) / 2, cls = G.cls, dst = G.dst;
          for (node = 0; node < nodes; node++) {
            var o = node * CAP, KM = G.len[node], ca = 0, cb = 0, da = -1, db = -1;
            for (var q = 0; q < KM && (da < 0 || db < 0); q++) {
              var cq = cls[o + q];
              if (cq === a) { if (++ca === m) da = dst[o + q]; }
              else if (cq === b) { if (++cb === m) db = dst[o + q]; }
            }
            // not in the remembered list: either it is further than the last one, or that class is too small to ever win
            var far = KM < n ? dst[o + KM - 1] : 10;
            f[node] = (db < 0 ? far : db) - (da < 0 ? far : da);
          }
        } else {
          var KeF = G.Ke, clsF = G.cls, dstF = G.dst, tieScale = 4 / Math.max(nx, ny);
          for (node = 0; node < nodes; node++) {
            var ac = G.cnt[node * 3 + c], mo = 0;
            for (var q2 = 0; q2 < 3; q2++) if (q2 !== c && G.cnt[node * 3 + q2] > mo) mo = G.cnt[node * 3 + q2];
            if (ac !== mo) { f[node] = ac - mo + (ac > mo ? 0.5 : -0.5); continue; }
            // A tie, settled by whose loan is closest. A whole-number field would put the line halfway between
            // grid spots (a staircase), so use the distance gap between c's closest voter and the closest
            // voter of a tied rival: it changes smoothly and is 0 exactly where the tie-break flips.
            var oF = node * CAP, dc2 = -1, dr2 = -1;
            for (var q3 = 0; q3 < KeF && (dc2 < 0 || dr2 < 0); q3++) {
              var cq3 = clsF[oF + q3];
              if (cq3 === c) { if (dc2 < 0) dc2 = dstF[oF + q3]; }
              else if (dr2 < 0 && G.cnt[node * 3 + cq3] === ac) dr2 = dstF[oF + q3];
            }
            f[node] = clamp((dr2 - dc2) / tieScale, -0.5, 0.5);
          }
        }
        for (j = 0; j < ny; j++) {
          for (i = 0; i < nx; i++) {
            var v0 = f[j * W + i], v1 = f[j * W + i + 1], v2 = f[(j + 1) * W + i + 1], v3 = f[(j + 1) * W + i];
            var id = (v0 >= 0 ? 1 : 0) | (v1 >= 0 ? 2 : 0) | (v2 >= 0 ? 4 : 0) | (v3 >= 0 ? 8 : 0);
            if (id === 0 || id === 15) continue;
            var e = [
              [i + v0 / (v0 - v1), j],          // bottom edge
              [i + 1, j + v1 / (v1 - v2)],      // right edge
              [i + v3 / (v3 - v2), j + 1],      // top edge
              [i, j + v0 / (v0 - v3)]           // left edge
            ];
            var centre = v0 + v1 + v2 + v3 >= 0;
            var pairs;
            switch (id) {
              case 1: case 14: pairs = [3, 0]; break;
              case 2: case 13: pairs = [0, 1]; break;
              case 3: case 12: pairs = [3, 1]; break;
              case 4: case 11: pairs = [1, 2]; break;
              case 6: case 9: pairs = [0, 2]; break;
              case 7: case 8: pairs = [2, 3]; break;
              case 5: pairs = centre ? [0, 1, 2, 3] : [3, 0, 1, 2]; break;
              case 10: pairs = centre ? [3, 0, 1, 2] : [0, 1, 2, 3]; break;
              default: pairs = [];
            }
            for (var s = 0; s < pairs.length; s += 2) segs.push(e[pairs[s]][0], e[pairs[s]][1], e[pairs[s + 1]][0], e[pairs[s + 1]][1]);
          }
        }
      });
    }
    function paintGrid(T) {
      var W = G.nx + 1, H = G.ny + 1;
      if (gridCanvas.width !== W || gridCanvas.height !== H) { gridCanvas.width = W; gridCanvas.height = H; }
      var img = gg.createImageData(W, H), d = img.data, sf = T.surface;
      for (var j = 0; j < H; j++) {
        var row = (G.ny - j) * W;   // node row 0 is the bottom of the map, image row 0 is the top
        for (var i = 0; i < W; i++) {
          var node = j * W + i, o = (row + i) * 4, col = sf, a = 0;
          if (G.Ke) { col = T.cls[G.pred[node]]; a = T.aMin + (T.aMax - T.aMin) * G.conf[node]; }
          d[o] = Math.round(sf[0] + (col[0] - sf[0]) * a);
          d[o + 1] = Math.round(sf[1] + (col[1] - sf[1]) * a);
          d[o + 2] = Math.round(sf[2] + (col[2] - sf[2]) * a);
          d[o + 3] = 255;
        }
      }
      gg.putImageData(img, 0, 0);
    }

    /* ---------- drawing ---------- */
    function font(T, px, weight) { return (weight || '400') + ' ' + px + 'px ' + T.font; }
    function drawPoint(c2, T, Gm, p, r) {
      var q = toPx(Gm, p.x, p.y);
      c2.beginPath();
      shapePath(c2, CLASSES[p.c].shape, q.x, q.y, r);
      c2.fillStyle = rgbStr(T.cls[p.c]);
      c2.fill();
      c2.lineWidth = 1.4;
      c2.strokeStyle = rgbStr(T.surface);
      c2.stroke();
    }
    function renderBase(T) {
      var b = bg, dpr = dims.dpr, w = dims.w, h = dims.h, Gm = geom(), pts = S.pts, n = pts.length, i;
      b.setTransform(dpr, 0, 0, dpr, 0, 0);
      b.fillStyle = rgbStr(T.surface);
      b.fillRect(0, 0, w, h);
      // background map, drawn so each image pixel's centre lands exactly on its grid node
      if (n && G.Ke) {
        b.save();
        b.beginPath(); b.rect(Gm.pl, Gm.pt, Gm.pw, Gm.ph); b.clip();
        b.imageSmoothingEnabled = true;
        var cw = Gm.pw / G.nx, ch = Gm.ph / G.ny;
        b.drawImage(gridCanvas, Gm.pl - cw / 2, Gm.pt - ch / 2, Gm.pw + cw, Gm.ph + ch);
        b.restore();
      }
      // grid lines and ticks
      b.lineWidth = 1;
      b.strokeStyle = rgbStr(T.ink, T.dark ? 0.1 : 0.08);
      b.beginPath();
      for (i = 1; i < 4; i++) {
        var gx = Math.round(Gm.pl + Gm.pw * i / 4) + 0.5, gy = Math.round(Gm.pt + Gm.ph * i / 4) + 0.5;
        b.moveTo(gx, Gm.pt); b.lineTo(gx, Gm.pt + Gm.ph);
        b.moveTo(Gm.pl, gy); b.lineTo(Gm.pl + Gm.pw, gy);
      }
      b.stroke();
      b.strokeStyle = rgbStr(T.line);
      b.strokeRect(Math.round(Gm.pl) + 0.5, Math.round(Gm.pt) + 0.5, Math.round(Gm.pw) - 1, Math.round(Gm.ph) - 1);
      var fs = Gm.small ? 11 : 12;
      b.font = font(T, fs);
      b.fillStyle = rgbStr(T.muted);
      b.textBaseline = 'top';
      for (i = 0; i <= 4; i++) {
        b.textAlign = i === 0 ? 'left' : i === 4 ? 'right' : 'center';
        b.fillText(tickInr(incomeOf(i / 4)), Gm.pl + Gm.pw * i / 4, Gm.pt + Gm.ph + 5);
      }
      b.textAlign = 'right';
      for (i = 0; i <= 4; i++) {
        // the top and bottom labels sit inside the plot's height so they never touch the canvas edge
        b.textBaseline = i === 4 ? 'top' : i === 0 ? 'bottom' : 'middle';
        b.fillText(tickInr(emiOf(i / 4)), Gm.pl - 6, Gm.pt + Gm.ph * (1 - i / 4));
      }
      b.font = font(T, fs, '600');
      b.fillStyle = rgbStr(T.ink);
      b.textAlign = 'center';
      b.textBaseline = 'bottom';
      b.fillText('Monthly income →', Gm.pl + Gm.pw / 2, h - 4);
      b.save();
      b.translate(fs * 0.5 + 3, Gm.pt + Gm.ph / 2);
      b.rotate(-Math.PI / 2);
      b.textBaseline = 'middle';
      b.fillText('Existing EMIs per month →', 0, 0);
      b.restore();
      // decision boundary
      if (G.segs.length) {
        var sx = Gm.pw / G.nx, sy = Gm.ph / G.ny, X0 = Gm.pl, Y0 = Gm.pt + Gm.ph, s = G.segs;
        b.save();
        b.beginPath(); b.rect(Gm.pl, Gm.pt, Gm.pw, Gm.ph); b.clip();
        b.beginPath();
        for (i = 0; i < s.length; i += 4) {
          b.moveTo(X0 + s[i] * sx, Y0 - s[i + 1] * sy);
          b.lineTo(X0 + s[i + 2] * sx, Y0 - s[i + 3] * sy);
        }
        b.lineWidth = 1.6;
        b.lineCap = 'round';
        b.strokeStyle = rgbStr(T.ink, T.dark ? 0.62 : 0.55);
        b.stroke();
        b.restore();
      }
      // loans, with a ring round the ones the model gets wrong at this K
      var r = pointRadius();
      b.lineWidth = 1.5;
      b.strokeStyle = rgbStr(T.ink, 0.85);
      b.beginPath();
      for (i = 0; i < n; i++) {
        if (!M.wrong[i]) continue;
        var q = toPx(Gm, pts[i].x, pts[i].y);
        b.moveTo(q.x + r + 3.5, q.y); b.arc(q.x, q.y, r + 3.5, 0, Math.PI * 2);
      }
      b.stroke();
      for (i = 0; i < n; i++) drawPoint(b, T, Gm, pts[i], r);
      if (!n) {
        b.font = font(T, 14, '600');
        b.fillStyle = rgbStr(T.muted);
        b.textAlign = 'center';
        b.textBaseline = 'middle';
        b.fillText('No loans yet: click or tap to add some', Gm.pl + Gm.pw / 2, Gm.pt + Gm.ph / 2);
      }
    }
    function roundRect(c2, x, y, w, h, r) {
      c2.beginPath();
      c2.moveTo(x + r, y); c2.lineTo(x + w - r, y); c2.arcTo(x + w, y, x + w, y + r, r);
      c2.lineTo(x + w, y + h - r); c2.arcTo(x + w, y + h, x + w - r, y + h, r);
      c2.lineTo(x + r, y + h); c2.arcTo(x, y + h, x, y + h - r, r);
      c2.lineTo(x, y + r); c2.arcTo(x, y, x + r, y, r);
      c2.closePath();
    }
    var probeNb = null;
    function drawFrame(T) {
      var dpr = dims.dpr, Gm = geom(), pts = S.pts, n = pts.length, r = pointRadius(), i;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(base, 0, 0);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      probeNb = n ? neighboursAt(S.probe.x, S.probe.y) : null;
      var pp = toPx(Gm, S.probe.x, S.probe.y), nb = probeNb;
      if (nb) {
        // the neighbourhood: every spot inside is at least as close as the K-th neighbour
        g.save();
        g.beginPath(); g.rect(Gm.pl, Gm.pt, Gm.pw, Gm.ph); g.clip();
        g.beginPath();
        var rx = nb.rK * Gm.pw, ry = nb.rK * Gm.ph;
        if (S.man) { g.moveTo(pp.x + rx, pp.y); g.lineTo(pp.x, pp.y - ry); g.lineTo(pp.x - rx, pp.y); g.lineTo(pp.x, pp.y + ry); g.closePath(); }
        else g.ellipse(pp.x, pp.y, Math.max(rx, 0.5), Math.max(ry, 0.5), 0, 0, Math.PI * 2);
        g.fillStyle = rgbStr(T.ink, T.dark ? 0.06 : 0.04);
        g.fill();
        g.setLineDash([5, 4]);
        g.lineWidth = 1.3;
        g.strokeStyle = rgbStr(T.ink, 0.6);
        g.stroke();
        g.setLineDash([]);
        g.restore();
        // a line to each neighbour, in that neighbour's class colour
        g.lineCap = 'round';
        for (i = 0; i < nb.Ke; i++) {
          var q = toPx(Gm, pts[nb.idx[i]].x, pts[nb.idx[i]].y);
          g.beginPath(); g.moveTo(pp.x, pp.y); g.lineTo(q.x, q.y);
          g.lineWidth = 3.4; g.strokeStyle = rgbStr(T.surface, 0.85); g.stroke();
          g.lineWidth = 1.6; g.strokeStyle = rgbStr(T.cls[pts[nb.idx[i]].c]); g.stroke();
        }
        for (i = 0; i < nb.Ke; i++) drawPoint(g, T, Gm, pts[nb.idx[i]], r + 0.8);
      }
      // hovered loan (the one a click would remove)
      if (S.hover >= 0 && S.hover < n) {
        var hq = toPx(Gm, pts[S.hover].x, pts[S.hover].y);
        g.beginPath(); g.arc(hq.x, hq.y, r + 6, 0, Math.PI * 2);
        g.lineWidth = 2.5; g.strokeStyle = rgbStr(T.haldi); g.stroke();
      }
      if (nb) {
        // the probe itself, filled with its predicted class colour
        g.beginPath(); g.arc(pp.x, pp.y, 7.5, 0, Math.PI * 2);
        g.fillStyle = rgbStr(T.surface); g.fill();
        g.lineWidth = 2; g.strokeStyle = rgbStr(T.ink); g.stroke();
        g.beginPath(); g.arc(pp.x, pp.y, 4.2, 0, Math.PI * 2);
        g.fillStyle = rgbStr(T.cls[nb.best]); g.fill();
        drawBadge(T, Gm, pp, nb);
      }
    }
    // A small vote counter next to the probe, e.g. [● 3  ■ 2]
    function drawBadge(T, Gm, pp, nb) {
      var items = [], i;
      for (i = 0; i < 3; i++) if (nb.counts[i] > 0) items.push(i);
      items.sort(function (a, b) { return nb.counts[b] - nb.counts[a] || a - b; });
      g.font = font(T, 12, '700');
      var pad = 7, gap = 10, icon = 11, w = pad * 2 - gap, h = 22;
      var widths = items.map(function (c) { return icon + 4 + g.measureText(String(nb.counts[c])).width; });
      widths.forEach(function (wd) { w += wd + gap; });
      // try spots round the probe (corners first, then sides) and keep the one that hides the fewest loans;
      // hiding one of the probe's own voters costs more, since those are the loans the badge is about
      var cands = [[pp.x + 13, pp.y - 13 - h], [pp.x - 13 - w, pp.y - 13 - h], [pp.x + 13, pp.y + 13], [pp.x - 13 - w, pp.y + 13],
        [pp.x + 16, pp.y - h / 2], [pp.x - 16 - w, pp.y - h / 2], [pp.x - w / 2, pp.y - 16 - h], [pp.x - w / 2, pp.y + 16]];
      var x = 0, y = 0, bestScore = Infinity, r = pointRadius() + 1, pts = S.pts, voter = {};
      for (i = 0; i < nb.Ke; i++) voter[nb.idx[i]] = true;
      for (var ci = 0; ci < cands.length; ci++) {
        var cx0 = clamp(cands[ci][0], Gm.pl + 2, Math.max(Gm.pl + 2, Gm.pl + Gm.pw - w - 2));
        var cy0 = clamp(cands[ci][1], Gm.pt + 2, Math.max(Gm.pt + 2, Gm.pt + Gm.ph - h - 2));
        var score = 0;
        // never cover the probe itself
        if (pp.x > cx0 - 9 && pp.x < cx0 + w + 9 && pp.y > cy0 - 9 && pp.y < cy0 + h + 9) score += 1000;
        for (i = 0; i < pts.length; i++) {
          var tq = toPx(Gm, pts[i].x, pts[i].y);
          if (tq.x > cx0 - r && tq.x < cx0 + w + r && tq.y > cy0 - r && tq.y < cy0 + h + r) score += voter[i] ? 4 : 1;
        }
        if (score < bestScore) { bestScore = score; x = cx0; y = cy0; }
      }
      roundRect(g, x, y, w, h, 6);
      g.fillStyle = rgbStr(T.surface, 0.94); g.fill();
      g.lineWidth = 1; g.strokeStyle = rgbStr(T.ink, 0.35); g.stroke();
      var cx = x + pad;
      g.textAlign = 'left'; g.textBaseline = 'middle';
      items.forEach(function (c, k) {
        g.beginPath();
        shapePath(g, CLASSES[c].shape, cx + icon / 2, y + h / 2, 4.6);
        g.fillStyle = rgbStr(T.cls[c]); g.fill();
        g.fillStyle = rgbStr(T.ink);
        g.fillText(String(nb.counts[c]), cx + icon + 4, y + h / 2 + 0.5);
        cx += widths[k] + gap;
      });
    }

    /* ---------- accuracy-by-K chart ---------- */
    function drawChart(T) {
      var dpr = dims.dpr, w = dims.cw, h = dims.ch, c2 = gc;
      c2.setTransform(dpr, 0, 0, dpr, 0, 0);
      c2.fillStyle = rgbStr(T.surface);
      c2.fillRect(0, 0, w, h);
      var pl = 44, pr = 10, pt = 12, pb = 30, pw = Math.max(10, w - pl - pr), ph = Math.max(10, h - pt - pb);
      var slot = pw / K_COUNT, n = S.pts.length, ki;
      function X(k) { return pl + (k + 0.5) * slot; }
      var shown = [];
      for (ki = 0; ki < K_COUNT; ki++) if (S.revealed || S.tried[2 * ki + 1]) shown.push(ki);
      var ok = n >= 2;
      var minV = 1;
      if (ok) shown.forEach(function (k) { minV = Math.min(minV, M.loo[k] / n, M.train[k] / n); });
      var step = 1 - minV <= 0.3 ? 0.05 : 1 - minV <= 0.6 ? 0.1 : 0.25;
      var lo = Math.max(0, Math.floor((minV - 0.01) / step) * step);
      if (1 - lo < step * 2) lo = Math.max(0, 1 - step * 2);
      function Y(v) { return pt + (1 - (v - lo) / (1 - lo)) * ph; }
      // current K
      var cur = (S.K - 1) / 2;
      c2.fillStyle = rgbStr(T.haldiSoft);
      c2.fillRect(X(cur) - slot / 2, pt, slot, ph);
      // horizontal grid lines with % labels
      c2.font = font(T, 11);
      c2.textAlign = 'right'; c2.textBaseline = 'middle';
      c2.lineWidth = 1;
      for (var v = lo; v <= 1.0001; v += step) {
        var yy = Math.round(Y(v)) + 0.5;
        c2.strokeStyle = rgbStr(T.ink, v > 0.9999 || v === lo ? 0.16 : 0.08);
        c2.beginPath(); c2.moveTo(pl, yy); c2.lineTo(pl + pw, yy); c2.stroke();
        c2.fillStyle = rgbStr(T.muted);
        c2.fillText(Math.round(v * 100) + '%', pl - 6, yy);
      }
      // K labels
      c2.textAlign = 'center'; c2.textBaseline = 'top';
      for (ki = 0; ki < K_COUNT; ki++) {
        var isCur = ki === cur;
        c2.font = font(T, 11, isCur ? '700' : '400');
        c2.fillStyle = rgbStr(isCur ? T.ink : T.muted);
        c2.fillText(String(2 * ki + 1), X(ki), pt + ph + 9);
      }
      c2.font = font(T, 11, '600');
      c2.textAlign = 'right';
      c2.fillStyle = rgbStr(T.muted);
      c2.fillText('K =', pl - 6, pt + ph + 9);
      if (!ok) {
        c2.font = font(T, 13, '600');
        c2.textAlign = 'center'; c2.textBaseline = 'middle';
        c2.fillText('Add at least 2 loans to measure accuracy', pl + pw / 2, pt + ph / 2);
        return;
      }
      // training accuracy: dashed line, hollow dots
      c2.setLineDash([4, 4]);
      c2.lineWidth = 1.5; c2.strokeStyle = rgbStr(T.muted, 0.8);
      c2.beginPath();
      shown.forEach(function (k, j) { var y = Y(M.train[k] / n); if (j && shown[j - 1] === k - 1) c2.lineTo(X(k), y); else c2.moveTo(X(k), y); });
      c2.stroke();
      c2.setLineDash([]);
      // leave-one-out: solid line, filled dots
      c2.lineWidth = 2; c2.strokeStyle = rgbStr(T.s4);
      c2.beginPath();
      shown.forEach(function (k, j) { var y = Y(M.loo[k] / n); if (j && shown[j - 1] === k - 1) c2.lineTo(X(k), y); else c2.moveTo(X(k), y); });
      c2.stroke();
      shown.forEach(function (k) {
        c2.beginPath(); c2.arc(X(k), Y(M.train[k] / n), 3.6, 0, Math.PI * 2);
        c2.fillStyle = rgbStr(T.surface); c2.fill();
        c2.lineWidth = 1.6; c2.strokeStyle = rgbStr(T.muted); c2.stroke();
      });
      var bestV = -1;
      shown.forEach(function (k) { bestV = Math.max(bestV, M.loo[k]); });
      var firstBest = -1;
      shown.forEach(function (k) {
        var y = Y(M.loo[k] / n);
        c2.beginPath(); c2.arc(X(k), y, 4.4, 0, Math.PI * 2);
        c2.fillStyle = rgbStr(T.s4); c2.fill();
        c2.lineWidth = 1.5; c2.strokeStyle = rgbStr(T.surface); c2.stroke();
        if (M.loo[k] === bestV) {
          c2.beginPath(); c2.arc(X(k), y, 7.5, 0, Math.PI * 2);
          c2.lineWidth = 1.5; c2.strokeStyle = rgbStr(T.ink, 0.8); c2.stroke();
          if (firstBest < 0) firstBest = k;
        }
      });
      if (firstBest >= 0 && shown.length > 1) {
        var by = Y(M.loo[firstBest] / n), trY = Y(M.train[firstBest] / n);
        var label = (shown.length === K_COUNT ? 'best ' : 'best so far ') + pct(M.loo[firstBest], n);
        c2.font = font(T, 11, '700');
        c2.fillStyle = rgbStr(T.ink);
        c2.textAlign = 'left'; c2.textBaseline = 'middle';
        var lw = c2.measureText(label).width;
        // above the dot, unless the training dot sits just above it or there is no room; then below
        var ly = by - 15;
        if ((trY < by && by - trY < 24) || ly < pt + 6) ly = by + 16;
        if (ly > pt + ph - 6) ly = by - 15;
        c2.fillText(label, clamp(X(firstBest) - lw / 2, pl + 3, pl + pw - lw - 3), ly);
      }
    }

    /* ---------- frame loop (runs only when something changed) ---------- */
    function requestDraw() { if (!rafId && !destroyed) rafId = requestAnimationFrame(frame); }
    function frame() {
      rafId = 0;
      if (destroyed || dims.w < 2) return;
      var T = readTheme();
      if (T !== lastTheme) { lastTheme = T; dirty.colours = dirty.base = dirty.chart = true; }
      if (dirty.nbrs) { computeGridNeighbours(); dirty.nbrs = false; dirty.votes = true; }
      if (dirty.votes) {
        computeGridVotes(); computeContour();
        dirty.votes = false; dirty.colours = true;
        var nodes = (G.nx + 1) * (G.ny + 1);
        if (M.counts[2] >= 3 && G.Ke && G.predCount[2] >= nodes * 0.005) completeTask('t4');
      }
      if (dirty.colours) { paintGrid(T); dirty.colours = false; dirty.base = true; }
      if (dirty.base) { renderBase(T); dirty.base = false; }
      drawFrame(T);
      if (dirty.chart) { drawChart(T); dirty.chart = false; }
      updateReadout();
    }

    /* ---------- text outside the canvas ---------- */
    function updateStats() {
      var n = S.pts.length, ki = (S.K - 1) / 2;
      elSK.textContent = String(S.K);
      elSTr.textContent = n ? pct(M.train[ki], n) : '—';
      elSLoo.textContent = n >= 2 ? pct(M.loo[ki], n) : '—';
      elSN.textContent = String(n);
      elKout.textContent = String(S.K);
      var legend = [0, 1, 2].filter(function (c) { return c < 2 || M.counts[2] > 0 || S.cls === 2; }).map(function (c) {
        return legendItem(classSwatch(c), CLASSES[c].name + ' (' + M.counts[c] + ')');
      });
      legend.push(legendItem(swatch('ring', 'none', 'var(--ink)', 1.5), 'ring = model gets it wrong at this K'));
      legend.push(legendItem(swatch('line', 'none', 'var(--ink)', 1.6), 'decision boundary'));
      var html = legend.join('');
      if (elLegend.innerHTML !== html) elLegend.innerHTML = html;
      canvas.setAttribute('aria-label', 'Map of ' + n + ' past loans: monthly income from left to right, existing EMIs from bottom to top. ' +
        'The shading shows what KNN predicts with K = ' + S.K + ' and ' + (S.man ? 'Manhattan' : 'Euclidean') + ' distance. ' +
        (n ? 'Training accuracy ' + pct(M.train[ki], n) + (n >= 2 ? ', leave-one-out accuracy ' + pct(M.loo[ki], n) : '') + '.' : 'There are no loans yet.'));
      var parts = [];
      for (var k = 0; k < K_COUNT; k++) if (n >= 2 && (S.revealed || S.tried[2 * k + 1])) parts.push('K ' + (2 * k + 1) + ': leave-one-out ' + pct(M.loo[k], n) + ', training ' + pct(M.train[k], n));
      chart.setAttribute('aria-label', parts.length ? 'Accuracy for each K tried. ' + parts.join('; ') + '.' : 'Accuracy chart: add at least 2 loans to measure accuracy.');
    }
    function updateReadout() {
      var n = S.pts.length, s;
      if (!n || !probeNb) {
        s = 'No past loans on the map. Pick a class under “Class of new loans” and click or tap the map to add some.';
      } else {
        var nb = probeNb, x = S.probe.x, y = S.probe.y;
        var order = [0, 1, 2].filter(function (c) { return nb.counts[c] > 0; }).sort(function (a, b) { return nb.counts[b] - nb.counts[a] || a - b; });
        var who = nb.Ke === 1 ? 'its nearest past loan was <b>' + CLASSES[nb.best].name + '</b>'
          : 'its ' + nb.Ke + ' nearest past loans: ' + order.map(function (c) { return nb.counts[c] + ' ' + CLASSES[c].name; }).join(', ');
        s = 'Probe at income <span class="num">' + inr(round500(incomeOf(x))) + '</span>, EMIs <span class="num">' + inr(round500(emiOf(y))) + '</span> ' +
          '<span class="muted num">(scaled ' + x.toFixed(2) + ', ' + y.toFixed(2) + ')</span>: ' + who + '. ' +
          'Prediction: <b>' + CLASSES[nb.best].name + '</b> (' + nb.counts[nb.best] + ' of ' + nb.Ke + (nb.Ke === 1 ? ' vote, ' : ' votes, ') + pct(nb.counts[nb.best], nb.Ke).replace('.0%', '%') + ').' +
          (nb.tie ? ' A tie, so of the tied classes, the one with the closest loan wins.' : '') +
          (S.K > n ? ' K is bigger than the number of loans, so all ' + n + ' vote.' : '') +
          (S.hover >= 0 ? ' <b>Click to remove this loan.</b>' : '');
      }
      if (S.notice) s += ' <b>' + S.notice + '</b>';
      if (s !== lastReadout) { lastReadout = s; elReadout.innerHTML = s; }
    }
    var DIST_TEXT = {
      euc: 'Euclidean: straight-line distance, as a bird flies: √(across² + up²). The dashed neighbourhood around the probe is round (it looks oval when the map is wider than it is tall, because both axes run from 0 to 1).',
      man: 'Manhattan: city-block distance, like an auto-rickshaw on Chandigarh’s grid of roads: across + up, no diagonal short cuts. The dashed neighbourhood is a diamond.'
    };

    /* ---------- changes ---------- */
    function checkTasks(settled) {
      var n = S.pts.length, ki = (S.K - 1) / 2, two = M.present.length >= 2;
      if (S.kTouched && S.K === 1 && n >= 10 && two && M.train[0] === n) completeTask('t1');
      if (settled && S.kTouched && (S.userTriedCount >= 4 || S.revealed) && n >= 10 && two) {
        var best = Math.max.apply(null, M.loo);
        if (M.loo[ki] === best) completeTask('t2');
      }
    }
    // how: 'add' (a loan was appended), a number (that loan index was removed), or nothing (rebuild everything)
    function dataChanged(how) {
      S.notice = '';
      computeModel(); computeAtK();
      var gridOk = G.ready && !dirty.nbrs && G.len && G.len.length === (G.nx + 1) * (G.ny + 1);
      if (gridOk && how === 'add') gridAddLast();
      else if (gridOk && typeof how === 'number') gridRemoved(how);
      else dirty.nbrs = true;
      dirty.votes = true; dirty.chart = true;
      updateStats(); checkTasks(true); requestDraw();
    }
    function setK(K, settled) {
      K = clamp(Math.round(K), 1, K_MAX);
      if (K % 2 === 0) K -= 1;
      var changed = K !== S.K;
      S.K = K;
      S.kTouched = true;
      S.tried[K] = true;
      if (!S.userTried[K]) { S.userTried[K] = true; S.userTriedCount++; }
      if (changed) { computeAtK(); dirty.votes = true; dirty.base = true; dirty.chart = true; updateStats(); }
      checkTasks(settled);
      requestDraw();
    }
    function setMetric(man) {
      if (man === S.man) return;
      S.man = man;
      Array.prototype.forEach.call(distBtns, function (b) { b.setAttribute('aria-pressed', String((b.getAttribute('data-dist') === 'man') === man)); });
      elDistDesc.textContent = DIST_TEXT[man ? 'man' : 'euc'];
      dataChanged();
    }
    function setClass(c) {
      S.cls = c;
      Array.prototype.forEach.call(clsBtnEls, function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-cls') === c)); });
      updateStats();
    }
    // a short message shown under the map (and read out) until the loans change
    function notify(s) { S.notice = s; announce(s); requestDraw(); }
    function addPoint(x, y) {
      if (S.pts.length >= MAX_POINTS) { notify('That is the limit of ' + MAX_POINTS + ' loans. Remove some first.'); return; }
      S.pts.push({ x: clamp(x, 0, 1), y: clamp(y, 0, 1), c: S.cls, user: true });
      announce('Added a ' + CLASSES[S.cls].name + ' loan. ' + S.pts.length + ' loans on the map.');
      dataChanged('add');
    }
    function removePoint(i) {
      var p = S.pts[i];
      S.pts.splice(i, 1);
      setHover(-1);   // loan numbers shift after a removal, and the pointer cursor must go too
      announce('Removed a ' + CLASSES[p.c].name + ' loan. ' + S.pts.length + ' loans on the map.');
      dataChanged(i);
    }

    /* ---------- pointer + keyboard ---------- */
    function localPos(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function hitTest(px, py, radius) {
      var Gm = geom(), best = -1, bd = radius * radius;
      for (var i = 0; i < S.pts.length; i++) {
        var q = toPx(Gm, S.pts[i].x, S.pts[i].y), dx = q.x - px, dy = q.y - py, d = dx * dx + dy * dy;
        if (d <= bd) { bd = d; best = i; }
      }
      return best;
    }
    function setProbePx(px, py) {
      var d = toData(geom(), px, py);
      S.probe.x = clamp(d.x, 0, 1); S.probe.y = clamp(d.y, 0, 1);
      requestDraw();
    }
    function setHover(i) {
      if (i === S.hover) return;
      S.hover = i;
      canvas.style.cursor = i >= 0 ? 'pointer' : 'crosshair';
      requestDraw();
    }
    var ptr = { id: null, x0: 0, y0: 0, moved: false, type: '' };
    on(canvas, 'pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      ptr.id = e.pointerId; ptr.x0 = e.clientX; ptr.y0 = e.clientY; ptr.moved = false; ptr.type = e.pointerType;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      var p = localPos(e);
      if (e.pointerType !== 'mouse') setProbePx(p.x, p.y);
    });
    on(canvas, 'pointermove', function (e) {
      var p = localPos(e);
      if (ptr.id === e.pointerId) {
        if (!ptr.moved && Math.abs(e.clientX - ptr.x0) + Math.abs(e.clientY - ptr.y0) > 8) ptr.moved = true;
        if (ptr.moved || e.pointerType === 'mouse') setProbePx(p.x, p.y);
        if (e.pointerType === 'mouse') setHover(ptr.moved ? -1 : hitTest(p.x, p.y, pointRadius() + 5));
      } else if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
        setProbePx(p.x, p.y);
        setHover(hitTest(p.x, p.y, pointRadius() + 5));
      }
    });
    function endPointer(e, cancelled) {
      if (ptr.id !== e.pointerId) return;
      ptr.id = null;
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      if (cancelled || ptr.moved) return;
      var p = localPos(e), Gm = geom();
      var hit = hitTest(p.x, p.y, ptr.type === 'mouse' ? pointRadius() + 5 : pointRadius() + 12);
      if (hit >= 0) {
        removePoint(hit);
        if (ptr.type === 'mouse') setHover(hitTest(p.x, p.y, pointRadius() + 5));
        return;
      }
      var d = toData(Gm, p.x, p.y);
      if (d.x < -0.01 || d.x > 1.01 || d.y < -0.01 || d.y > 1.01) return;   // a tap on the axis labels does nothing
      addPoint(d.x, d.y);
      if (ptr.type === 'mouse') setHover(hitTest(p.x, p.y, pointRadius() + 5));
    }
    on(canvas, 'pointerup', function (e) { endPointer(e, false); });
    on(canvas, 'pointercancel', function (e) { endPointer(e, true); });
    on(canvas, 'pointerleave', function (e) { if (e.pointerType === 'mouse' && ptr.id === null) setHover(-1); });
    // what a screen reader hears after the probe moves by keyboard (the readout under the map is not a live region)
    var probeAnnounceTimer = 0;
    function announceProbe() {
      probeAnnounceTimer = 0;
      if (destroyed || !S.pts.length) return;
      var nb = neighboursAt(S.probe.x, S.probe.y);
      announce('Income ' + inr(round500(incomeOf(S.probe.x))) + ', EMIs ' + inr(round500(emiOf(S.probe.y))) + ': prediction ' +
        CLASSES[nb.best].name + ', ' + nb.counts[nb.best] + ' of ' + nb.Ke + (nb.Ke === 1 ? ' vote.' : ' votes.'));
    }
    on(canvas, 'keydown', function (e) {
      var step = e.shiftKey ? 0.1 : 0.02, k = e.key, handled = true, moved = false, Gm = geom();
      if (k === 'ArrowLeft') { S.probe.x = clamp(S.probe.x - step, 0, 1); moved = true; }
      else if (k === 'ArrowRight') { S.probe.x = clamp(S.probe.x + step, 0, 1); moved = true; }
      else if (k === 'ArrowUp') { S.probe.y = clamp(S.probe.y + step, 0, 1); moved = true; }
      else if (k === 'ArrowDown') { S.probe.y = clamp(S.probe.y - step, 0, 1); moved = true; }
      else if (k === 'Enter' || k === ' ') {
        var q = toPx(Gm, S.probe.x, S.probe.y), hit = hitTest(q.x, q.y, pointRadius() + 4);
        if (hit >= 0) removePoint(hit); else addPoint(S.probe.x, S.probe.y);
      } else if (k === 'Delete' || k === 'Backspace') {
        var q2 = toPx(Gm, S.probe.x, S.probe.y), hit2 = hitTest(q2.x, q2.y, Math.max(40, pointRadius() + 4));
        if (hit2 >= 0) removePoint(hit2); else notify('No loan near the probe to remove.');
      } else handled = false;
      if (!handled) return;
      e.preventDefault();
      setHover(-1);
      if (moved) {
        // wait until the key is let go (or held keys pause) so a screen reader is not flooded
        if (probeAnnounceTimer) clearTimeout(probeAnnounceTimer);
        probeAnnounceTimer = setTimeout(announceProbe, 350);
      }
      requestDraw();
    });

    /* ---------- controls ---------- */
    on(elK, 'input', function () { setK(+elK.value, false); });
    on(elK, 'change', function () { setK(+elK.value, true); });
    Array.prototype.forEach.call(distBtns, function (b) { on(b, 'click', function () { setMetric(b.getAttribute('data-dist') === 'man'); }); });
    Array.prototype.forEach.call(clsBtnEls, function (b) { on(b, 'click', function () { setClass(+b.getAttribute('data-cls')); }); });
    on(btnFill, 'click', function () {
      S.revealed = !S.revealed;
      btnFill.setAttribute('aria-pressed', String(S.revealed));
      btnFill.textContent = S.revealed ? 'Show only K I tried' : 'Show every K';
      dirty.chart = true; updateStats(); checkTasks(true); requestDraw();
    });
    on(btnReset, 'click', function () {
      S.pts = makeData(); S.hover = -1;
      S.probe.x = START_PROBE.x; S.probe.y = START_PROBE.y;
      announce('Example data restored: ' + S.pts.length + ' loans.');
      dataChanged();
    });
    on(btnClear, 'click', function () {
      S.pts = []; S.hover = -1;
      announce('All loans removed. Tap the map to add new ones.');
      dataChanged();
    });

    /* ---------- theme + resize ---------- */
    function onTheme() { themeCache.key = ''; requestDraw(); }
    var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mql) { if (mql.addEventListener) mql.addEventListener('change', onTheme); else if (mql.addListener) mql.addListener(onTheme); }
    on(document, 'themechange', onTheme);
    // the site's web font can arrive after the first paint: redraw the canvas text (axes, chart, badge) in it
    function onFonts() { if (destroyed) return; dirty.base = true; dirty.chart = true; requestDraw(); }
    var fontSet = document.fonts && document.fonts.addEventListener ? document.fonts : null;
    if (fontSet) {
      on(fontSet, 'loadingdone', onFonts);
      if (fontSet.ready && fontSet.ready.then) fontSet.ready.then(onFonts, function () { /* ignore */ });
    }

    // style.css stacks .lab-body into one column at 820px; then the chart moves below the controls,
    // so on a phone the K slider sits close enough to the map to watch both.
    // style.css only looks at the screen width, so in a narrow box on a wide screen (a module page puts a
    // 320px sidebar beside the lab) the map could shrink to about 200px. Below STACK_W of lab width we stack too.
    var STACK_W = 680;
    var mqNarrow = window.matchMedia ? window.matchMedia('(max-width: 820px)') : null;
    var labEl = root.querySelector('.lab'), stackedByWidth = false, layoutRaf = 0;
    function narrowScreen() { return !!(mqNarrow && mqNarrow.matches); }
    function wantStackByWidth() { var lw = labEl.getBoundingClientRect().width; return !narrowScreen() && lw > 0 && lw < STACK_W; }
    function placeMore() {
      layoutRaf = 0;
      if (destroyed) return;
      stackedByWidth = wantStackByWidth();
      body.style.gridTemplateColumns = stackedByWidth ? 'minmax(0, 1fr)' : '';
      if (narrowScreen() || stackedByWidth) { if (more.previousElementSibling !== body) body.parentNode.insertBefore(more, body.nextSibling); }
      else if (more.parentNode !== leftCol) leftCol.appendChild(more);
    }
    if (mqNarrow) { if (mqNarrow.addEventListener) mqNarrow.addEventListener('change', placeMore); else if (mqNarrow.addListener) mqNarrow.addListener(placeMore); }
    placeMore();

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
      // changing the wrapper's own size inside a ResizeObserver callback would loop, so defer it
      if (wantAspect() !== curAspect && !aspectRaf) aspectRaf = requestAnimationFrame(applyAspect);
      if (wantStackByWidth() !== stackedByWidth && !layoutRaf) layoutRaf = requestAnimationFrame(placeMore);
      var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      var r = canvas.getBoundingClientRect(), w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      if (w !== dims.w || h !== dims.h || dpr !== dims.dpr) {
        dims.w = w; dims.h = h; dims.dpr = dpr;
        canvas.width = base.width = Math.round(w * dpr);
        canvas.height = base.height = Math.round(h * dpr);
        gridSize();
        dirty.base = true;
      }
      var rc = chart.getBoundingClientRect(), cw = Math.max(1, Math.round(rc.width)), ch = Math.max(1, Math.round(rc.height));
      if (cw !== dims.cw || ch !== dims.ch || dpr !== dims.dpr || dirty.base) {
        dims.cw = cw; dims.ch = ch;
        chart.width = Math.round(cw * dpr); chart.height = Math.round(ch * dpr);
        dirty.chart = true;
      }
      requestDraw();
    }
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { resize(); }); ro.observe(wrap); ro.observe(cwrap); }
    else on(window, 'resize', resize);

    /* ---------- starting state: the example loans, K = 5, probe near the boundary ---------- */
    elDistDesc.textContent = DIST_TEXT.euc;
    applyAspect();
    dataChanged();
    resize();

    return {
      destroy: function () {
        // a second call must not empty a lab that has since been mounted into the same root
        if (destroyed) return;
        destroyed = true;
        if (probeAnnounceTimer) clearTimeout(probeAnnounceTimer);
        probeAnnounceTimer = 0;
        if (rafId) cancelAnimationFrame(rafId);
        if (aspectRaf) cancelAnimationFrame(aspectRaf);
        if (layoutRaf) cancelAnimationFrame(layoutRaf);
        rafId = 0; aspectRaf = 0; layoutRaf = 0;
        if (ro) ro.disconnect();
        if (mql) { if (mql.removeEventListener) mql.removeEventListener('change', onTheme); else if (mql.removeListener) mql.removeListener(onTheme); }
        if (mqNarrow) { if (mqNarrow.removeEventListener) mqNarrow.removeEventListener('change', placeMore); else if (mqNarrow.removeListener) mqNarrow.removeListener(placeMore); }
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
        listeners = [];
        root.innerHTML = '';
      }
    };
  }

  Labs.knn = {
    id: 'knn',
    module: 'l2-classification',
    title: 'K-Nearest Neighbours: loan risk map',
    summary: 'Predict whether a loan will be repaid by letting its K most similar past loans vote, and see how K and the distance measure reshape the decision boundary.',
    tasks: TASKS.map(function (t) { return { id: t.id, text: t.text }; }),
    mount: mount
  };
})();
