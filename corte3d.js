/* Corte 3D · Universo Ka (Yelioki)
   Corta un modelo con un plano, cierra la cara del corte y abre huecos para clavijas de encaje.
   Funciones puras (sin DOM): se pueden probar en Node. Coordenadas: Z hacia arriba, mm. */
(function (root) {
  "use strict";
  var EPS = 1e-5;

  function rotDe(a, b) { // rotación (3x3 por filas) que lleva el vector a sobre el vector b
    var v = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], c = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    if (c > 0.99999) return [1, 0, 0, 0, 1, 0, 0, 0, 1];
    if (c < -0.99999) { var p = Math.abs(a[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], x = [a[1] * p[2] - a[2] * p[1], a[2] * p[0] - a[0] * p[2], a[0] * p[1] - a[1] * p[0]], l = Math.hypot(x[0], x[1], x[2]); x = [x[0] / l, x[1] / l, x[2] / l]; return [2 * x[0] * x[0] - 1, 2 * x[0] * x[1], 2 * x[0] * x[2], 2 * x[0] * x[1], 2 * x[1] * x[1] - 1, 2 * x[1] * x[2], 2 * x[0] * x[2], 2 * x[1] * x[2], 2 * x[2] * x[2] - 1]; }
    var k = 1 / (1 + c), vx = [0, -v[2], v[1], v[2], 0, -v[0], -v[1], v[0], 0], o = [1, 0, 0, 0, 1, 0, 0, 0, 1], i, r, cc, s;
    var v2 = []; for (r = 0; r < 3; r++) for (cc = 0; cc < 3; cc++) { s = 0; for (i = 0; i < 3; i++) s += vx[r * 3 + i] * vx[i * 3 + cc]; v2.push(s); }
    for (i = 0; i < 9; i++) o[i] += vx[i] + v2[i] * k; return o;
  }

  /* ---- recorte de la malla por un plano ---- */
  function recortar(tris, ax, t) {
    var A = [], B = [], segs = [], n = tris.length / 9, i, j, P, d, pos, neg, out, k;
    for (i = 0; i < n; i++) {
      P = []; d = [];
      for (j = 0; j < 3; j++) { P.push([tris[i * 9 + j * 3], tris[i * 9 + j * 3 + 1], tris[i * 9 + j * 3 + 2]]); var dd = P[j][ax] - t; d.push(Math.abs(dd) < EPS ? EPS : dd); }
      if (d[0] > 0 && d[1] > 0 && d[2] > 0) { pushT(A, P[0], P[1], P[2]); continue; }
      if (d[0] < 0 && d[1] < 0 && d[2] < 0) { pushT(B, P[0], P[1], P[2]); continue; }
      pos = []; neg = []; var E = null, N = null;
      for (j = 0; j < 3; j++) {
        k = (j + 1) % 3; var a = P[j], b = P[k], da = d[j], db = d[k];
        if (da > 0) pos.push(a); else neg.push(a);
        if ((da > 0) !== (db > 0)) {
          var f = da / (da - db), q = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; q[ax] = t;
          pos.push(q); neg.push(q);
          if (da > 0) E = q; else N = q; // E: sale de arriba; N: entra a arriba
        }
      }
      fan(A, pos); fan(B, neg);
      if (E && N) segs.push([E, N]); // borde del lado positivo recorre E→N
    }
    return { A: A, B: B, segs: segs };
  }
  function pushT(arr, a, b, c) { arr.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); }
  function fan(arr, poly) { for (var i = 1; i + 1 < poly.length; i++) pushT(arr, poly[0], poly[i], poly[i + 1]); }

  /* ---- coordenadas del plano ---- */
  function uvDe(ax, p) { return ax === 2 ? [p[0], p[1]] : ax === 0 ? [p[1], p[2]] : [p[2], p[0]]; }
  function xyzDe(ax, u, v, t) { return ax === 2 ? [u, v, t] : ax === 0 ? [t, u, v] : [v, t, u]; }

  function armarLazos(segs, ax) {
    var map = {}, usados = [], key = function (p) { var q = uvDe(ax, p); return Math.round(q[0] * 2000) + "," + Math.round(q[1] * 2000); }, i;
    // lazos en orientación del lado B: segmentos E→N (positivo recorre E→N; el corte visto desde +eje para B conserva E→N)
    for (i = 0; i < segs.length; i++) { var kk = key(segs[i][0]); (map[kk] = map[kk] || []).push(i); }
    var lazos = [];
    for (i = 0; i < segs.length; i++) {
      if (usados[i]) continue; var lz = [], cur = i, guard = 0;
      while (cur !== undefined && !usados[cur] && guard++ < 1e6) {
        usados[cur] = true; lz.push(uvDe(ax, segs[cur][0])); var sig = map[key(segs[cur][1])], nx; nx = undefined;
        if (sig) for (var s = 0; s < sig.length; s++) if (!usados[sig[s]]) { nx = sig[s]; break; }
        cur = nx;
      }
      if (lz.length >= 3) lazos.push(lz);
    }
    return lazos;
  }
  function area2(p) { var s = 0; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
  function dentro(p, pt) { var c = false; for (var i = 0, j = p.length - 1; i < p.length; j = i++) { var a = p[i], b = p[j]; if ((a[1] > pt[1]) !== (b[1] > pt[1]) && pt[0] < (b[0] - a[0]) * (pt[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }

  /* ---- triangulación con huecos (puente + recorte de orejas) ---- */
  function cruz(a, b, c) { return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]); }
  function enTri(a, b, c, p) { return cruz(a, b, p) > 1e-9 && cruz(b, c, p) > 1e-9 && cruz(c, a, p) > 1e-9; }
  function puente(outer, hole) {
    var m = 0, i; for (i = 1; i < hole.length; i++) if (hole[i][0] > hole[m][0]) m = i; var M = hole[m], best = 1e30, pi = -1;
    for (i = 0; i < outer.length; i++) {
      var a = outer[i], b = outer[(i + 1) % outer.length];
      if ((a[1] <= M[1] && b[1] >= M[1] || b[1] <= M[1] && a[1] >= M[1]) && a[1] !== b[1]) {
        var x = a[0] + (M[1] - a[1]) * (b[0] - a[0]) / (b[1] - a[1]);
        if (x >= M[0] - 1e-9 && x < best) { best = x; pi = a[0] > b[0] ? i : (i + 1) % outer.length; }
      }
    }
    if (pi < 0) { // plan B: vértice más cercano
      var bd = 1e30; for (i = 0; i < outer.length; i++) { var dd = (outer[i][0] - M[0]) * (outer[i][0] - M[0]) + (outer[i][1] - M[1]) * (outer[i][1] - M[1]); if (dd < bd) { bd = dd; pi = i; } }
    } else {
      var P = outer[pi], I = [best, M[1]], mejor = -1, ang = 1e30;
      for (i = 0; i < outer.length; i++) {
        var q = outer[i]; if (i === pi || q[0] < M[0]) continue;
        var tri = M[1] < P[1] ? enTri(M, I, P, q) : enTri(I, M, P, q);
        if (tri) { var tn = Math.abs(q[1] - M[1]) / Math.max(1e-12, q[0] - M[0]); if (tn < ang) { ang = tn; mejor = i; } }
      }
      if (mejor >= 0) pi = mejor;
    }
    var out = outer.slice(0, pi + 1), j; for (j = 0; j < hole.length; j++) out.push(hole[(m + j) % hole.length]);
    out.push(hole[m]); out.push(outer[pi]); return out.concat(outer.slice(pi + 1));
  }
  function orejas(poly) { // poly antihorario; devuelve lista de triángulos [a,b,c] con puntos
    var n = poly.length, prev = [], next = [], i, res = [];
    for (i = 0; i < n; i++) { prev.push((i + n - 1) % n); next.push((i + 1) % n); }
    var resto = n, cur = 0, vueltas = 0, maxV = n * 60 + 2000;
    function igual(p, q) { return Math.abs(p[0] - q[0]) < 1e-9 && Math.abs(p[1] - q[1]) < 1e-9; }
    while (resto > 3 && maxV-- > 0) {
      var p = prev[cur], nx = next[cur], A = poly[p], B = poly[cur], C = poly[nx], c = cruz(A, B, C), esOreja = false;
      if (Math.abs(c) < 1e-10) { next[p] = nx; prev[nx] = p; resto--; cur = nx; vueltas = 0; continue; }
      if (c > 0) {
        esOreja = true;
        for (var q = next[nx]; q !== p; q = next[q]) { var Q = poly[q]; if (igual(Q, A) || igual(Q, B) || igual(Q, C)) continue; if (enTri(A, B, C, Q)) { esOreja = false; break; } }
      }
      if (esOreja) { res.push([A, B, C]); next[p] = nx; prev[nx] = p; resto--; cur = nx; vueltas = 0; }
      else {
        cur = nx; vueltas++;
        if (vueltas > resto) { // sin orejas: quita la esquina más plana (casi degenerada) sin crear triángulo
          var mj = cur, mc = 1e30, q2 = cur; for (var z = 0; z < resto; z++) { var cc = Math.abs(cruz(poly[prev[q2]], poly[q2], poly[next[q2]])); if (cc < mc) { mc = cc; mj = q2; } q2 = next[q2]; }
          next[prev[mj]] = next[mj]; prev[next[mj]] = prev[mj]; resto--; cur = next[mj]; vueltas = 0;
        }
      }
    }
    if (resto > 3) { var ids = [], qq = cur; for (var zz = 0; zz < resto; zz++) { ids.push(qq); qq = next[qq]; } for (zz = 1; zz + 1 < ids.length; zz++) { var fa = poly[ids[0]], fb = poly[ids[zz]], fc = poly[ids[zz + 1]], fk = cruz(fa, fb, fc); if (fk > 1e-10) res.push([fa, fb, fc]); } }
    else if (resto === 3) { var a0 = poly[cur], b0 = poly[next[cur]], c0 = poly[next[next[cur]]]; if (Math.abs(cruz(a0, b0, c0)) > 1e-10) res.push(cruz(a0, b0, c0) > 0 ? [a0, b0, c0] : [a0, c0, b0]); }
    return res;
  }
  function triangularTapa(lazos) {
    var outers = [], holes = [], i, j;
    lazos.forEach(function (l) { var a = area2(l); if (Math.abs(a) < 1e-6) return; (a > 0 ? outers : holes).push({ p: l, a: Math.abs(a) }); });
    var grupos = outers.map(function (o) { return { o: o.p, a: o.a, h: [] }; });
    holes.forEach(function (h) {
      var mejor = null; grupos.forEach(function (g) { if (dentro(g.o, h.p[0]) && (!mejor || g.a < mejor.a)) mejor = g; }); if (mejor) mejor.h.push(h.p);
    });
    var tris = [];
    grupos.forEach(function (g) {
      var poly = g.o.slice(), hs = g.h.slice().sort(function (p, q) { return Math.max.apply(null, q.map(function (v) { return v[0]; })) - Math.max.apply(null, p.map(function (v) { return v[0]; })); });
      for (i = 0; i < hs.length; i++) poly = puente(poly, hs[i]);
      orejas(poly).forEach(function (t) { tris.push(t); });
    });
    return tris;
  }

  /* ---- clavijas ---- */
  function distSeg(p, a, b) { var dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l)) : 0; return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); }
  function elegirPuntos(lazos, n, margen) {
    if (!n) return []; var mnx = 1e30, mny = 1e30, mxx = -1e30, mxy = -1e30, i;
    lazos.forEach(function (l) { l.forEach(function (p) { mnx = Math.min(mnx, p[0]); mxx = Math.max(mxx, p[0]); mny = Math.min(mny, p[1]); mxy = Math.max(mxy, p[1]); }); });
    var paso = Math.max(1, Math.max(mxx - mnx, mxy - mny) / 70), cands = [];
    for (var x = mnx; x <= mxx; x += paso) for (var y = mny; y <= mxy; y += paso) {
      var p = [x, y], c = 0; lazos.forEach(function (l) { if (dentro(l, p)) c++; }); if (c % 2 === 0) continue;
      var d = 1e30; lazos.forEach(function (l) { for (var k = 0; k < l.length; k++) { var dd = distSeg(p, l[k], l[(k + 1) % l.length]); if (dd < d) d = dd; } });
      if (d >= margen) cands.push({ p: p, d: d });
    }
    if (!cands.length) return [];
    cands.sort(function (a, b) { return b.d - a.d; }); var el = [cands[0]];
    while (el.length < n) {
      var mejor = null, ms = -1; cands.forEach(function (c) { var m = 1e30; el.forEach(function (e) { m = Math.min(m, Math.hypot(c.p[0] - e.p[0], c.p[1] - e.p[1])); }); if (m > ms) { ms = m; mejor = c; } });
      if (!mejor || ms < margen * 1.6) break; el.push(mejor);
    }
    return el.map(function (e) { return e.p; });
  }
  function circulo(c, r, seg, cw) { var o = []; for (var i = 0; i < seg; i++) { var a = (cw ? -1 : 1) * i / seg * Math.PI * 2; o.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]); } return o; }
  function tri3(arr, a, b, c, nd) { // añade el triángulo con la cara hacia nd
    var ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    var d = (uy * vz - uz * vy) * nd[0] + (uz * vx - ux * vz) * nd[1] + (ux * vy - uy * vx) * nd[2];
    if (d >= 0) pushT(arr, a, b, c); else pushT(arr, a, c, b);
  }
  function cavidad(arr, ax, t, dir, c, r, prof, seg) { // hueco cilíndrico desde el plano hacia dir (+1/-1)
    var i, n = [0, 0, 0], ring = circulo(c, r, seg, false), t2 = t + dir * prof, up = [0, 0, 0]; up[ax] = -dir; // el hueco "mira" hacia el plano
    var cen2 = xyzDe(ax, c[0], c[1], t2);
    for (i = 0; i < seg; i++) {
      var p0 = ring[i], p1 = ring[(i + 1) % seg], a0 = xyzDe(ax, p0[0], p0[1], t), a1 = xyzDe(ax, p1[0], p1[1], t), b0 = xyzDe(ax, p0[0], p0[1], t2), b1 = xyzDe(ax, p1[0], p1[1], t2);
      var hac = [c[0] - (p0[0] + p1[0]) / 2, c[1] - (p0[1] + p1[1]) / 2]; n = xyzDe(ax, hac[0], hac[1], 0); n[ax] = 0;
      tri3(arr, a0, a1, b1, n); tri3(arr, a0, b1, b0, n); tri3(arr, cen2, b1, b0, up);
    }
  }
  function cilindro(r, L, seg) {
    var o = [], i, c = [0, 0, 0], top = [0, 0, L];
    for (i = 0; i < seg; i++) {
      var a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2, p0 = [Math.cos(a0) * r, Math.sin(a0) * r], p1 = [Math.cos(a1) * r, Math.sin(a1) * r], m = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, 0];
      tri3(o, [p0[0], p0[1], 0], [p1[0], p1[1], 0], [p1[0], p1[1], L], m); tri3(o, [p0[0], p0[1], 0], [p1[0], p1[1], L], [p0[0], p0[1], L], m);
      tri3(o, c, [p1[0], p1[1], 0], [p0[0], p0[1], 0], [0, 0, -1]); tri3(o, top, [p0[0], p0[1], L], [p1[0], p1[1], L], [0, 0, 1]);
    }
    return o;
  }

  /* ---- transformaciones de las piezas ---- */
  function aplicar(tris, M) {
    var o = new Float32Array(tris.length);
    for (var i = 0; i < tris.length; i += 3) { var x = tris[i], y = tris[i + 1], z = tris[i + 2]; o[i] = M[0] * x + M[1] * y + M[2] * z; o[i + 1] = M[3] * x + M[4] * y + M[5] * z; o[i + 2] = M[6] * x + M[7] * y + M[8] * z; }
    return o;
  }
  function alBorde(tris) { // centra en XY y apoya en z=0
    var a = [1e30, 1e30, 1e30], b = [-1e30, -1e30, -1e30], i, k; for (i = 0; i < tris.length; i += 3) for (k = 0; k < 3; k++) { if (tris[i + k] < a[k]) a[k] = tris[i + k]; if (tris[i + k] > b[k]) b[k] = tris[i + k]; }
    for (i = 0; i < tris.length; i += 3) { tris[i] -= (a[0] + b[0]) / 2; tris[i + 1] -= (a[1] + b[1]) / 2; tris[i + 2] -= a[2]; }
    return { w: b[0] - a[0], d: b[1] - a[1], h: b[2] - a[2] };
  }

  /* ---- principal ---- */
  function cortar(tris, o) {
    var ax = { x: 0, y: 1, z: 2 }[o.eje], t = o.t, seg = 28;
    var r = recortar(tris, ax, t);
    if (!r.A.length || !r.B.length) throw new Error("fuera");
    var lazos = armarLazos(r.segs, ax), aviso = "";
    if (!lazos.length) throw new Error("abierto");
    var n = o.n || 0, d = o.d || 5, tol = o.holgura == null ? 0.15 : o.holgura, prof = o.prof || 6, rh = d / 2 + tol;
    // grosor disponible de cada lado a lo largo del eje
    var mnA = 1e30, mxB = -1e30, i; for (i = ax; i < r.A.length; i += 3) if (r.A[i] < mnA) mnA = r.A[i]; var maxA = -1e30; for (i = ax; i < r.A.length; i += 3) if (r.A[i] > maxA) maxA = r.A[i];
    var minB = 1e30; for (i = ax; i < r.B.length; i += 3) if (r.B[i] < minB) minB = r.B[i];
    var gro = Math.min(maxA - t, t - minB), prf = Math.min(prof, gro * 0.45);
    var pts = n ? elegirPuntos(lazos, n, rh + 1.5) : [];
    if (n && pts.length < n) aviso = pts.length ? "Solo cupieron " + pts.length + " clavija(s) en la cara del corte." : "La cara del corte es muy pequeña para clavijas.";
    if (n && prf < prof - 0.01 && pts.length) aviso += (aviso ? " " : "") + "Acorté la profundidad a " + (Math.round(prf * 10) / 10) + " mm para no atravesar la pieza.";
    var lazosB = lazos.slice(); pts.forEach(function (c) { lazosB.push(circulo(c, rh, seg, true)); });
    var tapa = triangularTapa(lazosB), A = r.A.slice(), B = r.B.slice();
    tapa.forEach(function (T) { var p = T.map(function (q) { return xyzDe(ax, q[0], q[1], t); }); pushT(B, p[0], p[1], p[2]); pushT(A, p[0], p[2], p[1]); });
    pts.forEach(function (c) { cavidad(B, ax, t, -1, c, rh, prf, seg); cavidad(A, ax, t, 1, c, rh, prf, seg); });
    var nA = [0, 0, 0], nB = [0, 0, 0]; nA[ax] = -1; nB[ax] = 1;
    var piezas = [], pa = aplicar(new Float32Array(A), rotDe(nA, [0, 0, -1])), pb = aplicar(new Float32Array(B), rotDe(nB, [0, 0, -1]));
    var ma = alBorde(pa), mb = alBorde(pb);
    piezas.push({ nombre: "pieza-1", tri: pa, med: ma }, { nombre: "pieza-2", tri: pb, med: mb });
    var cl = null;
    if (pts.length) {
      var L = Math.max(4, 2 * prf - 0.6), cil = cilindro(d / 2, L, seg), all = []; for (i = 0; i < pts.length; i++) { for (var k = 0; k < cil.length; k += 3) all.push(cil[k] + i * (d + 3), cil[k + 1], cil[k + 2]); }
      cl = { nombre: "clavijas", tri: new Float32Array(all), med: { w: pts.length * (d + 3) - 3, d: d, h: L } }; alBorde(cl.tri);
      piezas.push(cl);
    }
    return { piezas: piezas, encajes: pts.length, aviso: aviso, huecoR: rh, prof: prf };
  }

  /* ---- salida ---- */
  function stlBytes(tri) {
    var n = tri.length / 9, buf = new ArrayBuffer(84 + n * 50), dv = new DataView(buf), o = 84, i, j;
    new Uint8Array(buf, 0, 80).set(new TextEncoder().encode("Yelioki Universo Ka - Laboratorio 3D")); dv.setUint32(80, n, true);
    for (i = 0; i < n; i++) {
      var b = i * 9, ux = tri[b + 3] - tri[b], uy = tri[b + 4] - tri[b + 1], uz = tri[b + 5] - tri[b + 2], vx = tri[b + 6] - tri[b], vy = tri[b + 7] - tri[b + 1], vz = tri[b + 8] - tri[b + 2];
      var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz) || 1;
      dv.setFloat32(o, nx / l, true); dv.setFloat32(o + 4, ny / l, true); dv.setFloat32(o + 8, nz / l, true); o += 12;
      for (j = 0; j < 9; j++) { dv.setFloat32(o, tri[b + j], true); o += 4; } o += 2;
    }
    return new Uint8Array(buf);
  }
  var CRC = null;
  function crc32(u8) { if (!CRC) { CRC = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } } var x = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) x = CRC[(x ^ u8[i]) & 255] ^ (x >>> 8); return (x ^ 0xFFFFFFFF) >>> 0; }
  function zip(files) { // [{name, data:Uint8Array}] sin compresión
    var enc = new TextEncoder(), parts = [], cen = [], off = 0;
    files.forEach(function (f) {
      var nm = enc.encode(f.name), crc = crc32(f.data), h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, 0, true); h.setUint16(12, 0x21, true);
      h.setUint32(14, crc, true); h.setUint32(18, f.data.length, true); h.setUint32(22, f.data.length, true); h.setUint16(26, nm.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), nm, f.data);
      var c = new DataView(new ArrayBuffer(46)); c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(12, 0, true); c.setUint16(14, 0x21, true);
      c.setUint32(16, crc, true); c.setUint32(20, f.data.length, true); c.setUint32(24, f.data.length, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
      cen.push(new Uint8Array(c.buffer), nm); off += 30 + nm.length + f.data.length;
    });
    var csz = 0; cen.forEach(function (x) { csz += x.length; });
    var e = new DataView(new ArrayBuffer(22)); e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csz, true); e.setUint32(16, off, true);
    return new Blob(parts.concat(cen, [new Uint8Array(e.buffer)]), { type: "application/zip" });
  }
  function disponer(piezas, sep) { // junta las piezas en una fila para la vista previa
    var tot = 0; piezas.forEach(function (p) { tot += p.med.w + sep; }); tot -= sep; var x = -tot / 2, all = [];
    piezas.forEach(function (p) { var c = x + p.med.w / 2; for (var i = 0; i < p.tri.length; i += 3) all.push(p.tri[i] + c, p.tri[i + 1], p.tri[i + 2]); x += p.med.w + sep; });
    return new Float32Array(all);
  }

  root.Corte3D = { cortar: cortar, stlBytes: stlBytes, zip: zip, disponer: disponer, tapa: triangularTapa, _orejas: orejas, _recortar: recortar };
  if (typeof module !== "undefined") module.exports = root.Corte3D;
})(typeof window !== "undefined" ? window : globalThis);
