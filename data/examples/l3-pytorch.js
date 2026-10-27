/* AI Marg lesson-card examples for one module (loaded with its lesson cards). JavaScript holding JSON. */
window.AIM = window.AIM || {};
window.AIM.examples = window.AIM.examples || {};
window.AIM.examples["l3-pytorch"] = {
 "overview": [
  {
   "title": "Same recipe, fewer lines",
   "text": "In 3.1, Ravi in Chennai wrote about 40 lines of NumPy for the backward pass. In PyTorch, the same job is one line: `loss.backward()`. The recipe has not changed: guess, measure the loss, find the gradients, update."
  },
  {
   "title": "Grape leaf photos as tensors",
   "text": "Imagine a Nashik startup with 5,000 photos of grape leaves. Each photo becomes a tensor of shape [3, 224, 224]: 3 colour layers, each 224 by 224 dots. A DataLoader serves the photos to the model 32 at a time."
  },
  {
   "title": "One lakh gradients in one call",
   "text": "Priya's network in Indore has 1 lakh weights. Working out each gradient by hand would take weeks, and she would make mistakes. One call to `loss.backward()` finds all 1 lakh gradients. Each one lands in that weight's `.grad` box."
  },
  {
   "title": "A free GPU in Lucknow",
   "text": "Imagine one epoch (one full pass over the data) takes 20 minutes on Arjun's laptop CPU, its main chip. On a free Colab GPU, the same epoch might take 2 minutes. These are made-up numbers; the real gain depends on the model."
  },
  {
   "title": "One template, two clients",
   "text": "An imagined Kochi agency keeps one training template. For a saree shop, it sorts product photos. For a bank, it sorts customer messages. Only the Dataset and the model change; the training loop stays the same."
  },
  {
   "title": "Keras for a quick first try",
   "text": "Fatima in Hyderabad wants a quick first model on exam-result data. In Keras, `model.fit(X, y, epochs=5)` runs the whole training loop in one line. When she needs to control each step, she writes the loop in PyTorch."
  }
 ],
 "outcomes": [
  {
   "title": "Checking autograd by hand",
   "text": "Sana in Bhopal writes `x = torch.tensor(3.0, requires_grad=True)`, so autograd tracks x. Then she computes `y = x**2` and calls `y.backward()`. `x.grad` shows 6, and her hand answer matches: the slope of x² is 2 × x = 6."
  },
  {
   "title": "Used-bike prices from a CSV",
   "text": "Rohit in Pune wraps a CSV of 2,000 used-bike prices in a Dataset. A DataLoader with `batch_size=64, shuffle=True` serves the rows in a new random order every epoch. That makes 32 batches, and the last one has only 16 rows."
  },
  {
   "title": "Safe from the disconnect",
   "text": "Meera in Kolkata trains for 3 hours on Colab and saves a checkpoint to Google Drive after every epoch. When the session drops in epoch 8, she reloads the epoch-7 save and goes on. It is like saving a long document often during power cuts."
  },
  {
   "title": "Reading a friend's Keras code",
   "text": "Imran in Srinagar sees `model.compile(...)` and then `model.fit(...)`. He explains that compile only picks the optimiser (the weight-update tool) and the loss (the error measure). Then fit runs the training loop that he writes himself in PyTorch."
  },
  {
   "title": "Same validation score every run",
   "text": "Divya in Guwahati calls `model.eval()` and runs validation inside a `with torch.no_grad():` block. Now her validation accuracy is the same on every run. Before, dropout (switching off random parts of the network) made it jump around."
  },
  {
   "title": "A loss that will not fall",
   "text": "Karthik's loss (error score) stays flat for an hour. So he trains on one batch of 10 images instead. The loss still will not drop, so he checks his code and finds the labels (right answers) shifted by one row."
  }
 ],
 "studySteps": [
  {
   "title": "One hour after office",
   "text": "Ramesh, an accountant in Surat, has one free hour a day. Day 1: tensors and autograd, printing every shape. Day 2: Dataset, DataLoader and the loop. Day 3: his 3.1 network in PyTorch. Day 4: the GPU step. The weekend is for the Lab, practice and the quiz."
  },
  {
   "title": "CPU against GPU in Pune",
   "text": "Ananya, a college student in Pune, times one epoch of her network. Her notes say 95 seconds on the CPU and 9 seconds on the GPU. She also notes that a tiny network gains much less, because moving data takes time too."
  },
  {
   "title": "Homemaker in short breaks",
   "text": "Shabana in Lucknow studies in 20-minute breaks. In each break, she types one tensor example and prints its `.shape`. When a shape surprises her, she writes it down and checks it again the next day."
  },
  {
   "title": "Weekend learner in Bengaluru",
   "text": "Rahul studies only on Saturday and Sunday. Saturday is for the lessons and the PyTorch rewrite of his 3.1 network. Sunday is for the GPU step, the Lab tab's debugging tasks and the quiz."
  },
  {
   "title": "Slow internet in Gangtok",
   "text": "Tenzin has a slow connection. Colab runs on Google's computers, so her slow line only affects how fast the page loads, not the training speed. She watches the lessons at low video quality to save data."
  },
  {
   "title": "Quiz score below 70%",
   "text": "Kiran scores 60% on the quiz. Most misses are about `zero_grad()`, which clears old gradients, and about batch counts. She rewatches the training-loop lesson and counts the batches for 1,000 rows by hand. Then she takes the quiz again."
  }
 ],
 "keyTerms": [
  {
   "title": "Class marks as a tensor",
   "text": "Lakshmi teaches 40 students in Madurai, with marks in 5 subjects. As a tensor, the marks have shape [40, 5]. `marks.float().mean(dim=0)` turns the marks into decimals, averages down each column and gives 5 numbers: the class average in each subject."
  },
  {
   "title": "Tamil letters in batches",
   "text": "Imagine a Dataset of 12,000 photos of handwritten Tamil letters. A DataLoader with batch size 50 serves 240 batches per epoch. With `num_workers=2`, two helper workers load the next photos while the GPU trains."
  },
  {
   "title": "Splitting before loading",
   "text": "A DataLoader never splits your data. Gurpreet in Ludhiana first uses `random_split(ds, [8000, 2000])` to make a training set and a validation set, which is kept aside for checking. Then he gives each set its own DataLoader."
  },
  {
   "title": "A night's work saved",
   "text": "Fatima in Hyderabad saves a checkpoint after every epoch. Colab, Google's free notebook website, disconnects at 2 am, during epoch 12. In the morning, she loads the epoch-11 checkpoint, with the model, the optimiser and the epoch number, and continues."
  },
  {
   "title": "Only predictions needed",
   "text": "An imagined Jaipur startup only needs predictions in its app. So it keeps just the state_dict file and builds the same model from its class inside the app. No optimiser state is needed, because the app never trains."
  },
  {
   "title": "GPU time for a college lab",
   "text": "Imagine a Kochi college lab where one epoch takes 15 minutes on a CPU and 1 minute on a GPU (made-up numbers). The code change is small: `model.to(device)` once, and `xb = xb.to(device)` for every batch."
  },
  {
   "title": "Keras and nn.Module side by side",
   "text": "Anil in Bhubaneswar builds the same 2-layer model twice. In Keras, he lists the layers inside `Sequential([...])`. In PyTorch, he writes an `nn.Module` with the layers in `__init__` and their order in `forward`."
  }
 ],
 "indiaExample": [
  {
   "title": "Real model sizes on Hugging Face",
   "text": "AI4Bharat shares IndicTrans2 in different sizes. Hugging Face lists about 110 crore weights (learned numbers) for `indictrans2-en-indic-1B`, the big English-to-Indian model. The smaller `indictrans2-en-indic-dist-200M` has about 27 crore, so it needs much less GPU memory. The sizes in the names are only rough."
  },
  {
   "title": "A Coimbatore company's catalogue",
   "text": "Imagine a Coimbatore textile company that needs its 5,000 English product lines in Tamil. Translating one line at a time is slow. Sending the lines to the GPU in batches of 32, with `model.eval()` and `torch.no_grad()` to skip gradient work, finishes much faster."
  },
  {
   "title": "Farm advice in Marathi",
   "text": "Imagine a farmer helpline in Maharashtra that writes advice in English. A Colab notebook loads a translation model, moves it to the GPU with `.to(device)`, and turns each message into Marathi. A staff member checks it before sending."
  },
  {
   "title": "An Odisha team keeps its work",
   "text": "Imagine an Odisha student team that fine-tunes a model, which means training it a little more on Odia court-notice sentences. Colab disconnects twice. They save a checkpoint (a full saved copy of training) to Google Drive after every full pass over the data. So they lose minutes, not hours."
  },
  {
   "title": "Too big a batch in Patna",
   "text": "Imagine Ritu in Patna sends 256 sentences in one batch to the 1B model and sees 'CUDA out of memory'. The GPU's memory is full. A batch of 32 fits, or she can switch to the smaller 200M model."
  }
 ],
 "commonMistakes": [
  {
   "title": "Gradients piling up",
   "text": "Sneha in Nagpur tests x = 3 and y = x². The slope is 2 × 3 = 6, so `x.grad` is 6 after one `y.backward()`. She repeats both lines without zeroing, and `x.grad` becomes 12, then 18. With `x.grad.zero_()` first, it stays 6."
  },
  {
   "title": "Wobbling validation",
   "text": "Sunita in Jaipur checks her model three times on the same 1,000 images and gets 81%, 78% and 83%. She forgot `model.eval()`, so dropout was still switching off random neurons. After `model.eval()`, she gets 82% every time."
  },
  {
   "title": "Device clash in the loop",
   "text": "Arjun moves his model with `model.to('cuda')` but forgets the batches. The first step crashes: 'found at least two devices, cuda:0 and cpu'. He adds `xb, yb = xb.to(device), yb.to(device)` inside the loop, and it runs."
  },
  {
   "title": "Halving the batch for nothing",
   "text": "Neha sees the same-device error and cuts her batch from 64 to 32. The error stays. The message names two devices, 'cuda:0 and cpu', so the real fix is `.to(device)`, not a smaller batch."
  },
  {
   "title": "Model gone overnight",
   "text": "Zoya in Bhopal saves `crop.pt` with a plain file name on Colab. The next morning the file is gone, because `/content` was wiped. Now she mounts Google Drive and saves to `/content/drive/MyDrive/crop.pt`, which stays safe."
  },
  {
   "title": "A dictionary is not a model",
   "text": "Rohan writes `model = torch.load(p)` and then `model(images)`. Python says an 'OrderedDict' object is not callable: it cannot be run like a model. He makes a new model with `model = CropNet()`, loads the weights with `load_state_dict`, calls `model.eval()`, and it works."
  }
 ],
 "selfCheck": [
  {
   "title": "Thinking through the autograd task",
   "text": "Work out the slope piece by piece. The slope of 3x² is 6x, and the slope of 2x is 2. Put x = 2 into 6x + 2, then compare with `x.grad`. If the numbers differ, check that you called `backward()` only once."
  },
  {
   "title": "Shapes to expect from a CSV",
   "text": "Say your CSV has 5 feature columns and a price column. `__len__` returns the number of rows, and `__getitem__(i)` returns row i as two tensors. With batch size 32, a good answer prints `torch.Size([32, 5])` and `torch.Size([32])`."
  },
  {
   "title": "Proving the reload worked",
   "text": "Sample answer: 'Best validation accuracy was 88.4% at epoch 9. After the restart, I built the same MLP, loaded the saved weights from Drive, called `model.eval()` and got 88.4% again'. A different number often means a missing `eval()`, the switch to checking mode, or an old file."
  },
  {
   "title": "Reading a one-batch test",
   "text": "Arif in Hyderabad trains on 16 images for 500 steps, and the loss stays near 2.3. A healthy model would learn 16 examples by heart. So this points to a bug, not to too little data. He finds his labels were shuffled apart from the images."
  },
  {
   "title": "What removing zero_grad does",
   "text": "A good answer describes the curve. The loss may fall for a few steps, then it jumps around or climbs, because each update adds up all past gradients. Put the line back, and the smooth fall returns."
  },
  {
   "title": "Reading a learning-rate finder",
   "text": "Imagine these results: 1e-5 → 2.31, 1e-4 → 2.29, 1e-3 → 2.10, 1e-2 → 1.40, 1e-1 → 0.90 (lowest), 1 → 6.50. Ten times smaller than 1e-1 is 1e-2, where the loss still falls steeply. So train with 1e-2, not 1e-1, which sits too close to the jump."
  },
  {
   "title": "Keras differences, sample answer",
   "text": "A good list might say: Keras needs no hand-written loop, because `fit()` runs it. `compile()` sets the loss and optimiser in one line. Keras prints a progress bar with the loss by itself, while in PyTorch you write `zero_grad()`, `backward()` and `step()` yourself."
  }
 ]
};
