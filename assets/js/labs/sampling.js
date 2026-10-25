/* AI Marg lab: how an LLM picks its next token.
   A tiny word-level language model (trigram counts, falling back to the last word, plus a small stand-in
   count for words never seen in that spot) is trained on 66 built-in sentences about India when the lab mounts.
   The learner sets temperature, top-k and top-p, then samples or generates text and sees, for the next token,
   the counts, the logits (log counts), the softmax chances before filtering and the final chances after it.
   Plain classic script (ES2019). Registers window.AILabs.sampling. No libraries, no network, no storage. */
(function () {
  'use strict';
  var Labs = (window.AILabs = window.AILabs || {});
  var mountCount = 0;

  /* ---------- the training text: short, simple sentences about India ---------- */
  var CORPUS = [
    'we drink hot chai every morning',
    'we drink hot chai at the station',
    'my grandmother makes hot chai with ginger',
    'my mother makes masala chai with milk and sugar',
    'people in kolkata drink chai from clay cups',
    'people in mumbai love cricket and street food',
    'people in delhi love the winter and hot food',
    'people in chennai love filter coffee and music',
    'people in kolkata love football and sweets',
    'the train to delhi leaves at night',
    'the train to mumbai is always full',
    'the train to chennai runs on time',
    'the train to kolkata stops at every station',
    'the train to goa passes green hills',
    'we took the train to goa during the holidays',
    'the station was full of people and noise',
    'a chai seller walks along the train',
    'the chai seller shouts chai chai at every station',
    'india won the match by five wickets',
    'india won the world cup in 2011',
    'india lost the match in the last over',
    'virat hit a six in the last over',
    'rohit hit a four and the crowd cheered',
    'the crowd cheered when india won the match',
    'we play cricket in the street every evening',
    'my friend plays cricket for his school',
    'the match was played in mumbai',
    'the ball went over the wall for a six',
    'during diwali we light lamps and eat sweets',
    'during holi we play with colours and water',
    'during eid we eat sweets with our friends',
    'during pongal families cook rice with milk and jaggery',
    'during onam people make flower carpets',
    'during navratri people dance all night',
    'diwali is the festival of lights',
    'holi is the festival of colours',
    'people light lamps on diwali night',
    'children burst crackers on diwali night',
    'my grandmother makes sweets for diwali',
    'we visit our family during the festival',
    'mumbai is famous for street food and films',
    'delhi is famous for old forts and markets',
    'kolkata is famous for sweets and books',
    'chennai is famous for temples and music',
    'jaipur is famous for pink walls and forts',
    'bengaluru is famous for gardens and computers',
    'hyderabad is famous for biryani and pearls',
    'goa is famous for beaches and music',
    'it rains a lot in mumbai in july',
    'it is very hot in delhi in may',
    'the city is full of people and traffic',
    'we ate biryani in hyderabad',
    'we ate vada pav in mumbai',
    'we ate dosa in chennai',
    'the auto driver took us to the station',
    'the metro in delhi is fast and clean',
    'the trains in india carry millions of people every day',
    'a cup of chai costs ten rupees at the station',
    'a ticket to goa costs five hundred rupees',
    'i love hot chai on a rainy day',
    'i love cricket and i love diwali',
    'i love the train journey to goa',
    'my friend from chennai loves filter coffee',
    'my friend from delhi loves cricket',
    'the children play cricket after school',
    'everyone watches the match on tv'
  ];

  /* ---------- constants ---------- */
  var EPS = 0.0005;     // a never-seen word gets a stand-in count of EPS x (its count in all the text): never exactly zero
  var ROWS = 12;        // candidate words drawn in the chart
  var GEN_N = 15;       // tokens per "Generate"
  var MAX_GEN = 60;     // generated tokens allowed before the text is full
  var PREV_SHOW = 24;   // tokens of the previous run shown for comparison
  var STEP_ONE = 520, STEP_GEN = 190, GEN_GAP = 45;  // animation timings (ms)
  var DEF = { T: 1, k: 10, p: 0.9, mem: 2, seed: 7, prompt: 'the train to' };
  var EXAMPLES = ['the train to', 'people in', 'during', 'india won the', 'we drink hot', 'my friend from'];
  // colour of a generated token = the chance it had when it was picked (shape of the underline repeats "never seen")
  var BUCKETS = [
    { min: 0.6, v: '--series-4', label: '60% or more' },
    { min: 0.3, v: '--series-1', label: '30 to 60%' },
    { min: 0.1, v: '--haldi', label: '10 to 30%' },
    { min: -1, v: '--sindoor', label: 'under 10%' }
  ];
  var TASKS = [
    { id: 't1', text: 'Greedy: set temperature to 0, press “Generate 15 tokens”, then “Reset prompt” and generate again. You get exactly the same text both times (and it may get stuck repeating itself).' },
    { id: 't2', text: 'Chaos: set temperature to 2 (top-k 50 and top-p 1.00 make it even wilder) and generate 15 tokens. When at least 3 never-seen words (wavy underline) sneak in, you are reading nonsense.' },
    { id: 't3', text: 'Set top-k to 1, keep temperature at 1 or more, and generate 15 tokens. It is exactly the greedy text, because only the top word is left to pick.' },
    { id: 't4', text: 'With top-k at 4 or more and temperature above 0, find a top-p value that leaves exactly 3 words possible for the next token.' }
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
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function f2(v) {  // 2 decimals with a real minus sign
    var s = Math.abs(v).toFixed(2);
    return (v < 0 && s !== '0.00' ? '−' : '') + s;
  }
  function pct(p) {
    if (!(p > 0)) return '0%';
    if (p < 0.001) return '<0.1%';
    if (p >= 1 - 1e-12) return '100%';
    if (p > 0.9995) return '>99.9%';
    return (p * 100).toFixed(1) + '%';
  }
  function fcount(c) {  // whole counts as integers, stand-in counts with enough decimals to read
    if (Math.abs(c - Math.round(c)) < 1e-9 && c >= 1) return String(Math.round(c));
    return c >= 0.01 ? c.toFixed(3) : c.toFixed(4);
  }
  function tStr(T) { return T > 0 ? T.toFixed(2) : '0 (greedy)'; }
  function arrEq(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  /* ---------- the model: counts of which word follows which ---------- */
  var MODEL = null;
  function getModel() {
    if (MODEL) return MODEL;
    var vocab = [], index = Object.create(null), uni = [], bi = [], tri = Object.create(null), n = 0;
    function id(w) {
      if (!(w in index)) { index[w] = vocab.length; vocab.push(w); uni.push(0); bi.push(null); }
      return index[w];
    }
    function add(table, key, next) {
      var t = table[key] || (table[key] = { tot: 0, c: Object.create(null) });
      t.c[next] = (t.c[next] || 0) + 1;
      t.tot++;
    }
    id('.');
    CORPUS.forEach(function (s) {
      // every sentence starts after a full stop and ends with one, so "." also means "start of a sentence"
      var t = [0].concat(s.split(' ').map(id), [0]);
      for (var i = 1; i < t.length; i++) {
        uni[t[i]]++; n++;
        add(bi, t[i - 1], t[i]);
        if (i >= 2) add(tri, t[i - 2] * 4096 + t[i - 1], t[i]);
      }
    });
    var alpha = vocab.slice().sort();
    MODEL = { vocab: vocab, index: index, uni: uni, bi: bi, tri: tri, V: vocab.length, nTok: n, alpha: alpha };
    return MODEL;
  }

  // Everything about the next token: counts -> logits -> softmax(logit / T) -> top-k -> top-p -> final chances.
  function nextDist(M, hist, s) {
    var V = M.V, n = hist.length, b = hist[n - 1], a = n >= 2 ? hist[n - 2] : -1;
    var src = null, type = 'uni', ctxW = [], missed = null, w, i;
    if (s.mem === 2 && a >= 0) {
      var tt = M.tri[a * 4096 + b];
      if (tt) { src = tt; type = 'tri'; ctxW = [a, b]; } else missed = [a, b];
    }
    if (!src && M.bi[b]) { src = M.bi[b]; type = 'bi'; ctxW = [b]; }
    var cnt = new Float64Array(V), seen = new Uint8Array(V), logit = new Float64Array(V);
    for (w = 0; w < V; w++) {
      var c = src ? (src.c[w] || 0) : M.uni[w];
      if (c > 0) { cnt[w] = c; seen[w] = 1; } else cnt[w] = EPS * M.uni[w];
      logit[w] = Math.log(cnt[w]);
    }
    var order = [];
    for (w = 0; w < V; w++) order.push(w);
    // fixed order: bigger count first, ties go to the word that is more common overall (so greedy is well defined)
    order.sort(function (x, y) { return cnt[y] - cnt[x] || M.uni[y] - M.uni[x] || x - y; });
    var rank = new Int32Array(V);
    for (i = 0; i < V; i++) rank[order[i]] = i;
    var pb = new Float64Array(V), pf = new Float64Array(V), cut = new Uint8Array(V), cumB = new Float64Array(V);
    var greedy = !(s.T > 0), nK = 0, nByK = greedy ? 1 : Math.min(s.k, V), top = order[0];
    if (greedy) {
      // T -> 0: the softmax piles all the chance on the top word
      pb[top] = 1; pf[top] = 1; nK = 1;
      for (i = 1; i < V; i++) cut[order[i]] = 3;
    } else {
      var mx = logit[top] / s.T, sum = 0;
      for (w = 0; w < V; w++) { pb[w] = Math.exp(logit[w] / s.T - mx); sum += pb[w]; }
      for (w = 0; w < V; w++) pb[w] /= sum;
      // top-k: keep the k highest; top-p: of those, keep the fewest whose chances (rescaled) reach p
      var sk = 0;
      for (i = 0; i < nByK; i++) sk += pb[order[i]];
      for (i = nByK; i < V; i++) cut[order[i]] = 1;
      var cum = 0, reached = false;
      for (i = 0; i < nByK; i++) {
        w = order[i]; cumB[w] = cum;
        if (reached) { cut[w] = 2; continue; }
        nK++; cum += pb[w] / sk;
        if (cum >= s.p - 1e-9) reached = true;
      }
      var sf = 0;
      for (w = 0; w < V; w++) if (!cut[w]) sf += pb[w];
      for (w = 0; w < V; w++) if (!cut[w]) pf[w] = pb[w] / sf;
    }
    return {
      type: type, ctxW: ctxW, missed: missed, tot: src ? src.tot : M.nTok, cnt: cnt, seen: seen, logit: logit,
      order: order, rank: rank, pb: pb, pf: pf, cut: cut, cumB: cumB, nK: nK, nByK: nByK, greedy: greedy,
      s: { T: s.T, k: s.k, p: s.p, mem: s.mem }
    };
  }
  // The dice: walk along the kept words; the roll u (0 to 1) lands inside one word's slice.
  function pickWord(D, u) {
    if (D.greedy) return D.order[0];
    var c = 0, last = D.order[0];
    for (var i = 0; i < D.order.length; i++) {
      var w = D.order[i];
      if (D.cut[w]) break;
      last = w; c += D.pf[w];
      if (u < c) return w;
    }
    return last;
  }

  /* ---------- colours (read from CSS variables at draw time) ---------- */
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
  function luminance(c) {
    function ch(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2]);
  }
  var THEME_VARS = ['--surface', '--surface-2', '--ink', '--muted', '--line', '--indigo', '--on-indigo', '--haldi', '--haldi-soft',
    '--sindoor', '--bad', '--series-1', '--series-4', '--font-body', '--font-mono'];
  var themeCache = { key: '', theme: null };
  function readTheme() {
    var cs = getComputedStyle(document.documentElement), raw = {}, key = '';
    for (var i = 0; i < THEME_VARS.length; i++) { raw[THEME_VARS[i]] = cs.getPropertyValue(THEME_VARS[i]).trim(); key += raw[THEME_VARS[i]] + '|'; }
    if (themeCache.key === key && themeCache.theme) return themeCache.theme;
    var T = {
      surface: toRgb(raw['--surface']), surface2: toRgb(raw['--surface-2']), ink: toRgb(raw['--ink']), muted: toRgb(raw['--muted']),
      line: toRgb(raw['--line']), indigo: toRgb(raw['--indigo']), onIndigo: toRgb(raw['--on-indigo'] || raw['--surface']),
      haldi: toRgb(raw['--haldi']), haldiSoft: toRgb(raw['--haldi-soft']), bad: toRgb(raw['--bad']), s1: toRgb(raw['--series-1']),
      font: raw['--font-body'] || 'system-ui, sans-serif', mono: raw['--font-mono'] || 'ui-monospace, monospace'
    };
    T.dark = luminance(T.surface) < 0.2;
    T.bucket = BUCKETS.map(function (b) { return toRgb(cs.getPropertyValue(b.v).trim()); });
    themeCache = { key: key, theme: T };
    return T;
  }
  function bucketOf(p) { for (var i = 0; i < BUCKETS.length; i++) if (p >= BUCKETS[i].min) return i; return BUCKETS.length - 1; }

  /* ================================================================ */
  function mount(root, ctx) {
    var P = 'smp' + (++mountCount) + '-';
    var M = getModel();
    var listeners = [];
    function on(el, type, fn, opts) { el.addEventListener(type, fn, opts); listeners.push([el, type, fn, opts]); }
    var destroyed = false;
    var mqMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

    function disp(w) { return M.vocab[w]; }
    function chartWord(w) { return w === 0 ? '. (end)' : M.vocab[w]; }

    var tasksHtml = TASKS.map(function (t) { return '<li data-task="' + t.id + '">' + esc(t.text) + '</li>'; }).join('');
    var exHtml = EXAMPLES.map(function (e) { return '<button type="button" class="btn btn-sm" data-ex="' + esc(e) + '">' + esc(e) + '</button>'; }).join('');
    var legendHtml = BUCKETS.map(function (b) { return '<span style="--c:var(' + b.v + ')">' + b.label + '</span>'; }).join('') +
      '<i style="font-style:normal;text-decoration:underline wavy var(--bad);text-underline-offset:3px">never seen there</i>';
    var sentHtml = CORPUS.map(function (s) { return '<li>' + esc(s) + '.</li>'; }).join('');

    root.innerHTML =
      '<div class="lab">' +
        '<p class="lab-note"><strong>What you are seeing:</strong> a tiny language model (a program that guesses the next word) that learned from ' + CORPUS.length + ' short sentences about India when this page opened. ' +
        'It reads and writes <em>tokens</em> (small pieces of text; here every word and full stop is one token). ' +
        'For the next token it gives each of the ' + M.V + ' words it knows a score called a <em>logit</em>: the log of how many times that word came after the last two words. ' +
        '<em>Softmax(logits ÷ T)</em> turns the scores into chances that add up to 100%, where T is the <em>temperature</em>. Then <em>top-k</em> and <em>top-p</em> cross out unlikely words, and a dice roll picks one of the words left. ' +
        'ChatGPT-style models do exactly this, just with a far smarter way of scoring. Click a bar to see its maths, or click a coloured word to see the choice it came from.</p>' +
        '<div class="lab-body">' +
          '<div class="stack-sm">' +
            '<div class="control"><label for="' + P + 'prompt">Starting prompt <span class="val" id="' + P + 'pcount"></span></label>' +
              '<input type="text" id="' + P + 'prompt" value="' + esc(DEF.prompt) + '" autocomplete="off" autocapitalize="none" spellcheck="false" aria-describedby="' + P + 'pmsg">' +
              '<p class="small muted" id="' + P + 'pmsg"></p>' +
              '<div class="row" role="group" aria-label="Example prompts"><span class="small muted">Try:</span>' + exHtml + '</div></div>' +
            '<div class="row-between" style="margin-top:6px"><h4>Text so far</h4><span class="small muted num" id="' + P + 'tcount"></span></div>' +
            '<div id="' + P + 'text" style="background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:10px 12px;font-size:1.08rem;line-height:2;min-height:4.6em;max-height:15em;overflow-y:auto"></div>' +
            '<div class="lab-legend" aria-label="Colour of a generated word: the chance it had when it was picked"><i style="font-style:normal;font-weight:600">Chance when picked:</i>' + legendHtml + '</div>' +
            '<p class="small" id="' + P + 'prev"></p>' +
            '<p class="small" id="' + P + 'note" style="display:none"></p>' +
            '<div class="row">' +
              '<button type="button" class="btn btn-primary" id="' + P + 'sample">Sample next token</button>' +
              '<button type="button" class="btn" id="' + P + 'gen">Generate 15 tokens</button>' +
              '<button type="button" class="btn" id="' + P + 'reset">Reset prompt</button>' +
            '</div>' +
            '<div class="lab-canvas-wrap" id="' + P + 'wrap" style="aspect-ratio:auto;height:450px;margin-top:6px">' +
              // pan-y (not none): the chart only needs taps, and a tall chart must not trap the page scroll on phones
              '<canvas id="' + P + 'cv" tabindex="0" role="img" aria-label="Chances for the next token" style="touch-action:pan-y;outline-offset:-3px"></canvas></div>' +
            '<div class="lab-legend">' +
              '<span style="--c:var(--series-1)">thick bar: final chance after top-k and top-p</span>' +
              '<span style="--c:var(--muted)">thin line: chance from softmax(logit ÷ T), before the cuts</span>' +
            '</div>' +
            '<p class="small" id="' + P + 'readout" style="min-height:4.8em"></p>' +
            '<div class="row"><button type="button" class="btn btn-sm" id="' + P + 'use">Use this word</button>' +
              '<button type="button" class="btn btn-sm" id="' + P + 'back" style="display:none">Back to the next token</button></div>' +
            '<p class="visually-hidden" role="status" aria-live="polite" id="' + P + 'live"></p>' +
            '<div class="lab-stats" style="margin-top:6px">' +
              '<div class="stat"><div class="k">Words possible</div><div class="v" id="' + P + 'snk">—</div></div>' +
              '<div class="stat"><div class="k">Top word’s chance</div><div class="v" id="' + P + 'stop">—</div></div>' +
              '<div class="stat"><div class="k">Model looks at</div><div class="v" id="' + P + 'sctx" style="font-size:.92rem;overflow-wrap:anywhere">—</div></div>' +
              '<div class="stat"><div class="k">Never-seen picks</div><div class="v" id="' + P + 'sns">0</div></div>' +
            '</div>' +
            '<p class="kbd-hint">Keyboard: focus the chart, use the up and down arrows to choose a word, Enter to use it as the next token, Escape to go back to the next token.</p>' +
          '</div>' +
          '<div class="lab-controls">' +
            '<div class="control"><label for="' + P + 'temp">Temperature (T) <output id="' + P + 'tout" for="' + P + 'temp"></output></label>' +
              '<input type="range" id="' + P + 'temp" min="0" max="2" step="0.05" value="' + DEF.T + '" aria-describedby="' + P + 'thelp">' +
              '<p class="small muted" id="' + P + 'thelp">Below 1 the top words win more often; above 1 the chances even out. 0 means <em>greedy</em> (always take the top word).</p></div>' +
            '<div class="control"><label for="' + P + 'topk">Top-k <output id="' + P + 'kout" for="' + P + 'topk"></output></label>' +
              '<input type="range" id="' + P + 'topk" min="1" max="50" step="1" value="' + DEF.k + '" aria-describedby="' + P + 'khelp">' +
              '<p class="small muted" id="' + P + 'khelp">Keep only the k most likely words; cross out the rest.</p></div>' +
            '<div class="control"><label for="' + P + 'topp">Top-p (nucleus) <output id="' + P + 'pout" for="' + P + 'topp"></output></label>' +
              '<input type="range" id="' + P + 'topp" min="0.1" max="1" step="0.01" value="' + DEF.p + '" aria-describedby="' + P + 'phelp">' +
              '<p class="small muted" id="' + P + 'phelp">Keep the most likely words until their chances add up to p (the “nucleus”); cross out the long tail.</p></div>' +
            '<div class="control"><span class="control-label" id="' + P + 'memlbl">Memory: how many earlier words it looks at</span>' +
              '<div class="seg" role="group" aria-labelledby="' + P + 'memlbl">' +
                '<button type="button" data-mem="1" aria-pressed="false">Last word</button>' +
                '<button type="button" data-mem="2" aria-pressed="true">Last 2 words</button>' +
              '</div>' +
              '<p class="small muted">With 2 words it looks at, say, “train to”. If it never saw those two together, it falls back to the last word alone.</p></div>' +
            '<div class="control"><label for="' + P + 'seed">Seed (starting number for the dice)</label>' +
              '<div class="row"><input type="number" id="' + P + 'seed" min="0" max="99999" step="1" value="' + DEF.seed + '" style="width:7em" aria-describedby="' + P + 'shelp">' +
                '<button type="button" class="btn btn-sm" id="' + P + 'replay">Replay this seed</button></div>' +
              '<p class="small muted" id="' + P + 'shelp">The dice are not truly random: the same seed always gives the same rolls. Replay restarts the dice and the text, so the same settings give the same text again.</p></div>' +
            '<div class="stack-sm"><h4>Your tasks</h4><ul class="lab-tasks" id="' + P + 'tasks">' + tasksHtml + '</ul></div>' +
          '</div>' +
        '</div>' +
        '<div class="callout callout-indigo small"><strong>Softmax(logits ÷ T) in plain words:</strong> divide every logit by T, raise e (about 2.718) to each result, then divide each one by the total so all the chances add up to 100%. ' +
          'A small T (like 0.3) stretches the gaps between scores, so the top word wins almost every time. A big T (like 2) squashes the gaps, so even rare words get a real chance. T = 0 is the extreme: greedy. ' +
          'Example: counts 4 and 2 (logits 1.39 and 0.69) give 67% and 33% at T = 1, 80% and 20% at T = 0.5, and 59% and 41% at T = 2.</div>' +
        '<details class="fold"><summary>See the ' + CORPUS.length + ' training sentences and all ' + M.V + ' words the model knows</summary><div class="stack-sm">' +
          '<ol class="small" style="columns:2 17em;column-gap:28px;margin:0">' + sentHtml + '</ol>' +
          '<p class="small"><strong>Vocabulary:</strong> <span class="muted">' + esc(M.alpha.join(', ')) + '</span></p></div></details>' +
        '<p class="small muted"><strong style="color:var(--ink)">Why it matters in real ML:</strong> every chatbot and LLM API (application programming interface: the way apps talk to a model) works like this, scoring every token and then letting temperature, top-k and top-p decide how adventurous the pick is. Teams use low temperature for steady, repeatable answers (customer support, code, reading fields off an invoice) and higher values for brainstorming and stories; push it too far and, just like here, the model starts picking junk tokens.</p>' +
      '</div>';

    function $(id) { return root.querySelector('#' + P + id); }
    var wrap = $('wrap'), canvas = $('cv'), g = canvas.getContext('2d');
    var elPrompt = $('prompt'), elPMsg = $('pmsg'), elPCount = $('pcount'), elText = $('text'), elTCount = $('tcount');
    var elPrev = $('prev'), elNote = $('note'), elReadout = $('readout'), elLive = $('live');
    var btnSample = $('sample'), btnGen = $('gen'), btnReset = $('reset'), btnUse = $('use'), btnBack = $('back'), btnReplay = $('replay');
    var elTemp = $('temp'), elTopk = $('topk'), elTopp = $('topp'), elSeed = $('seed');
    var elTout = $('tout'), elKout = $('kout'), elPout = $('pout');
    var elSNK = $('snk'), elSTop = $('stop'), elSCtx = $('sctx'), elSNS = $('sns');
    var memBtns = root.querySelectorAll('[data-mem]');
    var taskEls = {};
    Array.prototype.forEach.call(root.querySelectorAll('[data-task]'), function (li) { taskEls[li.getAttribute('data-task')] = li; });

    /* ---------- state ---------- */
    var S = {
      T: DEF.T, k: DEF.k, p: DEF.p, mem: DEF.mem, seed: DEF.seed,
      prompt: [], gen: [], prev: null, rng: mulberry32(DEF.seed),
      dist: null, sel: -1, hover: -1, view: -1, viewD: null,
      anim: null, genLeft: 0, nextAt: 0, generating: false
    };
    var done = {};
    var dims = { w: 1, h: 1, dpr: 1 };
    var geo = null;            // row and strip positions from the last draw (for clicks)
    var rafId = 0, sizeRaf = 0, lastAria = '';

    function settings() { return { T: S.T, k: S.k, p: S.p, mem: S.mem }; }
    function histFor(nGen) {
      var h = [0].concat(S.prompt);
      for (var i = 0; i < nGen; i++) h.push(S.gen[i].w);
      return h;
    }
    // the words the model looked at, in plain words ("." at the front means the start of a sentence)
    function ctxLabel(D) {
      if (D.type === 'uni') return 'no earlier words';
      if (D.ctxW[0] === 0) return D.ctxW.length === 1 ? 'the start of a sentence' : '“' + disp(D.ctxW[1]) + '” at the start of a sentence';
      return '“' + D.ctxW.map(disp).join(' ') + '”';
    }
    function ctxStat(D) {
      if (D.type === 'uni') return 'nothing';
      if (D.ctxW[0] === 0) return D.ctxW.length === 1 ? 'sentence start' : '“' + disp(D.ctxW[1]) + '” (sentence start)';
      return '“' + D.ctxW.map(disp).join(' ') + '”';
    }
    function niceWord(w) { return w === 0 ? '“.” (full stop)' : '“' + disp(w) + '”'; }
    function recompute() {
      S.dist = nextDist(M, histFor(S.gen.length), settings());
      if (S.sel >= 0 && S.dist.rank[S.sel] >= ROWS) S.sel = -1;
    }

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
      if (done[id]) return;
      done[id] = true;
      markLi(id);
      announce('Task done: ' + TASKS.filter(function (t) { return t.id === id; })[0].text.split(':')[0] + '.');
      if (ctx && ctx.onTaskDone) ctx.onTaskDone(id);
    }
    function announce(s) { elLive.textContent = s; }
    function setNote(html) { elNote.innerHTML = html || ''; elNote.style.display = html ? '' : 'none'; }

    // greedy continuation of n tokens from a history (used to check top-k = 1 against greedy)
    function greedyRun(hist, n, mem) {
      var h = hist.slice(), out = [];
      for (var i = 0; i < n; i++) { var w = nextDist(M, h, { T: 0, k: 1, p: 1, mem: mem }).order[0]; out.push(w); h.push(w); }
      return out;
    }
    function checkRunTasks() {
      var run = S.gen, n = run.length, i;
      if (n < GEN_N) return;
      var last = run.slice(n - GEN_N), auto = last.every(function (t) { return !t.manual; });
      if (!auto) return;
      // t2: 15 tokens at T >= 1.8 with at least 3 words the model never saw in that spot
      if (last.every(function (t) { return t.s.T >= 1.8; })) {
        var odd = last.filter(function (t) { return !t.seen; }).length;
        if (odd >= 3) {
          setNote('<span class="chip chip-bad">Nonsense alert</span> ' + odd + ' of the last 15 words were never seen after the words before them. A high temperature gave the long tail of junk real chances.');
          completeTask('t2');
        }
      }
      // t3: 15 tokens with top-k = 1 at a real temperature: compare with greedy from the same starting point
      if (last.every(function (t) { return t.s.k === 1 && t.s.T >= 0.5; })) {
        var mems = last.every(function (t) { return t.s.mem === last[0].s.mem; });
        if (mems) {
          var gr = greedyRun(histFor(n - GEN_N), GEN_N, last[0].s.mem), same = true;
          for (i = 0; i < GEN_N; i++) if (gr[i] !== last[i].w) { same = false; break; }
          if (same) {
            setNote('<span class="chip chip-ok">Same as greedy</span> With top-k = 1, only the top word survives, so the dice have nothing to choose from, whatever the temperature.');
            completeTask('t3');
          }
        }
      }
      // t1: this run and the last run, same prompt, both greedy (T <= 0.1), identical first 15 tokens
      var pv = S.prev;
      if (pv && !pv.example && arrEq(pv.prompt, S.prompt) && pv.gen.length >= GEN_N) {
        var ok = true;
        for (i = 0; i < GEN_N; i++) {
          var a = pv.gen[i], b = run[i];
          if (a.w !== b.w || a.manual || b.manual || a.s.T > 0.1 || b.s.T > 0.1) { ok = false; break; }
        }
        if (ok) {
          setNote('<span class="chip chip-ok">Same text again</span> Greedy never rolls the dice, so the same prompt always gives the same words.');
          completeTask('t1');
        }
      }
    }
    function checkTopP() {
      var D = S.dist;
      if (D && !D.greedy && S.p < 1 && D.nByK > 3 && D.nK === 3) completeTask('t4');
    }

    /* ---------- the text box ---------- */
    function tokenStyle(t, T, small) {
      var c = T.bucket[bucketOf(t.p)];
      return 'font:inherit;color:var(--ink);background:' + rgb(c, T.dark ? 0.3 : 0.2) + ';border:0;border-bottom:3px solid ' + rgb(c) + ';' +
        'border-radius:4px 4px 0 0;padding:0 ' + (small ? 2 : 3) + 'px;margin:0;line-height:1.35;' +
        (t.seen ? '' : 'text-decoration:underline wavy ' + rgb(T.bad) + ';text-decoration-thickness:1.5px;text-underline-offset:3px;');
    }
    function tokenTitle(t) {
      return 'Chance when picked: ' + pct(t.p) + (t.manual ? ' (you picked it)' : t.u == null ? ' (greedy: top word)' : ' (dice roll ' + t.u.toFixed(3) + ')') +
        (t.seen ? '' : '. Never seen in this spot.');
    }
    // join token pieces with spaces, gluing each full stop to the word before it so a line never starts with "."
    function joinTokens(items) {
      var groups = [];
      items.forEach(function (it) {
        if (it.w === 0 && groups.length) groups[groups.length - 1].push(it.html);
        else groups.push([it.html]);
      });
      return groups.map(function (gr) { return gr.length > 1 ? '<span style="white-space:nowrap">' + gr.join('') + '</span>' : gr[0]; }).join(' ');
    }
    function renderText() {
      var T = readTheme(), items = [], i;
      for (i = 0; i < S.prompt.length; i++) items.push({ w: S.prompt[i], html: '<span style="font-weight:700">' + esc(disp(S.prompt[i])) + '</span>' });
      if (!S.prompt.length) items.push({ w: -1, html: '<span class="muted small">(empty prompt: a new sentence)</span>' });
      for (i = 0; i < S.gen.length; i++) {
        var t = S.gen[i], viewing = i === S.view;
        items.push({ w: t.w, html: '<button type="button" data-i="' + i + '" title="' + esc(tokenTitle(t)) + '" aria-label="' + esc(disp(t.w) + ', ' + pct(t.p) + ' chance' + (t.seen ? '' : ', never seen here')) + '"' +
          (viewing ? ' aria-pressed="true"' : '') + ' style="' + tokenStyle(t, T) + 'cursor:pointer;' + (viewing ? 'outline:2px solid ' + rgb(T.haldi) + ';outline-offset:1px;' : '') + '">' + esc(disp(t.w)) + '</button>' });
      }
      elText.innerHTML = joinTokens(items) +
        ' <span aria-hidden="true" style="display:inline-block;min-width:2em;padding:0 5px;border:1.5px dashed var(--muted);border-radius:4px;text-align:center;color:var(--muted);line-height:1.3">?</span>';
      elText.scrollTop = elText.scrollHeight;
      elTCount.textContent = S.gen.length + ' of ' + MAX_GEN + ' tokens generated';
      renderPrev(T);
      var full = S.gen.length >= MAX_GEN;
      btnSample.disabled = full || S.generating;
      btnGen.disabled = full && !S.generating;
    }
    function renderPrev(T) {
      var pv = S.prev;
      if (!pv || !pv.gen.length) { elPrev.innerHTML = ''; return; }
      var html = '<span class="muted">' + (pv.example ? 'Example run (seed ' + pv.seed + ', T ' + tStr(pv.s.T) + ', top-k ' + pv.s.k + ', top-p ' + pv.s.p.toFixed(2) + '):' : 'Last run:') + '</span> ';
      var items = pv.prompt.map(function (w) { return { w: w, html: '<span class="muted">' + esc(disp(w)) + '</span>' }; });
      for (var i = 0; i < Math.min(pv.gen.length, PREV_SHOW); i++) {
        var t = pv.gen[i];
        items.push({ w: t.w, html: '<span title="' + esc(tokenTitle(t)) + '" style="' + tokenStyle(t, T, true) + '">' + esc(disp(t.w)) + '</span>' });
      }
      html += joinTokens(items);
      if (pv.gen.length > PREV_SHOW) html += ' …';
      html += ' ' + compareChip();
      elPrev.innerHTML = html;
    }
    function compareChip() {
      var pv = S.prev;
      if (!S.gen.length) return '';
      if (!arrEq(pv.prompt, S.prompt)) return '<span class="chip">different prompt</span>';
      var n = Math.min(pv.gen.length, S.gen.length);
      for (var i = 0; i < n; i++) if (pv.gen[i].w !== S.gen[i].w) return '<span class="chip">differs from word ' + (i + 1) + '</span>';
      return '<span class="chip chip-ok">same ' + n + ' word' + (n === 1 ? '' : 's') + ' as now</span>';
    }

    /* ---------- readout: the maths for one word ---------- */
    function view() {
      if (S.anim) return { D: S.anim.D, mode: 'anim' };
      if (S.view >= 0 && S.viewD) return { D: S.viewD, mode: 'hist', t: S.gen[S.view] };
      return { D: S.dist, mode: 'next' };
    }
    function selWord(V) {
      if (S.sel >= 0) return S.sel;
      if (V.mode === 'hist') return V.t.w;
      return V.D.order[0];
    }
    function renderReadout() {
      var V = view(), D = V.D, w = selWord(V), s = D.s, html = '';
      var name = '<strong>' + esc(niceWord(w)) + '</strong>', cl = ctxLabel(D);
      if (V.mode === 'hist') {
        var t = V.t;
        html += 'Word ' + (S.view + 1) + ', “' + esc(disp(t.w)) + '”, was picked ' + (t.manual ? 'by you' : t.u == null ? 'greedily (top word)' : 'by a dice roll of ' + t.u.toFixed(3)) +
          ' with a chance of ' + pct(t.p) + ' (settings then: T ' + tStr(s.T) + ', top-k ' + s.k + ', top-p ' + s.p.toFixed(2) + '). ';
      }
      if (D.missed && D.type === 'bi') {
        html += (D.missed[0] === 0 ? 'No training sentence starts with “' + esc(disp(D.missed[1])) + '”' : 'It never saw “' + esc(D.missed.map(disp).join(' ')) + '” together') +
          ', so it falls back to ' + cl + ' alone. ';
      }
      var startOnly = D.type === 'bi' && D.ctxW[0] === 0;
      if (D.seen[w]) {
        html += name + (startOnly ? ' started a sentence ' : ' came after ' + cl + ' ') + fcount(D.cnt[w]) + (D.cnt[w] === 1 ? ' time' : ' times') + ' in the training sentences, so its logit (score) is ln(' + fcount(D.cnt[w]) + ') = ' + f2(D.logit[w]) + '. ';
      } else {
        html += name + (startOnly ? ' never started a sentence' : ' never came after ' + cl) + '. It gets a tiny stand-in count of ' + fcount(D.cnt[w]) + ' (called <em>smoothing</em>: based on how common it is overall, so nothing is impossible), giving a logit of ln(' + fcount(D.cnt[w]) + ') = ' + f2(D.logit[w]) + '. ';
      }
      if (D.greedy) {
        html += 'T = 0 means greedy: no dice, the highest logit simply wins. ' + (D.order[0] === w ? 'This is the top word, so it gets 100%.' : 'It is not the top word, so it gets 0%.');
      } else {
        html += 'Divided by T: ' + f2(D.logit[w]) + ' ÷ ' + s.T.toFixed(2) + ' = ' + f2(D.logit[w] / s.T) + '. Softmax gives it ' + pct(D.pb[w]) + ' of the chance. ';
        if (!D.cut[w]) html += 'It survives the cuts, and once the kept words are rescaled to add up to 100% it ends with <strong>' + pct(D.pf[w]) + '</strong>.';
        else if (D.cut[w] === 1) html += 'Top-k = ' + s.k + ' crosses it out (it is number ' + (D.rank[w] + 1) + ' in the list), so its final chance is 0%.';
        else html += 'Top-p = ' + s.p.toFixed(2) + ' crosses it out: the ' + D.nK + ' more likely word' + (D.nK === 1 ? '' : 's') + ' already add up to ' + pct(D.cumB[w]) + ' (rescaled within top-k), so its final chance is 0%.';
      }
      elReadout.innerHTML = html;
      // the "use this word" button
      var canUse = V.mode === 'next' && !D.cut[w] && S.gen.length < MAX_GEN && !S.generating;
      btnUse.style.display = V.mode === 'hist' ? 'none' : '';
      btnUse.disabled = !canUse;
      btnUse.textContent = 'Use “' + disp(w) + '” as the next token';
      btnUse.title = D.cut[w] ? 'Crossed out by a filter: the model cannot pick it' : '';
      btnBack.style.display = V.mode === 'hist' ? '' : 'none';
    }
    function renderStats() {
      var D = S.dist;
      elSNK.textContent = D.nK + ' of ' + M.V;
      elSTop.textContent = pct(D.pf[D.order[0]]);
      elSCtx.textContent = ctxStat(D);
      elSNS.textContent = String(S.gen.filter(function (t) { return !t.seen; }).length);
      var nPrompt = S.prompt.length;
      elPCount.textContent = nPrompt + ' token' + (nPrompt === 1 ? '' : 's');
    }
    function renderControls() {
      elTout.textContent = tStr(S.T);
      elKout.textContent = String(S.k);
      elPout.textContent = S.p.toFixed(2);
      Array.prototype.forEach.call(memBtns, function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-mem') === S.mem)); });
    }
    function refresh() {
      renderStats();
      renderReadout();
      requestDraw();
    }

    /* ---------- actions ---------- */
    function commitToken(D, w, u, manual) {
      S.gen.push({ w: w, p: D.pf[w], u: u, seen: D.seen[w] === 1, rank: D.rank[w], s: D.s, manual: !!manual });
      S.view = -1; S.viewD = null; S.sel = -1;
      recompute();
      renderText();
      checkRunTasks();
      checkTopP();
      refresh();
    }
    function motionMs(ms) { return mqMotion && mqMotion.matches ? 0 : ms; }
    function startStep(now, dur) {
      if (S.gen.length >= MAX_GEN) { stopGen(); return; }
      var D = S.dist, u = D.greedy ? null : S.rng();
      S.anim = { D: D, u: u, w: pickWord(D, u), t0: now, dur: motionMs(dur) };
      S.view = -1; S.viewD = null;
      renderReadout();
    }
    function tick(now) {
      if (S.anim && now - S.anim.t0 >= S.anim.dur) {
        var a = S.anim;
        S.anim = null;
        commitToken(a.D, a.w, a.u, false);
        if (!S.generating) announce('Picked “' + disp(a.w) + '” with a chance of ' + pct(a.D.pf[a.w]) + '.');
        S.nextAt = now + motionMs(GEN_GAP);
      }
      if (!S.anim && S.generating) {
        if (S.genLeft <= 0 || S.gen.length >= MAX_GEN) finishGen();
        else if (now >= S.nextAt) { S.genLeft--; startStep(now, STEP_GEN); }
      }
    }
    function finishGen() {
      S.generating = false; S.genLeft = 0;
      btnGen.textContent = 'Generate 15 tokens';
      renderText(); renderReadout();
      announce('Generated text: ' + S.gen.slice(-GEN_N).map(function (t) { return disp(t.w); }).join(' '));
      if (S.gen.length >= MAX_GEN) setNote('The text is full (' + MAX_GEN + ' tokens). Press “Reset prompt” to start again.');
    }
    function stopGen() {
      if (S.anim) { var a = S.anim; S.anim = null; commitToken(a.D, a.w, a.u, false); }
      if (S.generating) finishGen();
    }
    function cancelAll() { S.anim = null; S.generating = false; S.genLeft = 0; btnGen.textContent = 'Generate 15 tokens'; }
    function sampleOne() {
      if (S.generating || S.gen.length >= MAX_GEN) return;
      if (S.anim) { stopGen(); return; }
      setNote('');
      startStep(performance.now(), S.dist.greedy ? STEP_ONE * 0.6 : STEP_ONE);
      requestDraw();
    }
    function toggleGen() {
      if (S.generating) { stopGen(); return; }
      if (S.gen.length >= MAX_GEN) return;
      if (S.anim) stopGen();
      setNote('');
      S.generating = true; S.genLeft = GEN_N; S.nextAt = 0;
      btnGen.textContent = 'Stop';
      renderText();
      requestDraw();
    }
    function archiveRun() {
      if (S.gen.length) S.prev = { prompt: S.prompt.slice(), gen: S.gen.slice(), example: false };
      S.gen = []; S.view = -1; S.viewD = null; S.sel = -1;
    }
    function resetText() {
      cancelAll();
      archiveRun();
      recompute();
      renderText();
      setNote('');
      checkTopP();
      refresh();
    }
    function replaySeed() {
      var v = parseInt(elSeed.value, 10);
      if (!isFinite(v)) v = S.seed;
      v = clamp(v, 0, 99999);
      elSeed.value = String(v);
      S.seed = v;
      S.rng = mulberry32(v);
      resetText();
      setNote('Dice restarted from seed ' + v + '. The same prompt and settings will now give the same text as before with this seed.');
    }
    function useSelected() {
      var V = view();
      if (V.mode !== 'next' || S.generating || S.anim) return;
      var w = selWord(V);
      if (V.D.cut[w] || S.gen.length >= MAX_GEN) return;
      setNote('');
      commitToken(V.D, w, null, true);
      announce('Added “' + disp(w) + '”.');
    }
    function openHistory(i) {
      if (i < 0 || i >= S.gen.length) return;
      if (S.generating || S.anim) stopGen();
      if (S.view === i) { closeHistory(); return; }
      S.view = i; S.sel = -1;
      S.viewD = nextDist(M, histFor(i), S.gen[i].s);
      renderText();
      refresh();
    }
    function closeHistory() {
      S.view = -1; S.viewD = null; S.sel = -1;
      renderText();
      refresh();
    }

    /* ---------- prompt ---------- */
    function parsePrompt(str) {
      var s = String(str || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9.\s]/g, ' ').replace(/\./g, ' . ');
      var words = s.split(/\s+/).filter(Boolean), ids = [], unknown = [];
      words.forEach(function (w) {
        if (w in M.index) ids.push(M.index[w]);
        else if (unknown.indexOf(w) < 0) unknown.push(w);
      });
      return { ids: ids, unknown: unknown };
    }
    function promptHelp(r) {
      if (r.unknown.length) {
        elPMsg.innerHTML = '<span style="color:var(--bad);font-weight:600">Not in this model’s vocabulary: ' + esc(r.unknown.slice(0, 4).map(function (w) { return '“' + w + '”'; }).join(', ')) + '.</span> It only knows the ' + M.V + ' words in its training sentences (see the list at the bottom).';
        return false;
      }
      elPMsg.textContent = arrEq(r.ids, S.prompt) ? 'Type any words the model knows, or tap an example.' : 'All words known. Press Enter to start from this prompt.';
      return true;
    }
    function applyPrompt(str) {
      var r = parsePrompt(str);
      if (!promptHelp(r)) return;
      var changed = !arrEq(r.ids, S.prompt);
      elPrompt.value = r.ids.map(disp).join(' ').replace(/ \./g, '.');
      if (!changed) return;
      cancelAll();
      archiveRun();
      S.prompt = r.ids;
      recompute();
      renderText();
      setNote('');
      checkTopP();
      refresh();
      promptHelp(r);
    }

    /* ---------- drawing ---------- */
    function requestDraw() { if (!rafId && !destroyed) rafId = requestAnimationFrame(frame); }
    function frame(now) {
      rafId = 0;
      if (destroyed) return;
      tick(now);
      draw(now);
      if (S.anim || S.generating) requestDraw();
    }
    function layout(w) {
      var narrow = w < 520, rowH = narrow ? 24 : 27, pad = 12;
      var top = pad + 26 + 18;
      var stripY = top + (ROWS + 1) * rowH + 12 + 18;
      return { narrow: narrow, rowH: rowH, pad: pad, y0: top, stripY: stripY, stripH: 22, h: stripY + 22 + 30 };
    }
    function fitText(s, maxW) {
      if (g.measureText(s).width <= maxW) return s;
      while (s.length > 1 && g.measureText(s + '…').width > maxW) s = s.slice(0, -1);
      return s + '…';
    }
    function roundRect(x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      g.beginPath();
      g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
      g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
      g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y);
      g.closePath();
    }
    function ctxShort(hist) {
      var h = hist.length > 1 ? hist.slice(1) : [];
      if (!h.length) return 'the start';
      var tail = h.slice(-3), cutFront = h.length > 3;
      while (tail.length > 1 && tail[0] === 0) { tail.shift(); cutFront = true; }
      var s = tail.map(disp).join(' ').replace(/ \./g, '.');
      return (cutFront ? '… ' : '') + s;
    }
    function draw(now) {
      if (dims.w < 2) return;
      var T = readTheme(), W = dims.w, H = dims.h, L = layout(W), V = view(), D = V.D, s = D.s;
      var pad = L.pad, rowH = L.rowH, narrow = L.narrow, fs = narrow ? 13 : 14, ms = narrow ? 11.5 : 12.5;
      g.setTransform(dims.dpr, 0, 0, dims.dpr, 0, 0);
      g.fillStyle = rgb(T.surface); g.fillRect(0, 0, W, H);
      g.textBaseline = 'middle';

      // animation progress: the roll slides along the strip, then the picked word lights up
      var roll = null, chosen = -1, landed = false;
      if (V.mode === 'anim') {
        var a = S.anim, pr = a.dur > 0 ? clamp((now - a.t0) / a.dur, 0, 1) : 1;
        var mv = clamp(pr / 0.7, 0, 1), ease = 1 - Math.pow(1 - mv, 3);
        if (a.u != null) roll = a.u * ease;
        landed = a.u == null ? pr > 0.25 : mv >= 1;
        chosen = a.w;
      } else if (V.mode === 'hist') {
        roll = V.t.u; chosen = V.t.w; landed = true;
      }
      var selW = selWord(V);

      // columns
      var wordW = narrow ? (W < 340 ? 60 : 72) : 124;
      var xWord = pad + 8, xCountR = xWord + wordW + (narrow ? 32 : 46), xLogitR = xCountR + (narrow ? 44 : 58);
      var pctW = narrow ? 46 : 58, xBar0 = xLogitR + 12, xBar1 = W - pad - pctW, barW = Math.max(20, xBar1 - xBar0);

      // title
      var hist = V.mode === 'hist' ? histFor(S.view) : histFor(S.gen.length);
      var title = V.mode === 'hist' ? 'Word ' + (S.view + 1) + ' “' + disp(V.t.w) + '”: the choice it came from' :
        (V.mode === 'anim' ? 'Rolling the dice after “' : 'Next token after “') + ctxShort(hist) + '”';
      var setTxt = D.greedy ? 'T 0 · greedy' : 'T ' + s.T.toFixed(2) + ' · k ' + s.k + ' · p ' + s.p.toFixed(2);
      g.font = ms + 'px ' + T.mono;
      var setW = g.measureText(setTxt).width, showSet = W - 2 * pad - setW > (narrow ? 210 : 260);
      if (showSet) { g.fillStyle = rgb(T.muted); g.textAlign = 'right'; g.fillText(setTxt, W - pad, pad + 11); }
      g.font = '700 ' + (fs + 1) + 'px ' + T.font; g.fillStyle = rgb(T.ink); g.textAlign = 'left';
      g.fillText(fitText(title, W - 2 * pad - (showSet ? setW + 12 : 0)), pad, pad + 11);

      // header row
      var hy = pad + 26 + 7;
      g.font = '600 ' + (narrow ? 10 : 10.5) + 'px ' + T.font; g.fillStyle = rgb(T.muted);
      g.textAlign = 'left'; g.fillText('WORD', xWord, hy);
      g.textAlign = 'right'; g.fillText('COUNT', xCountR, hy); g.fillText('LOGIT', xLogitR, hy);
      g.textAlign = 'left'; g.fillText(narrow ? 'CHANCE' : 'CHANCE (bar) · BEFORE CUTS (line)', xBar0, hy);
      g.textAlign = 'right'; g.fillText('100%', xBar1, hy);
      // light guide lines at 25, 50, 75 and 100%
      g.strokeStyle = rgb(T.line); g.lineWidth = 1;
      for (var q = 1; q <= 4; q++) {
        var gx = Math.round(xBar0 + barW * q / 4) + 0.5;
        g.beginPath(); g.moveTo(gx, L.y0 - 2); g.lineTo(gx, L.y0 + (ROWS + 1) * rowH); g.stroke();
      }
      g.beginPath(); g.moveTo(Math.round(xBar0) + 0.5, L.y0 - 2); g.lineTo(Math.round(xBar0) + 0.5, L.y0 + (ROWS + 1) * rowH); g.stroke();

      var bh = narrow ? 9 : 11;
      geo = { y0: L.y0, rowH: rowH, rows: [], strip: null };
      for (var i = 0; i < ROWS && i < D.order.length; i++) {
        var w = D.order[i], y = L.y0 + i * rowH, cy = y + rowH / 2, kept = !D.cut[w];
        var isChosen = landed && w === chosen, isSel = w === selW && !isChosen, isHover = w === S.hover && !isSel && !isChosen;
        geo.rows.push(w);
        if (isChosen) { g.fillStyle = rgb(T.haldiSoft); g.fillRect(pad - 4, y + 1, W - 2 * pad + 8, rowH - 2); }
        else if (isSel) { g.fillStyle = rgb(T.surface2); g.fillRect(pad - 4, y + 1, W - 2 * pad + 8, rowH - 2); }
        else if (isHover) { g.fillStyle = rgb(T.surface2, 0.6); g.fillRect(pad - 4, y + 1, W - 2 * pad + 8, rowH - 2); }
        if (isSel || isChosen) { g.fillStyle = rgb(T.haldi); g.fillRect(pad - 4, y + 1, 3, rowH - 2); }
        // word (crossed out when a filter removed it)
        g.font = (i === 0 ? '700 ' : '500 ') + fs + 'px ' + T.font;
        g.fillStyle = rgb(kept ? T.ink : T.muted); g.textAlign = 'left';
        var lbl = fitText(chartWord(w), wordW - 4);
        g.fillText(lbl, xWord, cy);
        if (!kept) {
          var lw = g.measureText(lbl).width;
          g.strokeStyle = rgb(T.muted); g.lineWidth = 1.2;
          g.beginPath(); g.moveTo(xWord - 1, cy + 0.5); g.lineTo(xWord + lw + 1, cy + 0.5); g.stroke();
        }
        // count and logit
        g.font = (D.seen[w] ? '' : 'italic ') + ms + 'px ' + T.mono; g.textAlign = 'right';
        g.fillStyle = rgb(D.seen[w] ? T.ink : T.muted);
        g.fillText(fcount(D.cnt[w]), xCountR, cy);
        g.fillText(f2(D.logit[w]), xLogitR, cy);
        // bars: thick = final chance, thin = softmax chance before the cuts
        if (D.pf[w] > 0) {
          g.fillStyle = rgb(isChosen ? T.haldi : T.s1);
          roundRect(xBar0, cy - bh / 2 - 2, Math.max(2, D.pf[w] * barW), bh, 2); g.fill();
        }
        if (D.pb[w] > 0) {
          g.fillStyle = rgb(T.muted, kept ? 0.75 : 0.9);
          g.fillRect(xBar0, cy + bh / 2 + 1, Math.max(1.5, D.pb[w] * barW), 2.5);
        }
        g.font = ms + 'px ' + T.mono; g.textAlign = 'left';
        g.fillStyle = rgb(kept ? T.ink : T.muted);
        var pl = kept ? pct(D.pf[w]) : D.cut[w] === 1 ? 'cut: k' : D.cut[w] === 2 ? 'cut: p' : '0%';
        g.fillText(pl, xBar1 + 6, cy - 1);
      }
      // everything below the top 12, as one row
      var restB = 0, restF = 0, restKept = 0;
      for (i = ROWS; i < D.order.length; i++) { var wr = D.order[i]; restB += D.pb[wr]; restF += D.pf[wr]; if (!D.cut[wr]) restKept++; }
      var ry = L.y0 + ROWS * rowH, rcy = ry + rowH / 2;
      g.strokeStyle = rgb(T.line); g.lineWidth = 1;
      g.beginPath(); g.moveTo(pad, Math.round(ry) + 0.5); g.lineTo(W - pad, Math.round(ry) + 0.5); g.stroke();
      g.font = 'italic ' + (fs - 1) + 'px ' + T.font; g.fillStyle = rgb(T.muted); g.textAlign = 'left';
      g.fillText(fitText('+ ' + (D.order.length - ROWS) + ' other words' + (restKept ? ' (' + restKept + ' kept)' : ''), xLogitR - xWord + (narrow ? 0 : 10)), xWord, rcy);
      if (restF > 0) { g.fillStyle = rgb(T.s1, 0.7); roundRect(xBar0, rcy - bh / 2 - 2, Math.max(2, restF * barW), bh, 2); g.fill(); }
      if (restB > 0) { g.fillStyle = rgb(T.muted, 0.9); g.fillRect(xBar0, rcy + bh / 2 + 1, Math.max(1.5, restB * barW), 2.5); }
      g.font = ms + 'px ' + T.mono; g.fillStyle = rgb(T.muted);
      g.fillText(pct(restF), xBar1 + 6, rcy - 1);

      // the dice strip: kept words side by side, each as wide as its final chance
      var sx = pad, sw = W - 2 * pad, sy = L.stripY, sh = L.stripH;
      g.font = (narrow ? 11.5 : 12.5) + 'px ' + T.font; g.fillStyle = rgb(T.muted); g.textAlign = 'left';
      var cap = D.greedy ? 'Greedy (T = 0): no dice, the top word always wins' :
        (narrow ? 'Dice strip: a roll from 0 to 1 picks a slice' : 'Dice strip: a random roll from 0 to 1 lands in one kept word’s slice');
      g.fillText(fitText(cap, sw), sx, sy - 10);
      geo.strip = { x: sx, y: sy, w: sw, h: sh, segs: [] };
      var x = sx, j = 0;
      g.fillStyle = rgb(T.surface2); roundRect(sx, sy, sw, sh, 4); g.fill();
      for (i = 0; i < D.order.length; i++) {
        var ws = D.order[i];
        if (D.cut[ws]) break;
        var segW = D.pf[ws] * sw, hi = landed && ws === chosen;
        g.fillStyle = hi ? rgb(T.haldi) : rgb(T.s1, j % 2 ? 0.72 : 1);
        g.fillRect(x, sy, Math.max(0.5, segW - (segW > 3 ? 1 : 0)), sh);
        if (ws === selW && !hi && segW > 3) { g.strokeStyle = rgb(T.ink); g.lineWidth = 2; g.strokeRect(x + 1, sy + 1, segW - 3, sh - 2); }
        g.font = '600 ' + (narrow ? 11 : 12) + 'px ' + T.font;
        var sl = disp(ws), tw = g.measureText(sl).width;
        if (tw + 8 < segW) { g.fillStyle = hi ? '#1b1400' : rgb(T.onIndigo); g.textAlign = 'center'; g.fillText(sl, x + segW / 2, sy + sh / 2 + 0.5); }
        geo.strip.segs.push([x, x + segW, ws]);
        x += segW; j++;
      }
      // tick labels and the roll marker
      var ty = sy + sh + 13;
      g.font = ms + 'px ' + T.mono; g.fillStyle = rgb(T.muted);
      g.textAlign = 'left'; g.fillText('0', sx, ty);
      g.textAlign = 'right'; g.fillText('1', sx + sw, ty);
      if (roll != null) {
        var ax = sx + roll * sw;
        g.fillStyle = rgb(T.ink);
        g.beginPath(); g.moveTo(ax, sy + sh + 1); g.lineTo(ax - 6, sy + sh + 9); g.lineTo(ax + 6, sy + sh + 9); g.closePath(); g.fill();
        g.fillRect(ax - 1, sy - 3, 2, sh + 4);
        var rl = 'roll ' + roll.toFixed(3), rw = g.measureText(rl).width;
        var rx = clamp(ax + 10, sx + 16, sx + sw - 16 - rw);
        if (rx < ax + 8 && rx + rw > ax - 8) rx = clamp(ax - 10 - rw, sx + 16, sx + sw - 16 - rw);
        g.textAlign = 'left'; g.fillStyle = rgb(T.ink);
        g.fillText(rl, rx, ty + 3);
      }

      // a short text version of the chart for screen readers
      var aria = (V.mode === 'hist' ? 'Chances when word ' + (S.view + 1) + ' was picked' : 'Chances for the next token after ' + ctxShort(hist)) + ': ' +
        D.order.slice(0, 6).map(function (wa) { return chartWord(wa) + ' ' + (D.cut[wa] ? 'crossed out' : pct(D.pf[wa])); }).join(', ') +
        '. ' + D.nK + ' of ' + M.V + ' words possible.';
      if (aria !== lastAria) { lastAria = aria; canvas.setAttribute('aria-label', aria); }
    }

    /* ---------- pointer and keyboard on the chart ---------- */
    function hitWord(e) {
      if (!geo) return -1;
      var r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      var st = geo.strip;
      if (st && y >= st.y - 4 && y <= st.y + st.h + 4) {
        for (var i = 0; i < st.segs.length; i++) if (x >= st.segs[i][0] && x < st.segs[i][1]) return st.segs[i][2];
        return -1;
      }
      var row = Math.floor((y - geo.y0) / geo.rowH);
      return row >= 0 && row < geo.rows.length ? geo.rows[row] : -1;
    }
    on(canvas, 'click', function (e) {
      var w = hitWord(e);
      if (w < 0) return;
      S.sel = w;
      renderReadout(); requestDraw();
    });
    on(canvas, 'pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var w = hitWord(e);
      canvas.style.cursor = w >= 0 ? 'pointer' : 'default';
      if (w !== S.hover) { S.hover = w; requestDraw(); }
    });
    on(canvas, 'pointerleave', function () { if (S.hover !== -1) { S.hover = -1; requestDraw(); } });
    on(canvas, 'keydown', function (e) {
      var V = view(), D = V.D, r = D.rank[selWord(V)];
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        r = clamp(r + (e.key === 'ArrowDown' ? 1 : -1), 0, ROWS - 1);
        S.sel = D.order[r];
        renderReadout(); requestDraw();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        useSelected();
      } else if (e.key === 'Escape' && S.view >= 0) {
        e.preventDefault();
        closeHistory();
      }
    });

    /* ---------- controls ---------- */
    function onSetting() {
      if (S.view >= 0) { S.view = -1; S.viewD = null; renderText(); }
      recompute();
      renderControls();
      checkTopP();
      refresh();
    }
    on(elTemp, 'input', function () { S.T = clamp(Math.round(parseFloat(elTemp.value) * 100) / 100 || 0, 0, 2); onSetting(); });
    on(elTopk, 'input', function () { S.k = clamp(parseInt(elTopk.value, 10) || 1, 1, 50); onSetting(); });
    on(elTopp, 'input', function () { S.p = clamp(Math.round(parseFloat(elTopp.value) * 100) / 100 || 0.1, 0.1, 1); onSetting(); });
    Array.prototype.forEach.call(memBtns, function (b) {
      on(b, 'click', function () { var m = +b.getAttribute('data-mem'); if (m !== S.mem) { S.mem = m; S.sel = -1; onSetting(); } });
    });
    on(btnSample, 'click', sampleOne);
    on(btnGen, 'click', toggleGen);
    on(btnReset, 'click', resetText);
    on(btnReplay, 'click', replaySeed);
    on(elSeed, 'change', replaySeed);
    on(btnUse, 'click', useSelected);
    on(btnBack, 'click', closeHistory);
    on(elText, 'click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('[data-i]') : null;
      if (b) openHistory(+b.getAttribute('data-i'));
    });
    on(elPrompt, 'input', function () { promptHelp(parsePrompt(elPrompt.value)); });
    on(elPrompt, 'change', function () { applyPrompt(elPrompt.value); });
    on(elPrompt, 'keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); applyPrompt(elPrompt.value); } });
    Array.prototype.forEach.call(root.querySelectorAll('[data-ex]'), function (b) {
      on(b, 'click', function () { elPrompt.value = b.getAttribute('data-ex'); applyPrompt(elPrompt.value); });
    });

    /* ---------- theme and size ---------- */
    function onTheme() { themeCache.key = ''; renderText(); requestDraw(); }
    var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mql) { if (mql.addEventListener) mql.addEventListener('change', onTheme); else if (mql.addListener) mql.addListener(onTheme); }
    on(document, 'themechange', onTheme);
    var wantH = 0;
    function applyHeight() { sizeRaf = 0; if (!destroyed && wantH) wrap.style.height = wantH + 'px'; }
    function resize() {
      if (destroyed) return;
      var r = wrap.getBoundingClientRect(), w = Math.max(1, Math.round(r.width - 2));
      var h = layout(w).h;
      // changing the wrapper's own height inside the ResizeObserver callback would loop, so defer it
      if (h !== wantH) { wantH = h; if (!sizeRaf) sizeRaf = requestAnimationFrame(applyHeight); }
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      var rc = canvas.getBoundingClientRect(), cw = Math.max(1, Math.round(rc.width)), ch = Math.max(1, Math.round(rc.height));
      if (cw !== dims.w || ch !== dims.h || dpr !== dims.dpr) {
        dims.w = cw; dims.h = ch; dims.dpr = dpr;
        canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
      }
      requestDraw();
    }
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { resize(); }); ro.observe(wrap); }
    else on(window, 'resize', resize);

    /* ---------- starting state: an example run from the default prompt, then back to the prompt ---------- */
    S.prompt = parsePrompt(DEF.prompt).ids;
    (function exampleRun() {
      var h = histFor(0), gen = [];
      for (var i = 0; i < GEN_N; i++) {
        var D = nextDist(M, h, settings()), u = S.rng(), w = pickWord(D, u);
        gen.push({ w: w, p: D.pf[w], u: u, seen: D.seen[w] === 1, rank: D.rank[w], s: D.s, manual: false });
        h.push(w);
      }
      // the live dice carry on from here, so the first "Generate" differs; "Replay this seed" brings this run back
      S.prev = { prompt: S.prompt.slice(), gen: gen, example: true, seed: S.seed, s: settings() };
    })();
    recompute();
    renderControls();
    promptHelp(parsePrompt(elPrompt.value));
    wrap.style.height = layout(Math.round(wrap.getBoundingClientRect().width - 2) || 600).h + 'px';
    renderText();
    refresh();
    checkTopP();
    resize();

    return {
      destroy: function () {
        destroyed = true;
        if (rafId) cancelAnimationFrame(rafId);
        if (sizeRaf) cancelAnimationFrame(sizeRaf);
        rafId = 0; sizeRaf = 0;
        S.anim = null; S.generating = false;
        if (ro) ro.disconnect();
        if (mql) { if (mql.removeEventListener) mql.removeEventListener('change', onTheme); else if (mql.removeListener) mql.removeListener(onTheme); }
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
        listeners = [];
        root.innerHTML = '';
      }
    };
  }

  Labs.sampling = {
    id: 'sampling',
    module: 'l4-llm-internals',
    title: 'Next-token sampling: temperature, top-k, top-p',
    summary: 'Watch a tiny language model score every possible next word, then see how temperature, top-k and top-p change which word the dice pick.',
    tasks: TASKS.map(function (t) { return { id: t.id, text: t.text }; }),
    mount: mount
  };
})();
