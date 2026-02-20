// ============================================================
// goals.js
// Modulo de metas: creacion, lectura, edicion, eliminacion
// Usa Firestore para persistencia
// ============================================================


// ------------------------------------------------------------
// Formatear fecha en texto legible
// ------------------------------------------------------------
function formatDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Retorna clase de estado de la fecha: 'overdue' | 'soon' | ''
function getDeadlineStatus(dateStr) {
  if (!dateStr) return '';
  const today    = new Date(); today.setHours(0,0,0,0);
  const deadline = new Date(dateStr + 'T00:00:00');
  const diff     = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
  if (diff < 0)  return 'overdue';
  if (diff <= 3) return 'soon';
  return '';
}

// ------------------------------------------------------------
// Sanitizar texto antes de guardarlo o mostrarlo
// ------------------------------------------------------------
function sanitize(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(str || '')));
  return div.innerHTML;
}


// ============================================================
// TARJETA DE META
// Retorna un HTMLElement de la tarjeta
// ------------------------------------------------------------
function createGoalCard(goal, uid, { onUpdate, onDelete } = {}) {
  const card = document.createElement('div');
  card.className = 'goal-card mb-3';
  card.dataset.id = goal.id;
  if (goal.completed) card.classList.add('completed');

  const deadlineStatus = getDeadlineStatus(goal.deadline);
  const deadlineLabel  = goal.deadline
    ? `<span class="deadline-badge ${deadlineStatus}">
        <span class="material-icons-round" style="font-size:0.75rem">event</span>
        ${formatDate(goal.deadline)}
      </span>`
    : '';

  card.innerHTML = `
    <div class="goal-header flex items-start justify-between gap-3 cursor-pointer" role="button" tabindex="0">
      <div class="flex items-start gap-3 flex-1 min-w-0">
        <span class="material-icons-round mt-0.5 flex-shrink-0" style="font-size:1.1rem;color:${goal.completed ? 'var(--success)' : 'var(--accent)'}">
          ${goal.completed ? 'check_circle' : 'radio_button_unchecked'}
        </span>
        <div class="flex-1 min-w-0">
          <p class="goal-title font-bold text-sm leading-tight" style="color:var(--text);word-break:break-word">
            ${sanitize(goal.title)}
          </p>
          ${goal.details ? `<p class="text-xs mt-0.5 leading-snug" style="color:var(--text-muted);word-break:break-word">${sanitize(goal.details)}</p>` : ''}
          ${deadlineLabel ? `<div class="mt-1.5">${deadlineLabel}</div>` : ''}
        </div>
      </div>
      <span class="material-icons-round chevron flex-shrink-0 transition-transform duration-300" style="color:var(--text-muted);font-size:1rem">
        expand_more
      </span>
    </div>

    <div class="goal-actions mt-0" id="actions-${goal.id}">
      <div class="divider"></div>
      <div class="goal-action-btns">
        <button class="btn btn-success btn-complete" style="font-size:0.8rem;padding:0.5rem 0.75rem;min-height:40px">
          <span class="material-icons-round" style="font-size:1rem">${goal.completed ? 'undo' : 'check_circle'}</span>
          <span>${goal.completed ? 'Deshacer' : 'Completada'}</span>
        </button>
        <button class="btn btn-ghost btn-edit" style="font-size:0.8rem;padding:0.5rem 0.75rem;min-height:40px">
          <span class="material-icons-round" style="font-size:1rem">edit</span>
          <span>Editar</span>
        </button>
        <button class="btn btn-danger btn-delete" style="font-size:0.8rem;padding:0.5rem 0.75rem;min-height:40px">
          <span class="material-icons-round" style="font-size:1rem">delete_outline</span>
          <span>Eliminar</span>
        </button>
      </div>
    </div>
  `;

  // Toggle expandir / colapsar tarjeta
  const header  = card.querySelector('.goal-header');
  const actions = card.querySelector('.goal-actions');
  const chevron = card.querySelector('.chevron');

  const toggleCard = () => {
    const isOpen = actions.classList.contains('open');
    // Cerrar todas las otras tarjetas abiertas
    document.querySelectorAll('.goal-actions.open').forEach(a => {
      a.classList.remove('open');
      const c = a.closest('.goal-card')?.querySelector('.chevron');
      if (c) c.style.transform = 'rotate(0deg)';
    });
    if (!isOpen) {
      actions.classList.add('open');
      chevron.style.transform = 'rotate(180deg)';
    }
  };

  header.addEventListener('click', toggleCard);
  header.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') toggleCard(); });

  // Boton: Completar / Deshacer
  card.querySelector('.btn-complete').addEventListener('click', async (e) => {
    e.stopPropagation();
    const newStatus = !goal.completed;
    try {
      await db.collection('users').doc(uid).collection('goals').doc(goal.id).update({
        completed:   newStatus,
        completedAt: newStatus ? firebase.firestore.FieldValue.serverTimestamp() : null,
      });

      // Animacion de check
      const icon = card.querySelector('.material-icons-round');
      icon.classList.add('check-animate');
      icon.addEventListener('animationend', () => icon.classList.remove('check-animate'), { once: true });

      goal.completed = newStatus;
      if (onUpdate) onUpdate();
    } catch {
      showToast('No se pudo actualizar la meta', 'error');
    }
  });

  // Boton: Editar
  card.querySelector('.btn-edit').addEventListener('click', (e) => {
    e.stopPropagation();
    actions.classList.remove('open');
    chevron.style.transform = 'rotate(0deg)';
    openGoalModal({ uid, goal, onSave: onUpdate });
  });

  // Boton: Eliminar
  card.querySelector('.btn-delete').addEventListener('click', (e) => {
    e.stopPropagation();
    openDeleteConfirm({ uid, goal, onDelete });
  });

  return card;
}


// ============================================================
// MODAL: CREAR / EDITAR META
// ============================================================
function openGoalModal({ uid, goal = null, onSave = null }) {
  const isEdit = !!goal;
  const { panel, close } = createModal({ title: isEdit ? 'Editar meta' : 'Nueva meta' });

  const form = document.createElement('div');

  // Obtener fecha minima (hoy) para el campo de fecha limite
  const today = new Date().toISOString().split('T')[0];

  form.innerHTML = `
    <div id="modal-fields"></div>
    <div id="modal-error" class="hidden text-sm font-semibold py-2 px-3 rounded-lg mb-3"
      style="background:rgba(226,115,115,0.1);color:var(--danger)"></div>
    <div class="flex gap-3 mt-4">
      <button class="btn btn-ghost flex-1" id="modal-cancel">Cancelar</button>
      <button class="btn btn-primary flex-1" id="modal-save">
        <span class="material-icons-round" style="font-size:1rem">${isEdit ? 'save' : 'add'}</span>
        <span>${isEdit ? 'Guardar' : 'Crear meta'}</span>
      </button>
    </div>
  `;

  const fieldsContainer = form.querySelector('#modal-fields');
  fieldsContainer.append(
    createField({
      id: 'goal-title', label: 'Nombre de la meta',
      placeholder: 'Ej: Leer 12 libros este ano',
      required: true,
      value: isEdit ? goal.title : ''
    }),
    createField({
      id: 'goal-details', label: 'Detalles (opcional)',
      placeholder: 'Describe tu meta...',
      value: isEdit ? (goal.details || '') : ''
    }),
  );

  // Campo de detalles como textarea
  const detailsInput = fieldsContainer.querySelector('#goal-details');
  detailsInput.parentElement.innerHTML = `
    <label class="field-label" for="goal-details">Detalles (opcional)</label>
    <textarea
      class="field-input"
      id="goal-details"
      placeholder="Describe tu meta..."
      rows="3"
      style="resize:vertical"
    >${isEdit ? sanitize(goal.details || '') : ''}</textarea>
    <p class="field-error hidden text-xs mt-1 font-semibold" id="goal-details-error" style="color:var(--danger)"></p>
  `;

  // Campo de fecha limite
  const deadlineWrapper = document.createElement('div');
  deadlineWrapper.className = 'mb-4';
  deadlineWrapper.innerHTML = `
    <label class="field-label" for="goal-deadline">Fecha limite (opcional)</label>
    <input
      class="field-input"
      id="goal-deadline"
      type="date"
      min="${today}"
      value="${isEdit ? (goal.deadline || '') : ''}"
      style="color-scheme: dark"
    />
    <p class="field-error hidden text-xs mt-1 font-semibold" id="goal-deadline-error" style="color:var(--danger)"></p>
  `;
  fieldsContainer.appendChild(deadlineWrapper);

  panel.appendChild(form);

  panel.querySelector('#modal-cancel').addEventListener('click', () => close());

  panel.querySelector('#modal-save').addEventListener('click', async () => {
    const title    = getFieldValue('goal-title');
    const details  = document.getElementById('goal-details')?.value.trim() || '';
    const deadline = getFieldValue('goal-deadline');
    const errorEl  = panel.querySelector('#modal-error');

    errorEl.classList.add('hidden');
    clearFieldErrors('goal-title');

    if (!title) { setFieldError('goal-title', 'Ingresa el nombre de la meta'); return; }
    if (title.length > 120) { setFieldError('goal-title', 'Maximo 120 caracteres'); return; }

    const saveBtn = panel.querySelector('#modal-save');
    saveBtn.disabled = true;

    try {
      const goalsRef = db.collection('users').doc(uid).collection('goals');
      const data = {
        title:     title,
        details:   details,
        deadline:  deadline || null,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      if (isEdit) {
        await goalsRef.doc(goal.id).update(data);
        showToast('Meta actualizada', 'success');
      } else {
        data.completed  = false;
        data.completedAt = null;
        data.createdAt  = firebase.firestore.FieldValue.serverTimestamp();
        await goalsRef.add(data);
        showToast('Meta creada', 'success');
      }

      close(() => { if (onSave) onSave(); });
    } catch (err) {
      saveBtn.disabled = false;
      errorEl.textContent = 'No se pudo guardar. Intenta de nuevo.';
      errorEl.classList.remove('hidden');
    }
  });
}


// ============================================================
// MODAL: CONFIRMAR ELIMINACION DE META
// ============================================================
function openDeleteConfirm({ uid, goal, onDelete = null }) {
  const { panel, close } = createModal({ title: 'Eliminar meta' });

  const body = document.createElement('div');
  body.innerHTML = `
    <p class="text-sm mb-5" style="color:var(--text-muted);line-height:1.6;font-weight:500">
      Esta accion no se puede deshacer. Se eliminara permanentemente
      <strong style="color:var(--text)">"${sanitize(goal.title)}"</strong>.
    </p>
    <div class="flex gap-3">
      <button class="btn btn-ghost flex-1" id="del-cancel">Cancelar</button>
      <button class="btn btn-danger flex-1" id="del-confirm">
        <span class="material-icons-round" style="font-size:1rem">delete_forever</span>
        <span>Eliminar</span>
      </button>
    </div>
  `;

  panel.appendChild(body);

  panel.querySelector('#del-cancel').addEventListener('click', () => close());

  panel.querySelector('#del-confirm').addEventListener('click', async () => {
    const confirmBtn = panel.querySelector('#del-confirm');
    confirmBtn.disabled = true;

    try {
      await db.collection('users').doc(uid).collection('goals').doc(goal.id).delete();

      close(() => {
        // Animar la tarjeta antes de eliminarla del DOM
        const card = document.querySelector(`[data-id="${goal.id}"]`);
        if (card) {
          card.classList.add('card-remove');
          card.addEventListener('animationend', () => {
            card.remove();
            if (onDelete) onDelete();
          }, { once: true });
        } else {
          if (onDelete) onDelete();
        }
        showToast('Meta eliminada', 'info');
      });
    } catch {
      confirmBtn.disabled = false;
      showToast('No se pudo eliminar. Intenta de nuevo.', 'error');
    }
  });
}


// ============================================================
// PANTALLA PRINCIPAL: LISTA DE METAS
// ============================================================
function renderApp(user, userData) {
  const app = document.getElementById('app');
  app.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'min-h-screen';
  container.style.animation = 'fadeIn 0.3s ease both';

  // Topbar
  const displayName = userData?.displayName || user.displayName || user.email;
  const topbar = renderTopbar({
    username: displayName,
    onSettings: () => renderSettings(user, userData),
    onHelp:     () => renderHelp(),
    onLogout:   () => handleLogout(),
  });
  container.appendChild(topbar);

  // Zona de contenido
  const content = document.createElement('div');
  content.className = 'content-area';

  // Encabezado de seccion
  const sectionHeader = document.createElement('div');
  sectionHeader.className = 'flex items-center justify-between mb-4 mt-2';
  sectionHeader.innerHTML = `
    <h2 class="section-title">Mis metas</h2>
  `;
  content.appendChild(sectionHeader);

  // Contenedor del progreso
  const progressContainer = document.createElement('div');
  progressContainer.id = 'progress-container';
  content.appendChild(progressContainer);

  // Lista de metas
  const goalsList = document.createElement('div');
  goalsList.id = 'goals-list';
  goalsList.innerHTML = `
    <div class="flex items-center justify-center py-8">
      <div class="loader-ring" style="width:32px;height:32px;border-width:3px"></div>
    </div>
  `;
  content.appendChild(goalsList);

  container.appendChild(content);

  // Boton flotante para crear nueva meta
  const fab = document.createElement('button');
  fab.className = 'fab fab-appear';
  fab.title = 'Nueva meta';
  fab.innerHTML = `<span class="material-icons-round" style="font-size:1.5rem">add</span>`;
  fab.addEventListener('click', () => {
    openGoalModal({ uid: user.uid, onSave: loadGoals });
  });
  container.appendChild(fab);

  app.appendChild(container);

  // Estado local para seguimiento de metas
  let allGoals = [];
  let tutorialShown = false; // Bandera para mostrar el tutorial solo en el primer snapshot

  // Cargar y renderizar metas en tiempo real con Firestore listener
  let unsubscribe = null;

  function loadGoals() {
    if (unsubscribe) unsubscribe();

    unsubscribe = db
      .collection('users').doc(user.uid).collection('goals')
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        allGoals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderGoalsList(allGoals);
        hideLoading();

        // Mostrar el tutorial la primera vez que el usuario entra al dashboard.
        // La bandera tutorialShown evita que se dispare en actualizaciones
        // posteriores del snapshot (cada vez que cambia una meta).
        if (!tutorialShown) {
          tutorialShown = true;
          showTutorial();
        }
      }, () => {
        showToast('Error al cargar metas', 'error');
        hideLoading();
      });
  }

  function renderGoalsList(goals) {
    goalsList.innerHTML = '';

    // Resumen de progreso
    progressContainer.innerHTML = '';
    if (goals.length > 0) {
      const completed = goals.filter(g => g.completed).length;
      progressContainer.appendChild(renderProgressSummary(goals.length, completed));
    }

    if (goals.length === 0) {
      goalsList.appendChild(renderEmptyState());
      return;
    }

    // Separar metas pendientes de completadas
    const pending   = goals.filter(g => !g.completed);
    const completed = goals.filter(g =>  g.completed);

    const renderGroup = (group, isCompleted) => {
      if (group.length === 0) return;
      if (isCompleted && pending.length > 0) {
        const sep = document.createElement('p');
        sep.className = 'text-xs font-bold mt-4 mb-3';
        sep.style.cssText = 'color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em';
        sep.textContent = 'Completadas';
        goalsList.appendChild(sep);
      }
      group.forEach((goal, idx) => {
        const card = createGoalCard(goal, user.uid, {
          onUpdate: () => {}, // El listener de Firestore actualiza automaticamente
          onDelete: () => {},
        });
        card.style.animationDelay = `${idx * 0.04}s`;
        card.classList.add('card-appear');
        goalsList.appendChild(card);
      });
    };

    renderGroup(pending, false);
    renderGroup(completed, true);
  }

  loadGoals();
}


// ============================================================
// PANTALLA: AJUSTES DE CUENTA
// ============================================================
function renderSettings(user, userData) {
  const app = document.getElementById('app');
  app.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'min-h-screen screen-enter';

  // Topbar de ajustes
  const settingsTopbar = document.createElement('div');
  settingsTopbar.className = 'topbar';
  settingsTopbar.innerHTML = `
    <div class="flex items-center gap-3">
      <button id="settings-back" class="btn btn-ghost" style="min-width:0;padding:0.4rem">
        <span class="material-icons-round">arrow_back</span>
      </button>
      <h2 class="font-extrabold text-base" style="color:var(--text)">Ajustes</h2>
    </div>
  `;
  settingsTopbar.querySelector('#settings-back').addEventListener('click', () => {
    renderApp(user, userData);
  });
  container.appendChild(settingsTopbar);

  const content = document.createElement('div');
  content.className = 'content-area';

  // Seccion: Informacion personal
  const card = document.createElement('div');
  card.className = 'auth-card';
  card.style.maxWidth = '100%';

  card.innerHTML = `
    <h3 class="font-bold text-sm uppercase tracking-widest mb-4" style="color:var(--text-muted)">
      Informacion de cuenta
    </h3>
    <div id="settings-fields"></div>
    <div id="settings-error" class="hidden text-sm font-semibold py-2 px-3 rounded-lg mb-3"
      style="background:rgba(226,115,115,0.1);color:var(--danger)"></div>
  `;

  const fieldsContainer = card.querySelector('#settings-fields');
  fieldsContainer.append(
    createField({ id: 'sett-displayname', label: 'Nombre completo', value: userData?.displayName || '', required: true }),
    createField({ id: 'sett-username', label: 'Nombre de usuario', value: userData?.username || '', required: true }),
    createField({ id: 'sett-email', label: 'Correo electronico', type: 'email', value: user.email || '', required: true }),
  );

  const divider = document.createElement('div');
  divider.className = 'divider';
  card.appendChild(divider);

  card.innerHTML += `<h3 class="font-bold text-sm uppercase tracking-widest mb-4" style="color:var(--text-muted)">Cambiar contrasena</h3>`;
  const pwFields = document.createElement('div');
  pwFields.id = 'pw-fields';
  pwFields.append(
    createField({ id: 'sett-pw-current', label: 'Contrasena actual', type: 'password', placeholder: '••••••••', required: true }),
    createField({ id: 'sett-pw-new', label: 'Nueva contrasena', type: 'password', placeholder: '8+ caracteres', required: true }),
    createField({ id: 'sett-pw-new2', label: 'Repetir nueva contrasena', type: 'password', placeholder: '••••••••', required: true }),
  );
  card.appendChild(pwFields);

  const saveBtn = createButton({ text: 'Guardar cambios', icon: 'save', fullWidth: true });
  card.appendChild(saveBtn);
  content.appendChild(card);
  container.appendChild(content);
  app.appendChild(container);

  saveBtn.addEventListener('click', async () => {
    const displayName = getFieldValue('sett-displayname');
    const username    = getFieldValue('sett-username');
    const email       = getFieldValue('sett-email');
    const pwCurrent   = getFieldValue('sett-pw-current');
    const pwNew       = getFieldValue('sett-pw-new');
    const pwNew2      = getFieldValue('sett-pw-new2');
    const errorEl     = card.querySelector('#settings-error');
    errorEl.classList.add('hidden');
    clearFieldErrors('sett-displayname','sett-username','sett-email','sett-pw-new','sett-pw-new2');

    let hasError = false;
    if (!displayName) { setFieldError('sett-displayname', 'Ingresa tu nombre'); hasError = true; }
    if (!username) { setFieldError('sett-username', 'Ingresa un nombre de usuario'); hasError = true; }
    if (!email || !isValidEmail(email)) { setFieldError('sett-email', 'Correo no valido'); hasError = true; }
    if (hasError) return;

    // Validar contrasena solo si el usuario quiere cambiarla
    const changingPassword = pwCurrent || pwNew || pwNew2;
    if (changingPassword) {
      if (!pwCurrent) { setFieldError('sett-pw-current', 'Ingresa tu contrasena actual'); return; }
      if (!isStrongPassword(pwNew)) { setFieldError('sett-pw-new', 'Minimo 8 caracteres, mayuscula, numero y simbolo'); return; }
      if (pwNew !== pwNew2) { setFieldError('sett-pw-new2', 'Las contrasenas no coinciden'); return; }
    }

    saveBtn.disabled = true;
    showLoading('Guardando cambios...');

    try {
      const updates = [];

      // Reautenticar si se va a cambiar datos sensibles
      if (changingPassword || email !== user.email) {
        const credential = firebase.auth.EmailAuthProvider.credential(user.email, pwCurrent || '');
        await user.reauthenticateWithCredential(credential);
      }

      if (email !== user.email) {
        updates.push(user.updateEmail(email));
      }

      if (changingPassword && pwNew) {
        updates.push(user.updatePassword(pwNew));
      }

      updates.push(user.updateProfile({ displayName }));
      updates.push(
        db.collection('users').doc(user.uid).update({
          displayName: sanitize(displayName),
          username:    sanitize(username),
          email,
        })
      );

      await Promise.all(updates);
      hideLoading();
      showToast('Cambios guardados', 'success');
      saveBtn.disabled = false;

      // Actualizar referencia local de userData
      if (userData) {
        userData.displayName = displayName;
        userData.username    = username;
        userData.email       = email;
      }
    } catch (error) {
      hideLoading();
      saveBtn.disabled = false;
      errorEl.textContent = mapFirebaseError(error.code);
      errorEl.classList.remove('hidden');
    }
  });
}


// ============================================================
// PANTALLA: AYUDA Y CONTACTO
// ============================================================
function renderHelp() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'min-h-screen screen-enter';

  const helpTopbar = document.createElement('div');
  helpTopbar.className = 'topbar';
  helpTopbar.innerHTML = `
    <div class="flex items-center gap-3">
      <button id="help-back" class="btn btn-ghost" style="min-width:0;padding:0.4rem">
        <span class="material-icons-round">arrow_back</span>
      </button>
      <h2 class="font-extrabold text-base" style="color:var(--text)">Ayuda</h2>
    </div>
  `;

  // El boton de volver necesita saber a donde ir; usamos un evento custom
  helpTopbar.querySelector('#help-back').addEventListener('click', () => {
    // Volver a app requiere el user actual, lo tomamos del estado global
    router.navigate('app');
  });

  container.appendChild(helpTopbar);

  const content = document.createElement('div');
  content.className = 'content-area';

  const card = document.createElement('div');
  card.innerHTML = `
    <div class="mb-6">
      <h3 class="section-title mb-1">Contacta al desarrollador</h3>
      <p class="text-sm" style="color:var(--text-muted);font-weight:500">
        Si tienes dudas, sugerencias o encontraste un bug, no dudes en escribir.
      </p>
    </div>
  `;

  const contacts = [
    {
      icon: 'email',
      label: 'Correo electronico',
      sub: 'desarrollador@correo.com',
      href: 'mailto:desarrollador@correo.com',
      color: 'var(--accent)',
    },
    {
      icon: 'code',
      label: 'GitHub',
      sub: 'github.com/tu-usuario/zenit',
      href: 'https://github.com/tu-usuario/zenit',
      color: '#c9d1d9',
    },
    {
      icon: 'chat_bubble',
      label: 'WhatsApp',
      sub: '+57 300 000 0000',
      href: 'https://wa.me/573000000000',
      color: '#25D366',
    },
  ];

  contacts.forEach(c => {
    const link = document.createElement('a');
    link.className = 'contact-btn mb-3';
    link.href    = c.href;
    link.target  = '_blank';
    link.rel     = 'noopener noreferrer';
    link.innerHTML = `
      <div style="
        width:42px; height:42px; border-radius:12px;
        background:rgba(115,213,226,0.08);
        display:flex; align-items:center; justify-content:center; flex-shrink:0;
      ">
        <span class="material-icons-round" style="color:${c.color}">${c.icon}</span>
      </div>
      <div>
        <p class="font-bold text-sm">${c.label}</p>
        <p class="text-xs" style="color:var(--text-muted);font-weight:500">${c.sub}</p>
      </div>
      <span class="material-icons-round ml-auto" style="color:var(--text-muted);font-size:1rem">open_in_new</span>
    `;
    card.appendChild(link);
  });

  content.appendChild(card);
  container.appendChild(content);
  app.appendChild(container);
}