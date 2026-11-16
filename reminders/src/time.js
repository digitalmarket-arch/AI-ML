// Time maths for reminders: "the next time it is hh:mm on one of these weekdays in this zone".
// Uses only Intl (built into Workers and Node), with one cached formatter per time zone.
//
// Daylight saving rules (nextAt):
// - A local time that does not exist (clocks jump forward over it) moves to the first valid
//   minute after it, which is the moment the clocks jump.
// - A local time that happens twice (clocks go back) uses its first occurrence only, so a
//   learner never gets the same day's reminder twice.

const MINUTE = 60000;
const DAY = 86400000;

// One formatter per zone, kept for the life of the isolate. Each one holds native (ICU) memory, so the cache has a cap:
// it is emptied when it reaches MAX_FORMATTERS, more than the zones learners really use (Intl knows about 420).
const formatters = new Map();
const MAX_FORMATTERS = 600;

function formatter(tz) {
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    if (formatters.size >= MAX_FORMATTERS) formatters.clear();
    formatters.set(tz, f);
  }
  return f;
}

// For the tests: how many formatters are kept.
export function cachedZones() {
  return formatters.size;
}

// The zone's own name as Intl writes it, or null when Intl does not know it. Intl accepts any letter case, so
// "asia/KOLKATA" gives the same name as "Asia/Kolkata" (today "Asia/Calcutta"). Nothing is cached here, so a flood of
// odd spellings costs no lasting memory; the Worker stores this name, and the cron's formatters are kept by it.
export function canonicalZone(tz) {
  if (typeof tz !== 'string' || tz.length === 0 || tz.length > 64) return null;
  try {
    const name = new Intl.DateTimeFormat('en-US', { timeZone: tz }).resolvedOptions().timeZone;
    return typeof name === 'string' && name.length > 0 && name.length <= 64 ? name : null;
  } catch {
    return null;
  }
}

// True when tz is a time zone that Intl knows (for example "Asia/Kolkata").
export function isValidTimeZone(tz) {
  return canonicalZone(tz) !== null;
}

// The wall-clock fields in tz at instant t (UTC ms).
export function localParts(t, tz) {
  const parts = formatter(tz).formatToParts(new Date(t));
  const v = {};
  for (const p of parts) {
    if (p.type !== 'literal') v[p.type] = parseInt(p.value, 10);
  }
  const hour = v.hour === 24 ? 0 : v.hour;
  return {
    y: v.year,
    m: v.month,
    d: v.day,
    hh: hour,
    mm: v.minute,
    ss: v.second,
    wd: new Date(Date.UTC(v.year, v.month - 1, v.day)).getUTCDay(),
  };
}

// The UTC offset of tz at instant t, in ms (Asia/Kolkata gives +5:30 = 19800000).
export function offsetAt(t, tz) {
  const t0 = Math.floor(t / MINUTE) * MINUTE;
  const p = localParts(t0, tz);
  return Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, p.ss) - t0;
}

const pad2 = (n) => String(n).padStart(2, '0');

// The local date in tz at instant t, as "YYYY-MM-DD".
export function localDate(t, tz) {
  const p = localParts(t, tz);
  return String(p.y).padStart(4, '0') + '-' + pad2(p.m) + '-' + pad2(p.d);
}

// Day of the year (1 to 366) of the local date in tz at instant t.
export function localDayOfYear(t, tz) {
  const p = localParts(t, tz);
  return Math.round((Date.UTC(p.y, p.m - 1, p.d) - Date.UTC(p.y, 0, 1)) / DAY) + 1;
}

// The instant (UTC ms) at which the wall clock in tz shows `wall`, where wall is the local
// date and time written as if it were UTC (Date.UTC(y, m - 1, d, hh, mm)).
// Ambiguous: the first occurrence. Missing (spring forward): the moment the clocks jump.
export function wallToInstant(wall, tz) {
  // The offsets a day either side bracket any change of offset near this wall time.
  const before = offsetAt(wall - DAY, tz);
  const after = offsetAt(wall + DAY, tz);
  const candidates = before === after ? [wall - before] : [wall - before, wall - after];
  const valid = candidates.filter((t) => t + offsetAt(t, tz) === wall).sort((a, b) => a - b);
  if (valid.length) return valid[0];
  if (after <= before) return wall - before; // cannot happen for a real gap; stay safe
  // In the gap: instant `lo` still has the old offset and `hi` already has the new one.
  // Find, to the minute, the first instant with the new offset: the moment clocks jump.
  let lo = wall - after;
  let hi = wall - before;
  while (hi - lo > MINUTE) {
    const mid = lo + Math.floor((hi - lo) / (2 * MINUTE)) * MINUTE;
    if (offsetAt(mid, tz) === before) lo = mid;
    else hi = mid;
  }
  return hi;
}

// Turns [0, 1, 6] into a bitmask (bit d = weekday d, 0 = Sunday). Numbers pass through.
export function daysMask(days) {
  if (typeof days === 'number') return days & 127;
  let mask = 0;
  for (const d of days) mask |= 1 << d;
  return mask & 127;
}

// The first moment strictly after nowMs when the local time in tz is hh:mm on an allowed
// weekday. days is a bitmask (bit d = weekday d, 0 = Sunday) or an array of weekdays.
export function nextAt(nowMs, tz, hh, mm, days) {
  const mask = daysMask(days);
  if (!mask) throw new Error('no days chosen');
  const today = localParts(nowMs, tz);
  for (let i = 0; i < 15; i++) {
    const date = Date.UTC(today.y, today.m - 1, today.d + i);
    if (!(mask & (1 << new Date(date).getUTCDay()))) continue;
    const t = wallToInstant(date + hh * 3600000 + mm * MINUTE, tz);
    if (t > nowMs) return t;
  }
  throw new Error('no reminder time found');
}
