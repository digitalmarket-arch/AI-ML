/* AI Marg in-browser Python: Pyodide in a Web Worker (created from a Blob so it also works from file://).
   Exposes window.AIM_RUNNER = { run(code, {tests, packages, onStdout}) -> Promise<result>, stop(), status } */
(function () {
  'use strict';
  var PYODIDE_VERSION = '0.29.5';
  var BASE = 'https://cdn.jsdelivr.net/pyodide/v' + PYODIDE_VERSION + '/full/';

  var HARNESS = [
    'import json, traceback, sys',
    '_AIM_HELPERS = """',
    'def check(name, fn, hint=""):',
    '    try:',
    '        ok = bool(fn())',
    '        err = None',
    '    except Exception as e:',
    '        ok = False',
    '        err = type(e).__name__ + ": " + str(e)',
    '    _results.append({"name": name, "ok": ok, "hint": hint, "error": err})',
    '',
    'def _aim_items(x):',
    '    if hasattr(x, "tolist") and not isinstance(x, (str, bytes)):',
    '        x = x.tolist()',
    '    return list(x) if isinstance(x, (list, tuple, range)) else None',
    '',
    'def _aim_close(a, b, tol):',
    '    # plain Python, so lists and tuples compare the same way whether or not NumPy is loaded',
    '    xa, xb = _aim_items(a), _aim_items(b)',
    '    if xa is None and xb is None:',
    '        fa, fb = float(a), float(b)',
    '        return fa == fb or abs(fa - fb) <= tol',
    '    if xa is None: xa = [a]',
    '    if xb is None: xb = [b]',
    '    if len(xa) == 1 and len(xb) != 1: xa = xa * len(xb)',
    '    if len(xb) == 1 and len(xa) != 1: xb = xb * len(xa)',
    '    if len(xa) != len(xb):',
    '        raise ValueError("your answer has %d values, but %d were expected" % (len(xa), len(xb)))',
    '    return all(_aim_close(p, q, tol) for p, q in zip(xa, xb))',
    '',
    'def close(a, b, tol=1e-6):',
    '    if a is None:',
    '        raise TypeError("your function returned None. Did you forget to write return?")',
    '    try:',
    '        import numpy as _np',
    '        return bool(_np.allclose(_np.asarray(a, dtype=float), _np.asarray(b, dtype=float), atol=tol, rtol=0))',
    '    except Exception:',
    '        return _aim_close(a, b, tol)',
    '"""',
    'def _aim_input(prompt=""):',
    '    print(prompt, end="")',
    '    raise RuntimeError("input() cannot ask you for text in this browser editor. Put the value in your code instead, for example: name = \'Asha\'")',
    'def _aim_run(code, tests):',
    '    ns = {"__name__": "__main__", "_results": [], "input": _aim_input}',
    '    user_error = None',
    '    try:',
    '        exec(compile(code, "<your code>", "exec"), ns)',
    '    except BaseException as e:',
    '        tb = traceback.extract_tb(e.__traceback__)',
    '        line = None',
    '        for fr in tb:',
    '            if fr.filename == "<your code>":',
    '                line = fr.lineno',
    '        if isinstance(e, SyntaxError):',
    '            line = e.lineno',
    '        user_error = {"type": type(e).__name__, "message": str(e), "line": line}',
    '    if tests:',
    '        exec(_AIM_HELPERS, ns)',
    '        try:',
    '            exec(compile(tests, "<tests>", "exec"), ns)',
    '        except BaseException as e:',
    '            ns["_results"].append({"name": "Tests could not run", "ok": False, "hint": "", "error": type(e).__name__ + ": " + str(e)})',
    '    try:',
    '        sys.stdout.flush(); sys.stderr.flush()',
    '    except Exception:',
    '        pass',
    '    return json.dumps({"results": ns["_results"], "error": user_error})'
  ].join('\n');

  var WORKER_SRC = [
    'var BASE = ' + JSON.stringify(BASE) + ';',
    'var HARNESS = ' + JSON.stringify(HARNESS) + ';',
    'var py = null;',
    'var LIMIT = 200000, outBuf = "", outTotal = 0, outLast = 0, outId = 0, cut = false;',
    'function flushOut() { if (outBuf) self.postMessage({ id: outId, type: "stdout", text: outBuf }); outBuf = ""; outLast = Date.now(); }',
    'function pushOut(s) {',
    '  if (cut) return;',
    '  if (outTotal + s.length > LIMIT) {',
    // one print() arrives as one piece, however big: keep only what fits under the limit
    '    var keep = Math.max(0, LIMIT - outTotal);',
    '    if (keep && /[\\ud800-\\udbff]/.test(s.charAt(keep - 1))) keep--;',
    '    outBuf += s.slice(0, keep) + "\\n... output cut off (too much printing). If your code is stuck in a loop, press Stop.\\n";',
    '    outTotal = LIMIT + 1; cut = true; flushOut(); return;',
    '  }',
    '  outTotal += s.length; outBuf += s;',
    '  if (outBuf.length > 8192 || Date.now() - outLast > 100) flushOut();',
    '}',
    // a fresh decoder for every run; bytes past the limit are not even decoded
    'function writer() { var dec = new TextDecoder(); return function (b) { if (!cut) { var room = (LIMIT - outTotal) * 3 + 4; pushOut(dec.decode(b.length > room ? b.subarray(0, room) : b, { stream: true })); } return b.length; }; }',
    'var PKG_NAMES = { numpy: "NumPy", pandas: "pandas", "scikit-learn": "scikit-learn", scipy: "SciPy", matplotlib: "Matplotlib", sqlite3: "sqlite3" };',
    // packages the exercise lists, then any the code imports; a download that fails is reported as one
    'async function getPackages(id, names, code) {',
    '  var failed = [];',
    '  var opts = { messageCallback: function () {}, errorCallback: function (msg) { var f = /error occurred while loading ([^\\s:]+)/.exec(String(msg)); if (f && failed.indexOf(f[1]) < 0) failed.push(f[1]); } };',
    '  var need = names.filter(function (p) { return !py.loadedPackages[p]; });',
    '  if (need.length) {',
    '    self.postMessage({ id: id, type: "status", text: "Loading " + need.join(", ") + "…" });',
    '    await py.loadPackage(need, opts);',
    '    need.forEach(function (p) { if (!py.loadedPackages[p] && failed.indexOf(p) < 0) failed.push(p); });',
    '  }',
    '  if (!failed.length) { try { await py.loadPackagesFromImports(code, opts); } catch (e2) {} }',
    '  if (failed.length) {',
    '    var list = failed.map(function (p) { return PKG_NAMES[p] || p; }).join(", ");',
    '    throw new Error("Could not download " + list + ", which this code needs, so it did not run. Check your internet connection, then press Run or Check again. (Python libraries load from cdn.jsdelivr.net, which some office networks block.)");',
    '  }',
    '}',
    'var ready = (async function () {',
    '  importScripts(BASE + "pyodide.js");',
    '  py = await loadPyodide({ indexURL: BASE });',
    '  py.runPython(HARNESS);',
    '})();',
    'self.onmessage = async function (e) {',
    '  var m = e.data;',
    '  try {',
    '    self.postMessage({ id: m.id, type: "status", text: "Starting Python (the first run downloads about 12 MB)…" });',
    '    await ready;',
    '    await getPackages(m.id, m.packages || [], m.code);',
    '    outId = m.id; outBuf = ""; outTotal = 0; cut = false; outLast = Date.now();',
    '    py.setStdout({ write: writer() });',
    '    py.setStderr({ write: writer() });',
    '    self.postMessage({ id: m.id, type: "status", text: "Running…" });',
    '    var fn = py.globals.get("_aim_run");',
    '    var out = fn(m.code, m.tests || "");',
    '    fn.destroy();',
    '    flushOut();',
    '    self.postMessage({ id: m.id, type: "done", result: JSON.parse(out) });',
    '  } catch (err) {',
    '    try { flushOut(); } catch (e3) {}',
    '    self.postMessage({ id: m.id, type: "fatal", boot: !py, text: String(err && err.message || err) });',
    '  }',
    '};'
  ].join('\n');

  var worker = null, seq = 0, pending = {};
  var status = 'idle';
  function boot() {
    if (worker) return worker;
    var blob = new Blob([WORKER_SRC], { type: 'text/javascript' });
    worker = new Worker(URL.createObjectURL(blob));
    worker.onmessage = function (e) {
      var m = e.data, p = pending[m.id];
      if (!p) return;
      if (m.type === 'stdout' || m.type === 'stderr') { if (p.onStdout) p.onStdout(m.text, m.type); }
      else if (m.type === 'status') { if (p.onStatus) p.onStatus(m.text); }
      else if (m.type === 'done') { delete pending[m.id]; status = 'ready'; p.resolve(m.result); }
      else if (m.type === 'fatal') {
        delete pending[m.id]; status = 'error';
        if (m.boot) { try { worker.terminate(); } catch (e) {} worker = null; }
        p.reject(new Error(m.boot ? 'Python could not be downloaded. Check your internet connection and press Run again. (It loads from cdn.jsdelivr.net, which some office networks block.)' : m.text));
      }
    };
    worker.onerror = function (e) {
      Object.keys(pending).forEach(function (k) { pending[k].reject(new Error('Python could not start. Check your internet connection (Pyodide loads from cdn.jsdelivr.net). ' + (e.message || ''))); delete pending[k]; });
      status = 'error'; worker = null;
    };
    return worker;
  }
  function run(code, opts) {
    opts = opts || {};
    if (window.AIM_PREVIEW) return Promise.reject(new Error('Running Python is switched off in this preview. Open the full site (GitHub Pages) to run code.'));
    var w = boot(), id = ++seq;
    status = 'running';
    return new Promise(function (resolve, reject) {
      pending[id] = { resolve: resolve, reject: reject, onStdout: opts.onStdout, onStatus: opts.onStatus };
      w.postMessage({ id: id, code: code, tests: opts.tests || '', packages: opts.packages || [] });
    });
  }
  function stop() {
    if (worker) { worker.terminate(); worker = null; }
    Object.keys(pending).forEach(function (k) { pending[k].reject(new Error('Stopped. Python will restart on your next run.')); delete pending[k]; });
    status = 'idle';
  }
  window.AIM_RUNNER = { run: run, stop: stop, get status() { return status; }, version: PYODIDE_VERSION };
})();
