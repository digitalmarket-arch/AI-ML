/* AI Marg lesson-card examples for one module (loaded with its lesson cards). JavaScript holding JSON. */
window.AIM = window.AIM || {};
window.AIM.examples = window.AIM.examples || {};
window.AIM.examples["l3-mlops"] = {
 "overview": [
  {
   "title": "Lead scores for a Pune agency",
   "text": "Imagine a Pune property agency. Its CRM sends each new enquiry to a lead-scoring API and gets back a score like 0.82. Sales staff call the highest scores first. The model helps only because it is deployed."
  },
  {
   "title": "Lakshmi's milk order in Madurai",
   "text": "Lakshmi's model predicts tomorrow's milk sales for her kirana shop. In a notebook, only her nephew could run it. Deployed behind an API, her billing app shows 'order 40 packets' every evening."
  },
  {
   "title": "Diwali surprise for a gift shop",
   "text": "Imagine an online gift shop in Jaipur. Its fraud model learned from July orders. In Diwali week, big orders are normal, so the model flags many genuine buyers. Monitoring the average order value catches this early."
  },
  {
   "title": "Same box on two laptops",
   "text": "Arjun's API needs Python 3.11 and one exact version of scikit-learn, a Python ML library. His teammate in Guwahati has older versions and gets errors. Inside a Docker container, both laptops run exactly the same setup."
  },
  {
   "title": "Which run made this model?",
   "text": "Fatima trained 12 versions of an onion-price model in Nashik. Months later, a client asks which settings made the live one. MLflow shows run 9 with its settings and score, and DVC shows the exact data it used."
  },
  {
   "title": "A broken change stopped",
   "text": "A teammate in Kolkata edits the text-cleaning code and breaks it. GitHub Actions runs the tests on his change and shows a red cross. The bug never reaches the live WhatsApp bot."
  }
 ],
 "outcomes": [
  {
   "title": "Riya's complaint API",
   "text": "Riya in Kochi wraps her complaint classifier in FastAPI. A support app sends `{\"text\": \"Refund not received\"}` to `/predict` and gets back `{\"label\": \"refund\"}`. A request with no text gets a clear error, not a crash."
  },
  {
   "title": "Arjun's leaf photo demo",
   "text": "Arjun in Patna builds a Gradio page for his crop-disease photo model in 30 lines. A farm helper uploads a leaf photo from a phone. The page shows 'leaf blight, 87% sure'."
  },
  {
   "title": "Fatima's container test",
   "text": "Fatima's API runs on her laptop but fails on her friend's. She writes a Dockerfile and builds an image. Now both laptops run the same container, with the same Python version and libraries."
  },
  {
   "title": "Gurpreet picks the best run",
   "text": "Gurpreet logs 6 runs of his unpaid-loan model in MLflow, each with a different tree depth. He sorts the runs by score on the MLflow page. Depth 6 wins with accuracy 0.87, so he keeps that run's model."
  },
  {
   "title": "Lakshmi's monthly data",
   "text": "Lakshmi in Chennai updates her 3 GB mandi price data every month. With DVC, each Git commit (a saved snapshot of the project) points to that month's data. She can bring back March's exact data with `git checkout` and then `dvc checkout`."
  },
  {
   "title": "Imran's red cross",
   "text": "Imran's GitHub Actions workflow runs `pytest` on every push. A teammate's change breaks the text-cleaning function. GitHub shows a red cross on the change before it reaches users."
  },
  {
   "title": "Meera's Monday check",
   "text": "Meera in Pune checks her dashboard: errors 0.2%, response time 120 ms. But the average order is ₹1,450, against ₹885 in training. The drift alert tells her to look closer."
  }
 ],
 "studySteps": [
  {
   "title": "One hour after office",
   "text": "Venkatesh, a bank clerk in Vijayawada, has one free hour a day. Day 1: the FastAPI endpoint. Day 2: a Gradio Space. Days 3 and 4: Docker. Day 5: MLflow and DVC. Weekend: CI and the drift lab."
  },
  {
   "title": "Laptop with little memory",
   "text": "Nandini's college laptop in Raipur has only 4 GB of RAM, and Docker Desktop runs very slowly on it. She opens GitHub Codespaces in her browser and builds the container there instead."
  },
  {
   "title": "Homemaker with short breaks",
   "text": "Shanthi in Tiruchirappalli studies in 30-minute breaks. One break is for a lesson, the next for five lines of her Gradio app. She logs every MLflow run, so later breaks can compare them."
  },
  {
   "title": "Weekend learner in Nagpur",
   "text": "Aditya studies only on Saturday and Sunday. On Saturday evening he deploys a rough FastAPI app on Render, as the tip suggests. On Sunday he adds MLflow, DVC and a test workflow, with patience (धैर्य, dhairya) for the errors."
  },
  {
   "title": "Slow internet in Leh",
   "text": "Stanzin's mobile data is slow, and a Docker image with ML libraries can be hundreds of MB. She builds images in GitHub Codespaces, so the big downloads happen on GitHub's side, not on her phone plan."
  },
  {
   "title": "Second try at the quiz",
   "text": "Babita scores 60% on the quiz. Most mistakes are about Docker layers (the saved steps of a Docker build) and drift checks. She rewatches the Docker lesson, redoes the drift lab, and scores 80% the next day."
  }
 ],
 "keyTerms": [
  {
   "title": "Lab report API in Bhopal",
   "text": "Imagine a Bhopal diagnostic lab. Its app sends a blood report as JSON to a FastAPI endpoint, a web address that answers requests. The API replies `{\"recheck\": true}` in about 80 ms. That short wait is the latency."
  },
  {
   "title": "Tamil speech demo by tomorrow",
   "text": "Priya's manager wants a free page where colleagues upload a Tamil audio clip and see the text. A Gradio app on a Hugging Face Space does it in an afternoon. A full website or Kubernetes (a system for running many containers) would be far more work than a demo needs."
  },
  {
   "title": "Same image, two laptops",
   "text": "Karthik builds one Docker image and his teammate runs it in Hyderabad. Both get the same answers. Docker does not make the model more accurate, and it does not replace a GPU (a fast AI chip)."
  },
  {
   "title": "MLflow and DVC together",
   "text": "Gurpreet's MLflow page in Ludhiana shows run 2 was best, with accuracy 0.87. Its Git commit holds the `.dvc` file for the March data. Running `git checkout` and then `dvc checkout` brings back that exact code and data."
  },
  {
   "title": "Why not just Git?",
   "text": "Anil tries to put 5 GB of photos straight into Git. Git has no 1 MB limit and can store them, but every copy of the project then carries all old versions, so it gets slow and huge. DVC keeps only a small pointer in Git."
  },
  {
   "title": "Puja orders in Kolkata",
   "text": "Imagine a Kolkata sweet shop's order model, trained on July orders. In Durga Puja week, orders get much bigger. That is data drift: the live inputs no longer look like the training data, so its predictions there are closer to guesses."
  },
  {
   "title": "Red cross before the merge",
   "text": "Divya opens a *pull request* (a request to add her change to the main code). CI/CD runs the tests and one fails. A branch protection rule (a GitHub setting that guards the main code) blocks the merge until she fixes it."
  },
  {
   "title": "Slow first click on Render",
   "text": "Arjun's free Render app sleeps after 15 idle minutes. The first visitor after lunch waits while it wakes up. After that, latency is back to about 100 ms."
  }
 ],
 "indiaExample": [
  {
   "title": "Hearing a Marathi sentence",
   "text": "On the Indic Parler-TTS demo page, you can type a Marathi sentence and describe the voice in words. The Gradio page sends it to the model and plays the audio. No setup is needed."
  },
  {
   "title": "A form in Odia",
   "text": "Imagine a state department in Odisha. Its website calls a translation API, so a long form in English also appears in Odia. The website team never trains a model themselves."
  },
  {
   "title": "Bank FAQ bot in Kochi",
   "text": "Imagine a Kochi bank's WhatsApp bot. It sends each Malayalam question to a translation API, finds the answer, and translates the reply back. One API serves the bot, the website and the branch kiosk."
  },
  {
   "title": "Saree demand in Surat",
   "text": "Imagine a Surat textile trader. Their billing software calls a FastAPI endpoint each night. It sends the day's sales and gets back how many sarees of each design to order."
  },
  {
   "title": "Student demo in Indore",
   "text": "Imagine Aisha, a student in Indore. She puts her Hindi handwritten-digit model on a Gradio Space. She shares the link in her class group, and 40 classmates try it the same evening."
  },
  {
   "title": "Wedding season loans in Delhi",
   "text": "Imagine a Delhi lender's loan model trained on summer data. In the wedding season, loan amounts jump. A weekly check of the average loan amount raises an alert before repayment results arrive."
  }
 ],
 "commonMistakes": [
  {
   "title": "Four seconds per answer",
   "text": "Vikram's loan API in Indore runs `joblib.load` inside `predict()`. Every request takes about 4 seconds. He moves the line to the top of the file. Now the model loads once, and each answer takes about 60 ms."
  },
  {
   "title": "Empty message crashes the bot",
   "text": "Sana's WhatsApp bot crashes when a user sends a sticker with no text. She adds a Pydantic model with `text: str = Field(min_length=1)`. Now a missing or empty message gets a clear 422 error."
  },
  {
   "title": "Demo asleep at the meeting",
   "text": "Sneha in Hyderabad shares a free Render link. The client opens it after lunch and waits while it wakes up. For the real job, she quotes an always-on server at ₹2,000 a month. She is GST-registered, so she adds 18% GST (₹360): ₹2,360 in all."
  },
  {
   "title": "Ten-minute rebuilds",
   "text": "Rohit's Dockerfile copies the whole project before `pip install`. Each one-line fix means a 10-minute rebuild. He copies `requirements.txt` and installs first. Now a code edit rebuilds in seconds."
  },
  {
   "title": "Every borrower scores the same",
   "text": "Neha's API fits a new `StandardScaler` on each request. Incomes of ₹20,000 and ₹80,000 both become 0, so every borrower looks identical. She loads the scaler fitted on training data (average ₹50,000, spread ₹20,000), and the values become −1.5 and +1.5."
  },
  {
   "title": "Waiting six months for answers",
   "text": "A Chennai NBFC (a non-banking lender) learns which borrowers failed to repay only 6 months later. So each week it compares live loan amounts and predicted risk scores with the training data. Drift shows up within weeks, not months."
  }
 ],
 "selfCheck": [
  {
   "title": "A curl line that works",
   "text": "Example: `curl -X POST http://localhost:8000/predict -H \"Content-Type: application/json\" -d '{\"text\": \"late delivery\"}'`. Here `localhost:8000` means your own computer, at port 8000. The `-X POST` part makes it a request that sends data. The `-H` part says the data is JSON (a simple text format for data), and `-d` is the data itself."
  },
  {
   "title": "Notes from three testers",
   "text": "Sample notes: 'Empty box gave an error page. A 12 MB photo froze it. A Hinglish sentence got a wrong label.' A good fix: check the input and show 'Please type at least 3 words'."
  },
  {
   "title": "Why run 4 won",
   "text": "Sample answer: 'Run 4 had the best test accuracy, 0.87. Run 6 scored 0.88 on training data but only 0.81 on test data, which it never saw in training. It overfit (रट्टा मारना, ratta maarna): it learned the training data by heart. Run 4 is also smaller and answers faster.'"
  },
  {
   "title": "A test that fails on purpose",
   "text": "Write `assert clean(\"Hello!!\") == \"hello\"` in a test file; `assert` stops with an error if the two sides differ. Then break `clean()` so it keeps the '!!', and push the change. A red cross in the Actions tab shows that CI (the automatic test run) caught it."
  },
  {
   "title": "PSI by hand, two bands",
   "text": "Training: 50% small loans, 50% big. Live: 30% and 70%. Each band adds (live − training) × ln(live ÷ training). Small: −0.2 × ln(0.6) = −0.2 × −0.51 ≈ 0.10. Big: 0.2 × ln(1.4) = 0.2 × 0.34 ≈ 0.07. Total 0.17: a moderate shift."
  },
  {
   "title": "Writing the alert",
   "text": "Sample alert: 'Each Monday, compute PSI for loan amount and income. If any PSI is above 0.25, or the average loan is 20% above training, email the team to check the model.'"
  }
 ]
};
