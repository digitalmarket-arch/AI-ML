/* AI Marg lab: RAG retrieval. A GST FAQ for small businesses is cut into chunks of N words (with overlap),
   every chunk is scored against a question with BM25 or TF-IDF cosine similarity, the top k are pasted into
   an LLM prompt, and the lab checks whether the chunk that holds the known answer made it in.
   Plain classic script (ES2019). Registers window.AILabs.rag. No libraries, no network, no storage. */
(function () {
  'use strict';
  var Labs = (window.AILabs = window.AILabs || {});
  var mountCount = 0;

  /* ENGINE START */
  /* ---------- the knowledge base: a plain-English GST FAQ (figures are general or marked as examples) ---------- */
  var SECTIONS = [
    { title: 'What is GST?', text: 'GST (Goods and Services Tax) is a tax on the supply of goods and services in India. It started on 1 July 2017 and replaced many older taxes, such as VAT, service tax and excise duty. GST is charged at every step where value is added: the manufacturer, the wholesaler and the shop each charge GST on their sales and subtract the GST they already paid on their purchases. In the end, the full tax is carried by the final customer. GST is a tax on supply, not on the way you are paid, so a sale paid in cash, by card or through UPI is taxed the same way.' },
    { title: 'Who must register for GST?', text: 'You must register once your aggregate turnover crosses the threshold (the limit) for your state in a financial year. In most states the limit is ₹40 lakh a year if you sell only goods, and ₹20 lakh a year if you provide services or sell both goods and services. A few states, mostly special-category states in the North-East, have lower limits, such as ₹20 lakh for goods and ₹10 lakh for services, so check the limit for your state. Some businesses must register whatever their turnover, for example most businesses that sell goods to buyers in other states. The rules for small sellers on online marketplaces have changed over time, so check the current rule before you start.' },
    { title: 'What is aggregate turnover?', text: 'Aggregate turnover is the total value of everything your business supplies in a financial year (April to March): taxable sales, exempt sales, exports and sales to other states, added up across every branch in India that shares the same PAN (Permanent Account Number). It does not include the GST itself. Example: a tailoring shop in Jaipur earns ₹14 lakh from stitching and sells fabric worth ₹5 lakh in a year, so its aggregate turnover is ₹19 lakh. Because it supplies both services and goods, the ₹20 lakh limit applies, and it does not have to register yet.' },
    { title: 'How do I register, and what is a GSTIN?', text: 'You register online on the official GST portal, gst.gov.in, and the government charges no fee for it. You will usually need your PAN, Aadhaar, a photograph, proof of your business address (such as a rent agreement or an electricity bill) and your bank account details. Once your application is approved, you get a GSTIN (GST Identification Number). It has 15 characters: the first two digits are your state code, the next ten characters are your PAN, then come an entity number, the letter Z by default, and a final check character. You must print your GSTIN on your invoices and display it at your shop or office.' },
    { title: 'Should I charge CGST and SGST, or IGST?', text: 'It depends on the place of supply, which is usually where the goods are delivered or where the buyer is. When the seller and the place of supply are in the same state, the tax is split equally into CGST (Central GST) and SGST (State GST). Example: if the rate on an item were 18%, a shop in Pune selling to a customer in Pune would charge 9% CGST and 9% SGST. When the place of supply is in another state, the seller charges IGST (Integrated GST) at the full rate instead, so the same sale to a buyer in Bengaluru would carry 18% IGST. Some union territories use UTGST in place of SGST.' },
    { title: 'What are the GST rates?', text: 'GST has a few rate slabs (fixed rate levels). Some basic items, such as fresh vegetables and unbranded fresh milk, are exempt, which means no GST is charged on them. Many everyday items are taxed at a low rate, most other goods and services at a standard rate, and some luxury and harmful goods at a higher rate. The GST Council, chaired by the Union Finance Minister with ministers from every state, decides the rates and has changed them several times since 2017. Look up the rate for your exact item using its HSN code (for goods) or SAC code (for services). Any rates in this FAQ are examples only.' },
    { title: 'What is input tax credit?', text: 'Input tax credit (ITC) lets you subtract the GST you paid on business purchases from the GST you collect on your sales, so that tax is not charged on tax. Example, with a 5% rate picked for easy maths: a bakery in Kochi buys flour and packing material for ₹10,000 plus ₹500 GST, and sells its cakes for ₹16,000 plus ₹800 GST. It pays only ₹800 − ₹500 = ₹300 to the government. To claim ITC you need a proper tax invoice, you must have received the goods or services, and your supplier must have filed their return. ITC is blocked on some purchases, such as things for personal use and many motor vehicles.' },
    { title: 'Which returns do I file, and when?', text: 'A return is a form that reports your sales, purchases and tax to the government. Most regular taxpayers file GSTR-1, which lists the details of their sales, and GSTR-3B, a summary return along with which the tax is paid. Monthly filers usually file GSTR-1 by the 11th and GSTR-3B by the 20th of the next month. Small businesses with turnover up to ₹5 crore can choose the QRMP scheme (Quarterly Return, Monthly Payment): they file returns every quarter but still pay tax every month. Due dates are sometimes extended, so check the return calendar on the GST portal.' },
    { title: 'What happens if I file late, or not at all?', text: 'If you file a return late, you pay a late fee for each day of delay, with a smaller fee for a nil return (a return for a period with no sales). If you pay tax late, you also pay interest on the unpaid amount. Even in a month with no sales, you still have to file a nil return. If you stop filing returns for a long time, the department can cancel your registration. Running a business without registering when you are required to can lead to a penalty on top of the tax that is due.' },
    { title: 'What is the composition scheme?', text: 'The composition scheme is a simpler option for small taxpayers. Traders, manufacturers and restaurants with turnover up to ₹1.5 crore (less in special-category states) can opt for it, and there is a separate option for small service providers. They pay a small fixed percentage of their turnover instead of normal GST, and file fewer returns. The trade-off is that a composition taxpayer cannot claim input tax credit, cannot collect GST from customers on the bill, cannot sell to other states, and must issue a bill of supply instead of a tax invoice.' },
    { title: 'What must a tax invoice show?', text: 'A tax invoice must show your name, address and GSTIN, an invoice number and date, the buyer’s name (and GSTIN if the buyer is registered), a description of the goods or services with their HSN or SAC code, the quantity, the taxable value, the GST rate and amount, the place of supply and your signature. Larger businesses, above a turnover limit set by the government, must create e-invoices through an official portal. To move goods worth more than ₹50,000, you usually need an e-way bill, generated online before the goods travel.' },
    { title: 'Can I register even if my turnover is below the limit?', text: 'Yes. Voluntary registration lets you claim input tax credit on your purchases, and it can make it easier to sell to large companies, which often prefer registered suppliers. Once registered, you must follow all the rules for a registered business, including filing returns on time, even in months with no sales. If your business closes or you no longer need to be registered, you can apply on the portal to cancel your registration.' },
    { title: 'What is reverse charge?', text: 'Usually the seller collects GST from the buyer and pays it to the government. Under reverse charge, the buyer pays the GST directly instead. It applies to certain listed goods and services, for example services from a goods transport agency or legal services from an advocate to a business. If you receive such a supply, you pay the tax yourself and can usually claim it back as input tax credit.' }
  ];

  // Preset questions. "answer" is copied word for word from the FAQ: it is the passage a good retriever must find.
  var PRESETS = [
    { id: 'gstin', q: 'How many characters does a GSTIN have, and what do they stand for?',
      answer: 'It has 15 characters: the first two digits are your state code, the next ten characters are your PAN, then come an entity number, the letter Z by default, and a final check character.' },
    { id: 'limit', q: 'What is the turnover limit for GST registration if I sell only goods?',
      answer: 'In most states the limit is ₹40 lakh a year if you sell only goods, and ₹20 lakh a year if you provide services or sell both goods and services.' },
    { id: 'docs', q: 'Which documents do I need to register?',
      answer: 'You will usually need your PAN, Aadhaar, a photograph, proof of your business address (such as a rent agreement or an electricity bill) and your bank account details.' },
    { id: 'igst', q: 'A shop in Pune sells to a buyer in Bengaluru. Does it charge CGST and SGST, or IGST?',
      answer: 'When the place of supply is in another state, the seller charges IGST (Integrated GST) at the full rate instead, so the same sale to a buyer in Bengaluru would carry 18% IGST.' },
    { id: 'nil', q: 'Do I have to file a return in a month when I sold nothing?',
      answer: 'Even in a month with no sales, you still have to file a nil return.' },
    { id: 'comp', q: 'Can a business in the composition scheme claim input tax credit?',
      answer: 'The trade-off is that a composition taxpayer cannot claim input tax credit, cannot collect GST from customers on the bill, cannot sell to other states, and must issue a bill of supply instead of a tax invoice.' },
    { id: 'vdue', vague: true, means: 'when is my monthly GSTR-3B return due?', q: 'When is it due?',
      answer: 'Monthly filers usually file GSTR-1 by the 11th and GSTR-3B by the 20th of the next month.' },
    { id: 'vpay', vague: true, means: 'how much GST goes to the government after I subtract the GST I paid on purchases?', q: 'How much will I pay?',
      answer: 'Input tax credit (ITC) lets you subtract the GST you paid on business purchases from the GST you collect on your sales, so that tax is not charged on tax. Example, with a 5% rate picked for easy maths: a bakery in Kochi buys flour and packing material for ₹10,000 plus ₹500 GST, and sells its cakes for ₹16,000 plus ₹800 GST. It pays only ₹800 − ₹500 = ₹300 to the government.' }
  ];

  /* ---------- turning text into search terms ---------- */
  // Very common words carry no meaning for search, so both methods skip them ("stop words").
  var STOP = {};
  ('a an the and or but if then else of to in on at by for with from as into onto about over under than ' +
    'is are was were be been being am do does did done have has had having ' +
    'i me my mine we us our you your yours he him his she her it its they them their this that these those ' +
    'what which who whom whose when where why how can could should would will shall may might must ' +
    'not no nor so too very just also only own same other such any each some all both few more most ' +
    'much many there here up down out off again once ll re ve don doesn didn isn aren won let get got ' +
    'yes ok please tell know want like').split(' ').forEach(function (w) { STOP[w] = true; });

  // Fold plurals so "invoices" matches "invoice" (a tiny stand-in for a real stemmer).
  function fold(w) {
    if (/^[0-9]/.test(w) || w.length <= 3) return w;
    if (/ies$/.test(w) && w.length > 4) return w.slice(0, -3) + 'y';
    if (/(sses|xes|ches|shes|oes)$/.test(w)) return w.slice(0, -2);
    if (/s$/.test(w) && !/(ss|us|is)$/.test(w)) return w.slice(0, -1);
    return w;
  }
  // One word of text can hold several terms ("GSTR-3B" gives "gstr" and "3b"); each term keeps its source form.
  function termsOf(text) {
    var out = [], parts = String(text).toLowerCase().replace(/['’]s\b/g, '').split(/[^a-z0-9]+/);
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (!p || STOP[p]) continue;
      if (p.length < 2 && !/^[0-9]$/.test(p)) continue;
      out.push(fold(p));
    }
    return out;
  }
  function queryTerms(q) { return termsOf(q); }

  /* ---------- the document as a list of words ---------- */
  var DOC = null;
  function buildDoc() {
    if (DOC) return DOC;
    var words = [], sections = [];
    SECTIONS.forEach(function (s, si) {
      var start = words.length;
      var hw = s.title.split(/\s+/), bw = s.text.split(/\s+/);
      hw.forEach(function (t, j) { words.push({ t: t, sec: si, head: true, headEnd: j === hw.length - 1, terms: termsOf(t) }); });
      bw.forEach(function (t) { words.push({ t: t, sec: si, head: false, headEnd: false, terms: termsOf(t) }); });
      sections.push({ title: s.title, start: start, end: words.length });
    });
    DOC = { words: words, sections: sections, N: words.length };
    return DOC;
  }
  // Where a passage (copied word for word) sits in the document: [first word, one past the last word).
  function findSpan(doc, text) {
    var aw = text.split(/\s+/), W = doc.words;
    for (var s = 0; s + aw.length <= W.length; s++) {
      var ok = true;
      for (var j = 0; j < aw.length && ok; j++) if (W[s + j].t !== aw[j]) ok = false;
      if (ok) return [s, s + aw.length];
    }
    return null;
  }

  /* ---------- chunking: a sliding window of `size` words that moves on by (size - overlap) words ---------- */
  function makeChunks(N, size, overlap) {
    var step = Math.max(1, size - overlap), chunks = [];
    for (var s = 0; s < N; s += step) {
      var e = Math.min(N, s + size);
      chunks.push({ start: s, end: e });
      if (e >= N) break;
    }
    return chunks;
  }

  /* ---------- the search index: term counts per chunk, and in how many chunks each term appears ---------- */
  function buildIndex(doc, chunks) {
    var tf = [], len = [], df = Object.create(null), total = 0;
    chunks.forEach(function (c) {
      var m = Object.create(null), L = 0;
      for (var w = c.start; w < c.end; w++) {
        var ts = doc.words[w].terms;
        for (var j = 0; j < ts.length; j++) { m[ts[j]] = (m[ts[j]] || 0) + 1; L++; }
      }
      for (var t in m) df[t] = (df[t] || 0) + 1;
      tf.push(m); len.push(L); total += L;
    });
    var N = chunks.length, idx = { chunks: chunks, tf: tf, len: len, df: df, N: N, avgdl: N ? total / N : 0, norm: [] };
    // TF-IDF vector length of every chunk (raw counts x smoothed IDF, as in scikit-learn's TfidfVectorizer defaults)
    for (var i = 0; i < N; i++) {
      var s2 = 0;
      for (var t2 in tf[i]) { var v = tf[i][t2] * tfidfIdf(idx, t2); s2 += v * v; }
      idx.norm.push(Math.sqrt(s2));
    }
    return idx;
  }
  var BM25_K1 = 1.2, BM25_B = 0.75;   // the usual defaults (Lucene and Elasticsearch use these)
  function bm25Idf(idx, t) { var n = idx.df[t] || 0; return Math.log(1 + (idx.N - n + 0.5) / (n + 0.5)); }
  function tfidfIdf(idx, t) { return Math.log((1 + idx.N) / (1 + (idx.df[t] || 0))) + 1; }

  // Scores every chunk. contrib[i] maps each question term to its share of chunk i's score (the shares add up to the score).
  function scoreAll(idx, qterms, method) {
    var N = idx.N, scores = new Array(N), contrib = new Array(N), i, t;
    var qtf = Object.create(null);
    for (i = 0; i < qterms.length; i++) qtf[qterms[i]] = (qtf[qterms[i]] || 0) + 1;
    if (method === 'bm25') {
      // BM25: sum over question words of idf x tf(k1 + 1) / (tf + k1(1 - b + b * len / avglen)); a word asked twice counts twice
      for (i = 0; i < N; i++) {
        var s = 0, c = {}, lenNorm = BM25_K1 * (1 - BM25_B + BM25_B * (idx.avgdl ? idx.len[i] / idx.avgdl : 1));
        for (t in qtf) {
          var f = idx.tf[i][t];
          if (!f) continue;
          var part = qtf[t] * bm25Idf(idx, t) * f * (BM25_K1 + 1) / (f + lenNorm);
          c[t] = part; s += part;
        }
        scores[i] = s; contrib[i] = c;
      }
    } else {
      // TF-IDF cosine: the question becomes a vector over the chunks' vocabulary (words no chunk contains are dropped)
      var qv = Object.create(null), qn = 0;
      for (t in qtf) if (idx.df[t]) { qv[t] = qtf[t] * tfidfIdf(idx, t); qn += qv[t] * qv[t]; }
      qn = Math.sqrt(qn);
      for (i = 0; i < N; i++) {
        var dot = 0, c2 = {};
        if (qn > 0 && idx.norm[i] > 0) {
          for (t in qv) {
            var f2 = idx.tf[i][t];
            if (!f2) continue;
            var p2 = qv[t] * f2 * tfidfIdf(idx, t) / (qn * idx.norm[i]);
            c2[t] = p2; dot += p2;
          }
        }
        scores[i] = dot; contrib[i] = c2;
      }
    }
    return { scores: scores, contrib: contrib };
  }
  /* ENGINE END */


  /* ---------- lab settings ---------- */
  var DEF = { size: 60, overlap: 0, k: 3, method: 'bm25', limit: 1000, preset: 'gstin' };
  var SIZE_MIN = 20, SIZE_MAX = 300, SIZE_STEP = 10, OVERLAP_STEP = 5, K_MAX = 10;
  var LIMIT_MIN = 250, LIMIT_MAX = 4000, LIMIT_STEP = 250;
  var CHARS_PER_TOKEN = 4;
  var RIGHT_SHARE = 0.3;   // the top chunk "holds the answer" when it has at least 30% of the answer (or of itself, if it is smaller)
  var INSTRUCTIONS = 'Answer using only the context below. If the context does not contain the answer, say "I don\'t know". Mention the numbers of the context pieces you used.';
  var METHOD_NAME = { bm25: 'BM25', tfidf: 'TF-IDF cosine' };
  var METHOD_TEXT = {
    bm25: 'BM25 (“Best Matching 25”, the classic search-engine score): for each word of your question found in a chunk, it adds that word’s rarity (a word in few chunks counts more). A word repeated in the chunk helps, but less and less each time, and long chunks are marked down a little so they do not win just by being long.',
    tfidf: 'TF-IDF cosine: each chunk and your question become lists of word weights (TF-IDF = how often a word appears in the chunk, times how rare it is across chunks). The score is the cosine similarity of the two lists: 0 means no shared words, 1 means the same words in the same mix.'
  };
  var TASKS = [
    { id: 't1', text: 'Fit a whole answer into one chunk. The GSTIN answer starts out cut in two. Change the chunk size or the overlap until the whole answer sits inside one retrieved chunk.' },
    { id: 't2', text: 'Pick “Which documents do I need to register?”. The chunk with its answer ranks just below the top k. Raise k until the answer gets into the prompt.' },
    { id: 't3', text: 'Pick the vague question “When is it due?” and see the top chunk talk about something else. Then reword the question in the box until the top-ranked chunk holds the answer.' },
    { id: 't4', text: 'Overflow the context limit: raise k and the chunk size until the prompt needs more tokens than the limit allows.' }
  ];

  /* ---------- small helpers ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  // Indian digit grouping: 125000 -> 1,25,000
  function fmtInt(n) {
    var neg = n < 0, s = String(Math.round(Math.abs(n)));
    if (s.length > 3) s = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3);
    return (neg ? '−' : '') + s;
  }
  function fmtScore(v, method) { return method === 'bm25' ? v.toFixed(2) : v.toFixed(3); }
  function ordinal(n) { var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  function listAnd(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  function normQ(q) { return String(q).toLowerCase().replace(/\s+/g, ' ').trim(); }
  function presetById(id) { for (var i = 0; i < PRESETS.length; i++) if (PRESETS[i].id === id) return PRESETS[i]; return null; }
  // the question's search terms with the word the learner typed (so "goods" shows as "goods", not "good")
  function termForms(q) {
    var forms = Object.create(null), list = [];
    String(q).split(/\s+/).forEach(function (w) {
      var raw = w.toLowerCase().replace(/['’]s\b/g, '').split(/[^a-z0-9]+/);
      termsOf(w).forEach(function (t) {
        if (!forms[t]) { forms[t] = raw.filter(function (r) { return r && fold(r) === t; })[0] || t; list.push(t); }
      });
    });
    return { forms: forms, list: list };
  }

  /* ---------- colours (read from the site's CSS variables at draw time) ---------- */
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
  function rgbStr(c, a) { return a == null ? 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')' : 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function mix(a, b, t) { return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)]; }
  function luminance(c) {
    function ch(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2]);
  }
  function contrast(a, b) { var la = luminance(a), lb = luminance(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); }
  var THEME_VARS = ['--surface', '--surface-2', '--ink', '--muted', '--line', '--haldi', '--indigo', '--on-indigo', '--ok', '--font-body'];
  var themeCache = { key: '', theme: null };
  function readTheme() {
    var cs = getComputedStyle(document.documentElement), raw = {}, key = '';
    for (var i = 0; i < THEME_VARS.length; i++) { raw[THEME_VARS[i]] = cs.getPropertyValue(THEME_VARS[i]).trim(); key += raw[THEME_VARS[i]] + '|'; }
    if (themeCache.key === key && themeCache.theme) return themeCache.theme;
    var T = {
      surface: toRgb(raw['--surface']), surface2: toRgb(raw['--surface-2']), ink: toRgb(raw['--ink']), muted: toRgb(raw['--muted']),
      line: toRgb(raw['--line']), haldi: toRgb(raw['--haldi']), indigo: toRgb(raw['--indigo']),
      onIndigo: toRgb(raw['--on-indigo'] || raw['--surface']), ok: toRgb(raw['--ok']),
      font: raw['--font-body'] || 'system-ui, sans-serif'
    };
    T.dark = luminance(T.surface) < 0.2;
    themeCache = { key: key, theme: T };
    return T;
  }
  // the colour of a chunk bar: pale for a low score, deep turmeric for the best score
  function heat(T, t) { return mix(T.surface2, T.haldi, 0.16 + 0.84 * clamp(t, 0, 1)); }

  /* ---------- small inline SVG swatches for the legend ---------- */
  function svgIcon(inner, w) {
    return '<svg width="' + (w || 14) + '" height="14" viewBox="0 0 ' + (w || 14) + ' 14" aria-hidden="true" focusable="false" style="flex:none;overflow:visible">' + inner + '</svg>';
  }
  function legendItem(svg, text) { return '<i style="font-style:normal;display:inline-flex;align-items:center;gap:6px">' + svg + text + '</i>'; }

  /* ================================================================ */
  function mount(root, ctx) {
    var P = 'rag' + (++mountCount) + '-';
    var doc = buildDoc();
    var ANS = {};
    PRESETS.forEach(function (p) { ANS[p.id] = findSpan(doc, p.answer); });
    var listeners = [];
    function on(el, type, fn, opts) { el.addEventListener(type, fn, opts); listeners.push([el, type, fn, opts]); }
    var destroyed = false;

    var presetOpts = PRESETS.map(function (p) {
      return '<option value="' + p.id + '"' + (p.id === DEF.preset ? ' selected' : '') + '>' + esc((p.vague ? 'Vague: ' : '') + p.q) + '</option>';
    }).join('') + '<option value="">My own question (no answer to check)</option>';
    var tasksHtml = TASKS.map(function (t) { return '<li data-task="' + t.id + '">' + esc(t.text) + '</li>'; }).join('');
    var heatSvg = svgIcon('<defs><linearGradient id="' + P + 'lg"><stop offset="0" stop-color="var(--surface-2)"/><stop offset="1" stop-color="var(--haldi)"/></linearGradient></defs>' +
      '<rect x="0.5" y="2.5" width="33" height="9" rx="2" fill="url(#' + P + 'lg)" stroke="var(--line)"/>', 34);
    var legendHtml =
      legendItem(heatSvg, 'chunk score: low to high') +
      legendItem(svgIcon('<circle cx="7" cy="7" r="6.2" fill="var(--indigo)" stroke="var(--surface)" stroke-width="1"/><text x="7" y="10.2" text-anchor="middle" font-size="9" font-weight="700" fill="var(--on-indigo)" font-family="var(--font-body)">1</text>'), 'rank of a retrieved chunk (outlined)') +
      legendItem(svgIcon('<rect x="0" y="5" width="14" height="4" rx="1" fill="var(--ok)"/>'), 'where the answer is') +
      legendItem(svgIcon('<rect x="2" y="1" width="10" height="12" rx="2" fill="var(--surface-2)" stroke="var(--line)"/><rect x="5" y="1" width="1.6" height="12" fill="var(--ink)"/><rect x="8.4" y="1" width="1.6" height="12" fill="var(--ink)"/>'), 'a word from your question') +
      legendItem(svgIcon('<text x="7" y="11" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="var(--font-body)">4</text>'), 'section 4 starts here');

    var top = document.createElement('div');
    top.className = 'lab';
    top.innerHTML =
      '<p class="lab-note"><strong>What you are seeing:</strong> RAG (retrieval-augmented generation) means that before a chatbot answers, the app first searches your own documents and pastes the best pieces into the prompt (the text sent to the LLM, the large language model). Here the document is a short help guide: an FAQ about GST (Goods and Services Tax) for small businesses in India. ' +
        'It is cut into <em>chunks</em> (pieces of a fixed number of words). The strip shows the whole guide from start to end, row by row, like lines on a page. Each bar is one chunk; neighbouring chunks sit on two lanes, so you can see where they <em>overlap</em> (share words). ' +
        'Every chunk gets a score for your question; the deeper the colour, the higher the score. The <em>top k</em> (the k best chunks) are numbered, and only they go into the prompt.</p>' +
      '<div class="lab-body">' +
        '<div class="stack-sm" id="' + P + 'left">' +
          '<div class="lab-canvas-wrap" id="' + P + 'wrap" style="aspect-ratio:auto;height:300px">' +
            '<canvas id="' + P + 'strip" tabindex="0" role="img" aria-label="Chunk strip" aria-describedby="' + P + 'kbd" style="touch-action:manipulation;cursor:pointer;outline-offset:-3px"></canvas></div>' +
          '<div class="lab-legend">' + legendHtml + '</div>' +
          '<p class="small muted">Tap or click any chunk in the strip to read it here.</p>' +
          '<div id="' + P + 'insp" class="card" style="padding:12px 14px"></div>' +
          '<div class="lab-stats" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr))">' +
            '<div class="stat"><div class="k">Chunks</div><div class="v" id="' + P + 'sn">–</div></div>' +
            '<div class="stat"><div class="k">Answer</div><div class="v" id="' + P + 'sa">–</div></div>' +
            '<div class="stat"><div class="k">Prompt tokens</div><div class="v" id="' + P + 'st">–</div></div>' +
            '<div class="stat"><div class="k">Top score</div><div class="v" id="' + P + 'ss">–</div></div>' +
          '</div>' +
          '<p class="kbd-hint" id="' + P + 'kbd">Keyboard: focus the strip, then use the left and right arrow keys to read the chunks one by one (Home and End jump to the first and last).</p>' +
          '<div class="stack" id="' + P + 'more">' +
            '<div class="stack-sm"><h2 class="lab-h" id="' + P + 'rh">Retrieved chunks</h2>' +
              '<p class="small muted">The words of your question are <mark style="background:var(--haldi-soft);color:var(--ink);padding:0 2px;border-radius:3px">marked</mark>, and the known answer is <span style="text-decoration:underline;text-decoration-color:var(--ok);text-decoration-thickness:2px;text-underline-offset:3px">underlined in green</span>.</p>' +
              '<ol id="' + P + 'list" style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px"></ol></div>' +
            '<div class="stack-sm"><h2 class="lab-h">The prompt sent to the LLM</h2>' +
              '<div id="' + P + 'meter"></div>' +
              '<pre id="' + P + 'prompt" tabindex="0" role="region" aria-label="The full prompt" style="white-space:pre-wrap;overflow-wrap:anywhere;max-height:24em;overflow:auto;font-size:.82rem"></pre>' +
              '<p class="small muted">No LLM is called here: this lab is only about the retrieval step. A token is a piece of a word; English averages about 4 characters per token, so the count is an estimate. The model’s answer must fit in the context limit too, so real apps keep space spare.</p></div>' +
          '</div>' +
        '</div>' +
        '<div class="lab-controls">' +
          '<h2 class="lab-h">Ask the guide</h2>' +
          '<div class="control"><label for="' + P + 'preset">Preset question</label>' +
            '<select id="' + P + 'preset" style="width:100%">' + presetOpts + '</select></div>' +
          '<div class="control"><label for="' + P + 'q">Question sent to the retriever (edit it or type your own)</label>' +
            '<textarea id="' + P + 'q" rows="3" maxlength="300" spellcheck="false" style="min-height:0"></textarea>' +
            '<p class="small muted" id="' + P + 'kw"></p></div>' +
          '<div id="' + P + 'check" style="background:var(--surface);border:1px solid var(--line);border-left:4px solid var(--line);border-radius:var(--radius-sm);padding:10px 12px;font-size:.92rem"></div>' +
          '<h2 class="lab-h">Retrieval settings</h2>' +
          '<div class="control"><span class="control-label" id="' + P + 'mlbl">Scoring method</span>' +
            '<div class="seg" role="group" aria-labelledby="' + P + 'mlbl">' +
              '<button type="button" data-method="bm25" aria-pressed="true">BM25</button>' +
              '<button type="button" data-method="tfidf" aria-pressed="false">TF-IDF cosine</button>' +
            '</div>' +
            '<p class="small muted" id="' + P + 'mdesc"></p>' +
            '<p class="small muted">Both are keyword methods: they only see words that match exactly (we do fold plurals, so “invoices” matches “invoice”, and skip very common words such as “the” or “when”). Real RAG apps often use <em>embeddings</em> instead (lists of numbers that capture meaning, so “deadline” could match “due date”), but the idea is the same: score every chunk, rank them, keep the top k.</p></div>' +
          '<div class="control"><label for="' + P + 'size">Chunk size (words) <output id="' + P + 'sizeo" for="' + P + 'size"></output></label>' +
            '<input type="range" id="' + P + 'size" min="' + SIZE_MIN + '" max="' + SIZE_MAX + '" step="' + SIZE_STEP + '" value="' + DEF.size + '"></div>' +
          '<div class="control"><label for="' + P + 'ov">Overlap (words shared with the next chunk) <output id="' + P + 'ovo" for="' + P + 'ov"></output></label>' +
            '<input type="range" id="' + P + 'ov" min="0" max="' + Math.floor(DEF.size / 2) + '" step="' + OVERLAP_STEP + '" value="' + DEF.overlap + '">' +
            '<p class="small muted" id="' + P + 'ovnote"></p></div>' +
          '<div class="control"><label for="' + P + 'k">Top k (chunks put in the prompt) <output id="' + P + 'ko" for="' + P + 'k"></output></label>' +
            '<input type="range" id="' + P + 'k" min="1" max="' + K_MAX + '" step="1" value="' + DEF.k + '"></div>' +
          '<div class="control"><label for="' + P + 'lim">Context limit (tokens the LLM can read at once) <output id="' + P + 'limo" for="' + P + 'lim"></output></label>' +
            '<input type="range" id="' + P + 'lim" min="' + LIMIT_MIN + '" max="' + LIMIT_MAX + '" step="' + LIMIT_STEP + '" value="' + DEF.limit + '">' +
            '<p class="small muted">Real models read from about 8,000 to over 1,00,000 tokens. The limit here is small because the guide is small.</p></div>' +
          '<div class="row"><button type="button" class="btn btn-sm" id="' + P + 'reset">Reset settings</button></div>' +
          '<div class="stack-sm"><h2 class="lab-h">Your tasks</h2><ul class="lab-tasks" id="' + P + 'tasks">' + tasksHtml + '</ul></div>' +
          '<p class="visually-hidden" role="status" aria-live="polite" id="' + P + 'live"></p>' +
        '</div>' +
      '</div>' +
      '<p class="small muted"><strong style="color:var(--ink)">Why it matters in real ML:</strong> when a RAG chatbot gives a wrong answer, the cause is very often the retrieval step, not the LLM: if the right chunk never reaches the prompt, the model cannot use it, and if the prompt is too long, the request fails or text gets cut. That is why teams tune chunk size, overlap and k, and test retrieval on questions with known answers (just like the answer check here) before trusting a bot.</p>';
    root.appendChild(top);

    function $(id) { return top.querySelector('#' + P + id); }
    var wrap = $('wrap'), canvas = $('strip'), g = canvas.getContext('2d');
    var leftCol = $('left'), more = $('more'), body = top.querySelector('.lab-body');
    var elInsp = $('insp'), elSN = $('sn'), elSA = $('sa'), elST = $('st'), elSS = $('ss');
    var elList = $('list'), elRH = $('rh'), elMeter = $('meter'), elPrompt = $('prompt');
    var elPreset = $('preset'), elQ = $('q'), elKw = $('kw'), elCheck = $('check'), elMDesc = $('mdesc');
    var elSize = $('size'), elSizeO = $('sizeo'), elOv = $('ov'), elOvO = $('ovo'), elOvNote = $('ovnote');
    var elK = $('k'), elKO = $('ko'), elLim = $('lim'), elLimO = $('limo'), btnReset = $('reset'), elLive = $('live');
    var methodBtns = top.querySelectorAll('[data-method]');
    var taskEls = {};
    Array.prototype.forEach.call(top.querySelectorAll('[data-task]'), function (li) { taskEls[li.getAttribute('data-task')] = li; });

    /* ---------- state ---------- */
    var S = {
      size: DEF.size, overlap: DEF.overlap, k: DEF.k, method: DEF.method, limit: DEF.limit,
      target: DEF.preset, text: presetById(DEF.preset).q,
      insp: -1, inspPicked: false, hover: -1,
      chunkTouched: false, lastChange: '', notWhole: {}, vagueWrong: {}
    };
    var R = null;            // the latest retrieval result
    var prevEval = null;     // the evaluation before the latest change (for task 2)
    var idxCache = { key: '', idx: null };
    var done = {};
    var dims = { w: 0, h: 0, dpr: 1 };
    var rafId = 0, heightRaf = 0, layoutRaf = 0, announceTimer = 0, pendingTask = '';

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
      var n = TASKS.map(function (t) { return t.id; }).indexOf(id) + 1;
      pendingTask = 'Task ' + n + ' done.';
      scheduleAnnounce(200);
      if (ctx && ctx.onTaskDone) ctx.onTaskDone(id);
    }

    /* ---------- retrieval ---------- */
    function getIndex() {
      var key = S.size + '|' + S.overlap;
      if (idxCache.key !== key) idxCache = { key: key, idx: buildIndex(doc, makeChunks(doc.N, S.size, S.overlap)) };
      return idxCache.idx;
    }
    function overlapOf(c, span) { return Math.max(0, Math.min(c.end, span[1]) - Math.max(c.start, span[0])); }
    function rightMin(span, c) { return Math.max(1, Math.ceil(RIGHT_SHARE * Math.min(span[1] - span[0], c.end - c.start))); }

    function evaluate() {
      var idx = getIndex(), chunks = idx.chunks, qt = queryTerms(S.text), tf = termForms(S.text);
      var res = scoreAll(idx, qt, S.method), sc = res.scores, i;
      var order = [];
      for (i = 0; i < sc.length; i++) if (sc[i] > 0) order.push(i);
      order.sort(function (a, b) { return sc[b] - sc[a] || a - b; });
      var rank = new Array(chunks.length);
      for (i = 0; i < rank.length; i++) rank[i] = 0;
      order.forEach(function (ci, j) { rank[ci] = j + 1; });
      var got = order.slice(0, S.k), gotSet = {};
      got.forEach(function (ci) { gotSet[ci] = true; });
      var maxScore = order.length ? sc[order[0]] : 0;
      var qset = Object.create(null);
      qt.forEach(function (t) { qset[t] = true; });

      // the answer check: which chunks hold the known answer, and did they make it into the top k?
      var span = S.target ? ANS[S.target] : null, A = null;
      if (span) {
        var aLen = span[1] - span[0], holders = [], whole = [], covered = new Uint8Array(aLen);
        for (i = 0; i < chunks.length; i++) {
          var ov = overlapOf(chunks[i], span);
          if (!ov) continue;
          holders.push({ ci: i, words: ov });
          if (ov === aLen) whole.push(i);
          if (gotSet[i]) for (var w = Math.max(span[0], chunks[i].start); w < Math.min(span[1], chunks[i].end); w++) covered[w - span[0]] = 1;
        }
        var cov = 0;
        for (i = 0; i < aLen; i++) cov += covered[i];
        var wholeGot = whole.filter(function (ci) { return gotSet[ci]; });
        var status = wholeGot.length ? 'whole' : cov === aLen ? 'split' : cov > 0 ? 'part' : 'missed';
        var top1 = got.length ? got[0] : -1;
        A = {
          span: span, len: aLen, holders: holders, whole: whole, wholeGot: wholeGot, covered: cov, status: status,
          complete: cov === aLen, top1: top1, top1Words: top1 >= 0 ? overlapOf(chunks[top1], span) : 0,
          top1Right: top1 >= 0 && overlapOf(chunks[top1], span) >= rightMin(span, chunks[top1])
        };
        // the "main" chunk for the answer: the whole-answer chunk with the best rank, else the one with the most answer words
        var best = null;
        (whole.length ? whole.map(function (ci) { return { ci: ci, words: aLen }; }) : holders).forEach(function (h) {
          var r = rank[h.ci] || 1e9, br = best ? (rank[best.ci] || 1e9) : 1e9;
          if (!best || h.words > best.words || (h.words === best.words && r < br)) best = h;
        });
        A.main = best ? best.ci : -1;
      }

      // the prompt
      var ctxParts = got.map(function (ci, j) { return '[' + (j + 1) + '] (chunk ' + (ci + 1) + ')\n' + chunkPlain(chunks[ci]); });
      var prompt = INSTRUCTIONS + '\n\nContext:\n' + (ctxParts.length ? ctxParts.join('\n\n') : '(no chunk matched the question)') +
        '\n\nQuestion: ' + S.text.replace(/\s+/g, ' ').trim() + '\nAnswer:';
      var tokens = Math.ceil(prompt.length / CHARS_PER_TOKEN);

      R = {
        idx: idx, chunks: chunks, scores: sc, contrib: res.contrib, order: order, rank: rank, got: got, gotSet: gotSet,
        maxScore: maxScore, qset: qset, qterms: tf.list, forms: tf.forms, A: A, prompt: prompt, tokens: tokens,
        over: tokens > S.limit, key: S.size + '|' + S.overlap + '|' + S.method + '|' + S.target + '|' + normQ(S.text)
      };
      if (!S.inspPicked || S.insp >= chunks.length) {
        S.inspPicked = false;
        S.insp = A && A.main >= 0 ? A.main : got.length ? got[0] : 0;
      }
      if (S.hover >= chunks.length) S.hover = -1;
    }

    function chunkPlain(c) {
      var out = '';
      for (var w = c.start; w < c.end; w++) {
        var W = doc.words[w];
        if (w > c.start) { var pv = doc.words[w - 1]; out += pv.headEnd || (W.head && !pv.head) ? '\n' : ' '; }
        out += W.t;
      }
      return out;
    }
    function isMatch(W) { for (var j = 0; j < W.terms.length; j++) if (R.qset[W.terms[j]]) return true; return false; }
    function chunkHTML(c, maxWords) {
      var span = R.A ? R.A.span : null, html = '', inAns = false;
      var end = maxWords ? Math.min(c.end, c.start + maxWords) : c.end;
      for (var w = c.start; w < end; w++) {
        var W = doc.words[w], isAns = !!span && w >= span[0] && w < span[1], sep = '';
        if (w > c.start) { var pv = doc.words[w - 1]; sep = pv.headEnd || (W.head && !pv.head) ? '<br>' : ' '; }
        if (inAns && (!isAns || sep === '<br>')) { html += '</span>'; inAns = false; }
        html += sep;
        if (isAns && !inAns) { html += '<span style="text-decoration:underline;text-decoration-color:var(--ok);text-decoration-thickness:2px;text-underline-offset:3px">'; inAns = true; }
        var piece = esc(W.t);
        if (isMatch(W)) piece = '<mark style="background:var(--haldi-soft);color:var(--ink);padding:0 2px;border-radius:3px">' + piece + '</mark>';
        if (W.head) piece = '<strong>' + piece + '</strong>';
        html += piece;
      }
      if (inAns) html += '</span>';
      if (end < c.end) html += ' <span class="muted">… (' + (c.end - end) + ' more words)</span>';
      return html;
    }
    function sectionOf(c) { return doc.words[c.start].sec; }
    function whyScore(ci) {
      var cb = R.contrib[ci], parts = [];
      for (var t in cb) parts.push([t, cb[t]]);
      parts.sort(function (a, b) { return b[1] - a[1]; });
      if (!parts.length) return 'No word of your question is in this chunk, so its score is 0.';
      return 'Score ' + fmtScore(R.scores[ci], S.method) + ' = ' + parts.map(function (p) { return '“' + esc(R.forms[p[0]] || p[0]) + '” ' + fmtScore(p[1], S.method); }).join(' + ');
    }
    function chunkLabel(ci) { return 'chunk ' + (ci + 1); }
    function rankText(ci) {
      var r = R.rank[ci];
      if (!r) return 'score 0, not ranked';
      return 'ranked ' + ordinal(r) + (R.gotSet[ci] ? ', in the prompt' : ', not in the prompt');
    }

    /* ---------- text outside the canvas ---------- */
    var CHECK_COLOR = { whole: 'var(--ok)', split: 'var(--haldi)', part: 'var(--haldi)', missed: 'var(--bad)', none: 'var(--line)' };
    function checkText() {
      var A = R.A, p = presetById(S.target);
      if (!A) return { status: 'none', intro: '', main: '<strong>No answer to check.</strong> This is your own question, so the lab does not know where its answer is. Pick a preset question to see the answer check.', short: 'No check' };
      var reworded = normQ(S.text) !== normQ(p.q), intro = '';
      if (p.vague) intro = (reworded ? 'You have reworded the vague question. It means: ' : 'This vague question really means: ') + '<em>' + esc(p.means) + '</em>';
      else if (reworded) intro = 'You have reworded the preset. The check still looks for its answer.';
      var html, short;
      function where(ci) { return chunkLabel(ci) + ' (' + rankText(ci) + ')'; }
      var homes = (A.whole.length ? A.whole.slice() : A.holders.map(function (h) { return h.ci; }));
      homes.sort(function (a, b) { return (R.rank[a] || 1e9) - (R.rank[b] || 1e9) || a - b; });
      if (!R.order.length) {
        html = '<strong>✗ Nothing retrieved.</strong> No chunk shares a word with your question' + (R.qterms.length ? '' : ' (every word was a common word that the search skips)') + '. The answer is in ' + listAnd(homes.map(chunkLabel)) + '.';
        return { status: 'missed', intro: intro, main: html, short: 'Missed ✗' };
      }
      if (A.status === 'whole') {
        var bestCi = A.wholeGot.slice().sort(function (a, b) { return R.rank[a] - R.rank[b]; })[0];
        html = '<strong>✓ Whole answer retrieved.</strong> It sits inside ' + chunkLabel(bestCi) + ', ranked ' + ordinal(R.rank[bestCi]) + '.';
        short = 'Whole ✓';
      } else if (A.status === 'split') {
        var parts = A.holders.filter(function (h) { return R.gotSet[h.ci]; }).map(function (h) { return chunkLabel(h.ci); });
        html = '<strong>◐ Answer retrieved, but cut into pieces</strong> across ' + listAnd(parts) + '. The LLM has to stitch it back together.';
        short = 'Split';
      } else if (A.status === 'part') {
        var miss = A.holders.filter(function (h) { return !R.gotSet[h.ci]; }).map(function (h) { return where(h.ci); });
        html = '<strong>◔ Only part of the answer retrieved</strong> (' + A.covered + ' of ' + A.len + ' words). The rest is in ' + listAnd(miss) + '.';
        short = 'Part';
      } else {
        var m0 = homes[0];
        html = '<strong>✗ Answer not retrieved.</strong> It is in ' + listAnd(homes.map(where)) + '.' +
          (R.rank[m0] > S.k ? ' Only the top ' + S.k + ' go into the prompt.' : !R.rank[m0] ? ' It shares no word with your question.' : '');
        short = 'Missed ✗';
      }
      if (A.top1 >= 0 && !A.top1Words) html += ' The top chunk, ' + chunkLabel(A.top1) + ', holds none of the answer.';
      return { status: A.status, intro: intro, main: html, short: short };
    }
    function renderText() {
      var chunks = R.chunks, n = chunks.length;
      elSizeO.textContent = S.size;
      elOvO.textContent = S.overlap;
      elKO.textContent = S.k;
      elLimO.textContent = fmtInt(S.limit);
      elOvNote.textContent = S.overlap ? 'Each chunk starts ' + (S.size - S.overlap) + ' words after the one before. At most half the chunk size.' : 'No overlap: each chunk starts where the last one ended. At most half the chunk size.';
      elMDesc.textContent = METHOD_TEXT[S.method];
      // keywords
      elKw.innerHTML = R.qterms.length ? 'Words searched: ' + R.qterms.map(function (t) { return '<strong style="color:var(--ink)">' + esc(R.forms[t]) + '</strong>'; }).join(', ') + '. Common words are skipped.'
        : 'No words to search: every word is a common word that the search skips.';
      // answer check
      var ck = checkText();
      elCheck.innerHTML = (ck.intro ? '<p class="small" style="margin:0 0 6px">' + ck.intro + '</p>' : '') + '<p style="margin:0">' + ck.main + '</p>';
      elCheck.style.borderLeftColor = CHECK_COLOR[ck.status];
      // stats
      elSN.textContent = String(n);
      elSA.textContent = ck.short;
      elST.textContent = fmtInt(R.tokens) + ' / ' + fmtInt(S.limit);
      elSS.textContent = R.order.length ? fmtScore(R.maxScore, S.method) : '0';
      // retrieved list
      elRH.textContent = 'Retrieved chunks: top ' + S.k + ' by ' + METHOD_NAME[S.method];
      var items = R.got.map(function (ci, j) {
        var c = chunks[ci], A = R.A, tag = '';
        if (A) {
          var ow = overlapOf(c, A.span);
          if (ow === A.len) tag = '<span class="chip" style="background:transparent;color:var(--ink);border:1px solid var(--ok)">✓ holds the whole answer</span>';
          else if (ow) tag = '<span class="chip" style="background:transparent;color:var(--ink);border:1px solid var(--haldi)">◐ holds ' + ow + ' of ' + A.len + ' answer words</span>';
        }
        return '<li class="card" style="padding:12px 14px">' +
          '<div class="row-between"><strong>#' + (j + 1) + ' · Chunk ' + (ci + 1) + ' of ' + n + '</strong><span class="mono small">score ' + fmtScore(R.scores[ci], S.method) + '</span></div>' +
          '<p class="small muted" style="margin-top:2px">Section ' + (sectionOf(c) + 1) + ': ' + esc(SECTIONS[sectionOf(c)].title) + ' · words ' + fmtInt(c.start + 1) + '–' + fmtInt(c.end) + '</p>' +
          '<p class="small muted" style="margin-top:2px">' + whyScore(ci) + '</p>' +
          (tag ? '<div class="row" style="margin-top:6px">' + tag + '</div>' : '') +
          '<p style="margin-top:8px;font-size:.95rem">' + chunkHTML(c) + '</p></li>';
      });
      if (R.got.length < S.k) {
        items.push('<li class="small muted" style="padding:4px 2px">' + (R.order.length ? 'Only ' + R.order.length + (R.order.length === 1 ? ' chunk shares' : ' chunks share') + ' a word with your question, so k = ' + S.k + ' finds no more.' : 'No chunk shares a word with your question, so nothing is retrieved.') + '</li>');
      }
      elList.innerHTML = items.join('');
      // token meter + prompt
      var pct = Math.min(100, 100 * R.tokens / S.limit);
      elMeter.innerHTML =
        '<p class="small" style="margin-bottom:4px"><strong>≈ ' + fmtInt(R.tokens) + ' tokens</strong> (' + fmtInt(R.prompt.length) + ' characters ÷ 4) of a ' + fmtInt(S.limit) + '-token limit' +
          (R.over ? ': <strong>' + fmtInt(R.tokens - S.limit) + ' tokens too many.</strong> A real API would refuse the request, or the app would have to drop chunks.' : ' (' + Math.round(pct) + '% used).') + '</p>' +
        '<div class="bar" role="presentation" style="height:10px"><span style="width:' + pct.toFixed(1) + '%;background:' + (R.over ? 'var(--bad)' : 'var(--haldi)') + '"></span></div>';
      var cut = S.limit * CHARS_PER_TOKEN;
      if (R.over) {
        elPrompt.innerHTML = esc(R.prompt.slice(0, cut)) +
          '<span style="display:block;margin:6px 0;padding:4px 0;border-top:2px solid var(--bad);border-bottom:2px solid var(--bad);font-family:var(--font-body);font-weight:700;color:var(--ink)">✂ The ' + fmtInt(S.limit) + '-token limit ends here. The model never sees the text below.</span>' +
          '<span style="color:var(--muted);background:var(--bad-soft)">' + esc(R.prompt.slice(cut)) + '</span>';
      } else elPrompt.textContent = R.prompt;
      renderInspector();
      canvas.setAttribute('aria-label', stripLabel());
    }
    function renderInspector() {
      var c = R.chunks[S.insp];
      if (!c) { elInsp.innerHTML = ''; return; }
      var note = '';
      if (!S.inspPicked) note = R.A && S.insp === R.A.main ? ' This is the chunk that holds the answer.' : ' This is the top-ranked chunk.';
      elInsp.innerHTML =
        '<p class="small"><strong>Chunk ' + (S.insp + 1) + ' of ' + R.chunks.length + '</strong> · ' + rankText(S.insp) + (R.rank[S.insp] ? ' · score ' + fmtScore(R.scores[S.insp], S.method) : '') + '.' + esc(note) + '</p>' +
        '<p class="small muted" style="margin-top:2px">Section ' + (sectionOf(c) + 1) + ': ' + esc(SECTIONS[sectionOf(c)].title) + ' · words ' + fmtInt(c.start + 1) + '–' + fmtInt(c.end) + '</p>' +
        '<p style="margin-top:6px;font-size:.92rem">' + chunkHTML(c, 80) + '</p>';
    }
    function stripLabel() {
      var s = 'The guide cut into ' + R.chunks.length + ' chunks of ' + S.size + ' words, ' + (S.overlap ? 'overlapping by ' + S.overlap + ' words' : 'with no overlap') + '. ';
      s += R.got.length ? 'Top ' + R.got.length + ' by ' + METHOD_NAME[S.method] + ': ' + listAnd(R.got.map(function (ci) { return 'chunk ' + (ci + 1) + ' (score ' + fmtScore(R.scores[ci], S.method) + ')'; })) + '. ' : 'No chunk matches the question. ';
      if (R.A) s += 'The answer is in ' + listAnd(R.A.holders.map(function (h) { return 'chunk ' + (h.ci + 1); })) + '. ';
      s += 'Showing chunk ' + (S.insp + 1) + ' below the strip.';
      return s;
    }
    function summary() {
      var ck = checkText(), s = 'Top ' + R.got.length + ' chunks by ' + METHOD_NAME[S.method] + '. ';
      s += R.A ? ck.main.replace(/<[^>]+>/g, '').replace(/[✓✗◐◔]\s*/g, '') + ' ' : '';
      s += 'Prompt about ' + fmtInt(R.tokens) + ' of ' + fmtInt(S.limit) + ' tokens' + (R.over ? ', over the limit.' : '.');
      return s;
    }
    function scheduleAnnounce(ms) {
      if (announceTimer) clearTimeout(announceTimer);
      announceTimer = setTimeout(function () {
        announceTimer = 0;
        if (destroyed) return;
        elLive.textContent = (pendingTask ? pendingTask + ' ' : '') + summary();
        pendingTask = '';
      }, ms);
    }

    /* ---------- task checks (after every change) ---------- */
    function checkTasks() {
      var A = R.A, p = presetById(S.target);
      if (A) {
        if (A.status !== 'whole') S.notWhole[S.target] = true;
        if (A.status === 'whole' && S.chunkTouched && S.notWhole[S.target]) completeTask('t1');
        if (S.lastChange === 'k' && prevEval && prevEval.key === R.key && S.k > prevEval.k && !prevEval.complete && A.complete) completeTask('t2');
        if (p && p.vague) {
          var asked = normQ(S.text) === normQ(p.q);
          if (asked && (A.top1 < 0 || A.top1Words === 0)) S.vagueWrong[p.id] = true;
          if (!asked && S.vagueWrong[p.id] && A.top1Right) completeTask('t3');
        }
      }
      if (R.over && (S.lastChange === 'k' || S.lastChange === 'size' || S.lastChange === 'overlap')) completeTask('t4');
      prevEval = { key: R.key, k: S.k, complete: !!(A && A.complete) };
    }
    function update(change, announceMs) {
      S.lastChange = change || '';
      evaluate();
      checkTasks();
      renderText();
      requestDraw();
      if (announceMs != null) scheduleAnnounce(announceMs);
    }

    /* ---------- the strip (canvas) ---------- */
    function geom() {
      var w = dims.w, small = w < 480;
      var padX = 10, padTop = 6, labelH = 12, laneH = small ? 10 : 12, laneGap = 2, ansGap = 3, ansH = 4, rowGap = small ? 7 : 9;
      var innerW = Math.max(40, w - 2 * padX);
      var rows = clamp(Math.ceil(doc.N * 2 / innerW), 3, 7);
      var wpr = Math.ceil(doc.N / rows), ppw = innerW / wpr;
      var rowH = labelH + 2 * laneH + laneGap + ansGap + ansH;
      return { padX: padX, padTop: padTop, labelH: labelH, laneH: laneH, laneGap: laneGap, ansGap: ansGap, ansH: ansH, rowGap: rowGap,
        rows: rows, wpr: wpr, ppw: ppw, rowH: rowH, height: Math.ceil(padTop * 2 + rows * rowH + (rows - 1) * rowGap) };
    }
    function laneY(G, row, lane) { return G.padTop + row * (G.rowH + G.rowGap) + G.labelH + lane * (G.laneH + G.laneGap); }
    // the pieces of a word range, one per row it crosses: [row, x0, x1]
    function pieces(G, s, e) {
      var out = [];
      for (var r = Math.floor(s / G.wpr); r <= Math.floor((e - 1) / G.wpr) && r < G.rows; r++) {
        var a = Math.max(s, r * G.wpr), b = Math.min(e, (r + 1) * G.wpr);
        out.push([r, G.padX + (a - r * G.wpr) * G.ppw, G.padX + (b - r * G.wpr) * G.ppw]);
      }
      return out;
    }
    function rr(x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      g.beginPath();
      g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.arcTo(x + w, y, x + w, y + r, r);
      g.lineTo(x + w, y + h - r); g.arcTo(x + w, y + h, x + w - r, y + h, r);
      g.lineTo(x + r, y + h); g.arcTo(x, y + h, x, y + h - r, r);
      g.lineTo(x, y + r); g.arcTo(x, y, x + r, y, r);
      g.closePath();
    }
    function chunkFill(T, ci) { return R.scores[ci] > 0 && R.maxScore > 0 ? heat(T, R.scores[ci] / R.maxScore) : T.surface2; }
    function outlineChunk(G, ci, colour, width, pad, dash) {
      var c = R.chunks[ci], lane = ci % 2;
      g.save();
      g.lineWidth = width; g.strokeStyle = colour;
      if (dash) g.setLineDash(dash);
      pieces(G, c.start, c.end).forEach(function (pc) {
        var y = laneY(G, pc[0], lane);
        rr(pc[1] + 0.5 - pad, y - pad, Math.max(1, pc[2] - pc[1] - 1) + 2 * pad, G.laneH + 2 * pad, 3 + pad);
        g.stroke();
      });
      g.restore();
    }
    function drawBars(T, G) {
      g.strokeStyle = rgbStr(T.ink, T.dark ? 0.28 : 0.2);
      g.lineWidth = 1;
      R.chunks.forEach(function (c, ci) {
        g.fillStyle = rgbStr(chunkFill(T, ci));
        pieces(G, c.start, c.end).forEach(function (pc) {
          rr(pc[1] + 0.5, laneY(G, pc[0], ci % 2) + 0.5, Math.max(1, pc[2] - pc[1] - 1), G.laneH - 1, 3);
          g.fill(); g.stroke();
        });
      });
    }
    // section starts: a thin line through the lanes and the section number above
    function drawSections(T, G) {
      g.font = '600 10px ' + T.font;
      g.textBaseline = 'top'; g.textAlign = 'left';
      doc.sections.forEach(function (sec, si) {
        var r = Math.floor(sec.start / G.wpr), x = Math.round(G.padX + (sec.start - r * G.wpr) * G.ppw), y0 = G.padTop + r * (G.rowH + G.rowGap);
        g.fillStyle = rgbStr(T.muted, 0.7);
        g.fillRect(x - 0.5, y0 + 1, 1, G.labelH - 1 + 2 * G.laneH + G.laneGap);
        g.fillStyle = rgbStr(T.muted);
        g.fillText(String(si + 1), x + 2, y0);
      });
    }
    // every word of the question: a tick inside each chunk that contains it, dark or light, whichever shows up better
    function drawTicks(T, G) {
      var chunks = R.chunks, step = S.size - S.overlap, tw = Math.max(1, Math.min(2, G.ppw * 0.75));
      for (var w = 0; w < doc.N; w++) {
        if (!isMatch(doc.words[w])) continue;
        var row = Math.floor(w / G.wpr), x = G.padX + (w - row * G.wpr) * G.ppw + G.ppw / 2 - tw / 2;
        for (var ci = Math.max(0, Math.ceil((w - S.size + 1) / step)); ci <= Math.floor(w / step) && ci < chunks.length; ci++) {
          if (w < chunks[ci].start || w >= chunks[ci].end) continue;
          var f = chunkFill(T, ci);
          g.fillStyle = rgbStr(contrast(f, T.ink) >= contrast(f, T.surface) ? T.ink : T.surface);
          g.fillRect(x, laneY(G, row, ci % 2) + 2, tw, G.laneH - 4);
        }
      }
    }
    function drawAnswer(T, G) {
      if (!R.A) return;
      g.fillStyle = rgbStr(T.ok);
      pieces(G, R.A.span[0], R.A.span[1]).forEach(function (pc) {
        rr(pc[1], laneY(G, pc[0], 1) + G.laneH + G.ansGap, Math.max(2, pc[2] - pc[1]), G.ansH, 2);
        g.fill();
      });
    }
    function drawBadges(T, G) {
      g.font = '700 10px ' + T.font;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      R.got.forEach(function (ci, j) {
        var c = R.chunks[ci], pcs = pieces(G, c.start, c.end), best = pcs[0];
        // the badge goes on the longest piece of the chunk, near its start
        pcs.forEach(function (pc) { if (pc[2] - pc[1] > best[2] - best[1] + 1) best = pc; });
        var cx = clamp(Math.min(best[1] + 9, (best[1] + best[2]) / 2), 8, dims.w - 8), cy = laneY(G, best[0], ci % 2) + G.laneH / 2;
        g.beginPath(); g.arc(cx, cy, 7, 0, Math.PI * 2);
        g.fillStyle = rgbStr(T.indigo); g.fill();
        g.lineWidth = 1.5; g.strokeStyle = rgbStr(T.surface); g.stroke();
        g.fillStyle = rgbStr(T.onIndigo);
        g.fillText(String(j + 1), cx, cy + 0.5);
      });
    }
    function draw() {
      rafId = 0;
      if (destroyed || !R || dims.w < 2) return;
      var T = readTheme(), G = geom();
      g.setTransform(dims.dpr, 0, 0, dims.dpr, 0, 0);
      g.fillStyle = rgbStr(T.surface);
      g.fillRect(0, 0, dims.w, dims.h);
      drawBars(T, G);
      drawSections(T, G);
      drawTicks(T, G);
      drawAnswer(T, G);
      R.got.forEach(function (ci) { outlineChunk(G, ci, rgbStr(T.ink), 1.6, 0.5); });
      if (S.hover >= 0 && S.hover !== S.insp) outlineChunk(G, S.hover, rgbStr(T.indigo), 1.5, 2, [3, 2]);
      if (S.insp >= 0 && S.insp < R.chunks.length) outlineChunk(G, S.insp, rgbStr(T.indigo), 2.2, 2.5);
      drawBadges(T, G);
    }
    function requestDraw() { if (!rafId && !destroyed) rafId = requestAnimationFrame(draw); }

    // which chunk is under a point of the strip (any spot in a row counts, so taps need not be exact)
    function chunkAt(px, py) {
      if (!R) return -1;
      var G = geom(), rowFull = G.rowH + G.rowGap, row = Math.floor((py - G.padTop + G.rowGap / 2) / rowFull);
      if (row < 0 || row >= G.rows) return -1;
      var yIn = py - G.padTop - row * rowFull, lane = yIn < G.labelH + G.laneH + G.laneGap / 2 ? 0 : 1;
      var w = row * G.wpr + Math.floor((px - G.padX) / G.ppw);
      if (px < G.padX - 4 || px > dims.w - G.padX + 4) return -1;
      w = clamp(w, row * G.wpr, Math.min(doc.N, (row + 1) * G.wpr) - 1);
      var step = S.size - S.overlap, any = -1;
      for (var ci = Math.max(0, Math.ceil((w - S.size + 1) / step)); ci <= Math.floor(w / step) && ci < R.chunks.length; ci++) {
        if (w < R.chunks[ci].start || w >= R.chunks[ci].end) continue;
        if (ci % 2 === lane) return ci;
        any = ci;
      }
      return any;
    }
    function inspect(ci, picked) {
      if (ci < 0 || !R || ci >= R.chunks.length) return;
      S.insp = ci; S.inspPicked = picked;
      renderInspector();
      canvas.setAttribute('aria-label', stripLabel());
      requestDraw();
    }

    /* ---------- pointer + keyboard on the strip ---------- */
    var ptr = { id: null, x0: 0, y0: 0, moved: false };
    function localPos(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    on(canvas, 'pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      ptr.id = e.pointerId; ptr.x0 = e.clientX; ptr.y0 = e.clientY; ptr.moved = false;
    });
    on(canvas, 'pointermove', function (e) {
      if (ptr.id === e.pointerId && Math.abs(e.clientX - ptr.x0) + Math.abs(e.clientY - ptr.y0) > 10) ptr.moved = true;
      if (e.pointerType === 'mouse') {
        var p = localPos(e), h = chunkAt(p.x, p.y);
        if (h !== S.hover) { S.hover = h; requestDraw(); }
      }
    });
    on(canvas, 'pointerup', function (e) {
      if (ptr.id !== e.pointerId) return;
      ptr.id = null;
      if (ptr.moved) return;
      var p = localPos(e), ci = chunkAt(p.x, p.y);
      if (ci >= 0) inspect(ci, true);
    });
    on(canvas, 'pointercancel', function () { ptr.id = null; });
    on(canvas, 'pointerleave', function (e) { if (e.pointerType === 'mouse' && S.hover !== -1) { S.hover = -1; requestDraw(); } });
    var inspTimer = 0;
    on(canvas, 'keydown', function (e) {
      if (!R) return;
      var n = R.chunks.length, ci = S.insp;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') ci = Math.min(n - 1, ci + 1);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ci = Math.max(0, ci - 1);
      else if (e.key === 'Home') ci = 0;
      else if (e.key === 'End') ci = n - 1;
      else return;
      e.preventDefault();
      inspect(ci, true);
      if (inspTimer) clearTimeout(inspTimer);
      inspTimer = setTimeout(function () {
        inspTimer = 0;
        if (destroyed) return;
        elLive.textContent = 'Chunk ' + (S.insp + 1) + ' of ' + R.chunks.length + ', ' + rankText(S.insp) + '. ' + SECTIONS[sectionOf(R.chunks[S.insp])].title;
      }, 400);
    });

    /* ---------- controls ---------- */
    function setOverlapMax() {
      var mx = Math.floor(S.size / 2 / OVERLAP_STEP) * OVERLAP_STEP;
      elOv.max = String(mx);
      if (S.overlap > mx) { S.overlap = mx; }
      elOv.value = String(S.overlap);
    }
    function onSize(settled) {
      var v = clamp(Math.round(+elSize.value / SIZE_STEP) * SIZE_STEP, SIZE_MIN, SIZE_MAX);
      if (v === S.size && !settled) return;
      var changed = v !== S.size;
      S.size = v; S.chunkTouched = S.chunkTouched || changed;
      if (changed) { S.inspPicked = false; S.hover = -1; }
      setOverlapMax();
      update(changed ? 'size' : S.lastChange, settled ? 500 : null);
    }
    function onOverlap(settled) {
      var v = clamp(Math.round(+elOv.value / OVERLAP_STEP) * OVERLAP_STEP, 0, Math.floor(S.size / 2));
      if (v === S.overlap && !settled) return;
      var changed = v !== S.overlap;
      S.overlap = v; S.chunkTouched = S.chunkTouched || changed;
      if (changed) { S.inspPicked = false; S.hover = -1; }
      update(changed ? 'overlap' : S.lastChange, settled ? 500 : null);
    }
    function onK(settled) {
      var v = clamp(Math.round(+elK.value), 1, K_MAX);
      if (v === S.k && !settled) return;
      var changed = v !== S.k;
      S.k = v;
      update(changed ? 'k' : S.lastChange, settled ? 500 : null);
    }
    function onLimit(settled) {
      var v = clamp(Math.round(+elLim.value / LIMIT_STEP) * LIMIT_STEP, LIMIT_MIN, LIMIT_MAX);
      if (v === S.limit && !settled) return;
      var changed = v !== S.limit;
      S.limit = v;
      update(changed ? 'limit' : S.lastChange, settled ? 500 : null);
    }
    on(elSize, 'input', function () { onSize(false); });
    on(elSize, 'change', function () { onSize(true); });
    on(elOv, 'input', function () { onOverlap(false); });
    on(elOv, 'change', function () { onOverlap(true); });
    on(elK, 'input', function () { onK(false); });
    on(elK, 'change', function () { onK(true); });
    on(elLim, 'input', function () { onLimit(false); });
    on(elLim, 'change', function () { onLimit(true); });
    on(elPreset, 'change', function () {
      var p = presetById(elPreset.value);
      if (p) { S.target = p.id; S.text = p.q; elQ.value = p.q; } else S.target = '';
      S.inspPicked = false;
      update('question', 400);
    });
    on(elQ, 'input', function () {
      S.text = elQ.value;
      S.inspPicked = false;
      update('question', 1200);
    });
    Array.prototype.forEach.call(methodBtns, function (b) {
      on(b, 'click', function () {
        var m = b.getAttribute('data-method');
        if (m === S.method) return;
        S.method = m;
        Array.prototype.forEach.call(methodBtns, function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-method') === m)); });
        update('method', 400);
      });
    });
    on(btnReset, 'click', function () {
      S.size = DEF.size; S.overlap = DEF.overlap; S.k = DEF.k; S.limit = DEF.limit; S.method = DEF.method;
      elSize.value = String(S.size); setOverlapMax(); elK.value = String(S.k); elLim.value = String(S.limit);
      Array.prototype.forEach.call(methodBtns, function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-method') === S.method)); });
      S.inspPicked = false; S.hover = -1;
      update('reset', 300);
    });

    /* ---------- theme, fonts, layout and size ---------- */
    function onTheme() { themeCache.key = ''; requestDraw(); }
    var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mql) { if (mql.addEventListener) mql.addEventListener('change', onTheme); else if (mql.addListener) mql.addListener(onTheme); }
    on(document, 'themechange', onTheme);
    var fontSet = document.fonts || null;
    if (fontSet && fontSet.addEventListener) on(fontSet, 'loadingdone', onTheme);
    if (fontSet && fontSet.ready && fontSet.ready.then) fontSet.ready.then(function () { if (!destroyed) onTheme(); }, function () { /* ignore */ });

    // style.css stacks .lab-body into one column at 820px; then the long results move below the controls,
    // so on a phone the sliders stay close to the strip. In a narrow box on a wide screen, stack too.
    var STACK_W = 680;
    var mqNarrow = window.matchMedia ? window.matchMedia('(max-width: 820px)') : null;
    var stackedByWidth = false;
    function narrowScreen() { return !!(mqNarrow && mqNarrow.matches); }
    function wantStackByWidth() { var lw = top.getBoundingClientRect().width; return !narrowScreen() && lw > 0 && lw < STACK_W; }
    function placeMore() {
      layoutRaf = 0;
      if (destroyed) return;
      stackedByWidth = wantStackByWidth();
      body.style.gridTemplateColumns = stackedByWidth ? 'minmax(0, 1fr)' : '';
      if (narrowScreen() || stackedByWidth) { if (more.previousElementSibling !== body) body.parentNode.insertBefore(more, body.nextSibling); }
      else if (more.parentNode !== leftCol) leftCol.appendChild(more);
    }
    if (mqNarrow) { if (mqNarrow.addEventListener) mqNarrow.addEventListener('change', placeMore); else if (mqNarrow.addListener) mqNarrow.addListener(placeMore); }

    function applyHeight() {
      heightRaf = 0;
      if (destroyed) return;
      var w = Math.round(wrap.getBoundingClientRect().width) - 2;   // minus the 1px border on each side
      dims.w = Math.max(1, w);
      var h = geom().height;
      if (Math.abs(wrap.getBoundingClientRect().height - 2 - h) > 0.5) wrap.style.height = (h + 2) + 'px';
    }
    function resize() {
      if (destroyed) return;
      if (wantStackByWidth() !== stackedByWidth && !layoutRaf) layoutRaf = requestAnimationFrame(placeMore);
      var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      var r = canvas.getBoundingClientRect(), w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      if (w !== dims.w || h !== dims.h || dpr !== dims.dpr || canvas.width !== Math.round(w * dpr)) {
        dims.w = w; dims.h = h; dims.dpr = dpr;
        canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      }
      // the strip's height follows its width (more rows on a narrow screen); changing it inside this callback would loop
      if (Math.abs(geom().height - h) > 1 && !heightRaf) heightRaf = requestAnimationFrame(applyHeight);
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      draw();   // repaint now, so a resize never shows a blank frame
    }
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { resize(); }); ro.observe(wrap); }
    else on(window, 'resize', resize);

    /* ---------- starting state: the GSTIN question, 60-word chunks, BM25, top 3 ---------- */
    elQ.value = S.text;
    placeMore();
    applyHeight();
    update('', null);
    resize();

    return {
      destroy: function () {
        if (destroyed) return;
        destroyed = true;
        if (rafId) cancelAnimationFrame(rafId);
        if (heightRaf) cancelAnimationFrame(heightRaf);
        if (layoutRaf) cancelAnimationFrame(layoutRaf);
        if (announceTimer) clearTimeout(announceTimer);
        if (inspTimer) clearTimeout(inspTimer);
        rafId = heightRaf = layoutRaf = announceTimer = inspTimer = 0;
        if (ro) ro.disconnect();
        if (mql) { if (mql.removeEventListener) mql.removeEventListener('change', onTheme); else if (mql.removeListener) mql.removeListener(onTheme); }
        if (mqNarrow) { if (mqNarrow.removeEventListener) mqNarrow.removeEventListener('change', placeMore); else if (mqNarrow.removeListener) mqNarrow.removeListener(placeMore); }
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
        listeners = [];
        // remove only this lab's own element, never whatever else is in root by now
        if (top.parentNode) top.parentNode.removeChild(top);
      }
    };
  }

  Labs.rag = {
    id: 'rag',
    module: 'l4-llm-apps',
    title: 'RAG retrieval: find the right chunk',
    summary: 'Cut a GST help guide into chunks, score them against a question with BM25 or TF-IDF, and see which pieces reach the LLM’s prompt and whether the answer is among them.',
    tasks: TASKS.map(function (t) { return { id: t.id, text: t.text }; }),
    mount: mount
  };
})();
