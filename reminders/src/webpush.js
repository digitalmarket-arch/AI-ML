// Web Push with WebCrypto only (no dependencies), so it runs in Cloudflare Workers and Node 22.
//
// - VAPID (RFC 8292): an ES256 JSON Web Token, sent as "Authorization: vapid t=<jwt>, k=<key>".
// - Payload encryption (RFC 8291, using the "aes128gcm" content coding of RFC 8188):
//   one record, a new ephemeral ECDH key and a random 16-byte salt for every message,
//   rs = 4096, and the 0x02 delimiter that marks the last (only) record.
//
// The 86-byte header is salt (16) | rs (4, big-endian) | idlen (1) | keyid (idlen).
// RFC 8291 section 4 requires keyid to be the sender's ephemeral public key (65 bytes,
// uncompressed point), because that is how the browser learns it. With an empty keyid no
// browser could decrypt the message.

const te = new TextEncoder();
const KEY_INFO = te.encode('WebPush: info\0');
const CEK_INFO = te.encode('Content-Encoding: aes128gcm\0');
const NONCE_INFO = te.encode('Content-Encoding: nonce\0');
const P256 = { name: 'ECDH', namedCurve: 'P-256' };

export const RECORD_SIZE = 4096;
export const HEADER_SIZE = 86;
// RFC 8291: push services only promise 4096 bytes of body: 4096 - 86 header - 16 tag - 1 delimiter.
export const MAX_PLAINTEXT = 3993;
// How long a VAPID token is valid, and how long before expiry a cached one is replaced.
export const JWT_LIFETIME_S = 12 * 3600;
export const JWT_RENEW_S = 3600;

// ---------- bytes and base64url ----------

export function b64urlEncode(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = '';
  for (let i = 0; i < b.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Strict base64url (the alphabet A-Z a-z 0-9 - _, optional "=" padding). Returns null when invalid.
export function b64urlDecode(str) {
  if (typeof str !== 'string' || !/^[A-Za-z0-9_-]*={0,2}$/.test(str)) return null;
  let s = str.replace(/=+$/, '');
  if (s.length % 4 === 1) return null;
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  s += '='.repeat((4 - (s.length % 4)) % 4);
  let bin;
  try {
    bin = atob(s);
  } catch {
    return null;
  }
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function concatBytes(...parts) {
  let n = 0;
  for (const p of parts) n += p.length;
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function asBytes(v) {
  if (v instanceof Uint8Array) return v;
  if (v instanceof ArrayBuffer) return new Uint8Array(v);
  if (typeof v === 'string') return b64urlDecode(v);
  return null;
}

// ---------- keys ----------

// True when the bytes are an uncompressed P-256 point that is really on the curve.
export async function isValidP256Point(bytes) {
  const b = asBytes(bytes);
  if (!b || b.length !== 65 || b[0] !== 4) return false;
  try {
    await crypto.subtle.importKey('raw', b, P256, false, []);
    return true;
  } catch {
    return false;
  }
}

function ecJwk(publicRaw, privateD) {
  return {
    kty: 'EC',
    crv: 'P-256',
    x: b64urlEncode(publicRaw.subarray(1, 33)),
    y: b64urlEncode(publicRaw.subarray(33, 65)),
    d: b64urlEncode(privateD),
    ext: false,
  };
}

function pad32(d) {
  if (d.length === 32) return d;
  const p = new Uint8Array(32);
  p.set(d, 32 - d.length);
  return p;
}

// VAPID keys as stored in the Worker secrets: base64url of the 65-byte public point and of
// the 32-byte private scalar (the format web-push and most libraries use).
export async function importVapidKeys(publicKey, privateKey) {
  const pub = b64urlDecode(publicKey);
  const d = b64urlDecode(privateKey);
  if (!pub || pub.length !== 65 || pub[0] !== 4) {
    throw new Error('VAPID_PUBLIC_KEY must be a base64url P-256 public key (65 bytes)');
  }
  if (!d || d.length === 0 || d.length > 32) {
    throw new Error('VAPID_PRIVATE_KEY must be a base64url P-256 private key (32 bytes)');
  }
  const key = await crypto.subtle.importKey(
    'jwk',
    ecJwk(pub, pad32(d)),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  return { publicKey: b64urlEncode(pub), privateKey: key };
}

// An ECDH key pair from raw parts. Only the tests use this, to replay fixed vectors.
export async function importEcdhKeyPair(publicRaw, privateD) {
  const pub = asBytes(publicRaw);
  const d = asBytes(privateD);
  const privateKey = await crypto.subtle.importKey('jwk', ecJwk(pub, pad32(d)), P256, false, ['deriveBits']);
  const publicKey = await crypto.subtle.importKey('raw', pub, P256, true, []);
  return { publicKey, privateKey };
}

// ---------- RFC 8291 encryption ----------

async function hkdf(salt, ikm, info, bytes) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, bytes * 8);
  return new Uint8Array(bits);
}

// Encrypts one push message for a subscription (p256dh and auth as base64url or bytes).
// opts.salt and opts.asKeyPair exist only so the tests can replay the RFC 8291 example;
// normal calls get a fresh random salt and a fresh ephemeral key.
export async function encryptPayload(plaintext, p256dh, auth, opts = {}) {
  const data = typeof plaintext === 'string' ? te.encode(plaintext) : asBytes(plaintext);
  const uaPublic = asBytes(p256dh);
  const authSecret = asBytes(auth);
  if (!data) throw new Error('plaintext must be a string or bytes');
  if (data.length > MAX_PLAINTEXT) throw new Error('payload too large');
  if (!uaPublic || uaPublic.length !== 65 || uaPublic[0] !== 4) throw new Error('bad p256dh');
  if (!authSecret || authSecret.length !== 16) throw new Error('bad auth');

  const salt = opts.salt ? asBytes(opts.salt) : crypto.getRandomValues(new Uint8Array(16));
  if (salt.length !== 16) throw new Error('salt must be 16 bytes');
  const asKeys = opts.asKeyPair || (await crypto.subtle.generateKey(P256, true, ['deriveBits']));
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', asKeys.publicKey));

  // ecdh_secret = ECDH(as_private, ua_public)
  const uaKey = await crypto.subtle.importKey('raw', uaPublic, P256, false, []);
  const ecdhSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, asKeys.privateKey, 256),
  );
  // IKM = HKDF(salt = auth_secret, ikm = ecdh_secret, info = "WebPush: info" 0x00 ua_public as_public, 32)
  const ikm = await hkdf(authSecret, ecdhSecret, concatBytes(KEY_INFO, uaPublic, asPublic), 32);
  // CEK and NONCE from RFC 8188, keyed by the message salt.
  const cek = await hkdf(salt, ikm, CEK_INFO, 16);
  const nonce = await hkdf(salt, ikm, NONCE_INFO, 12);

  // One record: the plaintext, then the 0x02 delimiter of the last record (no extra padding).
  const record = new Uint8Array(data.length + 1);
  record.set(data, 0);
  record[data.length] = 2;
  const aesKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const sealed = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce, tagLength: 128 }, aesKey, record),
  );

  const out = new Uint8Array(HEADER_SIZE + sealed.length);
  out.set(salt, 0);
  new DataView(out.buffer).setUint32(16, RECORD_SIZE, false);
  out[20] = 65;
  out.set(asPublic, 21);
  out.set(sealed, HEADER_SIZE);
  return out;
}

// ---------- RFC 8292 VAPID ----------

// One token per push service origin (aud), kept until an hour before it expires.
const jwtCache = new Map();

export function clearJwtCache() {
  jwtCache.clear();
}

export async function vapidJwt(aud, vapid, subject, nowMs = Date.now()) {
  const now = Math.floor(nowMs / 1000);
  const cacheKey = aud + ' ' + vapid.publicKey + ' ' + subject;
  const hit = jwtCache.get(cacheKey);
  if (hit && hit.privateKey === vapid.privateKey && now < hit.exp - JWT_RENEW_S) return hit.jwt;
  const exp = now + JWT_LIFETIME_S;
  const head = b64urlEncode(te.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = b64urlEncode(te.encode(JSON.stringify({ aud, exp, sub: subject })));
  const unsigned = head + '.' + claims;
  // WebCrypto ECDSA signatures are already raw r||s (64 bytes), which is what JWS ES256 wants.
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, vapid.privateKey, te.encode(unsigned));
  const jwt = unsigned + '.' + b64urlEncode(new Uint8Array(sig));
  jwtCache.set(cacheKey, { jwt, exp, privateKey: vapid.privateKey });
  return jwt;
}

export async function vapidAuthorization(endpoint, vapid, subject, nowMs = Date.now()) {
  const aud = new URL(endpoint).origin;
  const jwt = await vapidJwt(aud, vapid, subject, nowMs);
  return 'vapid t=' + jwt + ', k=' + vapid.publicKey;
}

// ---------- sending ----------

// Builds the HTTP request for one push without sending it.
// sub: { endpoint, p256dh, auth }. message: an object (sent as JSON) or a string.
// opts: { vapid, subject, ttl, urgency, topic, maxBytes, nowMs }.
export async function buildPushRequest(sub, message, opts) {
  const text = typeof message === 'string' ? message : JSON.stringify(message);
  const data = te.encode(text);
  if (opts.maxBytes && data.length > opts.maxBytes) throw new Error('payload too large');
  const body = await encryptPayload(data, sub.p256dh, sub.auth);
  const headers = {
    'Content-Type': 'application/octet-stream',
    'Content-Encoding': 'aes128gcm',
    TTL: String(opts.ttl),
    Urgency: opts.urgency || 'high',
    Authorization: await vapidAuthorization(sub.endpoint, opts.vapid, opts.subject, opts.nowMs),
  };
  if (opts.topic) headers.Topic = opts.topic;
  return { url: sub.endpoint, init: { method: 'POST', headers, body } };
}

// Sends one push and returns the push service's HTTP status (0 when it could not be reached).
export async function sendPush(sub, message, opts) {
  const req = await buildPushRequest(sub, message, opts);
  let res;
  try {
    res = await (opts.fetch || fetch)(req.url, {
      ...req.init,
      signal: AbortSignal.timeout(opts.timeoutMs || 10000),
    });
  } catch {
    return 0;
  }
  try {
    if (res.body) await res.body.cancel();
  } catch {
    // nothing to clean up
  }
  return res.status;
}
