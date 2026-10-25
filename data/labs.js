/* AI Marg data file. This is JavaScript holding JSON: keep the quotes and commas valid.
   See README.md > "Editing the course" before changing it. */
window.AIM = window.AIM || {};
window.AIM.labs = [
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
    "text": "Cure overfitting with more data: at degree 10 or more, first see “Overfitting”, then add training points until the verdict says “Good fit”."
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
    "text": "With Random starting centres, Re-initialise and Run until K-Means gets stuck with an inertia well above “Best for this K”. Then switch to k-means++ and beat it."
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
    "text": "Solve XOR with exactly 1 hidden layer: reach 95% test accuracy."
   },
   {
    "id": "t3",
    "text": "Untangle the Spiral: reach 90% test accuracy. (Hint: try 2 hidden layers.)"
   },
   {
    "id": "t4",
    "text": "Make training blow up: with tanh, set the learning rate to 3 or 10 and train until the training loss jumps above 1.5 (much worse than guessing)."
   }
  ]
 },
 {
  "id": "convolution",
  "module": "l3-cv",
  "title": "Convolution filters & pooling",
  "summary": "Draw a digit or a Devanagari letter, slide a 3×3 filter over it, and see how edge, blur and sharpen kernels, stride, padding, ReLU and max-pooling change what a CNN sees.",
  "tasks": [
   {
    "id": "t1",
    "text": "Find the kernel that lights up the up-down (vertical) strokes, then tap one of the brightest pixels in its feature map to see the multiply-and-add."
   },
   {
    "id": "t2",
    "text": "Make your own horizontal-line detector: type numbers into the 3×3 kernel grid so left-right strokes light up but up-down strokes stay grey. (A preset alone does not count.)"
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
 }
];
