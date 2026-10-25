/* AI Marg lab: "matrix" — a 2x2 matrix as a machine that moves the whole plane.
   Plain classic script (ES2019), no dependencies. Registers window.AILabs.matrix. */
(function () {
  'use strict';
  var Labs = (window.AILabs = window.AILabs || {});
  var uid = 0;

  var HALF_H = 4.2; // half the canvas height, in grid units
  var LIM = 3; // slider / drag limit for each matrix entry
  var R = Math.SQRT1_2; // cos 45° = sin 45°
  var START = { a: 2, b: 1, c: 0.5, d: 1.5 }; // eigenvalues 2.5 and 1, det 2.5
  var START_X = { x: -1.5, y: 1 };
  var IDENTITY = { a: 1, b: 0, c: 0, d: 1 };

  var PRESETS = [
    { id: 'identity', label: 'Identity', m: { a: 1, b: 0, c: 0, d: 1 } },
    { id: 'scale', label: 'Scale ×2', m: { a: 2, b: 0, c: 0, d: 2 } },
    { id: 'rotate', label: 'Rotate 45°', m: { a: R, b: -R, c: R, d: R } },
    { id: 'shear', label: 'Shear', m: { a: 1, b: 1, c: 0, d: 1 } },
    { id: 'reflect', label: 'Reflect', m: { a: -1, b: 0, c: 0, d: 1 } },
    { id: 'squash', label: 'Squash', m: { a: 1, b: 2, c: 0.5, d: 1 } }
  ];

  var TASKS = [
    { id: 't1', text: 'Squash the plane flat: make the determinant exactly 0 yourself, so the whole grid collapses onto one line.' },
    { id: 't2', text: 'Flip space like a mirror: get a negative determinant (try dragging ĵ to the other side of î).' },
    { id: 't3', text: 'Build a matrix whose eigenvalues are exactly 2 and 0.5.' },
    { id: 't4', text: 'Rotate the plane by exactly 90° (a quarter turn) with no stretching.' }
  ];

  /* ---------- small maths helpers ---------- */
  function copy(m) { return { a: m.a, b: m.b, c: m.c, d: m.d }; }
  function same(m, n) {
    return Math.abs(m.a - n.a) < 1e-6 && Math.abs(m.b - n.b) < 1e-6 &&
      Math.abs(m.c - n.c) < 1e-6 && Math.abs(m.d - n.d) < 1e-6;
  }
  function det(m) { return m.a * m.d - m.b * m.c; }
  function isZero(m) { return Math.abs(m.a) < 1e-9 && Math.abs(m.b) < 1e-9 && Math.abs(m.c) < 1e-9 && Math.abs(m.d) < 1e-9; }
  function lerp(p, q, t) {
    return { a: p.a + (q.a - p.a) * t, b: p.b + (q.b - p.b) * t, c: p.c + (q.c - p.c) * t, d: p.d + (q.d - p.d) * t };
  }
  function snap(v) { return Math.round(v * 10) / 10; }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function num(v, digits) {
    var s = (Math.abs(v) < 1e-9 ? 0 : v).toFixed(digits);
    if (Number(s) === 0) s = s.replace('-', '');
    return s.replace('-', '−');
  }
  function f2(v) { return num(v, 2); }
  // one decimal when the value sits on the 0.1 grid, else two
  function fN(v) { return Math.abs(v * 10 - Math.round(v * 10)) < 1e-6 ? num(v, 1) : num(v, 2); }
  // wrap negative numbers in brackets inside a formula
  function fP(v) { var s = fN(v); return s.charAt(0) === '\u2212' ? '(' + s + ')' : s; }
  // determinant: two decimals; four when it is tiny but not zero, so it never reads 0.00 by mistake
  function fD(v) { var a = Math.abs(v); return a < 1e-6 ? '0.00' : a < 0.005 ? num(v, 4) : num(v, 2); }

  // unit eigenvector for eigenvalue l, or null when every direction works (m = l·I)
  function evec(m, l) {
    var x1 = m.b, y1 = l - m.a, x2 = l - m.d, y2 = m.c;
    var n1 = Math.sqrt(x1 * x1 + y1 * y1), n2 = Math.sqrt(x2 * x2 + y2 * y2);
    if (Math.max(n1, n2) < 1e-9) return null;
    return n1 >= n2 ? { x: x1 / n1, y: y1 / n1 } : { x: x2 / n2, y: y2 / n2 };
  }
  // eigenvalues of [[a,b],[c,d]] solve l² − (a+d)l + det = 0
  function eigen(m) {
    var T = m.a + m.d, D = det(m), disc = T * T - 4 * D;
    if (Math.abs(disc) < 1e-9) disc = 0;
    if (disc < 0) return { kind: 'complex', vecs: [] };
    var r = Math.sqrt(disc), l1 = (T + r) / 2, l2 = (T - r) / 2;
    if (disc === 0) {
      var v = evec(m, l1);
      if (!v) return { kind: 'all', l1: l1, l2: l1, vecs: [] };
      return { kind: 'repeated', l1: l1, l2: l1, vecs: [{ l: l1, v: v }] };
    }
    var vecs = [];
    var v1 = evec(m, l1), v2 = evec(m, l2);
    if (v1) vecs.push({ l: l1, v: v1 });
    if (v2) vecs.push({ l: l2, v: v2 });
    return { kind: 'distinct', l1: l1, l2: l2, vecs: vecs };
  }

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

  function mount(root, ctx) {
    var pre = 'mx' + (++uid) + '-';
    var m = copy(START); // the chosen matrix (what the sliders show)
    var view = copy(START); // the matrix being drawn (differs only while animating)
    var tv = { x: START_X.x, y: START_X.y }; // test vector (input)
    var source = 'start'; // 'start' | 'user' | 'preset'
    var lastPreset = null;
    var drag = null, hover = null, anim = null, raf = 0;
    var dpr = 1, cw = 0, ch = 0, alive = true;
    var doneSet = {};
    TASKS.forEach(function (t) { doneSet[t.id] = !!(ctx && ctx.isTaskDone && ctx.isTaskDone(t.id)); });

    /* ---------- DOM ---------- */
    root.innerHTML = '';
    var lab = el('div', { class: 'lab' });

    lab.appendChild(el('p', { class: 'lab-note', html:
      '<b>What you are seeing:</b> a 2×2 <b>matrix</b> (a box of 4 numbers) moves every point of the plane. ' +
      'Faint grey squares are the original grid; blue lines show where it lands. ' +
      'The green arrow <b>î</b> ("i-hat", one step right) lands on column 1 <span class="mono">(a, c)</span>; the red arrow ' +
      '<b>ĵ</b> ("j-hat", one step up) lands on column 2 <span class="mono">(b, d)</span>. ' +
      'The dashed square of area 1 lands on the yellow parallelogram, whose area (with a minus sign if space flips) is the <b>determinant</b>: how much the matrix scales areas. ' +
      'Dashed teal lines are <b>eigenvectors</b> (directions that stay on their own line: only stretched, squashed or flipped, never turned); the stretch on each is its <b>eigenvalue</b> λ ("lambda"). ' +
      'Drag the arrow tips, use the sliders, or tap to move the test <b>vector</b> <b>x</b> (an arrow from (0, 0)).' }));

    var body = el('div', { class: 'lab-body' });

    // left column
    var left = el('div', { class: 'stack-sm', style: 'min-width:0' });
    var wrap = el('div', { class: 'lab-canvas-wrap' });
    var canvas = el('canvas', { role: 'img', tabindex: '0', 'aria-label': 'Transformed grid', style: 'cursor:crosshair;touch-action:none' });
    wrap.appendChild(canvas);
    left.appendChild(wrap);

    left.appendChild(el('div', { class: 'lab-legend', 'aria-hidden': 'true' }, [
      el('span', { style: '--c: var(--ok)', text: 'î = column 1' }),
      el('span', { style: '--c: var(--sindoor)', text: 'ĵ = column 2' }),
      el('span', { style: '--c: var(--haldi)', text: 'unit square → area = det' }),
      el('span', { style: '--c: var(--series-4)', text: 'eigenvector lines' }),
      el('span', { style: '--c: var(--ink)', text: 'test vector x → Mx' })
    ]));

    var statDetV = el('div', { class: 'v', text: '' });
    var statEigV = el('div', { class: 'v', text: '' });
    var statAreaV = el('div', { class: 'v', text: '' });
    var statSpace = el('div', { class: 'stat' }, [el('div', { class: 'k', text: 'Space is' }), statAreaV]);
    var stats = el('div', { class: 'lab-stats' }, [
      el('div', { class: 'stat' }, [el('div', { class: 'k', text: 'Determinant' }), statDetV]),
      el('div', { class: 'stat' }, [el('div', { class: 'k', html: 'Eigenvalues <span style="text-transform:none">(λ)</span>' }), statEigV]),
      statSpace
    ]);
    left.appendChild(stats);
    var insight = el('p', { class: 'lab-note', 'aria-live': 'polite', style: 'color:var(--ink)' });
    var tvLine = el('p', { class: 'lab-note small' });
    left.appendChild(insight);
    left.appendChild(tvLine);
    left.appendChild(el('p', { class: 'kbd-hint', text: 'Keyboard: sliders take arrow keys; focus the picture and use arrow keys to move the test vector x (hold Shift for small steps).' }));
    body.appendChild(left);

    // right column: controls
    var controls = el('div', { class: 'lab-controls' });

    var cells = {};
    function cell(key, color) {
      cells[key] = el('span', { style: 'color:' + color + ';min-width:4.2ch;text-align:right', text: '' });
      return cells[key];
    }
    var bracketL = el('span', { 'aria-hidden': 'true', style: 'width:7px;border:2px solid var(--ink);border-right:0;border-radius:3px 0 0 3px' });
    var bracketR = el('span', { 'aria-hidden': 'true', style: 'width:7px;border:2px solid var(--ink);border-left:0;border-radius:0 3px 3px 0' });
    var mxGrid = el('div', { style: 'display:grid;grid-template-columns:auto auto;column-gap:14px;padding:2px 7px;font-variant-numeric:tabular-nums' }, [
      cell('a', 'var(--ok)'), cell('b', 'var(--bad)'), cell('c', 'var(--ok)'), cell('d', 'var(--bad)')
    ]);
    var mxView = el('div', { role: 'group', 'aria-label': 'Matrix M', style: 'display:flex;align-items:stretch;font-family:var(--font-mono);font-size:1.15rem;line-height:1.55' }, [bracketL, mxGrid, bracketR]);
    var detFormula = el('div', { class: 'mono small', style: 'color:var(--muted);line-height:1.5' });
    controls.appendChild(el('div', { style: 'background:var(--surface-2);border-radius:var(--radius-sm);padding:12px;display:flex;flex-direction:column;gap:8px' }, [
      el('div', { style: 'display:flex;align-items:center;gap:12px;flex-wrap:wrap' }, [
        el('span', { class: 'mono', style: 'font-size:1.1rem', text: 'M =' }),
        mxView,
        el('div', { class: 'small', style: 'line-height:1.35;color:var(--muted)', html:
          '<span style="color:var(--ok);font-weight:700">column 1</span> = where î lands<br>' +
          '<span style="color:var(--bad);font-weight:700">column 2</span> = where ĵ lands' })
      ]),
      detFormula
    ]));

    // presets
    var presetLbl = el('span', { class: 'control-label', id: pre + 'presets', text: 'Presets' });
    var seg = el('div', { class: 'seg', role: 'group', 'aria-labelledby': pre + 'presets', style: 'display:grid;grid-template-columns:repeat(3,minmax(0,1fr))' });
    var presetBtns = PRESETS.map(function (p, i) {
      var st = 'padding:7px 4px;';
      if (i % 3 === 2) st += 'border-right:0;';
      if (i < 3) st += 'border-bottom:1px solid var(--line);';
      var b = el('button', { type: 'button', 'aria-pressed': 'false', 'data-preset': p.id, style: st, text: p.label });
      b.addEventListener('click', function () { applyPreset(p); });
      seg.appendChild(b);
      return b;
    });
    controls.appendChild(el('div', { class: 'control' }, [presetLbl, seg]));

    // sliders, grouped by column
    var sliders = {}, outs = {};
    function slider(key, text) {
      var id = pre + key;
      var input = el('input', { type: 'range', id: id, min: -LIM, max: LIM, step: '0.1', value: String(m[key]) });
      var out = el('output', { for: id, text: fN(m[key]) });
      sliders[key] = input; outs[key] = out;
      input.addEventListener('input', function () {
        var v = parseFloat(input.value);
        if (!isFinite(v)) return;
        m[key] = v; source = 'user'; lastPreset = null;
        stopAnim(); view = copy(m);
        syncUI(); requestDraw();
      });
      input.addEventListener('change', checkTasks);
      return el('div', { class: 'control' }, [el('label', { for: id }, [el('span', { html: text }), out]), input]);
    }
    // the four sliders share one box, so on phones it can sit right under the picture
    var sliderBox = el('div', { style: 'display:flex;flex-direction:column;gap:14px' }, [
      el('div', { class: 'small', style: 'font-weight:700;color:var(--ok);margin-bottom:-8px', text: 'Where î lands (column 1)' }),
      slider('a', '<span class="mono">a</span> — across (x)'),
      slider('c', '<span class="mono">c</span> — up (y)'),
      el('div', { class: 'small', style: 'font-weight:700;color:var(--bad);margin-bottom:-8px', text: 'Where ĵ lands (column 2)' }),
      slider('b', '<span class="mono">b</span> — across (x)'),
      slider('d', '<span class="mono">d</span> — up (y)')
    ]);
    controls.appendChild(sliderBox);

    var playBtn = el('button', { type: 'button', class: 'btn btn-primary btn-sm' }, [el('span', { 'aria-hidden': 'true', text: '▶' }), 'Play from identity']);
    var resetBtn = el('button', { type: 'button', class: 'btn btn-sm', text: 'Reset' });
    var btnRow = el('div', { class: 'row' }, [playBtn, resetBtn]);
    controls.appendChild(btnRow);

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
      el('div', { class: 'row-between', style: 'margin-bottom:6px' }, [el('h2', { class: 'lab-h', text: 'Tasks' }), taskCount]),
      taskList, taskMsg
    ]));

    body.appendChild(controls);
    lab.appendChild(body);
    lab.appendChild(el('p', { class: 'lab-note', html:
      '<b>Why it matters in real ML:</b> every layer of a neural network starts with a matrix multiply exactly like this — it stretches, turns and squashes the space your data lives in; ' +
      'PCA (finding the main directions in data) is built on eigenvectors, and a determinant of 0 means some information is lost for good.' }));
    root.appendChild(lab);

    var g = canvas.getContext('2d');

    /* ---------- UI sync ---------- */
    function reducedMotion() {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
    function updateTaskCount() {
      var n = 0;
      TASKS.forEach(function (t) { if (doneSet[t.id]) n++; });
      taskCount.textContent = n + ' / ' + TASKS.length + ' done';
    }

    function insightText() {
      var D = det(m), parts = [];
      if (isZero(m)) {
        return 'Every point lands on (0, 0): the whole plane is crushed to a single point.';
      }
      if (Math.abs(D) < 1e-6) {
        parts.push('det = 0: the whole plane is squashed onto one line. Many points land on the same spot, so this cannot be undone (the matrix has no inverse).');
      } else {
        var ad = Math.abs(D), s;
        if (Math.abs(ad - 1) < 1e-6) s = 'areas keep exactly the same size';
        else if (fD(ad) === '1.00') s = 'areas stay almost the same size';
        else if (ad > 1) s = 'every area becomes ' + fD(ad) + '× bigger';
        else s = 'every area shrinks to ' + fD(ad) + '× its size';
        parts.push('det = ' + fD(D) + ': ' + s + (D < 0 ? ', and space is flipped over like a mirror image (î and ĵ swapped sides).' : '.'));
      }
      var E = eigen(m);
      if (E.kind === 'complex') {
        parts.push('No real eigenvectors (this matrix rotates every direction).');
      } else if (E.kind === 'all') {
        parts.push(Math.abs(E.l1 - 1) < 1e-6
          ? 'This is the identity: nothing moves, so every direction is an eigenvector with λ = 1.00.'
          : E.l1 < 0
            ? 'Every direction is an eigenvector with λ = ' + f2(E.l1) + ': every arrow is scaled by ' + f2(-E.l1) + ' and flipped to point the opposite way (a half turn).'
            : 'Every direction is an eigenvector: every arrow is only scaled by λ = ' + f2(E.l1) + ', never turned.');
      } else if (E.kind === 'repeated') {
        var fate = Math.abs(E.l1) < 1e-6 ? 'arrows on it are crushed to (0, 0)'
          : E.l1 < 0 ? 'arrows on it are scaled by ' + f2(-E.l1) + ' and flipped to point backwards'
          : Math.abs(E.l1 - 1) < 1e-6 ? 'arrows on it do not change at all'
          : 'arrows on it keep their direction and are scaled by ' + f2(E.l1);
        parts.push('Only one eigenvector line (dashed), with λ = ' + f2(E.l1) + ' counted twice: ' + fate + ', while every other arrow gets turned.');
      } else {
        var extra = '';
        if (Math.abs(E.l1) < 1e-6 || Math.abs(E.l2) < 1e-6) extra += ' Scaling by 0 crushes that whole dashed line to (0, 0).';
        if (E.l1 < -1e-6 || E.l2 < -1e-6) extra += ' A negative λ flips arrows on that line to point backwards.';
        parts.push('Arrows on the dashed lines stay on their own line; they only get scaled, by λ = ' + f2(E.l1) + ' on one and λ = ' + f2(E.l2) + ' on the other.' + extra);
      }
      if (source === 'preset' && lastPreset) {
        var tip = '';
        if (lastPreset === 'squash' && !doneSet.t1) tip = 'Presets do not tick tasks: now squash the plane yourself with the sliders or by dragging.';
        else if (lastPreset === 'reflect' && !doneSet.t2) tip = 'Presets do not tick tasks: now flip space yourself by dragging ĵ or î.';
        else if (lastPreset === 'rotate' && !doneSet.t4) tip = 'Can you change the sliders to turn 90° instead of 45°?';
        if (tip) parts.push(tip);
      }
      return parts.join(' ');
    }

    function syncUI() {
      ['a', 'b', 'c', 'd'].forEach(function (k) {
        if (Math.abs(parseFloat(sliders[k].value) - m[k]) > 1e-9) sliders[k].value = String(m[k]);
        outs[k].textContent = fN(m[k]);
        cells[k].textContent = fN(m[k]);
      });
      var D = det(m), neg = D < -1e-6, zero = Math.abs(D) < 1e-6;
      detFormula.innerHTML = 'det = ad − bc<br>= ' + fP(m.a) + '×' + fP(m.d) + ' − ' + fP(m.b) + '×' + fP(m.c) +
        ' <span style="white-space:nowrap">= <b style="color:' + (neg ? 'var(--bad)' : 'var(--ink)') + '">' + fD(D) + '</b></span>';
      statDetV.textContent = fD(D);
      statDetV.style.color = neg ? 'var(--bad)' : '';
      statAreaV.textContent = isZero(m) ? 'a point' : zero ? 'a line' : neg ? 'flipped' : 'not flipped';
      statAreaV.style.color = neg ? 'var(--bad)' : '';
      var E = eigen(m);
      statEigV.textContent = E.kind === 'complex' ? 'no real ones' :
        E.kind === 'all' ? f2(E.l1) + ' (all)' :
        E.kind === 'repeated' ? f2(E.l1) + ' (twice)' : f2(E.l1) + ', ' + f2(E.l2);
      var s = insightText();
      if (insight.textContent !== s) insight.textContent = s;
      var mx = m.a * tv.x + m.b * tv.y, my = m.c * tv.x + m.d * tv.y;
      tvLine.innerHTML = 'Test vector <b>x</b> = (' + fN(tv.x) + ', ' + fN(tv.y) + ') lands at <b>Mx</b> = ' +
        fN(tv.x) + '·<b style="color:var(--ok)">î</b> ' + (tv.y < -1e-9 ? '− ' + fN(-tv.y) : '+ ' + fN(tv.y)) +
        '·<b style="color:var(--bad)">ĵ</b> = (' + f2(mx) + ', ' + f2(my) + ')' +
        (Math.abs(mx) > L.ox / L.u + 1e-9 || Math.abs(my) > L.oy / L.u + 1e-9 ? ', off the edge of the picture.' : '');
      presetBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', same(m, PRESETS[i].m) ? 'true' : 'false'); });
      canvas.setAttribute('aria-label', 'Grid transformed by the matrix with rows (' + fN(m.a) + ', ' + fN(m.b) + ') and (' + fN(m.c) + ', ' + fN(m.d) +
        '). Determinant ' + fD(D) + '. Test vector (' + fN(tv.x) + ', ' + fN(tv.y) + ') lands at (' + f2(mx) + ', ' + f2(my) + ').');
      updateTaskCount();
    }

    /* ---------- tasks ---------- */
    function markDone(id) {
      if (doneSet[id]) return;
      doneSet[id] = true;
      var li = taskItems[id];
      li.classList.add('done');
      li._sr.textContent = ' (done)';
      var t = TASKS.filter(function (x) { return x.id === id; })[0];
      taskMsg.textContent = '✓ Task done: ' + (id === 't1' ? 'space collapsed onto a line!' : id === 't2' ? 'space flipped over!' : id === 't3' ? 'eigenvalues 2 and 0.5!' : 'a perfect quarter turn!');
      if (ctx && ctx.onTaskDone) ctx.onTaskDone(id);
      updateTaskCount();
      return t;
    }
    function checkTasks() {
      if (source !== 'user') return;
      var D = det(m), E = eigen(m);
      if (Math.abs(D) < 1e-6 && !isZero(m)) markDone('t1');
      if (D < -1e-6) markDone('t2');
      if (E.kind === 'distinct' && Math.abs(E.l1 - 2) < 0.01 && Math.abs(E.l2 - 0.5) < 0.01) markDone('t3');
      if (Math.abs(m.a) < 0.01 && Math.abs(m.d) < 0.01 && Math.abs(Math.abs(m.c) - 1) < 0.01 && Math.abs(m.b + m.c) < 0.01) markDone('t4');
      syncUI();
    }

    /* ---------- animation + drawing loop ---------- */
    function requestDraw() { if (!raf && alive) raf = requestAnimationFrame(frame); }
    function stopAnim() { anim = null; }
    function animateTo(from, to, dur) {
      if (reducedMotion()) { anim = null; view = copy(to); requestDraw(); return; }
      anim = { from: copy(from), to: copy(to), t0: null, dur: dur };
      view = copy(from);
      requestDraw();
    }
    function frame(now) {
      raf = 0;
      if (!alive) return;
      if (anim) {
        if (anim.t0 == null) anim.t0 = now;
        var t = Math.min(1, (now - anim.t0) / anim.dur);
        var e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        view = lerp(anim.from, anim.to, e);
        if (t >= 1) { view = copy(anim.to); anim = null; }
      }
      draw();
      if (anim) raf = requestAnimationFrame(frame);
    }

    function applyPreset(p) {
      var from = copy(view);
      m = copy(p.m); source = 'preset'; lastPreset = p.id;
      syncUI();
      animateTo(from, m, 650);
    }
    playBtn.addEventListener('click', function () { animateTo(IDENTITY, m, 1500); });
    resetBtn.addEventListener('click', function () {
      var from = copy(view);
      m = copy(START); tv = { x: START_X.x, y: START_X.y }; source = 'preset'; lastPreset = null;
      taskMsg.textContent = '';
      syncUI();
      animateTo(from, m, 650);
    });

    function layout() {
      var r = canvas.getBoundingClientRect();
      var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      return { W: w, H: h, u: h / (2 * HALF_H), ox: w / 2, oy: h / 2 };
    }
    var L = layout();

    function resize() {
      if (!alive) return;
      L = layout();
      // narrow screens: two stats per row, the third one spans the full row
      var narrow = left.getBoundingClientRect().width < 520;
      stats.style.gridTemplateColumns = narrow ? 'repeat(2, minmax(0, 1fr))' : '';
      statSpace.style.gridColumn = narrow ? '1 / -1' : '';
      dpr = Math.min(window.devicePixelRatio || 1, 3);
      cw = L.W; ch = L.H;
      var bw = Math.round(cw * dpr), bh = Math.round(ch * dpr);
      if (canvas.width !== bw) canvas.width = bw;
      if (canvas.height !== bh) canvas.height = bh;
      syncUI();
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      frame(performance.now());
    }

    function arrow(x0, y0, x1, y1, color, width, head) {
      var dx = x1 - x0, dy = y1 - y0, len = Math.sqrt(dx * dx + dy * dy);
      g.strokeStyle = color; g.fillStyle = color; g.lineWidth = width;
      if (len < 1.5) { g.beginPath(); g.arc(x1, y1, width + 1, 0, Math.PI * 2); g.fill(); return; }
      var ux = dx / len, uy = dy / len, hl = Math.min(head || 12, len * 0.6), hw = hl * 0.55;
      var bx = x1 - ux * hl, by = y1 - uy * hl;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(bx + ux * 1, by + uy * 1); g.stroke();
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(bx - uy * hw, by + ux * hw); g.lineTo(bx + uy * hw, by - ux * hw); g.closePath(); g.fill();
    }

    function draw() {
      if (!cw || !ch) return;
      var cs = getComputedStyle(document.documentElement);
      function C(n, fb) { var v = cs.getPropertyValue(n).trim(); return v || fb; }
      var bg = C('--surface', '#fff'), ink = C('--ink', '#111'), muted = C('--muted', '#666'), line = C('--line', '#ddd');
      var indigo = C('--indigo', '#2d388a'), haldi = C('--haldi', '#e2a400'), haldiInk = C('--haldi-ink', haldi), bad = C('--bad', '#b3261e');
      var ok = C('--ok', '#1d7a4b'), sind = C('--sindoor', '#c0402c'), teal = C('--series-4', '#12807f');
      var font = C('--font-body', 'system-ui, sans-serif');
      var W = L.W, H = L.H, u = L.u, ox = L.ox, oy = L.oy, M = view;
      function X(x) { return ox + x * u; }
      function Y(y) { return oy - y * u; }
      function T(x, y) { return [X(M.a * x + M.b * y), Y(M.c * x + M.d * y)]; }
      function label(text, x, y, color, f, align) {
        g.font = f; g.textAlign = align || 'center'; g.textBaseline = 'middle';
        g.lineJoin = 'round'; g.lineWidth = 4; g.strokeStyle = bg; g.strokeText(text, x, y);
        g.fillStyle = color; g.fillText(text, x, y);
      }

      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.setLineDash([]);
      g.globalAlpha = 1;
      g.fillStyle = bg; g.fillRect(0, 0, W, H);

      // 1. original grid (faint) + axes + tick numbers
      var nx = Math.ceil(W / 2 / u), ny = Math.ceil(H / 2 / u), i, k, p, q;
      g.lineWidth = 1; g.strokeStyle = line; g.beginPath();
      for (i = -nx; i <= nx; i++) { var px = Math.round(X(i)) + 0.5; g.moveTo(px, 0); g.lineTo(px, H); }
      for (i = -ny; i <= ny; i++) { var py = Math.round(Y(i)) + 0.5; g.moveTo(0, py); g.lineTo(W, py); }
      g.stroke();
      g.globalAlpha = 0.55; g.strokeStyle = muted; g.beginPath();
      g.moveTo(0, Math.round(oy) + 0.5); g.lineTo(W, Math.round(oy) + 0.5);
      g.moveTo(Math.round(ox) + 0.5, 0); g.lineTo(Math.round(ox) + 0.5, H); g.stroke();
      g.globalAlpha = 0.75; g.fillStyle = muted; g.font = (W < 500 ? 9 : 10.5) + 'px ' + font;
      g.textAlign = 'center'; g.textBaseline = 'top';
      for (i = -nx; i <= nx; i++) { if (i && X(i) > 8 && X(i) < W - 8) g.fillText(num(i, 0), X(i), oy + 3); }
      g.textAlign = 'right'; g.textBaseline = 'middle';
      for (i = -ny; i <= ny; i++) { if (i && Y(i) > 8 && Y(i) < H - 8) g.fillText(num(i, 0), ox - 4, Y(i)); }
      g.globalAlpha = 1;

      // 2. transformed grid: images of the lines x = k and y = k.
      //    A shrinking matrix needs more lines to fill the picture (the whole plane still lands on the whole plane),
      //    so N comes from the corners of the picture mapped back through the inverse matrix.
      var Dm = det(M), N = 80;
      if (Math.abs(Dm) > 1e-9) {
        var hx = W / 2 / u + 1, hy = H / 2 / u + 1, need = 0;
        [[hx, hy], [hx, -hy]].forEach(function (cn) {
          need = Math.max(need, Math.abs((M.d * cn[0] - M.b * cn[1]) / Dm), Math.abs((M.a * cn[1] - M.c * cn[0]) / Dm));
        });
        N = Math.min(80, Math.max(12, Math.ceil(need) + 1));
      }
      // pixel gap between neighbouring lines of each family; fade a family when its lines crowd together
      var lenI = Math.sqrt(M.a * M.a + M.c * M.c), lenJ = Math.sqrt(M.b * M.b + M.d * M.d);
      function famAlpha(len) { return 0.38 * clamp((len > 1e-9 ? Math.abs(Dm) / len * u : 0) / 10, 0.15, 1); }
      g.strokeStyle = indigo; g.lineWidth = 1;
      g.globalAlpha = famAlpha(lenJ); g.beginPath();
      for (k = -N; k <= N; k++) { if (!k) continue; p = T(k, -N); q = T(k, N); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); }
      g.stroke();
      g.globalAlpha = famAlpha(lenI); g.beginPath();
      for (k = -N; k <= N; k++) { if (!k) continue; p = T(-N, k); q = T(N, k); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); }
      g.stroke();
      g.globalAlpha = 0.9; g.lineWidth = 1.75; g.beginPath();
      p = T(-N, 0); q = T(N, 0); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]);
      p = T(0, -N); q = T(0, N); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]);
      g.stroke(); g.globalAlpha = 1;

      // 3. original unit square (dashed ghost) and its image, the parallelogram
      g.setLineDash([4, 4]); g.strokeStyle = muted; g.lineWidth = 1; g.globalAlpha = 0.8;
      g.strokeRect(X(0), Y(1), u, u);
      g.setLineDash([]); g.globalAlpha = 1;
      var D = det(M), flipped = D < -1e-6;
      var areaFill = flipped ? bad : haldi, areaStroke = flipped ? bad : haldiInk;
      var o = T(0, 0), pi = T(1, 0), pij = T(1, 1), pj = T(0, 1);
      g.beginPath(); g.moveTo(o[0], o[1]); g.lineTo(pi[0], pi[1]); g.lineTo(pij[0], pij[1]); g.lineTo(pj[0], pj[1]); g.closePath();
      g.globalAlpha = flipped ? 0.2 : 0.3; g.fillStyle = areaFill; g.fill();
      g.globalAlpha = 1; g.strokeStyle = areaStroke; g.lineWidth = 1.5; g.stroke();

      // 4. eigenvector lines (only when the picture is at rest)
      var eigLabels = [];
      if (!anim) {
        var E = eigen(M), diag = Math.sqrt(W * W + H * H);
        E.vecs.forEach(function (ev) {
          var sx = ev.v.x, sy = -ev.v.y; // screen direction
          g.setLineDash([7, 6]); g.strokeStyle = teal; g.lineWidth = 1.75; g.globalAlpha = 0.95;
          g.beginPath(); g.moveTo(ox - sx * diag, oy - sy * diag); g.lineTo(ox + sx * diag, oy + sy * diag); g.stroke();
          g.setLineDash([]); g.globalAlpha = 1;
          // label near the canvas edge, preferring the right-hand / upper end
          if (sx < -1e-6 || (Math.abs(sx) <= 1e-6 && sy > 0)) { sx = -sx; sy = -sy; }
          var spots = [[sx, sy], [-sx, -sy]].map(function (dd) {
            var tt = Math.min(Math.abs(dd[0]) > 1e-6 ? (W / 2 - 46) / Math.abs(dd[0]) : 1e9, Math.abs(dd[1]) > 1e-6 ? (H / 2 - 14) / Math.abs(dd[1]) : 1e9);
            return [ox + dd[0] * tt, oy + dd[1] * tt];
          });
          eigLabels.push({ text: 'λ = ' + f2(ev.l), spots: spots });
        });
      }

      // 5. test vector: x (hollow ring) → Mx (ink arrow), built as x·î + y·ĵ
      var mxw = M.a * tv.x + M.b * tv.y, myw = M.c * tv.x + M.d * tv.y;
      var xi = [X(M.a * tv.x), Y(M.c * tv.x)], out = [X(mxw), Y(myw)], inp = [X(tv.x), Y(tv.y)];
      g.lineWidth = 1.5; g.setLineDash([3, 4]); g.globalAlpha = 0.9;
      g.strokeStyle = ok; g.beginPath(); g.moveTo(ox, oy); g.lineTo(xi[0], xi[1]); g.stroke();
      g.strokeStyle = sind; g.beginPath(); g.moveTo(xi[0], xi[1]); g.lineTo(out[0], out[1]); g.stroke();
      g.setLineDash([1.5, 4]); g.strokeStyle = muted; g.lineWidth = 1.5; g.beginPath(); g.moveTo(inp[0], inp[1]); g.lineTo(out[0], out[1]); g.stroke();
      g.setLineDash([]); g.globalAlpha = 1;
      arrow(ox, oy, out[0], out[1], ink, 2.25, 10);
      g.beginPath(); g.arc(inp[0], inp[1], 5.5, 0, Math.PI * 2); g.fillStyle = bg; g.fill();
      g.lineWidth = 2; g.strokeStyle = (drag === 'x') ? ink : muted; g.stroke();

      // 6. basis vectors î and ĵ with grab halos
      var ti = T(1, 0), tj = T(0, 1);
      [['i', ti, ok], ['j', tj, sind]].forEach(function (b) {
        var active = hover === b[0] || drag === b[0];
        g.globalAlpha = active ? 0.3 : 0.14; g.fillStyle = b[2];
        g.beginPath(); g.arc(b[1][0], b[1][1], active ? 17 : 14, 0, Math.PI * 2); g.fill();
        g.globalAlpha = 1;
      });
      arrow(ox, oy, ti[0], ti[1], ok, 3.25, 13);
      arrow(ox, oy, tj[0], tj[1], sind, 3.25, 13);

      // 7. labels on top; each takes the first candidate spot that does not cover a label already placed
      var big = (W < 500 ? 14 : 16), small = (W < 500 ? 11 : 12.5);
      var placed = [];
      function put(text, cands, color, weight, size) {
        var f = weight + ' ' + size + 'px ' + font;
        g.font = f;
        var hw = g.measureText(text).width / 2 + 3, hh = size / 2 + 3, first = null, pick = null;
        for (var n = 0; n < cands.length && !pick; n++) {
          var cx = clamp(cands[n][0], hw + 2, W - hw - 2), cy = clamp(cands[n][1], hh + 2, H - hh - 2);
          var b = [cx - hw, cy - hh, cx + hw, cy + hh];
          var c = { x: cx, y: cy, b: b };
          if (!first) first = c;
          if (!placed.some(function (pb) { return b[0] < pb[2] && pb[0] < b[2] && b[1] < pb[3] && pb[1] < b[3]; })) pick = c;
        }
        pick = pick || first;
        placed.push(pick.b);
        label(text, pick.x, pick.y, color, f);
      }
      // spots around a point: straight on along a direction, then to either side, then further out
      function around(pt, ux, uy, r) {
        return [[pt[0] + ux * r, pt[1] + uy * r], [pt[0] - uy * r, pt[1] + ux * r], [pt[0] + uy * r, pt[1] - ux * r],
          [pt[0] + ux * r * 2, pt[1] + uy * r * 2], [pt[0] - ux * r, pt[1] - uy * r], [pt[0] - uy * r * 2, pt[1] + ux * r * 2]];
      }
      function dirFrom(pt) {
        var dx = pt[0] - ox, dy = pt[1] - oy, len = Math.sqrt(dx * dx + dy * dy);
        return len < 4 ? [R, -R] : [dx / len, dy / len];
      }
      var di = dirFrom(ti), dj = dirFrom(tj), dO = dirFrom(out);
      put('î', around(ti, di[0], di[1], 18), ok, '700', big);
      put('ĵ', around(tj, dj[0], dj[1], 18), sind, '700', big);
      // area label: inside a roomy parallelogram, else lifted off its long diagonal
      var ctr = T(0.5, 0.5), ddx = pij[0] - o[0], ddy = pij[1] - o[1], dl = Math.sqrt(ddx * ddx + ddy * ddy);
      var nx2 = dl > 1 ? -ddy / dl : R, ny2 = dl > 1 ? ddx / dl : -R;
      if (ny2 > 0) { nx2 = -nx2; ny2 = -ny2; }
      var areaC = [18, -18, 34, -34, 50, -50].map(function (r) { return [ctr[0] + nx2 * r, ctr[1] + ny2 * r]; });
      if (Math.abs(D) * u * u >= 1500 && dl > 1) {
        // roomy: the centre first, then slide along the long diagonal, which keeps the label inside the shape
        var ex = ddx / dl, ey = ddy / dl;
        areaC = [ctr, [ctr[0] - ex * 16, ctr[1] - ey * 16], [ctr[0] + ex * 16, ctr[1] + ey * 16], [ctr[0] - ex * 30, ctr[1] - ey * 30]].concat(areaC);
      }
      put('area = ' + fD(D) + (flipped ? ' (flipped)' : ''), areaC, flipped ? bad : ink, '600', small);
      put('Mx', around(out, dO[0], dO[1], 16), ink, '700', small);
      put('x', [[inp[0] + 11, inp[1] - 11], [inp[0] - 11, inp[1] - 11], [inp[0] + 11, inp[1] + 11], [inp[0] - 11, inp[1] + 11]], muted, '700', small);
      eigLabels.forEach(function (e2) { put(e2.text, e2.spots, teal, '700', small); });
    }

    /* ---------- pointer + keyboard ---------- */
    function local(e) {
      var r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function toWorld(p) { return { x: (p.x - L.ox) / L.u, y: (L.oy - p.y) / L.u }; }
    function hitTest(p, coarse) {
      var rad = coarse ? 26 : 16, best = null, bestD = rad;
      var tips = { i: [L.ox + view.a * L.u, L.oy - view.c * L.u], j: [L.ox + view.b * L.u, L.oy - view.d * L.u] };
      ['i', 'j'].forEach(function (k) {
        var dd = Math.sqrt(Math.pow(p.x - tips[k][0], 2) + Math.pow(p.y - tips[k][1], 2));
        if (dd <= bestD) { bestD = dd; best = k; }
      });
      return best;
    }
    function xLimits() { return { x: Math.floor((L.ox / L.u - 0.2) * 10 + 1e-6) / 10, y: Math.floor((L.oy / L.u - 0.2) * 10 + 1e-6) / 10 }; }
    function moveTo(p) {
      var w = toWorld(p);
      if (drag === 'x') {
        var lim = xLimits();
        tv = { x: clamp(snap(w.x), -lim.x, lim.x), y: clamp(snap(w.y), -lim.y, lim.y) };
      } else {
        var vx = clamp(snap(w.x + grab.x), -LIM, LIM), vy = clamp(snap(w.y + grab.y), -LIM, LIM);
        var old = drag === 'i' ? [m.a, m.c] : [m.b, m.d];
        if (Math.abs(vx - old[0]) < 1e-9 && Math.abs(vy - old[1]) < 1e-9) return; // tip did not move
        if (drag === 'i') { m.a = vx; m.c = vy; } else { m.b = vx; m.d = vy; }
        source = 'user'; lastPreset = null;
        view = copy(m);
      }
      syncUI(); requestDraw();
    }
    var grab = { x: 0, y: 0 }; // tip minus pointer, in grid units, while dragging a tip
    function onDown(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.isPrimary === false || drag) return; // one finger at a time
      var p = local(e);
      if (anim) { anim = null; view = copy(m); }
      drag = hitTest(p, e.pointerType !== 'mouse') || 'x';
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      canvas.style.cursor = drag === 'x' ? 'crosshair' : 'grabbing';
      if (drag === 'x') moveTo(p);
      else {
        var w = toWorld(p);
        grab = drag === 'i' ? { x: m.a - w.x, y: m.c - w.y } : { x: m.b - w.x, y: m.d - w.y };
        requestDraw();
      }
      e.preventDefault();
    }
    function onMove(e) {
      if (e.isPrimary === false) return;
      var p = local(e);
      if (drag) { moveTo(p); return; }
      if (e.pointerType === 'mouse') {
        var h = hitTest(p, false);
        if (h !== hover) { hover = h; canvas.style.cursor = h ? 'grab' : 'crosshair'; requestDraw(); }
      }
    }
    function onUp(e) {
      if (!drag || e.isPrimary === false) return;
      var was = drag;
      drag = null;
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      canvas.style.cursor = hover ? 'grab' : 'crosshair';
      if (was !== 'x') checkTasks();
      requestDraw();
    }
    function onLeave() { if (!drag && hover) { hover = null; requestDraw(); } }
    function onKey(e) {
      var step = e.shiftKey ? 0.1 : 0.5, dx = 0, dy = 0;
      if (e.key === 'ArrowLeft') dx = -step;
      else if (e.key === 'ArrowRight') dx = step;
      else if (e.key === 'ArrowUp') dy = step;
      else if (e.key === 'ArrowDown') dy = -step;
      else return;
      e.preventDefault();
      var lim = xLimits();
      tv = { x: clamp(snap(tv.x + dx), -lim.x, lim.x), y: clamp(snap(tv.y + dy), -lim.y, lim.y) };
      syncUI(); requestDraw();
    }
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('pointerleave', onLeave);
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
    function onTheme() { requestDraw(); }
    var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mq) { if (mq.addEventListener) mq.addEventListener('change', onTheme); else if (mq.addListener) mq.addListener(onTheme); }
    document.addEventListener('themechange', onTheme);
    var mo = null;
    if (window.MutationObserver) {
      mo = new MutationObserver(onTheme);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
    }
    // style.css stacks .lab-body into one column at 820px; then the sliders move right under the picture,
    // so on a phone you can watch the grid move while you slide (and they move back on wider screens)
    var mqNarrow = window.matchMedia ? window.matchMedia('(max-width: 820px)') : null;
    function placeSliders() {
      if (!alive) return;
      var narrow = !!(mqNarrow && mqNarrow.matches), fe = document.activeElement, had = !!(fe && sliderBox.contains(fe));
      if (narrow && sliderBox.parentNode !== left) { left.insertBefore(sliderBox, stats); sliderBox.style.margin = '6px 0 4px'; }
      else if (!narrow && sliderBox.parentNode !== controls) { controls.insertBefore(sliderBox, btnRow); sliderBox.style.margin = ''; }
      else return;
      if (had) { try { fe.focus({ preventScroll: true }); } catch (err) { /* ignore */ } }
    }
    if (mqNarrow) { if (mqNarrow.addEventListener) mqNarrow.addEventListener('change', placeSliders); else if (mqNarrow.addListener) mqNarrow.addListener(placeSliders); }
    placeSliders();

    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { resize(); }); ro.observe(wrap); }
    else window.addEventListener('resize', resize);

    syncUI();
    resize();

    return {
      destroy: function () {
        alive = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0; anim = null;
        canvas.removeEventListener('pointerdown', onDown);
        canvas.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerup', onUp);
        canvas.removeEventListener('pointercancel', onUp);
        canvas.removeEventListener('pointerleave', onLeave);
        canvas.removeEventListener('keydown', onKey);
        canvas.removeEventListener('focus', onFocus);
        canvas.removeEventListener('blur', onBlur);
        if (mq) { if (mq.removeEventListener) mq.removeEventListener('change', onTheme); else if (mq.removeListener) mq.removeListener(onTheme); }
        if (mqNarrow) { if (mqNarrow.removeEventListener) mqNarrow.removeEventListener('change', placeSliders); else if (mqNarrow.removeListener) mqNarrow.removeListener(placeSliders); }
        document.removeEventListener('themechange', onTheme);
        if (mo) mo.disconnect();
        if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
        root.innerHTML = '';
      }
    };
  }

  Labs['matrix'] = {
    id: 'matrix',
    module: 'l1-linalg-calc',
    title: 'Matrix transformations',
    summary: 'See how a 2×2 matrix stretches, turns, flips or flattens the whole plane, and what the determinant and eigenvectors tell you about it.',
    tasks: TASKS.map(function (t) { return { id: t.id, text: t.text }; }),
    mount: mount
  };
})();
