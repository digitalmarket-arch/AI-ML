/* AI Marg lesson-card examples for one module (loaded with its lesson cards). JavaScript holding JSON. */
window.AIM = window.AIM || {};
window.AIM.examples = window.AIM.examples || {};
window.AIM.examples["l1-stats"] = {
 "overview": [
  {
   "title": "Exit poll in Uttar Pradesh",
   "text": "Imagine a news team asks 3,000 voters leaving booths across the state. If the booths are picked at random from villages and towns, this small sample can give a good estimate of how the state voted. Asking only city booths would mislead."
  },
  {
   "title": "Salaries at an Indore shop",
   "text": "Eight workers earn ₹22,000 to ₹45,000 a month, and the owner earns ₹3,00,000. The mean is about ₹61,900, more than 8 of the 9 people earn. The median, ₹32,000, describes a typical worker."
  },
  {
   "title": "Rain in Kochi",
   "text": "A weather app says 70% chance of rain. That is a probability of 0.7. Over many such days, it should rain on about 7 days out of 10."
  },
  {
   "title": "A new checkout button",
   "text": "Imagine a Bengaluru food app. It shows the old button to 4,000 random visitors and a new one to 4,000 others. Orders are 5.0% and 6.1%. Statistics checks whether this 1.1-point gap is bigger than luck would give."
  },
  {
   "title": "Umbrellas and dengue in Mumbai",
   "text": "Umbrella sales and dengue cases both rise every July. Umbrellas do not cause dengue. The monsoon drives both: rain makes people buy umbrellas, and still water lets mosquitoes breed."
  },
  {
   "title": "A positive test in Chennai",
   "text": "Imagine a test that catches 95% of ill people but wrongly flags 5% of healthy ones. The disease affects 1 in 100 people. The healthy group is so large that Bayes' theorem shows only about 16% of positives are really ill."
  }
 ],
 "outcomes": [
  {
   "title": "Median for a Pune startup",
   "text": "Asha reports pay at a 12-person Pune startup. Eleven people earn ₹30,000 to ₹48,000, and the founder takes ₹4,00,000. The founder pulls the mean to about ₹70,000. Asha reports the median, about ₹38,000, as typical pay."
  },
  {
   "title": "Spotting a binomial",
   "text": "Ravi in Patna makes 20 sales calls a day, and each call ends in yes or no. He counts the yes answers each day. A fixed number of yes/no tries with the same chance gives a binomial count."
  },
  {
   "title": "Explaining a scary test result",
   "text": "Meena's aunt in Chennai gets a positive result on a screening test for a rare disease. Meena explains that when a disease is rare, many positives are false alarms. A second, better test is the wise next step."
  },
  {
   "title": "A range for a survey",
   "text": "Imran surveys 400 random homes in Delhi: the average bill is ₹2,000 and the SD (standard deviation) is ₹600. He reports 'about ₹1,941 to ₹2,059, with 95% confidence', not just ₹2,000. The range shows how sure he can be."
  },
  {
   "title": "Telling a client to wait",
   "text": "Kavya's ad test in Jaipur shows ad B a little ahead, but the p-value is 0.4. She tells the client a gap this size comes easily by luck. She plans a bigger test before anyone switches ads."
  },
  {
   "title": "A hidden factor in a headline",
   "text": "A headline says 'Students with tablets score higher'. Arjun in Bhopal points out that richer families buy tablets and also pay for tuition. Family income may drive both, so it is a confounder."
  }
 ],
 "studySteps": [
  {
   "title": "One hour after office",
   "text": "Sandeep, a bank clerk in Kanpur, has one hour a day. Days 1 and 2: averages and spread, plus 10 numbers by hand. Day 3: probability. Day 4: the CLT lab. Day 5: tests. The weekend is for the quiz and Self-check."
  },
  {
   "title": "College student in Guwahati",
   "text": "Priyanka works out the mean, median and standard deviation of her hostel mess bills by hand. Then she checks with `np.mean(bills)` and `np.std(bills)`. `np.std` divides by the count of values, but some books divide by one less. So a tiny gap in the standard deviation is fine; a big gap means a slip."
  },
  {
   "title": "Homemaker in Coimbatore",
   "text": "Lakshmi studies in 20-minute breaks. She solves the Bayes example on paper by drawing 10,000 people as a tree. It needs no phone and no internet at all."
  },
  {
   "title": "Weekend learner in Ahmedabad",
   "text": "Nisha watches all the videos on Saturday. On Sunday morning she opens the CLT lab with the income population at sample sizes 1, 5 and 30. She writes down how the curve gets narrower and more bell-shaped."
  },
  {
   "title": "Slow internet in Ladakh",
   "text": "Stanzin downloads the videos at low quality on the library Wi-Fi. At home he does the hand calculations in a notebook. He runs the die-rolling code in Colab later, when the network is better."
  },
  {
   "title": "Quiz score below 70%",
   "text": "Farhan in Hyderabad scores 60%. Most wrong answers were about p-values and confidence intervals. He watches those two lessons again and redoes the questions on paper before he retakes the quiz."
  }
 ],
 "keyTerms": [
  {
   "title": "Mode at a shoe shop",
   "text": "A shoe shop in Kolhapur sold sizes 7, 8, 8, 8, 9 and 10 last week. The mode is size 8, so the owner stocks the most of size 8. The mean, about 8.3, is not even a real size."
  },
  {
   "title": "Same mean, different spread",
   "text": "Two diamond polishers in Surat both finish 20 stones a day on average. Hira's days go 19, 21, 19, 21: standard deviation 1. Jay's go 10, 30, 10, 30: standard deviation 10."
  },
  {
   "title": "Board marks and the 68-95 rule",
   "text": "Marks in a big Kerala school are roughly normal, with mean 65 and standard deviation 10. So about 68% of students score between 55 and 75. About 95% score between 45 and 85."
  },
  {
   "title": "Given, at a railway station",
   "text": "At a Delhi station, 300 of 1,000 passengers are going to Mumbai, so P(Mumbai) = 0.3. On the platform of the Mumbai train, 90 of 100 are. So P(Mumbai | on that platform) = 0.9."
  },
  {
   "title": "Standard error at a dairy",
   "text": "Imagine a dairy in Anand. Milk per cow varies with a standard deviation of 4 litres. The average of 16 cows varies much less: 4 ÷ √16 = 1 litre. The SE formula works whatever the shape of the data."
  },
  {
   "title": "A/B test for an SMS offer",
   "text": "A Hyderabad bank sends offer SMS A to 5,000 random customers and SMS B to 5,000 others. B gets a few more replies, but p = 0.20. A gap this size often comes by luck, so the bank does not switch yet."
  }
 ],
 "indiaExample": [
  {
   "title": "Census against a sample",
   "text": "A census tries to count every person. India's last full Census was in 2011. For the next one, house listing ran in 2026, and most people are counted in February 2027. A full count is huge and slow, so samples give fresher numbers."
  },
  {
   "title": "Crop cutting experiments",
   "text": "To estimate crop yield (पैदावार, paidaavaar), officials harvest small plots in randomly chosen fields and weigh the grain. These sample plots give the yield for a whole area. Claims under PMFBY, the government's crop insurance scheme, often use such estimates."
  },
  {
   "title": "Family health survey",
   "text": "The National Family Health Survey (NFHS-5, 2019 to 2021) interviewed a sample of households in 707 districts. From that sample, it estimated health and nutrition figures for every state."
  },
  {
   "title": "Biscuit packets in Indore",
   "text": "Imagine a biscuit factory in Indore that packs 10,000 packets an hour. Workers weigh 50 random packets every hour, not all of them. If the sample average drops, they fix the machine."
  },
  {
   "title": "A one-sided phone survey",
   "text": "Imagine a Chennai startup that asks only its app users about their jobs. App users are younger and live in cities. Its 'unemployment rate' would not match the PLFS figure for India, however many people answer."
  }
 ],
 "commonMistakes": [
  {
   "title": "Average order at a saree site",
   "text": "A Jaipur saree website reports an average order of ₹4,800. One wedding buyer spent ₹2,00,000, and most orders are near ₹1,500. The median order, about ₹1,450, tells the real story."
  },
  {
   "title": "97% sure, said the intern",
   "text": "An intern reads p = 0.03 and writes 'We are 97% sure the new page is better'. Wrong: p only says how rare such a gap is when there is no real difference. The fix: 'If the pages were equal, a gap this big would come only 3% of the time.'"
  },
  {
   "title": "Stopping on a lucky day",
   "text": "Rohit in Noida checks his A/B test every morning. On day 3 the p-value dips to 0.04, so he stops and declares B the winner. By the planned end, two weeks later, p is back at 0.48. The day-3 'winner' was just luck."
  },
  {
   "title": "Ice cream and drowning",
   "text": "A Goa report sees ice-cream sales and drowning cases rise together. Banning ice cream would not save swimmers. Hot weather sends more people to the beach and to the ice-cream cart, so heat is the confounder."
  },
  {
   "title": "An interval far too wide",
   "text": "Neha surveys 400 homes: mean bill ₹2,000, SD ₹600. She writes 2,000 ± 1.96 × 600, about ₹824 to ₹3,176. That is where single homes fall. With the SE of ₹30, the interval for the average is ₹1,941 to ₹2,059."
  },
  {
   "title": "Fifty percent of what?",
   "text": "A new Kochi café says sales rose 50% this week. Out of how many? From 2 orders to 3. Such tiny counts swing by luck, so the café should wait for more weeks of data."
  }
 ],
 "selfCheck": [
  {
   "title": "Hint for the salary task",
   "text": "Try 14 salaries between ₹20,000 and ₹60,000, plus ₹5,00,000. Sort them: the median is the 8th value. The mean lands far above most salaries. A good answer says the median is typical because one giant value cannot move it."
  },
  {
   "title": "Bayes as a tree",
   "text": "Start with 10,000 people: 100 ill and 9,900 healthy. Find the positives in each group. Divide the ill people who test positive by everyone who tests positive. Your one line should mention how big the healthy group is."
  },
  {
   "title": "Code for the die task",
   "text": "`rolls = np.random.randint(1, 7, size=n)` gives n rolls from 1 to 6 (the 7 is left out), and `rolls.mean()` gives their average. With 10 rolls you might get 4.1. With 10,000 rolls you get very close to 3.5, the true average."
  },
  {
   "title": "Testing the two ads",
   "text": "The conversion rates are 120 ÷ 2,000 = 6% and 150 ÷ 2,000 = 7.5%. Then `proportions_ztest([150, 120], [2000, 2000])` from statsmodels gives a p-value: how surprising the gap would be if the ads were really equal. The first list holds the sign-ups, and the second holds the visitors. Compare the p-value with 0.05 and say what it means in plain words."
  },
  {
   "title": "A sample recommendation",
   "text": "A good note sounds like this: 'B got 7.5% against 6%. The p-value is near our 0.05 cut-off, so this gap could still be luck. I suggest a bigger test before we switch.' Check your own p-value first."
  },
  {
   "title": "Spotting a confounder",
   "text": "Headline: 'People who drink coffee live longer'. A possible hidden factor is income: richer people may buy more coffee and also get better health care. A good answer names the factor and shows how it drives both."
  }
 ]
};
