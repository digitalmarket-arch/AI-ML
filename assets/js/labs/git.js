/* AI Marg lab: Git branching visualiser.
   The learner runs Git commands as buttons (commit, branch, switch, merge, revert, log). Each one prints the real command
   and Git's own style of reply in a small terminal, and the commit graph, branch tags, HEAD and the files at HEAD update.
   Merges are true three-way merges: a fast-forward when possible, otherwise a merge commit with two parents, and a preset
   story makes main and feature edit the same README.md line so the learner can resolve a conflict.
   Plain classic script (ES2019). Registers window.AILabs.git. No libraries, no network, no storage. */
(function () {
  'use strict';
  var Labs = (window.AILabs = window.AILabs || {});
  var mountCount = 0;

  /* ---------- constants ---------- */
  var MAX_COMMITS = 40;       // keeps the picture readable
  var MAX_BRANCHES = 6;
  var MAX_NAME = 20;
  var TERM_MAX = 160;         // terminal lines kept
  var ID_SEED = 2718;         // same commit ids every time the lab starts
  var SVGNS = 'http://www.w3.org/2000/svg';
  var LANE_VARS = ['--series-1', '--series-4', '--series-2', '--series-3', '--ok', '--muted'];

  // graph geometry (CSS px)
  var RC = 15;                // commit circle radius
  var PILL_H = 20, PILL_GAP = 4, HEAD_GAP = 11, STACK_GAP = 8;
  var LANE_GAP = 30, PAD_T = 10, PAD_B = 26, PAD_X = 30, DX_MIN = 60, DX_MAX = 150, DX_FILL = 124, MIN_H = 160;
  var LABEL_MIN_DX = 86;      // commit messages are written under the circles when columns are at least this wide

  var TASKS = [
    { id: 't1', text: 'Fast-forward: create a branch called feature, switch to it, make 2 commits, then switch back to main and merge feature.' },
    { id: 't2', text: 'Merge commit: make two branches diverge (a new commit on each), then merge one into the other so Git makes a commit with two parents.' },
    { id: 't3', text: 'Conflict: press “Load the conflict story”, run git merge feature, then fix README.md by keeping ours, theirs or both.' },
    { id: 't4', text: 'Undo safely: make an Oops commit (it deletes prices.csv), then undo it with git revert HEAD, so the history keeps both commits.' }
  ];

  /* ---------- the project's files ---------- */
  var README_1 = ['# Chai Price Predictor', 'Predict the price of a cup of chai in Indian cities.'].join('\n');
  var MODEL_LINE = 'Model: not chosen yet';
  var README_2 = [
    '# Chai Price Predictor',
    'Predict the price of a cup of chai in Indian cities.',
    '',
    'Data: prices.csv (tea stalls in 3 cities)',
    MODEL_LINE,
    'Team: Asha, Ravi, Meera'
  ].join('\n');
  var PRICES = ['city,stall,price', 'Pune,Sharma Tea Stall,₹15', 'Mumbai,Station Chai,₹20'].join('\n');
  // what each "git commit" adds (one new file per commit, so normal merges never clash)
  var POOL = [
    { msg: 'Add data loader', path: 'load_data.py', text: '# reads prices.csv into a table' },
    { msg: 'Clean missing prices', path: 'clean.py', text: '# drops stalls that have no price' },
    { msg: 'Plot prices by city', path: 'plot.py', text: '# bar chart: Pune vs Mumbai vs Delhi' },
    { msg: 'Train first model', path: 'train.py', text: '# learns the price from city and cup size' },
    { msg: 'Add Delhi stall prices', path: 'prices_delhi.csv', text: 'Delhi,Chandni Chowk Chai,₹12' },
    { msg: 'Add a test for cleaning', path: 'test_clean.py', text: '# checks that no empty prices are left' },
    { msg: 'Save the trained model', path: 'save_model.py', text: '# writes the model to model.pkl' },
    { msg: 'List the libraries we use', path: 'requirements.txt', text: 'pandas\nscikit-learn' },
    { msg: 'Check accuracy on new stalls', path: 'evaluate.py', text: '# average error in rupees per cup' },
    { msg: 'Add Chennai stall prices', path: 'prices_chennai.csv', text: 'Chennai,Marina Beach Tea,₹10' },
    { msg: 'Add a notebook of charts', path: 'charts.ipynb', text: '(a Jupyter notebook with 4 charts)' },
    { msg: 'Try a smaller learning rate', path: 'tune.py', text: '# learning_rate = 0.01' }
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
  function dict() { return Object.create(null); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function lines(s) { return s === undefined || s === '' ? [] : s.split('\n'); }
  function sameArr(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }
  function listWords(arr) {
    if (arr.length <= 1) return arr.join('');
    return arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
  }

  /* ---------- line diff (longest common subsequence) ---------- */
  function lcsPairs(a, b) {
    var n = a.length, m = b.length, W = m + 1, dp = new Uint16Array((n + 1) * W), i, j;
    for (i = n - 1; i >= 0; i--) {
      for (j = m - 1; j >= 0; j--) {
        dp[i * W + j] = a[i] === b[j] ? dp[(i + 1) * W + j + 1] + 1 : Math.max(dp[(i + 1) * W + j], dp[i * W + j + 1]);
      }
    }
    var out = [];
    i = 0; j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) { out.push([i, j]); i++; j++; }
      else if (dp[(i + 1) * W + j] >= dp[i * W + j + 1]) i++;
      else j++;
    }
    return out;
  }
  // Git's "edit script" from a to b: a[i1, i1 + chg1) becomes b[i2, i2 + chg2)
  function script(a, b) {
    var pairs = lcsPairs(a, b), out = [], ai = 0, bi = 0;
    pairs.push([a.length, b.length]);
    for (var k = 0; k < pairs.length; k++) {
      var i = pairs[k][0], j = pairs[k][1];
      if (i > ai || j > bi) out.push({ i1: ai, chg1: i - ai, i2: bi, chg2: j - bi });
      ai = i + 1; bi = j + 1;
    }
    return out;
  }
  function pushOk(segs, ls) {
    if (!ls.length) return;
    var last = segs[segs.length - 1];
    if (last && last.ok) last.ok = last.ok.concat(ls); else segs.push({ ok: ls.slice() });
  }
  // Records one change of the merge (i0/chg0 in base, i1/chg1 in ours, i2/chg2 in theirs; mode 1 = ours only,
  // 2 = theirs only, 0 = conflict). A change that overlaps or touches the previous one joins it (Git: xdl_append_merge).
  function appendChange(list, mode, i0, chg0, i1, chg1, i2, chg2) {
    var m = list[list.length - 1];
    if (m && (i1 <= m.i1 + m.chg1 || i2 <= m.i2 + m.chg2)) {
      if (mode !== m.mode) m.mode = 0;
      m.chg0 = i0 + chg0 - m.i0; m.chg1 = i1 + chg1 - m.i1; m.chg2 = i2 + chg2 - m.i2;
    } else list.push({ mode: mode, i0: i0, chg0: chg0, i1: i1, chg1: chg1, i2: i2, chg2: chg2 });
  }
  // Three-way merge of one text file, line by line, following Git's own merge code (xdiff/xmerge.c, the default
  // "zealous" level): a change only one side made is taken; changes from both sides that overlap or touch become a
  // conflict; inside a conflict only the lines that really differ stay between the markers; and two conflicts with
  // 3 or fewer unchanged lines between them are joined into one.
  function merge3(B, O, T) {
    var x1 = script(B, O), x2 = script(B, T), c = [], p = 0, q = 0, a, b;
    while (p < x1.length && q < x2.length) {
      a = x1[p]; b = x2[q];
      if (a.i1 + a.chg1 < b.i1) { appendChange(c, 1, a.i1, a.chg1, a.i2, a.chg2, b.i2 - b.i1 + a.i1, a.chg1); p++; continue; }
      if (b.i1 + b.chg1 < a.i1) { appendChange(c, 2, b.i1, b.chg1, a.i2 - a.i1 + b.i1, b.chg1, b.i2, b.chg2); q++; continue; }
      if (a.i1 !== b.i1 || a.chg1 !== b.chg1 || a.chg2 !== b.chg2 || !sameArr(O.slice(a.i2, a.i2 + a.chg2), T.slice(b.i2, b.i2 + b.chg2))) {
        var off = a.i1 - b.i1, ffo = off + a.chg1 - b.chg1;
        var i0 = a.i1, i1 = a.i2, i2 = b.i2;
        if (off > 0) { i0 -= off; i1 -= off; } else i2 += off;
        var chg0 = a.i1 + a.chg1 - i0, chg1 = a.i2 + a.chg2 - i1, chg2 = b.i2 + b.chg2 - i2;
        if (ffo < 0) { chg0 -= ffo; chg1 -= ffo; } else chg2 += ffo;
        appendChange(c, 0, i0, chg0, i1, chg1, i2, chg2);
      }
      var e1 = a.i1 + a.chg1, e2 = b.i1 + b.chg1;
      if (e1 >= e2) q++;
      if (e2 >= e1) p++;
    }
    for (; p < x1.length; p++) { a = x1[p]; appendChange(c, 1, a.i1, a.chg1, a.i2, a.chg2, a.i1 + T.length - B.length, a.chg1); }
    for (; q < x2.length; q++) { b = x2[q]; appendChange(c, 2, b.i1, b.chg1, b.i1 + O.length - B.length, b.chg1, b.i2, b.chg2); }
    // refine: compare the two sides of each conflict and keep only the lines that differ
    var r = [];
    c.forEach(function (m) {
      if (m.mode !== 0 || !m.chg1 || !m.chg2) { r.push(m); return; }
      var xs = script(O.slice(m.i1, m.i1 + m.chg1), T.slice(m.i2, m.i2 + m.chg2));
      if (!xs.length) { m.mode = 4; r.push(m); return; }   // both sides made the same edit
      xs.forEach(function (x) { r.push({ mode: 0, i1: m.i1 + x.i1, chg1: x.chg1, i2: m.i2 + x.i2, chg2: x.chg2 }); });
    });
    // simplify: join two conflicts that have at most 3 unchanged lines between them
    for (var k = 0; k + 1 < r.length;) {
      var m1 = r[k], m2 = r[k + 1];
      if (m1.mode !== 0 || m2.mode !== 0 || m2.i1 - (m1.i1 + m1.chg1) > 3) { k++; continue; }
      m1.chg1 = m2.i1 + m2.chg1 - m1.i1;
      m1.chg2 = m2.i2 + m2.chg2 - m1.i2;
      r.splice(k + 1, 1);
    }
    // the result: our lines, with theirs swapped in where only they changed, and markers where both did
    var segs = [], pos = 0, conflict = false;
    r.forEach(function (m) {
      if (m.mode === 4) return;
      pushOk(segs, O.slice(pos, m.i1));
      if (m.mode === 0) { segs.push({ ours: O.slice(m.i1, m.i1 + m.chg1), theirs: T.slice(m.i2, m.i2 + m.chg2) }); conflict = true; }
      else if (m.mode === 1) pushOk(segs, O.slice(m.i1, m.i1 + m.chg1));
      else pushOk(segs, T.slice(m.i2, m.i2 + m.chg2));
      pos = m.i1 + m.chg1;
    });
    pushOk(segs, O.slice(pos));
    return { segs: segs, conflict: conflict };
  }
  function withMarkers(segs, oursLabel, theirsLabel) {
    var r = [];
    segs.forEach(function (s) {
      if (s.ok) r = r.concat(s.ok);
      else r = r.concat(['<<<<<<< ' + oursLabel], s.ours, ['======='], s.theirs, ['>>>>>>> ' + theirsLabel]);
    });
    return r.join('\n');
  }
  function resolveSegs(segs, choice) {
    var r = [];
    segs.forEach(function (s) {
      if (s.ok) r = r.concat(s.ok);
      else if (choice === 'ours') r = r.concat(s.ours);
      else if (choice === 'theirs') r = r.concat(s.theirs);
      else r = r.concat(s.ours, s.theirs);
    });
    return r.join('\n');
  }
  function unionKeys() {
    var seen = dict(), out = [];
    for (var i = 0; i < arguments.length; i++) for (var k in arguments[i]) if (!seen[k]) { seen[k] = true; out.push(k); }
    return out.sort();
  }
  // Three-way merge of whole snapshots ({ path: text }). A file only one side changed takes that side's version.
  function mergeFiles(base, ours, theirs, oursLabel, theirsLabel) {
    var out = {}, conflicts = [], auto = [];
    unionKeys(base, ours, theirs).forEach(function (p) {
      var b = base[p], o = ours[p], t = theirs[p];
      if (o === t) { if (o !== undefined) out[p] = o; return; }
      if (b === o) { if (t !== undefined) out[p] = t; return; }
      if (b === t) { if (o !== undefined) out[p] = o; return; }
      // Edited on one side, deleted on the other. This lab's commits never edit a file that can be deleted
      // (new files are never edited, README.md is never deleted), so this cannot happen here; keep the edit.
      if (o === undefined || t === undefined) { out[p] = o !== undefined ? o : t; return; }
      auto.push(p);
      var m = merge3(lines(b), lines(o), lines(t));
      if (m.conflict) { conflicts.push({ path: p, segs: m.segs }); out[p] = withMarkers(m.segs, oursLabel, theirsLabel); }
      else out[p] = resolveSegs(m.segs, 'ours');
    });
    return { files: out, conflicts: conflicts, auto: auto };
  }
  // per-file changes from snapshot a to snapshot b, for Git's "1 file changed, 1 insertion(+)" summaries
  function diffSnap(a, b) {
    var out = [];
    unionKeys(a, b).forEach(function (p) {
      if (a[p] === b[p]) return;
      var la = lines(a[p]), lb = lines(b[p]);
      if (a[p] === undefined) out.push({ path: p, ins: lb.length, del: 0, mode: 'create' });
      else if (b[p] === undefined) out.push({ path: p, ins: 0, del: la.length, mode: 'delete' });
      else { var L = lcsPairs(la, lb).length; out.push({ path: p, ins: lb.length - L, del: la.length - L, mode: '' }); }
    });
    return out;
  }
  // summaryOnly: git commit and git revert print just the totals; git merge also prints one " file | 2 +-" line per file
  function statLines(ch, summaryOnly) {
    if (!ch.length) return [];
    var w = 0, cw = 1, ins = 0, del = 0, out = [];
    ch.forEach(function (c) { w = Math.max(w, c.path.length); cw = Math.max(cw, String(c.ins + c.del).length); ins += c.ins; del += c.del; });
    if (!summaryOnly) ch.forEach(function (c) {
      out.push(' ' + c.path.padEnd(w) + ' | ' + String(c.ins + c.del).padStart(cw) + ' ' + '+'.repeat(Math.min(c.ins, 40)) + '-'.repeat(Math.min(c.del, 40)));
    });
    var s = ' ' + plural(ch.length, 'file', 'files') + ' changed';
    if (ins) s += ', ' + ins + ' insertion' + (ins === 1 ? '' : 's') + '(+)';
    if (del) s += ', ' + del + ' deletion' + (del === 1 ? '' : 's') + '(-)';
    out.push(s);
    ch.forEach(function (c) { if (c.mode) out.push(' ' + c.mode + ' mode 100644 ' + c.path); });
    return out;
  }
  function describeChanges(ch, verbs) {
    return ch.map(function (c) {
      return c.path + ' ' + (c.mode === 'create' ? verbs[0] : c.mode === 'delete' ? verbs[1] : verbs[2]);
    });
  }

  /* ---------- branch names ---------- */
  // Git's own rules (git check-ref-format, plus "no leading dash" and "not HEAD" from git branch)
  function gitNameOk(name) {
    if (!name || name === 'HEAD' || name === '@' || name.charAt(0) === '-') return false;
    if (/[\x00-\x20\x7f~^:?*[\\]/.test(name)) return false;
    if (name.indexOf('..') >= 0 || name.indexOf('@{') >= 0 || name.indexOf('//') >= 0) return false;
    if (name.charAt(0) === '/' || name.slice(-1) === '/' || name.slice(-1) === '.') return false;
    var parts = name.split('/');
    for (var i = 0; i < parts.length; i++) if (parts[i].charAt(0) === '.' || /\.lock$/.test(parts[i])) return false;
    return true;
  }
  function shellArg(s) { return /^[A-Za-z0-9._\/-]+$/.test(s) ? s : '"' + s.replace(/(["\\$`])/g, '\\$1') + '"'; }

  /* ---------- the repository ---------- */
  function newRepo() {
    return {
      commits: dict(), order: [], branches: dict(), branchOrder: [], head: 'main',
      lanes: [], laneOf: dict(), pool: 0, rnd: mulberry32(ID_SEED), used: dict(), anc: dict(), merging: null
    };
  }
  function makeId(R) {
    for (;;) {
      var hex = ('00' + Math.floor(R.rnd() * 4096).toString(16)).slice(-3);
      // a mix of letters and digits looks like the start of a real commit hash (e.g. a1f)
      if (!R.used[hex] && /[a-f]/.test(hex) && /[0-9]/.test(hex)) return hex;
    }
  }
  function addCommit(R, o) {
    var id = o.id || makeId(R);
    R.used[id] = true;
    var c = { id: id, parents: o.parents.slice(), msg: o.msg, files: o.files, kind: o.kind || 'normal', branch: o.branch, seq: R.order.length };
    R.commits[id] = c;
    R.order.push(id);
    if (!(o.branch in R.laneOf)) { R.laneOf[o.branch] = R.lanes.length; R.lanes.push(o.branch); }
    return c;
  }
  function buildStart(R) {
    addCommit(R, { id: 'a1f', parents: [], msg: 'Initial commit', files: { 'README.md': README_1 }, branch: 'main' });
    addCommit(R, { id: '7c2', parents: ['a1f'], msg: 'Add tea-stall prices', files: { 'README.md': README_1, 'prices.csv': PRICES }, branch: 'main' });
    addCommit(R, { id: 'e94', parents: ['7c2'], msg: 'Describe the plan in README', files: { 'README.md': README_2, 'prices.csv': PRICES }, branch: 'main' });
    R.branches.main = 'e94';
    R.branchOrder = ['main'];
    R.head = 'main';
  }
  // every commit reachable from id, including id (commits never change, so this is cached)
  function ancOf(R, id) {
    if (R.anc[id]) return R.anc[id];
    var a = dict(), stack = [id];
    while (stack.length) {
      var x = stack.pop();
      if (a[x]) continue;
      a[x] = true;
      var ps = R.commits[x].parents;
      for (var i = 0; i < ps.length; i++) stack.push(ps[i]);
    }
    R.anc[id] = a;
    return a;
  }
  // The merge base: the newest commits both sides share. When there are several (a "criss-cross"), Git first merges
  // them into one temporary base, which is what this does too.
  function baseFiles(R, A, B, depth) {
    var common = [];
    for (var id in A) if (B[id]) common.push(id);
    var best = common.filter(function (x) { return !common.some(function (y) { return y !== x && ancOf(R, y)[x]; }); });
    best.sort(function (p, q) { return R.commits[p].seq - R.commits[q].seq; });
    if (!best.length) return {};
    var files = R.commits[best[0]].files, vA = ancOf(R, best[0]);
    for (var i = 1; i < best.length; i++) {
      var oA = ancOf(R, best[i]);
      var inner = depth < 4 ? baseFiles(R, vA, oA, depth + 1) : {};
      files = mergeFiles(inner, files, R.commits[best[i]].files, 'Temporary merge branch 1', 'Temporary merge branch 2').files;
      vA = Object.assign(dict(), vA, oA);
    }
    return files;
  }
  function mergeMsg(into, name) {
    // Git leaves out "into main" when merging into main or master
    return "Merge branch '" + name + "'" + (into === 'main' || into === 'master' ? '' : ' into ' + into);
  }
  function revertMsg(msg) {
    // Git 2.43+: reverting a revert says "Reapply"
    if (msg.indexOf('Revert "') === 0 && msg.slice(8).indexOf('Revert "') !== 0) return 'Reapply "' + msg.slice(8);
    return 'Revert "' + msg + '"';
  }

  /* ---------- theme ---------- */
  var THEME_VARS = ['--bg', '--surface', '--surface-2', '--ink', '--muted', '--line', '--indigo', '--indigo-soft', '--on-indigo', '--haldi', '--haldi-soft', '--sindoor', '--ok', '--bad', '--series-1', '--series-2', '--series-3', '--series-4'];
  function readTheme() {
    var cs = getComputedStyle(document.documentElement), T = {};
    THEME_VARS.forEach(function (n) { T[n] = cs.getPropertyValue(n).trim(); });
    if (!T['--on-indigo']) T['--on-indigo'] = T['--surface'];
    T.body = cs.getPropertyValue('--font-body').trim() || 'system-ui, sans-serif';
    T.mono = cs.getPropertyValue('--font-mono').trim() || 'ui-monospace, monospace';
    return T;
  }

  /* ---------- mount ---------- */
  function mount(root, ctx) {
    var P = 'git' + (++mountCount) + '-';
    var destroyed = false, listeners = [];
    function on(target, type, fn, opts) { target.addEventListener(type, fn, opts); listeners.push([target, type, fn, opts]); }

    var tasksHtml = TASKS.map(function (t) { return '<li data-task="' + t.id + '">' + esc(t.text) + '</li>'; }).join('');
    var grid2 = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,124px),1fr));gap:8px';
    var stat = function (k, id) {
      return '<div class="stat"><div class="k">' + k + '</div><div class="v" id="' + P + id + '" style="overflow-wrap:anywhere">—</div></div>';
    };
    var word = function (name, def) {
      return '<div class="card-flat" style="padding:10px 12px"><dt style="font-weight:700">' + name + '</dt><dd style="margin:2px 0 0">' + def + '</dd></div>';
    };

    var top = document.createElement('div');
    top.className = 'lab';
    top.innerHTML =
      '<p class="lab-note"><strong>What you are seeing:</strong> the history of a small project, <em>Chai Price Predictor</em>, drawn as a graph. ' +
      'Each circle is a <em>commit</em> (a saved snapshot of every file in the project) with a short id such as a1f, and each line joins a commit to its <em>parent</em> (the commit it was made from). ' +
      'Time runs from left to right. The tags are <em>branches</em> (movable name tags that point at one commit), and <em>HEAD</em> marks the branch you are on right now. ' +
      'Every button is a real Git command: press one and the command appears in the terminal, while the graph and the files change just as they would on your own computer.</p>' +
      '<div class="lab-body">' +
        '<div class="stack-sm" id="' + P + 'left">' +
          '<div class="lab-canvas-wrap" id="' + P + 'wrap" role="region" tabindex="0" aria-label="Commit graph. Use the Left and Right arrow keys to step through the commits. It scrolls sideways when it gets long." style="aspect-ratio:auto;overflow-x:auto;overflow-y:hidden">' +
            '<svg id="' + P + 'svg" xmlns="' + SVGNS + '" role="img" aria-label="Commit graph" style="position:static;display:block;max-width:none;touch-action:pan-x pan-y"></svg>' +
          '</div>' +
          '<div class="lab-legend">' +
            '<span style="--c:var(--series-1)">Circle = commit</span>' +
            '<span style="--c:var(--series-4)">Row = branch it was made on</span>' +
            '<span style="--c:var(--indigo)">Filled tag = your branch</span>' +
            '<span style="--c:var(--haldi)">HEAD = you are here</span>' +
          '</div>' +
          '<p class="small" id="' + P + 'detail" style="min-height:3em"></p>' +
          '<p class="small muted">Tap or click a circle to see what that commit changed. A double ring means a merge commit (two parents). When the graph gets long, scroll it sideways.</p>' +
          '<p class="kbd-hint">Keyboard: focus the graph, then press the Left and Right arrow keys (or Home and End) to step through the commits. Esc goes back to HEAD.</p>' +
          '<p class="visually-hidden" id="' + P + 'kbdlive" aria-live="polite"></p>' +
          '<div class="lab-stats" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr))">' + stat('On branch', 'sbranch') + stat('HEAD commit', 'shead') + stat('Commits', 'scount') + stat('Last merge', 'smerge') + '</div>' +
          '<div class="stack-sm" id="' + P + 'files" style="margin-top:8px">' +
            '<h2 class="lab-h">Files at HEAD</h2>' +
            '<p class="small muted" id="' + P + 'fileshead"></p>' +
            '<ul class="small" id="' + P + 'filelist" style="list-style:none;padding:0;display:flex;flex-direction:column;gap:4px"></ul>' +
            '<p class="small" style="font-weight:600;margin-top:4px">README.md</p>' +
            '<pre id="' + P + 'readme" style="white-space:pre-wrap;overflow-wrap:anywhere;font-size:.86rem"></pre>' +
          '</div>' +
        '</div>' +
        '<div class="lab-controls">' +
          '<div class="stack-sm"><h2 class="lab-h">Run a Git command</h2>' +
            '<p class="small muted">Each command acts on the branch you are on: <b id="' + P + 'onb" style="color:var(--ink)">main</b>.</p></div>' +
          '<div class="control"><span class="control-label">Save your work</span>' +
            '<button type="button" class="btn btn-primary" id="' + P + 'commit"><span class="mono">git commit</span></button>' +
            '<p class="small muted" id="' + P + 'next"></p>' +
            '<button type="button" class="btn btn-sm" id="' + P + 'oops">Oops commit: delete prices.csv</button>' +
            '<p class="small muted" id="' + P + 'oopshelp" hidden>prices.csv is already gone on this branch. Revert the Oops commit first.</p>' +
          '</div>' +
          '<form class="control" id="' + P + 'bform" novalidate>' +
            '<label for="' + P + 'bname">New branch name</label>' +
            '<div style="display:flex;gap:8px;min-width:0">' +
              '<input type="text" id="' + P + 'bname" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="40" aria-describedby="' + P + 'bhelp" style="flex:1 1 auto;min-width:0;width:100%">' +
              '<button type="submit" class="btn" id="' + P + 'branch" style="white-space:nowrap;flex:none"><span class="mono">git branch</span></button>' +
            '</div>' +
            '<p class="small muted" id="' + P + 'bhelp">Try <b style="color:var(--ink)">feature</b>. Use letters, numbers, - or _ with no spaces. Leave the box empty to list the branches.</p>' +
            '<p class="kbd-hint">Tip: press Enter in the box to run it.</p>' +
          '</form>' +
          '<div class="control">' +
            '<label for="' + P + 'target">Other branch</label>' +
            '<select id="' + P + 'target" style="width:100%"></select>' +
            '<div class="stack-sm" style="margin-top:4px">' +
              '<button type="button" class="btn" id="' + P + 'switch"><span class="mono" id="' + P + 'switchtxt">git switch</span></button>' +
              '<button type="button" class="btn" id="' + P + 'merge"><span class="mono" id="' + P + 'mergetxt">git merge</span></button>' +
            '</div>' +
            '<p class="small muted">Switch moves HEAD (and your files) to that branch. Merge brings that branch’s commits into the branch you are on.</p>' +
          '</div>' +
          '<div class="control"><span class="control-label">Undo and look back</span>' +
            '<div class="stack-sm">' +
              '<button type="button" class="btn" id="' + P + 'revert"><span class="mono" id="' + P + 'reverttxt">git revert HEAD</span></button>' +
              '<button type="button" class="btn" id="' + P + 'log"><span class="mono">git log --oneline --all</span></button>' +
            '</div>' +
            '<p class="small muted">Revert adds a new commit that undoes the last one. Log prints the whole history as text.</p>' +
          '</div>' +
          '<div class="control"><span class="control-label">Start again</span>' +
            '<div style="' + grid2 + '">' +
              '<button type="button" class="btn btn-sm" id="' + P + 'reset">Reset to start</button>' +
              '<button type="button" class="btn btn-sm" id="' + P + 'story">Load the conflict story</button>' +
            '</div>' +
          '</div>' +
          '<div class="callout callout-indigo small" id="' + P + 'msg" role="status" aria-live="polite" style="min-height:3em"></div>' +
          '<div class="card stack-sm" id="' + P + 'conflict" hidden style="border:2px solid var(--bad);padding:14px">' +
            '<h2 class="lab-h" id="' + P + 'conflicth" tabindex="-1">Merge conflict in README.md</h2>' +
            '<p class="small" id="' + P + 'conflictwhy"></p>' +
            '<pre id="' + P + 'conflictpre" style="white-space:pre-wrap;overflow-wrap:anywhere;font-size:.84rem;padding:10px"></pre>' +
            '<p class="small muted" id="' + P + 'conflictkey"></p>' +
            '<div class="stack-sm">' +
              '<button type="button" class="btn btn-sm" data-keep="ours" id="' + P + 'keepours">Keep ours</button>' +
              '<button type="button" class="btn btn-sm" data-keep="theirs" id="' + P + 'keeptheirs">Keep theirs</button>' +
              '<button type="button" class="btn btn-sm" data-keep="both" id="' + P + 'keepboth">Keep both</button>' +
              '<button type="button" class="btn btn-sm btn-ghost" id="' + P + 'abort"><span class="mono">git merge --abort</span>&nbsp;(cancel)</button>' +
            '</div>' +
          '</div>' +
          '<div class="stack-sm"><h2 class="lab-h" id="' + P + 'termh">Terminal</h2>' +
            '<div class="console" id="' + P + 'term" role="log" aria-live="off" aria-labelledby="' + P + 'termh" tabindex="0" style="max-height:260px;font-size:.8rem"></div></div>' +
          '<div class="stack-sm"><h2 class="lab-h">Your tasks</h2><ul class="lab-tasks" id="' + P + 'tasks">' + tasksHtml + '</ul></div>' +
        '</div>' +
      '</div>' +
      '<div class="stack-sm" id="' + P + 'words" style="margin-top:8px"><h2 class="lab-h">Key words in plain English</h2>' +
        '<dl class="small" style="margin:0;display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(min(100%,220px),1fr))">' +
          word('Commit', 'A saved snapshot of all your files, plus a message saying what changed. Git keeps every one, so you can always look back.') +
          word('Branch', 'A name tag, like main or feature, that points at one commit. Making a branch copies nothing: it is just a new tag. When you commit, the tag of the branch you are on moves forward.') +
          word('HEAD', 'Git’s “you are here” arrow. It points at the branch you are on, and the files in your folder match that branch’s latest commit.') +
          word('Merge', 'Bringing the commits from another branch into the branch you are on.') +
          word('Fast-forward', 'The simple kind of merge: your branch has no new commits of its own, so Git just slides its tag forward. No new commit is made.') +
          word('Merge commit', 'A commit with two parents, made when both branches have new work. It joins two lines of history into one.') +
          word('Conflict', 'Both branches changed the same line of a file, so Git cannot choose for you. You pick the final text, then commit.') +
          word('Revert', 'Undo a commit by adding a new commit that does the opposite. Nothing is erased, so it is safe on a branch other people share.') +
        '</dl></div>' +
      '<p class="small muted" id="' + P + 'why"><strong style="color:var(--ink)">Why it matters in real ML:</strong> ML teams keep their code, settings and notebooks in Git, so they can see exactly which change made a model better or worse, try risky experiments on a branch while main keeps working, and undo mistakes with revert. GitHub, where you will share your projects, is built on exactly these commands.</p>';
    root.appendChild(top);

    function $(id) { return top.querySelector('#' + P + id); }
    var wrap = $('wrap'), svg = $('svg'), left = $('left'), filesPanel = $('files'), wordsEl = $('words'), whyEl = $('why');
    var elDetail = $('detail'), elMsg = $('msg'), termEl = $('term'), elKbdLive = $('kbdlive');
    var elSBranch = $('sbranch'), elSHead = $('shead'), elSCount = $('scount'), elSMerge = $('smerge'), elOnb = $('onb');
    var btnCommit = $('commit'), btnOops = $('oops'), elOopsHelp = $('oopshelp'), elNext = $('next');
    var bform = $('bform'), bname = $('bname');
    var selTarget = $('target'), btnSwitch = $('switch'), btnMerge = $('merge'), elSwitchTxt = $('switchtxt'), elMergeTxt = $('mergetxt');
    var btnRevert = $('revert'), elRevertTxt = $('reverttxt'), btnLog = $('log'), btnReset = $('reset'), btnStory = $('story');
    var boxConflict = $('conflict'), elConflictH = $('conflicth'), elConflictWhy = $('conflictwhy'), elConflictPre = $('conflictpre'), elConflictKey = $('conflictkey');
    var btnKeepOurs = $('keepours'), btnKeepTheirs = $('keeptheirs'), btnKeepBoth = $('keepboth'), btnAbort = $('abort');
    var elFilesHead = $('fileshead'), elFileList = $('filelist'), elReadme = $('readme');
    var taskEls = {};
    Array.prototype.forEach.call(top.querySelectorAll('[data-task]'), function (li) { taskEls[li.getAttribute('data-task')] = li; });

    var meas = null;
    try { meas = document.createElement('canvas').getContext('2d'); } catch (e) { meas = null; }
    function textW(text, font) {
      if (meas) { meas.font = font; return meas.measureText(text).width; }
      return text.length * 7.4;
    }

    /* ---------- state ---------- */
    var R = null;
    var ui = { target: '', sel: null, lastMerge: '—', scroll: true, scrollTo: null, boxW: 0 };
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
    function completeTask(id) {
      if (done[id]) return;
      done[id] = true;
      markLi(id);
      if (ctx && ctx.onTaskDone) ctx.onTaskDone(id);
    }

    function headCommit() { return R.commits[R.branches[R.head]]; }
    function workFiles() { return R.merging ? R.merging.files : headCommit().files; }
    function branchesAt(id) { return R.branchOrder.filter(function (n) { return R.branches[n] === id; }); }
    function peekItem() {
      return R.pool < POOL.length ? POOL[R.pool] : { msg: 'Add study notes, part ' + (R.pool - POOL.length + 1), path: 'notes_' + (R.pool - POOL.length + 1) + '.md', text: 'Notes from study session ' + (R.pool - POOL.length + 1) };
    }
    function takeItem() { var it = peekItem(); R.pool++; return it; }

    /* ---------- messages + terminal ---------- */
    function say(html, tone) {
      elMsg.innerHTML = html;
      elMsg.className = 'callout small' + (tone === 'warn' || tone === 'good' ? '' : ' callout-indigo');
      elMsg.style.borderLeftColor = tone === 'warn' ? 'var(--bad)' : tone === 'good' ? 'var(--ok)' : '';
      elMsg.style.background = tone === 'warn' ? 'var(--bad-soft, var(--surface-2))' : tone === 'good' ? 'var(--ok-soft, var(--surface-2))' : '';
    }
    function term(rows) {
      var frag = document.createDocumentFragment();
      rows.forEach(function (r) {
        var d = document.createElement('div');
        if (r[0] === 'cmd') { d.textContent = '$ ' + r[1]; d.style.fontWeight = '700'; d.style.marginTop = '4px'; }
        else { d.textContent = r[1]; if (r[0] !== 'out') d.className = r[0]; }
        frag.appendChild(d);
      });
      termEl.appendChild(frag);
      while (termEl.childNodes.length > TERM_MAX) termEl.removeChild(termEl.firstChild);
      termEl.scrollTop = termEl.scrollHeight;
    }
    function outRows(arr) { return arr.map(function (s) { return ['out', s]; }); }
    function logRows() {
      var rows = [];
      for (var i = R.order.length - 1; i >= 0; i--) {
        var c = R.commits[R.order[i]], names = branchesAt(c.id), refs = [];
        if (names.indexOf(R.head) >= 0) refs.push('HEAD -> ' + R.head);
        names.sort();
        for (var k = 0; k < names.length; k++) if (names[k] !== R.head) refs.push(names[k]);
        rows.push(['out', c.id + (refs.length ? ' (' + refs.join(', ') + ')' : '') + ' ' + c.msg]);
      }
      return rows;
    }
    function isFull() {
      if (R.order.length < MAX_COMMITS) return false;
      term([['info', '# Lab limit: ' + MAX_COMMITS + ' commits. Press Reset to start to begin again.']]);
      say('This lab holds up to ' + MAX_COMMITS + ' commits so the picture stays readable. Press <b>Reset to start</b> to begin again.', 'warn');
      return true;
    }
    function blockedByMerge(cmd, errLine, fatalLine, listUnmerged) {
      var rows = [['cmd', cmd]];
      // git commit first lists the files that still have conflicts ("U" = unmerged)
      if (listUnmerged) R.merging.conflicts.forEach(function (cf) { rows.push(['out', 'U\t' + cf.path]); });
      rows.push(['err', errLine]);
      if (fatalLine) rows.push(['err', fatalLine]);
      term(rows);
      say('<b>A merge is waiting for you.</b> Git will not do that until the conflict is fixed. Pick a version in the conflict box (or cancel the merge with <b>git merge --abort</b>).', 'warn');
      focusConflict();
    }

    /* ---------- commands ---------- */
    function doCommit(oops) {
      var h = headCommit();
      var msg = oops ? 'Oops: delete prices.csv' : peekItem().msg;
      if (R.merging) { blockedByMerge('git commit -m "' + msg + '"', 'error: Committing is not possible because you have unmerged files.', 'fatal: Exiting because of an unresolved conflict.', true); return; }
      if (isFull()) return;
      var files = Object.assign({}, h.files), rows = [];
      if (oops) {
        if (!('prices.csv' in files)) { say('prices.csv is already gone on <b>' + esc(R.head) + '</b>, so there is nothing to delete. Undo the Oops commit with <b>git revert HEAD</b> first.'); return; }
        delete files['prices.csv'];
        rows.push(['cmd', 'git rm prices.csv'], ['out', "rm 'prices.csv'"]);
      } else {
        var item = takeItem();
        files[item.path] = item.text;
        rows.push(['cmd', 'git add ' + item.path]);
      }
      rows.push(['cmd', 'git commit -m "' + msg + '"']);
      var stayed = branchesAt(h.id).filter(function (n) { return n !== R.head; });
      var c = addCommit(R, { parents: [h.id], msg: msg, files: files, kind: oops ? 'oops' : 'normal', branch: R.head });
      R.branches[R.head] = c.id;
      rows.push(['out', '[' + R.head + ' ' + c.id + '] ' + msg]);
      term(rows.concat(outRows(statLines(diffSnap(h.files, files), true))));
      var B = '<b>' + esc(R.head) + '</b>';
      var html;
      if (oops) {
        html = '<b>Oops!</b> Commit <b>' + c.id + '</b> deleted prices.csv, the project’s data (look at Files at HEAD). Do not try to erase history to fix it: press <b>git revert HEAD</b> to add a new commit that undoes this one.';
      } else {
        html = 'Saved commit <b>' + c.id + '</b> (“' + esc(msg) + '”) on ' + B + ': a new snapshot of all the files, with ' + h.id + ' as its parent. The ' + B + ' tag moved forward to it, and HEAD came along.';
      }
      if (stayed.length) {
        html += ' <b>' + esc(listWords(stayed)) + '</b> stayed on ' + h.id + ', because only the branch you are on moves.';
        if (R.head === 'main' && stayed.indexOf('feature') >= 0 && !done.t1) html += ' To work on feature, switch to it first.';
      }
      say(html, oops ? 'warn' : '');
      ui.sel = null; ui.scroll = true;
      renderAll();
    }

    function doBranch() {
      var name = bname.value.trim();
      if (!name) {
        var rows = [['cmd', 'git branch']];
        R.branchOrder.slice().sort().forEach(function (n) { rows.push(['out', (n === R.head ? '* ' : '  ') + n]); });
        term(rows);
        say('With no name, <b>git branch</b> just lists the branches. The * marks the one you are on. Type a name in the box to make a new one.');
        return;
      }
      var cmd = ['cmd', 'git branch ' + shellArg(name)];
      if (!gitNameOk(name)) {
        term([cmd, ['err', "fatal: '" + name + "' is not a valid branch name"]]);
        say('<b>Git refused that name.</b> Branch names cannot contain spaces or any of ~ ^ : ? * [ \\, and cannot start with - or a dot. Try something like <b>feature</b> or <b>new-plot</b>.', 'warn');
        return;
      }
      if (!/^[A-Za-z0-9._\/-]+$/.test(name) || name.length > MAX_NAME) {
        say('Real Git would accept that name, but this lab keeps names short and simple so they fit on the picture: up to ' + MAX_NAME + ' letters, numbers, - _ . or /.', 'warn');
        return;
      }
      if (name in R.branches) {
        term([cmd, ['err', "fatal: a branch named '" + name + "' already exists"]]);
        say('There is already a branch called <b>' + esc(name) + '</b>. Pick another name, or switch to it.', 'warn');
        return;
      }
      // Git stores branch names like folders, so "fix" and "fix/x" cannot both exist
      var clash = R.branchOrder.filter(function (b) { return name.indexOf(b + '/') === 0 || b.indexOf(name + '/') === 0; })[0];
      if (clash) {
        term([cmd, ['err', "fatal: cannot lock ref 'refs/heads/" + name + "': 'refs/heads/" + clash + "' exists; cannot create 'refs/heads/" + name + "'"]]);
        say('<b>Git refused that name.</b> Git saves branch names like folders, so <b>' + esc(clash) + '</b> and <b>' + esc(name) + '</b> cannot both exist (a name cannot be a file and a folder at once). Pick another name, such as <b>' + esc(name.replace(/\//g, '-')) + '</b>.', 'warn');
        return;
      }
      if (R.branchOrder.length >= MAX_BRANCHES) {
        say('This lab allows up to ' + MAX_BRANCHES + ' branches so the picture stays readable. Press <b>Reset to start</b> to begin again.', 'warn');
        return;
      }
      var at = R.branches[R.head];
      R.branches[name] = at;
      R.branchOrder.push(name);
      term([cmd]);
      bname.value = '';
      ui.target = name; ui.scroll = true;
      say('Created branch <b>' + esc(name) + '</b>: just a new tag on commit ' + at + ', the commit you are on. No files were copied. You are still on <b>' + esc(R.head) + '</b>, so press <b>git switch ' + esc(name) + '</b> to move onto it.');
      renderAll();
    }

    function doSwitch() {
      var name = ui.target;
      if (!name || !(name in R.branches)) return;
      var cmd = ['cmd', 'git switch ' + name];
      if (R.merging) {
        term([cmd, ['err', 'fatal: cannot switch branch while merging']]);
        say('<b>A merge is waiting for you.</b> Git will not switch branches in the middle of a merge. Pick a version in the conflict box, or cancel with <b>git merge --abort</b>.', 'warn');
        focusConflict();
        return;
      }
      var from = R.head, before = headCommit().files;
      R.head = name;
      ui.target = from;
      var after = headCommit().files, ch = diffSnap(before, after);
      term([cmd, ['out', "Switched to branch '" + name + "'"]]);
      var html = 'Switched to <b>' + esc(name) + '</b>: HEAD now points at it, and your folder matches its latest commit (' + R.branches[name] + '). ';
      if (ch.length) html += 'In your files, ' + esc(listWords(describeChanges(ch, ['appeared', 'disappeared', 'changed']))) + '.';
      else html += 'None of your files changed, because ' + esc(name) + ' and ' + esc(from) + ' hold the same snapshot.';
      say(html);
      ui.sel = null; ui.scroll = true;
      renderAll();
    }

    function doMerge() {
      var name = ui.target;
      if (!name || !(name in R.branches)) return;
      var cmd = ['cmd', 'git merge ' + name];
      if (R.merging) { blockedByMerge('git merge ' + name, 'error: Merging is not possible because you have unmerged files.', 'fatal: Exiting because of an unresolved conflict.'); return; }
      var cId = R.branches[R.head], tId = R.branches[name], cA = ancOf(R, cId), tA = ancOf(R, tId);
      var H = '<b>' + esc(R.head) + '</b>', N = '<b>' + esc(name) + '</b>';
      if (cA[tId]) {
        term([cmd, ['out', 'Already up to date.']]);
        ui.lastMerge = 'Up to date';
        say('Nothing to merge: every commit on ' + N + ' is already part of ' + H + '. Make a new commit on ' + N + ' first.');
        renderAll();
        return;
      }
      if (tA[cId]) {
        var newCount = 0;
        for (var id in tA) if (!cA[id]) newCount++;
        var ch = diffSnap(R.commits[cId].files, R.commits[tId].files);
        R.branches[R.head] = tId;
        term([cmd, ['out', 'Updating ' + cId + '..' + tId], ['out', 'Fast-forward']].concat(outRows(statLines(ch))));
        ui.lastMerge = 'Fast-forward';
        var html = '<b>Fast-forward!</b> ' + H + ' had no new commits of its own since ' + N + ' split off, so Git simply slid the ' + H + ' tag forward to ' + tId + ' (' + plural(newCount, 'new commit', 'new commits') + '). No merge commit was needed, and the history stays one straight line.';
        if (R.head === 'main' && name === 'feature') {
          if (newCount >= 2) completeTask('t1');
          else if (!done.t1) html += ' For the task, make 2 commits on feature before merging.';
        }
        say(html, 'good');
        ui.sel = null; ui.scroll = true;
        renderAll();
        return;
      }
      if (isFull()) return;
      var res = mergeFiles(baseFiles(R, cA, tA, 0), R.commits[cId].files, R.commits[tId].files, 'HEAD', name);
      var rows = [cmd].concat(res.auto.map(function (p) { return ['out', 'Auto-merging ' + p]; }));
      if (res.conflicts.length) {
        res.conflicts.forEach(function (cf) { rows.push(['err', 'CONFLICT (content): Merge conflict in ' + cf.path]); });
        rows.push(['err', 'Automatic merge failed; fix conflicts and then commit the result.']);
        term(rows);
        R.merging = { name: name, into: R.head, ours: cId, theirs: tId, files: res.files, conflicts: res.conflicts };
        ui.lastMerge = 'Conflict';
        say('<b>Conflict!</b> ' + H + ' and ' + N + ' both changed the same line of ' + esc(listWords(res.conflicts.map(function (c) { return c.path; }))) + ', so Git stopped and asks you to choose. Git merged everything else it could. Pick a version in the conflict box.', 'warn');
        ui.sel = null; ui.scroll = true;
        renderAll();
        focusConflict();
        return;
      }
      var mc = addCommit(R, { parents: [cId, tId], msg: mergeMsg(R.head, name), files: res.files, kind: 'merge', branch: R.head });
      R.branches[R.head] = mc.id;
      term(rows.concat([['out', "Merge made by the 'ort' strategy."]], outRows(statLines(diffSnap(R.commits[cId].files, res.files)))));
      ui.lastMerge = 'Merge commit';
      say('<b>Merge commit ' + mc.id + '.</b> Both branches had new work, so Git could not just slide the tag forward. It made a new commit with two parents (' + cId + ' from ' + H + ' and ' + tId + ' from ' + N + ') and combined the changes by itself, because the two branches did not touch the same lines.', 'good');
      completeTask('t2');
      ui.sel = null; ui.scroll = true;
      renderAll();
    }

    function resolve(choice) {
      var m = R.merging;
      if (!m) return;
      var files = Object.assign({}, m.files);
      m.conflicts.forEach(function (cf) { files[cf.path] = resolveSegs(cf.segs, choice); });
      var msg = mergeMsg(m.into, m.name);
      var mc = addCommit(R, { parents: [m.ours, m.theirs], msg: msg, files: files, kind: 'merge', branch: m.into });
      R.branches[m.into] = mc.id;
      R.merging = null;
      var what = choice === 'ours' ? 'our version (' + m.into + ')' : choice === 'theirs' ? 'their version (' + m.name + ')' : 'both versions';
      var paths = m.conflicts.map(function (c) { return c.path; });
      term([['info', '# You edited ' + paths.join(', ') + ' to keep ' + what + ' and deleted the markers.'], ['cmd', 'git add ' + paths.join(' ')], ['cmd', 'git commit -m "' + msg + '"'], ['out', '[' + m.into + ' ' + mc.id + '] ' + msg]]);
      ui.lastMerge = 'Merge commit';
      say('<b>Conflict fixed.</b> You kept ' + esc(what) + ', marked the file as fixed with <b>git add</b>, then committed. Merge commit ' + mc.id + ' has two parents (' + m.ours + ' and ' + m.theirs + '). Look at README.md under Files at HEAD.', 'good');
      completeTask('t3');
      ui.sel = null; ui.scroll = true;
      renderAll();
      try { btnMerge.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    }
    function abortMerge() {
      if (!R.merging) return;
      R.merging = null;
      term([['cmd', 'git merge --abort']]);
      ui.lastMerge = 'Cancelled';
      say('Merge cancelled with <b>git merge --abort</b>. Your files and branches are back to how they were before you ran git merge.');
      ui.scroll = true;
      renderAll();
      try { btnMerge.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    }

    function doRevert() {
      var h = headCommit(), isMerge = h.parents.length > 1;
      var cmdText = 'git revert ' + (isMerge ? '-m 1 ' : '') + 'HEAD';
      if (R.merging) { blockedByMerge(cmdText, 'error: Reverting is not possible because you have unmerged files.', 'fatal: revert failed'); return; }
      if (!h.parents.length) { term([['cmd', cmdText], ['err', 'error: cannot revert the very first commit here']]); return; }
      var p = R.commits[h.parents[0]], ch = diffSnap(h.files, p.files);
      if (!ch.length) {
        term([['cmd', cmdText], ['out', 'On branch ' + R.head], ['out', 'nothing to commit, working tree clean']]);
        say('Nothing to undo: commit ' + h.id + ' did not change any files compared with its parent ' + p.id + '.');
        return;
      }
      if (isFull()) return;
      var msg = revertMsg(h.msg);
      var c = addCommit(R, { parents: [h.id], msg: msg, files: p.files, kind: 'revert', branch: R.head });
      R.branches[R.head] = c.id;
      term([['cmd', cmdText], ['out', '[' + R.head + ' ' + c.id + '] ' + msg]].concat(outRows(statLines(ch, true))));
      var html = '<b>Reverted.</b> New commit <b>' + c.id + '</b> undoes ' + h.id + ': ' + esc(listWords(describeChanges(ch, ['is back', 'is gone again', 'is back to how it was']))) + '. ';
      if (isMerge) html += 'Because ' + h.id + ' is a merge, Git needs <b>-m 1</b> (“keep parent 1, the branch you were on”) to know which side to go back to. ';
      html += 'Commit ' + h.id + ' is still in the history, so nothing was erased: anyone who already has it can safely get this fix too.';
      say(html, 'good');
      if (h.kind === 'oops') completeTask('t4');
      ui.sel = null; ui.scroll = true;
      renderAll();
    }

    function doLog() {
      term([['cmd', 'git log --oneline --all']].concat(logRows()));
      say('That is <b>git log</b>: every commit as one line, newest first. The names in brackets show where each branch tag points; “HEAD -&gt; ' + esc(R.head) + '” means you are on ' + esc(R.head) + '.');
    }

    function loadStart(first) {
      R = newRepo();
      buildStart(R);
      ui.target = ''; ui.sel = null; ui.lastMerge = '—'; ui.scroll = true;
      termEl.textContent = '';
      term([['info', '# Chai Price Predictor: a project with 3 commits on main.'], ['cmd', 'git log --oneline']].concat(logRows()));
      if (first) say('You are on <b>main</b>, which has 3 commits. Start with the first task: type <b>feature</b> in the branch name box and press <b>git branch</b>.');
      else say('Back to the start: <b>main</b> has 3 commits and there are no other branches.');
      renderAll();
    }
    function loadStory() {
      R = newRepo();
      buildStart(R);
      var base = R.commits[R.branches.main];
      var mk = function (model) { var f = Object.assign({}, base.files); f['README.md'] = README_2.replace(MODEL_LINE, model); return f; };
      R.branches.feature = base.id;
      R.branchOrder.push('feature');
      var f = addCommit(R, { parents: [base.id], msg: 'Choose a decision tree', files: mk('Model: decision tree'), branch: 'feature' });
      R.branches.feature = f.id;
      var m = addCommit(R, { parents: [base.id], msg: 'Choose linear regression', files: mk('Model: linear regression'), branch: 'main' });
      R.branches.main = m.id;
      ui.target = 'feature'; ui.sel = null; ui.lastMerge = '—'; ui.scroll = true;
      termEl.textContent = '';
      var st = outRows(statLines(diffSnap(base.files, f.files), true));
      term([['info', '# Conflict story: Ravi and Asha both edit the Model line of README.md.'],
        ['cmd', 'git branch feature'], ['cmd', 'git switch feature'], ['out', "Switched to branch 'feature'"],
        ['cmd', 'git commit -am "Choose a decision tree"'], ['out', '[feature ' + f.id + '] Choose a decision tree']].concat(st,
        [['cmd', 'git switch main'], ['out', "Switched to branch 'main'"],
          ['cmd', 'git commit -am "Choose linear regression"'], ['out', '[main ' + m.id + '] Choose linear regression']], st));
      say('<b>Conflict story loaded.</b> On <b>feature</b>, Ravi changed the Model line of README.md to “decision tree”. On <b>main</b>, Asha changed the same line to “linear regression”. You are on main: press <b>git merge feature</b> and see what Git does.');
      renderAll();
    }

    /* ---------- rendering: controls, stats, files ---------- */
    var lastOpts = '';
    function renderControls() {
      var others = R.branchOrder.filter(function (n) { return n !== R.head; });
      if (others.indexOf(ui.target) < 0) ui.target = others.length ? others[others.length - 1] : '';
      var key = others.join('\n') + '|' + ui.target;
      if (key !== lastOpts) {
        lastOpts = key;
        selTarget.innerHTML = others.length ? others.map(function (n) { return '<option value="' + esc(n) + '"' + (n === ui.target ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('') : '<option value="">(no other branch yet)</option>';
        selTarget.value = ui.target;
      }
      selTarget.disabled = !others.length;
      btnSwitch.disabled = btnMerge.disabled = !others.length;
      elSwitchTxt.textContent = 'git switch ' + (ui.target || '…');
      elMergeTxt.textContent = 'git merge ' + (ui.target || '…');
      var h = headCommit();
      elRevertTxt.textContent = h.parents.length > 1 ? 'git revert -m 1 HEAD' : 'git revert HEAD';
      var noPrices = !R.merging && !('prices.csv' in h.files);
      btnOops.disabled = noPrices;
      elOopsHelp.hidden = !noPrices;
      var it = peekItem();
      elNext.textContent = 'Next commit adds ' + it.path + ' (“' + it.msg + '”).';
      elOnb.textContent = R.head;
    }
    function renderStats() {
      elSBranch.textContent = R.head;
      elSHead.textContent = R.branches[R.head];
      elSCount.textContent = String(R.order.length);
      elSMerge.textContent = ui.lastMerge;
    }
    function renderFiles() {
      var files = workFiles();
      elFilesHead.textContent = R.merging
        ? 'Merge in progress on ' + R.head + ': Git has written both versions into README.md, between conflict markers.'
        : 'What is in your project folder now: branch ' + R.head + ', commit ' + R.branches[R.head] + '.';
      var paths = Object.keys(files).sort(function (a, b) { return a === 'README.md' ? -1 : b === 'README.md' ? 1 : a < b ? -1 : a > b ? 1 : 0; });
      elFileList.innerHTML = paths.map(function (p) {
        var ls = lines(files[p]), first = p === 'README.md' ? plural(ls.length, 'line', 'lines') + ', shown below' : ls[0] + (ls.length > 1 ? ' (+' + plural(ls.length - 1, 'more line', 'more lines') + ')' : '');
        return '<li><code>' + esc(p) + '</code> <span class="muted">' + esc(first) + '</span></li>';
      }).join('') || '<li class="muted">(no files)</li>';
      elReadme.textContent = files['README.md'] !== undefined ? files['README.md'] : '(README.md does not exist here)';
    }
    function renderDetail() {
      if (ui.sel && !(ui.sel in R.commits)) ui.sel = null;
      var c = R.commits[ui.sel || R.branches[R.head]];
      var p0 = c.parents.length ? R.commits[c.parents[0]] : null;
      var ch = diffSnap(p0 ? p0.files : {}, c.files);
      var html = '<b>' + (ui.sel ? 'Commit ' : 'HEAD commit ') + c.id + ':</b> “' + esc(c.msg) + '”. ';
      if (!c.parents.length) html += 'The very first commit, so it has no parent. ';
      else if (c.parents.length === 1) html += 'Parent: ' + c.parents[0] + '. ';
      else html += 'Merge commit with two parents: ' + c.parents[0] + ' (first parent, the branch it was made on) and ' + c.parents[1] + ' (the branch merged in). ';
      html += 'Made on ' + esc(c.branch) + '. ';
      html += ch.length ? 'Changes' + (c.parents.length > 1 ? ' compared with its first parent' : '') + ': ' + esc(listWords(describeChanges(ch, ['added', 'deleted', 'edited']))) + '.' : 'No file changes.';
      elDetail.innerHTML = html;
    }
    function focusConflict() {
      if (!R.merging || boxConflict.hidden) return;
      try { elConflictH.focus(); } catch (e) { /* ignore */ }
    }
    function renderConflict() {
      var m = R.merging;
      boxConflict.hidden = !m;
      if (!m) return;
      var paths = m.conflicts.map(function (c) { return c.path; });
      elConflictH.textContent = 'Merge conflict in ' + paths.join(', ');
      elConflictWhy.textContent = 'Both branches changed the same line, so Git wrote both versions into the file, between markers, and stopped. Here is the file right now:';
      elConflictPre.textContent = '';
      var frag = document.createDocumentFragment();
      function line(text, kind) {
        var s = document.createElement('span');
        s.style.display = 'block';
        s.textContent = text === '' ? ' ' : text;
        if (kind === 'mark') s.style.fontWeight = '700';
        if (kind === 'ours' || kind === 'theirs') {
          s.style.borderLeft = '4px solid ' + (kind === 'ours' ? 'var(--indigo)' : 'var(--sindoor)');
          s.style.paddingLeft = '6px';
          s.style.background = 'var(--surface)';
        }
        frag.appendChild(s);
      }
      m.conflicts.forEach(function (cf, k) {
        if (m.conflicts.length > 1) line('--- ' + cf.path + ' ---', 'mark');
        cf.segs.forEach(function (sg) {
          if (sg.ok) { sg.ok.forEach(function (l) { line(l, ''); }); return; }
          line('<<<<<<< HEAD', 'mark');
          sg.ours.forEach(function (l) { line(l, 'ours'); });
          line('=======', 'mark');
          sg.theirs.forEach(function (l) { line(l, 'theirs'); });
          line('>>>>>>> ' + m.name, 'mark');
        });
        if (k < m.conflicts.length - 1) line('', '');
      });
      elConflictPre.appendChild(frag);
      elConflictKey.innerHTML = '<b style="color:var(--ink)">&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD</b> starts <em>ours</em>: the version on ' + esc(m.into) + ', the branch you are on (blue bar). ' +
        '<b style="color:var(--ink)">=======</b> separates the two. <b style="color:var(--ink)">&gt;&gt;&gt;&gt;&gt;&gt;&gt; ' + esc(m.name) + '</b> ends <em>theirs</em>: the version from ' + esc(m.name) + ' (red bar). Choose what the file should say:';
      var o = m.conflicts[0].segs.filter(function (s) { return !s.ok; })[0];
      var short = function (arr) { var t = arr.join(' / '); return t.length > 34 ? t.slice(0, 33) + '…' : t; };
      btnKeepOurs.textContent = 'Keep ours (' + m.into + '): ' + short(o.ours);
      btnKeepTheirs.textContent = 'Keep theirs (' + m.name + '): ' + short(o.theirs);
      btnKeepBoth.textContent = 'Keep both lines';
    }

    /* ---------- rendering: the commit graph (SVG) ---------- */
    function el(name, attrs, parent) {
      var e = document.createElementNS(SVGNS, name);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(e);
      return e;
    }
    function fitText(text, maxW, font) {
      if (textW(text, font) <= maxW) return text;
      var lo = 0, hi = text.length;
      while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (textW(text.slice(0, mid) + '…', font) <= maxW) lo = mid; else hi = mid - 1; }
      return text.slice(0, lo).replace(/\s+$/, '') + '…';
    }
    function renderGraph() {
      if (destroyed) return;
      var T = readTheme();
      var pillFont = '600 12px ' + T.body, headFont = '700 12px ' + T.body;
      var n = R.order.length, ghost = !!R.merging;
      var headLane = R.head in R.laneOf ? R.laneOf[R.head] : R.lanes.length;
      var nLanes = Math.max(R.lanes.length, ghost ? headLane + 1 : 1);
      var laneColor = function (l) { return T[LANE_VARS[l % LANE_VARS.length]] || T['--indigo']; };

      // tag stacks above each branch tip: other branches nearest the circle, the current branch on top, HEAD above it
      var stacks = dict();
      R.branchOrder.forEach(function (name) { var id = R.branches[name]; (stacks[id] = stacks[id] || []).push(name); });
      var info = dict(), laneNeed = [], perLane = [];
      var head = R.head;
      var notHead = function (x) { return x !== head; };
      for (var sid in stacks) {
        var names = stacks[sid].filter(notHead);
        var hasHead = stacks[sid].indexOf(head) >= 0;
        if (hasHead) names.push(head);
        var widths = names.map(function (x) { return Math.ceil(textW(x, pillFont)) + 18; });
        var headW = Math.ceil(textW('HEAD', headFont)) + 18;
        var w = Math.max.apply(null, widths.concat(hasHead ? [headW] : [0]));
        var h = names.length * PILL_H + (names.length - 1) * PILL_GAP + (hasHead ? HEAD_GAP + PILL_H : 0);
        var c0 = R.commits[sid], tipLane = R.laneOf[c0.branch];
        info[sid] = { names: names, widths: widths, hasHead: hasHead, headW: headW, w: w, h: h };
        laneNeed[tipLane] = Math.max(laneNeed[tipLane] || 0, h);
        (perLane[tipLane] = perLane[tipLane] || []).push({ seq: c0.seq, w: w });
      }
      // column spacing: wide enough that neighbouring tag stacks on one row never overlap
      var dx = DX_MIN;
      perLane.forEach(function (arr) {
        if (!arr) return;
        arr.sort(function (a, b) { return a.seq - b.seq; });
        for (var i = 1; i < arr.length; i++) dx = Math.max(dx, ((arr[i - 1].w + arr[i].w) / 2 + 10) / (arr[i].seq - arr[i - 1].seq));
      });
      dx = Math.min(Math.ceil(dx), DX_MAX);
      var cols = n + (ghost ? 1 : 0);
      var firstInfo = info[R.order[0]], lastInfo = info[R.order[n - 1]];
      var ghostLabel = 'merge waiting', ghostLabelW = ghost ? Math.ceil(textW(ghostLabel, '400 11px ' + T.body)) : 0;
      var tagPadL = Math.max(PAD_X, firstInfo ? firstInfo.w / 2 + 8 : 0);
      var tagPadR = Math.max(PAD_X, !ghost && lastInfo ? lastInfo.w / 2 + 8 : 0, ghost ? RC + 6 + ghostLabelW + 10 : 0);
      var boxW = Math.max(1, Math.round(wrap.clientWidth));
      ui.boxW = boxW;
      // a short history gets roomier columns so it fills its box and has space for the messages under the circles
      var dxNeed = dx, padL = tagPadL, padR = tagPadR, showMsg = false;
      if (cols > 1) dx = Math.max(dxNeed, Math.min(DX_FILL, Math.floor((boxW - tagPadL - tagPadR) / (cols - 1))));
      for (var pass = 0; pass < 4; pass++) {
        showMsg = dx >= LABEL_MIN_DX;
        padL = Math.max(tagPadL, showMsg ? dx / 2 : 0);
        padR = Math.max(tagPadR, showMsg && !ghost ? dx / 2 : 0);
        if (cols < 2 || padL + (cols - 1) * dx + padR <= boxW || dx <= dxNeed) break;
        dx = Math.max(dxNeed, Math.floor((boxW - padL - padR) / (cols - 1)));
      }

      var laneY = [];
      for (var l = 0; l < nLanes; l++) {
        var topSpace = laneNeed[l] ? laneNeed[l] + STACK_GAP : 6;
        laneY[l] = (l === 0 ? PAD_T : laneY[l - 1] + RC + LANE_GAP) + topSpace + RC;
      }
      var contentH = laneY[nLanes - 1] + RC + (showMsg ? 24 : 6) + PAD_B;
      var contentW = Math.ceil(padL + (cols - 1) * dx + padR);
      var offX = contentW < boxW ? Math.floor((boxW - contentW) / 2) : 0;
      var W = Math.max(contentW, boxW), Hh = Math.max(contentH, MIN_H), offY = Math.floor((Hh - contentH) / 2);
      function X(seq) { return offX + padL + seq * dx; }
      function Y(lane) { return offY + laneY[lane]; }
      function laneOfC(c) { return R.laneOf[c.branch]; }

      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.setAttribute('width', W);
      svg.setAttribute('height', Hh);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + Hh);
      svg.style.width = W + 'px';
      svg.style.height = Hh + 'px';
      svg.setAttribute('font-family', T.body);

      // which (seq, lane) spots hold a commit, to route lines around them
      var occupied = dict();
      R.order.forEach(function (id) { var c = R.commits[id]; occupied[c.seq + ':' + laneOfC(c)] = true; });
      if (ghost) occupied[n + ':' + headLane] = true;
      function clearRun(lane, s0, s1) {
        for (var s = s0; s <= s1; s++) if (occupied[s + ':' + lane]) return false;
        return true;
      }
      function edge(p, cSeq, cLane, firstParent, g, stroke, dash) {
        var pl = laneOfC(p), x1 = X(p.seq), y1 = Y(pl), x2 = X(cSeq), y2 = Y(cLane), d, color;
        var half = dx / 2;
        if (pl === cLane) { d = 'M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2; color = laneColor(cLane); }
        else if (cSeq - p.seq === 1) { d = 'M' + x1 + ' ' + y1 + 'C' + (x1 + half) + ' ' + y1 + ' ' + (x2 - half) + ' ' + y2 + ' ' + x2 + ' ' + y2; color = laneColor(firstParent ? cLane : pl); }
        else {
          // a branch-off line bends right after its parent and runs along the child's row; a merge-in line runs along
          // its own row and bends just before the merge commit. If that row has other commits in the way, try the other
          // shape, and if both are blocked, draw one smooth S-curve straight across.
          var earlyOk = clearRun(cLane, p.seq + 1, cSeq - 1), lateOk = clearRun(pl, p.seq + 1, cSeq - 1);
          var route = firstParent ? (earlyOk ? 'early' : lateOk ? 'late' : 's') : (lateOk ? 'late' : earlyOk ? 'early' : 's');
          if (route !== 's') {
            if (route === 'early') {
              d = 'M' + x1 + ' ' + y1 + 'C' + (x1 + half) + ' ' + y1 + ' ' + (x1 + half) + ' ' + y2 + ' ' + (x1 + dx) + ' ' + y2 + 'L' + x2 + ' ' + y2;
              color = laneColor(cLane);
            } else {
              d = 'M' + x1 + ' ' + y1 + 'L' + (x2 - dx) + ' ' + y1 + 'C' + (x2 - half) + ' ' + y1 + ' ' + (x2 - half) + ' ' + y2 + ' ' + x2 + ' ' + y2;
              color = laneColor(pl);
            }
          } else {
            var mx = (x1 + x2) / 2;
            d = 'M' + x1 + ' ' + y1 + 'C' + mx + ' ' + y1 + ' ' + mx + ' ' + y2 + ' ' + x2 + ' ' + y2;
            color = laneColor(firstParent ? cLane : pl);
          }
        }
        var a = { d: d, fill: 'none', stroke: stroke || color, 'stroke-width': 3, 'stroke-linecap': 'round' };
        if (dash) a['stroke-dasharray'] = '5 5';
        el('path', a, g);
      }

      var gEdges = el('g', {}, svg);
      R.order.forEach(function (id) {
        var c = R.commits[id];
        c.parents.forEach(function (pid, k) { edge(R.commits[pid], c.seq, laneOfC(c), k === 0, gEdges); });
      });
      if (ghost) {
        edge(R.commits[R.merging.ours], n, headLane, true, gEdges, T['--muted'], true);
        edge(R.commits[R.merging.theirs], n, headLane, false, gEdges, T['--muted'], true);
      }

      var headId = R.branches[R.head];
      var gNodes = el('g', {}, svg);
      R.order.forEach(function (id) {
        var c = R.commits[id], lane = laneOfC(c), x = X(c.seq), y = Y(lane), col = laneColor(lane);
        var g = el('g', { 'data-id': id, style: 'cursor:pointer' }, gNodes);
        el('title', {}, g).textContent = id + ': ' + c.msg;
        el('circle', { cx: x, cy: y, r: RC + 9, fill: 'transparent' }, g);
        if (ui.sel === id) el('circle', { cx: x, cy: y, r: RC + (c.parents.length > 1 ? 7.5 : 5), fill: 'none', stroke: T['--ink'], 'stroke-width': 1.5, 'stroke-dasharray': '3 2.5' }, g);
        if (c.parents.length > 1) el('circle', { cx: x, cy: y, r: RC + 4, fill: T['--surface'], stroke: col, 'stroke-width': 1.5 }, g);
        el('circle', { cx: x, cy: y, r: RC, fill: id === headId ? T['--indigo-soft'] : T['--surface'], stroke: col, 'stroke-width': 3 }, g);
        var t = el('text', { x: x, y: y, dy: '0.35em', 'text-anchor': 'middle', 'font-family': T.mono, 'font-size': 11, 'font-weight': 600, fill: T['--ink'] }, g);
        t.textContent = id;
        if (showMsg) {
          // the message under the circle, cut to fit its column; a halo in the background colour keeps it readable over lines
          var lt = el('text', { x: x, y: y + RC + (c.parents.length > 1 ? 21 : 18), 'text-anchor': 'middle', 'font-size': 10.5, fill: T['--muted'], stroke: T['--surface'], 'stroke-width': 3, 'stroke-linejoin': 'round', 'paint-order': 'stroke' }, g);
          lt.textContent = fitText(c.msg, dx - 12, '400 10.5px ' + T.body);
        }
      });
      if (ghost) {
        var gx = X(n), gy = Y(headLane);
        el('circle', { cx: gx, cy: gy, r: RC, fill: T['--surface'], stroke: T['--muted'], 'stroke-width': 2, 'stroke-dasharray': '4 3' }, gNodes);
        el('text', { x: gx, y: gy, dy: '0.35em', 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: T['--ink'] }, gNodes).textContent = '?';
        el('text', { x: gx + RC + 6, y: gy, dy: '0.35em', 'font-size': 11, fill: T['--ink'], stroke: T['--surface'], 'stroke-width': 3, 'stroke-linejoin': 'round', 'paint-order': 'stroke' }, gNodes).textContent = ghostLabel;
      }

      // branch tags
      var gTags = el('g', {}, svg);
      for (var tid in info) {
        var I = info[tid], tc = R.commits[tid], tx = X(tc.seq), ty = Y(laneOfC(tc)) - RC - (tc.parents.length > 1 ? 4 : 0) - STACK_GAP;
        var yb = ty;  // bottom of the next pill
        for (var k = 0; k < I.names.length; k++) {
          var nm = I.names[k], pw = I.widths[k], isCur = nm === R.head;
          var px = clamp(tx - pw / 2, 2, W - pw - 2), py = yb - PILL_H;
          var bl = nm in R.laneOf ? R.laneOf[nm] : laneOfC(tc);
          el('rect', { x: px, y: py, width: pw, height: PILL_H, rx: PILL_H / 2, fill: isCur ? T['--indigo'] : T['--surface'], stroke: isCur ? T['--indigo'] : laneColor(bl), 'stroke-width': 1.5 }, gTags);
          el('text', { x: px + pw / 2, y: py + PILL_H / 2, dy: '0.35em', 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 600, fill: isCur ? T['--on-indigo'] : T['--ink'] }, gTags).textContent = nm;
          yb = py - PILL_GAP;
        }
        if (I.hasHead) {
          var hw = I.headW, hx = clamp(tx - hw / 2, 2, W - hw - 2), curTop = yb + PILL_GAP, hy = curTop - HEAD_GAP - PILL_H;
          el('rect', { x: hx, y: hy, width: hw, height: PILL_H, rx: 4, fill: T['--haldi-soft'], stroke: T['--haldi'], 'stroke-width': 1.5 }, gTags);
          el('text', { x: hx + hw / 2, y: hy + PILL_H / 2, dy: '0.35em', 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: T['--ink'] }, gTags).textContent = 'HEAD';
          var ax = hx + hw / 2;
          el('path', { d: 'M' + ax + ' ' + (hy + PILL_H) + 'L' + ax + ' ' + (curTop - 4), stroke: T['--ink'], 'stroke-width': 1.5 }, gTags);
          el('path', { d: 'M' + (ax - 4) + ' ' + (curTop - 5) + 'L' + (ax + 4) + ' ' + (curTop - 5) + 'L' + ax + ' ' + (curTop - 1) + 'Z', fill: T['--ink'] }, gTags);
        }
      }

      // time direction
      var ay = Hh - 9;
      el('text', { x: 8, y: ay, 'font-size': 11, fill: T['--muted'] }, svg).textContent = '← older';
      el('text', { x: W - 8, y: ay, 'font-size': 11, fill: T['--muted'], 'text-anchor': 'end' }, svg).textContent = 'newer →';

      // a text version of the picture for screen readers
      var tips = R.branchOrder.map(function (b) { return b + ' at ' + R.branches[b] + (b === R.head ? ' (HEAD, you are here)' : ''); });
      var newest = R.commits[R.order[n - 1]];
      var label = 'Commit graph: ' + plural(n, 'commit', 'commits') + ' and ' + plural(R.branchOrder.length, 'branch', 'branches') + '. Branch tags: ' + tips.join('; ') + '. Newest commit ' + newest.id + ': ' + newest.msg + '.';
      if (ghost) label += ' A merge of ' + R.merging.name + ' into ' + R.head + ' is waiting for a conflict to be fixed.';
      svg.setAttribute('aria-label', label);

      if (ui.scroll) {
        ui.scroll = false;
        var focusId = ui.scrollTo && ui.scrollTo in R.commits ? ui.scrollTo : null;
        ui.scrollTo = null;
        var focusX = focusId ? X(R.commits[focusId].seq) : ghost ? X(n) : X(R.commits[headId].seq);
        var vw = wrap.clientWidth;
        if (W > vw && (focusX + 60 > wrap.scrollLeft + vw || focusX - 60 < wrap.scrollLeft)) wrap.scrollLeft = clamp(focusX - vw * 0.65, 0, W - vw);
      }
    }

    function renderAll() {
      if (destroyed) return;
      renderControls();
      renderStats();
      renderFiles();
      renderDetail();
      renderConflict();
      renderGraph();
    }

    /* ---------- layout: side by side, the files and key words sit under the graph; on narrow screens they move
       below the commands, so the buttons come right after the graph ---------- */
    var mqNarrow = window.matchMedia ? window.matchMedia('(max-width: 820px)') : null;
    var placedNarrow = null;
    function placeFiles() {
      if (destroyed) return;
      var narrow = !!(mqNarrow && mqNarrow.matches);
      if (narrow === placedNarrow) return;
      placedNarrow = narrow;
      if (narrow) { top.insertBefore(wordsEl, whyEl); top.insertBefore(filesPanel, wordsEl); }
      else { left.appendChild(filesPanel); left.appendChild(wordsEl); }
    }

    /* ---------- events ---------- */
    on(btnCommit, 'click', function () { doCommit(false); });
    on(btnOops, 'click', function () { doCommit(true); });
    on(bform, 'submit', function (e) { e.preventDefault(); doBranch(); });
    on(selTarget, 'change', function () { ui.target = selTarget.value; renderControls(); });
    on(btnSwitch, 'click', doSwitch);
    on(btnMerge, 'click', doMerge);
    on(btnRevert, 'click', doRevert);
    on(btnLog, 'click', doLog);
    on(btnReset, 'click', function () { loadStart(false); });
    on(btnStory, 'click', loadStory);
    on(btnKeepOurs, 'click', function () { resolve('ours'); });
    on(btnKeepTheirs, 'click', function () { resolve('theirs'); });
    on(btnKeepBoth, 'click', function () { resolve('both'); });
    on(btnAbort, 'click', abortMerge);
    on(svg, 'click', function (e) {
      var g = e.target && e.target.closest ? e.target.closest('[data-id]') : null;
      var id = g ? g.getAttribute('data-id') : null;
      ui.sel = id && id !== ui.sel ? id : null;
      renderDetail();
      renderGraph();
    });
    // keyboard: step through the commits in time order (the graph box is focusable)
    on(wrap, 'keydown', function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || !R) return;
      var ids = R.order, i = ids.indexOf(ui.sel || R.branches[R.head]), j;
      if (e.key === 'ArrowLeft') j = i - 1;
      else if (e.key === 'ArrowRight') j = i + 1;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = ids.length - 1;
      else if (e.key === 'Escape') { if (!ui.sel) return; j = null; }
      else return;
      e.preventDefault();
      ui.sel = j === null ? null : ids[clamp(j, 0, ids.length - 1)];
      ui.scroll = true; ui.scrollTo = ui.sel || R.branches[R.head];
      renderDetail();
      renderGraph();
      elKbdLive.textContent = elDetail.textContent;
    });

    function onTheme() { renderGraph(); }
    var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    function mqOn(m, fn) { if (m) { if (m.addEventListener) m.addEventListener('change', fn); else if (m.addListener) m.addListener(fn); } }
    function mqOff(m, fn) { if (m) { if (m.removeEventListener) m.removeEventListener('change', fn); else if (m.removeListener) m.removeListener(fn); } }
    mqOn(mql, onTheme);
    mqOn(mqNarrow, placeFiles);
    on(document, 'themechange', onTheme);
    var ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () {
        // the graph centres itself in its box, so redraw when the box width changes (only then: no loops)
        if (!destroyed && R && Math.round(wrap.clientWidth) !== ui.boxW) { ui.scroll = true; renderGraph(); }
      });
      ro.observe(wrap);
    } else on(window, 'resize', function () { if (R) renderGraph(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!destroyed && R) renderGraph(); });

    /* ---------- start ---------- */
    placeFiles();
    loadStart(true);

    return {
      destroy: function () {
        if (destroyed) return;
        destroyed = true;
        if (ro) ro.disconnect();
        mqOff(mql, onTheme);
        mqOff(mqNarrow, placeFiles);
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
        listeners = [];
        // remove only this lab's own element, so a newer lab mounted into the same root is never wiped
        if (top.parentNode) top.parentNode.removeChild(top);
      }
    };
  }

  Labs.git = {
    id: 'git',
    module: 'l1-tools',
    title: 'Git branching',
    summary: 'Run real Git commands as buttons and watch commits, branches and HEAD move on a live graph, from fast-forward merges to merge commits, a README conflict you resolve yourself, and a safe undo with revert.',
    tasks: TASKS,
    mount: mount
  };
})();
