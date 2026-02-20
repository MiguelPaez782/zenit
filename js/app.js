// ============================================================
// app.js
// Punto de entrada principal de Zenit
// Inicializa la app, observa el estado de autenticacion
// y dirige al usuario a la pantalla correcta
// ============================================================

(function initApp() {

  // Verificar si la URL corresponde a una accion de Firebase (ej: reset de contrasena)
  const urlAction = router.checkUrlParams();
  if (urlAction) {
    router.navigate(urlAction.route, urlAction.params);
    return;
  }

  // Mostrar pantalla de carga inicial mientras Firebase verifica la sesion
  showLoading('Cargando Zenit...');

  // Observador de estado de autenticacion de Firebase
  // Se dispara automaticamente al cargar y al cambiar el estado del usuario
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      // Usuario autenticado: cargar sus datos desde Firestore
      try {
        const doc = await db.collection('users').doc(user.uid).get();
        const userData = doc.exists ? doc.data() : null;

        // Compartir el usuario con el router para navegacion interna
        router.setUser(user, userData);

        hideLoading();
        renderApp(user, userData);
      } catch (err) {
        // Si falla la carga de datos, mostrar la app con la info basica de Auth
        router.setUser(user, null);
        hideLoading();
        renderApp(user, null);
      }
    } else {
      // No hay sesion activa: mostrar el login
      router.setUser(null, null);
      hideLoading();
      renderLogin();
    }
  });

})();