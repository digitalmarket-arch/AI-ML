/* Sign-in and cloud backup of progress (optional).
   Leave this as null to run the site without sign-in: progress then stays in each learner's browser.
   To switch sign-in on, follow "Turn on sign-in" in README.md and paste your Firebase web app config here, e.g.
   window.AIM_FIREBASE = { apiKey: "...", authDomain: "your-project.firebaseapp.com", projectId: "your-project", appId: "..." };
   These values are not secrets: they identify the project, and the Firestore security rules protect each learner's data. */
window.AIM_FIREBASE = null;

/* Optional AI help (Gemini through Firebase AI Logic) for signed-in learners.
   Switch it on only after enabling Firebase AI Logic with the Gemini Developer API in the Firebase console
   (see README.md > "Turn on AI help"). Every learner gets a few AI replies a day; the free tier is shared by the whole site. */
window.AIM_AI = { enabled: false, model: "gemini-2.5-flash-lite", dailyPerPerson: 10, appCheckSiteKey: "", appCheckProvider: "enterprise" };
