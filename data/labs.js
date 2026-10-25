/* AI Marg data file. This is JavaScript holding JSON: keep the quotes and commas valid.
   See README.md > "Editing the course" before changing it. */
window.AIM = window.AIM || {};
window.AIM.labs = [
 {
  "id": "pytrace",
  "module": "l1-python",
  "title": "Step through Python",
  "summary": "Replay five short Python programs one line at a time and watch names, lists and function frames change, exactly as real Python runs them.",
  "tasks": [
   {
    "id": "t1",
    "text": "Step through program 2 (the for loop) one line at a time, all the way to the final bill."
   },
   {
    "id": "t2",
    "text": "In program 4, watch a function frame appear when add_gst is called, then step on until it is thrown away when the function returns."
   },
   {
    "id": "t3",
    "text": "Spot aliasing: in program 5, find the step where changing same also changes cart, and press “cart changed on this step”."
   },
   {
    "id": "t4",
    "text": "Predict before you step: answer 3 prediction questions correctly."
   }
  ]
 },
 {
  "id": "clt",
  "module": "l1-stats",
  "title": "Sample means & the bell curve",
  "summary": "Draw many random samples, average each one, and watch those averages pile up into a bell curve, even when the population itself is lopsided.",
  "tasks": [
   {
    "id": "t1",
    "text": "Set n = 1 and collect at least 500 means. Does the bottom chart copy the population’s shape?"
   },
   {
    "id": "t2",
    "text": "Choose Income (right-skewed), set n to 30 or more and collect 1,000 means. Spot the bell shape (try “Zoom in”)."
   },
   {
    "id": "t3",
    "text": "Quadruple n on the same population (e.g. 10 → 40), with 200+ means each time, and see the SD of the means roughly halve."
   },
   {
    "id": "t4",
    "text": "Collect 1,000+ means in one run and get the SD of sample means within 5% of σ/√n."
   }
  ]
 },
 {
  "id": "matrix",
  "module": "l1-linalg-calc",
  "title": "Matrix transformations",
  "summary": "See how a 2×2 matrix stretches, turns, flips or flattens the whole plane, and what the determinant and eigenvectors tell you about it.",
  "tasks": [
   {
    "id": "t1",
    "text": "Squash the plane flat: make the determinant exactly 0 yourself, so the whole grid collapses onto one line."
   },
   {
    "id": "t2",
    "text": "Flip space like a mirror: get a negative determinant (try dragging ĵ to the other side of î)."
   },
   {
    "id": "t3",
    "text": "Build a matrix whose eigenvalues are exactly 2 and 0.5."
   },
   {
    "id": "t4",
    "text": "Rotate the plane by exactly 90° (a quarter turn) with no stretching."
   }
  ]
 },
 {
  "id": "overfit",
  "module": "l2-ml-foundations",
  "title": "Underfitting vs overfitting",
  "summary": "Fit curves of different bendiness to noisy dots and watch training error and test error split apart when a model memorises instead of learning.",
  "tasks": [
   {
    "id": "t1",
    "text": "Find the sweet spot: move the degree to the one with the lowest test error (the lowest hollow dot on the error chart)."
   },
   {
    "id": "t2",
    "text": "Overfit on purpose: raise the degree until training error is almost 0 (below 0.02) while test error shoots above 1. Tip: fewer training points make this easier."
   },
   {
    "id": "t3",
    "text": "Cure overfitting with more data: at degree 10 or more, first see “Overfitting”. Then, without lowering the degree, add training points until the verdict says “Good fit”."
   },
   {
    "id": "t4",
    "text": "Feel the wobble: drag a filled dot up or down with a low degree (4 or less), then with a high degree (10 or more). Which curve jumps more?"
   }
  ]
 },
 {
  "id": "gradient",
  "module": "l2-regression",
  "title": "Gradient descent",
  "summary": "Watch gradient descent walk downhill on a loss map to fit a straight line to Pune flat prices, and see how the learning rate, stochastic steps and outliers change the walk.",
  "tasks": [
   {
    "id": "t1",
    "text": "Press Run (or Step) until the loss is within 1% of the best possible loss."
   },
   {
    "id": "t2",
    "text": "Make it diverge (blow up): raise the learning rate until the loss grows with every step instead of shrinking."
   },
   {
    "id": "t3",
    "text": "Switch to Stochastic and take at least 20 steps. Watch the path zig-zag, with some steps even going uphill."
   },
   {
    "id": "t4",
    "text": "Add an outlier (a flat with a very odd price, far from the line, near the left or right edge), then Run until the line settles. Watch it tilt."
   }
  ]
 },
 {
  "id": "knn",
  "module": "l2-classification",
  "title": "K-Nearest Neighbours: loan risk map",
  "summary": "Predict whether a loan will be repaid by letting its K most similar past loans vote, and see how K and the distance measure reshape the decision boundary.",
  "tasks": [
   {
    "id": "t1",
    "text": "Slide K down to 1. Training accuracy jumps to 100%, but the map breaks into jagged islands around single loans. That is overfitting (memorising the data, noise included)."
   },
   {
    "id": "t2",
    "text": "Find the best K: try at least 4 values of K, then leave the slider on the one with the highest leave-one-out accuracy (the accuracy chart keeps score)."
   },
   {
    "id": "t3",
    "text": "Add a loan that looks mislabelled: a Defaulted point deep inside the Repaid area (or the other way round). See it get its own island at K = 1, then get out-voted at K = 5 or more."
   },
   {
    "id": "t4",
    "text": "Try a third class: add at least 3 “Paid late” loans close together in an empty corner. With a small K, KNN paints a third region for them."
   }
  ]
 },
 {
  "id": "threshold",
  "module": "l2-metrics-tuning",
  "title": "Threshold, confusion matrix & ₹ cost",
  "summary": "Pick the score above which a UPI payment is flagged as fraud, and watch the confusion matrix, precision, recall, the ROC curve and the rupee cost of mistakes change.",
  "tasks": [
   {
    "id": "t1",
    "text": "Get fooled by accuracy: set the fraud rate to 1% and the threshold to 1.00, so nothing is flagged. Accuracy shows 99%, but how many frauds did it catch?"
   },
   {
    "id": "t2",
    "text": "Find the cheapest threshold: move the threshold to the spot where the total ₹ cost of mistakes is lowest (the ★ on the cost chart)."
   },
   {
    "id": "t3",
    "text": "Catch at least 90% of frauds by moving the threshold (recall 90% or more). Then read the precision: what share of your flags are real frauds?"
   },
   {
    "id": "t4",
    "text": "Build a better model: raise Separation until the AUC is 0.97 or more, and watch the ROC curve bend towards the top-left corner."
   }
  ]
 },
 {
  "id": "tree",
  "module": "l2-trees-ensembles",
  "title": "Decision tree & forest",
  "summary": "Grow a real decision tree that sorts farms into good and poor rice harvests, watch it overfit, then let a forest of trees vote.",
  "tasks": [
   {
    "id": "t1",
    "text": "Set Max depth to 1 and see a \"stump\": a tree that asks just one question, so it makes a single straight cut."
   },
   {
    "id": "t2",
    "text": "Try at least 4 different depths, then settle on the depth that gives the highest test accuracy."
   },
   {
    "id": "t3",
    "text": "Make the tree memorise noise: reach 100% train accuracy while test accuracy drops below its best."
   },
   {
    "id": "t4",
    "text": "Switch on the forest (5 or more trees) and beat the single tree's test accuracy at the same settings."
   }
  ]
 },
 {
  "id": "kmeans",
  "module": "l2-unsupervised",
  "title": "K-Means: group your customers",
  "summary": "Watch K-Means sort supermarket customers into groups, step by step, and learn when it works and when it fails.",
  "tasks": [
   {
    "id": "t1",
    "text": "Step by hand: press Assign, then Update, again and again until “Converged” says Yes."
   },
   {
    "id": "t2",
    "text": "On “3 clear groups”, find the bend (the “elbow”) in the elbow chart, set K to it and run to convergence."
   },
   {
    "id": "t3",
    "text": "With Random starting centres, Run (and “Run again”) until K-Means gets stuck with an inertia well above “Best for this K” (tip: “5 groups” with K = 5). Then switch to k-means++ and beat it."
   },
   {
    "id": "t4",
    "text": "Pick “Two moons”, set K = 2 and run. See K-Means cut the moons the wrong way."
   }
  ]
 },
 {
  "id": "neuralnet",
  "module": "l3-nn-basics",
  "title": "Neural network playground",
  "summary": "Build a small neural network, train it live and watch it learn to separate blue points from orange ones, from a straight line to a spiral.",
  "tasks": [
   {
    "id": "t1",
    "text": "Pick Circle, set 0 hidden layers and train for at least 200 epochs. See test accuracy stay stuck below 75%: with no hidden layer the network can only draw one straight line."
   },
   {
    "id": "t2",
    "text": "Solve XOR with exactly 1 hidden layer: reach 95% test accuracy. (Stuck below 95%? Press Reset to start again from new random weights.)"
   },
   {
    "id": "t3",
    "text": "Untangle the Spiral: reach 90% test accuracy. (Hint: try 2 hidden layers with 6 to 8 neurons each.)"
   },
   {
    "id": "t4",
    "text": "Make training blow up: set the learning rate to 10 and train until the training loss jumps above 1.5 (far worse than the 0.69 of pure guessing)."
   }
  ]
 },
 {
  "id": "convolution",
  "module": "l3-cv",
  "title": "Convolution filters & pooling",
  "summary": "Draw a digit or a shape, slide a 3×3 filter over it, and see how edge, blur and sharpen kernels, stride, padding, ReLU and max-pooling change what a CNN (convolutional neural network) sees.",
  "tasks": [
   {
    "id": "t1",
    "text": "Find the kernel that lights up the up-down (vertical) strokes, then tap one of the brightest pixels in its feature map to see the multiply-and-add."
   },
   {
    "id": "t2",
    "text": "Make your own horizontal-line detector: type numbers into the 3×3 kernel grid so left-right strokes light up but up-down strokes stay blank (close to 0). (A preset alone does not count.)"
   },
   {
    "id": "t3",
    "text": "Switch the stride to 2 (the filter jumps 2 pixels at a time) and watch the feature map shrink to about half its width."
   },
   {
    "id": "t4",
    "text": "Turn on ReLU + 2×2 max-pool and make the final output exactly 7 × 7. (Hint: use the output-size formula.)"
   }
  ]
 },
 {
  "id": "tokenizer",
  "module": "l3-transformers",
  "title": "Tokenizer (BPE) lab",
  "summary": "Train a tiny Byte-Pair Encoding tokenizer on English, Hindi and Hinglish text, merge by merge, and see why Hindi often needs more tokens per word.",
  "tasks": [
   {
    "id": "t1",
    "text": "Do at least 20 merges, then find the first merge that made a complete word (not just a piece of one) and tap it in the merge list."
   },
   {
    "id": "t2",
    "text": "Keep merging until an English word needs fewer than 2.5 tokens on average. How many does a Hindi word need at that point?"
   },
   {
    "id": "t3",
    "text": "In “Try new text”, type a word that is not in the training text (try “relearning” or “tokenizing”) and watch it split into pieces the tokenizer already knows."
   },
   {
    "id": "t4",
    "text": "Do at least 30 merges, then switch the training text to “More Hindi”. Do the same Hindi sentences now need fewer tokens per word?"
   }
  ]
 },
 {
  "id": "sampling",
  "module": "l4-llm-internals",
  "title": "Next-token sampling: temperature, top-k, top-p",
  "summary": "Watch a tiny language model score every possible next word, then see how temperature, top-k and top-p change which word the dice pick.",
  "tasks": [
   {
    "id": "t1",
    "text": "Greedy: set temperature to 0, press “Generate 15 tokens”, then “Reset prompt” and generate again. You get exactly the same text both times (and it may get stuck repeating itself)."
   },
   {
    "id": "t2",
    "text": "Chaos: set temperature to 2 (top-k 50 and top-p 1.00 make it even wilder) and generate 15 tokens. When at least 3 never-seen words (wavy underline) sneak in, you are reading nonsense."
   },
   {
    "id": "t3",
    "text": "Set top-k to 1, keep temperature at 1 or more, and generate 15 tokens. It is exactly the greedy text, because only the top word is left to pick."
   },
   {
    "id": "t4",
    "text": "With top-k at 4 or more and temperature above 0, find a top-p value that leaves exactly 3 words possible for the next token."
   }
  ]
 },
 {
  "id": "lora",
  "module": "l4-finetuning",
  "title": "LoRA and quantisation",
  "summary": "See how LoRA copies a fine-tuning change with two thin matrices, how few numbers it trains on real layers, and how 4-bit quantisation squeezes a 7B model onto a free GPU.",
  "tasks": [
   {
    "id": "t1",
    "text": "Find the smallest rank r whose patch B·A copies the change ΔW with less than 5% error (keep “Low-rank + noise” selected)."
   },
   {
    "id": "t2",
    "text": "Work out why rank 1 is not enough for this change: compare the pattern-strength bars, then answer the question under them."
   },
   {
    "id": "t3",
    "text": "In the scale-up calculator, set d = 4,096 and r = 8, then type how many times fewer numbers LoRA trains than full fine-tuning."
   },
   {
    "id": "t4",
    "text": "Plan a QLoRA fine-tune on a free Colab T4: choose a 7B model, “Fine-tune with LoRA”, the T4 and 4-bit, and see it fit."
   }
  ]
 }
];
