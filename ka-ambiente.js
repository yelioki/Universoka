/* Ka · ambiente de selva generado en el navegador (agua, aire y aves). Sin archivos de audio. */
(function () {
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;

  function ruido(ctx, tipo, seg) {
    var n = ctx.sampleRate * seg, b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = b.getChannelData(c), b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
      for (var i = 0; i < n; i++) {
        var w = Math.random() * 2 - 1;
        if (tipo === "rosa") {
          b0 = .99886 * b0 + w * .0555179; b1 = .99332 * b1 + w * .0750759; b2 = .969 * b2 + w * .153852;
          b3 = .8665 * b3 + w * .3104856; b4 = .55 * b4 + w * .5329522; b5 = -.7616 * b5 - w * .016898;
          d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362) * .11; b6 = w * .115926;
        } else { last = (last + .02 * w) / 1.02; d[i] = last * 3.5; }
      }
      /* costura suave para que el bucle no haga "clic" */
      var f = Math.floor(ctx.sampleRate * .05);
      for (var j = 0; j < f; j++) { var k = j / f; d[n - f + j] = d[n - f + j] * (1 - k) + d[j] * k; }
    }
    return b;
  }
  function fuente(ctx, buf) { var s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.loopStart = 0; s.loopEnd = buf.duration - .05; s.start(0, Math.random() * 2); return s; }
  function lfo(ctx, hz, prof, destino) { var o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = hz; g.gain.value = prof; o.connect(g); g.connect(destino); o.start(); return o; }

  /* capas continuas */
  function base(ctx, out) {
    var rosa = ruido(ctx, "rosa", 6), marron = ruido(ctx, "marron", 8);
    /* agua: corriente + brillo de salpicaduras */
    var a1 = fuente(ctx, rosa), hp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter(), ga = ctx.createGain();
    hp.type = "highpass"; hp.frequency.value = 250; lp.type = "lowpass"; lp.frequency.value = 1800; ga.gain.value = .11;
    a1.connect(hp); hp.connect(lp); lp.connect(ga); ga.connect(out); lfo(ctx, .13, .035, ga.gain);
    var a2 = fuente(ctx, rosa), bp = ctx.createBiquadFilter(), gb = ctx.createGain();
    bp.type = "bandpass"; bp.frequency.value = 3200; bp.Q.value = .9; gb.gain.value = .035;
    a2.connect(bp); bp.connect(gb); gb.connect(out); lfo(ctx, .29, .02, gb.gain); lfo(ctx, .11, 600, bp.frequency);
    /* aire de selva: soplo grave que respira */
    var v = fuente(ctx, marron), lv = ctx.createBiquadFilter(), gv = ctx.createGain();
    lv.type = "lowpass"; lv.frequency.value = 500; gv.gain.value = .12;
    v.connect(lv); lv.connect(gv); gv.connect(out); lfo(ctx, .06, .06, gv.gain); lfo(ctx, .05, 180, lv.frequency);
  }

  /* aves: programadas en el tiempo del contexto [t0, t1) */
  function voz(ctx, out, t, f0, f1, dur, vol, trem, pan) {
    var o = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    o.type = "sine"; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(.02, dur / 3)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g);
    if (trem) { var m = ctx.createOscillator(), mg = ctx.createGain(); m.frequency.value = trem; mg.gain.value = vol * .6; m.connect(mg); mg.connect(g.gain); m.start(t); m.stop(t + dur); }
    if (p) { p.pan.value = pan; g.connect(p); p.connect(out); } else g.connect(out);
    o.start(t); o.stop(t + dur + .05);
  }
  function ave(ctx, out, t) {
    var r = Math.random(), pan = Math.random() * 1.6 - .8, v = .02 + Math.random() * .035, i;
    if (r < .35) { var f = 2200 + Math.random() * 1400, n = 2 + Math.floor(Math.random() * 3); for (i = 0; i < n; i++) voz(ctx, out, t + i * .16, f, f * 1.45, .11, v, 0, pan); }
    else if (r < .6) { var f2 = 3000 + Math.random() * 1000; voz(ctx, out, t, f2, f2 * .9, .55, v * .8, 28, pan); }
    else if (r < .82) { var f3 = 1500 + Math.random() * 500; voz(ctx, out, t, f3 * 1.3, f3, .35, v, 6, pan); voz(ctx, out, t + .42, f3 * 1.15, f3 * .75, .5, v, 6, pan); }
    else { /* ave de agua: llamado grave, "uu-uu" */ var f4 = 520 + Math.random() * 120; for (i = 0; i < 3; i++) voz(ctx, out, t + i * .32, f4 * .9, f4, .24, v * 1.4, 0, pan); }
  }
  function programar(ctx, out, t0, t1, estado) {
    if (estado.sig == null) estado.sig = t0 + 1 + Math.random() * 2;
    while (estado.sig < t1) { ave(ctx, out, estado.sig); estado.sig += 2.2 + Math.random() * 5.5; }
  }

  var ctx = null, master = null, mudo = false, vol = 1, timer = 0, est = {};
  function nivel() { return mudo ? 0 : .8 * vol; }
  window.KaAmbiente = {
    iniciar: function () {
      if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
      ctx = new AC(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
      base(ctx, master);
      master.gain.setTargetAtTime(nivel(), ctx.currentTime, 1.5);
      timer = setInterval(function () { if (ctx.state === "running") programar(ctx, master, ctx.currentTime, ctx.currentTime + 4, est); }, 1000);
      document.addEventListener("visibilitychange", function () { if (!ctx) return; if (document.hidden) ctx.suspend(); else ctx.resume(); });
    },
    mudo: function (m) { mudo = !!m; if (master) master.gain.setTargetAtTime(nivel(), ctx.currentTime, .15); },
    volumen: function (v) { vol = Math.max(0, Math.min(1, v)); if (master) master.gain.setTargetAtTime(nivel(), ctx.currentTime, .15); },
    _prueba: { base: base, programar: programar }
  };
})();
