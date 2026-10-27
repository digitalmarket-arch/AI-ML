/* AI Marg lesson-card examples for one module (loaded with its lesson cards). JavaScript holding JSON. */
window.AIM = window.AIM || {};
window.AIM.examples = window.AIM.examples || {};
window.AIM.examples["l4-research-career"] = {
 "overview": [
  {
   "title": "Pass 1 on a local train",
   "text": "Arjun travels from Thane to CST every day. On the train, he gives one arXiv paper (from the free research website) a first pass. He reads the title, abstract, introduction and conclusion, and glances at the figures. It takes about 10 minutes. Most days he drops the paper, and about once a month one earns a second pass at home."
  },
  {
   "title": "Reproducing in Coimbatore",
   "text": "Lakshmi, an engineering student in Coimbatore, runs a paper's released code in Colab, Google's free online notebook. The paper says 81.0% accuracy, meaning 81 right answers in 100; she gets 80.6%. The appendix shows the paper used a different data split (which rows go to training and which to testing). She writes this down as the likely reason for the gap."
  },
  {
   "title": "Planning a clinic bot",
   "text": "Imagine a Lucknow clinic chain that wants a WhatsApp bot. Before choosing any model, Fatima asks: which questions, which languages, and how fast must it reply? Then she plans the data, model, testing, launch, monitoring and a monthly cost in ₹."
  },
  {
   "title": "One live project, many questions",
   "text": "Gurpreet in Ludhiana has 20 course certificates and no interview calls. He builds one live project: a mandi price predictor with a clear README (the project's front page) and a demo link. In his next interview, the panel spends 15 minutes asking about that project alone."
  },
  {
   "title": "Depth from an IIT course",
   "text": "Meera in Kolkata follows an NPTEL deep learning course taught by IIT faculty. She does every weekly assignment herself instead of only watching. Six weeks later, she can explain in an interview how a neural network (layers of simple maths units) learns from its mistakes, step by step."
  },
  {
   "title": "A freelance invoice in Pune",
   "text": "Rahul, a freelancer in Pune, builds a chatbot for a Pune jeweller for ₹50,000. He is registered for GST (goods and services tax), so his invoice adds 18% GST: ₹59,000 in total. He pays the ₹9,000 of GST to the government, so it is not his income."
  }
 ],
 "outcomes": [
  {
   "title": "A one-page note at work",
   "text": "After this module, Divya reads a new paper in three passes. It is about RAG chatbots, which look up documents before they answer. Her one-page note covers the problem, the method, the main result and one limit. Her team lead reads it in two minutes and decides to try the idea."
  },
  {
   "title": "Explaining a gap",
   "text": "Karthik tries to reproduce a paper's score of 76.0 and gets 75.2. He writes: 'I used 2,000 test sentences, not all 10,000, and an older model version.' His manager now understands both numbers and trusts his report."
  },
  {
   "title": "UPI fraud interview question",
   "text": "In an interview, Ananya must design fraud detection for a UPI app. First she asks questions. What counts as fraud? How fast must we decide? Which past cases are labelled (marked fraud or genuine)? Only then does she choose features (the input columns) and a model. The interviewer notes her clear, step-by-step thinking."
  },
  {
   "title": "A quick traffic sum",
   "text": "Imran's app expects 50 lakh daily users, each making 10 requests a day. In Python, `50_00_000 * 10 / 86_400` gives 578.7, or about 579 requests a second. The underscores only make big numbers easy to read. With a busiest hour 3 times the average, he plans servers for about 1,736 a second."
  },
  {
   "title": "Choosing a university course",
   "text": "Sneha wants depth in language models. She picks Stanford CS224N, whose lecture videos are free on YouTube, and keeps Sunday mornings for its assignments. She builds a small translation model herself instead of only watching the lectures."
  },
  {
   "title": "Pricing a chatbot job",
   "text": "Vikram offers a Surat textile shop a RAG chatbot for ₹60,000, plus ₹5,000 a month for upkeep. He is GST-registered, so he adds 18% GST to both. The build fee becomes ₹60,000 + ₹10,800 = ₹70,800. His written scope lists exactly what is included."
  }
 ],
 "studySteps": [
  {
   "title": "One hour after office",
   "text": "Suresh, a bank clerk in Kanpur, has one free hour each evening. Monday: the paper-reading video. Tuesday and Wednesday: 'Attention Is All You Need' in passes. Thursday: his one-page summary. Friday: he starts running a paper's code."
  },
  {
   "title": "B.Tech student with Colab",
   "text": "Anjali, a B.Tech student in Kochi, runs a paper's code on a free Colab GPU (a fast chip for training) using only 10% of the data. Training takes about 2 hours, not 20. She writes her score next to the paper's and notes that she used only 10% of the data."
  },
  {
   "title": "Homemaker in short breaks",
   "text": "Shabana in Hyderabad studies in 30-minute breaks. One break goes to the system design video. In the next two breaks, she drafts the RAG support bot design for a saree brand. A final break goes to checking her monthly cost sum."
  },
  {
   "title": "Weekend learner in Bengaluru",
   "text": "Naveen in Bengaluru studies only on Saturday and Sunday. Saturday: the paper videos, one paper and the Lab tasks on seed luck. Sunday: both design documents and the quiz. After this level, he plans to follow his chosen university course on Sunday mornings."
  },
  {
   "title": "Slow internet in Shillong",
   "text": "Daphi in Shillong downloads paper PDFs and lecture slides when the network is good. She reads offline in three passes, with patience (धैर्य, dhairya). When she reaches the library Wi-Fi, she runs the paper's code in Kaggle."
  },
  {
   "title": "Quiz score below 70%",
   "text": "Kiran scores 60% on the quiz. Most of her misses are about seeds and fair baselines. She redoes the Lab tasks, reads the Common mistakes card again, then retakes the quiz and scores 80%."
  }
 ],
 "keyTerms": [
  {
   "title": "An arXiv number decoded",
   "text": "A friend sends Riya 'arXiv 2305.16307'. The 2305 tells her it was posted in May 2023. She opens the IndicTrans2 paper and checks if it later passed peer review. It did: the journal TMLR published it."
  },
  {
   "title": "Ablation in a chatbot",
   "text": "Arjun's bot improved after he added re-ranking (sorting search results a second time) and a new prompt, the instruction text sent to the model. He removes one change at a time. Without re-ranking, correct answers fall from 88% to 87%. Without the new prompt, they fall to 79%. The prompt did most of the work."
  },
  {
   "title": "A weak baseline",
   "text": "A start-up says its loan model beats logistic regression (a simple classic model) by 6 points. Fatima sees the old model got only 3 of the 20 columns. Given all 20 columns, the baseline gains 5 points. So the real gain is only about 1 point."
  },
  {
   "title": "Latency for a food app",
   "text": "Imagine a Chennai food app that must show suggestions within 300 ms. Picking 500 likely restaurants takes 40 ms, ranking them takes 150 ms, and the network takes 80 ms. That is 270 ms in total: inside the budget, with 30 ms to spare."
  },
  {
   "title": "A portfolio project with numbers",
   "text": "Priya's portfolio has three live projects. One reads Marathi shop bills with OCR (software that reads printed words from a photo). Its README says: 'Reads 92 of 100 test bills correctly; fails on faded paper.' Recruiters can try it themselves."
  },
  {
   "title": "GSTIN and LUT on one invoice",
   "text": "Gopal, a GST-registered developer in Jaipur, bills a London client ₹1,50,000. His invoice shows his GSTIN and says the work is an export under a LUT. So it carries 0% IGST instead of ₹27,000."
  },
  {
   "title": "Reproducing with seeds",
   "text": "Ayesha reruns a paper's code with three seeds and gets 74.1, 74.8 and 74.5. The paper reports 74.6, which sits inside her range. She writes 'reproduced' in her notes, with all three numbers."
  }
 ],
 "indiaExample": [
  {
   "title": "A Maithili test in Darbhanga",
   "text": "Imagine Aman, a student in Darbhanga, runs IndicTrans2 on 100 Maithili sentences from IN22. His score is a bit below the paper's. He notes that 100 sentences is a small slice, so its score jumps around more. Then he reruns on the full Maithili set."
  },
  {
   "title": "Airavata reuses the model",
   "text": "AI4Bharat's Hindi chat model Airavata was built on Sarvam AI's OpenHathi model. For Hindi training data, the team translated good English instruction datasets (instructions paired with good answers) into Hindi with IndicTrans2. One released model became a tool for the next project."
  },
  {
   "title": "Two kinds of test sets",
   "text": "IN22 comes in two parts. IN22-Gen has general sentences from Wikipedia and other websites, on topics like news, culture and law. IN22-Conv has everyday conversation. Scoring on both shows whether a model handles chat-style Tamil or Odia as well as written text."
  },
  {
   "title": "An open licence for agencies",
   "text": "The IndicTrans2 models use the MIT licence, which allows business use. Imagine a Guwahati agency translating a tea estate's FAQ into Assamese with it. The agency still asks a native speaker to check 50 lines before going live."
  },
  {
   "title": "Checked after the preprint",
   "text": "IndicTrans2 first appeared on arXiv in May 2023 as a preprint, a paper shared before expert checks. It was later published in the journal TMLR (Transactions on Machine Learning Research) after peer review, so outside experts have checked it."
  },
  {
   "title": "A college club in Pune",
   "text": "Imagine a Pune college AI club with five members. They split the 22 languages between them, and each runs the released model on a slice of IN22 in Colab. They collect all scores in one shared sheet, next to the paper's numbers."
  }
 ],
 "commonMistakes": [
  {
   "title": "Stuck on page 3",
   "text": "Neha starts every paper at line one and stops at the maths on page 3. Three weeks pass with no paper finished. She switches to pass 1: 10 minutes each. Now she sorts five papers a week and reads one deeply each month."
  },
  {
   "title": "A Titanic-copy portfolio",
   "text": "Rohan's GitHub has Titanic, MNIST and a PDF chatbot, all copied from tutorials. Recruiters skip it. He builds a Hindi complaint sorter for a Bhopal cable operator, with names removed from real messages. Its README says: 'Sorts 87 of 100 complaints correctly.'"
  },
  {
   "title": "The lucky seed",
   "text": "Deepak's new method beats the baseline by 0.8 points on seed 0. Across five seeds, the mean gap is only 0.1, and the spread between runs is 0.5. He drops his claim and writes 'no clear gain' in his report."
  },
  {
   "title": "Tuning only one side",
   "text": "Sana tunes her model 100 times but runs the baseline once with default settings. Her gap is 4 points. When she gives the baseline the same 100 tries, the gap shrinks to 1 point, a much more honest (ईमानदार, imaandaar) result."
  },
  {
   "title": "The test set used for tuning",
   "text": "Kabir picks his model's settings by checking test accuracy, the share of right answers on the test set, each time. His final 91% is too hopeful. He now picks settings on a separate validation set and checks the test set only once, at the end: 88%."
  },
  {
   "title": "Late GST registration",
   "text": "Anil, a freelancer in Indore, bills clients ₹24 lakh in a year but never registers for GST. His CA tells him he crossed the ₹20 lakh limit months ago. He registers late, and with the CA's help he pays the missed GST plus interest."
  },
  {
   "title": "A chatbot with no scope",
   "text": "A Kochi agency builds a chatbot on a phone-call promise. The client keeps adding 'small' features for two months. Next time, the written scope says: three FAQ topics, English and Malayalam, one round of changes. Extra work gets a new price."
  }
 ],
 "selfCheck": [
  {
   "title": "Pass 1 hint for LoRA",
   "text": "In pass 1, read only the title, abstract, introduction and conclusion, and glance at the figures and headings. You should then be able to say the problem in one line, for example 'fully fine-tuning a huge model costs too much'. Save the key idea for your pass 2 notes."
  },
  {
   "title": "Writing a useful limitation",
   "text": "A weak limitation says 'needs more work'. A useful one is specific, such as 'all tests are in English, so it may not work for Hindi'. Pick one that the paper itself admits, or one you noticed yourself."
  },
  {
   "title": "Reporting a reproduced score",
   "text": "A sample line, with made-up numbers: 'Paper: 62.1 on Hindi to English. Mine: 61.4 on 200 IN22 sentences, with the same released model. My slice is small, which may explain the 0.7 gap.' Give the number, the setup and a reason."
  },
  {
   "title": "A clinic bot cost sum",
   "text": "Say 50 clinics get 40 questions a day each: 2,000 a day, or about 60,000 a month. At ₹0.25 per answer, the LLM (the text-writing AI model) costs ₹15,000 a month. Add a server at about ₹3,000. The bot then costs about ₹18,000 a month."
  },
  {
   "title": "The privacy part",
   "text": "A good answer says: collect only what the bot needs, and take the patient's consent first. Never send full medical records to an outside LLM. Let a doctor handle anything urgent, and keep the monitoring logs safe."
  },
  {
   "title": "A two-minute pitch",
   "text": "Sample: 'Problem: a Nagpur coaching centre missed WhatsApp questions at night. Approach: a RAG bot over its fee and timetable pages. Result: 80 of 100 test questions answered correctly, in 5 seconds each. Next: add Marathi.'"
  },
  {
   "title": "An offer page outline",
   "text": "Scope: a WhatsApp FAQ chatbot for one clinic. Timeline: 3 weeks. Client gives: its FAQs and a WhatsApp Business number. Price: ₹40,000 + 18% GST = ₹47,200. Upkeep: ₹4,000 a month + GST."
  }
 ]
};
