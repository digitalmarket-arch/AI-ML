/* AI Marg lesson-card examples for one module (loaded with its lesson cards). JavaScript holding JSON. */
window.AIM = window.AIM || {};
window.AIM.examples = window.AIM.examples || {};
window.AIM.examples["l4-finetuning"] = {
 "overview": [
  {
   "title": "Discharge notes in Chennai",
   "text": "Imagine a Chennai hospital where every discharge summary must follow one fixed layout. A clear prompt kept missing the \"Follow-up date\" line. After fine-tuning on 500 past summaries, the model writes the full layout every time."
  },
  {
   "title": "FD rates at a Pune bank",
   "text": "Imagine a Pune cooperative bank whose fixed-deposit rates change every few months. Its chatbot should look up today's rates with RAG. If the rates were trained into the weights, the bot would keep quoting old rates with full confidence."
  },
  {
   "title": "10,000 tickets a month",
   "text": "Imagine a Jaipur saree shop that gets 10,000 support tickets a month. A small model is fine-tuned on 2,000 tickets that staff had already sorted. It puts new tickets into Delivery, Refund and Quality nearly as well as a big model. Each ticket costs far less to sort."
  },
  {
   "title": "Prompt first at a sweet shop",
   "text": "A Kolkata sweet shop wants every Instagram caption warm, short and with one Bengali word. A clear prompt with 3 sample captions gets it right 9 times out of 10. So the shop does not fine-tune at all."
  },
  {
   "title": "QLoRA on a free GPU",
   "text": "Arjun, a student in Bhopal, wants to fine-tune a 7-billion-parameter model. Full fine-tuning would need over 100 GB of GPU memory. With QLoRA, the frozen 4-bit model takes about 3.5 GB, so he trains on a free Colab GPU."
  },
  {
   "title": "Polite replies by preference",
   "text": "Imagine a Hyderabad support team that marks pairs of bot replies: one polite and exact, one rude or vague. DPO training on 3,000 such pairs makes the polite, exact kind of reply more likely."
  },
  {
   "title": "A laptop model for a school",
   "text": "Imagine a teacher in a Nagaland village school with weak internet. She runs a 4-bit quantised model on her laptop with Ollama, a free tool that runs models on your own computer. It answers grammar questions without internet, only slightly less well than the full model."
  }
 ],
 "outcomes": [
  {
   "title": "Saying no to fine-tuning",
   "text": "Fatima, a freelancer in Lucknow, is asked to \"train a bot on our 200-page HR manual\". She explains that RAG is cheaper, and it stays correct when the manual changes. The client agrees, and the project needs no GPU at all."
  },
  {
   "title": "QLoRA in a Kaggle notebook",
   "text": "Karthik in Coimbatore loads a model with 3 billion parameters (learned numbers) in 4-bit on a free Kaggle GPU. He adds LoRA parts with the PEFT library and trains with `SFTTrainer`, the ready-made training tool in TRL. Only the small LoRA parts change."
  },
  {
   "title": "Keeping a test split aside",
   "text": "Neha has 500 chat-format examples for writing polite payment reminders. She moves 50 into a held-out test file before training and trains on the other 450. The 50 never reach the trainer, so her test is fair."
  },
  {
   "title": "Explaining DPO to a manager",
   "text": "Rohan tells his manager in Gurugram: \"We show the model two replies to the same question, one that customers liked and one they did not. DPO moves it towards the liked kind.\" The manager understands in a minute."
  },
  {
   "title": "A score that looks too good",
   "text": "Priya reads that a new model scores 95% on a famous maths benchmark. On 40 fresh problems her team wrote, it scores 55%. She suspects the benchmark questions leaked into its training data, and trusts her own test more."
  },
  {
   "title": "A model with no internet",
   "text": "Imran in Srinagar types `ollama run llama3.2` once while online. This command makes Ollama download a small 4-bit Llama model and start it. After that, the model answers even when the internet is down, because everything runs on his own laptop."
  }
 ],
 "studySteps": [
  {
   "title": "One hour after office",
   "text": "Suresh, a bank clerk in Kanpur, has one free hour a day. Day 1: decision videos and his checklist. Day 2: LoRA videos and the Lab. Day 3: the QLoRA notebook. Days 4 to 6: dataset, evaluation and Ollama. Day 7: practice and the quiz."
  },
  {
   "title": "Switching on the GPU",
   "text": "Ananya, a B.Tech student in Bhubaneswar, opens the QLoRA notebook in Colab. First she picks Runtime, then Change runtime type, then T4 GPU. Without the GPU, training would be very slow or would not start at all."
  },
  {
   "title": "Building a dataset in breaks",
   "text": "Shabana in Hyderabad writes 20 chat-format examples a day during short breaks. Each one turns a recipe into a shopping list. In about 3 weeks she has 400 examples, inside the 200–500 range of step 3."
  },
  {
   "title": "Weekend learner in Amritsar",
   "text": "Gurpreet studies only on weekends. On Saturday he watches the videos and writes his decision checklist. On Sunday he does the Lab and the notebook. He keeps a spare hour and some patience (धैर्य, dhairya), because model downloads can be slow."
  },
  {
   "title": "Slow internet in the hills",
   "text": "Tenzin lives in a hill town with slow internet. She downloads a small 4-bit model file once, on her college Wi-Fi. At home, Ollama runs it offline, so the Ollama part of step 4 needs no internet."
  },
  {
   "title": "Quiz score below 70%",
   "text": "Kiran scores 60% on the quiz. Most wrong answers were about memory maths. She practises (अभ्यास, abhyaas) the memory rule, parameters (learned numbers) × bits ÷ 8, on three model sizes, then takes the quiz again."
  }
 ],
 "keyTerms": [
  {
   "title": "Swappable adapters at a law firm",
   "text": "Imagine a Delhi law firm with one shared base model, the original model before fine-tuning. It keeps three small LoRA adapter files, the trained B and A parts: one for contracts, one for court notices and one for client emails. Each file is tiny next to the base model (megabytes, not gigabytes), so swapping them is quick."
  },
  {
   "title": "Which row teaches what",
   "text": "A plain Wikipedia paragraph about the Ganga is *pretraining* data, the raw text a model first learns from. It teaches language and facts. A sentence with one word hidden, like \"The Ganga flows into the [MASK]\", is how BERT (an older kind of model) is pretrained. Only an instruction with a good answer is an instruction-tuning row."
  },
  {
   "title": "One good answer versus a pair",
   "text": "Plain instruction tuning, also called SFT (supervised fine-tuning), shows only the good answer. A DPO pair also shows a rejected answer, so the model learns what to avoid. RLHF learns from the same kind of pairs, through a judge model."
  },
  {
   "title": "What quantisation does not do",
   "text": "Quantising a model from 16-bit to 4-bit makes its weights about a quarter of the size. It does not teach the model new facts. It also does not make the context window (the most text it can read at once) any longer."
  },
  {
   "title": "Forgetting English",
   "text": "Imagine a Bengaluru team that fully fine-tunes a model on Kannada chats for many epochs (full passes over the data). Kannada replies improve, but its English answers get worse. With LoRA and fewer epochs, most of the old skill stays, because the original weights are frozen."
  },
  {
   "title": "4-bit on a 6 GB laptop GPU",
   "text": "Lakshmi's laptop GPU has 6 GB of memory. A 7-billion-parameter model needs 14 GB at 16-bit and 7 GB at 8-bit, so neither fits. At 4-bit it needs 3.5 GB, which fits with room to spare."
  },
  {
   "title": "Benchmark versus your own test",
   "text": "Model X beats Model Y on MMLU by 6 points. On 50 real questions from a Kochi insurance office, Y gives better answers. The office picks Y, because its own test matches its real work."
  }
 ],
 "indiaExample": [
  {
   "title": "IndicTrans2, the translator",
   "text": "IndicTrans2 is AI4Bharat's open translation model. It covers all 22 scheduled languages, the ones listed in India's Constitution. For Airavata, it turned English instruction data into Hindi. Good translation mattered, because the model copies whatever its examples show."
  },
  {
   "title": "Airavata's LoRA settings",
   "text": "The Airavata paper lists its settings: LoRA with rank 16, the thin side of each LoRA strip. They trained for 4 epochs (full passes over the data). The team saved the model after every epoch and tested each copy. Then they blended the copies from epochs 3 and 4."
  },
  {
   "title": "Sarvam-M from Mistral Small",
   "text": "In May 2025, Sarvam AI released Sarvam-M, a model with 24 billion parameters (learned numbers). It started from Mistral Small, an open model (one anyone can download) from the French company Mistral AI. Sarvam improved it with supervised fine-tuning (training on good example answers). Then came reinforcement learning (learning by trial and error) with rewards that can be checked, like correct maths answers."
  },
  {
   "title": "Malayalam replies at a clinic",
   "text": "Imagine a Kochi clinic that wants its chatbot to answer in polite, simple Malayalam. Doctor timings change weekly, so they come from RAG, which looks them up at question time. The Malayalam style comes from LoRA fine-tuning on 600 good past replies."
  },
  {
   "title": "A farm helpline on a laptop",
   "text": "Imagine an agriculture helpline in Maharashtra. It fine-tunes a small model on 2,000 Marathi farmer questions with expert answers. Then it quantises the model to 4-bit, storing each weight with fewer bits, so it runs on an ordinary office laptop."
  },
  {
   "title": "Licence check at a startup",
   "text": "Imagine a Bengaluru edtech startup that finds a free Hindi question dataset. Its licence (its rules of use) says \"non-commercial use only\". The startup uses it only for a research test, and trains its paid product on data it wrote itself."
  }
 ],
 "commonMistakes": [
  {
   "title": "Tomato price trained in",
   "text": "Imagine a Delhi grocery app fine-tuned on Monday's price list. By Monday evening tomatoes cost more, but the bot still says ₹40 a kg. Fix: a tool call that reads today's price from the stock database."
  },
  {
   "title": "Testing on training chats",
   "text": "Vikram tests his bot on 20 chats it was trained on and gets 20 out of 20 right. On 50 held-out chats, it gets only 31 right. Now he always keeps a test set aside before training."
  },
  {
   "title": "A non-commercial dataset",
   "text": "Imagine Sneha builds a paid tutoring bot on the Stanford Alpaca dataset. Its licence is CC BY-NC 4.0, and NC means non-commercial. She must retrain on data she is allowed to use for paid work, losing two weeks."
  },
  {
   "title": "25 epochs on 300 chats",
   "text": "A team trains on 300 support chats for 25 epochs, and the training loss falls to almost 0. The bot now pastes old replies, even for unrelated questions. With 2 epochs, a validation check and 1,000 varied chats, it answers sensibly."
  },
  {
   "title": "The 95% maths score",
   "text": "Imagine a new open model that claims 95% on a famous maths benchmark. A Kanpur coaching centre tests it on 60 fresh problems their teachers wrote, and it scores 55%. They choose models by their own test from then on."
  },
  {
   "title": "Out of memory on Colab",
   "text": "Rahul tries full fine-tuning of a 7-billion-parameter model on a free GPU in Google Colab, a website for running code. The first step stops with the error \"CUDA out of memory\": the GPU has no space left. He switches to QLoRA, and training runs with memory to spare."
  }
 ],
 "selfCheck": [
  {
   "title": "Hint for the three requests",
   "text": "Policy manual: RAG, because answers must come from a long document that can change. For the brand tone, try a prompt with examples first, then ask what would make you fine-tune. For cheap ticket sorting, think about cost per ticket."
  },
  {
   "title": "Scoring the 20 emails",
   "text": "Mark each pair as \"fine-tuned better\", \"base better\" or \"tie\", without knowing which model wrote which. A result like 13, 4 and 3 is a clear win. Also read the 4 losses, because they show what to fix."
  },
  {
   "title": "Memory maths, the method",
   "text": "Use memory = parameters × bits ÷ 8. For 16-bit: 7 × 16 ÷ 8 = 14 GB. Now do 8-bit and 4-bit yourself. Leave a few GB free for working memory. It holds the KV cache (notes the model keeps about the text so far) and activations (in-between results)."
  },
  {
   "title": "A sample preference pair",
   "text": "Prompt: \"My order is late.\" Chosen: \"Sorry! Order 4521 is at the Nagpur hub and reaches you tomorrow.\" Rejected: \"Delays happen. Please wait.\" A good explanation says DPO raises the chance of replies like the first and lowers it for the second."
  },
  {
   "title": "Comparing GGUF with full precision",
   "text": "Make a table with 10 rows: the prompt, a quality mark from 1 to 5 for each version, and tokens (word pieces) per second. Note which machine each version ran on, because a Colab GPU and a laptop differ a lot. Then mark the prompts where quality clearly dropped."
  }
 ]
};
