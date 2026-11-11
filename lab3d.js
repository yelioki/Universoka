/* Laboratorio 3D · Universo Ka (Yelioki)
   Visor WebGL propio (sin librerías): abre STL, OBJ y 3MF, cambia tamaño en mm, orienta,
   marca zonas que necesitan soporte y descarga un STL ajustado. El archivo nunca sale del dispositivo. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function chip(txt, on, fn, extra) { var b = el("button", "chip" + (on ? " on" : "") + (extra ? " " + extra : ""), txt); b.type = "button"; b.onclick = fn; return b; }

  var CAMAS = [{ n: "180 × 180", w: 180, d: 180 }, { n: "220 × 220", w: 220, d: 220 }, { n: "250 × 210", w: 250, d: 210 }, { n: "256 × 256", w: 256, d: 256 }];
  var BASE = [0.28, 0.70, 0.73], ROJO = [0.95, 0.26, 0.26];

  /* ---------- matemática mínima ---------- */
  function mul4(a, b) { var o = new Float32Array(16); for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) { var s = 0; for (var k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; }
  function persp(f, a, n, fa) { var t = 1 / Math.tan(f / 2); return new Float32Array([t / a, 0, 0, 0, 0, t, 0, 0, 0, 0, (fa + n) / (n - fa), -1, 0, 0, 2 * fa * n / (n - fa), 0]); }
  function norm3(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function lookAt(e, c, u) {
    var z = norm3([e[0] - c[0], e[1] - c[1], e[2] - c[2]]), x = norm3(cross(u, z)), y = cross(z, x);
    return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, e), -dot(y, e), -dot(z, e), 1]);
  }
  var I3 = function () { return [1, 0, 0, 0, 1, 0, 0, 0, 1]; };
  function mul3(a, b) { var o = []; for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) o.push(a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c]); return o; }
  function rotEje(eje, grados) {
    var a = grados * Math.PI / 180, c = Math.round(Math.cos(a) * 1e6) / 1e6, s = Math.round(Math.sin(a) * 1e6) / 1e6;
    if (eje === "x") return [1, 0, 0, 0, c, -s, 0, s, c]; if (eje === "y") return [c, 0, s, 0, 1, 0, -s, 0, c]; return [c, -s, 0, s, c, 0, 0, 0, 1];
  }
  function rotDe(a, b) { // rotación que lleva el vector a sobre el vector b
    var v = cross(a, b), c = dot(a, b);
    if (c < -0.99999) { var p = Math.abs(a[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], ax = norm3(cross(a, p)); return [2 * ax[0] * ax[0] - 1, 2 * ax[0] * ax[1], 2 * ax[0] * ax[2], 2 * ax[0] * ax[1], 2 * ax[1] * ax[1] - 1, 2 * ax[1] * ax[2], 2 * ax[0] * ax[2], 2 * ax[1] * ax[2], 2 * ax[2] * ax[2] - 1]; }
    var k = 1 / (1 + c), vx = [0, -v[2], v[1], v[2], 0, -v[0], -v[1], v[0], 0], v2 = mul3(vx, vx), o = I3();
    for (var i = 0; i < 9; i++) o[i] += vx[i] + v2[i] * k; return o;
  }

  /* ---------- lectores de archivos ---------- */
  function leerSTL(buf) {
    var dv = new DataView(buf), n = buf.byteLength >= 84 ? dv.getUint32(80, true) : 0;
    if (buf.byteLength >= 84 && 84 + n * 50 === buf.byteLength) {
      var p = new Float32Array(n * 9), o = 84;
      for (var i = 0; i < n; i++) { o += 12; for (var j = 0; j < 9; j++) { p[i * 9 + j] = dv.getFloat32(o, true); o += 4; } o += 2; }
      return p;
    }
    var txt = new TextDecoder().decode(buf), re = /vertex\s+([-+0-9.eE]+)\s+([-+0-9.eE]+)\s+([-+0-9.eE]+)/g, m, a = [];
    while ((m = re.exec(txt))) a.push(+m[1], +m[2], +m[3]);
    if (a.length >= 9) return new Float32Array(a.slice(0, a.length - a.length % 9));
    if (buf.byteLength >= 84 && 84 + n * 50 <= buf.byteLength) { var p2 = new Float32Array(n * 9), o2 = 84; for (var i2 = 0; i2 < n; i2++) { o2 += 12; for (var j2 = 0; j2 < 9; j2++) { p2[i2 * 9 + j2] = dv.getFloat32(o2, true); o2 += 4; } o2 += 2; } return p2; }
    throw new Error("stl");
  }
  function leerOBJ(buf) {
    var lines = new TextDecoder().decode(buf).split(/\r?\n/), V = [], T = [];
    lines.forEach(function (l) {
      if (l.charCodeAt(0) === 118 && l.charCodeAt(1) === 32) { var s = l.trim().split(/\s+/); V.push([+s[1], +s[2], +s[3]]); }
      else if (l.charCodeAt(0) === 102 && l.charCodeAt(1) === 32) {
        var f = l.trim().split(/\s+/).slice(1).map(function (t) { var k = parseInt(t.split("/")[0], 10); return k < 0 ? V.length + k : k - 1; });
        for (var i = 1; i + 1 < f.length; i++) T.push(f[0], f[i], f[i + 1]);
      }
    });
    var p = new Float32Array(T.length * 3);
    T.forEach(function (ix, i) { var v = V[ix] || [0, 0, 0]; p[i * 3] = v[0]; p[i * 3 + 1] = v[1]; p[i * 3 + 2] = v[2]; });
    if (!p.length) throw new Error("obj");
    // los OBJ suelen venir con Y hacia arriba: pasamos a Z hacia arriba
    for (var k = 0; k < p.length; k += 3) { var y = p[k + 1], z = p[k + 2]; p[k + 1] = -z; p[k + 2] = y; }
    return p;
  }
  function inflar(data) { return new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer().then(function (ab) { return new Uint8Array(ab); }); }
  function leerZip(buf) {
    var dv = new DataView(buf), u8 = new Uint8Array(buf), i = buf.byteLength - 22;
    for (; i >= 0; i--) if (dv.getUint32(i, true) === 0x06054b50) break;
    if (i < 0) return Promise.reject(new Error("zip"));
    var n = dv.getUint16(i + 10, true), off = dv.getUint32(i + 16, true), ents = {};
    for (var k = 0; k < n; k++) {
      if (dv.getUint32(off, true) !== 0x02014b50) break;
      var met = dv.getUint16(off + 10, true), csz = dv.getUint32(off + 20, true), nl = dv.getUint16(off + 28, true), el2 = dv.getUint16(off + 30, true), cl = dv.getUint16(off + 32, true), lho = dv.getUint32(off + 42, true);
      var name = new TextDecoder().decode(u8.subarray(off + 46, off + 46 + nl)); off += 46 + nl + el2 + cl;
      if (/\.(model|rels|xml)$/i.test(name)) ents[name.replace(/^\//, "")] = { met: met, csz: csz, lho: lho };
    }
    var out = {}, seq = Promise.resolve();
    Object.keys(ents).forEach(function (nm) {
      seq = seq.then(function () {
        var e = ents[nm], lnl = dv.getUint16(e.lho + 26, true), lel = dv.getUint16(e.lho + 28, true), ds = e.lho + 30 + lnl + lel, data = u8.subarray(ds, ds + e.csz);
        return e.met === 0 ? data : e.met === 8 ? inflar(data) : null;
      }).then(function (b) { if (b) out[nm] = new TextDecoder().decode(b); }).catch(function () { });
    });
    return seq.then(function () { return out; });
  }
  var UNIDAD = { millimeter: 1, centimeter: 10, inch: 25.4, meter: 1000, micron: 0.001, foot: 304.8 };
  function matDe(s) { if (!s) return [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]; var a = s.trim().split(/\s+/).map(Number); return a.length === 12 ? a : [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]; }
  function aplica(M, x, y, z) { return [x * M[0] + y * M[3] + z * M[6] + M[9], x * M[1] + y * M[4] + z * M[7] + M[10], x * M[2] + y * M[5] + z * M[8] + M[11]]; }
  function compone(A, B) { // aplica A y luego B
    var o = []; for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) o.push(A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c]);
    var t = aplica(B, A[9], A[10], A[11]); o.push(t[0], t[1], t[2]); return o;
  }
  function attr(e, n) { return e.getAttribute(n) || e.getAttribute("p:" + n) || ""; }
  function leer3MF(buf) {
    return leerZip(buf).then(function (files) {
      var principal = files["3D/3dmodel.model"] || files[Object.keys(files).filter(function (k) { return /3dmodel\.model$/i.test(k); })[0]];
      if (!principal) throw new Error("3mf");
      var cache = {};
      function modelo(nombre) {
        if (cache[nombre]) return cache[nombre]; var txt = files[nombre]; if (!txt) return null;
        var doc = new DOMParser().parseFromString(txt, "application/xml"), root = doc.documentElement, objs = {};
        Array.prototype.forEach.call(doc.getElementsByTagName("object"), function (o) {
          var ob = { v: null, t: null, comps: [] }, mesh = o.getElementsByTagName("mesh")[0];
          if (mesh) {
            var vs = mesh.getElementsByTagName("vertex"), ts = mesh.getElementsByTagName("triangle"), V = new Float32Array(vs.length * 3), T = new Uint32Array(ts.length * 3), i;
            for (i = 0; i < vs.length; i++) { V[i * 3] = +vs[i].getAttribute("x"); V[i * 3 + 1] = +vs[i].getAttribute("y"); V[i * 3 + 2] = +vs[i].getAttribute("z"); }
            for (i = 0; i < ts.length; i++) { T[i * 3] = +ts[i].getAttribute("v1"); T[i * 3 + 1] = +ts[i].getAttribute("v2"); T[i * 3 + 2] = +ts[i].getAttribute("v3"); }
            ob.v = V; ob.t = T;
          }
          Array.prototype.forEach.call(o.getElementsByTagName("component"), function (c) { ob.comps.push({ id: c.getAttribute("objectid"), path: attr(c, "path").replace(/^\//, ""), m: matDe(c.getAttribute("transform")) }); });
          objs[o.getAttribute("id")] = ob;
        });
        return (cache[nombre] = { unit: UNIDAD[root.getAttribute("unit")] || 1, objs: objs, doc: doc });
      }
      var out = [];
      function recoger(nombre, id, M, depth) {
        var mo = modelo(nombre); if (!mo || depth > 8) return; var ob = mo.objs[id]; if (!ob) return;
        if (ob.v) for (var i = 0; i < ob.t.length; i++) { var p = aplica(M, ob.v[ob.t[i] * 3], ob.v[ob.t[i] * 3 + 1], ob.v[ob.t[i] * 3 + 2]); out.push(p[0], p[1], p[2]); }
        ob.comps.forEach(function (c) { recoger(c.path || nombre, c.id, compone(c.m, M), depth + 1); });
      }
      var main = modelo(Object.keys(files).filter(function (k) { return files[k] === principal; })[0]);
      var items = main.doc.getElementsByTagName("item");
      var nombreMain = Object.keys(files).filter(function (k) { return files[k] === principal; })[0];
      if (items.length) Array.prototype.forEach.call(items, function (it) { recoger(nombreMain, it.getAttribute("objectid"), matDe(it.getAttribute("transform")), 0); });
      else Object.keys(main.objs).forEach(function (id) { recoger(nombreMain, id, matDe(""), 0); });
      if (!out.length) throw new Error("3mf");
      var f = main.unit, p = new Float32Array(out.length); for (var k = 0; k < out.length; k++) p[k] = out[k] * f; return p;
    });
  }
  function cargarArchivo(file) {
    return file.arrayBuffer().then(function (buf) {
      var n = file.name.toLowerCase();
      if (/\.3mf$/.test(n)) return leer3MF(buf).then(function (p) { return { p: p, tipo: "3MF" }; });
      if (/\.obj$/.test(n)) return { p: leerOBJ(buf), tipo: "OBJ" };
      return { p: leerSTL(buf), tipo: "STL" };
    });
  }

  /* ---------- modelo de ejemplo: un hongo (con voladizos para probar) ---------- */
  function hongo() {
    var T = [], N = 56;
    function tri(a, b, c) { T.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); }
    var r1 = 8, h1 = 30, r2 = 24, i, a0, a1, c0, s0, c1, s1;
    for (i = 0; i < N; i++) {
      a0 = i / N * 6.2832; a1 = (i + 1) / N * 6.2832; c0 = Math.cos(a0); s0 = Math.sin(a0); c1 = Math.cos(a1); s1 = Math.sin(a1);
      tri([c0 * r1, s0 * r1, 0], [c1 * r1, s1 * r1, 0], [c1 * r1, s1 * r1, h1]); tri([c0 * r1, s0 * r1, 0], [c1 * r1, s1 * r1, h1], [c0 * r1, s0 * r1, h1]);
      tri([0, 0, 0], [c1 * r1, s1 * r1, 0], [c0 * r1, s0 * r1, 0]);
      tri([c0 * r2, s0 * r2, h1], [c1 * r1, s1 * r1, h1], [c1 * r2, s1 * r2, h1]); tri([c0 * r2, s0 * r2, h1], [c0 * r1, s0 * r1, h1], [c1 * r1, s1 * r1, h1]);
    }
    var R = 5;
    for (var j = 0; j < R; j++) {
      var e0 = j / R * 1.5708, e1 = (j + 1) / R * 1.5708, z0 = h1 + Math.sin(e0) * 22, z1 = h1 + Math.sin(e1) * 22, q0 = Math.cos(e0) * r2, q1 = Math.cos(e1) * r2;
      for (i = 0; i < N; i++) {
        a0 = i / N * 6.2832; a1 = (i + 1) / N * 6.2832; c0 = Math.cos(a0); s0 = Math.sin(a0); c1 = Math.cos(a1); s1 = Math.sin(a1);
        var A = [c0 * q0, s0 * q0, z0], B = [c1 * q0, s1 * q0, z0], C = [c1 * q1, s1 * q1, z1], D = [c0 * q1, s0 * q1, z1];
        if (j === R - 1) tri(A, B, [0, 0, z1]); else { tri(A, B, C); tri(A, C, D); }
      }
    }
    return new Float32Array(T);
  }

  /* ---------- app ---------- */
  function iniciar(cfg) {
    var cv = $("cv3"), gl = cv.getContext("webgl", { antialias: true, alpha: false, preserveDrawingBuffer: true }) || cv.getContext("experimental-webgl");
    if (!gl) { $("lbSinGL").hidden = false; return; }
    var pos = null, nor = null, area = null, tris = 0, nombre = "modelo", tipo = "";
    var R = I3(), esc = 1, escBase = 1, esc0 = 1, mn = [0, 0, 0], mx = [0, 0, 0], vol = 0, supPct = 0, verSop = false, cama = CAMAS[3];
    var az = -0.9, elev = 0.55, dist = 420, tgt = [0, 0, 20], bufs = {}, colBuf = null, nVert = 0;

    function prog(vs, fs) {
      function sh(t, s) { var x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); return x; }
      var p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); return p;
    }
    var pm = prog("attribute vec3 aPos;attribute vec3 aNor;attribute vec3 aCol;uniform mat4 uVP;uniform mat4 uModel;uniform mat3 uRot;varying vec3 vN;varying vec3 vW;varying vec3 vC;void main(){vec4 w=uModel*vec4(aPos,1.0);vW=w.xyz;vN=uRot*aNor;vC=aCol;gl_Position=uVP*w;}",
      "precision mediump float;uniform vec3 uCam;varying vec3 vN;varying vec3 vW;varying vec3 vC;void main(){vec3 n=normalize(vN);vec3 v=normalize(uCam-vW);float d=abs(dot(n,v));float t=max(n.z,0.0)*0.22;vec3 c=vC*(0.30+0.60*d+t);float sp=pow(max(2.0*d*d-1.0,0.0),14.0)*0.16;gl_FragColor=vec4(c+sp,1.0);}");
    var pl = prog("attribute vec3 aPos;uniform mat4 uVP;void main(){gl_Position=uVP*vec4(aPos,1.0);}", "precision mediump float;uniform vec4 uColor;void main(){gl_FragColor=uColor;}");
    var L = { pm: { vp: gl.getUniformLocation(pm, "uVP"), model: gl.getUniformLocation(pm, "uModel"), rot: gl.getUniformLocation(pm, "uRot"), cam: gl.getUniformLocation(pm, "uCam"), aPos: gl.getAttribLocation(pm, "aPos"), aNor: gl.getAttribLocation(pm, "aNor"), aCol: gl.getAttribLocation(pm, "aCol") }, pl: { vp: gl.getUniformLocation(pl, "uVP"), col: gl.getUniformLocation(pl, "uColor"), aPos: gl.getAttribLocation(pl, "aPos") } };
    var gridBuf = gl.createBuffer(), bedBuf = gl.createBuffer(), gridN = 0;

    function armarCama() {
      var w = cama.w / 2, d = cama.d / 2, g = [], x, y;
      for (x = -w; x <= w + 0.01; x += 10) g.push(x, -d, 0, x, d, 0);
      for (y = -d; y <= d + 0.01; y += 10) g.push(-w, y, 0, w, y, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, gridBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g), gl.STATIC_DRAW); gridN = g.length / 3;
      gl.bindBuffer(gl.ARRAY_BUFFER, bedBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-w, -d, -0.05, w, -d, -0.05, w, d, -0.05, -w, -d, -0.05, w, d, -0.05, -w, d, -0.05]), gl.STATIC_DRAW);
    }
    function subirModelo() {
      nVert = tris * 3;
      [["pos", pos], ["nor", nor]].forEach(function (a) { if (!bufs[a[0]]) bufs[a[0]] = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bufs[a[0]]); gl.bufferData(gl.ARRAY_BUFFER, a[1], gl.STATIC_DRAW); });
      if (!colBuf) colBuf = gl.createBuffer(); pintarColores();
    }
    function pintarColores() {
      if (!pos) return; var c = new Uint8Array(nVert * 3), i, j;
      if (!verSop) { for (i = 0; i < nVert; i++) { c[i * 3] = BASE[0] * 255; c[i * 3 + 1] = BASE[1] * 255; c[i * 3 + 2] = BASE[2] * 255; } supPct = calcSoporte(); }
      else {
        var zmn = zMin(R), tol = Math.max(0.0035 * (mx[2] - mn[2]) / esc, 0.2 / esc), tot = 0, sup = 0;
        for (i = 0; i < tris; i++) {
          var nz = R[6] * nor[i * 9] + R[7] * nor[i * 9 + 1] + R[8] * nor[i * 9 + 2], z0 = R[6] * pos[i * 9] + R[7] * pos[i * 9 + 1] + R[8] * pos[i * 9 + 2], z1 = R[6] * pos[i * 9 + 3] + R[7] * pos[i * 9 + 4] + R[8] * pos[i * 9 + 5], z2 = R[6] * pos[i * 9 + 6] + R[7] * pos[i * 9 + 7] + R[8] * pos[i * 9 + 8];
          var enCama = Math.min(z0, z1, z2) - zmn < tol, rojo = nz < -0.7071 && !enCama; tot += area[i]; if (rojo) sup += area[i];
          var col = rojo ? ROJO : BASE; for (j = 0; j < 3; j++) { c[i * 9 + j * 3] = col[0] * 255; c[i * 9 + j * 3 + 1] = col[1] * 255; c[i * 9 + j * 3 + 2] = col[2] * 255; }
        }
        supPct = tot ? sup / tot * 100 : 0;
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, colBuf); gl.bufferData(gl.ARRAY_BUFFER, c, gl.STATIC_DRAW);
    }
    function zMin(M) { var m = 1e30; for (var i = 0; i < pos.length; i += 3) { var z = M[6] * pos[i] + M[7] * pos[i + 1] + M[8] * pos[i + 2]; if (z < m) m = z; } return m; }
    function calcSoporte() { // sin colorear: solo porcentaje
      var zmn = zMin(R), tol = Math.max(0.0035 * (mx[2] - mn[2]) / esc, 0.2 / esc), tot = 0, sup = 0;
      for (var i = 0; i < tris; i++) {
        var nz = R[6] * nor[i * 9] + R[7] * nor[i * 9 + 1] + R[8] * nor[i * 9 + 2]; tot += area[i]; if (nz >= -0.7071) continue;
        var m = Math.min(R[6] * pos[i * 9] + R[7] * pos[i * 9 + 1] + R[8] * pos[i * 9 + 2], R[6] * pos[i * 9 + 3] + R[7] * pos[i * 9 + 4] + R[8] * pos[i * 9 + 5], R[6] * pos[i * 9 + 6] + R[7] * pos[i * 9 + 7] + R[8] * pos[i * 9 + 8]);
        if (m - zmn >= tol) sup += area[i];
      } return tot ? sup / tot * 100 : 0;
    }
    function calcCaja() {
      var a = 1e30, b = 1e30, c = 1e30, A = -1e30, B = -1e30, C = -1e30;
      for (var i = 0; i < pos.length; i += 3) {
        var x = pos[i], y = pos[i + 1], z = pos[i + 2], X = R[0] * x + R[1] * y + R[2] * z, Y = R[3] * x + R[4] * y + R[5] * z, Z = R[6] * x + R[7] * y + R[8] * z;
        if (X < a) a = X; if (X > A) A = X; if (Y < b) b = Y; if (Y > B) B = Y; if (Z < c) c = Z; if (Z > C) C = Z;
      }
      mn = [a * esc, b * esc, c * esc]; mx = [A * esc, B * esc, C * esc];
    }
    function dims() { return [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]]; }

    /* ---------- cargar un modelo ---------- */
    function ponerModelo(p, nom, tp) {
      if (!ponerModelo.interno) { guardadas = []; corteRes = null; enRes = false; setRes(false); }
      var n = Math.floor(p.length / 9); if (n < 1) throw new Error("vacio");
      if (n > 1500000) throw new Error("pesado");
      pos = p.length === n * 9 ? p : p.slice(0, n * 9); tris = n; nombre = nom; tipo = tp;
      var a = [1e30, 1e30, 1e30], b = [-1e30, -1e30, -1e30], i, k;
      for (i = 0; i < pos.length; i += 3) for (k = 0; k < 3; k++) { var v = pos[i + k]; if (v < a[k]) a[k] = v; if (v > b[k]) b[k] = v; }
      var c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]; for (i = 0; i < pos.length; i += 3) { pos[i] -= c[0]; pos[i + 1] -= c[1]; pos[i + 2] -= c[2]; }
      nor = new Float32Array(pos.length); area = new Float32Array(tris); vol = 0;
      for (i = 0; i < tris; i++) {
        var o = i * 9, ux = pos[o + 3] - pos[o], uy = pos[o + 4] - pos[o + 1], uz = pos[o + 5] - pos[o + 2], vx = pos[o + 6] - pos[o], vy = pos[o + 7] - pos[o + 1], vz = pos[o + 8] - pos[o + 2];
        var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz) || 1; area[i] = l / 2;
        for (k = 0; k < 3; k++) { nor[o + k * 3] = nx / l; nor[o + k * 3 + 1] = ny / l; nor[o + k * 3 + 2] = nz / l; }
        vol += (pos[o] * (pos[o + 4] * pos[o + 8] - pos[o + 5] * pos[o + 7]) - pos[o + 1] * (pos[o + 3] * pos[o + 8] - pos[o + 5] * pos[o + 6]) + pos[o + 2] * (pos[o + 3] * pos[o + 7] - pos[o + 4] * pos[o + 6])) / 6;
      }
      vol = Math.abs(vol); R = I3(); esc = 1; escBase = 1; esc0 = 1; verSop = false; subirModelo(); calcCaja();
      // unidades sospechosas
      var d = dims(), dmax = Math.max(d[0], d[1], d[2]); $("lbUni").hidden = !(dmax < 8 || dmax > 1200);
      $("lbPanel").hidden = false; $("lbVacio").hidden = true; sugerirAjuste(); refrescar(true);
    }
    function sugerirAjuste() { var d = dims(), m = Math.max(d[0], d[1], d[2]); if (m < 8) { /* probablemente pulgadas o cm */ } }
    function encuadrar() { var d = dims(), m = Math.max(d[0], d[1], d[2], 40); tgt = [0, 0, d[2] / 2]; dist = Math.max(m * 3.2, 140); }

    /* ---------- dibujar ---------- */
    function ajustarCanvas() {
      var r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.max(2, Math.round(r.width * dpr)), h = Math.max(2, Math.round(r.height * dpr));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    }
    function dibujar() {
      ajustarCanvas(); gl.viewport(0, 0, cv.width, cv.height); gl.clearColor(0.06, 0.12, 0.13, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST);
      var e = [tgt[0] + dist * Math.cos(elev) * Math.cos(az), tgt[1] + dist * Math.cos(elev) * Math.sin(az), tgt[2] + dist * Math.sin(elev)];
      var VP = mul4(persp(0.7, cv.width / cv.height, Math.max(1, dist / 100), dist * 8 + 2000), lookAt(e, tgt, [0, 0, 1]));
      gl.useProgram(pl); gl.uniformMatrix4fv(L.pl.vp, false, VP); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
      gl.enableVertexAttribArray(L.pl.aPos);
      gl.bindBuffer(gl.ARRAY_BUFFER, bedBuf); gl.vertexAttribPointer(L.pl.aPos, 3, gl.FLOAT, false, 0, 0); gl.uniform4f(L.pl.col, 0.18, 0.56, 0.54, 0.22); gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.bindBuffer(gl.ARRAY_BUFFER, gridBuf); gl.vertexAttribPointer(L.pl.aPos, 3, gl.FLOAT, false, 0, 0); gl.uniform4f(L.pl.col, 0.48, 0.9, 0.84, 0.28); gl.drawArrays(gl.LINES, 0, gridN);
      gl.depthMask(true); gl.disable(gl.BLEND);
      if (pos) {
        var cx = -(mn[0] + mx[0]) / 2, cy = -(mn[1] + mx[1]) / 2, cz = -mn[2];
        var M = new Float32Array([esc * R[0], esc * R[3], esc * R[6], 0, esc * R[1], esc * R[4], esc * R[7], 0, esc * R[2], esc * R[5], esc * R[8], 0, cx + (mn[0] + mx[0]) / 2 * 0 + 0, cy, cz, 1]);
        // la traslación lleva el centro de la caja al centro de la cama y la base a z=0
        M[12] = -(mn[0] + mx[0]) / 2; M[13] = -(mn[1] + mx[1]) / 2; M[14] = -mn[2];
        gl.useProgram(pm); gl.uniformMatrix4fv(L.pm.vp, false, VP); gl.uniformMatrix4fv(L.pm.model, false, M);
        gl.uniformMatrix3fv(L.pm.rot, false, new Float32Array([R[0], R[3], R[6], R[1], R[4], R[7], R[2], R[5], R[8]])); gl.uniform3f(L.pm.cam, e[0], e[1], e[2]);
        gl.bindBuffer(gl.ARRAY_BUFFER, bufs.pos); gl.enableVertexAttribArray(L.pm.aPos); gl.vertexAttribPointer(L.pm.aPos, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, bufs.nor); gl.enableVertexAttribArray(L.pm.aNor); gl.vertexAttribPointer(L.pm.aNor, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, colBuf); gl.enableVertexAttribArray(L.pm.aCol); gl.vertexAttribPointer(L.pm.aCol, 3, gl.UNSIGNED_BYTE, true, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, nVert);
      }
      if (corteOn && pos && !enRes) {
        armarPlano(); gl.useProgram(pl); gl.uniformMatrix4fv(L.pl.vp, false, VP); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
        gl.bindBuffer(gl.ARRAY_BUFFER, planoBuf); gl.enableVertexAttribArray(L.pl.aPos); gl.vertexAttribPointer(L.pl.aPos, 3, gl.FLOAT, false, 0, 0); gl.uniform4f(L.pl.col, 1, 0.45, 0.55, 0.38); gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.depthMask(true); gl.disable(gl.BLEND);
      }
    }
    var raf = 0; function pedir() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; dibujar(); }); }

    /* ---------- cámara táctil ---------- */
    var pts = {}, last = null;
    cv.addEventListener("pointerdown", function (e) { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) { } pts[e.pointerId] = { x: e.clientX, y: e.clientY, b: e.button }; last = null; });
    cv.addEventListener("pointermove", function (e) {
      var p = pts[e.pointerId]; if (!p) return; var ks = Object.keys(pts);
      if (ks.length === 1) {
        var dx = e.clientX - p.x, dy = e.clientY - p.y;
        if (p.b === 2 || e.shiftKey) pan(dx, dy); else { az -= dx * 0.008; elev = Math.max(-0.05, Math.min(1.5, elev + dy * 0.008)); }
        p.x = e.clientX; p.y = e.clientY;
      } else if (ks.length === 2) {
        var o = pts[ks[0] === String(e.pointerId) ? ks[1] : ks[0]], d0 = Math.hypot(p.x - o.x, p.y - o.y), m0 = [(p.x + o.x) / 2, (p.y + o.y) / 2];
        p.x = e.clientX; p.y = e.clientY; var d1 = Math.hypot(p.x - o.x, p.y - o.y), m1 = [(p.x + o.x) / 2, (p.y + o.y) / 2];
        if (d0 > 0 && d1 > 0) dist = Math.max(30, Math.min(4000, dist * d0 / d1)); pan(m1[0] - m0[0], m1[1] - m0[1]);
      }
      pedir();
    });
    function pan(dx, dy) { var k = dist * 0.0016, r = [-Math.sin(az), Math.cos(az), 0], u = [-Math.sin(elev) * Math.cos(az), -Math.sin(elev) * Math.sin(az), Math.cos(elev)]; for (var i = 0; i < 3; i++) tgt[i] += (-r[i] * dx + u[i] * dy) * k * -1; }
    function fin(e) { delete pts[e.pointerId]; } cv.addEventListener("pointerup", fin); cv.addEventListener("pointercancel", fin);
    cv.addEventListener("wheel", function (e) { e.preventDefault(); dist = Math.max(30, Math.min(4000, dist * Math.exp(e.deltaY * 0.0012))); pedir(); }, { passive: false });
    cv.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    window.addEventListener("resize", pedir);
    function vista(a, e2) { az = a; elev = e2; pedir(); }

    /* ---------- operaciones ---------- */
    function nuevoR(M) { R = M; calcCaja(); pintarColores(); refrescar(false); }
    function girar(eje, g) { nuevoR(mul3(rotEje(eje, g), R)); }
    function candidatos() {
      var cl = {}, i, k;
      for (i = 0; i < tris; i += tris > 200000 ? 3 : 1) { var kx = Math.round(nor[i * 9] * 6), ky = Math.round(nor[i * 9 + 1] * 6), kz = Math.round(nor[i * 9 + 2] * 6), key = kx + "," + ky + "," + kz; if (!cl[key]) cl[key] = { a: 0, v: [0, 0, 0] }; cl[key].a += area[i]; cl[key].v[0] += nor[i * 9] * area[i]; cl[key].v[1] += nor[i * 9 + 1] * area[i]; cl[key].v[2] += nor[i * 9 + 2] * area[i]; }
      var arr = Object.keys(cl).map(function (k2) { return { a: cl[k2].a, d: norm3(cl[k2].v) }; }).sort(function (p, q) { return q.a - p.a; }).slice(0, 12);
      [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].forEach(function (d) { arr.push({ a: 0, d: d }); }); return arr;
    }
    function evaluar(M, paso) {
      var zmn = 1e30, zmx = -1e30, i, z; for (i = 0; i < pos.length; i += 3 * paso) { z = M[6] * pos[i] + M[7] * pos[i + 1] + M[8] * pos[i + 2]; if (z < zmn) zmn = z; if (z > zmx) zmx = z; }
      var tol = Math.max(0.0035 * (zmx - zmn), 1e-6), sup = 0, cont = 0;
      for (i = 0; i < tris; i += paso) {
        var nz = M[6] * nor[i * 9] + M[7] * nor[i * 9 + 1] + M[8] * nor[i * 9 + 2]; if (nz > -0.7071) continue;
        var m = Math.min(M[6] * pos[i * 9] + M[7] * pos[i * 9 + 1] + M[8] * pos[i * 9 + 2], M[6] * pos[i * 9 + 3] + M[7] * pos[i * 9 + 4] + M[8] * pos[i * 9 + 5], M[6] * pos[i * 9 + 6] + M[7] * pos[i * 9 + 7] + M[8] * pos[i * 9 + 8]);
        if (m - zmn < tol) { if (nz < -0.95) cont += area[i]; } else sup += area[i];
      }
      return sup - 0.5 * cont + 0.0004 * (zmx - zmn);
    }
    function mejorOrientacion() { var paso = tris > 200000 ? 3 : 1, best = null, bs = 1e30; candidatos().forEach(function (c) { var M = rotDe(c.d, [0, 0, -1]), s = evaluar(M, paso); if (s < bs) { bs = s; best = M; } }); if (best) nuevoR(best); }
    function caraGrande() { var c = candidatos()[0]; if (c) nuevoR(rotDe(c.d, [0, 0, -1])); }
    function ponerEsc(f) { esc = Math.max(1e-4, Math.min(1e4, f)); calcCaja(); pintarColores(); refrescar(false); }
    function ajustarCama() { var d = dims(), f = Math.min((cama.w * 0.92) / d[0], (cama.d * 0.92) / d[1], 300 / d[2]); ponerEsc(esc * f); }

    /* ---------- interfaz ---------- */
    var inX = $("lbX"), inY = $("lbY"), inZ = $("lbZ"), inP = $("lbPct");
    function fmt(n, d) { return (Math.round(n * Math.pow(10, d)) / Math.pow(10, d)).toLocaleString("es-CL", { maximumFractionDigits: d }); }
    function refrescar(primera) {
      var d = dims(); [inX, inY, inZ].forEach(function (i, k) { if (document.activeElement !== i) i.value = (Math.round(d[k] * 10) / 10); });
      if (document.activeElement !== inP) inP.value = Math.round(esc / escBase * 100);
      var v = vol * esc * esc * esc / 1000, g = v * 1.24, info = $("lbInfo"); info.innerHTML = "";
      function fila(t, x) { var f = el("div", "lbfila"); f.appendChild(el("span", null, t)); f.appendChild(el("b", null, x)); info.appendChild(f); }
      fila("Medidas", fmt(d[0], 1) + " × " + fmt(d[1], 1) + " × " + fmt(d[2], 1) + " mm");
      fila("Volumen", fmt(v, 1) + " cm³");
      fila("Peso aprox. en PLA", "≈ " + fmt(g * 0.3, 0) + " – " + fmt(g * 0.5, 0) + " g");
      var sop = supPct < 2 ? ["casi nada", "ok"] : supPct < 10 ? ["algo", "medio"] : ["bastante", "alto"];
      fila("Soportes (en esta posición)", sop[0] + " · " + fmt(supPct, 0) + "% de la superficie");
      fila("Triángulos", fmt(tris, 0) + " · " + tipo);
      var cabe = d[0] <= cama.w + 0.01 && d[1] <= cama.d + 0.01, av = $("lbAviso");
      if (!cabe) { av.hidden = false; av.textContent = "⚠️ No cabe en la cama de " + cama.n + " mm. Toca «Ajustar a la cama»."; } else if (d[2] > 400) { av.hidden = false; av.textContent = "⚠️ Es muy alto (" + fmt(d[2], 0) + " mm). Revisa las unidades."; } else av.hidden = true;
      if (primera) { encuadrar(); } if (corteOn && !enRes) slPos(); pedir();
    }
    function numero(inp, k) { inp.onchange = function () { var v = parseFloat(String(inp.value).replace(",", ".")); var d = dims(); if (v > 0 && d[k] > 0) ponerEsc(esc * v / d[k]); else refrescar(false); }; }
    numero(inX, 0); numero(inY, 1); numero(inZ, 2);
    inP.onchange = function () { var v = parseFloat(String(inP.value).replace(",", ".")); if (v > 0) ponerEsc(escBase * v / 100); };
    function chips(cont, lista) { var c = $(cont); c.innerHTML = ""; lista.forEach(function (x) { c.appendChild(chip(x[0], x[2], x[1], x[3])); }); }
    function menuUnidades() {
      chips("lbUnidades", [["mm", function () { escBase = 1; ponerEsc(1); menuUnidades(); }, escBase === 1], ["cm → mm (×10)", function () { escBase = 10; ponerEsc(10); menuUnidades(); }, escBase === 10], ["pulgadas → mm (×25,4)", function () { escBase = 25.4; ponerEsc(25.4); menuUnidades(); }, escBase === 25.4]]);
    }
    function menuCama() { chips("lbCama", CAMAS.map(function (c) { return [c.n + " mm", function () { cama = c; armarCama(); menuCama(); if (pos) refrescar(false); else pedir(); }, c === cama]; })); }
    function menuOri() {
      chips("lbGiro", [["↻ X", function () { girar("x", 90); }], ["↺ X", function () { girar("x", -90); }], ["↻ Y", function () { girar("y", 90); }], ["↺ Y", function () { girar("y", -90); }], ["↻ Z", function () { girar("z", 90); }], ["↺ Z", function () { girar("z", -90); }]]);
      chips("lbAuto", [["⬇ Apoyar en la cara más grande", caraGrande], ["🧠 Menos soportes", mejorOrientacion], [verSop ? "🔴 Ocultar soportes" : "🔴 Ver zonas con soporte", function () { verSop = !verSop; pintarColores(); menuOri(); refrescar(false); }, verSop], ["↺ Restablecer", function () { R = I3(); esc = escBase; calcCaja(); pintarColores(); refrescar(false); }]]);
    }
    chips("lbVistas", [["Isométrica", function () { vista(-0.9, 0.55); }], ["Frente", function () { vista(-1.5708, 0.02); }], ["Lado", function () { vista(0, 0.02); }], ["Arriba", function () { vista(-1.5708, 1.5); }]]);
    $("lbAjustar").onclick = function () { if (pos) ajustarCama(); };
    $("lbEncuadrar").onclick = function () { if (pos) { encuadrar(); pedir(); } };

    function exportarSTL() {
      if (guardadas.length || enRes) { exportarZip(); return; }
      var d = dims(), cx = -(mn[0] + mx[0]) / 2, cy = -(mn[1] + mx[1]) / 2, cz = -mn[2], buf = new ArrayBuffer(84 + tris * 50), dv = new DataView(buf), o = 84, i, j;
      dv.setUint32(80, tris, true); new Uint8Array(buf, 0, 80).set(new TextEncoder().encode("Yelioki Universo Ka - Laboratorio 3D"));
      for (i = 0; i < tris; i++) {
        var nx = R[0] * nor[i * 9] + R[1] * nor[i * 9 + 1] + R[2] * nor[i * 9 + 2], ny = R[3] * nor[i * 9] + R[4] * nor[i * 9 + 1] + R[5] * nor[i * 9 + 2], nz = R[6] * nor[i * 9] + R[7] * nor[i * 9 + 1] + R[8] * nor[i * 9 + 2];
        dv.setFloat32(o, nx, true); dv.setFloat32(o + 4, ny, true); dv.setFloat32(o + 8, nz, true); o += 12;
        for (j = 0; j < 3; j++) { var x = pos[i * 9 + j * 3], y = pos[i * 9 + j * 3 + 1], z = pos[i * 9 + j * 3 + 2]; dv.setFloat32(o, (R[0] * x + R[1] * y + R[2] * z) * esc + cx, true); dv.setFloat32(o + 4, (R[3] * x + R[4] * y + R[5] * z) * esc + cy, true); dv.setFloat32(o + 8, (R[6] * x + R[7] * y + R[8] * z) * esc + cz, true); o += 12; }
        o += 2;
      }
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([buf], { type: "model/stl" })); a.download = nombre.replace(/\.[^.]+$/, "") + "-ajustado.stl"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
      msg("¡Listo! STL guardado: " + fmt(d[0], 1) + " × " + fmt(d[1], 1) + " × " + fmt(d[2], 1) + " mm, apoyado sobre la cama 💾");
    }
    function msg(t) { var m = $("lbMsg"); m.textContent = t || ""; clearTimeout(msg.t); if (t) msg.t = setTimeout(function () { m.textContent = ""; }, 6000); }
    $("lbDescargar").onclick = function () { if (pos) exportarSTL(); };
    $("lbWa").onclick = function (e) {
      if (!pos) { e.preventDefault(); return; } var d = dims();
      this.href = "https://wa.me/" + (cfg.whatsapp || "56932938800") + "?text=" + encodeURIComponent("Hola Yeli 💛 Quiero imprimir una pieza 3D que vi en el Laboratorio de Universo Ka.\nArchivo: " + nombre + "\nMedidas: " + fmt(d[0], 1) + " × " + fmt(d[1], 1) + " × " + fmt(d[2], 1) + " mm\nSoportes: " + (supPct < 2 ? "casi nada" : supPct < 10 ? "algo" : "bastante") + "\nTe envío el archivo por aquí.");
    };

    function abrir(file) {
      msg("Leyendo tu archivo…"); cargarArchivo(file).then(function (r) { ponerModelo(r.p, file.name, r.tipo); msg(r.tipo === "OBJ" ? "Abierto. Los OBJ suelen venir con Y hacia arriba; ya lo giré. Si se ve acostado, usa los botones de giro." : "¡Listo! Tu archivo se queda en tu dispositivo 🔒"); })
        .catch(function (e) { msg(e && e.message === "pesado" ? "Ese modelo es muy pesado para el navegador (más de 1,5 millones de triángulos)." : "No pude leer ese archivo. Prueba con un STL, OBJ o 3MF."); });
    }
    $("lbAbrir").onclick = function () { var i = document.createElement("input"); i.type = "file"; i.accept = ".stl,.obj,.3mf"; i.onchange = function () { if (i.files[0]) abrir(i.files[0]); }; i.click(); };
    $("lbEjemplo").onclick = function () { ponerModelo(hongo(), "hongo-de-ejemplo.stl", "STL"); msg("Un hongo de ejemplo con sombrero ancho: pruébalo con «Ver zonas con soporte» 🍄"); };
    var zona = cv.parentNode; ["dragover", "dragenter"].forEach(function (n) { zona.addEventListener(n, function (e) { e.preventDefault(); zona.classList.add("arr"); }); });
    ["dragleave", "drop"].forEach(function (n) { zona.addEventListener(n, function (e) { e.preventDefault(); zona.classList.remove("arr"); if (n === "drop" && e.dataTransfer.files[0]) abrir(e.dataTransfer.files[0]); }); });


    /* ---------- cortar y encajes ---------- */
    var corteOn = false, eje = "z", pctCorte = 50, nEnc = 2, enRes = false, guardadas = [], corteRes = null, antes = null, nombreOrig = "", planoBuf = gl.createBuffer();
    function mundo() {
      var o = new Float32Array(pos.length), cx = (mn[0] + mx[0]) / 2, cy = (mn[1] + mx[1]) / 2, cz = mn[2];
      for (var i = 0; i < pos.length; i += 3) { var x = pos[i], y = pos[i + 1], z = pos[i + 2]; o[i] = (R[0] * x + R[1] * y + R[2] * z) * esc - cx; o[i + 1] = (R[3] * x + R[4] * y + R[5] * z) * esc - cy; o[i + 2] = (R[6] * x + R[7] * y + R[8] * z) * esc - cz; }
      return o;
    }
    function rangoEje() { var d = dims(); return eje === "z" ? [0, d[2]] : eje === "x" ? [-d[0] / 2, d[0] / 2] : [-d[1] / 2, d[1] / 2]; }
    function tCorte() { var r = rangoEje(); return r[0] + (r[1] - r[0]) * pctCorte / 100; }
    function armarPlano() {
      var d = dims(), t = tCorte(), m = 6, x0 = -d[0] / 2 - m, x1 = d[0] / 2 + m, y0 = -d[1] / 2 - m, y1 = d[1] / 2 + m, z1 = d[2] + m, q;
      if (eje === "z") q = [x0, y0, t, x1, y0, t, x1, y1, t, x0, y0, t, x1, y1, t, x0, y1, t];
      else if (eje === "x") q = [t, y0, -m, t, y1, -m, t, y1, z1, t, y0, -m, t, y1, z1, t, y0, z1];
      else q = [x0, t, -m, x1, t, -m, x1, t, z1, x0, t, -m, x1, t, z1, x0, t, z1];
      gl.bindBuffer(gl.ARRAY_BUFFER, planoBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(q), gl.DYNAMIC_DRAW);
    }
    function slPos() {
      var c = $("lbPos"); c.innerHTML = ""; var r = document.createElement("input"); r.type = "range"; r.min = 3; r.max = 97; r.value = pctCorte; var b = el("b", null, "");
      function p() { b.textContent = fmt(tCorte(), 1) + " mm"; } r.oninput = function () { pctCorte = +r.value; p(); pedir(); };
      c.appendChild(el("label", null, "Posición")); c.appendChild(r); c.appendChild(b); p();
    }
    function menuCorte() {
      chips("lbEje", [["↕ Alto", function () { eje = "z"; menuCorte(); slPos(); pedir(); }, eje === "z"], ["↔ Ancho", function () { eje = "x"; menuCorte(); slPos(); pedir(); }, eje === "x"], ["⤢ Fondo", function () { eje = "y"; menuCorte(); slPos(); pedir(); }, eje === "y"]]);
      chips("lbNEnc", [0, 1, 2, 3, 4].map(function (n) { return [n === 0 ? "Sin encajes" : n + (n === 1 ? " clavija" : " clavijas"), function () { nEnc = n; menuCorte(); }, nEnc === n]; }));
    }
    function setRes(v) {
      ["lbP1", "lbP2", "lbCorte"].forEach(function (id) { var e = $(id); if (e) e.hidden = v; }); var r = $("lbRes"); if (r) r.hidden = !v;
      var b = $("lbDescargar"); if (b) b.textContent = (v || guardadas.length) ? "📦 Descargar piezas (ZIP)" : "💾 Descargar STL ajustado";
    }
    function medidaTxt(m) { return fmt(m.w, 1) + " × " + fmt(m.d, 1) + " × " + fmt(m.h, 1) + " mm"; }
    function mostrarRes() {
      var c = $("lbResInfo"); c.innerHTML = ""; function fila(a, b) { var f = el("div", "lbfila"); f.appendChild(el("span", null, a)); f.appendChild(el("b", null, b)); c.appendChild(f); }
      corteRes.piezas.forEach(function (p) { fila(p.nombre, medidaTxt(p.med)); });
      if (corteRes.encajes) fila("Encajes", corteRes.encajes + " clavija(s) de Ø " + fmt($("lbEncD") && parseFloat($("lbEncD").value.replace(",", ".")) || 5, 1) + " mm · profundidad " + fmt(corteRes.prof, 1) + " mm");
      if (guardadas.length) fila("Piezas guardadas de cortes anteriores", String(guardadas.length));
      if (corteRes.aviso) { var a = el("div", "aviso", "⚠️ " + corteRes.aviso); a.style.marginTop = "8px"; c.appendChild(a); }
      var ac = $("lbResAcc"); ac.innerHTML = "";
      ac.appendChild(chip("↩️ Volver al modelo", false, function () { interno(antes.slice(), nombreOrig, "STL"); enRes = false; corteRes = null; setRes(false); msg("Modelo restaurado."); }));
      corteRes.piezas.forEach(function (p, i) { if (p.nombre === "clavijas") return; ac.appendChild(chip("✂️ Seguir cortando " + p.nombre, false, function () { seguir(i); })); });
    }
    function interno(p, nom, tp) { ponerModelo.interno = true; try { ponerModelo(p, nom, tp); } finally { ponerModelo.interno = false; } }
    function seguir(i) {
      var otras = corteRes.piezas.filter(function (_, k) { return k !== i; }), p = corteRes.piezas[i]; guardadas = guardadas.concat(otras); var tri = p.tri.slice();
      enRes = false; corteRes = null; interno(tri, p.nombre, "STL"); setRes(false); corteOn = true; $("lbCorteBody").hidden = false; slPos(); pedir(); msg("Ahora cortas la " + p.nombre + ". Las otras piezas quedan guardadas para la descarga.");
    }
    function cortarAhora() {
      if (!pos) return; var W = mundo(), num = function (id, d) { var v = parseFloat(String($(id).value).replace(",", ".")); return v > 0 ? v : d; }, hv = parseFloat(String($("lbEncH").value).replace(",", ".")), r;
      try { r = Corte3D.cortar(W, { eje: eje, t: tCorte(), n: nEnc, d: num("lbEncD", 5), holgura: hv >= 0 ? hv : 0.15, prof: num("lbEncP", 6) }); }
      catch (e) { msg(e && e.message === "fuera" ? "El plano no toca el modelo: muévelo hacia dentro." : e && e.message === "abierto" ? "Este modelo tiene la malla abierta (no es sólido) y no pude cerrar el corte." : "No pude cortar este modelo."); return; }
      antes = W; nombreOrig = nombre; corteRes = r; enRes = true; interno(Corte3D.disponer(r.piezas, 10), "piezas", "PIEZAS"); setRes(true); mostrarRes(); msg("¡Cortado! Cada pieza queda con la cara del corte hacia abajo 🧩");
    }
    function exportarZip() {
      var todas = guardadas.slice(); if (enRes && corteRes) todas = todas.concat(corteRes.piezas); else todas.push({ nombre: "pieza", tri: mundo() });
      var k = 0, c = 0, files = todas.map(function (p) { var n = p.nombre === "clavijas" ? "clavijas" + (++c > 1 ? "-" + c : "") : "pieza-" + (++k); return { name: n + ".stl", data: Corte3D.stlBytes(p.tri) }; });
      var a = document.createElement("a"); a.href = URL.createObjectURL(Corte3D.zip(files)); a.download = (nombreOrig || nombre).replace(/\.[^.]+$/, "") + "-piezas.zip"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
      msg("¡Listo! " + files.length + " archivo(s) STL en un ZIP 📦");
    }
    $("lbCorteBtn").onclick = function () { corteOn = !corteOn; $("lbCorteBody").hidden = !corteOn; if (corteOn) { menuCorte(); slPos(); } pedir(); };
    $("lbCortar").onclick = cortarAhora; menuCorte();
    window.addEventListener("hashchange", function () { if (location.hash === "#cortar") { corteOn = true; $("lbCorteBody").hidden = false; if (pos) slPos(); pedir(); } });
    if (location.hash === "#cortar") { corteOn = true; $("lbCorteBody").hidden = false; slPos(); }

    armarCama(); menuCama(); menuOri(); menuUnidades(); pedir();
    window.Lab3D = { abrirArchivo: abrir, corte: function () { return { enRes: enRes, guardadas: guardadas.length, piezas: corteRes ? corteRes.piezas.map(function (p) { return [p.nombre, p.tri.length / 9]; }) : null }; }, estado: function () { return { dims: pos ? dims() : null, vol: vol * esc * esc * esc / 1000, sup: supPct, tris: tris, esc: esc }; }, girar: girar, mejor: mejorOrientacion };
  }
  window.Lab3DIniciar = iniciar;
})();
