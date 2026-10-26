/* AI Marg study feature: How to learn: the 40 learning methods and where the site uses each.
   Uses window.AIM_STUDY (assets/js/study.js) and window.AIM_APP (assets/js/app.js). study.js loads this file for #methods
   and the Study room; the guide itself (data/study/guide.js) is loaded with ST.ensureGuide when the page needs it.
   Route #methods, with optional deep links: #methods~16 or #methods~sravana (one method), #methods~vedic (a group),
   #methods~routine (the study session) and #methods~ai (AI help). In-page jumps use data-jump, handled here. */
(function () {
  'use strict';
  var ST = window.AIM_STUDY; if (!ST) return; // study features are switched off in this browser
  var C = window.AIM_CORE, D = window.AIM || {};
  var esc = C.esc, inline = C.inline;
  var A = function () { return window.AIM_APP; };
  var S = function () { return C.state; };
  var $ = function (id) { return document.getElementById(id); };
  var STATUS_WAIT = 600; // while the learner types a search, the result count is announced once they pause

  var GROUPS = [
    { id: 'science', btn: 'Science-based', title: 'Science-based methods', sub: 'From learning science: research on how memory and attention work.' },
    { id: 'vedic', btn: 'Vedic and yogic', title: 'Vedic, Upanishadic and yogic methods', sub: 'Ways of learning from the living traditions of India, described with respect and with a plain note on where modern research connects.' },
    { id: 'integrated', btn: 'AI and adaptive', title: 'AI and adaptive methods', sub: 'How this site puts the methods above to work, with simple rules on your own progress and optional AI help.' }
  ];
  var GROUP = {}; GROUPS.forEach(function (g) { GROUP[g.id] = g; });
  var EVID = {
    strong: ['Strong evidence', 'lm-ev-strong'],
    moderate: ['Moderate evidence', 'lm-ev-moderate'],
    mixed: ['Mixed evidence', 'lm-ev-mixed'],
    limited: ['Limited evidence', 'lm-ev-limited'],
    tradition: ['A contemplative tradition', 'lm-ev-tradition']
  };
  var reduceMQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  /* ---------- small helpers ---------- */
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  // lower case, accents removed and spaces collapsed, so "sravana" finds "Śravaṇa"
  function norm(s) {
    var t = String(s == null ? '' : s);
    try { t = t.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) {}
    return t.toLowerCase().replace(/\s+/g, ' ').trim();
  }
  function guideReady() { return !!ST.guide(); } // loaded (ST.ensureGuide) and written
  var guideTried = false; // the guide file has loaded, written or not (a guide still being written loads as null)
  function loadGuide() { return ST.ensureGuide().then(function (g) { guideTried = true; return g; }); }
  function lastMod() { var a = A(), id = S().last; return a && id && a.modById[id] ? a.modById[id] : null; }
  function modLabel(m) { var a = A(); return (a && a.modNo ? a.modNo(m) + ' ' : '') + m.title; }
  function modHref(m, tab) { return '#m-' + m.id + '~' + tab; }
  function hasQuiz(m) { return !!(m && D.quizzes && D.quizzes[m.id] && D.quizzes[m.id].length); }
  function methodsOf(g) {
    return (g && Array.isArray(g.methods) ? g.methods : []).filter(function (m) { return m && typeof m === 'object' && isFinite(Number(m.n)) && m.name; })
      .slice().sort(function (a, b) { return Number(a.n) - Number(b.n); });
  }
  function isVedic(m) { return m.group === 'vedic' || !!m.roman; }
  // a Vedic method's name: roman letters, then the Devanagari marked as Sanskrit (only from the guide's own fields)
  function vedName(m) {
    if (m.roman) return esc(m.roman) + (m.sa ? ' <span lang="sa">(' + esc(m.sa) + ')</span>' : '');
    if (ST.SANS && ST.SANS[m.id]) return ST.sans(m.id, { meaning: false });
    return esc(m.name);
  }
  function plainName(m) { return (m.roman ? m.roman + ': ' : '') + m.name; } // for prompts and option text (no Devanagari)
  function shortName(m) { return isVedic(m) ? vedName(m) : esc(m.name); }

  /* ---------- where each method is used on this site ---------- */
  // Module tools open the module the learner opened last; without one, a page where they can pick a module.
  function featLink(f, m) {
    var pick = ' (pick a module)';
    switch (f) {
      case 'cards': return m ? { label: 'Lesson cards', href: modHref(m, 'overview') } : { label: 'Lesson cards' + pick, href: '#roadmap' };
      case 'diagrams': return m ? { label: 'Lesson diagrams', href: modHref(m, 'overview') } : { label: 'Lesson diagrams' + pick, href: '#roadmap' };
      case 'feynman': return m ? { label: 'Explain it simply (Reflect tab)', href: modHref(m, 'reflect') } : { label: 'Explain it simply' + pick, href: '#roadmap' };
      case 'socratic': return m ? { label: 'Question it, step by step (Reflect tab)', href: modHref(m, 'reflect') } : { label: 'Question it, step by step' + pick, href: '#roadmap' };
      case 'japa': return m ? { label: 'Repeat the key terms (Reflect tab)', href: modHref(m, 'reflect') } : { label: 'Repeat the key terms' + pick, href: '#roadmap' };
      case 'quiz': return hasQuiz(m) ? { label: 'Module quiz', href: modHref(m, 'quiz') } : { label: 'Level tests', href: '#tests' };
      case 'videos': return m ? { label: 'Watch & read', href: modHref(m, 'watch') } : { label: 'Video library', href: '#library' };
      case 'review': return { label: 'Daily review', href: '#review' };
      case 'focus': return { label: 'Focus session', href: '#focus' };
      case 'journal': return { label: 'Learning journal', href: '#journal' };
      case 'mixed': return { label: 'Mixed practice', href: '#mixed' };
      case 'mistakes': return { label: 'Mistakes notebook', href: '#mistakes' };
      case 'mastery': return { label: 'Knowledge map', href: '#mastery' };
      case 'labs': return { label: 'Interactive labs', href: '#labs' };
      case 'practice': return { label: 'Python practice', href: '#practice' };
      case 'tests': return { label: 'Level tests', href: '#tests' };
      case 'projects': return { label: 'Projects', href: '#projects' };
      case 'ai': return { label: 'AI help on this site', href: '#methods~ai', jump: 'lm-ai' };
    }
    return null;
  }
  function methodLinks(meth, m) {
    var seen = {}, out = [];
    (Array.isArray(meth.inSite) ? meth.inSite : []).forEach(function (f) {
      var l = featLink(f, m); if (!l || seen[l.href]) return;
      seen[l.href] = 1; out.push(l);
    });
    return out;
  }
  function linkHTML(l, extra) {
    return '<a href="' + esc(l.href) + '"' + (l.jump ? ' data-jump="' + esc(l.jump) + '"' : '') + (extra || '') + '>' + esc(l.label) + '</a>';
  }
  // tools a step of the study session mentions, found by name in its text
  var STEP_TOOLS = [
    [/\bfocus session\b/i, 'focus'], [/\bdaily review\b/i, 'review'], [/\blesson cards?\b/i, 'cards'],
    [/\bwatch & read\b|\bvideo\b/i, 'videos'], [/\blab\b/i, 'lab'], [/\bexercises?\b/i, 'exercise'],
    [/\breflect tab\b|\bfeynman box\b/i, 'reflect'], [/\bmixed practice\b/i, 'mixed'], [/\bmistakes notebook\b/i, 'mistakes'],
    [/\bjournal\b/i, 'journal'], [/\bknowledge map\b/i, 'mastery']
  ];
  function toolLink(k, m) {
    var a = A();
    if (k === 'reflect') return m ? { label: 'Reflect tab', href: modHref(m, 'reflect') } : { label: 'Reflect tab (pick a module)', href: '#roadmap' };
    if (k === 'lab') return m && a && a.labOf(m) ? { label: 'Lab', href: modHref(m, 'lab') } : { label: 'Interactive labs', href: '#labs' };
    if (k === 'exercise') return m && a && a.exOf(m.id).length ? { label: 'Python exercises', href: modHref(m, 'practice') } : { label: 'Python practice', href: '#practice' };
    return featLink(k, m);
  }
  function stepTools(text, m) {
    var seen = {}, out = [];
    STEP_TOOLS.forEach(function (t) {
      if (!t[0].test(text)) return;
      var l = toolLink(t[1], m); if (!l || seen[l.href]) return;
      seen[l.href] = 1; out.push(l);
    });
    return out;
  }

  /* ---------- page pieces ---------- */
  function backBtn() { return '<button type="button" class="btn btn-sm btn-ghost lm-back" data-lm-back hidden></button>'; }
  function introHTML(g) {
    var t = String(g.intro || ''), i = t.indexOf('An honest note:');
    var main = i > 0 ? t.slice(0, i).trim() : t, note = i > 0 ? t.slice(i).trim() : '';
    return (main ? '<p class="prose">' + inline(main) + '</p>' : '') +
      (note ? '<p class="callout small prose">' + inline(note) + '</p>' : '');
  }
  function tocHTML(hasRoutine, n) {
    var items = [];
    if (hasRoutine) items.push(['lm-routine', 'The study session', '#methods~routine']);
    if (n) items.push(['lm-list', 'The ' + n + ' methods', '#methods']);
    items.push(['lm-ai', 'AI help on this site', '#methods~ai']);
    return '<nav class="lm-toc" aria-label="On this page" data-origin="the page contents"><span class="lm-label">On this page</span><ul>' + items.map(function (x) {
      return '<li><a href="' + x[2] + '" data-jump="' + x[0] + '">' + esc(x[1]) + '</a></li>';
    }).join('') + '</ul></nav>';
  }
  function routineHTML(g, byN, m) {
    var steps = (Array.isArray(g.routine) ? g.routine : []).filter(function (s) { return s && typeof s.step === 'string' && s.step; });
    if (!steps.length) return '';
    var total = steps.reduce(function (s, x) { var v = Number(x.minutes); return s + (isFinite(v) && v > 0 ? v : 0); }, 0);
    return '<section class="card stack lm-routine" id="lm-routine" aria-labelledby="lm-routine-h" data-lm-target>' +
      '<div class="stack-sm"><h2 class="h-sub" id="lm-routine-h" tabindex="-1" data-lm-focus>A study session that uses these methods</h2>' + backBtn() +
      '<p class="small muted prose">' + esc(plural(steps.length, 'step')) + (total ? ', about ' + total + ' minutes in all' : '') + '. Each step names the methods it uses: press a name to read about it, or open the tool and start. On a short day, do fewer steps; a little every day beats a lot once a week.</p></div>' +
      '<ol class="lm-steps">' + steps.map(function (s, i) {
        var txt = s.step, cut = txt.indexOf('. '), head = '', rest = txt;
        if (cut > 0 && cut <= 40) { head = txt.slice(0, cut); rest = txt.slice(cut + 2); }
        var mins = Number(s.minutes), id = 'lm-step-' + (i + 1);
        var ms = (Array.isArray(s.methods) ? s.methods : []).map(function (n) { return byN[Number(n)]; }).filter(Boolean);
        var tools = stepTools(txt, m);
        return '<li class="lm-step" id="' + id + '" data-origin="step ' + (i + 1) + ' of the study session">' +
          '<p class="lm-step-head">' + (head ? '<strong>' + inline(head) + '</strong>' : '') + (isFinite(mins) && mins > 0 ? ' <span class="chip num">' + mins + ' min</span>' : '') + '</p>' +
          '<p>' + inline(rest) + '</p>' +
          (ms.length ? '<div class="lm-step-row"><span class="lm-label" id="' + id + '-m">Methods used</span><ul class="lm-mlinks" aria-labelledby="' + id + '-m">' + ms.map(function (x) {
            return '<li><a class="lm-mlink" href="#methods~' + esc(String(x.n)) + '" data-jump="lm-m' + esc(String(x.n)) + '"><b class="num">' + esc(String(x.n)) + '</b> <span>' + shortName(x) + '</span></a></li>';
          }).join('') + '</ul></div>' : '') +
          (tools.length ? '<div class="lm-step-row"><span class="lm-label" id="' + id + '-t">Open</span><ul class="lm-links" aria-labelledby="' + id + '-t">' + tools.map(function (l) { return '<li>' + linkHTML(l) + '</li>'; }).join('') + '</ul></div>' : '') +
          '</li>';
      }).join('') + '</ol></section>';
  }
  function cardHTML(x, m) {
    var n = String(x.n), id = 'lm-m' + n, ev = x.evidence && typeof x.evidence === 'object' ? x.evidence : null;
    var evl = ev ? (EVID[ev.level] || ['Evidence: ' + String(ev.level || 'not rated'), 'lm-ev-other']) : null;
    var links = methodLinks(x, m), ved = isVedic(x);
    var nameHTML = ved ? '<span class="lm-roman">' + vedName(x) + '</span><span class="visually-hidden">: </span><span class="lm-en">' + esc(x.name) + '</span>' : '<span>' + esc(x.name) + '</span>';
    var hasBody = !!(x.what || (ev && ev.note));
    return '<article class="card lm-card" id="' + id + '" data-n="' + esc(n) + '" aria-labelledby="' + id + '-h" data-lm-target data-origin="method ' + esc(n) + ', ' + esc(x.roman || x.name) + '">' +
      '<h4 class="lm-name" id="' + id + '-h" tabindex="-1" data-lm-focus><span class="lm-num" aria-hidden="true">' + esc(n) + '</span><span class="lm-title"><span class="visually-hidden">Method ' + esc(n) + ': </span>' + nameHTML + '</span></h4>' +
      backBtn() +
      (evl ? '<p class="lm-chips"><span class="chip ' + evl[1] + '">' + esc(evl[0]) + '</span></p>' : '') +
      (x.short ? '<p class="lm-short">' + inline(x.short) + '</p>' : '') +
      (hasBody ? '<button type="button" class="btn btn-sm lm-more" aria-expanded="false" aria-controls="' + id + '-more"><span data-lm-more-t>More</span><span class="visually-hidden"> about ' + esc(x.roman || x.name) + '</span></button>' +
        '<div class="lm-body stack-sm" id="' + id + '-more">' + (x.what ? '<p>' + inline(x.what) + '</p>' : '') +
        (ev && ev.note ? '<p class="small lm-ev-note"><strong>About the evidence:</strong> ' + inline(ev.note) + '</p>' : '') + '</div>' : '') +
      (links.length ? '<div class="lm-where"><span class="lm-label" id="' + id + '-w">Where to use it here</span><ul class="lm-links" aria-labelledby="' + id + '-w">' + links.map(function (l) {
        return '<li>' + linkHTML(l, l.jump === 'lm-ai' ? ' data-pick="' + esc(n) + '"' : '') + '</li>';
      }).join('') + '</ul></div>' : '') +
      (x.tryNow ? '<p class="callout small lm-try"><strong>Try now:</strong> ' + inline(x.tryNow) + '</p>' : '') +
      '</article>';
  }
  function listHTML(meths, m) {
    var counts = { all: meths.length }, known = {};
    GROUPS.forEach(function (g) { known[g.id] = 1; counts[g.id] = meths.filter(function (x) { return x.group === g.id; }).length; });
    var groups = GROUPS.filter(function (g) { return counts[g.id]; }).map(function (g) { return { g: g, items: meths.filter(function (x) { return x.group === g.id; }) }; });
    var other = meths.filter(function (x) { return !known[x.group]; });
    if (other.length) groups.push({ g: { id: 'other', title: 'More methods', sub: '' }, items: other });
    var range = function (items) { var a = items[0].n, b = items[items.length - 1].n; return a === b ? 'Method ' + a : 'Methods ' + a + ' to ' + b; };
    return '<section class="stack lm-list" id="lm-list" aria-labelledby="lm-list-h" data-lm-target>' +
      '<div class="stack-sm"><h2 id="lm-list-h" tabindex="-1" data-lm-focus>The ' + meths.length + ' methods</h2>' + backBtn() +
      '<p class="small muted prose">' + (m ? 'Links into a module open the one you opened last: <a href="' + modHref(m, 'overview') + '">' + esc(modLabel(m)) + '</a>. To use another module, open it from the <a href="#roadmap">Roadmap</a> first.'
        : 'Links into a module (lesson cards, the Reflect tab, quizzes and videos) open the Roadmap until you open a module. After that, they go straight to the module you opened last.') + '</p></div>' +
      '<div class="card-flat lm-tools">' +
        '<div class="lm-filters" role="group" aria-label="Show methods">' + [['all', 'All']].concat(GROUPS.filter(function (g) { return counts[g.id]; }).map(function (g) { return [g.id, g.btn]; })).map(function (f) {
          return '<button type="button" class="btn btn-sm lm-f" data-lm-f="' + f[0] + '" aria-pressed="' + (f[0] === 'all') + '">' + esc(f[1]) + ' <span class="num lm-count">(' + counts[f[0]] + ')</span></button>';
        }).join('') + '</div>' +
        '<div class="lm-search"><label for="lm-q">Search the methods</label><input type="search" id="lm-q" autocomplete="off" spellcheck="false" placeholder="For example: recall, focus, Manana"></div>' +
        '<p class="small lm-status" id="lm-status" aria-live="polite">Showing all ' + meths.length + ' methods.</p>' +
        '<details class="fold lm-legend"><summary>What the evidence labels mean</summary><div><ul class="small lm-legend-list">' +
          '<li><span class="chip lm-ev-strong">Strong evidence</span> Many studies over many years, in labs and classrooms, agree that it helps.</li>' +
          '<li><span class="chip lm-ev-moderate">Moderate evidence</span> Good studies support it, but there are fewer of them, or the results vary.</li>' +
          '<li><span class="chip lm-ev-mixed">Mixed evidence</span> Some studies find it helps and others do not.</li>' +
          '<li><span class="chip lm-ev-limited">Limited evidence</span> Only a few studies so far, or the idea is new. Most AI-based methods are here.</li>' +
          '<li><span class="chip lm-ev-tradition">A contemplative tradition</span> A practice from India\'s Vedic, Upanishadic or yogic traditions. It is valued for its own reasons and has not been tested as a study technique; the card says where modern research connects.</li>' +
        '</ul></div></details>' +
      '</div>' +
      groups.map(function (gr) {
        return '<div class="stack lm-group" data-lm-group="' + esc(gr.g.id) + '">' +
          '<div class="stack-sm"><h3 class="lm-group-h" id="lm-g-' + esc(gr.g.id) + '">' + esc(gr.g.title) + '</h3>' +
          '<p class="small muted">' + esc(range(gr.items)) + (gr.g.sub ? '. ' + esc(gr.g.sub) : '') + '</p></div>' +
          '<div class="lm-cards">' + gr.items.map(function (x) { return cardHTML(x, m); }).join('') + '</div></div>';
      }).join('') +
      '<div class="empty stack-sm lm-empty" id="lm-empty" hidden><p id="lm-empty-t"></p><div><button type="button" class="btn btn-sm" data-lm-clear>Show all methods</button></div></div>' +
      '</section>';
  }
  // whether Ask Gemini is there for this learner; redrawn when sign-in changes (ST.on('signin') below). The Ask buttons
  // themselves show how many replies are left, so this line names no number that could go out of date.
  function aiStateHTML() {
    if (ST.aiOn()) return 'You are signed in, so <strong>Ask Gemini</strong> buttons appear next to Copy prompt. Each one shows how many replies you have left today.';
    if (ST.aiOffered()) return '<a href="#account">Sign in with Google</a> to see <strong>Ask Gemini</strong> buttons next to Copy prompt.';
    return 'Ask Gemini is switched off on this site at the moment, so you will see only Copy prompt. Copy prompt works with any AI app you already use.';
  }
  function drawAIState() {
    var el = $('lm-ai-state'); if (!el) return;
    var html = aiStateHTML(); if (el._lm === html) return; // unchanged: leave it (and any focus inside it) alone
    var had = el.contains(document.activeElement);
    el.innerHTML = html; el._lm = html;
    if (had) { var f = el.querySelector('a') || $('lm-ai-h'); if (f) focusQuiet(f); }
  }
  ST.on('signin', drawAIState);
  function aiHTML(meths, m) {
    var refl = m ? { label: 'Reflect tab', href: modHref(m, 'reflect') } : { label: 'Reflect tab (pick a module)', href: '#roadmap' };
    var where = [
      [{ label: 'Daily review', href: '#review' }, 'let the AI quiz you on a module while you answer from memory.'],
      [refl, 'get feedback on your plain-words explanation, or let the AI question you further on one of your step-by-step answers.'],
      [{ label: 'Mixed practice', href: '#mixed' }, 'new practice questions on your weakest topic.'],
      [{ label: 'Mistakes notebook', href: '#mistakes' }, 'ask what wrong idea led to an answer.'],
      [{ label: 'Learning journal', href: '#journal' }, 'get help with something that confused you.']
    ];
    return '<section class="card stack lm-ai" id="lm-ai" aria-labelledby="lm-ai-h" data-lm-target data-origin="AI help on this site">' +
      '<div class="stack-sm"><h2 class="h-sub" id="lm-ai-h" tabindex="-1" data-lm-focus>AI help on this site</h2>' + backBtn() +
      '<p class="prose">Some tools can pass your work to an AI tutor: to quiz you, give feedback on an explanation, question you further or explain a mistake. AI help is always optional. Every tool on this site also works without it.</p></div>' +
      '<div class="lm-ai-grid">' +
        '<div class="card-flat stack-sm"><h3 class="h-sub3">Copy prompt: free, with any AI app</h3>' +
          '<p class="small">Press <strong>Copy prompt for your AI app</strong>. The site writes the whole request for you: a short tutor instruction, the lesson or question, and your own answer when the tool is about it. A prompt that quizzes you leaves the answers out, so you still answer from memory. Paste it into ChatGPT, Gemini, Claude or any AI chat app you already use. It costs nothing here and needs no sign-in. The app you paste into has its own limits and privacy rules, so read what you paste first.</p></div>' +
        '<div class="card-flat stack-sm"><h3 class="h-sub3">Ask Gemini: for signed-in learners</h3>' +
          '<p class="small" id="lm-ai-state">' + aiStateHTML() + '</p>' +
          '<ul class="small lm-ai-facts">' +
            '<li><strong>A few replies a day.</strong> Each signed-in learner gets a small number every day, counted on all your devices together; the button shows how many are left. A reply counts only when it arrives. The free allowance is shared by everyone on the site, so on a busy day it can run out early. Copy prompt still works then.</li>' +
            '<li><strong>What is sent to Google.</strong> Ask Gemini sends the prompt the tool writes: much the same text Copy prompt gives you, which can include your own writing, such as an explanation or a journal note. Some prompts also carry the course\'s own answers, so Gemini can check you without showing them to you straight away. It goes to Google\'s Gemini model through Firebase, the Google service that also runs sign-in here. Google\'s terms for its free Gemini service allow it to use what is sent to improve its products, and people at Google may read some of it. So never type personal details such as your phone number, address, Aadhaar number or a password into a box you send to AI.</li>' +
            '<li><strong>AI can be wrong.</strong> It can sound sure and still make mistakes, or explain an idea differently from the lesson. Check its answer against the lesson cards, and trust the site\'s own quizzes and model answers first.</li>' +
          '</ul></div>' +
      '</div>' +
      '<div class="stack-sm"><h3 class="h-sub3">Where you will find it</h3><ul class="small lm-ai-where">' + where.map(function (w) {
        return '<li>' + linkHTML(w[0]) + ': ' + esc(w[1]) + '</li>';
      }).join('') + '</ul></div>' +
      (meths.length ? '<div class="stack-sm lm-ai-try"><h3 class="h-sub3">Try it: ask an AI tutor to coach you in one method</h3>' +
        '<p class="small muted" id="lm-ai-try-d">Pick a method. The prompt asks the AI for three short steps to use it in the next 15 minutes' + (m ? ' on ' + esc(modLabel(m)) : '') + '. With Copy prompt, the AI app then checks on you one question at a time' +
          (ST.aiOffered() ? '; Ask Gemini gives the steps here, with one question to check yourself afterwards' : '') + '.</p>' +
        '<div class="lm-pick"><label for="lm-ai-pick">Method</label><select id="lm-ai-pick">' + meths.map(function (x) {
          return '<option value="' + esc(String(x.n)) + '">' + esc(x.n + '. ' + plainName(x)) + '</option>';
        }).join('') + '</select></div>' +
        ST.aiHTML('lm-ai-try', 'Ask Gemini to coach me', 'coaching in the method you picked') + '</div>' : '') +
      '</section>';
  }
  // mode 'copy': for a chat in another AI app, which can wait for the learner's answers; 'gemini': one reply on this page,
  // where the learner cannot answer back, so it ends with a question to ask themselves instead
  function coachPrompt(x, m, mode) {
    if (!x) return '';
    return 'I am a beginner learning AI and machine learning on AI Marg, a free course site. Coach me to use one study method for the next 15 minutes.\n\n' +
      'Method: ' + plainName(x) + '\n' +
      (x.short ? 'In short: ' + x.short + '\n' : '') +
      (x.tryNow ? 'A first try on the site: ' + x.tryNow + '\n' : '') +
      (m ? 'Topic: the module "' + modLabel(m) + '". Base your steps and question on it.\n' : mode === 'gemini' ? 'Topic: any beginner topic in AI and machine learning; keep the steps general enough for any module.\n' : 'Topic: ask me first which topic I am studying.\n') +
      (mode === 'gemini' ? '\nGive me 3 short steps to do now. Then give me one short question to ask myself afterwards, to check that I used the method well. I cannot reply to you here, so do not wait for an answer.'
        : '\nGive me 3 short steps to do now. Then ask me one question at a time to check that I am using the method well, and wait for my answer before you go on.');
  }

  /* ---------- the page ---------- */
  var page = null; // { token, meths, byN, m, group, last: {from, to}, cards, statusT (search announcement timer), aiMode }
  function viewMethods(match) {
    var arg = match && match[1] ? String(match[1]) : '';
    var app = A(), token = {};
    page = { token: token, meths: [], byN: {}, m: lastMod(), group: 'all', last: null, cards: [], statusT: 0, aiMode: 'copy' };
    app.setView('<div class="wrap stack-lg lm-page">' + app.crumbs([['Home', 'home'], ['Study room', 'study'], ['How to learn']]) +
      '<header class="stack-sm"><h1>How to learn</h1></header>' +
      '<div id="lm-body" class="stack-lg">' + (guideReady() ? '' : '<p class="muted" role="status">Loading the guide…</p>') + '</div></div>', 'How to learn');
    var root = app.main.querySelector('.lm-page');
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    app.onLeave(function () { if (page && page.token === token) { clearTimeout(page.statusT); page = null; } });
    var go = function () { if (page && page.token === token && $('lm-body')) draw(arg); };
    if (guideReady()) go();
    else loadGuide().then(go, function (e) { if (page && page.token === token && $('lm-body')) drawError(e); });
  }
  ST.addRoute(/^methods(?:~([\w-]+))?$/, viewMethods, 'study');

  function drawError(e) {
    var body = $('lm-body'); if (!body) return;
    body.innerHTML = '<div class="callout stack-sm" role="alert"><p>' + esc((e && e.message) || 'The guide did not load.') + '</p><div><button type="button" class="btn btn-sm" data-lm-retry>Try again</button></div></div>';
  }
  function draw(arg) {
    var body = $('lm-body'); if (!body || !page) return;
    var g = ST.guide(), meths = methodsOf(g), m = page.m;
    if (!g || !meths.length) {
      body.innerHTML = '<div class="empty stack-sm lm-wait"><p>The How to learn guide is being written. Please check back soon.</p>' +
        '<p>Meanwhile, the tools in the <a href="#study">Study room</a> already use these methods.</p></div>';
      return;
    }
    var byN = {}; meths.forEach(function (x) { byN[Number(x.n)] = x; });
    page.meths = meths; page.byN = byN;
    var routine = routineHTML(g, byN, m);
    body.innerHTML = '<div class="stack">' + introHTML(g) +
      '<p class="prose"><strong>What to do here:</strong> try the study session below once this week. Then use the filters or the search box to read about any method; each card links to the place on this site where you can use it.</p>' +
      tocHTML(!!routine, meths.length) + '</div>' +
      routine + listHTML(meths, m) + aiHTML(meths, m);
    // search text for each card: name, Sanskrit name, what it is, evidence, where it is used
    page.cards = meths.map(function (x) {
      var el = $('lm-m' + x.n), ev = x.evidence || {};
      var gt = GROUP[x.group] ? GROUP[x.group].title + ' ' + GROUP[x.group].btn : '';
      return { x: x, el: el, text: norm([x.n, x.name, x.roman, x.sa, x.short, x.what, ev.note, (EVID[ev.level] || [''])[0], x.tryNow, gt,
        methodLinks(x, m).map(function (l) { return l.label; }).join(' ')].join(' ')) };
    });
    // which button was pressed (Copy prompt or Ask Gemini) is noted by onClick, which runs before study.js handles the click
    ST.bindAI(body, 'lm-ai-try', function () { var sel = $('lm-ai-pick'); return page ? coachPrompt(sel ? page.byN[Number(sel.value)] : null, m, page.aiMode) : ''; });
    // a deep link: one method, a group, or a section
    if (!arg) return;
    if (GROUP[arg]) { setGroup(arg); return; }
    var target = null, a = arg.toLowerCase();
    if (/^\d+$/.test(a) && byN[Number(a)]) target = 'lm-m' + Number(a);
    else if (a === 'ai') target = 'lm-ai';
    else if (a === 'routine' || a === 'session') target = routine ? 'lm-routine' : null;
    else meths.forEach(function (x) { if (!target && String(x.id || '').toLowerCase() === a) target = 'lm-m' + x.n; });
    if (target) jump(target, null);
  }

  /* ---------- filters and search ---------- */
  function query() { var q = $('lm-q'); return q ? q.value : ''; }
  function setGroup(gid) {
    if (!page) return;
    page.group = gid === 'all' || GROUP[gid] ? gid : 'all';
    document.querySelectorAll('.lm-page [data-lm-f]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lm-f') === page.group)); });
    try { history.replaceState(null, '', '#methods' + (page.group === 'all' ? '' : '~' + page.group)); } catch (e) {}
    apply();
  }
  // the cards change at once; the polite status line (read out by screen readers) says the result at once after a filter
  // button, but only when the learner pauses while typing a search, so one search is one announcement, not one per letter
  function setStatus(msg) { var st = $('lm-status'); if (st && st.textContent !== msg) st.textContent = msg; }
  function apply(typing) {
    if (!page) return;
    clearTimeout(page.statusT); page.statusT = 0;
    var words = norm(query()).split(' ').filter(Boolean), gid = page.group, shown = 0;
    page.cards.forEach(function (c) {
      if (!c.el) return;
      var on = (gid === 'all' || c.x.group === gid) && words.every(function (w) { return c.text.indexOf(w) >= 0; });
      c.el.hidden = !on; if (on) shown++;
    });
    document.querySelectorAll('.lm-page [data-lm-group]').forEach(function (sec) {
      sec.hidden = !sec.querySelector('.lm-card:not([hidden])');
    });
    var total = page.cards.length, gname = GROUP[gid] ? GROUP[gid].btn : '', q = query().trim();
    var empty = $('lm-empty'), et = $('lm-empty-t');
    var msg;
    if (!shown) msg = 'No method matches "' + q + '"' + (gname ? ' in ' + gname : '') + '.';
    else if (shown === total) msg = 'Showing all ' + total + ' methods.';
    else msg = 'Showing ' + shown + ' of ' + total + ' methods' + (gname ? ': ' + gname : '') + (q ? (gname ? ',' : ':') + ' matching "' + q + '"' : '') + '.';
    if (typing) { var token = page.token; page.statusT = setTimeout(function () { if (page && page.token === token) { page.statusT = 0; setStatus(msg); } }, STATUS_WAIT); }
    else setStatus(msg);
    if (empty) { empty.hidden = !!shown; if (et) et.textContent = shown ? '' : msg + ' Try another word, or show all methods.'; }
  }
  function clearFilters() {
    var q = $('lm-q'); if (q) q.value = '';
    setGroup('all');
  }
  function onInput(ev) { if (ev.target && ev.target.id === 'lm-q') apply(true); }

  /* ---------- in-page jumps (the hash is the route, so these scroll and focus instead of changing it) ---------- */
  // smooth for a short hop; a long one (or reduced motion) goes straight there
  function scrollToEl(el, block) {
    var far = Math.abs(el.getBoundingClientRect().top) > 2.5 * (window.innerHeight || 800);
    try { el.scrollIntoView({ block: block || 'start', behavior: far || (reduceMQ && reduceMQ.matches) ? 'instant' : 'smooth' }); } catch (e) { el.scrollIntoView(); }
  }
  function focusQuiet(el) { if (!el) return; if (!el.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) el.setAttribute('tabindex', '-1'); try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }
  function setOpen(card, open) {
    var b = card.querySelector('.lm-more'); if (!b) return;
    card.classList.toggle('is-open', open);
    b.setAttribute('aria-expanded', String(open));
    var t = b.querySelector('[data-lm-more-t]'); if (t) t.textContent = open ? 'Less' : 'More';
  }
  function jump(id, from) {
    var t = $(id); if (!t || !page) return;
    if (t.closest('[hidden]')) { clearFilters(); var st = $('lm-status'); if (st) st.textContent = 'Filters cleared to show this. Showing all ' + page.cards.length + ' methods.'; }
    if (t.classList.contains('lm-card')) setOpen(t, true);
    document.querySelectorAll('.lm-page .lm-hit').forEach(function (x) { x.classList.remove('lm-hit'); });
    document.querySelectorAll('.lm-page [data-lm-back]').forEach(function (b) { b.hidden = true; });
    if (t.classList.contains('lm-card')) t.classList.add('lm-hit');
    var origin = from && from.closest ? from.closest('[data-origin]') : null, back = t.querySelector('[data-lm-back]');
    page.last = origin && origin !== t ? { from: from, to: t } : null;
    if (page.last && back) { back.innerHTML = '<span aria-hidden="true">↩ </span>' + esc('Back to ' + origin.getAttribute('data-origin')); back.hidden = false; }
    scrollToEl(t, 'start');
    focusQuiet(t.querySelector('[data-lm-focus]') || t);
  }
  function goBack(btn) {
    var l = page && page.last; btn.hidden = true;
    if (!l || !l.from || !l.from.isConnected) return;
    if (l.from.closest('[hidden]')) clearFilters();
    page.last = null;
    scrollToEl(l.from, 'center');
    focusQuiet(l.from);
  }
  function onClick(ev) {
    var t = ev.target && ev.target.closest ? ev.target : null; if (!t || !page) return;
    var ai = t.closest('[data-ai-ask],[data-ai-copy]');
    if (ai) { page.aiMode = ai.hasAttribute('data-ai-ask') ? 'gemini' : 'copy'; return; } // study.js then asks for the prompt
    var j = t.closest('[data-jump]');
    if (j) {
      ev.preventDefault(); ev.stopPropagation(); // handled here, not by the site-wide jump handler
      var pick = j.getAttribute('data-pick'), sel = $('lm-ai-pick');
      if (pick && sel && page.byN[Number(pick)]) sel.value = pick;
      jump(j.getAttribute('data-jump'), j);
      return;
    }
    var f = t.closest('[data-lm-f]'); if (f) { setGroup(f.getAttribute('data-lm-f')); return; }
    var mo = t.closest('.lm-more'); if (mo) { var card = mo.closest('.lm-card'); if (card) setOpen(card, mo.getAttribute('aria-expanded') !== 'true'); return; }
    var bk = t.closest('[data-lm-back]'); if (bk) { goBack(bk); return; }
    if (t.closest('[data-lm-clear]')) { clearFilters(); var q = $('lm-q'); if (q) q.focus(); return; }
    if (t.closest('[data-lm-retry]')) {
      // the button goes away while the guide loads: focus waits on the page heading, and comes back to the button if it fails again
      var body = $('lm-body'), token = page.token; if (body) body.innerHTML = '<p class="muted" role="status">Loading the guide…</p>';
      focusQuiet(document.querySelector('.lm-page h1'));
      loadGuide().then(function () { if (page && page.token === token) draw(''); }, function (e) { if (page && page.token === token) { drawError(e); focusQuiet(document.querySelector('.lm-page [data-lm-retry]')); } });
    }
  }

  /* ---------- Study room card ---------- */
  function hubLine() {
    var g = ST.guide(), n = methodsOf(g).length;
    if (!g && !guideTried) return 'Learning methods and a study session to follow.'; // not loaded (yet)
    if (!g || !n) return 'The guide is being written. Please check back soon.';
    var steps = (Array.isArray(g.routine) ? g.routine : []).filter(function (s) { return s && s.step; });
    var mins = steps.reduce(function (s, x) { var v = Number(x.minutes); return s + (isFinite(v) && v > 0 ? v : 0); }, 0);
    return esc(plural(n, 'method')) + (steps.length ? ' · a ' + steps.length + '-step study session' + (mins ? ', about ' + mins + ' minutes' : '') : '') + '.';
  }
  ST.addHubCard(90, function () {
    return '<article class="card lm-hub" aria-labelledby="lm-hub-h"><h2 class="h-sub" id="lm-hub-h">How to learn</h2>' +
      '<p class="small">Learning science, ' + ST.sans('sravana', { meaning: false }) + ', ' + ST.sans('manana', { meaning: false }) + ' and other Vedic practices, and AI help</p>' +
      '<p class="small muted">What each method is, how strong the evidence for it is, and where on this site to use it.</p>' +
      '<p id="lm-hub-line">' + hubLine() + '</p>' +
      '<div class="row"><a class="btn" href="#methods">Read how to learn</a></div></article>';
  });
  ST.on('hub', function () {
    if (guideReady()) return;
    var up = function () { var el = $('lm-hub-line'); if (el) el.innerHTML = hubLine(); };
    loadGuide().then(up, function () {});
  });
})();
