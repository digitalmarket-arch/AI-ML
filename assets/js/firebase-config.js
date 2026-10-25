/* Sign-in and cloud backup of progress (optional).
   Leave this as null to run the site without sign-in: progress then stays in each learner's browser.
   To switch sign-in on, follow "Turn on sign-in" in README.md and paste your Firebase web app config here, e.g.
   window.AIM_FIREBASE = { apiKey: "...", authDomain: "your-project.firebaseapp.com", projectId: "your-project", appId: "..." };
   These values are not secrets: they identify the project, and the Firestore security rules protect each learner's data. */
window.AIM_FIREBASE = null;
