// ============================================================
// onboarding.js
// Modulo de bienvenida y tutorial para nuevos usuarios
//
// Contiene dos flujos:
//   1. showWelcomeModal()  - Modal en el login para usuarios nuevos
//   2. showTutorial()      - Tutorial paso a paso al entrar al dashboard
//                           por primera vez tras el registro
//
// El estado de "ya visto" se guarda en localStorage para no
// volver a mostrarlo en visitas posteriores.
// ============================================================


// ------------------------------------------------------------
// Claves de localStorage para controlar si ya se mostraron
// ------------------------------------------------------------
const STORAGE_KEY_WELCOME  = 'zenit_welcome_seen';
const STORAGE_KEY_TUTORIAL = 'zenit_tutorial_seen';


// ------------------------------------------------------------
// Pasos del tutorial
// Cada paso tiene:
//   title      - Nombre del paso
//   description- Texto explicativo para el usuario
//   gifMobile  - Ruta al gif para moviles (< 768px)
//   gifDesktop - Ruta al gif para tablet y escritorio (>= 768px)
// ------------------------------------------------------------
const TUTORIAL_STEPS = [
  {
    title:       'Agregar una nueva meta',
    description: 'Toca el boton + que esta en la esquina inferior derecha. Alli podras escribir el nombre de tu meta, agregar detalles y ponerle una fecha limite si quieres.',
    gifMobile:   'assets/gifs/mobile/step-1-add.gif',
    gifDesktop:  'assets/gifs/desktop/step-1-add.gif',
  },
  {
    title:       'Marcar como completada',
    description: 'Toca una meta para desplegar sus opciones y luego presiona "Completada". La meta quedara tachada para que sepas que ya la lograste.',
    gifMobile:   'assets/gifs/mobile/step-2-complete.gif',
    gifDesktop:  'assets/gifs/desktop/step-2-complete.gif',
  },
  {
    title:       'Editar una meta',
    description: 'Si quieres cambiar el nombre, los detalles o la fecha limite de una meta, toca la meta y luego presiona "Editar". Haz tus cambios y guarda.',
    gifMobile:   'assets/gifs/mobile/step-3-edit.gif',
    gifDesktop:  'assets/gifs/desktop/step-3-edit.gif',
  },
  {
    title:       'Borrar una meta',
    description: 'Para eliminar una meta que ya no necesitas, toca la meta, presiona "Eliminar" y confirma. Recuerda que esta accion no se puede deshacer.',
    gifMobile:   'assets/gifs/mobile/step-4-delete.gif',
    gifDesktop:  'assets/gifs/desktop/step-4-delete.gif',
  },
];


// ------------------------------------------------------------
// Determinar si el dispositivo es movil (< 768px)
// Se evalua en el momento de mostrar cada paso para adaptarse
// a cambios de orientacion
// ------------------------------------------------------------
function isMobileScreen() {
  return window.innerWidth < 768;
}


// ============================================================
// 1. MODAL DE BIENVENIDA (pantalla de login)
// Se muestra solo la primera vez que el usuario visita la app
// ============================================================
function showWelcomeModal() {
  // No mostrar si ya fue visto anteriormente
  if (localStorage.getItem(STORAGE_KEY_WELCOME)) return;

  const backdrop = document.createElement('div');
  backdrop.id = 'welcome-backdrop';
  backdrop.style.cssText = `
    position: fixed; inset: 0; z-index: 50;
    background: rgba(30, 49, 53, 0.8);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 1rem;
    animation: fadeIn 0.35s ease both;
  `;

  const card = document.createElement('div');
  card.style.cssText = `
    background: var(--bg-card);
    border: 1px solid rgba(115, 213, 226, 0.18);
    border-radius: 20px;
    padding: 2rem 1.5rem;
    max-width: 400px;
    width: 100%;
    box-shadow: 0 8px 40px rgba(0,0,0,0.4);
    animation: scaleIn 0.38s cubic-bezier(0.34, 1.3, 0.64, 1) both;
    text-align: center;
  `;

  card.innerHTML = `
    <!-- Icono decorativo -->
    <div style="
      width: 72px; height: 72px; border-radius: 20px; margin: 0 auto 1.25rem;
      background: linear-gradient(135deg, rgba(115,213,226,0.2), rgba(115,213,226,0.05));
      border: 1.5px solid rgba(115,213,226,0.3);
      display: flex; align-items: center; justify-content: center;
    ">
      <span class="material-icons-round" style="font-size: 2.2rem; color: var(--accent)">flag</span>
    </div>

    <!-- Titulo -->
    <h2 style="
      font-family: Nunito, sans-serif; font-weight: 900; font-size: 1.6rem;
      color: var(--text); letter-spacing: -0.03em; margin: 0 0 0.3rem;
    ">Bienvenido a Zenit</h2>

    <p style="
      font-family: Nunito, sans-serif; font-weight: 600; font-size: 0.9rem;
      color: var(--accent); margin: 0 0 1.25rem; letter-spacing: 0.02em;
    ">Tu espacio para alcanzar lo que te propones</p>

    <!-- Descripcion -->
    <p style="
      font-family: Nunito, sans-serif; font-weight: 500; font-size: 0.92rem;
      color: var(--text-muted); line-height: 1.65; margin: 0 0 1.5rem;
    ">
      Zenit es una app para que organices y le des seguimiento a tus metas personales.
      Crea metas, ponles fecha limite y marcalas cuando las logres.
      Simple, claro y enfocado en ti.
    </p>

    <!-- Caracteristicas rapidas -->
    <div style="
      display: flex; flex-direction: column; gap: 0.6rem;
      margin-bottom: 1.75rem; text-align: left;
    ">
      ${[
        ['add_circle', 'Crea metas con nombre, detalles y fecha limite'],
        ['check_circle', 'Marca tus metas cuando las completes'],
        ['edit',         'Edita o elimina tus metas cuando quieras'],
        ['insights',     'Ve tu progreso con un resumen visual'],
      ].map(([icon, text]) => `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span class="material-icons-round" style="font-size: 1.1rem; color: var(--accent); flex-shrink: 0">${icon}</span>
          <span style="font-family: Nunito, sans-serif; font-weight: 600; font-size: 0.85rem; color: var(--text-muted)">${text}</span>
        </div>
      `).join('')}
    </div>

    <!-- Boton de accion -->
    <button id="welcome-close-btn" style="
      width: 100%; background: var(--accent); color: var(--bg-dark);
      font-family: Nunito, sans-serif; font-weight: 800; font-size: 0.95rem;
      padding: 0.8rem 1.5rem; border: none; border-radius: 12px; cursor: pointer;
      transition: background 0.2s ease, transform 0.15s ease;
      min-height: 48px;
    ">
      Entendido, vamos
    </button>
  `;

  backdrop.appendChild(card);
  document.body.appendChild(backdrop);

  // Marcar como visto antes de cerrar para que no vuelva a aparecer
  localStorage.setItem(STORAGE_KEY_WELCOME, '1');

  const close = () => {
    backdrop.style.animation = 'fadeIn 0.25s ease reverse both';
    setTimeout(() => backdrop.remove(), 260);
  };

  card.querySelector('#welcome-close-btn').addEventListener('click', close);

  // Cerrar al tocar el fondo oscuro
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });
}


// ============================================================
// 2. TUTORIAL PASO A PASO (primera entrada al dashboard)
// Splash de pantalla completa con 4 pasos y gifs responsivos
// ============================================================
function showTutorial(onFinish) {
  // No mostrar si ya fue visto
  if (localStorage.getItem(STORAGE_KEY_TUTORIAL)) {
    if (onFinish) onFinish();
    return;
  }

  let currentStep = 0;

  // Contenedor principal del tutorial (pantalla completa)
  const overlay = document.createElement('div');
  overlay.id = 'tutorial-overlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 60;
    background: var(--bg-dark);
    display: flex; flex-direction: column;
    animation: fadeIn 0.35s ease both;
    overflow: hidden;
  `;

  overlay.innerHTML = `
    <!-- Barra superior con progreso y boton de saltar -->
    <div id="tutorial-header" style="
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1.25rem 0.5rem;
      flex-shrink: 0;
    ">
      <!-- Puntos indicadores de paso -->
      <div id="tutorial-dots" style="display: flex; gap: 6px; align-items: center;"></div>

      <!-- Boton saltar tutorial -->
      <button id="tutorial-skip" style="
        font-family: Nunito, sans-serif; font-weight: 700; font-size: 0.82rem;
        color: var(--text-muted); background: transparent; border: none;
        cursor: pointer; padding: 0.4rem 0.5rem; border-radius: 8px;
        transition: color 0.2s ease;
        min-height: 44px; touch-action: manipulation;
      ">Saltar</button>
    </div>

    <!-- Zona de contenido del paso actual -->
    <div id="tutorial-body" style="
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: flex-start;
      padding: 0.5rem 1.25rem; overflow-y: auto;
    "></div>

    <!-- Controles de navegacion -->
    <div id="tutorial-footer" style="
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1.25rem;
      padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
      flex-shrink: 0;
      border-top: 1px solid rgba(115, 213, 226, 0.08);
      gap: 0.75rem;
    ">
      <button id="tutorial-prev" style="
        font-family: Nunito, sans-serif; font-weight: 700; font-size: 0.9rem;
        color: var(--text-muted); background: transparent;
        border: 1.5px solid rgba(115, 213, 226, 0.2); border-radius: 10px;
        cursor: pointer; padding: 0.7rem 1.2rem; min-height: 48px;
        transition: border-color 0.2s, color 0.2s;
        touch-action: manipulation; min-width: 90px;
      ">Anterior</button>

      <button id="tutorial-next" style="
        font-family: Nunito, sans-serif; font-weight: 800; font-size: 0.95rem;
        color: var(--bg-dark); background: var(--accent);
        border: none; border-radius: 10px;
        cursor: pointer; padding: 0.7rem 1.5rem; min-height: 48px;
        transition: background 0.2s, transform 0.15s;
        touch-action: manipulation; flex: 1;
      ">Siguiente</button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Funcion para cerrar el tutorial y continuar a la app
  const finish = () => {
    localStorage.setItem(STORAGE_KEY_TUTORIAL, '1');
    overlay.style.transition = 'opacity 0.35s ease';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      if (onFinish) onFinish();
    }, 360);
  };

  overlay.querySelector('#tutorial-skip').addEventListener('click', finish);

  // Renderizar el contenido de un paso
  const renderStep = (index, direction = 'next') => {
    const step = TUTORIAL_STEPS[index];
    const body = overlay.querySelector('#tutorial-body');
    const isMobile = isMobileScreen();
    const gifSrc = isMobile ? step.gifMobile : step.gifDesktop;

    // Animacion de entrada segun direccion de navegacion
    const animIn = direction === 'next'
      ? 'slideInFromRight 0.32s cubic-bezier(0.4,0,0.2,1) both'
      : 'slideInFromLeft 0.32s cubic-bezier(0.4,0,0.2,1) both';

    body.innerHTML = `
      <div style="
        width: 100%; max-width: 560px; text-align: center;
        animation: ${animIn};
      ">
        <!-- Numero y titulo del paso -->
        <div style="margin-bottom: 1rem;">
          <span style="
            display: inline-block;
            font-family: Nunito, sans-serif; font-weight: 800; font-size: 0.72rem;
            color: var(--accent); letter-spacing: 0.1em; text-transform: uppercase;
            background: rgba(115,213,226,0.1); padding: 0.25rem 0.7rem;
            border-radius: 99px; margin-bottom: 0.6rem;
          ">Paso ${index + 1} de ${TUTORIAL_STEPS.length}</span>

          <h3 style="
            font-family: Nunito, sans-serif; font-weight: 900; font-size: 1.3rem;
            color: var(--text); letter-spacing: -0.02em;
            margin: 0; line-height: 1.2;
          ">${step.title}</h3>
        </div>

        <!-- Contenedor del gif con aspect ratio responsivo -->
        <div style="
          width: 100%; border-radius: 14px; overflow: hidden;
          border: 1px solid rgba(115,213,226,0.15);
          background: rgba(30,49,53,0.6);
          margin-bottom: 1.25rem;
          max-height: 42vh;
          display: flex; align-items: center; justify-content: center;
        ">
          <img
            src="${gifSrc}"
            alt="${step.title}"
            style="
              width: 100%; height: 100%;
              object-fit: contain; display: block;
              max-height: 42vh;
            "
            onerror="this.parentElement.innerHTML='<div style=padding:2rem;color:var(--text-muted);font-family:Nunito,sans-serif;font-size:0.85rem;font-weight:600>GIF proximamente</div>'"
          />
        </div>

        <!-- Descripcion del paso -->
        <p style="
          font-family: Nunito, sans-serif; font-weight: 500; font-size: 0.92rem;
          color: var(--text-muted); line-height: 1.65;
          margin: 0; padding: 0 0.25rem;
        ">${step.description}</p>
      </div>
    `;

    // Actualizar puntos indicadores
    renderDots(index);

    // Actualizar boton de navegacion segun paso actual
    const nextBtn = overlay.querySelector('#tutorial-next');
    const prevBtn = overlay.querySelector('#tutorial-prev');

    nextBtn.textContent = index === TUTORIAL_STEPS.length - 1 ? 'Empezar' : 'Siguiente';
    prevBtn.style.visibility = index === 0 ? 'hidden' : 'visible';
  };

  // Renderizar los puntos de progreso
  const renderDots = (activeIndex) => {
    const dotsContainer = overlay.querySelector('#tutorial-dots');
    dotsContainer.innerHTML = TUTORIAL_STEPS.map((_, i) => `
      <div style="
        width: ${i === activeIndex ? '20px' : '7px'};
        height: 7px; border-radius: 99px;
        background: ${i === activeIndex ? 'var(--accent)' : 'rgba(115,213,226,0.25)'};
        transition: width 0.3s ease, background 0.3s ease;
      "></div>
    `).join('');
  };

  // Navegacion entre pasos
  overlay.querySelector('#tutorial-next').addEventListener('click', () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      currentStep++;
      renderStep(currentStep, 'next');
    } else {
      finish();
    }
  });

  overlay.querySelector('#tutorial-prev').addEventListener('click', () => {
    if (currentStep > 0) {
      currentStep--;
      renderStep(currentStep, 'prev');
    }
  });

  // Soporte para navegacion con swipe en tactil
  let touchStartX = 0;
  overlay.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });

  overlay.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 50) return; // Ignorar swipes cortos
    if (diff > 0 && currentStep < TUTORIAL_STEPS.length - 1) {
      // Swipe a la izquierda: avanzar
      currentStep++;
      renderStep(currentStep, 'next');
    } else if (diff < 0 && currentStep > 0) {
      // Swipe a la derecha: retroceder
      currentStep--;
      renderStep(currentStep, 'prev');
    }
  }, { passive: true });

  // Renderizar el primer paso
  renderStep(0, 'next');
}


// ============================================================
// Funciones de consulta para uso externo
// ============================================================

// Retorna true si el tutorial del dashboard ya fue visto
function hasTutorialBeenSeen() {
  return !!localStorage.getItem(STORAGE_KEY_TUTORIAL);
}

// Permite resetear el onboarding (util para pruebas o desde ajustes)
function resetOnboarding() {
  localStorage.removeItem(STORAGE_KEY_WELCOME);
  localStorage.removeItem(STORAGE_KEY_TUTORIAL);
}