/* AI Marg lesson-card examples for one module (loaded with its lesson cards). JavaScript holding JSON. */
window.AIM = window.AIM || {};
window.AIM.examples = window.AIM.examples || {};
window.AIM.examples["l1-python"] = {
 "overview": [
  {
   "title": "Kirana sales in Chennai",
   "text": "Lakshmi keeps today's sales in a list: `sales = [450, 1200, 380]`. One line, `sum(sales)`, adds them up to ₹2,030. A loop could also print each sale, one by one."
  },
  {
   "title": "Marks lookup in Lucknow",
   "text": "A teacher stores marks in a dictionary: `marks = {\"Arjun\": 82, \"Fatima\": 91}`. Asking for `marks[\"Fatima\"]` gives 91 at once. She does not need to know where Fatima's name sits."
  },
  {
   "title": "GST recipe in Ludhiana",
   "text": "Gurpreet's hardware shop adds 18% GST to many bills. He writes one function: `def add_gst(amt): return amt * 1.18`. Now `add_gst(1000)` gives back 1180.0, and he reuses it all day."
  },
  {
   "title": "Rain alert near Nagpur",
   "text": "Imagine an app for farmers near Nagpur. It checks `if rain_mm > 100:` and then shows 'Heavy rain: do not spray today'. Otherwise, the `else` part says the day is fine. That is a decision in code."
  },
  {
   "title": "Wrong input at a tuition form",
   "text": "Ayesha's tuition centre in Hyderabad has a form that asks for age. Someone types 'ten' instead of 10. With `try`/`except`, Python's way to catch errors, the program says 'Please type a number' instead of stopping with an error."
  },
  {
   "title": "UPI spends in Kolkata",
   "text": "Arjun saved last month's 60 UPI payments in a list. A loop goes through them and adds each one to `total`. In under a second, he knows he spent ₹18,400."
  }
 ],
 "outcomes": [
  {
   "title": "Sharing a dinner bill",
   "text": "Four friends in Pune share a ₹2,450 dinner bill. `2450 / 4` gives 612.5, the exact share. `2450 // 4` gives 612 whole rupees each, and `2450 % 4` gives the ₹2 left over."
  },
  {
   "title": "Counting orders in Surat",
   "text": "Riya's online saree shop keeps a list of order cities, with many repeats. A set keeps each value only once, so `len(set(orders))` counts the different cities. Then `counts[city] = counts.get(city, 0) + 1` counts each city's orders; `get` gives 0 for a city not seen yet."
  },
  {
   "title": "Prices above ₹500",
   "text": "Kavya wants prices with 18% GST, but only for items above ₹500. One list comprehension does it: `[p * 1.18 for p in prices if p > 500]`. Items of ₹500 or less are left out."
  },
  {
   "title": "Reading an error at work",
   "text": "Imran's script (a small program) stops. The last line of the error message says `ZeroDivisionError: division by zero`. The line number above it points to `total / count`, and `count` is 0 on a holiday. He adds an `if` check before dividing."
  },
  {
   "title": "Sorting items with a lambda",
   "text": "Fatima wants her shop items sorted by price. Each item is a tuple like `(\"soap\", 45)`. In `sorted(items, key=lambda x: x[1])`, `sorted` puts the items in order. The lambda is a tiny nameless function that picks the price, `x[1]`, to sort by."
  },
  {
   "title": "Two projects on one laptop",
   "text": "Divya has an old college project that needs an old version of pandas (a package for tables). Her new sales report needs the latest version. She makes one virtual environment for each project, so updating one never breaks the other."
  },
  {
   "title": "A Student class in Kochi",
   "text": "Joseph, a teacher in Kochi, writes `class Student` with the attributes `name` and `marks`, and a method `average()`. He makes 40 objects, one per student. Each object keeps its own marks."
  },
  {
   "title": "Monthly expenses in Bhopal",
   "text": "Neha keeps her expenses in `expenses.csv`. Her program reads each row and adds the amount to its category. Then it prints 'food: ₹6,200' and 'travel: ₹1,800'."
  }
 ],
 "studySteps": [
  {
   "title": "Ravi: one hour after office",
   "text": "Ravi works in a Noida office and gets one free hour each evening. He watches 30 minutes of a lesson, then types the same code for 30 minutes. He never watches two lessons in a row without typing."
  },
  {
   "title": "Ananya breaks her code",
   "text": "Ananya, a B.Sc. student in Kolkata, types every example in Colab. Then she breaks it on purpose: she deletes a colon or a bracket. She reads each error message, so later errors do not scare her."
  },
  {
   "title": "Meena's home functions",
   "text": "Meena, a homemaker in Madurai, writes her three functions from home life. Her `split_bill(1500, 3)` shares a ₹1,500 bill among three families. Then `add_gst(800)` checks a shop bill, and `grade(68)` checks her son's marks."
  },
  {
   "title": "Kiran: weekend learner",
   "text": "Kiran works long weekdays in Bengaluru. On Saturday he watches the lessons for one step. On Sunday he does the Practice exercises and the Lab, and writes down what confused him."
  },
  {
   "title": "Sanjay on slow mobile data",
   "text": "Sanjay lives in a village near Nashik with weak mobile data. He watches videos at 360p, which uses less data. He keeps Colab and the Practice section for times with a better signal, since both need the internet."
  },
  {
   "title": "Zoya's expense program",
   "text": "Zoya from Lucknow builds the mini program with her own spending. Her CSV file has 45 rows like `food,250`. Her program prints a total per category, and she finds she spends most on travel."
  }
 ],
 "keyTerms": [
  {
   "title": "Variables at a chai stall",
   "text": "A Jaipur chaiwala sold 120 cups at ₹15 each. He writes `cups = 120` and `rate = 15`. Then `bill = cups * rate` stores 1800 in a new variable. If the rate becomes 20, he changes one line, runs it again and gets 2400."
  },
  {
   "title": "Data types on a school form",
   "text": "On an admission form, the name `\"Riya\"` is a str and the age `14` is an int. The fee `4500.50` is a float, and `hostel = True` is a bool. Careful: `\"5\" + \"5\"` gives `\"55\"`, but `5 + 5` gives 10."
  },
  {
   "title": "Slicing a train name",
   "text": "Take `train = \"Shatabdi\"`. Here `train[0]` gives \"S\", because positions start at 0. `train[0:4]` gives \"Shat\": it stops just before position 4. `len(train)` counts all 8 letters."
  },
  {
   "title": "Counting sales at a mandi",
   "text": "A Nashik onion trader writes the village of each sale in a list. A loop goes over it, and `counts[v] = counts.get(v, 0) + 1` adds one to that village's count. `get` starts a new village at 0. Then `counts[\"Lasalgaon\"]` shows the sales from Lasalgaon."
  },
  {
   "title": "A while loop for a phone",
   "text": "Riya saves ₹2,000 each month for a ₹10,000 phone. Starting from `saved = 0`, `while saved < 10000: saved = saved + 2000` runs the step again and again. It stops after 5 rounds, when `saved` reaches 10,000."
  },
  {
   "title": "Skipping bad rows with continue",
   "text": "A Patna shop's sheet has `[\"10\", \"abc\", \"30\"]`. In the loop, `try:` runs `total += int(v)`, and `except ValueError: continue` handles \"abc\". `continue` jumps to the next item, so the total is 40 and nothing crashes."
  },
  {
   "title": "A function to split a bill",
   "text": "`def split(bill, people): return bill / people` is a function with two arguments, `bill` and `people`. `split(900, 3)` gives back 300.0. The same function works for any bill and any group."
  },
  {
   "title": "Exception at a booking form",
   "text": "Imagine a bus booking form where someone types 'two' for the number of seats. `int(\"two\")` raises a `ValueError`. The `except ValueError:` part catches it and asks again, so the form keeps working."
  },
  {
   "title": "A module for square roots",
   "text": "Arjun needs a square root for a maths project. `import math` brings in Python's ready-made math module. Then `math.sqrt(144)` gives 12.0. For outside packages like pandas, he first runs `pip install pandas`."
  },
  {
   "title": "A class for library cards",
   "text": "A Pune college library writes `class Card` with the attributes `name` and `books`, and a method `issue()`. `c1 = Card(\"Fatima\")` makes one object. Then `c1.issue(\"Gitanjali\")` changes only Fatima's card."
  },
  {
   "title": "A piggy bank that remembers",
   "text": "The class `PiggyBank` has `def __init__(self, owner, money=0)`. This `__init__` runs once, when you make a piggy bank, and `self` means \"this object\". Then `p = PiggyBank(\"Divya\")` gives no money, so it starts at the default, 0. After `p.add(300)` and then `p.add(200)`, it holds 500: the value stays and does not reset."
  }
 ],
 "indiaExample": [
  {
   "title": "NPTEL's Joy of Computing",
   "text": "NPTEL runs free online courses from the IITs and IISc. IIT Ropar teaches one called 'The Joy of Computing using Python'. It expects only 10th-standard knowledge, and anyone can join. The videos are free; only the certificate exam has a fee."
  },
  {
   "title": "Spoken Tutorial from IIT Bombay",
   "text": "IIT Bombay's Spoken Tutorial project makes short, free software lessons, including Python. Many lessons have audio in Indian languages (भाषा, bhasha) such as Hindi, Marathi and Telugu. The project was set up with money from the Government of India."
  },
  {
   "title": "SEBI rules for API trading",
   "text": "In February 2025, SEBI, the body that sets India's stock market rules, made rules for small investors who trade through APIs. Brokers need the stock exchange's approval for each *algo* (a program that places orders by itself) that they offer. After two delays, the rules apply to all brokers from 1 April 2026."
  },
  {
   "title": "Kite Connect plans in 2025",
   "text": "Since March 2025, Zerodha's 'Personal' Kite Connect plan is free for placing orders, but it has no live market data. The 'Connect' plan with market data costs ₹500 a month. Prices change, so check Zerodha's site."
  },
  {
   "title": "Imagined GST invoices in Surat",
   "text": "Imagine a Surat textile trader with 300 sales rows in a CSV file (a table saved as plain text). A 30-line Python program reads each row, adds GST and writes one invoice file per buyer. Work that took a whole day now takes a minute."
  },
  {
   "title": "Imagined onion price alert",
   "text": "Imagine a farmer's son near Lasalgaon who types daily onion prices into a Python list (values kept in order). A loop checks each day, and `if price > 2000:` prints 'Good day to sell'. The prices are in ₹ per quintal (100 kg)."
  }
 ],
 "commonMistakes": [
  {
   "title": "Splitting ₹1,000 three ways",
   "text": "Arjun wrote `1000 / 3` to share ₹1,000 among three cousins and got 333.3333333333333. He wanted whole rupees. Fix: `1000 // 3` gives 333 each, and `1000 % 3` shows that ₹1 is left over."
  },
  {
   "title": "Rice in a stranger's basket",
   "text": "Imagine Priya's grocery app, which used `basket=[]` as a default value. A new customer saw rice that an earlier customer had added. Fix: use `basket=None`, and make a fresh list inside the function on every call."
  },
  {
   "title": "Attendance file wiped",
   "text": "A Shillong teacher's script (a small program) saved attendance with `open(\"attendance.csv\", \"w\")` every day. Each morning it erased the earlier days. Fix: open the file with `\"a\"` (append), which adds new rows at the end."
  },
  {
   "title": "Total printed four times",
   "text": "Harpreet indented `print(total)` by mistake, so it sat inside the loop. It printed four running totals instead of one final total. Fix: move the line back to the left, in line with the `for`."
  },
  {
   "title": "= inside an if",
   "text": "Suresh wrote `if marks = 35:` to check marks. Python stopped with a SyntaxError, a grammar error. Fix: `if marks == 35:` checks for exactly 35, and `if marks >= 35:` checks for a pass. Both compare values and give `True` or `False`."
  },
  {
   "title": "The copy-paste learner",
   "text": "Rahul copy-pasted 40 programs in a month and felt fast. In an interview, he could not write a simple loop alone. Fix: he now types every example, breaks it on purpose and reads each error."
  }
 ],
 "selfCheck": [
  {
   "title": "Invoice: start small",
   "text": "Test with two items first: `[(\"pen drive\", 500, 2), (\"mouse\", 400, 1)]`. Subtotal = 500 × 2 + 400 × 1 = ₹1,400. GST at 18% is ₹252, so the grand total is ₹1,652."
  },
  {
   "title": "Marks: plan the counting",
   "text": "Start with `counts = {\"distinction\": 0, \"first\": 0, \"rest\": 0}`. In the loop, test the highest group first: `if m >= 75`, then `elif m >= 60` (a second test), then `else`. Add 1 to the right key each time."
  },
  {
   "title": "Table: guard the input",
   "text": "Put `n = int(input(\"Number: \"))` inside `try:`. `input` reads what the user types, and `int` turns it into a number. Under `except ValueError:`, print 'Please type a number'. If the number is fine, `for i in range(1, 11):` runs for i = 1 to 10, so you print n × 1 up to n × 10."
  },
  {
   "title": "BankAccount: test the refusal",
   "text": "Start with ₹1,000 and deposit ₹500, so the balance is ₹1,500. Then try to withdraw ₹2,000: your method should refuse and print 'Not enough balance'. A good test checks this refusal, not only normal cases."
  },
  {
   "title": "CSV: numbers come back as text",
   "text": "When you read a CSV file back, every value is a string (text), like `\"250\"`. So convert the amount, the second value in each row, with `int(row[1])` before you add it. Otherwise Python stops with a TypeError, an error for mixing a number and text."
  },
  {
   "title": "Invoice with two GST rates",
   "text": "If some items have 5% GST and others 18%, store each rate as a fourth value: `(\"item A\", 600, 1, 0.05)`. The loop then works out the GST item by item. The subtotal stays the same."
  }
 ]
};
