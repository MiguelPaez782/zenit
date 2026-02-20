// ============================================================
// firebase-config.js
// Configuracion e inicializacion de Firebase
// El usuario debe reemplazar los valores con los de su proyecto
// ============================================================

const firebaseConfig = {
  apiKey:            "TU_API_KEY",
  authDomain:        "TU_PROJECT_ID.firebaseapp.com",
  projectId:         "TU_PROJECT_ID",
  storageBucket:     "TU_PROJECT_ID.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId:             "TU_APP_ID"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Instancias globales de los servicios
const auth = firebase.auth();
const db   = firebase.firestore();

// Configuracion de seguridad de Firestore: persistencia offline desactivada
// para evitar datos sensibles en cache del navegador
db.settings({ experimentalForceLongPolling: false });