/* circulo-auth.js · Manejo de autenticación del Círculo Ka con magic link.
   Funciones públicas:
   - CirculoAuth.sesionActual() → devuelve la sesión o null
   - CirculoAuth.enviarMagicLink(email) → envía el enlace mágico
   - CirculoAuth.cerrarSesion() → cierra la sesión
   - CirculoAuth.requiereAuth(callback) → redirige a auth si no hay sesión */
(function () {
  function cliente() {
    return window.supabaseClient;
  }

  function configurado() {
    return window.supabaseConfigurado === true && cliente() !== null;
  }

  async function sesionActual() {
    if (!configurado()) return null;
    try {
      var r = await cliente().auth.getSession();
      return r.data && r.data.session ? r.data.session : null;
    } catch (e) {
      return null;
    }
  }

  async function enviarMagicLink(email) {
    if (!configurado()) return { error: "Supabase no está configurado" };
    var redirectTo = window.location.origin + window.location.pathname.replace(/[^/]*$/, "") + "circulo-ka.html";
    try {
      var r = await cliente().auth.signInWithOtp({
        email: email,
        options: { emailRedirectTo: redirectTo }
      });
      return r;
    } catch (e) {
      return { error: e.message || "Error al enviar el enlace" };
    }
  }

  async function cerrarSesion() {
    if (!configurado()) return;
    try { await cliente().auth.signOut(); } catch (e) {}
  }

  async function requiereAuth(callbackSi, callbackNo) {
    var s = await sesionActual();
    if (s) { if (callbackSi) callbackSi(s); }
    else { if (callbackNo) callbackNo(); }
  }

  window.CirculoAuth = {
    sesionActual: sesionActual,
    enviarMagicLink: enviarMagicLink,
    cerrarSesion: cerrarSesion,
    requiereAuth: requiereAuth,
    configurado: configurado
  };
})();
