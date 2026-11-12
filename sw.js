var V = "ka-v10";
var CORE = ["./", "inicio.html", "mapa.html", "avatar.html", "region-creacion.html", "atelier-yelioki.html", "lienzo.html", "talleres.html", "taller-invitaciones.html", "taller-toppers.html", "toppers.js", "laboratorio-3d.html", "visor-3d.html", "taller-afiches.html", "lab3d.js", "personal3d.js", "corte3d.js", "packs-ka.js", "editor-ka.js", "editor-ka.css", "pwa.js", "ka-nav.js", "escena-ka.js", "capa-fondo.webp", "capa-medio.webp", "capa-frente.webp", "tepuy-cielo.jpg", "ka-ambiente.js", "ka-mundo.json", "manifest.webmanifest", "icon-192.png", "icon-512.png", "niebla1.png", "niebla2.png", "tepuy-fondo.jpg", "tepuy-ka.png", "mawari.png", "kaorai.png", "seyuma.png", "orukai.png", "aura.png", "marco-avatar.png", "panel-ka.png", "fondo-ka.jpg"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(V).then(function (c) { return Promise.all(CORE.map(function (u) { return c.add(u).catch(function () {}); })); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin || r.headers.has("range") || /\.(mp4|mp3)$/i.test(u.pathname)) return;
  if (r.mode === "navigate") {
    e.respondWith(fetch(r).then(function (res) { var cp = res.clone(); caches.open(V).then(function (c) { c.put(r, cp); }); return res; }).catch(function () { return caches.match(r).then(function (m) { return m || caches.match("inicio.html"); }); }));
    return;
  }
  if (/\.json$/i.test(u.pathname)) { e.respondWith(fetch(r).catch(function () { return caches.match(r); })); return; }
  e.respondWith(caches.match(r).then(function (m) {
    var red = fetch(r).then(function (res) { if (res && res.ok) { var cp = res.clone(); caches.open(V).then(function (c) { c.put(r, cp); }); } return res; }).catch(function () { return m; });
    return m || red;
  }));
});
