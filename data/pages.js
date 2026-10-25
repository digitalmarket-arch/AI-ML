/* AI Marg data file. This is JavaScript holding JSON: keep the quotes and commas valid.
   See README.md > "Editing the course" before changing it. */
window.AIM = window.AIM || {};
window.AIM.pages = {
 "start": {
  "title": "Start here",
  "sections": [
   {
    "heading": "What AI Marg is",
    "paragraphs": [
     "AI Marg is a free, self-paced course that takes you from zero to building real AI systems. It does not host its own videos. It links to strong free lessons already made by teachers such as CampusX, Krish Naik, NPTEL and the IITs, StatQuest and Andrej Karpathy. Then it adds what those videos lack: a clear order, practice, quizzes, projects and Indian examples.",
     "The course has four levels, named in Sanskrit. Each level has 6 or 7 modules (a module is one topic, such as 'Python from Zero'), a set of projects and a 20-question level test. The hours below are for module study only; projects add more. Two optional Grand Capstones at the end combine skills from several levels."
    ],
    "bullets": [
     "**Level 1 · Ārambha (Beginning): Foundations.** What AI is, Python, your tools, statistics, maths intuition, data handling and SQL. About 95 hours.",
     "**Level 2 · Abhyāsa (Practice): Core Machine Learning.** How models learn, regression, classification, evaluation, decision trees and ensembles, clustering and feature engineering. About 105 hours.",
     "**Level 3 · Prāvīṇya (Proficiency): Deep Learning & Deployment.** Neural networks, PyTorch, computer vision, NLP (natural language processing: working with text), transformers, and putting models online (MLOps). About 120 hours.",
     "**Level 4 · Naipuṇya (Mastery): Generative AI, LLMs, Agents & Research.** How LLMs (large language models, like the ones behind ChatGPT) work, building LLM apps and RAG, fine-tuning, agents, image generation, reinforcement learning and research skills. About 145 hours."
    ]
   },
   {
    "heading": "How to use the site",
    "paragraphs": [
     "Go level by level. Inside a level, go module by module. Do not skip the practice and quiz steps: that is where the learning sticks."
    ],
    "bullets": [
     "**1. Open a level** from the [Roadmap](#roadmap) and read its short introduction and outcomes.",
     "**2. Do its modules in order.** Each module page has up to six tabs. **Overview** says what you will learn and why. **Watch & read** has the chosen free lessons. **Lab** (in many modules) is an interactive picture you can play with. **Practice** has small Python exercises that run in your browser, with no install. **Quiz** has 10 questions with a 70% pass mark. **My notes** is for your own notes.",
     "**3. In Watch & read, start with the Best pick.** It is the strongest free video for the module, whether it is in Hindi, Hinglish or Indian English. Other options sit below it; the ones marked Recommended are good alternatives if a teacher does not suit you.",
     "**4. Build the level's projects** from the [Projects](#projects) page. Projects turn knowledge into skill, and they become your portfolio (the work you show employers or clients).",
     "**5. Take the level test** on the [Tests](#tests) page: 20 questions from the whole level, an optional 30-minute timer, pass mark 70%. If you score less, revise the modules where you lost marks and retake it after a few days.",
     "**6. Move to the next level.**",
     "Your progress, quiz scores and notes are saved in this browser. To keep them safe and use them on another device, press **Sign in** at the top right (when you see it) and sign in with Google. Without signing in, open [My progress](#progress) every week or two and press **Download file**, so you do not lose them if you clear your browser or change device."
    ]
   },
   {
    "heading": "The 5-step learning loop",
    "paragraphs": [
     "Use the same loop for every module. Watching alone feels like learning, but most of it is forgotten within days. The loop makes you use what you watch."
    ],
    "bullets": [
     "**1. Watch actively.** Watch one lesson at a time. Pause every few minutes and guess what comes next. Afterwards, write 3 lines in My notes: what it was, one example, and one question you still have.",
     "**2. Code along.** Open a Colab notebook next to the video and type every line yourself. Do not copy-paste. Typing is slow on purpose: you notice details, and your own typos teach you to read error messages.",
     "**3. Practise.** Do the module's Practice exercises without the video. Then change the example: new numbers, new data, a new question. If you are stuck for 20 minutes, take a hint, then try again.",
     "**4. Test yourself.** Take the module quiz and read the explanation for every answer, even the ones you got right. The next day, explain the main idea aloud in two minutes, in Hindi or English, without notes. If you cannot, rewatch only that part.",
     "**5. Build.** Make something small with the idea, even if it is rough: a notebook that analyses your own monthly UPI spends, a model on a public Indian dataset, a tiny app. Put it on GitHub.",
     "A good ratio: for every 1 hour of video, spend 1–2 hours coding, practising and building."
    ]
   },
   {
    "heading": "How much time it takes",
    "paragraphs": [
     "Module study adds up to about 465 hours across the four levels. Projects add more: each one takes 15–60 hours, depending on the level. With one project per level, plan for about 600 hours in total; with two per level, about 730 hours. The **Plan your journey** planner on this page counts module hours plus two projects per level: set your weekly hours and start date, and it calculates your finish date for each level.",
     "A rough guide for all four levels, from one project per level (about 600 hours) to two (about 730 hours). The optional Grand Capstones (150–160 hours each) are extra. These are plans, not promises. Most people take a little longer, and that is fine.",
     "You do not need to finish everything to benefit. Level 1 alone is enough to start working with data. Levels 1–2 plus good projects are enough to apply for many data analyst and junior data science roles."
    ],
    "bullets": [
     "**1 hour a day (about 7 hours a week):** about 20–24 months. Level 1 alone, with one project, takes about 4 months.",
     "**10 hours a week:** about 14–17 months. Level 1, with one project, takes about 3 months.",
     "**2 hours a day (about 14 hours a week):** about 10–12 months.",
     "**Full time (30 or more hours a week):** about 5–6 months, but only if you also rest. Burning out in month 2 costs more time than going slower."
    ]
   },
   {
    "heading": "Sample weekly plans",
    "paragraphs": [],
    "bullets": [
     "**1 hour a day:** Monday to Friday, 25 minutes watching and 35 minutes coding along. Saturday, 1.5 hours of Practice exercises. Sunday, 30 minutes for the quiz and your learning log. Total about 7 hours.",
     "**2 hours a day:** Monday to Friday, 45 minutes watching and 75 minutes coding and practice. Saturday, 3 hours on a project. Sunday, 1 hour for the quiz, revision and your log. Total about 14 hours.",
     "**Busy founder plan (about 8–10 hours a week):** one fixed hour on weekdays before work (for example 6:30–7:30 am, before calls and WhatsApp start), plus one 3–4 hour block on Sunday for projects. Put both in your calendar like client meetings.",
     "**Rule for every plan:** coding time is at least equal to watching time. If you only have 20 minutes, practise; do not start a new video."
    ]
   },
   {
    "heading": "Free setup (₹0, nothing to install on day 1)",
    "paragraphs": [
     "Almost everything in Level 1 runs in a web browser. The one exception is module 1.3, where you install Git and VS Code on a laptop to practise the command line. Create these free accounts in your first week."
    ],
    "bullets": [
     "**Google Colab** (colab.research.google.com): free Jupyter notebooks (documents that mix code, results and notes) that run on Google's computers. Sign in with any Google account. Notebooks save to your Google Drive. This is your main workspace for Levels 1–3.",
     "**Kaggle** (kaggle.com): free notebooks, thousands of datasets, short free courses and competitions. Create an account and verify your phone number; Kaggle asks for this before it lets you use a GPU.",
     "**GitHub** (github.com): free online storage for your code, with full history. It is also where employers and clients look at your work. Pick a professional username (your name, not 'coolboy123').",
     "**AI Marg's Practice tab** runs Python inside your browser for the small exercises, so you can practise even without Colab. You can also use the [Playground](#playground) to try any code.",
     "**VS Code** (code.visualstudio.com): a free code editor for your own computer. Module [1.3 Your AI Toolkit](#m-l1-tools) shows the setup, and you will use it much more from Level 2–3, when projects have several files.",
     "**Python on your own laptop:** not required at first. Install it when module 1.3 or a project asks you to. Use the official installer from python.org, and on Windows tick 'Add python.exe to PATH' during installation.",
     "**Later, when you build apps:** a free Hugging Face account (for models and datasets) and Streamlit Community Cloud, which hosts simple Python web apps for free straight from your GitHub repositories. A free Hugging Face account can also host up to 2 Gradio demos on ZeroGPU Spaces; most other app Spaces now need a paid plan."
    ]
   },
   {
    "heading": "Free GPU limits (read this before Level 3)",
    "paragraphs": [
     "A GPU (graphics processing unit) is a chip that does thousands of calculations at once, which makes training neural networks much faster. You need one only from Level 3. Colab and Kaggle give free GPU time with limits, and those limits change.",
     "Honest note: we could not re-check Colab's and Kaggle's published limits for this October 2026 update, because our web search was unavailable. The descriptions below are the last limits we know of. Trust what your own account shows."
    ],
    "bullets": [
     "**Google Colab (free):** Google does not promise a fixed number of free GPU hours. When a GPU is free you usually get an NVIDIA T4 with about 15 GB of memory. Limits change with demand, long sessions end after some hours, and idle notebooks disconnect. If Colab says you have reached a limit, wait a day or switch to Kaggle. Details: [Colab FAQ](https://research.google.com/colaboratory/faq.html).",
     "**Kaggle Notebooks (free):** Kaggle gives a weekly GPU quota that resets every week, and it limits how long one session can run. The last figures we know of are about 30 GPU hours a week and sessions of up to about 12 hours, but treat these as unconfirmed. Kaggle shows how much quota you have left when you choose an accelerator in the notebook editor. Details: [Kaggle Notebooks docs](https://www.kaggle.com/docs/notebooks).",
     "**Save often.** Free sessions can stop without warning. Save model checkpoints (saved copies of a model during training) to Google Drive or Kaggle output, and push code to GitHub.",
     "**Switch the GPU off when you are not training.** Reading data and writing code do not need a GPU, and an idle GPU session still uses up your quota."
    ]
   },
   {
    "heading": "What it costs in ₹",
    "paragraphs": [
     "**₹0.** Every module, lab, exercise, quiz and test on AI Marg is free, and every linked lesson is free to watch. You do not need any paid course, tool or AI plan to finish.",
     "Optional costs, only if you want them:"
    ],
    "bullets": [
     "**NPTEL certificate exams:** NPTEL lectures are free, but the proctored exam (a supervised exam at a test centre) needed for a certificate is paid. An NPTEL course page for a July–October 2025 run listed the exam fee as ₹1,000 per course. We could not confirm the fee for 2026 runs, so check the course page before you register.",
     "**Internet data:** the real cost for most learners. See 'Saving mobile data' below.",
     "**API credits in Level 4:** some LLM app projects call a model through an API (application programming interface: a way for your code to use another company's service). Most providers have a free tier or trial credit, and you can also run small open models in Colab. Free-tier limits change often, so check the provider's pricing page, and set a monthly spending limit on any paid account.",
     "**Paid upgrades you can skip:** Colab Pro, paid plans of ChatGPT, Claude or Gemini, and paid 'AI certification' courses. They are conveniences, not requirements.",
     "**A laptop,** if you do not have one. See the FAQ on the [Career & FAQ page](#faq) for what is enough."
    ]
   },
   {
    "heading": "Saving mobile data",
    "paragraphs": [
     "Video uses the most data. In the YouTube app, open Settings, then Video quality preferences, and choose Data saver for mobile networks. In a browser, use the gear icon on the video to pick the quality. Slides and code are usually readable at 360p or 480p; switch to 720p only when you need to read small code.",
     "Rough guide: 360p uses about 0.25–0.35 GB per hour, 480p about 0.5 GB, 720p about 1 GB or more, and 1080p about 2 GB or more. This is our own estimate from typical streaming bitrates, not an official YouTube figure, and real use varies by video. To measure your own use, watch 10 minutes, check your phone's data counter, and multiply by 6."
    ],
    "bullets": [
     "Watch long lessons on Wi-Fi when you can. Many NPTEL courses also offer lecture downloads on their course pages.",
     "Turn off autoplay so the next video does not start on its own.",
     "The first time you run Python on AI Marg, your browser downloads the Python engine (about 12 MB, more if an exercise needs NumPy or pandas). After that it is usually kept in your browser's cache and not downloaded again.",
     "Colab and Kaggle use little data, because the heavy work runs on their computers. Downloading big datasets to your device is what uses data, so keep datasets in Colab, Kaggle or Google Drive."
    ]
   },
   {
    "heading": "How to avoid 'tutorial hell'",
    "paragraphs": [
     "Tutorial hell means watching course after course and feeling you understand, but freezing in front of a blank notebook. It is the most common way self-learners get stuck. Signs: you have finished many videos but built nothing alone, you start a new course whenever things get hard, and you cannot explain your own code."
    ],
    "bullets": [
     "**One main resource per module.** Finish the Best pick before you look at other options. Switch only if it truly does not work for you.",
     "**Blank-notebook test.** After each module, open an empty notebook and rebuild the main example from memory. Look things up in the documentation, not the video.",
     "**20-minute stuck rule.** Struggle for 20 minutes (read the error, search it, print values), then take a hint. Some struggle is where learning happens; endless struggle is wasted time.",
     "**Build early and small.** Start a tiny project in Level 1. Do not wait until you 'know enough'; nobody ever feels ready.",
     "**Change one thing.** After every tutorial, change the data, the question or the model, and see what breaks.",
     "**Ship a rough version 1.** A working, imperfect project on GitHub is worth more than a perfect plan in your head."
    ]
   },
   {
    "heading": "Using ChatGPT, Claude or Gemini as a tutor",
    "paragraphs": [
     "AI assistants are excellent tutors and terrible crutches. Use them to understand, not to skip the thinking. If an assistant writes your practice code, you only learn to copy, and anyone can do that."
    ],
    "bullets": [
     "**Try first, then ask.** Attempt each exercise for at least 20 minutes before you ask.",
     "**Ask for hints, not answers.** Example: `I am a beginner learning Python. Do not give me the code. Give me one hint for this error: ...`",
     "**Ask for simple explanations.** Example: `Explain overfitting in simple Hinglish, with an example from cricket or a kirana shop.`",
     "**Ask it to quiz you.** Example: `Ask me 5 questions on train/test split, one at a time, and correct my answers.`",
     "**Explain your code back to it** and ask what you got wrong. Teaching is the fastest way to find gaps.",
     "**Verify everything.** Assistants make confident mistakes, invent functions that do not exist and repeat outdated facts. Run the code, check the official documentation and compare with the lesson.",
     "**Switch off code autocomplete in Level 1.** Editors such as VS Code can suggest whole lines as you type. GitHub Copilot Free includes 2,000 code completions a month, and the Copilot Student plan includes unlimited completions. Turn suggestions off while you learn the basics, and turn them on later for projects.",
     "**Never paste private data.** Do not paste client data, customer phone numbers, passwords or API keys into any chatbot. This matters for agency work too; see the DPDP Act notes on the [Careers page](#career).",
     "Free plans of ChatGPT, Claude and Gemini are enough for this course. Their limits change often; you do not need to pay."
    ]
   },
   {
    "heading": "Hindi, Hinglish or English videos?",
    "paragraphs": [
     "Learn in the language you understand fastest. Many of the best Indian teachers teach in Hindi or Hinglish, such as CampusX (Nitish Singh), Krish Naik Hindi and CodeWithHarry. Use the language filter in the [Library](#library) or the language switch on each module's Watch & read tab.",
     "But learn the English words. Code, error messages, documentation, job interviews and most advanced material are in English. A good habit: watch in Hindi or Hinglish, write your notes using the English terms, and use the [Glossary](#glossary), which gives a Hindi meaning for every term."
    ],
    "bullets": [
     "**Hindi/Hinglish** is great for first understanding, especially in Levels 1–2.",
     "**Indian English** lectures (NPTEL and IIT courses) are excellent for depth and are often slower-paced.",
     "**Global English** lessons (StatQuest, 3Blue1Brown, Karpathy, Stanford) are often the clearest explanation of a topic. Turn on subtitles and slow the speed to 0.75× if needed.",
     "From Level 3, read some official documentation in English every week. It is a job skill."
    ]
   },
   {
    "heading": "Keep notes and a learning log on GitHub",
    "paragraphs": [
     "A learning log is a short daily record of what you studied. It keeps you honest, makes revision easy, and shows employers and clients steady effort. Keep it on GitHub so it is backed up and visible."
    ],
    "bullets": [
     "Create one repository (a project folder on GitHub), for example `ai-marg-journey`, with a `README.md` that says who you are and what you are learning.",
     "Add a `log.md` file. Each study day, add 4 lines: the date and hours; what I learned; what confused me; what I will do next.",
     "Make one folder per module (for example `1.2-python/`) and save your Colab notebooks there (in Colab: File → Save a copy in GitHub).",
     "Each week, copy your notes from every module's **My notes** tab into the repository. Your notes here are saved in this browser (and in your account if you sign in), but a repository is where recruiters can see them.",
     "Write commit messages (the short note attached to each save in Git) that say what changed, for example `Add pandas groupby practice`.",
     "Never commit passwords or API keys. Keep them in a `.env` file and list `.env` in `.gitignore` (the file that tells Git what to ignore). Module 1.3 shows how.",
     "Once a week, read your log and redo one thing that confused you."
    ]
   },
   {
    "heading": "If you are starting an agency",
    "paragraphs": [
     "You do not need to finish all four levels before you use AI in your business. A practical order for a founder: all of Level 1 (especially [1.1](#m-l1-ai-basics), [1.3](#m-l1-tools), [1.6](#m-l1-numpy-pandas) and [1.7](#m-l1-eda-viz-sql)), then [2.1](#m-l2-ml-foundations), [2.4](#m-l2-metrics-tuning) and [2.6](#m-l2-unsupervised), then [4.2 Building LLM Apps](#m-l4-llm-apps) and [4.4 AI Agents](#m-l4-agents). You will meet some terms from Level 3 there; look them up in the [Glossary](#glossary).",
     "This is enough to understand what is possible, scope projects honestly and manage developers. It is not enough to build complex systems for paying clients on your own. Return for Levels 2–3 in full, or work with people who have done them. The [Careers page](#career) lists AI services an agency can sell, with realistic scope."
    ],
    "bullets": []
   },
   {
    "heading": "Your first day",
    "paragraphs": [],
    "bullets": [
     "Create Google, Kaggle and GitHub accounts (about 30 minutes).",
     "Set your hours in the planner on this page, and put your study blocks in your calendar.",
     "Open [Module 1.1 What is AI?](#m-l1-ai-basics), watch the first lesson, and write 3 lines in My notes.",
     "Create your `ai-marg-journey` repository on GitHub and write your first log entry."
    ]
   }
  ]
 },
 "career": {
  "title": "AI careers & freelancing in India",
  "sections": [
   {
    "heading": "The honest picture in 2026",
    "paragraphs": [
     "AI skills are in demand in India: in IT services firms, GCCs (global capability centres: offices that large foreign companies run in India), startups, banks, e-commerce and D2C (direct-to-consumer) brands. But entry-level jobs are competitive. Many listings ask for experience, many applicants have the same certificates, and AI coding assistants now do some routine junior work.",
     "What makes you stand out is proof that you can solve a real problem end to end: clean messy data, build something that works, measure it honestly and explain it in plain language. This page shows how to build that proof, where to look for work, and how to earn through freelancing or your own agency."
    ],
    "bullets": []
   },
   {
    "heading": "Realistic roles and what each needs from this course",
    "paragraphs": [
     "Job titles mean different things at different companies, so read the job description, not just the title. Below, 'Course' means AI Marg levels and modules, and 'Extra' means skills you must add from outside this course."
    ],
    "bullets": [
     "**Data analyst** (the most common entry door). Turns business data into reports, dashboards and answers. Course: all of Level 1, especially SQL and EDA (exploratory data analysis) in [1.7](#m-l1-eda-viz-sql) and statistics and A/B testing in [1.4](#m-l1-stats). Extra: strong Excel or Google Sheets, and one dashboard tool such as Power BI, Tableau or Looker Studio.",
     "**Data scientist.** Builds and tests predictive models and runs experiments to guide business decisions. Course: Levels 1–2 in depth, plus the basics of Level 3. Extra: stronger statistics, knowledge of one domain (finance, retail, health) and clear business communication.",
     "**Machine learning (ML) engineer.** Turns models into reliable software that runs every day. Course: Levels 1–3, especially [3.2 PyTorch](#m-l3-pytorch) and [3.6 Deployment & MLOps](#m-l3-mlops). Extra: software engineering (clean code, testing, APIs, Docker, cloud basics). Product companies often also test DSA (data structures and algorithms) in interviews.",
     "**AI / GenAI engineer.** Builds applications on top of LLMs: chatbots, RAG assistants (retrieval-augmented generation: the model answers using your documents), agents and automations. Course: [3.5 Transformers](#m-l3-transformers) and all of Level 4, especially [4.2](#m-l4-llm-apps), [4.3](#m-l4-finetuning) and [4.4](#m-l4-agents). Extra: backend development (an API framework such as FastAPI), databases, and testing AI output for quality, safety and cost.",
     "**MLOps engineer.** Keeps models running in production (real, live use): data pipelines, deployment, monitoring and retraining. Course: [3.6](#m-l3-mlops), plus enough of Levels 2–3 to understand the models. Extra: Linux, Docker, CI/CD (automatic testing and deployment) and one cloud platform (AWS, Azure or Google Cloud). People from DevOps or IT support backgrounds move into this well.",
     "**AI product roles** (AI product manager, AI consultant, solutions engineer, AI project lead). Decide what to build, scope it and make sure it delivers value safely. Course: Level 1, the ideas of Level 2 (especially [2.4](#m-l2-metrics-tuning) on metrics and business cost), and [4.2](#m-l4-llm-apps) and [4.4](#m-l4-agents) at a conceptual level. Extra: product management, sales and domain knowledge. This is the natural path for an agency founder."
    ]
   },
   {
    "heading": "Portfolio checklist",
    "paragraphs": [
     "A portfolio is the set of work you can show. Recruiters and clients often spend only a minute or two on it, so make it easy to scan. Aim for 3–5 strong projects, not 20 weak ones."
    ],
    "bullets": [
     "A GitHub profile README (the page people see first) with your name, a one-line focus (for example 'Data analyst for retail and D2C brands') and links to your best projects. Optionally, a simple personal site on GitHub Pages, which is free for public repositories.",
     "3–5 pinned projects. Each README answers: what problem, what data, what you did, what result (with numbers), how to run it, and what you would improve next.",
     "At least one project on Indian data, for example from data.gov.in, the RBI's statistics database or a Kaggle dataset on Indian prices, crops, air quality or cricket. It shows you understand local problems.",
     "At least one end-to-end project: data → model → a small live app with a public link. Streamlit Community Cloud hosts Streamlit apps for free from GitHub. Hugging Face now needs a paid plan to create most app Spaces, but free personal accounts can still host up to 2 Gradio demos on ZeroGPU (shared GPUs handed out on demand), and static pages are free.",
     "At least one GenAI project, such as a RAG assistant over public documents, with a short evaluation: 20–50 test questions, how many it answered correctly, and its cost per 100 answers.",
     "Clean repositories: a `requirements.txt` (the list of libraries needed), no API keys, notebooks that run top to bottom without errors, and clear folder names.",
     "A short write-up for each project (a LinkedIn post or blog) in plain English. Clear communication is rarer than technical skill.",
     "Optional: a Kaggle profile with a few notebooks or competition entries, and a contribution to an open-source project (fixing documentation counts).",
     "A one-page resume that links to these projects, states results rather than duties, and honestly uses the keywords from the job post. Many companies filter resumes with an ATS (applicant tracking system: software that scans resumes for keywords)."
    ]
   },
   {
    "heading": "Where to find jobs and internships in India",
    "paragraphs": [],
    "bullets": [
     "**Naukri** (naukri.com): India's biggest job board. Keep your profile updated; recruiters search it daily.",
     "**LinkedIn:** jobs, recruiter messages and referrals. Posting about your projects is how many people get noticed.",
     "**Internshala** (internshala.com): internships and fresher jobs. Check the stipend and the company before you apply, and skip unpaid 'internships' that are really free labour.",
     "**Wellfound** (wellfound.com, formerly AngelList Talent): startup jobs, often with the salary range shown.",
     "**Instahyre** (instahyre.com) and **Cutshort** (cutshort.io): curated tech hiring platforms used by many Indian startups and product companies.",
     "**Company careers pages:** list 20–30 companies you would like to work for (Indian startups, GCCs, IT services firms) and set job alerts on their own websites. Some roles are posted only there.",
     "**Off-campus drives:** large IT services companies run national hiring tests and drives for freshers; TCS's National Qualifier Test (NQT) is one example. Apply only through the company's official website.",
     "**Hackathons and competitions:** Unstop, Kaggle and company hackathons can lead to interviews and make good portfolio material.",
     "**Communities and referrals:** local meetups (Google Developer Groups, PyData, AWS user groups), alumni groups and LinkedIn. A referral with a link to a relevant project works far better than a cold application."
    ]
   },
   {
    "heading": "Avoid job and course scams",
    "paragraphs": [],
    "bullets": [
     "Real employers do not ask you to pay for a job, an interview, 'training' or a 'security deposit'.",
     "Be careful with 'guaranteed placement' courses that cost lakhs. Ask for placement data you can verify, and read the refund and loan terms before paying.",
     "Check that recruiter emails come from the company's official domain, and that the job also appears on the company's own careers page.",
     "Never share OTPs, Aadhaar or bank details on WhatsApp or Telegram for a 'job offer' or 'task-based' earning scheme. Report cyber fraud at [cybercrime.gov.in](https://cybercrime.gov.in/) or on the 1930 helpline."
    ]
   },
   {
    "heading": "Salaries: check, do not guess",
    "paragraphs": [
     "We do not print salary numbers here. They change quickly and vary hugely by city, type of company (startup, product company, IT services, GCC), skills and negotiation, so a single number would mislead you.",
     "For current ranges, compare at least three sources for the exact title and city: AmbitionBox, Glassdoor, LinkedIn, Naukri posts that show pay, and Wellfound (startups often list ranges). Ask people one or two years ahead of you too. Treat every figure as a rough range, not a promise."
    ],
    "bullets": []
   },
   {
    "heading": "Freelancing basics",
    "paragraphs": [
     "Freelancing means doing paid projects for clients without being their employee. It is a good way to earn while you learn and to collect real-world portfolio work."
    ],
    "bullets": [
     "**Platforms:** Upwork, Fiverr, Freelancer.com and Toptal (vetted and harder to join) for global clients; LinkedIn and your own network for Indian clients. Every platform takes a commission (a share of what you earn), and some charge you to send proposals. Read the current fee page before you set your price.",
     "**What sells early:** small, clear, fixed-scope work (a fixed price for a defined result). Examples: cleaning and analysing spreadsheets, dashboards, automating data entry, collecting public web data (respect each website's terms), simple chatbots, and Python scripts that save time.",
     "**Your profile:** one clear niche ('Python automation for small e-commerce stores' beats 'AI expert'), 2–3 sample projects, and a short video or GIF of a working demo.",
     "**Proposals:** restate the client's problem in your own words, say how you would solve it in 3–4 steps, give a timeline and a price, and ask one smart question. Keep it under 150 words.",
     "**Direct clients beat platforms over time.** Ask every happy client for a review and a referral."
    ]
   },
   {
    "heading": "Pricing in ₹ and USD",
    "paragraphs": [
     "Start from the minimum you need, then adjust to the market. A worked example with made-up numbers. You want ₹60,000 a month. Your costs (internet, software, saving for a laptop, money set aside for tax) are ₹15,000 a month. You can bill about 80 hours a month, because freelancers spend much of their time on sales, admin and learning. Your floor rate = (₹60,000 + ₹15,000) ÷ 80 = about ₹940 an hour. Do not quote below your floor.",
     "Then check the market. Look at 10 freelancers on the same platform with similar skills and reviews. While you are new, price a little below the middle; once you have good reviews, move to the middle; raise your rate every few projects."
    ],
    "bullets": [
     "**Indian clients:** quote in ₹, and say clearly whether GST is extra (only if you are GST-registered).",
     "**Foreign clients:** quote in USD (or EUR or GBP). Global rates are set by the global market, not by converting your ₹ rate. Compare what actually reaches your bank after platform fees and currency conversion charges; different payment routes can give quite different rupee amounts.",
     "**Fixed price for defined work, hourly rate for open-ended work.** For fixed prices, write down exactly what is included and how many revisions.",
     "**Take an advance.** For new direct clients, ask for 30–50% upfront and the rest on milestones (agreed checkpoints)."
    ]
   },
   {
    "heading": "Contracts, invoices and getting paid",
    "paragraphs": [],
    "bullets": [
     "**Written scope:** before you start, agree in writing (email is fine for small jobs) on deliverables, timeline, number of revisions, payment schedule, who owns the code, confidentiality and how client data will be handled.",
     "**Invoices** (bills) should show: a unique invoice number, the date, your name or business name and address, the client's name and address, a description of the work, the amount and currency, payment terms and bank details. If you are GST-registered, add your GSTIN (GST identification number), the tax details and any declaration your CA advises, for example for exports under a LUT.",
     "**Foreign payments:** you can receive money through bank wire transfers, platform withdrawals or payment services. Keep the bank's proof of each foreign payment (often called FIRA or FIRC: foreign inward remittance advice or certificate); you may need it for tax and GST records.",
     "**Indian clients and TDS:** many Indian businesses deduct TDS (tax deducted at source) from your payment and deposit it with the income-tax department. You can see it in your annual tax statement on the income-tax portal and claim it when you file your return."
    ]
   },
   {
    "heading": "Tax basics: GST, LUT and income tax (high level only)",
    "paragraphs": [
     "This is general information, not tax advice. Rules and limits change, and your case depends on your state, your clients and your other income. **Talk to a Chartered Accountant (CA) before you register or file anything.**",
     "We could not re-open the official GST pages for this October 2026 update. Check the current rules on the [GST portal](https://www.gst.gov.in/) and [CBIC's GST site](https://cbic-gst.gov.in/), or ask your CA."
    ],
    "bullets": [
     "**GST registration:** for people who supply services, registration has generally been required once aggregate turnover (your total sales across India, including exports) crosses ₹20 lakh in a financial year, or ₹10 lakh in some special category states. Some situations need registration earlier. You can also register voluntarily, but then you must file returns regularly, even in months with no income.",
     "**Export of services** (work for clients outside India, paid in foreign currency) can be 'zero-rated' under GST, meaning no GST is charged on it if the conditions are met. A common route is to file a LUT (Letter of Undertaking) online on the GST portal for each financial year, which lets you export without paying GST first. Your CA will confirm whether your work counts as an export and what your invoices must say.",
     "**Income tax:** all freelance income is taxable. Keep records of every payment and expense, and set aside part of each payment for tax. Ask your CA about advance tax, and whether a presumptive taxation scheme (a simpler method where tax is worked out on a fixed share of your receipts) suits you.",
     "**Keep it simple from day one:** a separate bank account for work income, a spreadsheet of invoices and expenses, and a CA review every quarter."
    ]
   },
   {
    "heading": "AI services an Indian digital agency can sell",
    "paragraphs": [
     "Start with services that solve a clear business problem, use data the client already has, and can be delivered as a small pilot (a short trial project) in weeks, not months. The durations below are typical for a first small version; real timelines depend on the client's data and approvals."
    ],
    "bullets": [
     "**Chatbots and RAG assistants.** A website or WhatsApp assistant that answers customer or staff questions from the client's own documents (catalogue, FAQs, policies) and links to the source. Realistic first scope: one use case, 50–300 documents, English plus one Indian language, and handover to a human when the bot is unsure; about 3–6 weeks. Responsible use: test it on 50–100 real questions before launch, tell users they are talking to a bot, and do not let it give medical, legal or financial advice without human review. For WhatsApp, use the official WhatsApp Business Platform through Meta or an approved provider; unofficial tools can get the number blocked. Learn it in [4.2](#m-l4-llm-apps).",
     "**Marketing analytics.** Dashboards that combine ad, website and sales data; customer segmentation (grouping customers by behaviour, for example RFM: recency, frequency and monetary value); prediction of repeat purchase or churn (customers leaving). Realistic first scope: a data audit plus one dashboard and one segmentation in 2–4 weeks, then a monthly retainer (a fixed monthly fee for ongoing work). Learn it in [1.7](#m-l1-eda-viz-sql) and [2.6](#m-l2-unsupervised).",
     "**AI content workflows.** A system that helps the client's team draft social posts, product descriptions, ad variations and Hindi or regional-language versions in the brand's style. Realistic scope: a documented workflow with prompt templates, a review checklist and staff training; 1–3 weeks. Responsible use: a human edits and approves everything before publishing. Check facts, claims and copyright. Never make realistic images, voices or videos of real people without their written consent. Follow India's rules on labelling AI-generated (synthetic) content; these have been changing, so check the latest MeitY guidance.",
     "**Lead scoring.** A model that ranks new leads by how likely they are to buy, so the sales team calls the best ones first. It needs past leads with known outcomes; as a rule of thumb, several hundred leads and enough conversions to learn from. Realistic first scope: a simple, explainable model in 3–5 weeks, tested against the team's current way of choosing leads. Responsible use: do not use sensitive traits such as religion, caste, health or gender as inputs, check the results for unfair patterns, and keep humans in charge of decisions. Learn it in [2.3](#m-l2-classification), [2.4](#m-l2-metrics-tuning) and [2.5](#m-l2-trees-ensembles).",
     "**Automation.** Connecting tools so routine work happens on its own: sorting enquiries from email and forms, pulling data out of invoices or PDFs, updating the CRM (customer relationship management software), sending weekly reports. Tools such as n8n, Zapier or Make with an LLM, or plain Python. Realistic first scope: one workflow that saves a measurable number of staff hours a week, built in 1–3 weeks. Responsible use: a human approves anything sent to customers, and every automated action is logged so mistakes can be traced. Learn it in [4.4](#m-l4-agents).",
     "**AI audits and readiness reviews.** A short consulting project: map the client's processes, check their data quality, find 3–5 quick wins, flag risks (including data protection) and give a costed roadmap. Realistic scope: 1–3 weeks. This is a strong first offer for a new agency, because it needs judgement more than heavy engineering, and it often leads to implementation work."
    ]
   },
   {
    "heading": "Scoping and pricing AI projects for clients",
    "paragraphs": [],
    "bullets": [
     "**Sell in stages:** a paid discovery or audit, then a fixed-price pilot, then a monthly retainer for running and improving the system.",
     "**Define success in numbers before you start,** for example 'answers at least 80% of our 100 test questions correctly' or 'saves 10 hours of staff time a week'. Agree how it will be measured.",
     "**Never promise 100% accuracy.** AI systems make mistakes. Sell a system with checks, human review and clear limits.",
     "**Running costs are separate from build costs.** LLM APIs charge per use, usually per token (a small piece of text, roughly a short word or part of a word). Estimate monthly costs from expected usage, set usage caps, and either pass costs to the client at actual cost or include a fixed allowance in the retainer.",
     "**Plan for maintenance:** documents change, models get updated and prices move. Include monthly review time in every retainer.",
     "**Know when to say no:** if the client has no usable data, no clear owner on their side, or wants full automation of high-risk decisions, recommend a smaller or different project."
    ]
   },
   {
    "heading": "Responsible use, client data and the DPDP Act 2023",
    "paragraphs": [
     "The Digital Personal Data Protection Act, 2023 (DPDP Act) is India's law on digital personal data: any data about a person who can be identified, such as a name, phone number, email or purchase history. The DPDP Rules, 2025, notified in November 2025, bring the Act's duties into force in phases, with most obligations scheduled to apply about 18 months later. We could not re-check the current status for this October 2026 update, so confirm the dates on the [MeitY website](https://www.meity.gov.in/) and take legal advice for client projects.",
     "In most agency projects the client is the Data Fiduciary (the business that decides why and how personal data is used) and your agency is a Data Processor (you handle the data on the client's instructions). The client stays responsible to its customers, so expect them to ask for safeguards in your contract. Penalties under the Act can reach ₹250 crore for some failures, such as not taking reasonable security safeguards."
    ],
    "bullets": [
     "**Sign a data processing agreement:** a contract that says what data you receive, for what purpose, how you protect it and when you delete it.",
     "**Use the minimum data.** Ask only for the fields the project needs. Remove or mask names, phone numbers and emails wherever you can; models rarely need them.",
     "**Respect consent and purpose.** Use data only for the purpose people agreed to. A chatbot built for customer support should not quietly become a marketing tool.",
     "**Choose AI tools carefully.** Do not paste client personal data into free consumer chat apps. Use business or API plans whose terms say how your data is used and stored, and check where it is hosted. For example, Streamlit Community Cloud hosts all apps in the United States, so use it for demos with public data, not client personal data.",
     "**Secure it:** strong passwords, two-factor authentication, access only for people who need it, encrypted storage, and API keys kept in secret settings, never in code.",
     "**Plan for breaches** (data leaks): agree in advance how you will tell the client immediately. The Act requires the business to inform the Data Protection Board of India and the affected people.",
     "**Delete when done,** and confirm the deletion in writing at the end of the project.",
     "**Children's data and sensitive sectors** (health, finance, education) need extra care and specialist legal advice. For example, the Act requires verifiable consent from a parent before processing a child's personal data."
    ]
   },
   {
    "heading": "A possible first 90 days for an agency founder",
    "paragraphs": [
     "At about 10 hours a week of study, alongside running the business:"
    ],
    "bullets": [
     "**Days 1–30:** modules [1.1](#m-l1-ai-basics) to [1.3](#m-l1-tools). Meanwhile, use AI assistants inside your own agency (proposal drafts, report summaries, content ideas) to learn their strengths and limits first-hand, with no client data.",
     "**Days 31–60:** modules [1.6](#m-l1-numpy-pandas) and [1.7](#m-l1-eda-viz-sql), plus the RAG lessons in [4.2](#m-l4-llm-apps) for understanding. Module 1.7 uses averages and correlation, so skim those lessons in [1.4](#m-l1-stats) first. Build one demo on public data, for example an assistant that answers questions about a published government scheme, with a partner if needed.",
     "**Days 61–90:** offer 2–3 existing clients a small paid AI audit, deliver it carefully, and turn the best finding into a pilot. Bring in an experienced ML or GenAI freelancer for the build, and learn by reviewing their work. After day 90, finish [1.4](#m-l1-stats) and [1.5](#m-l1-linalg-calc), then follow the founder's order on [Start here](#start)."
    ]
   }
  ]
 },
 "faq": [
  {
   "q": "I have no coding background. Can I really do this?",
   "a": "Yes, if you are patient and consistent. Level 1 assumes nothing: [module 1.1](#m-l1-ai-basics) needs no code, and [1.2](#m-l1-python) starts Python from zero.\n\nExpect the first 2–4 weeks of Python to feel slow and confusing. That is normal, not a sign that you are bad at it. The people who succeed are not the smartest; they practise most days and build things. At 1 hour a day for about 3 months, you can expect to write useful Python scripts and analyse real data."
  },
  {
   "q": "Do I need strong maths?",
   "a": "No, not to start. Class 10 maths (percentages, basic algebra, reading graphs) is enough for Levels 1–2. [Module 1.4](#m-l1-stats) teaches the statistics you need, and [1.5](#m-l1-linalg-calc) builds intuition for linear algebra and calculus with visual labs.\n\nDeeper maths matters for research topics in Levels 3–4 and for some ML engineer interviews. Learn maths when a topic needs it, not all upfront. Many people quit because they try to finish a full maths course before writing any code."
  },
  {
   "q": "What laptop do I need?",
   "a": "Any reasonably recent laptop works, because heavy work runs in Colab or Kaggle.\n\n- **Minimum:** 8 GB RAM, an SSD (solid-state drive, much faster than an old hard disk), an up-to-date Chrome or Firefox browser and a stable internet connection. Windows, macOS, Linux or a Chromebook all work for Levels 1–2.\n- **Better:** 16 GB RAM and a modern processor (for example Intel Core i5, AMD Ryzen 5 or Apple M-series). This makes VS Code, Docker and local projects in Levels 3–4 smoother.\n- **Not needed:** a gaming laptop or an expensive graphics card.\n\nA Chromebook is fine for browser and Colab work but limited for the local development in Levels 3–4."
  },
  {
   "q": "Do I need a GPU?",
   "a": "No. Levels 1–2 run fine on a normal laptop CPU (central processing unit, the main chip) or in your browser. For deep learning in Levels 3–4, use the free GPUs in Google Colab and Kaggle Notebooks. They are enough for this course's projects if you keep datasets and models small.\n\nOwning a GPU helps only if you train models many hours every week. Even then, try renting cloud GPU time by the hour before you buy one. Free GPU limits change, so read 'Free GPU limits' on [Start here](#start)."
  },
  {
   "q": "Should I watch Hindi/Hinglish or English videos?",
   "a": "Whichever you understand fastest. Hindi and Hinglish teachers such as CampusX, Krish Naik Hindi and CodeWithHarry are excellent for first understanding. Then learn the English terms, because code, documentation and interviews are in English.\n\nThe [Library](#library) has a language filter, each module's Watch & read tab has a language switch, and the [Glossary](#glossary) gives a Hindi meaning for every term. From Level 3, more of the best material is in English; subtitles and 0.75× speed help."
  },
  {
   "q": "Are certificates useful?",
   "a": "A little, but far less than projects. Employers and clients care about what you can do.\n\n- **Somewhat useful:** certificates from proctored exams such as NPTEL (an NPTEL course page listed a ₹1,000 exam fee per course for a 2025 run; check the current fee), and well-known cloud certifications if you target MLOps or cloud roles.\n- **Mildly useful:** free completion certificates, such as Kaggle Learn's, as proof of steady learning.\n- **Not worth much:** paid certificates without a real exam, and 'AI expert' badges.\n\nList certificates in one line on your resume. Put projects at the top."
  },
  {
   "q": "Should I learn TensorFlow or PyTorch?",
   "a": "Learn PyTorch first. This course uses it in [3.2](#m-l3-pytorch), it is the main framework in research, and most new open-source models and tutorials, including Hugging Face examples, use it.\n\nModule 3.2 also shows Keras (a simpler interface that can run on TensorFlow and other back-ends), because some companies and older tutorials use it. Once you know one framework well, switching takes days, not months. The ideas are the same."
  },
  {
   "q": "Is it too late to start AI in 2026?",
   "a": "No, but the bar has moved. 'I watched a course' skills are common now, and AI tools write simple code for everyone. What is still scarce: people who understand data and models well enough to make them work reliably on real business problems, catch their errors and explain them clearly.\n\nIndia also has millions of small and mid-sized businesses that have barely started using AI. That is a real opportunity for an agency. Start now, build real projects, and you will be ahead of people who only follow the news."
  },
  {
   "q": "Can I learn on a phone?",
   "a": "Partly. On a phone you can watch lessons, take quizzes, use most labs and read the glossary. The small Practice exercises also run, but typing code on a phone is slow and tiring.\n\nUse the phone for watching and revision, and a laptop or desktop for coding. If you do not have a laptop yet, daily phone study plus a college lab or cyber café once or twice a week for coding is a workable start for Level 1. Plan to get a laptop before Level 2."
  },
  {
   "q": "How do I stay motivated?",
   "a": "- Study at the same time every day. Habits beat motivation.\n- Keep your learning log on GitHub, and watch your day streak on [My progress](#progress).\n- Set small weekly goals ('finish the 1.2 Practice') instead of huge ones ('master AI').\n- Build things you care about: your agency's data, your city's air quality, cricket scores, your own expenses.\n- Find a study partner or group and share your log every week.\n- Expect bad weeks. If you miss days, restart with 20 minutes. Do not try to catch up on everything at once."
  },
  {
   "q": "What if a video link is broken or a video is removed?",
   "a": "1. If the lesson card shows a **Search YouTube** button, use it. It searches for the same lesson by title and creator.\n2. Otherwise, search YouTube for the title and creator shown on the card.\n3. Switch to another teacher for the same topic: most modules list a second main pick and More options in the Watch & read tab, and the [Library](#library) has every resource.\n4. Please report it on [GitHub Issues](https://github.com/digitalmarket-arch/AI-ML/issues) with the module name, so it can be fixed for everyone.\n\nCards marked 'link unconfirmed' are ones we could not fully check."
  },
  {
   "q": "Is my progress saved?",
   "a": "Yes. It is saved in this browser straight away. If you see **Sign in** at the top right, sign in with Google: your progress is then backed up to your account and synced to your other devices, so clearing the browser or changing phone loses nothing.\n\nWithout signing in, clearing browser data, using a private window or changing device loses it. In that case, every week or two go to [My progress](#progress) and press **Download file** or **Copy progress**, and use **Restore** on another device. Copy your module notes to GitHub as well."
  },
  {
   "q": "Can I skip modules or change the order?",
   "a": "You can, but be careful. Level 1 is the base for everything, so skip a module there only if you can already pass its quiz without studying. In Levels 2–4, the module order follows what each topic needs.\n\nA quick check: take the module quiz first. If you score 80% or more, skim the module, do the Practice exercises and move on. If not, do the full module."
  },
  {
   "q": "If AI can write code, why should I learn to code?",
   "a": "Because you must judge whether that code is correct, safe and solving the right problem. AI assistants are fast but make confident mistakes, and you are responsible for what you deliver to an employer or client.\n\nPeople who understand code use AI tools to work faster. People who do not understand it cannot tell when the tool is wrong. Learn the basics yourself first, then use AI tools to speed up."
  },
  {
   "q": "Do I need to pay for ChatGPT, Claude, Gemini or API credits?",
   "a": "No. Free plans are enough for using them as a tutor in this course. Their limits change often, so do not plan around exact numbers.\n\nIn Level 4, a few LLM app projects work best with an API key. Use a provider's free tier or trial credit, or run a small open model in Colab. If you ever add a payment method, set a monthly spending limit first."
  },
  {
   "q": "Do I need to finish all four levels before I can earn?",
   "a": "No. After Level 1 you can take small data cleaning, spreadsheet automation and dashboard jobs. After Level 2 you can do analytics and basic prediction projects. The LLM app and agent modules in Level 4 lead to chatbot and automation work.\n\nTake paid work only when you can deliver it reliably, and be honest with clients about what you can and cannot do yet. See the [Careers page](#career) for pricing and invoices."
  }
 ],
 "sources": [
  {
   "label": "NPTEL course page, Introduction to Probability & Statistics (in Hindi): Jul–Oct 2025 run, proctored exam fee ₹1,000 (seen in a search result; 2026 fee not confirmed)",
   "url": "https://onlinecourses.nptel.ac.in/noc25_ma123/preview",
   "checked": "Oct 2026, search result only"
  },
  {
   "label": "GitHub Docs (source file): Copilot plans for individuals — Copilot Free includes 2,000 code completions a month; Copilot Student includes unlimited completions",
   "url": "https://github.com/github/docs/blob/main/content/copilot/concepts/billing-and-usage/individuals/billing.md",
   "checked": "Oct 2026"
  },
  {
   "label": "GitHub Docs (source file): GitHub Pages is available in public repositories on GitHub Free",
   "url": "https://github.com/github/docs/blob/main/data/reusables/gated-features/pages.md",
   "checked": "Oct 2026"
  },
  {
   "label": "Hugging Face Hub docs (source file): Spaces overview — Static Spaces free for everyone; Gradio and Docker Spaces need a paid plan to create; free personal accounts can host up to 2 Gradio Spaces on ZeroGPU",
   "url": "https://github.com/huggingface/hub-docs/blob/main/docs/hub/spaces-overview.md",
   "checked": "Oct 2026"
  },
  {
   "label": "Streamlit docs (source file): Community Cloud lets you deploy apps from GitHub for free",
   "url": "https://github.com/streamlit/docs/blob/main/content/deploy/community-cloud/_index.md",
   "checked": "Oct 2026"
  },
  {
   "label": "Streamlit docs (source file): Community Cloud status and limitations — all apps are hosted in the United States",
   "url": "https://github.com/streamlit/docs/blob/main/content/deploy/community-cloud/status-and-limitations.md",
   "checked": "Oct 2026"
  },
  {
   "label": "Kaggle Notebooks documentation (GPU quota and session limits)",
   "url": "https://www.kaggle.com/docs/notebooks",
   "checked": "link only; not re-checked in Oct 2026 (web search unavailable)"
  },
  {
   "label": "Google Colab FAQ (free-tier usage limits)",
   "url": "https://research.google.com/colaboratory/faq.html",
   "checked": "link only; not re-checked in Oct 2026 (web search unavailable)"
  },
  {
   "label": "GST portal (registration, LUT filing)",
   "url": "https://www.gst.gov.in/",
   "checked": "link only; not re-checked in Oct 2026 (web search unavailable)"
  },
  {
   "label": "CBIC GST website (GST Acts, rules and notifications)",
   "url": "https://cbic-gst.gov.in/",
   "checked": "link only; not re-checked in Oct 2026 (web search unavailable)"
  },
  {
   "label": "MeitY website (DPDP Act 2023 and DPDP Rules 2025)",
   "url": "https://www.meity.gov.in/",
   "checked": "link only; not re-checked in Oct 2026 (web search unavailable)"
  },
  {
   "label": "National Cyber Crime Reporting Portal",
   "url": "https://cybercrime.gov.in/",
   "checked": "link only; not re-checked in Oct 2026 (web search unavailable)"
  }
 ]
};
