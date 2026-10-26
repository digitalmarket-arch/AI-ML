/* AI Marg lab: K-Means clustering as customer segmentation.
   Plain classic script (ES2019). Registers window.AILabs.kmeans. No libraries, no network. */
(function () {
  'use strict';
  var Labs = (window.AILabs = window.AILabs || {});
  var mountCount = 0;

  /* ---------- constants ---------- */
  var SPEND_MAX = 20;   // right edge of the plot = ₹20 thousand per month
  var VISITS_MAX = 30;  // top edge of the plot = 30 visits per month
  var K_MAX = 8;
  var MAX_POINTS = 400;
  var MAX_ITER = 100;
  var TWEEN_MS = 420;
  var FLASH_MS = 520;
  /* Extra cluster colours (groups 5 to 8) are derived from the theme's own series colours:
     same average saturation and lightness, different hue (magenta, purple, green, sky blue, chosen to stay
     clear of the theme's indigo, sindoor, haldi and teal). [hue, lightness shift] */
  var EXTRA_HUES = [[330, -0.05], [280, 0.08], [115, -0.02], [200, 0.1]];
  var MIN_MARK_CONTRAST = 3; // WCAG 1.4.11: markers need 3:1 against the plot background
  var SHAPES = ['circle', 'square', 'triangle', 'diamond', 'tri-down', 'hexagon', 'star', 'plus'];

  var DATASETS = [
    { id: 'blobs3', name: '3 clear groups', desc: 'Three kinds of shoppers: occasional (low spend, few visits), daily regulars (many small visits) and big-basket buyers (high spend, about 10 visits).' },
    { id: 'blobs5', name: '5 groups', desc: 'Five customer types. Can you spot K = 5 on the elbow chart?' },
    { id: 'uneven', name: 'Uneven group sizes', desc: 'One big, spread-out group and two small, tight groups.' },
    { id: 'moons', name: 'Two moons (K-Means fails)', desc: 'Two curved, interlocking shapes instead of round blobs. A made-up shape to test K-Means.' },
    { id: 'random', name: 'Random scatter', desc: 'No real groups at all. Watch K-Means split it anyway.' }
  ];

  var TASKS = [
    { id: 't1', text: 'Step by hand: press Assign, then Update, again and again until “Converged” says Yes.' },
    { id: 't2', text: 'On “3 clear groups”, find the bend (the “elbow”) in the elbow chart, set K to it and run to convergence.' },
    { id: 't3', text: 'With Random starting centres, Run (and “Run again”) until K-Means gets stuck with an inertia well above “Best for this K” (tip: “5 groups” with K = 5). Then switch to k-means++ and beat it.' },
    { id: 't4', text: 'Pick “Two moons”, set K = 2 and run. See K-Means cut the moons the wrong way.' }
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
  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function d2(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy; }
  function f3(v) { return v == null || !isFinite(v) ? '—' : v.toFixed(3); }
  function money(x) { return '₹' + (x * SPEND_MAX).toFixed(1) + 'k'; }
  function visits(y) { return (y * VISITS_MAX).toFixed(1); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* ---------- datasets (all in 0..1 "scaled" units on both axes) ---------- */
  function makeData(id) {
    var rnd = mulberry32(hashStr('kmeans-' + id));
    var pts = [];
    function blob(cx, cy, sx, sy, n, t) {
      for (var i = 0; i < n; i++) {
        pts.push({ x: clamp(cx + gauss(rnd) * sx, 0.02, 0.98), y: clamp(cy + gauss(rnd) * sy, 0.02, 0.98), t: t });
      }
    }
    var i;
    if (id === 'blobs3') {
      blob(0.17, 0.2, 0.055, 0.06, 50, 0);   // occasional shoppers: ₹3.4k, 6 visits
      blob(0.4, 0.72, 0.06, 0.065, 50, 1);   // daily regulars: ₹8k, 22 visits
      blob(0.76, 0.32, 0.06, 0.06, 50, 2);   // big-basket buyers: ₹15k, 10 visits
    } else if (id === 'blobs5') {
      blob(0.15, 0.2, 0.045, 0.05, 32, 0);
      blob(0.2, 0.76, 0.05, 0.05, 32, 1);
      blob(0.5, 0.48, 0.05, 0.05, 32, 2);
      blob(0.8, 0.8, 0.05, 0.045, 32, 3);
      blob(0.84, 0.22, 0.045, 0.05, 32, 4);
    } else if (id === 'uneven') {
      blob(0.34, 0.46, 0.12, 0.13, 110, 0);
      blob(0.76, 0.8, 0.035, 0.035, 16, 1);
      blob(0.8, 0.2, 0.035, 0.035, 16, 2);
    } else if (id === 'moons') {
      for (i = 0; i < 160; i++) {
        var upper = i % 2 === 0;
        var a = Math.PI * rnd();
        var mx = upper ? Math.cos(a) : 1 - Math.cos(a);
        var my = upper ? Math.sin(a) : 0.5 - Math.sin(a);
        mx += gauss(rnd) * 0.08; my += gauss(rnd) * 0.08;
        pts.push({ x: clamp(0.08 + (mx + 1) / 3 * 0.84, 0.02, 0.98), y: clamp(0.12 + (my + 0.5) / 1.5 * 0.76, 0.02, 0.98), t: upper ? 0 : 1 });
      }
    } else {
      for (i = 0; i < 130; i++) pts.push({ x: 0.04 + rnd() * 0.92, y: 0.04 + rnd() * 0.92, t: -1 });
    }
    return pts;
  }

  /* ---------- K-Means maths ---------- */
  // Assign every point to its nearest centre. Keeps the current label on exact ties (so it always terminates).
  function assignLabels(pts, cs, labels) {
    var changes = 0;
    for (var i = 0; i < pts.length; i++) {
      var cur = labels[i];
      var best = cur, bd = cur >= 0 && cur < cs.length ? d2(pts[i], cs[cur]) : Infinity;
      if (cur >= cs.length) best = -1;
      for (var j = 0; j < cs.length; j++) {
        var d = d2(pts[i], cs[j]);
        if (d < bd) { bd = d; best = j; }
      }
      if (best !== cur) { labels[i] = best; changes++; }
    }
    return changes;
  }
  // Move each centre to the mean (average) of its points. An empty group keeps its centre where it is.
  function meanCentres(pts, labels, cs) {
    var k = cs.length, sx = [], sy = [], n = [], j, i;
    for (j = 0; j < k; j++) { sx.push(0); sy.push(0); n.push(0); }
    for (i = 0; i < pts.length; i++) {
      var l = labels[i];
      if (l >= 0 && l < k) { sx[l] += pts[i].x; sy[l] += pts[i].y; n[l]++; }
    }
    var out = [];
    for (j = 0; j < k; j++) out.push(n[j] ? { x: sx[j] / n[j], y: sy[j] / n[j] } : { x: cs[j].x, y: cs[j].y });
    return { cs: out, counts: n };
  }
  // Inertia = within-cluster sum of squares = sum of squared distances from each point to its own centre.
  function inertiaOf(pts, labels, cs) {
    var s = 0;
    for (var i = 0; i < pts.length; i++) { var l = labels[i]; if (l >= 0 && l < cs.length) s += d2(pts[i], cs[l]); }
    return s;
  }
  // "Random" start (Forgy): K different customers picked at random become the starting centres.
  function initRandom(pts, k, rnd) {
    var idx = [], i;
    for (i = 0; i < pts.length; i++) idx.push(i);
    for (i = idx.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    var cs = [];
    for (i = 0; i < k; i++) { var p = pts[idx[i % idx.length]]; cs.push({ x: p.x, y: p.y }); }
    return cs;
  }
  // k-means++: first centre at random, each next one picked with chance proportional to (distance to nearest centre)^2.
  function initPP(pts, k, rnd) {
    var n = pts.length, cs = [], dist = new Float64Array(n), i;
    var first = pts[Math.floor(rnd() * n)];
    cs.push({ x: first.x, y: first.y });
    for (i = 0; i < n; i++) dist[i] = d2(pts[i], cs[0]);
    while (cs.length < k) {
      var sum = 0;
      for (i = 0; i < n; i++) sum += dist[i];
      var pick = n - 1;
      if (sum <= 0) pick = Math.floor(rnd() * n);
      else {
        var r = rnd() * sum, acc = 0;
        for (i = 0; i < n; i++) { acc += dist[i]; if (acc >= r) { pick = i; break; } }
      }
      var c = { x: pts[pick].x, y: pts[pick].y };
      cs.push(c);
      for (i = 0; i < n; i++) { var d = d2(pts[i], c); if (d < dist[i]) dist[i] = d; }
    }
    return cs;
  }
  function lloyd(pts, cs, maxIter) {
    var labels = [], i;
    for (i = 0; i < pts.length; i++) labels.push(-1);
    for (var it = 0; it < maxIter; it++) {
      var ch = assignLabels(pts, cs, labels);
      if (ch === 0 && it > 0) break;
      cs = meanCentres(pts, labels, cs).cs;
    }
    return { cs: cs, labels: labels, inertia: inertiaOf(pts, labels, cs) };
  }

  /* ---------- colour helpers ---------- */
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
  function rgbToHsl(c) {
    var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), h = 0, s = 0, l = (mx + mn) / 2;
    if (mx !== mn) {
      var d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return [h, s, l];
  }
  function hslToRgb(h, s, l) {
    function f(n) {
      var k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
      return Math.round((l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255);
    }
    return [f(0), f(8), f(4)];
  }
  function rgbStr(c, a) { return a == null ? 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')' : 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function luminance(c) {
    function ch(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2]);
  }
  function contrast(a, b) { var la = luminance(a), lb = luminance(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); }
  // darken (light theme) or lighten (dark theme) a colour, keeping its hue, until it stands out from the background
  function withContrast(c, bg, min) {
    var hsl = rgbToHsl(c), L = hsl[2], dir = luminance(bg) > 0.4 ? -0.02 : 0.02, out = c;
    for (var n = 0; n < 45 && contrast(out, bg) < min; n++) { L = clamp(L + dir, 0.04, 0.96); out = hslToRgb(hsl[0], hsl[1], L); }
    return out;
  }

  var themeCache = { key: '', theme: null };
  function readTheme() {
    var cs = getComputedStyle(document.documentElement);
    var names = ['--bg', '--surface', '--surface-2', '--ink', '--muted', '--line', '--indigo', '--indigo-soft', '--haldi', '--haldi-soft', '--sindoor', '--ok', '--bad', '--series-1', '--series-2', '--series-3', '--series-4', '--font-body'];
    var raw = {}, key = '';
    for (var i = 0; i < names.length; i++) { raw[names[i]] = cs.getPropertyValue(names[i]).trim(); key += raw[names[i]] + '|'; }
    if (themeCache.key === key && themeCache.theme) return themeCache.theme;
    var T = { raw: raw, font: raw['--font-body'] || 'system-ui, sans-serif' };
    ['--bg', '--surface', '--surface-2', '--ink', '--muted', '--line', '--indigo', '--indigo-soft', '--haldi', '--haldi-soft', '--sindoor', '--ok'].forEach(function (n) { T[n.slice(2)] = toRgb(raw[n]); });
    var series = [toRgb(raw['--series-1']), toRgb(raw['--series-2']), toRgb(raw['--series-3']), toRgb(raw['--series-4'])];
    var sAvg = 0, lAvg = 0;
    series.forEach(function (c) { var h = rgbToHsl(c); sAvg += h[1]; lAvg += h[2]; });
    sAvg = Math.min(sAvg / 4, 0.85); lAvg /= 4;
    var pal = series.slice();
    EXTRA_HUES.forEach(function (q) { pal.push(hslToRgb(q[0], sAvg, clamp(lAvg + q[1], 0.2, 0.85))); });
    T.pal = pal.map(function (c) { return withContrast(c, T.surface, MIN_MARK_CONTRAST); });
    T.dark = luminance(T.surface) < 0.2;
    // text colour inside each centre marker: whichever of ink / surface contrasts more
    T.onPal = T.pal.map(function (c) { return contrast(c, T.ink) >= contrast(c, T.surface) ? T.ink : T.surface; });
    themeCache = { key: key, theme: T };
    return T;
  }

  /* ---------- marker shapes (secondary encoding so colour is never the only clue) ---------- */
  function polyPath(g, x, y, r, n, rot) {
    for (var i = 0; i < n; i++) {
      var a = rot + i * 2 * Math.PI / n;
      var px = x + r * Math.cos(a), py = y + r * Math.sin(a);
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.closePath();
  }
  function shapePath(g, shape, x, y, r) {
    var i;
    switch (shape) {
      case 'square': g.rect(x - r * 0.88, y - r * 0.88, r * 1.76, r * 1.76); break;
      case 'triangle': polyPath(g, x, y + r * 0.15, r * 1.3, 3, -Math.PI / 2); break;
      case 'tri-down': polyPath(g, x, y - r * 0.15, r * 1.3, 3, Math.PI / 2); break;
      case 'diamond': polyPath(g, x, y, r * 1.3, 4, 0); break;
      case 'hexagon': polyPath(g, x, y, r * 1.1, 6, 0); break;
      case 'star':
        for (i = 0; i < 10; i++) {
          var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.62 : r * 1.45;
          if (i === 0) g.moveTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); else g.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a));
        }
        g.closePath();
        break;
      case 'plus':
        var w = r * 0.45, L = r * 1.15;
        g.moveTo(x - w, y - L); g.lineTo(x + w, y - L); g.lineTo(x + w, y - w); g.lineTo(x + L, y - w); g.lineTo(x + L, y + w);
        g.lineTo(x + w, y + w); g.lineTo(x + w, y + L); g.lineTo(x - w, y + L); g.lineTo(x - w, y + w); g.lineTo(x - L, y + w);
        g.lineTo(x - L, y - w); g.lineTo(x - w, y - w); g.closePath();
        break;
      default: g.moveTo(x + r, y); g.arc(x, y, r, 0, Math.PI * 2);
    }
  }
  function shapeSvg(shape, colour) {
    // tiny legend swatch drawn with the same shape as on the canvas
    var p;
    switch (shape) {
      case 'square': p = '<rect x="2" y="2" width="10" height="10"/>'; break;
      case 'triangle': p = '<polygon points="7,1 13,12 1,12"/>'; break;
      case 'tri-down': p = '<polygon points="1,2 13,2 7,13"/>'; break;
      case 'diamond': p = '<polygon points="7,0 14,7 7,14 0,7"/>'; break;
      case 'hexagon': p = '<polygon points="13,7 10,12.2 4,12.2 1,7 4,1.8 10,1.8"/>'; break;
      case 'star': p = '<polygon points="7,0 8.8,4.9 14,5 9.9,8.2 11.3,13.3 7,10.3 2.7,13.3 4.1,8.2 0,5 5.2,4.9"/>'; break;
      case 'plus': p = '<polygon points="5,1 9,1 9,5 13,5 13,9 9,9 9,13 5,13 5,9 1,9 1,5 5,5"/>'; break;
      default: p = '<circle cx="7" cy="7" r="5.5"/>';
    }
    return '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false" style="flex:none;vertical-align:-2px" fill="' + colour + '">' + p + '</svg>';
  }

  /* ================================================================ */
  function mount(root, ctx) {
    var P = 'km' + (++mountCount) + '-';
    var listeners = [];
    function on(el, type, fn, opts) { el.addEventListener(type, fn, opts); listeners.push([el, type, fn, opts]); }
    var destroyed = false;

    var optionsHtml = DATASETS.map(function (d) { return '<option value="' + d.id + '">' + d.name + '</option>'; }).join('');
    var tasksHtml = TASKS.map(function (t) { return '<li data-task="' + t.id + '">' + t.text + '</li>'; }).join('');

    root.innerHTML =
      '<div class="lab">' +
        '<p class="lab-note"><strong>What you are seeing:</strong> each dot is one customer of a neighbourhood supermarket — how much they spend in a month (left to right) and how often they visit (bottom to top). ' +
        'K-Means is an <em>unsupervised</em> algorithm (it gets no right answers, only the data). It splits customers into K groups. Each big numbered marker is a group’s <em>centroid</em> (centre = the “average customer” of that group). ' +
        'It repeats two steps: <b>Assign</b> (every customer joins the nearest centre) and <b>Update</b> (every centre moves to the average of its customers).</p>' +
        '<div class="lab-body">' +
          '<div class="stack-sm">' +
            '<div class="lab-canvas-wrap" id="' + P + 'wrap"><canvas id="' + P + 'plot" role="img" aria-label="Scatter plot of customers"></canvas></div>' +
            '<p class="small" id="' + P + 'msg" role="status" aria-live="polite" style="min-height:3.2em"></p>' +
            '<div class="lab-legend" id="' + P + 'legend"></div>' +
            '<div class="lab-stats" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr))">' +
              '<div class="stat"><div class="k">Iteration</div><div class="v" id="' + P + 'iter">0</div></div>' +
              '<div class="stat"><div class="k">Inertia</div><div class="v" id="' + P + 'inertia">—</div></div>' +
              '<div class="stat"><div class="k">Converged</div><div class="v" id="' + P + 'conv">No</div></div>' +
              '<div class="stat"><div class="k">Best for this K</div><div class="v" id="' + P + 'best">—</div></div>' +
            '</div>' +
            '<p class="small muted"><strong style="color:var(--ink)">Elbow chart.</strong> Inertia (how spread out the groups are: add up each customer’s squared distance to its own centre) for every K, best of 6 tries. Look for the “elbow”: the K after which adding groups stops helping much. Tap a K to try it.</p>' +
            '<div class="lab-canvas-wrap" id="' + P + 'ewrap" style="aspect-ratio:5/2;max-height:230px"><canvas id="' + P + 'elbow" role="img" aria-label="Elbow chart"></canvas></div>' +
            '<p class="small muted">Tip: tap an empty spot to add a new customer. Drag a numbered centre to move it by hand. Distances are measured after scaling both axes to 0–1, so ₹ and visits count equally.</p>' +
          '</div>' +
          '<div class="lab-controls">' +
            '<div class="control"><label for="' + P + 'data">Customer data</label>' +
              '<select id="' + P + 'data" style="width:100%">' + optionsHtml + '</select>' +
              '<p class="small muted" id="' + P + 'ddesc"></p></div>' +
            '<div class="control"><label for="' + P + 'k">Number of groups (K) <output id="' + P + 'kout" for="' + P + 'k">4</output></label>' +
              '<input type="range" id="' + P + 'k" min="1" max="' + K_MAX + '" step="1" value="4"></div>' +
            '<div class="control"><span class="control-label" id="' + P + 'initlbl">Starting centres</span>' +
              '<div class="seg" role="group" aria-labelledby="' + P + 'initlbl">' +
                '<button type="button" data-init="random" aria-pressed="true">Random</button>' +
                '<button type="button" data-init="kpp" aria-pressed="false">k-means++</button>' +
              '</div>' +
              '<p class="small muted">Random = K random customers become the first centres. k-means++ = first centres picked far apart from each other.</p></div>' +
            '<div id="' + P + 'steps" style="display:flex;flex-direction:column;gap:14px">' +
            '<div class="control"><span class="control-label">Step by step</span>' +
              '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
                '<button type="button" class="btn" id="' + P + 'assign">1 · Assign</button>' +
                '<button type="button" class="btn" id="' + P + 'update">2 · Update</button>' +
              '</div></div>' +
            '<div style="display:grid;grid-template-columns:minmax(0,1fr);gap:8px">' +
              '<button type="button" class="btn btn-primary" id="' + P + 'run">Run to convergence</button>' +
              '<button type="button" class="btn" id="' + P + 'reinit">Re-initialise (new starting centres)</button>' +
            '</div></div>' +
            '<div class="row small"><input type="checkbox" id="' + P + 'regions" checked><label for="' + P + 'regions">Tint the area each centre “owns”</label></div>' +
            '<div class="stack-sm"><h2 class="lab-h">Your tasks</h2><ul class="lab-tasks" id="' + P + 'tasks">' + tasksHtml + '</ul></div>' +
          '</div>' +
        '</div>' +
        '<p class="small muted"><strong style="color:var(--ink)">Why it matters in real ML:</strong> shops, banks and apps group customers like this to plan offers, but K-Means only finds round, similar-sized groups and can get stuck, so people check K with an elbow chart, use k-means++ and run several restarts.</p>' +
      '</div>';

    function $(id) { return root.querySelector('#' + P + id); }
    var wrap = $('wrap'), canvas = $('plot'), ewrap = $('ewrap'), ecanvas = $('elbow');
    var g = canvas.getContext('2d'), ge = ecanvas.getContext('2d');
    var elMsg = $('msg'), elLegend = $('legend'), elIter = $('iter'), elInertia = $('inertia'), elConv = $('conv'), elBest = $('best');
    var elData = $('data'), elDesc = $('ddesc'), elK = $('k'), elKout = $('kout');
    var btnAssign = $('assign'), btnUpdate = $('update'), btnRun = $('run'), btnReinit = $('reinit'), elRegions = $('regions');
    var segBtns = root.querySelectorAll('[data-init]');
    var taskEls = {};
    Array.prototype.forEach.call(root.querySelectorAll('[data-task]'), function (li) { taskEls[li.getAttribute('data-task')] = li; });

    /* ---------- state ---------- */
    var S = {
      dataset: 'blobs3', pts: [], labels: [], k: 4, init: 'random',
      cs: [], from: null, tweenStart: 0, tweenDur: TWEEN_MS, trails: [],
      phase: 'init', iter: 0, converged: false, inertia: null, csAreMeans: false,
      initUsed: 'random', manualOnly: true, seedCounter: 0, dataVersion: 0,
      best: [], bestVersion: -1, stuck: null, userChangedK: false,
      running: false, nextAt: 0, flashStart: -1e9, showRegions: true, counts: [], missKey: '', misses: 0
    };
    var done = {};
    var dims = { w: 1, h: 1, dpr: 1, ew: 1, eh: 1 };
    var rafId = 0, elbowTimer = 0, elbowDirty = true;
    var off = document.createElement('canvas'), offG = off.getContext('2d'), offImg = null;

    TASKS.forEach(function (t) {
      if (ctx && ctx.isTaskDone && ctx.isTaskDone(t.id)) { done[t.id] = true; markLi(t.id); }
    });
    function markLi(id) {
      var li = taskEls[id];
      if (li && !li.classList.contains('done')) {
        li.classList.add('done');
        var sr = document.createElement('span');
        sr.className = 'visually-hidden';
        sr.textContent = ' (done)';
        li.appendChild(sr);
        li._sr = sr;
      }
    }
    // progress was restored or synced from elsewhere: show the ticks saved now (a tick that was removed can be earned again)
    function syncTasks() {
      TASKS.forEach(function (t) {
        var on = !!(ctx && ctx.isTaskDone && ctx.isTaskDone(t.id)), li = taskEls[t.id];
        if (on === !!done[t.id]) return;
        if (on) { done[t.id] = true; markLi(t.id); return; }
        delete done[t.id];
        if (li) { li.classList.remove('done'); if (li._sr && li._sr.parentNode === li) li.removeChild(li._sr); li._sr = null; }
      });
    }
    function completeTask(id) {
      if (done[id]) return;
      done[id] = true;
      markLi(id);
      if (ctx && ctx.onTaskDone) ctx.onTaskDone(id);
    }

    /* ---------- geometry ---------- */
    function geom() {
      var small = dims.w < 480;
      var pl = small ? 40 : 50, pr = small ? 17 : 20, pt = 12, pb = small ? 36 : 42;
      return { pl: pl, pt: pt, pw: Math.max(10, dims.w - pl - pr), ph: Math.max(10, dims.h - pt - pb), small: small };
    }
    function toPx(G, p) { return { x: G.pl + p.x * G.pw, y: G.pt + (1 - p.y) * G.ph }; }
    function toData(G, x, y) { return { x: (x - G.pl) / G.pw, y: 1 - (y - G.pt) / G.ph }; }
    function centreRadius() { return clamp(dims.w / 46, 10, 13); }
    function pointRadius() { return clamp(dims.w / 150, 3, 4.6); }

    var curAspect = null, aspectRaf = 0;
    function wantAspect() { return wrap.getBoundingClientRect().width < 520 ? '1 / 1' : ''; }
    function applyAspect() {
      aspectRaf = 0;
      if (destroyed) return;
      var want = wantAspect();
      if (want !== curAspect) { curAspect = want; wrap.style.aspectRatio = want; }
    }
    function resize() {
      // changing the wrapper's own size inside a ResizeObserver callback would loop, so defer it
      if (wantAspect() !== curAspect && !aspectRaf) aspectRaf = requestAnimationFrame(applyAspect);
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      // each canvas fills its wrapper inside the wrapper's 1px border, so measure the canvas box itself (unrounded:
      // the elbow box is often a fraction of a pixel tall): the backing store then matches the screen pixels (sharp
      // lines) and pointer positions map onto the right data points
      var r = canvas.getBoundingClientRect();
      dims.w = Math.max(1, r.width); dims.h = Math.max(1, r.height); dims.dpr = dpr;
      canvas.width = Math.max(1, Math.round(dims.w * dpr)); canvas.height = Math.max(1, Math.round(dims.h * dpr));
      var er = ecanvas.getBoundingClientRect();
      dims.ew = Math.max(1, er.width); dims.eh = Math.max(1, er.height);
      ecanvas.width = Math.max(1, Math.round(dims.ew * dpr)); ecanvas.height = Math.max(1, Math.round(dims.eh * dpr));
      // setting width/height clears both canvases; redraw now so no blank frame is painted
      drawPlot(performance.now());
      drawElbow(); elbowDirty = false;
    }

    /* ---------- elbow (best inertia per K from several k-means++ restarts) ---------- */
    function computeElbow() {
      var best = [0];
      for (var k = 1; k <= K_MAX; k++) {
        var b = Infinity, restarts = k === 1 ? 1 : 6;
        for (var r = 0; r < restarts; r++) {
          var rnd = mulberry32(9001 + k * 101 + r * 7919 + S.dataVersion * 13);
          var res = lloyd(S.pts, initPP(S.pts, k, rnd), MAX_ITER);
          if (res.inertia < b) b = res.inertia;
        }
        best.push(b);
      }
      S.best = best;
      S.bestVersion = S.dataVersion;
      elbowDirty = true;
    }
    function scheduleElbow() {
      clearTimeout(elbowTimer);
      elbowTimer = setTimeout(function () {
        if (destroyed) return;
        computeElbow(); syncUI(); requestDraw();
      }, 300);
    }

    /* ---------- actions ---------- */
    function displayCentres(now) {
      if (!S.from) return S.cs;
      var t = S.tweenDur > 0 ? (now - S.tweenStart) / S.tweenDur : 1;
      if (t >= 1) { S.from = null; return S.cs; }
      var e = easeInOut(clamp(t, 0, 1));
      return S.cs.map(function (c, j) { var f = S.from[j] || c; return { x: f.x + (c.x - f.x) * e, y: f.y + (c.y - f.y) * e }; });
    }
    function tweening(now) { return !!S.from && now - S.tweenStart < S.tweenDur; }
    function setMsg(html) { elMsg.innerHTML = html; }
    function initName(m) { return m === 'kpp' ? 'k-means++' : m === 'manual' ? 'moved by hand' : 'Random'; }

    function loadDataset(id) {
      S.dataset = id;
      S.pts = makeData(id);
      S.dataVersion++;
      S.stuck = null;
      var d = DATASETS.filter(function (x) { return x.id === id; })[0];
      elDesc.textContent = d ? d.desc : '';
      computeElbow();
    }

    function reinit() {
      stopRun();
      S.from = null;
      var rnd = mulberry32((hashStr(S.dataset) + S.seedCounter * 7919 + S.k * 131 + (S.init === 'kpp' ? 17 : 0) + S.dataVersion * 31) >>> 0);
      S.cs = S.init === 'kpp' ? initPP(S.pts, S.k, rnd) : initRandom(S.pts, S.k, rnd);
      S.labels = S.pts.map(function () { return -1; });
      S.trails = S.cs.map(function (c) { return [{ x: c.x, y: c.y }]; });
      S.phase = 'init'; S.iter = 0; S.converged = false; S.inertia = null; S.csAreMeans = false;
      S.initUsed = S.init; S.manualOnly = true; S.flashStart = -1e9; S.counts = [];
      setMsg('Starting centres placed (' + initName(S.init) + '). <b>Next: press Assign</b>: every customer joins the nearest centre.');
      elbowDirty = true;
      syncUI(); requestDraw();
    }

    function assignStep(now, quiet) {
      var first = S.phase === 'init';
      var changes = assignLabels(S.pts, S.cs, S.labels);
      S.phase = 'assigned';
      S.inertia = inertiaOf(S.pts, S.labels, S.cs);
      S.counts = meanCentres(S.pts, S.labels, S.cs).counts;
      S.flashStart = reducedMotion() ? -1e9 : now;
      elbowDirty = true;
      if (changes === 0 && S.csAreMeans) { onConverged(); return; }
      if (!quiet) {
        if (first) setMsg('Assign: every customer joined its nearest centre (see the lines). <b>Next: press Update</b>: each centre moves to the average (middle) of its customers.');
        else if (changes === 0) setMsg('Assign: nobody changed group, but the centres are not yet at the middle of their groups. <b>Next: press Update.</b>');
        else setMsg('Assign: ' + changes + ' customer' + (changes === 1 ? '' : 's') + ' switched to a nearer centre. Inertia is now ' + f3(S.inertia) + '. <b>Next: press Update.</b>');
      }
    }
    function updateStep(now, quiet) {
      var res = meanCentres(S.pts, S.labels, S.cs);
      S.from = displayCentres(now).map(function (c) { return { x: c.x, y: c.y }; });
      S.tweenStart = now;
      S.tweenDur = reducedMotion() ? 0 : TWEEN_MS;
      S.cs = res.cs;
      S.counts = res.counts;
      for (var j = 0; j < S.cs.length; j++) S.trails[j].push({ x: S.cs[j].x, y: S.cs[j].y });
      S.iter++;
      S.phase = 'updated';
      S.csAreMeans = true;
      S.inertia = inertiaOf(S.pts, S.labels, S.cs);
      elbowDirty = true;
      if (!quiet) {
        var empty = [];
        res.counts.forEach(function (c, ci) { if (!c) empty.push(ci + 1); });
        setMsg('Update (round ' + S.iter + '): each centre moved to the middle of its customers. Inertia fell to ' + f3(S.inertia) + '. <b>Next: Assign again</b>: some customers may now be nearer a different centre.' +
          (empty.length ? ' Centre ' + empty.join(', ') + ' has no customers, so it stays put.' : ''));
      }
    }
    function onConverged() {
      S.converged = true;
      var wasRunning = S.running;
      stopRun();
      if (S.bestVersion !== S.dataVersion) computeElbow();
      var k = S.k, I = S.inertia, best = S.best[k];
      if (I < best) { S.best[k] = I; best = I; elbowDirty = true; }
      var key = S.dataVersion + ':' + k;
      var notes = [];
      if (S.initUsed === 'random' && k >= 2 && I > best * 1.1) {
        S.stuck = { key: key, inertia: I };
        S.misses = 0;
        var ratio = I / best;
        var worse = ratio >= 2 ? 'about ' + ratio.toFixed(1) + ' times' : Math.round((ratio - 1) * 100) + '% higher than';
        notes.push('<b>Stuck!</b> Inertia ' + f3(I) + ' is ' + worse + ' the best known for K = ' + k + ' (' + f3(best) + '). K-Means settled into a poor grouping it cannot escape by itself (a “local minimum”). Now try k-means++.');
      } else if (S.initUsed === 'kpp' && S.stuck && S.stuck.key === key && I < S.stuck.inertia * 0.95 && I <= best * 1.1) {
        notes.push('<b>Fixed!</b> k-means++ spread the starting centres out and reached inertia ' + f3(I) + ' instead of the stuck ' + f3(S.stuck.inertia) + '.');
        completeTask('t3');
      } else if (S.initUsed === 'random' && k >= 2 && !done.t3 && !(S.stuck && S.stuck.key === key)) {
        // hunting for a stuck start: after a couple of good runs, say how to find one faster
        S.misses = S.missKey === key ? S.misses + 1 : 1;
        S.missKey = key;
        if (S.misses >= 2) {
          notes.push(S.dataset === 'blobs5' && k === 5
            ? 'Not stuck this time. Press “Run again” for a new random start.'
            : 'Not stuck this time. Stuck starts are rare here: try “5 groups” with K = 5 and press “Run again” a few times.');
        }
      }
      // stepped by hand from a fresh start until nothing changed (at least one full Assign + Update round)
      if (S.manualOnly && !wasRunning && S.iter >= 1) completeTask('t1');
      if (S.dataset === 'blobs3' && k === 3) {
        if (!S.stuck || S.stuck.key !== key || S.stuck.inertia !== I) notes.push('K = 3 sits at the elbow: going to 4 groups barely lowers inertia, so the extra group is not worth it.');
        if (S.userChangedK) completeTask('t2');
      }
      if (S.dataset === 'moons' && k === 2) {
        var c = 0, n = 0;
        for (var i = 0; i < S.pts.length; i++) { if (S.pts[i].t >= 0) { n++; if (S.labels[i] === S.pts[i].t) c++; } }
        var agree = n ? Math.max(c, n - c) / n : 1;
        notes.push('Only ' + Math.round(agree * 100) + '% of customers ended up with their own moon. K-Means can only draw straight borders around round blobs, so it slices the moons the wrong way.');
        if (agree < 0.97) completeTask('t4');
      }
      if (S.dataset === 'random') notes.push('There are no real groups here, yet K-Means still returned ' + k + '. It always does, so check that groups make sense.');
      if (S.dataset === 'uneven' && k === 3) notes.push('Borders sit halfway between centres, so the big spread-out group can lose its edge customers to the small groups.');
      setMsg('<b>Converged</b> after ' + S.iter + ' round' + (S.iter === 1 ? '' : 's') + ': no customer changed group, so the centres will not move again. ' + notes.join(' '));
      syncUI();
    }

    function doStep(now) {
      if (S.converged) return;
      if (S.phase === 'assigned') updateStep(now, S.running); else assignStep(now, S.running);
    }
    function startRun() {
      if (S.converged) { S.seedCounter++; reinit(); }
      S.running = true;
      S.manualOnly = false;
      S.nextAt = 0;
      setMsg('Running: Assign, Update, Assign, Update… until nobody changes group.');
      syncUI(); requestDraw();
    }
    function stopRun() {
      if (!S.running) return;
      S.running = false;
      if (!S.converged) setMsg('Paused after ' + S.iter + ' round' + (S.iter === 1 ? '' : 's') + '. Continue with ' + (S.phase === 'assigned' ? 'Update' : 'Assign') + ' or Run.');
      syncUI();
    }

    function addPoint(px, py) {
      var G = geom();
      if (px < G.pl || px > G.pl + G.pw || py < G.pt || py > G.pt + G.ph) return;
      if (S.pts.length >= MAX_POINTS) { setMsg('That is plenty of customers (' + MAX_POINTS + '). Pick a dataset again to start fresh.'); return; }
      var d = toData(G, px, py);
      var p = { x: clamp(d.x, 0, 1), y: clamp(d.y, 0, 1), t: -1 };
      S.pts.push(p);
      S.dataVersion++;
      S.stuck = null;
      scheduleElbow();
      if (S.phase === 'init') {
        S.labels.push(-1);
        setMsg('New customer added (' + money(p.x) + ', ' + visits(p.y) + ' visits). Press Assign to group everyone.');
      } else {
        var best = 0, bd = Infinity;
        for (var j = 0; j < S.cs.length; j++) { var dd = d2(p, S.cs[j]); if (dd < bd) { bd = dd; best = j; } }
        S.labels.push(best);
        S.converged = false; S.csAreMeans = false;
        S.inertia = inertiaOf(S.pts, S.labels, S.cs);
        S.counts = meanCentres(S.pts, S.labels, S.cs).counts;
        setMsg('New customer (' + money(p.x) + ', ' + visits(p.y) + ' visits) joined group ' + (best + 1) + ', the nearest centre. That is how K-Means sorts a brand-new customer. Keep stepping and the centres will adjust.');
      }
      elbowDirty = true;
      syncUI(); requestDraw();
    }
    function finishDrag(j) {
      S.trails[j] = [{ x: S.cs[j].x, y: S.cs[j].y }];
      S.csAreMeans = false; S.converged = false; S.initUsed = 'manual';
      if (S.phase !== 'init') {
        S.phase = 'updated';
        S.inertia = inertiaOf(S.pts, S.labels, S.cs);
      }
      setMsg('You moved centre ' + (j + 1) + ' by hand (to ' + money(S.cs[j].x) + ', ' + visits(S.cs[j].y) + ' visits). <b>Press Assign</b> to regroup customers around it.');
      elbowDirty = true;
      syncUI(); requestDraw();
    }

    /* ---------- UI sync ---------- */
    function syncUI() {
      var T = readTheme();
      elIter.textContent = String(S.iter);
      elInertia.textContent = f3(S.inertia);
      elConv.textContent = S.converged ? 'Yes' : 'No';
      elConv.style.color = S.converged ? 'var(--ok)' : '';
      elBest.textContent = f3(S.best[S.k]);
      elKout.textContent = String(S.k);
      if (String(elK.value) !== String(S.k)) elK.value = String(S.k);
      if (elData.value !== S.dataset) elData.value = S.dataset;
      Array.prototype.forEach.call(segBtns, function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-init') === S.init ? 'true' : 'false'); });
      btnAssign.disabled = S.running || S.converged || S.phase === 'assigned';
      btnUpdate.disabled = S.running || S.converged || S.phase !== 'assigned';
      btnRun.textContent = S.running ? 'Pause' : S.converged ? 'Run again (new start)' : 'Run to convergence';

      var labelled = S.phase !== 'init';
      var items = S.cs.map(function (c, j) {
        var col = rgbStr(T.pal[j % T.pal.length]);
        var count = labelled ? (S.counts[j] || 0) + ' customer' + (S.counts[j] === 1 ? '' : 's') + ', ' : '';
        return '<div style="display:inline-flex;gap:6px;align-items:center">' + shapeSvg(SHAPES[j % SHAPES.length], col) +
          '<b style="color:var(--ink)">' + (j + 1) + '</b> ' + count + 'centre at ' + money(c.x) + ', ' + visits(c.y) + ' visits</div>';
      });
      elLegend.innerHTML = items.join('');

      var desc = 'Scatter plot of ' + S.pts.length + ' customers, monthly spend against visits per month, with ' + S.k + ' group centres. ' +
        (labelled ? 'Customers are coloured by group. ' : 'Customers are not grouped yet. ') +
        'Centres: ' + S.cs.map(function (c, j) { return (j + 1) + ' at ' + money(c.x) + ' and ' + visits(c.y) + ' visits'; }).join('; ') + '. ' +
        'Iteration ' + S.iter + ', inertia ' + f3(S.inertia) + (S.converged ? ', converged.' : '.');
      canvas.setAttribute('aria-label', desc);
      var ed = 'Elbow chart of the best inertia for K = 1 to ' + K_MAX + ': ' +
        S.best.slice(1).map(function (v, i) { return 'K ' + (i + 1) + ': ' + f3(v); }).join(', ') + '. Current K = ' + S.k +
        (S.inertia != null ? ', your current inertia ' + f3(S.inertia) : '') + '.';
      ecanvas.setAttribute('aria-label', ed);
    }

    /* ---------- drawing ---------- */
    function requestDraw() {
      if (!rafId && !destroyed) rafId = requestAnimationFrame(tick);
    }
    function tick(now) {
      rafId = 0;
      if (destroyed) return;
      if (S.running && now >= S.nextAt && !tweening(now)) {
        doStep(now);
        if (S.running) {
          if (S.iter >= MAX_ITER) {
            stopRun();
            setMsg('Stopped after ' + MAX_ITER + ' rounds without settling.');
          } else if (S.phase === 'assigned') S.nextAt = now + (reducedMotion() ? 150 : 300);
          else S.nextAt = now + S.tweenDur + (reducedMotion() ? 150 : 140);
        }
        syncUI();
      }
      drawPlot(now);
      if (elbowDirty) { drawElbow(); elbowDirty = false; }
      if (S.running || tweening(now) || now - S.flashStart < FLASH_MS) rafId = requestAnimationFrame(tick);
    }

    function drawPlot(now) {
      var T = readTheme(), G = geom(), w = dims.w, h = dims.h;
      g.setTransform(dims.dpr, 0, 0, dims.dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      g.fillStyle = rgbStr(T.surface);
      g.fillRect(0, 0, w, h);
      var cs = displayCentres(now);
      var fs = G.small ? 11 : 12;

      // region tint: coarse grid, each cell coloured by its nearest centre
      if (S.showRegions && cs.length) {
        var cell = 5, gw = Math.ceil(G.pw / cell), gh = Math.ceil(G.ph / cell);
        if (off.width !== gw || off.height !== gh || !offImg) { off.width = gw; off.height = gh; offImg = offG.createImageData(gw, gh); }
        var data = offImg.data, alpha = T.dark ? 34 : 30;
        for (var gy = 0; gy < gh; gy++) {
          var yv = 1 - ((gy + 0.5) * cell) / G.ph;
          for (var gx = 0; gx < gw; gx++) {
            var xv = ((gx + 0.5) * cell) / G.pw, bj = 0, bd = Infinity;
            for (var j = 0; j < cs.length; j++) { var dx = xv - cs[j].x, dy = yv - cs[j].y, dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; bj = j; } }
            var col = T.pal[bj % T.pal.length], o = (gy * gw + gx) * 4;
            data[o] = col[0]; data[o + 1] = col[1]; data[o + 2] = col[2]; data[o + 3] = alpha;
          }
        }
        offG.putImageData(offImg, 0, 0);
        g.save();
        g.beginPath(); g.rect(G.pl, G.pt, G.pw, G.ph); g.clip();
        g.imageSmoothingEnabled = true;
        g.drawImage(off, 0, 0, gw, gh, G.pl, G.pt, gw * cell, gh * cell);
        g.restore();
      }

      // grid + axes
      g.lineWidth = 1;
      g.strokeStyle = rgbStr(T.line);
      g.fillStyle = rgbStr(T.muted);
      g.font = fs + 'px ' + T.font;
      g.textAlign = 'center'; g.textBaseline = 'top';
      var t, X, Y;
      for (t = 0; t <= SPEND_MAX; t += 5) {
        X = Math.round(G.pl + (t / SPEND_MAX) * G.pw) + 0.5;
        g.beginPath(); g.moveTo(X, G.pt); g.lineTo(X, G.pt + G.ph); g.stroke();
        g.fillText('₹' + t + (t ? 'k' : ''), X, G.pt + G.ph + 5);
      }
      var ystep = G.ph > 260 ? 5 : 10;
      g.textAlign = 'right'; g.textBaseline = 'middle';
      for (t = 0; t <= VISITS_MAX; t += ystep) {
        Y = Math.round(G.pt + (1 - t / VISITS_MAX) * G.ph) + 0.5;
        g.beginPath(); g.moveTo(G.pl, Y); g.lineTo(G.pl + G.pw, Y); g.stroke();
        g.fillText(String(t), G.pl - 6, Y);
      }
      g.textAlign = 'center'; g.textBaseline = 'bottom';
      g.fillText('Monthly spend (₹ thousand)', G.pl + G.pw / 2, h - 3);
      g.save();
      g.translate(G.small ? 11 : 13, G.pt + G.ph / 2); g.rotate(-Math.PI / 2);
      g.textBaseline = 'middle';
      g.fillText('Visits per month', 0, 0);
      g.restore();

      var i, p, q, k = cs.length;
      // assign flash: thin lines from each customer to its centre, fading out
      var ft = (now - S.flashStart) / FLASH_MS;
      if (ft >= 0 && ft < 1) {
        g.lineWidth = 1;
        for (var c = 0; c < k; c++) {
          g.strokeStyle = rgbStr(T.pal[c % T.pal.length], (0.55 * (1 - ft)).toFixed(3));
          g.beginPath();
          var cp = toPx(G, cs[c]);
          for (i = 0; i < S.pts.length; i++) {
            if (S.labels[i] !== c) continue;
            p = toPx(G, S.pts[i]);
            g.moveTo(p.x, p.y); g.lineTo(cp.x, cp.y);
          }
          g.stroke();
        }
      }

      // customers, grouped by cluster so each colour is one path
      var r = pointRadius();
      g.lineJoin = 'round';
      for (var grp = -1; grp < k; grp++) {
        g.beginPath();
        var any = false;
        var shape = grp < 0 ? 'circle' : SHAPES[grp % SHAPES.length];
        for (i = 0; i < S.pts.length; i++) {
          var l = S.labels[i];
          if ((grp < 0 && (l < 0 || l >= k)) || l === grp) { p = toPx(G, S.pts[i]); shapePath(g, shape, p.x, p.y, r); any = true; }
        }
        if (!any) continue;
        g.lineWidth = 2; g.strokeStyle = rgbStr(T.surface); g.stroke();
        g.fillStyle = grp < 0 ? rgbStr(T.muted, 0.75) : rgbStr(T.pal[grp % T.pal.length]);
        g.fill();
      }

      // centroid trails
      var R = centreRadius();
      for (var j2 = 0; j2 < k; j2++) {
        var tr = S.trails[j2] || [];
        if (tr.length < 1) continue;
        var colr = T.pal[j2 % T.pal.length];
        var pts = tr.map(function (a) { return toPx(G, a); });
        var last = S.from ? tr.length - 1 : tr.length; // during a tween the newest trail point is the target
        g.save();
        g.setLineDash([4, 4]);
        g.lineWidth = 2;
        g.strokeStyle = rgbStr(colr, 0.85);
        g.beginPath();
        for (q = 0; q < last; q++) { if (q === 0) g.moveTo(pts[q].x, pts[q].y); else g.lineTo(pts[q].x, pts[q].y); }
        var cur = toPx(G, cs[j2]);
        if (last > 0) { g.lineTo(cur.x, cur.y); g.stroke(); }
        g.restore();
        for (q = 0; q < last; q++) {
          g.beginPath(); g.arc(pts[q].x, pts[q].y, 3, 0, Math.PI * 2);
          g.fillStyle = rgbStr(colr); g.fill();
          g.lineWidth = 1.5; g.strokeStyle = rgbStr(T.surface); g.stroke();
        }
      }

      // centroids: big numbered markers
      g.font = '700 ' + (R > 11 ? 13 : 12) + 'px ' + T.font;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      for (var j3 = 0; j3 < k; j3++) {
        var cpx = toPx(G, cs[j3]);
        var rr = R + (drag && drag.j === j3 ? 2 : 0);
        g.beginPath(); g.arc(cpx.x, cpx.y, rr + 3, 0, Math.PI * 2);
        g.fillStyle = rgbStr(T.surface); g.fill();
        g.lineWidth = 1.5; g.strokeStyle = rgbStr(T.ink); g.stroke();
        g.beginPath(); g.arc(cpx.x, cpx.y, rr, 0, Math.PI * 2);
        g.fillStyle = rgbStr(T.pal[j3 % T.pal.length]); g.fill();
        g.fillStyle = rgbStr(T.onPal[j3 % T.onPal.length]);
        g.fillText(String(j3 + 1), cpx.x, cpx.y + 0.5);
      }
    }

    function niceStep(range, target) {
      var raw = range / target, mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), n = raw / mag;
      return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
    }
    function drawElbow() {
      var T = readTheme(), w = dims.ew, h = dims.eh;
      ge.setTransform(dims.dpr, 0, 0, dims.dpr, 0, 0);
      ge.clearRect(0, 0, w, h);
      ge.fillStyle = rgbStr(T.surface); ge.fillRect(0, 0, w, h);
      if (!S.best.length) return;
      var small = w < 480, fs = small ? 11 : 12;
      var pl = small ? 40 : 48, pr = 12, pt = 28, pb = 36;
      var pw = Math.max(10, w - pl - pr), ph = Math.max(10, h - pt - pb);
      var maxV = S.best[1] || 1;
      if (S.inertia != null) maxV = Math.max(maxV, S.inertia);
      var step = niceStep(maxV, 3), top = Math.ceil(maxV * 1.04 / step) * step;
      function xOf(k) { return pl + ((k - 0.5) / K_MAX) * pw; }
      function yOf(v) { return pt + (1 - v / top) * ph; }
      ge.font = fs + 'px ' + T.font;
      // highlight band for current K
      var bw = pw / K_MAX * 0.72;
      ge.fillStyle = rgbStr(T['haldi-soft']);
      ge.fillRect(xOf(S.k) - bw / 2, pt - 4, bw, ph + 4);
      // grid
      ge.strokeStyle = rgbStr(T.line); ge.lineWidth = 1;
      ge.fillStyle = rgbStr(T.muted); ge.textAlign = 'right'; ge.textBaseline = 'middle';
      for (var v = 0; v <= top + 1e-9; v += step) {
        var Y = Math.round(yOf(v)) + 0.5;
        ge.beginPath(); ge.moveTo(pl, Y); ge.lineTo(pl + pw, Y); ge.stroke();
        ge.fillText(step < 1 ? v.toFixed(step < 0.1 ? 2 : 1) : String(Math.round(v)), pl - 6, Y);
      }
      ge.textAlign = 'left'; ge.textBaseline = 'alphabetic';
      ge.fillText('Inertia (lower = tighter groups)', 4, 15);
      ge.textAlign = 'center'; ge.textBaseline = 'top';
      for (var k = 1; k <= K_MAX; k++) {
        ge.fillStyle = k === S.k ? rgbStr(T.ink) : rgbStr(T.muted);
        ge.font = (k === S.k ? '700 ' : '') + fs + 'px ' + T.font;
        ge.fillText(String(k), xOf(k), pt + ph + 9);
      }
      ge.font = fs + 'px ' + T.font;
      ge.fillStyle = rgbStr(T.muted);
      ge.textBaseline = 'bottom';
      ge.fillText('Number of groups (K)', pl + pw / 2, h - 2);
      // best-inertia line
      ge.strokeStyle = rgbStr(T.indigo); ge.lineWidth = 2; ge.lineJoin = 'round'; ge.lineCap = 'round';
      ge.beginPath();
      for (k = 1; k <= K_MAX; k++) { if (k === 1) ge.moveTo(xOf(k), yOf(S.best[k])); else ge.lineTo(xOf(k), yOf(S.best[k])); }
      ge.stroke();
      for (k = 1; k <= K_MAX; k++) {
        var cur = k === S.k;
        ge.beginPath(); ge.arc(xOf(k), yOf(S.best[k]), cur ? 6 : 4, 0, Math.PI * 2);
        ge.fillStyle = rgbStr(cur ? T.haldi : T.indigo); ge.fill();
        ge.lineWidth = 2; ge.strokeStyle = rgbStr(T.surface); ge.stroke();
        if (cur) { ge.beginPath(); ge.arc(xOf(k), yOf(S.best[k]), 8, 0, Math.PI * 2); ge.lineWidth = 1.25; ge.strokeStyle = rgbStr(T.ink); ge.stroke(); }
      }
      // your current run
      if (S.inertia != null) {
        var yx = xOf(S.k), yy = yOf(S.inertia), by = yOf(S.best[S.k]);
        if (Math.abs(yy - by) > 3) {
          ge.save(); ge.setLineDash([3, 3]); ge.strokeStyle = rgbStr(T.sindoor); ge.lineWidth = 1.5;
          ge.beginPath(); ge.moveTo(yx, by - 8); ge.lineTo(yx, yy + 7); ge.stroke(); ge.restore();
        }
        ge.beginPath(); ge.arc(yx, yy, 7, 0, Math.PI * 2);
        ge.lineWidth = 2.25; ge.strokeStyle = rgbStr(T.sindoor); ge.stroke();
        ge.fillStyle = rgbStr(T.ink);
        ge.font = '600 ' + fs + 'px ' + T.font;
        ge.textBaseline = 'middle';
        var right = S.k <= K_MAX - 2;
        ge.textAlign = right ? 'left' : 'right';
        ge.fillText('your run', yx + (right ? 10 : -10), clamp(yy - 13, pt - 6, pt + ph - 6));
      }
    }

    /* ---------- pointer input ---------- */
    var drag = null, down = null;
    function localPos(e, el) { var r = el.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function hitCentre(p, touch) {
      var G = geom(), R = centreRadius() + (touch ? 12 : 6), shown = displayCentres(performance.now());
      for (var j = shown.length - 1; j >= 0; j--) {
        var c = toPx(G, shown[j]);
        if ((c.x - p.x) * (c.x - p.x) + (c.y - p.y) * (c.y - p.y) <= R * R) return j;
      }
      return -1;
    }
    function onDown(e) {
      if (e.button != null && e.button > 0) return;
      var p = localPos(e, canvas);
      var j = hitCentre(p, e.pointerType !== 'mouse');
      if (j >= 0) {
        stopRun();
        S.from = null;
        drag = { j: j, id: e.pointerId, moved: false };
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
        requestDraw();
      } else {
        down = { x: p.x, y: p.y, id: e.pointerId };
      }
    }
    function onMove(e) {
      var p = localPos(e, canvas);
      if (drag && e.pointerId === drag.id) {
        var G = geom(), d = toData(G, p.x, p.y);
        S.cs[drag.j] = { x: clamp(d.x, 0, 1), y: clamp(d.y, 0, 1) };
        drag.moved = true;
        requestDraw();
      } else if (!drag && e.pointerType === 'mouse') {
        canvas.style.cursor = hitCentre(p, false) >= 0 ? 'grab' : 'crosshair';
      }
    }
    function onUp(e) {
      var p = localPos(e, canvas);
      if (drag && e.pointerId === drag.id) {
        var j = drag.j, moved = drag.moved;
        drag = null;
        canvas.style.cursor = 'grab';
        if (moved) finishDrag(j); else requestDraw();
      } else if (down && down.id === e.pointerId) {
        if (Math.abs(p.x - down.x) < 10 && Math.abs(p.y - down.y) < 10) addPoint(p.x, p.y);
        down = null;
      }
    }
    function onCancel() { if (drag) { var j = drag.j, m = drag.moved; drag = null; if (m) finishDrag(j); } down = null; }
    on(canvas, 'pointerdown', onDown);
    on(canvas, 'pointermove', onMove);
    on(canvas, 'pointerup', onUp);
    on(canvas, 'pointercancel', onCancel);

    function onElbowClick(e) {
      var p = localPos(e, ecanvas), small = dims.ew < 480;
      var pl = small ? 40 : 48, pw = Math.max(10, dims.ew - pl - 12);
      var k = clamp(Math.floor((p.x - pl) / pw * K_MAX) + 1, 1, K_MAX);
      setK(k);
    }
    // a click only fires for a tap, so swiping over the chart scrolls the page instead of changing K
    on(ecanvas, 'click', onElbowClick);
    ecanvas.style.touchAction = 'pan-y';
    ecanvas.style.cursor = 'pointer';
    canvas.style.cursor = 'crosshair';

    /* ---------- controls ---------- */
    function setK(k) {
      S.userChangedK = true;
      if (k === S.k && S.phase === 'init') { syncUI(); return; }
      S.k = k;
      reinit();
    }
    on(elK, 'input', function () { setK(parseInt(elK.value, 10) || 1); });
    on(elData, 'change', function () { loadDataset(elData.value); reinit(); });
    Array.prototype.forEach.call(segBtns, function (b) {
      on(b, 'click', function () { S.init = b.getAttribute('data-init'); reinit(); });
    });
    function handOffFocus(from) {
      if (document.activeElement !== from || !from.disabled) return;
      var order = [btnAssign, btnUpdate, btnRun, btnReinit];
      for (var i = 0; i < order.length; i++) if (!order[i].disabled) { order[i].focus(); return; }
    }
    on(btnAssign, 'click', function () { if (!S.running && !S.converged && S.phase !== 'assigned') { assignStep(performance.now(), false); syncUI(); requestDraw(); handOffFocus(btnAssign); } });
    on(btnUpdate, 'click', function () { if (!S.running && !S.converged && S.phase === 'assigned') { updateStep(performance.now(), false); syncUI(); requestDraw(); handOffFocus(btnUpdate); } });
    on(btnRun, 'click', function () { if (S.running) stopRun(); else startRun(); });
    on(btnReinit, 'click', function () { S.seedCounter++; reinit(); });
    on(elRegions, 'change', function () { S.showRegions = elRegions.checked; requestDraw(); });

    /* ---------- theme + resize ---------- */
    function onTheme() { themeCache.key = ''; elbowDirty = true; syncUI(); requestDraw(); }
    var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mql) { if (mql.addEventListener) mql.addEventListener('change', onTheme); else if (mql.addListener) mql.addListener(onTheme); }
    on(document, 'themechange', onTheme);
    // style.css stacks .lab-body into one column at 820px; then the step buttons move right under the plot,
    // so on a phone you can press Assign / Update and watch the centres move (they move back on wider screens)
    var stepBox = $('steps'), btnRegionsRow = elRegions.parentNode, controls = btnRegionsRow.parentNode;
    var mqNarrow = window.matchMedia ? window.matchMedia('(max-width: 820px)') : null;
    function placeSteps() {
      if (destroyed) return;
      var narrow = !!(mqNarrow && mqNarrow.matches), fe = document.activeElement, had = !!(fe && stepBox.contains(fe));
      if (narrow && stepBox.parentNode !== wrap.parentNode) { wrap.parentNode.insertBefore(stepBox, wrap.nextSibling); stepBox.style.margin = '6px 0 2px'; }
      else if (!narrow && stepBox.parentNode !== controls) { controls.insertBefore(stepBox, btnRegionsRow); stepBox.style.margin = ''; }
      else return;
      if (had) { try { fe.focus({ preventScroll: true }); } catch (err) { /* ignore */ } }
    }
    if (mqNarrow) { if (mqNarrow.addEventListener) mqNarrow.addEventListener('change', placeSteps); else if (mqNarrow.addListener) mqNarrow.addListener(placeSteps); }
    placeSteps();
    applyAspect();
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { resize(); }); ro.observe(wrap); ro.observe(ewrap); }
    else on(window, 'resize', resize);

    /* ---------- starting state: 3 clear groups, K = 4, first Assign already done ---------- */
    loadDataset('blobs3');
    reinit();
    assignStep(-1e9, true);
    setMsg('Each customer has joined its nearest centre (that was the Assign step). <b>Next: press Update</b>: every centre moves to the average of its customers. Are 4 groups right? Check the elbow chart.');
    syncUI();
    resize();

    return {
      syncTasks: syncTasks,
      destroy: function () {
        destroyed = true;
        S.running = false;
        if (rafId) cancelAnimationFrame(rafId);
        if (aspectRaf) cancelAnimationFrame(aspectRaf);
        rafId = 0; aspectRaf = 0;
        clearTimeout(elbowTimer);
        if (ro) ro.disconnect();
        if (mql) { if (mql.removeEventListener) mql.removeEventListener('change', onTheme); else if (mql.removeListener) mql.removeListener(onTheme); }
        if (mqNarrow) { if (mqNarrow.removeEventListener) mqNarrow.removeEventListener('change', placeSteps); else if (mqNarrow.removeListener) mqNarrow.removeListener(placeSteps); }
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
        listeners = [];
        root.innerHTML = '';
      }
    };
  }

  Labs.kmeans = {
    id: 'kmeans',
    module: 'l2-unsupervised',
    title: 'K-Means: group your customers',
    summary: 'Watch K-Means sort supermarket customers into groups, step by step, and learn when it works and when it fails.',
    tasks: TASKS.map(function (t) { return { id: t.id, text: t.text }; }),
    mount: mount
  };
})();
