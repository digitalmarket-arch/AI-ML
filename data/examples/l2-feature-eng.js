/* AI Marg lesson-card examples for one module (loaded with its lesson cards). JavaScript holding JSON. */
window.AIM = window.AIM || {};
window.AIM.examples = window.AIM.examples || {};
window.AIM.examples["l2-feature-eng"] = {
 "overview": [
  {
   "title": "Durga Puja sweets in Kolkata",
   "text": "Imagine a sweet shop in Kolkata. Its raw data has only dates and daily sales. Moumita adds one new feature, is_puja: 1 during Durga Puja week and 0 on other days. Now the model sees why sales jump in those days, instead of treating them as strange."
  },
  {
   "title": "Flat listings in Hyderabad",
   "text": "A listing says \"2 BHK, 1,200 sq ft, Gachibowli\". As one line of text, a model cannot use it. Sana splits it into features: bedrooms = 2, area = 1200 and area per bedroom = 600. The same algorithm can now use each clue."
  },
  {
   "title": "One recipe for every customer",
   "text": "Arjun in Pune scales his training data by hand. Later he forgets to scale new customers' data, and his loan model gives nonsense. A Pipeline stores the scaling step with the model, so new data goes through the same steps every time."
  },
  {
   "title": "Cities for a Chennai lender",
   "text": "A loan app has a city column: Chennai, Madurai and Coimbatore. Coding them as 0, 1 and 2 makes Coimbatore look \"twice\" Madurai. One-hot encoding gives each city its own 0/1 column instead, so no fake order appears."
  },
  {
   "title": "Onion prices near Nashik",
   "text": "Imagine a trader at the big Lasalgaon onion market in Nashik district. He wants to predict tomorrow's price, but his raw data is just a list of daily prices. He adds two features: yesterday's price and the average of the last 7 days. These past values often carry strong clues."
  },
  {
   "title": "Family size on Titanic",
   "text": "Priya in Guwahati joins Kaggle's beginner Titanic contest. One column counts brothers, sisters or a spouse on board. Another counts parents or children. She adds one new feature: family size = the two counts + 1, for the passenger. With the same algorithm, she checks if her score rises."
  }
 ],
 "outcomes": [
  {
   "title": "Fatima's payment column",
   "text": "Fatima in Lucknow has a column with UPI, card and cash. These have no order, so she uses one-hot encoding. She gets three 0/1 columns: pay_UPI, pay_card and pay_cash. A UPI row becomes 1, 0, 0."
  },
  {
   "title": "Log prices in Mumbai",
   "text": "Rohan's flat prices run from ₹40 lakh to ₹25 crore. A few luxury flats affect the model far too much. He trains on log(price) and turns the answers back into rupees with exp(), the reverse of log. His errors on ordinary flats become smaller."
  },
  {
   "title": "Arjun trims 300 columns",
   "text": "Arjun in Indore has 300 columns about shop customers. He puts `SelectKBest(k=20)` inside his Pipeline. This filter keeps the 20 columns with the best simple scores. In each round of cross-validation, it looks only at that round's training rows."
  },
  {
   "title": "Lakshmi's honest score",
   "text": "Lakshmi in Madurai puts her imputer (the step that fills missing values) and her scaler inside one Pipeline. She passes the whole Pipeline to `cross_val_score`, which runs cross-validation in one line. In each round, both steps learn only from that round's training rows, so her score stays honest."
  },
  {
   "title": "Gurpreet's dairy forecast",
   "text": "Gurpreet runs a dairy in Ludhiana. He adds yesterday's milk sales, last week's same-day sales and a 7-day average as features. He checks the model with `TimeSeriesSplit`, which always trains on older days and tests on newer ones."
  },
  {
   "title": "First Kaggle submission",
   "text": "Kiran in Bhopal joins House Prices. First she reads the metric: RMSE (a typical error size) on log prices. She builds a plain baseline, notes its cross-validation score, and submits. Every later idea must beat that score."
  },
  {
   "title": "A README that gets read",
   "text": "Anjali in Kochi writes a README with Problem, Data, Approach, Results and Next steps. A recruiter reads it in two minutes. The Results line says \"MAE ₹1,900 on test data\", so her predictions are off by ₹1,900 on average. That clear line starts a conversation."
  }
 ],
 "studySteps": [
  {
   "title": "One hour after office",
   "text": "Suresh is a bank clerk in Nagpur with one free hour a day. Day 1: encoding and scaling videos. Day 2: the Lab tasks. Day 3: Pipeline videos. Day 4: he rebuilds the pipeline in Colab from memory. Day 5: time-series videos."
  },
  {
   "title": "College student in Bhubaneswar",
   "text": "Ananya rebuilds the lesson's pipeline without looking. She gets stuck on which column names go to the ColumnTransformer. She notes this weak spot (कमज़ोरी, kamzori), watches only that part again, and then rebuilds the whole pipeline once more."
  },
  {
   "title": "Homemaker with short breaks",
   "text": "Meena in Coimbatore studies in 20-minute breaks. She watches one video per break. In her notebook she keeps one line per encoding: one-hot for cities, ordinal for ordered levels, target for many categories."
  },
  {
   "title": "Weekend learner in Indore",
   "text": "Rahul studies only on weekends. On Saturday he finishes the videos, the practice exercises and the quiz. On Sunday he joins Titanic on Kaggle and submits his first Pipeline-based solution, even though its score is only average."
  },
  {
   "title": "Slow connection in Shillong",
   "text": "Daniel lives in Shillong with a slow phone connection. He watches videos at low quality to save data. Colab runs the code on Google's computers, so his old laptop is enough. He writes his README offline first."
  },
  {
   "title": "Quiz score below 70%",
   "text": "Kavya scores 60% on the quiz. Most wrong answers were about shift() and rolling(). She watches the time-series lesson again and works through the small sales example by hand. Then she takes the quiz again."
  }
 ],
 "keyTerms": [
  {
   "title": "UPI, card or cash",
   "text": "A Jaipur shop's data has a payment column. One-hot encoding makes three 0/1 columns: pay_UPI, pay_card and pay_cash. A cash payment becomes 0, 0, 1. No payment type looks bigger than another."
  },
  {
   "title": "Board exam levels",
   "text": "A Patna coaching centre records each student's education: 10th, 12th or Graduate. These levels have a real order, so ordinal encoding gives 0, 1 and 2. The numbers keep the meaning that Graduate is above 12th."
  },
  {
   "title": "Hundreds of pin codes",
   "text": "A delivery firm works across 500 pin codes. One-hot would add 500 columns. Target encoding swaps each pin code for its average delivery time in the training rows. In `fit_transform`, scikit-learn's `TargetEncoder` splits the training rows into parts called folds. Each part gets averages from the other parts, so no row sees its own answer."
  },
  {
   "title": "Salaries from lakhs to crores",
   "text": "A job site in Bengaluru sees salaries from ₹3 lakh to ₹3 crore a year. A few huge salaries dominate the raw column. After a log10 transform, ₹3 lakh becomes about 5.5 and ₹3 crore about 7.5, so the gap shrinks to about 2."
  },
  {
   "title": "Loan data in one Pipeline",
   "text": "A Surat lender builds a ColumnTransformer: income and age go to `StandardScaler`, city and job go to `OneHotEncoder`. One StandardScaler on all columns would fail, because it cannot scale a word like Surat. The ColumnTransformer and a model then sit inside one Pipeline."
  },
  {
   "title": "Idli batter in Mysuru",
   "text": "A shop in Mysuru sells idli batter. Today is a Saturday. Lag-1 is Friday's 80 packets, and lag-7 is last Saturday's 120. The rolling 7-day average of the past days is 92. All three are known before the shop opens."
  },
  {
   "title": "College hackathon leaderboard",
   "text": "In a college ML contest in Pune, the public board uses 30% of the test rows. Teams that tweak only for that board drop at the end. The team that trusted its 5-fold cross-validation finishes first on the private board. That check trains 5 times, each time testing on a different fifth of its training data."
  }
 ],
 "indiaExample": [
  {
   "title": "Rakhi week in Jaipur",
   "text": "Imagine a dark store in Jaipur. Rakhi and gift-box sales jump in the week before Raksha Bandhan. A flag column, is_rakhi_week = 1, tells the model why. Without it, the model would treat the jump as random noise."
  },
  {
   "title": "Monsoon days in Mumbai",
   "text": "Imagine a Mumbai dark store in July. On heavy-rain days, people order more instant noodles and fewer fresh vegetables. A rain feature from the weather forecast, plus yesterday's sales, helps the store stock the right items."
  },
  {
   "title": "Exam season in Patna",
   "text": "Imagine a dark store near Patna's coaching hubs. Pens, notebooks and coffee sell more in the weeks before board exams. A calendar flag, is_exam_season = 1, captures this, just like a festival flag."
  },
  {
   "title": "Monday milk in Chennai",
   "text": "Imagine a Chennai store that sells 210 milk packets on Sunday but only about 160 on Monday. For next Monday, lag-7 (last Monday) is the better clue. The model uses lag-1 and lag-7 together, to catch both the latest trend and the weekly rhythm."
  },
  {
   "title": "Onam week in Kochi",
   "text": "Imagine a Kochi dark store before Onam. Banana chips, jaggery and flowers for the pookalam sell fast. An is_onam flag, plus the last 28 days' average, helps the store order enough stock in time."
  },
  {
   "title": "Cricket final night in Ahmedabad",
   "text": "Imagine an IPL final at the Ahmedabad stadium. Chips and cold drinks sell out in the evening. A match_day flag and the hour of the day become features. Next season, the store can stock up before such matches."
  }
 ],
 "commonMistakes": [
  {
   "title": "Surat appears only in test",
   "text": "Neha makes training columns with `pd.get_dummies`: Agra, Delhi and Pune. On the test file it makes Pune and Surat. pandas shows no warning, so she does not notice. Her model now gets columns that do not match what it learned. One OneHotEncoder, fitted on training data and reused, fixes it."
  },
  {
   "title": "Scaler fitted on all rows",
   "text": "Imran in Kanpur scales all 10,000 rows, then splits them. The test rows' average and spread are already inside the scaler. His test score looks a little too good. He moves the scaler into a Pipeline and fits it on training rows only."
  },
  {
   "title": "800 columns, 2,000 rows",
   "text": "A teammate picks the 30 columns most linked to the label, using all 2,000 rows. Then 5-fold cross-validation shows 95%. Inside a Pipeline, where each fold picks its own 30, the honest score is 78%."
  },
  {
   "title": "A rolling mean that sees today",
   "text": "Ravi in Hyderabad uses `rolling(7).mean()` on biryani orders without `shift(1)`. Each day's feature includes that day's own orders, so his error looks tiny. In real use today's orders are not known yet, and the error jumps."
  },
  {
   "title": "Shuffled folds for daily sales",
   "text": "Pooja uses random k-fold on two years of daily sales. Some folds train on December and test on the October before it. Her score is too hopeful. `TimeSeriesSplit` keeps every test block after its training days."
  },
  {
   "title": "Down 300 places at the end",
   "text": "Vikram makes 60 small tweaks that each lift his public score a little. When the private board opens, he drops 300 places. His friend Asha, who chose her model by cross-validation score, keeps her rank."
  }
 ],
 "selfCheck": [
  {
   "title": "Hint for the Titanic Pipeline",
   "text": "Put number columns like Age and Fare in one list, and text columns like Sex and Embarked in another. Give each list its own small pipeline inside a ColumnTransformer. Then `cross_val_score(pipe, X, y, cv=5)`, with X the input columns and y the answers, gives five scores. Report their average."
  },
  {
   "title": "Test your shift on tiny data",
   "text": "Before using real sales, try `pd.Series([10, 20, 30, 40, 50]).shift(1).rolling(2).mean()`. You should see nan, nan, 15, 25, 35. If the third value is 25, your window still includes the current day."
  },
  {
   "title": "Thinking about the log",
   "text": "A good answer notes that prices are skewed (एकतरफ़ा, ektarfa): a few costly houses make huge raw errors. The log treats a 10% miss on a cheap house and a costly house more evenly. It also matches what the competition scores."
  },
  {
   "title": "Joblib round trip",
   "text": "In notebook 1, run `joblib.dump(pipe, 'model.joblib')`. In a fresh notebook 2, run `pipe = joblib.load('model.joblib')`. Build a small DataFrame (a table) of three rows with the same column names, and call `pipe.predict` on it."
  },
  {
   "title": "A strong Results heading",
   "text": "A weak line says only that the model is good. A strong line says: on 300 test rows, MAE (the average size of the error) is ₹1,900, against ₹3,400 for a baseline that predicts the average rent. Always give the metric, the test size and a baseline."
  }
 ]
};
