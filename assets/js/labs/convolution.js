/* AI Marg lab: "convolution" — slide a 3×3 kernel (filter) over a 28×28 drawing and watch the
   feature map, ReLU and 2×2 max-pooling appear. Plain classic script (ES2019), no dependencies.
   Registers window.AILabs.convolution. */
(function () {
  'use strict';
  var Labs = (window.AILabs = window.AILabs || {});
  var uid = 0;

  var N = 28; // the input is N×N pixels, the same size as the MNIST handwritten-digit images
  var KS = 3; // kernel size (3×3)
  var Q = 10; // pixels are stored in tenths (0..10 means 0.0..1.0), so every sum is easy to check by hand

  /* ---------- kernels ---------- */
  var KERNELS = [
    { id: 'identity', label: 'Identity', w: ['0', '0', '0', '0', '1', '0', '0', '0', '0'],
      about: 'Identity: only the centre weight is 1, so every pixel comes out exactly as it went in (a do-nothing filter, handy for checking).' },
    { id: 'sharpen', label: 'Sharpen', w: ['0', '-1', '0', '-1', '5', '-1', '0', '-1', '0'],
      about: 'Sharpen: 5 × the centre minus its 4 neighbours. Flat areas stay the same, while edges get extra contrast.' },
    { id: 'box', label: 'Box blur', w: ['1/9', '1/9', '1/9', '1/9', '1/9', '1/9', '1/9', '1/9', '1/9'],
      about: 'Box blur: the plain average of all 9 pixels (every weight is 1/9), so strokes get wider and softer.' },
    { id: 'gauss', label: 'Gaussian blur', w: ['1/16', '2/16', '1/16', '2/16', '4/16', '2/16', '1/16', '2/16', '1/16'],
      about: 'Gaussian blur: a gentler average where the centre counts most (4/16) and the corners least (1/16).' },
    { id: 'sobelx', label: 'Sobel x', w: ['-1', '0', '1', '-2', '0', '2', '-1', '0', '1'],
      about: 'Sobel x: right column minus left column. It reacts where brightness changes as you move left → right.' },
    { id: 'sobely', label: 'Sobel y', w: ['-1', '-2', '-1', '0', '0', '0', '1', '2', '1'],
      about: 'Sobel y: bottom row minus top row. It reacts where brightness changes as you move top → bottom.' },
    { id: 'outline', label: 'Outline (Laplacian)', w: ['-1', '-1', '-1', '-1', '8', '-1', '-1', '-1', '-1'],
      about: 'Outline (Laplacian: how different a pixel is from its neighbours): 8 × the centre minus all 8 neighbours. Flat areas give 0, so only the outlines of strokes light up.' }
  ];

  /* ---------- preset pictures, drawn as pen strokes on the 28×28 grid ---------- */
  function ringPts(cx, cy, rx, ry, steps) {
    var pts = [];
    for (var i = 0; i <= steps; i++) {
      var a = (i / steps) * Math.PI * 2;
      pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
    return pts;
  }
  var IMAGES = [
    { id: 'ka', label: 'क (ka)', name: 'the Devanagari letter क (ka)', strokes: [
      [[3.5, 6.5], [24.5, 6.5]],
      [[16, 6.5], [16, 24]],
      [[16, 14.2], [13.4, 11.4], [10.2, 10.9], [7.6, 12.6], [7.3, 15.7], [9.5, 17.9], [12.6, 17.4], [16, 14.6]],
      [[16, 14.4], [18.6, 11.8], [21.4, 12], [23, 14.6], [22.2, 18], [19.4, 19.8]]
    ] },
    { id: 'seven', label: '7', name: 'a handwritten 7', strokes: [
      [[6.5, 7.8], [13, 7], [21.5, 6.6]],
      [[21.5, 6.6], [19.2, 11.6], [16.4, 16.9], [13.8, 23.2]]
    ] },
    { id: 'square', label: 'Square', name: 'a square', strokes: [[[7, 7], [21, 7], [21, 21], [7, 21], [7, 7]]] },
    { id: 'circle', label: 'Circle', name: 'a circle', strokes: [ringPts(14, 14, 8.2, 8.2, 56)] }
  ];

  var TASKS = [
    { id: 't1', text: 'Find the kernel that lights up the up-down (vertical) strokes, then tap one of the brightest pixels in its feature map to see the multiply-and-add.' },
    { id: 't2', text: 'Make your own horizontal-line detector: type numbers into the 3×3 kernel grid so left-right strokes light up but up-down strokes stay grey. (A preset alone does not count.)' },
    { id: 't3', text: 'Switch the stride to 2 (the filter jumps 2 pixels at a time) and watch the feature map shrink to about half its width.' },
    { id: 't4', text: 'Turn on ReLU + 2×2 max-pool and make the final output exactly 7 × 7. (Hint: use the output-size formula.)' }
  ];
  var DONE_MSG = {
    t1: 'Vertical-edge detector found!',
    t2: 'Your own horizontal-line detector works!',
    t3: 'Stride 2: about half the width, a quarter of the pixels.',
    t4: 'A 7 × 7 final output, just like the last layers of a small CNN.'
  };

  /* ---------- small helpers ---------- */
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function minus(s) { return s.replace(/-/g, '−'); }
  // tidy number: "0", "3", "2.4", "0.11"; real minus sign
  function fmt(v) {
    if (!isFinite(v)) return '?';
    if (Math.abs(v) < 0.005) return '0';
    var s;
    if (Math.abs(v - Math.round(v)) < 1e-9) s = String(Math.round(v));
    else if (Math.abs(v * 10 - Math.round(v * 10)) < 1e-9) s = v.toFixed(1);
    else s = v.toFixed(2);
    return minus(s);
  }
  function needsRounding(v) { return Math.abs(v * 100 - Math.round(v * 100)) > 1e-7; }
  function tidy(v) { return Math.round(v * 1e9) / 1e9; }
  // a kernel weight typed by the learner: "2", "-1", "0.5", "1/9" (unicode minus allowed)
  function parseWeight(s) {
    var t = String(s).trim().replace(/[−–—]/g, '-').replace(/,/g, '.').replace(/\s+/g, '');
    if (t === '') return null;
    var m = /^([+-]?(?:\d+\.?\d*|\.\d+))\/((?:\d+\.?\d*|\.\d+))$/.exec(t);
    var v;
    if (m) { var den = parseFloat(m[2]); if (!(den > 0)) return null; v = parseFloat(m[1]) / den; }
    else if (/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(t)) v = parseFloat(t);
    else return null;
    if (!isFinite(v) || Math.abs(v) > 100) return null;
    return v;
  }
  function weightText(v) {
    if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
    return String(parseFloat(v.toFixed(3)));
  }
  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        var v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'text') n.textContent = v;
        else if (k === 'html') n.innerHTML = v;
        else if (k === 'class') n.className = v;
        else n.setAttribute(k, v === true ? '' : String(v));
      }
    }
    if (kids) {
      for (var i = 0; i < kids.length; i++) {
        if (kids[i] == null) continue;
        n.appendChild(typeof kids[i] === 'string' ? document.createTextNode(kids[i]) : kids[i]);
      }
    }
    return n;
  }

  /* ---------- pen (soft round brush, like a pen stroke on paper) ---------- */
  function segDist(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, t = 0;
    if (l2 > 1e-12) t = clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1);
    var x = ax + t * dx - px, y = ay + t * dy - py;
    return Math.sqrt(x * x + y * y);
  }
  // full ink near the middle of the stroke, fading to 0 about r + 0.45 pixels away
  function penLevel(d, r) { return Math.round(clamp((r + 0.45 - d) / 0.9, 0, 1) * Q); }
  function paintSeg(img, ax, ay, bx, by, r, erase) {
    var pad = r + 1;
    var x0 = Math.max(0, Math.floor(Math.min(ax, bx) - pad)), x1 = Math.min(N - 1, Math.ceil(Math.max(ax, bx) + pad));
    var y0 = Math.max(0, Math.floor(Math.min(ay, by) - pad)), y1 = Math.min(N - 1, Math.ceil(Math.max(ay, by) + pad));
    var changed = false;
    for (var y = y0; y <= y1; y++) {
      for (var x = x0; x <= x1; x++) {
        var lv = penLevel(segDist(x + 0.5, y + 0.5, ax, ay, bx, by), r);
        if (!lv) continue;
        var k = y * N + x, old = img[k], nv = erase ? Math.min(old, Q - lv) : Math.max(old, lv);
        if (nv !== old) { img[k] = nv; changed = true; }
      }
    }
    return changed;
  }
  function rasterize(img, strokes) {
    img.fill(0);
    strokes.forEach(function (pts) {
      if (pts.length === 1) paintSeg(img, pts[0][0], pts[0][1], pts[0][0], pts[0][1], 1, false);
      for (var i = 1; i < pts.length; i++) paintSeg(img, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], 1, false);
    });
  }

  /* ---------- the maths ---------- */
  // output size of a convolution: floor((n + 2p − k) / s) + 1
  function outSize(s, p) { return Math.floor((N + 2 * p - KS) / s) + 1; }
  // deep-learning "convolution" (PyTorch/Keras style): slide, multiply matching cells, add up
  function convolve(img, w, s, p) {
    var n = outSize(s, p), out = new Float64Array(n * n), maxAbs = 0, lo = 0, hi = 0;
    for (var i = 0; i < n; i++) {
      for (var j = 0; j < n; j++) {
        var sum = 0;
        for (var a = 0; a < KS; a++) {
          var r = i * s + a - p;
          if (r < 0 || r >= N) continue;
          for (var b = 0; b < KS; b++) {
            var c = j * s + b - p;
            if (c < 0 || c >= N) continue;
            sum += w[a * KS + b] * img[r * N + c];
          }
        }
        sum = tidy(sum / Q);
        out[i * n + j] = sum;
        if (sum < lo) lo = sum;
        if (sum > hi) hi = sum;
      }
    }
    maxAbs = Math.max(-lo, hi);
    return { n: n, out: out, lo: lo, hi: hi, maxAbs: maxAbs };
  }
  // ReLU (negatives → 0), then 2×2 max-pooling with stride 2; an odd last row/column is dropped
  function reluPool(out, n) {
    var m = Math.floor(n / 2), P = new Float64Array(m * m), hi = 0;
    for (var i = 0; i < m; i++) {
      for (var j = 0; j < m; j++) {
        var best = 0;
        for (var a = 0; a < 2; a++) for (var b = 0; b < 2; b++) {
          var v = out[(2 * i + a) * n + 2 * j + b];
          if (v > best) best = v;
        }
        P[i * m + j] = best;
        if (best > hi) hi = best;
      }
    }
    return { m: m, P: P, hi: hi };
  }
  function kernelSum(w) { var s = 0; for (var i = 0; i < 9; i++) s += w[i]; return tidy(s); }

  // Does a kernel pick out lines/edges running in one direction? Test it on a 2-pixel-thick bar.
  var TS = 12;
  function makeBar(horizontal) {
    var t = new Float64Array(TS * TS);
    for (var y = 0; y < TS; y++) for (var x = 0; x < TS; x++) {
      var k = horizontal ? y : x;
      if (k === 5 || k === 6) t[y * TS + x] = 1;
    }
    return t;
  }
  var BAR_H = makeBar(true), BAR_V = makeBar(false);
  function peak(t, w) {
    var best = 0;
    for (var i = 0; i <= TS - KS; i++) for (var j = 0; j <= TS - KS; j++) {
      var s = 0;
      for (var a = 0; a < KS; a++) for (var b = 0; b < KS; b++) s += w[a * KS + b] * t[(i + a) * TS + j + b];
      if (Math.abs(s) > best) best = Math.abs(s);
    }
    return best;
  }
  // strong on bars in the chosen direction, weak on bars the other way and on flat areas
  function detects(w, dir) {
    var on = peak(dir === 'h' ? BAR_H : BAR_V, w), off = peak(dir === 'h' ? BAR_V : BAR_H, w);
    var flat = Math.abs(kernelSum(w));
    return on >= 1 && off <= 0.3 * on + 1e-9 && flat <= 0.3 * on + 1e-9;
  }

  /* ---------- colours ---------- */
  function parseColor(s, fb) {
    s = (s || '').trim();
    var m = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(s);
    if (m) return [parseInt(m[1] + m[1], 16), parseInt(m[2] + m[2], 16), parseInt(m[3] + m[3], 16)];
    m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(s);
    if (m) return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
    m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(s);
    if (m) return [+m[1], +m[2], +m[3]];
    return fb;
  }
  function mixc(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function rgb(c, alpha) {
    var r = Math.round(c[0]), g = Math.round(c[1]), b = Math.round(c[2]);
    return alpha == null ? 'rgb(' + r + ',' + g + ',' + b + ')' : 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }
  function luminance(c) { return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; }

  /* ================================================================ */
  function mount(root, ctx) {
    var pre = 'cv' + (++uid) + '-';
    var img = new Uint8Array(N * N);
    var imgId = 'ka';
    rasterize(img, byId(IMAGES, 'ka').strokes);
    var kText = byId(KERNELS, 'outline').w.slice();
    var W = kText.map(parseWeight);
    var kernelTyped = false; // true once the learner has typed into the kernel grid since the last preset
    var stride = 1, pad = 0, poolOn = false;
    var tool = 'pen', penSize = 2;
    var R = null, PR = null; // convolution result, pooled result
    var pinned = null, hover = null; // selected cell {kind: 'f'|'p', i, j}
    var anim = null, raf = 0, alive = true;
    var stroke = null, scrub = null; // active pointers (drawing on the input, scrubbing the outputs)
    var L = null, dpr = 1, T = null, layoutKey = '';
    var calcKey = '', liveTimer = 0;
    var doneSet = {};
    TASKS.forEach(function (t) { doneSet[t.id] = !!(ctx && ctx.isTaskDone && ctx.isTaskDone(t.id)); });

    var inCv = document.createElement('canvas'); inCv.width = N; inCv.height = N;
    var fCv = document.createElement('canvas');
    var pCv = document.createElement('canvas');

    /* ---------- DOM ---------- */
    root.innerHTML = '';
    var lab = el('div', { class: 'lab' });
    lab.appendChild(el('p', { class: 'lab-note', html:
      '<b>What you are seeing:</b> the first picture is 28 × 28 pixels (the size of the famous MNIST handwritten-digit images), and every pixel is a number from 0 (empty) to 1 (full ink). ' +
      'A <b>kernel</b> (also called a <b>filter</b>: a small 3 × 3 grid of numbers) slides across it. At every stop, the 9 pixels under it are multiplied by the 9 kernel numbers and added up, ' +
      'and that one sum becomes one pixel of the <b>feature map</b> (the output picture): <b style="color:var(--series-1)">blue</b> means a positive sum, <b style="color:var(--series-2)">red</b> a negative one, grey about 0. ' +
      'Draw on the input with your mouse or finger, and tap any feature-map pixel to see its sum worked out.' }));

    var body = el('div', { class: 'lab-body' });

    /* left column: picture, stats, worked calculation */
    var left = el('div', { class: 'stack-sm', style: 'min-width:0' });
    var wrap = el('div', { class: 'lab-canvas-wrap', style: 'aspect-ratio:auto;height:360px' });
    var canvas = el('canvas', { role: 'img', tabindex: '0', 'aria-label': 'Convolution picture', style: 'touch-action:none;cursor:crosshair' });
    // a see-through layer over the output pictures: taps inspect a pixel, but a finger can still scroll the page
    var outLayer = el('div', { 'aria-hidden': 'true', style: 'position:absolute;left:0;top:0;width:0;height:0;touch-action:pan-y;cursor:pointer' });
    wrap.appendChild(canvas);
    wrap.appendChild(outLayer);
    left.appendChild(wrap);

    var playBtn = el('button', { type: 'button', class: 'btn btn-primary btn-sm' });
    var playHint = el('span', { class: 'small muted', text: 'or tap any pixel of the feature map' });
    left.appendChild(el('div', { class: 'row' }, [playBtn, playHint]));

    function stat(k) {
      var v = el('div', { class: 'v', text: '' });
      return { box: el('div', { class: 'stat' }, [el('div', { class: 'k', text: k }), v]), v: v };
    }
    var stIn = stat('Input'), stF = stat('Feature map'), stP = stat('After pooling'), stSum = stat('Kernel sum');
    var stats = el('div', { class: 'lab-stats' }, [stIn.box, stF.box, stP.box, stSum.box]);
    left.appendChild(stats);

    var calc = el('div', { class: 'card-flat', style: 'padding:12px 14px;display:flex;flex-direction:column;gap:8px' });
    var calcHead = el('div', { style: 'font-weight:600;font-size:.95rem;line-height:1.35' });
    var calcBody = el('div', { style: 'display:flex;flex-wrap:wrap;align-items:flex-end;gap:8px 10px' });
    var calcFoot = el('div', { class: 'small', style: 'line-height:1.45' });
    calc.appendChild(calcHead); calc.appendChild(calcBody); calc.appendChild(calcFoot);
    left.appendChild(calc);
    var formula = el('div', { class: 'card-flat', style: 'padding:10px 14px;font-size:.9rem;line-height:1.55' });
    left.appendChild(formula);
    var srLive = el('p', { class: 'visually-hidden', 'aria-live': 'polite' });
    left.appendChild(srLive);
    left.appendChild(el('p', { class: 'kbd-hint', text: 'Keyboard: focus the picture and use the arrow keys to move the highlighted feature-map pixel. In the kernel grid, arrow up/down adds or takes away 1.' }));
    body.appendChild(left);

    /* right column: controls */
    var controls = el('div', { class: 'lab-controls' });

    function segGroup(labelText, id, items, onPick, gridCols) {
      var lbl = el('span', { class: 'control-label', id: pre + id, text: labelText });
      var seg = el('div', { class: 'seg', role: 'group', 'aria-labelledby': pre + id });
      if (gridCols) seg.style.cssText = 'display:grid;grid-template-columns:repeat(' + gridCols + ',minmax(0,1fr));width:100%';
      var btns = items.map(function (it, i) {
        var st = '';
        if (gridCols) {
          var rows = Math.ceil(items.length / gridCols), row = Math.floor(i / gridCols);
          var lastAlone = i === items.length - 1 && items.length % gridCols === 1;
          st = 'padding:7px 6px;';
          if (lastAlone) st += 'grid-column:1/-1;border-right:0;';
          else if (i % gridCols === gridCols - 1) st += 'border-right:0;';
          if (row < rows - 1) st += 'border-bottom:1px solid var(--line);';
        }
        var b = el('button', { type: 'button', 'aria-pressed': 'false', style: st || null, text: it.label });
        if (it.aria) b.setAttribute('aria-label', it.aria);
        b.addEventListener('click', function () { onPick(it, b); });
        seg.appendChild(b);
        return b;
      });
      return { box: el('div', { class: 'control' }, [lbl, seg]), btns: btns };
    }
    function setPressed(btns, items, test) {
      btns.forEach(function (b, i) { b.setAttribute('aria-pressed', test(items[i]) ? 'true' : 'false'); });
    }

    // input picture
    var toolItems = [{ id: 'pen', label: 'Pen' }, { id: 'eraser', label: 'Eraser' }];
    var toolSeg = segGroup('Draw on the input', 'tool', toolItems, function (it) { tool = it.id; syncUI(); });
    var clearBtn = el('button', { type: 'button', class: 'btn btn-sm', text: 'Clear' });
    toolSeg.box.appendChild(el('div', { class: 'row' }, [toolSeg.box.lastChild, clearBtn]));
    controls.appendChild(toolSeg.box);

    var penId = pre + 'pen';
    var penOut = el('output', { for: penId, text: '' });
    var penInput = el('input', { type: 'range', id: penId, min: '1', max: '3', step: '1', value: String(penSize) });
    controls.appendChild(el('div', { class: 'control' }, [el('label', { for: penId }, [el('span', { text: 'Pen thickness' }), penOut]), penInput]));

    var picLbl = el('span', { class: 'control-label', id: pre + 'pics', text: 'Or load a picture' });
    var picRow = el('div', { class: 'row', role: 'group', 'aria-labelledby': pre + 'pics' });
    var picBtns = IMAGES.map(function (im) {
      var b = el('button', { type: 'button', class: 'btn btn-sm', 'aria-pressed': 'false', text: im.label });
      b.addEventListener('click', function () { loadImage(im); });
      picRow.appendChild(b);
      return b;
    });
    controls.appendChild(el('div', { class: 'control' }, [picLbl, picRow]));

    // kernel presets + editable grid
    var kSeg = segGroup('Kernel presets', 'kp', KERNELS, function (k) { setKernel(k); }, 2);
    controls.appendChild(kSeg.box);

    var kInputs = [];
    var kGrid = el('div', { role: 'group', 'aria-labelledby': pre + 'kg', style: 'display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;max-width:228px' });
    for (var ki = 0; ki < 9; ki++) {
      (function (idx) {
        var id = pre + 'k' + idx;
        var inp = el('input', { type: 'text', id: id, autocomplete: 'off', spellcheck: 'false', value: kText[idx],
          style: 'width:100%;min-width:0;text-align:center;font-family:var(--font-mono);font-size:.95rem;padding:7px 2px' });
        var lb = el('label', { for: id, class: 'visually-hidden', text: 'Kernel weight, row ' + (Math.floor(idx / 3) + 1) + ', column ' + (idx % 3 + 1) });
        inp.addEventListener('input', function () { onWeightInput(idx); });
        inp.addEventListener('change', function () { onWeightCommit(idx); });
        inp.addEventListener('blur', function () { onWeightCommit(idx); });
        inp.addEventListener('keydown', function (e) { onWeightKey(idx, e); });
        kInputs.push(inp);
        kGrid.appendChild(el('div', { style: 'min-width:0' }, [lb, inp]));
      })(ki);
    }
    var kAbout = el('p', { class: 'small', style: 'color:var(--muted);line-height:1.45' });
    controls.appendChild(el('div', { class: 'control' }, [
      el('span', { class: 'control-label', id: pre + 'kg', text: 'Kernel numbers (type your own)' }),
      kGrid, kAbout
    ]));

    // stride, padding, pooling
    var strideItems = [{ id: 1, label: '1 · every pixel' }, { id: 2, label: '2 · skip one' }];
    var strideSeg = segGroup('Stride (how far the filter jumps)', 'st', strideItems, function (it) { setGeometry(it.id, pad, true); });
    controls.appendChild(strideSeg.box);
    var padItems = [{ id: 0, label: 'Valid · no border' }, { id: 1, label: 'Same · border of 0s' }];
    var padSeg = segGroup('Padding (a border of 0s around the input)', 'pd', padItems, function (it) { setGeometry(stride, it.id, true); });
    controls.appendChild(padSeg.box);

    var poolId = pre + 'pool';
    var poolBox = el('input', { type: 'checkbox', id: poolId });
    controls.appendChild(el('div', { class: 'control' }, [
      el('label', { for: poolId, style: 'justify-content:flex-start;align-items:center;gap:10px;font-weight:600' }, [poolBox, el('span', { text: 'Apply ReLU, then 2 × 2 max-pool' })]),
      el('p', { class: 'small', style: 'color:var(--muted);line-height:1.45', html: '<b>ReLU</b> turns every negative number into 0. <b>Max-pool</b> keeps only the biggest number in each 2 × 2 block, so the map gets half as wide.' })
    ]));


    // tasks
    var taskItems = {};
    var taskList = el('ul', { class: 'lab-tasks' });
    TASKS.forEach(function (t) {
      var sr = el('span', { class: 'visually-hidden', text: doneSet[t.id] ? ' (done)' : '' });
      var li = el('li', { class: doneSet[t.id] ? 'done' : null }, [el('span', {}, [t.text, sr])]);
      li._sr = sr;
      taskItems[t.id] = li;
      taskList.appendChild(li);
    });
    var taskCount = el('span', { class: 'muted small num', text: '' });
    var taskMsg = el('p', { class: 'small', role: 'status', style: 'color:var(--ok);font-weight:600;min-height:1.2em;margin-top:6px' });
    controls.appendChild(el('div', {}, [
      el('div', { class: 'row-between', style: 'margin-bottom:6px' }, [el('h4', { text: 'Tasks' }), taskCount]),
      taskList, taskMsg
    ]));
    body.appendChild(controls);
    lab.appendChild(body);
    lab.appendChild(el('p', { class: 'lab-note', html:
      '<b>Why it matters in real ML:</b> a CNN (convolutional neural network) learns the numbers inside hundreds of kernels like these by itself during training; its first layer usually ends up with edge and blur detectors much like the presets here, ' +
      'and ReLU + pooling let deeper layers combine them into whole shapes, which is how a model reads handwritten PIN codes on letters or digits on a cheque.' }));
    root.appendChild(lab);

    var g = canvas.getContext('2d');

    /* ---------- state changes ---------- */
    function recompute() {
      R = convolve(img, W, stride, pad);
      PR = poolOn ? reluPool(R.out, R.n) : null;
      if (pinned) pinned = clampSel(pinned);
      if (hover) hover = clampSel(hover);
      calcKey = '';
    }
    function clampSel(s) {
      if (s.kind === 'p') {
        if (!PR || PR.m === 0) return { kind: 'f', i: Math.min(s.i * 2, R.n - 1), j: Math.min(s.j * 2, R.n - 1) };
        return { kind: 'p', i: clamp(s.i, 0, PR.m - 1), j: clamp(s.j, 0, PR.m - 1) };
      }
      return { kind: 'f', i: clamp(s.i, 0, R.n - 1), j: clamp(s.j, 0, R.n - 1) };
    }
    // keep the highlight on the same part of the picture when stride or padding changes
    function remap(s, oldS, oldP, newS, newP) {
      if (!s) return s;
      var f = s.kind === 'p' ? { i: s.i * 2, j: s.j * 2 } : s;
      var ci = f.i * oldS - oldP + 1, cj = f.j * oldS - oldP + 1; // centre pixel of the patch
      var n = outSize(newS, newP);
      var ni = clamp(Math.round((ci - 1 + newP) / newS), 0, n - 1), nj = clamp(Math.round((cj - 1 + newP) / newS), 0, n - 1);
      if (s.kind === 'p') return { kind: 'p', i: Math.floor(ni / 2), j: Math.floor(nj / 2) };
      return { kind: 'f', i: ni, j: nj };
    }
    function strongest() {
      var best = 0, bi = 0;
      for (var k = 0; k < R.out.length; k++) if (R.out[k] > best) { best = R.out[k]; bi = k; }
      return { kind: 'f', i: Math.floor(bi / R.n), j: bi % R.n };
    }

    function loadImage(im) {
      stopAnim();
      rasterize(img, im.strokes);
      imgId = im.id;
      recompute(); syncUI(); requestDraw();
    }
    function setKernel(k) {
      stopAnim();
      kText = k.w.slice();
      W = kText.map(parseWeight);
      kernelTyped = false;
      kInputs.forEach(function (inp, i) { inp.value = kText[i]; inp.removeAttribute('aria-invalid'); inp.style.borderColor = ''; });
      recompute(); syncUI(); requestDraw();
      if (k.id === 'sobely' && !doneSet.t2) say('Presets do not tick task 2: now change the numbers in the grid yourself.');
    }
    function onWeightInput(idx) {
      var inp = kInputs[idx], v = parseWeight(inp.value);
      if (v === null) {
        inp.setAttribute('aria-invalid', 'true');
        inp.style.borderColor = 'var(--bad)';
        return;
      }
      inp.removeAttribute('aria-invalid');
      inp.style.borderColor = '';
      stopAnim();
      kText[idx] = inp.value.trim();
      W[idx] = v;
      kernelTyped = true;
      recompute(); syncUI(); requestDraw();
      checkTasks();
    }
    function onWeightCommit(idx) {
      var inp = kInputs[idx];
      if (parseWeight(inp.value) === null) {
        inp.value = kText[idx];
        inp.removeAttribute('aria-invalid');
        inp.style.borderColor = '';
      }
    }
    function onWeightKey(idx, e) {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      var step = e.shiftKey ? 0.1 : 1;
      var v = clamp(tidy(W[idx] + (e.key === 'ArrowUp' ? step : -step)), -100, 100);
      kInputs[idx].value = weightText(v);
      onWeightInput(idx);
    }
    function setGeometry(s, p, byUser) {
      stopAnim();
      var oldS = stride, oldP = pad;
      if (s === oldS && p === oldP) return;
      pinned = remap(pinned, oldS, oldP, s, p);
      hover = null;
      stride = s; pad = p;
      recompute(); syncUI(); requestDraw();
      if (byUser) {
        if (stride === 2 && oldS === 1) markDone('t3');
        checkTasks();
      }
    }
    poolBox.addEventListener('change', function () {
      stopAnim();
      poolOn = !!poolBox.checked;
      recompute();
      if (poolOn && pinned && pinned.kind === 'f' && PR && PR.m > 0) pinned = { kind: 'p', i: Math.min(Math.floor(pinned.i / 2), PR.m - 1), j: Math.min(Math.floor(pinned.j / 2), PR.m - 1) };
      syncUI(); requestDraw();
      checkTasks();
    });
    clearBtn.addEventListener('click', function () {
      stopAnim();
      img.fill(0); imgId = 'blank';
      recompute(); syncUI(); requestDraw();
    });
    penInput.addEventListener('input', function () {
      var v = parseInt(penInput.value, 10);
      if (v >= 1 && v <= 3) penSize = v;
      syncUI();
    });

    /* ---------- tasks ---------- */
    function say(s) { taskMsg.textContent = s; }
    function updateTaskCount() {
      var n = 0;
      TASKS.forEach(function (t) { if (doneSet[t.id]) n++; });
      taskCount.textContent = n + ' / ' + TASKS.length + ' done';
    }
    function markDone(id) {
      if (doneSet[id]) return;
      doneSet[id] = true;
      var li = taskItems[id];
      li.classList.add('done');
      li._sr.textContent = ' (done)';
      say('✓ Task done: ' + DONE_MSG[id]);
      if (ctx && ctx.onTaskDone) ctx.onTaskDone(id);
      updateTaskCount();
    }
    function checkTasks() {
      if (kernelTyped && detects(W, 'h')) markDone('t2');
      if (poolOn && PR && PR.m === 7) markDone('t4');
    }
    function checkInspect(sel) {
      if (doneSet.t1 || !sel || sel.kind !== 'f' || !R || R.maxAbs < 1) return;
      if (!detects(W, 'v')) return;
      var v = R.out[sel.i * R.n + sel.j];
      if (Math.abs(v) >= 0.5 * R.maxAbs) markDone('t1');
    }

    /* ---------- UI sync ---------- */
    function kernelPreset() {
      for (var i = 0; i < KERNELS.length; i++) {
        var w = KERNELS[i].w, same = true;
        for (var k = 0; k < 9; k++) if (Math.abs(parseWeight(w[k]) - W[k]) > 1e-9) { same = false; break; }
        if (same) return KERNELS[i];
      }
      return null;
    }
    function tintFor(v, scale, maxPct) {
      if (!scale || Math.abs(v) < 1e-9) return '';
      var pct = Math.round(Math.min(1, Math.abs(v) / scale) * maxPct);
      return 'color-mix(in srgb, var(' + (v > 0 ? '--series-1' : '--series-2') + ') ' + pct + '%, var(--surface))';
    }
    function syncUI() {
      var kp = kernelPreset(), S = kernelSum(W);
      setPressed(kSeg.btns, KERNELS, function (k) { return kp && k.id === kp.id; });
      setPressed(toolSeg.btns, toolItems, function (t) { return t.id === tool; });
      setPressed(strideSeg.btns, strideItems, function (t) { return t.id === stride; });
      setPressed(padSeg.btns, padItems, function (t) { return t.id === pad; });
      picBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', IMAGES[i].id === imgId ? 'true' : 'false'); b.style.borderColor = IMAGES[i].id === imgId ? 'var(--indigo)' : ''; });
      poolBox.checked = poolOn;
      penOut.textContent = ['thin', 'medium', 'thick'][penSize - 1];
      var maxW = 0;
      W.forEach(function (w) { maxW = Math.max(maxW, Math.abs(w)); });
      kInputs.forEach(function (inp, i) { if (inp.getAttribute('aria-invalid') !== 'true') inp.style.background = tintFor(W[i], maxW, 38); });

      var about;
      if (kp) about = kp.about;
      else {
        about = 'Your own kernel. Its weights add up to ' + fmt(S) + '. ';
        if (Math.abs(S) < 1e-9) about += 'A sum of 0 means flat areas give 0, so only changes (edges and lines) show up.';
        else if (Math.abs(S - 1) < 1e-9) about += 'A sum of 1 keeps flat areas at the same brightness.';
        else about += 'Flat ink areas come out ' + fmt(S) + ' × as strong.';
      }
      kAbout.textContent = about;

      stIn.v.textContent = N + ' × ' + N;
      stF.v.textContent = R.n + ' × ' + R.n;
      stP.v.textContent = poolOn ? PR.m + ' × ' + PR.m : 'off';
      stP.v.style.color = poolOn ? '' : 'var(--muted)';
      stSum.v.textContent = fmt(S);

      var inner = N + 2 * pad - KS, q = inner / stride;
      var html = '<div style="font-weight:700">Output size</div>' +
        '<div class="mono" style="font-size:.85rem">out = ⌊(n + 2p − k) ÷ s⌋ + 1</div>' +
        '<div class="mono" style="font-size:.85rem">= ⌊(' + N + ' + 2×' + pad + ' − ' + KS + ') ÷ ' + stride + '⌋ + 1' +
        (Math.abs(q - Math.round(q)) > 1e-9 ? ' = ⌊' + fmt(q) + '⌋ + 1' : '') +
        ' = <b style="color:var(--ink)">' + R.n + '</b></div>';
      if (poolOn) {
        html += '<div class="mono" style="font-size:.85rem">2×2 pool: ⌊' + R.n + ' ÷ 2⌋ = <b style="color:var(--ink)">' + PR.m + '</b>' +
          (R.n % 2 ? '<span style="font-family:var(--font-body)"> (the odd last row and column are dropped)</span>' : '') + '</div>';
      }
      html += '<div class="small muted" style="margin-top:4px;line-height:1.4">n = input size, p = padding, k = kernel size, s = stride; ⌊ ⌋ means round down.</div>';
      formula.innerHTML = html;

      playBtn.innerHTML = anim ? '<span aria-hidden="true">■</span> Stop' : '<span aria-hidden="true">▶</span> Watch the filter slide';
      updateCanvasLabel();
      updateCalc();
      updateTaskCount();
    }
    function imgName() {
      if (imgId === 'blank') return 'an empty picture';
      if (imgId === 'drawing') return 'your own drawing';
      var im = byId(IMAGES, imgId);
      return im ? im.name : 'a picture';
    }
    function updateCanvasLabel() {
      var kp = kernelPreset();
      var s = 'Input: ' + imgName() + ', 28 by 28 pixels. Kernel: ' + (kp ? kp.label : 'your own') + '. Feature map ' + R.n + ' by ' + R.n +
        ', values from ' + fmt(R.lo) + ' to ' + fmt(R.hi) + '.' + (poolOn ? ' After ReLU and max-pool: ' + PR.m + ' by ' + PR.m + '.' : '');
      var a = active();
      if (a && a.kind === 'f') s += ' Highlighted feature-map pixel row ' + (a.i + 1) + ', column ' + (a.j + 1) + ' = ' + fmt(R.out[a.i * R.n + a.j]) + '.';
      if (a && a.kind === 'p') s += ' Highlighted pooled pixel row ' + (a.i + 1) + ', column ' + (a.j + 1) + ' = ' + fmt(PR.P[a.i * PR.m + a.j]) + '.';
      canvas.setAttribute('aria-label', s);
    }

    function active() {
      if (anim && anim.cur) return anim.cur;
      return hover || pinned;
    }
    function cellBox(text, bg, fg, extra) {
      return '<span style="display:flex;align-items:center;justify-content:center;min-height:2em;padding:0 2px;border-radius:4px;white-space:nowrap;' +
        (bg ? 'background:' + bg + ';' : '') + (fg ? 'color:' + fg + ';' : '') + (extra || '') + '">' + esc(text) + '</span>';
    }
    function gridBox(caption, cells, cols, colW) {
      return '<div style="display:flex;flex-direction:column;gap:3px;min-width:0">' +
        '<span style="font-size:.76rem;color:var(--muted);font-weight:600">' + caption + '</span>' +
        '<div style="display:grid;grid-template-columns:repeat(' + cols + ',' + (colW || '3.3em') + ');gap:2px;font-family:var(--font-mono);font-size:.78rem;font-variant-numeric:tabular-nums">' +
        cells + '</div></div>';
    }
    function op(s, grid) {
      return '<div style="display:flex;align-items:flex-end;gap:10px;min-width:0"><span aria-hidden="true" style="font-size:1.2rem;color:var(--muted);padding-bottom:.9em">' + s + '</span>' + grid + '</div>';
    }
    function valueSwatch(v, scale) {
      var c = T ? colorOf(v, scale) : null;
      return c ? '<span aria-hidden="true" style="display:inline-block;width:.9em;height:.9em;border-radius:3px;vertical-align:-.1em;margin-left:4px;border:1px solid var(--line);background:' + rgb(c) + '"></span>' : '';
    }
    function updateCalc() {
      var a = active();
      if (!a || !R) return;
      var key = a.kind + a.i + ',' + a.j;
      if (key === calcKey) return;
      calcKey = key;
      if (a.kind === 'f') calcFeature(a.i, a.j); else calcPool(a.i, a.j);
    }
    function calcFeature(i, j) {
      var r0 = i * stride - pad, c0 = j * stride - pad;
      var patch = '', kern = '', prod = '', rounded = false, padded = false, maxP = 0, maxW = 0, prods = [];
      for (var k = 0; k < 9; k++) maxW = Math.max(maxW, Math.abs(W[k]));
      for (var a = 0; a < 3; a++) for (var b = 0; b < 3; b++) {
        var r = r0 + a, c = c0 + b, inside = r >= 0 && r < N && c >= 0 && c < N;
        var x = inside ? img[r * N + c] / Q : 0, w = W[a * 3 + b], p = tidy(w * x);
        prods.push(p);
        if (Math.abs(p) > maxP) maxP = Math.abs(p);
        if (!inside) padded = true;
        if (inside) {
          var pct = Math.round(x * 85);
          patch += cellBox(fmt(x), pct ? 'color-mix(in srgb, var(--ink) ' + pct + '%, var(--surface))' : 'var(--surface)', x >= 0.6 ? 'var(--surface)' : 'var(--ink)');
        } else {
          patch += cellBox('0', 'transparent', 'var(--muted)', 'border:1px dashed var(--muted);');
        }
        kern += cellBox(minus(kText[a * 3 + b]), tintFor(w, maxW, 38) || 'var(--surface)', 'var(--ink)');
      }
      prods.forEach(function (p) {
        if (needsRounding(p)) rounded = true;
        prod += cellBox(fmt(p), tintFor(p, maxP, 40) || 'var(--surface)', 'var(--ink)');
      });
      var v = R.out[i * R.n + j];
      calcHead.innerHTML = 'Feature-map pixel: row ' + (i + 1) + ', column ' + (j + 1) +
        ' <span class="muted" style="font-weight:400">(its 3 × 3 patch is outlined in yellow on the input)</span>';
      calcBody.innerHTML = gridBox('Input patch', patch, 3) + op('×', gridBox('Kernel', kern, 3)) + op('=', gridBox('Products', prod, 3));
      calcFoot.innerHTML = 'Add up the 9 products: <b class="mono" style="font-size:1rem">' + fmt(v) + '</b>' + valueSwatch(v, R.maxAbs) +
        '. That one sum is the highlighted pixel of the feature map.' +
        (padded ? ' <span class="muted">Dashed cells are the border of 0s added by “same” padding.</span>' : '') +
        (rounded ? ' <span class="muted">(Products are shown rounded to 2 decimals.)</span>' : '');
    }
    function calcPool(i, j) {
      var raw = '', rel = '', vals = [], scale = R.maxAbs;
      for (var a = 0; a < 2; a++) for (var b = 0; b < 2; b++) vals.push(R.out[(2 * i + a) * R.n + 2 * j + b]);
      var best = PR.P[i * PR.m + j];
      var bestIdx = -1;
      vals.forEach(function (v, k) {
        raw += cellBox(fmt(v), tintFor(v, scale, 40) || 'var(--surface)', 'var(--ink)');
        var rv = Math.max(0, v);
        if (bestIdx < 0 && Math.abs(rv - best) < 1e-12) bestIdx = k;
      });
      vals.forEach(function (v, k) {
        var rv = Math.max(0, v);
        rel += cellBox(fmt(rv), tintFor(rv, scale, 40) || 'var(--surface)', 'var(--ink)', k === bestIdx ? 'outline:2px solid var(--haldi);outline-offset:-2px;font-weight:700;' : '');
      });
      var rf = stride + 3; // input area one pooled pixel "sees": (2 − 1) × stride + 3
      calcHead.innerHTML = 'Pooled pixel: row ' + (i + 1) + ', column ' + (j + 1) +
        ' <span class="muted" style="font-weight:400">(from feature-map rows ' + (2 * i + 1) + '–' + (2 * i + 2) + ', columns ' + (2 * j + 1) + '–' + (2 * j + 2) + ')</span>';
      calcBody.innerHTML = gridBox('Feature-map block', raw, 2, '3.6em') + op('→', gridBox('After ReLU', rel, 2, '3.6em')) +
        op('→', gridBox('Max', cellBox(fmt(best), tintFor(best, scale, 40) || 'var(--surface)', 'var(--ink)', 'font-weight:700;'), 1, '3.6em'));
      calcFoot.innerHTML = 'ReLU turns the negatives into 0, then max-pool keeps only the biggest of the 4: <b class="mono" style="font-size:1rem">' + fmt(best) + '</b>' + valueSwatch(best, scale) +
        '. This one number sums up a ' + rf + ' × ' + rf + ' patch of the input (dashed yellow box), so deeper layers see bigger areas.';
    }

    /* ---------- drawing ---------- */
    function readTheme() {
      var cs = getComputedStyle(document.documentElement);
      function get(n, fb) { return parseColor(cs.getPropertyValue(n), fb); }
      var t = {
        surface: get('--surface', [255, 255, 255]), surface2: get('--surface-2', [235, 236, 245]),
        ink: get('--ink', [22, 25, 48]), muted: get('--muted', [86, 91, 122]), line: get('--line', [215, 217, 232]),
        haldi: get('--haldi', [226, 164, 0]), pos: get('--series-1', [45, 56, 138]), neg: get('--series-2', [192, 64, 44])
      };
      t.gray = [];
      for (var k = 0; k <= Q; k++) t.gray.push(mixc(t.surface2, t.ink, k / Q));
      t.div = []; // diverging scale: index 0 = most negative, 100 = zero, 200 = most positive
      for (var d = 0; d <= 200; d++) {
        var x = d / 100 - 1, e = Math.pow(Math.abs(x), 0.8);
        t.div.push(x < 0 ? mixc(t.surface2, t.neg, e) : mixc(t.surface2, t.pos, e));
      }
      t.font = getComputedStyle(root).fontFamily || 'system-ui, sans-serif';
      t.dark = luminance(t.surface) < 0.4;
      return t;
    }
    function colorOf(v, scale) {
      if (!T) return null;
      if (!scale) return T.div[100];
      return T.div[Math.round(clamp(v / scale, -1, 1) * 100) + 100];
    }

    function snap(v) { return Math.round(v * dpr) / dpr; }
    function cellSnap(c) { return Math.max(2, Math.floor(c * dpr)) / dpr; }
    function computeLayout(Wd) {
      var m = 12, gap = 26, titleH = 22, legendH = 30;
      var c = (Wd - 2 * m - 2 * gap) / 72; // 30 cells (input + border) + 28 (feature) + 14 (pooled)
      var Lo = { W: Wd, gap: gap };
      if (c >= 6.5) {
        c = cellSnap(Math.min(c, 13));
        var used = 72 * c + 2 * gap, x0 = snap((Wd - used) / 2), top = 10 + titleH;
        Lo.mode = 'wide';
        Lo.c1 = Lo.c2 = c;
        Lo.inSlot = { x: x0, y: top, w: 30 * c };
        Lo.inX = x0 + c; Lo.inY = top + c;
        Lo.fSlot = { x: snap(x0 + 30 * c + gap), y: top + c, w: 28 * c };
        Lo.pSlot = { x: snap(Lo.fSlot.x + 28 * c + gap), y: top + c, w: 14 * c };
        Lo.titleY = top - 8; Lo.titleY2 = top - 8;
        Lo.H = Math.ceil(top + 30 * c + legendH - 4);
        Lo.layer = { x: Lo.inSlot.x + 30 * c + 2, y: 0, w: Wd - (Lo.inSlot.x + 30 * c + 2), h: Lo.H };
      } else {
        var c1 = cellSnap(Math.min((Wd - 2 * m) / 30, 10.5));
        var c2 = cellSnap(Math.min((Wd - 2 * m - gap) / 42, c1));
        var top1 = 10 + titleH, x1 = snap((Wd - 30 * c1) / 2);
        Lo.mode = 'narrow';
        Lo.c1 = c1; Lo.c2 = c2;
        Lo.inSlot = { x: x1, y: top1, w: 30 * c1 };
        Lo.inX = x1 + c1; Lo.inY = top1 + c1;
        var top2 = snap(top1 + 30 * c1 + 14 + titleH), x2 = snap((Wd - 42 * c2 - gap) / 2);
        Lo.fSlot = { x: x2, y: top2, w: 28 * c2 };
        Lo.pSlot = { x: snap(x2 + 28 * c2 + gap), y: top2, w: 14 * c2 };
        Lo.titleY = top1 - 8; Lo.titleY2 = top2 - 8;
        Lo.H = Math.ceil(top2 + 28 * c2 + legendH);
        var ly = top1 + 30 * c1 + 4;
        Lo.layer = { x: 0, y: ly, w: Wd, h: Lo.H - ly };
      }
      return Lo;
    }
    // where the feature map and pooled map sit inside their (fixed-size) slots
    function fGeom() {
      var n = R.n, c = L.c2, off = (28 - n) / 2 * c;
      return { x: snap(L.fSlot.x + off), y: snap(L.fSlot.y + off), c: c, n: n };
    }
    function pGeom() {
      if (!PR) return null;
      var m = PR.m, c = L.c2, off = (14 - m) / 2 * c;
      return { x: snap(L.pSlot.x + off), y: snap(L.pSlot.y + off), c: c, n: m };
    }

    function resize() {
      if (!alive) return;
      var r = wrap.getBoundingClientRect();
      var Wd = Math.max(200, Math.floor(r.width));
      dpr = Math.min(window.devicePixelRatio || 1, 3);
      var key = Wd + 'x' + dpr;
      if (key !== layoutKey) {
        layoutKey = key;
        L = computeLayout(Wd);
        wrap.style.height = L.H + 'px';
        var bw = Math.round(L.W * dpr), bh = Math.round(L.H * dpr);
        if (canvas.width !== bw) canvas.width = bw;
        if (canvas.height !== bh) canvas.height = bh;
        outLayer.style.left = L.layer.x + 'px';
        outLayer.style.top = L.layer.y + 'px';
        outLayer.style.width = Math.max(0, L.layer.w) + 'px';
        outLayer.style.height = Math.max(0, L.layer.h) + 'px';
        var narrow = left.getBoundingClientRect().width < 480;
        stats.style.gridTemplateColumns = narrow ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))';
      }
      draw();
    }

    function requestDraw() { if (!raf && alive) raf = requestAnimationFrame(frame); }
    function frame(now) {
      raf = 0;
      if (!alive) return;
      if (anim) stepAnim(now);
      draw();
      if (anim) raf = requestAnimationFrame(frame);
    }

    function paintImage(cv, n, colorAt) {
      if (cv.width !== n) cv.width = n;
      if (cv.height !== n) cv.height = n;
      if (n <= 0) return;
      var c2 = cv.getContext('2d'), id = c2.createImageData(n, n), d = id.data;
      for (var k = 0; k < n * n; k++) {
        var col = colorAt(k);
        d[k * 4] = col[0]; d[k * 4 + 1] = col[1]; d[k * 4 + 2] = col[2]; d[k * 4 + 3] = 255;
      }
      c2.putImageData(id, 0, 0);
    }
    function gridLines(x, y, c, n, color, alpha) {
      if (c * dpr < 6) return;
      g.save();
      g.globalAlpha = alpha;
      g.strokeStyle = color;
      g.lineWidth = 1 / dpr;
      g.beginPath();
      var h = 0.5 / dpr, size = n * c;
      for (var k = 1; k < n; k++) {
        var p = snap(x + k * c) + h, q = snap(y + k * c) + h;
        g.moveTo(p, y); g.lineTo(p, y + size);
        g.moveTo(x, q); g.lineTo(x + size, q);
      }
      g.stroke();
      g.restore();
    }
    function frameRect(x, y, w, h, color, lw, dash) {
      g.save();
      g.strokeStyle = color; g.lineWidth = lw;
      if (dash) g.setLineDash(dash);
      g.strokeRect(x, y, w, h);
      g.restore();
    }
    function fitText(options, maxW) {
      for (var i = 0; i < options.length; i++) if (g.measureText(options[i]).width <= maxW) return options[i];
      return options[options.length - 1];
    }
    function title(text, x, y, maxW) {
      g.fillStyle = rgb(T.ink);
      g.font = '600 13px ' + T.font;
      g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      g.fillText(fitText(text, maxW), x, y);
    }
    function arrowRight(x0, x1, y) {
      g.save();
      g.strokeStyle = rgb(T.muted); g.fillStyle = rgb(T.muted); g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(x0, y); g.lineTo(x1 - 6, y); g.stroke();
      g.beginPath(); g.moveTo(x1, y); g.lineTo(x1 - 7, y - 4.5); g.lineTo(x1 - 7, y + 4.5); g.closePath(); g.fill();
      g.restore();
    }
    function cone(a, b) {
      // join the near corners of rectangle a (source) and rectangle b (result)
      g.save();
      g.strokeStyle = rgb(T.haldi, 0.75); g.lineWidth = 1.25;
      g.beginPath();
      if (b.x >= a.x + a.w - 0.5) {
        g.moveTo(a.x + a.w, a.y); g.lineTo(b.x, b.y);
        g.moveTo(a.x + a.w, a.y + a.h); g.lineTo(b.x, b.y + b.h);
      } else {
        g.moveTo(a.x, a.y + a.h); g.lineTo(b.x, b.y);
        g.moveTo(a.x + a.w, a.y + a.h); g.lineTo(b.x + b.w, b.y);
      }
      g.stroke();
      g.restore();
    }

    function draw() {
      if (!L || !R) return;
      T = readTheme();
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.imageSmoothingEnabled = false;
      g.fillStyle = rgb(T.surface);
      g.fillRect(0, 0, L.W, L.H);
      var c1 = L.c1, inSize = N * c1;

      /* titles */
      title(pad ? ['Input 28 × 28, plus a border of 0s', 'Input 28 × 28 + 0-border', 'Input + 0-border'] : ['Input 28 × 28', 'Input'], L.inX, L.titleY, L.inSlot.w - c1);
      title(['Feature map ' + R.n + ' × ' + R.n, R.n + ' × ' + R.n], L.fSlot.x, L.titleY2, L.fSlot.w + L.gap - 6);
      if (poolOn) title(['ReLU + max-pool ' + PR.m + ' × ' + PR.m, 'Pooled ' + PR.m + ' × ' + PR.m, PR.m + ' × ' + PR.m], L.pSlot.x, L.titleY2, L.W - L.pSlot.x - 4);
      else title(['ReLU + max-pool', 'Pooling'], L.pSlot.x, L.titleY2, L.W - L.pSlot.x - 4);

      /* input, with the padding border when "same" */
      if (pad) {
        g.fillStyle = rgb(mixc(T.surface, T.surface2, 0.45));
        g.fillRect(L.inX - c1, L.inY - c1, inSize + 2 * c1, inSize + 2 * c1);
        gridLines(L.inX - c1, L.inY - c1, c1, N + 2, rgb(T.line), 0.9);
        frameRect(L.inX - c1 + 0.5, L.inY - c1 + 0.5, inSize + 2 * c1 - 1, inSize + 2 * c1 - 1, rgb(T.muted), 1, [3, 3]);
      }
      paintImage(inCv, N, function (k) { return T.gray[img[k]]; });
      g.drawImage(inCv, L.inX, L.inY, inSize, inSize);
      gridLines(L.inX, L.inY, c1, N, rgb(T.line), T.dark ? 0.55 : 0.75);
      frameRect(L.inX - 0.5, L.inY - 0.5, inSize + 1, inSize + 1, rgb(T.line), 1);

      /* feature map */
      var F = fGeom(), fSize = F.n * F.c;
      var revealed = anim ? anim.count : R.n * R.n;
      paintImage(fCv, R.n, function (k) { return k < revealed ? colorOf(R.out[k], R.maxAbs) : T.surface; });
      g.drawImage(fCv, F.x, F.y, fSize, fSize);
      gridLines(F.x, F.y, F.c, F.n, rgb(T.line), T.dark ? 0.55 : 0.75);
      frameRect(F.x - 0.5, F.y - 0.5, fSize + 1, fSize + 1, rgb(T.line), 1);

      /* pooled map, or a placeholder when it is switched off */
      var P = pGeom();
      if (P && P.n > 0) {
        var pSize = P.n * P.c;
        paintImage(pCv, P.n, function (k) {
          var pi = Math.floor(k / P.n), pj = k % P.n;
          var needed = (2 * pi + 1) * R.n + 2 * pj + 1;
          return needed < revealed ? colorOf(PR.P[k], R.maxAbs) : T.surface;
        });
        g.drawImage(pCv, P.x, P.y, pSize, pSize);
        gridLines(P.x, P.y, P.c, P.n, rgb(T.line), T.dark ? 0.55 : 0.75);
        frameRect(P.x - 0.5, P.y - 0.5, pSize + 1, pSize + 1, rgb(T.line), 1);
      } else {
        var sw = L.pSlot.w;
        frameRect(L.pSlot.x + 0.5, L.pSlot.y + 0.5, sw - 1, sw - 1, rgb(T.muted), 1, [4, 4]);
        g.fillStyle = rgb(T.muted);
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = '600 13px ' + T.font;
        g.fillText('Off', L.pSlot.x + sw / 2, L.pSlot.y + sw / 2 - 8);
        g.font = '12px ' + T.font;
        g.fillText(fitText(['tick the box', 'tick box', ''], sw - 8), L.pSlot.x + sw / 2, L.pSlot.y + sw / 2 + 9);
      }

      /* arrows between the pictures (wide layout) */
      if (L.mode === 'wide') {
        var ay = L.inY + inSize / 2;
        arrowRight(L.inSlot.x + L.inSlot.w + 5, L.fSlot.x - 5, ay);
        arrowRight(L.fSlot.x + L.fSlot.w + 5, L.pSlot.x - 5, L.pSlot.y + L.pSlot.w / 2);
      }

      /* highlight: which input patch makes which output pixel */
      var a = active();
      if (a && a.kind === 'f') {
        var pr = { x: L.inX + (a.j * stride - pad) * c1, y: L.inY + (a.i * stride - pad) * c1, w: 3 * c1, h: 3 * c1 };
        var oc = { x: F.x + a.j * F.c, y: F.y + a.i * F.c, w: F.c, h: F.c };
        g.fillStyle = rgb(T.haldi, 0.18); g.fillRect(pr.x, pr.y, pr.w, pr.h);
        cone(pr, oc);
        frameRect(pr.x, pr.y, pr.w, pr.h, rgb(T.haldi), 2.5);
        frameRect(oc.x - 1, oc.y - 1, oc.w + 2, oc.h + 2, rgb(T.haldi), 2.5);
      } else if (a && a.kind === 'p' && P) {
        var fw = { x: F.x + 2 * a.j * F.c, y: F.y + 2 * a.i * F.c, w: 2 * F.c, h: 2 * F.c };
        var pc = { x: P.x + a.j * P.c, y: P.y + a.i * P.c, w: P.c, h: P.c };
        var rf = stride + 3;
        var rr = { x: L.inX + (2 * a.j * stride - pad) * c1, y: L.inY + (2 * a.i * stride - pad) * c1, w: rf * c1, h: rf * c1 };
        g.fillStyle = rgb(T.haldi, 0.14); g.fillRect(rr.x, rr.y, rr.w, rr.h);
        frameRect(rr.x, rr.y, rr.w, rr.h, rgb(T.haldi), 2, [5, 3]);
        cone(fw, pc);
        frameRect(fw.x - 1, fw.y - 1, fw.w + 2, fw.h + 2, rgb(T.haldi), 2.5);
        frameRect(pc.x - 1, pc.y - 1, pc.w + 2, pc.h + 2, rgb(T.haldi), 2.5);
      }

      /* colour legend under the feature map */
      drawLegend();
    }
    function drawLegend() {
      var y = L.fSlot.y + 28 * L.c2 + 17;
      var x0 = L.fSlot.x, avail = L.fSlot.w;
      g.font = '12px ' + T.font;
      g.textBaseline = 'middle';
      if (!(R.maxAbs > 0)) {
        g.fillStyle = rgb(T.muted); g.textAlign = 'left';
        g.fillText('Every value is 0', x0, y);
        return;
      }
      var lo = fmt(-R.maxAbs), hi = (R.maxAbs > 0 ? '+' : '') + fmt(R.maxAbs);
      var lw = g.measureText(lo).width, hw = g.measureText(hi).width;
      var bw = Math.max(40, Math.min(150, avail - lw - hw - 16)), bx = x0 + lw + 6;
      g.fillStyle = rgb(T.muted); g.textAlign = 'left';
      g.fillText(lo, x0, y);
      var steps = 50;
      for (var s = 0; s < steps; s++) {
        g.fillStyle = rgb(T.div[Math.round((s / (steps - 1)) * 200)]);
        g.fillRect(bx + (s * bw) / steps, y - 5, bw / steps + 0.6, 10);
      }
      frameRect(bx - 0.5, y - 5.5, bw + 1, 11, rgb(T.line), 1);
      g.fillStyle = rgb(T.muted);
      g.fillText(hi, bx + bw + 6, y);
    }

    /* ---------- "watch the filter slide" animation ---------- */
    function startAnim() {
      var total = R.n * R.n;
      anim = { t0: null, total: total, count: 0, cur: null, prev: pinned };
      hover = null;
      syncUI();
      requestDraw();
    }
    function stepAnim(now) {
      if (anim.t0 == null) anim.t0 = now;
      var t = (now - anim.t0) / 1000, slow = Math.min(10, anim.total), count;
      // the first few stops slowly (so you can follow the patch), then speed up to finish in about 8 s
      if (t < slow * 0.3) count = Math.floor(t / 0.3) + 1;
      else count = Math.floor(slow + ((t - slow * 0.3) / 5.2) * (anim.total - slow)) + 1;
      count = Math.min(anim.total, count);
      anim.count = count;
      var k = count - 1;
      anim.cur = { kind: 'f', i: Math.floor(k / R.n), j: k % R.n };
      updateCalc();
      if (count >= anim.total) {
        var prev = anim.prev;
        anim = null;
        pinned = prev ? clampSel(prev) : pinned;
        calcKey = '';
        syncUI();
      }
    }
    function stopAnim() {
      if (!anim) return;
      var prev = anim.prev;
      anim = null;
      if (prev) pinned = clampSel(prev);
      calcKey = '';
      syncUI();
      requestDraw();
    }
    playBtn.addEventListener('click', function () {
      if (anim) stopAnim(); else startAnim();
    });

    /* ---------- pointer + keyboard ---------- */
    function local(e) {
      var r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function hit(p) {
      if (!L || !R) return null;
      var c1 = L.c1;
      if (p.x >= L.inX - c1 && p.x < L.inX + (N + 1) * c1 && p.y >= L.inY - c1 && p.y < L.inY + (N + 1) * c1) {
        return { kind: 'in', x: (p.x - L.inX) / c1, y: (p.y - L.inY) / c1 };
      }
      var F = fGeom();
      if (p.x >= F.x && p.y >= F.y) {
        var j = Math.floor((p.x - F.x) / F.c), i = Math.floor((p.y - F.y) / F.c);
        if (i < F.n && j < F.n) return { kind: 'f', i: i, j: j };
      }
      var P = pGeom();
      if (P && p.x >= P.x && p.y >= P.y) {
        var pj = Math.floor((p.x - P.x) / P.c), pi = Math.floor((p.y - P.y) / P.c);
        if (pi < P.n && pj < P.n) return { kind: 'p', i: pi, j: pj };
      }
      return null;
    }
    function sameSel(a, b) { return (!a && !b) || (a && b && a.kind === b.kind && a.i === b.i && a.j === b.j); }
    function penRadius() { return tool === 'eraser' ? [1.2, 1.7, 2.3][penSize - 1] : [0.55, 1, 1.5][penSize - 1]; }
    function paintTo(h) {
      var x0 = stroke.x, y0 = stroke.y;
      stroke.x = h.x; stroke.y = h.y;
      if (paintSeg(img, x0, y0, h.x, h.y, penRadius(), tool === 'eraser')) {
        imgId = 'drawing';
        recompute();
        updateCalc();
        requestDraw();
      }
    }
    function select(sel, how) {
      if (how === 'hover') {
        if (sameSel(hover, sel)) return;
        hover = sel;
      } else {
        hover = null;
        if (sameSel(pinned, sel)) return;
        pinned = sel;
      }
      updateCalc();
      updateCanvasLabel();
      requestDraw();
      checkInspect(sel);
    }
    function onDown(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      var p = local(e), h = hit(p);
      if (!h) return;
      stopAnim();
      var tgt = e.currentTarget;
      try { tgt.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      if (h.kind === 'in') {
        if (e.currentTarget !== canvas) return;
        stroke = { id: e.pointerId, x: h.x, y: h.y };
        paintTo(h);
        e.preventDefault();
      } else {
        scrub = e.pointerId;
        select({ kind: h.kind, i: h.i, j: h.j }, 'pin');
      }
    }
    function onMove(e) {
      var p = local(e);
      if (stroke && e.pointerId === stroke.id) {
        paintTo({ x: (p.x - L.inX) / L.c1, y: (p.y - L.inY) / L.c1 });
        return;
      }
      var h = hit(p);
      if (scrub === e.pointerId) {
        if (h && h.kind !== 'in') select({ kind: h.kind, i: h.i, j: h.j }, 'pin');
        return;
      }
      if (e.pointerType === 'mouse') {
        var target = e.currentTarget;
        target.style.cursor = h && h.kind === 'in' ? 'crosshair' : h ? 'pointer' : 'default';
        if (!anim) select(h && h.kind !== 'in' ? { kind: h.kind, i: h.i, j: h.j } : null, 'hover');
      }
    }
    function onUp(e) {
      if (stroke && e.pointerId === stroke.id) {
        stroke = null;
        syncUI();
      }
      if (scrub === e.pointerId) scrub = null;
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
    function onLeave(e) {
      if (e.pointerType === 'mouse' && !stroke && scrub == null && hover) { hover = null; calcKey = ''; updateCalc(); updateCanvasLabel(); requestDraw(); }
    }
    function onKey(e) {
      var di = 0, dj = 0;
      if (e.key === 'ArrowLeft') dj = -1;
      else if (e.key === 'ArrowRight') dj = 1;
      else if (e.key === 'ArrowUp') di = -1;
      else if (e.key === 'ArrowDown') di = 1;
      else return;
      e.preventDefault();
      stopAnim();
      var s = pinned || { kind: 'f', i: 0, j: 0 };
      var n = s.kind === 'p' ? PR.m : R.n;
      select({ kind: s.kind, i: clamp(s.i + di, 0, n - 1), j: clamp(s.j + dj, 0, n - 1) }, 'pin');
      clearTimeout(liveTimer);
      liveTimer = setTimeout(function () {
        var a = pinned;
        if (!a || !alive) return;
        srLive.textContent = a.kind === 'f'
          ? 'Feature-map row ' + (a.i + 1) + ', column ' + (a.j + 1) + ': sum ' + fmt(R.out[a.i * R.n + a.j])
          : 'Pooled row ' + (a.i + 1) + ', column ' + (a.j + 1) + ': ' + fmt(PR.P[a.i * PR.m + a.j]);
      }, 250);
    }
    [canvas, outLayer].forEach(function (t) {
      t.addEventListener('pointerdown', onDown);
      t.addEventListener('pointermove', onMove);
      t.addEventListener('pointerup', onUp);
      t.addEventListener('pointercancel', onUp);
      t.addEventListener('pointerleave', onLeave);
    });
    canvas.addEventListener('keydown', onKey);
    function onFocus() {
      var fv = true;
      try { fv = canvas.matches(':focus-visible'); } catch (err) { /* old browser */ }
      if (fv) { wrap.style.outline = '3px solid var(--haldi)'; wrap.style.outlineOffset = '2px'; }
    }
    function onBlur() { wrap.style.outline = ''; wrap.style.outlineOffset = ''; }
    canvas.addEventListener('focus', onFocus);
    canvas.addEventListener('blur', onBlur);

    /* ---------- theme + resize ---------- */
    function onTheme() { calcKey = ''; requestDraw(); setTimeout(function () { if (alive) updateCalc(); }, 0); }
    var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mq) { if (mq.addEventListener) mq.addEventListener('change', onTheme); else if (mq.addListener) mq.addListener(onTheme); }
    document.addEventListener('themechange', onTheme);
    var mo = null;
    if (window.MutationObserver) {
      mo = new MutationObserver(onTheme);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    }
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { resize(); }); ro.observe(wrap); }
    else window.addEventListener('resize', resize);

    /* ---------- start: a meaningful example, ready to explore ---------- */
    recompute();
    pinned = strongest();
    T = readTheme();
    syncUI();
    resize();

    return {
      destroy: function () {
        alive = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0; anim = null;
        clearTimeout(liveTimer);
        [canvas, outLayer].forEach(function (t) {
          t.removeEventListener('pointerdown', onDown);
          t.removeEventListener('pointermove', onMove);
          t.removeEventListener('pointerup', onUp);
          t.removeEventListener('pointercancel', onUp);
          t.removeEventListener('pointerleave', onLeave);
        });
        canvas.removeEventListener('keydown', onKey);
        canvas.removeEventListener('focus', onFocus);
        canvas.removeEventListener('blur', onBlur);
        if (mq) { if (mq.removeEventListener) mq.removeEventListener('change', onTheme); else if (mq.removeListener) mq.removeListener(onTheme); }
        document.removeEventListener('themechange', onTheme);
        if (mo) mo.disconnect();
        if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
        root.innerHTML = '';
      }
    };
  }

  Labs['convolution'] = {
    id: 'convolution',
    module: 'l3-cv',
    title: 'Convolution filters & pooling',
    summary: 'Draw a digit or a Devanagari letter, slide a 3×3 filter over it, and see how edge, blur and sharpen kernels, stride, padding, ReLU and max-pooling change what a CNN sees.',
    tasks: TASKS.map(function (t) { return { id: t.id, text: t.text }; }),
    mount: mount
  };
})();
