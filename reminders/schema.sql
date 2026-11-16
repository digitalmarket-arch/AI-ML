-- AI Marg study reminders: the D1 database tables.
-- The Worker makes these itself (src/store.js, the same statements) before its first query, so there is no
-- migration step: a deploy is all it takes. This file is here to read, and for the tests (they check that the two
-- match). Safe to run more than once: nothing is dropped.

-- One row per device that turned reminders on.
-- id is base64url(SHA-256(endpoint)). days is a bitmask: bit d is weekday d (0 = Sunday).
-- next_at, created, updated, last_at and test_win are UTC milliseconds.
CREATE TABLE IF NOT EXISTS subs (
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
);

-- The cron asks "who is due now?" every minute; this index keeps that one query cheap. Rows due at the same time
-- take turns: the one that has waited longest since its last reminder (last_at) comes first.
CREATE INDEX IF NOT EXISTS subs_due ON subs (next_at, last_at);

-- Rate limits. k is "sub:" + base64url(SHA-256(ip + VAPID public key)), never the raw IP; for an IPv6 address, ip is
-- its /64 network ("2001:db8:1:2::/64"), because one connection can use any address in it.
-- n requests counted in the window that started at win (UTC ms). The cron prunes old rows.
CREATE TABLE IF NOT EXISTS rl (
  k TEXT PRIMARY KEY,
  n INTEGER NOT NULL,
  win INTEGER NOT NULL
);

-- Small settings. k = 'vapid': the Worker's own VAPID key pair, made on first need when no VAPID_PUBLIC_KEY and
-- VAPID_PRIVATE_KEY secrets are set. v is JSON: { "publicKey": base64url of the 65-byte public point,
-- "privateKey": the private key as a JWK }. The private key never leaves the Worker (no answer or log shows it).
CREATE TABLE IF NOT EXISTS meta (
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL
);

-- How many rows subs has (k = 'subs'), kept exact by the two triggers below, so the "is the service full?" check
-- (MAX_SUBS) reads one row instead of counting every row of subs.
CREATE TABLE IF NOT EXISTS counts (
  k TEXT PRIMARY KEY,
  n INTEGER NOT NULL
);

CREATE TRIGGER IF NOT EXISTS subs_added AFTER INSERT ON subs BEGIN
  UPDATE counts SET n = n + 1 WHERE k = 'subs';
END;

CREATE TRIGGER IF NOT EXISTS subs_removed AFTER DELETE ON subs BEGIN
  UPDATE counts SET n = n - 1 WHERE k = 'subs';
END;

-- The count starts from the rows already there (none in a new database); once it exists this does nothing.
INSERT INTO counts (k, n) SELECT 'subs', (SELECT COUNT(*) FROM subs) WHERE NOT EXISTS (SELECT 1 FROM counts WHERE k = 'subs');
