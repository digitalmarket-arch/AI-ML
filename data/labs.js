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
 }
];
