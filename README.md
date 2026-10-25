# AI Marg: a free AI & ML course site

**AI Marg** takes a complete beginner from their first line of Python to building LLM apps and AI agents, using the best **free** videos on YouTube, NPTEL and other platforms. **Indian teachers come first.** Every module leads with Hindi or Hinglish videos, then Indian English (for example Krish Naik, Codebasics and NPTEL/IIT professors). Global English classics such as StatQuest, 3Blue1Brown and Stanford appear only as extras, or where no good Indian option exists.

The site is interactive:

- **Curated video lessons** for every module. The "main pick" is from an Indian teacher, and a toggle switches between Hindi/Hinglish first and Indian English first.
- **12 interactive labs.** Drag, click and move sliders to *see* gradient descent, overfitting, K-Means, decision trees, neural networks, convolution filters, tokenizers and LLM sampling.
- **Python in the browser.** Auto-graded coding exercises run on the page using [Pyodide](https://pyodide.org). Nothing to install.
- **Quizzes and level tests.** Each module has a 10-question quiz with explanations, and each level ends with a tougher 20-question test (pass mark 70%).
- **Tough projects.** Each project has a client-style brief, Indian datasets, milestones, a rubric and stretch goals, ending with two grand capstones.
- **Progress tracking, notes, a study planner and a jargon glossary** in plain English. Everything is saved in your own browser; there are no accounts and no tracking.

**What's inside:** 4 levels, 27 modules, 428 free resources (409 with verified links), 350 quiz questions, 81 auto-graded coding exercises, 12 labs, 18 projects and 180 glossary terms. All text on the site is in English; Hindi and Hinglish appear only in the videos.

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
| `data/course.js` | Levels and modules: titles, overviews, study plans, key terms, which lab belongs where |
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
 "firstVideoUrl": "https://www.youtube.com/watch?v=...",   // optional: lets the site show a thumbnail
 "language": "hinglish",              // hindi, hinglish, indian-english, english
 "level": "beginner",                 // beginner, intermediate, advanced, expert
 "modules": ["l2-ml-foundations"],    // module ids from data/course.js
 "why": "One or two sentences on why it is good.",
 "status": "verified",                // set "verified" only after you open the link yourself
 "listId": "", "videoId": ""          // optional; filled from the URLs automatically
}
```

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
- A link marked **verified** was seen exactly in a search result or a creator's own GitHub page in **October 2026**. Links that could not be fully confirmed carry a "link unconfirmed" chip and a "Search YouTube" button.
- YouTube playlists change over time. If something breaks, use the "Report it on GitHub" link in the footer, or fix it in `data/resources.js`.

## How it is built

- Plain HTML, CSS and JavaScript. There is no build step and no framework, so it runs on any static host.
- Python runs in the browser through Pyodide 0.29.5, loaded from `cdn.jsdelivr.net` the first time a learner presses Run (about 10–30 MB, then cached).
- Fonts come from Google Fonts: Rozha One, Mukta, Tiro Devanagari Sanskrit and JetBrains Mono.
- Labs are self-contained scripts in `assets/js/labs/`. Each one registers itself on `window.AILabs`.

## Credits

All videos and courses belong to their creators, including CampusX, Krish Naik, NPTEL and the IIT professors, Codebasics, StatQuest, 3Blue1Brown, Andrej Karpathy, Stanford, MIT, freeCodeCamp, Hugging Face, Kaggle and DeepLearning.AI. This site only links to and embeds their free public content. Please support them by watching on their channels.
