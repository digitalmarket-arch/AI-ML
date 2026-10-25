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
    { id: 'igst', q: 'A shop in Pune sells to a buyer in Bengaluru. Does it charge CGST and SGST, or IGST?',
      answer: 'When the place of supply is in another state, the seller charges IGST (Integrated GST) at the full rate instead, so the same sale to a buyer in Bengaluru would carry 18% IGST.' },
    { id: 'gstr3b', q: 'When is GSTR-3B due for a monthly filer?',
      answer: 'Monthly filers usually file GSTR-1 by the 11th and GSTR-3B by the 20th of the next month.' },
    { id: 'nil', q: 'Do I have to file a return in a month when I sold nothing?',
      answer: 'Even in a month with no sales, you still have to file a nil return.' },
    { id: 'comp', q: 'Can a business in the composition scheme claim input tax credit?',
      answer: 'The trade-off is that a composition taxpayer cannot claim input tax credit, cannot collect GST from customers on the bill, cannot sell to other states, and must issue a bill of supply instead of a tax invoice.' },
    { id: 'vpay', vague: true, means: 'how much GST goes to the government after subtracting the GST on my purchases?', q: 'How much will I pay?',
      answer: 'Example, with a 5% rate picked for easy maths: a bakery in Kochi buys flour and packing material for ₹10,000 plus ₹500 GST, and sells its cakes for ₹16,000 plus ₹800 GST. It pays only ₹800 − ₹500 = ₹300 to the government.' },
    { id: 'vneed', vague: true, means: 'does my small business have to register for GST?', q: 'Do I need it?',
      answer: 'In most states the limit is ₹40 lakh a year if you sell only goods, and ₹20 lakh a year if you provide services or sell both goods and services.' }
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
    if (/(sses|xes|ches|shes)$/.test(w)) return w.slice(0, -2);
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

  Labs.rag = { id: 'rag' };
})();
