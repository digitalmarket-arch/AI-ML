/* AI Marg lesson-card examples for one module (loaded with its lesson cards). JavaScript holding JSON. */
window.AIM = window.AIM || {};
window.AIM.examples = window.AIM.examples || {};
window.AIM.examples["l3-cv"] = {
 "overview": [
  {
   "title": "Tomato sorting in Nashik",
   "text": "Imagine a packing shed in Nashik. A camera photographs each tomato on a moving belt. A CNN answers 'ripe' or 'unripe', and a small arm pushes the unripe ones into a separate crate."
  },
  {
   "title": "Saree checking in Surat",
   "text": "Imagine a Surat textile mill. A camera above the loom (the weaving machine) takes a photo every second. Filters that react to odd edges spot a broken thread, so the loom stops before metres of cloth are spoiled."
  },
  {
   "title": "A cricket photo is numbers",
   "text": "A phone photo of a Ranji Trophy match is 4,000 × 3,000 = 1,20,00,000 pixels. With 3 colour numbers each, that is 3.6 crore numbers. The CNN sees only these numbers, not 'a batsman'."
  },
  {
   "title": "Helmet check at a junction",
   "text": "Imagine a traffic camera in Pune. Object detection draws a box around each rider and labels it 'helmet' or 'no helmet'. The boxes let the system count riders, which one label for the whole picture cannot do."
  },
  {
   "title": "Flood map after monsoon rain",
   "text": "Imagine a city team in Chennai after heavy rain. Segmentation labels every pixel of a drone photo as 'water' or 'road'. Counting the water pixels shows how much of each street is under water."
  },
  {
   "title": "Reading a PAN card",
   "text": "Imagine a fintech app in Kolkata. You photograph your PAN card for KYC. A vision model finds the card's corners, straightens the photo and reads the printed name and number."
  }
 ],
 "outcomes": [
  {
   "title": "Output size in an interview",
   "text": "Itishree in Bhubaneswar is asked about a 64 × 64 photo, 16 filters of 5 × 5, stride 1 and no padding. She says (64 − 5) ÷ 1 + 1 = 60, so 60 × 60 × 16. After 2 × 2 pooling, it is 30 × 30 × 16."
  },
  {
   "title": "CNN beats MLP",
   "text": "Rohit in Indore trains both models on CIFAR-10 for 10 epochs (full passes over the photos). In his run, the MLP gets about 50% on test photos and the CNN about 70%. He explains that filters reuse the same weights and keep nearby pixels together."
  },
  {
   "title": "Fine-tuning for a dairy",
   "text": "Imagine Meena in Anand, Gujarat, with 150 photos each of clean and dirty milk cans. She fine-tunes a pretrained ResNet, with random flips and brightness changes. It gets 94% right on photos it never saw."
  },
  {
   "title": "Scoring a detector",
   "text": "Farhan in Hyderabad runs YOLO on 50 labelled street photos. A box counts as correct when its IoU with the true box is 0.5 or more. He reports an mAP of 0.62: the detector's overall score from 0 to 1."
  },
  {
   "title": "Detection or segmentation?",
   "text": "A Nagpur orange grower asks Swati to count the fruit on each tree. Boxes are enough to count, so she picks detection. For 'how much of each leaf is diseased', she would pick segmentation."
  },
  {
   "title": "OpenCV for a kirana shop",
   "text": "Joseph in Kochi writes a short OpenCV script for his uncle's kirana shop. It loads shelf photos and resizes them to 640 pixels wide. Then it draws a box and the word 'empty' on each gap that his detection model found."
  }
 ],
 "studySteps": [
  {
   "title": "One hour after office",
   "text": "Manoj, a bank clerk in Patna, does one step per evening. Monday is the filters Lab, Tuesday and Wednesday the CIFAR-10 CNN, Thursday the fine-tuning. He keeps Saturday for YOLO on a video of his own street."
  },
  {
   "title": "College student on free Colab",
   "text": "Sana in Aligarh trains in Colab. Before training, she switches Colab's runtime (the computer behind it) to GPU. Each *epoch*, one full pass over the photos, then runs much faster. She saves her notebook to Google Drive after every session."
  },
  {
   "title": "Homemaker with a phone camera",
   "text": "Lakshmi in Coimbatore builds her own dataset for step 3: 120 photos each of ripe and unripe bananas. She shoots in morning and evening light, so the model sees real variety."
  },
  {
   "title": "Weekend learner in Guwahati",
   "text": "Bikram watches the videos on Saturday and does the YOLO step on Sunday. He films two minutes of traffic near Paltan Bazaar and writes down every autorickshaw the model misses."
  },
  {
   "title": "Slow internet in a hill town",
   "text": "Dawa in Kalimpong watches the videos at low quality to save data. She does the convolution practice (अभ्यास, abhyaas) on paper first, with a 5 × 5 grid and a 3 × 3 filter, and only then types it in NumPy."
  },
  {
   "title": "Quiz score below 70%",
   "text": "Arvind scores 60% on the quiz. Most of his misses were sums: output size, IoU (box overlap) and a convolution. He works three of each on paper, then takes the quiz again."
  }
 ],
 "keyTerms": [
  {
   "title": "Filters on a number plate",
   "text": "Imagine a toll plaza camera in Vadodara. Early filters react to the sharp edges of the letters on a number plate. Pooling keeps the strongest edge scores, so the plate is still found when the car stops a little to the left."
  },
  {
   "title": "ResNet for chest X-rays",
   "text": "Imagine a hospital team in Vellore testing a 50-layer ResNet on chest X-rays. Its skip connections let all 50 layers train well. A plain 50-layer stack without shortcuts would struggle."
  },
  {
   "title": "Augmenting Alphonso mangoes",
   "text": "Riya in Ratnagiri has 150 mango photos. She adds random brightness changes and small turns, because a mango in shade is still a mango. Left-right flips are safe for mangoes, but not for a 'No Left Turn' sign, which would then point the wrong way."
  },
  {
   "title": "Transfer learning on a tea estate",
   "text": "Imagine a tea estate in Assam with 300 leaf photos in 3 classes. The team starts from an ImageNet-trained ResNet. They swap its head for a 3-class one and train only that head, in a few minutes on Colab."
  },
  {
   "title": "IoU at a parking lot",
   "text": "Imagine a Gurugram mall checking its parking-space detector. A true car box and a predicted box each cover 5,000 pixels and share 4,000. IoU = 4,000 ÷ (5,000 + 5,000 − 4,000) ≈ 0.67, so the box counts as correct."
  },
  {
   "title": "Segmentation for potholes",
   "text": "Imagine a road team in Jaipur. Segmentation marks every pothole pixel in road photos. So the team can measure each pothole's size in square metres, not just say 'pothole found'."
  },
  {
   "title": "Detection for a dabba count",
   "text": "Imagine a Mumbai dabbawala group testing a camera at a station. Object detection puts a box around each tiffin dabba on a crate. Counting the boxes checks that no dabba is left behind."
  }
 ],
 "indiaExample": [
  {
   "title": "DigiYatra at airports",
   "text": "DigiYatra lets air travellers pass airport gates by showing their face to a camera. A face model matches it to the face they registered, linked to their boarding pass. In May 2026, the civil aviation ministry said it works at 38 airports."
  },
  {
   "title": "Kerala's road cameras",
   "text": "In 2023, Kerala's Motor Vehicles Department switched on about 726 AI cameras under its 'Safe Kerala' project. They spot riders without helmets, people without seat belts and three people on one two-wheeler. This is object detection at work."
  },
  {
   "title": "Pomegranate grading in Solapur",
   "text": "Imagine a fruit packhouse in Solapur. Each pomegranate is photographed from four sides. A classifier gives one label per fruit, 'export', 'local market' or 'juice', based on colour and spots."
  },
  {
   "title": "Cars at a Bengaluru junction",
   "text": "Imagine a Bengaluru junction camera. Detection counts the vehicles waiting on each road every 30 seconds. A road with 40 waiting vehicles gets a longer green light than a road with 5."
  },
  {
   "title": "Electricity meter photos",
   "text": "Imagine an electricity board in Odisha. Meter readers upload a photo of each meter. A model finds the number display and reads the units, so a typing slip cannot change your bill."
  },
  {
   "title": "Waterlogging on a sugarcane farm",
   "text": "Imagine a sugarcane farm near Kolhapur after heavy rain. Segmentation labels every pixel of a drone photo as 'water' or 'crop'. The farmer learns that 12% of the field is waterlogged and digs drains there first."
  }
 ],
 "commonMistakes": [
  {
   "title": "Scratch training on 300 photos",
   "text": "Kunal in Ranchi trains a CNN from scratch on 300 parcel photos. Training accuracy hits 100%, but test accuracy is 58%. He switches to a pretrained ResNet-18 with a new head (last layer), and test accuracy rises to 91%."
  },
  {
   "title": "Raw photos at prediction",
   "text": "Divya's model learned from 224 × 224 normalised photos. Her app feeds it full 1080 × 1920 phone photos with raw 0 to 255 values. The answers look random until she reuses the training resize and normalise steps."
  },
  {
   "title": "Flipped traffic signs",
   "text": "Harish adds random left-right flips to a Chennai traffic-sign dataset. Flipped 'No Left Turn' photos keep their old label. The model mixes up left and right turns, so he removes flips and keeps small turns."
  },
  {
   "title": "56 layers, worse training error",
   "text": "Pooja's plain 56-layer network has higher training error than her 20-layer one. She adds dropout (switching off random parts of the network while training), an overfitting fix, and it gets worse. Skip connections are the real fix: with ResNet blocks, the deeper model trains better."
  },
  {
   "title": "Blue chillies on screen",
   "text": "Arjun loads a photo of red chillies from a Guntur mandi with `cv2.imread('mirchi.jpg')`. He shows it with `plt.imshow(img)`, and the chillies look blue. Adding `img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)` fixes the display; the file was fine all along."
  },
  {
   "title": "Licence found too late",
   "text": "Imagine a Pune agency that ships a shop-camera product built on Ultralytics YOLO, with its code kept secret. Weeks later, the client's lawyer spots the AGPL-3.0 licence. Now they must buy an Enterprise licence or rebuild on a model whose licence allows closed use."
  }
 ],
 "selfCheck": [
  {
   "title": "Hint for the hand convolution",
   "text": "The 3 × 3 window fits in 5 − 3 + 1 = 3 spots across and 3 down, so the output is 3 × 3. At each spot, multiply the 9 pairs and add. With an edge filter, a spot on one flat colour gives 0."
  },
  {
   "title": "A good CNN vs MLP answer",
   "text": "Sample: 'The CNN got 70% and the MLP 50%. The CNN reuses each filter at every spot, so it has far fewer numbers to learn. It also keeps nearby pixels together, while the MLP flattens the photo into one long list.'"
  },
  {
   "title": "Reading your confusion matrix",
   "text": "Rows show the true class and columns the predicted class. If many 'damaged' parcels are predicted 'undamaged', collect more damaged photos in more lighting. Say which mistake costs the client more."
  },
  {
   "title": "Planning the autorickshaw data",
   "text": "A good plan: 500 or more photos of autorickshaws from several cities, by day and night, in rain and sun, with a box drawn round each one. Also label e-rickshaws and handcarts, which COCO lacks too."
  },
  {
   "title": "OpenCV hint",
   "text": "`cv2.imread('shop.jpg')` loads, `cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)` turns it grey and `cv2.resize(img, (640, 480))` resizes it (width comes first). `cv2.rectangle()` and `cv2.putText()` draw, and `cv2.imwrite()` saves."
  },
  {
   "title": "Vision Transformer in a paragraph",
   "text": "Sample: 'A CNN looks through a small window and builds up from edges. A Vision Transformer cuts a 224 × 224 photo into 196 patches of 16 × 16. Each patch becomes a token, the photo's version of a word, stored as a list of numbers. Its position is added, and every patch is compared with every other.'"
  },
  {
   "title": "Why ViTs need pretraining",
   "text": "A CNN's small sliding window already assumes that nearby pixels belong together. A Vision Transformer (ViT) must learn even that from data. So ViTs usually need a lot of data or pretraining, and you normally fine-tune a pretrained one."
  },
  {
   "title": "Consent and the DPDP Act",
   "text": "A face photo can identify a person, so it is personal data under the DPDP Act, 2023. Its rules were officially published in November 2025, and they come in step by step over 18 months. Practise on tomatoes or parcels instead."
  }
 ]
};
