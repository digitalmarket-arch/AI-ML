// Checks for what the site sends. Each failure maps to one error code of the API contract.

import { b64urlDecode, b64urlEncode, isValidP256Point } from './webpush.js';
import { canonicalZone, daysMask } from './time.js';

// Push services whose endpoints we accept (browsers only ever hand out these).
export const PUSH_HOSTS = [
  'fcm.googleapis.com',
  'updates.push.services.mozilla.com',
  'push.services.mozilla.com',
  'web.push.apple.com',
];
export const PUSH_HOST_SUFFIXES = ['.push.apple.com', '.notify.windows.com'];
export const MAX_ENDPOINT = 1024;

const DEV_HOSTS = new Set(['127.0.0.1', 'localhost']);
const TIME_RE = /^(\d{2}):(\d{2})$/;
const DAY_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

// "YYYY-MM-DD"
export function isDay(s) {
  return typeof s === 'string' && DAY_RE.test(s);
}

// The part of a client's address that the subscribe rate limit counts: an IPv4 address as it is, and for IPv6 only its
// first 64 bits (its /64 network). One home, phone or server connection gets a whole /64 and can use a new address in it
// for every request, so counting full IPv6 addresses would not limit anyone. "2001:DB8:0:1::7" -> "2001:db8:0:1::/64".
// An IPv4 address written as IPv6 (::ffff:203.0.113.7) counts as that IPv4 address. Anything else is used as it is.
export function addressGroup(ip) {
  const s = String(ip || '').trim().toLowerCase().replace(/%.*$/, '');
  if (!s.includes(':')) return s;
  const g = ipv6Groups(s);
  if (!g) return s;
  if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) {
    return [g[6] >> 8, g[6] & 255, g[7] >> 8, g[7] & 255].join('.');
  }
  return g.slice(0, 4).map((x) => x.toString(16)).join(':') + '::/64';
}

// The eight 16-bit groups of an IPv6 address ("::" filled in, an IPv4 tail as two groups), or null when it is not one.
function ipv6Groups(s) {
  const halves = s.split('::');
  if (halves.length > 2) return null;
  const parse = (part, last) => {
    const out = [];
    if (!part) return out;
    const words = part.split(':');
    for (let i = 0; i < words.length; i++) {
      const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(words[i]);
      if (v4 && last && i === words.length - 1) {
        const b = v4.slice(1).map(Number);
        if (b.some((x) => x > 255)) return null;
        out.push(b[0] * 256 + b[1], b[2] * 256 + b[3]);
      } else if (/^[0-9a-f]{1,4}$/.test(words[i])) {
        out.push(parseInt(words[i], 16));
      } else {
        return null;
      }
    }
    return out;
  };
  const head = parse(halves[0], halves.length === 1);
  const tail = halves.length === 2 ? parse(halves[1], true) : [];
  if (!head || !tail) return null;
  const missing = 8 - head.length - tail.length;
  if (halves.length === 2 ? missing < 1 : missing !== 0) return null;
  return [...head, ...Array(missing).fill(0), ...tail];
}

// 'ok', 'bad-sub' (not an https URL we can use) or 'bad-host' (not a known push service).
// With dev on, http://127.0.0.1:PORT and http://localhost:PORT are allowed for the tests.
export function checkEndpoint(endpoint, dev) {
  if (typeof endpoint !== 'string' || endpoint.length === 0 || endpoint.length > MAX_ENDPOINT) {
    return 'bad-sub';
  }
  let u;
  try {
    u = new URL(endpoint);
  } catch {
    return 'bad-sub';
  }
  if (u.username || u.password) return 'bad-sub';
  if (dev && u.protocol === 'http:' && DEV_HOSTS.has(u.hostname) && u.port) return 'ok';
  if (u.protocol !== 'https:') return 'bad-sub';
  if (u.port) return 'bad-host';
  const host = u.hostname;
  if (PUSH_HOSTS.includes(host) || PUSH_HOST_SUFFIXES.some((s) => host.endsWith(s))) return 'ok';
  return 'bad-host';
}

// Checks a POST /v1/subscribe body. Returns { error } or { value } with the row to store:
// { endpoint, p256dh, auth, hh, mm, days (bitmask), tz, open, skip (0 or 1), active }.
export async function validateSubscribe(body, dev) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'bad-json' };

  const sub = body.sub;
  if (!sub || typeof sub !== 'object' || Array.isArray(sub)) return { error: 'bad-sub' };
  const where = checkEndpoint(sub.endpoint, dev);
  if (where !== 'ok') return { error: where };
  const keys = sub.keys;
  if (!keys || typeof keys !== 'object') return { error: 'bad-sub' };
  const p256dh = b64urlDecode(keys.p256dh);
  if (!p256dh || p256dh.length !== 65 || p256dh[0] !== 4) return { error: 'bad-sub' };
  if (!(await isValidP256Point(p256dh))) return { error: 'bad-sub' };
  const auth = b64urlDecode(keys.auth);
  if (!auth || auth.length !== 16) return { error: 'bad-sub' };

  const t = typeof body.time === 'string' ? TIME_RE.exec(body.time) : null;
  const hh = t ? parseInt(t[1], 10) : -1;
  const mm = t ? parseInt(t[2], 10) : -1;
  if (!t || hh > 23 || mm > 59) return { error: 'bad-time' };

  const days = body.days;
  if (
    !Array.isArray(days) ||
    days.length < 1 ||
    days.length > 7 ||
    !days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6) ||
    new Set(days).size !== days.length
  ) {
    return { error: 'bad-days' };
  }

  // Stored under the zone's own name: any letter case is accepted, and every spelling of a zone becomes one name.
  const tz = canonicalZone(body.tz);
  if (!tz) return { error: 'bad-tz' };
  if (body.open !== 'review' && body.open !== 'play') return { error: 'bad-open' };

  return {
    value: {
      endpoint: sub.endpoint,
      p256dh: b64urlEncode(p256dh),
      auth: b64urlEncode(auth),
      hh,
      mm,
      days: daysMask(days),
      tz,
      open: body.open,
      skip: body.skip === true ? 1 : 0,
      active: isDay(body.active) ? body.active : '',
    },
  };
}
