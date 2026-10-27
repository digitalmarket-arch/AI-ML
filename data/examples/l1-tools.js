/* AI Marg lesson-card examples for one module (loaded with its lesson cards). JavaScript holding JSON. */
window.AIM = window.AIM || {};
window.AIM.examples = window.AIM.examples || {};
window.AIM.examples["l1-tools"] = {
 "overview": [
  {
   "title": "Riya's old laptop in Bhopal",
   "text": "Riya's laptop is five years old and slow. She opens Colab in Chrome and trains a small model on Google's free GPU. Her laptop only shows the page; the heavy work happens on Google's computer."
  },
  {
   "title": "Save points for a GST project",
   "text": "Arjun in Surat builds a GST calculator. He makes a commit after each step, like 'Add 18% GST' and 'Round to 2 decimals'. When a change breaks the totals, he goes back to yesterday's commit in seconds."
  },
  {
   "title": "A notebook as a lab record",
   "text": "Fatima, a B.Sc student in Hyderabad, studies her college team's batting scores in one notebook. It has a heading, the code, the chart it drew, and her note: 'We score more when chasing.' Her teacher sees the story and the proof together."
  },
  {
   "title": "GitHub link on a CV",
   "text": "Gurpreet from Ludhiana applies for a data job. Her CV links to GitHub, where three projects have clear front pages. The interviewer opens one, sees 40 small commits, and asks about her choices instead of basic questions."
  },
  {
   "title": "Terminal in a Chennai office",
   "text": "Lakshmi makes a monthly sales report. Instead of clicking through ten folders, she types `cd reports` in the terminal. Then one line, `python monthly.py`, runs the whole report."
  },
  {
   "title": "AI assistant as a tutor",
   "text": "Imran in Kolkata wants the 7 times table, from 7 × 1 to 7 × 10. But his loop (code that repeats steps) also prints 7 × 0. An AI assistant explains that `range(11)` starts at 0. He changes it to `range(1, 11)` himself and writes the reason in a Markdown note."
  }
 ],
 "outcomes": [
  {
   "title": "Switching on a GPU in Pune",
   "text": "Kavya's photo model (a program that learns from photos) trains very slowly in Colab on the normal chip. She opens Runtime > Change runtime type and picks a GPU. Colab gives her a fresh session (her turn on Google's computer), so she runs her cells again. Training now goes much faster."
  },
  {
   "title": "Markdown notes for a client",
   "text": "Dev in Bhubaneswar writes `## Step 1: Clean the sales data` above his first code cell. His client, who owns a kirana chain, reads the notebook like a short report and follows every step."
  },
  {
   "title": "VS Code for a bigger project",
   "text": "Sneha in Indore opens her bill-reader folder in VS Code. She opens the built-in terminal from the Terminal menu and types `python main.py`. She edits and runs the whole project from one window."
  },
  {
   "title": "A branch for a risky idea",
   "text": "Rahul's attendance app for a Kanpur school works well on main, the main version. He makes a branch called charts and tries a new monthly chart there. Once it works, he merges it. Main never broke."
  },
  {
   "title": "A README recruiters read",
   "text": "Aparna in Thrissur writes a README for her Onam sales project: the problem, the data, how to run it, and the result. A recruiter understands the project in one minute."
  },
  {
   "title": "Checking the AI's GST code",
   "text": "Nasreen in Aligarh asks an AI assistant for a function (a reusable piece of code) that adds 18% GST. She tests three amounts with known answers: ₹100 should give ₹118, ₹0 should give ₹0, and ₹99.50 should give ₹117.41. All three pass, so she uses it."
  }
 ],
 "studySteps": [
  {
   "title": "Ravi: one hour after office",
   "text": "Ravi works in a Noida office. Day 1: Colab, Kaggle and the GPU switch. Day 2: terminal and VS Code. Day 3: GitHub account and repo. Day 4: the Lab tasks. Day 5: the quiz and the first self-check task."
  },
  {
   "title": "Ananya: college lab computers",
   "text": "Ananya's college lab in Kolkata wipes its computers every evening. So she pushes her work to GitHub before she logs off. At home she runs `git pull`, which downloads her latest commits, and carries on."
  },
  {
   "title": "Sanjay: a train with no signal",
   "text": "Sanjay travels from Nashik to Mumbai with no mobile signal. On the train he edits files and runs `git add` and `git commit`, which need no internet. At the office, one `git push` sends every commit to GitHub."
  },
  {
   "title": "Meena: phone on weekdays",
   "text": "Meena, a homemaker in Madurai, watches the lessons on her phone in the afternoons. She keeps the terminal and Git practice for Sunday, when the family laptop is free."
  },
  {
   "title": "Kiran: weekend learner",
   "text": "Kiran works long weekdays in Bengaluru. On Saturday he watches all the lessons and does the Lab. On Sunday he practises the Git loop, takes the quiz, and pushes his Python notebooks."
  },
  {
   "title": "Zoya: a Windows laptop",
   "text": "Zoya in Lucknow uses Windows. In the Command Prompt she types `dir` instead of `ls`. Later she installs Git for Windows, which comes with Git Bash, a terminal where `ls` also works."
  }
 ],
 "keyTerms": [
  {
   "title": "Notebook for a Mysuru bakery",
   "text": "Shreya keeps her bakery's sales study in one Colab notebook. A Markdown cell asks, 'Which cake sells most on Sundays?' The code cell below draws a bar chart, and her note explains it."
  },
  {
   "title": "Free GPU for apple leaves",
   "text": "Arif in Srinagar trains a model on 5,000 photos of apple leaves. On his laptop's normal chip, it would take hours. In Colab he switches on a GPU, and the same work finishes much faster."
  },
  {
   "title": "Terminal at a Patna cyber café",
   "text": "Neha types `cd Desktop`, then `mkdir resume-project`, then `ls`. With three short commands she moves, makes a folder and checks it, without touching the mouse."
  },
  {
   "title": "Commit messages that help",
   "text": "Vikram in Vizag compares two histories. One says 'update', 'update2' and 'final'. The other says 'Add GST function' and 'Fix rounding to 2 decimals'. Only the second tells a reviewer what each commit changed."
  },
  {
   "title": "Branch and merge for a sale",
   "text": "A Surat sari shop's website code lives on main. Asha makes a branch called diwali-offer and adds a 10% discount banner. After testing it, she merges the branch into main the day before Diwali."
  },
  {
   "title": "A branch instead of copies",
   "text": "Mohan in Raipur used to copy his project as final, final2 and final-real. The copies had no history and were hard to combine. Now he makes a branch for each idea. One merge brings a good idea into main, and a failed idea is simply a deleted branch."
  },
  {
   "title": "A repo with a clear README",
   "text": "Joseph in Kochi has a repo named fish-price-forecast. Its README says what it predicts, which harbour prices it uses, how to run it, and its average error. A visitor knows in one minute what it does and how to run it."
  },
  {
   "title": "Git brings back a lost cell",
   "text": "Pooja in Ranchi deletes an important cell by mistake and saves the notebook. She committed an hour ago, so `git restore analysis.ipynb` brings the file back to how it was at that commit. Any other changes from that hour are undone too."
  }
 ],
 "indiaExample": [
  {
   "title": "India on GitHub",
   "text": "GitHub's yearly Octoverse report for 2025 says India added more than 5 million developers in one year. That was over 14% of all new GitHub accounts. A clear GitHub profile helps you stand out in that big crowd."
  },
  {
   "title": "Government prefers open source",
   "text": "In 2015, the Government of India issued a 'Policy on Adoption of Open Source Software'. It asks government offices to prefer open-source tools for new e-governance systems, which are online government services."
  },
  {
   "title": "Imagined news site in Vijayawada",
   "text": "Imagine a small news website in Vijayawada. Its team opens the IndicTrans2 Colab notebook to draft English-to-Telugu translations. An editor checks every line before it goes live, because a model can make mistakes (गलती, galti)."
  },
  {
   "title": "Imagined college club in Jaipur",
   "text": "Imagine a college AI club in Jaipur that sorts photos of blue pottery and block prints. Members train their photo model on Colab's free GPU. They keep the code in one shared GitHub repo, and each person works on a branch (a separate line of work)."
  },
  {
   "title": "Imagined freelancer in Guwahati",
   "text": "Imagine Bikash, a freelancer in Guwahati. His GitHub repo on tea auction prices has an 'Open in Colab' button in the README. A client in Kolkata runs it in two minutes and hires him for a bigger job."
  },
  {
   "title": "Imagined Kaggle notebook in Kochi",
   "text": "Imagine Anjali, a student in Kochi, studying monsoon rainfall on Kaggle. She verified her phone number to unlock the GPU. She makes the notebook public, so classmates can copy and edit it with one click."
  }
 ],
 "commonMistakes": [
  {
   "title": "A key pushed from a Pune hostel",
   "text": "Rohan pushed config.py, with his paid AI service key inside, to a public repo. Next morning, his account showed a bill of ₹18,000 for use he never made. Fix: he revoked the key, made a new one, and moved it to a .env file listed in .gitignore."
  },
  {
   "title": "Missing sales.csv in Ahmedabad",
   "text": "Priya uploaded sales.csv into Colab on Monday. On Tuesday her first cell failed with FileNotFoundError (Python's 'file not found' message), because Tuesday's fresh runtime did not have the file. Fix: she keeps the file in Google Drive and connects (mounts) Drive in the first cell."
  },
  {
   "title": "The 200 that should be 150",
   "text": "Anil in Nagpur ran the same cell twice while testing, so his total jumped from 150 to 200. He almost sent the wrong number to his manager. Fix: Restart & Run All before sharing any result."
  },
  {
   "title": "Wrong Python in Mangaluru",
   "text": "Divya installed pandas inside her project's .venv folder. VS Code still showed `ModuleNotFoundError: No module named 'pandas'`. Fix: Ctrl+Shift+P, then 'Python: Select Interpreter', then the .venv Python. Her script ran at once."
  },
  {
   "title": "AI code that dropped rows",
   "text": "Harish in Chandigarh used an AI's cleaning function (code that tidies data) on 2,000 customer rows. It ran with no error, but quietly removed 300 rows with blank phone numbers. Fix: he now counts rows before and after, and tests on a tiny table first."
  },
  {
   "title": "Five copies of one project",
   "text": "Leela in Bhopal had folders named final, final2, final-real and final-real-2. Nobody knew which one worked. Fix: one repo, with a branch for each idea, and clear commit messages."
  }
 ],
 "selfCheck": [
  {
   "title": "Task 1: a sample README",
   "text": "Riya's README lists each notebook in one line. 'gst.ipynb: adds 18% GST to a bill and prints the total.' 'cricket.ipynb: finds a batter's average from 10 innings.' Short, plain lines are enough."
  },
  {
   "title": "Task 2: the commands",
   "text": "`git init -b main` starts tracking, on a branch called main. `git add notes.txt` and `git commit -m \"first version\"` make the first save. `git switch -c experiment` starts the branch. Edit notes.txt, then run `git commit -am \"try idea\"`: -a takes every changed file Git already tracks, and -m adds the message. Last, `git switch main` and `git merge experiment`."
  },
  {
   "title": "Task 2: a surprise to expect",
   "text": "After `git switch main`, notes.txt shows the first version again. Do not worry: your edit is safe on experiment. It reaches main only after `git merge experiment`."
  },
  {
   "title": "Task 3: what you should see",
   "text": "The first time, Colab asks to connect to your GitHub account. After you save a copy, open the repo on GitHub. You should see a new commit with the message you typed."
  },
  {
   "title": "Task 4: a sample finding",
   "text": "Karthik's assistant said `round(2.5)` gives 3. He tested it in Python and got 2, because Python rounds an exact half to the nearest even number. He noted the mistake and the test that proved (साबित किया, saabit kiya) it."
  },
  {
   "title": "Task 4: how to check a claim",
   "text": "Say the assistant claims a line 'removes blank rows'. Make a tiny table of 5 rows with 2 blanks, run the line, and count. You should get 3 rows left."
  }
 ]
};
