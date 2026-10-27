/* AI Marg lesson-card examples for one module (loaded with its lesson cards). JavaScript holding JSON. */
window.AIM = window.AIM || {};
window.AIM.examples = window.AIM.examples || {};
window.AIM.examples["l1-numpy-pandas"] = {
 "overview": [
  {
   "title": "Lakshmi's kirana sheet",
   "text": "Lakshmi in Madurai keeps her daily sales in Excel. One day was typed twice, so the month's total looked ₹4,000 too high. In Pandas, `df.drop_duplicates()` removes the repeated row in one line."
  },
  {
   "title": "GST on 10 lakh prices",
   "text": "Imagine a Surat cloth seller with 10 lakh product prices in a NumPy array. `prices * 1.18` adds 18% GST to all of them at once. A loop would visit each price one by one and take much longer."
  },
  {
   "title": "Class averages in Kolkata",
   "text": "A Kolkata school keeps marks for 600 students in a DataFrame. `df.groupby('class')['marks'].mean()` gives the average of each class in one line, like 7A: 72.5 and 7B: 68.0."
  },
  {
   "title": "Travel agent's dates",
   "text": "A travel agent in Bhubaneswar has trip dates typed as '05-03-2026'. `pd.to_datetime` with the day-first format turns them into real dates. Now she can count trips per month and see her busy season."
  },
  {
   "title": "Two sheets become one",
   "text": "A Jaipur handicraft seller has one sheet of customers and one of orders. `merge` matches them on customer ID. Now every order shows the buyer's city, so he can total sales by city."
  },
  {
   "title": "Sixes in a cricket season",
   "text": "Imagine a ball-by-ball file of a cricket season, one row per ball. `df[df['runs'] == 6]` keeps only the sixes. One more line with `groupby` counts the sixes hit by each batter."
  }
 ],
 "outcomes": [
  {
   "title": "First look at a sales file",
   "text": "Arjun in Nagpur loads a shop's sales CSV. `df.info()` shows that the amount column has only 950 of 1,000 cells filled. He has found 50 blanks before making any report."
  },
  {
   "title": "GST in one line",
   "text": "Fatima in Hyderabad has 5,000 product prices in a NumPy array. She writes `final = prices * 1.18`, with no loop. Then `(final > 5000).sum()` tells her how many items now cost above ₹5,000."
  },
  {
   "title": "Picking cells from a grid",
   "text": "Kavya in Mysuru stores vegetable rates in an array: 3 rows for 3 days, 4 columns for 4 vegetables. Counting starts at 0, so `rates[1, 2]` is the second day's rate for the third vegetable. And `rates[:, 0]` gives the first vegetable's rate on every day."
  },
  {
   "title": "City totals before the meeting",
   "text": "Gurpreet in Ludhiana has 20,000 orders. `df.groupby('city')['amount'].sum()` gives one ₹ total per city. His manager gets the answer before the meeting ends."
  },
  {
   "title": "Explaining a blank-value choice",
   "text": "Meera's survey has blank income cells in 8% of rows. She writes: \"I kept these rows and marked income as unknown, because dropping them would remove many rural families.\" Her teammate can now trust (भरोसा, bharosa) and check the numbers."
  },
  {
   "title": "Monthly sales from text dates",
   "text": "Joseph in Kochi turns text like '05-03-2026' into dates with `format='%d-%m-%Y'`. Then he groups by `.dt.month`. For the first time, he sees each month's sales as one clean number."
  }
 ],
 "studySteps": [
  {
   "title": "One hour after office",
   "text": "Priya is a bank clerk in Lucknow with one free hour a day. Day 1: NumPy videos and the timing test. Day 2: Pandas basics in Colab. Day 3: groupby, merge and the Lab tab. Day 4: cleaning a dataset. Day 5: the quiz and Self-check."
  },
  {
   "title": "College student in Coimbatore",
   "text": "Karthik watches the videos between classes on his phone. In the evening he opens Colab on the college lab computer. He types every line himself instead of copying, so each error (गलती, galti) teaches him something too."
  },
  {
   "title": "Homemaker with short breaks",
   "text": "Shabana in Bhopal studies in 20-minute breaks. She uses her own kitchen expenses as data: 30 rows of date, item and ₹ amount. With `groupby`, she totals her spending on each item."
  },
  {
   "title": "Weekend learner in Bengaluru",
   "text": "Rahul studies only on Saturday and Sunday. Saturday: all the videos and the timing test. Sunday morning: the Lab tab and Practice. Sunday evening: he cleans one real mandi price file, printing `df.shape` after each step."
  },
  {
   "title": "Slow internet in Sikkim",
   "text": "Tenzin watches the videos at low quality to save data. She downloads one small CSV file, about 1 MB, only once. Colab runs Python on Google's computers, so small files work well even on her slow connection."
  },
  {
   "title": "Quiz score below 70%",
   "text": "Arjun scores 60% on the quiz. Most wrong answers were about `.loc` and broadcasting. He watches those two lessons again, runs each quiz code in Colab, and checks the printed answer before he retakes the quiz."
  }
 ],
 "keyTerms": [
  {
   "title": "Mandi rates plus transport",
   "text": "A Nashik trader keeps rates in a NumPy array of shape (3, 2): 3 days and 2 crops. Adding `np.array([2, 3])` adds ₹2 transport to every onion rate and ₹3 to every tomato rate. That is broadcasting."
  },
  {
   "title": "Grace marks for everyone",
   "text": "An exam board adds 5 grace marks for 10 lakh students. With marks in a NumPy array, `marks + 5` updates every student in one step. That is vectorisation: no loop at all."
  },
  {
   "title": "A register with blanks",
   "text": "Ms Fernandes in Goa has marks for 40 students, and 3 cells are blank (NaN). `df['marks'].isna().sum()` shows 3. She flags those students for a re-test instead of giving them 0."
  },
  {
   "title": "Bakery orders meet customers",
   "text": "A Kochi bakery has a customers table and an orders table. `merge` on `cust_id` adds each customer's name and area to every order. Now the owner can see which area orders the most cakes."
  },
  {
   "title": "One column, one Series",
   "text": "In a Kolkata sweet shop's DataFrame, `df['kg_sold']` is a Series: one column with row labels. `df['kg_sold'].sum()` gives the total kilograms of rasgulla sold this week."
  },
  {
   "title": "State-wise rice prices",
   "text": "A Hyderabad analyst has 50,000 rows of rice prices. `df.groupby('state')['price'].mean()` shrinks them into one average price per state, a small table with one row per state."
  },
  {
   "title": "A month-by-city grid",
   "text": "A Jaipur seller turns 2,000 order rows into a pivot table: cities down the side, months across the top, ₹ totals inside. One look shows which city buys most in which month."
  },
  {
   "title": "Busiest day at a chai stall",
   "text": "Gopal in Indore turns his date column into a datetime with `pd.to_datetime`. Then `df['date'].dt.day_name()` gives the weekday of each sale. Now he can count sales for each weekday."
  }
 ],
 "indiaExample": [
  {
   "title": "Onion rows from Lasalgaon",
   "text": "Lasalgaon, in Nashik district of Maharashtra, is one of India's biggest onion mandis. Imagine filtering the downloaded file with `df[df['market'] == 'Lasalgaon']`. You get only its rows, ready to chart onion prices day by day."
  },
  {
   "title": "Tomato months in Kolar",
   "text": "Kolar in Karnataka has a big tomato mandi. Imagine grouping its tomato rows by month with `.dt.month`. A month far above the others is the spike to explain, perhaps heavy rain or a poor crop."
  },
  {
   "title": "Two states side by side",
   "text": "Imagine onion prices from Maharashtra and Karnataka in two tables. `merge` (joining two tables) on the date puts both states on the same row. Now you can see which state's prices rose first."
  },
  {
   "title": "Milk records in Anand",
   "text": "Imagine a milk co-operative in Anand, Gujarat, with daily milk collection from 200 villages. A pivot table puts villages down the side and months across the top, with litres in each box."
  },
  {
   "title": "UPI numbers by month",
   "text": "NPCI, which runs UPI, publishes monthly UPI figures on its website. Imagine typing a year of them into a DataFrame (a Pandas table) with a month column. Sorting by month shows how fast UPI payments grew."
  },
  {
   "title": "Rain and tomato prices",
   "text": "Imagine a rainfall table and a mandi price table, both with state and month columns. `merge` on those two columns joins them. Now you can check whether tomato prices rose in months of very heavy rain."
  }
 ],
 "commonMistakes": [
  {
   "title": "A loop over 5 lakh bills",
   "text": "Imran in Surat loops over 5 lakh GST bills with `iterrows()`, one row at a time. On a computer like ours, that takes about 15 seconds. One column line, `df['total'] = df['amount'] * 1.18`, takes well under a second."
  },
  {
   "title": "A fake peak in May",
   "text": "Neha's Pune shop file has '05-12-2025' for a wedding-season sale. Without a format, Pandas reads it as 12 May. Her chart shows a fake May peak. Adding `format='%d-%m-%Y'` moves the sale back to 5 December."
  },
  {
   "title": "Only 120 rows left",
   "text": "Rohit runs `df.dropna()`, which drops every row with a blank, on a 1,000-row survey from Bihar. Only 120 rows remain, because blanks were spread over many columns. `df.isna().sum()` shows that the income column holds most blanks. He removes that one column, drops the few rows with other blanks, and keeps 940 rows."
  },
  {
   "title": "The ValueError surprise",
   "text": "Sana in Lucknow writes `df[(df['city'] == 'Pune') and (df['amount'] > 400)]`. Pandas stops with \"the truth value of a Series is ambiguous\". She swaps `and` for `&`, keeps the brackets, and gets the one row she wanted: Pune, ₹500."
  },
  {
   "title": "Wrong month from .iloc",
   "text": "Vikram totals sales by month number, 1 to 3. He writes `monthly.iloc[2]` to get February, but gets March's ₹400. `monthly.loc[2]` looks up the label 2 and gives February's ₹500."
  },
  {
   "title": "Zero for blank marks",
   "text": "A Chennai tutor has marks 80, 70 and 90, plus 2 blanks. She fills the blanks with 0, and the average falls from 80.0 to 48.0. Leaving NaN (Pandas' mark for an empty cell), which `mean()` skips, gives a fair average."
  },
  {
   "title": "Duplicates by order ID",
   "text": "Anu's canteen file has order 103 on three rows: idli, idli and vada. `drop_duplicates()` removes only the repeated idli row. With `subset='order_id'`, the vada line would go too, so she checks which rule she really wants."
  }
 ],
 "selfCheck": [
  {
   "title": "Hint for the onion task",
   "text": "First print `df.columns`, the list of column names, because the real names may not match your guess. Keep only onion rows, for example `df[df['Commodity'] == 'Onion']`. Then group by state and take the mean of the modal price column, using the exact names in your file."
  },
  {
   "title": "Why the modal price?",
   "text": "The highest price may come from one unusual lot or one odd trade. The modal price shows what most buyers paid, much as the median (the middle value) gives a typical salary. So it is fairer for comparing states."
  },
  {
   "title": "Sample lines for the cleaning task",
   "text": "Good answers sound like this. One: \"I removed 2 duplicate rows, so 10 rows became 8\". Two: \"I filled blank cities with 'Unknown', because dropping them would lose real orders\". Each line names the step and the reason."
  },
  {
   "title": "Thinking through the merge",
   "text": "The shared column has two names here, so write `m = orders.merge(customers, left_on='customer_id', right_on='id')`. `left_on` names the column in orders, and `right_on` the one in customers. Then `m.groupby('city')['amount'].sum()` gives spend per city. Check `m.shape`: you should still have one row per order."
  },
  {
   "title": "Counting weekdays",
   "text": "`df['date'] = pd.to_datetime(df['date'], format='%d-%m-%Y')` turns the text into real dates. Then `df['date'].dt.day_name().value_counts()` counts the orders on each weekday. Check one row by hand: 05-03-2026 should be a Thursday."
  },
  {
   "title": "The GST task, step by step",
   "text": "First, `final = prices * 1.18` adds GST to all 1,000 prices at once, because the single 1.18 is broadcast to every price. Next, `final > 5000` gives a *mask*: one True or False per price. Last, `(final > 5000).sum()` counts the Trues, because True counts as 1."
  }
 ]
};
