/* AI Marg lesson-card examples for one module (loaded with its lesson cards). JavaScript holding JSON. */
window.AIM = window.AIM || {};
window.AIM.examples = window.AIM.examples || {};
window.AIM.examples["l4-rl"] = {
 "overview": [
  {
   "title": "Learning to cycle in Thrissur",
   "text": "Anu, 9, learns to ride a bicycle in Thrissur. Nobody can tell her the exact angle to lean. She wobbles, falls and tries again, and slowly learns what keeps her up. Staying upright is her reward."
  },
  {
   "title": "Warehouse robot in Bengaluru",
   "text": "Imagine a robot that carries parcels. Its state is its aisle and battery level. Its actions are left, right, forward and stop. It earns +10 for each parcel delivered on time and −1 for each bump."
  },
  {
   "title": "Banners on a food app",
   "text": "Imagine a Kolkata food app with 4 home-screen banners. A bandit shows each banner to some users and counts the orders. It slowly sends more users to the banners that work, so it learns while it earns."
  },
  {
   "title": "A carrom game on a computer",
   "text": "Imagine a program learning carrom shots. The state is where the coins lie on the board. A pocketed coin gives +1 and a foul gives −1. After thousands of games, its policy picks a good shot for each board."
  },
  {
   "title": "Smart AC in a Delhi office",
   "text": "Imagine an AC controller. The state is the room temperature and the time of day. Its reward is comfortable staff minus the electricity bill. The bill arrives at month end, so the controller must value later rewards too."
  },
  {
   "title": "Teachers rank chatbot replies",
   "text": "Imagine a Hindi tutoring chatbot that writes two replies to a student. Teachers in Patna pick the clearer one. A judge model learns their choices, and RL moves the chatbot towards replies the judge scores high. That is RLHF."
  },
  {
   "title": "A maths model and an answer key",
   "text": "A maths model solves 2x + 3 = 11 four times. The answer key says x = 4. Right answers get a reward of 1 and wrong ones 0, so the model slowly learns to reason its way to correct answers."
  }
 ],
 "outcomes": [
  {
   "title": "Arjun writes down an MDP",
   "text": "Arjun maps a Bengaluru warehouse robot. State: aisle and battery. Actions: left, right, forward, stop. Reward: +10 per parcel on time, −1 per bump. Discount: 0.95. He notes that the map belongs to the environment, not the reward."
  },
  {
   "title": "Fatima picks a bandit",
   "text": "Fatima's Kolkata food app has 4 banners. Instead of a fixed 25% split for two months, she runs Thompson sampling. Within days, most users see the banner that brings orders, so fewer orders are lost during the test."
  },
  {
   "title": "Lakshmi reads a Q-table",
   "text": "In FrozenLake, Lakshmi prints one row of her Q-table: `[0.2, 0.6, 0.1, 0.3]` for left, down, right and up. The code `np.argmax` gives the position of the biggest number: index 1, the second one, as Python counts from 0. So the agent moves down, the action with the highest Q-value."
  },
  {
   "title": "Rahul steadies his DQN",
   "text": "Rahul's CartPole DQN learns from moves in the order they happen, and its Q-values blow up. He adds a replay buffer and a target network copied every 1,000 steps. The values settle, and the reward curve climbs."
  },
  {
   "title": "Meera trains PPO in two lines",
   "text": "Meera in Pune writes `model = PPO('MlpPolicy', 'CartPole-v1')`, where 'MlpPolicy' means a small neural network. Then `model.learn(total_timesteps=50_000)` trains it for 50,000 steps. Her reward curve climbs towards 500, the most one CartPole-v1 game can give."
  },
  {
   "title": "Gurpreet explains RLHF",
   "text": "A Ludhiana client asks how chatbots learn good manners. Gurpreet explains: people pick the better of two replies, and a judge model learns those choices. RL then makes the chatbot write replies the judge scores high."
  }
 ],
 "studySteps": [
  {
   "title": "One hour after office",
   "text": "Neha in Gurugram has one free hour a day. Day 1: the MDP videos, plus states, actions and rewards for her metro ride. Days 2 and 3: bandits. Days 4 and 5: Q-learning and the Lab. She keeps the weekend for CartPole."
  },
  {
   "title": "College student in Pune",
   "text": "Omkar codes the three bandit rules in Google Colab, a free online notebook for Python, between lectures. He hides true click rates of 2%, 3% and 3.5% inside the code. If a rule rarely settles on the 3.5% ad over many runs, he looks for a bug."
  },
  {
   "title": "Homemaker in Mysuru",
   "text": "Kavitha studies in 30-minute breaks on her phone. She uses the Lab's delivery rider and writes one line per task, like 'discount γ = 0: the rider stopped caring about the far +10'. Short notes make revision easy."
  },
  {
   "title": "Weekend learner in Bhubaneswar",
   "text": "RL training needs patience (धैर्य, dhairya), so Sourav starts DQN and PPO training on CartPole on Saturday morning. While it runs, he watches the PPO lesson. On Sunday he plots both reward curves and compares the two methods."
  },
  {
   "title": "Slow internet in Shillong",
   "text": "Banri downloads the videos at low quality. Once Gymnasium is installed, FrozenLake runs on her old laptop with no internet. Its Q-table has just 16 rows, one per square, so it trains in seconds."
  },
  {
   "title": "Quiz score below 70%",
   "text": "Imran scores 60% on the quiz. Most mistakes are about the discount and the Q-update. He works out 2 + 0.5 × (5.5 − 2) = 3.75 by hand, re-watches (दोबारा देखना, dobara dekhna) one lesson, and takes the quiz again."
  }
 ],
 "keyTerms": [
  {
   "title": "Warehouse robot: agent and reward",
   "text": "Imagine a Bengaluru warehouse. The robot is the agent; the shelves, parcels and workers are the environment. A trip with three on-time parcels and two bumps earns 3 × 10 − 2 = 28 as its reward."
  },
  {
   "title": "Traffic signal policy in Indore",
   "text": "Imagine a smart traffic signal in Indore. Its state is the queue on each road. Its policy says: if the east queue has over 20 cars, give east a longer green. Its reward goes up as fewer cars wait."
  },
  {
   "title": "Banner bandit in Kolkata",
   "text": "A Kolkata food app tests 4 banners, the arms of a bandit. Early on it explores, showing each banner often. As orders come in, it exploits, sending most users to the banner that brings the most orders. A banner does not change the next situation, so there is nothing to plan ahead."
  },
  {
   "title": "An auto stand's value in Chennai",
   "text": "A Chennai auto driver knows the stand near Central station is a high-value state: good fares usually follow from there. A value function puts a number on that feeling, like ₹400 of future fares there and ₹150 in a quiet lane."
  },
  {
   "title": "Adding up a trip's return",
   "text": "A trip gives rewards 1, 0, 0 and then 10. Its return (the discounted total) is easiest to find backwards, with γ = 0.9: 10, then 0.9 × 10 = 9, then 0.9 × 9 = 8.1, then 1 + 0.9 × 8.1 = 8.29."
  },
  {
   "title": "Mumbai rider's Q-table",
   "text": "A Mumbai rider's Q-table says Q(Dadar, left) = 2. He turns left, earns 1, and the best Q-value from the next spot is 5. With learning rate α = 0.5 and discount γ = 0.9, Q-learning updates the entry to 3.75."
  },
  {
   "title": "CartPole needs a DQN",
   "text": "CartPole has endless states, because its 4 numbers are decimals. A DQN uses a small neural network instead of a table. Experience replay and a target network keep its learning stable."
  },
  {
   "title": "Robot arm with PPO",
   "text": "Imagine a robot arm in a Pune factory learning to pick boxes. PPO lets each update change its grip choices only a little. So one wild update cannot undo a week of good training."
  }
 ],
 "indiaExample": [
  {
   "title": "Imagine: a Kota test app",
   "text": "Imagine a test-prep app in Kota that picks the next practice question for each student. A bandit (a rule that keeps testing a few options while it learns which works best) tries easy, medium and hard questions. It learns which level keeps each student learning without giving up."
  },
  {
   "title": "Imagine: cold storage near Agra",
   "text": "Imagine a potato cold store near Agra. An RL (reinforcement learning) controller sets the cooling every hour. Its reward is safe temperatures minus the electricity bill, so it learns to cool more when power is cheaper."
  },
  {
   "title": "Imagine: a Bengaluru junction",
   "text": "Imagine RL timing the signals at one busy Bengaluru junction. The state is the queue on each road, the action is the length of each green, and the reward is fewer cars waiting. It is tested in a simulator, a computer copy of the junction, before any real road."
  },
  {
   "title": "Imagine: a Tamil tutoring chatbot",
   "text": "Imagine a Chennai startup's Tamil tutoring chatbot. Teachers pick the clearer of two replies, and a reward model learns their choices. RLHF (reinforcement learning from human feedback) then moves the chatbot towards clear, correct replies. A KL penalty, a cost for moving too far from the original model, helps stop odd answers."
  },
  {
   "title": "Imagine: Class 10 board maths",
   "text": "Imagine a Lucknow team training a small model on Class 10 board maths. Each question has a known final answer, so a checker gives 1 or 0. No teacher has to grade every attempt, so training can run on lakhs of tries."
  },
  {
   "title": "Why too-easy questions waste time",
   "text": "In Aryabhata-style training, a question that every try gets right earns 1 every time. Each try equals the group average, so the model learns nothing from it. Questions it sometimes gets right teach the most."
  }
 ],
 "commonMistakes": [
  {
   "title": "RL for a spam filter",
   "text": "Priya in Jaipur tries RL to sort emails, though 50,000 emails are already marked spam or not spam. Training is slow and messy. A plain classifier (a model that sorts items into groups) learns from those labels in minutes and works better."
  },
  {
   "title": "The ceiling-gazing robot",
   "text": "A cleaning robot is rewarded when its camera sees no dust, so it learns to look at the ceiling. The team now rewards grams of dust in the bin. They also watch videos of real runs before trusting the score."
  },
  {
   "title": "Clicks without reading",
   "text": "Imagine a Kochi news app that rewards clicks. The agent learns to push shocking headlines that people click and then leave. Adding reading time to the reward, and a penalty for quick exits, fixes most of it."
  },
  {
   "title": "The flattering chatbot",
   "text": "A chatbot's reward-model score climbs from 6 to 9 out of 10, but reviewers rate the replies lower each week. The replies have become long and full of praise. The team adds a KL penalty, retrains the reward model and checks with fresh reviewers."
  },
  {
   "title": "The rider who stopped caring",
   "text": "In the Lab, Divya sets γ = 0. Her rider now cares only about the very next reward, so it stops heading to the far customer worth +10. With γ = 0.9, the route to the customer comes back."
  },
  {
   "title": "One lucky seed",
   "text": "Vivek in Hyderabad sees a new setting score 480 against 300 in one run. With 3 seeds each, the averages are 350 (new) and 340 (old), and the spreads overlap. The big 'gain' was mostly luck, so he does not switch yet."
  }
 ],
 "selfCheck": [
  {
   "title": "Hint: one simulated show",
   "text": "`clicked = np.random.rand() < 0.035` is True about 3.5% of the time, like one show of the best ad. Keep two counts per ad: shows and clicks. Its estimate (अंदाज़ा, andaaza) is clicks ÷ shows."
  },
  {
   "title": "Hint: Thompson sampling",
   "text": "For each ad, `np.random.beta(clicks + 1, misses + 1)` draws a believable click rate, where misses = shows − clicks. Show the ad with the highest draw. Ads with few shows get wide, wild draws, so they still get tried sometimes."
  },
  {
   "title": "Sample result for the ad task",
   "text": "In our simulation, averaged over 500 runs: fixed split 283 clicks, epsilon-greedy (ε = 0.1) 319, Thompson sampling 326. Thompson showed the best ad 68% of the time overall. A good answer reports both numbers and notes that single runs vary."
  },
  {
   "title": "Thinking through FrozenLake",
   "text": "With a discount factor γ (gamma) of 0.5, a reward 10 steps away is worth 0.5 to the power 10, about 0.001. So far-off squares learn tiny values, and the agent takes short, risky paths. With 0.99, the far goal still counts, so a longer, safer path is worth it."
  },
  {
   "title": "Sample answer on seeds",
   "text": "\"My three runs reached 500 at very different times, and one dipped on the way. Random starts and random exploring cause this. So I report the average and the spread, not my best run.\""
  },
  {
   "title": "Reward design: one loophole",
   "text": "Reward: +1 per post published on time. Loophole (चोर दरवाज़ा, chor darwaza): publish junk posts on time to collect points. Fix: count only posts the client approved, and reward real engagement with a cap, so spam does not pay."
  },
  {
   "title": "Reasoning with an answer key",
   "text": "A good answer: the model tries each question several times. A checker compares each final answer with the key and gives 1 or 0. Tries that beat the group average are made more likely, and the rest less likely."
  }
 ]
};
