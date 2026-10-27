/* AI Marg lesson-card examples for one module (loaded with its lesson cards). JavaScript holding JSON. */
window.AIM = window.AIM || {};
window.AIM.examples = window.AIM.examples || {};
window.AIM.examples["l4-llm-apps"] = {
 "overview": [
  {
   "title": "Clinic bot in Pune",
   "text": "A patient asks a clinic's WhatsApp bot, \"Are you open on Sunday?\" The bot finds the line \"Closed on Sundays\" on page 2 of the clinic's FAQ. It replies \"No, we are closed on Sundays\" and shows \"Source: FAQ, page 2\"."
  },
  {
   "title": "Saree complaints in Surat",
   "text": "Imagine a Surat saree seller who gets 300 complaints a week. Her prompt shows three old complaints with their correct type: Delivery, Refund or Quality. Then it adds the new complaint. The LLM copies the pattern and sorts it, with no extra training."
  },
  {
   "title": "Small agency, big model",
   "text": "Imagine a 6-person agency in Pune. Training its own LLM would cost crores. Instead, its app calls the Gemini API and pays a little per request. The team spends its time on what clients pay for: prompts, documents, testing and a clean chat screen."
  },
  {
   "title": "Hospital notes stay inside",
   "text": "Imagine a hospital in Lucknow whose patient notes must never leave its own servers. It runs an open model with Ollama on its own computer. The notes get summarised without ever travelling to an outside company."
  },
  {
   "title": "Invoices for a CA firm",
   "text": "Imagine a CA firm in Chennai that types up 500 invoices a month. Now the model reads each invoice and returns JSON like `{\"seller\": \"Ravi Agencies\", \"total\": 11800}`. After a check that every field is there, the firm's software saves it, so nobody types the numbers again."
  },
  {
   "title": "Train status by function calling",
   "text": "Imagine a travel agent's bot in Bhubaneswar. A customer asks, \"Is my train late?\" The model cannot see live data, so it replies with a function name and input, like `get_train_status(\"12802\")`. The agent's code runs it and sends back the result."
  },
  {
   "title": "Testing a bank FAQ bot",
   "text": "Imagine a bank team in Kolkata with 30 test questions and their expected answers. After each change to the bot, they run all 30 again and read the RAGAS scores. They keep a change only if the scores go up."
  }
 ],
 "outcomes": [
  {
   "title": "Riya fixes a vague prompt",
   "text": "Riya in Indore asks a model to \"summarise this review\" and gets answers of every length. She adds a role, a task and a format: \"3 bullet points, under 15 words each\". She tests both versions on the same 10 reviews, and the new one wins 9 times."
  },
  {
   "title": "Arjun's few-shot sorter",
   "text": "Arjun in Jaipur adds three solved examples to his prompt: \"Parcel late → Delivery\", \"Want my money → Refund\", \"Torn kurta → Quality\". Now the model labels new complaints in the same one-word style. This is few-shot prompting."
  },
  {
   "title": "A key that stays secret",
   "text": "Fatima in Hyderabad saves her Groq API key in Colab's Secrets panel. Her notebook reads it with one line of code. She shares the notebook with her class, and nobody can see or spend her key."
  },
  {
   "title": "A bot that admits gaps",
   "text": "Lakshmi builds a bot for a Madurai eye clinic. A patient asks about MRI scans, which no document mentions. The bot says, \"I don't know; please call the reception.\" The clinic adds a line about MRI to its FAQ the next day."
  },
  {
   "title": "Plain Python is enough",
   "text": "Gurpreet in Ludhiana needs a bot for just two PDFs. Forty lines of plain Python do it: split, embed, search, prompt. For a client with 2,000 PDF circulars, he uses LlamaIndex, whose ready-made PDF loaders save him days."
  },
  {
   "title": "Showing the source wins trust",
   "text": "Meera's insurance bot in Kochi ends every answer with \"Source: Policy wording, section 4.2\". A customer opens it and reads the clause himself. His trust (भरोसा, bharosa) grows, because he can check the bot."
  },
  {
   "title": "Scores before and after",
   "text": "Tenzin in Gangtok tests her bot on 20 questions, and faithfulness is 0.72. She adds \"Answer only from the given text\" to the prompt. She re-runs the same 20 questions, and faithfulness rises to 0.90."
  }
 ],
 "studySteps": [
  {
   "title": "One hour after office",
   "text": "Suresh is a bank clerk in Kanpur with one free hour a day. Days 1 and 2: API videos and his first request. Day 3: Ollama. Days 4 to 7: RAG lessons, the Lab and the plain-Python bot. He keeps the weekend for the LangChain version."
  },
  {
   "title": "College student in Pune",
   "text": "Anjali builds the plain-Python bot for her college's three rule PDFs. She prints the retrieved chunks for every question. When she rebuilds it with LangChain, she already knows what each ready-made part does."
  },
  {
   "title": "Old laptop with 4 GB RAM",
   "text": "Imran's laptop in Srinagar has only 4 GB RAM, so a 3-billion-parameter model runs very slowly. A 1-billion one runs with Ollama, slowly but well enough. For the RAG build, he uses Colab and a free hosted API instead."
  },
  {
   "title": "Homemaker with short breaks",
   "text": "Shabana in Bhopal studies in 20-minute breaks, one video per break. In her notebook she writes each new word with a one-line meaning: chunk, embedding, k, schema. Before the quiz, she reads the whole list once."
  },
  {
   "title": "Slow phone connection",
   "text": "Kavita lives in a hill town in Uttarakhand with slow internet. She watches videos at low quality to save data. She writes her 20 test questions and expected answers on paper first, then types them in when the network is better."
  },
  {
   "title": "Weekend learner in Bengaluru",
   "text": "Rahul studies only on Saturday and Sunday. Saturday: all videos, his API key and Ollama. Sunday: the two RAG builds and the JSON task. Building the same bot twice needs patience (धैर्य, dhairya), so he keeps four hours for it."
  },
  {
   "title": "Quiz score below 70%",
   "text": "Kiran scores 60%, and most wrong answers are about RAGAS scores and chunk overlap. She chooses to rewatch (दोबारा देखना, dobara dekhna) only those two lessons. Then she reworks the chunking sums and takes the quiz again."
  }
 ],
 "keyTerms": [
  {
   "title": "System prompt at a Kota institute",
   "text": "Imagine a Kota coaching institute's bot. Its system prompt says: \"You help students of Class 11 and 12. Be polite. Answer only from the fee and batch documents.\" Every student's question is read with these rules first."
  },
  {
   "title": "Leaked key on GitHub",
   "text": "Imagine Rohan in Nagpur uploads a notebook to GitHub with his API key typed in it. Soon, strangers use up his quota. He deletes the key, makes a new one and keeps it in Colab secrets."
  },
  {
   "title": "PhonePe finds UPI",
   "text": "A patient asks, \"Can I pay with PhonePe?\" Its embedding lands close to the chunk \"We accept UPI or card\". The vector database returns that chunk, though the two texts share no word. A plain keyword search would miss it."
  },
  {
   "title": "Chunks too big for a bank FAQ",
   "text": "Imagine a bank FAQ cut into 3,000-word chunks. One chunk mixes loans, lockers and ATM rules, so its embedding matches nothing well. Cut into 300-word chunks, the locker question finds the locker chunk."
  },
  {
   "title": "Open book stops a made-up fee",
   "text": "Without RAG, a school bot invents a late fee of ₹200 a day. That is a hallucination. With RAG, it reads the fee page, which says ₹50 a day, and answers from it."
  },
  {
   "title": "GST invoice as JSON",
   "text": "Imagine a Surat textile trader's invoices. With structured output, every reply looks like `{\"gstin\": \"24ABCDE1234F1Z5\", \"total\": 23600}`. His accounts software reads it straight away, with no greeting text to clean up."
  },
  {
   "title": "PNR check by function calling",
   "text": "A travel bot gets \"Is my ticket confirmed?\" The model replies with `check_pnr(\"4521836790\")`, a function name and its input. The agent's code runs the check and returns \"Confirmed, coach B2\". The model then writes a friendly reply."
  }
 ],
 "indiaExample": [
  {
   "title": "A farmer's voice question",
   "text": "Imagine a farmer near Patna who sends a Hindi voice note. He asks which pension scheme his mother can get. A Jugalbandi-style bot turns the speech into text and finds the matching scheme pages. The LLM answers from them, and the reply comes back as a voice note."
  },
  {
   "title": "Kota coaching institute",
   "text": "Imagine a Kota institute that copies the pattern. Its documents are the fees, batch timings and refund rules. A student asks, \"Can I switch to the evening batch?\" The bot finds the batch rules and answers with the source page."
  },
  {
   "title": "Tamil clinic bot in Madurai",
   "text": "Imagine a Madurai clinic whose patients mostly write in Tamil. A speech and translation step lets them ask by voice too. The clinic's FAQ is the document set, so answers about timings and fees come from the clinic's own pages."
  },
  {
   "title": "GST questions for traders",
   "text": "Imagine a Surat CA firm that loads the GST FAQs from the website of CBIC (the central GST body) into a RAG bot. Traders ask about filing dates on WhatsApp. Each answer names the FAQ it came from, so the CA can check it."
  },
  {
   "title": "Housing society rules",
   "text": "Imagine a Bengaluru apartment society with a 60-page rule book. Residents ask, \"Can I keep a dog?\" or \"What is the parking fine (जुर्माना, jurmana)?\" The bot answers from the rule book and names the page."
  },
  {
   "title": "2,000 bank circulars",
   "text": "Imagine a Hyderabad team that builds a RAG bot that answers from 2,000 PDF circulars. LlamaIndex, a library of ready-made parts, gives them a PDF reader and a search step. It does not stop hallucinations (made-up answers), so they still test 50 questions before launch."
  }
 ],
 "commonMistakes": [
  {
   "title": "Customer list on a free tier",
   "text": "Imagine a Noida agency that pastes 2,000 customer names and phone numbers into a free-tier API to write greetings. The provider may keep and use that text. Fix: replace names with [NAME] first, or run the job on a local model with Ollama."
  },
  {
   "title": "The fee was never retrieved",
   "text": "A clinic bot says the eye check-up costs ₹800, but the fee page says ₹400. Printing the retrieved chunks shows only parking and timing chunks. The fee table sat inside one huge chunk. Smaller chunks fixed it; the model was never the problem."
  },
  {
   "title": "Five happy questions",
   "text": "Vikram tries five easy questions, likes the answers and changes the chunk size. Three other questions quietly break. A fixed set of 30 questions, re-run after every change, would have shown the drop at once."
  },
  {
   "title": "Key in a shared notebook",
   "text": "Sneha in Pune shares her Colab notebook with the API key typed in. A week later, her free quota is gone. Fix: delete the old key, make a new one, and read it from Colab secrets."
  },
  {
   "title": "\"Sure! Here is the data:\"",
   "text": "Imran's invoice app breaks on about 1 invoice in 40, when the model adds a greeting before the JSON. More capital letters in the prompt do not fix it. The API's JSON schema mode plus a Pydantic check does."
  },
  {
   "title": "A long vector wins unfairly",
   "text": "Deepa's embedding model does not normalise its vectors (its number lists) to length 1. Ranking by raw dot product, a chunk with a long vector beats the chunk that truly matches the question. After she switches to cosine similarity, the right chunk comes first."
  },
  {
   "title": "A framework is not a fix",
   "text": "Karthik moves his bot from plain Python to LangChain and expects fewer wrong answers. Nothing changes, because the same model reads the same chunks. Better chunking and a stricter prompt are what finally help."
  }
 ],
 "selfCheck": [
  {
   "title": "Recording three prompt versions",
   "text": "Version A says only \"Write a scope.\" Version B adds a role and a format. Version C also adds one solved example. On five briefs, C wins 4 times. A good note says why: \"The example showed the exact table layout we want.\""
  },
  {
   "title": "Precision and recall for retrieval",
   "text": "Say k = 4 chunks come back, and 3 of them hold the answer. Precision = 3 ÷ 4 = 0.75. The document has 5 useful chunks in all, so recall = 3 ÷ 5 = 0.6. Precision divides by what you fetched; recall divides by all useful chunks."
  },
  {
   "title": "Reading the chunk-size table",
   "text": "In made-up results, 500 tokens with k = 4 gives faithfulness 0.88. With k = 8, it drops to 0.79. Extra chunks bring unrelated text that distracts the model, and a longer prompt costs more. So pick the row with the best scores, not the biggest k."
  },
  {
   "title": "A Pydantic check in one line",
   "text": "In Pydantic, the schema is a class: `class Invoice(BaseModel)` with `seller: str`, `gstin: str`, `date: str` and `total: float`. Here `str` means text and `float` means a number. Then `Invoice.model_validate_json(reply)` gives a clean object, or an error that names the bad field."
  },
  {
   "title": "Why RAG still slips",
   "text": "Sample answer: \"RAG gives the model the right pages, so it makes up less. But it may still misread a page, mix two chunks, or answer when no chunk fits.\" Then the message: \"I could not find this in our documents. Please call our office.\""
  },
  {
   "title": "High recall, low faithfulness",
   "text": "Say RAGAS shows context recall 0.9 (the chunks held the needed facts) but faithfulness 0.5. Retrieval found the facts, but the answers add claims the chunks do not support. Fix the prompt first: \"Answer only from the context; otherwise say you don't know.\""
  }
 ]
};
