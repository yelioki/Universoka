/* Packs Ka · "Mis packs" de Universo Ka (Yelioki)
   La persona sube el ZIP (o las imágenes) que compró; se guardan SOLO en su dispositivo (IndexedDB).
   No necesita servidor y los archivos completos nunca viven en el repositorio público. */
(function () {
  "use strict";
  var DB = "ka-packs", ST = "packs", urls = {}, listaCache = [];

  function abrir() {
    return new Promise(function (res, rej) {
      if (!window.indexedDB) { rej(new Error("sin-idb")); return; }
      var r = indexedDB.open(DB, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(ST, { keyPath: "id" }); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
  }
  function pedir(modo, fn) {
    return abrir().then(function (db) {
      return new Promise(function (res, rej) {
        var t = db.transaction(ST, modo), s = t.objectStore(ST), out = fn(s);
        t.oncomplete = function () { db.close(); res(out && out.result !== undefined ? out.result : undefined); };
        t.onerror = t.onabort = function () { db.close(); rej(t.error); };
      });
    });
  }
  function registrarUrls(packs) {
    Object.keys(urls).forEach(function (k) { try { URL.revokeObjectURL(urls[k]); } catch (e) { } }); urls = {};
    packs.forEach(function (p) { p.items.forEach(function (it) { urls["pack:" + p.id + "/" + it.id] = URL.createObjectURL(it.blob); }); });
  }
  function listar() {
    return pedir("readonly", function (s) { return s.getAll(); }).then(function (l) {
      listaCache = (l || []).sort(function (a, b) { return a.fecha - b.fecha; }); registrarUrls(listaCache); return listaCache;
    }).catch(function () { listaCache = []; return []; });
  }
  function url(src) { return urls[src] || null; }
  function agregar(nombre, items) {
    var id = "k" + Date.now().toString(36), p = { id: id, nombre: nombre, fecha: Date.now(), items: items.map(function (it, i) { return { id: "i" + i, nombre: it.nombre, blob: it.blob }; }) };
    return pedir("readwrite", function (s) { return s.put(p); }).then(listar).then(function () { return p; });
  }
  function borrar(id) { return pedir("readwrite", function (s) { return s.delete(id); }).then(listar); }

  /* ---- lector de ZIP sin librerías (almacenado y deflate) ---- */
  function mime(n) { return /\.png$/i.test(n) ? "image/png" : /\.webp$/i.test(n) ? "image/webp" : "image/jpeg"; }
  function bonito(n) {
    var b = n.split("/").pop().replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
    return b ? b.charAt(0).toUpperCase() + b.slice(1) : "Imagen";
  }
  function inflar(data) {
    var ds = new DecompressionStream("deflate-raw");
    return new Response(new Blob([data]).stream().pipeThrough(ds)).arrayBuffer().then(function (ab) { return new Uint8Array(ab); });
  }
  function leerZip(file) {
    return file.arrayBuffer().then(function (buf) {
      var dv = new DataView(buf), u8 = new Uint8Array(buf), i = buf.byteLength - 22;
      for (; i >= 0; i--) if (dv.getUint32(i, true) === 0x06054b50) break;
      if (i < 0) throw new Error("zip-invalido");
      var n = dv.getUint16(i + 10, true), off = dv.getUint32(i + 16, true), ents = [];
      for (var k = 0; k < n; k++) {
        if (dv.getUint32(off, true) !== 0x02014b50) break;
        var met = dv.getUint16(off + 10, true), csz = dv.getUint32(off + 20, true), nl = dv.getUint16(off + 28, true), el = dv.getUint16(off + 30, true), cl = dv.getUint16(off + 32, true), lho = dv.getUint32(off + 42, true);
        var name = new TextDecoder().decode(u8.subarray(off + 46, off + 46 + nl)); off += 46 + nl + el + cl;
        if (/\/$/.test(name) || /__MACOSX|\.DS_Store|(^|\/)\._/.test(name) || !/\.(png|webp|jpe?g)$/i.test(name)) continue;
        ents.push({ name: name, met: met, csz: csz, lho: lho });
      }
      var out = [], seq = Promise.resolve();
      ents.forEach(function (e) {
        seq = seq.then(function () {
          var lnl = dv.getUint16(e.lho + 26, true), lel = dv.getUint16(e.lho + 28, true), ds = e.lho + 30 + lnl + lel, data = u8.subarray(ds, ds + e.csz);
          if (e.met === 0) return data; if (e.met === 8) return inflar(data); return null;
        }).then(function (bytes) { if (bytes) out.push({ nombre: bonito(e.name), blob: new Blob([bytes], { type: mime(e.name) }) }); }).catch(function () { });
      });
      return seq.then(function () { return out; });
    });
  }
  /* Recibe una lista de archivos (ZIP o imágenes) y guarda un pack nuevo */
  function importar(files, nombreSugerido) {
    var arr = Array.prototype.slice.call(files), items = [], seq = Promise.resolve(), nombre = nombreSugerido || "";
    arr.forEach(function (f) {
      seq = seq.then(function () {
        if (/\.zip$/i.test(f.name) || f.type === "application/zip" || f.type === "application/x-zip-compressed") {
          if (!nombre) nombre = bonito(f.name);
          return leerZip(f).then(function (l) { items = items.concat(l); });
        }
        if (/^image\//.test(f.type)) items.push({ nombre: bonito(f.name), blob: f });
      });
    });
    return seq.then(function () {
      if (!items.length) throw new Error("sin-imagenes");
      return agregar(nombre || "Mis imágenes", items);
    });
  }

  window.PacksKa = { listar: listar, url: url, importar: importar, borrar: borrar, packs: function () { return listaCache; } };
})();
