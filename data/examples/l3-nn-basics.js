/* AI Marg lesson-card examples for one module (loaded with its lesson cards). JavaScript holding JSON. */
window.AIM = window.AIM || {};
window.AIM.examples = window.AIM.examples || {};
window.AIM.examples["l3-nn-basics"] = {
 "overview": [
  {
   "title": "One neuron scores a candidate",
   "text": "A neuron gets coding 8, interview 6 and experience 2, with weights 0.5, 0.3 and 0.4 and a bias of −5. Total: 4 + 1.8 + 0.8 − 5 = 1.6. Sigmoid turns 1.6 into 0.83, an 83% vote for \"hire\"."
  },
  {
   "title": "A UPI alert in Chennai",
   "text": "Imagine a Chennai bank's neural network that reads the amount, time and \"new payee\" for each UPI payment. Its forward pass gives 0.92, a 92% chance of fraud. But the payment was genuine, so the loss is high. Backpropagation finds which weights pushed the alarm up, and the optimiser changes them a little to lower it."
  },
  {
   "title": "Onion prices at a Nashik mandi",
   "text": "Imagine a network that predicts tomorrow's onion price from past prices and rain. It guesses ₹28 per kg, but the real price is ₹31. The loss is (31 − 28)² = 9. The weights shift a little so that the next guess is closer."
  },
  {
   "title": "Reading PIN codes in Kolkata",
   "text": "Imagine a post office network that reads handwritten PIN codes. Early layers spot strokes and curves, and later layers spot whole digits. Each wrong digit raises the loss. Backpropagation finds how the weights in every layer should change, and the optimiser changes them."
  },
  {
   "title": "Learning by heart",
   "text": "Imagine a network that sees only 50 photos of Kerala bananas. It gets all 50 right but fails on new photos, because it learned those photos by heart. Dropout and weight decay push it to learn general patterns, like shape and colour."
  },
  {
   "title": "Tamil voice search",
   "text": "When you speak to your phone in Tamil, a neural network turns the sound into words. It learned this from many hours of recorded speech, with the same loop: guess, measure the loss, backpropagate, adjust."
  }
 ],
 "outcomes": [
  {
   "title": "Choosing softmax in Hyderabad",
   "text": "Fatima builds a network that sorts customer complaints into 4 types: refund, delay, damage and other. Each complaint has exactly one type. So she uses ReLU in the hidden layer, and softmax with cross-entropy at the output."
  },
  {
   "title": "Counting parameters by hand",
   "text": "Arjun's network has 3 inputs, 4 hidden neurons and 1 output. Input to hidden: 3 × 4 = 12 weights plus 4 biases (one extra number per neuron), so 16. Hidden to output: 4 + 1 = 5. Total 21, which matches the number his code prints."
  },
  {
   "title": "Beating a straight line",
   "text": "Lakshmi tries the `make_moons` data: two curved half-moons of dots. Logistic regression draws one straight line between them and scores about 87%. Her two-layer NumPy network with 16 hidden neurons bends that line around the moons and reaches about 97%."
  },
  {
   "title": "Smoothing a zig-zag",
   "text": "With plain SGD, Meera's weights zig-zag across a narrow valley, so her loss bounces up and down. She adds momentum of 0.9: each step keeps 90% of the last step's movement and adds the new gradient. The side-to-side pushes cancel out, so the loss falls faster and more smoothly."
  },
  {
   "title": "Reading a broken curve",
   "text": "Gurpreet's loss falls nicely, then suddenly jumps to `nan` (not a number) at step 300. He recognises exploding gradients. He lowers the learning rate and adds gradient clipping, which caps each gradient's size, and training runs smoothly."
  },
  {
   "title": "Closing the overfitting gap",
   "text": "Riya's network scores 99% on training data but only 80% on validation data (examples kept aside). She adds weight decay and dropout of 0.3, which switches off each neuron 30% of the time. Now it scores 93% and 89%, so the gap is much smaller."
  }
 ],
 "studySteps": [
  {
   "title": "One hour after office",
   "text": "Prakash, a bank clerk in Indore, has one free hour a day. Day 1: perceptron and activation lessons. Day 2: backpropagation, just watching. Day 3: backpropagation again, with pen and paper. Day 4: the Lab. Day 5: optimisers (rules that update the weights) and the Practice exercises."
  },
  {
   "title": "College student with a notebook",
   "text": "Ananya in Pune keeps a table for the Lab. Each row changes one setting: 2, 8 or 64 hidden neurons, or learning rate 0.01, 0.1 or 1. She notes \"fits\", \"fails to fit\" or \"unstable\" next to each row."
  },
  {
   "title": "Homemaker in short breaks",
   "text": "Rukhsana in Guwahati studies in 20-minute breaks. In each break she watches one lesson and draws that network: circles for neurons, arrows for weights. Her drawings later help her with the paper self-check task."
  },
  {
   "title": "Weekend learner in Chennai",
   "text": "Karthik studies on Saturday and Sunday. Saturday: all the lessons and the Lab. Sunday: the Practice exercises, the quiz and three hours for the NumPy network in Colab, the most important task."
  },
  {
   "title": "Slow connection in Shillong",
   "text": "Daphi's internet is slow. She watches the backpropagation lessons at low quality to save data. She does the chain-rule steps on paper, with no internet at all, and checks her numbers later."
  },
  {
   "title": "Calculus feels weak",
   "text": "Imran forgets what the chain rule means. Before starting, he spends 45 minutes on the calculus module 1.5. Then the backpropagation lessons make sense: they just multiply small slopes, one layer at a time."
  }
 ],
 "keyTerms": [
  {
   "title": "A loan neuron in Jaipur",
   "text": "Imagine one neuron in a Jaipur bank's loan model. Inputs: income 5 (in lakhs) and existing loans 2. Weights 0.6 and −1.0, bias −0.5. Total = 3 − 2 − 0.5 = 0.5. ReLU keeps 0.5, a mild \"approve\" signal. The minus weight means more loans push the score down."
  },
  {
   "title": "The staircase light switch",
   "text": "Many homes have a staircase light with two switches, one at each end. Wired one common way, it is on when exactly one switch is up: that is XOR. A perceptron cannot learn it, but an MLP with two hidden neurons can."
  },
  {
   "title": "Rain forecast loss",
   "text": "A model predicts 20 mm of rain for Mumbai, and 32 mm falls. Squared error = (20 − 32)² = 144. Next day it predicts 30 mm and 28 mm falls: error 4. MSE, the average of the two, is (144 + 4) ÷ 2 = 74."
  },
  {
   "title": "Forward pass in NumPy",
   "text": "x = [2, 1], W1 = [[1, 0], [−1, 1]], b1 = [0, −2]. Row 1 of W1 holds input 1's weights, row 2 holds input 2's. So `x @ W1` = 2 × [1, 0] + 1 × [−1, 1] = [1, 1]. Adding b1 gives [1, −1]. ReLU makes it [1, 0]. With W2 = [3, 4] and b2 = 1, the output is 1×3 + 0×4 + 1 = 4."
  },
  {
   "title": "Adam as a safe default",
   "text": "Vikram trains a crop-disease photo model for Punjab farmers. Plain SGD (the basic update rule) needs many tries to find a good learning rate. Adam with a learning rate of 0.001 trains well on the first try, because it sets a step size for each weight."
  },
  {
   "title": "Dropout in a call centre",
   "text": "A Noida call-centre model leans on one neuron that fires for the word \"refund\". With dropout, that neuron is often switched off in training. Other neurons learn to spot \"money back\" and \"return\" too."
  },
  {
   "title": "Twenty sigmoid layers",
   "text": "Neha builds a 20-layer network with sigmoid everywhere. After training, the last layers have changed but the first layers look almost untouched. That is a vanishing gradient. Switching to ReLU lets the first layers learn."
  }
 ],
 "indiaExample": [
  {
   "title": "Patna, where it began",
   "text": "The 2018 pilot covered the Patna region on the Ganga. Google used river level data from the Central Water Commission. The goal was to warn people early about when and where a river would flood."
  },
  {
   "title": "Translating 22 languages",
   "text": "AI4Bharat, at IIT Madras, released IndicTrans2. It is a neural network that translates between English and all 22 scheduled languages, the ones listed in India's Constitution. It learned from millions of sentence pairs with the same guess, measure and adjust loop."
  },
  {
   "title": "Eye checks for diabetes",
   "text": "Google trained a deep neural network (one with many layers) to spot diabetic eye disease in retina photos. Many training photos came from Indian eye hospitals, such as Aravind (Madurai) and Sankara Nethralaya (Chennai). A later study tested it on over 3,000 patients at those two hospitals."
  },
  {
   "title": "Handwritten forms at a bank",
   "text": "Imagine a Kolkata bank that reads handwritten account numbers from deposit slips. A small MLP (a network with a few layers) reads each digit. Every misread digit raises the loss. Backpropagation and the optimiser then slowly fix the weights."
  },
  {
   "title": "Power demand in Delhi",
   "text": "Imagine a power company that predicts tomorrow's electricity demand in megawatts. Demand is a plain number, so the network ends with one output neuron: a single small maths unit. That neuron has no activation (no squashing rule). Its loss is mean squared error, the average of squared gaps."
  },
  {
   "title": "Fish catch in Kerala",
   "text": "Imagine a fishers' co-operative in Kollam. A network predicts tomorrow's catch from sea temperature, wind and moon phase. After each day, the real catch is compared with the guess, and the weights are adjusted."
  }
 ],
 "commonMistakes": [
  {
   "title": "Ten layers, no ReLU",
   "text": "Rohit stacks ten layers but forgets the activation. On the curved moons data, his model still splits the two classes with one straight line, just like logistic regression. He adds ReLU after each hidden layer, and the dividing line finally bends around the moons."
  },
  {
   "title": "Sigmoid for rainfall",
   "text": "Sneha predicts rainfall in mm with a sigmoid output. Sigmoid can only give numbers from 0 to 1, so it can never say 87 mm. She removes the output activation and uses mean squared error, and the forecasts become sensible."
  },
  {
   "title": "Salary in lakhs, ratio below 1",
   "text": "Ajay's loan model uses salary in rupees (up to ₹25,00,000) and a ratio between 0 and 1. It is like adding raw marks from a 100-mark paper to a 5-mark quiz. The loss jumps around. After standardising both columns, the loss falls smoothly within a few rounds."
  },
  {
   "title": "nan after five batches",
   "text": "Pooja sets the learning rate to 1.0. Over five batches (small groups of examples), the loss goes 0.7, 3.2, 41, 900, then `nan`. She lowers the rate to 0.001 with Adam and adds gradient clipping. The loss now falls steadily."
  },
  {
   "title": "Accuracy as the loss",
   "text": "Farhan tries to train with accuracy as the loss. A tiny weight change rarely flips any answer, so accuracy stays flat and the gradient is zero. He switches to cross-entropy, which changes smoothly, and training starts."
  },
  {
   "title": "Thirty sigmoid layers",
   "text": "Divya's 30-layer sigmoid network barely improves. She switches to ReLU with He initialisation and adds batch normalisation. The first layers now get a real signal, and the loss starts falling."
  },
  {
   "title": "Decaying the wrong thing",
   "text": "Anil wants to fight overfitting, so he adds learning-rate decay. The steps get smaller, but the weights stay large and the overfitting stays. He adds weight decay instead, and the validation score (on data kept aside) improves."
  }
 ],
 "selfCheck": [
  {
   "title": "Hint for the paper network",
   "text": "Pick x = [1, 2], small weights like 0.5 and −0.5, and biases 0. Write each step: hidden sums, ReLU, output sum, sigmoid, loss. Then go backwards, multiplying one local slope per step. Keep every number to two decimals."
  },
  {
   "title": "NumPy forward pass shape",
   "text": "Your forward pass can be two lines. The first, `h = np.maximum(0, X @ W1 + b1)`, makes the hidden layer: `@` multiplies the inputs by the weights, and `np.maximum(0, ...)` is ReLU. The second, `p = sigmoid(h @ W2 + b2)`, gives the chance of class 1, using a sigmoid function you write yourself. The backward pass goes through the same steps in reverse order."
  },
  {
   "title": "Reading three learning rates",
   "text": "A good answer sounds like this. \"At 0.001 the loss fell very slowly, like a crawl. At 0.1 it fell fast and settled low. At 10 it jumped around and became `nan`, because each step overshot the lowest point.\""
  },
  {
   "title": "Showing the gap shrink",
   "text": "Sample result: 64 hidden neurons and 40 examples gave 100% training and 78% validation accuracy. With dropout of 0.5 (each neuron off half the time), it gave 92% and 88%. The gap fell from 22 points to 4 points."
  },
  {
   "title": "A five-sentence client answer",
   "text": "\"The network starts by guessing. We show it the right answer, and it measures how far off it was. It then finds which of its settings caused most of the mistake. It changes each one a tiny bit. After thousands of rounds, its guesses become good.\""
  },
  {
   "title": "Checking the moons result",
   "text": "Use the same train/test split (the same rows to learn from, and the same rows to check on) for both models. With `noise=0.2` (how scattered the dots are), logistic regression usually scores about 87% on `make_moons`. A good two-layer network should clearly beat it, often reaching 96% or more."
  }
 ]
};
