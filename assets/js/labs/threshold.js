/* AI Marg lab: classification threshold, confusion matrix, ROC / PR curves and the ₹ cost of mistakes,
   told as a UPI fraud-detection story. Plain classic script (ES2019). Registers window.AILabs.threshold.
   No libraries, no network, no storage.

   The maths in one paragraph: each payment gets a raw model output (its "log-odds") drawn from a bell
   curve with spread 1. Genuine payments are centred at -sep/2 and frauds at +sep/2. The fraud score is
   the sigmoid of that, so it lies between 0 and 1. A payment is flagged when score >= threshold t, i.e.
   when log-odds >= logit(t). So the share of a class that gets flagged is P(Z > logit(t) - centre) for a
   standard normal Z. Counts are those shares times the class sizes, rounded. For this "binormal" model
   the area under the ROC curve is exactly Phi(sep / sqrt 2). */
(function () {
  'use strict';
  var Labs = (window.AILabs = window.AILabs || {});
  var mountCount = 0;

  /* ---------- constants ---------- */
  var N = 10000;            // payments in the batch
  var STEPS = 100;          // threshold grid 0.00, 0.01 ... 1.00 (the slider uses the same grid)
  var CURVE_N = 400;        // points on the smooth ROC / PR curves
  var Z_SPAN = 9;           // log-odds range used to trace the curves (+-9 covers everything visible)
  var COST_CAP = 1000000;   // each ₹ cost input is capped at ₹10 lakh
  var AUC_GOAL = 0.97;
  var RECALL_GOAL = 0.9;
  var SWEEP_MS = 4500;
  var DEF = { ti: 50, rate: 2, sep: 2, cMiss: 5000, cFa: 50, curve: 'roc', trueScale: false };

  var TASKS = [
    { id: 't1', text: 'Get fooled by accuracy: set the fraud rate to 1% and the threshold to 1.00, so nothing is flagged. Accuracy shows 99%, but how many frauds did it catch?' },
    { id: 't2', text: 'Find the cheapest threshold: move the threshold to the spot where the total ₹ cost of mistakes is lowest (the ★ on the cost chart).' },
    { id: 't3', text: 'Catch at least 90% of frauds by moving the threshold (recall 90% or more). Then read the precision: what share of your flags are real frauds?' },
    { id: 't4', text: 'Build a better model: raise Separation until the AUC is 0.97 or more, and watch the ROC curve bend towards the top-left corner.' }
  ];

  /* ---------- maths ---------- */
  // Complementary error function, fractional error below 1.2e-7 everywhere (Numerical Recipes'
  // Chebyshev fit), so it stays accurate far out in the tails where frauds hide.
  function erfc(x) {
    var z = Math.abs(x), t = 1 / (1 + 0.5 * z);
    var r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 +
      t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 +
      t * (-0.82215223 + t * 0.17087277)))))))));
    return x >= 0 ? r : 2 - r;
  }
  function upperTail(z) { return 0.5 * erfc(z / Math.SQRT2); }   // P(Z > z) for a standard normal Z
  function Phi(z) { return 0.5 * erfc(-z / Math.SQRT2); }        // P(Z <= z)
  var INV_SQRT_2PI = 1 / Math.sqrt(2 * Math.PI);
  // share of a class (log-odds centre m) whose score is >= t
  function flagShare(t, m) {
    if (t <= 0) return 1;
    if (t >= 1) return 0;
    return upperTail(Math.log(t / (1 - t)) - m);
  }
  // density of the score s for a class with log-odds centre m (a "logit-normal" curve)
  function scoreDensity(s, m) {
    if (s <= 0 || s >= 1) return 0;
    var z = Math.log(s / (1 - s)) - m;
    return Math.exp(-0.5 * z * z) * INV_SQRT_2PI / (s * (1 - s));
  }

  /* ---------- small helpers ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  // Indian digit grouping (1,00,000), done by hand so it is the same in every browser
  function fmtInt(n) {
    n = Math.round(n);
    var neg = n < 0, s = String(Math.abs(n));
    if (s.length > 3) s = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3);
    return (neg ? '-' : '') + s;
  }
  function fmtRs(n) { return '₹' + fmtInt(n); }
  function trimNum(v, d) { return String(Number(v.toFixed(d))); }
  function fmtRsShort(v) {
    if (v >= 1e7) return '₹' + trimNum(v / 1e7, 2) + ' Cr';
    if (v >= 1e5) return '₹' + trimNum(v / 1e5, 2) + ' L';
    if (v >= 1e3) return '₹' + trimNum(v / 1e3, 1) + 'k';
    return '₹' + trimNum(v, 0);
  }
  // for the small stat box: full rupees up to ₹9,99,999, then lakh / crore
  function fmtRsStat(v) {
    if (v >= 1e7) return '₹' + (v / 1e7).toFixed(2) + ' Cr';
    if (v >= 1e6) return '₹' + (v / 1e5).toFixed(1) + ' L';
    return fmtRs(v);
  }
  function pct(x, d) { return (x * 100).toFixed(d == null ? 1 : d) + '%'; }
  function fmtT(ti) { return (ti / STEPS).toFixed(2); }
  function count(n, one, many) { return fmtInt(n) + ' ' + (n === 1 ? one : many); }
  function niceStep(span, n) {
    var raw = span / n, mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), f = raw / mag;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * mag;
  }
  function rrect(g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }
  function starPath(g, x, y, r) {
    g.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
      if (i) g.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); else g.moveTo(x + rr * Math.cos(a), y + rr * Math.sin(a));
    }
    g.closePath();
  }
  function sepWord(d) {
    return d < 0.5 ? 'useless, about a coin toss' : d < 1.5 ? 'weak' : d < 2.5 ? 'decent' : d < 3.5 ? 'strong' : 'excellent';
  }
  function readTheme() {
    var cs = getComputedStyle(document.documentElement);
    function v(n, fb) { var x = cs.getPropertyValue(n).trim(); return x || fb; }
    return {
      surface: v('--surface', '#fff'), surface2: v('--surface-2', '#eee'), ink: v('--ink', '#111'),
      muted: v('--muted', '#666'), line: v('--line', '#ddd'), haldi: v('--haldi', '#e2a400'),
      haldiInk: v('--haldi-ink', v('--ink', '#111')), haldiSoft: v('--haldi-soft', '#fbf0cf'),
      ok: v('--ok', '#1d7a4b'), bad: v('--bad', '#b3261e'),
      s1: v('--series-1', '#2d388a'), s2: v('--series-2', '#c0402c'), s4: v('--series-4', '#12807f'),
      font: v('--font-body', 'system-ui, sans-serif'), mono: v('--font-mono', 'monospace')
    };
  }

  /* ================================================================ */
  function mount(root, ctx) {
    var P = 'th' + (++mountCount) + '-';
    var listeners = [];
    function on(el, type, fn, opts) { el.addEventListener(type, fn, opts); listeners.push([el, type, fn, opts]); }
    var destroyed = false;

    /* ---------- legend swatches (inline SVG, coloured through CSS variables) ---------- */
    function svgWrap(inner) { return '<svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true" focusable="false" style="flex:none">' + inner + '</svg>'; }
    function swArea(c) { return svgWrap('<rect x="1" y="1" width="16" height="10" rx="2" style="fill:' + c + ';fill-opacity:.3;stroke:' + c + ';stroke-width:1.5"/>'); }
    function swHatch(c) { return svgWrap('<rect x="1" y="1" width="16" height="10" rx="2" style="fill:none;stroke:' + c + ';stroke-width:1.2"/><path d="M2 10 L9 2 M7 11 L15 2 M13 11 L17 6" style="stroke:' + c + ';stroke-width:1.3;fill:none"/>'); }
    function swLine(c, dash, w) { return svgWrap('<line x1="1" y1="6" x2="17" y2="6" style="stroke:' + c + ';stroke-width:' + w + ';stroke-linecap:round' + (dash ? ';stroke-dasharray:4 3' : '') + '"/>'); }
    function swDot(c) { return svgWrap('<circle cx="9" cy="6" r="4.5" style="fill:' + c + ';stroke:var(--ink);stroke-width:1.2"/>'); }
    function swStar(c) { return svgWrap('<polygon points="9,0.5 10.6,4.3 14.7,4.6 11.6,7.3 12.5,11.3 9,9.2 5.5,11.3 6.4,7.3 3.3,4.6 7.4,4.3" style="fill:' + c + '"/>'); }
    function legendItem(sw, html) { return '<div style="display:inline-flex;align-items:center;gap:6px">' + sw + html + '</div>'; }
    var CHECK_ROW = 'display:grid;grid-template-columns:18px minmax(0,1fr);gap:10px;align-items:start';
    var tasksHtml = TASKS.map(function (t) { return '<li data-task="' + t.id + '">' + t.text + '</li>'; }).join('');
    var CELL = 'vertical-align:top;border:3px solid var(--surface);padding:10px;border-radius:10px;';
    function cell(key, bg, name, meaning, withCost) {
      return '<td style="' + CELL + 'background:' + bg + '">' +
        '<div class="num" id="' + P + 'v' + key + '" style="font-family:var(--font-mono);font-size:1.3rem;font-weight:600;line-height:1.2">0</div>' +
        '<div style="font-weight:700;font-size:.85rem;line-height:1.3;margin-top:2px">' + name + '</div>' +
        '<div class="muted" style="font-size:.8rem;line-height:1.35">' + meaning + '</div>' +
        (withCost ? '<div id="' + P + 'k' + key + '" class="num" style="font-size:.8rem;line-height:1.35;color:var(--bad);font-weight:600;margin-top:2px"></div>' : '') +
      '</td>';
    }
    var STAT = 'display:flex;flex-direction:column;justify-content:space-between;gap:2px';
    var TH = 'font-size:.72rem;letter-spacing:.04em;line-height:1.3;padding:6px 8px;border:0;vertical-align:bottom;';

    root.innerHTML =
      '<div class="lab">' +
        '<p class="lab-note"><strong>What you are seeing:</strong> a fraud model has given each of 10,000 UPI payments a <em>fraud score</em> from 0 (looks safe) to 1 (looks like fraud). ' +
        'The <b>top hump</b> shows where the genuine payments landed and the <b>bottom hump</b> shows the frauds. The humps overlap, so no cut-off is perfect. ' +
        'The <em>threshold</em> (the yellow line) is your cut-off: every payment scoring at or above it is <em>flagged</em> (held, and the customer gets a call). ' +
        'Drag the line and watch the four kinds of result, the scores and the ₹ cost change.</p>' +
        '<div class="lab-body">' +
          '<div class="stack">' +
            '<div class="stack-sm">' +
              '<div class="lab-canvas-wrap" id="' + P + 'dwrap" style="aspect-ratio:2/1;min-height:270px;max-height:420px">' +
                '<canvas id="' + P + 'dist" role="img" tabindex="0" aria-describedby="' + P + 'kbd" aria-label="Score humps" style="touch-action:pan-y;cursor:ew-resize;outline-offset:-3px"></canvas></div>' +
              '<div class="lab-legend">' +
                legendItem(swArea('var(--series-1)'), 'Genuine payments (top): <b class="num" id="' + P + 'lg">9,800</b>') +
                legendItem(swArea('var(--series-2)'), 'Frauds (bottom): <b class="num" id="' + P + 'lf">200</b>') +
                legendItem(swHatch('var(--muted)'), 'Striped = mistakes') +
                legendItem(swLine('var(--haldi)', false, 3), 'Threshold') +
              '</div>' +
            '</div>' +
            '<div class="control">' +
              '<label for="' + P + 't">Threshold: flag if the score is at least <output id="' + P + 'tout" for="' + P + 't">0.50</output></label>' +
              '<input type="range" id="' + P + 't" min="0" max="1" step="0.01" value="0.50">' +
            '</div>' +
            '<p class="small" id="' + P + 'msg" role="status" aria-live="polite" style="min-height:3.4em"></p>' +
            '<div class="lab-stats">' +
              '<div class="stat" style="' + STAT + '"><div class="k">Accuracy</div><div class="v" id="' + P + 'sacc">—</div></div>' +
              '<div class="stat" style="' + STAT + '"><div class="k">Precision</div><div class="v" id="' + P + 'sprec">—</div></div>' +
              '<div class="stat" style="' + STAT + '"><div class="k">Recall</div><div class="v" id="' + P + 'srec">—</div></div>' +
              '<div class="stat" style="' + STAT + '"><div class="k">F1 score</div><div class="v" id="' + P + 'sf1">—</div></div>' +
              '<div class="stat" style="' + STAT + '"><div class="k">False-alarm rate</div><div class="v" id="' + P + 'sfpr">—</div></div>' +
              '<div class="stat" style="' + STAT + '"><div class="k">Total cost</div><div class="v" id="' + P + 'scost">—</div></div>' +
            '</div>' +
            '<details class="fold"><summary>How each number is worked out, with today’s counts</summary><div id="' + P + 'formulas" class="small stack-sm"></div></details>' +
            '<div style="display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(min(100%,290px),1fr));align-items:start">' +
              '<div class="stack-sm">' +
                '<div class="row-between"><strong>Confusion matrix</strong><span class="small muted">out of 10,000 payments</span></div>' +
                '<div class="table-wrap"><table id="' + P + 'cm" style="width:100%;table-layout:fixed;border-collapse:separate;border-spacing:0">' +
                  '<caption class="visually-hidden">Confusion matrix: rows are what each payment really was, columns are what the model did</caption>' +
                  '<colgroup><col style="width:27%"><col><col></colgroup>' +
                  '<thead><tr><td style="border:0"></td>' +
                    '<th scope="col" class="muted" style="' + TH + 'text-align:left">ALLOWED<br><span style="text-transform:none;letter-spacing:0;font-weight:400">model says genuine</span><br><b class="num" id="' + P + 'hn" style="font-size:.8rem;color:var(--ink)">0</b></th>' +
                    '<th scope="col" class="muted" style="' + TH + 'text-align:left">FLAGGED<br><span style="text-transform:none;letter-spacing:0;font-weight:400">model says fraud</span><br><b class="num" id="' + P + 'hf" style="font-size:.8rem;color:var(--ink)">0</b></th>' +
                  '</tr></thead><tbody>' +
                  '<tr><th scope="row" style="' + TH + 'vertical-align:middle;text-align:left;color:var(--series-1)">REALLY GENUINE<br><b class="num" id="' + P + 'rg" style="font-size:.8rem">0</b></th>' +
                    cell('TN', 'var(--ok-soft)', 'True negative (TN)', 'genuine, let through', false) +
                    cell('FP', 'var(--bad-soft)', 'False positive (FP)', 'false alarm: an honest customer is stopped', true) + '</tr>' +
                  '<tr><th scope="row" style="' + TH + 'vertical-align:middle;text-align:left;color:var(--series-2)">REALLY FRAUD<br><b class="num" id="' + P + 'rf" style="font-size:.8rem">0</b></th>' +
                    cell('FN', 'var(--bad-soft)', 'False negative (FN)', 'missed fraud: the money is gone', true) +
                    cell('TP', 'var(--ok-soft)', 'True positive (TP)', 'fraud caught', false) + '</tr>' +
                '</tbody></table></div>' +
                '<p class="small muted">A <em>confusion matrix</em> is a 2×2 table that counts right answers (green) and the two kinds of mistake (red). The layout matches the chart above and scikit-learn’s <code>confusion_matrix</code>.</p>' +
              '</div>' +
              '<div class="stack-sm">' +
                '<div class="row-between"><div class="row"><strong id="' + P + 'ctitle">ROC curve</strong><span class="chip chip-en-in num" id="' + P + 'auc">AUC</span></div>' +
                  '<div class="seg" role="group" aria-label="Which curve to show">' +
                    '<button type="button" data-curve="roc" aria-pressed="true">ROC</button>' +
                    '<button type="button" data-curve="pr" aria-pressed="false">Precision–recall</button>' +
                  '</div></div>' +
                '<div class="lab-canvas-wrap" id="' + P + 'rwrap" style="aspect-ratio:1/1;max-height:400px">' +
                  '<canvas id="' + P + 'roc" role="img" tabindex="0" aria-describedby="' + P + 'kbd" aria-label="ROC curve" style="cursor:pointer;outline-offset:-3px"></canvas></div>' +
                '<div class="lab-legend">' +
                  legendItem(swLine('var(--series-4)', false, 2.5), 'Every threshold') +
                  legendItem(swDot('var(--haldi)'), 'Your threshold') +
                  legendItem(swStar('var(--ok)'), 'Cheapest') +
                  legendItem(swLine('var(--muted)', true, 1.5), 'Random guessing') +
                '</div>' +
                '<p class="small muted" id="' + P + 'cnote"></p>' +
              '</div>' +
            '</div>' +
            '<div class="stack-sm">' +
              '<strong>The ₹ cost of mistakes</strong>' +
              '<div style="display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr))">' +
                '<div class="control"><label for="' + P + 'cmiss">Cost of one missed fraud (₹)</label>' +
                  '<input type="number" id="' + P + 'cmiss" min="0" max="' + COST_CAP + '" step="500" value="5000" inputmode="numeric">' +
                  '<span class="small muted">money the customer or the bank loses</span></div>' +
                '<div class="control"><label for="' + P + 'cfa">Cost of one false alarm (₹)</label>' +
                  '<input type="number" id="' + P + 'cfa" min="0" max="' + COST_CAP + '" step="10" value="50" inputmode="numeric">' +
                  '<span class="small muted">a support call and an annoyed customer</span></div>' +
              '</div>' +
              '<p class="small" id="' + P + 'csum"></p>' +
              '<div class="lab-canvas-wrap" id="' + P + 'kwrap" style="aspect-ratio:5/2;min-height:220px;max-height:320px">' +
                '<canvas id="' + P + 'cost" role="img" tabindex="0" aria-describedby="' + P + 'kbd" aria-label="Cost chart" style="touch-action:pan-y;cursor:ew-resize;outline-offset:-3px"></canvas></div>' +
              '<div class="lab-legend">' +
                legendItem(swArea('var(--series-1)'), 'False alarms × <b class="num" id="' + P + 'lfa">₹50</b>') +
                legendItem(swArea('var(--series-2)'), 'Missed frauds × <b class="num" id="' + P + 'lmi">₹5,000</b>') +
                legendItem(swLine('var(--ink)', false, 2), 'Total') +
                legendItem(swStar('var(--ok)'), 'Cheapest threshold') +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="lab-controls">' +
            '<div class="control"><label for="' + P + 'rate">Fraud rate <output id="' + P + 'rateout" for="' + P + 'rate">2%</output></label>' +
              '<input type="range" id="' + P + 'rate" min="1" max="30" step="1" value="2">' +
              '<p class="small muted" id="' + P + 'ratedesc"></p></div>' +
            '<div class="control"><label for="' + P + 'sep">Separation: how far apart the humps are <output id="' + P + 'sepout" for="' + P + 'sep">2.0</output></label>' +
              '<input type="range" id="' + P + 'sep" min="0" max="4" step="0.1" value="2">' +
              '<p class="small muted" id="' + P + 'sepdesc"></p></div>' +
            '<div style="' + CHECK_ROW + '"><input type="checkbox" id="' + P + 'true"><label for="' + P + 'true" class="small">Draw both humps to the same scale (true counts). Normally each hump is stretched to fill its half.</label></div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
              '<button type="button" class="btn btn-primary" id="' + P + 'sweep">Sweep 1 → 0</button>' +
              '<button type="button" class="btn" id="' + P + 'reset">Reset</button>' +
            '</div>' +
            '<p class="kbd-hint" id="' + P + 'kbd">Drag or tap any chart to move the threshold. Keyboard: Tab to a chart, then use the arrow keys (hold Shift for steps of 0.10). “Sweep” slides the threshold from 1 down to 0 so you can watch every number change.</p>' +
            '<div class="stack-sm"><h4>Your tasks</h4><ul class="lab-tasks">' + tasksHtml + '</ul></div>' +
          '</div>' +
        '</div>' +
        '<p class="small muted"><strong style="color:var(--ink)">Why it matters in real ML:</strong> a classifier only gives a score; people choose the threshold. Fraud, spam and disease-screening teams choose it from the ₹ cost of each kind of mistake, not from accuracy, and they compare models with ROC-AUC or precision–recall curves before picking one.</p>' +
      '</div>';

    function $(id) { return root.querySelector('#' + P + id); }
    var elT = $('t'), elTOut = $('tout'), elMsg = $('msg');
    var elRate = $('rate'), elRateOut = $('rateout'), elRateDesc = $('ratedesc');
    var elSep = $('sep'), elSepOut = $('sepout'), elSepDesc = $('sepdesc');
    var elTrue = $('true'), btnSweep = $('sweep'), btnReset = $('reset');
    var elMiss = $('cmiss'), elFa = $('cfa'), elCsum = $('csum'), elFormulas = $('formulas');
    var elAuc = $('auc'), elCTitle = $('ctitle'), elCNote = $('cnote');
    var curveBtns = root.querySelectorAll('[data-curve]');
    var stat = { acc: $('sacc'), prec: $('sprec'), rec: $('srec'), f1: $('sf1'), fpr: $('sfpr'), cost: $('scost') };
    var cm = { TN: $('vTN'), FP: $('vFP'), FN: $('vFN'), TP: $('vTP'), kFP: $('kFP'), kFN: $('kFN'), hn: $('hn'), hf: $('hf'), rg: $('rg'), rf: $('rf') };
    var lg = { g: $('lg'), f: $('lf'), fa: $('lfa'), mi: $('lmi') };
    var taskEls = {};
    Array.prototype.forEach.call(root.querySelectorAll('[data-task]'), function (li) { taskEls[li.getAttribute('data-task')] = li; });

    function makeCanvas(wrapId, canvasId) {
      var cv = $(canvasId);
      return { wrap: $(wrapId), cv: cv, g: cv.getContext('2d'), w: 1, h: 1, sx: 1, sy: 1, geo: null };
    }
    var CV = { dist: makeCanvas('dwrap', 'dist'), roc: makeCanvas('rwrap', 'roc'), cost: makeCanvas('kwrap', 'cost') };

    /* ---------- state ---------- */
    var S = {};
    function setDefaults() { for (var k in DEF) if (Object.prototype.hasOwnProperty.call(DEF, k)) S[k] = DEF[k]; }
    setDefaults();
    var M = {
      Nf: 0, Ng: 0, best: 0, auc: 0.5, ap: 0,
      tp: new Float64Array(STEPS + 1), fp: new Float64Array(STEPS + 1), cost: new Float64Array(STEPS + 1),
      rocX: new Float64Array(CURVE_N + 1), rocY: new Float64Array(CURVE_N + 1), prec: new Float64Array(CURVE_N + 1)
    };
    var done = {};
    var rafId = 0, dirty = false, sweep = null, sweepNote = '';

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
    TASKS.forEach(function (t) {
      if (ctx && ctx.isTaskDone && ctx.isTaskDone(t.id)) { done[t.id] = true; markLi(t.id); }
    });
    function completeTask(id) {
      if (done[id]) return;
      done[id] = true;
      markLi(id);
      if (ctx && ctx.onTaskDone) ctx.onTaskDone(id);
    }

    /* ---------- the model ---------- */
    function computeModel() {
      var Nf = Math.round(N * S.rate / 100), Ng = N - Nf, mg = -S.sep / 2, mf = S.sep / 2, i, k;
      M.Nf = Nf; M.Ng = Ng;
      var best = 0;
      for (i = 0; i <= STEPS; i++) {
        var t = i / STEPS;
        M.tp[i] = Math.round(Nf * flagShare(t, mf));
        M.fp[i] = Math.round(Ng * flagShare(t, mg));
        M.cost[i] = (Nf - M.tp[i]) * S.cMiss + M.fp[i] * S.cFa;
        if (M.cost[i] < M.cost[best]) best = i;
      }
      M.best = best;
      M.auc = Phi(S.sep / Math.SQRT2);
      // smooth curves: walk the log-odds cut-off from +Z_SPAN (flag nothing) to -Z_SPAN (flag everything)
      var ap = 0;
      for (k = 0; k <= CURVE_N; k++) {
        var z = Z_SPAN - 2 * Z_SPAN * k / CURVE_N;
        var fpr = upperTail(z - mg), tpr = upperTail(z - mf), den = Nf * tpr + Ng * fpr;
        M.rocX[k] = fpr; M.rocY[k] = tpr;
        M.prec[k] = den > 0 ? Nf * tpr / den : 1;
        if (k) ap += (M.rocY[k] - M.rocY[k - 1]) * (M.prec[k] + M.prec[k - 1]) / 2;
      }
      M.ap = ap + M.rocY[0] * M.prec[0];
    }
    function cur(i) {
      var tp = M.tp[i], fp = M.fp[i], fn = M.Nf - tp, tn = M.Ng - fp;
      return {
        tp: tp, fp: fp, fn: fn, tn: tn, flagged: tp + fp,
        acc: (tp + tn) / N, prec: tp + fp > 0 ? tp / (tp + fp) : null, rec: tp / M.Nf,
        fpr: fp / M.Ng, f1: 2 * tp / (2 * tp + fp + fn), cost: M.cost[i]
      };
    }
    // costs are whole rupees, so this is an exact match (several thresholds can tie for cheapest)
    function atCheapest(i) { return M.cost[i] <= M.cost[M.best] + 0.5; }
    // a flat cost curve (e.g. both costs set to ₹0) has no real cheapest point to find
    function costIsFlat() { var lo = Infinity, hi = -Infinity; for (var i = 0; i <= STEPS; i++) { if (M.cost[i] < lo) lo = M.cost[i]; if (M.cost[i] > hi) hi = M.cost[i]; } return hi - lo < 0.5; }

    /* ---------- text ---------- */
    function messageHTML(c) {
      var Nf = M.Nf, Ng = M.Ng, s;
      if (c.flagged === 0) {
        s = '<b>Nothing is flagged</b>, so every payment goes straight through. Accuracy is <b>' + pct(c.acc) + '</b> only because ' +
          pct(Ng / N, 0) + ' of payments are genuine, yet <b>all ' + fmtInt(Nf) + ' frauds slip past</b> (recall 0%). When one class is rare, accuracy can fool you.';
      } else if (c.tn === 0 && c.fn === 0) {
        s = '<b>Everything is flagged.</b> All ' + fmtInt(Nf) + ' frauds are caught (recall 100%), but so are all ' + fmtInt(Ng) +
          ' genuine payments, so precision is only ' + pct(c.prec) + ', the same as the fraud rate.';
      } else {
        s = 'You flag <b>' + count(c.flagged, 'payment', 'payments') + '</b>. They include <b>' + fmtInt(c.tp) + ' of the ' + fmtInt(Nf) +
          ' frauds</b>, so recall is <b>' + pct(c.rec) + '</b>. ';
        if (c.fp === 0) s += 'None of them is an honest customer, so precision is <b>100%</b>.';
        else s += 'The other <b>' + fmtInt(c.fp) + '</b> ' + (c.fp === 1 ? 'is an honest customer' : 'are honest customers') +
          ', so only <b>' + pct(c.prec) + '</b> of your flags are real fraud (precision).';
      }
      if (sweepNote) s += ' <span class="muted">' + sweepNote + '</span>';
      return s;
    }
    function formulasHTML(c) {
      var lines = [];
      function row(name, formula, meaning) { lines.push('<p><b>' + name + '</b> = ' + formula + '<br><span class="muted">' + meaning + '</span></p>'); }
      row('Accuracy', '(TP + TN) ÷ all = (' + fmtInt(c.tp) + ' + ' + fmtInt(c.tn) + ') ÷ 10,000 = <b>' + pct(c.acc) + '</b>',
        'the share of all payments the model got right.');
      row('Precision', 'TP ÷ (TP + FP) = ' + (c.flagged ? fmtInt(c.tp) + ' ÷ ' + fmtInt(c.flagged) + ' = <b>' + pct(c.prec) + '</b>' : '0 ÷ 0, not defined because nothing is flagged'),
        'of the payments you flagged, the share that really are fraud.');
      row('Recall', 'TP ÷ (TP + FN) = ' + fmtInt(c.tp) + ' ÷ ' + fmtInt(M.Nf) + ' = <b>' + pct(c.rec) + '</b>',
        'of all real frauds, the share you caught. Also called sensitivity or true-positive rate (TPR).');
      row('F1 score', '2 × TP ÷ (2 × TP + FP + FN) = ' + fmtInt(2 * c.tp) + ' ÷ ' + fmtInt(2 * c.tp + c.fp + c.fn) + ' = <b>' + pct(c.f1) + '</b>',
        'one number that is high only when precision and recall are both high (their harmonic mean, a kind of average that punishes a low value).');
      row('False-alarm rate', 'FP ÷ (FP + TN) = ' + fmtInt(c.fp) + ' ÷ ' + fmtInt(M.Ng) + ' = <b>' + pct(c.fpr) + '</b>',
        'of all genuine payments, the share wrongly flagged. Also called the false-positive rate (FPR).');
      row('Total cost', 'FN × ' + fmtRs(S.cMiss) + ' + FP × ' + fmtRs(S.cFa) + ' = ' + fmtInt(c.fn) + ' × ' + fmtRs(S.cMiss) + ' + ' + fmtInt(c.fp) + ' × ' + fmtRs(S.cFa) + ' = <b>' + fmtRs(c.cost) + '</b>',
        'what this batch of mistakes costs. Correct answers cost nothing here.');
      row('AUC', '<b>' + M.auc.toFixed(3) + '</b>',
        'area under the ROC curve: the chance that a random fraud gets a higher score than a random genuine payment. 0.5 = coin toss, 1 = perfect.');
      lines.push('<p class="muted">How the scores are made: each payment gets a raw model output (its log-odds) from a bell curve with spread 1, centred at ' +
        (S.sep > 0 ? '−' + (S.sep / 2).toFixed(2) + ' for genuine payments and +' + (S.sep / 2).toFixed(2) + ' for frauds' : '0 for both kinds of payment') + '. The sigmoid function squashes it into a score between 0 and 1. ' +
        'For this kind of model AUC = Φ(separation ÷ √2), where Φ is the bell-curve area function. The counts are the expected numbers out of 10,000, rounded.</p>');
      return lines.join('');
    }

    function syncUI() {
      var c = cur(S.ti), Nf = M.Nf, Ng = M.Ng, best = cur(M.best), cheapest = atCheapest(S.ti);
      var tStr = fmtT(S.ti);
      elT.value = tStr; elTOut.textContent = tStr;
      elRate.value = String(S.rate); elRateOut.textContent = S.rate + '%';
      elRateDesc.textContent = fmtInt(Nf) + ' frauds and ' + fmtInt(Ng) + ' genuine payments in this batch. Real UPI fraud is far rarer than 1%; bigger rates here let you see the frauds.';
      elSep.value = S.sep.toFixed(1); elSepOut.textContent = S.sep.toFixed(1);
      elSepDesc.textContent = 'This model is ' + sepWord(S.sep) + ' (AUC ' + M.auc.toFixed(3) + '). 0 = the humps sit on top of each other; 4 = they barely overlap.';
      lg.g.textContent = fmtInt(Ng); lg.f.textContent = fmtInt(Nf);
      lg.fa.textContent = fmtRs(S.cFa); lg.mi.textContent = fmtRs(S.cMiss);

      stat.acc.textContent = pct(c.acc);
      stat.prec.textContent = c.prec == null ? '—' : pct(c.prec);
      stat.rec.textContent = pct(c.rec);
      stat.f1.textContent = pct(c.f1);
      stat.fpr.textContent = pct(c.fpr);
      stat.cost.textContent = fmtRsStat(c.cost);

      cm.TN.textContent = fmtInt(c.tn); cm.FP.textContent = fmtInt(c.fp);
      cm.FN.textContent = fmtInt(c.fn); cm.TP.textContent = fmtInt(c.tp);
      cm.kFP.textContent = '× ' + fmtRs(S.cFa) + ' = ' + fmtRs(c.fp * S.cFa);
      cm.kFN.textContent = '× ' + fmtRs(S.cMiss) + ' = ' + fmtRs(c.fn * S.cMiss);
      cm.hn.textContent = fmtInt(c.tn + c.fn); cm.hf.textContent = fmtInt(c.flagged);
      cm.rg.textContent = fmtInt(Ng); cm.rf.textContent = fmtInt(Nf);

      elMsg.innerHTML = messageHTML(c);
      elFormulas.innerHTML = formulasHTML(c);

      var pr = S.curve === 'pr';
      elCTitle.textContent = pr ? 'Precision–recall curve' : 'ROC curve';
      elAuc.textContent = pr ? 'PR-AUC ' + M.ap.toFixed(3) : 'AUC ' + M.auc.toFixed(3);
      elCNote.innerHTML = pr
        ? 'For every threshold: recall across, precision up. The shaded area (PR-AUC) is <b>' + M.ap.toFixed(3) + '</b>. Random guessing gets a precision equal to the fraud rate (' + S.rate + '%). ' +
          'Try changing the fraud rate: this curve moves, but the ROC curve does not. That is why precision–recall curves are more honest when positives are rare. Tap the curve to jump to that threshold.'
        : 'ROC (receiver operating characteristic) curve: for every threshold, the false-alarm rate across and recall up. The shaded area is the AUC (area under the curve) = <b>' + M.auc.toFixed(3) + '</b>: ' +
          'pick one fraud and one genuine payment at random, and ' + pct(M.auc) + ' of the time the fraud gets the higher score. Tap the curve to jump to that threshold.';
      Array.prototype.forEach.call(curveBtns, function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-curve') === S.curve ? 'true' : 'false'); });

      elCsum.innerHTML = 'At threshold <b>' + tStr + '</b> the mistakes cost <b>' + fmtRs(c.cost) + '</b> (' +
        count(c.fn, 'missed fraud', 'missed frauds') + ' × ' + fmtRs(S.cMiss) + ' + ' + count(c.fp, 'false alarm', 'false alarms') + ' × ' + fmtRs(S.cFa) + '). ' +
        (cheapest ? '<b style="color:var(--ok)">This is the cheapest threshold.</b>' :
          'Cheapest: <b>' + fmtRs(best.cost) + '</b> at threshold <b>' + fmtT(M.best) + '</b> (★), which saves ' + fmtRs(c.cost - best.cost) + '.');

      CV.dist.cv.setAttribute('aria-label', 'Score chart. Top: ' + fmtInt(Ng) + ' genuine payments; bottom: ' + fmtInt(Nf) + ' frauds. Threshold ' + tStr + ': ' +
        fmtInt(c.tp) + ' frauds caught, ' + fmtInt(c.fn) + ' missed, ' + fmtInt(c.fp) + ' false alarms, ' + fmtInt(c.tn) + ' genuine payments let through.');
      CV.roc.cv.setAttribute('aria-label', pr
        ? 'Precision–recall curve, area ' + M.ap.toFixed(3) + '. Your threshold: recall ' + pct(c.rec) + ', precision ' + (c.prec == null ? 'not defined' : pct(c.prec)) + '.'
        : 'ROC curve, AUC ' + M.auc.toFixed(3) + '. Your threshold: false-alarm rate ' + pct(c.fpr) + ', recall ' + pct(c.rec) + '.');
      CV.cost.cv.setAttribute('aria-label', 'Total cost of mistakes for every threshold. Lowest is ' + fmtRs(best.cost) + ' at ' + fmtT(M.best) +
        '. Your threshold ' + tStr + ' costs ' + fmtRs(c.cost) + '.');
    }

    function checkTasks(kind) {
      if (kind === 'sweep') return;
      var c = cur(S.ti);
      if (S.rate === 1 && c.flagged === 0) completeTask('t1');
      if (kind === 't' && atCheapest(S.ti) && !costIsFlat()) completeTask('t2');
      if (kind === 't' && S.ti > 0 && c.rec >= RECALL_GOAL) completeTask('t3');
      if (M.auc >= AUC_GOAL) completeTask('t4');
    }

    /* ---------- actions ---------- */
    function setT(ti, kind) {
      ti = clamp(Math.round(ti), 0, STEPS);
      if (kind !== 'sweep') sweepNote = '';
      if (ti !== S.ti || kind !== 'sweep') { S.ti = ti; syncUI(); requestDraw(); }
      checkTasks(kind);
    }
    function paramsChanged() {
      sweepNote = '';
      computeModel(); syncUI(); requestDraw(); checkTasks('param');
    }
    function startSweep() {
      sweep = { t0: performance.now(), back: S.ti };
      sweepNote = '';
      btnSweep.textContent = 'Stop';
      elMsg.setAttribute('aria-busy', 'true');   // screen readers hear the end result, not 100 updates
      requestDraw();
    }
    function stopSweep(finished) {
      if (!sweep) return;
      var back = sweep.back;
      sweep = null;
      btnSweep.textContent = 'Sweep 1 → 0';
      elMsg.removeAttribute('aria-busy');
      if (finished) {
        S.ti = back;
        sweepNote = 'Sweep done: the yellow dot traced the whole ' + (S.curve === 'pr' ? 'precision–recall' : 'ROC') + ' curve, from flagging nothing to flagging everything. The threshold is back at ' + fmtT(back) + '.';
        syncUI(); requestDraw();
      }
    }

    /* ---------- drawing ---------- */
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      ['dist', 'roc', 'cost'].forEach(function (k) {
        var c = CV[k], r = c.wrap.getBoundingClientRect();
        // the canvas fills the wrapper's padding box (inside its 1px border)
        var w = Math.max(1, r.width - 2), h = Math.max(1, r.height - 2);
        c.w = w; c.h = h;
        c.cv.width = Math.max(1, Math.round(w * dpr));
        c.cv.height = Math.max(1, Math.round(h * dpr));
        c.sx = c.cv.width / w; c.sy = c.cv.height / h;
      });
      requestDraw();
    }
    // At most one animation frame is ever queued. The charts are only repainted when something changed
    // (dirty), so a sweep repaints about 22 times a second (once per threshold step), not 60.
    function schedule() {
      if (!rafId && !destroyed) rafId = requestAnimationFrame(frame);
    }
    function requestDraw() { dirty = true; schedule(); }
    function frame(now) {
      rafId = 0;
      if (destroyed) return;
      if (sweep) {
        var p = (now - sweep.t0) / SWEEP_MS;
        if (p >= 1) stopSweep(true);
        else setT(STEPS * (1 - p), 'sweep');
      }
      if (dirty) {
        dirty = false;
        var T = readTheme();
        drawDist(T); drawCurve(T); drawCost(T);
      }
      if (sweep) schedule();
    }
    function begin(c, T) {
      var g = c.g;
      g.setTransform(c.sx, 0, 0, c.sy, 0, 0);
      g.globalAlpha = 1;
      g.setLineDash([]);
      g.fillStyle = T.surface;
      g.fillRect(0, 0, c.w, c.h);
      return g;
    }
    function hatchLines(g, colour, xa, ya, xb, yb) {
      var H = yb - ya, sp = 7, start = Math.floor((xa - H) / sp) * sp;
      g.strokeStyle = colour; g.lineWidth = 1.3; g.globalAlpha = 0.9;
      g.beginPath();
      for (var x = start; x <= xb; x += sp) { g.moveTo(x, yb); g.lineTo(x + H, ya); }
      g.stroke();
      g.globalAlpha = 1;
    }
    function pillWidth(g, T, text) { g.font = '600 12px ' + T.font; return Math.ceil(g.measureText(text).width) + 14; }
    function pill(g, T, text, x, y, align, minX, maxX, border, colour) {
      var w = pillWidth(g, T, text), h = 20;
      var px = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
      px = clamp(px, minX, Math.max(minX, maxX - w));
      rrect(g, px, y, w, h, 6);
      g.globalAlpha = 0.94; g.fillStyle = T.surface; g.fill(); g.globalAlpha = 1;
      g.strokeStyle = border; g.lineWidth = 1.5; g.stroke();
      g.fillStyle = colour; g.textAlign = 'left'; g.textBaseline = 'middle';
      g.fillText(text, px + 7, y + h / 2 + 0.5);
      return { x: px, w: w };
    }

    function drawDist(T) {
      var c = CV.dist, g = begin(c, T), w = c.w, h = c.h;
      var x0 = 30, x1 = w - 14, y0 = 34, y1 = h - 40;
      if (x1 - x0 < 60 || y1 - y0 < 60) return;
      var pw = x1 - x0, ym = Math.round((y0 + y1) / 2), half = (y1 - y0) / 2;
      c.geo = { x0: x0, pw: pw };
      function X(s) { return x0 + s * pw; }
      var t = S.ti / STEPS, tx = X(t), mg = -S.sep / 2, mf = S.sep / 2, Ng = M.Ng, Nf = M.Nf, k, s, v;

      // flagged zone + grid
      g.globalAlpha = 0.7; g.fillStyle = T.haldiSoft; g.fillRect(tx, y0, x1 - tx, y1 - y0); g.globalAlpha = 1;
      g.lineWidth = 1; g.strokeStyle = T.line;
      for (k = 0; k <= 10; k++) {
        var gx = Math.round(X(k / 10)) + 0.5;
        g.globalAlpha = k % 2 ? 0.45 : 1;
        g.beginPath(); g.moveTo(gx, y0); g.lineTo(gx, y1); g.stroke();
      }
      g.globalAlpha = 1;

      // heights: each hump stretched to fill its half, or both on one shared scale (true counts)
      var K = clamp(Math.round(pw / 1.5), 120, 480), maxG = 0, maxF = 0;
      for (k = 1; k < K; k++) {
        s = k / K;
        v = scoreDensity(s, mg); if (v > maxG) maxG = v;
        v = scoreDensity(s, mf); if (v > maxF) maxF = v;
      }
      var hMax = Math.min(half * 0.8, half - 30), kG, kF;
      if (S.trueScale) { var big = Math.max(Ng * maxG, Nf * maxF) || 1; kG = Ng * hMax / big; kF = Nf * hMax / big; }
      else { kG = hMax / (maxG || 1); kF = hMax / (maxF || 1); }
      function hG(q) { return Math.min(half - 1, scoreDensity(q, mg) * kG); }
      function hF(q) { return Math.min(half - 1, scoreDensity(q, mf) * kF); }
      function regionPath(a, b, fn, dir) {
        var n = Math.max(1, Math.ceil((b - a) * K));
        g.beginPath(); g.moveTo(X(a), ym);
        for (var i = 0; i <= n; i++) { var q = a + (b - a) * i / n; g.lineTo(X(q), ym + dir * fn(q)); }
        g.lineTo(X(b), ym); g.closePath();
      }
      function fillRegion(a, b, fn, dir, colour, striped) {
        if (b - a <= 0) return;
        regionPath(a, b, fn, dir);
        g.globalAlpha = 0.24; g.fillStyle = colour; g.fill(); g.globalAlpha = 1;
        if (striped) {
          g.save(); regionPath(a, b, fn, dir); g.clip();
          hatchLines(g, colour, X(a), dir < 0 ? y0 : ym, X(b), dir < 0 ? ym : y1);
          g.restore();
        }
      }
      fillRegion(0, t, hG, -1, T.s1, false);   // TN
      fillRegion(t, 1, hG, -1, T.s1, true);    // FP
      fillRegion(0, t, hF, 1, T.s2, true);     // FN
      fillRegion(t, 1, hF, 1, T.s2, false);    // TP
      function outline(fn, dir, colour) {
        g.beginPath();
        for (var i = 0; i <= K; i++) { var q = i / K, yy = ym + dir * fn(q); if (i) g.lineTo(X(q), yy); else g.moveTo(X(q), yy); }
        g.strokeStyle = colour; g.lineWidth = 2; g.lineJoin = 'round'; g.stroke();
      }
      outline(hG, -1, T.s1);
      outline(hF, 1, T.s2);
      g.strokeStyle = T.muted; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x0, ym + 0.5); g.lineTo(x1, ym + 0.5); g.stroke();

      // class names in the left gutter
      g.font = '700 11.5px ' + T.font; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.save(); g.translate(14, ym - half / 2); g.rotate(-Math.PI / 2); g.fillStyle = T.s1; g.fillText('Genuine', 0, 0); g.restore();
      g.save(); g.translate(14, ym + half / 2); g.rotate(-Math.PI / 2); g.fillStyle = T.s2; g.fillText('Fraud', 0, 0); g.restore();

      if (S.trueScale && Nf / Ng < 0.2) {
        g.font = '12px ' + T.font; g.fillStyle = T.muted; g.textAlign = 'center'; g.textBaseline = 'middle';
        var note = 'True scale: frauds are only ' + S.rate + '% of payments, so their hump is tiny';
        if (g.measureText(note).width > pw - 20) note = 'True scale: frauds are rare, so their hump is tiny';
        g.fillText(note, X(0.5), ym + half * 0.42);
      }

      // threshold line
      g.strokeStyle = T.haldi; g.lineWidth = 3;
      g.beginPath(); g.moveTo(tx, 24); g.lineTo(tx, y1 + 4); g.stroke();

      // the four outcomes, one in each quarter (same layout as the confusion matrix)
      var cc = cur(S.ti), wide = pw > 440, minX = x0 + 2, maxX = x1 - 2;
      function lab(abbr, n, words) { return (wide ? abbr + ' · ' : '') + fmtInt(n) + ' ' + words; }
      // a pair of pills sits either side of the line; when one side is too narrow, that pill moves to
      // the other side, one row further from the edge, so the two never overlap
      function pair(lt, rt, yEdge, yInner, lBorder, lColour, rBorder, rColour) {
        var lw = pillWidth(g, T, lt), rw = pillWidth(g, T, rt);
        var lFits = tx - 8 - lw >= minX, rFits = tx + 8 + rw <= maxX;
        if ((lFits && rFits) || (!lFits && !rFits)) {
          pill(g, T, lt, tx - 8, yEdge, 'right', minX, maxX, lBorder, lColour);
          pill(g, T, rt, tx + 8, yEdge, 'left', minX, maxX, rBorder, rColour);
        } else if (!rFits) {
          pill(g, T, lt, tx - 8, yEdge, 'right', minX, maxX, lBorder, lColour);
          pill(g, T, rt, tx - 8, yInner, 'right', minX, maxX, rBorder, rColour);
        } else {
          pill(g, T, rt, tx + 8, yEdge, 'left', minX, maxX, rBorder, rColour);
          pill(g, T, lt, tx + 8, yInner, 'left', minX, maxX, lBorder, lColour);
        }
      }
      pair(lab('TN', cc.tn, 'let through'), lab('FP', cc.fp, cc.fp === 1 ? 'false alarm' : 'false alarms'), y0 + 5, y0 + 29, T.ok, T.ink, T.bad, T.bad);
      pair(lab('FN', cc.fn, 'missed'), lab('TP', cc.tp, 'caught'), y1 - 25, y1 - 49, T.bad, T.bad, T.ok, T.ink);

      // threshold value on top, with "let through / flagged" either side
      g.font = '700 12.5px ' + T.mono;
      var label = '≥ ' + fmtT(S.ti), lw = Math.ceil(g.measureText(label).width) + 16;
      var lx = clamp(tx - lw / 2, 2, w - lw - 2);
      rrect(g, lx, 4, lw, 21, 6);
      g.fillStyle = T.surface; g.fill(); g.strokeStyle = T.haldi; g.lineWidth = 2; g.stroke();
      g.fillStyle = T.haldiInk; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(label, lx + lw / 2, 15);
      g.font = '600 11.5px ' + T.font; g.fillStyle = T.muted;
      var left = '← let through', right = 'flagged →';
      if (lx - 8 - g.measureText(left).width >= 2) { g.textAlign = 'right'; g.fillText(left, lx - 8, 15); }
      if (lx + lw + 8 + g.measureText(right).width <= w - 2) { g.textAlign = 'left'; g.fillText(right, lx + lw + 8, 15); }

      // x axis
      g.font = '11.5px ' + T.font; g.fillStyle = T.muted; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      for (k = 0; k <= 5; k++) g.fillText(k === 0 ? '0' : k === 5 ? '1' : (k / 5).toFixed(1), X(k / 5), y1 + 16);
      g.font = '600 12px ' + T.font; g.fillStyle = T.ink;
      g.fillText(wide ? 'Fraud score given by the model (0 = looks safe, 1 = looks like fraud)' : 'Fraud score (0 = looks safe, 1 = fraud)', X(0.5), y1 + 33);
    }

    function curveGeo(c) {
      var w = c.w, h = c.h, L = 56, R = 14, TOP = 14, BOT = 44;
      var aw = w - L - R, ah = h - TOP - BOT, side = Math.min(aw, ah);
      var x0 = L + (aw - side) / 2, y1 = TOP + (ah - side) / 2 + side;
      return { x0: x0, y1: y1, side: side };
    }
    function curvePoint(i) {
      var tp = M.tp[i], fp = M.fp[i];
      if (S.curve === 'pr') return tp + fp > 0 ? { x: tp / M.Nf, y: tp / (tp + fp) } : null;
      return { x: fp / M.Ng, y: tp / M.Nf };
    }
    function drawCurve(T) {
      var c = CV.roc, g = begin(c, T), G = curveGeo(c);
      c.geo = G;
      if (G.side < 60) return;
      var x0 = G.x0, y1 = G.y1, side = G.side, y0 = y1 - side, pr = S.curve === 'pr', i, k;
      function X(v) { return x0 + v * side; }
      function Y(v) { return y1 - v * side; }
      // grid + tick labels
      g.lineWidth = 1; g.font = '11px ' + T.font; g.fillStyle = T.muted;
      for (i = 0; i <= 4; i++) {
        var v = i / 4, gx = Math.round(X(v)) + 0.5, gy = Math.round(Y(v)) + 0.5;
        g.strokeStyle = T.line; g.globalAlpha = i === 0 ? 1 : 0.8;
        g.beginPath(); g.moveTo(gx, y0); g.lineTo(gx, y1); g.moveTo(x0, gy); g.lineTo(x0 + side, gy); g.stroke();
        g.globalAlpha = 1;
        g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText(Math.round(v * 100) + '%', X(v), y1 + 15);
        g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(Math.round(v * 100) + '%', x0 - 6, Y(v));
      }
      // random-guess reference
      g.strokeStyle = T.muted; g.lineWidth = 1.5; g.setLineDash([5, 4]);
      var base = M.Nf / N;
      g.beginPath();
      if (pr) { g.moveTo(X(0), Y(base)); g.lineTo(X(1), Y(base)); } else { g.moveTo(X(0), Y(0)); g.lineTo(X(1), Y(1)); }
      g.stroke(); g.setLineDash([]);
      g.font = '11px ' + T.font; g.fillStyle = T.muted;
      if (pr) { g.textAlign = 'left'; g.textBaseline = 'bottom'; g.fillText('random guessing = fraud rate (' + S.rate + '%)', X(0) + 6, Y(base) - 3); }
      else { g.save(); g.translate(X(0.62) + 7, Y(0.62) + 7); g.rotate(-Math.PI / 4); g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText('random guessing', 0, 0); g.restore(); }

      // shaded area + curve
      var xs = pr ? M.rocY : M.rocX, ys = pr ? M.prec : M.rocY, last = CURVE_N;
      g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(0), Y(pr ? ys[0] : 0));
      for (k = 0; k <= last; k++) g.lineTo(X(xs[k]), Y(ys[k]));
      g.lineTo(X(1), Y(pr ? ys[last] : 1)); g.lineTo(X(1), Y(0)); g.closePath();
      g.globalAlpha = 0.14; g.fillStyle = T.s4; g.fill(); g.globalAlpha = 1;
      g.beginPath(); g.moveTo(X(0), Y(pr ? ys[0] : 0));
      for (k = 0; k <= last; k++) g.lineTo(X(xs[k]), Y(ys[k]));
      g.strokeStyle = T.s4; g.lineWidth = 2.5; g.lineJoin = 'round'; g.stroke();

      // cheapest (star) and current (dot) thresholds
      var b = curvePoint(M.best);
      if (b) { starPath(g, X(b.x), Y(b.y), 9); g.fillStyle = T.ok; g.fill(); g.strokeStyle = T.surface; g.lineWidth = 1.5; g.stroke(); }
      var p = curvePoint(S.ti);
      if (p) {
        g.beginPath(); g.arc(X(p.x), Y(p.y), 6.5, 0, Math.PI * 2);
        g.fillStyle = T.haldi; g.fill(); g.strokeStyle = T.ink; g.lineWidth = 1.5; g.stroke();
      }
      // axis titles
      g.font = '600 12px ' + T.font; g.fillStyle = T.ink; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.fillText(pr ? 'Recall (share of frauds caught)' : 'False-alarm rate (FPR)', X(0.5), y1 + 34);
      g.save(); g.translate(x0 - 44, Y(0.5)); g.rotate(-Math.PI / 2); g.textBaseline = 'middle';
      g.fillText(pr ? 'Precision' : 'Recall (TPR)', 0, 0); g.restore();
      if (pr && !p) {
        g.font = '12px ' + T.font; g.fillStyle = T.muted; g.textAlign = 'left'; g.textBaseline = 'top';
        g.fillText('Nothing flagged: precision is not defined', X(0) + 8, Y(1) + 8);
      }
    }

    function costGeo(c) { return { x0: 60, pw: Math.max(1, c.w - 60 - 18), y0: 16, y1: c.h - 40 }; }
    function drawCost(T) {
      var c = CV.cost, g = begin(c, T), G = costGeo(c);
      c.geo = G;
      var x0 = G.x0, pw = G.pw, x1 = x0 + pw, y0 = G.y0, y1 = G.y1, i, v;
      if (pw < 60 || y1 - y0 < 50) return;
      var maxC = 0;
      for (i = 0; i <= STEPS; i++) if (M.cost[i] > maxC) maxC = M.cost[i];
      var step = maxC > 0 ? niceStep(maxC, 4) : 1, yMax = Math.max(step, Math.ceil(maxC / step - 1e-9) * step);
      function X(s) { return x0 + s * pw; }
      function Y(val) { return y1 - val / yMax * (y1 - y0); }
      // grid
      g.lineWidth = 1; g.font = '11px ' + T.font;
      for (v = 0; v <= yMax + step * 0.01; v += step) {
        var gy = Math.round(Y(v)) + 0.5;
        g.strokeStyle = T.line; g.beginPath(); g.moveTo(x0, gy); g.lineTo(x1, gy); g.stroke();
        g.fillStyle = T.muted; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(fmtRsShort(v), x0 - 6, gy);
      }
      g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      for (i = 0; i <= 5; i++) g.fillText(i === 0 ? '0' : i === 5 ? '1' : (i / 5).toFixed(1), X(i / 5), y1 + 16);
      // stacked areas: false-alarm cost at the bottom, missed-fraud cost on top
      g.beginPath(); g.moveTo(X(0), Y(0));
      for (i = 0; i <= STEPS; i++) g.lineTo(X(i / STEPS), Y(M.fp[i] * S.cFa));
      g.lineTo(X(1), Y(0)); g.closePath();
      g.globalAlpha = 0.3; g.fillStyle = T.s1; g.fill(); g.globalAlpha = 1;
      g.beginPath();
      for (i = 0; i <= STEPS; i++) { var yy = Y(M.cost[i]); if (i) g.lineTo(X(i / STEPS), yy); else g.moveTo(X(0), yy); }
      for (i = STEPS; i >= 0; i--) g.lineTo(X(i / STEPS), Y(M.fp[i] * S.cFa));
      g.closePath();
      g.globalAlpha = 0.3; g.fillStyle = T.s2; g.fill(); g.globalAlpha = 1;
      g.beginPath();
      for (i = 0; i <= STEPS; i++) { if (i) g.lineTo(X(i / STEPS), Y(M.cost[i])); else g.moveTo(X(0), Y(M.cost[0])); }
      g.strokeStyle = T.ink; g.lineWidth = 2; g.lineJoin = 'round'; g.stroke();
      // current threshold
      var tx = X(S.ti / STEPS);
      g.strokeStyle = T.haldi; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(tx, y0); g.lineTo(tx, y1); g.stroke();
      // cheapest
      var bx = X(M.best / STEPS), by = Y(M.cost[M.best]);
      starPath(g, bx, by, 9); g.fillStyle = T.ok; g.fill(); g.strokeStyle = T.surface; g.lineWidth = 1.5; g.stroke();
      g.beginPath(); g.arc(tx, Y(M.cost[S.ti]), 6, 0, Math.PI * 2);
      g.fillStyle = T.haldi; g.fill(); g.strokeStyle = T.ink; g.lineWidth = 1.5; g.stroke();
      g.font = '700 11.5px ' + T.font;
      var cl = 'cheapest ' + fmtT(M.best), cw = Math.ceil(g.measureText(cl).width) + 10;
      var cx = M.best === S.ti ? bx - cw / 2 : bx < tx ? bx + 4 - cw : bx - 4;
      cx = clamp(cx, x0 + 2, x1 - cw - 2);
      var cy = Math.max(y0, by - 34);
      rrect(g, cx, cy, cw, 18, 5);
      g.globalAlpha = 0.9; g.fillStyle = T.surface; g.fill(); g.globalAlpha = 1;
      g.fillStyle = T.ok; g.textAlign = 'left'; g.textBaseline = 'middle';
      g.fillText(cl, cx + 5, cy + 9.5);
      // axis title
      g.font = '600 12px ' + T.font; g.fillStyle = T.ink; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.fillText('Threshold', X(0.5), y1 + 33);
    }

    /* ---------- pointer + keyboard ---------- */
    function local(cv, e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function tiFromDistX(x) { var G = CV.dist.geo; return G ? clamp((x - G.x0) / G.pw, 0, 1) * STEPS : S.ti; }
    function tiFromCostX(x) { var G = CV.cost.geo; return G ? clamp((x - G.x0) / G.pw, 0, 1) * STEPS : S.ti; }
    function tiFromCurve(x, y) {
      var G = CV.roc.geo;
      if (!G) return S.ti;
      var bestI = S.ti, bestD = Infinity;
      for (var i = 0; i <= STEPS; i++) {
        var p = curvePoint(i);
        if (!p) continue;
        var dx = G.x0 + p.x * G.side - x, dy = G.y1 - p.y * G.side - y, d = dx * dx + dy * dy;
        // on a tie (many thresholds share a corner), keep the one nearest the current threshold
        if (d < bestD - 1e-6 || (Math.abs(d - bestD) <= 1e-6 && Math.abs(i - S.ti) < Math.abs(bestI - S.ti))) { bestD = d; bestI = i; }
      }
      return bestI;
    }
    // Mouse and pen act at once. A finger on a chart that allows vertical scrolling (pan-y) only moves the
    // threshold on a tap or a sideways drag, so scrolling the page past the chart does not move it.
    function attachPointer(cv, toTi, panY) {
      var st = null;
      on(cv, 'pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        stopSweep(false);
        var p = local(cv, e);
        st = { id: e.pointerId, sx: p.x, drag: !(panY && e.pointerType === 'touch') };
        if (st.drag) setT(toTi(p.x, p.y), 't');
        try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      });
      on(cv, 'pointermove', function (e) {
        if (!st || e.pointerId !== st.id) return;
        var p = local(cv, e);
        if (!st.drag) { if (Math.abs(p.x - st.sx) < 6) return; st.drag = true; }
        setT(toTi(p.x, p.y), 't');
      });
      on(cv, 'pointerup', function (e) {
        if (!st || e.pointerId !== st.id) return;
        if (!st.drag) { var p = local(cv, e); setT(toTi(p.x, p.y), 't'); }
        st = null;
      });
      on(cv, 'pointercancel', function () { st = null; });
      on(cv, 'lostpointercapture', function () { st = null; });
    }
    attachPointer(CV.dist.cv, function (x) { return tiFromDistX(x); }, true);
    attachPointer(CV.cost.cv, function (x) { return tiFromCostX(x); }, true);
    attachPointer(CV.roc.cv, tiFromCurve, false);

    function keyHandler(sign) {
      return function (e) {
        var k = e.key, d = e.shiftKey ? 10 : 1, ti = S.ti;
        if (k === 'ArrowLeft' || k === 'ArrowDown') ti -= sign * d;
        else if (k === 'ArrowRight' || k === 'ArrowUp') ti += sign * d;
        else if (k === 'PageDown') ti -= sign * 10;
        else if (k === 'PageUp') ti += sign * 10;
        else if (k === 'Home') ti = sign > 0 ? 0 : STEPS;
        else if (k === 'End') ti = sign > 0 ? STEPS : 0;
        else return;
        e.preventDefault();
        stopSweep(false);
        setT(ti, 't');
      };
    }
    on(CV.dist.cv, 'keydown', keyHandler(1));
    on(CV.cost.cv, 'keydown', keyHandler(1));
    // on the ROC / PR curve, "right" means further along the curve, which is a LOWER threshold
    on(CV.roc.cv, 'keydown', keyHandler(-1));

    /* ---------- controls ---------- */
    on(elT, 'input', function () { stopSweep(false); setT(parseFloat(elT.value) * STEPS, 't'); });
    on(elRate, 'input', function () { S.rate = clamp(Math.round(parseFloat(elRate.value) || 1), 1, 30); paramsChanged(); });
    on(elSep, 'input', function () { S.sep = clamp(Math.round((parseFloat(elSep.value) || 0) * 10) / 10, 0, 4); paramsChanged(); });
    function costInput(el, key) {
      on(el, 'input', function () {
        var v = parseFloat(el.value);
        if (!isFinite(v) || v < 0) return;   // half-typed or empty: keep the last good value
        S[key] = clamp(Math.round(v), 0, COST_CAP);
        paramsChanged();
      });
      on(el, 'change', function () { el.value = String(S[key]); });
    }
    costInput(elMiss, 'cMiss');
    costInput(elFa, 'cFa');
    on(elTrue, 'change', function () { S.trueScale = elTrue.checked; requestDraw(); });
    Array.prototype.forEach.call(curveBtns, function (b) {
      on(b, 'click', function () { S.curve = b.getAttribute('data-curve'); syncUI(); requestDraw(); });
    });
    on(btnSweep, 'click', function () { if (sweep) stopSweep(false); else startSweep(); });
    on(btnReset, 'click', function () {
      stopSweep(false);
      setDefaults();
      sweepNote = '';
      elMiss.value = String(S.cMiss); elFa.value = String(S.cFa); elTrue.checked = S.trueScale;
      computeModel(); syncUI(); requestDraw();
    });

    /* ---------- theme + resize ---------- */
    function onTheme() { requestDraw(); }
    var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mql) { if (mql.addEventListener) mql.addEventListener('change', onTheme); else if (mql.addListener) mql.addListener(onTheme); }
    on(document, 'themechange', onTheme);
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { resize(); }); ro.observe(CV.dist.wrap); ro.observe(CV.roc.wrap); ro.observe(CV.cost.wrap); }
    else on(window, 'resize', resize);

    /* ---------- starting state: 2% fraud, a decent model (AUC 0.92), threshold 0.50 ---------- */
    computeModel();
    syncUI();
    resize();

    return {
      destroy: function () {
        destroyed = true;
        sweep = null;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
        if (ro) ro.disconnect();
        if (mql) { if (mql.removeEventListener) mql.removeEventListener('change', onTheme); else if (mql.removeListener) mql.removeListener(onTheme); }
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
        listeners = [];
        root.innerHTML = '';
      }
    };
  }

  Labs.threshold = {
    id: 'threshold',
    module: 'l2-metrics-tuning',
    title: 'Threshold, confusion matrix & ₹ cost',
    summary: 'Pick the score above which a UPI payment is flagged as fraud, and watch the confusion matrix, precision, recall, the ROC curve and the rupee cost of mistakes change.',
    tasks: TASKS.map(function (t) { return { id: t.id, text: t.text }; }),
    mount: mount
  };
})();
