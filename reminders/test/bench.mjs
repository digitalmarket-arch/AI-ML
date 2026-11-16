// CPU cost of the Worker's own work, measured in Node (npm run bench).
// Workers' free plan allows 10 ms of CPU per invocation; waiting on the push service or on D1
// does not count, only the JavaScript and crypto work below.
// process.cpuUsage() covers every thread, so WebCrypto work on Node's thread pool is included.

import { importVapidKeys, buildPushRequest, clearJwtCache, vapidJwt } from '../src/webpush.js';
import { nextAt, localDate, localDayOfYear } from '../src/time.js';
import { reminderMessage } from '../src/texts.js';
import { validateSubscribe } from '../src/validate.js';
import { newSubscription, newVapidKeys } from './helpers.js';

const N = Number(process.argv[2]) || 400;
const keys = newVapidKeys();
const vapid = await importVapidKeys(keys.publicKey, keys.privateKey);
const s = newSubscription('https://fcm.googleapis.com/fcm/send/bench');
const sub = { endpoint: s.sub.endpoint, ...s.sub.keys };
const opts = { vapid, subject: 'https://digitalmarket-arch.github.io/AI-ML/', ttl: 3600, urgency: 'high', topic: 'reminder', maxBytes: 400 };

async function cpuPer(label, n, fn) {
  for (let i = 0; i < 20; i++) await fn(i); // warm up
  const c0 = process.cpuUsage();
  const t0 = performance.now();
  for (let i = 0; i < n; i++) await fn(i);
  const c = process.cpuUsage(c0);
  const wall = performance.now() - t0;
  const cpu = (c.user + c.system) / 1000 / n;
  console.log(`${label.padEnd(58)} ${cpu.toFixed(3)} ms CPU   (${(wall / n).toFixed(3)} ms wall)`);
  return cpu;
}

console.log(`Node ${process.version}, ${N} runs each\n`);
const now = Date.now();
const perPush = await cpuPer('one reminder push (encrypt + headers, JWT cached)', N, async (i) => {
  const msg = reminderMessage(i % 2 ? 'play' : 'review', localDayOfYear(now, 'Asia/Kolkata'));
  await buildPushRequest(sub, msg, opts);
});
const perRow = await cpuPer('cron work per row (nextAt + local date + push)', N, async (i) => {
  const t = now + i * 60000;
  nextAt(t, 'Asia/Kolkata', 19, 0, 127);
  localDate(t, 'Asia/Kolkata');
  await buildPushRequest(sub, reminderMessage('review', localDayOfYear(t, 'Asia/Kolkata')), opts);
});
const jwt = await cpuPer('new VAPID JWT (ES256 sign; once per push service per 11 h)', N, async (i) => {
  clearJwtCache();
  await vapidJwt('https://fcm.googleapis.com', vapid, opts.subject, now + i);
});
await cpuPer('nextAt alone (Asia/Kolkata)', N, async (i) => nextAt(now + i * 60000, 'Asia/Kolkata', 19, 0, 127));
await cpuPer('nextAt alone (America/New_York)', N, async (i) => nextAt(now + i * 60000, 'America/New_York', 19, 0, 127));
await cpuPer('subscribe validation (includes the curve check)', N, async () => {
  await validateSubscribe({ sub: s.sub, time: '19:00', days: [0, 1, 2, 3, 4, 5, 6], tz: 'Asia/Kolkata', open: 'review', skip: true, active: '' }, false);
});

console.log(`\nA cron run of BATCH = 10 rows: about ${(10 * perRow).toFixed(1)} ms of crypto and time maths,`);
console.log(`plus ${jwt.toFixed(2)} ms for each push service whose JWT needs renewing (at most a few a day).`);
console.log(`Per push alone: ${perPush.toFixed(3)} ms.`);
