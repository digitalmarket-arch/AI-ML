/* AI Marg lesson-card examples for one module (loaded with its lesson cards). JavaScript holding JSON. */
window.AIM = window.AIM || {};
window.AIM.examples = window.AIM.examples || {};
window.AIM.examples["l2-ml-foundations"] = {
 "overview": [
  {
   "title": "Delivery time in Bengaluru",
   "text": "An app has 10,000 past orders. Each row has the distance, the hour and the rain (features) and the minutes it took (label). The model learns from these rows and predicts 38 minutes for your new 4 km order on a rainy evening."
  },
  {
   "title": "Board exam piles in Jaipur",
   "text": "Riya's teacher gives her practice papers (training), then one mock test (validation), and finally the board exam (test). Riya never sees the board paper early. So her final marks show what she really learned."
  },
  {
   "title": "Memorised sums in Kochi",
   "text": "Arjun memorises 50 solved maths sums. He scores 100% when the same sums come back, but only 40% on new sums. An overfit model behaves the same way: perfect on training rows, poor on new rows."
  },
  {
   "title": "Onion prices in Nashik",
   "text": "Imagine a trader who fits one straight line to a whole year of onion prices. Prices rise and fall with the seasons, but a straight line cannot bend. It is wrong on old months and new months alike: that is underfitting."
  },
  {
   "title": "A leaked answer at a shop",
   "text": "Imagine Zoya's online saree shop in Surat. Her model predicts which orders will be returned. One column, \"refund paid\", exists only after a return, so the model looks almost perfect in testing. For a new order, that column is always empty."
  },
  {
   "title": "Three lines of scikit-learn",
   "text": "Fatima in Hyderabad writes `model = LinearRegression()`, then `model.fit(X_train, y_train)`, then `model.predict(X_new)`. The first line picks a model. The second makes it learn. The third gives answers for new rows."
  }
 ],
 "outcomes": [
  {
   "title": "Label for a Pune flat",
   "text": "Priya wants to predict flat prices in Pune from area, bedrooms and locality. She marks the sale price as the label and the other three as features. The answer is a number, so she calls it regression."
  },
  {
   "title": "Fraud or groups?",
   "text": "At a Chennai bank, Kiran gets two tasks. \"Is this payment fraud?\" picks a group using past answers, so it is classification. \"Sort customers into groups by spending, with no answers given\" is clustering."
  },
  {
   "title": "Reading two scores",
   "text": "Imran's admission model for a Kanpur college scores 97% on training data but only 70% on validation data. The big gap tells him it is overfitting. He makes the model simpler and checks the validation score again."
  },
  {
   "title": "A leak in a bill model",
   "text": "Neha predicts which electricity bills in Bhopal will be paid late. One column says \"late fee charged\". That fee is added only after a bill is already late, so it leaks the answer. She deletes the column."
  },
  {
   "title": "Retraining after an MSP change",
   "text": "An agri-startup's crop-price model works well at launch. Six months later, a new MSP (the minimum price at which the government buys some crops) changes how prices move. Monitoring shows the errors have doubled, so the team retrains on fresh data."
  },
  {
   "title": "Beating the baseline",
   "text": "Arjun's baseline always guesses the average delivery time, 35 minutes, and is off by 9 minutes on average. His real model is off by 5 minutes. So he reports that his model beats the baseline by 4 minutes."
  }
 ],
 "studySteps": [
  {
   "title": "One hour after office",
   "text": "Rohit works in a Gurugram office and has one free hour a day. Day 1: lifecycle videos and one-line summaries. Day 2: split, overfitting and leakage videos. Day 3: the lab. Day 4: practice and the quiz. Sunday: two Colab tasks."
  },
  {
   "title": "College student in Bhubaneswar",
   "text": "Ananya opens the Overfitting lab between classes. She raises the degree one step at a time and writes down both errors. When the lab's test error (our validation error) turns upward after degree 4, she circles degree 4 as the sweet spot."
  },
  {
   "title": "Homemaker in Indore",
   "text": "Sunita studies in 30-minute breaks. After each video, she writes one line in Hinglish, like \"Test set = board exam, kholna sirf end mein\". Reading these lines before the quiz takes her only ten minutes."
  },
  {
   "title": "Weekend learner in Chennai",
   "text": "Karthik studies only on Saturday and Sunday. Saturday is for all the videos, with a pause and a guess before each answer. Sunday is for the lab, the practice exercises, the quiz and two self-check tasks."
  },
  {
   "title": "Slow connection in Himachal",
   "text": "Pooja lives in a hill village with a weak signal. She watches videos at low quality to save data. She does the enquiry task on paper, with no internet, and runs the Colab tasks when she visits town."
  },
  {
   "title": "Quiz score below 70%",
   "text": "Farhan scores 60% on the quiz. Three of his four wrong answers are about leakage. He rewatches the leakage lesson, takes the quiz again and scores 80%."
  }
 ],
 "keyTerms": [
  {
   "title": "IRCTC waitlist, imagined",
   "text": "Imagine predicting if a waitlisted IRCTC ticket will get confirmed. The features are the waitlist number, the days left before the journey and the festival season. The label is \"confirmed: yes or no\", taken from past tickets."
  },
  {
   "title": "Piles at a Kota coaching centre",
   "text": "Imagine a Kota coaching centre with records of past students. It trains a pass-or-fail model on the 2019 to 2022 batches (training set). It compares models on the 2023 batch (validation set) and checks once on the 2024 batch (test set)."
  },
  {
   "title": "Tomato prices: two failures",
   "text": "A straight line through a year of tomato prices misses the summer jump, so it underfits. A wildly bendy curve passes through every daily price, even the random spikes, so it overfits. Next month, both predict badly."
  },
  {
   "title": "Bias and variance in cricket",
   "text": "Bowler A always lands the ball wide outside off stump: steady, but off target, like high bias. Bowler B sprays the ball everywhere, like high variance. A good model, like a good bowler, is both steady and on target."
  },
  {
   "title": "Leakage at a hospital",
   "text": "Imagine a Lucknow hospital model that predicts diabetes. One column is \"insulin prescribed\", which doctors give only after they find diabetes. That is data leakage. The model looks brilliant in testing but cannot help before a doctor has found the disease."
  },
  {
   "title": "Baseline at a chai stall",
   "text": "Raju's stall in Varanasi sells 300 cups of chai a day on average. A baseline that always guesses 300 is off by 40 cups a day on average. His real model is off by 25 cups, so it beats the baseline by 15 cups."
  }
 ],
 "indiaExample": [
  {
   "title": "Monsoon in Mumbai",
   "text": "Imagine a Mumbai delivery model trained only on January to April orders. In July, heavy rain slows every ride, and the errors jump. This is *drift*: new data no longer follows the old patterns. Monitoring live errors shows it early, and retraining with monsoon weeks fixes it."
  },
  {
   "title": "UPI volume at a bank",
   "text": "Imagine a bank that predicts next week's UPI payment volume. A random split gave a great score, but real forecasts were poor. Training on older weeks and testing on later weeks gave an honest, lower score and a better plan."
  },
  {
   "title": "OPD waiting time in Hyderabad",
   "text": "Imagine a Hyderabad hospital that shows each patient a waiting time at the OPD (outpatient) desk. Features: patients ahead in the queue, the doctor and the hour. Label: minutes past patients actually waited. \"Time the doctor called you\" comes later, so using it is leakage."
  },
  {
   "title": "Train delay, Amritsar to Delhi",
   "text": "Imagine predicting how late a train will reach Delhi, at the moment it leaves Amritsar. Safe features: how late it left, the day and the fog (कोहरा, kohra) forecast. The delay at Ambala, a station on the way, comes later. Using it would be leakage."
  },
  {
   "title": "Board results in Tamil Nadu",
   "text": "Imagine a school group predicting which students may fail Class 12. Safe features: attendance and pre-board marks, known before the exam. Leaky features: revaluation requests and supplementary exam registrations, known only after results."
  },
  {
   "title": "Tatkal demand on IRCTC",
   "text": "Imagine predicting next week's Tatkal ticket demand for a Patna to Delhi train. You train on older weeks and test on the latest four weeks. This copies real use, where the model always predicts weeks it has never seen."
  }
 ],
 "commonMistakes": [
  {
   "title": "Testing on training rows",
   "text": "Vikram checks his Pune rent model on the same rows it learned from. Its R² (a score where 1 is perfect) is 0.98. On a proper test split, R² drops to 0.71. The fix: split first and report only the test score."
  },
  {
   "title": "Scaling before splitting",
   "text": "Sneha scales the numbers 10, 20, 30 and 40 together, then keeps 40 as the test row. The scaler's average now includes 40, so 40 becomes 1.34. Fitted on the training rows alone, it would honestly become 2.45."
  },
  {
   "title": "No-rain forecaster in Jaisalmer",
   "text": "In desert Jaisalmer, a forecaster who says \"no rain\" every day is right on most days. But he never warns anyone about the rare (दुर्लभ, durlabh) rainy day. An always-no baseline is the same: high accuracy, zero useful warnings."
  },
  {
   "title": "Shuffled kirana sales",
   "text": "Meena's model for her Nagpur kirana shop uses a random split of daily sales. Its error looks like ₹500 a day. With a time split, training on older months and testing on the latest month, the honest error is ₹1,400."
  },
  {
   "title": "More data for a straight line",
   "text": "Deepak adds two more years of rows to his straight-line power-demand model. The error stays near 900 MW. Adding temperature and day of the week as features finally brings the error down."
  },
  {
   "title": "Tuning on the test set",
   "text": "Ayesha tries 30 settings and keeps whichever gives the best test score, 92%. After launch, the real accuracy is 85%. Next time, she tunes on the validation set and opens the test set only once."
  }
 ],
 "selfCheck": [
  {
   "title": "Hint for the housing task",
   "text": "Get the data with `X, y = fetch_california_housing(return_X_y=True)`. After the split, call `fit` on the training rows for both models. Then `score` on the test rows gives R². The baseline should land near 0, and the linear model clearly higher."
  },
  {
   "title": "A sample one-line answer",
   "text": "\"On unseen houses, the baseline's R² is about 0 and the linear model's is about 0.58. So the straight line explains over half of the price differences that a plain average misses.\" Name both numbers, then say what they mean."
  },
  {
   "title": "Reading the tree table",
   "text": "Depth 1 scores only about 0.32 on training and 0.28 on test: poor on both, so it underfits. With no limit (`None`), training R² is 1.0 but test R² is only about 0.62, so it overfits. The best test score comes from a middle depth. In a real project, choose it on a validation set."
  },
  {
   "title": "Enquiry task: a sample list",
   "text": "Keep: where they found us, city, type of business, budget mentioned and pages seen on your website. Cross out: advance payment received, contract signed date and first invoice amount. Label: became a paying client, yes or no."
  },
  {
   "title": "Why cross out the advance?",
   "text": "An advance payment happens only after the client says yes. When a new enquiry arrives, this column is always empty. A model trained on it looks brilliant in testing and then fails in real use."
  },
  {
   "title": "Five sentences for a friend",
   "text": "Sample: \"A model is like a student. Practice papers teach it. The board exam shows what it really learned. If it sees the exam paper early, its marks mean nothing. So we keep the test data sealed until the end.\""
  }
 ]
};
