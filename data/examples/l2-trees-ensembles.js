/* AI Marg lesson-card examples for one module (loaded with its lesson cards). JavaScript holding JSON. */
window.AIM = window.AIM || {};
window.AIM.examples = window.AIM.examples || {};
window.AIM.examples["l2-trees-ensembles"] = {
 "overview": [
  {
   "title": "Riya's loan checklist",
   "text": "Riya in Madurai earns ₹62,000 a month and has never missed an EMI. The tree asks: income above ₹50,000? Yes. Missed an EMI last year? No. The leaf at the end of that path says approve."
  },
  {
   "title": "One mixed group",
   "text": "A lender has 10 past applicants: 6 repaid and 4 did not. Gini impurity = 1 − 0.6² − 0.4² = 0.48, so the group is quite mixed. A group where all 10 repaid has a Gini of 0."
  },
  {
   "title": "A tree that learns by heart",
   "text": "Imagine a Jaipur phone shop's tree with 300 questions, almost one for every past customer. It is 100% right on those old customers. On next month's new customers, it is right only 70% of the time."
  },
  {
   "title": "A forest votes on fraud",
   "text": "Imagine a Kolkata bank's forest of 100 trees checking a ₹40,000 UPI payment made at 2 am. 83 trees say \"fraud\" and 17 say \"safe\". The majority (बहुमत, bahumat) wins, so the bank holds the payment for a check."
  },
  {
   "title": "Boosting delivery minutes",
   "text": "A Bengaluru food app predicts delivery time. The first tree guesses 30 minutes for an order that took 40. The next tree learns the 10-minute gap that is left over. Step by step, the guesses get closer."
  },
  {
   "title": "Rice harvest questions",
   "text": "Imagine a farm tree in Odisha. It asks: rainfall above 800 mm this season? Then: average temperature above 20°C? Farms with yes to both usually had a good rice harvest."
  },
  {
   "title": "SHAP gives a reason",
   "text": "Fatima in Hyderabad is refused a loan. SHAP shows that her low CIBIL score pushed her risk up the most. The lender can now tell her the main reason, not just \"no\"."
  }
 ],
 "outcomes": [
  {
   "title": "Choosing the first question",
   "text": "Anjali in Bhopal has 10 loan records: 6 repaid and 4 did not, so the Gini is 0.48. The metro question lowers it only to 0.47. The income question lowers it to 0.16, so she picks income first."
  },
  {
   "title": "Taming a churn tree",
   "text": "Arjun's tree for a Pune telecom shop scores 100% on training data but 71% on validation data. He sets `max_depth=4`, so the tree asks at most 4 questions in a row. Validation accuracy rises to 81%."
  },
  {
   "title": "A forest beats one tree",
   "text": "Gurpreet in Ludhiana predicts which kirana shops will reorder stock. One tree gets 78% right on new data. A random forest of 200 trees, each trained on its own random sample, gets 85%."
  },
  {
   "title": "Watching AdaBoost work",
   "text": "Kavya in Mysuru runs AdaBoost on 6 rows. Its first stump, a one-question tree, gets two rows wrong. Those two rows get a bigger weight, and the next stump gets them right."
  },
  {
   "title": "Early stopping for Diwali",
   "text": "Meera in Ahmedabad trains LightGBM to forecast Diwali sale orders, allowing up to 3,000 trees. Validation error stops falling at tree 1,420. Early stopping ends training soon after and keeps the best 1,420 trees."
  },
  {
   "title": "Explaining one rejection",
   "text": "Imran at a Lucknow lender uses SHAP on one rejected loan. It shows: low CIBIL score +9 points of risk, high EMIs +5, good income −4. He turns these into plain reasons for the customer."
  }
 ],
 "studySteps": [
  {
   "title": "One hour after office",
   "text": "Suresh, a bank clerk in Kanpur, has one free hour a day. Day 1: tree videos and the Gini split by hand. Day 2: pruning, forests and the Lab. Day 3: boosting videos. Day 4: SHAP, practice and the quiz."
  },
  {
   "title": "College student in Guwahati",
   "text": "Pinky watches the boosting videos between classes, in order. She writes one line for each: \"AdaBoost gives wrong rows more weight\" and \"gradient boosting learns the gap left over\". She reads them again before XGBoost."
  },
  {
   "title": "Homemaker with short breaks",
   "text": "Shabana in Indore studies in 20-minute breaks. In one break she does the Gini sum on paper: 1 − 0.6² − 0.4² = 0.48. In the next break she tries her own split and checks if the number drops."
  },
  {
   "title": "Weekend learner in Mumbai",
   "text": "Rahul studies only on Saturday and Sunday. On Saturday he does all the videos and the Lab, raising the depth (questions in a row) until test accuracy falls. On Sunday he does practice, the quiz and the SHAP task, which needs patience (धैर्य, dhairya)."
  },
  {
   "title": "Slow internet in Leh",
   "text": "Tenzin has a slow connection in Leh, Ladakh. She watches videos at low quality. Offline, she does the Gini and entropy sums (two scores for how mixed a group is) in a notebook. She opens the Lab only when the network is good."
  },
  {
   "title": "Quiz score below 70%",
   "text": "Kiran scores 60%, and most wrong answers mixed up Gini and entropy. She decides to rewatch (दोबारा देखना, dobara dekhna) the decision tree lesson. She redoes the 50/50 example: Gini 0.5, entropy 1.0. Then she retakes the quiz."
  }
 ],
 "keyTerms": [
  {
   "title": "Gini for a cricket camp",
   "text": "A selection camp in Chennai has 8 players: 4 batters and 4 bowlers. Gini = 1 − 0.5² − 0.5² = 0.5, as mixed as two groups get. A net session with only bowlers has a Gini of 0."
  },
  {
   "title": "Gini in one line of Python",
   "text": "In Python, Gini is `1 - sum((c / n) ** 2 for c in counts)`. Here `counts` holds how many rows have each answer, and `n` is their total. Each `c / n` is one share, `**2` squares it, and `sum(...)` adds the squares. So [6, 4] gives 0.48, [10, 0] gives 0 and [5, 5] gives 0.5."
  },
  {
   "title": "Information gain in a clinic",
   "text": "Imagine a Kochi clinic's 10 patients, half with dengue. \"Fever above 101°F?\" splits them into two pure groups: gain 1.0. \"Lives on an odd-numbered street?\" leaves both groups 50/50: gain 0. The tree picks the fever question."
  },
  {
   "title": "Pruning a churn tree",
   "text": "Imagine a Hyderabad broadband company's tree that predicts which customers will leave. It has 40 levels and 100% training accuracy. Pruning it to `max_depth=5` and `min_samples_leaf=30` drops training accuracy to 86%. But accuracy on new customers rises from 70% to 80%."
  },
  {
   "title": "Bagging mango boxes",
   "text": "Imagine a Ratnagiri mango exporter with 1,000 boxes, each graded A or B. Each of 100 trees learns to predict the grade from its own 1,000 boxes, picked with replacement. About a third of the boxes are missing from each sample, so the trees differ."
  },
  {
   "title": "Boosting a bus arrival time",
   "text": "A Pune bus app predicts arrival times. Tree 1 is 6 minutes off for the evening rush. Tree 2 learns that 6-minute gap and adds part of it. After 300 small trees, the typical miss is under 2 minutes."
  },
  {
   "title": "Early stopping for saree sales",
   "text": "A Surat saree seller's LightGBM model (a boosted-trees library) may use up to 3,000 trees. Validation error is lowest at tree 1,150 and rises after that. Early stopping keeps 1,150 trees, just before the model starts memorising."
  },
  {
   "title": "SHAP for a crop loan",
   "text": "A cooperative bank in Nashik explains one crop-loan decision. Average risk: 8%. Two years of weak monsoon rain: +6 points. Drip irrigation: −3 points. Prediction: 8 + 6 − 3 = 11%."
  }
 ],
 "indiaExample": [
  {
   "title": "Sharing bank data with consent",
   "text": "Imagine Priya in Coimbatore applies for a ₹2 lakh loan on an app. She approves a request to share six months of bank statements through an Account Aggregator. The model reads her salary credits and EMI payments as features."
  },
  {
   "title": "Reasons for a rejection",
   "text": "Imagine a Nagpur NBFC whose model rejects Sanjay's loan. SHAP shows that two missed EMIs pushed his risk up the most. The rejection letter can name this as the main reason, as RBI's fair practices rules ask."
  },
  {
   "title": "RBI's FREE-AI report",
   "text": "In August 2025, an RBI committee published the FREE-AI report on using AI responsibly in finance. It gives advice, not binding rules. One of its seven guiding principles is \"Understandable by Design\". Tools like SHAP are one way to make a tree model's decisions understandable."
  },
  {
   "title": "A worrying pin code",
   "text": "Imagine a Kolkata lender finds that pin code is a top reason for its model's rejections. A pin code can quietly stand in for a person's community or how rich the area is. That can bring in bias (पक्षपात, pakshpaat), so the lender reviews or removes it."
  },
  {
   "title": "A readable tree for a co-op",
   "text": "Imagine a cooperative bank in rural Punjab that gives crop loans. Its staff must follow and check every decision by hand. A tree with five questions on land, irrigation and past repayment fits on one page. So they choose it over XGBoost, a strong boosted-trees library."
  },
  {
   "title": "Two-wheeler insurance in Pune",
   "text": "Imagine a Pune insurer that prices two-wheeler insurance. Boosted trees predict the chance of a claim from bike age, city, rider age and past claims. Riders with a higher chance pay a higher premium, the yearly price of the policy."
  },
  {
   "title": "Diwali demand in Bengaluru",
   "text": "Imagine a Bengaluru shopping site forecasting Diwali sale orders for each product. LightGBM, a boosted-trees library, learns from past sales, prices and festival dates. Early stopping picks the number of trees, so the forecast does not memorise last year's odd spikes."
  }
 ],
 "commonMistakes": [
  {
   "title": "A tree with no limits",
   "text": "Imran's tree for a Chandigarh coaching centre predicts which students will drop out. It scores 100% on training data but 68% on validation data. He sets `max_depth=4` and `min_samples_leaf=25`. Training drops to 84%, but validation rises to 79%."
  },
  {
   "title": "customer_id on top",
   "text": "A Delhi NBFC's forest ranks `customer_id` as its most important feature. The IDs were given at random, so this cannot be real. Permutation importance on validation data shows 0.00 for it, so the team drops the column."
  },
  {
   "title": "Ice cream and drowning",
   "text": "In a Chennai summer, ice-cream sales and drowning cases both rise. A model may lean on ice-cream sales to predict drownings, and SHAP will show it as important. But hot weather causes both. Ice cream does not cause drowning."
  },
  {
   "title": "Too few slow trees",
   "text": "Neha uses LightGBM, a boosted-trees library, for a Diwali demand model. She lowers its learning rate from 0.3 to 0.03 but keeps 100 trees. Her error gets worse. She allows 3,000 trees with early stopping, which stops near 1,500, and the error falls below her old score."
  },
  {
   "title": "Scaling a forest",
   "text": "Rohan spends a day scaling every column before training a random forest (many trees that vote) on Jaipur flat prices. His scores come out almost exactly the same. Trees only compare values, like \"area above 900 sq ft?\", so order matters, not size."
  },
  {
   "title": "Tuning before a baseline",
   "text": "Deepa tunes 30 XGBoost settings for two days on Kochi hotel bookings. A colleague then tries the default settings: almost as good, in five minutes. She should start there, then tune trees, learning rate and depth."
  }
 ],
 "selfCheck": [
  {
   "title": "Hint for the Gini task",
   "text": "Try left: 5 bought, 1 not, so Gini = 1 − (5/6)² − (1/6)² ≈ 0.28. Right: 1 bought, 3 not, so Gini = 1 − 0.25² − 0.75² ≈ 0.38. Weighted: 0.6 × 0.28 + 0.4 × 0.38 ≈ 0.32, lower than 0.48."
  },
  {
   "title": "What the depth test shows",
   "text": "A typical answer: \"No limit: training 100%, test 74%. With max_depth=4: training 86%, test 82%. The unlimited tree memorised noise. The small tree does better on new data and fits on one screen.\""
  },
  {
   "title": "Reading cross-validation scores",
   "text": "`cross_val_score(model, X, y, cv=5)` gives 5 scores, one per part, and `.mean()` averages them. Sample result: tree 0.78, forest 0.85, boosted 0.87. Also check the spread: scores jumping from 0.70 to 0.90 mean a less reliable model."
  },
  {
   "title": "A plain-English SHAP answer",
   "text": "Sample: \"Low credit scores raise the predicted risk the most. High existing EMIs come next. Higher income lowers the risk a little.\" Name the feature, the direction (up or down) and the size, with no jargon."
  },
  {
   "title": "Small tree or XGBoost?",
   "text": "Think about who must check each decision. A small cooperative bank's staff may need to follow every rule by hand. If XGBoost is only 1 point more accurate, a five-question tree may win on clarity and trust (भरोसा, bharosa)."
  },
  {
   "title": "The 50/50 node check",
   "text": "Quick test: a node with 5 yes and 5 no. Gini = 1 − 0.25 − 0.25 = 0.5, the most for two answers. Its entropy, the other score for mixing, is 1.0. If you wrote a Gini of 1.0, you mixed up the two scores."
  }
 ]
};
