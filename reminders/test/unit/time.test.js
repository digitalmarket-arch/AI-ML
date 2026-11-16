import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextAt, offsetAt, localDate, localDayOfYear, wallToInstant, isValidTimeZone, canonicalZone, cachedZones, daysMask } from '../../src/time.js';

const Z = (s) => Date.parse(s);
const iso = (t) => new Date(t).toISOString();
const ALL = [0, 1, 2, 3, 4, 5, 6];
const MIN = 60000;
const HOUR = 3600000;
const DAY = 86400000;

function check(now, tz, hh, mm, days, want) {
  assert.equal(iso(nextAt(Z(now), tz, hh, mm, days)), want, `${tz} ${hh}:${mm} after ${now}`);
}

test('Asia/Kolkata (+5:30): later today, tomorrow, and strictly after now', () => {
  check('2026-11-13T10:00:00Z', 'Asia/Kolkata', 19, 0, ALL, '2026-11-13T13:30:00.000Z');
  check('2026-11-13T13:29:59Z', 'Asia/Kolkata', 19, 0, ALL, '2026-11-13T13:30:00.000Z');
  check('2026-11-13T13:30:00Z', 'Asia/Kolkata', 19, 0, ALL, '2026-11-14T13:30:00.000Z');
  check('2026-11-13T13:30:00.001Z', 'Asia/Kolkata', 19, 0, ALL, '2026-11-14T13:30:00.000Z');
  // 00:15 local is the previous UTC day.
  check('2026-11-13T10:00:00Z', 'Asia/Kolkata', 0, 15, ALL, '2026-11-13T18:45:00.000Z');
  // 23:59 local
  check('2026-11-13T10:00:00Z', 'Asia/Kolkata', 23, 59, ALL, '2026-11-13T18:29:00.000Z');
});

test('Asia/Kolkata: only the chosen weekdays (0 = Sunday)', () => {
  // 2026-11-13 is a Friday.
  check('2026-11-13T10:00:00Z', 'Asia/Kolkata', 19, 0, [1], '2026-11-16T13:30:00.000Z'); // Monday
  check('2026-11-13T10:00:00Z', 'Asia/Kolkata', 19, 0, [5], '2026-11-13T13:30:00.000Z'); // Friday, today
  check('2026-11-13T14:00:00Z', 'Asia/Kolkata', 19, 0, [5], '2026-11-20T13:30:00.000Z'); // Friday, next week
  check('2026-11-13T14:00:00Z', 'Asia/Kolkata', 19, 0, [0, 6], '2026-11-14T13:30:00.000Z'); // Saturday
  check('2026-11-13T14:00:00Z', 'Asia/Kolkata', 19, 0, 0b0000001, '2026-11-15T13:30:00.000Z'); // bitmask, Sunday
  // Weekday is the learner's local weekday, not the UTC one: Sat 01:00 IST is Fri 19:30 UTC.
  check('2026-11-13T10:00:00Z', 'Asia/Kolkata', 1, 0, [6], '2026-11-13T19:30:00.000Z');
});

test('Asia/Kathmandu (+5:45)', () => {
  check('2026-11-13T10:00:00Z', 'Asia/Kathmandu', 19, 0, ALL, '2026-11-13T13:15:00.000Z');
  check('2026-11-13T10:00:00Z', 'Asia/Kathmandu', 6, 30, ALL, '2026-11-14T00:45:00.000Z');
  assert.equal(offsetAt(Z('2026-11-13T10:00:00Z'), 'Asia/Kathmandu'), (5 * 60 + 45) * MIN);
});

test('America/New_York: spring forward (8 Mar 2026, 2:00 EST becomes 3:00 EDT)', () => {
  // 2:00 to 2:59 do not exist: they move to the first valid minute after, 3:00 EDT = 07:00Z.
  check('2026-03-07T12:00:00Z', 'America/New_York', 2, 30, ALL, '2026-03-08T07:00:00.000Z');
  check('2026-03-07T12:00:00Z', 'America/New_York', 2, 0, ALL, '2026-03-08T07:00:00.000Z');
  check('2026-03-07T12:00:00Z', 'America/New_York', 2, 59, ALL, '2026-03-08T07:00:00.000Z');
  check('2026-03-07T12:00:00Z', 'America/New_York', 3, 0, ALL, '2026-03-08T07:00:00.000Z');
  check('2026-03-07T12:00:00Z', 'America/New_York', 1, 59, ALL, '2026-03-08T06:59:00.000Z');
  // The day before and after use their own offsets.
  check('2026-03-07T12:00:00Z', 'America/New_York', 19, 0, ALL, '2026-03-08T00:00:00.000Z'); // Sat 19:00 EST
  check('2026-03-08T12:00:00Z', 'America/New_York', 19, 0, ALL, '2026-03-08T23:00:00.000Z'); // Sun 19:00 EDT
  // Once the gap's reminder went out, the next one is the next day at 2:30 EDT.
  check('2026-03-08T07:00:00Z', 'America/New_York', 2, 30, ALL, '2026-03-09T06:30:00.000Z');
});

test('America/New_York: fall back (1 Nov 2026, 2:00 EDT becomes 1:00 EST)', () => {
  // 1:00 to 1:59 happen twice: use the first (EDT) one.
  check('2026-10-31T12:00:00Z', 'America/New_York', 1, 30, ALL, '2026-11-01T05:30:00.000Z');
  check('2026-10-31T12:00:00Z', 'America/New_York', 1, 0, ALL, '2026-11-01T05:00:00.000Z');
  check('2026-10-31T12:00:00Z', 'America/New_York', 1, 59, ALL, '2026-11-01T05:59:00.000Z');
  // Between the two 1:30s the next reminder is the next day, never the repeat.
  check('2026-11-01T05:30:00Z', 'America/New_York', 1, 30, ALL, '2026-11-02T06:30:00.000Z');
  check('2026-11-01T06:15:00Z', 'America/New_York', 1, 30, ALL, '2026-11-02T06:30:00.000Z');
  // 2:00 happens once (EST).
  check('2026-10-31T12:00:00Z', 'America/New_York', 2, 0, ALL, '2026-11-01T07:00:00.000Z');
  check('2026-10-31T12:00:00Z', 'America/New_York', 0, 59, ALL, '2026-11-01T04:59:00.000Z');
});

test('Europe/London: both switches (29 Mar and 25 Oct 2026)', () => {
  check('2026-03-28T12:00:00Z', 'Europe/London', 1, 30, ALL, '2026-03-29T01:00:00.000Z'); // gap -> 02:00 BST
  check('2026-03-28T12:00:00Z', 'Europe/London', 19, 0, ALL, '2026-03-28T19:00:00.000Z'); // GMT
  check('2026-03-29T12:00:00Z', 'Europe/London', 19, 0, ALL, '2026-03-29T18:00:00.000Z'); // BST
  check('2026-10-24T12:00:00Z', 'Europe/London', 1, 30, ALL, '2026-10-25T00:30:00.000Z'); // first 01:30 (BST)
  check('2026-10-25T00:30:00Z', 'Europe/London', 1, 30, ALL, '2026-10-26T01:30:00.000Z'); // not the repeat
  check('2026-10-25T12:00:00Z', 'Europe/London', 19, 0, ALL, '2026-10-25T19:00:00.000Z'); // GMT again
});

test('Australia/Lord_Howe: 30-minute daylight saving', () => {
  assert.equal(offsetAt(Z('2026-07-10T00:00:00Z'), 'Australia/Lord_Howe'), 630 * MIN); // +10:30
  assert.equal(offsetAt(Z('2026-01-10T00:00:00Z'), 'Australia/Lord_Howe'), 660 * MIN); // +11:00
  // Spring forward 4 Oct 2026: 2:00 LHST becomes 2:30 LHDT (= 3 Oct 15:30Z).
  check('2026-10-03T10:00:00Z', 'Australia/Lord_Howe', 2, 15, ALL, '2026-10-03T15:30:00.000Z');
  check('2026-10-03T10:00:00Z', 'Australia/Lord_Howe', 2, 0, ALL, '2026-10-03T15:30:00.000Z');
  check('2026-10-03T10:00:00Z', 'Australia/Lord_Howe', 2, 30, ALL, '2026-10-03T15:30:00.000Z');
  check('2026-10-03T10:00:00Z', 'Australia/Lord_Howe', 1, 59, ALL, '2026-10-03T15:29:00.000Z');
  // Fall back 5 Apr 2026: 2:00 LHDT becomes 1:30 LHST; 1:30 to 1:59 happen twice.
  check('2026-04-04T10:00:00Z', 'Australia/Lord_Howe', 1, 45, ALL, '2026-04-04T14:45:00.000Z');
  check('2026-04-04T10:00:00Z', 'Australia/Lord_Howe', 1, 30, ALL, '2026-04-04T14:30:00.000Z');
  check('2026-04-04T14:45:00Z', 'Australia/Lord_Howe', 1, 45, ALL, '2026-04-05T15:15:00.000Z');
  // 4 Apr 10:00Z is 21:00 local (+11), so 19:00 is next on 5 Apr, after the switch (+10:30).
  check('2026-04-04T10:00:00Z', 'Australia/Lord_Howe', 19, 0, ALL, '2026-04-05T08:30:00.000Z');
});

test('localDate, localDayOfYear and wallToInstant', () => {
  assert.equal(localDate(Z('2026-11-13T19:00:00Z'), 'Asia/Kolkata'), '2026-11-14');
  assert.equal(localDate(Z('2026-11-13T19:00:00Z'), 'America/New_York'), '2026-11-13');
  assert.equal(localDayOfYear(Z('2026-01-01T00:00:00Z'), 'Asia/Kolkata'), 1);
  assert.equal(localDayOfYear(Z('2026-12-31T12:00:00Z'), 'Asia/Kolkata'), 365);
  assert.equal(localDayOfYear(Z('2028-12-31T12:00:00Z'), 'UTC'), 366);
  assert.equal(wallToInstant(Date.UTC(2026, 10, 13, 19, 0), 'Asia/Kolkata'), Z('2026-11-13T13:30:00Z'));
});

test('isValidTimeZone and daysMask', () => {
  for (const tz of ['Asia/Kolkata', 'Asia/Calcutta', 'Asia/Kathmandu', 'America/New_York', 'Europe/London', 'Australia/Lord_Howe', 'UTC']) {
    assert.ok(isValidTimeZone(tz), tz);
  }
  for (const tz of ['', 'Mars/Olympus', 'Asia/Kolkata ', 'x'.repeat(65), null, 42, undefined]) {
    assert.ok(!isValidTimeZone(tz), String(tz));
  }
  assert.equal(daysMask([0, 6]), 0b1000001);
  assert.equal(daysMask(ALL), 127);
  assert.throws(() => nextAt(Date.now(), 'Asia/Kolkata', 19, 0, []));
});

test('time zones in any letter case: one canonical name, and no lasting memory per spelling', () => {
  const india = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata' }).resolvedOptions().timeZone;
  for (const tz of ['Asia/Kolkata', 'asia/kolkata', 'ASIA/KOLKATA', 'aSiA/kOlKaTa']) assert.equal(canonicalZone(tz), india, tz);
  for (const tz of ['', 'Mars/Olympus', 'x'.repeat(65), null, 42]) assert.equal(canonicalZone(tz), null, String(tz));
  // A different spelling for every request, as an attacker could send (2^30 spellings of this one zone).
  const zone = 'America/Argentina/ComodRivadavia';
  const spelling = (i) => [...zone].map((c, j) => ((i >> (j % 30)) & 1 ? c.toUpperCase() : c.toLowerCase())).join('');
  const before = cachedZones();
  for (let i = 0; i < 3000; i++) assert.ok(isValidTimeZone(spelling(i * 7919)));
  assert.equal(cachedZones(), before, 'checking a zone keeps nothing');
  // The cron's formatters are kept per zone, with a cap, whatever names reach them.
  for (let i = 0; i < 1500; i++) localDate(Z('2026-11-13T10:00:00Z'), spelling(i * 104729));
  assert.ok(cachedZones() <= 600, `at most 600 formatters kept (${cachedZones()})`);
  assert.equal(localDate(Z('2026-11-13T19:00:00Z'), 'Asia/Kolkata'), '2026-11-14', 'and they still work after the cache is emptied');
});

// ---------- an independent brute-force oracle ----------
// Straight from the spec: for each local date with an allowed weekday, the reminder instant is
// the first minute whose local wall time reaches hh:mm on that date (this is the time itself,
// its first occurrence when it repeats, or the first valid minute after it when it is skipped).
// The answer is the earliest such instant strictly after now. Scans minute by minute.

const oracleFmt = new Map();
function wallMs(t, tz) {
  let f = oracleFmt.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    oracleFmt.set(tz, f);
  }
  const p = Object.fromEntries(f.formatToParts(new Date(t)).map((x) => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute);
}

function oracle(now, tz, hh, mm, mask) {
  const start = new Date(wallMs(Math.floor(now / MIN) * MIN, tz));
  for (let i = 0; i < 9; i++) {
    const date = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + i);
    if (!(mask & (1 << new Date(date).getUTCDay()))) continue;
    const target = date + hh * HOUR + mm * MIN;
    let t = target - 15 * HOUR; // no zone is more than 14 hours ahead of UTC
    while (wallMs(t, tz) < target) t += MIN;
    if (t > now) return t;
  }
  throw new Error('oracle found nothing');
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

test('nextAt agrees with a brute-force oracle around every transition', () => {
  const zones = {
    'Asia/Kolkata': ['2026-11-13T00:00:00Z'],
    'Asia/Kathmandu': ['2026-11-13T00:00:00Z'],
    'America/New_York': ['2026-03-08T07:00:00Z', '2026-11-01T06:00:00Z', '2027-03-14T07:00:00Z'],
    'Europe/London': ['2026-03-29T01:00:00Z', '2026-10-25T01:00:00Z'],
    'Australia/Lord_Howe': ['2026-04-04T15:00:00Z', '2026-10-03T15:30:00Z'],
  };
  const rand = rng(20261113);
  let n = 0;
  for (const [tz, moments] of Object.entries(zones)) {
    for (const m of moments) {
      for (let k = 0; k < 60; k++) {
        // now within 2 days either side of the switch, often right at it
        const now = Z(m) + Math.round((rand() * 4 - 2) * DAY / (k % 4 === 0 ? 48 : 1));
        const hh = k % 3 === 0 ? 1 + Math.floor(rand() * 2) : Math.floor(rand() * 24); // many 1:xx and 2:xx
        const mm = Math.floor(rand() * 60);
        const mask = k % 5 === 0 ? 1 << Math.floor(rand() * 7) : 1 + Math.floor(rand() * 127);
        const got = nextAt(now, tz, hh, mm, mask);
        const want = oracle(now, tz, hh, mm, mask);
        assert.equal(iso(got), iso(want), `${tz} now=${iso(now)} ${hh}:${mm} mask=${mask}`);
        n++;
      }
    }
  }
  assert.equal(n, 9 * 60);
});
