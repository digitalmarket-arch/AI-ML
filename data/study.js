/* AI Marg study content: recall questions, Feynman checklists, Manana questions and the How to learn guide.
   Generated from reviewed source files; loaded on demand by assets/js/study.js. */
window.AIM = window.AIM || {};
window.AIM.study = {
 "modules": {
  "l1-ai-basics": {
   "cards": {
    "overview": {
     "recall": "How do AI, machine learning, deep learning and generative AI fit inside one another?",
     "answer": "AI is the broad goal of machines doing tasks that need judgement. Machine learning is the main way to get there by learning from data, deep learning is machine learning with large neural networks, and generative AI is deep learning that creates new text, images or audio.",
     "why": "Why is training a model compared to training a new employee, and where does that comparison break down?",
     "whyAnswer": "Both see many past examples, spot a pattern and then judge new cases on their own. But a model only finds statistical patterns in its data; it does not understand reasons the way a person does, so it can be confidently wrong on cases unlike anything it has seen."
    },
    "outcomes": {
     "recall": "What are the three ways a machine can learn, and what does the data look like in each?",
     "answer": "Supervised learning uses examples that come with the right answer, unsupervised learning has no answers and the machine forms its own groups, and reinforcement learning tries moves and gets a reward or penalty.",
     "why": "Why does the quality of data limit the quality of a model, as one of the outcomes says?",
     "whyAnswer": "A model can only learn the patterns that are in its examples. If the examples are wrong, incomplete or one-sided, the model copies those faults, just like a student who studied from a guidebook full of errors."
    },
    "studySteps": {
     "recall": "What does the study plan ask you to do right after taking the quiz?",
     "answer": "Aim for 70% or more, and rewatch the lesson behind every question you got wrong, so you fix the exact gaps the quiz showed.",
     "why": "Why does the plan ask you to pause after each lesson on types of learning and write one example from your own business?",
     "whyAnswer": "Linking a new idea to something you already know makes it easier to remember and to use. Writing your own example also tests whether you really understood the lesson, instead of only recognising it when you see it again."
    },
    "keyTerms": {
     "recall": "What is the difference between supervised learning and unsupervised learning?",
     "answer": "Supervised learning learns from examples that come with the correct answer (a label), like emails marked spam or not spam. Unsupervised learning finds groups or patterns in data that has no labels, like grouping customers by their buying habits.",
     "why": "A model is described as a set of learned numbers. What does that tell you about what a model can and cannot know?",
     "whyAnswer": "Training adjusts those numbers until the model's outputs match the past examples, so everything it knows comes from those examples. It knows nothing about situations its training data never showed, and it has no common sense outside them."
    },
    "indiaExample": {
     "recall": "Why is finding mule accounts with MuleHunter.AI a supervised learning problem?",
     "answer": "Because the model learns from past accounts that investigations have already marked (labelled) as mule or genuine, and then flags suspicious new accounts for the bank to check.",
     "why": "How would MuleHunter.AI's flags change if many accounts in its training data had been wrongly marked as genuine?",
     "whyAnswer": "The model would learn that mule-like behaviour is normal, so it would miss real mule accounts. Wrong labels teach the wrong pattern, which is why the checks by bank staff, which add new correct labels, matter so much."
    },
    "commonMistakes": {
     "recall": "What goes wrong when people treat generative AI as all of AI?",
     "answer": "They overlook that many valuable business problems, like fraud scores, demand forecasts and lead scoring, are solved by classic machine learning on spreadsheet-style data, which is cheaper and easier to explain to a client.",
     "why": "Why can an AI chatbot give an answer that sounds confident but is still wrong?",
     "whyAnswer": "Models find statistical patterns in data; they do not understand like a human. When a question is unlike the training data, or the data had errors, the model can still produce a fluent answer that is wrong, so always ask what data it learned from and how it was tested."
    },
    "selfCheck": {
     "recall": "What does the task of labelling five Indian business AI ideas as supervised, unsupervised or reinforcement learning prove you can do?",
     "answer": "It proves you can look at a real business problem, decide which type of learning fits it, and say what data it would need, which is the first thing to settle before pitching any AI project.",
     "why": "Why does consent matter even for a small agency, and how would you ask for it if your project collected customers' phone numbers?",
     "whyAnswer": "Under the DPDP Act, using personal data without clear consent is a legal risk for any organisation, big or small. Tell customers what you collect and why (for example, to send order updates), ask for a clear yes, use the data only for that purpose, keep it safe and let them withdraw consent later."
    }
   },
   "feynman": {
    "prompt": "Explain what AI and machine learning are, how a machine learns from examples, and where it can go wrong, to your aunt who runs a kirana shop in Jaipur, in 5-8 sentences, without jargon.",
    "keyIdeas": [
     {
      "idea": "Machine learning means the computer finds the pattern itself from many past examples, instead of a person writing every rule by hand.",
      "cues": [
       "past examples",
       "many examples",
       "lots of examples",
       "thousands of examples",
       "from examples",
       "instead of rules",
       "writing rules",
       "hand-written",
       "spots the pattern",
       "finds the pattern"
      ]
     },
     {
      "idea": "After training, the model judges new cases on its own, like a trained new employee.",
      "cues": [
       "new case",
       "new bill",
       "new customer",
       "new transaction",
       "new one",
       "on its own",
       "by itself",
       "new employee",
       "new helper",
       "new worker"
      ]
     },
     {
      "idea": "AI, machine learning, deep learning and generative AI sit inside one another; generative AI, like ChatGPT, creates new text or pictures.",
      "cues": [
       "deep learning",
       "neural network",
       "generative",
       "chatgpt",
       "gemini",
       "creates new",
       "makes new",
       "writes new",
       "new text",
       "new pictures"
      ]
     },
     {
      "idea": "There are three ways to learn: from examples with the right answer, by finding groups when there are no answers, and by trial and error with rewards.",
      "cues": [
       "supervised",
       "right answer",
       "correct answer",
       "labelled",
       "labeled",
       "no answers",
       "into groups",
       "reward",
       "trial and error",
       "reinforcement"
      ]
     },
     {
      "idea": "A model is only as good as its data: wrong or one-sided examples make it biased or confidently wrong.",
      "cues": [
       "only as good",
       "bad data",
       "wrong data",
       "wrong examples",
       "examples are wrong",
       "marked wrongly",
       "good data",
       "bias",
       "unfair",
       "confidently wrong"
      ]
     }
    ],
    "jargon": [
     "machine learning",
     "deep learning",
     "neural network",
     "generative AI",
     "model",
     "training data",
     "label",
     "algorithm",
     "supervised",
     "unsupervised",
     "reinforcement",
     "bias"
    ],
    "model": "Aunty, AI means teaching a computer to do jobs that need judgement, like spotting a fake bill. Today we mostly do it with machine learning: instead of writing rules by hand, we show the computer thousands of past examples, say old bills already marked fake or genuine, and it finds the pattern itself. After that practice, it judges a new bill on its own, just like a new helper you trained in your shop. Generative AI, like ChatGPT, is a more powerful kind that creates new text or pictures. A computer can learn in three ways: from examples that come with the right answer, by sorting things into groups when there are no answers, like customers with similar buying habits, or by trial and error with a reward, like learning a game. But it is only as good as its examples. If the old bills were marked wrongly, or all came from one market, it will copy those mistakes and can be confidently wrong. And before using customers' phone numbers or details, we must take their clear permission."
   },
   "socratic": [
    {
     "q": "How do traditional programming and machine learning differ in where the rules come from?",
     "hint": "Think about who writes the if-then rules in each case.",
     "answer": "In traditional programming, a person writes the rules and the computer follows them. In machine learning, we give the computer examples with answers and it works out the rules (patterns) by itself."
    },
    {
     "q": "A shop's chatbot replies to 'What are your timings?' with a fixed message written by the owner. It counts as AI, but is it machine learning? Why or why not?",
     "hint": "Look again at the nested boxes diagram. Is there any part of AI that sits outside machine learning?",
     "answer": "It is AI but not machine learning, because it only follows hand-written if-then rules and never learns from data. Machine learning is one part inside AI, not all of it."
    },
    {
     "q": "A coaching institute in Kota has three years of records of past students: test scores, attendance, and whether each one cleared JEE. It wants to flag students who may need extra help. Which type of learning fits, and what is the label?",
     "hint": "Does each past example come with a known outcome?",
     "answer": "Supervised learning, because every past student comes with a known outcome. The label is whether the student cleared JEE; the inputs are test scores and attendance. The model would flag new students whose records look like those of past students who did not clear."
    },
    {
     "q": "Suppose the Kota model was trained only on students from English-medium schools. What could go wrong when it is used for Hindi-medium students, and how would you check?",
     "hint": "Remember the crop-advisory model trained on Punjab data and then used in Kerala.",
     "answer": "The new students may differ from the training data, so the learned patterns may not fit, and the model could wrongly flag or miss them, which is a form of bias. Test the model separately on Hindi-medium students, and add labelled examples from them before trusting its flags."
    },
    {
     "q": "Which apps on your own phone use a model that learned from labelled examples, and which use generative AI?",
     "hint": "Think of your SMS or email spam folder, and of the apps you ask to write or draw something.",
     "answer": "A spam filter is a common example of supervised learning: it learned from messages already marked spam or not spam, and it only chooses a label. Chatbots such as ChatGPT, Gemini or Claude are generative AI, because they write new text. Seeing both on one phone shows that generative AI is only one part of AI."
    }
   ],
   "nididhyasana": "If a model only knows what its past examples showed it, what would be missing from the examples of your own town, shop or family?",
   "sravana": [
    "Listen for the nested-circles picture of AI, machine learning, deep learning and generative AI, and the example the speaker gives for each layer.",
    "Listen for how supervised, unsupervised and reinforcement learning are told apart: data with answers, data with no answers, or rewards for actions.",
    "Listen for how generative AI differs from older machine learning: it creates new text or images instead of only picking a label such as spam or not spam."
   ],
   "topics": [
    "AI vs ML vs DL vs GenAI",
    "types of learning",
    "how models learn",
    "testing models",
    "bias and privacy",
    "AI careers"
   ],
   "quizTags": {
    "l1-ai-basics-q01": {
     "topic": "AI vs ML vs DL vs GenAI",
     "skill": "remember"
    },
    "l1-ai-basics-q02": {
     "topic": "AI vs ML vs DL vs GenAI",
     "skill": "understand"
    },
    "l1-ai-basics-q03": {
     "topic": "how models learn",
     "skill": "understand"
    },
    "l1-ai-basics-q04": {
     "topic": "types of learning",
     "skill": "apply"
    },
    "l1-ai-basics-q05": {
     "topic": "how models learn",
     "skill": "apply"
    },
    "l1-ai-basics-q06": {
     "topic": "bias and privacy",
     "skill": "analyse"
    },
    "l1-ai-basics-q07": {
     "topic": "AI careers",
     "skill": "remember"
    },
    "l1-ai-basics-q08": {
     "topic": "bias and privacy",
     "skill": "apply"
    },
    "l1-ai-basics-q09": {
     "topic": "how models learn",
     "skill": "analyse"
    },
    "l1-ai-basics-q10": {
     "topic": "testing models",
     "skill": "analyse"
    },
    "test-l1-q01": {
     "topic": "types of learning",
     "skill": "apply"
    },
    "test-l1-q02": {
     "topic": "testing models",
     "skill": "analyse"
    },
    "test-l1-q03": {
     "topic": "bias and privacy",
     "skill": "apply"
    }
   }
  },
  "l1-python": {
   "cards": {
    "overview": {
     "recall": "In the kitchen comparison, what are variables, lists, dictionaries, loops and functions each compared to?",
     "answer": "Variables are labelled jars, lists are shopping lists, dictionaries are a contact list (look up a name, get a number), loops repeat a step for every item, and functions are recipes you write once and reuse.",
     "why": "How is a dictionary like the contact list on your phone, and when would a list be the better choice?",
     "whyAnswer": "In a contact list you look up a name and get the number, without caring where it sits; a dictionary does the same with a key and its value. A list is better when order matters and you fetch items by position, like marks in roll-number order, where marks[0] is the first."
    },
    "outcomes": {
     "recall": "Which two Python tools from the outcomes let a program make decisions and repeat work over many items?",
     "answer": "if/else makes decisions, and loops (for loops and while loops) repeat work over many items.",
     "why": "How would your monthly accounts change if you could read and write CSV files with Python, say for a shop's expenses?",
     "whyAnswer": "You could load hundreds of expense rows at once, total them by category with a loop, and save a clean summary file in seconds instead of adding by hand. The same program works again next month with no extra effort, which is the real power of automation."
    },
    "studySteps": {
     "recall": "What mini program does the study plan ask you to build after the lessons on modules, classes and file handling?",
     "answer": "A program that reads a CSV file of expenses and prints the total spent in each category.",
     "why": "Why does the plan ask you to write your own small functions, such as add GST, split a bill and grade marks, instead of only watching examples?",
     "whyAnswer": "Writing your own functions turns watching into doing: you must choose the inputs, the steps and the value to give back yourself. Using problems from your own life, like splitting a restaurant bill, makes the idea stick and shows you exactly where you are still unsure."
    },
    "keyTerms": {
     "recall": "What is a class, and how is an object made from it different from the class itself?",
     "answer": "A class is a template that bundles data (attributes) and actions (methods), like BankAccount. An object is one filled-in copy made from it, like Asha's account with her own balance, so a deposit into Asha's account does not change Ravi's.",
     "why": "Why would two projects on the same laptop need separate virtual environments, and what could go wrong without them?",
     "whyAnswer": "Different projects may need different versions of the same package. Without separate environments, installing a new version for one project can break the other one, so each project keeps its own folder of packages."
    },
    "indiaExample": {
     "recall": "What is pykiteconnect, and which basic Python ideas do developers use with it?",
     "answer": "It is Zerodha's official open-source Python library for its Kite Connect trading API, installed with pip install kiteconnect. Developers use plain Python, with functions, dictionaries, loops and error handling, to fetch market data and manage orders.",
     "why": "Why does error handling matter much more in a program that places trades than in a practice exercise?",
     "whyAnswer": "If a trading program crashes halfway, for example when the internet drops, you may not know whether an order went through, and real money is at stake. Handling errors with try/except lets the program stop safely and report the problem, which is also why the module says to practise with pretend trades first."
    },
    "commonMistakes": {
     "recall": "What is the difference between = and == in Python, and what goes wrong when you mix them up?",
     "answer": "= stores a value in a variable, while == compares two values and gives True or False. Writing = inside an if gives a syntax error, and writing == when you meant to store a value only compares, so nothing is stored.",
     "why": "Why does typing code and breaking it on purpose teach you more than copy-pasting it?",
     "whyAnswer": "Typing makes you notice every colon, bracket and space, and breaking code shows you what each error message means. When you later meet the same error in your own work, you recognise it and know the fix, which copy-pasting never teaches."
    },
    "selfCheck": {
     "recall": "What does the multiplication-table task, which must cope with input like 'abc', prove you can do?",
     "answer": "It proves you can take input, repeat work with a loop, and use try/except so that bad input gets a helpful message instead of crashing the program.",
     "why": "How would your invoice_total function change if some items had 5% GST and others had 18%?",
     "whyAnswer": "Each item would need its own rate, for example as a fourth value in its tuple, and the loop would add price times quantity times that item's rate to the GST total. The subtotal stays the same; only the GST part is worked out item by item."
    }
   },
   "feynman": {
    "prompt": "Explain how a simple Python program stores information, makes decisions, repeats work and copes with errors, to your cousin in Class 10 who has never coded, in 5-8 sentences, without jargon.",
    "keyIdeas": [
     {
      "idea": "A variable is a name that stores one value, like a labelled jar, and the value can be a whole number, a decimal, text or True/False.",
      "cues": [
       "variable",
       "jar",
       "box",
       "stores a value",
       "store a value",
       "holds a value",
       "keeps values",
       "with a name",
       "with names",
       "price ="
      ]
     },
     {
      "idea": "Lists keep many items in order, counted from position 0, and dictionaries let you look up a value by its key, like a contact list.",
      "cues": [
       "dictionary",
       "dict",
       "contact list",
       "shopping list",
       "a list",
       "position 0",
       "starts from 0",
       "starts at 0",
       "look up",
       "lookup"
      ]
     },
     {
      "idea": "if/else lets the program make a decision: it does one thing when a test is true and another thing otherwise.",
      "cues": [
       "if/else",
       "if else",
       "if-else",
       "if and else",
       "if statement",
       "decision",
       "decide",
       "condition",
       "otherwise",
       "choose what"
      ]
     },
     {
      "idea": "A loop repeats the same steps for every item in a collection, or until a condition stops it.",
      "cues": [
       "loop",
       "repeat",
       "again and again",
       "each item",
       "every item",
       "one by one",
       "for each",
       "over and over",
       "each round",
       "every payment"
      ]
     },
     {
      "idea": "A function is a reusable recipe: you write it once, give it inputs, and it gives back a result.",
      "cues": [
       "function",
       "recipe",
       "reuse",
       "re-use",
       "write once",
       "written once",
       "gives back",
       "def ",
       "use it again",
       "call it"
      ]
     },
     {
      "idea": "When something goes wrong while running, try/except lets the program handle the error instead of crashing.",
      "cues": [
       "try/except",
       "try and except",
       "try except",
       "crash",
       "error",
       "exception",
       "goes wrong",
       "wrong input",
       "handle"
      ]
     }
    ],
    "jargon": [
     "variable",
     "data type",
     "string",
     "integer",
     "float",
     "boolean",
     "index",
     "dictionary",
     "function",
     "argument",
     "exception",
     "lambda"
    ],
    "model": "Think of Python as giving clear instructions to a very obedient but very literal helper. It stores information in variables, which are like labelled jars: price = 1180 puts 1180 in a jar called price, and a jar can hold a whole number, a decimal, some text or True/False. For many things at once there are lists, like a shopping list where the first item sits at position 0, and dictionaries, which work like the contact list on your phone: you look up a name and get the number. To make a decision you write if/else: if the marks are 75 or more, print distinction, otherwise print something else. To repeat work, a loop goes through every item, say every UPI payment in a list, and adds each one to a total, one by one. A function is like a recipe you write once, such as add 18% GST, and reuse whenever you want: you give it a price and it gives back the total. And when something goes wrong, like someone typing abc instead of a number, try/except lets the program show a message instead of crashing."
   },
   "socratic": [
    {
     "q": "What is the difference between a list and a dictionary in Python?",
     "hint": "Think of how you find an item: by its place in a queue, or by its name?",
     "answer": "A list keeps items in order, and you get one by its position, starting from 0. A dictionary stores key-value pairs, so you get a value by asking for its key, like looking up a name in a contact list."
    },
    {
     "q": "In the loop trace diagram, why does total end at 3340, and why does the last print line run only once?",
     "hint": "Follow amt through 120, 2500, 80 and 640, and look at which lines are indented.",
     "answer": "Each round adds the current amt to total: 120, then 2620, then 2700, then 3340. The final print is not indented, so it is outside the loop and runs only once, after all four rounds."
    },
    {
     "q": "A textile shop in Surat wants to add 5% GST to each of 200 bill amounts and print every final amount. How would you use a function and a loop together?",
     "hint": "Which part is the recipe you write once, and which part repeats for each bill?",
     "answer": "Write a function, say add_gst(amount, rate=0.05), that returns amount * (1 + rate). Then a for loop goes over the 200 amounts, calls add_gst on each one and prints the result. The function holds the rule once; the loop applies it to every bill."
    },
    {
     "q": "Staff type the bill amounts by hand, and one entry is '1,200' with a comma. What happens when your program calls float() on it, and how should the program cope?",
     "hint": "Remember what int('abc') did in the quiz.",
     "answer": "float('1,200') raises a ValueError, because a comma is not allowed inside a number, so without handling the program crashes. Wrap the conversion in try/except to report or skip the bad entry, or clean the text first, for example with .replace(',', '') to remove the comma."
    },
    {
     "q": "Why do you think almost every later module in this course, from data analysis to LLM apps, is written in Python?",
     "hint": "Think about how Python reads, and about the ready-made packages you can install with pip.",
     "answer": "Python reads close to plain English, so it is quick to learn and easy to review, and pip gives free access to ready-made packages, like Zerodha's kiteconnect here and NumPy and pandas later. Variables, loops, functions and error handling are the same building blocks those later modules use."
    }
   ],
   "nididhyasana": "Think of one task you do again and again each week. Which part of it is the step that repeats, and which part is a recipe you could write once?",
   "sravana": [
    "Listen for the difference between = (store a value) and == (compare two values), and pause to try both yourself in Colab.",
    "Listen for why list positions start from 0, and how a slice such as city[0:4] stops just before the end position.",
    "Listen for the moments the speaker's code raises an error: note the last line of the error message and how try/except deals with it."
   ],
   "topics": [
    "variables and data types",
    "strings and collections",
    "conditions and loops",
    "functions and lambda",
    "errors and exceptions",
    "packages and environments",
    "classes and files"
   ],
   "quizTags": {
    "l1-python-q01": {
     "topic": "variables and data types",
     "skill": "understand"
    },
    "l1-python-q02": {
     "topic": "strings and collections",
     "skill": "apply"
    },
    "l1-python-q03": {
     "topic": "packages and environments",
     "skill": "understand"
    },
    "l1-python-q04": {
     "topic": "conditions and loops",
     "skill": "apply"
    },
    "l1-python-q05": {
     "topic": "strings and collections",
     "skill": "apply"
    },
    "l1-python-q06": {
     "topic": "errors and exceptions",
     "skill": "apply"
    },
    "l1-python-q07": {
     "topic": "classes and files",
     "skill": "apply"
    },
    "l1-python-q08": {
     "topic": "functions and lambda",
     "skill": "analyse"
    },
    "l1-python-q09": {
     "topic": "errors and exceptions",
     "skill": "analyse"
    },
    "l1-python-q10": {
     "topic": "classes and files",
     "skill": "analyse"
    },
    "test-l1-q04": {
     "topic": "functions and lambda",
     "skill": "analyse"
    },
    "test-l1-q05": {
     "topic": "conditions and loops",
     "skill": "analyse"
    }
   }
  },
  "l2-ml-foundations": {
   "cards": {
    "overview": {
     "recall": "In the board-exam comparison, which part of the data is like the real board exam, and when are you allowed to use it?",
     "answer": "The test set is like the real board exam. It stays unseen while you build the model and is used only once, at the very end, to check the finished model.",
     "why": "Why does a student who memorises last year's answers do well on practice papers but fail the real exam, and what does that tell you about overfitting?",
     "whyAnswer": "Memorising only works for questions you have already seen, so it breaks on new ones. An overfit model does the same thing: it remembers the training rows, including their random noise, instead of the general pattern. So it scores well on training data and badly on new data."
    },
    "outcomes": {
     "recall": "According to this module's outcomes, where does the ML project lifecycle begin and where does it end?",
     "answer": "It begins with defining the business problem and ends with monitoring the model after it is launched. Training the model is only one step in the middle.",
     "why": "Why can't the lifecycle stop on the day the model is launched, when things in India such as crop prices or festival shopping keep changing?",
     "whyAnswer": "The world keeps changing after launch: prices, government rules, seasons and customer habits all shift. The patterns the model learnt from old data can go out of date, so its errors slowly grow. Monitoring catches this drop, and retraining on fresh data fixes it."
    },
    "studySteps": {
     "recall": "In the Overfitting lab step, which point are you asked to note as you make the model more and more complex?",
     "answer": "The point where training error keeps falling but validation error starts rising. That is where the model starts to overfit.",
     "why": "Why do the study steps ask you to pause each video and guess the answer before the teacher explains it?",
     "whyAnswer": "Guessing first makes you think for yourself instead of just listening. You then notice the gap between your guess and the real explanation, and that gap is exactly what helps the correct idea stick. A wrong guess is still useful."
    },
    "keyTerms": {
     "recall": "What is the difference between the validation set and the test set?",
     "answer": "The validation set is held-back data you use while still building, to compare models and settings. The test set is locked away and used only once at the end to estimate real-world performance.",
     "why": "How would your final test score change if you kept checking the test set while choosing settings, and why?",
     "whyAnswer": "It would become too optimistic. Every time you keep a setting because it did well on the test set, your choices quietly fit those particular rows. The test set is then no longer unseen, so the real-world score will usually be lower than the one you report."
    },
    "indiaExample": {
     "recall": "For a Swiggy or Zomato delivery-time model, what is the label, and how should an honest test split the past orders?",
     "answer": "The label is the number of minutes past orders actually took. An honest test trains on older weeks and tests on the most recent weeks, instead of shuffling all orders randomly.",
     "why": "Why would a random shuffle of all orders give a falsely good score, when the app will always predict orders that have not happened yet?",
     "whyAnswer": "A random shuffle puts orders from the same days, and from later weeks, into training, so the model already knows things like that rainy evening's traffic or a new restaurant's speed. In real use it never sees the future. Training on older weeks and testing on the newest ones copies real life, so the score is honest."
    },
    "commonMistakes": {
     "recall": "Why is it a mistake to clean or scale the full dataset before you split it?",
     "answer": "The cleaning or scaling step learns numbers such as the average from all rows, including the test rows, so test-set information leaks into training. Each preprocessing step should be fitted on the training data only.",
     "why": "How is the 'always say no' baseline like a weather forecaster in Jaisalmer who predicts 'no rain' every day, and what does it teach you about accuracy?",
     "whyAnswer": "In a dry desert city, 'no rain' is right on most days, so that forecaster looks accurate while never warning anyone about the rare rainy day. The 'always no' baseline is the same: 95% accuracy, yet it never finds a single paying client. A real model must beat this lazy rule and also catch the rare cases you care about."
    },
    "selfCheck": {
     "recall": "What does the self-check comparing DummyRegressor with LinearRegression on the California housing data prove you can do?",
     "answer": "It proves you can split data 80/20, train both a simple baseline and a real model with fit and predict, and judge how much better the real model is than just predicting the average.",
     "why": "In the enquiry task, why must you cross out a feature such as 'advance payment received', even though it predicts conversion very well?",
     "whyAnswer": "An advance payment exists only after the enquiry has already become a paying client, so you would not have it at the moment you need the prediction. Training on it gives a falsely high score that collapses in real use. That is data leakage."
    }
   },
   "feynman": {
    "prompt": "Explain how a computer learns from past examples, and why we must test it on examples it has never seen, to your cousin in Class 10 who is preparing for board exams. Use 5-8 sentences and no jargon.",
    "keyIdeas": [
     {
      "idea": "The computer finds patterns in past examples whose answers are already known, and uses them to predict the answer for new cases.",
      "cues": [
       "past example",
       "old example",
       "past paper",
       "past order",
       "past record",
       "previous",
       "pattern",
       "known answer",
       "answers are known",
       "already know the answer"
      ]
     },
     {
      "idea": "Some examples must be kept aside and never shown during learning, so the final check is on examples it has never seen, used only once at the end.",
      "cues": [
       "never seen",
       "not seen",
       "unseen",
       "not shown",
       "never shown",
       "hide",
       "aside",
       "hold back",
       "held back",
       "keep some"
      ]
     },
     {
      "idea": "Memorising the practice examples (overfitting) looks brilliant in practice but fails on new questions.",
      "cues": [
       "memoris",
       "memoriz",
       "by heart",
       "rote",
       "mug up",
       "mugs up",
       "mugged up",
       "mugging",
       "cram",
       "overfit"
      ]
     },
     {
      "idea": "A model that is too simple (underfitting) does badly even on the examples it practised on.",
      "cues": [
       "too simple",
       "underfit",
       "barely stud",
       "hardly stud",
       "too little",
       "badly everywhere",
       "fails everywhere",
       "bad on both",
       "fail both",
       "fails both"
      ]
     },
     {
      "idea": "No answer may leak in: the computer can only use information that will really be available at the moment it makes a prediction.",
      "cues": [
       "leak",
       "sneak",
       "peek",
       "cheat",
       "answer key",
       "known after",
       "only have after",
       "before the exam",
       "not available",
       "would not have"
      ]
     }
    ],
    "jargon": [
     "machine learning",
     "model",
     "training set",
     "validation set",
     "test set",
     "feature",
     "label",
     "overfitting",
     "underfitting",
     "data leakage",
     "baseline",
     "bias-variance"
    ],
    "model": "Think about how you prepare for your board exams. You solve lots of past papers and slowly notice patterns: which kinds of questions come and how to answer them. A computer learns in the same way. We give it past examples where the answer is already known, such as old food orders and how many minutes each one took, and it finds patterns so it can guess the time for a new order. But we must check it fairly, so we keep some examples aside that it has never seen, like a sealed board paper, and test it only once at the very end. If it simply memorises the old examples, it looks brilliant in practice but fails on new questions. If it is too simple, like a student who barely studies, it does badly everywhere. We also make sure no answer leaks in. It may only use what is known at the moment of ordering, like the distance and the time, not the rating the customer gives after the food arrives."
   },
   "socratic": [
    {
     "q": "A Pune property website predicts the sale price of a flat from its area, number of bedrooms and locality. Which of these are features and which is the label?",
     "hint": "One of them is the answer you want to predict; the others are the clues you already have before you know it.",
     "answer": "Area, number of bedrooms and locality are features, the inputs the model uses. The sale price is the label, the value the model learns to predict."
    },
    {
     "q": "Why does a big gap between a high training score and a low validation score point to overfitting rather than underfitting?",
     "hint": "Think about what the training score of a model that is too simple would look like.",
     "answer": "A model that is too simple does badly even on the data it was trained on, so both scores are low. A high training score with a much lower validation score means the model learnt the training rows, noise included, but cannot handle new rows. That is overfitting."
    },
    {
     "q": "A Jaipur coaching institute wants to predict which enquiries will join a course. Its columns are 'fees paid', 'batch allotted', 'city', 'course asked about' and 'how they heard of us'. Which columns cause leakage?",
     "hint": "Ask of each column: does this value already exist at the moment the enquiry comes in?",
     "answer": "'Fees paid' and 'batch allotted' exist only after a student has joined, so they leak the answer and must be removed. 'City', 'course asked about' and 'how they heard of us' are known when the enquiry arrives, so they are safe features."
    },
    {
     "q": "A random 80/20 split works for many problems. When can it give a misleadingly good score, for example when forecasting next week's UPI transaction volume?",
     "hint": "Picture which weeks land in the training pile when you shuffle data that is ordered in time.",
     "answer": "When the data is ordered in time and the model must forecast the future. A random split puts later weeks into training and earlier weeks into testing, so the model has effectively seen the future. Splitting by time, training on older weeks and testing on the newest ones, gives an honest score."
    },
    {
     "q": "The 2.4 Model Evaluation module teaches ways to score a model beyond accuracy. Using the 'always say no' baseline, why is accuracy alone not enough when you hunt for rare cases such as fraud?",
     "hint": "Count how many of the rare cases the 'always no' baseline actually finds.",
     "answer": "The 'always no' baseline finds zero rare cases yet can score 95% accuracy, so accuracy can look high while the model is useless for the job. You need scores that look directly at the rare class, such as how many real frauds were caught, which is what precision and recall in module 2.4 measure."
    }
   ],
   "nididhyasana": "A model can only ever learn from the past. What does it really mean for it to be good at predicting a future it has never seen?",
   "sravana": [
    "Listen for the stages of the ML development life cycle, and notice that it carries on after deployment with monitoring and retraining.",
    "In the end-to-end project video, listen for the order of steps: split the data first, call fit on the training part only, then predict and score on the test part.",
    "Listen for how overfitting is shown on a graph: training error keeps falling as the model gets more complex, while test or validation error falls and then rises."
   ],
   "topics": [
    "ml lifecycle",
    "features and labels",
    "train-test split",
    "overfitting and underfitting",
    "data leakage",
    "scikit-learn workflow",
    "baseline models"
   ],
   "quizTags": {
    "l2-ml-foundations-q01": {
     "topic": "features and labels",
     "skill": "apply"
    },
    "l2-ml-foundations-q02": {
     "topic": "train-test split",
     "skill": "remember"
    },
    "l2-ml-foundations-q03": {
     "topic": "overfitting and underfitting",
     "skill": "understand"
    },
    "l2-ml-foundations-q04": {
     "topic": "ml lifecycle",
     "skill": "apply"
    },
    "l2-ml-foundations-q05": {
     "topic": "overfitting and underfitting",
     "skill": "analyse"
    },
    "l2-ml-foundations-q06": {
     "topic": "data leakage",
     "skill": "analyse"
    },
    "l2-ml-foundations-q07": {
     "topic": "train-test split",
     "skill": "apply"
    },
    "l2-ml-foundations-q08": {
     "topic": "scikit-learn workflow",
     "skill": "apply"
    },
    "l2-ml-foundations-q09": {
     "topic": "baseline models",
     "skill": "apply"
    },
    "l2-ml-foundations-q10": {
     "topic": "overfitting and underfitting",
     "skill": "analyse"
    },
    "test-l2-q03": {
     "topic": "data leakage",
     "skill": "apply"
    },
    "test-l2-q07": {
     "topic": "overfitting and underfitting",
     "skill": "analyse"
    }
   }
  },
  "l2-regression": {
   "cards": {
    "overview": {
     "recall": "What kind of answer does regression predict, and how does gradient descent find the best-fitting line?",
     "answer": "Regression predicts a number, such as a fare or a price. Gradient descent finds the line by nudging it again and again in the direction that lowers the error, like taking small steps downhill in fog.",
     "why": "Why does squaring each miss in MSE change which line counts as the best one?",
     "whyAnswer": "Squaring makes a ₹12 miss count nine times as much as a ₹4 miss, not three times. So the line with the lowest MSE works hard to avoid big misses, even if that means accepting several small ones. This is also why a few extreme rides can pull the line towards them."
    },
    "outcomes": {
     "recall": "According to the outcomes, what two kinds of numbers does linear regression use to make a prediction?",
     "answer": "Weights, one for each feature, and an intercept. The prediction is each feature multiplied by its weight, all added up, plus the intercept.",
     "why": "Why would a car dealer in Lucknow rather hear 'our price estimates are off by about ₹40,000 on average' than an MSE measured in squared rupees?",
     "whyAnswer": "MAE is in rupees, the unit the dealer already thinks in, so they can judge at once whether ₹40,000 is acceptable for a car. MSE is in squared rupees, a unit nobody can picture. Explaining errors in ₹ terms lets a client make real business decisions."
    },
    "studySteps": {
     "recall": "In the Gradient Descent lab step, which three learning rates do you try, and what should you notice about each?",
     "answer": "A tiny, a medium and a very large learning rate. The tiny one crawls, the medium one settles at the bottom, and the very large one overshoots.",
     "why": "Why do the study steps call the from-scratch gradient descent task the most important exercise, when scikit-learn can fit a line in a single line of code?",
     "whyAnswer": "Writing the loop yourself shows what really happens inside fit(): predict, measure the error, work out the slope, and move the weights a little. Once you have seen it work, the learning rate, mini-batches and an exploding loss all make sense. The same loop also trains neural networks in later modules."
    },
    "keyTerms": {
     "recall": "What is the difference between Ridge (L2) and Lasso (L1) regularisation?",
     "answer": "Both add a penalty on large weights to keep the model simpler. Ridge shrinks all the weights towards zero, while Lasso can set some weights exactly to zero, which removes those features.",
     "why": "How would you explain an R² of 0 to a shopkeeper, using the idea of always guessing the average day's sales?",
     "whyAnswer": "An R² of 0 means the model is no better than always guessing the average, for example always saying 'about ₹5,000 of sales today'. An R² close to 1 means the model explains most of the ups and downs around that average. A negative R² means it is even worse than that simple guess."
    },
    "indiaExample": {
     "recall": "Why is estimating a used car's price on Cars24 or CarDekho a regression problem?",
     "answer": "Because the answer is a number, a ₹ amount, predicted from features such as make, model, year, fuel type, kilometres driven and city.",
     "why": "Why could a feature like 'years left before the age limit' help price a diesel car registered in Delhi-NCR, even though it is not written anywhere on the car?",
     "whyAnswer": "In Delhi-NCR a diesel car older than 10 years is not allowed to run, so a car with one year left can be used there for far less time than one with eight years left, and buyers pay for that use. A linear model cannot easily work this out from year, fuel type and city separately. Building the feature yourself hands it this local knowledge directly."
    },
    "commonMistakes": {
     "recall": "What goes wrong when the learning rate is too large, and what does the module suggest you do?",
     "answer": "Each step overshoots the lowest point, so the loss grows or turns into NaN (not a number). Divide the learning rate by 10 and try again.",
     "why": "Why does a feature measured in lakhs of rupees cause trouble for Ridge or Lasso when another feature is measured in years, unless you scale first?",
     "whyAnswer": "The penalty looks at the size of the weights. A feature in lakhs needs only a tiny weight, while a feature in years needs a much bigger weight for the same effect, so the penalty unfairly punishes the years feature. Scaling puts all features on a similar range, so the penalty is fair and gradient descent also trains faster."
    },
    "selfCheck": {
     "recall": "In the synthetic ride-fare task, which result proves that your own gradient descent works?",
     "answer": "The learned intercept and weight come out close to 30 and 15, the true values used to create the data (fare = 30 + 15 × distance + noise).",
     "why": "A used-car model has an MAE of ₹40,000 but an RMSE of ₹1,20,000. What does this big gap tell you about its errors, and why?",
     "whyAnswer": "Most errors are fairly small, but a few are very large. RMSE squares the errors before averaging, so those few big misses pull it far above MAE, while MAE counts every error in proportion to its size. You should look closely at which cars, perhaps rare or luxury ones, cause the big misses."
    }
   },
   "feynman": {
    "prompt": "Explain how a computer learns to estimate an auto-rickshaw fare from the distance of a ride, and how it keeps improving its guess, to a friend who drives an auto in Pune. Use 5-8 sentences and no jargon.",
    "keyIdeas": [
     {
      "idea": "It learns from many past rides where both the distance and the fare actually paid are known.",
      "cues": [
       "past ride",
       "past trip",
       "past fare",
       "old ride",
       "previous",
       "earlier ride",
       "many rides",
       "last month",
       "record",
       "notebook"
      ]
     },
     {
      "idea": "It looks for the straight line that best fits those rides: a starting amount plus a fixed number of rupees for every kilometre.",
      "cues": [
       "straight line",
       "a line",
       "the line",
       "per km",
       "per kilometre",
       "per kilometer",
       "every km",
       "each km",
       "base fare",
       "starting amount"
      ]
     },
     {
      "idea": "It measures how wrong the line is by looking at the gaps between its guessed fares and the real fares, with big misses counting extra.",
      "cues": [
       "how wrong",
       "how far off",
       "gap",
       "miss",
       "error",
       "difference between",
       "off by",
       "wrong by",
       "too high",
       "too low"
      ]
     },
     {
      "idea": "It improves by nudging the line a little at a time in the direction that makes the total miss smaller, repeating until it stops improving.",
      "cues": [
       "little by little",
       "step by step",
       "small step",
       "bit by bit",
       "nudge",
       "adjust",
       "tweak",
       "again and again",
       "downhill",
       "keeps changing"
      ]
     },
     {
      "idea": "The size of each nudge matters: too small takes forever, too big jumps past the best line.",
      "cues": [
       "too big",
       "too large",
       "too small",
       "overshoot",
       "jump past",
       "jumps past",
       "step size",
       "size of each",
       "tiny step",
       "huge step"
      ]
     }
    ],
    "jargon": [
     "regression",
     "linear regression",
     "gradient descent",
     "cost function",
     "MSE",
     "learning rate",
     "weight",
     "intercept",
     "regularisation",
     "MAE",
     "RMSE",
     "R²"
    ],
    "model": "Suppose you kept a notebook of your last 100 rides: how many kilometres each one was and what fare you got. If you marked them as dots on paper, they would roughly follow a straight line: a starting amount plus some rupees per km. The computer's job is to find the line that fits those dots best, so it can estimate the fare for a new ride of, say, 7 km. It starts with a rough line and checks how far off it is from every past ride, and big misses count extra. Then it nudges the line a little, tilting or shifting it in whichever direction makes the total miss smaller, and checks again. It repeats this again and again, like walking downhill in fog with small steps, until the misses stop shrinking. The size of each nudge matters: too small and it takes forever, too big and it jumps past the best line. In the end you get a simple rule, such as ₹30 plus ₹15 per km, that works for any new distance."
   },
   "socratic": [
    {
     "q": "In the rule fare = 30 + 15 × distance_km, what do 30 and 15 each mean, and what fare does it predict for a 4 km ride?",
     "hint": "One number is the fare when the distance is zero; the other is how much the fare grows for each extra kilometre.",
     "answer": "30 is the intercept, the starting amount when the distance is 0, and 15 is the weight, the extra rupees for each kilometre. For 4 km it predicts 30 + 15 × 4 = ₹90."
    },
    {
     "q": "Why does gradient descent move a weight in the opposite direction to the gradient?",
     "hint": "The gradient points the way the cost rises fastest. Which way do you want the cost to go?",
     "answer": "The gradient points uphill, the direction in which the cost increases fastest. We want the cost to fall, so we step the other way, downhill, by subtracting the learning rate times the gradient from the weight."
    },
    {
     "q": "A Chennai electricity board predicts daily demand from 200 scaled features, and it suspects many are useless. Which regularisation would you try to find out which features to drop, and why?",
     "hint": "One of the penalties can set some weights to exactly zero.",
     "answer": "Lasso (L1), because its penalty can push the weights of useless features to exactly zero, which shows that those columns can be dropped. If groups of features are strongly related, such as readings from nearby weather stations, ElasticNet is a safer choice because it keeps related features together."
    },
    {
     "q": "A colleague says R² can never be below 0. When can test R² be negative, and what does that mean?",
     "hint": "Compare the model with the simplest possible guess: the average of the target.",
     "answer": "Test R² is negative when the model's squared errors are larger than those you get by always predicting the average. It means the model is worse than that plain baseline, often because it overfits or because the new data behaves differently from the training data."
    },
    {
     "q": "How does regularisation in this module connect to overfitting from module 2.1, How Machine Learning Works?",
     "hint": "Think about what very large, wild weights let a model do with noisy training data.",
     "answer": "Overfitting happens when a model is flexible enough to chase the noise in its training data, which often shows up as very large weights. Regularisation adds a penalty on large weights, so the model stays simpler and smoother and cannot bend to every noisy point. It gives up a little training accuracy for better results on new data, the same balance as the bias-variance trade-off."
    }
   ],
   "nididhyasana": "Gradient descent never sees the whole valley, only the slope under its feet. How can so many small, local steps still lead to the best line?",
   "sravana": [
    "In the gradient descent video, listen for the update rule: new weight = old weight minus the learning rate times the slope (the gradient).",
    "In the types of gradient descent video, listen for how many rows batch, stochastic and mini-batch use for each update, and what each gains or loses in speed and smoothness.",
    "In the Lasso video, listen for why the L1 penalty can make some coefficients exactly zero while Ridge only shrinks them towards zero."
   ],
   "topics": [
    "linear regression",
    "gradient descent",
    "learning rate",
    "polynomial regression",
    "regularisation",
    "regression metrics",
    "regression assumptions"
   ],
   "quizTags": {
    "l2-regression-q01": {
     "topic": "linear regression",
     "skill": "understand"
    },
    "l2-regression-q02": {
     "topic": "gradient descent",
     "skill": "remember"
    },
    "l2-regression-q03": {
     "topic": "regularisation",
     "skill": "remember"
    },
    "l2-regression-q04": {
     "topic": "learning rate",
     "skill": "analyse"
    },
    "l2-regression-q05": {
     "topic": "regression metrics",
     "skill": "apply"
    },
    "l2-regression-q06": {
     "topic": "polynomial regression",
     "skill": "apply"
    },
    "l2-regression-q07": {
     "topic": "regression assumptions",
     "skill": "analyse"
    },
    "l2-regression-q08": {
     "topic": "regression metrics",
     "skill": "apply"
    },
    "l2-regression-q09": {
     "topic": "gradient descent",
     "skill": "apply"
    },
    "l2-regression-q10": {
     "topic": "regression metrics",
     "skill": "analyse"
    },
    "test-l2-q02": {
     "topic": "regularisation",
     "skill": "analyse"
    },
    "test-l2-q13": {
     "topic": "regularisation",
     "skill": "apply"
    },
    "test-l2-q14": {
     "topic": "gradient descent",
     "skill": "apply"
    }
   }
  }
 },
 "guide": null
};
