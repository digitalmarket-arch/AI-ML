/* AI Marg lesson-card examples for one module (loaded with its lesson cards). JavaScript holding JSON. */
window.AIM = window.AIM || {};
window.AIM.examples = window.AIM.examples || {};
window.AIM.examples["l2-unsupervised"] = {
 "overview": [
  {
   "title": "Lakshmi's kirana in Madurai",
   "text": "Lakshmi has a year of bills for 400 customers, but no labels. Clustering on visits per month and spend per visit finds three groups. She names them herself: daily milk buyers, weekly family buyers and monthly bulk buyers."
  },
  {
   "title": "News headlines in Mumbai",
   "text": "Imagine a news app in Mumbai with 10,000 headlines a day and no topic tags. Clustering puts similar headlines together, such as cricket, elections and monsoon news. An editor then looks inside each group and names it."
  },
  {
   "title": "Fifty columns, one chart",
   "text": "Imagine a Pune bank that stores 50 columns for each customer. Nobody can draw 50 columns. PCA squeezes them into 2 new columns that keep most of the information. Now the team can see all customers as dots on one chart."
  },
  {
   "title": "Arjun's odd UPI payment",
   "text": "Arjun in Patna usually pays ₹50 to ₹500, mostly in the daytime. One night, a ₹45,000 payment goes out at 2 a.m. Anomaly detection flags it because it sits far from his usual pattern. No list of past frauds was needed."
  },
  {
   "title": "RFM at a Jaipur saree shop",
   "text": "Meera bought 10 days ago, 12 times this year, for ₹60,000 in total: a loyal big spender. Kavita bought 250 days ago, once, for ₹800: a lapsed customer. RFM puts these three numbers side by side for every customer."
  },
  {
   "title": "Supervised or unsupervised?",
   "text": "Gurpreet's bank in Ludhiana has payments marked \"fraud\" or \"safe\", so learning from them is supervised. His friend has only raw payments with no marks and asks, \"Which ones look odd?\" That question is unsupervised."
  }
 ],
 "outcomes": [
  {
   "title": "Choosing k for a gym chain",
   "text": "Farhan in Hyderabad clusters 2,000 gym members by visits and plan price for k = 2 to 8. The inertia curve, which shows how tight the groups are, bends at k = 4. The silhouette score is also highest at 4, so he picks 4 groups."
  },
  {
   "title": "A tree of sweet shops",
   "text": "Mou in Kolkata clusters 30 sweet shops by their sales in each month of the year. She draws the dendrogram and cuts it at one height. The cut crosses three branches, so she gets three groups: small, medium and festival-heavy shops."
  },
  {
   "title": "Winding roads in Bengaluru",
   "text": "Kiran runs DBSCAN on delivery drop points. The clusters follow curved roads, which K-Means would chop into pieces. Ten far-away drops get the label −1, which means noise, and he checks them for wrong addresses."
  },
  {
   "title": "Shrinking a survey",
   "text": "Ankit in Indore has answers to 40 survey questions from 900 shoppers. Many questions move together. PCA keeps 90% of the spread with just 6 new columns, so his later model trains faster."
  },
  {
   "title": "An odd machine in a mill",
   "text": "Sana in Coimbatore runs Isolation Forest on hourly readings from 200 machines in a textile mill: heat and shaking. One machine runs much hotter and shakes more than all the others. It is cut off in very few random splits, so it is flagged for a check."
  },
  {
   "title": "From Cluster 2 to a plan",
   "text": "Divya in Kochi sees that Cluster 2 has high spend and many orders, but no order for 180 days. She names it \"at-risk high spenders\" and plans a win-back WhatsApp offer for them."
  }
 ],
 "studySteps": [
  {
   "title": "One hour after office",
   "text": "Suresh is a bank clerk in Kanpur with one free hour a day. Day 1: K-Means videos. Day 2: the K-Means lab. Day 3: hierarchical clustering and DBSCAN. Day 4: PCA, t-SNE and anomalies. Day 5: practice and the quiz."
  },
  {
   "title": "College student in Pune",
   "text": "Anjali presses Assign and Update in the lab and notes where the centroids sit after each round. With a bad random start, she sees one centroid get stuck. She switches to k-means++, a smarter way to pick starting centres, and gets tighter groups."
  },
  {
   "title": "Homemaker with short breaks",
   "text": "Shabana in Lucknow studies in 20-minute breaks and watches one video per break. In her notebook, she draws one small picture for each method: round blobs for K-Means, a tree for hierarchical clustering and crowds for DBSCAN."
  },
  {
   "title": "Weekend learner in Guwahati",
   "text": "Bikash studies only on Saturday and Sunday. Saturday is for all the videos and the lab. Sunday is for practice, the quiz and the RFM task. He keeps three hours for the RFM task, because cleaning order data needs patience (धैर्य, dhairya)."
  },
  {
   "title": "Slow internet in a hill town",
   "text": "Tenzin in Sikkim watches videos at low quality to save data. She downloads the Online Retail file once, when the connection is good. Then she builds the RFM table on her laptop with no internet at all."
  },
  {
   "title": "Quiz score below 70%",
   "text": "Kiran scores 60% on the quiz. Most wrong answers were about PCA and t-SNE. She decides to rewatch (दोबारा देखना, dobara dekhna) those two lessons. She redoes the PCA practice exercise and then takes the quiz again."
  }
 ],
 "keyTerms": [
  {
   "title": "Mobile plans in Chennai",
   "text": "Imagine a telecom team that clusters 10,000 users by data use and call minutes. K-Means with k = 4 finds four centroids, the centre points of four groups. One centroid sits at 25 GB and 100 minutes a month: the \"heavy data, few calls\" group."
  },
  {
   "title": "Elbow for a dairy co-operative",
   "text": "Imagine a dairy co-operative in Gujarat that groups 3,000 farmers by litres of milk and fat %. Inertia for k = 1 to 6 falls 800, 350, 200, 180, 165, 155. After k = 3 the drops are small, so the elbow is 3. The silhouette score is also best at 3, so both checks agree."
  },
  {
   "title": "Dendrogram of tea gardens",
   "text": "Imagine a tea company in Assam that clusters its 20 gardens by yield (पैदावार, paidaavaar) and leaf price. In the dendrogram, two gardens join very low, so they are almost twins. Cutting the tree at a middle height gives four groups for four advice plans."
  },
  {
   "title": "DBSCAN on auto stands",
   "text": "Imagine GPS pings from autos in Hyderabad. DBSCAN finds the crowded spots near metro stations as clusters, whatever their shape. A few pings from the far outskirts get the label −1, noise, because no crowd is nearby."
  },
  {
   "title": "PCA on a health check-up",
   "text": "Imagine a Lucknow clinic that records 12 blood test values per patient. Many rise and fall together. PCA turns them into 2 principal components that keep about 80% of the spread, so doctors can plot patients on a simple chart."
  },
  {
   "title": "RFM and an anomaly",
   "text": "Imagine an online spice shop in Kerala that builds RFM for 5,000 buyers. One buyer shows 400 orders in a month, far above everyone else. That is an anomaly: maybe a reseller, maybe a bot. Someone checks before any campaign goes out."
  },
  {
   "title": "Silhouette in a college library",
   "text": "A college library in Bhopal groups students by books borrowed and hours spent. One student has a silhouette score of −0.2. She sits closer to the next group than to her own, so she is probably in the wrong group."
  }
 ],
 "indiaExample": [
  {
   "title": "The second drive in 2024",
   "text": "GST officers ran a second all-India drive from 16 August to 15 October 2024. The idea was the same: data checks flag odd registrations, and officers verify them in person. Learning what normal looks like helps to catch new tricks too."
  },
  {
   "title": "Mule accounts at a bank",
   "text": "Imagine a bank in Kochi. A mule account is one that moves stolen money for someone else. One savings account suddenly gets money from 40 strangers in a day and sends it all out within minutes, so it is flagged for the fraud team."
  },
  {
   "title": "Power theft in a town",
   "text": "Imagine a power company in Kanpur. Homes of the same size use about 300 units in May, but one meter shows 20. Isolation Forest, which cuts the data with random lines, cuts this home off in very few cuts. So an officer visits to check the meter."
  },
  {
   "title": "A grocery store's RFM groups",
   "text": "Imagine Rekha's grocery store in Bhubaneswar with 300 regular buyers. She works out RFM: how recently, how often and how much each buyer spends. K-Means, which groups buyers around centres, then gives three groups: daily buyers, monthly bulk buyers and buyers who stopped coming. She sends a Durga Puja offer only to the third group."
  },
  {
   "title": "Fields seen from the sky",
   "text": "Imagine an agriculture team in Maharashtra with satellite greenness readings for 5,000 fields over one season. Clustering finds fields that grow in the same pattern, like early sowing or late sowing. No farmer had to label any field."
  },
  {
   "title": "Bus tickets before Diwali",
   "text": "Imagine a bus ticket website before Diwali. Most people book 1 to 4 seats over a few minutes. One account books 60 seats within 30 seconds, using many cards. That is far from normal, so the system flags it as a possible bot, a program pretending to be a person."
  }
 ],
 "commonMistakes": [
  {
   "title": "Big rupee numbers win",
   "text": "Vikram clusters customers on total spend (₹500 to ₹5,00,000) and days since the last order (1 to 365). The groups split by spend only, because a 300-day gap counts like ₹300. After `StandardScaler`, both columns matter, and a clear \"lapsed\" group appears."
  },
  {
   "title": "A blurry elbow",
   "text": "Sneha's inertia curve bends gently between k = 3 and k = 6. She first picks 6 just by eye. Then she checks the silhouette scores, which peak at 4, and four groups also make sense to the sales team. She goes with 4."
  },
  {
   "title": "Reading gaps on a t-SNE map",
   "text": "Imran draws a t-SNE plot of text *embeddings*, lists of 768 numbers that stand for each text. He says two groups are \"very different\" because of the big gap. With another perplexity, the gap shrinks. Now he checks real distances before claiming anything."
  },
  {
   "title": "An odd payment the z-score missed",
   "text": "Ravi has six payments: ₹200, ₹210, ₹190, ₹205, ₹195 and ₹4,000. The ₹4,000 lifts the average to about ₹833, and its z-score is only 2.24, below 3. The IQR rule catches it: the middle half ends at ₹208.75 and is ₹12.5 wide, so anything above 208.75 + 1.5 × 12.5 = ₹227.5 is flagged."
  },
  {
   "title": "K-Means on two moons",
   "text": "Neha runs K-Means with k = 2 on two curved half-moon shapes. One group takes most of one moon plus a tip of the other. DBSCAN, which follows crowds, finds the two moons correctly."
  },
  {
   "title": "Unnamed clusters at an agency",
   "text": "Rohan sends a client a slide with \"Cluster 0, 1, 2, 3\". The client cannot act on it. He adds the averages and names: \"Champions\", \"New buyers\", \"At risk\" and \"Lost\". Now each group gets its own campaign."
  },
  {
   "title": "t-SNE numbers in production",
   "text": "Pooja feeds 2D t-SNE numbers into a live fraud model. Next week, new payments arrive, but t-SNE cannot place them on the old map, so the model cannot score them. She switches to PCA, which can transform new rows the same way."
  }
 ],
 "selfCheck": [
  {
   "title": "Cleaning the order list",
   "text": "`df = df[df[\"Quantity\"] > 0]` keeps only real orders and drops cancelled ones. Also drop rows with no CustomerID. Then add a spend column: `df[\"Spend\"] = df[\"Quantity\"] * df[\"UnitPrice\"]` multiplies quantity by price for every row."
  },
  {
   "title": "RFM in one groupby",
   "text": "Group by customer and take three things: the last InvoiceDate, the number of different invoices and the total spend. Recency is the days between a fixed \"today\" and that last date. A good table has one row per customer and three columns."
  },
  {
   "title": "Picking k with two checks",
   "text": "Sample thinking: \"Inertia bends at k = 4. Silhouette is 0.41 at k = 3 and 0.39 at k = 4, so both are close. The 4 groups are easier to name for the client, so I pick 4.\" Show the numbers, then the business reason."
  },
  {
   "title": "Why K-Means fails on moons",
   "text": "Hint: K-Means gives each point to the nearest centre, so it draws one straight border between two regions. That border cuts across both moons. DBSCAN joins points that sit next to each other, so it follows each curved band."
  },
  {
   "title": "Reading a running total",
   "text": "Try a small case first. Shares 0.40, 0.30, 0.15, 0.10 and 0.05 give running totals 0.40, 0.70, 0.85, 0.95 and 1.00 with `np.cumsum(pca.explained_variance_ratio_)`. The first total of 0.90 or more is at index 3. If `totals` holds them, `np.argmax(totals >= 0.90)` gives that first index. Python counts from 0, so you need 3 + 1 = 4 components."
  },
  {
   "title": "Checking Isolation Forest",
   "text": "`pred = IsolationForest(contamination=0.01, random_state=0).fit_predict(X)` marks odd rows −1. Here `contamination=0.01` tells it to expect about 1% odd rows, and `random_state=0` gives the same result every run. Then `(pred[-10:] == -1).sum()` counts how many of the last 10 rows, the extreme ones, were caught. Also look at normal rows that got flagged."
  },
  {
   "title": "Naming Cluster 3 for a client",
   "text": "Sample answer: \"On average, Cluster 3 last bought 210 days ago, ordered 18 times and spent ₹42,000. These were loyal (वफ़ादार, wafadar) big spenders who stopped coming. Let us call them at-risk high spenders and send them a win-back offer.\""
  }
 ]
};
