// What the Worker sets up for itself, so that a plain `wrangler deploy` (or the Deploy to
// Cloudflare button) is all it needs: its D1 tables, and its VAPID keys kept in D1 when no
// secrets are set. Also GET /v1/key, which gives the site the public key.

import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import worker from '../../src/index.js';
import { SCHEMA, createTables, storedVapidKeys } from '../../src/store.js';
import { fakeD1 } from '../fake-d1.js';
import { newSubscription, newVapidKeys, decryptPush, verifyVapidHeader, publicKeyObject } from '../helpers.js';

const SCHEMA_SQL = fileURLToPath(new URL('../../schema.sql', import.meta.url));
const SITE = 'https://digitalmarket-arch.github.io';
const BASE = 'https://aimarg-reminders.example.workers.dev';
const T0 = Date.parse('2026-11-16T04:00:00Z'); // Monday 09:30 in India
const ALL = [0, 1, 2, 3, 4, 5, 6];

// A brand-new deploy: an empty D1 database and no VAPID secrets.
function freshEnv(over = {}) {
  return {
    ALLOWED_ORIGINS: SITE,
    VAPID_SUBJECT: 'https://digitalmarket-arch.github.io/AI-ML/',
    BATCH: '10',
    MAX_SUBS: '20000',
    DB: fakeD1(),
    ...over,
  };
}

function request(path, { method = 'GET', origin = SITE, body, headers = {} } = {}) {
  const h = { ...headers };
  if (origin) h.Origin = origin;
  const init = { method, headers: h };
  if (body !== undefined) {
    h['Content-Type'] = 'text/plain;charset=UTF-8';
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  return new Request(BASE + path, init);
}

async function call(w, env, req) {
  const res = await w.fetch(req, env);
  const text = await res.text();
  return { status: res.status, headers: res.headers, text, body: text ? JSON.parse(text) : null };
}

// Another isolate: a new instance of the Worker module, with nothing cached.
let isolates = 0;
const newIsolate = async () => (await import('../../src/index.js?isolate=' + ++isolates)).default;

// No test here may reach a real push service: fetch fails unless a test stubs it.
const realFetch = globalThis.fetch;
beforeEach(() => {
  globalThis.fetch = async () => {
    throw new Error('no network in the unit tests');
  };
});
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

const tables = (env) =>
  env.DB.db
    .prepare("SELECT type, name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY name")
    .all()
    .map((r) => r.type + ' ' + r.name);
// Everything the Worker makes, as tables() lists it.
const TABLES = ['table counts', 'table meta', 'table rl', 'table subs', 'trigger subs_added', 'index subs_due', 'trigger subs_removed'];
const stored = (env) => env.DB.db.prepare("SELECT v FROM meta WHERE k = 'vapid'").all().map((r) => JSON.parse(r.v));
const subBody = (sub, fields = {}) => ({ sub, time: '19:00', days: ALL, tz: 'Asia/Kolkata', open: 'review', skip: false, active: '', ...fields });

// ---------- tables ----------

test('schema.sql holds exactly the statements the Worker runs', () => {
  const norm = (sql) => sql.replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')').trim();
  // Compared as one text: a trigger has semicolons inside it, so the file cannot simply be split at each one.
  const fromFile = norm(
    fs
      .readFileSync(SCHEMA_SQL, 'utf8')
      .split('\n')
      .filter((l) => !l.trim().startsWith('--'))
      .join('\n'),
  );
  assert.equal(fromFile, SCHEMA.map((s) => norm(s) + ';').join(' '));
  assert.equal(SCHEMA.length, 8);
  for (const s of SCHEMA) {
    assert.match(s, /^(CREATE (TABLE|INDEX|TRIGGER) IF NOT EXISTS |INSERT INTO counts .* WHERE NOT EXISTS )/s, 'never drops or replaces anything');
    assert.doesNotMatch(s, /\b(DROP|REPLACE|DELETE FROM (subs|rl|meta))\b/);
  }
});

test('the kept count of rows matches the table through every change, and starts from rows already there', async () => {
  const db = fakeD1();
  db.db.exec(SCHEMA[0]); // a subs table from before the count existed, with two rows in it
  db.db.exec("INSERT INTO subs (id, endpoint, p256dh, auth, hh, mm, days, tz, open, skip, next_at, created, updated) VALUES ('x', 'e', 'p', 'a', 1, 2, 3, 'UTC', 'review', 0, 1, 1, 1), ('y', 'e', 'p', 'a', 1, 2, 3, 'UTC', 'review', 0, 1, 1, 1)");
  await createTables(db);
  const n = () => db.db.prepare("SELECT n FROM counts WHERE k = 'subs'").get().n;
  assert.equal(n(), 2, 'counted once, from the rows there');
  await createTables(db);
  assert.equal(n(), 2, 'making the tables again changes nothing');
  db.db.exec("DELETE FROM subs WHERE id = 'x'");
  db.db.exec("DELETE FROM subs WHERE id = 'nobody'");
  assert.equal(n(), 1);
  db.db.exec("INSERT INTO subs (id, endpoint, p256dh, auth, hh, mm, days, tz, open, skip, next_at, created, updated) VALUES ('y', 'e', 'p', 'a', 1, 2, 3, 'UTC', 'review', 0, 1, 1, 1) ON CONFLICT (id) DO UPDATE SET hh = 5");
  assert.equal(n(), 1, 'an update of a known device is not a new row');
  db.db.exec('DELETE FROM subs');
  assert.equal(n(), 0);
});

test('on an empty database the Worker makes its tables before its first query, once per isolate', async () => {
  const env = freshEnv({ VAPID_PUBLIC_KEY: undefined });
  const w = await newIsolate();
  assert.deepEqual(tables(env), []);
  // Requests that need no database leave it alone.
  assert.equal((await call(w, env, request('/v1/health'))).status, 200);
  assert.equal((await call(w, env, request('/v1/subscribe', { method: 'POST', body: '{}' }))).status, 400);
  assert.deepEqual(env.DB.log, []);
  // The first one that needs it makes the tables, in one batch, first.
  const s = newSubscription('https://fcm.googleapis.com/fcm/send/first');
  const r = await call(w, env, request('/v1/subscribe', { method: 'POST', body: subBody(s.sub), headers: { 'CF-Connecting-IP': '192.0.2.1' } }));
  assert.equal(r.status, 200, r.text);
  assert.deepEqual(tables(env), TABLES);
  assert.equal(env.DB.log[0], 'BATCH 8');
  assert.ok(env.DB.log.slice(1, 8).every((q) => q.startsWith('CREATE ')) && env.DB.log[8].startsWith('INSERT INTO counts'));
  // Never again in this isolate: the next minute's cron is the one indexed query.
  const quiet = r.body.next - 60000; // nothing due yet
  env.DB.log.length = 0;
  await w.scheduled({ scheduledTime: quiet }, env);
  assert.equal(env.DB.log.length, 1);
  assert.match(env.DB.log[0], /^SELECT \* FROM \(SELECT .* FROM subs WHERE next_at >= \?3 AND next_at <= \?1/);
  // A new isolate makes sure again (cheap: the tables are there, nothing changes).
  env.DB.log.length = 0;
  const w2 = await newIsolate();
  await w2.scheduled({ scheduledTime: quiet }, env);
  assert.equal(env.DB.log.filter((q) => q.startsWith('CREATE ')).length, 7);
  assert.equal(env.DB.db.prepare('SELECT COUNT(*) AS n FROM subs').get().n, 1, 'the row is still there');
  // Every path that touches the database works on a new, empty one.
  for (const [path, body] of [
    ['/v1/unsubscribe', { endpoint: s.sub.endpoint }],
    ['/v1/active', { endpoint: s.sub.endpoint, day: '2026-11-16' }],
    ['/v1/test', { endpoint: s.sub.endpoint }],
  ]) {
    const e = freshEnv({ DEV: '1' });
    const r2 = await call(await newIsolate(), e, request(path, { method: 'POST', body }));
    assert.ok(r2.status === 200 || r2.status === 404, path + ' ' + r2.text);
    assert.deepEqual(tables(e), TABLES, path);
  }
  const e = freshEnv();
  await (await newIsolate()).scheduled({ scheduledTime: T0 }, e);
  assert.deepEqual(tables(e), TABLES, 'the cron');
});

// ---------- VAPID keys ----------

test('GET /v1/key: with no secrets, a key pair is made once and kept in D1 (meta)', async () => {
  const env = freshEnv();
  const w = await newIsolate();
  const r = await call(w, env, request('/v1/key'));
  assert.equal(r.status, 200);
  assert.deepEqual(Object.keys(r.body).sort(), ['key', 'ok']);
  assert.equal(r.body.ok, true);
  const pub = Buffer.from(r.body.key, 'base64url');
  assert.equal(pub.length, 65, 'the uncompressed P-256 point');
  assert.equal(pub[0], 4);
  assert.match(r.body.key, /^[A-Za-z0-9_-]{87}$/, 'base64url without padding');
  assert.equal(r.headers.get('access-control-allow-origin'), SITE);
  assert.match(r.headers.get('vary'), /Origin/);
  // The stored row: the public key and the private key as a JWK of the same pair.
  const rows = stored(env);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].publicKey, r.body.key);
  const jwk = rows[0].privateKey;
  assert.deepEqual(Object.keys(jwk).sort(), ['crv', 'd', 'kty', 'x', 'y']);
  assert.equal(jwk.x, pub.subarray(1, 33).toString('base64url'));
  assert.equal(jwk.y, pub.subarray(33).toString('base64url'));
  const priv = crypto.createPrivateKey({ key: jwk, format: 'jwk' });
  const sig = crypto.sign('sha256', Buffer.from('x'), priv);
  assert.ok(crypto.verify('sha256', Buffer.from('x'), publicKeyObject(r.body.key), sig), 'the private key belongs to the public key');
  // The same key every time, from the same isolate (no query: cached) and from new ones.
  env.DB.log.length = 0;
  assert.equal((await call(w, env, request('/v1/key'))).body.key, r.body.key);
  assert.deepEqual(env.DB.log, [], 'cached in the isolate');
  assert.equal((await call(await newIsolate(), env, request('/v1/key'))).body.key, r.body.key);
  assert.equal(stored(env).length, 1);
});

test('GET /v1/key: VAPID secrets, when both are set, win; nothing is stored then', async () => {
  const keys = newVapidKeys();
  const env = freshEnv({ VAPID_PUBLIC_KEY: keys.publicKey, VAPID_PRIVATE_KEY: keys.privateKey });
  const r = await call(await newIsolate(), env, request('/v1/key'));
  assert.deepEqual(r.body, { ok: true, key: keys.publicKey });
  assert.deepEqual(env.DB.log, [], 'the database is not touched');
  // Only one of the two set: the stored pair is used.
  const half = freshEnv({ VAPID_PUBLIC_KEY: keys.publicKey });
  const r2 = await call(await newIsolate(), half, request('/v1/key'));
  assert.notEqual(r2.body.key, keys.publicKey);
  assert.equal(stored(half)[0].publicKey, r2.body.key);
});

test('GET /v1/key: CORS as for /v1/health (the site, no Origin, nothing else)', async () => {
  const prod = freshEnv();
  const w = await newIsolate();
  const none = await call(w, prod, request('/v1/key', { origin: null }));
  assert.equal(none.status, 200);
  assert.equal(none.headers.get('access-control-allow-origin'), null);
  for (const origin of ['https://evil.example', 'null', 'http://localhost:8080']) {
    const r = await call(w, prod, request('/v1/key', { origin }));
    assert.deepEqual([r.status, r.body], [403, { ok: false, error: 'origin' }], origin);
    assert.equal(r.headers.get('access-control-allow-origin'), null);
  }
  const pre = await call(w, prod, request('/v1/key', { method: 'OPTIONS', headers: { 'Access-Control-Request-Method': 'GET' } }));
  assert.equal(pre.status, 204);
  assert.equal(pre.headers.get('access-control-allow-methods'), 'GET, POST, OPTIONS');
  const local = await call(w, freshEnv({ DEV: '1' }), request('/v1/key', { origin: 'http://127.0.0.1:5500' }));
  assert.equal(local.headers.get('access-control-allow-origin'), 'http://127.0.0.1:5500', 'DEV: a local site');
  assert.equal((await call(w, prod, request('/v1/key', { method: 'POST', body: '{}' }))).status, 404);
});

test('two isolates making the keys at the same moment: the first one written wins for both', async () => {
  const env = freshEnv();
  const [a, b, c] = [await newIsolate(), await newIsolate(), await newIsolate()];
  const keys = await Promise.all([a, b, c].map((w) => call(w, env, request('/v1/key'))));
  const made = env.DB.log.filter((q) => q.startsWith('INSERT OR IGNORE INTO meta')).length;
  assert.ok(made >= 2, `the isolates really raced (${made} made a pair)`);
  assert.equal(new Set(keys.map((k) => k.body.key)).size, 1, 'all three use the same key');
  assert.equal(stored(env).length, 1);
  assert.equal(stored(env)[0].publicKey, keys[0].body.key);
  // And straight in the store module: two callers, one row, one key.
  const db = fakeD1(SCHEMA_SQL);
  const [k1, k2] = await Promise.all([storedVapidKeys(db), storedVapidKeys(db)]);
  assert.deepEqual(k1, k2);
});

test('the stored keys sign the pushes; the rate-limit key is salted with the stored public key', async () => {
  const env = freshEnv({ DEV: '1' });
  const w = await newIsolate();
  const key = (await call(w, env, request('/v1/key'))).body.key;
  const s = newSubscription('https://fcm.googleapis.com/fcm/send/signed');
  const sub = await call(w, env, request('/v1/subscribe', { method: 'POST', body: subBody(s.sub), headers: { 'CF-Connecting-IP': '203.0.113.9', 'x-now': String(T0) } }));
  assert.equal(sub.status, 200, sub.text);
  const salt = crypto.createHash('sha256').update('203.0.113.9' + key).digest('base64url');
  assert.deepEqual(env.DB.db.prepare('SELECT k FROM rl').all().map((r) => r.k), ['sub:' + salt]);
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(null, { status: 201 });
  };
  const t = await call(w, env, request('/v1/test', { method: 'POST', body: { endpoint: s.sub.endpoint } }));
  assert.deepEqual(t.body, { ok: true, status: 201 });
  await captureLogs(() => w.scheduled({ scheduledTime: sub.body.next }, env));
  assert.equal(calls.length, 2, 'the test and the reminder');
  for (const c of calls) {
    const jwt = verifyVapidHeader(c.init.headers.Authorization, key);
    assert.equal(jwt.claims.aud, 'https://fcm.googleapis.com');
    assert.ok(JSON.parse(decryptPush(c.init.body, s.ecdh, s.auth).plaintext).t);
  }
  // A new isolate signs with the same stored pair.
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(null, { status: 201 });
  };
  await call(await newIsolate(), env, request('/v1/test', { method: 'POST', body: { endpoint: s.sub.endpoint } }));
  verifyVapidHeader(calls[2].init.headers.Authorization, key);
});

test('the private key is never in an answer or a log', async () => {
  const env = freshEnv({ DEV: '1' });
  const w = await newIsolate();
  const out = [];
  const logs = await captureLogs(async () => {
    out.push((await call(w, env, request('/v1/key'))).text);
    const s = newSubscription('https://fcm.googleapis.com/fcm/send/private');
    const r = await call(w, env, request('/v1/subscribe', { method: 'POST', body: subBody(s.sub), headers: { 'x-now': String(T0) } }));
    out.push(r.text);
    globalThis.fetch = async () => new Response(null, { status: 500 });
    out.push((await call(w, env, request('/v1/test', { method: 'POST', body: { endpoint: s.sub.endpoint } }))).text);
    await w.scheduled({ scheduledTime: r.body.next }, env);
    out.push((await call(w, env, request('/v1/health'))).text);
    out.push((await call(w, env, request('/v1/nope'))).text);
    // A damaged row, read by a new isolate: the error is logged without the row.
    env.DB.db.prepare("UPDATE meta SET v = substr(v, 1, length(v) - 3) WHERE k = 'vapid'").run();
    out.push((await call(await newIsolate(), env, request('/v1/key'))).text);
  });
  const d = env.DB.db.prepare("SELECT v FROM meta WHERE k = 'vapid'").get().v.match(/"d":"([A-Za-z0-9_-]{20,})/)[1];
  assert.equal(out.at(-1), JSON.stringify({ ok: false, error: 'server' }), 'a damaged row: a plain server error');
  assert.ok(logs.some((l) => /VAPID keys stored in D1 are damaged/.test(l)), 'and the reason in the log');
  for (const text of [...out, ...logs]) {
    assert.ok(!text.includes(d.slice(0, 20)), 'no part of the private key: ' + text.slice(0, 120));
    assert.ok(!text.includes('"d"'), 'no JWK');
  }
});
