/* AI Marg lesson-card examples for one module (loaded with its lesson cards). JavaScript holding JSON. */
window.AIM = window.AIM || {};
window.AIM.examples = window.AIM.examples || {};
window.AIM.examples["l1-eda-viz-sql"] = {
 "overview": [
  {
   "title": "Test orders at a Jaipur shop",
   "text": "A Jaipur saree shop's file has 1,000 orders with an average of ₹950. A histogram shows 50 orders of just ₹1: staff were testing the payment page. Without them, the real average is about ₹1,000. EDA caught this before the owner saw a wrong report."
  },
  {
   "title": "Blank ages at a Kochi clinic",
   "text": "Running `df.isna().sum()` shows that 300 of 2,000 patient rows have no age. The doctor explains that walk-in patients skip the form. So you do not delete those rows blindly; you note the reason and plan a fix."
  },
  {
   "title": "Rain and chai in Kolkata",
   "text": "Imagine a tea stall owner who notes daily rainfall and cups sold for three months. A scatter plot (one dot per day, placed by its rainfall and cups sold) shows that rainy days sell more cups. That is bivariate analysis: two columns studied together."
  },
  {
   "title": "Flat prices in three cities",
   "text": "A scatter plot of flat area against price, coloured by city, shows three separate clouds of dots. In this made-up data, Mumbai prices rise much faster per square foot than Indore prices. Adding a third column, the city, changed the story."
  },
  {
   "title": "Branch totals with SQL",
   "text": "Imagine a Hyderabad pharmacy chain that keeps every bill in a database. One SQL query, `SELECT branch, SUM(amount) FROM bills GROUP BY branch`, gives each branch's total sales in a second. Nobody has to scroll through 5 lakh rows in Excel."
  },
  {
   "title": "A story for a Lucknow gym",
   "text": "EDA at an imagined Lucknow gym shows that members who miss two weeks in a row rarely come back. The one-page story says: call members in their second missed week. A rough sum shows this could save about ₹40,000 of fees a month."
  }
 ],
 "outcomes": [
  {
   "title": "Riya checks a loan file",
   "text": "Riya loads a Lucknow bank's loan file into a Pandas table, `df`. Running `df.shape` gives (5000, 14): 5,000 rows and 14 columns. Then `df.isna().sum()` shows 600 blank incomes. She asks the bank why before she deletes anything."
  },
  {
   "title": "Arjun picks a line chart",
   "text": "Arjun has 24 months of UPI sales from his father's kirana in Nashik. His question is about change over time, so he draws a line chart. It shows two sharp peaks, both at Diwali."
  },
  {
   "title": "Fatima's hover chart",
   "text": "Fatima's manager wants to explore ad spend against sales for 200 stores in a web dashboard (a web page of charts). She makes a Plotly scatter plot, where each dot is one store. Hovering over any dot shows that store's name and numbers."
  },
  {
   "title": "Gurpreet flags a payment",
   "text": "At Gurpreet's Ludhiana shop, UPI payments have Q1 = ₹200 and Q3 = ₹600, so IQR = ₹400. The upper fence (the cut-off line) is 600 + 1.5 × 400 = ₹1,200, so a ₹9,000 payment is flagged. It was a real wholesale order, so he keeps it."
  },
  {
   "title": "Lakshmi filters groups",
   "text": "Lakshmi in Chennai needs the cities whose sales are above ₹1,00,000. She writes `GROUP BY city HAVING SUM(amount) > 100000`. WHERE would not work here, because WHERE runs before the totals exist."
  },
  {
   "title": "Karthik's one-line headline",
   "text": "Karthik's chart title says 'Rural defaults doubled in two years', not 'Default rate by quarter'. His manager gets the point in five seconds and asks what to do. Karthik's one recommendation is ready below the chart."
  }
 ],
 "studySteps": [
  {
   "title": "One hour after office",
   "text": "Suresh, a bank clerk in Kanpur, has one free hour a day. Day 1: EDA videos in Colab. Day 2: chart videos. Day 3: outliers. Days 4 and 5: SQL and the lab. Day 6: practice and the quiz."
  },
  {
   "title": "College student in Guwahati",
   "text": "Pooja watches the chart videos between classes. In the evening she makes each chart again with a cricket dataset. She adds a title and labels like 'Runs per over', so a friend can read each chart without asking her."
  },
  {
   "title": "Homemaker with short breaks",
   "text": "Shabana in Hyderabad studies in 20-minute breaks. One break is enough for one SQL lesson and one lab task. She writes each new SQL word in a notebook, with a one-line example."
  },
  {
   "title": "Weekend learner in Pune",
   "text": "Rahul studies only on weekends. On Saturday he finishes the videos and the lab. On Sunday he does the practice, the quiz and the data story. His business question stays written at the top of his notebook."
  },
  {
   "title": "Slow internet in Darjeeling",
   "text": "Tenzin has a slow connection, so she watches the videos at low quality. The SQL practice runs inside her browser, on her own device. So once the page has loaded, a weak signal does not slow down each query."
  },
  {
   "title": "Quiz score below 70%",
   "text": "Kiran scores 60% on the quiz. Most wrong answers confuse WHERE (which filters rows) with HAVING (which filters groups). She studies the SQL order diagram once more, redoes two lab tasks, and then retakes the quiz."
  }
 ],
 "keyTerms": [
  {
   "title": "EDA on a coaching file",
   "text": "A Kota coaching centre shares 3,000 student rows. EDA shows that the `marks` column is stored as text, and 40 students have 0 because they were absent. You fix the type and mark the absent students before any model."
  },
  {
   "title": "Histogram of auto fares",
   "text": "A histogram of 1,000 Bengaluru auto fares shows the tallest bar at ₹100 to ₹150. A few bars far to the right, above ₹400, are airport trips. One column, studied alone, is univariate analysis."
  },
  {
   "title": "Box plots side by side",
   "text": "A Mumbai delivery app draws one box plot of delivery minutes for each month. The July box sits higher and is wider than the March box. Monsoon rain makes deliveries slower and less predictable."
  },
  {
   "title": "Heatmap at a Surat shop",
   "text": "An imagined Surat textile shop draws a correlation heatmap of ad spend, visitors, sales and returns. Ad spend and sales show 0.8, a strong link. Returns and ad spend show about 0, no link."
  },
  {
   "title": "LEFT JOIN at a Patna library",
   "text": "A library LEFT JOINs its members table to its borrowings table. Members who never borrowed a book still appear, with NULL in the book columns. Now the library can send them a welcome message."
  },
  {
   "title": "GROUP BY for onion prices",
   "text": "A table holds daily onion prices from many mandis. The query `SELECT mandi, AVG(price) FROM onion GROUP BY mandi` makes one group per mandi, such as Lasalgaon or Pimpalgaon. Then `AVG(price)` works out each mandi's average price."
  },
  {
   "title": "Two odd deliveries",
   "text": "In 13 Bengaluru deliveries, two fall outside the IQR fences: 2 minutes and 74 minutes. The 2-minute one is an error; the rider tapped 'delivered' at the restaurant, so you fix it. The 74-minute one really happened in heavy rain, so you keep it."
  },
  {
   "title": "A running total in Kochi",
   "text": "A Kochi shop sells ₹2,000 on day 1, ₹3,000 on day 2 and ₹1,500 on day 3. The window function `SUM(amount) OVER (ORDER BY day)` adds a column: 2,000, then 5,000, then 6,500. All three rows stay."
  }
 ],
 "indiaExample": [
  {
   "title": "A growth line for Tamil Nadu",
   "text": "Load the four quarter files of each year for Tamil Nadu into one table. Plot the number of payments by quarter as a line chart. Label the y-axis 'Payments (crore)' and the x-axis 'Quarter', and give it a title that states what you see."
  },
  {
   "title": "Top five states with SQL",
   "text": "The `map` folder has one file per quarter, listing every state's payment count and amount. Put them all into one SQLite table called pulse. Then `SELECT state, SUM(amount) AS total FROM pulse GROUP BY state ORDER BY total DESC LIMIT 5` lists the five biggest states. `DESC` puts the biggest first, and `LIMIT 5` keeps five rows."
  },
  {
   "title": "Average payment size",
   "text": "Divide the amount by the count to get the average size of one payment. Imagine a district with 20 lakh payments worth ₹400 crore in one quarter: that is ₹2,000 per payment. Then compare districts."
  },
  {
   "title": "Why totals protect privacy",
   "text": "A district total of ₹400 crore does not show any single person's payments. That is why such data can be shared openly. This protects privacy (निजता, nijta): good analysis often needs only totals, not anyone's personal data."
  },
  {
   "title": "The mixing trap",
   "text": "Imagine Anjali in Raipur combines a 2024 download with the new 2026 files. Her chart shows a sudden jump where they meet. It is not real growth: PhonePe changed what each number counts. Reading the README during EDA would have warned her."
  },
  {
   "title": "An Indore agency picks districts",
   "text": "An imagined Indore agency helps a snack brand choose districts for new shops. It compares district payment counts and their growth over the last eight quarters. Districts where digital payments grow fastest get the first shops."
  }
 ],
 "commonMistakes": [
  {
   "title": "Two schools, one tricky chart",
   "text": "Two Bhopal schools have pass rates of 92.5% and 95%. Neha's bar chart starts the y-axis at 90, so the second bar looks twice as tall, and the principal panics. Starting the axis at 0 shows that the bars are almost equal."
  },
  {
   "title": "Deleting the biggest buyer",
   "text": "Vikram's code removes every order above the IQR fence, the cut-off line for outliers. One removed order is a ₹3 lakh hotel order for the wedding season, from his biggest customer. Fix: flag outliers, check each one with the sales team, and keep notes."
  },
  {
   "title": "WHERE on a total",
   "text": "Sneha writes `WHERE SUM(amount) > 100000`, and SQLite stops with an error. WHERE runs before the groups are made, so SUM does not exist yet. Moving the test into `HAVING SUM(amount) > 100000`, after GROUP BY, fixes it."
  },
  {
   "title": "A customer with a ghost order",
   "text": "Imran counts orders per customer with a LEFT JOIN and `COUNT(*)`. Meera, who never ordered, shows 1 order. Changing to `COUNT(o.order_id)` gives her 0, because counting a column skips NULLs."
  },
  {
   "title": "Dropping blank incomes",
   "text": "Rohan deletes all loan rows with a blank income, and 1,500 of 5,000 rows go. Later he learns that self-employed people often leave income blank. His data now hardly includes them. Fix: keep the rows, ask why, and add a yes/no column 'income blank'."
  },
  {
   "title": "Two Patna coaching centres",
   "text": "Centre A passes 82% of students overall and Centre B only 67%. But B is better for strong students (95% against 90%) and for weak ones (60% against 50%). B simply takes many more weak students. Fix: compare strong with strong and weak with weak before you judge."
  }
 ],
 "selfCheck": [
  {
   "title": "Ten questions, a sample start",
   "text": "For PhonePe Pulse: Which state grew fastest since 2022? Which quarter is busiest each year? Do small states have bigger average payments? Write all ten first, then pick five that one chart each can answer."
  },
  {
   "title": "Hint for the outlier task",
   "text": "With 13 delivery times, Q1 = 24 and Q3 = 34, so the fences (the cut-off lines) are 9 and 49. List each value outside them, such as 2 and 74 minutes. Then write one line for each: '2 min: rider tapped early, fix' and '74 min: monsoon rain, keep'."
  },
  {
   "title": "SQL sketch for task 3",
   "text": "Total per city: `SELECT city, SUM(amount) FROM orders GROUP BY city`. Top 5: JOIN customers to orders, group by customer, then add `ORDER BY SUM(amount) DESC LIMIT 5` (biggest first, keep five). For the rank, first total each customer's spend, then use `RANK() OVER (PARTITION BY city ORDER BY spend DESC)`."
  },
  {
   "title": "Cross-check for task 4",
   "text": "`df.groupby('city')['amount'].sum()` and the SQL GROUP BY should give the same totals, such as Indore 1,500. If they differ, look for blanks, repeated rows, or one city written two ways, like 'Bengaluru' and 'Bangalore'."
  },
  {
   "title": "Working out the ₹ estimate",
   "text": "Sample: 'Rural defaults are 8% of ₹50 crore of loans. Reminder calls could bring that down to 7%. That 1% of ₹50 crore is ₹50 lakh a year.' Then list your assumptions (धारणा, dhaarna), so the client can check them."
  },
  {
   "title": "A sample headline",
   "text": "Weak: 'Sales by city'. Strong: 'Pune sales fell 20% after the price rise'. A good headline states the finding, so the client knows what to look for in the chart."
  }
 ]
};
