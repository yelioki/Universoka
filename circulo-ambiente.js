/* circulo-ambiente.js · Ambiente sonoro etéreo para el Círculo Ka.
   Variante de ka-ambiente.js: más grave, sin aves, con tonos sostenidos.
   Sin archivos de audio — todo sintetizado con Web Audio API. */
(function () {
  if (window.parent && window.parent !== window) return; // No-op en iframe
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
      var f = Math.floor(ctx.sampleRate * .05);
      for (var j = 0; j < f; j++) { var k = j / f; d[n - f + j] = d[n - f + j] * (1 - k) + d[j] * k; }
    }
    return b;
  }

  function fuente(ctx, buf) {
    var s = ctx.createBufferSource(); s.buffer = buf; s.loop = true;
    s.loopStart = 0; s.loopEnd = buf.duration - .05;
    s.start(0, Math.random() * 2);
    return s;
  }

  function lfo(ctx, hz, prof, destino) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = hz; g.gain.value = prof;
    o.connect(g); g.connect(destino); o.start();
    return o;
  }

  function base(ctx, out) {
    var rosa = ruido(ctx, "rosa", 6), marron = ruido(ctx, "marron", 8);
    var v = fuente(ctx, marron), lv = ctx.createBiquadFilter(), gv = ctx.createGain();
    lv.type = "lowpass"; lv.frequency.value = 300; gv.gain.value = .08;
    v.connect(lv); lv.connect(gv); gv.connect(out);
    lfo(ctx, .04, .04, gv.gain); lfo(ctx, .03, 80, lv.frequency);
  }

  function tonoSostenido(ctx, out, freq, vol) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.value = freq;
    g.gain.value = 0;
    o.connect(g); g.connect(out);
    o.start();
    g.gain.setTargetAtTime(vol, ctx.currentTime, 3);
    lfo(ctx, .15, vol * .3, g.gain);
  }

  var ctx = null, master = null, mudo = false, vol = 1;
  function nivel() { return mudo ? 0 : .6 * vol; }
  window.CirculoAmbiente = {
    iniciar: function () {
      if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
      ctx = new AC(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
      base(ctx, master);
      tonoSostenido(ctx, master, 220, .015);
      tonoSostenido(ctx, master, 330, .01);
      tonoSostenido(ctx, master, 440, .008);
      master.gain.setTargetAtTime(nivel(), ctx.currentTime, 2);
      document.addEventListener("visibilitychange", function () {
        if (!ctx) return; if (document.hidden) ctx.suspend(); else ctx.resume();
      });
    },
    mudo: function (m) { mudo = !!m; if (master) master.gain.setTargetAtTime(nivel(), ctx.currentTime, .15); },
    volumen: function (v) { vol = Math.max(0, Math.min(1, v)); if (master) master.gain.setTargetAtTime(nivel(), ctx.currentTime, .15); }
  };
})();
