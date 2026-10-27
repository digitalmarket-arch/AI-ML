/* AI Marg lesson-card examples for one module (loaded with its lesson cards). JavaScript holding JSON. */
window.AIM = window.AIM || {};
window.AIM.examples = window.AIM.examples || {};
window.AIM.examples["l2-classification"] = {
 "overview": [
  {
   "title": "Mango sorting in Ratnagiri",
   "text": "A trader notes 500 past mangoes: weight, colour score and firmness, plus where each one went, 'export' or 'local'. A classifier learns his sorting rule from these notes. A new 286 g, deep-yellow, firm mango comes out as 'export'."
  },
  {
   "title": "Spam SMS on Riya's phone",
   "text": "Riya in Pune gets 'Your KYC is pending, click this link'. A spam filter gives it a 0.93 probability of being spam, a 93% chance. That is above the 0.5 cut-off, so the message goes to her spam folder."
  },
  {
   "title": "Number or category?",
   "text": "Gurpreet teaches in Ludhiana. 'Will this student pass the board exam?' has a yes or no answer, so it is classification. 'How many marks will she get?' has a number answer, so it is regression."
  },
  {
   "title": "KNN at a Jaipur shoe shop",
   "text": "Imagine a shoe shop in Jaipur. A new customer's age and budget are close to 5 past customers. Four of them bought sports shoes and one bought sandals. KNN with k = 5 lets these 5 neighbours vote, so it predicts 'sports shoes'."
  },
  {
   "title": "Leaf diseases near Nashik",
   "text": "Imagine an app for grape farmers near Nashik. A farmer photographs a leaf, and the app picks one of 5 disease names. With more than two possible classes, this is called multiclass classification."
  },
  {
   "title": "When a straight line fails",
   "text": "Imagine a Kochi bakery's delivery map. Orders within 3 km, in any direction, arrive hot, and orders farther away arrive cold. On the map, the hot orders fill a circle and the cold ones surround it. No straight line can split them, so you need a method that draws curves."
  }
 ],
 "outcomes": [
  {
   "title": "Reading a loan score",
   "text": "Arjun in Indore checks a loan model's score: z = 0.8 × income in lakh − 0.5 × loans − 3. An applicant earning ₹6 lakh with 2 loans gets z = 0.8. The sigmoid gives about 0.69, so the model approves."
  },
  {
   "title": "Four models, one table",
   "text": "Fatima in Hyderabad trains all four classifiers on the same health data. Logistic regression gets 96% of the test cases right, close to the best. She picks it, because its weights are easy to explain to doctors."
  },
  {
   "title": "Scaling before KNN",
   "text": "Kiran in Bhubaneswar builds KNN on income in rupees and age in years. Before training, she adds `StandardScaler`, which puts both columns on a similar range. Now a 25-year age gap counts, instead of being drowned by income."
  },
  {
   "title": "Spam filter for a coaching centre",
   "text": "Lakshmi runs a coaching centre in Madurai. Her number gets many fake 'free recharge' SMS. She builds a Naive Bayes filter from 200 messages she has marked herself, and it now catches most of the new fake ones."
  },
  {
   "title": "A round patch of fresh potatoes",
   "text": "Imran runs a cold store in Agra. Potatoes stay fresh only when temperature and humidity are both in a middle range. On a chart, fresh batches form a round patch, with spoiled ones all around. A straight-line SVM fails. He switches to `SVC(kernel='rbf')`, an SVM with a curve-drawing kernel, and the boundary becomes a loop."
  },
  {
   "title": "Four kinds of rice",
   "text": "Meera wraps logistic regression in `OneVsRestClassifier` to sort rice photos into 4 kinds: basmati, sona masoori, ponni and gobindobhog. It trains 4 yes/no models, one per kind. For one photo, the 'ponni' model is the most sure, at 0.81, so the app says 'ponni'."
  }
 ],
 "studySteps": [
  {
   "title": "One hour after work",
   "text": "Mohan manages a shop in Surat and has one free hour a night. Day 1: sigmoid videos. Day 2: KNN videos and the lab. Day 3: Naive Bayes, SVM and multiclass. Day 4: practice and the quiz."
  },
  {
   "title": "College student in Bhubaneswar",
   "text": "Ananya opens the KNN lab between classes. She saves a screenshot of the boundary at k = 1, 5 and 25. Side by side, the change from jagged to smooth to over-smooth is easy to see."
  },
  {
   "title": "Homemaker in Kozhikode",
   "text": "Ayesha studies in 20-minute breaks. She works out the sigmoid of −2 on her phone calculator. For z = −2, e^(−z) is e², about 7.39 (e is a fixed number, about 2.72). So 1 ÷ (1 + 7.39) ≈ 0.12. One break, one idea."
  },
  {
   "title": "Weekend learner in Gurugram",
   "text": "Rohit studies on Saturday and Sunday. Saturday: all videos and the lab. Sunday: the three practice exercises, the quiz and Self-check. He keeps two hours for the spam filter, because it needs patience (धैर्य, dhairya)."
  },
  {
   "title": "Slow internet in Shillong",
   "text": "Daphne has a slow connection, so she watches videos at low quality to save data. She does the sigmoid sums and a tiny word-count spam table in her notebook, with no internet at all."
  },
  {
   "title": "Quiz score below 70%",
   "text": "Kiran scores 60%. Most wrong answers mix up one-vs-rest and one-vs-one. She decides to rewatch (दोबारा देखना, dobara dekhna) the multiclass lesson. She counts the models for 5 classes on paper, then takes the quiz again."
  }
 ],
 "keyTerms": [
  {
   "title": "Threshold for fraud alerts",
   "text": "Imagine a Kochi bank's fraud (धोखाधड़ी, dhokhadhadi) model. With threshold 0.5, it misses some fraud. The bank lowers it to 0.3. More fraud gets caught, but more honest payments are also stopped for a check."
  },
  {
   "title": "Naive Bayes starts with a prior",
   "text": "Imagine 900 normal and 100 spam SMS in training. Before reading a single word, Naive Bayes starts from these counts: 10% spam. This starting chance is called the *prior*. Naive Bayes does not assume the classes are equally common."
  },
  {
   "title": "KNN sorts mango varieties",
   "text": "A new mango weighs 230 g and has a sweetness of 20. Its 3 nearest past mangoes, by Euclidean distance, are all Alphonso. So KNN with k = 3 (`n_neighbors=3` in scikit-learn) says 'Alphonso'."
  },
  {
   "title": "Support vectors in a cotton mill",
   "text": "Imagine a Gujarat cotton mill sorting bales into grade A and grade B by fibre length and strength. An SVM draws the widest gap between the grades. Only the 4 bales touching the gap's edges are support vectors."
  },
  {
   "title": "The C setting in an SVM",
   "text": "C sets how strict an SVM is. With `SVC(kernel='linear', C=100)`, it allows very few training points inside the gap or on the wrong side, so the gap gets narrow. With `C=0.1`, it is relaxed and keeps a wider gap. C never bends a straight line; only a kernel can."
  },
  {
   "title": "Sigmoid in a cricket app",
   "text": "Imagine an app that scores a chasing team's position as z = 1.2. The sigmoid gives 1 ÷ (1 + e^(−1.2)) ≈ 0.77. The app shows this as a 77% chance to win."
  },
  {
   "title": "Why naive still works",
   "text": "Words in an SMS are not really independent: 'click' and 'link' often come together. Naive Bayes ignores this, yet it still sorts well. It only needs the spam score to beat the normal score, not to be a perfect probability."
  },
  {
   "title": "One-vs-rest for train complaints",
   "text": "Imagine sorting railway complaints into 4 types: food, cleanliness, delay and refund. One-vs-rest trains 4 yes/no models. A complaint that scores 0.81 on 'refund', and lower on the rest, gets the 'refund' label."
  }
 ],
 "indiaExample": [
  {
   "title": "UPI fraud alerts",
   "text": "Imagine a bank in Bengaluru scoring every UPI payment. A ₹48,000 payment at 2 am to a new payee gets a fraud (धोखाधड़ी, dhokhadhadi) probability of 0.91. That is above the bank's cut-off, so it holds the payment and calls the customer."
  },
  {
   "title": "Tamil and English spam SMS",
   "text": "Imagine a Chennai startup with 5,000 SMS in Tamil and English, each marked spam or not spam. It turns them into word counts. Then it trains Multinomial Naive Bayes, a fast classifier that multiplies word clues and is made for counts. Training takes seconds, and it makes a strong first model."
  },
  {
   "title": "Loan approval in Coimbatore",
   "text": "Imagine a small lender in Coimbatore using logistic regression. It gives each fact a weight (how much it counts) and adds them into one score. Its weights are easy to explain to an applicant: 'Your income pushed your score up, but your 3 existing loans pulled it below zero.'"
  },
  {
   "title": "Waitlisted train ticket",
   "text": "Imagine an app that guesses if a waitlisted train ticket will be confirmed. It finds the 7 past tickets most like yours: same train, similar waitlist number, similar days before travel. If 5 of those 7 were confirmed, KNN with k = 7 says 'likely to confirm'."
  },
  {
   "title": "Lead scoring for a Pune agency",
   "text": "Imagine a Pune agency scoring 400 enquiries for a coaching institute by the chance of joining. The sales team calls the top 50 first. Here, classification is used to rank people, not just to label them."
  },
  {
   "title": "Crop disease from a leaf photo",
   "text": "Imagine an app for tomato farmers in Karnataka. It sorts a leaf photo into 'healthy' or one of 3 diseases. With 4 classes, one-vs-rest would train 4 yes/no models behind the scenes."
  }
 ],
 "commonMistakes": [
  {
   "title": "Income numbers hide age",
   "text": "Neha in Lucknow uses KNN to predict who will take a home-loan offer. Yearly income runs from ₹3,00,000 to ₹40,00,000, but age only from 22 to 65. Accuracy is poor, because age hardly counts. After `StandardScaler`, both features count fairly, and accuracy improves."
  },
  {
   "title": "Only yes or no",
   "text": "Rahul's lead model in Kolkata uses `predict()` and marks 300 enquiries as 'will buy'. The sales team can call only 50. With `predict_proba()`, he sorts by probability and gives them the top 50."
  },
  {
   "title": "95% accuracy, zero fraud caught",
   "text": "Sana in Mumbai has 1,000 payments, and 50 are fraud. Her model says 'genuine' every time and scores 95% accuracy. `value_counts()` shows 950 and 50, and she sees that the model has caught no fraud at all."
  },
  {
   "title": "k = 1 looks perfect",
   "text": "Pooja in Patna gets 100% training accuracy with k = 1. On test data, it falls to about 70%. She tries k = 3, 5, 7 and 9 and compares them on held-back data; k = 7 does best."
  },
  {
   "title": "Bending a straight line",
   "text": "Arun in Vadodara checks pumps with two sensor readings. Healthy pumps form a round patch on the chart, with faulty ones all around. He raises C from 1 to 100 on a linear SVM. The line moves a little, but it stays straight. `SVC(kernel='rbf')` finally draws the loop he needs."
  },
  {
   "title": "Linear regression for spam",
   "text": "Divya in Chennai fits linear regression to spam labels 0 and 1. Some predictions come out as 1.3 and −0.2, which cannot be chances. Logistic regression keeps every answer between 0 and 1."
  }
 ],
 "selfCheck": [
  {
   "title": "Hint for the four-model table",
   "text": "`make_pipeline(StandardScaler(), SVC())` joins two steps: scale, then train. `train_test_split(X, y, random_state=0)` keeps 25% of the rows aside for testing, and `random_state=0` gives the same split every time. Expect all four between about 91% and 98%. A good answer weighs a 1% gain against how easy the model is to explain."
  },
  {
   "title": "Sigmoid by hand",
   "text": "e is a fixed number, about 2.72, so e² ≈ 7.39 and e^(−2) = 1 ÷ 7.39 ≈ 0.135. Then sigmoid(−2) = 1 ÷ (1 + 7.39) ≈ 0.12, and sigmoid(2) = 1 ÷ (1 + 0.135) ≈ 0.88. In Python, `np.exp(2)` from NumPy (Python's library for numbers) gives e². For a spam filter, 0.88 means about an 88% chance of spam: marked spam at 0.5, but some doubt remains."
  },
  {
   "title": "Building the spam filter",
   "text": "`vec = CountVectorizer()` and then `X = vec.fit_transform(sms)` turn messages into word counts. Train with `MultinomialNB().fit(X, labels)`. For new messages, use `vec.transform(new_sms)`, not `fit_transform`, so the word list stays the same."
  },
  {
   "title": "A word missing from spam",
   "text": "If a word never appeared in spam, its chance there would be 0. Multiplying by 0 would wipe out every other clue. `MultinomialNB` adds 1 to every word count by default (`alpha=1.0`) to stop this."
  },
  {
   "title": "Reading the moons plot",
   "text": "Sample answer: 'Logistic regression adds up the features into one score, so its boundary is a straight line. It cuts off the tips of both moons. The RBF kernel lets the SVM bend its boundary between the moons.'"
  },
  {
   "title": "Thinking through scaling",
   "text": "Without scaling, a ₹5,000 income gap counts far more than a 30-year age gap. So 'neighbours' are just people with similar income. After `StandardScaler`, each column is counted in steps of its own usual spread, so age counts again. A good answer names the feature that was being ignored."
  }
 ]
};
