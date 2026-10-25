/* AI Marg data file. This is JavaScript holding JSON: keep the quotes and commas valid.
   See README.md > "Editing the course" before changing it. */
window.AIM = window.AIM || {};
window.AIM.quizzes = {
 "l1-ai-basics": [
  {
   "id": "l1-ai-basics-q01",
   "q": "Which statement best describes how AI, Machine Learning (ML) and Deep Learning (DL) are related?",
   "code": "",
   "options": [
    "AI is a part of Machine Learning, and Machine Learning is a part of Deep Learning",
    "They are three separate fields that do not overlap with each other",
    "Deep Learning is a part of Machine Learning, and Machine Learning is a part of AI",
    "Machine Learning is a part of Deep Learning, and both are separate from AI"
   ],
   "answer": 2,
   "explain": "Picture three circles, one inside the other: AI (any technique that makes machines act intelligently) is the biggest, ML (systems that learn patterns from data) sits inside it, and DL (ML using neural networks with many layers) sits inside ML. Generative AI tools such as chatbots are mostly built with deep learning. The reversed order is a common mix-up, but AI is the broad umbrella, not the smallest circle.",
   "difficulty": "easy"
  },
  {
   "id": "l1-ai-basics-q02",
   "q": "Which of these is an example of Generative AI?",
   "code": "",
   "options": [
    "A chatbot that writes a brand-new poem in Hindi when you ask for one",
    "A model that predicts whether a loan applicant will repay or not",
    "A spam filter that marks each SMS as 'spam' or 'not spam'",
    "A model that sorts shoppers into groups based on their buying habits"
   ],
   "answer": 0,
   "explain": "Generative AI creates new content (text, images, audio, code) that did not exist before. The loan, spam and grouping models only pick a label or a group for existing data, so they are predictive or analytical, not generative. The spam filter is tempting because it works with text, but it only classifies messages; it never writes anything new.",
   "difficulty": "easy"
  },
  {
   "id": "l1-ai-basics-q03",
   "q": "How is machine learning different from traditional programming?",
   "code": "",
   "options": [
    "In ML a programmer still writes every rule by hand using if/else statements",
    "ML is just a faster way of running the same hand-written rules",
    "ML needs no data at all, only a very powerful computer and a good algorithm",
    "In ML the computer learns the rules itself from examples that have answers"
   ],
   "answer": 3,
   "explain": "In traditional programming, humans write the rules and the computer applies them to data. In ML, we provide data together with the correct answers (called labels), and the algorithm discovers the rules (patterns) on its own. Writing every rule by hand is exactly the old approach that ML tries to replace, and without data an ML model has nothing to learn from.",
   "difficulty": "easy"
  },
  {
   "id": "l1-ai-basics-q04",
   "q": "Which pairing of a task with its type of machine learning is correct?",
   "code": "",
   "options": [
    "Finding natural groups of shoppers when no group names exist in the data → Supervised learning",
    "Predicting 'fraud' or 'not fraud' from past UPI transactions that are already labelled → Supervised learning",
    "Teaching a game-playing bot using rewards for winning and penalties for losing → Unsupervised learning",
    "Predicting tomorrow's rainfall in mm from labelled past weather records → Reinforcement learning"
   ],
   "answer": 1,
   "explain": "Supervised learning learns from examples that already carry the correct answer (a label), like transactions marked fraud or not fraud. Grouping shoppers without labels is unsupervised learning (finding hidden structure), learning from rewards and penalties is reinforcement learning, and predicting rainfall from labelled history is supervised regression (predicting a number). The rainfall option is tempting because weather changes over time, but having labelled past data makes it supervised.",
   "difficulty": "medium"
  },
  {
   "id": "l1-ai-basics-q05",
   "q": "A team in Lucknow is building a voice assistant for farmers who speak Bhojpuri and Awadhi. Compared with building the same assistant in English, what is usually the biggest challenge?",
   "code": "",
   "options": [
    "Much less recorded and labelled speech data exists for these languages",
    "Computers cannot store or display Indian scripts such as Devanagari",
    "Machine learning only works for languages written in the English alphabet",
    "Indian languages have no fixed grammar, so a model has no patterns to learn"
   ],
   "answer": 0,
   "explain": "ML models learn from data, and low-resource languages (languages with little digital text or speech available) have far fewer recordings and transcripts to learn from. That is why Indian efforts such as AI4Bharat and the government's Bhashini mission collect and publish open datasets for Indian languages. Storing Devanagari is not a problem at all, because Unicode (the worldwide text-encoding standard) fully supports Indian scripts.",
   "difficulty": "medium"
  },
  {
   "id": "l1-ai-basics-q06",
   "q": "A company trained a hiring model on 10 years of its own past hiring decisions, a period in which very few women were hired. The model now gives lower scores to women's CVs. What is the root cause?",
   "code": "",
   "options": [
    "The programmers must have written an explicit rule telling the model to reject women",
    "The model did not have enough computing power to judge CVs fairly",
    "Women's CVs use layouts and formats that AI systems are unable to read",
    "The historical data carried bias, and the model learned that unfair pattern from it"
   ],
   "answer": 3,
   "explain": "A model copies the patterns in its training data, including unfair ones; this is called data bias (when data does not fairly represent reality or carries past discrimination). Nobody needs to write an explicit rule for the model to discriminate, which is why the 'programmers wrote a rule' option is wrong. More computing power would only learn the same biased pattern faster; the real fixes are auditing the data, removing proxy features (columns that indirectly reveal gender) and testing fairness across groups.",
   "difficulty": "medium"
  },
  {
   "id": "l1-ai-basics-q07",
   "q": "Which job role mainly focuses on taking a trained model, deploying it as a reliable service, and monitoring it once real users are using it?",
   "code": "",
   "options": [
    "Data Analyst / Business Intelligence Analyst",
    "Research Scientist at an AI research lab",
    "Machine Learning Engineer / MLOps Engineer",
    "Data Annotator / Data Labelling Specialist"
   ],
   "answer": 2,
   "explain": "ML and MLOps engineers turn models into working products: they build APIs, automate pipelines, and watch for problems such as data drift (when real-world data slowly changes away from the training data). Data Analysts mainly use SQL, spreadsheets and charts to answer business questions, and Research Scientists invent new methods. Data Analyst is tempting because analysts work with data every day, but they rarely deploy or maintain models.",
   "difficulty": "medium"
  },
  {
   "id": "l1-ai-basics-q08",
   "q": "A Pune e-commerce startup wants to use customers' phone numbers and purchase history to train a recommendation model. Which practice best follows the core ideas of India's Digital Personal Data Protection Act, 2023 (DPDP Act)?",
   "code": "",
   "options": [
    "Use any data the app can collect, as long as all of it is stored on servers located inside India",
    "Tell customers what data is used and why, take consent, use only what is needed, allow withdrawal",
    "Treat the data as company property forever once a customer has made even one purchase on the app",
    "Ignore the Act, because it applies only to government departments and not to private startups"
   ],
   "answer": 1,
   "explain": "The DPDP Act is built on consent (clear permission), purpose limitation (using data only for the stated purpose) and data minimisation (collecting only what is needed), and it gives individuals, called Data Principals, rights such as withdrawing consent and asking for their data to be erased. Companies that decide how data is used are called Data Fiduciaries, and private companies are fully covered. Storing data in India is the tempting answer, but location alone does not make any use of personal data lawful.",
   "difficulty": "hard"
  },
  {
   "id": "l1-ai-basics-q09",
   "q": "A crop-advisory model trained only on soil and weather data from Punjab gives poor advice when it is used for farms in Kerala. What is the most likely reason?",
   "code": "",
   "options": [
    "The model was not trained for enough hours on the Punjab data, so it is still half-learned",
    "The algorithm is too simple; switching to deep learning would fix it without any Kerala data",
    "The model saw too much Punjab data, which overloaded it and made it confused",
    "Kerala's soil, rain and crops differ from the training data, so the learned patterns don't fit"
   ],
   "answer": 3,
   "explain": "A model only knows the patterns present in its training data; when it is used on data that looks different, called distribution shift, its performance drops. Kerala's heavy monsoon, laterite soils and crops like rubber and coconut are very different from Punjab's wheat and rice belt. A more powerful algorithm such as deep learning is tempting, but it cannot invent knowledge it never saw, so the real fix is to collect and train on data from Kerala.",
   "difficulty": "hard"
  },
  {
   "id": "l1-ai-basics-q10",
   "q": "A UPI fraud-detection model scores 99.5% accuracy on test data. Only 0.5% of all transactions are actually fraud. Why should you be careful about this number?",
   "code": "",
   "options": [
    "Always predicting 'not fraud' would also score 99.5% while catching zero frauds",
    "99.5% is a low accuracy for a fraud model, so the model should be rejected immediately",
    "Any accuracy above 99% always proves that the model is overfitting the data",
    "Accuracy cannot be calculated properly when there are only two classes"
   ],
   "answer": 0,
   "explain": "When one class is very rare (an imbalanced dataset), accuracy can look excellent even for a useless model: always predicting 'not fraud' is right 99.5% of the time here. You must also check how many real frauds are caught (recall) and how many alerts are genuine (precision). High accuracy is not automatically overfitting (memorising training data and failing on new data); the real problem is that accuracy hides how the model does on the rare class.",
   "difficulty": "hard"
  }
 ],
 "l1-python": [
  {
   "id": "l1-python-q01",
   "q": "What does this code print?",
   "code": "print(7 // 2, 7 % 2, 7 / 2)",
   "options": [
    "3.5 1 3",
    "3 1 3.5",
    "3 1 3",
    "4 1 3.5"
   ],
   "answer": 1,
   "explain": "// is floor division (divide, then drop the decimal part), so 7 // 2 is 3; % gives the remainder, which is 1; and / is true division, which always returns a float (a decimal number), so 7 / 2 is 3.5. '3 1 3' is tempting if you expect / to drop decimals as it does in some other languages, but in Python 3 the / operator always gives a decimal result.",
   "difficulty": "easy"
  },
  {
   "id": "l1-python-q02",
   "q": "What does this code print?",
   "code": "city = \"Bengaluru\"\nprint(city[0:4], len(city))",
   "options": [
    "Benga 9",
    "Beng 8",
    "engal 9",
    "Beng 9"
   ],
   "answer": 3,
   "explain": "The slice city[0:4] starts at index 0 and stops just before index 4, giving the four characters 'Beng'. len() counts every character, and 'Bengaluru' has 9. 'Benga' is tempting if you think the end index is included, but Python slices always exclude the end position.",
   "difficulty": "easy"
  },
  {
   "id": "l1-python-q03",
   "q": "Why is it good practice to create a separate virtual environment (venv) for each Python project?",
   "code": "",
   "options": [
    "Each project gets its own isolated packages, so one project can't break another",
    "It makes your Python code run noticeably faster than a normal installation",
    "It automatically backs up your project's code and data to the cloud",
    "Python cannot run print() or other basic commands unless a venv is active"
   ],
   "answer": 0,
   "explain": "A virtual environment is a private folder with its own Python packages; once it is activated, pip install (Python's package installer) only affects that project. So Project A can use one version of pandas while Project B uses another without clashing. It does not speed up code or back anything up; for backups and history you use Git and GitHub.",
   "difficulty": "easy"
  },
  {
   "id": "l1-python-q04",
   "q": "What does this code print?",
   "code": "nums = [1, 2, 3, 4, 5, 6]\nresult = [n * n for n in nums if n % 2 == 0]\nprint(result)",
   "options": [
    "[1, 9, 25]",
    "[2, 4, 6]",
    "[4, 16, 36]",
    "[1, 4, 9, 16, 25, 36]"
   ],
   "answer": 2,
   "explain": "A list comprehension (a one-line way to build a list) reads as 'n * n for each n in nums, but only if n % 2 == 0'. The condition keeps only the even numbers 2, 4 and 6, and then each one is squared, giving 4, 16 and 36. '[2, 4, 6]' is tempting if you notice the filter but forget that n * n is applied to every value that is kept.",
   "difficulty": "medium"
  },
  {
   "id": "l1-python-q05",
   "q": "A shop records the city of each order. What does this code print?",
   "code": "orders = [\"Pune\", \"Delhi\", \"Pune\", \"Chennai\", \"Pune\", \"Delhi\", \"Pune\"]\nunique_cities = set(orders)\ncounts = {}\nfor city in orders:\n    counts[city] = counts.get(city, 0) + 1\nprint(len(unique_cities), counts[\"Pune\"])",
   "options": [
    "7 4",
    "3 3",
    "3 4",
    "4 3"
   ],
   "answer": 2,
   "explain": "A set keeps only unique values, so set(orders) holds Pune, Delhi and Chennai, which is 3 items. In the loop, counts.get(city, 0) returns the city's current count, or 0 if the city is not in the dictionary yet, and then 1 is added, so Pune ends up counted 4 times. '7 4' is tempting if you forget that a set removes duplicates; 7 is the length of the original list.",
   "difficulty": "medium"
  },
  {
   "id": "l1-python-q06",
   "q": "What does this code print?",
   "code": "values = [\"10\", \"20\", \"abc\", \"30\"]\ntotal = 0\nfor v in values:\n    try:\n        total += int(v)\n    except ValueError:\n        continue\nprint(total)",
   "options": [
    "60",
    "The program crashes with a ValueError",
    "30",
    "102030"
   ],
   "answer": 0,
   "explain": "int('abc') raises a ValueError (an error for a value that has the right type but unusable content), but the except block catches it and continue skips to the next item. So only 10 + 20 + 30 are added and 60 is printed. Without try/except the program would crash, which is why that option is tempting; '102030' would only appear if the strings were joined together instead of converted with int().",
   "difficulty": "medium"
  },
  {
   "id": "l1-python-q07",
   "q": "What does this code print?",
   "code": "class Wallet:\n    def __init__(self, owner, balance=0):\n        self.owner = owner\n        self.balance = balance\n\n    def add(self, amount):\n        self.balance += amount\n        return self.balance\n\nw = Wallet(\"Ravi\")\nw.add(500)\nprint(w.add(250))",
   "options": [
    "250",
    "500",
    "None",
    "750"
   ],
   "answer": 3,
   "explain": "__init__ runs once when the object is created and sets balance to the default value 0. Each call to add() updates self.balance, an attribute (a variable stored inside the object), so it becomes 500 and then 750, and the second call returns 750. '250' is tempting if you think the balance resets on every method call, but attributes on self keep their values for as long as the object exists.",
   "difficulty": "medium"
  },
  {
   "id": "l1-python-q08",
   "q": "Spot the bug: what does this code print?",
   "code": "def add_item(item, basket=[]):\n    basket.append(item)\n    return basket\n\nadd_item(\"rice\")\nprint(add_item(\"dal\"))",
   "options": [
    "['dal']",
    "['rice', 'dal']",
    "['rice']",
    "TypeError: a list cannot be a default value"
   ],
   "answer": 1,
   "explain": "A default value is created only once, when the function is defined, not fresh on each call. So both calls share the same list, and 'dal' is appended after 'rice'. Most beginners expect ['dal'], which is why this is a classic bug; the fix is to write basket=None and create a new empty list inside the function when basket is None.",
   "difficulty": "hard"
  },
  {
   "id": "l1-python-q09",
   "q": "What does this code print?",
   "code": "def safe_divide(a, b):\n    try:\n        return a / b\n    except ZeroDivisionError:\n        return \"cannot divide\"\n    finally:\n        print(\"done\", end=\" \")\n\nprint(safe_divide(10, 0))",
   "options": [
    "done cannot divide",
    "cannot divide done",
    "cannot divide",
    "ZeroDivisionError is raised and the program stops"
   ],
   "answer": 0,
   "explain": "Dividing by 0 raises ZeroDivisionError, which the except block catches, getting ready to return 'cannot divide'. But a finally block always runs before the function actually hands back its value, so 'done ' is printed first, and only then does the outer print() show the returned text. 'cannot divide done' is tempting because the return line comes first in the code, but finally runs before the value reaches the caller.",
   "difficulty": "hard"
  },
  {
   "id": "l1-python-q10",
   "q": "What does this code print?",
   "code": "with open(\"marks.txt\", \"w\") as f:\n    f.write(\"Asha,82\\n\")\n\nwith open(\"marks.txt\", \"w\") as f:\n    f.write(\"Ravi,75\\n\")\n\nwith open(\"marks.txt\") as f:\n    print(len(f.readlines()))",
   "options": [
    "2",
    "0",
    "An error, because the file is already open",
    "1"
   ],
   "answer": 3,
   "explain": "Mode 'w' (write) creates the file, or completely empties it if it already exists, before writing. So the second block erases Asha's line and only Ravi's line remains; to keep both you would open it the second time with mode 'a' (append). '2' is tempting because two lines were written in total, and there is no 'already open' error because each with block closes the file automatically.",
   "difficulty": "hard"
  }
 ],
 "l1-tools": [
  {
   "id": "l1-tools-q01",
   "q": "You are training a model in a Google Colab notebook and it is very slow on the CPU. How do you switch to a free GPU?",
   "code": "",
   "options": [
    "Run !pip install gpu in a cell, which downloads and installs a GPU",
    "Add the line import gpu at the top of the notebook and re-run all cells",
    "Download the notebook and open it in your phone's browser, which uses the phone's GPU",
    "Open Runtime → Change runtime type and choose a GPU accelerator"
   ],
   "answer": 3,
   "explain": "A GPU (Graphics Processing Unit, a chip that does many calculations in parallel) is hardware attached to the runtime (the cloud computer that runs your notebook), so you choose it in the runtime settings; Kaggle Notebooks have a similar Accelerator option in their settings panel. pip installs software packages and cannot add hardware, which is why '!pip install gpu' does not work. Free GPU time on both platforms has usage limits, so save your work regularly.",
   "difficulty": "easy"
  },
  {
   "id": "l1-tools-q02",
   "q": "What does the git commit command do?",
   "code": "",
   "options": [
    "Uploads your latest code from your laptop to GitHub",
    "Saves a snapshot of your staged changes in your local history",
    "Creates a new branch so you can work separately",
    "Downloads the latest changes from GitHub into your folder"
   ],
   "answer": 1,
   "explain": "A commit is a save-point with a message, recorded in your local repository (the project folder that Git tracks). It includes only the changes you staged with git add. Uploading to GitHub is a separate step, git push, which is why beginners often confuse the two.",
   "difficulty": "easy"
  },
  {
   "id": "l1-tools-q03",
   "q": "On GitHub, what is the main purpose of the README.md file in a project repository?",
   "code": "",
   "options": [
    "To safely store the project's passwords and API keys in one place",
    "To make the project's code run faster when it is hosted on GitHub",
    "To explain what the project does, how to run it, and its results",
    "To list the files and folders that Git should ignore"
   ],
   "answer": 2,
   "explain": "The README is the front page of your repository, written in Markdown (a simple text-formatting language), and it is the first thing recruiters and teammates read. A good README states the problem, the data, how to run the code and the results, ideally with a chart or metric. Files to ignore belong in .gitignore, not the README, and secrets should never be stored in a repository at all.",
   "difficulty": "easy"
  },
  {
   "id": "l1-tools-q04",
   "q": "Yesterday in Google Colab you ran !pip install for a library and uploaded sales.csv through the Files panel. Today you reopen the same notebook, run a cell, and get errors that the library and the file are missing. What is the most likely reason?",
   "code": "",
   "options": [
    "Colab started a fresh runtime, which wipes installed libraries and uploaded files",
    "Colab deleted your notebook's code overnight, so you must rewrite it from scratch",
    "The library's free licence expired after one day and must now be bought",
    "Colab notebooks can only be run once, so you must make a new notebook each day"
   ],
   "answer": 0,
   "explain": "A Colab runtime is a temporary virtual machine (a rented computer in the cloud): after a disconnect or timeout, everything installed or uploaded into /content is wiped, although the notebook's code itself stays saved in your Drive. Put install commands in the first cell and mount Google Drive (or load data from a link) so the notebook can rebuild everything in one run. Thinking the code itself was deleted is tempting, but only the runtime is reset.",
   "difficulty": "medium"
  },
  {
   "id": "l1-tools-q05",
   "q": "Your project works well on the main branch. You want to try a risky new feature without breaking the working code. What is the best Git practice?",
   "code": "",
   "options": [
    "Copy the whole folder as project_final_v2 and make changes in the copy",
    "Create a new branch, commit there, and merge into main once it works",
    "Commit directly to main and delete the commits if something breaks",
    "Delete the repository and start again so that main stays clean"
   ],
   "answer": 1,
   "explain": "A branch is an independent line of work, so your experiment stays separate from main until you merge it (combine the branch's commits into main). If the idea fails, you simply delete the branch and main is untouched. Copying folders is tempting because it feels safe, but it creates confusing duplicates with no history that are hard to combine later.",
   "difficulty": "medium"
  },
  {
   "id": "l1-tools-q06",
   "q": "An AI coding assistant writes a function to clean your dataset, and it runs without any error. What should you do before using it in your project?",
   "code": "",
   "options": [
    "Use it straight away, because code that runs without errors must be correct",
    "Paste your company's database password into the chat so the AI can test it on the real data",
    "Read and understand each line, and test it on small examples with known answers",
    "Ask the same AI 'Is this correct?' and accept the code if it answers yes"
   ],
   "answer": 2,
   "explain": "AI assistants can produce code that runs but does the wrong thing, for example silently dropping rows or using a wrong formula, and you remain responsible for it. Testing on tiny inputs with known answers catches logic errors that 'no error message' never will. Asking the same AI to check itself is tempting, but it can confidently repeat its own mistake; and never share passwords, API keys or private data with any chatbot.",
   "difficulty": "medium"
  },
  {
   "id": "l1-tools-q07",
   "q": "You installed pandas inside your project's virtual environment, but when you run your script in VS Code you get ModuleNotFoundError: No module named 'pandas'. What is the most likely cause?",
   "code": "",
   "options": [
    "VS Code is using a different Python interpreter, not your venv's one",
    "pandas does not work in VS Code; it only works inside Jupyter notebooks",
    "You must restart your computer after every pip install before it works",
    "The import must be written as import Pandas, with a capital P"
   ],
   "answer": 0,
   "explain": "Each Python interpreter (the program that runs your code) has its own installed packages, so if VS Code points to the system Python instead of your venv, pandas will not be found. Use 'Python: Select Interpreter' from the Command Palette and choose the venv, or activate the venv in the terminal before running. pandas works fine in VS Code, and module names are case-sensitive, so the correct line is import pandas in lowercase.",
   "difficulty": "medium"
  },
  {
   "id": "l1-tools-q08",
   "q": "In a Jupyter notebook you run Cell 1 once, and then run Cell 2 two times. What does the second run of Cell 2 print?",
   "code": "# Cell 1\ntotal = 100\n\n# Cell 2\ntotal = total + 50\nprint(total)",
   "options": [
    "150",
    "100",
    "NameError: name 'total' is not defined",
    "200"
   ],
   "answer": 3,
   "explain": "Jupyter keeps variables in memory (the kernel's state) between cell runs. The first run of Cell 2 changes total from 100 to 150, and the second run starts from 150, so it prints 200. Most people expect 150 because that is what the code seems to do when read top to bottom, which is why you should use 'Restart & Run All' to check that a notebook gives the same results in a clean run.",
   "difficulty": "hard"
  },
  {
   "id": "l1-tools-q09",
   "q": "You run these commands in order in your project folder. After the last command, what will you see inside notes.txt?",
   "code": "git init -b main\ngit add notes.txt\ngit commit -m \"first version\"\ngit switch -c experiment\n# ... you edit notes.txt and save it ...\ngit commit -am \"try new idea\"\ngit switch main",
   "options": [
    "The edited version, because switching branches never changes the files in your folder",
    "The first version, because the edit was committed only on the experiment branch",
    "An empty file, because Git clears tracked files when you switch branches",
    "Both versions combined, because Git merges branches automatically when you switch"
   ],
   "answer": 1,
   "explain": "git switch -c creates a new branch and moves to it, and git commit -am commits the edits to already-tracked files on that branch only. When you switch back to main, Git updates the files in your folder to match main's latest commit, which still has the first version. Your edit is safe on experiment, and nothing is merged until you run git merge experiment while on main.",
   "difficulty": "hard"
  },
  {
   "id": "l1-tools-q10",
   "q": "You accidentally committed a file containing your API key and pushed it to a public GitHub repository. What is the right first step?",
   "code": "",
   "options": [
    "Delete the file in a new commit, because that removes the key from GitHub completely",
    "Make the repository private and keep using the same key, since no one can see it now",
    "Revoke the key and make a new one now, then remove the file and add it to .gitignore",
    "Rename the file to something boring so that nobody notices it"
   ],
   "answer": 2,
   "explain": "Once pushed publicly, a secret must be treated as stolen, because automated bots scan GitHub for keys within minutes. Deleting the file in a new commit is tempting, but the key is still visible in the commit history (every older snapshot of the project). So first revoke (cancel) the key and create a new one, then remove the file, add it to .gitignore, and keep secrets in environment variables or a .env file that is never committed.",
   "difficulty": "hard"
  }
 ],
 "l1-stats": [
  {
   "id": "l1-stats-q01",
   "q": "Monthly salaries (in ₹ thousand) at a small Kochi office are 25, 28, 30, 32 and 500 (the owner's). Which value best represents a typical employee's salary?",
   "code": "",
   "options": [
    "The median, ₹30 thousand",
    "The mean, ₹123 thousand",
    "The range, ₹475 thousand",
    "The maximum, ₹500 thousand"
   ],
   "answer": 0,
   "explain": "The median is the middle value after sorting (25, 28, 30, 32, 500), so it is 30, and one extreme value cannot pull it. The mean is (25 + 28 + 30 + 32 + 500) / 5 = 123, which is more than four of the five people earn, because the mean is sensitive to outliers (unusually extreme values). That is why reports on incomes and house prices usually quote the median.",
   "difficulty": "easy"
  },
  {
   "id": "l1-stats-q02",
   "q": "In Mumbai, umbrella sales and dengue cases both rise every July and August. What is the best conclusion?",
   "code": "",
   "options": [
    "Buying umbrellas causes dengue, so the city should limit umbrella sales",
    "Dengue cases cause umbrella sales to rise, so the link runs the other way",
    "The monsoon likely drives both; correlation alone doesn't prove one causes the other",
    "Two numbers rising together like this means the data must contain an error"
   ],
   "answer": 2,
   "explain": "Two things moving together is correlation; one directly making the other happen is causation. Here the monsoon is a confounder (a hidden variable that affects both): rain makes people buy umbrellas and also creates stagnant water where mosquitoes breed. Claiming that one causes the other is the classic mistake; proving causation needs an experiment or careful control of confounders.",
   "difficulty": "easy"
  },
  {
   "id": "l1-stats-q03",
   "q": "You toss a fair coin 10 times and count the number of heads. Which probability distribution describes this count?",
   "code": "",
   "options": [
    "Uniform distribution",
    "Binomial distribution",
    "Normal distribution",
    "Poisson distribution"
   ],
   "answer": 1,
   "explain": "A binomial distribution counts the number of successes in a fixed number of independent yes/no trials that each have the same probability, which is exactly 'heads in 10 tosses'. It is not uniform, because getting 5 heads is far more likely than getting 0 or 10. The normal (bell-shaped) distribution is tempting because the binomial looks bell-like when there are many trials, but this count is a whole number from 0 to 10 produced by repeated yes/no trials.",
   "difficulty": "easy"
  },
  {
   "id": "l1-stats-q04",
   "q": "In a class of 60 students, 25 like cricket, 15 like football and 10 like both. A student is picked at random, and you are told they like football. What is the probability that they also like cricket?",
   "code": "",
   "options": [
    "1/6",
    "2/5",
    "5/12",
    "2/3"
   ],
   "answer": 3,
   "explain": "Conditional probability P(cricket | football) means 'the probability of cricket, given football': P(both) / P(football) = 10/15 = 2/3, because once we know the student likes football we only look at the 15 football fans. 1/6 is 10/60, the chance of liking both when you know nothing, and 2/5 is 10/25, which wrongly divides by the cricket fans. The word 'given' always shrinks the group you divide by.",
   "difficulty": "medium"
  },
  {
   "id": "l1-stats-q05",
   "q": "A food-delivery app runs an A/B test on a new checkout button. The test gives a p-value of 0.03, and the team uses a significance level of 0.05. What is the correct interpretation?",
   "code": "",
   "options": [
    "There is a 3% chance the new button is better, so the old button should be kept",
    "There is a 97% chance that the new button is truly better than the old one it replaced",
    "Such a result would be rare (about 3%) if the button had no effect, so 'no effect' is rejected",
    "The new button increases the number of orders by about 3% compared with the old one"
   ],
   "answer": 2,
   "explain": "A p-value is the probability of seeing results at least this extreme if the null hypothesis (the 'no difference' assumption) were true. Since 0.03 is below 0.05, the result is called statistically significant and the null is rejected. The '97% chance it is better' reading is the most common mistake: a p-value is not the probability that a hypothesis is true, and it says nothing about how big the improvement is.",
   "difficulty": "medium"
  },
  {
   "id": "l1-stats-q06",
   "q": "What does this code print?",
   "code": "import numpy as np\na = np.array([10, 10, 10, 10])\nb = np.array([5, 15, 5, 15])\nprint(a.mean(), b.mean(), a.std(), b.std())",
   "options": [
    "10.0 10.0 0.0 10.0",
    "10.0 10.0 0.0 5.0",
    "10.0 10.0 0.0 25.0",
    "10.0 10.0 5.0 5.0"
   ],
   "answer": 1,
   "explain": "Both arrays have mean 10, but the standard deviation measures spread (how far values typically sit from the mean). Every value in a equals the mean, so its standard deviation is 0, and every value in b is exactly 5 away from 10, so its standard deviation is 5. 25.0 is the variance (the average squared distance, 5 × 5); the standard deviation is the square root of the variance.",
   "difficulty": "medium"
  },
  {
   "id": "l1-stats-q07",
   "q": "Heights of adult men in a city are roughly normally distributed with mean 170 cm and standard deviation 7 cm. About what percentage of men are between 156 cm and 184 cm tall?",
   "code": "",
   "options": [
    "About 95%",
    "About 68%",
    "About 99.7%",
    "About 50%"
   ],
   "answer": 0,
   "explain": "156 and 184 are each 14 cm, or 2 standard deviations, away from the mean of 170. The 68–95–99.7 rule says that for a normal distribution about 68% of values lie within 1 SD of the mean, about 95% within 2 SD, and about 99.7% within 3 SD. 68% is tempting, but that would be the narrower range from 163 to 177 cm (1 SD on each side).",
   "difficulty": "medium"
  },
  {
   "id": "l1-stats-q08",
   "q": "A disease affects 1% of people. A test correctly detects 90% of people who have it, but it also wrongly flags 5% of healthy people. If a randomly chosen person tests positive, what is the approximate probability that they actually have the disease?",
   "code": "",
   "options": [
    "About 90%",
    "About 95%",
    "About 50%",
    "About 15%"
   ],
   "answer": 3,
   "explain": "Imagine 10,000 people: 100 are sick and 90 of them test positive, while 9,900 are healthy and 5% of them, 495 people, also test positive. So only 90 of the 585 positives are truly sick, about 15%; this is Bayes' theorem (updating a probability using new evidence). 90% is tempting, but that is P(positive | sick), not P(sick | positive); when a condition is rare, false alarms from the large healthy group outnumber the true cases.",
   "difficulty": "hard"
  },
  {
   "id": "l1-stats-q09",
   "q": "Daily spending at a kirana store has mean ₹400 and standard deviation ₹120, and its distribution is skewed (not bell-shaped). You repeatedly take random samples of 36 customers and calculate each sample's mean. According to the Central Limit Theorem, what is the standard deviation of these sample means?",
   "code": "",
   "options": [
    "₹120",
    "₹20",
    "₹3.33",
    "₹66.67"
   ],
   "answer": 1,
   "explain": "The Central Limit Theorem (CLT) says that the means of reasonably large samples are approximately normally distributed, even when the original data is skewed, with a standard deviation of σ/√n, called the standard error. Here that is 120 / √36 = 120 / 6 = ₹20. ₹3.33 comes from dividing by 36 instead of √36, and ₹120 is the spread of individual customers, not of sample averages.",
   "difficulty": "hard"
  },
  {
   "id": "l1-stats-q10",
   "q": "A survey of 400 randomly chosen Delhi households finds a mean monthly electricity bill of ₹2,000 with a standard deviation of ₹600. What is the approximate 95% confidence interval for the average bill of all Delhi households?",
   "code": "",
   "options": [
    "₹824 to ₹3,176",
    "₹1,970 to ₹2,030",
    "₹1,400 to ₹2,600",
    "₹1,941 to ₹2,059"
   ],
   "answer": 3,
   "explain": "First find the standard error (SE, the spread of the sample mean): 600 / √400 = 600 / 20 = ₹30. A 95% confidence interval (a range that is likely to contain the true average) is mean ± 1.96 × SE = 2,000 ± 58.8, which gives about ₹1,941 to ₹2,059. ₹824 to ₹3,176 wrongly uses the SD of individual bills instead of the SE; that range describes where most single households fall, not where the average lies.",
   "difficulty": "hard"
  }
 ],
 "l1-linalg-calc": [
  {
   "id": "l1-linalg-calc-q01",
   "q": "What does this code print?",
   "code": "import numpy as np\na = np.array([1, 2, 3])\nb = np.array([4, 5, 6])\nprint(np.dot(a, b))",
   "options": [
    "[ 4 10 18]",
    "32",
    "21",
    "[5 7 9]"
   ],
   "answer": 1,
   "explain": "The dot product multiplies matching elements and then adds the results: 1×4 + 2×5 + 3×6 = 4 + 10 + 18 = 32. '[ 4 10 18]' is element-wise multiplication (a * b) without the final adding step. Dot products are everywhere in ML; for example, a linear model's prediction is the dot product of its weights and the input features.",
   "difficulty": "easy"
  },
  {
   "id": "l1-linalg-calc-q02",
   "q": "What is the length (L2 norm) of the vector [3, 4]?",
   "code": "",
   "options": [
    "5",
    "7",
    "25",
    "12"
   ],
   "answer": 0,
   "explain": "The L2 norm (the straight-line length of a vector) is the square root of the sum of squares: √(3² + 4²) = √(9 + 16) = √25 = 5, just like Pythagoras' theorem for a right triangle. 7 is the L1 norm (the sum of absolute values), and 25 forgets the final square root.",
   "difficulty": "easy"
  },
  {
   "id": "l1-linalg-calc-q03",
   "q": "What does the derivative of a function at a point tell you?",
   "code": "",
   "options": [
    "The total area under the function's curve up to that point",
    "The highest value that the function can ever reach anywhere",
    "How fast the output changes as the input changes, i.e. the slope there",
    "The average of all the function's output values near that point"
   ],
   "answer": 2,
   "explain": "The derivative is the instantaneous rate of change, which is the slope of the tangent line (the line that just touches the curve) at that point. In ML it tells us how much the loss (the model's error) changes if we nudge a weight slightly, which is exactly what gradient descent needs. The area under a curve is an integral, a different idea from calculus.",
   "difficulty": "easy"
  },
  {
   "id": "l1-linalg-calc-q04",
   "q": "What does this code print?",
   "code": "import numpy as np\nA = np.ones((3, 2))\nB = np.ones((2, 4))\nprint((A @ B).shape)",
   "options": [
    "(2, 2)",
    "(4, 3)",
    "An error, because A and B have different shapes",
    "(3, 4)"
   ],
   "answer": 3,
   "explain": "Matrix multiplication needs the inner dimensions to match: (3 × 2) @ (2 × 4) works because both inner numbers are 2. The result takes the outer dimensions, so it is 3 × 4. Two matrices do not need the same shape to be multiplied, only matching inner dimensions, which is why the error option is wrong.",
   "difficulty": "medium"
  },
  {
   "id": "l1-linalg-calc-q05",
   "q": "For f(x, y) = x²·y + 3y, what is the partial derivative ∂f/∂x at the point (x, y) = (2, 5)?",
   "code": "",
   "options": [
    "20",
    "7",
    "35",
    "4"
   ],
   "answer": 0,
   "explain": "A partial derivative measures change in one variable while treating all others as constants. Treating y as a constant, ∂f/∂x = 2xy, and the 3y term disappears because it contains no x; at (2, 5) that is 2 × 2 × 5 = 20. 7 is ∂f/∂y = x² + 3 at that point, and 35 is the value of f itself, not its slope.",
   "difficulty": "medium"
  },
  {
   "id": "l1-linalg-calc-q06",
   "q": "In gradient descent, why do we update the weights in the direction opposite to the gradient?",
   "code": "",
   "options": [
    "The gradient always points straight at the minimum, so we reverse it to avoid overshooting",
    "Moving against the gradient increases the loss, which forces the model to learn more",
    "The gradient points towards the steepest rise in loss, so the opposite way lowers it fastest",
    "Gradients are always negative numbers, so subtracting them is the only option"
   ],
   "answer": 2,
   "explain": "The gradient (the vector of all partial derivatives of the loss) points uphill, in the direction where the loss grows fastest. Gradient descent takes a small step downhill: new weight = old weight − learning rate × gradient. The 'points straight at the minimum' option is tempting, but the gradient only describes the local slope where you stand, which is why we take many small steps instead of one big jump.",
   "difficulty": "medium"
  },
  {
   "id": "l1-linalg-calc-q07",
   "q": "What does this code print, and what does the result mean?",
   "code": "import numpy as np\nM = np.array([[2, 1],\n              [4, 2]])\nprint(round(np.linalg.det(M), 2))",
   "options": [
    "0.0 — M leaves every vector exactly unchanged, like doing nothing",
    "0.0 — M squashes the 2-D plane onto a line, so M has no inverse",
    "8.0 — M makes every area 8 times bigger than it was before",
    "4.0 — M doubles the length of every vector it is applied to"
   ],
   "answer": 1,
   "explain": "For a 2×2 matrix [[a, b], [c, d]], the determinant is ad − bc = 2×2 − 1×4 = 0. The determinant tells how much a transformation scales area; 0 means everything is flattened onto a line (the second row is just 2 × the first), so information is lost and the transformation cannot be inverted (undone). A matrix that leaves every vector unchanged is the identity matrix, whose determinant is 1, not 0.",
   "difficulty": "medium"
  },
  {
   "id": "l1-linalg-calc-q08",
   "q": "Using the chain rule, what is the derivative of y = (3x + 1)² at x = 1?",
   "code": "",
   "options": [
    "8",
    "16",
    "6",
    "24"
   ],
   "answer": 3,
   "explain": "The chain rule says: derivative of the outer function × derivative of the inner function. Here dy/dx = 2(3x + 1) × 3 = 6(3x + 1), and at x = 1 that is 6 × 4 = 24. 8 is the common mistake of forgetting to multiply by the inner derivative, 3; backpropagation in neural networks is simply the chain rule applied layer after layer.",
   "difficulty": "hard"
  },
  {
   "id": "l1-linalg-calc-q09",
   "q": "This code runs two steps of gradient descent on the loss (w − 3)². What does it print?",
   "code": "w = 5.0\nlr = 0.1\nfor step in range(2):\n    grad = 2 * (w - 3)   # derivative of (w - 3)**2\n    w = w - lr * grad\nprint(round(w, 2))",
   "options": [
    "4.28",
    "4.6",
    "5.72",
    "3.0"
   ],
   "answer": 0,
   "explain": "Step 1: grad = 2 × (5 − 3) = 4, so w = 5 − 0.1 × 4 = 4.6. Step 2: grad = 2 × (4.6 − 3) = 3.2, so w = 4.6 − 0.32 = 4.28, moving closer to the minimum at w = 3. 4.6 is the result after only one step, and 3.0 is the target that gradient descent approaches gradually but does not reach in two small steps.",
   "difficulty": "hard"
  },
  {
   "id": "l1-linalg-calc-q10",
   "q": "Look at the output of this code. Which statement is correct?",
   "code": "import numpy as np\nA = np.array([[2, 0],\n              [0, 3]])\nv = np.array([1, 0])\nu = np.array([1, 1])\nprint(A @ v, A @ u)",
   "options": [
    "u is an eigenvector of A, because both of its entries got bigger",
    "Both v and u are eigenvectors of A, because A only scales numbers",
    "v is an eigenvector of A with eigenvalue 2, but u is not an eigenvector",
    "Neither is an eigenvector, because A changed the numbers in both vectors"
   ],
   "answer": 2,
   "explain": "An eigenvector is a vector whose direction is not changed by the matrix, only stretched or shrunk, and the stretch factor is its eigenvalue. The output shows A @ v = [2 0] = 2 × v, so v keeps its direction with eigenvalue 2. A @ u = [2 3] is not a multiple of [1 1], so u's direction changed; 'both entries got bigger' is not enough, because both must be scaled by the same factor.",
   "difficulty": "hard"
  }
 ],
 "l1-numpy-pandas": [
  {
   "id": "l1-numpy-pandas-q01",
   "q": "What does this code print?",
   "code": "import numpy as np\nprices = np.array([100, 200, 300])\nprint(prices * 2)",
   "options": [
    "[100 200 300 100 200 300]",
    "An error, because an array cannot be multiplied by a number",
    "1200",
    "[200 400 600]"
   ],
   "answer": 3,
   "explain": "NumPy applies the operation to every element at once, which is called vectorisation (working on whole arrays without writing a loop); the single number 2 is broadcast (stretched) to match the array. '[100 200 300 100 200 300]' is tempting because that is what happens with a plain Python list: [100, 200, 300] * 2 repeats the list instead of doubling the numbers.",
   "difficulty": "easy"
  },
  {
   "id": "l1-numpy-pandas-q02",
   "q": "What is the difference between a pandas Series and a pandas DataFrame?",
   "code": "",
   "options": [
    "A Series can only hold text, while a DataFrame can only hold numbers",
    "A Series is used for CSV files, while a DataFrame is used only for Excel files",
    "A Series is one labelled column; a DataFrame is a table of columns sharing row labels",
    "They are exactly the same object, just with two different names"
   ],
   "answer": 2,
   "explain": "A Series is 1-D: a list of values plus an index (the row labels). A DataFrame is 2-D: a table where each column is a Series and all columns share one index, so selecting one column with df['price'] gives you a Series. Both can hold numbers, text, dates and more, and both work the same whether the data came from CSV, Excel or JSON.",
   "difficulty": "easy"
  },
  {
   "id": "l1-numpy-pandas-q03",
   "q": "What does this code print?",
   "code": "import numpy as np\na = np.arange(12).reshape(3, 4)\nprint(a.shape, a[1, 2])",
   "options": [
    "(3, 4) 6",
    "(4, 3) 6",
    "(3, 4) 9",
    "(3, 4) 7"
   ],
   "answer": 0,
   "explain": "np.arange(12) makes the numbers 0 to 11, and reshape(3, 4) arranges them into 3 rows and 4 columns: row 0 is 0–3, row 1 is 4–7 and row 2 is 8–11. a[1, 2] means row index 1, column index 2, which is 6, since counting starts at 0. 9 is what you get by swapping the order (row 2, column 1); NumPy always uses [row, column].",
   "difficulty": "easy"
  },
  {
   "id": "l1-numpy-pandas-q04",
   "q": "What does this code print?",
   "code": "import pandas as pd\ndf = pd.DataFrame({\n    \"city\":  [\"Pune\", \"Pune\", \"Delhi\", \"Delhi\", \"Pune\"],\n    \"month\": [\"Jan\", \"Feb\", \"Jan\", \"Feb\", \"Jan\"],\n    \"sales\": [100, 150, 200, 250, 50],\n})\np = df.pivot_table(index=\"city\", columns=\"month\",\n                   values=\"sales\", aggfunc=\"sum\")\nprint(p.loc[\"Pune\", \"Jan\"])",
   "options": [
    "100",
    "150",
    "75",
    "300"
   ],
   "answer": 1,
   "explain": "pivot_table reshapes data into a grid, here with cities as rows and months as columns, and aggfunc='sum' adds up all the rows that land in the same cell. Pune in January has two rows, 100 and 50, so that cell is 150. 75 is tempting because pivot_table's default aggfunc is 'mean', which would average them, but this code asks for 'sum' explicitly.",
   "difficulty": "medium"
  },
  {
   "id": "l1-numpy-pandas-q05",
   "q": "What does this code print?",
   "code": "import pandas as pd\ndf = pd.DataFrame({\"marks\": [80, None, 70, None, 90]})\nprint(df[\"marks\"].isna().sum(), df[\"marks\"].mean())",
   "options": [
    "2 48.0",
    "3 80.0",
    "2 nan",
    "2 80.0"
   ],
   "answer": 3,
   "explain": "isna() marks missing values (NaN, meaning 'Not a Number') as True, and summing the True values counts them, giving 2. By default, pandas mean() skips NaN, so it averages only 80, 70 and 90 to get 80.0. 48.0 is what you would get if missing marks were treated as 0 (240 / 5), which is a very different and usually wrong assumption.",
   "difficulty": "medium"
  },
  {
   "id": "l1-numpy-pandas-q06",
   "q": "What does this code print?",
   "code": "import pandas as pd\ndf = pd.DataFrame({\n    \"order_id\": [101, 102, 102, 103, 103, 103],\n    \"item\":     [\"tea\", \"dosa\", \"dosa\", \"idli\", \"idli\", \"vada\"],\n})\nprint(len(df.drop_duplicates()), df[\"order_id\"].nunique())",
   "options": [
    "3 3",
    "4 3",
    "6 3",
    "4 4"
   ],
   "answer": 1,
   "explain": "drop_duplicates() removes rows where every column matches an earlier row, so the repeated (102, dosa) and (103, idli) rows are dropped, leaving 4 rows. nunique() counts the distinct values in one column: 101, 102 and 103 make 3. '3 3' is tempting if you think duplicates are judged by order_id alone; for that you would write drop_duplicates(subset='order_id').",
   "difficulty": "medium"
  },
  {
   "id": "l1-numpy-pandas-q07",
   "q": "What does this code print?",
   "code": "import pandas as pd\norders = pd.DataFrame({\"cust_id\": [1, 2, 2, 4],\n                       \"amount\":  [250, 400, 150, 900]})\ncustomers = pd.DataFrame({\"cust_id\": [1, 2, 3],\n                          \"name\":    [\"Anil\", \"Bina\", \"Chetan\"]})\nmerged = orders.merge(customers, on=\"cust_id\", how=\"left\")\nprint(len(merged), merged[\"name\"].isna().sum())",
   "options": [
    "3 0",
    "5 1",
    "4 1",
    "4 0"
   ],
   "answer": 2,
   "explain": "A left join keeps every row of the left table (orders) and adds matching columns from the right table (customers). All 4 orders stay, and cust_id 4 has no matching customer, so its name is NaN, giving 1 missing value; Chetan (cust_id 3) has no orders, so he does not appear at all. '3 0' is what an inner join (keeping only rows that match on both sides) would give.",
   "difficulty": "medium"
  },
  {
   "id": "l1-numpy-pandas-q08",
   "q": "A learner wants the rows where the city is Pune AND the amount is above 400. What happens when this code runs?",
   "code": "import pandas as pd\ndf = pd.DataFrame({\"city\": [\"Pune\", \"Delhi\", \"Pune\"],\n                   \"amount\": [500, 1200, 300]})\nbig_pune = df[(df[\"city\"] == \"Pune\") and (df[\"amount\"] > 400)]\nprint(big_pune)",
   "options": [
    "It raises a ValueError: the truth value of a Series is ambiguous",
    "It prints one row: Pune, 500 (the only big Pune order)",
    "It prints both Pune rows, because and checks only the city",
    "It prints an empty DataFrame, because no row matches both conditions"
   ],
   "answer": 0,
   "explain": "Python's and expects a single True or False, but each comparison here produces a whole Series (a column) of True/False values, so pandas raises a ValueError. For element-wise (row-by-row) conditions you must use & for AND and | for OR, with brackets around each condition: df[(df['city'] == 'Pune') & (df['amount'] > 400)]. The fixed version would print the single row Pune, 500, which is why that option is tempting.",
   "difficulty": "hard"
  },
  {
   "id": "l1-numpy-pandas-q09",
   "q": "What does this code print?",
   "code": "import pandas as pd\ndf = pd.DataFrame({\n    \"date\":  [\"2026-01-15\", \"2026-02-03\", \"2026-02-20\", \"2026-03-05\"],\n    \"sales\": [100, 200, 300, 400],\n})\ndf[\"date\"] = pd.to_datetime(df[\"date\"])\nmonthly = df.groupby(df[\"date\"].dt.month)[\"sales\"].sum()\nprint(monthly.loc[2])",
   "options": [
    "200",
    "400",
    "500",
    "1000"
   ],
   "answer": 2,
   "explain": "pd.to_datetime converts the text into real dates, and .dt.month extracts the month number (1 for January, 2 for February, and so on). Grouping by month and summing adds the two February sales, 200 + 300 = 500. 400 is what monthly.iloc[2] would return (the third row by position, which is March), but .loc looks up by label, here month number 2.",
   "difficulty": "hard"
  },
  {
   "id": "l1-numpy-pandas-q10",
   "q": "What does this code print?",
   "code": "import numpy as np\na = np.array([[1], [2], [3]])   # shape (3, 1)\nb = np.array([10, 20])          # shape (2,)\nc = a + b\nprint(c.shape, c[2, 1])",
   "options": [
    "(3, 2) 23",
    "An error, because the shapes (3, 1) and (2,) do not match",
    "(3, 1) 23",
    "(2, 3) 22"
   ],
   "answer": 0,
   "explain": "Broadcasting compares shapes from the right: (3, 1) and (2,) are treated as (3, 1) and (1, 2), and every dimension of size 1 is stretched, so the result has shape (3, 2). Row 2 of a holds 3 and column 1 of b holds 20, so c[2, 1] = 23. The error option is tempting because the shapes look different, but broadcasting only fails when two sizes differ and neither of them is 1.",
   "difficulty": "hard"
  }
 ],
 "l1-eda-viz-sql": [
  {
   "id": "l1-eda-viz-sql-q01",
   "q": "You want to see how the ages of 10,000 customers are spread out, for example which age range is the most common. Which chart is the best choice?",
   "code": "",
   "options": [
    "A scatter plot",
    "A pie chart",
    "A histogram",
    "A correlation heatmap"
   ],
   "answer": 2,
   "explain": "A histogram groups one numeric column into bins (ranges such as 20–25 and 25–30) and shows how many values fall into each, which is univariate analysis (studying one variable at a time). A scatter plot needs two numeric variables and is used for bivariate analysis (the relationship between two variables). A pie chart of hundreds of different ages would be unreadable.",
   "difficulty": "easy"
  },
  {
   "id": "l1-eda-viz-sql-q02",
   "q": "You receive a new CSV file of loan applications from a Lucknow bank. What should you do first in exploratory data analysis (EDA)?",
   "code": "",
   "options": [
    "Train a deep learning model straight away to see what accuracy you get",
    "Check rows, columns, data types, missing values and a few sample rows",
    "Delete every row that has at least one missing value, to keep it clean",
    "Build the final dashboard for the bank manager to review"
   ],
   "answer": 1,
   "explain": "EDA (exploring data to understand it before any modelling) starts with simple checks such as df.shape, df.info(), df.isna().sum() and df.head(), so you know what you are working with. Deleting all rows with missing values is tempting but risky: you might throw away a large part of the data, or introduce bias, before you even understand why values are missing. Modelling and dashboards come only after you understand the data.",
   "difficulty": "easy"
  },
  {
   "id": "l1-eda-viz-sql-q03",
   "q": "In SQL, which clause filters individual rows before they are grouped?",
   "code": "",
   "options": [
    "HAVING",
    "ORDER BY",
    "SELECT",
    "WHERE"
   ],
   "answer": 3,
   "explain": "WHERE filters rows before GROUP BY forms the groups, for example WHERE city = 'Pune'. HAVING filters whole groups after aggregation (combining many rows into one value such as a SUM), for example HAVING SUM(amount) > 10000. HAVING is tempting because it also filters, but it works on grouped results, not on individual rows.",
   "difficulty": "easy"
  },
  {
   "id": "l1-eda-viz-sql-q04",
   "q": "A retail chain wants managers to explore the relationship between monthly ad spend (₹) and sales (₹) across 200 stores in a web dashboard, hovering over any point to see the store's name. Which is the best choice?",
   "code": "",
   "options": [
    "An interactive scatter plot made with Plotly",
    "A pie chart of total sales made with Matplotlib",
    "A histogram of ad spend made with Seaborn",
    "A bar chart showing only the average sales of all stores"
   ],
   "answer": 0,
   "explain": "Two numeric variables (bivariate analysis) are best shown with a scatter plot, where each dot is one store. Plotly makes interactive charts with hover tooltips and zoom that work in a browser, while Matplotlib and Seaborn mainly produce static images that are great for notebooks and reports. A histogram of ad spend is tempting, but it shows only one variable, so the relationship with sales cannot be seen.",
   "difficulty": "medium"
  },
  {
   "id": "l1-eda-viz-sql-q05",
   "q": "This code applies the 1.5 × IQR rule to find outliers. What does it print?",
   "code": "import numpy as np\ndata = np.array([12, 14, 15, 15, 16, 18, 19, 20, 95])\nq1, q3 = np.percentile(data, [25, 75])\niqr = q3 - q1\nupper = q3 + 1.5 * iqr\nprint(upper, data[data > upper])",
   "options": [
    "19.0 [20 95]",
    "25.0 [95]",
    "6.0 [12 14 15 15 16 18 19 20 95]",
    "25.0 [20 95]"
   ],
   "answer": 1,
   "explain": "Q1 (the 25th percentile) is 15 and Q3 (the 75th percentile) is 19, so the IQR (interquartile range, the spread of the middle 50% of values) is 4. The upper fence is Q3 + 1.5 × IQR = 19 + 6 = 25, and only 95 lies above it. '19.0 [20 95]' is the tempting mistake of using Q3 itself as the cut-off and forgetting the 1.5 × IQR margin.",
   "difficulty": "medium"
  },
  {
   "id": "l1-eda-viz-sql-q06",
   "q": "What does this code print?",
   "code": "import sqlite3\ncon = sqlite3.connect(\":memory:\")\ncon.execute(\"CREATE TABLE orders (city TEXT, amount INTEGER)\")\ncon.executemany(\"INSERT INTO orders VALUES (?, ?)\", [\n    (\"Pune\", 400), (\"Pune\", 700), (\"Delhi\", 300),\n    (\"Delhi\", 200), (\"Surat\", 1500),\n])\nquery = \"\"\"\nSELECT city, SUM(amount) AS total\nFROM orders\nGROUP BY city\nHAVING SUM(amount) > 600\nORDER BY total DESC\n\"\"\"\nprint(con.execute(query).fetchall())",
   "options": [
    "[('Surat', 1500), ('Pune', 700)]",
    "[('Surat', 1500), ('Pune', 1100), ('Delhi', 500)]",
    "[('Pune', 1100), ('Surat', 1500)]",
    "[('Surat', 1500), ('Pune', 1100)]"
   ],
   "answer": 3,
   "explain": "GROUP BY city adds up the amounts for each city: Pune 1100, Delhi 500 and Surat 1500. HAVING then removes groups whose total is not above 600 (Delhi), and ORDER BY total DESC puts the largest total first. ('Pune', 700) is what WHERE amount > 600 would give, because WHERE filters individual rows before grouping, while HAVING filters the grouped totals.",
   "difficulty": "medium"
  },
  {
   "id": "l1-eda-viz-sql-q07",
   "q": "You need to show a non-technical manager at a Chennai bank that loan defaults have risen in rural branches over the last 8 quarters. Which presentation works best?",
   "code": "",
   "options": [
    "A simple line chart of rural vs urban default rates per quarter, titled with the finding",
    "A colourful 3-D pie chart with 15 slices, one slice for each type of branch",
    "A table of all 50,000 raw loan records so the manager can check every number",
    "A heatmap of correlations between all 40 columns, shown without any explanation"
   ],
   "answer": 0,
   "explain": "Good data storytelling picks one clear message and the simplest chart that shows it: a line chart is ideal for change over time, and comparing rural with urban branches gives context. A title such as 'Rural default rate has doubled in two years' tells the reader exactly what to notice. The raw table is tempting because it feels complete, but a manager needs the insight, not 50,000 rows.",
   "difficulty": "medium"
  },
  {
   "id": "l1-eda-viz-sql-q08",
   "q": "What does this code print?",
   "code": "import sqlite3\ncon = sqlite3.connect(\":memory:\")\ncon.execute(\"CREATE TABLE customers (id INTEGER, name TEXT)\")\ncon.execute(\"CREATE TABLE orders (order_id INTEGER, cust_id INTEGER)\")\ncon.executemany(\"INSERT INTO customers VALUES (?, ?)\",\n                [(1, \"Anil\"), (2, \"Bina\"), (3, \"Chetan\")])\ncon.executemany(\"INSERT INTO orders VALUES (?, ?)\",\n                [(101, 1), (102, 1), (103, 2)])\nquery = \"\"\"\nSELECT c.name, COUNT(o.order_id) AS n_orders\nFROM customers c\nLEFT JOIN orders o ON c.id = o.cust_id\nGROUP BY c.name\nORDER BY c.name\n\"\"\"\nprint(con.execute(query).fetchall())",
   "options": [
    "[('Anil', 2), ('Bina', 1)]",
    "[('Anil', 2), ('Bina', 1), ('Chetan', 1)]",
    "[('Anil', 2), ('Bina', 1), ('Chetan', 0)]",
    "[('Anil', 1), ('Bina', 1), ('Chetan', 1)]"
   ],
   "answer": 2,
   "explain": "A LEFT JOIN keeps every customer, even those with no matching order; for Chetan the order columns are NULL (empty). COUNT(o.order_id) counts only non-NULL values, so Chetan correctly gets 0. Writing COUNT(*) instead is a common bug, because it counts the joined row itself and would wrongly give Chetan 1, while an INNER JOIN would drop Chetan completely.",
   "difficulty": "hard"
  },
  {
   "id": "l1-eda-viz-sql-q09",
   "q": "What does this code print?",
   "code": "import sqlite3\ncon = sqlite3.connect(\":memory:\")\ncon.execute(\"CREATE TABLE sales (name TEXT, city TEXT, amount INTEGER)\")\ncon.executemany(\"INSERT INTO sales VALUES (?, ?, ?)\", [\n    (\"Asha\", \"Pune\", 900), (\"Ravi\", \"Pune\", 1200),\n    (\"Meena\", \"Delhi\", 700), (\"John\", \"Delhi\", 700),\n    (\"Kiran\", \"Delhi\", 500),\n])\nquery = \"\"\"\nSELECT name FROM (\n    SELECT name,\n           RANK() OVER (PARTITION BY city ORDER BY amount DESC) AS rnk\n    FROM sales\n) WHERE rnk = 1\nORDER BY name\n\"\"\"\nprint(con.execute(query).fetchall())",
   "options": [
    "[('Ravi',)]",
    "[('Meena',), ('Ravi',)]",
    "[('Asha',), ('Kiran',)]",
    "[('John',), ('Meena',), ('Ravi',)]"
   ],
   "answer": 3,
   "explain": "A window function calculates a value for each row using a group of related rows, without collapsing them into one; PARTITION BY city restarts the ranking for each city, and ORDER BY amount DESC gives rank 1 to the highest amount. In Delhi, Meena and John tie at 700, and RANK() gives both of them rank 1, so three names come back. Expecting exactly one name per city is tempting, but that is how ROW_NUMBER() behaves, since it never gives two rows the same number.",
   "difficulty": "hard"
  },
  {
   "id": "l1-eda-viz-sql-q10",
   "q": "Hospital A's overall recovery rate is 84% and Hospital B's is 71%. Yet for mild cases B recovers 95% vs A's 90%, and for severe cases B recovers 65% vs A's 60%. Of 1,000 patients each, B treated 800 severe cases while A treated only 200. What explains this?",
   "code": "",
   "options": [
    "The numbers must contain a calculation error, since B cannot be better in both groups yet worse overall",
    "B treats far more severe cases, dragging its overall rate down; within each group B is better",
    "Hospital A is better, because the overall recovery rate is the only number that matters",
    "Severity is irrelevant here; the overall gap is just random chance"
   ],
   "answer": 1,
   "explain": "This is Simpson's paradox (a trend that appears in every subgroup reverses when the groups are combined). The hidden third variable is case severity: B treats mostly severe patients, who recover less often in every hospital, so B's combined rate looks worse (A: 720 + 120 = 840 of 1,000; B: 190 + 520 = 710 of 1,000). That is why multivariate analysis (looking at three or more variables together) matters, and why trusting only the overall average is the tempting but wrong choice.",
   "difficulty": "hard"
  }
 ],
 "test-l1": [
  {
   "id": "test-l1-q01",
   "q": "A Bengaluru startup has 5 lakh customer-support tickets, each already tagged by agents as 'refund', 'delivery', 'payment' or 'other'. It wants new tickets to be tagged automatically. Which approach fits best?",
   "code": "",
   "options": [
    "Unsupervised clustering, because text data never comes with labels",
    "Supervised learning: train a classifier on the already-tagged tickets",
    "Reinforcement learning, rewarding the model each time a ticket is closed",
    "No ML: write a separate if/else rule for every possible ticket"
   ],
   "answer": 1,
   "explain": "The tickets already carry the correct answers (labels), so supervised learning, specifically classification (predicting a category), is the natural fit. Clustering is tempting because text feels unstructured, but it is meant for data without labels and would not produce your four business categories by itself. Hand-written rules break quickly when 5 lakh tickets use thousands of different phrasings.",
   "difficulty": "medium"
  },
  {
   "id": "test-l1-q02",
   "q": "Only 2% of a bank's card transactions are fraud. Model A has 98% accuracy but catches only 20% of frauds. Model B has 95% accuracy and catches 85% of frauds. Which model should the bank prefer, and why?",
   "code": "",
   "options": [
    "Model A, because a higher accuracy score always means a better model overall",
    "Model A, because it raises fewer alerts, so customers are disturbed less often",
    "Neither, because any fraud model with accuracy below 99% is unusable in banking",
    "Model B: catching fraud matters, and A barely beats always saying 'not fraud'"
   ],
   "answer": 3,
   "explain": "With 2% fraud, a model that always says 'not fraud' already scores 98% accuracy, so Model A is barely better than doing nothing while missing 80% of frauds. Model B has much higher recall (the share of real frauds it catches) at the cost of more false alarms, which is usually a good trade because a missed fraud costs far more than a quick verification call. Fewer alerts sounds attractive, but on imbalanced data (where one class is rare) accuracy and alert counts hide what really matters.",
   "difficulty": "hard"
  },
  {
   "id": "test-l1-q03",
   "q": "A Hyderabad health-tech company wants to use patients' chat logs with doctors to train a medical chatbot. Under India's DPDP Act, 2023, which plan is the most appropriate?",
   "code": "",
   "options": [
    "Take consent for this specific purpose, mask personal identifiers, and use only needed data",
    "Use all the chat logs freely, because they are already stored on the company's own servers",
    "Publish the chat logs on GitHub so that outside experts can check the model's quality",
    "Keep every chat log forever, in case it becomes useful for some future project"
   ],
   "answer": 0,
   "explain": "The DPDP Act requires consent linked to a clear purpose, data minimisation (using only what is needed) and deleting data once that purpose is served. Masking identifiers such as names, phone numbers and ID numbers further reduces harm if the data ever leaks. Having the data on your own servers is the tempting reason, but holding data does not give a company permission to use it for a new purpose.",
   "difficulty": "medium"
  },
  {
   "id": "test-l1-q04",
   "q": "What does this code print?",
   "code": "marks = {\"Asha\": 82, \"Ravi\": 67, \"Meena\": 91, \"John\": 55}\npassed = {name: m for name, m in marks.items() if m >= 60}\ntop = sorted(passed, key=lambda n: passed[n], reverse=True)\nprint(top[:2], len(passed))",
   "options": [
    "['Asha', 'Meena'] 3",
    "[91, 82] 3",
    "['Meena', 'Asha'] 3",
    "['Meena', 'Asha'] 4"
   ],
   "answer": 2,
   "explain": "The dictionary comprehension keeps only students with marks of 60 or more, so John is dropped and 3 remain. Sorting a dictionary loops over its keys (the names), and the lambda (a small one-line function) tells sorted() to order them by their marks, highest first because of reverse=True. '[91, 82]' is tempting, but sorted() returns the keys being sorted, not the values used to compare them.",
   "difficulty": "hard"
  },
  {
   "id": "test-l1-q05",
   "q": "A shopkeeper expected the full bill for all three items including 18% GST, which is ₹885.0, but this code prints 472.0. What went wrong?",
   "code": "def bill_with_gst(prices, rate=0.18):\n    for p in prices:\n        total = p * (1 + rate)\n    return round(total, 2)\n\nprint(bill_with_gst([100, 250, 400]))",
   "options": [
    "total is overwritten each loop instead of added to, so only the last item is returned",
    "The rate must be written as 18, not 0.18, for the GST to be applied correctly",
    "The return statement is inside the loop, so the function stops after the first item",
    "round() changes the answer; removing it would make the code print 885.0"
   ],
   "answer": 0,
   "explain": "Each loop iteration replaces total with the current item's price plus GST, so after the loop it only holds 400 × 1.18 = 472.0. The fix is to set total = 0 before the loop and write total += p * (1 + rate) inside it. 'return inside the loop' is tempting, but in that case the function would return the first item's value (118.0), not the last one.",
   "difficulty": "hard"
  },
  {
   "id": "test-l1-q06",
   "q": "Two teammates edited the same line of preprocess.py on different branches. When one of them runs git merge, Git reports a merge conflict. What should they do?",
   "code": "",
   "options": [
    "Nothing, because Git always keeps the most recent change automatically after a merge",
    "Delete the local repository and clone it again from GitHub to get a clean copy",
    "Edit the file to the correct version, remove the conflict markers, then add and commit",
    "Force-push their own branch so that the other person's changes are overwritten"
   ],
   "answer": 2,
   "explain": "A merge conflict happens when two branches change the same lines and Git cannot know which version is right. Git marks the clash inside the file with <<<<<<<, ======= and >>>>>>> lines; a person chooses the correct code, deletes the markers, then stages and commits the result. Git never silently picks the 'newer' change, and force-pushing would destroy a teammate's work.",
   "difficulty": "medium"
  },
  {
   "id": "test-l1-q07",
   "q": "Your Jupyter notebook works on your laptop. A friend opens it, clicks 'Restart & Run All', and gets NameError: name 'df_clean' is not defined. What is the most likely cause?",
   "code": "",
   "options": [
    "Your friend's computer does not have enough RAM to load pandas and the data",
    "df_clean came from a cell you later deleted or changed; it only existed in memory",
    "NameError means that the pandas library is not installed on your friend's computer",
    "Jupyter notebooks cannot be run on a different computer from the one that created them"
   ],
   "answer": 1,
   "explain": "Jupyter remembers variables from every cell you have run, even cells you have since deleted, so a notebook can seem to work while depending on hidden state. 'Restart & Run All' starts with empty memory and runs top to bottom, exposing the missing step. A missing library gives ModuleNotFoundError, not NameError, which means a variable or function name was never defined.",
   "difficulty": "medium"
  },
  {
   "id": "test-l1-q08",
   "q": "Out of 1,00,000 UPI transactions, 0.2% are fraud. A fraud-alert system flags 95% of fraud transactions, but it also flags 1% of genuine ones. Of all the flagged transactions, about what fraction are actually fraud?",
   "code": "",
   "options": [
    "About 95%",
    "About 99%",
    "About 2%",
    "About 16%"
   ],
   "answer": 3,
   "explain": "There are 200 frauds, and 190 of them get flagged. Of the 99,800 genuine transactions, 1% (998) are also flagged, so 1,188 are flagged in total and only 190 / 1,188 ≈ 16% are real fraud. 95% is tempting, but that is P(flag | fraud), not P(fraud | flag); Bayes' theorem shows that a rare event combined with even a small false-alarm rate produces many false alarms.",
   "difficulty": "hard"
  },
  {
   "id": "test-l1-q09",
   "q": "An edtech app ran an A/B test of a new lesson layout and got a p-value of 0.20, using a 0.05 significance level. The manager says, 'So the test proved the new layout makes no difference.' What is the correct response?",
   "code": "",
   "options": [
    "Correct: any p-value above 0.05 proves that the two layouts perform exactly the same",
    "Wrong: a p-value of 0.20 means there is a 20% chance that the new layout is better",
    "No: we failed to find strong evidence of a difference, which is not proof of no difference",
    "Wrong: a p-value of 0.20 means the new layout performs 80% better than the old one"
   ],
   "answer": 2,
   "explain": "A large p-value means the data are consistent with the null hypothesis ('no difference'), but 'not shown to be different' is not the same as 'shown to be equal'. A small test may simply lack statistical power (the ability to detect a real effect), so a bigger sample might reveal one. The '20% chance it is better' reading is tempting but wrong, because a p-value is not the probability that either version is better.",
   "difficulty": "medium"
  },
  {
   "id": "test-l1-q10",
   "q": "This code takes 2,000 random samples of 100 customers each from a skewed spending distribution whose standard deviation is about ₹500, and prints the standard deviation of the 2,000 sample means. The printed value is closest to which number?",
   "code": "import numpy as np\nrng = np.random.default_rng(42)\nspend = rng.exponential(scale=500, size=100_000)   # skewed, SD about 500\nsample_means = [rng.choice(spend, 100).mean() for _ in range(2000)]\nprint(round(np.std(sample_means)))",
   "options": [
    "50",
    "500",
    "5",
    "5000"
   ],
   "answer": 0,
   "explain": "By the Central Limit Theorem, the standard deviation of sample means (called the standard error) is about σ/√n = 500 / √100 = 500 / 10 = 50, even though the spending data itself is heavily skewed. 500 is the spread of individual customers; averaging 100 customers cancels out much of that variation. 5 comes from wrongly dividing by n (100) instead of by √n.",
   "difficulty": "hard"
  },
  {
   "id": "test-l1-q11",
   "q": "Data from 500 Indian districts shows that districts with more mobile towers also have higher literacy rates (correlation 0.7). A report concludes: 'Building more towers will increase literacy.' What is the best critique?",
   "code": "",
   "options": [
    "The conclusion is valid, because a correlation of 0.7 is strong enough to prove cause and effect",
    "500 districts are far too few to calculate a reliable correlation coefficient at all",
    "0.7 is too low; only a correlation of exactly 1.0 would prove that towers cause literacy",
    "Urbanisation or income could drive both, so correlation alone can't show towers cause literacy"
   ],
   "answer": 3,
   "explain": "Richer, more urban districts tend to have both more towers and better schools, so urbanisation is a likely confounder (a hidden variable that influences both). No correlation coefficient, however strong, proves cause and effect on its own, which is why the '0.7 is strong enough' and '1.0 would prove it' options are both wrong. Testing causation needs an experiment, or methods that control for confounders, such as comparing similar districts that did and did not get new towers.",
   "difficulty": "medium"
  },
  {
   "id": "test-l1-q12",
   "q": "The loss (w − 4)² is smallest at w = 4. This code prints 8.8 -1.76 10.91. What went wrong?",
   "code": "w = 0.0\nlr = 1.1\nfor step in range(3):\n    grad = 2 * (w - 4)      # derivative of (w - 4)**2\n    w = w - lr * grad\n    print(round(w, 2), end=\" \")",
   "options": [
    "Nothing is wrong; w is slowly converging towards 4, as it should",
    "The learning rate is too large, so every step overshoots w = 4 and lands further away",
    "The gradient formula has the wrong sign, so w keeps moving uphill, away from 4",
    "w is stuck in a local minimum and simply needs many more steps to escape"
   ],
   "answer": 1,
   "explain": "Each update moves w by lr × gradient; with lr = 1.1 the jump is bigger than the distance to the minimum, so w swings from 8.8 to −1.76 to 10.91, ending up further from 4 each time. This is called divergence, and lowering the learning rate (for example to 0.1) makes w settle smoothly at 4. The gradient sign is actually correct, since every step does head towards 4; it just overshoots.",
   "difficulty": "hard"
  },
  {
   "id": "test-l1-q13",
   "q": "In a digit-recognition model, a batch of 64 images, each flattened into 784 pixel values, is stored as a matrix X of shape (64, 784). The weight matrix W has shape (784, 10), one column per digit 0–9. What is the shape of X @ W?",
   "code": "",
   "options": [
    "(64, 10): one row of 10 scores for each image",
    "(784, 784): one score for every pair of pixels",
    "(10, 64): one row for each digit",
    "An error, because 64 and 10 do not match"
   ],
   "answer": 0,
   "explain": "Matrix multiplication needs the inner dimensions to match (784 and 784), and the result keeps the outer ones, giving (64, 10). Each of the 64 rows holds 10 scores, one per digit, which is exactly how a neural network layer processes a whole batch at once. The error option is tempting, but only the inner dimensions must match; the outer ones (64 and 10) can be anything.",
   "difficulty": "medium"
  },
  {
   "id": "test-l1-q14",
   "q": "A movie app compares users' rating vectors using cosine similarity. What does this code print?",
   "code": "import numpy as np\ndef cosine(x, y):\n    return x @ y / (np.linalg.norm(x) * np.linalg.norm(y))\n\nasha  = np.array([4, 0, 3])   # ratings for 3 movies\nravi  = np.array([8, 0, 6])\nmeena = np.array([0, 5, 0])\nprint(round(cosine(asha, ravi), 2), round(cosine(asha, meena), 2))",
   "options": [
    "0.5 0.0",
    "1.0 0.0",
    "50.0 0.0",
    "1.0 1.0"
   ],
   "answer": 1,
   "explain": "Cosine similarity is the dot product divided by the product of the two lengths (norms), and it measures the angle between vectors: 1 means the same direction and 0 means unrelated (perpendicular). Ravi's ratings are exactly 2 × Asha's, so they point the same way and score 1.0 even though the numbers differ, while Asha and Meena rated completely different movies, so their dot product is 0. 50.0 is the raw dot product of Asha and Ravi before dividing by the norms (5 × 10 = 50).",
   "difficulty": "hard"
  },
  {
   "id": "test-l1-q15",
   "q": "A learner wants to replace missing rainfall values with 0 and expects this code to print 0, but it prints 2. What went wrong?",
   "code": "import pandas as pd\ndf = pd.DataFrame({\"rain_mm\": [12.0, None, 30.0, None]})\ndf[\"rain_mm\"].fillna(0)\nprint(df[\"rain_mm\"].isna().sum())",
   "options": [
    "fillna only works on integer columns, and rain_mm is a float column with decimals",
    "pandas does not treat None as a missing value, so there was nothing to fill",
    "dropna() must always be called first, before fillna() is allowed to work on a column",
    "fillna returns a new Series without changing df, and that result was never assigned back"
   ],
   "answer": 3,
   "explain": "Most pandas methods return a new, modified object and leave the original untouched, so here the filled Series was created and immediately thrown away. Writing df['rain_mm'] = df['rain_mm'].fillna(0) fixes it. 'None is not treated as missing' is tempting, but pandas converts None in a numeric column to NaN (Not a Number), which is exactly why isna() counted 2.",
   "difficulty": "hard"
  },
  {
   "id": "test-l1-q16",
   "q": "What does this code print?",
   "code": "import pandas as pd\nsales = pd.DataFrame({\"store\": [\"S1\", \"S2\", \"S1\", \"S3\"],\n                      \"amount\": [1000, 1500, 500, 700]})\nstores = pd.DataFrame({\"store\": [\"S1\", \"S2\", \"S3\"],\n                       \"city\": [\"Pune\", \"Pune\", \"Nagpur\"]})\ndf = sales.merge(stores, on=\"store\")\nprint(df.groupby(\"city\")[\"amount\"].sum().to_dict())",
   "options": [
    "{'Nagpur': 700, 'Pune': 2500}",
    "{'Nagpur': 700, 'Pune': 1500}",
    "{'Nagpur': 700, 'Pune': 3000}",
    "{'S1': 1500, 'S2': 1500, 'S3': 700}"
   ],
   "answer": 2,
   "explain": "merge attaches each store's city to every sale, so both S1 sales and the S2 sale are tagged Pune. groupby('city') then adds them up: 1000 + 500 + 1500 = 3000 for Pune and 700 for Nagpur. Grouping by store instead of city would give the per-store totals in the last option, a common mix-up when a table has several ID-like columns.",
   "difficulty": "medium"
  },
  {
   "id": "test-l1-q17",
   "q": "Daily maximum temperatures in Nagpur are stored in an array. What does this code print?",
   "code": "import numpy as np\ntemps = np.array([31, 35, 29, 38, 40, 33])   # °C\nhot = temps > 34\nprint(hot.sum(), round(temps[hot].mean(), 1))",
   "options": [
    "3 37.7",
    "3 34.3",
    "[False  True False  True  True False] 37.7",
    "6 37.7"
   ],
   "answer": 0,
   "explain": "temps > 34 creates a boolean mask (an array of True/False values, one per temperature). Summing it counts the True values, because True counts as 1, giving 3, and temps[hot] keeps only 35, 38 and 40, whose mean is 37.7. 34.3 is the mean of all six temperatures, which is what you would get if the mask had not been applied.",
   "difficulty": "hard"
  },
  {
   "id": "test-l1-q18",
   "q": "This query is meant to list cities whose total sales are above ₹10,000, but running it raises an error ('misuse of aggregate'). What is the correct fix?",
   "code": "import sqlite3\ncon = sqlite3.connect(\":memory:\")\ncon.execute(\"CREATE TABLE orders (city TEXT, amount INTEGER)\")\ncon.executemany(\"INSERT INTO orders VALUES (?, ?)\",\n                [(\"Pune\", 8000), (\"Pune\", 4000), (\"Delhi\", 3000)])\nquery = \"\"\"\nSELECT city, SUM(amount) AS total\nFROM orders\nWHERE SUM(amount) > 10000\nGROUP BY city\n\"\"\"\nprint(con.execute(query).fetchall())",
   "options": [
    "Move the GROUP BY city line above the FROM line so groups are formed first",
    "Replace SUM(amount) with COUNT(amount) in the WHERE line, which is allowed there",
    "Add ORDER BY total at the end so the totals are calculated before filtering",
    "Replace the WHERE line with HAVING SUM(amount) > 10000 placed after GROUP BY"
   ],
   "answer": 3,
   "explain": "SQL processes WHERE before GROUP BY, so at that moment no group totals exist yet, and aggregate functions (functions such as SUM that combine many rows) cannot be used there. HAVING runs after grouping and is designed to filter on aggregates; with that fix the query returns [('Pune', 12000)]. Swapping SUM for COUNT does not help, because COUNT is also an aggregate and causes the same error.",
   "difficulty": "hard"
  },
  {
   "id": "test-l1-q19",
   "q": "In a dataset of Mumbai flat prices, you notice a few flats priced at ₹1 and several with 'building age = 999 years'. What is the best way to handle these values?",
   "code": "",
   "options": [
    "Keep them unchanged, because every data point is valuable and must never be touched",
    "Automatically delete every value above the 95th percentile in every column",
    "Treat them as likely entry errors or codes: check the source, fix or remove, and document it",
    "Replace every price in the column with the average price so the odd values disappear"
   ],
   "answer": 2,
   "explain": "Not every outlier is an error: a ₹50 crore sea-facing flat may be real and important. But a ₹1 flat or a 999-year-old building is impossible, and 999 is often a placeholder code for 'unknown', so you investigate, then correct or remove those rows and document the decision. Blindly deleting the top 5% of every column is tempting because it is quick, but it throws away genuine expensive flats and distorts the analysis.",
   "difficulty": "medium"
  },
  {
   "id": "test-l1-q20",
   "q": "A coaching institute wants a list of ALL registered students, including those who submitted nothing, with each student's number of submissions. The tables are students(id, name) and submissions(sub_id, student_id). Which query gives the correct result?",
   "code": "",
   "options": [
    "SELECT s.name, COUNT(*) FROM students s LEFT JOIN submissions sub ON s.id = sub.student_id GROUP BY s.name",
    "SELECT s.name, COUNT(sub.sub_id) FROM students s LEFT JOIN submissions sub ON s.id = sub.student_id GROUP BY s.name",
    "SELECT s.name, COUNT(sub.sub_id) FROM students s INNER JOIN submissions sub ON s.id = sub.student_id GROUP BY s.name",
    "SELECT s.name, COUNT(*) FROM students s INNER JOIN submissions sub ON s.id = sub.student_id GROUP BY s.name"
   ],
   "answer": 1,
   "explain": "The LEFT JOIN keeps students who have no submissions (their submission columns become NULL), and COUNT(sub.sub_id) counts only non-NULL IDs, so those students correctly get 0. COUNT(*) with a LEFT JOIN is the tempting trap: it counts the joined row itself, so a student with zero submissions wrongly shows 1. Both INNER JOIN versions drop the students who never submitted anything.",
   "difficulty": "hard"
  }
 ],
 "l2-ml-foundations": [
  {
   "id": "l2-ml-foundations-q01",
   "q": "A Pune real-estate website wants to predict the sale price of a flat from its area (sq ft), number of bedrooms and locality. In this ML problem, what is the label?",
   "code": "",
   "options": [
    "The area of the flat in sq ft",
    "The number of bedrooms",
    "The locality name",
    "The sale price of the flat"
   ],
   "answer": 3,
   "explain": "The label (also called the target) is the value the model must predict, which here is the sale price. Area, bedrooms and locality are features (the inputs the model uses to make that prediction). A common mix-up is to call the most important input, like area, the label, but being important does not make a column the target.",
   "difficulty": "easy"
  },
  {
   "id": "l2-ml-foundations-q02",
   "q": "You split your data into training, validation and test sets. What is the validation set mainly used for?",
   "code": "",
   "options": [
    "Learning the model's weights",
    "Comparing models and choosing settings such as tree depth",
    "Reporting the final, honest score once at the very end",
    "Storing the rows that have missing values"
   ],
   "answer": 1,
   "explain": "The validation set is used while you are still building: you compare models and pick hyperparameters (settings you choose before training, like tree depth) using it. The final honest score comes from the test set, which you use only once at the end. If you keep checking the test set while tuning, it stops being 'unseen' and its score becomes over-optimistic.",
   "difficulty": "easy"
  },
  {
   "id": "l2-ml-foundations-q03",
   "q": "A model that predicts whether a student will clear an entrance exam scores 99% accuracy on the training data but only 62% on the test data. What is the most likely problem?",
   "code": "",
   "options": [
    "Overfitting: it memorised the training data instead of learning general patterns",
    "Underfitting: the model is too simple",
    "The test set is too large",
    "Nothing: test accuracy does not matter if training accuracy is high"
   ],
   "answer": 0,
   "explain": "A big gap between a very high training score and a much lower test score is the classic sign of overfitting (high variance): the model learned noise and quirks of the training rows. Underfitting looks different, because the score is poor on both the training and the test data.",
   "difficulty": "easy"
  },
  {
   "id": "l2-ml-foundations-q04",
   "q": "A crop-price prediction model for an agri-startup worked well at launch. Six months later its errors have doubled because a new minimum support price (MSP) policy changed how prices move. Which step of the ML project lifecycle was neglected?",
   "code": "",
   "options": [
    "Defining the problem clearly",
    "Choosing the train/test split ratio",
    "Monitoring the deployed model and retraining it on fresh data",
    "Collecting more features at the start"
   ],
   "answer": 2,
   "explain": "The ML lifecycle does not end at deployment: you must keep monitoring live performance and retrain when the world changes (this is called drift, meaning new data no longer follows the patterns of the training data). No split ratio or extra feature chosen at the start could have predicted a future policy change. Only monitoring and retraining catches and fixes it.",
   "difficulty": "medium"
  },
  {
   "id": "l2-ml-foundations-q05",
   "q": "A straight-line model predicting a city's daily electricity demand has high error on BOTH the training set (MAE 900 MW) and the validation set (MAE 950 MW). Which change is most likely to help?",
   "code": "",
   "options": [
    "Add stronger regularisation to make the model even simpler",
    "Use a more flexible model or add useful features such as temperature and day of the week",
    "Collect many more rows of the same data and keep the same model",
    "Remove half of the features"
   ],
   "answer": 1,
   "explain": "Similar, high error on both training and validation data means underfitting (high bias: the model is too simple to capture the pattern), so it needs more capacity or better features. Collecting more rows is tempting, but extra data mainly cures overfitting (high variance); a straight line stays a straight line however much data you give it. Stronger regularisation or fewer features would make the model even simpler.",
   "difficulty": "medium"
  },
  {
   "id": "l2-ml-foundations-q06",
   "q": "A bank's loan-default model reaches 99% validation accuracy. One of its features is 'number of recovery calls made to the customer'. Why is this result suspicious?",
   "code": "",
   "options": [
    "Recovery calls happen only after a customer defaults, so the feature leaks the answer and will not exist when a new loan is being decided",
    "99% accuracy is impossible for any real-world model",
    "Phone-call data is always too noisy to be useful",
    "The model needs more training epochs to be trustworthy"
   ],
   "answer": 0,
   "explain": "This is target leakage (a kind of data leakage): a feature that is only known after the outcome sneaks the answer into training. At loan-approval time there are no recovery calls yet, so real-world accuracy will collapse. High accuracy is not impossible by itself; the problem is where the information came from.",
   "difficulty": "medium"
  },
  {
   "id": "l2-ml-foundations-q07",
   "q": "You are predicting next week's UPI transaction volume for a bank. A random, shuffled train/test split gives a great score, but the model does badly once it is used for real forecasts. What is the best fix?",
   "code": "",
   "options": [
    "Shuffle the data twice for better randomness",
    "Use a bigger test set of randomly chosen weeks",
    "Add the test rows into the training data",
    "Split by time: train on older weeks and test on later weeks"
   ],
   "answer": 3,
   "explain": "With time-ordered data, a random split lets the model learn from 'future' weeks and then be tested on 'past' weeks, a form of leakage that makes scores look better than reality. Splitting by time (train on the past, test on the future) copies how the model will actually be used. A bigger random test set still mixes the future into training, so it does not solve the problem.",
   "difficulty": "medium"
  },
  {
   "id": "l2-ml-foundations-q08",
   "q": "What does this code print?",
   "code": "import numpy as np\nfrom sklearn.preprocessing import StandardScaler\n\ntrain = np.array([[10.0], [20.0], [30.0]])\ntest = np.array([[40.0]])\nsc = StandardScaler().fit(train)\nprint(sc.transform(test).round(2))",
   "options": [
    "[[0.]]",
    "[[1.34]]",
    "[[2.45]]",
    "[[40.]]"
   ],
   "answer": 2,
   "explain": "fit() learns the mean (20) and standard deviation (about 8.16) from the training data only, and transform() applies them to the test value: (40 - 20) / 8.16 ≈ 2.45. You would get 1.34 if the scaler had been fitted on all four values including the test row, which is leakage. You would get 0 if you wrongly called fit_transform() on the test set, which uses the test set's own statistics.",
   "difficulty": "hard"
  },
  {
   "id": "l2-ml-foundations-q09",
   "q": "A small fraud dataset has 8 genuine (0) and 2 fraud (1) transactions. What does this baseline print, and what does it teach?",
   "code": "import numpy as np\nfrom sklearn.dummy import DummyClassifier\n\nX = np.zeros((10, 1))                 # features don't matter here\ny = np.array([0] * 8 + [1] * 2)       # 8 genuine, 2 fraud\nbase = DummyClassifier(strategy=\"most_frequent\").fit(X, y)\nprint(base.score(X, y), base.predict(X).sum())",
   "options": [
    "0.8 2 : the baseline catches both frauds",
    "0.8 0 : 80% accuracy while catching zero fraud, so any real model must beat this",
    "0.2 0 : the baseline is wrong on every row",
    "1.0 0 : the baseline is perfect"
   ],
   "answer": 1,
   "explain": "A 'most_frequent' DummyClassifier (a baseline model that ignores the features) always predicts the majority class, 0 (genuine). It is right on 8 of 10 rows, so accuracy is 0.8, and it predicts fraud for no one, so the sum of its predictions is 0. This is why baselines matter: a fraud model showing 80% accuracy here would be no better than doing nothing.",
   "difficulty": "hard"
  },
  {
   "id": "l2-ml-foundations-q10",
   "q": "You fit polynomial models of different degrees to predict monsoon rainfall. RMSE in mm: Degree 1 gives train 40, validation 42. Degree 4 gives train 12, validation 14. Degree 15 gives train 1, validation 60. Which reading is correct?",
   "code": "",
   "options": [
    "Degree 15 is best because its training error is lowest",
    "Degree 1 overfits and degree 15 underfits",
    "All three are equally good because they were trained on the same data",
    "Degree 4 is best; degree 1 underfits (high bias) and degree 15 overfits (high variance)"
   ],
   "answer": 3,
   "explain": "Choose the model with the lowest validation error, not training error: degree 4 (14 mm). Degree 1 is poor on both sets, which is underfitting (high bias, too simple). Degree 15 is nearly perfect on training but terrible on validation, which is overfitting (high variance, it memorised noise); picking it because of its tiny training error is the most common trap.",
   "difficulty": "hard"
  }
 ],
 "l2-regression": [
  {
   "id": "l2-regression-q01",
   "q": "A model predicts monthly flat rent in Hyderabad as: rent = 4000 + 15 × area_sqft. What does the number 15 mean?",
   "code": "",
   "options": [
    "Every flat's rent starts at ₹15",
    "Each extra square foot adds about ₹15 to the predicted rent",
    "The model's average error is ₹15",
    "Rent goes up by 15% for every extra square foot"
   ],
   "answer": 1,
   "explain": "In linear regression, a coefficient (slope) tells you how much the prediction changes when that feature goes up by one unit, keeping other features fixed: here ₹15 per extra sq ft. The 4000 is the intercept (the prediction when the feature is 0). Reading 15 as a percentage is a common slip; the change is in rupees, not percent.",
   "difficulty": "easy"
  },
  {
   "id": "l2-regression-q02",
   "q": "Which version of gradient descent updates the model's weights using a small group of rows (for example 32 or 64) at a time?",
   "code": "",
   "options": [
    "Batch gradient descent",
    "Stochastic gradient descent",
    "Mini-batch gradient descent",
    "The normal equation"
   ],
   "answer": 2,
   "explain": "Mini-batch gradient descent computes the gradient on a small batch of rows for each update. It sits between batch gradient descent (all rows per update: smooth but slow) and stochastic gradient descent (one row per update: fast but noisy). The normal equation is a direct formula for linear regression that does not take steps at all.",
   "difficulty": "easy"
  },
  {
   "id": "l2-regression-q03",
   "q": "Which regularisation method can push some coefficients to exactly zero, effectively removing those features from the model?",
   "code": "",
   "options": [
    "Lasso (L1)",
    "Ridge (L2)",
    "Plain linear regression",
    "Polynomial features"
   ],
   "answer": 0,
   "explain": "Lasso adds a penalty on the absolute size of the coefficients (the L1 penalty), which can drive weak features' coefficients to exactly zero, giving automatic feature selection. Ridge (the L2 penalty, on squared coefficients) shrinks coefficients towards zero but practically never makes them exactly zero.",
   "difficulty": "easy"
  },
  {
   "id": "l2-regression-q04",
   "q": "While training linear regression with gradient descent, your loss (MSE) after each epoch is: 10, 25, 70, 300, 1200. What is the most likely cause?",
   "code": "",
   "options": [
    "The learning rate is too small",
    "The model is underfitting",
    "The dataset has too many rows",
    "The learning rate is too large, so each step overshoots the minimum"
   ],
   "answer": 3,
   "explain": "If the loss grows every epoch (an epoch is one full pass over the training data), the steps are so big that they jump past the lowest point and land further away each time, so reduce the learning rate (step size). A too-small learning rate shows the opposite symptom: the loss falls, but very slowly.",
   "difficulty": "medium"
  },
  {
   "id": "l2-regression-q05",
   "q": "A food-delivery company in Kolkata wants one error number for managers: 'on average, how many minutes off are our delivery-time predictions?' A few orders had extreme delays because of flooding. Which metric fits best?",
   "code": "",
   "options": [
    "RMSE, because it gives extra weight to big errors",
    "MAE, because it is in minutes and is not dominated by a few extreme errors",
    "R², because it is always between 0 and 1",
    "MSE, because it is measured in minutes"
   ],
   "answer": 1,
   "explain": "MAE (mean absolute error) is the average size of the errors in the same unit as the target (minutes), and each error counts in proportion to its size, so a few flood-day orders do not dominate it. RMSE (root mean squared error) squares errors before averaging, so big errors pull it up a lot; that is useful when large errors are especially costly, but not for a simple 'typical error'. MSE is in minutes squared, and R² can even be negative.",
   "difficulty": "medium"
  },
  {
   "id": "l2-regression-q06",
   "q": "Plotting AC sales against temperature in Nagpur shows a clear curve: sales rise slowly at first, then very fast above 38°C. A straight-line model underfits. What is a simple fix?",
   "code": "",
   "options": [
    "Switch to logistic regression",
    "Remove the temperature feature",
    "Use MAE instead of MSE as the loss",
    "Add polynomial features (such as temperature²) and fit linear regression on them"
   ],
   "answer": 3,
   "explain": "Polynomial regression creates new features like temperature² and temperature³, which lets a linear model fit a curve; it is still 'linear' in its coefficients, so the same fitting method works. Logistic regression is for classification (predicting categories), not for a number like sales. Changing the loss function does not give a straight line the ability to bend.",
   "difficulty": "medium"
  },
  {
   "id": "l2-regression-q07",
   "q": "After fitting linear regression for house prices, you plot residuals (actual minus predicted) against predicted price. The spread is narrow for cheap houses and much wider for expensive ones, like a funnel. Which assumption is broken, and what often helps?",
   "code": "",
   "options": [
    "Constant spread of errors (homoscedasticity) is broken; log-transforming the price often helps",
    "Linearity is broken; delete the expensive houses",
    "Independence of features is broken; add more features",
    "Nothing is broken; a funnel shape is ideal"
   ],
   "answer": 0,
   "explain": "Linear regression assumes the errors have roughly the same spread everywhere (homoscedasticity); a funnel means the spread grows with the prediction (heteroscedasticity). Modelling log(price) often evens out the spread. Deleting expensive houses throws away real data and hides the problem instead of fixing it.",
   "difficulty": "medium"
  },
  {
   "id": "l2-regression-q08",
   "q": "What does this code print?",
   "code": "import numpy as np\nfrom sklearn.metrics import mean_absolute_error, mean_squared_error\n\ny = np.array([3, 5, 7])\np = np.array([2, 5, 10])\nprint(round(mean_absolute_error(y, p), 2), round(mean_squared_error(y, p), 2))",
   "options": [
    "4.0 10.0",
    "1.33 1.83",
    "1.33 3.33",
    "1.0 3.33"
   ],
   "answer": 2,
   "explain": "The errors are 3-2 = 1, 5-5 = 0 and 7-10 = -3. MAE averages their absolute sizes: (1 + 0 + 3) / 3 ≈ 1.33, and MSE averages their squares: (1 + 0 + 9) / 3 ≈ 3.33. The value 1.83 is the RMSE (square root of the MSE), which this code does not print, and 4.0 and 10.0 are the totals before dividing by 3.",
   "difficulty": "hard"
  },
  {
   "id": "l2-regression-q09",
   "q": "This is one step of gradient descent for the model prediction = w × x, with loss (w × x - y)². What is printed?",
   "code": "x, y = 2.0, 8.0              # one data point\nw, lr = 1.0, 0.1             # starting weight, learning rate\ngrad = 2 * (w * x - y) * x   # derivative of (w*x - y)**2 with respect to w\nw = w - lr * grad\nprint(round(w, 2))",
   "options": [
    "-1.4",
    "3.4",
    "25.0",
    "1.0"
   ],
   "answer": 1,
   "explain": "The gradient is 2 × (1 × 2 - 8) × 2 = -24. Gradient descent moves against the gradient: w = 1 - 0.1 × (-24) = 1 + 2.4 = 3.4, so w moves towards the ideal value 4 (because 4 × 2 = 8). Getting -1.4 means adding the gradient instead of subtracting it, which walks uphill; 25.0 means forgetting to multiply by the learning rate.",
   "difficulty": "hard"
  },
  {
   "id": "l2-regression-q10",
   "q": "What does this code print, and what does it mean?",
   "code": "from sklearn.metrics import r2_score\n\ny = [10, 20, 30]\np = [30, 20, 10]\nprint(r2_score(y, p))",
   "options": [
    "0.0 : the model is exactly as good as predicting the mean",
    "1.0 : a perfect fit",
    "-3.0 : the model is far worse than simply predicting the mean every time",
    "0.25 : a weak but positive fit"
   ],
   "answer": 2,
   "explain": "R² = 1 - (model's sum of squared errors) / (sum of squared errors when always predicting the mean). The model's squared errors are 400 + 0 + 400 = 800, while always predicting the mean (20) gives 100 + 0 + 100 = 200, so R² = 1 - 800/200 = -3.0. Many learners believe R² cannot go below 0, but it does whenever a model is worse than that plain-mean baseline.",
   "difficulty": "hard"
  }
 ],
 "l2-classification": [
  {
   "id": "l2-classification-q01",
   "q": "In logistic regression, the sigmoid function turns the model's raw score (z) into what?",
   "code": "",
   "options": [
    "A number between -1 and 1",
    "A number between 0 and 1 that can be read as a probability",
    "Any real number, just like linear regression",
    "Always exactly 0 or exactly 1"
   ],
   "answer": 1,
   "explain": "The sigmoid, 1 / (1 + e^(-z)), squeezes any raw score into the range 0 to 1, which is read as the probability of the positive class (for example 'spam'). A hard 0/1 label appears only after you apply a threshold such as 0.5; the sigmoid itself never reaches exactly 0 or 1.",
   "difficulty": "easy"
  },
  {
   "id": "l2-classification-q02",
   "q": "How does a K-Nearest Neighbours (KNN) classifier with K = 5 label a new data point?",
   "code": "",
   "options": [
    "It draws a straight line between the classes and checks which side the point is on",
    "It multiplies the probabilities of each feature for each class",
    "It picks 5 random training points and copies the label of the first one",
    "It finds the 5 training points closest to the new point and takes a majority vote of their labels"
   ],
   "answer": 3,
   "explain": "KNN stores the training data and, for a new point, finds the K nearest points (usually by Euclidean distance, the straight-line distance) and lets them vote. Drawing a straight separating line describes linear models such as logistic regression or a linear SVM, and multiplying feature probabilities describes Naive Bayes.",
   "difficulty": "easy"
  },
  {
   "id": "l2-classification-q03",
   "q": "Why is Naive Bayes called 'naive'?",
   "code": "",
   "options": [
    "It assumes the features are independent of each other once you know the class",
    "It is meant only for beginners",
    "It ignores the training data and guesses",
    "It assumes all classes are equally common"
   ],
   "answer": 0,
   "explain": "Naive Bayes applies Bayes' theorem with a simplifying assumption: within each class, every feature is independent of the others (conditional independence). Words in an SMS are not truly independent, yet the method still works surprisingly well for text. It does not assume classes are equally common; it uses class frequencies from the training data (the prior).",
   "difficulty": "easy"
  },
  {
   "id": "l2-classification-q04",
   "q": "You use KNN to predict whether a customer will accept a credit-card offer. Features: annual income (₹2,00,000 to ₹50,00,000) and age (21 to 60). Accuracy is poor. What is the most likely fix?",
   "code": "",
   "options": [
    "Use K = 1",
    "Remove the age feature",
    "Scale the features (for example with StandardScaler) so both contribute fairly to the distance",
    "Measure distance using income only"
   ],
   "answer": 2,
   "explain": "KNN works with distances, and an income gap of ₹1,00,000 completely swamps an age gap of 30 years, so age is effectively ignored. Scaling puts features on comparable ranges (StandardScaler gives each feature mean 0 and standard deviation 1). Changing K does not fix the fact that one feature dominates the distance.",
   "difficulty": "medium"
  },
  {
   "id": "l2-classification-q05",
   "q": "In a 2-D plot of sensor readings, all defective bottles from a Gujarat factory lie inside a circle and all good bottles form a ring around it. A linear SVM performs badly. What should you try?",
   "code": "",
   "options": [
    "An SVM with an RBF kernel",
    "A linear SVM with a larger C",
    "Linear regression",
    "Removing one of the two features"
   ],
   "answer": 0,
   "explain": "No straight line can separate a circle from the ring around it. A kernel (a trick that lets the SVM behave as if the data were mapped into a higher-dimensional space) such as RBF (radial basis function) can produce a curved, circular boundary. Increasing C on a linear SVM only changes how strictly it fits; the boundary is still a straight line.",
   "difficulty": "medium"
  },
  {
   "id": "l2-classification-q06",
   "q": "A startup has 3,000 labelled Hinglish SMS messages (spam / not spam) converted into word counts. They want a fast, simple first model that is known to work well on text. Which is the most sensible choice?",
   "code": "",
   "options": [
    "Linear regression on the word counts, predicting 0 or 1",
    "K-Means clustering with K = 2",
    "PCA down to 2 dimensions and nothing else",
    "Multinomial Naive Bayes on the word counts"
   ],
   "answer": 3,
   "explain": "Multinomial Naive Bayes is designed for count features like word frequencies, trains in seconds, and is a classic strong baseline for spam filtering. K-Means is unsupervised, so it ignores the labels you already have and its two clusters may not match spam / not spam at all. Linear regression predicts unbounded numbers rather than class probabilities, so it is a poor fit for classification.",
   "difficulty": "medium"
  },
  {
   "id": "l2-classification-q07",
   "q": "A plant-disease app sorts leaves into 5 disease classes using logistic regression wrapped in scikit-learn's OneVsRestClassifier. How many binary classifiers are trained?",
   "code": "",
   "options": [
    "1",
    "5",
    "10",
    "25"
   ],
   "answer": 1,
   "explain": "One-vs-Rest (OvR) trains one binary classifier per class ('this class vs all others'), so 5 classes need 5 classifiers, and the class whose classifier is most confident wins. The tempting 10 is the count for One-vs-One, which trains a classifier for every pair of classes: 5 × 4 / 2 = 10.",
   "difficulty": "medium"
  },
  {
   "id": "l2-classification-q08",
   "q": "What does this code print? Each option shows the two printed lines separated by ' / ' (x, probability, predicted class at threshold 0.5).",
   "code": "import numpy as np\n\nw, b = 1.5, -4.0\nfor x in [2, 3]:\n    z = w * x + b\n    p = 1 / (1 + np.exp(-z))\n    print(x, round(p, 2), int(p >= 0.5))",
   "options": [
    "2 0.73 1 / 3 0.38 0",
    "2 0.27 0 / 3 0.62 0",
    "2 0.27 0 / 3 0.62 1",
    "2 0.5 1 / 3 0.5 1"
   ],
   "answer": 2,
   "explain": "For x = 2: z = 1.5 × 2 - 4 = -1, and sigmoid(-1) ≈ 0.27, which is below 0.5, so class 0. For x = 3: z = 0.5, and sigmoid(0.5) ≈ 0.62, which is at least 0.5, so class 1. The option with 0.73 and 0.38 comes from flipping the sign of z; remember that a negative z always gives a probability below 0.5.",
   "difficulty": "hard"
  },
  {
   "id": "l2-classification-q09",
   "q": "What does this code print? Each option shows the two printed lines separated by ' / '.",
   "code": "from sklearn.neighbors import KNeighborsClassifier\n\nX = [[1], [2], [3], [10], [11]]\ny = [\"A\", \"A\", \"B\", \"B\", \"B\"]\nfor k in [1, 3]:\n    m = KNeighborsClassifier(n_neighbors=k).fit(X, y)\n    print(k, m.predict([[2.6]])[0])",
   "options": [
    "1 B / 3 A",
    "1 A / 3 A",
    "1 B / 3 B",
    "1 A / 3 B"
   ],
   "answer": 0,
   "explain": "The new point 2.6 is 0.4 away from 3 (B), 0.6 from 2 (A) and 1.6 from 1 (A). With K = 1 only the nearest point votes, giving B. With K = 3 the three nearest are 3 (B), 2 (A) and 1 (A), so A wins 2 votes to 1. Many learners assume the single nearest point always decides, but the choice of K can flip a prediction.",
   "difficulty": "hard"
  },
  {
   "id": "l2-classification-q10",
   "q": "A loan model uses logistic regression with raw score z = 0.8 × income (₹ lakh per year) - 0.5 × existing_loans - 3. The bank approves when the predicted probability is at least 0.5. Which applicant is approved?",
   "code": "",
   "options": [
    "Income 4 lakh, 1 existing loan",
    "Income 6 lakh, 4 existing loans",
    "Income 5 lakh, 1 existing loan",
    "Income 3 lakh, 0 existing loans"
   ],
   "answer": 2,
   "explain": "sigmoid(z) is at least 0.5 exactly when z is at least 0, so you only need the sign of z; the line z = 0 is the decision boundary. Scores: 3.2 - 0.5 - 3 = -0.3, then 4.8 - 2 - 3 = -0.2, then 4 - 0.5 - 3 = +0.5, then 2.4 - 3 = -0.6. Only the 5-lakh, 1-loan applicant is on the positive side; the 6-lakh applicant has the highest income, but 4 existing loans pull the score below zero.",
   "difficulty": "hard"
  }
 ],
 "l2-metrics-tuning": [
  {
   "id": "l2-metrics-tuning-q01",
   "q": "A UPI fraud model is tested on 100 actual fraud transactions and correctly flags 70 of them. Which metric equals 70 / 100 = 0.70?",
   "code": "",
   "options": [
    "Recall",
    "Precision",
    "Accuracy",
    "F1 score"
   ],
   "answer": 0,
   "explain": "Recall = true positives / all actual positives, i.e. 'of all real frauds, how many did we catch?' (a true positive is a fraud correctly flagged as fraud). Precision answers a different question, 'of everything we flagged, how much was really fraud?', and needs the number of false alarms, which this calculation does not use.",
   "difficulty": "easy"
  },
  {
   "id": "l2-metrics-tuning-q02",
   "q": "A model's ROC-AUC on the test set is 0.5. What does this mean?",
   "code": "",
   "options": [
    "It is a perfect model",
    "It is right 50% of the time, which is good for a two-class problem",
    "It ranks positive cases above negative cases no better than random guessing",
    "Half of its features are useless"
   ],
   "answer": 2,
   "explain": "ROC-AUC is the chance that the model gives a randomly chosen positive case a higher score than a randomly chosen negative case, so 0.5 is coin-tossing and 1.0 is perfect ranking. It is not the same as accuracy: an AUC of 0.5 means the model's scores carry no useful ranking information at all.",
   "difficulty": "easy"
  },
  {
   "id": "l2-metrics-tuning-q03",
   "q": "Only 3% of your rows are positive (for example, loan defaults). Why would you use StratifiedKFold instead of plain KFold for cross-validation?",
   "code": "",
   "options": [
    "It makes training faster",
    "It removes duplicate rows",
    "It always uses 10 folds",
    "It keeps roughly the same 3% positive share in every fold"
   ],
   "answer": 3,
   "explain": "Cross-validation trains and tests the model k times, each time holding out a different fold (slice) of the data. With plain KFold, some folds could get almost no positives by chance, making their scores unreliable; StratifiedKFold keeps each fold's class proportions close to the full dataset's. It does not change speed or the number of folds, which you still choose yourself.",
   "difficulty": "easy"
  },
  {
   "id": "l2-metrics-tuning-q04",
   "q": "A digital-wallet company's data has 0.5% fraud. Your first model shows 99.5% accuracy, but its recall for fraud is 0. What is the best next step?",
   "code": "",
   "options": [
    "Celebrate: 99.5% accuracy is excellent",
    "Use class_weight='balanced' (or resampling) and judge the model by precision, recall and PR-AUC instead of accuracy",
    "Delete the fraud rows because they are outliers",
    "Train longer until accuracy reaches 99.9%"
   ],
   "answer": 1,
   "explain": "With 0.5% fraud, predicting 'not fraud' for everyone already scores 99.5% accuracy, so accuracy hides the fact that no fraud is caught (the accuracy paradox). class_weight='balanced' makes mistakes on the rare class cost more during training, and precision, recall and PR-AUC (area under the precision-recall curve) actually measure fraud-catching. Chasing higher accuracy would still reward ignoring fraud.",
   "difficulty": "medium"
  },
  {
   "id": "l2-metrics-tuning-q05",
   "q": "A TB-screening model at a rural health camp decides who is sent for a confirmatory test. Missing a sick person is far worse than sending a healthy person for one extra test. How should you set the decision threshold?",
   "code": "",
   "options": [
    "Raise it to 0.9 so only very sure cases are flagged",
    "Keep 0.5 because it is the standard",
    "Pick the threshold that maximises accuracy",
    "Lower it (for example to 0.2) to raise recall, accepting more false positives"
   ],
   "answer": 3,
   "explain": "Lowering the threshold flags more people, which catches more true cases (higher recall) at the cost of more false alarms (lower precision), the right trade when a false negative (a missed sick person) is the costly error. Raising the threshold does the opposite: fewer false alarms but more missed patients. 0.5 is only a default, not a rule.",
   "difficulty": "medium"
  },
  {
   "id": "l2-metrics-tuning-q06",
   "q": "You need to tune 6 hyperparameters of a gradient boosting model, and each training run takes 10 minutes on a free Colab GPU. Which tuning approach is most practical?",
   "code": "",
   "options": [
    "Random search or Optuna with a fixed budget of trials (for example 50)",
    "Grid search over 10 values for every hyperparameter",
    "Tune directly on the test set to save time",
    "Tune one hyperparameter at a time and never revisit it"
   ],
   "answer": 0,
   "explain": "A full grid with 10 values each needs 10⁶ = 10,00,000 runs, which is impossible here. Random search samples combinations and often finds good ones quickly, and Optuna goes further by learning from earlier trials which regions look promising. Tuning on the test set would leak it into model selection and make the final score over-optimistic.",
   "difficulty": "medium"
  },
  {
   "id": "l2-metrics-tuning-q07",
   "q": "A team applied SMOTE (which creates synthetic minority-class rows by blending nearby real ones) to the ENTIRE dataset, then ran 5-fold cross-validation and got recall 0.95. In production, recall is 0.60. What went wrong?",
   "code": "",
   "options": [
    "SMOTE always lowers recall",
    "5 folds is too few; 10 folds would have fixed it",
    "Synthetic rows made from validation rows leaked into training, so validation was not truly unseen; SMOTE should be applied only to the training part of each fold",
    "Production data is always worse, so nothing could have been done"
   ],
   "answer": 2,
   "explain": "Because SMOTE ran before the split, a real row and the synthetic 'twins' made from it could land in different folds, so the model was effectively tested on near-copies of what it trained on. Resampling must happen inside each training fold only (for example with imbalanced-learn's Pipeline). Using more folds does not fix leakage, because every fold would still be contaminated.",
   "difficulty": "medium"
  },
  {
   "id": "l2-metrics-tuning-q08",
   "q": "What does this code print? (precision, recall, F1)",
   "code": "from sklearn.metrics import precision_score, recall_score, f1_score\n\ny_true = [1, 1, 1, 1, 0, 0, 0, 0, 0, 0]\ny_pred = [1, 1, 0, 0, 1, 0, 0, 0, 0, 0]\nprint(round(precision_score(y_true, y_pred), 2),\n      round(recall_score(y_true, y_pred), 2),\n      round(f1_score(y_true, y_pred), 2))",
   "options": [
    "0.5 0.67 0.57",
    "0.67 0.5 0.57",
    "0.67 0.5 0.58",
    "0.7 0.5 0.57"
   ],
   "answer": 1,
   "explain": "Counting: TP = 2 (first two rows), FN = 2 (rows 3 and 4 missed), FP = 1 (row 5 is a false alarm). Precision = 2 / (2 + 1) ≈ 0.67, recall = 2 / (2 + 2) = 0.5, and F1 = 2 × 0.67 × 0.5 / (0.67 + 0.5) ≈ 0.57. F1 is the harmonic mean, which leans towards the smaller value; the simple average would be 0.58. (TP = true positive, FN = false negative, FP = false positive.)",
   "difficulty": "hard"
  },
  {
   "id": "l2-metrics-tuning-q09",
   "q": "For a credit-card fraud system, each missed fraud (false negative) costs the bank about ₹5,000 and each false alarm (false positive) costs about ₹100 in support calls. On the same test month, Model A has 20 FN and 500 FP, while Model B has 50 FN and 100 FP. Which model should the bank pick?",
   "code": "",
   "options": [
    "Model B, because it makes fewer mistakes in total",
    "Model B, because it costs ₹1,50,000 vs ₹2,60,000 for A",
    "Either one, because both cost the same",
    "Model A, because it costs ₹1,50,000 vs ₹2,60,000 for B"
   ],
   "answer": 3,
   "explain": "Cost of A = 20 × ₹5,000 + 500 × ₹100 = ₹1,00,000 + ₹50,000 = ₹1,50,000. Cost of B = 50 × ₹5,000 + 100 × ₹100 = ₹2,50,000 + ₹10,000 = ₹2,60,000. B makes fewer mistakes in total (150 vs 520), which is tempting, but its mistakes are the expensive kind; when error costs differ, count rupees, not errors.",
   "difficulty": "hard"
  },
  {
   "id": "l2-metrics-tuning-q10",
   "q": "What does this code print? Each option shows the two printed lines separated by ' / ' (threshold, precision, recall).",
   "code": "import numpy as np\nfrom sklearn.metrics import precision_score, recall_score\n\ny = np.array([1, 1, 1, 0, 0, 0, 0, 0])\np = np.array([0.9, 0.6, 0.35, 0.55, 0.4, 0.2, 0.1, 0.05])\nfor t in [0.5, 0.3]:\n    pred = (p >= t).astype(int)\n    print(t, round(precision_score(y, pred), 2), round(recall_score(y, pred), 2))",
   "options": [
    "0.5 0.67 0.67 / 0.3 0.6 1.0",
    "0.5 0.67 0.67 / 0.3 0.75 1.0",
    "0.5 0.67 0.67 / 0.3 0.6 0.67",
    "0.5 1.0 0.67 / 0.3 0.6 1.0"
   ],
   "answer": 0,
   "explain": "At 0.5 the model flags the scores 0.9, 0.6 and 0.55: two real positives and one false alarm, so precision = 2/3 ≈ 0.67 and recall = 2/3 ≈ 0.67. At 0.3 it also flags 0.4 (another false alarm) and 0.35 (a real positive), so precision = 3/5 = 0.6 and recall = 3/3 = 1.0. 0.75 would be the precision only if 0.4 were not flagged, but 0.4 is above 0.3. Lowering the threshold raised recall and lowered precision, the usual trade-off.",
   "difficulty": "hard"
  }
 ],
 "l2-trees-ensembles": [
  {
   "id": "l2-trees-ensembles-q01",
   "q": "A decision-tree node contains 50 rows, and every one of them is labelled 'will buy'. What is its Gini impurity?",
   "code": "",
   "options": [
    "0.5",
    "0",
    "1",
    "50"
   ],
   "answer": 1,
   "explain": "Gini impurity = 1 - Σ(pᵢ²), where pᵢ is the share of each class in the node. A pure node has p = 1 for one class, so Gini = 1 - 1² = 0, meaning no mixing at all. 0.5 is the maximum for two classes, reached at a 50/50 split.",
   "difficulty": "easy"
  },
  {
   "id": "l2-trees-ensembles-q02",
   "q": "What makes a random forest different from training one big decision tree?",
   "code": "",
   "options": [
    "It trains many trees on bootstrap samples, lets each split consider a random subset of features, and combines their votes or averages",
    "It trains one tree and prunes it heavily",
    "It trains trees one after another, each fixing the previous tree's errors",
    "It replaces the splits with a straight line"
   ],
   "answer": 0,
   "explain": "Random forest = bagging (bootstrap aggregating: each tree learns from a random sample of rows drawn with replacement) plus a random subset of features at each split, so the trees differ from each other and their combined vote is more stable (lower variance). Training trees one after another to fix earlier errors describes boosting, not random forests.",
   "difficulty": "easy"
  },
  {
   "id": "l2-trees-ensembles-q03",
   "q": "In AdaBoost, what happens to the training rows that the current weak model got wrong?",
   "code": "",
   "options": [
    "They are deleted from the dataset",
    "Their weights are increased so the next model focuses on them",
    "Their labels are flipped",
    "Nothing: every round treats all rows equally"
   ],
   "answer": 1,
   "explain": "AdaBoost (adaptive boosting) trains simple models one after another, and after each round it increases the weight of misclassified rows so the next model pays more attention to the hard cases. The final prediction is a weighted vote of all rounds. Deleting the hard rows would throw away exactly the examples the method is designed to learn from.",
   "difficulty": "easy"
  },
  {
   "id": "l2-trees-ensembles-q04",
   "q": "A decision tree with no limits (max_depth=None) gets 100% training accuracy but 71% validation accuracy on a customer-churn dataset. Which change is most likely to improve validation accuracy?",
   "code": "",
   "options": [
    "Train the same unlimited tree again with a different random seed",
    "Pick the final model by its training accuracy",
    "Prune the tree: limit max_depth, raise min_samples_leaf or use ccp_alpha",
    "Add the customer ID column as a feature"
   ],
   "answer": 2,
   "explain": "An unlimited tree keeps splitting until every leaf is pure, which memorises noise (overfitting). Pruning, by limiting depth, requiring a minimum number of rows per leaf, or cost-complexity pruning with ccp_alpha, makes the tree simpler and usually generalises better. Adding an ID column only gives the tree another way to memorise individual customers.",
   "difficulty": "medium"
  },
  {
   "id": "l2-trees-ensembles-q05",
   "q": "A teammate applies StandardScaler to all numeric features before training a random forest. What effect will this usually have on the forest's predictions?",
   "code": "",
   "options": [
    "Almost none, because tree splits depend only on the order of values, which scaling does not change",
    "A big improvement, because trees need scaled data",
    "The forest will fail on negative values",
    "It turns the forest into a linear model"
   ],
   "answer": 0,
   "explain": "A tree asks questions like 'is income > 5 lakh?'; scaling only changes the number in the question (for example 'is scaled income > 0.3?') while the same rows go to each side. So tree-based models do not need scaling, unlike KNN, SVM or regularised linear models, which depend on distances or coefficient sizes.",
   "difficulty": "medium"
  },
  {
   "id": "l2-trees-ensembles-q06",
   "q": "A bank's policy requires it to tell each rejected loan applicant the main reasons for THEIR rejection. The model is gradient boosting. Which tool fits best?",
   "code": "",
   "options": [
    "The model's overall feature_importances_ list",
    "The model's training accuracy",
    "SHAP values, which show how much each feature pushed this one applicant's score up or down",
    "A confusion matrix of the test set"
   ],
   "answer": 2,
   "explain": "SHAP values (SHapley Additive exPlanations, based on a fair-sharing idea from game theory) split a single prediction into per-feature contributions, such as 'high existing EMI lowered the score by 0.25'. feature_importances_ is tempting, but it only says which features matter on average across all customers, not why this particular person was rejected.",
   "difficulty": "medium"
  },
  {
   "id": "l2-trees-ensembles-q07",
   "q": "You are training LightGBM to forecast Diwali-sale demand for an e-commerce site. You reduce learning_rate from 0.3 to 0.03 to get a more careful model. What else should you usually change?",
   "code": "",
   "options": [
    "Reduce the number of trees to 10",
    "Increase the number of trees (n_estimators), ideally with early stopping on a validation set",
    "Remove all categorical features",
    "Nothing, because learning rate and number of trees are unrelated"
   ],
   "answer": 1,
   "explain": "In gradient boosting each new tree adds a correction scaled by the learning rate, so with smaller steps you need more trees to reach the same fit. Early stopping (stop adding trees when validation error stops improving) chooses the number automatically. Cutting the number of trees as well would leave the model badly underfitted.",
   "difficulty": "medium"
  },
  {
   "id": "l2-trees-ensembles-q08",
   "q": "What does this code print?",
   "code": "def gini(counts):\n    n = sum(counts)\n    return 1 - sum((c / n) ** 2 for c in counts)\n\nprint(round(gini([6, 4]), 2), round(gini([10, 0]), 2), round(gini([5, 5]), 2))",
   "options": [
    "0.52 1.0 0.5",
    "0.48 0.0 1.0",
    "0.24 0.0 0.25",
    "0.48 0.0 0.5"
   ],
   "answer": 3,
   "explain": "For [6, 4]: 1 - (0.6² + 0.4²) = 1 - (0.36 + 0.16) = 0.48. The pure node [10, 0] gives 1 - 1 = 0. The 50/50 node [5, 5] gives 1 - (0.25 + 0.25) = 0.5, the maximum Gini for two classes. A 50/50 node has entropy 1.0, which makes '1.0' a tempting mix-up, but Gini tops out at 0.5.",
   "difficulty": "hard"
  },
  {
   "id": "l2-trees-ensembles-q09",
   "q": "A split sends 10 rows (5 yes, 5 no) into a left child (4 yes, 0 no) and a right child (1 yes, 5 no). What information gain does this code print?",
   "code": "import numpy as np\n\ndef entropy(pos, neg):\n    p = np.array([pos, neg]) / (pos + neg)\n    p = p[p > 0]\n    return -(p * np.log2(p)).sum()\n\nparent = entropy(5, 5)\nleft, right = entropy(4, 0), entropy(1, 5)\nchild = (4 / 10) * left + (6 / 10) * right\nprint(round(parent - child, 2))",
   "options": [
    "0.39",
    "1.0",
    "0.0",
    "0.61"
   ],
   "answer": 3,
   "explain": "Entropy measures how mixed a node is, and information gain is how much a split reduces it. The parent is 50/50, so its entropy is 1.0; the left child is pure (0) and the right child has entropy ≈ 0.65, so the weighted child entropy is 0.4 × 0 + 0.6 × 0.65 ≈ 0.39. Gain = 1.0 - 0.39 ≈ 0.61; 0.39 is the entropy left over after the split, not the gain.",
   "difficulty": "hard"
  },
  {
   "id": "l2-trees-ensembles-q10",
   "q": "In a random forest predicting loan default, a randomly assigned 'customer_id' number shows up as the MOST important feature in feature_importances_. What is the best explanation and fix?",
   "code": "",
   "options": [
    "Customer ID truly causes default, so keep it",
    "The forest has too few trees; adding more will correct the importance",
    "Impurity-based importance favours features with many unique values, which trees can use to memorise rows; drop the ID and confirm with permutation importance on validation data",
    "Random forests cannot read numbers above 1,000, so this is a software bug"
   ],
   "answer": 2,
   "explain": "The default feature_importances_ (mean decrease in impurity) is measured on training data and is inflated for high-cardinality features (features with many unique values), because trees can split on them to isolate individual rows. Permutation importance (shuffle one feature on validation data and measure how much the score drops) would show the ID is useless. More trees only make the misleading importance more stable, not more correct.",
   "difficulty": "hard"
  }
 ],
 "l2-unsupervised": [
  {
   "id": "l2-unsupervised-q01",
   "q": "How does agglomerative hierarchical clustering build its clusters?",
   "code": "",
   "options": [
    "It starts with every point as its own cluster and keeps merging the two closest clusters",
    "It picks K random centres and repeatedly moves them to the mean of their points",
    "It labels points using a classifier trained on known groups",
    "It grows clusters from dense regions and calls isolated points noise"
   ],
   "answer": 0,
   "explain": "Agglomerative ('bottom-up') clustering starts with each point alone and keeps merging the closest pair of clusters; the merge history is drawn as a dendrogram (a tree diagram) that you cut at a chosen height to get clusters. Moving K centres to the mean is K-Means, and growing dense regions while marking noise is DBSCAN.",
   "difficulty": "easy"
  },
  {
   "id": "l2-unsupervised-q02",
   "q": "In the elbow method for K-Means, you plot inertia (the total squared distance of points to their nearest centroid) against K. Which K do you usually pick?",
   "code": "",
   "options": [
    "The K with the lowest inertia, which is always the largest K you tried",
    "K = 1, because simpler is better",
    "The K where the curve bends and adding more clusters stops reducing inertia much",
    "The K where inertia is highest"
   ],
   "answer": 2,
   "explain": "Inertia always falls as K grows (with one cluster per point it becomes 0), so 'lowest inertia' just means 'too many clusters'. The elbow, where the curve flattens, is the point of diminishing returns and a good balance between simple and accurate. The silhouette score is a useful second check.",
   "difficulty": "easy"
  },
  {
   "id": "l2-unsupervised-q03",
   "q": "What is PCA (Principal Component Analysis) mainly used for?",
   "code": "",
   "options": [
    "Predicting a label from features",
    "Turning many correlated features into fewer new features that keep most of the variance",
    "Filling in missing values",
    "Encoding categories as numbers"
   ],
   "answer": 1,
   "explain": "PCA finds new axes (principal components) along which the data varies the most, so you can keep the first few and drop the rest with little information lost, which speeds up models and helps visualisation. It is unsupervised: it never looks at a label, so it does not predict anything by itself.",
   "difficulty": "easy"
  },
  {
   "id": "l2-unsupervised-q04",
   "q": "A delivery company has GPS drop points for orders in Bengaluru. The clusters follow winding roads (long, curved shapes), there are scattered odd points, and nobody knows how many clusters there should be. Which algorithm fits best?",
   "code": "",
   "options": [
    "K-Means with K = 5",
    "Linear regression",
    "PCA",
    "DBSCAN"
   ],
   "answer": 3,
   "explain": "DBSCAN (density-based clustering) grows clusters from dense regions, so it can follow curved shapes, does not need K in advance, and marks isolated points as noise (label -1). K-Means needs K and prefers round, similar-sized blobs, so it would chop winding road clusters into pieces.",
   "difficulty": "medium"
  },
  {
   "id": "l2-unsupervised-q05",
   "q": "You cluster shoppers with K-Means using 'annual spend' (₹5,000 to ₹5,00,000) and 'visits per month' (1 to 20). The clusters split almost entirely by spend. Why, and what fixes it?",
   "code": "",
   "options": [
    "K-Means uses distances, so the large rupee values dominate; scale both features first",
    "K-Means cannot use more than one feature",
    "Visits per month is a categorical feature and must be one-hot encoded",
    "K must equal 20 to match the range of visits"
   ],
   "answer": 0,
   "explain": "K-Means assigns points by distance, and a ₹10,000 difference dwarfs a 10-visit difference, so 'visits' barely affects the result. Standardising (or another scaling) puts both features on similar ranges so each contributes. Changing K does nothing about the imbalance between features.",
   "difficulty": "medium"
  },
  {
   "id": "l2-unsupervised-q06",
   "q": "You make a t-SNE plot of 768-dimensional text embeddings (lists of numbers that represent each text) and see three clear groups. Which conclusion is safe?",
   "code": "",
   "options": [
    "The gaps between the groups show exactly how different they are",
    "The 2-D t-SNE coordinates are great input features for a production model",
    "The plot proves there are exactly three classes in the data",
    "Points close together on the plot were likely close in the original space, but group sizes and gaps can be misleading"
   ],
   "answer": 3,
   "explain": "t-SNE and UMAP are mainly visualisation tools that try to keep nearby points nearby, so local neighbourhoods are meaningful. Cluster sizes and the gaps between clusters are distorted and change with settings such as perplexity (roughly, how many neighbours each point considers). Reading the gaps as real distances is the most common misreading.",
   "difficulty": "medium"
  },
  {
   "id": "l2-unsupervised-q07",
   "q": "An e-commerce site scores customers using RFM: Recency (days since last purchase), Frequency (number of orders) and Monetary (total spend). Which customer is best described as 'at risk', a valuable customer who may be leaving?",
   "code": "",
   "options": [
    "Last purchase 3 days ago, 40 orders, ₹90,000 spent",
    "Last purchase 5 days ago, 1 order, ₹500 spent",
    "Last purchase 200 days ago, 35 orders, ₹80,000 spent",
    "Last purchase 300 days ago, 1 order, ₹300 spent"
   ],
   "answer": 2,
   "explain": "'At risk' means high frequency and high spend in the past but poor recency: this customer used to buy a lot but has not returned for 200 days, so a win-back offer makes sense. The 300-day, single-order customer has also gone quiet, but was never valuable, so they are 'lost / low value' rather than 'at risk'.",
   "difficulty": "medium"
  },
  {
   "id": "l2-unsupervised-q08",
   "q": "A PCA on a customer dataset gives these explained variance ratios. What does this code print, i.e. the minimum number of components needed to keep at least 90% of the variance?",
   "code": "import numpy as np\n\nratios = np.array([0.55, 0.25, 0.12, 0.05, 0.03])  # explained_variance_ratio_\nprint(np.argmax(np.cumsum(ratios) >= 0.90) + 1)",
   "options": [
    "2",
    "3",
    "4",
    "5"
   ],
   "answer": 1,
   "explain": "The running totals from np.cumsum are 0.55, 0.80, 0.92, 0.97 and 1.00. The first total that reaches 0.90 is at index 2 (Python counts from 0), and the code adds 1 to turn that index into a count, giving 3 components. Answering 2 is the off-by-one mistake of forgetting the +1 (or of stopping at 0.80, which is below 90%).",
   "difficulty": "hard"
  },
  {
   "id": "l2-unsupervised-q09",
   "q": "This is the first K-Means iteration on 1-D data (assign each point to its nearest centroid, then move each centroid to the mean of its points). What does the code print?",
   "code": "import numpy as np\n\nx = np.array([1, 2, 3, 10, 11, 12])\nc = np.array([2.0, 3.0])                       # starting centroids\nlabels = np.argmin(np.abs(x[:, None] - c[None, :]), axis=1)\nprint(labels, x[labels == 0].mean(), x[labels == 1].mean())",
   "options": [
    "[0 0 0 1 1 1] 2.0 11.0",
    "[0 1 1 1 1 1] 1.0 7.6",
    "[0 0 1 1 1 1] 2.0 3.0",
    "[0 0 1 1 1 1] 1.5 9.0"
   ],
   "answer": 3,
   "explain": "Assignment step: 1 and 2 are nearest to centroid 2.0, while 3 sits exactly on centroid 3.0, and 10, 11 and 12 are also closer to 3.0 than to 2.0. Update step: the new centroids are (1 + 2) / 2 = 1.5 and (3 + 10 + 11 + 12) / 4 = 9.0. The 'natural' split [0 0 0 1 1 1] is where K-Means ends up after more iterations, not after this first one.",
   "difficulty": "hard"
  },
  {
   "id": "l2-unsupervised-q10",
   "q": "Ravi flags a UPI transaction as an anomaly if its z-score (distance from the mean, measured in standard deviations) is above 3. What does this code print, and what went wrong?",
   "code": "import numpy as np\n\namt = np.array([500, 520, 480, 510, 495, 505, 5000])   # ₹ per transaction\nz = (amt - amt.mean()) / amt.std()\nprint(round(z[-1], 2), (np.abs(z) > 3).sum())",
   "options": [
    "8.2 1 : the ₹5,000 transaction is correctly flagged",
    "2.45 1 : it is flagged because 2.45 rounds up to 3",
    "2.45 0 : not flagged, because the outlier itself inflates the mean and standard deviation; a robust method (median/IQR or Isolation Forest) works better",
    "0.0 0 : z-scores are always zero for small datasets"
   ],
   "answer": 2,
   "explain": "The ₹5,000 value drags the mean up to about ₹1,144 and inflates the standard deviation to about ₹1,574, so its own z-score is only 2.45 and nothing crosses 3 (count 0). With very few points, a single outlier can never reach a high z-score. Methods based on the median and IQR (interquartile range: the spread of the middle 50% of the data), or Isolation Forest, are not fooled this way.",
   "difficulty": "hard"
  }
 ],
 "l2-feature-eng": [
  {
   "id": "l2-feature-eng-q01",
   "q": "A 'city' column has the values Delhi, Mumbai and Chennai, and you are training linear regression. Why is one-hot encoding usually better than mapping them to 0, 1 and 2?",
   "code": "",
   "options": [
    "One-hot encoding makes the dataset smaller",
    "Mapping to 0, 1, 2 invents an order (as if Chennai = 2 × Mumbai) that the model will wrongly use",
    "Linear models cannot read numbers",
    "pandas does not allow mapping text to numbers"
   ],
   "answer": 1,
   "explain": "Cities have no natural order, but numbers do, so a linear model would treat Chennai (2) as 'twice' Mumbai (1). One-hot encoding creates one 0/1 column per city (city_Delhi, city_Mumbai, city_Chennai), so no fake order exists. One-hot actually makes the data wider, not smaller.",
   "difficulty": "easy"
  },
  {
   "id": "l2-feature-eng-q02",
   "q": "Which column is the best candidate for ordinal encoding (mapping categories to ordered numbers such as 0, 1, 2, 3)?",
   "code": "",
   "options": [
    "Customer's state (Kerala, Punjab, Assam, ...)",
    "Payment method (UPI, card, cash)",
    "Favourite IPL team",
    "Education level (10th, 12th, Graduate, Post-graduate)"
   ],
   "answer": 3,
   "explain": "Ordinal encoding suits categories with a real order, and education levels go from lower to higher, so 0 < 1 < 2 < 3 carries true meaning. States, payment methods and teams have no natural order, so ordered numbers would invent one; use one-hot (or another nominal encoding) for those.",
   "difficulty": "easy"
  },
  {
   "id": "l2-feature-eng-q03",
   "q": "When forecasting a kirana store's daily milk sales, what is a 'lag-1' feature?",
   "code": "",
   "options": [
    "Yesterday's sales, used as a feature to predict today's sales",
    "Today's sales minus the yearly average",
    "The average sales over the whole year",
    "The delay in delivering milk to the store"
   ],
   "answer": 0,
   "explain": "A lag feature is a past value of the series placed alongside the current row: lag-1 is the previous day's value and lag-7 is the value from the same weekday last week. It lets ordinary ML models use recent history. A whole-year average would include future days, which you would not know at prediction time.",
   "difficulty": "easy"
  },
  {
   "id": "l2-feature-eng-q04",
   "q": "Why should scaling and imputation (filling missing values) be put inside a scikit-learn Pipeline before calling cross_val_score?",
   "code": "",
   "options": [
    "Pipelines make the model more accurate on the training data",
    "Every scikit-learn model refuses to run without a Pipeline",
    "So that preprocessing is learned only from the training folds in each round, avoiding leakage, and the same steps are reused at prediction time",
    "Pipelines automatically choose the best algorithm"
   ],
   "answer": 2,
   "explain": "When the whole Pipeline is passed to cross-validation, the scaler and imputer are re-fitted on the training folds every time, so the validation fold stays truly unseen. If you scale the full dataset first, the validation rows' mean and spread leak into training. Pipelines do not choose algorithms for you; they just chain the steps reliably.",
   "difficulty": "medium"
  },
  {
   "id": "l2-feature-eng-q05",
   "q": "Your DataFrame has numeric columns (income, age) and categorical columns (city, occupation). You want StandardScaler on the numeric ones and OneHotEncoder on the categorical ones in a single step. What should you use?",
   "code": "",
   "options": [
    "ColumnTransformer",
    "One StandardScaler on all columns",
    "pd.get_dummies on the numeric columns",
    "KMeans"
   ],
   "answer": 0,
   "explain": "ColumnTransformer applies different transformers to different groups of columns and joins the results side by side, and it can sit inside a Pipeline with the model. A single StandardScaler would fail on text columns like city, and one-hot encoding numeric columns would explode them into one column per unique value.",
   "difficulty": "medium"
  },
  {
   "id": "l2-feature-eng-q06",
   "q": "You have 2,000 rows and 800 features. A teammate picks the 30 features most correlated with the target using ALL 2,000 rows, then runs 5-fold cross-validation on those 30 features and reports a great score. What is the problem?",
   "code": "",
   "options": [
    "30 features is too many for 2,000 rows",
    "Correlation can only be computed for numeric targets",
    "Nothing; this is the standard approach",
    "The selection step already saw the validation rows' labels, so the CV score is over-optimistic; selection should happen inside a Pipeline within each fold"
   ],
   "answer": 3,
   "explain": "Choosing features using every row's label is data leakage: some features were picked partly because they happen to fit the validation rows. Putting the selector (for example SelectKBest) inside a Pipeline makes each fold choose features from its own training part only. 'Select first, then cross-validate' looks standard, which is exactly why it is such a well-known trap.",
   "difficulty": "medium"
  },
  {
   "id": "l2-feature-eng-q07",
   "q": "In a Kaggle competition, you keep tweaking your model to climb the public leaderboard. When the private leaderboard is revealed, you drop 300 places. What lesson does this teach?",
   "code": "",
   "options": [
    "Always submit the model with the best public leaderboard score",
    "Trust a solid local cross-validation score; the public leaderboard is a small sample that you can overfit by tuning to it",
    "The private leaderboard is random",
    "Use fewer features in every competition"
   ],
   "answer": 1,
   "explain": "The public leaderboard is scored on a small part of the test data, so many small tweaks that 'win' there may just fit its noise, which is overfitting to the leaderboard. A careful local cross-validation that mirrors the competition's split is a more reliable guide ('trust your CV'). The private leaderboard is not random; it simply exposes that overfitting.",
   "difficulty": "medium"
  },
  {
   "id": "l2-feature-eng-q08",
   "q": "You want a 'previous 2-day average sales' feature that never peeks at the current day. What does this code print?",
   "code": "import pandas as pd\n\ns = pd.Series([10, 20, 30, 40, 50])     # daily sales\nprint(s.shift(1).rolling(2).mean().tolist())",
   "options": [
    "[nan, 15.0, 25.0, 35.0, 45.0]",
    "[15.0, 25.0, 35.0, 45.0, nan]",
    "[nan, nan, 15.0, 25.0, 35.0]",
    "[nan, nan, 20.0, 30.0, 40.0]"
   ],
   "answer": 2,
   "explain": "shift(1) moves every value down one row, giving [nan, 10, 20, 30, 40], and rolling(2).mean() then averages each value with the one before it: nan for the first two rows, then 15, 25, 35. So the day with sales 30 gets 15, the average of the two days before it. Without shift(1) you would get [nan, 15, 25, 35, 45], where each row's feature includes that day's own sales, which is leakage.",
   "difficulty": "hard"
  },
  {
   "id": "l2-feature-eng-q09",
   "q": "What shape does this code print?",
   "code": "import pandas as pd\nfrom sklearn.compose import ColumnTransformer\nfrom sklearn.preprocessing import OneHotEncoder, StandardScaler\n\ndf = pd.DataFrame({\"city\": [\"Pune\", \"Delhi\", \"Pune\", \"Agra\"],\n                   \"income\": [30, 50, 40, 60],\n                   \"age\": [25, 32, 41, 29]})\nct = ColumnTransformer([(\"num\", StandardScaler(), [\"income\", \"age\"]),\n                        (\"cat\", OneHotEncoder(), [\"city\"])])\nprint(ct.fit_transform(df).shape)",
   "options": [
    "(4, 3)",
    "(4, 5)",
    "(4, 6)",
    "(5, 4)"
   ],
   "answer": 1,
   "explain": "The two numeric columns stay as 2 scaled columns, and OneHotEncoder turns 'city' into one column per unique city (Agra, Delhi, Pune), which is 3 columns. So the output has 4 rows and 2 + 3 = 5 columns. The tempting (4, 6) comes from counting all 4 city values instead of the 3 unique ones.",
   "difficulty": "hard"
  },
  {
   "id": "l2-feature-eng-q10",
   "q": "A model was trained on pd.get_dummies(train). At prediction time, a teammate runs pd.get_dummies(test) and feeds the result to the model. Look at what this code prints. What is the bug?",
   "code": "import pandas as pd\n\ntrain = pd.DataFrame({\"city\": [\"Pune\", \"Delhi\", \"Agra\"]})\ntest = pd.DataFrame({\"city\": [\"Pune\", \"Surat\"]})\nprint(list(pd.get_dummies(train).columns))\nprint(list(pd.get_dummies(test).columns))",
   "options": [
    "Both lines print the same 3 columns, so nothing is wrong",
    "The second line raises an error because 'Surat' was never seen in training",
    "Both lines print ['city'] because get_dummies only changes numeric columns",
    "The columns differ (test lacks Agra and Delhi and adds Surat), so the model receives misaligned inputs"
   ],
   "answer": 3,
   "explain": "get_dummies only creates columns for the values it sees, so train gives city_Agra, city_Delhi, city_Pune while test gives city_Pune, city_Surat; no error is raised, which makes this bug silent and dangerous. The fix is to fit a OneHotEncoder(handle_unknown='ignore') on the training data (ideally inside a Pipeline) and reuse that same fitted encoder on new data, so the columns always match.",
   "difficulty": "hard"
  }
 ],
 "test-l2": [
  {
   "id": "test-l2-q01",
   "q": "A Bengaluru quick-commerce startup wants to predict whether an order will be delivered late (yes/no). It has 1 lakh past orders, and 8% of them were late. Which setup is most appropriate?",
   "code": "",
   "options": [
    "Linear regression on the yes/no column, judged by R²",
    "A classifier with a stratified train/validation/test split, judged by precision, recall and PR-AUC for the 'late' class",
    "K-Means with K = 2, judged by inertia",
    "A classifier judged only by accuracy, since 92% is an easy target to beat"
   ],
   "answer": 1,
   "explain": "This is binary classification with an imbalanced target (8% late). A stratified split keeps the 8% share in every part, and precision, recall and PR-AUC show how well 'late' orders are caught. Accuracy is the trap: a model that always says 'on time' already scores 92% while catching zero late orders.",
   "difficulty": "medium"
  },
  {
   "id": "test-l2-q02",
   "q": "Only the first column truly affects y. What does this code print? (the number of coefficients that are exactly zero, then the first coefficient rounded to 1 decimal)",
   "code": "import numpy as np\nfrom sklearn.linear_model import Lasso\n\nrng = np.random.default_rng(0)\nX = rng.normal(size=(100, 3))\ny = 4 * X[:, 0] + rng.normal(scale=0.1, size=100)   # only column 0 matters\nm = Lasso(alpha=0.5).fit(X, y)\nprint((m.coef_ == 0).sum(), round(m.coef_[0], 1))",
   "options": [
    "0 4.0",
    "3 0.0",
    "2 4.0",
    "2 3.6"
   ],
   "answer": 3,
   "explain": "Lasso's L1 penalty sets the two useless noise columns' coefficients to exactly 0, which is automatic feature selection. It also shrinks the useful coefficient somewhat below its true value of 4, to about 3.6; that shrinkage is the price of regularisation. Expecting exactly 4.0 forgets this shrinkage, and expecting 3 zeros forgets that alpha = 0.5 is not strong enough to wipe out a genuinely strong feature.",
   "difficulty": "hard"
  },
  {
   "id": "test-l2-q03",
   "q": "A telecom company's churn model shows 99% validation accuracy. One feature is 'number of days since the SIM was deactivated'. What should you do before deployment?",
   "code": "",
   "options": [
    "Remove that feature: it is only known after a customer has already left, so it leaks the answer",
    "Deploy it: 99% validation accuracy proves the model generalises",
    "Keep the feature but standardise it so it does not dominate",
    "Run 10-fold cross-validation to confirm the 99%, then deploy"
   ],
   "answer": 0,
   "explain": "'Days since SIM deactivated' exists only after a customer has churned, so it is target leakage; while the customer is still active (when you need the prediction) the value is not available, and real accuracy will crash. Re-checking with 10-fold cross-validation is tempting, but it would also show about 99% because every fold contains the same leaked feature. Scaling changes units, not the leak.",
   "difficulty": "medium"
  },
  {
   "id": "test-l2-q04",
   "q": "A Mumbai insurance company flags suspicious claims. A missed fraud costs ₹20,000 and checking a genuine claim costs ₹500. On validation data: threshold 0.5 gives 30 missed frauds and 200 false alarms; threshold 0.3 gives 10 missed and 900 false alarms; threshold 0.2 gives 5 missed and 2,000 false alarms. Which threshold has the lowest total cost?",
   "code": "",
   "options": [
    "0.5",
    "0.2",
    "0.3",
    "0.5 and 0.3 cost the same"
   ],
   "answer": 2,
   "explain": "Total cost = missed frauds × ₹20,000 + false alarms × ₹500. Threshold 0.5: ₹6,00,000 + ₹1,00,000 = ₹7,00,000. Threshold 0.3: ₹2,00,000 + ₹4,50,000 = ₹6,50,000. Threshold 0.2: ₹1,00,000 + ₹10,00,000 = ₹11,00,000, so the lowest threshold catches the most fraud but its flood of false alarms makes it the most expensive.",
   "difficulty": "hard"
  },
  {
   "id": "test-l2-q05",
   "q": "The labels y are pure coin flips, so there is NO real pattern to learn. The code prints two cross-validation accuracies, a and b. What do you see, and why?",
   "code": "import numpy as np\nfrom sklearn.feature_selection import SelectKBest\nfrom sklearn.linear_model import LogisticRegression\nfrom sklearn.model_selection import cross_val_score\nfrom sklearn.pipeline import make_pipeline\n\nrng = np.random.default_rng(0)\nX = rng.normal(size=(100, 5000))\ny = rng.integers(0, 2, size=100)         # labels are pure coin flips\n\nX_sel = SelectKBest(k=20).fit_transform(X, y)\na = cross_val_score(LogisticRegression(), X_sel, y, cv=5).mean()\npipe = make_pipeline(SelectKBest(k=20), LogisticRegression())\nb = cross_val_score(pipe, X, y, cv=5).mean()\nprint(round(a, 2), round(b, 2))",
   "options": [
    "a ≈ 0.85 and b ≈ 0.48: a is inflated because SelectKBest saw every label before cross-validation; b is the honest score",
    "Both near 0.5, because the labels are random",
    "a ≈ 0.48 and b ≈ 0.85, because the Pipeline overfits",
    "Both near 0.85, because 5,000 features can learn anything"
   ],
   "answer": 0,
   "explain": "For a, SelectKBest picked the 20 columns (out of 5,000 random ones) that best matched all 100 labels, including the labels of rows later used for validation, so cross-validation scores about 0.85 on pure noise. For b, the selector sits inside the Pipeline and is re-fitted on each training fold, so validation rows stay unseen and the score is about 0.48, coin-flip level, which is the truth. 'Both near 0.5' is what should happen, and it is exactly the leak that stops a from doing so.",
   "difficulty": "hard"
  },
  {
   "id": "test-l2-q06",
   "q": "A Chennai NBFC (non-banking finance company) has 50,000 loan records with 40 mixed numeric and categorical columns and some missing values. It wants the most accurate default-risk model it can get from this tabular data. Which is the strongest first choice to try?",
   "code": "",
   "options": [
    "K-Nearest Neighbours on unscaled data",
    "Gaussian Naive Bayes",
    "A single unpruned decision tree",
    "Gradient-boosted trees such as XGBoost, LightGBM or CatBoost"
   ],
   "answer": 3,
   "explain": "Gradient-boosted trees are usually the top performers on tabular data: they capture non-linear patterns and feature interactions, need no scaling, and these libraries handle missing values natively (some also handle categorical columns directly). A single unpruned tree overfits badly, and KNN on unscaled mixed features would be dominated by whichever columns have the largest numbers.",
   "difficulty": "medium"
  },
  {
   "id": "test-l2-q07",
   "q": "Your model's learning curve shows training error staying low (about 5%) while validation error is high (about 25%), and the gap slowly narrows as you add more training rows. What does this suggest?",
   "code": "",
   "options": [
    "High bias: switch to a more complex model",
    "Data leakage: validation error should always equal training error",
    "High variance (overfitting): more data, regularisation or a simpler model should help",
    "Nothing needs changing: a 20-point gap is normal and harmless"
   ],
   "answer": 2,
   "explain": "A large gap between low training error and high validation error is the signature of high variance (overfitting), and a gap that shrinks as rows are added shows that extra data is helping. Regularisation or a simpler model attack the same problem. High bias would show both errors high and close together; making the model more complex here would widen the gap.",
   "difficulty": "hard"
  },
  {
   "id": "test-l2-q08",
   "q": "A Jaipur handicrafts e-store wants to group its 20,000 customers for a Diwali campaign. There are no labels. Which plan is most sensible?",
   "code": "",
   "options": [
    "Build RFM features (recency, frequency, monetary), scale them, run K-Means, and choose K using the elbow method and silhouette score",
    "Train logistic regression to predict each customer's segment",
    "Run K-Means using the customer ID as the only feature",
    "Run PCA and treat each principal component as one customer segment"
   ],
   "answer": 0,
   "explain": "Without labels this is an unsupervised problem. RFM features capture buying behaviour, scaling stops the rupee column from dominating distances, and the elbow method plus the silhouette score (how well each point fits its own cluster compared with the next-nearest one) help choose K. Logistic regression needs known segment labels to learn from, which the store does not have.",
   "difficulty": "medium"
  },
  {
   "id": "test-l2-q09",
   "q": "A colleague runs PCA on raw (unscaled) income and age. What does this code print, and what went wrong?",
   "code": "import numpy as np\nfrom sklearn.decomposition import PCA\n\nrng = np.random.default_rng(1)\nincome = rng.normal(800000, 200000, 200)   # ₹ per year\nage = rng.normal(35, 10, 200)              # years\nX = np.column_stack([income, age])\nprint(PCA().fit(X).explained_variance_ratio_.round(3))",
   "options": [
    "[0.5 0.5] : both features matter equally",
    "[0. 1.] : age dominates because its numbers are smaller",
    "[0.8 0.2] : PCA worked correctly on the raw data",
    "[1. 0.] : the first component is almost entirely income only because its numbers are huge; standardise features before PCA"
   ],
   "answer": 3,
   "explain": "PCA looks for the directions of greatest variance, and income varies by lakhs of rupees while age varies by tens of years, so income's variance is hundreds of millions of times larger and the first component is basically 'income'. That says nothing about which feature is more useful; it is just a units effect. Standardising (mean 0, standard deviation 1) gives each feature a fair chance.",
   "difficulty": "hard"
  },
  {
   "id": "test-l2-q10",
   "q": "A fraud model flagged 200 transactions, and 150 of them were real fraud. In total, there were 250 real frauds in the data. What are its precision, recall and F1?",
   "code": "",
   "options": [
    "Precision 0.60, recall 0.75, F1 0.67",
    "Precision 0.75, recall 0.60, F1 0.67",
    "Precision 0.75, recall 0.60, F1 0.68",
    "Precision 0.75, recall 0.80, F1 0.77"
   ],
   "answer": 1,
   "explain": "Precision = real frauds among those flagged = 150 / 200 = 0.75. Recall = frauds caught among all frauds = 150 / 250 = 0.60. F1 = 2 × 0.75 × 0.60 / (0.75 + 0.60) = 0.90 / 1.35 ≈ 0.67; 0.68 is the simple average of precision and recall, but F1 uses the harmonic mean, which sits closer to the weaker of the two.",
   "difficulty": "hard"
  },
  {
   "id": "test-l2-q11",
   "q": "You are forecasting daily onion prices at a Nashik mandi using lag and rolling features. How should you cross-validate the model?",
   "code": "",
   "options": [
    "Shuffled KFold, so every fold has a mix of all seasons",
    "Hold out a random 20% of days",
    "TimeSeriesSplit: each fold trains on earlier days and validates on the days right after",
    "StratifiedKFold on the price column"
   ],
   "answer": 2,
   "explain": "TimeSeriesSplit always validates on data that comes after the training data, exactly as in real forecasting. Shuffled KFold is tempting because it 'mixes seasons', but it lets the model learn from future days (and from lag features that overlap the validation days), which inflates the score. Stratification is meant for class labels, not a continuous price.",
   "difficulty": "medium"
  },
  {
   "id": "test-l2-q12",
   "q": "You need a feature to predict today's sales (the last row, 11). What does this code print, and which value is safe to use as the feature?",
   "code": "import pandas as pd\n\nsales = pd.Series([5, 7, 9, 11])   # today's sales = 11 (last row)\na = sales.rolling(3).mean().iloc[-1]\nb = sales.shift(1).rolling(3).mean().iloc[-1]\nprint(a, b)",
   "options": [
    "Prints 9.0 7.0; use b (7.0), because a includes today's own sales, which you won't know when predicting",
    "Prints 9.0 7.0; use a (9.0), because it is the more recent average",
    "Prints 7.0 9.0; use b (9.0), the shifted one",
    "Prints 9.0 9.0; shifting makes no difference"
   ],
   "answer": 0,
   "explain": "a = mean(7, 9, 11) = 9.0 includes today's value 11, so using it to predict today's sales leaks the answer. b shifts first, so it is mean(5, 7, 9) = 7.0, built only from the three previous days, which you would actually know in the morning. Choosing a because it is 'more recent' is exactly how rolling-feature leakage sneaks into projects.",
   "difficulty": "hard"
  },
  {
   "id": "test-l2-q13",
   "q": "You predict wheat yield from 200 features, including groups of highly correlated ones (for example rainfall readings from 10 nearby stations). You want shrinkage plus some feature selection, without Lasso's habit of keeping one feature from a correlated group almost at random. Which model fits best?",
   "code": "",
   "options": [
    "Plain linear regression",
    "Ridge",
    "Lasso",
    "ElasticNet"
   ],
   "answer": 3,
   "explain": "ElasticNet mixes the L1 penalty (which can zero out features) with the L2 penalty (which spreads weight across correlated features), so it can select features while keeping correlated groups together. Lasso is the tempting choice for 'feature selection', but with correlated features it tends to keep one and drop the rest somewhat arbitrarily. Ridge shrinks but never removes features.",
   "difficulty": "medium"
  },
  {
   "id": "test-l2-q14",
   "q": "You have 50 million rows of UPI transactions that do not fit in memory, and you want to train a linear model with gradient descent. Which approach is the practical choice?",
   "code": "",
   "options": [
    "Mini-batch gradient descent: read chunks of rows and update the weights after each chunk",
    "Batch gradient descent over all 50 million rows for every single step",
    "The normal equation on the full data matrix",
    "Train on the first 10,000 rows only, because more data never helps a linear model"
   ],
   "answer": 0,
   "explain": "Mini-batch gradient descent only needs one chunk in memory at a time and updates the weights many times per pass, so it scales to huge data (scikit-learn's SGDRegressor and SGDClassifier support this through partial_fit). Batch gradient descent and the normal equation both need the whole dataset for every calculation, which is exactly what does not fit. Throwing away most of the data wastes useful information.",
   "difficulty": "medium"
  },
  {
   "id": "test-l2-q15",
   "q": "Predict the output: 1-NN without scaling, then 1-NN with StandardScaler, for a 56-year-old earning ₹3,01,000.",
   "code": "from sklearn.neighbors import KNeighborsClassifier\nfrom sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler\n\nX = [[25, 300000], [27, 320000], [55, 310000], [58, 900000]]  # [age, income ₹]\ny = [\"young\", \"young\", \"senior\", \"senior\"]\nnew = [[56, 301000]]\nraw = KNeighborsClassifier(n_neighbors=1).fit(X, y)\nscaled = make_pipeline(StandardScaler(), KNeighborsClassifier(n_neighbors=1)).fit(X, y)\nprint(raw.predict(new)[0], scaled.predict(new)[0])",
   "options": [
    "senior senior",
    "young senior",
    "young young",
    "senior young"
   ],
   "answer": 1,
   "explain": "Without scaling, distance is dominated by income: the new customer's ₹3,01,000 is only ₹1,000 away from the 25-year-old's ₹3,00,000, so the nearest neighbour is 'young' despite a 31-year age gap. After StandardScaler, age and income count fairly, and the 55-year-old earning ₹3,10,000 becomes the nearest neighbour, giving 'senior'. Same data and same algorithm; only scaling changed the answer.",
   "difficulty": "hard"
  },
  {
   "id": "test-l2-q16",
   "q": "Which statement about adding more trees is correct?",
   "code": "",
   "options": [
    "Adding more trees to a random forest steadily causes overfitting, so keep it under 50",
    "More trees help both random forests and gradient boosting forever, with no risk",
    "In a random forest, more trees mostly just stabilise the averaged prediction, while in gradient boosting too many rounds can overfit, so use early stopping",
    "The number of trees has no effect in either method"
   ],
   "answer": 2,
   "explain": "A random forest averages independently grown trees, so adding more reduces variance until the score plateaus; the main cost is compute time. Gradient boosting adds trees that keep correcting the remaining errors, so after a point they start fitting noise, and early stopping on a validation set picks the right number. The belief that 'more trees overfit' is true for boosting, not for random forests.",
   "difficulty": "hard"
  },
  {
   "id": "test-l2-q17",
   "q": "A team tried 200 hyperparameter combinations and picked the one with the best score on the TEST set, reporting 94% accuracy. In production the model gets 86%. What went wrong?",
   "code": "",
   "options": [
    "200 combinations is too few",
    "The test set was used for model selection, so it was no longer unseen and 94% was over-optimistic; tune with a validation set or cross-validation and use the test set once at the end",
    "Production data is always about 8% worse",
    "They should have chosen by training-set accuracy instead"
   ],
   "answer": 1,
   "explain": "Every time you choose based on the test score, a little information about the test set leaks into your decisions, and after 200 tries the 'winner' is partly just lucky on those particular rows. Hyperparameters should be chosen with a validation set or cross-validation (for example GridSearchCV on the training data), keeping the test set for one final, honest check. Choosing by training accuracy would be even more optimistic.",
   "difficulty": "medium"
  },
  {
   "id": "test-l2-q18",
   "q": "What does this code print, and how should you read it?",
   "code": "import numpy as np\nfrom sklearn.cluster import DBSCAN\n\nX = np.array([[1.0], [1.2], [1.4], [5.0], [5.1], [5.3], [12.0]])\nprint(DBSCAN(eps=0.5, min_samples=2).fit(X).labels_)",
   "options": [
    "[0 0 0 1 1 1 2] : three clusters",
    "[ 0  0  0  1  1  1 -1] : two clusters, and 12.0 is labelled noise (a possible anomaly)",
    "[0 0 0 0 0 0 0] : everything is one cluster",
    "[-1 -1 -1 -1 -1 -1 -1] : eps is too small for any cluster"
   ],
   "answer": 1,
   "explain": "With eps = 0.5, the points 1.0, 1.2 and 1.4 are within reach of each other and form cluster 0, and 5.0, 5.1 and 5.3 form cluster 1. The point 12.0 has no other point within 0.5, so it cannot reach min_samples = 2 (which counts the point itself) and gets the special label -1, meaning noise. Expecting 12.0 to form a third cluster of its own is the common mistake.",
   "difficulty": "hard"
  },
  {
   "id": "test-l2-q19",
   "q": "A customer-support system in Hyderabad sorts complaints into 6 categories. Two categories (fraud reports and legal notices) are rare but very important. Which single score best reflects performance on ALL categories equally?",
   "code": "",
   "options": [
    "Overall accuracy",
    "Micro-averaged precision",
    "Macro-averaged F1 (each class's F1 averaged with equal weight)",
    "Training-set accuracy"
   ],
   "answer": 2,
   "explain": "Macro F1 computes F1 separately for each class and then averages them with equal weight, so doing badly on the rare fraud class clearly pulls the score down. Overall accuracy, and micro-averaging (which pools all predictions together), are dominated by the big classes, so a model could ignore the rare ones and still look good.",
   "difficulty": "medium"
  },
  {
   "id": "test-l2-q20",
   "q": "An SVM with an RBF kernel and gamma = 100 gets 100% training accuracy but 58% validation accuracy on a medical dataset. Which change is most likely to help?",
   "code": "",
   "options": [
    "Increase gamma to 1,000 so it fits even better",
    "Switch off feature scaling",
    "Evaluate on the training set instead",
    "Decrease gamma (and possibly C) so the decision boundary becomes smoother"
   ],
   "answer": 3,
   "explain": "gamma controls how far each training point's influence reaches in an RBF kernel: a very high gamma gives each point a tiny island of influence, so the boundary wraps tightly around individual points (overfitting). Lowering gamma, and lowering C (which sets how strongly training mistakes are penalised), gives a smoother, more general boundary. Increasing gamma would make the overfitting worse.",
   "difficulty": "hard"
  }
 ]
};
