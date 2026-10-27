# AI Marg: a free AI & ML course site

**AI Marg** takes a complete beginner from their first line of Python to building LLM apps and AI agents, using the best **free** videos on YouTube, NPTEL and other platforms. **Indian teachers come first.** Every module's best pick is from an Indian teacher, in Hindi, Hinglish or Indian English (for example CampusX, Krish Naik, Codebasics and NPTEL/IIT professors); the three languages are treated equally. Global English classics such as StatQuest, 3Blue1Brown and Stanford appear as extra options.

The site is interactive:

- **Curated video lessons** for every module: one "best pick" from an Indian teacher (Hindi, Hinglish and Indian English are treated equally), then other options. Every YouTube video plays inside the site, videos you have really watched (most of each, not skipped through) tick themselves, and playlists remember where you stopped. A playlist shared by several modules is ticked by hand for each module's part, and a course on another site is never ticked by its YouTube intro.
- **27 interactive labs, one for every module.** Drag, click and move sliders to *see* how a first model learns, Python running line by line, Git branches, pandas group-by and SQL joins, gradient descent, overfitting, decision trees, K-Means, neural networks, a PyTorch training loop, convolution filters, embeddings, tokenizers, LLM sampling, RAG search, LoRA, diffusion, AI agents, data drift, Q-learning and statistical significance. Each lab has tasks, and each was checked by a second reviewer who recomputed its numbers.
- **Python in the browser.** Auto-graded coding exercises run on the page using [Pyodide](https://pyodide.org). Nothing to install.
- **Quizzes and level tests.** Each module has a 10-question quiz with explanations, and each level ends with a tougher 20-question test (pass mark 70%).
- **Tough projects.** Each project has a client-style brief, Indian datasets, milestones, a rubric and stretch goals, ending with two grand capstones.
- **374 original diagrams**, at least one on every lesson card (all 189), drawn for this course with Indian examples and checked by a second reviewer who recomputed the numbers. They follow light and dark mode, fill the card's width on phones, and load only when a module is opened.
- **Publish and share projects:** upload a finished project to your own GitHub repository from the project page (with a README written for you), then share it on LinkedIn with a ready-made post.
- **Lesson cards in simple English.** Each module's reading is split into short cards (the big idea, goals, study plan, key terms, an Indian example, common mistakes and self-check tasks), written in short sentences with every technical word explained where it is used, and harder words also given in Hindi, like "average (औसत, ausat)". Every key term has a plain meaning, an everyday comparison and an example (a line of code for coding terms). Every card has at least 5 Indian examples (1,204 in all). Press **Got it** after each card; the ticks count towards the module's progress.
- **Listen (read aloud) everywhere.** A Listen button on every lesson card, page section, key term, glossary term and quiz question, and a speaker button at the top that reads any page from where you are. It uses the voices already on your phone or computer (an Indian English voice when there is one, and a Hindi voice for the Hindi words), so it is free and works offline on most phones. A small player lets you pause, skip, change speed and pick a voice; the paragraph being read is highlighted.
- **A Study room built on research-backed learning methods and Vedic study practices:** Daily review (spaced repetition, Smaraṇa), recall and Why? checks on lesson cards, a Reflect tab per module (Feynman box, Manana questions, Japa rounds, Nididhyāsana), Śravaṇa listening cues and summaries, focus sessions (Dhāraṇā, with an optional Dhyāna breath and a Vairāgya distraction-free mode), a Svādhyāya journal, mixed practice with confidence ratings, a mistakes notebook, a knowledge map with next steps, and a **How to learn** page that explains all 40 methods and how strong the evidence is for each.
- **Progress tracking, notes, a study planner and a jargon glossary** in plain English. Everything is saved in your own browser, with optional Google sign-in to back up and sync progress across devices. No ads and no tracking.

**What's inside:** 4 levels, 27 modules, 428 free resources (409 with verified links), 350 quiz questions, 81 auto-graded coding exercises, 27 labs, 18 projects and 180 glossary terms. The lesson cards are in simple English, with Hindi words in brackets for harder terms, a diagram and at least 5 examples on every card; the videos are in Hindi, Hinglish and Indian English.

The four levels are named in Sanskrit:

| Level | Name | Focus |
|---|---|---|
| 1 | Ārambha (beginning) | AI basics, Python, tools, statistics, maths, NumPy/Pandas, EDA and SQL |
| 2 | Abhyāsa (practice) | Core machine learning with scikit-learn |
| 3 | Prāvīṇya (proficiency) | Deep learning, PyTorch, computer vision, NLP, transformers, MLOps |
| 4 | Naipuṇya (mastery) | LLMs, RAG, fine-tuning, agents, generative vision, RL, research and career |

---

## Put the site online with GitHub Pages (free, about 5 minutes)

GitHub Pages hosts this folder as a website at no cost.

1. Open the repository on GitHub: `https://github.com/digitalmarket-arch/AI-ML`.
2. Make sure the site files are on the branch you want to publish. They were pushed to the branch `ccr-d2e52eb0-624rlk`. To publish from `main`, merge that branch into `main` first, using a pull request (a request to combine one branch into another).
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
5. Choose the branch (`main`, or `ccr-d2e52eb0-624rlk`) and the folder **/ (root)**. Press **Save**.
6. Wait 1–2 minutes and refresh the page. GitHub shows the address, usually `https://digitalmarket-arch.github.io/AI-ML/`.

> **Why not just double-click `index.html`?** You can, and most of the site works. But YouTube often refuses to play embedded videos on pages opened as files (it needs a proper web address), and some browsers block the in-browser Python there. On GitHub Pages everything works.

### Turn on sign-in (optional, free, about 10 minutes)

**This copy is already connected** to the Firebase project `ai-marg`, so sign-in is live on the GitHub Pages site. The steps below are for anyone who copies the site and wants sign-in on their own project.

Without this, the site works fully and each learner's progress stays in their own browser. With it, learners can press **Sign in** (top right), sign in with Google, and their progress is backed up and synced between their phone and laptop. It uses Firebase from Google on the free Spark plan (₹0; no card needed).

1. Go to [console.firebase.google.com](https://console.firebase.google.com), sign in with your Google account and press **Create a project**. Name it, for example `ai-marg`. You can turn Google Analytics off.
2. In the project, press the **web** icon (`</>`) to **add a web app**. Give it a nickname, leave "Firebase Hosting" unticked, and press **Register app**. Firebase shows a `firebaseConfig` with `apiKey`, `authDomain`, `projectId` and `appId`. Keep this page open.
3. Open **Build → Authentication → Get started → Sign-in method**, choose **Google**, switch it on, pick a support email and **Save**.
4. Still in Authentication, open **Settings → Authorized domains → Add domain** and add `digitalmarket-arch.github.io` (your GitHub Pages address without `https://`).
5. Open **Build → Firestore Database → Create database**. If asked, pick the **Standard** edition and keep the database ID as `(default)` (the site looks for that name). Choose a location in India (for example **asia-south1, Mumbai**) and start in **production mode**.
6. In Firestore, open the **Rules** tab, delete what is there, paste the whole of [`firestore.rules`](firestore.rules) from this repository, and press **Publish**. These rules let each learner read and write only their own progress.
7. Open `assets/js/firebase-config.js` in this repository (on GitHub you can press the pencil icon to edit it) and replace `window.AIM_FIREBASE = null;` with your values, for example:

   ```js
   window.AIM_FIREBASE = { apiKey: "AIza…", authDomain: "ai-marg.firebaseapp.com", projectId: "ai-marg", appId: "1:…:web:…" };
   ```

   Commit the change. A minute later the **Sign in** button appears on the site.
8. Optional but recommended: open **Project settings → General → Public settings** and set the **public-facing name** to your site's name (for example `AI Marg`). Otherwise Google may show a project number such as `project-519581742822` when learners sign in.

These config values are not secret (every Firebase web app shows them to the browser); the rules from step 6 are what keep each learner's data private. The free plan allows about 50,000 reads and 20,000 writes a day. That covers a few hundred daily learners because the site syncs a few seconds after a change (at most twice a minute), sends a playing video's position only every few minutes or when the learner switches away from the tab, and skips the write when nothing has changed.

**Privacy:** the cloud copy holds each learner's course progress and Google account ID; their name and email are visible to you in the Firebase console. Learners can delete their cloud copy themselves from the Account page; that removes their progress but not their sign-in record, so if someone asks you to delete everything, also delete them under **Authentication → Users**. If you run this for real users in India, keep a short privacy notice in line with the Digital Personal Data Protection Act, 2023 (what you collect, why, and how to ask for deletion).

### Turn on AI help: the "Ask Gemini" buttons (optional, free tier, about 15 minutes)

Every learner already gets **Copy prompt for your AI app** next to the study tools: it copies a ready-made prompt for ChatGPT, Gemini, Claude or any AI app (₹0, nothing to set up). This step adds an **Ask Gemini** button inside the site for signed-in learners, using Google's Gemini through your Firebase project (Firebase AI Logic). Sign-in (above) must be on first.

1. In the [Firebase console](https://console.firebase.google.com), open your project, then **Build → AI Logic → Get started**, and choose the **Gemini Developer API** (it works on the free Spark plan, with no billing). Follow the guided steps. If they offer to set up App Check, accept.
2. Create a reCAPTCHA key (it proves requests really come from your site): open the [Google Cloud console](https://console.cloud.google.com) with the same project selected, search for **reCAPTCHA** in the top bar, press **Create key**, choose **Website**, add the domain `digitalmarket-arch.github.io`, and create it. Copy the key ID. The free tier covers 10,000 checks a month without billing.
3. Back in Firebase, open **Build → App Check → Apps**, pick your web app, choose **reCAPTCHA Enterprise**, paste the key and save. Under **App Check → APIs**, check that **Firebase AI Logic** is **Enforced** (Firebase now turns this on for AI Logic).
4. Edit `assets/js/firebase-config.js` and change the `window.AIM_AI` line to:

   ```js
   window.AIM_AI = { enabled: true, model: "gemini-2.5-flash-lite", dailyPerPerson: 10, appCheckSiteKey: "PASTE-YOUR-KEY-ID", appCheckProvider: "enterprise" };
   ```

   Commit the change. A minute later, signed-in learners see **Ask Gemini** buttons (for example on a module's **Reflect** tab).

**Limits and cost:** the free tier gives the whole site a limited number of Gemini replies a day (the limit is per project, not per learner; check the current figure for your project in [Google AI Studio](https://aistudio.google.com)). `dailyPerPerson` stops one learner from using it all; it is counted in the learner's browser, so App Check is what really protects the quota. When the quota runs out, learners see a plain message and can still use Copy prompt. On the Spark plan there is no bill. If Google retires the model, change `model` to a current one.

**Privacy:** whatever a learner sends with Ask Gemini goes to Google, and on the free tier Google may use it to improve its products. The site says this next to the buttons; mention it in your privacy notice too.

### Preview on your own computer

If you have Python installed, open a terminal in this folder and run:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000> in your browser. Press `Ctrl + C` in the terminal to stop.

---

## Editing the course

All content lives in the `data/` folder as JavaScript files that hold JSON (a simple text format for data). You can edit them in any text editor or directly on GitHub (open the file, then click the pencil icon).

| File | What it holds |
|---|---|
| `data/course.js` | Levels and modules: titles, lesson-card text (overviews, study plans, key terms…), which lab belongs where |
| `data/examples/` | The examples on each module's lesson cards (one file per module) |
| `data/resources.js` | Every video, course and book, with language, level and the modules it serves |
| `data/quizzes.js` | Module quizzes (keyed by module id) and level tests (`test-l1` … `test-l4`) |
| `data/exercises.js` | In-browser Python exercises |
| `data/projects.js` | Projects and capstones |
| `data/glossary.js` | Jargon buster |
| `data/pages.js` | "Start here", career guide, FAQ and sources |

### Add a video or course

Copy an existing entry in `data/resources.js` and change the values:

```js
{
 "id": "campusx-100-days-of-machine-learning",   // unique, lowercase, dashes
 "title": "100 Days of Machine Learning",
 "creator": "CampusX",
 "platform": "YouTube",
 "type": "playlist",                  // playlist, video, course, channel, book, practice, dataset, article, tool
 "url": "https://www.youtube.com/playlist?list=...",
 "firstVideoUrl": "https://www.youtube.com/watch?v=...",   // optional: the first video (a watch?v= link, not the playlist); lets the site show a thumbnail
 "language": "hinglish",              // hindi, hinglish, indian-english, english
 "level": "beginner",                 // beginner, intermediate, advanced, expert
 "modules": ["l2-ml-foundations"],    // module ids from data/course.js
 "why": "One or two sentences on why it is good.",
 "status": "verified",                // "verified" only after you open the link yourself; "partial" or "unverified" shows a warning chip
 "listId": "", "videoId": ""          // optional; filled from the URLs automatically
 // "parts": ["videoId1", "videoId2"]  // optional: one resource in a few separate videos; plays them in order and ticks after all
}
```

### Edit a lesson card

Each module in `data/course.js` has seven lesson cards: `overview` (The big idea), `outcomes`, `studySteps`, `keyTerms`, `indiaExample` (In India), `commonMistakes` and `selfCheck`. Write them in simple English: short sentences, and explain every technical word the first time a card uses it.

- **Hindi words in brackets** help Indian learners. Write them in both scripts, exactly like this: `average (औसत, ausat)`. Use them only for harder words, the first time they appear on a card. Hindi is not allowed anywhere else in the course text, and `node scripts/check-data.js` reports any that is.
- **Key terms** matter most: explain each one so a beginner gets it. Keep them in the same order (the Study room's review cards point to a key term by its position). Give a plain `meaning` (one or two short sentences), `like` (an everyday comparison; the site shows "Think of it like:" in front of it) and `example` (a tiny concrete example; for a coding term, one line of code and what it does). `"hi"` shows the Hindi word next to the term:

```js
{"term": "Variable", "hi": "चर, char", "meaning": "A name that holds a value, so you can use it later.",
 "like": "A steel dabba with a label: the label is the name, what you put inside is the value.",
 "example": "`price = 250` puts 250 in a box called price; `price * 2` then gives 500."}
```
- **Examples:** every card has at least 5 short examples, each with a title and one to three sentences. They live in `data/examples/<module id>.js` (loaded only when that module's lesson cards open, so every other page stays light), and the module in `data/course.js` has `"examples": true`:

```js
window.AIM.examples["l1-ai-basics"] = {
 "overview": [{"title": "Kirana shop", "text": "Riya's shop in Pune uses last year's bills to guess (अनुमान, anumaan) how much atta to order before Diwali."}]
};
```

- **Diagrams** for a module live in `assets/figures/<module id>.js`. `after` names the card a diagram belongs to. A card shows its text, then its diagrams, then its examples.

### Add a quiz question

In `data/quizzes.js`, add to the module's list. `answer` counts from 0, so 0 means the first option.

```js
{"id": "l2-regression-q11", "q": "What does a learning rate control?", "code": "",
 "options": ["Step size", "Number of features", "Test size", "Random seed"],
 "answer": 0, "explain": "It is the size of each step downhill...", "difficulty": "easy"}
```

### Add a coding exercise

Exercises in `data/exercises.js` have `starter` code, a reference `solution`, and `tests` written as `check(...)` lines:

```python
check("with_gst(1000, 18) returns 1180", lambda: close(with_gst(1000, 18), 1180), "Multiply by (1 + rate/100).")
```

`check(name, test, hint)` shows a green tick or a red cross with the hint. `close(a, b)` compares numbers or arrays with a small tolerance.

### Check your edits

If you have [Node.js](https://nodejs.org) installed, run this before you publish:

```bash
node scripts/check-data.js
```

It catches broken ids, missing fields, wrong answer numbers and missing lab files. A missing comma or quote shows up as "does not load".

---

## How the links were chosen and checked

- Research agents searched for the best free resources per module, Hindi/Hinglish first. A separate checker then re-found every link independently and confirmed the creator, language and cost.
- A link marked **verified** was seen exactly in a search result or a creator's own GitHub page in **October 2026**. Links that could not be fully confirmed carry a chip: "link unconfirmed" when the link itself could not be confirmed, and "partly confirmed" when the link was found but a detail (such as the uploader, or whether free audit is still offered) could not be checked. On YouTube, those cards also get a "Search YouTube" button.
- YouTube playlists change over time. If something breaks, use the "Report it on GitHub" link in the footer, or fix it in `data/resources.js`.

## How it is built

- Plain HTML, CSS and JavaScript. There is no build step and no framework, so it runs on any static host.
- Python runs in the browser through Pyodide 0.29.5, loaded from `cdn.jsdelivr.net` the first time a learner presses Run (about 10–30 MB, then cached).
- Fonts come from Google Fonts: Rozha One, Mukta and JetBrains Mono.
- Labs are self-contained scripts in `assets/js/labs/`. Each one registers itself on `window.AILabs`.

## Credits

All videos and courses belong to their creators, including CampusX, Krish Naik, NPTEL and the IIT professors, Codebasics, StatQuest, 3Blue1Brown, Andrej Karpathy, Stanford, MIT, freeCodeCamp, Hugging Face, Kaggle and DeepLearning.AI. This site only links to and embeds their free public content. Please support them by watching on their channels.
