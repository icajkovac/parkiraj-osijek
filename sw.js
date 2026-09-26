/* Parkiraj Osijek — service worker
   Stranica: prvo mreža (uvijek najnovija verzija), bez signala iz spremnika.
   Leaflet i fontovi: iz spremnika. Podloga karte: spremnik s ograničenjem. */
var VER = "po-v4-2026-09-26";
var CORE = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"];
var TILES = "po-tiles", MAX_TILES = 400;

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VER).then(function (c) {
    return Promise.all(CORE.map(function (u) { return c.add(u).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VER && k !== TILES; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
function trim(name, max) {
  caches.open(name).then(function (c) { c.keys().then(function (ks) {
    if (ks.length > max) ks.slice(0, ks.length - max).forEach(function (k) { c.delete(k); });
  }); });
}
self.addEventListener("fetch", function (e) {
  var r = e.request; if (r.method !== "GET") return;
  var u = new URL(r.url);
  if (u.hostname.indexOf("goatcounter") >= 0 || u.hostname === "gc.zgo.at") return;   // statistika uvijek ide mrežom
  // stranica (navigacija): mreža, pa spremnik
  if (r.mode === "navigate" || (u.origin === location.origin && /\/(index\.html)?$/.test(u.pathname))) {
    e.respondWith(fetch(r).then(function (res) {
      var cp = res.clone(); caches.open(VER).then(function (c) { c.put("./index.html", cp); }); return res;
    }).catch(function () { return caches.match("./index.html").then(function (m) { return m || caches.match("./"); }); }));
    return;
  }
  // podloga karte: spremnik, pa mreža (i spremi)
  if (u.hostname === "server.arcgisonline.com") {
    e.respondWith(caches.open(TILES).then(function (c) { return c.match(r).then(function (m) {
      if (m) return m;
      return fetch(r).then(function (res) { if (res.ok || res.type === "opaque") { c.put(r, res.clone()); trim(TILES, MAX_TILES); } return res; });
    }); }));
    return;
  }
  // ostalo (leaflet, fontovi, ikone): spremnik, pa mreža
  e.respondWith(caches.match(r).then(function (m) {
    return m || fetch(r).then(function (res) {
      if (res.ok && (u.origin === location.origin || /cdnjs|fonts\.(googleapis|gstatic)/.test(u.hostname))) {
        var cp = res.clone(); caches.open(VER).then(function (c) { c.put(r, cp); });
      }
      return res;
    });
  }));
});
