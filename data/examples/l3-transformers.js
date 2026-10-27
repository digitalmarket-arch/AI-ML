/* AI Marg lesson-card examples for one module (loaded with its lesson cards). JavaScript holding JSON. */
window.AIM = window.AIM || {};
window.AIM.examples = window.AIM.examples || {};
window.AIM.examples["l3-transformers"] = {
 "overview": [
  {
   "title": "Two kinds of bank",
   "text": "In \"The bank gave Riya a loan\", self-attention makes \"bank\" listen most to \"loan\". In \"The bank near the river flooded\", it listens most to \"river\". The same word gets a different meaning from its neighbours."
  },
  {
   "title": "What does \"it\" mean?",
   "text": "\"The cupboard did not fit through the door because it was too wide.\" To read \"it\", the model weighs every other word, and \"too wide\" points to the cupboard. Change it to \"too narrow\", and the attention moves to \"door\"."
  },
  {
   "title": "Kohli and the ball",
   "text": "\"Kohli hit the ball\" and \"The ball hit Kohli\" use the same words. Without positional encoding, a transformer would see the same bag of words (the words without their order). The position numbers tell it who hit whom."
  },
  {
   "title": "Sorting complaints in Bengaluru",
   "text": "Imagine a food-delivery app in Bengaluru that gets 50,000 messages a day. A fine-tuned BERT-style encoder reads each whole message and sorts it as refund, late delivery or payment. Staff then answer each group (समूह, samooh) faster."
  },
  {
   "title": "A decoder writes the reply",
   "text": "A GPT-style decoder drafts the answer: \"Sorry, your order is late. It will reach you in 20 minutes.\" It writes one token at a time, each time guessing the next piece from the words before it."
  },
  {
   "title": "Hinglish needs more tokens",
   "text": "We ran the GPT-2 tokeniser on one short message. \"My order is late\" became 4 tokens, and \"Mera order late hai\" became 6. The same sentence in Devanagari script became 27 tokens."
  },
  {
   "title": "Three lines with Hugging Face",
   "text": "Fatima in Lucknow writes `pipeline('sentiment-analysis')` and gives it a product review: is it positive or negative? The pipeline loads a pretrained model and returns a label, such as POSITIVE, with a score. She has trained nothing herself."
  }
 ],
 "outcomes": [
  {
   "title": "Explaining attention to a manager",
   "text": "Arjun in Pune shows his manager the sentence \"The bank near the river flooded\". He explains that \"bank\" gives \"river\" the biggest share of its attention, a weight of about 0.49. So the model reads it as a riverbank."
  },
  {
   "title": "Who hit whom?",
   "text": "Kavya in Mysuru explains positional encoding with \"Kohli hit the ball\" and \"The ball hit Kohli\". Without position numbers, both look the same to a transformer. With them, the model knows who did what."
  },
  {
   "title": "Picking the right model type",
   "text": "A Hyderabad online shop has 20,000 English tickets, each labelled with one of 6 categories. Ravi fine-tunes a pretrained BERT-style encoder with a 6-class head, a small last layer with one score per category. He does not train a model from scratch."
  },
  {
   "title": "Pulling names from resumes",
   "text": "Lakshmi in Chennai runs `pipeline('ner')`, for named entity recognition, on \"Priya Nair joined Sagar Textiles in Surat\". It marks Priya Nair as a person, Sagar Textiles as an organisation and Surat as a place. She uses it on 2,000 resumes."
  },
  {
   "title": "Token counts for a client",
   "text": "Moumita in Kolkata tests GPT-2's tokeniser. \"My refund has not come yet\" takes 6 tokens, but the same message in Bengali takes 45. The tokeniser learned few Bengali pieces, so it breaks Bengali words into tiny bits. She tells the client this means a higher cost (खर्च, kharch) and slower replies."
  },
  {
   "title": "Checking a licence",
   "text": "Gurpreet finds a good Punjabi model on the Hugging Face Hub. Its model card says the licence is CC BY-NC, where NC means non-commercial. So he cannot use it in his client's paid app, and he looks for another model."
  }
 ],
 "studySteps": [
  {
   "title": "One hour after office",
   "text": "Meenakshi, an accountant in Coimbatore, has one free hour each evening. Days 1 and 2: attention videos and the paper sum. Day 3: the Lab. Days 4 and 5: Hugging Face in Colab. She keeps Sunday for fine-tuning."
  },
  {
   "title": "The paper sum",
   "text": "Subhashree, a college student in Bhubaneswar, takes three words: \"Ravi paid bill\". She gives each word two made-up numbers, scores each word against \"paid\", and turns the scores into weights that add up to 1. It takes her 20 minutes."
  },
  {
   "title": "Tokens on a phone",
   "text": "Parveen, a homemaker in Indore, opens the Lab on her phone in a 20-minute break. She types \"kal milte hain\" in Roman letters, then the same words in Devanagari. She notes how many more tokens the Devanagari version needs."
  },
  {
   "title": "Weekend Colab sessions",
   "text": "Bikash in Agartala studies only on weekends. On Saturday he runs the sentiment, named entity recognition and translation pipelines in Colab. On Sunday he fine-tunes DistilBERT on Colab's free GPU, when one is available."
  },
  {
   "title": "Slow internet, big model",
   "text": "Lalit lives in a hill town in Uttarakhand with slow internet. In Colab, the model downloads to Google's computers, not to his phone. So a model of a few hundred MB still loads quickly for him."
  },
  {
   "title": "Is BERT worth it?",
   "text": "Ananya's TF-IDF baseline sorts complaints with 86% accuracy (सटीकता, sateekta). Her fine-tuned DistilBERT gets 89%. She notes the gain of 3 points and asks if it is worth the extra GPU cost. These numbers are made up."
  }
 ],
 "keyTerms": [
  {
   "title": "Who is \"he\"?",
   "text": "In \"Rohit told Virat that he would open the batting\", one attention head may link \"he\" to \"Rohit\". Another head may link \"he\" to \"would open\". That is multi-head attention: different heads learn different links. Every layer has its own heads, and each head sees the whole sentence."
  },
  {
   "title": "Query meets key",
   "text": "In \"Riya paid the bill\", the query of \"paid\" asks \"who did it, and to what?\". It matches the keys of \"Riya\" and \"bill\" best. So most of their values get mixed into the new meaning of \"paid\"."
  },
  {
   "title": "Encoder and decoder in Kochi",
   "text": "Imagine a Kochi insurance office. A BERT-style encoder reads each claim email and sorts it as health, motor or travel. A GPT-style decoder then drafts a polite reply, and a staff member checks it before sending."
  },
  {
   "title": "Fine-tuning on 20,000 tickets",
   "text": "A Hyderabad shop fine-tunes a pretrained BERT on 20,000 labelled tickets for 3 epochs, which means 3 full passes over the data. The model already knew English. It only had to learn the 6 categories."
  },
  {
   "title": "GPT-2 splits a rare word",
   "text": "We ran the GPT-2 tokeniser, which uses BPE, on \"dabbawala\". It became 4 tokens: \"d\", \"abb\", \"aw\" and \"ala\". It works on bytes (tiny codes for letters), so no word is unknown. Its list is fixed after training; it learns no new words."
  },
  {
   "title": "Positions in a cricket line",
   "text": "\"Kohli hit the ball\" and \"The ball hit Kohli\" have the same four words. Positional encoding adds different numbers for position 1 and position 4. So \"Kohli\" at the start and at the end become different inputs. These numbers can be fixed sine and cosine patterns, or learned."
  }
 ],
 "indiaExample": [
  {
   "title": "\"tumhara\" in two models",
   "text": "The MuRIL paper (2021) shows how two models cut the Roman-letter word \"tumhara\" (yours). Multilingual BERT splits it into \"tu\", \"##mh\" and \"##ara\". MuRIL, which learned from transliterated text, keeps \"tumhara\" as one token."
  },
  {
   "title": "IndicBERT v2's languages",
   "text": "IndicBERT v2's model card (its \"about\" page) lists 23 Indian languages plus English, including Bodo, Konkani, Manipuri, Santali and Sindhi. Its licence, the rules for using it, is MIT, which allows use in paid products."
  },
  {
   "title": "Marathi parcel messages",
   "text": "Imagine a Pune online shop. Customers write \"Maza parcel ajun ala nahi\", which means \"my parcel has not come yet\". A fine-tuned MuRIL model sorts such Marathi messages, in either script (लिपि, lipi), into the delivery group."
  },
  {
   "title": "Tamil in Roman letters",
   "text": "Imagine a Chennai bank's chat app. Many customers type Tamil in Roman letters, like \"Enakku refund venum\" (I need a refund). An English-only BERT breaks these words into meaningless pieces, so a model that learned transliterated text is a better start."
  },
  {
   "title": "Malayalam feedback in Kochi",
   "text": "Imagine a Kochi hospital that collects patient feedback in Malayalam. The team fine-tunes IndicBERT on 3,000 labelled comments. Each morning, the model flags complaints (शिकायत, shikayat) about waiting time for the manager."
  },
  {
   "title": "A helpline in Odisha",
   "text": "Imagine a state helpline that gets Odia messages about ration cards, pensions and roads. Odia is one of MuRIL's 16 Indian languages. A fine-tuned model sends each message to the right department."
  }
 ],
 "commonMistakes": [
  {
   "title": "Mixed-up checkpoints",
   "text": "Karan's fine-tuned MuRIL model sorts Hindi tickets well. One day he loads the tokeniser from the checkpoint (saved model) \"distilbert-base-uncased\" by mistake. The code runs, but every prediction says \"refund\", because each ID now means a different piece to the model. Loading both from one name fixes it."
  },
  {
   "title": "A cut-off contract",
   "text": "A Delhi law firm feeds 2,000-token contracts to a BERT model. Only the first 512 tokens are read, so a risky clause near the end is never seen. Cutting each contract into chunks of up to 512 tokens fixes it."
  },
  {
   "title": "Learning rate too high",
   "text": "Neha fine-tunes BERT with a learning rate of 0.001. After one epoch, it predicts \"delivery\" for every ticket, so accuracy falls to 30%, the share of delivery tickets. At 0.00003, the model keeps its knowledge and reaches about 91%."
  },
  {
   "title": "Ten epochs is too many",
   "text": "Imran trains for 10 epochs. Training accuracy reaches 99%, but the validation score drops after epoch 3. The model has started overfitting (रट्टा मारना, ratta maarna): learning the training tickets by heart. He keeps the epoch-3 model."
  },
  {
   "title": "Sentiment is not a category",
   "text": "A Gurugram startup uses `pipeline('sentiment-analysis')` to sort tickets into refund, delivery and payment. It only ever answers POSITIVE or NEGATIVE. The team fine-tunes a model with `num_labels=3`, meaning three output categories, instead."
  },
  {
   "title": "Training from scratch",
   "text": "Deepa tries to train a BERT-sized model from scratch on 20,000 tickets. After days on a GPU, it still sorts them poorly. Fine-tuning a pretrained model gives better results in about an hour."
  }
 ],
 "selfCheck": [
  {
   "title": "Softmax for \"paid\"",
   "text": "Say the query of \"paid\" is [1, 0]. With keys Ravi [2, 0], paid [1, 1], the [0, 1] and bill [1, 0.5], the scores are 2, 1, 0 and 1. Divide by √2 (each list has 2 numbers), then apply softmax: about 0.45, 0.22, 0.11 and 0.22. Softmax never gives exactly 0."
  },
  {
   "title": "Reading the weights",
   "text": "A good answer says what the numbers mean. \"paid\" listens most to \"Ravi\", because it needs to know who paid, and \"the\" gets the least. The weights share 1 like ₹100 shared out: ₹45, ₹22, ₹11 and ₹22."
  },
  {
   "title": "A token count table",
   "text": "Make a small table of tokeniser, sentence and token count. With GPT-2, we got 5 tokens for \"Ravi paid the bill\", 7 for \"Ravi ne bill bhara\" and 21 for the Devanagari version. Then explain the cost in your own words."
  },
  {
   "title": "A fine-tuning report",
   "text": "A good report gives, for example, accuracy 0.91 and F1 0.87 on 2,000 test tickets. Then it shows a wrong case: \"Paisa kat gaya par order nahi aaya\" was labelled payment but predicted delivery. Your guess: it mentions both."
  },
  {
   "title": "Encoder or decoder?",
   "text": "Ask what comes out. Lead-message classification gives a label, such as \"hot lead\", so start with an encoder. Drafting replies gives new text, so start with a decoder. Now reason through the other three tasks the same way."
  },
  {
   "title": "A model card in five lines",
   "text": "For google/muril-base-cased: data from Wikipedia, Common Crawl, PMINDIA and Dakshina. Languages: 16 Indian plus English, also in Roman letters. Licence: Apache 2.0. Limit: weak on other languages. Paid product: yes, keeping the licence notice."
  }
 ]
};
