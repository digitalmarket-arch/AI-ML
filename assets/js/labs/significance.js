/* AI Marg lab: "Is the improvement real?" Reading ML results honestly.
   Two models, several random seeds each, a finite test set. Shows each run's score, the mean with a
   t-based 95% confidence interval, the gap B − A with a bootstrap 95% CI, and what cherry-picking does.
   Plain classic script (ES2019). Registers window.AILabs.significance. No libraries, no network, no storage. */
(function () {
  'use strict';
  var Labs = (window.AILabs = window.AILabs || {});
  var mountCount = 0;

  /* ---------- constants ---------- */
  var MAX_SEEDS = 30;
  var BOOT_N = 2000;                 // bootstrap resamples
  var BOOT_SEED = 20260117;          // the same resampling pattern every time, so results are reproducible
  var EXP_SEED = 8191;               // experiment 1, 2, 3 ... each get their own fixed random draws
  var TEST_SIZES = [500, 1000, 2000, 5000, 10000, 50000, 100000];
  var DEF = { a: 810, b: 815, sd: 4, k: 3, nIdx: 4 };  // accuracies and SD in tenths of a point
  var SMALL_TEST = 1000, BIG_TEST = 50000;
  var Z975 = 1.959963984540054, Z80 = 0.8416212335729143;

  var TASKS = [
    { id: 't1', text: 'Set the seeds to 1, then press Re-run until B scores lower than A, even though B is truly better.' },
    { id: 't2', text: 'Keep the true gap at 0.5 points (for example A 81.0%, B 81.5%) and raise the seeds (5 or more) until the whole 95% CI of the gap sits above 0. How many seeds did it take?' },
    { id: 't3', text: 'Switch to Cherry-pick with 5 or more seeds, and find a result where showing only B’s best run inflates the gap by at least 0.5 points.' },
    { id: 't4', text: 'Make the test set small (1,000 or fewer), then big (50,000 or more), and watch the test-set noise shrink.' }
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
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  // Indian digit grouping: 100000 -> 1,00,000
  function fmtIN(v, d) {
    var s = Math.abs(v).toFixed(d || 0), neg = v < 0 && parseFloat(s) !== 0;
    var i = s.indexOf('.'), ip = i < 0 ? s : s.slice(0, i), fp = i < 0 ? '' : s.slice(i);
    if (ip.length > 3) ip = ip.slice(0, -3).replace(/\B(?=(\d{2})+$)/g, ',') + ',' + ip.slice(-3);
    return (neg ? '−' : '') + ip + fp;
  }
  // signed number with a real minus sign; a value that rounds to zero gets no sign
  function sgn(v, d) {
    var s = Math.abs(v).toFixed(d);
    if (parseFloat(s) === 0) return s;
    return (v > 0 ? '+' : '−') + s;
  }
  function pct(v) { return v.toFixed(2) + '%'; }
  function niceStep(raw) {
    var p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p;
  }

  /* ---------- Student t quantile, done properly ----------
     t CDF via the regularised incomplete beta function: for t >= 0,
     P(T <= t) = 1 − ½·I_x(ν/2, ½) with x = ν / (ν + t²). The quantile is found by bisection. */
  var LANCZOS = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  function lgamma(x) {
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
    x -= 1;
    var a = LANCZOS[0], t = x + 7.5;
    for (var i = 1; i < 9; i++) a += LANCZOS[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }
  function betacf(a, b, x) {  // continued fraction (Lentz), as in Numerical Recipes
    var FPMIN = 1e-300, qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d;
    var h = d;
    for (var m = 1; m <= 400; m++) {
      var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      var del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 1e-15) break;
    }
    return h;
  }
  function ibeta(a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
    return 1 - bt * betacf(b, a, 1 - x) / b;
  }
  function tCdf(t, df) {
    var tail = 0.5 * ibeta(df / 2, 0.5, df / (df + t * t));
    return t >= 0 ? 1 - tail : tail;
  }
  var tCache = {};
  function tQuantile(p, df) {  // p > 0.5
    var key = p + '|' + df;
    if (tCache[key]) return tCache[key];
    var lo = 0, hi = 2;
    while (tCdf(hi, df) < p) hi *= 2;
    for (var i = 0; i < 200 && hi - lo > 1e-13 * hi; i++) {
      var mid = (lo + hi) / 2;
      if (tCdf(mid, df) < p) lo = mid; else hi = mid;
    }
    tCache[key] = (lo + hi) / 2;
    return tCache[key];
  }

  /* ---------- statistics ---------- */
  function summarise(xs) {
    var k = xs.length, m = 0, i, best = -Infinity, bestIdx = 0;
    for (i = 0; i < k; i++) { m += xs[i]; if (xs[i] > best) { best = xs[i]; bestIdx = i; } }
    m /= k;
    var ss = 0;
    for (i = 0; i < k; i++) ss += (xs[i] - m) * (xs[i] - m);
    var sd = k > 1 ? Math.sqrt(ss / (k - 1)) : NaN;      // sample SD (divides by k − 1)
    var t = k > 1 ? tQuantile(0.975, k - 1) : NaN;
    var half = k > 1 ? t * sd / Math.sqrt(k) : NaN;
    return { k: k, mean: m, sd: sd, t: t, lo: m - half, hi: m + half, best: best, bestIdx: bestIdx };
  }
  // percentile bootstrap of mean(B) − mean(A): resample each model's runs with replacement
  function bootstrap(a, b) {
    var k = a.length, rnd = mulberry32(BOOT_SEED), out = new Float64Array(BOOT_N);
    for (var r = 0; r < BOOT_N; r++) {
      var sa = 0, sb = 0;
      for (var j = 0; j < k; j++) { sa += a[Math.floor(rnd() * k)]; sb += b[Math.floor(rnd() * k)]; }
      out[r] = (sb - sa) / k;
    }
    out.sort();
    return out;
  }
  function quantileSorted(xs, p) {  // linear interpolation between order statistics
    var h = (xs.length - 1) * p, f = Math.floor(h), c = Math.min(xs.length - 1, f + 1);
    return xs[f] + (h - f) * (xs[c] - xs[f]);
  }
  // one experiment = fixed random draws for up to 30 runs per model; settings then shape them,
  // so moving a slider changes the same "luck" smoothly instead of drawing new luck
  function makeDraws(e) {
    var rnd = mulberry32((EXP_SEED + Math.imul(e, 0x9E3779B1)) >>> 0);
    var d = { sA: [], tA: [], sB: [], tB: [] };
    for (var i = 0; i < MAX_SEEDS; i++) { d.sA.push(gauss(rnd)); d.tA.push(gauss(rnd)); d.sB.push(gauss(rnd)); d.tB.push(gauss(rnd)); }
    return d;
  }
  // a run's real accuracy = true mean + seed luck; its measured accuracy = correct answers out of n
  // test examples (binomial, via the normal approximation, rounded to a whole count)
  function runScores(mu, sdSeed, n, k, zs, zt) {
    var out = [];
    for (var i = 0; i < k; i++) {
      var p = clamp((mu + sdSeed * zs[i]) / 100, 0.0005, 0.9995);
      var c = clamp(Math.round(n * p + Math.sqrt(n * p * (1 - p)) * zt[i]), 0, n);
      out.push(100 * c / n);
    }
    return out;
  }

  /* ---------- theme ---------- */
  var THEME_NAMES = ['--bg', '--surface', '--surface-2', '--ink', '--muted', '--line', '--indigo', '--haldi', '--sindoor', '--ok', '--bad', '--series-1', '--series-2', '--series-3', '--series-4'];
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
  function readTheme() {
    var cs = getComputedStyle(document.documentElement), T = {};
    for (var i = 0; i < THEME_NAMES.length; i++) {
      var n = THEME_NAMES[i];
      T[n.slice(2).replace('-', '')] = cs.getPropertyValue(n).trim() || '#888';
    }
    T.font = cs.getPropertyValue('--font-body').trim() || 'system-ui, sans-serif';
    T.rgb = {};
    ['series1', 'series2', 'series4', 'muted', 'ink'].forEach(function (k) { T.rgb[k] = toRgb(T[k]); });
    return T;
  }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  /* ---------- mount ---------- */
  function mount(root, ctx) {
    var P = 'sig' + (++mountCount) + '-';
    var listeners = [];
    function on(el, type, fn, opts) { el.addEventListener(type, fn, opts); listeners.push([el, type, fn, opts]); }
    var destroyed = false;

    var tasksHtml = TASKS.map(function (t) { return '<li data-task="' + t.id + '">' + t.text + '</li>'; }).join('');
    function legendItem(v, text) { return '<span style="--c:var(' + v + ')">' + text + '</span>'; }
    function range(id, label, min, max, step, value, help) {
      return '<div class="control"><label for="' + P + id + '"><span>' + label + '</span><output id="' + P + id + 'out" for="' + P + id + '"></output></label>' +
        '<input type="range" id="' + P + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + value + '"' + (help ? ' aria-describedby="' + P + id + 'help"' : '') + '>' +
        (help ? '<p class="small muted" id="' + P + id + 'help">' + help + '</p>' : '') + '</div>';
    }

    var top = document.createElement('div');
    top.className = 'lab';
    top.innerHTML =
      '<p class="lab-note"><strong>What you are seeing:</strong> a teammate says their new <b>Model B</b> beats the old <b>Model A</b>. ' +
        'Each dot is one training run: the same code, but a different random <em>seed</em> (the number that fixes a run’s random choices, such as its starting weights and the order it sees the data), then scored on a test set. ' +
        'The dashed lines show each model’s true accuracy, which in real life nobody gets to see. The black bar under each row is the <em>mean</em> (average) with its <em>95% confidence interval</em> ' +
        '(CI: a range built so that, in 95 out of 100 repeat experiments, it would catch the true mean). ' +
        'The bottom chart asks the real question: how big is the gap B − A in <em>points</em> (percentage points: 81.5% − 81.0% = 0.5 points), and could it really be zero?</p>' +
      '<div class="lab-body">' +
        '<div class="stack-sm">' +
          '<div class="lab-canvas-wrap" id="' + P + 'wrap"><canvas id="' + P + 'cv" role="img" style="touch-action:auto" aria-label="Dot plot of each run’s accuracy for Model A and Model B"></canvas></div>' +
          '<div class="lab-legend">' +
            legendItem('--series-1', 'Model A run') + legendItem('--series-2', 'Model B run') + legendItem('--ink', 'Mean and 95% CI') +
            legendItem('--muted', 'True accuracy or gap (dashed)') + legendItem('--series-4', 'Gaps from 2,000 bootstrap resamples') + legendItem('--haldi', 'Cherry-picked claim') +
          '</div>' +
          '<p class="small muted" id="' + P + 'readout" style="min-height:1.5em">Hover over or tap a dot to read that run’s score.</p>' +
          '<div class="callout small" id="' + P + 'verdict" style="min-height:4.2em"></div>' +
          '<p class="small" id="' + P + 'note" style="min-height:1.5em"></p>' +
          '<div class="lab-stats">' +
            '<div class="stat"><div class="k">Gap B − A</div><div class="v" id="' + P + 'gap">—</div></div>' +
            '<div class="stat"><div class="k">95% CI of gap</div><div class="v" id="' + P + 'ci">—</div></div>' +
            '<div class="stat"><div class="k">Spread per run</div><div class="v" id="' + P + 'spread">—</div></div>' +
            '<div class="stat"><div class="k">Test-set luck</div><div class="v" id="' + P + 'tnoise">—</div></div>' +
          '</div>' +
          '<p class="small muted">“Spread per run” is how far one run typically lands from its model’s true accuracy (seed luck and test-set luck together). ' +
            'The bootstrap: the computer re-picks each model’s runs at random, repeats allowed, 2,000 times, and works out the gap each time. The middle 95% of those 2,000 gaps (the teal bars) is the 95% CI of the gap.</p>' +
        '</div>' +
        '<div class="lab-controls">' +
          range('a', 'Model A: true accuracy', 700, 900, 1, DEF.a) +
          range('b', 'Model B: true accuracy', 700, 900, 1, DEF.b, '') +
          '<p class="small" id="' + P + 'truegap" style="margin-top:-8px"></p>' +
          range('sd', 'Seed-to-seed spread (SD)', 0, 20, 1, DEF.sd, 'How much the same model’s accuracy wobbles when only the seed changes. SD (standard deviation) is the typical distance from the average.') +
          range('k', 'Seeds (runs) per model', 1, MAX_SEEDS, 1, DEF.k) +
          range('n', 'Test-set size', 0, TEST_SIZES.length - 1, 1, DEF.nIdx, '') +
          '<div class="control"><span class="control-label" id="' + P + 'modelbl">How B is reported</span>' +
            '<div class="seg" role="group" aria-labelledby="' + P + 'modelbl">' +
              '<button type="button" data-mode="honest" aria-pressed="true">Honest: mean of all runs</button>' +
              '<button type="button" data-mode="cherry" aria-pressed="false">Cherry-pick: B’s best run</button>' +
            '</div></div>' +
          '<div class="stack-sm">' +
            '<button type="button" class="btn btn-primary" id="' + P + 'rerun">Re-run experiment</button>' +
            '<p class="small muted" id="' + P + 'tally" style="min-height:3em"></p>' +
            '<button type="button" class="btn btn-sm" id="' + P + 'reset" style="align-self:flex-start">Reset all settings</button>' +
          '</div>' +
          '<div class="stack-sm"><h2 class="lab-h">Your tasks</h2><ul class="lab-tasks" id="' + P + 'tasks">' + tasksHtml + '</ul></div>' +
        '</div>' +
      '</div>' +
      '<div class="card stack-sm">' +
        '<h2 class="lab-h">The results table a paper would print</h2>' +
        '<div class="table-wrap"><table class="simple" style="font-size:.92rem">' +
          '<thead><tr><th scope="col">Model</th><th scope="col">Accuracy (%)</th><th scope="col">95% CI of the mean</th><th scope="col">Runs</th></tr></thead>' +
          '<tbody id="' + P + 'tbody"></tbody>' +
        '</table></div>' +
        '<p class="small" id="' + P + 'headline"></p>' +
        '<p class="small muted" id="' + P + 'tline"></p>' +
      '</div>' +
      '<div class="grid">' +
        '<div class="card stack-sm"><h2 class="lab-h">Words to know</h2>' +
          '<ul class="small stack-sm" style="padding-left:1.1em;margin:0">' +
            '<li><b>Seed:</b> the starting number for a program’s random choices. Same code and data, different seed: a slightly different model and score.</li>' +
            '<li><b>Variance:</b> how much results spread out from run to run. The SD is its square root, in the same units as the scores (here, points).</li>' +
            '<li><b>Test-set luck:</b> a test set is only a sample. A model that is right on 81% of all possible examples might score 80.6% or 81.4% on 10,000 of them. Its SD is about √(p(1 − p) ÷ n), with p the accuracy and n the test-set size.</li>' +
            '<li><b>95% CI:</b> a range of believable values for the true number. If it includes 0 for a gap, “no real difference” is still believable.</li>' +
            '<li><b>Cherry-picking:</b> showing only the best-looking run. The best of many runs is mostly luck, so it always flatters.</li>' +
          '</ul>' +
          '<p class="small muted">In this lab each run is scored on its own fresh test sample, so test-set luck also averages out over seeds. In many real papers every run shares one test set, so that luck never averages out: only a bigger test set helps.</p>' +
        '</div>' +
        '<div class="card stack-sm"><h2 class="lab-h">What to look for in a results table</h2>' +
          '<ol class="small stack-sm" style="padding-left:1.3em;margin:0">' +
            '<li><b>A ± next to each number:</b> mean ± SD (or a CI) over several seeds. A bare “81.62” hides how noisy it is.</li>' +
            '<li><b>How many seeds:</b> 1 to 3 runs is weak evidence; 5 or more is better.</li>' +
            '<li><b>Gap versus spread:</b> a 0.3-point win with ±0.5 SD on each model is probably noise.</li>' +
            '<li><b>Test-set size:</b> on 1,000 examples, ±1.2 points is pure luck.</li>' +
            '<li><b>A fair fight:</b> same test set, same tuning effort for both models, and no picking the best seed (or best checkpoint) by peeking at the test set.</li>' +
          '</ol>' +
        '</div>' +
      '</div>' +
      '<div class="visually-hidden" role="status" aria-live="polite" id="' + P + 'live"></div>' +
      '<p class="small muted"><strong style="color:var(--ink)">Why it matters in real ML:</strong> papers and leaderboards often celebrate wins of under 1 point. Before you switch your app to a “better” model or trust a paper’s claim, check that the gain is bigger than seed luck and test-set luck; otherwise you are chasing noise.</p>';
    root.appendChild(top);

    function $(id) { return top.querySelector('#' + P + id); }
    var wrap = $('wrap'), canvas = $('cv'), g = canvas.getContext('2d');
    var elA = $('a'), elB = $('b'), elSd = $('sd'), elK = $('k'), elN = $('n');
    var outA = $('aout'), outB = $('bout'), outSd = $('sdout'), outK = $('kout'), outN = $('nout');
    var elTrueGap = $('truegap'), elNHelp = $('nhelp');
    var elVerdict = $('verdict'), elNote = $('note'), elReadout = $('readout'), elLive = $('live'), elTally = $('tally');
    var elGap = $('gap'), elCi = $('ci'), elSpread = $('spread'), elTnoise = $('tnoise');
    var elTbody = $('tbody'), elHeadline = $('headline'), elTline = $('tline');
    var btnRerun = $('rerun'), btnReset = $('reset');
    var modeBtns = top.querySelectorAll('[data-mode]');
    var taskEls = {};
    Array.prototype.forEach.call(top.querySelectorAll('[data-task]'), function (li) { taskEls[li.getAttribute('data-task')] = li; });
    // the B slider has no help text of its own; the true-gap line serves as its description
    elB.setAttribute('aria-describedby', P + 'truegap');
    var bHelp = $('bhelp');
    if (bHelp) bHelp.parentNode.removeChild(bHelp);

    /* ---------- state ---------- */
    var S = { a: DEF.a, b: DEF.b, sd: DEF.sd, k: DEF.k, nIdx: DEF.nIdx, mode: 'honest', exp: 1 };
    var draws = makeDraws(S.exp);
    var R = null;               // current results
    var anim = null;            // tween after Re-run
    var tally = { key: '', n: 0, lower: 0, clear: 0 };
    var visited = { small: false, big: false };
    var hitDots = [];
    var hoverKey = '';
    var dims = { w: 1, h: 1, dpr: 1 };
    var rafId = 0, needDraw = false, aspectRaf = 0, curAspect = '', liveTimer = 0;
    var done = {};
    var reduceMQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

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
    function completeTask(id) {
      if (done[id]) return false;
      done[id] = true;
      markLi(id);
      if (ctx && ctx.onTaskDone) ctx.onTaskDone(id);
      return true;
    }

    /* ---------- derived numbers ---------- */
    function muA() { return S.a / 10; }
    function muB() { return S.b / 10; }
    function sdSeed() { return S.sd / 10; }
    function testN() { return TEST_SIZES[S.nIdx]; }
    function testSd(mu) { var p = mu / 100; return 100 * Math.sqrt(p * (1 - p) / testN()); }
    function runSd(mu) { var s = sdSeed(), t = testSd(mu); return Math.sqrt(s * s + t * t); }
    function settingsKey() { return [S.a, S.b, S.sd, S.k, S.nIdx].join('|'); }

    function compute() {
      var k = S.k, n = testN(), s = sdSeed();
      var a = runScores(muA(), s, n, k, draws.sA, draws.tA);
      var b = runScores(muB(), s, n, k, draws.sB, draws.tB);
      var A = summarise(a), B = summarise(b);
      var res = { k: k, a: a, b: b, A: A, B: B, gap: B.mean - A.mean, boot: null, ci: null };
      if (k > 1) {
        res.boot = bootstrap(a, b);
        res.ci = { lo: quantileSorted(res.boot, 0.025), hi: quantileSorted(res.boot, 0.975) };
      }
      res.claimed = B.best - A.mean;
      res.inflation = res.claimed - res.gap;   // = best run of B − mean of B, always >= 0
      res.trueGap = (S.b - S.a) / 10;
      res.verdict = k === 1 ? 'one' : res.ci.lo > 0 ? 'b' : res.ci.hi < 0 ? 'a' : 'noise';
      return res;
    }

    /* ---------- text output ---------- */
    var lastText = {};
    function setText(el, key, v) { if (lastText[key] !== v) { lastText[key] = v; el.textContent = v; } }
    function setHtml(el, key, v) { if (lastText[key] !== v) { lastText[key] = v; el.innerHTML = v; } }
    function ciText(ci) { return sgn(ci.lo, 2) + ' to ' + sgn(ci.hi, 2); }

    function updateOutputs() {
      setText(outA, 'oa', (S.a / 10).toFixed(1) + '%');
      setText(outB, 'ob', (S.b / 10).toFixed(1) + '%');
      setText(outSd, 'osd', '±' + (S.sd / 10).toFixed(1) + ' pts');
      setText(outK, 'ok', String(S.k));
      setText(outN, 'on', fmtIN(testN()) + ' examples');
      elA.setAttribute('aria-valuetext', (S.a / 10).toFixed(1) + ' percent');
      elB.setAttribute('aria-valuetext', (S.b / 10).toFixed(1) + ' percent');
      elSd.setAttribute('aria-valuetext', (S.sd / 10).toFixed(1) + ' points');
      elK.setAttribute('aria-valuetext', S.k + (S.k === 1 ? ' seed' : ' seeds') + ' per model');
      elN.setAttribute('aria-valuetext', fmtIN(testN()) + ' examples');
      var tg = (S.b - S.a) / 10;
      setText(elTrueGap, 'tg', 'True gap (hidden in real life): B ' + (tg > 0 ? 'is ' + tg.toFixed(1) + ' points better' : tg < 0 ? 'is ' + Math.abs(tg).toFixed(1) + ' points worse' : 'is exactly as good as A') + '.');
      var mid = (muA() + muB()) / 2;
      setText(elNHelp, 'nh', 'More test examples means less test-set luck: here about ±' + testSd(mid).toFixed(2) + ' points for each run.');
      Array.prototype.forEach.call(modeBtns, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === S.mode)); });
    }

    function verdictHtml(res) {
      var A = res.A, B = res.B, tg = res.trueGap, h, tone;
      if (res.verdict === 'one') {
        tone = 'warn';
        h = '<b>One run each proves nothing.</b> B scored ' + pct(B.mean) + ' and A scored ' + pct(A.mean) + ' (gap ' + sgn(res.gap, 2) + ' points), but with a single seed there is no way to tell skill from luck, and no CI can be worked out. ';
        if (tg > 0 && res.gap < 0) h += 'Here B is truly ' + tg.toFixed(1) + ' points better, yet this run shows it <b>losing</b>. One seed is close to a coin toss.';
        else h += 'Press <b>Re-run</b> a few times and watch the order flip.';
      } else if (res.verdict === 'noise') {
        tone = 'warn';
        h = '<b>The gap could easily be noise.</b> ' + (res.gap >= 0 ? 'B is ahead by ' : 'B is behind by ') + Math.abs(res.gap).toFixed(2) + ' points, but the 95% CI of the gap (' + ciText(res.ci) + ') includes 0, so “no real difference” is still believable. More seeds or a bigger test set would narrow it.';
      } else {
        tone = 'good';
        var winner = res.verdict === 'b' ? 'B' : 'A';
        h = '<b>' + (winner === 'B' ? 'B’s lead looks real.' : 'A is really ahead.') + '</b> The gap is ' + sgn(res.gap, 2) + ' points and the whole 95% CI (' + ciText(res.ci) + ') sits ' + (winner === 'B' ? 'above' : 'below') + ' 0.';
        if ((winner === 'B' && tg <= 0) || (winner === 'A' && tg >= 0)) {
          h += ' But in truth ' + winner + ' is not better: this is a <b>false alarm</b>. A 95% CI still gets fooled now and then (about 1 time in 20, and more often with few seeds).';
        } else if (res.k < 10) {
          h += ' Careful: with fewer than 10 seeds, a bootstrap CI tends to come out a little too narrow, so a borderline result deserves more runs.';
        }
      }
      if (S.mode === 'cherry') {
        h += '<br><b>Cherry-picked claim:</b> B’s best run (' + pct(B.best) + ') minus A’s mean (' + pct(A.mean) + ') = ' + sgn(res.claimed, 2) + ' points, versus an honest ' + sgn(res.gap, 2) + '.';
        if (res.k === 1) h += ' With only one run there is nothing to pick from, so here it matches the honest gap.';
        else h += ' Showing only the best of ' + res.k + ' runs added ' + res.inflation.toFixed(2) + ' points of pure luck.';
        if (tg <= 0 && res.claimed > 0) h += ' B is truly no better than A, yet the cherry-picked number says it wins.';
      }
      return { html: h, tone: tone };
    }
    function verdictPlain(res) {
      var div = document.createElement('div');
      div.innerHTML = verdictHtml(res).html.replace(/<br>/g, ' ');
      return div.textContent;
    }

    function updateText(res) {
      var v = verdictHtml(res);
      setHtml(elVerdict, 'vd', v.html);
      var tone = v.tone;
      if (lastText.tone !== tone) {
        lastText.tone = tone;
        elVerdict.style.borderLeftColor = tone === 'warn' ? 'var(--bad)' : tone === 'good' ? 'var(--ok)' : 'var(--indigo)';
        elVerdict.style.background = tone === 'warn' ? 'var(--bad-soft)' : tone === 'good' ? 'var(--ok-soft)' : 'var(--indigo-soft)';
      }
      setText(elGap, 'gap', sgn(res.gap, 2) + ' pts');
      setText(elCi, 'ci', res.ci ? ciText(res.ci) : 'needs 2+ runs');
      var mid = (muA() + muB()) / 2;
      setText(elSpread, 'sp', '±' + runSd(mid).toFixed(2) + ' pts');
      setText(elTnoise, 'tn', '±' + testSd(mid).toFixed(2) + ' pts');

      // results table
      var A = res.A, B = res.B, cherry = S.mode === 'cherry', k = res.k;
      function row(name, Sm, isB) {
        var acc, ci, runs;
        if (cherry && isB) {
          acc = '<b>' + Sm.best.toFixed(2) + '</b> <span class="small">(best run only)</span>';
          ci = '<span class="muted">not reported</span>';
          runs = k > 1 ? 'best of ' + k : '1';
        } else {
          acc = k > 1 ? Sm.mean.toFixed(2) + ' ± ' + Sm.sd.toFixed(2) : Sm.mean.toFixed(2);
          ci = k > 1 ? Sm.lo.toFixed(2) + ' to ' + Sm.hi.toFixed(2) : '<span class="muted">needs 2+ runs</span>';
          runs = String(k);
        }
        return '<tr><th scope="row" style="font-size:inherit;text-transform:none;letter-spacing:0;color:var(--ink)"><span aria-hidden="true" style="display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;background:var(' + (isB ? '--series-2' : '--series-1') + ')"></span>' + name + '</th>' +
          '<td class="mono" style="white-space:nowrap">' + acc + '</td><td class="mono" style="white-space:nowrap">' + ci + '</td><td style="white-space:nowrap">' + runs + '</td></tr>';
      }
      setHtml(elTbody, 'tb', row('A (old model)', A, false) + row('B (new model)', B, true));
      var head;
      if (cherry) {
        head = '<b>Headline claim:</b> “B beats A by ' + sgn(res.claimed, 2) + ' points.” <span aria-hidden="true" style="color:var(--bad)">●</span> Red flag: B’s number is a single best run with no ±, set against A’s average. The honest gap is ' + sgn(res.gap, 2) + ' points.';
      } else if (k > 1) {
        head = '<b>Headline:</b> B − A = ' + sgn(res.gap, 2) + ' points, bootstrap 95% CI ' + ciText(res.ci) + ' points. The ± numbers are each model’s sample SD over its ' + k + ' runs.';
      } else {
        head = '<b>Headline:</b> B − A = ' + sgn(res.gap, 2) + ' points from a single run each, with no ± at all. A reader cannot tell if this is real.';
      }
      setHtml(elHeadline, 'hl', head);
      setText(elTline, 'tl', k > 1 ?
        'CI of the mean = mean ± t × SD ÷ √runs. With ' + k + ' runs, t = ' + A.t.toFixed(3) + ' (from the t distribution with ' + (k - 1) + ' degrees of freedom, which is runs − 1). With few runs t is big, which widens the CI; as runs grow, t falls towards 1.960.' :
        'With 1 run there is no SD, so no CI: you need at least 2 runs to measure spread.');

      // tally of experiments at these settings
      var tl = 'Experiment #' + S.exp + '. ';
      if (tally.n > 1 || S.exp > 1) {
        tl += 'Since your last settings change: ' + tally.n + (tally.n === 1 ? ' experiment' : ' experiments') + ', B scored lower than A in ' + tally.lower;
        tl += k > 1 ? ', and the CI of the gap sat fully above 0 in ' + tally.clear + '.' : '.';
      } else {
        tl += 'Press Re-run to train every model again with fresh seeds.';
      }
      setText(elTally, 'ty', tl);

      canvas.setAttribute('aria-label',
        'Dot plot of ' + k + (k === 1 ? ' run' : ' runs') + ' per model on a ' + fmtIN(testN()) + '-example test set. ' +
        'Model A: mean ' + pct(A.mean) + (k > 1 ? ', 95% CI ' + pct(A.lo) + ' to ' + pct(A.hi) : '') + ', true accuracy ' + muA().toFixed(1) + '%. ' +
        'Model B: mean ' + pct(B.mean) + (k > 1 ? ', 95% CI ' + pct(B.lo) + ' to ' + pct(B.hi) : '') + ', best run ' + pct(B.best) + ', true accuracy ' + muB().toFixed(1) + '%. ' +
        'Gap B minus A: ' + sgn(res.gap, 2) + ' points' + (res.ci ? ', bootstrap 95% CI ' + ciText(res.ci) + ' points.' : '; no CI with one run.') +
        (S.mode === 'cherry' ? ' Cherry-picked claim: ' + sgn(res.claimed, 2) + ' points.' : ''));
    }

    function announce(extra, now) {
      if (liveTimer) clearTimeout(liveTimer);
      liveTimer = setTimeout(function () {
        liveTimer = 0;
        if (destroyed || !R) return;
        elLive.textContent = (extra ? extra + ' ' : '') + verdictPlain(R);
      }, now ? 60 : 900);
    }

    /* ---------- tasks ---------- */
    function checkTasks(cause) {
      var res = R, msgs = [];
      if (cause === 'rerun' && res.k === 1 && res.trueGap > 0 && res.B.mean < res.A.mean) {
        if (completeTask('t1')) msgs.push('Task done: B is truly better, yet one unlucky seed made it lose. That is why a single run proves nothing.');
      }
      if (Math.abs(res.trueGap - 0.5) < 0.051 && res.k >= 5 && res.ci && res.ci.lo > 0) {
        if (completeTask('t2')) {
          var s2 = runSd((muA() + muB()) / 2), need = Math.ceil(2 * s2 * s2 * Math.pow(Z975 + Z80, 2) / 0.25);
          msgs.push('Task done: with ' + res.k + ' seeds the CI cleared 0. Re-run a few times: it will not clear every time. With this much noise, about ' + need + ' seeds per model would spot a 0.5-point gap 8 times out of 10.');
        }
      }
      if (S.mode === 'cherry' && res.k >= 5 && res.inflation >= 0.5 - 1e-9) {
        if (completeTask('t3')) msgs.push('Task done: picking B’s best of ' + res.k + ' runs inflated the gap by ' + res.inflation.toFixed(2) + ' points. More runs to pick from means a luckier best run.');
      }
      if (visited.small && visited.big) {
        if (completeTask('t4')) msgs.push('Task done: test-set luck falls with √n, so 100 times more test examples gives 10 times less of it. Seed-to-seed spread stays, though: a bigger test set cannot fix that.');
      }
      return msgs.join(' ');
    }

    /* ---------- recompute + draw ---------- */
    function snapshot(res) {
      return {
        a: res.a.slice(), b: res.b.slice(), mA: res.A.mean, mB: res.B.mean, loA: res.A.lo, hiA: res.A.hi, loB: res.B.lo, hiB: res.B.hi,
        gap: res.gap, ciLo: res.ci ? res.ci.lo : NaN, ciHi: res.ci ? res.ci.hi : NaN, claimed: res.claimed
      };
    }
    function refresh(cause, extraNote) {
      var prev = R;
      R = compute();
      var key = settingsKey();
      if (cause === 'rerun' && tally.key === key) tally.n++;
      else { tally = { key: key, n: 1, lower: 0, clear: 0 }; }
      if (cause === 'rerun' || tally.n === 1) {
        if (R.B.mean < R.A.mean) tally.lower++;
        if (R.ci && R.ci.lo > 0) tally.clear++;
      }
      updateOutputs();
      var taskMsg = cause === 'mount' ? '' : checkTasks(cause);
      var noteText = [extraNote || '', taskMsg].filter(Boolean).join(' ');
      if (cause !== 'mount') setText(elNote, 'note', noteText);
      updateText(R);
      if (cause === 'rerun' && prev && prev.k === R.k && !(reduceMQ && reduceMQ.matches)) {
        anim = { from: snapshot(prev), to: snapshot(R), t0: 0, dur: 420 };
      } else anim = null;
      if (cause !== 'mount') announce(noteText, cause === 'rerun' || cause === 'mode' || cause === 'reset');
      requestDraw();
    }
    function requestDraw() {
      needDraw = true;
      if (!rafId && !destroyed) rafId = requestAnimationFrame(tick);
    }
    function tick(now) {
      rafId = 0;
      if (destroyed) return;
      if (anim) {
        if (!anim.t0) anim.t0 = now;
        needDraw = true;
      }
      if (needDraw) paint(now);
      if (anim) rafId = requestAnimationFrame(tick);
    }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function currentView(now) {
      var to = snapshot(R);
      if (!anim) return to;
      var t = clamp((now - anim.t0) / anim.dur, 0, 1), e = 1 - Math.pow(1 - t, 3), f = anim.from;
      if (t >= 1) { anim = null; return to; }
      var v = {}, kk;
      for (kk in to) {
        if (!Object.prototype.hasOwnProperty.call(to, kk)) continue;
        if (Array.isArray(to[kk])) v[kk] = to[kk].map(function (x, i) { return lerp(f[kk][i], x, e); });
        else v[kk] = isFinite(f[kk]) && isFinite(to[kk]) ? lerp(f[kk], to[kk], e) : to[kk];
      }
      return v;
    }

    /* ---------- geometry ---------- */
    function layout() {
      var W = dims.w, H = dims.h, narrow = W < 440;
      var padL = narrow ? 34 : 70, padR = narrow ? 12 : 64;
      var p1Top = 30;
      var p1Bot = Math.round(H * 0.56);
      var axis1 = p1Bot;                       // tick labels sit just below
      var p2Title = p1Bot + 42;
      var p2Top = p2Title + 20;
      var p2Bot = H - 24;
      return { W: W, H: H, narrow: narrow, padL: padL, padR: padR, plotW: Math.max(20, W - padL - padR), p1Top: p1Top, p1Bot: p1Bot, axis1: axis1, p2Title: p2Title, p2Top: p2Top, p2Bot: p2Bot, rowH: (p1Bot - p1Top) / 2 };
    }
    function scoreRange() {
      var mid = (muA() + muB()) / 2, s = Math.max(runSd(muA()), runSd(muB()));
      var lo = Math.min(muA(), muB()) - 3.6 * s, hi = Math.max(muA(), muB()) + 3.6 * s;
      if (hi - lo < 2) { lo = mid - 1; hi = mid + 1; }
      return { lo: lo, hi: hi };
    }
    function gapRange() {
      var s = Math.sqrt(runSd(muA()) * runSd(muA()) + runSd(muB()) * runSd(muB()));
      var tg = (S.b - S.a) / 10;
      var lo = Math.min(0, tg) - 3.4 * s, hi = Math.max(0, tg) + 3.4 * s;
      if (hi - lo < 2) { var m = (lo + hi) / 2; lo = m - 1; hi = m + 1; }
      return { lo: lo, hi: hi };
    }

    function wantAspect() { return wrap.getBoundingClientRect().width >= 560 ? '16 / 11' : '20 / 21'; }
    function applyAspect() {
      aspectRaf = 0;
      if (destroyed) return;
      var a = wantAspect();
      if (a !== curAspect) { curAspect = a; wrap.style.aspectRatio = a; }
    }
    function resize() {
      if (wantAspect() !== curAspect && !aspectRaf) aspectRaf = requestAnimationFrame(applyAspect);
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      var r = canvas.getBoundingClientRect();
      var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      if (w === dims.w && h === dims.h && dpr === dims.dpr && canvas.width > 1) return;
      dims.w = w; dims.h = h; dims.dpr = dpr;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      // setting the size wipes the canvas: repaint now so there is no blank frame
      if (R && !destroyed) paint(performance.now());
    }

    /* ---------- drawing ---------- */
    function font(T, px, weight) { return (weight ? weight + ' ' : '') + px + 'px ' + T.font; }
    function paint(now) {
      needDraw = false;
      if (!R) return;
      var T = readTheme(), L = layout(), v = currentView(now || performance.now());
      g.setTransform(dims.dpr, 0, 0, dims.dpr, 0, 0);
      g.clearRect(0, 0, L.W, L.H);
      g.fillStyle = T.surface; g.fillRect(0, 0, L.W, L.H);
      hitDots = [];
      drawScores(T, L, v);
      drawGap(T, L, v);
    }

    // greedy dot stacking: each dot takes the first free level (0, −1, +1, −2, +2 ...) around the row centre
    function stack(xs, r, maxLevel) {
      var order = xs.map(function (x, i) { return i; }).sort(function (p, q) { return xs[p] - xs[q]; });
      var placed = [], lv = new Array(xs.length), d = 2 * r + 1;
      order.forEach(function (i) {
        var chosen = 0;
        for (var tries = 0; tries <= 2 * maxLevel; tries++) {
          var l = tries === 0 ? 0 : (tries % 2 ? -Math.ceil(tries / 2) : Math.ceil(tries / 2)), ok = true;
          for (var j = 0; j < placed.length; j++) {
            var q = placed[j];
            if (q.l === l && Math.abs(q.x - xs[i]) < d) { ok = false; break; }
          }
          if (ok) { chosen = l; break; }
          chosen = 0;
        }
        lv[i] = chosen;
        placed.push({ x: xs[i], l: chosen });
      });
      return lv;
    }
    function edgeArrow(x, y, dir, color) {
      g.fillStyle = color;
      g.beginPath(); g.moveTo(x + 7 * dir, y); g.lineTo(x - 2 * dir, y - 6); g.lineTo(x - 2 * dir, y + 6); g.closePath(); g.fill();
    }
    function ciBar(x0, x1, y, color, width) {
      g.strokeStyle = color; g.lineWidth = width; g.lineCap = 'butt';
      g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
      g.lineWidth = 2;
      g.beginPath(); g.moveTo(x0, y - 6); g.lineTo(x0, y + 6); g.moveTo(x1, y - 6); g.lineTo(x1, y + 6); g.stroke();
    }

    function drawScores(T, L, v) {
      var sr = scoreRange(), x0 = L.padL, x1 = L.padL + L.plotW;
      function sx(val) { return x0 + (val - sr.lo) / (sr.hi - sr.lo) * L.plotW; }
      // title
      g.fillStyle = T.ink; g.font = font(T, L.narrow ? 12 : 13, '600'); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      g.fillText(L.narrow ? 'Test accuracy of each run (%)' : 'Test accuracy of each run (%), one dot per seed', 10, 19);
      // grid + ticks
      var step = niceStep((sr.hi - sr.lo) / (L.narrow ? 4 : 7)), dec = step < 0.1 ? 2 : step < 1 ? 1 : 0;
      g.lineWidth = 1; g.font = font(T, 11); g.textAlign = 'center'; g.textBaseline = 'top';
      for (var t = Math.ceil(sr.lo / step) * step; t <= sr.hi + 1e-9; t += step) {
        var px = Math.round(sx(t)) + 0.5;
        g.strokeStyle = T.line; g.beginPath(); g.moveTo(px, L.p1Top); g.lineTo(px, L.p1Bot); g.stroke();
        var lab = t.toFixed(dec), hw = g.measureText(lab).width / 2;
        g.fillStyle = T.muted;
        g.fillText(lab, clamp(px, hw + 2, L.W - hw - 2), L.axis1 + 5);
      }
      var cherry = S.mode === 'cherry', k = R.k;
      var r = L.narrow ? 4.5 : 5.5;
      var rows = [
        { key: 'a', name: 'Model A', short: 'A', mu: muA(), xs: v.a, m: v.mA, lo: v.loA, hi: v.hiA, color: T.series1, rgb: T.rgb.series1 },
        { key: 'b', name: 'Model B', short: 'B', mu: muB(), xs: v.b, m: v.mB, lo: v.loB, hi: v.hiB, color: T.series2, rgb: T.rgb.series2 }
      ];
      var bestIdx = R.B.bestIdx;
      rows.forEach(function (row, ri) {
        var top = L.p1Top + ri * L.rowH + 4, bot = L.p1Top + (ri + 1) * L.rowH - 4;
        var ciY = bot - 10, dotC = top + (ciY - 12 - top) / 2;
        // band
        g.fillStyle = T.surface2; g.fillRect(x0, top, L.plotW, bot - top);
        // row label with a coloured marker
        g.font = font(T, L.narrow ? 13 : 13, '700'); g.textBaseline = 'middle'; g.textAlign = 'left';
        g.fillStyle = row.color; g.beginPath(); g.arc(8, dotC, 4, 0, Math.PI * 2); g.fill();
        g.fillStyle = T.ink; g.fillText(L.narrow ? row.short : row.name, 16, dotC);
        // true accuracy (dashed)
        var tx = sx(row.mu);
        g.strokeStyle = T.muted; g.lineWidth = 1.5; g.setLineDash([5, 4]);
        g.beginPath(); g.moveTo(tx, top + 2); g.lineTo(tx, bot - 2); g.stroke(); g.setLineDash([]);
        // dots
        var levels = Math.max(0, Math.floor(((ciY - 12 - top) / 2 - r) / (2 * r + 1)));
        var cx = row.xs.map(function (val) { return clamp(sx(val), x0 + r, x1 - r); });
        var lv = stack(cx, r, levels);
        for (var i = 0; i < row.xs.length; i++) {
          var val = row.xs[i], px2 = cx[i], py = dotC + lv[i] * (2 * r + 1);
          var dim = cherry && row.key === 'b' && i !== bestIdx && k > 1;
          g.beginPath(); g.arc(px2, py, r, 0, Math.PI * 2);
          g.fillStyle = dim ? rgba(row.rgb, 0.3) : row.color; g.fill();
          g.lineWidth = 1.2; g.strokeStyle = T.surface; g.stroke();
          if (val < sr.lo) edgeArrow(x0 - 1, py, -1, T.ink);
          if (val > sr.hi) edgeArrow(x1 + 1, py, 1, T.ink);
          hitDots.push({ x: px2, y: py, model: row.key, i: i, score: R[row.key][i] });
        }
        // cherry-picked best run of B
        if (cherry && row.key === 'b') {
          var bx = cx[bestIdx], by = dotC + lv[bestIdx] * (2 * r + 1);
          g.lineWidth = 3; g.strokeStyle = T.haldi; g.beginPath(); g.arc(bx, by, r + 4, 0, Math.PI * 2); g.stroke();
          g.lineWidth = 1; g.strokeStyle = T.ink; g.beginPath(); g.arc(bx, by, r + 6, 0, Math.PI * 2); g.stroke();
          g.fillStyle = T.ink; g.font = font(T, 11, '700'); g.textBaseline = 'bottom';
          g.textAlign = bx > x1 - 50 ? 'right' : bx < x0 + 50 ? 'left' : 'center';
          var labY = by - r - 8;
          if (labY - 12 < top) labY = by + r + 20;
          g.fillText('best run', bx, labY);
        }
        // mean + 95% CI (t-based)
        if (k > 1 && isFinite(row.lo)) {
          var a0 = sx(row.lo), a1 = sx(row.hi);
          ciBar(clamp(a0, x0, x1), clamp(a1, x0, x1), ciY, T.ink, 3);
          if (a0 < x0) edgeArrow(x0 - 1, ciY, -1, T.ink);
          if (a1 > x1) edgeArrow(x1 + 1, ciY, 1, T.ink);
        }
        var mx = clamp(sx(row.m), x0, x1);
        g.strokeStyle = T.ink; g.lineWidth = 3;
        g.beginPath(); g.moveTo(mx, ciY - 9); g.lineTo(mx, ciY + 9); g.stroke();
        // mean value in the right margin
        if (!L.narrow) {
          g.fillStyle = T.ink; g.font = font(T, 12, '600'); g.textAlign = 'left'; g.textBaseline = 'middle';
          g.fillText(row.m.toFixed(2) + '%', x1 + 8, ciY);
          g.fillStyle = T.muted; g.font = font(T, 11);
          g.fillText('mean', x1 + 8, ciY - 15);
        }
      });
    }

    function drawGap(T, L, v) {
      var gr = gapRange(), x0 = L.padL, x1 = L.padL + L.plotW;
      function gx(val) { return x0 + (val - gr.lo) / (gr.hi - gr.lo) * L.plotW; }
      // separator + title
      g.strokeStyle = T.line; g.lineWidth = 1;
      g.beginPath(); g.moveTo(0, L.p2Title - 18.5); g.lineTo(L.W, L.p2Title - 18.5); g.stroke();
      g.fillStyle = T.ink; g.font = font(T, L.narrow ? 12 : 13, '600'); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      g.fillText(L.narrow ? 'Gap B − A (points)' : 'Gap: B minus A, in points', 10, L.p2Title);
      var ciY = L.p2Bot - 16, histBot = ciY - 14, histTop = L.p2Top + 16;
      // ticks
      var step = niceStep((gr.hi - gr.lo) / (L.narrow ? 4 : 7)), dec = step < 0.1 ? 2 : step < 1 ? 1 : 0;
      g.lineWidth = 1; g.font = font(T, 11); g.textAlign = 'center'; g.textBaseline = 'top';
      for (var t = Math.ceil(gr.lo / step) * step; t <= gr.hi + 1e-9; t += step) {
        var px = Math.round(gx(t)) + 0.5;
        g.strokeStyle = T.line; g.beginPath(); g.moveTo(px, L.p2Top); g.lineTo(px, L.p2Bot); g.stroke();
        var lab = Math.abs(t) < step / 1e6 ? '0' : sgn(t, dec), hw = g.measureText(lab).width / 2;
        g.fillStyle = T.muted;
        g.fillText(lab, clamp(px, hw + 2, L.W - hw - 2), L.p2Bot + 5);
      }
      // left label
      if (!L.narrow) {
        g.fillStyle = T.ink; g.font = font(T, 13, '700'); g.textAlign = 'left'; g.textBaseline = 'middle';
        g.fillText('B − A', 10, ciY);
      }
      // bootstrap histogram
      if (R.boot) {
        var bins = clamp(Math.round(L.plotW / 5), 30, 110), counts = new Array(bins), i, maxC = 0;
        for (i = 0; i < bins; i++) counts[i] = 0;
        var bw = (gr.hi - gr.lo) / bins;
        for (i = 0; i < R.boot.length; i++) {
          var bi = Math.floor((R.boot[i] - gr.lo) / bw);
          if (bi >= 0 && bi < bins) counts[bi]++;
        }
        for (i = 0; i < bins; i++) if (counts[i] > maxC) maxC = counts[i];
        var pw = L.plotW / bins;
        for (i = 0; i < bins; i++) {
          if (!counts[i]) continue;
          var hgt = Math.max(1.5, (histBot - histTop) * counts[i] / maxC);
          var inside = !anim && R.ci && (gr.lo + (i + 0.5) * bw) >= R.ci.lo && (gr.lo + (i + 0.5) * bw) <= R.ci.hi;
          g.fillStyle = rgba(T.rgb.series4, inside || anim ? 0.6 : 0.28);
          g.fillRect(x0 + i * pw + 0.5, histBot - hgt, Math.max(1, pw - 1), hgt);
        }
      } else {
        g.fillStyle = T.muted; g.font = font(T, 12); g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('No bootstrap with 1 run: it needs 2 or more runs per model.', (x0 + x1) / 2, (histTop + histBot) / 2);
      }
      // zero line and true gap
      var zx = gx(0), tg = (S.b - S.a) / 10, tx = gx(tg);
      g.strokeStyle = T.ink; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(zx, L.p2Top + 2); g.lineTo(zx, L.p2Bot); g.stroke();
      g.strokeStyle = T.muted; g.lineWidth = 1.5; g.setLineDash([5, 4]);
      g.beginPath(); g.moveTo(tx, L.p2Top + 2); g.lineTo(tx, L.p2Bot); g.stroke(); g.setLineDash([]);
      g.font = font(T, 11, '600'); g.textBaseline = 'middle';
      var labelY = L.p2Top + 6, right = tg >= 0;
      g.fillStyle = T.ink; g.textAlign = right ? 'right' : 'left';
      g.fillText('no gap', zx + (right ? -4 : 4), labelY);
      if (Math.abs(tx - zx) > 1) {
        g.fillStyle = T.muted; g.textAlign = right ? 'left' : 'right';
        g.fillText('true gap', tx + (right ? 4 : -4), labelY);
      }
      // CI of the gap + observed gap
      if (isFinite(v.ciLo)) {
        var c0 = gx(v.ciLo), c1 = gx(v.ciHi);
        ciBar(clamp(c0, x0, x1), clamp(c1, x0, x1), ciY, T.ink, 3);
        if (c0 < x0) edgeArrow(x0 - 1, ciY, -1, T.ink);
        if (c1 > x1) edgeArrow(x1 + 1, ciY, 1, T.ink);
      }
      var ox = gx(v.gap);
      if (S.mode === 'cherry') {
        var cx = gx(v.claimed), ccx = clamp(cx, x0 + 7, x1 - 7);
        g.strokeStyle = T.haldi; g.lineWidth = 2.5; g.setLineDash([4, 3]);
        g.beginPath(); g.moveTo(clamp(ox, x0, x1), ciY); g.lineTo(ccx, ciY); g.stroke(); g.setLineDash([]);
        g.beginPath(); g.moveTo(ccx, ciY - 8); g.lineTo(ccx + 8, ciY); g.lineTo(ccx, ciY + 8); g.lineTo(ccx - 8, ciY); g.closePath();
        g.fillStyle = T.haldi; g.fill(); g.lineWidth = 1.5; g.strokeStyle = T.ink; g.stroke();
        g.fillStyle = T.ink; g.font = font(T, 11, '700'); g.textBaseline = 'bottom';
        g.textAlign = ccx > x1 - 40 ? 'right' : 'center';
        g.fillText('claimed', ccx, ciY - 10);
        if (cx > x1) edgeArrow(x1 + 1, ciY, 1, T.ink);
      }
      var ocx = clamp(ox, x0 + 6, x1 - 6);
      g.beginPath(); g.arc(ocx, ciY, 6, 0, Math.PI * 2);
      g.fillStyle = T.series4; g.fill(); g.lineWidth = 1.5; g.strokeStyle = T.ink; g.stroke();
      if (!L.narrow) {
        g.fillStyle = T.ink; g.font = font(T, 12, '600'); g.textAlign = 'left'; g.textBaseline = 'middle';
        g.fillText(sgn(v.gap, 2), x1 + 8, ciY);
        g.fillStyle = T.muted; g.font = font(T, 11);
        g.fillText('gap', x1 + 8, ciY - 15);
      }
    }

    /* ---------- pointer: read a dot ---------- */
    function localPt(e) { var rc = canvas.getBoundingClientRect(); return { x: e.clientX - rc.left, y: e.clientY - rc.top }; }
    function nearest(p, rad) {
      var best = null, bd = rad * rad;
      for (var i = 0; i < hitDots.length; i++) {
        var d = hitDots[i], dx = d.x - p.x, dy = d.y - p.y, dd = dx * dx + dy * dy;
        if (dd <= bd) { bd = dd; best = d; }
      }
      return best;
    }
    function showDot(d) {
      var key = d ? d.model + d.i : '';
      if (key === hoverKey) return;
      hoverKey = key;
      if (!d) { setText(elReadout, 'ro', 'Hover over or tap a dot to read that run’s score.'); return; }
      var name = d.model === 'a' ? 'Model A' : 'Model B', mu = d.model === 'a' ? muA() : muB();
      var isBest = d.model === 'b' && d.i === R.B.bestIdx && R.k > 1;
      setText(elReadout, 'ro', name + ', run ' + (d.i + 1) + ' of ' + R.k + ': ' + pct(d.score) + ' (true accuracy ' + mu.toFixed(1) + '%, so this run was ' + sgn(d.score - mu, 2) + ' points lucky)' + (isBest ? '. This is B’s best run.' : '.'));
    }
    on(canvas, 'pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var d = nearest(localPt(e), 12);
      canvas.style.cursor = d ? 'pointer' : 'default';
      showDot(d);
    });
    on(canvas, 'pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      var d = nearest(localPt(e), e.pointerType === 'mouse' ? 12 : 22);
      if (d) showDot(d);
    });
    on(canvas, 'pointerleave', function (e) { if (e.pointerType === 'mouse') { canvas.style.cursor = 'default'; showDot(null); } });

    /* ---------- controls ---------- */
    var prevTestSd = null;
    function onSlider(el, field) {
      on(el, 'input', function () {
        var v = parseInt(el.value, 10);
        if (!isFinite(v) || v === S[field]) return;
        var before = testSd((muA() + muB()) / 2);
        S[field] = v;
        var extra = '';
        if (field === 'nIdx') {
          var n = testN();
          if (n <= SMALL_TEST) visited.small = true;
          if (n >= BIG_TEST) visited.big = true;
          var after = testSd((muA() + muB()) / 2);
          if (prevTestSd === null) prevTestSd = before;
          extra = 'Test set: ' + fmtIN(n) + ' examples. Test-set luck per run is now about ±' + after.toFixed(2) + ' points (it was ±' + before.toFixed(2) + ').';
        } else if (field === 'k') {
          extra = S.k === 1 ? 'One run per model: nothing to measure the spread with.' : '';
        }
        hoverKey = '';
        refresh('input', extra);
      });
    }
    onSlider(elA, 'a'); onSlider(elB, 'b'); onSlider(elSd, 'sd'); onSlider(elK, 'k'); onSlider(elN, 'nIdx');
    Array.prototype.forEach.call(modeBtns, function (btn) {
      on(btn, 'click', function () {
        var m = btn.getAttribute('data-mode');
        if (m === S.mode) return;
        S.mode = m;
        refresh('mode', m === 'cherry' ? 'Cherry-pick mode: the paper now shows only B’s best run, against A’s average.' : 'Honest mode: both models are reported as the mean of all their runs.');
      });
    });
    on(btnRerun, 'click', function () {
      S.exp++;
      draws = makeDraws(S.exp);
      hoverKey = '';
      showDot(null);
      refresh('rerun', '');
    });
    on(btnReset, 'click', function () {
      S.a = DEF.a; S.b = DEF.b; S.sd = DEF.sd; S.k = DEF.k; S.nIdx = DEF.nIdx; S.mode = 'honest'; S.exp = 1;
      elA.value = DEF.a; elB.value = DEF.b; elSd.value = DEF.sd; elK.value = DEF.k; elN.value = DEF.nIdx;
      draws = makeDraws(S.exp);
      hoverKey = '';
      showDot(null);
      refresh('reset', 'Back to the starting settings and experiment #1.');
    });

    /* ---------- theme + resize ---------- */
    function onTheme() { requestDraw(); }
    var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mql) { if (mql.addEventListener) mql.addEventListener('change', onTheme); else if (mql.addListener) mql.addListener(onTheme); }
    on(document, 'themechange', onTheme);
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { resize(); }); ro.observe(wrap); }
    else on(window, 'resize', resize);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!destroyed) requestDraw(); });

    /* ---------- start ---------- */
    applyAspect();
    refresh('mount', '');
    resize();
    paint(performance.now());

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
        if (top.parentNode) top.parentNode.removeChild(top);
      }
    };
  }

  Labs.significance = {
    id: 'significance',
    module: 'l4-research-career',
    title: 'Is the improvement real?',
    summary: 'Simulate two models over many random seeds and a finite test set, and learn to tell a real improvement from seed luck, test-set luck and cherry-picking.',
    tasks: TASKS,
    mount: mount,
    _test: { tQuantile: tQuantile, tCdf: tCdf, bootstrap: bootstrap, quantileSorted: quantileSorted, summarise: summarise }
  };
})();
