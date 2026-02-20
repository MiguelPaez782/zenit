// ============================================================
// router.js
// Enrutador simple del lado del cliente para la SPA
// ============================================================

const router = (() => {
  // Referencia al usuario y datos de perfil actuales (se setean desde app.js)
  let _currentUser     = null;
  let _currentUserData = null;

  // Permitir que app.js actualice el estado del usuario disponible en el router
  function setUser(user, userData) {
    _currentUser     = user;
    _currentUserData = userData;
  }

  // Navegar a una ruta por nombre
  function navigate(route, params = {}) {
    switch (route) {
      case 'login':
        renderLogin();
        break;
      case 'register':
        renderRegister();
        break;
      case 'recover':
        renderRecover();
        break;
      case 'reset-password':
        renderResetPassword(params.oobCode);
        break;
      case 'app':
        if (_currentUser) {
          renderApp(_currentUser, _currentUserData);
        } else {
          renderLogin();
        }
        break;
      case 'settings':
        if (_currentUser) {
          renderSettings(_currentUser, _currentUserData);
        } else {
          renderLogin();
        }
        break;
      case 'help':
        renderHelp();
        break;
      default:
        renderLogin();
    }
  }

  // Verificar si la URL tiene parametros de accion de Firebase (reset de contrasena, etc.)
  function checkUrlParams() {
    const params  = new URLSearchParams(window.location.search);
    const mode    = params.get('mode');
    const oobCode = params.get('oobCode');

    if (mode === 'resetPassword' && oobCode) {
      return { route: 'reset-password', params: { oobCode } };
    }

    return null;
  }

  return { navigate, setUser, checkUrlParams };
})();