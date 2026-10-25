/* AI Marg lab: decision tree + mini random forest.
   Plain classic script (ES2019), no imports, works from file://.
   A real CART tree: Gini impurity, axis-aligned splits, exhaustive search over midpoints. */
(function () {
  'use strict';
  var Labs = (window.AILabs = window.AILabs || {});
  var SVGNS = 'http://www.w3.org/2000/svg';
  var uid = 0;

  /* ---------- tiny seeded random number generator (mulberry32) ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- the farm data ----------
     x[0] = rainfall in the season (mm), x[1] = average temperature (°C), y = 1 good rice harvest, 0 poor.
     Hidden rule: rice needs warmth (above ~20 °C) and enough rain; hotter fields lose more water,
     so they need more rain. Labels are drawn with some randomness and 5% are flipped (bad luck: pests, floods). */
  var DOM = { lo: [200, 14], hi: [2200, 40] };
  var DATA_SEED = 50, N_TRAIN = 90, N_TEST = 60, MAX_ADDED = 60, MAX_DEPTH = 8;

  function truthP(r, t) {
    var m1 = (r - (500 + 40 * (t - 15))) / 220;
    var m2 = (t - 20.5) / 1.6;
    return 1 / (1 + Math.exp(-2.5 * Math.min(m1, m2)));
  }
  function makeData(seed, n) {
    var rnd = mulberry32(seed), pts = [];
    for (var i = 0; i < n; i++) {
      var r = Math.round(240 + 1920 * rnd());
      var t = Math.round((14.8 + 24.4 * rnd()) * 10) / 10;
      var y = rnd() < truthP(r, t) ? 1 : 0;
      if (rnd() < 0.05) y = 1 - y;
      pts.push({ x: [r, t], y: y });
    }
    return pts;
  }

  /* ---------- CART with Gini impurity ---------- */
  // Gini for two classes: 1 - p0^2 - p1^2 = 2 p (1 - p)
  function gini(c0, c1) {
    var n = c0 + c1;
    if (!n) return 0;
    var p = c1 / n;
    return 2 * p * (1 - p);
  }

  // Exhaustive search on one feature: every midpoint between neighbouring distinct values.
  function bestSplit(pts, idx, f, minLeaf, parentG) {
    var s = idx.slice().sort(function (a, b) { return pts[a].x[f] - pts[b].x[f]; });
    var n = s.length, tot1 = 0, i;
    for (i = 0; i < n; i++) tot1 += pts[s[i]].y;
    var l1 = 0, best = null;
    for (var k = 1; k < n; k++) {
      l1 += pts[s[k - 1]].y;
      var a = pts[s[k - 1]].x[f], b = pts[s[k]].x[f];
      if (k < minLeaf || n - k < minLeaf || a === b) continue;
      var gl = gini(k - l1, l1), gr = gini(n - k - (tot1 - l1), tot1 - l1);
      var score = (k * gl + (n - k) * gr) / n; // weighted Gini of the two children
      if (score < parentG - 1e-12 && (!best || score < best.score - 1e-12)) best = { score: score, f: f, thr: (a + b) / 2 };
    }
    if (!best) return null;
    best.left = []; best.right = [];
    for (i = 0; i < n; i++) (pts[s[i]].x[f] <= best.thr ? best.left : best.right).push(s[i]);
    return best;
  }

  // rnd given => random-forest style: try ONE randomly chosen feature first (fall back to the other only if it cannot split)
  function buildTree(pts, idx, maxDepth, minLeaf, rnd) {
    var nodes = [], leaves = 0, maxD = 0;
    function grow(ix, depth, lo, hi, parent) {
      var c1 = 0;
      for (var i = 0; i < ix.length; i++) c1 += pts[ix[i]].y;
      var n = ix.length, c0 = n - c1;
      var node = { id: nodes.length, depth: depth, n: n, c0: c0, c1: c1, g: gini(c0, c1), pred: c1 > c0 ? 1 : 0, p1: n ? c1 / n : 0, leaf: true, lo: lo, hi: hi, parent: parent };
      nodes.push(node);
      if (depth > maxD) maxD = depth;
      var split = null;
      if (depth < maxDepth && node.g > 0 && n >= 2 * minLeaf) {
        var feats = rnd && rnd() < 0.5 ? [1, 0] : [0, 1];
        for (var fi = 0; fi < 2; fi++) {
          var sp = bestSplit(pts, ix, feats[fi], minLeaf, node.g);
          if (sp && (!split || sp.score < split.score - 1e-12)) split = sp;
          if (rnd && split) break;
        }
      }
      if (!split) { leaves++; return node; }
      node.leaf = false; node.f = split.f; node.thr = split.thr;
      var lhi = hi.slice(); lhi[split.f] = split.thr;
      var rlo = lo.slice(); rlo[split.f] = split.thr;
      node.left = grow(split.left, depth + 1, lo, lhi, node);
      node.right = grow(split.right, depth + 1, rlo, hi, node);
      return node;
    }
    var root = grow(idx, 0, DOM.lo.slice(), DOM.hi.slice(), null);
    return { root: root, nodes: nodes, leaves: leaves, depth: maxD };
  }
  function leafOf(tree, x) {
    var n = tree.root;
    while (!n.leaf) n = x[n.f] <= n.thr ? n.left : n.right;
    return n;
  }
  // How many trees vote "good" at the centre of every cell of a cols x rows grid (row 0 = hottest).
  // A tree's leaves tile the map, so instead of walking every tree for every cell we fill in each
  // "good" leaf's block of cells. Same answer as asking each tree cell by cell, but far less work.
  function voteGrid(trees, cols, rows) {
    var votes = new Uint8Array(cols * rows);
    var r0 = DOM.lo[0], rw = DOM.hi[0] - DOM.lo[0], t1 = DOM.hi[1], tw = DOM.hi[1] - DOM.lo[1];
    for (var k = 0; k < trees.length; k++) {
      var nodes = trees[k].nodes;
      for (var n = 0; n < nodes.length; n++) {
        var L = nodes[n];
        if (!L.leaf || !L.pred) continue;
        // a cell belongs to the leaf when lo < centre <= hi on both axes (x <= threshold goes left)
        var i0 = Math.max(0, Math.floor((L.lo[0] - r0) / rw * cols - 0.5) + 1);
        var i1 = Math.min(cols - 1, Math.floor((L.hi[0] - r0) / rw * cols - 0.5));
        var j0 = Math.max(0, Math.ceil((t1 - L.hi[1]) / tw * rows - 0.5));
        var j1 = Math.min(rows - 1, Math.ceil((t1 - L.lo[1]) / tw * rows - 0.5) - 1);
        for (var j = j0; j <= j1; j++) {
          var o = j * cols;
          for (var i = i0; i <= i1; i++) votes[o + i]++;
        }
      }
    }
    return votes;
  }
  function forestVote(trees, x) {
    var v = 0, s = 0, N = trees.length;
    for (var k = 0; k < N; k++) { var l = leafOf(trees[k], x); v += l.pred; s += l.p1; }
    var pred = v * 2 > N ? 1 : (v * 2 < N ? 0 : (s / N >= 0.5 ? 1 : 0));
    return { votes: v, n: N, pred: pred };
  }

  /* ---------- formatting ---------- */
  function fmtRain(v) { return (Math.round(v * 10) / 10).toLocaleString('en-IN', { maximumFractionDigits: 1 }) + ' mm'; }
  function fmtTemp(v) { return String(Math.round(v * 100) / 100) + ' °C'; }
  function fmtFeat(f, v) { return f === 0 ? fmtRain(v) : fmtTemp(v); }
  function pct(a) { return (a * 100).toFixed(1) + '%'; }
  function farms(n) { return n + (n === 1 ? ' farm' : ' farms'); }
  function tfarms(n) { return n + (n === 1 ? ' training farm' : ' training farms'); }
  function cls(y) { return y ? '<b style="color:var(--series-4)">good</b>' : '<b style="color:var(--series-2)">poor</b>'; }

  /* ---------- small DOM helpers ---------- */
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        var v = attrs[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === 'text') e.textContent = v;
        else if (k === 'html') e.innerHTML = v;
        else e.setAttribute(k, v === true ? '' : String(v));
      }
    }
    if (kids) for (var i = 0; i < kids.length; i++) if (kids[i]) e.appendChild(typeof kids[i] === 'string' ? document.createTextNode(kids[i]) : kids[i]);
    return e;
  }
  function sv(tag, attrs, text) {
    var e = document.createElementNS(SVGNS, tag);
    if (attrs) for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, String(attrs[k]));
    if (text !== undefined) e.textContent = text;
    return e;
  }

  var TASKS = [
    { id: 't1', text: 'Set Max depth to 1 and see a "stump": a tree that asks just one question, so it makes a single straight cut.' },
    { id: 't2', text: 'Try at least 4 different depths, then settle on the depth that gives the highest test accuracy.' },
    { id: 't3', text: 'Make the tree memorise noise: reach 100% train accuracy while test accuracy drops below its best.' },
    { id: 't4', text: 'Switch on the forest (5 or more trees) and beat the single tree\'s test accuracy at the same settings.' }
  ];

  function mount(root, api) {
    var id = 'lab-tree-' + (++uid);
    var destroyed = false;
    var st = { depth: 3, minLeaf: 1, nTrees: 15, forest: false, tap: 'inspect', mistakes: false, seed: 1 };
    var baseTrain = makeData(DATA_SEED, N_TRAIN);
    var test = makeData(DATA_SEED + 10000, N_TEST);
    var train = baseTrain.slice();
    var dataSig = 'base', dataVer = 0, added = 0;
    var visited = {};            // key "minLeaf|data" -> {depth: true}
    var sweep = null, sweepKey = '';
    var fcache = { key: '', trees: [] }, fstore = {}, fkeys = []; // small cache of recent forests
    var cur = { tree: null };
    var probe = null;            // {kind:'pt', set, i} | {kind:'loc', x} | {kind:'node', id}
    var note = '';               // one-off message for the readout
    var done = {};
    var raf = 0, dirtyHeat = true, diagramTree = null, diagramW = -1, treeBoxW = 0, lastColSig = '';
    var C = {};
    var W = 0, H = 0, P = { l: 50, r: 12, t: 12, b: 40, w: 0, h: 0 };
    var heatCanvas = document.createElement('canvas');
    var swatch = document.createElement('canvas').getContext('2d');

    /* ---------- build the DOM ---------- */
    root.innerHTML = '';
    var lab = h('div', { class: 'lab' });
    lab.appendChild(h('p', { class: 'lab-note', html:
      '<b>What you are seeing:</b> each dot is one farm\'s rice season, placed by how much rain fell (left to right) and how warm it was (bottom to top). ' +
      'A decision tree sorts farms by asking yes/no questions such as "Rain ≤ 1,000 mm?". Every question is a straight cut across the map, and each shaded box is a <i>leaf</i> (an end point of the tree) showing what it predicts there. ' +
      'The tree learns only from the filled dots (training farms). The rings are test farms kept aside to check how it does on farms it has never seen.' }));

    var body = h('div', { class: 'lab-body' });
    var left = h('div', { class: 'stack', style: 'gap:10px' });

    function icon(shape, filled, colVar) {
      var svg = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style="flex:none">' +
        (shape === 'circle' ? '<circle cx="6" cy="6" r="4.5"' : '<rect x="1.5" y="1.5" width="9" height="9"') +
        (filled ? ' style="fill:var(' + colVar + ')"/>' : ' style="fill:var(--surface);stroke:var(' + colVar + ');stroke-width:1.8"/>') + '</svg>';
      return svg;
    }
    var legendStyle = 'display:inline-flex;align-items:center;gap:5px';
    left.appendChild(h('div', { style: 'display:flex;flex-wrap:wrap;gap:6px 14px;font-size:.85rem;color:var(--muted)', html:
      '<span style="' + legendStyle + '">' + icon('circle', true, '--series-4') + 'Good harvest</span>' +
      '<span style="' + legendStyle + '">' + icon('square', true, '--series-2') + 'Poor harvest</span>' +
      '<span style="' + legendStyle + '">' + icon('circle', true, '--muted') + 'Training farm</span>' +
      '<span style="' + legendStyle + '">' + icon('circle', false, '--muted') + 'Test farm (hidden from the tree)</span>' }));

    var wrap = h('div', { class: 'lab-canvas-wrap' });
    var canvas = h('canvas', { role: 'img', tabindex: '0', style: 'outline-offset:-3px', 'aria-label': 'Map of farms: rainfall across, temperature up, with the tree\'s prediction boxes.' });
    wrap.appendChild(canvas);
    left.appendChild(wrap);
    var ctx = canvas.getContext('2d');

    var readout = h('p', { class: 'small', 'aria-live': 'polite', style: 'min-height:3.3em;margin:0' });
    left.appendChild(readout);

    var stats = h('div', { class: 'lab-stats', style: 'grid-template-columns:repeat(auto-fit,minmax(140px,1fr))' });
    function stat(k) { var v = h('div', { class: 'v', text: '–' }); stats.appendChild(h('div', { class: 'stat' }, [h('div', { class: 'k', text: k }), v])); return v; }
    var sTrain = stat('Train accuracy'), sTest = stat('Test accuracy'), sForest = stat('Forest test'), sLeaves = stat('Leaves');
    left.appendChild(stats);
    var coach = h('p', { class: 'callout small', style: 'margin:0' });
    left.appendChild(coach);
    body.appendChild(left);

    /* controls */
    // On wide screens the controls span two rows, so the tree panel (row 2, column 1) sits right under the map.
    // On narrow screens (one column) the tree panel simply follows the controls.
    var controls = h('div', { class: 'lab-controls', style: 'grid-row:span 2' });
    function seg(name, label, opts, value, onPick) {
      var lid = id + '-' + name + '-label';
      var group = h('div', { class: 'seg', role: 'group', 'aria-labelledby': lid });
      var btns = opts.map(function (o) {
        var b = h('button', { type: 'button', 'aria-pressed': o.v === value ? 'true' : 'false', text: o.t });
        b.addEventListener('click', function () {
          btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
          onPick(o.v);
        });
        group.appendChild(b);
        return b;
      });
      controls.appendChild(h('div', { class: 'control' }, [h('span', { class: 'control-label', id: lid, text: label }), group]));
      return btns;
    }
    function slider(name, label, min, max, value, hint) {
      var iid = id + '-' + name;
      var out = h('output', { for: iid, text: String(value) });
      var input = h('input', { type: 'range', id: iid, min: min, max: max, step: 1, value: value });
      var hintEl = hint ? h('span', { class: 'small muted', text: hint }) : null;
      var block = h('div', { class: 'control' }, [h('label', { for: iid }, [h('span', { text: label }), out]), input, hintEl]);
      controls.appendChild(block);
      return { input: input, out: out, block: block, hint: hintEl };
    }

    seg('model', 'Model', [{ v: 'tree', t: 'One tree' }, { v: 'forest', t: 'Forest of trees' }], 'tree', function (v) {
      st.forest = v === 'forest'; note = ''; syncForestControls(); invalidate();
    });
    var depthC = slider('depth', 'Max depth', 1, MAX_DEPTH, st.depth, 'How many questions in a row the tree may ask.');
    var leafC = slider('leaf', 'Min farms per leaf', 1, 20, st.minLeaf, 'Every leaf must hold at least this many training farms.');
    var treesC = slider('trees', 'Trees in the forest', 1, 25, st.nTrees, 'Switch on "Forest of trees" to use this.');
    seg('tap', 'Tapping the map', [{ v: 'inspect', t: 'Inspect' }, { v: 'good', t: 'Add good' }, { v: 'poor', t: 'Add poor' }], 'inspect', function (v) {
      st.tap = v; note = ''; canvas.style.cursor = v === 'inspect' ? '' : 'crosshair'; invalidate();
    });

    var mistakesId = id + '-mistakes';
    var mistakes = h('input', { type: 'checkbox', id: mistakesId });
    var btnReroll = h('button', { type: 'button', class: 'btn btn-sm', text: 'Re-roll forest' });
    var btnReset = h('button', { type: 'button', class: 'btn btn-sm', text: 'Reset farms' });
    controls.appendChild(h('div', { class: 'row', style: 'gap:8px 14px' }, [
      h('span', { style: 'display:inline-flex;align-items:center;gap:6px;font-size:.92rem;font-weight:600' }, [mistakes, h('label', { for: mistakesId, text: 'Ring mistakes' })]),
      h('span', { class: 'row', style: 'gap:8px' }, [btnReroll, btnReset])
    ]));

    var chartId = id + '-chart-label';
    var chart = sv('svg', { viewBox: '0 0 300 150', role: 'img', 'aria-labelledby': chartId, style: 'width:100%;height:auto;display:block;overflow:visible' });
    controls.appendChild(h('div', { class: 'control' }, [
      h('span', { class: 'control-label', id: chartId }, [h('span', { text: 'Your depth experiments' })]),
      h('span', { class: 'small muted', text: 'A dot appears for each depth you try (for this leaf size).' }),
      chart,
      h('div', { class: 'lab-legend', html: '<span style="--c:var(--series-1)">Train</span><span style="--c:var(--series-3)">Test</span><span style="--c:var(--series-4)">Forest test</span>' })
    ]));

    var taskList = h('ul', { class: 'lab-tasks' });
    var taskEls = {};
    TASKS.forEach(function (t) {
      var li = h('li', { text: t.text });
      if (api && api.isTaskDone && api.isTaskDone(t.id)) { li.className = 'done'; done[t.id] = true; }
      taskEls[t.id] = li;
      taskList.appendChild(li);
    });
    controls.appendChild(h('div', { class: 'control' }, [h('span', { class: 'control-label', text: 'Your tasks' }), taskList]));
    var live = h('div', { class: 'visually-hidden', 'aria-live': 'polite' });
    controls.appendChild(live);
    body.appendChild(controls);

    /* tree diagram panel */
    var treeHead = h('span', { class: 'small muted num' });
    var treeCap = h('p', { class: 'small muted', style: 'margin:0' });
    var treeBox = h('div', { style: 'border:1px solid var(--line);border-radius:var(--radius);background:var(--surface);overflow-x:auto;overflow-y:hidden;position:relative' });
    var treeSvg = sv('svg', { role: 'img', 'aria-label': 'Tree diagram' });
    treeSvg.style.display = 'block';
    treeSvg.style.maxWidth = 'none';
    treeBox.appendChild(treeSvg);
    body.appendChild(h('div', { class: 'stack-sm', style: 'grid-column:1' }, [
      h('div', { class: 'row-between' }, [h('h4', { text: 'Inside the tree' }), treeHead]),
      treeCap,
      treeBox
    ]));
    lab.appendChild(body);
    lab.appendChild(h('p', { class: 'lab-note', html: '<b>Why it matters in real ML:</b> trees and forests of trees (and boosted trees such as XGBoost) are still the first choice for table data like loan, crop-insurance and fraud records, and limiting depth is exactly how engineers stop them memorising noise.' }));
    root.appendChild(lab);

    /* ---------- colours (read from CSS variables at draw time) ---------- */
    function toRGB(str) {
      swatch.fillStyle = 'black'; // reset so an unparseable value can't keep the previous colour
      swatch.fillStyle = str;
      var s = swatch.fillStyle;
      if (s.charAt(0) === '#') return [parseInt(s.substr(1, 2), 16), parseInt(s.substr(3, 2), 16), parseInt(s.substr(5, 2), 16)];
      var m = s.match(/[\d.]+/g) || [0, 0, 0];
      return [+m[0], +m[1], +m[2]];
    }
    function readColors() {
      var cs = getComputedStyle(document.documentElement);
      function v(name, fb) { var s = cs.getPropertyValue(name).trim(); return s || fb; }
      // fallbacks are CSS system colours (theme-aware), only used if the stylesheet is missing
      C.surface = v('--surface', 'Canvas'); C.surface2 = v('--surface-2', 'Canvas'); C.ink = v('--ink', 'CanvasText');
      C.muted = v('--muted', 'GrayText'); C.line = v('--line', 'GrayText'); C.haldi = v('--haldi', 'Highlight');
      C.good = v('--series-4', 'CanvasText'); C.poor = v('--series-2', 'GrayText');
      var sig = [C.surface, C.ink, C.good, C.poor].join('|');
      if (sig !== lastColSig) {
        lastColSig = sig;
        C.sRGB = toRGB(C.surface); C.gRGB = toRGB(C.good); C.pRGB = toRGB(C.poor);
        dirtyHeat = true;
      }
      C.font = getComputedStyle(root).fontFamily || 'system-ui, sans-serif';
    }
    function mix(c, a) {
      var s = C.sRGB;
      return 'rgb(' + Math.round(s[0] + (c[0] - s[0]) * a) + ',' + Math.round(s[1] + (c[1] - s[1]) * a) + ',' + Math.round(s[2] + (c[2] - s[2]) * a) + ')';
    }

    /* ---------- model ---------- */
    function keyBase() { return st.minLeaf + '|' + dataSig; }
    function forestTrees() {
      var key = st.depth + '|' + st.minLeaf + '|' + st.seed + '|' + dataSig;
      if (fcache.key !== key) {
        if (!fstore[key]) {
          fstore[key] = [];
          fkeys.push(key);
          if (fkeys.length > 12) delete fstore[fkeys.shift()];
        }
        fcache.key = key; fcache.trees = fstore[key];
      }
      while (fcache.trees.length < st.nTrees) {
        var i = fcache.trees.length;
        var rnd = mulberry32(st.seed * 7919 + i * 104729 + 13);
        var idx = [];
        for (var j = 0; j < train.length; j++) idx.push(Math.floor(rnd() * train.length)); // bootstrap sample (draw with replacement)
        fcache.trees.push(buildTree(train, idx, st.depth, st.minLeaf, rnd));
      }
      return fcache.trees.slice(0, st.nTrees);
    }
    function accTree(tree, pts) {
      var c = 0;
      for (var i = 0; i < pts.length; i++) if (leafOf(tree, pts[i].x).pred === pts[i].y) c++;
      return pts.length ? c / pts.length : 0;
    }
    function recompute() {
      var k = keyBase();
      if (k !== sweepKey) {
        sweepKey = k;
        var all = [];
        for (var i = 0; i < train.length; i++) all.push(i);
        sweep = [];
        for (var d = 1; d <= MAX_DEPTH; d++) {
          var t = buildTree(train, all, d, st.minLeaf, null);
          sweep.push({ tree: t, tr: accTree(t, train), te: accTree(t, test) });
        }
      }
      var s = sweep[st.depth - 1];
      if (cur.tree !== s.tree && probe && probe.kind === 'node') probe = null;
      cur.tree = s.tree; cur.tr = s.tr; cur.te = s.te;
      cur.bestTe = 0;
      for (var j = 0; j < sweep.length; j++) cur.bestTe = Math.max(cur.bestTe, sweep[j].te);
      if (!visited[k]) visited[k] = {};
      visited[k][st.depth] = true;
      if (st.forest) {
        var trees = forestTrees();
        cur.trees = trees;
        var c1 = 0, c2 = 0;
        cur.trainPred = train.map(function (p) { var v = forestVote(trees, p.x).pred; if (v === p.y) c1++; return v; });
        cur.testPred = test.map(function (p) { var v = forestVote(trees, p.x).pred; if (v === p.y) c2++; return v; });
        cur.ftr = c1 / train.length; cur.fte = c2 / test.length;
        var hk = fcache.key + '|' + st.nTrees;
        if (hk !== cur.heatKey) { cur.heatKey = hk; dirtyHeat = true; }
      } else {
        cur.trees = null;
        cur.trainPred = train.map(function (p) { return leafOf(cur.tree, p.x).pred; });
        cur.testPred = test.map(function (p) { return leafOf(cur.tree, p.x).pred; });
      }
    }

    /* ---------- tasks ---------- */
    function complete(tid) {
      if (done[tid]) return;
      done[tid] = true;
      taskEls[tid].className = 'done';
      var t = TASKS.filter(function (x) { return x.id === tid; })[0];
      live.textContent = 'Task done: ' + t.text;
      if (api && api.onTaskDone) api.onTaskDone(tid);
    }
    function visitedCount() { var v = visited[keyBase()] || {}; return Object.keys(v).length; }
    function checkTasks() {
      if (!st.forest && st.depth === 1 && cur.tree.nodes.length === 3) complete('t1');
      if (visitedCount() >= 4 && cur.te >= cur.bestTe - 1e-9) complete('t2');
      if (cur.tr === 1 && cur.te < cur.bestTe - 1e-9) complete('t3');
      if (st.forest && st.nTrees >= 5 && cur.fte > cur.te + 1e-9) complete('t4');
    }

    /* ---------- geometry ---------- */
    function X(r) { return P.l + (r - DOM.lo[0]) / (DOM.hi[0] - DOM.lo[0]) * P.w; }
    function Y(t) { return P.t + P.h - (t - DOM.lo[1]) / (DOM.hi[1] - DOM.lo[1]) * P.h; }
    function invX(px) { return DOM.lo[0] + (px - P.l) / P.w * (DOM.hi[0] - DOM.lo[0]); }
    function invY(py) { return DOM.lo[1] + (P.t + P.h - py) / P.h * (DOM.hi[1] - DOM.lo[1]); }
    function small() { return W < 480; }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      W = Math.max(1, rect.width); H = Math.max(1, rect.height);
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
      P.l = small() ? 40 : 50; P.b = small() ? 36 : 42; P.t = 10; P.r = small() ? 10 : 14;
      P.w = Math.max(10, W - P.l - P.r); P.h = Math.max(10, H - P.t - P.b);
      dirtyHeat = true;
    }

    /* ---------- forest heatmap (coarse cells, smoothed when scaled up) ---------- */
    function renderHeat() {
      // keep the flag set while the forest is off, so a theme change or resize in the meantime
      // still repaints the heatmap the next time the forest is switched on
      if (!st.forest || !cur.trees) return;
      dirtyHeat = false;
      var cell = 5;
      var cols = Math.max(2, Math.ceil(P.w / cell)), rows = Math.max(2, Math.ceil(P.h / cell));
      heatCanvas.width = cols; heatCanvas.height = rows;
      var hc = heatCanvas.getContext('2d');
      var img = hc.createImageData(cols, rows), d = img.data;
      var N = cur.trees.length, s = C.sRGB;
      var votes = voteGrid(cur.trees, cols, rows);
      for (var j = 0; j < rows; j++) {
        for (var i = 0; i < cols; i++) {
          var p = votes[j * cols + i] / N;
          var a = p === 0.5 ? 0 : 0.07 + 0.35 * Math.pow(Math.abs(2 * p - 1), 0.8);
          var c = p >= 0.5 ? C.gRGB : C.pRGB;
          var o = (j * cols + i) * 4;
          d[o] = s[0] + (c[0] - s[0]) * a; d[o + 1] = s[1] + (c[1] - s[1]) * a; d[o + 2] = s[2] + (c[2] - s[2]) * a; d[o + 3] = 255;
        }
      }
      hc.putImageData(img, 0, 0);
    }

    /* ---------- probe (what the learner is pointing at) ---------- */
    function probeX() {
      if (!probe) return null;
      if (probe.kind === 'pt') { var arr = probe.set === 'train' ? train : test; return arr[probe.i] ? arr[probe.i].x : null; }
      if (probe.kind === 'loc') return probe.x;
      return null;
    }
    function probeNode() {
      if (!probe) return null;
      if (probe.kind === 'node') return cur.tree.nodes[probe.id] || null;
      var x = probeX();
      return x ? leafOf(cur.tree, x) : null;
    }

    /* ---------- drawing the map ---------- */
    function drawPoint(x, y, y1, filled, R) {
      var col = y1 ? C.good : C.poor, S = R * 0.88;
      ctx.beginPath();
      if (y1) ctx.arc(x, y, R, 0, Math.PI * 2); else ctx.rect(x - S, y - S, 2 * S, 2 * S);
      if (filled) { ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = C.surface; ctx.stroke(); }
      else { ctx.fillStyle = C.surface; ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = col; ctx.stroke(); }
    }
    function draw() {
      var i, n, tree = cur.tree;
      ctx.fillStyle = C.surface;
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.beginPath(); ctx.rect(P.l, P.t, P.w, P.h); ctx.clip();
      if (st.forest && cur.trees) {
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(heatCanvas, P.l, P.t, P.w, P.h);
      } else {
        for (i = 0; i < tree.nodes.length; i++) {
          n = tree.nodes[i];
          if (!n.leaf) continue;
          var conf = Math.abs(2 * n.p1 - 1);
          ctx.fillStyle = mix(n.pred ? C.gRGB : C.pRGB, 0.1 + 0.28 * conf);
          ctx.fillRect(X(n.lo[0]), Y(n.hi[1]), X(n.hi[0]) - X(n.lo[0]), Y(n.lo[1]) - Y(n.hi[1]));
        }
      }
      // split lines of the single tree (dashed and faint when the forest is shown)
      ctx.strokeStyle = C.ink;
      if (st.forest) { ctx.setLineDash([4, 4]); ctx.globalAlpha = 0.3; }
      for (i = 0; i < tree.nodes.length; i++) {
        n = tree.nodes[i];
        if (n.leaf) continue;
        if (!st.forest) ctx.globalAlpha = Math.max(0.35, 0.8 - n.depth * 0.07);
        ctx.lineWidth = st.forest ? 1 : Math.max(1, 2.6 - n.depth * 0.3);
        ctx.beginPath();
        if (n.f === 0) { ctx.moveTo(X(n.thr), Y(n.hi[1])); ctx.lineTo(X(n.thr), Y(n.lo[1])); }
        else { ctx.moveTo(X(n.lo[0]), Y(n.thr)); ctx.lineTo(X(n.hi[0]), Y(n.thr)); }
        ctx.stroke();
      }
      ctx.setLineDash([]); ctx.globalAlpha = 1;
      // highlighted leaf / node box
      var hn = probeNode();
      if (hn && (!st.forest || probe.kind === 'node')) {
        ctx.strokeStyle = C.haldi; ctx.lineWidth = 3;
        if (st.forest) ctx.setLineDash([6, 4]);
        var x0 = X(hn.lo[0]), x1 = X(hn.hi[0]), y0 = Y(hn.hi[1]), y1 = Y(hn.lo[1]);
        ctx.strokeRect(x0 + 1.5, y0 + 1.5, Math.max(1, x1 - x0 - 3), Math.max(1, y1 - y0 - 3));
        ctx.setLineDash([]);
      }
      ctx.restore();

      // axes
      var fs = small() ? 11 : 12;
      ctx.strokeStyle = C.line; ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(P.l) + 0.5, Math.round(P.t) + 0.5, Math.round(P.w) - 1, Math.round(P.h) - 1);
      ctx.fillStyle = C.muted; ctx.font = fs + 'px ' + C.font; ctx.textBaseline = 'top'; ctx.textAlign = 'center';
      var v;
      for (v = 200; v <= 2200; v += 400) {
        var tx = X(v);
        ctx.beginPath(); ctx.moveTo(tx, P.t + P.h); ctx.lineTo(tx, P.t + P.h + 4); ctx.stroke();
        ctx.textAlign = v === 200 ? 'left' : (v === 2200 ? 'right' : 'center');
        ctx.fillText(v.toLocaleString('en-IN'), v === 200 ? tx - 2 : (v === 2200 ? tx + 2 : tx), P.t + P.h + 6);
      }
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (v = 15; v <= 40; v += 5) {
        var ty = Y(v);
        ctx.beginPath(); ctx.moveTo(P.l - 4, ty); ctx.lineTo(P.l, ty); ctx.stroke();
        ctx.fillText(String(v), P.l - 6, ty);
      }
      ctx.font = '600 ' + fs + 'px ' + C.font; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('Rainfall in the season (mm)', P.l + P.w / 2, H - 3);
      ctx.save();
      ctx.translate(small() ? 11 : 13, P.t + P.h / 2); ctx.rotate(-Math.PI / 2);
      ctx.textBaseline = 'middle';
      ctx.fillText('Temperature (°C)', 0, 0);
      ctx.restore();

      // points: test rings first, training dots on top
      var R = small() ? 3.6 : 4.6;
      for (i = 0; i < test.length; i++) drawPoint(X(test[i].x[0]), Y(test[i].x[1]), test[i].y, false, R);
      for (i = 0; i < train.length; i++) drawPoint(X(train[i].x[0]), Y(train[i].x[1]), train[i].y, true, R);
      if (st.mistakes) {
        ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4; ctx.setLineDash([2.5, 2]);
        var mark = function (arr, preds) {
          for (var q = 0; q < arr.length; q++) {
            if (preds[q] === arr[q].y) continue;
            ctx.beginPath(); ctx.arc(X(arr[q].x[0]), Y(arr[q].x[1]), R + 4.5, 0, Math.PI * 2); ctx.stroke();
          }
        };
        mark(train, cur.trainPred); mark(test, cur.testPred);
        ctx.setLineDash([]);
      }
      // probe marker
      var px = probeX();
      if (px) {
        var cx = X(px[0]), cy = Y(px[1]);
        ctx.strokeStyle = C.haldi; ctx.lineWidth = 3;
        if (probe.kind === 'pt') { ctx.beginPath(); ctx.arc(cx, cy, R + 5, 0, Math.PI * 2); ctx.stroke(); }
        else {
          ctx.beginPath(); ctx.moveTo(cx - 7, cy); ctx.lineTo(cx + 7, cy); ctx.moveTo(cx, cy - 7); ctx.lineTo(cx, cy + 7); ctx.stroke();
        }
      }
    }

    /* ---------- tree diagram (SVG, colours via CSS variables so it follows the theme) ---------- */
    var LSP = 74, LV = 56, PADX = 14, PADY = 14, IW = 124, IH = 38, LW = 64, LH = 50;
    var nodeEls = [], edgeEls = [], diagramPath = [], diagramScale = 1, diagramWide = false, rootScroll = -1;
    function nodeStyle(n, hot) {
      if (n.leaf) {
        var col = n.pred ? 'var(--series-4)' : 'var(--series-2)';
        return 'fill:' + col + ';fill-opacity:.15;stroke:' + (hot ? 'var(--haldi)' : col) + ';stroke-width:' + (hot ? 3 : 1.2);
      }
      return 'fill:var(--surface-2);stroke:' + (hot ? 'var(--haldi)' : 'var(--line)') + ';stroke-width:' + (hot ? 3 : 1);
    }
    function edgeStyle(hot) { return 'fill:none;stroke:' + (hot ? 'var(--haldi)' : 'var(--line)') + ';stroke-width:' + (hot ? 3 : 1.5); }
    function buildDiagram() {
      var tree = cur.tree;
      diagramTree = tree;
      var boxW = treeBoxW || 600;
      diagramW = treeBoxW;
      var natural = tree.leaves * LSP + PADX * 2;
      // shrink a little to fit when possible, but never below 85% so the text stays readable (wider trees scroll sideways)
      var sc = natural <= boxW ? 1 : Math.max(0.85, boxW / natural);
      diagramScale = sc;
      var w = Math.max(natural, boxW / sc);
      var off = (w - tree.leaves * LSP) / 2, k = 0;
      (function place(n) {
        if (n.leaf) { n.dx = off + k * LSP + LSP / 2; k++; }
        else { place(n.left); place(n.right); n.dx = (n.left.dx + n.right.dx) / 2; }
        n.dy = PADY + n.depth * LV;
      })(tree.root);
      var hgt = PADY * 2 + tree.depth * LV + LH;
      while (treeSvg.firstChild) treeSvg.removeChild(treeSvg.firstChild);
      treeSvg.setAttribute('width', Math.floor(w * sc)); treeSvg.setAttribute('height', Math.ceil(hgt * sc));
      diagramWide = Math.floor(w * sc) > boxW + 1;
      treeSvg.setAttribute('viewBox', '0 0 ' + w + ' ' + hgt);
      nodeEls = []; edgeEls = []; diagramPath = [];
      var gEdges = sv('g'), gNodes = sv('g');
      treeSvg.appendChild(gEdges); treeSvg.appendChild(gNodes);
      tree.nodes.forEach(function (n) {
        if (n.parent) {
          var p = n.parent, x1 = p.dx, y1 = p.dy + IH, x2 = n.dx, y2 = n.dy;
          var path = sv('path', { d: 'M' + x1 + ' ' + y1 + ' C' + x1 + ' ' + (y1 + 14) + ' ' + x2 + ' ' + (y2 - 14) + ' ' + x2 + ' ' + y2, style: edgeStyle(false) });
          gEdges.appendChild(path);
          edgeEls[n.id] = path;
          var isLeft = p.left === n;
          gEdges.appendChild(sv('text', { x: x1 + (x2 - x1) * 0.3 + (isLeft ? -4 : 4), y: y1 + (y2 - y1) * 0.42, 'text-anchor': isLeft ? 'end' : 'start', style: 'fill:var(--muted);font-size:10px' }, isLeft ? 'yes' : 'no'));
        }
        var bw = n.leaf ? LW : IW, bh = n.leaf ? LH : IH;
        var g = sv('g', { 'data-id': n.id, style: 'cursor:pointer' });
        var rect = sv('rect', { x: n.dx - bw / 2, y: n.dy, width: bw, height: bh, rx: 6, style: nodeStyle(n, false) });
        g.appendChild(rect);
        nodeEls[n.id] = rect;
        if (n.leaf) {
          g.appendChild(sv('text', { x: n.dx, y: n.dy + 15, 'text-anchor': 'middle', style: 'font-size:11.5px;font-weight:700;fill:' + (n.pred ? 'var(--series-4)' : 'var(--series-2)') }, n.pred ? 'Good' : 'Poor'));
          g.appendChild(sv('text', { x: n.dx, y: n.dy + 29, 'text-anchor': 'middle', style: 'font-size:10.5px;fill:var(--ink)' }, 'n=' + n.n));
          g.appendChild(sv('text', { x: n.dx, y: n.dy + 42, 'text-anchor': 'middle', style: 'font-size:10.5px;fill:var(--muted)' }, 'Gini ' + n.g.toFixed(2)));
        } else {
          g.appendChild(sv('text', { x: n.dx, y: n.dy + 16, 'text-anchor': 'middle', style: 'font-size:11.5px;font-weight:600;fill:var(--ink)' }, (n.f === 0 ? 'Rain ≤ ' : 'Temp ≤ ') + fmtFeat(n.f, n.thr)));
          g.appendChild(sv('text', { x: n.dx, y: n.dy + 30, 'text-anchor': 'middle', style: 'font-size:10.5px;fill:var(--muted)' }, 'Gini ' + n.g.toFixed(2) + ' · n=' + n.n));
        }
        var tip = sv('title', null, n.leaf ? ('Leaf: ' + n.c1 + ' good, ' + n.c0 + ' poor training farms') : ('Question: is ' + (n.f === 0 ? 'rain' : 'temperature') + ' ≤ ' + fmtFeat(n.f, n.thr) + '? ' + n.c1 + ' good, ' + n.c0 + ' poor farms reach here'));
        g.appendChild(tip);
        gNodes.appendChild(g);
      });
      treeSvg.setAttribute('aria-label', 'Tree diagram with ' + tree.leaves + ' leaves and depth ' + tree.depth + '. ' +
        (tree.root.leaf ? 'The tree has no questions yet.' : 'First question: is ' + (tree.root.f === 0 ? 'rain' : 'temperature') + ' at most ' + fmtFeat(tree.root.f, tree.root.thr) + '?'));
      // start with the top of the tree in view
      rootScroll = Math.max(0, tree.root.dx * sc - boxW / 2); // applied at the end of the frame (one layout pass)
    }
    function updateDiagramHighlight() {
      var i;
      for (i = 0; i < diagramPath.length; i++) {
        var on = cur.tree.nodes[diagramPath[i]];
        if (nodeEls[on.id]) nodeEls[on.id].setAttribute('style', nodeStyle(on, false));
        if (edgeEls[on.id]) edgeEls[on.id].setAttribute('style', edgeStyle(false));
      }
      diagramPath = [];
      var n = probeNode();
      var target = n;
      while (n) { diagramPath.push(n.id); n = n.parent; }
      for (i = 0; i < diagramPath.length; i++) {
        var hn = cur.tree.nodes[diagramPath[i]];
        if (nodeEls[hn.id]) nodeEls[hn.id].setAttribute('style', nodeStyle(hn, true));
        if (edgeEls[hn.id]) edgeEls[hn.id].setAttribute('style', edgeStyle(true));
      }
      return target;
    }
    // Scroll the diagram (only reads/writes layout once, after all DOM updates of the frame)
    function scrollDiagramTo(target) {
      if (rootScroll >= 0) { treeBox.scrollLeft = rootScroll; rootScroll = -1; }
      if (!target || !diagramWide) return;
      var bw = treeBoxW || 600, tx = target.dx * diagramScale, sl = treeBox.scrollLeft;
      if (tx - 50 < sl || tx + 50 > sl + bw) treeBox.scrollLeft = tx - bw / 2;
    }

    /* ---------- depth experiment chart ---------- */
    function drawChart() {
      while (chart.firstChild) chart.removeChild(chart.firstChild);
      var Wc = 300, Hc = 150, l = 38, r = 10, t = 8, b = 30;
      var vis = visited[keyBase()] || {};
      var ds = Object.keys(vis).map(Number).sort(function (a, c) { return a - c; });
      var vals = [];
      ds.forEach(function (d) { vals.push(sweep[d - 1].tr, sweep[d - 1].te); });
      if (st.forest) vals.push(cur.fte);
      var lo = Math.min.apply(null, vals.concat([0.6]));
      var yMin = Math.min(0.5, Math.floor(lo * 10) / 10);
      function cx(d) { return l + (d - 1) / (MAX_DEPTH - 1) * (Wc - l - r); }
      function cy(a) { return t + (1 - (a - yMin) / (1 - yMin)) * (Hc - t - b); }
      chart.appendChild(sv('rect', { x: cx(st.depth) - 11, y: t - 4, width: 22, height: Hc - t - b + 8, rx: 5, style: 'fill:var(--indigo-soft)' }));
      for (var g = yMin; g <= 1.0001; g += 0.1) {
        var gy = cy(g);
        chart.appendChild(sv('line', { x1: l, x2: Wc - r, y1: gy, y2: gy, style: 'stroke:var(--line);stroke-width:1' }));
        chart.appendChild(sv('text', { x: l - 6, y: gy + 3.5, 'text-anchor': 'end', style: 'fill:var(--muted);font-size:10px' }, Math.round(g * 100) + '%'));
      }
      for (var d = 1; d <= MAX_DEPTH; d++) {
        chart.appendChild(sv('text', { x: cx(d), y: Hc - b + 15, 'text-anchor': 'middle', style: 'fill:' + (d === st.depth ? 'var(--ink)' : 'var(--muted)') + ';font-size:10.5px;font-weight:' + (d === st.depth ? 700 : 400) }, String(d)));
      }
      chart.appendChild(sv('text', { x: (l + Wc - r) / 2, y: Hc - 2, 'text-anchor': 'middle', style: 'fill:var(--muted);font-size:10px' }, 'max depth'));
      function series(key, colVar) {
        if (!ds.length) return;
        var pts = ds.map(function (dd) { return cx(dd) + ',' + cy(sweep[dd - 1][key]); }).join(' ');
        if (ds.length > 1) chart.appendChild(sv('polyline', { points: pts, style: 'fill:none;stroke:' + colVar + ';stroke-width:2;stroke-linejoin:round' }));
        ds.forEach(function (dd) { chart.appendChild(sv('circle', { cx: cx(dd), cy: cy(sweep[dd - 1][key]), r: 3.6, style: 'fill:' + colVar + ';stroke:var(--surface);stroke-width:1.2' })); });
      }
      series('tr', 'var(--series-1)');
      series('te', 'var(--series-3)');
      if (st.forest) {
        var fx = cx(st.depth), fy = cy(cur.fte);
        chart.appendChild(sv('path', { d: 'M' + fx + ' ' + (fy - 5.5) + ' L' + (fx + 5.5) + ' ' + fy + ' L' + fx + ' ' + (fy + 5.5) + ' L' + (fx - 5.5) + ' ' + fy + ' Z', style: 'fill:var(--series-4);stroke:var(--surface);stroke-width:1.2' }));
      }
      var desc = ds.map(function (dd) { return 'depth ' + dd + ': train ' + pct(sweep[dd - 1].tr) + ', test ' + pct(sweep[dd - 1].te); }).join('; ');
      chart.setAttribute('aria-label', 'Accuracy for each depth tried. ' + desc + (st.forest ? '; forest test ' + pct(cur.fte) : ''));
    }

    /* ---------- text panels ---------- */
    function regionText(n) {
      var parts = [];
      for (var f = 0; f < 2; f++) {
        var nm = f === 0 ? 'rain' : 'temperature';
        var hasLo = n.lo[f] > DOM.lo[f], hasHi = n.hi[f] < DOM.hi[f];
        if (hasLo && hasHi) parts.push(nm + ' between ' + fmtFeat(f, n.lo[f]) + ' and ' + fmtFeat(f, n.hi[f]));
        else if (hasLo) parts.push(nm + ' above ' + fmtFeat(f, n.lo[f]));
        else if (hasHi) parts.push(nm + ' up to ' + fmtFeat(f, n.hi[f]));
      }
      return parts.length ? parts.join(' and ') : 'every farm';
    }
    function updateReadout() {
      var html;
      if (note) html = note;
      else if (!probe) {
        if (st.tap !== 'inspect') html = 'Tap the map to add a <b>' + (st.tap === 'good' ? 'good' : 'poor') + '-harvest</b> training farm. Watch the tree re-grow around it.';
        else if (st.forest) html = 'The colour now shows the forest\'s vote: strong colour means most of the ' + st.nTrees + ' trees agree, pale means they disagree. Dashed lines are the single tree\'s cuts, for comparison.';
        else html = 'Hover over (or tap) any dot to see which leaf it lands in. You can also click the map and use the arrow keys to step through farms.';
      } else if (probe.kind === 'node') {
        var nn = cur.tree.nodes[probe.id];
        html = nn.leaf
          ? 'This leaf covers ' + regionText(nn) + '. It holds ' + tfarms(nn.n) + ' (' + nn.c1 + ' good, ' + nn.c0 + ' poor), Gini ' + nn.g.toFixed(2) + ', so it predicts ' + cls(nn.pred) + '.'
          : 'This box asks: is ' + (nn.f === 0 ? 'rain' : 'temperature') + ' ≤ ' + fmtFeat(nn.f, nn.thr) + '? ' + tfarms(nn.n) + (nn.n === 1 ? ' reaches' : ' reach') + ' it (' + nn.c1 + ' good, ' + nn.c0 + ' poor, Gini ' + nn.g.toFixed(2) + '). Yes goes left, no goes right.';
      } else {
        var x = probeX(), leaf = leafOf(cur.tree, x);
        var where = fmtRain(x[0]) + ' of rain, ' + fmtTemp(x[1]);
        var treeSays = 'leaf of ' + farms(leaf.n) + ' (Gini ' + leaf.g.toFixed(2) + ') that says ' + cls(leaf.pred);
        var fv = st.forest ? forestVote(cur.trees, x) : null;
        if (probe.kind === 'pt') {
          var p = (probe.set === 'train' ? train : test)[probe.i];
          var kind = probe.set === 'train' ? (p.added ? 'Farm you added' : 'Training farm') : 'Test farm (never seen by the tree)';
          var pred = fv ? fv.pred : leaf.pred;
          html = '<b>' + kind + '</b>: ' + where + ', real harvest ' + cls(p.y) + '. ' +
            (fv ? 'Forest: ' + fv.votes + ' of ' + fv.n + ' trees vote good, so it says ' + cls(fv.pred) + '. (The single tree sends it to a ' + treeSays + '.)'
              : 'The tree sends it to a ' + treeSays + '.') +
            (pred === p.y ? ' Correct.' : ' <b style="color:var(--bad)">Wrong.</b>');
        } else {
          html = 'At ' + where + ': ' + (fv ? 'forest says ' + cls(fv.pred) + ' (' + fv.votes + ' of ' + fv.n + ' trees vote good); the single tree uses a ' + treeSays + '.' : 'the tree uses a ' + treeSays + '.');
        }
      }
      if (readout.innerHTML !== html) readout.innerHTML = html;
    }
    function updateStats() {
      sTrain.textContent = pct(cur.tr);
      sTest.textContent = pct(cur.te);
      if (st.forest) {
        sForest.textContent = pct(cur.fte);
        sForest.style.color = cur.fte > cur.te + 1e-9 ? 'var(--ok)' : (cur.fte < cur.te - 1e-9 ? 'var(--bad)' : '');
      } else { sForest.textContent = 'off'; sForest.style.color = 'var(--muted)'; }
      sLeaves.textContent = String(cur.tree.leaves);
      var msg;
      if (st.forest) {
        if (st.nTrees === 1) msg = 'A forest of one tree is just one tree trained on a random re-sample of the farms. Add more trees and watch the vote smooth out the blocky edges.';
        else if (cur.fte > cur.te + 1e-9) msg = 'The forest wins: <b>' + pct(cur.fte) + '</b> on test farms vs ' + pct(cur.te) + ' for one tree. Each of the ' + st.nTrees + ' trees learns from a bootstrap sample (farms picked at random, with repeats) and picks a random feature at each split, so they make different mistakes, and the vote cancels many of them out.';
        else msg = 'Here the forest does not beat the single tree (' + pct(cur.fte) + ' vs ' + pct(cur.te) + '). Try a deeper tree, more trees, or press Re-roll forest.';
      } else if (st.depth === 1) {
        msg = 'Depth 1 is a <b>stump</b>: one question (' + (cur.tree.root.leaf ? 'none possible' : (cur.tree.root.f === 0 ? 'Rain' : 'Temp') + ' ≤ ' + fmtFeat(cur.tree.root.f, cur.tree.root.thr)) + '), so one straight cut. Simple, but it misses a lot.';
      } else if (cur.tr === 1 && cur.te < cur.bestTe - 1e-9) {
        msg = '<b>Overfitting:</b> train accuracy is 100% but test accuracy fell to ' + pct(cur.te) + '. The tree has drawn tiny boxes around unlucky farms (pests, floods) and memorised that noise instead of the real pattern.';
      } else if (visitedCount() >= 4 && cur.te >= cur.bestTe - 1e-9) {
        msg = 'For this leaf size, depth ' + st.depth + ' gives the best test accuracy (' + pct(cur.te) + '). Deeper trees fit the training farms better but do worse on new farms.';
      } else if (cur.tr - cur.te > 0.12) {
        msg = 'Train ' + pct(cur.tr) + ' vs test ' + pct(cur.te) + ': the big gap means the tree is fitting farms it has seen much better than new ones.';
      } else {
        msg = 'Move <b>Max depth</b> and watch both accuracies. Train accuracy keeps climbing as the tree grows; test accuracy climbs, then falls.';
      }
      if (coach.innerHTML !== msg) coach.innerHTML = msg;
      treeHead.textContent = cur.tree.leaves + ' leaves · depth ' + cur.tree.depth;
      treeCap.textContent = (st.forest ? 'This is the single tree, shown for comparison (the map shows the forest\'s vote). ' : '') +
        'Each box asks a yes/no question: yes goes left, no goes right. n = training farms that reach the box. Gini impurity = how mixed they are (0 = all one kind, 0.5 = half and half). Hover a box to light up its area on the map.' +
        (diagramWide ? ' This tree is wider than the box: scroll sideways to see all of it.' : '');
      canvas.setAttribute('aria-label', 'Map of ' + (train.length + test.length) + ' farms: rainfall across, temperature up. ' +
        (st.forest ? 'Shaded by the vote of ' + st.nTrees + ' trees; forest test accuracy ' + pct(cur.fte) + '.' : 'Shaded boxes are the ' + cur.tree.leaves + ' leaves of a depth ' + cur.tree.depth + ' tree; test accuracy ' + pct(cur.te) + '.'));
    }
    function syncForestControls() {
      treesC.input.disabled = !st.forest;
      btnReroll.disabled = !st.forest;
      treesC.block.style.opacity = st.forest ? '' : '0.6';
      treesC.hint.textContent = st.forest ? 'Each tree learns from a random re-sample of the farms, then they vote.' : 'Switch on "Forest of trees" to use this.';
    }

    /* ---------- frame loop (runs only when something changed) ---------- */
    var scrollDiagram = false;
    function frame() {
      raf = 0;
      if (destroyed) return;
      readColors();
      recompute();
      if (dirtyHeat) renderHeat();
      draw();
      var rebuilt = false;
      if (diagramTree !== cur.tree || Math.abs(treeBoxW - diagramW) > 1) { buildDiagram(); rebuilt = true; }
      var target = updateDiagramHighlight();
      drawChart();
      updateStats();
      updateReadout();
      checkTasks();
      scrollDiagramTo(scrollDiagram || rebuilt ? target : null); // keep the lit-up path in view
      scrollDiagram = false;
    }
    function invalidate() { if (!raf && !destroyed) raf = requestAnimationFrame(frame); }

    /* ---------- events ---------- */
    function onDepth() { st.depth = +depthC.input.value; depthC.out.textContent = String(st.depth); note = ''; invalidate(); }
    function onLeaf() { st.minLeaf = +leafC.input.value; leafC.out.textContent = String(st.minLeaf); note = ''; invalidate(); }
    function onTrees() { st.nTrees = +treesC.input.value; treesC.out.textContent = String(st.nTrees); invalidate(); }
    depthC.input.addEventListener('input', onDepth);
    leafC.input.addEventListener('input', onLeaf);
    treesC.input.addEventListener('input', onTrees);
    mistakes.addEventListener('change', function () { st.mistakes = mistakes.checked; invalidate(); });
    btnReroll.addEventListener('click', function () { st.seed++; note = ''; invalidate(); });
    btnReset.addEventListener('click', function () {
      train = baseTrain.slice(); dataSig = 'base'; added = 0; probe = null; note = 'Farms reset to the original data.'; invalidate();
    });

    function localPos(e) { var r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    function inPlot(p) { return p[0] >= P.l && p[0] <= P.l + P.w && p[1] >= P.t && p[1] <= P.t + P.h; }
    function nearest(p, maxD) {
      var best = null, bd = maxD * maxD;
      function scan(arr, set) {
        for (var i = 0; i < arr.length; i++) {
          var dx = X(arr[i].x[0]) - p[0], dy = Y(arr[i].x[1]) - p[1], d = dx * dx + dy * dy;
          if (d <= bd) { bd = d; best = { kind: 'pt', set: set, i: i }; }
        }
      }
      scan(test, 'test'); scan(train, 'train');
      return best;
    }
    function probeAt(p, touch) {
      var hit = nearest(p, touch ? 22 : 12);
      if (hit) return hit;
      if (inPlot(p)) return { kind: 'loc', x: [invX(p[0]), invY(p[1])] };
      return null;
    }
    function sameProbe(a, b) {
      if (!a || !b) return a === b;
      if (a.kind !== b.kind) return false;
      if (a.kind === 'pt') return a.set === b.set && a.i === b.i;
      if (a.kind === 'node') return a.id === b.id;
      return false;
    }
    var pressed = false;
    function onMove(e) {
      if (e.pointerType !== 'mouse' && !pressed) return;
      if (st.tap !== 'inspect' && pressed) return;
      var np = probeAt(localPos(e), e.pointerType !== 'mouse');
      if (!sameProbe(np, probe)) { probe = np; note = ''; scrollDiagram = true; invalidate(); }
    }
    function onDown(e) {
      var p = localPos(e);
      if (st.tap !== 'inspect') {
        if (!inPlot(p)) return;
        e.preventDefault();
        if (added >= MAX_ADDED) { note = 'That is plenty of new farms. Press <b>Reset farms</b> to start again.'; invalidate(); return; }
        var r = Math.round(Math.min(DOM.hi[0], Math.max(DOM.lo[0], invX(p[0]))));
        var t = Math.round(Math.min(DOM.hi[1], Math.max(DOM.lo[1], invY(p[1]))) * 10) / 10;
        train.push({ x: [r, t], y: st.tap === 'good' ? 1 : 0, added: true });
        added++; dataVer++; dataSig = 'v' + dataVer;
        probe = { kind: 'pt', set: 'train', i: train.length - 1 };
        note = ''; scrollDiagram = true; invalidate();
        return;
      }
      pressed = true;
      if (canvas.setPointerCapture && e.pointerId !== undefined) { try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } }
      probe = probeAt(p, e.pointerType !== 'mouse');
      note = ''; scrollDiagram = true; invalidate();
    }
    function onUp() { pressed = false; }
    function onLeave(e) { if (e.pointerType === 'mouse' && probe && probe.kind !== 'node') { probe = null; invalidate(); } }
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('keydown', function (e) {
      var list = [];
      train.forEach(function (p, i) { list.push({ set: 'train', i: i, r: p.x[0] }); });
      test.forEach(function (p, i) { list.push({ set: 'test', i: i, r: p.x[0] }); });
      list.sort(function (a, b) { return a.r - b.r; });
      var pos = -1;
      if (probe && probe.kind === 'pt') for (var i = 0; i < list.length; i++) if (list[i].set === probe.set && list[i].i === probe.i) pos = i;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') pos = (pos + 1) % list.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') pos = pos <= 0 ? list.length - 1 : pos - 1;
      else if (e.key === 'Escape') { probe = null; invalidate(); return; }
      else return;
      e.preventDefault();
      probe = { kind: 'pt', set: list[pos].set, i: list[pos].i };
      note = ''; scrollDiagram = true; invalidate();
    });
    function diagramNode(e) {
      var t = e.target;
      while (t && t !== treeSvg) { if (t.getAttribute && t.getAttribute('data-id') !== null) return +t.getAttribute('data-id'); t = t.parentNode; }
      return -1;
    }
    function onTreeOver(e) {
      var nid = diagramNode(e);
      if (nid < 0) return;
      var np = { kind: 'node', id: nid };
      if (!sameProbe(np, probe)) { probe = np; note = ''; invalidate(); }
    }
    treeSvg.addEventListener('pointerover', onTreeOver);
    treeSvg.addEventListener('click', onTreeOver);
    treeSvg.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && probe && probe.kind === 'node') { probe = null; invalidate(); } });

    function onTheme() { lastColSig = ''; invalidate(); }
    var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mq) { if (mq.addEventListener) mq.addEventListener('change', onTheme); else if (mq.addListener) mq.addListener(onTheme); }
    document.addEventListener('themechange', onTheme);

    var ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function (entries) {
        if (destroyed) return;
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].target === treeBox) { treeBoxW = entries[i].contentRect.width; continue; }
          if (entries[i].target !== wrap) continue;
          var r = canvas.getBoundingClientRect();
          if (Math.abs(r.width - W) > 0.5 || Math.abs(r.height - H) > 0.5) {
            resize(); readColors();
            if (dirtyHeat) renderHeat();
            draw(); // canvas only: no layout changes inside the observer
          }
        }
        invalidate();
      });
      ro.observe(wrap);
      ro.observe(treeBox);
    } else {
      window.addEventListener('resize', onWinResize);
    }
    function onWinResize() { treeBoxW = treeBox.clientWidth; resize(); invalidate(); }

    treeBoxW = treeBox.clientWidth;
    syncForestControls();
    resize();
    readColors();
    recompute();
    frame();

    return {
      destroy: function () {
        destroyed = true;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        if (ro) ro.disconnect(); else window.removeEventListener('resize', onWinResize);
        if (mq) { if (mq.removeEventListener) mq.removeEventListener('change', onTheme); else if (mq.removeListener) mq.removeListener(onTheme); }
        document.removeEventListener('themechange', onTheme);
        depthC.input.removeEventListener('input', onDepth);
        leafC.input.removeEventListener('input', onLeaf);
        treesC.input.removeEventListener('input', onTrees);
        canvas.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerdown', onDown);
        canvas.removeEventListener('pointerup', onUp);
        canvas.removeEventListener('pointercancel', onUp);
        canvas.removeEventListener('pointerleave', onLeave);
        treeSvg.removeEventListener('pointerover', onTreeOver);
        treeSvg.removeEventListener('click', onTreeOver);
        root.innerHTML = '';
      }
    };
  }

  Labs['tree'] = {
    id: 'tree',
    module: 'l2-trees-ensembles',
    title: 'Decision tree & forest',
    summary: 'Grow a real decision tree that sorts farms into good and poor rice harvests, watch it overfit, then let a forest of trees vote.',
    tasks: TASKS,
    mount: mount
  };
})();
