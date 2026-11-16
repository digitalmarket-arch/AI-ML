// End to end: the real Worker in `wrangler dev --local --test-scheduled` (workerd and a local
// D1), driven over HTTP, sending to a fake push service on 127.0.0.1 that decrypts every
// message and checks its VAPID signature.
//
// It starts as a fresh deploy does: an empty local D1 (no schema step) and no VAPID secrets,
// so the Worker makes its own tables and its own key pair, and the test learns the public key
// from GET /v1/key, as the site does.
//
// The test writes .dev.vars (DEV=1 and a small MAX_SUBS) and removes it afterwards, putting
// back any .dev.vars that was there before. It needs no network: the Worker, its D1 and the
// fake push service all run on 127.0.0.1 (wrangler's own optional update check may still try
// npm). It removes CLOUDFLARE_* tokens from wrangler's environment.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import net from 'node:net';
import { newSubscription, decryptPush, verifyVapidHeader, publicKeyObject } from '../helpers.js';
import { nextAt } from '../../src/time.js';
import { reminderMessage, REVIEW_LINES, PLAY_LINES } from '../../src/texts.js';

const require = createRequire(import.meta.url);
const ece = require('http_ece');
const run = promisify(execFile);

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const WRANGLER = path.join(ROOT, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const DEV_VARS = path.join(ROOT, '.dev.vars');
const SITE = 'https://digitalmarket-arch.github.io';
const SUBJECT = 'https://digitalmarket-arch.github.io/AI-ML/';
const ALL = [0, 1, 2, 3, 4, 5, 6];
const HOUR = 3600000;
const DAY = 86400000;
const MAX_SUBS = 12;
const T0 = Date.parse('2026-11-16T04:00:00Z'); // Monday 09:30 in India
const VAPID = { publicKey: '' }; // the Worker makes the pair; GET /v1/key tells the public half

let base; // http://127.0.0.1:PORT of wrangler dev
let child; // the wrangler process
let persistDir;
let devVarsBackup = null;
let logs = '';
const push = makeFakePushService();

// ---------- the fake push service ----------

function makeFakePushService() {
  const devices = new Map();
  const received = [];
  let server;
  const svc = {
    origin: '',
    received,
    async start() {
      server = http.createServer((req, res) => {
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => {
          const name = decodeURIComponent(req.url.replace(/^\/push\//, ''));
          const d = devices.get(name);
          const rec = { name, method: req.method, headers: req.headers, body: Buffer.concat(chunks) };
          try {
            const viaEce = ece.decrypt(rec.body, { version: 'aes128gcm', privateKey: d.ecdh, authSecret: d.auth }).toString();
            const viaNode = decryptPush(rec.body, d.ecdh, d.auth);
            assert.equal(viaNode.plaintext.toString(), viaEce, 'both decryptors agree');
            rec.plain = viaEce;
            rec.header = viaNode;
            rec.message = JSON.parse(viaEce);
            rec.jwt = verifyVapidHeader(req.headers.authorization, VAPID.publicKey);
          } catch (err) {
            rec.error = String(err && err.message);
          }
          received.push(rec);
          res.writeHead(d ? d.status : 404);
          res.end();
        });
      });
      await new Promise((r) => server.listen(0, '127.0.0.1', r));
      svc.origin = `http://127.0.0.1:${server.address().port}`;
    },
    stop() {
      return new Promise((r) => (server ? server.close(r) : r()));
    },
    // A new browser subscription whose endpoint points here.
    device(name, status = 201) {
      const s = newSubscription(`${svc.origin}/push/${name}`);
      devices.set(name, { ...s, status });
      return s;
    },
    setStatus(name, status) {
      devices.get(name).status = status;
    },
    for(name) {
      return received.filter((r) => r.name === name);
    },
  };
  return svc;
}

// ---------- helpers ----------

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.on('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

function wranglerEnv() {
  const env = { ...process.env, WRANGLER_SEND_METRICS: 'false', CLOUDFLARE_CF_FETCH_ENABLED: 'false', NO_COLOR: '1', FORCE_COLOR: '0' };
  for (const k of Object.keys(env)) if (k.startsWith('CLOUDFLARE_API') || k === 'CLOUDFLARE_ACCOUNT_ID') delete env[k];
  return env;
}

async function api(pathname, body, { origin = SITE, ip, now, method = 'POST', headers = {} } = {}) {
  const h = { ...headers };
  if (origin) h.Origin = origin;
  if (ip) h['CF-Connecting-IP'] = ip;
  if (now !== undefined) h['x-now'] = String(now);
  const init = { method, headers: h };
  if (body !== undefined) {
    h['Content-Type'] = 'text/plain;charset=UTF-8';
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const res = await fetch(base + pathname, init);
  const text = await res.text();
  return { status: res.status, headers: res.headers, body: text ? JSON.parse(text) : null };
}

let ipCount = 0;
const freshIp = () => `198.51.100.${(++ipCount % 250) + 1}`;
const known = new Set(); // endpoints that may have a row, removed after each test

async function subscribe(dev, fields = {}, { now = T0, ip = freshIp(), origin } = {}) {
  const body = { sub: dev.sub, time: '19:00', days: ALL, tz: 'Asia/Kolkata', open: 'review', skip: false, active: '', ...fields };
  const r = await api('/v1/subscribe', body, { now, ip, origin });
  if (r.status === 200) known.add(dev.sub.endpoint);
  return r;
}

async function cleanup() {
  for (const endpoint of known) await api('/v1/unsubscribe', { endpoint });
  known.clear();
}

// Runs the Worker's scheduled handler as if the cron fired at `time` (UTC ms), through
// miniflare's trigger route, which wrangler dev enables and which passes the time through.
async function cron(time) {
  const res = await fetch(`${base}/cdn-cgi/local/scheduled?cron=*+*+*+*+*&time=${time}`);
  assert.equal(res.status, 200, 'scheduled handler: ' + (await res.text()));
}

// The --test-scheduled route from the spec. It always runs at the real current time.
async function cronNow() {
  const res = await fetch(`${base}/__scheduled?cron=*+*+*+*+*`);
  assert.deepEqual([res.status, await res.text()], [200, 'Ran scheduled event']);
}

function checkReminder(rec, { open = 'review', time }) {
  assert.equal(rec.error, undefined, rec.error);
  assert.equal(rec.method, 'POST');
  assert.equal(rec.headers.ttl, '3600');
  assert.equal(rec.headers.urgency, 'high');
  assert.equal(rec.headers.topic, 'reminder');
  assert.equal(rec.headers['content-encoding'], 'aes128gcm');
  assert.equal(rec.header.rs, 4096);
  assert.equal(rec.header.idlen, 65);
  assert.equal(rec.header.salt.length, 16);
  assert.ok(Buffer.byteLength(rec.plain) <= 400);
  assert.deepEqual(rec.jwt.header, { typ: 'JWT', alg: 'ES256' });
  assert.equal(rec.jwt.claims.aud, push.origin);
  assert.equal(rec.jwt.claims.sub, SUBJECT);
  const exp = rec.jwt.claims.exp * 1000;
  assert.ok(exp > Date.now() + 11 * HOUR && exp <= Date.now() + 12 * HOUR + 60000, 'exp is about now + 12 h');
  // Every reminder in this file is for Asia/Kolkata, a fixed UTC+5:30, so the learner's day
  // of the year is easy to work out here independently.
  const local = new Date(time + 5.5 * HOUR);
  const y = local.getUTCFullYear();
  const doy = (Date.UTC(y, local.getUTCMonth(), local.getUTCDate()) - Date.UTC(y, 0, 1)) / DAY + 1;
  assert.deepEqual(rec.message, reminderMessage(open, doy));
  assert.ok((open === 'play' ? PLAY_LINES : REVIEW_LINES).includes(rec.message.b));
}

// ---------- start and stop ----------

before(async () => {
  persistDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aimarg-e2e-'));
  if (fs.existsSync(DEV_VARS)) {
    devVarsBackup = DEV_VARS + '.backup-' + process.pid;
    fs.renameSync(DEV_VARS, devVarsBackup);
  }
  fs.writeFileSync(
    DEV_VARS,
    [
      '# written by test/e2e/wrangler.test.js; removed when the test ends',
      'DEV=1',
      `MAX_SUBS=${MAX_SUBS}`,
      '',
    ].join('\n'),
    { mode: 0o600 },
  );

  // No schema step: the Worker makes its tables itself.
  await push.start();

  const port = await freePort();
  const inspector = await freePort();
  base = `http://127.0.0.1:${port}`;
  child = spawn(
    process.execPath,
    [WRANGLER, 'dev', '--local', '--test-scheduled', '--ip', '127.0.0.1', '--port', String(port), '--inspector-port', String(inspector),
      '--persist-to', persistDir, '--show-interactive-dev-session=false'],
    { cwd: ROOT, env: wranglerEnv(), detached: true, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  child.stdout.on('data', (d) => (logs += d));
  child.stderr.on('data', (d) => (logs += d));
  let exited = null;
  child.on('exit', (code) => (exited = code));

  const deadline = Date.now() + 90000;
  for (;;) {
    if (exited !== null) throw new Error('wrangler dev exited early:\n' + logs);
    try {
      const r = await fetch(base + '/v1/health');
      if (r.status === 200) break;
    } catch {
      // not up yet
    }
    if (Date.now() > deadline) throw new Error('wrangler dev did not start in 90 s:\n' + logs);
    await new Promise((r) => setTimeout(r, 300));
  }
  const k = await api('/v1/key', undefined, { method: 'GET', origin: null });
  assert.equal(k.status, 200, 'GET /v1/key: ' + JSON.stringify(k.body));
  VAPID.publicKey = k.body.key;
}, { timeout: 150000 });

// The local D1 as wrangler sees it (read while wrangler dev runs).
async function d1(sql) {
  const { stdout } = await run(process.execPath, [WRANGLER, 'd1', 'execute', 'aimarg-reminders', '--local', '--persist-to', persistDir, '--json', '--command', sql], {
    cwd: ROOT,
    env: wranglerEnv(),
  });
  return JSON.parse(stdout)[0].results;
}

after(async () => {
  if (child && child.exitCode === null) {
    const gone = new Promise((r) => child.once('exit', r));
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      // already gone
    }
    const timer = setTimeout(() => {
      try {
        process.kill(-child.pid, 'SIGKILL');
      } catch {
        // already gone
      }
    }, 5000);
    await gone;
    clearTimeout(timer);
  }
  await push.stop();
  fs.rmSync(DEV_VARS, { force: true });
  if (devVarsBackup) fs.renameSync(devVarsBackup, DEV_VARS);
  if (persistDir) fs.rmSync(persistDir, { recursive: true, force: true });
});

// ---------- tests ----------

test('health, and unknown paths give 404', async () => {
  const h = await api('/v1/health', undefined, { method: 'GET', origin: null });
  assert.deepEqual([h.status, h.body], [200, { ok: true, version: '1' }]);
  const nope = await api('/v1/nope', '{}');
  assert.deepEqual([nope.status, nope.body], [404, { ok: false, error: 'not-found' }]);
  const get = await api('/v1/subscribe', undefined, { method: 'GET' });
  assert.equal(get.status, 404);
});

test('a fresh deploy sets itself up: its own tables and its own VAPID key pair, kept in D1', async () => {
  const pub = Buffer.from(VAPID.publicKey, 'base64url');
  assert.equal(pub.length, 65);
  assert.equal(pub[0], 4);
  publicKeyObject(VAPID.publicKey); // a real P-256 point
  // The same key every time, with or without an Origin; other sites are refused.
  for (const origin of [SITE, null, 'http://localhost:8080']) {
    const r = await api('/v1/key', undefined, { method: 'GET', origin });
    assert.deepEqual([r.status, r.body], [200, { ok: true, key: VAPID.publicKey }], String(origin));
    assert.equal(r.headers.get('access-control-allow-origin'), origin);
  }
  const evil = await api('/v1/key', undefined, { method: 'GET', origin: 'https://evil.example' });
  assert.deepEqual([evil.status, evil.body], [403, { ok: false, error: 'origin' }]);
  const names = (await d1("SELECT type, name FROM sqlite_master WHERE name IN ('subs', 'rl', 'meta', 'counts', 'subs_due', 'subs_added', 'subs_removed') ORDER BY name")).map((r) => r.type + ' ' + r.name);
  assert.deepEqual(names, ['table counts', 'table meta', 'table rl', 'table subs', 'trigger subs_added', 'index subs_due', 'trigger subs_removed']);
  assert.deepEqual(await d1('SELECT k, n FROM counts'), [{ k: 'subs', n: 0 }], 'the kept count of rows starts at 0');
  const meta = await d1('SELECT k, v FROM meta');
  assert.equal(meta.length, 1);
  assert.equal(meta[0].k, 'vapid');
  const v = JSON.parse(meta[0].v);
  assert.equal(v.publicKey, VAPID.publicKey);
  assert.equal(v.privateKey.kty, 'EC');
  assert.equal(v.privateKey.crv, 'P-256');
  VAPID.privateD = v.privateKey.d; // for the log check at the end
});

test('CORS: the site and (in DEV) localhost are allowed; other origins get 403', async () => {
  const pre = await api('/v1/subscribe', undefined, { method: 'OPTIONS', headers: { 'Access-Control-Request-Method': 'POST' } });
  assert.equal(pre.status, 204);
  assert.equal(pre.headers.get('access-control-allow-origin'), SITE);
  assert.match(pre.headers.get('vary'), /Origin/);
  assert.equal(pre.headers.get('access-control-allow-methods'), 'GET, POST, OPTIONS');
  assert.equal(pre.headers.get('access-control-allow-headers'), 'Content-Type');
  assert.equal(pre.headers.get('access-control-max-age'), '86400');
  const local = await api('/v1/health', undefined, { method: 'GET', origin: 'http://localhost:8080' });
  assert.equal(local.headers.get('access-control-allow-origin'), 'http://localhost:8080');

  const dev = push.device('cors-evil');
  for (const origin of ['https://evil.example', 'null', 'https://digitalmarket-arch.github.io.evil.example']) {
    const r = await subscribe(dev, {}, { origin });
    assert.deepEqual([r.status, r.body], [403, { ok: false, error: 'origin' }], origin);
    assert.equal(r.headers.get('access-control-allow-origin'), null);
    const p = await api('/v1/subscribe', undefined, { method: 'OPTIONS', origin });
    assert.equal(p.status, 403);
  }
  assert.equal((await api('/v1/test', { endpoint: dev.sub.endpoint })).status, 404, 'no row was made');
  const ok = await subscribe(dev, {});
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get('access-control-allow-origin'), SITE);
  assert.match(ok.headers.get('vary'), /Origin/);
  await cleanup();
});

test('validation errors', async () => {
  const dev = push.device('valid');
  const cases = [
    [{ ...dev.sub, keys: { ...dev.sub.keys, p256dh: 'abc' } }, {}, 'bad-sub'],
    [{ ...dev.sub, keys: { ...dev.sub.keys, auth: 'AAAA' } }, {}, 'bad-sub'],
    [{ ...dev.sub, endpoint: 'https://push.example.com/x' }, {}, 'bad-host'],
    [dev.sub, { time: '24:00' }, 'bad-time'],
    [dev.sub, { days: [1, 1] }, 'bad-days'],
    [dev.sub, { days: [7] }, 'bad-days'],
    [dev.sub, { tz: 'Mars/Olympus' }, 'bad-tz'],
    [dev.sub, { open: 'learn' }, 'bad-open'],
  ];
  for (const [sub, fields, error] of cases) {
    const r = await subscribe({ sub }, fields);
    assert.deepEqual([r.status, r.body], [400, { ok: false, error }], error);
  }
  const bad = await api('/v1/subscribe', 'this is not json');
  assert.deepEqual([bad.status, bad.body], [400, { ok: false, error: 'bad-json' }]);
  const big = await api('/v1/subscribe', 'x'.repeat(5000));
  assert.deepEqual([big.status, big.body], [413, { ok: false, error: 'too-big' }]);
  assert.equal((await api('/v1/test', { endpoint: dev.sub.endpoint })).status, 404, 'nothing was stored');
});

test('the Worker (workerd Intl) agrees with the time maths, DST zones included', async () => {
  const cases = [
    ['Asia/Kolkata', '19:00', T0],
    ['Asia/Kathmandu', '19:00', T0],
    ['America/New_York', '02:30', Date.parse('2026-03-07T12:00:00Z')], // spring-forward gap
    ['America/New_York', '01:30', Date.parse('2026-10-31T12:00:00Z')], // fall-back repeat
    ['Europe/London', '01:30', Date.parse('2026-03-28T12:00:00Z')],
    ['Australia/Lord_Howe', '02:15', Date.parse('2026-10-03T10:00:00Z')],
    ['Australia/Lord_Howe', '01:45', Date.parse('2026-04-04T10:00:00Z')],
  ];
  for (const [tz, time, now] of cases) {
    const dev = push.device('tz-' + tz + time);
    const r = await subscribe(dev, { tz, time }, { now });
    assert.equal(r.status, 200);
    const [hh, mm] = time.split(':').map(Number);
    assert.equal(new Date(r.body.next).toISOString(), new Date(nextAt(now, tz, hh, mm, ALL)).toISOString(), `${tz} ${time}`);
  }
  assert.equal(
    (await subscribe(push.device('tz-check'), { tz: 'America/New_York', time: '02:30' }, { now: Date.parse('2026-03-07T12:00:00Z') })).body.next,
    Date.parse('2026-03-08T07:00:00Z'),
  );
  await cleanup();
});

test('/__scheduled sends exactly one encrypted, signed reminder for a due row; one that is days late is skipped', async () => {
  // /__scheduled runs at the real time, so make the rows due by subscribing with a faked "now"
  // (DEV-only x-now): one for a time 30 minutes ago (due, and on time enough to send), and one
  // eight days ago (its time passed days ago: sending it now would come at the wrong time of day).
  const due = Math.floor((Date.now() - 30 * 60000) / 60000) * 60000;
  const local = new Date(due + 5.5 * HOUR); // India is UTC+5:30 all year
  const hhmm = String(local.getUTCHours()).padStart(2, '0') + ':' + String(local.getUTCMinutes()).padStart(2, '0');
  const dev = push.device('due-now');
  const r = await subscribe(dev, { time: hhmm }, { now: due - 10 * 60000 });
  assert.equal(r.status, 200);
  assert.equal(r.body.next, due);
  const old = push.device('days-late');
  const o = await subscribe(old, { time: '06:00' }, { now: Date.now() - 8 * DAY });
  assert.ok(o.body.next < Date.now() - 6 * DAY);
  await cronNow();
  const got = push.for('due-now');
  assert.equal(got.length, 1, 'exactly one message');
  checkReminder(got[0], { open: 'review', time: due });
  assert.equal(push.for('days-late').length, 0, 'days late: not sent');
  const rows = await d1(`SELECT endpoint, next_at, fails FROM subs WHERE endpoint IN ('${dev.sub.endpoint}', '${old.sub.endpoint}')`);
  assert.equal(rows.length, 2);
  for (const row of rows) assert.ok(row.next_at > Date.now() && row.fails === 0, 'both moved on to their next time');
  await cronNow();
  assert.equal(push.for('due-now').length, 1, 'its next time moved on: no second message');
  await new Promise((res) => setTimeout(res, 300));
  assert.match(logs, /\{"due":2,"sent":1,"skipped":0,"gone":0,"failed":0,"late":1\}/);
  await cleanup();
});

test('subscribe, then the cron sends exactly one encrypted, signed reminder', async () => {
  const dev = push.device('a');
  const r = await subscribe(dev, { skip: true });
  assert.equal(r.status, 200);
  const next = r.body.next;
  assert.equal(next, Date.parse('2026-11-16T13:30:00Z'), '19:00 in India');

  await cron(next - 60000);
  assert.equal(push.for('a').length, 0, 'not due a minute early');
  await cron(next);
  const got = push.for('a');
  assert.equal(got.length, 1, 'exactly one message');
  checkReminder(got[0], { open: 'review', time: next });

  await cron(next);
  await cron(next + 60000);
  assert.equal(push.for('a').length, 1, 'a retried or later run does not send again');

  await cron(next + DAY);
  const two = push.for('a');
  assert.equal(two.length, 2, 'tomorrow, the next one');
  checkReminder(two[1], { open: 'review', time: next + DAY });
  assert.notDeepEqual(two[1].header.keyid, two[0].header.keyid, 'a new ephemeral key per message');
  assert.notDeepEqual(two[1].header.salt, two[0].header.salt, 'a new salt per message');
  await cleanup();
});

test('open=play reminders open Play', async () => {
  const dev = push.device('player');
  const r = await subscribe(dev, { open: 'play', days: [1], time: '20:45' });
  await cron(r.body.next);
  assert.equal(push.for('player').length, 1);
  checkReminder(push.for('player')[0], { open: 'play', time: r.body.next });
  assert.equal(push.for('player')[0].message.u, './#play');
  await cleanup();
});

test('skip: nothing is sent on a day the learner already studied', async () => {
  const viaActive = push.device('studied');
  const viaBody = push.device('studied-body');
  const noSkip = push.device('no-skip');
  const r = await subscribe(viaActive, { skip: true });
  await subscribe(viaBody, { skip: true, active: '2026-11-16' });
  await subscribe(noSkip, { skip: false, active: '2026-11-16' });
  const act = await api('/v1/active', { endpoint: viaActive.sub.endpoint, day: '2026-11-16' });
  assert.deepEqual([act.status, act.body], [200, { ok: true }]);
  await cron(r.body.next);
  assert.equal(push.for('studied').length, 0);
  assert.equal(push.for('studied-body').length, 0);
  assert.equal(push.for('no-skip').length, 1, 'skip off: sent anyway');
  await cron(r.body.next);
  assert.equal(push.for('studied').length, 0, 'still nothing on a retry');
  await cron(r.body.next + DAY);
  assert.equal(push.for('studied').length, 1, 'the next day it is sent');
  assert.equal(push.for('studied-body').length, 1);
  const unknown = await api('/v1/active', { endpoint: 'https://fcm.googleapis.com/fcm/send/nobody', day: '2026-11-16' });
  assert.deepEqual([unknown.status, unknown.body], [200, { ok: true }]);
  await cleanup();
});

test('a 410 from the push service deletes the row', async () => {
  const dev = push.device('gone', 410);
  const r = await subscribe(dev);
  await cron(r.body.next);
  assert.equal(push.for('gone').length, 1);
  const t = await api('/v1/test', { endpoint: dev.sub.endpoint });
  assert.deepEqual([t.status, t.body], [404, { ok: false, error: 'not-found' }]);
  await cron(r.body.next + DAY);
  assert.equal(push.for('gone').length, 1, 'never tried again');
  await cleanup();
});

test('/v1/test sends a test notification now; limits and errors', async () => {
  const dev = push.device('tester');
  await subscribe(dev);
  const t1 = await api('/v1/test', { endpoint: dev.sub.endpoint }, { now: T0 });
  assert.deepEqual([t1.status, t1.body], [200, { ok: true, status: 201 }]);
  const rec = push.for('tester')[0];
  assert.equal(rec.error, undefined, rec.error);
  assert.equal(rec.headers.ttl, '300');
  assert.equal(rec.headers.topic, 'test');
  assert.equal(rec.headers.urgency, 'high');
  assert.equal(rec.headers['content-encoding'], 'aes128gcm');
  assert.deepEqual(rec.message, { t: 'AI Marg', b: 'Test reminder: notifications work on this device.', u: './#reminders', tag: 'aimarg-test' });
  for (let i = 2; i <= 5; i++) assert.equal((await api('/v1/test', { endpoint: dev.sub.endpoint }, { now: T0 + i * 1000 })).status, 200);
  const slow = await api('/v1/test', { endpoint: dev.sub.endpoint }, { now: T0 + 10000 });
  assert.deepEqual([slow.status, slow.body], [429, { ok: false, error: 'slow-down' }]);
  assert.equal(push.for('tester').length, 5);
  assert.equal((await api('/v1/test', { endpoint: dev.sub.endpoint }, { now: T0 + HOUR })).status, 200, 'a new hour');

  const unknown = await api('/v1/test', { endpoint: `${push.origin}/push/never` });
  assert.deepEqual([unknown.status, unknown.body], [404, { ok: false, error: 'not-found' }]);
  const broken = push.device('broken', 500);
  await subscribe(broken);
  const b = await api('/v1/test', { endpoint: broken.sub.endpoint });
  assert.deepEqual([b.status, b.body], [502, { ok: false, error: 'push-failed', status: 500 }]);
  const lost = push.device('lost', 404);
  await subscribe(lost);
  const l = await api('/v1/test', { endpoint: lost.sub.endpoint });
  assert.deepEqual([l.status, l.body], [410, { ok: false, error: 'gone' }]);
  assert.equal((await api('/v1/test', { endpoint: lost.sub.endpoint })).status, 404, 'deleted');
  assert.deepEqual((await api('/v1/test', 'not json')).body, { ok: false, error: 'bad-json' });
  await cleanup();
});

test('failures: deleted after 10 in a row; a success resets the count', async () => {
  const dev = push.device('flaky', 500);
  const r = await subscribe(dev);
  for (let k = 0; k < 9; k++) await cron(r.body.next + k * DAY);
  assert.equal(push.for('flaky').length, 9);
  push.setStatus('flaky', 201);
  await cron(r.body.next + 9 * DAY);
  push.setStatus('flaky', 503);
  for (let k = 10; k < 19; k++) await cron(r.body.next + k * DAY);
  assert.equal(push.for('flaky').length, 19, 'still there after 9 more failures');
  await cron(r.body.next + 19 * DAY);
  assert.equal(push.for('flaky').length, 20);
  await cron(r.body.next + 20 * DAY);
  assert.equal(push.for('flaky').length, 20, 'deleted after the 10th failure in a row');
  await cleanup();
});

test('rate limit: more than 20 subscribes in an hour from one IP gets 429', async () => {
  const dev = push.device('rate');
  for (let i = 1; i <= 20; i++) {
    assert.equal((await subscribe(dev, {}, { ip: '203.0.113.7', now: T0 + i * 1000 })).status, 200, `subscribe ${i}`);
  }
  const blocked = await subscribe(dev, {}, { ip: '203.0.113.7', now: T0 + 30 * 60000 });
  assert.deepEqual([blocked.status, blocked.body], [429, { ok: false, error: 'slow-down' }]);
  assert.equal((await subscribe(dev, {}, { ip: '203.0.113.8', now: T0 + 30 * 60000 })).status, 200, 'another IP');
  assert.equal((await subscribe(dev, {}, { ip: '203.0.113.7', now: T0 + HOUR + 1000 })).status, 200, 'an hour later');
  await cleanup();
});

test('rate limit: IPv6 addresses count by their /64 network, so a new address each time does not help', async () => {
  const dev = push.device('rate6');
  for (let i = 1; i <= 20; i++) {
    assert.equal((await subscribe(dev, {}, { ip: `2001:db8:77:1::${i.toString(16)}`, now: T0 + i * 1000 })).status, 200, `subscribe ${i}`);
  }
  const blocked = await subscribe(dev, {}, { ip: '2001:db8:77:1:ffff:1:2:3', now: T0 + 30 * 60000 });
  assert.deepEqual([blocked.status, blocked.body], [429, { ok: false, error: 'slow-down' }]);
  assert.equal((await subscribe(dev, {}, { ip: '2001:db8:77:2::1', now: T0 + 30 * 60000 })).status, 200, 'another /64');
  await cleanup();
});

test('unsubscribe deletes the row and always answers ok', async () => {
  const dev = push.device('leaver');
  const r = await subscribe(dev);
  const u = await api('/v1/unsubscribe', { endpoint: dev.sub.endpoint });
  assert.deepEqual([u.status, u.body], [200, { ok: true }]);
  await cron(r.body.next);
  assert.equal(push.for('leaver').length, 0);
  assert.equal((await api('/v1/test', { endpoint: dev.sub.endpoint })).status, 404);
  assert.deepEqual((await api('/v1/unsubscribe', { endpoint: dev.sub.endpoint })).body, { ok: true });
  assert.deepEqual((await api('/v1/unsubscribe', 'garbage')).body, { ok: true });
  known.delete(dev.sub.endpoint);
});

test(`MAX_SUBS (${MAX_SUBS} here): a new device gets 503 full; known ones still save`, async () => {
  const devs = [];
  for (let i = 0; i < MAX_SUBS; i++) {
    const d = push.device('fill' + i);
    devs.push(d);
    assert.equal((await subscribe(d)).status, 200, `row ${i + 1}`);
  }
  const extra = push.device('one-too-many');
  const full = await subscribe(extra);
  assert.deepEqual([full.status, full.body], [503, { ok: false, error: 'full' }]);
  assert.equal((await subscribe(devs[0], { time: '08:00' })).status, 200, 'an existing device can still change its time');
  await api('/v1/unsubscribe', { endpoint: devs[1].sub.endpoint });
  assert.equal((await subscribe(extra)).status, 200, 'room again');
  const [{ n }] = await d1("SELECT n FROM counts WHERE k = 'subs'");
  const [{ c }] = await d1('SELECT COUNT(*) AS c FROM subs');
  assert.deepEqual([n, c], [MAX_SUBS, MAX_SUBS], 'the kept count matches the table');
  await cleanup();
});

test('logs hold counts only: no endpoints, keys (private key included) or IP addresses', async () => {
  await new Promise((r) => setTimeout(r, 300)); // let the last log lines arrive
  assert.match(logs, /\{"due":1,"sent":1,"skipped":0,"gone":0,"failed":0,"late":0\}/, 'counts are logged. Log tail:\n' + logs.slice(-3000));
  assert.ok(!logs.includes('/push/'), 'no push endpoint in the logs');
  assert.ok(!logs.includes('198.51.100.') && !logs.includes('203.0.113.') && !logs.includes('2001:db8'), 'no client IP in the logs');
  for (const r of push.received.slice(0, 5)) assert.ok(!logs.includes(r.headers.authorization.slice(8, 60)));
  assert.ok(VAPID.privateD && !logs.includes(VAPID.privateD.slice(0, 16)), 'no part of the private key in the logs');
});
