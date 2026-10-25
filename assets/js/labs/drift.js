/* AI Marg lab: model monitoring and data drift.
   A bank's simple UPI fraud model (one amount cutoff by day, one at night) runs for 12 weeks after launch.
   From a chosen week, festival shopping and/or a new fraud trick change the data. Each week the PSI drift
   score compares payment amounts with the training data straight away, while accuracy and recall wait for
   labels that arrive weeks late. The learner sets the alert threshold, the label delay and the retraining window.
   Plain classic script (ES2019). Registers window.AILabs.drift. No libraries, no network, no storage. */
(function () {
  'use strict';
  var Labs = (window.AILabs = window.AILabs || {});
  var mountCount = 0;

  /* ---------- constants ---------- */
  var WEEKS = 12;
  var N_WEEK = 4000, N_TRAIN = 12000;
  var FRAUD_RATE = 0.05;
  var SEED = 9001, WOBBLE_SEED = 7;
  // amounts are log-normal: log10(amount) follows a bell curve with this centre (MU) and spread (SD)
  var G_DAY_MU = 2.75, G_DAY_SD = 0.40;          // genuine daytime payments: middle about ₹560
  var G_NIGHT_MU = 2.40, G_NIGHT_SD = 0.36;      // genuine night payments: middle about ₹250
  var G_NIGHT_SHARE = 0.10;
  var F_OLD_MU = 3.90, F_OLD_SD = 0.30, F_OLD_NIGHT = 0.40;   // usual fraud: big payments, middle about ₹7,900
  var F_NEW_MU = 3.00, F_NEW_SD = 0.14, F_NEW_NIGHT = 0.92;   // new trick: small night payments near ₹1,000
  var FEST_SHIFT = 0.55;      // at 100% strength, daytime genuine amounts grow 10^0.55, about 3.5 times
  var SALARY_SHIFT = 0.10;    // first week of each month: rent, fees and bills
  var SALARY_WEEKS = [1, 5, 9];
  var WOBBLE_SD = 0.01;
  var RAMP = 3;               // drift grows to full strength over 3 weeks
  var MISS_COST = 5;          // a missed fraud counts as 5 mistakes when fitting cutoffs
  var EDGES = [100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000];
  var NB = EDGES.length + 1;
  var GRID = [100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 1000, 1200, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 7000, 8000, 10000, 12000, 15000, 20000, 25000, 30000, 40000, 50000];
  var NG = GRID.length + 1;
  var EPS = 0.0001;
  var ACC_ALARM = 0.95, REC_ALARM = 0.70, REC_TARGET = 0.80;
  var MAJOR = 0.25, MODERATE = 0.1;
  var DEF = { mode: 'both', start: 6, strength: 60, thr: 0.05, delay: 2, win: 3 };
  var PLAY_MS = 750;
  var MODES = {
    fest: 'Festival',
    trick: 'Fraud trick',
    both: 'Both'
  };
  var TASKS = [
    { id: 't1', text: 'Find the first week whose PSI goes above 0.25 (major drift): tap it on the weekly chart, or pick it with the “Week shown” slider.' },
    { id: 't2', text: 'Set an alert threshold that makes the drift alarm ring in a drift week, with zero false alarms in the calm weeks before the drift.' },
    { id: 't3', text: 'Once labels show recall below 70%, press “Retrain on recent data”, then step on until labels show the new model’s recall at 80% or more.' },
    { id: 't4', text: 'Keep labels 2 or more weeks late and step on until the accuracy alarm rings. It rings weeks after the drift alarm, because it has to wait for labels.' }
  ];

  /* ---------- helpers ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function zeros(n) { var a = []; for (var i = 0; i < n; i++) a.push(0); return a; }
  function groupIN(n) {
    var s = String(Math.round(Math.abs(n))), neg = n < 0 ? '−' : '';
    if (s.length <= 3) return neg + s;
    var last = s.slice(-3), rest = s.slice(0, -3);
    return neg + rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last;
  }
  function inr(n) { return '₹' + groupIN(n); }
  function pct(x, d) { return (x * 100).toFixed(d) + '%'; }
  function fmtPsi(x) { return x.toFixed(3); }
  function band(p) { return p < MODERATE ? 'stable' : p <= MAJOR ? 'moderate' : 'major'; }
  function short(n) { return n >= 1000 ? (n / 1000) + 'k' : String(n); }
  function binName(i) {
    if (i === 0) return '₹1–99';
    if (i === NB - 1) return inr(EDGES[i - 1]) + '+';
    return inr(EDGES[i - 1]) + '–' + groupIN(EDGES[i] - 1);
  }
  function binOf(a) { var i = 0; while (i < EDGES.length && a >= EDGES[i]) i++; return i; }
  function gridIdx(a) { var g = 0; while (g < GRID.length && GRID[g] < a) g++; return g; }  // flagged by cutoff j when g > j
  function weekList(ws) {
    if (!ws.length) return '';
    if (ws.length === 1) return 'week ' + ws[0];
    return 'weeks ' + ws.slice(0, -1).join(', ') + ' and ' + ws[ws.length - 1];
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- seeded data (the same random draws every time, built once) ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) { var u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }
  var BASE = null;
  function getBase() {
    if (BASE) return BASE;
    function make(seed, n) {
      var r = mulberry32(seed), a = new Float64Array(n * 4);
      for (var i = 0; i < n; i++) { a[4 * i] = r(); a[4 * i + 1] = r(); a[4 * i + 2] = r(); a[4 * i + 3] = gauss(r); }
      return a;
    }
    var weeks = [], wob = [], w;
    for (w = 1; w <= WEEKS; w++) weeks.push(make(SEED + 101 * w, N_WEEK));
    var wr = mulberry32(WOBBLE_SEED);
    for (w = 1; w <= WEEKS; w++) wob.push(gauss(wr) * WOBBLE_SD);
    BASE = { train: make(SEED, N_TRAIN), weeks: weeks, wob: wob };
    return BASE;
  }
  function newSum() { return { n: 0, bins: zeros(NB), h: [zeros(NG), zeros(NG), zeros(NG), zeros(NG)] }; }  // h[part*2 + fraud][grid index], part 0 day, 1 night
  // turn the fixed random draws into one week of payments, then count them into bins
  function realise(arr, week, kf, kt, wob) {
    var s = newSum(), n = arr.length / 4;
    var shift = week ? (SALARY_WEEKS.indexOf(week) >= 0 ? SALARY_SHIFT : 0) + wob[week - 1] : 0;
    for (var i = 0; i < n; i++) {
      var j = 4 * i, fraud = arr[j] < FRAUD_RATE, night, mu, sd;
      if (fraud) {
        var trick = arr[j + 2] < kt;
        night = arr[j + 1] < (trick ? F_NEW_NIGHT : F_OLD_NIGHT);
        mu = trick ? F_NEW_MU : F_OLD_MU; sd = trick ? F_NEW_SD : F_OLD_SD;
      } else {
        night = arr[j + 1] < G_NIGHT_SHARE;
        if (night) { mu = G_NIGHT_MU + shift; sd = G_NIGHT_SD; }
        else { mu = G_DAY_MU + shift + FEST_SHIFT * kf; sd = G_DAY_SD; }
      }
      var amt = Math.max(1, Math.round(Math.pow(10, mu + sd * arr[j + 3])));
      s.bins[binOf(amt)]++;
      s.h[(night ? 2 : 0) + (fraud ? 1 : 0)][gridIdx(amt)]++;
      s.n++;
    }
    return s;
  }
  function addSum(dst, src) {
    dst.n += src.n;
    for (var i = 0; i < NB; i++) dst.bins[i] += src.bins[i];
    for (var k = 0; k < 4; k++) for (var g = 0; g < NG; g++) dst.h[k][g] += src.h[k][g];
  }
  // pick, separately for day and night, the cutoff with the fewest mistakes (a missed fraud counts MISS_COST times)
  function fitCut(sum) {
    var cut = [0, 0];
    for (var p = 0; p < 2; p++) {
      var G = sum.h[p * 2], F = sum.h[p * 2 + 1], totG = 0, g;
      for (g = 0; g < NG; g++) totG += G[g];
      var fp = totG - G[0], fn = F[0], best = 0, bestCost = fp + MISS_COST * fn;
      for (var j = 1; j < GRID.length; j++) {
        fp -= G[j]; fn += F[j];
        var cost = fp + MISS_COST * fn;
        if (cost < bestCost) { bestCost = cost; best = j; }
      }
      cut[p] = best;
    }
    return cut;
  }
  function evaluate(cut, sum) {
    var tp = 0, fp = 0, tn = 0, fn = 0;
    for (var p = 0; p < 2; p++) {
      var G = sum.h[p * 2], F = sum.h[p * 2 + 1];
      for (var g = 0; g < NG; g++) {
        if (g > cut[p]) { tp += F[g]; fp += G[g]; } else { fn += F[g]; tn += G[g]; }
      }
    }
    var n = tp + fp + tn + fn;
    return { tp: tp, fp: fp, tn: tn, fn: fn, acc: (tp + tn) / n, rec: tp + fn ? tp / (tp + fn) : 1, frauds: tp + fn };
  }
  // PSI = sum over bins of (a - e) * ln(a / e); e = training share, a = this week's share; an empty bin counts as EPS
  function psiOf(ref, cur) {
    var terms = [], total = 0, es = [], as = [];
    for (var i = 0; i < NB; i++) {
      var e = ref.bins[i] ? ref.bins[i] / ref.n : EPS;
      var a = cur.bins[i] ? cur.bins[i] / cur.n : EPS;
      var t = (a - e) * Math.log(a / e);
      terms.push(t); es.push(e); as.push(a); total += t;
    }
    return { psi: total, terms: terms, e: es, a: as };
  }

  /* ---------- theme ---------- */
  var scratch = null;
  function toRgb(str) {
    if (!scratch) scratch = document.createElement('canvas').getContext('2d');
    scratch.fillStyle = '#000';
    scratch.fillStyle = str || '#000';
    var v = scratch.fillStyle;
    if (v.charAt(0) === '#') return [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16)];
    var m = v.match(/[\d.]+/g) || [0, 0, 0];
    return [+m[0], +m[1], +m[2]];
  }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function readTheme() {
    var cs = getComputedStyle(document.documentElement);
    function v(n, fb) { var x = cs.getPropertyValue(n).trim(); return x || fb; }
    var T = {
      bg: v('--bg', '#f4f4f9'), surface: v('--surface', '#ffffff'), surface2: v('--surface-2', '#ebecf5'),
      ink: v('--ink', '#161930'), muted: v('--muted', '#565b7a'), line: v('--line', '#d7d9e8'),
      indigo: v('--indigo', '#2d388a'), indigoSoft: v('--indigo-soft', '#e2e5f7'),
      haldi: v('--haldi', '#c99200'), haldiSoft: v('--haldi-soft', '#fbf0cf'),
      sindoor: v('--sindoor', '#c0402c'), ok: v('--ok', '#1d7a4b'), bad: v('--bad', '#b3261e'),
      s1: v('--series-1', '#2d388a'), s2: v('--series-2', '#c0402c'), s3: v('--series-3', '#d99a00'), s4: v('--series-4', '#12807f'),
      font: v('--font-body', 'system-ui, sans-serif'), mono: v('--font-mono', 'ui-monospace, monospace')
    };
    T.sindoorRgb = toRgb(T.sindoor);
    return T;
  }
  function rr(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
    g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
  }
  // text on a small rounded background so it stays readable over bars and lines
  function pill(g, T, text, x, y, align, color, weight) {
    g.font = (weight || '600') + ' 11px ' + T.font;
    var w = g.measureText(text).width, px = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
    g.fillStyle = T.surface;
    rr(g, px - 3, y - 10, w + 6, 14, 3); g.fill();
    g.fillStyle = color; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.fillText(text, px, y);
    return { x: px - 3, w: w + 6 };
  }

  /* ---------- mount ---------- */
  function mount(root, ctx) {
    var P = 'dr' + (++mountCount) + '-';
    var listeners = [];
    function on(el, type, fn, opts) { el.addEventListener(type, fn, opts); listeners.push([el, type, fn, opts]); }
    var destroyed = false;

    function rangeCtl(id, label, min, max, step, val, out, help) {
      return '<div class="control"><label for="' + P + id + '">' + label + ' <output id="' + P + id + 'out" for="' + P + id + '">' + out + '</output></label>' +
        '<input type="range" id="' + P + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '" aria-valuetext="' + esc(out) + '"' + (help ? ' aria-describedby="' + P + id + 'help"' : '') + '>' +
        (help ? '<p class="small muted" id="' + P + id + 'help">' + help + '</p>' : '') + '</div>';
    }
    var tasksHtml = TASKS.map(function (t) { return '<li data-task="' + t.id + '">' + t.text + '</li>'; }).join('');
    var legend = function (items) {
      return '<div class="lab-legend">' + items.map(function (it) { return '<span style="--c:var(' + it[0] + ')">' + it[1] + '</span>'; }).join('') + '</div>';
    };
    var statHtml = function (id, k) {
      return '<div class="stat"><div class="k" id="' + P + id + 'k">' + k + '</div><div class="v" id="' + P + id + '">—</div><div class="small muted" id="' + P + id + 's" style="line-height:1.35">&nbsp;</div></div>';
    };

    var top = document.createElement('div');
    top.className = 'lab';
    top.innerHTML =
      '<p class="lab-note"><strong>What you are seeing:</strong> a bank’s model checks every UPI payment and flags likely fraud. It is a simple rule learned from past payments: flag a payment if its amount is above a cutoff, with one cutoff by day (6 am to 10 pm) and another at night. ' +
      'The weekly chart follows its first 12 weeks in use. Each week the <em>PSI</em> (Population Stability Index, a drift score) compares that week’s payment amounts with the training data. <em>Drift</em> means the live data has stopped looking like the data the model learned from. ' +
      '<em>Accuracy</em> (the share of payments judged correctly) and <em>recall</em> (the share of real frauds caught) need <em>labels</em> (confirmed answers: was it really fraud?), and labels arrive only after customers complain and the bank checks, weeks later.</p>' +
      '<p class="small muted">PSI = the sum, over 10 amount bins, of (a − e) × ln(a ÷ e), where e is the bin’s share of the training data and a is its share this week (as fractions, so 12% is 0.12). An empty bin counts as 0.0001 so the log still works. Rule of thumb: under 0.1 is stable, 0.1 to 0.25 is a moderate change, over 0.25 is a major change. The payments are made up: 4,000 a week, about 1 in 20 of them fraud (far more than in real life, so the effect is easy to see).</p>' +
      '<div class="lab-body">' +
        '<div class="stack-sm">' +
          '<span class="eyebrow">Week by week since launch</span>' +
          '<div class="lab-canvas-wrap" id="' + P + 'twrap" style="aspect-ratio:auto;height:clamp(360px,36vw,440px)"><canvas id="' + P + 'tl" role="img" style="touch-action:manipulation" aria-label="Weekly monitoring chart"></canvas></div>' +
          legend([['--series-1', 'PSI'], ['--haldi', 'PSI at or over the alert line'], ['--ink', 'Accuracy'], ['--series-2', 'Recall']]) +
          '<p class="small muted">Tap a week to see its payments in the bar chart further down. The dashed lines in the lower panel are the accuracy alarm levels (accuracy under 95% or recall under 70%), and ? marks weeks whose labels are not in yet. In the alarm rows, ◆ is a drift alarm, ◇ is a false alarm before the drift started, and ■ is an accuracy alarm.</p>' +
          '<div class="row" style="gap:8px 12px">' +
            '<span style="font-weight:700">Today: week <span id="' + P + 'today">5</span> of 12</span>' +
            '<span class="row">' +
              '<button type="button" class="btn btn-sm" id="' + P + 'back">Back a week</button>' +
              '<button type="button" class="btn btn-sm btn-primary" id="' + P + 'next">Next week</button>' +
              '<button type="button" class="btn btn-sm" id="' + P + 'play">Play</button>' +
              '<button type="button" class="btn btn-sm" id="' + P + 'over">Start over</button>' +
            '</span>' +
          '</div>' +
          '<div class="callout callout-indigo small" id="' + P + 'msg" style="min-height:4.4em"></div>' +
          '<div class="visually-hidden" role="status" aria-live="polite" id="' + P + 'live"></div>' +
          '<div class="lab-stats" style="grid-template-columns:repeat(3,minmax(0,1fr))">' +
            statHtml('spsi', 'PSI') + statHtml('sacc', 'Accuracy') + statHtml('srec', 'Recall') +
            statHtml('sdrift', 'Drift alarm') + statHtml('sfalse', 'False alarms') + statHtml('sacca', 'Accuracy alarm') +
          '</div>' +
          rangeCtl('sel', 'Week shown in the bar chart', 1, 5, 1, 5, 'week 5', '') +
          '<span class="eyebrow" id="' + P + 'htitle">Week 5 compared with the training data</span>' +
          '<div class="lab-canvas-wrap" id="' + P + 'hwrap" style="aspect-ratio:auto;height:clamp(230px,24vw,270px)"><canvas id="' + P + 'hist" role="img" style="touch-action:auto" aria-label="Bar chart of payment amounts"></canvas></div>' +
          '<div class="lab-legend" id="' + P + 'hleg"></div>' +
          '<p class="small" id="' + P + 'model"></p>' +
          '<details class="fold"><summary>See the PSI sum, bin by bin</summary><div>' +
            '<div class="table-wrap" tabindex="0" role="region" aria-label="PSI sum, bin by bin"><table class="simple" style="font-variant-numeric:tabular-nums;font-size:.88rem"><thead><tr><th scope="col">Amount</th><th scope="col">e: training share</th><th scope="col" id="' + P + 'tha">a: week share</th><th scope="col">(a − e) × ln(a ÷ e)</th></tr></thead><tbody id="' + P + 'tbody"></tbody></table></div>' +
          '</div></details>' +
        '</div>' +
        '<div class="lab-controls">' +
          '<h2 class="lab-h">The drift</h2>' +
          '<div class="control"><span class="control-label" id="' + P + 'modelbl">What changes from the drift week</span>' +
            '<div class="seg" role="group" aria-labelledby="' + P + 'modelbl">' +
              '<button type="button" data-mode="fest" aria-pressed="false">' + MODES.fest + '</button>' +
              '<button type="button" data-mode="trick" aria-pressed="false">' + MODES.trick + '</button>' +
              '<button type="button" data-mode="both" aria-pressed="true">' + MODES.both + '</button>' +
            '</div>' +
            '<p class="small muted" id="' + P + 'modehelp"></p></div>' +
          rangeCtl('start', 'Drift starts in', 3, 10, 1, DEF.start, 'week ' + DEF.start, '') +
          rangeCtl('str', 'Drift strength', 0, 100, 10, DEF.strength, DEF.strength + '%', 'It grows to this strength over 3 weeks.') +
          '<h2 class="lab-h">Monitoring</h2>' +
          rangeCtl('thr', 'Alert threshold (PSI)', 0.02, 0.5, 0.01, DEF.thr, DEF.thr.toFixed(2), 'The drift alarm rings in any week whose PSI is at or over this line.') +
          rangeCtl('delay', 'Labels arrive', 0, 4, 1, DEF.delay, DEF.delay + ' weeks late', 'The accuracy alarm rings when a week’s labels show accuracy under 95% or recall under 70%.') +
          '<h2 class="lab-h">Retraining</h2>' +
          rangeCtl('win', 'Retraining window', 1, 6, 1, DEF.win, DEF.win + ' weeks', 'How many of the latest labelled weeks to learn from.') +
          '<button type="button" class="btn btn-primary" id="' + P + 'retrain">Retrain on recent data</button>' +
          '<p class="small muted" id="' + P + 'rnote" style="min-height:3em"></p>' +
          '<p class="small muted">Retraining picks new day and night cutoffs that make the fewest mistakes on those weeks, counting each missed fraud as 5 mistakes (a missed fraud costs far more than a false alarm). Those weeks also become the new baseline for PSI.</p>' +
          '<div class="stack-sm"><h2 class="lab-h">Your tasks</h2><ul class="lab-tasks" id="' + P + 'tasks">' + tasksHtml + '</ul></div>' +
        '</div>' +
      '</div>' +
      '<p class="small muted"><strong style="color:var(--ink)">Why it matters in real ML:</strong> models at banks, UPI apps and shops quietly get worse as festivals, prices and scams change. Teams watch drift scores like PSI because they need no labels and warn early, then retrain on fresh data and confirm the fix with accuracy once the labels arrive.</p>';
    root.appendChild(top);

    function $(id) { return top.querySelector('#' + P + id); }
    var twrap = $('twrap'), tcan = $('tl'), hwrap = $('hwrap'), hcan = $('hist');
    var tg = tcan.getContext('2d'), hg = hcan.getContext('2d');
    var elMsg = $('msg'), elLive = $('live'), elToday = $('today');
    var btnBack = $('back'), btnNext = $('next'), btnPlay = $('play'), btnOver = $('over'), btnRetrain = $('retrain');
    var inSel = $('sel'), inStart = $('start'), inStr = $('str'), inThr = $('thr'), inDelay = $('delay'), inWin = $('win');
    var elHTitle = $('htitle'), elHLeg = $('hleg'), elModel = $('model'), elTbody = $('tbody'), elTha = $('tha'), elRNote = $('rnote'), elModeHelp = $('modehelp');
    var modeBtns = top.querySelectorAll('[data-mode]');
    var taskEls = {};
    Array.prototype.forEach.call(top.querySelectorAll('[data-task]'), function (li) { taskEls[li.getAttribute('data-task')] = li; });

    /* ---------- state ---------- */
    var S = {
      mode: DEF.mode, start: DEF.start, strength: DEF.strength, thr: DEF.thr, delay: DEF.delay, win: DEF.win,
      today: DEF.start - 1, sel: DEF.start - 1, retrains: [], playing: false
    };
    var B = getBase();
    var trainSum = realise(B.train, 0, 0, 0, B.wob);
    var trainCut = fitCut(trainSum);
    var data = { key: '', weeks: [] };
    var models = [], R = [], A = null;
    var dims = { tw: 1, th: 1, hw: 1, hh: 1, dpr: 1 };
    var geo = null;
    var playTimer = 0, started = false;
    var done = {};
    var down = null;

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
    var taskNote = '';
    function completeTask(id) {
      if (done[id]) return;
      done[id] = true;
      markLi(id);
      taskNote = 'Task done: ' + { t1: 'you found the first week of major drift.', t2: 'your alert line catches the drift with no false alarms.', t3: 'retraining brought recall back up.', t4: 'you saw the accuracy alarm lag behind the drift alarm.' }[id];
      if (ctx && ctx.onTaskDone) ctx.onTaskDone(id);
    }

    /* ---------- the simulation ---------- */
    function kOf(w) { return w < S.start ? 0 : (S.strength / 100) * Math.min(1, (w - S.start + 1) / RAMP); }
    function isDriftWeek(w) { return S.strength > 0 && w >= S.start; }
    function modelFor(w) { var m = 0; for (var i = 1; i < models.length; i++) if (models[i].at < w) m = i; return m; }
    function compute() {
      var key = S.mode + '|' + S.start + '|' + S.strength;
      if (key !== data.key) {
        data.key = key; data.weeks = [null];
        for (var w = 1; w <= WEEKS; w++) {
          var k = kOf(w);
          data.weeks.push(realise(B.weeks[w - 1], w, S.mode !== 'trick' ? k : 0, S.mode !== 'fest' ? k : 0, B.wob));
        }
      }
      models = [{ v: 1, at: 0, lo: 0, hi: 0, cut: trainCut, ref: trainSum }];
      S.retrains.slice().sort(function (a, b) { return a.at - b.at; }).forEach(function (r) {
        var sum = newSum();
        for (var w = r.lo; w <= r.hi; w++) addSum(sum, data.weeks[w]);
        models.push({ v: models.length + 1, at: r.at, lo: r.lo, hi: r.hi, cut: fitCut(sum), ref: sum });
      });
      R = [null];
      for (var w2 = 1; w2 <= WEEKS; w2++) {
        var mi = modelFor(w2), ps = psiOf(models[mi].ref, data.weeks[w2]), ev = evaluate(models[mi].cut, data.weeks[w2]);
        R.push({ m: mi, psi: ps.psi, ps: ps, acc: ev.acc, rec: ev.rec, ev: ev, bad: ev.acc < ACC_ALARM || ev.rec < REC_ALARM });
      }
      A = alarms();
    }
    function alarms() {
      var T = S.today, D = S.delay, a = { drift: [], falseW: [], trueFirst: 0, accRings: [], accFirst: 0, accFirstFor: 0, labelledTo: T - D, firstMajor: 0 };
      for (var w = 1; w <= T; w++) {
        if (R[w].psi >= S.thr) {
          a.drift.push(w);
          if (isDriftWeek(w)) { if (!a.trueFirst) a.trueFirst = w; } else a.falseW.push(w);
        }
        if (!a.firstMajor && R[w].psi > MAJOR) a.firstMajor = w;
      }
      for (var w2 = 1; w2 <= T - D; w2++) {
        if (R[w2].bad) {
          a.accRings.push(w2 + D);
          if (!a.accFirst) { a.accFirst = w2 + D; a.accFirstFor = w2; }
        }
      }
      return a;
    }
    function retrainWindow() {
      var hi = S.today - S.delay;
      if (hi < 1) return null;
      return { lo: Math.max(1, hi - S.win + 1), hi: hi };
    }

    /* ---------- tasks ---------- */
    function checkTasks(source) {
      if (source === 'select' && A.firstMajor && S.sel === A.firstMajor) completeTask('t1');
      if (A.trueFirst && A.falseW.length === 0) completeTask('t2');
      var lab = S.today - S.delay;
      outer:
      for (var w1 = 1; w1 <= lab; w1++) {
        if (R[w1].rec >= REC_ALARM) continue;
        for (var w2 = w1 + 1; w2 <= lab; w2++) {
          if (models[R[w2].m].v > models[R[w1].m].v && R[w2].rec >= REC_TARGET) { completeTask('t3'); break outer; }
        }
      }
      if (S.delay >= 2 && A.trueFirst && A.accFirst && A.trueFirst < A.accFirst) completeTask('t4');
    }

    /* ---------- messages ---------- */
    function say(html, announce) {
      if (taskNote) { html += ' <strong>' + taskNote + '</strong>'; }
      elMsg.innerHTML = html;
      if (announce && !S.playing) elLive.textContent = elMsg.textContent;
      taskNote = '';
    }
    function weekStory(w) {
      var r = R[w], s = '<strong>Week ' + w + '</strong>: PSI ' + fmtPsi(r.psi) + ' (' + band(r.psi) + ')';
      var big = 0;
      for (var i = 1; i < NB; i++) if (r.ps.terms[i] > r.ps.terms[big]) big = i;
      if (r.psi >= MODERATE) s += '. The biggest change is in ' + binName(big) + ' payments: ' + pct(r.ps.e[big], 1) + ' of the baseline, ' + pct(r.ps.a[big], 1) + ' this week';
      s += '. ';
      if (w <= S.today - S.delay) s += 'Accuracy ' + pct(r.acc, 1) + ', recall ' + pct(r.rec, 0) + '.';
      else if (w + S.delay <= WEEKS) s += 'Its labels arrive in week ' + (w + S.delay) + '.';
      else s += 'Its labels arrive after week 12, beyond this story.';
      return s;
    }
    function arrivalStory(t, prevA) {
      var r = R[t], parts = [];
      var s = '<strong>Week ' + t + ' is in.</strong> PSI ' + fmtPsi(r.psi) + ' (' + band(r.psi) + ')';
      if (r.psi >= S.thr) s += isDriftWeek(t) ? ': the drift alarm rings' : ': the drift alarm rings, but nothing has drifted yet, so it is a false alarm';
      parts.push(s + '.');
      if (t === A.firstMajor) parts.push('This is the first week with PSI above 0.25: major drift.');
      var lw = t - S.delay;
      if (lw >= 1) {
        var L = R[lw];
        var t2 = 'Labels for week ' + lw + ' just arrived: accuracy ' + pct(L.acc, 1) + ', recall ' + pct(L.rec, 0) + '.';
        if (L.bad) {
          t2 += ' <strong>The accuracy alarm rings.</strong>';
          if (A.accFirst === t && !prevA.accFirst && A.trueFirst) {
            var lead = t - A.trueFirst;
            t2 += ' The drift alarm rang in week ' + A.trueFirst + (lead > 0 ? ', ' + lead + (lead === 1 ? ' week' : ' weeks') + ' earlier, without waiting for any labels.' : '.');
          } else if (A.accFirst === t && !prevA.accFirst && isDriftWeek(lw) && R[lw].psi < MODERATE) {
            t2 += ' Yet PSI stayed low: the new trick is a small slice of all payments, so the amounts as a whole barely changed. Only the labels could reveal it.';
          }
        }
        parts.push(t2);
      } else {
        parts.push('No labels yet: the first ones (for week 1) arrive in week ' + (1 + S.delay) + '.');
      }
      return parts.join(' ');
    }
    function modeHelp() {
      return {
        fest: 'Festival season: from the drift week, daytime payments get bigger (gifts, gold, phones, travel). Fraud stays the same.',
        trick: 'Fraudsters switch to many small night-time payments of about ₹1,000, slipping under the night cutoff. Genuine payments stay the same.',
        both: 'Festival shopping makes daytime payments bigger, and at the same time fraudsters switch to small night-time payments of about ₹1,000.'
      }[S.mode];
    }

    /* ---------- render: text ---------- */
    function setOut(input, text) {
      var o = $(input.id.slice(P.length) + 'out');
      if (o) o.textContent = text;
      input.setAttribute('aria-valuetext', text);
    }
    function setStat(id, v, sub) {
      $(id).textContent = v;
      $(id + 's').innerHTML = sub ? esc(sub) : '&nbsp;';
    }
    function modelText(m) {
      var M = models[m], c = M.cut;
      var head = M.v === 1 ? '<strong>Model v1</strong> (learned from 12,000 labelled payments before launch)'
        : '<strong>Model v' + M.v + '</strong> (retrained in week ' + M.at + ' on ' + (M.lo === M.hi ? 'week ' + M.lo : 'weeks ' + M.lo + ' to ' + M.hi) + ')';
      return head + ' flags a payment as fraud if it is above <strong>' + inr(GRID[c[0]]) + '</strong> by day or above <strong>' + inr(GRID[c[1]]) + '</strong> at night.';
    }
    function renderText() {
      var T = S.today, D = S.delay, sel = S.sel, r = R[sel];
      elToday.textContent = T;
      btnBack.disabled = T <= 1;
      btnNext.disabled = T >= WEEKS;
      btnPlay.disabled = T >= WEEKS && !S.playing;
      btnPlay.textContent = S.playing ? 'Pause' : 'Play';
      inSel.max = String(T);
      inSel.value = String(sel);
      setOut(inSel, 'week ' + sel);
      Array.prototype.forEach.call(modeBtns, function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-mode') === S.mode ? 'true' : 'false'); });
      elModeHelp.textContent = modeHelp();

      // stats
      $('spsik').textContent = 'PSI, wk ' + sel;
      setStat('spsi', fmtPsi(r.psi), band(r.psi) + (r.psi >= S.thr ? ', alarm' : ''));
      $('sacck').textContent = 'Accuracy, wk ' + sel;
      $('sreck').textContent = 'Recall, wk ' + sel;
      if (sel <= T - D) {
        setStat('sacc', pct(r.acc, 1), r.acc < ACC_ALARM ? 'under 95%' : 'labels in');
        setStat('srec', pct(r.rec, 0), r.ev.tp + ' of ' + r.ev.frauds + ' frauds');
      } else {
        var due = sel + D <= WEEKS ? 'due wk ' + (sel + D) : 'after wk 12';
        setStat('sacc', '?', due); setStat('srec', '?', due);
      }
      if (A.trueFirst) setStat('sdrift', 'week ' + A.trueFirst, 'first ring in the drift');
      else setStat('sdrift', 'not yet', S.strength === 0 ? 'no drift at 0%' : T < S.start ? 'drift starts wk ' + S.start : 'PSI under the line');
      setStat('sfalse', String(A.falseW.length), A.falseW.length ? weekList(A.falseW) : 'in calm weeks');
      if (A.accFirst) setStat('sacca', 'week ' + A.accFirst, 'labels of week ' + A.accFirstFor);
      else setStat('sacca', 'not yet', T - D < 1 ? 'no labels yet' : 'labels in to wk ' + (T - D));

      // histogram titles, legend, model, table
      var M = models[r.m];
      var refName = M.v === 1 ? 'Training data (model v1)' : (M.lo === M.hi ? 'Week ' + M.lo : 'Weeks ' + M.lo + '–' + M.hi) + ' (model v' + M.v + ' baseline)';
      elHTitle.textContent = 'Week ' + sel + ' compared with ' + (M.v === 1 ? 'the training data' : 'the data model v' + M.v + ' learned from');
      elHLeg.innerHTML = '<span style="--c:var(--series-4)">' + esc(refName) + '</span><span style="--c:var(--series-1)">Week ' + sel + '</span><span style="--c:var(--ink)">Cutoffs: solid line by day, dashed at night</span>';
      elModel.innerHTML = modelText(r.m);
      elTha.textContent = 'a: week ' + sel + ' share';
      var rows = '', ref = M.ref, cur = data.weeks[sel];
      // shares under 1% get 2 decimals; an empty bin shows the 0.0001 (0.01%) stand-in
      var share = function (f, count) { return count === 0 ? '0 (0.01%)' : pct(f, f < 0.01 ? 2 : 1); };
      for (var i = 0; i < NB; i++) {
        rows += '<tr><td style="white-space:nowrap">' + binName(i) + '</td><td>' + share(r.ps.e[i], ref.bins[i]) + '</td><td>' + share(r.ps.a[i], cur.bins[i]) + '</td><td>' + r.ps.terms[i].toFixed(4) + '</td></tr>';
      }
      rows += '<tr><td colspan="3"><strong>PSI (total)</strong></td><td><strong>' + r.psi.toFixed(4) + '</strong></td></tr>';
      elTbody.innerHTML = rows;

      // retraining note
      var win = retrainWindow();
      var live = modelFor(T + 1);
      var note = 'Model in use now: v' + models[live].v + '. ';
      if (T >= WEEKS) { btnRetrain.disabled = true; note += 'Week 12 is the last week, so there is nothing left for a new model to score. Go back a few weeks to try retraining.'; }
      else if (!win) { btnRetrain.disabled = true; note += 'No labels have arrived yet (week 1’s labels arrive in week ' + (1 + D) + '), so there is nothing to learn from.'; }
      else {
        btnRetrain.disabled = false;
        note += 'Retraining now learns from ' + (win.lo === win.hi ? 'week ' + win.lo : 'weeks ' + win.lo + ' to ' + win.hi) + ' (the latest weeks with labels) and scores week ' + (T + 1) + ' onwards.';
        if (win.hi < S.start && S.strength > 0 && T >= S.start) note += ' Those weeks are all from before the drift, so it cannot learn the new pattern yet.';
      }
      elRNote.textContent = note;

      // canvas descriptions
      var psis = [];
      for (var w = 1; w <= T; w++) psis.push(w + ': ' + R[w].psi.toFixed(2));
      var desc = 'Weekly monitoring chart, today is week ' + T + ' of 12. PSI by week, ' + psis.join(', ') + '. Alert line at ' + S.thr.toFixed(2) + '. ';
      desc += T - D >= 1 ? 'Labels are in up to week ' + (T - D) + ', where accuracy is ' + pct(R[T - D].acc, 1) + ' and recall ' + pct(R[T - D].rec, 0) + '. ' : 'No labels have arrived yet. ';
      desc += A.trueFirst ? 'Drift alarm first rang in week ' + A.trueFirst + '. ' : 'No drift alarm during the drift yet. ';
      desc += A.falseW.length ? 'False alarms in ' + weekList(A.falseW) + '. ' : '';
      desc += A.accFirst ? 'Accuracy alarm first rang in week ' + A.accFirst + '.' : 'No accuracy alarm yet.';
      if (models.length > 1) desc += ' Retrained in ' + weekList(models.slice(1).map(function (m) { return m.at; })) + '.';
      tcan.setAttribute('aria-label', desc);
      var big = 0;
      for (var b = 1; b < NB; b++) if (r.ps.terms[b] > r.ps.terms[big]) big = b;
      hcan.setAttribute('aria-label', 'Bar chart of payment amounts in 10 bins: week ' + sel + ' compared with ' + refName.toLowerCase() + '. PSI ' + fmtPsi(r.psi) + ', ' + band(r.psi) + '. Biggest change: ' + binName(big) + ', ' + pct(r.ps.e[big], 1) + ' before and ' + pct(r.ps.a[big], 1) + ' this week. Day cutoff ' + inr(GRID[M.cut[0]]) + ', night cutoff ' + inr(GRID[M.cut[1]]) + '.');
    }

    /* ---------- render: weekly chart ---------- */
    function drawTimeline(T) {
      var g = tg, W = dims.tw, H = dims.th, dpr = dims.dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.fillStyle = T.surface; g.fillRect(0, 0, W, H);
      var narrow = W < 480;
      var Lm = narrow ? 42 : 52, Rm = 10;
      var topRow = 22, axisH = 34, stripH = 34, gapMid = 26;
      var avail = Math.max(120, H - topRow - axisH - stripH - gapMid - 10);
      var psiH = Math.round(avail * 0.6), perfH = avail - psiH;
      var psiTop = topRow, psiBot = psiTop + psiH, perfTop = psiBot + gapMid, perfBot = perfTop + perfH;
      var stripTop = perfBot + 8, row1 = stripTop + 9, row2 = stripTop + 26, axisY = stripTop + stripH + 13;
      var slot = (W - Lm - Rm) / WEEKS;
      function xc(w) { return Lm + (w - 0.5) * slot; }
      geo = { Lm: Lm, slot: slot, top: psiTop - 6, bottom: H };
      var today = S.today, D = S.delay;

      // PSI scale
      var maxP = S.thr;
      for (var w = 1; w <= today; w++) maxP = Math.max(maxP, R[w].psi);
      var ymax = maxP * 1.18;
      ymax = ymax <= 0.4 ? 0.4 : ymax <= 1 ? Math.ceil(ymax * 10) / 10 : Math.ceil(ymax * 4) / 4;
      function yp(v) { return psiBot - clamp(v / ymax, 0, 1) * psiH; }
      function yq(v) { return perfBot - v * perfH; }

      // selected week column
      g.fillStyle = T.indigoSoft;
      g.fillRect(Lm + (S.sel - 1) * slot, psiTop, slot, stripTop + stripH - psiTop);

      // PSI bands: moderate and major
      g.fillStyle = T.haldiSoft;
      g.fillRect(Lm, yp(MAJOR), W - Lm - Rm, yp(MODERATE) - yp(MAJOR));
      g.fillStyle = rgba(T.sindoorRgb, 0.10);
      g.fillRect(Lm, psiTop, W - Lm - Rm, yp(MAJOR) - psiTop);
      g.fillStyle = T.indigoSoft;
      g.globalAlpha = 0.9;
      g.fillRect(Lm + (S.sel - 1) * slot, psiTop, slot, psiBot - psiTop);
      g.globalAlpha = 1;

      // titles
      g.font = '700 12px ' + T.font; g.fillStyle = T.ink; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      g.fillText(narrow ? 'Drift score (PSI): known at once' : 'Drift score (PSI): known the same week', Lm, 14);
      g.fillText(narrow ? 'Accuracy and recall: need labels' : 'Accuracy and recall: known only when labels arrive', Lm, psiBot + 18);

      // axes and grid
      g.font = '500 11px ' + T.font; g.fillStyle = T.muted; g.textAlign = 'right';
      g.strokeStyle = T.line; g.lineWidth = 1;
      var ticks = [0, MODERATE, MAJOR], extra = [0.5, 1, 1.5, 2, 2.5, 3];
      for (var e = 0; e < extra.length; e++) if (extra[e] <= ymax + 1e-9) ticks.push(extra[e]);
      var lastY = Infinity;
      ticks.forEach(function (v) {
        var y = Math.round(yp(v)) + 0.5;
        g.beginPath(); g.moveTo(Lm, y); g.lineTo(W - Rm, y); g.stroke();
        if (Math.abs(lastY - y) >= 12 || v === 0) { g.fillText(v === 0 ? '0' : String(v), Lm - 6, y + 4); lastY = y; }
      });
      [0, 0.5, 1].forEach(function (v) {
        var y = Math.round(yq(v)) + 0.5;
        g.beginPath(); g.moveTo(Lm, y); g.lineTo(W - Rm, y); g.stroke();
        g.fillText(Math.round(v * 100) + '%', Lm - 6, y + 4);
      });

      // labels not in yet (lower panel)
      var pendLo = Math.max(1, today - D + 1);
      if (pendLo <= today) {
        var px0 = Lm + (pendLo - 1) * slot, pw = (today - pendLo + 1) * slot;
        g.save();
        g.beginPath(); g.rect(px0, perfTop, pw, perfH); g.clip();
        g.fillStyle = T.surface2; g.fillRect(px0, perfTop, pw, perfH);
        g.strokeStyle = T.line; g.lineWidth = 1;
        for (var hx = px0 - perfH; hx < px0 + pw; hx += 8) { g.beginPath(); g.moveTo(hx, perfBot); g.lineTo(hx + perfH, perfTop); g.stroke(); }
        g.restore();
        g.font = '700 14px ' + T.font; g.fillStyle = T.ink; g.textAlign = 'center';
        for (var pq = pendLo; pq <= today; pq++) g.fillText('?', xc(pq), perfTop + perfH / 2 + 5);
      }

      // alarm levels in the lower panel
      g.lineWidth = 1.2;
      g.setLineDash([3, 3]);
      g.strokeStyle = T.ink; g.beginPath(); g.moveTo(Lm, Math.round(yq(ACC_ALARM)) + 0.5); g.lineTo(W - Rm, Math.round(yq(ACC_ALARM)) + 0.5); g.stroke();
      g.strokeStyle = T.s2; g.beginPath(); g.moveTo(Lm, Math.round(yq(REC_ALARM)) + 0.5); g.lineTo(W - Rm, Math.round(yq(REC_ALARM)) + 0.5); g.stroke();
      g.setLineDash([]);

      // drift start and retrain markers
      var labels = [];
      function vline(x, color, dash, text) {
        g.strokeStyle = color; g.lineWidth = 1.5; g.setLineDash(dash);
        g.beginPath(); g.moveTo(x, psiTop); g.lineTo(x, perfBot); g.stroke(); g.setLineDash([]);
        labels.push({ x: x + 3, text: text, color: color });
      }
      if (S.strength > 0 && S.start <= WEEKS) vline(Math.round(Lm + (S.start - 1) * slot) + 0.5, T.muted, [2, 3], 'drift starts');
      for (var mi = 1; mi < models.length; mi++) vline(Math.round(Lm + models[mi].at * slot) + 0.5, T.indigo, [6, 3], 'v' + models[mi].v);

      // PSI bars
      var bw = Math.min(slot * 0.56, 26);
      for (w = 1; w <= today; w++) {
        var p = R[w].psi, y0 = yp(p), alarm = p >= S.thr;
        g.fillStyle = alarm ? T.haldi : T.s1;
        g.fillRect(xc(w) - bw / 2, y0, bw, psiBot - y0);
        if (alarm) { g.strokeStyle = T.ink; g.lineWidth = 1; g.strokeRect(xc(w) - bw / 2 + 0.5, y0 + 0.5, bw - 1, psiBot - y0 - 1); }
        if (p > ymax) { g.fillStyle = T.surface; g.fillRect(xc(w) - bw / 2, psiTop + 6, bw, 3); }
      }
      // value labels
      for (w = 1; w <= today; w++) {
        var vy = Math.max(psiTop + 11, yp(R[w].psi) - 4);
        if (w === S.sel) continue;
        if (slot >= 44) pill(g, T, R[w].psi.toFixed(2), xc(w), vy, 'center', T.muted, '500');
      }

      // alert line
      var ya = Math.round(yp(S.thr)) + 0.5;
      g.strokeStyle = T.ink; g.lineWidth = 1.5; g.setLineDash([7, 4]);
      g.beginPath(); g.moveTo(Lm, ya); g.lineTo(W - Rm, ya); g.stroke(); g.setLineDash([]);
      pill(g, T, 'alert ' + S.thr.toFixed(2), W - Rm - 3, ya - 4, 'right', T.ink, '700');

      // selected value on top
      if (S.sel <= today) {
        var sy = Math.max(psiTop + 11, yp(R[S.sel].psi) - 4);
        pill(g, T, fmtPsi(R[S.sel].psi), xc(S.sel), sy, 'center', T.ink, '700');
      }
      // marker labels along the top of the PSI panel, nudged down when they would overlap
      var used = [];
      g.font = '600 11px ' + T.font;
      labels.forEach(function (lb) {
        var w2 = g.measureText(lb.text).width + 6, x = Math.min(lb.x, W - Rm - w2), y = psiTop + 12;
        for (var tries = 0; tries < 4; tries++) {
          var hit = used.some(function (u) { return u.y === y && x < u.x + u.w && x + w2 > u.x; });
          if (!hit) break;
          y += 15;
        }
        used.push({ x: x, w: w2, y: y });
        pill(g, T, lb.text, x + 3, y, 'left', lb.color === T.muted ? T.ink : lb.color, '600');
      });

      // accuracy and recall lines (only weeks with labels)
      var lab = today - D;
      function series(key, color, shape) {
        if (lab < 1) return;
        g.strokeStyle = color; g.lineWidth = 2; g.beginPath();
        for (var w3 = 1; w3 <= lab; w3++) { var y = yq(R[w3][key]); if (w3 === 1) g.moveTo(xc(w3), y); else g.lineTo(xc(w3), y); }
        g.stroke();
        g.fillStyle = color;
        for (var w4 = 1; w4 <= lab; w4++) {
          var yy = yq(R[w4][key]);
          if (shape === 'c') { g.beginPath(); g.arc(xc(w4), yy, 3.2, 0, Math.PI * 2); g.fill(); }
          else g.fillRect(xc(w4) - 3, yy - 3, 6, 6);
        }
      }
      series('acc', T.ink, 'c');
      series('rec', T.s2, 's');

      // alarm rows
      g.font = '700 11px ' + T.font; g.fillStyle = T.ink; g.textAlign = 'left';
      g.fillText('Drift', 4, row1 + 4);
      g.fillText('Acc.', 4, row2 + 4);
      g.strokeStyle = T.line; g.lineWidth = 1;
      [row1, row2].forEach(function (y) { g.beginPath(); g.moveTo(Lm, Math.round(y) + 0.5); g.lineTo(W - Rm, Math.round(y) + 0.5); g.stroke(); });
      A.drift.forEach(function (w5) {
        var x = xc(w5), r = 6;
        g.beginPath(); g.moveTo(x, row1 - r); g.lineTo(x + r, row1); g.lineTo(x, row1 + r); g.lineTo(x - r, row1); g.closePath();
        if (isDriftWeek(w5)) { g.fillStyle = T.haldi; g.fill(); }
        else { g.fillStyle = T.surface; g.fill(); }
        g.strokeStyle = T.ink; g.lineWidth = 1.3; g.stroke();
      });
      A.accRings.forEach(function (t5) {
        var x = xc(t5);
        g.fillStyle = T.s2; g.fillRect(x - 5, row2 - 5, 10, 10);
        g.strokeStyle = T.ink; g.lineWidth = 1; g.strokeRect(x - 4.5, row2 - 4.5, 9, 9);
      });

      // week numbers and today
      g.textAlign = 'center';
      for (w = 1; w <= WEEKS; w++) {
        g.font = (w === today ? '700 ' : '500 ') + '12px ' + T.font;
        g.fillStyle = w <= today ? T.ink : T.muted;
        g.fillText(String(w), xc(w), axisY);
      }
      g.font = '700 11px ' + T.font; g.textAlign = 'left'; g.fillStyle = T.muted;
      g.fillText('Week', 4, axisY);
      g.fillStyle = T.indigo; g.textAlign = 'center';
      var tx = clamp(xc(today), Lm + 14, W - Rm - 14);
      g.fillText('today', tx, axisY + 15);
    }

    /* ---------- render: histogram ---------- */
    function amountX(a, L, slot) {
      var i = binOf(a), lo = i === 0 ? 10 : EDGES[i - 1], hi = i === NB - 1 ? 200000 : EDGES[i];
      var f = (Math.log(a) - Math.log(lo)) / (Math.log(hi) - Math.log(lo));
      return L + (i + clamp(f, 0, 1)) * slot;
    }
    function drawHist(T) {
      var g = hg, W = dims.hw, H = dims.hh, dpr = dims.dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.fillStyle = T.surface; g.fillRect(0, 0, W, H);
      var narrow = W < 480;
      var L = narrow ? 38 : 46, Rr = 10, top = 28, bot = H - 40;
      var r = R[S.sel], M = models[r.m];
      var slot = (W - L - Rr) / NB, ph = bot - top;
      var maxS = 0;
      for (var i = 0; i < NB; i++) maxS = Math.max(maxS, r.ps.e[i], r.ps.a[i]);
      var step = maxS > 0.25 ? 0.1 : 0.05, ymax = Math.max(step * 2, Math.ceil(maxS * 1.08 / step) * step);
      function y(v) { return bot - v / ymax * ph; }
      // grid
      g.strokeStyle = T.line; g.lineWidth = 1; g.font = '500 11px ' + T.font; g.fillStyle = T.muted; g.textAlign = 'right'; g.textBaseline = 'alphabetic';
      for (var v = 0; v <= ymax + 1e-9; v += step) {
        var yy = Math.round(y(v)) + 0.5;
        g.beginPath(); g.moveTo(L, yy); g.lineTo(W - Rr, yy); g.stroke();
        g.fillText(Math.round(v * 100) + '%', L - 5, yy + 4);
      }
      // bars
      var bw = Math.min(slot * 0.36, 22), gap = Math.min(2, slot * 0.05);
      for (i = 0; i < NB; i++) {
        var cx = L + (i + 0.5) * slot;
        g.fillStyle = T.s4; g.fillRect(cx - gap / 2 - bw, y(r.ps.e[i]), bw, bot - y(r.ps.e[i]));
        g.fillStyle = T.s1; g.fillRect(cx + gap / 2, y(r.ps.a[i]), bw, bot - y(r.ps.a[i]));
      }
      // x labels at bin edges
      g.fillStyle = T.muted; g.textAlign = 'center'; g.font = '500 ' + (narrow ? 10 : 11) + 'px ' + T.font;
      g.strokeStyle = T.muted;
      for (i = 0; i < EDGES.length; i++) {
        var ex = Math.round(L + (i + 1) * slot) + 0.5;
        g.beginPath(); g.moveTo(ex, bot); g.lineTo(ex, bot + 4); g.stroke();
        g.fillText(short(EDGES[i]), ex, bot + 16);
      }
      g.font = '600 11px ' + T.font; g.fillStyle = T.ink;
      g.fillText('Payment amount in ₹ (bin edges; 1k = 1,000)', L + (W - L - Rr) / 2, H - 6);
      // model cutoffs
      var xd = amountX(GRID[M.cut[0]], L, slot), xn = amountX(GRID[M.cut[1]], L, slot);
      g.strokeStyle = T.ink; g.lineWidth = 2;
      g.beginPath(); g.moveTo(Math.round(xd) + 0.5, top - 4); g.lineTo(Math.round(xd) + 0.5, bot); g.stroke();
      g.setLineDash([5, 4]);
      g.beginPath(); g.moveTo(Math.round(xn) + 0.5, top - 4); g.lineTo(Math.round(xn) + 0.5, bot); g.stroke();
      g.setLineDash([]);
      var dl = 'day ' + inr(GRID[M.cut[0]]), nl = 'night ' + inr(GRID[M.cut[1]]);
      g.font = '700 11px ' + T.font;
      var wd = g.measureText(dl).width, wn = g.measureText(nl).width;
      var leftIsNight = xn <= xd;
      var xl = leftIsNight ? xn : xd, xr = leftIsNight ? xd : xn, tl = leftIsNight ? nl : dl, tr = leftIsNight ? dl : nl, wl = leftIsNight ? wn : wd, wr = leftIsNight ? wd : wn;
      // centre each label on its line, then push apart if they collide, keeping both inside the chart
      var lx = xl - wl / 2, rx = xr - wr / 2;
      if (lx + wl + 10 > rx) { var mid = (xl + xr) / 2; lx = mid - 5 - wl; rx = mid + 5; }
      lx = clamp(lx, 4, W - 4 - wl - wr - 10); rx = clamp(rx, lx + wl + 10, W - 4 - wr);
      pill(g, T, tl, lx, 16, 'left', T.ink, '700');
      pill(g, T, tr, rx, 16, 'left', T.ink, '700');
    }

    function paint() {
      if (destroyed) return;
      var T = readTheme();
      drawTimeline(T);
      drawHist(T);
    }
    function render() { renderText(); paint(); }

    /* ---------- sizing ---------- */
    function resize() {
      if (destroyed) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      var r1 = tcan.getBoundingClientRect(), r2 = hcan.getBoundingClientRect();
      var tw = Math.max(1, Math.round(r1.width)), th = Math.max(1, Math.round(r1.height));
      var hw = Math.max(1, Math.round(r2.width)), hh = Math.max(1, Math.round(r2.height));
      if (tw === dims.tw && th === dims.th && hw === dims.hw && hh === dims.hh && dpr === dims.dpr && tcan.width > 1) return;
      dims.tw = tw; dims.th = th; dims.hw = hw; dims.hh = hh; dims.dpr = dpr;
      tcan.width = Math.round(tw * dpr); tcan.height = Math.round(th * dpr);
      hcan.width = Math.round(hw * dpr); hcan.height = Math.round(hh * dpr);
      // setting the size wipes the canvas, so repaint in the same callback
      if (started) paint();
    }

    /* ---------- actions ---------- */
    function stopPlay() {
      if (playTimer) clearTimeout(playTimer);
      playTimer = 0;
      if (S.playing) { S.playing = false; }
    }
    function goTo(t, how) {
      t = clamp(t, 1, WEEKS);
      if (t === S.today) return false;
      var prevA = A, prev = S.today, undone = [];
      if (t < prev) {
        S.retrains = S.retrains.filter(function (r) { if (r.at > t) { undone.push(r.at); return false; } return true; });
      }
      S.today = t; S.sel = t;
      compute();
      checkTasks('step');
      if (t === prev + 1) say(arrivalStory(t, prevA), how !== 'play');
      else say('Back to week ' + t + '.' + (undone.length ? ' Going back undid the retraining done in ' + weekList(undone) + '.' : ''), true);
      render();
      return true;
    }
    function playTick() {
      playTimer = 0;
      if (destroyed || !S.playing) return;
      goTo(S.today + 1, 'play');
      if (S.today >= WEEKS) { endPlay(); return; }
      playTimer = setTimeout(playTick, PLAY_MS);
    }
    function endPlay() {
      stopPlay();
      var s = 'Played to week ' + S.today + '. ';
      s += A.trueFirst ? 'The drift alarm first rang in week ' + A.trueFirst + '; ' : 'The drift alarm never rang during the drift; ';
      s += A.accFirst ? 'the accuracy alarm first rang in week ' + A.accFirst + ' (when the labels for week ' + A.accFirstFor + ' arrived).' : 'the accuracy alarm has not rung.';
      s += A.falseW.length ? ' False alarms: ' + weekList(A.falseW) + '.' : '';
      say(s, true);
      render();
    }
    function selectWeek(w) {
      w = clamp(w, 1, S.today);
      S.sel = w;
      checkTasks('select');
      say(weekStory(w), true);
      render();
    }
    function settingsChanged(msg, announce) {
      compute();
      checkTasks('settings');
      if (msg) say(msg, announce);
      render();
    }
    function thrMsg() {
      var s = 'Alert line at ' + S.thr.toFixed(2) + '. ';
      s += A.falseW.length ? 'It rang in calm ' + weekList(A.falseW) + ' (false alarms). ' : 'No false alarms in the calm weeks so far. ';
      if (S.today < S.start) s += 'The drift has not started yet (it starts in week ' + S.start + ').';
      else s += A.trueFirst ? 'During the drift it first rang in week ' + A.trueFirst + '.' : 'During the drift it has not rung yet.';
      return s;
    }

    on(btnNext, 'click', function () { stopPlay(); goTo(S.today + 1, 'next'); });
    on(btnBack, 'click', function () { stopPlay(); goTo(S.today - 1, 'back'); });
    on(btnOver, 'click', function () {
      stopPlay();
      var t = Math.max(1, S.start - 1), had = S.retrains.length > 0;
      if (t === S.today && !had) { say('Already at week ' + t + ', the last calm week before the drift. Press Next week or Play.', true); render(); return; }
      S.today = t; S.sel = t; S.retrains = [];
      compute(); checkTasks('step');
      say('Back to week ' + t + ', the last calm week before the drift' + (had ? ', with the retraining undone' : '') + '. Press Next week or Play.', true);
      render();
    });
    on(btnPlay, 'click', function () {
      if (S.playing) { endPlay(); return; }
      if (S.today >= WEEKS) return;
      S.playing = true;
      elLive.textContent = 'Playing week by week.';
      render();
      playTick();
    });
    on(inSel, 'input', function () { selectWeek(+inSel.value); });
    Array.prototype.forEach.call(modeBtns, function (b) {
      on(b, 'click', function () {
        S.mode = b.getAttribute('data-mode');
        settingsChanged(modeHelp(), true);
      });
    });
    on(inStart, 'input', function () {
      S.start = +inStart.value; setOut(inStart, 'week ' + S.start);
      settingsChanged('Drift now starts in week ' + S.start + ' and reaches full strength by week ' + Math.min(WEEKS, S.start + RAMP - 1) + '.', false);
    });
    on(inStart, 'change', function () { elLive.textContent = elMsg.textContent; });
    on(inStr, 'input', function () {
      S.strength = +inStr.value; setOut(inStr, S.strength + '%');
      settingsChanged(S.strength === 0 ? 'Drift strength 0%: nothing changes, the later weeks look like the early ones.' : 'Drift strength ' + S.strength + '%, reached ' + RAMP + ' weeks after it starts in week ' + S.start + '.', false);
    });
    on(inStr, 'change', function () { elLive.textContent = elMsg.textContent; });
    on(inThr, 'input', function () {
      S.thr = Math.round(+inThr.value * 100) / 100; setOut(inThr, S.thr.toFixed(2));
      compute(); checkTasks('settings'); say(thrMsg(), false); render();
    });
    on(inThr, 'change', function () { elLive.textContent = elMsg.textContent; });
    on(inDelay, 'input', function () {
      S.delay = +inDelay.value; setOut(inDelay, S.delay === 0 ? 'the same week' : S.delay + (S.delay === 1 ? ' week late' : ' weeks late'));
      var lab = S.today - S.delay;
      settingsChanged(S.delay === 0 ? 'Labels now arrive at the end of the same week (rare in real life), so accuracy is known up to week ' + S.today + '.'
        : 'Labels now arrive ' + S.delay + (S.delay === 1 ? ' week' : ' weeks') + ' late, so accuracy and recall are known ' + (lab >= 1 ? 'up to week ' + lab : 'for no week yet') + '.', false);
    });
    on(inDelay, 'change', function () { elLive.textContent = elMsg.textContent; });
    on(inWin, 'input', function () {
      S.win = +inWin.value; setOut(inWin, S.win + (S.win === 1 ? ' week' : ' weeks'));
      renderText();
    });
    on(btnRetrain, 'click', function () {
      var win = retrainWindow();
      if (!win || S.today >= WEEKS) return;
      var before = models[modelFor(S.today + 1)];
      S.retrains = S.retrains.filter(function (r) { return r.at !== S.today; });
      S.retrains.push({ at: S.today, lo: win.lo, hi: win.hi });
      compute();
      checkTasks('retrain');
      var after = models[modelFor(S.today + 1)];
      var s = '<strong>Model v' + after.v + '</strong> learned from ' + (win.lo === win.hi ? 'week ' + win.lo : 'weeks ' + win.lo + ' to ' + win.hi) + ': day cutoff ' + inr(GRID[before.cut[0]]) + ' → ' + inr(GRID[after.cut[0]]) + ', night cutoff ' + inr(GRID[before.cut[1]]) + ' → ' + inr(GRID[after.cut[1]]) + '. It scores week ' + (S.today + 1) + ' onwards, and those weeks are its new PSI baseline. ';
      var first = S.today + 1 + S.delay;
      s += first <= WEEKS ? 'Labels for week ' + (S.today + 1) + ' arrive in week ' + first + ': step on to check it.' : 'Its first labels would arrive after week 12, so lower the label delay or retrain earlier to check it.';
      if (win.hi < S.start && S.strength > 0) s += ' Careful: all those weeks are from before the drift.';
      say(s, true);
      render();
    });

    // tap a week on the weekly chart (a tap, not a scroll)
    function weekAt(e) {
      if (!geo) return 0;
      var rect = tcan.getBoundingClientRect(), x = e.clientX - rect.left, y = e.clientY - rect.top;
      if (y < geo.top || y > geo.bottom) return 0;
      var w = Math.floor((x - geo.Lm) / geo.slot) + 1;
      return w >= 1 && w <= WEEKS ? w : 0;
    }
    on(tcan, 'pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      down = { id: e.pointerId, x: e.clientX, y: e.clientY };
    });
    on(tcan, 'pointerup', function (e) {
      if (!down || down.id !== e.pointerId) return;
      var moved = Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y);
      down = null;
      if (moved > 12) return;
      var w = weekAt(e);
      if (!w) return;
      if (w > S.today) { say('Week ' + w + ' has not happened yet. Press Next week to move on.', true); return; }
      selectWeek(w);
    });
    on(tcan, 'pointercancel', function () { down = null; });
    on(tcan, 'pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var w = weekAt(e);
      tcan.style.cursor = w && w <= S.today ? 'pointer' : 'default';
    });

    /* ---------- theme, fonts, resize ---------- */
    function onTheme() { paint(); }
    var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mql) { if (mql.addEventListener) mql.addEventListener('change', onTheme); else if (mql.addListener) mql.addListener(onTheme); }
    on(document, 'themechange', onTheme);
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { resize(); }); ro.observe(twrap); ro.observe(hwrap); }
    else on(window, 'resize', resize);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!destroyed) paint(); });

    /* ---------- start ---------- */
    compute();
    resize();
    started = true;
    (function intro() {
      var calm = [];
      for (var w = 1; w <= S.today; w++) if (R[w].psi >= S.thr) calm.push(w);
      var s = 'Today is week ' + S.today + '. So far every week looks like the training data (PSI under 0.1)';
      s += calm.length ? ', yet the alert line at ' + S.thr.toFixed(2) + ' already rang in ' + weekList(calm) + ': salary weeks, when rent, fees and bills make payments a little bigger. Those are false alarms.' : '.';
      s += ' Labels are in up to week ' + (S.today - S.delay) + '. Press Next week to see what happens.';
      say(s, false);
    })();
    render();

    return {
      destroy: function () {
        if (destroyed) return;
        destroyed = true;
        if (playTimer) clearTimeout(playTimer);
        playTimer = 0;
        if (ro) ro.disconnect();
        if (mql) { if (mql.removeEventListener) mql.removeEventListener('change', onTheme); else if (mql.removeListener) mql.removeListener(onTheme); }
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
        listeners = [];
        if (top.parentNode) top.parentNode.removeChild(top);
      }
    };
  }

  Labs.drift = {
    id: 'drift',
    module: 'l3-mlops',
    title: 'Data drift monitor',
    summary: 'Watch a UPI fraud model drift through festival season and a new scam, catch it early with a PSI drift score, and see why accuracy alarms lag while labels are weeks late.',
    tasks: TASKS,
    mount: mount
  };
})();
