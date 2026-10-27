/* AI Marg lesson-card examples for one module (loaded with its lesson cards). JavaScript holding JSON. */
window.AIM = window.AIM || {};
window.AIM.examples = window.AIM.examples || {};
window.AIM.examples["l4-gen-vision"] = {
 "overview": [
  {
   "title": "New saree borders in Surat",
   "text": "Imagine a Surat textile studio that trains a VAE on 2,000 saree border designs. The designer picks a code halfway between a peacock border and a mango border. The decoder draws a new border that mixes both."
  },
  {
   "title": "Wedding card art in Jaipur",
   "text": "Imagine a Jaipur print shop. It types \"pink and gold flowers, Rajasthani style\" into a diffusion model and gets four background designs in a minute. Staff add the couple's names later in a design tool, because models often get lettering wrong."
  },
  {
   "title": "A fast GAN for game tiles",
   "text": "Imagine a Hyderabad game studio that needs thousands of new floor patterns. A small GAN makes each one in a single quick pass. A diffusion model would give more variety, but it needs many steps for each picture."
  },
  {
   "title": "Faulty bolts in Pune",
   "text": "Imagine a Pune factory that trains an autoencoder only on photos of good bolts. A good bolt is rebuilt almost perfectly. A cracked bolt is rebuilt badly, so its big rebuilding error marks it for a person to check."
  },
  {
   "title": "Finding photos by typing",
   "text": "Lakshmi in Chennai has 8,000 photos on her phone. A CLIP-based search lets her type \"temple festival at night\". CLIP scores every photo against those words, and the best matches come first."
  },
  {
   "title": "Reading an electricity bill",
   "text": "Arjun in Kolkata photographs his electricity bill. He asks a vision-language model, \"How much do I pay, and by when?\" It answers with the amount in ₹ and the due date. He still checks the numbers on the paper bill."
  }
 ],
 "outcomes": [
  {
   "title": "Choosing the right family",
   "text": "Riya works at a Mumbai agency. A client wants 200 varied product backgrounds, so she picks a diffusion model for quality and variety. For a live camera filter that must run fast on a phone, she suggests a GAN instead."
  },
  {
   "title": "Remaking an approved banner",
   "text": "A Diwali banner was approved in October. In March, Arjun opens his recipe sheet: seed 42, guidance scale 7.5, 25 steps, same prompt and model. He gets almost the same image back and changes only the colours."
  },
  {
   "title": "Photo search for a studio",
   "text": "Fatima runs a wedding photo studio in Lucknow. She uses CLIP to turn 5,000 photos into embeddings (lists of numbers) once. Now typing \"bride with mehendi\" sorts every photo by its match score in a second."
  },
  {
   "title": "Catching a VLM mistake",
   "text": "Gurpreet tests a vision-language model on 20 dhaba menus from Amritsar. It reads ₹180 as ₹130 on two menus with Gurmukhi text. So he adds a rule: a person checks every price before it goes online."
  },
  {
   "title": "Checks before a campaign",
   "text": "Meera in Kochi drafts ads for a jewellery brand. She confirms that the model's licence allows business use. She removes a face that looks like a film star, and adds an \"AI-generated\" label where the platform asks for it."
  },
  {
   "title": "Finding cracked tiles",
   "text": "Imran works at a tile factory in Morbi, Gujarat. His autoencoder learned only from photos of good tiles. Tiles with a rebuilding error above a set limit go to a person for a closer look, and most have very thin cracks."
  }
 ],
 "studySteps": [
  {
   "title": "One hour after office",
   "text": "Suresh is a bank clerk in Kanpur with one free hour a day. Days 1 to 2: VAE videos and Colab training. Days 3 to 4: GANs. Days 5 to 7: diffusion and the Lab. Day 8: CLIP search. Day 9: practice and the quiz."
  },
  {
   "title": "Saving work in Colab",
   "text": "Anjali, a college student in Kochi, trains her GAN in free Colab. Free sessions can stop after some time. So every few epochs she saves the model and the sample grids to Google Drive, and later continues from there."
  },
  {
   "title": "Short breaks at home",
   "text": "Shabana in Lucknow studies in 20-minute breaks, one video per break. She runs the diffusion Lab on her phone in another break. She keeps the longer Colab training for Sunday, when the house is quiet."
  },
  {
   "title": "Weekend learner in Bengaluru",
   "text": "Rahul studies only at weekends. On Saturday he starts the VAE and GAN training runs, then watches the diffusion videos while they train. On Sunday he does Stable Diffusion, his CLIP photo search, practice and the quiz."
  },
  {
   "title": "Slow internet in Sikkim",
   "text": "Tenzin's hill town has slow internet. In Colab, the big Stable Diffusion files download to Google's computer, not to her phone. So her own data use stays small. She watches the videos at low quality."
  },
  {
   "title": "Quiz score below 70%",
   "text": "Kiran scores 60% on the quiz. Her wrong answers were about VAEs and latent diffusion. She watches those two lessons again with patience (धैर्य, dhairya). She redoes her notes on the small 64 × 64 × 4 code that Stable Diffusion works on, then retakes the quiz."
  }
 ],
 "keyTerms": [
  {
   "title": "Autoencoder for fabric checks",
   "text": "Imagine a Coimbatore textile mill. An autoencoder learns only from photos of good cloth. Good cloth gets a rebuilding error of about 0.01, and cloth with a tear gets 0.30. Anything above 0.10 goes to a person."
  },
  {
   "title": "Walking through latent space",
   "text": "Priya trains a VAE on handwritten digits. She takes the code of a \"1\" and the code of a \"7\", and decodes 5 points on the line between them. The digit slowly grows a top bar and turns into a 7."
  },
  {
   "title": "GAN prints for kurtas",
   "text": "Imagine a Jaipur block-print shop that trains a GAN on 3,000 prints. After some training, its 64 samples look like 3 prints repeated many times. That is mode collapse, so the team always checks grids, not single samples."
  },
  {
   "title": "Guidance for a Holi poster",
   "text": "Neha in Bhopal types the prompt \"children playing Holi, bright colours\". At guidance scale 3, some images show no colour powder at all. At 7.5 they match well. At 15 they look alike, with harsh colours."
  },
  {
   "title": "Latent diffusion on one GPU",
   "text": "Stable Diffusion 1.5 works on a 64 × 64 × 4 latent, not on the full 512 × 512 picture. That is why it can run on one ordinary GPU (a graphics chip that does fast maths). The GPU in a gaming laptop can be enough."
  },
  {
   "title": "How CLIP learns to match",
   "text": "In training, CLIP sees a batch (a small group) of photos with their captions. It pulls each photo's embedding towards its own caption's embedding, and pushes it away from the other captions. This is called *contrastive learning*."
  },
  {
   "title": "CLIP labels street food",
   "text": "Karthik has no labelled food photos. He gives CLIP three texts: \"a photo of dosa\", \"a photo of vada pav\" and \"a photo of pani puri\". CLIP picks the text with the highest *cosine similarity* (a match score from −1 to 1). This is *zero-shot* classification: no extra training."
  },
  {
   "title": "A VLM reads a mandi board",
   "text": "A trader in Nashik photographs the mandi price board, written in Marathi. He asks a vision-language model, \"What is today's onion price per quintal?\" It reads the board and answers in words. He checks the number on the board once."
  }
 ],
 "indiaExample": [
  {
   "title": "A Bengali menu in Kolkata",
   "text": "Imagine a VLM trained mostly on English data. It reads a Kolkata restaurant menu printed in Bengali. It mixes up two letters, names a dish wrongly and misreads one price. More Bengali image-and-text data would help it."
  },
  {
   "title": "Claim forms in Pune",
   "text": "Imagine a Pune insurance firm with thousands of photos of handwritten claim forms in Marathi and English. A VLM answers \"What is the claimed amount?\" for each one. Staff still check some answers by hand every day."
  },
  {
   "title": "Saree prints in Surat",
   "text": "Imagine a Surat design studio that uses a diffusion model (a model that makes pictures from text) for new saree prints. The model draws paisleys well, but any Gujarati lettering comes out wrong. So the studio adds all text by hand afterwards."
  },
  {
   "title": "Tourism photos in Assam",
   "text": "Imagine a Guwahati tourism office with 20,000 photos and captions in Assamese. An English-only CLIP model (which matches pictures with text) cannot match a search typed in Assamese well. A model that understands Assamese would serve this office much better."
  },
  {
   "title": "A sick chilli plant in Guntur",
   "text": "Imagine a farmer in Guntur who photographs a sick chilli plant. She asks a VLM in Telugu, \"What is wrong with this leaf?\" A model that understands Telugu can answer her in Telugu. She still confirms with a local agriculture officer."
  },
  {
   "title": "Testing before trusting",
   "text": "Imagine a Chennai startup choosing a VLM for Tamil shop signs. Before it can trust (भरोसा, bharosa) any model, it runs each one on 200 photos with known answers, like a small BharatBench. It picks the model with the fewest mistakes."
  }
 ],
 "commonMistakes": [
  {
   "title": "Diwali banner with broken Hindi",
   "text": "A Delhi sweet shop asks for a banner with the words \"Shubh Deepawali\" in Hindi. The model draws letters that look Hindi but spell nothing. Fix: make the banner without text, then type the greeting in a design tool."
  },
  {
   "title": "Three changes at once",
   "text": "Arjun changes the seed from 7 to 42, the steps from 20 to 50 and the guidance from 5 to 12. The new picture is better, but he cannot say why. Fix: keep seed 42, and change only one setting per try."
  },
  {
   "title": "A film star look-alike",
   "text": "Imagine a Hyderabad agency that makes an ad face looking like a famous actor, without asking. The actor's team sends a legal notice, and the ad has to be removed. Fix: never make a real person's face without their written consent (सहमति, sahmati)."
  },
  {
   "title": "The \"exact copy\" prompt",
   "text": "A designer types \"the famous cola ad from 1990, exactly\". The model makes something very close to a real, copyrighted ad. Fix: describe your own idea instead, and compare the result with famous designs before use."
  },
  {
   "title": "CLIP cannot read the total",
   "text": "Ravi uses CLIP to get the amount from 300 shop bills. CLIP only says how well each bill matches a text like \"a bill for ₹500\", so the answers are useless. Fix: use a VLM, and check 20 of its answers by hand."
  },
  {
   "title": "One pretty sample",
   "text": "Sneha shows her client one lovely GAN-made kurta print. Later, a grid of 64 samples shows the same print again and again: mode collapse. Fix: always review a full grid, and check the variety before you promise anything."
  }
 ],
 "selfCheck": [
  {
   "title": "Reading your 2D VAE map",
   "text": "Sample answer: \"On the left, the decoder draws 1s. Moving right, they lean and grow a top bar, becoming 7s, then 9s. Nearby points give similar digits, and I found no junk. So the space is smooth.\" Your own map will differ."
  },
  {
   "title": "Describing the 9-image grid",
   "text": "Sample answer: \"At guidance 3, the pictures move away from the prompt. At 12, they look alike and the colours look harsh. At 10 steps the pictures are rough. 25 and 50 look almost the same, so 25 saves time.\""
  },
  {
   "title": "Setting up the CLIP scores",
   "text": "Hint: `probs = model(**inputs).logits_per_image.softmax(dim=1)` gives one row per photo. Here `model` is CLIP, `inputs` holds the photos and the three texts, and `logits_per_image` holds the match scores. The softmax part turns each row into three chances that add up to 1. The highest chance is CLIP's pick."
  },
  {
   "title": "A table for VLM errors",
   "text": "Make a table with five columns: photo, question, model's answer, correct answer and type of mistake. One row might read: \"Udupi hotel menu; price of masala dosa; ₹170; ₹120; wrong digit\". Patterns in the last column are your findings."
  },
  {
   "title": "A five-sentence client note",
   "text": "Sample: \"Diffusion models train more steadily than GANs. They give better quality and more variety. GANs are hard to balance (संतुलन, santulan) and can repeat one image. But a GAN makes a picture in one quick pass. So GANs still suit fast, live filters.\""
  }
 ]
};
