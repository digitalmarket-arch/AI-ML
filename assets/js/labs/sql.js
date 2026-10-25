/* AI Marg lab: SQL JOINs, WHERE, GROUP BY and ORDER BY, drawn as two linked tables.
   The learner picks a join type, an optional WHERE filter, GROUP BY customers.city with COUNT/SUM, and ORDER BY.
   The lab writes the SQL, links matching rows with lines, highlights rows with no partner, adds the made-up
   NULL rows an outer join creates, and shows the result with every NULL spelled out.
   Results follow real SQL rules: three-valued logic for NULL in WHERE, COUNT(column) skipping NULLs, SUM of only
   NULLs giving NULL, and SQLite's sort order for NULL (smallest value). Checked against python3's sqlite3.
   Plain classic script (ES2019). Registers window.AILabs.sql. No libraries, no network, no storage. */
(function () {
  'use strict';
  var Labs = (window.AILabs = window.AILabs || {});
  var mountCount = 0;
  var SVGNS = 'http://www.w3.org/2000/svg';

  /* ---------- data: a small online shop ---------- */
  var CUSTOMERS = [
    { customer_id: 1, name: 'Asha', city: 'Pune' },
    { customer_id: 2, name: 'Ravi', city: 'Mumbai' },
    { customer_id: 3, name: 'Meera', city: 'Pune' },
    { customer_id: 4, name: 'Kabir', city: 'Delhi' },
    { customer_id: 5, name: 'Priya', city: 'Bengaluru' },
    { customer_id: 6, name: 'Arjun', city: 'Mumbai' },
    { customer_id: 7, name: 'Sana', city: 'Jaipur' }
  ];
  var ORDERS = [
    { order_id: 101, customer_id: 1, amount_rs: 450, order_date: '2025-01-05' },
    { order_id: 102, customer_id: 2, amount_rs: 1200, order_date: '2025-01-07' },
    { order_id: 103, customer_id: 1, amount_rs: 800, order_date: '2025-01-12' },
    { order_id: 104, customer_id: 4, amount_rs: 300, order_date: '2025-01-15' },
    { order_id: 105, customer_id: 5, amount_rs: 2500, order_date: '2025-01-20' },
    { order_id: 106, customer_id: 2, amount_rs: 650, order_date: '2025-01-22' },
    { order_id: 107, customer_id: 9, amount_rs: 999, order_date: '2025-01-25' },  // customer 9 does not exist
    { order_id: 108, customer_id: 6, amount_rs: 150, order_date: '2025-02-02' },
    { order_id: 109, customer_id: 4, amount_rs: 1750, order_date: '2025-02-05' }
  ];

  // which rows match which (worked out once; the tables never change)
  var ORD_OF = CUSTOMERS.map(function (c) {
    var r = [];
    for (var j = 0; j < ORDERS.length; j++) if (ORDERS[j].customer_id === c.customer_id) r.push(j);
    return r;
  });
  var CUST_OF = ORDERS.map(function (o) {
    var r = [];
    for (var i = 0; i < CUSTOMERS.length; i++) if (CUSTOMERS[i].customer_id === o.customer_id) r.push(i);
    return r;
  });
  var NO_ORDERS = [], NO_CUSTOMER = [];
  ORD_OF.forEach(function (m, i) { if (!m.length) NO_ORDERS.push(i); });
  CUST_OF.forEach(function (m, j) { if (!m.length) NO_CUSTOMER.push(j); });
  var MATCHES = 0;
  ORD_OF.forEach(function (m) { MATCHES += m.length; });
  // the diagram always keeps room for the made-up NULL rows, so its height never jumps
  var MAX_ROWS = Math.max(CUSTOMERS.length + NO_CUSTOMER.length, ORDERS.length + NO_ORDERS.length);

  /* ---------- the query parts the learner can pick ---------- */
  var JOINS = [
    { id: 'INNER', sql: 'INNER JOIN', label: 'INNER' },
    { id: 'LEFT', sql: 'LEFT JOIN', label: 'LEFT' },
    { id: 'RIGHT', sql: 'RIGHT JOIN', label: 'RIGHT' },
    { id: 'FULL', sql: 'FULL OUTER JOIN', label: 'FULL OUTER' }
  ];
  var JOIN_KEEPS = { INNER: { M: 1 }, LEFT: { L: 1, M: 1 }, RIGHT: { M: 1, R: 1 }, FULL: { L: 1, M: 1, R: 1 } };
  var WHERES = [
    { id: 'none', sql: '', label: 'No WHERE filter' },
    { id: 'oid_null', sql: 'orders.order_id IS NULL', label: 'orders.order_id IS NULL' },
    { id: 'cid_null', sql: 'customers.customer_id IS NULL', label: 'customers.customer_id IS NULL' },
    { id: 'amt_gt', sql: 'orders.amount_rs > 500', label: 'orders.amount_rs > 500' },
    { id: 'city_pune', sql: "customers.city = 'Pune'", label: "customers.city = 'Pune'" }
  ];
  var AGGS = [
    { id: 'n_rows', expr: 'COUNT(*)', help: 'counts rows, NULL rows too' },
    { id: 'n_orders', expr: 'COUNT(orders.order_id)', help: 'counts only rows where order_id is not NULL' },
    { id: 'total_rs', expr: 'SUM(orders.amount_rs)', help: 'adds up amounts, skipping NULLs' }
  ];
  var ORDER_UNGROUPED = [
    { id: 'amt_desc', label: 'orders.amount_rs DESC: biggest first', sql: 'orders.amount_rs DESC, customers.name', keys: [{ f: 'amount', desc: true }, { f: 'name' }] },
    { id: 'name_asc', label: 'customers.name: A to Z', sql: 'customers.name, orders.order_id', keys: [{ f: 'name' }, { f: 'order_id' }] }
  ];
  var ORDER_GROUPED = [
    { id: 'city_asc', label: 'customers.city: A to Z', sql: 'customers.city', keys: [{ f: 'city' }] },
    { id: 'n_rows_desc', need: 'n_rows', label: 'n_rows DESC: most rows first', sql: 'n_rows DESC, customers.city', keys: [{ f: 'n_rows', desc: true }, { f: 'city' }] },
    { id: 'n_orders_desc', need: 'n_orders', label: 'n_orders DESC: most orders first', sql: 'n_orders DESC, customers.city', keys: [{ f: 'n_orders', desc: true }, { f: 'city' }] },
    { id: 'total_desc', need: 'total_rs', label: 'total_rs DESC: biggest total first', sql: 'total_rs DESC, customers.city', keys: [{ f: 'total_rs', desc: true }, { f: 'city' }] }
  ];
  var UNGROUPED_COLS = [
    { t: 'customers', n: 'customer_id', kind: 'num' },
    { t: 'customers', n: 'name' },
    { t: 'customers', n: 'city' },
    { t: 'orders', n: 'order_id', kind: 'num' },
    { t: 'orders', n: 'customer_id', kind: 'num' },
    { t: 'orders', n: 'amount_rs', kind: 'money' }
  ];
  var DEFAULT_STATE = { join: 'INNER', where: 'none', group: 'none', aggs: { n_rows: true, n_orders: false, total_rs: false }, order: 'none' };

  var TASKS = [
    { id: 't1', text: 'Find the customers who never ordered: use a LEFT JOIN with WHERE orders.order_id IS NULL, so only those customers are left in the result.' },
    { id: 't2', text: 'Find the order whose customer is missing: use a RIGHT JOIN plus a WHERE filter, so the result shows only that one order.' },
    { id: 't3', text: 'Count the orders in every city with GROUP BY customers.city, so that every city, Jaipur included, shows its true number of orders (Jaipur has 0).' },
    { id: 't4', text: 'After a LEFT JOIN grouped by city, tick both COUNT(*) and COUNT(orders.order_id) and find the cities where the two counts differ.' }
  ];

  /* ---------- small helpers ---------- */
  // Indian digit grouping: 1,25,000
  function fmtIN(n) {
    var neg = n < 0, s = String(Math.abs(Math.round(n)));
    if (s.length > 3) s = s.slice(0, -3).replace(/\B(?=(\d{2})+$)/g, ',') + ',' + s.slice(-3);
    return (neg ? '−' : '') + s;
  }
  function rupees(n) { return '₹' + fmtIN(n); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function listAnd(a) { return a.length <= 1 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  function plural(n, one, many) { return fmtIN(n) + ' ' + (n === 1 ? one : (many || one + 's')); }
  function isNull(v) { return v === null || v === undefined; }
  function findBy(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }

  /* ---------- the SQL engine (tiny, but with real SQL rules) ---------- */
  // Each joined row is a pair: ci = customer index, oi = order index, -1 = the made-up all-NULL row of an outer join.
  // kind: M = a real match, L = customer with no order, R = order with no customer.
  function doJoin(type) {
    var pairs = [], i, j, m;
    if (type === 'RIGHT') {
      for (j = 0; j < ORDERS.length; j++) {
        m = CUST_OF[j];
        if (m.length) for (i = 0; i < m.length; i++) pairs.push({ ci: m[i], oi: j, kind: 'M' });
        else pairs.push({ ci: -1, oi: j, kind: 'R' });
      }
      return pairs;
    }
    for (i = 0; i < CUSTOMERS.length; i++) {
      m = ORD_OF[i];
      if (m.length) for (j = 0; j < m.length; j++) pairs.push({ ci: i, oi: m[j], kind: 'M' });
      else if (type === 'LEFT' || type === 'FULL') pairs.push({ ci: i, oi: -1, kind: 'L' });
    }
    if (type === 'FULL') for (j = 0; j < ORDERS.length; j++) if (!CUST_OF[j].length) pairs.push({ ci: -1, oi: j, kind: 'R' });
    return pairs;
  }
  function cv(p, k) { return p.ci < 0 ? null : CUSTOMERS[p.ci][k]; }
  function ov(p, k) { return p.oi < 0 ? null : ORDERS[p.oi][k]; }
  // SQL's three-valued logic: a test is true, false, or null ("unknown"). WHERE keeps a row only when it is true.
  function whereTest(w, p) {
    var v;
    switch (w) {
      case 'oid_null': return ov(p, 'order_id') === null;
      case 'cid_null': return cv(p, 'customer_id') === null;
      case 'amt_gt': v = ov(p, 'amount_rs'); return v === null ? null : v > 500;
      case 'city_pune': v = cv(p, 'city'); return v === null ? null : v === 'Pune';
      default: return true;
    }
  }
  // SQLite's order: NULL is smaller than every value, so NULLs come first with ASC and last with DESC.
  function cmpVal(a, b) {
    if (isNull(a)) return isNull(b) ? 0 : -1;
    if (isNull(b)) return 1;
    return a < b ? -1 : a > b ? 1 : 0;
  }
  function orderOptions(S) {
    if (S.group !== 'city') return ORDER_UNGROUPED;
    return ORDER_GROUPED.filter(function (o) { return !o.need || S.aggs[o.need]; });
  }
  function orderSpec(S) { return S.order === 'none' ? null : findBy(orderOptions(S), S.order); }

  function runQuery(S) {
    var pairs = doJoin(S.join), kept = [], surv = [], i;
    var produced = { L: 0, M: 0, R: 0 }, keptBy = { L: 0, M: 0, R: 0 };
    for (i = 0; i < pairs.length; i++) {
      var ok = whereTest(S.where, pairs[i]) === true;
      kept.push(ok);
      produced[pairs[i].kind]++;
      if (ok) { surv.push(i); keptBy[pairs[i].kind]++; }
    }
    var Q = { pairs: pairs, kept: kept, nJoin: pairs.length, nWhere: surv.length, produced: produced, keptBy: keptBy, grouped: S.group === 'city' };
    var rows, cols;
    if (!Q.grouped) {
      cols = UNGROUPED_COLS;
      rows = surv.map(function (pi) {
        var p = pairs[pi];
        return {
          pairs: [pi],
          cells: [cv(p, 'customer_id'), cv(p, 'name'), cv(p, 'city'), ov(p, 'order_id'), ov(p, 'customer_id'), ov(p, 'amount_rs')],
          v: { name: cv(p, 'name'), amount: ov(p, 'amount_rs'), order_id: ov(p, 'order_id') }
        };
      });
    } else {
      // GROUP BY puts every NULL city into one group, like real SQL does
      var groups = [], byKey = {};
      surv.forEach(function (pi) {
        var city = cv(pairs[pi], 'city'), key = city === null ? '\u0000null' : 'k' + city;
        var g = byKey[key];
        if (!g) { g = byKey[key] = { city: city, pairs: [] }; groups.push(g); }
        g.pairs.push(pi);
      });
      cols = [{ t: 'customers', n: 'city', expr: 'customers.city' }];
      AGGS.forEach(function (a) { if (S.aggs[a.id]) cols.push({ n: a.id, expr: a.expr, kind: a.id === 'total_rs' ? 'money' : 'num' }); });
      rows = groups.map(function (g) {
        var nOrd = 0, sum = null;
        g.pairs.forEach(function (pi) {
          var p = pairs[pi], a = ov(p, 'amount_rs');
          if (ov(p, 'order_id') !== null) nOrd++;           // COUNT(column) skips NULLs
          if (a !== null) sum = (sum === null ? 0 : sum) + a;  // SUM skips NULLs; only NULLs gives NULL, not 0
        });
        var v = { city: g.city, n_rows: g.pairs.length, n_orders: nOrd, total_rs: sum };
        var cells = [g.city];
        AGGS.forEach(function (a) { if (S.aggs[a.id]) cells.push(v[a.id]); });
        return { pairs: g.pairs, cells: cells, v: v };
      });
    }
    var ord = orderSpec(S);
    if (ord) {
      // Array.prototype.sort is stable (ES2019); the second key in each ORDER BY breaks every tie anyway
      rows.sort(function (r1, r2) {
        for (var k = 0; k < ord.keys.length; k++) {
          var c = cmpVal(r1.v[ord.keys[k].f], r2.v[ord.keys[k].f]);
          if (c) return ord.keys[k].desc ? -c : c;
        }
        return 0;
      });
    }
    Q.cols = cols; Q.rows = rows; Q.order = ord;
    return Q;
  }

  /* ---------- the SQL text ---------- */
  // narrow = the box is too thin for 47 characters, so long lines are broken (still the same, valid SQL)
  var SQL_WIDE_CHARS = 47;
  function sqlLines(S, narrow) {
    var L = [];
    function selectList(cols) { cols.forEach(function (s, i) { L.push({ cl: 'select', t: (i ? '       ' : 'SELECT ') + s + (i < cols.length - 1 ? ',' : '') }); }); }
    if (S.group === 'city') {
      var sel = ['customers.city'];
      AGGS.forEach(function (a) { if (S.aggs[a.id]) sel.push(a.expr + ' AS ' + a.id); });
      selectList(sel);
    } else if (narrow) {
      selectList(['customers.customer_id', 'customers.name', 'customers.city', 'orders.order_id', 'orders.customer_id', 'orders.amount_rs']);
    } else {
      L.push({ cl: 'select', t: 'SELECT customers.customer_id, customers.name,' });
      L.push({ cl: 'select', t: '       customers.city, orders.order_id,' });
      L.push({ cl: 'select', t: '       orders.customer_id, orders.amount_rs' });
    }
    L.push({ cl: 'from', t: 'FROM customers' });
    L.push({ cl: 'join', t: findBy(JOINS, S.join).sql + ' orders' });
    if (narrow) {
      L.push({ cl: 'join', t: '  ON customers.customer_id' });
      L.push({ cl: 'join', t: '   = orders.customer_id' });
    } else L.push({ cl: 'join', t: '  ON customers.customer_id = orders.customer_id' });
    if (S.where !== 'none') L.push({ cl: 'where', t: 'WHERE ' + findBy(WHERES, S.where).sql });
    if (S.group === 'city') L.push({ cl: 'group', t: 'GROUP BY customers.city' });
    var o = orderSpec(S);
    if (o) {
      var ob = 'ORDER BY ' + o.sql, cut = ob.indexOf(', ');
      if (narrow && ob.length > 40 && cut > 0) {
        L.push({ cl: 'order', t: ob.slice(0, cut + 1) });
        L.push({ cl: 'order', t: '         ' + ob.slice(cut + 2) });
      } else L.push({ cl: 'order', t: ob });
    }
    L[L.length - 1].t += ';';
    return L;
  }
  var KW = /\b(SELECT|FROM|INNER JOIN|LEFT JOIN|RIGHT JOIN|FULL OUTER JOIN|ON|WHERE|IS NULL|GROUP BY|ORDER BY|AS|DESC|COUNT|SUM)\b/g;
  function sqlHtml(t) { return esc(t).replace(KW, '<b style="color:var(--indigo)">$1</b>'); }

  /* ---------- text measuring for the table diagram ---------- */
  var measureCtx = null;
  function textW(s, size, bold, fam) {
    if (measureCtx === null) {
      try { measureCtx = document.createElement('canvas').getContext('2d') || false; } catch (e) { measureCtx = false; }
    }
    if (!measureCtx) return s.length * size * 0.62;
    measureCtx.font = (bold ? '700 ' : '400 ') + size + 'px ' + fam;
    return measureCtx.measureText(s).width;
  }
  // three layouts, from roomy to phone-sized; the first that fits the box wins
  var MODES = [
    { name: 'full', vf: 13, hf: 11.5, split: false, date: true, pad: 8, gap: 60, gapMax: 130, rowH: 26, headH: 26, titleF: 13.5, m: 10 },
    { name: 'mid', vf: 12, hf: 11, split: false, date: false, pad: 6, gap: 44, gapMax: 90, rowH: 25, headH: 25, titleF: 13, m: 6 },
    { name: 'compact', vf: 11, hf: 9.5, split: true, date: false, pad: 4, gap: 28, gapMax: 60, rowH: 24, headH: 30, titleF: 12.5, m: 2 }
  ];
  function headParts(name, split) {
    if (!split) return [name];
    var i = name.indexOf('_');
    return i < 0 ? [name] : [name.slice(0, i + 1), name.slice(i + 1)];
  }
  function diagCols(side, M) {
    if (side === 'c') return [{ k: 'customer_id', num: true }, { k: 'name' }, { k: 'city' }];
    var c = [{ k: 'order_id', num: true }, { k: 'customer_id', num: true }, { k: 'amount_rs', num: true, money: true }];
    if (M.date) c.push({ k: 'order_date' });
    return c;
  }
  function diagCell(row, col) {
    var v = row[col.k];
    return col.money ? rupees(v) : String(v);
  }

  /* ---------- mount ---------- */
  function mount(root, ctx) {
    var P = 'sql' + (++mountCount) + '-';
    var listeners = [];
    function on(el, type, fn, opts) { el.addEventListener(type, fn, opts); listeners.push([el, type, fn, opts]); }
    var destroyed = false;

    var tasksHtml = TASKS.map(function (t) { return '<li data-task="' + t.id + '">' + esc(t.text) + '</li>'; }).join('');
    function swatch(inner) {
      return '<svg width="30" height="14" viewBox="0 0 30 14" aria-hidden="true" focusable="false" style="flex:none;display:block">' + inner + '</svg>';
    }
    function legendItem(sw, text) { return '<span style="display:inline-flex;align-items:center;gap:6px">' + sw + '<span>' + text + '</span></span>'; }
    var legendHtml =
      '<div class="small muted" style="display:flex;flex-wrap:wrap;gap:6px 16px">' +
        legendItem(swatch('<path d="M1 7 H29" style="stroke:var(--indigo);stroke-width:2"/><circle cx="2.5" cy="7" r="2.5" style="fill:var(--indigo)"/><circle cx="27.5" cy="7" r="2.5" style="fill:var(--indigo)"/>'), 'Match, kept') +
        legendItem(swatch('<path d="M1 7 H29" style="stroke:var(--muted);stroke-width:1.5;stroke-dasharray:4 3"/>'), 'Match, removed by WHERE') +
        legendItem(swatch('<rect x="1" y="1" width="28" height="12" rx="2" style="fill:var(--haldi-soft);stroke:var(--line)"/><rect x="1" y="1" width="3" height="12" style="fill:var(--haldi)"/>'), 'No partner in the other table') +
        legendItem(swatch('<rect x="1" y="1" width="28" height="12" rx="2" style="fill:var(--surface-2);stroke:var(--muted);stroke-dasharray:3 2"/>'), 'All-NULL row made up by an outer join') +
        legendItem(swatch('<rect x="1" y="1" width="28" height="12" rx="2" style="fill:var(--surface);stroke:var(--line)"/><path d="M3 7 H27" style="stroke:var(--bad);stroke-width:1.5"/>'), 'Not used in the result') +
      '</div>';

    var top = document.createElement('div');
    top.className = 'lab';
    top.innerHTML =
      '<p class="lab-note"><strong>What you are seeing:</strong> two small tables from an online shop. <code>customers</code> lists 7 people and their cities; <code>orders</code> lists 9 orders, each with the <code>customer_id</code> of the person who placed it. ' +
        'A <em>JOIN</em> glues each order to its customer wherever <code>customer_id</code> is the same (the lines). Yellow rows have no partner: Meera and Sana never ordered, and order 107 points at customer 9, who is not in the table. ' +
        'Pick a join type, add a WHERE filter, GROUP BY or ORDER BY, and watch the SQL and the result change. <em>NULL</em> means “no value here”: not 0, and not empty text.</p>' +
      '<div class="lab-body">' +
        '<div class="stack">' +
          '<div class="stack-sm">' +
            '<h2 class="lab-h">The SQL query</h2>' +
            '<pre id="' + P + 'sql" aria-label="SQL query" style="font-size:.8rem;line-height:1.55;padding:10px 12px"></pre>' +
            '<div class="lab-stats" style="grid-template-columns:repeat(auto-fit,minmax(120px,1fr))">' +
              '<div class="stat"><div class="k">1 · JOIN</div><div class="v" id="' + P + 'sjoin">—</div></div>' +
              '<div class="stat"><div class="k">2 · WHERE</div><div class="v" id="' + P + 'swhere">—</div></div>' +
              '<div class="stat"><div class="k">3 · GROUP BY</div><div class="v" id="' + P + 'sgroup">—</div></div>' +
              '<div class="stat"><div class="k">Result</div><div class="v" id="' + P + 'sres">—</div></div>' +
            '</div>' +
            '<p class="small muted">SQL does not run top to bottom. It does FROM and JOIN first, then WHERE, then GROUP BY, then picks the SELECT columns, and sorts with ORDER BY last.</p>' +
          '</div>' +
          '<div class="stack-sm">' +
            '<h2 class="lab-h">The two tables, matched on customer_id</h2>' +
            '<div class="lab-canvas-wrap" id="' + P + 'wrap" style="aspect-ratio:auto;overflow-x:auto;overflow-y:hidden">' +
              '<svg id="' + P + 'svg" xmlns="' + SVGNS + '" role="img" aria-label="The customers and orders tables" style="position:static;display:block;max-width:none;touch-action:auto;font-family:var(--font-mono)"></svg>' +
            '</div>' +
            '<p class="small muted" id="' + P + 'datenote" hidden>To fit your screen, the <code>order_date</code> column of <code>orders</code> is not drawn. It is not used in this query.</p>' +
            legendHtml +
            '<p class="small muted">Tap or hover over any row to trace it: its lines and the result rows it ends up in light up. Tap again to let go.</p>' +
          '</div>' +
          '<div class="stack-sm">' +
            '<h2 class="lab-h" id="' + P + 'reshead">Result</h2>' +
            '<div class="table-wrap" id="' + P + 'reswrap" aria-labelledby="' + P + 'reshead" style="border:1px solid var(--line);border-radius:var(--radius);background:var(--surface)"></div>' +
            '<p class="small muted" id="' + P + 'resnote"></p>' +
            '<p class="kbd-hint">Keyboard: press Tab to move through the result rows; each one lights up the rows it came from.</p>' +
          '</div>' +
        '</div>' +
        '<div class="lab-controls">' +
          '<div class="control"><span class="control-label" id="' + P + 'joinlbl">JOIN type</span>' +
            '<div class="seg" role="group" aria-labelledby="' + P + 'joinlbl">' +
              JOINS.map(function (j) { return '<button type="button" data-join="' + j.id + '" aria-pressed="false" style="padding:6px 9px">' + j.label + '</button>'; }).join('') +
            '</div>' +
            '<div style="display:grid;grid-template-columns:132px minmax(0,1fr);gap:10px;align-items:center;margin-top:6px">' +
              '<svg id="' + P + 'venn" width="132" height="84" viewBox="0 0 160 92" role="img" aria-label="Venn diagram" style="display:block;max-width:100%;height:auto"></svg>' +
              '<p class="small" id="' + P + 'venncap" style="margin:0"></p>' +
            '</div>' +
            '<p class="small muted">Dark shading: all of these rows reach the result. Light: only some do (WHERE removed the rest).</p>' +
          '</div>' +
          '<div class="control"><label for="' + P + 'where">WHERE filter (runs after the JOIN)</label>' +
            '<select id="' + P + 'where">' + WHERES.map(function (w) { return '<option value="' + w.id + '">' + esc(w.label) + '</option>'; }).join('') + '</select>' +
            '<p class="small muted">WHERE keeps only the joined rows where the test is true.</p></div>' +
          '<div class="control"><label for="' + P + 'group">GROUP BY</label>' +
            '<select id="' + P + 'group"><option value="none">No GROUP BY</option><option value="city">GROUP BY customers.city</option></select>' +
            '<fieldset id="' + P + 'aggs" hidden style="border:1px solid var(--line);border-radius:var(--radius-sm);padding:6px 10px 10px;margin:6px 0 0;min-width:0">' +
              '<legend class="small" style="font-weight:600;padding:0 4px">Work out for each city</legend>' +
              '<div class="small" style="display:grid;grid-template-columns:20px minmax(0,1fr);gap:8px;align-items:start">' +
                AGGS.map(function (a) {
                  return '<input type="checkbox" id="' + P + 'agg-' + a.id + '" data-agg="' + a.id + '" style="margin:3px 0 0">' +
                    '<label for="' + P + 'agg-' + a.id + '"><code>' + esc(a.expr) + '</code> as <code>' + a.id + '</code>: ' + esc(a.help) + '</label>';
                }).join('') +
              '</div>' +
            '</fieldset>' +
            '<p class="small muted">GROUP BY squashes the rows into one row per city; COUNT and SUM then work inside each city.</p></div>' +
          '<div class="control"><label for="' + P + 'order">ORDER BY</label>' +
            '<select id="' + P + 'order"></select>' +
            '<p class="small muted">ORDER BY sorts the final result. The second column after the comma breaks ties.</p></div>' +
          '<button type="button" class="btn btn-sm" id="' + P + 'reset" style="align-self:flex-start">Reset the query</button>' +
          '<div class="callout callout-indigo small" id="' + P + 'msg" role="status" aria-live="polite" style="min-height:4.5em"></div>' +
          '<div class="stack-sm"><h2 class="lab-h">Your tasks</h2><ul class="lab-tasks" id="' + P + 'tasks">' + tasksHtml + '</ul></div>' +
        '</div>' +
      '</div>' +
      '<p class="small muted"><strong style="color:var(--ink)">Why it matters in real ML:</strong> training data is rarely one tidy table. Before training a model you JOIN purchases to customers and GROUP BY to build features such as “orders per customer”. Pick the wrong join or the wrong COUNT and customers with no orders silently vanish, or get counted as 1, and the model learns from wrong numbers.</p>';
    root.appendChild(top);

    function $(id) { return top.querySelector('#' + P + id); }
    var elSql = $('sql'), elWrap = $('wrap'), svg = $('svg'), elVenn = $('venn'), elVennCap = $('venncap');
    var elResWrap = $('reswrap'), elResHead = $('reshead'), elResNote = $('resnote'), elDateNote = $('datenote');
    var elWhere = $('where'), elGroup = $('group'), elAggs = $('aggs'), elOrder = $('order'), elReset = $('reset'), elMsg = $('msg');
    var elSJoin = $('sjoin'), elSWhere = $('swhere'), elSGroup = $('sgroup'), elSRes = $('sres');
    var joinBtns = top.querySelectorAll('[data-join]');
    var aggBoxes = top.querySelectorAll('[data-agg]');
    var taskEls = {};
    Array.prototype.forEach.call(top.querySelectorAll('[data-task]'), function (li) { taskEls[li.getAttribute('data-task')] = li; });

    /* ---------- state ---------- */
    function copyState(s) { return { join: s.join, where: s.where, group: s.group, aggs: { n_rows: s.aggs.n_rows, n_orders: s.aggs.n_orders, total_rs: s.aggs.total_rs }, order: s.order }; }
    var S = copyState(DEFAULT_STATE);
    var Q = runQuery(S);
    var changed = {};          // which SQL clauses the last change touched (they get a highlight)
    var lay = null, layW = -1; // diagram layout for the current box width
    var hoverDiag = null, hoverRes = null, focusRes = null, pinned = null;
    var rafId = 0, needDiag = false;
    var resTrs = [];
    var done = {};

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
      if (done[id]) return false;
      done[id] = true;
      markLi(id);
      if (ctx && ctx.onTaskDone) ctx.onTaskDone(id);
      return true;
    }
    // expected orders per city, worked out straight from the tables (used by task 3)
    var CITY_ORDERS = {};
    CUSTOMERS.forEach(function (c, ci) { CITY_ORDERS[c.city] = (CITY_ORDERS[c.city] || 0) + ORD_OF[ci].length; });
    function checkTasks() {
      var fired = [];
      var rows = Q.rows;
      if (!Q.grouped) {
        // t1: exactly the customers with no orders, each paired with NULL
        if (rows.length === NO_ORDERS.length && rows.every(function (r) { var p = Q.pairs[r.pairs[0]]; return p.ci >= 0 && p.oi < 0; })) {
          if (completeTask('t1')) fired.push('t1');
        }
        // t2: exactly the orders whose customer is missing
        if (rows.length === NO_CUSTOMER.length && rows.every(function (r) { var p = Q.pairs[r.pairs[0]]; return p.ci < 0 && p.oi >= 0; })) {
          if (completeTask('t2')) fired.push('t2');
        }
      } else {
        // t3: COUNT(orders.order_id) per city, and every city present with its true count (a NULL-city group may be extra)
        if (S.aggs.n_orders) {
          var seen = 0, allRight = true;
          rows.forEach(function (r) {
            if (r.v.city === null) return;
            seen++;
            if (r.v.n_orders !== CITY_ORDERS[r.v.city]) allRight = false;
          });
          if (allRight && seen === Object.keys(CITY_ORDERS).length) { if (completeTask('t3')) fired.push('t3'); }
        }
        // t4: both counts shown and at least one city where they differ (only an outer join can make that happen)
        if (S.aggs.n_rows && S.aggs.n_orders && (S.join === 'LEFT' || S.join === 'FULL') &&
            rows.some(function (r) { return r.v.n_rows !== r.v.n_orders; })) {
          if (completeTask('t4')) fired.push('t4');
        }
      }
      return fired;
    }

    /* ---------- words ---------- */
    function custNames(list) { return list.map(function (ci) { return CUSTOMERS[ci].name; }); }
    function orderIds(list) { return list.map(function (oi) { return 'order ' + ORDERS[oi].order_id; }); }
    function joinText() {
      var nm = listAnd(custNames(NO_ORDERS)), od = listAnd(orderIds(NO_CUSTOMER));
      var bad = NO_CUSTOMER.length ? ORDERS[NO_CUSTOMER[0]].customer_id : '';
      switch (S.join) {
        case 'INNER': return '<b>INNER JOIN</b> keeps only pairs whose <code>customer_id</code> matches: <b>' + plural(Q.nJoin, 'row') + '</b>. ' + nm + ' (no orders) and ' + od + ' (customer ' + bad + ' does not exist) are left out.';
        case 'LEFT': return '<b>LEFT JOIN</b> keeps every customer (the left table): <b>' + plural(Q.nJoin, 'row') + '</b>. ' + nm + ' have no orders, so their <code>orders</code> columns are filled with NULL. ' + od.charAt(0).toUpperCase() + od.slice(1) + ' is left out.';
        case 'RIGHT': return '<b>RIGHT JOIN</b> keeps every order (the right table): <b>' + plural(Q.nJoin, 'row') + '</b>. ' + od.charAt(0).toUpperCase() + od.slice(1) + ' has customer_id ' + bad + ', who is not in <code>customers</code>, so its customer columns are NULL. ' + nm + ' are left out.';
        default: return '<b>FULL OUTER JOIN</b> keeps every row of both tables: <b>' + plural(Q.nJoin, 'row') + '</b> (' + MATCHES + ' matches, ' + nm + ' with NULL orders, and ' + od + ' with a NULL customer).';
      }
    }
    function whereText() {
      var n = Q.nWhere, m = Q.nJoin;
      switch (S.where) {
        case 'none': return 'No WHERE filter: all ' + plural(m, 'joined row') + ' go on to the next step.';
        case 'oid_null':
          if (!n) return '<b>WHERE orders.order_id IS NULL</b> leaves <b>0 rows</b>: this join never fills <code>order_id</code> with NULL, because every row it keeps has a real order.';
          return '<b>WHERE orders.order_id IS NULL</b> keeps only the rows with no order: <b>' + plural(n, 'row') + '</b>' + (Q.keptBy.L === n ? ', the customers who never ordered.' : '.');
        case 'cid_null':
          if (!n) return '<b>WHERE customers.customer_id IS NULL</b> leaves <b>0 rows</b>: this join never fills <code>customer_id</code> with NULL, because every row it keeps has a real customer.';
          return '<b>WHERE customers.customer_id IS NULL</b> keeps only the rows with no customer: <b>' + plural(n, 'row') + '</b>' + (Q.keptBy.R === n ? ', the order' + (n === 1 ? '' : 's') + ' whose customer is missing.' : '.');
        case 'amt_gt': {
          var s = '<b>WHERE orders.amount_rs &gt; 500</b> keeps <b>' + fmtIN(n) + ' of ' + plural(m, 'row') + '</b>.';
          if (Q.produced.L && !Q.keptBy.L) s += ' The NULL rows of ' + listAnd(custNames(NO_ORDERS)) + ' are dropped too: NULL &gt; 500 is not true but <em>unknown</em>, and WHERE keeps only true. (To keep them, the test would have to move into the ON part of the JOIN.)';
          return s;
        }
        default: {
          var t = '<b>WHERE customers.city = \'Pune\'</b> keeps <b>' + fmtIN(n) + ' of ' + plural(m, 'row') + '</b>.';
          if (Q.produced.R && !Q.keptBy.R) t += ' ' + listAnd(orderIds(NO_CUSTOMER)).replace(/^o/, 'O') + ' has a NULL city, and NULL = \'Pune\' is <em>unknown</em>, not true, so it is dropped.';
          return t;
        }
      }
    }
    function groupText() {
      if (!Q.grouped) return 'No GROUP BY: the result has one row for each joined row that passed WHERE.';
      var s = '<b>GROUP BY customers.city</b> squashes ' + plural(Q.nWhere, 'row') + ' into <b>' + plural(Q.rows.length, 'group') + '</b>, one per city.';
      if (Q.rows.some(function (r) { return r.v.city === null; })) s += ' A row with no customer has a NULL city, and all NULL cities share one NULL group.';
      var diff = null;
      Q.rows.forEach(function (r) { if (!diff && r.v.n_rows !== r.v.n_orders && r.v.city !== null) diff = r; });
      if (S.aggs.n_rows && S.aggs.n_orders && diff) {
        s += ' Look where <code>n_rows</code> and <code>n_orders</code> differ: COUNT(*) counts every row, but COUNT(orders.order_id) skips NULLs (' + esc(diff.v.city) + ': ' + plural(diff.v.n_rows, 'row') + ', ' + plural(diff.v.n_orders, 'order') + ').';
      } else if (S.aggs.n_rows && !S.aggs.n_orders && diff) {
        s += ' Careful: COUNT(*) counts the NULL rows too, so ' + esc(diff.v.city) + ' shows ' + fmtIN(diff.v.n_rows) + ' but has only ' + plural(diff.v.n_orders, 'order') + '.';
      }
      if (S.aggs.total_rs) {
        var nul = Q.rows.filter(function (r) { return r.v.total_rs === null && r.v.city !== null; });
        if (nul.length) s += ' SUM over only NULLs gives NULL, not 0 (' + esc(nul[0].v.city) + '). Reports often write COALESCE(SUM(orders.amount_rs), 0) to show 0 instead.';
      }
      if (!S.aggs.n_rows && !S.aggs.n_orders && !S.aggs.total_rs) s += ' With nothing ticked to work out, it simply lists each city once.';
      return s;
    }
    function orderText() {
      var o = Q.order;
      if (!o) return 'No ORDER BY: SQL promises no particular order, so never rely on it. Here rows simply follow the tables.';
      var s = '<b>ORDER BY ' + esc(o.sql) + '</b> runs last and sorts the result.';
      var first = o.keys[0].f, hasNull = Q.rows.some(function (r) { return isNull(r.v[first]); });
      if (hasNull) s += ' NULL counts as the smallest value here (as in SQLite, the database built into Python), so NULLs come first in A to Z order and last with DESC. PostgreSQL does the opposite.';
      return s;
    }
    function say(html) { elMsg.innerHTML = html; }

    /* ---------- rendering: SQL, stats, Venn, result ---------- */
    var sqlNarrow = false;
    function wantNarrowSql() {
      var fs = parseFloat(getComputedStyle(elSql).fontSize) || 12.8;
      var cw = textW('0', fs, false, getComputedStyle(elSql).fontFamily || 'monospace');
      var cs = getComputedStyle(elSql), inner = elSql.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
      return inner > 0 && inner < SQL_WIDE_CHARS * cw;
    }
    function renderSql() {
      sqlNarrow = wantNarrowSql();
      var lines = sqlLines(S, sqlNarrow);
      elSql.innerHTML = lines.map(function (l) {
        var hl = changed[l.cl];
        return '<span style="display:block' + (hl ? ';background:var(--haldi-soft);border-radius:3px' : '') + '">' + sqlHtml(l.t) + '</span>';
      }).join('');
      fitScrollable(elSql, 'SQL query');
    }
    function renderStats() {
      elSJoin.textContent = plural(Q.nJoin, 'row');
      elSWhere.textContent = S.where === 'none' ? 'skipped' : plural(Q.nWhere, 'row');
      elSGroup.textContent = Q.grouped ? plural(Q.rows.length, 'group') : 'skipped';
      elSRes.textContent = plural(Q.rows.length, 'row');
    }
    function vennRegions() {
      var keeps = JOIN_KEEPS[S.join], R = {};
      ['L', 'M', 'R'].forEach(function (k) {
        if (!keeps[k] || !Q.produced[k]) R[k] = 0;
        else if (Q.keptBy[k] === Q.produced[k]) R[k] = 2;
        else R[k] = Q.keptBy[k] ? 1 : 0;
      });
      return R;
    }
    var JOIN_CAP = {
      INNER: 'INNER JOIN: only the overlap, the pairs that match.',
      LEFT: 'LEFT JOIN: all of customers, matched or not.',
      RIGHT: 'RIGHT JOIN: all of orders, matched or not.',
      FULL: 'FULL OUTER JOIN: everything in both circles.'
    };
    var REGION_NAME = { L: 'customers with no order', M: 'matching pairs', R: 'orders with no customer' };
    var REGION_ONE = { L: 'customer with no order', M: 'matching pair', R: 'order with no customer' };
    function renderVenn() {
      var Rg = vennRegions();
      var r = 32, c1 = 60, c2 = 100, cy = 40, d = c2 - c1, xm = (c1 + c2) / 2, h = Math.sqrt(r * r - d * d / 4);
      var t = (cy - h).toFixed(2), b = (cy + h).toFixed(2), A = r + ' ' + r + ' 0 ';
      var pL = 'M' + xm + ' ' + t + 'A' + A + '1 0 ' + xm + ' ' + b + 'A' + A + '0 1 ' + xm + ' ' + t + 'Z';
      var pM = 'M' + xm + ' ' + t + 'A' + A + '0 1 ' + xm + ' ' + b + 'A' + A + '0 1 ' + xm + ' ' + t + 'Z';
      var pR = 'M' + xm + ' ' + t + 'A' + A + '1 1 ' + xm + ' ' + b + 'A' + A + '0 0 ' + xm + ' ' + t + 'Z';
      function fill(v) { return v === 2 ? 'fill:var(--indigo);fill-opacity:.6' : v === 1 ? 'fill:var(--indigo);fill-opacity:.22' : 'fill:none'; }
      elVenn.innerHTML =
        '<path d="' + pL + '" style="' + fill(Rg.L) + '"/>' +
        '<path d="' + pM + '" style="' + fill(Rg.M) + '"/>' +
        '<path d="' + pR + '" style="' + fill(Rg.R) + '"/>' +
        '<circle cx="' + c1 + '" cy="' + cy + '" r="' + r + '" style="fill:none;stroke:var(--ink);stroke-width:1.5"/>' +
        '<circle cx="' + c2 + '" cy="' + cy + '" r="' + r + '" style="fill:none;stroke:var(--ink);stroke-width:1.5"/>' +
        '<text x="' + (c1 - 13) + '" y="88" text-anchor="middle" style="fill:var(--ink);font-family:var(--font-body);font-size:13px">customers</text>' +
        '<text x="' + (c2 + 15) + '" y="88" text-anchor="middle" style="fill:var(--ink);font-family:var(--font-body);font-size:13px">orders</text>';
      var cap = JOIN_CAP[S.join];
      if (S.where !== 'none') {
        var parts = [];
        ['L', 'M', 'R'].forEach(function (k) {
          if (!JOIN_KEEPS[S.join][k] || !Q.produced[k]) return;
          parts.push(Q.keptBy[k] + ' of ' + Q.produced[k] + ' ' + (Q.produced[k] === 1 ? REGION_ONE[k] : REGION_NAME[k]));
        });
        cap += ' After WHERE: ' + parts.join(', ') + '.';
      }
      elVennCap.textContent = cap;
      var shaded = ['L', 'M', 'R'].filter(function (k) { return Rg[k]; }).map(function (k) { return (Rg[k] === 1 ? 'some ' : 'all ') + REGION_NAME[k]; });
      elVenn.setAttribute('aria-label', 'Venn diagram of customers and orders. Shaded: ' + (shaded.length ? listAnd(shaded) : 'nothing') + '.');
    }
    function nullPill() {
      return '<span style="display:inline-block;padding:0 5px;border:1px dashed var(--haldi);border-radius:4px;background:var(--haldi-soft);color:var(--ink);font-family:var(--font-mono);font-weight:700;font-size:.78rem;line-height:1.55">NULL</span>';
    }
    function cellHtml(v, col) {
      if (isNull(v)) return nullPill();
      if (col.kind === 'money') return esc(rupees(v));
      if (col.kind === 'num') return esc(fmtIN(v));
      return esc(v);
    }
    function renderResult() {
      var cols = Q.cols, rows = Q.rows, thStyle = 'text-transform:none;letter-spacing:0;font-family:var(--font-mono);font-size:.78rem;white-space:nowrap';
      var head;
      if (!Q.grouped) {
        head = '<tr><th colspan="3" scope="colgroup" style="' + thStyle + ';color:var(--ink);border-bottom:0;padding-bottom:0">from customers</th>' +
          '<th colspan="3" scope="colgroup" style="' + thStyle + ';color:var(--ink);border-bottom:0;padding-bottom:0;border-left:1px solid var(--line)">from orders</th></tr><tr>' +
          cols.map(function (c, i) { return '<th scope="col" style="' + thStyle + (i === 3 ? ';border-left:1px solid var(--line)' : '') + (c.kind ? ';text-align:right' : '') + '">' + esc(c.n) + '</th>'; }).join('') + '</tr>';
      } else {
        head = '<tr>' + cols.map(function (c) {
          return '<th scope="col" style="' + thStyle + (c.kind ? ';text-align:right' : '') + '">' + esc(c.n === 'city' ? 'customers.city' : c.n) +
            (c.n !== 'city' ? '<span style="display:block;font-weight:400">' + esc(c.expr) + '</span>' : '') + '</th>';
        }).join('') + '</tr>';
      }
      var body;
      if (!rows.length) {
        body = '<tr><td colspan="' + cols.length + '" class="muted" style="font-size:.9rem">No rows: nothing passed the WHERE filter.</td></tr>';
      } else {
        body = rows.map(function (r, ri) {
          return '<tr tabindex="0" data-r="' + ri + '" style="cursor:pointer">' + r.cells.map(function (v, i) {
            var c = cols[i];
            return '<td style="font-family:var(--font-mono);font-size:.84rem;white-space:nowrap' + (c.kind ? ';text-align:right' : '') + (!Q.grouped && i === 3 ? ';border-left:1px solid var(--line)' : '') + '">' + cellHtml(v, c) + '</td>';
          }).join('') + '</tr>';
        }).join('');
      }
      elResWrap.innerHTML = '<table class="simple" style="width:100%;margin:0"><caption class="visually-hidden">Result of the query: ' + plural(rows.length, 'row') + '</caption><thead>' + head + '</thead><tbody>' + body + '</tbody></table>';
      resTrs = Array.prototype.slice.call(elResWrap.querySelectorAll('tbody tr[data-r]'));
      elResHead.textContent = 'Result: ' + plural(rows.length, 'row');
      var nulls = 0;
      rows.forEach(function (r) { r.cells.forEach(function (v) { if (isNull(v)) nulls++; }); });
      var note = Q.order ? 'Sorted by ' + Q.order.sql + '.' : 'No ORDER BY, so SQL promises no particular order; here rows simply follow the tables.';
      if (nulls) note += ' ' + plural(nulls, 'NULL cell') + ': NULL means no value, not 0 and not empty text.';
      elResNote.textContent = note;
      fitScrollable(elResWrap, null);
    }
    // a box that scrolls sideways must be reachable by keyboard; one that does not should not be a tab stop
    function fitScrollable(el, label) {
      var over = el.scrollWidth > el.clientWidth + 1;
      if (over) {
        if (el.getAttribute('tabindex') !== '0') el.setAttribute('tabindex', '0');
        if (label) { el.setAttribute('role', 'region'); el.setAttribute('aria-label', label + ' (scrolls sideways)'); }
        else el.setAttribute('role', 'region');
      } else if (el.hasAttribute('tabindex')) {
        el.removeAttribute('tabindex');
        el.removeAttribute('role');
        if (label) el.setAttribute('aria-label', label);
      }
    }

    /* ---------- spotlight: trace one row ---------- */
    function cKey(p, pi) { return p.ci >= 0 ? 'c' + p.ci : 'gc' + pi; }
    function oKey(p, pi) { return p.oi >= 0 ? 'o' + p.oi : 'go' + pi; }
    function spotSpec() {
      if (hoverDiag) return { type: 'row', key: hoverDiag };
      if (hoverRes !== null) return { type: 'res', idx: hoverRes };
      if (focusRes !== null) return { type: 'res', idx: focusRes };
      return pinned;
    }
    function computeSpot() {
      var sp = spotSpec();
      if (!sp) return null;
      var out = { pairs: {}, rows: {}, res: {} }, any = false;
      if (sp.type === 'row') {
        Q.pairs.forEach(function (p, pi) {
          if (cKey(p, pi) === sp.key || oKey(p, pi) === sp.key) { out.pairs[pi] = 1; any = true; }
        });
        out.rows[sp.key] = 1;
      } else {
        var r = Q.rows[sp.idx];
        if (!r) return null;
        r.pairs.forEach(function (pi) { out.pairs[pi] = 1; any = true; });
        out.res[sp.idx] = 1;
      }
      Object.keys(out.pairs).forEach(function (pi) {
        var p = Q.pairs[pi];
        out.rows[cKey(p, +pi)] = 1; out.rows[oKey(p, +pi)] = 1;
      });
      if (sp.type === 'row') {
        Q.rows.forEach(function (r, ri) { if (r.pairs.some(function (pi) { return out.pairs[pi]; })) out.res[ri] = 1; });
      }
      out.any = any || sp.type === 'row';
      return out;
    }
    function applyResSpot(spot) {
      resTrs.forEach(function (tr) {
        var on = spot && spot.res[+tr.getAttribute('data-r')];
        tr.style.background = on ? 'var(--indigo-soft)' : '';
        tr.style.boxShadow = on ? 'inset 3px 0 0 var(--indigo)' : '';
      });
    }

    /* ---------- the table diagram ---------- */
    function monoFam() {
      var f = '';
      try { f = getComputedStyle(svg).fontFamily; } catch (e) { f = ''; }
      return f || 'monospace';
    }
    function computeLayout(width) {
      var fam = monoFam();
      for (var mi = 0; mi < MODES.length; mi++) {
        var M = MODES[mi];
        var cc = diagCols('c', M), oc = diagCols('o', M);
        var nullW = textW('NULL', M.vf, true, fam);
        var colW = function (side, col) {
          var w = 0;
          headParts(col.k, M.split).forEach(function (h) { w = Math.max(w, textW(h, M.hf, true, fam)); });
          var list = side === 'c' ? CUSTOMERS : ORDERS;
          list.forEach(function (row) { w = Math.max(w, textW(diagCell(row, col), M.vf, false, fam)); });
          return Math.ceil(Math.max(w, nullW) + 2 * M.pad);
        };
        var cw = cc.map(function (c) { return colW('c', c); }), ow = oc.map(function (c) { return colW('o', c); });
        var custW = cw.reduce(function (a, b) { return a + b; }, 0), ordW = ow.reduce(function (a, b) { return a + b; }, 0);
        var need = 2 * M.m + custW + M.gap + ordW;
        if (need <= width || mi === MODES.length - 1) {
          var extra = Math.max(0, width - need);
          var gap = M.gap + Math.min(extra, M.gapMax - M.gap);
          extra -= gap - M.gap;
          var x0 = M.m + extra / 2;
          var titleH = Math.round(M.titleF + 14);
          var headTop = M.m + titleH;
          return {
            M: M, cc: cc, oc: oc, cw: cw, ow: ow, custW: custW, ordW: ordW, gap: gap,
            custX: x0, ordX: x0 + custW + gap, width: Math.max(width, Math.ceil(need)),
            titleH: titleH, headTop: headTop, rowTop: headTop + M.headH,
            height: Math.ceil(headTop + M.headH + MAX_ROWS * M.rowH + M.m + 2)
          };
        }
      }
      return null;
    }
    function relayout() {
      var w = Math.floor(elWrap.clientWidth);
      if (w < 10) return false;
      if (w === layW && lay) return false;
      layW = w;
      lay = computeLayout(w);
      svg.setAttribute('width', lay.width);
      svg.setAttribute('height', lay.height);
      svg.setAttribute('viewBox', '0 0 ' + lay.width + ' ' + lay.height);
      svg.style.width = lay.width + 'px';
      svg.style.height = lay.height + 'px';
      elDateNote.hidden = lay.M.date;
      if (lay.width > w) {
        elWrap.setAttribute('tabindex', '0');
        elWrap.setAttribute('role', 'region');
        elWrap.setAttribute('aria-label', 'Table diagram (scrolls sideways)');
      } else {
        elWrap.removeAttribute('tabindex'); elWrap.removeAttribute('role'); elWrap.removeAttribute('aria-label');
      }
      return true;
    }
    function f1(v) { return Math.round(v * 10) / 10; }
    function drawTable(L, side, rows, used, spot, mid) {
      var M = L.M, isC = side === 'c', x = isC ? L.custX : L.ordX, cols = isC ? L.cc : L.oc, ws = isC ? L.cw : L.ow, tw = isC ? L.custW : L.ordW;
      var list = isC ? CUSTOMERS : ORDERS, s = '', i, cx;
      // title
      s += '<text x="' + f1(x) + '" y="' + f1(M.m + M.titleF) + '" style="font-family:var(--font-body);font-size:' + M.titleF + 'px;font-weight:700;fill:var(--ink)">' + (isC ? 'customers' : 'orders') +
        '<tspan style="font-weight:400;fill:var(--muted)"> · ' + list.length + ' rows</tspan></text>';
      // header
      var ht = L.headTop;
      s += '<rect x="' + f1(x) + '" y="' + ht + '" width="' + tw + '" height="' + M.headH + '" style="fill:var(--surface-2)"/>';
      cx = x;
      for (i = 0; i < cols.length; i++) {
        var parts = headParts(cols[i].k, M.split), ax = cols[i].num ? cx + ws[i] - M.pad : cx + M.pad, anchor = cols[i].num ? 'end' : 'start';
        parts.forEach(function (h, pi) {
          var yy = parts.length === 1 ? ht + M.headH / 2 : ht + M.headH / 2 + (pi === 0 ? -M.hf * 0.58 : M.hf * 0.58);
          s += '<text x="' + f1(ax) + '" y="' + f1(yy) + '" dominant-baseline="central" text-anchor="' + anchor + '" style="font-size:' + M.hf + 'px;font-weight:700;fill:var(--muted)">' + esc(h) + '</text>';
        });
        cx += ws[i];
      }
      // body rows
      rows.forEach(function (row, ri) {
        var y = L.rowTop + ri * M.rowH, ym = y + M.rowH / 2, sp = spot && spot.rows[row.key];
        mid[row.key] = ym;
        var bg = sp ? 'var(--indigo-soft)' : row.ghost ? 'var(--surface-2)' : row.unmatched ? 'var(--haldi-soft)' : 'var(--surface)';
        s += '<g data-k="' + row.key + '" style="cursor:pointer">';
        s += '<rect x="' + f1(x) + '" y="' + y + '" width="' + tw + '" height="' + M.rowH + '" style="fill:' + bg +
          (row.ghost ? ';stroke:var(--muted);stroke-dasharray:3 2' : sp ? ';stroke:var(--indigo);stroke-width:1.5' : '') + '"/>';
        if (row.unmatched && !row.ghost) s += '<rect x="' + f1(isC ? x : x + tw - 3) + '" y="' + y + '" width="3" height="' + M.rowH + '" style="fill:var(--haldi)"/>';
        var inUse = used[row.key], ink = inUse ? 'var(--ink)' : 'var(--muted)';
        var cx2 = x;
        for (var c = 0; c < cols.length; c++) {
          var txt = row.ghost ? 'NULL' : diagCell(list[row.idx], cols[c]);
          var tx = cols[c].num ? cx2 + ws[c] - M.pad : cx2 + M.pad;
          s += '<text x="' + f1(tx) + '" y="' + f1(ym) + '" dominant-baseline="central" text-anchor="' + (cols[c].num ? 'end' : 'start') + '" style="font-size:' + M.vf + 'px;fill:' + ink + (row.ghost ? ';font-weight:700' : '') + '">' + esc(txt) + '</text>';
          cx2 += ws[c];
        }
        if (!inUse) s += '<path d="M' + f1(x + 4) + ' ' + f1(ym) + 'H' + f1(x + tw - 4) + '" style="stroke:var(--bad);stroke-width:1.5"/>';
        s += '</g>';
        if (ri < rows.length - 1 && !row.ghost) s += '<path d="M' + f1(x) + ' ' + (y + M.rowH) + 'H' + f1(x + tw) + '" style="stroke:var(--line);stroke-width:1"/>';
      });
      // outline around the real table (ghost rows sit below it, outside the outline)
      var realH = M.headH + list.length * M.rowH;
      s += '<rect x="' + f1(x + 0.5) + '" y="' + (ht + 0.5) + '" width="' + (tw - 1) + '" height="' + (realH - 1) + '" rx="3" style="fill:none;stroke:var(--field-line, var(--line));stroke-width:1"/>';
      cx = x;
      for (i = 0; i < cols.length - 1; i++) {
        cx += ws[i];
        s += '<path d="M' + f1(cx) + ' ' + ht + 'V' + (ht + realH) + '" style="stroke:var(--line);stroke-width:1"/>';
      }
      return s;
    }
    function renderDiagram() {
      if (!lay) return;
      var L = lay, M = L.M, spot = computeSpot();
      var cRows = CUSTOMERS.map(function (c, ci) { return { key: 'c' + ci, idx: ci, ghost: false, unmatched: !ORD_OF[ci].length }; });
      var oRows = ORDERS.map(function (o, oi) { return { key: 'o' + oi, idx: oi, ghost: false, unmatched: !CUST_OF[oi].length }; });
      Q.pairs.forEach(function (p, pi) {
        if (p.ci < 0) cRows.push({ key: 'gc' + pi, ghost: true });
        if (p.oi < 0) oRows.push({ key: 'go' + pi, ghost: true });
      });
      var used = {};
      Q.pairs.forEach(function (p, pi) { if (Q.kept[pi]) { used[cKey(p, pi)] = 1; used[oKey(p, pi)] = 1; } });
      var mid = {};
      var s = '<rect x="0" y="0" width="' + L.width + '" height="' + L.height + '" style="fill:var(--surface)"/>';
      s += drawTable(L, 'c', cRows, used, spot, mid);
      s += drawTable(L, 'o', oRows, used, spot, mid);
      // lines: one per joined row
      var x1 = L.custX + L.custW, x2 = L.ordX, g = L.gap, lines = '', front = '';
      Q.pairs.forEach(function (p, pi) {
        var y1 = mid[cKey(p, pi)], y2 = mid[oKey(p, pi)];
        if (y1 === undefined || y2 === undefined) return;
        var kept = Q.kept[pi], lit = spot && spot.pairs[pi], dim = spot && spot.any && !lit;
        var col = kept ? 'var(--indigo)' : 'var(--muted)';
        var d = 'M' + f1(x1) + ' ' + f1(y1) + 'C' + f1(x1 + g * 0.5) + ' ' + f1(y1) + ' ' + f1(x2 - g * 0.5) + ' ' + f1(y2) + ' ' + f1(x2) + ' ' + f1(y2);
        var st = 'fill:none;stroke:' + col + ';stroke-width:' + (lit ? (kept ? 3.5 : 2.5) : (kept ? 2 : 1.5)) + (kept ? '' : ';stroke-dasharray:4 3') + (dim ? ';opacity:.22' : '');
        var dots = '<circle cx="' + f1(x1) + '" cy="' + f1(y1) + '" r="2.6" style="fill:' + col + (dim ? ';opacity:.22' : '') + '"/>' +
          '<circle cx="' + f1(x2) + '" cy="' + f1(y2) + '" r="2.6" style="fill:' + col + (dim ? ';opacity:.22' : '') + '"/>';
        if (lit) front += '<path d="' + d + '" style="' + st + '"/>' + dots;
        else lines += '<path d="' + d + '" style="' + st + '"/>' + dots;
      });
      s += '<g style="pointer-events:none">' + lines + front + '</g>';
      svg.innerHTML = s;
    }
    function describeDiagram() {
      var j = findBy(JOINS, S.join).sql;
      var unusedC = [], unusedO = [], used = {};
      Q.pairs.forEach(function (p, pi) { if (Q.kept[pi]) { if (p.ci >= 0) used['c' + p.ci] = 1; if (p.oi >= 0) used['o' + p.oi] = 1; } });
      CUSTOMERS.forEach(function (c, ci) { if (!used['c' + ci]) unusedC.push(c.name); });
      ORDERS.forEach(function (o, oi) { if (!used['o' + oi]) unusedO.push(String(o.order_id)); });
      var ghosts = Q.produced.L + Q.produced.R;
      var s = 'Table diagram. customers has 7 rows, orders has 9 rows, matched on customer_id: ' + MATCHES + ' matching pairs. ' +
        listAnd(custNames(NO_ORDERS)) + ' have no orders; ' + listAnd(orderIds(NO_CUSTOMER)) + ' has no customer. ' +
        j + ' makes ' + plural(Q.nJoin, 'joined row') + (ghosts ? ', including ' + plural(ghosts, 'made-up all-NULL partner') : '') + '. ' +
        (S.where !== 'none' ? plural(Q.nWhere, 'row') + ' pass WHERE. ' : '') +
        'Customers not used in the result: ' + (unusedC.length ? listAnd(unusedC) : 'none') + '. Orders not used: ' + (unusedO.length ? listAnd(unusedO) : 'none') + '.';
      svg.setAttribute('aria-label', s);
    }
    function requestDiag() {
      needDiag = true;
      if (!rafId && !destroyed) rafId = requestAnimationFrame(frame);
    }
    function frame() {
      rafId = 0;
      if (destroyed) return;
      if (needDiag) { needDiag = false; renderDiagram(); }
    }
    function spotChanged() {
      applyResSpot(computeSpot());
      requestDiag();
    }

    /* ---------- controls ---------- */
    function rebuildOrderSelect() {
      var opts = orderOptions(S);
      if (S.order !== 'none' && !findBy(opts, S.order)) S.order = 'none';
      elOrder.innerHTML = '<option value="none">No ORDER BY</option>' + opts.map(function (o) { return '<option value="' + o.id + '">' + esc(o.label) + '</option>'; }).join('');
      elOrder.value = S.order;
    }
    function syncControls() {
      Array.prototype.forEach.call(joinBtns, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-join') === S.join)); });
      elWhere.value = S.where;
      elGroup.value = S.group;
      elAggs.hidden = S.group !== 'city';
      Array.prototype.forEach.call(aggBoxes, function (cb) { cb.checked = !!S.aggs[cb.getAttribute('data-agg')]; });
      rebuildOrderSelect();
    }
    function renderAll() {
      Q = runQuery(S);
      renderSql();
      renderStats();
      renderVenn();
      renderResult();
      describeDiagram();
      applyResSpot(computeSpot());
      renderDiagram();
    }
    // every learner change goes through here: run the query, redraw, explain, check tasks
    function update(what, lead) {
      if (destroyed) return;
      hoverRes = null; focusRes = null;
      if (pinned && (pinned.type === 'res' || /^g/.test(pinned.key))) pinned = null;
      changed = {};
      (what || []).forEach(function (c) { changed[c] = 1; });
      var orderBefore = S.order;
      syncControls();
      renderAll();
      var parts = [];
      if (lead) parts.push(lead);
      if (changed.join) { parts.push(joinText()); if (S.where !== 'none') parts.push(whereText()); }
      else if (changed.where) parts.push(whereText());
      else if (changed.group || changed.select) parts.push(groupText());
      else if (changed.order) parts.push(orderText());
      if (orderBefore !== 'none' && S.order === 'none' && !changed.order) parts.push('ORDER BY was cleared because its column is no longer in the result.');
      var fired = checkTasks();
      if (fired.length) parts.unshift('<b>Task done!</b>');
      say(parts.join(' '));
    }

    Array.prototype.forEach.call(joinBtns, function (btn) {
      on(btn, 'click', function () {
        var j = btn.getAttribute('data-join');
        if (j === S.join) return;
        S.join = j;
        update(['join']);
      });
    });
    on(elWhere, 'change', function () { S.where = elWhere.value; update(['where']); });
    on(elGroup, 'change', function () {
      S.group = elGroup.value;
      update(['group', 'select']);
    });
    Array.prototype.forEach.call(aggBoxes, function (cb) {
      on(cb, 'change', function () { S.aggs[cb.getAttribute('data-agg')] = cb.checked; update(['select']); });
    });
    on(elOrder, 'change', function () { S.order = elOrder.value; update(['order']); });
    on(elReset, 'click', function () {
      S = copyState(DEFAULT_STATE);
      pinned = null;
      update([], 'Query reset to a plain INNER JOIN with no WHERE, GROUP BY or ORDER BY.');
    });

    /* ---------- pointer: trace rows in the diagram and the result ---------- */
    function rowKeyFrom(e) {
      var t = e.target, g = t && t.closest ? t.closest('[data-k]') : null;
      return g ? g.getAttribute('data-k') : null;
    }
    on(svg, 'pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var k = rowKeyFrom(e);
      if (k !== hoverDiag) { hoverDiag = k; spotChanged(); }
    });
    on(svg, 'pointerleave', function (e) {
      if (e.pointerType !== 'mouse') return;
      if (hoverDiag !== null) { hoverDiag = null; spotChanged(); }
    });
    on(svg, 'click', function (e) {
      var k = rowKeyFrom(e);
      if (k && !(pinned && pinned.type === 'row' && pinned.key === k)) pinned = { type: 'row', key: k };
      else pinned = null;
      spotChanged();
    });
    function resIdxFrom(e) {
      var t = e.target, tr = t && t.closest ? t.closest('tr[data-r]') : null;
      return tr && elResWrap.contains(tr) ? +tr.getAttribute('data-r') : null;
    }
    on(elResWrap, 'pointerover', function (e) {
      if (e.pointerType !== 'mouse') return;
      var i = resIdxFrom(e);
      if (i !== hoverRes) { hoverRes = i; spotChanged(); }
    });
    on(elResWrap, 'pointerleave', function (e) {
      if (e.pointerType !== 'mouse') return;
      if (hoverRes !== null) { hoverRes = null; spotChanged(); }
    });
    on(elResWrap, 'focusin', function (e) {
      var i = resIdxFrom(e);
      if (i !== focusRes) { focusRes = i; spotChanged(); }
    });
    on(elResWrap, 'focusout', function () {
      if (focusRes !== null) { focusRes = null; spotChanged(); }
    });
    on(elResWrap, 'click', function (e) {
      var i = resIdxFrom(e);
      if (i === null) return;
      if (pinned && pinned.type === 'res' && pinned.idx === i) pinned = null;
      else pinned = { type: 'res', idx: i };
      spotChanged();
    });

    /* ---------- theme, fonts and resize ---------- */
    function onTheme() { if (!destroyed) renderDiagram(); }
    var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mql) { if (mql.addEventListener) mql.addEventListener('change', onTheme); else if (mql.addListener) mql.addListener(onTheme); }
    on(document, 'themechange', onTheme);
    function onResize() {
      if (destroyed) return;
      // lay out and repaint in the same callback, so there is never a blank frame
      if (relayout()) renderDiagram();
      if (wantNarrowSql() !== sqlNarrow) renderSql();
      fitScrollable(elSql, 'SQL query');
      fitScrollable(elResWrap, null);
    }
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(onResize); ro.observe(elWrap); ro.observe(elResWrap); ro.observe(elSql); }
    else on(window, 'resize', onResize);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { if (destroyed) return; layW = -1; onResize(); });
    }

    /* ---------- start ---------- */
    syncControls();
    relayout();
    renderAll();
    say('The query starts as a plain <b>INNER JOIN</b>: ' + plural(Q.nJoin, 'row') + ', one for each order that has a matching customer. Change the join type to see who gets left out, and who gets NULLs.');

    return {
      destroy: function () {
        if (destroyed) return;
        destroyed = true;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
        if (ro) ro.disconnect();
        if (mql) { if (mql.removeEventListener) mql.removeEventListener('change', onTheme); else if (mql.removeListener) mql.removeListener(onTheme); }
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
        listeners = [];
        if (top.parentNode === root) root.removeChild(top);
      }
    };
  }

  Labs.sql = {
    id: 'sql',
    module: 'l1-eda-viz-sql',
    title: 'SQL JOINs and GROUP BY',
    summary: 'Join a small customers table to an orders table with INNER, LEFT, RIGHT and FULL OUTER JOIN, then filter, group and sort, while lines show which rows match and NULLs show what is missing.',
    tasks: TASKS,
    mount: mount
  };
})();
