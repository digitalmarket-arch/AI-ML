/* AI Marg: publish a project to the learner's own GitHub repository and share it on LinkedIn.
   Plain script (no build step). Exposes window.AIM_PUBLISH = { html(p, st), bind(root, p, st, hooks) }.
   The GitHub token is used only in this tab, only to call api.github.com, and is never stored. */
(function () {
  'use strict';
  var C = window.AIM_CORE, esc = C.esc;
  var API = 'https://api.github.com';
  var MAX_BYTES = 25 * 1024 * 1024; // larger files (datasets, models) belong in a release, Hugging Face or Kaggle, not the repo
  var SKIP_DIRS = /(^|\/)(\.git|__pycache__|\.ipynb_checkpoints|node_modules|\.venv|venv|env|\.idea|\.vscode)(\/|$)/;
  var SECRET_FILES = /(^|\/)(\.env(\..*)?|.*\.pem|.*\.key|id_rsa.*|id_ed25519.*|credentials(\.json)?|.*secret.*\.json|kaggle\.json)$/i;
  var JUNK_FILES = /(^|\/)(\.DS_Store|Thumbs\.db|desktop\.ini)$/i;

  // a short repository name: the title before any colon or dash, cut at a word boundary
  function slug(s) {
    var head = String(s || '').split(/[:?\u2013\u2014(]| - /)[0];
    if (head.normalize) head = head.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    var words = head.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean), out = [];
    for (var i = 0; i < words.length; i++) { if (out.concat(words[i]).join('-').length > 40) break; out.push(words[i]); }
    // when the name had to be cut short, do not end on a small word like "for" or "a"
    while (out.length < words.length && out.length > 1 && /^(a|an|and|the|for|with|of|to|in|on|by)$/.test(out[out.length - 1])) out.pop();
    return out.join('-') || 'my-ai-project';
  }
  // "owner/name", "https://github.com/owner/name" or "...name.git" -> { owner, name } or null
  function parseRepo(v) {
    var m = /^(?:https?:\/\/(?:www\.)?github\.com\/)?([A-Za-z0-9-]{1,39})\/([A-Za-z0-9._-]{1,100}?)(?:\.git)?\/?$/.exec(String(v || '').trim());
    return m ? { owner: m[1], name: m[2] } : null;
  }
  function fmtSize(n) { return n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(1) + ' MB'; }
  // links inside the course text: site-internal ones (#m-...) become plain words, web links stay
  function noInternal(s) { return String(s || '').replace(/\[([^\]]+)\]\((#[^)]*)\)/g, '$1'); }
  function md(s) { return noInternal(s); }
  function plain(s) { return noInternal(s).replace(/\*\*(.+?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)'); }

  function readme(p, st, repo) {
    var L = [];
    L.push('# ' + p.title, '');
    if (p.tagline) L.push(plain(p.tagline), '');
    L.push('## The problem', '', md(p.brief), '');
    if (p.why) L.push('## Why it matters', '', md(p.why), '');
    if (p.datasets && p.datasets.length) {
      L.push('## Data', '');
      p.datasets.forEach(function (d) { L.push('- ' + (d.url ? '[' + d.name + '](' + d.url + ')' : d.name) + (d.note ? ': ' + md(d.note) : '')); });
      L.push('');
    }
    if (p.milestones && p.milestones.length) {
      L.push('## What I built', '');
      p.milestones.forEach(function (ms, i) { L.push('- [' + (st.steps && st.steps[i] ? 'x' : ' ') + '] ' + plain(ms.title)); });
      L.push('');
    }
    L.push('## Results', '', '_Add your key numbers here (for example accuracy, F1 or error in rupees) and one chart._', '');
    L.push('## How to run', '');
    L.push('```bash', 'git clone https://github.com/' + (repo ? repo.owner + '/' + repo.name : 'YOUR-NAME/' + slug(p.title)) + '.git', 'pip install -r requirements.txt', '```', '');
    L.push('Then open the notebook in Jupyter or Google Colab and run the cells from the top.', '');
    if (p.skills && p.skills.length) L.push('## Skills', '', p.skills.map(plain).join(' · '), '');
    var rated = (p.rubric || []).filter(function (r, i) { return st.rubric && st.rubric[i]; });
    if (rated.length) {
      L.push('## Self-assessment', '', '| Criterion | My level |', '| --- | --- |');
      (p.rubric || []).forEach(function (r, i) { if (st.rubric && st.rubric[i]) L.push('| ' + plain(r.criterion) + ' | ' + ['', 'Basic', 'Good', 'Excellent'][st.rubric[i]] + ' |'); });
      L.push('');
    }
    L.push('---', '', 'Built while learning AI and machine learning with the free AI Marg course.', '');
    return L.join('\n');
  }

  function post(p, st, link) {
    // only the milestones the learner has ticked; short skill names (no bracketed detail)
    var done = (p.milestones || []).filter(function (ms, i) { return st.steps && st.steps[i]; });
    var list = done.slice(0, 5).map(function (ms) { return '• ' + plain(ms.title); });
    var skills = (p.skills || []).map(function (x) { return plain(x).replace(/\s*\([^)]*\)/g, '').trim(); }).filter(function (x) { return x && x.length <= 40; }).slice(0, 5);
    var L = ['I just built ' + p.title + '.', ''];
    if (p.tagline) L.push(plain(p.tagline), '');
    if (list.length) L.push('What I did:', list.join('\n'), '');
    if (skills.length) L.push('Skills: ' + skills.join(', '), '');
    if (st.links && st.links.demo) L.push('Try it: ' + st.links.demo);
    if (link) L.push('Code: ' + link);
    L.push('', 'I am learning AI and machine learning step by step with free resources. Feedback is very welcome!', '', '#MachineLearning #AI #Python #DataScience #LearningInPublic');
    return L.join('\n');
  }

  function html(p, st) {
    var repo = parseRepo(st.links && st.links.repo);
    var name = repo ? repo.name : slug(p.title);
    var newUrl = 'https://github.com/new?name=' + encodeURIComponent(name) + '&description=' + encodeURIComponent(plain(p.tagline || p.title).slice(0, 300)) + '&visibility=public';
    var preview = !!window.AIM_PREVIEW;
    return '<section class="card stack" id="publish" data-pid="' + esc(p.id) + '">' +
      '<div class="stack-sm"><h2 class="h-sub">Put this project on GitHub</h2>' +
      '<p class="small muted">Your code, plus a README written from this brief and your milestones, in your own public repository. Recruiters and clients look here first.</p></div>' +
      '<ol class="pub-steps">' +
      '<li class="stack-sm"><strong>Create an empty repository.</strong><div class="row"><a class="btn btn-sm" href="' + esc(newUrl) + '" target="_blank" rel="noopener">Create it on GitHub ↗</a></div>' +
      '<span class="small muted">The name and description are filled in for you. Leave "Add a README" unticked, then press "Create repository".</span></li>' +
      '<li class="stack-sm"><strong>Make an upload key (a token) for that one repository.</strong><div class="row"><a class="btn btn-sm" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">Open GitHub token settings ↗</a></div>' +
      '<span class="small muted">On that page: Token name "AI Marg upload"; Expiration 7 days; Repository access: <em>Only select repositories</em> and pick your new repository; Permissions: <em>Contents</em> set to <em>Read and write</em>. Press "Generate token" and copy it.</span></li>' +
      '<li class="stack-sm"><strong>Choose your files and upload.</strong>' +
      (preview ? '<div class="callout small">Uploading works on the full site (GitHub Pages), not in this preview.</div>' : '') +
      '<div class="pub-form stack-sm">' +
      '<label class="small" for="pub-repo">Your repository (your-name/repository-name)</label>' +
      '<input type="text" id="pub-repo" autocomplete="off" spellcheck="false" placeholder="your-name/' + esc(name) + '" value="' + esc(repo ? repo.owner + '/' + repo.name : '') + '">' +
      '<label class="small" for="pub-token">Token (used only in this tab; never saved)</label>' +
      '<input type="password" id="pub-token" autocomplete="off" spellcheck="false" placeholder="github_pat_…">' +
      '<div class="row"><label class="btn btn-sm" for="pub-files">Add files</label><input type="file" id="pub-files" multiple hidden>' +
      '<label class="btn btn-sm" for="pub-folder">Add a folder</label><input type="file" id="pub-folder" webkitdirectory multiple hidden>' +
      '<button type="button" class="btn btn-sm btn-ghost" id="pub-clear">Clear files</button></div>' +
      '<div class="small" id="pub-list" aria-live="polite"><span class="muted">No files chosen yet. Add your notebook (.ipynb), code (.py), requirements.txt and small result images. Keep big datasets out: link to them in the README instead.</span></div>' +
      '<details><summary class="small">Edit the README (it is uploaded as README.md)</summary><label class="visually-hidden" for="pub-readme">README text</label><textarea id="pub-readme" rows="14" spellcheck="true"></textarea></details>' +
      '<div class="row"><button type="button" class="btn btn-primary" id="pub-go"' + (preview ? ' disabled' : '') + '>Upload to GitHub</button></div>' +
      '<div class="small pub-log" id="pub-log" role="status" aria-live="polite"></div></div></li></ol>' +
      '<details class="small"><summary>Prefer not to use a token?</summary><p>Copy the README below, then on GitHub open your repository, choose <em>Add file → Upload files</em>, drag your files in, add a file named README.md with the copied text, and press <em>Commit changes</em>.</p><button type="button" class="btn btn-sm" id="pub-copy-readme">Copy README</button></details>' +
      '<p class="small muted">Safety: the token goes only from your browser to GitHub. Files named like .env, *.pem, kaggle.json or credentials are never uploaded, so your passwords and API keys stay private. Delete the token on GitHub when you are done.</p>' +
      '</section>' +
      '<section class="card stack-sm" id="share">' +
      '<h2 class="h-sub">Share it on LinkedIn</h2>' +
      '<label class="small" for="li-text">Your post (edit it so it sounds like you)</label>' +
      '<textarea id="li-text" rows="11"></textarea>' +
      '<div class="row"><button type="button" class="btn btn-sm" id="li-copy">Copy post</button><a class="btn btn-sm btn-primary" id="li-open" href="#" target="_blank" rel="noopener">Open LinkedIn ↗</a></div>' +
      '<p class="small muted" id="li-hint"></p>' +
      '</section>';
  }

  function bind(root, p, st, hooks) {
    var $ = function (id) { return root.querySelector('#' + id); };
    if (!$('publish')) return;
    var files = []; // { path, file }
    var readmeBox = $('pub-readme'), liBox = $('li-text'), liOpen = $('li-open'), liHint = $('li-hint');
    var readmeEdited = false, postEdited = false;
    var repoNow = function () { return parseRepo($('pub-repo').value); };
    var refreshText = function () {
      if (!readmeEdited) readmeBox.value = readme(p, st, repoNow());
      var link = (st.links && st.links.repo) || '';
      var target = link || (st.links && st.links.demo) || '';
      if (!postEdited) liBox.value = post(p, st, link);
      if (target) {
        liOpen.href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(target);
        liOpen.removeAttribute('aria-disabled'); liOpen.classList.remove('is-disabled');
        liHint.textContent = 'LinkedIn opens with your ' + (link ? 'GitHub' : 'demo') + ' link attached. LinkedIn cannot pre-fill the text, so paste the copied post above the link, add a screenshot or a short screen recording, and post.';
      } else {
        liOpen.href = '#'; liOpen.setAttribute('aria-disabled', 'true'); liOpen.classList.add('is-disabled');
        liHint.textContent = 'Upload to GitHub first (or add your repo link under "Your links"), so people can see your code.';
      }
    };
    readmeBox.addEventListener('input', function () { readmeEdited = true; });
    liBox.addEventListener('input', function () { postEdited = true; });
    $('pub-repo').addEventListener('change', function () { refreshText(); });
    ['pl-repo', 'pl-demo'].forEach(function (id) {
      var el = root.querySelector('#' + id);
      if (el) el.addEventListener('input', function () {
        if (id === 'pl-repo' && parseRepo(el.value) && !$('pub-repo').value.trim()) $('pub-repo').value = el.value.trim();
        setTimeout(refreshText, 0);
      });
    });
    liOpen.addEventListener('click', function (e) { if (liOpen.getAttribute('aria-disabled') === 'true') { e.preventDefault(); C.toast('Add your GitHub link first'); } });
    var copy = function (text, what) {
      var done = function () { C.toast(what + ' copied'); };
      try { navigator.clipboard.writeText(text).then(done, function () { fallback(); }); } catch (e) { fallback(); }
      function fallback() { var t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { C.toast('Select the text and copy it by hand'); } t.remove(); }
    };
    $('li-copy').addEventListener('click', function () { copy(liBox.value, 'Post'); });
    $('pub-copy-readme').addEventListener('click', function () { copy(readmeBox.value, 'README'); });

    var listFiles = function () {
      var el = $('pub-list');
      if (!files.length) { el.innerHTML = '<span class="muted">No files chosen yet.</span>'; return; }
      var total = files.reduce(function (s, f) { return s + f.file.size; }, 0);
      el.innerHTML = '<strong>' + files.length + ' file' + (files.length === 1 ? '' : 's') + '</strong> (' + fmtSize(total) + ') ready:<ul class="pub-files">' +
        files.map(function (f) { return '<li><span class="mono">' + esc(f.path) + '</span> <span class="muted">' + fmtSize(f.file.size) + '</span></li>'; }).join('') + '</ul>';
    };
    var add = function (list, fromFolder) {
      var skipped = [];
      Array.prototype.forEach.call(list, function (file) {
        var path = fromFolder && file.webkitRelativePath ? file.webkitRelativePath.split('/').slice(1).join('/') : file.name;
        path = path.replace(/^\/+/, '');
        if (!path) return;
        if (SKIP_DIRS.test(path) || JUNK_FILES.test(path)) return;
        if (SECRET_FILES.test(path)) { skipped.push(path + ' (looks like a secret: never upload keys)'); return; }
        if (/^readme\.md$/i.test(path)) { skipped.push(path + ' (the README above is used instead; paste your text into it)'); return; }
        if (file.size > MAX_BYTES) { skipped.push(path + ' (' + fmtSize(file.size) + ': too big; share big data or models through Kaggle, Hugging Face or Google Drive and link them)'); return; }
        files = files.filter(function (f) { return f.path !== path; }).concat([{ path: path, file: file }]);
      });
      listFiles();
      if (skipped.length) $('pub-list').insertAdjacentHTML('beforeend', '<div class="callout small">Not added: ' + skipped.map(esc).join('; ') + '</div>');
    };
    $('pub-files').addEventListener('change', function (e) { add(e.target.files, false); e.target.value = ''; });
    $('pub-folder').addEventListener('change', function (e) { add(e.target.files, true); e.target.value = ''; });
    $('pub-clear').addEventListener('click', function () { files = []; listFiles(); });

    var log = function (msg, kind) { var el = $('pub-log'); el.innerHTML = '<span class="' + (kind === 'bad' ? 'pub-bad' : kind === 'ok' ? 'pub-ok' : '') + '">' + msg + '</span>'; };
    var b64 = function (buf) {
      var bytes = new Uint8Array(buf), out = '', CH = 0x8000;
      for (var i = 0; i < bytes.length; i += CH) out += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
      return btoa(out);
    };
    var textB64 = function (s) { return b64(new TextEncoder().encode(s).buffer); };
    var readFile = function (file) {
      if (file.arrayBuffer) return file.arrayBuffer();
      return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; r.readAsArrayBuffer(file); });
    };
    var encPath = function (path) { return path.split('/').map(encodeURIComponent).join('/'); };
    var call = function (method, url, token, body) {
      return fetch(API + url, {
        method: method,
        headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      }).then(function (r) { return r.text().then(function (t) { var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {} return { status: r.status, json: j }; }); });
    };
    var explain = function (r, what) {
      var msg = r.json && r.json.message ? ' (GitHub says: ' + esc(r.json.message) + ')' : '';
      if (r.status === 401) return 'GitHub did not accept the token. Check you copied all of it, and that it has not expired.' + msg;
      if (r.status === 403) return 'The token cannot write to this repository. When you made it, choose "Only select repositories", pick this repository, and set Contents to "Read and write".' + msg;
      if (r.status === 404) return 'Repository not found. Check the name (your-name/repository-name), that you created it, and that the token was given access to it.' + msg;
      return 'Could not ' + what + ': error ' + r.status + msg;
    };
    var busy = false;
    $('pub-go').addEventListener('click', function () {
      if (busy) return;
      var repo = repoNow(), token = $('pub-token').value.trim();
      if (!repo) { log('Type your repository as your-name/repository-name (for example priya-sharma/' + esc(slug(p.title)) + ').', 'bad'); $('pub-repo').focus(); return; }
      if (!/^(github_pat_|ghp_|gho_|ghu_|ghs_)[A-Za-z0-9_]{20,}$/.test(token)) { log('Paste the token you generated on GitHub (it starts with github_pat_).', 'bad'); $('pub-token').focus(); return; }
      var queue = [{ path: 'README.md', text: readmeBox.value }].concat(files);
      busy = true; $('pub-go').disabled = true;
      log('Checking the repository…');
      var base = '/repos/' + encodeURIComponent(repo.owner) + '/' + encodeURIComponent(repo.name);
      var info = null, done = 0;
      call('GET', base, token).then(function (r) {
        if (r.status !== 200) throw new Error(explain(r, 'open the repository'));
        info = r.json;
        var next = function (i) {
          if (i >= queue.length) return Promise.resolve();
          var item = queue[i];
          log('Uploading ' + (i + 1) + ' of ' + queue.length + ': <span class="mono">' + esc(item.path) + '</span>');
          var content = item.text != null ? Promise.resolve(textB64(item.text)) : readFile(item.file).then(b64);
          return content.then(function (data) {
            var url = base + '/contents/' + encPath(item.path);
            // an existing file needs its current sha to be replaced; an empty repository answers 404 here, which is fine
            return call('GET', url, token).then(function (g) {
              var body = { message: (g.status === 200 ? 'Update ' : 'Add ') + item.path + ' (AI Marg project: ' + p.title + ')', content: data };
              if (g.status === 200 && g.json && g.json.sha) body.sha = g.json.sha;
              return call('PUT', url, token, body);
            }).then(function (u) {
              if (u.status !== 200 && u.status !== 201) throw new Error(explain(u, 'upload ' + esc(item.path)));
              done++;
              return next(i + 1);
            });
          });
        };
        return next(0);
      }).then(function () {
        var link = info.html_url || ('https://github.com/' + repo.owner + '/' + repo.name);
        st.links = st.links || {}; st.links.repo = link;
        if (hooks && hooks.onLink) hooks.onLink('repo', link);
        C.logActivity(); C.save();
        $('pub-token').value = '';
        refreshText();
        log('Done: ' + done + ' file' + (done === 1 ? '' : 's') + ' uploaded. <a href="' + esc(link) + '" target="_blank" rel="noopener">Open your repository ↗</a> Now share it on LinkedIn below.', 'ok');
        C.toast('Uploaded to GitHub');
      }).catch(function (e) {
        var m = e && e.message ? e.message : String(e);
        if (/Failed to fetch|NetworkError|Load failed/i.test(m)) m = 'Could not reach GitHub. Check your internet connection and try again.';
        log((done ? done + ' file' + (done === 1 ? '' : 's') + ' uploaded before the problem. ' : '') + m, 'bad');
      }).then(function () { busy = false; $('pub-go').disabled = false; });
    });
    refreshText();
  }

  window.AIM_PUBLISH = { html: html, bind: bind, parseRepo: parseRepo, readme: readme, post: post, slug: slug };
})();
