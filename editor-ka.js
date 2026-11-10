/* Editor Ka · motor compartido de los talleres de Universo Ka (Yelioki)
   Un solo motor, muchos talleres: cada taller solo cambia su configuración.
   Elementos: texto, sellos (emoji o PNG), fotos. Todo se queda en el dispositivo. */
(function () {
  "use strict";

  var FUENTES = [
    { n: "Great Vibes" }, { n: "Dancing Script", w: "400;700" }, { n: "Pacifico" }, { n: "Lobster" },
    { n: "Sacramento" }, { n: "Caveat", w: "400;700" }, { n: "Fredoka", w: "400;700" }, { n: "Baloo 2", w: "400;700" },
    { n: "Quicksand", w: "400;700" }, { n: "Montserrat", w: "400;700" }, { n: "Playfair Display", w: "400;700" },
    { n: "Cinzel", w: "400;700" }, { n: "Bebas Neue" }, { n: "Amatic SC", w: "400;700" }
  ];
  var PALETA = ["#2b2b2b", "#FFFFFF", "#C0392B", "#E0457B", "#E8A5B5", "#F6C945", "#B08D57", "#7FA8D6", "#2C9090", "#1E7B4A", "#8C6A3F", "#6B4FA0"];
  var FONDOS_COLOR = ["#FFFFFF", "#FFF6EE", "#F4EFE3", "#FFE3EC", "#F7D9D5", "#FFF4C9", "#DDEFF0", "#EAF4FB", "#E4F3DD", "#EADFF7", "#14213D", "#0b1d1f", "#2b2b2b", "#C0392B"];
  var FONDOS_GRAD = [
    { c: ["#FFE3EC", "#FFF4C9"], ang: 160 }, { c: ["#DDEFF0", "#FFFFFF"], ang: 180 }, { c: ["#EADFF7", "#FFD9EC"], ang: 150 },
    { c: ["#CDE8B5", "#FFF1C9"], ang: 170 }, { c: ["#FFB88C", "#FF7EB3"], ang: 160 }, { c: ["#1b1740", "#7a4fd0"], ang: 180 },
    { c: ["#14213D", "#2C9090"], ang: 160 }, { c: ["#F6D365", "#FDA085"], ang: 150 }, { c: ["#A1C4FD", "#C2E9FB"], ang: 180 },
    { c: ["#0b1d1f", "#1E7B4A"], ang: 170 }
  ];
  var SELLOS = {
    "Fiesta": ["🎈", "🎉", "🎊", "🎂", "🧁", "🍰", "🎁", "🎀", "🥳", "🎵", "🍭", "🍬", "🪅", "🎠"],
    "Bebé": ["🧸", "🍼", "👶", "🐥", "🐣", "🌙", "⭐", "☁️", "💛", "🦄", "🐑", "🐘", "🦒", "🧦"],
    "Boda y bautizo": ["💍", "💐", "🌹", "🕊️", "💒", "🥂", "👰", "🤵", "💕", "❤️", "🌸", "🌿", "🤍", "✝️"],
    "Naturaleza": ["🌸", "🌼", "🌻", "🌿", "🍃", "🌈", "🦋", "🐝", "🍀", "☀️", "🍂", "🌺", "🌷", "🪻"],
    "Brillos": ["✨", "⭐", "🌟", "💫", "🎇", "🎆", "💎", "👑", "🪄", "💖", "💜", "💙", "💚", "🔮"],
    "Navidad": ["🎄", "🎅", "🤶", "🎁", "⛄", "❄️", "🦌", "🔔", "🕯️", "🍪", "🧦", "🌟"],
    "Halloween": ["🎃", "👻", "🦇", "🕷️", "🕸️", "💀", "🍬", "🧙", "🌙"]
  };
  var PRESETS_TEXTO = [
    { nombre: "Título", texto: "¡Estás invitado!", fuente: "Pacifico", tam: 120 },
    { nombre: "Nombre", texto: "Nombre", fuente: "Great Vibes", tam: 190 },
    { nombre: "Subtítulo", texto: "Te esperamos para celebrar", fuente: "Quicksand", tam: 58, neg: true },
    { nombre: "Fecha y hora", texto: "Sábado 12 de diciembre\n16:00 hrs", fuente: "Montserrat", tam: 52, neg: true },
    { nombre: "Lugar", texto: "Dirección del evento", fuente: "Montserrat", tam: 44 },
    { nombre: "Confirmar", texto: "Confirmar asistencia\nal +56 9 1234 5678", fuente: "Quicksand", tam: 42, neg: true }
  ];

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function chip(txt, on, fn, extra) { var b = el("button", "chip" + (on ? " on" : "") + (extra ? " " + extra : ""), txt); b.type = "button"; b.onclick = fn; return b; }
  function clon(x) { return JSON.parse(JSON.stringify(x)); }
  function lumi(hex) {
    var h = String(hex || "#fff").replace("#", ""); if (h.length === 3) h = h.replace(/./g, "$&$&");
    var r = parseInt(h.substr(0, 2), 16) || 0, g = parseInt(h.substr(2, 2), 16) || 0, b = parseInt(h.substr(4, 2), 16) || 0;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }
  function mdNum(s) { var p = String(s).split("-"); return parseInt(p[0], 10) * 100 + parseInt(p[1], 10); }
  function enRango(t) {
    if (!t.desde || !t.hasta) return true;
    var d = new Date(), hoy = (d.getMonth() + 1) * 100 + d.getDate(), a = mdNum(t.desde), b = mdNum(t.hasta);
    return a <= b ? (hoy >= a && hoy <= b) : (hoy >= a || hoy <= b);
  }
  function esRuta(s) { return /\.(png|jpe?g|webp|gif|svg)$/i.test(s || "") || /^pack:/.test(s || ""); }
  function inyectarFuentes() {
    if (document.getElementById("ekFuentes")) return;
    var fam = FUENTES.map(function (f) { return "family=" + f.n.replace(/ /g, "+") + (f.w ? ":wght@" + f.w : ""); }).join("&");
    var l = document.createElement("link"); l.id = "ekFuentes"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?" + fam + "&display=swap"; document.head.appendChild(l);
  }

  function montar(cfg) {
    inyectarFuentes();
    var raiz = document.querySelector(cfg.raiz);
    var F = cfg.formatos;
    var KEY = "ka_proy_" + cfg.taller;
    var S = { w: F[0].w, h: F[0].h, bg: { tipo: "color", c: "#FFF6EE" }, objs: [] };
    var fmtId = cfg.formato || F[0].id;
    var sel = null, fotos = {}, cache = {}, hist = [], hpos = -1, sucio = false, idn = 1, nfoto = 1;
    var plantillas = [], temas = [], tabAct = "plantillas", catAct = "Todas", ocupado = false;
    var mc = document.createElement("canvas").getContext("2d");
    var timerTxt = null;

    raiz.innerHTML =
      '<div class="glass ek-barra"><div class="fila" id="ekFormatos"><span class="etq">Formato</span></div></div>' +
      '<div class="marco" id="ekMarco"><canvas id="ekCv"></canvas></div>' +
      '<p class="ek-ayuda" id="ekAyuda">Toca un elemento para editarlo · arrastra la esquina ⤡ para agrandar y girar · pellizca con dos dedos</p>' +
      '<div class="glass panel" id="ekSel" hidden></div>' +
      '<div class="glass ek-tabs" id="ekTabs"></div>' +
      '<div class="glass panel" id="ekPanel"></div>' +
      '<div class="acciones"><button class="btn sec" id="ekUndo" type="button">↩ Deshacer</button><button class="btn sec" id="ekRedo" type="button">↪ Rehacer</button>' +
      '<button class="btn" id="ekDesc" type="button">⬇ Descargar</button><button class="btn" id="ekComp" type="button">📤 Compartir</button></div>' +
      '<div class="fila" style="margin-top:10px;justify-content:center" id="ekCalidad"></div>' +
      '<a class="btn wa" id="ekWa" style="margin-top:12px" target="_blank" rel="noopener">💬 Pedir este diseño a Yelioki</a>' +
      '<p class="msg" id="ekMsg"></p>';

    var cv = $("ekCv"), c2 = cv.getContext("2d"), marco = $("ekMarco");
    var calidad = 1;

    /* ---------- imágenes ---------- */
    function cargar(src) {
      var u = fotos[src] || (window.PacksKa && PacksKa.url(src)) || src, c = cache[u];
      if (c) return c.p;
      c = cache[u] = { ok: false, img: new Image() };
      c.p = new Promise(function (res) {
        c.img.onload = function () { c.ok = true; res(c.img); dibujar(); };
        c.img.onerror = function () { c.err = true; res(null); };
      });
      c.img.src = u;
      return c.p;
    }
    function getImg(src) { var u = fotos[src] || (window.PacksKa && PacksKa.url(src)) || src, c = cache[u]; if (!c) { cargar(src); return null; } return c.ok ? c.img : null; }
    function fuentesUsadas(st) {
      var u = {}; st.objs.forEach(function (o) { if (o.t === "texto") u[o.fuente] = 1; }); return Object.keys(u);
    }
    function asegurarFuentes(st) {
      if (!document.fonts || !document.fonts.load) return Promise.resolve();
      return Promise.all(fuentesUsadas(st || S).map(function (f) { return document.fonts.load('40px "' + f + '"').catch(function () {}); }));
    }
    function precargar(st) {
      var p = [asegurarFuentes(st)];
      if (st.bg.tipo === "img" && st.bg.src) p.push(cargar(st.bg.src));
      st.objs.forEach(function (o) { if (o.src) p.push(cargar(o.src)); });
      return Promise.all(p);
    }

    /* ---------- medidas ---------- */
    function fuenteCSS(o) { return (o.neg ? "bold " : "") + o.tam + 'px "' + o.fuente + '", cursive, sans-serif'; }
    function lineas(o) { return String(o.texto == null ? "" : o.texto).split("\n"); }
    function tamObj(o) {
      if (o.t === "texto") {
        mc.font = fuenteCSS(o); var L = lineas(o), w = 0;
        L.forEach(function (l) { w = Math.max(w, mc.measureText(l || " ").width); });
        return { w: Math.max(w, 24), h: Math.max(L.length * o.tam * (o.lh || 1.2), o.tam) };
      }
      if (o.t === "sello") return { w: o.tam, h: o.tam };
      var im = getImg(o.src); if (im) o.r = im.naturalHeight / im.naturalWidth;
      var r = o.r || 1;
      if (o.forma === "circ" || o.forma === "cora") return { w: o.bw, h: o.bw };
      return { w: o.bw, h: o.bw * r };
    }
    function aCanvas(o, lx, ly) {
      var e = o.esc || 1, r = o.rot || 0; lx *= e; ly *= e;
      return { x: o.x + lx * Math.cos(r) - ly * Math.sin(r), y: o.y + lx * Math.sin(r) + ly * Math.cos(r) };
    }
    function aLocal(o, px, py) {
      var e = o.esc || 1, r = -(o.rot || 0), dx = px - o.x, dy = py - o.y;
      return { x: (dx * Math.cos(r) - dy * Math.sin(r)) / e, y: (dx * Math.sin(r) + dy * Math.cos(r)) / e };
    }
    function K() { return (cv.getBoundingClientRect().width || 360) / S.w; }

    /* ---------- dibujo ---------- */
    function rectRedondo(c, x, y, w, h, r) {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    }
    function corazon(c, w) {
      var s = w / 2; c.beginPath(); c.moveTo(0, s * 0.9);
      c.bezierCurveTo(-s * 1.25, s * 0.15, -s * 0.95, -s * 0.95, 0, -s * 0.4);
      c.bezierCurveTo(s * 0.95, -s * 0.95, s * 1.25, s * 0.15, 0, s * 0.9); c.closePath();
    }
    function fondo(c, w, h, bg) {
      if (bg.tipo === "grad") {
        var a = ((bg.ang == null ? 160 : bg.ang) * Math.PI) / 180, L = Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a));
        var dx = Math.sin(a) * L / 2, dy = -Math.cos(a) * L / 2, g = c.createLinearGradient(w / 2 - dx, h / 2 - dy, w / 2 + dx, h / 2 + dy);
        bg.c.forEach(function (col, i) { g.addColorStop(bg.c.length > 1 ? i / (bg.c.length - 1) : 0, col); });
        c.fillStyle = g; c.fillRect(0, 0, w, h);
      } else if (bg.tipo === "img") {
        c.fillStyle = "#F4EFE3"; c.fillRect(0, 0, w, h);
        var im = getImg(bg.src);
        if (im) { var s = Math.max(w / im.naturalWidth, h / im.naturalHeight), iw = im.naturalWidth * s, ih = im.naturalHeight * s; c.drawImage(im, (w - iw) / 2, (h - ih) / 2, iw, ih); }
      } else { c.fillStyle = bg.c || "#fff"; c.fillRect(0, 0, w, h); }
    }
    function dibujarObj(c, o) {
      var d = tamObj(o);
      c.save(); c.translate(o.x, o.y); c.rotate(o.rot || 0); c.scale(o.esc || 1, o.esc || 1);
      if (o.t === "texto") {
        c.font = fuenteCSS(o); c.textAlign = o.align || "center"; c.textBaseline = "middle";
        var L = lineas(o), lh = o.tam * (o.lh || 1.2), y0 = -(L.length - 1) * lh / 2;
        var ax = o.align === "left" ? -d.w / 2 : o.align === "right" ? d.w / 2 : 0;
        L.forEach(function (l, i) {
          var y = y0 + i * lh;
          if (o.borde) {
            c.shadowColor = o.sombra ? "rgba(0,0,0,.35)" : "transparent"; c.shadowBlur = o.tam * 0.12; c.shadowOffsetY = o.tam * 0.05;
            c.lineWidth = o.tam * 0.14; c.lineJoin = "round"; c.strokeStyle = o.borde; c.strokeText(l, ax, y);
            c.shadowColor = "transparent";
          } else if (o.sombra) { c.shadowColor = "rgba(0,0,0,.35)"; c.shadowBlur = o.tam * 0.12; c.shadowOffsetY = o.tam * 0.05; }
          c.fillStyle = o.color || "#2b2b2b"; c.fillText(l, ax, y); c.shadowColor = "transparent";
        });
      } else if (o.t === "sello") {
        if (o.e) {
          c.font = Math.round(o.tam * 0.84) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
          c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(o.e, 0, o.tam * 0.04);
        } else {
          var im = getImg(o.src);
          if (im) { var s = Math.min(o.tam / im.naturalWidth, o.tam / im.naturalHeight); c.drawImage(im, -im.naturalWidth * s / 2, -im.naturalHeight * s / 2, im.naturalWidth * s, im.naturalHeight * s); }
        }
      } else {
        var im2 = getImg(o.src);
        if (im2) {
          c.save();
          if (o.forma === "circ") { c.beginPath(); c.arc(0, 0, d.w / 2, 0, 6.2832); c.clip(); }
          else if (o.forma === "cora") { corazon(c, d.w); c.clip(); }
          else if (o.forma === "redond") { rectRedondo(c, -d.w / 2, -d.h / 2, d.w, d.h, d.w * 0.06); c.clip(); }
          var sc = Math.max(d.w / im2.naturalWidth, d.h / im2.naturalHeight), iw = im2.naturalWidth * sc, ih = im2.naturalHeight * sc;
          c.drawImage(im2, -iw / 2, -ih / 2, iw, ih); c.restore();
        } else { c.fillStyle = "rgba(0,0,0,.12)"; c.fillRect(-d.w / 2, -d.h / 2, d.w, d.h); }
      }
      c.restore();
    }
    function pintar(c, st, opt) {
      fondo(c, st.w, st.h, st.bg);
      st.objs.forEach(function (o) { dibujarObj(c, o); });
      if (opt && opt.marca) {
        var t = "Hecho en Universo Ka · Yelioki", fs = Math.round(st.w * 0.024);
        c.save(); c.font = "600 " + fs + "px 'Segoe UI',system-ui,sans-serif"; c.textAlign = "center"; c.textBaseline = "alphabetic";
        c.lineWidth = fs * 0.28; c.strokeStyle = "rgba(255,255,255,.55)"; c.fillStyle = "rgba(40,40,40,.62)";
        c.strokeText(t, st.w / 2, st.h - fs * 1.1); c.fillText(t, st.w / 2, st.h - fs * 1.1); c.restore();
      }
    }
    var guiaX = false;
    function manejos(o) {
      var d = tamObj(o), pad = 9 / (K() * (o.esc || 1)), hw = d.w / 2 + pad, hh = d.h / 2 + pad;
      return { tl: aCanvas(o, -hw, -hh), tr: aCanvas(o, hw, -hh), br: aCanvas(o, hw, hh), bl: aCanvas(o, -hw, hh) };
    }
    function dibujar() {
      if (cv.width !== S.w) cv.width = S.w; if (cv.height !== S.h) cv.height = S.h;
      c2.clearRect(0, 0, S.w, S.h); pintar(c2, S, null);
      if (guiaX) { c2.save(); c2.strokeStyle = "rgba(224,69,123,.8)"; c2.lineWidth = 2 / K(); c2.setLineDash([10 / K(), 8 / K()]); c2.beginPath(); c2.moveTo(S.w / 2, 0); c2.lineTo(S.w / 2, S.h); c2.stroke(); c2.restore(); }
      var o = obj(sel); if (!o) return;
      var m = manejos(o), k = K(), R = 15 / k;
      c2.save(); c2.lineWidth = 2 / k; c2.setLineDash([8 / k, 6 / k]);
      c2.beginPath(); c2.moveTo(m.tl.x, m.tl.y); c2.lineTo(m.tr.x, m.tr.y); c2.lineTo(m.br.x, m.br.y); c2.lineTo(m.bl.x, m.bl.y); c2.closePath();
      c2.strokeStyle = "rgba(255,255,255,.95)"; c2.lineWidth = 4 / k; c2.stroke(); c2.strokeStyle = "#2d8f89"; c2.lineWidth = 2 / k; c2.stroke(); c2.setLineDash([]);
      function bola(p, col, txt) {
        c2.beginPath(); c2.arc(p.x, p.y, R, 0, 6.2832); c2.fillStyle = col; c2.fill(); c2.lineWidth = 2 / k; c2.strokeStyle = "#fff"; c2.stroke();
        c2.fillStyle = "#fff"; c2.font = "bold " + (R * 1.15) + "px sans-serif"; c2.textAlign = "center"; c2.textBaseline = "middle"; c2.fillText(txt, p.x, p.y + R * 0.05);
      }
      bola(m.br, "#2d8f89", "⤡"); bola(m.tl, "#d6455d", "✕"); c2.restore();
    }

    /* ---------- estado ---------- */
    function obj(id) { for (var i = 0; i < S.objs.length; i++) if (S.objs[i].id === id) return S.objs[i]; return null; }
    function nid() { return "o" + (idn++); }
    function snap() { return JSON.stringify({ w: S.w, h: S.h, bg: S.bg, objs: S.objs, fmt: fmtId }); }
    function commit() {
      var s = snap(); if (hist[hpos] === s) return;
      hist = hist.slice(0, hpos + 1); hist.push(s); if (hist.length > 50) hist.shift(); hpos = hist.length - 1; sucio = true; botonesHist(); guardarAuto();
    }
    function restaurar(s) {
      var d = JSON.parse(s); S.w = d.w; S.h = d.h; S.bg = d.bg; S.objs = d.objs; fmtId = d.fmt || fmtId;
      if (!obj(sel)) sel = null; ajustarMarco(); renderFormatos(); renderSel(); precargar(S).then(dibujar); dibujar();
    }
    function botonesHist() { $("ekUndo").disabled = hpos <= 0; $("ekRedo").disabled = hpos >= hist.length - 1; }
    $("ekUndo").onclick = function () { if (hpos > 0) { hpos--; restaurar(hist[hpos]); botonesHist(); guardarAuto(); } };
    $("ekRedo").onclick = function () { if (hpos < hist.length - 1) { hpos++; restaurar(hist[hpos]); botonesHist(); guardarAuto(); } };

    function ajustarMarco() {
      cv.width = S.w; cv.height = S.h;
      marco.style.aspectRatio = S.w + " / " + S.h;
      marco.style.width = "min(100%, " + (Math.round(7200 * S.w / S.h) / 100) + "vh)";
    }
    function msg(t) { $("ekMsg").textContent = t || ""; if (t) { clearTimeout(msg.t); msg.t = setTimeout(function () { $("ekMsg").textContent = ""; }, 4500); } }

    function guardarAuto() {
      try {
        var d = { w: S.w, h: S.h, bg: S.bg, objs: S.objs, fmt: fmtId, fotos: fotos };
        var s = JSON.stringify(d);
        if (s.length > 3500000) { d.fotos = {}; s = JSON.stringify(d); msg("Tu diseño tiene fotos grandes: no se guardarán solas, descárgalo para no perderlo."); }
        localStorage.setItem(KEY, s);
      } catch (e) { }
    }
    function cargarAuto() {
      try {
        var d = JSON.parse(localStorage.getItem(KEY) || "null");
        if (d && d.objs && d.objs.length) {
          fotos = d.fotos || {}; S.w = d.w; S.h = d.h; S.bg = d.bg; S.objs = d.objs; fmtId = d.fmt || fmtId;
          S.objs.forEach(function (o) { var n = parseInt(String(o.id).replace("o", ""), 10); if (n >= idn) idn = n + 1; });
          Object.keys(fotos).forEach(function (k) { var n = parseInt(k.replace("f", ""), 10); if (n >= nfoto) nfoto = n + 1; });
          return true;
        }
      } catch (e) { }
      return false;
    }

    /* ---------- formatos ---------- */
    function renderFormatos() {
      var f = $("ekFormatos"); while (f.children.length > 1) f.removeChild(f.lastChild);
      F.forEach(function (x) { f.appendChild(chip(x.nombre, x.id === fmtId, function () { cambiarFormato(x.id); })); });
    }
    function cambiarFormato(id) {
      var f = F.filter(function (x) { return x.id === id; })[0]; if (!f || id === fmtId) return;
      var rx = f.w / S.w, ry = f.h / S.h; S.objs.forEach(function (o) { o.x *= rx; o.y *= ry; });
      S.w = f.w; S.h = f.h; fmtId = id; ajustarMarco(); renderFormatos(); dibujar(); commit();
    }

    /* ---------- selección y edición ---------- */
    function elegir(id) { sel = id; renderSel(); dibujar(); }
    function colorTexto() {
      var b = S.bg, ref = b.tipo === "grad" ? b.c[Math.floor(b.c.length / 2)] : b.tipo === "color" ? b.c : "#F4EFE3";
      return lumi(ref) < 0.45 ? "#FFFFFF" : "#2b2b2b";
    }
    function nuevoObj(o) {
      o.id = nid(); o.rot = o.rot || 0; o.esc = o.esc || 1;
      S.objs.push(o); sel = o.id; renderSel(); dibujar(); commit(); return o;
    }
    function centroLibre() { var n = S.objs.length; return { x: S.w / 2 + ((n % 5) - 2) * 36, y: S.h / 2 + ((n % 5) - 2) * 36 }; }
    function añadirTexto(p) {
      var pos = centroLibre(), o = { t: "texto", x: pos.x, y: pos.y, texto: p.texto, fuente: p.fuente, tam: p.tam, neg: !!p.neg, color: p.color || colorTexto(), align: "center", sombra: false, borde: "" };
      asegurarFuentes({ objs: [o] }).then(dibujar); nuevoObj(o); setTimeout(function () { var t = $("ekTxt"); if (t && matchMedia("(pointer:fine)").matches) { t.focus(); t.select(); } }, 30);
    }
    function añadirSello(s) {
      var pos = centroLibre(), o = { t: "sello", x: pos.x, y: pos.y, tam: 240 };
      if (esRuta(s)) o.src = s; else o.e = s; nuevoObj(o);
    }
    function reducirFoto(file, max) {
      return new Promise(function (res, rej) {
        var fr = new FileReader();
        fr.onload = function () {
          var im = new Image();
          im.onload = function () {
            var s = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)), w = Math.round(im.naturalWidth * s), h = Math.round(im.naturalHeight * s);
            var cc = document.createElement("canvas"); cc.width = w; cc.height = h; cc.getContext("2d").drawImage(im, 0, 0, w, h);
            res(cc.toDataURL("image/jpeg", 0.88));
          };
          im.onerror = rej; im.src = fr.result;
        };
        fr.onerror = rej; fr.readAsDataURL(file);
      });
    }
    function subirFoto(esFondo) {
      var inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*";
      inp.onchange = function () {
        var f = inp.files && inp.files[0]; if (!f) return;
        reducirFoto(f, esFondo ? 2000 : 1600).then(function (url) {
          var k = "f" + (nfoto++); fotos[k] = url;
          cargar(k).then(function () {
            if (esFondo) { S.bg = { tipo: "img", src: k }; dibujar(); commit(); msg("Listo, tu foto es el fondo 📷"); }
            else { var pos = centroLibre(); nuevoObj({ t: "foto", src: k, x: S.w / 2, y: pos.y, bw: S.w * 0.55, forma: "redond" }); }
          });
        }).catch(function () { msg("No pude abrir esa imagen, prueba con otra."); });
      };
      inp.click();
    }
    function borrar() { var i = S.objs.indexOf(obj(sel)); if (i >= 0) S.objs.splice(i, 1); sel = null; renderSel(); dibujar(); commit(); }
    function duplicar() { var o = obj(sel); if (!o) return; var n = clon(o); n.id = nid(); n.x += 40; n.y += 40; S.objs.push(n); sel = n.id; renderSel(); dibujar(); commit(); }
    function orden(d) {
      var o = obj(sel), i = S.objs.indexOf(o), j = i + d; if (!o || j < 0 || j >= S.objs.length) return;
      S.objs.splice(i, 1); S.objs.splice(j, 0, o); dibujar(); commit();
    }

    var refEsc = null, refRot = null;
    function renderSel() {
      var o = obj(sel), box = $("ekSel"); box.innerHTML = "";
      $("ekAyuda").hidden = !!o; box.hidden = !o; if (!o) return;
      box.appendChild(el("span", "etq", o.t === "texto" ? "Texto seleccionado" : o.t === "foto" ? "Foto seleccionada" : "Sello seleccionado"));
      if (o.t === "texto") {
        var ta = el("textarea"); ta.id = "ekTxt"; ta.value = o.texto; ta.setAttribute("aria-label", "Texto");
        ta.oninput = function () { o.texto = ta.value; dibujar(); clearTimeout(timerTxt); timerTxt = setTimeout(commit, 500); };
        box.appendChild(ta);
        var ff = el("div", "fila scroll"); ff.appendChild(el("span", "etq", "Letra"));
        FUENTES.forEach(function (f) {
          var b = el("button", "fu" + (o.fuente === f.n ? " on" : ""), "Aa " + f.n); b.type = "button"; b.style.fontFamily = '"' + f.n + '",cursive';
          b.onclick = function () { o.fuente = f.n; asegurarFuentes(S).then(dibujar); dibujar(); commit(); renderSel(); }; ff.appendChild(b);
        });
        box.appendChild(ff);
        var fc = el("div", "fila"); fc.appendChild(el("span", "etq", "Color"));
        PALETA.forEach(function (col) {
          var b = el("button", "sw" + (o.color === col ? " on" : "")); b.type = "button"; b.style.background = col; b.setAttribute("aria-label", col);
          b.onclick = function () { o.color = col; dibujar(); commit(); renderSel(); }; fc.appendChild(b);
        });
        var ci = el("input"); ci.type = "color"; ci.value = /^#[0-9a-f]{6}$/i.test(o.color) ? o.color : "#2b2b2b"; ci.setAttribute("aria-label", "Otro color");
        ci.oninput = function () { o.color = ci.value; dibujar(); }; ci.onchange = function () { commit(); renderSel(); }; fc.appendChild(ci);
        box.appendChild(fc);
        var fe = el("div", "fila");
        [["≡ Izq.", "left"], ["≡ Centro", "center"], ["≡ Der.", "right"]].forEach(function (a) {
          fe.appendChild(chip(a[0], (o.align || "center") === a[1], function () { o.align = a[1]; dibujar(); commit(); renderSel(); }));
        });
        fe.appendChild(chip("B Negrita", o.neg, function () { o.neg = !o.neg; dibujar(); commit(); renderSel(); }));
        fe.appendChild(chip("Sombra", o.sombra, function () { o.sombra = !o.sombra; dibujar(); commit(); renderSel(); }));
        fe.appendChild(chip("Borde", !!o.borde, function () { o.borde = o.borde ? "" : (lumi(o.color) > 0.5 ? "#000000" : "#FFFFFF"); dibujar(); commit(); renderSel(); }));
        box.appendChild(fe);
      }
      if (o.t === "foto") {
        var fo = el("div", "fila"); fo.appendChild(el("span", "etq", "Forma"));
        [["▭ Recta", "rect"], ["▢ Redondeada", "redond"], ["● Círculo", "circ"], ["♥ Corazón", "cora"]].forEach(function (a) {
          fo.appendChild(chip(a[0], (o.forma || "rect") === a[1], function () { o.forma = a[1]; dibujar(); commit(); renderSel(); }));
        }); box.appendChild(fo);
      }
      function rango(et, min, max, step, val, fn, fin) {
        var r = el("div", "rg"), l = el("label", null, et), i = el("input"); i.type = "range"; i.min = min; i.max = max; i.step = step; i.value = val; i.setAttribute("aria-label", et);
        i.oninput = function () { fn(parseFloat(i.value)); dibujar(); }; i.onchange = commit; r.appendChild(l); r.appendChild(i); box.appendChild(r); return i;
      }
      refEsc = rango("Tamaño", 0.15, 4, 0.01, o.esc || 1, function (v) { o.esc = v; });
      refRot = rango("Giro", -180, 180, 1, Math.round((o.rot || 0) * 180 / Math.PI), function (v) { o.rot = v * Math.PI / 180; });
      var fb = el("div", "fila");
      fb.appendChild(chip("⧉ Duplicar", false, duplicar)); fb.appendChild(chip("⬆ Adelante", false, function () { orden(1); }));
      fb.appendChild(chip("⬇ Atrás", false, function () { orden(-1); })); fb.appendChild(chip("🗑 Borrar", false, borrar, "peli"));
      box.appendChild(fb);
    }
    function syncSel() {
      var o = obj(sel); if (!o) return;
      if (refEsc) refEsc.value = o.esc || 1;
      if (refRot) refRot.value = Math.round((o.rot || 0) * 180 / Math.PI);
    }

    /* ---------- punteros ---------- */
    var ptrs = {}, modo = null, movido = false;
    function pt(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * S.w / r.width, y: (e.clientY - r.top) * S.h / r.height }; }
    function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    function ang(a, b) { return Math.atan2(b.y - a.y, b.x - a.x); }
    function golpe(p) {
      for (var i = S.objs.length - 1; i >= 0; i--) {
        var o = S.objs[i], d = tamObj(o), l = aLocal(o, p.x, p.y), pad = 10 / (K() * (o.esc || 1));
        if (Math.abs(l.x) <= d.w / 2 + pad && Math.abs(l.y) <= d.h / 2 + pad) return o;
      } return null;
    }
    cv.addEventListener("pointerdown", function (e) {
      e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) { }
      var p = pt(e); ptrs[e.pointerId] = p; movido = false;
      var ks = Object.keys(ptrs), o = obj(sel), R = 24 / K();
      if (ks.length === 2 && o) { modo = { t: "pinch", d0: dist(ptrs[ks[0]], ptrs[ks[1]]) || 1, a0: ang(ptrs[ks[0]], ptrs[ks[1]]), e0: o.esc || 1, r0: o.rot || 0 }; return; }
      if (o) {
        var m = manejos(o);
        if (dist(p, m.tl) <= R) { borrar(); modo = null; return; }
        if (dist(p, m.br) <= R) { modo = { t: "esc", d0: dist(p, o) || 1, a0: ang(o, p), e0: o.esc || 1, r0: o.rot || 0 }; return; }
      }
      var g = golpe(p);
      if (g) { sel = g.id; modo = { t: "mover", dx: g.x - p.x, dy: g.y - p.y }; renderSel(); }
      else { sel = null; modo = null; renderSel(); }
      dibujar();
    });
    cv.addEventListener("pointermove", function (e) {
      if (!ptrs[e.pointerId]) return; var p = pt(e); ptrs[e.pointerId] = p; if (!modo) return;
      var o = obj(sel); if (!o) return; movido = true;
      if (modo.t === "mover") {
        o.x = p.x + modo.dx; o.y = p.y + modo.dy;
        guiaX = Math.abs(o.x - S.w / 2) < 14; if (guiaX) o.x = S.w / 2;
      } else if (modo.t === "esc") {
        o.esc = Math.max(0.1, Math.min(6, modo.e0 * dist(p, o) / modo.d0)); o.rot = modo.r0 + (ang(o, p) - modo.a0); syncSel();
      } else if (modo.t === "pinch") {
        var ks = Object.keys(ptrs); if (ks.length < 2) return;
        var a = ptrs[ks[0]], b = ptrs[ks[1]];
        o.esc = Math.max(0.1, Math.min(6, modo.e0 * dist(a, b) / modo.d0)); o.rot = modo.r0 + (ang(a, b) - modo.a0); syncSel();
      }
      dibujar();
    });
    function soltar(e) {
      delete ptrs[e.pointerId]; var n = Object.keys(ptrs).length;
      if (modo && modo.t === "pinch" && n < 2) { if (movido) commit(); modo = null; guiaX = false; dibujar(); return; }
      if (n === 0) { if (modo && movido) commit(); modo = null; guiaX = false; dibujar(); }
    }
    cv.addEventListener("pointerup", soltar); cv.addEventListener("pointercancel", soltar);
    document.addEventListener("keydown", function (e) {
      var t = e.target && e.target.tagName; if (t === "TEXTAREA" || t === "INPUT") return;
      if ((e.key === "Delete" || e.key === "Backspace") && sel) { e.preventDefault(); borrar(); }
    });
    window.addEventListener("resize", dibujar);

    /* ---------- pestañas ---------- */
    var TABS = [["plantillas", "🎨", "Plantillas"], ["fondo", "🖼️", "Fondo"], ["texto", "Aa", "Texto"], ["sellos", "⭐", "Sellos"], ["fotos", "📷", "Fotos"]];
    function renderTabs() {
      var t = $("ekTabs"); t.innerHTML = "";
      TABS.forEach(function (x) {
        var b = el("button", tabAct === x[0] ? "on" : ""); b.type = "button"; b.innerHTML = "<span>" + x[1] + "</span>" + x[2];
        b.onclick = function () { tabAct = x[0]; renderTabs(); renderPanel(); }; t.appendChild(b);
      });
    }
    function swFondo(f) {
      var b = el("button", "mini"); b.type = "button";
      if (f.tipo === "grad") b.style.background = "linear-gradient(" + f.ang + "deg," + f.c.join(",") + ")";
      else if (f.tipo === "img") b.style.backgroundImage = 'url("' + f.src + '")'; else b.style.background = f.c;
      b.setAttribute("aria-label", "Fondo"); b.onclick = function () { S.bg = clon(f); dibujar(); commit(); }; return b;
    }
    function temasVisibles() { return temas.filter(function (t) { return t.id !== "siempre" && enRango(t); }); }
    function renderPanel() {
      var p = $("ekPanel"); p.innerHTML = "";
      if (tabAct === "plantillas") {
        var cats = ["Todas"]; plantillas.forEach(function (t) { if (cats.indexOf(t.cat) < 0) cats.push(t.cat); });
        var fc = el("div", "fila scroll"); fc.appendChild(el("span", "etq", "Elige un punto de partida"));
        cats.forEach(function (c) { fc.appendChild(chip(c, c === catAct, function () { catAct = c; renderPanel(); })); }); p.appendChild(fc);
        var rej = el("div", "rej");
        plantillas.filter(function (t) { return catAct === "Todas" || t.cat === catAct; }).forEach(function (t) {
          var b = el("button", "tpl"); b.type = "button"; var cc = document.createElement("canvas"); b.appendChild(cc); b.appendChild(el("small", null, (t.icono || "") + " " + t.nombre));
          b.onclick = function () { aplicarPlantilla(t, true); }; rej.appendChild(b); miniatura(cc, t);
        });
        p.appendChild(rej);
        p.appendChild(el("p", "nota", "Todo es editable: cambia textos, letras, colores y mueve lo que quieras. ✨"));
      } else if (tabAct === "fondo") {
        var e1 = el("div", "fila"); e1.appendChild(el("span", "etq", "Colores")); FONDOS_COLOR.forEach(function (c) { e1.appendChild(swFondo({ tipo: "color", c: c })); }); p.appendChild(e1);
        var e2 = el("div", "fila"); e2.appendChild(el("span", "etq", "Degradados")); FONDOS_GRAD.forEach(function (g) { e2.appendChild(swFondo({ tipo: "grad", c: g.c, ang: g.ang })); }); p.appendChild(e2);
        temasVisibles().forEach(function (t) {
          var fl = (t.fondos || []).map(function (f) { return esRuta(f) ? { tipo: "img", src: f } : { tipo: "color", c: f }; });
          if (!fl.length) return; var e3 = el("div", "fila"); e3.appendChild(el("span", "etq", t.nombre)); fl.forEach(function (f) { e3.appendChild(swFondo(f)); }); p.appendChild(e3);
        });
        var e4 = el("div", "fila"); e4.appendChild(el("span", "etq", "Tu propia imagen")); e4.appendChild(chip("📷 Subir foto de fondo", false, function () { subirFoto(true); })); p.appendChild(e4);
      } else if (tabAct === "texto") {
        p.appendChild(chip("＋ Añadir texto libre", true, function () { añadirTexto({ texto: "Tu texto", fuente: "Pacifico", tam: 110 }); }));
        var ft = el("div", "fila"); ft.appendChild(el("span", "etq", "Textos listos para invitaciones"));
        PRESETS_TEXTO.forEach(function (x) { ft.appendChild(chip(x.nombre, false, function () { añadirTexto(x); })); }); p.appendChild(ft);
        p.appendChild(el("p", "nota", "Después de añadirlo, tócalo en el lienzo para cambiar el texto, la letra y el color."));
      } else if (tabAct === "sellos") {
        var grupos = clon(SELLOS);
        temasVisibles().forEach(function (t) { if (t.sellos && t.sellos.length) grupos[t.nombre] = t.sellos; });
        if (window.PacksKa) PacksKa.packs().forEach(function (pk) { grupos["🎁 " + pk.nombre] = pk.items.map(function (it) { return "pack:" + pk.id + "/" + it.id; }); });
        Object.keys(grupos).forEach(function (g) {
          var f = el("div", "fila"); f.appendChild(el("span", "etq", g));
          grupos[g].forEach(function (s) {
            var b = el("button", "sello"); b.type = "button"; b.setAttribute("aria-label", "Sello");
            if (esRuta(s)) { var im = el("img"); im.src = (window.PacksKa && PacksKa.url(s)) || s; im.alt = ""; b.appendChild(im); } else b.textContent = s;
            b.onclick = function () { añadirSello(s); }; f.appendChild(b);
          }); p.appendChild(f);
        });
      } else if (tabAct === "fotos") {
        p.appendChild(chip("📷 Subir una foto", true, function () { subirFoto(false); }));
        p.appendChild(el("p", "nota", "Puedes darle forma de círculo, corazón o marco redondeado. Tu foto se queda en tu teléfono: no se sube a ningún servidor."));
        p.appendChild(chip("🖼️ Usar una foto como fondo", false, function () { subirFoto(true); }));
      }
    }
    function miniatura(cc, t) {
      var f = F.filter(function (x) { return x.id === (t.formato || F[0].id); })[0] || F[0], st = armar(t, f), w = 240;
      cc.width = w; cc.height = Math.round(w * f.h / f.w); var c = cc.getContext("2d"); c.scale(w / f.w, w / f.w);
      var dib = function () { c.clearRect(0, 0, f.w, f.h); pintar(c, st, null); };
      dib(); precargar(st).then(dib);
    }
    function armar(t, f) {
      var st = { w: f.w, h: f.h, bg: clon(t.bg), objs: [] };
      (t.objs || []).forEach(function (x) {
        var o = clon(x); o.id = "t" + st.objs.length; o.x = x.x * f.w; o.y = x.y * f.h; o.rot = (x.rot || 0) * Math.PI / 180; o.esc = x.esc || 1;
        if (o.t === "texto") { o.align = o.align || "center"; o.color = o.color || "#2b2b2b"; o.fuente = o.fuente || "Quicksand"; o.tam = o.tam || 60; }
        st.objs.push(o);
      }); return st;
    }
    function aplicarPlantilla(t, pregunta) {
      if (!t) return;
      if (pregunta && sucio && S.objs.length && !confirm("Esto reemplaza tu diseño actual. ¿Seguimos?")) return;
      var f = F.filter(function (x) { return x.id === (t.formato || F[0].id); })[0] || F[0], st = armar(t, f);
      S.w = st.w; S.h = st.h; S.bg = st.bg; fmtId = f.id;
      S.objs = st.objs.map(function (o) { o.id = nid(); return o; }); sel = null;
      ajustarMarco(); renderFormatos(); renderSel(); dibujar(); sucio = !!pregunta; commit(); precargar(S).then(dibujar);
      if (pregunta) { msg("Plantilla lista ✨ Toca cualquier texto para cambiarlo."); window.scrollTo({ top: marco.offsetTop - 70, behavior: "smooth" }); }
    }

    /* ---------- exportar ---------- */
    function exportar() {
      return precargar(S).then(function () {
        var cc = document.createElement("canvas"); cc.width = S.w * calidad; cc.height = S.h * calidad;
        var c = cc.getContext("2d"); c.scale(calidad, calidad); pintar(c, S, { marca: cfg.marcaAgua !== false });
        return new Promise(function (r) { cc.toBlob(r, "image/png"); });
      });
    }
    function nombreArchivo() { return "yelioki-" + cfg.taller + "-" + new Date().toISOString().slice(0, 10) + ".png"; }
    function descargar(blob) { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nombreArchivo(); document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000); }
    $("ekDesc").onclick = function () {
      if (ocupado) return; ocupado = true; msg("Preparando tu imagen…");
      exportar().then(function (b) { descargar(b); msg("¡Listo! Guardada en tu dispositivo 💾"); }).catch(function () { msg("Algo falló al exportar, intenta de nuevo."); }).then(function () { ocupado = false; });
    };
    $("ekComp").onclick = function () {
      if (ocupado) return; ocupado = true; msg("Preparando tu imagen…");
      exportar().then(function (b) {
        var file = new File([b], nombreArchivo(), { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          return navigator.share({ files: [file], title: "Mi diseño de Universo Ka", text: "Hecho en Universo Ka · Yelioki" }).then(function () { msg("¡Compartido! 💛"); }).catch(function () { });
        }
        descargar(b); msg("Tu navegador no comparte directo: la guardé en tu dispositivo.");
      }).catch(function () { msg("Algo falló al exportar, intenta de nuevo."); }).then(function () { ocupado = false; });
    };
    var fq = $("ekCalidad"); fq.appendChild(el("span", "etq", "Tamaño de la imagen")); fq.style.textAlign = "center";
    [["Normal", 1], ["Alta (imprimir)", 2]].forEach(function (q) {
      var b = chip(q[0], q[1] === 1, function () { calidad = q[1]; Array.prototype.forEach.call(fq.querySelectorAll(".chip"), function (x) { x.classList.remove("on"); }); b.classList.add("on"); }); fq.appendChild(b);
    });
    $("ekWa").href = "https://wa.me/" + (cfg.whatsapp || "56932938800") + "?text=" + encodeURIComponent(cfg.waTexto || "Hola Yeli 💛 Hice un diseño en Universo Ka y me gustaría pedirlo. Te lo envío por aquí.");

    /* ---------- arranque ---------- */
    renderFormatos(); renderTabs(); renderPanel(); ajustarMarco();
    var tieneAuto = cargarAuto(); if (tieneAuto) { ajustarMarco(); renderFormatos(); }
    if (window.PacksKa) PacksKa.listar().then(function () { renderPanel(); });
    var p1 = fetch(cfg.plantillasUrl, { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (j) { plantillas = j.plantillas || []; }).catch(function () { plantillas = []; });
    var p2 = fetch("lienzo-temas.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (j) { temas = j.temas || []; }).catch(function () { temas = []; });
    Promise.all([p1, p2]).then(function () {
      if (tieneAuto) { msg("Recuperé tu último diseño 💛"); var rs = chip("Empezar de cero", false, function () { if (confirm("¿Borrar este diseño y empezar de nuevo?")) { aplicarPlantilla(plantillas[0], false); sucio = false; } }); rs.style.marginTop = "6px"; $("ekAyuda").parentNode.insertBefore(rs, $("ekAyuda").nextSibling); }
      else if (plantillas[0]) { aplicarPlantilla(plantillas[0], false); }
      renderPanel(); hist = []; hpos = -1; commit(); sucio = false; precargar(S).then(dibujar); dibujar();
    });
    dibujar(); precargar(S).then(dibujar);
    window.EditorKaEstado = { get: function () { return S; }, aplicar: aplicarPlantilla };
  }

  window.EditorKa = { montar: montar };
})();
