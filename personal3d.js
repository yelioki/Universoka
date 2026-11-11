/* Personalizador 3D · Universo Ka (Yelioki)
   Escribe un nombre, elige un dibujo y mira cómo quedaría la pieza impresa en 2 a 4 colores.
   Descarga un 3MF con un objeto por color (o un ZIP con un STL por color). Todo ocurre en tu dispositivo. */
(function () {
  "use strict";
  var $ = function (i) { return document.getElementById(i); };
  function nodo(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  var PPM = 8; // píxeles por mm al trazar contornos

  var FUENTES = [["Fredoka", 700], ["Baloo 2", 700], ["Pacifico", 400], ["Lobster", 400], ["Bebas Neue", 400], ["Dancing Script", 700], ["Playfair Display", 700], ["Quicksand", 700], ["Amatic SC", 700]];
  var PALETAS = [
    { n: "Menta", c: ["#2D8F89", "#FFFFFF", "#FFD166", "#FFFFFF"] }, { n: "Rosa", c: ["#F4A7C0", "#FFFFFF", "#C2185B", "#FFFFFF"] },
    { n: "Navidad", c: ["#1E7B4A", "#FFFFFF", "#C0392B", "#FFD166"] }, { n: "Cielo", c: ["#4A90D9", "#FFFFFF", "#FFD166", "#1B3A66"] },
    { n: "Lila", c: ["#8E6BBF", "#FFFFFF", "#F7D154", "#FFFFFF"] }, { n: "Noche", c: ["#1B2A3A", "#FFD166", "#7BE6D6", "#FFFFFF"] }
  ];
  var ETQ = ["Base", "Texto", "Dibujo", "Borde"];

  /* ---------- formas vectoriales incluidas ---------- */
  var FORMAS = [
    ["corazon", "❤️", function (c, s) { c.beginPath(); c.moveTo(.5 * s, .92 * s); c.bezierCurveTo(.1 * s, .62 * s, 0, .38 * s, .12 * s, .2 * s); c.bezierCurveTo(.24 * s, .02 * s, .46 * s, .06 * s, .5 * s, .26 * s); c.bezierCurveTo(.54 * s, .06 * s, .76 * s, .02 * s, .88 * s, .2 * s); c.bezierCurveTo(s, .38 * s, .9 * s, .62 * s, .5 * s, .92 * s); c.fill(); }],
    ["estrella", "⭐", function (c, s) { c.beginPath(); for (var i = 0; i < 10; i++) { var r = i % 2 ? .22 : .5, a = -Math.PI / 2 + i * Math.PI / 5; c.lineTo(s * (.5 + Math.cos(a) * r), s * (.54 + Math.sin(a) * r)); } c.closePath(); c.fill(); }],
    ["luna", "🌙", function (c, s) { c.beginPath(); c.arc(.5 * s, .5 * s, .45 * s, 0, 7); c.fill(); c.globalCompositeOperation = "destination-out"; c.beginPath(); c.arc(.68 * s, .4 * s, .36 * s, 0, 7); c.fill(); c.globalCompositeOperation = "source-over"; }],
    ["flor", "🌸", function (c, s) { for (var i = 0; i < 5; i++) { var a = i * Math.PI * 2 / 5 - Math.PI / 2; c.beginPath(); c.arc(s * (.5 + Math.cos(a) * .25), s * (.5 + Math.sin(a) * .25), .21 * s, 0, 7); c.fill(); } c.beginPath(); c.arc(.5 * s, .5 * s, .2 * s, 0, 7); c.fill(); }],
    ["nube", "☁️", function (c, s) { [[.3, .6, .2], [.5, .45, .26], [.72, .6, .2]].forEach(function (k) { c.beginPath(); c.arc(k[0] * s, k[1] * s, k[2] * s, 0, 7); c.fill(); }); c.fillRect(.3 * s, .6 * s, .42 * s, .2 * s); }],
    ["huella", "🐾", function (c, s) { c.beginPath(); c.ellipse(.5 * s, .66 * s, .24 * s, .2 * s, 0, 0, 7); c.fill(); [[.2, .42], [.4, .26], [.6, .26], [.8, .42]].forEach(function (k) { c.beginPath(); c.ellipse(k[0] * s, k[1] * s, .1 * s, .13 * s, 0, 0, 7); c.fill(); }); }]
  ];

  /* ---------- máscaras ---------- */
  function lienzo(w, h) { var c = document.createElement("canvas"); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; }
  function maskDeCanvas(c) { var d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data, n = c.width * c.height, m = new Uint8Array(n); for (var i = 0; i < n; i++) m[i] = d[i * 4 + 3] > 127 ? 1 : 0; return m; }
  function recorte(m, w, h) {
    var x0 = w, y0 = h, x1 = -1, y1 = -1, x, y; for (y = 0; y < h; y++) for (x = 0; x < w; x++) if (m[y * w + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return null; var nw = x1 - x0 + 1, nh = y1 - y0 + 1, o = new Uint8Array(nw * nh); for (y = 0; y < nh; y++) for (x = 0; x < nw; x++) o[y * nw + x] = m[(y + y0) * w + x + x0]; return { w: nw, h: nh, m: o };
  }
  function edt(m, W, H) { // distancia² exacta al píxel activo más cercano (Felzenszwalb)
    var INF = 1e20, f = new Float32Array(W * H), n = Math.max(W, H), v = new Int32Array(n), z = new Float32Array(n + 1), g = new Float32Array(n), d = new Float32Array(n), x, y, q, k, s;
    for (var i = 0; i < W * H; i++) f[i] = m[i] ? 0 : INF;
    function pasada(len, get, put) {
      for (q = 0; q < len; q++) g[q] = get(q); k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
      for (q = 1; q < len; q++) { s = ((g[q] + q * q) - (g[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); while (s <= z[k]) { k--; s = ((g[q] + q * q) - (g[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); } k++; v[k] = q; z[k] = s; z[k + 1] = INF; }
      k = 0; for (q = 0; q < len; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + g[v[k]]; put(q, d[q]); }
    }
    for (x = 0; x < W; x++) pasada(H, function (q) { return f[q * W + x]; }, function (q, val) { f[q * W + x] = val; });
    for (y = 0; y < H; y++) pasada(W, function (q) { return f[y * W + q]; }, function (q, val) { f[y * W + q] = val; });
    return f;
  }
  function dilatar(m, W, H, r) { if (r <= 0) return m.slice(); var f = edt(m, W, H), o = new Uint8Array(W * H), r2 = r * r; for (var i = 0; i < o.length; i++) o[i] = f[i] <= r2 ? 1 : 0; return o; }
  function erosionar(m, W, H, r) { if (r <= 0) return m.slice(); var inv = new Uint8Array(W * H), i; for (i = 0; i < inv.length; i++) inv[i] = m[i] ? 0 : 1; var f = edt(inv, W, H), o = new Uint8Array(W * H), r2 = r * r; for (i = 0; i < o.length; i++) o[i] = (m[i] && f[i] > r2) ? 1 : 0; return o; }
  function rellenar(m, W, H) { // rellena huecos cerrados
    var bg = new Uint8Array(W * H), st = new Int32Array(W * H), sp = 0, i, x, y;
    function push(p) { if (!bg[p] && !m[p]) { bg[p] = 1; st[sp++] = p; } }
    for (x = 0; x < W; x++) { push(x); push((H - 1) * W + x); } for (y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
    while (sp) { i = st[--sp]; x = i % W; y = (i / W) | 0; if (x > 0) push(i - 1); if (x < W - 1) push(i + 1); if (y > 0) push(i - W); if (y < H - 1) push(i + W); }
    var o = new Uint8Array(W * H); for (i = 0; i < o.length; i++) o[i] = bg[i] ? 0 : 1; return o;
  }
  function bbox(m, W, H) { var x0 = W, y0 = H, x1 = -1, y1 = -1, x, y; for (y = 0; y < H; y++) for (x = 0; x < W; x++) if (m[y * W + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return x1 < 0 ? null : { x0: x0, y0: y0, x1: x1, y1: y1 }; }

  /* ---------- contornos (marching squares) ---------- */
  var CASOS = { 1: [[3, 0]], 2: [[0, 1]], 3: [[3, 1]], 4: [[1, 2]], 5: [[3, 0], [1, 2]], 6: [[0, 2]], 7: [[3, 2]], 8: [[3, 2]], 9: [[0, 2]], 10: [[0, 1], [3, 2]], 11: [[1, 2]], 12: [[3, 1]], 13: [[0, 1]], 14: [[3, 0]] }; // aristas: 0 arriba, 1 derecha, 2 abajo, 3 izquierda
  function contornos(m, W, H) {
    var ady = new Map(), x, y;
    function id(e, cx, cy) { return e === 0 ? 2 * (cy * W + cx) : e === 1 ? 2 * (cy * W + cx + 1) + 1 : e === 2 ? 2 * ((cy + 1) * W + cx) : 2 * (cy * W + cx) + 1; }
    function une(a, b) { var A = ady.get(a); if (!A) ady.set(a, A = []); A.push(b); var B = ady.get(b); if (!B) ady.set(b, B = []); B.push(a); }
    for (y = 0; y < H - 1; y++) for (x = 0; x < W - 1; x++) {
      var c = (m[y * W + x] ? 1 : 0) | (m[y * W + x + 1] ? 2 : 0) | (m[(y + 1) * W + x + 1] ? 4 : 0) | (m[(y + 1) * W + x] ? 8 : 0), s = CASOS[c]; if (!s) continue;
      for (var k = 0; k < s.length; k++) une(id(s[k][0], x, y), id(s[k][1], x, y));
    }
    var vis = new Set(), lazos = [];
    function pos(n) { var h = n % 2 === 0, q = h ? n / 2 : (n - 1) / 2, py = (q / W) | 0, px = q % W; return h ? [px + 0.5, py] : [px, py + 0.5]; }
    ady.forEach(function (_, ini) {
      if (vis.has(ini)) return; var lz = [], cur = ini, prev = -1, guard = 0;
      while (cur !== undefined && !vis.has(cur) && guard++ < 5e6) {
        vis.add(cur); lz.push(pos(cur)); var vs = ady.get(cur), sig; sig = undefined;
        for (var i = 0; i < vs.length; i++) if (!vis.has(vs[i])) { sig = vs[i]; break; } prev = cur; cur = sig;
      }
      if (lz.length >= 4) lazos.push(lz);
    });
    return lazos;
  }
  function dp(p, eps) { // Douglas-Peucker sobre polilínea abierta
    if (p.length < 3) return p; var keep = new Uint8Array(p.length); keep[0] = keep[p.length - 1] = 1; var st = [[0, p.length - 1]];
    while (st.length) {
      var s = st.pop(), a = p[s[0]], b = p[s[1]], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1e-9, mx = -1, mi = -1;
      for (var i = s[0] + 1; i < s[1]; i++) { var d = Math.abs((p[i][0] - a[0]) * dy - (p[i][1] - a[1]) * dx) / l; if (d > mx) { mx = d; mi = i; } }
      if (mx > eps) { keep[mi] = 1; st.push([s[0], mi], [mi, s[1]]); }
    }
    return p.filter(function (_, i) { return keep[i]; });
  }
  function suavizar(p) { var o = [], n = p.length; for (var i = 0; i < n; i++) { var a = p[i], b = p[(i + 1) % n]; o.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]); } return o; }
  function area2(p) { var s = 0; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
  function dentro(p, pt) { var c = false; for (var i = 0, j = p.length - 1; i < p.length; j = i++) { var a = p[i], b = p[j]; if ((a[1] > pt[1]) !== (b[1] > pt[1]) && pt[0] < (b[0] - a[0]) * (pt[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
  function lazosMM(m, W, H, ox, oy) { // máscara → lazos en mm (y hacia arriba), exteriores antihorarios y huecos horarios
    var L = contornos(m, W, H).map(function (l) { var fi = 0, fd = -1; l.forEach(function (q, i) { var d = Math.hypot(q[0] - l[0][0], q[1] - l[0][1]); if (d > fd) { fd = d; fi = i; } }); var s1 = dp(l.slice(0, fi + 1), 0.55), s2 = dp(l.slice(fi).concat([l[0]]), 0.55), s = s1.concat(s2.slice(1, -1)); if (s.length < 3) return null; s = suavizar(s); return s.map(function (q) { return [(q[0] - ox) / PPM, (oy - q[1]) / PPM]; }); }).filter(function (l) { return l && Math.abs(area2(l)) > 0.35; });
    L.forEach(function (l, i) {
      var prof = 0; L.forEach(function (o, j) { if (i !== j && Math.abs(area2(o)) > Math.abs(area2(l)) && dentro(o, l[0])) prof++; });
      var a = area2(l); if ((prof % 2 === 0) !== (a > 0)) l.reverse();
    });
    return L;
  }

  /* ---------- extrusión ---------- */
  function extruir(lazos, z0, z1) {
    var T = [], i, j; function tr(a, b, c) { T.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); }
    Corte3D.tapa(lazos).forEach(function (t) { tr([t[0][0], t[0][1], z1], [t[1][0], t[1][1], z1], [t[2][0], t[2][1], z1]); tr([t[0][0], t[0][1], z0], [t[2][0], t[2][1], z0], [t[1][0], t[1][1], z0]); });
    lazos.forEach(function (l) { for (i = 0; i < l.length; i++) { var p = l[i], q = l[(i + 1) % l.length]; tr([p[0], p[1], z0], [q[0], q[1], z0], [q[0], q[1], z1]); tr([p[0], p[1], z0], [q[0], q[1], z1], [p[0], p[1], z1]); } });
    return new Float32Array(T);
  }

  /* ---------- sprites de texto y dibujo ---------- */
  function spriteTexto(p) {
    var lineas = p.texto.split("\n").map(function (s) { return s.trim(); }).filter(Boolean); if (!lineas.length) return null;
    var fs = Math.round(p.altoTxt * PPM), lh = fs * 1.12, c0 = lienzo(10, 10).getContext("2d"), fam = '"' + p.fuente[0] + '", "Segoe UI", sans-serif', fnt = p.fuente[1] + " " + fs + "px " + fam; c0.font = fnt;
    var w = 0; lineas.forEach(function (l) { w = Math.max(w, c0.measureText(l).width); });
    var W = Math.ceil(w + fs), H = Math.ceil(lh * lineas.length + fs * 0.8), cv = lienzo(W, H), c = cv.getContext("2d"); c.font = fnt; c.textAlign = "center"; c.textBaseline = "alphabetic"; c.fillStyle = "#000";
    lineas.forEach(function (l, i) { c.fillText(l, W / 2, fs * 0.4 + lh * (i + 0.8)); });
    var sp = recorte(maskDeCanvas(cv), W, H); if (!sp) return null;
    if (p.grosor > 0) sp = engrosar(sp, p.grosor * PPM);
    return sp;
  }
  function engrosar(sp, r) { var pad = Math.ceil(r) + 2, W = sp.w + 2 * pad, H = sp.h + 2 * pad, m = new Uint8Array(W * H); for (var y = 0; y < sp.h; y++) for (var x = 0; x < sp.w; x++) m[(y + pad) * W + x + pad] = sp.m[y * sp.w + x]; return { w: W, h: H, m: dilatar(m, W, H, r) }; }
  var imgs = {};
  function cargarImg(src) { return new Promise(function (res) { if (imgs[src]) return res(imgs[src]); var i = new Image(); i.onload = function () { imgs[src] = i; res(i); }; i.onerror = function () { res(null); }; i.src = src; }); }
  function spriteDibujo(d, tamMm) {
    var S = Math.round(tamMm * PPM); if (!d) return null;
    if (d.forma) { var f = FORMAS.filter(function (x) { return x[0] === d.forma; })[0], cv = lienzo(S, S), c = cv.getContext("2d"); c.fillStyle = "#000"; f[2](c, S); return recorte(maskDeCanvas(cv), S, S); }
    var im = d.img; if (!im) return null; var k = S / Math.max(im.naturalWidth, im.naturalHeight), W = Math.max(1, Math.round(im.naturalWidth * k)), H = Math.max(1, Math.round(im.naturalHeight * k)), cv2 = lienzo(W, H), c2 = cv2.getContext("2d");
    c2.drawImage(im, 0, 0, W, H); var data = c2.getImageData(0, 0, W, H).data, opacos = 0, i, n = W * H, m = new Uint8Array(n);
    for (i = 0; i < n; i++) if (data[i * 4 + 3] > 250) opacos++;
    if (opacos > n * 0.985) { for (i = 0; i < n; i++) { var l = data[i * 4] * .3 + data[i * 4 + 1] * .59 + data[i * 4 + 2] * .11; m[i] = l < 170 ? 1 : 0; } } // dibujo oscuro sobre fondo claro
    else for (i = 0; i < n; i++) m[i] = data[i * 4 + 3] > 110 ? 1 : 0;
    return recorte(m, W, H);
  }

  /* ---------- construcción de la pieza ---------- */
  function construir(p) {
    var gap = Math.round(2 * PPM), tx = spriteTexto(p), dr = p.dibujo ? spriteDibujo(p.dibujo, p.tamDib) : null;
    if (!tx && !dr) return null;
    var items = [], cw, ch;
    if (tx && dr) {
      if (p.disp === "izq" || p.disp === "der") { cw = tx.w + gap + dr.w; ch = Math.max(tx.w ? tx.h : 0, dr.h); var a = p.disp === "izq" ? dr : tx, b = p.disp === "izq" ? tx : dr; items.push({ s: a, x: 0, y: (ch - a.h) / 2, k: a === tx ? "t" : "d" }, { s: b, x: a.w + gap, y: (ch - b.h) / 2, k: b === tx ? "t" : "d" }); }
      else { cw = Math.max(tx.w, dr.w); ch = tx.h + gap + dr.h; var a2 = p.disp === "arriba" ? dr : tx, b2 = p.disp === "arriba" ? tx : dr; items.push({ s: a2, x: (cw - a2.w) / 2, y: 0, k: a2 === tx ? "t" : "d" }, { s: b2, x: (cw - b2.w) / 2, y: a2.h + gap, k: b2 === tx ? "t" : "d" }); }
    } else { var u = tx || dr; cw = u.w; ch = u.h; items.push({ s: u, x: 0, y: 0, k: tx ? "t" : "d" }); }
    var M = Math.ceil((p.margen + 14 + (p.forma === "ovalo" ? 0.45 * Math.max(cw, ch) / PPM : 0)) * PPM), W = Math.round(cw) + 2 * M, H = Math.round(ch) + 2 * M;
    if (W * H > 7e6) throw new Error("grande");
    var TM = new Uint8Array(W * H), DM = new Uint8Array(W * H);
    items.forEach(function (it) { var T = it.k === "t" ? TM : DM, ox = M + Math.round(it.x), oy = M + Math.round(it.y); for (var y = 0; y < it.s.h; y++) for (var x = 0; x < it.s.w; x++) if (it.s.m[y * it.s.w + x]) T[(y + oy) * W + x + ox] = 1; });
    var i, tD = dilatar(TM, W, H, 0.4 * PPM); for (i = 0; i < DM.length; i++) if (tD[i]) DM[i] = 0;
    var U = new Uint8Array(W * H); for (i = 0; i < U.length; i++) U[i] = TM[i] | DM[i];
    var bb = bbox(U, W, H), base, mg = p.margen * PPM;
    if (p.forma === "contorno") { var cierre = 2.5 * PPM; base = erosionar(dilatar(U, W, H, mg + cierre), W, H, cierre); base = rellenar(base, W, H); }
    else {
      var cv = lienzo(W, H), c = cv.getContext("2d"); c.fillStyle = "#000"; var bw = bb.x1 - bb.x0 + 1, bh = bb.y1 - bb.y0 + 1, cx = (bb.x0 + bb.x1) / 2, cy = (bb.y0 + bb.y1) / 2;
      if (p.forma === "placa") { var rw = bw + 2 * mg, rh = bh + 2 * mg, rad = Math.min(8 * PPM, rw / 2, rh / 2); c.beginPath(); c.moveTo(cx - rw / 2 + rad, cy - rh / 2); c.arcTo(cx + rw / 2, cy - rh / 2, cx + rw / 2, cy + rh / 2, rad); c.arcTo(cx + rw / 2, cy + rh / 2, cx - rw / 2, cy + rh / 2, rad); c.arcTo(cx - rw / 2, cy + rh / 2, cx - rw / 2, cy - rh / 2, rad); c.arcTo(cx - rw / 2, cy - rh / 2, cx + rw / 2, cy - rh / 2, rad); c.closePath(); c.fill(); }
      else { c.beginPath(); c.ellipse(cx, cy, bw / 2 * Math.SQRT2 + mg, bh / 2 * Math.SQRT2 + mg, 0, 0, 7); c.fill(); }
      base = maskDeCanvas(cv);
    }
    var bb2 = bbox(base, W, H), hr = p.diamArg / 2 * PPM, hole = null;
    if (p.argolla) {
      var Rb = hr + 2.5 * PPM, cx2 = (bb2.x0 + bb2.x1) / 2, top = H, x;
      for (x = Math.max(0, Math.floor(cx2 - Rb)); x <= Math.min(W - 1, Math.ceil(cx2 + Rb)); x++) for (var yy = 0; yy < H; yy++) if (base[yy * W + x]) { if (yy < top) top = yy; break; }
      if (top === H) top = bb2.y0; var cyb = top - (Rb - 3 * PPM), cv3 = lienzo(W, H), c3 = cv3.getContext("2d"); c3.fillStyle = "#000"; c3.beginPath(); c3.arc(cx2, cyb, Rb, 0, 7); c3.fill();
      var boss = maskDeCanvas(cv3); for (i = 0; i < base.length; i++) base[i] |= boss[i];
      var cv4 = lienzo(W, H), c4 = cv4.getContext("2d"); c4.fillStyle = "#000"; c4.beginPath(); c4.arc(cx2, cyb, hr, 0, 7); c4.fill(); hole = maskDeCanvas(cv4);
      for (i = 0; i < base.length; i++) if (hole[i]) base[i] = 0;
      bb2 = bbox(base, W, H);
    }
    var rim = null;
    if (p.borde) { var e = erosionar(base, W, H, p.anchoBorde * PPM), cerca = dilatar(U, W, H, 0.3 * PPM); rim = new Uint8Array(W * H); for (i = 0; i < rim.length; i++) rim[i] = (base[i] && !e[i] && !cerca[i]) ? 1 : 0; }
    var ox = (bb2.x0 + bb2.x1) / 2, oy = (bb2.y0 + bb2.y1) / 2, zb = p.grBase, zr = p.grBase + p.relieve;
    var capas = [{ id: 0, nombre: "base", lz: lazosMM(base, W, H, ox, oy), z0: 0, z1: zb }];
    if (tx) capas.push({ id: 1, nombre: "texto", lz: lazosMM(TM, W, H, ox, oy), z0: zb, z1: zr });
    if (dr) capas.push({ id: 2, nombre: "dibujo", lz: lazosMM(DM, W, H, ox, oy), z0: zb, z1: zr });
    if (rim) capas.push({ id: 3, nombre: "borde", lz: lazosMM(rim, W, H, ox, oy), z0: zb, z1: zr });
    capas.forEach(function (k) { k.tri = k.lz.length ? extruir(k.lz, k.z0, k.z1) : new Float32Array(0); });
    capas = capas.filter(function (k) { return k.tri.length; });
    return { capas: capas, w: (bb2.x1 - bb2.x0 + 1) / PPM, h: (bb2.y1 - bb2.y0 + 1) / PPM, alto: zr };
  }

  /* ---------- 3MF y STL ---------- */
  function hex2(h) { return h.replace("#", "").toUpperCase(); }
  function a3mf(capas, nombres) {
    var objs = "", mats = "", build = "", i;
    capas.forEach(function (k, n) {
      var vm = new Map(), V = [], T = [], t = k.tri;
      for (i = 0; i < t.length; i += 3) { var key = Math.round(t[i] * 1e4) + "," + Math.round(t[i + 1] * 1e4) + "," + Math.round(t[i + 2] * 1e4), id = vm.get(key); if (id === undefined) { id = V.length / 3; vm.set(key, id); V.push(t[i], t[i + 1], t[i + 2]); } T.push(id); }
      var vs = "", ts = ""; for (i = 0; i < V.length; i += 3) vs += '<vertex x="' + V[i].toFixed(4) + '" y="' + V[i + 1].toFixed(4) + '" z="' + V[i + 2].toFixed(4) + '"/>';
      for (i = 0; i < T.length; i += 3) ts += '<triangle v1="' + T[i] + '" v2="' + T[i + 1] + '" v3="' + T[i + 2] + '"/>';
      mats += '<base name="' + nombres[n].nombre + '" displaycolor="#' + hex2(nombres[n].color) + '"/>';
      objs += '<object id="' + (n + 2) + '" name="' + nombres[n].nombre + '" type="model" pid="1" pindex="' + n + '"><mesh><vertices>' + vs + "</vertices><triangles>" + ts + "</triangles></mesh></object>";
      build += '<item objectid="' + (n + 2) + '"/>';
    });
    var xml = '<?xml version="1.0" encoding="UTF-8"?><model unit="millimeter" xml:lang="es" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><metadata name="Title">Yelioki · Universo Ka</metadata><resources><basematerials id="1">' + mats + "</basematerials>" + objs + "</resources><build>" + build + "</build></model>";
    var enc = new TextEncoder();
    return Corte3D.zip([
      { name: "[Content_Types].xml", data: enc.encode('<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>') },
      { name: "_rels/.rels", data: enc.encode('<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>') },
      { name: "3D/3dmodel.model", data: enc.encode(xml) }
    ]);
  }

  /* ---------- visor WebGL ---------- */
  function visor(cv) {
    var gl = cv.getContext("webgl", { antialias: true, alpha: false, preserveDrawingBuffer: true }) || cv.getContext("experimental-webgl"); if (!gl) return null;
    function sh(t, s) { var x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); return x; }
    var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, "attribute vec3 aPos;attribute vec3 aNor;uniform mat4 uVP;varying vec3 vN;varying vec3 vW;void main(){vW=aPos;vN=aNor;gl_Position=uVP*vec4(aPos,1.0);}"));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, "precision mediump float;uniform vec3 uCol;uniform vec3 uCam;varying vec3 vN;varying vec3 vW;void main(){vec3 n=normalize(vN);vec3 v=normalize(uCam-vW);vec3 L=normalize(vec3(-0.35,-0.45,0.85));float dif=max(dot(n,L),0.0);float rim=pow(1.0-abs(dot(n,v)),3.0)*0.12;float sp=pow(max(dot(reflect(-L,n),v),0.0),24.0)*0.18;gl_FragColor=vec4(uCol*(0.40+0.68*dif)+rim+sp,1.0);}"));
    gl.linkProgram(pr); gl.useProgram(pr);
    var aP = gl.getAttribLocation(pr, "aPos"), aN = gl.getAttribLocation(pr, "aNor"), uVP = gl.getUniformLocation(pr, "uVP"), uC = gl.getUniformLocation(pr, "uCol"), uCam = gl.getUniformLocation(pr, "uCam");
    var obj = [], suelo = null, az = -1.5708, elev = 0.95, dist = 120, tgt = [0, 0, 2], raf = 0;
    function buf(a) { var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, a, gl.STATIC_DRAW); return b; }
    function normales(t) { var n = new Float32Array(t.length); for (var i = 0; i < t.length; i += 9) { var ux = t[i + 3] - t[i], uy = t[i + 4] - t[i + 1], uz = t[i + 5] - t[i + 2], vx = t[i + 6] - t[i], vy = t[i + 7] - t[i + 1], vz = t[i + 8] - t[i + 2], x = uy * vz - uz * vy, y = uz * vx - ux * vz, z = ux * vy - uy * vx, l = Math.hypot(x, y, z) || 1; for (var k = 0; k < 3; k++) { n[i + k * 3] = x / l; n[i + k * 3 + 1] = y / l; n[i + k * 3 + 2] = z / l; } } return n; }
    suelo = { p: buf(new Float32Array([-400, -400, -0.05, 400, -400, -0.05, 400, 400, -0.05, -400, -400, -0.05, 400, 400, -0.05, -400, 400, -0.05])), n: buf(new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1])) };
    function mul(a, b) { var o = new Float32Array(16); for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) { var s = 0; for (var k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; }
    function dibujar() {
      var r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.max(2, Math.round(r.width * dpr)), h = Math.max(2, Math.round(r.height * dpr)); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      gl.viewport(0, 0, w, h); gl.clearColor(0.06, 0.12, 0.13, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST);
      var e = [tgt[0] + dist * Math.cos(elev) * Math.cos(az), tgt[1] + dist * Math.cos(elev) * Math.sin(az), tgt[2] + dist * Math.sin(elev)];
      var f = 1 / Math.tan(0.35), nr = dist / 40, fr = dist * 12, P = new Float32Array([f / (w / h), 0, 0, 0, 0, f, 0, 0, 0, 0, (fr + nr) / (nr - fr), -1, 0, 0, 2 * fr * nr / (nr - fr), 0]);
      var zz = [e[0] - tgt[0], e[1] - tgt[1], e[2] - tgt[2]], l = Math.hypot(zz[0], zz[1], zz[2]); zz = zz.map(function (v) { return v / l; });
      var xx = [-zz[1], zz[0], 0], lx = Math.hypot(xx[0], xx[1]) || 1; xx = [xx[0] / lx, xx[1] / lx, 0]; var yy = [zz[1] * xx[2] - zz[2] * xx[1], zz[2] * xx[0] - zz[0] * xx[2], zz[0] * xx[1] - zz[1] * xx[0]];
      var V = new Float32Array([xx[0], yy[0], zz[0], 0, xx[1], yy[1], zz[1], 0, xx[2], yy[2], zz[2], 0, -(xx[0] * e[0] + xx[1] * e[1] + xx[2] * e[2]), -(yy[0] * e[0] + yy[1] * e[1] + yy[2] * e[2]), -(zz[0] * e[0] + zz[1] * e[1] + zz[2] * e[2]), 1]);
      gl.uniformMatrix4fv(uVP, false, mul(P, V)); gl.uniform3f(uCam, e[0], e[1], e[2]); gl.enableVertexAttribArray(aP); gl.enableVertexAttribArray(aN);
      gl.bindBuffer(gl.ARRAY_BUFFER, suelo.p); gl.vertexAttribPointer(aP, 3, gl.FLOAT, false, 0, 0); gl.bindBuffer(gl.ARRAY_BUFFER, suelo.n); gl.vertexAttribPointer(aN, 3, gl.FLOAT, false, 0, 0); gl.uniform3f(uC, 0.10, 0.20, 0.21); gl.drawArrays(gl.TRIANGLES, 0, 6);
      obj.forEach(function (o) { gl.bindBuffer(gl.ARRAY_BUFFER, o.p); gl.vertexAttribPointer(aP, 3, gl.FLOAT, false, 0, 0); gl.bindBuffer(gl.ARRAY_BUFFER, o.n); gl.vertexAttribPointer(aN, 3, gl.FLOAT, false, 0, 0); gl.uniform3f(uC, o.c[0], o.c[1], o.c[2]); gl.drawArrays(gl.TRIANGLES, 0, o.k); });
    }
    function pedir() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; dibujar(); }); }
    function rgb(h) { h = h.replace("#", ""); return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255]; }
    var pts = {};
    cv.addEventListener("pointerdown", function (e) { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) { } pts[e.pointerId] = { x: e.clientX, y: e.clientY }; });
    cv.addEventListener("pointermove", function (e) {
      var p = pts[e.pointerId]; if (!p) return; var ks = Object.keys(pts);
      if (ks.length === 1) { az -= (e.clientX - p.x) * 0.008; elev = Math.max(0.05, Math.min(1.55, elev + (e.clientY - p.y) * 0.008)); p.x = e.clientX; p.y = e.clientY; }
      else if (ks.length === 2) { var o = pts[ks[0] === String(e.pointerId) ? ks[1] : ks[0]], d0 = Math.hypot(p.x - o.x, p.y - o.y); p.x = e.clientX; p.y = e.clientY; var d1 = Math.hypot(p.x - o.x, p.y - o.y); if (d0 > 0 && d1 > 0) dist = Math.max(20, Math.min(900, dist * d0 / d1)); }
      pedir();
    });
    function fin(e) { delete pts[e.pointerId]; } cv.addEventListener("pointerup", fin); cv.addEventListener("pointercancel", fin);
    cv.addEventListener("wheel", function (e) { e.preventDefault(); dist = Math.max(20, Math.min(900, dist * Math.exp(e.deltaY * 0.0012))); pedir(); }, { passive: false });
    window.addEventListener("resize", pedir);
    return {
      poner: function (capas, colores, tam) { obj = capas.map(function (k, i) { return { p: buf(k.tri), n: buf(normales(k.tri)), k: k.tri.length / 3, c: rgb(colores[i]) }; }); tgt = [0, 0, tam.alto / 2]; this.encuadrar(tam); pedir(); },
      colores: function (colores) { obj.forEach(function (o, i) { o.c = rgb(colores[i]); }); pedir(); },
      encuadrar: function (tam) { dist = Math.max(60, Math.max(tam.w, tam.h) * 1.9); pedir(); },
      vista: function (a, e) { az = a; elev = e; pedir(); }, pedir: pedir
    };
  }

  /* ---------- aplicación ---------- */
  function iniciar(cfg) {
    var cv = $("cv3p"), V = visor(cv); if (!V) { $("lbSinGL").hidden = false; return; }
    var S = { texto: "Sofía", fuente: FUENTES[0], altoTxt: 14, grosor: 0, dibujo: { forma: "corazon" }, dibNombre: "Corazón", tamDib: 24, disp: "arriba", forma: "contorno", margen: 3.5, grBase: 2.4, relieve: 1.2, argolla: true, diamArg: 4, borde: true, anchoBorde: 1.2, nCol: 4, pal: 0, cols: PALETAS[0].c.slice() };
    try { var g = JSON.parse(localStorage.getItem("ka_lab3d") || "null"); if (g && g.v === 2) { S.texto = g.texto; S.fuente = g.fuente; S.altoTxt = g.altoTxt; S.tamDib = g.tamDib; S.disp = g.disp; S.forma = g.forma; S.cols = g.cols || S.cols; S.nCol = g.nCol || 4; S.argolla = g.argolla !== false; S.borde = g.borde !== false; if (g.dibujo && g.dibujo.forma) { S.dibujo = g.dibujo; S.dibNombre = g.dibNombre; } else if (g.dibujo === null) S.dibujo = null; } } catch (e) { }
    var cur = null, tmr = 0, nconstr = 0;

    function colorDe(id) { var c = S.cols; if (S.nCol === 2) return id === 0 ? c[0] : c[1]; if (S.nCol === 3) return id === 3 ? c[0] : c[id]; return c[id]; }
    function coloresActuales() { return cur.capas.map(function (k) { return colorDe(k.id); }); }
    function guardar() { try { localStorage.setItem("ka_lab3d", JSON.stringify({ v: 2, texto: S.texto, fuente: S.fuente, altoTxt: S.altoTxt, tamDib: S.tamDib, disp: S.disp, forma: S.forma, cols: S.cols, nCol: S.nCol, argolla: S.argolla, borde: S.borde, dibujo: S.dibujo && S.dibujo.forma ? S.dibujo : (S.dibujo ? undefined : null), dibNombre: S.dibNombre })); } catch (e) { } }
    function msg(t) { var m = $("lbMsg"); m.textContent = t || ""; clearTimeout(msg.t); if (t) msg.t = setTimeout(function () { m.textContent = ""; }, 6000); }
    function pedirConstruir(inmediato) { clearTimeout(tmr); tmr = setTimeout(reconstruir, inmediato ? 0 : 220); }
    function reconstruir() {
      var n = ++nconstr, fam = '"' + S.fuente[0] + '"';
      var ps = [document.fonts && document.fonts.load ? document.fonts.load(S.fuente[1] + " 40px " + fam, S.texto || "A").catch(function () { }) : Promise.resolve()];
      if (S.dibujo && S.dibujo.src) ps.push(cargarImg(S.dibujo.src).then(function (im) { S.dibujo.img = im; }));
      Promise.all(ps).then(function () {
        if (n !== nconstr) return; var r;
        try { r = construir({ texto: S.texto, fuente: S.fuente, altoTxt: S.altoTxt, grosor: S.grosor, dibujo: S.dibujo, tamDib: S.tamDib, disp: S.disp, forma: S.forma, margen: S.margen, grBase: S.grBase, relieve: S.relieve, argolla: S.argolla, diamArg: S.diamArg, borde: S.borde, anchoBorde: S.anchoBorde }); }
        catch (e) { msg(e && e.message === "grande" ? "La pieza quedó demasiado grande: baja el tamaño del texto o del dibujo." : "No pude armar la pieza con estos datos."); return; }
        if (!r) { $("lbVacioP").hidden = false; cur = null; $("lbInfoP").innerHTML = ""; V.poner([], [], { w: 60, h: 40, alto: 2 }); return; }
        $("lbVacioP").hidden = true; var primera = !cur; cur = r; V.poner(r.capas, coloresActuales(), { w: r.w, h: r.h, alto: r.alto }); if (!primera) { } info(); guardar();
      });
    }
    function info() {
      if (!cur) return; var f = $("lbInfoP"); f.innerHTML = "";
      function fila(a, b) { var d = nodo("div", "lbfila"); d.appendChild(nodo("span", null, a)); d.appendChild(nodo("b", null, b)); f.appendChild(d); }
      var cs = coloresActuales(), distintos = {}; cs.forEach(function (c) { distintos[c.toLowerCase()] = 1; });
      fila("Tamaño", cur.w.toFixed(0) + " × " + cur.h.toFixed(0) + " × " + cur.alto.toFixed(1) + " mm"); fila("Colores", Object.keys(distintos).length + " (cambios de filamento en la capa " + Math.round(S.grBase / 0.2) + " si imprimes con capas de 0,2 mm)");
      var ex = cur.w > 180 || cur.h > 180; if (ex) fila("⚠️", "Es muy grande, revisa que quepa en tu cama");
      var delg = S.altoTxt < 9 || (S.fuente[1] < 600 && S.grosor === 0 && S.altoTxt < 14); if (delg) fila("💡", "Letras finas: sube el tamaño o usa «Engrosar»");
    }

    /* panel */
    function chips(cont, lista, sel, fn) { var c = $(cont); c.innerHTML = ""; lista.forEach(function (x, i) { var b = nodo("button", "chip" + (sel(x, i) ? " on" : ""), x.t); b.type = "button"; if (x.s) b.style.cssText = x.s; b.onclick = function () { fn(x, i); chips(cont, lista, sel, fn); }; c.appendChild(b); }); }
    function slider(id, lab, min, max, step, get, set, unidad) {
      var c = $(id); c.innerHTML = ""; var l = nodo("label", null, lab), v = nodo("b", null, ""), r = document.createElement("input"); r.type = "range"; r.min = min; r.max = max; r.step = step; r.value = get();
      function pinta() { v.textContent = (+r.value).toString().replace(".", ",") + " " + unidad; } pinta(); r.oninput = function () { set(+r.value); pinta(); pedirConstruir(); }; c.appendChild(l); c.appendChild(r); c.appendChild(v);
    }
    $("lbTexto").value = S.texto; $("lbTexto").oninput = function () { S.texto = this.value; pedirConstruir(); };
    chips("lbFuentes", FUENTES.map(function (f) { return { t: f[0], f: f, s: "font-family:'" + f[0] + "',sans-serif;font-weight:" + f[1] }; }), function (x) { return x.f[0] === S.fuente[0]; }, function (x) { S.fuente = x.f; pedirConstruir(true); });
    slider("lbSzTxt", "Altura de letra", 6, 40, 1, function () { return S.altoTxt; }, function (v) { S.altoTxt = v; }, "mm");
    slider("lbGroTxt", "Engrosar letras", 0, 1.5, 0.1, function () { return S.grosor; }, function (v) { S.grosor = v; }, "mm");
    function listaDibujos() {
      var c = $("lbDibujos"); c.innerHTML = ""; var n = nodo("button", "sello" + (!S.dibujo ? " on" : ""), "∅"); n.title = "Sin dibujo"; n.onclick = function () { S.dibujo = null; S.dibNombre = ""; listaDibujos(); pedirConstruir(true); }; c.appendChild(n);
      FORMAS.forEach(function (f) { var b = nodo("button", "sello" + (S.dibujo && S.dibujo.forma === f[0] ? " on" : ""), f[1]); b.title = f[0]; b.onclick = function () { S.dibujo = { forma: f[0] }; S.dibNombre = f[0]; listaDibujos(); pedirConstruir(true); }; c.appendChild(b); });
      (listaDibujos.extra || []).forEach(function (it) { var b = nodo("button", "sello" + (S.dibujo && S.dibujo.src === it.src ? " on" : "")), im = document.createElement("img"); im.src = it.src; im.alt = it.nombre; b.title = it.nombre; b.appendChild(im); b.onclick = function () { S.dibujo = { src: it.src }; S.dibNombre = it.nombre; listaDibujos(); pedirConstruir(true); }; c.appendChild(b); });
    }
    fetch(cfg.clipartsUrl || "toppers-cliparts.json").then(function (r) { return r.json(); }).then(function (d) { var ex = []; (d.colecciones || []).forEach(function (col) { (col.items || []).forEach(function (it) { ex.push({ src: it.src, nombre: it.nombre }); }); }); listaDibujos.extra = ex; listaDibujos(); }).catch(function () { });
    listaDibujos();
    $("lbSubir").onclick = function () { var i = document.createElement("input"); i.type = "file"; i.accept = "image/*"; i.onchange = function () { var f = i.files[0]; if (!f) return; var u = URL.createObjectURL(f); cargarImg(u).then(function (im) { if (!im) { msg("No pude leer esa imagen."); return; } S.dibujo = { src: u, img: im }; S.dibNombre = "imagen propia"; listaDibujos(); pedirConstruir(true); msg("Tip: funciona mejor con PNG de fondo transparente o un dibujo oscuro sobre fondo blanco."); }); }; i.click(); };
    slider("lbSzDib", "Tamaño del dibujo", 8, 90, 1, function () { return S.tamDib; }, function (v) { S.tamDib = v; }, "mm");
    chips("lbDisp", [{ t: "⬆ Arriba", v: "arriba" }, { t: "⬇ Abajo", v: "abajo" }, { t: "⬅ Izquierda", v: "izq" }, { t: "➡ Derecha", v: "der" }], function (x) { return x.v === S.disp; }, function (x) { S.disp = x.v; pedirConstruir(true); });
    chips("lbForma", [{ t: "✨ Contorno", v: "contorno" }, { t: "▭ Placa", v: "placa" }, { t: "⬭ Óvalo", v: "ovalo" }], function (x) { return x.v === S.forma; }, function (x) { S.forma = x.v; pedirConstruir(true); });
    slider("lbMargen", "Margen", 2, 10, 0.5, function () { return S.margen; }, function (v) { S.margen = v; }, "mm");
    slider("lbGrBase", "Grosor de la base", 1.2, 5, 0.2, function () { return S.grBase; }, function (v) { S.grBase = v; }, "mm");
    slider("lbRel", "Altura del relieve", 0.4, 3, 0.2, function () { return S.relieve; }, function (v) { S.relieve = v; }, "mm");
    chips("lbArg", [{ t: "🔑 Con argolla", v: true }, { t: "Sin argolla", v: false }], function (x) { return x.v === S.argolla; }, function (x) { S.argolla = x.v; pedirConstruir(true); });
    chips("lbBorde", [{ t: "Con borde", v: true }, { t: "Sin borde", v: false }], function (x) { return x.v === S.borde; }, function (x) { S.borde = x.v; pedirConstruir(true); });
    function colorPanel() {
      chips("lbNCol", [{ t: "2 colores", v: 2 }, { t: "3 colores", v: 3 }, { t: "4 colores", v: 4 }], function (x) { return x.v === S.nCol; }, function (x) { S.nCol = x.v; colorPanel(); recolorear(true); });
      chips("lbPal", PALETAS.map(function (p, i) { return { t: p.n, i: i }; }), function (x) { return false; }, function (x) { S.cols = PALETAS[x.i].c.slice(); colorPanel(); recolorear(true); });
      var c = $("lbColores"); c.innerHTML = ""; var ids = S.nCol === 2 ? [0, 1] : S.nCol === 3 ? [0, 1, 2] : [0, 1, 2, 3], et = S.nCol === 2 ? ["Base y borde", "Texto y dibujo"] : S.nCol === 3 ? ["Base y borde", "Texto", "Dibujo"] : ETQ;
      ids.forEach(function (id, k) { var d = nodo("label", "colfila"), i = document.createElement("input"); i.type = "color"; i.value = S.cols[id]; i.oninput = function () { S.cols[id] = i.value; recolorear(false); }; d.appendChild(i); d.appendChild(nodo("span", null, et[k])); c.appendChild(d); });
    }
    function recolorear(rebuild) { if (!cur) return; V.colores(coloresActuales()); info(); guardar(); }
    colorPanel();
    chips("lbVistas", [{ t: "Como quedará", a: -1.5708, e: 1.0 }, { t: "Desde arriba", a: -1.5708, e: 1.55 }, { t: "De lado", a: -1.2, e: 0.25 }], function () { return false; }, function (x) { V.vista(x.a, x.e); });

    /* tabs */
    var tabs = ["lbT1", "lbT2", "lbT3", "lbT4"];
    Array.prototype.forEach.call(document.querySelectorAll(".ek-tabs button"), function (b) { b.onclick = function () { Array.prototype.forEach.call(document.querySelectorAll(".ek-tabs button"), function (x) { x.classList.toggle("on", x === b); }); tabs.forEach(function (t) { $(t).hidden = t !== b.dataset.t; }); }; });

    /* salida */
    function nombreBase() { return (S.texto.split("\n")[0] || "pieza").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "pieza"; }
    function bajar(blob, nombre) { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nombre; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000); }
    function nom() { return cur.capas.map(function (k) { return { nombre: k.nombre, color: colorDe(k.id) }; }); }
    $("lb3mf").onclick = function () { if (!cur) return; bajar(a3mf(cur.capas, nom()), "yelioki-" + nombreBase() + ".3mf"); msg("¡Listo! 3MF con un objeto por color 💾"); };
    $("lbZipStl").onclick = function () { if (!cur) return; var no = nom(), f = cur.capas.map(function (k, i) { return { name: (i + 1) + "-" + k.nombre + "-" + no[i].color.replace("#", "") + ".stl", data: Corte3D.stlBytes(k.tri) }; }); bajar(Corte3D.zip(f), "yelioki-" + nombreBase() + "-stl.zip"); msg("¡Listo! Un STL por color en un ZIP 📦"); };
    $("lbWaP").onclick = function (e) {
      if (!cur) { e.preventDefault(); return; } var cs = {}; coloresActuales().forEach(function (c) { cs[c.toUpperCase()] = 1; });
      this.href = "https://wa.me/" + (cfg.whatsapp || "56932938800") + "?text=" + encodeURIComponent("Hola Yeli 💛 Diseñé esto en el Laboratorio 3D de Universo Ka y lo quiero impreso.\nTexto: " + S.texto.replace(/\n/g, " / ") + "\nFuente: " + S.fuente[0] + "\nDibujo: " + (S.dibujo ? S.dibNombre : "ninguno") + "\nTamaño: " + cur.w.toFixed(0) + " × " + cur.h.toFixed(0) + " mm\nColores: " + Object.keys(cs).join(", ") + (S.argolla ? "\nCon argolla" : ""));
    };
    pedirConstruir(true);
    window.Lab3DP = { estado: function () { return cur ? { capas: cur.capas.map(function (k) { return [k.nombre, k.tri.length / 9]; }), w: cur.w, h: cur.h } : null; }, S: S, cur: function () { return cur; }, reconstruir: reconstruir, a3mf: function () { return a3mf(cur.capas, nom()); } };
  }
  window.Lab3DPIniciar = iniciar;
})();
