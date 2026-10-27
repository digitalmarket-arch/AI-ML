/* AI Marg lesson-card examples for one module (loaded with its lesson cards). JavaScript holding JSON. */
window.AIM = window.AIM || {};
window.AIM.examples = window.AIM.examples || {};
window.AIM.examples["l4-llm-internals"] = {
 "overview": [
  {
   "title": "Office email in Pune",
   "text": "Priya types \"Please find attached the\" and the LLM adds \"invoice for October\". It wrote those words one token at a time. Each time, it guessed what usually comes next in office emails."
  },
  {
   "title": "Cricket score line",
   "text": "Given \"India need 6 runs off the last\", a model gives the token \"ball\" a high chance. It has read thousands of match reports, where this pattern is common. Nothing was looked up."
  },
  {
   "title": "Code for a Kochi student",
   "text": "Anjali types `def add(a, b):`, which starts a function (a named, reusable piece of code) called add. The model suggests `return a + b`. Code is text too, so the same next-token guessing writes it."
  },
  {
   "title": "Free practice from mandi news",
   "text": "From \"Mandi onion prices rose this week\", a model gets five practice questions: \"Mandi\" → \"onion\", \"Mandi onion\" → \"prices\", and so on. Nobody wrote the answers; the text itself supplies them."
  },
  {
   "title": "Confident but wrong",
   "text": "Ask a model for the phone number of a small shop in Nagpur. It may write ten digits that look right. That is only a likely-looking pattern, not a lookup, so check it before you call."
  },
  {
   "title": "Same question, more tokens",
   "text": "Riya's support bot in Lucknow gets the same question in English and in Hindi. With the GPT-2 tokeniser, \"My order is late\" is 4 tokens, but the Hindi version in Devanagari script is 27. More tokens means a bigger bill."
  }
 ],
 "outcomes": [
  {
   "title": "Explaining ChatGPT at home",
   "text": "Arjun in Patna explains ChatGPT to his father: it guesses the next word piece, adds it and guesses again. Now his father understands why it can invent facts. It never looked anything up."
  },
  {
   "title": "Telugu needs more tokens",
   "text": "Lakshmi in Vijayawada trains her BPE tokeniser on English text only. A Telugu sentence then needs many more tokens than its English version. She explains to her team that the tokeniser never learned Telugu pieces."
  },
  {
   "title": "Fixing a shape bug",
   "text": "Gurpreet's GPT code crashes with a size error. He prints the tensor shapes (the sizes of his boxes of numbers) and sees (32, 8), not (32, 8, 64). He had skipped the embedding step, which gives each token its 64 numbers."
  },
  {
   "title": "Planning a training run",
   "text": "Fatima in Hyderabad plans a model with 100 million parameters. By the Chinchilla rule, she needs about 20 × 100 million = 2 billion training tokens. With far less text, her model would be undertrained, so she collects more text first."
  },
  {
   "title": "Settings for two apps",
   "text": "Rohan sets temperature 0.2 for a bank FAQ bot, so its answers stay steady. For an ad-slogan writer in Mumbai, he uses temperature 0.9 with top-p 0.9, so the ideas vary more."
  },
  {
   "title": "Explaining a slow reply",
   "text": "Meera's maths app uses a reasoning model, and replies take 20 seconds. She tells her manager that the model writes hundreds of thinking tokens first. Those tokens explain both the wait and the higher bill."
  }
 ],
 "studySteps": [
  {
   "title": "One hour after office",
   "text": "Suresh, a bank clerk in Kanpur, has one free hour a day. In week 1, he watches the next-token and BPE videos and does the Sampling lab. In weeks 2 and 3, he builds the GPT, a little each day."
  },
  {
   "title": "College student on Colab",
   "text": "Anjali in Kochi uses free Colab with a GPU switched on. She types the GPT code line by line. After each step she prints the shapes, like (4, 8, 32), and notes them down."
  },
  {
   "title": "Homemaker with short breaks",
   "text": "Shabana in Lucknow studies in 20-minute breaks and watches one video part per break. She keeps one notebook page per term, such as token, BPE and temperature, with a tiny example on each."
  },
  {
   "title": "Weekend coder in Bengaluru",
   "text": "Rahul codes his BPE tokeniser on Saturday. He tests it with `decode(encode(text)) == text`. This checks that turning text into numbers and back gives the same text. It must print True before he moves on."
  },
  {
   "title": "Slow internet in Gangtok",
   "text": "Tenzin watches the videos at low quality to save data. She first does the BPE pair counting on paper, with three small words. Later, on a better connection, she runs the same steps in Colab."
  },
  {
   "title": "Quiz below 70%",
   "text": "Kiran in Nagpur scores 60% on the quiz. Most misses are on top-p and BPE pair counting. She redoes the Sampling lab and the BPE notebook, then takes the quiz again and scores 80%."
  }
 ],
 "keyTerms": [
  {
   "title": "Tokens in a room-service bot",
   "text": "A Jaipur hotel's bot gets \"Tea with less sugar, please\" in English: 6 GPT-2 tokens. The same request in Hindi script is 30 tokens. Each token is a small chunk of text, and each one is billed."
  },
  {
   "title": "Next-token practice on cricket",
   "text": "A model reads \"Rohit hit a\" and must guess the next token. The real text says \"six\", so that is the answer. Pretraining repeats this kind of question over trillions of tokens."
  },
  {
   "title": "BPE on a menu list",
   "text": "A Chennai student trains BPE on menu text where \"dosa\" appears 50 times and \"idli\" 30 times. The first merges join pairs from dosa, like \"d o\", because they count 50. Soon \"dosa\" becomes one token."
  },
  {
   "title": "An undertrained model",
   "text": "Imagine a Pune startup that trains a 1-billion-parameter model on only 2 billion tokens. The Chinchilla rule suggests about 20 billion. Scaling laws say this model is undertrained: it saw too little text for its size."
  },
  {
   "title": "Temperature for two tasks",
   "text": "An exam-answer helper uses temperature 0.2, so it gives the same steady answer each time. A Diwali greeting writer uses 1.0, so every customer gets a different message."
  },
  {
   "title": "Top-p in a recipe bot",
   "text": "A Kolkata recipe bot sets top-p to 0.9. After \"Add a pinch of\", it keeps only \"salt\", \"turmeric\" and \"sugar\", which together reach 0.9. Odd, rare tokens like \"cement\" never get picked."
  },
  {
   "title": "Context window for a contract",
   "text": "A Kochi law firm pastes a 6,000-token contract into a model with a 4,096-token window. The request fails or the text gets cut, because the prompt and the answer must both fit inside the window."
  },
  {
   "title": "Long chats fill memory",
   "text": "A Delhi customer-care server keeps a KV cache for each of 200 open chats. Every new token adds saved keys and values, so the memory on its GPUs (the chips that run the model) fills up. This is not response caching, which saves whole answers to repeated questions."
  }
 ],
 "indiaExample": [
  {
   "title": "Sarvam-1's window",
   "text": "Sarvam-1's model card lists 8,192 positions (slots for tokens), so it can read up to 8,192 tokens at once. At 1.4 to 2.1 tokens per word, that is roughly 3,900 to 5,800 words of Indian-language text."
  },
  {
   "title": "Check the licence first",
   "text": "Sarvam-1's model card names a Sarvam non-commercial licence: its rules of use do not allow business use. Sarvam-30B uses the Apache 2.0 licence, which allows business use. Always read the licence before you put a model in a paid product."
  },
  {
   "title": "One greeting, 21 tokens",
   "text": "We counted the Tamil greeting \"vanakkam\" with the GPT-2 tokeniser. Typed in Roman letters, it is 4 tokens. In Tamil script it is 21 tokens, one for every byte, because GPT-2 learned almost no Tamil pieces."
  },
  {
   "title": "An Odisha helpdesk, imagined",
   "text": "Imagine a Bhubaneswar startup whose Odia chats cost about 4 times more than English ones. Its tokeniser learned mostly from English, so Odia words break into many pieces. A model whose tokeniser learned Indian scripts would cut the bill."
  },
  {
   "title": "Chai order, three ways",
   "text": "With the GPT-2 tokeniser, \"Tea with less sugar, please\" is 6 tokens. The Hinglish \"Chai mein cheeni kam daalo\" is 10. The same request in Hindi Devanagari script is 30 tokens, five times the English count."
  },
  {
   "title": "A Jaipur call centre, imagined",
   "text": "Imagine a Jaipur call-centre bot built on an MoE model, which is a stack of layers. In each MoE layer, the token \"refund\" and the token \"Diwali\" may go to different experts. Only those few experts run for each token, which keeps replies quick."
  }
 ],
 "commonMistakes": [
  {
   "title": "Old railway rules",
   "text": "A Bhopal travel agent asks a model for IRCTC cancellation charges. It answers confidently with old numbers. Fix: paste the current IRCTC rules page into the prompt, and ask the model to answer only from that text."
  },
  {
   "title": "Shape bug in attention",
   "text": "In attention, each token's *query* (what it looks for) is matched with every token's *key* (what it offers). Neha writes `q @ k` (@ multiplies two tensors) with both shaped (4, 8, 32) and gets an error. Fix: `k.transpose(-2, -1)` swaps k's last two sides to (4, 32, 8), so `q @ k.transpose(-2, -1)` gives scores of (4, 8, 8)."
  },
  {
   "title": "Same wrong answer",
   "text": "Imran sets temperature 0 for a GK quiz bot in Ranchi. It now gives the same wrong year for one historic event every time. Fix: give the bot a trusted source text and check its answers; temperature only controls variety."
  },
  {
   "title": "Big model, too little text",
   "text": "A startup trains a model with 10 billion parameters (learned numbers) on 20 billion tokens, just 2 per parameter. For the same compute, a model about one-third the size, trained on about three times the text, would usually do better."
  },
  {
   "title": "Reasoning for shop timings",
   "text": "A Kolkata shopping app uses a reasoning model to answer \"What time do you close?\". Each reply takes 15 seconds and costs more. Fix: use a standard model for simple questions, and keep reasoning for multi-step problems."
  },
  {
   "title": "Hindi quoted at English rates",
   "text": "Deepak quotes ₹10,000 a month for a bot after counting English tokens only. Most users write in Hindi, which needs about 5 times more tokens with his tokeniser, so the bill jumps. Fix: count tokens in every language first."
  }
 ],
 "selfCheck": [
  {
   "title": "Hint for the token count",
   "text": "Pick a short sentence, such as \"Please send the bill\", and count it in all three forms. A good answer names the cause: a tokeniser that learned mostly from English. Then it links more tokens to a bigger bill and a fuller context window."
  },
  {
   "title": "Reading the starting loss",
   "text": "For Tiny Shakespeare, a character model chooses among 65 characters. A blind guess has a 1 in 65 chance, so the starting loss (the error number) is about 4.17. If yours starts near 4.2 and then falls, your training loop (the code that repeats the training steps) is working."
  },
  {
   "title": "Describing 500 vs 5,000 steps",
   "text": "A good answer is specific: \"At 500 steps, I see random letters with some spaces. At 5,000 steps, I see real words, names and line breaks, but the sentences make little sense.\""
  },
  {
   "title": "Thinking through temperature",
   "text": "Start from the chances. At 0.5 the top token wins almost every time, so phrases repeat. At 1.5 the chances flatten, so rare characters slip in and words break. Explain it as sharper or flatter chances."
  },
  {
   "title": "A practice sum first",
   "text": "Practise the method on other numbers. A 4,096-token window, a 500-token system prompt and 1,000 answer tokens leave 4,096 − 500 − 1,000 = 2,596 tokens. For a longer document, think about what you could cut, split or skip."
  },
  {
   "title": "Sample start for the client",
   "text": "One possible start: \"The model learned which words usually follow others. When you ask a question, it writes the answer that sounds most likely.\" Now add three sentences: what it does not do, and how you keep facts right."
  }
 ]
};
