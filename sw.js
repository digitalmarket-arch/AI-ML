/* AI Marg service worker: it only shows study reminders (Web Push) and opens the site when one is tapped.
   It has no fetch handler, so it never caches or serves the site.
   Keep this file at this address (sw.js at the site's root) for good: never rename or delete it. Safari removes a
   service worker whose script has gone, and every learner's reminders would stop.
   Plain ES5, like the rest of the site (scripts/check-data.js checks it). */
'use strict';

var FALLBACK = { t: 'AI Marg study time', b: 'Time for a short AI Marg session.', u: './#review', tag: 'aimarg-reminder' };

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (event) { event.waitUntil(self.clients.claim()); });

function scope() { return (self.registration && self.registration.scope) || new URL('./', self.location.href).href; }
// a page of this site: u resolved against the scope, or null when it points anywhere else
function inScope(u) {
  try {
    var s = scope(), url = new URL(String(u), s).href;
    return url.indexOf(s) === 0 ? url : null;
  } catch (e) { return null; }
}
function text(v, max, dflt) { return typeof v === 'string' && /\S/.test(v) ? v.slice(0, max) : dflt; }
// what the reminder service sent ({ t: title, b: body, u: page, tag }), each part checked; anything missing or odd
// falls back to the standard reminder
function message(data) {
  var d = null;
  try { d = data ? data.json() : null; } catch (e) { d = null; }
  if (!d || typeof d !== 'object') d = {};
  return {
    t: text(d.t, 120, FALLBACK.t),
    b: text(d.b, 300, FALLBACK.b),
    u: typeof d.u === 'string' && inScope(d.u) ? d.u : FALLBACK.u,
    tag: typeof d.tag === 'string' && /^[\w-]{1,64}$/.test(d.tag) ? d.tag : FALLBACK.tag
  };
}
// plain: the last try, with nothing that could upset an older browser
function show(m, plain) {
  var o = { body: m.b, tag: m.tag, data: { u: m.u } };
  if (!plain) {
    o.icon = inScope('assets/icons/icon-192.png');
    o.badge = inScope('assets/icons/badge-96.png');
    o.renotify = true; // a new reminder alerts again even when yesterday's (same tag) is still in the tray
  }
  return self.registration.showNotification(m.t, o);
}

// every push shows a notification, whatever it carries: Safari takes the permission away after a silent push
self.addEventListener('push', function (event) {
  var p = null;
  try { p = show(message(event.data)); } catch (e) { p = null; }
  if (!p || typeof p.then !== 'function') p = Promise.reject(new Error('no notification'));
  event.waitUntil(p.then(null, function () { return show(FALLBACK, true); }));
});

// a tap opens the reminder's page: in a window of this site that is already open, or in a new one
self.addEventListener('notificationclick', function (event) {
  var n = event.notification, u = n && n.data && n.data.u;
  try { n.close(); } catch (e) {}
  var url = inScope(u || FALLBACK.u) || inScope(FALLBACK.u) || scope();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    var s = scope(), win = null;
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].url).indexOf(s) !== 0 || typeof list[i].focus !== 'function') continue;
      if (!win || list[i].focused) win = list[i];
    }
    if (!win) return self.clients.openWindow(url);
    // focus first (the tap allows it only for a moment), then move the page; a browser that cannot move it gets the
    // address in a message instead (assets/js/remind.js listens for { type: 'aimarg-open', url })
    var tell = function (c) { try { c.postMessage({ type: 'aimarg-open', url: url }); } catch (e) {} };
    return Promise.resolve().then(function () { return win.focus(); }).then(function (w) { return w || win; }, function () { return win; }).then(function (c) {
      if (typeof c.navigate !== 'function') return tell(c);
      return Promise.resolve().then(function () { return c.navigate(url); }).then(null, function () { tell(c); });
    });
  }));
});
