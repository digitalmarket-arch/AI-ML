import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSubscribe, checkEndpoint, isDay, addressGroup } from '../../src/validate.js';
import { newSubscription } from '../helpers.js';

const FCM = 'https://fcm.googleapis.com/fcm/send/dGVzdA:APA91bH-example';
// The name this runtime's Intl gives India's zone (today "Asia/Calcutta", whichever spelling it is given).
const KOLKATA = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata' }).resolvedOptions().timeZone;

function body(over = {}) {
  const s = newSubscription(FCM);
  return {
    sub: s.sub,
    time: '19:00',
    days: [0, 1, 2, 3, 4, 5, 6],
    tz: 'Asia/Kolkata',
    open: 'review',
    skip: true,
    active: '',
    ...over,
  };
}

async function errorOf(b, dev = false) {
  const r = await validateSubscribe(b, dev);
  return r.error || 'ok';
}

test('a good body passes and becomes a row', async () => {
  const b = body({ days: [1, 3, 5], time: '07:05', open: 'play', active: '2026-11-13' });
  const r = await validateSubscribe(b, false);
  assert.equal(r.error, undefined);
  assert.deepEqual(r.value, {
    endpoint: FCM,
    p256dh: b.sub.keys.p256dh,
    auth: b.sub.keys.auth,
    hh: 7,
    mm: 5,
    days: 0b0101010,
    tz: KOLKATA,
    open: 'play',
    skip: 1,
    active: '2026-11-13',
  });
});

test('bad-json: not an object', async () => {
  for (const b of [null, [], 'x', 3]) assert.equal(await errorOf(b), 'bad-json');
});

test('bad-sub: missing or malformed subscription and keys', async () => {
  const good = body();
  const k = good.sub.keys;
  const cases = {
    'no sub': { ...good, sub: undefined },
    'sub is a string': { ...good, sub: 'x' },
    'sub is an array': { ...good, sub: [] },
    'endpoint missing': { ...good, sub: { keys: k } },
    'endpoint not a string': { ...good, sub: { endpoint: 5, keys: k } },
    'endpoint not a URL': { ...good, sub: { endpoint: 'not a url', keys: k } },
    'endpoint over 1024 chars': { ...good, sub: { endpoint: FCM + 'x'.repeat(1025 - FCM.length), keys: k } },
    'http endpoint': { ...good, sub: { endpoint: FCM.replace('https', 'http'), keys: k } },
    'credentials in URL': { ...good, sub: { endpoint: 'https://u:p@fcm.googleapis.com/fcm/send/x', keys: k } },
    'no keys': { ...good, sub: { endpoint: FCM } },
    'p256dh missing': { ...good, sub: { endpoint: FCM, keys: { auth: k.auth } } },
    'p256dh too short': { ...good, sub: { endpoint: FCM, keys: { p256dh: k.p256dh.slice(0, 43), auth: k.auth } } },
    'p256dh compressed (33 bytes)': {
      ...good,
      sub: { endpoint: FCM, keys: { p256dh: Buffer.alloc(33, 2).toString('base64url'), auth: k.auth } },
    },
    'p256dh not starting 0x04': {
      ...good,
      sub: { endpoint: FCM, keys: { p256dh: Buffer.concat([Buffer.from([5]), Buffer.from(k.p256dh, 'base64url').subarray(1)]).toString('base64url'), auth: k.auth } },
    },
    'p256dh off the curve': {
      ...good,
      sub: { endpoint: FCM, keys: { p256dh: Buffer.concat([Buffer.from([4]), Buffer.alloc(64, 1)]).toString('base64url'), auth: k.auth } },
    },
    'p256dh standard base64 (+ and /)': {
      ...good,
      sub: { endpoint: FCM, keys: { p256dh: k.p256dh.replace(/-/g, '+').replace(/_/g, '/') + (/[-_]/.test(k.p256dh) ? '' : '+'), auth: k.auth } },
    },
    'auth missing': { ...good, sub: { endpoint: FCM, keys: { p256dh: k.p256dh } } },
    'auth 12 bytes': { ...good, sub: { endpoint: FCM, keys: { p256dh: k.p256dh, auth: Buffer.alloc(12).toString('base64url') } } },
    'auth 17 bytes': { ...good, sub: { endpoint: FCM, keys: { p256dh: k.p256dh, auth: Buffer.alloc(17).toString('base64url') } } },
  };
  for (const [name, b] of Object.entries(cases)) assert.equal(await errorOf(b), 'bad-sub', name);
});

test('push host allowlist', () => {
  const ok = [
    'https://fcm.googleapis.com/fcm/send/abc',
    'https://updates.push.services.mozilla.com/wpush/v2/abc',
    'https://push.services.mozilla.com/abc',
    'https://web.push.apple.com/QGx',
    'https://api.push.apple.com/3/device/x',
    'https://wns2-pn1p.notify.windows.com/w/?token=abc',
  ];
  for (const e of ok) assert.equal(checkEndpoint(e, false), 'ok', e);
  const host = [
    'https://example.com/push',
    'https://fcm.googleapis.com.evil.com/x',
    'https://evilpush.apple.com/x',
    'https://push.apple.com/x',
    'https://notify.windows.com/x',
    'https://fcm.googleapis.com:8443/fcm/send/x',
    'https://127.0.0.1:9000/push',
  ];
  for (const e of host) assert.equal(checkEndpoint(e, false), 'bad-host', e);
  assert.equal(checkEndpoint('http://127.0.0.1:9000/push', false), 'bad-sub', 'http only in DEV');
  assert.equal(checkEndpoint('ftp://fcm.googleapis.com/x', false), 'bad-sub');
});

test('DEV allows the local fake push service and nothing else extra', () => {
  assert.equal(checkEndpoint('http://127.0.0.1:9000/push/a', true), 'ok');
  assert.equal(checkEndpoint('http://localhost:9000/push/a', true), 'ok');
  assert.equal(checkEndpoint('http://127.0.0.1/push/a', true), 'bad-sub', 'a port is required');
  assert.equal(checkEndpoint('http://example.com:9000/push', true), 'bad-sub');
  assert.equal(checkEndpoint('https://example.com/push', true), 'bad-host');
  assert.equal(checkEndpoint('https://fcm.googleapis.com/fcm/send/abc', true), 'ok');
});

test('bad-host comes back for a well-formed subscription on an unknown host', async () => {
  const s = newSubscription('https://push.example.com/abc');
  assert.equal(await errorOf(body({ sub: s.sub })), 'bad-host');
});

test('bad-time', async () => {
  for (const t of ['00:00', '23:59', '07:30']) assert.equal(await errorOf(body({ time: t })), 'ok', t);
  for (const t of ['24:00', '23:60', '7:00', '19:00:00', '19-00', '', 1900, null, undefined, ' 19:00']) {
    assert.equal(await errorOf(body({ time: t })), 'bad-time', String(t));
  }
});

test('bad-days: 1 to 7 unique integers 0 to 6', async () => {
  for (const d of [[0], [6], [1, 3, 5], [6, 5, 4, 3, 2, 1, 0]]) assert.equal(await errorOf(body({ days: d })), 'ok', JSON.stringify(d));
  for (const d of [[], [7], [-1], [1, 1], [1.5], ['1'], [0, 1, 2, 3, 4, 5, 6, 0], 'all', null, undefined, {}]) {
    assert.equal(await errorOf(body({ days: d })), 'bad-days', JSON.stringify(d));
  }
});

test('bad-tz: a real IANA zone, at most 64 characters', async () => {
  for (const tz of ['Asia/Kolkata', 'Asia/Kathmandu', 'America/New_York', 'Australia/Lord_Howe', 'UTC']) {
    assert.equal(await errorOf(body({ tz })), 'ok', tz);
  }
  for (const tz of ['Mars/Olympus', '', 'x'.repeat(65), 5, null, undefined]) {
    assert.equal(await errorOf(body({ tz })), 'bad-tz', String(tz));
  }
});

test('tz is stored under the zone\'s own name, whatever its letter case', async () => {
  for (const tz of ['Asia/Kolkata', 'Asia/Calcutta', 'asia/kolkata', 'ASIA/KOLKATA', 'aSiA/kOlKaTa']) {
    assert.equal((await validateSubscribe(body({ tz }), false)).value.tz, KOLKATA, tz);
  }
  assert.equal((await validateSubscribe(body({ tz: 'utc' }), false)).value.tz, 'UTC');
  assert.equal((await validateSubscribe(body({ tz: 'america/new_york' }), false)).value.tz, 'America/New_York');
});

test('addressGroup: IPv4 as it is; IPv6 by its /64 network, however it is written', () => {
  const cases = [
    ['203.0.113.7', '203.0.113.7'],
    ['', ''],
    [undefined, ''],
    ['2001:db8:1:2::1', '2001:db8:1:2::/64'],
    ['2001:DB8:1:2:FFFF:FFFF:FFFF:FFFF', '2001:db8:1:2::/64'],
    ['2001:0db8:0001:0002:0000:0000:0000:0009', '2001:db8:1:2::/64'],
    ['2001:db8:1:2:3:4:5:6', '2001:db8:1:2::/64'],
    ['2001:db8::1', '2001:db8:0:0::/64'],
    ['2001:db8:1:3::1', '2001:db8:1:3::/64'],
    ['2409:40c2:1234:5678::abcd', '2409:40c2:1234:5678::/64'],
    ['2001:db8:1:2::1.2.3.4', '2001:db8:1:2::/64'],
    ['::ffff:203.0.113.7', '203.0.113.7'],
    ['0:0:0:0:0:ffff:cb00:7107', '203.0.113.7'],
    ['fe80::1%eth0', 'fe80:0:0:0::/64'],
    ['::1', '0:0:0:0::/64'],
    // not addresses: used as they are (still only ever hashed)
    ['1:2:3:4:5:6:7:8:9', '1:2:3:4:5:6:7:8:9'],
    ['1::2::3', '1::2::3'],
    ['zz::1', 'zz::1'],
  ];
  for (const [ip, want] of cases) assert.equal(addressGroup(ip), want, String(ip));
});

test('bad-open', async () => {
  assert.equal(await errorOf(body({ open: 'play' })), 'ok');
  for (const open of ['Review', 'learn', '', null, undefined]) assert.equal(await errorOf(body({ open })), 'bad-open', String(open));
});

test('the errors come in the order of the contract', async () => {
  const s = newSubscription('https://push.example.com/abc');
  assert.equal(await errorOf(body({ sub: s.sub, time: 'x', days: [], tz: 'x', open: 'x' })), 'bad-host');
  assert.equal(await errorOf(body({ time: 'x', days: [], tz: 'x', open: 'x' })), 'bad-time');
  assert.equal(await errorOf(body({ days: [], tz: 'x', open: 'x' })), 'bad-days');
  assert.equal(await errorOf(body({ tz: 'x', open: 'x' })), 'bad-tz');
});

test('skip and active are read leniently', async () => {
  const v = async (over) => (await validateSubscribe(body(over), false)).value;
  assert.equal((await v({ skip: true })).skip, 1);
  assert.equal((await v({ skip: false })).skip, 0);
  assert.equal((await v({ skip: 'yes' })).skip, 0);
  assert.equal((await v({ skip: undefined })).skip, 0);
  assert.equal((await v({ active: '2026-11-13' })).active, '2026-11-13');
  assert.equal((await v({ active: '2026-13-01' })).active, '');
  assert.equal((await v({ active: 'today' })).active, '');
  assert.equal((await v({ active: undefined })).active, '');
  assert.ok(isDay('2026-02-28') && !isDay('2026-2-28') && !isDay(20261113));
});
