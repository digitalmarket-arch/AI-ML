/* AI Marg study content: recall questions, Feynman checklists, Manana questions and the How to learn guide.
   Generated from reviewed source files; loaded on demand by assets/js/study.js. */
window.AIM = window.AIM || {};
window.AIM.study = {
 "modules": {
  "l1-ai-basics": {
   "cards": {
    "overview": {
     "recall": "How do AI, machine learning, deep learning and generative AI fit inside one another?",
     "answer": "AI is the broad goal of machines doing tasks that need judgement. Machine learning is the main way to get there by learning from data, deep learning is machine learning with large neural networks (many layers of simple maths units), and generative AI is deep learning that creates new text, images or audio.",
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
     "why": "Why does it matter that a model is only a set of numbers learned from past examples?",
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
       "examples",
       "the pattern",
       "patterns",
       "in common",
       "figures out",
       "works out",
       "past records",
       "instead of following",
       "instead of rules",
       "rules by hand"
      ]
     },
     {
      "idea": "After training, the model judges new cases on its own, like a trained new employee.",
      "cues": [
       "new case",
       "new customer",
       "new transaction",
       "never seen",
       "not seen",
       "not met",
       "on its own",
       "fresh",
       "judge ",
       "predict"
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
       "new text",
       "new content",
       "creates new",
       "makes new",
       "make new"
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
     "why": "Why is a dictionary like the contact list on your phone, and when would a list be the better choice?",
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
     "answer": "It is Zerodha's official open-source Python library for its Kite Connect trading API (a way for programs to talk to Zerodha's trading system), installed with pip install kiteconnect. Developers use plain Python, with functions, dictionaries, loops and error handling, to fetch market data and manage orders.",
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
       "a name",
       "names to",
       "under names",
       "box called",
       "labelled box",
       "stores a value",
       "keeps the value",
       "remembers"
      ]
     },
     {
      "idea": "Lists keep many items in order, counted from position 0, and dictionaries let you look up a value by its key, like a contact list.",
      "cues": [
       "dictionary",
       "contact list",
       "shopping list",
       "in a list",
       "one list",
       "position 0",
       "index 0",
       "starts at 0",
       "starts from 0",
       "look up"
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
       "an if",
       "elif",
       "decision",
       "condition",
       "otherwise"
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
       "over and over",
       "each round",
       "every payment",
       "each element"
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
       "hands back",
       "returns",
       "def "
      ]
     },
     {
      "idea": "When something goes wrong while running, try/except lets the program handle the error instead of crashing.",
      "cues": [
       "try/except",
       "try and except",
       "try except",
       "try block",
       "crash",
       "exception",
       "catch",
       "goes wrong",
       "bad input",
       "error"
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
     "q": "A loop goes through four UPI spends, 120, 2500, 80 and 640, adding each one to total, which starts at 0. Why does total end at 3340, and why does a print line after the loop, with no indent, run only once?",
     "hint": "Follow total round by round, and look at which lines are indented under the for line.",
     "answer": "Each round adds the current spend to total: 120, then 2620, then 2700, then 3340. The indented lines repeat for every item, but the print line has no indent, so it sits outside the loop and runs only once, after all four rounds."
    },
    {
     "q": "A textile shop in Surat wants to add 5% GST to each of 200 bill amounts and print every final amount. How would you use a function and a loop together?",
     "hint": "Which part is the recipe you write once, and which part repeats for each bill?",
     "answer": "Write a function, say add_gst(amount, rate=0.05), that returns amount * (1 + rate). Then a for loop goes over the 200 amounts, calls add_gst on each one and prints the result. The function holds the rule once; the loop applies it to every bill."
    },
    {
     "q": "Staff type the bill amounts by hand, and one entry is '1,200' with a comma. What happens when your program calls float() on it, and how should the program cope?",
     "hint": "Think about what happens when Python is asked to turn text like 'abc' into a number.",
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
    "variables, types, operators",
    "strings and collections",
    "conditions and loops",
    "functions, lambda, comprehensions",
    "errors and exceptions",
    "packages and environments",
    "classes and files"
   ],
   "quizTags": {
    "l1-python-q01": {
     "topic": "variables, types, operators",
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
     "topic": "functions, lambda, comprehensions",
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
     "topic": "functions, lambda, comprehensions",
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
     "topic": "functions, lambda, comprehensions",
     "skill": "analyse"
    },
    "test-l1-q05": {
     "topic": "conditions and loops",
     "skill": "analyse"
    }
   }
  },
  "l1-tools": {
   "cards": {
    "overview": {
     "recall": "What is the difference between Git and GitHub?",
     "answer": "Git is free software, like a save-game system, that records every version of your work. GitHub is the website where you store and show those projects online, so it also becomes your public portfolio.",
     "why": "Why do many clients and employers now ask for a GitHub link along with a CV?",
     "whyAnswer": "A CV only claims skills, but a GitHub profile shows real projects, their code and their history, which anyone can check. A clean record of small, well-described commits also shows how carefully you work."
    },
    "outcomes": {
     "recall": "Which Git actions do the outcomes expect you to be able to do on a project?",
     "answer": "Commit changes, create a branch and merge it back, and push your work to a GitHub repository that has a clear README.",
     "why": "Why does the outcome on AI coding assistants say you must check what the assistant produces?",
     "whyAnswer": "An assistant can write code that runs without any error but still does the wrong thing, like silently dropping rows. You are responsible for the code you use, so read it, test it on small examples with known answers, and only then trust it."
    },
    "studySteps": {
     "recall": "In the Git loop, what do git add, git commit and git push each do?",
     "answer": "git add picks the changes to include (the staging area), git commit seals them as a snapshot with a message in your local history, and git push sends your new snapshots to GitHub.",
     "why": "Why can you keep committing on a train with no internet, and what happens when you are back online?",
     "whyAnswer": "git add and git commit work only inside the Git history on your own laptop, so they need no internet. Once you are online again, one git push sends all the snapshots you made on the journey to GitHub together."
    },
    "keyTerms": {
     "recall": "What is the difference between a commit, a branch and a merge in Git?",
     "answer": "A commit is one saved snapshot with a message. A branch is a separate line of commits where you can try changes without touching main (the main version of the project). A merge joins one branch's changes into another, usually back into main.",
     "why": "Why is a branch safer than copying your whole project folder to try a risky idea?",
     "whyAnswer": "A branch keeps the full history, and Git can join your changes back into main with one merge, or you can throw them away by deleting the branch. Copied folders have no history and are hard to combine later, so you end up with confusing duplicates like final, final2 and final-real."
    },
    "indiaExample": {
     "recall": "What does AI4Bharat publish on GitHub, and how can anyone try it without installing anything?",
     "answer": "IndicTrans2, an open-source translation model for all 22 scheduled Indian languages, under the MIT licence. Its README links a Google Colab notebook, so anyone can open it in Colab and translate English into Hindi or Tamil.",
     "why": "Why does linking a Colab notebook from a GitHub README make a project much easier for other people to use?",
     "whyAnswer": "A visitor does not need to install Python or download anything; one click opens the code in Colab on Google's computers. That turns a project from something people read about into something they can run, which is also what makes your own portfolio projects convincing."
    },
    "commonMistakes": {
     "recall": "Why is committing an API key to a public GitHub repo dangerous, and where should keys be kept instead?",
     "answer": "An API key (a secret key for a paid online service) in a public repo can be copied by anyone and used on your account. Keep keys in Colab's Secrets panel, or in a .env file that is listed in .gitignore (the list of files Git must not track).",
     "why": "Why does deleting a leaked key file in a new commit not solve the problem?",
     "whyAnswer": "Git keeps every older snapshot, so the key is still visible in the commit history. That is why you first revoke the key and create a new one, and only then remove the file and add it to .gitignore."
    },
    "selfCheck": {
     "recall": "What does the task of making a branch called experiment, committing on it and merging it into main prove you can do?",
     "answer": "It proves you can run the full Git workflow from a terminal: start a separate line of work, save snapshots on it, join it safely back into main, and explain why each command is used.",
     "why": "Why does the self-check ask you to note one thing an AI assistant got wrong or left unclear about your code?",
     "whyAnswer": "It trains you to treat the assistant as a helper whose answers you check, not as an authority. Finding its gaps also forces you to understand your own code well enough to judge the explanation."
    }
   },
   "feynman": {
    "prompt": "Explain your free AI workbench, where your code runs and how Git and GitHub keep your work safe, to a friend who runs a printing shop in Indore and saves files as final, final2 and final-real, in 5-8 sentences, without jargon.",
    "keyIdeas": [
     {
      "idea": "Colab and Kaggle run your Python code in the browser on someone else's computer, even with a free GPU, so nothing needs installing.",
      "cues": [
       "colab",
       "kaggle",
       "browser",
       "google's computer",
       "computer at google",
       "their machines",
       "someone else's computer",
       "nothing to install",
       "install anything",
       "free gpu"
      ]
     },
     {
      "idea": "A Colab session is temporary: uploaded files vanish when it ends, so data and notebooks must be kept in Google Drive or GitHub.",
      "cues": [
       "temporary",
       "disappear",
       "wiped",
       "is gone",
       "is lost",
       "are lost",
       "thrown away",
       "session ends",
       "google drive",
       "in drive"
      ]
     },
     {
      "idea": "Git saves a snapshot of every change with a message, so you can go back to any earlier version instead of keeping many copies.",
      "cues": [
       "snapshot",
       "save game",
       "every version",
       "each version",
       "back to",
       "go back",
       "roll back",
       "return to",
       "earlier",
       "history"
      ]
     },
     {
      "idea": "A branch lets you try a risky idea separately without breaking the working version, and a merge joins it back once it works.",
      "cues": [
       "branch",
       "side copy",
       "a copy",
       "separate line",
       "side track",
       "experiment",
       "risky",
       "without breaking",
       "merge",
       "main line"
      ]
     },
     {
      "idea": "GitHub keeps your projects online where clients, employers and teammates can see your real work, like a portfolio.",
      "cues": [
       "portfolio",
       "employer",
       "recruiter",
       "hire you",
       "clients",
       "show your",
       "shows your",
       "can see your",
       "can check",
       "can look at"
      ]
     }
    ],
    "jargon": [
     "repository",
     "commit",
     "branch",
     "merge",
     "git push",
     "GPU",
     "runtime",
     "notebook",
     "terminal",
     "README",
     "staging",
     "kernel"
    ],
    "model": "Think of it as a free workshop for learning AI. Google Colab lets you write and run Python in your browser on Google's computers, even with a free graphics chip that speeds up AI work, so there is nothing to install. But that Google computer is temporary: files you upload disappear when the session ends, so keep your data in Google Drive. Git is like the save-game feature in a mobile game: every time you finish a change, it takes a snapshot with a short note, so you can go back to any earlier version instead of keeping final, final2 and final-real. If you want to try a risky idea, you make a branch, a side copy where you experiment without breaking the working version, and merge it back only when it works. GitHub is the website where those snapshots are stored online. It works like a shop window: clients and employers can see your real projects there, which is why many ask for a GitHub link along with a CV."
   },
   "socratic": [
    {
     "q": "What is the difference between git commit and git push?",
     "hint": "One of them works only on your laptop; the other needs the internet.",
     "answer": "git commit saves a snapshot of your staged changes (the changes you picked with git add) in the history on your own laptop. git push sends those new snapshots to GitHub, so they are stored online and others can see them."
    },
    {
     "q": "In Jupyter you run Cell 1 (stock = 40) once, then Cell 2 (stock = stock - 5) three times. What does the last run print, and why does that matter before you share the notebook?",
     "hint": "Does the notebook forget its variables between cell runs?",
     "answer": "It prints 25: Jupyter keeps variables in memory between runs, so the three runs give 35, then 30, then 25. A notebook can seem to work only because of hidden earlier runs, so before sharing, use Restart & Run All to check that it works from top to bottom on a clean start."
    },
    {
     "q": "A sweet shop in Jaipur uses your billing notebook every day, and the owner asks you to try a new Diwali discount rule. How would you use Git so that the working bill never breaks while you experiment?",
     "hint": "Which Git idea gives you a separate line of work that does not touch main?",
     "answer": "Create a branch, for example with git switch -c diwali-discount, make and commit the change there, and test it on a few sample bills. Main keeps the working version untouched, so the daily bills are safe. When the new rule works, switch back to main and merge the branch; if it fails, simply delete the branch."
    },
    {
     "q": "Free GPU time in Colab has usage limits, and a session does not last for ever. A student in Patna uploads data through the Files panel, starts a long training run on a free GPU and goes to sleep. What could go wrong, and how should the student plan?",
     "hint": "Think about what happens to the session's files and memory when the session ends.",
     "answer": "The session can disconnect or reach the free usage limit before training finishes, and then everything in it is wiped: the uploaded data, installed packages and the half-trained model (the notebook's code itself stays saved in Drive). Keep the data in Google Drive and load it in the first cell, save progress to Drive at regular points, and split the work into shorter runs."
    },
    {
     "q": "AI4Bharat shares IndicTrans2 on GitHub with a Colab notebook linked from its README. How could you use the same workflow to show a client a project from the Python module?",
     "hint": "Think of three things: a repo, a README and a notebook link.",
     "answer": "Push your Python notebook, say the GST invoice program, to a public repo, write a README that says in plain English what it does and how to run it, and link it so it opens in Colab. The client can then run it in the browser without installing anything, just as anyone can try IndicTrans2."
    }
   ],
   "nididhyasana": "If every change you made this week were saved as a snapshot with a one-line message, what would those messages say about how you work?",
   "sravana": [
    "Listen for the order of the Git loop, git add, then git commit, then git push, and note which of these steps is the first to need the internet.",
    "Listen for how a branch is created and merged back into main, and what the speaker says happens to main while you work on the branch.",
    "Listen for where Colab keeps your files during a session, and what is lost when the runtime resets or disconnects."
   ],
   "topics": [
    "Colab and Kaggle",
    "Jupyter notebooks",
    "VS Code and terminal",
    "Git basics",
    "branches and merging",
    "GitHub, README, secrets",
    "AI coding assistants"
   ],
   "quizTags": {
    "l1-tools-q01": {
     "topic": "Colab and Kaggle",
     "skill": "remember"
    },
    "l1-tools-q02": {
     "topic": "Git basics",
     "skill": "remember"
    },
    "l1-tools-q03": {
     "topic": "GitHub, README, secrets",
     "skill": "remember"
    },
    "l1-tools-q04": {
     "topic": "Colab and Kaggle",
     "skill": "understand"
    },
    "l1-tools-q05": {
     "topic": "branches and merging",
     "skill": "apply"
    },
    "l1-tools-q06": {
     "topic": "AI coding assistants",
     "skill": "apply"
    },
    "l1-tools-q07": {
     "topic": "VS Code and terminal",
     "skill": "analyse"
    },
    "l1-tools-q08": {
     "topic": "Jupyter notebooks",
     "skill": "analyse"
    },
    "l1-tools-q09": {
     "topic": "branches and merging",
     "skill": "analyse"
    },
    "l1-tools-q10": {
     "topic": "GitHub, README, secrets",
     "skill": "apply"
    },
    "test-l1-q06": {
     "topic": "branches and merging",
     "skill": "apply"
    },
    "test-l1-q07": {
     "topic": "Jupyter notebooks",
     "skill": "analyse"
    }
   }
  },
  "l1-stats": {
   "cards": {
    "overview": {
     "recall": "In the dal comparison, why can one spoonful tell you about the whole pot, and what is that spoonful called in statistics?",
     "answer": "If the pot is stirred well and you take a fair spoonful, a small taste represents the whole pot. In statistics that fair spoonful is a random sample, which lets you learn about a whole group without checking everything.",
     "why": "Why could tasting only the top of an unstirred pot mislead you, and what is the survey version of that mistake?",
     "whyAnswer": "The top may not be like the rest, so the taste does not represent the pot. In a survey, asking only people who are easy to reach, like the users of one app in one city, gives a one-sided sample, and the answer can be far from the truth for everyone."
    },
    "outcomes": {
     "recall": "What should you be able to do with a simple A/B test by the end of this module?",
     "answer": "Run it, read its p-value (how surprising the gap would be if there were no real difference), and explain the result in plain words, for example whether a new ad really did better or the gap could just be luck.",
     "why": "Why do reports on incomes and house prices usually quote the median rather than the mean?",
     "whyAnswer": "Incomes and house prices are skewed: a few very rich people or very costly flats pull the mean far up. The median, the middle value, stays close to what a typical person earns or pays, so it gives a fairer picture."
    },
    "studySteps": {
     "recall": "In the Central Limit Theorem lab, what should you see as you increase the sample size?",
     "answer": "Even when the population is skewed, the curve of sample means becomes bell-shaped, and it also gets narrower, as the sample size grows.",
     "why": "Why does the plan ask you to compute the mean, median and standard deviation by hand before checking with Python?",
     "whyAnswer": "Working by hand shows you what each number actually measures, like how one big value moves the mean but not the median. Python then becomes a quick checker that you understand, not a black box whose output you copy."
    },
    "keyTerms": {
     "recall": "What is the difference between the mean, the median and the mode?",
     "answer": "The mean is the ordinary average, the median is the middle value when the data is sorted, and the mode is the value that appears most often.",
     "why": "Why is a positive result from a fairly accurate test often a false alarm when the disease is rare?",
     "whyAnswer": "When only 1 in 100 people is ill, the healthy group is huge, so in a group of 10,000 even a 5% false-alarm rate flags more healthy people (495) than ill people (95). Bayes' theorem combines the test's accuracy with how rare the disease is, which is why only about 16% of positives are really ill."
    },
    "indiaExample": {
     "recall": "How does the Periodic Labour Force Survey estimate unemployment for all of India without interviewing every household?",
     "answer": "It interviews a sample of households and uses sampling statistics to estimate rates for the whole population, the same idea as judging a whole pot from one fair spoonful.",
     "why": "How would the PLFS estimates change if every household in the sample came from big cities?",
     "whyAnswer": "The sample would no longer represent the country, because villages and small towns have different kinds of work and different unemployment levels. The estimate could be badly off for India as a whole, however large the sample, which is why such surveys cover both rural and urban areas."
    },
    "commonMistakes": {
     "recall": "What goes wrong when someone reads a p-value of 0.03 as a 97% chance that version B is better?",
     "answer": "A p-value is not the chance that an idea is true. It only says that if the two versions were really equally good, a gap at least this big would turn up about 3% of the time just by luck.",
     "why": "Why is it wrong to stop an A/B test the moment the results start to look good?",
     "whyAnswer": "Results swing up and down by luck as visitors arrive, so if you keep checking and stop at a lucky high point, you will often crown a winner that is not really better. Fixing the sample size before you start keeps the p-value honest."
    },
    "selfCheck": {
     "recall": "What does the ad task, 120 sign-ups from 2,000 visitors against 150 from 2,000, prove you can do?",
     "answer": "It proves you can turn raw counts into conversion rates (the share of visitors who sign up: 6% and 7.5%), test whether the gap is bigger than luck would give, and write a client a clear recommendation: B is clearly better, or more data is needed.",
     "why": "Why does one salary of 5,00,000 rupees among 15 salaries move the mean so much but hardly move the median?",
     "whyAnswer": "The mean adds up every salary, so one huge value pulls the total, and so the average, far up. The median only looks at the middle person after sorting, so the giant salary just sits at the end and the middle value barely changes."
    }
   },
   "feynman": {
    "prompt": "Explain how statistics helps you judge a whole group from a small sample without being fooled by averages, luck, coincidences or false alarms, to a friend who runs a tea stall in Chennai, in 5-8 sentences, without jargon.",
    "keyIdeas": [
     {
      "idea": "A fair, random sample of a few can tell you a lot about the whole group, like one spoonful from a well-stirred pot.",
      "cues": [
       "sample",
       "spoon",
       "the whole",
       "small group",
       "small part",
       "a few",
       "instead of all",
       "instead of asking",
       "every customer",
       "random"
      ]
     },
     {
      "idea": "The average can be pulled by one extreme value, so the median shows a typical value better, and the spread shows how much values vary.",
      "cues": [
       "median",
       "the middle",
       "middle value",
       "typical",
       "spread",
       "vary",
       "one big",
       "one huge",
       "pulls the",
       "pulled up"
      ]
     },
     {
      "idea": "A small difference after a change may be just luck, so compare fairly and check whether the gap is bigger than chance alone would make.",
      "cues": [
       "luck",
       "by chance",
       "be chance",
       "pure chance",
       "chance alone",
       "just chance",
       "might be random",
       "p-value",
       "a/b",
       "compare fairly"
      ]
     },
     {
      "idea": "Two things moving together does not mean one causes the other; a hidden factor may drive both.",
      "cues": [
       "correlation",
       "causation",
       "causes",
       "causing",
       "hidden factor",
       "hidden reason",
       "something else",
       "behind both",
       "drives both",
       "both go up"
      ]
     },
     {
      "idea": "Probability should be updated with new evidence, and when something is rare, many alarms are false alarms.",
      "cues": [
       "false alarm",
       "rare",
       "bayes",
       "updat",
       "new evidence",
       "false positive",
       "1 in 100",
       "out of 100",
       "by mistake",
       "wrongly flag"
      ]
     }
    ],
    "jargon": [
     "median",
     "standard deviation",
     "variance",
     "distribution",
     "probability",
     "p-value",
     "significance",
     "hypothesis",
     "confidence interval",
     "correlation",
     "causation",
     "Bayes"
    ],
    "model": "Statistics is how you learn about everyone when you can only check a few. It works like tasting one spoon of well-stirred dal to judge the whole pot: a fair, random sample of your customers tells you a lot about all of them. When you sum up numbers, the average can fool you. If one wedding party orders 5,000 rupees of tea on a day of small orders, the average jumps, but the median, the middle order, still shows a typical sale, and the spread tells you how much orders vary. If you start selling ginger tea and sales rise a little, it may be just luck, so test old and new menus fairly on similar days and check whether the gap is bigger than chance alone would make. When two things rise together, like umbrella sales and dengue cases in the monsoon, one does not cause the other; a hidden factor, the rain, drives both. Finally, update your belief with new evidence: if fake notes are very rare, a beep from a checker that sometimes makes mistakes is often a false alarm."
   },
   "socratic": [
    {
     "q": "What does the standard deviation tell you that the mean does not?",
     "hint": "Think of two shops whose items both average 10 rupees but are priced very differently.",
     "answer": "The mean tells you the centre; the standard deviation tells you how spread out the values are around it. A shop that sells every item at 10 rupees has a standard deviation of 0, while a shop selling items at 2 and 18 rupees also averages 10 rupees but has a standard deviation of 8, because every price sits 8 away from the mean."
    },
    {
     "q": "In the CLT lab, why do the averages of samples form a bell shape even when individual spending is very skewed?",
     "hint": "When you average 36 customers, what happens to the effect of one unusually big spender?",
     "answer": "In an average, big and small values balance each other out, so sample means cluster around the true mean and extreme averages are rare. With large enough samples, those averages form a roughly bell-shaped curve whatever the original shape, and their spread shrinks as the sample grows (it is about the standard deviation divided by the square root of the sample size)."
    },
    {
     "q": "An online store in Jaipur showed ad A to 3,000 visitors (150 sign-ups) and ad B to 3,000 visitors (186 sign-ups). What are the two conversion rates (the share of visitors who sign up), and is the gap enough on its own to declare B the winner?",
     "hint": "Divide sign-ups by visitors, then ask how often luck alone could produce a gap of that size.",
     "answer": "A converts at 5% and B at 6.2%. The gap alone is not enough, because luck also makes gaps; a two-proportion test asks how often luck would produce a gap this big. With these numbers the p-value is about 0.04, below the usual 0.05 level, so the gap is unlikely to be only luck and B looks better. It still says nothing about whether 1.2 extra sign-ups per 100 visitors is worth the cost of switching."
    },
    {
     "q": "A huge test with 10 lakh visitors per ad finds a conversion rate of 6.0% for A and 6.1% for B, with a p-value of about 0.003. Your client now wants to rebuild the whole website around ad B. What would you point out?",
     "hint": "A small p-value says the gap is probably real. Does it say the gap is big?",
     "answer": "The p-value only says that a gap this size would rarely come from luck alone, so the gap is probably real. It says nothing about whether the gap matters: a gap of 0.1 percentage points (6.1% minus 6.0%) is about 1,000 extra sign-ups per 10 lakh visitors, so compare that gain with the cost of the rebuild. With very large samples, even tiny differences come out as significant."
    },
    {
     "q": "Every ML model is called a statistical guess. How does the idea of a sample connect to training a model in later modules?",
     "hint": "The training data is a sample of all the cases the model will ever meet.",
     "answer": "Training data is a sample of the real world, so a model is only as good as that sample is representative, like the Punjab crop model that failed in Kerala. That is also why models are tested on separate data, and why their accuracy is an estimate with some uncertainty, not a fixed truth."
    }
   ],
   "nididhyasana": "Think of two things in your life that seem to rise and fall together. What hidden third thing might be moving both of them?",
   "sravana": [
    "Listen for the moment the speaker shows how one extreme value pulls the mean but not the median, and note the example used.",
    "Listen for the exact meaning of a p-value, how surprising the data would be if there were no real difference, and the warning against reading it as the chance an idea is true.",
    "Listen for a counting picture of Bayes' theorem, such as 10,000 people split into ill and healthy, and redo its numbers on paper."
   ],
   "topics": [
    "averages and spread",
    "distributions",
    "probability and Bayes",
    "sampling and CLT",
    "confidence intervals",
    "hypothesis tests and A/B",
    "correlation vs causation"
   ],
   "quizTags": {
    "l1-stats-q01": {
     "topic": "averages and spread",
     "skill": "apply"
    },
    "l1-stats-q02": {
     "topic": "correlation vs causation",
     "skill": "understand"
    },
    "l1-stats-q03": {
     "topic": "distributions",
     "skill": "understand"
    },
    "l1-stats-q04": {
     "topic": "probability and Bayes",
     "skill": "apply"
    },
    "l1-stats-q05": {
     "topic": "hypothesis tests and A/B",
     "skill": "understand"
    },
    "l1-stats-q06": {
     "topic": "averages and spread",
     "skill": "apply"
    },
    "l1-stats-q07": {
     "topic": "distributions",
     "skill": "apply"
    },
    "l1-stats-q08": {
     "topic": "probability and Bayes",
     "skill": "apply"
    },
    "l1-stats-q09": {
     "topic": "sampling and CLT",
     "skill": "apply"
    },
    "l1-stats-q10": {
     "topic": "confidence intervals",
     "skill": "apply"
    },
    "test-l1-q08": {
     "topic": "probability and Bayes",
     "skill": "analyse"
    },
    "test-l1-q09": {
     "topic": "hypothesis tests and A/B",
     "skill": "analyse"
    },
    "test-l1-q10": {
     "topic": "sampling and CLT",
     "skill": "apply"
    },
    "test-l1-q11": {
     "topic": "correlation vs causation",
     "skill": "analyse"
    }
   }
  },
  "l1-linalg-calc": {
   "cards": {
    "overview": {
     "recall": "What do linear algebra and calculus each do for machine learning, according to the big idea?",
     "answer": "Linear algebra handles the lists (vectors) and tables (matrices) of numbers that all data is turned into; multiplying by a matrix is the main operation inside neural networks. Calculus measures change, and gradient descent uses those slopes to walk downhill until a model's error is as small as possible.",
     "why": "Why might a shopping app turn each customer into a vector of numbers before suggesting products?",
     "whyAnswer": "Computers can only do maths on numbers, so a profile must first become a list like [spend, visits]. Then the app can measure, with a dot product or a distance, how alike two customers are, and suggest to one what similar customers bought."
    },
    "outcomes": {
     "recall": "According to the outcomes, what is an eigenvector?",
     "answer": "A direction that a matrix only stretches or shrinks, without turning it.",
     "why": "Why does stepping against the gradient reduce a model's error, as the last outcome says?",
     "whyAnswer": "The gradient points the way the error rises fastest, like the steepest path up a hill. Stepping the opposite way goes downhill, so each small step lowers the error, as long as the step is not too big."
    },
    "studySteps": {
     "recall": "What does the last study step ask you to write for gradient descent, and what should you watch happen?",
     "answer": "A short (about 10-line) Python loop that runs gradient descent, and you watch the error fall with each step.",
     "why": "Why does the plan have you draw two vectors on graph paper and compute their dot product by hand before using NumPy?",
     "whyAnswer": "Drawing makes the idea visible: you can see that the dot product is large when the arrows point the same way. With that picture in your head, NumPy's one-line answer means something to you instead of being just a number."
    },
    "keyTerms": {
     "recall": "What is the difference between a dot product and a norm?",
     "answer": "A dot product multiplies the matching entries of two vectors and adds them up, measuring how much they point the same way. A norm is the length of one vector: the square root of the sum of its squared entries.",
     "why": "In the shopping-bill example, why must the inner sizes match when you multiply the 2×3 quantity matrix by the 3×2 price matrix?",
     "whyAnswer": "Each bill pairs every item in a person's row with that item's price in a shop's column, so both must list the same 3 items: rice, dal and oil. If the price list had only 2 items, the third quantity would have no price to pair with, so the multiplication would make no sense."
    },
    "indiaExample": {
     "recall": "How does a Video KYC face-match check typically decide whether a live selfie matches the ID photo?",
     "answer": "It turns each face photo into a vector of numbers (an embedding) and measures how close the selfie's vector is to the ID photo's vector; very close vectors suggest the same person.",
     "why": "Why does the module say that both halves, linear algebra and calculus, are at work in Video KYC face matching?",
     "whyAnswer": "Linear algebra is used when checking: faces become vectors, and the two vectors are compared by how close they are. Calculus is used when building: the model that turns faces into vectors is trained with gradient descent, which follows slopes of its error."
    },
    "commonMistakes": {
     "recall": "What goes wrong if you believe the gradient points to the minimum?",
     "answer": "The gradient actually points uphill, towards the steepest increase in error, so you must step the opposite way. It also only shows the slope where you stand, so you take many small steps set by the learning rate (the step size) instead of one jump.",
     "why": "How would gradient descent behave if the learning rate were far too large, as in the bottom half of the slope diagram?",
     "whyAnswer": "Each step would jump past the bottom of the valley and land higher on the other side, so the error would grow instead of settling. A smaller learning rate lets the steps shrink smoothly as the slope flattens near the bottom."
    },
    "selfCheck": {
     "recall": "What does the task of finding where f(x) = x² − 6x + 10 has zero slope, and then reaching it with gradient descent, prove you can do?",
     "answer": "It proves you can take a derivative (2x − 6), find the lowest point by hand (x = 3), and write a gradient descent loop that reaches the same answer step by step, which is exactly how models learn.",
     "why": "Why is multiplying a 2×3 matrix by another 2×3 matrix not allowed, while a 2×3 times a 3×2 is?",
     "whyAnswer": "Matrix multiplication takes dot products of rows of the first with columns of the second, so a row of the first (3 numbers) must be as long as a column of the second. In 2×3 times 2×3, rows of 3 meet columns of 2, which do not line up; 2×3 times 3×2 matches on 3 and gives a 2×2 answer."
    }
   },
   "feynman": {
    "prompt": "Explain how a computer turns things into lists of numbers and then learns by walking downhill on its errors, to your cousin in Class 10 in Lucknow who knows y = mx + c, in 5-8 sentences, without jargon.",
    "keyIdeas": [
     {
      "idea": "Machine learning turns everything, a customer or a photo, into lists of numbers (vectors), and many lists stacked together form a table (matrix).",
      "cues": [
       "list of numbers",
       "lists of numbers",
       "vector",
       "into numbers",
       "become numbers",
       "as numbers",
       "row of numbers",
       "matrix",
       "table of numbers",
       "grid of"
      ]
     },
     {
      "idea": "Multiplying matching numbers and adding them up (the dot product) shows how alike two lists are, that is, whether they point the same way.",
      "cues": [
       "dot product",
       "same direction",
       "point the same",
       "similar",
       "alike",
       "how close",
       "line up",
       "multiply their matching",
       "matching numbers",
       "add them up"
      ]
     },
     {
      "idea": "Multiplying data by a matrix can stretch, turn or squash it, and this one operation is the main work inside neural networks.",
      "cues": [
       "stretch",
       "rotat",
       "squash",
       "squeez",
       "spin",
       "flips",
       "reshape",
       "transform",
       "neural network",
       "layer"
      ]
     },
     {
      "idea": "A derivative is a slope: how much the output changes when you nudge the input a little.",
      "cues": [
       "slope",
       "derivative",
       "rate of change",
       "nudge",
       "small change",
       "how much the output",
       "changes when",
       "steep",
       "how fast",
       "if you raise"
      ]
     },
     {
      "idea": "Gradient descent checks the slope of the error and takes small steps the opposite way, downhill, until the error is as small as possible; steps that are too big overshoot.",
      "cues": [
       "downhill",
       "down the hill",
       "down a hill",
       "gradient descent",
       "small step",
       "little at a time",
       "the bottom",
       "lowest",
       "opposite",
       "other way"
      ]
     }
    ],
    "jargon": [
     "vector",
     "matrix",
     "dot product",
     "linear transformation",
     "determinant",
     "eigenvector",
     "eigenvalue",
     "derivative",
     "partial derivative",
     "gradient",
     "learning rate",
     "chain rule"
    ],
    "model": "Computers only understand numbers, so machine learning turns everything into lists of numbers. A customer might become [spend, visits], like a little profile card, and a photo becomes a big grid of pixel numbers; many such lists stacked together make a table called a matrix. To see whether two customers are alike, we multiply their matching numbers and add them up: a big result means the two lists point in the same direction, like two arrows. Multiplying data by a table of numbers can stretch, turn or squash it, and doing this again and again is the main work inside a neural network. Calculus adds the idea of slope, just like m in y = mx + c: it tells you how much the output changes when you nudge the input a little. To learn, a model checks the slope of its error and takes a small step the opposite way, downhill, again and again, until the error is as small as possible. If the steps are too big, it jumps over the bottom and never settles."
   },
   "socratic": [
    {
     "q": "What is the dot product of [2, 0, 1] and [3, 4, 5], and how is it different from multiplying them element-wise?",
     "hint": "Multiply matching entries first. Then ask: do you stop there, or is there one more step?",
     "answer": "Element-wise multiplication gives [6, 0, 5]; the dot product then adds those up to get 11. A dot product always ends as a single number."
    },
    {
     "q": "Why does a matrix with determinant 0, like [[1, 3], [2, 6]], have no inverse?",
     "hint": "Think about what happens to the area of the grid, and whether the lost information could be recovered.",
     "answer": "Its determinant is 1 × 6 − 3 × 2 = 0, which means the matrix squashes the whole plane onto a line, so area becomes zero. Many different points land on the same spot of that line, so there is no way to tell where each one came from, and the transformation cannot be undone."
    },
    {
     "q": "A grocery delivery app in Pune stores customers as [monthly spend in thousand rupees, visits per month]: Rohan [3, 1], Deepa [5, 2] and Imran [1, 3]. Which customer is most like Rohan, and how would you show it?",
     "hint": "Compare directions, not just sizes: divide each dot product by both lengths.",
     "answer": "Deepa. Rohan·Deepa = 3×5 + 1×2 = 17, and dividing by the lengths √10 ≈ 3.16 and √29 ≈ 5.39 gives about 0.998, almost 1. Rohan·Imran = 3×1 + 1×3 = 6, and dividing by 3.16 and 3.16 gives 0.6. Deepa spends more but shops in almost the same pattern as Rohan, while Imran visits often and spends little."
    },
    {
     "q": "To be safe, a friend sets the learning rate (the step size) very small, say 0.0001. What happens to the error, and why is that also a problem?",
     "hint": "Compare taking tiny steps with taking sensible steps on a long walk down a hill.",
     "answer": "The error still falls, but each step moves the weight only a tiny amount, so it can take many thousands of steps to reach the bottom, which wastes time and computing power; if you stop early, the model is still far from its best. A good learning rate is big enough to make progress but small enough not to overshoot, so people try a few values and watch the error fall."
    },
    {
     "q": "How do the two halves of this module work together when a neural network learns to match faces, as in Video KYC?",
     "hint": "One half moves numbers through the network; the other half decides how to adjust them.",
     "answer": "Linear algebra does the forward work: each layer multiplies vectors by a weight matrix (a table of numbers the model learns), and the final face vectors are compared by a similarity or distance score. Calculus does the learning: the chain rule gives the slope of the error for every weight, and gradient descent nudges each weight downhill. Backpropagation, which you will meet later, is the chain rule applied layer after layer."
    }
   ],
   "nididhyasana": "When you try to get better at something, how do you know which way is downhill, and how big should your next step be?",
   "sravana": [
    "Listen for the picture of a vector as an arrow, and how the speaker shows that the dot product grows when two arrows point the same way.",
    "Listen for how matrix multiplication is built from row-times-column dot products, and why the inner sizes must match.",
    "Listen for the moment a derivative is drawn as the slope of a tangent line, and how gradient descent uses that slope to step downhill."
   ],
   "topics": [
    "vectors and dot products",
    "matrix multiplication",
    "transformations and determinants",
    "eigenvectors",
    "derivatives and chain rule",
    "gradient descent"
   ],
   "quizTags": {
    "l1-linalg-calc-q01": {
     "topic": "vectors and dot products",
     "skill": "apply"
    },
    "l1-linalg-calc-q02": {
     "topic": "vectors and dot products",
     "skill": "apply"
    },
    "l1-linalg-calc-q03": {
     "topic": "derivatives and chain rule",
     "skill": "understand"
    },
    "l1-linalg-calc-q04": {
     "topic": "matrix multiplication",
     "skill": "apply"
    },
    "l1-linalg-calc-q05": {
     "topic": "derivatives and chain rule",
     "skill": "apply"
    },
    "l1-linalg-calc-q06": {
     "topic": "gradient descent",
     "skill": "understand"
    },
    "l1-linalg-calc-q07": {
     "topic": "transformations and determinants",
     "skill": "understand"
    },
    "l1-linalg-calc-q08": {
     "topic": "derivatives and chain rule",
     "skill": "apply"
    },
    "l1-linalg-calc-q09": {
     "topic": "gradient descent",
     "skill": "apply"
    },
    "l1-linalg-calc-q10": {
     "topic": "eigenvectors",
     "skill": "analyse"
    },
    "test-l1-q12": {
     "topic": "gradient descent",
     "skill": "analyse"
    },
    "test-l1-q13": {
     "topic": "matrix multiplication",
     "skill": "apply"
    },
    "test-l1-q14": {
     "topic": "vectors and dot products",
     "skill": "apply"
    }
   }
  },
  "l1-numpy-pandas": {
   "cards": {
    "overview": {
     "recall": "What do NumPy and Pandas each give you for handling data?",
     "answer": "NumPy gives you arrays, grids of numbers you can do maths on all at once instead of looping one by one (vectorisation). Pandas gives you the DataFrame, an Excel-like table inside Python where you can filter, group and total, join tables and pivot with a line or two of code.",
     "why": "Why does cleaning take such a large share of a data project, and what does that tell you about which skills to practise most?",
     "whyAnswer": "Real data arrives messy, with blank cells, repeated rows and dates written in different ways, and any report or model built on it is only as good as that data. So the cleaning skills in this module, handling blanks, removing duplicates and fixing dates, are used in almost every project you will do."
    },
    "outcomes": {
     "recall": "Which three Pandas functions do the outcomes name for a first look at a newly loaded DataFrame?",
     "answer": "head() to see the first rows, info() to see the columns, their types and how many values are filled, and describe() for summary numbers such as the mean, minimum and maximum.",
     "why": "Why should you explain your choice when you handle missing values, instead of just dropping or filling them?",
     "whyAnswer": "Each choice changes the results: dropping rows can throw away much of the data or skew it, and filling blanks with 0 can drag averages down. Writing down why you chose what you did, column by column, lets a client or teammate trust and check the numbers."
    },
    "studySteps": {
     "recall": "Why does the first study step ask you to time a Python loop against a NumPy operation on 10 lakh numbers?",
     "answer": "So you see for yourself how much faster vectorised NumPy maths on a whole array is than a Python loop that handles one number at a time.",
     "why": "Why does the plan ask you to clean one messy real dataset from start to finish, rather than only doing small practice exercises?",
     "whyAnswer": "Real datasets mix many problems at once, such as blanks, duplicates and odd dates, and fixing one can create another, like a merge that adds rows. Doing one full clean-up teaches you the order of steps and the checks, such as df.shape before and after, that small exercises never show."
    },
    "keyTerms": {
     "recall": "What is the difference between groupby and merge in Pandas?",
     "answer": "groupby splits the rows of one table into groups, for example by state, and calculates something for each group, like a total or an average. merge combines two tables using a shared column, like matching orders to customers by customer ID.",
     "why": "In the merge diagram, why does the left merge give four rows when there are only three customers?",
     "whyAnswer": "Asha placed two orders, so she appears on two rows, and Meena placed none but is kept by how='left' with a NaN amount. A merge matches every order to its customer, so the number of rows can change, which is why you check df.shape before and after."
    },
    "indiaExample": {
     "recall": "What are the three steps of groupby when you find the average onion price for each state from mandi data?",
     "answer": "Split the rows into one pile per state, apply the mean to each pile, then combine the answers into one small table with one row per state.",
     "why": "Why would traders and families care about a sudden onion price spike, and how could Agmarknet data reveal one?",
     "whyAnswer": "Convert the date column into real dates, group prices by state and month, and compare each month with the months before; a month far above the usual level is a spike. Traders use such signals to plan buying and selling, and families feel the same spike in their kitchen budget."
    },
    "commonMistakes": {
     "recall": "Why can the date '05-03-2026' be read wrongly, and how do you prevent it in Pandas?",
     "answer": "In India it means 5 March, but a month-first reading turns it into 3 May. Pass format='%d-%m-%Y' (or dayfirst=True) to pd.to_datetime, and check a few rows by eye.",
     "why": "Why is dropping every row that has a missing value risky, even if it makes your code run without complaints?",
     "whyAnswer": "If blanks are spread over many columns you can lose most of your rows, and if blanks are more common in some groups, say rural customers, what remains no longer represents everyone. Counting blanks per column with df.isna().sum() first lets you decide column by column."
    },
    "selfCheck": {
     "recall": "What does the task of adding 18% GST to 1,000 prices without a loop, and counting those above 5,000 rupees, prove you can do?",
     "answer": "It proves you can use vectorisation and broadcasting, multiplying the whole array by 1.18 in one step (the single 1.18 is stretched to match every price), and then count matching items with a True/False mask, such as (final > 5000).sum(), without writing any loop.",
     "why": "Why does the onion task ask for the modal price, the most common trading price, rather than the highest price in each state?",
     "whyAnswer": "The highest price may come from one unusual lot or one odd trade, so it does not show what most buyers paid. The modal price describes a typical trade, much as the median gives a typical salary, which makes it fairer for comparing states."
    }
   },
   "feynman": {
    "prompt": "Explain what NumPy and Pandas do with messy data, and why they beat doing it by hand, to a friend in Kolkata who keeps the accounts of a chain of sweet shops in Excel, in 5-8 sentences, without jargon.",
    "keyIdeas": [
     {
      "idea": "Real data is messy, with blank cells, repeated rows and dates in different formats, and it must be cleaned before you can trust any answer.",
      "cues": [
       "messy",
       "blank",
       "empty",
       "missing",
       "duplicate",
       "twice",
       "repeated",
       "clean",
       "tidy",
       "gaps"
      ]
     },
     {
      "idea": "NumPy does maths on a whole array or column at once, without writing a loop, which is much faster.",
      "cues": [
       "at once",
       "whole column",
       "whole array",
       "every price",
       "all the prices",
       "without a loop",
       "no loop",
       "one go",
       "one at a time",
       "one by one"
      ]
     },
     {
      "idea": "Pandas holds data as a table of rows and named columns, like an Excel sheet inside Python.",
      "cues": [
       "dataframe",
       "rows and columns",
       "named columns",
       "table of rows",
       "like excel",
       "like an excel",
       "google sheet",
       "spreadsheet",
       "inside python",
       "as a table"
      ]
     },
     {
      "idea": "With a line or two you can filter rows, group and total them, and combine two tables using a shared column.",
      "cues": [
       "filter",
       "group by",
       "groupby",
       "only the",
       "for each",
       "each shop",
       "each branch",
       "merge",
       "join",
       "combine"
      ]
     },
     {
      "idea": "A script repeats exactly the same steps on next month's file, giving the report in seconds instead of hours of manual work.",
      "cues": [
       "in seconds",
       "in a minute",
       "instead of hours",
       "next month",
       "every month",
       "every week",
       "same steps",
       "steps once",
       "run it again",
       "script"
      ]
     }
    ],
    "jargon": [
     "array",
     "vectorisation",
     "broadcasting",
     "DataFrame",
     "Series",
     "index",
     "groupby",
     "merge",
     "pivot",
     "NaN",
     "datetime",
     "library"
    ],
    "model": "You know how your monthly Excel sheets arrive messy: some cells are blank, some sales rows are entered twice, and dates are typed in different ways. Pandas is a free Python tool that holds such a sheet as a table of rows and columns inside Python, and it cleans it with a line or two of code for each job: drop the repeated rows, fill or flag the blanks, and read the dates the Indian way, day first. NumPy, its partner, does maths on a whole column at once, so adding GST to 10 lakh prices takes one line and no loop. Then you can filter, say only the Salt Lake branch, group by branch to get each shop's total, and merge two tables, such as sales and the branch list, using a shared shop code. The best part is that it is a script: next month you run the same steps on the new file, and the report is ready in seconds instead of hours."
   },
   "socratic": [
    {
     "q": "What is the difference between a Series and a DataFrame in Pandas?",
     "hint": "Think of one column versus the whole sheet.",
     "answer": "A Series is a single column of values with an index (row labels). A DataFrame is a whole table of named columns that share the same index, so df['price'] gives you one Series."
    },
    {
     "q": "A teacher keeps marks both as a NumPy array and as a plain Python list. Why does adding 5 to the array give every student 5 extra marks, while adding 5 to the list gives an error?",
     "hint": "Which of the two was built for maths on whole grids of numbers?",
     "answer": "A NumPy array applies the operation to every element at once (vectorisation), and the single 5 is broadcast (stretched) to match every mark, so [62, 75, 48] becomes [67 80 53]. A plain list is only a container: + means joining two lists, so adding a number to it raises a TypeError."
    },
    {
     "q": "You have Agmarknet rows of onion modal prices with the columns state, date and price (rupees per quintal). How would you find each state's average price for each month in Pandas?",
     "hint": "First turn the dates into real dates, then decide which columns to group by.",
     "answer": "Convert the dates with pd.to_datetime (stating day first if the text is written that way), add a month column with df['date'].dt.month, then run df.groupby(['state', 'month'])['price'].mean(). A pivot_table with states as rows, months as columns and aggfunc='mean' gives the same numbers as a grid. If the data covers several years, group by year as well, or January of two years will be mixed."
    },
    {
     "q": "After merging an orders table with a customers table, your row count jumps from 1,000 to 1,180. What might have happened, and how would you check?",
     "hint": "What happens to an order when its cust_id matches more than one row on the other side?",
     "answer": "Some cust_id values probably appear more than once in the customers table, for example duplicate customer rows, so each matching order is copied once per match. Check with customers['cust_id'].duplicated().sum(), fix or remove those duplicates, and compare df.shape before and after the merge."
    },
    {
     "q": "How do the Pandas skills in this module connect to the statistics module and to training ML models later?",
     "hint": "Before you can trust a mean or train a model, what state must the table be in?",
     "answer": "Averages, medians and correlations are only trustworthy on clean data with blanks and duplicates handled, and Pandas computes them in one line, such as df['price'].median(). ML models also need a clean table of numbers, so the same cleaning, merging and date skills prepare the inputs for every model in Level 2."
    }
   ],
   "nididhyasana": "Picture a year of a shop's bills in one messy sheet. Which question would you most want it to answer, and which blank cells, repeated rows or odd dates would stand in the way?",
   "sravana": [
    "Listen for why maths on a whole NumPy array is so much faster than a Python loop over the same numbers, and the name the speaker gives this (vectorisation).",
    "Listen for the three steps of groupby, split, apply and combine, and what changes when mean() is swapped for sum() or count().",
    "Listen for how a merge can add rows or create NaN values, and which kind of join, left or inner, the speaker uses each time."
   ],
   "topics": [
    "NumPy arrays and broadcasting",
    "DataFrames and files",
    "filtering and selecting",
    "groupby, merge and pivot",
    "missing values and duplicates",
    "dates and times"
   ],
   "quizTags": {
    "l1-numpy-pandas-q01": {
     "topic": "NumPy arrays and broadcasting",
     "skill": "understand"
    },
    "l1-numpy-pandas-q02": {
     "topic": "DataFrames and files",
     "skill": "remember"
    },
    "l1-numpy-pandas-q03": {
     "topic": "NumPy arrays and broadcasting",
     "skill": "apply"
    },
    "l1-numpy-pandas-q04": {
     "topic": "groupby, merge and pivot",
     "skill": "apply"
    },
    "l1-numpy-pandas-q05": {
     "topic": "missing values and duplicates",
     "skill": "apply"
    },
    "l1-numpy-pandas-q06": {
     "topic": "missing values and duplicates",
     "skill": "apply"
    },
    "l1-numpy-pandas-q07": {
     "topic": "groupby, merge and pivot",
     "skill": "analyse"
    },
    "l1-numpy-pandas-q08": {
     "topic": "filtering and selecting",
     "skill": "analyse"
    },
    "l1-numpy-pandas-q09": {
     "topic": "dates and times",
     "skill": "apply"
    },
    "l1-numpy-pandas-q10": {
     "topic": "NumPy arrays and broadcasting",
     "skill": "analyse"
    },
    "test-l1-q15": {
     "topic": "missing values and duplicates",
     "skill": "analyse"
    },
    "test-l1-q16": {
     "topic": "groupby, merge and pivot",
     "skill": "apply"
    },
    "test-l1-q17": {
     "topic": "filtering and selecting",
     "skill": "apply"
    }
   }
  },
  "l1-eda-viz-sql": {
   "cards": {
    "overview": {
     "recall": "What is EDA, and what are you hunting for when you do it?",
     "answer": "Exploratory data analysis means getting to know your data before you trust it, using summaries and charts, like a doctor's check-up before a prescription. You hunt for patterns, errors and outliers (values far away from the rest).",
     "why": "How would a client's decision change if you skipped EDA and the order values included a few test orders of 1 rupee?",
     "whyAnswer": "The fake 1-rupee orders would drag down the average order value and could make a city or product look weaker than it is, so the client might cut spending in the wrong place. A quick histogram or box plot during EDA would have shown those odd values before any report went out."
    },
    "outcomes": {
     "recall": "By the IQR rule in the outcomes, which values are flagged as outliers?",
     "answer": "Values more than 1.5 × the IQR (the spread of the middle 50% of values) below the first quartile, or more than 1.5 × the IQR above the third quartile.",
     "why": "Why should a data story end with one clear recommendation rather than a list of every finding?",
     "whyAnswer": "A busy client acts on a clear message, not on twenty charts. One recommendation, backed by a couple of charts and a rough rupee estimate, makes it obvious what to do next and why, while a long list leaves the hard thinking to them."
    },
    "studySteps": {
     "recall": "What does the study plan ask you to add to every chart you recreate?",
     "answer": "A title, axis labels and units, such as rupees, percentages or dates.",
     "why": "Why is practising SQL in SQLite in your browser useful, when most company data sits in large database systems?",
     "whyAnswer": "SQL is a standard language, so SELECT, WHERE, GROUP BY and JOIN work almost the same way in SQLite as in the big databases companies use, with small differences in some functions. SQLite needs no setup, so you can practise the core ideas safely now and use them at work later."
    },
    "keyTerms": {
     "recall": "What is the difference between a histogram and a box plot?",
     "answer": "A histogram is a bar chart of how many values fall into each range, so it shows a column's distribution. A box plot shows the median, the quartiles (the 25% and 75% marks) and the outliers in one picture.",
     "why": "In the delivery example, why is the 2-minute delivery fixed but the 74-minute one kept, when both fall outside the fences?",
     "whyAnswer": "The IQR rule only flags values; it cannot say why they are odd. Checking showed the 2-minute delivery was an error (the rider tapped delivered at the restaurant), while the 74-minute one really happened in heavy rain, so it is true information about real delays."
    },
    "indiaExample": {
     "recall": "What is PhonePe Pulse, and what kind of data does it contain?",
     "answer": "An open dataset that PhonePe publishes on GitHub, with anonymised, aggregated digital-payment data such as transaction counts, amounts and user numbers, for India, each state and each district, by quarter, in JSON files.",
     "why": "Why does it matter that PhonePe Pulse data is anonymised and aggregated before it is shared openly?",
     "whyAnswer": "Totals for states and districts show the patterns without revealing any single person's payments, so the data can be shared without exposing private details. This links back to the privacy ideas in the first module: useful analysis often needs only totals, not personal data."
    },
    "commonMistakes": {
     "recall": "Why can WHERE not filter on SUM(amount) in SQL, and what should you use instead?",
     "answer": "WHERE filters single rows before GROUP BY makes the groups, so no totals exist yet. Use HAVING after GROUP BY, for example HAVING SUM(amount) > 100000, to filter whole groups by their totals.",
     "why": "Why should the y-axis of a bar chart start at zero?",
     "whyAnswer": "Readers compare bars by their length. If the axis starts at 90, a bar for 95 looks twice as tall as a bar for 92.5, so a small difference looks huge and a client could be misled even though every number is correct."
    },
    "selfCheck": {
     "recall": "What does answering the same question once with Pandas groupby and once with SQL GROUP BY prove you can do?",
     "answer": "It proves you can do the same analysis in both tools and cross-check your work: if the numbers match you can trust them, and if they differ you have found a mistake to fix.",
     "why": "Why does the one-page report ask for a rough rupee estimate of the recommended action's impact, and how you worked it out?",
     "whyAnswer": "A client decides by weighing cost against benefit, so a rupee figure turns a finding into a business case. Showing how you worked it out lets them check your assumptions and trust the number instead of taking it on faith."
    }
   },
   "feynman": {
    "prompt": "Explain how you would get to know a new sales dataset and turn it into advice, using checks, charts and SQL, to a friend who runs three bakeries in Hyderabad, in 5-8 sentences, without jargon.",
    "keyIdeas": [
     {
      "idea": "Before trusting the data, give it a check-up: look at each column, then pairs of columns, to find blanks, mistakes and patterns.",
      "cues": [
       "check-up",
       "first look",
       "before trusting",
       "before you trust",
       "before believing",
       "get to know",
       "explor",
       "column by column",
       "each column",
       "missing value"
      ]
     },
     {
      "idea": "Charts make patterns visible, and each question needs the right chart: a histogram for spread, a bar chart to compare, a line chart over time, a scatter for two numbers together.",
      "cues": [
       "bar chart",
       "line chart",
       "bar graph",
       "line graph",
       "histogram",
       "scatter",
       "plot",
       "a graph",
       "bars",
       "over time"
      ]
     },
     {
      "idea": "Outliers are values far from the rest; some are errors and some are real, so check each one before removing anything.",
      "cues": [
       "outlier",
       "odd value",
       "unusual",
       "far from the rest",
       "mistake or",
       "error or",
       "genuine",
       "real or",
       "before deleting",
       "before removing"
      ]
     },
     {
      "idea": "SQL is a language for asking questions of data in a database, such as filtering rows, totalling by group and joining tables.",
      "cues": [
       "database",
       "query",
       "queries",
       "ask the database",
       "total per",
       "total for",
       "per bakery",
       "by branch",
       "group by",
       "questions of"
      ]
     },
     {
      "idea": "The findings become a short story with one clear recommendation the owner can act on.",
      "cues": [
       "a story",
       "data story",
       "recommend",
       "one clear",
       "headline",
       "what to do",
       "one page",
       "one-page",
       "act on",
       "suggest"
      ]
     }
    ],
    "jargon": [
     "EDA",
     "univariate",
     "bivariate",
     "multivariate",
     "histogram",
     "box plot",
     "outlier",
     "IQR",
     "quartile",
     "SQL",
     "JOIN",
     "window function"
    ],
    "model": "Before trusting any numbers, I would give your sales data a check-up, the way a doctor examines you before writing a prescription. First I look at each column on its own, then at pairs of columns, hunting for blank cells, mistakes and patterns. Charts make this easy to see: a line chart shows how sales changed month by month, a bar chart compares your three bakeries, and a scatter plot shows whether more advertising goes with more sales. I would also look for outliers, values far from the rest, like one 50,000-rupee order. Some are mistakes, such as a typo, but some are real, like a big wedding cake order, so I check each one before removing anything. If the sales sit in a database, I use SQL, a simple language for asking it questions, such as the total per bakery or which cakes sell best at weekends. Finally, I turn it all into a one-page story with one clear recommendation, like moving evening staff to the busiest branch."
   },
   "socratic": [
    {
     "q": "Which chart would you pick to see how 3,000 restaurant bill amounts are spread out, and which to show a shop's sales over 12 months?",
     "hint": "One question is about one column on its own; the other is about change over time.",
     "answer": "A histogram for the bill amounts, because it counts how many bills fall into each range, such as 0 to 200 rupees or 200 to 400 rupees. A line chart for the sales over the months, because it shows change over time."
    },
    {
     "q": "A database does not run a query in the order you write it. In what order does it run the parts, and why can ORDER BY use the name total while WHERE cannot use SUM(amount)?",
     "hint": "Ask which step runs first, and at which step the totals are made.",
     "answer": "The database runs FROM and JOIN first, then WHERE on single rows, then GROUP BY makes the totals, then HAVING, then SELECT gives them the name total, and ORDER BY runs last. So when WHERE runs, no totals or names exist yet, but by the time ORDER BY runs, both do."
    },
    {
     "q": "A food-delivery team in Bengaluru finds Q1 = 25 and Q3 = 35 minutes for its delivery times. Where are the IQR fences, and what would you do with a 4-minute and a 65-minute delivery?",
     "hint": "Work out the IQR, multiply it by 1.5, then move that far outside the box on each side.",
     "answer": "The IQR is 35 − 25 = 10, so the fences are 25 − 15 = 10 and 35 + 15 = 50 minutes, and both deliveries are flagged. The rule only flags them, so check the records: a 4-minute delivery is probably an error, like a rider marking it delivered too early, so fix or remove it; a 65-minute one may be real, for example in heavy rain, so keep it and note why."
    },
    {
     "q": "A scatter plot shows that bakery branches with more staff have higher sales. The owner wants to hire more staff everywhere. What would you check first?",
     "hint": "Remember the umbrellas and dengue example from the statistics module.",
     "answer": "A chart of two columns moving together shows correlation, not cause: busy branches in busy areas may have been given more staff because they already sell more. Check a hidden factor such as footfall or location, compare branches of similar size, or add staff in a few branches first and measure the change."
    },
    {
     "q": "How do EDA and SQL connect to building ML models in Level 2?",
     "hint": "What has to be true about the data before a model can learn useful patterns from it?",
     "answer": "A model learns from whatever data it is given, so EDA finds the errors, blanks, odd values and lopsided groups that would teach it wrong patterns. SQL is often how you pull the training data out of company databases in the first place, and clear charts help you explain the model's results to a client."
    }
   ],
   "nididhyasana": "Before you trust a number someone shows you, what is the one question you would most want to ask about where it came from?",
   "sravana": [
    "Listen for how the speaker moves from univariate to bivariate to multivariate analysis, and which chart is used at each stage.",
    "Listen for how the IQR fences are worked out, Q1 − 1.5 × IQR and Q3 + 1.5 × IQR, and whether the flagged values are removed or investigated.",
    "Listen for the difference between WHERE and HAVING in the SQL lessons, and the moment a LEFT JOIN keeps rows that have no match."
   ],
   "topics": [
    "EDA workflow",
    "multivariate analysis",
    "choosing charts",
    "outliers and IQR",
    "SQL filtering and grouping",
    "SQL joins and windows",
    "data storytelling"
   ],
   "quizTags": {
    "l1-eda-viz-sql-q01": {
     "topic": "choosing charts",
     "skill": "understand"
    },
    "l1-eda-viz-sql-q02": {
     "topic": "EDA workflow",
     "skill": "understand"
    },
    "l1-eda-viz-sql-q03": {
     "topic": "SQL filtering and grouping",
     "skill": "remember"
    },
    "l1-eda-viz-sql-q04": {
     "topic": "choosing charts",
     "skill": "apply"
    },
    "l1-eda-viz-sql-q05": {
     "topic": "outliers and IQR",
     "skill": "apply"
    },
    "l1-eda-viz-sql-q06": {
     "topic": "SQL filtering and grouping",
     "skill": "apply"
    },
    "l1-eda-viz-sql-q07": {
     "topic": "data storytelling",
     "skill": "apply"
    },
    "l1-eda-viz-sql-q08": {
     "topic": "SQL joins and windows",
     "skill": "analyse"
    },
    "l1-eda-viz-sql-q09": {
     "topic": "SQL joins and windows",
     "skill": "analyse"
    },
    "l1-eda-viz-sql-q10": {
     "topic": "multivariate analysis",
     "skill": "analyse"
    },
    "test-l1-q18": {
     "topic": "SQL filtering and grouping",
     "skill": "analyse"
    },
    "test-l1-q19": {
     "topic": "outliers and IQR",
     "skill": "apply"
    },
    "test-l1-q20": {
     "topic": "SQL joins and windows",
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
     "whyAnswer": "Guessing first makes you think for yourself instead of just listening. You then notice the gap between your guess and the real explanation, and noticing that gap helps the correct idea stick. So even a wrong guess is useful."
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
     "whyAnswer": "A random shuffle puts orders from the same days, and from later weeks, into training, so the model already knows about things like one particular rainy evening's traffic or a new restaurant's speed. In real use it never sees the future. Training on older weeks and testing on the newest ones copies real life, so the score is honest."
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
       "pattern",
       "past example",
       "old example",
       "past record",
       "past paper",
       "question paper",
       "previous",
       "know the answer",
       "right answer",
       "solved"
      ]
     },
     {
      "idea": "Some examples must be kept aside and never shown during learning, so the final check is on examples it has never seen, used only once at the end.",
      "cues": [
       "never seen",
       "not seen",
       "hasn't seen",
       "unseen",
       "hide",
       "hidden",
       "aside",
       "hold back",
       "held back",
       "test it on new"
      ]
     },
     {
      "idea": "Memorising the practice examples (overfitting) looks brilliant in practice but fails on new questions.",
      "cues": [
       "memoris",
       "memoriz",
       "by heart",
       "mug up",
       "mugs up",
       "mugging",
       "cram",
       "overfit",
       "just remember",
       "only remember"
      ]
     },
     {
      "idea": "A model that is too simple (underfitting) does badly even on the examples it practised on.",
      "cues": [
       "too simple",
       "underfit",
       "barely stud",
       "too little",
       "learn enough",
       "lazy",
       "even in practice",
       "even on the old",
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
       "come after",
       "in advance",
       "only use",
       "at the moment"
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
     "q": "A used-bike dealer in Kochi wants to predict a bike's resale price from its age, kilometres driven and engine size. Which of these are features and which is the label?",
     "hint": "One of them is the answer you want to predict; the others are the clues you already have before you know it.",
     "answer": "Age, kilometres driven and engine size are features, the inputs the model uses. The resale price is the label, the value the model learns to predict."
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
     "q": "Module 2.4, Model Evaluation & Tuning, teaches ways to score a model beyond accuracy. Using the 'always say no' baseline, why is accuracy alone not enough when you hunt for rare cases such as fraud?",
     "hint": "Count how many of the rare cases the 'always no' baseline actually finds.",
     "answer": "The 'always no' baseline finds zero rare cases yet can score 95% accuracy, so accuracy can look high while the model is useless for the job. You need scores that look directly at the rare class: recall (of all the real frauds, how many were caught) and precision (of all the cases flagged as fraud, how many really were fraud). Module 2.4 teaches both."
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
     "whyAnswer": "'Off by about ₹40,000 on average' is the MAE, and it is in rupees, the unit the dealer already thinks in, so they can judge at once whether that is acceptable for a car. MSE is in squared rupees, a unit nobody can picture. Explaining errors in ₹ terms lets a client make real business decisions."
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
     "whyAnswer": "Under the Delhi-NCR age limit on this card, a diesel car with one year left can be used there for far less time than one with eight years left, and buyers pay for that use. A linear model cannot easily work this out from year, fuel type and city separately. Building the feature yourself hands it this local knowledge directly, and you would update it whenever the rules change."
    },
    "commonMistakes": {
     "recall": "What goes wrong when the learning rate is too large, and what does the module suggest you do?",
     "answer": "Each step overshoots the lowest point, so the loss grows or turns into NaN (not a number). Divide the learning rate by 10 and try again.",
     "why": "Why does a feature measured in lakhs of rupees cause trouble for Ridge or Lasso when another feature is measured in years, unless you scale first?",
     "whyAnswer": "The penalty looks at the size of the weights. A feature in lakhs needs only a tiny weight, while a feature in years needs a much bigger weight for the same effect, so the penalty unfairly punishes the years feature. Scaling puts all features on a similar range, so the penalty is fair and gradient descent also trains faster."
    },
    "selfCheck": {
     "recall": "What does the synthetic ride-fare task, where you write gradient descent without scikit-learn, prove you can do?",
     "answer": "It proves you can write the gradient descent loop yourself in NumPy and check that it works: the learned intercept and weight come out close to 30 and 15, the true values used to create the data.",
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
       "old ride",
       "old trip",
       "past ride",
       "past trip",
       "previous",
       "earlier ride",
       "earlier trip",
       "of rides",
       "of trips",
       "rides with"
      ]
     },
     {
      "idea": "It looks for the straight line that best fits those rides: a starting amount plus a fixed number of rupees for every kilometre.",
      "cues": [
       "straight line",
       "a line",
       "the line",
       "formula",
       "per km",
       "per kilomet",
       "each kilomet",
       "every kilomet",
       "each km",
       "base fare"
      ]
     },
     {
      "idea": "It measures how wrong the line is by looking at the gaps between its guessed fares and the real fares, with big misses counting extra.",
      "cues": [
       "how wrong",
       "is wrong",
       "was wrong",
       "far off",
       "gap",
       "misses",
       "error",
       "difference",
       "mistake",
       "compare"
      ]
     },
     {
      "idea": "It improves by nudging the line a little at a time in the direction that makes the total miss smaller, repeating until it stops improving.",
      "cues": [
       "slightly",
       "bit by bit",
       "step by step",
       "small step",
       "nudge",
       "tweak",
       "adjust",
       "repeat",
       "again and again",
       "line a little"
      ]
     },
     {
      "idea": "The size of each nudge matters: too small takes forever, too big jumps past the best line.",
      "cues": [
       "too big",
       "too large",
       "too small",
       "big step",
       "huge step",
       "tiny step",
       "overshoot",
       "goes past",
       "going past",
       "jump"
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
  },
  "l2-classification": {
   "cards": {
    "overview": {
     "recall": "How is classification different from regression, and what does a decision boundary show?",
     "answer": "Classification predicts a category, such as spam or not spam, while regression predicts a number. The decision boundary is the line or curve where the prediction switches from one class to another.",
     "why": "How is a mango trader sorting fruit into 'export quality' and 'local market' like a classifier, and what plays the role of the features?",
     "whyAnswer": "The trader looks at each mango's size, colour and firmness and puts it into one of two groups, using a rule learnt from years of experience. A classifier learns the same kind of rule from past labelled examples. Size, colour and firmness are the features, and 'export' or 'local' is the class it predicts."
    },
    "outcomes": {
     "recall": "According to the outcomes, which two classifiers need their features scaled, and what must you choose sensibly for KNN?",
     "answer": "KNN and SVM need scaled features, and for KNN you must choose a sensible k, the number of nearest examples that vote.",
     "why": "Why would a method that measures the distance between customers give strange answers if one column is income in rupees and another is age in years?",
     "whyAnswer": "Income gaps run into thousands or lakhs of rupees, while age gaps are a few dozen years, so the distance is decided almost entirely by income. Two people of very different ages can look like close neighbours just because their incomes match. Scaling puts both columns on a similar range, so each one counts fairly."
    },
    "studySteps": {
     "recall": "In the KNN lab, what happens to the decision boundary as you change k from 1 to a large value?",
     "answer": "With k = 1 the boundary is jagged, which is overfitting. As k grows very large it becomes over-smooth, which is underfitting.",
     "why": "Asking only one neighbour for advice is risky, and asking the whole city is useless. How does this match k = 1 and a very large k in KNN?",
     "whyAnswer": "One neighbour may be odd or simply wrong, and with k = 1 that single example decides everything near it, so the model follows noise. If you ask the whole city, local knowledge is drowned out and you just hear the most common opinion, so a huge k predicts the majority class almost everywhere. A middle k listens to the neighbourhood without being fooled by one odd point."
    },
    "keyTerms": {
     "recall": "What does the sigmoid do, and how does the threshold turn its output into a yes or no?",
     "answer": "The sigmoid squeezes any score into a value between 0 and 1 that can be read as a probability. If that probability is above the threshold (0.5 by default), the model says 'yes'.",
     "why": "Why is Naive Bayes still useful for spam filtering even though the words in an SMS are clearly not independent of each other?",
     "whyAnswer": "The independence assumption is wrong in detail, but the filter only needs 'spam' to come out ahead of 'not spam', not perfect probabilities. Words such as 'KYC', 'click' and 'link' each push the score towards spam, and combining those pushes is usually enough to sort messages correctly. It is also very fast to train, even on thousands of messages."
    },
    "indiaExample": {
     "recall": "What kind of ML problem is Airtel's 'Suspected Spam' system, and which signals does it use?",
     "answer": "It is binary classification: each call or SMS is sorted into spam or not spam, using signals such as how often a number calls or messages and how long its calls last.",
     "why": "Why does a mistake in either direction cost something for a spam-call filter, and how would you decide which mistake is worse?",
     "whyAnswer": "If a genuine call, say from a hospital or a delivery agent, is marked as spam, the customer may ignore it and be annoyed. If a scam call is not marked, the customer may lose money. You compare what each mistake costs in real life, then choose a probability threshold that keeps the more expensive mistake rare."
    },
    "commonMistakes": {
     "recall": "Why should you look at predict_proba() and not only at predict()?",
     "answer": "predict_proba() gives the probability behind each prediction, so you can rank customers and choose your own threshold instead of the fixed 0.5 cut-off.",
     "why": "Why does running value_counts() on the label first protect you from being fooled by accuracy?",
     "whyAnswer": "It shows how many examples each class has. If 95% of the rows are one class, a model that always predicts that class gets 95% accuracy while being useless. Knowing this, you will not trust accuracy alone and will check better measures, which the next module covers."
    },
    "selfCheck": {
     "recall": "What does the make_moons self-check prove you can explain about logistic regression and an SVM with an RBF kernel?",
     "answer": "It proves you can plot decision boundaries and explain why logistic regression draws a straight boundary, while an RBF-kernel SVM can draw a curved one that follows the moon shapes.",
     "why": "In the sigmoid task you get about 0.12, 0.50 and 0.88. How would you explain to a shopkeeper what 0.88 means for an SMS spam filter?",
     "whyAnswer": "It means the filter is fairly sure: it gives this message roughly an 88% chance of being spam. With the usual 0.5 cut-off it would be marked as spam. But some doubt remains, so an important-looking message might still deserve a quick second look."
    }
   },
   "feynman": {
    "prompt": "Explain how a computer can decide whether an SMS is a scam or a normal message, to your aunt who runs a kirana shop and keeps getting 'KYC pending' messages. Use 5-8 sentences and no jargon.",
    "keyIdeas": [
     {
      "idea": "The computer sorts each message into a category (scam or normal) instead of predicting a number like a price.",
      "cues": [
       "sort",
       "categor",
       "classif",
       "one of two",
       "two classes",
       "scam or",
       "fraud or",
       "spam or",
       "or normal",
       "or safe"
      ]
     },
     {
      "idea": "It learns from many past messages that people have already marked as scam or normal.",
      "cues": [
       "marked",
       "labelled",
       "labeled",
       "tagged",
       "reported",
       "old message",
       "past message",
       "earlier message",
       "previous message",
       "already know"
      ]
     },
     {
      "idea": "It looks for clues in the message, such as words like 'KYC', 'click' or 'link', or a number that sends huge numbers of messages.",
      "cues": [
       "clue",
       "hint",
       "signs",
       "words like",
       "word like",
       "link",
       "click",
       "urgent",
       "otp",
       "prize"
      ]
     },
     {
      "idea": "It gives each message a chance of being a scam, and if that chance is above a chosen cut-off it calls it a scam.",
      "cues": [
       "chance",
       "probabil",
       "percent",
       "odds",
       "how sure",
       "out of 100",
       "0 to 1",
       "cut-off",
       "cut off",
       "threshold"
      ]
     },
     {
      "idea": "It can be wrong in two ways, blocking a genuine message or letting a scam through, so the cut-off is chosen with both costs in mind.",
      "cues": [
       "both ways",
       "two ways",
       "wrongly",
       "by mistake",
       "slip through",
       "get past",
       "gets past",
       "gets through",
       "real message",
       "how strict"
      ]
     }
    ],
    "jargon": [
     "classification",
     "classifier",
     "sigmoid",
     "logistic regression",
     "probability",
     "threshold",
     "decision boundary",
     "KNN",
     "Naive Bayes",
     "SVM",
     "kernel",
     "feature"
    ],
    "model": "Your phone can learn to spot scam messages the way you learnt to spot a fake note. First, someone collects thousands of old messages that are already marked as 'scam' or 'normal'. The computer studies them and notices clues: scams often have words like 'KYC pending', 'click this link' or 'you have won a prize', and they often come from numbers that send hundreds of messages a day. When a new SMS arrives, it checks these clues and gives the message a score, like a chance out of 100 that it is a scam. If the chance is above a cut-off, say 50, it puts the message in the scam group; otherwise it goes in the normal group. So the computer is not predicting a number like a price; it is sorting each message into one of two boxes. It can still be wrong in two ways: it may block a genuine message from your bank, or let a real scam slip through. That is why the cut-off is chosen carefully, depending on which mistake hurts more."
   },
   "socratic": [
    {
     "q": "What is the sigmoid of a score of 0, and what does that mean with the default threshold of 0.5?",
     "hint": "Look at the exact middle of the S-shaped curve.",
     "answer": "The sigmoid of 0 is exactly 0.5, the default threshold, so a score of 0 is the switching point. Positive scores give probabilities above 0.5 (the model says 'yes') and negative scores give probabilities below 0.5 (it says 'no')."
    },
    {
     "q": "Why does KNN do almost no work during training, and where does all its real work happen?",
     "hint": "Think about what KNN must look at every time a new point arrives.",
     "answer": "KNN simply stores the training examples. All the work happens at prediction time: it measures the distance from the new point to the stored examples, finds the k nearest and takes a vote. So training is instant, but predictions can be slow on very large datasets."
    },
    {
     "q": "A Kerala seafood exporter sorts shipments into 'fresh', 'acceptable' and 'reject' using logistic regression with one-vs-rest. How many yes/no classifiers are trained, and how is the final class chosen?",
     "hint": "Ask what each yes/no model in one-vs-rest compares a class against, and how many classes there are.",
     "answer": "Three classifiers are trained: fresh versus the rest, acceptable versus the rest, and reject versus the rest. Each gives a confidence for its own class, and the class whose classifier is most confident becomes the prediction."
    },
    {
     "q": "Naive Bayes assumes the features are independent within each class. Which two columns in a loan dataset would clearly break this, and what could go wrong?",
     "hint": "Look for two columns that carry almost the same information.",
     "answer": "Monthly salary and annual salary, for example, say almost the same thing. Naive Bayes would count that evidence twice, so its probabilities become over-confident. Its choice of class can still be reasonable, but the probabilities should not be trusted as exact."
    },
    {
     "q": "How is logistic regression related to linear regression from module 2.2?",
     "hint": "Look at what logistic regression computes before the sigmoid is applied.",
     "answer": "Both first compute a weighted sum of the features plus an intercept. Linear regression stops there and outputs that number, while logistic regression passes it through the sigmoid to get a probability between 0 and 1 and then applies a threshold to choose a class. In both, the weights are found by making a cost as small as possible."
    }
   ],
   "nididhyasana": "Every classifier draws a boundary somewhere. When a real customer sits right on that line, what does it mean to say the model knows which side they belong to?",
   "sravana": [
    "In the logistic regression video, listen for why a plain linear regression output cannot be used as a probability, and how the sigmoid fixes this.",
    "In the KNN video, listen for how distance between points is measured, and what happens to predictions when k is very small or very large.",
    "In the SVM video, listen for what the margin and the support vectors are, and how a kernel lets the boundary curve."
   ],
   "topics": [
    "logistic regression",
    "k-nearest neighbours",
    "naive bayes",
    "svm and kernels",
    "multiclass classification",
    "feature scaling",
    "decision boundaries"
   ],
   "quizTags": {
    "l2-classification-q01": {
     "topic": "logistic regression",
     "skill": "remember"
    },
    "l2-classification-q02": {
     "topic": "k-nearest neighbours",
     "skill": "remember"
    },
    "l2-classification-q03": {
     "topic": "naive bayes",
     "skill": "understand"
    },
    "l2-classification-q04": {
     "topic": "feature scaling",
     "skill": "apply"
    },
    "l2-classification-q05": {
     "topic": "svm and kernels",
     "skill": "apply"
    },
    "l2-classification-q06": {
     "topic": "naive bayes",
     "skill": "apply"
    },
    "l2-classification-q07": {
     "topic": "multiclass classification",
     "skill": "understand"
    },
    "l2-classification-q08": {
     "topic": "logistic regression",
     "skill": "apply"
    },
    "l2-classification-q09": {
     "topic": "k-nearest neighbours",
     "skill": "apply"
    },
    "l2-classification-q10": {
     "topic": "decision boundaries",
     "skill": "analyse"
    },
    "test-l2-q15": {
     "topic": "feature scaling",
     "skill": "analyse"
    },
    "test-l2-q20": {
     "topic": "svm and kernels",
     "skill": "analyse"
    }
   }
  },
  "l2-metrics-tuning": {
   "cards": {
    "overview": {
     "recall": "In the airport metal detector picture, what are the two kinds of mistakes, and what does the threshold control?",
     "answer": "Beeping for a harmless belt buckle is a false alarm, and letting a real threat pass is a miss. The threshold is the sensitivity knob that trades one kind of mistake for the other.",
     "why": "Why should the threshold for a fraud alert be chosen from what each mistake costs in ₹, instead of being left at 0.5?",
     "whyAnswer": "The two mistakes rarely cost the same: a missed fraud can lose thousands of rupees, while a false alarm may cost only a short support call. A 0.5 threshold quietly treats them as equal. Choosing the threshold with the lowest total ₹ cost fits the model to the real business."
    },
    "outcomes": {
     "recall": "According to the outcomes, what should guide your choice of decision threshold, and what do you use to compare models across all thresholds?",
     "answer": "Choose the threshold that keeps the total ₹ cost of errors lowest. Compare models across all thresholds with ROC-AUC and precision-recall curves.",
     "why": "Why does the last outcome ask you to explain your metric choice to a non-technical client, and how might you explain recall to a shop owner?",
     "whyAnswer": "The client pays for the model and must trust its trade-offs, so the metric has to make sense in their terms. You might say recall means 'out of all the customers who were really going to stop buying, how many our model warned you about'. Once the client understands this, they can tell you which mistake hurts them more."
    },
    "studySteps": {
     "recall": "In the Threshold lab, which point are you asked to find as you move the threshold?",
     "answer": "The point where catching more positives starts creating too many false alarms.",
     "why": "Why do the study steps ask you to calculate each metric on paper before you rely on code?",
     "whyAnswer": "Working out precision and recall by hand from the four counts shows you exactly which cells of the confusion matrix each one uses. A number printed by a library is then no longer a mystery, and you can spot slips such as mixing up precision and recall. It also makes quick ₹ cost sums easy in client meetings."
    },
    "keyTerms": {
     "recall": "What is the difference between precision and recall?",
     "answer": "Precision is the share of everything the model flagged as positive that really was positive. Recall is the share of all real positives that the model managed to catch.",
     "why": "How does cross-validation give a steadier score than a single train/test split, much like judging a batsman on several innings instead of one?",
     "whyAnswer": "One split is like one innings: a lucky or unlucky set of rows can make a model look much better or worse than it really is. Cross-validation scores the model on k different parts and averages the results, so the luck evens out. The spread of the k scores also tells you how far to trust the average."
    },
    "indiaExample": {
     "recall": "Why is accuracy useless for RBI's MuleHunter.AI, and which two measures must a bank balance?",
     "answer": "Mule accounts are a tiny share of all accounts, so a model that flags none of them still looks highly accurate. A bank must balance recall (catching as many mule accounts as possible) against precision (not freezing honest customers' accounts by mistake).",
     "why": "How would a bank's choice of threshold change if freezing an honest customer's account led to many complaints and bad news coverage?",
     "whyAnswer": "False alarms would become much more expensive, so the bank would raise the threshold and flag fewer accounts, keeping precision high. It would then catch fewer mule accounts, so recall would fall. The right setting comes from comparing what each of the two mistakes costs."
    },
    "commonMistakes": {
     "recall": "What goes wrong if you apply SMOTE before splitting the data or before cross-validation?",
     "answer": "Synthetic rows built from validation or test rows end up in training, so the model is scored on near-copies of what it learnt and the score looks better than it really is. SMOTE should run inside an imbalanced-learn Pipeline, only on the training folds.",
     "why": "How is checking the test set after every change like a student who keeps re-taking the same mock paper until the marks look good?",
     "whyAnswer": "After enough attempts the student knows that paper's questions, so a high mark no longer shows how they will do in the real exam. Tuning against the test set works the same way: settings get kept because they suit those particular rows. Tune with cross-validation and look at the test set only once, at the end."
    },
    "selfCheck": {
     "recall": "What does the ₹ cost threshold self-check prove you can do?",
     "answer": "It proves you can turn a model's probabilities into decisions at many thresholds, add up the ₹ cost of missed frauds and false alarms at each one, and report the cheapest threshold.",
     "why": "In the paper task, precision is 30% and recall is 60%. Why is the F1 of 40% closer to the lower number than the simple average of 45%?",
     "whyAnswer": "F1 is the harmonic mean, which is pulled towards the smaller of the two values. This stops a model from hiding a very poor precision or recall behind a good one. A model has to be decent at both to earn a high F1."
    }
   },
   "feynman": {
    "prompt": "Explain how you would judge whether a fraud-alert system for UPI payments is really any good, to a friend who runs a small chemist shop and accepts UPI. Use 5-8 sentences and no jargon.",
    "keyIdeas": [
     {
      "idea": "Just counting how often the system is right is misleading when fraud is rare, because a system that never raises an alarm is almost always right.",
      "cues": [
       "rare",
       "uncommon",
       "very few",
       "hardly any",
       "hardly ever",
       "one in a",
       "99 of",
       "99 out of",
       "always right",
       "never raises"
      ]
     },
     {
      "idea": "There are two kinds of mistakes: false alarms on honest payments, and real frauds that are missed.",
      "cues": [
       "false alarm",
       "honest",
       "innocent",
       "genuine",
       "good customer",
       "regular customer",
       "missed",
       "miss a",
       "slip through",
       "gets past"
      ]
     },
     {
      "idea": "One question is: of all the alarms it raised, how many were really fraud?",
      "cues": [
       "precision",
       "of the alarms",
       "of its alarms",
       "alarms it raised",
       "alarms were",
       "it blocked",
       "it flagged",
       "it stopped",
       "when it raises",
       "when it says"
      ]
     },
     {
      "idea": "The other question is: of all the real frauds, how many did it catch?",
      "cues": [
       "catch",
       "caught",
       "all the fraud",
       "all the real",
       "real frauds",
       "did it spot",
       "spotted",
       "detect",
       "recall",
       "warned about"
      ]
     },
     {
      "idea": "Its strictness can be turned up or down, and the best setting is the one where the total cost of both mistakes in rupees is lowest.",
      "cues": [
       "cost",
       "rupee",
       "loss",
       "lose money",
       "hurts more",
       "strict",
       "sensitiv",
       "relaxed",
       "lenient",
       "threshold"
      ]
     }
    ],
    "jargon": [
     "accuracy",
     "confusion matrix",
     "precision",
     "recall",
     "F1",
     "ROC-AUC",
     "threshold",
     "false positive",
     "false negative",
     "cross-validation",
     "SMOTE",
     "hyperparameter"
    ],
    "model": "Imagine the system watches every UPI payment to your shop and raises an alarm when it smells fraud. Simply asking 'how often is it right?' fools you, because fraud is rare: a lazy system that never raises an alarm would still be right on 99 of every 100 payments, yet catch nothing. So count its mistakes in two kinds. First, false alarms: honest payments it wrongly stops, which annoy your customers. Second, real frauds that slip through and cost you money. Then ask two questions. Of all the alarms it raised, how many were really fraud? And of all the real frauds, how many did it catch? You can make the system stricter or more relaxed, like the sensitivity of an airport metal detector, and each setting trades one kind of mistake for the other. The best setting is the one where the total cost in rupees, missed frauds plus the trouble of false alarms, is the lowest."
   },
   "socratic": [
    {
     "q": "A model flags 40 loan applicants as likely defaulters. 10 of them really default, and there were 25 defaulters in total. What are its precision and recall?",
     "hint": "Precision divides by what the model flagged; recall divides by what was really there.",
     "answer": "Precision = 10 / 40 = 25%, because only 10 of its 40 flags were right. Recall = 10 / 25 = 40%, because it caught 10 of the 25 real defaulters."
    },
    {
     "q": "Why does lowering the threshold usually raise recall but lower precision?",
     "hint": "Think about how many cases get flagged when the bar is lower, and what those extra cases are.",
     "answer": "A lower threshold flags more cases. Some of the extra ones are real positives, so more positives are caught and recall rises. Many of the extra ones are negatives, so false alarms grow and precision falls."
    },
    {
     "q": "A Bengaluru edtech company calls every lead its model scores above a threshold. A call costs ₹50, and a lead who joins brings in ₹4,000. Why might a fairly low threshold make sense?",
     "hint": "Compare the price of a wasted call with the money lost by never calling someone who would have joined.",
     "answer": "Not calling a lead who would have joined loses up to ₹4,000, while a wasted call costs only ₹50, so a missed lead is far more costly. A lower threshold calls more people and finds more real buyers at the price of extra cheap calls. You still choose the exact threshold by adding up the total ₹ cost or profit on validation data."
    },
    {
     "q": "Only 1 in 1,000 transactions is fraud. Why can ROC-AUC look high even when a model raises many false alarms, and why is a precision-recall curve more useful here?",
     "hint": "Think about how many genuine transactions there are, and which curve notices a pile of false alarms.",
     "answer": "The ROC curve uses the false positive rate, which divides false alarms by the huge number of genuine transactions, so even thousands of false alarms look like a small rate. Precision divides by the number of cases the model flagged, so a pile of false alarms drops it sharply. When positives are rare, the PR curve shows the problem that ROC hides."
    },
    {
     "q": "How does the data-leakage idea from module 2.1 explain why SMOTE and tuning must happen inside cross-validation, not before it?",
     "hint": "Ask: while the honest score was being measured, did the model or your choices get any help from the rows used for scoring?",
     "answer": "Leakage means information from the scoring rows sneaks into training and makes scores look falsely good. SMOTE run before the split builds synthetic rows from validation rows, and tuning on the test set fits your choices to it, so both leak. Doing them only inside the training folds keeps the scoring rows truly unseen."
    }
   ],
   "nididhyasana": "Every threshold trades one kind of mistake for another. Where in your own life do you accept more false alarms so that you never miss something important?",
   "sravana": [
    "In the classification metrics video, listen for which cells of the confusion matrix precision uses and which cells recall uses.",
    "In the ROC and AUC video, listen for how each point on the curve comes from one threshold, and what an AUC of 0.5 means.",
    "In the GridSearchCV and RandomizedSearchCV video, listen for why random search can find good settings with far fewer runs than a full grid."
   ],
   "topics": [
    "confusion matrix metrics",
    "roc and pr curves",
    "thresholds and business cost",
    "cross-validation",
    "hyperparameter tuning",
    "imbalanced data"
   ],
   "quizTags": {
    "l2-metrics-tuning-q01": {
     "topic": "confusion matrix metrics",
     "skill": "remember"
    },
    "l2-metrics-tuning-q02": {
     "topic": "roc and pr curves",
     "skill": "understand"
    },
    "l2-metrics-tuning-q03": {
     "topic": "cross-validation",
     "skill": "understand"
    },
    "l2-metrics-tuning-q04": {
     "topic": "imbalanced data",
     "skill": "apply"
    },
    "l2-metrics-tuning-q05": {
     "topic": "thresholds and business cost",
     "skill": "apply"
    },
    "l2-metrics-tuning-q06": {
     "topic": "hyperparameter tuning",
     "skill": "apply"
    },
    "l2-metrics-tuning-q07": {
     "topic": "imbalanced data",
     "skill": "analyse"
    },
    "l2-metrics-tuning-q08": {
     "topic": "confusion matrix metrics",
     "skill": "apply"
    },
    "l2-metrics-tuning-q09": {
     "topic": "thresholds and business cost",
     "skill": "analyse"
    },
    "l2-metrics-tuning-q10": {
     "topic": "thresholds and business cost",
     "skill": "apply"
    },
    "test-l2-q01": {
     "topic": "imbalanced data",
     "skill": "apply"
    },
    "test-l2-q04": {
     "topic": "thresholds and business cost",
     "skill": "apply"
    },
    "test-l2-q10": {
     "topic": "confusion matrix metrics",
     "skill": "apply"
    },
    "test-l2-q17": {
     "topic": "hyperparameter tuning",
     "skill": "analyse"
    },
    "test-l2-q19": {
     "topic": "confusion matrix metrics",
     "skill": "understand"
    }
   }
  },
  "l2-trees-ensembles": {
   "cards": {
    "overview": {
     "recall": "Using the doctors and the mock-test student comparisons, how does a random forest differ from boosting?",
     "answer": "A random forest is like asking 100 doctors who each saw slightly different patients and taking a vote: many trees are trained separately and combined. Boosting is like a student who studies the mistakes after each mock test: trees are built one after another, each fixing errors the earlier ones left.",
     "why": "Why does asking 100 doctors who saw different patients usually beat asking one doctor who has memorised a single hospital's files?",
     "whyAnswer": "One doctor's quirks and blind spots go straight into the answer, just as a single deep tree memorises the noise in its training data. Doctors who saw different patients make different mistakes, and a vote lets those mistakes cancel out while the real, shared patterns remain. That is why a random forest is usually more stable than one tree."
    },
    "outcomes": {
     "recall": "According to the outcomes, which three things help control overfitting in a single decision tree?",
     "answer": "Depth limits, a minimum leaf size, and pruning.",
     "why": "Why do the outcomes pair XGBoost, LightGBM and CatBoost with early stopping, and how is it like stopping revision once your mock-test marks stop improving?",
     "whyAnswer": "Boosting keeps adding trees, and after a point the new trees only learn noise in the training data, so the validation score stops improving or gets worse. Early stopping watches the validation score and stops adding trees at that point. Like revision that no longer raises your mock marks, more of the same is not helping any more."
    },
    "studySteps": {
     "recall": "In the first study step, what do you calculate by hand to understand one split?",
     "answer": "The Gini impurity of the group before the split and after it, to see how much the split reduces the mixing of classes.",
     "why": "Why do the study steps ask you to watch AdaBoost and gradient boosting before XGBoost, LightGBM and CatBoost?",
     "whyAnswer": "XGBoost, LightGBM and CatBoost are faster, more polished versions of gradient boosting, which builds on the boosting idea that AdaBoost introduces. Once you understand 'each new model fixes the earlier mistakes', the libraries' settings, such as the learning rate and the number of trees, make sense instead of feeling like magic."
    },
    "keyTerms": {
     "recall": "What is the difference between bagging and boosting?",
     "answer": "Bagging trains many models separately, each on a random sample of the data drawn with replacement, and combines their answers. Boosting builds models one after another, each focusing on the mistakes of the ones before it.",
     "why": "How would you explain a SHAP value of +9 points for a low CIBIL score to a loan applicant in Indore?",
     "whyAnswer": "You could say: 'Starting from the average applicant's risk of not repaying, your low CIBIL score on its own raised your predicted risk by 9 percentage points.' Every fact about the applicant gets such a push, up or down, and the pushes add up to their final prediction. It explains this one decision, not the model in general."
    },
    "indiaExample": {
     "recall": "What kind of data do Indian digital lenders use for small-loan decisions, and why do they need explanation tools like SHAP?",
     "answer": "Tabular data such as income, existing EMIs, credit bureau history like the CIBIL score and, with consent, bank-statement data shared through the Account Aggregator framework. They need SHAP because a rejected applicant or a regulator may ask why a decision was made.",
     "why": "Why might a lender worry if one of its model's top reasons for rejecting people was the applicant's pin code, even though the model is accurate?",
     "whyAnswer": "A pin code can quietly stand in for things like a person's community or how wealthy their area is, so leaning on it may treat whole neighbourhoods unfairly and be hard to defend to a regulator or a customer. Accuracy alone does not reveal this, but explanations like SHAP show what the model leans on. The lender can then question or remove such features."
    },
    "commonMistakes": {
     "recall": "Why is it a mistake to treat feature importance or SHAP values as proof of cause?",
     "answer": "They show what the model relies on, not what causes the outcome. The default impurity-based importance can also favour columns with many unique values, so you should cross-check with permutation importance.",
     "why": "Ice-cream sales and drowning cases both rise in a Chennai summer. If a model uses ice-cream sales to predict drownings, why does that not prove ice cream causes drowning?",
     "whyAnswer": "Both rise because of a third thing: hot weather sends more people to buy ice cream and to go swimming. A model can lean heavily on ice-cream sales because they move together with drownings, and SHAP would show the feature as important. Importance tells you what the model uses to predict, not what causes the outcome."
    },
    "selfCheck": {
     "recall": "What does the SHAP summary-plot self-check prove you can do?",
     "answer": "It proves you can explain a boosted model by finding its top three features with SHAP and describing them in plain English that a client can follow.",
     "why": "When would a small, readable tree be a better choice than XGBoost, even if it is slightly less accurate?",
     "whyAnswer": "When people must understand and check every decision, for example a small cooperative bank whose staff need to follow the exact rules, or when the data is small and simple. A tree with a handful of questions fits on one page and can be followed by hand. If the accuracy gap is tiny, clarity and trust can be worth more than the extra points."
    }
   },
   "feynman": {
    "prompt": "Explain how a decision tree decides who should get a loan, and why banks often combine many trees, to your uncle who gives small loans through a cooperative credit society. Use 5-8 sentences and no jargon.",
    "keyIdeas": [
     {
      "idea": "A tree asks a chain of yes/no questions about the applicant, like a checklist, until it reaches a decision.",
      "cues": [
       "yes or no",
       "yes/no",
       "question",
       "checklist",
       "flow chart",
       "flowchart",
       "branch",
       "if-then",
       "if yes",
       "if no"
      ]
     },
     {
      "idea": "It picks the questions that best separate good payers from defaulters, so each resulting group is as unmixed (pure) as possible.",
      "cues": [
       "separate",
       "split",
       "pure",
       "mixed",
       "divide",
       "apart",
       "sort",
       "which question",
       "best question",
       "from defaulters"
      ]
     },
     {
      "idea": "A single tree that keeps asking more detailed questions memorises past borrowers and judges new people badly.",
      "cues": [
       "memoris",
       "memoriz",
       "by heart",
       "overfit",
       "too deep",
       "detailed question",
       "too many questions",
       "too closely",
       "too fussy",
       "fit only"
      ]
     },
     {
      "idea": "Many trees, each built from a different random sample of past borrowers, vote together, so their individual mistakes cancel out.",
      "cues": [
       "many trees",
       "lots of trees",
       "hundreds of trees",
       "vote",
       "majority",
       "most of them",
       "panel",
       "committee",
       "forest",
       "random sample"
      ]
     },
     {
      "idea": "Another way is to build trees one after another, each new tree fixing the mistakes the earlier trees still make.",
      "cues": [
       "one after another",
       "in sequence",
       "each new tree",
       "each new one",
       "next tree",
       "earlier trees",
       "previous tree",
       "got wrong",
       "fixes",
       "fixing"
      ]
     }
    ],
    "jargon": [
     "decision tree",
     "Gini impurity",
     "entropy",
     "information gain",
     "pruning",
     "bagging",
     "random forest",
     "boosting",
     "XGBoost",
     "early stopping",
     "feature importance",
     "SHAP"
    ],
    "model": "Think of a decision tree as the checklist an experienced loan officer carries in his head. It asks one yes or no question at a time: Is monthly income above ₹30,000? Has this person missed an EMI before? Each answer sends the applicant down a different path until the tree reaches 'likely to repay' or 'risky'. To choose its questions, the tree studies hundreds of past borrowers and picks the question that best separates the good payers from the defaulters, so each group becomes as pure as possible. The danger is that a single tree keeps asking more and more detailed questions until it has memorised every old borrower, and then it judges new people badly. So banks grow many trees, each from a different random sample of old borrowers, and let them vote, the way you would trust a panel of ten experienced officers more than one. Another trick is to build trees one after another, where each new tree fixes the mistakes the earlier trees still make."
   },
   "socratic": [
    {
     "q": "A node has 8 customers who bought and 2 who did not. What is its Gini impurity?",
     "hint": "Use 1 minus the sum of the squared share of each class.",
     "answer": "The shares are 0.8 and 0.2, so Gini = 1 − (0.8² + 0.2²) = 1 − (0.64 + 0.04) = 0.32. The node is fairly pure: closer to 0 than to 0.5, the maximum for two classes."
    },
    {
     "q": "Why does a random forest let each split look at only a random subset of the features, instead of always using the single best feature?",
     "hint": "Imagine one feature is very strong. What would every tree's first question be?",
     "answer": "If every tree could always pick the strongest feature, all the trees would ask nearly the same questions and make the same mistakes, so voting would add little. Choosing from a random subset at each split makes the trees different from each other, and their different errors cancel out in the vote."
    },
    {
     "q": "A Surat textile exporter has 3,000 past orders with 25 mixed columns and wants to predict which buyers will pay late. Which model would you try first, and how would you stop it overfitting?",
     "hint": "Think of the model family that is strongest on tables of business data, and the setting that stops it adding trees.",
     "answer": "A gradient-boosted tree model such as LightGBM, XGBoost, CatBoost or HistGradientBoostingClassifier with default settings, compared against a simple baseline. Use early stopping on a validation set, so it stops adding trees once the validation score stops improving, and confirm the score with cross-validation."
    },
    {
     "q": "Why can a single decision tree or a random forest never predict a flat price higher than any price it saw in training?",
     "hint": "Think about what number sits in each leaf of a regression tree.",
     "answer": "Each leaf predicts the average of the training rows that landed in it, so the output can never go beyond the range of prices in the training data. If prices rise above anything seen before, for example after a property boom, these models keep predicting at most the old highest values. Trees are weak at extending a trend beyond the data."
    },
    {
     "q": "How does pruning a tree connect to regularisation in the linear models of module 2.2?",
     "hint": "Both stop a model from becoming too complex. What does each one limit?",
     "answer": "Both give up a little training accuracy to do better on new data. Regularisation limits how large the weights can grow, while pruning limits how deep and detailed the tree can become. Each one reduces variance, the overfitting side of the bias-variance trade-off."
    }
   ],
   "nididhyasana": "Many ordinary voters who make different mistakes can together beat one strong expert. Why should disagreement among the voters make the final answer better rather than worse?",
   "sravana": [
    "In the decision tree video, listen for how the tree compares every possible split and picks the one that reduces impurity (Gini or entropy) the most.",
    "In the random forest video, listen for the two kinds of randomness each tree gets: a random sample of rows, and a random subset of features at each split.",
    "In the gradient boosting video, listen for what each new tree is trained on (the errors left by the earlier trees) and how the learning rate shrinks its contribution."
   ],
   "topics": [
    "decision tree splits",
    "pruning and overfitting",
    "random forest",
    "boosting",
    "xgboost and lightgbm",
    "feature importance and shap"
   ],
   "quizTags": {
    "l2-trees-ensembles-q01": {
     "topic": "decision tree splits",
     "skill": "remember"
    },
    "l2-trees-ensembles-q02": {
     "topic": "random forest",
     "skill": "understand"
    },
    "l2-trees-ensembles-q03": {
     "topic": "boosting",
     "skill": "remember"
    },
    "l2-trees-ensembles-q04": {
     "topic": "pruning and overfitting",
     "skill": "apply"
    },
    "l2-trees-ensembles-q05": {
     "topic": "decision tree splits",
     "skill": "understand"
    },
    "l2-trees-ensembles-q06": {
     "topic": "feature importance and shap",
     "skill": "apply"
    },
    "l2-trees-ensembles-q07": {
     "topic": "xgboost and lightgbm",
     "skill": "apply"
    },
    "l2-trees-ensembles-q08": {
     "topic": "decision tree splits",
     "skill": "apply"
    },
    "l2-trees-ensembles-q09": {
     "topic": "decision tree splits",
     "skill": "apply"
    },
    "l2-trees-ensembles-q10": {
     "topic": "feature importance and shap",
     "skill": "analyse"
    },
    "test-l2-q06": {
     "topic": "xgboost and lightgbm",
     "skill": "apply"
    },
    "test-l2-q16": {
     "topic": "boosting",
     "skill": "understand"
    }
   }
  },
  "l2-unsupervised": {
   "cards": {
    "overview": {
     "recall": "How is unsupervised learning different from the supervised learning of earlier modules, and what is clustering?",
     "answer": "Unsupervised learning works on data with no labels, so there are no right answers to learn from. Clustering sorts records into groups of similar ones without being told the groups, like sorting mixed buttons into piles by size and colour.",
     "why": "When two people sort the same box of mixed buttons into piles, why might they end up with different piles, and what does that tell you about clusters?",
     "whyAnswer": "One person may sort by colour and another by size, and both are reasonable, because nobody gave the 'correct' categories. Clustering is the same: the groups depend on which features you use, how you scale them and which method you pick. A cluster is useful when it makes sense for the business, not because it is the one true answer."
    },
    "outcomes": {
     "recall": "According to the outcomes, which two tools help you choose the number of clusters for K-Means?",
     "answer": "The elbow method and the silhouette score.",
     "why": "Why does the last outcome ask you to turn each segment into a business action, instead of stopping once you have clusters?",
     "whyAnswer": "A cluster number on its own changes nothing for a business. Only when 'Cluster 2' becomes 'lapsed high spenders: send a win-back offer' does the analysis lead to a campaign that can earn money. A segment nobody can act on is not useful yet."
    },
    "studySteps": {
     "recall": "In the K-Means lab step, what are you asked to watch and to try?",
     "answer": "Run the algorithm step by step and watch the centroids move, then try different values of k and different starting points.",
     "why": "Why can starting K-Means from different points sometimes give you different clusters?",
     "whyAnswer": "K-Means only improves step by step from wherever it starts, so a poor start can settle into a worse grouping that it cannot escape. Different starts can therefore end in different results. That is why people often run K-Means several times from different starts (the n_init setting in scikit-learn) and keep the result with the lowest inertia."
    },
    "keyTerms": {
     "recall": "What is the difference between inertia and the silhouette score?",
     "answer": "Inertia is the total squared distance from each point to its cluster's centre, and lower means tighter clusters. The silhouette score, from −1 to 1, shows how well each point fits its own cluster compared with the next nearest cluster.",
     "why": "Why does inertia always fall as you add more clusters, so that simply picking the lowest inertia would be a mistake?",
     "whyAnswer": "With more centres, every point can sit closer to one of them, and with one cluster per point the inertia becomes 0. So the lowest inertia simply means the most clusters, not the best grouping. That is why you look for the elbow, where adding clusters stops helping much."
    },
    "indiaExample": {
     "recall": "How did GSTN's 2023 special drive against fake GST registrations use the idea of anomaly detection?",
     "answer": "It used data analytics and risk parameters to shortlist registrations that did not behave like the rest, and tax officers then checked them in person. Picking out odd records without a complete list of known frauds is anomaly detection.",
     "why": "Why is anomaly detection useful when fraudsters keep inventing new tricks that no list of past frauds contains?",
     "whyAnswer": "A supervised model can only learn the kinds of fraud that appear in its labelled past data. Anomaly detection instead learns what normal looks like and flags anything far from it, so it can catch a trick it has never seen. People then check the flags, because unusual does not always mean fraud."
    },
    "commonMistakes": {
     "recall": "What goes wrong if you run K-Means on total spend in ₹ and days since the last order without scaling them?",
     "answer": "Spend in thousands of rupees swamps the days since the last order, so the clusters end up based on spend alone. Apply StandardScaler first.",
     "why": "Why should a t-SNE picture showing two groups far apart not convince you that the groups are very different?",
     "whyAnswer": "t-SNE and UMAP are built to keep near neighbours close, not to keep true distances, so cluster sizes and the gaps between clusters can be stretched or squeezed, and they change with the settings. A big gap may mean little. Use these pictures to explore and form ideas, then check those ideas in other ways."
    },
    "selfCheck": {
     "recall": "What does the RFM self-check on the Online Retail data prove you can do?",
     "answer": "It proves you can clean order data, build a scaled RFM table per customer, run K-Means for several values of k, pick k with the elbow and silhouette scores, and turn each segment into a named group with a campaign idea.",
     "why": "Why does K-Means split the two make_moons shapes wrongly, while DBSCAN does not?",
     "whyAnswer": "K-Means gives each point to its nearest centre, so it carves the space into round-ish regions and cuts each curved moon in the wrong place. DBSCAN joins points that sit next to each other in crowded areas, so it follows each curved band whatever its shape. A method's idea of a cluster has to match the shape of your data."
    }
   },
   "feynman": {
    "prompt": "Explain how a computer can split a shop's customers into groups when nobody has told it what the groups should be, to a friend who runs a saree shop in Kanchipuram and keeps a list of past buyers. Use 5-8 sentences and no jargon.",
    "keyIdeas": [
     {
      "idea": "Nobody gives the computer labels or right answers; it has to discover the groups by itself.",
      "cues": [
       "no label",
       "no answer",
       "no right",
       "not told",
       "nobody",
       "no one",
       "without anyone",
       "by itself",
       "on its own",
       "without being told"
      ]
     },
     {
      "idea": "It puts customers who are similar to each other into the same group, and keeps different ones apart.",
      "cues": [
       "similar",
       "alike",
       "close to",
       "closer",
       "near each other",
       "same kind",
       "in common",
       "look the same",
       "behave the same",
       "resembl"
      ]
     },
     {
      "idea": "Customers can be described by how recently they last bought, how often they buy and how much they spend.",
      "cues": [
       "recent",
       "last bought",
       "last came",
       "last visit",
       "last purchase",
       "how often",
       "how many times",
       "frequen",
       "spen",
       "total bill"
      ]
     },
     {
      "idea": "You choose how many groups to make by checking when adding more groups stops helping much.",
      "cues": [
       "how many groups",
       "how many clusters",
       "decide how many",
       "number of groups",
       "different numbers",
       "more groups",
       "adding another",
       "adding more",
       "elbow",
       "right number"
      ]
     },
     {
      "idea": "Each group gets a human name and its own business action, such as a win-back offer for customers who drifted away.",
      "cues": [
       "offer",
       "campaign",
       "discount",
       "scheme",
       "win back",
       "treat each",
       "name each",
       "what to do",
       "loyal",
       "differently"
      ]
     }
    ],
    "jargon": [
     "unsupervised learning",
     "clustering",
     "K-Means",
     "centroid",
     "inertia",
     "elbow method",
     "silhouette score",
     "DBSCAN",
     "PCA",
     "anomaly detection",
     "RFM",
     "dendrogram"
    ],
    "model": "Imagine you have a notebook of every customer who bought from your shop in the last two years. Nobody tells the computer what the groups should be; there are no right answers to copy. Instead, for each customer it notes three simple things: how recently they last bought, how often they have bought, and how much they have spent in total. Then it puts customers who are similar on these three things into the same group, so people who are close to each other end up together. It tries two groups, three groups, four groups and so on, and stops when adding more groups no longer makes them much tighter. You might find a group of loyal big spenders who come every wedding season, and another group who spent a lot once but have not come back for a year. Finally, you give each group a name and an action: a thank-you gift for the loyal ones, and a Pongal offer on WhatsApp to win back the ones who drifted away."
   },
   "socratic": [
    {
     "q": "In RFM, what do R, F and M stand for, and which one is better when it is lower?",
     "hint": "One of the three is counted in days.",
     "answer": "Recency (days since the last purchase), Frequency (number of purchases) and Monetary value (total spend). Recency is better when it is lower, because fewer days since the last purchase means a more active customer."
    },
    {
     "q": "Why does K-Means need you to choose K in advance, while DBSCAN does not?",
     "hint": "Think about what each method starts from: centres, or crowds of points.",
     "answer": "K-Means starts by placing K centres and moving them to the middle of their points, so it cannot run without knowing how many centres to place. DBSCAN grows clusters wherever points are crowded together, so the number of clusters comes out of the data, and lonely points are labelled as noise."
    },
    {
     "q": "A Pune school has 40 test scores for each student and wants one 2-D picture of how students differ. What could you use, and what should you check?",
     "hint": "Look for a method that builds a few new columns from many related ones.",
     "answer": "Scale the 40 score columns, then use PCA to squeeze them into 2 principal components and plot them. Check the explained variance ratio to see how much of the original variation the two components keep; if it is low, the picture hides a lot of the differences."
    },
    {
     "q": "An anomaly detector flags a ₹90,000 UPI payment made at 2 am from a Chennai account. Why should a person check it before the account is blocked?",
     "hint": "Ask whether 'unusual' and 'fraud' always mean the same thing.",
     "answer": "Anomaly detection only says the payment is unlike the usual pattern; it does not know why. It could be a genuine hospital bill or an urgent family payment, so blocking it automatically could hurt an honest customer. A person or a second check confirms whether it is really fraud."
    },
    {
     "q": "How is the scaling problem in K-Means the same one you met with KNN in module 2.3?",
     "hint": "Both methods depend on one particular calculation between pairs of points.",
     "answer": "Both KNN and K-Means work by measuring the distance between points. If one feature is in lakhs of rupees and another in days or years, the big-number feature decides the distance almost on its own. Scaling the features first, for example with StandardScaler, lets every feature count fairly in both methods."
    }
   ],
   "nididhyasana": "If nobody tells you the right groups, can a grouping ever be wrong? What makes one way of grouping people better than another?",
   "sravana": [
    "In the K-Means video, listen for the two steps that repeat: assign each point to its nearest centroid, then move each centroid to the mean of its points.",
    "In the DBSCAN part, listen for what eps and min_samples control, and how a point becomes a core point, a border point or noise.",
    "In the PCA video, listen for what a principal component is (a new direction of greatest spread) and how explained variance tells you how much information is kept."
   ],
   "topics": [
    "k-means and choosing k",
    "hierarchical clustering",
    "dbscan",
    "pca",
    "t-sne and umap",
    "anomaly detection",
    "rfm segmentation"
   ],
   "quizTags": {
    "l2-unsupervised-q01": {
     "topic": "hierarchical clustering",
     "skill": "remember"
    },
    "l2-unsupervised-q02": {
     "topic": "k-means and choosing k",
     "skill": "understand"
    },
    "l2-unsupervised-q03": {
     "topic": "pca",
     "skill": "remember"
    },
    "l2-unsupervised-q04": {
     "topic": "dbscan",
     "skill": "apply"
    },
    "l2-unsupervised-q05": {
     "topic": "k-means and choosing k",
     "skill": "apply"
    },
    "l2-unsupervised-q06": {
     "topic": "t-sne and umap",
     "skill": "understand"
    },
    "l2-unsupervised-q07": {
     "topic": "rfm segmentation",
     "skill": "apply"
    },
    "l2-unsupervised-q08": {
     "topic": "pca",
     "skill": "apply"
    },
    "l2-unsupervised-q09": {
     "topic": "k-means and choosing k",
     "skill": "apply"
    },
    "l2-unsupervised-q10": {
     "topic": "anomaly detection",
     "skill": "analyse"
    },
    "test-l2-q08": {
     "topic": "rfm segmentation",
     "skill": "apply"
    },
    "test-l2-q09": {
     "topic": "pca",
     "skill": "analyse"
    },
    "test-l2-q18": {
     "topic": "dbscan",
     "skill": "apply"
    }
   }
  },
  "l2-feature-eng": {
   "cards": {
    "overview": {
     "recall": "In the cooking comparison, what is a scikit-learn Pipeline, and why does it matter?",
     "answer": "A Pipeline is the written recipe: it records every preparation step, so exactly the same steps run during practice, during testing and when real customers use the model.",
     "why": "Why can well-prepared ingredients improve a dish more than a fancier stove, and how does that match feature engineering versus switching algorithms?",
     "whyAnswer": "A great stove cannot rescue unwashed, badly chopped vegetables, while good preparation makes even a simple stove turn out a tasty dish. In the same way, a model can only find patterns that its input columns make visible. Turning raw dates, city names and prices into clear features often helps more than trying a fancier algorithm."
    },
    "outcomes": {
     "recall": "According to the outcomes, which three ways of encoding categories should you know, and which transform helps with skewed values such as prices?",
     "answer": "One-hot, ordinal and target encoding. A log transform helps with skewed values such as prices.",
     "why": "Why is one finished end-to-end project with a clear README worth more to an employer than ten half-finished notebooks?",
     "whyAnswer": "A finished project shows you can take a real problem from raw data to a saved, working model and explain the result, which is what the job needs. A clear README lets a busy recruiter understand the problem, approach and results in a couple of minutes. Half-finished notebooks only show that you started things."
    },
    "studySteps": {
     "recall": "What are you asked to do right after watching the Pipelines and ColumnTransformer lessons?",
     "answer": "Rebuild the lesson's pipeline yourself in Colab, without looking at the video's code.",
     "why": "Why does rebuilding the pipeline without looking teach you more than copying the code while the video plays?",
     "whyAnswer": "Copying only exercises your fingers, while rebuilding from memory forces you to recall what each step does and in which order. The places where you get stuck show exactly what you have not understood yet. Fixing those gaps is what makes the skill stick."
    },
    "keyTerms": {
     "recall": "What is the difference between a lag feature and a rolling feature?",
     "answer": "A lag feature is one past value used as an input, such as yesterday's sales. A rolling feature is a summary over a moving window of past values, such as the average sales of the last 7 days.",
     "why": "Why should a 'city' column get one-hot encoding, while 'furnishing: None, Semi, Full' can use ordinal encoding?",
     "whyAnswer": "Furnishing really goes from less to more, so codes 0 < 1 < 2 keep a true meaning. Cities have no order, so codes like Delhi = 0, Mumbai = 1, Chennai = 2 would make a model treat Chennai as 'twice' Mumbai. One-hot gives each city its own 0/1 column, so no fake order appears."
    },
    "indiaExample": {
     "recall": "Which features does a typical demand model for a Blinkit or Zepto dark store use?",
     "answer": "Sales yesterday and on the same day last week (lags), 7-day and 28-day averages (rolling features), the day of the week, and flags for festivals such as Diwali or Holi.",
     "why": "Why is last Monday's sales figure often a better clue for this Monday than yesterday's Sunday sales?",
     "whyAnswer": "Shopping follows a weekly rhythm: a Sunday can look very different from a weekday, while one Monday tends to resemble the next. The lag-7 feature captures that weekly pattern. Using both lag-1 and lag-7 lets the model combine the latest trend with the weekly rhythm."
    },
    "commonMistakes": {
     "recall": "What goes wrong when you use pd.get_dummies separately on the training data and the test data?",
     "answer": "Each call creates columns only for the categories it sees, so the training and test tables end up with mismatched columns and the model gets misaligned inputs. Use OneHotEncoder(handle_unknown='ignore') inside a Pipeline instead.",
     "why": "How is chasing the Kaggle public leaderboard like practising only the one sample paper a coaching centre showed you?",
     "whyAnswer": "The sample paper covers only a small part of what the real exam can ask, so a student who drills just that paper can score well on it and still be caught out. The public leaderboard is also only a small part of the test data. Your own careful cross-validation is a better guide to how you will really do."
    },
    "selfCheck": {
     "recall": "What does the lag and rolling-feature self-check on a daily sales series prove you can do?",
     "answer": "It proves you can build lag-1, lag-7 and 7-day rolling-mean features that use only past days (by shifting the series one day before rolling), and check them honestly with TimeSeriesSplit.",
     "why": "Why might a model trained on log(SalePrice) do better in the House Prices competition than one trained on the raw price?",
     "whyAnswer": "House prices are skewed: a few very expensive houses produce huge raw errors that dominate training. The log squeezes those big values, so the model treats a 10% miss on a cheap house and on a costly house more evenly. The competition also scores predictions on log prices, so training on the log matches what is being measured."
    }
   },
   "feynman": {
    "prompt": "Explain what preparing data for a model means, and why we write the steps down as one fixed recipe, to the owner of a college canteen in Lucknow who wants to forecast daily samosa sales. Use 5-8 sentences and no jargon.",
    "keyIdeas": [
     {
      "idea": "Raw records must be turned into useful clues before a computer can learn from them well.",
      "cues": [
       "clue",
       "clean",
       "wash",
       "chop",
       "ingredient",
       "raw data",
       "raw record",
       "turn it into",
       "useful input",
       "convert"
      ]
     },
     {
      "idea": "Words such as day names have to become numbers without inventing a fake order between them.",
      "cues": [
       "into numbers",
       "to numbers",
       "become numbers",
       "fake order",
       "no order",
       "yes or no",
       "0 or 1",
       "own column",
       "separate column",
       "tick column"
      ]
     },
     {
      "idea": "Good clues come from past sales (yesterday, the same day last week, the recent average) and from the calendar, such as festivals or exams.",
      "cues": [
       "yesterday",
       "last week",
       "last 7 days",
       "last seven days",
       "last few days",
       "same day",
       "previous day",
       "day before",
       "festival",
       "holiday"
      ]
     },
     {
      "idea": "Every clue must use only days that have already happened, never today's own sales or the future.",
      "cues": [
       "already happened",
       "already over",
       "only past",
       "only the past",
       "only from earlier",
       "not today",
       "today's own",
       "peek",
       "sneak",
       "leak"
      ]
     },
     {
      "idea": "All the preparation steps are written down as one recipe, so they run the same way, in the same order, while learning, testing and in real use.",
      "cues": [
       "recipe",
       "same steps",
       "same order",
       "same way each",
       "same way every",
       "fixed order",
       "set of steps",
       "sequence",
       "identical",
       "pipeline"
      ]
     }
    ],
    "jargon": [
     "feature engineering",
     "feature",
     "one-hot encoding",
     "ordinal encoding",
     "target encoding",
     "scaling",
     "log transform",
     "Pipeline",
     "ColumnTransformer",
     "lag feature",
     "rolling feature",
     "leakage"
    ],
    "model": "Think of how your cook makes samosas: the potatoes are washed, boiled and mashed before they go into the pastry. Data needs the same preparation. Your sales register is raw, so we turn it into useful clues for the computer. Some clues come from the past: how many samosas sold yesterday, on the same day last week, and on average over the last seven days. Others come from the calendar, such as whether it is a Sunday, an exam week or a festival like Diwali. Words like 'Monday' must become numbers, but without a fake order, so each day gets its own yes-or-no column. One strict rule: every clue must come only from days that have already happened, never from today's own sales or the future, or the forecast will look perfect in testing and then fail. Finally, we write all these steps down as one recipe, so the computer prepares the numbers in exactly the same way every time: while learning, while testing, and each morning when it makes a real forecast."
   },
   "socratic": [
    {
     "q": "Which encoding would you use for a 'payment method' column with the values UPI, card and cash, and why?",
     "hint": "Ask whether these categories have a natural order.",
     "answer": "One-hot encoding, because payment methods have no natural order. Each method gets its own 0/1 column, so the model is not misled into thinking that, say, cash is 'more' than UPI."
    },
    {
     "q": "Why must shift(1) come before rolling(7) when you build a 7-day average feature to predict today's sales?",
     "hint": "Without the shift, whose sales sit inside today's window?",
     "answer": "Without the shift, today's window includes today's own sales, the very number you are trying to predict, so the feature leaks the answer. Shifting by one first makes the window end at yesterday, which is information you really have when you make the forecast."
    },
    {
     "q": "A Hyderabad rent dataset has 'area_sqft' (numbers with some gaps), 'locality' (hundreds of names) and 'furnishing' (None, Semi, Full). How would you set up a ColumnTransformer for it?",
     "hint": "Give each kind of column its own lane of steps, and think about which category has a real order.",
     "answer": "Area lane: SimpleImputer to fill the gaps, then StandardScaler. Furnishing lane: ordinal encoding, because None < Semi < Full is a real order. Locality lane: one-hot encoding with handle_unknown='ignore', or target encoding learned on training rows only, since there are hundreds of names. Put the ColumnTransformer and the model inside one Pipeline."
    },
    {
     "q": "Your OneHotEncoder was fitted on training data from Pune, Delhi and Agra. A customer from Surat arrives. What happens with handle_unknown='ignore', and what is the limitation?",
     "hint": "Think about which of the city columns can be switched on for Surat.",
     "answer": "Surat gets 0 in every city column, so the model still runs instead of crashing. The limitation is that the model knows nothing specific about Surat, so its predictions there may be poor until you retrain with data that includes Surat."
    },
    {
     "q": "How does a Pipeline protect you from the module 2.1 mistake of scaling the whole dataset before splitting?",
     "hint": "Think about where fit is called when the whole Pipeline is passed to cross-validation.",
     "answer": "When the whole Pipeline is cross-validated, the imputer, scaler and encoder are fitted again on the training folds only, so the validation rows never shape their numbers. By hand it is easy to scale everything first and leak test information. The Pipeline also reuses exactly the same fitted steps on new customers."
    }
   ],
   "nididhyasana": "A model sees the world only through the columns you give it. What would a wise canteen owner know about tomorrow's samosa sales that no sales register records?",
   "sravana": [
    "In the ordinal and one-hot encoding videos, listen for how the teacher decides whether a category has a real order, and what happens with categories never seen in training.",
    "In the ColumnTransformer and Pipeline videos, listen for how each list of column names is sent to its own transformer, and how the model is attached at the end.",
    "In the time-series lessons, listen for why the series is shifted before rolling averages are taken, and why a time-based split replaces random k-fold."
   ],
   "topics": [
    "categorical encoding",
    "scaling and transforms",
    "feature selection",
    "pipelines and columntransformer",
    "time-series features",
    "kaggle workflow",
    "end-to-end project"
   ],
   "quizTags": {
    "l2-feature-eng-q01": {
     "topic": "categorical encoding",
     "skill": "understand"
    },
    "l2-feature-eng-q02": {
     "topic": "categorical encoding",
     "skill": "apply"
    },
    "l2-feature-eng-q03": {
     "topic": "time-series features",
     "skill": "remember"
    },
    "l2-feature-eng-q04": {
     "topic": "pipelines and columntransformer",
     "skill": "understand"
    },
    "l2-feature-eng-q05": {
     "topic": "pipelines and columntransformer",
     "skill": "apply"
    },
    "l2-feature-eng-q06": {
     "topic": "feature selection",
     "skill": "analyse"
    },
    "l2-feature-eng-q07": {
     "topic": "kaggle workflow",
     "skill": "understand"
    },
    "l2-feature-eng-q08": {
     "topic": "time-series features",
     "skill": "apply"
    },
    "l2-feature-eng-q09": {
     "topic": "pipelines and columntransformer",
     "skill": "apply"
    },
    "l2-feature-eng-q10": {
     "topic": "categorical encoding",
     "skill": "analyse"
    },
    "test-l2-q05": {
     "topic": "feature selection",
     "skill": "analyse"
    },
    "test-l2-q11": {
     "topic": "time-series features",
     "skill": "apply"
    },
    "test-l2-q12": {
     "topic": "time-series features",
     "skill": "analyse"
    }
   }
  },
  "l3-nn-basics": {
   "cards": {
    "overview": {
     "recall": "In the training loop described in the overview, what are the four steps that go from making a guess to changing the weights?",
     "answer": "The forward pass makes a guess, the loss function measures how wrong it was, backpropagation works out how each weight should change, and an optimiser such as SGD or Adam makes that change.",
     "why": "In the hiring-panel picture, why must the panel adjust how much it trusts each signal after a bad hire, and which part of a neural network plays the role of that trust?",
     "whyAnswer": "The weights are the trust: each weight says how important one input is. A bad hire shows the panel that some signals were trusted too much or too little, just as a large loss shows the network that its weights are off. Adjusting that trust a little after every mistake, again and again, is exactly what training does to the weights."
    },
    "outcomes": {
     "recall": "Which three tricks do the outcomes name for reducing overfitting, and on what kind of data must your NumPy network beat logistic regression?",
     "answer": "Dropout, batch normalisation and weight decay. Your two-layer NumPy network must beat logistic regression on curved (non-linear) data.",
     "why": "Why is curved data the right test for a two-layer network, instead of data that one straight line can already separate?",
     "whyAnswer": "Logistic regression can only draw a straight boundary, so on straight-line data a neural network has nothing extra to show. On curved data, such as two interlocking half-moons, the hidden layer and its activation can bend the boundary. Beating logistic regression there proves your network learned something a straight-line model cannot."
    },
    "studySteps": {
     "recall": "Why do the study steps ask you to watch the backpropagation lessons twice, and what do you do the second time?",
     "answer": "The first time you follow along; the second time you work with pen and paper and do every chain-rule step yourself, so you truly understand backpropagation instead of only watching it.",
     "why": "In the Lab step you change one setting at a time. How would your conclusions change if you changed the learning rate and the number of hidden neurons together?",
     "whyAnswer": "If both change at once and the network suddenly fails, you cannot tell which change caused it, or whether one helped while the other hurt. Changing one thing at a time is like a fair experiment in a school science lab: everything else stays the same, so the effect you see belongs to the one setting you changed."
    },
    "keyTerms": {
     "recall": "What is the difference between a perceptron and a multilayer perceptron, and what are hidden layers?",
     "answer": "A perceptron is a single neuron that draws one straight line to separate two classes. A multilayer perceptron arranges neurons in layers, each feeding the next, and the layers between the input and the output are the hidden layers.",
     "why": "How is the learning rate like the size of your steps when you walk down a dark hillside towards the bottom of a valley?",
     "whyAnswer": "Tiny steps are safe but take ages to reach the bottom, just as a tiny learning rate makes training crawl. Huge steps can carry you right over the valley and up the other side, like a loss that jumps around or blows up. A sensible step size gets you down steadily."
    },
    "indiaExample": {
     "recall": "What type of neural network does Google's flood forecasting model use, what is it trained on, and where did the work begin?",
     "answer": "It uses an LSTM, a type of neural network, trained on past river and weather data. The work began in 2018 with a pilot in the Patna region of Bihar, with India's Central Water Commission.",
     "why": "Why is a network that learns from past river and weather records a better fit for flood forecasting than rules written by hand?",
     "whyAnswer": "A flood depends on many things at once, such as rain upstream, how full the river already is and the season, and these are hard to turn into exact rules. Years of records show what really happened after each pattern, so the network can compare its forecast with the real river level, measure the error and adjust, again and again. Hand-written rules cannot improve themselves this way."
    },
    "commonMistakes": {
     "recall": "What goes wrong if you leave out the activation function in the hidden layers, and why?",
     "answer": "Every layer becomes a straight-line calculation, so even ten layers act like one simple linear model and cannot learn curved patterns. Use ReLU in the hidden layers.",
     "why": "If one input is a salary in lakhs of rupees and another is between 0 and 1, why does training struggle, and how is it like adding raw marks from a 100-mark paper and a 5-mark quiz?",
     "whyAnswer": "The huge salary numbers dominate the sums and the gradients, so a step size that suits one weight is far too big or too small for the other, and training becomes slow or unstable. Adding raw marks lets the 100-mark paper swamp the 5-mark quiz in the same way. Putting both on the same scale first, by standardising the features, fixes it."
    },
    "selfCheck": {
     "recall": "What does the self-check of coding a two-layer network in NumPy only, training it on make_moons and beating logistic regression, prove you can do?",
     "answer": "It proves you can build and train a neural network yourself, writing the forward pass, loss, backpropagation and weight updates without PyTorch, and show with a loss curve that its hidden layer learns a curved pattern a straight-line model cannot.",
     "why": "Why does the last self-check ask you to explain how a network learns from its mistakes to a non-technical client, without any maths?",
     "whyAnswer": "If you can explain it simply, you have really understood the loop of guess, measure and adjust, not just memorised formulas. Clients who pay for a model also need to trust it, and most of them do not know calculus, so a clear picture, such as a hiring panel adjusting its trust, is a real work skill."
    }
   },
   "feynman": {
    "prompt": "Explain how a neural network learns from its mistakes to your cousin in Class 10 who is preparing for board exams, in 5-8 sentences, without jargon.",
    "keyIdeas": [
     {
      "idea": "Each small unit gives every input an importance number (a weight), multiplies and adds them up, and passes the total on through a simple rule.",
      "cues": [
       "weigh",
       "importance",
       "how important",
       "multipl",
       "adds up",
       "add up",
       "add them",
       "trust",
       "neuron",
       "how much each"
      ]
     },
     {
      "idea": "The units are arranged in layers, each layer passing its results to the next, until the last one gives a final guess.",
      "cues": [
       "layer",
       "in rows",
       "next row",
       "rows of",
       "stage by stage",
       "next stage",
       "stages",
       "pass it on",
       "passes it on",
       "into the next"
      ]
     },
     {
      "idea": "The guess is compared with the right answer, and one number measures how wrong it was (the loss).",
      "cues": [
       "how wrong",
       "how far off",
       "how bad",
       "how big the",
       "right answer",
       "correct answer",
       "real answer",
       "actual answer",
       "answer key",
       "compare"
      ]
     },
     {
      "idea": "It works backwards from the final error to find how much each weight was to blame (backpropagation).",
      "cues": [
       "backward",
       "back through",
       "goes back",
       "going back",
       "work back",
       "blame",
       "responsib",
       "contribut",
       "backprop",
       "each weight"
      ]
     },
     {
      "idea": "Each weight is nudged a small step in the direction that makes the error smaller; steps that are too big overshoot and too small are slow.",
      "cues": [
       "small step",
       "tiny step",
       "tiny bit",
       "a little",
       "nudge",
       "tweak",
       "adjust",
       "slightly",
       "overshoot",
       "step size"
      ]
     },
     {
      "idea": "The guess, check and adjust loop repeats over many examples until the mistakes become small.",
      "cues": [
       "again and again",
       "over and over",
       "repeat",
       "thousands of",
       "many times",
       "many examples",
       "many rounds",
       "keep doing",
       "keeps doing",
       "loop"
      ]
     }
    ],
    "jargon": [
     "neuron",
     "weight",
     "bias",
     "activation function",
     "ReLU",
     "sigmoid",
     "loss function",
     "backpropagation",
     "gradient",
     "learning rate",
     "optimiser",
     "chain rule"
    ],
    "model": "Think of a neural network as a team of judges at a school science fair in Pune. Each judge looks at a few things about a project, such as the idea and the working model, and gives each one an importance number that says how much to trust it. The judge multiplies, adds up and passes a total to the next row of judges, layer after layer, until the head judge gives a final guess, like 'this project should win'. We then compare that guess with the right answer and measure how wrong it was as one number. Next, the network works backwards from that final mistake to find how much each importance number was to blame. Each number is nudged a small step in the direction that makes the mistake smaller; steps that are too big overshoot, and steps that are too tiny take forever. The network repeats this guess, check and adjust loop over thousands of examples until its guesses are usually right. Nobody writes the rules for it; it finds them from its own mistakes."
   },
   "socratic": [
    {
     "q": "What three things does a single neuron do with its inputs before it passes a number on?",
     "hint": "Think of one interviewer on the hiring panel with importance numbers, plus the small rule at the end.",
     "answer": "It multiplies each input by its weight, adds the results together with a bias (a constant), and passes the total through an activation function such as ReLU or sigmoid."
    },
    {
     "q": "Why does backpropagation multiply slopes together as it moves backwards through the network?",
     "hint": "Each step of the forward pass depends on the step before it. How does a small change travel along a chain?",
     "answer": "Because of the chain rule: an early weight affects the loss only by passing through every later step. Its effect on the loss is the product of how much each step changes the next one, so backpropagation starts at the loss and multiplies the local slopes on the way back, giving every weight its gradient."
    },
    {
     "q": "A Bengaluru bank wants a network that predicts whether a loan applicant will repay (yes or no) from income in rupees, age and the number of missed EMIs. Which output activation and loss fit, and what should you do to the inputs first?",
     "hint": "The common mistakes card has one pairing for yes/no answers and one warning about inputs of very different sizes.",
     "answer": "Use one output neuron with sigmoid, trained with binary cross-entropy, because it is a yes/no question, and ReLU in the hidden layers. First standardise the inputs, because income in rupees is far larger than the other numbers and would make training slow or unstable."
    },
    {
     "q": "Your network gets 99% accuracy on its training data but only 70% on new data. What has happened, and which tricks from this module could help?",
     "hint": "Think of a student who memorises last year's question paper word for word.",
     "answer": "It has overfitted: it memorised the training examples, including their noise, instead of the general pattern. Dropout and weight decay (and batch normalisation, more data or a smaller network) can help; check that the gap between training and validation accuracy shrinks."
    },
    {
     "q": "How is training a neural network connected to the gradient descent you used for linear regression in module 2.2?",
     "hint": "Both have a loss and a downhill step. What is extra in a network with many layers?",
     "answer": "It is the same idea: measure the loss, find its slope for each weight and step downhill by the learning rate. A network has many layers and non-linear activations, so it needs backpropagation (the chain rule) to find the slope for every weight, and optimisers such as momentum or Adam often improve on plain steps."
    }
   ],
   "nididhyasana": "A neural network is never told the rules. It only measures its own mistakes and makes thousands of tiny corrections. How can so many small adjustments add up to something that looks like understanding?",
   "sravana": [
    "In the backpropagation lessons, listen for how the error at the output is passed backwards layer by layer, with the chain rule multiplying one local slope for each step.",
    "In the activation function lessons, listen for why sigmoid's slope is never more than 0.25, how that makes gradients vanish in deep networks, and why ReLU avoids it.",
    "In the optimiser lessons, listen for how momentum keeps a running average of past gradients and how Adam gives each weight its own step size."
   ],
   "topics": [
    "neurons and layers",
    "forward pass",
    "activation and loss",
    "backpropagation",
    "optimisers and learning rate",
    "regularisation",
    "vanishing and exploding gradients"
   ],
   "quizTags": {
    "l3-nn-basics-q01": {
     "topic": "activation and loss",
     "skill": "understand"
    },
    "l3-nn-basics-q02": {
     "topic": "neurons and layers",
     "skill": "understand"
    },
    "l3-nn-basics-q03": {
     "topic": "regularisation",
     "skill": "remember"
    },
    "l3-nn-basics-q04": {
     "topic": "activation and loss",
     "skill": "apply"
    },
    "l3-nn-basics-q05": {
     "topic": "optimisers and learning rate",
     "skill": "apply"
    },
    "l3-nn-basics-q06": {
     "topic": "optimisers and learning rate",
     "skill": "apply"
    },
    "l3-nn-basics-q07": {
     "topic": "vanishing and exploding gradients",
     "skill": "analyse"
    },
    "l3-nn-basics-q08": {
     "topic": "neurons and layers",
     "skill": "apply"
    },
    "l3-nn-basics-q09": {
     "topic": "forward pass",
     "skill": "apply"
    },
    "l3-nn-basics-q10": {
     "topic": "backpropagation",
     "skill": "apply"
    },
    "test-l3-q02": {
     "topic": "regularisation",
     "skill": "apply"
    },
    "test-l3-q18": {
     "topic": "neurons and layers",
     "skill": "analyse"
    }
   }
  },
  "l3-pytorch": {
   "cards": {
    "overview": {
     "recall": "According to the overview, which two heavy jobs does PyTorch do for you, and which recipe from your NumPy network stays the same?",
     "answer": "It stores data as tensors that can run on a GPU, and it calculates all the gradients automatically with autograd. The recipe stays the same: forward pass, loss, backward pass, update.",
     "why": "If PyTorch works out the gradients for you, why was it still worth building a network by hand in NumPy first?",
     "whyAnswer": "Because the recipe is the same, you now know what each PyTorch line does for you, like a cook who has ground masala by hand and knows what is inside the ready-made packet. When training goes wrong, you can reason about the forward pass, the loss and the gradients instead of treating the library as magic."
    },
    "outcomes": {
     "recall": "According to the outcomes, which three calls must sit in the right places in your training and validation loop?",
     "answer": "model.train() for training, and model.eval() together with torch.no_grad() for validation.",
     "why": "Why do you need to keep your work safe when a free Colab session disconnects, and how is it like saving a long document during frequent power cuts?",
     "whyAnswer": "A free Colab session can time out or disconnect, and files kept only inside the session are wiped, just as unsaved typing is lost in a power cut. Saving a checkpoint (the model, the optimiser and the epoch number) to Google Drive every so often lets you resume from the last save instead of training from zero."
    },
    "studySteps": {
     "recall": "In the GPU study step, which two things must you move to the GPU with .to(device), and what do you then compare?",
     "answer": "The model and every batch of data. You then compare how long one epoch takes on the CPU and on the GPU.",
     "why": "Why do the study steps ask you to print the .shape of every tensor you create?",
     "whyAnswer": "Many PyTorch errors are shape mismatches, such as a batch of shape [32, 5] meeting a layer that expects a different size. Printing shapes as you go builds the habit of checking what each tensor holds, so you spot a wrong shape at once instead of puzzling over a long error message later."
    },
    "keyTerms": {
     "recall": "What is the difference between a Dataset, a DataLoader and an epoch?",
     "answer": "A Dataset knows how many examples there are and how to fetch example number i. A DataLoader serves that Dataset in shuffled mini-batches, such as 32 at a time, and an epoch is one full pass through all the training data.",
     "why": "Why is a saved state_dict enough for making predictions later, but not enough to resume training smoothly after Colab disconnects?",
     "whyAnswer": "The state_dict holds the learned weights, so you can rebuild the same model class, load them into it and make predictions. To carry on training exactly where you stopped, you also need the optimiser's state and the epoch number, which is what a checkpoint stores. Without them you restart the optimiser from scratch and lose track of how far training had gone."
    },
    "indiaExample": {
     "recall": "Which model did AI4Bharat at IIT Madras train with a toolkit built on PyTorch, and what does it do?",
     "answer": "IndicTrans2, an open-source translation model for all 22 scheduled Indian languages. It was trained with fairseq, a toolkit built on PyTorch, and the models are published on Hugging Face.",
     "why": "Why does it matter to a student or a small Indian startup that IndicTrans2 is open source and published on Hugging Face?",
     "whyAnswer": "Training a translation model for 22 languages needs a lot of data and computing power that a student or a small startup rarely has. Because the trained models are free to download, you can load one in a Colab notebook and translate English to Hindi or Tamil right away, using the tensors, device and model.eval() skills from this module."
    },
    "commonMistakes": {
     "recall": "What goes wrong if you forget optimizer.zero_grad() in each training step, and why?",
     "answer": "PyTorch adds new gradients on top of the old ones by default, so each update uses a growing pile of past gradients and training goes haywire. Clear the gradients at the start of every training step.",
     "why": "How would your validation accuracy behave from run to run if you forgot model.eval() for a model that uses dropout?",
     "whyAnswer": "In training mode dropout keeps switching off random neurons, so the same validation images can get different predictions each time and the accuracy wobbles from run to run. model.eval() turns dropout off and makes batch normalisation use its saved statistics, so validation gives the same, fair answer every time."
    },
    "selfCheck": {
     "recall": "What does the self-check of making your model reach almost zero loss on one batch of 16 examples prove you can do?",
     "answer": "It proves you can sanity-check a training pipeline: a healthy model should memorise one small batch, so if it cannot, the bug is in your code, such as the labels, the loss or the update step.",
     "why": "Why is a model that cannot memorise even 16 examples a sign of a bug, rather than a sign that it needs more data?",
     "whyAnswer": "A network has far more weights than 16 examples, so a working one should fit them almost perfectly, like a student memorising a single page of answers. If the loss will not drop even then, more data cannot help; something in the pipeline, such as mismatched labels, a wrong loss or a missing optimizer.step(), is broken."
    }
   },
   "feynman": {
    "prompt": "Explain what PyTorch does while it trains a model to your friend who runs a tiffin service in Pune, in 5-8 sentences, without jargon.",
    "keyIdeas": [
     {
      "idea": "The training data is fed in small shuffled batches (groups of examples), not all at once.",
      "cues": [
       "batch",
       "small group",
       "groups of",
       "at a time",
       "shuffl",
       "mix up",
       "mixes up",
       "handful",
       "not all at once",
       "few examples"
      ]
     },
     {
      "idea": "For each batch the model makes a guess, and the guess is compared with the right answer to measure how wrong it was.",
      "cues": [
       "how wrong",
       "how far off",
       "how big the",
       "right answer",
       "correct answer",
       "actual answer",
       "real answer",
       "compare",
       "the loss",
       "error"
      ]
     },
     {
      "idea": "PyTorch automatically works out how every number in the model should change, so you do not do that maths by hand.",
      "cues": [
       "automatic",
       "by itself",
       "on its own",
       "works out",
       "figures out",
       "without you",
       "the maths",
       "gradient",
       "autograd",
       "calculus"
      ]
     },
     {
      "idea": "Every number is then nudged a little in the direction that makes the mistake smaller.",
      "cues": [
       "nudge",
       "tweak",
       "adjust",
       "slightly",
       "small step",
       "tiny bit",
       "a little",
       "gently",
       "update",
       "change each"
      ]
     },
     {
      "idea": "This loop repeats for many rounds over all the data (epochs) until the guesses are good.",
      "cues": [
       "again and again",
       "over and over",
       "repeat",
       "many rounds",
       "many times",
       "several times",
       "full pass",
       "all the data",
       "epoch",
       "loop"
      ]
     },
     {
      "idea": "It can run on a GPU, a graphics chip that does thousands of small sums at once, which makes training much faster.",
      "cues": [
       "gpu",
       "graphic",
       "parallel",
       "simultaneous",
       "faster",
       "quicker",
       "speed up",
       "video game",
       "thousands of sums",
       "many sums"
      ]
     }
    ],
    "jargon": [
     "tensor",
     "autograd",
     "gradient",
     "GPU",
     "Dataset",
     "DataLoader",
     "batch",
     "epoch",
     "nn.Module",
     "optimiser",
     "state_dict",
     "checkpoint"
    ],
    "model": "Think of training a model as teaching a new cook in your tiffin kitchen to pack the right amount of dal for each customer. PyTorch is a set of ready kitchen tools that makes this teaching quick. It does not show the cook all 1,000 past orders at once; it serves them in small batches, say 32 orders at a time, in a shuffled order. For each batch the cook guesses the amounts, and PyTorch compares them with the right answer to measure how wrong they were. Then, instead of you doing pages of maths, PyTorch works out automatically how each of the cook's habits should change. It nudges every habit a little in the right direction, and wipes the old corrections clean before the next batch so they do not pile up. The loop repeats for many rounds through all the orders. All of this can run on a GPU, a graphics chip that does thousands of small sums at once, so training finishes in minutes instead of hours."
   },
   "socratic": [
    {
     "q": "What does calling loss.backward() do in PyTorch, and where does it store the results?",
     "hint": "Think about what autograd was quietly recording while you computed the loss.",
     "answer": "It walks back through the record of operations that autograd kept while the loss was computed, uses the chain rule to calculate every gradient, and stores each one in the .grad attribute of the tensors made with requires_grad=True."
    },
    {
     "q": "Why does a training loop call optimizer.zero_grad() at the start of every step, instead of just once before training begins?",
     "hint": "Does backward() replace the numbers in .grad, or add to them?",
     "answer": "Because backward() adds new gradients to whatever is already in .grad. If you cleared them only once, every batch would add its gradients to the pile from all the earlier batches, so each update would use wrong, ever-growing numbers."
    },
    {
     "q": "A Chennai startup has 1,000 used-car listings in a CSV file and builds a PyTorch price model with batch_size=32. How many training steps make one epoch, and what does the last batch look like?",
     "hint": "Divide 1,000 by 32 and look at what is left over; by default the DataLoader keeps the last, smaller batch.",
     "answer": "1,000 ÷ 32 gives 31 full batches (992 cars) plus one last batch of 8 cars, so one epoch is 32 steps. Each full batch is an inputs tensor of shape [32, number of features] and a labels tensor of shape [32]; the last one has 8 rows instead of 32."
    },
    {
     "q": "Your model reaches almost zero loss on one batch of 16 examples, so the 'overfit one batch' check passes. Does that prove the model will work well on new data?",
     "hint": "Ask what memorising 16 examples shows about your code, and what it says about examples the model has never seen.",
     "answer": "No. Passing only shows that the pipeline works: the labels, the loss, backward() and optimizer.step() are wired correctly, so the model is able to learn. Memorising 16 examples is overfitting on purpose, so it says nothing about new data. Next, train on the full training set and watch the validation loss and accuracy, adding dropout or weight decay if the gap between training and validation grows."
    },
    {
     "q": "In Level 2, scikit-learn trained a model with one call to fit(). How is Keras's model.fit() like that, and how does it relate to the training loop you write yourself in PyTorch?",
     "hint": "List the steps your PyTorch loop does for each batch, then imagine them hidden inside one call.",
     "answer": "Like scikit-learn's fit(), Keras's model.fit() hides the whole training loop inside one call: for every batch it does the forward pass, computes the loss, backpropagates and updates the weights, for as many epochs as you ask. PyTorch makes you write those steps yourself, which is more work but lets you see and change every part."
    }
   ],
   "nididhyasana": "PyTorch does the hard maths for you, but it cannot tell whether your training loop makes sense. What is the difference between knowing which lines to type and understanding what each line does?",
   "sravana": [
    "In the autograd lessons, listen for how PyTorch records each operation while the loss is computed and then walks that record backwards when you call backward().",
    "In the training pipeline lessons, listen for the order of the steps inside the loop, and why zero_grad() comes before backward() and step().",
    "In the GPU lessons, listen for how the model and every batch are moved to the same device with .to(device), and what error appears if one is left on the CPU."
   ],
   "topics": [
    "tensors and autograd",
    "dataset and dataloader",
    "training loop",
    "gpu and devices",
    "saving and loading",
    "keras",
    "debugging training"
   ],
   "quizTags": {
    "l3-pytorch-q01": {
     "topic": "tensors and autograd",
     "skill": "remember"
    },
    "l3-pytorch-q02": {
     "topic": "dataset and dataloader",
     "skill": "understand"
    },
    "l3-pytorch-q03": {
     "topic": "keras",
     "skill": "remember"
    },
    "l3-pytorch-q04": {
     "topic": "gpu and devices",
     "skill": "apply"
    },
    "l3-pytorch-q05": {
     "topic": "training loop",
     "skill": "understand"
    },
    "l3-pytorch-q06": {
     "topic": "saving and loading",
     "skill": "apply"
    },
    "l3-pytorch-q07": {
     "topic": "debugging training",
     "skill": "analyse"
    },
    "l3-pytorch-q08": {
     "topic": "tensors and autograd",
     "skill": "apply"
    },
    "l3-pytorch-q09": {
     "topic": "dataset and dataloader",
     "skill": "apply"
    },
    "l3-pytorch-q10": {
     "topic": "debugging training",
     "skill": "apply"
    },
    "test-l3-q04": {
     "topic": "training loop",
     "skill": "analyse"
    },
    "test-l3-q08": {
     "topic": "dataset and dataloader",
     "skill": "apply"
    },
    "test-l3-q09": {
     "topic": "training loop",
     "skill": "understand"
    },
    "test-l3-q12": {
     "topic": "debugging training",
     "skill": "analyse"
    }
   }
  },
  "l3-cv": {
   "cards": {
    "overview": {
     "recall": "In the saree-inspection picture, what do a convolution and pooling do, and what does each deeper layer get to see?",
     "answer": "A convolution slides a small grid of learned numbers (a filter) across the image patch by patch, like a magnifying glass. Pooling shrinks the result, so each deeper layer sees a bigger area: first edges and colours, then patterns, then whole shapes.",
     "why": "How is a CNN's climb from edges to patterns to whole shapes like the way you recognise an autorickshaw from far away?",
     "whyAnswer": "You do not check every dot of the picture; you notice simple pieces such as curved edges and the yellow and green colours, then patterns such as the canopy and three wheels, and finally the whole vehicle. A CNN builds the same ladder: early filters find edges and colours, and later layers combine them into parts and shapes."
    },
    "outcomes": {
     "recall": "According to the outcomes, which three ideas must you explain after running a pretrained YOLO model, and what does mAP stand for?",
     "answer": "Bounding boxes, IoU and mAP. mAP stands for mean average precision, the standard score for object detection.",
     "why": "When would a client need segmentation rather than detection, for example a farmer who wants to know how much of a leaf is diseased?",
     "whyAnswer": "Detection only draws a box around each object, which is enough to find or count things such as pests or vehicles. When the exact shape or area matters, such as how much of a leaf is diseased or how much of a road is flooded, a box is too rough, so you need segmentation, which labels every pixel."
    },
    "studySteps": {
     "recall": "In the transfer learning study step, what do you fine-tune, and roughly how many photos per class do you use?",
     "answer": "You fine-tune a pretrained ResNet from torchvision on a small dataset of your own, about 100 to 200 photos per class.",
     "why": "Why do the study steps ask you to run YOLO on a photo or video of an Indian street, instead of only on a tutorial's sample images?",
     "whyAnswer": "Tutorial images usually look like the scenes the model was trained on, so it seems perfect there. Indian streets have autorickshaws, crowded mixed traffic and different lighting, so you see where the model struggles, just as a real client project would. Spotting those gaps tells you what data you would need to collect."
    },
    "keyTerms": {
     "recall": "What is the difference between object detection and segmentation, and what does IoU measure?",
     "answer": "Object detection finds each object and draws a labelled box around it, while segmentation labels every pixel with a class. IoU measures how much a predicted box overlaps the true box, from 0 (no overlap) to 1 (a perfect match).",
     "why": "Why can flipping, rotating or brightening your photos help a model cope with real-world variety, and when would a flip be a bad idea?",
     "whyAnswer": "Real photos come from different angles, lights and phones, and small changes like these do not change what the object is, so augmented copies teach the model to focus on the object itself. A change that alters the meaning does harm: flipping a 'No Left Turn' sign makes it look like 'No Right Turn', which creates wrongly labelled examples."
    },
    "indiaExample": {
     "recall": "In Wadhwani AI's cotton pest system, what does the object detection model do with a phone photo of a trap, and how is the result used?",
     "answer": "It finds and counts each pest, such as the pink bollworm, in the photo of the trap. The count helps decide whether spraying is needed.",
     "why": "Why is counting pests in a trap a job for object detection rather than simple image classification?",
     "whyAnswer": "Classification gives one label for the whole photo, such as 'pests present', which cannot say how many there are. Detection finds each pest separately with its own box, so the boxes can be counted. The number is what matters, because a few pests may not justify spraying while many do."
    },
    "commonMistakes": {
     "recall": "Why is training a CNN from scratch on a few hundred photos a mistake, and what should you do instead?",
     "answer": "With so little data the network cannot learn good features on its own and overfits. Start from a pretrained model and fine-tune it; it trains faster and is usually far more accurate.",
     "why": "Why must you check a model's licence, such as Ultralytics YOLO's AGPL-3.0, before you build a paid product for a client?",
     "whyAnswer": "A licence sets the rules for using someone else's work. Under AGPL-3.0, if you share software built on the model or run it as a web app for others, you generally must release its source code under the same licence. That is why Ultralytics asks companies that want a closed product to buy an Enterprise licence. Finding this out after delivery could force a costly rebuild or cause legal trouble for your client."
    },
    "selfCheck": {
     "recall": "What does the self-check of running a pretrained YOLO model on five photos of a busy Indian road prove you can do?",
     "answer": "It proves you can test a model in real local conditions, spot what it misses or mislabels (such as autorickshaws, which are not among COCO's 80 classes), and plan the labelled data you would collect to fix it.",
     "why": "Why does the self-check warn against using photos of people without their consent, and how does India's DPDP Act come into it?",
     "whyAnswer": "A face can identify a person, so under India's Digital Personal Data Protection (DPDP) Act it counts as personal data, and using it needs a lawful basis such as the person's consent. Training on photos taken without consent harms people's privacy and exposes a client to legal risk, so practise on objects such as tomatoes or parcels."
    }
   },
   "feynman": {
    "prompt": "Explain how a computer can tell a ripe tomato from an unripe one in a photo to your friend who runs a vegetable stall in Nashik, in 5-8 sentences, without jargon.",
    "keyIdeas": [
     {
      "idea": "To a computer a photo is just a grid of tiny dots (pixels), each stored as numbers for its colour or brightness.",
      "cues": [
       "grid",
       "pixel",
       "dots",
       "tiny squares",
       "small squares",
       "as numbers",
       "of numbers",
       "into numbers",
       "brightness",
       "colour value"
      ]
     },
     {
      "idea": "A small window (a filter) slides across the photo piece by piece, looking for one kind of pattern.",
      "cues": [
       "slide",
       "sliding",
       "magnifying",
       "small window",
       "part by part",
       "piece by piece",
       "patch",
       "moves across",
       "over the photo",
       "small area"
      ]
     },
     {
      "idea": "Early layers spot simple things such as edges and colours, and later layers combine them into bigger shapes and whole objects.",
      "cues": [
       "edge",
       "outline",
       "curve",
       "shape",
       "combin",
       "build up",
       "builds up",
       "joins",
       "deeper layer",
       "later layer"
      ]
     },
     {
      "idea": "It learns these patterns by itself from many example photos that people have labelled.",
      "cues": [
       "labelled",
       "labeled",
       "tagged",
       "marked",
       "examples",
       "example photo",
       "example pic",
       "many photos",
       "hundreds of",
       "thousands of"
      ]
     },
     {
      "idea": "Starting from a model already trained on millions of photos means a few hundred of your own photos are enough (transfer learning).",
      "cues": [
       "already trained",
       "already learned",
       "already learnt",
       "millions of",
       "pretrained",
       "pre-trained",
       "head start",
       "few hundred",
       "borrow",
       "from scratch"
      ]
     },
     {
      "idea": "Extra copies of each photo, flipped, turned or made brighter or darker, help it cope with real-world variety (data augmentation).",
      "cues": [
       "flip",
       "rotat",
       "mirror",
       "brighter",
       "darker",
       "lighting",
       "extra copies",
       "different angle",
       "zoom",
       "cropp"
      ]
     }
    ],
    "jargon": [
     "pixel",
     "convolution",
     "filter",
     "kernel",
     "pooling",
     "CNN",
     "feature map",
     "stride",
     "transfer learning",
     "fine-tuning",
     "data augmentation",
     "object detection"
    ],
    "model": "To a computer, a photo of tomatoes is just a grid of tiny dots, each stored as numbers for its colour. The computer looks at it through a small window that slides across the photo patch by patch, the way you check each tomato on your stall one by one. The first round of checks notices simple things such as edges and red or green colours; later rounds combine these into curves and a round shape with a stem, and finally into 'ripe tomato'. Nobody writes these rules: the computer learns them by seeing hundreds of photos labelled 'ripe' or 'unripe' and correcting itself each time. We do not start from zero either. We take a model already trained on millions of everyday photos, so it knows edges and shapes, and teach it just our two labels with a few hundred photos. We also make extra copies of each photo, flipped, slightly turned, brighter or darker, so it still works in the morning sun or under a tube light."
   },
   "socratic": [
    {
     "q": "What does a pooling layer do in a CNN, and why does it help?",
     "hint": "Think of keeping only the biggest number in each 2×2 patch.",
     "answer": "Pooling shrinks a feature map, for example by keeping only the largest value in each 2×2 patch (max pooling). This makes the network faster, lets each deeper layer see a bigger area of the photo, and makes it less sensitive to small shifts."
    },
    {
     "q": "Why does a CNN need far fewer parameters than a fully connected network on the same image?",
     "hint": "Does a filter keep separate weights for every position in the image?",
     "answer": "A filter is a small grid, such as 3×3, and the same weights are reused at every position as it slides across the image (weight sharing). A fully connected layer gives every pixel its own weight in every neuron, so its parameter count explodes, while a convolution's count does not depend on the image size."
    },
    {
     "q": "A Surat parcel company has 300 photos of 'damaged' and 300 of 'intact' parcels taken on its own phones. How would you build the classifier, and how would you check it?",
     "hint": "Think of the transfer learning diagram, augmentation, and the confusion matrix from the self-check.",
     "answer": "Take an ImageNet-pretrained model such as ResNet, replace its head with a 2-class layer, and train the head first with augmentation such as flips, small rotations and brightness changes; then optionally fine-tune the last block with a small learning rate. Keep some photos back, show a confusion matrix on them, and reuse the same resizing and normalisation when predicting."
    },
    {
     "q": "A pretrained YOLO model finds cars and buses on a Delhi road but misses every autorickshaw. Why, and what would fix it?",
     "hint": "Which dataset are standard YOLO models trained on, and which classes does it contain?",
     "answer": "Standard YOLO models are trained on the COCO dataset's 80 everyday classes, which do not include autorickshaws, so the model has never learned that label. Collect photos of autorickshaws in real Indian conditions, draw a labelled box around each one, and fine-tune the detector on them."
    },
    {
     "q": "How is a ResNet skip connection related to the deep-network training problems, such as vanishing gradients, that you met in module 3.1?",
     "hint": "What path does the correction signal take back through a block that adds its input to its output?",
     "answer": "Both are about very deep networks being hard to train. A skip connection adds a block's input straight to its output, so the correction signal gets a direct shortcut back to the early layers, and a block can easily pass its input through unchanged when that is best. Together with ReLU and batch normalisation, this lets networks with 50 or more layers train."
    }
   ],
   "nididhyasana": "A CNN never sees a 'tomato'; it sees numbers, then edges, then shapes. When you recognise a friend's face across a crowded street, what simple pieces might your own eyes be putting together?",
   "sravana": [
    "In the convolution lessons, listen for how the output size depends on the filter size, padding and stride, and work out one example along with the teacher.",
    "In the transfer learning lessons, listen for when to freeze the pretrained layers and train only the new head, and when to unfreeze and fine-tune with a small learning rate.",
    "In the YOLO lessons, listen for how each predicted box gets a class and a confidence score, and how IoU decides whether a box counts as a correct detection."
   ],
   "topics": [
    "convolution and pooling",
    "cnn architectures",
    "data augmentation",
    "transfer learning",
    "object detection",
    "segmentation",
    "opencv and vision transformers"
   ],
   "quizTags": {
    "l3-cv-q01": {
     "topic": "convolution and pooling",
     "skill": "understand"
    },
    "l3-cv-q02": {
     "topic": "object detection",
     "skill": "apply"
    },
    "l3-cv-q03": {
     "topic": "opencv and vision transformers",
     "skill": "remember"
    },
    "l3-cv-q04": {
     "topic": "transfer learning",
     "skill": "apply"
    },
    "l3-cv-q05": {
     "topic": "data augmentation",
     "skill": "analyse"
    },
    "l3-cv-q06": {
     "topic": "cnn architectures",
     "skill": "analyse"
    },
    "l3-cv-q07": {
     "topic": "opencv and vision transformers",
     "skill": "apply"
    },
    "l3-cv-q08": {
     "topic": "convolution and pooling",
     "skill": "apply"
    },
    "l3-cv-q09": {
     "topic": "convolution and pooling",
     "skill": "apply"
    },
    "l3-cv-q10": {
     "topic": "object detection",
     "skill": "apply"
    },
    "test-l3-q01": {
     "topic": "transfer learning",
     "skill": "analyse"
    },
    "test-l3-q03": {
     "topic": "convolution and pooling",
     "skill": "apply"
    },
    "test-l3-q16": {
     "topic": "object detection",
     "skill": "understand"
    },
    "test-l3-q17": {
     "topic": "segmentation",
     "skill": "apply"
    }
   }
  },
  "l3-nlp": {
   "cards": {
    "overview": {
     "recall": "In the shopkeeper picture, what are the two ways of turning text into numbers, and how do they differ?",
     "answer": "The first counts which words appear most often in the customer notes (bag of words and TF-IDF). The later way learns which words mean similar things, such as 'cheap' and 'affordable', and gives them similar numbers (word embeddings).",
     "why": "Why would a word-counting method miss that 'cheap' and 'affordable' mean nearly the same thing, while word embeddings can catch it?",
     "whyAnswer": "Counting gives every word its own separate column, so 'cheap' and 'affordable' are as different to it as 'cheap' and 'late'. Word embeddings learn a list of numbers for each word from the sentences it appears in, and because both words are used in similar sentences about prices, their numbers end up close together. A model can then treat a review that says 'affordable' much like one that says 'cheap'."
    },
    "outcomes": {
     "recall": "According to the outcomes, which simple model is your strong, cheap baseline for text classification, and what must you compare your LSTM with?",
     "answer": "TF-IDF plus logistic regression is the baseline, and you must compare your small LSTM classifier honestly with that TF-IDF baseline.",
     "why": "Why do the outcomes ask you to explain why each cleaning step helps or hurts, instead of simply applying every cleaning step?",
     "whyAnswer": "Each cleaning step throws something away. Lowercasing or fixing short forms such as 'gud' and 'pls' usually helps, but deleting 'not' as a stop word can turn a complaint into praise. Knowing what each step does lets you keep the steps that suit your task and your users' messages."
    },
    "studySteps": {
     "recall": "In the RNN study step, what do you draw before you train a small LSTM classifier in PyTorch?",
     "answer": "You draw how the hidden state, the network's running memory, moves from word to word as the RNN reads the sentence.",
     "why": "Why do the study steps ask you to explain attention to a friend with an English-to-Hindi translation example?",
     "whyAnswer": "English and Hindi put words in different orders, so the word needed next in Hindi is often far from the current position in the English sentence. That makes attention easy to see: for each output word you can point to the input word it should focus on. Explaining it aloud also shows you whether you really understand it."
    },
    "keyTerms": {
     "recall": "What is the difference between an RNN and an LSTM, and what do an LSTM's gates do?",
     "answer": "An RNN reads a sequence one step at a time and passes a hidden state (its running memory) to the next step. An LSTM adds gates, learned switches that decide what to remember and what to forget, so it copes better with long sequences.",
     "why": "Why does TF-IDF give little weight to a word that appears in nearly every document, and how is this like reading a pile of complaint letters?",
     "whyAnswer": "A word found in almost every document, such as 'order' in food-delivery complaints, cannot tell one complaint from another, so its inverse document frequency is low. Words that are frequent in one letter but rare elsewhere, such as 'soggy' or 'refund', show what that letter is really about. A person reading the pile notices those same distinctive words."
    },
    "indiaExample": {
     "recall": "Which two open tools has AI4Bharat at IIT Madras built for Indian languages, and what does the Indic NLP Library do?",
     "answer": "IndicTrans2, a translation model for all 22 scheduled languages, and IndicFT, fastText word embeddings for 11 Indian languages. The Indic NLP Library handles tokenisation, normalisation and script conversion for Indian scripts.",
     "why": "Why does the Bhashini mission's aim of public services in the user's own language matter for a farmer in Odisha or a shopkeeper in Tamil Nadu?",
     "whyAnswer": "Many people are far more comfortable reading and speaking their own language than English, so a service that works only in English shuts them out or makes them depend on others. Shared Indian-language datasets and models, such as those on Bhashini's ULCA platform, make it cheaper for apps and public services to support Odia or Tamil, so more people can use them on their own."
    },
    "commonMistakes": {
     "recall": "What goes wrong if you remove stop words such as 'not' or 'no' before training a sentiment model, and why?",
     "answer": "'not good' becomes just 'good', so a complaint can be read as praise. These small words flip the meaning, so check what your cleaning removes, especially for sentiment tasks.",
     "why": "Why should you build a TF-IDF plus logistic regression baseline before an LSTM, even if you expect the LSTM to win?",
     "whyAnswer": "The baseline is fast and cheap and is often close to an LSTM on short texts, so it tells you how much the extra effort of deep learning really buys. If the LSTM is only slightly better, a client may prefer the simpler model that is cheaper to run and easier to explain. Without the baseline you cannot judge either way."
    },
    "selfCheck": {
     "recall": "What does the self-check of finding biased nearest neighbours in pretrained word vectors prove you can do?",
     "answer": "It proves you can inspect word embeddings for gender or other bias, and explain how that bias could harm a real tool, such as one that screens resumes.",
     "why": "Why does the last self-check ask you to notice that Indian-language words are often typed in Roman letters, and how does that affect a word-counting model?",
     "whyAnswer": "When people type Hindi or Tamil in Roman letters, one word can be spelled several ways, and the same word may also appear in its own script, so a word-counting model sees several unrelated tokens for one meaning. Its counts get split and it learns less from each. Normalising spellings and using tools built for Indian languages, such as the Indic NLP Library, helps it treat them as one word."
    }
   },
   "feynman": {
    "prompt": "Explain how a computer can read thousands of customer reviews and tell happy ones from angry ones to your aunt who runs a saree shop in Surat with an online store, in 5-8 sentences, without jargon.",
    "keyIdeas": [
     {
      "idea": "A computer only works with numbers, so the text of each review must first be turned into numbers.",
      "cues": [
       "into numbers",
       "to numbers",
       "only numbers",
       "understand numbers",
       "as numbers",
       "with numbers",
       "convert",
       "turn the words",
       "turns the words",
       "turning text"
      ]
     },
     {
      "idea": "The text is cleaned and split into small pieces, usually words (tokenisation).",
      "cues": [
       "split",
       "break",
       "pieces",
       "separate words",
       "chop",
       "clean",
       "token",
       "spelling",
       "lowercase",
       "small parts"
      ]
     },
     {
      "idea": "A simple method counts how often each word appears, giving more weight to words that are rare across all reviews (bag of words and TF-IDF).",
      "cues": [
       "count how",
       "counts how",
       "counting",
       "how often",
       "how many times",
       "frequen",
       "rare",
       "less weight",
       "more weight",
       "tf-idf"
      ]
     },
     {
      "idea": "A smarter method gives words with similar meanings similar numbers, so they sit close together (word embeddings).",
      "cues": [
       "similar meaning",
       "mean the same",
       "means the same",
       "same meaning",
       "similar words",
       "similar numbers",
       "close together",
       "in meaning",
       "nearly the same",
       "synonym"
      ]
     },
     {
      "idea": "Word order and small words such as 'not' matter, so some models read word by word while keeping a memory (RNNs and LSTMs).",
      "cues": [
       "not good",
       "not bad",
       "not happy",
       "'not",
       "small words",
       "word order",
       "order of",
       "word by word",
       "memory",
       "earlier words"
      ]
     },
     {
      "idea": "It learns from many past reviews already labelled happy or angry, and then predicts the label of new reviews.",
      "cues": [
       "labelled",
       "labeled",
       "marked",
       "tagged",
       "already sorted",
       "examples",
       "past reviews",
       "old reviews",
       "star rating",
       "new review"
      ]
     }
    ],
    "jargon": [
     "token",
     "tokenisation",
     "stop words",
     "bag of words",
     "TF-IDF",
     "word embedding",
     "vector",
     "Word2Vec",
     "RNN",
     "LSTM",
     "attention",
     "logistic regression"
    ],
    "model": "A computer cannot read words the way you do; it only works with numbers, so first we turn each review into numbers. We clean the text and split it into small pieces, usually words, so 'Saree colour faded!!' becomes 'saree', 'colour' and 'faded'. The simplest method counts how often each word appears, and gives extra weight to words that are rare across all reviews, such as 'faded' or 'gorgeous', because a word like 'saree' appears everywhere and tells us nothing new. A smarter method gives every word a list of numbers, so that words with similar meaning, like 'lovely' and 'beautiful', get similar numbers and sit close together. Some models also read a review word by word with a running memory, so they notice that 'not good' is a complaint. To learn, the computer studies thousands of past reviews already labelled happy or angry and finds which patterns go with each. Then it can sort every new review in seconds, so you can reply to the angry ones first."
   },
   "socratic": [
    {
     "q": "What is a bag of words, and what information does it throw away?",
     "hint": "Think about what happens to 'dog bites man' and 'man bites dog'.",
     "answer": "A bag of words represents a document by counting how often each word appears in it. It throws away word order, so 'dog bites man' and 'man bites dog' get exactly the same counts."
    },
    {
     "q": "Why do LSTMs cope with long sentences better than simple RNNs?",
     "hint": "Think about what happens to an early word's memory after it has been passed through many steps.",
     "answer": "In a simple RNN the memory is rewritten at every word, so information from early words fades. During training the correction signal also shrinks each time it is passed back through a step (vanishing gradients), so links between far-apart words are hard to learn. An LSTM has gates, learned switches that decide what to keep, forget and output, so it can carry important information, such as the subject of a sentence, across many more words."
    },
    {
     "q": "A Kochi bank receives thousands of customer emails a week and wants them sorted into 'card', 'loan' and 'account' queues. What would you build first, and how would you judge it?",
     "hint": "Think of the cheap baseline from the common mistakes card, and a score that still works when the queues have uneven sizes.",
     "answer": "Start with TF-IDF plus logistic regression, which is fast, cheap and often strong on short texts. Hold back a labelled test set, report the F1 score for each queue, and look at the words that push emails towards each class. Only try an LSTM or a transformer if the baseline is not good enough."
    },
    {
     "q": "A sentiment model trained only on English reviews gets Hinglish messages typed in Roman letters badly wrong. Why might that happen?",
     "hint": "Think about what an English tokeniser, stop-word list and vocabulary have seen before.",
     "answer": "Its tokeniser, stop-word list and vocabulary were built for English, so Hindi words typed in Roman letters are unknown or split badly, and the same word appears in many spellings. The model has never learned what those words mean. Use tools and models built for Indian languages, normalise spelling variants, and test on real messages from your users."
    },
    {
     "q": "How does attention in sequence-to-sequence models lead to the transformers in the next module?",
     "hint": "What problem did attention solve for the decoder, and what if a model were built from attention alone?",
     "answer": "Attention lets the decoder look back at all the input words and focus on the most relevant ones, instead of squeezing the whole sentence into one memory vector. Transformers take this further: they are built mainly from attention layers, so every word can look at every other word, and they drop the slow word-by-word reading of RNNs."
    }
   ],
   "nididhyasana": "To a computer, 'not good' and 'good' can look almost the same. When you read a message from a friend, how much of its meaning comes from small words and word order rather than from the big words?",
   "sravana": [
    "In the TF-IDF lessons, listen for why a word that appears in almost every document gets a low weight, and work out one TF-IDF score along with the teacher.",
    "In the Word2Vec lessons, listen for how the model learns a word's vector by predicting the word from its neighbours, or the neighbours from the word.",
    "In the LSTM lessons, listen for what each gate (forget, input and output) decides, and how this helps the memory last across a long sentence."
   ],
   "topics": [
    "text preprocessing",
    "bag of words and tf-idf",
    "word embeddings",
    "rnn and lstm",
    "seq2seq and attention",
    "indian language nlp"
   ],
   "quizTags": {
    "l3-nlp-q01": {
     "topic": "text preprocessing",
     "skill": "remember"
    },
    "l3-nlp-q02": {
     "topic": "bag of words and tf-idf",
     "skill": "understand"
    },
    "l3-nlp-q03": {
     "topic": "word embeddings",
     "skill": "understand"
    },
    "l3-nlp-q04": {
     "topic": "text preprocessing",
     "skill": "analyse"
    },
    "l3-nlp-q05": {
     "topic": "rnn and lstm",
     "skill": "apply"
    },
    "l3-nlp-q06": {
     "topic": "seq2seq and attention",
     "skill": "apply"
    },
    "l3-nlp-q07": {
     "topic": "indian language nlp",
     "skill": "apply"
    },
    "l3-nlp-q08": {
     "topic": "bag of words and tf-idf",
     "skill": "apply"
    },
    "l3-nlp-q09": {
     "topic": "bag of words and tf-idf",
     "skill": "apply"
    },
    "l3-nlp-q10": {
     "topic": "word embeddings",
     "skill": "apply"
    },
    "test-l3-q10": {
     "topic": "bag of words and tf-idf",
     "skill": "apply"
    }
   }
  },
  "l3-transformers": {
   "cards": {
    "overview": {
     "recall": "In the meeting picture of self-attention, how does the word 'bank' in 'The bank near the river flooded' work out which meaning it has?",
     "answer": "Every word can look at every other word and decide whom to listen to. 'bank' pays most attention to 'river', so it understands it is a riverbank, not a money bank.",
     "why": "How is self-attention like the way you work out what 'it' means in 'The cupboard did not fit through the door because it was too wide'?",
     "whyAnswer": "You look back at the other words and ask which one 'it' most likely means; 'too wide' points to the cupboard, not the door. Self-attention does this for every word at once: each word compares itself with all the others and mixes in information from the ones that matter. Change 'too wide' to 'too narrow' and your attention, like the model's, shifts to 'door'."
    },
    "outcomes": {
     "recall": "According to the outcomes, which four things should you check on a model card before using a model for a client?",
     "answer": "The model's training data, the languages it covers, its licence and its known limits.",
     "why": "Why does Indian-language text often need more tokens than English with a tokenizer trained mostly on English, and why should a client care?",
     "whyAnswer": "A sub-word tokenizer learns its pieces from its training text, so with little Hindi or Tamil in that text it has few pieces for those scripts and breaks words into many tiny fragments. More tokens mean a higher cost per message, slower replies and less text fitting within the model's input limit. A tokenizer and model trained with plenty of Indian-language text serve such clients better."
    },
    "studySteps": {
     "recall": "In the Lab study step, which three kinds of sentence do you tokenise, and what do you compare?",
     "answer": "An English sentence, a Hindi sentence and a Hinglish sentence. You compare how many tokens each one becomes and where the splits fall.",
     "why": "Why do the study steps ask you to compare your fine-tuned BERT-style model with your TF-IDF baseline from module 3.4?",
     "whyAnswer": "A fine-tuned transformer needs a GPU, more time and more money to train and run, so you should know whether it really beats the cheap baseline on your data. If the gain is small, the simpler model may be the better product for the client. An honest comparison is how you justify the extra cost."
    },
    "keyTerms": {
     "recall": "What do a token's query, key and value each do in self-attention?",
     "answer": "The query asks 'what am I looking for?', the key says 'what do I contain?', and the value is the information passed on. Each token's query is compared with every key to decide how much of each value to mix in.",
     "why": "Why is BERT, which reads text in both directions, suited to sorting messages, while GPT, which sees only earlier tokens, is suited to writing text?",
     "whyAnswer": "To understand a complaint you want to see the whole message at once, the words before and after, which is how an encoder like BERT reads. Writing happens one word at a time, and the next word does not exist yet, so a decoder like GPT is trained to predict the next token from the earlier ones only. Each design matches how its task works."
    },
    "indiaExample": {
     "recall": "What is MuRIL, and why does its training on transliterated text matter for Indian users?",
     "answer": "MuRIL is a BERT model from Google pretrained on 17 Indian languages and on transliterated text. It matters because many Indians type Hindi or Tamil in Roman (English) letters, and a model must understand that kind of writing too.",
     "why": "How would sorting messages for a Marathi-speaking client change if you used an English-only BERT instead of MuRIL or IndicBERT?",
     "whyAnswer": "An English-only BERT has seen little or no Marathi, so its tokenizer breaks Marathi words into many meaningless fragments or unknown tokens, and the model has no learned sense of what they mean. Fine-tuning on a few thousand messages cannot make up for that missing knowledge. MuRIL and IndicBERT already know Indian languages, so fine-tuning only has to teach them your categories."
    },
    "commonMistakes": {
     "recall": "What goes wrong if you fine-tune a pretrained BERT model with too high a learning rate, and what range is usual?",
     "answer": "The big steps damage the pretrained weights, so the model can forget what it knew and, for example, predict the same class for everything. The usual range for BERT is 2e-5 to 5e-5 (0.00002 to 0.00005), with 2 to 4 epochs, while you watch the validation score.",
     "why": "Why must the tokenizer and the model come from the same checkpoint, and how is it like marking a question paper with the right answer key?",
     "whyAnswer": "The tokenizer turns text into ID numbers from its own vocabulary, and the model learned in pretraining what each ID means. A tokenizer from another model gives IDs that mean something else to the model, like marking a Set A paper with the Set B answer key: everything runs, but the results are nonsense. Loading both from the same name with AutoTokenizer and the matching AutoModel avoids this."
    },
    "selfCheck": {
     "recall": "What does the self-check of choosing an encoder or a decoder model for five business tasks prove you can do?",
     "answer": "It proves you can match a model type to a task and give a reason for each choice. An encoder suits understanding tasks, such as classifying lead messages or review sentiment, and a decoder suits generating text, such as drafting replies or product descriptions.",
     "why": "Why does the last self-check ask whether you could use a Hugging Face Hub model in a paid client product?",
     "whyAnswer": "Free to download does not mean free to use in any way: some licences forbid commercial use or add conditions. The model card also shows the data and languages a model was trained on and its known limits, which tells you whether it will work for the client's users. Checking first avoids legal trouble and surprises after delivery."
    }
   },
   "feynman": {
    "prompt": "Explain how self-attention lets a transformer understand a sentence to your cousin in Class 10 who loves cricket, in 5-8 sentences, without jargon.",
    "keyIdeas": [
     {
      "idea": "Every word in the sentence looks at every other word, not only at its neighbours.",
      "cues": [
       "every other word",
       "the other words",
       "all other words",
       "the others",
       "each other",
       "every word looks",
       "each word looks",
       "looks at all",
       "looks at every",
       "whole sentence"
      ]
     },
     {
      "idea": "Each word decides how much to pay attention to each of the others, focusing most on the words that matter for it.",
      "cues": [
       "pay attention",
       "pays attention",
       "attention to",
       "most attention",
       "focus",
       "listen",
       "care about",
       "how much to",
       "weight",
       "relevant"
      ]
     },
     {
      "idea": "Each word then updates its own meaning by mixing in information from the words it focuses on, so its meaning depends on its context.",
      "cues": [
       "mix",
       "blend",
       "combin",
       "updat",
       "context",
       "surround",
       "information from",
       "its own meaning",
       "new meaning",
       "meaning depends"
      ]
     },
     {
      "idea": "All the words are handled at the same time rather than one by one, which makes training fast on GPUs.",
      "cues": [
       "same time",
       "at once",
       "all together",
       "parallel",
       "simultaneous",
       "in one go",
       "faster",
       "quicker",
       "graphics",
       "gpu"
      ]
     },
     {
      "idea": "Because everything is read at once, a position number is added to each word so the model knows the word order.",
      "cues": [
       "position",
       "word order",
       "the order",
       "order of",
       "where each word",
       "which word comes",
       "comes first",
       "comes before",
       "place in the",
       "seat number"
      ]
     }
    ],
    "jargon": [
     "token",
     "embedding",
     "self-attention",
     "query",
     "key",
     "value",
     "softmax",
     "multi-head attention",
     "positional encoding",
     "encoder",
     "decoder",
     "tokenizer"
    ],
    "model": "Take the sentence 'Rohit hit the ball over the boundary, and it went for six'. When a transformer reads it, each word looks at every other word in the sentence at the same time, like players in a team huddle where everyone can hear everyone. Each word decides how much to pay attention to each of the others; 'it' pays most attention to 'ball', not to 'Rohit' or 'boundary'. Then each word updates its own meaning by mixing in information from the words it focused on, so the model understands that 'it' means the ball. The same trick tells 'bank' near 'river' apart from a money bank. Because all the words are handled together instead of one by one, this runs very fast on a GPU, a graphics chip that does thousands of sums at once. But reading everything at once would lose the word order, so the model also adds a position number to each word. That is how it knows 'Rohit hit the ball' is different from 'the ball hit Rohit'."
   },
   "socratic": [
    {
     "q": "In an encoder such as BERT, which words can each word look at, and how is that different in a decoder such as GPT?",
     "hint": "Think of the diagram that shows who may look at whom.",
     "answer": "In an encoder every word can look at the whole sentence, both before and after it. In a decoder each word can look only at itself and the earlier words, which is what lets it be trained to predict the next word."
    },
    {
     "q": "Why do BPE and WordPiece tokenizers split a rare or brand-new word into sub-word pieces instead of marking it as unknown?",
     "hint": "What does their vocabulary hold besides whole words?",
     "answer": "Their vocabulary holds frequent pieces of words, and even single characters or bytes, so a new word such as a new app name can be built from known pieces, like 'play' + '##ing'. The model keeps some meaning from the pieces instead of losing the whole word as an unknown token."
    },
    {
     "q": "An Indore insurance company has 8,000 labelled Hindi and Hinglish customer messages in 5 claim types. Which model would you start from, and how would you fine-tune it?",
     "hint": "Think of the Indian-language models in the India example and the learning-rate warning in the common mistakes.",
     "answer": "Start from an encoder pretrained on Indian languages and transliterated text, such as MuRIL or IndicBERT. Add a 5-class classification head (a small output layer with one score per claim type). Fine-tune it with the Hugging Face Trainer at a small learning rate (about 2e-5 to 5e-5) for 2 to 4 epochs. Load the tokenizer from the same checkpoint, keep a held-out test set, report accuracy and F1, and compare with a TF-IDF baseline."
    },
    {
     "q": "A client wants a BERT model to classify legal contracts that are often 3,000 tokens long. What problem will you hit, and how can you handle it?",
     "hint": "Look at the maximum input length in the common mistakes card.",
     "answer": "BERT-style models usually accept at most 512 tokens and cut off the rest, so most of each contract would be ignored. Split each contract into chunks of up to 512 tokens, classify each chunk and combine the results, or choose a model built for longer inputs."
    },
    {
     "q": "How does a transformer's self-attention build on the attention in the seq2seq models from module 3.4?",
     "hint": "In seq2seq, who looked at whom? In a transformer, who looks at whom?",
     "answer": "In seq2seq, attention let the decoder look back at all the encoder's words while writing each output word. Self-attention lets every word in a sentence look at every other word of the same sentence, at every layer, and the transformer is built mainly from such layers, dropping the RNN's word-by-word reading."
    }
   ],
   "nididhyasana": "In a transformer, a word's meaning is never fixed; it is built from the words around it. Think of a word you use often, such as 'light' or 'match'. How does the sentence around it change what it means?",
   "sravana": [
    "In the self-attention lessons, listen for how each word's query is compared with every key, and how a softmax turns those scores into weights that add up to 1.",
    "In the positional encoding lessons, listen for why a transformer without positions cannot tell 'Ravi paid Mohan' from 'Mohan paid Ravi'.",
    "In the Hugging Face fine-tuning chapter, listen for how the tokenizer and model are loaded from the same checkpoint and how the Trainer runs the training loop for you."
   ],
   "topics": [
    "self-attention",
    "positional encoding",
    "encoder vs decoder",
    "tokenizers",
    "hugging face pipelines",
    "fine-tuning"
   ],
   "quizTags": {
    "l3-transformers-q01": {
     "topic": "positional encoding",
     "skill": "understand"
    },
    "l3-transformers-q02": {
     "topic": "encoder vs decoder",
     "skill": "remember"
    },
    "l3-transformers-q03": {
     "topic": "hugging face pipelines",
     "skill": "remember"
    },
    "l3-transformers-q04": {
     "topic": "fine-tuning",
     "skill": "apply"
    },
    "l3-transformers-q05": {
     "topic": "tokenizers",
     "skill": "analyse"
    },
    "l3-transformers-q06": {
     "topic": "tokenizers",
     "skill": "understand"
    },
    "l3-transformers-q07": {
     "topic": "self-attention",
     "skill": "understand"
    },
    "l3-transformers-q08": {
     "topic": "self-attention",
     "skill": "apply"
    },
    "l3-transformers-q09": {
     "topic": "self-attention",
     "skill": "apply"
    },
    "l3-transformers-q10": {
     "topic": "tokenizers",
     "skill": "apply"
    },
    "test-l3-q06": {
     "topic": "encoder vs decoder",
     "skill": "apply"
    },
    "test-l3-q07": {
     "topic": "tokenizers",
     "skill": "analyse"
    },
    "test-l3-q11": {
     "topic": "self-attention",
     "skill": "understand"
    },
    "test-l3-q15": {
     "topic": "self-attention",
     "skill": "apply"
    },
    "test-l3-q19": {
     "topic": "fine-tuning",
     "skill": "analyse"
    }
   }
  },
  "l3-mlops": {
   "cards": {
    "overview": {
     "recall": "In the cloud kitchen picture, which MLOps tool or idea matches the order window, the standard sealed box and the regular tasting?",
     "answer": "The order window is an API, so other apps can send requests; the standard sealed box is a Docker container, so the app runs the same everywhere; and the regular tasting is monitoring for data drift.",
     "why": "Why does a model that scored well in a notebook still need monitoring after launch, the way a cloud kitchen keeps tasting its dishes?",
     "whyAnswer": "The world keeps changing after training: customers' habits, prices and tastes shift, for example around Diwali and big sale seasons. A model trained on ordinary months can quietly get worse when live data stops looking like its training data, and nobody notices unless someone checks. Monitoring is the regular tasting that catches this early."
    },
    "outcomes": {
     "recall": "According to the outcomes, which three things should your basic monitoring watch after you deploy a demo?",
     "answer": "Errors, response time and data drift.",
     "why": "Why do the outcomes ask for a FastAPI endpoint that checks its input, and what could happen in a real app without that check?",
     "whyAnswer": "Real users and apps send empty fields, wrong types and odd values, not the tidy data from your notebook. Without checks, a bad request can crash the app or, worse, produce a confident but meaningless prediction. Checking the input first lets the API return a clear error message instead."
    },
    "studySteps": {
     "recall": "In the first study step, which endpoint do you build for your saved model, and where do you test it?",
     "answer": "You build a /predict endpoint with FastAPI (or Flask) and test it from FastAPI's automatic /docs page.",
     "why": "Why do the study steps ask you to log each request's inputs and response time from the start, before anything has gone wrong?",
     "whyAnswer": "Drift can only be spotted by comparing live inputs with the training data, and slow answers only by looking at past timings, so you need a record of what happened. If you start logging only after a client complains, there is nothing to compare with. A log kept from day one works like a shop's daily sales register: it shows when things began to change."
    },
    "keyTerms": {
     "recall": "What is the difference between MLflow and DVC?",
     "answer": "MLflow records each training run's settings, metrics and model files, so you can compare runs and reproduce the best one. DVC tracks versions of large data and model files next to your Git code, without putting the big files inside Git.",
     "why": "How is data drift like a sweet shop that plans its stock from ordinary months' sales, and then Diwali week arrives?",
     "whyAnswer": "A plan based on ordinary months works until customers suddenly behave differently, for example buying far more boxes of sweets in festival week. The old numbers no longer describe today's customers, so the plan goes wrong without any alarm. A model that receives live data unlike its training data gets quietly worse in the same way."
    },
    "indiaExample": {
     "recall": "Which two deployment patterns from this module does the India example show, and who uses each one?",
     "answer": "AI4Bharat puts live demos of its Indian-language models, such as Indic Parler-TTS, on Hugging Face Spaces built with Gradio. The Government of India's Bhashini mission offers translation and speech models as APIs that other apps call.",
     "why": "Why does offering a model as an API, as Bhashini does, let many different apps use the same model?",
     "whyAnswer": "An API is a fixed way to send a request and get an answer back. So any app, such as a government website, a banking app or a WhatsApp bot, can send text and receive a translation without knowing how the model works inside. The model is built and improved in one place, and every app benefits, much as many shops use the same UPI system to take payments."
    },
    "commonMistakes": {
     "recall": "Why is loading the model inside the prediction function a mistake, and what should you do instead?",
     "answer": "It reloads the model from disk on every request, which makes the API slow. Load the model once when the app starts and reuse it for every request.",
     "why": "Why should you not promise a client always-on service on a free tier, and what should your quote include instead?",
     "whyAnswer": "Free apps go to sleep when nobody uses them; Render's free web services, for example, spin down after about 15 minutes idle, so the next customer waits through a slow start. A client expects quick answers at any time. Quote a small always-on server with its monthly cost, plus 18% GST on the invoice if you are GST-registered and the client is in India."
    },
    "selfCheck": {
     "recall": "What does the self-check of writing a GitHub Actions workflow and adding a test that fails on purpose prove you can do?",
     "answer": "It proves you can set up continuous integration (CI) that runs your tests on every push, and that it really catches a broken change before it reaches users.",
     "why": "Why does the self-check ask you to share your demo link with three people and note the inputs that broke it?",
     "whyAnswer": "You test your own app with the inputs you expect, but other people type, upload and click in ways you never thought of. Their attempts reveal weak spots, such as empty inputs, odd file types or very long text, before a client finds them. Fixing even one of them makes the app sturdier."
    }
   },
   "feynman": {
    "prompt": "Explain what it takes to turn a trained model into a working product to your friend who runs a cloud kitchen in Gurugram, in 5-8 sentences, without jargon.",
    "keyIdeas": [
     {
      "idea": "The model is put on a server behind a fixed address (an API), so other apps and users can send it a request and get an answer back.",
      "cues": [
       "send it",
       "send a request",
       "request",
       "order window",
       "other apps",
       "web address",
       "api",
       "server",
       "live link",
       "shareable link"
      ]
     },
     {
      "idea": "It is packed with everything it needs into a sealed box (a container), so it runs the same on any computer.",
      "cues": [
       "sealed box",
       "standard box",
       "container",
       "docker",
       "same everywhere",
       "runs anywhere",
       "any machine",
       "any computer",
       "runs the same",
       "works the same"
      ]
     },
     {
      "idea": "A record is kept of which experiment, settings and version of the data made each model, so the best one can be rebuilt.",
      "cues": [
       "record",
       "register",
       "keep track",
       "write down",
       "note down",
       "version",
       "experiment",
       "history",
       "same model again",
       "reproduce"
      ]
     },
     {
      "idea": "Every change is tested automatically before it goes live.",
      "cues": [
       "automatic check",
       "automatic test",
       "automatically test",
       "tested automatically",
       "tests automatically",
       "runs tests",
       "tests every time",
       "before it goes live",
       "quality check",
       "github action"
      ]
     },
     {
      "idea": "After launch the model is watched, because customers' behaviour changes (for example at Diwali) and its predictions can quietly get worse.",
      "cues": [
       "keep an eye",
       "keeps an eye",
       "monitor",
       "keep checking",
       "keeps checking",
       "tasting",
       "diwali",
       "festival",
       "drift",
       "get worse"
      ]
     },
     {
      "idea": "When the live data has changed, new data is collected and the model is retrained.",
      "cues": [
       "retrain",
       "re-train",
       "train it again",
       "train again",
       "teach it again",
       "update the model",
       "new data",
       "fresh data",
       "recent data",
       "latest data"
      ]
     }
    ],
    "jargon": [
     "deployment",
     "API",
     "endpoint",
     "JSON",
     "FastAPI",
     "Docker",
     "container",
     "MLflow",
     "DVC",
     "CI/CD",
     "data drift",
     "latency"
    ],
    "model": "Think of your trained model as a great new recipe. A recipe alone feeds nobody, so first we open an order window: a web address where other apps can send a request, such as a customer's details, and get the model's answer back in a second. Next we pack the model with everything it needs into a sealed box called a container, so it runs the same on any computer, just as your sealed boxes taste the same in every delivery. We keep a register that records which experiment, settings and version of the data made each model, so we can rebuild the best one later. Every time we change the code, an automatic check runs the tests before it goes live, like a quality check at your packing counter. After launch we keep checking, because customers change: orders in Diwali week look nothing like orders in July, and the model can quietly get worse. When that happens, we collect fresh data, retrain, and send the new model through the same checks."
   },
   "socratic": [
    {
     "q": "What does a Docker container hold, and what problem does it solve?",
     "hint": "Think of the 'it works on my machine' problem.",
     "answer": "It holds your code, the Python version, the libraries and the settings in one packaged, isolated box. So the app runs the same on your laptop, a teammate's machine or a cloud server, instead of breaking because of different versions."
    },
    {
     "q": "Why can drift monitoring warn a lender about trouble months before the true loan outcomes arrive?",
     "hint": "Which information exists on the day of each request, and which arrives only later?",
     "answer": "The inputs, such as income and loan amount, and the model's predictions exist the moment each request arrives, while whether a borrower defaults is known only months later. Comparing the live inputs and predictions with the training data shows when the world has changed, so the team can investigate before the losses show up."
    },
    {
     "q": "A Lucknow clinic's appointment app will call your no-show prediction model through an API. What should your FastAPI service do once at startup, and what on every request?",
     "hint": "Think of the diagram of one request through a FastAPI model server.",
     "answer": "At startup, load the trained model and its fitted preprocessing pipeline into memory once. On every request, check the JSON input with a Pydantic model (a class that lists each expected field and its type). If a field is missing or has the wrong type, FastAPI then returns a clear 422 error, its code for invalid input. Next, run the same preprocessing as in training, predict, and return the result as JSON. Also log the inputs and response time for monitoring."
    },
    {
     "q": "Your Gradio demo on a free Hugging Face Space is slow for the first visitor after a quiet spell, then fast. Why, and what would you tell a paying client?",
     "hint": "Look at the common mistakes card about free tiers.",
     "answer": "Free apps go to sleep after a period without visitors, so the first request waits while the app wakes up and loads the model. That is fine for a demo, but for paid work quote a small always-on server and include its monthly cost, so real users never wait for a cold start."
    },
    {
     "q": "How does training-serving skew connect to the scikit-learn Pipelines from module 2.7 on feature engineering?",
     "hint": "What happens if the cleaning and scaling steps in production differ from the ones used in training?",
     "answer": "Training-serving skew happens when production prepares inputs differently from training, for example by skipping a cleaning step or fitting a new scaler on a single request, so the model sees data unlike what it learned from. Saving the whole Pipeline (preprocessing plus model) fitted on the training data, and loading that same object in the API, makes both sides run exactly the same steps."
    }
   ],
   "nididhyasana": "A model learns from the past but is used in the future. What does it mean to trust a model when the world it learned from keeps changing a little every day?",
   "sravana": [
    "In the FastAPI lessons, listen for where the model is loaded (once at startup, not inside the prediction function) and how Pydantic checks each request's input.",
    "In the Docker lessons, listen for the difference between an image and a container, and why a Dockerfile installs the libraries before copying in the code.",
    "In the drift monitoring lesson, listen for how live data is compared with the training data, and which kind of shift should raise an alert to retrain."
   ],
   "topics": [
    "model apis",
    "demos and hosting",
    "docker",
    "experiment tracking and versioning",
    "ci/cd",
    "monitoring and drift"
   ],
   "quizTags": {
    "l3-mlops-q01": {
     "topic": "docker",
     "skill": "understand"
    },
    "l3-mlops-q02": {
     "topic": "experiment tracking and versioning",
     "skill": "remember"
    },
    "l3-mlops-q03": {
     "topic": "experiment tracking and versioning",
     "skill": "understand"
    },
    "l3-mlops-q04": {
     "topic": "demos and hosting",
     "skill": "apply"
    },
    "l3-mlops-q05": {
     "topic": "model apis",
     "skill": "apply"
    },
    "l3-mlops-q06": {
     "topic": "monitoring and drift",
     "skill": "apply"
    },
    "l3-mlops-q07": {
     "topic": "ci/cd",
     "skill": "apply"
    },
    "l3-mlops-q08": {
     "topic": "monitoring and drift",
     "skill": "apply"
    },
    "l3-mlops-q09": {
     "topic": "docker",
     "skill": "analyse"
    },
    "l3-mlops-q10": {
     "topic": "model apis",
     "skill": "analyse"
    },
    "test-l3-q05": {
     "topic": "model apis",
     "skill": "analyse"
    },
    "test-l3-q13": {
     "topic": "experiment tracking and versioning",
     "skill": "apply"
    },
    "test-l3-q14": {
     "topic": "monitoring and drift",
     "skill": "analyse"
    },
    "test-l3-q20": {
     "topic": "demos and hosting",
     "skill": "apply"
    }
   }
  },
  "l4-llm-internals": {
   "cards": {
    "overview": {
     "recall": "What is the one job an LLM does again and again, and how does that one job let it write a whole email?",
     "answer": "It predicts the next token (a small piece of text) from all the text so far. Writing an email is just this prediction repeated hundreds of times, with each new token added to the text before the next guess.",
     "why": "How is an LLM like the word suggestions on your phone keyboard, and how is it different?",
     "whyAnswer": "Both look at the words so far and suggest what is likely to come next. Your keyboard suggests one short word, while an LLM is trained on a large part of the internet and keeps predicting token after token, so it can produce a whole email, code or a summary. Neither one looks facts up; both only guess what text is likely."
    },
    "outcomes": {
     "recall": "According to the outcomes, what is the Chinchilla rule of thumb, and which three sampling settings should you be able to choose?",
     "answer": "The Chinchilla rule of thumb is about 20 training tokens for every model parameter. The three sampling settings are temperature, top-k and top-p.",
     "why": "By the Chinchilla rule of thumb, about how many training tokens suit a 1-billion-parameter model, and why is training it on far less text a waste?",
     "whyAnswer": "About 20 × 1 billion = 20 billion tokens. With much less text, the model has more parameters than its data can usefully fill, so it is undertrained. For the same computing budget, a smaller model trained on more text would usually do better."
    },
    "studySteps": {
     "recall": "In the BPE step of the study plan, what check shows that your tokeniser works after you encode and decode a sentence?",
     "answer": "Decoding the tokens must give back exactly the same sentence you started with. If any character changes or goes missing, the tokeniser has a bug.",
     "why": "Why does the study plan tell you to type the GPT code yourself and print tensor shapes, instead of pasting whole cells?",
     "whyAnswer": "Typing makes you read every line and notice what it does, and printing shapes such as (B, T, C) shows whether each step changes the data the way you expect. Most bugs in this module are shape bugs, so seeing the shapes as you go catches them early, like checking each brick while building a wall instead of after it falls."
    },
    "keyTerms": {
     "recall": "What is the difference between temperature and top-p sampling?",
     "answer": "Temperature makes the next-token probabilities sharper (low temperature) or flatter (high temperature) before a token is picked. Top-p keeps only the smallest group of most likely tokens whose probabilities add up to p, such as 0.9, and picks from that group.",
     "why": "How does a KV cache save time when a model writes a long answer, and why does it need more memory as the conversation grows?",
     "whyAnswer": "Each new token must look back at all earlier tokens, which needs their keys and values from the attention layers. The KV cache saves these instead of recomputing them for every new token, so writing is much faster. But it keeps keys and values for every token in the context, and for every user served at once, so its memory grows with the length of the conversation."
    },
    "indiaExample": {
     "recall": "What does the 'fertility' figure in Sarvam-1's model card measure, and why is a lower number better?",
     "answer": "Fertility is the average number of tokens per word. Fewer tokens per word means cheaper, faster processing and more text fitting into the same context window.",
     "why": "Sarvam-30B has 128 experts but sends each token to only 6. How is this like a large hospital where each patient sees only a few specialists?",
     "whyAnswer": "The hospital has many specialists, but each patient sees only the few that fit their problem, so each visit uses little doctor time. In the same way, the router sends each token to 6 experts, so only about 2.4 billion parameters (not counting embeddings) work on each token and compute stays low. But just as the hospital must still employ all its doctors, all 128 experts must stay loaded in memory."
    },
    "commonMistakes": {
     "recall": "Why does setting the temperature to 0 not make an LLM's answers correct?",
     "answer": "Temperature 0 only makes the model pick the most likely token every time. If the most likely answer is wrong, it simply becomes a consistently wrong answer.",
     "why": "When a client needs facts to be right, why is putting the source text in the prompt safer than trusting what the model 'knows'?",
     "whyAnswer": "The model does not look facts up; it predicts likely text from patterns in its training data, so it can state a false fact confidently. When the source text is in the prompt, the likely continuation is based on that text, so the answer is more often right and can be checked against the source. This is the idea behind RAG in the next module."
    },
    "selfCheck": {
     "recall": "What does the context-window task prove you can do, and how many document tokens fit in 8,192 tokens with a 1,000-token system prompt and 1,500 answer tokens?",
     "answer": "It proves you can budget the tokens of one request. 8,192 − 1,000 − 1,500 = 5,692 tokens are left for the document; if it is longer, split it into parts or send only the most relevant parts.",
     "why": "Why does the same message often need more tokens in Hindi written in Devanagari script than in English, and what does that mean for a client's bill?",
     "whyAnswer": "Many tokenisers learned their merges mostly from English text, so common English words become single tokens while Hindi words are split into many small pieces. More tokens for the same message means a higher API bill in rupees and less text fitting into the context window. A tokeniser built for Indian scripts, like Sarvam-1's, narrows this gap."
    }
   },
   "feynman": {
    "prompt": "Explain how a ChatGPT-style AI writes its reply, one small piece at a time, to your cousin in Class 10 who thinks it searches the internet for every answer. Use 5-8 sentences and no jargon.",
    "keyIdeas": [
     {
      "idea": "It writes by guessing the next small piece of text from everything written so far, adding it, and repeating.",
      "cues": [
       "next word",
       "next piece",
       "next token",
       "come next",
       "comes next",
       "comes after",
       "word after",
       "guess",
       "predict",
       "at a time"
      ]
     },
     {
      "idea": "It became good at this by practising on a huge amount of text, such as books and websites, during training.",
      "cues": [
       "huge amount",
       "lots of text",
       "huge pile",
       "billions of",
       "crores of",
       "books",
       "websites",
       "reading",
       "training",
       "trained"
      ]
     },
     {
      "idea": "The text is cut into small pieces (tokens) that can be whole words, parts of words or single letters, and some languages need more pieces.",
      "cues": [
       "of words",
       "part of a",
       "parts",
       "pieces",
       "little bits",
       "chunk",
       "split into",
       "cut into",
       "broken into",
       "chopped"
      ]
     },
     {
      "idea": "It picks among the most likely options with some randomness, controlled by a setting (temperature), so the same question can get different answers.",
      "cues": [
       "random",
       "different answer",
       "different repl",
       "same question",
       "luck",
       "chance",
       "most likely",
       "probab",
       "temperature",
       "dice"
      ]
     },
     {
      "idea": "It does not look up facts; it produces text that sounds likely, so it can say false things confidently.",
      "cues": [
       "look up",
       "looks up",
       "not search",
       "sound",
       "confident",
       "make up",
       "made up",
       "made-up",
       "false",
       "wrong"
      ]
     }
    ],
    "jargon": [
     "token",
     "LLM",
     "next-token prediction",
     "BPE",
     "pretraining",
     "scaling laws",
     "temperature",
     "top-k",
     "top-p",
     "context window",
     "KV cache",
     "mixture of experts"
    ],
    "model": "Think of the word suggestions on your phone keyboard, but far better. ChatGPT does not search the internet for every reply. It writes one small piece at a time: it reads everything written so far, guesses which piece should come next, adds it, and repeats until the answer is done. These pieces are often whole words, but rare words are cut into parts of words, and a sentence in Hindi or Tamil often needs more pieces than the same sentence in English. It became good at guessing by practising on a huge amount of text from books and websites during months of training. When it picks the next piece, it chooses among the most likely options with a little randomness, controlled by a setting called temperature, so the same question can get slightly different answers. Because it only produces text that sounds likely, and does not look up facts, it can say something false in a very confident voice. So for anything important, like your board exam dates, always check the official source."
   },
   "socratic": [
    {
     "q": "What is the one task an LLM is trained on during pretraining, and why does that task need no human labels?",
     "hint": "Think about where the 'right answer' comes from when the model reads ordinary text.",
     "answer": "It is trained to predict the next token from all the tokens before it. No labels are needed because the next token in the text is itself the right answer, so any text can be used for training (this is called self-supervised learning)."
    },
    {
     "q": "Why does a low temperature make the output more predictable and a high temperature make it more random?",
     "hint": "The model's scores are divided by the temperature before they become probabilities. What happens to the gaps between the scores?",
     "answer": "Dividing the scores by a small temperature makes the gaps between them bigger, so after softmax (the step that turns scores into probabilities) the top token takes almost all the probability and is picked nearly every time. A large temperature shrinks the gaps, so the probabilities become flatter and less likely tokens are picked more often."
    },
    {
     "q": "A Chennai legal-tech startup wants to send a 6,000-token court judgment to a model with an 8,192-token context window, using a 1,000-token system prompt and up to 1,500 tokens for the answer. Will it fit, and what can they do?",
     "hint": "Add up everything that must share the window, and remember that the answer counts too.",
     "answer": "1,000 + 6,000 + 1,500 = 8,500 tokens, which is more than 8,192, so it does not fit; only about 5,692 tokens of the judgment can go in. They could split the judgment into parts and summarise each part, send only the most relevant sections (as RAG does), shorten the system prompt or the answer limit, or choose a model with a longer context window."
    },
    {
     "q": "A mixture-of-experts model like Sarvam-30B runs only about 2.4 billion parameters for each token. Why does it still need far more memory than an ordinary 2.4-billion-parameter model?",
     "hint": "Different tokens go to different experts. Where must all the experts be kept so the router can choose any of them?",
     "answer": "The router can send each token to any of the 128 experts, and different tokens pick different ones, so every expert must be loaded in memory and ready. Compute per token stays small, but the memory needed is close to that of the whole model, not just the 2.4 billion active parameters."
    },
    {
     "q": "How does next-token prediction explain why an LLM can state a false fact confidently, and how does the next module, RAG, reduce this problem?",
     "hint": "Ask what the model is really trying to produce: a true sentence, or a likely-sounding one?",
     "answer": "The model is trained to produce likely-sounding text, not to check facts, so a fluent but wrong sentence can come out sounding sure of itself. RAG fetches relevant passages from trusted documents and puts them in the prompt, so the likely continuation is based on that source text. This reduces such errors but does not remove them."
    }
   ],
   "nididhyasana": "If a machine that only ever guesses the next small piece of text can write a good letter, how much of the language you use every day is pattern, and how much is knowing?",
   "sravana": [
    "In the tokenisation lectures, listen for how BPE chooses which pair of characters to merge next, and why the size of the final vocabulary is a choice you make.",
    "When the GPT is coded, listen for where the causal mask is added inside self-attention, and why each position must not see the tokens that come after it.",
    "In the lectures on generating text, listen for how temperature and top-k change the probabilities before a token is picked, and why always picking the top token gives the same text every time."
   ],
   "topics": [
    "next-token prediction",
    "tokenisation (bpe)",
    "building a gpt",
    "pretraining and scaling",
    "sampling and temperature",
    "kv cache and context",
    "moe and reasoning models"
   ],
   "quizTags": {
    "l4-llm-internals-q01": {
     "topic": "next-token prediction",
     "skill": "remember"
    },
    "l4-llm-internals-q02": {
     "topic": "pretraining and scaling",
     "skill": "understand"
    },
    "l4-llm-internals-q03": {
     "topic": "building a gpt",
     "skill": "understand"
    },
    "l4-llm-internals-q04": {
     "topic": "tokenisation (bpe)",
     "skill": "apply"
    },
    "l4-llm-internals-q05": {
     "topic": "moe and reasoning models",
     "skill": "analyse"
    },
    "l4-llm-internals-q06": {
     "topic": "kv cache and context",
     "skill": "understand"
    },
    "l4-llm-internals-q07": {
     "topic": "moe and reasoning models",
     "skill": "understand"
    },
    "l4-llm-internals-q08": {
     "topic": "sampling and temperature",
     "skill": "apply"
    },
    "l4-llm-internals-q09": {
     "topic": "sampling and temperature",
     "skill": "apply"
    },
    "l4-llm-internals-q10": {
     "topic": "tokenisation (bpe)",
     "skill": "apply"
    },
    "test-l4-q01": {
     "topic": "building a gpt",
     "skill": "analyse"
    },
    "test-l4-q02": {
     "topic": "kv cache and context",
     "skill": "apply"
    },
    "test-l4-q03": {
     "topic": "sampling and temperature",
     "skill": "apply"
    }
   }
  },
  "l4-llm-apps": {
   "cards": {
    "overview": {
     "recall": "In the 'brilliant new employee' comparison, what do prompt engineering and RAG each stand for?",
     "answer": "Prompt engineering is writing clear instructions for the LLM, like briefing a new employee. RAG is handing it the right pages from your company files before it answers, so it answers from them.",
     "why": "Why is it usually cheaper and quicker for a Pune agency to build an app that calls an existing LLM through an API than to train its own model?",
     "whyAnswer": "Training a capable LLM needs huge amounts of text, many GPUs and a lot of money, while an API call costs a small amount per request and works today. The agency's real value is in the app around the model: the prompts, the client's documents, the checks and the interface. Most useful LLM products are built this way."
    },
    "outcomes": {
     "recall": "According to the outcomes, which two things must your RAG chatbot do, besides answering, so that people can trust it?",
     "answer": "It must show the source of each answer, and it must say 'I don't know' when the documents do not cover the question.",
     "why": "Why can a bot that sometimes says 'I don't know' be more valuable to a clinic than one that always gives an answer?",
     "whyAnswer": "A wrong but confident answer about timings, fees or medicines can mislead a patient and hurt the clinic's name. Saying 'I don't know' and pointing to the reception number keeps the patient safe and shows the clinic which gap to fill in its documents. People trust a bot more when they know it admits its limits."
    },
    "studySteps": {
     "recall": "In the study plan, how many times do you build the RAG chatbot over 3–5 PDFs, and with what each time?",
     "answer": "Twice: first in plain Python with FAISS or Chroma, writing each piece yourself (chunking, embedding, retrieving and prompting), then again with LangChain or LlamaIndex, so you can see what the framework does for you.",
     "why": "Why should your API key be saved as a Colab secret instead of being typed into the notebook code?",
     "whyAnswer": "Anyone who has your key can spend your quota or run up a bill on your account. Notebooks are often shared or pushed to GitHub, so a key written in the code can leak to strangers. A secret stays out of the code, so sharing the notebook does not share the key."
    },
    "keyTerms": {
     "recall": "What is an embedding, and what does a vector database do with embeddings?",
     "answer": "An embedding is a list of numbers that represents the meaning of a piece of text, so texts with similar meanings get similar numbers. A vector database stores embeddings and quickly finds the ones closest to the embedding of a question.",
     "why": "Why can the question 'Can I pay with PhonePe?' find a chunk about 'UPI or card payments' even though they share almost no words?",
     "whyAnswer": "Embeddings capture meaning, not exact spelling. A good embedding model has seen lots of text where PhonePe appears alongside UPI and payments, so both texts get similar numbers and sit close together. A plain keyword search would miss this match, because the words are different."
    },
    "indiaExample": {
     "recall": "How does Jugalbandi's question-answering service use RAG?",
     "answer": "It uses LLMs to answer questions from a given set of documents, such as information on government schemes, instead of from the model's memory alone.",
     "why": "How would you adapt the Jugalbandi pattern to build a WhatsApp bot for a coaching institute in Kota?",
     "whyAnswer": "Replace the government scheme documents with the institute's own FAQs, such as fees, batch timings and refund rules, then chunk and embed them. Each student's question retrieves the closest chunks, and the LLM answers from them and names the source. Speech models, like the Bhashini ones Jugalbandi uses, could let students ask by voice in their own language."
    },
    "commonMistakes": {
     "recall": "When a RAG bot gives a wrong answer, what should you check before changing the model or the prompt?",
     "answer": "Print the retrieved chunks first. If the answer is not in them, retrieval is the problem, so fix the chunking, the embedding model or k (the number of chunks retrieved) before touching the model.",
     "why": "Why does India's DPDP Act, 2023 matter when you send a client's customer names and phone numbers to a free-tier API?",
     "whyAnswer": "The Act makes you responsible for the personal data you process. Some free tiers, including the Gemini API's, may use what you send to improve their products, so customers' details could be used in ways they never agreed to. Safer choices are a paid tier with clear data terms, a local model through Ollama, or removing personal details before sending."
    },
    "selfCheck": {
     "recall": "What does the chunk-size and k experiment prove you can do?",
     "answer": "It proves you can tune a RAG system with measurements: you try chunk sizes of about 200, 500 and 1,000 tokens and k = 2, 4 and 8, record RAGAS faithfulness and answer-relevance scores in a table, and choose the setting the numbers support.",
     "why": "Why might retrieving more chunks (k = 8 instead of 2) sometimes make the answers worse, not better?",
     "whyAnswer": "More chunks raise the chance that the right passage is included, but they also bring in unrelated text that can distract the model or contradict the right passage. The prompt also gets longer, which costs more tokens and time. That is why you measure a few values of k instead of assuming that more is better."
    }
   },
   "feynman": {
    "prompt": "Explain how a chatbot can answer questions from a clinic's own documents, to your uncle who runs a small dental clinic in Indore and wants a WhatsApp bot for patients. Use 5-8 sentences and no jargon.",
    "keyIdeas": [
     {
      "idea": "Ahead of time, the clinic's documents are cut into small passages and stored so they can be searched by meaning.",
      "cues": [
       "passages",
       "chunks",
       "pieces",
       "bits",
       "sections",
       "paragraphs",
       "parts",
       "into small",
       "cut into",
       "split into"
      ]
     },
     {
      "idea": "When a question comes in, the system finds the few passages closest in meaning to it, even if the words are different.",
      "cues": [
       "closest",
       "relevant",
       "related",
       "similar",
       "meaning",
       "same topic",
       "same thing",
       "search",
       "compare",
       "look for"
      ]
     },
     {
      "idea": "Those passages are given to the AI together with the question, and it is told to answer only from them.",
      "cues": [
       "only from",
       "only using",
       "using only",
       "only use",
       "only th",
       "from those",
       "from them",
       "with the question",
       "plus the question",
       "based on those"
      ]
     },
     {
      "idea": "The bot shows which document or page the answer came from, so people can check it.",
      "cues": [
       "source",
       "which document",
       "which page",
       "which file",
       "came from",
       "comes from",
       "where it got",
       "shows where",
       "verify",
       "reference"
      ]
     },
     {
      "idea": "If the documents do not contain the answer, the bot says it does not know instead of making something up.",
      "cues": [
       "n't know",
       "n’t know",
       "not know",
       "dont know",
       "doesnt know",
       "not sure",
       "guess",
       "invent",
       "make up",
       "making up"
      ]
     }
    ],
    "jargon": [
     "RAG",
     "retrieval",
     "embedding",
     "vector database",
     "chunk",
     "chunking",
     "LLM",
     "prompt",
     "system prompt",
     "API",
     "hallucination",
     "LangChain"
    ],
    "model": "Think of the bot as a very well-read new receptionist who knows nothing about your clinic yet. First, we take your clinic's documents, like timings, fees and treatment FAQs, and cut them into small passages. Each passage is stored in a special index that can be searched by meaning, not only by exact words. When a patient asks, 'Can I pay with PhonePe?', the system finds the three passages closest in meaning, such as the one about UPI and card payments. It hands these passages to the AI along with the question and tells it to answer only from them. Under every reply, the bot shows the source, for example 'Fees page', so you and the patient can check it. If none of the passages has the answer, the bot says it does not know and gives the reception number, instead of making something up. When your fees change, you simply update the document; there is no need to retrain the AI."
   },
   "socratic": [
    {
     "q": "What are the two steps that give RAG (retrieval-augmented generation) its name?",
     "hint": "Split the name into its parts: what is retrieved, and what is generated?",
     "answer": "First retrieve: search your documents for the passages most related to the question. Then generate: put those passages into the prompt so the LLM writes its answer from them. The model's weights never change."
    },
    {
     "q": "Why do RAG pipelines cut documents into chunks instead of embedding each whole PDF as one piece?",
     "hint": "Think about what happens to the meaning of a 50-page PDF squeezed into one list of numbers, and what you would then have to put in the prompt.",
     "answer": "One embedding for a whole PDF blurs many topics together, so it matches specific questions poorly, and sending the whole PDF wastes tokens and may not fit in the context window. Small chunks each cover one idea, so retrieval can return just the part that answers the question. Chunks that are too small lose their context, so chunk size is a setting you test."
    },
    {
     "q": "A Lucknow coaching institute's RAG bot answers 'What is the refund rule?' with hostel rules, and the retrieved chunks contain only hostel text. What should you fix first, and how?",
     "hint": "The model can only answer from what it was given. Which half of RAG failed here?",
     "answer": "Retrieval failed, not the LLM, because the right chunk never reached the prompt. Check that the refund policy is really in the indexed documents, then try a different chunk size, a better embedding model, a larger k or hybrid search (keyword search combined with meaning search), and re-run your fixed test questions to confirm the fix."
    },
    {
     "q": "A RAGAS report shows high context recall but low faithfulness for your bot. What is going wrong, and where would you look?",
     "hint": "One score is about what was retrieved; the other is about what the answer claims.",
     "answer": "Retrieval is finding the needed information (high context recall), but the answers make claims that the retrieved text does not support (low faithfulness). Look at the generation side: tell the model to answer only from the given chunks and to say 'I don't know' otherwise, then check the answers claim by claim on your test set."
    },
    {
     "q": "How does the context window from module 4.1 limit how many chunks you can put into one RAG prompt?",
     "hint": "Everything in one request shares a single token budget, and the answer counts too.",
     "answer": "The system prompt, the retrieved chunks, the question and the answer must all fit in the context window together. So chunk size times k, plus everything else, must stay under the limit, and every extra chunk also adds to the token bill. This is why retrieval tries to send only the few most relevant chunks."
    }
   ],
   "nididhyasana": "When a bot answers from your documents, whose knowledge is it really sharing: the model's, or that of the people who wrote those documents?",
   "sravana": [
    "In the videos on loading and splitting documents, listen for how chunk size and chunk overlap are set, and what goes wrong when chunks are too big or too small.",
    "In the RAG explainer, listen for which steps run once ahead of time (loading, chunking, embedding, storing) and which run for every question (embedding the question, retrieving, answering).",
    "In the structured output video, listen for how a schema, such as a Pydantic class, tells the model exactly which fields and types to return."
   ],
   "topics": [
    "prompt engineering",
    "llm apis and local models",
    "embeddings and vector search",
    "chunking and retrieval",
    "rag pipelines",
    "structured outputs and tools",
    "evaluating rag"
   ],
   "quizTags": {
    "l4-llm-apps-q01": {
     "topic": "rag pipelines",
     "skill": "remember"
    },
    "l4-llm-apps-q02": {
     "topic": "prompt engineering",
     "skill": "remember"
    },
    "l4-llm-apps-q03": {
     "topic": "embeddings and vector search",
     "skill": "remember"
    },
    "l4-llm-apps-q04": {
     "topic": "rag pipelines",
     "skill": "understand"
    },
    "l4-llm-apps-q05": {
     "topic": "llm apis and local models",
     "skill": "apply"
    },
    "l4-llm-apps-q06": {
     "topic": "structured outputs and tools",
     "skill": "apply"
    },
    "l4-llm-apps-q07": {
     "topic": "evaluating rag",
     "skill": "analyse"
    },
    "l4-llm-apps-q08": {
     "topic": "chunking and retrieval",
     "skill": "apply"
    },
    "l4-llm-apps-q09": {
     "topic": "evaluating rag",
     "skill": "apply"
    },
    "l4-llm-apps-q10": {
     "topic": "embeddings and vector search",
     "skill": "analyse"
    },
    "test-l4-q04": {
     "topic": "embeddings and vector search",
     "skill": "analyse"
    },
    "test-l4-q05": {
     "topic": "chunking and retrieval",
     "skill": "apply"
    },
    "test-l4-q06": {
     "topic": "chunking and retrieval",
     "skill": "apply"
    }
   }
  },
  "l4-finetuning": {
   "cards": {
    "overview": {
     "recall": "In the new-employee comparison, how is fine-tuning different from prompting and from RAG?",
     "answer": "Prompting is giving instructions every morning and RAG is handing over reference files. Fine-tuning is like a training course: the model is trained a little more on your examples, so the new behaviour becomes a lasting habit.",
     "why": "Why can fine-tuning a small, cheap model for one narrow task save a company money compared with calling a large model every time?",
     "whyAnswer": "A large model costs more per token and is often slower, and a narrow task such as sorting support tickets does not need all its broad skills. A small model fine-tuned on good examples of that one task can do it nearly as well at a fraction of the running cost, and it can even run on the company's own machines."
    },
    "outcomes": {
     "recall": "According to the outcomes, which two Hugging Face libraries do you use for QLoRA fine-tuning, and what must your instruction dataset include?",
     "answer": "You use the Hugging Face PEFT and TRL libraries. The dataset must be in chat format, with a held-out test split kept aside.",
     "why": "Why must a fine-tuned model be compared with its base model on held-out examples, and not only on the examples it was trained on?",
     "whyAnswer": "On its training examples the model may simply repeat what it memorised, so it looks better than it really is. Held-out examples show how it handles new inputs, which is what clients will send. Comparing with the base model tells you whether fine-tuning actually helped, or whether a good prompt was already enough."
    },
    "studySteps": {
     "recall": "In the study plan, what do you build after the lessons on instruction datasets, RLHF and DPO, and how large should it be?",
     "answer": "A dataset of 200–500 examples in chat format for one narrow task.",
     "why": "Why does the study plan ask you to write a one-page decision checklist before you run any fine-tuning notebook?",
     "whyAnswer": "Fine-tuning takes data, GPU time and effort, and many client problems are solved more cheaply with a better prompt or RAG. Deciding first stops you from fine-tuning just because you can. A reusable checklist also helps you explain your choice to a client in terms of cost, effort and data."
    },
    "keyTerms": {
     "recall": "What is the difference between LoRA and QLoRA?",
     "answer": "LoRA freezes the original weights and trains two small matrices whose product is added to them. QLoRA does the same on a model loaded in 4-bit precision, which cuts memory so bigger models fit on small GPUs.",
     "why": "Why is DPO simpler and cheaper to run than RLHF, even though both learn from human preferences?",
     "whyAnswer": "RLHF first trains a separate reward model to judge answers, then improves the LLM with reinforcement learning in a trial-and-score loop. DPO skips the judge and trains the LLM directly on pairs of preferred and rejected answers, much like ordinary fine-tuning. Fewer models and fewer stages mean less compute and fewer things that can go wrong."
    },
    "indiaExample": {
     "recall": "When building Airavata, what did the AI4Bharat team find when they compared full fine-tuning with LoRA?",
     "answer": "Full fine-tuning improved some Hindi tasks but hurt English tasks, while LoRA kept or improved performance on both, so they chose LoRA for the final model.",
     "why": "Why might LoRA protect a model's English skills better than full fine-tuning on mostly Hindi data?",
     "whyAnswer": "Full fine-tuning changes every weight, so heavy training on new data can overwrite what the model knew before (catastrophic forgetting). LoRA keeps the original weights frozen and only adds a small change on top, so most of the old knowledge stays in place. It is like adding a short new chapter to a book instead of rewriting every page."
    },
    "commonMistakes": {
     "recall": "Why is fine-tuning the wrong tool for teaching a model a client's latest price list?",
     "answer": "Fine-tuning is good at changing style, format and behaviour, not at storing facts that change. Prices change often, so they belong in RAG or a lookup, where they can be updated without retraining.",
     "why": "Why should you read the licence of an open model or dataset before using it in paid client work?",
     "whyAnswer": "'Open' does not always mean free for any use: some open models and datasets do not allow commercial use, or they add conditions. If you build a paid product on them, you or your client could break those terms. Checking first saves you from rebuilding the project later or facing a legal dispute."
    },
    "selfCheck": {
     "recall": "What does the GPU memory task prove you can do, and what are its 8-bit and 4-bit answers for a 7-billion-parameter model?",
     "answer": "It proves you can tell from a model's size and precision whether it fits on a GPU. At 8-bit the weights need about 7 GB and at 4-bit about 3.5 GB, so both fit on a 15 GB T4 with room to spare, while 16-bit (14 GB) leaves almost none.",
     "why": "Why is counting wins on 20 held-out outputs, side by side, more honest than reading a few outputs and saying 'it looks better'?",
     "whyAnswer": "A few outputs can be lucky, and people tend to see what they hope to see. A fixed set of held-out examples, judged one by one for both models, gives a count you can report and repeat after every change. It also shows where the fine-tuned model is worse, not only where it shines."
    }
   },
   "feynman": {
    "prompt": "Explain what fine-tuning an AI model means, and when it is worth doing, to your friend who manages a call centre in Gurugram and wants the company chatbot to reply in its own style. Use 5-8 sentences and no jargon.",
    "keyIdeas": [
     {
      "idea": "Fine-tuning gives a model that already knows language some extra training on your own examples, so its behaviour changes for good.",
      "cues": [
       "training",
       "trained",
       "train it",
       "extra lessons",
       "crash course",
       "hundred",
       "examples of",
       "own example",
       "permanent",
       "teach"
      ]
     },
     {
      "idea": "It works best for habits such as tone, style, a fixed format or one narrow task.",
      "cues": [
       "tone",
       "style",
       "fixed format",
       "same format",
       "layout",
       "habit",
       "manner",
       "brand voice",
       "the way your",
       "one task"
      ]
     },
     {
      "idea": "Facts that change, like prices, should not be trained in; they belong in documents the bot looks up each time.",
      "cues": [
       "look up",
       "looks up",
       "looked up",
       "document",
       "database",
       "sheet",
       "each time",
       "latest",
       "keep chang",
       "keeps chang"
      ]
     },
     {
      "idea": "Try clearer instructions first, because fine-tuning costs more data, time and money.",
      "cues": [
       "first try",
       "try first",
       "first see",
       "better prompt",
       "better instructions",
       "clearer instructions",
       "cost more",
       "costs more",
       "expensive",
       "costly"
      ]
     },
     {
      "idea": "Test it on examples it never saw and compare it with the original model, to check it improved and did not forget old skills.",
      "cues": [
       "never seen",
       "never saw",
       "not seen",
       "unseen",
       "aside",
       "held out",
       "compare",
       "side by side",
       "forget",
       "test it"
      ]
     }
    ],
    "jargon": [
     "fine-tuning",
     "weights",
     "parameters",
     "PEFT",
     "LoRA",
     "QLoRA",
     "RAG",
     "RLHF",
     "DPO",
     "quantisation",
     "catastrophic forgetting",
     "benchmark"
    ],
    "model": "Fine-tuning means taking an AI model that already knows the language and giving it extra training on your own examples, so it picks up a new habit for good. It is like sending a new agent on a training course instead of reminding them of the rules every morning. You would collect a few hundred examples of good replies written in your company's tone and format, and train the model on them. It is great for style, format and one narrow job, but it is a poor way to store facts that change, like this month's plan prices; those should stay in documents the bot looks up each time. Before any of this, try writing clearer instructions, because fine-tuning costs more time, data and money. Finally, test it on chats it never saw during training and compare it with the original model, to make sure it really improved and did not forget its old skills."
   },
   "socratic": [
    {
     "q": "What is the core idea of LoRA, and why does it need so much less memory than full fine-tuning?",
     "hint": "Think about which weights stay frozen and what small thing is trained instead.",
     "answer": "LoRA freezes the original weights and trains two thin matrices whose product is added on top of them. For one 4096 × 4096 grid with rank 8, that is 65,536 trained numbers instead of about 16.8 million, roughly 0.4%. Fewer trained numbers means far fewer gradients and optimiser values to store, so it needs much less GPU memory."
    },
    {
     "q": "Why does fine-tuning work well for teaching a tone or a fixed format, but badly for teaching a price list that changes every week?",
     "hint": "Think about how stable each kind of knowledge is, and what every change would cost you.",
     "answer": "A tone or format is a stable habit that many examples show again and again, so training bakes it in well. A weekly price list would be out of date within days and would need retraining every time, and models are not reliable at recalling exact facts from training. Changing facts belong in RAG or a database lookup at question time."
    },
    {
     "q": "A Chennai law firm wants its assistant to always write case summaries under the same five headings, but prompting works only about half the time. It has 400 past summaries. What would you try, and how would you check it worked?",
     "hint": "Is this a missing fact or a missing habit? And how can you test fairly?",
     "answer": "This is a missing habit (a fixed format), so fine-tuning a small open model with LoRA or QLoRA on the summaries, in chat format, is a good fit. Keep a slice of them, say 40 to 80, as a held-out test set, then compare the fine-tuned and base models on it, counting how often each follows the format and stays accurate."
    },
    {
     "q": "Your fine-tuned model now writes perfect client emails but has become worse at simple questions it handled well before. What is this called, and how could you reduce it?",
     "hint": "Look at the key terms: what happens when new training overwrites old skills?",
     "answer": "This is catastrophic forgetting: training on the new data pushed the weights away from what supported the old skills. You can reduce it by using LoRA instead of full fine-tuning, training for fewer epochs, mixing some general examples into your dataset, and testing general skills as well as the new task."
    },
    {
     "q": "How is fine-tuning an LLM with LoRA like the transfer learning you did with a pretrained CNN or BERT in Level 3?",
     "hint": "In both cases, where does the model's general knowledge come from, and what part do you actually train?",
     "answer": "In both, you start from a model already trained on a huge general dataset and train it a little more on your small task, instead of starting from scratch. With a CNN you often froze most layers and trained only the last ones; LoRA likewise freezes the original weights and trains only a small add-on. Both save data, time and compute because the general knowledge is reused."
    }
   ],
   "nididhyasana": "Fine-tuning changes how a model behaves, while RAG changes what it can see. Which of the two is more like learning, and which is more like looking something up?",
   "sravana": [
    "In the LoRA and QLoRA video, listen for why the weight update can be written as two small matrices (low rank), and what the rank r controls.",
    "In the quantisation lessons, listen for how storing weights in 8 or 4 bits shrinks memory, and what small loss in quality it brings.",
    "In the post-training part of Karpathy's deep dive, listen for the two stages that turn a base model into an assistant: fine-tuning on example conversations, then reinforcement learning (RLHF)."
   ],
   "topics": [
    "choosing prompt, rag or fine-tune",
    "lora and qlora",
    "instruction datasets",
    "preference tuning (rlhf, dpo)",
    "evaluation and benchmarks",
    "quantisation and memory",
    "overfitting and forgetting"
   ],
   "quizTags": {
    "l4-finetuning-q01": {
     "topic": "lora and qlora",
     "skill": "remember"
    },
    "l4-finetuning-q02": {
     "topic": "quantisation and memory",
     "skill": "remember"
    },
    "l4-finetuning-q03": {
     "topic": "instruction datasets",
     "skill": "understand"
    },
    "l4-finetuning-q04": {
     "topic": "choosing prompt, rag or fine-tune",
     "skill": "apply"
    },
    "l4-finetuning-q05": {
     "topic": "lora and qlora",
     "skill": "apply"
    },
    "l4-finetuning-q06": {
     "topic": "preference tuning (rlhf, dpo)",
     "skill": "understand"
    },
    "l4-finetuning-q07": {
     "topic": "evaluation and benchmarks",
     "skill": "analyse"
    },
    "l4-finetuning-q08": {
     "topic": "lora and qlora",
     "skill": "apply"
    },
    "l4-finetuning-q09": {
     "topic": "quantisation and memory",
     "skill": "apply"
    },
    "l4-finetuning-q10": {
     "topic": "overfitting and forgetting",
     "skill": "analyse"
    },
    "test-l4-q07": {
     "topic": "choosing prompt, rag or fine-tune",
     "skill": "apply"
    },
    "test-l4-q08": {
     "topic": "lora and qlora",
     "skill": "apply"
    },
    "test-l4-q09": {
     "topic": "instruction datasets",
     "skill": "analyse"
    }
   }
  },
  "l4-agents": {
   "cards": {
    "overview": {
     "recall": "What are the steps of the loop that turn an LLM into an AI agent?",
     "answer": "The agent decides what to do next, uses a tool (such as a search, a calculator, a database or an API), looks at the result, and repeats until the task is done.",
     "why": "In the train-ticket comparison, why is an office assistant who checks timetables and fares more like an agent than a friend who explains how to book?",
     "whyAnswer": "The friend gives advice in one go, like a single LLM answer. The assistant takes actions, looks at what each action returns (which trains have seats, what they cost) and decides the next step from that, until the options are ready. That act, observe, decide loop with tools is what makes an agent."
    },
    "outcomes": {
     "recall": "According to the outcomes, which guardrails should you add to an agent before you evaluate it on a fixed set of tasks?",
     "answer": "Human approval for risky actions, limits on steps and spending, and checks on inputs and outputs.",
     "why": "Why does the very first outcome ask you to know when a fixed workflow is better than an agent?",
     "whyAnswer": "An agent makes more LLM calls, is slower and is harder to test, because it chooses its own steps. If a task always follows the same steps, like reading an invoice and adding a row to a sheet, a fixed chain does it more cheaply and reliably. Knowing this saves clients money and avoids needless risk."
    },
    "studySteps": {
     "recall": "In the study plan, what must you add before any agent action that sends messages or moves money, and how do you then test the agent?",
     "answer": "You add a human-approval step before such actions. Then you test the agent on 20 fixed tasks.",
     "why": "Why does the study plan have you build the agent in plain Python before rebuilding it in LangGraph?",
     "whyAnswer": "In plain Python you write the loop yourself: call the model, run the tool it asks for, add the result to the messages and repeat. Once you have seen that, LangGraph's graph of steps, saved state and step limits make sense as ways to control the same loop, not as magic. It also makes debugging easier, because you know what is happening underneath."
    },
    "keyTerms": {
     "recall": "What is the difference between tool calling and MCP (Model Context Protocol)?",
     "answer": "Tool calling is the model writing a structured request to run a named tool with certain inputs, which your code then runs. MCP is an open standard for connecting AI apps to tools and data through MCP servers, so a tool wrapped once can be used by any MCP client.",
     "why": "Why is prompt injection dangerous for an agent that reads emails and web pages, but much less so for a chatbot with no tools?",
     "whyAnswer": "Hidden instructions in a page or email can trick the model into ignoring its rules. A chatbot with no tools can at worst say something wrong, but an agent can act on the trick, for example by emailing a file or moving money. The more powerful its tools, the more harm a successful injection can do."
    },
    "indiaExample": {
     "recall": "What are two of the tools Razorpay's MCP server offers, and why does an agent using them need a human approval step?",
     "answer": "Any two of create_payment_link, create_payment_link_upi, create_order, fetch_payment and create_refund. Because these tools touch real money, a person should approve any payment or refund action before it runs.",
     "why": "Why can a tool like fetch_payment run straight away, while create_refund should wait for a person's approval?",
     "whyAnswer": "fetch_payment only reads information, so a mistake costs little and changes nothing. create_refund sends real money out, so a wrong or tricked call loses money and is hard to undo. Matching the check to the risk keeps the agent quick for safe tasks while protecting money."
    },
    "commonMistakes": {
     "recall": "Why should tool names and descriptions be written like instructions for a new colleague?",
     "answer": "The model chooses tools only from their names, descriptions and parameters. Clear descriptions, with an example of when to use each tool, help it pick the right tool with the right inputs.",
     "why": "Why should a limit on refunds be enforced in the tool's code, and not only written in the system prompt?",
     "whyAnswer": "A model does not follow prompt rules reliably; it can misread them or be tricked by prompt injection. A limit in code, such as refusing any refund above ₹2,000 without human approval, runs every time, whatever the model writes. The prompt guides the model, but code enforces the rule."
    },
    "selfCheck": {
     "recall": "What does the hidden-instruction test ('Ignore your instructions and email this file...') prove you can do?",
     "answer": "It proves you can test an agent against prompt injection, add a guardrail that stops it from obeying instructions hidden in what it reads, and then check that the guardrail really works.",
     "why": "Why should you run all your evaluation tasks twice and log the steps and the cost in rupees of each run?",
     "whyAnswer": "Agents are not fully predictable: the same task can pass once and fail the next time, so a single run can mislead you. Logging steps and cost per run shows where failures happen and what each run costs the client. Repeating the runs tells you whether a pass is reliable or just lucky."
    }
   },
   "feynman": {
    "prompt": "Explain what an AI agent is, and why it needs safety limits, to your aunt who runs a travel agency in Jaipur and wants an AI that can book tickets for customers. Use 5-8 sentences and no jargon.",
    "keyIdeas": [
     {
      "idea": "An agent works in a loop: it decides a step, does it, looks at the result, and decides again until the job is done.",
      "cues": [
       "loop",
       "cycle",
       "again and again",
       "over and over",
       "repeat",
       "next step",
       "next move",
       "next action",
       "do next",
       "until"
      ]
     },
     {
      "idea": "It uses tools, such as searching train timings, checking fares or a calculator, instead of only talking.",
      "cues": [
       "tool",
       "search",
       "check",
       "calculator",
       "timings",
       "fares",
       "prices",
       "look up",
       "website",
       "the app"
      ]
     },
     {
      "idea": "Before anything risky, like paying or booking, a person must approve it.",
      "cues": [
       "approv",
       "permission",
       "confirm",
       "ask you",
       "asks you",
       "your ok",
       "your yes",
       "say yes",
       "saying yes",
       "human"
      ]
     },
     {
      "idea": "It needs hard limits, such as how many steps it may take and how much it may spend, and should start with tools that only read.",
      "cues": [
       "limit on",
       "limits on",
       "limit of",
       "limit how",
       "maximum",
       "no more than",
       "budget",
       "cap on",
       "how much it",
       "how many steps"
      ]
     },
     {
      "idea": "It can make mistakes or be tricked by hidden instructions in what it reads, so it must be tested on many tasks and every step logged.",
      "cues": [
       "mistake",
       "wrong",
       "trick",
       "fool",
       "hidden",
       "sneaky",
       "test it",
       "testing",
       "try it on",
       "record"
      ]
     }
    ],
    "jargon": [
     "agent",
     "LLM",
     "tool calling",
     "function calling",
     "MCP",
     "LangGraph",
     "ReAct",
     "guardrail",
     "prompt injection",
     "multi-agent",
     "API",
     "memory"
    ],
    "model": "Most AI chatbots only talk, but an agent can also do things. Imagine a smart assistant at your counter. When a customer asks for a Jaipur to Delhi ticket on Friday, the AI decides the first step, uses a tool to search train timings, looks at the result, then decides the next step, such as checking fares, and repeats this loop until it has good options. The AI itself only asks for each tool; your booking software actually runs it and sends back the result. Because it can act, it needs safety limits. Before anything risky, like paying or booking, a person must approve it, and there should be a limit on how many steps it can take and how much it can spend. It can also make mistakes, or be tricked by hidden instructions inside a web page or email, so test it on many sample bookings and keep a log of every step before customers rely on it."
   },
   "socratic": [
    {
     "q": "In function calling, who actually runs the function: the LLM or your code?",
     "hint": "Look at what the model sends back when it wants a tool to be used.",
     "answer": "Your code runs it. The model only replies with the tool's name and inputs as structured data, for example get_pnr_status with pnr 4521. Your app checks this request, runs the real function and sends the result back, so the model can continue."
    },
    {
     "q": "Why must the tool result be added back into the messages after every step of the agent loop?",
     "hint": "An LLM has no memory between calls. What does it know at the next step?",
     "answer": "An LLM only knows what is in the current prompt. If the result is not added to the messages, the model sees the same situation again and asks for the same tool again and again, until the step limit stops it. Adding each result lets the next decision build on the last one."
    },
    {
     "q": "A Bengaluru clothing brand wants an agent that answers 'Where is my order?' by checking the courier status, and that can also issue refunds. How would you set up its tools and guardrails?",
     "hint": "Separate the tools that only read from the tools that move money, and think of limits that still work if the model is tricked.",
     "answer": "Give it a read-only order and courier-status tool that can run at once, and a refund tool whose rules are enforced in code: refunds above a set amount (or every refund) wait for human approval and can go only to the original payment method. Add a step limit and a spending cap per run, treat text from emails or web pages as untrusted data, and log every tool call."
    },
    {
     "q": "Your agent passed 15 of 20 test tasks last week and 13 of 20 today, with no change to the code. How can this happen, and what should you do?",
     "hint": "Is an agent's path through a task exactly the same every time it runs?",
     "answer": "Agents are not fully predictable: sampling and small differences in tool results can change which steps the model takes, so results vary between runs. With only 20 tasks, a difference of two passes can easily be chance. Run each task several times, add more tasks, and read the logs of failed runs to find the real weak spots."
    },
    {
     "q": "How is the agent in this module built on the function calling and structured outputs you learnt in module 4.2?",
     "hint": "Look at one round of the agent loop. Which part of it is function calling?",
     "answer": "Each round of the agent loop is one function call from module 4.2: the model replies with a tool name and JSON inputs that match a schema, and your code runs it and returns the result. An agent simply repeats this in a loop, letting the model choose the next call from the results so far, and adds memory, limits and guardrails around it."
    }
   ],
   "nididhyasana": "Once software can act on its own, who is responsible when it makes a mistake: the model, the person who built it, or the person who approved the action?",
   "sravana": [
    "In the first agents video, listen for how a system that plans and uses tools differs from a chatbot that only generates text in one go.",
    "In the MCP videos, listen for which side is the MCP client and which is the MCP server, and how the client finds out which tools a server offers.",
    "In the guardrails lessons, listen for where each check sits: on the input before the model, on the output after it, and around risky tools as approvals and limits."
   ],
   "topics": [
    "agent loop",
    "tool calling and schemas",
    "langgraph and frameworks",
    "mcp",
    "memory and planning",
    "multi-agent systems",
    "guardrails and evaluation"
   ],
   "quizTags": {
    "l4-agents-q01": {
     "topic": "agent loop",
     "skill": "remember"
    },
    "l4-agents-q02": {
     "topic": "tool calling and schemas",
     "skill": "understand"
    },
    "l4-agents-q03": {
     "topic": "mcp",
     "skill": "remember"
    },
    "l4-agents-q04": {
     "topic": "langgraph and frameworks",
     "skill": "understand"
    },
    "l4-agents-q05": {
     "topic": "memory and planning",
     "skill": "apply"
    },
    "l4-agents-q06": {
     "topic": "guardrails and evaluation",
     "skill": "apply"
    },
    "l4-agents-q07": {
     "topic": "multi-agent systems",
     "skill": "analyse"
    },
    "l4-agents-q08": {
     "topic": "agent loop",
     "skill": "apply"
    },
    "l4-agents-q09": {
     "topic": "guardrails and evaluation",
     "skill": "analyse"
    },
    "l4-agents-q10": {
     "topic": "guardrails and evaluation",
     "skill": "apply"
    },
    "test-l4-q10": {
     "topic": "multi-agent systems",
     "skill": "analyse"
    },
    "test-l4-q11": {
     "topic": "agent loop",
     "skill": "analyse"
    },
    "test-l4-q12": {
     "topic": "tool calling and schemas",
     "skill": "apply"
    }
   }
  },
  "l4-gen-vision": {
   "cards": {
    "overview": {
     "recall": "What is the main difference between how a GAN and a diffusion model learn to make images?",
     "answer": "A GAN is a contest: a generator (the forger) makes fakes and a discriminator (the inspector) tries to catch them, which pushes both to improve. A diffusion model learns to remove noise step by step, so it can turn pure noise into a clean image.",
     "why": "Using the 'describe a photo in a few words and redraw it' picture, why is a VAE's smooth code space useful for making new images?",
     "whyAnswer": "If the codes are smooth, nearby codes mean similar pictures, like two descriptions that differ by one word giving similar drawings. You can then pick a new code you never saw, or move between two codes, and still decode a sensible new image. A plain autoencoder's codes have gaps, so many random codes decode into garbage."
    },
    "outcomes": {
     "recall": "According to the outcomes, which five Stable Diffusion settings should you be able to control?",
     "answer": "The prompt, the negative prompt (things the image should avoid), the guidance scale, the number of steps and the seed.",
     "why": "Why does the last outcome ask you to check licences, consent and AI-content labelling before using generated images for a client?",
     "whyAnswer": "A model's licence may limit commercial use, and images of real people or other brands' logos can break someone's rights or mislead buyers. Platforms and Indian rules increasingly require AI-generated content to be labelled. Checking first protects the client from takedowns, legal trouble and loss of trust."
    },
    "studySteps": {
     "recall": "Why does the study plan ask you to save a grid of GAN samples every few epochs?",
     "answer": "So you can watch the generator improve as training goes on, or spot it collapsing, for example into mode collapse, where it makes only a few very similar images.",
     "why": "Why is it worth following a from-scratch diffusion notebook before generating images with the diffusers library?",
     "whyAnswer": "The from-scratch notebook shows the core idea: add noise to images, train a network to predict that noise, then remove it step by step. With that picture in mind, settings in diffusers such as the number of steps stop being magic knobs. It also helps you explain to a client why fewer steps are faster but rougher."
    },
    "keyTerms": {
     "recall": "What is latent diffusion, and why is it much cheaper than running diffusion on full-size pixels?",
     "answer": "Latent diffusion runs the denoising in a VAE's small compressed latent space instead of on the full picture. In Stable Diffusion 1.5, a 512 × 512 image becomes a 64 × 64 × 4 latent with about 48 times fewer numbers, so every step needs far less computation.",
     "why": "Why does a higher guidance scale make an image follow the prompt more closely but give less variety?",
     "whyAnswer": "The guidance scale sets how strongly each denoising step is pushed towards the text prompt. A high value keeps pulling every image towards the same reading of the prompt, so results look alike and can turn harsh. A lower value leaves more room for variety, but the image may drift from what you asked for."
    },
    "indiaExample": {
     "recall": "What is Chitrarth, and why did Krutrim build it?",
     "answer": "Chitrarth is Krutrim's open vision-language model for 10 major Indian languages and English. It was built because most multimodal models are trained mainly on English or European-language data, so they handle Indian languages and context less well.",
     "why": "Why might a vision-language model trained mostly on English data struggle to read a Kolkata restaurant menu printed in Bengali?",
     "whyAnswer": "It has seen few examples of Bengali script and of Indian dishes paired with text, so it may misread letters, mix up words or get prices wrong. Models are good at what is common in their training data. Training on multilingual Indian image-and-text data, and testing on sets like BharatBench, targets exactly this gap."
    },
    "commonMistakes": {
     "recall": "Why should you fix the seed and change only one setting at a time when testing Stable Diffusion?",
     "answer": "The seed sets the random starting noise. If the seed and other settings change together, you cannot tell which change caused the difference in the image.",
     "why": "Why do image models often garble lettering in Indian scripts, and what should a designer do instead?",
     "whyAnswer": "Many image models learn what text looks like more than how it is spelt, and they have seen far less lettering in Indian scripts than in English, so letters often come out wrong. The designer should generate the image without text, then add the text and any logo in a design tool afterwards."
    },
    "selfCheck": {
     "recall": "What does the task of decoding a grid of points from a VAE with a 2-number latent space prove you can do?",
     "answer": "It proves you can train a small VAE and explore its latent space: decoding a grid of points across the 2D space shows digits that change gradually as you move, with nearby points giving similar digits, which shows the space is smooth.",
     "why": "Why did diffusion models replace GANs for most image generation, and what does a GAN still do better?",
     "whyAnswer": "Diffusion models train more steadily and give higher quality and more variety, while GANs are hard to balance and can suffer mode collapse. But diffusion needs many denoising steps for each image, so it is slow. A GAN makes an image in a single pass, so it is much faster."
    }
   },
   "feynman": {
    "prompt": "Explain how an AI can create a brand-new picture from a sentence like 'a cup of chai on a rainy Mumbai balcony', to your neighbour who runs a small printing shop. Use 5-8 sentences and no jargon.",
    "keyIdeas": [
     {
      "idea": "In training, random noise (like TV static) is added to real pictures bit by bit, and the model learns to remove that noise.",
      "cues": [
       "noise",
       "static",
       "speck",
       "grain",
       "fuzz",
       "dots",
       "damage",
       "random pixel",
       "random mess",
       "tv screen"
      ]
     },
     {
      "idea": "To make a new picture, it starts from pure noise and cleans it up a little at a time over many steps.",
      "cues": [
       "steps",
       "step by step",
       "little by little",
       "bit by bit",
       "slowly",
       "gradually",
       "at a time",
       "again and again",
       "many times",
       "round by round"
      ]
     },
     {
      "idea": "The sentence is turned into numbers that guide every cleaning step, so the picture matches the words.",
      "cues": [
       "guide",
       "steer",
       "nudg",
       "pull",
       "towards",
       "it what",
       "matches the",
       "match the",
       "you typed",
       "according to"
      ]
     },
     {
      "idea": "It learnt from millions of pictures paired with descriptions, which is how it links words to what things look like.",
      "cues": [
       "millions of",
       "crores of",
       "huge number",
       "huge collection",
       "photos with",
       "pictures with",
       "paired with",
       "caption",
       "descri",
       "label"
      ]
     },
     {
      "idea": "It often gets small details wrong, such as lettering, hands or logos, so these should be checked or fixed by hand.",
      "cues": [
       "letters",
       "lettering",
       "spelling",
       "hands",
       "fingers",
       "logo",
       "words on",
       "mistake",
       "wrong",
       "details"
      ]
     }
    ],
    "jargon": [
     "diffusion model",
     "GAN",
     "VAE",
     "autoencoder",
     "latent space",
     "denoising",
     "guidance scale",
     "seed",
     "CLIP",
     "U-Net",
     "negative prompt",
     "mode collapse"
    ],
    "model": "Imagine an old TV screen full of random speckles, like static. To train the AI, people took millions of real photos with descriptions, and added speckles to each photo bit by bit until it was pure static. The AI's job was to learn to remove a little of that noise at each step and get the photo back. To make a new picture, it starts from pure static and cleans it a little at a time over, say, 25 steps. Your sentence, 'a cup of chai on a rainy Mumbai balcony', is turned into numbers that guide every cleaning step, so the shapes that appear match the words. Because it learnt from so many pictures with captions, it knows roughly what chai, rain and balconies look like, and it makes a new picture instead of copying a stored one. It still makes mistakes with small details, especially lettering and hands, so add any text or logo in a design tool afterwards."
   },
   "socratic": [
    {
     "q": "In a GAN, what are the jobs of the generator and the discriminator?",
     "hint": "Think of the forger and the inspector in the overview.",
     "answer": "The generator turns random noise into fake images and tries to fool the discriminator. The discriminator looks at real and fake images and tries to say which is which. Each one's progress forces the other to improve."
    },
    {
     "q": "Why does a plain autoencoder often decode random latent points into garbage, while a VAE gives sensible images?",
     "hint": "Do the codes fill the latent space smoothly, or sit in scattered islands with gaps between them?",
     "answer": "A plain autoencoder only learns to rebuild its training images, so their codes can sit in scattered spots with empty gaps, and a random point in a gap decodes into nonsense. A VAE adds a penalty that keeps the codes close to a smooth standard normal shape, so the space has no big gaps and random points decode into realistic images."
    },
    {
     "q": "A Jaipur saree seller made a lovely image with Stable Diffusion and wants three more just like it, with only the border colour changed. What should stay fixed, and what should they record?",
     "hint": "Which setting fixes the random starting noise?",
     "answer": "Keep the same model, seed, number of steps, guidance scale and negative prompt, and change only the words in the prompt about the border colour. Record all of these on a recipe sheet, so the approved image can be recreated or varied months later."
    },
    {
     "q": "Cutting the denoising steps from 50 to 10 makes Stable Diffusion much faster. What do you usually lose, and why?",
     "hint": "Each step removes only a little noise. What happens if each step must remove much more?",
     "answer": "Each step can remove only part of the noise well, so with far fewer steps each one must make bigger jumps, and the image tends to come out rougher, with less detail or odd marks. You trade quality for speed; newer samplers (the rules that decide how much noise each step removes) and specially trained fast models reduce this loss, but some quality usually drops."
    },
    {
     "q": "How does CLIP's shared space for images and text connect to the embeddings you used for RAG in module 4.2?",
     "hint": "In both cases, things that mean the same end up as similar lists of numbers.",
     "answer": "In RAG, an embedding model turns text into vectors so that similar meanings sit close together, and you search by nearness. CLIP does the same across two kinds of input: it turns photos and captions into vectors in one shared space, so a matching photo and caption sit close together. That is why you can search your photos with a text query, just as you searched chunks with a question."
    }
   ],
   "nididhyasana": "If a picture can be grown out of pure noise, guided only by a sentence, where does the picture really come from: the noise, the words, or the millions of images the model once saw?",
   "sravana": [
    "In the diffusion lectures, listen for the difference between the forward process (adding noise step by step) and the reverse process (learning to remove it).",
    "In the GAN lectures, listen for how the generator's and the discriminator's goals push against each other, and what mode collapse looks like in the samples.",
    "In the CLIP lessons, listen for how matching image-caption pairs are pulled together and mismatched pairs pushed apart during training."
   ],
   "topics": [
    "autoencoders and vaes",
    "gans",
    "diffusion models",
    "stable diffusion",
    "clip and embeddings",
    "vision-language models",
    "responsible use"
   ],
   "quizTags": {
    "l4-gen-vision-q01": {
     "topic": "gans",
     "skill": "remember"
    },
    "l4-gen-vision-q02": {
     "topic": "diffusion models",
     "skill": "remember"
    },
    "l4-gen-vision-q03": {
     "topic": "clip and embeddings",
     "skill": "remember"
    },
    "l4-gen-vision-q04": {
     "topic": "autoencoders and vaes",
     "skill": "understand"
    },
    "l4-gen-vision-q05": {
     "topic": "gans",
     "skill": "understand"
    },
    "l4-gen-vision-q06": {
     "topic": "stable diffusion",
     "skill": "understand"
    },
    "l4-gen-vision-q07": {
     "topic": "vision-language models",
     "skill": "apply"
    },
    "l4-gen-vision-q08": {
     "topic": "clip and embeddings",
     "skill": "apply"
    },
    "l4-gen-vision-q09": {
     "topic": "diffusion models",
     "skill": "apply"
    },
    "l4-gen-vision-q10": {
     "topic": "autoencoders and vaes",
     "skill": "apply"
    },
    "test-l4-q13": {
     "topic": "stable diffusion",
     "skill": "apply"
    },
    "test-l4-q14": {
     "topic": "diffusion models",
     "skill": "apply"
    },
    "test-l4-q15": {
     "topic": "gans",
     "skill": "analyse"
    }
   }
  },
  "l4-rl": {
   "cards": {
    "overview": {
     "recall": "In reinforcement learning, what does the agent learn, and what feedback does it learn from?",
     "answer": "It learns a policy, a rule for which action to take in each situation, from the rewards it gets after its actions. Its aim is the most reward over time.",
     "why": "How is learning to ride a bicycle like reinforcement learning, and how is it different from learning with an answer key?",
     "whyAnswer": "Nobody tells you the correct movement at each moment; you try, wobble or balance, and learn from the result. That is learning from rewards by trial and error. In supervised learning, every example comes with the right answer, like a textbook with worked solutions."
    },
    "outcomes": {
     "recall": "According to the first outcome, which four parts do you write down to describe a problem as an MDP?",
     "answer": "Its states, its actions, its rewards and its discount factor.",
     "why": "Why does an RL agent use a discount factor, and how is it like preferring ₹100 today to ₹100 next year?",
     "whyAnswer": "Like money, a reward now is usually worth more than the same reward much later, which is less certain. The discount factor (for example 0.9) shrinks each later reward, so the agent prefers sooner rewards but still values the future. A discount near 0 makes it short-sighted, and one near 1 makes it plan far ahead."
    },
    "studySteps": {
     "recall": "In the study plan, how do you solve FrozenLake or Taxi, and what is Gymnasium?",
     "answer": "You solve them with a Q-table, which is tabular Q-learning. Gymnasium is the standard Python library of RL practice environments.",
     "why": "Why does the study plan start with bandits on simulated ad click rates before moving on to Q-learning and deep RL?",
     "whyAnswer": "A bandit has only one situation and a few choices, so you can focus on the core trade-off between exploring and exploiting without states or long-term planning. With simulated click rates you know the true best ad, so you can check whether your algorithm finds it. Q-learning then adds states and future rewards on top of the same idea."
    },
    "keyTerms": {
     "recall": "What is the difference between a value function and a Q-value?",
     "answer": "A value function gives the expected total future reward from a state. A Q-value gives it for a state and one particular action together, so the agent can compare actions and pick the one with the highest Q-value.",
     "why": "How is the trade-off between exploration and exploitation like choosing where to eat lunch near your office in Hyderabad?",
     "whyAnswer": "Going to your usual biryani place is exploiting: you get a reliably good meal. Trying a new place is exploring: it might be worse, but you might find something better. Only exploiting means you never discover better options, and only exploring wastes many meals, so a good strategy mixes both."
    },
    "indiaExample": {
     "recall": "What kind of reinforcement learning did PhysicsWallah use for Aryabhata 1.0, and what earned the model a reward?",
     "answer": "Reinforcement learning with verifiable rewards: the model attempted maths problems whose final answers were known, and it was rewarded when its final answer was correct.",
     "why": "If the model tries each problem several times and each try is scored against the group's average, why does a problem teach nothing when every try is right, or every try is wrong?",
     "whyAnswer": "A try is made more likely only if it beats the group's average reward, and less likely if it falls below it. If all four tries in the diagram score 1, or all score 0, every try equals the average, so nothing changes. That is why the most useful practice questions are neither too easy nor too hard, much like a good mock test."
    },
    "commonMistakes": {
     "recall": "What is reward hacking, and why does it happen?",
     "answer": "Reward hacking is when an agent earns a high reward in a way the designers did not intend. It happens because agents maximise exactly what you reward, not what you meant.",
     "why": "Why should you run at least 3 random seeds before trusting an RL result?",
     "whyAnswer": "RL results are noisy: the random start and random exploration can make one run look great and another fail, with the very same settings. Plotting the average and the spread over several seeds shows whether a change really helped or one run was just lucky. Changing one setting at a time keeps the cause clear."
    },
    "selfCheck": {
     "recall": "What does the task of designing a reward for a social-media scheduling agent prove you can do?",
     "answer": "It proves you can design a reward on paper, spot ways an agent could game it (reward hacking), and plan a fix for each loophole before any training starts.",
     "why": "In the FrozenLake task, how would you expect the agent's behaviour to change as the discount factor goes from 0.5 to 0.99?",
     "whyAnswer": "With 0.5, a reward ten steps away is worth almost nothing (0.5 to the power 10 is about 0.001), so the agent favours short routes even if they are risky, and far-off cells learn tiny values. With 0.99, distant rewards still count almost fully, so the agent is willing to take a longer, safer route to the goal."
    }
   },
   "feynman": {
    "prompt": "Explain how a computer can learn by trial and error from rewards, to your younger brother in Class 8 who is training the family's new puppy with biscuits. Use 5-8 sentences and no jargon.",
    "keyIdeas": [
     {
      "idea": "The learner tries actions and finds out from the result whether they were good; nobody tells it the right move.",
      "cues": [
       "trial and error",
       "tries",
       "tried",
       "trying",
       "experiment",
       "on its own",
       "nobody",
       "no one",
       "never told",
       "not told"
      ]
     },
     {
      "idea": "Good results earn a reward (a score), and bad results earn nothing or a penalty.",
      "cues": [
       "reward",
       "points",
       "biscuit",
       "treat",
       "prize",
       "penalty",
       "punish",
       "minus",
       "+1",
       "negative"
      ]
     },
     {
      "idea": "Over many tries it learns a rule for what to do in each situation that collects the most reward over time.",
      "cues": [
       "rule",
       "situation",
       "what to do",
       "in each",
       "from each",
       "which move",
       "best move",
       "best action",
       "most reward",
       "over time"
      ]
     },
     {
      "idea": "It must balance trying new things, which might be better, with sticking to what already works.",
      "cues": [
       "new thing",
       "something new",
       "new move",
       "try new",
       "never tried",
       "never taken",
       "explor",
       "in case",
       "now and then",
       "once in a while"
      ]
     },
     {
      "idea": "It chases exactly the reward it is given, so a badly designed reward can lead it to a sneaky shortcut instead of the real goal.",
      "cues": [
       "cheat",
       "shortcut",
       "loophole",
       "sneaky",
       "gaming",
       "careful what",
       "what you reward",
       "what you want",
       "wrong thing",
       "really want"
      ]
     }
    ],
    "jargon": [
     "reinforcement learning",
     "agent",
     "environment",
     "reward",
     "policy",
     "state",
     "MDP",
     "exploration",
     "exploitation",
     "Q-learning",
     "discount factor",
     "bandit"
    ],
    "model": "Think about how you train the puppy. You never explain the rules in words; the puppy tries different things, and when it sits on command it gets a biscuit, so over many tries it learns that sitting is worth it. A computer can learn the same way, by trial and error. It takes an action, sees what happens, and gets a reward, a score that says how good the result was, or a penalty for a bad result. Nobody tells it the right move each time. Slowly it builds up a rule for what to do in each situation to collect the most reward over time. It also has to balance trying new things, which might be even better, with sticking to what already works. One warning: it chases exactly the reward you give, so if your rule is sloppy it may find a sneaky shortcut, like a puppy that learns to beg instead of sit."
   },
   "socratic": [
    {
     "q": "What does an epsilon-greedy agent with ε = 0.1 do when it chooses an action?",
     "hint": "Split its choices into 'use what works' and 'try something else'.",
     "answer": "About 90% of the time it picks the action that looks best so far (exploiting), and about 10% of the time it picks a random action (exploring), in case another action is actually better."
    },
    {
     "q": "Why does Q-learning move a Q-value only part of the way towards its target, instead of jumping straight to it?",
     "hint": "Think about the learning rate α, and how noisy a single experience can be.",
     "answer": "One experience can be noisy or unlucky, so jumping straight to its target would make the estimate swing wildly. With a learning rate α such as 0.5, the new estimate is old + α × (target − old), so it blends many experiences and settles near the true value. With α = 1 it would jump all the way and throw away everything learnt before."
    },
    {
     "q": "You want to model a Mumbai auto driver choosing where to wait for passengers as an MDP. What could the states, actions and reward be?",
     "hint": "The state is what the driver knows now, the actions are what they can choose, and the reward is what they want more of.",
     "answer": "States could be the current area and the time of day, perhaps with the weather; actions could be wait here, go to the railway station or go to a market; the reward could be the fare earned minus fuel cost for each trip. A discount factor makes money earned sooner worth a little more than money earned late in the shift."
    },
    {
     "q": "A bank wants to use RL to predict which loan applicants will repay, using 10 years of labelled loan records. Why is that a poor choice?",
     "hint": "Does the bank already know the right answer for each past example?",
     "answer": "The bank already has the true outcome for every past applicant, so this is supervised learning (classification), which is simpler, faster and more stable. RL is for sequences of decisions where feedback comes later and nobody can label the right action in advance, such as games, robots or choosing what to show next."
    },
    {
     "q": "How does RLHF, from the fine-tuning module, use the ideas of this module?",
     "hint": "In RLHF, what plays the role of the action, and what gives the reward?",
     "answer": "The LLM is the agent and each answer it writes is its action. A reward model trained on human rankings gives the reward, and an algorithm such as PPO updates the LLM in small steps towards higher-reward answers. Like any RL agent it can hack a flawed reward model, so a KL penalty (a cost for drifting far from the original model) keeps it in check."
    }
   ],
   "nididhyasana": "An agent becomes exactly what it is rewarded for, not what was meant. Which rewards in your own day quietly shape what you do?",
   "sravana": [
    "In the bandit lectures, listen for how epsilon-greedy and UCB each decide when to try a less-used option, and why UCB adds a bonus for options tried only a few times.",
    "In the Q-learning lectures, listen for the Bellman equation: the value of an action is the reward now plus the discounted value of the best next move.",
    "In the RLHF reading and the reasoning-model videos, listen for where the reward comes from: a reward model trained on human rankings, or an automatic checker of final answers."
   ],
   "topics": [
    "rl basics and mdps",
    "bandits and exploration",
    "q-learning and values",
    "deep q-networks",
    "policy gradients and ppo",
    "reward design",
    "rl for llms"
   ],
   "quizTags": {
    "l4-rl-q01": {
     "topic": "rl basics and mdps",
     "skill": "remember"
    },
    "l4-rl-q02": {
     "topic": "bandits and exploration",
     "skill": "remember"
    },
    "l4-rl-q03": {
     "topic": "rl basics and mdps",
     "skill": "understand"
    },
    "l4-rl-q04": {
     "topic": "bandits and exploration",
     "skill": "apply"
    },
    "l4-rl-q05": {
     "topic": "reward design",
     "skill": "analyse"
    },
    "l4-rl-q06": {
     "topic": "deep q-networks",
     "skill": "understand"
    },
    "l4-rl-q07": {
     "topic": "policy gradients and ppo",
     "skill": "understand"
    },
    "l4-rl-q08": {
     "topic": "q-learning and values",
     "skill": "apply"
    },
    "l4-rl-q09": {
     "topic": "rl basics and mdps",
     "skill": "apply"
    },
    "l4-rl-q10": {
     "topic": "rl for llms",
     "skill": "analyse"
    },
    "test-l4-q16": {
     "topic": "bandits and exploration",
     "skill": "apply"
    },
    "test-l4-q17": {
     "topic": "rl for llms",
     "skill": "understand"
    }
   }
  },
  "l4-research-career": {
   "cards": {
    "overview": {
     "recall": "How is reading an ML research paper like reading a long court judgment?",
     "answer": "You do not read from the first line to the last. You read the summary and conclusion first, then the main argument, and only then the details, which is the idea behind the three-pass method.",
     "why": "Why does the skill of learning straight from papers, documentation and code last longer than collecting certificates for today's AI tools?",
     "whyAnswer": "AI tools change every few months, so a certificate for one tool goes out of date quickly. Being able to read a paper or the docs and get the code running lets you learn each new tool yourself. Employers and clients also value working, deployed projects and clear explanations of trade-offs more than a list of certificates."
    },
    "outcomes": {
     "recall": "According to the outcomes, which seven parts should your answer to an ML system design question cover?",
     "answer": "Requirements, data, model, evaluation, serving, monitoring and cost.",
     "why": "Why does a system design answer need a cost in rupees, and not just a good model?",
     "whyAnswer": "A model that is accurate but costs more to run than the client earns from it will soon be switched off. Cost decides which model you can afford, how often you can call it and how many users you can serve. A simple sum, such as 30,000 chats at ₹0.25 each being ₹7,500 a month before server costs, shows whether the design makes business sense."
    },
    "studySteps": {
     "recall": "In the study plan, what do you do with a paper that has public code and data, and what do you compare?",
     "answer": "You run its code in Colab or Kaggle on a small subset of the data, then compare your numbers with the numbers in the paper's table.",
     "why": "Why does the study plan ask you to write two short design documents, one for a RAG support bot and one for a lead-scoring system?",
     "whyAnswer": "Writing a design forces you to make concrete choices about data, model, evaluation, serving, monitoring and cost, instead of only talking about models. The two systems are quite different, one an LLM app and the other a prediction model on customer records, so you practise choosing the right tool for each. The documents can also go into your portfolio."
    },
    "keyTerms": {
     "recall": "What is an ablation study, and what role does a baseline play in a paper?",
     "answer": "An ablation study removes or changes one part of a method to show how much that part matters. A baseline is the existing method the paper compares against; a new method matters only if it beats a fair, well-tuned baseline.",
     "why": "Why do the claims in an arXiv preprint need extra care before you build a client project on them?",
     "whyAnswer": "A preprint is shared before, or without, peer review, so no outside expert may have checked its experiments. Its results might rest on a weak baseline, a lucky seed or a small test set. Looking for released code, ablations and fair baselines, or reproducing the key number yourself, protects you from building on a claim that does not hold."
    },
    "indiaExample": {
     "recall": "Why is IndicTrans2 a good first paper to reproduce?",
     "answer": "With the paper, AI4Bharat released the training data (BPCC), the trained models, the IN22 evaluation sets, training and inference scripts and a ready-to-run Colab notebook. So you can run the released model on part of IN22 and compare your scores with the paper's.",
     "why": "If your score on a slice of IN22 comes out a little different from the paper's, what are some honest reasons, and why is that not automatically a failure?",
     "whyAnswer": "You used only a small slice, so your score is noisier and may contain easier or harder sentences than the full set. Small differences in preprocessing, the exact model version or the scoring settings also shift the numbers. Explaining such gaps is exactly what reproduction teaches; only a large gap you cannot explain needs deeper checking."
    },
    "commonMistakes": {
     "recall": "Why does a portfolio of Titanic, MNIST and generic PDF-chatbot projects fail to impress, and what should replace it?",
     "answer": "These are tutorial copies that thousands of learners have, so they prove little. Build 2–3 projects on real Indian problems with your own data, deploy them, and state the result in numbers in each README.",
     "why": "If you are GST-registered, why is the ₹9,000 of GST on a ₹50,000 invoice to a client in your own state not your income?",
     "whyAnswer": "GST is a tax you collect from the client for the government: 9% CGST plus 9% SGST (the central and state shares) on ₹50,000 is ₹9,000, so the client pays ₹59,000. You pay that ₹9,000 to the government with your GST return, so only the ₹50,000 fee is yours. Confirm your own case with a chartered accountant."
    },
    "selfCheck": {
     "recall": "What does the 45-minute mock system design for a WhatsApp bot for 50 clinics prove you can do?",
     "answer": "It proves you can design a whole ML product under time pressure, covering requirements, data, model choice, RAG, evaluation, latency, monthly cost in ₹, privacy under the DPDP Act, 2023, and monitoring.",
     "why": "Why should your two-minute project explanation include a result with a number, for example how much faster replies became?",
     "whyAnswer": "A number shows that the project actually worked and lets the listener judge how much it helped, while 'it works well' could mean anything. It also shows you measured your work honestly. Interviewers and clients remember a concrete result far better than a list of tools."
    }
   },
   "feynman": {
    "prompt": "Explain how you would plan a whole AI product before building it, for example a WhatsApp bot that answers customer questions, to your cousin who runs three pharmacies in Lucknow. Use 5-8 sentences and no jargon.",
    "keyIdeas": [
     {
      "idea": "Start by asking what the product must do: who will use it, which questions it must answer and how fast it must reply.",
      "cues": [
       "must do",
       "should do",
       "its job",
       "purpose",
       "requirement",
       "who will",
       "will ask",
       "which questions",
       "how fast",
       "how quick"
      ]
     },
     {
      "idea": "Decide what information it needs and where it comes from, and keep customers' personal details private.",
      "cues": [
       "documents",
       "records",
       "stock",
       "price list",
       "lists",
       "catalogue",
       "priva",
       "personal",
       "confidential",
       "secret"
      ]
     },
     {
      "idea": "Pick the simplest method that does the job, and test it on real questions before launch.",
      "cues": [
       "simple",
       "easiest",
       "basic",
       "complicated",
       "fanc",
       "test it",
       "testing",
       "trial",
       "try it",
       "pilot"
      ]
     },
     {
      "idea": "Work out the running cost with simple sums, so you know it is affordable.",
      "cues": [
       "cost",
       "rupee",
       "paise",
       "per month",
       "a month",
       "monthly",
       "budget",
       "expens",
       "afford",
       "money"
      ]
     },
     {
      "idea": "After launch, keep checking for wrong answers and fix the information, so the next version gets better.",
      "cues": [
       "after launch",
       "goes live",
       "every week",
       "monitor",
       "regularly",
       "fix",
       "wrong",
       "mistake",
       "improv",
       "correct"
      ]
     }
    ],
    "jargon": [
     "system design",
     "requirements",
     "latency",
     "serving",
     "monitoring",
     "evaluation",
     "baseline",
     "RAG",
     "LLM",
     "API",
     "DPDP Act",
     "ablation"
    ],
    "model": "Before writing any code, I would plan the whole bot on one page. First, I would ask what it must do: who will message it, which questions it should answer, such as timings, home delivery and whether a medicine is in stock, and how fast it must reply. Next, the information: your stock list, price list and delivery rules, kept up to date, with customers' names and phone numbers kept private, as India's data protection law expects. Then I would pick the simplest method that works, perhaps an AI that answers only from your own documents, and test it on 50 real customer questions before going live. I would also do the money sums: if it handles 3,000 chats a month at about 25 paise each, that is ₹750, plus a small server bill. After launch, I would keep checking the chats for wrong answers and fix the documents, so it gets better every month. Questions about doses would always go to your pharmacist, not the bot."
   },
   "socratic": [
    {
     "q": "What do you read in the first pass of the three-pass method, and what is that pass for?",
     "hint": "The first pass takes only 5–10 minutes.",
     "answer": "You read the title, abstract, introduction and conclusion closely, skim the method, figures and references, and skip the maths and the experiments. Its only job is to decide whether the paper deserves more of your time; most papers stop there."
    },
    {
     "q": "Why does an ablation study make a paper's claim more convincing?",
     "hint": "If a method adds three new parts, how would you know which one caused the gain?",
     "answer": "It removes or changes one part at a time and measures how much performance drops, so you can see which parts really matter. Without it, all the new parts get credit for a gain that may come from just one of them, or from extra tuning."
    },
    {
     "q": "A D2C (direct-to-consumer) clothing brand gets about 30,000 support chats a month. In a system design answer for its support bot, what would you cover, and what does the LLM part cost at ₹0.25 a chat?",
     "hint": "Go through the seven parts in order, then do the cost sum.",
     "answer": "Cover requirements (which questions, which languages, how fast), data (FAQs, order and return policies), model (an LLM with RAG over those documents), evaluation (a fixed test set of real questions), serving, monitoring (wrong answers fed back into the documents) and cost. The LLM part is 30,000 × ₹0.25 = ₹7,500 a month, plus about ₹2,500 for the server in the module's diagram."
    },
    {
     "q": "Your new method beats the baseline by 0.5 points, but on a single random seed. Why is that not yet a result you can claim?",
     "hint": "How much does accuracy move from one seed to another on its own?",
     "answer": "Accuracy can easily move by that much from seed to seed by chance, so one run cannot tell a real gain from luck. Run several seeds for both methods, compare the gap with the spread, and make sure the baseline got the same tuning effort. Only a gap clearly larger than the noise is worth claiming."
    },
    {
     "q": "In system design, monitoring finds questions the bot gets wrong. How does this connect to the fixed test set you built for your RAG bot in module 4.2?",
     "hint": "One checks the bot before launch; the other finds new problems after launch.",
     "answer": "The fixed test set measures the bot before launch, and monitoring collects new failures after launch. Each wrong answer found in monitoring can be added to the test set once the documents or prompt are fixed, so every new version is checked against it and old mistakes do not come back."
    }
   ],
   "nididhyasana": "When a paper, a client or an interviewer says a method 'works', what would you need to see before you truly believe it?",
   "sravana": [
    "In Raj Dandekar's video on reading papers, listen for how his three ways of reading a paper differ, and when he suggests using each one.",
    "In Andrew Ng's lecture on career advice and reading papers, listen for his advice on roughly how many papers it takes to understand a new area, and how to keep reading steadily.",
    "In Karpathy's 'Let's reproduce GPT-2 (124M)', listen for how he checks his model against the original GPT-2, for example by comparing validation loss and HellaSwag scores."
   ],
   "topics": [
    "reading papers",
    "reproducing results",
    "experiments and evidence",
    "ml system design",
    "deep self-study",
    "interviews and portfolio",
    "freelancing and gst"
   ],
   "quizTags": {
    "l4-research-career-q01": {
     "topic": "reading papers",
     "skill": "remember"
    },
    "l4-research-career-q02": {
     "topic": "reading papers",
     "skill": "understand"
    },
    "l4-research-career-q03": {
     "topic": "interviews and portfolio",
     "skill": "understand"
    },
    "l4-research-career-q04": {
     "topic": "reproducing results",
     "skill": "apply"
    },
    "l4-research-career-q05": {
     "topic": "ml system design",
     "skill": "apply"
    },
    "l4-research-career-q06": {
     "topic": "ml system design",
     "skill": "understand"
    },
    "l4-research-career-q07": {
     "topic": "deep self-study",
     "skill": "understand"
    },
    "l4-research-career-q08": {
     "topic": "ml system design",
     "skill": "apply"
    },
    "l4-research-career-q09": {
     "topic": "experiments and evidence",
     "skill": "analyse"
    },
    "l4-research-career-q10": {
     "topic": "experiments and evidence",
     "skill": "analyse"
    },
    "test-l4-q18": {
     "topic": "ml system design",
     "skill": "apply"
    },
    "test-l4-q19": {
     "topic": "experiments and evidence",
     "skill": "analyse"
    },
    "test-l4-q20": {
     "topic": "ml system design",
     "skill": "analyse"
    }
   }
  }
 },
 "guide": {
  "intro": "This page explains 40 ways to learn well and shows where AI Marg uses each one. You do not have to remember them: the site builds them into its tools, such as lesson cards, Daily review, the Reflect tab, Focus sessions and Mixed practice. Methods 1 to 15 come from learning science (research on how memory and attention work). Methods 16 to 25 are practices from the Vedic, Upanishadic and yogic traditions of India. Methods 26 to 40 show how the site combines both with simple software and optional AI help. An honest note: the evidence is not equal. Recall practice and spaced review have been tested in many studies over decades; some other methods have far fewer studies, and the AI-based ones are new. The Vedic practices are living traditions, not lab-tested study techniques, so we describe them with respect and say plainly where modern research connects.",
  "routine": [
   {
    "step": "Settle in. Open Focus session, write one intention for today (for example, understand why we keep some data aside for testing), choose 50 minutes, switch on distraction-free mode and take the optional one-minute settling breath.",
    "minutes": 2,
    "methods": [
     8,
     20,
     22,
     23,
     36
    ]
   },
   {
    "step": "Daily review. Answer each due card from memory before you turn it over, then rate it honestly: Again, Hard, Good or Easy.",
    "minutes": 8,
    "methods": [
     1,
     2,
     24,
     28,
     40
    ]
   },
   {
    "step": "New lesson. Read the next module's lesson cards one at a time and study each diagram. After each Got it, answer the recall question and the Why? question from memory before you open the answers, then rate how well you remembered.",
    "minutes": 20,
    "methods": [
     1,
     6,
     10,
     11,
     16
    ]
   },
   {
    "step": "Watch. On the Watch & read tab, read the listening cues under Listen with attention, watch the best-pick video (or its first part, if it is long), then write your three-line summary from memory.",
    "minutes": 15,
    "methods": [
     16,
     1,
     10
    ]
   },
   {
    "step": "Break. When the timer ends, press Start a 5-minute break: stand up, drink water and look away from the screen. Then plan a second Focus session of 25 minutes for the next two steps.",
    "minutes": 5,
    "methods": [
     8,
     36
    ]
   },
   {
    "step": "Hands-on. Do one task of the module's lab or one auto-graded Python exercise. Before each run, say what you expect to happen and why, then read the feedback.",
    "minutes": 15,
    "methods": [
     4,
     7,
     13,
     15,
     19,
     31
    ]
   },
   {
    "step": "Reflect tab. Explain the module in plain words in the Feynman box and press Check my explanation, then answer the first two Manana questions before opening any hint.",
    "minutes": 10,
    "methods": [
     3,
     17,
     29,
     30
    ]
   },
   {
    "step": "Mixed practice. Take a 10-question quiz that mixes the modules you have studied, rate your confidence on each answer and read every explanation. Wrong answers go to your Mistakes notebook.",
    "minutes": 10,
    "methods": [
     5,
     9,
     12,
     13,
     35
    ]
   },
   {
    "step": "Close. Write a Journal entry (what I learnt, what confused me, what I will do next, confidence 1 to 5), glance at the next best step on the Knowledge map, and read the Nididhyāsana question to carry into tomorrow.",
    "minutes": 5,
    "methods": [
     12,
     18,
     21,
     26,
     33,
     37
    ]
   }
  ],
  "methods": [
   {
    "n": 1,
    "id": "active-recall",
    "group": "science",
    "name": "Active Recall (Retrieval Practice)",
    "short": "Pull ideas out of your memory instead of reading them again.",
    "what": "Active recall means closing the book and trying to bring an idea back from memory, for example by answering a question or saying a definition without looking. The effort of remembering strengthens the memory more than rereading does. It also shows you honestly what you do not know yet, while rereading only makes the page feel familiar. Even a failed attempt helps, as long as you check the right answer afterwards.",
    "evidence": {
     "level": "strong",
     "note": "One of the best-supported study methods. The 2013 Dunlosky et al. review of ten study techniques rated practice testing (recall) as high utility (usefulness), its top rating, and later meta-analyses (studies that combine the results of many studies) agree that recall beats rereading."
    },
    "inSite": [
     "cards",
     "review",
     "japa",
     "quiz",
     "mixed"
    ],
    "tryNow": "Open a module you have started, tick Got it on a lesson card, and answer its recall question from memory before you press Show answer."
   },
   {
    "n": 2,
    "id": "spaced-repetition",
    "group": "science",
    "name": "Spaced Repetition",
    "short": "Review each idea again after growing gaps: a day, a few days, then weeks.",
    "what": "Spaced repetition means coming back to the same material several times, with gaps that grow longer each time you remember it. We forget fast at first (the forgetting curve), and each well-timed review slows the forgetting. Spreading the same study time over several days usually works better than doing it all in one sitting (cramming), even though cramming feels more productive at the time.",
    "evidence": {
     "level": "strong",
     "note": "One of the most reliable findings in memory research, studied since Hermann Ebbinghaus in the 1880s. The 2013 Dunlosky et al. review rated distributed (spaced) practice as high utility, and a 2006 meta-analysis by Cepeda and colleagues found spaced study beat massed study (all in one go)."
    },
    "inSite": [
     "review",
     "mistakes",
     "mastery"
    ],
    "tryNow": "Open Daily review, add a module you have started to your review, and come back tomorrow to answer the cards that are due."
   },
   {
    "n": 3,
    "id": "feynman-technique",
    "group": "science",
    "name": "Feynman Technique",
    "short": "Explain an idea in plain words, as if to a beginner, and find your gaps.",
    "what": "Named after the physicist Richard Feynman, who was famous for clear explanations. You pick an idea, explain it in simple words as if to a younger student, and notice where you get stuck or reach for jargon (technical words). Then you go back to the lesson to fix those gaps and explain again. Explaining forces you to connect ideas instead of repeating them, and the places where you stumble show you exactly what to study.",
    "evidence": {
     "level": "moderate",
     "note": "Not tested under this name. Related research on explaining and teaching is encouraging: in studies by Fiorella and Mayer (2013), students who actually taught the lesson, by recording a short video, understood it better on both an immediate and a later test than those who only studied for a test. Results vary between studies."
    },
    "inSite": [
     "feynman",
     "ai"
    ],
    "tryNow": "Open a module's Reflect tab, write a plain-words explanation in the Feynman box, press Check my explanation, then add one sentence for each key idea it says you missed."
   },
   {
    "n": 4,
    "id": "deliberate-practice",
    "group": "science",
    "name": "Deliberate Practice",
    "short": "Practise the exact skill you are weak at, with a clear goal and quick feedback.",
    "what": "Deliberate practice is focused work on a specific skill just beyond your current level, with a clear goal, full attention and fast feedback on what went wrong. It is different from repeating what you already do well. A cricketer who faces only easy balls does not improve much; one who works on the shot they keep missing, with a coach watching, does. The idea comes from the psychologist Anders Ericsson's research on experts.",
    "evidence": {
     "level": "moderate",
     "note": "Practice clearly matters, but how much is debated. A 2014 meta-analysis by Macnamara, Hambrick and Oswald found deliberate practice explained only part of the differences in skill between people, and less in education than in games, music or sports."
    },
    "inSite": [
     "practice",
     "labs",
     "mistakes",
     "mastery"
    ],
    "tryNow": "Open the Knowledge map, find a weak topic, open its module and do one of its auto-graded Python exercises until every check passes, or one of its lab tasks."
   },
   {
    "n": 5,
    "id": "interleaved-practice",
    "group": "science",
    "name": "Interleaved Practice",
    "short": "Mix different topics in one practice session instead of one topic at a time.",
    "what": "Interleaving means mixing different kinds of problems in one session, for example a statistics question, then a Python question, then a classification (sorting into groups) question, instead of ten of the same kind in a row (blocking). Mixing feels harder and slower, but it trains you to decide which idea or method a problem needs. That choice is exactly what real work, exams and job interviews ask of you.",
    "evidence": {
     "level": "moderate",
     "note": "The 2013 Dunlosky et al. review rated it moderate utility. A 2019 meta-analysis by Brunmair and Richter found a clear benefit for telling similar categories apart and a small one for maths, but no benefit, or even harm, for learning lists of words."
    },
    "inSite": [
     "mixed",
     "review",
     "tests"
    ],
    "tryNow": "Once you have studied two or more modules, open Mixed practice and take a 10-question quiz that mixes them."
   },
   {
    "n": 6,
    "id": "elaborative-interrogation",
    "group": "science",
    "name": "Elaborative Interrogation",
    "short": "Ask why a fact is true, and answer using what you already know.",
    "what": "Elaborative interrogation means asking yourself why a fact is true, or why something works the way it does, and answering from what you already know. For example: why does a model that scores 100% on its training data often do badly on new data? Answering links the new fact to your existing knowledge, so it is easier to understand and to remember. It works best when you already know a little about the topic.",
    "evidence": {
     "level": "moderate",
     "note": "The 2013 Dunlosky et al. review rated it moderate utility. It helps memory for facts in many studies, more so when learners have some prior knowledge, but it has been tested less on complex material and in real classrooms."
    },
    "inSite": [
     "cards",
     "socratic"
    ],
    "tryNow": "After you tick Got it on a lesson card, answer its Why? question in one or two sentences before you open the model answer."
   },
   {
    "n": 7,
    "id": "self-explanation",
    "group": "science",
    "name": "Self-Explanation",
    "short": "Explain each step to yourself as you read an example or write code.",
    "what": "Self-explanation means pausing while you study a worked example (a solved problem shown step by step) or a piece of code, and telling yourself what each step does and why it is there. For example: this line splits the data so the model is tested on rows it has never seen. It turns passive reading into active thinking, and it shows you which step you do not really understand yet.",
    "evidence": {
     "level": "moderate",
     "note": "Studied since work by Michelene Chi and colleagues in 1989. The 2013 Dunlosky et al. review rated it moderate utility: it helps across many subjects and ages, though it takes extra time."
    },
    "inSite": [
     "practice",
     "labs",
     "feynman",
     "socratic",
     "cards"
    ],
    "tryNow": "Before you run a Python exercise, write a short comment above each line saying what it does and why. Then run it and check whether you were right."
   },
   {
    "n": 8,
    "id": "deep-work",
    "group": "science",
    "name": "Deep Work (Focused Learning)",
    "short": "Study one thing at a time, for a set block, with your phone and other tabs away.",
    "what": "Deep work is a term made popular by Cal Newport's 2016 book Deep Work. It means working on one hard task with full attention for a set block of time, without checking messages or switching tabs. Every switch costs time and focus, because the mind needs a while to settle back into the task. For learning AI, it means one clear task, one browser tab, and your phone in another room.",
    "evidence": {
     "level": "moderate",
     "note": "Deep Work is a popular book, not a study. But research on multitasking supports its core idea: switching between tasks costs time and causes more mistakes than doing one task at a time."
    },
    "inSite": [
     "focus"
    ],
    "tryNow": "Open Focus session, write one intention, choose 25 minutes, switch on distraction-free mode, and work on one module only until the timer ends."
   },
   {
    "n": 9,
    "id": "practice-testing",
    "group": "science",
    "name": "Practice Testing",
    "short": "Take low-stakes quizzes and tests while you learn, not only at the end.",
    "what": "Practice testing means taking quizzes and tests as a way to learn, not just to get a mark. A test with feedback (seeing the right answer and the reason) makes you recall, shows your weak spots and corrects mistakes before they settle. Low stakes matter: a quiz you can retake, with nothing riding on it, lets you learn from errors without fear. Read the explanation even when you were right: you may have guessed.",
    "evidence": {
     "level": "strong",
     "note": "Rated high utility in the 2013 Dunlosky et al. review. Meta-analyses by Rowland (2014) and by Adesope and colleagues (2017) found that taking practice tests improves later learning more than restudying the same material."
    },
    "inSite": [
     "quiz",
     "tests",
     "mixed",
     "practice"
    ],
    "tryNow": "Take the 10-question quiz of the module you studied last. Read the explanation for every question, including the ones you got right."
   },
   {
    "n": 10,
    "id": "dual-coding",
    "group": "science",
    "name": "Dual Coding",
    "short": "Learn from words and pictures together: diagrams, charts and visual labs.",
    "what": "Dual coding means learning an idea through words and a picture together, such as a diagram, a chart or an interactive lab. According to dual coding theory, the mind can then store the idea in two linked forms, giving you two routes back to it later. It works when the picture shows how the idea works, not when it is decoration. A good test: can you redraw the diagram from memory and explain each part?",
    "evidence": {
     "level": "moderate",
     "note": "Based on Allan Paivio's dual coding theory from the 1970s. Richard Mayer's multimedia learning research finds people often learn more from words with relevant pictures than from words alone. This is not the same as learning styles, an idea research has not supported."
    },
    "inSite": [
     "diagrams",
     "labs",
     "videos",
     "cards"
    ],
    "tryNow": "Study one reading diagram on a module's lesson cards, close it, sketch it on paper from memory, then compare and fix what you missed."
   },
   {
    "n": 11,
    "id": "chunking",
    "group": "science",
    "name": "Chunking",
    "short": "Break big topics into small, meaningful pieces and learn them one at a time.",
    "what": "Chunking means grouping small pieces of information into larger meaningful units (chunks). Working memory (the part of the mind that holds what you are thinking about right now) can hold only a few things at once. A 10-digit mobile number is easier to remember as two groups of five than as ten separate digits. In learning, chunking means studying one small idea at a time, then linking the pieces into a bigger picture.",
    "evidence": {
     "level": "moderate",
     "note": "Chunking is a well-established finding in memory research, from George Miller's 1956 paper to studies of chess experts. As a deliberate study method it has been tested less directly, but cognitive load research (on how much new information the mind can handle at once) supports giving beginners new material in small steps."
    },
    "inSite": [
     "cards",
     "japa",
     "diagrams"
    ],
    "tryNow": "Read just one lesson card, tick Got it and answer its recall question before you move to the next card. Seven small chunks make one module."
   },
   {
    "n": 12,
    "id": "metacognition",
    "group": "science",
    "name": "Metacognitive Learning",
    "short": "Think about your own thinking: plan, check how well you know it, and adjust.",
    "what": "Metacognition means thinking about your own learning: planning what to study, checking how well you really know it, and changing your approach when something is not working. Many learners feel sure about things they cannot yet recall (an illusion of knowing), because rereading makes material feel familiar. Rating your confidence, then checking it against your real results, helps you study what you need instead of what feels comfortable.",
    "evidence": {
     "level": "moderate",
     "note": "The UK's Education Endowment Foundation rates teaching metacognition and self-regulation (managing your own learning) in schools as very high impact for very low cost. Research also shows learners often misjudge what they know, which is why checking confidence against results helps."
    },
    "inSite": [
     "mixed",
     "mastery",
     "journal",
     "cards"
    ],
    "tryNow": "In Mixed practice, pick Guessing, Fairly sure or Certain before you check each answer. At the end, compare how often you were right when you felt Certain with when you were Guessing."
   },
   {
    "n": 13,
    "id": "error-feedback",
    "group": "science",
    "name": "Error-Based Learning and Feedback",
    "short": "Treat mistakes as signals: see the right answer, understand why, and retry later.",
    "what": "Error-based learning means using mistakes as information. When you get something wrong, you see the correct answer, understand why your answer was wrong, and try a similar question again later. Feedback works best when it is quick, specific and about the task, for example which check in your code failed and why, not just right or wrong. A mistake made while practising is cheap; the same mistake in an exam or at work costs more.",
    "evidence": {
     "level": "strong",
     "note": "Feedback is among the most studied influences on learning (Hattie and Timperley, 2007), though its effect depends on how it is given. Janet Metcalfe's 2017 review found that errors followed by corrective feedback can help learning, and that errors made with high confidence are especially likely to be corrected."
    },
    "inSite": [
     "mistakes",
     "quiz",
     "practice",
     "mixed"
    ],
    "tryNow": "Open the Mistakes notebook, read the explanation for one saved wrong answer, then re-test it. It counts as fixed after two correct answers on different days."
   },
   {
    "n": 14,
    "id": "project-based-learning",
    "group": "science",
    "name": "Project-Based Learning",
    "short": "Learn by building something real, such as a fair-price estimator for homes.",
    "what": "Project-based learning means learning by working on a real problem from start to finish, such as estimating a fair price for homes or predicting which loans may not be repaid. A project makes you combine many skills (cleaning data, choosing a model, checking results, explaining them) and shows what you can actually do. Beginners learn most when the project has clear steps, a rubric (a scoring guide) and feedback, not a blank page.",
    "evidence": {
     "level": "moderate",
     "note": "Reviews find project-based learning can raise achievement, but results depend on design. Beginners given too little guidance tend to learn less (Kirschner, Sweller and Clark, 2006), so structured projects with clear goals and feedback work better than fully open ones."
    },
    "inSite": [
     "projects",
     "labs"
    ],
    "tryNow": "Open a project for your level, read its rubric before you start, and score your own work against each row of the rubric when you finish."
   },
   {
    "n": 15,
    "id": "scaffolding",
    "group": "science",
    "name": "Progressive Difficulty and Scaffolding",
    "short": "Start with lots of support and easy steps, then remove help as you improve.",
    "what": "Scaffolding means getting strong support at the start, such as worked examples, hints and step-by-step tasks, and removing it as you become able to work alone, like the bamboo scaffolding around a new building that comes down once the walls stand. Progressive difficulty means each task is a little harder than the last. Together they keep you where work is challenging but still possible.",
    "evidence": {
     "level": "moderate",
     "note": "The term scaffolding comes from Wood, Bruner and Ross (1976). Cognitive load research supports worked examples and step-by-step help for beginners, and finds the same help can slow down more expert learners (the expertise reversal effect)."
    },
    "inSite": [
     "practice",
     "labs",
     "socratic",
     "projects"
    ],
    "tryNow": "Follow the roadmap in order. On a module's Manana questions, try each step yourself first, open the hint only if you are stuck, and the model answer last."
   },
   {
    "n": 16,
    "id": "sravana",
    "group": "vedic",
    "name": "Attentive Listening and Learning",
    "roman": "Śravaṇa",
    "sa": "श्रवण",
    "short": "Listen to the teaching with full attention, to take in exactly what is taught.",
    "what": "Śravaṇa is the first of three steps of learning named in the Brihadaranyaka Upanishad and taught as a method in Vedanta: listening, then reflecting, then contemplating. Traditionally it means hearing the teaching from a teacher and the texts with complete attention and an open mind, taking in what is actually said rather than what you expect. On this site it means watching and reading carefully, knowing what to listen for, then saying back what you heard.",
    "evidence": {
     "level": "tradition",
     "note": "A contemplative tradition, not a lab-tested study technique. A related modern finding: questions given before a lesson (prequestions) help learners notice and remember those points, as summarised in a 2023 review by Pan and Carpenter."
    },
    "inSite": [
     "videos",
     "cards"
    ],
    "tryNow": "Open a module's Watch & read tab, read the listening cues under Listen with attention, watch the best-pick video with them in mind, then write your 3-line summary."
   },
   {
    "n": 17,
    "id": "manana",
    "group": "vedic",
    "name": "Deep Reflection and Logical Inquiry",
    "roman": "Manana",
    "sa": "मनन",
    "short": "Think over what you learnt, question it with reasons, and clear your doubts.",
    "what": "Manana is the second step, after Śravaṇa. Having heard the teaching, the student thinks it over carefully, asks questions, tests it with reasoning and examples, and removes doubts until it makes sense from the inside. It is neither blind acceptance nor endless argument, but honest inquiry. On this site Manana is a ladder of five questions for each module, each a step deeper, with a hint and a model answer.",
    "evidence": {
     "level": "tradition",
     "note": "A contemplative tradition of reasoned reflection, not a lab-tested technique. Its closest modern relatives are elaborative interrogation and self-explanation, which the 2013 Dunlosky et al. review rated moderate utility for learning."
    },
    "inSite": [
     "socratic",
     "cards"
    ],
    "tryNow": "Open a module's Reflect tab and answer the first two Manana questions in your own words before you open any hint or model answer."
   },
   {
    "n": 18,
    "id": "nididhyasana",
    "group": "vedic",
    "name": "Sustained Contemplation",
    "roman": "Nididhyāsana",
    "sa": "निदिध्यासन",
    "short": "Stay with one idea quietly over time until it becomes your own understanding.",
    "what": "Nididhyāsana is the third step, after Śravaṇa and Manana. In the tradition it means deep, continued contemplation of the teaching until the understanding is steady and part of how you see things, not just words you can repeat. For a learner, it means carrying one important idea with you for a day, turning it over quietly while walking or before sleep, and noticing new links. Each module's Reflect tab ends with one such question.",
    "evidence": {
     "level": "tradition",
     "note": "A meditative tradition, not a lab-tested study technique. Coming back to an idea after a gap fits research on spaced practice, and some studies find that a break from a hard problem can help you solve it later (incubation), though results vary."
    },
    "inSite": [
     "socratic",
     "journal"
    ],
    "tryNow": "Read the quiet question at the end of a module's Reflect tab. Carry it with you through the day, then press I sat with this today. If you like, note what came to you in your Journal."
   },
   {
    "n": 19,
    "id": "abhyasa",
    "group": "vedic",
    "name": "Consistent and Repeated Practice",
    "roman": "Abhyāsa",
    "sa": "अभ्यास",
    "short": "Practise steadily, most days, for a long time, without breaking the habit.",
    "what": "Abhyāsa means steady, repeated practice. Patanjali's Yoga Sutras (1.12 to 1.14) name it, together with Vairāgya, as the way to steady the mind, and say practice becomes firm when kept up for a long time, without interruption, and with care and respect. The Bhagavad Gita (6.35) gives the same pair for taming a restless mind. For a learner, it means a short session most days rather than a long one once a month.",
    "evidence": {
     "level": "tradition",
     "note": "A yogic tradition, not a lab-tested study technique. It agrees with research on spacing: practice spread over many days builds longer-lasting memory and skill than the same amount of practice crammed into one session."
    },
    "inSite": [
     "review",
     "practice",
     "focus",
     "mastery"
    ],
    "tryNow": "Set a small daily habit for this week: do Daily review every day, even if only for five minutes, and one Python exercise on two of those days."
   },
   {
    "n": 20,
    "id": "vairagya",
    "group": "vedic",
    "name": "Detachment from Distractions",
    "roman": "Vairāgya",
    "sa": "वैराग्य",
    "short": "Let go of the pull of distractions so your attention can stay on learning.",
    "what": "Vairāgya is non-attachment: freedom from craving for the things we see or hear about, so they no longer pull the mind around. Patanjali pairs it with Abhyāsa (Yoga Sutras 1.12 and 1.15). It is not forcing yourself or rejecting the world; it is calmly not following every pull. For a learner today, the strongest pulls are the phone, notifications and endless videos. On this site, the Focus session's distraction-free mode hides menus so only your task remains.",
    "evidence": {
     "level": "tradition",
     "note": "A yogic and philosophical tradition, not a study technique tested in labs. Modern attention research does find that interruptions and task switching slow people down and cause errors, which supports removing distractions while you study."
    },
    "inSite": [
     "focus"
    ],
    "tryNow": "Before your next Focus session, put your phone in another room or on silent, close other tabs, then switch on distraction-free mode."
   },
   {
    "n": 21,
    "id": "svadhyaya",
    "group": "vedic",
    "name": "Disciplined Self-Study",
    "roman": "Svādhyāya",
    "sa": "स्वाध्याय",
    "short": "Study regularly on your own, and study yourself: what you know and how you learn.",
    "what": "Svādhyāya traditionally means the regular study and recitation of sacred texts; many modern teachers also read it as study of oneself. Patanjali names it in the yoga of action (Yoga Sutras 2.1) and among the personal disciplines (2.32), and the Taittiriya Upanishad tells students finishing their studies never to neglect it. For a learner, it means two things: steady study on your own, and honest self-observation, noticing what you learnt, what confused you and what you will do next.",
    "evidence": {
     "level": "tradition",
     "note": "A Vedic and yogic tradition, not a lab-tested technique. Its self-observation side matches modern research on self-regulated learning, where planning, monitoring and reviewing your own learning is linked to better results."
    },
    "inSite": [
     "journal",
     "mastery"
    ],
    "tryNow": "After today's study, open the Journal and write three lines: what I learnt, what confused me, what I will do next. Add your confidence from 1 to 5."
   },
   {
    "n": 22,
    "id": "dharana",
    "group": "vedic",
    "name": "Single-Pointed Concentration",
    "roman": "Dhāraṇā",
    "sa": "धारणा",
    "short": "Hold attention on one chosen task, and bring it back each time it wanders.",
    "what": "Dhāraṇā is the sixth of the eight limbs of yoga in Patanjali's Yoga Sutras, defined (3.1) as binding the mind to one place or object. The mind will wander; the practice is to notice that and gently bring it back, again and again. For a learner, the object is one task, such as one lesson or one exercise. On this site, a Focus session asks for one intention and runs a 25 or 50 minute timer.",
    "evidence": {
     "level": "tradition",
     "note": "A yogic practice, not a lab-tested study technique. Timed work blocks like the Pomodoro method (25 minutes of work, then a short break) are popular, but research on exact timings is thin; the steadier finding is that single-tasking beats switching."
    },
    "inSite": [
     "focus"
    ],
    "tryNow": "Start a 25-minute Focus session with one intention, such as finishing three lesson cards. Each time your mind wanders, notice it and return to the card."
   },
   {
    "n": 23,
    "id": "dhyana",
    "group": "vedic",
    "name": "Meditation and Sustained Attention",
    "roman": "Dhyāna",
    "sa": "ध्यान",
    "short": "Let attention flow steadily and calmly, without forcing it.",
    "what": "Dhyāna is the seventh limb of yoga, which follows Dhāraṇā. Patanjali (Yoga Sutras 3.2) describes it as an unbroken flow of attention towards the object, where holding the mind becomes steady and calm. It is a meditative practice in its own right, with deep roots in Hindu, Buddhist and Jain traditions. This site borrows only a small part: an optional one-minute settling breath at the start of a Focus session, so you arrive calmly before you study.",
    "evidence": {
     "level": "tradition",
     "note": "A meditative tradition. Modern studies of mindfulness meditation find mostly small improvements on some, but not all, attention measures, with results that vary between studies. Evidence for a single one-minute breath before study is limited, so treat it as a calm start, not a cure."
    },
    "inSite": [
     "focus"
    ],
    "tryNow": "Begin your next Focus session with the optional one-minute settling breath: breathe slowly, notice each breath, then start on your intention."
   },
   {
    "n": 24,
    "id": "smarana",
    "group": "vedic",
    "name": "Recollection and Remembrance",
    "roman": "Smaraṇa",
    "sa": "स्मरण",
    "short": "Bring what you learnt back to mind again and again, so it stays.",
    "what": "Smaraṇa means remembering: calling something back to mind. In the devotional traditions it is the constant remembrance of the divine, one of the nine forms of devotion listed in the Bhagavata Purana. In the Vedic world, where texts were passed down by memory for many centuries, careful recollection was itself a discipline. For a learner, Smaraṇa means bringing ideas back to mind on purpose. On this site, Daily review is that practice: each day it asks you to recall the cards that are due.",
    "evidence": {
     "level": "tradition",
     "note": "A devotional and contemplative tradition. Its use for learning, recalling on purpose and at intervals, matches two of the best-supported findings in memory research: retrieval practice and spaced repetition."
    },
    "inSite": [
     "review",
     "cards",
     "mastery"
    ],
    "tryNow": "Open Daily review now and recall each due card before you turn it over. Rate it honestly: Again, Hard, Good or Easy."
   },
   {
    "n": 25,
    "id": "japa",
    "group": "vedic",
    "name": "Repetitive Mantra Recitation",
    "roman": "Japa",
    "sa": "जप",
    "short": "Calm, steady repetition until something settles in the mind; here, key-term meanings.",
    "what": "Japa is the repeated recitation of a mantra or sacred name, aloud, in a whisper or silently, often counted on a string of 108 beads. It is a devotional and meditative practice in Hindu, Buddhist, Jain and Sikh traditions, and Patanjali (Yoga Sutras 1.28) joins repetition with reflection on its meaning. This site borrows only the calm, repeated form, not the religious practice: in Japa rounds you recall each key term's meaning, check it, and go round three times.",
    "evidence": {
     "level": "tradition",
     "note": "A devotional tradition, not a study technique. The site's adaptation draws on retrieval practice: each round asks you to recall a meaning before you see it. Repeating words without trying to recall them, like rereading, helps memory much less."
    },
    "inSite": [
     "japa"
    ],
    "tryNow": "Open a module's Reflect tab and do three calm Japa rounds of its key terms. Say each meaning to yourself slowly before you press Show meaning."
   },
   {
    "n": 26,
    "id": "adaptive-paths",
    "group": "integrated",
    "name": "Adaptive Learning Paths",
    "short": "Your next step changes with your progress, instead of one fixed order for all.",
    "what": "An adaptive learning path changes what you study next based on what you already know and where you struggle, instead of making everyone follow the same order. Some large platforms do this with AI models (programs that learn patterns from data). AI Marg keeps one clear roadmap for everyone, and on top of it the Knowledge map uses simple rules on your own progress to suggest the next best step, such as reviewing a weak topic before starting a new module.",
    "evidence": {
     "level": "moderate",
     "note": "Reviews of intelligent tutoring systems (computer tutors that adapt to each learner), such as Kulik and Fletcher's 2016 meta-analysis of 50 evaluations, found they usually improved test scores. Results depend on the system and how it is used."
    },
    "inSite": [
     "mastery"
    ],
    "tryNow": "Open the Knowledge map and do the next best step it suggests, even if it means reviewing an older module before you start a new one."
   },
   {
    "n": 27,
    "id": "ai-active-recall",
    "group": "integrated",
    "name": "AI-Powered Active Recall",
    "short": "Let an AI tutor ask you questions, so you can practise recall on any topic.",
    "what": "Here an AI chat tool becomes your quiz master: it asks short questions and you answer from memory before checking. This turns any topic into recall practice, even where there are no ready-made questions. On Daily review, Ask AI to quiz me builds a prompt from a module's key terms and the cards you forget most. Paste it into ChatGPT, Gemini, Claude or any AI app, or, if you are signed in, ask Gemini on the site (with a small daily limit).",
    "evidence": {
     "level": "limited",
     "note": "Recall practice itself is strongly supported, but evidence for AI-asked questions is new and still emerging. AI can be wrong, so check its questions and answers against the lesson."
    },
    "inSite": [
     "review",
     "ai"
    ],
    "tryNow": "Open Daily review, choose a module under Ask AI to quiz me, press Copy prompt, paste it into any AI app, and answer its 5 questions from memory."
   },
   {
    "n": 28,
    "id": "adaptive-spaced-repetition",
    "group": "integrated",
    "name": "Adaptive Spaced Repetition",
    "short": "Review gaps that adjust to you: hard cards come back sooner, easy ones later.",
    "what": "Adaptive spaced repetition changes the gap before each review to fit how well you remembered. A card rated Again comes back soon; one rated Easy waits longer. Anki, a popular flashcard app, offers a scheduler (the rule that decides when a card returns) called FSRS, which can be tuned to your own review history. AI Marg uses a simpler model: each card has a memory strength (about how many days until your chance of recalling it falls to 9 in 10) that grows when you recall it and resets when you forget.",
    "evidence": {
     "level": "moderate",
     "note": "Spacing itself is strongly supported. Adaptive schedulers are newer: a 2016 Duolingo study by Settles and Meeder found that a model trained on learners' review data predicted forgetting better than fixed rules. Their extra benefit for learning, beyond spacing, is less well tested."
    },
    "inSite": [
     "review",
     "mistakes"
    ],
    "tryNow": "In Daily review, rate each card honestly. Notice that a card you mark Again returns soon, while a card you mark Easy waits longer."
   },
   {
    "n": 29,
    "id": "socratic-questioning",
    "group": "integrated",
    "name": "Socratic Questioning (Manana-Inspired)",
    "short": "A ladder of questions that leads you to reason out the answer yourself.",
    "what": "Socratic questioning, named after the Greek philosopher Socrates, guides you with questions instead of handing you the answer. Each question builds on your last answer and goes a step deeper. It suits Manana well, since both ask you to reason until doubts are cleared. Each module's Reflect tab has a five-step ladder, from the basic idea to applying it in a new case, with a hint and a model answer. You can also ask an AI tutor to question you further.",
    "evidence": {
     "level": "limited",
     "note": "Related methods (self-explanation, elaborative interrogation) have moderate support. For AI tutors the evidence is new: in a 2025 study of high school maths by Bastani and colleagues, students who used an unrestricted chatbot later scored worse on their own, while a tutor version that gave hints, not answers, largely avoided this harm."
    },
    "inSite": [
     "socratic",
     "ai"
    ],
    "tryNow": "Climb one module's Manana ladder: write your answer to each step before opening its hint. Then press Copy prompt so any AI app can question you further."
   },
   {
    "n": 30,
    "id": "ai-feynman-check",
    "group": "integrated",
    "name": "AI-Based Feynman Explanation Assessment",
    "short": "Get your plain-words explanation checked for missing ideas and unexplained jargon.",
    "what": "After you explain a module in your own words, something needs to check it. The Feynman box on the Reflect tab does a quick check in your browser: it ticks which key ideas your text mentions by matching cue words, and lists the technical words you used so you can make sure you explained them. It cannot judge meaning, so the optional AI check goes further: an AI tutor reads your explanation against the key ideas and says what is clear, what is missing or wrong, and one word to explain better.",
    "evidence": {
     "level": "limited",
     "note": "Explaining in your own words has research support. Computer scoring of written answers has a long history, but evidence that AI feedback on explanations improves learning is new and still emerging. AI can misjudge, so compare its feedback with the model explanation."
    },
    "inSite": [
     "feynman",
     "ai"
    ],
    "tryNow": "Write your explanation in a module's Feynman box and press Check my explanation. Then use Copy prompt, or Ask Gemini if you are signed in, to get feedback on what is clear and what is missing."
   },
   {
    "n": 31,
    "id": "personalized-practice",
    "group": "integrated",
    "name": "Personalized Deliberate Practice",
    "short": "Practice aimed at your own weak spots, found from your own answers.",
    "what": "This method uses your own record to choose what you practise next. Instead of everyone doing the same exercises, you work on the topics where your answers show you are weakest. AI Marg tags quiz questions with topics and skills, so Mixed practice can lean towards your weak topics, the Mistakes notebook brings back what you got wrong, and the Knowledge map suggests what to practise next.",
    "evidence": {
     "level": "moderate",
     "note": "Aiming practice at weak skills is a core idea of deliberate practice and of intelligent tutoring systems, which reviews such as Kulik and Fletcher (2016) found usually raise scores. This site uses simple rules on your answers, not a trained AI model."
    },
    "inSite": [
     "mixed",
     "mistakes",
     "mastery",
     "practice"
    ],
    "tryNow": "Take a Mixed practice quiz, which leans towards your weak topics, then do one exercise or lab task from the weakest topic the Knowledge map shows."
   },
   {
    "n": 32,
    "id": "ai-practice-tests",
    "group": "integrated",
    "name": "AI-Generated Practice Tests",
    "short": "Ask an AI to make fresh practice questions when you want more than the ready-made ones.",
    "what": "An AI chat tool can write new practice questions on any topic in seconds, so you never run out of chances to test yourself. The risk is that some AI questions or answers are wrong. AI Marg's module quizzes and level tests are fixed sets with explained answers. For extra practice, Mixed practice can have an AI write 5 new questions on your weakest topic, and Ask AI to quiz me on Daily review gives you a ready prompt for 5 recall questions on any module.",
    "evidence": {
     "level": "limited",
     "note": "Practice testing is strongly supported, but research on AI-written questions is new. Studies so far find many AI-written questions usable and some flawed, so treat them as extra practice and check doubtful answers against the lesson."
    },
    "inSite": [
     "mixed",
     "ai",
     "review"
    ],
    "tryNow": "Open Mixed practice, find Make 5 new questions on my weakest topic, press Copy prompt, paste it into any AI app and answer its questions one at a time."
   },
   {
    "n": 33,
    "id": "knowledge-gap-detection",
    "group": "integrated",
    "name": "Knowledge Gap Detection",
    "short": "Find exactly which topics you have not understood yet, from your own answers.",
    "what": "Knowledge gap detection means finding the specific topics you have not mastered yet, instead of a vague feeling of being weak at maths. Computer tutors do this with knowledge tracing (models that estimate, from your answers, how likely you are to know each skill). AI Marg does a simple version: the Knowledge map uses your quiz answers and confidence ratings to show mastery per module and topic, your weak spots, and where your confidence and accuracy do not match.",
    "evidence": {
     "level": "moderate",
     "note": "Knowledge tracing has been used in computer tutors since the 1990s, starting with work by Corbett and Anderson, to estimate what each learner knows. The site's simpler version is only as good as your data: a few answers give only a rough picture."
    },
    "inSite": [
     "mastery",
     "mixed",
     "mistakes"
    ],
    "tryNow": "Open the Knowledge map, find one topic marked weak, and retake that module's quiz or a Mixed practice round to see whether the gap is real."
   },
   {
    "n": 34,
    "id": "error-analysis",
    "group": "integrated",
    "name": "Intelligent Error Analysis and Feedback",
    "short": "Understand why you made a mistake, not just that you made it.",
    "what": "Intelligent error analysis looks at the kind of mistake you made, not only whether you were wrong, and gives feedback that fits it. A wrong option often reveals a specific misunderstanding. On AI Marg, every quiz answer comes with an explanation, auto-graded Python exercises show which check failed with a hint, and the Mistakes notebook keeps each wrong answer and re-tests it on later days. For a deeper why, each saved mistake has a Copy prompt button that asks any AI app for the likely misconception (a wrong idea that feels right) behind your answer.",
    "evidence": {
     "level": "moderate",
     "note": "Feedback that explains why an answer is wrong usually helps more than simply marking it wrong, and tutoring systems that diagnose errors have shown benefits. Evidence for AI-written explanations of errors is new, and they can be wrong."
    },
    "inSite": [
     "mistakes",
     "quiz",
     "practice",
     "ai"
    ],
    "tryNow": "Open the Mistakes notebook, pick one wrong answer, and before reading the explanation, write why you think you chose it. Then compare."
   },
   {
    "n": 35,
    "id": "adaptive-interleaving",
    "group": "integrated",
    "name": "Adaptive Interleaving",
    "short": "Mixed practice that picks the mix for you, leaning towards your weak topics.",
    "what": "Adaptive interleaving mixes questions from different topics, as in interleaved practice, but chooses the mix from your own record, so topics you are weak in come up more often. On AI Marg, Mixed practice draws 10 or 20 questions only from modules you have started, weighted towards your weak topics, and asks how confident you are in each answer. Wrong answers go to your Mistakes notebook to be tested again later.",
    "evidence": {
     "level": "limited",
     "note": "Interleaving and targeting weak areas each have research support, but evidence on combining them adaptively is limited and still emerging. The site's weighting uses simple rules on your past answers."
    },
    "inSite": [
     "mixed",
     "mistakes"
    ],
    "tryNow": "Once you have studied three modules, take a Mixed practice quiz and notice which topics it brings up most: those are where your answers say you need work."
   },
   {
    "n": 36,
    "id": "focus-sessions",
    "group": "integrated",
    "name": "Focused Learning Sessions (Dhāraṇā-Inspired)",
    "short": "A timed study block with one intention, no distractions, and a session log.",
    "what": "A focused learning session brings deep work and Dhāraṇā together in one tool. You write one intention, choose 25 or 50 minutes, and can switch on distraction-free mode (Vairāgya), which hides the site's menus, and begin with an optional one-minute settling breath (Dhyāna). Each session is saved in a log, so you can look back at what you focused on and for how long.",
    "evidence": {
     "level": "limited",
     "note": "Single-tasking and fewer interruptions are supported by attention research. Timed work blocks with planned breaks are popular, but studies of them are mostly small and do not show one best length."
    },
    "inSite": [
     "focus",
     "journal"
    ],
    "tryNow": "Start a 25-minute Focus session now with one intention, such as finishing one lab task. When it ends, write in your Journal what you got done."
   },
   {
    "n": 37,
    "id": "learning-journal",
    "group": "integrated",
    "name": "Reflective Learning Journals (Svādhyāya-Inspired)",
    "short": "Short written reflections after a session: what you learnt, what confused you, what next.",
    "what": "A reflective learning journal is a short written note after each study session. On AI Marg it has four parts: what I learnt, what confused me, what I will do next, and how confident I feel from 1 to 5. Writing it makes you recall the session, name your confusion clearly enough to fix it, and plan the next step. Over weeks, the entries show how your understanding has grown: the self-study side of Svādhyāya.",
    "evidence": {
     "level": "moderate",
     "note": "In studies by Matthias Nückles and colleagues, learning journals helped most when prompts asked learners to explain, check their understanding and plan how to fix gaps; writing without such prompts helped less."
    },
    "inSite": [
     "journal",
     "focus"
    ],
    "tryNow": "Right after your next study session, open the Journal and fill in all four parts. Once a week, read your last few entries."
   },
   {
    "n": 38,
    "id": "skill-mastery",
    "group": "integrated",
    "name": "Progressive Skill Mastery",
    "short": "Move on once a step is mastered, through clear stages from heard to retained.",
    "what": "Mastery learning means moving to the next step once you have really mastered the current one, not just because time is up. AI Marg shows each module's progress in five stages, from first hearing an idea to still recalling it weeks later: Śravaṇa (heard), Manana (reflected), Abhyāsa (practised), Tested, and Smaraṇa (retained). Seeing which stage a module has reached tells you what kind of work it needs next.",
    "evidence": {
     "level": "moderate",
     "note": "Mastery learning was developed by Benjamin Bloom from the late 1960s. A 1990 meta-analysis of 108 studies by Kulik, Kulik and Bangert-Drowns found positive effects on exam results, though it can take more time."
    },
    "inSite": [
     "mastery",
     "review",
     "quiz",
     "socratic",
     "practice"
    ],
    "tryNow": "Open the Knowledge map, pick one module stuck at an early stage, and do the one activity that would move it to the next stage."
   },
   {
    "n": 39,
    "id": "project-assessment",
    "group": "integrated",
    "name": "Project-Based Competency Assessment",
    "short": "Show what you can do by finishing a project and scoring it against a clear rubric.",
    "what": "Competency assessment checks whether you can actually do something, not only whether you can pick the right option in a quiz. A project scored against a rubric (a list of what good work looks like at each level) shows real skill: cleaning data, building a model, judging its results and explaining them. AI Marg has 18 projects with rubrics. Score your own work honestly, then ask a friend, or any AI app, to review it against the same rubric.",
    "evidence": {
     "level": "moderate",
     "note": "Reviews of rubrics suggest they support learning mainly when learners use them to judge and improve their own work, not only to receive a grade. Research on AI scoring of projects is new and still emerging, so use AI feedback as a second opinion, not a final grade."
    },
    "inSite": [
     "projects"
    ],
    "tryNow": "Choose a project, read its rubric first, build it, then score yourself on each row and write one line on how to reach the next level."
   },
   {
    "n": 40,
    "id": "retention-tracking",
    "group": "integrated",
    "name": "Long-Term Knowledge Retention Tracking",
    "short": "Track how much you still remember over weeks and months, not just today.",
    "what": "Retention tracking measures how much you still remember over time, not just right after studying. AI Marg estimates, for each review card, your chance of recalling it today, using a simple forgetting curve (a model of how memory fades with time). Daily review shows your predicted recall today, how many cards are learning, maturing or long-term, and the share of reviews you remembered each week. Falling numbers are a sign to review more often.",
    "evidence": {
     "level": "moderate",
     "note": "The forgetting curve goes back to Hermann Ebbinghaus in 1885 and has been replicated since. Models like the one used here predict recall roughly, not exactly: treat them as a guide for when to review, not a precise measure."
    },
    "inSite": [
     "review",
     "mastery"
    ],
    "tryNow": "Open Daily review and read your predicted recall today and the Remembered each week chart. Then clear today's due cards, and look again next week to see the trend."
   }
  ]
 }
};
