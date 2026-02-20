// ============================================================
// components.js
// Componentes reutilizables de la interfaz de usuario
// ============================================================


// ------------------------------------------------------------
// TOAST - Notificaciones emergentes
// Tipos: 'success' | 'error' | 'info'
// ------------------------------------------------------------
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');

  const iconMap = {
    success: 'check_circle',
    error:   'error',
    info:    'info'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="material-icons-round" style="font-size:1.1rem">${iconMap[type]}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Remover con animacion de salida
  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}


// ------------------------------------------------------------
// LOADING OVERLAY - Pantalla de carga global
// ------------------------------------------------------------
function showLoading(message = 'Cargando...') {
  const overlay  = document.getElementById('loading-overlay');
  const msgEl    = document.getElementById('loading-message');
  msgEl.textContent = message;
  overlay.classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading-overlay').classList.add('hidden');
}


// ------------------------------------------------------------
// FIELD - Campo de formulario con label y manejo de error
// Retorna el elemento HTMLElement del contenedor del campo
// ------------------------------------------------------------
function createField({ id, label, type = 'text', placeholder = '', required = false, value = '' }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'mb-4';
  wrapper.innerHTML = `
    <label class="field-label" for="${id}">${label}</label>
    <input
      class="field-input"
      id="${id}"
      name="${id}"
      type="${type}"
      placeholder="${placeholder}"
      ${required ? 'required' : ''}
      autocomplete="${type === 'password' ? 'current-password' : 'off'}"
      value="${value}"
    />
    <p class="field-error hidden text-xs mt-1 font-semibold" id="${id}-error" style="color:var(--danger)"></p>
  `;
  return wrapper;
}

function setFieldError(id, message) {
  const input = document.getElementById(id);
  const error = document.getElementById(`${id}-error`);
  if (!input || !error) return;
  if (message) {
    input.classList.add('error');
    error.textContent = message;
    error.classList.remove('hidden');
  } else {
    input.classList.remove('error');
    error.classList.add('hidden');
  }
}

function clearFieldErrors(...ids) {
  ids.forEach(id => setFieldError(id, ''));
}

function getFieldValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}


// ------------------------------------------------------------
// BUTTON - Boton con estilos del sistema de diseno
// variant: 'primary' | 'ghost' | 'danger' | 'success'
// ------------------------------------------------------------
function createButton({ text, icon = '', variant = 'primary', id = '', fullWidth = false, type = 'button' }) {
  const btn = document.createElement('button');
  btn.className = `btn btn-${variant}${fullWidth ? ' w-full' : ''}`;
  btn.type = type;
  if (id) btn.id = id;
  btn.innerHTML = `
    ${icon ? `<span class="material-icons-round" style="font-size:1.15rem">${icon}</span>` : ''}
    <span>${text}</span>
  `;

  // Efecto ripple al hacer click
  btn.addEventListener('click', function(e) {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    btn.style.setProperty('--ripple-x', x + 'px');
    btn.style.setProperty('--ripple-y', y + 'px');
    btn.classList.remove('ripple');
    void btn.offsetWidth;
    btn.classList.add('ripple');
  });

  return btn;
}


// ------------------------------------------------------------
// MODAL - Panel de fondo oscuro con panel central / bottom sheet
// Retorna: { backdrop, panel, close }
// ------------------------------------------------------------
function createModal({ title = '', onClose = null } = {}) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.style.animation = 'fadeIn 0.25s ease both';

  const panel = document.createElement('div');
  panel.className = 'modal-panel';

  // Encabezado del modal
  const header = document.createElement('div');
  header.className = 'flex items-center justify-between mb-5';
  header.innerHTML = `
    <h3 class="text-lg font-800 font-extrabold" style="color:var(--text)">${title}</h3>
  `;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn btn-ghost p-2';
  closeBtn.style.minWidth = '0';
  closeBtn.style.padding = '0.35rem';
  closeBtn.innerHTML = `<span class="material-icons-round" style="font-size:1.2rem">close</span>`;

  header.appendChild(closeBtn);
  panel.appendChild(header);
  backdrop.appendChild(panel);
  document.body.appendChild(backdrop);

  // Funcion para cerrar con animacion
  const close = (callback) => {
    panel.classList.add('closing');
    backdrop.style.animation = 'fadeIn 0.2s ease reverse both';
    panel.addEventListener('animationend', () => {
      backdrop.remove();
      if (callback) callback();
      if (onClose) onClose();
    }, { once: true });
  };

  closeBtn.addEventListener('click', () => close());
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  return { backdrop, panel, close };
}


// ------------------------------------------------------------
// TOPBAR - Barra superior de la aplicacion
// ------------------------------------------------------------
function renderTopbar({ username, onSettings, onHelp, onLogout }) {
  const topbar = document.createElement('div');
  topbar.className = 'topbar';
  topbar.id = 'topbar';

  // Obtener iniciales del usuario para el avatar
  const initials = username
    ? username.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  topbar.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="user-avatar">${initials}</div>
      <div>
        <p class="text-xs font-semibold" style="color:var(--text-muted);line-height:1">Hola,</p>
        <p class="font-800 text-sm font-extrabold" style="color:var(--text);line-height:1.3">${username}</p>
      </div>
    </div>
    <button id="menu-btn" class="btn btn-ghost" style="min-width:0;padding:0.4rem">
      <span class="material-icons-round">more_vert</span>
    </button>
  `;

  // Menu desplegable
  const menuBtn = topbar.querySelector('#menu-btn');
  let dropdownOpen = false;
  let dropdown = null;

  const closeDropdown = () => {
    if (dropdown) {
      dropdown.style.animation = 'dropdownOpen 0.15s ease reverse both';
      dropdown.addEventListener('animationend', () => { dropdown && dropdown.remove(); dropdown = null; }, { once: true });
      dropdownOpen = false;
    }
  };

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (dropdownOpen) { closeDropdown(); return; }

    dropdown = document.createElement('div');
    dropdown.className = 'dropdown-menu open';
    dropdown.innerHTML = `
      <div class="dropdown-item" id="dd-settings">
        <span class="material-icons-round" style="font-size:1.1rem">settings</span> Ajustes
      </div>
      <div class="dropdown-item" id="dd-help">
        <span class="material-icons-round" style="font-size:1.1rem">help_outline</span> Ayuda
      </div>
      <div class="divider" style="margin:0"></div>
      <div class="dropdown-item danger" id="dd-logout">
        <span class="material-icons-round" style="font-size:1.1rem">logout</span> Cerrar sesion
      </div>
    `;

    document.body.appendChild(dropdown);
    dropdownOpen = true;

    // Posicionar debajo del boton sin salirse del viewport
    const rect        = menuBtn.getBoundingClientRect();
    const dropWidth   = 180;
    const rightOffset = window.innerWidth - rect.right;
    // Si no cabe a la derecha, ajustar para que no se salga por la izquierda
    const clampedRight = Math.max(8, Math.min(rightOffset, window.innerWidth - dropWidth - 8));

    dropdown.style.top   = (rect.bottom + 8) + 'px';
    dropdown.style.right = clampedRight + 'px';

    dropdown.querySelector('#dd-settings').addEventListener('click', () => { closeDropdown(); onSettings && onSettings(); });
    dropdown.querySelector('#dd-help').addEventListener('click', () => { closeDropdown(); onHelp && onHelp(); });
    dropdown.querySelector('#dd-logout').addEventListener('click', () => { closeDropdown(); onLogout && onLogout(); });
  });

  document.addEventListener('click', closeDropdown);

  return topbar;
}


// ------------------------------------------------------------
// EMPTY STATE - Estado vacio de la lista de metas
// ------------------------------------------------------------
function renderEmptyState() {
  const el = document.createElement('div');
  el.className = 'empty-state';
  el.innerHTML = `
    <div style="
      width:80px; height:80px; border-radius:50%;
      background:rgba(115,213,226,0.08);
      border:2px dashed rgba(115,213,226,0.25);
      display:flex; align-items:center; justify-content:center;
      margin-bottom:1.25rem;
    ">
      <span class="material-icons-round" style="font-size:2rem;color:var(--text-muted)">flag</span>
    </div>
    <p class="font-extrabold text-lg" style="color:var(--text)">Sin metas aun</p>
    <p class="text-sm mt-1" style="color:var(--text-muted)">Presiona el boton + para crear tu primera meta</p>
  `;
  return el;
}


// ------------------------------------------------------------
// GOODBYE SCREEN - Pantalla de despedida al cerrar sesion
// ------------------------------------------------------------
function showGoodbyeScreen(username, callback) {
  const el = document.createElement('div');
  el.className = 'goodbye-msg';

  const firstName = username ? username.split(' ')[0] : '';

  el.innerHTML = `
    <div style="text-align:center">
      <div class="app-icon" style="margin-bottom:1.5rem">
        <span class="material-icons-round" style="font-size:2rem;color:var(--accent)">flag</span>
      </div>
      <p class="goodbye-text">Hasta pronto, ${firstName}!</p>
      <p style="color:var(--text-muted);font-weight:600;margin-top:1rem;opacity:0;animation:fadeIn 0.3s ease 0.3s both">
        Sigue alcanzando tus metas
      </p>
    </div>
  `;

  document.body.appendChild(el);

  // Eliminar y llamar al callback despues de la animacion
  setTimeout(() => {
    el.style.animation = 'fadeIn 0.4s ease reverse both';
    el.addEventListener('animationend', () => {
      el.remove();
      if (callback) callback();
    }, { once: true });
  }, 2200);
}


// ------------------------------------------------------------
// PROGRESS SUMMARY - Resumen de progreso en la parte superior
// ------------------------------------------------------------
function renderProgressSummary(total, completed) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const el = document.createElement('div');
  el.id = 'progress-summary';
  el.style.marginBottom = '1.25rem';
  el.innerHTML = `
    <div class="flex justify-between items-center mb-2">
      <span class="text-sm font-semibold" style="color:var(--text-muted)">${completed} de ${total} completadas</span>
      <span class="text-sm font-bold brand-highlight">${pct}%</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width:${pct}%"></div>
    </div>
  `;
  return el;
}