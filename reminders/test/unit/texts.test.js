import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REVIEW_LINES, PLAY_LINES, TEST_MESSAGE, REMINDER_TITLE, lineIndex, reminderMessage } from '../../src/texts.js';

const ALL_TEXT = [...REVIEW_LINES, ...PLAY_LINES, REMINDER_TITLE, TEST_MESSAGE.t, TEST_MESSAGE.b];

test('seven different lines each for Daily review and for Play', () => {
  assert.equal(REVIEW_LINES.length, 7);
  assert.equal(PLAY_LINES.length, 7);
  assert.equal(new Set([...REVIEW_LINES, ...PLAY_LINES]).size, 14);
  assert.ok(REVIEW_LINES.includes('A few minutes today keeps your learning fresh.'));
  assert.ok(PLAY_LINES.includes('Your next round is ready when you are.'));
});

test('review lines never say cards are waiting: Daily review may have none due', () => {
  for (const s of REVIEW_LINES) {
    assert.doesNotMatch(s, /\bcards?\b[^.]*\b(ready|waiting|due)\b|\b(ready|waiting)\b[^.]*\bcards?\b|look at (a few|your) cards/i, s);
  }
});

test('plain English: printable ASCII only, so no Devanagari or other scripts', () => {
  for (const s of ALL_TEXT) {
    assert.match(s, /^[\x20-\x7E]+$/, s);
    assert.doesNotMatch(s, /[ऀ-ॿ꣠-ꣿ]/, s);
  }
});

test('kind wording: no streaks, guilt or pressure', () => {
  const banned = /\b(streak|lose|losing|lost|miss|missed|missing|don't|do not|fail|failed|behind|late|guilt|hurry|last chance|must|should|shame|break|broke|again|yet|only \d|now or)\b|!/i;
  for (const s of ALL_TEXT) assert.doesNotMatch(s, banned, s);
});

test('short sentences and short lines', () => {
  for (const s of [...REVIEW_LINES, ...PLAY_LINES]) {
    assert.ok(s.length <= 60, `too long: ${s}`);
    assert.match(s, /[.?]$/, `ends a sentence: ${s}`);
    for (const sentence of s.split(/(?<=[.?])\s+/)) {
      assert.ok(sentence.split(/\s+/).length <= 10, `sentence too long: ${sentence}`);
    }
  }
});

test('reminder payloads: title, page to open, tag, and at most 400 bytes', () => {
  for (let doy = 1; doy <= 366; doy++) {
    const r = reminderMessage('review', doy);
    const p = reminderMessage('play', doy);
    assert.equal(r.t, 'AI Marg study time');
    assert.equal(r.u, './#review');
    assert.equal(p.u, './#play');
    assert.equal(r.tag, 'aimarg-reminder');
    assert.equal(p.tag, 'aimarg-reminder');
    assert.ok(REVIEW_LINES.includes(r.b));
    assert.ok(PLAY_LINES.includes(p.b));
    assert.ok(Buffer.byteLength(JSON.stringify(r)) <= 400);
    assert.ok(Buffer.byteLength(JSON.stringify(p)) <= 400);
  }
});

test('the test message is exactly as specified', () => {
  assert.deepEqual({ ...TEST_MESSAGE }, {
    t: 'AI Marg',
    b: 'Test reminder: notifications work on this device.',
    u: './#reminders',
    tag: 'aimarg-test',
  });
});

test('picked by day of year: every line comes round, even for a once-a-week learner', () => {
  const daily = new Set();
  for (let doy = 1; doy <= 7; doy++) daily.add(lineIndex(doy));
  assert.ok(daily.size >= 6, 'a daily learner sees (nearly) a new line each day');
  for (let start = 1; start <= 7; start++) {
    const weekly = new Set();
    for (let w = 0; w < 7; w++) weekly.add(lineIndex(start + 7 * w));
    assert.equal(weekly.size, 7, 'same weekday for 7 weeks: all 7 lines');
  }
  for (let doy = 1; doy <= 366; doy++) {
    const i = lineIndex(doy);
    assert.ok(Number.isInteger(i) && i >= 0 && i < 7);
  }
});
