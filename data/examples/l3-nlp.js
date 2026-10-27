/* AI Marg lesson-card examples for one module (loaded with its lesson cards). JavaScript holding JSON. */
window.AIM = window.AIM || {};
window.AIM.examples = window.AIM.examples || {};
window.AIM.examples["l3-nlp"] = {
 "overview": [
  {
   "title": "Food app reviews in Kolkata",
   "text": "Imagine a Kolkata food app with 50,000 reviews a month. NLP turns each review into numbers, and a model marks it happy or angry. The team then reads only the angry reviews about late delivery."
  },
  {
   "title": "Bank emails in Chennai",
   "text": "Imagine a Chennai bank that gets 3,000 customer emails a day. A text classifier spots words like \"UPI\", \"failed\" and \"refund\". It sends each email to the right team, so customers get answers faster."
  },
  {
   "title": "Lakshmi's WhatsApp orders",
   "text": "Lakshmi runs a kirana shop in Madurai and takes orders on WhatsApp. She counts the words in one month of messages. \"Atta\", \"oil\" and \"delivery\" come out on top. That count is a tiny bag of words."
  },
  {
   "title": "Sasta, cheap and affordable",
   "text": "Reviews of a Jaipur phone shop say \"sasta\", \"cheap\" or \"affordable\". A word-counting model sees three unrelated words. Word embeddings give them close lists of numbers, so the model learns that they mean nearly the same."
  },
  {
   "title": "Not good is not good",
   "text": "Arjun in Pune reviews a hotel: \"Room was not good at all.\" A model that reads word by word keeps \"not\" in its memory. So when it reaches \"good\", it still reads the review as negative."
  },
  {
   "title": "Train updates in many languages",
   "text": "Imagine a railway app that shows \"Train is running 40 minutes late\" in Tamil, Telugu and Hindi. A translation model, built on sequence-to-sequence ideas and attention, turns the English message into each language."
  },
  {
   "title": "A Nashik farmer's question",
   "text": "Imagine a farmer in Nashik who types a question about onion prices in Marathi. An app built with Indian-language tools can read it and answer in Marathi. He does not need to know English."
  }
 ],
 "outcomes": [
  {
   "title": "Keeping \"not\" in Hyderabad",
   "text": "Fatima cleans hotel reviews in Hyderabad. Before removing stop words (very common words), she prints the stop-word list and finds \"not\" in it. She takes \"not\" out of the list, so \"not clean\" stays a complaint."
  },
  {
   "title": "A baseline in one afternoon",
   "text": "Rohit at a Bengaluru agency builds TF-IDF plus logistic regression on 20,000 product reviews. It trains in under a minute and gets an F1 score of 0.86, where 1 is perfect. Any bigger model must now beat 0.86."
  },
  {
   "title": "Nearest words with GloVe",
   "text": "Meera loads pretrained GloVe vectors with gensim, a Python library for word vectors. She asks for the 10 words closest to \"delivery\" and reads the list to check that it makes sense. Before she uses the vectors, she also checks job words for gender bias."
  },
  {
   "title": "Why the RNN forgot",
   "text": "Karthik explains to his team why a plain RNN forgets the start of a long complaint. At each word it keeps only part of its old memory, so early words fade. He suggests an LSTM, whose gates can keep the key part."
  },
  {
   "title": "An honest report to a client",
   "text": "Priya's LSTM scores F1 0.88, and her TF-IDF baseline scores 0.86. The LSTM needed 40 minutes on a GPU, a fast chip for neural networks. The baseline needed 1 minute on a laptop. She tells the client the small gain may not be worth it."
  },
  {
   "title": "Attention on a whiteboard",
   "text": "Neha writes \"I am going to Delhi\" above \"main Dilli ja raha hoon\" and joins matching words with lines. She shows that writing \"Dilli\" means looking back at \"Delhi\", the last English word. Her friend finally understands attention."
  },
  {
   "title": "Tamil text in Coimbatore",
   "text": "Senthil uses the Indic NLP Library to split a Tamil news paragraph into sentences and words. Then he counts the most common words across 200 local news stories. The same steps work for Hindi or Telugu text."
  }
 ],
 "studySteps": [
  {
   "title": "One hour after office",
   "text": "Suresh is a bank clerk in Kanpur with one free hour a day. Day 1: cleaning and TF-IDF videos. Day 2: the classifier in Colab. Day 3: embeddings and the Lab. Day 4: RNNs and LSTMs. Day 5: attention. On Sunday he does the Indic NLP step and the quiz."
  },
  {
   "title": "College student in Kochi",
   "text": "Anjali pauses the RNN video and draws four boxes on paper, one for each word of \"food was not good\". She draws arrows h1, h2 and h3 between them for the memory. The drawing makes the LSTM lesson much easier."
  },
  {
   "title": "Homemaker in Lucknow",
   "text": "Shabana studies in 20-minute breaks. In one break she tries the analogy tasks in the Lab tab on her phone. In another, she explains attention to her daughter with \"main Dilli ja raha hoon\"."
  },
  {
   "title": "Weekend learner in Kolkata",
   "text": "Sourav studies only on Saturday and Sunday. On Saturday he watches all the videos and builds the TF-IDF classifier. On Sunday he trains the LSTM and runs the Indic NLP Library on a Bengali news paragraph."
  },
  {
   "title": "Slow internet in Sikkim",
   "text": "Tenzin has a slow connection, so she watches the videos at low quality. She computes TF-IDF for three short reviews in her notebook, with no internet. She saves the Colab steps for a day at her college computer lab."
  },
  {
   "title": "Quiz score below 70%",
   "text": "Lalitha scores 60% on the quiz. Most wrong answers were about TF-IDF and attention. She watches those two lessons again, redoes the TF-IDF practice, and then takes the quiz again."
  }
 ],
 "keyTerms": [
  {
   "title": "A UPI complaint in Indore",
   "text": "A bank in Indore gets \"UPI payment failed again!\" Tokenisation gives 5 tokens: UPI, payment, failed, again and \"!\". *Stemming* (cutting words to a root form) then turns \"failed\" into \"fail\". So \"fail\", \"fails\" and \"failed\" count as one word."
  },
  {
   "title": "Same words, different winner",
   "text": "\"India beat Australia\" and \"Australia beat India\" give the same bag of words: australia 1, beat 1, india 1. A bag of words throws away word order, so it cannot tell who won the match."
  },
  {
   "title": "Yes or no instead of counts",
   "text": "In scikit-learn, a Python library for machine learning, the word counter `CountVectorizer` has an option `binary=True`. It only marks whether a word is present. So \"coffee is hot hot\" becomes [0 1 1 1] instead of [0 1 2 1]. The two \"hot\"s now count as one."
  },
  {
   "title": "\"Food\" in every review",
   "text": "A Kolkata food app runs TF-IDF on 50,000 reviews. \"Food\" is in almost every review, so its IDF is tiny and its TF-IDF weight is low. Rarer words like \"soggy\" and \"biryani\" get higher weights."
  },
  {
   "title": "One-hot or embedding",
   "text": "With 10,000 words in the vocabulary (the list of all known words), a *one-hot vector* gives each word 10,000 numbers: a single 1 and the rest 0. Every word is equally far from every other. An embedding uses about 100 to 300 numbers, and \"doctor\" sits near \"nurse\"."
  },
  {
   "title": "Raja − aadmi + aurat",
   "text": "Made-up vectors: raja = [0.9, 0.9], aadmi = [0.1, 0.9], aurat = [0.1, −0.9]. So raja − aadmi + aurat = [0.9, −0.9]. Its *cosine similarity* (how closely two arrows point the same way, from −1 to 1) with rani = [0.9, −0.85] is almost 1."
  },
  {
   "title": "The cricketer at Eden Gardens",
   "text": "In \"The cricketer who scored a century at Eden Gardens last winter, after months of injury, is from Mumbai\", the word \"is\" must match \"cricketer\". A plain RNN's memory fades over the long middle. An LSTM's gates can keep \"cricketer\" until the end."
  },
  {
   "title": "A 30-word Hindi sentence",
   "text": "A basic seq2seq model translates a 30-word Hindi sentence into English. All 30 words are squeezed into one fixed list of numbers, so early details get lost. With attention, every English word it writes can look back at all 30 Hindi words."
  }
 ],
 "indiaExample": [
  {
   "title": "Marathi tweets in Pune",
   "text": "Imagine a Pune startup with 5,000 Marathi tweets labelled happy or angry. Word2Vec, a method that learns word vectors, gives weak vectors from so little text. English tools do not fit Marathi either. Fine-tuning IndicBERT, which already knows Marathi, is the best bet."
  },
  {
   "title": "A scheme page in Odia",
   "text": "Imagine a farmer in Odisha opening a government scheme page that is only in English. A translation service built on Bhashini could show it in Odia. He can then read it himself, without asking someone to explain it."
  },
  {
   "title": "Science notes for many states",
   "text": "Imagine a Bhopal ed-tech team that writes science notes in English. IndicTrans2 can translate them into Hindi, Kannada, Bengali and the other scheduled languages with one model. Teachers still check each translation before students see it."
  },
  {
   "title": "Assamese word vectors",
   "text": "Assamese is one of IndicFT's 11 languages. Imagine a Guwahati student who loads its Assamese vectors. She uses the nearest words to widen searches on a local news site, so a search for one word also finds close words."
  },
  {
   "title": "Hindi and Gujarati, one script",
   "text": "Imagine a researcher in Ahmedabad comparing Hindi and Gujarati news. The Indic NLP Library writes the Hindi text in Gujarati letters. Words shared by both languages now look the same, so they can be counted together."
  },
  {
   "title": "A dictionary is not enough",
   "text": "Imagine a team that translates Hindi tweets word by word with a dictionary, then runs an English sentiment model. The idiom \"naak kat gayi\" (we were shamed) becomes \"nose cut went\". Grammar and idioms are lost, so a model built for the language works far better."
  },
  {
   "title": "Hinglish orders in Delhi",
   "text": "Imagine a Delhi electronics shop whose WhatsApp messages say \"mera order kb aayega\". A model trained only on English text misses these. Mapping \"kb\" to \"kab\" and training on real customer messages helps a lot."
  }
 ],
 "commonMistakes": [
  {
   "title": "Three days on an LSTM",
   "text": "Vikram spends three days on an LSTM to route support tickets and gets an F1 score (0 to 1, higher is better) of 0.81. A TF-IDF baseline, built later in 20 minutes, scores 0.80. Now he builds the baseline first, and only then decides if deep learning is worth it."
  },
  {
   "title": "\"Not clean\" became \"clean\"",
   "text": "Sneha's hotel model reads \"not clean, not good\" as praise, because her stop-word list removed \"not\". She keeps \"not\", \"no\" and \"never\". She also sets `ngram_range=(1, 2)` in `CountVectorizer`, so it counts single words and two-word pairs. The complaints come back."
  },
  {
   "title": "English list on Hindi text",
   "text": "Imran runs an English stop-word list on Hindi messages in Devanagari. Nothing is removed, because the list has only English words. So common Hindi words like hai and ka flood the counts. He switches to a Hindi tokeniser and a Hindi stop-word list."
  },
  {
   "title": "Word2Vec on 5,000 tweets",
   "text": "Riya trains Word2Vec, a word-vector method, on 5,000 Marathi tweets. The nearest words to \"chhan\" (nice) look random, because the text is too small. She fine-tunes IndicBERT on the same labelled tweets instead, and her F1 score rises clearly."
  },
  {
   "title": "Three spellings, one word",
   "text": "Customers of a Lucknow shop type \"kab\", \"kb\" or the Devanagari form for the same word. A bag of words treats them as three different tokens, so each count stays small. Mapping all three to one form makes the counts add up."
  },
  {
   "title": "A long sentence loses its start",
   "text": "Deepak's basic seq2seq translates short Hindi sentences well but drops details from the start of long ones. A bigger learning rate does not help. Adding attention lets each English word look back at every Hindi word, and long sentences improve."
  }
 ],
 "selfCheck": [
  {
   "title": "Hint for the hand TF-IDF",
   "text": "Take five messages: \"order late\", \"refund pls\", \"order kab aayega\", \"order not delivered\" and \"refund kab milega\". \"kab\" is in 2 of 5, so IDF = log(5 ÷ 2) ≈ 0.4, using log base 10. In \"order kab aayega\" it appears once, so TF-IDF ≈ 1 × 0.4 = 0.4."
  },
  {
   "title": "Why \"order\" scores lower",
   "text": "\"order\" is in 3 of the same 5 messages, so IDF = log(5 ÷ 3) ≈ 0.22. It is in more messages than \"kab\", so it tells them apart less. A good answer says this in words, not only in numbers."
  },
  {
   "title": "Finding the top words",
   "text": "Say your trained model is `clf` and your TF-IDF tool is `tfidf`. Then `clf.coef_[0]` holds one weight per word: a number for how strongly that word pushes the answer. `tfidf.get_feature_names_out()` gives the words in the same order. Sort the weights. The biggest weights push towards \"positive\", like \"excellent\", and the most negative ones push towards \"negative\", like \"worst\"."
  },
  {
   "title": "Sample note for the client",
   "text": "Sample answer: \"The LSTM scored F1 0.87 and TF-IDF scored 0.85. The LSTM took 30 minutes on a GPU (a fast chip), and TF-IDF took 1 minute on a laptop. I would deliver TF-IDF, because it is cheaper, faster and easier to explain.\""
  },
  {
   "title": "Looking for bias",
   "text": "In gensim, a Python library for word vectors, try `wv.most_similar('engineer')` and `wv.most_similar('nurse')` on pretrained vectors. If male words gather near one and female words near the other, note it. A resume tool built on such vectors could rank women lower for engineering jobs."
  },
  {
   "title": "Two differences, worked",
   "text": "Sample answer: \"Script: Hindi uses Devanagari, and a sentence ends with a vertical line called the danda. An English sentence splitter like NLTK's ends a sentence only at a full stop, a question mark or an exclamation mark, so it misses the danda. Spelling: people type kab, kb or the Devanagari form for one word.\""
  }
 ]
};
