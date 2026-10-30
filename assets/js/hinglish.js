/* AI Marg: Hinglish writings & phonetic speech engine.
   Provides:
   1. Per-card and page-wide English <-> Hinglish text toggling (next to every Listen button).
   2. Context-aware English-to-Hinglish prose transformation that preserves code, formulas, numbers, and links.
   3. Phonetic Hinglish speech normalization so the browser's Web Speech API (en-IN / hi-IN) pronounces Hinglish naturally.
   Exposes window.AIM_HINGLISH. */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- Exact UI / Heading / Structural Overrides ---------- */
  var EXACT_MAP = {
    'The big idea': 'The big idea · Asli mudda (मुख्य विचार)',
    'You will be able to': 'You will be able to · Aap yeh kar paoge',
    'Study plan': 'Study plan · Padhne ka plan',
    'Key terms': 'Key terms · Zaroori shabd',
    'In India': 'In India · Bharat mein (भारत में)',
    'Common mistakes': 'Common mistakes · Aam galtiyan',
    'Check yourself (open tasks)': 'Check yourself · Khud ko parkho (अभ्यास)',
    'Topics covered': 'Topics covered · Is module ke topics',
    'The brief': 'The brief · Project ka mudda',
    'Data': 'Data · Dataset',
    'Milestones': 'Milestones · Padav (कदम)',
    'Rubric: grade yourself honestly': 'Rubric · Apne kaam ko imaandari se jaancho',
    'Stretch goals': 'Stretch goals · Extra chunauti',
    'Pitfalls to avoid': 'Pitfalls to avoid · In galtiyon se bacho',
    'Deliverables': 'Deliverables · Kya jama karna hai',
    'Skills you will use': 'Skills you will use · Kaunse skills lagenge',
    'Learn first': 'Learn first · Pehle yeh padho',
    'Frequently asked questions': 'Frequently asked questions · Aksar poochhe jaane wale sawal',
    'What you get': 'What you get · Aapko kya milega',
    'How each module works': 'How each module works · Har module kaise kaam karta hai',
    'Your checklist': 'Your checklist · Aapki checklist',
    'Best pick': 'Best pick · Sabse behtar chunaav',
    'Other options': 'Other options · Baaki vikalp',
    'Review your answers': 'Review your answers · Apne jawab dekho',
    'What does it mean?': 'Iska kya matlab hai?'
  };

  /* ---------- Multi-Word Conversational Hinglish Phrase Rules ---------- */
  // Ordered longest/most-specific first. Case-insensitive matching with capitalization preservation.
  var PHRASE_RULES = [
    ['Think of it like:', 'Isko aise samjho (सोचो जैसे):'],
    ['Why it matters:', 'Yeh kyun zaroori hai:'],
    ['Why build this:', 'Yeh project kyun banayein:'],
    ['Before this:', 'Isse pehle:'],
    ['Free tools (₹0):', 'Muft tools (₹0):'],
    ['What this means:', 'Iska matlab hai:'],
    ['Try now:', 'Abhi try karo:'],
    ['About the evidence:', 'Research kya kehti hai:'],
    ['How sure are you? (optional)', 'Aap kitne sure ho? (optional)'],
    ['How well did you remember?', 'Aapko kitna acche se yaad raha?'],
    ['Explain it simply', 'Aasaan bhasha mein samjhao'],
    ['Question it, step by step', 'Sawal poochho, ek-ek kadam karke'],
    ['Repeat the key terms', 'Zaroori shabdon ko dohrao'],
    ['This module explains', 'Yeh module samjhata hai'],
    ['with no code and no maths', 'bina kisi code aur bina maths ke'],
    ['Think of a ', 'Socho ek '],
    ['Think of an ', 'Socho ek '],
    ['Think of ', 'Socho '],
    ['works the same way', 'bilkul isi tarah kaam karta hai'],
    ['work the same way', 'bilkul isi tarah kaam karte hain'],
    ['In normal programming', 'Normal programming mein'],
    ['In machine learning', 'Machine learning mein'],
    ['In deep learning', 'Deep learning mein'],
    ['In this module', 'Is module mein'],
    ['In this level', 'Is level mein'],
    ['In this lab', 'Is lab mein'],
    ['In this project', 'Is project mein'],
    ['In this exercise', 'Is exercise mein'],
    ['In plain words', 'Aasaan shabdon mein'],
    ['in plain words', 'aasaan shabdon mein'],
    ['In plain English', 'Aasaan bhasha mein'],
    ['in plain English', 'aasaan bhasha mein'],
    ['In simple words', 'Seedhe shabdon mein'],
    ['in simple words', 'seedhe shabdon mein'],
    ['By the end of this', 'Iske aakhir tak'],
    ['By the end', 'Aakhir tak'],
    ['by the end', 'aakhir tak'],
    ['for example', 'udaharan ke liye'],
    ['For example', 'Udaharan ke liye'],
    ['such as', 'jaise ki'],
    ['Such as', 'Jaise ki'],
    ['as well as', 'aur saath hi'],
    ['instead of', 'ke bajaye'],
    ['Instead of', 'Ke bajaye'],
    ['because of', 'ki wajah se'],
    ['Because of', 'Ki wajah se'],
    ['so that', 'taaki'],
    ['So that', 'Taaki'],
    ['even if', 'chahe'],
    ['Even if', 'Chahe'],
    ['even though', 'halanki'],
    ['Even though', 'Halanki'],
    ['as soon as', 'jaise hi'],
    ['at least', 'kam se kam'],
    ['At least', 'Kam se kam'],
    ['at most', 'zyada se zyada'],
    ['At most', 'Zyada se zyada'],
    ['more than', 'se zyada'],
    ['less than', 'se kam'],
    ['fewer than', 'se kam'],
    ['step by step', 'ek-ek kadam karke'],
    ['Step by step', 'Ek-ek kadam karke'],
    ['line by line', 'ek-ek line karke'],
    ['one by one', 'ek-ek karke'],
    ['by hand', 'haath se (manually)'],
    ['on your own', 'khud se'],
    ['on its own', 'khud se'],
    ['on her own', 'khud se'],
    ['on his own', 'khud se'],
    ['by itself', 'apne aap'],
    ['by yourself', 'khud se'],
    ['in your own words', 'apne shabdon mein'],
    ['in your browser', 'aapke browser mein'],
    ['in the browser', 'browser ke andar'],
    ['right answers', 'sahi jawab'],
    ['correct answer', 'sahi jawab'],
    ['correct answers', 'sahi jawab'],
    ['wrong answer', 'galat jawab'],
    ['wrong answers', 'galat jawab'],
    ['trial and error', 'koshish aur galti (trial and error)'],
    ['First,', 'Sabse pehle,'],
    ['Second,', 'Doosra,'],
    ['Third,', 'Teesra,'],
    ['Finally,', 'Aakhir mein,'],
    ['However,', 'Lekin,'],
    ['Therefore,', 'Isliye,'],
    ['Otherwise,', 'Warna,'],
    ['Remember that', 'Dhyan rakho ki'],
    ['Remember:', 'Yaad rakho:'],
    ['Keep in mind', 'Dhyan mein rakho'],
    ['Make sure', 'Pakka karo ki'],
    ['make sure', 'pakka karo ki'],
    ['Be careful', 'Savdhaan raho'],
    ['Look at', 'Dekho'],
    ['look at', 'dekho'],
    ['Let us', 'Chalo'],
    ['Let\'s', 'Chalo'],
    ['You will learn', 'Aap seekhoge'],
    ['you will learn', 'aap seekhoge'],
    ['You will see', 'Aap dekhoge'],
    ['you will see', 'aap dekhoge'],
    ['You will also', 'Aap yeh bhi'],
    ['you will also', 'aap yeh bhi'],
    ['You can use', 'Aap use kar sakte ho'],
    ['you can use', 'aap use kar sakte ho'],
    ['You can', 'Aap kar sakte ho'],
    ['you can', 'aap kar sakte ho'],
    ['You need to', 'Aapko zaroorat hai'],
    ['you need to', 'aapko zaroorat hai'],
    ['we need to', 'humein zaroorat hai'],
    ['We need to', 'Humein zaroorat hai'],
    ['does not', 'nahi karta'],
    ['do not', 'mat karo / nahi karte'],
    ['Do not', 'Mat karo'],
    ['Don\'t', 'Mat karo'],
    ['cannot', 'nahi kar sakta'],
    ['can\'t', 'nahi kar sakta'],
    ['is called a ', 'ko kehte hain ek '],
    ['is called an ', 'ko kehte hain ek '],
    ['is called ', 'ko kehte hain '],
    ['are called ', 'ko kehte hain '],
    ['means that', 'ka matlab hai ki'],
    ['which means', 'jiska matlab hai'],
    ['That is why', 'Isi liye'],
    ['that is why', 'isi liye'],
    ['This means', 'Iska matlab hai'],
    ['this means', 'iska matlab hai'],
    ['What is ', 'Kya hai '],
    ['How does ', 'Kaise kaam karta hai '],
    ['Why does ', 'Kyun karta hai '],
    ['Why is ', 'Kyun hai '],
    ['When you ', 'Jab aap '],
    ['when you ', 'jab aap '],
    ['If you ', 'Agar aap '],
    ['if you ', 'agar aap '],
    ['before you ', 'isse pehle ki aap '],
    ['after you ', 'iske baad jab aap '],
    ['so you can ', 'taaki aap kar sako '],
    ['in order to ', 'ke liye '],
    ['from scratch', 'bilkul shuruat (scratch) se'],
    ['real-world', 'asli duniya (real-world) ke'],
    ['every day', 'har roz'],
    ['each other', 'ek doosre'],
    ['one another', 'ek doosre'],
    ['a lot of', 'bahut saara'],
    ['lots of', 'bahut saare'],
    ['most of', 'zyadatar'],
    ['Most of', 'Zyadatar'],
    ['some of', 'kuch'],
    ['all of', 'sabhi']
  ];

  /* ---------- Word-Level Conversational Hinglish Replacements ---------- */
  // Only non-technical everyday words are mapped so technical AI/ML terms (model, layer, vector, matrix, loss, gradient, token, etc.) stay in clear English.
  var WORD_MAP = {
    'and': 'aur',
    'or': 'ya',
    'but': 'lekin',
    'because': 'kyunki',
    'so': 'toh',
    'if': 'agar',
    'then': 'toh',
    'when': 'jab',
    'while': 'jabki',
    'where': 'jahan',
    'who': 'jo',
    'which': 'jo',
    'what': 'kya',
    'why': 'kyun',
    'how': 'kaise',
    'this': 'yeh',
    'that': 'woh',
    'these': 'yeh sab',
    'those': 'woh sab',
    'here': 'yahan',
    'there': 'wahan',
    'now': 'abhi',
    'later': 'baad mein',
    'before': 'pehle',
    'after': 'baad',
    'always': 'hamesha',
    'never': 'kabhi nahi',
    'often': 'aksar',
    'sometimes': 'kabhi-kabhi',
    'usually': 'aam taur par',
    'already': 'pehle se',
    'still': 'abhi bhi',
    'also': 'bhi',
    'too': 'bhi',
    'only': 'sirf',
    'just': 'bas',
    'very': 'bahut',
    'much': 'zyada',
    'many': 'kai saare',
    'few': 'kuch',
    'every': 'har',
    'each': 'har ek',
    'both': 'dono',
    'other': 'doosre',
    'another': 'ek aur',
    'same': 'wahi (same)',
    'different': 'alag',
    'new': 'naya',
    'old': 'purana',
    'big': 'bada',
    'large': 'bada',
    'small': 'chhota',
    'tiny': 'bahut chhota',
    'good': 'accha',
    'better': 'behtar',
    'best': 'sabse behtar',
    'bad': 'kharab',
    'worse': 'aur kharab',
    'worst': 'sabse kharab',
    'right': 'sahi',
    'wrong': 'galat',
    'easy': 'aasaan',
    'simple': 'aasaan',
    'hard': 'mushkil',
    'tough': 'mazboot (tough)',
    'important': 'zaroori',
    'useful': 'kaam ka',
    'clear': 'saaf',
    'real': 'asli',
    'true': 'sahi (true)',
    'false': 'galat (false)',
    'fast': 'tez',
    'quick': 'tez',
    'slow': 'dheema',
    'first': 'pehla',
    'last': 'aakhiri',
    'next': 'agla',
    'previous': 'pichhla',
    'with': 'ke saath',
    'without': 'ke bina',
    'inside': 'ke andar',
    'outside': 'ke bahar',
    'between': 'ke beech',
    'under': 'ke neeche',
    'above': 'ke upar',
    'about': 'ke baare mein',
    'into': 'mein',
    'from': 'se',
    'for': 'ke liye',
    'you': 'aap',
    'your': 'aapka',
    'we': 'hum',
    'our': 'humara',
    'they': 'woh',
    'their': 'unka',
    'people': 'log',
    'person': 'insaan',
    'student': 'learner (student)',
    'teacher': 'shikshak (teacher)',
    'money': 'paisa',
    'time': 'samay',
    'day': 'din',
    'days': 'din',
    'week': 'hafta',
    'weeks': 'hafte',
    'year': 'saal',
    'years': 'saal',
    'way': 'tarika',
    'ways': 'tarike',
    'work': 'kaam',
    'works': 'kaam karta hai',
    'learn': 'seekho',
    'learns': 'seekhta hai',
    'learned': 'seekha',
    'learning': 'seekhna (learning)',
    'understand': 'samjho',
    'read': 'padho',
    'write': 'likho',
    'watch': 'dekho',
    'see': 'dekho',
    'check': 'jaancho (check)',
    'find': 'dhoondho',
    'finds': 'dhoondhta hai',
    'give': 'do',
    'gives': 'deta hai',
    'take': 'lo',
    'takes': 'leta hai',
    'make': 'banao',
    'makes': 'banata hai',
    'made': 'banaya',
    'build': 'build karo',
    'builds': 'banata hai',
    'use': 'use karo',
    'uses': 'use karta hai',
    'used': 'use kiya',
    'help': 'madad',
    'helps': 'madad karta hai',
    'need': 'zaroorat',
    'needs': 'zaroorat hai',
    'want': 'chahte ho',
    'know': 'jaante ho',
    'knows': 'jaanta hai',
    'think': 'socho',
    'say': 'batao',
    'says': 'kehta hai',
    'show': 'dikhao',
    'shows': 'dikhata hai',
    'keep': 'rakho',
    'keeps': 'rakhta hai',
    'start': 'shuru karo',
    'starts': 'shuru hota hai',
    'finish': 'poora karo',
    'try': 'koshish karo',
    'choose': 'chuno',
    'pick': 'chuno',
    'explain': 'samjhao',
    'explains': 'samjhata hai',
    'answer': 'jawab',
    'answers': 'jawab',
    'question': 'sawal',
    'questions': 'sawal',
    'problem': 'samasya (problem)',
    'problems': 'problems',
    'mistake': 'galti',
    'mistakes': 'galtiyan',
    'example': 'udaharan (example)',
    'examples': 'udaharan (examples)',
    'reason': 'karan (reason)',
    'reasons': 'karan (reasons)',
    'rule': 'niyam (rule)',
    'rules': 'niyam (rules)',
    'number': 'sankhya (number)',
    'numbers': 'numbers',
    'word': 'shabd',
    'words': 'shabd'
  };

  function matchCase(src, replacement) {
    if (!src || !replacement) return replacement;
    if (src.charAt(0) === src.charAt(0).toUpperCase() && src.charAt(0) !== src.charAt(0).toLowerCase()) {
      return replacement.charAt(0).toUpperCase() + replacement.slice(1);
    }
    return replacement;
  }

  // Transform a single plain-text string (not HTML tags or code) into conversational Hinglish
  function toHinglish(str) {
    if (!str || typeof str !== 'string') return str;
    var trimmed = str.trim();
    if (!trimmed || !/[A-Za-z]/.test(trimmed)) return str;
    if (EXACT_MAP[trimmed]) {
      return str.replace(trimmed, EXACT_MAP[trimmed]);
    }

    // Protect existing Hindi gloss brackets "(देवनागरी, roman)", URLs, and inline formulas/identifiers
    var saved = [];
    var s = str.replace(/\(([\u0900-\u097F][^)]*)\)|https?:\/\/\S+|\b[A-Za-z0-9_]+\([^)]*\)|\b[A-Za-z_][A-Za-z0-9_]*\.[A-Za-z0-9_]+\b/g, function (m) {
      saved.push(m);
      return '\u0001' + (saved.length - 1) + '\u0001';
    });

    // 1. Apply multi-word conversational Hinglish phrase replacements
    for (var i = 0; i < PHRASE_RULES.length; i++) {
      var pat = PHRASE_RULES[i][0], rep = PHRASE_RULES[i][1];
      var escaped = pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var leadBoundary = /^[A-Za-z0-9]/.test(pat) ? '\\b' : '';
      var trailBoundary = /[A-Za-z0-9]$/.test(pat) ? '\\b' : '';
      var rx = new RegExp(leadBoundary + escaped + trailBoundary, 'gi');
      s = s.replace(rx, function (m) { return matchCase(m, rep); });
    }

    // 2. Apply word-level replacements on remaining English words
    s = s.replace(/\b([A-Za-z]+)\b/g, function (m) {
      var low = m.toLowerCase();
      if (Object.prototype.hasOwnProperty.call(WORD_MAP, low)) {
        // Avoid replacing all-caps acronyms like OR, AND, IF, IN
        if (m.length > 1 && m === m.toUpperCase()) return m;
        return matchCase(m, WORD_MAP[low]);
      }
      return m;
    });

    // 3. Clean up any duplicate Hindi words if a word was followed by its own bracket gloss
    s = s.replace(/\u0001(\d+)\u0001/g, function (_, idx) { return saved[Number(idx)]; });
    return s;
  }

  /* ---------- Phonetic Hinglish Normalizer for Web Speech API ---------- */
  // Maps Roman Hindi words in Hinglish to natural phonetic spellings for Indian English (en-IN) and Devanagari for Hindi (hi-IN)
  // so the browser speech synthesizer never mispronounces Roman Hindi words with a flat Western accent.
  var SPEECH_HI_DEV = {
    'aur': 'और',
    'ya': 'या',
    'lekin': 'लेकिन',
    'kyunki': 'क्योंकि',
    'isliye': 'इसलिए',
    'agar': 'अगर',
    'toh': 'तो',
    'jab': 'जब',
    'jabki': 'जबकि',
    'jahan': 'जहाँ',
    'yahan': 'यहाँ',
    'wahan': 'वहाँ',
    'kya': 'क्या',
    'kyun': 'क्यों',
    'kaise': 'कैसे',
    'yeh': 'यह',
    'woh': 'वह',
    'abhi': 'अभी',
    'pehle': 'पहले',
    'baad': 'बाद',
    'hamesha': 'हमेशा',
    'kabhi': 'कभी',
    'nahi': 'नहीं',
    'aksar': 'अक्सर',
    'bhi': 'भी',
    'sirf': 'सिर्फ़',
    'bas': 'बस',
    'bahut': 'बहुत',
    'zyada': 'ज़्यादा',
    'zyadatar': 'ज़्यादातर',
    'kam': 'कम',
    'kuch': 'कुछ',
    'sabhi': 'सभी',
    'har': 'हर',
    'dono': 'दोनों',
    'doosre': 'दूसरे',
    'alag': 'अलग',
    'naya': 'नया',
    'purana': 'पुराना',
    'bada': 'बड़ा',
    'chhota': 'छोटा',
    'accha': 'अच्छा',
    'acche': 'अच्छे',
    'behtar': 'बेहतर',
    'sabse': 'सबसे',
    'kharab': 'ख़राब',
    'sahi': 'सही',
    'galat': 'ग़लत',
    'aasaan': 'आसान',
    'mushkil': 'मुश्किल',
    'zaroori': 'ज़रूरी',
    'asli': 'असली',
    'tez': 'तेज़',
    'dheema': 'धीमा',
    'pehla': 'पहला',
    'aakhiri': 'आख़िरी',
    'aakhir': 'आख़िर',
    'agla': 'अगला',
    'pichhla': 'पिछला',
    'saath': 'साथ',
    'bina': 'बिना',
    'andar': 'अंदर',
    'bahar': 'बाहर',
    'beech': 'बीच',
    'neeche': 'नीचे',
    'upar': 'ऊपर',
    'baare': 'बारे',
    'mein': 'में',
    'se': 'से',
    'ke': 'के',
    'ka': 'का',
    'ki': 'की',
    'ko': 'को',
    'liye': 'लिए',
    'aap': 'आप',
    'aapka': 'आपका',
    'aapke': 'आपके',
    'aapko': 'आपको',
    'hum': 'हम',
    'humara': 'हमारा',
    'humein': 'हमें',
    'unka': 'उनका',
    'log': 'लोग',
    'insaan': 'इंसान',
    'paisa': 'पैसा',
    'samay': 'समय',
    'din': 'दिन',
    'hafta': 'हफ़्ता',
    'hafte': 'हफ़्ते',
    'saal': 'साल',
    'tarika': 'तरीक़ा',
    'tarike': 'तरीक़े',
    'tarah': 'तरह',
    'kaam': 'काम',
    'karta': 'करता',
    'karti': 'करती',
    'karte': 'करते',
    'hai': 'है',
    'hain': 'हैं',
    'hota': 'होता',
    'hoti': 'होती',
    'hote': 'होते',
    'sakta': 'सकता',
    'sakti': 'सकती',
    'sakte': 'सकते',
    'sako': 'सको',
    'seekho': 'सीखो',
    'seekhta': 'सीखता',
    'seekha': 'सीखा',
    'seekhna': 'सीखना',
    'seekhoge': 'सीखोगे',
    'samjho': 'समझो',
    'samjhao': 'समझाओ',
    'samjhata': 'समझाता',
    'padho': 'पढ़ो',
    'padhne': 'पढ़ने',
    'likho': 'लिखो',
    'dekho': 'देखो',
    'dekhoge': 'देखोगे',
    'dhoondho': 'ढूँढो',
    'dhoondhta': 'ढूँढता',
    'banao': 'बनाओ',
    'banata': 'बनाता',
    'banaya': 'बनाया',
    'banayein': 'बनाएँ',
    'madad': 'मदद',
    'zaroorat': 'ज़रूरत',
    'chahte': 'चाहते',
    'jaante': 'जानते',
    'jaanta': 'जानता',
    'socho': 'सोचो',
    'batao': 'बताओ',
    'kehta': 'कहता',
    'kehte': 'कहते',
    'dikhao': 'दिखाओ',
    'dikhata': 'दिखाता',
    'rakho': 'रखो',
    'rakhta': 'रखता',
    'shuru': 'शुरू',
    'shuruat': 'शुरुआत',
    'poora': 'पूरा',
    'koshish': 'कोशिश',
    'chuno': 'चुनो',
    'jawab': 'जवाब',
    'sawal': 'सवाल',
    'samasya': 'समस्या',
    'galti': 'ग़लती',
    'galtiyan': 'ग़लतियाँ',
    'galtiyon': 'ग़लतियों',
    'udaharan': 'उदाहरण',
    'karan': 'कारण',
    'niyam': 'नियम',
    'sankhya': 'संख्या',
    'shabd': 'शब्द',
    'shabdon': 'शब्दों',
    'mudda': 'मुद्दा',
    'bhasha': 'भाषा',
    'kadam': 'क़दम',
    'chalo': 'चलो',
    'taaki': 'ताकि',
    'chahe': 'चाहे',
    'halanki': 'हालाँकि',
    'bajaye': 'बजाय',
    'wajah': 'वजह',
    'dhyan': 'ध्यान',
    'yaad': 'याद',
    'pakka': 'पक्का',
    'savdhaan': 'सावधान',
    'raho': 'रहो',
    'karo': 'करो',
    'mat': 'मत',
    'apne': 'अपने',
    'apna': 'अपना',
    'khud': 'ख़ुद',
    'bilkul': 'बिल्कुल',
    'isi': 'इसी',
    'isko': 'इसको',
    'iska': 'इसका',
    'iske': 'इसके',
    'isse': 'इससे',
    'jaise': 'जैसे',
    'waise': 'वैसे',
    'aise': 'ऐसे',
    'matlab': 'मतलब',
    'duniya': 'दुनिया',
    'roz': 'रोज़',
    'saara': 'सारा',
    'saare': 'सारे'
  };

  // Fallback phonetic respellings when a device has ONLY an English voice and no Hindi voice
  var SPEECH_EN_PHONETIC = {
    'hai': 'hay',
    'hain': 'hain',
    'mein': 'main',
    'kyunki': 'kyoon-ki',
    'isliye': 'iss-liye',
    'seekho': 'see-kho',
    'seekhoge': 'see-kho-gay',
    'samjho': 'sum-jho',
    'samjhao': 'sum-jha-o',
    'udaharan': 'oo-daa-ha-ran',
    'zaroori': 'za-roo-ree',
    'aasaan': 'aa-saan',
    'mushkil': 'mush-kil',
    'galti': 'gul-tee',
    'galtiyan': 'gul-ti-yaan',
    'jawab': 'ja-waab',
    'sawal': 'sa-waal',
    'kadam': 'ka-dum',
    'matlab': 'mut-lub',
    'tarika': 'ta-ree-kaa',
    'pehle': 'peh-lay',
    'doosre': 'doos-ray',
    'apne': 'up-nay',
    'karo': 'ka-ro',
    'dekho': 'day-kho',
    'socho': 'so-cho',
    'padho': 'pu-dho',
    'likho': 'li-kho'
  };

  // Prepares text for speak.js: if the device has a Hindi voice (hasHiVoice), Roman Hindi words in Hinglish mode
  // can be converted or kept smooth; if only an English voice exists, phonetic respelling ensures natural pronunciation.
  function prepareSpeech(text, isHinglish, hasHiVoice) {
    if (!text || !isHinglish) return text;
    return String(text).replace(/\b([A-Za-z]+)\b/g, function (w) {
      var low = w.toLowerCase();
      if (hasHiVoice && Object.prototype.hasOwnProperty.call(SPEECH_HI_DEV, low)) {
        return SPEECH_HI_DEV[low];
      }
      if (!hasHiVoice && Object.prototype.hasOwnProperty.call(SPEECH_EN_PHONETIC, low)) {
        return SPEECH_EN_PHONETIC[low];
      }
      return w;
    });
  }

  /* ---------- DOM Text-Node Toggling (Preserves Event Listeners, Code & Controls) ---------- */
  var SKIP_SEL = 'button, input, select, textarea, nav, svg, pre, code, script, style, noscript, iframe, canvas, video, audio, ' +
    '.visually-hidden, .tts-skip, .hl-skip, .read-foot, .read-progress, .crumbs, .tabs, .site-head, .prog-strip, footer, .toasts, ' +
    '#fc-chip, .tts-bar, [aria-hidden="true"], .q-sure, .bar, #mod-side, .editor, .console, .term-hi, .ex-hi, [lang="sa"]';

  function transformElement(root, toHl) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || !/[A-Za-z]/.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
        var p = n.parentElement;
        if (!p || p.closest(SKIP_SEL)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    for (var n; (n = walker.nextNode());) nodes.push(n);
    nodes.forEach(function (node) {
      if (toHl) {
        if (node._enText === undefined) node._enText = node.nodeValue;
        node.nodeValue = toHinglish(node._enText);
      } else if (node._enText !== undefined) {
        node.nodeValue = node._enText;
      }
    });
  }

  function setCardMode(root, on) {
    if (!root) return;
    if (on) root.setAttribute('data-hl-on', '1');
    else root.removeAttribute('data-hl-on');
    root.classList.toggle('is-hinglish', !!on);
    transformElement(root, !!on);
    syncButtonsIn(root, !!on);
  }

  function isCardHinglish(el) {
    if (!el) return false;
    var box = el.closest ? el.closest('[data-hl-on="1"]') : null;
    return !!box;
  }

  function syncButtonsIn(root, on) {
    var btns = [];
    if (root.matches && root.matches('[data-hl-root]')) btns.push(root);
    if (root.querySelectorAll) {
      Array.prototype.forEach.call(root.querySelectorAll('[data-hl-root]'), function (b) {
        var target = resolveRoot(b);
        if (target === root) btns.push(b);
      });
    }
    if (root.id === 'main') {
      var headBtn = document.querySelector('.site-head [data-hl-root="main"]');
      if (headBtn) btns.push(headBtn);
    }
    btns.forEach(function (b) {
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
      var lbl = b.querySelector('.hl-lbl');
      if (lbl) {
        var customAll = b.getAttribute('data-hl-all');
        lbl.textContent = customAll ? (on ? 'English (all)' : 'Hinglish (all)') : (on ? 'Hinglish ✓' : 'Hinglish');
      }
    });
  }

  function resolveRoot(btn) {
    var sel = btn.getAttribute('data-hl-root');
    if (!sel || sel === 'main') return document.getElementById('main');
    var root = btn.closest(sel) || document.querySelector('#main ' + sel);
    var inner = btn.getAttribute('data-hl-in');
    if (root && inner) root = root.querySelector(inner) || root;
    return root;
  }

  // Render a per-card Hinglish toggle button that pairs alongside Listen
  function btn(rootSel, label, o) {
    o = o || {};
    var isAll = rootSel === '.read-cards' || rootSel === 'main';
    var txt = o.hlText || (isAll && rootSel === '.read-cards' ? 'Hinglish (all)' : 'Hinglish');
    return '<button type="button" class="btn btn-sm btn-ghost hl-btn' + (o.icon ? ' hl-icon' : '') + '" data-hl-root="' + esc(rootSel) + '"' +
      (o.within ? ' data-hl-in="' + esc(o.within) + '"' : '') +
      (isAll && rootSel === '.read-cards' ? ' data-hl-all="1"' : '') +
      ' aria-pressed="false" aria-label="Toggle Hinglish: ' + esc(label || 'this card') + '" title="Switch between English and Hinglish">' +
      '<span class="hl-badge" aria-hidden="true">अ/A</span>' +
      (o.icon ? '' : '<span class="hl-lbl">' + esc(txt) + '</span>') + '</button>';
  }

  // Click handler for any [data-hl-root] toggle button
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('[data-hl-root]');
    if (!b) return;
    ev.preventDefault();
    var root = resolveRoot(b);
    if (!root) return;
    var nextOn = root.getAttribute('data-hl-on') !== '1';
    setCardMode(root, nextOn);
    // Also update any nested cards inside root (e.g., when clicking "Hinglish (all)" on .read-cards or header main)
    Array.prototype.forEach.call(root.querySelectorAll('.read-card, .gloss-term, .card, section[id^="sec-"], .quiz, .ex, .lab, details.fold, details.rf-check, .lm-card'), function (sub) {
      if (nextOn) sub.setAttribute('data-hl-on', '1');
      else sub.removeAttribute('data-hl-on');
      sub.classList.toggle('is-hinglish', nextOn);
      syncButtonsIn(sub, nextOn);
    });
    // If AIM_SPEAK is currently reading inside this root, re-speak the current block in the newly chosen language!
    if (window.AIM_SPEAK && window.AIM_SPEAK.isPlaying && window.AIM_SPEAK.isPlaying()) {
      if (typeof window.AIM_SPEAK.refreshCurrent === 'function') {
        window.AIM_SPEAK.refreshCurrent();
      }
    }
  });

  // Automatically re-apply Hinglish if async content (like module examples, diagrams, lab tasks, or study cards) is injected into a container that already has data-hl-on="1"
  var mainEl = document.getElementById('main');
  if (mainEl && window.MutationObserver) {
    var mo = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        Array.prototype.forEach.call(m.addedNodes || [], function (node) {
          if (!node || node.nodeType !== 1) return;
          var activeBox = node.closest && node.closest('[data-hl-on="1"]');
          if (activeBox) {
            transformElement(node, true);
          }
          autoInjectTools(node);
        });
      });
    });
    mo.observe(mainEl, { childList: true, subtree: true });
  }

  // Automatically inject per-card Hinglish + Listen buttons into dynamic cards (labs, projects, exercises, study cards) that don't yet have them
  function autoInjectTools(scope) {
    if (!scope || !scope.querySelectorAll) return;
    var SPK = window.AIM_SPEAK;
    if (!SPK || typeof SPK.btn !== 'function') return;

    // 1. Lab containers (.lab) rendered by assets/js/labs/*.js
    var labs = scope.matches && scope.matches('.lab') ? [scope] : Array.prototype.slice.call(scope.querySelectorAll('.lab'));
    labs.forEach(function (lab) {
      if (lab.querySelector('.lab-hl-bar')) return;
      var bar = document.createElement('div');
      bar.className = 'row-between lab-hl-bar tts-skip';
      bar.innerHTML = '<span class="small muted">Interactive lab instructions & tasks</span><span class="read-tools">' +
        SPK.btn('.lab', 'Listen to this lab') + '</span>';
      lab.insertBefore(bar, lab.firstChild);
    });

    // 2. Study Method cards (.lm-card), Daily Review cards (.rv-card), Recall checks (details.rf-check)
    var studyCards = Array.prototype.slice.call(scope.querySelectorAll('.lm-card, .rv-card, details.rf-check > .rf-check-body'));
    studyCards.forEach(function (card) {
      if (card.querySelector('[data-hl-root]')) return;
      var sel = card.classList.contains('lm-card') ? '.lm-card' : card.classList.contains('rv-card') ? '.rv-card' : '.rf-check-body';
      var toolWrap = document.createElement('div');
      toolWrap.className = 'row tts-skip hl-card-tools';
      toolWrap.innerHTML = SPK.btn(sel, 'Listen to this card');
      var head = card.querySelector('h2, h3, h4');
      if (head && head.parentNode === card) head.insertAdjacentElement('afterend', toolWrap);
      else card.insertBefore(toolWrap, card.firstChild);
    });
  }

  window.AIM_HINGLISH = {
    toHinglish: toHinglish,
    prepareSpeech: prepareSpeech,
    btn: btn,
    setCardMode: setCardMode,
    isCardHinglish: isCardHinglish,
    autoInjectTools: autoInjectTools
  };
})();
