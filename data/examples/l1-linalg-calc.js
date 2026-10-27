/* AI Marg lesson-card examples for one module (loaded with its lesson cards). JavaScript holding JSON. */
window.AIM = window.AIM || {};
window.AIM.examples = window.AIM.examples || {};
window.AIM.examples["l1-linalg-calc"] = {
 "overview": [
  {
   "title": "Customers as arrows in Surat",
   "text": "A sari shop in Surat stores each customer as a vector: [monthly spend in ₹ thousand, visits per month]. Asha is [4, 3] and Meera is [6, 3]. Their arrows point almost the same way. So the shop shows Meera the saris that Asha liked."
  },
  {
   "title": "A photo is a matrix",
   "text": "A small black-and-white photo of a handwritten digit is 28 dots wide and 28 dots tall. Each dot, or pixel, is one number, from 0 for black to 255 for white. To the computer, the photo is a 28 × 28 matrix: 784 numbers."
  },
  {
   "title": "Chai price and profit in Patna",
   "text": "Ramesh tries his chai at ₹10 and then at ₹11 a cup. His daily profit goes from ₹1,500 to ₹1,560. So near ₹10, profit rises about ₹60 for each extra ₹1. That rate of change is what a derivative measures."
  },
  {
   "title": "Onion prices in Nashik",
   "text": "Imagine a model that predicts onion prices at the Nashik mandi. At first, its guesses miss by ₹12 a kg on average. Gradient descent checks the slope of this error and changes the model's numbers a little. After many small steps, the average miss falls to about ₹2."
  },
  {
   "title": "Songs that sound alike",
   "text": "Imagine a music app in Chennai. It turns each song into a vector, such as [beat speed, sadness, dance feel]. Songs with close vectors sound similar (मिलता जुलता, milta julta). So after a slow melody you loved, it suggests songs with nearby vectors."
  },
  {
   "title": "All the bills in one go",
   "text": "Fatima runs a canteen in Hyderabad. She buys rice, dal and oil from two suppliers. One matrix multiplication of her quantities and their prices gives every bill at once. She does not need to work out each bill separately."
  }
 ],
 "outcomes": [
  {
   "title": "Riya checks shapes first",
   "text": "Riya in Pune has 500 customers with 3 numbers each: a 500×3 matrix. Her model's weights, the numbers it learns, form a 3×1 matrix. She writes: 500×3 times 3×1 gives 500×1, one prediction per customer. The inner 3s match, so it works."
  },
  {
   "title": "Imran flattens the grid",
   "text": "In the Matrix lab, Imran types the matrix [[1, 2], [2, 4]]. The whole grid falls onto one line. He explains: the determinant is 1×4 − 2×2 = 0, so every area becomes zero. A move like this cannot be undone, so the matrix has no *inverse*, a matrix that would undo it."
  },
  {
   "title": "Divya stretches a photo",
   "text": "Divya makes a photo 2 times wider on her phone: the matrix [[2, 0], [0, 1]]. Arrows that point sideways only get longer, so they are eigenvectors with eigenvalue (stretch number) 2. Upright arrows stay the same, with eigenvalue 1. Slanted arrows tilt, so they are not eigenvectors."
  },
  {
   "title": "Karthik uses the chain rule",
   "text": "Karthik's formula has two steps: first u = 2x + 1, then y = u². He multiplies the two slopes: 2 for the first step and 2u for the second. At x = 1, u = 3, so the slope is 2 × 6 = 12."
  },
  {
   "title": "Joseph finds a gradient",
   "text": "Joseph's practice error formula is E = w² + 4b, with two weights, w and b. Keeping b fixed, the slope in w is 2w. Keeping w fixed, the slope in b is 4. At w = 3, the gradient is [6, 4]."
  },
  {
   "title": "Sneha steps against the slope",
   "text": "Sneha's practice error is (w − 3)², lowest at w = 3; its slope is 2 × (w − 3). At w = 5 the slope is 4: positive, so uphill is to the right. With a learning rate (step size) of 0.1, she steps left: 5 − 0.1 × 4 = 4.6. The error falls from 4 to 2.56."
  }
 ],
 "studySteps": [
  {
   "title": "One hour after office",
   "text": "Suresh, a bank clerk in Kanpur, has one free hour a day, so he spreads this module's 12 hours over about two weeks. Days 1 to 5: vectors and matrices videos. Day 6: the Matrix lab. Days 7 to 10: eigenvector and calculus videos, then practice. Day 11: the quiz. Day 12: the self-check tasks."
  },
  {
   "title": "College student with graph paper",
   "text": "Anjali, a BSc student in Kochi, draws every vector as an arrow on graph paper. When two arrows point the same way, her dot product comes out big. With that picture in mind, the one-line answer from NumPy, a Python library (ready-made code) for maths, now makes sense to her."
  },
  {
   "title": "Homemaker in short breaks",
   "text": "Shabana in Lucknow studies in 20-minute breaks. She watches one short lesson per break. She writes one worked example in a notebook, like the dot product 2×50 + 1×120 = 220. Before the quiz, she reads the notebook once."
  },
  {
   "title": "Weekend learner in Guwahati",
   "text": "Bikash studies only at weekends, so he spreads the 12 hours over two weekends. First weekend: the linear algebra videos and the Matrix lab. Second weekend: calculus, the quiz and the 10-line gradient descent loop. He runs the loop in Google Colab, a free online Python notebook."
  },
  {
   "title": "Slow internet in Sikkim",
   "text": "Tenzin has a slow connection in a hill town. She watches videos at low quality to save data. She does matrix multiplication and derivatives on paper, with no internet. She checks her answers in NumPy when the signal is good."
  },
  {
   "title": "Quiz score below 70%",
   "text": "Kiran scores 60% on the quiz. Most wrong answers are about the chain rule and determinants. She rewatches (दोबारा देखना, dobara dekhna) only those two lessons. She redoes the lab task with determinant 0, then takes the quiz again."
  }
 ],
 "keyTerms": [
  {
   "title": "Film taste in Kolkata",
   "text": "Imagine a streaming app in Kolkata. Priya's taste vector is [comedy 5, action 1, drama 3], and a film's vector is [4, 0, 2]. Their dot product is 5×4 + 1×0 + 3×2 = 26, a strong match. So the app suggests the film."
  },
  {
   "title": "A school marks matrix",
   "text": "A Lucknow school stores 40 students' marks in 5 subjects as a 40×5 matrix. Multiplying it by a 5×1 matrix of 0.2s gives a 40×1 matrix. That is each student's average (औसत, ausat) mark, all at once."
  },
  {
   "title": "Rider distance in Bengaluru",
   "text": "A delivery rider is 3 km east and 4 km north of the shop. The straight-line distance, the L2 norm, is √(9 + 16) = 5 km. Along the grid of roads, the L1 norm, it is 3 + 4 = 7 km."
  },
  {
   "title": "A mirrored selfie",
   "text": "A phone can save your selfie mirrored. Each point (x, y) goes to (−x, y): the matrix [[−1, 0], [0, 1]]. Its determinant is −1 × 1 − 0 × 0 = −1. Areas stay the same size, but left and right swap."
  },
  {
   "title": "Pickle price in Guntur",
   "text": "Meena sells pickle jars in Guntur. Raising the price from ₹100 to ₹101 raises her daily profit from ₹4,000 to ₹4,030. So the derivative of profit near ₹100 is about ₹30 for each ₹1."
  },
  {
   "title": "Two weights for wheat",
   "text": "Imagine a Punjab model that predicts wheat yield (पैदावार, paidaavaar) with two weights, the numbers it learns: one for rain, one for fertiliser. The gradient of its error is [4, −2]. So gradient descent, which steps against the gradient, makes the rain weight smaller and the fertiliser weight bigger."
  },
  {
   "title": "The do-nothing matrix",
   "text": "The matrix [[1, 0], [0, 1]] is called the identity matrix. It leaves every point where it is, like multiplying a number by 1. Its determinant is 1×1 − 0×0 = 1, so areas stay the same."
  },
  {
   "title": "Main direction of flat data",
   "text": "Imagine data on 1,000 flats in Pune. Bigger flats usually have more rooms, so the dots spread along one slanted direction. A Level 2 method called PCA finds this main direction. It is an eigenvector of a matrix built from the data."
  }
 ],
 "indiaExample": [
  {
   "title": "DigiYatra at airports",
   "text": "DigiYatra started on 1 December 2022 at Delhi, Bengaluru and Varanasi airports. Flyers who sign up can use their face as their boarding pass at e-gates (automatic gates). A camera matches the live face with the registered photo, typically by comparing face vectors. Using it is optional."
  },
  {
   "title": "Life certificate by face scan",
   "text": "Central government pensioners must give a life certificate every November to keep getting their pension. With Jeevan Pramaan, many can do it by a face scan on a phone. The AadhaarFaceRD app from UIDAI, the Aadhaar agency, matches the face with Aadhaar records."
  },
  {
   "title": "Grocery suggestions in Indore",
   "text": "Imagine an online grocery app in Indore. Each family is a vector of monthly kg: [atta, rice, poha, sugar]. Families with close vectors shop alike. The app shows one family what the other often buys. A dot product (multiply matching numbers, then add) helps measure this closeness."
  },
  {
   "title": "UPI fraud score in Kochi",
   "text": "Imagine a bank in Kochi that scores UPI payments. Each payment is a vector: [amount in ₹ thousand, hour of day, new payee 1 or 0]. The score starts with a dot product of this vector and the model's weights, numbers it learned. Gradient descent found those weights from past fraud (धोखाधड़ी, dhokhadhadi) cases."
  },
  {
   "title": "Drone photo of a wheat field",
   "text": "Imagine a drone photo of a wheat field near Bathinda. To the computer, a colour photo is three matrices, or tables of numbers: one each for red, green and blue. A model trained with gradient descent reads these numbers and marks patches that look sick."
  },
  {
   "title": "Tamil to Hindi helpline",
   "text": "Imagine a helpline app that translates Tamil questions into Hindi. Models like this turn each word piece into a vector. Words with similar meanings get close vectors. The model learned these vectors with gradient descent, by training on many sentences."
  }
 ],
 "commonMistakes": [
  {
   "title": "Stuck on proofs for weeks",
   "text": "Rahul in Indore spends three weeks on proofs about determinants, the number that says how a matrix changes area. He never opens the Matrix lab and feels stuck. Then he switches: lab first, then the quiz. Ten minutes in the lab shows him what a determinant of 0 does: the grid squashes onto a line."
  },
  {
   "title": "Star instead of at",
   "text": "Priya has A = [[1, 2], [3, 4]] and B = [[5, 6], [7, 8]]. `A * B` gives [[5, 12], [21, 32]], cell by cell. She wanted matrix multiplication, so she switches to `A @ B` and gets [[19, 22], [43, 50]]."
  },
  {
   "title": "One giant step",
   "text": "Kabir thinks the gradient points straight to the bottom, so he takes one giant step. He lands far past the bottom, with a bigger error than before. He switches to many small steps against the gradient, and the error falls."
  },
  {
   "title": "Learning rate too big",
   "text": "Sameer runs gradient descent on the error (w − 3)², whose slope is 2 × (w − 3). He starts at w = 5 with a learning rate of 1.1. w goes to 0.6, then 5.88, then about −0.46: farther from 3 each time. With a rate of 0.1, every step moves w closer to 3."
  },
  {
   "title": "Missing the inner slope",
   "text": "Anjali works out the slope of y = (5x − 2)² at x = 1. She gets 2 × 3 = 6, but a quick check in Python gives 30. She forgot to multiply by the inner slope, 5. Now she writes both slopes before multiplying."
  },
  {
   "title": "Wrong order still runs",
   "text": "Neha writes `prices @ quantities` instead of `quantities @ prices`. The shapes are 3×2 and 2×3, so NumPy returns a 3×3 matrix with no error. But the numbers mean nothing. Writing the shapes first shows her that the bills must come out 2×2."
  }
 ],
 "selfCheck": [
  {
   "title": "Hint for 2×3 times 3×2",
   "text": "Take A = [[1, 2, 3], [4, 5, 6]] and B = [[1, 0], [0, 1], [1, 1]]. The top-left answer is row 1 of A dotted with column 1 of B: 1×1 + 2×0 + 3×1 = 4. Find the other three cells the same way. Then run `A @ B`."
  },
  {
   "title": "Why 2×3 times 2×3 fails",
   "text": "A row of the first matrix has 3 numbers. A column of the second has only 2. The numbers cannot pair up, so there is no dot product to take. A good answer says this in one or two sentences."
  },
  {
   "title": "Finding the closest customers",
   "text": "Try Asha [4, 3], Meera [6, 3] and Ravi [1, 5]. The distance is the length of the gap between two vectors. Asha to Meera: √(2² + 0²) = 2. Asha to Ravi: √(3² + 2²) ≈ 3.6. Meera to Ravi is even farther, so Asha and Meera are the most alike."
  },
  {
   "title": "First steps of the loop",
   "text": "The slope formula is 2x − 6, which is zero at x = 3. At x = 0 the slope is −6, so x becomes 0 − 0.1 × (−6) = 0.6. At 0.6 the slope is −4.8, so x becomes 1.08. Keep going, and x creeps towards 3."
  },
  {
   "title": "Rotation hint",
   "text": "Write each point as a column and multiply. (1, 0) goes to (0, 1): the arrow that pointed right now points up. Work out (0, 1) yourself. Then use a×d − b×c and ask: did the area change?"
  },
  {
   "title": "Explaining overshoot",
   "text": "Sample answer: \"Imagine crossing a narrow valley (घाटी, ghaati) with giant jumps. Each jump lands on the other slope, higher than before. You keep bouncing and never reach the bottom. Smaller jumps would settle there.\""
  }
 ]
};
