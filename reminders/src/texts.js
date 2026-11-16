// The words in AI Marg reminders. Plain English, kind, short sentences.
// No streaks, no guilt: missing a day costs nothing.

export const REMINDER_TITLE = 'AI Marg study time';
export const REMINDER_TAG = 'aimarg-reminder';

// Lines for learners who chose "open Daily review". None of them says cards are waiting: Daily
// review may have none due (a new learner, or one who finished today's cards).
export const REVIEW_LINES = [
  'Time for some study, when you are ready.',
  'A few minutes today keeps your learning fresh.',
  'A short review helps new ideas stay with you.',
  'Study a little today, at your own pace.',
  'Five easy minutes with your cards is plenty.',
  'Every few minutes of study adds up.',
  'A little review today makes the next lesson easier.',
];

// Lines for learners who chose "open Play mode".
export const PLAY_LINES = [
  'Your next round is ready when you are.',
  'Want a quick round? It only takes a few minutes.',
  'A short round today keeps your learning fresh.',
  'Play a round or two. Have fun with it.',
  'Your rounds are ready. Go at your own pace.',
  'A quick game is a nice way to learn. Start any time.',
  'One small round is a good step forward.',
];

export const TEST_MESSAGE = Object.freeze({
  t: 'AI Marg',
  b: 'Test reminder: notifications work on this device.',
  u: './#reminders',
  tag: 'aimarg-test',
});

// Which line to use on a given day of the year (1 to 366). The extra step each week means a
// learner who only studies on Mondays still sees every line in turn, not the same one.
export function lineIndex(dayOfYear, count = 7) {
  return (dayOfYear + Math.floor(dayOfYear / 7)) % count;
}

// The push payload for a reminder: { t: title, b: body, u: url to open, tag }.
export function reminderMessage(open, dayOfYear) {
  const play = open === 'play';
  const lines = play ? PLAY_LINES : REVIEW_LINES;
  return {
    t: REMINDER_TITLE,
    b: lines[lineIndex(dayOfYear, lines.length)],
    u: play ? './#play' : './#review',
    tag: REMINDER_TAG,
  };
}
