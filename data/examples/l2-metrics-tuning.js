/* AI Marg lesson-card examples for one module (loaded with its lesson cards). JavaScript holding JSON. */
window.AIM = window.AIM || {};
window.AIM.examples = window.AIM.examples || {};
window.AIM.examples["l2-metrics-tuning"] = {
 "overview": [
  {
   "title": "Airport metal detector",
   "text": "At a busy airport, a detector set very high beeps for coins, belts and hairpins. Queues grow, but almost nothing slips through. Set very low, the queue moves fast, but a real knife might pass. Every setting is a trade-off (समझौता, samjhauta) between the two mistakes."
  },
  {
   "title": "UPI fraud alerts in Chennai",
   "text": "Imagine a Chennai bank scoring 1,000 UPI payments, of which 20 are fraud. At threshold 0.5 it flags 25 payments, and 15 of them are real frauds. So precision is 15 ÷ 25 = 60%, and recall is 15 ÷ 20 = 75%."
  },
  {
   "title": "TB screening camp in Odisha",
   "text": "At an imagined rural health camp, a model decides who gets a confirmatory TB test. Missing a sick person is far worse than one extra test. So the team lowers the threshold to 0.2. More people get tested, and fewer sick people are missed."
  },
  {
   "title": "Spam filter in a Ludhiana office",
   "text": "Gurpreet's office uses a spam filter. A false alarm sends a client's order email to spam, which could lose a ₹2,00,000 deal. A missed spam email wastes 10 seconds. Here false alarms are the costly mistake, so the threshold should be high."
  },
  {
   "title": "Riya's lucky test split",
   "text": "Riya tests her loan model on one split and gets 88%. With 5-fold cross-validation (5 rounds, each tested on a different slice), she gets 81, 85, 79, 84 and 81%. Her model's real level is probably close to 82%. Her first number was partly luck."
  },
  {
   "title": "Arjun tunes an IPL model",
   "text": "Arjun's model predicts whether an IPL team will win a match. He uses a decision tree, which asks yes/no questions one after another. He tries depths (questions in a row) of 3, 5 and 8. Depth is a hyperparameter, a setting chosen before training. Cross-validation shows that depth 5 works best, so he keeps it."
  },
  {
   "title": "Rare loan defaults in Kolhapur",
   "text": "Imagine a Kolhapur co-operative bank where 3 of every 100 loans default. A model that says 'no default' for everyone is 97% accurate. It is also useless, because it never warns about a single bad loan."
  }
 ],
 "outcomes": [
  {
   "title": "Fatima reads a clinic table",
   "text": "Fatima checks a diabetes screening model in Hyderabad. Its table shows TP = 40 (sick and flagged), FN = 10 (sick but missed) and FP = 30 (healthy but flagged). She works out recall = 40 ÷ 50 = 80% and precision = 40 ÷ 70 ≈ 57%. She reports both to the doctors."
  },
  {
   "title": "Fewer mistakes, more rupees",
   "text": "Arjun compares two fraud models. Model A makes 30 misses and 600 false alarms; B makes 60 misses and 150 false alarms. At ₹4,000 per miss and ₹50 per false alarm, A costs ₹1,50,000 and B costs ₹2,47,500. B makes fewer mistakes, but he picks A."
  },
  {
   "title": "Recall for a saree shop owner",
   "text": "Lakshmi builds a model that warns which customers may stop buying at a Madurai saree shop. She tells the owner: 'Recall 70% means that of every 10 customers who were really leaving, we warned you about 7.'"
  },
  {
   "title": "Stratified folds for a lender",
   "text": "Karthik runs 5-fold stratified cross-validation on Coimbatore loan data, where only 3% of loans default. Every fold keeps about 3% defaults, so each fold's score is fair. He reports 0.78 give or take 0.02, not one lucky number."
  },
  {
   "title": "Neha tunes on free Colab",
   "text": "Neha must tune 6 hyperparameters on free Colab (Google's online notebook). Each run takes 10 minutes. A full grid with 10 values each would need 10,00,000 runs. She runs Optuna with 50 trials instead, which takes about 8 hours."
  },
  {
   "title": "SMOTE in the right place",
   "text": "Rahul puts SMOTE and his model inside one imbalanced-learn `Pipeline`, a chain of steps that runs in order. During cross-validation, SMOTE now runs only on the training folds. His recall drops from a too-good 0.95 to an honest 0.78. It is close to what he later sees in real use."
  }
 ],
 "studySteps": [
  {
   "title": "One hour after office",
   "text": "Suresh, a bank clerk in Kanpur, has one free hour a day. Day 1: confusion matrix videos and paper sums. Day 2: ROC and PR videos plus the Threshold lab. Day 3: the other videos. Day 4: practice and quiz. Weekend: the ₹ cost task."
  },
  {
   "title": "College student in Pune",
   "text": "Anjali writes one small card for each score: precision = TP ÷ (TP + FP) and recall = TP ÷ (TP + FN). Before each lecture, she does one quick sum from memory. Within a week, she stops mixing up the two."
  },
  {
   "title": "Homemaker with short breaks",
   "text": "Shabana in Lucknow studies in 20-minute breaks. In one break she only plays with the Threshold lab. She writes down three thresholds with the precision and recall at each, so she sees the trade-off herself."
  },
  {
   "title": "Weekend learner in Bengaluru",
   "text": "Rahul studies on Saturday and Sunday. Saturday: all the videos and the lab. Sunday: practice, the quiz and the ₹ cost task. He starts his tuning runs first on Sunday, because a big search can run for a long time on free Colab (Google's online notebook)."
  },
  {
   "title": "Slow connection in Sikkim",
   "text": "Tenzin has a slow, costly mobile connection. She downloads the videos at low quality on the library Wi-Fi. At home, she does all the paper sums on precision, recall and F1 with no internet at all."
  },
  {
   "title": "Quiz score below 70%",
   "text": "Kiran scores 60% on the quiz. Most wrong answers mix up precision and recall. She watches the confusion matrix lesson again, redoes the paper sums, and then retakes the quiz."
  }
 ],
 "keyTerms": [
  {
   "title": "Confusion matrix at a clinic",
   "text": "Imagine a Kochi clinic screening 200 people for diabetes. TP = 18 (sick and flagged), FN = 2 (sick but missed), FP = 30 (healthy but flagged), TN = 150 (healthy and cleared). The four boxes add up to 200."
  },
  {
   "title": "Precision of an office spam filter",
   "text": "An office spam filter in Noida sends 50 emails to spam in a week. 45 really are spam, so precision = 45 ÷ 50 = 90%. The other 5 were real emails, hidden by mistake."
  },
  {
   "title": "Recall at a TB camp",
   "text": "A health camp has 100 people with TB. The model flags 70 of them. Recall = 70 ÷ 100 = 70%. The 30 it missed are false negatives, the costliest mistake here."
  },
  {
   "title": "The ROC curve in plain words",
   "text": "The ROC curve plots recall (the catch rate) against the false-alarm rate (the share of honest payments flagged). Each threshold gives one point. A curve that hugs the top-left corner is good. The area under it is the AUC."
  },
  {
   "title": "Why PR beats ROC for rare fraud",
   "text": "10,000 payments, 20 frauds. The model catches 18, with 200 false alarms. That is only 2% of honest payments, so the ROC curve looks fine. But precision = 18 ÷ 218 ≈ 8%. The PR curve shows that most alarms are false."
  },
  {
   "title": "A mango sorter's k",
   "text": "Imagine a Ratnagiri mango sorter using KNN, which labels a fruit by its k nearest neighbours. With k = 1 it copies one neighbour's mistakes; with k = 51 it blurs real differences. Cross-validation shows k = 7 works best, so k is a hyperparameter you tune."
  },
  {
   "title": "Scores in code",
   "text": "`precision_score(y_true, y_pred)` compares the real answers (y_true) with the model's answers (y_pred). With y_true = [1, 1, 0, 0] and y_pred = [1, 0, 1, 0], TP = 1, FP = 1 and FN = 1. So precision = 0.5, recall = 0.5, and `f1_score` gives 0.5."
  },
  {
   "title": "Class weights in one line",
   "text": "`LogisticRegression(class_weight='balanced')` builds a common yes/no model that counts mistakes on the rare class more. With 1 fraud in 100 payments, each fraud row counts about 99 times as much as a normal row during training."
  },
  {
   "title": "SMOTE for grape disease",
   "text": "A Nashik grape farm's data has 2,000 leaf records, but only 60 show disease. SMOTE blends pairs of nearby diseased rows to make 300 more, in the training data only. Now the model sees enough diseased examples to learn from."
  }
 ],
 "indiaExample": [
  {
   "title": "Strict or sensitive setting",
   "text": "Imagine a bank with 10 lakh accounts, 500 of them mule accounts. A strict threshold flags 300 accounts: 240 mules and 60 honest ones. A sensitive threshold catches 450 mules, but also freezes 2,000 honest customers."
  },
  {
   "title": "When complaints rise",
   "text": "Imagine that freezing honest accounts brings angry calls and bad news stories. False alarms now cost more, so the bank raises the threshold. It flags fewer accounts and keeps precision high. But recall falls, and more mules slip through."
  },
  {
   "title": "Imagined TB X-ray tool in Bihar",
   "text": "Imagine a district TB programme using an AI tool on chest X-rays. A missed case can spread the disease, so the tool uses a low threshold. Many flagged people turn out healthy after a lab test, and that cost is accepted."
  },
  {
   "title": "Microfinance defaults in Assam",
   "text": "Imagine a microfinance company in Assam where 4 in 100 loans go bad. Its first model shows 96% accuracy by approving everyone. The team switches to recall and PR-AUC (the area under the precision-recall curve), and uses `class_weight='balanced'` so missed defaults count more."
  },
  {
   "title": "Crop insurance claims",
   "text": "Imagine an insurer in Maharashtra checking crop insurance claims for fraud. Only a few claims are fake, and a wrong rejection hurts a genuine farmer badly. So it values precision, and a human officer reviews every flagged claim."
  },
  {
   "title": "Tatkal booking bots",
   "text": "Imagine a train booking website that tries to spot bot accounts during Tatkal booking. Blocking a real passenger at that moment is costly. The team tests many thresholds and keeps the one with the lowest total cost of both mistakes."
  }
 ],
 "commonMistakes": [
  {
   "title": "99.5% accuracy, zero frauds",
   "text": "Vikram's wallet fraud model shows 99.5% accuracy on data with 0.5% fraud. Its recall is 0: it never flags anything. He adds `class_weight='balanced'`, which makes missed frauds count more in training. He judges by precision, recall and PR-AUC. Accuracy drops a little, but now it catches most frauds."
  },
  {
   "title": "Peeking at the test set",
   "text": "Sneha checks the test score after each of 40 changes and keeps the best: 91%. On new data next month, the model scores 84%. Now she tunes with cross-validation and opens the test set only once."
  },
  {
   "title": "SMOTE before the split",
   "text": "Imran runs SMOTE on all the data, then 5-fold cross-validation, and sees recall 0.95. In real use, recall is 0.60. Synthetic twins of validation rows were in training. With SMOTE inside the Pipeline, cross-validation gives an honest 0.62."
  },
  {
   "title": "Stuck at 0.5",
   "text": "Deepa's TB model uses the default threshold 0.5 and misses 30 of 100 sick people. She lowers it to 0.2. Now it misses only 8, while 60 more healthy people get one extra, cheap test."
  },
  {
   "title": "A fold with no defaults",
   "text": "Rohan uses plain `KFold` on 500 loans with 15 defaults. One fold gets 0 defaults, so its recall cannot even be worked out. With `StratifiedKFold`, each of the 5 folds gets 3 defaults."
  },
  {
   "title": "A grid that would take 19 years",
   "text": "Kavya sets 10 values for each of 6 hyperparameters: 10,00,000 runs. At 10 minutes a run, that is about 19 years. She switches to Optuna with 50 trials, and it finishes overnight."
  }
 ],
 "selfCheck": [
  {
   "title": "Paper task, step by step",
   "text": "The model flagged 100, and 30 were real: TP = 30, FP = 70. There were 50 frauds, so FN = 20. Precision = 30 ÷ 100 = 30%. Recall = 30 ÷ 50 = 60%. F1 = 2 × 0.3 × 0.6 ÷ 0.9 = 40%."
  },
  {
   "title": "Why F1 is not 45%",
   "text": "F1 is the harmonic mean, which is pulled towards the smaller value. The simple average of 30% and 60% is 45%, but F1 is 40%. So a model must be decent at both to earn a high F1."
  },
  {
   "title": "Building the cost loop",
   "text": "`p = model.predict_proba(X_test)[:, 1]` gives each test row's fraud probability (`[:, 1]` keeps the column for class 1, fraud). For each threshold t, `pred = (p >= t).astype(int)` turns scores into 1 (flag) or 0. Count misses and false alarms; cost = misses × 20,000 + false alarms × 200."
  },
  {
   "title": "Reading the cost curve",
   "text": "In one practice run, the cost is lowest at threshold 0.40: about ₹8.6 lakh, against ₹9.5 lakh at 0.5. A good answer then says why. A miss costs 100 times a false alarm, so the cheapest threshold sits low."
  },
  {
   "title": "One split versus five folds",
   "text": "Sample answer: 'One split gave 86%. Five folds gave 81, 85, 79, 84 and 81%: mean 82%, standard deviation about 2. So one split could be off by 4 points just by luck.'"
  },
  {
   "title": "Comparing three fixes",
   "text": "A good answer is a small table: the three fixes in rows, recall and average precision in columns. Your numbers will differ. Then say which fix you would choose for a fraud team, and why."
  }
 ]
};
