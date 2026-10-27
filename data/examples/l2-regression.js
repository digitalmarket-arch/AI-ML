/* AI Marg lesson-card examples for one module (loaded with its lesson cards). JavaScript holding JSON. */
window.AIM = window.AIM || {};
window.AIM.examples = window.AIM.examples || {};
window.AIM.examples["l2-regression"] = {
 "overview": [
  {
   "title": "Auto fare in Pune",
   "text": "Past rides show that 2 km cost ₹60 and 4 km cost ₹90. The best line is fare = 30 + 15 × km. So a new 6 km ride should cost about 30 + 90 = ₹120."
  },
  {
   "title": "Lakshmi's kirana shop",
   "text": "Lakshmi in Madurai notes her shop's sales every month for two years. Regression on these notes predicts next month's sales as one number, say ₹2,40,000. She uses it to decide how much stock to buy."
  },
  {
   "title": "Flat rent in Hyderabad",
   "text": "A model says rent = 4,000 + 15 × area in square feet. For an 800 sq ft flat, that is 4,000 + 12,000 = ₹16,000 a month. The answer is a number, so this is regression."
  },
  {
   "title": "Power use on a hot day",
   "text": "Imagine a power company in Ahmedabad. It predicts tomorrow's electricity use in megawatts from the temperature. A 44°C day gets a bigger number than a 30°C day, because more fans and ACs run."
  },
  {
   "title": "Gradient descent finds the line",
   "text": "The computer starts with a bad line, like fare = 0 + 1 × km. It predicts ₹2 for a 2 km ride that really cost ₹60. It moves both numbers a little, checks the error again, and repeats. After many small steps, it reaches about 30 and 15."
  },
  {
   "title": "Why big misses count extra",
   "text": "Arjun's line misses one ride by ₹4 and another by ₹12. MSE (mean squared error) squares each miss before averaging, giving 16 and 144. The ₹12 miss is 3 times bigger, but it counts 9 times more."
  },
  {
   "title": "Fraud or a number?",
   "text": "Gurpreet's bank in Ludhiana wants two things. \"Is this UPI payment a fraud?\" has a yes or no answer, so that is classification. \"How much will this customer spend next month?\" has a ₹ answer, so that is regression."
  }
 ],
 "outcomes": [
  {
   "title": "Reading a rent formula",
   "text": "Riya in Hyderabad sees rent = 4,000 + 15 × area_sqft. She tells her flatmate that each extra square foot adds about ₹15 to the predicted rent. It does not mean 15 percent."
  },
  {
   "title": "Fixing a growing loss",
   "text": "Arjun's training loss (the error number) goes 12, 30, 90, 400 after each pass over the data. He knows the steps are too big. He divides the learning rate (the step size) by 10, and the loss starts falling."
  },
  {
   "title": "One number for managers",
   "text": "Fatima works at a food-delivery startup in Kolkata. She reports, \"Our delivery-time predictions are off by 6 minutes on average.\" That is the MAE (mean absolute error). She avoids RMSE here, because a few flood-day delays would push it up a lot."
  },
  {
   "title": "Bending the line for AC sales",
   "text": "Gurpreet sees AC sales in Nagpur rise slowly, then very fast above 38°C. A straight line misses this bend (मोड़, mod). He adds temperature² as a new column. It is still linear regression on the new columns, so the same method fits the curve."
  },
  {
   "title": "Lasso finds a useless column",
   "text": "Priya trains Lasso on used-car prices in Bengaluru. The weight for the last digit of the number plate becomes exactly 0. She drops that column, because it never helped to predict the price."
  },
  {
   "title": "Spotting a funnel",
   "text": "Meera plots residuals for her house-price model in Kochi. Misses are small for cheap houses but huge for costly ones, like a funnel. She makes the model predict log(price), which squeezes big prices closer to small ones. The spread becomes more equal."
  }
 ],
 "studySteps": [
  {
   "title": "One hour after office",
   "text": "Suresh is a bank clerk in Kanpur with one free hour a day. Day 1: regression and MSE videos. Day 2: gradient descent videos and the lab. Day 3: the other videos. Day 4: practice and the quiz. He keeps the weekend for the from-scratch task."
  },
  {
   "title": "College student in Kochi",
   "text": "Anjali watches videos between classes but does the lab slowly. She writes down what each learning rate did. The tiny one crawled, the medium one settled, and the big one shot off the chart."
  },
  {
   "title": "Homemaker with short breaks",
   "text": "Shabana in Lucknow studies in 20-minute breaks. She watches one video per break and copies the error formulas, MAE and RMSE, into a notebook. Before the quiz, she uses one break to revise all of them."
  },
  {
   "title": "Weekend learner in Bengaluru",
   "text": "Rahul studies only on Saturday and Sunday. On Saturday he finishes all the videos and the lab. On Sunday he does practice, the quiz and the from-scratch task. He keeps two hours for that task, because it needs patience (धैर्य, dhairya)."
  },
  {
   "title": "Slow internet in Sikkim",
   "text": "Tenzin lives in a hill town with a slow connection. She watches videos at low quality to save data. She does the paper task on the two error scores, MAE and RMSE, in her notebook with no internet at all."
  },
  {
   "title": "Quiz score below 70%",
   "text": "Kiran scores 60% on the quiz. Most wrong answers were about the error scores. She watches the metrics lesson again, works through the examples, and then takes the quiz again."
  }
 ],
 "keyTerms": [
  {
   "title": "Weights in a car-price model",
   "text": "Imagine a Bengaluru model that says price = 6,00,000 − 45,000 × age. The weight −45,000 means each extra year lowers the price by ₹45,000. The intercept 6,00,000 is the prediction at age 0. A 4-year-old car gets 6,00,000 − 1,80,000 = ₹4,20,000."
  },
  {
   "title": "Delivery minutes: MAE and RMSE",
   "text": "A Kolkata delivery app misses three orders by 5, 5 and 20 minutes. MAE = 30 ÷ 3 = 10 minutes. RMSE = √((25 + 25 + 400) ÷ 3) = √150 ≈ 12.2 minutes. The one big miss pulls RMSE above MAE."
  },
  {
   "title": "Train delays in mini-batches",
   "text": "Imagine a model that predicts train delays in minutes from 64,000 past trips. With mini-batches of 64 rows, one full pass over the data makes 64,000 ÷ 64 = 1,000 gradient descent steps."
  },
  {
   "title": "Lasso trims a crop model",
   "text": "Imagine a Punjab farm team that predicts wheat yield from 40 features. Lasso sets 28 of the weights to exactly 0. The team now looks closely at the 12 features left, like rainfall and fertiliser."
  },
  {
   "title": "R² for a kirana shop",
   "text": "Average daily sales at Gopal's shop in Indore are ₹5,000. Always guessing ₹5,000 gives R² = 0. A model that catches festival rushes and rainy-day dips might reach R² = 0.8. A model worse than the plain ₹5,000 guess gets a negative R²."
  },
  {
   "title": "Learning rate too big",
   "text": "Neha in Bhopal sets a very large learning rate. Each step jumps across the valley and lands higher than before. The loss (the error number) grows and turns into NaN (not a number). With a rate 100 times smaller, the steps shrink and the loss falls."
  },
  {
   "title": "MSE for a tutor's predictions",
   "text": "A Chennai tutor's model predicts board exam marks. It misses Divya by 3 marks and Karthik by 9. The squares are 9 and 81, so MSE = 45. Gradient descent will work hardest to fix Karthik's big miss."
  }
 ],
 "indiaExample": [
  {
   "title": "Flat prices in Pune",
   "text": "Imagine a Pune property website. It predicts a flat's price from its area, floor, building age and distance to the nearest metro station. The answer is one ₹ amount, like ₹85,00,000, so this is regression."
  },
  {
   "title": "Power demand in Chennai",
   "text": "Imagine a power company in Chennai. It predicts tomorrow's electricity demand (माँग, maang) in megawatts from temperature, humidity and the day of the week. A hot weekday in May gets a high number, so the company arranges enough power."
  },
  {
   "title": "Delivery time in Kolkata",
   "text": "Imagine a food-delivery app in Kolkata. It predicts delivery time in minutes from distance, rain and time of day. Managers read the MAE, the average error size, like \"6 minutes off on average\"."
  },
  {
   "title": "Rice yield in Andhra Pradesh",
   "text": "Imagine an agriculture team in Andhra Pradesh. It predicts rice yield (पैदावार, paidaavaar) in quintals per acre from rainfall, fertiliser and seed type. The number helps farmers plan storage and loans before the harvest."
  },
  {
   "title": "Tea prices in Guwahati",
   "text": "Imagine a tea trader in Guwahati. He predicts the auction price per kg from the leaf grade, the month and last week's prices. Each feature gets a weight (how much it counts), and better grades push the predicted price up."
  },
  {
   "title": "Ad spend for a Jaipur agency",
   "text": "Imagine a digital agency in Jaipur. Past campaigns show leads rising with ad spend. Regression gives a rough first answer: ₹50,000 more on ads may bring about 120 more leads. The agency treats it as a guide, not a promise."
  }
 ],
 "commonMistakes": [
  {
   "title": "Lakhs next to years",
   "text": "Vikram's car model uses km driven (up to 1,50,000) and age (up to 15 years) without scaling. Gradient descent zig-zags for thousands of steps. After `StandardScaler`, both features have a similar range, and training settles in a few hundred steps."
  },
  {
   "title": "Loss turns into NaN",
   "text": "Sneha uses a learning rate of 1.0. Her loss goes 8, 20, 55, 400, then NaN. She divides the rate by 10, but the loss still grows. At 0.01, the loss falls smoothly to a low value."
  },
  {
   "title": "Great on training, poor on test",
   "text": "Imran's house-price model shows a training R² of 0.98. On the test set, R² is −0.4, so it is worse than guessing the average price. He adds Ridge, uses fewer features, and checks test RMSE before trusting it."
  },
  {
   "title": "Missing the bend",
   "text": "Kavya predicts AC sales in Nagpur with a straight line. R² looks fine, but her residual plot shows a clear U-shaped curve. She adds temperature² as a feature, and the curve in the residuals goes away."
  },
  {
   "title": "Deleting costly flats",
   "text": "Rohan's residual plot for Mumbai flat prices is a funnel. He deletes all flats above ₹3 crore to make the plot look neat. Now the model fails on exactly those flats. Predicting log(price) would fix the spread without losing data."
  },
  {
   "title": "Degree 15 for 20 points",
   "text": "Deepak fits a degree-15 curve to 20 days of tea-stall sales. It touches almost every training point, but its test error is huge. A degree-2 curve has a little more training error and much less test error."
  }
 ],
 "selfCheck": [
  {
   "title": "Hint for the ride task",
   "text": "Start with w = 0 (the weight) and b = 0 (the intercept). In each loop, predict the fares, find the errors, work out both gradients (slopes), and update w and b. For rides of 1 to 10 km, a learning rate (step size) like 0.01 works. If the loss (the error number) grows, make the rate smaller. After a few thousand loops, values like b ≈ 29.6 and w ≈ 15.1 mean it works."
  },
  {
   "title": "Gradients for the ride task",
   "text": "Let error = prediction − fare. The gradient for w is 2 × average(error × km). The gradient for b is 2 × average(error). In every loop, subtract learning rate × gradient from each one."
  },
  {
   "title": "Reading the Lasso output",
   "text": "`print(lasso.coef_)` shows the weights Lasso learned, one per column. A weight shown as 0.0 means Lasso switched that feature off. A good answer names those features and notes that Ridge kept every weight non-zero, only smaller."
  },
  {
   "title": "What the four degrees show",
   "text": "A good answer says: degree 1 is a straight line that misses the bend, so it underfits. Degree 2 follows a simple curve well. Degree 15 wiggles through the noise, with low training error but high test error, so it overfits."
  },
  {
   "title": "Describing a residual plot",
   "text": "Sample answer: \"The residuals form a funnel. They are small for cheap houses and wide for costly ones. So the error spread is not equal, and I will try predicting log(price).\" Always name the shape, then the fix."
  },
  {
   "title": "Thinking through the gap",
   "text": "Try five cars. If every miss is ₹40,000, MAE and RMSE are both ₹40,000. If four misses are ₹10,000 and one is ₹1,60,000, MAE stays ₹40,000 but RMSE jumps to about ₹72,000. So a big gap means a few very big misses. Then check which cars, maybe rare or luxury ones, cause them."
  }
 ]
};
