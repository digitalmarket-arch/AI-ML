/* AI Marg lab: pandas groupby as split-apply-combine, on 24 rows of tea-shop sales.
   The learner builds a filter, picks one or two group-by columns, a column and a function to summarise it,
   a sort order and how missing values are handled. The picture animates split (rows move into group boxes),
   apply (each box shrinks to one number) and combine (the numbers become one result), beside the exact
   pandas code and exactly what print() would show for it.
   Plain classic script (ES2019). Registers window.AILabs.groupby. No libraries, no network, no storage.
   The data is a fixed table, so nothing here is random. */
(function () {
  'use strict';
  var Labs = (window.AILabs = window.AILabs || {});
  var mountCount = 0;

  /* ================================================================
     The DataFrame df: 24 rows. Tea sells at ₹15 a cup, coffee at ₹40 and a snack at ₹30, so
     sales_rs = units × price. Two sales figures were never recorded: pandas stores them as NaN (null here).
     ================================================================ */
  var DATA = [
    ['Mumbai', 'Jan', 'Tea', 820, 12300],
    ['Mumbai', 'Jan', 'Coffee', 410, 16400],
    ['Delhi', 'Jan', 'Coffee', 380, 15200],
    ['Delhi', 'Jan', 'Snacks', 560, 16800],
    ['Pune', 'Jan', 'Tea', 640, 9600],
    ['Pune', 'Jan', 'Snacks', 450, 13500],
    ['Chennai', 'Jan', 'Tea', 530, 7950],
    ['Chennai', 'Jan', 'Coffee', 960, 38400],
    ['Mumbai', 'Feb', 'Coffee', 450, 18000],
    ['Mumbai', 'Feb', 'Snacks', 1180, 35400],
    ['Delhi', 'Feb', 'Tea', 1420, 21300],
    ['Delhi', 'Feb', 'Snacks', 610, 18300],
    ['Pune', 'Feb', 'Tea', 700, 10500],
    ['Pune', 'Feb', 'Coffee', 520, null],
    ['Chennai', 'Feb', 'Tea', 480, 7200],
    ['Chennai', 'Feb', 'Coffee', 1040, 41600],
    ['Mumbai', 'Mar', 'Tea', 760, null],
    ['Mumbai', 'Mar', 'Snacks', 1250, 37500],
    ['Delhi', 'Mar', 'Tea', 1360, 20400],
    ['Delhi', 'Mar', 'Coffee', 420, 16800],
    ['Pune', 'Mar', 'Coffee', 590, 23600],
    ['Pune', 'Mar', 'Snacks', 480, 14400],
    ['Chennai', 'Mar', 'Coffee', 1100, 44000],
    ['Chennai', 'Mar', 'Snacks', 390, 11700]
  ];
  var ROWS = DATA.map(function (r, i) { return { i: i, city: r[0], month: r[1], product: r[2], units: r[3], sales_rs: r[4] }; });
  var N = ROWS.length;
  var KEY_COLS = ['city', 'month', 'product'];
  var NUM_COLS = ['units', 'sales_rs'];
  // A-to-Z order: the order pandas puts groups in (it sorts group names, so 'Feb' comes before 'Jan').
  // The same order picks each group's colour, so a city keeps its colour whatever the filter.
  var AZ = { city: ['Chennai', 'Delhi', 'Mumbai', 'Pune'], month: ['Feb', 'Jan', 'Mar'], product: ['Coffee', 'Snacks', 'Tea'] };
  // friendlier order for the filter's value list
  var PICK = { city: ['Mumbai', 'Delhi', 'Pune', 'Chennai'], month: ['Jan', 'Feb', 'Mar'], product: ['Tea', 'Coffee', 'Snacks'] };
  var NUM_DEFAULT = { units: 800, sales_rs: 20000 };
  var FNS = ['sum', 'mean', 'count', 'max', 'min'];
  var FN_WORD = { sum: 'sum (total)', mean: 'mean (average)', count: 'count', max: 'max (largest)', min: 'min (smallest)' };
  var FN_DESC = {
    sum: 'sum adds up the values in each group. NaN is skipped.',
    mean: 'mean is the average: the sum divided by how many values there are. NaN is not counted.',
    count: 'count counts the values that are not NaN. (To count every row, pandas has size().)',
    max: 'max picks the largest value in each group.',
    min: 'min picks the smallest value in each group.'
  };
  var OPS = ['==', '!=', '>', '>=', '<', '<='];
  var OP_WORD = { '==': 'is', '!=': 'is not', '>': 'is more than', '>=': 'is at least', '<': 'is less than', '<=': 'is at most' };
  var STAGES = ['Filter', 'Split', 'Apply', 'Combine'];
  var DEFAULTS = { fcol: 'month', fop: '==', fval: 'Feb', fnum: NaN, by: 1, k1: 'city', k2: 'product', agg: 'sales_rs', fn: 'mean', sort: 'desc', missing: 'skip' };
  var START_STAGE = 1;

  var TASKS = [
    { id: 't1', text: 'Find the city with the highest total sales over all three months: no filter, group by city, take the sum of sales_rs, then tap that city in the result.' },
    { id: 't2', text: 'Find the average units sold per product in February only: keep rows where month == \'Feb\', group by product and take the mean of units.' },
    { id: 't3', text: 'Group by two columns, city and product, and take the sum of sales_rs with no filter. Then read one cell: tap the Pune · Coffee group to see how much coffee Pune sold.' },
    { id: 't4', text: 'Show the mean of sales_rs, then switch “Missing values” between Skip NaN and Fill with 0. Watch a group that has a NaN change its mean: filling adds a pretend ₹0 sale and one more value to divide by.' }
  ];

  /* ================================================================
     The maths: exactly what pandas does (checked against pandas 3 by running the generated code)
     ================================================================ */
  function isKeyCol(c) { return KEY_COLS.indexOf(c) >= 0; }
  // A cell as pandas sees it: a missing sale is NaN, or 0 once fillna(0) has run.
  function cellVal(row, col, missing) {
    var v = row[col];
    if (v === null) return missing === 'fill' ? 0 : NaN;
    return v;
  }
  function filterOn(cfg) {
    if (!cfg.fcol) return false;
    return isKeyCol(cfg.fcol) ? true : isFinite(cfg.fnum);
  }
  // JavaScript compares NaN the same way NumPy does: every test is False except !=, which is True.
  function passes(row, cfg) {
    if (!filterOn(cfg)) return true;
    var str = isKeyCol(cfg.fcol);
    var v = str ? row[cfg.fcol] : cellVal(row, cfg.fcol, cfg.missing);
    var t = str ? cfg.fval : cfg.fnum;
    switch (cfg.fop) {
      case '==': return v === t;
      case '!=': return v !== t;
      case '>': return v > t;
      case '>=': return v >= t;
      case '<': return v < t;
      case '<=': return v <= t;
    }
    return true;
  }
  function keysOf(cfg) { return cfg.by === 0 ? [] : cfg.by === 1 ? [cfg.k1] : [cfg.k1, cfg.k2]; }
  // pandas skips NaN in all five: an empty sum is 0, an empty mean, max or min is NaN, an empty count is 0.
  function aggregate(vals, fn) {
    var ok = vals.filter(function (v) { return !isNaN(v); });
    if (fn === 'count') return ok.length;
    if (fn === 'sum') return ok.reduce(function (a, b) { return a + b; }, 0);
    if (!ok.length) return NaN;
    if (fn === 'mean') return ok.reduce(function (a, b) { return a + b; }, 0) / ok.length;
    if (fn === 'max') return Math.max.apply(null, ok);
    return Math.min.apply(null, ok);
  }
  function groupId(keys, vals) {
    if (!keys.length) return 'all';
    return keys.map(function (k, j) { return k + '=' + vals[j]; }).join('|');
  }
  function compute(cfg) {
    var keys = keysOf(cfg);
    var mask = [], kept = [], rowGroup = [];
    ROWS.forEach(function (r) { var ok = passes(r, cfg); mask.push(ok); if (ok) kept.push(r.i); rowGroup.push(-1); });
    var groups = [], byId = {};
    kept.forEach(function (i) {
      var r = ROWS[i], kv = keys.map(function (k) { return r[k]; }), id = groupId(keys, kv);
      if (!byId[id]) { byId[id] = { id: id, keys: kv, rows: [] }; groups.push(byId[id]); }
      byId[id].rows.push(i);
    });
    if (!keys.length && !groups.length) { byId.all = { id: 'all', keys: [], rows: [] }; groups.push(byId.all); }
    // groupby(sort=True), the default: groups in A-to-Z order of their names
    groups.sort(function (a, b) {
      for (var j = 0; j < keys.length; j++) { if (a.keys[j] < b.keys[j]) return -1; if (a.keys[j] > b.keys[j]) return 1; }
      return 0;
    });
    groups.forEach(function (g, gi) {
      g.vals = g.rows.map(function (i) { return cellVal(ROWS[i], cfg.agg, cfg.missing); });
      g.nan = g.rows.filter(function (i) { return ROWS[i][cfg.agg] === null; }).length;
      g.value = aggregate(g.vals, cfg.fn);
      g.label = keys.length === 0 ? 'All ' + g.rows.length + ' rows' : g.keys.join(' · ');
      g.colour = keys.length ? '--series-' + (AZ[keys[0]].indexOf(g.keys[0]) + 1) : '--series-1';
      g.rows.forEach(function (i) { rowGroup[i] = gi; });
    });
    // dtype of the answer: units is int64, sales_rs is float64 (it holds NaN); mean is always float64, count always int64
    var isInt = cfg.fn === 'count' || (cfg.agg === 'units' && cfg.fn !== 'mean');
    var order = groups.map(function (g, j) { return j; });
    var ties = false;
    if (keys.length && cfg.sort !== 'none') {
      // Series.sort_values: NaN always goes last; equal values keep group order only with a stable sort
      var dir = cfg.sort === 'asc' ? 1 : -1;
      var real = order.filter(function (j) { return !isNaN(groups[j].value); });
      var nans = order.filter(function (j) { return isNaN(groups[j].value); });
      real.sort(function (a, b) { return (groups[a].value - groups[b].value) * dir || a - b; });
      var seen = {};
      real.forEach(function (j) { var k = String(groups[j].value); if (seen[k]) ties = true; seen[k] = true; });
      order = real.concat(nans);
    }
    return { keys: keys, mask: mask, kept: kept, rowGroup: rowGroup, groups: groups, byId: byId, order: order, isInt: isInt, ties: ties, scalar: !keys.length };
  }

  /* ---------- the pandas code ---------- */
  function q(s) { return "'" + s + "'"; }
  function filterLit(cfg) { return isKeyCol(cfg.fcol) ? q(cfg.fval) : String(cfg.fnum); }
  function locArg(g) { return g.keys.length === 1 ? q(g.keys[0]) : '(' + g.keys.map(q).join(', ') + ')'; }
  function pyLines(cfg, res, sel) {
    var lines = [], base = 'df';
    if (cfg.missing === 'fill') { lines.push("clean = df.fillna({'sales_rs': 0})"); base = 'clean'; }
    var e = base;
    if (filterOn(cfg)) e = base + '[' + base + '[' + q(cfg.fcol) + '] ' + cfg.fop + ' ' + filterLit(cfg) + ']';
    if (res.keys.length === 1) e += '.groupby(' + q(res.keys[0]) + ')';
    else if (res.keys.length === 2) e += '.groupby([' + res.keys.map(q).join(', ') + '])';
    e += '[' + q(cfg.agg) + '].' + cfg.fn + '()';
    if (res.keys.length && cfg.sort !== 'none') {
      var args = [];
      if (cfg.sort === 'desc') args.push('ascending=False');
      // pandas' default sort may shuffle equal values, so ask for a stable sort when there are ties
      if (res.ties) args.push("kind='stable'");
      e += '.sort_values(' + args.join(', ') + ')';
    }
    lines.push('result = ' + e);
    lines.push('print(result)');
    if (sel) lines.push('print(result.loc[' + locArg(sel) + '])');
    return lines;
  }

  /* ---------- what print() shows (pandas' own Series formatting) ---------- */
  function pyFloat(v) {
    if (isNaN(v)) return 'nan';
    var s = String(v);
    if (s.indexOf('.') < 0 && s.indexOf('e') < 0) s += '.0';
    return s;
  }
  function pyScalar(v, isInt) { return isNaN(v) ? 'nan' : isInt ? String(v) : pyFloat(v); }
  function maxLen(arr) { return arr.reduce(function (m, s) { return Math.max(m, s.length); }, 0); }
  function ljust(s, w) { while (s.length < w) s += ' '; return s; }
  function rjust(s, w) { while (s.length < w) s = ' ' + s; return s; }
  // Each value gets 6 decimals with a space for the sign, then trailing zeros are trimmed equally from all
  // of them (keeping at least one), then they are right-aligned. Integers just get the sign space.
  function fmtValues(vals, isInt) {
    var s;
    if (isInt) s = vals.map(function (v) { return (v < 0 ? '-' : ' ') + String(Math.abs(v)); });
    else {
      var re = /^\s*[+-]?[0-9]+\.[0-9]*$/;
      s = vals.map(function (v) { return isNaN(v) ? 'NaN' : (v < 0 ? '-' : ' ') + Math.abs(v).toFixed(6); });
      var trim = function () {
        var nums = s.filter(function (x) { return re.test(x); });
        return nums.length > 0 && nums.every(function (x) { return x.charAt(x.length - 1) === '0'; });
      };
      while (trim()) s = s.map(function (x) { return re.test(x) ? x.slice(0, -1) : x; });
      s = s.map(function (x) { return re.test(x) && x.charAt(x.length - 1) === '.' ? x + '0' : x; });
    }
    var w = maxLen(s);
    return s.map(function (x) { return rjust(x, w); });
  }
  function seriesRepr(res, cfg) {
    var footer = 'Name: ' + cfg.agg + ', dtype: ' + (res.isInt ? 'int64' : 'float64');
    if (!res.groups.length) return 'Series([], ' + footer + ')';
    var ord = res.order.map(function (j) { return res.groups[j]; });
    var vals = fmtValues(ord.map(function (g) { return g.value; }), res.isInt);
    var header, idx;
    if (res.keys.length === 1) {
      header = res.keys[0];
      idx = ord.map(function (g) { return g.keys[0]; });
    } else {
      // MultiIndex: an outer name is left blank when it repeats the row above
      var l0 = [res.keys[0]], l1 = [res.keys[1]];
      ord.forEach(function (g, r) {
        l0.push(r > 0 && g.keys[0] === ord[r - 1].keys[0] ? '' : g.keys[0]);
        l1.push(g.keys[1]);
      });
      var w0 = maxLen(l0) + 2, w1 = maxLen(l1);
      var lines = l0.map(function (a, r) { return ljust(a, w0) + ljust(l1[r], w1); });
      header = lines[0];
      idx = lines.slice(1);
    }
    var wi = maxLen(idx) + 3;
    return header + '\n' + idx.map(function (s, r) { return ljust(s, wi) + vals[r]; }).join('\n') + '\n' + footer;
  }
  function pyOutput(res, cfg, sel) {
    if (res.scalar) return pyScalar(res.groups[0].value, res.isInt);
    var out = seriesRepr(res, cfg);
    if (sel) out += '\n' + pyScalar(sel.value, res.isInt);
    return out;
  }
  var Engine = { ROWS: ROWS, DEFAULTS: DEFAULTS, compute: compute, pyLines: pyLines, pyOutput: pyOutput, filterOn: filterOn };

  /* ---------- friendly numbers: ₹ with Indian digit grouping (₹1,25,000) ---------- */
  function indian(n) {
    var s = String(Math.round(n));
    if (s.length > 3) s = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3);
    return s;
  }
  function fmtNum(v, money) {
    if (isNaN(v)) return 'NaN';
    var a = Math.abs(v), s;
    if (Math.round(a) === a) s = indian(a);
    else { var f = a.toFixed(2).split('.'); s = indian(+f[0]) + '.' + f[1]; }
    return (v < 0 ? '−' : '') + (money ? '₹' : '') + s;
  }
  function fmtAgg(v, cfg) { return cfg.fn === 'count' ? String(v) : fmtNum(v, cfg.agg === 'sales_rs'); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function copyObj(o) { var c = {}; for (var k in o) c[k] = o[k]; return c; }
  function sameMembers(a, b) { return a.length === b.length && a.every(function (x) { return b.indexOf(x) >= 0; }); }

  var SVGNS = 'http://www.w3.org/2000/svg';
  function sv(tag, attrs, parent) {
    var el = document.createElementNS(SVGNS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  }

  /* ================================================================ */
  function mount(root, ctx) {
    var P = 'gb' + (++mountCount) + '-';
    var listeners = [];
    function on(el, type, fn, opts) { el.addEventListener(type, fn, opts); listeners.push([el, type, fn, opts]); }
    var destroyed = false;
    var mqReduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    function reduced() { return !!(mqReduce && mqReduce.matches); }

    function seg(id, label, attr, items) {
      return '<div class="control"><span class="control-label" id="' + P + id + 'lbl">' + label + '</span>' +
        '<div class="seg" role="group" aria-labelledby="' + P + id + 'lbl">' +
        items.map(function (it) { return '<button type="button" data-' + attr + '="' + it[0] + '" aria-pressed="false">' + it[1] + '</button>'; }).join('') +
        '</div><p class="small muted" id="' + P + id + 'desc"></p></div>';
    }
    function stat(id, k) { return '<div class="stat"><div class="k">' + k + '</div><div class="v" id="' + P + id + '">—</div></div>'; }
    var thStyle = 'text-transform:none;letter-spacing:0;font-family:var(--font-mono);font-size:.85rem;position:sticky;top:0;background:var(--surface);z-index:1';
    var dfRows = ROWS.map(function (r) {
      return '<tr data-row="' + r.i + '">' +
        '<th scope="row" class="num" style="white-space:nowrap;font-family:var(--font-mono);font-size:.85rem;text-transform:none;letter-spacing:0;color:inherit">' +
          '<span data-mk aria-hidden="true" style="display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px;vertical-align:0"></span>' + r.i +
          '<span class="visually-hidden" data-st></span></th>' +
        '<td>' + r.city + '</td><td>' + r.month + '</td><td>' + r.product + '</td>' +
        '<td class="num" style="text-align:right">' + fmtNum(r.units) + '</td><td class="num" data-sales style="text-align:right;white-space:nowrap">' + (r.sales_rs === null ? '' : fmtNum(r.sales_rs, true)) + '</td></tr>';
    }).join('');

    var labEl = document.createElement('div');
    labEl.className = 'lab';
    labEl.innerHTML =
      '<p class="lab-note"><strong>What you are seeing:</strong> a pandas <em>DataFrame</em> (a table of data) called <code>df</code>, holding 24 rows of sales from tea shops in four cities. ' +
        'Each row is one product in one city for one month. Tea sells at ₹15 a cup, coffee at ₹40 and a snack at ₹30, so <code>sales_rs</code> (sales in rupees) is units × price. ' +
        'Two sales figures were never written down: pandas shows them as <code>NaN</code> (“not a number”, its mark for a missing value). ' +
        '<code>groupby</code> answers questions like “total sales per city” in three steps: <em>split</em> the rows into groups, <em>apply</em> a function to each group to get one number, and <em>combine</em> those numbers into one result. ' +
        'In the picture each small bar is one row. Build your question with the controls; the pandas code and its output change as you go.</p>' +
      '<div class="lab-body">' +
        '<div class="stack" id="' + P + 'left">' +
          '<div class="stack-sm">' +
            '<h2 class="lab-h" id="' + P + 'codeh">The pandas code</h2>' +
            '<pre id="' + P + 'code" aria-labelledby="' + P + 'codeh" style="white-space:pre-wrap;overflow-wrap:anywhere"></pre>' +
            '<p class="small muted" id="' + P + 'plain"></p>' +
          '</div>' +
          '<div class="stack-sm">' +
            '<div class="lab-canvas-wrap" id="' + P + 'wrap"><svg id="' + P + 'svg" role="img" aria-label="Split-apply-combine picture" style="touch-action:auto;font-family:var(--font-body)"></svg></div>' +
            '<div class="row-between">' +
              '<div class="seg" role="group" aria-labelledby="' + P + 'steplbl">' +
                STAGES.map(function (s, i) { return '<button type="button" data-stage="' + i + '" aria-pressed="false">' + (i ? i + ' ' : '') + s + '</button>'; }).join('') +
              '</div>' +
              '<button type="button" class="btn btn-primary btn-sm" id="' + P + 'play" aria-pressed="false">Play all steps</button>' +
            '</div>' +
            '<span class="visually-hidden" id="' + P + 'steplbl">Step to show in the picture</span>' +
            '<p class="small" id="' + P + 'cap" style="min-height:3em"></p>' +
            '<p class="small muted">Tap a group box or a result row in the picture to read it. Coloured edge: the row’s group. Dashed bar: a missing value (NaN). Crossed-out bar: a row the filter removes.</p>' +
          '</div>' +
          '<div class="lab-stats">' + stat('skept', 'Rows kept') + stat('sgroups', 'Groups') + stat('snan', 'NaN in column') + '</div>' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:16px;align-items:start">' +
            '<div class="stack-sm" style="min-width:0">' +
              '<h2 class="lab-h" id="' + P + 'outh">What print() shows</h2>' +
              '<pre id="' + P + 'out" tabindex="0" aria-labelledby="' + P + 'outh" style="white-space:pre;width:0;min-width:100%"></pre>' +
            '</div>' +
            '<div class="stack-sm" style="min-width:0">' +
              '<h2 class="lab-h" id="' + P + 'resh">Read the result</h2>' +
              '<div class="table-wrap" style="position:relative;width:0;min-width:100%"><table class="simple" aria-labelledby="' + P + 'resh">' +
                '<thead><tr><th scope="col" style="text-transform:none;letter-spacing:0">Group</th><th scope="col" style="text-transform:none;letter-spacing:0" id="' + P + 'resv">Value</th><th scope="col" style="text-transform:none;letter-spacing:0">Values used</th></tr></thead>' +
                '<tbody id="' + P + 'resbody"></tbody></table></div>' +
              '<p class="small" id="' + P + 'read" aria-live="polite"></p>' +
            '</div>' +
          '</div>' +
          '<p class="visually-hidden" role="status" aria-live="polite" id="' + P + 'live"></p>' +
        '</div>' +
        '<div class="lab-controls">' +
          '<div class="control"><span class="control-label">1. Filter rows: keep only rows where…</span>' +
            '<div style="display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,.8fr) minmax(0,1.15fr);gap:6px;align-items:end">' +
              '<div class="stack-sm" style="gap:2px"><label class="small" for="' + P + 'fcol">Column</label><select id="' + P + 'fcol" style="width:100%">' +
                '<option value="">(no filter)</option>' + KEY_COLS.concat(NUM_COLS).map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join('') + '</select></div>' +
              '<div class="stack-sm" style="gap:2px"><label class="small" for="' + P + 'fop">Test</label><select id="' + P + 'fop" style="width:100%"></select></div>' +
              '<div class="stack-sm" style="gap:2px" id="' + P + 'fvalbox"><label class="small" for="' + P + 'fval">Value</label><select id="' + P + 'fval" style="width:100%"></select></div>' +
              '<div class="stack-sm" style="gap:2px" id="' + P + 'fnumbox" hidden><label class="small" for="' + P + 'fnum">Value</label><input type="number" id="' + P + 'fnum" inputmode="decimal" step="any" style="width:100%"></div>' +
            '</div>' +
            '<p class="small muted" id="' + P + 'fdesc"></p></div>' +
          '<div class="control"><span class="control-label" id="' + P + 'bylbl">2. Group by</span>' +
            '<div class="seg" role="group" aria-labelledby="' + P + 'bylbl">' +
              '<button type="button" data-by="0" aria-pressed="false">None</button><button type="button" data-by="1" aria-pressed="false">1 column</button><button type="button" data-by="2" aria-pressed="false">2 columns</button></div>' +
            '<div id="' + P + 'keys" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:6px;margin-top:4px">' +
              '<div class="stack-sm" style="gap:2px"><label class="small" for="' + P + 'k1">First column</label><select id="' + P + 'k1" style="width:100%">' +
                KEY_COLS.map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join('') + '</select></div>' +
              '<div class="stack-sm" style="gap:2px" id="' + P + 'k2box"><label class="small" for="' + P + 'k2">Then by</label><select id="' + P + 'k2" style="width:100%"></select></div>' +
            '</div>' +
            '<p class="small muted" id="' + P + 'bydesc"></p></div>' +
          seg('agg', '3. Column to summarise', 'agg', [['units', 'units'], ['sales_rs', 'sales_rs']]) +
          seg('fn', '4. Function to apply', 'fn', FNS.map(function (f) { return [f, f]; })) +
          seg('sort', '5. Sort the result by value', 'sort', [['none', 'Off'], ['asc', 'Ascending'], ['desc', 'Descending']]) +
          seg('na', 'Missing values (NaN)', 'na', [['skip', 'Skip NaN (default)'], ['fill', 'Fill with 0']]) +
          '<div class="row"><button type="button" class="btn btn-sm" id="' + P + 'reset">Reset settings</button></div>' +
          '<div class="stack-sm"><h2 class="lab-h">Your tasks</h2><ul class="lab-tasks" id="' + P + 'tasks">' +
            TASKS.map(function (t) { return '<li data-task="' + t.id + '">' + esc(t.text) + '</li>'; }).join('') + '</ul></div>' +
        '</div>' +
      '</div>' +
      '<div class="stack-sm">' +
        '<h2 class="lab-h" id="' + P + 'dfh">The DataFrame df: 24 rows, 5 columns</h2>' +
        '<p class="small muted">The first column is the row number (pandas calls it the index). Crossed-out rows are removed by the filter; the coloured square shows which group a row joins.</p>' +
        // width:0 + min-width:100% keeps this scroll box from forcing the page wider than a phone screen
        '<div class="table-wrap" id="' + P + 'dfwrap" role="region" aria-labelledby="' + P + 'dfh" tabindex="0" style="position:relative;width:0;min-width:100%;max-height:400px;overflow:auto;border:1px solid var(--line);border-radius:var(--radius-sm);background:var(--surface)">' +
          '<table class="simple" style="font-size:.92rem"><thead><tr>' +
            ['index'].concat(KEY_COLS, NUM_COLS).map(function (c, j) { return '<th scope="col" style="' + thStyle + (j >= 4 ? ';text-align:right' : '') + '">' + c + '</th>'; }).join('') +
          '</tr></thead><tbody id="' + P + 'dfbody">' + dfRows + '</tbody></table></div>' +
      '</div>' +
      '<p class="small muted"><strong style="color:var(--ink)">Why it matters in real ML:</strong> data scientists run groupby all the time before training a model: to check the data (how many rows each class has, where values are missing), to spot patterns (average sales per city) and to build features (new input columns), such as each shop’s average monthly sales. Skipping or filling missing values changes the numbers, so make that choice on purpose.</p>';
    root.appendChild(labEl);

    function $(id) { return labEl.querySelector('#' + P + id); }
    var body = labEl.querySelector('.lab-body');
    var wrap = $('wrap'), svg = $('svg');
    var elCode = $('code'), elPlain = $('plain'), elCap = $('cap'), elOut = $('out'), elResBody = $('resbody'), elResV = $('resv'), elRead = $('read'), elLive = $('live');
    var elSKept = $('skept'), elSGroups = $('sgroups'), elSNan = $('snan');
    var selFcol = $('fcol'), selFop = $('fop'), selFval = $('fval'), inFnum = $('fnum'), boxFval = $('fvalbox'), boxFnum = $('fnumbox'), elFdesc = $('fdesc');
    var selK1 = $('k1'), selK2 = $('k2'), boxKeys = $('keys'), boxK2 = $('k2box'), elByDesc = $('bydesc');
    var elAggDesc = $('aggdesc'), elFnDesc = $('fndesc'), elSortDesc = $('sortdesc'), elNaDesc = $('nadesc');
    var btnPlay = $('play'), btnReset = $('reset'), dfBody = $('dfbody');
    var stageBtns = labEl.querySelectorAll('[data-stage]');
    function btns(attr) { return labEl.querySelectorAll('[data-' + attr + ']'); }
    var taskEls = {};
    Array.prototype.forEach.call(labEl.querySelectorAll('[data-task]'), function (li) { taskEls[li.getAttribute('data-task')] = li; });
    var dfTrs = Array.prototype.slice.call(dfBody.querySelectorAll('tr'));

    /* ---------- state ---------- */
    var cfg = copyObj(DEFAULTS);
    var res = null, selId = null, stage = START_STAGE, prevStage = START_STAGE, playing = false;
    var done = {};
    var L = { W: 0, H: 0 };
    var rafId = 0, playTimer = 0, announceTimer = 0, aspectRaf = 0, layoutRaf = 0;
    var anim = { t0: 0 };
    var DUR = 600;

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
      if (announceTimer) { clearTimeout(announceTimer); announceTimer = 0; }
      announce('Task done. ' + why);
      if (ctx && ctx.onTaskDone) ctx.onTaskDone(id);
    }
    function announce(s) { elLive.textContent = s; }

    /* ---------- text measuring (for fitting labels in the picture) ---------- */
    var mctx = document.createElement('canvas').getContext('2d');
    var fontFam = 'system-ui, sans-serif', wCache = {};
    function readFont() {
      var f = getComputedStyle(document.documentElement).getPropertyValue('--font-body').trim();
      fontFam = f || 'system-ui, sans-serif';
      wCache = {};
    }
    function textW(t, size, weight) {
      var key = weight + '|' + size + '|' + t, v = wCache[key];
      if (v === undefined) {
        if (mctx) { mctx.font = weight + ' ' + size + 'px ' + fontFam; v = mctx.measureText(t).width; }
        else v = t.length * size * 0.55;
        wCache[key] = v;
      }
      return v;
    }

    /* ---------- the picture: SVG elements ---------- */
    var gBoxes = sv('g', {}, svg), gChips = sv('g', {}, svg), gAggs = sv('g', {}, svg), gHeads = sv('g', {}, svg);
    var emptyText = sv('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 13, style: 'fill:var(--muted)' }, svg);
    emptyText.textContent = 'No rows pass the filter, so there is nothing to group.';
    emptyText.style.display = 'none';

    var chips = ROWS.map(function (r) {
      var g = sv('g', { style: 'cursor:pointer' }, gChips);
      var e = {
        kind: 'chip', g: g,
        bg: sv('rect', { rx: 4, 'stroke-width': 1 }, g),
        stripe: sv('rect', { x: 1.5, y: 1.5, width: 3.5, rx: 1.5 }, g),
        tKey: sv('text', { x: 10, 'dominant-baseline': 'central', 'font-weight': 500, style: 'fill:var(--ink)' }, g),
        tVal: sv('text', { 'text-anchor': 'end', 'dominant-baseline': 'central', 'font-weight': 600, style: 'fill:var(--ink);font-variant-numeric:tabular-nums' }, g),
        cur: { x: 0, y: 0, w: 10, h: 10, op: 0 }, to: null, from: null, delay: 0, keyOn: true, keyW: 0, valW: 0
      };
      e.paint = paintChip;
      return e;
    });
    var boxes = {}, aggs = {};
    function makeBox(id) {
      var g = sv('g', { 'data-g': id, style: 'cursor:pointer' }, gBoxes);
      var e = {
        kind: 'box', id: id, g: g,
        rect: sv('rect', { rx: 8 }, g),
        label: sv('text', { 'dominant-baseline': 'central', 'font-weight': 600, style: 'fill:var(--ink)' }, g),
        cur: null, to: null, from: null, delay: 0, stale: false
      };
      e.paint = paintBox;
      boxes[id] = e;
      return e;
    }
    function makeAgg(id) {
      var g = sv('g', { 'data-g': id, style: 'cursor:pointer' }, gAggs);
      var e = {
        kind: 'agg', id: id, g: g,
        rect: sv('rect', { rx: 5 }, g),
        text: sv('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-weight': 700, style: 'fill:var(--ink);font-variant-numeric:tabular-nums' }, g),
        cur: null, to: null, from: null, delay: 0, stale: false
      };
      e.paint = paintAgg;
      aggs[id] = e;
      return e;
    }
    var heads = [0, 1].map(function (j) {
      var t = sv('text', { 'dominant-baseline': 'central', 'font-weight': 600, 'font-size': 12, 'text-anchor': j ? 'middle' : 'start', style: 'fill:var(--muted)' }, gHeads);
      var e = { kind: 'head', t: t, cur: { x: 0, y: 0, op: 0 }, to: null, from: null, delay: 0 };
      e.paint = paintHead;
      return e;
    });

    function vis(el, on) { el.style.display = on ? '' : 'none'; }
    function paintChip(e) {
      var c = e.cur, w = Math.max(c.w, 0), h = Math.max(c.h, 0);
      vis(e.g, c.op > 0.01);
      if (c.op <= 0.01) return;
      e.g.setAttribute('transform', 'translate(' + c.x.toFixed(2) + ',' + c.y.toFixed(2) + ')');
      e.g.setAttribute('opacity', c.op.toFixed(3));
      e.bg.setAttribute('width', w.toFixed(2)); e.bg.setAttribute('height', h.toFixed(2));
      e.stripe.setAttribute('height', Math.max(h - 3, 0).toFixed(2));
      e.tKey.setAttribute('y', (h / 2).toFixed(2));
      e.tVal.setAttribute('x', (w - 6).toFixed(2)); e.tVal.setAttribute('y', (h / 2).toFixed(2));
      // hide text that no longer fits while a bar shrinks into its group's number
      vis(e.tVal, w >= e.valW + 12 && h >= 9);
      vis(e.tKey, e.keyOn && w >= e.keyW + e.valW + 22 && h >= 9);
    }
    function paintBox(e) {
      var c = e.cur;
      vis(e.g, c.op > 0.01);
      if (c.op <= 0.01) return;
      e.g.setAttribute('opacity', c.op.toFixed(3));
      e.rect.setAttribute('x', c.x.toFixed(2)); e.rect.setAttribute('y', c.y.toFixed(2));
      e.rect.setAttribute('width', Math.max(c.w, 0).toFixed(2)); e.rect.setAttribute('height', Math.max(c.h, 0).toFixed(2));
      e.label.setAttribute('x', c.lx.toFixed(2)); e.label.setAttribute('y', c.ly.toFixed(2));
    }
    function paintAgg(e) {
      var c = e.cur;
      vis(e.g, c.op > 0.01);
      if (c.op <= 0.01) return;
      e.g.setAttribute('opacity', c.op.toFixed(3));
      e.g.setAttribute('transform', 'translate(' + c.x.toFixed(2) + ',' + c.y.toFixed(2) + ')');
      e.rect.setAttribute('width', Math.max(c.w, 0).toFixed(2)); e.rect.setAttribute('height', Math.max(c.h, 0).toFixed(2));
      e.text.setAttribute('x', (c.w / 2).toFixed(2)); e.text.setAttribute('y', (c.h / 2).toFixed(2));
    }
    function paintHead(e) {
      var c = e.cur;
      vis(e.t, c.op > 0.01);
      e.t.setAttribute('opacity', c.op.toFixed(3));
      e.t.setAttribute('x', c.x.toFixed(2)); e.t.setAttribute('y', c.y.toFixed(2));
    }
    function allEls() {
      var a = chips.slice(), k;
      for (k in boxes) a.push(boxes[k]);
      for (k in aggs) a.push(aggs[k]);
      return a.concat(heads);
    }

    /* ---------- layout: where everything sits in each step ---------- */
    function metrics() {
      var phone = L.W < 520;
      // fs is the smallest text size; bars and their text grow (up to maxCH and maxFs) when there is room
      return { pad: phone ? 8 : 12, fs: phone ? 11 : 12, maxFs: phone ? 13 : 15, gap: phone ? 4 : 6, gx: phone ? 6 : 10, bp: 6, hh: phone ? 18 : 22, cg: 3, maxCH: phone ? 30 : 36 };
    }
    var chipKey = [], chipVal = [];
    function chipTexts() {
      ROWS.forEach(function (r, i) {
        chipKey[i] = res.keys.length ? res.keys.map(function (k) { return r[k]; }).join(' · ') : 'row ' + i;
        chipVal[i] = r[cfg.agg] === null ? (cfg.missing === 'fill' ? fmtNum(0, true) : 'NaN') : fmtNum(r[cfg.agg], cfg.agg === 'sales_rs');
      });
    }
    // Step 0: every row in df order, read down the columns (with 3 columns each column is one month)
    function layoutFilter(M) {
      var keyW = 0, valW = 0, i;
      for (i = 0; i < N; i++) { keyW = Math.max(keyW, textW(chipKey[i], M.fs, 500)); valW = Math.max(valW, textW(chipVal[i], M.fs, 600)); }
      var avail = L.W - 2 * M.pad;
      var colsFor = function (need) {
        var c = Math.floor((avail + M.gap) / (need + M.gap)), opts = [6, 3, 2, 1];
        for (var k = 0; k < opts.length; k++) if (opts[k] <= c) return opts[k];
        return 1;
      };
      var showKey = true, cols = colsFor(keyW + valW + 30);
      if (cols < 2) { showKey = false; cols = colsFor(valW + 22); }
      var rows = Math.ceil(N / cols);
      var ch = Math.max(8, Math.min(M.maxCH - 4, (L.H - 2 * M.pad - (rows - 1) * M.gap) / rows));
      var cw = Math.min(250, (avail - (cols - 1) * M.gap) / cols);
      var fs = clamp(ch * 0.46, M.fs, M.maxFs - 1);
      fs = Math.max(M.fs, Math.min(fs, M.fs * (cw - (showKey ? 30 : 22)) / (showKey ? keyW + valW : valW)));
      var x0 = (L.W - (cols * cw + (cols - 1) * M.gap)) / 2;
      var y0 = (L.H - (rows * ch + (rows - 1) * M.gap)) / 2;
      var pos = [];
      for (i = 0; i < N; i++) {
        var c = Math.floor(i / rows), r = i % rows;
        pos.push({ x: x0 + c * (cw + M.gap), y: y0 + r * (ch + M.gap), w: cw, h: ch });
      }
      return { pos: pos, showKey: showKey, fs: fs };
    }
    // Steps 1 and 2: one box per group. One column: boxes side by side or in a grid. Two columns: a grid with
    // one line per first-column value and one column per second-column value (turned round if it is too wide).
    function layoutGroups(M) {
      var gs = res.groups, n = gs.length;
      if (!n || !res.kept.length) return null;
      var valW = 0;
      res.kept.forEach(function (i) { valW = Math.max(valW, textW(chipVal[i], M.fs, 600)); });
      var minCW = valW + 18, maxCW = 170;
      var cands = [];
      if (res.keys.length === 2) {
        var v0 = [], v1 = [];
        gs.forEach(function (g) { if (v0.indexOf(g.keys[0]) < 0) v0.push(g.keys[0]); if (v1.indexOf(g.keys[1]) < 0) v1.push(g.keys[1]); });
        v1.sort();
        cands.push({ rows: v0.length, cols: v1.length, bonus: 1, at: function (g) { return [v0.indexOf(g.keys[0]), v1.indexOf(g.keys[1])]; } });
        cands.push({ rows: v1.length, cols: v0.length, bonus: 0, at: function (g) { return [v1.indexOf(g.keys[1]), v0.indexOf(g.keys[0])]; } });
      } else if (res.keys.length === 1) {
        for (var gc = 1; gc <= n; gc++) {
          (function (gc) { cands.push({ rows: Math.ceil(n / gc), cols: gc, bonus: gc * 0.6, at: function (g, j) { return [Math.floor(j / gc), j % gc]; } }); })(gc);
        }
      } else cands.push({ rows: 1, cols: 1, bonus: 0, at: function () { return [0, 0]; } });
      var labelW = 0;
      gs.forEach(function (g) { labelW = Math.max(labelW, textW(g.label, 12, 600)); });
      var best = null, loose = null;
      cands.forEach(function (cd) {
        var cellW = (L.W - 2 * M.pad - (cd.cols - 1) * M.gx) / cd.cols;
        var labScale = Math.min(1, (cellW - 2 * M.bp - 2) / labelW);
        for (var cc = 1; cc <= 6; cc++) {
          var cw = (cellW - 2 * M.bp - (cc - 1) * M.cg) / cc;
          if (cc > 1 && cw < minCW) break;
          var need = [], r;
          for (r = 0; r < cd.rows; r++) need.push(1);
          gs.forEach(function (g, j) { var p = cd.at(g, j); need[p[0]] = Math.max(need[p[0]], Math.ceil(g.rows.length / cc)); });
          var R = need.reduce(function (a, b) { return a + b; }, 0);
          var ch = (L.H - 2 * M.pad - (cd.rows - 1) * M.gx - cd.rows * (M.hh + 2 * M.bp) + cd.rows * M.cg) / R - M.cg;
          var chc = Math.min(ch, M.maxCH);
          // taller bars help only up to a point; small box labels hurt a lot
          var labFont = (M.hh >= 22 ? 13 : 12) * labScale;
          var score = Math.min(chc, 26) * 10 + cd.bonus - cc * 0.8 - Math.max(0, 11 - labFont) * 45 - (cw < minCW ? 200 : 0);
          var cand = { cd: cd, cc: cc, cw: Math.min(cw, maxCW), ch: chc, cellW: cellW, need: need, labScale: labScale, score: score };
          if (!loose || score > loose.score) loose = cand;
          if (ch >= 12 && cw >= minCW && (!best || score > best.score)) best = cand;
        }
      });
      best = best || loose;
      var cd = best.cd, cc = best.cc, cw = best.cw, ch = Math.max(best.ch, 8);
      var boxW = Math.min(best.cellW, Math.max(cc * cw + (cc - 1) * M.cg + 2 * M.bp, Math.min(best.cellW, labelW * best.labScale + 2 * M.bp + 6)));
      var rh = best.need.map(function (k) { return M.hh + 2 * M.bp + k * (ch + M.cg) - M.cg; });
      var fs = clamp(ch * 0.5, M.fs, M.maxFs);
      fs = Math.max(M.fs, Math.min(fs, M.fs * (cw - 18) / valW));
      var aggH = clamp(ch + 4, 22, 40);
      var labFs = M.hh >= 22 ? 13 : 12;
      var out = { box: {}, abox: {}, slot: {}, agg: {}, skipSlot: {}, fs: fs, aggFs: clamp(aggH * 0.5, fs + 0.5, M.maxFs),
        labFs: Math.max(8.5, labFs * Math.min(1, (best.cellW - 2 * M.bp - 2) / (labelW * labFs / 12))) };
      var innerChips = cc * cw + (cc - 1) * M.cg;
      // Apply step: each box shrinks round its one number. NaN bars that are skipped wait beside the number
      // (or under it), so the learner sees what was left out.
      var plan = {}, arh = [];
      for (var r0 = 0; r0 < cd.rows; r0++) arh.push(0);
      gs.forEach(function (g, j) {
        var p = cd.at(g, j);
        var skipped = g.rows.filter(function (i) { return ROWS[i][cfg.agg] === null && cfg.missing === 'skip'; });
        var nS = skipped.length, beside = nS > 0 && cc - nS >= 1, below = nS > 0 && !beside && g.rows.length > nS;
        var content = aggH + (below ? M.cg + Math.ceil(nS / cc) * (ch + M.cg) - M.cg : 0);
        plan[g.id] = { p: p, skipped: skipped, beside: beside, below: below };
        arh[p[0]] = Math.max(arh[p[0]], M.hh + 2 * M.bp + content);
      });
      function rowTops(hs) {
        var tot = hs.reduce(function (a, b) { return a + b; }, 0) + (cd.rows - 1) * M.gx, acc = Math.max(M.pad, (L.H - tot) / 2), ys = [];
        hs.forEach(function (h) { ys.push(acc); acc += h + M.gx; });
        return ys;
      }
      var rowY = rowTops(rh), arowY = rowTops(arh);
      gs.forEach(function (g) {
        var pl = plan[g.id], p = pl.p;
        var cellX = M.pad + p[1] * (best.cellW + M.gx);
        var bx = cellX + (best.cellW - boxW) / 2, by = rowY[p[0]], bh = rh[p[0]];
        var cx0 = bx + (boxW - innerChips) / 2;
        out.box[g.id] = { x: bx, y: by, w: boxW, h: bh, lx: bx + M.bp + 2, ly: by + M.bp + M.hh / 2 };
        g.rows.forEach(function (i, k) {
          out.slot[i] = { x: cx0 + (k % cc) * (cw + M.cg), y: by + M.bp + M.hh + Math.floor(k / cc) * (ch + M.cg), w: cw, h: ch };
        });
        var ay = arowY[p[0]], ah = arh[p[0]], aTop = ay + M.bp + M.hh;
        out.abox[g.id] = { x: bx, y: ay, w: boxW, h: ah, lx: bx + M.bp + 2, ly: ay + M.bp + M.hh / 2 };
        var aggCols = pl.beside ? cc - pl.skipped.length : cc;
        out.agg[g.id] = pl.beside ? { x: cx0, y: aTop, w: aggCols * cw + (aggCols - 1) * M.cg, h: aggH } : { x: bx + M.bp, y: aTop, w: boxW - 2 * M.bp, h: aggH };
        pl.skipped.forEach(function (i, t) {
          if (pl.beside) out.skipSlot[i] = { x: cx0 + (aggCols + t) * (cw + M.cg), y: aTop + (aggH - ch) / 2, w: cw, h: ch };
          else if (pl.below) out.skipSlot[i] = { x: cx0 + (t % cc) * (cw + M.cg), y: aTop + aggH + M.cg + Math.floor(t / cc) * (ch + M.cg), w: cw, h: ch };
        });
      });
      return out;
    }
    // Step 3: the result as a small table, in the result's order (sorted or A to Z)
    function layoutCombine(M) {
      var gs = res.groups, n = gs.length;
      if (!n || !res.kept.length) return null;
      var out = { box: {}, agg: {}, heads: null, aggFs: M.fs + 0.5, labFs: 12 };
      if (res.scalar) {
        var g = gs[0], tw = Math.min(L.W - 2 * M.pad, 300), h = 86;
        var x = (L.W - tw) / 2, y = (L.H - h) / 2;
        out.box[g.id] = { x: x, y: y, w: tw, h: h, lx: x + 12, ly: y + 17 };
        out.agg[g.id] = { x: x + 12, y: y + 32, w: tw - 24, h: 42, op: 1 };
        out.aggFs = 20; out.labFs = 13;
        out.heads = [{ x: x + 12, y: y - 12, op: 0, text: '' }, { x: L.W / 2, y: y - 12, op: 1, text: cfg.agg + ' ' + cfg.fn + ': one number' }];
        return out;
      }
      var headH = 20, rg = 3;
      var rowH = Math.min(M.maxCH, (L.H - 2 * M.pad - headH - 4 - (n - 1) * rg) / n);
      out.aggFs = clamp(rowH * 0.46, M.fs + 0.5, M.maxFs);
      out.labFs = clamp(rowH * 0.42, 12, M.maxFs - 1);
      var labW = 0, valW = 0;
      gs.forEach(function (g) { labW = Math.max(labW, textW(g.label, out.labFs, 600)); valW = Math.max(valW, textW(fmtAgg(g.value, cfg), out.aggFs, 700)); });
      var headL = res.keys.join(' · '), headV = cfg.agg + ' ' + cfg.fn;
      labW = Math.max(labW, textW(headL, 12, 600));
      valW = Math.max(valW + 24, textW(headV, 12, 600) + 10, 90);
      var tw2 = Math.min(L.W - 2 * M.pad, Math.max(labW + valW + 34, L.W < 520 ? 250 : 320));
      var x0 = (L.W - tw2) / 2;
      var total = headH + 4 + n * rowH + (n - 1) * rg, y0 = Math.max(M.pad, (L.H - total) / 2);
      out.heads = [{ x: x0 + 10, y: y0 + headH / 2, op: 1, text: headL }, { x: x0 + tw2 - 4 - valW / 2, y: y0 + headH / 2, op: 1, text: headV }];
      res.order.forEach(function (j, r) {
        var g = gs[j], y = y0 + headH + 4 + r * (rowH + rg);
        out.box[g.id] = { x: x0, y: y, w: tw2, h: rowH, lx: x0 + 10, ly: y + rowH / 2 };
        out.agg[g.id] = { x: x0 + tw2 - valW - 4, y: y + 3, w: valW, h: Math.max(rowH - 6, 4), op: 1 };
      });
      return out;
    }

    function setTo(e, to, delay) {
      if (!e.cur) e.cur = copyObj(to);
      e.from = {};
      for (var k in to) e.from[k] = e.cur[k] === undefined ? to[k] : e.cur[k];
      e.to = to;
      e.delay = delay || 0;
    }
    function boxStyle(e, g) {
      var sel = g && g.id === selId;
      e.rect.style.fill = 'var(--surface-2)';
      e.rect.style.stroke = sel ? 'var(--ink)' : 'var(' + (g ? g.colour : '--line') + ')';
      e.rect.style.strokeWidth = sel ? '2.5' : '1.5';
    }
    function aggStyle(e, g) {
      var sel = g && g.id === selId;
      e.rect.style.fill = 'var(--surface)';
      e.rect.style.stroke = sel ? 'var(--ink)' : 'var(' + (g ? g.colour : '--line') + ')';
      e.rect.style.strokeWidth = sel ? '2.5' : '2';
    }
    // Work out every element's target for the current step and settings, then move there.
    function relayout(animate) {
      if (L.W < 2 || !res) return;
      var M = metrics();
      var F = layoutFilter(M), G = layoutGroups(M), C = layoutCombine(M);
      var s = stage, from = prevStage;
      prevStage = stage;
      var hasRows = res.kept.length > 0;
      vis(emptyText, s > 0 && !hasRows);
      emptyText.setAttribute('x', L.W / 2); emptyText.setAttribute('y', L.H / 2);
      emptyText.setAttribute('font-size', L.W < 400 ? 12 : 13);
      var rank = {};
      res.kept.forEach(function (i, k) { rank[i] = k; });
      var stagger = Math.min(18, 420 / Math.max(1, res.kept.length));
      // the row bars
      chips.forEach(function (e, i) {
        var row = ROWS[i], kept = res.mask[i], gi = res.rowGroup[i], g = gi >= 0 ? res.groups[gi] : null;
        var miss = row[cfg.agg] === null, neutral = s === 0;
        if (g) e.g.setAttribute('data-g', g.id); else e.g.removeAttribute('data-g');
        e.g.style.cursor = g ? 'pointer' : 'default';
        var cfs = s === 0 || !G ? F.fs : G.fs;
        e.g.setAttribute('font-size', cfs.toFixed(1));
        e.tKey.textContent = chipKey[i];
        e.tVal.textContent = chipVal[i];
        e.keyW = textW(chipKey[i], cfs, 500); e.valW = textW(chipVal[i], cfs, 600);
        e.keyOn = neutral && F.showKey;
        e.bg.style.fill = neutral && kept ? 'var(--surface-2)' : 'var(--surface)';
        e.bg.style.stroke = miss ? 'var(--muted)' : neutral && !kept ? 'var(--field-line)' : 'var(--line)';
        e.bg.style.strokeDasharray = miss || (neutral && !kept) ? '3 2' : 'none';
        e.stripe.style.fill = 'var(' + (g ? g.colour : '--line') + ')';
        e.stripe.style.display = neutral || !g ? 'none' : '';
        var txt = kept ? 'var(--ink)' : 'var(--muted)', deco = kept ? 'none' : 'line-through';
        e.tKey.style.fill = txt; e.tVal.style.fill = txt;
        e.tKey.style.textDecoration = deco; e.tVal.style.textDecoration = deco;
        var p = F.pos[i], to, delay = 0;
        if (s === 0 || !kept || !G) to = { x: p.x, y: p.y, w: p.w, h: p.h, op: s === 0 ? 1 : 0 };
        else if (s === 1) { var sl = G.slot[i]; to = { x: sl.x, y: sl.y, w: sl.w, h: sl.h, op: 1 }; if (from === 0) delay = rank[i] * stagger; }
        else if (s === 2) {
          var ss = G.skipSlot[i];
          if (ss) to = { x: ss.x, y: ss.y, w: ss.w, h: ss.h, op: 1 };
          else { var a = G.agg[g.id]; to = { x: a.x + a.w / 2 - 10, y: a.y + a.h / 2 - 6, w: 20, h: 12, op: 0 }; }
        } else { var a3 = C.agg[g.id]; to = { x: a3.x + a3.w / 2 - 10, y: a3.y + a3.h / 2 - 6, w: 20, h: 12, op: 0 }; }
        setTo(e, to, delay);
      });
      // group boxes and their numbers
      var k;
      for (k in boxes) boxes[k].stale = true;
      for (k in aggs) aggs[k].stale = true;
      if (hasRows && G) {
        res.groups.forEach(function (g) {
          var b = boxes[g.id] || makeBox(g.id), ag = aggs[g.id] || makeAgg(g.id);
          b.stale = false; ag.stale = false;
          b.label.textContent = g.label;
          ag.text.textContent = fmtAgg(g.value, cfg);
          boxStyle(b, g); aggStyle(ag, g);
          var gb = s === 2 ? G.abox[g.id] : G.box[g.id], ga = G.agg[g.id];
          var r = res.order.indexOf(res.groups.indexOf(g));
          var bt, at, bd = 0, ad = 0;
          if (s <= 2) {
            bt = { x: gb.x, y: gb.y, w: gb.w, h: gb.h, lx: gb.lx, ly: gb.ly, op: s === 0 ? 0 : 1 };
            at = { x: ga.x, y: ga.y, w: ga.w, h: ga.h, op: s === 2 ? 1 : 0 };
            if (s === 2 && from !== 2) ad = 320;
            b.label.setAttribute('font-size', G.labFs.toFixed(1));
            ag.text.setAttribute('font-size', G.aggFs.toFixed(1));
          } else {
            var cb = C.box[g.id], ca = C.agg[g.id];
            bt = { x: cb.x, y: cb.y, w: cb.w, h: cb.h, lx: cb.lx, ly: cb.ly, op: 1 };
            at = { x: ca.x, y: ca.y, w: ca.w, h: ca.h, op: 1 };
            if (from !== 3) { bd = r * 25; ad = r * 25; }
            b.label.setAttribute('font-size', C.labFs.toFixed(1));
            ag.text.setAttribute('font-size', C.aggFs.toFixed(1));
          }
          // a new box or number fades in where it belongs
          if (!b.cur) b.cur = copyObj(bt), b.cur.op = 0;
          if (!ag.cur) ag.cur = copyObj(at), ag.cur.op = 0;
          setTo(b, bt, bd); setTo(ag, at, ad);
        });
      }
      for (k in boxes) if (boxes[k].stale) { var sb = copyObj(boxes[k].cur); sb.op = 0; setTo(boxes[k], sb, 0); }
      for (k in aggs) if (aggs[k].stale) { var sa = copyObj(aggs[k].cur); sa.op = 0; setTo(aggs[k], sa, 0); }
      heads.forEach(function (e, j) {
        var h = s === 3 && C && C.heads ? C.heads[j] : null;
        if (h && h.op) { e.t.textContent = h.text; setTo(e, { x: h.x, y: h.y, op: 1 }, 0); }
        else setTo(e, { x: e.cur.x, y: e.cur.y, op: 0 }, 0);
      });
      runTween(animate);
    }

    /* ---------- the animation loop (runs only while something moves) ---------- */
    function runTween(animate) {
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      if (!animate || reduced()) { finishAll(); return; }
      anim.t0 = performance.now();
      rafId = requestAnimationFrame(frame);
    }
    function finishAll() {
      allEls().forEach(function (e) { if (e.to) { e.cur = copyObj(e.to); e.to = null; } e.paint(e); });
      tweenDone();
    }
    function frame(now) {
      rafId = 0;
      if (destroyed) return;
      var t = now - anim.t0, busy = false;
      allEls().forEach(function (e) {
        if (!e.to) return;
        var p = clamp((t - e.delay) / DUR, 0, 1), kk = ease(p);
        for (var key in e.to) e.cur[key] = e.from[key] + (e.to[key] - e.from[key]) * kk;
        if (p >= 1) e.to = null; else busy = true;
        e.paint(e);
      });
      if (busy) rafId = requestAnimationFrame(frame);
      else tweenDone();
    }
    function tweenDone() {
      var k;
      for (k in boxes) if (boxes[k].stale && boxes[k].cur.op < 0.01) { gBoxes.removeChild(boxes[k].g); delete boxes[k]; }
      for (k in aggs) if (aggs[k].stale && aggs[k].cur.op < 0.01) { gAggs.removeChild(aggs[k].g); delete aggs[k]; }
      if (playing && !playTimer) {
        if (stage >= 3) { stopPlay(); announce(captionText()); return; }
        playTimer = setTimeout(function () {
          playTimer = 0;
          if (destroyed || !playing) return;
          goStage(stage + 1, true, false);
        }, reduced() ? 1500 : 800);
      }
    }

    /* ---------- steps and playback ---------- */
    function goStage(s, animate, speak) {
      stage = s;
      Array.prototype.forEach.call(stageBtns, function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-stage') === s)); });
      renderCaption();
      relayout(animate);
      if (speak) announce(captionText());
    }
    function startPlay() {
      playing = true;
      btnPlay.textContent = 'Stop';
      btnPlay.setAttribute('aria-pressed', 'true');
      goStage(0, true, false);
    }
    function stopPlay() {
      playing = false;
      if (playTimer) { clearTimeout(playTimer); playTimer = 0; }
      btnPlay.textContent = 'Play all steps';
      btnPlay.setAttribute('aria-pressed', 'false');
    }

    /* ---------- words ---------- */
    function filterWords() {
      return cfg.fcol + ' ' + OP_WORD[cfg.fop] + ' ' + (isKeyCol(cfg.fcol) ? cfg.fval : fmtNum(cfg.fnum, cfg.fcol === 'sales_rs'));
    }
    function captionText() {
      var nk = res.kept.length, n = res.groups.length, keys = res.keys;
      var name = (stage ? 'Step ' + stage + ', ' : '') + STAGES[stage] + ': ';
      if (stage === 0) {
        return name + (filterOn(cfg) ? nk + ' of 24 rows pass the test “' + filterWords() + '”. The crossed-out rows are dropped before grouping.' : 'there is no filter, so all 24 rows go on to the next step.');
      }
      if (!nk) return name + 'no rows pass the filter, so there is nothing to group.';
      if (stage === 1) {
        if (!keys.length) return name + 'with no group-by column, all ' + nk + ' rows form one big group.';
        var monthNote = keys.indexOf('month') >= 0 ? ', so Feb comes before Jan' : '';
        return name + 'the ' + nk + ' rows are sorted into ' + n + ' group' + (n === 1 ? '' : 's') + ', one for each ' + (keys.length === 2 ? 'pair of ' + keys[0] + ' and ' + keys[1] + ' values that appears' : keys[0]) + '. pandas puts groups in A-to-Z order' + monthNote + '.';
      }
      if (stage === 2) {
        var nanKept = res.kept.filter(function (i) { return ROWS[i][cfg.agg] === null; }).length;
        var t = name + FN_WORD[cfg.fn] + ' turns each group’s ' + cfg.agg + ' values into one number.';
        if (nanKept && cfg.missing === 'skip') t += ' The dashed NaN bar' + (nanKept > 1 ? 's are' : ' is') + ' skipped: ' + (cfg.fn === 'count' ? 'not counted.' : 'left out.');
        else if (nanKept) t += ' The missing sales were filled with 0, so ' + (nanKept > 1 ? 'they count' : 'it counts') + ' as ₹0.';
        return t;
      }
      if (res.scalar) return name + 'with no groups, the answer is just one number (pandas calls it a scalar).';
      return name + 'the ' + n + ' number' + (n === 1 ? ' becomes' : 's are joined into') + ' one result, a pandas Series (a column with labels), ' +
        (cfg.sort === 'asc' ? 'sorted smallest first' : cfg.sort === 'desc' ? 'sorted largest first' : 'in A-to-Z group order') + '.';
    }
    function plainText() {
      var t = cfg.missing === 'fill' ? 'Fill the missing sales with 0. Then ' : '';
      t += filterOn(cfg) ? 'keep the rows where ' + filterWords() + ', ' : 'use all 24 rows, ';
      if (res.keys.length) t += 'split them by ' + res.keys.join(' and ') + ', ';
      t += 'take the ' + FN_WORD[cfg.fn] + ' of ' + cfg.agg + (res.keys.length ? ' in each group' : '');
      if (res.keys.length && cfg.sort !== 'none') t += ', then sort the result ' + (cfg.sort === 'asc' ? 'smallest first' : 'largest first');
      t += '.';
      if (res.ties && res.keys.length && cfg.sort !== 'none') t += ' Some groups tie, so kind=\'stable\' keeps tied groups in A-to-Z order (pandas’ default sort may shuffle them).';
      if (res.keys.indexOf('month') >= 0 && cfg.sort === 'none') t += ' Groups come out A to Z, so Feb is listed before Jan.';
      return t.charAt(0).toUpperCase() + t.slice(1);
    }

    /* ---------- drawing the page parts ---------- */
    function selGroup() { return selId && res.byId[selId] && !res.scalar ? res.byId[selId] : null; }
    function renderCode() {
      var lines = pyLines(cfg, res, selGroup());
      elCode.innerHTML = lines.map(function (ln) {
        var h = esc(ln).replace(/\.(?=[a-z_])/g, '\u0001.');
        h = h.replace(/'[^']*'/g, function (m) { return '<span style="color:var(--indigo)">' + m + '</span>'; });
        return h.replace(/\u0001/g, '<wbr>');
      }).join('\n');
      elOut.textContent = pyOutput(res, cfg, selGroup());
      elPlain.textContent = plainText();
    }
    function renderCaption() { elCap.textContent = captionText(); }
    function renderStats() {
      elSKept.textContent = res.kept.length + ' of 24';
      elSGroups.textContent = res.scalar ? '1 (no groups)' : String(res.groups.length);
      var nan = res.kept.filter(function (i) { return ROWS[i][cfg.agg] === null; }).length;
      elSNan.textContent = !nan ? '0' : nan + (cfg.missing === 'fill' ? ' filled with 0' : ' skipped');
    }
    function renderResult() {
      elResV.textContent = cfg.agg + ' ' + cfg.fn;
      if (!res.kept.length && !res.scalar) {
        elResBody.innerHTML = '<tr><td colspan="3" class="muted">No groups: no rows pass the filter.</td></tr>';
        return;
      }
      elResBody.innerHTML = res.order.map(function (j) {
        var g = res.groups[j];
        var used = res.scalar && !g.rows.length ? '0' : (g.rows.length - (cfg.missing === 'skip' ? g.nan : 0)) + ' of ' + g.rows.length;
        var cell = res.scalar ? esc(g.label) :
          '<button type="button" class="btn btn-sm" data-pick="' + esc(g.id) + '" aria-pressed="' + (g.id === selId) + '" style="justify-content:flex-start;text-align:left;width:100%">' +
            '<span aria-hidden="true" style="display:inline-block;width:10px;height:10px;border-radius:2px;flex:none;background:var(' + g.colour + ')"></span>' + esc(g.label) + '</button>';
        return '<tr><td style="vertical-align:middle">' + cell + '</td><td class="num" style="vertical-align:middle;font-family:var(--font-mono);font-size:.9rem;white-space:nowrap">' + esc(fmtAgg(g.value, cfg)) + '</td><td class="num" style="vertical-align:middle">' + used + '</td></tr>';
      }).join('');
      styleResultSel();
    }
    function styleResultSel() {
      Array.prototype.forEach.call(elResBody.querySelectorAll('[data-pick]'), function (b) {
        var on = b.getAttribute('data-pick') === selId;
        b.setAttribute('aria-pressed', String(on));
        b.style.background = on ? 'var(--indigo-soft)' : '';
        b.style.borderColor = on ? 'var(--indigo)' : '';
      });
    }
    function renderDf() {
      var sg = selGroup();
      dfTrs.forEach(function (tr, i) {
        var kept = res.mask[i], gi = res.rowGroup[i], g = gi >= 0 ? res.groups[gi] : null;
        tr.style.color = kept ? '' : 'var(--muted)';
        tr.style.textDecoration = kept ? '' : 'line-through';
        tr.style.background = sg && g === sg ? 'var(--indigo-soft)' : '';
        var mk = tr.querySelector('[data-mk]');
        mk.style.background = g ? 'var(' + g.colour + ')' : 'transparent';
        mk.style.border = g ? '0' : '1px dashed var(--field-line)';
        tr.querySelector('[data-st]').textContent = kept ? (g && !res.scalar ? ', group ' + g.label : '') : ', removed by the filter';
        if (ROWS[i].sales_rs === null) {
          var c = tr.querySelector('[data-sales]');
          c.innerHTML = cfg.missing === 'fill' ? '<i>NaN</i> → ₹0' : '<i>NaN</i>';
        }
      });
    }
    function readText() {
      var g = selGroup();
      if (!g) return res.scalar ? 'With no groups there is only one number to read.' : 'Tap a group (here or in the picture) to see which rows made its number.';
      var parts = g.rows.map(function (i) {
        var raw = ROWS[i][cfg.agg];
        if (raw === null) return 'row ' + i + ' NaN' + (cfg.missing === 'fill' ? ' → ₹0' : ' (skipped)');
        return 'row ' + i + ' ' + fmtNum(raw, cfg.agg === 'sales_rs');
      });
      var t = g.label + ': the ' + FN_WORD[cfg.fn] + ' of ' + cfg.agg + ' is ' + fmtAgg(g.value, cfg) + '. Its rows: ' + parts.join(', ') + '.';
      if (cfg.fn === 'sum' && cfg.agg === 'sales_rs' && g.nan === g.rows.length && cfg.missing === 'skip') t += ' Every value is NaN, and pandas says the sum of nothing is 0.';
      var hint = taskHint(g);
      return hint ? t + ' ' + hint : t;
    }
    function renderRead() { elRead.textContent = readText(); }
    function svgLabel() {
      var t = 'Picture, ' + captionText();
      if (stage >= 2 && res.kept.length) {
        t += ' Numbers: ' + res.order.map(function (j) { var g = res.groups[j]; return g.label + ' ' + fmtAgg(g.value, cfg); }).join(', ') + '.';
      } else if (stage === 1 && res.kept.length) {
        t += ' Groups: ' + res.groups.map(function (g) { return g.label + ' with ' + g.rows.length + ' row' + (g.rows.length === 1 ? '' : 's'); }).join(', ') + '.';
      }
      svg.setAttribute('aria-label', t);
    }
    function renderControls() {
      selFcol.value = cfg.fcol;
      var str = !cfg.fcol || isKeyCol(cfg.fcol);
      var ops = str ? ['==', '!='] : OPS;
      selFop.innerHTML = ops.map(function (o) { return '<option value="' + esc(o) + '">' + esc(o) + '</option>'; }).join('');
      if (ops.indexOf(cfg.fop) < 0) cfg.fop = '==';
      selFop.value = cfg.fop;
      selFop.disabled = !cfg.fcol;
      boxFval.hidden = !str; boxFnum.hidden = str;
      if (str) {
        var vals = cfg.fcol ? PICK[cfg.fcol] : [];
        selFval.innerHTML = vals.map(function (v) { return '<option value="' + v + '">' + v + '</option>'; }).join('');
        if (cfg.fcol) selFval.value = cfg.fval;
        selFval.disabled = !cfg.fcol;
      } else if (document.activeElement !== inFnum) inFnum.value = isFinite(cfg.fnum) ? String(cfg.fnum) : '';
      if (!cfg.fcol) elFdesc.textContent = 'No filter: all 24 rows are used.';
      else if (!filterOn(cfg)) elFdesc.textContent = 'Type a number to use this filter.';
      else {
        var t = 'Keeps ' + res.kept.length + ' of 24 rows.';
        if (cfg.fcol === 'sales_rs') t += cfg.missing === 'fill' ? ' The missing sales were filled with 0 first, so they are tested as 0.' : ' A NaN fails every test except !=, which it passes.';
        elFdesc.textContent = t;
      }
      setPressed('by', String(cfg.by));
      boxKeys.hidden = cfg.by === 0;
      boxK2.hidden = cfg.by !== 2;
      selK1.value = cfg.k1;
      var others = KEY_COLS.filter(function (c) { return c !== cfg.k1; });
      if (others.indexOf(cfg.k2) < 0) cfg.k2 = others[0];
      selK2.innerHTML = others.map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');
      selK2.value = cfg.k2;
      elByDesc.textContent = cfg.by === 0 ? 'No grouping: the whole column is summarised into one number.' :
        cfg.by === 1 ? 'One group for each ' + cfg.k1 + '.' : 'One group for each ' + cfg.k1 + ' and ' + cfg.k2 + ' pair. The result has two labels per row (a MultiIndex).';
      setPressed('agg', cfg.agg);
      elAggDesc.textContent = cfg.agg === 'units' ? 'units: how many cups or snacks were sold. No values are missing.' : 'sales_rs: sales in rupees. 2 of the 24 values are missing (NaN).';
      setPressed('fn', cfg.fn);
      elFnDesc.textContent = FN_DESC[cfg.fn];
      setPressed('sort', cfg.sort);
      Array.prototype.forEach.call(btns('sort'), function (b) { b.disabled = cfg.by === 0; });
      elSortDesc.textContent = cfg.by === 0 ? 'Sorting needs groups: with no group-by the result is one number.' :
        cfg.sort === 'none' ? 'Off: groups stay in A-to-Z order of their names.' : (cfg.sort === 'asc' ? 'Smallest first.' : 'Largest first.') + ' A NaN result always goes last.';
      setPressed('na', cfg.missing);
      elNaDesc.textContent = cfg.missing === 'skip' ? 'Skip is what pandas does by default: NaN is left out of sum, mean, count, max and min.' :
        'Fill runs fillna first, putting 0 where a sale is missing. That ₹0 then counts in the mean, count and min.';
    }
    function setPressed(attr, val) { Array.prototype.forEach.call(btns(attr), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-' + attr) === val)); }); }

    /* ---------- tasks: detected from what the learner has set up ---------- */
    function cityTotals() { return res.keys.length === 1 && res.keys[0] === 'city' && cfg.agg === 'sales_rs' && cfg.fn === 'sum'; }
    function cityProduct() { return res.keys.length === 2 && sameMembers(res.keys, ['city', 'product']); }
    function taskHint(g) {
      var all = res.kept.length === N;
      if (!done.t1 && res.keys.length === 1 && res.keys[0] === 'city') {
        if (cfg.agg !== 'sales_rs') return 'For task 1: this adds up units (cups and snacks), not rupees. Switch the column to sales_rs.';
        if (cfg.fn !== 'sum') return 'For task 1: this is the ' + cfg.fn + ', not the total. Choose sum to add up every sale.';
        if (!all) return 'For task 1: your filter keeps only ' + res.kept.length + ' of 24 rows. Set the filter column to (no filter) to add up all three months.';
        var top = res.groups.reduce(function (b, x) { return !b || x.value > b.value ? x : b; }, null);
        if (g !== top) return 'For task 1: not the highest. Sort the result descending to put the biggest total on top.';
      }
      if (!done.t3 && cityProduct()) {
        if (cfg.agg !== 'sales_rs' || cfg.fn !== 'sum') return 'For task 3: choose the sum of sales_rs.';
        if (!all) return 'For task 3: remove the filter so every month counts.';
        if (g.keys.indexOf('Pune') < 0 || g.keys.indexOf('Coffee') < 0) return 'For task 3: the task asks for the Pune · Coffee group.';
      }
      return '';
    }
    function checkPickTasks(g) {
      var all = res.kept.length === N;
      if (!done.t1 && cityTotals() && all) {
        var top = res.groups.reduce(function (b, x) { return !b || x.value > b.value ? x : b; }, null);
        if (g === top) completeTask('t1', g.label + ' has the highest total sales: ' + fmtAgg(g.value, cfg) + '.');
      }
      if (!done.t3 && cityProduct() && cfg.agg === 'sales_rs' && cfg.fn === 'sum' && all && g.keys.indexOf('Pune') >= 0 && g.keys.indexOf('Coffee') >= 0) {
        completeTask('t3', 'Pune sold ' + fmtAgg(g.value, cfg) + ' of coffee. One of its two coffee rows is NaN, so this is a single month’s sales.');
      }
    }
    function checkConfigTasks() {
      if (!done.t2 && res.keys.length === 1 && res.keys[0] === 'product' && cfg.agg === 'units' && cfg.fn === 'mean' &&
          res.kept.length === 8 && res.kept.every(function (i) { return ROWS[i].month === 'Feb'; })) {
        completeTask('t2', 'In February the average units per product are ' + res.order.map(function (j) { var g = res.groups[j]; return g.label + ' ' + fmtAgg(g.value, cfg); }).join(', ') + '.');
      }
    }
    function checkMissingTask(before) {
      if (done.t4 || cfg.fn !== 'mean' || cfg.agg !== 'sales_rs') return;
      var changed = null;
      res.groups.forEach(function (g) {
        var b = before.byId[g.id];
        if (!changed && b && !(b.value === g.value || (isNaN(b.value) && isNaN(g.value)))) changed = { g: g, b: b };
      });
      if (changed) {
        var skip = cfg.missing === 'fill' ? changed.b : changed.g, fill = cfg.missing === 'fill' ? changed.g : changed.b;
        completeTask('t4', changed.g.label + ': the mean is ' + fmtAgg(skip.value, cfg) + ' when NaN is skipped and ' + fmtAgg(fill.value, cfg) + ' when it is filled with 0.');
      }
    }

    /* ---------- one update after any change ---------- */
    function update(kind) {
      res = compute(cfg);
      if (selId && (!res.byId[selId] || res.scalar)) selId = null;
      chipTexts();
      renderControls();
      renderCode();
      renderStats();
      renderResult();
      renderDf();
      renderCaption();
      renderRead();
      svgLabel();
      relayout(kind !== 'init');
      if (kind !== 'init') {
        checkConfigTasks();
        if (announceTimer) clearTimeout(announceTimer);
        announceTimer = setTimeout(function () {
          announceTimer = 0;
          if (destroyed) return;
          if (!res.kept.length) { announce('No rows pass the filter.'); return; }
          if (res.scalar) { announce('Result: one number, ' + fmtAgg(res.groups[0].value, cfg) + '.'); return; }
          var first = res.order.slice(0, 3).map(function (j) { var g = res.groups[j]; return g.label + ' ' + fmtAgg(g.value, cfg); });
          announce('Result: ' + res.groups.length + ' group' + (res.groups.length === 1 ? '' : 's') + '. ' + first.join(', ') + (res.groups.length > 3 ? ', and more.' : '.'));
        }, 900);
      }
    }
    function pick(id) {
      if (!res || !res.byId[id] || res.scalar) return;
      selId = id;
      renderCode();
      styleResultSel();
      renderDf();
      relayoutStylesOnly();
      var g = res.byId[id];
      checkPickTasks(g);
      renderRead();
    }
    function relayoutStylesOnly() {
      res.groups.forEach(function (g) {
        if (boxes[g.id]) boxStyle(boxes[g.id], g);
        if (aggs[g.id]) aggStyle(aggs[g.id], g);
      });
    }

    /* ---------- events ---------- */
    on(selFcol, 'change', function () {
      cfg.fcol = selFcol.value;
      if (cfg.fcol && isKeyCol(cfg.fcol)) { if (PICK[cfg.fcol].indexOf(cfg.fval) < 0) cfg.fval = PICK[cfg.fcol][0]; }
      else if (cfg.fcol) cfg.fnum = NUM_DEFAULT[cfg.fcol];
      update('cfg');
    });
    on(selFop, 'change', function () { cfg.fop = selFop.value; update('cfg'); });
    on(selFval, 'change', function () { cfg.fval = selFval.value; update('cfg'); });
    on(inFnum, 'input', function () {
      var v = inFnum.value.trim() === '' ? NaN : Number(inFnum.value);
      cfg.fnum = isFinite(v) ? v : NaN;
      update('cfg');
    });
    on(selK1, 'change', function () { cfg.k1 = selK1.value; update('cfg'); });
    on(selK2, 'change', function () { cfg.k2 = selK2.value; update('cfg'); });
    on(labEl.querySelector('.lab-controls'), 'click', function (ev) {
      var b = ev.target.closest('button');
      if (!b || b.disabled) return;
      if (b.hasAttribute('data-by')) { cfg.by = +b.getAttribute('data-by'); update('cfg'); }
      else if (b.hasAttribute('data-agg')) { cfg.agg = b.getAttribute('data-agg'); update('cfg'); }
      else if (b.hasAttribute('data-fn')) { cfg.fn = b.getAttribute('data-fn'); update('cfg'); }
      else if (b.hasAttribute('data-sort')) { cfg.sort = b.getAttribute('data-sort'); update('cfg'); }
      else if (b.hasAttribute('data-na')) {
        var v = b.getAttribute('data-na');
        if (v === cfg.missing) return;
        var before = res;
        cfg.missing = v;
        update('cfg');
        checkMissingTask(before);
      }
    });
    on(btnReset, 'click', function () {
      stopPlay();
      cfg = copyObj(DEFAULTS);
      selId = null;
      stage = START_STAGE;
      Array.prototype.forEach.call(stageBtns, function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-stage') === stage)); });
      update('cfg');
    });
    Array.prototype.forEach.call(stageBtns, function (b) {
      on(b, 'click', function () { stopPlay(); goStage(+b.getAttribute('data-stage'), true, true); });
    });
    on(btnPlay, 'click', function () { if (playing) { stopPlay(); announce('Stopped at ' + STAGES[stage] + '.'); } else startPlay(); });
    on(elResBody, 'click', function (ev) {
      var b = ev.target.closest('[data-pick]');
      if (b) pick(b.getAttribute('data-pick'));
    });
    on(svg, 'click', function (ev) {
      if (ev.button !== 0) return;
      var t = ev.target.closest ? ev.target.closest('[data-g]') : null;
      if (t && t.getAttribute('data-g')) pick(t.getAttribute('data-g'));
    });

    /* ---------- size, theme and fonts ---------- */
    // Colours in the picture are CSS variables, so a theme switch repaints by itself; text widths are re-measured.
    function refit() { if (destroyed) return; readFont(); relayout(false); }
    var mqDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mqDark) { if (mqDark.addEventListener) mqDark.addEventListener('change', refit); else if (mqDark.addListener) mqDark.addListener(refit); }
    on(document, 'themechange', refit);
    var fontSet = document.fonts && document.fonts.addEventListener ? document.fonts : null;
    if (fontSet) {
      on(fontSet, 'loadingdone', refit);
      if (fontSet.ready && fontSet.ready.then) fontSet.ready.then(refit, function () { /* ignore */ });
    }
    // style.css stacks the lab into one column below 820px of screen. In a narrow box on a wide screen
    // (a module page puts a sidebar beside the lab) the picture would get too small, so stack there too.
    var STACK_W = 680;
    var mqNarrow = window.matchMedia ? window.matchMedia('(max-width: 820px)') : null;
    var stacked = false;
    function wantStack() { var w = labEl.getBoundingClientRect().width; return !(mqNarrow && mqNarrow.matches) && w > 0 && w < STACK_W; }
    function placeBody() {
      layoutRaf = 0;
      if (destroyed) return;
      stacked = wantStack();
      body.style.gridTemplateColumns = stacked ? 'minmax(0, 1fr)' : '';
    }
    var curAspect = null;
    function wantAspect() { var w = wrap.getBoundingClientRect().width; return w < 520 ? '1 / 1' : w < 760 ? '4 / 3' : '16 / 10'; }
    function applyAspect() {
      aspectRaf = 0;
      if (destroyed) return;
      var a = wantAspect();
      if (a !== curAspect) { curAspect = a; wrap.style.aspectRatio = a; }
    }
    function resize() {
      if (destroyed) return;
      // changing a watched box's size inside the ResizeObserver callback would loop, so defer those changes
      if (wantAspect() !== curAspect && !aspectRaf) aspectRaf = requestAnimationFrame(function () { applyAspect(); resize(); });
      if (wantStack() !== stacked && !layoutRaf) layoutRaf = requestAnimationFrame(placeBody);
      var r = svg.getBoundingClientRect(), w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      if (w !== L.W || h !== L.H) {
        L.W = w; L.H = h;
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        // repaint straight away, in this same callback, so there is never a stretched or empty frame
        relayout(false);
      }
    }
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { resize(); }); ro.observe(wrap); ro.observe(labEl); }
    else on(window, 'resize', resize);
    if (mqNarrow) { if (mqNarrow.addEventListener) mqNarrow.addEventListener('change', placeBody); else if (mqNarrow.addListener) mqNarrow.addListener(placeBody); }

    /* ---------- start: the example question, shown at the split step ---------- */
    readFont();
    placeBody();
    applyAspect();
    Array.prototype.forEach.call(stageBtns, function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-stage') === stage)); });
    update('init');
    resize();

    return {
      destroy: function () {
        if (destroyed) return;
        destroyed = true;
        if (rafId) cancelAnimationFrame(rafId);
        if (aspectRaf) cancelAnimationFrame(aspectRaf);
        if (layoutRaf) cancelAnimationFrame(layoutRaf);
        rafId = aspectRaf = layoutRaf = 0;
        if (playTimer) clearTimeout(playTimer);
        if (announceTimer) clearTimeout(announceTimer);
        playTimer = announceTimer = 0;
        if (ro) ro.disconnect();
        if (mqDark) { if (mqDark.removeEventListener) mqDark.removeEventListener('change', refit); else if (mqDark.removeListener) mqDark.removeListener(refit); }
        if (mqNarrow) { if (mqNarrow.removeEventListener) mqNarrow.removeEventListener('change', placeBody); else if (mqNarrow.removeListener) mqNarrow.removeListener(placeBody); }
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
        listeners = [];
        // remove only this lab's own element, so a newer lab mounted into the same root survives
        if (labEl.parentNode) labEl.parentNode.removeChild(labEl);
      }
    };
  }

  Labs.groupby = {
    id: 'groupby',
    module: 'l1-numpy-pandas',
    title: 'pandas groupby: split, apply, combine',
    summary: 'Filter 24 rows of tea-shop sales, group them by city, month or product, and watch pandas split the rows, apply sum, mean, count, max or min, and combine the answers, with the exact pandas code beside it.',
    tasks: TASKS.map(function (t) { return { id: t.id, text: t.text }; }),
    mount: mount
  };
  void Engine;
})();
