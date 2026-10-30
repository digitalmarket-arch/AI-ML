# AI Marg — Hinglish Writings & Tuned Audio Read-Aloud

Add a per-card Hinglish reading mode and Hinglish-tuned browser speech synthesis across the entire AI Marg platform—covering module lesson cards, Indian examples, key terms, quizzes, level tests, coding exercises, interactive labs, tough projects, glossary entries, and study guides.

## User Review & Critical Decisions

> [!IMPORTANT]
> Please review the confirmed product decisions below before we proceed to build.

- **Confirmed Decision 1 — Full-Site Content Coverage**: Every readable section across the platform—including module lesson cards, examples, key terms, quizzes, level tests, coding exercises, projects, interactive labs, glossary terms, and guide pages—will support Hinglish text and audio read-aloud.
- **Confirmed Decision 2 — Per-Card Toggle Next to Listen**: Every card, question, term, project section, and lab brief will display a dedicated `Hinglish` toggle button right beside its `Listen` audio button, plus a convenient batch toggle on multi-card views (such as module overviews and page headers) to switch all cards on the current view at once.
- **Confirmed Decision 3 — Browser Speech Engine Tuned for Hinglish**: The read-aloud player will use the device's built-in Web Speech API tuned specifically for Hinglish phonetics and Indian English / Hindi voices, working 100% free and offline without external API keys.

---

## 1. Overview & Core Concept

- **What It Does**: Lets learners switch any reading card, quiz question, lab guide, exercise prompt, project brief, or glossary definition between plain English and natural conversational Hinglish (Roman Hindi + English technical terms) with a single click, and listen to either version read aloud with natural Indian pronunciation.
- **Target Audience / Persona**: Indian learners who are comfortable with English technical terms (such as *gradient descent*, *overfitting*, *DataFrame*, or *embeddings*) since code and interviews use English, but absorb conceptual explanations, everyday analogies, and problem statements much faster in conversational Hinglish.
- **Key Value**: Removes language friction across every learning activity—reading, watching, experimenting in labs, coding, testing, and building projects—while keeping technical vocabulary and Python code untouched.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Per-Card Hinglish Toggle**: Next to every `Listen` button on a lesson card, key term, quiz question, lab task panel, exercise prompt, project section, or glossary item, the learner sees a compact `Hinglish` toggle button.
  2. **Instant In-Place Switch**: Clicking `Hinglish` immediately converts the prose, examples, callouts, and hints inside that card into conversational Hinglish while preserving inline code (`code`), code blocks, mathematical formulas, and interactive controls. The button shows an active state (`Hinglish ✓` / `aria-pressed="true"`), and clicking it again restores the original English text.
  3. **Page / Deck Batch Toggle**: In the module reading progress bar and top header bar, a companion toggle lets learners switch all cards on the current page to Hinglish (or back to English) in one click.
  4. **Seamless Audio Read-Aloud**: Clicking `Listen` on a card (or in the top bar) reads whichever version—English or Hinglish—is currently displayed on screen. If the learner toggles a card to Hinglish while the audio player is actively reading it, the speech engine immediately continues reading that paragraph in Hinglish.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Matches AI Marg's existing Indian editorial identity—clean, warm, high-contrast academic clarity with zero visual clutter.
  - *Color Palette & Mood*: Uses the existing semantic CSS tokens (`--indigo` `#2d388a` / `#a3adff` for primary interactive focus, `--haldi` `#c99200` / `#f3b91d` and `--haldi-soft` for active Hinglish state indicators, `--surface` and `--bg` for clean light/dark card surfaces).
  - *Typography & Hierarchy*: Retains `Rozha One` for display headings, `Mukta` for body prose and Devanagari script support, and `JetBrains Mono` for Python code and numerical metrics.
  - *Component Styling & Layout*: Compact single-line button pairing (`Hinglish` + `Listen`) inside card headers and action bars. On projects, exercises, and labs that previously lacked a per-card `Listen` button, both `Hinglish` and `Listen` controls are added as a unified pair.
- **Interactive Feedback & Motion**:
  - Instant (<50ms) text swap with zero layout shift.
  - Active paragraph highlighting (`.tts-on`) during audio playback tracks the Hinglish text blocks accurately and auto-scrolls smoothly (respecting `prefers-reduced-motion`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Hybrid Curated + Rule-Based Hinglish Engine**
  - *Chosen Approach*: Combine curated Hinglish translations for high-visibility module overviews, headings, and common learning prompts with a deterministic, context-aware Hinglish transformation engine that converts all 27 modules, 1,204 examples, 350 quiz questions, 81 exercises, 18 projects, 27 labs, and 180 glossary terms while protecting `<code>`, `<pre>`, SVG diagrams, and technical terms.
  - *Why*: Ensures 100% coverage across every single card, quiz option, hint, project milestone, and lab task on the entire site without breaking existing progress tracking, search indexing, or data validation checks.
  - *Alternatives Considered*: Duplicating every data file into separate static copies was rejected because it would double the initial download size for mobile learners on slow data connections.
- **Decision 2: Phonetic Hinglish Speech Normalization in the Browser Player**
  - *Chosen Approach*: Enhance the Web Speech API pipeline with a phonetic Hinglish preprocessor and Indian voice selector (`en-IN` and `hi-IN`). When reading Hinglish text, Roman Hindi words (such as *hai, hain, mein, kyunki, samajh, dekho, isliye, उदाहरण*) are mapped to phonetic/Devanagari pronunciations so `en-IN` and `hi-IN` voices read them naturally instead of spelling or mispronouncing them with a Western accent.
  - *Why*: Delivers natural-sounding Hinglish audio offline and at zero cost on Android, iOS, and desktop browsers.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        AI Marg Client Application                          │
├─────────────────────────────────────┬──────────────────────────────────────┤
│     Hinglish Text Engine            │      Tuned Audio Speech Engine       │
│  ┌───────────────────────────────┐  │  ┌────────────────────────────────┐  │
│  │ Curated Module & UI Lexicon   │  │  │ Voice Selector (en-IN / hi-IN) │  │
│  ├───────────────────────────────┤  │  ├────────────────────────────────┤  │
│  │ Context-Aware Prose Converter │  │  │ Hinglish Phonetic Normalizer   │  │
│  │ (Preserves Code, Math & Links)│  │  │ (Roman Hindi → Natural Speech) │  │
│  └──────────────┬────────────────┘  │  └───────────────┬────────────────┘  │
│                 │                   │                  │                   │
│                 ▼                   │                  ▼                   │
│  ┌──────────────────────────────────┴───────────────────────────────────┐  │
│  │           Unified Per-Card Action Bar (Hinglish + Listen)            │  │
│  └──────┬───────────────────┬──────────────────┬─────────────────┬──────┘  │
│         │                   │                  │                 │         │
│         ▼                   ▼                  ▼                 ▼         │
│  ┌─────────────┐     ┌─────────────┐    ┌─────────────┐   ┌─────────────┐  │
│  │ Lesson Cards│     │  Quizzes &  │    │  Projects & │   │  Glossary & │  │
│  │ & Examples  │     │ Level Tests │    │ Coding Ex.  │   │ Study Labs  │  │
│  └─────────────┘     └─────────────┘    └─────────────┘   └─────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - **Per-Card DOM State**: Each readable container (`[data-hl-box]`) caches its original English HTML (`data-en-html`) on first toggle and marks its current language state (`data-hl-on="1"`), allowing instant toggling back and forth without re-rendering interactive child widgets (like Python editors, quiz radio buttons, or lab canvases).
  - **Learner Preference & Audio Bar Integration**: The bottom audio player bar (`#tts-bar`) displays whether it is currently reading in English or Hinglish and includes a quick toggle inside the player bar so learners listening hands-free can switch the active reading language on the fly.
- **Interactive Component & State Mapping**:
  - **Lesson Cards, Key Terms & Examples**: Each `.read-card` and `.gloss-term` gets the paired `Hinglish` + `Listen` buttons; the "Lesson cards read" summary bar gets a "Hinglish for all cards" button.
  - **Quizzes & Level Tests**: Each question header (`.quiz`) and post-test review item includes `Hinglish` + `Listen` to toggle the question stem, options, and answer explanation.
  - **Projects, Exercises & Labs**: Project brief/milestone/rubric cards, Python exercise prompt boxes, and interactive lab headers/task lists receive the paired `Hinglish` + `Listen` buttons so every section of the site supports both Hinglish reading and audio.
  - **Glossary, Career, Start Here & Study Room**: All static guide sections, FAQ items, flashcards, and Study Room reflection/review cards integrate the same per-card `Hinglish` + `Listen` controls.
