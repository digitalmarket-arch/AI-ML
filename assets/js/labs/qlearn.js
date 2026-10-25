/* AI Marg lab: tabular Q-learning in a small city gridworld.
   A delivery rider (the agent) learns, by trial and error, the best way from its restaurant to a customer.
   Plain classic script (ES2019). Registers window.AILabs.qlearn. No libraries, no network, no storage. */
(function () {
  'use strict';
  var Labs = (window.AILabs = window.AILabs || {});
  var mountCount = 0;

  /* ---------- the world ---------- */
  var N = 7, NS = N * N;
  var ROAD = 0, WALL = 1, JAM = 2, PIT = 3;
  var R_ROAD = -0.1, R_JAM = -1, R_PIT = -5, R_GOAL = 10;
  var MAX_MOVES = 100;                      // a trip is cut short after this many moves
  var DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1];
  var MOVE_NAMES = ['Up', 'Right', 'Down', 'Left'];
  var MOVE_ARROWS = ['↑', '→', '↓', '←'];
  // S = restaurant (start), G = customer, W = building, J = traffic jam, P = pothole, . = road.
  // The restaurant sits in a narrow lane whose only way out is a jammed junction.
  var DEFAULT_ROWS = [
    '. . . . . . G',
    '. W . W . W .',
    '. . . J . . .',
    '. W . W . W P',
    'W . . . . . .',
    '. W . W . W .',
    'S . J . . . .'
  ];
  var SEED = 2024;
  var PRETRAIN = 20;                        // practice trips already made when the lab opens
  var DEF = { alpha: 0.8, gamma: 0.9, eps: 0.2, per: 100, speed: 2 };
  var SPEEDS = [2, 4, 8, 16, 40];           // moves per second for "Run episode"
  var AVG_WIN = 20;
  var DECAY = 0.98, EPS_FLOOR = 0.01;
  var TASK_MIN_EPISODES = 50;

  var TASKS = [
    { id: 't1', text: 'Train the rider until its greedy route (always taking the move with the highest Q-value) reaches the customer.' },
    { id: 't2', text: 'Once the route reaches the customer, set γ (gamma) to 0 and train at least 50 more episodes. The rider stops caring about the far-away +10, and its route no longer reaches the customer.' },
    { id: 't3', text: 'Set ε (epsilon) to 0, press Reset Q, then train at least 50 episodes. With no exploring, the rider never learns the way out of its lane to the customer.' },
    { id: 't4', text: 'Under the map choose “Changes it”, and put a traffic jam on a square of the rider’s greedy route. Keep training until the route changes to go round the jam.' }
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
  function fmt(v, d) {
    var s = Math.abs(v).toFixed(d);
    return v < 0 && parseFloat(s) !== 0 ? '−' + s : s;
  }
  function fmtS(v, d) {
    var s = Math.abs(v).toFixed(d);
    if (parseFloat(s) === 0) return s;
    return (v < 0 ? '−' : '+') + s;
  }
  // Indian digit grouping for counts: 125000 -> 1,25,000
  function fmtInt(n) {
    var s = String(Math.round(Math.abs(n)));
    if (s.length > 3) s = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3);
    return (n < 0 ? '−' : '') + s;
  }
  function fmtR(r) { return r === R_ROAD ? '−0.1' : r === R_JAM ? '−1' : r === R_PIT ? '−5' : '+10'; }
  function plural(n, one, many) { return fmtInt(n) + ' ' + (n === 1 ? one : many); }
  function rowOf(s) { return Math.floor(s / N); }
  function colOf(s) { return s % N; }
  function cellName(s) { return 'row ' + (rowOf(s) + 1) + ', column ' + (colOf(s) + 1); }

  function parseMap(rows) {
    var types = new Int8Array(NS), start = 0, goal = NS - 1;
    for (var r = 0; r < N; r++) {
      var parts = rows[r].split(' ');
      for (var c = 0; c < N; c++) {
        var ch = parts[c], i = r * N + c;
        types[i] = ch === 'W' ? WALL : ch === 'J' ? JAM : ch === 'P' ? PIT : ROAD;
        if (ch === 'S') start = i;
        if (ch === 'G') goal = i;
      }
    }
    return { types: types, start: start, goal: goal };
  }
  function copyMap(M) { return { types: new Int8Array(M.types), start: M.start, goal: M.goal }; }

  // One move in the city. Moving into a building or off the edge keeps the rider where it is (still costs −0.1).
  function stepEnv(M, s, a) {
    var r = rowOf(s) + DR[a], c = colOf(s) + DC[a];
    if (r < 0 || r >= N || c < 0 || c >= N) return { s2: s, r: R_ROAD, done: false, block: 'edge' };
    var s2 = r * N + c;
    if (M.types[s2] === WALL && s2 !== M.goal && s2 !== M.start) return { s2: s, r: R_ROAD, done: false, block: 'wall' };
    if (s2 === M.goal) return { s2: s2, r: R_GOAL, done: true, block: '' };
    var t = M.types[s2];
    if (s2 !== M.start && t === PIT) return { s2: s2, r: R_PIT, done: true, block: '' };
    if (s2 !== M.start && t === JAM) return { s2: s2, r: R_JAM, done: false, block: '' };
    return { s2: s2, r: R_ROAD, done: false, block: '' };
  }
  function maxQ(Q, s) {
    var b = s * 4, m = Q[b];
    if (Q[b + 1] > m) m = Q[b + 1];
    if (Q[b + 2] > m) m = Q[b + 2];
    if (Q[b + 3] > m) m = Q[b + 3];
    return m;
  }
  function argmaxFirst(Q, s) {
    var b = s * 4, best = 0;
    for (var i = 1; i < 4; i++) if (Q[b + i] > Q[b + best]) best = i;
    return best;
  }
  function allEqual(Q, s) { var b = s * 4; return Q[b] === Q[b + 1] && Q[b] === Q[b + 2] && Q[b] === Q[b + 3]; }
  function isTerminal(M, s) { return s === M.goal || (s !== M.start && M.types[s] === PIT); }
  function isWall(M, s) { return s !== M.goal && s !== M.start && M.types[s] === WALL; }

  // Exact best Q-values for this map and γ (value iteration), used only as a check: "best possible route".
  function valueIteration(M, gamma) {
    var Q = new Float64Array(NS * 4);
    for (var it = 0; it < 20000; it++) {
      var delta = 0;
      for (var s = 0; s < NS; s++) {
        if (isWall(M, s) || isTerminal(M, s)) continue;
        for (var a = 0; a < 4; a++) {
          var o = stepEnv(M, s, a), v = o.r + gamma * (o.done ? 0 : maxQ(Q, o.s2));
          var d = Math.abs(v - Q[s * 4 + a]);
          if (d > delta) delta = d;
          Q[s * 4 + a] = v;
        }
      }
      if (delta < 1e-11) break;
    }
    return Q;
  }
  // Follow the highest Q-value from the start (first one wins a tie) until the trip ends, loops or times out.
  function greedyRoute(M, Q, gamma) {
    var s = M.start, seen = new Uint8Array(NS), path = [s], R = 0, G = 0, disc = 1;
    for (var t = 0; t < MAX_MOVES; t++) {
      if (seen[s]) return { end: 'loop', path: path, moves: t, R: R, G: G };
      seen[s] = 1;
      var o = stepEnv(M, s, argmaxFirst(Q, s));
      R += o.r; G += disc * o.r; disc *= gamma;
      if (o.s2 === s) return { end: 'loop', path: path, moves: t + 1, R: R, G: G };
      s = o.s2; path.push(s);
      if (o.done) return { end: s === M.goal ? 'goal' : 'pit', path: path, moves: t + 1, R: R, G: G };
    }
    return { end: 'time', path: path, moves: MAX_MOVES, R: R, G: G };
  }

  /* ---------- theme colours (read from CSS variables at draw time) ---------- */
  var THEME_VARS = ['--bg', '--surface', '--surface-2', '--ink', '--muted', '--line', '--indigo', '--indigo-soft', '--haldi', '--haldi-soft', '--sindoor', '--ok', '--bad', '--series-1', '--series-2', '--series-3', '--series-4'];
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
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function mix(a, b, t) { return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)]; }

  /* ---------- mount ---------- */
  function mount(root, ctx) {
    var P = 'ql' + (++mountCount) + '-';
    var listeners = [];
    var destroyed = false;
    function on(el, type, fn, opts) { el.addEventListener(type, fn, opts); listeners.push([el, type, fn, opts]); }

    function legend(items) {
      return '<div class="lab-legend">' + items.map(function (it) { return '<span style="--c:var(' + it[0] + ')">' + it[1] + '</span>'; }).join('') + '</div>';
    }
    function slider(id, label, min, max, step, val, help) {
      return '<div class="control"><label for="' + P + id + '">' + label + ' <output id="' + P + id + 'out" for="' + P + id + '"></output></label>' +
        '<input type="range" style="margin-left:0;margin-right:0" id="' + P + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '" aria-describedby="' + P + id + 'help">' +
        '<p class="small muted" id="' + P + id + 'help">' + help + '</p></div>';
    }
    function stat(id, k) { return '<div class="stat"><div class="k">' + k + '</div><div class="v" id="' + P + id + '">—</div></div>'; }

    var top = document.createElement('div');
    top.className = 'lab';
    top.innerHTML =
      '<p class="lab-note"><strong>What you are seeing:</strong> a delivery rider (the <em>agent</em>, the one that learns) finding its way around a small city by trial and error. ' +
        'Each square is a <em>state</em> (a place the rider can be) and each move up, right, down or left is an <em>action</em>. ' +
        'Every move costs −0.1 (time and petrol), driving into a traffic jam costs −1, a pothole costs −5 and ends the trip, and reaching the customer pays +10 and ends the trip. ' +
        'One whole trip is called an <em>episode</em>. The rider keeps a <em>Q-table</em>: for every square s and move a, the Q-value Q(s, a) is its current guess of all the reward still to come if it makes that move and then keeps choosing well. ' +
        'The colours and arrows on the map show this table.</p>' +
      '<p class="small muted">After every move the rider nudges one Q-value with the Q-learning rule (shown under the map, with real numbers). ' +
        'With chance ε it makes a random move instead of its best-looking one, so it keeps <em>exploring</em> (trying new streets) instead of only <em>exploiting</em> (repeating what already looks best).</p>' +
      '<div class="lab-body">' +
        '<div class="stack">' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:16px;align-items:start">' +
            '<div class="stack-sm">' +
              '<div class="lab-canvas-wrap" id="' + P + 'mwrap" style="aspect-ratio:1 / 1">' +
                '<canvas id="' + P + 'map" role="img" tabindex="0" aria-label="City map" aria-describedby="' + P + 'kbd"></canvas></div>' +
              '<div class="row" style="justify-content:space-between;align-items:flex-end;gap:8px 12px">' +
                '<div class="control"><span class="control-label" id="' + P + 'tapl">Tapping a square</span>' +
                  '<div class="seg" role="group" aria-labelledby="' + P + 'tapl">' +
                    '<button type="button" data-tap="look" aria-pressed="true">Shows its Q-values</button>' +
                    '<button type="button" data-tap="edit" aria-pressed="false">Changes it</button>' +
                  '</div></div>' +
                '<button type="button" class="btn btn-sm" id="' + P + 'resetmap">Reset map</button>' +
              '</div>' +
              legend([['--haldi', 'Rider'], ['--ok', 'Customer +10'], ['--sindoor', 'Traffic jam −1'], ['--ink', 'Pothole −5'], ['--muted', 'Building (blocked)']]) +
              legend([['--indigo', 'Blue square: high Q (good)'], ['--sindoor', 'Red square: low Q (bad)']]) +
            '</div>' +
            '<div class="stack-sm">' +
              '<div class="callout callout-indigo small" id="' + P + 'msg" role="status" aria-live="polite" style="min-height:3.4em"></div>' +
              '<div class="lab-stats">' +
                stat('eps', 'Episodes') + stat('moves', 'Trip moves') + stat('rew', 'Trip reward') +
                stat('avg', 'Avg of last ' + AVG_WIN) + stat('epsnow', 'Epsilon now') + stat('route', 'Greedy route') +
              '</div>' +
              '<p class="small muted">Tap or point at any square to see its four Q-values in the Q-values table. Choose <b>Changes it</b> to edit the city: each tap cycles a square road → building → traffic jam → pothole → road. Drag the restaurant (Start) or the customer to move them. Editing keeps the Q-table, so you can watch the rider adapt; a trip under way is cancelled.</p>' +
              '<p class="kbd-hint" id="' + P + 'kbd">Keyboard: Tab to the map, pick a square with the arrow keys, press Enter to tap it, S to move the start there and C to move the customer there.</p>' +
            '</div>' +
          '</div>' +
          '<div id="' + P + 'extras" style="display:grid;grid-template-columns:minmax(0,1fr);gap:16px">' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:16px;align-items:start">' +
            '<div class="stack-sm">' +
              '<h2 class="lab-h">Total reward per episode</h2>' +
              '<div class="lab-canvas-wrap" id="' + P + 'cwrap" style="aspect-ratio:16 / 10">' +
                '<canvas id="' + P + 'chart" role="img" style="touch-action:auto" aria-label="Chart of total reward per episode"></canvas></div>' +
              legend([['--series-1', 'One episode'], ['--ink', 'Average of the last ' + AVG_WIN], ['--ok', 'Best possible route']]) +
              '<p class="small muted">Early trips run out of time (about −10). As the rider learns, most trips deliver; the dips that remain are random exploring moves into jams or the pothole.</p>' +
            '</div>' +
            '<div class="stack-sm">' +
              '<h2 class="lab-h" id="' + P + 'qhead">Q-values of one square</h2>' +
              '<div class="table-wrap" tabindex="0" role="region" aria-labelledby="' + P + 'qhead"><table class="simple num"><thead><tr><th scope="col">Move</th><th scope="col" style="text-transform:none;white-space:nowrap">Q(s, a)</th><th scope="col">What that move does</th></tr></thead>' +
                '<tbody id="' + P + 'qbody"></tbody></table></div>' +
              '<p class="small muted" id="' + P + 'qnote"></p>' +
            '</div>' +
          '</div>' +
          '<div class="stack-sm">' +
            '<h2 class="lab-h">Last update</h2>' +
            '<p class="small">The Q-learning rule: <span class="mono" style="white-space:normal">Q(s, a) ← Q(s, a) + α × (r + γ × max Q(s′, a′) × (1 − done) − Q(s, a))</span>, where s′ is the square the move led to and max Q(s′, a′) is the best Q-value there. Here it is in two steps, with the real numbers:</p>' +
            '<p class="small" id="' + P + 'lastdesc"></p>' +
            '<pre class="small" id="' + P + 'lastpre" tabindex="0" role="region" aria-label="The last Q-learning update, with its numbers"></pre>' +
            '<p class="small muted">done is 1 only when the trip really ends (customer or pothole). When a trip is cut short after ' + MAX_MOVES + ' moves, done stays 0, because the street itself did not end.</p>' +
          '</div>' +
          '</div>' +
        '</div>' +
        '<div class="lab-controls">' +
          '<div class="stack-sm"><h2 class="lab-h">Train the rider</h2>' +
            '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">' +
              '<button type="button" class="btn" id="' + P + 'step">Step</button>' +
              '<button type="button" class="btn btn-primary" id="' + P + 'run">Run episode</button>' +
              '<button type="button" class="btn" id="' + P + 'train">Train 100</button>' +
              '<button type="button" class="btn" id="' + P + 'reset">Reset Q</button>' +
            '</div>' +
            '<p class="small muted">Step makes one move. Run episode plays one whole trip slowly. Train runs many trips at once without animation. Reset Q sets every Q-value back to 0, so the rider forgets everything.</p>' +
          '</div>' +
          '<div class="control"><span class="control-label" id="' + P + 'perlbl">Episodes per Train click</span>' +
            '<div class="seg" role="group" aria-labelledby="' + P + 'perlbl">' +
              '<button type="button" data-per="1" aria-pressed="false">1</button>' +
              '<button type="button" data-per="10" aria-pressed="false">10</button>' +
              '<button type="button" data-per="100" aria-pressed="true">100</button>' +
            '</div></div>' +
          slider('alpha', 'Learning rate α (alpha)', 0, 1, 0.01, DEF.alpha, 'How far one Q-value moves towards its new target in each update. 1 means replace it completely. In this city every move always has the same result, so a big α works well.') +
          slider('gamma', 'Discount γ (gamma)', 0, 0.99, 0.01, DEF.gamma, 'How much rewards further in the future count. At 0 only the very next reward matters; near 1 a reward many moves away counts almost fully.') +
          slider('epsilon', 'Exploration ε (epsilon)', 0, 1, 0.01, DEF.eps, 'The chance of a random move instead of the best-looking one. 0.2 means about 1 move in 5 is random.') +
          '<div class="small" style="display:grid;grid-template-columns:20px minmax(0,1fr);gap:8px;align-items:start"><input type="checkbox" id="' + P + 'decay" style="margin:3px 0 0"><label for="' + P + 'decay">Shrink ε a little after every episode (× ' + DECAY + ', never below ' + EPS_FLOOR + ')</label></div>' +
          slider('speed', 'Animation speed', 0, SPEEDS.length - 1, 1, DEF.speed, 'How fast Run episode plays the trip.') +
          '<div class="stack-sm"><h2 class="lab-h">Show</h2>' +
            '<div class="control"><span class="control-label" id="' + P + 'viewlbl">Q-values on the map</span>' +
              '<div class="seg" role="group" aria-labelledby="' + P + 'viewlbl">' +
                '<button type="button" data-view="arrow" aria-pressed="true">Best move</button>' +
                '<button type="button" data-view="tri" aria-pressed="false">All four moves</button>' +
              '</div>' +
              '<p class="small muted">Best move: the arrow is the greedy move and the colour is the highest Q-value. All four moves: each square splits into four triangles, one per move, each coloured by its own Q-value.</p></div>' +
            '<div class="small" style="display:grid;grid-template-columns:20px minmax(0,1fr);gap:8px;align-items:start"><input type="checkbox" id="' + P + 'showroute" checked style="margin:3px 0 0"><label for="' + P + 'showroute">Highlight the greedy route from the start</label></div>' +
            '<div class="small" style="display:grid;grid-template-columns:20px minmax(0,1fr);gap:8px;align-items:start"><input type="checkbox" id="' + P + 'showbest" style="margin:3px 0 0"><label for="' + P + 'showbest">Show the best possible route (worked out exactly from the full map, as a check)</label></div>' +
          '</div>' +
          '<div class="stack-sm"><h2 class="lab-h">Your tasks</h2><ul class="lab-tasks" id="' + P + 'tasks">' +
            TASKS.map(function (t) { return '<li data-task="' + t.id + '">' + t.text + '</li>'; }).join('') +
          '</ul></div>' +
        '</div>' +
      '</div>' +
      '<p class="small muted" id="' + P + 'why"><strong style="color:var(--ink)">Why it matters in real ML:</strong> this same update rule, with a neural network in place of the table, is the deep Q-network (DQN) that learned to play Atari games from the screen alone, and the explore-or-exploit choice decides which offers, videos or routes real apps try out; real problems have far too many states for a table, but the idea of learning from rewards is the same.</p>';
    root.appendChild(top);

    function $(id) { return top.querySelector('#' + P + id); }
    var mwrap = $('mwrap'), mcanvas = $('map'), cwrap = $('cwrap'), ccanvas = $('chart');
    var mg = mcanvas.getContext('2d'), cg = ccanvas.getContext('2d');
    var elMsg = $('msg'), elLastDesc = $('lastdesc'), elLastPre = $('lastpre');
    var elEps = $('eps'), elMoves = $('moves'), elRew = $('rew'), elAvg = $('avg'), elEpsNow = $('epsnow'), elRoute = $('route');
    var elQHead = $('qhead'), elQBody = $('qbody'), elQNote = $('qnote');
    var btnStep = $('step'), btnRun = $('run'), btnTrain = $('train'), btnReset = $('reset'), btnResetMap = $('resetmap');
    var inAlpha = $('alpha'), inGamma = $('gamma'), inEps = $('epsilon'), inSpeed = $('speed'), inDecay = $('decay');
    var outAlpha = $('alphaout'), outGamma = $('gammaout'), outEps = $('epsilonout'), outSpeed = $('speedout');
    var inShowRoute = $('showroute'), inShowBest = $('showbest');
    var perBtns = top.querySelectorAll('[data-per]'), viewBtns = top.querySelectorAll('[data-view]'), tapBtns = top.querySelectorAll('[data-tap]');
    var taskEls = {};
    Array.prototype.forEach.call(top.querySelectorAll('[data-task]'), function (li) { taskEls[li.getAttribute('data-task')] = li; });

    // On a phone (one column) the chart, Q table and formula move below the controls,
    // so the Train buttons sit right under the map instead of a long scroll away.
    var elExtras = $('extras'), elWhy = $('why'), leftStack = top.querySelector('.lab-body > .stack');
    var narrowMql = window.matchMedia ? window.matchMedia('(max-width: 820px)') : null;
    function placeExtras() {
      if (destroyed) return;
      var narrow = !!(narrowMql && narrowMql.matches);
      if (narrow && elExtras.parentNode !== top) top.insertBefore(elExtras, elWhy);
      else if (!narrow && elExtras.parentNode !== leftStack) leftStack.appendChild(elExtras);
    }
    placeExtras();

    /* ---------- state ---------- */
    var rng = mulberry32(SEED);
    var S = {
      map: parseMap(DEFAULT_ROWS), mapVer: 0,
      Q: new Float64Array(NS * 4), qVer: 0,
      alpha: DEF.alpha, gamma: DEF.gamma, eps: DEF.eps, decay: false,
      per: DEF.per, speed: DEF.speed, view: 'arrow', showRoute: true, showBest: false, tapMode: 'look',
      episodes: 0, hist: [], ep: null, last: null,
      explored: false, g0eps: 0, g0wasGood: false, g0Note: false, armed: {}, t3Note: false,
      running: false, sel: 0, hover: -1, focused: false
    };
    S.sel = S.map.start;
    S.ep = idleEp();
    var dims = { mw: 1, mh: 1, cw: 1, ch: 1, dpr: 1 };
    var rafId = 0, lastStepAt = 0, anim = null, press = null, started = false, chartDirty = true;
    var routeCache = { key: '', val: null }, optCache = { key: '', route: null };
    var themeCache = { key: '', T: null };
    var reduceMql = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

    function idleEp() { return { active: false, s: S.map.start, steps: 0, total: 0, path: [S.map.start], end: null }; }
    function route() {
      var k = S.qVer + '|' + S.mapVer + '|' + S.gamma;
      if (routeCache.key !== k) { routeCache.val = greedyRoute(S.map, S.Q, S.gamma); routeCache.key = k; }
      return routeCache.val;
    }
    function optimal() {
      var k = S.mapVer + '|' + S.gamma;
      if (optCache.key !== k) optCache = { key: k, route: greedyRoute(S.map, valueIteration(S.map, S.gamma), S.gamma) };
      return optCache.route;
    }

    /* ---------- tasks ---------- */
    var done = {};
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
    function complete(id) {
      if (done[id]) return false;
      done[id] = true;
      markLi(id);
      if (ctx && ctx.onTaskDone) ctx.onTaskDone(id);
      return true;
    }

    /* ---------- messages ---------- */
    function say(html, tone) {
      elMsg.innerHTML = html;
      elMsg.className = 'callout callout-indigo small';
      elMsg.style.borderLeftColor = tone === 'good' ? 'var(--ok)' : tone === 'warn' ? 'var(--bad)' : '';
    }
    function routeWords(rt) {
      if (rt.end === 'goal') return 'reaches the customer in ' + plural(rt.moves, 'move', 'moves') + ' (reward ' + fmtS(rt.R, 1) + ')';
      if (rt.end === 'pit') return 'falls into the pothole';
      if (rt.end === 'loop') return 'goes round in circles and never reaches the customer';
      return 'runs out of time before reaching the customer';
    }
    function routeShort(rt) {
      if (rt.end === 'goal') return 'Delivers in ' + rt.moves;
      if (rt.end === 'pit') return 'Hits pothole';
      if (rt.end === 'loop') return 'Goes in circles';
      return 'Too long';
    }
    function whatMove(M, s, a) {
      var o = stepEnv(M, s, a);
      if (o.block === 'edge') return 'Edge of the city: stays put, −0.1';
      if (o.block === 'wall') return 'Building in the way: stays put, −0.1';
      if (o.s2 === M.goal) return 'Customer: +10, trip ends';
      var t = M.types[o.s2];
      if (o.s2 !== M.start && t === PIT) return 'Pothole: −5, trip ends';
      if (o.s2 !== M.start && t === JAM) return 'Traffic jam: −1';
      return 'Road: −0.1';
    }
    function squareKind(s) {
      var M = S.map;
      if (s === M.start) return 'the restaurant (start)';
      if (s === M.goal) return 'the customer';
      return ['a road', 'a building', 'a traffic jam', 'a pothole'][M.types[s]];
    }

    /* ---------- learning ---------- */
    function startEpisode() { S.ep = { active: true, s: S.map.start, steps: 0, total: 0, path: [S.map.start], end: null }; }
    function argmaxRandom(Q, s) {
      var b = s * 4, best = -Infinity, ties = 0, pick = 0;
      for (var i = 0; i < 4; i++) {
        var v = Q[b + i];
        if (v > best) { best = v; ties = 1; pick = i; }
        else if (v === best) ties++;
      }
      if (ties === 1) return pick;
      var k = Math.floor(rng() * ties);
      for (i = 0; i < 4; i++) if (Q[b + i] === best && k-- === 0) return i;
      return pick;
    }
    // One move of the current episode, with one Q-learning update.
    function advance(animated, now) {
      if (!S.ep.active) startEpisode();
      var M = S.map, ep = S.ep, Q = S.Q, s = ep.s, a, explore = false;
      if (S.eps > 0) S.explored = true;
      if (rng() < S.eps) { explore = true; a = Math.floor(rng() * 4); }
      else a = argmaxRandom(Q, s);
      var o = stepEnv(M, s, a);
      var k = s * 4 + a, qOld = Q[k], best = maxQ(Q, o.s2), dn = o.done ? 1 : 0;
      // Q(s,a) += α · (r + γ · max_a′ Q(s′,a′) · (1 − done) − Q(s,a))
      Q[k] += S.alpha * (o.r + S.gamma * best * (1 - dn) - Q[k]);
      S.qVer++;
      S.last = { s: s, a: a, r: o.r, s2: o.s2, done: dn, qOld: qOld, best: best, qNew: Q[k], alpha: S.alpha, gamma: S.gamma, explore: explore, block: o.block, ep: S.episodes + 1 };
      ep.steps++; ep.total += o.r;
      if (o.s2 !== s) ep.path.push(o.s2);
      ep.s = o.s2;
      if (animated) {
        var dur = reduceMql && reduceMql.matches ? 0 : Math.min(240, 0.85 * 1000 / SPEEDS[S.speed]);
        anim = dur > 0 ? { from: s, to: o.s2, dir: a, bump: o.s2 === s, t0: now, dur: dur } : null;
      }
      var kind = null;
      if (o.done) kind = o.s2 === M.goal ? 'goal' : 'pit';
      else if (ep.steps >= MAX_MOVES) kind = 'time';
      if (kind) endEpisode(kind);
      return S.last;
    }
    function endEpisode(kind) {
      var ep = S.ep;
      ep.active = false; ep.end = kind;
      S.episodes++;
      S.hist.push(ep.total);
      if (S.gamma === 0) S.g0eps++;
      if (S.decay && S.eps > EPS_FLOOR) S.eps = Math.max(EPS_FLOOR, S.eps * DECAY);
      chartDirty = true;
    }
    function episodeWords(ep, n) {
      var head = 'Episode ' + fmtInt(n) + ': ';
      if (ep.end === 'goal') return head + 'delivered to the customer in ' + plural(ep.steps, 'move', 'moves') + '. Total reward ' + fmtS(ep.total, 1) + '.';
      if (ep.end === 'pit') return head + 'fell into the pothole after ' + plural(ep.steps, 'move', 'moves') + '. Total reward ' + fmtS(ep.total, 1) + '.';
      return head + 'ran out of time after ' + MAX_MOVES + ' moves without finding the customer. Total reward ' + fmtS(ep.total, 1) + '.';
    }
    function stepWords(L) {
      var how = L.explore ? 'Random move (exploring): ' : 'Greedy move: ';
      var what;
      if (L.block) what = 'tried to go ' + MOVE_NAMES[L.a].toLowerCase() + ' from ' + cellName(L.s) + ', but ' + (L.block === 'edge' ? 'that is the edge of the city' : 'a building is in the way') + ', so it stayed put (r = −0.1).';
      else what = 'went ' + MOVE_NAMES[L.a].toLowerCase() + ' from ' + cellName(L.s) + ' to ' + cellName(L.s2) + ' (r = ' + fmtR(L.r) + ').';
      return how + what + ' Q(s, ' + MOVE_NAMES[L.a] + ') changed from ' + fmt(L.qOld, 2) + ' to ' + fmt(L.qNew, 2) + '.';
    }
    function avgLast() {
      var n = S.hist.length;
      if (!n) return null;
      var k = Math.min(AVG_WIN, n), s = 0;
      for (var i = n - k; i < n; i++) s += S.hist[i];
      return s / k;
    }

    function train(n) {
      setRunning(false);
      anim = null;
      for (var i = 0; i < n; i++) {
        if (!S.ep.active) startEpisode();
        while (S.ep.active) advance(false, 0);
      }
      var last = S.ep;
      S.ep = idleEp();
      S.ep.steps = last.steps; S.ep.total = last.total; S.ep.end = last.end; S.ep.shownStats = true;
      var rt = route(), av = avgLast();
      var msg = 'Trained ' + plural(n, 'episode', 'episodes') + ' (' + fmtInt(S.episodes) + ' in total). Average reward of the last ' + Math.min(AVG_WIN, S.hist.length) + ': ' + fmtS(av, 1) + '. The greedy route now ' + routeWords(rt) + '.';
      say(msg, rt.end === 'goal' ? 'good' : '');
      afterLearning('train');
    }

    function setRunning(v) {
      S.running = !!v;
      btnRun.textContent = S.running ? 'Stop' : 'Run episode';
      if (S.running) lastStepAt = 0;
      requestDraw();
    }

    /* ---------- tasks: detection ---------- */
    function armedJams() {
      var out = [];
      for (var k in S.armed) if (Object.prototype.hasOwnProperty.call(S.armed, k) && S.map.types[+k] === JAM && +k !== S.map.start && +k !== S.map.goal) out.push(+k);
      return out;
    }
    function isDefaultMap() {
      var D = parseMap(DEFAULT_ROWS), M = S.map;
      if (D.start !== M.start || D.goal !== M.goal) return false;
      for (var s = 0; s < NS; s++) if (D.types[s] !== M.types[s]) return false;
      return true;
    }
    // kind: 'train' (Train button), 'learn' (Step or Run episode) or 'edit' (map edits, Reset Q).
    // Only learning can complete a task; editing the map alone never does.
    function checkTasks(kind) {
      var rt = route(), learning = kind !== 'edit';
      if (S.gamma === 0 && rt.end === 'goal') S.g0wasGood = true;
      if (!learning) return;
      if (!done.t1 && S.episodes >= 1 && S.gamma > 0 && rt.end === 'goal') {
        if (complete('t1')) say('Delivered! After ' + plural(S.episodes, 'episode', 'episodes') + ' the greedy route ' + routeWords(rt) + '. Look at the map: blue spreads back from the customer, because each Q-value learns from the best Q-value of the square after it.', 'good');
      }
      if (!done.t2 && S.gamma === 0 && S.g0eps >= TASK_MIN_EPISODES) {
        if (S.g0wasGood && rt.end !== 'goal') {
          if (complete('t2')) say('With γ = 0 the rider only counts the very next reward. Only squares right next to the customer still look good; everywhere else every move looks about the same (−0.1), so its route ' + routeWords(rt) + '. Set γ back to 0.9 and train again to bring the far-away reward back into view.', 'good');
        } else if (!S.g0wasGood && !S.g0Note) {
          S.g0Note = true;
          say('The greedy route was not reaching the customer even before you set γ to 0, so there is nothing for γ = 0 to break yet. Set γ back to 0.9, train until the route reaches the customer, then set γ to 0 and train again.');
        } else if (kind === 'train' && rt.end === 'goal') {
          say('The route still reaches the customer: old Q-values learned with a higher γ take a while to fade. Keep training with γ = 0.');
        }
      }
      if (!done.t3 && !S.explored && S.episodes >= TASK_MIN_EPISODES) {
        var op = optimal(), lane = isDefaultMap();
        if (op.end === 'goal' && (rt.end !== 'goal' || rt.G < op.G - 1e-6)) {
          var why = lane && rt.end !== 'goal'
            ? 'Leaving its lane means driving through the jam (−1), which came to look worse than circling inside the lane, so it stopped trying and never found the customer (+10) on the other side. Its route ' + routeWords(rt) + '.'
            : 'It only repeats moves that already look best, so it never finds out what the streets it has not tried are worth. Its route ' + routeWords(rt) + (rt.end === 'goal' ? ', but the best possible route earns ' + fmtS(op.R, 1) : '') + '.';
          if (complete('t3')) say('With ε = 0 the rider never tries a random move. ' + why + ' That is why agents need exploration.', 'good');
        } else if (op.end === 'goal' && !S.t3Note) {
          S.t3Note = true;
          if (lane && S.gamma > 0.9) say('This time the rider found the best route even without exploring: with γ = ' + fmt(S.gamma, 2) + ', circling in its lane for ever looks worse than one jam, so it pushed through. Set γ to 0.9, press Reset Q and try ε = 0 again.');
          else say('This time the rider found the best route even without exploring. Press Reset map, set γ to 0.9 and α to 0.8, press Reset Q and try ε = 0 again.');
        }
      }
      var jams = armedJams();
      if (!done.t4 && jams.length) {
        var avoided = -1;
        if (rt.end === 'goal') for (var i = 0; i < jams.length; i++) if (rt.path.indexOf(jams[i]) < 0) { avoided = jams[i]; break; }
        if (avoided >= 0) {
          if (complete('t4')) say('The route changed! The jam at ' + cellName(avoided) + ' costs −1, so after more practice the rider goes round it: its route ' + routeWords(rt) + '.', 'good');
        } else if (kind === 'train' && rt.end === 'goal') {
          say('The greedy route still goes through your jam. The other streets are not learned well yet: keep training, or raise ε for a while so the rider explores more.');
        }
      }
    }

    /* ---------- map editing ---------- */
    function mapChanged(msg) {
      setRunning(false);
      anim = null;
      var M = S.map;
      // A square where the trip ends (customer or pothole) has no moves, so its Q-values are 0 by definition.
      // Buildings keep theirs: the rider can never stand there, and cycling a square through "building"
      // on the way to "jam" should not wipe what it learned.
      for (var s = 0; s < NS; s++) {
        if (isTerminal(M, s)) { S.Q[s * 4] = 0; S.Q[s * 4 + 1] = 0; S.Q[s * 4 + 2] = 0; S.Q[s * 4 + 3] = 0; }
      }
      S.mapVer++; S.qVer++;
      S.ep = idleEp();
      for (var k in S.armed) if (Object.prototype.hasOwnProperty.call(S.armed, k) && M.types[+k] !== JAM) delete S.armed[k];
      if (msg) say(msg);
      chartDirty = true;
      updateUI();
      checkTasks('edit');
      requestDraw();
    }
    function cycleCell(s) {
      var M = S.map;
      if (s === M.start || s === M.goal) {
        say('That is ' + squareKind(s) + '. Drag it to move it; it cannot be turned into anything else.');
        return;
      }
      var before = M.types[s], next = (before + 1) % 4;   // road → building → jam → pothole → road
      // the greedy route as it would be if this square were plain road
      var plain = copyMap(M); plain.types[s] = ROAD;
      var r0 = greedyRoute(plain, S.Q, S.gamma);
      M.types[s] = next;
      var names = ['road', 'building', 'traffic jam', 'pothole'];
      var msg = cellName(s) + ' is now a ' + names[next] + '.';
      if (next === JAM) {
        if (r0.end === 'goal' && r0.path.indexOf(s) >= 0) {
          S.armed[s] = true;
          var probe = copyMap(M), op = greedyRoute(probe, valueIteration(probe, S.gamma), S.gamma);
          if (op.end === 'goal' && op.path.indexOf(s) >= 0) msg += ' It is on the rider’s route, but going round it would cost more than sitting in it, so even the best possible route still uses it. Try a jam on a different square of the route.';
          else msg += ' It is on the rider’s greedy route. The rider does not know yet: train more and watch the route change.';
        } else if (!done.t4 && r0.end !== 'goal') {
          msg += ' (For the task, first train until the greedy route reaches the customer, then put the jam on that route.)';
        }
      }
      mapChanged(msg);
    }
    function moveSpecial(kind, t) {
      var M = S.map;
      if (t < 0) return;
      var other = kind === 'start' ? M.goal : M.start;
      if (t === other) { say('That square already has ' + (kind === 'start' ? 'the customer' : 'the restaurant') + '. Pick another one.'); return; }
      if ((kind === 'start' ? M.start : M.goal) === t) return;
      M.types[t] = ROAD;
      if (kind === 'start') M.start = t; else M.goal = t;
      S.armed = {};   // the route now starts or ends somewhere else, so an old jam no longer counts for the task
      S.sel = t;
      mapChanged((kind === 'start' ? 'The restaurant (start)' : 'The customer') + ' moved to ' + cellName(t) + '. The Q-table is kept, so the rider has to adapt with more training.');
    }

    /* ---------- UI updates ---------- */
    function syncSliders() {
      outAlpha.textContent = fmt(S.alpha, 2); inAlpha.setAttribute('aria-valuetext', fmt(S.alpha, 2));
      outGamma.textContent = fmt(S.gamma, 2); inGamma.setAttribute('aria-valuetext', fmt(S.gamma, 2));
      outEps.textContent = fmt(S.eps, 2); inEps.setAttribute('aria-valuetext', fmt(S.eps, 2));
      if (Math.abs(+inEps.value - S.eps) > 0.005) inEps.value = String(Math.round(S.eps * 100) / 100);
      var sp = SPEEDS[S.speed] + ' moves/s';
      outSpeed.textContent = sp; inSpeed.setAttribute('aria-valuetext', SPEEDS[S.speed] + ' moves per second');
    }
    function updateQTable() {
      var s = S.hover >= 0 ? S.hover : S.sel, M = S.map, Q = S.Q;
      elQHead.textContent = 'Q-values of ' + cellName(s) + (s === M.start ? ' (start)' : s === M.goal ? ' (customer)' : '');
      if (isWall(M, s) || isTerminal(M, s)) {
        elQBody.innerHTML = '<tr><td colspan="3">' + (isWall(M, s) ? 'A building: the rider can never stand here, so it has no Q-values.' : 'The trip ends here, so there are no moves from this square. In the rule, (1 − done) = 0 makes its Q-values count as 0.') + '</td></tr>';
        elQNote.textContent = '';
        return;
      }
      var m = maxQ(Q, s), eq = allEqual(Q, s), nBest = 0, a;
      for (a = 0; a < 4; a++) if (Q[s * 4 + a] === m) nBest++;
      var html = '';
      for (a = 0; a < 4; a++) {
        var q = Q[s * 4 + a], isBest = !eq && q === m;
        html += '<tr><td>' + MOVE_ARROWS[a] + ' ' + MOVE_NAMES[a] + (isBest ? ' <strong>(' + (nBest > 1 ? 'tied best' : 'best') + ')</strong>' : '') + '</td><td>' + fmt(q, 2) + '</td><td>' + whatMove(M, s, a) + '</td></tr>';
      }
      elQBody.innerHTML = html;
      elQNote.textContent = eq ? 'All four Q-values are equal, so the rider has no preference here' + (m === 0 ? ' yet.' : '.') : 'The greedy move is the one with the highest Q-value. Rows are rounded to 2 decimal places.';
    }
    function updateLast() {
      var L = S.last;
      if (!L) {
        elLastDesc.textContent = 'No updates yet. Press Step to make the first move.';
        elLastPre.textContent = 'target = r + γ × max Q(s′,a′) × (1 − done)\nnew Q = old Q + α × (target − old Q)';
        return;
      }
      var where = L.block ? 'stayed at ' + cellName(L.s2) + ' (' + (L.block === 'edge' ? 'edge of the city' : 'building in the way') + ')' : 'arrived at ' + cellName(L.s2) + (L.s2 === S.map.goal && L.done ? ' (customer)' : L.done ? ' (pothole)' : '');
      elLastDesc.textContent = 'Episode ' + fmtInt(L.ep) + ': at ' + cellName(L.s) + ' the rider chose ' + MOVE_NAMES[L.a] + (L.explore ? ' (a random, exploring move)' : ' (its greedy move)') + ' and ' + where + '.';
      var target = L.r + L.gamma * L.best * (1 - L.done);
      var neg = function (v) { var t = fmt(v, 3); return v < 0 && t.charAt(0) === '−' ? '(' + t + ')' : t; };
      elLastPre.textContent =
        'target = r + γ × max Q(s′,a′) × (1 − done)\n' +
        '  = ' + fmtR(L.r) + ' + ' + fmt(L.gamma, 2) + ' × ' + neg(L.best) + ' × (1 − ' + L.done + ')\n' +
        '  = ' + fmt(target, 3) + '\n' +
        'new Q = old Q + α × (target − old Q)\n' +
        '  = ' + fmt(L.qOld, 3) + ' + ' + fmt(L.alpha, 2) + ' × (' + fmt(target, 3) + ' − ' + neg(L.qOld) + ')\n' +
        '  = ' + fmt(L.qNew, 3);
    }
    function mapLabel() {
      var M = S.map, w = 0, j = 0, p = 0;
      for (var s = 0; s < NS; s++) { if (s === M.start || s === M.goal) continue; if (M.types[s] === WALL) w++; else if (M.types[s] === JAM) j++; else if (M.types[s] === PIT) p++; }
      var rt = route();
      return 'City map, ' + N + ' by ' + N + ' squares. Restaurant (start) at ' + cellName(M.start) + ', customer at ' + cellName(M.goal) + '. ' +
        plural(w, 'building', 'buildings') + ', ' + plural(j, 'traffic jam', 'traffic jams') + ', ' + plural(p, 'pothole', 'potholes') + '. ' +
        'The rider is at ' + cellName(S.ep.s) + '. Greedy route: ' + routeWords(rt) + '.';
    }
    function updateUI() {
      var ep = S.ep, rt = route(), av = avgLast();
      elEps.textContent = fmtInt(S.episodes);
      elMoves.textContent = ep.active || ep.end || ep.steps ? fmtInt(ep.steps) : '—';
      elRew.textContent = ep.active || ep.end || ep.steps ? fmtS(ep.total, 1) : '—';
      elAvg.textContent = av === null ? '—' : fmtS(av, 1);
      elEpsNow.textContent = fmt(S.eps, 2);
      elRoute.textContent = routeShort(rt);
      btnTrain.textContent = 'Train ' + S.per;
      Array.prototype.forEach.call(perBtns, function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-per') === S.per)); });
      Array.prototype.forEach.call(viewBtns, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === S.view)); });
      Array.prototype.forEach.call(tapBtns, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-tap') === S.tapMode)); });
      syncSliders();
      updateQTable();
      updateLast();
      mcanvas.setAttribute('aria-label', mapLabel());
      var op = optimal();
      ccanvas.setAttribute('aria-label', 'Chart of total reward per episode for ' + plural(S.hist.length, 'episode', 'episodes') + '.' +
        (av === null ? ' No episodes yet.' : ' Average of the last ' + Math.min(AVG_WIN, S.hist.length) + ': ' + fmtS(av, 1) + '.') +
        (op.end === 'goal' ? ' Best possible route: ' + fmtS(op.R, 1) + '.' : ''));
    }
    function afterLearning(kind) {
      updateUI();
      checkTasks(kind);
      requestDraw();
    }

    /* ---------- drawing ---------- */
    function theme() {
      var cs = getComputedStyle(document.documentElement), raw = {}, key = '';
      for (var i = 0; i < THEME_VARS.length; i++) { raw[THEME_VARS[i]] = cs.getPropertyValue(THEME_VARS[i]).trim(); key += raw[THEME_VARS[i]] + '|'; }
      var font = cs.getPropertyValue('--font-body').trim() || 'system-ui, sans-serif';
      key += font;
      if (themeCache.key === key && themeCache.T) return themeCache.T;
      var T = { font: font, rgb: {} };
      THEME_VARS.forEach(function (v) { var n = v.slice(2).replace(/-/g, ''); T[n] = raw[v]; T.rgb[n] = toRgb(raw[v]); });
      T.building = 'rgb(' + mix(T.rgb.surface, T.rgb.muted, 0.62).join(',') + ')';
      T.window = rgba(T.rgb.surface, 0.55);
      themeCache = { key: key, T: T };
      return T;
    }
    function font(T, px, weight) { return (weight || '400') + ' ' + px + 'px ' + T.font; }
    function heat(T, q) {
      if (q === 0) return null;
      var t = Math.min(1, Math.sqrt(Math.abs(q) / 10)), a = 0.05 + 0.4 * t;
      return rgba(q > 0 ? T.rgb.indigo : T.rgb.sindoor, a.toFixed(3));
    }
    function centre(s, cs) { return { x: (colOf(s) + 0.5) * cs, y: (rowOf(s) + 0.5) * cs }; }

    function drawBuilding(g, T, x, y, cs) {
      var m = Math.max(2, cs * 0.06);
      g.fillStyle = T.building;
      g.fillRect(x + m, y + m, cs - 2 * m, cs - 2 * m);
      g.fillStyle = T.window;
      var w = (cs - 2 * m) * 0.18, gap = (cs - 2 * m - 3 * w) / 4;
      for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) g.fillRect(x + m + gap + i * (w + gap), y + m + gap + j * (w + gap), w, w * 0.8);
    }
    function drawCar(g, T, x, y, w) {
      var h = w * 0.45;
      g.beginPath();
      if (g.roundRect) g.roundRect(x, y, w, h, h * 0.35); else g.rect(x, y, w, h);
      g.fillStyle = T.sindoor; g.fill();
      g.lineWidth = 1.2; g.strokeStyle = T.ink; g.stroke();
      g.fillStyle = T.ink;
      g.beginPath(); g.arc(x + w * 0.25, y + h, h * 0.28, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(x + w * 0.75, y + h, h * 0.28, 0, Math.PI * 2); g.fill();
    }
    function drawHouse(g, T, cx, cy, sz, alpha) {
      g.save();
      g.globalAlpha = alpha == null ? 1 : alpha;
      g.beginPath();
      g.moveTo(cx - sz * 0.5, cy - sz * 0.05);
      g.lineTo(cx, cy - sz * 0.5);
      g.lineTo(cx + sz * 0.5, cy - sz * 0.05);
      g.lineTo(cx + sz * 0.36, cy - sz * 0.05);
      g.lineTo(cx + sz * 0.36, cy + sz * 0.42);
      g.lineTo(cx - sz * 0.36, cy + sz * 0.42);
      g.lineTo(cx - sz * 0.36, cy - sz * 0.05);
      g.closePath();
      g.fillStyle = T.ok; g.fill();
      g.lineWidth = 1.5; g.strokeStyle = T.ink; g.stroke();
      g.fillStyle = T.surface;
      g.fillRect(cx - sz * 0.1, cy + sz * 0.12, sz * 0.2, sz * 0.3);
      g.restore();
    }
    function drawRider(g, T, x, y, cs, alpha) {
      var r = cs * 0.22;
      g.save();
      g.globalAlpha = alpha == null ? 1 : alpha;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
      g.fillStyle = T.haldi; g.fill();
      g.lineWidth = 2; g.strokeStyle = T.ink; g.stroke();
      // delivery box on the rider's back
      var b = r * 0.8;
      g.fillStyle = T.ink;
      g.fillRect(x - b / 2, y - b / 2, b, b);
      g.fillStyle = T.haldi;
      g.fillRect(x - b / 2 + 2, y - b / 2 + 2, b - 4, (b - 4) * 0.35);
      g.restore();
    }
    function drawArrow(g, cx, cy, a, len, color) {
      var dx = DC[a], dy = DR[a], hl = len * 0.42;
      var x0 = cx - dx * len * 0.5, y0 = cy - dy * len * 0.5, x1 = cx + dx * len * 0.5, y1 = cy + dy * len * 0.5;
      g.strokeStyle = color; g.fillStyle = color; g.lineWidth = Math.max(2, len * 0.12); g.lineCap = 'round';
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1 - dx * hl * 0.6, y1 - dy * hl * 0.6); g.stroke();
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x1 - dx * hl - dy * hl * 0.6, y1 - dy * hl + dx * hl * 0.6);
      g.lineTo(x1 - dx * hl + dy * hl * 0.6, y1 - dy * hl - dx * hl * 0.6);
      g.closePath(); g.fill();
    }
    function riderXY(now, cs) {
      var c = centre(S.ep.s, cs);
      if (!anim) return c;
      var p = clamp((now - anim.t0) / anim.dur, 0, 1), e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      var f = centre(anim.from, cs);
      if (anim.bump) {
        var k = Math.sin(Math.PI * p) * 0.22 * cs;
        return { x: f.x + DC[anim.dir] * k, y: f.y + DR[anim.dir] * k };
      }
      var t = centre(anim.to, cs);
      return { x: f.x + (t.x - f.x) * e, y: f.y + (t.y - f.y) * e };
    }
    function polyRoute(g, path, cs) {
      g.beginPath();
      for (var i = 0; i < path.length; i++) {
        var c = centre(path[i], cs);
        if (i === 0) g.moveTo(c.x, c.y); else g.lineTo(c.x, c.y);
      }
    }

    function paintMap(now) {
      var T = theme(), g = mg, W = dims.mw, H = dims.mh, cs = W / N, M = S.map, Q = S.Q, s, a, x, y, c;
      g.setTransform(dims.dpr, 0, 0, dims.dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.fillStyle = T.surface; g.fillRect(0, 0, W, H);
      // 1. squares: Q-value colours, buildings, special squares
      for (s = 0; s < NS; s++) {
        x = colOf(s) * cs; y = rowOf(s) * cs;
        if (s === M.goal) { g.fillStyle = rgba(T.rgb.ok, 0.16); g.fillRect(x, y, cs, cs); continue; }
        if (isWall(M, s)) { drawBuilding(g, T, x, y, cs); continue; }
        if (isTerminal(M, s)) { g.fillStyle = T.surface2; g.fillRect(x, y, cs, cs); continue; }
        if (S.view === 'arrow') {
          var hs = heat(T, maxQ(Q, s));
          if (hs) { g.fillStyle = hs; g.fillRect(x, y, cs, cs); }
        } else {
          var cx = x + cs / 2, cy = y + cs / 2, corners = [[x, y], [x + cs, y], [x + cs, y + cs], [x, y + cs]];
          for (a = 0; a < 4; a++) {
            var hq = heat(T, Q[s * 4 + a]);
            if (!hq) continue;
            var p0 = corners[a], p1 = corners[(a + 1) % 4];   // Up: top edge, Right: right edge, Down: bottom, Left: left
            g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.lineTo(cx, cy); g.closePath();
            g.fillStyle = hq; g.fill();
          }
          g.strokeStyle = rgba(T.rgb.muted, 0.35); g.lineWidth = 1;
          g.beginPath(); g.moveTo(x, y); g.lineTo(x + cs, y + cs); g.moveTo(x + cs, y); g.lineTo(x, y + cs); g.stroke();
        }
      }
      // 2. grid lines
      g.strokeStyle = T.line; g.lineWidth = 1;
      g.beginPath();
      for (var i = 1; i < N; i++) {
        var v = Math.round(i * cs) + 0.5;
        g.moveTo(v, 0); g.lineTo(v, H); g.moveTo(0, v); g.lineTo(W, v);
      }
      g.stroke();
      // 3. the greedy route as a soft highlighter band, and the exact best route as a dashed line
      var rt = route();
      if (S.showRoute && rt.path.length > 1) {
        g.save();
        g.strokeStyle = rgba(T.rgb.ink, 0.16); g.lineWidth = cs * 0.34; g.lineCap = 'round'; g.lineJoin = 'round';
        polyRoute(g, rt.path, cs); g.stroke();
        g.restore();
      }
      if (S.showBest) {
        var op = optimal();
        if (op.path.length > 1) {
          g.save();
          g.strokeStyle = T.ok; g.lineWidth = 2.5; g.setLineDash([6, 5]); g.lineCap = 'round'; g.lineJoin = 'round';
          polyRoute(g, op.path, cs); g.stroke();
          g.restore();
        }
      }
      // 4. arrows, numbers and icons
      var fs = clamp(Math.round(cs * 0.2), 9, 13), showNums = cs >= 40;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      for (s = 0; s < NS; s++) {
        x = colOf(s) * cs; y = rowOf(s) * cs; c = centre(s, cs);
        if (isWall(M, s)) continue;
        if (s === M.goal) {
          drawHouse(g, T, c.x, c.y - cs * 0.08, cs * 0.5);
          g.fillStyle = T.ink; g.font = font(T, fs, '700');
          g.fillText('+10', c.x, y + cs - fs * 0.75);
          continue;
        }
        if (isTerminal(M, s)) {
          g.save();
          g.beginPath(); g.ellipse(c.x, c.y, cs * 0.34, cs * 0.24, -0.15, 0, Math.PI * 2);
          g.fillStyle = rgba(T.rgb.ink, 0.88); g.fill();
          g.restore();
          g.fillStyle = T.surface; g.font = font(T, fs, '700');
          g.fillText('−5', c.x, c.y);
          continue;
        }
        if (M.types[s] === JAM && s !== M.start) {
          g.save();
          g.strokeStyle = T.sindoor; g.lineWidth = 2; g.setLineDash([4, 3]);
          g.strokeRect(x + 3, y + 3, cs - 6, cs - 6);
          g.restore();
          drawCar(g, T, x + cs * 0.1, y + cs * 0.1, cs * 0.3);
          g.fillStyle = T.ink; g.font = font(T, fs, '700'); g.textAlign = 'right';
          g.fillText('−1', x + cs - cs * 0.1, y + cs * 0.17);
          g.textAlign = 'center';
        }
        if (s === M.start) {
          g.fillStyle = T.ink; g.font = font(T, Math.max(9, fs - 1), '700'); g.textAlign = 'left';
          g.fillText('Start', x + 4, y + fs * 0.75);
          g.textAlign = 'center';
        }
        if (S.view === 'arrow') {
          if (!allEqual(Q, s)) {
            drawArrow(g, c.x, c.y - (showNums ? cs * 0.04 : 0), argmaxFirst(Q, s), cs * 0.4, T.ink);
            if (showNums) { g.fillStyle = T.ink; g.font = font(T, fs - 1, '600'); g.fillText(fmt(maxQ(Q, s), 1), c.x, y + cs - fs * 0.72); }
          } else {
            g.fillStyle = T.muted; g.beginPath(); g.arc(c.x, c.y, 2, 0, Math.PI * 2); g.fill();
          }
        } else if (!allEqual(Q, s)) {
          var ba = argmaxFirst(Q, s);
          g.fillStyle = T.ink;
          g.beginPath(); g.arc(c.x + DC[ba] * cs * 0.33, c.y + DR[ba] * cs * 0.33, Math.max(2.5, cs * 0.055), 0, Math.PI * 2); g.fill();
        }
      }
      // 5. this trip's trail and the rider
      var rp = riderXY(now, cs), path = S.ep.path;
      if (path.length > 1 || anim) {
        g.save();
        g.lineCap = 'round'; g.lineJoin = 'round';
        var trail = function () {
          g.beginPath();
          var n = anim && !anim.bump ? path.length - 1 : path.length;
          for (var k = 0; k < n; k++) { var q = centre(path[k], cs); if (k === 0) g.moveTo(q.x, q.y); else g.lineTo(q.x, q.y); }
          if (n === 0) { var q0 = centre(path[0], cs); g.moveTo(q0.x, q0.y); }
          g.lineTo(rp.x, rp.y);
        };
        trail(); g.strokeStyle = rgba(T.rgb.ink, 0.7); g.lineWidth = 5; g.stroke();
        trail(); g.strokeStyle = T.haldi; g.lineWidth = 2.5; g.stroke();
        g.restore();
      }
      drawRider(g, T, rp.x, rp.y, cs);
      // 6. the square shown in the Q table, and a square being dragged to
      var showSel = S.hover >= 0 ? S.hover : S.sel;
      if (showSel >= 0) {
        g.save();
        g.strokeStyle = T.ink; g.lineWidth = S.focused ? 3.5 : 2.5;
        if (S.hover >= 0 && S.hover !== S.sel) g.setLineDash([5, 4]);
        g.strokeRect(colOf(showSel) * cs + 1.5, rowOf(showSel) * cs + 1.5, cs - 3, cs - 3);
        g.restore();
      }
      if (press && press.kind && press.moved) {
        var tc = centre(press.target, cs);
        g.save();
        g.strokeStyle = T.ink; g.lineWidth = 3; g.setLineDash([6, 4]);
        g.strokeRect(colOf(press.target) * cs + 2, rowOf(press.target) * cs + 2, cs - 4, cs - 4);
        g.restore();
        if (press.kind === 'goal') drawHouse(g, T, tc.x, tc.y - cs * 0.08, cs * 0.5, 0.7);
        else {
          g.fillStyle = T.ink; g.font = font(T, fs, '700');
          g.fillText('Start', tc.x, tc.y);
        }
      }
    }

    function niceStep(raw) {
      var p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
      return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p;
    }
    function paintChart() {
      chartDirty = false;
      var T = theme(), g = cg, W = dims.cw, H = dims.ch;
      g.setTransform(dims.dpr, 0, 0, dims.dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.fillStyle = T.surface; g.fillRect(0, 0, W, H);
      var hist = S.hist, n = hist.length, op = optimal();
      var pl = 40, pr = 12, pt = 12, pb = 30, pw = Math.max(10, W - pl - pr), ph = Math.max(10, H - pt - pb);
      var lo = 0, hi = 0, i;
      for (i = 0; i < n; i++) { if (hist[i] < lo) lo = hist[i]; if (hist[i] > hi) hi = hist[i]; }
      if (op.end === 'goal') { if (op.R > hi) hi = op.R; }
      hi = Math.max(hi, 10); lo = Math.min(lo, -10);
      var span = hi - lo, step = niceStep(span / 4);
      lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
      var xmax = Math.max(n, 20);
      function X(k) { return pl + (xmax <= 1 ? 0 : (k - 1) / (xmax - 1)) * pw; }
      function Y(v) { return pt + (1 - (v - lo) / (hi - lo)) * ph; }
      // grid + y ticks
      g.font = font(T, 11); g.fillStyle = T.muted; g.textAlign = 'right'; g.textBaseline = 'middle';
      g.lineWidth = 1;
      for (var v = lo; v <= hi + 1e-9; v += step) {
        var py = Math.round(Y(v)) + 0.5;
        g.strokeStyle = v === 0 ? rgba(T.rgb.muted, 0.6) : rgba(T.rgb.muted, 0.2);
        g.beginPath(); g.moveTo(pl, py); g.lineTo(pl + pw, py); g.stroke();
        g.fillText(fmtS(v, 0), pl - 6, py);
      }
      // x ticks
      g.textAlign = 'center'; g.textBaseline = 'top';
      var xs = niceStep(xmax / 4);
      for (var k = xs; k <= xmax; k += xs) g.fillText(fmtInt(k), X(k), pt + ph + 4);
      g.fillText('1', X(1), pt + ph + 4);
      g.fillStyle = T.ink; g.font = font(T, 11, '600'); g.textAlign = 'right'; g.textBaseline = 'bottom';
      g.fillText('episode →', pl + pw, H - 1);
      g.save(); g.beginPath(); g.rect(pl, pt - 2, pw, ph + 4); g.clip();
      if (op.end === 'goal') {
        g.strokeStyle = T.ok; g.lineWidth = 2; g.setLineDash([6, 5]);
        g.beginPath(); g.moveTo(pl, Y(op.R)); g.lineTo(pl + pw, Y(op.R)); g.stroke(); g.setLineDash([]);
      }
      if (n) {
        g.fillStyle = rgba(T.rgb.series1, 0.55);
        if (n <= pw) {
          var r = n > 300 ? 1.4 : 2.2;
          for (i = 0; i < n; i++) { g.beginPath(); g.arc(X(i + 1), Y(hist[i]), r, 0, Math.PI * 2); g.fill(); }
        } else {
          // more episodes than pixels: one thin min-max bar per pixel column
          g.strokeStyle = rgba(T.rgb.series1, 0.55); g.lineWidth = 1;
          g.beginPath();
          var col = -1, mn = 0, mxv = 0;
          for (i = 0; i < n; i++) {
            var cx = Math.floor(X(i + 1));
            if (cx !== col) { if (col >= 0) { g.moveTo(col + 0.5, Y(mn)); g.lineTo(col + 0.5, Y(mxv) - 0.5); } col = cx; mn = mxv = hist[i]; }
            else { if (hist[i] < mn) mn = hist[i]; if (hist[i] > mxv) mxv = hist[i]; }
          }
          g.moveTo(col + 0.5, Y(mn)); g.lineTo(col + 0.5, Y(mxv) - 0.5);
          g.stroke();
        }
        // moving average
        g.strokeStyle = T.ink; g.lineWidth = 2; g.lineJoin = 'round';
        g.beginPath();
        var sum = 0, stride = Math.max(1, Math.floor(n / (pw * 2)));
        for (i = 0; i < n; i++) {
          sum += hist[i]; if (i >= AVG_WIN) sum -= hist[i - AVG_WIN];
          if (i % stride !== 0 && i !== n - 1) continue;
          var avg = sum / Math.min(i + 1, AVG_WIN);
          if (i === 0) g.moveTo(X(1), Y(avg)); else g.lineTo(X(i + 1), Y(avg));
        }
        g.stroke();
      }
      g.restore();
      g.strokeStyle = T.muted; g.lineWidth = 1;
      g.beginPath(); g.moveTo(pl + 0.5, pt); g.lineTo(pl + 0.5, pt + ph + 0.5); g.lineTo(pl + pw, pt + ph + 0.5); g.stroke();
      if (!n) {
        g.fillStyle = T.muted; g.font = font(T, 13, '600'); g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('No episodes yet: press Train or Run episode', pl + pw / 2, pt + ph / 2);
      }
    }

    /* ---------- animation loop: runs only while something moves ---------- */
    function requestDraw() { if (!rafId && !destroyed) rafId = requestAnimationFrame(frame); }
    function frame(now) {
      rafId = 0;
      if (destroyed) return;
      if (S.running) {
        var interval = 1000 / SPEEDS[S.speed];
        if (!S.ep.active) setRunning(false);
        else if (!lastStepAt || now - lastStepAt >= interval) {
          lastStepAt = now;
          advance(true, now);
          if (!S.ep.active) {
            setRunning(false);
            say(episodeWords(S.ep, S.episodes), S.ep.end === 'goal' ? 'good' : S.ep.end === 'pit' ? 'warn' : '');
          }
          updateUI();
          checkTasks('learn');
        }
      }
      if (anim && now >= anim.t0 + anim.dur) anim = null;
      paintMap(now);
      if (chartDirty) paintChart();
      if (S.running || anim) rafId = requestAnimationFrame(frame);
    }
    function paintNow() { var t = performance.now(); paintMap(t); paintChart(); }

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      var r1 = mcanvas.getBoundingClientRect(), r2 = ccanvas.getBoundingClientRect();
      var mw = Math.max(1, Math.round(r1.width)), mh = Math.max(1, Math.round(r1.height));
      var cw = Math.max(1, Math.round(r2.width)), ch = Math.max(1, Math.round(r2.height));
      if (mw === dims.mw && mh === dims.mh && cw === dims.cw && ch === dims.ch && dpr === dims.dpr && mcanvas.width > 1) return;
      dims.dpr = dpr; dims.mw = mw; dims.mh = mh; dims.cw = cw; dims.ch = ch;
      mcanvas.width = Math.round(mw * dpr); mcanvas.height = Math.round(mh * dpr);
      ccanvas.width = Math.round(cw * dpr); ccanvas.height = Math.round(ch * dpr);
      // resizing wipes a canvas: repaint now so there is no blank frame
      if (started && !destroyed) paintNow();
    }

    /* ---------- pointer: map ---------- */
    function cellFromEvent(e, clampInside) {
      var r = mcanvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      if (!clampInside && (x < 0 || y < 0 || x >= r.width || y >= r.height)) return -1;
      var c = clamp(Math.floor(x / (r.width / N)), 0, N - 1), rr = clamp(Math.floor(y / (r.height / N)), 0, N - 1);
      return rr * N + c;
    }
    function cellSummary(sq) {
      var Q = S.Q, txt = cellName(sq) + ': ' + squareKind(sq) + '.';
      if (!isWall(S.map, sq) && !isTerminal(S.map, sq)) txt += allEqual(Q, sq) ? ' No preferred move' + (Q[sq * 4] === 0 ? ' yet.' : '.') : ' Best move ' + MOVE_NAMES[argmaxFirst(Q, sq)] + ', Q = ' + fmt(maxQ(Q, sq), 2) + '.';
      return txt;
    }
    function tap(s) {
      S.sel = s;
      if (S.tapMode === 'edit') cycleCell(s);
      else { say(cellSummary(s) + ' All four Q-values are in the Q-values table.'); updateQTable(); requestDraw(); }
    }
    on(mcanvas, 'pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      var s = cellFromEvent(e, false);
      if (s < 0) return;
      var M = S.map;
      press = { id: e.pointerId, s: s, kind: s === M.start ? 'start' : s === M.goal ? 'goal' : null, moved: false, target: s };
      try { mcanvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      e.preventDefault();
      if (press.kind) mcanvas.style.cursor = 'grabbing';
    });
    on(mcanvas, 'pointermove', function (e) {
      if (press && press.id === e.pointerId) {
        if (!press.kind) return;
        var t = cellFromEvent(e, true);
        if (t !== press.target) { press.target = t; press.moved = press.moved || t !== press.s; requestDraw(); }
        return;
      }
      if (e.pointerType !== 'mouse') return;
      var h = cellFromEvent(e, false);
      if (h !== S.hover) { S.hover = h; updateQTable(); requestDraw(); }
      var M = S.map;
      mcanvas.style.cursor = h === M.start || h === M.goal ? 'grab' : 'pointer';
    });
    function endPress(e, cancelled) {
      if (!press || press.id !== e.pointerId) return;
      var p = press;
      press = null;
      mcanvas.style.cursor = '';
      if (cancelled) { requestDraw(); return; }
      if (p.kind && p.moved && p.target !== p.s) moveSpecial(p.kind, p.target);
      else tap(p.s);
      requestDraw();
    }
    on(mcanvas, 'pointerup', function (e) { endPress(e, false); });
    on(mcanvas, 'pointercancel', function (e) { endPress(e, true); });
    on(mcanvas, 'pointerleave', function () { if (S.hover !== -1 && !press) { S.hover = -1; updateQTable(); requestDraw(); } });
    on(mcanvas, 'focus', function () { S.focused = true; requestDraw(); });
    on(mcanvas, 'blur', function () { S.focused = false; requestDraw(); });
    on(mcanvas, 'keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var s = S.sel, r = rowOf(s), c = colOf(s), k = e.key, moved = true;
      if (k === 'ArrowUp') r = Math.max(0, r - 1);
      else if (k === 'ArrowDown') r = Math.min(N - 1, r + 1);
      else if (k === 'ArrowLeft') c = Math.max(0, c - 1);
      else if (k === 'ArrowRight') c = Math.min(N - 1, c + 1);
      else moved = false;
      if (moved) {
        e.preventDefault();
        S.sel = r * N + c; S.hover = -1;
        updateQTable(); requestDraw();
        say(cellSummary(S.sel));
        return;
      }
      if (k === 'Enter' || k === ' ') { e.preventDefault(); tap(S.sel); return; }
      if (k === 's' || k === 'S') { e.preventDefault(); moveSpecial('start', S.sel); return; }
      if (k === 'c' || k === 'C') { e.preventDefault(); moveSpecial('goal', S.sel); }
    });

    /* ---------- controls ---------- */
    on(btnStep, 'click', function () {
      if (S.running) setRunning(false);
      var L = advance(true, performance.now());
      if (!S.ep.active) say(stepWords(L) + ' ' + episodeWords(S.ep, S.episodes), S.ep.end === 'goal' ? 'good' : S.ep.end === 'pit' ? 'warn' : '');
      else say(stepWords(L));
      afterLearning('learn');
    });
    on(btnRun, 'click', function () {
      if (S.running) { setRunning(false); say('Paused in the middle of episode ' + fmtInt(S.episodes + 1) + '. Press Run episode to carry on, or Step to go one move at a time.'); updateUI(); return; }
      if (!S.ep.active) startEpisode();
      anim = null;
      say('Watching episode ' + fmtInt(S.episodes + 1) + '…');
      setRunning(true);
    });
    on(btnTrain, 'click', function () { train(S.per); });
    on(btnReset, 'click', function () {
      setRunning(false);
      anim = null;
      S.Q = new Float64Array(NS * 4); S.qVer++;
      S.episodes = 0; S.hist = []; S.last = null; S.ep = idleEp();
      S.explored = false; S.g0eps = 0; S.g0wasGood = false; S.g0Note = false; S.armed = {}; S.t3Note = false;
      chartDirty = true;
      say('Q-table wiped: every Q-value is back to 0, so the rider has forgotten everything it learned.' + (S.eps === 0 ? ' ε is 0, so from now on it will never explore.' : ''));
      afterLearning('edit');
    });
    on(btnResetMap, 'click', function () {
      S.map = parseMap(DEFAULT_ROWS);
      S.armed = {};
      S.sel = S.map.start; S.hover = -1;
      mapChanged('The city is back to the starting map. The Q-table is kept.');
    });
    Array.prototype.forEach.call(perBtns, function (b) {
      on(b, 'click', function () { S.per = +b.getAttribute('data-per'); updateUI(); });
    });
    Array.prototype.forEach.call(viewBtns, function (b) {
      on(b, 'click', function () { S.view = b.getAttribute('data-view'); updateUI(); requestDraw(); });
    });
    Array.prototype.forEach.call(tapBtns, function (b) {
      on(b, 'click', function () {
        S.tapMode = b.getAttribute('data-tap');
        updateUI();
        say(S.tapMode === 'edit' ? 'Edit mode: tap a square to cycle it: road → building → traffic jam → pothole → road.' : 'Look mode: tap a square to see its four Q-values in the table.');
      });
    });
    on(inAlpha, 'input', function () { S.alpha = +inAlpha.value; syncSliders(); });
    on(inGamma, 'input', function () {
      var g = +inGamma.value, was = S.gamma;
      S.gamma = g;
      if (g !== was) { S.g0eps = 0; S.g0Note = false; }
      if (g === 0 && was !== 0) S.g0wasGood = route().end === 'goal';
      if (g === 0 && was !== 0) say('γ is now 0: from now on only the very next reward counts. Train and watch what happens to the blue squares and the route.');
      updateUI(); requestDraw(); chartDirty = true;
    });
    on(inEps, 'input', function () {
      var v = +inEps.value, was = S.eps;
      S.eps = v;
      if (v === 0 && was !== 0) say('ε is now 0: the rider will always take its greedy move and never explore.');
      syncSliders(); updateUI();
    });
    on(inDecay, 'change', function () { S.decay = inDecay.checked; });
    on(inSpeed, 'input', function () { S.speed = clamp(Math.round(+inSpeed.value), 0, SPEEDS.length - 1); syncSliders(); });
    on(inShowRoute, 'change', function () { S.showRoute = inShowRoute.checked; requestDraw(); });
    on(inShowBest, 'change', function () {
      S.showBest = inShowBest.checked;
      if (S.showBest) {
        var op = optimal();
        say(op.end === 'goal' ? 'Dashed green: the best possible route for this map and γ, worked out exactly by checking every square (reward ' + fmtS(op.R, 1) + ' in ' + plural(op.moves, 'move', 'moves') + '). The rider never sees this; it must find it by trial and error.' : 'With γ = ' + fmt(S.gamma, 2) + ' even the best possible plan does not head for the customer: the +10 is too far away to be worth the trip.');
      }
      requestDraw();
    });

    /* ---------- theme + resize ---------- */
    function onTheme() { themeCache.key = ''; chartDirty = true; requestDraw(); }
    var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mql) { if (mql.addEventListener) mql.addEventListener('change', onTheme); else if (mql.addListener) mql.addListener(onTheme); }
    if (narrowMql) { if (narrowMql.addEventListener) narrowMql.addEventListener('change', placeExtras); else if (narrowMql.addListener) narrowMql.addListener(placeExtras); }
    on(document, 'themechange', onTheme);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!destroyed) onTheme(); });
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { if (!destroyed) resize(); }); ro.observe(mwrap); ro.observe(cwrap); }
    else on(window, 'resize', resize);

    /* ---------- start: a few practice trips so the map and chart are not empty ---------- */
    for (var pi = 0; pi < PRETRAIN; pi++) {
      startEpisode();
      while (S.ep.active) advance(false, 0);
    }
    S.ep = idleEp();
    say('The rider has already made ' + PRETRAIN + ' practice trips; most ran out of time before it found the customer. Press <b>Train 100</b> to keep practising, or <b>Run episode</b> to watch one trip.');
    updateUI();
    resize();
    started = true;
    paintNow();

    return {
      destroy: function () {
        if (destroyed) return;
        destroyed = true;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
        if (ro) ro.disconnect();
        if (mql) { if (mql.removeEventListener) mql.removeEventListener('change', onTheme); else if (mql.removeListener) mql.removeListener(onTheme); }
        if (narrowMql) { if (narrowMql.removeEventListener) narrowMql.removeEventListener('change', placeExtras); else if (narrowMql.removeListener) narrowMql.removeListener(placeExtras); }
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
        listeners = [];
        if (top.parentNode) top.parentNode.removeChild(top);
      }
    };
  }

  Labs.qlearn = {
    id: 'qlearn',
    module: 'l4-rl',
    title: 'Q-learning: the delivery rider',
    summary: 'Train a delivery rider to find the best route to a customer by trial and error, and see how the learning rate, the discount γ and exploration ε change what it learns.',
    tasks: TASKS,
    mount: mount
  };
})();
