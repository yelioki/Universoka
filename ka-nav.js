/* Ka · navegación común: barra inferior, presencia y silencio.
   Uso: <script src="ka-nav.js" data-aqui="tepuy|creacion" data-sin-presencia></script> */
(function () {
  var s = document.currentScript || {}, aqui = (s.getAttribute && s.getAttribute("data-aqui")) || "";
  var sinPres = s.hasAttribute && s.hasAttribute("data-sin-presencia");
  function leer(k) { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }
  function guardar(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var nombre = leer("nombreAvatar"), foto = leer("personajeAvatar");

  var css = document.createElement("style");
  css.textContent =
    ".ka-barra{position:fixed;left:50%;bottom:max(10px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:80;display:flex;gap:2px;padding:6px;border-radius:28px;background:rgba(6,20,22,.72);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(123,230,214,.28);box-shadow:0 0 30px rgba(0,0,0,.45);max-width:calc(100vw - 16px)}" +
    ".ka-barra a,.ka-barra button{all:unset;box-sizing:border-box;cursor:pointer;min-width:64px;min-height:50px;padding:5px 8px;border-radius:22px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font:600 11px/1.1 'Segoe UI',system-ui,sans-serif;color:#e8fffb;text-align:center;-webkit-tap-highlight-color:transparent}" +
    ".ka-barra .i{font-size:20px;line-height:1;display:block;width:24px;height:24px;border-radius:50%;overflow:hidden}" +
    ".ka-barra .i img{width:100%;height:100%;object-fit:cover;display:block}" +
    ".ka-barra a:focus-visible,.ka-barra button:focus-visible{outline:2px solid #7be6d6}" +
    ".ka-barra .on{background:rgba(123,230,214,.22);color:#fff;box-shadow:inset 0 0 0 1px rgba(123,230,214,.5)}" +
    ".ka-barra .dorm{opacity:.6}" +
    ".ka-chip{position:fixed;top:14px;right:14px;z-index:60;display:flex;align-items:center;gap:8px;padding:4px 12px 4px 4px;border-radius:24px;background:rgba(6,20,22,.6);backdrop-filter:blur(10px);border:1px solid rgba(123,230,214,.3);color:#fff;font:600 13px 'Segoe UI',system-ui,sans-serif;max-width:46vw;text-decoration:none}" +
    ".ka-chip .av{width:34px;height:34px;border-radius:50%;overflow:hidden;background:rgba(123,230,214,.2);display:grid;place-items:center;flex:0 0 34px}" +
    ".ka-chip .av img{width:100%;height:100%;object-fit:cover}" +
    ".ka-chip span.n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    ".ka-aviso{position:fixed;left:50%;bottom:86px;transform:translateX(-50%);z-index:85;max-width:min(92vw,340px);padding:12px 16px;border-radius:20px;background:rgba(0,0,0,.78);border:1px solid rgba(123,230,214,.35);color:#fff;font:14px/1.5 'Segoe UI',system-ui,sans-serif;text-align:center}" +
    "body{padding-bottom:0}.ka-espacio{height:84px}";
  document.head.appendChild(css);

  var aviso = null, tAviso = 0;
  function avisar(t) {
    if (!aviso) { aviso = document.createElement("div"); aviso.className = "ka-aviso"; aviso.setAttribute("role", "status"); document.body.appendChild(aviso); }
    aviso.textContent = t; aviso.hidden = false; clearTimeout(tAviso); tAviso = setTimeout(function () { aviso.hidden = true; }, 3800);
  }
  window.KaNav = { avisar: avisar };

  function item(tag, id, ico, txt, href) {
    var e = document.createElement(tag);
    if (href) e.href = href;
    if (id === aqui) { e.className = "on"; if (href) e.setAttribute("aria-current", "page"); }
    var i = document.createElement("span"); i.className = "i";
    if (typeof ico === "string") i.textContent = ico; else i.appendChild(ico);
    var t = document.createElement("span"); t.textContent = txt;
    e.appendChild(i); e.appendChild(t); return e;
  }

  var barra = document.createElement("nav"); barra.className = "ka-barra"; barra.setAttribute("aria-label", "Universo Ka");
  barra.appendChild(item("a", "tepuy", "🏔️", "Tepuy", "mapa.html"));
  var circ = item("button", "circulo", "🌿", "Círculo");
  circ.className += " dorm"; circ.type = "button";
  circ.onclick = function () { avisar("El Círculo Ka, el refugio de los creadores, aún se está preparando 🌿"); };
  barra.appendChild(circ);
  barra.appendChild(item("a", "creacion", "✨", "Creación", "region-creacion.html"));
  var yo = foto ? (function () { var im = document.createElement("img"); im.src = foto; im.alt = ""; return im; })() : "🙂";
  barra.appendChild(item("a", "yo", yo, "Mi presencia", "avatar.html"));

  /* silencio: solo si la página tiene sonido ambiente */
  var audios = document.querySelectorAll("audio");
  if (audios.length) {
    var mudo = leer("ka_mudo") === "1";
    var sb = item("button", "sonido", mudo ? "🔇" : "🔊", mudo ? "Sin sonido" : "Sonido"); sb.type = "button";
    sb.setAttribute("aria-pressed", mudo ? "true" : "false");
    function aplicar() {
      Array.prototype.forEach.call(document.querySelectorAll("audio"), function (a) { a.muted = mudo; });
      if (window.KaAmbiente) KaAmbiente.mudo(mudo);
      sb.firstChild.textContent = mudo ? "🔇" : "🔊"; sb.lastChild.textContent = mudo ? "Sin sonido" : "Sonido";
      sb.setAttribute("aria-pressed", mudo ? "true" : "false");
    }
    sb.onclick = function () { mudo = !mudo; guardar("ka_mudo", mudo ? "1" : "0"); aplicar(); };
    barra.appendChild(sb); aplicar();
  }

  /* la música sigue donde se quedó al cambiar de página, y entra con un fundido */
  var amb = document.getElementById("sonidoAmbiente");
  if (amb) {
    var t0 = 0; try { t0 = parseFloat(sessionStorage.getItem("ka_t")) || 0; } catch (e) {}
    amb.addEventListener("loadedmetadata", function () { if (t0 > 0 && t0 < amb.duration - 2) { try { amb.currentTime = t0; } catch (e) {} } });
    if (amb.readyState >= 1 && t0 > 0 && t0 < amb.duration - 2) amb.currentTime = t0;
    amb.addEventListener("play", function () {
      var meta = amb.volume, v = 0, paso = meta / 30; amb.volume = 0;
      var f = setInterval(function () { v += paso; if (v >= meta) { amb.volume = meta; clearInterval(f); } else amb.volume = v; }, 50);
    });
    function guardarT() { try { sessionStorage.setItem("ka_t", String(amb.currentTime || 0)); } catch (e) {} }
    window.addEventListener("pagehide", guardarT); setInterval(guardarT, 3000);
  }
  document.body.appendChild(barra);
  /* ambiente de selva (agua, aire, aves) sobre la melodía */
  if (audios.length) {
    var sa = document.createElement("script"); sa.src = "ka-ambiente.js";
    sa.onload = function () { if (window.KaAmbiente && leer("ka_mudo") === "1") KaAmbiente.mudo(true); };
    document.head.appendChild(sa);
    document.addEventListener("pointerdown", function () { if (window.KaAmbiente) KaAmbiente.iniciar(); }, { once: true });
  }

  if (!sinPres) {
    var ch = document.createElement("a"); ch.className = "ka-chip"; ch.href = "avatar.html"; ch.title = "Mi presencia";
    var av = document.createElement("span"); av.className = "av";
    if (foto) { var im = document.createElement("img"); im.src = foto; im.alt = ""; av.appendChild(im); } else av.textContent = "🙂";
    var n = document.createElement("span"); n.className = "n"; n.textContent = nombre || "Viajera";
    ch.appendChild(av); ch.appendChild(n); document.body.appendChild(ch);
  }
  var sp = document.createElement("div"); sp.className = "ka-espacio"; sp.setAttribute("aria-hidden", "true");
  if (aqui !== "tepuy") document.body.appendChild(sp);
})();
