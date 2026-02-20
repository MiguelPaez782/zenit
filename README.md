# Zenit — Gestor de Metas Personales

Zenit es una aplicacion web SPA (Single Page Application) que permite a los usuarios crear, gestionar y dar seguimiento a sus metas personales. Construida con HTML, Tailwind CSS y JavaScript Vanilla, con Firebase como backend de autenticacion y base de datos.

---

## Indice

1. [Estructura del proyecto](#estructura-del-proyecto)
2. [Configuracion de Firebase](#configuracion-de-firebase)
3. [Reglas de seguridad de Firestore](#reglas-de-seguridad-de-firestore)
4. [Configurar la autenticacion](#configurar-la-autenticacion)
5. [Agregar la configuracion al proyecto](#agregar-la-configuracion-al-proyecto)
6. [Despliegue en GitHub Pages](#despliegue-en-github-pages)
7. [Configurar dominio autorizado en Firebase](#configurar-dominio-autorizado-en-firebase)
8. [Descripcion de archivos](#descripcion-de-archivos)
9. [Variables y constantes a personalizar](#variables-y-constantes-a-personalizar)
10. [Seguridad implementada](#seguridad-implementada)

---

## Estructura del proyecto

```
zenit/
├── index.html              Punto de entrada de la SPA
├── css/
│   └── styles.css          Estilos globales, animaciones y componentes CSS
├── js/
│   ├── firebase-config.js  Inicializacion de Firebase (editar con tu config)
│   ├── components.js       Componentes reutilizables de UI
│   ├── auth.js             Logica de autenticacion y pantallas de Auth
│   ├── goals.js            CRUD de metas y pantallas principales
│   ├── router.js           Enrutador del lado del cliente
│   └── app.js              Punto de entrada, observador de autenticacion
└── README.md
```

---

## Configuracion de Firebase

Sigue estos pasos en orden. No te saltes ninguno.

### Paso 1: Crear el proyecto en Firebase Console

1. Ve a [https://console.firebase.google.com](https://console.firebase.google.com)
2. Haz clic en **Agregar proyecto** (o el boton con el simbolo +).
3. Escribe el nombre del proyecto: `zenit` (o el que prefieras).
4. Desactiva Google Analytics si no lo necesitas y haz clic en **Crear proyecto**.
5. Espera a que se cree el proyecto y haz clic en **Continuar**.

### Paso 2: Registrar la aplicacion web

1. En la pantalla de inicio del proyecto, haz clic en el icono de web (`</>`).
2. En **Apodo de la app** escribe: `Zenit Web`.
3. Activa la casilla **Tambien configura Firebase Hosting** solo si planeas usar Firebase Hosting en lugar de GitHub Pages. Si vas a usar GitHub Pages, deja la casilla sin marcar.
4. Haz clic en **Registrar app**.
5. Firebase te mostrara un bloque de codigo con la configuracion. **No cierres esta pantalla todavia**, la necesitaras en el Paso 5.

### Paso 3: Crear la base de datos Firestore

1. En el menu lateral izquierdo de Firebase Console, busca **Firestore Database** y haz clic en el.
2. Haz clic en **Crear base de datos**.
3. Selecciona **Comenzar en modo de produccion** (no en modo de prueba, para mayor seguridad).
4. Elige la region mas cercana a tus usuarios. Para Colombia se recomienda `us-east1` o `us-central1`.
5. Haz clic en **Habilitar** y espera a que se cree la base de datos.

### Paso 4: Aplicar las reglas de seguridad de Firestore

Una vez creada la base de datos:

1. En la pestana de Firestore, haz clic en la pestana **Reglas**.
2. Reemplaza todo el contenido con las reglas descritas en la seccion [Reglas de seguridad de Firestore](#reglas-de-seguridad-de-firestore) de este documento.
3. Haz clic en **Publicar**.

### Paso 5: Configurar la Autenticacion

1. En el menu lateral izquierdo, haz clic en **Authentication**.
2. Haz clic en **Comenzar**.
3. En la pestana **Metodo de inicio de sesion**, busca **Correo electronico/Contrasena** y haz clic en el.
4. Activa el primer interruptor (**Correo electronico/Contrasena**) y haz clic en **Guardar**.
5. El segundo interruptor (Vinculo de correo electronico / inicio de sesion sin contrasena) dejalo desactivado.

### Paso 6: Configurar la plantilla del correo de recuperacion

1. Dentro de Authentication, ve a la pestana **Templates**.
2. Selecciona **Password reset**.
3. Haz clic en el icono de editar (lapiz).
4. Personaliza el nombre del remitente y el asunto si lo deseas.
5. El campo **Action URL** debe apuntar a tu dominio de GitHub Pages con el parametro correcto. Firebase lo configura automaticamente, pero verificalo:

   Para GitHub Pages el formato sera:
   ```
   https://tu-usuario.github.io/zenit?mode=%LINK_TYPE%&oobCode=%OOB_CODE%
   ```
   Firebase generalmente maneja esto con su propio dominio de accion. Si recibes el correo y el link te lleva a la pantalla de reset, todo esta correcto.

---

## Reglas de seguridad de Firestore

Copia y pega estas reglas en la pestana **Reglas** de Firestore. Garantizan que cada usuario solo pueda leer y escribir sus propios datos.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Coleccion de usuarios: solo el propio usuario puede leer y escribir su documento
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Sub-coleccion de metas: solo el dueno puede acceder
      match /goals/{goalId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // Denegar acceso a cualquier otra ruta no definida
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Agregar la configuracion al proyecto

1. Vuelve a la pantalla de Firebase Console donde te mostro la configuracion de la app (Paso 2, punto 5).
   Si la cerraste, puedes encontrarla en: **Configuracion del proyecto** (icono de engranaje) > **General** > desplazate hacia abajo hasta **Tus apps**.

2. Copia los valores del objeto `firebaseConfig`. Tendran este aspecto:
   ```javascript
   const firebaseConfig = {
     apiKey:            "AIzaSy...",
     authDomain:        "tu-proyecto.firebaseapp.com",
     projectId:         "tu-proyecto",
     storageBucket:     "tu-proyecto.appspot.com",
     messagingSenderId: "123456789",
     appId:             "1:123456789:web:abc123"
   };
   ```

3. Abre el archivo `js/firebase-config.js` del proyecto.
4. Reemplaza los valores de ejemplo con los tuyos.
5. Guarda el archivo.

---

## Despliegue en GitHub Pages

### Paso 1: Crear el repositorio en GitHub

1. Ve a [https://github.com](https://github.com) y crea un nuevo repositorio.
2. Nombra el repositorio `zenit` (o el nombre que elijas).
3. Marca el repositorio como **Publico** (GitHub Pages es gratuito solo para repositorios publicos en cuentas gratuitas).
4. No inicialices con README ni .gitignore, ya que subiras los archivos directamente.

### Paso 2: Subir el proyecto

Desde tu terminal, en la carpeta del proyecto:

```bash
git init
git add .
git commit -m "primer commit: zenit app"
git branch -M main
git remote add origin https://github.com/tu-usuario/zenit.git
git push -u origin main
```

### Paso 3: Activar GitHub Pages

1. En tu repositorio de GitHub, ve a **Settings** > **Pages**.
2. En **Source**, selecciona la rama `main` y la carpeta `/ (root)`.
3. Haz clic en **Save**.
4. En unos minutos, tu app estara disponible en:
   ```
   https://tu-usuario.github.io/zenit/
   ```

---

## Configurar dominio autorizado en Firebase

Para que Firebase Auth funcione correctamente en GitHub Pages, debes agregar tu dominio a la lista de dominios autorizados:

1. En Firebase Console, ve a **Authentication** > **Settings** > **Authorized domains**.
2. Haz clic en **Add domain**.
3. Agrega: `tu-usuario.github.io`
4. Haz clic en **Add**.

Sin este paso, los inicios de sesion desde GitHub Pages seran rechazados por Firebase.

---

## Descripcion de archivos

| Archivo | Descripcion |
|---|---|
| `index.html` | Estructura base de la SPA. Carga Tailwind, las fuentes, los iconos, Firebase SDK y los modulos JS. |
| `css/styles.css` | Variables CSS, animaciones, estilos de componentes (tarjetas, modales, botones, toasts, etc.). |
| `js/firebase-config.js` | Inicializa Firebase con la configuracion del proyecto. Unico archivo que el usuario debe editar con sus credenciales. |
| `js/components.js` | Funciones de fabrica para componentes de UI: campos, botones, modales, topbar, toasts, empty state, progress summary. |
| `js/auth.js` | Pantallas de login, registro y recuperacion de contrasena. Funciones de validacion y manejo de errores de Firebase Auth. |
| `js/goals.js` | Pantallas de la app principal (lista de metas), ajustes y ayuda. CRUD completo de metas con Firestore. Logica de tarjetas expandibles con animaciones. |
| `js/router.js` | Enrutador simple que gestiona la navegacion entre pantallas sin recargar la pagina. Verifica parametros de la URL para acciones de Firebase (reset de contrasena). |
| `js/app.js` | Punto de entrada. Inicializa la app, verifica parametros de URL y observa el estado de autenticacion de Firebase para redirigir al usuario a la pantalla correspondiente. |

---

## Variables y constantes a personalizar

Dentro del proyecto, busca y reemplaza los siguientes valores de ejemplo antes de publicar:

| Ubicacion | Valor a reemplazar | Descripcion |
|---|---|---|
| `js/firebase-config.js` | Todos los valores del objeto `firebaseConfig` | Credenciales de tu proyecto Firebase |
| `js/goals.js` linea de contacto | `desarrollador@correo.com` | Tu correo electronico de contacto |
| `js/goals.js` linea de contacto | `github.com/tu-usuario/zenit` | URL de tu repositorio en GitHub |
| `js/goals.js` linea de contacto | `https://wa.me/573000000000` y `+57 300 000 0000` | Tu numero de WhatsApp |

---

## Seguridad implementada

La aplicacion implementa las siguientes medidas de seguridad:

**Autenticacion y acceso**
- Autenticacion manejada completamente por Firebase Auth, que cumple con estandares de la industria (OAuth 2.0, tokens JWT).
- Las contrasenas nunca se almacenan en la base de datos ni en el codigo; Firebase las maneja con hashing seguro (bcrypt).
- La reautenticacion es obligatoria antes de cambiar el correo o la contrasena en Ajustes.

**Validacion**
- Validacion del lado del cliente antes de enviar datos a Firebase (formato de correo, fortaleza de la contrasena, longitud de campos).
- La contrasena debe tener minimo 8 caracteres, una mayuscula, un numero y un caracter especial.
- Los campos de texto se sanitizan para prevenir inyeccion XSS al insertarlos en el DOM.

**Base de datos**
- Las reglas de Firestore garantizan que cada usuario solo puede leer y escribir su propia informacion y sus propias metas.
- Ninguna ruta de Firestore es publica; todas requieren autenticacion valida.
- La estructura de la base de datos separa los datos de usuario de las metas mediante sub-colecciones, facilitando la granularidad de permisos.

**Buenas practicas adicionales**
- No se usa `eval()` ni `innerHTML` con datos del usuario sin sanitizar.
- Los enlaces externos usan `rel="noopener noreferrer"` para evitar ataques de tipo reverse tabnapping.
- El campo de fecha limite del formulario tiene un minimo establecido en la fecha actual para evitar fechas pasadas.