/* Ka · escena panorámica con parallax.
   KaEscena.montar({ raiz, capas:[{src,k,w}], cielo, ratio:[ancho,alto], puntos:[{x,y,...}], alPunto(p,el), inicio:{x,y} })
   k = cuánto se separa la capa del plano medio al mover la cámara: + más cerca (se mueve más), – más lejos. */
(function () {
  function crear(t, c, p) { var e = document.createElement(t); if (c) e.className = c; if (p) p.appendChild(e); return e; }
  window.KaEscena = {
    montar: function (o) {
      var raiz = o.raiz, ratio = o.ratio[0] / o.ratio[1];
      raiz.classList.add("ke-raiz");
      if (o.cielo) { var ci = crear("img", "ke-cielo", raiz); ci.src = o.cielo; ci.alt = ""; ci.draggable = false; }
      var mundo = crear("div", "ke-mundo", raiz), capas = [];
      o.capas.forEach(function (c, i) {
        var d = crear("div", "ke-capa", mundo); d.style.zIndex = c.z || (i + 1);
        var im = crear("img", "", d); im.src = c.src; im.alt = ""; im.draggable = false; im.decoding = "async";
        capas.push({ el: d, k: c.k || 0, h: c.h || 1 });
      });
      var puntos = crear("div", "ke-capa ke-puntos", mundo); puntos.style.zIndex = 20; capas.push({ el: puntos, k: 0, h: 1 });
      var botones = [];
      (o.puntos || []).forEach(function (p) {
        var b = crear(p.estado === "activo" ? "button" : "button", "ke-punto " + p.estado, puntos); b.type = "button";
        b.style.left = p.x + "%"; b.style.top = p.y + "%"; b.style.setProperty("--ac", p.acento || "#7be6d6");
        b.innerHTML = '<i class="ke-luz"></i><span class="ke-nom">' + p.nombre + '<small>' + (p.tipo || "") + '</small></span>';
        b.setAttribute("aria-label", p.nombre + (p.tipo ? ", " + p.tipo : ""));
        b.addEventListener("click", function () { if (movio) return; o.alPunto && o.alPunto(p, b); });
        botones.push(b);
      });

      var vw, vh, W, H, rx, ry, c0x, c0y, ox = 0, oy = 0, cx = 0, cy = 0, vx = 0, vy = 0, hx = 0, hy = 0, mx = 0, my = 0, tt = 0;
      var arrastrando = false, movio = false, ult = null, reducido = window.matchMedia && matchMedia("(prefers-reduced-motion:reduce)").matches;
      function medir() {
        vw = raiz.clientWidth; vh = raiz.clientHeight;
        var porAlto = vh, porAncho = vw * (o.ancho || 1.6) / ratio;
        H = Math.max(porAlto, porAncho); W = H * ratio;
        rx = Math.max(0, W - vw); ry = Math.max(0, H - vh); c0x = rx / 2; c0y = ry / 2;
        ox = 0; oy = ry ? 0 : (vh - H) / 2;
        mundo.style.width = W + "px"; mundo.style.height = H + "px";
        capas.forEach(function (c) { c.el.style.width = W + "px"; c.el.style.height = H + "px"; });
        cx = Math.min(rx, Math.max(0, cx)); cy = Math.min(ry, Math.max(0, cy));
      }
      function pintar() {
        capas.forEach(function (c) {
          var f = c.k;   // más cerca = más reacción al arrastre, al mouse y a la respiración
          var x = -cx - f * (cx - c0x) - hx * f * 150 + Math.sin(tt * .0006) * f * 60;
          var y = oy - cy - f * (cy - c0y) - hy * f * 90 + Math.cos(tt * .0008) * f * 40;
          c.el.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";
        });
      }
      function limitar() { cx = Math.min(rx, Math.max(0, cx)); cy = Math.min(ry, Math.max(0, cy)); }
      function paso(t) {
        tt = t;
        if (!arrastrando) {
          if (Math.abs(vx) > .05 || Math.abs(vy) > .05) { cx += vx; cy += vy; vx *= .94; vy *= .94; limitar(); }
          if (objetivo) { cx += (objetivo.x - cx) * .08; cy += (objetivo.y - cy) * .08; if (Math.abs(objetivo.x - cx) < .5 && Math.abs(objetivo.y - cy) < .5) objetivo = null; }
        }
        hx += (mx - hx) * .06; hy += (my - hy) * .06;
        pintar(); requestAnimationFrame(paso);
      }
      var objetivo = null;
      function irA(pxPct, pyPct) {
        objetivo = { x: Math.min(rx, Math.max(0, W * pxPct / 100 - vw / 2)), y: Math.min(ry, Math.max(0, H * pyPct / 100 - vh / 2)) };
        if (reducido) { cx = objetivo.x; cy = objetivo.y; objetivo = null; }
      }
      raiz.addEventListener("pointerdown", function (e) {
        if (e.target.closest && e.target.closest(".ke-punto") && e.pointerType !== "mouse") { ult = { x: e.clientX, y: e.clientY, id: e.pointerId, t: e.timeStamp }; arrastrando = false; movio = false; return; }
        arrastrando = true; movio = false; vx = vy = 0; objetivo = null; ult = { x: e.clientX, y: e.clientY, id: e.pointerId, t: e.timeStamp, ix: e.clientX, iy: e.clientY };
      });
      raiz.addEventListener("pointermove", function (e) {
        if (e.pointerType === "mouse") { mx = (e.clientX / vw - .5) * 2; my = (e.clientY / vh - .5) * 2; }
        if (!ult || ult.id !== e.pointerId) return;
        var dx = e.clientX - ult.x, dy = e.clientY - ult.y;
        if (!arrastrando) { if (Math.abs(dx) + Math.abs(dy) > 8) { arrastrando = true; } else return; }
        if (Math.abs(e.clientX - (ult.ix == null ? ult.x : ult.ix)) + Math.abs(e.clientY - (ult.iy == null ? ult.y : ult.iy)) > 6 || ult.ix == null) movio = true;
        cx -= dx; cy -= dy; limitar(); vx = -dx * .9; vy = -dy * .9; ult.x = e.clientX; ult.y = e.clientY;
        if (!raiz.hasPointerCapture(e.pointerId)) try { raiz.setPointerCapture(e.pointerId); } catch (er) {}
        o.alMover && o.alMover();
      });
      function soltar() { arrastrando = false; ult = null; setTimeout(function () { movio = false; }, 60); }
      raiz.addEventListener("pointerup", soltar); raiz.addEventListener("pointercancel", soltar);
      raiz.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") { mx = 0; my = 0; } });
      window.addEventListener("keydown", function (e) {
        var d = { ArrowLeft: -90, ArrowRight: 90 }[e.key]; if (d) { objetivo = null; cx += d; limitar(); }
      });
      raiz.addEventListener("wheel", function (e) { if (rx) { objetivo = null; cx += (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY); cy += 0; limitar(); e.preventDefault(); } }, { passive: false });
      window.addEventListener("resize", function () { var fx = cx / (rx || 1), fy = cy / (ry || 1); medir(); cx = fx * rx; cy = fy * ry; });
      medir();
      var ini = o.inicio || { x: 50, y: 50 }; cx = Math.min(rx, Math.max(0, W * ini.x / 100 - vw / 2)); cy = Math.min(ry, Math.max(0, H * ini.y / 100 - vh / 2));
      requestAnimationFrame(paso);
      return { irA: irA, puntos: botones };
    }
  };
})();
