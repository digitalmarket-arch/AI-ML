// AI Marg study reminders: the Cloudflare Worker.
//
// fetch:     a small JSON API that the site calls (POST /v1/subscribe, /v1/unsubscribe,
//            /v1/test, /v1/active, GET /v1/key and GET /v1/health). See README.md for the contract.
// scheduled: every minute, send the reminders that are due, at most BATCH per run.
//
// It needs no setup step: it makes its own D1 tables, and its own VAPID keys when no secrets
// are set (see store.js), so `wrangler deploy` (or the Deploy to Cloudflare button) is all.
//
// Privacy: endpoints and IP addresses are never logged. The rate-limit key is a hash of the
// IP address (for IPv6, its /64 network) mixed with the VAPID public key, never the address itself.

import { importVapidKeys, sendPush, b64urlEncode, concatBytes } from './webpush.js';
import { nextAt, localDate, localDayOfYear } from './time.js';
import { reminderMessage, TEST_MESSAGE } from './texts.js';
import { validateSubscribe, isDay, addressGroup, MAX_ENDPOINT } from './validate.js';
import { createTables, storedVapidKeys, SCHEMA } from './store.js';

const VERSION = '1';
const HOUR = 3600000;
const DAY = 86400000;
const MAX_BODY = 4096; // bytes of request body
const MAX_PAYLOAD = 400; // bytes of push JSON before encryption
const SUBSCRIBES_PER_HOUR = 20; // per IP address (per /64 network for IPv6)
const TESTS_PER_HOUR = 5; // per subscription
const MAX_FAILS = 10; // failed pushes in a row before a row is deleted
const RL_KEEP = 2 * HOUR; // the cron prunes rate-limit rows older than this
// A reminder this late (after an outage, or a long queue) is not sent: it would arrive at the
// wrong time of day. The row moves on to its next time as usual.
const LATE = 2 * HOUR;
// The free plan allows 50 D1 statements per cron run. The first run in an isolate makes the
// tables (SCHEMA, 8) and reads, or makes, the VAPID keys (up to 3); every run makes 1 select
// and, once an hour, 1 prune. That leaves ROW_ROOM (37) for the rows: a reminder that is sent
// takes 2 (moving it to its next time, then its result), and a late one moved on without a send
// takes 1. So BATCH <= 18, and late rows use whatever room the reminders leave.
const ROW_ROOM = 50 - SCHEMA.length - 5;
const MAX_BATCH = Math.floor(ROW_ROOM / 2);

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    try {
      return await handleFetch(request, env, cors);
    } catch (err) {
      logError('fetch', err);
      return json(500, { ok: false, error: 'server' }, cors);
    }
  },

  async scheduled(controller, env) {
    const now = Number.isFinite(controller.scheduledTime) ? controller.scheduledTime : Date.now();
    await runCron(env, now);
  },
};

// ---------- HTTP ----------

function devMode(env) {
  return env.DEV === '1';
}

function originAllowed(origin, env) {
  const list = String(env.ALLOWED_ORIGINS || '')
    .split(/[\s,]+/)
    .filter(Boolean);
  if (list.includes(origin)) return true;
  return devMode(env) && /^http:\/\/(localhost|127\.0\.0\.1):\d{1,5}$/.test(origin);
}

// CORS headers for an allowed Origin, or null.
function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  return origin !== null && originAllowed(origin, env) ? { 'Access-Control-Allow-Origin': origin } : null;
}

function json(status, body, cors) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  };
  if (cors) Object.assign(headers, cors);
  return new Response(JSON.stringify(body), { status, headers });
}

// "Now" in ms. With DEV=1 the tests may fake it with an x-now header; never in production.
function clock(request, env) {
  if (devMode(env)) {
    const fake = request.headers.get('x-now');
    if (fake !== null && /^\d{1,15}$/.test(fake)) return Number(fake);
  }
  return Date.now();
}

const POST_ROUTES = {
  '/v1/subscribe': subscribe,
  '/v1/unsubscribe': unsubscribe,
  '/v1/test': testPush,
  '/v1/active': setActive,
};

// Paths that also answer requests with no Origin header (a browser tab, curl, a monitor).
const OPEN_PATHS = new Set(['/v1/health', '/v1/key']);

async function handleFetch(request, env, cors) {
  const path = new URL(request.url).pathname;
  const hasOrigin = request.headers.get('Origin') !== null;
  if (hasOrigin && !cors) return json(403, { ok: false, error: 'origin' });
  // Without an Origin header only the health check and the key answer (any path when DEV=1, for tests).
  if (!hasOrigin && !OPEN_PATHS.has(path) && !devMode(env)) {
    return json(403, { ok: false, error: 'origin' });
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...cors,
        Vary: 'Origin',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  if (request.method === 'GET' && path === '/v1/health') {
    return json(200, { ok: true, version: VERSION }, cors);
  }

  // The public VAPID key the site subscribes with (applicationServerKey). Public by design.
  if (request.method === 'GET' && path === '/v1/key') {
    return json(200, { ok: true, key: (await vapidKeys(env)).publicKey }, cors);
  }

  const route = request.method === 'POST' && Object.hasOwn(POST_ROUTES, path) ? POST_ROUTES[path] : undefined;
  if (!route) return json(404, { ok: false, error: 'not-found' }, cors);

  const body = await readJsonBody(request);
  const [status, out] = await route(body, env, request, clock(request, env));
  return json(status, out, cors);
}

// Reads at most MAX_BODY bytes and parses them as a JSON object, whatever the Content-Type
// (the site sends text/plain so that no CORS preflight is needed).
async function readJsonBody(request) {
  const declared = Number(request.headers.get('Content-Length'));
  if (declared > MAX_BODY) return { error: 'too-big' };
  if (!request.body) return { error: 'bad-json' };
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) {
      try {
        await reader.cancel();
      } catch {
        // the client is gone; nothing to do
      }
      return { error: 'too-big' };
    }
    chunks.push(value);
  }
  let value;
  try {
    value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(concatBytes(...chunks)));
  } catch {
    return { error: 'bad-json' };
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { error: 'bad-json' };
  return { value };
}

function bodyError(code) {
  return code === 'too-big' ? [413, { ok: false, error: 'too-big' }] : [400, { ok: false, error: 'bad-json' }];
}

async function sha256(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return b64urlEncode(new Uint8Array(digest));
}

function intVar(value, fallback, min, max) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

function endpointOf(value) {
  const e = value && value.endpoint;
  return typeof e === 'string' && e.length > 0 && e.length <= MAX_ENDPOINT ? e : null;
}

// The tables exist: made once per isolate before its first query (CREATE ... IF NOT EXISTS,
// cheap when they are there). Kept per D1 binding, which stays the same object in an isolate.
const tablesReady = new WeakMap();

function ready(env) {
  let p = tablesReady.get(env.DB);
  if (!p) {
    p = createTables(env.DB);
    tablesReady.set(env.DB, p);
    p.catch(() => tablesReady.delete(env.DB)); // tried again by the next request
  }
  return p;
}

// A fixed one-hour window per key. Returns true while the key is within its limit.
async function withinLimit(env, key, now, limit) {
  const n = await env.DB.prepare(
    `INSERT INTO rl (k, n, win) VALUES (?1, 1, ?2)
     ON CONFLICT (k) DO UPDATE SET
       n = CASE WHEN rl.win <= ?2 - ?3 THEN 1 ELSE rl.n + 1 END,
       win = CASE WHEN rl.win <= ?2 - ?3 THEN ?2 ELSE rl.win END
     RETURNING n`,
  )
    .bind(key, now, HOUR)
    .first('n');
  return n <= limit;
}

// POST /v1/subscribe
async function subscribe(body, env, request, now) {
  if (body.error) return bodyError(body.error);
  const checked = await validateSubscribe(body.value, devMode(env));
  if (checked.error) return [400, { ok: false, error: checked.error }];
  const s = checked.value;

  await ready(env);
  // Counted per address, and for IPv6 per /64 network (see addressGroup). The public key is the
  // salt, so the stored hash cannot be matched to an address elsewhere.
  const ip = addressGroup(request.headers.get('CF-Connecting-IP') || '');
  const rlKey = 'sub:' + (await sha256(ip + (await vapidKeys(env)).publicKey));
  if (!(await withinLimit(env, rlKey, now, SUBSCRIBES_PER_HOUR))) {
    return [429, { ok: false, error: 'slow-down' }];
  }

  const id = await sha256(s.endpoint);
  const maxSubs = intVar(env.MAX_SUBS, 20000, 1, 1e9);
  // The number of rows comes from the counts table, which triggers keep exact (store.js): one
  // row read, where COUNT(*) would read every row of subs.
  const probe = await env.DB.prepare(
    "SELECT (SELECT 1 FROM subs WHERE id = ?1) AS known, (SELECT n FROM counts WHERE k = 'subs') AS n",
  )
    .bind(id)
    .first();
  if (!probe.known && (probe.n || 0) >= maxSubs) return [503, { ok: false, error: 'full' }];

  const next = nextAt(now, s.tz, s.hh, s.mm, s.days);
  // active only moves forward: a re-subscribe that does not know today's study day must not
  // clear the one /v1/active already stored.
  await env.DB.prepare(
    `INSERT INTO subs (id, endpoint, p256dh, auth, hh, mm, days, tz, open, skip, active, next_at, created, updated)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?13)
     ON CONFLICT (id) DO UPDATE SET
       endpoint = excluded.endpoint, p256dh = excluded.p256dh, auth = excluded.auth,
       hh = excluded.hh, mm = excluded.mm, days = excluded.days, tz = excluded.tz,
       open = excluded.open, skip = excluded.skip, active = max(subs.active, excluded.active),
       next_at = excluded.next_at, updated = excluded.updated, fails = 0`,
  )
    .bind(id, s.endpoint, s.p256dh, s.auth, s.hh, s.mm, s.days, s.tz, s.open, s.skip, s.active, next, now)
    .run();
  return [200, { ok: true, next }];
}

// POST /v1/unsubscribe: always { ok: true }, whether or not the row existed.
async function unsubscribe(body, env) {
  const endpoint = endpointOf(body.value);
  if (endpoint) {
    await ready(env);
    await env.DB.prepare('DELETE FROM subs WHERE id = ?1').bind(await sha256(endpoint)).run();
  }
  return [200, { ok: true }];
}

// POST /v1/active: the learner studied on this local day. Always { ok: true }.
async function setActive(body, env) {
  const endpoint = endpointOf(body.value);
  if (endpoint && isDay(body.value.day)) {
    await ready(env);
    await env.DB.prepare('UPDATE subs SET active = ?2 WHERE id = ?1')
      .bind(await sha256(endpoint), body.value.day)
      .run();
  }
  return [200, { ok: true }];
}

// POST /v1/test: send a test notification now.
async function testPush(body, env, request, now) {
  if (body.error) return bodyError(body.error);
  const endpoint = endpointOf(body.value);
  if (!endpoint) return [404, { ok: false, error: 'not-found' }];
  const id = await sha256(endpoint);
  await ready(env);
  const row = await env.DB.prepare(
    `UPDATE subs SET
       tests = CASE WHEN test_win <= ?2 - ?3 THEN 1 ELSE tests + 1 END,
       test_win = CASE WHEN test_win <= ?2 - ?3 THEN ?2 ELSE test_win END
     WHERE id = ?1
     RETURNING endpoint, p256dh, auth, tests`,
  )
    .bind(id, now, HOUR)
    .first();
  if (!row) return [404, { ok: false, error: 'not-found' }];
  if (row.tests > TESTS_PER_HOUR) return [429, { ok: false, error: 'slow-down' }];

  const status = await push(await vapidKeys(env), env, row, TEST_MESSAGE, 300, 'test');
  if (status >= 200 && status < 300) return [200, { ok: true, status }];
  if (status === 404 || status === 410) {
    await env.DB.prepare('DELETE FROM subs WHERE id = ?1').bind(id).run();
    return [410, { ok: false, error: 'gone' }];
  }
  return [502, { ok: false, error: 'push-failed', status }];
}

// ---------- push ----------

// The VAPID keys: { publicKey (base64url), privateKey (a CryptoKey that only signs) }.
// The Worker secrets VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY when both are set; otherwise the
// pair kept in D1, made on first need (store.js). Either way cached in module scope.
let secretKeys = null;
const storedKeys = new WeakMap(); // D1 binding -> Promise of the keys

async function vapidKeys(env) {
  const pub = env.VAPID_PUBLIC_KEY;
  const priv = env.VAPID_PRIVATE_KEY;
  if (pub && priv) {
    const id = pub + ' ' + priv;
    if (!secretKeys || secretKeys.id !== id) {
      secretKeys = { id, keys: await importVapidKeys(pub, priv) };
    }
    return secretKeys.keys;
  }
  let p = storedKeys.get(env.DB);
  if (!p) {
    // Errors never carry the key: store.js words its own, and a failed import gets this one.
    p = ready(env)
      .then(() => storedVapidKeys(env.DB))
      .then((k) =>
        importVapidKeys(k.publicKey, k.privateKey).catch(() => {
          throw new Error('the VAPID keys stored in D1 are damaged');
        }),
      );
    storedKeys.set(env.DB, p);
    p.catch(() => storedKeys.delete(env.DB)); // tried again on the next need
  }
  return p;
}

// Sends one push. Returns the push service's HTTP status, or 0 when it failed before that.
async function push(vapid, env, sub, message, ttl, topic) {
  try {
    return await sendPush(sub, message, {
      vapid,
      subject: env.VAPID_SUBJECT,
      ttl,
      urgency: 'high',
      topic,
      maxBytes: MAX_PAYLOAD,
    });
  } catch (err) {
    logError('push', err);
    return 0;
  }
}

// ---------- cron ----------

function followingTime(now, row) {
  try {
    return nextAt(now, row.tz, row.hh, row.mm, row.days);
  } catch {
    try {
      return nextAt(now, 'UTC', row.hh, row.mm, row.days || 127);
    } catch {
      return now + DAY;
    }
  }
}

async function runCron(env, now) {
  const batch = intVar(env.BATCH, 10, 1, MAX_BATCH);
  await ready(env); // only the first run in an isolate does any work here
  // The one query every minute when nothing is due; it reads the subs_due index only (two ranges of it).
  // - Reminders that can still go out (at most LATE past their time) come first, up to BATCH, so late ones never take
  //   their places. Late ones are moved on to their next time (not sent) in the statement room left (ROW_ROOM), so
  //   they never stay stuck, even when every minute of the day is busy.
  // - Among rows due at the same time, the one that has waited longest since its last reminder (the smallest last_at)
  //   goes first. A late reminder does not count as a turn (its last_at stays), so if a minute holds more reminders
  //   than can go out within two hours, the ones that missed out go first the next day.
  const COLS = 'id, endpoint, p256dh, auth, hh, mm, days, tz, open, skip, active, fails, next_at';
  const { results: found } = await env.DB.prepare(
    `SELECT * FROM (SELECT ${COLS} FROM subs WHERE next_at >= ?3 AND next_at <= ?1 ORDER BY next_at, last_at LIMIT ?2)
     UNION ALL
     SELECT * FROM (SELECT ${COLS} FROM subs WHERE next_at < ?3 ORDER BY next_at, last_at LIMIT ?4)`,
  )
    .bind(now, batch, now - LATE, ROW_ROOM)
    .all();
  const isLate = (r) => now - r.next_at > LATE;
  const onTime = found.filter((r) => !isLate(r)).slice(0, batch);
  const results = onTime.concat(found.filter(isLate).slice(0, ROW_ROOM - 2 * onTime.length));

  // Once an hour, forget rate-limit windows that ended long ago.
  if (new Date(now).getUTCMinutes() === 0) {
    await env.DB.prepare('DELETE FROM rl WHERE win < ?1').bind(now - RL_KEEP).run();
  }

  const counts = { due: results.length, sent: 0, skipped: 0, gone: 0, failed: 0, late: 0 };
  if (!results.length) return counts;

  let vapid;
  try {
    vapid = await vapidKeys(env);
  } catch (err) {
    logError('cron', err);
    return counts; // nothing moved: the rows stay due until the keys are set
  }

  // 1. Move each row to its next time before sending, so a retried run never sends twice. The
  //    move only happens while next_at is still the time read above, so when two runs overlap,
  //    only the one that moved a row sends it.
  const moved = await env.DB.batch(
    results.map((r) =>
      // last_at (when its last reminder was handled) moves only for a reminder that is not late
      env.DB.prepare(
        'UPDATE subs SET next_at = ?2, last_at = CASE WHEN ?5 THEN last_at ELSE ?3 END WHERE id = ?1 AND next_at = ?4 RETURNING id',
      ).bind(r.id, followingTime(now, r), now, r.next_at, isLate(r) ? 1 : 0),
    ),
  );
  const mine = results.filter((r, i) => {
    const res = moved && moved[i];
    return !res || !Array.isArray(res.results) || res.results.length > 0; // no row back: another run has it
  });
  counts.due = mine.length;
  if (!mine.length) return counts;

  // 2. Send, unless the learner asked to skip days they already studied and studied on the day
  //    this reminder is for, or the reminder is hours late. The day is the reminder's own (its
  //    next_at), not the run's: a reminder for 11:59 pm that goes out at 12:01 am is still for
  //    the day before.
  const after = [];
  await Promise.all(
    mine.map(async (r) => {
      let status = 0;
      try {
        if (isLate(r)) {
          counts.late++;
          return;
        }
        if (r.skip && r.active && r.active === localDate(r.next_at, r.tz)) {
          counts.skipped++;
          return;
        }
        status = await push(vapid, env, r, reminderMessage(r.open, localDayOfYear(r.next_at, r.tz)), 3600, 'reminder');
      } catch (err) {
        logError('cron-row', err);
      }
      // 3. Keep the table clean: gone subscriptions go now, broken ones after MAX_FAILS.
      if (status >= 200 && status < 300) {
        counts.sent++;
        if (r.fails) after.push(env.DB.prepare('UPDATE subs SET fails = 0 WHERE id = ?1').bind(r.id));
      } else if (status === 404 || status === 410) {
        counts.gone++;
        after.push(env.DB.prepare('DELETE FROM subs WHERE id = ?1').bind(r.id));
      } else {
        counts.failed++;
        after.push(
          r.fails + 1 >= MAX_FAILS
            ? env.DB.prepare('DELETE FROM subs WHERE id = ?1').bind(r.id)
            : env.DB.prepare('UPDATE subs SET fails = fails + 1 WHERE id = ?1').bind(r.id),
        );
      }
    }),
  );
  if (after.length) await env.DB.batch(after);

  // 4. Counts only, never endpoints.
  console.log(JSON.stringify(counts));
  return counts;
}

// ---------- logs ----------

function logError(where, err) {
  const message = String((err && err.message) || err || '')
    .replace(/https?:\/\/\S+/g, '[url]')
    .slice(0, 200);
  console.log(JSON.stringify({ error: where, name: (err && err.name) || 'Error', message }));
}
