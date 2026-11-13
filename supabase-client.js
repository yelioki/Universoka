/* supabase-client.js · Inicializa el cliente Supabase para el Círculo Ka.
   ESTE ARCHIVO SE SUBE A GITHUB. Solo contiene la anon key (pública por diseño).
   La service_role key NUNCA va aquí: es solo para uso local o dashboard.

   ANTES DE SUBIR A GITHUB: reemplaza SUPABASE_URL y SUPABASE_ANON_KEY
   con los valores reales de tu proyecto Supabase (ver README). */
(function () {
  // === CONFIGURACIÓN: reemplazar con los valores de tu proyecto ===
  var SUPABASE_URL = "https://yxyjlryxtcwdgqodlskg.supabase.co";
  var SUPABASE_ANON_KEY = "sb_publishable_QTmXpTHEoVFqBpvH4PUyDg_NQveWImR";
  // === FIN CONFIGURACIÓN ===

  // Detectar si las claves siguen siendo placeholder
  if (SUPABASE_URL.indexOf("TU-PROYECTO") >= 0 || SUPABASE_ANON_KEY.indexOf("TU-ANON-KEY") >= 0) {
    console.warn("Círculo Ka: supabase-client.js tiene claves placeholder. Edita el archivo con las claves reales de tu proyecto Supabase.");
    window.supabaseClient = null;
    window.supabaseConfigurado = false;
    return;
  }

  // Cargar el SDK dinámicamente si no está presente
  function inicializar() {
    if (typeof supabase === "undefined" || !supabase.createClient) {
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      s.onload = function () {
        window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        });
        window.supabaseConfigurado = true;
        window.dispatchEvent(new Event("supabase-listo"));
      };
      s.onerror = function () {
        console.error("Círculo Ka: no se pudo cargar el SDK de Supabase.");
        window.supabaseClient = null;
        window.supabaseConfigurado = false;
      };
      document.head.appendChild(s);
    } else {
      window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      window.supabaseConfigurado = true;
      window.dispatchEvent(new Event("supabase-listo"));
    }
  }

  inicializar();
})();
