/* Taller de Toppers · Universo Ka (Yelioki)
   Maqueta de torta en centímetros reales + hoja A4 de impresión a tamaño real. Todo ocurre en el dispositivo. */
(function () {
  "use strict";
  var FUENTES = ["Pacifico", "Great Vibes", "Lobster", "Fredoka", "Baloo 2", "Dancing Script", "Bebas Neue", "Playfair Display", "Quicksand", "Amatic SC"];
  var PALETA = ["#2C9090", "#E0457B", "#E8A5B5", "#F6C945", "#B08D57", "#7FA8D6", "#1E7B4A", "#C0392B", "#6B4FA0", "#FFFFFF", "#2b2b2b", "#F4EFE3"];
  var CREMAS = ["#F4B6C6", "#FFFFFF", "#F7E7C6", "#BFE3F2", "#D9C7F0", "#C9E8C0", "#8A5A3C", "#F6C945"];
  var TORTAS = [{ w: 15, h: 12 }, { w: 20, h: 15 }, { w: 25, h: 18 }];
  var FORMAS = [["arco", "Arco"], ["circulo", "Círculo"], ["corazon", "Corazón"], ["estrella", "Estrella"], ["cinta", "Cinta"], ["rect", "Rectángulo"], ["nube", "Nube"]];
  var RATIO_FORMA = { arco: 0.72, circulo: 1, corazon: 1.1, estrella: 1, cinta: 3, rect: 1.4, nube: 1.6 };
  var BORDE = 0.3, ORO = 0.07; // cm
  var A4 = { w: 21, h: 29.7, m: 0.8, pie: 1.3, sep: 0.35 };

  function $(id) { return document.getElementById(id); }
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function chip(txt, on, fn, extra) { var b = el("button", "chip" + (on ? " on" : "") + (extra ? " " + extra : ""), txt); b.type = "button"; b.onclick = fn; return b; }
  function clon(x) { return JSON.parse(JSON.stringify(x)); }
  function mezcla(hex, p) {
    var h = hex.replace("#", ""), r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16), t = p < 0 ? 0 : 255, q = Math.abs(p);
    function f(v) { return Math.round(v + (t - v) * q); } return "rgb(" + f(r) + "," + f(g) + "," + f(b) + ")";
  }

  function iniciar(cfg) {
    var KEY = "ka_proy_toppers";
    var S = { torta: { w: 20, h: 15, color: CREMAS[0] }, piezas: [] };
    var fotos = {}, imgs = {}, cat = [], sel = null, idn = 1, nfoto = 1, hist = [], hpos = -1, tab = "clip", catId = null, cacheB = {};
    var cv = $("tpCv"), c = cv.getContext("2d"), pxcm = 40, headroom = 20, ocupado = false, timer = null, paginas = [];

    /* ---------- imágenes y fuentes ---------- */
    function cargarImg(src) {
      var u = fotos[src] || src, e = imgs[u];
      if (e) return e.p;
      e = imgs[u] = { ok: false, img: new Image() };
      e.p = new Promise(function (res) { e.img.onload = function () { e.ok = true; res(e.img); dibujar(); }; e.img.onerror = function () { res(null); }; });
      e.img.src = u; return e.p;
    }
    function getImg(src) { var u = fotos[src] || src, e = imgs[u]; if (!e) { cargarImg(src); return null; } return e.ok ? e.img : null; }
    function cargarFuente(f) { return (document.fonts && document.fonts.load) ? document.fonts.load('60px "' + f + '"').catch(function () { }) : Promise.resolve(); }

    /* ---------- fuentes visuales de cada pieza ---------- */
    function lienzoForma(p) {
      var H = 500, W = Math.round(H * RATIO_FORMA[p.forma]), k = document.createElement("canvas"); k.width = W; k.height = H; var x = k.getContext("2d");
      x.fillStyle = p.color || "#2C9090"; x.beginPath();
      if (p.forma === "arco") { x.moveTo(0, H); x.lineTo(0, W / 2); x.arc(W / 2, W / 2, W / 2, Math.PI, 0); x.lineTo(W, H); x.closePath(); }
      else if (p.forma === "circulo") x.ellipse(W / 2, H / 2, W / 2, H / 2, 0, 0, 6.2832);
      else if (p.forma === "corazon") { x.moveTo(W / 2, H * 0.95); x.bezierCurveTo(-W * 0.2, H * 0.4, W * 0.05, -H * 0.12, W / 2, H * 0.28); x.bezierCurveTo(W * 0.95, -H * 0.12, W * 1.2, H * 0.4, W / 2, H * 0.95); x.closePath(); }
      else if (p.forma === "estrella") { for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? H * 0.2 : H * 0.5; x[i ? "lineTo" : "moveTo"](W / 2 + r * Math.cos(a), H * 0.53 + r * Math.sin(a)); } x.closePath(); }
      else if (p.forma === "cinta") { x.moveTo(0, H * 0.15); x.quadraticCurveTo(W / 4, -H * 0.05, W / 2, H * 0.15); x.quadraticCurveTo(W * 0.75, H * 0.35, W, H * 0.15); x.lineTo(W, H * 0.85); x.quadraticCurveTo(W * 0.75, H * 1.05, W / 2, H * 0.85); x.quadraticCurveTo(W / 4, H * 0.65, 0, H * 0.85); x.closePath(); }
      else if (p.forma === "rect") { var r2 = H * 0.18; x.moveTo(r2, 0); x.arcTo(W, 0, W, H, r2); x.arcTo(W, H, 0, H, r2); x.arcTo(0, H, 0, 0, r2); x.arcTo(0, 0, W, 0, r2); x.closePath(); }
      else { x.arc(W * 0.28, H * 0.62, H * 0.28, 0, 6.2832); x.arc(W * 0.5, H * 0.38, H * 0.36, 0, 6.2832); x.arc(W * 0.74, H * 0.6, H * 0.3, 0, 6.2832); x.rect(W * 0.28, H * 0.62, W * 0.46, H * 0.28); }
      x.fill(); return k;
    }
    function lienzoTexto(p) {
      var fp = 300, k = document.createElement("canvas"), x = k.getContext("2d"), L = String(p.texto || " ").split("\n"), f = 'bold ' + fp + 'px "' + p.fuente + '", cursive, sans-serif';
      x.font = f; var w = 0; L.forEach(function (l) { w = Math.max(w, x.measureText(l || " ").width); });
      var pad = fp * 0.08, lh = fp * 1.1; k.width = Math.ceil(w + pad * 2); k.height = Math.ceil(L.length * lh + pad * 2);
      x = k.getContext("2d"); x.font = f; x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = p.color || "#E0457B";
      L.forEach(function (l, i) { x.fillText(l, k.width / 2, pad + lh * (i + 0.5)); }); return k;
    }
    function fuenteDe(p) {
      if (p.tipo === "forma") return { src: lienzoForma(p), ratio: RATIO_FORMA[p.forma] };
      if (p.tipo === "texto") { var t = lienzoTexto(p); return { src: t, ratio: t.width / t.height }; }
      var im = getImg(p.src); if (!im) return { src: null, ratio: p.r || 0.7 };
      p.r = im.naturalWidth / im.naturalHeight; return { src: im, ratio: p.r };
    }
    function medidas(p) { var f = fuenteDe(p); return { w: p.hcm * f.ratio, h: p.hcm }; }
    function bordeCm(p) { return p.borde === "ninguno" ? 0 : BORDE + (p.borde === "dorado" ? ORO : 0); }

    /* ---------- pieza con borde de corte ---------- */
    function silueta(base, rad, color) {
      var k = document.createElement("canvas"); k.width = base.width; k.height = base.height; var x = k.getContext("2d"), n = Math.max(12, Math.min(48, Math.ceil(rad * 1.4)));
      x.drawImage(base, 0, 0); for (var i = 0; i < n; i++) { var a = i * 6.2832 / n; x.drawImage(base, Math.cos(a) * rad, Math.sin(a) * rad); }
      x.globalCompositeOperation = "source-in"; x.fillStyle = color; x.fillRect(0, 0, k.width, k.height); return k;
    }
    function ensamblar(p, k) {
      var f = fuenteDe(p); if (!f.src) return null;
      var m = medidas(p), wpx = Math.max(2, Math.round(m.w * k)), hpx = Math.max(2, Math.round(m.h * k)), b = bordeCm(p) * k, pad = Math.ceil(b) + 3;
      var key = [p.id, p.tipo, p.src, p.forma, p.texto, p.fuente, p.color, p.borde, !!p.flip, wpx, hpx].join("|"); if (cacheB[key]) return cacheB[key];
      var base = document.createElement("canvas"); base.width = wpx + pad * 2; base.height = hpx + pad * 2; var x = base.getContext("2d"); x.imageSmoothingQuality = "high";
      x.save(); x.translate(pad + wpx / 2, pad + hpx / 2); if (p.flip) x.scale(-1, 1); x.drawImage(f.src, -wpx / 2, -hpx / 2, wpx, hpx); x.restore();
      var out = document.createElement("canvas"); out.width = base.width; out.height = base.height; var o = out.getContext("2d");
      if (p.borde !== "ninguno") {
        if (p.borde === "dorado") o.drawImage(silueta(base, b, "#C9A227"), 0, 0);
        o.drawImage(silueta(base, p.borde === "dorado" ? Math.max(1, b - ORO * k) : b, "#FFFFFF"), 0, 0);
      }
      o.drawImage(base, 0, 0);
      var r = { cv: out, pad: pad }; if (Object.keys(cacheB).length > 120) cacheB = {}; cacheB[key] = r; return r;
    }

    /* ---------- torta ---------- */
    function dibujarTorta() {
      var w = S.torta.w, h = S.torta.h, rx = w / 2, ry = w * 0.085, col = S.torta.color;
      c.save(); c.translate(cv.width / 2, headroom * pxcm); c.scale(pxcm, pxcm);
      c.fillStyle = "rgba(0,0,0,.14)"; c.beginPath(); c.ellipse(0, h + 6, rx + 5, 1.3, 0, 0, 6.2832); c.fill();
      c.fillStyle = "#f7f7f7"; c.fillRect(-1.5, h + 1.3, 3, 4.6); c.beginPath(); c.ellipse(0, h + 6, 4.8, 0.9, 0, 0, 6.2832); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.ellipse(0, h + 0.8, rx + 3, 1.1, 0, 0, 6.2832); c.fill(); c.fillStyle = "#ececec"; c.fillRect(-rx - 3, h + 0.8, w + 6, 0.5);
      c.beginPath(); c.ellipse(0, h + 1.3, rx + 3, 1.1, 0, 0, Math.PI); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.ellipse(0, h + 0.8, rx + 3, 1.1, 0, 0, 6.2832); c.fill();
      var g = c.createLinearGradient(-rx, 0, rx, 0); g.addColorStop(0, mezcla(col, -0.16)); g.addColorStop(0.3, col); g.addColorStop(0.55, mezcla(col, 0.12)); g.addColorStop(1, mezcla(col, -0.2));
      c.fillStyle = g; c.beginPath(); c.moveTo(-rx, 0); c.lineTo(-rx, h); c.ellipse(0, h, rx, ry, 0, Math.PI, 0, true); c.lineTo(rx, 0); c.ellipse(0, 0, rx, ry, 0, 0, Math.PI, true); c.closePath(); c.fill();
      c.fillStyle = mezcla(col, 0.18); c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, 6.2832); c.fill();
      c.strokeStyle = "rgba(255,255,255,.35)"; c.lineWidth = 0.12; c.stroke();
      var n = Math.round(w * 1.1);
      for (var i = 0; i <= n; i++) { var a = i * Math.PI / n; c.fillStyle = mezcla(col, 0.22); c.beginPath(); c.arc(rx * Math.cos(a), h + ry * Math.sin(a) - 0.15, 0.7, 0, 6.2832); c.fill(); c.strokeStyle = mezcla(col, -0.12); c.lineWidth = 0.06; c.stroke(); }
      c.restore();
    }
    function aMundo(p, lx, ly) { var r = (p.rot || 0) * Math.PI / 180; return { x: p.x + lx * Math.cos(r) - ly * Math.sin(r), y: p.y + lx * Math.sin(r) + ly * Math.cos(r) }; }
    function aLocal(p, x, y) { var r = -(p.rot || 0) * Math.PI / 180, dx = x - p.x, dy = y - p.y; return { x: dx * Math.cos(r) - dy * Math.sin(r), y: dx * Math.sin(r) + dy * Math.cos(r) }; }
    function aPx(p) { return { x: cv.width / 2 + p.x * pxcm, y: headroom * pxcm + p.y * pxcm }; }
    function K() { return (cv.getBoundingClientRect().width || 360) / cv.width; }

    function dibujar() {
      var w = S.torta.w, h = S.torta.h; pxcm = 1000 / (w + 20); headroom = 20;
      var ch = Math.round(pxcm * (headroom + h + 7)); if (cv.width !== 1000) cv.width = 1000; if (cv.height !== ch) cv.height = ch;
      cv.parentNode.style.aspectRatio = "1000 / " + ch;
      c.fillStyle = "#EFEFEF"; c.fillRect(0, 0, cv.width, cv.height);
      var g = c.createLinearGradient(0, 0, 0, cv.height); g.addColorStop(0, "#F7F7F7"); g.addColorStop(1, "#DADADA"); c.fillStyle = g; c.fillRect(0, 0, cv.width, cv.height);
      c.fillStyle = "rgba(0,0,0,.05)"; for (var cx = 0; cx <= w + 20; cx += 5) c.fillRect(cx * pxcm, 0, 1, cv.height); // cuadrícula suave cada 5 cm
      dibujarTorta();
      S.piezas.forEach(function (p) { // palitos
        var m = medidas(p); if (p.y + m.h / 2 > 1.5) return;
        var a = aPx(p), b = { x: a.x, y: headroom * pxcm + 0.7 * pxcm }; c.strokeStyle = "#C9A56B"; c.lineWidth = Math.max(3, 0.32 * pxcm); c.lineCap = "round"; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
        c.strokeStyle = "rgba(120,80,30,.35)"; c.lineWidth = 1.5; c.stroke();
      });
      S.piezas.forEach(function (p) {
        var r = ensamblar(p, pxcm); if (!r) return; var a = aPx(p);
        c.save(); c.translate(a.x, a.y); c.rotate((p.rot || 0) * Math.PI / 180); c.shadowColor = "rgba(0,0,0,.28)"; c.shadowBlur = 8; c.shadowOffsetY = 3; c.drawImage(r.cv, -r.cv.width / 2, -r.cv.height / 2); c.restore();
      });
      var p = obj(sel); if (!p) return; var m = medidas(p), pad = bordeCm(p) + 0.35, hw = m.w / 2 + pad, hh = m.h / 2 + pad, k = K(), R = 15 / k;
      var P = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(function (q) { var t = aMundo(p, q[0], q[1]); return { x: cv.width / 2 + t.x * pxcm, y: headroom * pxcm + t.y * pxcm }; });
      c.save(); c.beginPath(); c.moveTo(P[0].x, P[0].y); for (var i = 1; i < 4; i++) c.lineTo(P[i].x, P[i].y); c.closePath(); c.setLineDash([8 / k, 6 / k]);
      c.strokeStyle = "rgba(255,255,255,.95)"; c.lineWidth = 4 / k; c.stroke(); c.strokeStyle = "#2d8f89"; c.lineWidth = 2 / k; c.stroke(); c.setLineDash([]);
      function bola(q, col, t) { c.beginPath(); c.arc(q.x, q.y, R, 0, 6.2832); c.fillStyle = col; c.fill(); c.lineWidth = 2 / k; c.strokeStyle = "#fff"; c.stroke(); c.fillStyle = "#fff"; c.font = "bold " + R * 1.1 + "px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(t, q.x, q.y + R * 0.05); }
      bola(P[2], "#2d8f89", "⤡"); bola(P[0], "#d6455d", "✕"); c.restore();
    }

    /* ---------- piezas ---------- */
    function obj(id) { for (var i = 0; i < S.piezas.length; i++) if (S.piezas[i].id === id) return S.piezas[i]; return null; }
    function snap() { return JSON.stringify(S); }
    function commit() { var s = snap(); if (hist[hpos] === s) return; hist = hist.slice(0, hpos + 1); hist.push(s); if (hist.length > 40) hist.shift(); hpos = hist.length - 1; undoBtn(); guardar(); }
    function undoBtn() { $("tpUndo").disabled = hpos <= 0; $("tpRedo").disabled = hpos >= hist.length - 1; }
    function restaurar(s) { S = JSON.parse(s); if (!obj(sel)) sel = null; renderTodo(); }
    $("tpUndo").onclick = function () { if (hpos > 0) { hpos--; restaurar(hist[hpos]); undoBtn(); guardar(); } };
    $("tpRedo").onclick = function () { if (hpos < hist.length - 1) { hpos++; restaurar(hist[hpos]); undoBtn(); guardar(); } };
    function msg(t) { $("tpMsg").textContent = t || ""; clearTimeout(msg.t); if (t) msg.t = setTimeout(function () { $("tpMsg").textContent = ""; }, 5000); }
    function guardar() { try { var s = JSON.stringify({ S: S, fotos: fotos }); if (s.length > 3500000) s = JSON.stringify({ S: S, fotos: {} }); localStorage.setItem(KEY, s); } catch (e) { } }
    function cargarGuardado() {
      try { var d = JSON.parse(localStorage.getItem(KEY) || "null"); if (d && d.S && d.S.piezas && d.S.piezas.length) { S = d.S; fotos = d.fotos || {}; S.piezas.forEach(function (p) { var n = parseInt(String(p.id).replace("p", ""), 10); if (n >= idn) idn = n + 1; }); Object.keys(fotos).forEach(function (k) { var n = parseInt(k.replace("f", ""), 10); if (n >= nfoto) nfoto = n + 1; }); return true; } } catch (e) { } return false;
    }
    function nuevaPieza(p) {
      p.id = "p" + (idn++); p.rot = 0; p.borde = p.borde || "blanco";
      if (p.tipo === "texto") { var ra = fuenteDe(p).ratio; p.hcm = Math.round(Math.max(2, Math.min(10, 15 / ra)) * 2) / 2; }
      p.y = -(p.hcm / 2) - 0.6; var lim = headroom - 1; if (p.y - p.hcm / 2 < -lim) p.y = -lim + p.hcm / 2;
      var mp = medidas(p), cands = [0]; for (var q = 1; q <= 8; q++) { cands.push(q * 2.5, -q * 2.5); }
      p.x = 0; for (var ci = 0; ci < cands.length; ci++) {
        var ok = true; S.piezas.forEach(function (o) { var mo = medidas(o); if (Math.abs(o.x - cands[ci]) < (mo.w + mp.w) / 2 * 0.92 && Math.abs(o.y - p.y) < (mo.h + mp.h) / 2 * 0.9) ok = false; });
        if (ok && Math.abs(cands[ci]) + mp.w / 2 <= S.torta.w / 2 + 8) { p.x = cands[ci]; break; }
      }
      S.piezas.push(p); sel = p.id; renderSel(); dibujar(); commit(); return p;
    }
    function borrar() { var i = S.piezas.indexOf(obj(sel)); if (i >= 0) S.piezas.splice(i, 1); sel = null; renderSel(); dibujar(); commit(); }
    function duplicar() { var p = obj(sel); if (!p) return; var q = clon(p); q.id = "p" + (idn++); q.x += 3; S.piezas.push(q); sel = q.id; renderSel(); dibujar(); commit(); }
    function orden(d) { var p = obj(sel), i = S.piezas.indexOf(p), j = i + d; if (!p || j < 0 || j >= S.piezas.length) return; S.piezas.splice(i, 1); S.piezas.splice(j, 0, p); dibujar(); commit(); }

    function renderSel() {
      var p = obj(sel), box = $("tpSel"); box.innerHTML = ""; $("tpAyuda").hidden = !!p; box.hidden = !p; if (!p) return;
      var m = medidas(p); box.appendChild(el("span", "etq", "Pieza seleccionada"));
      if (p.tipo === "texto") {
        var ta = el("textarea"); ta.value = p.texto; ta.setAttribute("aria-label", "Texto"); ta.oninput = function () { p.texto = ta.value || " "; dibujar(); clearTimeout(timer); timer = setTimeout(commit, 500); }; box.appendChild(ta);
        var ff = el("div", "fila scroll"); ff.appendChild(el("span", "etq", "Letra"));
        FUENTES.forEach(function (f) { var b = el("button", "fu" + (p.fuente === f ? " on" : ""), "Aa " + f); b.type = "button"; b.style.fontFamily = '"' + f + '",cursive'; b.onclick = function () { p.fuente = f; cargarFuente(f).then(dibujar); dibujar(); commit(); renderSel(); }; ff.appendChild(b); }); box.appendChild(ff);
      }
      if (p.tipo === "texto" || p.tipo === "forma") {
        var fc = el("div", "fila"); fc.appendChild(el("span", "etq", "Color"));
        PALETA.forEach(function (col) { var b = el("button", "sw" + (p.color === col ? " on" : "")); b.type = "button"; b.style.background = col; b.setAttribute("aria-label", col); b.onclick = function () { p.color = col; dibujar(); commit(); renderSel(); }; fc.appendChild(b); });
        var ci = el("input"); ci.type = "color"; ci.value = /^#[0-9a-f]{6}$/i.test(p.color) ? p.color : "#2C9090"; ci.setAttribute("aria-label", "Otro color"); ci.oninput = function () { p.color = ci.value; dibujar(); }; ci.onchange = function () { commit(); renderSel(); }; fc.appendChild(ci); box.appendChild(fc);
      }
      var rg = el("div", "rg"), lb = el("label", null, "Alto"), ir = el("input"); ir.type = "range"; ir.min = 1; ir.max = 28; ir.step = 0.5; ir.value = p.hcm; ir.setAttribute("aria-label", "Alto en centímetros");
      var val = el("b", null, p.hcm.toFixed(1) + " cm"); val.style.minWidth = "58px"; val.id = "tpVal"; ir.oninput = function () { p.hcm = parseFloat(ir.value); val.textContent = p.hcm.toFixed(1) + " cm"; dibujar(); }; ir.onchange = commit; rg.appendChild(lb); rg.appendChild(ir); rg.appendChild(val); box.appendChild(rg); window.tpSlider = ir;
      var rg2 = el("div", "rg"), l2 = el("label", null, "Giro"), i2 = el("input"); i2.type = "range"; i2.min = -45; i2.max = 45; i2.step = 1; i2.value = p.rot || 0; i2.setAttribute("aria-label", "Giro"); i2.oninput = function () { p.rot = parseFloat(i2.value); dibujar(); }; i2.onchange = commit; rg2.appendChild(l2); rg2.appendChild(i2); box.appendChild(rg2);
      var fb = el("div", "fila"); fb.appendChild(el("span", "etq", "Borde de corte"));
      [["Blanco", "blanco"], ["Dorado", "dorado"], ["Sin borde", "ninguno"]].forEach(function (a) { fb.appendChild(chip(a[0], p.borde === a[1], function () { p.borde = a[1]; dibujar(); commit(); renderSel(); })); }); box.appendChild(fb);
      var fa = el("div", "fila");
      fa.appendChild(chip("↔ Espejo", !!p.flip, function () { p.flip = !p.flip; dibujar(); commit(); renderSel(); })); fa.appendChild(chip("⧉ Duplicar", false, duplicar));
      fa.appendChild(chip("⬆ Adelante", false, function () { orden(1); })); fa.appendChild(chip("⬇ Atrás", false, function () { orden(-1); })); fa.appendChild(chip("🗑 Borrar", false, borrar, "peli")); box.appendChild(fa);
      box.appendChild(el("p", "nota", "Tamaño real: " + m.w.toFixed(1) + " × " + m.h.toFixed(1) + " cm" + (p.y + m.h / 2 <= 1.5 ? " · con palito 🥢" : " · pegado a la torta")));
    }
    function syncSel() { var p = obj(sel); if (!p) return; if (window.tpSlider) { window.tpSlider.value = p.hcm; var v = $("tpVal"); if (v) v.textContent = p.hcm.toFixed(1) + " cm"; } }

    /* ---------- punteros ---------- */
    var ptrs = {}, modo = null, movido = false;
    function pt(e) { var r = cv.getBoundingClientRect(); return { x: ((e.clientX - r.left) * cv.width / r.width - cv.width / 2) / pxcm, y: ((e.clientY - r.top) * cv.height / r.height - headroom * pxcm) / pxcm }; }
    function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    function golpe(q) { for (var i = S.piezas.length - 1; i >= 0; i--) { var p = S.piezas[i], m = medidas(p), l = aLocal(p, q.x, q.y), pd = bordeCm(p) + 0.3; if (Math.abs(l.x) <= m.w / 2 + pd && Math.abs(l.y) <= m.h / 2 + pd) return p; } return null; }
    cv.addEventListener("pointerdown", function (e) {
      e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) { } var q = pt(e); ptrs[e.pointerId] = q; movido = false;
      var ks = Object.keys(ptrs), p = obj(sel), R = 24 / K() / pxcm;
      if (ks.length === 2 && p) { modo = { t: "pinch", d0: dist(ptrs[ks[0]], ptrs[ks[1]]) || 1, h0: p.hcm }; return; }
      if (p) {
        var m = medidas(p), pad = bordeCm(p) + 0.35, br = aMundo(p, m.w / 2 + pad, m.h / 2 + pad), tl = aMundo(p, -m.w / 2 - pad, -m.h / 2 - pad);
        if (dist(q, tl) <= R) { borrar(); modo = null; return; }
        if (dist(q, br) <= R) { modo = { t: "esc", d0: dist(q, p) || 1, h0: p.hcm }; return; }
      }
      var g = golpe(q); if (g) { sel = g.id; modo = { t: "mover", dx: g.x - q.x, dy: g.y - q.y }; renderSel(); } else { sel = null; modo = null; renderSel(); } dibujar();
    });
    cv.addEventListener("pointermove", function (e) {
      if (!ptrs[e.pointerId]) return; var q = pt(e); ptrs[e.pointerId] = q; if (!modo) return; var p = obj(sel); if (!p) return; movido = true;
      if (modo.t === "mover") { p.x = Math.max(-S.torta.w / 2 - 9, Math.min(S.torta.w / 2 + 9, q.x + modo.dx)); p.y = Math.max(-headroom + 1, Math.min(S.torta.h + 3, q.y + modo.dy)); if (Math.abs(p.x) < 0.5) p.x = 0; }
      else if (modo.t === "esc") { p.hcm = Math.round(Math.max(1, Math.min(28, modo.h0 * dist(q, p) / modo.d0)) * 2) / 2; syncSel(); }
      else if (modo.t === "pinch") { var ks = Object.keys(ptrs); if (ks.length < 2) return; p.hcm = Math.round(Math.max(1, Math.min(28, modo.h0 * dist(ptrs[ks[0]], ptrs[ks[1]]) / modo.d0)) * 2) / 2; syncSel(); }
      dibujar();
    });
    function soltar(e) { delete ptrs[e.pointerId]; var n = Object.keys(ptrs).length; if (modo && modo.t === "pinch" && n < 2) { if (movido) commit(); modo = null; renderSel(); dibujar(); return; } if (n === 0) { if (modo && movido) { commit(); renderSel(); } modo = null; dibujar(); } }
    cv.addEventListener("pointerup", soltar); cv.addEventListener("pointercancel", soltar);
    document.addEventListener("keydown", function (e) { var t = e.target && e.target.tagName; if (t === "TEXTAREA" || t === "INPUT") return; if ((e.key === "Delete" || e.key === "Backspace") && sel) { e.preventDefault(); borrar(); } });
    window.addEventListener("resize", dibujar);

    /* ---------- paneles ---------- */
    function renderTorta() {
      var f = $("tpTorta"); while (f.children.length > 1) f.removeChild(f.lastChild);
      TORTAS.forEach(function (t) { f.appendChild(chip(t.w + " × " + t.h + " cm", S.torta.w === t.w && S.torta.h === t.h, function () { S.torta.w = t.w; S.torta.h = t.h; renderTorta(); dibujar(); commit(); })); });
      var fc = $("tpCrema"); while (fc.children.length > 1) fc.removeChild(fc.lastChild);
      CREMAS.forEach(function (col) { var b = el("button", "sw" + (S.torta.color === col ? " on" : "")); b.type = "button"; b.style.background = col; b.setAttribute("aria-label", "Color de la torta"); b.onclick = function () { S.torta.color = col; renderTorta(); dibujar(); commit(); }; fc.appendChild(b); });
    }
    function renderTabs() {
      var t = $("tpTabs"); t.innerHTML = "";
      [["clip", "🧚", "Cliparts"], ["forma", "🔷", "Formas"], ["texto", "Aa", "Texto"], ["foto", "📷", "Mi imagen"]].forEach(function (x) { var b = el("button", tab === x[0] ? "on" : ""); b.type = "button"; b.innerHTML = "<span>" + x[1] + "</span>" + x[2]; b.onclick = function () { tab = x[0]; renderTabs(); renderPanel(); }; t.appendChild(b); });
    }
    function renderPanel() {
      var p = $("tpPanel"); p.innerHTML = "";
      if (tab === "clip") {
        if (!cat.length) { p.appendChild(el("p", "vacio", "Aún no hay cliparts cargados.")); return; }
        if (!catId) catId = cat[0].id;
        if (cat.length > 1) { var fc = el("div", "fila scroll"); cat.forEach(function (cc) { fc.appendChild(chip(cc.nombre, cc.id === catId, function () { catId = cc.id; renderPanel(); })); }); p.appendChild(fc); }
        p.appendChild(el("span", "etq", "Toca para ponerlo sobre la torta"));
        var rej = el("div", "rej");
        cat.filter(function (cc) { return cc.id === catId; })[0].items.forEach(function (it) {
          var b = el("button", "tpl"); b.type = "button"; b.style.padding = "6px"; var im = el("img"); im.src = it.src; im.alt = it.nombre; im.style.cssText = "width:100%;height:96px;object-fit:contain;display:block"; b.appendChild(im); b.appendChild(el("small", null, it.nombre));
          b.onclick = function () { cargarImg(it.src).then(function () { nuevaPieza({ tipo: "clip", src: it.src, hcm: it.alto || 8 }); }); }; rej.appendChild(b);
        }); p.appendChild(rej);
      } else if (tab === "forma") {
        p.appendChild(el("span", "etq", "Formas para fondos, arcos y capas"));
        var ff = el("div", "fila"); FORMAS.forEach(function (f) { ff.appendChild(chip(f[1], false, function () { nuevaPieza({ tipo: "forma", forma: f[0], color: "#2C9090", hcm: f[0] === "cinta" ? 3 : 8, borde: "ninguno" }); })); }); p.appendChild(ff);
        p.appendChild(el("p", "nota", "Ponle color con la pieza seleccionada. Puedes apilar formas: un arco grande detrás y uno más chico delante, como en tus toppers de capas."));
      } else if (tab === "texto") {
        p.appendChild(el("span", "etq", "Nombres, edades y frases"));
        var fr = el("div", "fila");
        [["Feliz cumple", 5], ["Nombre", 6], ["5", 9], ["Mamá", 6]].forEach(function (a) { fr.appendChild(chip(a[0], false, function () { cargarFuente("Pacifico").then(dibujar); nuevaPieza({ tipo: "texto", texto: a[0], fuente: "Pacifico", color: "#E0457B", hcm: a[1] }); })); }); p.appendChild(fr);
        p.appendChild(el("p", "nota", "Después cambia el texto, la letra y el color tocando la pieza en la torta."));
      } else {
        var bt = chip("📷 Subir una imagen", true, function () { subir(); }); p.appendChild(bt);
        p.appendChild(el("p", "nota", "Mejor un PNG con fondo transparente. Si subes un JPG saldrá un rectángulo. Tu imagen se queda en tu dispositivo."));
      }
    }
    function subir() {
      var inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/png,image/webp,image/jpeg";
      inp.onchange = function () {
        var f = inp.files && inp.files[0]; if (!f) return; var fr = new FileReader();
        fr.onload = function () {
          var im = new Image(); im.onload = function () {
            var s = Math.min(1, 1200 / Math.max(im.naturalWidth, im.naturalHeight)), k = document.createElement("canvas"); k.width = Math.round(im.naturalWidth * s); k.height = Math.round(im.naturalHeight * s); k.getContext("2d").drawImage(im, 0, 0, k.width, k.height);
            var key = "f" + (nfoto++); fotos[key] = k.toDataURL("image/png"); cargarImg(key).then(function () { nuevaPieza({ tipo: "foto", src: key, hcm: 8 }); msg(f.type === "image/jpeg" ? "Ojo: un JPG no tiene transparencia, saldrá con su rectángulo." : ""); });
          }; im.onerror = function () { msg("No pude abrir esa imagen."); }; im.src = fr.result;
        }; fr.readAsDataURL(f);
      }; inp.click();
    }
    function renderTodo() { renderTorta(); renderPanel(); renderSel(); dibujar(); precargarTodo().then(dibujar); }
    function precargarTodo() { var ps = []; S.piezas.forEach(function (p) { if (p.src) ps.push(cargarImg(p.src)); if (p.tipo === "texto") ps.push(cargarFuente(p.fuente)); }); return Promise.all(ps); }

    /* ---------- hoja A4 ---------- */
    function armarPaginas() {
      var W = A4.w - 2 * A4.m, H = A4.h - 2 * A4.m - A4.pie, avisos = 0;
      var items = S.piezas.map(function (p) {
        var m = medidas(p), b = bordeCm(p), w = m.w + 2 * b, h = m.h + 2 * b, esc = Math.min(1, W / w, H / h);
        if (esc < 1) { avisos++; return { p: p, esc: esc, w: w * esc, h: h * esc }; } return { p: p, esc: 1, w: w, h: h };
      }).sort(function (a, b) { return b.h - a.h; });
      var pags = [];
      function colocar(it) {
        for (var i = 0; i < pags.length; i++) {
          var pg = pags[i];
          for (var j = 0; j < pg.filas.length; j++) { var f = pg.filas[j]; if (it.h <= f.h + 0.001 && f.x + it.w <= W + 0.001) { pg.items.push({ it: it, x: A4.m + f.x, y: A4.m + f.y }); f.x += it.w + A4.sep; return; } }
          var y = pg.filas.length ? pg.filas[pg.filas.length - 1].y + pg.filas[pg.filas.length - 1].h + A4.sep : 0;
          if (y + it.h <= H + 0.001) { pg.filas.push({ y: y, h: it.h, x: it.w + A4.sep }); pg.items.push({ it: it, x: A4.m, y: A4.m + y }); return; }
        }
        pags.push({ filas: [{ y: 0, h: it.h, x: it.w + A4.sep }], items: [{ it: it, x: A4.m, y: A4.m }] });
      }
      items.forEach(colocar); pags = pags.map(function (pg) { return pg.items; });
      return { pags: pags, avisos: avisos };
    }
    function pintarPagina(items, k, n, total) {
      var cc = document.createElement("canvas"); cc.width = Math.round(A4.w * k); cc.height = Math.round(A4.h * k); var x = cc.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, cc.width, cc.height); x.imageSmoothingQuality = "high";
      items.forEach(function (o) {
        var q = clon(o.it.p); q.hcm = q.hcm * o.it.esc; q.id = o.it.p.id + "_h"; var r = ensamblar(q, k); if (!r) return;
        x.drawImage(r.cv, Math.round(o.x * k), Math.round(o.y * k));
      });
      var fs = Math.round(0.34 * k); x.fillStyle = "#8a8a8a"; x.font = fs + "px 'Segoe UI',system-ui,sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
      x.fillText("Imprime al 100% (tamaño real) · corta por el borde · pega un palito de brocheta por detrás de los toppers", cc.width / 2, (A4.h - A4.m - 0.75) * k);
      x.fillText("Hecho en Universo Ka · Yelioki" + (total > 1 ? "  ·  Hoja " + n + " de " + total : ""), cc.width / 2, (A4.h - A4.m - 0.25) * k);
      return cc;
    }
    function crearHoja() {
      if (!S.piezas.length) { msg("Primero pon algunas piezas sobre la torta ✨"); return; }
      if (ocupado) return; ocupado = true; msg("Armando tu hoja A4…");
      precargarTodo().then(function () {
        var r = armarPaginas(); paginas = r.pags; var cont = $("tpHojas"); cont.innerHTML = "";
        paginas.forEach(function (items, i) { var cc = pintarPagina(items, 40, i + 1, paginas.length); cc.className = "hoja"; cont.appendChild(cc); });
        $("tpResultado").hidden = false; $("tpAviso").textContent = r.avisos ? "Ojo: " + r.avisos + " pieza(s) eran más grandes que la hoja y las achiqué para que quepan." : (paginas.length > 1 ? "Tus piezas ocupan " + paginas.length + " hojas." : "");
        setTimeout(function () { $("tpResultado").scrollIntoView({ behavior: "smooth", block: "start" }); }, 50); msg("");
      }).then(function () { ocupado = false; });
    }
    function paginaJpeg(i, k, calidad) { return new Promise(function (res) { var cc = pintarPagina(paginas[i], k, i + 1, paginas.length); cc.toBlob(function (b) { res({ b: b, w: cc.width, h: cc.height }); }, "image/jpeg", calidad); }); }
    function crearPDF(pags) {
      var enc = new TextEncoder(), parts = [], off = 0, offs = [];
      function push(x) { var b = typeof x === "string" ? enc.encode(x) : x; parts.push(b); off += b.length; }
      push("%PDF-1.4\n"); push(new Uint8Array([37, 226, 227, 207, 211, 10]));
      var n = pags.length, total = 2 + 3 * n, kids = []; for (var i = 0; i < n; i++) kids.push((3 + 3 * i) + " 0 R");
      offs[1] = off; push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
      offs[2] = off; push("2 0 obj\n<< /Type /Pages /Count " + n + " /Kids [" + kids.join(" ") + "] >>\nendobj\n");
      pags.forEach(function (pg, i) {
        var po = 3 + 3 * i, co = po + 1, io = po + 2, cs = "q 595.28 0 0 841.89 0 0 cm /Im0 Do Q";
        offs[po] = off; push(po + " 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 " + io + " 0 R >> >> /Contents " + co + " 0 R >>\nendobj\n");
        offs[co] = off; push(co + " 0 obj\n<< /Length " + cs.length + " >>\nstream\n" + cs + "\nendstream\nendobj\n");
        offs[io] = off; push(io + " 0 obj\n<< /Type /XObject /Subtype /Image /Width " + pg.w + " /Height " + pg.h + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + pg.bytes.length + " >>\nstream\n"); push(pg.bytes); push("\nendstream\nendobj\n");
      });
      var xo = off; push("xref\n0 " + (total + 1) + "\n0000000000 65535 f \n"); for (var j = 1; j <= total; j++) push(String(offs[j]).padStart(10, "0") + " 00000 n \n");
      push("trailer\n<< /Size " + (total + 1) + " /Root 1 0 R >>\nstartxref\n" + xo + "\n%%EOF"); return new Blob(parts, { type: "application/pdf" });
    }
    function bajar(blob, nombre) { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nombre; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000); }
    function nombre(ext) { return "yelioki-topper-" + new Date().toISOString().slice(0, 10) + "." + ext; }
    $("tpPdf").onclick = function () {
      if (ocupado || !paginas.length) return; ocupado = true; msg("Preparando el PDF en alta calidad…");
      var k = 300 / 2.54, out = [], seq = Promise.resolve();
      paginas.forEach(function (_, i) { seq = seq.then(function () { return paginaJpeg(i, k, 0.93); }).then(function (r) { return r.b.arrayBuffer().then(function (ab) { out.push({ bytes: new Uint8Array(ab), w: r.w, h: r.h }); }); }); });
      seq.then(function () { bajar(crearPDF(out), nombre("pdf")); msg("¡Listo! PDF A4 guardado 📄"); }).catch(function () { msg("No pude crear el PDF, prueba de nuevo."); }).then(function () { ocupado = false; });
    };
    $("tpPng").onclick = function () {
      if (ocupado || !paginas.length) return; ocupado = true; msg("Preparando PNG en alta calidad…"); var k = 300 / 2.54, seq = Promise.resolve();
      paginas.forEach(function (_, i) { seq = seq.then(function () { var cc = pintarPagina(paginas[i], k, i + 1, paginas.length); return new Promise(function (res) { cc.toBlob(function (b) { bajar(b, nombre("png").replace(".png", paginas.length > 1 ? "-" + (i + 1) + ".png" : ".png")); res(); }); }); }); });
      seq.then(function () { msg("¡Listo! Imagen guardada 🖼️"); }).catch(function () { msg("No pude crear la imagen."); }).then(function () { ocupado = false; });
    };
    $("tpPrint").onclick = function () {
      if (!paginas.length) return; var area = $("tpPrintArea"); area.innerHTML = "";
      paginas.forEach(function (items, i) { var cc = pintarPagina(items, 300 / 2.54 / 2, i + 1, paginas.length), im = new Image(); im.src = cc.toDataURL("image/jpeg", 0.92); area.appendChild(im); });
      setTimeout(function () { window.print(); }, 200);
    };
    $("tpCrear").onclick = crearHoja;
    $("tpWa").href = "https://wa.me/" + (cfg.whatsapp || "56932938800") + "?text=" + encodeURIComponent(cfg.waTexto || "Hola Yeli 💛 Armé un topper en Universo Ka y me gustaría pedirlo impreso y cortado. Te envío mi diseño por aquí.");

    /* ---------- arranque ---------- */
    var tiene = cargarGuardado(); ajustarInicio();
    function ajustarInicio() { renderTabs(); renderTorta(); renderPanel(); renderSel(); dibujar(); }
    fetch(cfg.clipartsUrl, { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (j) { cat = j.colecciones || []; }).catch(function () { cat = []; }).then(function () {
      renderPanel();
      if (tiene) { msg("Recuperé tu último diseño 💛"); precargarTodo().then(function () { dibujar(); }); }
      hist = []; hpos = -1; commit(); dibujar();
    });
    window.ToppersEstado = { get: function () { return S; }, crearHoja: crearHoja, paginas: function () { return paginas; } };
  }
  window.Toppers = { iniciar: iniciar };
})();
