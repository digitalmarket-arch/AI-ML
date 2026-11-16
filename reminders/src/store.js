// The Worker's D1 tables, and the VAPID key pair it keeps in them.
//
// Tables: the Worker makes its own (SCHEMA, all "IF NOT EXISTS") once per isolate, before its first query, so a deploy
// needs no migration step and works straight from the Deploy to Cloudflare button. schema.sql holds the same
// statements for people to read and for the tests (test/unit/store.test.js checks that the two match).
//
// Keys: when the Worker has no VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY secrets, it makes a P-256 key pair on first need
// and keeps it in the table meta (k = 'vapid'). The private key never leaves the Worker: it is not in any answer or log.

import { b64urlDecode, b64urlEncode } from './webpush.js';

export const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS subs (
  id TEXT PRIMARY KEY,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  hh INTEGER NOT NULL,
  mm INTEGER NOT NULL,
  days INTEGER NOT NULL,
  tz TEXT NOT NULL,
  open TEXT NOT NULL,
  skip INTEGER NOT NULL,
  active TEXT NOT NULL DEFAULT '',
  next_at INTEGER NOT NULL,
  created INTEGER NOT NULL,
  updated INTEGER NOT NULL,
  last_at INTEGER NOT NULL DEFAULT 0,
  fails INTEGER NOT NULL DEFAULT 0,
  tests INTEGER NOT NULL DEFAULT 0,
  test_win INTEGER NOT NULL DEFAULT 0
)`,
  // rows due at the same time take turns: the one that has waited longest since its last reminder (last_at) goes first
  'CREATE INDEX IF NOT EXISTS subs_due ON subs (next_at, last_at)',
  `CREATE TABLE IF NOT EXISTS rl (
  k TEXT PRIMARY KEY,
  n INTEGER NOT NULL,
  win INTEGER NOT NULL
)`,
  `CREATE TABLE IF NOT EXISTS meta (
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL
)`,
  // How many rows subs has, kept exact by the two triggers below, so the MAX_SUBS check reads one row (a COUNT(*) would
  // read every row, and D1 counts each one against the daily free reads).
  `CREATE TABLE IF NOT EXISTS counts (
  k TEXT PRIMARY KEY,
  n INTEGER NOT NULL
)`,
  `CREATE TRIGGER IF NOT EXISTS subs_added AFTER INSERT ON subs BEGIN
  UPDATE counts SET n = n + 1 WHERE k = 'subs';
END`,
  `CREATE TRIGGER IF NOT EXISTS subs_removed AFTER DELETE ON subs BEGIN
  UPDATE counts SET n = n - 1 WHERE k = 'subs';
END`,
  // The count starts from the rows already there (none in a new database). Once it exists this does nothing, and its
  // COUNT(*) is not run.
  `INSERT INTO counts (k, n) SELECT 'subs', (SELECT COUNT(*) FROM subs) WHERE NOT EXISTS (SELECT 1 FROM counts WHERE k = 'subs')`,
];

// Makes the tables, the index and the triggers that are missing (one batch, so one transaction; cheap when they all
// exist).
export async function createTables(db) {
  await db.batch(SCHEMA.map((sql) => db.prepare(sql)));
}

const P256 = { name: 'ECDSA', namedCurve: 'P-256' };
const B64URL = /^[A-Za-z0-9_-]+$/;

// A new key pair as stored in meta.v: { publicKey: base64url of the 65-byte uncompressed point, privateKey: a JWK }.
async function newStoredKeys() {
  const pair = await crypto.subtle.generateKey(P256, true, ['sign', 'verify']);
  const pub = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  return JSON.stringify({ publicKey: b64urlEncode(pub), privateKey: { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y, d: jwk.d } });
}

// The stored pair, checked: { publicKey, privateKey } as base64url (the 65-byte point and the 32-byte scalar d).
// Errors never quote the row, so the private key cannot end up in a log.
function readStoredKeys(v) {
  let s;
  try {
    s = JSON.parse(v);
  } catch {
    s = null;
  }
  const jwk = s && s.privateKey;
  const pub = s && b64urlDecode(s.publicKey);
  const good =
    pub &&
    pub.length === 65 &&
    pub[0] === 4 &&
    jwk &&
    jwk.kty === 'EC' &&
    jwk.crv === 'P-256' &&
    typeof jwk.d === 'string' &&
    B64URL.test(jwk.d) &&
    jwk.x === b64urlEncode(pub.subarray(1, 33)) &&
    jwk.y === b64urlEncode(pub.subarray(33, 65));
  if (!good) throw new Error('the VAPID keys stored in D1 are damaged');
  return { publicKey: s.publicKey, privateKey: jwk.d };
}

// The VAPID key pair kept in D1, made the first time it is needed. INSERT OR IGNORE, then read the row back: when two
// isolates make a pair at the same moment, the first one written wins and both use it.
export async function storedVapidKeys(db) {
  const read = () => db.prepare("SELECT v FROM meta WHERE k = 'vapid'").first('v');
  let v = await read();
  if (!v) {
    try {
      await db.prepare("INSERT OR IGNORE INTO meta (k, v) VALUES ('vapid', ?1)").bind(await newStoredKeys()).run();
    } catch {
      throw new Error('could not make and store the VAPID keys');
    }
    v = await read();
  }
  return readStoredKeys(v);
}
