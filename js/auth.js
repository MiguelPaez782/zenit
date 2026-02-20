// ============================================================
// auth.js
// Modulo de autenticacion: login, registro, recuperacion de contrasena
// Usa Firebase Authentication
// ============================================================


// ------------------------------------------------------------
// Sanitizar texto para evitar XSS al insertar en el DOM
// ------------------------------------------------------------
function sanitizeText(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}


// ------------------------------------------------------------
// Validar formato de correo electronico
// ------------------------------------------------------------
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


// ------------------------------------------------------------
// Validar seguridad de contrasena
// Minimo 8 caracteres, una mayuscula, un numero y un caracter especial
// ------------------------------------------------------------
function isStrongPassword(password) {
  return /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(password);
}


// ------------------------------------------------------------
// Mapear errores de Firebase a mensajes legibles en espanol
// ------------------------------------------------------------
function mapFirebaseError(code) {
  const errors = {
    'auth/user-not-found':        'No existe una cuenta con este correo.',
    'auth/wrong-password':        'Contrasena incorrecta.',
    'auth/email-already-in-use':  'Este correo ya esta registrado.',
    'auth/invalid-email':         'El correo no es valido.',
    'auth/weak-password':         'La contrasena es demasiado debil.',
    'auth/too-many-requests':     'Demasiados intentos. Intenta mas tarde.',
    'auth/network-request-failed':'Sin conexion. Verifica tu red.',
    'auth/invalid-credential':    'Credenciales incorrectas.',
    'auth/user-disabled':         'Esta cuenta ha sido deshabilitada.',
  };
  return errors[code] || 'Ocurrio un error. Intenta de nuevo.';
}


// ============================================================
// PANTALLA: LOGIN
// ============================================================
function renderLogin() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  const page = document.createElement('div');
  page.className = 'page-container screen-enter';
  page.innerHTML = `
    <div class="auth-card">
      <!-- Logotipo e identidad de la app -->
      <div class="app-icon">
        <span class="material-icons-round" style="font-size:2rem;color:var(--accent)">flag</span>
      </div>
      <h1 class="text-center font-black text-2xl mb-1" style="color:var(--text);letter-spacing:-0.03em">
        Zenit
      </h1>
      <p class="text-center text-sm mb-6" style="color:var(--text-muted);font-weight:500">Alcanza cada meta</p>

      <h2 class="text-base font-bold mb-5" style="color:var(--text-muted);text-transform:uppercase;letter-spacing:0.07em;font-size:0.75rem">
        Iniciar sesion
      </h2>

      <div id="login-fields"></div>

      <div id="login-error" class="hidden text-sm font-semibold text-center py-2 px-3 rounded-lg mb-3"
        style="background:rgba(226,115,115,0.1);color:var(--danger)"></div>

      <button class="btn btn-primary w-full mt-1" id="login-btn" type="button">
        <span class="material-icons-round" style="font-size:1.1rem">login</span>
        <span>Entrar</span>
      </button>

      <div class="text-center mt-5 flex flex-col gap-2">
        <a href="#recover" id="link-recover"
          class="text-xs font-semibold hover:underline"
          style="color:var(--text-muted)">
          Olvide mi contrasena
        </a>
        <a href="#register" id="link-register"
          class="text-sm font-bold hover:underline"
          style="color:var(--accent)">
          Crear cuenta nueva
        </a>
      </div>
    </div>
  `;

  app.appendChild(page);

  // Insertar campos de formulario mediante componentes
  const fieldsContainer = document.getElementById('login-fields');
  fieldsContainer.appendChild(createField({
    id: 'login-email', label: 'Correo electronico',
    type: 'email', placeholder: 'tu@correo.com', required: true
  }));
  fieldsContainer.appendChild(createField({
    id: 'login-password', label: 'Contrasena',
    type: 'password', placeholder: '••••••••', required: true
  }));

  // Navegacion a otras pantallas
  document.getElementById('link-recover').addEventListener('click', (e) => {
    e.preventDefault(); router.navigate('recover');
  });
  document.getElementById('link-register').addEventListener('click', (e) => {
    e.preventDefault(); router.navigate('register');
  });

  // Evento de inicio de sesion
  document.getElementById('login-btn').addEventListener('click', handleLogin);

  // Permitir enviar con Enter
  page.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
}


async function handleLogin() {
  const email    = getFieldValue('login-email');
  const password = getFieldValue('login-password');
  const errorEl  = document.getElementById('login-error');
  errorEl.classList.add('hidden');
  clearFieldErrors('login-email', 'login-password');

  // Validaciones del lado del cliente
  let hasError = false;
  if (!email) { setFieldError('login-email', 'Ingresa tu correo'); hasError = true; }
  else if (!isValidEmail(email)) { setFieldError('login-email', 'Correo no valido'); hasError = true; }
  if (!password) { setFieldError('login-password', 'Ingresa tu contrasena'); hasError = true; }
  if (hasError) return;

  showLoading('Iniciando sesion...');

  try {
    await auth.signInWithEmailAndPassword(email, password);
    // onAuthStateChanged en app.js detectara el inicio de sesion
  } catch (error) {
    hideLoading();
    errorEl.textContent = mapFirebaseError(error.code);
    errorEl.classList.remove('hidden');
  }
}


// ============================================================
// PANTALLA: REGISTRO
// ============================================================
function renderRegister() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  const page = document.createElement('div');
  page.className = 'page-container screen-enter';
  page.style.justifyContent = 'flex-start';
  page.style.paddingTop = '2rem';

  const card = document.createElement('div');
  card.className = 'auth-card';

  // Encabezado con boton de volver
  const header = document.createElement('div');
  header.className = 'flex items-center gap-3 mb-6';
  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn-ghost';
  backBtn.style.minWidth = '0';
  backBtn.style.padding = '0.35rem';
  backBtn.innerHTML = `<span class="material-icons-round">arrow_back</span>`;
  backBtn.addEventListener('click', () => router.navigate('login'));
  const heading = document.createElement('h2');
  heading.className = 'font-black text-xl';
  heading.style.color = 'var(--text)';
  heading.textContent = 'Registrarse';
  header.append(backBtn, heading);
  card.appendChild(header);

  // Campos del formulario
  const fields = document.createElement('div');
  fields.append(
    createField({ id: 'reg-firstname', label: 'Nombre', placeholder: 'Juan', required: true }),
    createField({ id: 'reg-lastname',  label: 'Apellido (opcional)', placeholder: 'Perez' }),
    createField({ id: 'reg-username',  label: 'Nombre de usuario', placeholder: '@juanperez', required: true }),
    createField({ id: 'reg-email',     label: 'Correo electronico', type: 'email', placeholder: 'tu@correo.com', required: true }),
    createField({ id: 'reg-password',  label: 'Contrasena', type: 'password', placeholder: '8+ caracteres, mayus, numero, simbolo', required: true }),
    createField({ id: 'reg-password2', label: 'Repetir contrasena', type: 'password', placeholder: '••••••••', required: true }),
  );
  card.appendChild(fields);

  const errorEl = document.createElement('div');
  errorEl.id = 'reg-error';
  errorEl.className = 'hidden text-sm font-semibold text-center py-2 px-3 rounded-lg mb-3';
  errorEl.style.cssText = 'background:rgba(226,115,115,0.1);color:var(--danger)';
  card.appendChild(errorEl);

  const submitBtn = createButton({ text: 'Crear cuenta', icon: 'person_add', fullWidth: true });
  card.appendChild(submitBtn);

  page.appendChild(card);
  app.appendChild(page);

  submitBtn.addEventListener('click', handleRegister);
  page.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleRegister(); });
}


async function handleRegister() {
  const firstname = getFieldValue('reg-firstname');
  const lastname  = getFieldValue('reg-lastname');
  const username  = getFieldValue('reg-username');
  const email     = getFieldValue('reg-email');
  const password  = getFieldValue('reg-password');
  const password2 = getFieldValue('reg-password2');
  const errorEl   = document.getElementById('reg-error');

  errorEl.classList.add('hidden');
  clearFieldErrors('reg-firstname','reg-username','reg-email','reg-password','reg-password2');

  let hasError = false;

  if (!firstname) { setFieldError('reg-firstname', 'Ingresa tu nombre'); hasError = true; }
  if (!username)  { setFieldError('reg-username', 'Elige un nombre de usuario'); hasError = true; }
  else if (username.length < 3) { setFieldError('reg-username', 'Minimo 3 caracteres'); hasError = true; }

  if (!email) { setFieldError('reg-email', 'Ingresa tu correo'); hasError = true; }
  else if (!isValidEmail(email)) { setFieldError('reg-email', 'Correo no valido'); hasError = true; }

  if (!password) { setFieldError('reg-password', 'Ingresa una contrasena'); hasError = true; }
  else if (!isStrongPassword(password)) {
    setFieldError('reg-password', 'Minimo 8 caracteres, una mayuscula, un numero y un simbolo');
    hasError = true;
  }

  if (!password2) { setFieldError('reg-password2', 'Repite la contrasena'); hasError = true; }
  else if (password !== password2) { setFieldError('reg-password2', 'Las contrasenas no coinciden'); hasError = true; }

  if (hasError) return;

  showLoading('Creando tu cuenta...');

  try {
    // Crear usuario en Firebase Auth
    const credential = await auth.createUserWithEmailAndPassword(email, password);
    const uid = credential.user.uid;

    const displayName = lastname ? `${firstname} ${lastname}` : firstname;

    // Actualizar displayName en el perfil de Auth
    await credential.user.updateProfile({ displayName });

    // Guardar informacion adicional en Firestore
    await db.collection('users').doc(uid).set({
      firstname:   sanitizeText(firstname),
      lastname:    sanitizeText(lastname),
      username:    sanitizeText(username),
      email:       email,
      displayName: sanitizeText(displayName),
      createdAt:   firebase.firestore.FieldValue.serverTimestamp(),
    });

    // onAuthStateChanged redirigira automaticamente
  } catch (error) {
    hideLoading();
    const errorEl = document.getElementById('reg-error');
    errorEl.textContent = mapFirebaseError(error.code);
    errorEl.classList.remove('hidden');
  }
}


// ============================================================
// PANTALLA: SOLICITAR RECUPERACION DE CONTRASENA
// ============================================================
function renderRecover() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  const page = document.createElement('div');
  page.className = 'page-container screen-enter';

  const card = document.createElement('div');
  card.className = 'auth-card';
  card.innerHTML = `
    <div class="flex items-center gap-3 mb-6">
      <button id="back-btn" class="btn btn-ghost" style="min-width:0;padding:0.35rem">
        <span class="material-icons-round">arrow_back</span>
      </button>
      <h2 class="font-black text-xl" style="color:var(--text)">Recuperar contrasena</h2>
    </div>
    <p class="text-sm mb-5" style="color:var(--text-muted);line-height:1.6;font-weight:500">
      Ingresa tu correo y te enviaremos un enlace para restablecer tu contrasena.
    </p>
    <div id="recover-fields"></div>
    <div id="recover-msg" class="hidden text-sm font-semibold text-center py-2 px-3 rounded-lg mb-3"></div>
  `;

  card.querySelector('#back-btn').addEventListener('click', () => router.navigate('login'));

  const fieldsContainer = card.querySelector('#recover-fields');
  fieldsContainer.appendChild(createField({
    id: 'recover-email', label: 'Correo electronico',
    type: 'email', placeholder: 'tu@correo.com', required: true
  }));

  const submitBtn = createButton({ text: 'Enviar enlace', icon: 'send', fullWidth: true });
  card.appendChild(submitBtn);

  page.appendChild(card);
  app.appendChild(page);

  submitBtn.addEventListener('click', async () => {
    const email   = getFieldValue('recover-email');
    const msgEl   = card.querySelector('#recover-msg');
    msgEl.className = 'hidden text-sm font-semibold text-center py-2 px-3 rounded-lg mb-3';
    clearFieldErrors('recover-email');

    if (!email) { setFieldError('recover-email', 'Ingresa tu correo'); return; }
    if (!isValidEmail(email)) { setFieldError('recover-email', 'Correo no valido'); return; }

    submitBtn.disabled = true;
    showLoading('Enviando enlace...');

    try {
      await auth.sendPasswordResetEmail(email);
      hideLoading();
      msgEl.textContent = 'Enlace enviado. Revisa tu correo.';
      msgEl.style.background = 'rgba(115,226,160,0.1)';
      msgEl.style.color = 'var(--success)';
      msgEl.classList.remove('hidden');
    } catch (error) {
      hideLoading();
      submitBtn.disabled = false;
      msgEl.textContent = mapFirebaseError(error.code);
      msgEl.style.background = 'rgba(226,115,115,0.1)';
      msgEl.style.color = 'var(--danger)';
      msgEl.classList.remove('hidden');
    }
  });
}


// ============================================================
// PANTALLA: RESTABLECER CONTRASENA (desde el link del correo)
// Firebase maneja el token via parametro oobCode en la URL
// ============================================================
function renderResetPassword(oobCode) {
  const app = document.getElementById('app');
  app.innerHTML = '';

  const page = document.createElement('div');
  page.className = 'page-container screen-enter';

  const card = document.createElement('div');
  card.className = 'auth-card';
  card.innerHTML = `
    <div class="app-icon mb-5">
      <span class="material-icons-round" style="font-size:2rem;color:var(--accent)">lock_reset</span>
    </div>
    <h2 class="font-black text-xl mb-2 text-center" style="color:var(--text)">Nueva contrasena</h2>
    <p class="text-sm mb-5 text-center" style="color:var(--text-muted);font-weight:500">
      Elige una contrasena segura para tu cuenta.
    </p>
    <div id="reset-fields"></div>
    <div id="reset-msg" class="hidden text-sm font-semibold text-center py-2 px-3 rounded-lg mb-3"></div>
  `;

  const fieldsContainer = card.querySelector('#reset-fields');
  fieldsContainer.append(
    createField({ id: 'reset-password',  label: 'Nueva contrasena', type: 'password', placeholder: '8+ caracteres', required: true }),
    createField({ id: 'reset-password2', label: 'Repetir contrasena', type: 'password', placeholder: '••••••••', required: true }),
  );

  const submitBtn = createButton({ text: 'Guardar cambios', icon: 'save', fullWidth: true });
  card.appendChild(submitBtn);
  page.appendChild(card);
  app.appendChild(page);

  submitBtn.addEventListener('click', async () => {
    const password  = getFieldValue('reset-password');
    const password2 = getFieldValue('reset-password2');
    const msgEl     = card.querySelector('#reset-msg');
    msgEl.className = 'hidden text-sm font-semibold text-center py-2 px-3 rounded-lg mb-3';
    clearFieldErrors('reset-password', 'reset-password2');

    if (!password) { setFieldError('reset-password', 'Ingresa la nueva contrasena'); return; }
    if (!isStrongPassword(password)) {
      setFieldError('reset-password', 'Minimo 8 caracteres, mayuscula, numero y simbolo'); return;
    }
    if (password !== password2) { setFieldError('reset-password2', 'Las contrasenas no coinciden'); return; }

    submitBtn.disabled = true;
    showLoading('Guardando...');

    try {
      // Verificar y confirmar el codigo de restablecimiento de Firebase
      await auth.verifyPasswordResetCode(oobCode);
      await auth.confirmPasswordReset(oobCode, password);
      hideLoading();
      showToast('Contrasena actualizada. Inicia sesion.', 'success');
      setTimeout(() => router.navigate('login'), 1200);
    } catch (error) {
      hideLoading();
      submitBtn.disabled = false;
      msgEl.textContent = 'El enlace expiro o no es valido. Solicita uno nuevo.';
      msgEl.style.background = 'rgba(226,115,115,0.1)';
      msgEl.style.color = 'var(--danger)';
      msgEl.classList.remove('hidden');
    }
  });
}


// ============================================================
// CERRAR SESION
// ============================================================
async function handleLogout() {
  try {
    await auth.signOut();
  } catch {
    router.navigate('login');
  }
}