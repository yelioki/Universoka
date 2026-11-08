(function () {
  var h = document.head;
  function add(tag, attrs) { var e = document.createElement(tag); for (var k in attrs) e.setAttribute(k, attrs[k]); h.appendChild(e); }
  if (!document.querySelector('link[rel="manifest"]')) add("link", { rel: "manifest", href: "manifest.webmanifest" });
  if (!document.querySelector('meta[name="theme-color"]')) add("meta", { name: "theme-color", content: "#0b1d1f" });
  add("link", { rel: "apple-touch-icon", href: "icon-192.png" });
  add("meta", { name: "apple-mobile-web-app-capable", content: "yes" });
  add("meta", { name: "mobile-web-app-capable", content: "yes" });

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }

  var instalada = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone;
  if (instalada) return;
  var evento = null, pill = null;
  function crear(texto, alClick) {
    if (pill) return;
    pill = document.createElement("button");
    pill.textContent = texto;
    pill.style.cssText = "position:fixed;left:16px;bottom:16px;z-index:90;padding:11px 16px;border:1px solid rgba(123,230,214,.5);border-radius:20px;background:rgba(0,0,0,.55);backdrop-filter:blur(8px);color:#fff;font:600 14px system-ui,sans-serif;cursor:pointer";
    pill.onclick = alClick; document.body.appendChild(pill);
  }
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault(); evento = e;
    crear("📲 Instalar app", function () { evento.prompt(); evento.userChoice.finally(function () { if (pill) pill.remove(); pill = null; }); });
  });
  window.addEventListener("appinstalled", function () { if (pill) pill.remove(); });
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
    window.addEventListener("DOMContentLoaded", function () {
      crear("📲 Instalar app", function () { alert("En Safari toca el botón Compartir (el cuadrado con la flecha) y luego «Añadir a pantalla de inicio»."); });
    });
  }
})();
