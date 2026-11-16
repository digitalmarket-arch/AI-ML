import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import * as webPushLib from 'web-push';
import {
  encryptPayload,
  importEcdhKeyPair,
  importVapidKeys,
  vapidAuthorization,
  vapidJwt,
  clearJwtCache,
  buildPushRequest,
  sendPush,
  b64urlDecode,
  b64urlEncode,
  isValidP256Point,
  MAX_PLAINTEXT,
  JWT_LIFETIME_S,
} from '../../src/webpush.js';
import { newSubscription, newVapidKeys, decryptPush, verifyVapidHeader } from '../helpers.js';

const require = createRequire(import.meta.url);
const ece = require('http_ece');
const hex = (s) => new Uint8Array(Buffer.from(s, 'hex'));

function eceDecrypt(body, s) {
  return ece.decrypt(Buffer.from(body), { version: 'aes128gcm', privateKey: s.ecdh, authSecret: s.auth });
}

beforeEach(() => clearJwtCache());

test('RFC 8291 Appendix A: the example message comes out byte for byte', async () => {
  // Values from RFC 8291 Appendix A (as reproduced in the tests of Mozilla's "ece" crate).
  const asKeyPair = await importEcdhKeyPair(
    hex('04fe33f4ab0dea71914db55823f73b54948f41306d920732dbb9a59a53286482200e597a7b7bc260ba1c227998580992e93973002f3012a28ae8f06bbb78e5ec0f'),
    hex('c9f58f89813e9f8e872e71f42aa64e1757c9254dcc62b72ddc010bb4043ea11c'),
  );
  const out = await encryptPayload(
    'When I grow up, I want to be a watermelon',
    hex('042571b2becdfde360551aaf1ed0f4cd366c11cebe555f89bcb7b186a53339173168ece2ebe018597bd30479b86e3c8f8eced577ca59187e9246990db682008b0e'),
    hex('05305932a1c7eabe13b6cec9fda48882'),
    { salt: hex('0c6bfaadad67958803092d454676f397'), asKeyPair },
  );
  assert.equal(
    Buffer.from(out).toString('base64url'),
    'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN',
  );
  // And the receiving side of the same example decrypts it with Node crypto.
  const ua = crypto.createECDH('prime256v1');
  ua.setPrivateKey(Buffer.from('ab5757a70dd4a53e553a6bbf71ffefea2874ec07a6b379e3c48f895a02dc33de', 'hex'));
  const got = decryptPush(out, ua, Buffer.from('05305932a1c7eabe13b6cec9fda48882', 'hex'));
  assert.equal(got.plaintext.toString(), 'When I grow up, I want to be a watermelon');
});

test('http_ece (an independent implementation) decrypts every size we may send', async () => {
  for (const size of [0, 1, 15, 16, 17, 100, 399, 400, 1000, MAX_PLAINTEXT]) {
    const s = newSubscription('https://fcm.googleapis.com/fcm/send/x');
    const plain = crypto.randomBytes(size);
    const body = await encryptPayload(plain, s.sub.keys.p256dh, s.sub.keys.auth);
    assert.equal(body.length, 86 + size + 1 + 16, 'header + plaintext + delimiter + tag');
    assert.deepEqual(eceDecrypt(body, s), plain, `size ${size}`);
  }
});

test('Node crypto (ECDH + HKDF + AES-128-GCM, written in the test) decrypts it too', async () => {
  const s = newSubscription('https://fcm.googleapis.com/fcm/send/x');
  const json = JSON.stringify({ t: 'AI Marg study time', b: 'Your review cards are ready when you are.', u: './#review', tag: 'aimarg-reminder' });
  const body = await encryptPayload(json, s.sub.keys.p256dh, s.sub.keys.auth);
  const got = decryptPush(body, s.ecdh, s.auth);
  assert.equal(got.plaintext.toString(), json);
  assert.equal(got.rs, 4096);
  assert.equal(got.idlen, 65);
});

test('header: random 16-byte salt, rs 4096, a new ephemeral key for every message', async () => {
  const s = newSubscription('https://fcm.googleapis.com/fcm/send/x');
  const seenSalts = new Set();
  const seenKeys = new Set();
  for (let i = 0; i < 20; i++) {
    const body = Buffer.from(await encryptPayload('hello', s.sub.keys.p256dh, s.sub.keys.auth));
    assert.equal(body.readUInt32BE(16), 4096, 'rs');
    assert.equal(body[20], 65, 'keyid length: the sender public key');
    const keyid = body.subarray(21, 86);
    assert.equal(keyid[0], 4, 'uncompressed point');
    assert.ok(await isValidP256Point(new Uint8Array(keyid)), 'keyid is a point on P-256');
    assert.notDeepEqual(keyid, Buffer.from(s.sub.keys.p256dh, 'base64url'));
    seenSalts.add(body.subarray(0, 16).toString('hex'));
    seenKeys.add(keyid.toString('hex'));
  }
  assert.equal(seenSalts.size, 20);
  assert.equal(seenKeys.size, 20);
});

test('same bytes as http_ece.encrypt given the same ephemeral key and salt', async () => {
  const s = newSubscription('https://fcm.googleapis.com/fcm/send/x');
  const local = crypto.createECDH('prime256v1');
  local.generateKeys();
  const salt = crypto.randomBytes(16);
  const plain = Buffer.from('{"t":"AI Marg","b":"Test reminder: notifications work on this device."}');
  const theirs = ece.encrypt(plain, {
    version: 'aes128gcm',
    dh: s.sub.keys.p256dh,
    privateKey: local,
    salt,
    authSecret: s.sub.keys.auth,
    rs: 4096,
  });
  const asKeyPair = await importEcdhKeyPair(new Uint8Array(local.getPublicKey()), new Uint8Array(local.getPrivateKey()));
  const ours = await encryptPayload(plain, s.sub.keys.p256dh, s.sub.keys.auth, { salt: new Uint8Array(salt), asKeyPair });
  assert.equal(Buffer.from(ours).toString('hex'), theirs.toString('hex'));
});

test('a damaged message does not decrypt', async () => {
  const s = newSubscription('https://fcm.googleapis.com/fcm/send/x');
  const body = Buffer.from(await encryptPayload('hello', s.sub.keys.p256dh, s.sub.keys.auth));
  body[body.length - 3] ^= 1;
  assert.throws(() => eceDecrypt(body, s));
  const other = newSubscription('https://fcm.googleapis.com/fcm/send/y');
  const body2 = await encryptPayload('hello', s.sub.keys.p256dh, s.sub.keys.auth);
  assert.throws(() => eceDecrypt(body2, other), 'only the subscription it was made for can read it');
});

test('bad inputs are refused', async () => {
  const s = newSubscription('https://fcm.googleapis.com/fcm/send/x');
  await assert.rejects(encryptPayload('x', s.sub.keys.p256dh.slice(0, 40), s.sub.keys.auth), /p256dh/);
  await assert.rejects(encryptPayload('x', s.sub.keys.p256dh, 'AAAA'), /auth/);
  await assert.rejects(encryptPayload(new Uint8Array(MAX_PLAINTEXT + 1), s.sub.keys.p256dh, s.sub.keys.auth), /too large/);
});

test('the test decryptor agrees with web-push 4.0.0 (so it is not just mirroring our code)', () => {
  const s = newSubscription('https://fcm.googleapis.com/fcm/send/x');
  const enc = webPushLib.encrypt(s.sub.keys.p256dh, s.sub.keys.auth, 'from web-push', 'aes128gcm');
  assert.equal(decryptPush(enc.cipherText, s.ecdh, s.auth).plaintext.toString(), 'from web-push');
});

test('VAPID JWT: ES256 signature checks out with crypto.verify; claims as specified', async () => {
  const keys = newVapidKeys();
  const vapid = await importVapidKeys(keys.publicKey, keys.privateKey);
  const now = Date.parse('2026-11-13T10:00:00Z');
  const endpoint = 'https://fcm.googleapis.com/fcm/send/abc:def';
  const header = await vapidAuthorization(endpoint, vapid, 'https://digitalmarket-arch.github.io/AI-ML/', now);
  const jwt = verifyVapidHeader(header, keys.publicKey);
  assert.deepEqual(jwt.header, { typ: 'JWT', alg: 'ES256' });
  assert.deepEqual(jwt.claims, {
    aud: 'https://fcm.googleapis.com',
    exp: now / 1000 + 12 * 3600,
    sub: 'https://digitalmarket-arch.github.io/AI-ML/',
  });
});

test('the verifier is real: a changed claim or another key fails', async () => {
  const keys = newVapidKeys();
  const vapid = await importVapidKeys(keys.publicKey, keys.privateKey);
  const header = await vapidAuthorization('https://web.push.apple.com/abc', vapid, 'https://example.org/', Date.now());
  const [, t] = /t=([^,]+)/.exec(header);
  const [h, p, sig] = t.split('.');
  const forged = JSON.parse(Buffer.from(p, 'base64url'));
  forged.aud = 'https://fcm.googleapis.com';
  const tampered = header.replace(t, h + '.' + Buffer.from(JSON.stringify(forged)).toString('base64url') + '.' + sig);
  assert.throws(() => verifyVapidHeader(tampered, keys.publicKey), /signature/);
  const other = newVapidKeys();
  assert.throws(() => verifyVapidHeader(header.replace(keys.publicKey, other.publicKey), other.publicKey), /signature/);
});

test('one JWT per audience, reused until an hour before it expires', async () => {
  const keys = newVapidKeys();
  const vapid = await importVapidKeys(keys.publicKey, keys.privateKey);
  const sub = 'https://digitalmarket-arch.github.io/AI-ML/';
  const t0 = Date.parse('2026-11-13T10:00:00Z');
  const a = await vapidJwt('https://fcm.googleapis.com', vapid, sub, t0);
  assert.equal(await vapidJwt('https://fcm.googleapis.com', vapid, sub, t0 + 3600 * 1000), a);
  assert.equal(await vapidJwt('https://fcm.googleapis.com', vapid, sub, t0 + (JWT_LIFETIME_S - 3601) * 1000), a);
  const renewed = await vapidJwt('https://fcm.googleapis.com', vapid, sub, t0 + (JWT_LIFETIME_S - 3600) * 1000);
  assert.notEqual(renewed, a, 'a fresh token once the old one has an hour left');
  const apple = await vapidJwt('https://web.push.apple.com', vapid, sub, t0);
  assert.notEqual(apple, a);
  assert.equal(JSON.parse(Buffer.from(apple.split('.')[1], 'base64url')).aud, 'https://web.push.apple.com');
});

test('same header shape as web-push 4.0.0, and its keys work here', async () => {
  const keys = webPushLib.generateVAPIDKeys();
  const subject = 'https://digitalmarket-arch.github.io/AI-ML/';
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const theirs = webPushLib.getVapidHeaders('https://fcm.googleapis.com', subject, keys.publicKey, keys.privateKey, 'aes128gcm', exp);
  const theirJwt = verifyVapidHeader(theirs.Authorization, keys.publicKey);
  const vapid = await importVapidKeys(keys.publicKey, keys.privateKey);
  const ours = await vapidAuthorization('https://fcm.googleapis.com/fcm/send/x', vapid, subject, Date.now());
  const ourJwt = verifyVapidHeader(ours, keys.publicKey);
  assert.deepEqual(Object.keys(ourJwt.claims).sort(), Object.keys(theirJwt.claims).sort());
  assert.equal(ourJwt.claims.aud, theirJwt.claims.aud);
  assert.equal(ourJwt.claims.sub, theirJwt.claims.sub);
  assert.deepEqual(ourJwt.header, theirJwt.header);
});

test('a private key shorter than 32 bytes (leading zero) is padded', async () => {
  // Find a key whose scalar starts with a zero byte, then pass it without that byte.
  let jwk;
  for (;;) {
    jwk = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' }).privateKey.export({ format: 'jwk' });
    if (Buffer.from(jwk.d, 'base64url')[0] === 0) break;
  }
  const pub = Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x, 'base64url'), Buffer.from(jwk.y, 'base64url')]).toString('base64url');
  const short = Buffer.from(jwk.d, 'base64url').subarray(1).toString('base64url');
  const vapid = await importVapidKeys(pub, short);
  verifyVapidHeader(await vapidAuthorization('https://fcm.googleapis.com/x', vapid, 'https://example.org/'), pub);
});

test('VAPID keys in the wrong format are refused with a clear message', async () => {
  const keys = newVapidKeys();
  await assert.rejects(importVapidKeys('', keys.privateKey), /VAPID_PUBLIC_KEY/);
  await assert.rejects(importVapidKeys(keys.publicKey.slice(2), keys.privateKey), /VAPID_PUBLIC_KEY/);
  await assert.rejects(importVapidKeys(keys.publicKey, ''), /VAPID_PRIVATE_KEY/);
  await assert.rejects(importVapidKeys(keys.publicKey, keys.privateKey + 'AAAA'), /VAPID_PRIVATE_KEY/);
});

test('buildPushRequest: the headers the spec asks for', async () => {
  const keys = newVapidKeys();
  const vapid = await importVapidKeys(keys.publicKey, keys.privateKey);
  const s = newSubscription('https://updates.push.services.mozilla.com/wpush/v2/abc');
  const msg = { t: 'AI Marg', b: 'Test reminder: notifications work on this device.', u: './#reminders', tag: 'aimarg-test' };
  const req = await buildPushRequest({ endpoint: s.sub.endpoint, ...s.sub.keys }, msg, {
    vapid,
    subject: 'https://digitalmarket-arch.github.io/AI-ML/',
    ttl: 300,
    urgency: 'high',
    topic: 'test',
    maxBytes: 400,
  });
  assert.equal(req.url, s.sub.endpoint);
  assert.equal(req.init.method, 'POST');
  const h = req.init.headers;
  assert.equal(h.TTL, '300');
  assert.equal(h.Urgency, 'high');
  assert.equal(h.Topic, 'test');
  assert.equal(h['Content-Encoding'], 'aes128gcm');
  const jwt = verifyVapidHeader(h.Authorization, keys.publicKey);
  assert.equal(jwt.claims.aud, 'https://updates.push.services.mozilla.com');
  assert.deepEqual(JSON.parse(eceDecrypt(req.init.body, s).toString()), msg);
  await assert.rejects(
    buildPushRequest({ endpoint: s.sub.endpoint, ...s.sub.keys }, { b: 'x'.repeat(400) }, { vapid, subject: 'x', ttl: 1, maxBytes: 400 }),
    /too large/,
  );
});

test('sendPush returns the push service status, and 0 when it cannot be reached', async () => {
  const keys = newVapidKeys();
  const vapid = await importVapidKeys(keys.publicKey, keys.privateKey);
  const s = newSubscription('https://fcm.googleapis.com/fcm/send/x');
  const sub = { endpoint: s.sub.endpoint, ...s.sub.keys };
  const seen = [];
  const opts = (fetchImpl) => ({ vapid, subject: 'https://example.org/', ttl: 3600, topic: 'reminder', fetch: fetchImpl });
  assert.equal(await sendPush(sub, { t: 'x' }, opts(async (url, init) => (seen.push([url, init]), new Response(null, { status: 201 })))), 201);
  assert.equal(seen.length, 1);
  assert.ok(seen[0][1].signal, 'a timeout signal is attached');
  assert.equal(await sendPush(sub, { t: 'x' }, opts(async () => new Response('gone', { status: 410 }))), 410);
  assert.equal(await sendPush(sub, { t: 'x' }, opts(async () => { throw new TypeError('network down'); })), 0);
});

test('base64url helpers are strict', () => {
  const bytes = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255]);
  assert.equal(b64urlEncode(bytes), Buffer.from(bytes).toString('base64url'));
  assert.deepEqual(b64urlDecode(Buffer.from(bytes).toString('base64url')), bytes);
  assert.deepEqual(b64urlDecode('AAE='), new Uint8Array([0, 1]), 'padding is allowed');
  for (const bad of ['a+b/', 'abc$', 'A', 'AB==C', null, 42, undefined, 'A B']) {
    assert.equal(b64urlDecode(bad), null, String(bad));
  }
  const big = crypto.randomBytes(100000);
  assert.equal(b64urlEncode(big), big.toString('base64url'));
});

test('isValidP256Point accepts real keys and refuses points off the curve', async () => {
  const s = newSubscription('https://x');
  assert.ok(await isValidP256Point(s.sub.keys.p256dh));
  const off = Buffer.from(s.sub.keys.p256dh, 'base64url');
  off[64] ^= 1;
  assert.equal(await isValidP256Point(new Uint8Array(off)), false);
  assert.equal(await isValidP256Point(new Uint8Array(65).fill(0).fill(4, 0, 1)), false);
  assert.equal(await isValidP256Point(new Uint8Array(33).fill(2)), false);
});
