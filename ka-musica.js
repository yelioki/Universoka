/* ka-musica.js · Continuidad de la melodía entre páginas.
   Busca un <audio> con id="sonidoAmbiente" o id="ambiente" y mantiene
   la posición de reproducción en sessionStorage, de modo que la música
   no se reinicie al cambiar de página. No añade UI, no modifica el
   comportamiento del click. Solo continúa donde se quedó.

   Compatible con las páginas de la cinemática (index, transicion,
   travesia, llamado, avatar) y con cualquier página que tenga un
   <audio> con loop. */
(function () {
  var amb = document.getElementById("sonidoAmbiente") || document.getElementById("ambiente");
  if (!amb) return;

  /* Restaurar posición guardada por la página anterior */
  var t0 = 0;
  try { t0 = parseFloat(sessionStorage.getItem("ka_t")) || 0; } catch (e) {}

  function aplicarT0() {
    if (t0 > 0 && t0 < (amb.duration || 0) - 2) {
      try { amb.currentTime = t0; } catch (e) {}
    }
  }

  if (amb.readyState >= 1) aplicarT0();
  amb.addEventListener("loadedmetadata", aplicarT0);

  /* Fade in suave al reproducir: entra de 0 al volumen de la página en ~1.5 s */
  amb.addEventListener("play", function () {
    var meta = amb.volume;
    if (meta <= 0) meta = 0.45;
    var v = 0, paso = meta / 30;
    amb.volume = 0;
    var f = setInterval(function () {
      v += paso;
      if (v >= meta) { amb.volume = meta; clearInterval(f); }
      else amb.volume = v;
    }, 50);
  });

  /* Guardar la posición cada 3 s y al salir de la página */
  function guardarT() {
    try { sessionStorage.setItem("ka_t", String(amb.currentTime || 0)); } catch (e) {}
  }
  window.addEventListener("pagehide", guardarT);
  setInterval(guardarT, 3000);
})();
