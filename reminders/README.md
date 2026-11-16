# AI Marg reminder service

This folder is the small service that sends AI Marg study reminders to learners' phones as
website notifications ("Web Push"). It runs on Cloudflare's free plan as a **Worker** (a tiny
program that runs on Cloudflare's servers) with a **D1** database. The website itself stays on
GitHub Pages; this service only stores who wants a reminder and when, and sends it.

## Put it online (no coding needed)

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/digitalmarket-arch/AI-ML/tree/ccr-d2e52eb0-624rlk/reminders)

1. **Create a free Cloudflare account** at [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up).
   It needs no card.
2. **Check your workers.dev name.** In the Cloudflare dashboard, open **Workers & Pages** in the
   menu. Find your *subdomain*: a name that ends in `.workers.dev` (it is shown next to
   **Your subdomain**, or under **Settings**). Cloudflare picks it for you, often from your email
   address, and it becomes part of a public address. If it shows your name or any part of your
   email, press **Change**, type a neutral name such as `ai-marg` (if that is taken, try
   `ai-marg-learn`), and save.
3. **Press the Deploy to Cloudflare button** above.
4. **Sign in, and allow Cloudflare's GitHub app on your account** when it asks. Cloudflare puts
   a copy of this folder in a new repository in your GitHub account and builds it from there.
5. **Keep the suggested names**, then press **Create and deploy**.
6. **Wait for it to finish** (a minute or two). Then copy the address that ends in
   `.workers.dev` (for example `https://aimarg-reminders.ai-marg.workers.dev`) and send it to
   whoever maintains the site, so it can be put in `assets/js/remind.js`. Send the name of the
   new GitHub repository Cloudflare made too. Neither of them is a secret. If someone else
   maintains the site, also give them access to that repository (on GitHub: the repository's
   **Settings**, **Collaborators**, **Add people**), so they can send it fixes.

That is all. There are no keys or passwords to copy and nothing else to set:

- the database is made by the deploy itself (`wrangler.toml` names it and gives no id);
- the Worker makes its own tables the first time it runs;
- the Worker makes its own VAPID key pair (the keys that sign each reminder) the first time it
  needs one, and keeps it in its database. The site asks the Worker for the public half
  (`GET /v1/key`); the private half never leaves Cloudflare.

Opening the address by itself shows `{"ok":false,"error":"origin"}`. That is normal: the
service only answers the AI Marg site. To check that it runs, open the address with `/v1/health`
at the end (no slash after it). It shows `{"ok":true,"version":"1"}`. A brand-new address can
take a few minutes to start working.

**The developer way** (with Node.js 22.12 or newer and a Cloudflare login):

```sh
cd reminders && npm install && npx wrangler deploy
```

**Deploying again.** This folder is the source, but the running service is built from the copy
the button made in your GitHub account (step 6: whoever maintains the site needs access to it). A change pushed to that copy deploys by itself, and keeps
the same database, so the same keys and every learner's reminders. A fix made here, in
`reminders/`, takes effect only once it is copied into that repository (or deployed the
developer way above). If the database is ever deleted, the Worker makes new keys, and learners
who had turned reminders on must turn them off and on again.

## How it works

1. On the site's Reminders page a learner picks a time and days and taps **Turn on reminders**.
   The page asks this service for its public key, and the browser makes a *push subscription*
   with it: a private address that only this service can use to reach that one browser. The
   site sends it here with the chosen time, days and time zone.
2. The service saves it and works out the next reminder time in the learner's own time zone
   (daylight saving included, for learners outside India).
3. Every minute a scheduled job looks for reminders that are due. For each one it encrypts a
   short message for that device, signs the request with the service's VAPID key, and hands it
   to the browser's push service (Google for Chrome and Android, Mozilla for Firefox, Apple for
   iPhone and Safari, Microsoft for Edge on Windows). The push service delivers it and the phone
   shows the notification.
4. If the learner chose "Skip days when I have already studied" and studied that day (as their
   browser knows it: with sign-in, study on their other devices counts too), nothing is sent
   that day.
5. A reminder that could not go out within two hours of its time (for example after an outage)
   is not sent late at the wrong time of day: it simply waits for its next time.
6. When a push service says an address is gone (notifications turned off, browser data
   cleared), the row is deleted at once. After 10 failed sends in a row it is deleted too.

## What is stored, and what is not

One row per device that turned reminders on (table `subs`):

| Stored | Why |
| --- | --- |
| the push address, its public key and its auth secret (`endpoint`, `p256dh`, `auth`) | to reach the device; the message is encrypted so only that device can read it |
| time, days, time zone | to know when to send |
| which page to open (Daily review or Play) | the notification's link |
| skip on/off and the last day studied, as that browser knows it (`active`) | to skip days already studied |
| next reminder time, when the last one was handled (sent, tried, or skipped because the learner studied; not a late one), failure count, test count and when the tests started | to run the schedule, and to let learners at a busy minute take turns |
| created and updated times | housekeeping |

Not stored: names, emails, Google accounts, IP addresses, or anything about what a learner
studies. For rate limits (table `rl`) the service keeps a hash of the IP address mixed with the
service's public key (not the address itself; for an IPv6 address, of its first half, the /64
network) with a request count, and deletes it 2 to 3 hours after that count began. The hash is
not a secret: someone with a copy of the table and the public key could work out an IPv4
address from it, so it is kept only that long. The table `meta` holds the service's own VAPID
key pair, and `counts` one number: how many devices have reminders on. The logs hold only
counts ("due 3, sent 3"), never addresses or keys: `wrangler.toml` turns off Cloudflare's
per-request logs and traces. **Turn off** deletes the row.

## Files

| File | What it is |
| --- | --- |
| `src/index.js` | the Worker: the HTTP API and the every-minute job |
| `src/webpush.js` | Web Push: VAPID signing (RFC 8292) and message encryption (RFC 8291), WebCrypto only |
| `src/store.js` | the database tables, and the VAPID key pair kept in them |
| `src/time.js` | next reminder time, safe across daylight-saving changes |
| `src/texts.js` | the reminder wording (plain, kind English) |
| `src/validate.js` | checks on what the site sends, and the address group the rate limit counts |
| `schema.sql` | the tables, to read (the Worker makes them itself; a test checks the two match) |
| `wrangler.toml` | Cloudflare settings: name, cron, database, allowed site |
| `test/` | the tests (`npm test`) |

## The API the site uses

Base URL: the Worker's address, for example `https://aimarg-reminders.ai-marg.workers.dev`.
Requests are `POST` with a JSON body sent as `text/plain` (so browsers need no CORS
preflight and `navigator.sendBeacon` works). Bodies are at most 4096 bytes; answers are JSON.
Only `https://digitalmarket-arch.github.io` may call it (setting `ALLOWED_ORIGINS`).

| Call | Body | Answers |
| --- | --- | --- |
| `GET /v1/key` | | `{ ok: true, key }`: the public VAPID key (base64url), for `pushManager.subscribe` |
| `POST /v1/subscribe` | `{ sub: { endpoint, keys: { p256dh, auth } }, time: "19:00", days: [0..6], tz, open: "review"\|"play", skip, active: "YYYY-MM-DD"\|"" }` | `200 { ok: true, next }` (next send, UTC ms); `400` `bad-json`, `bad-sub`, `bad-host`, `bad-time`, `bad-days`, `bad-tz`, `bad-open`; `413 too-big`; `429 slow-down` (over 20 an hour from one IP address, or from one IPv6 /64 network); `503 full` |
| `POST /v1/unsubscribe` | `{ endpoint }` | always `200 { ok: true }` |
| `POST /v1/test` | `{ endpoint }` | `200 { ok: true, status }`; `404 not-found`; `429 slow-down` (over 5 an hour); `410 gone` (row deleted); `502 push-failed` |
| `POST /v1/active` | `{ endpoint, day: "YYYY-MM-DD" }` | always `200 { ok: true }` |
| `GET /v1/health` | | `{ ok: true, version: "1" }` |

Days use JavaScript's numbering: 0 is Sunday. The time zone is stored under the name Intl gives
it (any letter case is accepted; today `Asia/Kolkata` is kept as `Asia/Calcutta`). Unknown paths answer `404 not-found`; other
websites get `403 origin`. `/v1/key` and `/v1/health` also answer a browser tab or `curl`
(no Origin header).

Signing keys: when the Worker secrets `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` are both set
(base64url of the 65-byte public point and the 32-byte private key), the Worker uses them.
Otherwise it uses the pair it made and keeps in D1. Either way `/v1/key` gives the public key
in use, so the site always subscribes with the right one.

## Watching it

- `npx wrangler tail` shows a line each minute that sends something, such as
  `{"due":3,"sent":3,"skipped":0,"gone":0,"failed":0,"late":0}`. `late` counts reminders more
  than two hours past their time, which are not sent. The same lines are in the dashboard's
  Logs for the Worker.
- In the Cloudflare dashboard, Workers & Pages, `aimarg-reminders`, Metrics shows requests and
  CPU time; D1, `aimarg-reminders`, Metrics shows rows read and written.

## Free plan limits, and how this fits

Cloudflare's free plan (no card needed) allows, among other things: 100,000 Worker requests a
day, **10 ms of CPU time per run**, 50 outgoing requests per run, and for D1 5 GB of storage,
5 million rows read and 100,000 rows written a day, and 50 queries per run.

- The job runs every minute (1,440 times a day). When nothing is due it is one quick indexed
  read and no other work.
- One reminder costs about 0.2 ms of CPU on Cloudflare's runtime (measured locally with the
  same runtime) and about 2 rows written. A run sends at most `BATCH` = 10, so about 3 ms.
- So up to 10 reminders go out per minute: 14,400 a day at most. If 100 learners all pick
  7:00 pm, the last ones arrive by about 7:10 pm. A reminder that is still waiting two hours
  after its time is not sent (it would come at the wrong time of day); it moves on to its next
  time. So if more than about 1,200 reminders (about 120 x `BATCH`) are due at the same minute
  (most likely when many learners keep the default 7:00 pm), or more than `BATCH` a minute keep
  coming for hours, some are more than two hours late and are skipped. Learners due at the same
  time take turns: whoever has waited longest since their last reminder goes first, so the misses
  are shared out rather than falling on the same learners every day. Reminders that are still on
  time go before late ones, so late ones never take a place; but everything due in the two hours
  after a busy minute waits behind it (up to two hours late), and a later minute gets only the
  places left. Late ones are moved on to their next time without a send. To send faster, raise
  `BATCH` in `wrangler.toml` (at most 18, about 2,200 at one minute; 18 keeps a run under 50
  database queries even when it also makes the tables and keys), deploy again, and check that
  CPU time in the dashboard stays well under 10 ms.
- `MAX_SUBS` = 20,000 devices keeps daily writes under the free 100,000. When it is reached,
  new devices are told the service is full (existing ones keep working). Checking it reads one
  row (the `counts` table), however many devices there are.

## Working on it locally

```sh
npm ci
npm test          # unit tests, then the real Worker in `wrangler dev` against a fake push service
npm run bench     # CPU cost of one push in Node
```

`npm test` needs no network or Cloudflare account. The end-to-end test starts the Worker on an
empty local database with no keys, as a new deploy does, and writes a `.dev.vars` file
(ignored by git) with `DEV=1`, which it removes afterwards. To try the Worker by hand, create
`.dev.vars` with `DEV=1` (it lets a site on `localhost` call it), then `npm run dev`. Never set
`DEV` on Cloudflare: it exists only for the tests.

## If something goes wrong

- **"Send a test" says it failed with code 401 or 403:** the push service refused the
  signature. This happens when the Worker's keys changed after the learner turned reminders on
  (for example, its database was deleted). Turning reminders off and on again on that device
  fixes it.
- **Reminders arrive late or not at all on Android:** battery savers on many phones (Xiaomi,
  Vivo, Oppo, Realme, OnePlus, Samsung) stop Chrome in the background. The site's Reminders
  page has the steps to allow it.
- **New learners see "full":** `MAX_SUBS` was reached. Raise it in `wrangler.toml` only if the
  D1 metrics show room under the daily write limit.
