// The Worker module run in-process (Node), with a D1 stand-in on node:sqlite and a stubbed
// fetch. Checks what HTTP alone cannot see: how many D1 statements each run makes, that
// next_at is written before any push goes out, and that bad requests never touch D1.
// Most tests give the Worker VAPID secrets; test/unit/store.test.js covers the keys it makes
// and keeps in D1 when it has none, and the tables it makes for itself.
// The real thing (wrangler dev + workerd + local D1) is covered in test/e2e.

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import worker from '../../src/index.js';
import { fakeD1 } from '../fake-d1.js';
import { newSubscription, newVapidKeys, decryptPush, verifyVapidHeader } from '../helpers.js';
import { nextAt, localDayOfYear } from '../../src/time.js';
import { reminderMessage } from '../../src/texts.js';

const SCHEMA = fileURLToPath(new URL('../../schema.sql', import.meta.url));
const SITE = 'https://digitalmarket-arch.github.io';
const BASE = 'https://aimarg-reminders.example.workers.dev';
const VAPID = newVapidKeys();
const ALL = [0, 1, 2, 3, 4, 5, 6];
const T0 = Date.parse('2026-11-16T04:00:00Z'); // Monday 09:30 in India
const DAY = 86400000;

function makeEnv(over = {}) {
  return {
    ALLOWED_ORIGINS: SITE,
    VAPID_SUBJECT: 'https://digitalmarket-arch.github.io/AI-ML/',
    BATCH: '10',
    MAX_SUBS: '20000',
    VAPID_PUBLIC_KEY: VAPID.publicKey,
    VAPID_PRIVATE_KEY: VAPID.privateKey,
    DEV: '1',
    DB: fakeD1(SCHEMA),
    ...over,
  };
}

// A D1 binding that fails the test if it is used at all.
const NO_DB = new Proxy({}, { get: () => { throw new Error('the database must not be touched'); } });

function request(path, { method = 'POST', origin = SITE, body, headers = {} } = {}) {
  const h = { ...headers };
  if (origin) h.Origin = origin;
  const init = { method, headers: h };
  if (body !== undefined) {
    h['Content-Type'] = 'text/plain;charset=UTF-8';
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  return new Request(BASE + path, init);
}

async function call(env, req) {
  const res = await worker.fetch(req, env);
  const text = await res.text();
  return { status: res.status, headers: res.headers, body: text ? JSON.parse(text) : null };
}

let nextIp = 1;
async function addSub(env, over = {}) {
  const { name = 'n' + Math.random().toString(36).slice(2), now = T0, ip, ...fields } = over;
  const s = newSubscription('https://fcm.googleapis.com/fcm/send/' + name);
  const body = { sub: s.sub, time: '19:00', days: ALL, tz: 'Asia/Kolkata', open: 'review', skip: false, active: '', ...fields };
  const r = await call(env, request('/v1/subscribe', { body, headers: { 'x-now': String(now), 'CF-Connecting-IP': ip || `192.0.2.${nextIp++ % 250}` } }));
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return { ...s, next: r.body.next };
}

// Stubs the global fetch the Worker uses to reach push services.
const realFetch = globalThis.fetch;
function stubPush(statusFor = () => 201, onCall = () => {}) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    onCall(String(url), init);
    return new Response(null, { status: statusFor(String(url), calls.length) });
  };
  return calls;
}
afterEach(() => {
  globalThis.fetch = realFetch;
});

async function captureLogs(fn) {
  const lines = [];
  const orig = console.log;
  console.log = (...a) => lines.push(a.join(' '));
  try {
    await fn();
  } finally {
    console.log = orig;
  }
  return lines;
}

const rowsOf = (env) => env.DB.db.prepare('SELECT * FROM subs ORDER BY created').all().map((r) => ({ ...r }));

// ---------- HTTP: CORS, validation, routing ----------

test('preflight from the site: 204 with the CORS headers, no database work', async () => {
  const r = await call(makeEnv({ DB: NO_DB }), request('/v1/subscribe', { method: 'OPTIONS', headers: { 'Access-Control-Request-Method': 'POST' } }));
  assert.equal(r.status, 204);
  assert.equal(r.headers.get('access-control-allow-origin'), SITE);
  assert.equal(r.headers.get('vary'), 'Origin');
  assert.equal(r.headers.get('access-control-allow-methods'), 'GET, POST, OPTIONS');
  assert.equal(r.headers.get('access-control-allow-headers'), 'Content-Type');
  assert.equal(r.headers.get('access-control-max-age'), '86400');
});

test('origins: other sites get 403; localhost only with DEV=1; no Origin only for health', async () => {
  const prod = makeEnv({ DB: NO_DB, DEV: undefined });
  for (const origin of ['https://evil.example', 'null', 'http://localhost:8080', 'https://digitalmarket-arch.github.io.evil.example']) {
    for (const method of ['OPTIONS', 'POST']) {
      const r = await call(prod, request('/v1/subscribe', { method, origin, body: method === 'POST' ? '{}' : undefined }));
      assert.equal(r.status, 403, `${method} ${origin}`);
      assert.deepEqual(r.body, method === 'POST' ? { ok: false, error: 'origin' } : { ok: false, error: 'origin' });
      assert.equal(r.headers.get('access-control-allow-origin'), null);
    }
  }
  assert.equal((await call(prod, request('/v1/health', { method: 'GET', origin: null }))).status, 200);
  assert.deepEqual((await call(prod, request('/v1/key', { method: 'GET', origin: null }))).body, { ok: true, key: VAPID.publicKey }, 'the key too');
  assert.equal((await call(prod, request('/v1/key', { method: 'GET', origin: 'https://evil.example' }))).status, 403);
  assert.equal((await call(prod, request('/v1/subscribe', { origin: null, body: '{}' }))).status, 403);
  assert.equal((await call(prod, request('/v1/unsubscribe', { method: 'OPTIONS', origin: null }))).status, 403);
  const dev = makeEnv({ DB: NO_DB });
  const local = await call(dev, request('/v1/subscribe', { origin: 'http://localhost:8080', body: '{}' }));
  assert.equal(local.status, 400);
  assert.equal(local.headers.get('access-control-allow-origin'), 'http://localhost:8080');
  assert.equal((await call(dev, request('/v1/subscribe', { origin: 'http://127.0.0.1:5500', body: '{}' }))).status, 400);
  assert.equal((await call(dev, request('/v1/subscribe', { origin: null, body: '{}' }))).status, 400, 'DEV: Node tests need no Origin');
  assert.equal((await call(dev, request('/v1/subscribe', { origin: 'http://localhost', body: '{}' }))).status, 403, 'a port is required');
});

test('health, unknown paths and wrong methods', async () => {
  const env = makeEnv({ DB: NO_DB });
  const h = await call(env, request('/v1/health', { method: 'GET' }));
  assert.deepEqual(h.body, { ok: true, version: '1' });
  assert.equal(h.headers.get('access-control-allow-origin'), SITE);
  assert.equal(h.headers.get('content-type'), 'application/json; charset=utf-8');
  for (const [method, path] of [['GET', '/'], ['GET', '/v1/subscribe'], ['POST', '/v1/health'], ['POST', '/v2/subscribe'], ['PUT', '/v1/test']]) {
    const r = await call(env, request(path, { method, body: method === 'GET' ? undefined : '{}' }));
    assert.equal(r.status, 404, `${method} ${path}`);
    assert.deepEqual(r.body, { ok: false, error: 'not-found' });
  }
});

test('bad bodies are answered without touching the database', async () => {
  const env = makeEnv({ DB: NO_DB });
  const s = newSubscription('https://fcm.googleapis.com/fcm/send/x');
  const good = { sub: s.sub, time: '19:00', days: ALL, tz: 'Asia/Kolkata', open: 'review', skip: true, active: '' };
  const cases = [
    ['not json', 'bad-json'],
    ['[1,2]', 'bad-json'],
    ['', 'bad-json'],
    [{ ...good, sub: null }, 'bad-sub'],
    [{ ...good, sub: { ...s.sub, endpoint: 'https://push.example.com/x' } }, 'bad-host'],
    [{ ...good, time: '25:00' }, 'bad-time'],
    [{ ...good, days: [] }, 'bad-days'],
    [{ ...good, tz: 'Nowhere/Land' }, 'bad-tz'],
    [{ ...good, open: 'learn' }, 'bad-open'],
  ];
  for (const [body, error] of cases) {
    const r = await call(env, request('/v1/subscribe', { body }));
    assert.equal(r.status, 400, error);
    assert.deepEqual(r.body, { ok: false, error });
  }
  const big = await call(env, request('/v1/subscribe', { body: JSON.stringify({ ...good, pad: 'x'.repeat(4100) }) }));
  assert.equal(big.status, 413);
  assert.deepEqual(big.body, { ok: false, error: 'too-big' });
  // A body of exactly 4096 bytes is still read.
  const exact = JSON.stringify({ ...good, open: 'x', pad: '' });
  const r = await call(env, request('/v1/subscribe', { body: exact.replace('"pad":""', `"pad":"${'y'.repeat(4096 - exact.length)}"`) }));
  assert.deepEqual(r.body, { ok: false, error: 'bad-open' });
  // /v1/test needs JSON; /v1/unsubscribe and /v1/active always answer ok.
  assert.equal((await call(env, request('/v1/test', { body: 'nope' }))).status, 400);
  assert.deepEqual((await call(env, request('/v1/unsubscribe', { body: 'nope' }))).body, { ok: true });
  assert.deepEqual((await call(env, request('/v1/active', { body: 'nope' }))).body, { ok: true });
});

// ---------- subscribe ----------

test('subscribe stores one row per endpoint; next comes from the time maths', async () => {
  const env = makeEnv();
  const a = await addSub(env, { name: 'a', time: '19:00' });
  assert.equal(a.next, nextAt(T0, 'Asia/Kolkata', 19, 0, ALL));
  assert.equal(a.next, Date.parse('2026-11-16T13:30:00Z'));
  let rows = rowsOf(env);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].days, 127);
  assert.equal(rows[0].next_at, a.next);
  assert.equal(rows[0].created, T0);
  assert.equal(rows[0].id, Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(a.sub.endpoint))).toString('base64url'));
  // Same endpoint, new settings: still one row, created kept, updated and next changed.
  const later = T0 + 60000;
  const r = await call(env, request('/v1/subscribe', {
    body: { sub: a.sub, time: '07:15', days: [2], tz: 'Asia/Kolkata', open: 'play', skip: true, active: '' },
    headers: { 'x-now': String(later) },
  }));
  assert.equal(r.body.next, Date.parse('2026-11-17T01:45:00Z'));
  rows = rowsOf(env);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].created, T0);
  assert.equal(rows[0].updated, later);
  assert.deepEqual([rows[0].hh, rows[0].mm, rows[0].days, rows[0].open, rows[0].skip], [7, 15, 4, 'play', 1]);
});

test('x-now is honoured only when DEV=1', async () => {
  const env = makeEnv({ DEV: '0' });
  const s = newSubscription('https://fcm.googleapis.com/fcm/send/x');
  const r = await call(env, request('/v1/subscribe', {
    body: { sub: s.sub, time: '19:00', days: ALL, tz: 'Asia/Kolkata', open: 'review', skip: false, active: '' },
    headers: { 'x-now': String(Date.parse('2001-01-01T00:00:00Z')) },
  }));
  assert.equal(r.status, 200);
  assert.ok(r.body.next > Date.now(), 'the real clock was used');
});

test('active: /v1/active sets it; a re-subscribe never moves it backwards', async () => {
  const env = makeEnv();
  const a = await addSub(env, { skip: true, active: '' });
  await call(env, request('/v1/active', { body: { endpoint: a.sub.endpoint, day: '2026-11-16' } }));
  assert.equal(rowsOf(env)[0].active, '2026-11-16');
  await addSub(env, { name: 'other' }); // unrelated row
  const again = await call(env, request('/v1/subscribe', {
    body: { sub: a.sub, time: '19:00', days: ALL, tz: 'Asia/Kolkata', open: 'review', skip: true, active: '' },
    headers: { 'x-now': String(T0) },
  }));
  assert.equal(again.status, 200);
  assert.equal(rowsOf(env).find((r) => r.endpoint === a.sub.endpoint).active, '2026-11-16');
  assert.deepEqual((await call(env, request('/v1/active', { body: { endpoint: a.sub.endpoint, day: 'today' } }))).body, { ok: true });
  assert.deepEqual((await call(env, request('/v1/active', { body: { endpoint: 'https://fcm.googleapis.com/fcm/send/none', day: '2026-11-16' } }))).body, { ok: true });
});

test('rate limit: 20 subscribes an hour per IP, keyed by a hash and never the raw IP', async () => {
  const env = makeEnv();
  const s = newSubscription('https://fcm.googleapis.com/fcm/send/rl');
  const body = { sub: s.sub, time: '19:00', days: ALL, tz: 'Asia/Kolkata', open: 'review', skip: false, active: '' };
  const send = (ip, now) => call(env, request('/v1/subscribe', { body, headers: { 'CF-Connecting-IP': ip, 'x-now': String(now) } }));
  for (let i = 0; i < 20; i++) assert.equal((await send('203.0.113.7', T0 + i * 1000)).status, 200, `subscribe ${i + 1}`);
  const blocked = await send('203.0.113.7', T0 + 30 * 60000);
  assert.equal(blocked.status, 429);
  assert.deepEqual(blocked.body, { ok: false, error: 'slow-down' });
  assert.equal((await send('203.0.113.8', T0 + 30 * 60000)).status, 200, 'another IP is not affected');
  assert.equal((await send('203.0.113.7', T0 + 3600000)).status, 200, 'a new hour starts afresh');
  const keys = env.DB.db.prepare('SELECT k FROM rl').all().map((r) => r.k);
  assert.equal(keys.length, 2);
  for (const k of keys) {
    assert.match(k, /^sub:[A-Za-z0-9_-]{43}$/);
    assert.ok(!k.includes('203.0.113'));
  }
});

test('rate limit: IPv6 addresses are counted by their /64 network, so one connection cannot dodge the limit', async () => {
  const env = makeEnv();
  const s = newSubscription('https://fcm.googleapis.com/fcm/send/rl6');
  const body = { sub: s.sub, time: '19:00', days: ALL, tz: 'Asia/Kolkata', open: 'review', skip: false, active: '' };
  const send = (ip, now = T0) => call(env, request('/v1/subscribe', { body, headers: { 'CF-Connecting-IP': ip, 'x-now': String(now) } }));
  // A new address in one /64 for every request, written in every way an address can be written.
  const spell = (i) => [`2001:db8:1:2::${i.toString(16)}`, `2001:0DB8:0001:0002:0:0:0:${i.toString(16)}`, `2001:db8:1:2:${i.toString(16)}::1`, `2001:db8:1:2:ffff:${i.toString(16)}:0:9`][i % 4];
  for (let i = 1; i <= 20; i++) assert.equal((await send(spell(i), T0 + i)).status, 200, `subscribe ${i} from ${spell(i)}`);
  const blocked = await send('2001:db8:1:2:abcd:ef01:2345:6789', T0 + 60000);
  assert.deepEqual([blocked.status, blocked.body], [429, { ok: false, error: 'slow-down' }], 'the 21st from the same /64');
  assert.equal((await send('2001:db8:1:3::1', T0 + 60000)).status, 200, 'the next /64 is someone else');
  // An IPv4 address written as IPv6 is that IPv4 address.
  for (let i = 0; i < 20; i++) assert.equal((await send('198.51.100.9', T0 + i)).status, 200);
  assert.equal((await send('::ffff:198.51.100.9', T0 + 100)).status, 429);
  const keys = env.DB.db.prepare('SELECT k FROM rl').all().map((r) => r.k);
  assert.equal(keys.length, 3, 'one window per /64 network and per IPv4 address');
  const salt = (x) => 'sub:' + createHash('sha256').update(x + VAPID.publicKey).digest('base64url');
  assert.ok(keys.includes(salt('2001:db8:1:2::/64')) && keys.includes(salt('198.51.100.9')), keys);
  for (const k of keys) assert.ok(!k.includes('2001') && !k.includes('198.51'), 'only hashes are kept');
});

test('MAX_SUBS: a new endpoint gets 503 when full; known endpoints still update', async () => {
  const env = makeEnv({ MAX_SUBS: '3' });
  const subs = [];
  for (let i = 0; i < 3; i++) subs.push(await addSub(env, { name: 'full' + i }));
  const s = newSubscription('https://fcm.googleapis.com/fcm/send/new');
  const body = (sub) => ({ sub, time: '19:00', days: ALL, tz: 'Asia/Kolkata', open: 'review', skip: false, active: '' });
  const full = await call(env, request('/v1/subscribe', { body: body(s.sub), headers: { 'x-now': String(T0) } }));
  assert.equal(full.status, 503);
  assert.deepEqual(full.body, { ok: false, error: 'full' });
  assert.equal((await call(env, request('/v1/subscribe', { body: body(subs[0].sub), headers: { 'x-now': String(T0) } }))).status, 200);
  await call(env, request('/v1/unsubscribe', { body: { endpoint: subs[1].sub.endpoint } }));
  assert.equal((await call(env, request('/v1/subscribe', { body: body(s.sub), headers: { 'x-now': String(T0) } }))).status, 200, 'room again after one left');
  assert.equal(rowsOf(env).length, 3);
});

test('MAX_SUBS is checked with a kept count: one row read, never a COUNT of every row', async () => {
  const env = makeEnv({ MAX_SUBS: '3' });
  const count = () => env.DB.db.prepare("SELECT n FROM counts WHERE k = 'subs'").get().n;
  const real = () => env.DB.db.prepare('SELECT COUNT(*) AS n FROM subs').get().n;
  const subs = [];
  for (let i = 0; i < 3; i++) subs.push(await addSub(env, { name: 'c' + i }));
  assert.equal(count(), 3);
  await addSub(env, { name: 'c0', time: '08:00' }); // the same device again: an update, not a new row
  assert.equal(count(), 3);
  // The first two leave, the newest stays: rowids are not reused, so MAX(rowid) is still 3 (the old check then counted
  // every row for each new device, for good once 20,000 devices had ever signed up).
  for (const x of subs.slice(0, 2)) await call(env, request('/v1/unsubscribe', { body: { endpoint: x.sub.endpoint } }));
  assert.equal(env.DB.db.prepare('SELECT MAX(rowid) AS m FROM subs').get().m, 3);
  assert.deepEqual([count(), real()], [1, 1]);
  env.DB.log.length = 0;
  await addSub(env, { name: 'c3' });
  await addSub(env, { name: 'c4' });
  const full = await call(env, request('/v1/subscribe', { body: { sub: newSubscription('https://fcm.googleapis.com/fcm/send/c5').sub, time: '19:00', days: ALL, tz: 'Asia/Kolkata', open: 'review', skip: false, active: '' }, headers: { 'x-now': String(T0) } }));
  assert.equal(full.status, 503, 'full again at 3');
  assert.ok(!env.DB.log.some((q) => /^SELECT COUNT\(\*\)|MAX\(rowid\)/.test(q)), 'no statement that reads every row: ' + env.DB.log.filter((q) => /COUNT|MAX/.test(q)).join(' | '));
  assert.ok(env.DB.log.some((q) => /FROM counts WHERE k = 'subs'/.test(q)), 'the kept count is read');
  // The cron's deletions (gone, 10 failures) keep it exact too.
  stubPush(() => 410);
  await captureLogs(() => worker.scheduled({ scheduledTime: rowsOf(env)[0].next_at }, env));
  assert.deepEqual([count(), real()], [0, 0]);
});

// ---------- /v1/test ----------

test('/v1/test: sends now with TTL 300 and Topic test; limits; gone and failures', async () => {
  const env = makeEnv();
  const a = await addSub(env, { name: 'tester' });
  let status = 201;
  const calls = stubPush(() => status);
  const t = (now) => call(env, request('/v1/test', { body: { endpoint: a.sub.endpoint }, headers: { 'x-now': String(now) } }));
  const ok = await t(T0);
  assert.deepEqual(ok.body, { ok: true, status: 201 });
  assert.equal(calls.length, 1);
  const h = calls[0].init.headers;
  assert.equal(h.TTL, '300');
  assert.equal(h.Topic, 'test');
  assert.equal(h.Urgency, 'high');
  verifyVapidHeader(h.Authorization, VAPID.publicKey);
  assert.deepEqual(JSON.parse(decryptPush(calls[0].init.body, a.ecdh, a.auth).plaintext), {
    t: 'AI Marg',
    b: 'Test reminder: notifications work on this device.',
    u: './#reminders',
    tag: 'aimarg-test',
  });
  for (let i = 2; i <= 5; i++) assert.equal((await t(T0 + i)).status, 200, `test ${i}`);
  const slow = await t(T0 + 10);
  assert.equal(slow.status, 429);
  assert.deepEqual(slow.body, { ok: false, error: 'slow-down' });
  assert.equal(calls.length, 5, 'the 6th test in an hour sends nothing');
  status = 500;
  assert.deepEqual((await t(T0 + 3600000)).body, { ok: false, error: 'push-failed', status: 500 });
  status = 404;
  assert.deepEqual((await t(T0 + 3600001)).body, { ok: false, error: 'gone' });
  assert.equal((await t(T0 + 3600002)).status, 404, 'the row was deleted');
  const unknown = await call(env, request('/v1/test', { body: { endpoint: 'https://fcm.googleapis.com/fcm/send/nobody' } }));
  assert.deepEqual([unknown.status, unknown.body], [404, { ok: false, error: 'not-found' }]);
});

// ---------- cron ----------

test('cron with nothing due makes exactly one (indexed) query', async () => {
  const env = makeEnv();
  await addSub(env);
  env.DB.log.length = 0;
  const logs = await captureLogs(() => worker.scheduled({ scheduledTime: T0 + 60000 * 7 }, env));
  assert.equal(env.DB.log.length, 1);
  assert.match(env.DB.log[0], /^SELECT \* FROM \(SELECT .* FROM subs WHERE next_at >= \?3 AND next_at <= \?1 ORDER BY next_at, last_at LIMIT \?2\)\s+UNION ALL\s+SELECT \* FROM \(SELECT .* FROM subs WHERE next_at < \?3 ORDER BY next_at, last_at LIMIT \?4\)$/);
  // two ranges of the index, already in order: no table scan and no sorting
  const plan = env.DB.db.prepare('EXPLAIN QUERY PLAN ' + env.DB.log[0]).all(1, 10, 0, 37).map((r) => r.detail);
  assert.deepEqual(plan.filter((d) => /SEARCH|SCAN subs|TEMP/.test(d)), [
    'SEARCH subs USING INDEX subs_due (next_at>? AND next_at<?)',
    'SEARCH subs USING INDEX subs_due (next_at<?)',
  ]);
  assert.deepEqual(logs, [], 'nothing to log when nothing was due');
});

test('cron: next_at is written before any push, in one batch; then one batch of results', async () => {
  const env = makeEnv();
  const subs = [];
  for (let i = 0; i < 3; i++) subs.push(await addSub(env, { name: 'due' + i, open: i === 2 ? 'play' : 'review' }));
  const due = subs[0].next;
  env.DB.log.length = 0;
  env.DB.batches.length = 0;
  const seenNextAt = [];
  const calls = stubPush(
    () => 201,
    () => seenNextAt.push(env.DB.db.prepare('SELECT MIN(next_at) AS m FROM subs').get().m),
  );
  const logs = await captureLogs(() => worker.scheduled({ scheduledTime: due }, env));
  assert.equal(calls.length, 3);
  assert.ok(seenNextAt.every((m) => m === due + DAY), 'every row had moved to tomorrow before the first push');
  assert.deepEqual(env.DB.batches, [3], 'one batch for next_at; no result batch needed when all succeed with fails = 0');
  const queries = env.DB.log.filter((s) => !s.startsWith('BATCH')).length;
  assert.equal(queries, 4, '1 select + 3 updates');
  for (const [i, c] of calls.entries()) {
    const s = subs.find((x) => x.sub.endpoint === c.url);
    const msg = JSON.parse(decryptPush(c.init.body, s.ecdh, s.auth).plaintext);
    assert.equal(msg.t, 'AI Marg study time');
    assert.equal(msg.tag, 'aimarg-reminder');
    assert.equal(msg.u, s === subs[2] ? './#play' : './#review', `call ${i}`);
    assert.equal(c.init.headers.TTL, '3600');
    assert.equal(c.init.headers.Topic, 'reminder');
    assert.equal(c.init.headers.Urgency, 'high');
  }
  assert.deepEqual(logs.map((l) => JSON.parse(l)), [{ due: 3, sent: 3, skipped: 0, gone: 0, failed: 0, late: 0 }]);
  for (const line of logs) for (const s of subs) assert.ok(!line.includes(s.sub.endpoint) && !line.includes('fcm'));
  // A retry of the same minute sends nothing again.
  await captureLogs(() => worker.scheduled({ scheduledTime: due }, env));
  assert.equal(calls.length, 3);
  for (const r of rowsOf(env)) assert.deepEqual([r.next_at, r.last_at], [due + DAY, due]);
});

test('cron: at most BATCH rows a run; the rest go the next minute', async () => {
  const env = makeEnv({ BATCH: '10' });
  for (let i = 0; i < 13; i++) await addSub(env, { name: 'b' + i });
  const due = rowsOf(env)[0].next_at;
  const calls = stubPush();
  const first = await captureLogs(() => worker.scheduled({ scheduledTime: due }, env));
  assert.equal(calls.length, 10);
  assert.deepEqual(JSON.parse(first[0]), { due: 10, sent: 10, skipped: 0, gone: 0, failed: 0, late: 0 });
  await captureLogs(() => worker.scheduled({ scheduledTime: due + 60000 }, env));
  assert.equal(calls.length, 13);
  assert.equal(new Set(calls.map((c) => c.url)).size, 13, 'nobody twice');
  // Free plan: 1 select + 10 updates + up to 10 result writes stays under 50 queries a run.
  const env2 = makeEnv();
  for (let i = 0; i < 10; i++) await addSub(env2, { name: 'f' + i });
  env2.DB.log.length = 0;
  env2.DB.batches.length = 0;
  stubPush(() => 500);
  await captureLogs(() => worker.scheduled({ scheduledTime: due }, env2));
  assert.equal(env2.DB.log.filter((s) => !s.startsWith('BATCH')).length, 21);
  assert.deepEqual(env2.DB.batches, [10, 10]);
});

test('cron: BATCH is capped at 18 so a run never exceeds 50 D1 statements, even the first one', async () => {
  // Worst case: the first run in a new isolate (it makes the tables), with no VAPID secrets and
  // no stored keys yet (it makes them), at minute 0 (it prunes), every push failing (a write each).
  const env = makeEnv({ BATCH: '100', VAPID_PUBLIC_KEY: undefined, VAPID_PRIVATE_KEY: undefined });
  for (let i = 0; i < 30; i++) await addSub(env, { name: 'cap' + i });
  const due = rowsOf(env)[0].next_at;
  const top = Math.ceil(due / 3600000) * 3600000; // a minute-0 run also prunes
  env.DB.db.prepare('UPDATE subs SET next_at = ?').run(top);
  env.DB.db.prepare('DELETE FROM meta').run();
  env.DB.log.length = 0;
  const cold = (await import('../../src/index.js?cold-isolate')).default;
  const calls = stubPush(() => 500);
  await captureLogs(() => cold.scheduled({ scheduledTime: top }, env));
  assert.equal(calls.length, 18);
  assert.equal(env.DB.log.filter((s) => !s.startsWith('BATCH')).length, 49);
  assert.equal(env.DB.log.filter((s) => s.startsWith('CREATE')).length, 7, 'the tables, the index and the triggers, once');
  assert.equal(env.DB.log.filter((s) => s.startsWith('INSERT INTO counts')).length, 1, 'and the count, once');
  assert.equal(env.DB.log.filter((s) => / meta /.test(s) && !s.startsWith('CREATE')).length, 3, 'the keys: read, make, read back');

  // The same worst case with only late rows (an outage): they are moved on in the room left, and the run stays at 50.
  const env2 = makeEnv({ BATCH: '18', VAPID_PUBLIC_KEY: undefined, VAPID_PRIVATE_KEY: undefined });
  for (let i = 0; i < 45; i++) await addSub(env2, { name: 'out' + i });
  env2.DB.db.prepare('UPDATE subs SET next_at = ?').run(top - DAY);
  env2.DB.db.prepare('DELETE FROM meta').run();
  env2.DB.log.length = 0;
  const cold2 = (await import('../../src/index.js?cold-isolate-2')).default;
  const calls2 = stubPush();
  const logs = await captureLogs(() => cold2.scheduled({ scheduledTime: top }, env2));
  assert.equal(calls2.length, 0, 'nothing sent a day late');
  assert.equal(JSON.parse(logs[0]).late, 37, '37 late rows moved on in one run');
  assert.equal(env2.DB.log.filter((s) => !s.startsWith('BATCH')).length, 50);
});

test('cron: a reminder hours late (an outage, a long queue) is not sent at the wrong time of day; it moves on', async () => {
  const env = makeEnv();
  const a = await addSub(env, { name: 'late' }); // due Mon 16 Nov, 7:00 pm in India
  const b = await addSub(env, { name: 'on-time' });
  const calls = stubPush();
  // The service comes back at 5:30 am on Wednesday (00:00 UTC, when the free daily limits start again): 34.5 hours late.
  const wed = Date.parse('2026-11-18T00:00:00Z');
  env.DB.db.prepare('UPDATE subs SET next_at = ? WHERE endpoint = ?').run(a.next, b.sub.endpoint);
  const logs = await captureLogs(() => worker.scheduled({ scheduledTime: wed }, env));
  assert.equal(calls.length, 0, 'nothing sent at 5:30 am');
  assert.deepEqual(JSON.parse(logs[0]), { due: 2, sent: 0, skipped: 0, gone: 0, failed: 0, late: 2 });
  for (const r of rowsOf(env)) {
    assert.equal(r.next_at, Date.parse('2026-11-18T13:30:00Z'), 'both move on to Wednesday 7:00 pm');
    assert.equal(r.fails, 0, 'being late is not a failure');
  }
  // Two hours late is still sent (a queue at a popular minute); a minute more is not.
  const due = Date.parse('2026-11-18T13:30:00Z');
  env.DB.db.prepare('UPDATE subs SET next_at = ? WHERE endpoint = ?').run(due + DAY, b.sub.endpoint); // b: tomorrow
  await captureLogs(() => worker.scheduled({ scheduledTime: due + 2 * 3600000 }, env));
  assert.deepEqual(calls.map((c) => c.url), [a.sub.endpoint], 'two hours late: sent');
  const late = await captureLogs(() => worker.scheduled({ scheduledTime: due + DAY + 2 * 3600000 + 60000 }, env));
  assert.equal(calls.length, 1, 'two hours and a minute late: not sent');
  assert.equal(JSON.parse(late[0]).late, 2);
});

test('cron: when one minute holds more reminders than two hours can send, learners take turns, and late ones never take an on-time place', async () => {
  // BATCH 1 sends 121 reminders between 7:00 and 9:00 pm (two hours late is still sent).
  // 120 learners every day at 7:00 pm, 5 on Mon, Wed and Fri at 7:00 pm (so 4 too many on those days), and 2 every day
  // at 7:02 pm, who fit in the places left once the 7:00 pm reminders are too late. Mon 16 Nov to Sun 29 Nov.
  const env = makeEnv({ BATCH: '1' });
  const who = {};
  for (let i = 0; i < 120; i++) who[(await addSub(env, { name: 'e' + i })).sub.endpoint] = 'every';
  for (let i = 0; i < 5; i++) who[(await addSub(env, { name: 'mwf' + i, days: [1, 3, 5] })).sub.endpoint] = 'mwf';
  for (let i = 0; i < 2; i++) who[(await addSub(env, { name: 'n' + i, time: '19:02' })).sub.endpoint] = 'nearby';
  const first = Date.parse('2026-11-16T13:30:00Z'); // Mon 7:00 pm in India
  const calls = stubPush();
  const got = {}; // endpoint -> days it got a reminder
  let late = 0;
  for (let d = 0; d < 14; d++) {
    const from = calls.length;
    for (let m = 0; m < 135; m++) {
      const logs = await captureLogs(() => worker.scheduled({ scheduledTime: first + d * DAY + m * 60000 }, env));
      if (logs.length) late += JSON.parse(logs[0]).late;
    }
    for (const c of calls.slice(from)) (got[c.url] = got[c.url] || []).push(d);
  }
  assert.ok(late > 0, 'the 7:00 pm group is over capacity, so some reminders were too late');
  const missed = (e) => (who[e] === 'mwf' ? 6 : 14) - (got[e] || []).length; // Mon, Wed and Fri: 6 days in two weeks
  const byKind = (k) => Object.keys(who).filter((e) => who[e] === k).map(missed);
  assert.deepEqual(byKind('nearby'), [0, 0], 'learners at 7:02 pm are never pushed out by the late 7:00 pm queue');
  assert.ok(byKind('mwf').every((n) => n <= 1), 'learners on some days only are not the ones left out: ' + byKind('mwf'));
  const every = byKind('every');
  assert.ok(Math.max(...every) <= 2, 'nobody misses more than two of 14 days: ' + every.join(','));
  // nobody misses two days in a row
  for (const e of Object.keys(who).filter((x) => who[x] === 'every')) {
    const days = new Set(got[e] || []);
    for (let d = 1; d < 14; d++) assert.ok(days.has(d) || days.has(d - 1), 'two days in a row missed by one learner');
  }
});

test('cron: when every minute is busy, late reminders still move on to their next time (none stays stuck)', async () => {
  // BATCH 1 and 2 learners at every minute from 6:00 to 10:59 am UTC: there is always an on-time reminder waiting.
  const env = makeEnv({ BATCH: '1' });
  for (let m = 0; m < 300; m++) {
    for (let k = 0; k < 2; k++) {
      const time = String(6 + Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
      await addSub(env, { name: `busy${m}-${k}`, time, tz: 'UTC' });
    }
  }
  const start = Date.parse('2026-11-16T06:00:00Z');
  const calls = stubPush();
  let late = 0;
  for (let m = 0; m < 300; m++) {
    const logs = await captureLogs(() => worker.scheduled({ scheduledTime: start + m * 60000 }, env));
    if (logs.length) late += JSON.parse(logs[0]).late;
  }
  assert.equal(calls.length, 300, 'one reminder sent every minute (BATCH 1)');
  assert.ok(late > 0, 'some reminders were too late');
  const end = start + 299 * 60000;
  const stuck = rowsOf(env).filter((r) => end - r.next_at > 2 * 3600000);
  assert.equal(stuck.length, 0, 'no row is left more than two hours behind (it would miss its next reminders too)');
});

test('cron: a new sign-up at a full minute is not the one left out', async () => {
  const env = makeEnv({ BATCH: '1' });
  for (let i = 0; i < 125; i++) await addSub(env, { name: 'f' + i });
  const due = rowsOf(env)[0].next_at;
  const calls = stubPush();
  const run = async (start) => { const from = calls.length; for (let m = 0; m < 130; m++) await captureLogs(() => worker.scheduled({ scheduledTime: start + m * 60000 }, env)); return new Set(calls.slice(from).map((c) => c.url)); };
  await run(due);
  const fresh = await addSub(env, { name: 'fresh', now: due + 3 * 3600000 }); // signs up at 10:00 pm on day 1
  const d2 = await run(due + DAY);
  assert.ok(d2.has(fresh.sub.endpoint), 'the new learner gets their first reminder');
});

test('cron: a late run judges "studied" and the line by the day the reminder is for, not the day it runs', async () => {
  // Twelve learners chose 11:59 pm and studied on Monday 16 Nov. BATCH 10: two of them go in the 12:00 am run.
  const env = makeEnv({ BATCH: '10' });
  for (let i = 0; i < 12; i++) await addSub(env, { name: 'night' + i, time: '23:59', skip: true, active: '2026-11-16' });
  const at2359 = Date.parse('2026-11-16T18:29:00Z');
  assert.equal(rowsOf(env)[0].next_at, at2359);
  const calls = stubPush();
  const one = await captureLogs(() => worker.scheduled({ scheduledTime: at2359 }, env));
  const two = await captureLogs(() => worker.scheduled({ scheduledTime: at2359 + 60000 }, env)); // 12:00 am Tuesday
  assert.deepEqual([JSON.parse(one[0]).skipped, JSON.parse(two[0]).skipped], [10, 2], 'the last two are still Monday\'s');
  assert.equal(calls.length, 0, 'nobody who studied on Monday gets Monday\'s reminder');
  // Without skip, the line is Monday's line, even when it goes out on Tuesday.
  const env2 = makeEnv();
  const x = await addSub(env2, { name: 'monday-line', time: '23:59', skip: false });
  const calls2 = stubPush();
  await captureLogs(() => worker.scheduled({ scheduledTime: at2359 + 60000 }, env2));
  const msg = JSON.parse(decryptPush(calls2[0].init.body, x.ecdh, x.auth).plaintext);
  assert.deepEqual(msg, reminderMessage('review', localDayOfYear(at2359, 'Asia/Kolkata')));
  assert.notDeepEqual(msg, reminderMessage('review', localDayOfYear(at2359 + 60000, 'Asia/Kolkata')), 'Tuesday has another line');
});

test('cron: two runs for the same minute at the same time send each reminder once', async () => {
  const env = makeEnv();
  const subs = [];
  for (let i = 0; i < 3; i++) subs.push(await addSub(env, { name: 'twice' + i }));
  const calls = stubPush();
  const logs = await captureLogs(() =>
    Promise.all([worker.scheduled({ scheduledTime: subs[0].next }, env), worker.scheduled({ scheduledTime: subs[0].next }, env)]),
  );
  assert.equal(calls.length, 3, 'three reminders, not six');
  assert.equal(new Set(calls.map((c) => c.url)).size, 3);
  assert.deepEqual(logs.map((l) => JSON.parse(l)), [{ due: 3, sent: 3, skipped: 0, gone: 0, failed: 0, late: 0 }], 'the run that moved no row logs nothing');
  for (const r of rowsOf(env)) assert.equal(r.next_at, subs[0].next + DAY);
});

test('cron: skip when the learner already studied today (local date), but still move on', async () => {
  const env = makeEnv();
  const studied = await addSub(env, { name: 'studied', skip: true, active: '2026-11-16' });
  const noSkip = await addSub(env, { name: 'noskip', skip: false, active: '2026-11-16' });
  const yesterday = await addSub(env, { name: 'yday', skip: true, active: '2026-11-15' });
  const calls = stubPush();
  const logs = await captureLogs(() => worker.scheduled({ scheduledTime: studied.next }, env));
  assert.deepEqual(calls.map((c) => c.url).sort(), [noSkip.sub.endpoint, yesterday.sub.endpoint].sort());
  assert.deepEqual(JSON.parse(logs[0]), { due: 3, sent: 2, skipped: 1, gone: 0, failed: 0, late: 0 });
  assert.equal(rowsOf(env).find((r) => r.endpoint === studied.sub.endpoint).next_at, studied.next + DAY);
  // Next day the old active date no longer matches: it is sent.
  await captureLogs(() => worker.scheduled({ scheduledTime: studied.next + DAY }, env));
  assert.ok(calls.some((c) => c.url === studied.sub.endpoint));
});

test('cron: 404/410 delete at once; other failures after 10 in a row; success resets', async () => {
  const env = makeEnv();
  const gone = await addSub(env, { name: 'gone' });
  const flaky = await addSub(env, { name: 'flaky' });
  const plan = new Map([[gone.sub.endpoint, () => 410]]);
  let flakyStatus = 500;
  plan.set(flaky.sub.endpoint, () => flakyStatus);
  stubPush((url) => plan.get(url)());
  const run = (k) => captureLogs(() => worker.scheduled({ scheduledTime: gone.next + k * DAY }, env));
  const first = await run(0);
  assert.deepEqual(JSON.parse(first[0]), { due: 2, sent: 0, skipped: 0, gone: 1, failed: 1, late: 0 });
  assert.deepEqual(rowsOf(env).map((r) => [r.endpoint, r.fails]), [[flaky.sub.endpoint, 1]]);
  for (let k = 1; k <= 8; k++) await run(k);
  assert.equal(rowsOf(env)[0].fails, 9);
  flakyStatus = 201;
  await run(9);
  assert.equal(rowsOf(env)[0].fails, 0, 'a success resets the count');
  flakyStatus = 503;
  for (let k = 10; k <= 18; k++) await run(k);
  assert.equal(rowsOf(env)[0].fails, 9);
  await run(19);
  assert.equal(rowsOf(env).length, 0, 'deleted on the 10th failure in a row');
});

test('cron: without VAPID secrets it signs with the keys it keeps in D1', async () => {
  const env = makeEnv({ VAPID_PUBLIC_KEY: undefined, VAPID_PRIVATE_KEY: '' });
  const a = await addSub(env);
  const key = (await call(env, request('/v1/key', { method: 'GET' }))).body.key;
  assert.notEqual(key, VAPID.publicKey);
  const calls = stubPush();
  await captureLogs(() => worker.scheduled({ scheduledTime: a.next }, env));
  assert.equal(calls.length, 1);
  verifyVapidHeader(calls[0].init.headers.Authorization, key);
});

test('cron: when the stored keys are damaged nothing is sent and nothing moves', async () => {
  const env = makeEnv({ VAPID_PUBLIC_KEY: undefined, VAPID_PRIVATE_KEY: undefined });
  const a = await addSub(env);
  env.DB.db.prepare("UPDATE meta SET v = '{\"publicKey\":\"broken\"}' WHERE k = 'vapid'").run();
  const cold = (await import('../../src/index.js?damaged-keys')).default; // a new isolate reads them again
  const calls = stubPush();
  const logs = await captureLogs(() => cold.scheduled({ scheduledTime: a.next }, env));
  assert.equal(calls.length, 0);
  assert.equal(rowsOf(env)[0].next_at, a.next, 'still due for when the keys are fixed');
  assert.match(logs[0], /"error":"cron".*VAPID keys stored in D1 are damaged/);
});

test('cron: prunes rate-limit rows older than two hours, once an hour (minute 0)', async () => {
  const env = makeEnv();
  const ins = env.DB.db.prepare('INSERT INTO rl (k, n, win) VALUES (?, 1, ?)');
  const top = Date.parse('2026-11-16T05:00:00Z');
  ins.run('sub:old', top - 3 * 3600000);
  ins.run('sub:recent', top - 3600000);
  await worker.scheduled({ scheduledTime: top + 60000 }, env); // minute 1: no pruning
  assert.equal(env.DB.db.prepare('SELECT COUNT(*) AS n FROM rl').get().n, 2);
  await worker.scheduled({ scheduledTime: top }, env);
  assert.deepEqual(env.DB.db.prepare('SELECT k FROM rl').all().map((r) => r.k), ['sub:recent']);
});
