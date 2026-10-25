/* AI Marg data file. This is JavaScript holding JSON: keep the quotes and commas valid.
   See README.md > "Editing the course" before changing it. */
window.AIM = window.AIM || {};
window.AIM.site = {
 "name": "AI Marg",
 "repo": "https://github.com/digitalmarket-arch/AI-ML",
 "checked": "October 2026"
};
window.AIM.levels = [
 {
  "id": 1,
  "key": "arambha",
  "sanskrit": "आरम्भः",
  "name": "Ārambha",
  "meaning": "Beginning",
  "title": "Foundations",
  "weeks": "8–10",
  "glyph": "आ",
  "intro": "Ārambha (आरम्भः, 'beginning') is where everyone starts, even if you have never written a line of code. You will learn what AI really is, write your first Python programs, set up free tools like Google Colab and GitHub, and pick up the school-level maths that machine learning (ML: software that learns patterns from examples) is built on. Then you will load real Indian data, clean it, chart it and query it with SQL (the language for asking questions of databases). By the end you can analyse a real dataset on your own and explain the results in plain words, which is the base you need for Level 2, where you build your first ML models.",
  "outcomes": [
   "You will be able to explain AI, ML, deep learning and generative AI to a client in plain words, and spot hype.",
   "You will be able to write Python programs of 50–100 lines using lists, dictionaries, loops, functions and files.",
   "You will be able to work in Google Colab and Jupyter, and keep a public GitHub portfolio of your notebooks.",
   "You will be able to use averages, spread, probability and A/B test results to make simple, honest business decisions.",
   "You will be able to explain vectors, matrices and gradients well enough to follow how a model learns.",
   "You will be able to load, clean, join and summarise a real dataset with Pandas.",
   "You will be able to make clear charts and write SQL queries (SELECT, WHERE, GROUP BY, JOIN) that answer a business question."
  ],
  "howToStudy": "Type every line of code yourself instead of copy-pasting; your fingers learn the grammar of Python faster than your eyes do. Study in short daily blocks (about 90 minutes on 6–7 days a week) rather than one long weekend session; if you can give only 5 hours a week, simply take two weeks for every week in the plan. When you are stuck for more than 20 minutes, read the error message line by line, then ask an AI assistant to explain the error, not to write the whole answer. For the two maths modules, play with the interactive lab first to see the idea, and only then look at the formulas. Keep one Colab notebook per module and push it to GitHub every week; by the end of the level that habit has built your portfolio.",
  "weeklyPlan": [
   {
    "weeks": "1",
    "focus": "[1.1 What is AI? (no coding)](#m-l1-ai-basics): the whole module (~6 h). Then [1.3 Your AI Toolkit: Colab, Jupyter, Git & GitHub](#m-l1-tools) part 1: set up Google Colab and Kaggle, learn notebook basics (~3 h)."
   },
   {
    "weeks": "2–4",
    "focus": "[1.2 Python from Zero](#m-l1-python) (~25 h). Week 2: variables, data types, strings and collections. Week 3: if/else, loops, functions, errors. Week 4: modules, pip, classes, files. End of week 4: [1.3 Your AI Toolkit: Colab, Jupyter, Git & GitHub](#m-l1-tools) part 2, the command line, Git and GitHub; push your Python notebooks (~5 h)."
   },
   {
    "weeks": "5–6",
    "focus": "[1.4 Statistics & Probability for ML](#m-l1-stats) (~14 h, including the Central Limit Theorem lab). Then start [1.5 Linear Algebra & Calculus (intuition first)](#m-l1-linalg-calc): vectors, dot products and matrices (~5 h)."
   },
   {
    "weeks": "7",
    "focus": "Finish [1.5 Linear Algebra & Calculus (intuition first)](#m-l1-linalg-calc): the Matrix lab, derivatives, chain rule and gradients (~7 h). Start [1.6 Data Handling with NumPy & Pandas](#m-l1-numpy-pandas) with NumPy arrays (~3 h)."
   },
   {
    "weeks": "8",
    "focus": "[1.6 Data Handling with NumPy & Pandas](#m-l1-numpy-pandas): DataFrames, reading files, groupby, merge, pivot, missing values and dates (~11 h)."
   },
   {
    "weeks": "9",
    "focus": "[1.7 EDA, Visualisation & SQL](#m-l1-eda-viz-sql): the EDA workflow, Matplotlib, Seaborn, Plotly and outliers (~8 h)."
   },
   {
    "weeks": "10",
    "focus": "Finish [1.7 EDA, Visualisation & SQL](#m-l1-eda-viz-sql) with SQL (~6 h). Then do a Level 1 project, take the 20-question level test, and revisit any module where your quiz score was below 70% (~5 h)."
   }
  ]
 },
 {
  "id": 2,
  "key": "abhyasa",
  "sanskrit": "अभ्यासः",
  "name": "Abhyāsa",
  "meaning": "Practice",
  "title": "Core Machine Learning",
  "weeks": "10–12",
  "glyph": "अ",
  "intro": "Abhyāsa (अभ्यासः, 'practice') is where you start building real machine learning models with scikit-learn (the standard Python library for classic ML). Over 10–12 weeks you will learn how models learn from data, the main algorithms for predicting numbers (regression) and categories (classification), how to measure a model honestly, and how to find groups and outliers in data that has no labels (unsupervised learning). It is for anyone who has finished Level 1 (Ārambha) or can already write basic Python and use Pandas. By the end, you can take a business dataset such as leads, sales or customer orders, build a working model, judge it in ₹ terms, explain it to a client, and take part in a Kaggle competition.",
  "outcomes": [
   "Turn a business question into an ML problem: choose the features, the label and the right type (regression, classification or clustering)",
   "Build models with scikit-learn, from linear regression to XGBoost, and show that they beat a simple baseline",
   "Measure models honestly with train/validation/test splits and cross-validation, and avoid data leakage",
   "Choose a metric and a decision threshold based on the ₹ cost of mistakes, not just accuracy",
   "Segment customers and flag unusual records with clustering and anomaly detection",
   "Build a reusable, leak-free scikit-learn Pipeline, save it, and explain its predictions with SHAP",
   "Enter a Kaggle competition with a sensible plan and publish an end-to-end project on GitHub"
  ],
  "howToStudy": "This level is about practice, so code at least as much as you watch: for every hour of video, spend an hour in a Colab notebook. Pick one dataset you care about, such as your agency's lead list (with names and phone numbers removed, since India's DPDP Act, 2023 expects you to protect personal data) or a public dataset from data.gov.in or Kaggle, and reuse it across modules so you can see how each new technique changes the result. Keep a simple 'model log': a table of what you tried, the score, and what you learned. When gradient descent or PCA feels confusing, spend 20 minutes revisiting l1-linalg-calc instead of pushing on.",
  "weeklyPlan": [
   {
    "weeks": "1",
    "focus": "[2.1 How Machine Learning Works](#m-l2-ml-foundations): the ML lifecycle, data splits, the Overfitting lab and your first baseline model (about 10 hours)."
   },
   {
    "weeks": "2–3",
    "focus": "[2.2 Regression & Gradient Descent](#m-l2-regression): linear regression, the Gradient Descent lab, regularisation and metrics. Use the spare hours to code gradient descent from scratch."
   },
   {
    "weeks": "4–5",
    "focus": "[2.3 Classification Algorithms](#m-l2-classification) (about 16 hours), then start [2.4 Model Evaluation & Tuning](#m-l2-metrics-tuning): confusion matrix, precision and recall."
   },
   {
    "weeks": "6",
    "focus": "Finish [2.4 Model Evaluation & Tuning](#m-l2-metrics-tuning): the Threshold lab, cross-validation, tuning and imbalanced data. Re-score your earlier Level 2 models with cross-validation."
   },
   {
    "weeks": "7–8",
    "focus": "[2.5 Decision Trees & Ensembles](#m-l2-trees-ensembles): decision trees, random forests, boosting and SHAP. In the last few hours of week 8, start [2.6 Unsupervised Learning](#m-l2-unsupervised) with K-Means and the K-Means lab."
   },
   {
    "weeks": "9",
    "focus": "Finish [2.6 Unsupervised Learning](#m-l2-unsupervised): hierarchical clustering, DBSCAN, PCA, anomaly detection and the RFM segmentation task."
   },
   {
    "weeks": "10–11",
    "focus": "[2.7 Feature Engineering, Pipelines & Kaggle](#m-l2-feature-eng): encoding, Pipelines, time-series features, a beginner Kaggle competition and your end-to-end project."
   },
   {
    "weeks": "12",
    "focus": "Level projects, then the 20-question level test (aim for 70%+). Before the test, redo the module quizzes you scored lowest on."
   }
  ]
 },
 {
  "id": 3,
  "key": "pravinya",
  "sanskrit": "प्रावीण्यम्",
  "name": "Prāvīṇya",
  "meaning": "Proficiency",
  "title": "Deep Learning & Deployment",
  "weeks": "12–14",
  "glyph": "प्रा",
  "intro": "Prāvīṇya (प्रावीण्यम्, 'proficiency') is where you move from classic machine learning to deep learning (machine learning with neural networks that have many layers), and learn to put models in front of real users. You will build a neural network from scratch, then use PyTorch (the most widely used deep learning library) to train models that understand images and text, including Indian languages, and use Hugging Face (a free hub of ready-made models and the Python libraries to use them) to fine-tune transformers, the model design behind BERT, ChatGPT and most modern AI. Finally, you will wrap a model in an API, package it with Docker and deploy it free on the internet. This level is for anyone who has finished Level 2 (Abhyāsa) or can already train and evaluate a scikit-learn model. By the end, you can build, fine-tune and ship a working image or text AI product for a client, and explain what happens inside it.",
  "outcomes": [
   "You will be able to explain how a neural network learns (forward pass, loss, backpropagation, optimiser) and code a small one yourself in NumPy.",
   "You will be able to write a complete PyTorch training loop with batches, a GPU and saved checkpoints, and debug a model that is not learning.",
   "You will be able to fine-tune a pretrained image model on a client's own photos and run object detection with YOLO.",
   "You will be able to turn text, including Indian-language and Hinglish text, into numbers with TF-IDF and embeddings, and explain RNNs, LSTMs and attention.",
   "You will be able to use Hugging Face pipelines and fine-tune a BERT-style model to classify text in English or an Indian language.",
   "You will be able to serve a model through a FastAPI endpoint and a Gradio or Streamlit demo, package it with Docker, and deploy it on a free tier.",
   "You will be able to track experiments with MLflow, version data with DVC, run automatic tests with GitHub Actions, and watch a live model for data drift."
  ],
  "howToStudy": "Deep learning needs a GPU (a graphics chip that does thousands of calculations at once), so do all heavy training in Google Colab or Kaggle notebooks, which give free GPU time with usage limits; save checkpoints to Google Drive or push to GitHub often, because free sessions disconnect without warning. Before you train on a full dataset, make the model learn a tiny sample of 10–20 examples first; if it cannot, you have a bug, and you have just saved hours. Use the three labs (Neural Network, Convolution and Tokenizer) to see each idea move before you read the code, and print the shape of your data (the size of each dimension) at every step, because shape mistakes cause most errors at this level. Pick one client-style project early, such as sorting product photos or Hindi customer messages, and grow it module by module, so that by l3-mlops you have something worth deploying. If you can give only 5 hours a week, take two weeks for every week in the plan.",
  "weeklyPlan": [
   {
    "weeks": "1–2",
    "focus": "If the chain rule or gradient descent feels rusty, revisit [1.5 Linear Algebra & Calculus (intuition first)](#m-l1-linalg-calc) and [2.2 Regression & Gradient Descent](#m-l2-regression) first (~2 h). Then [3.1 Neural Networks from Scratch](#m-l3-nn-basics) (~18 h). Week 1: perceptron, multilayer perceptron, activation functions, forward pass, loss functions and the Neural Network lab. Week 2: backpropagation by hand, optimisers, regularisation, vanishing gradients, and your NumPy network from scratch."
   },
   {
    "weeks": "3–4",
    "focus": "[3.2 PyTorch (and Keras) in Practice](#m-l3-pytorch) (~16 h). Week 3: tensors, autograd, Dataset and DataLoader, and the training loop. Week 4: GPU training, saving and loading, debugging, and the Keras overview. Use the spare ~4 h to rebuild your [3.1 Neural Networks from Scratch](#m-l3-nn-basics) network in PyTorch and turn it into your reusable training template."
   },
   {
    "weeks": "5–7",
    "focus": "[3.3 Computer Vision](#m-l3-cv) (~24 h). Week 5: convolutions, pooling, the Convolution lab, and LeNet, VGG and ResNet. Week 6: data augmentation, transfer learning and fine-tuning on your own photos. Week 7: YOLO, U-Net, OpenCV and Vision Transformers. Use the spare ~6 h to polish your fine-tuning notebook into a portfolio piece on GitHub."
   },
   {
    "weeks": "8–9",
    "focus": "[3.4 Natural Language Processing](#m-l3-nlp) (~18 h). Week 8: preprocessing, tokenisation, a TF-IDF baseline and word embeddings. Week 9: RNN, LSTM, GRU, sequence-to-sequence, attention and Indian-language tools. Spare ~2 h: collect a small labelled text dataset (for example real customer messages, with names and phone numbers removed) to reuse in [3.5 Transformers & Hugging Face](#m-l3-transformers)."
   },
   {
    "weeks": "10–11",
    "focus": "[3.5 Transformers & Hugging Face](#m-l3-transformers) (~20 h). Week 10: self-attention, positional encoding, BERT vs GPT, tokenizers and the Tokenizer lab. Week 11: Hugging Face pipelines and datasets, and fine-tuning a BERT-style model on your text dataset."
   },
   {
    "weeks": "12–14",
    "focus": "[3.6 Deployment & MLOps](#m-l3-mlops) (~24 h). Week 12: FastAPI, Gradio or Streamlit, and Docker. Week 13: MLflow, DVC and GitHub Actions. Week 14: deploy on Hugging Face Spaces or Render and add monitoring. Use the spare ~6 h on a Level 3 project (deploy your best image or text model as a live demo with an API), then take the 20-question level test and revisit any module where your quiz score was below 70%. If the project needs more time, add a week or two; that is normal."
   }
  ]
 },
 {
  "id": 4,
  "key": "naipunya",
  "sanskrit": "नैपुण्यम्",
  "name": "Naipuṇya",
  "meaning": "Mastery",
  "title": "Generative AI, LLMs, Agents & Research",
  "weeks": "14–16",
  "glyph": "नै"
 }
];
window.AIM.modules = [
 {
  "id": "l1-ai-basics",
  "level": 1,
  "title": "What is AI? (no coding)",
  "topics": [
   "AI vs ML vs Deep Learning vs Generative AI",
   "types of ML: supervised, unsupervised, reinforcement",
   "how models learn from data",
   "real Indian use-cases (UPI fraud detection, crop advisory, Indic language AI)",
   "AI ethics, bias, privacy (DPDP Act 2023 basics)",
   "career paths and how to use this course"
  ],
  "overview": "This module explains what AI is without any code or maths. Training a model is like training a new employee: you show them many past examples (say, bills marked 'fraud' or 'genuine'), they spot the pattern, and then they judge new cases on their own. AI (artificial intelligence) is the broad goal of machines doing tasks that need human-like judgement; ML (machine learning) is the main way we get there today, by learning from data; deep learning is ML with large neural networks; and generative AI is deep learning that creates new text, images or audio. You will also learn the three main ways machines learn, where AI goes wrong (bias and privacy), what India's DPDP Act 2023 asks of anyone handling personal data, and which AI career path fits you.",
  "whyItMatters": "Almost every AI product you will build or sell, whether a WhatsApp chatbot, a lead-scoring tool or a fraud alert, is one of a few patterns taught here. Knowing which pattern a client needs, and its limits, is what makes your agency trusted rather than just another 'AI agency'.",
  "outcomes": [
   "You will be able to explain the difference between AI, ML, deep learning and generative AI, with one example of each.",
   "You will be able to classify a business problem as supervised, unsupervised or reinforcement learning.",
   "You will be able to describe in plain words how a model learns from data, and why the quality of data limits the quality of the model.",
   "You will be able to name at least three real Indian uses of AI and say which type of learning each one uses.",
   "You will be able to spot common sources of bias and privacy risk in an AI project, and state the DPDP Act's core idea of consent.",
   "You will be able to pick a career path (data analyst, ML engineer, AI product builder, researcher) and plan how to use this course for it."
  ],
  "prerequisites": [
   "None: no coding or maths needed",
   "Basic English reading and an internet connection"
  ],
  "hours": 6,
  "keyTerms": [
   {
    "term": "Artificial Intelligence (AI)",
    "meaning": "The broad field of making computers do tasks that normally need human intelligence, like understanding speech or making decisions."
   },
   {
    "term": "Machine Learning (ML)",
    "meaning": "A way of building AI where the computer learns patterns from examples (data) instead of following hand-written rules."
   },
   {
    "term": "Deep Learning",
    "meaning": "Machine learning that uses large neural networks (many layers of simple maths units, loosely inspired by the brain), and works well for images, speech and text."
   },
   {
    "term": "Generative AI",
    "meaning": "AI that creates new content such as text, images, audio or code; ChatGPT, Gemini and Claude are examples."
   },
   {
    "term": "Model",
    "meaning": "What you get after training on past examples (training data): a set of learned numbers that turns an input, like a transaction, into a prediction, like 'fraud' or 'not fraud'."
   },
   {
    "term": "Supervised learning",
    "meaning": "Learning from examples that come with the correct answer (a label), like emails already marked 'spam' or 'not spam'."
   },
   {
    "term": "Unsupervised learning",
    "meaning": "Finding groups or patterns in data that has no labels, like grouping customers by their buying habits."
   },
   {
    "term": "Reinforcement learning",
    "meaning": "Learning by trial and error, where the program gets a reward for good actions, like a game-playing program that improves by playing."
   },
   {
    "term": "Bias (in AI)",
    "meaning": "When a model treats some groups of people unfairly, usually because its training data was skewed or incomplete."
   },
   {
    "term": "DPDP Act 2023",
    "meaning": "India's Digital Personal Data Protection Act, which says organisations must take clear consent before using people's personal data, use it only for the stated purpose, and keep it safe."
   }
  ],
  "studySteps": [
   "Watch the main playlist lessons on 'what is AI' and on AI vs ML vs deep learning vs generative AI (about 2 hours).",
   "Watch the lessons on supervised, unsupervised and reinforcement learning; pause after each one and write one example from your own business.",
   "Read this page's Indian use-cases and the ethics part, including the DPDP Act basics, and note one risk that applies to your agency.",
   "Try the Practice section: run the ready-made code and change one number to see what happens. You are not expected to write code yet.",
   "Take the quiz (aim for 70%+), and rewatch the lesson behind any question you got wrong.",
   "Do the Self-check tasks on paper and keep your notes; you will reuse them in client conversations."
  ],
  "selfCheck": [
   "On one page, explain AI vs ML vs deep learning vs generative AI to a non-technical shop owner, with one example of each.",
   "List five AI ideas for Indian businesses (for example a coaching institute, a kirana chain, a clinic). Label each as supervised, unsupervised or reinforcement learning, and write what data it would need.",
   "Pick one idea and write down three things: what goes in (the input), what comes out (the output), and where the past labelled examples would come from.",
   "For a loan-approval model, write three ways it could become biased against a group of people, and one fix for each.",
   "Write what personal data your agency's next AI project would collect, why it needs it, and how you would ask for consent under the DPDP Act."
  ],
  "commonMistakes": [
   "Thinking AI 'understands' like a human. Models find statistical patterns in data and can be confidently wrong, so always ask what data a model learned from and how it was tested.",
   "Treating generative AI as all of AI. Many valuable business problems, like fraud scores, demand forecasts and lead scoring, are solved by classic ML on spreadsheet-style data, which is cheaper and easier to explain to a client.",
   "Skipping ethics as 'just theory'. Under the DPDP Act, using customer data without clear consent is a legal risk for your company, with fines that can go up to ₹250 crore for the most serious failures, so plan consent and data security from day one."
  ],
  "indiaExample": "The Reserve Bank Innovation Hub (RBIH), set up by the RBI, built MuleHunter.AI, an AI/ML model that helps banks find 'mule' accounts (bank accounts used to receive and pass on money from frauds). Detecting mule accounts is a classic supervised learning problem: the model learns from accounts that investigations have already marked as mule or genuine, and then flags suspicious new accounts for the bank to check.",
  "tip": "When anyone pitches you an 'AI solution', ask three questions: What data does it learn from? How was it tested, and on what data? What happens when it is wrong? These three questions will protect you and your clients more than any tool."
 },
 {
  "id": "l1-python",
  "level": 1,
  "title": "Python from Zero",
  "topics": [
   "variables, data types, operators",
   "strings, lists, tuples, dicts, sets",
   "if/else, loops",
   "functions, lambda, list comprehensions",
   "errors and exceptions",
   "modules, pip, virtual environments",
   "OOP basics: classes and objects",
   "file handling"
  ],
  "overview": "Python is the language almost all AI work is written in, and it reads close to plain English. Learning it is like organising a kitchen: variables are labelled jars, lists are shopping lists, dictionaries are a contact list (look up a name, get a number), loops repeat a step for every item, and functions are recipes you write once and reuse. You will start from zero, storing numbers and text, and end by writing small programs that read a file, make decisions, handle errors and organise code into classes (templates for objects). Everything runs free in Google Colab or right here in the browser, so you do not need to install anything at first.",
  "whyItMatters": "Every later module, from data analysis to ML to LLM apps, is written in Python. Even as a founder who will hire developers, reading Python lets you review their work, estimate effort, and automate your own tasks, like turning a spreadsheet of sales into GST invoices.",
  "outcomes": [
   "You will be able to store and change data using variables, numbers, strings, lists, tuples, dictionaries and sets.",
   "You will be able to use if/else and loops to make decisions and repeat work over many items.",
   "You will be able to write your own functions, including short lambda functions and list comprehensions.",
   "You will be able to read a Python error message and handle errors with try/except.",
   "You will be able to install packages with pip, import modules, and create a virtual environment for a project.",
   "You will be able to write a simple class with attributes and methods.",
   "You will be able to read from and write to text and CSV files."
  ],
  "prerequisites": [
   "l1-ai-basics",
   "A Google account for Colab (or use the in-browser Practice)",
   "School arithmetic, including percentages"
  ],
  "hours": 25,
  "keyTerms": [
   {
    "term": "Variable",
    "meaning": "A name that stores a value so you can use it later, like price = 1180."
   },
   {
    "term": "Data type",
    "meaning": "The kind of value: int (whole number), float (decimal number), str (text) or bool (True/False)."
   },
   {
    "term": "List",
    "meaning": "An ordered, changeable collection like [10, 20, 30]; you get items by position, and positions start from 0."
   },
   {
    "term": "Dictionary (dict)",
    "meaning": "A collection of key–value pairs, like {\"name\": \"Asha\", \"city\": \"Pune\"}, for looking up a value by its key."
   },
   {
    "term": "Loop",
    "meaning": "Code that repeats: a for loop goes over each item in a collection, and a while loop repeats until a condition becomes false."
   },
   {
    "term": "Function",
    "meaning": "A named, reusable block of code that takes inputs (arguments) and gives back an output (return value)."
   },
   {
    "term": "Exception",
    "meaning": "An error that happens while code is running, like dividing by zero; try/except lets your program handle it instead of crashing."
   },
   {
    "term": "Module / package",
    "meaning": "A file or bundle of ready-made code you can import; pip is the tool that downloads and installs packages."
   },
   {
    "term": "Virtual environment",
    "meaning": "A separate folder of packages for one project, so the package versions of different projects do not clash."
   },
   {
    "term": "Class",
    "meaning": "A template for creating objects that bundle data (attributes) and actions (methods) together, like a BankAccount with a balance and a deposit action."
   }
  ],
  "studySteps": [
   "Watch the main playlist lessons on variables, data types, operators and strings, and type every example yourself in Colab (about 5 hours).",
   "Continue with lists, tuples, dictionaries, sets, if/else and loops; after each lesson, do the matching Practice exercises on this page.",
   "Watch the lessons on functions, lambda, list comprehensions, and errors and exceptions; then write three small functions of your own, such as add GST, split a bill, and grade marks.",
   "Finish with modules, pip, virtual environments, classes and file handling; build one mini program that reads a CSV of expenses and prints the total for each category.",
   "Complete the remaining Practice exercises, then take the quiz (aim for 70%+).",
   "Do the Self-check tasks without looking at your notes, and push the notebook to GitHub once you have done the Git part of [1.3 Your AI Toolkit: Colab, Jupyter, Git & GitHub](#m-l1-tools)."
  ],
  "selfCheck": [
   "Write a function invoice_total(items, gst_rate) where items is a list of (name, price, quantity) tuples; return the subtotal, the GST amount and the grand total. Test it with 18% GST.",
   "Given a list of 20 student marks, use a loop and if/else to count how many got distinction (75 and above), first class (60–74) and the rest; then store the counts in a dictionary.",
   "Write a program that asks for a number and prints its multiplication table; make it handle text input like 'abc' without crashing, using try/except.",
   "Create a class BankAccount with deposit, withdraw (refuse if the balance is too low) and show_balance methods, and test it with three transactions.",
   "Write a list of expenses to a CSV file, read it back, and print the total spent per category."
  ],
  "commonMistakes": [
   "Copy-pasting code instead of typing it. You feel fast but learn little; type it, break it on purpose, and read the error it gives.",
   "Mixing up = (store a value) and == (compare two values), or ignoring indentation (the spaces at the start of a line), which is part of Python's grammar. Use 4 spaces consistently; Colab does this for you.",
   "Watching hours of video without writing code. Follow a simple rule: for every 30 minutes of video, spend at least 30 minutes coding."
  ],
  "indiaExample": "Zerodha, the Indian stockbroker, publishes an official open-source Python library called pykiteconnect (installed with pip install kiteconnect) for its Kite Connect trading API. Developers use plain Python, with functions, dictionaries, loops and error handling, to fetch market data and manage orders. If you try it, practise with pretend trades first (paper trading); trading with real money is risky.",
  "tip": "Keep a 'my errors' cell at the top of your notebook: each time you hit an error, paste its last line and one sentence on what fixed it. After two weeks you will have your own debugging guide."
 },
 {
  "id": "l1-tools",
  "level": 1,
  "title": "Your AI Toolkit: Colab, Jupyter, Git & GitHub",
  "topics": [
   "Google Colab and Kaggle Notebooks (free GPU)",
   "Jupyter notebooks",
   "VS Code basics",
   "command line basics",
   "Git: commit, branch, merge",
   "GitHub: repos, README, portfolio",
   "using AI coding assistants responsibly"
  ],
  "overview": "A carpenter needs a workbench and tools before making furniture; this module sets up your free AI workbench. Google Colab and Kaggle Notebooks let you run Python in the browser on their computers, including free GPUs (graphics chips that speed up AI training) with usage limits. Jupyter notebooks mix code, results and notes in one document, VS Code is a free code editor for bigger projects, and the command line lets you type instructions to your computer instead of clicking. Git is like a 'save game' system that records every version of your work, and GitHub is the website where you store and show those projects as your public portfolio. You will also learn to use AI coding assistants as a tutor and reviewer, not as a crutch.",
  "whyItMatters": "Many clients and employers now ask for a GitHub link along with a CV, because it shows real work. Git is also how every software team, including your future agency developers, works on the same code without overwriting each other.",
  "outcomes": [
   "You will be able to create, run and share notebooks in Google Colab and Kaggle, and switch on a free GPU when you need one.",
   "You will be able to write clear notes and headings in Markdown cells of a Jupyter notebook.",
   "You will be able to open a project folder in VS Code and run a Python file from its built-in terminal.",
   "You will be able to use basic command-line commands to move between folders and to list, create and delete files.",
   "You will be able to use Git to commit changes, create a branch and merge it back.",
   "You will be able to create a GitHub repository with a clear README and push your work to it.",
   "You will be able to use an AI coding assistant to explain and review code, and check what it produces."
  ],
  "prerequisites": [
   "l1-ai-basics",
   "A Google account",
   "Python basics from l1-python help for the Git part, but you can start Colab on day one"
  ],
  "hours": 8,
  "keyTerms": [
   {
    "term": "Notebook",
    "meaning": "A document (an .ipynb file) that mixes code cells, their output and text notes; Jupyter is the open-source tool behind it."
   },
   {
    "term": "Google Colab",
    "meaning": "Google's free online notebook service that runs your code on Google's servers, with limited free GPU time."
   },
   {
    "term": "GPU",
    "meaning": "Graphics Processing Unit: a chip that does many calculations at once, which makes training AI models much faster."
   },
   {
    "term": "Command line (terminal)",
    "meaning": "A text window where you type commands like cd (change folder) or ls (list files) instead of clicking."
   },
   {
    "term": "Git",
    "meaning": "Free software that tracks every change to your files so you can go back to any earlier version."
   },
   {
    "term": "Commit",
    "meaning": "A saved snapshot of your project in Git, with a short message describing what changed."
   },
   {
    "term": "Branch",
    "meaning": "A separate line of work in Git where you can try changes without touching the main version."
   },
   {
    "term": "Merge",
    "meaning": "Combining the changes from one branch into another, usually back into the main branch."
   },
   {
    "term": "Repository (repo)",
    "meaning": "A project folder tracked by Git; on GitHub it is the online copy that others can see."
   },
   {
    "term": "README",
    "meaning": "The front page of a repo (a README.md file) that explains what the project does and how to run it."
   }
  ],
  "studySteps": [
   "Open Google Colab with your Google account, create a notebook, run a code cell, add a Markdown note, and turn on a GPU from Runtime > Change runtime type. Do the same once on Kaggle (it asks you to verify your phone number before it allows GPU use).",
   "Watch the main playlist lessons on the command line and VS Code; practise cd, ls (dir on Windows), mkdir, and running a .py file.",
   "Watch the Git and GitHub lessons; create a free GitHub account and a repo named ai-marg-journey with a README.",
   "Practise the Git loop on your own computer: change a file, then git add, git commit and git push; next create a branch, change something on it, and merge it into main.",
   "Read the Common mistakes and Tip below on AI coding assistants and secret keys, then take the quiz (aim for 70%+).",
   "Do the Self-check tasks, starting by pushing your [1.2 Python from Zero](#m-l1-python) notebooks to your repo."
  ],
  "selfCheck": [
   "Make a public GitHub repo with at least three notebooks from earlier modules and a README that says, in plain English, what each notebook does.",
   "In a terminal, create a folder, make a branch called experiment, change a file, commit it and merge it into main; write down each command you used and why.",
   "Open a Colab notebook straight from your GitHub repo (File > Open notebook > GitHub tab), change it, and use File > Save a copy in GitHub to save it back.",
   "Ask an AI assistant to explain a piece of code you wrote, line by line; note one thing it got wrong or left unclear, and check that point yourself."
  ],
  "commonMistakes": [
   "Committing passwords or API keys (secret keys for paid online services) to GitHub, where anyone can copy them from a public repo. Keep keys in Colab's Secrets panel or in a .env file that is listed in .gitignore.",
   "Assuming Colab saves everything. Files you upload into a Colab session are deleted when the session ends, so save notebooks to Drive or GitHub and keep data files in Google Drive.",
   "Letting an AI assistant write code you do not understand. If you cannot explain each line, you cannot fix it or defend it to a client; ask the assistant to explain, then rewrite it in your own words."
  ],
  "indiaExample": "AI4Bharat, the AI research lab at IIT Madras, publishes IndicTrans2, an open-source translation model for all 22 scheduled Indian languages, on GitHub under the MIT licence, with a Google Colab notebook linked from its README. Anyone can open that notebook in Colab and translate English into Hindi or Tamil without installing anything, which is exactly the GitHub + Colab workflow this module teaches.",
  "tip": "Commit small and often, with messages that say what changed and why, like 'Add GST function with 18% default', not just 'update'. A clean commit history on GitHub is itself proof of how carefully you work."
 },
 {
  "id": "l1-stats",
  "level": 1,
  "title": "Statistics & Probability for ML",
  "topics": [
   "mean, median, mode, variance, standard deviation",
   "distributions: normal, binomial, uniform",
   "probability rules, conditional probability, Bayes theorem",
   "central limit theorem",
   "sampling, confidence intervals",
   "hypothesis testing, p-values, A/B testing",
   "correlation vs causation"
  ],
  "lab": "clt",
  "overview": "Statistics is the science of learning from data when you cannot see everything. It is like tasting one spoon of dal to judge the whole pot: if you stir well and take a fair spoonful (a random sample), a small taste tells you a lot. You will learn to summarise data with averages and spread, to describe how values are distributed, and to reason with probability (the chance of something happening), including Bayes' theorem for updating a belief when new evidence arrives. Finally you will see how A/B tests and p-values help you decide whether a change really worked or the difference is just luck, and why correlation (two things moving together) does not prove causation (one causing the other).",
  "whyItMatters": "Every ML model is a statistical guess, and every business test, like a new ad or a price change on a D2C store, needs statistics to tell a real gain from random noise. Clients pay for decisions they can trust, not for pretty charts.",
  "outcomes": [
   "You will be able to calculate and interpret mean, median, mode, variance and standard deviation, and choose the right average for skewed data such as salaries.",
   "You will be able to recognise normal, binomial and uniform distributions and say where each appears in real data.",
   "You will be able to solve basic probability problems, including conditional probability and Bayes' theorem.",
   "You will be able to explain the central limit theorem and why averages of samples behave predictably.",
   "You will be able to build and interpret a confidence interval from a sample.",
   "You will be able to run and read a simple A/B test with a p-value, and explain the result in plain words.",
   "You will be able to tell correlation from causation and name a hidden factor that could explain a link."
  ],
  "prerequisites": [
   "l1-python",
   "School arithmetic: fractions, percentages, squares and square roots"
  ],
  "hours": 14,
  "keyTerms": [
   {
    "term": "Mean, median, mode",
    "meaning": "The ordinary average; the middle value when the data is sorted; and the most frequent value."
   },
   {
    "term": "Standard deviation",
    "meaning": "A measure of how spread out values are around the mean; variance is the standard deviation squared."
   },
   {
    "term": "Distribution",
    "meaning": "The pattern of how often each value appears, often drawn as a histogram (a bar chart of counts)."
   },
   {
    "term": "Normal distribution",
    "meaning": "The bell-shaped curve, symmetric around the mean, that many measurements such as heights roughly follow."
   },
   {
    "term": "Conditional probability",
    "meaning": "The chance of A happening given that B has already happened, written P(A | B)."
   },
   {
    "term": "Bayes' theorem",
    "meaning": "A rule for updating a probability when you get new evidence, such as a test result."
   },
   {
    "term": "Central limit theorem (CLT)",
    "meaning": "If you take many random samples and average each one, those averages form a roughly bell-shaped curve once samples are large enough, even if the original data is skewed."
   },
   {
    "term": "Confidence interval",
    "meaning": "A range worked out from a sample, built so that it captures the true value most of the time (for example, 95% of the time)."
   },
   {
    "term": "p-value",
    "meaning": "If there were really no difference, the chance of seeing a result at least this extreme; a small p-value suggests the difference is probably not just luck."
   },
   {
    "term": "A/B test",
    "meaning": "An experiment where people are randomly split to see version A or version B, to measure which one works better."
   }
  ],
  "studySteps": [
   "Watch the main playlist lessons on mean, median, mode, variance and standard deviation; compute each one by hand for a list of 10 numbers, then check your answers with Python.",
   "Watch the lessons on distributions and probability, including conditional probability and Bayes' theorem; solve the worked examples on paper before looking at the answer.",
   "Open the Central Limit Theorem lab: pick a skewed population, change the sample size, and watch the curve of sample means become bell-shaped. Complete the lab's tasks.",
   "Watch the lessons on sampling, confidence intervals, hypothesis testing and A/B testing, then do the Practice exercises on this page.",
   "Take the quiz (aim for 70%+) and redo any question you got wrong on paper.",
   "Do the Self-check tasks in a Colab notebook and push it to GitHub."
  ],
  "selfCheck": [
   "Make a list of 15 monthly salaries that includes one very high value (₹5,00,000). Compute the mean and the median, and write two sentences on which one better describes a 'typical' employee and why.",
   "A medical test catches 95% of people who have a disease but also wrongly flags 5% of healthy people, and 1 in 100 people have the disease. Use Bayes' theorem to find the chance that a person who tests positive really has it (it is about 16%), and explain in one line why it is so low.",
   "In Python, simulate rolling a die 10, 100 and 10,000 times, plot how the average moves towards 3.5, and connect this to what you saw in the CLT lab.",
   "Ad version A got 120 sign-ups from 2,000 visitors and version B got 150 from 2,000. Work out both conversion rates, run a two-proportion test in Colab (for example with statsmodels), and write a short recommendation to the client on whether B is clearly better or more data is needed.",
   "Find a news headline that claims 'X causes Y'. Write down one hidden factor (a confounder) that could explain the link instead."
  ],
  "commonMistakes": [
   "Using only the mean for skewed data. One very large customer can pull the average order value far up, so report the median as well.",
   "Reading a p-value as 'the chance my idea is true'. It only tells you how surprising the data would be if there were no real effect. Also fix your sample size before an A/B test, and do not stop the test the moment the results look good.",
   "Treating correlation as cause. Ice-cream sales and drowning cases both rise in summer because hot weather drives both; look for a hidden factor before claiming that one thing causes another."
  ],
  "indiaExample": "India's official unemployment figures come from the Periodic Labour Force Survey (PLFS), run by the National Statistics Office (NSO) under the Ministry of Statistics and Programme Implementation (MoSPI). It interviews a sample of households, not every household in the country, and uses sampling statistics to estimate rates for the whole population, which is the same sampling and estimation thinking taught in this module.",
  "tip": "Before trusting any number, ask 'compared to what, and out of how many?'. '50% more sales' means little if sales went from 2 orders to 3."
 },
 {
  "id": "l1-linalg-calc",
  "level": 1,
  "title": "Linear Algebra & Calculus (intuition first)",
  "topics": [
   "vectors, dot product, norms",
   "matrices, matrix multiplication",
   "linear transformations, determinants",
   "eigenvalues and eigenvectors (intuition)",
   "derivatives, partial derivatives, chain rule",
   "gradients and why gradient descent works"
  ],
  "lab": "matrix",
  "overview": "Machine learning turns everything, whether a photo, a sentence or a customer, into lists of numbers, and then does maths on them. Linear algebra is the maths of those lists (vectors) and tables (matrices): think of a vector as one customer's profile card with numbers for age, spend and visits, and a matrix as a spreadsheet of many such cards. Multiplying data by a matrix stretches, rotates or squashes it, and this one operation is the main workhorse inside neural networks. Calculus is the maths of change: a derivative tells you how much the output moves when you nudge the input, like how much profit changes if you raise a price by ₹1. Gradient descent uses these slopes to walk downhill, step by step, until a model's error is as small as possible, which is how almost every modern model learns.",
  "whyItMatters": "Recommendation feeds, search, face matching and LLMs all run on vectors and matrix multiplication, and all of them are trained with gradients. You need the intuition, not exam-level maths, to understand Levels 2 to 4.",
  "outcomes": [
   "You will be able to represent data as vectors and matrices, and compute a dot product and a vector's length (norm).",
   "You will be able to multiply two small matrices by hand and check the result with NumPy.",
   "You will be able to describe what a linear transformation does to points (stretch, rotate, flip) and what the determinant says about area.",
   "You will be able to explain eigenvectors as directions that a matrix only stretches and does not turn.",
   "You will be able to find simple derivatives and partial derivatives, and apply the chain rule to a two-step function.",
   "You will be able to explain what a gradient is and why stepping against it reduces error in gradient descent."
  ],
  "prerequisites": [
   "l1-python",
   "School algebra: equations, powers, and the graph of a straight line (y = mx + c)"
  ],
  "hours": 12,
  "keyTerms": [
   {
    "term": "Vector",
    "meaning": "An ordered list of numbers, like [age, income, visits], which can also be drawn as an arrow."
   },
   {
    "term": "Dot product",
    "meaning": "Multiply the matching entries of two vectors and add them up; it measures how much the two point in the same direction."
   },
   {
    "term": "Norm",
    "meaning": "The length of a vector; the usual (Euclidean) norm is the square root of the sum of the squared entries."
   },
   {
    "term": "Matrix",
    "meaning": "A rectangular grid of numbers, like a spreadsheet; a greyscale image, for example, is a matrix of pixel values."
   },
   {
    "term": "Matrix multiplication",
    "meaning": "Combining two matrices by taking dot products of the rows of the first with the columns of the second; the inner sizes must match."
   },
   {
    "term": "Linear transformation",
    "meaning": "A rule that moves every point by multiplying it by a matrix, keeping straight lines straight and the origin fixed."
   },
   {
    "term": "Determinant",
    "meaning": "A single number from a square matrix that tells how much it scales area; zero means it squashes space flat, and a negative value means it flips it."
   },
   {
    "term": "Eigenvector",
    "meaning": "A direction that a matrix only stretches or shrinks without turning; the stretch factor is called the eigenvalue."
   },
   {
    "term": "Derivative",
    "meaning": "The rate of change, or slope, of a function at a point."
   },
   {
    "term": "Gradient",
    "meaning": "The list of partial derivatives (slopes in each direction); it points uphill, so models step the opposite way to reduce error."
   }
  ],
  "studySteps": [
   "Watch the main playlist lessons on vectors, dot products and norms; draw two vectors on graph paper and compute their dot product by hand.",
   "Watch the lessons on matrices, matrix multiplication, linear transformations and determinants.",
   "Open the Matrix lab: change the four numbers of a 2×2 matrix and watch how the grid stretches, turns or flips. Find a matrix with determinant 0 and see what happens to the grid. Complete the lab's tasks.",
   "Watch the lessons on eigenvectors, derivatives, partial derivatives, the chain rule and gradients; then do the Practice exercises on this page.",
   "Take the quiz (aim for 70%+).",
   "Do the Self-check tasks; for gradient descent, write a 10-line Python loop and watch the error fall."
  ],
  "selfCheck": [
   "On paper, multiply a 2×3 matrix by a 3×2 matrix, then check with NumPy (A @ B). Explain why a 2×3 matrix times another 2×3 matrix is not allowed.",
   "Write three customers as vectors [monthly spend in ₹ thousand, visits per month]. Use distances or dot products to decide which two customers are most alike.",
   "Find the derivative of f(x) = x² − 6x + 10 and the value of x where the slope is zero. Then write a gradient descent loop starting at x = 0 with step size 0.1, and check that it reaches the same answer (x = 3).",
   "Apply the matrix [[0, −1], [1, 0]] to the points (1, 0) and (0, 1). Describe in words what it does (it rotates by 90°) and compute its determinant.",
   "Explain to a friend, without formulas, why gradient descent with too large a step can overshoot and never settle."
  ],
  "commonMistakes": [
   "Trying to master every proof before moving on. For applied ML you need intuition: what an operation does and when to use it. Proofs can wait until you need them, for example in research.",
   "Mixing up element-wise multiplication (A * B in NumPy) and matrix multiplication (A @ B). They give different answers, so check the shapes with .shape before multiplying.",
   "Thinking the gradient points to the minimum. It points uphill, in the direction of steepest increase; gradient descent moves the opposite way, in small steps set by the learning rate."
  ],
  "indiaExample": "The RBI allows banks and other regulated lenders to open accounts remotely through Video KYC (the Video-based Customer Identification Process). Face-match checks in such systems typically turn each face photo into a vector of numbers (an embedding) and measure how close the live selfie's vector is to the ID photo's vector; the model that produces those vectors is trained with gradient descent, so both halves of this module are at work.",
  "tip": "Whenever you see a formula, ask 'what are the shapes?'. Writing the size next to each vector and matrix (a 3×2 times a 2×1 gives a 3×1) catches most mistakes before you write any code."
 },
 {
  "id": "l1-numpy-pandas",
  "level": 1,
  "title": "Data Handling with NumPy & Pandas",
  "topics": [
   "NumPy arrays, indexing, broadcasting, vectorisation",
   "Pandas Series and DataFrame",
   "reading CSV/Excel/JSON",
   "filtering, groupby, merge/join, pivot",
   "handling missing values and duplicates",
   "working with dates"
  ],
  "overview": "Real data arrives messy: Excel sheets with blank cells, repeated rows and dates written five different ways. NumPy and Pandas are the two Python libraries that make handling such data fast and easy. NumPy gives you arrays, grids of numbers you can do maths on all at once instead of looping one by one (this is called vectorisation). Pandas gives you the DataFrame, which is like an Excel sheet inside Python run by a fast, tireless clerk: you can filter rows, group and total, join two tables and pivot, each with a line or two of code. Cleaning data usually takes a large share of any data project, so this is one of the most practical modules in the course.",
  "whyItMatters": "Pandas is a daily tool for data analysts and ML engineers, and analyst job descriptions in India commonly ask for it. For an agency, a Pandas script can produce in seconds a client report that now takes hours in Excel.",
  "outcomes": [
   "You will be able to create NumPy arrays, select parts of them (indexing and slicing), and use broadcasting to do maths without loops.",
   "You will be able to load CSV, Excel and JSON files into a Pandas DataFrame and inspect them with head(), info() and describe().",
   "You will be able to filter rows, select columns and sort data to answer a specific question.",
   "You will be able to use groupby, merge (join) and pivot tables to summarise and combine data.",
   "You will be able to find and handle missing values and duplicate rows, and explain your choice.",
   "You will be able to convert text into dates and analyse data by day, month or year."
  ],
  "prerequisites": [
   "l1-python",
   "l1-tools (Google Colab)",
   "Some Excel or Google Sheets experience helps"
  ],
  "hours": 14,
  "keyTerms": [
   {
    "term": "NumPy array",
    "meaning": "A grid of numbers of one type that supports fast maths on the whole grid at once."
   },
   {
    "term": "Vectorisation",
    "meaning": "Doing an operation on a whole array in one step instead of writing a Python loop, which is much faster."
   },
   {
    "term": "Broadcasting",
    "meaning": "NumPy's rule for doing maths on arrays of different shapes, like adding one number to every element."
   },
   {
    "term": "DataFrame",
    "meaning": "Pandas' table of rows and named columns, similar to a spreadsheet."
   },
   {
    "term": "Series",
    "meaning": "A single column of a DataFrame, with an index (row labels)."
   },
   {
    "term": "groupby",
    "meaning": "Splitting rows into groups (for example by state) and then calculating something for each group, like a total or an average."
   },
   {
    "term": "merge / join",
    "meaning": "Combining two tables using a shared column, like matching orders to customers by customer ID."
   },
   {
    "term": "Pivot table",
    "meaning": "Reshaping data so that the values of one column become new columns, like months across the top and states down the side."
   },
   {
    "term": "Missing value (NaN)",
    "meaning": "An empty cell, shown as NaN ('not a number'), which you must fill, drop or flag."
   },
   {
    "term": "Datetime",
    "meaning": "Pandas' date-and-time type, which lets you pull out the month, weekday or year and total data by period."
   }
  ],
  "studySteps": [
   "Watch the main playlist lessons on NumPy arrays, indexing, broadcasting and vectorisation; then time a Python loop against a NumPy operation on 10 lakh numbers to see the speed difference.",
   "Watch the Pandas lessons on Series, DataFrames and reading CSV, Excel and JSON; load a real CSV in Colab and explore it with head(), info() and describe().",
   "Watch the lessons on filtering, groupby, merge/join and pivot; then do the Practice exercises on this page.",
   "Watch the lessons on missing values, duplicates and dates; then clean one messy real dataset from start to finish in Colab.",
   "Take the quiz (aim for 70%+).",
   "Do the Self-check tasks and push the notebook to GitHub with a short README."
  ],
  "selfCheck": [
   "Download a mandi price CSV from data.gov.in (Agmarknet data), load it with Pandas, and find the average modal price (the most common trading price) of onion in each state.",
   "Create a DataFrame of 10 orders with some blank cities and two duplicate rows. Remove the duplicates, fill or drop the blanks, and write one line justifying each choice.",
   "Make two tables, customers (id, name, city) and orders (order_id, customer_id, amount), and merge them to get the total spend per city.",
   "Convert a column of date strings like '05-03-2026' into dates, stating the day-first format explicitly, and count the orders on each weekday.",
   "Without a loop, use NumPy to add 18% GST to an array of 1,000 prices and count how many final prices are above ₹5,000."
  ],
  "commonMistakes": [
   "Writing Python loops over DataFrame rows. It is slow and harder to read; use column operations, groupby and merge instead.",
   "Reading Indian dates wrongly. '05-03-2026' means 5 March in India but can be read as 3 May; pass format='%d-%m-%Y' (or dayfirst=True) to pd.to_datetime and check a few rows by eye.",
   "Dropping every row that has a missing value without looking first. You may lose most of your data or skew it; count the missing values per column with df.isna().sum() and then decide column by column."
  ],
  "indiaExample": "Agmarknet, the government's agricultural marketing information portal, publishes daily mandi (wholesale market) prices for crops such as onion and tomato, and this data can also be downloaded from data.gov.in. With Pandas you can clean it, group prices by state and month, and spot sudden price spikes, using exactly the filtering, groupby and date skills taught in this module.",
  "tip": "Print df.shape before and after every cleaning step. If the number of rows changes when you did not expect it, especially after a merge, stop and find out why before you go further."
 },
 {
  "id": "l1-eda-viz-sql",
  "level": 1,
  "title": "EDA, Visualisation & SQL",
  "topics": [
   "exploratory data analysis workflow",
   "univariate, bivariate, multivariate analysis",
   "Matplotlib, Seaborn, Plotly",
   "outliers",
   "SQL: SELECT, WHERE, GROUP BY, JOIN, window functions",
   "telling a story with data"
  ],
  "overview": "EDA (exploratory data analysis) means getting to know your data before you trust it, like a doctor's check-up before writing a prescription. You look at each column alone (univariate), at pairs of columns together (bivariate) and at several at once (multivariate), hunting for patterns, errors and outliers (values far away from the rest). Charts make these patterns visible: Matplotlib is the basic plotting library, Seaborn draws statistical charts in one line, and Plotly makes interactive charts you can hover over and zoom. SQL (Structured Query Language) is how you ask questions of data stored in databases, which is where most company data lives. The module ends with turning your findings into a short, clear story that a client can act on.",
  "whyItMatters": "SQL and clear charts are core skills for data-analyst roles, and they are how you win client trust. A dashboard or a one-page insight report is often the first paid project an AI agency delivers.",
  "outcomes": [
   "You will be able to follow a step-by-step EDA workflow on a new dataset and write down what you found.",
   "You will be able to choose the right chart (histogram, bar, line, scatter, box plot, heatmap) for a given question.",
   "You will be able to make clear, labelled charts with Matplotlib, Seaborn and Plotly.",
   "You will be able to detect outliers with box plots and the IQR rule, and decide whether to keep, fix or remove each one.",
   "You will be able to write SQL queries with SELECT, WHERE, GROUP BY, ORDER BY and JOIN, and use a basic window function.",
   "You will be able to turn an analysis into a short data story with one clear recommendation."
  ],
  "prerequisites": [
   "l1-numpy-pandas",
   "l1-stats (averages, spread and correlation)"
  ],
  "hours": 14,
  "keyTerms": [
   {
    "term": "EDA (exploratory data analysis)",
    "meaning": "The first look at a dataset, using summaries and charts, to understand it and find problems before building any model."
   },
   {
    "term": "Univariate / bivariate / multivariate",
    "meaning": "Studying one variable on its own, two together, or many at once."
   },
   {
    "term": "Histogram",
    "meaning": "A bar chart of how many values fall into each range; it shows a column's distribution."
   },
   {
    "term": "Box plot",
    "meaning": "A chart that shows a column's median, quartiles (the 25% and 75% marks) and outliers in one picture."
   },
   {
    "term": "Outlier",
    "meaning": "A value far away from the rest; sometimes an error (an age of 999), sometimes a real and important case (one very large order)."
   },
   {
    "term": "Correlation heatmap",
    "meaning": "A grid of coloured squares showing how strongly each pair of numeric columns moves together."
   },
   {
    "term": "SQL",
    "meaning": "Structured Query Language: the standard language for reading, filtering and summarising data in databases."
   },
   {
    "term": "JOIN",
    "meaning": "An SQL command that combines rows from two tables using a shared column, such as customer_id."
   },
   {
    "term": "GROUP BY",
    "meaning": "An SQL command that groups rows (for example by city) so you can count, sum or average each group."
   },
   {
    "term": "Window function",
    "meaning": "An SQL calculation across related rows that keeps every row, such as a running total or a rank within each city."
   }
  ],
  "studySteps": [
   "Watch the main playlist lessons on the EDA workflow and on univariate and bivariate analysis, following along on a real dataset in Colab.",
   "Watch the Matplotlib, Seaborn and Plotly lessons; recreate each chart yourself and add a title, axis labels and units (₹, %, dates) to every one.",
   "Watch the lessons on outliers, then find the outliers in one numeric column using a box plot and the IQR rule.",
   "Watch the SQL lessons (SELECT, WHERE, GROUP BY, JOIN, window functions); then do the Practice exercises on this page, which run SQL in your browser using SQLite.",
   "Take the quiz (aim for 70%+), then move on to the Level 1 projects and the 20-question level test.",
   "Do the Self-check tasks and finish with a one-page data story pushed to GitHub."
  ],
  "selfCheck": [
   "Pick a dataset, such as PhonePe Pulse state-wise data or a Kaggle dataset. Write ten questions about it, answer five of them with charts, and note one data-quality problem you found.",
   "For one numeric column, draw a histogram and a box plot, list the outliers using the IQR rule, and decide for each one whether it is an error or a real value.",
   "Load two CSV files into SQLite from Python and write SQL to get: total sales per city, the top 5 customers by spend (using JOIN), and each customer's rank within their city (using a window function).",
   "Answer the same question once with Pandas groupby and once with SQL GROUP BY, and check that both give the same numbers.",
   "Write a one-page report for a non-technical client: one headline finding, two supporting charts, and one recommended action with a rough ₹ estimate of its impact and how you worked it out."
  ],
  "commonMistakes": [
   "Making charts without titles, axis labels or units. A chart the client cannot read on its own has failed, so label everything and start the y-axis of bar charts at zero.",
   "Deleting outliers automatically. A huge order may be your most important customer, not an error; investigate each one before removing it, and write down what you did.",
   "Using WHERE to filter on a total in SQL. WHERE filters rows before grouping; use HAVING to filter groups after GROUP BY, for example HAVING SUM(amount) > 100000."
  ],
  "indiaExample": "PhonePe publishes PhonePe Pulse, an open dataset on GitHub with anonymised, aggregated digital-payment data, such as transaction counts, amounts and user numbers, for India, each state and each district, by quarter, in JSON files. It is a ready-made practice ground: load it with Pandas or into SQLite, chart how digital payments have grown in your state, and compare states with GROUP BY.",
  "tip": "Start every analysis by writing the business question at the top of your notebook, for example 'Which city should get our next ₹1 lakh of ad spend?'. Every chart and query should help answer it; cut the ones that do not."
 },
 {
  "id": "l2-ml-foundations",
  "level": 2,
  "title": "How Machine Learning Works",
  "topics": [
   "the ML project lifecycle",
   "features, labels, train/validation/test split",
   "underfitting vs overfitting, bias-variance trade-off",
   "data leakage",
   "scikit-learn workflow: fit/predict/transform",
   "baseline models"
  ],
  "lab": "overfit",
  "overview": "Machine learning (ML) means letting a computer find patterns in past examples so it can make predictions about new ones. Think of a student preparing for board exams: practice papers are the training data, a mock test is the validation set, and the real board exam is the test set, which must stay unseen until the end. A student who memorises last year's answers does well in practice but fails on new questions (overfitting); one who barely studies fails everywhere (underfitting). This module teaches the full ML project lifecycle (the steps from defining the problem to using the model), how to split data honestly, how to avoid data leakage (accidentally showing the model the answers), and the scikit-learn fit/predict workflow you will use in every later module.",
  "whyItMatters": "Every ML product, from a delivery app's arrival-time estimate to a bank's loan decision, follows this same lifecycle. When a model looks great in testing but fails with real customers, the cause is very often a bad split or data leakage, not the choice of algorithm.",
  "outcomes": [
   "Describe the ML project lifecycle, from defining the business problem to monitoring the model after launch",
   "Identify the features and the label for a business problem, and say whether it is regression, classification or clustering",
   "Split data into training, validation and test sets with scikit-learn's train_test_split",
   "Recognise underfitting and overfitting by comparing training and validation scores",
   "Spot common sources of data leakage and remove them",
   "Train and evaluate a model with scikit-learn's fit, predict and transform methods",
   "Build a baseline model and judge whether a real model actually beats it"
  ],
  "prerequisites": [
   "l1-python",
   "l1-numpy-pandas",
   "l1-eda-viz-sql",
   "l1-stats"
  ],
  "hours": 10,
  "keyTerms": [
   {
    "term": "Feature",
    "meaning": "An input column the model uses to make a prediction, such as distance or time of day."
   },
   {
    "term": "Label (target)",
    "meaning": "The answer the model learns to predict, such as the actual delivery time in minutes."
   },
   {
    "term": "Training set",
    "meaning": "The part of the data the model learns from."
   },
   {
    "term": "Validation set",
    "meaning": "Held-back data used to compare models and settings while you are still building."
   },
   {
    "term": "Test set",
    "meaning": "Data kept locked away and used only once, at the end, to estimate real-world performance."
   },
   {
    "term": "Underfitting",
    "meaning": "The model is too simple and does badly even on the data it was trained on."
   },
   {
    "term": "Overfitting",
    "meaning": "The model memorises the training data, including its noise, and does badly on new data."
   },
   {
    "term": "Bias-variance trade-off",
    "meaning": "Simple models make consistent, systematic errors (high bias), complex models swing with every change in the data (high variance), and a good model balances the two."
   },
   {
    "term": "Data leakage",
    "meaning": "When information that will not be available at prediction time sneaks into training and makes scores look falsely good."
   },
   {
    "term": "Baseline model",
    "meaning": "A deliberately simple model, such as always predicting the average, that any real model must beat."
   }
  ],
  "studySteps": [
   "Watch the Video lessons on what ML is and the project lifecycle first; after each lesson, write a one-line summary in your own words.",
   "Watch the lessons on train/validation/test splits, overfitting and data leakage; pause before each explanation and guess the answer.",
   "Open the Overfitting lab: increase model complexity step by step and note the point where training error keeps falling but validation error starts rising.",
   "Do the Practice exercises in the browser to get used to fit, predict and train_test_split.",
   "Take the 10-question quiz (aim for 70%+) and re-watch the lesson behind every question you miss.",
   "Finish at least two Self-check tasks in a Colab notebook before moving to [2.2 Regression & Gradient Descent](#m-l2-regression)."
  ],
  "selfCheck": [
   "Load scikit-learn's California housing data (fetch_california_housing), split it 80/20 with random_state=42, and compare a DummyRegressor (always predicts the average) with LinearRegression. Write one sentence on how much better the real model is.",
   "On the same split, train DecisionTreeRegressor with max_depth set to 1, 3, 10 and None (you don't need to know how trees work yet). Record training and test R² in a table and mark which settings underfit and which overfit.",
   "On paper, frame a problem from your own business: 'Will this enquiry become a paying client?'. List 8 possible features and the label, then cross out any feature that is only known after the enquiry converts (leakage).",
   "Explain in five sentences, to a friend with no tech background, why the test set must stay untouched until the very end."
  ],
  "commonMistakes": [
   "Scoring the model on the same data it was trained on. Always split first, and report scores only on data the model has never seen.",
   "Cleaning or scaling the full dataset before splitting, which leaks test-set information into training. Fit every preprocessing step on the training data only; scikit-learn Pipelines (taught in l2-feature-eng) do this for you.",
   "Skipping the baseline. If 95 out of 100 enquiries never convert, a 'model' that always says 'no' scores 95% accuracy, so a model with 94% accuracy is worse than doing nothing. Always compare against a simple baseline first."
  ],
  "indiaExample": "Food delivery apps such as Swiggy and Zomato show an estimated delivery time before you place an order. Predicting it is a supervised ML problem: the features include the restaurant, distance, time of day, day of the week and weather, and the label is the number of minutes past orders actually took. Because the model is always used on future orders, an honest test trains on older weeks and tests on the most recent weeks, instead of shuffling all orders randomly.",
  "tip": "Before training anything, write one line: 'At the moment of prediction, what information will I actually have?' Drop every column that fails this test. This one habit prevents the most common kind of data leakage."
 },
 {
  "id": "l2-regression",
  "level": 2,
  "title": "Regression & Gradient Descent",
  "topics": [
   "simple and multiple linear regression",
   "cost function (MSE), gradient descent: batch, stochastic, mini-batch",
   "polynomial regression",
   "regularisation: Ridge, Lasso, ElasticNet",
   "regression metrics: MAE, RMSE, R²",
   "assumptions of linear regression"
  ],
  "lab": "gradient",
  "overview": "Regression means predicting a number, such as a price, a fare or next month's sales. Imagine you have notes from 100 past auto-rickshaw rides with the distance and the fare paid; linear regression draws the straight line that best fits those points, so you can estimate the fare for a new distance. The computer finds that line with gradient descent (a method that nudges the line again and again to reduce the error), much like walking downhill in fog by taking small steps in the steepest downward direction. You will also learn to fit curves (polynomial regression), stop a model from overreacting to noise (regularisation), and measure errors in plain ₹ terms (MAE, RMSE and R²).",
  "whyItMatters": "Any product that predicts a number uses regression ideas: used-car price quotes, property price estimates, electricity demand forecasts and sales forecasts. For an agency, it gives a first, rough answer to a client question like 'If we spend ₹50,000 more on ads, about how many more leads should we expect?'",
  "outcomes": [
   "Explain how simple and multiple linear regression make predictions using weights and an intercept",
   "Describe the MSE cost function and how gradient descent reduces it, including the batch, stochastic and mini-batch versions",
   "Implement gradient descent for a straight line from scratch in NumPy",
   "Fit polynomial regression and recognise when a higher degree starts to overfit",
   "Use Ridge, Lasso and ElasticNet to control overfitting, and explain how they differ",
   "Evaluate regression models with MAE, RMSE and R², and explain each in ₹ terms to a client",
   "Check the main assumptions of linear regression using residual plots"
  ],
  "prerequisites": [
   "l2-ml-foundations",
   "l1-linalg-calc (derivatives and gradients)",
   "l1-numpy-pandas"
  ],
  "hours": 16,
  "keyTerms": [
   {
    "term": "Linear regression",
    "meaning": "A model that predicts a number as a weighted sum of the features plus a constant (the intercept)."
   },
   {
    "term": "Weight (coefficient)",
    "meaning": "The number that says how much the prediction changes when one feature goes up by one unit."
   },
   {
    "term": "Cost function (MSE)",
    "meaning": "Mean Squared Error: the average of the squared gaps between predictions and actual values, which training tries to make small."
   },
   {
    "term": "Gradient descent",
    "meaning": "A method that improves the weights step by step by moving in the direction that lowers the cost fastest."
   },
   {
    "term": "Learning rate",
    "meaning": "The size of each gradient descent step: too small is slow, too large overshoots."
   },
   {
    "term": "Mini-batch",
    "meaning": "A small group of rows (for example 32) used for one gradient descent step, in between using one row (stochastic) and all rows (batch)."
   },
   {
    "term": "Regularisation",
    "meaning": "A penalty on large weights that keeps the model simpler; Ridge (L2) shrinks weights and Lasso (L1) can set some exactly to zero."
   },
   {
    "term": "MAE",
    "meaning": "Mean Absolute Error: the average size of the errors, in the same unit as the target, such as ₹."
   },
   {
    "term": "RMSE",
    "meaning": "Root Mean Squared Error: a typical error size in the target's unit that punishes big misses more than MAE does."
   },
   {
    "term": "R² (R-squared)",
    "meaning": "The share of the variation in the target that the model explains: 1 is perfect and 0 is no better than predicting the average."
   }
  ],
  "studySteps": [
   "Watch the Video lessons on simple and multiple linear regression and the MSE cost function.",
   "Watch the gradient descent lessons (batch, stochastic, mini-batch), then open the Gradient Descent lab: try a tiny, a medium and a very large learning rate, and note which one crawls, which settles and which overshoots.",
   "Watch the lessons on polynomial regression, regularisation (Ridge, Lasso, ElasticNet), regression metrics and the assumptions of linear regression.",
   "Do the Practice exercises in the browser.",
   "Take the quiz (aim for 70%+).",
   "Complete the from-scratch gradient descent task in Self-check; it is the most important exercise in this module."
  ],
  "selfCheck": [
   "Create synthetic ride data in NumPy: fare = 30 + 15 × distance_km + random noise. Write gradient descent yourself (no scikit-learn) and check that the learned intercept and weight come close to 30 and 15.",
   "On the California housing data, scale the features with StandardScaler, then fit LinearRegression, Ridge and Lasso. Compare test RMSE and list any Lasso coefficients that became exactly zero.",
   "Generate a noisy curved dataset and fit polynomial regression with degree 1, 2, 5 and 15. Plot each fit and explain which ones underfit and which overfit.",
   "Plot residuals (actual minus predicted) against predicted values for your best model. Describe any pattern, such as a curve or a funnel shape, and what it suggests.",
   "On paper: a used-car price model has an MAE of ₹40,000 but an RMSE of ₹1,20,000. Explain what the large gap tells you about its errors."
  ],
  "commonMistakes": [
   "Not scaling features before gradient descent, Ridge or Lasso. When one feature is in lakhs of ₹ and another is in years, training becomes slow and the penalty treats features unfairly. Apply StandardScaler first.",
   "Choosing a learning rate that is too large, so the loss grows or turns into NaN (not a number). If that happens, divide the learning rate by 10 and try again.",
   "Reading a high training R² as success. Check R² and RMSE on the test set, and remember that test R² can even be negative when the model is worse than predicting the average."
  ],
  "indiaExample": "Used-car platforms such as Cars24, CarDekho and CarWale offer online valuation tools: you enter the make, model, year, fuel type, kilometres driven and city, and get a price estimate. Predicting a ₹ amount from such features is a regression problem. Indian rules shape the features too: in Delhi-NCR, diesel cars older than 10 years and petrol cars older than 15 years are not allowed to run, so a feature such as 'years left before the age limit' can matter for cars registered there.",
  "tip": "Always plot residuals (actual minus predicted). A curve or a funnel in that plot shows what the model is missing, which a single R² number hides."
 },
 {
  "id": "l2-classification",
  "level": 2,
  "title": "Classification Algorithms",
  "topics": [
   "logistic regression and the sigmoid",
   "K-Nearest Neighbours",
   "Naive Bayes",
   "Support Vector Machines and kernels",
   "multiclass classification",
   "decision boundaries"
  ],
  "lab": "knn",
  "overview": "Classification means predicting a category instead of a number: spam or not spam, will buy or won't, or which of five product types. Think of a mango trader sorting fruit into 'export quality' and 'local market' using size, colour and firmness; a classifier learns that sorting rule from past examples. You will learn four classic methods: logistic regression (turns a score into a probability using the S-shaped sigmoid curve), K-Nearest Neighbours (copies the answer of the most similar past examples), Naive Bayes (combines word or feature probabilities, popular for spam filters) and Support Vector Machines (draw the widest possible gap between groups). For each one you will see its decision boundary (the line or curve where the prediction switches from one class to another), which explains why some methods suit some data better.",
  "whyItMatters": "Classification powers spam filters, fraud alerts, loan approvals and lead scoring. For an agency, a lead-scoring model that ranks enquiries by how likely they are to convert is a practical service you can build for clients.",
  "outcomes": [
   "Explain how logistic regression turns a weighted sum into a probability with the sigmoid function",
   "Train and compare logistic regression, KNN, Naive Bayes and SVM classifiers in scikit-learn",
   "Choose a sensible k for KNN and explain why features must be scaled for KNN and SVM",
   "Build a simple text spam filter with Naive Bayes",
   "Explain what a kernel does in an SVM and when a curved boundary is needed",
   "Handle problems with more than two classes using one-vs-rest and multinomial approaches",
   "Plot and interpret decision boundaries on two-feature data"
  ],
  "prerequisites": [
   "l2-regression",
   "l1-stats (probability and Bayes theorem)"
  ],
  "hours": 16,
  "keyTerms": [
   {
    "term": "Classifier",
    "meaning": "A model that predicts a category (class) rather than a number."
   },
   {
    "term": "Sigmoid",
    "meaning": "An S-shaped function that squeezes any number into a value between 0 and 1, so it can be read as a probability."
   },
   {
    "term": "Threshold",
    "meaning": "The probability cut-off (0.5 by default) above which the model says 'yes'."
   },
   {
    "term": "Decision boundary",
    "meaning": "The line or curve where the model's prediction switches from one class to another."
   },
   {
    "term": "K-Nearest Neighbours (KNN)",
    "meaning": "A method that predicts by looking at the k most similar past examples and taking a majority vote."
   },
   {
    "term": "Euclidean distance",
    "meaning": "The straight-line distance between two points, which KNN uses to decide which examples are 'nearest'."
   },
   {
    "term": "Naive Bayes",
    "meaning": "A fast probability-based classifier that assumes the features are independent of each other within each class; it works well for text."
   },
   {
    "term": "Support Vector Machine (SVM)",
    "meaning": "A classifier that finds the boundary with the widest possible margin (gap) between the classes."
   },
   {
    "term": "Kernel",
    "meaning": "A mathematical trick that lets an SVM draw curved boundaries by comparing points in a transformed space."
   },
   {
    "term": "One-vs-rest",
    "meaning": "A way to handle many classes by training one yes/no classifier per class and picking the most confident one."
   }
  ],
  "studySteps": [
   "Watch the Video lessons on logistic regression and the sigmoid; compute the sigmoid of a few numbers by hand as you go.",
   "Watch the KNN lessons, then open the KNN lab: change k from 1 to a large value and watch the decision boundary go from jagged (overfitting) to over-smooth (underfitting).",
   "Watch the lessons on Naive Bayes, SVMs and kernels, and multiclass classification.",
   "Do the Practice exercises in the browser.",
   "Take the quiz (aim for 70%+).",
   "Complete the model-comparison and spam-filter tasks in Self-check."
  ],
  "selfCheck": [
   "On scikit-learn's breast cancer dataset (load_breast_cancer), scale the features and train LogisticRegression, KNeighborsClassifier (k=5), GaussianNB and SVC. Put their test accuracies in one table and write two sentences on which you would pick and why.",
   "Compute the sigmoid of −2, 0 and 2 by hand or in Python. Check that you get about 0.12, 0.50 and 0.88, and explain what each means as a probability.",
   "Write 20 short SMS messages yourself, half normal and half scam-style (for example 'Your KYC is pending, click this link'). Build a spam filter with CountVectorizer and MultinomialNB, then test it on 5 new messages.",
   "Create curved two-class data with make_moons. Plot the decision boundaries of LogisticRegression and SVC(kernel='rbf') and explain why one is straight and the other curves.",
   "Train KNN on data with 'monthly income in ₹' and 'age in years', first without scaling and then with StandardScaler. Explain why the results differ."
  ],
  "commonMistakes": [
   "Forgetting to scale features for KNN and SVM. A salary column in lakhs swamps an age column, so 'nearest' really means 'closest salary'. Put StandardScaler before these models.",
   "Using only predict() and ignoring predict_proba(). The probability lets you rank customers and choose your own threshold, which matters a lot in l2-metrics-tuning.",
   "Judging a classifier by accuracy without checking how many examples each class has. Run value_counts() on the label first; if one class is rare, accuracy can mislead (the next module covers this fully)."
  ],
  "indiaExample": "In 2024 Bharti Airtel launched an AI-based spam detection system on its network that marks suspicious incoming calls and SMS as 'Suspected Spam' for its customers. At its heart this is binary classification: each call or message is sorted into spam or not spam using signals such as how often a number calls or messages and how long its calls last. A mistake in either direction has a cost (an annoyed customer or a missed scam), which is why the next module on metrics and thresholds matters.",
  "tip": "Start every classification project with logistic regression on scaled features. It is fast, its weights are easy to explain, and it gives you a clear benchmark; move to SVMs or tree models only if they clearly beat it."
 },
 {
  "id": "l2-metrics-tuning",
  "level": 2,
  "title": "Model Evaluation & Tuning",
  "topics": [
   "confusion matrix, accuracy, precision, recall, F1",
   "ROC-AUC, PR curves, thresholds",
   "cross-validation (k-fold, stratified)",
   "hyperparameter tuning: grid, random, Optuna",
   "imbalanced datasets: class weights, SMOTE",
   "choosing metrics for business cost (₹ impact)"
  ],
  "lab": "threshold",
  "overview": "A model is only as good as the way you measure it. Think of an airport metal detector: set it too sensitive and it beeps for every belt buckle (false alarms); set it too relaxed and it misses real threats. This module teaches you to count both kinds of mistakes with a confusion matrix (a 2×2 table of right and wrong predictions), turn them into metrics such as precision and recall, and set the threshold (the sensitivity knob) based on what each mistake costs in ₹. You will also learn cross-validation (testing on several different splits for a more reliable score), hyperparameter tuning (searching for the best model settings), and fixes for imbalanced data, where one class is rare.",
  "whyItMatters": "Fraud detection, medical screening and lead scoring all involve rare events where accuracy is misleading. Being able to show a client that one threshold loses less money in missed sales and wasted follow-up calls than another is what turns a model into a business decision.",
  "outcomes": [
   "Read a confusion matrix and calculate accuracy, precision, recall and F1 by hand",
   "Use ROC-AUC and precision-recall curves to compare models across all thresholds",
   "Choose a decision threshold that keeps the total ₹ cost of errors lowest",
   "Run k-fold and stratified k-fold cross-validation for more reliable scores",
   "Tune hyperparameters with GridSearchCV, RandomizedSearchCV and Optuna",
   "Handle imbalanced datasets with class weights and SMOTE without leaking data",
   "Pick the right metric for a business problem and explain the choice to a non-technical client"
  ],
  "prerequisites": [
   "l2-classification",
   "l2-ml-foundations"
  ],
  "hours": 14,
  "keyTerms": [
   {
    "term": "Confusion matrix",
    "meaning": "A table that counts true positives, false positives, true negatives and false negatives."
   },
   {
    "term": "Precision",
    "meaning": "Of everything the model flagged as positive, the share that really was positive."
   },
   {
    "term": "Recall",
    "meaning": "Of all the real positives, the share the model managed to catch."
   },
   {
    "term": "F1 score",
    "meaning": "One number that balances precision and recall (their harmonic mean)."
   },
   {
    "term": "ROC-AUC",
    "meaning": "A score from about 0.5 (random guessing) to 1.0 (perfect) for how well a model ranks positives above negatives across all thresholds."
   },
   {
    "term": "Precision-recall (PR) curve",
    "meaning": "A plot of precision against recall at every threshold, more informative than ROC when positives are rare."
   },
   {
    "term": "Cross-validation",
    "meaning": "Splitting the training data into k parts and training k times, each time testing on a different part, then averaging the scores."
   },
   {
    "term": "Hyperparameter",
    "meaning": "A setting you choose before training, such as k in KNN or the depth of a tree, rather than something the model learns."
   },
   {
    "term": "Class imbalance",
    "meaning": "When one class is much rarer than the other, such as fraud among normal transactions."
   },
   {
    "term": "SMOTE",
    "meaning": "A technique that creates synthetic examples of the rare class by blending nearby real examples."
   }
  ],
  "studySteps": [
   "Watch the Video lessons on the confusion matrix, precision, recall and F1; calculate each metric on paper for the examples shown.",
   "Watch the lessons on ROC and PR curves, then open the Threshold lab: move the threshold and watch how the confusion matrix, precision and recall change. Find the point where catching more positives starts creating too many false alarms.",
   "Watch the lessons on cross-validation, hyperparameter tuning and imbalanced data.",
   "Do the Practice exercises in the browser.",
   "Take the quiz (aim for 70%+).",
   "Complete the ₹ cost threshold task in Self-check; it is the most directly useful skill for client work in this level."
  ],
  "selfCheck": [
   "On paper: a fraud model flags 100 transactions, 30 of them are real fraud, and there were 50 frauds in total. Calculate precision, recall and F1. (Answers: 30%, 60% and 40%.)",
   "Assume missing a fraud costs ₹20,000 and a false alarm costs ₹200 (one support call). Train a classifier, get probabilities with predict_proba, try thresholds from 0.05 to 0.95, and plot the total ₹ cost for each. Report the cheapest threshold.",
   "Compare one train/test split with 5-fold cross_val_score on the same model. Report the mean and standard deviation, and explain why a single split could mislead you.",
   "Tune one model with GridSearchCV, then with RandomizedSearchCV or Optuna (run pip install optuna in Colab first) using a similar time budget. Compare the best scores and the time taken.",
   "Make imbalanced data with make_classification(weights=[0.95, 0.05]). Compare no fix, class_weight='balanced', and SMOTE inside an imbalanced-learn Pipeline, using recall and average precision."
  ],
  "commonMistakes": [
   "Reporting accuracy on imbalanced data. If only 1 in 100 transactions is fraud, always predicting 'not fraud' scores 99%. Use precision, recall, F1 or PR-AUC instead.",
   "Tuning against the test set by checking it after every change. Tune with cross-validation on the training data, and look at the test set once, at the very end.",
   "Applying SMOTE before splitting or before cross-validation, so synthetic copies based on validation rows leak into training. Put SMOTE inside an imbalanced-learn Pipeline so it runs only on the training folds."
  ],
  "indiaExample": "In December 2024 the Reserve Bank of India announced MuleHunter.AI, an AI/ML model built by the Reserve Bank Innovation Hub to help banks find mule accounts (bank accounts used to receive and pass on money from frauds). Mule accounts are a tiny share of all accounts, so accuracy is useless here. A bank has to balance recall (catching as many mule accounts as possible) against precision (not freezing honest customers' accounts by mistake), which is exactly the threshold and cost trade-off this module teaches.",
  "tip": "Before training, agree with the client what a false positive and a false negative each cost in ₹, even as a rough estimate. That one conversation decides your metric and your threshold."
 },
 {
  "id": "l2-trees-ensembles",
  "level": 2,
  "title": "Decision Trees & Ensembles",
  "topics": [
   "decision trees: entropy, Gini, information gain",
   "pruning",
   "bagging and random forest",
   "boosting: AdaBoost, gradient boosting",
   "XGBoost, LightGBM, CatBoost",
   "feature importance and SHAP"
  ],
  "lab": "tree",
  "overview": "A decision tree makes predictions by asking a chain of yes/no questions, like the game of 20 questions or a loan officer's checklist: 'Is monthly income above ₹50,000? Has the customer missed an EMI?'. One tree is easy to explain but tends to memorise its training data, and ensembles (groups of models whose answers are combined) fix this. A random forest is like asking 100 doctors who each saw slightly different patients and taking a vote; boosting is like a student who studies their mistakes after each mock test and focuses on the weak chapters. On tables of business data, boosted trees such as XGBoost, LightGBM and CatBoost are often the most accurate models available, and SHAP lets you explain each prediction.",
  "whyItMatters": "Gradient-boosted trees are a standard choice in industry for tabular problems such as credit risk, customer churn, insurance pricing and demand forecasting, and they appear in many winning Kaggle solutions. Explaining them clearly with SHAP is how you earn a client's trust in the model.",
  "outcomes": [
   "Explain how a decision tree chooses splits using Gini impurity, entropy and information gain",
   "Control overfitting in trees with depth limits, minimum leaf size and pruning",
   "Explain bagging and why a random forest usually beats a single tree",
   "Explain how boosting builds trees one after another to fix earlier errors",
   "Train and tune XGBoost, LightGBM or CatBoost models with early stopping",
   "Explain a model's predictions with feature importance and SHAP values"
  ],
  "prerequisites": [
   "l2-classification",
   "l2-metrics-tuning (cross-validation)"
  ],
  "hours": 16,
  "keyTerms": [
   {
    "term": "Decision tree",
    "meaning": "A model that predicts by following a chain of yes/no questions about the features."
   },
   {
    "term": "Gini impurity",
    "meaning": "A measure of how mixed the classes are in a group, where 0 means every member is the same class."
   },
   {
    "term": "Entropy",
    "meaning": "Another measure of how mixed or uncertain a group is, borrowed from information theory."
   },
   {
    "term": "Information gain",
    "meaning": "How much a split reduces entropy; the tree picks the split with the largest gain."
   },
   {
    "term": "Pruning",
    "meaning": "Cutting back a tree, or limiting its growth, so it stops memorising noise."
   },
   {
    "term": "Bagging",
    "meaning": "Training many models on random samples of the data drawn with replacement, then combining their answers."
   },
   {
    "term": "Random forest",
    "meaning": "Bagging with decision trees, where each split also looks at only a random subset of the features."
   },
   {
    "term": "Boosting",
    "meaning": "Building models one after another, each one focusing on the mistakes of the ones before it."
   },
   {
    "term": "Early stopping",
    "meaning": "Stopping boosting when the validation score stops improving, to avoid overfitting."
   },
   {
    "term": "SHAP value",
    "meaning": "A number showing how much one feature pushed one specific prediction up or down."
   }
  ],
  "studySteps": [
   "Watch the Video lessons on decision trees, then work through one split by hand: calculate the Gini impurity before and after the split.",
   "Watch the lessons on pruning, bagging and random forests.",
   "Watch the boosting lessons in order: AdaBoost, gradient boosting, then XGBoost, LightGBM and CatBoost.",
   "Watch the lesson on feature importance and SHAP, then do the Practice exercises in the browser.",
   "Take the quiz (aim for 70%+).",
   "Complete the Self-check tasks, ending with a SHAP explanation written for a non-technical reader."
  ],
  "selfCheck": [
   "By hand: a node has 6 customers who bought and 4 who did not. Calculate its Gini impurity (1 − 0.6² − 0.4² = 0.48). Then invent a split into two child nodes and check whether the weighted Gini goes down.",
   "Train DecisionTreeClassifier with no depth limit and with max_depth=4. Compare training and test accuracy, and draw the small tree with plot_tree.",
   "Using 5-fold cross-validation on one dataset, compare a single tree, RandomForestClassifier and a boosted model (XGBClassifier, LGBMClassifier or scikit-learn's HistGradientBoostingClassifier).",
   "Make a SHAP summary plot for your boosted model in Colab (run pip install shap first if it is missing) and explain the top three features in plain English, as if to a client.",
   "Write five sentences: when would you choose a small, readable tree over XGBoost even if it is slightly less accurate?"
  ],
  "commonMistakes": [
   "Letting a tree grow with no limits, so it memorises the training data. Set max_depth or min_samples_leaf and compare training and validation scores.",
   "Treating feature importance or SHAP as proof of cause. They show what the model relies on, not what causes the outcome, and the default impurity-based importance can favour columns with many unique values. Cross-check with permutation importance.",
   "Tuning dozens of XGBoost settings before having a baseline. Start with the default settings, then tune the number of trees, the learning rate and the depth, using early stopping on a validation set."
  ],
  "indiaExample": "Indian digital lenders, including banks, NBFCs (non-banking financial companies) and fintech apps, decide on small personal and business loans using tabular data: income, existing EMIs, credit bureau history such as the CIBIL score and, with the customer's consent, bank-statement data shared through RBI's Account Aggregator framework. Gradient-boosted trees are a common choice for this kind of credit-risk model. Because a rejected applicant or a regulator may ask why, explanation tools like SHAP can help a lender show which factors drove a decision.",
  "tip": "On tabular data, try HistGradientBoostingClassifier or LightGBM with default settings early in the project. It often gives a strong score within minutes, so you can spend your time on features and validation instead of on settings."
 },
 {
  "id": "l2-unsupervised",
  "level": 2,
  "title": "Unsupervised Learning",
  "topics": [
   "K-Means and the elbow method",
   "hierarchical clustering",
   "DBSCAN",
   "PCA and dimensionality reduction",
   "t-SNE/UMAP (intuition)",
   "anomaly detection",
   "customer segmentation (RFM)"
  ],
  "lab": "kmeans",
  "overview": "Unsupervised learning finds structure in data that has no labels (no right answers to learn from). Imagine tipping a big box of mixed buttons onto a table and sorting them into piles by size and colour, without anyone telling you the categories: that is clustering. You will learn three ways to cluster (K-Means, hierarchical clustering and DBSCAN), PCA (Principal Component Analysis, which squeezes many columns into a few while keeping most of the information), t-SNE and UMAP for drawing complex data as 2D pictures, and anomaly detection for spotting records that don't fit the usual pattern. You will finish by segmenting customers with RFM (Recency, Frequency, Monetary value), a method marketers use every day.",
  "whyItMatters": "Customer segmentation, spotting fraud or data errors, and making sense of large datasets all start with unsupervised learning. For a digital agency, RFM segments turn a client's raw order list into clear groups, such as 'loyal big spenders' and 'lapsed customers', that each get a different campaign.",
  "outcomes": [
   "Cluster data with K-Means and choose the number of clusters with the elbow method and the silhouette score",
   "Build and read a dendrogram from hierarchical clustering",
   "Use DBSCAN to find clusters of any shape and flag noise points",
   "Reduce many features to a few with PCA and say how much information is kept",
   "Visualise complex, many-column data with t-SNE or UMAP and avoid common misreadings",
   "Detect unusual records with Isolation Forest",
   "Segment customers with RFM and turn each segment into a business action"
  ],
  "prerequisites": [
   "l2-ml-foundations",
   "l1-linalg-calc (vectors; eigenvectors for PCA)",
   "l1-numpy-pandas (groupby and dates for RFM)"
  ],
  "hours": 14,
  "keyTerms": [
   {
    "term": "Clustering",
    "meaning": "Grouping similar records together without being told the groups in advance."
   },
   {
    "term": "Centroid",
    "meaning": "The centre point of a cluster, found by averaging its members."
   },
   {
    "term": "Inertia",
    "meaning": "The total squared distance from each point to its cluster's centre; lower means tighter clusters."
   },
   {
    "term": "Elbow method",
    "meaning": "Plotting inertia against the number of clusters and picking the point where the improvement slows sharply."
   },
   {
    "term": "Silhouette score",
    "meaning": "A score from −1 to 1 showing how well each point fits its own cluster compared with the next nearest cluster."
   },
   {
    "term": "Dendrogram",
    "meaning": "A tree diagram showing the order in which hierarchical clustering merged groups."
   },
   {
    "term": "DBSCAN",
    "meaning": "A clustering method that groups points in crowded areas and labels isolated points as noise."
   },
   {
    "term": "PCA",
    "meaning": "A method that creates a few new columns (principal components) that capture most of the variation in many original columns."
   },
   {
    "term": "Anomaly",
    "meaning": "A record that is very different from the rest, such as an unusually large late-night transaction."
   },
   {
    "term": "RFM",
    "meaning": "Recency (days since last purchase), Frequency (number of purchases) and Monetary value (total spend), used to segment customers."
   }
  ],
  "studySteps": [
   "Watch the Video lessons on K-Means and the elbow method, then open the K-Means lab: run the algorithm step by step, watch the centroids move, and try different values of k and different starting points.",
   "Watch the lessons on hierarchical clustering and DBSCAN, and note one kind of data where each one beats K-Means.",
   "Watch the lessons on PCA, t-SNE/UMAP and anomaly detection.",
   "Do the Practice exercises in the browser.",
   "Take the quiz (aim for 70%+).",
   "Complete the RFM segmentation task in Self-check and save it as a portfolio notebook."
  ],
  "selfCheck": [
   "Download the 'Online Retail' dataset from the UCI Machine Learning Repository (orders from a UK online shop; the method is the same for an Indian D2C brand). Remove cancelled orders (negative Quantity), build an RFM table per CustomerID with Pandas groupby, scale it, and run K-Means for k = 2 to 8. Plot the elbow and silhouette scores, pick k, and give each segment a business name and one campaign idea.",
   "Run K-Means and DBSCAN on make_moons data. Plot both results and explain why K-Means splits the moons wrongly and DBSCAN does not.",
   "Apply PCA to scikit-learn's digits dataset (64 pixel columns). Find how many components keep 90% of the variance, and plot the first two components coloured by digit.",
   "Generate 1,000 normal transaction amounts plus 10 extreme ones. Run IsolationForest and check how many of the extreme ones it flags.",
   "On paper, explain to a client why 'Cluster 3' means nothing until you look at its average R, F and M values and give it a name."
  ],
  "commonMistakes": [
   "Not scaling features before K-Means or PCA. Total spend in thousands of ₹ swamps 'days since last order', so the clusters end up based on spend alone. Apply StandardScaler first.",
   "Treating the elbow point as an exact answer. The elbow is often blurry, so combine it with the silhouette score and with whether the segments make business sense.",
   "Over-reading t-SNE or UMAP plots. The sizes of clusters and the gaps between them in these pictures are not reliable, so use them to explore, not as proof."
  ],
  "indiaExample": "In 2023 India's GST authorities ran a nationwide special drive against fake GST registrations. GSTN (the GST Network) used data analytics and risk parameters to shortlist suspicious registrations, which tax officers then verified in person. Picking out records that don't behave like the rest, without a complete list of known frauds, is the core idea of the anomaly detection taught in this module.",
  "tip": "Give every cluster a human name and a business action, such as 'lapsed high spenders: send a win-back WhatsApp offer'. If you cannot name a cluster, the clustering is not useful yet."
 },
 {
  "id": "l2-feature-eng",
  "level": 2,
  "title": "Feature Engineering, Pipelines & Kaggle",
  "topics": [
   "encoding categorical data",
   "scaling and transformation",
   "feature selection",
   "scikit-learn Pipelines and ColumnTransformer",
   "time-series basics (lags, rolling features)",
   "how to approach a Kaggle competition",
   "end-to-end ML project"
  ],
  "overview": "Feature engineering means turning raw data into inputs a model can learn from well, and it often improves results more than switching algorithms does. Think of cooking: the same vegetables make a much better dish once they are washed, chopped and marinated. A scikit-learn Pipeline is the written recipe: it records every preparation step so the exact same steps run during practice, during testing and when real customers use the model. You will learn to encode categories (turn text such as city names into numbers), scale and transform columns, select useful features, build lag and rolling features for time-series data (data recorded over time), approach a Kaggle competition sensibly, and finish one end-to-end ML project for your portfolio.",
  "whyItMatters": "Real business data is messy, with city names, dates, missing values and festival spikes. Turning it into a reliable, reusable Pipeline is what employers and clients pay for, and a finished end-to-end project on GitHub is clear proof of skill for jobs and freelance work.",
  "outcomes": [
   "Encode categorical data with one-hot, ordinal and target encoding, and know when to use each",
   "Scale and transform numeric features, including log transforms for skewed values such as prices",
   "Select useful features with filter, wrapper and model-based methods",
   "Build leak-free preprocessing with scikit-learn Pipelines and ColumnTransformer",
   "Create lag, rolling and date features for time-series data and validate them with time-based splits",
   "Approach a Kaggle competition: read the metric, build a baseline, trust cross-validation, and submit",
   "Complete and publish an end-to-end ML project with a clear README"
  ],
  "prerequisites": [
   "l2-metrics-tuning",
   "l2-trees-ensembles",
   "l1-numpy-pandas (working with dates)",
   "l1-tools (GitHub)"
  ],
  "hours": 20,
  "keyTerms": [
   {
    "term": "Feature engineering",
    "meaning": "Creating, transforming or choosing input columns so a model can learn better."
   },
   {
    "term": "One-hot encoding",
    "meaning": "Turning a category column into several 0/1 columns, one for each category."
   },
   {
    "term": "Ordinal encoding",
    "meaning": "Turning ordered categories, such as Small < Medium < Large, into numbers that keep the order."
   },
   {
    "term": "Target encoding",
    "meaning": "Replacing each category with the average label for that category, calculated carefully to avoid leakage."
   },
   {
    "term": "Log transform",
    "meaning": "Taking the logarithm of a skewed column, such as income, so a few huge values don't dominate."
   },
   {
    "term": "Pipeline",
    "meaning": "A scikit-learn object that chains preprocessing steps and a model so they always run together, in order."
   },
   {
    "term": "ColumnTransformer",
    "meaning": "A tool that applies different preprocessing to different columns, such as scaling numbers and encoding text."
   },
   {
    "term": "Lag feature",
    "meaning": "A past value used as an input, such as yesterday's sales to predict today's."
   },
   {
    "term": "Rolling feature",
    "meaning": "A summary over a moving window of past values, such as the average sales of the last 7 days."
   },
   {
    "term": "Public vs private leaderboard",
    "meaning": "On Kaggle, the public leaderboard scores part of the test data during the contest, while the final ranking uses the hidden private part."
   }
  ],
  "studySteps": [
   "Watch the Video lessons on encoding categorical data, scaling and transformations, and feature selection.",
   "Watch the lessons on Pipelines and ColumnTransformer, then rebuild the lesson's pipeline yourself in Colab without looking.",
   "Watch the time-series basics lessons (lags, rolling features and time-based splits).",
   "Do the Practice exercises in the browser, then take the quiz (aim for 70%+).",
   "Watch the lessons on approaching a Kaggle competition, then join a beginner competition (Titanic or House Prices) and submit at least one Pipeline-based solution.",
   "Complete the end-to-end project: choose a dataset, build and evaluate a model, save it, and publish the notebook and README on GitHub."
  ],
  "selfCheck": [
   "On Kaggle's Titanic or House Prices data, build one Pipeline with a ColumnTransformer: SimpleImputer and StandardScaler for numeric columns, SimpleImputer and OneHotEncoder(handle_unknown='ignore') for text columns, then a model. Score the whole Pipeline with cross_val_score.",
   "For a daily sales series, create lag-1, lag-7 and 7-day rolling-mean features with shift() and rolling(). Make sure the rolling mean uses only past days (shift by one before rolling), and validate with TimeSeriesSplit.",
   "Kaggle's House Prices competition scores predictions on the logarithm of the sale price. Compare a model trained on SalePrice directly with one trained on log(SalePrice) and converted back, and explain which does better and why.",
   "Save your fitted Pipeline with joblib, load it in a fresh notebook, and predict on three new rows you type by hand.",
   "Write a README for your project with five headings: Problem, Data, Approach, Results (with the metric), and Next steps."
  ],
  "commonMistakes": [
   "Using pd.get_dummies separately on training and test data, which gives mismatched columns, or encoding before splitting, which leaks information. Use OneHotEncoder(handle_unknown='ignore') inside a Pipeline instead.",
   "Building lag or rolling features that include the current or a future day, then shuffling time-series data with random k-fold. Shift before rolling, and use TimeSeriesSplit so the model is always tested on later dates.",
   "Chasing the Kaggle public leaderboard. It scores only part of the test data, so a model tuned to it can drop when the private leaderboard is revealed. Trust your own cross-validation score."
  ],
  "indiaExample": "Quick-commerce apps such as Blinkit, Zepto and Swiggy Instamart deliver within minutes from small neighbourhood warehouses (dark stores), so each store must stock the right quantity of each item in advance. That is a time-series demand-forecasting problem. A typical model uses exactly the features in this module: sales yesterday and on the same day last week (lags), 7-day and 28-day averages (rolling features), the day of the week, and flags for festivals such as Diwali or Holi, when demand for items like sweets, diyas or colours jumps.",
  "tip": "Keep one notebook template for every project: load → split → Pipeline → cross-validate → tune → test once → save. Reusing the same skeleton saves hours and makes leakage much harder."
 },
 {
  "id": "l3-nn-basics",
  "level": 3,
  "title": "Neural Networks from Scratch",
  "topics": [
   "perceptron and multilayer perceptron",
   "activation functions",
   "forward pass, loss functions",
   "backpropagation and the chain rule",
   "optimisers: SGD, momentum, Adam",
   "regularisation: dropout, batch norm, weight decay",
   "vanishing/exploding gradients"
  ],
  "lab": "neuralnet",
  "overview": "A neural network is a stack of simple maths units called neurons: each one multiplies its inputs by weights (importance numbers), adds them up, and passes the total through an activation function (a small rule that decides how strongly it 'fires'). Think of a hiring panel: junior interviewers each score one aspect of a candidate, a senior combines their scores, and a manager makes the final call; after every bad hire, everyone adjusts how much they trust each signal. Training works the same way: the forward pass makes a guess, the loss function measures how wrong it was, backpropagation (the chain rule from calculus) works out how each weight should change, and an optimiser such as SGD or Adam makes that change. You will build a small network from scratch in NumPy, so nothing in PyTorch feels like magic later, and learn the tricks (dropout, batch normalisation, weight decay) that stop networks memorising their data or getting stuck.",
  "whyItMatters": "Every modern AI product, from face unlock on your phone to Google Translate and ChatGPT, is a neural network trained with this same loop of guess, measure and adjust. When a client's model refuses to learn or memorises its training data, these basics let you find the cause instead of guessing.",
  "outcomes": [
   "You will be able to draw a multilayer perceptron and explain, step by step, how it turns inputs into a prediction.",
   "You will be able to choose a suitable activation function (ReLU, sigmoid, softmax) and loss function (mean squared error, cross-entropy) for a given problem.",
   "You will be able to work through backpropagation by hand for a tiny network using the chain rule.",
   "You will be able to code and train a two-layer network in NumPy that beats logistic regression on curved (non-linear) data.",
   "You will be able to compare SGD, momentum and Adam, and explain what the learning rate controls.",
   "You will be able to use dropout, batch normalisation and weight decay to reduce overfitting, and explain why each one helps.",
   "You will be able to recognise vanishing and exploding gradients from a training curve and name two fixes for each."
  ],
  "prerequisites": [
   "l2-regression",
   "l2-classification",
   "l1-linalg-calc",
   "l1-numpy-pandas"
  ],
  "hours": 18,
  "keyTerms": [
   {
    "term": "Neuron",
    "meaning": "A tiny unit that multiplies each input by a weight, adds them up with a bias (a constant), and passes the total through an activation function."
   },
   {
    "term": "Perceptron",
    "meaning": "The simplest neural network: a single neuron that draws one straight line to separate two classes."
   },
   {
    "term": "Multilayer perceptron (MLP)",
    "meaning": "Neurons arranged in layers where each layer's outputs feed the next; the layers between input and output are called hidden layers."
   },
   {
    "term": "Activation function",
    "meaning": "A rule applied after each neuron's sum, such as ReLU (keep positive numbers, turn negatives into 0), that lets the network learn curved patterns."
   },
   {
    "term": "Loss function",
    "meaning": "A single number that says how wrong the predictions are, such as mean squared error for numbers or cross-entropy for categories."
   },
   {
    "term": "Backpropagation",
    "meaning": "The method that uses the chain rule to calculate, for every weight, how much the loss would change if that weight changed a little (its gradient)."
   },
   {
    "term": "Learning rate",
    "meaning": "The size of each correction step; too small and training crawls, too large and the loss jumps around or blows up."
   },
   {
    "term": "Adam",
    "meaning": "A popular optimiser (the rule that updates the weights) that adjusts the step size for each weight automatically and usually works well with default settings."
   },
   {
    "term": "Dropout",
    "meaning": "Randomly switching off some neurons during training so the network cannot depend on any single one, which reduces overfitting."
   },
   {
    "term": "Vanishing gradient",
    "meaning": "When the correction signal shrinks as it travels back through many layers, so the early layers almost stop learning."
   }
  ],
  "studySteps": [
   "If the chain rule or gradient descent feels rusty, spend 30–60 minutes revisiting [1.5 Linear Algebra & Calculus (intuition first)](#m-l1-linalg-calc) and [2.2 Regression & Gradient Descent](#m-l2-regression) before you start.",
   "Watch the Watch & read lessons on the perceptron, multilayer perceptrons, activation functions, the forward pass and loss functions; draw each network on paper as you go.",
   "Watch the backpropagation lessons twice: once to follow along, and once with pen and paper, doing every chain-rule step yourself.",
   "Open the Lab and change one setting at a time (for example the number of hidden neurons, the activation or the learning rate); write down when the network fits well, fails to fit, or becomes unstable.",
   "Watch the lessons on SGD, momentum, Adam, dropout, batch normalisation, weight decay and vanishing gradients, then do the Practice exercises in the browser (they use NumPy, so you write the maths yourself).",
   "Take the quiz (aim for 70%+), then do the Self-check tasks in Colab; the NumPy network from scratch is the most important one."
  ],
  "selfCheck": [
   "On paper, take a network with 2 inputs, 2 hidden neurons (ReLU) and 1 output (sigmoid). Choose small weights, do one forward pass for one example, compute the binary cross-entropy loss, then backpropagate to find the gradient of one first-layer weight.",
   "In Colab, code a two-layer network in NumPy only (no PyTorch), train it on scikit-learn's make_moons data, plot the loss curve, and show that it beats logistic regression on the same data.",
   "Train your network with learning rates 0.001, 0.1 and 10; plot the three loss curves on one chart and explain in two sentences what happened in each case.",
   "Make your network overfit on purpose (many hidden neurons, few examples), then add dropout or weight decay and show the gap between training and validation accuracy shrinking.",
   "Explain to a non-technical client, in five sentences and without maths, how a neural network 'learns from its mistakes'."
  ],
  "commonMistakes": [
   "Leaving out the activation function in hidden layers. Without it, every layer is a straight-line calculation, so even ten layers act like one simple linear model; use ReLU in hidden layers.",
   "Pairing the wrong output and loss. Use sigmoid with binary cross-entropy for yes/no answers, softmax with cross-entropy for several classes, and no activation with mean squared error for predicting a number.",
   "Feeding unscaled inputs. If one feature is in lakhs of rupees and another is between 0 and 1, training becomes slow or unstable; standardise your features first, as you did in l2-feature-eng."
  ],
  "indiaExample": "Google's flood forecasting work began in 2018 with a pilot in the Patna region of Bihar, in partnership with India's Central Water Commission, and its Flood Hub service now shows flood forecasts for river areas across India. Its current forecasting model is a neural network (a type called LSTM, which you will meet in l3-nlp) trained on past river and weather data, and it learns through the same forward pass, loss and backpropagation loop you build in this module, only at a much larger scale.",
  "tip": "Check your backpropagation code with a gradient check: nudge one weight by a tiny amount (say 0.0001), see how much the loss changes, divide by the nudge, and compare that with the gradient your code calculated. If the two numbers differ a lot, your backprop has a bug."
 },
 {
  "id": "l3-pytorch",
  "level": 3,
  "title": "PyTorch (and Keras) in Practice",
  "topics": [
   "tensors and autograd",
   "Dataset and DataLoader",
   "the training loop",
   "GPU training on Colab/Kaggle",
   "saving/loading models",
   "Keras/TensorFlow overview",
   "debugging training: learning-rate finder, overfitting a batch"
  ],
  "overview": "PyTorch is a free Python library, first built at Facebook (now Meta) and now run by the PyTorch Foundation, that does the heavy lifting of deep learning: it stores data as tensors (multi-dimensional arrays, like NumPy arrays that can run on a GPU) and calculates all the gradients automatically with a feature called autograd. If l3-nn-basics was cooking by grinding every masala by hand, PyTorch is a well-stocked kitchen: you still follow the same recipe (forward pass, loss, backward pass, update), but the tools are ready. You will learn the pieces almost every PyTorch project uses: a Dataset and a DataLoader to feed data in batches, an `nn.Module` to define the model, and a training loop you can reuse for years. You will also train on free GPUs in Colab and Kaggle, save and reload models, take a short tour of Keras (a simpler, higher-level library), and learn the debugging habits that save the most time.",
  "whyItMatters": "PyTorch is the library behind most deep learning research code and most models on Hugging Face, so it is what you will read and write in every later module. For an agency, one clean PyTorch training template becomes the starting point for every client project, whether it sorts product photos or customer messages.",
  "outcomes": [
   "You will be able to create tensors, move them to a GPU, and explain how autograd calculates gradients.",
   "You will be able to wrap your own data (a CSV file or a folder of images) in a Dataset and load it in shuffled batches with a DataLoader.",
   "You will be able to write a full training and validation loop from memory, with `model.train()`, `model.eval()` and `torch.no_grad()` in the right places.",
   "You will be able to train on a free GPU in Colab or Kaggle and keep your work safe when the session disconnects.",
   "You will be able to save and reload a model's weights, and resume training from a checkpoint.",
   "You will be able to read a short Keras model and map each line to the same idea in PyTorch.",
   "You will be able to debug a model that is not learning by overfitting one batch and running a learning-rate finder."
  ],
  "prerequisites": [
   "l3-nn-basics",
   "l1-python",
   "l1-tools"
  ],
  "hours": 16,
  "keyTerms": [
   {
    "term": "Tensor",
    "meaning": "A multi-dimensional array of numbers, like a NumPy array, that can live on a GPU and keep track of gradients."
   },
   {
    "term": "Autograd",
    "meaning": "PyTorch's automatic gradient engine: it records every operation you do and calculates all the gradients when you call `loss.backward()`."
   },
   {
    "term": "GPU",
    "meaning": "A graphics processor that does thousands of simple calculations at once, which makes training neural networks many times faster than on a normal CPU."
   },
   {
    "term": "Dataset",
    "meaning": "A PyTorch class that knows how many examples you have and how to fetch example number i."
   },
   {
    "term": "DataLoader",
    "meaning": "A helper that takes a Dataset and serves it in shuffled mini-batches (small groups of examples, such as 32 at a time)."
   },
   {
    "term": "Epoch",
    "meaning": "One full pass of the model through all the training data."
   },
   {
    "term": "nn.Module",
    "meaning": "The base class for every PyTorch model: you create the layers in `__init__` and write the forward pass in `forward`."
   },
   {
    "term": "state_dict",
    "meaning": "A dictionary holding all of a model's learned weights; this is what you normally save to a file."
   },
   {
    "term": "Checkpoint",
    "meaning": "A saved snapshot of the model, the optimiser and the epoch number, so you can resume training after a crash or a disconnect."
   },
   {
    "term": "Keras",
    "meaning": "A high-level deep learning library that builds models from ready-made layers in very few lines; Keras 3 can run on TensorFlow, JAX or PyTorch."
   }
  ],
  "studySteps": [
   "Watch the Watch & read lessons on tensors and autograd; type every example into a Colab notebook and print the `.shape` of every tensor you create.",
   "Watch the lessons on Dataset, DataLoader and the training loop, then rewrite your NumPy network from [3.1 Neural Networks from Scratch](#m-l3-nn-basics) in PyTorch and train it on the same data.",
   "Switch the Colab runtime to a GPU (Runtime → Change runtime type), move the model and every batch with `.to(device)`, and compare how long one epoch takes on CPU and on GPU.",
   "Watch the lessons on saving and loading, the Keras overview and debugging; practise the 'overfit one batch' check and a learning-rate finder on your own model.",
   "Do the Practice exercises in the browser (they practise batches, shapes and training-loop logic in NumPy, because PyTorch does not run inside a browser), then take the quiz (aim for 70%+).",
   "Finish the Self-check tasks in Colab and push your reusable training-template notebook to GitHub."
  ],
  "selfCheck": [
   "Create a tensor x = 2.0 with `requires_grad=True`, compute y = 3x² + 2x, call `y.backward()`, and check that the gradient PyTorch gives matches the derivative you work out by hand.",
   "Write a Dataset class for a CSV file of your choice (for example a used-car price dataset from Kaggle), load it with a DataLoader of batch size 32, and print the shape of one batch of inputs and labels.",
   "Train an MLP on Fashion-MNIST (it comes with torchvision) on a GPU, save the model with the best validation accuracy, restart the runtime, reload it and show that you get the same accuracy.",
   "Make your model reach almost zero loss on one batch of 16 examples. Then add one bug on purpose (for example, remove `optimizer.zero_grad()`) and describe how the loss curve changes.",
   "Build the same small classifier in Keras in about ten lines, and list three differences you notice compared with your PyTorch version."
  ],
  "commonMistakes": [
   "Forgetting `optimizer.zero_grad()` in each step. PyTorch adds new gradients on top of old ones by default, so training goes haywire; clear the gradients at the start of every training step.",
   "Evaluating while the model is still in training mode. Dropout and batch normalisation behave differently during training, so call `model.eval()` and use `torch.no_grad()` for validation, then call `model.train()` before training again.",
   "Getting 'expected all tensors to be on the same device' errors. Create one `device` variable at the top of the notebook and move the model and every batch to it."
  ],
  "indiaExample": "AI4Bharat, a research lab at IIT Madras, trained IndicTrans2, an open-source translation model for all 22 scheduled Indian languages, using fairseq, a toolkit built on PyTorch. The models are also published on Hugging Face, so you can load one in a Colab notebook and translate English to Hindi or Tamil with the skills from this module: tensors, a device, `model.eval()` and batches.",
  "tip": "Keep one clean training-template notebook (load data → build model → train loop → evaluate → save) and copy it for every new project. Most beginner bugs come from rewriting the training loop from scratch each time."
 },
 {
  "id": "l3-cv",
  "level": 3,
  "title": "Computer Vision",
  "topics": [
   "convolutions, pooling, CNN architecture",
   "classic architectures: LeNet, VGG, ResNet",
   "data augmentation",
   "transfer learning and fine-tuning",
   "object detection (YOLO)",
   "image segmentation (U-Net)",
   "OpenCV basics",
   "Vision Transformers (intro)"
  ],
  "lab": "convolution",
  "overview": "Computer vision (CV) means teaching computers to understand images and video. A CNN (convolutional neural network) examines a photo the way a quality checker inspects a saree for defects: sliding a small magnifying glass across the cloth patch by patch, first noticing edges and colours, then patterns, then whole shapes. That sliding glass is a convolution (a small grid of learned numbers, called a filter, moved across the image), and pooling shrinks the result so each deeper layer sees a bigger area. You will learn the classic designs (LeNet, VGG, ResNet), how data augmentation and transfer learning (starting from a model already trained on millions of images) give good results from a few hundred photos, and three core tasks: classification (what is in the image), object detection with YOLO (what is where), and segmentation with U-Net (which pixels belong to what). You will finish with OpenCV for everyday image handling and a short introduction to Vision Transformers.",
  "whyItMatters": "Image models power face check-in at airports (as in DigiYatra), quality checks on factory lines, crop and pest detection for farmers, and document reading for KYC at banks and fintechs. For an agency, fine-tuning a pretrained model on a client's own photos is one of the fastest ways to deliver a working AI product.",
  "outcomes": [
   "You will be able to explain what a convolution, filter, stride, padding and pooling do, and calculate the output size of a convolution layer.",
   "You will be able to build and train a small CNN in PyTorch that clearly beats an MLP on the same image dataset.",
   "You will be able to explain why ResNet's skip connections let very deep networks train.",
   "You will be able to fine-tune a pretrained model on a few hundred of your own photos, using data augmentation.",
   "You will be able to run a pretrained YOLO model on images and video, and explain bounding boxes, IoU and mAP (mean average precision, the standard detection score).",
   "You will be able to explain how U-Net segmentation works and when a client needs segmentation rather than detection.",
   "You will be able to read, resize, crop and draw on images with OpenCV, and explain how a Vision Transformer looks at an image differently from a CNN."
  ],
  "prerequisites": [
   "l3-pytorch",
   "l3-nn-basics",
   "l2-metrics-tuning"
  ],
  "hours": 24,
  "keyTerms": [
   {
    "term": "Convolution",
    "meaning": "Sliding a small grid of numbers (a filter) over an image and computing a weighted sum at each position, which highlights features such as edges."
   },
   {
    "term": "Filter (kernel)",
    "meaning": "The small grid of learned numbers, often 3×3, that a convolution slides across the image; each filter learns to spot one kind of pattern."
   },
   {
    "term": "Pooling",
    "meaning": "Shrinking a feature map, for example by keeping only the largest value in each 2×2 patch (max pooling), which makes the network faster and less sensitive to small shifts."
   },
   {
    "term": "CNN",
    "meaning": "Convolutional neural network: a network built mainly from convolution and pooling layers, the standard design for images for many years."
   },
   {
    "term": "ResNet",
    "meaning": "A family of deep CNNs, introduced in 2015, that use skip connections (shortcuts that add a block's input to its output) so networks with 50 or more layers can still train."
   },
   {
    "term": "Data augmentation",
    "meaning": "Creating extra training images by flipping, rotating, cropping or changing the brightness of the ones you have, so the model copes with real-world variety."
   },
   {
    "term": "Transfer learning",
    "meaning": "Starting from a model already trained on a large dataset such as ImageNet and re-training it, fully or partly, on your own smaller dataset."
   },
   {
    "term": "Object detection",
    "meaning": "Finding each object in an image and drawing a labelled box around it, such as 'helmet' or 'no helmet'."
   },
   {
    "term": "IoU (Intersection over Union)",
    "meaning": "How much a predicted box overlaps the true box, from 0 (no overlap) to 1 (a perfect match)."
   },
   {
    "term": "Segmentation",
    "meaning": "Labelling every pixel of an image with a class, such as road, vehicle or person, instead of only drawing boxes."
   }
  ],
  "studySteps": [
   "Watch the Watch & read lessons on convolutions, padding, stride and pooling, then open the Lab and try different filters on an image; note which ones pick out edges and which ones blur or sharpen.",
   "Watch the lessons on CNN architecture and on LeNet, VGG and ResNet, then build a small CNN in PyTorch on CIFAR-10 in Colab with a GPU.",
   "Watch the lessons on data augmentation and transfer learning, then fine-tune a pretrained ResNet from torchvision on a small dataset of your own (about 100–200 photos per class).",
   "Watch the lessons on YOLO, U-Net, OpenCV and Vision Transformers, and run a pretrained YOLO model on a photo or a short video of an Indian street.",
   "Do the Practice exercises in the browser (for example, computing a convolution with NumPy), then take the quiz (aim for 70%+).",
   "Complete the Self-check tasks and push your fine-tuning notebook to GitHub as a portfolio piece."
  ],
  "selfCheck": [
   "By hand, apply a 3×3 edge filter to a 5×5 grid of numbers with stride 1 and no padding; write down the 3×3 result and explain why the output is smaller than the input.",
   "Train a small CNN and an MLP on CIFAR-10 for the same number of epochs, report both test accuracies, and explain the difference in three sentences.",
   "Collect 100–200 photos per class for a two- or three-class problem a client might have (for example 'ripe' vs 'unripe' tomatoes, or 'damaged' vs 'intact' parcels), fine-tune a pretrained model with augmentation, and show the confusion matrix on held-back photos. Do not use photos of people without their consent: under India's DPDP Act a face is personal data.",
   "Run a pretrained YOLO model on five photos of a busy Indian road and note what it misses or mislabels; standard YOLO models are trained on the COCO dataset's 80 everyday classes, which do not include 'autorickshaw'. Write what labelled data you would collect to fix this.",
   "Use OpenCV to load an image, convert it to grayscale, resize it, draw a rectangle and some text on it, and save it. Then write one paragraph on how a Vision Transformer, which cuts an image into small patches and compares every patch with every other, differs from a CNN."
  ],
  "commonMistakes": [
   "Training a CNN from scratch on a few hundred photos. With small data, start from a pretrained model and fine-tune it; it trains faster and is usually far more accurate.",
   "Preparing images differently at prediction time. A pretrained model expects images resized and normalised exactly as in training, so reuse the same transforms (minus the random augmentation) when you predict.",
   "Building on a model without checking its licence. Ultralytics YOLO is released under the AGPL-3.0 licence, and Ultralytics asks you to buy an Enterprise licence to use it inside a closed commercial product; check the licence of every model and library before you build a paid client product on it."
  ],
  "indiaExample": "Wadhwani AI, an independent non-profit institute in India, built a pest-monitoring system for cotton farmers. Pests such as the pink bollworm are caught in traps; a farmer or field worker photographs the trap with a phone app, an object detection model finds and counts each pest, and the count helps decide whether spraying is needed. The team described the system in a 2020 KDD conference paper, 'Pest management in cotton farms: an AI-system case study from the global South', and released an open dataset of pest images with bounding boxes.",
  "tip": "Spend more effort on data than on the model: 200 clean, correctly labelled photos taken in the client's real conditions (their lighting, their phones, their backgrounds) usually beat 2,000 random images from the internet."
 },
 {
  "id": "l3-nlp",
  "level": 3,
  "title": "Natural Language Processing",
  "topics": [
   "text preprocessing, tokenisation",
   "bag of words, TF-IDF",
   "word embeddings: Word2Vec, GloVe",
   "RNN, LSTM, GRU",
   "sequence-to-sequence and attention",
   "NLP for Indian languages (IndicNLP, AI4Bharat)"
  ],
  "overview": "Natural Language Processing (NLP) means teaching computers to work with human language: reading reviews, sorting complaints, translating and answering questions. Computers only understand numbers, so the first job is turning text into numbers, a bit like a shopkeeper who first counts which words appear most often in customer notes (bag of words and TF-IDF), and later learns which words mean similar things, like 'cheap', 'sasta' and 'affordable' (word embeddings). You will clean and tokenise text (split it into pieces), build classic text classifiers, use Word2Vec and GloVe embeddings, and then learn RNNs, LSTMs and GRUs, networks that read a sentence word by word while keeping a running memory. You will finish with sequence-to-sequence models and attention, the idea that led to transformers, and with tools built for Indian languages by AI4Bharat and the Indic NLP Library.",
  "whyItMatters": "Support-ticket routing, review analysis, spam filters, resume screening and translation for Indian-language users are all NLP problems that agencies are asked to solve. India has 22 scheduled languages, and many people type Hindi and other languages in Roman letters (as in Hinglish), so knowing how to handle Indian-language text is a real business advantage.",
  "outcomes": [
   "You will be able to clean and tokenise English and Hindi text, and explain why each cleaning step helps or hurts.",
   "You will be able to build a TF-IDF plus logistic regression text classifier as a strong, cheap baseline.",
   "You will be able to explain word embeddings, find similar words with pretrained Word2Vec, GloVe or fastText vectors, and spot the biases they can carry.",
   "You will be able to explain how an RNN reads a sequence and why LSTMs and GRUs cope better with long sentences.",
   "You will be able to train a small LSTM text classifier in PyTorch and compare it honestly with your TF-IDF baseline.",
   "You will be able to explain sequence-to-sequence models and attention, using translation as the example.",
   "You will be able to use the Indic NLP Library and AI4Bharat resources to process text in an Indian language."
  ],
  "prerequisites": [
   "l3-pytorch",
   "l2-classification",
   "l2-metrics-tuning"
  ],
  "hours": 18,
  "keyTerms": [
   {
    "term": "Tokenisation",
    "meaning": "Splitting text into pieces called tokens, such as words or parts of words, that a model can count or look up."
   },
   {
    "term": "Stop words",
    "meaning": "Very common words such as 'the', 'is' or 'hai' that are sometimes removed because they carry little meaning on their own."
   },
   {
    "term": "Bag of words",
    "meaning": "Representing a document by counting how often each word appears in it, ignoring word order."
   },
   {
    "term": "TF-IDF",
    "meaning": "Term Frequency–Inverse Document Frequency: a word score that is high when a word is frequent in this document but rare across all the documents."
   },
   {
    "term": "Word embedding",
    "meaning": "A list of numbers (a vector) for each word, learned so that words used in similar contexts, like 'doctor' and 'nurse', get similar vectors."
   },
   {
    "term": "Word2Vec",
    "meaning": "A method published by Google researchers in 2013 that learns word embeddings by predicting a word from its neighbours, or its neighbours from the word."
   },
   {
    "term": "RNN (recurrent neural network)",
    "meaning": "A network that reads a sequence one step at a time and passes a hidden state (its running memory) on to the next step."
   },
   {
    "term": "LSTM (Long Short-Term Memory)",
    "meaning": "An RNN with gates (learned switches) that decide what to remember and what to forget, so it copes with longer sequences; a GRU is a simpler cousin."
   },
   {
    "term": "Sequence-to-sequence (seq2seq)",
    "meaning": "A model with an encoder that reads an input sequence and a decoder that writes an output sequence, as in translation."
   },
   {
    "term": "Attention",
    "meaning": "A method that lets the decoder look back at all the input words and focus on the most relevant ones at each step, instead of relying on one memory vector."
   }
  ],
  "studySteps": [
   "Watch the Watch & read lessons on text preprocessing, tokenisation, bag of words and TF-IDF, then build a TF-IDF plus logistic regression classifier on a review dataset in Colab.",
   "Watch the word embedding lessons, then load pretrained word vectors (for example with the gensim library) and try 'most similar words' and 'king − man + woman' analogies yourself.",
   "Watch the lessons on RNNs, LSTMs and GRUs; draw how the hidden state moves from word to word, then train a small LSTM classifier in PyTorch.",
   "Watch the lessons on sequence-to-sequence models and attention, and explain attention to a friend using an English-to-Hindi translation example.",
   "Install the Indic NLP Library in Colab and tokenise and normalise a paragraph in Hindi or your own language, then do the Practice exercises in the browser (for example, computing TF-IDF step by step).",
   "Take the quiz (aim for 70%+) and complete the Self-check tasks."
  ],
  "selfCheck": [
   "Take five short customer messages (mix English and Hinglish), tokenise them by hand, build the bag-of-words table on paper, and compute the TF-IDF score of one word.",
   "Build a TF-IDF plus logistic regression classifier for a labelled text dataset (for example product reviews marked positive or negative), report the F1 score, and list the 10 words that push predictions most strongly towards each class.",
   "Train an LSTM classifier on the same data and compare it with your TF-IDF baseline on score, training time and effort; write which one you would deliver to a client, and why.",
   "Using pretrained word vectors, find examples where a word's nearest neighbours show a gender or other bias, and write how that bias could harm a resume-screening tool.",
   "Use the Indic NLP Library to split a Hindi or Tamil paragraph into sentences and words, and note two ways Indian-language text differs from English (for example script, spelling variants, or the same words typed in Roman letters)."
  ],
  "commonMistakes": [
   "Jumping straight to deep learning. For short-text classification, TF-IDF with logistic regression is fast, cheap and often close to an LSTM, so always build it first as your baseline.",
   "Cleaning away the meaning. Removing stop words such as 'not' or 'nahi' can flip a review's meaning ('not good'), so check what your cleaning removes, especially for sentiment tasks.",
   "Assuming English tools work for Indian languages. Many English tokenisers and stop-word lists break on Devanagari or Tamil script and on Hinglish typed in Roman letters; use tools built for Indian languages, such as the Indic NLP Library, and test on real messages from your users."
  ],
  "indiaExample": "AI4Bharat at IIT Madras builds open tools for Indian languages, including IndicTrans2 (a translation model for all 22 scheduled languages) and IndicFT (fastText word embeddings for 11 Indian languages), while the Indic NLP Library handles tokenisation, normalisation and script conversion for Indian scripts. The Government of India's Bhashini mission runs ULCA, a platform for sharing and using Indian-language datasets and models, so that public services and apps can work in the user's own language.",
  "tip": "Before any modelling, read 100 real messages from your client's users. You will find the Hinglish, spelling variants, emojis and short forms ('pls', 'kb aayega') that decide which cleaning and tokenisation choices make sense."
 },
 {
  "id": "l3-transformers",
  "level": 3,
  "title": "Transformers & Hugging Face",
  "topics": [
   "self-attention and multi-head attention",
   "positional encoding",
   "encoder vs decoder (BERT vs GPT)",
   "Hugging Face transformers, datasets, pipelines",
   "fine-tuning BERT for classification",
   "tokenizers (BPE, WordPiece)"
  ],
  "lab": "tokenizer",
  "overview": "A transformer is the neural network design behind BERT, GPT, Gemini, Claude and most modern AI. Its key idea, self-attention, works like a meeting where every word in a sentence can look at every other word and decide whom to listen to: in 'The bank near the river flooded', the word 'bank' pays attention to 'river' and so understands it is not a money bank. Because all the words are processed at the same time, transformers train much faster on GPUs than RNNs do, and positional encoding (extra numbers that tell the model each word's position) keeps track of word order. You will learn the difference between encoder models such as BERT (good at understanding and classifying text) and decoder models such as GPT (good at generating text), how tokenizers such as BPE and WordPiece split text into sub-word pieces, and how to load, run and fine-tune these models with the Hugging Face libraries in a few lines of code.",
  "whyItMatters": "Most text products an agency builds today, from ticket classification and resume parsing to chatbots, start from a pretrained transformer on Hugging Face rather than a model trained from scratch. For a fixed task such as sorting messages, a small fine-tuned BERT-style model can be cheaper and faster per request than a large paid LLM API, and it keeps the client's data under your control.",
  "outcomes": [
   "You will be able to explain self-attention using queries, keys and values, and why multi-head attention runs several attention 'views' at once.",
   "You will be able to explain why transformers need positional encoding and how they differ from RNNs.",
   "You will be able to choose between an encoder (BERT-style) and a decoder (GPT-style) model for a given business task.",
   "You will be able to use Hugging Face pipelines to run sentiment analysis, named entity recognition (finding names, places and organisations), translation or summarisation in a few lines.",
   "You will be able to fine-tune a BERT-style model for text classification with the Hugging Face Trainer and evaluate it on a held-out test set.",
   "You will be able to explain how BPE and WordPiece tokenizers work, and why Indian-language text often needs more tokens than English with tokenizers trained mostly on English.",
   "You will be able to read a model card and check a model's training data, languages, licence and limits before using it for a client."
  ],
  "prerequisites": [
   "l3-nlp",
   "l3-pytorch"
  ],
  "hours": 20,
  "keyTerms": [
   {
    "term": "Transformer",
    "meaning": "A neural network design, introduced in the 2017 paper 'Attention Is All You Need', built mainly from attention layers instead of convolutions or recurrence."
   },
   {
    "term": "Self-attention",
    "meaning": "A layer where each token compares itself with every other token and builds a new representation as a weighted mix of them."
   },
   {
    "term": "Query, key and value",
    "meaning": "Three vectors made from each token: the query asks 'what am I looking for?', the key says 'what do I contain?', and the value is the information passed on."
   },
   {
    "term": "Multi-head attention",
    "meaning": "Several self-attention 'heads' running side by side, so the model can track different relationships, such as grammar and meaning, at the same time."
   },
   {
    "term": "Positional encoding",
    "meaning": "Numbers added to each token's embedding to tell the model where that token sits in the sentence."
   },
   {
    "term": "Encoder (BERT)",
    "meaning": "A transformer that reads the whole text in both directions to understand it; BERT, released by Google in 2018, is the best-known example."
   },
   {
    "term": "Decoder (GPT)",
    "meaning": "A transformer that predicts the next token using only the tokens before it, which makes it good at generating text."
   },
   {
    "term": "Fine-tuning",
    "meaning": "Training a pretrained model a little more on your own labelled data so that it does your specific task well."
   },
   {
    "term": "BPE (byte-pair encoding)",
    "meaning": "A tokenizer method that starts from single characters and repeatedly merges the most frequent pairs into sub-word tokens; GPT models use a version of it."
   },
   {
    "term": "WordPiece",
    "meaning": "A similar sub-word tokenizer used by BERT, which marks a piece that continues a word with '##', as in 'play' + '##ing'."
   }
  ],
  "studySteps": [
   "Watch the Watch & read lessons on self-attention, multi-head attention and positional encoding, and work through one tiny attention calculation with three words on paper.",
   "Open the Lab and tokenise an English sentence, a Hindi sentence and a Hinglish sentence; compare how many tokens each becomes and where the splits fall.",
   "Watch the lessons on encoders vs decoders (BERT vs GPT) and on BPE and WordPiece tokenizers.",
   "Work through the Hugging Face transformers, datasets and pipelines lessons in Colab, and run at least three pipelines (for example sentiment, named entity recognition and translation) on your own sentences.",
   "Fine-tune a small BERT-style model (for example DistilBERT for English, or MuRIL for Indian languages) for text classification on a GPU, and compare it with your TF-IDF baseline from [3.4 Natural Language Processing](#m-l3-nlp).",
   "Do the Practice exercises in the browser, take the quiz (aim for 70%+), and complete the Self-check tasks."
  ],
  "selfCheck": [
   "For the sentence 'Ravi paid the bill', make up small two-number query, key and value vectors for each word, compute the attention weights for 'paid' with a softmax, and explain in plain words what the weights mean.",
   "Tokenise the same sentence in English, Hindi (Devanagari) and Hinglish with the BERT and GPT-2 tokenizers from Hugging Face; count the tokens, and explain why the counts differ and what that means for cost and speed.",
   "Fine-tune a BERT-style model on a labelled text dataset (for example customer complaints by category), report accuracy and F1 on a held-out test set, and show three examples it gets wrong with your guess at why.",
   "For five business tasks (lead-message classification, drafting replies, extracting invoice fields, review sentiment, writing product descriptions), say whether you would start with an encoder or a decoder model, and why.",
   "Pick one model on the Hugging Face Hub and summarise its model card in five lines: training data, languages, licence, known limits, and whether you could use it in a paid client product."
  ],
  "commonMistakes": [
   "Using a different tokenizer from the one the model was trained with. Always load the tokenizer and the model from the same name with `AutoTokenizer` and the matching `AutoModel` class.",
   "Ignoring the maximum input length. BERT-style models usually accept at most 512 tokens and cut off longer text, so check your text lengths and split long documents into chunks.",
   "Fine-tuning with too high a learning rate or too many epochs. Pretrained models are easy to damage, so start with a small learning rate (2e-5 to 5e-5 is the usual range for BERT) and 2–4 epochs, and watch the validation score."
  ],
  "indiaExample": "Google released MuRIL (Multilingual Representations for Indian Languages), a BERT model pretrained on 17 Indian languages and on transliterated text (Indian languages written in Roman letters), which matters because many Indians type Hindi or Tamil in English script. AI4Bharat at IIT Madras released IndicBERT, another model for Indian languages. Both are free on the Hugging Face Hub, so you can fine-tune them with exactly the steps in this module, for example to sort customer messages in Hindi or Marathi into categories.",
  "tip": "For classification jobs, try a small fine-tuned encoder model before reaching for a large LLM API: it can run on a cheap CPU server, gives the same answer for the same input every time, and the client's data never has to leave your control."
 },
 {
  "id": "l3-mlops",
  "level": 3,
  "title": "Deployment & MLOps",
  "topics": [
   "serving models with FastAPI/Flask",
   "Streamlit and Gradio demos",
   "Docker",
   "experiment tracking with MLflow",
   "data versioning with DVC",
   "CI/CD with GitHub Actions",
   "cloud deployment on free tiers (Hugging Face Spaces, Render)",
   "monitoring and data drift"
  ],
  "overview": "A model in a notebook helps nobody; deployment means putting it where real users and apps can use it, and MLOps (machine learning operations) means keeping it working reliably after launch. Think of a cloud kitchen: the recipe (your model) is only the start; you also need an order window (an API, so other apps can send requests), a standard sealed box (a Docker container, so it runs the same everywhere), a recipe register (MLflow, to record which experiment produced which model), dated ingredient batches (DVC, to version your data), an automatic quality check before every change goes live (CI/CD with GitHub Actions), and regular tasting to notice when customers' tastes change (monitoring for data drift). You will serve a model with FastAPI or Flask, build quick demos with Streamlit and Gradio, package it with Docker, and deploy it on free tiers such as Hugging Face Spaces and Render. By the end you will have a live, shareable AI app, which is the most convincing thing you can show a client.",
  "whyItMatters": "Clients pay for working products, not notebooks: a lead-scoring API plugged into their CRM, the backend of a WhatsApp bot, or a demo link they can open on their phone. Monitoring matters because customer behaviour in India shifts around festivals like Diwali and big online sale seasons, and a model trained on ordinary months can quietly get worse at exactly those times.",
  "outcomes": [
   "You will be able to wrap a trained model in a FastAPI endpoint that accepts JSON, checks the input, and returns predictions.",
   "You will be able to build a shareable demo of a model with Gradio or Streamlit in under 50 lines of code.",
   "You will be able to write a Dockerfile, build an image, and run your model API inside a container.",
   "You will be able to log experiments (settings, metrics and model files) with MLflow and pick the best run.",
   "You will be able to version a dataset with DVC alongside your code in Git.",
   "You will be able to set up a GitHub Actions workflow that runs your tests on every push.",
   "You will be able to deploy a demo on Hugging Face Spaces or Render, and set up basic monitoring for errors, response time and data drift."
  ],
  "prerequisites": [
   "l3-pytorch",
   "l2-feature-eng",
   "l1-tools"
  ],
  "hours": 24,
  "keyTerms": [
   {
    "term": "Deployment",
    "meaning": "Putting a trained model on a server or device so that real users or other software can send it inputs and get predictions back."
   },
   {
    "term": "API",
    "meaning": "Application Programming Interface: a fixed way for one program to ask another for something, for example by sending JSON (a simple text format for data) to a web address."
   },
   {
    "term": "FastAPI",
    "meaning": "A modern Python library for building APIs quickly, with automatic input checking and a built-in documentation page at /docs."
   },
   {
    "term": "Gradio and Streamlit",
    "meaning": "Python libraries that turn a function or script into a simple web app with text boxes, buttons and file uploads, ideal for demos."
   },
   {
    "term": "Docker container",
    "meaning": "A packaged, isolated box holding your code, libraries and settings, so the app runs the same on any machine."
   },
   {
    "term": "MLflow",
    "meaning": "An open-source tool that records each training run's settings, metrics and model files, so you can compare runs and reproduce the best one."
   },
   {
    "term": "DVC (Data Version Control)",
    "meaning": "A tool that tracks versions of large data and model files next to your Git code, without putting the big files inside Git itself."
   },
   {
    "term": "CI/CD",
    "meaning": "Continuous integration and continuous delivery: automatically testing, and optionally deploying, your code every time you push a change."
   },
   {
    "term": "Data drift",
    "meaning": "When the data a live model receives starts to differ from the data it was trained on, so its predictions can quietly get worse."
   },
   {
    "term": "Latency",
    "meaning": "The time a model takes to answer one request, usually measured in milliseconds."
   }
  ],
  "studySteps": [
   "Watch the Watch & read lessons on serving models with FastAPI (or Flask); save a model from an earlier module, build a `/predict` endpoint, and test it from the automatic `/docs` page.",
   "Build a Gradio or Streamlit demo for the same model and deploy it on Hugging Face Spaces; the free CPU Basic hardware is enough for small models.",
   "Watch the Docker lessons, write a Dockerfile for your FastAPI app, run it on your laptop (with Docker Desktop) or in GitHub Codespaces, then deploy the container on Render's free tier.",
   "Watch the MLflow and DVC lessons; log at least five training runs of one model to MLflow and put its dataset under DVC.",
   "Watch the CI/CD and monitoring lessons; add a GitHub Actions workflow that runs a few tests on every push, and log each request's inputs and response time so you can check for drift later.",
   "Do the Practice exercises in the browser (for example input checks and a simple drift check in Python), take the quiz (aim for 70%+), and complete the Self-check tasks."
  ],
  "selfCheck": [
   "Deploy one of your Level 3 models (image or text) as a FastAPI service inside Docker, and write a README with one `curl` command that anyone can copy to get a prediction.",
   "Put a Gradio demo of the same model on Hugging Face Spaces and share the link with three people; note the inputs that broke it, and fix at least one.",
   "Log a small hyperparameter search (trying several settings) to MLflow, take a screenshot of the run comparison, and explain in three sentences why you chose the winning run.",
   "Write a GitHub Actions workflow that runs `pytest` on every push, add a test that fails on purpose, and confirm that the workflow catches it.",
   "Simulate drift: compare your training data with a 'new month' of data in which one feature's average has shifted, using a simple check (compare means and histograms, or run a Kolmogorov–Smirnov test from scipy), and write the alert you would set up for a client."
  ],
  "commonMistakes": [
   "Loading the model inside the prediction function. That reloads it on every request and makes the API slow; load it once when the app starts.",
   "Skipping input checks. Real users send empty fields, wrong types and huge files, so use FastAPI's Pydantic models to validate inputs and return clear error messages instead of crashing.",
   "Promising a client always-on service on a free tier. A Hugging Face Spaces app on free CPU Basic hardware goes to sleep after 48 hours without visitors, and Render's free web services spin down after about 15 minutes idle, so the next request is slow; for paid work, quote a small always-on server and include its monthly cost, plus 18% GST on your invoice to Indian clients."
  ],
  "indiaExample": "AI4Bharat at IIT Madras publishes live demos of its Indian-language models on Hugging Face Spaces, built with Gradio, such as Indic Parler-TTS (text-to-speech in Indian languages), which is exactly the Gradio-plus-Spaces route in this module. At national scale, the Government of India's Bhashini mission offers Indian-language translation and speech models as APIs that other apps call, the same 'model behind an API' pattern you build here with FastAPI.",
  "tip": "Deploy something rough in the first week of this module and then improve it. A live link with a plain Gradio page teaches you more about real-world problems (slow starts, odd inputs, missing libraries) than a perfect notebook, and it is what clients actually click on."
 },
 {
  "id": "l4-llm-internals",
  "level": 4,
  "title": "How LLMs Work (build a GPT)",
  "topics": [
   "language modelling and next-token prediction",
   "tokenisation (BPE) from scratch",
   "building GPT from scratch in PyTorch",
   "pretraining, scaling laws",
   "sampling: temperature, top-k, top-p",
   "KV cache, context length, mixture of experts (intuition)",
   "reasoning models (intuition)"
  ],
  "lab": "sampling"
 },
 {
  "id": "l4-llm-apps",
  "level": 4,
  "title": "Building LLM Apps: Prompting & RAG",
  "topics": [
   "prompt engineering",
   "LLM APIs and open models (Ollama, Groq, Gemini free tier)",
   "embeddings and vector databases (FAISS, Chroma)",
   "retrieval-augmented generation (RAG)",
   "LangChain / LlamaIndex",
   "structured outputs and function calling",
   "evaluating RAG (RAGAS)"
  ]
 },
 {
  "id": "l4-finetuning",
  "level": 4,
  "title": "Fine-tuning & Aligning LLMs",
  "topics": [
   "when to fine-tune vs RAG vs prompt",
   "full fine-tuning vs PEFT",
   "LoRA and QLoRA",
   "instruction tuning datasets",
   "RLHF, DPO (intuition)",
   "evaluating LLMs and benchmarks",
   "quantisation and running models locally"
  ]
 },
 {
  "id": "l4-agents",
  "level": 4,
  "title": "AI Agents",
  "topics": [
   "what an agent is: LLM + tools + loop",
   "tool/function calling",
   "LangGraph / agent frameworks",
   "Model Context Protocol (MCP)",
   "memory and planning",
   "multi-agent systems",
   "guardrails, safety and agent evaluation"
  ]
 },
 {
  "id": "l4-gen-vision",
  "level": 4,
  "title": "Generative Vision: GANs, VAEs & Diffusion",
  "topics": [
   "autoencoders and VAEs",
   "GANs",
   "diffusion models",
   "Stable Diffusion, text-to-image",
   "CLIP and multimodal models",
   "vision-language models"
  ]
 },
 {
  "id": "l4-rl",
  "level": 4,
  "title": "Reinforcement Learning",
  "topics": [
   "agents, environments, rewards, MDPs",
   "multi-armed bandits",
   "value functions, Q-learning",
   "deep Q-networks",
   "policy gradients, PPO",
   "RL for LLMs (intuition)"
  ]
 },
 {
  "id": "l4-research-career",
  "level": 4,
  "title": "Research Skills, System Design & Career",
  "topics": [
   "how to read ML papers",
   "reproducing a paper",
   "ML system design",
   "full university courses (Stanford/MIT/IIT) for depth",
   "ML interview preparation",
   "building a portfolio and getting AI jobs/freelance work in India"
  ]
 }
];
