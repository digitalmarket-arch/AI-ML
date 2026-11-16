// Shared test helpers. Everything here uses Node's own crypto, written independently of
// src/webpush.js, so the tests cross-check it rather than repeat it.

import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// A fresh browser-side subscription: an ECDH key pair and a 16-byte auth secret.
export function newSubscription(endpoint) {
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.generateKeys();
  const auth = crypto.randomBytes(16);
  return {
    ecdh,
    auth,
    sub: {
      endpoint,
      keys: { p256dh: ecdh.getPublicKey().toString('base64url'), auth: auth.toString('base64url') },
    },
  };
}

// A VAPID key pair in the usual format: base64url of the 65-byte public point and of the
// 32-byte private scalar.
export function newVapidKeys() {
  const { privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const jwk = privateKey.export({ format: 'jwk' });
  const pub = Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x, 'base64url'), Buffer.from(jwk.y, 'base64url')]);
  return { publicKey: pub.toString('base64url'), privateKey: jwk.d };
}

// Decrypts an RFC 8291 aes128gcm push body with Node crypto (ECDH + HKDF + AES-128-GCM),
// written from the RFC, as a second implementation next to http_ece.
export function decryptPush(body, ecdh, authSecret) {
  const buf = Buffer.from(body);
  const salt = buf.subarray(0, 16);
  const rs = buf.readUInt32BE(16);
  const idlen = buf[20];
  const keyid = buf.subarray(21, 21 + idlen);
  const record = buf.subarray(21 + idlen);
  assert.ok(record.length <= rs, 'a push message must be a single record');
  const ecdhSecret = ecdh.computeSecret(keyid);
  const keyInfo = Buffer.concat([Buffer.from('WebPush: info\0'), ecdh.getPublicKey(), keyid]);
  const ikm = Buffer.from(crypto.hkdfSync('sha256', ecdhSecret, authSecret, keyInfo, 32));
  const cek = Buffer.from(crypto.hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: aes128gcm\0'), 16));
  const nonce = Buffer.from(crypto.hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: nonce\0'), 12));
  const decipher = crypto.createDecipheriv('aes-128-gcm', cek, nonce);
  decipher.setAuthTag(record.subarray(record.length - 16));
  const padded = Buffer.concat([decipher.update(record.subarray(0, record.length - 16)), decipher.final()]);
  let end = padded.length - 1;
  while (end >= 0 && padded[end] === 0) end--;
  assert.equal(padded[end], 2, 'the only record must end with the 0x02 delimiter');
  return { salt, rs, idlen, keyid, plaintext: padded.subarray(0, end) };
}

// Raw r||s (64 bytes, as JWS ES256 uses) to the ASN.1 DER form OpenSSL uses by default.
export function rawSignatureToDer(sig) {
  const integer = (bytes) => {
    let i = 0;
    while (i < bytes.length - 1 && bytes[i] === 0) i++;
    let b = bytes.subarray(i);
    if (b[0] & 0x80) b = Buffer.concat([Buffer.from([0]), b]);
    return Buffer.concat([Buffer.from([0x02, b.length]), b]);
  };
  const r = integer(Buffer.from(sig.subarray(0, 32)));
  const s = integer(Buffer.from(sig.subarray(32, 64)));
  return Buffer.concat([Buffer.from([0x30, r.length + s.length]), r, s]);
}

export function publicKeyObject(publicKeyB64) {
  const pub = Buffer.from(publicKeyB64, 'base64url');
  assert.equal(pub.length, 65);
  return crypto.createPublicKey({
    key: { kty: 'EC', crv: 'P-256', x: pub.subarray(1, 33).toString('base64url'), y: pub.subarray(33).toString('base64url') },
    format: 'jwk',
  });
}

// Checks "vapid t=<jwt>, k=<key>" and the ES256 signature with Node's crypto.verify, both
// as raw r||s (dsaEncoding ieee-p1363) and converted to DER. Returns the decoded JWT.
export function verifyVapidHeader(authorization, publicKeyB64) {
  const m = /^vapid t=([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+), k=([A-Za-z0-9_-]+)$/.exec(authorization);
  assert.ok(m, 'Authorization must look like "vapid t=<jwt>, k=<key>": ' + authorization);
  assert.equal(m[4], publicKeyB64, 'k= must be the VAPID public key');
  const key = publicKeyObject(publicKeyB64);
  const data = Buffer.from(m[1] + '.' + m[2]);
  const sig = Buffer.from(m[3], 'base64url');
  assert.equal(sig.length, 64, 'ES256 signatures are 64 bytes (r||s)');
  assert.ok(crypto.verify('sha256', data, { key, dsaEncoding: 'ieee-p1363' }, sig), 'signature (raw r||s)');
  assert.ok(crypto.verify('sha256', data, key, rawSignatureToDer(sig)), 'signature (converted to DER)');
  return {
    header: JSON.parse(Buffer.from(m[1], 'base64url').toString()),
    claims: JSON.parse(Buffer.from(m[2], 'base64url').toString()),
    signature: sig,
  };
}
