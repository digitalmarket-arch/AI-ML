/* AI Marg lab: word embeddings. 50 English words, each a hand-made vector of 10 named numbers,
   flattened to a 2-D map with PCA (power iteration on the covariance matrix, computed here in JS).
   Pick a word to see its numbers and its nearest words by cosine similarity, build analogies (A − B + C),
   compare cosine similarity with Euclidean distance, and see why TF-IDF turns down common words.
   Plain classic script (ES2019). Registers window.AILabs.embeddings. No libraries, no network, no storage. */
(function () {
  'use strict';
  var Labs = (window.AILabs = window.AILabs || {});
  var mountCount = 0;

  /* ---------- the 10 named numbers (dimensions) ---------- */
  var DIMS = [
    { name: 'place', desc: '1 for a city, a state or a country.' },
    { name: 'size', desc: 'How big. For places: how many people live there, on a “times ten” scale (every 10 times more people adds 0.25, so 1 million is 0.25 and 1 billion is 1). For people: grown-up 0.6, young (boy, girl, prince, princess) 0.3. For sports: players in a team (0.05 each). For food: portion size.' },
    { name: 'capital', desc: '1 for the capital city of a country, 0.5 for the capital of an Indian state.' },
    { name: 'food', desc: '1 for a food.' },
    { name: 'sport', desc: '1 for a sport (0.8 for chess, a “mind sport”).' },
    { name: 'person', desc: '1 for a word about a person.' },
    { name: 'royal', desc: '1 for kings, queens, princes and princesses; 0.3 for places famous for royal palaces.' },
    { name: 'female', desc: '1 for a female person.' },
    { name: 'south', desc: 'Roughly how far south in India a state is (a city gets the number of its state), or where in India a food comes from: 0 = far north, 1 = far south. 0 for everything else.' },
    { name: 'Indian', desc: 'How strongly the word is linked with India: 1 = completely.' }
  ];
  var ND = DIMS.length;

  /* ---------- the 50 words. Hand-made for teaching: real embeddings are learned from text ---------- */
  //                                place size cap food sport person royal female south Indian
  var WORDS = [
    ['Mumbai', 'icity',       [1, 0.58, 0.5, 0, 0, 0, 0, 0, 0.5, 1]],
    ['Delhi', 'icity',        [1, 0.63, 1, 0, 0, 0, 0, 0, 0, 1]],
    ['Bengaluru', 'icity',    [1, 0.53, 0.5, 0, 0, 0, 0, 0, 0.85, 1]],
    ['Chennai', 'icity',      [1, 0.51, 0.5, 0, 0, 0, 0, 0, 0.95, 1]],
    ['Kolkata', 'icity',      [1, 0.54, 0.5, 0, 0, 0, 0, 0, 0.2, 1]],
    ['Hyderabad', 'icity',    [1, 0.5, 0.5, 0, 0, 0, 0, 0, 0.7, 1]],
    ['Pune', 'icity',         [1, 0.46, 0, 0, 0, 0, 0, 0, 0.5, 1]],
    ['Jaipur', 'icity',       [1, 0.4, 0.5, 0, 0, 0, 0.3, 0, 0.1, 1]],
    ['Kochi', 'icity',        [1, 0.33, 0, 0, 0, 0, 0, 0, 1, 1]],
    ['Paris', 'city',         [1, 0.51, 1, 0, 0, 0, 0, 0, 0, 0]],
    ['London', 'city',        [1, 0.53, 1, 0, 0, 0, 0.3, 0, 0, 0]],
    ['Tokyo', 'city',         [1, 0.64, 1, 0, 0, 0, 0, 0, 0, 0]],
    ['New York', 'city',      [1, 0.57, 0, 0, 0, 0, 0, 0, 0, 0]],
    ['Maharashtra', 'state',  [1, 0.78, 0, 0, 0, 0, 0, 0, 0.5, 1]],
    ['Karnataka', 'state',    [1, 0.71, 0, 0, 0, 0, 0, 0, 0.85, 1]],
    ['Tamil Nadu', 'state',   [1, 0.72, 0, 0, 0, 0, 0, 0, 0.95, 1]],
    ['Kerala', 'state',       [1, 0.64, 0, 0, 0, 0, 0, 0, 1, 1]],
    ['West Bengal', 'state',  [1, 0.74, 0, 0, 0, 0, 0, 0, 0.2, 1]],
    ['Rajasthan', 'state',    [1, 0.73, 0, 0, 0, 0, 0.3, 0, 0.1, 1]],
    ['Telangana', 'state',    [1, 0.65, 0, 0, 0, 0, 0, 0, 0.7, 1]],
    ['India', 'country',      [1, 1, 0, 0, 0, 0, 0, 0, 0, 1]],
    ['USA', 'country',        [1, 0.88, 0, 0, 0, 0, 0, 0, 0, 0]],
    ['Japan', 'country',      [1, 0.77, 0, 0, 0, 0, 0, 0, 0, 0]],
    ['France', 'country',     [1, 0.71, 0, 0, 0, 0, 0, 0, 0, 0]],
    ['England', 'country',    [1, 0.69, 0, 0, 0, 0, 0.3, 0, 0, 0]],
    ['dosa', 'food',          [0, 0.4, 0, 1, 0, 0, 0, 0, 1, 1]],
    ['idli', 'food',          [0, 0.15, 0, 1, 0, 0, 0, 0, 1, 1]],
    ['biryani', 'food',       [0, 0.5, 0, 1, 0, 0, 0, 0, 0.6, 1]],
    ['samosa', 'food',        [0, 0.2, 0, 1, 0, 0, 0, 0, 0.1, 1]],
    ['vada pav', 'food',      [0, 0.25, 0, 1, 0, 0, 0, 0, 0.5, 1]],
    ['pasta', 'food',         [0, 0.4, 0, 1, 0, 0, 0, 0, 0, 0]],
    ['pizza', 'food',         [0, 0.5, 0, 1, 0, 0, 0, 0, 0, 0.2]],
    ['sushi', 'food',         [0, 0.1, 0, 1, 0, 0, 0, 0, 0, 0]],
    ['burger', 'food',        [0, 0.35, 0, 1, 0, 0, 0, 0, 0, 0.1]],
    ['cricket', 'sport',      [0, 0.55, 0, 0, 1, 0, 0, 0, 0, 0.9]],
    ['kabaddi', 'sport',      [0, 0.35, 0, 0, 1, 0, 0, 0, 0, 1]],
    ['hockey', 'sport',       [0, 0.55, 0, 0, 1, 0, 0, 0, 0, 0.6]],
    ['football', 'sport',     [0, 0.55, 0, 0, 1, 0, 0, 0, 0, 0.2]],
    ['tennis', 'sport',       [0, 0.05, 0, 0, 1, 0, 0, 0, 0, 0.1]],
    ['chess', 'sport',        [0, 0.05, 0, 0, 0.8, 0, 0, 0, 0, 0.5]],
    ['king', 'person',        [0, 0.6, 0, 0, 0, 1, 1, 0, 0, 0]],
    ['queen', 'person',       [0, 0.6, 0, 0, 0, 1, 1, 1, 0, 0]],
    ['prince', 'person',      [0, 0.3, 0, 0, 0, 1, 1, 0, 0, 0]],
    ['princess', 'person',    [0, 0.3, 0, 0, 0, 1, 1, 1, 0, 0]],
    ['man', 'person',         [0, 0.6, 0, 0, 0, 1, 0, 0, 0, 0]],
    ['woman', 'person',       [0, 0.6, 0, 0, 0, 1, 0, 1, 0, 0]],
    ['boy', 'person',         [0, 0.3, 0, 0, 0, 1, 0, 0, 0, 0]],
    ['girl', 'person',        [0, 0.3, 0, 0, 0, 1, 0, 1, 0, 0]],
    ['chef', 'person',        [0, 0.6, 0, 0.5, 0, 1, 0, 0, 0, 0]],
    ['player', 'person',      [0, 0.6, 0, 0, 0.5, 1, 0, 0, 0, 0]]
  ];
  var NW = WORDS.length;
  var KINDS = {
    icity: { label: 'Indian city', group: 'Indian cities', cat: 'place' },
    city: { label: 'city abroad', group: 'Cities abroad', cat: 'place' },
    state: { label: 'Indian state', group: 'Indian states', cat: 'place' },
    country: { label: 'country', group: 'Countries', cat: 'place' },
    food: { label: 'food', group: 'Food', cat: 'food' },
    sport: { label: 'sport', group: 'Sport', cat: 'sport' },
    person: { label: 'person', group: 'People', cat: 'person' }
  };
  var CATS = {
    place: { name: 'Place', cssVar: '--series-1', shape: 'circle' },
    food: { name: 'Food', cssVar: '--series-2', shape: 'square' },
    sport: { name: 'Sport', cssVar: '--series-4', shape: 'triangle' },
    person: { name: 'Person', cssVar: '--series-3', shape: 'diamond' }
  };
  var CAT_ORDER = ['place', 'food', 'sport', 'person'];

  var START_WORD = 'dosa';
  var START_ANALOGY = ['Chennai', 'Tamil Nadu', 'Maharashtra'];
  var START_COMPARE = ['prince', 'woman'];
  var PRESETS = [['prince', 'boy', 'girl'], ['Kolkata', 'West Bengal', 'Karnataka'], ['chef', 'biryani', 'kabaddi']];
  var START_SENTENCES = [
    'The cricket match in Mumbai was fun',
    'The biryani in Hyderabad was spicy',
    'The kabaddi match in Pune was a draw'
  ];
  var HIGH_COS = 0.8, FAR_SHARE = 0.25;   // task 4: cosine 0.8 or more, over a quarter of the map's width apart
  var PCA_SEED = 20131;                   // seeds the random starting vector of the power iteration
  var NN_K = 5;
  // when space is short, these words get a label first (the tasks and examples use them)
  var LABEL_FIRST = ['Mumbai', 'Delhi', 'India', 'Paris', 'France', 'London', 'king', 'queen', 'man', 'woman', 'Chennai', 'Tamil Nadu', 'Maharashtra', 'dosa', 'cricket', 'kabaddi'];

  var TASKS = [
    { id: 't1', text: 'Find the 3 nearest neighbours of Mumbai by cosine similarity: pick Mumbai on the map or in the “Selected word” list.' },
    { id: 't2', text: 'Solve king − man + woman in the analogy builder. Which word does the sum land on?' },
    { id: 't3', text: 'Solve Paris − France + India. Swapping the country should keep the “capital city” part.' },
    { id: 't4', text: 'Catch the map bending the truth: in “Compare two words”, find a pair with cosine similarity 0.8 or more that sits over a quarter of the map’s width apart. Hint: an Indian place and a similar place abroad.' }
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
  function dot(a, b) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }
  function len(a) { return Math.sqrt(dot(a, a)); }
  function cosine(a, b) { var la = len(a), lb = len(b); return la > 1e-12 && lb > 1e-12 ? dot(a, b) / (la * lb) : NaN; }
  function euclid(a, b) { var s = 0; for (var i = 0; i < a.length; i++) { var d = a[i] - b[i]; s += d * d; } return Math.sqrt(s); }
  function fx(v, d) {
    if (typeof v !== 'number' || !isFinite(v)) return '—';
    var s = v.toFixed(d);
    if (parseFloat(s) === 0) s = (0).toFixed(d);
    return s.charAt(0) === '-' ? '−' + s.slice(1) : s;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function q(s) { return '“' + s + '”'; }
  function nameOf(i) { return WORDS[i][0]; }
  function vecOf(i) { return WORDS[i][2]; }
  function catOf(i) { return KINDS[WORDS[i][1]].cat; }
  function indexOf(name) { for (var i = 0; i < NW; i++) if (WORDS[i][0] === name) return i; return -1; }

  /* ---------- PCA: power iteration on the covariance matrix ---------- */
  // The covariance matrix C (10 × 10) says how each pair of numbers varies together across the 50 words.
  // Its top eigenvector (the direction the words spread out along the most) is found by multiplying a
  // random start vector by C again and again: each multiply stretches it towards that direction.
  // Then that direction is removed from C (deflation) and the same trick finds the second one.
  function powerIteration(C, rnd, avoid) {
    var D = C.length, x = [], i, j, it;
    for (i = 0; i < D; i++) x.push(rnd() - 0.5);
    for (it = 0; it < 2000; it++) {
      if (avoid) { var p = dot(x, avoid); for (i = 0; i < D; i++) x[i] -= p * avoid[i]; }
      var y = [];
      for (i = 0; i < D; i++) { var s = 0; for (j = 0; j < D; j++) s += C[i][j] * x[j]; y.push(s); }
      var l = len(y);
      if (l < 1e-15) break;
      var change = 0;
      for (i = 0; i < D; i++) { y[i] /= l; change += (y[i] - x[i]) * (y[i] - x[i]); }
      x = y;
      if (change < 1e-26) break;
    }
    if (avoid) { var p2 = dot(x, avoid); for (i = 0; i < D; i++) x[i] -= p2 * avoid[i]; }
    var lx = len(x) || 1;
    for (i = 0; i < D; i++) x[i] /= lx;
    // an eigenvector can point either way; make its biggest entry positive so the map never flips
    var big = 0;
    for (i = 1; i < D; i++) if (Math.abs(x[i]) > Math.abs(x[big])) big = i;
    if (x[big] < 0) for (i = 0; i < D; i++) x[i] = -x[i];
    var Cx = [];
    for (i = 0; i < D; i++) { var t = 0; for (j = 0; j < D; j++) t += C[i][j] * x[j]; Cx.push(t); }
    return { vec: x, value: dot(x, Cx), iterations: it + 1 };
  }
  var MODEL = null;
  function buildModel() {
    if (MODEL) return MODEL;
    var n = NW, D = ND, i, j, k, mu = [];
    for (j = 0; j < D; j++) { var s = 0; for (i = 0; i < n; i++) s += vecOf(i)[j]; mu.push(s / n); }
    var C = [];
    for (i = 0; i < D; i++) { C.push([]); for (j = 0; j < D; j++) C[i].push(0); }
    for (k = 0; k < n; k++) {
      var v = vecOf(k);
      for (i = 0; i < D; i++) for (j = 0; j < D; j++) C[i][j] += (v[i] - mu[i]) * (v[j] - mu[j]) / n;
    }
    var total = 0;
    for (i = 0; i < D; i++) total += C[i][i];
    var rnd = mulberry32(PCA_SEED);
    var pc1 = powerIteration(C, rnd, null);
    var C2 = C.map(function (row, a) { return row.map(function (c, b) { return c - pc1.value * pc1.vec[a] * pc1.vec[b]; }); });
    var pc2 = powerIteration(C2, rnd, pc1.vec);
    var xy = [];
    for (k = 0; k < n; k++) xy.push(project(vecOf(k), mu, pc1.vec, pc2.vec));
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    xy.forEach(function (p) { minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); });
    // cosine similarity and Euclidean distance between every pair of words
    var cos = [], eu = [];
    for (i = 0; i < n; i++) { cos.push([]); eu.push([]); for (j = 0; j < n; j++) { cos[i].push(cosine(vecOf(i), vecOf(j))); eu[i].push(euclid(vecOf(i), vecOf(j))); } }
    MODEL = {
      mu: mu, e1: pc1.vec, e2: pc2.vec, l1: pc1.value, l2: pc2.value, total: total,
      share1: pc1.value / total, share2: pc2.value / total, xy: xy,
      minX: minX, maxX: maxX, minY: minY, maxY: maxY, width: maxX - minX, cos: cos, eu: eu
    };
    return MODEL;
  }
  function project(v, mu, e1, e2) {
    var a = 0, b = 0;
    for (var i = 0; i < v.length; i++) { var c = v[i] - mu[i]; a += c * e1[i]; b += c * e2[i]; }
    return [a, b];
  }
  // which named numbers push words along an axis, e.g. "← person · place, Indian →"
  function axisWords(e) {
    var idx = e.map(function (v, i) { return i; });
    var pos = idx.filter(function (i) { return e[i] >= 0.3; }).sort(function (a, b) { return e[b] - e[a]; }).slice(0, 2);
    var neg = idx.filter(function (i) { return e[i] <= -0.3; }).sort(function (a, b) { return e[a] - e[b]; }).slice(0, 2);
    return { pos: pos.map(function (i) { return DIMS[i].name; }), neg: neg.map(function (i) { return DIMS[i].name; }) };
  }
  // nearest words to a vector: by cosine (biggest first) or Euclidean distance (smallest first)
  function rankWords(v, exclude, by) {
    var list = [];
    for (var i = 0; i < NW; i++) if (exclude.indexOf(i) < 0) list.push({ i: i, cos: cosine(v, vecOf(i)), eu: euclid(v, vecOf(i)) });
    list.sort(function (a, b) {
      var ca = isNaN(a.cos) ? -2 : a.cos, cb = isNaN(b.cos) ? -2 : b.cos;
      var d = by === 'euc' ? a.eu - b.eu : cb - ca;
      return d || a.i - b.i;
    });
    return list;
  }

  /* ---------- TF-IDF maths ---------- */
  function tokens(s) { return (String(s).toLowerCase().match(/[a-z0-9]+/g) || []); }
  // idf = ln((1 + n) / (1 + df)) + 1 (scikit-learn's default, smooth_idf=True); TF-IDF = count × idf
  function idfOf(n, df) { return Math.log((1 + n) / (1 + df)) + 1; }
  function bagModel(sentences) {
    var n = sentences.length, vocab = [], seen = {}, counts = [], d, t;
    for (d = 0; d < n; d++) {
      var c = {}, toks = tokens(sentences[d]);
      for (t = 0; t < toks.length; t++) {
        var w = toks[t];
        if (!seen[w]) { seen[w] = { word: w, df: 0, first: vocab.length }; vocab.push(seen[w]); }
        c[w] = (c[w] || 0) + 1;
      }
      counts.push(c);
    }
    vocab.forEach(function (v) { for (var k = 0; k < n; k++) if (counts[k][v.word]) v.df++; v.idf = idfOf(n, v.df); });
    vocab.sort(function (a, b) { return b.df - a.df || a.first - b.first; });
    var bow = [], tfidf = [];
    for (d = 0; d < n; d++) {
      bow.push(vocab.map(function (v) { return counts[d][v.word] || 0; }));
      tfidf.push(vocab.map(function (v) { return (counts[d][v.word] || 0) * v.idf; }));
    }
    var l2 = tfidf.map(function (row) { var L = len(row); return row.map(function (x) { return L > 0 ? x / L : 0; }); });
    return { n: n, vocab: vocab, bow: bow, tfidf: tfidf, l2: l2 };
  }

  /* ---------- colours (theme colours are read from CSS variables at draw time) ---------- */
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
  var THEME_VARS = ['--surface', '--surface-2', '--ink', '--muted', '--line', '--indigo', '--haldi', '--series-1', '--series-2', '--series-3', '--series-4', '--font-body'];
  var themeCache = { key: '', T: null };
  function readTheme() {
    var cs = getComputedStyle(document.documentElement), raw = {}, key = '';
    THEME_VARS.forEach(function (n) { raw[n] = cs.getPropertyValue(n).trim(); key += raw[n] + '|'; });
    if (themeCache.key === key && themeCache.T) return themeCache.T;
    var T = {
      surface: toRgb(raw['--surface']), surface2: toRgb(raw['--surface-2']), ink: toRgb(raw['--ink']), muted: toRgb(raw['--muted']),
      line: toRgb(raw['--line']), indigo: toRgb(raw['--indigo']), haldi: toRgb(raw['--haldi']),
      cat: { place: toRgb(raw['--series-1']), food: toRgb(raw['--series-2']), person: toRgb(raw['--series-3']), sport: toRgb(raw['--series-4']) },
      font: raw['--font-body'] || 'system-ui, sans-serif'
    };
    themeCache = { key: key, T: T };
    return T;
  }

  /* ---------- marker shapes (the shape repeats the colour, so colour is never the only clue) ---------- */
  function shapePath(g, shape, x, y, r) {
    if (shape === 'square') { var s = r * 0.86; g.rect(x - s, y - s, 2 * s, 2 * s); }
    else if (shape === 'diamond') { var d = r * 1.25; g.moveTo(x, y - d); g.lineTo(x + d, y); g.lineTo(x, y + d); g.lineTo(x - d, y); g.closePath(); }
    else if (shape === 'triangle') { var t = r * 1.2; g.moveTo(x, y - t); g.lineTo(x + t * 0.95, y + t * 0.62); g.lineTo(x - t * 0.95, y + t * 0.62); g.closePath(); }
    else { g.moveTo(x + r, y); g.arc(x, y, r, 0, Math.PI * 2); }
  }
  function starPath(g, x, y, R) {
    for (var k = 0; k < 10; k++) {
      var a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? R * 0.45 : R;
      if (k) g.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); else g.moveTo(x + rr * Math.cos(a), y + rr * Math.sin(a));
    }
    g.closePath();
  }
  function swatch(shape, cssVar) {
    var p;
    if (shape === 'square') p = '<rect x="2" y="2" width="10" height="10"/>';
    else if (shape === 'diamond') p = '<polygon points="7,0.8 13.2,7 7,13.2 0.8,7"/>';
    else if (shape === 'triangle') p = '<polygon points="7,1 13,12.5 1,12.5"/>';
    else if (shape === 'star') p = '<polygon points="7,0.5 8.8,5 13.6,5.3 9.9,8.4 11.1,13.2 7,10.5 2.9,13.2 4.1,8.4 0.4,5.3 5.2,5"/>';
    else p = '<circle cx="7" cy="7" r="5.6"/>';
    return '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false" style="flex:none;overflow:visible;fill:var(' + cssVar + ');stroke:var(--ink);stroke-width:' + (shape === 'star' ? 0.9 : 0) + '">' + p + '</svg>';
  }
  function legendItem(svg, text) { return '<i style="font-style:normal;display:inline-flex;align-items:center;gap:6px">' + svg + text + '</i>'; }

  /* ================================================================ */
  function mount(root, ctx) {
    var P = 'emb' + (++mountCount) + '-';
    var M = buildModel();
    var listeners = [];
    function on(el, type, fn, opts) { el.addEventListener(type, fn, opts); listeners.push([el, type, fn, opts]); }
    var destroyed = false;

    function optionsHtml(selected) {
      var html = '', groups = ['icity', 'city', 'state', 'country', 'food', 'sport', 'person'];
      groups.forEach(function (kind) {
        html += '<optgroup label="' + KINDS[kind].group + '">';
        for (var i = 0; i < NW; i++) if (WORDS[i][1] === kind) html += '<option value="' + i + '"' + (i === selected ? ' selected' : '') + '>' + esc(nameOf(i)) + '</option>';
        html += '</optgroup>';
      });
      return html;
    }
    function selectHtml(id, label, selected) {
      return '<div class="control"><label for="' + P + id + '">' + label + '</label>' +
        '<select id="' + P + id + '" style="width:100%">' + optionsHtml(selected) + '</select></div>';
    }
    var tasksHtml = TASKS.map(function (t) { return '<li data-task="' + t.id + '">' + t.text + '</li>'; }).join('');
    var presetHtml = PRESETS.map(function (p, k) {
      return '<button type="button" class="btn btn-sm" data-preset="' + k + '">' + esc(p[0] + ' − ' + p[1] + ' + ' + p[2]) + '</button>';
    }).join('');
    var legendHtml = CAT_ORDER.map(function (c) { return legendItem(swatch(CATS[c].shape, CATS[c].cssVar), CATS[c].name); }).join('') +
      legendItem(swatch('star', '--haldi'), 'Analogy result (A − B + C)');
    var iStart = indexOf(START_WORD);
    var a0 = START_ANALOGY.map(indexOf), c0 = START_COMPARE.map(indexOf);
    var pct1 = Math.round(M.share1 * 100), pct2 = Math.round(M.share2 * 100), pctAll = Math.round((M.share1 + M.share2) * 100);

    var top = document.createElement('div');
    top.className = 'lab';
    top.innerHTML =
      '<p class="lab-note"><strong>What you are seeing:</strong> 50 English words, each turned into a list of 10 numbers (a <em>vector</em>), one number per meaning, such as “is it a place?”, “is it food?” or “how linked with India?”. ' +
        'These are <strong>small hand-made vectors for teaching</strong>. Real <em>embeddings</em> (word vectors), such as Word2Vec, are <em>learned</em> from huge amounts of text, have hundreds of numbers per word, and their numbers have no neat names. ' +
        'Ten numbers cannot be drawn on a flat screen, so <em>PCA</em> (principal component analysis) squashes them onto the two directions in which the words spread out the most, like the shadow of a 3-D object on a wall. ' +
        'Words with similar meanings land near each other, but the squash bends some distances.</p>' +
      '<div class="lab-body">' +
        '<div class="stack-sm">' +
          '<div class="lab-canvas-wrap" id="' + P + 'wrap"><canvas id="' + P + 'map" tabindex="0" role="img" aria-label="Map of words" aria-describedby="' + P + 'kbd" style="touch-action:manipulation;outline-offset:-3px;cursor:default"></canvas></div>' +
          '<div class="lab-legend">' + legendHtml + '</div>' +
          '<p class="small" id="' + P + 'readout" style="min-height:3.2em"></p>' +
          '<p class="small muted">Click or tap a dot to pick a word. Where dots overlap, tap the same spot again to move to the next word there. Some labels are hidden where words crowd together; picking a word always shows its label.</p>' +
          '<p class="kbd-hint" id="' + P + 'kbd">Keyboard: focus the map and use the arrow keys to jump to the nearest word in that direction.</p>' +
          '<p class="visually-hidden" role="status" aria-live="polite" id="' + P + 'live"></p>' +
          '<div class="lab-stats" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr))">' +
            '<div class="stat"><div class="k">Map keeps</div><div class="v">' + pctAll + '%</div></div>' +
            '<div class="stat"><div class="k">Across (PC1)</div><div class="v">' + pct1 + '%</div></div>' +
            '<div class="stat"><div class="k">Up (PC2)</div><div class="v">' + pct2 + '%</div></div>' +
            '<div class="stat"><div class="k">Numbers per word</div><div class="v">' + ND + '</div></div>' +
          '</div>' +
          '<section class="card stack-sm" aria-labelledby="' + P + 'nh" style="margin-top:8px"><h2 class="lab-h" id="' + P + 'nh">Nearest words</h2>' +
            '<div class="control"><span class="control-label" id="' + P + 'ranklbl">Rank by</span>' +
              '<div class="seg" role="group" aria-labelledby="' + P + 'ranklbl">' +
                '<button type="button" data-rank="cos" aria-pressed="true">Cosine similarity</button>' +
                '<button type="button" data-rank="euc" aria-pressed="false">Euclidean distance</button>' +
              '</div></div>' +
            '<div class="stack-sm" id="' + P + 'nbody"></div>' +
          '</section>' +
        '</div>' +
        '<div class="lab-controls">' +
          selectHtml('word', 'Selected word', iStart) +
          '<div class="control"><span class="control-label" id="' + P + 'modelbl">Show on the map</span>' +
            '<div class="seg" role="group" aria-labelledby="' + P + 'modelbl">' +
              '<button type="button" data-mode="nbrs" aria-pressed="true">Neighbours</button>' +
              '<button type="button" data-mode="analogy" aria-pressed="false">Analogy</button>' +
              '<button type="button" data-mode="compare" aria-pressed="false">Compare</button>' +
            '</div></div>' +
          '<div class="stack-sm"><h2 class="lab-h">Analogy builder: A − B + C = ?</h2>' +
            selectHtml('a', 'A: start with', a0[0]) + selectHtml('b', 'B: take away', a0[1]) + selectHtml('c', 'C: add', a0[2]) +
            '<p class="small" id="' + P + 'aline"></p>' +
            '<div class="stack-sm"><span class="small muted">Try an example:</span><div class="row">' + presetHtml + '</div></div>' +
          '</div>' +
          '<div class="stack-sm"><h2 class="lab-h">Compare two words</h2>' +
            selectHtml('p', 'Word 1', c0[0]) + selectHtml('q', 'Word 2', c0[1]) +
            '<p class="small" id="' + P + 'cline"></p>' +
          '</div>' +
          '<div class="stack-sm"><h2 class="lab-h">Your tasks</h2><ul class="lab-tasks" id="' + P + 'tasks">' + tasksHtml + '</ul></div>' +
        '</div>' +
      '</div>' +
      '<div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));align-items:start">' +
        '<section class="card stack-sm" aria-labelledby="' + P + 'ah"><h2 class="lab-h" id="' + P + 'ah">Analogy result</h2><div class="stack-sm" id="' + P + 'abody"></div></section>' +
        '<section class="card stack-sm" aria-labelledby="' + P + 'ch"><h2 class="lab-h" id="' + P + 'ch">Cosine similarity vs Euclidean distance</h2><div class="stack-sm" id="' + P + 'cbody"></div></section>' +
      '</div>' +
      '<section class="card stack" aria-labelledby="' + P + 'th">' +
        '<h2 class="lab-h" id="' + P + 'th">From words to sentences: bag of words vs TF-IDF</h2>' +
        '<p class="small">Embeddings give each <em>word</em> a vector. An older, simpler way to turn a whole <em>sentence</em> into numbers is to count words. ' +
          '<strong>Bag of words</strong> counts how often each word appears in each sentence and ignores word order. ' +
          '<strong>TF-IDF</strong> (term frequency × inverse document frequency) multiplies each count by a weight, <em>idf</em>, that is small for words found in many sentences, such as “the”, and big for rare ones.</p>' +
        '<p class="small" style="padding:10px 12px;border-radius:var(--radius-sm);background:var(--surface-2)">TF-IDF = count × idf, where <span class="mono">idf = ln((1 + n) ÷ (1 + df)) + 1</span>. ' +
          'Here n = number of sentences (3), df = how many sentences contain the word, and ln is the natural logarithm. This is the formula scikit-learn uses by default (<code>smooth_idf=True</code>). ' +
          'Words are lower-cased and punctuation is dropped (scikit-learn would also drop one-letter words such as “a”).</p>' +
        '<div class="stack-sm" style="max-width:720px">' +
          [0, 1, 2].map(function (k) {
            return '<div style="display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center">' +
              '<label for="' + P + 's' + k + '" style="flex:0 0 5.6em;font-size:.92rem;font-weight:600">Sentence ' + (k + 1) + '</label>' +
              '<input type="text" id="' + P + 's' + k + '" maxlength="90" spellcheck="false" autocomplete="off" value="' + esc(START_SENTENCES[k]) + '" style="flex:1 1 240px;min-width:0;font-size:1rem"></div>';
          }).join('') +
        '</div>' +
        '<div class="row" style="gap:14px">' +
          '<div class="seg" role="group" aria-label="Numbers in the table">' +
            '<button type="button" data-tf="bow" aria-pressed="false">Counts (bag of words)</button>' +
            '<button type="button" data-tf="tfidf" aria-pressed="true">TF-IDF</button>' +
          '</div>' +
          '<label class="small" for="' + P + 'l2" style="display:inline-flex;gap:8px;align-items:center"><input type="checkbox" id="' + P + 'l2">Scale each sentence to length 1 (L2 normalisation, scikit-learn’s default)</label>' +
        '</div>' +
        '<div id="' + P + 'tbody"></div>' +
      '</section>' +
      '<p class="small muted"><strong style="color:var(--ink)">Why it matters in real ML:</strong> search engines, “similar products” lists, chatbots that look up documents before they answer, and spam filters all turn words or whole texts into vectors and compare them with cosine similarity. Real embeddings are learned from text, so they also pick up its biases (for example linking some jobs with one gender), and they need checking before use.</p>';
    root.appendChild(top);

    function $(id) { return top.querySelector('#' + P + id); }
    var wrap = $('wrap'), canvas = $('map'), g = canvas.getContext('2d');
    var elReadout = $('readout'), elLive = $('live'), elALine = $('aline'), elCLine = $('cline');
    var selWord = $('word'), selA = $('a'), selB = $('b'), selC = $('c'), selP = $('p'), selQ = $('q');
    var elNH = $('nh'), elNBody = $('nbody'), elABody = $('abody'), elCBody = $('cbody'), elTBody = $('tbody');
    var inS = [$('s0'), $('s1'), $('s2')], chkL2 = $('l2');
    var modeBtns = top.querySelectorAll('[data-mode]'), rankBtns = top.querySelectorAll('[data-rank]'), tfBtns = top.querySelectorAll('[data-tf]');
    var taskEls = {};
    Array.prototype.forEach.call(top.querySelectorAll('[data-task]'), function (li) { taskEls[li.getAttribute('data-task')] = li; });

    /* ---------- state ---------- */
    var S = {
      sel: iStart, mode: 'nbrs', rank: 'cos', hover: -1,
      ana: a0.slice(), cmp: c0.slice(), tf: 'tfidf', l2: false,
      sentences: START_SENTENCES.slice()
    };
    var A = null;          // analogy result
    var done = {};
    var dims = { w: 1, h: 1, dpr: 1 };
    var rafId = 0, aspectRaf = 0, liveTimer = 0, curAspect = null, screenPos = [];

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
    var taskNote = '';
    function completeTask(id) {
      if (done[id]) return;
      done[id] = true;
      markLi(id);
      taskNote = 'Task done! ';
      if (ctx && ctx.onTaskDone) ctx.onTaskDone(id);
    }

    /* ---------- announcements (one polite message, sent after a short pause) ---------- */
    var pendingLive = '';
    function announce(s, now) {
      pendingLive = taskNote + s;
      taskNote = '';
      if (liveTimer) clearTimeout(liveTimer);
      liveTimer = setTimeout(function () { liveTimer = 0; if (!destroyed) elLive.textContent = pendingLive; }, now ? 30 : 400);
    }

    /* ---------- nearest words panel ---------- */
    function nearest(i, by) { return rankWords(vecOf(i), [i], by).slice(0, NN_K); }
    function vecTable(cols) {
      // cols: [{ name, vec, cssVar }]; a row per named number with a bar for each vector
      var lo = 0, hi = 1;
      cols.forEach(function (c) { c.vec.forEach(function (v) { lo = Math.min(lo, v); hi = Math.max(hi, v); }); });
      var span = hi - lo, z = (-lo / span) * 100, barH = cols.length > 1 ? 6 : 10;
      var head = '<thead><tr><th scope="col" style="text-align:left;padding:0 6px 4px 0;font-size:.78rem;color:var(--muted)">Meaning</th>' +
        '<th scope="col" style="padding:0 0 4px"><span class="visually-hidden">Bar</span></th>' +
        cols.map(function (c) {
          return '<th scope="col" style="text-align:right;padding:0 0 4px 8px;font-size:.78rem;white-space:nowrap"><span style="display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:4px;background:var(' + c.cssVar + ')"></span>' + esc(c.name) + '</th>';
        }).join('') + '</tr></thead>';
      var body = DIMS.map(function (d, k) {
        var bars = cols.map(function (c, ci) {
          var v = c.vec[k], x0 = Math.min(z, z + v / span * 100), w = Math.abs(v) / span * 100;
          return '<div style="position:absolute;left:' + x0.toFixed(2) + '%;width:' + Math.max(w, v ? 0.8 : 0).toFixed(2) + '%;top:' + (2 + ci * (barH + 2)) + 'px;height:' + barH + 'px;border-radius:2px;background:var(' + c.cssVar + ')"></div>';
        }).join('');
        var zero = lo < 0 ? '<div style="position:absolute;left:' + z.toFixed(2) + '%;top:0;bottom:0;width:1px;background:var(--ink)"></div>' : '';
        return '<tr><th scope="row" style="text-align:left;font-weight:600;padding:1px 6px 1px 0;white-space:nowrap">' + d.name + '</th>' +
          '<td aria-hidden="true" style="width:100%;padding:1px 0"><div style="position:relative;height:' + (cols.length * (barH + 2) + 2) + 'px;background:var(--surface-2);border-radius:3px">' + bars + zero + '</div></td>' +
          cols.map(function (c) { return '<td class="num mono" style="text-align:right;padding:1px 0 1px 8px;white-space:nowrap">' + fx(c.vec[k], 2) + '</td>'; }).join('') + '</tr>';
      }).join('');
      return '<div class="table-wrap" style="width:0;min-width:100%"><table style="width:100%;border-collapse:collapse;font-size:.85rem;line-height:1.3">' +
        '<caption class="visually-hidden">The 10 numbers of ' + esc(cols.map(function (c) { return c.name; }).join(' and ')) + '</caption>' + head + '<tbody>' + body + '</tbody></table></div>';
    }
    function wordBtn(i) {
      return '<button type="button" data-pick="' + i + '" style="font:inherit;font-weight:700;background:none;border:0;padding:0;color:var(--indigo);text-decoration:underline;text-underline-offset:3px;cursor:pointer">' + esc(nameOf(i)) + '</button>';
    }
    function dotSum(a, b) {
      var parts = [];
      for (var k = 0; k < ND; k++) if (a[k] && b[k]) parts.push(fx(a[k], 2) + '×' + fx(b[k], 2));
      return parts.length ? parts.join(' + ') : '0 (no number is above 0 in both)';
    }
    function diffSum(a, b) {
      var parts = [];
      for (var k = 0; k < ND; k++) if (Math.abs(a[k] - b[k]) > 1e-12) parts.push('(' + fx(a[k], 2) + ' − ' + fx(b[k], 2) + ')²');
      return parts.length ? parts.join(' + ') : '0';
    }
    function renderNbrs() {
      var i = S.sel, list = nearest(i, S.rank), v = vecOf(i), first = list[0];
      elNH.textContent = 'Nearest words to ' + q(nameOf(i));
      var items = list.map(function (r) {
        var val = S.rank === 'euc' ? 'distance ' + fx(r.eu, 2) : 'cosine ' + fx(r.cos, 3);
        var share = S.rank === 'euc' ? clamp(1 - r.eu / 2.5, 0, 1) : clamp(r.cos, 0, 1);
        return '<li style="margin-top:6px"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">' +
          '<span>' + wordBtn(r.i) + ' <span class="muted small">' + KINDS[WORDS[r.i][1]].label + '</span></span>' +
          '<span class="mono small num">' + val + '</span></div>' +
          '<div aria-hidden="true" style="height:5px;border-radius:3px;background:var(--surface-2);margin-top:3px"><div style="height:100%;width:' + (share * 100).toFixed(1) + '%;border-radius:3px;background:var(--indigo)"></div></div></li>';
      }).join('');
      var fv = vecOf(first.i), worked, pair = esc(nameOf(i)) + ' and ' + esc(nameOf(first.i));
      if (S.rank === 'euc') {
        worked = '<p class="small"><strong>Euclidean distance</strong> = √(sum of (a − b)²): the straight-line gap between the tips of the two arrows. Smaller means closer. ' +
          'It counts differences in <em>length</em> too, so short vectors (words with few big numbers, such as chess) tend to be close to each other. Try chess under both rankings.</p>' +
          '<details class="fold"><summary>Worked example: ' + pair + '</summary><div><p class="small">√(' + diffSum(v, fv) + ') = <b class="num">' + fx(first.eu, 2) + '</b></p></div></details>';
      } else {
        worked = '<p class="small"><strong>Cosine similarity</strong> = (A · B) ÷ (|A| × |B|). It measures the angle between the two word arrows: 1 = pointing the same way, 0 = nothing in common (at right angles). All our numbers are 0 or more, so between two words it stays between 0 and 1.</p>' +
          '<details class="fold"><summary>Worked example: ' + pair + '</summary><div><p class="small">Multiply the matching numbers of the two words and add them up (the <em>dot product</em>, A · B): ' + dotSum(v, fv) + ' = <span class="num">' + fx(dot(v, fv), 2) + '</span>. ' +
          'Then divide by both lengths (|A| = √(sum of the squares)): ' + fx(len(v), 3) + ' and ' + fx(len(fv), 3) + '. Cosine = ' + fx(dot(v, fv), 2) + ' ÷ (' + fx(len(v), 3) + ' × ' + fx(len(fv), 3) + ') ≈ <b class="num">' + fx(first.cos, 3) + '</b>.</p></div></details>';
      }
      var defs = '<details class="fold"><summary>What the 10 numbers mean</summary><div><ul class="small" style="padding-left:1.1em">' +
        DIMS.map(function (d) { return '<li><b>' + d.name + ':</b> ' + d.desc + '</li>'; }).join('') + '</ul></div></details>';
      elNBody.innerHTML =
        '<p class="small">' + esc(nameOf(i)) + ' (' + KINDS[WORDS[i][1]].label + ') ' + (S.rank === 'euc' ? 'by Euclidean distance (smallest first):' : 'by cosine similarity (biggest first):') + '</p>' +
        '<ol style="padding-left:1.4em;margin:0">' + items + '</ol>' + worked +
        '<h2 class="lab-h" style="margin-top:4px">The 10 numbers of ' + q(esc(nameOf(i))) + '</h2>' +
        vecTable([{ name: nameOf(i), vec: v, cssVar: '--series-1' }]) + defs;
    }

    /* ---------- analogy ---------- */
    function computeAnalogy() {
      var a = vecOf(S.ana[0]), b = vecOf(S.ana[1]), c = vecOf(S.ana[2]), r = [];
      for (var k = 0; k < ND; k++) r.push(Math.round((a[k] - b[k] + c[k]) * 1e9) / 1e9);
      var zero = len(r) < 1e-9;
      var ex = [];
      S.ana.forEach(function (x) { if (ex.indexOf(x) < 0) ex.push(x); });
      var list = zero ? [] : rankWords(r, ex, 'cos').slice(0, 5);
      A = { vec: r, zero: zero, list: list, best: list.length ? list[0].i : -1, xy: project(r, M.mu, M.e1, M.e2) };
    }
    function eqText() { return nameOf(S.ana[0]) + ' − ' + nameOf(S.ana[1]) + ' + ' + nameOf(S.ana[2]); }
    function renderAnalogy() {
      var eq = esc(eqText());
      if (A.zero) {
        elALine.innerHTML = eq + ' gives all zeros, so it points nowhere. Try other words.';
        elABody.innerHTML = '<p class="small">' + eq + ' = a vector of all zeros. A zero vector has no direction, so no word can be “nearest” by cosine similarity.</p>';
        return;
      }
      var best = A.list[0];
      elALine.innerHTML = eq + ' ≈ <b>' + esc(nameOf(best.i)) + '</b> <span class="muted num">(cosine ' + fx(best.cos, 3) + ')</span>';
      var items = A.list.map(function (r) {
        return '<li style="margin-top:4px"><span style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><span>' + wordBtn(r.i) + ' <span class="muted small">' + KINDS[WORDS[r.i][1]].label + '</span></span><span class="mono small num">cosine ' + fx(r.cos, 3) + '</span></span></li>';
      }).join('');
      var exact = best.cos > 0.9995;
      elABody.innerHTML =
        '<p><span class="num">' + eq + ' = ?</span></p>' +
        '<p class="small">The sum works number by number: A’s 10 numbers, minus B’s, plus C’s. These words point most nearly the same way as the result:</p>' +
        '<ol style="padding-left:1.4em;margin:0">' + items + '</ol>' +
        '<p class="small">' + (exact ? 'The result matches ' + esc(nameOf(best.i)) + ' exactly (cosine 1.000).' : 'No word matches exactly; ' + esc(nameOf(best.i)) + ' is simply the closest. Real embeddings are like this too: analogies come out roughly, not perfectly.') +
          ' A, B and C themselves are left out of the answers, as word-vector libraries such as gensim do; otherwise the answer would often just be A or C.</p>' +
        '<p class="small">On the map, the ★ is where the result lands: the arrow from A to the ★ is the same length and direction as the dashed arrow from B to C. (The map keeps this exactly, because PCA flattening is a <em>linear</em> squash: straight lines stay straight and parallel arrows stay parallel.)</p>' +
        vecTable([{ name: 'A − B + C', vec: A.vec, cssVar: '--series-2' }, { name: nameOf(best.i), vec: vecOf(best.i), cssVar: '--series-1' }]);
    }

    /* ---------- compare ---------- */
    function cmpStats() {
      var p = S.cmp[0], qq = S.cmp[1];
      var dx = M.xy[p][0] - M.xy[qq][0], dy = M.xy[p][1] - M.xy[qq][1];
      var md = Math.sqrt(dx * dx + dy * dy);
      var cs = M.cos[p][qq];
      return { p: p, q: qq, cos: cs, angle: Math.acos(clamp(cs, -1, 1)) * 180 / Math.PI, eu: M.eu[p][qq], map: md, share: md / M.width, lp: len(vecOf(p)), lq: len(vecOf(qq)) };
    }
    function rankOf(i, j) {
      var list = rankWords(vecOf(i), [i], 'cos');
      for (var k = 0; k < list.length; k++) if (list[k].i === j) return k + 1;
      return 0;
    }
    function ordinal(n) { var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
    function renderCompare() {
      var c = cmpStats(), np = esc(nameOf(c.p)), nq = esc(nameOf(c.q)), same = c.p === c.q;
      var pctW = Math.round(c.share * 100);
      elCLine.innerHTML = same ? 'Pick two different words.' :
        'Cosine <b class="num">' + fx(c.cos, 2) + '</b> · Euclidean <b class="num">' + fx(c.eu, 2) + '</b> · <span class="num">' + pctW + '%</span> of the map’s width apart';
      var verdict;
      if (same) verdict = 'Both boxes hold the same word, so cosine is 1 and both distances are 0.';
      else if (c.cos >= HIGH_COS && c.share >= FAR_SHARE) verdict = '<b>The map is misleading here.</b> ' + np + ' and ' + nq + ' point almost the same way (cosine ' + fx(c.cos, 2) + '), yet they sit ' + pctW + '% of the map’s width apart. The map shows straight-line gaps, which also count the numbers where the two words differ, while cosine looks only at direction across all 10 numbers.';
      else if (c.cos < 0.7 && c.share < 0.06) verdict = '<b>The map is misleading here.</b> ' + np + ' and ' + nq + ' sit almost on top of each other on the map, yet their cosine similarity is only ' + fx(c.cos, 2) + '. The numbers that tell them apart were lost when 10 numbers were squashed into 2.';
      else if (c.cos >= HIGH_COS) verdict = np + ' and ' + nq + ' point almost the same way (cosine ' + fx(c.cos, 2) + ') and are fairly close on the map too.';
      else if (c.cos < 0.3) verdict = np + ' and ' + nq + ' have little in common (cosine ' + fx(c.cos, 2) + ').';
      else verdict = np + ' and ' + nq + ' are partly alike (cosine ' + fx(c.cos, 2) + ').';
      var r1 = same ? 0 : rankOf(c.p, c.q);
      var stat = function (k, v) { return '<div class="stat"><div class="k">' + k + '</div><div class="v">' + v + '</div></div>'; };
      elCBody.innerHTML =
        '<div class="lab-stats" style="grid-template-columns:repeat(2,minmax(0,1fr))">' +
          stat('Cosine similarity', fx(c.cos, 3)) + stat('Angle between', Math.round(c.angle) + '°') +
          stat('Euclidean (10 numbers)', fx(c.eu, 2)) + stat('Gap on the map', fx(c.map, 2) + ' (' + pctW + '%)') +
        '</div>' +
        '<p class="small">' + verdict + '</p>' +
        (same ? '' : '<p class="small muted">' + nq + ' is ' + np + '’s ' + ordinal(r1) + ' nearest word by cosine. Lengths: |' + np + '| = ' + fx(c.lp, 2) + ', |' + nq + '| = ' + fx(c.lq, 2) + '.</p>') +
        '<p class="small"><strong>Cosine</strong> compares only the <em>direction</em> of the two arrows: a long and a short arrow pointing the same way score 1. ' +
          '<strong>Euclidean distance</strong> is the straight-line gap between the arrow tips, so it grows when one arrow is longer than the other. ' +
          'The <strong>gap on the map</strong> is the Euclidean distance after the squash to 2-D (given in map units, and as a share of the map’s width). It can only shrink in the squash, never grow, so it is never bigger than the 10-number Euclidean distance.</p>' +
        '<p class="small muted">A 2-D picture of high-dimensional vectors always distorts. The two map directions (PC1 and PC2, the first two <em>principal components</em>) hold ' + pctAll + '% of the <em>variance</em> (spread) of all 10 numbers; the other ' + (100 - pctAll) + '% is lost in the squash. 2-D pictures of real embeddings with hundreds of numbers usually lose far more. Trust the numbers, not the picture.</p>' +
        vecTable([{ name: nameOf(c.p), vec: vecOf(c.p), cssVar: '--series-1' }, { name: nameOf(c.q), vec: vecOf(c.q), cssVar: '--series-4' }]);
      return c;
    }

    /* ---------- TF-IDF panel ---------- */
    function renderTfidf() {
      var B = bagModel(S.sentences), n = B.n, vocab = B.vocab, d, k;
      if (!vocab.length) { elTBody.innerHTML = '<p class="small">Type some words into the sentences above.</p>'; return; }
      var mat = S.tf === 'bow' ? B.bow : (S.l2 ? B.l2 : B.tfidf);
      var maxV = 0;
      mat.forEach(function (row) { row.forEach(function (x) { maxV = Math.max(maxV, x); }); });
      var dec = S.tf === 'bow' ? 0 : 2;
      var th = 'style="text-align:right;padding:4px 6px;font-size:.78rem;color:var(--muted);white-space:nowrap;border-bottom:1px solid var(--line)"';
      var rows = vocab.map(function (v, k2) {
        var all = v.df === n;
        var cells = '';
        for (d = 0; d < n; d++) {
          var x = mat[d][k2];
          cells += '<td style="text-align:right;padding:3px 6px;border-bottom:1px solid var(--line);min-width:48px">' +
            '<span class="mono num"' + (x ? '' : ' style="color:var(--muted)"') + '>' + (x ? fx(x, dec) : '0') + '</span>' +
            '<div aria-hidden="true" style="height:4px;margin-top:2px;border-radius:2px;background:var(--surface-2)"><div style="height:100%;width:' + (maxV > 0 ? x / maxV * 100 : 0).toFixed(1) + '%;border-radius:2px;background:var(--indigo)"></div></div></td>';
        }
        return '<tr><th scope="row" style="text-align:left;padding:3px 6px 3px 0;border-bottom:1px solid var(--line);font-weight:600;white-space:nowrap">' + esc(v.word) + '</th>' +
          '<td class="mono num" style="text-align:right;padding:3px 6px;border-bottom:1px solid var(--line);white-space:nowrap">' +
            (all ? '<span aria-hidden="true" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--haldi);margin-right:4px"></span><span class="visually-hidden">in every sentence: </span>' : '') + v.df + '</td>' +
          '<td class="mono num" style="text-align:right;padding:3px 6px;border-bottom:1px solid var(--line)">' + fx(v.idf, 2) + '</td>' + cells + '</tr>';
      }).join('');
      var what = S.tf === 'bow' ? 'Counts (bag of words)' : (S.l2 ? 'TF-IDF, each sentence scaled to length 1' : 'TF-IDF = count × idf');
      var table = '<div class="table-wrap" style="width:0;min-width:100%;max-height:440px;overflow:auto;border:1px solid var(--line);border-radius:var(--radius-sm)">' +
        '<table style="width:100%;border-collapse:collapse;font-size:.88rem;line-height:1.3">' +
        '<caption class="visually-hidden">' + what + ' for each word in each sentence</caption>' +
        '<thead><tr><th scope="col" ' + th.replace('text-align:right', 'text-align:left') + '>Word</th><th scope="col" ' + th + '>df</th><th scope="col" ' + th + '>idf</th>' +
        [0, 1, 2].map(function (j) { return '<th scope="col" ' + th + '><span aria-hidden="true">S' + (j + 1) + '</span><span class="visually-hidden">Sentence ' + (j + 1) + '</span></th>'; }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
      // the words that matter most in each sentence
      var topLines = [];
      for (d = 0; d < n; d++) {
        var row = mat[d], best = 0;
        for (k = 0; k < row.length; k++) best = Math.max(best, row[k]);
        if (best <= 0) { topLines.push('<li>Sentence ' + (d + 1) + ': no words.</li>'); continue; }
        var winners = vocab.filter(function (v, k3) { return Math.abs(row[k3] - best) < 1e-9; }).map(function (v) { return v.word; });
        var nw = tokens(S.sentences[d]).length;
        topLines.push('<li>Sentence ' + (d + 1) + ': ' + (S.tf === 'bow' && winners.length === new Set(tokens(S.sentences[d])).size && nw > 1 ?
          'every word has the same count, so nothing stands out.' :
          'highest ' + (S.tf === 'bow' ? 'count' : 'score') + ' ' + fx(best, dec) + ' for ' + winners.slice(0, 4).map(function (w) { return '“' + esc(w) + '”'; }).join(', ') + (winners.length > 4 ? ' and ' + (winners.length - 4) + ' more' : '') + '.') + '</li>');
      }
      // sentence-to-sentence cosine similarity, both ways
      function simRow(x, y) {
        var b = cosine(B.bow[x], B.bow[y]), t = cosine(B.tfidf[x], B.tfidf[y]);
        return '<tr><th scope="row" style="text-align:left;padding:3px 8px 3px 0;font-weight:600;white-space:nowrap">' + (x + 1) + ' and ' + (y + 1) + '</th><td class="mono num" style="text-align:right;padding:3px 8px">' + fx(b, 2) + '</td><td class="mono num" style="text-align:right;padding:3px 0 3px 8px">' + fx(t, 2) + '</td></tr>';
      }
      var common = vocab.filter(function (v) { return v.df === n; }).map(function (v) { return '“' + esc(v.word) + '”'; });
      var explain = common.length ?
        common.join(', ') + (common.length > 1 ? ' are' : ' is') + ' in all ' + n + ' sentences, so ' + (common.length > 1 ? 'their' : 'its') + ' idf is the smallest possible, ln(4 ÷ 4) + 1 = 1.00. A word found in just one sentence gets ln(4 ÷ 2) + 1 = ' + fx(idfOf(n, 1), 2) + '. So TF-IDF turns common words down and lets the words that make each sentence different stand out.' :
        'No word is in all ' + n + ' sentences right now. Add the same word (for example “the”) to every sentence and watch its idf drop to the smallest possible value, 1.00.';
      elTBody.innerHTML =
        '<p class="small"><b>' + what + '.</b> S1, S2, S3 = sentences 1 to 3. df = how many sentences contain the word (<span aria-hidden="true" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--haldi);margin:0 3px"></span>marks words found in every sentence).</p>' + table +
        '<p class="small">' + explain + '</p>' +
        '<ul class="small" style="padding-left:1.1em">' + topLines.join('') + '</ul>' +
        '<h2 class="lab-h" style="margin-top:6px">How alike are the sentences? (cosine similarity)</h2>' +
        '<div class="table-wrap" style="width:0;min-width:100%"><table style="border-collapse:collapse;font-size:.9rem"><caption class="visually-hidden">Cosine similarity between sentences with counts and with TF-IDF</caption>' +
          '<thead><tr><th scope="col" style="text-align:left;padding:3px 8px 3px 0;font-size:.78rem;color:var(--muted)">Sentences</th><th scope="col" style="text-align:right;padding:3px 8px;font-size:.78rem;color:var(--muted)">Counts</th><th scope="col" style="text-align:right;padding:3px 0 3px 8px;font-size:.78rem;color:var(--muted)">TF-IDF</th></tr></thead>' +
          '<tbody>' + simRow(0, 1) + simRow(0, 2) + simRow(1, 2) + '</tbody></table></div>' +
        '<p class="small muted">With counts, shared filler words such as “the” make every pair of sentences look alike. TF-IDF shrinks them, so similarity depends more on the words that carry the meaning. (Scaling to length 1 does not change cosine similarity.)</p>';
      markScrollers();
    }

    /* ---------- the map: geometry ---------- */
    function geom() {
      var small = dims.w < 480;
      var pl = small ? 24 : 30, pr = 8, pt = 8, pb = small ? 26 : 30;
      var pw = Math.max(20, dims.w - pl - pr), ph = Math.max(20, dims.h - pt - pb);
      var mx = small ? 0.06 : 0.08;
      var sx = pw / (M.width * (1 + 2 * mx)), sy = ph / ((M.maxY - M.minY) * (1 + 2 * mx));
      return { small: small, pl: pl, pt: pt, pw: pw, ph: ph, s: Math.min(sx, sy), cx: (M.minX + M.maxX) / 2, cy: (M.minY + M.maxY) / 2, r: small ? 4.4 : 5.2 };
    }
    function toPx(G, p) { return [G.pl + G.pw / 2 + (p[0] - G.cx) * G.s, G.pt + G.ph / 2 - (p[1] - G.cy) * G.s]; }
    function font(T, px, w) { return (w || '400') + ' ' + px + 'px ' + T.font; }

    /* ---------- the map: which words are involved in the current view ---------- */
    function involved() {
      var inv = {}, badges = {}, i;
      if (S.mode === 'nbrs') {
        inv[S.sel] = 'sel';
        nearest(S.sel, S.rank).forEach(function (r, k) { inv[r.i] = 'nb'; badges[r.i] = String(k + 1); });
      } else if (S.mode === 'analogy') {
        ['A', 'B', 'C'].forEach(function (b, k) { i = S.ana[k]; inv[i] = 'abc'; badges[i] = badges[i] ? badges[i] + b : b; });
        if (A && A.best >= 0 && !inv[A.best]) { inv[A.best] = 'best'; }
      } else {
        inv[S.cmp[0]] = 'cmp'; badges[S.cmp[0]] = '1';
        if (S.cmp[1] !== S.cmp[0]) { inv[S.cmp[1]] = 'cmp'; badges[S.cmp[1]] = '2'; } else badges[S.cmp[0]] = '1 2';
      }
      return { inv: inv, badges: badges };
    }

    /* ---------- the map: drawing ---------- */
    function arrow(x0, y0, x1, y1, col, width, dash) {
      var dx = x1 - x0, dy = y1 - y0, L = Math.sqrt(dx * dx + dy * dy);
      if (L < 2) return;
      var ux = dx / L, uy = dy / L, head = Math.min(10, L * 0.4);
      g.save();
      g.strokeStyle = col; g.fillStyle = col; g.lineWidth = width; g.lineCap = 'round';
      if (dash) g.setLineDash(dash);
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1 - ux * head * 0.8, y1 - uy * head * 0.8); g.stroke();
      g.setLineDash([]);
      g.beginPath(); g.moveTo(x1, y1);
      g.lineTo(x1 - ux * head - uy * head * 0.5, y1 - uy * head + ux * head * 0.5);
      g.lineTo(x1 - ux * head + uy * head * 0.5, y1 - uy * head - ux * head * 0.5);
      g.closePath(); g.fill();
      g.restore();
    }
    function rectsOverlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
    // does segment s = [x0, y0, x1, y1] pass through rectangle b? (clip the segment to the box)
    function segHitsRect(sg, b) {
      var t0 = 0, t1 = 1, dx = sg[2] - sg[0], dy = sg[3] - sg[1];
      var pp = [-dx, dx, -dy, dy], qq = [sg[0] - b.x, b.x + b.w - sg[0], sg[1] - b.y, b.y + b.h - sg[1]];
      for (var m = 0; m < 4; m++) {
        if (pp[m] === 0) { if (qq[m] < 0) return false; continue; }
        var t = qq[m] / pp[m];
        if (pp[m] < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
      }
      return t1 - t0 > 1e-6;
    }
    function segsCross(a, b) {
      function side(ax, ay, bx, by, cx, cy) { return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax); }
      var d1 = side(a[0], a[1], a[2], a[3], b[0], b[1]), d2 = side(a[0], a[1], a[2], a[3], b[2], b[3]);
      var d3 = side(b[0], b[1], b[2], b[3], a[0], a[1]), d4 = side(b[0], b[1], b[2], b[3], a[2], a[3]);
      return d1 * d2 < 0 && d3 * d4 < 0;
    }
    function segNearPoint(sg, pt, rad) {
      var dx = sg[2] - sg[0], dy = sg[3] - sg[1], L2 = dx * dx + dy * dy;
      var t = L2 > 0 ? clamp(((pt[0] - sg[0]) * dx + (pt[1] - sg[1]) * dy) / L2, 0, 1) : 0;
      var ex = sg[0] + t * dx - pt[0], ey = sg[1] + t * dy - pt[1];
      return ex * ex + ey * ey < rad * rad;
    }
    function draw() {
      rafId = 0;
      if (destroyed || dims.w < 4) return;
      var T = readTheme(), G = geom(), W = dims.w, H = dims.h, dpr = dims.dpr, i;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = rgb(T.surface);
      g.fillRect(0, 0, W, H);
      screenPos = M.xy.map(function (p) { return toPx(G, p); });
      var info = involved(), inv = info.inv, active = true;

      // axes through the average word (PCA puts it at 0, 0)
      var o = toPx(G, [0, 0]);
      g.strokeStyle = rgb(T.line); g.lineWidth = 1;
      g.beginPath();
      g.moveTo(G.pl, Math.round(o[1]) + 0.5); g.lineTo(G.pl + G.pw, Math.round(o[1]) + 0.5);
      g.moveTo(Math.round(o[0]) + 0.5, G.pt); g.lineTo(Math.round(o[0]) + 0.5, G.pt + G.ph);
      g.stroke();
      var ax1 = axisWords(M.e1), ax2 = axisWords(M.e2), fs = G.small ? 11 : 12;
      g.font = font(T, fs, '600'); g.fillStyle = rgb(T.muted); g.textBaseline = 'bottom'; g.textAlign = 'center';
      g.fillText('PC1 (' + pct1 + '%):  ← ' + ax1.neg.join(', ') + '   ·   ' + ax1.pos.join(', ') + ' →', G.pl + G.pw / 2, H - 6);
      g.save();
      g.translate(fs * 0.5 + 5, G.pt + G.ph / 2); g.rotate(-Math.PI / 2);
      g.textBaseline = 'middle';
      g.fillText('PC2 (' + pct2 + '%):  ← ' + ax2.neg.join(', ') + '   ·   ' + ax2.pos.join(', ') + ' →', 0, 0);
      g.restore();

      // overlay lines (under the dots)
      var ink = rgb(T.ink), starXY = null, starOff = false;
      if (S.mode === 'nbrs') {
        var sp = screenPos[S.sel];
        nearest(S.sel, S.rank).forEach(function (r) {
          var p2 = screenPos[r.i];
          g.beginPath(); g.moveTo(sp[0], sp[1]); g.lineTo(p2[0], p2[1]);
          g.lineWidth = 3.5; g.strokeStyle = rgb(T.surface, 0.9); g.stroke();
          g.lineWidth = 1.6; g.strokeStyle = rgb(T.ink, 0.55); g.stroke();
        });
      } else if (S.mode === 'analogy' && A) {
        var pa = screenPos[S.ana[0]], pb = screenPos[S.ana[1]], pc = screenPos[S.ana[2]];
        starXY = toPx(G, A.xy);
        var sx = clamp(starXY[0], G.pl + 8, G.pl + G.pw - 8), sy = clamp(starXY[1], G.pt + 8, G.pt + G.ph - 8);
        starOff = sx !== starXY[0] || sy !== starXY[1];
        starXY = [sx, sy];
        arrow(pb[0], pb[1], pc[0], pc[1], rgb(T.muted), 1.6, [5, 4]);
        if (!starOff) arrow(pa[0], pa[1], starXY[0], starXY[1], ink, 2, null);
      } else if (S.mode === 'compare' && S.cmp[0] !== S.cmp[1]) {
        var p1 = screenPos[S.cmp[0]], p2b = screenPos[S.cmp[1]];
        g.save();
        g.beginPath(); g.moveTo(p1[0], p1[1]); g.lineTo(p2b[0], p2b[1]);
        g.lineWidth = 2; g.strokeStyle = rgb(T.ink, 0.75); g.setLineDash([6, 4]); g.stroke();
        g.restore();
      }

      // dots: words outside the current view are faded so the involved ones stand out
      var r = G.r;
      function drawDot(j, alpha) {
        var p = screenPos[j], c = catOf(j);
        g.globalAlpha = alpha;
        g.beginPath(); shapePath(g, CATS[c].shape, p[0], p[1], r);
        g.fillStyle = rgb(T.cat[c]); g.fill();
        g.lineWidth = 1.2; g.strokeStyle = rgb(T.surface); g.stroke();
        g.globalAlpha = 1;
      }
      for (i = 0; i < NW; i++) if (!inv[i]) drawDot(i, active ? 0.5 : 1);
      for (i = 0; i < NW; i++) if (inv[i]) drawDot(i, 1);
      // rings round the main word(s)
      function ring(j, col, w, extra) {
        var p = screenPos[j];
        g.beginPath(); g.arc(p[0], p[1], r + (extra || 4.5), 0, Math.PI * 2);
        g.lineWidth = w; g.strokeStyle = col; g.stroke();
      }
      if (S.mode === 'nbrs') ring(S.sel, ink, 2.2);
      if (S.mode === 'compare') { ring(S.cmp[0], ink, 2); ring(S.cmp[1], ink, 2); }
      if (S.mode === 'analogy' && A && A.best >= 0) ring(A.best, rgb(T.haldi), 2.6, 5);
      if (starXY) {
        g.beginPath(); starPath(g, starXY[0], starXY[1], G.small ? 8 : 9.5);
        g.fillStyle = starOff ? rgb(T.surface) : rgb(T.haldi); g.fill();
        g.lineWidth = 1.4; g.strokeStyle = ink; g.stroke();
      }
      if (S.hover >= 0) ring(S.hover, rgb(T.haldi), 2.2, 3.5);

      // labels: the words in focus first (forced: they always get a spot), then the ★ label, then as many
      // other words as fit without overlapping anything
      var placed = [], leaders = [], labels = [], fsL = G.small ? 11.5 : 12.5, h = fsL + 4, badgeR = 7.5;
      var obstacles = screenPos.map(function (p) { return { x: p[0] - r - 1, y: p[1] - r - 1, w: 2 * r + 2, h: 2 * r + 2 }; });
      var starBox = starXY ? { x: starXY[0] - 10, y: starXY[1] - 10, w: 20, h: 20 } : null;
      // the arrows / line of the current view: labels try not to sit on them
      var segs = [];
      if (S.mode === 'analogy' && A) {
        segs.push(screenPos[S.ana[1]].concat(screenPos[S.ana[2]]));
        if (starXY && !starOff) segs.push(screenPos[S.ana[0]].concat(starXY));
      } else if (S.mode === 'compare' && S.cmp[0] !== S.cmp[1]) segs.push(screenPos[S.cmp[0]].concat(screenPos[S.cmp[1]]));
      // find the best free spot for a label of width w next to point p
      function place(p, w, self, forced, off, rings, ignoreSegs) {
        var cands = [
          [off, -h / 2], [-off - w, -h / 2], [-w / 2, -off - h], [-w / 2, off],
          [off - 2, -off - h + 3], [off - 2, off - 3], [-off - w + 2, -off - h + 3], [-off - w + 2, off - 3]
        ];
        var nearCount = cands.length;
        // further spots, joined to the point by a thin leader line
        rings.forEach(function (d) {
          cands.push([d, -h / 2], [-d - w, -h / 2], [-w / 2, -d - h], [-w / 2, d], [d * 0.7, -d * 0.7 - h], [d * 0.7, d * 0.7], [-d * 0.7 - w, -d * 0.7 - h], [-d * 0.7 - w, d * 0.7]);
        });
        var best = null, bestScore = Infinity, c, k;
        for (c = 0; c < cands.length; c++) {
          var rect = { x: p[0] + cands[c][0], y: p[1] + cands[c][1], w: w, h: h };
          // stay inside the plot, clear of the axis titles
          if (rect.x < G.pl - 4 || rect.y < 2 || rect.x + rect.w > W - 2 || rect.y + rect.h > H - (G.small ? 22 : 26)) continue;
          var far = c >= nearCount, lead = null, score = c * 0.01, bad = 0;
          if (far) lead = [p[0], p[1], clamp(p[0], rect.x, rect.x + rect.w), clamp(p[1], rect.y, rect.y + rect.h)];
          for (k = 0; k < placed.length; k++) {
            if (rectsOverlap(rect, placed[k])) bad += 10;
            if (lead && segHitsRect(lead, placed[k])) bad += 6;
          }
          for (k = 0; k < leaders.length; k++) {
            if (segHitsRect(leaders[k], rect)) bad += 6;
            if (lead && segsCross(lead, leaders[k])) bad += 6;
          }
          for (k = 0; k < NW; k++) {
            if (k === self) continue;
            if (rectsOverlap(rect, obstacles[k])) bad += inv[k] ? 3 : 1;
            else if (lead && segNearPoint(lead, screenPos[k], r + 1)) bad += 2;
          }
          if (starBox && self !== -2 && rectsOverlap(rect, starBox)) bad += 3;
          if (!ignoreSegs) for (k = 0; k < segs.length; k++) if (segHitsRect(segs[k], rect)) bad += 2;
          if (!forced && bad > 0) continue;
          score += bad;
          if (score < bestScore) { bestScore = score; best = { rect: rect, lead: lead }; }
        }
        if (best) { placed.push(best.rect); if (best.lead) leaders.push(best.lead); }
        return best;
      }
      var order = [], seen = {};
      function push(j, forced) { if (j >= 0 && !seen[j]) { seen[j] = true; order.push({ i: j, forced: forced }); } }
      if (S.hover >= 0) push(S.hover, true);
      Object.keys(inv).forEach(function (key) { push(+key, true); });
      if (starXY) order.push({ i: -2, forced: true });
      LABEL_FIRST.forEach(function (nm) { push(indexOf(nm), false); });
      for (i = 0; i < NW; i++) push(i, false);
      order.forEach(function (it) {
        var j = it.i, spot;
        if (j === -2) {
          // the label of the analogy result star
          var st = starOff ? 'A − B + C (off the map)' : 'A − B + C';
          g.font = font(T, fsL, '700');
          spot = place(starXY, g.measureText(st).width + 4, -2, true, 13, [24, 38], false);
          if (spot) labels.push({ text: st, rect: spot.rect, lead: spot.lead, bold: true, badge: '', bw: 0, muted: false });
          return;
        }
        var p = screenPos[j], bold = !!inv[j] || j === S.hover, badge = info.badges[j] || '';
        g.font = font(T, 10, '700');
        var bw = badge ? Math.max(2 * badgeR, g.measureText(badge).width + 8) : 0;
        g.font = font(T, fsL, bold ? '700' : '400');
        var w = g.measureText(nameOf(j)).width + (badge ? bw + 4 : 0) + 4;
        var ringed = (S.mode === 'nbrs' && j === S.sel) || (S.mode === 'compare' && (j === S.cmp[0] || j === S.cmp[1])) || (S.mode === 'analogy' && A && j === A.best) || j === S.hover;
        // far spots: always for the words in focus, only one ring out for the others, none for the others on a small map
        spot = place(p, w, j, it.forced, r + (ringed ? 8 : 3), it.forced ? [16, 28, 42] : (G.small ? [] : [17]), false);
        if (spot) labels.push({ text: nameOf(j), rect: spot.rect, lead: spot.lead, bold: bold, badge: badge, bw: bw, muted: active && !inv[j] && j !== S.hover });
      });
      // the share-of-width label on the compare line, only where it fits cleanly
      if (S.mode === 'compare' && S.cmp[0] !== S.cmp[1]) {
        var a1 = screenPos[S.cmp[0]], a2 = screenPos[S.cmp[1]], cs = cmpStats();
        var txt = Math.round(cs.share * 100) + '% of width';
        g.font = font(T, 11, '600');
        var mw = g.measureText(txt).width + 4;
        if (Math.hypot(a1[0] - a2[0], a1[1] - a2[1]) > mw + 30) {
          var spotM = place([(a1[0] + a2[0]) / 2, (a1[1] + a2[1]) / 2], mw, -3, false, 4, [], true);
          if (spotM) labels.push({ text: txt, rect: spotM.rect, lead: null, bold: true, badge: '', bw: 0, muted: false, small: true });
        }
      }
      // leader lines for labels pushed away from their point
      labels.forEach(function (L) {
        if (!L.lead) return;
        g.beginPath(); g.moveTo(L.lead[0], L.lead[1]); g.lineTo(L.lead[2], L.lead[3]);
        g.lineWidth = 1; g.strokeStyle = rgb(T.muted); g.stroke();
      });
      g.textBaseline = 'middle'; g.textAlign = 'left'; g.lineJoin = 'round';
      labels.forEach(function (L) {
        var x = L.rect.x + 2, y = L.rect.y + L.rect.h / 2;
        if (L.badge) {
          g.beginPath();
          var bx = x, bw2 = L.bw;
          g.moveTo(bx + badgeR, y - badgeR); g.lineTo(bx + bw2 - badgeR, y - badgeR);
          g.arc(bx + bw2 - badgeR, y, badgeR, -Math.PI / 2, Math.PI / 2); g.lineTo(bx + badgeR, y + badgeR);
          g.arc(bx + badgeR, y, badgeR, Math.PI / 2, Math.PI * 1.5); g.closePath();
          g.fillStyle = rgb(T.indigo); g.fill();
          g.font = font(T, 10, '700'); g.fillStyle = rgb(T.surface); g.textAlign = 'center';
          g.fillText(L.badge, bx + bw2 / 2, y + 0.5);
          g.textAlign = 'left';
          x += bw2 + 4;
        }
        g.font = L.small ? font(T, 11, '600') : font(T, fsL, L.bold ? '700' : '400');
        g.lineWidth = 3.2; g.strokeStyle = rgb(T.surface, 0.92);
        g.strokeText(L.text, x, y + 0.5);
        g.fillStyle = L.muted ? rgb(T.muted) : ink;
        g.fillText(L.text, x, y + 0.5);
      });
    }
    function requestDraw() { if (!rafId && !destroyed) rafId = requestAnimationFrame(draw); }

    /* ---------- readout + accessible description ---------- */
    function listText(list, by) {
      return list.map(function (r) { return nameOf(r.i) + ' ' + (by === 'euc' ? fx(r.eu, 2) : fx(r.cos, 3)); }).join(', ');
    }
    function updateText() {
      var s, label = 'Map of ' + NW + ' words, flattened from ' + ND + ' numbers to 2 with PCA, keeping ' + pctAll + '% of the spread. ' +
        'Places are to the right, people to the left and food at the top. ';
      if (S.mode === 'nbrs') {
        var list = nearest(S.sel, S.rank);
        s = '<b>' + esc(nameOf(S.sel)) + '</b> (' + KINDS[WORDS[S.sel][1]].label + '). Nearest by ' + (S.rank === 'euc' ? 'Euclidean distance' : 'cosine similarity') + ': ' +
          esc(listText(list, S.rank)) + '. Lines on the map join ' + esc(nameOf(S.sel)) + ' to these ' + NN_K + ' words, numbered 1 to ' + NN_K + '.';
        label += 'Selected: ' + nameOf(S.sel) + '. Lines go to its ' + NN_K + ' nearest words: ' + list.map(function (r) { return nameOf(r.i); }).join(', ') + '.';
      } else if (S.mode === 'analogy') {
        s = A.zero ? esc(eqText()) + ' is all zeros.' : esc(eqText()) + ' lands at the ★. Nearest word: <b>' + esc(nameOf(A.best)) + '</b> (cosine ' + fx(A.list[0].cos, 3) + '). The dashed arrow goes from B to C; the solid one from A to the ★ is the same move.';
        label += 'Analogy ' + eqText() + (A.zero ? ': all zeros.' : '. The star marks the result; the nearest word is ' + nameOf(A.best) + '.');
      } else {
        var c = cmpStats();
        s = c.p === c.q ? 'Pick two different words to compare.' : '<b>' + esc(nameOf(c.p)) + '</b> and <b>' + esc(nameOf(c.q)) + '</b>: cosine similarity ' + fx(c.cos, 3) + ', Euclidean distance ' + fx(c.eu, 2) + ', gap on the map ' + fx(c.map, 2) + ' (' + Math.round(c.share * 100) + '% of the map’s width).';
        label += c.p === c.q ? 'Compare: the same word twice.' : 'Comparing ' + nameOf(c.p) + ' and ' + nameOf(c.q) + ': cosine ' + fx(c.cos, 2) + ', ' + Math.round(c.share * 100) + '% of the map width apart.';
      }
      elReadout.innerHTML = s;
      canvas.setAttribute('aria-label', label);
      markScrollers();
    }
    // a table box that scrolls must be reachable by keyboard; one that fits needs no extra tab stop
    function markScrollers() {
      if (destroyed) return;
      Array.prototype.forEach.call(top.querySelectorAll('.table-wrap'), function (el) {
        var scrolls = el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;
        if (scrolls && !el.hasAttribute('tabindex')) {
          var cap = el.querySelector('caption');
          el.setAttribute('tabindex', '0'); el.setAttribute('role', 'region');
          el.setAttribute('aria-label', (cap ? cap.textContent : 'Table') + ' (scrollable)');
        } else if (!scrolls && el.hasAttribute('tabindex')) {
          el.removeAttribute('tabindex'); el.removeAttribute('role'); el.removeAttribute('aria-label');
        }
      });
    }

    /* ---------- changes ---------- */
    function setModeBtns() {
      Array.prototype.forEach.call(modeBtns, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === S.mode)); });
    }
    function setMode(m) {
      if (S.mode === m) return;
      S.mode = m; setModeBtns(); updateText(); requestDraw();
    }
    function selectWord(i, how) {
      i = clamp(i | 0, 0, NW - 1);
      var changed = i !== S.sel;
      S.sel = i;
      if (selWord.value !== String(i)) selWord.value = String(i);
      S.mode = 'nbrs'; setModeBtns();
      renderNbrs(); updateText(); requestDraw();
      if (how !== 'init' && nameOf(i) === 'Mumbai' && S.rank === 'cos') completeTask('t1');
      if (how !== 'init' && (changed || how === 'select')) {
        announce(nameOf(i) + ' selected. Nearest by ' + (S.rank === 'euc' ? 'Euclidean distance' : 'cosine similarity') + ': ' + listText(nearest(i, S.rank), S.rank) + '.', how !== 'key');
      }
    }
    function setAnalogy(a, b, c, how) {
      S.ana = [a, b, c];
      selA.value = String(a); selB.value = String(b); selC.value = String(c);
      computeAnalogy(); renderAnalogy();
      if (how !== 'init') { S.mode = 'analogy'; setModeBtns(); }
      updateText(); requestDraw();
      if (how === 'init') return;
      var nm = S.ana.map(nameOf).join('|');
      if (nm === 'king|man|woman') completeTask('t2');
      if (nm === 'Paris|France|India') completeTask('t3');
      announce(A.zero ? eqText() + ' gives all zeros.' : eqText() + ' is nearest to ' + nameOf(A.best) + ', cosine ' + fx(A.list[0].cos, 3) + '.', true);
    }
    function setCompare(p, qq, how) {
      S.cmp = [p, qq];
      selP.value = String(p); selQ.value = String(qq);
      var c = renderCompare();
      if (how !== 'init') { S.mode = 'compare'; setModeBtns(); }
      updateText(); requestDraw();
      if (how === 'init') return;
      if (c.p !== c.q && c.cos >= HIGH_COS && c.share >= FAR_SHARE) completeTask('t4');
      announce(c.p === c.q ? 'Same word twice.' : nameOf(c.p) + ' and ' + nameOf(c.q) + ': cosine ' + fx(c.cos, 2) + ', Euclidean ' + fx(c.eu, 2) + ', ' + Math.round(c.share * 100) + ' percent of the map width apart.', true);
    }
    function setRank(by) {
      if (S.rank === by) return;
      S.rank = by;
      Array.prototype.forEach.call(rankBtns, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-rank') === by)); });
      renderNbrs();
      S.mode = 'nbrs'; setModeBtns();
      updateText(); requestDraw();
      if (by === 'cos' && nameOf(S.sel) === 'Mumbai') completeTask('t1');
      announce('Ranked by ' + (by === 'euc' ? 'Euclidean distance' : 'cosine similarity') + ': ' + listText(nearest(S.sel, by), by) + '.', true);
    }
    function setTf(mode) {
      S.tf = mode;
      Array.prototype.forEach.call(tfBtns, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-tf') === mode)); });
      chkL2.disabled = mode === 'bow';
      renderTfidf();
    }

    /* ---------- pointer + keyboard on the map ---------- */
    function localPos(e) { var rc = canvas.getBoundingClientRect(); return [e.clientX - rc.left, e.clientY - rc.top]; }
    function hitList(x, y, radius) {
      var out = [];
      for (var i = 0; i < screenPos.length; i++) {
        var dx = screenPos[i][0] - x, dy = screenPos[i][1] - y, d = Math.sqrt(dx * dx + dy * dy);
        if (d <= radius) out.push({ i: i, d: d });
      }
      out.sort(function (a, b) { return a.d - b.d || a.i - b.i; });
      return out.map(function (o) { return o.i; });
    }
    function setHover(i) {
      if (i === S.hover) return;
      S.hover = i;
      canvas.style.cursor = i >= 0 ? 'pointer' : 'default';
      requestDraw();
    }
    var ptr = { id: null, x: 0, y: 0, moved: false, type: '' };
    on(canvas, 'pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      ptr.id = e.pointerId; ptr.x = e.clientX; ptr.y = e.clientY; ptr.moved = false; ptr.type = e.pointerType;
    });
    on(canvas, 'pointermove', function (e) {
      if (ptr.id === e.pointerId && Math.abs(e.clientX - ptr.x) + Math.abs(e.clientY - ptr.y) > 10) ptr.moved = true;
      if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
        var p = localPos(e), hits = hitList(p[0], p[1], geom().r + 6);
        setHover(hits.length ? hits[0] : -1);
      }
    });
    on(canvas, 'pointerup', function (e) {
      if (ptr.id !== e.pointerId) return;
      ptr.id = null;
      if (ptr.moved) return;
      var p = localPos(e), hits = hitList(p[0], p[1], ptr.type === 'mouse' ? geom().r + 6 : geom().r + 16);
      if (!hits.length) return;
      // tapping a spot where several dots overlap steps through them
      var k = S.mode === 'nbrs' ? hits.indexOf(S.sel) : -1;
      selectWord(k >= 0 ? hits[(k + 1) % hits.length] : hits[0], 'tap');
    });
    on(canvas, 'pointercancel', function () { ptr.id = null; });
    on(canvas, 'pointerleave', function (e) { if (e.pointerType === 'mouse' || e.pointerType === 'pen') setHover(-1); });
    on(canvas, 'keydown', function (e) {
      var dir = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (!dir) return;
      e.preventDefault();
      if (!screenPos.length) return;
      var from = S.sel, p0 = screenPos[from], best = -1, bestScore = Infinity;
      for (var i = 0; i < NW; i++) {
        if (i === from) continue;
        var dx = screenPos[i][0] - p0[0], dy = screenPos[i][1] - p0[1];
        var along = dx * dir[0] + dy * dir[1], across = Math.abs(dx * dir[1] - dy * dir[0]);
        if (along <= 0.5) continue;
        var sc = along + 2.2 * across;
        if (sc < bestScore) { bestScore = sc; best = i; }
      }
      setHover(-1);
      if (best >= 0) selectWord(best, 'key');
      else announce('No word further in that direction. ' + nameOf(S.sel) + ' is still selected.', true);
    });

    /* ---------- controls ---------- */
    on(selWord, 'change', function () { selectWord(+selWord.value, 'select'); });
    [selA, selB, selC].forEach(function (s) { on(s, 'change', function () { setAnalogy(+selA.value, +selB.value, +selC.value, 'select'); }); });
    [selP, selQ].forEach(function (s) { on(s, 'change', function () { setCompare(+selP.value, +selQ.value, 'select'); }); });
    Array.prototype.forEach.call(modeBtns, function (b) { on(b, 'click', function () { setMode(b.getAttribute('data-mode')); }); });
    Array.prototype.forEach.call(rankBtns, function (b) { on(b, 'click', function () { setRank(b.getAttribute('data-rank')); }); });
    Array.prototype.forEach.call(top.querySelectorAll('[data-preset]'), function (b) {
      on(b, 'click', function () { var pr = PRESETS[+b.getAttribute('data-preset')]; setAnalogy(indexOf(pr[0]), indexOf(pr[1]), indexOf(pr[2]), 'preset'); });
    });
    // word buttons inside the result cards (they are re-rendered, so listen on the container)
    on(top, 'click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('[data-pick]') : null;
      if (t && top.contains(t)) selectWord(+t.getAttribute('data-pick'), 'select');
    });
    Array.prototype.forEach.call(tfBtns, function (b) { on(b, 'click', function () { setTf(b.getAttribute('data-tf')); }); });
    on(chkL2, 'change', function () { S.l2 = chkL2.checked; renderTfidf(); });
    inS.forEach(function (inp, k) { on(inp, 'input', function () { S.sentences[k] = inp.value; renderTfidf(); }); });

    /* ---------- theme, fonts, resize ---------- */
    function onTheme() { themeCache.key = ''; requestDraw(); }
    var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mql) { if (mql.addEventListener) mql.addEventListener('change', onTheme); else if (mql.addListener) mql.addListener(onTheme); }
    on(document, 'themechange', onTheme);
    function onFonts() { if (!destroyed) requestDraw(); }
    var fontSet = document.fonts && document.fonts.addEventListener ? document.fonts : null;
    if (fontSet) {
      on(fontSet, 'loadingdone', onFonts);
      if (fontSet.ready && fontSet.ready.then) fontSet.ready.then(onFonts, function () { /* ignore */ });
    }
    function wantAspect() { return wrap.getBoundingClientRect().width < 520 ? '1 / 1' : ''; }
    function applyAspect() {
      aspectRaf = 0;
      if (destroyed) return;
      var want = wantAspect();
      if (want !== curAspect) { curAspect = want; wrap.style.aspectRatio = want; }
    }
    function resize() {
      if (destroyed) return;
      // changing the wrapper's own size inside a ResizeObserver callback would loop, so defer that
      if (wantAspect() !== curAspect && !aspectRaf) aspectRaf = requestAnimationFrame(applyAspect);
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      var rc = wrap.getBoundingClientRect(), w = Math.max(1, Math.round(rc.width)), h = Math.max(1, Math.round(rc.height));
      if (w !== dims.w || h !== dims.h || dpr !== dims.dpr) {
        dims.w = w; dims.h = h; dims.dpr = dpr;
        canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
        // resizing clears the canvas: repaint now so there is no blank frame
        if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
        draw();
        markScrollers();
      }
    }
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { resize(); }); ro.observe(wrap); }
    else on(window, 'resize', resize);

    /* ---------- starting state: dosa selected, Chennai − Tamil Nadu + Maharashtra, prince vs woman ---------- */
    setTf('tfidf');
    setAnalogy(a0[0], a0[1], a0[2], 'init');
    setCompare(c0[0], c0[1], 'init');
    selectWord(iStart, 'init');
    applyAspect();
    resize();

    return {
      destroy: function () {
        if (destroyed) return;
        destroyed = true;
        if (rafId) cancelAnimationFrame(rafId);
        if (aspectRaf) cancelAnimationFrame(aspectRaf);
        if (liveTimer) clearTimeout(liveTimer);
        rafId = 0; aspectRaf = 0; liveTimer = 0;
        if (ro) ro.disconnect();
        if (mql) { if (mql.removeEventListener) mql.removeEventListener('change', onTheme); else if (mql.removeListener) mql.removeListener(onTheme); }
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
        listeners = [];
        // remove only this lab's own element, never a newer lab mounted into the same root
        if (top.parentNode) top.parentNode.removeChild(top);
      }
    };
  }

  Labs.embeddings = {
    id: 'embeddings',
    module: 'l3-nlp',
    title: 'Word embeddings: words as vectors',
    summary: 'Explore 50 words as hand-made 10-number vectors on a 2-D PCA map, find nearest words by cosine similarity, solve analogies like king − man + woman, and see why TF-IDF turns down common words.',
    tasks: TASKS.map(function (t) { return { id: t.id, text: t.text }; }),
    mount: mount
  };
})();
