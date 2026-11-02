# 🚀 Guía Paso a Paso para Integrantes
## Soltapp Mobile: De Clonar el Repo a tu Pull Request con Antigravity

Esta guía está diseñada para que **cualquier integrante del equipo**, sin importar su nivel de experiencia previa en Git o React Native, pueda:
1. Configurar el proyecto en su computadora local.
2. Crear su propia rama de trabajo segura.
3. Utilizar **Antigravity** como tutor asistente para que le programe y le explique su tarea paso a paso sin estar a ciegas.
4. Subir sus cambios a GitHub y abrir su Pull Request (PR) para obtener su nota individual.

---

## 🧭 PARTE 1: Cómo Iniciar el Proyecto en tu Computadora (Desde Cero)

Sigue estos pasos en tu terminal (PowerShell, CMD o Git Bash) la primera vez que configures el proyecto:

### 1. Clonar el repositorio oficial
Abre tu terminal en la carpeta donde guardas tus proyectos (por ejemplo, tu Escritorio o Documentos) y escribe:
```bash
git clone https://github.com/Luz99lopez/soltapp-mobile.git
cd soltapp-mobile
```

### 2. Instalar las dependencias
Para descargar Expo y todas las librerías necesarias:
```bash
npm install
```
*(Esto creará la carpeta `node_modules` en tu computadora con todo lo necesario).*

### 3. Configurar las variables de entorno
Crea el archivo `.env` copiando el de ejemplo:
* En Windows:
  ```bash
  copy .env.example .env
  ```
* En Mac/Linux:
  ```bash
  cp .env.example .env
  ```

---

## 🌿 PARTE 2: El Flujo Diario de Git (Regla de Oro: Tu Propia Branch)

> [!IMPORTANT]
> **NUNCA programes sobre la rama `main`.** Trabaja siempre en tu rama personal (`feature/...`) para no romper el código de tus compañeros.

### Paso 1: Asegurarte de tener lo último de `main`
Antes de crear tu rama o cada vez que comiences tu día de trabajo:
```bash
git checkout main
git pull origin main
```

### Paso 2: Crear tu propia rama de trabajo
Crea tu rama usando el nombre que te corresponde (ver tabla en Parte 4):
```bash
# Ejemplo: si vas a hacer el módulo de GPS y Mapas:
git checkout -b feature/hardware-gps-mapa
```
> *(El comando `-b` crea la rama y te cambia a ella. Ahora estás en tu propio espacio seguro).*

### Paso 3: Probar la app en desarrollo
Para ver la aplicación corriendo en tu celular (con la app **Expo Go**) o en tu navegador:
```bash
npx expo start
```
Escanea el código QR que aparece en pantalla con tu celular.

### Paso 4: Guardar tus avances y subirlos a GitHub
Cuando hayas terminado tu tarea o quieras guardar lo que hiciste en la nube:
```bash
git add .
git commit -m "feat(modulo): descripcion breve de lo que hiciste"
git push origin feature/tu-nombre-de-rama
```
*(Reemplaza `feature/tu-nombre-de-rama` por el nombre exacto de la rama que creaste).*

### Paso 5: Abrir el Pull Request (PR) en GitHub
1. Abre tu navegador y ve a: [https://github.com/Luz99lopez/soltapp-mobile](https://github.com/Luz99lopez/soltapp-mobile).
2. Verás un cartel amarillo arriba con un botón verde que dice: **"Compare & pull request"**.
3. Haz clic allí.
4. Escribe un título y descripción de lo que hiciste (ej: *"Agregué la pantalla de mapas con pines"*).
5. Haz clic en el botón verde **"Create pull request"**.
6. ¡Listo! Tu aporte ya queda registrado a tu nombre para que el Scrum Master lo revise y se fusione a `main`.

---

## 🤖 PARTE 3: Cómo Usar Antigravity para que te Guíe Paso a Paso

Si no sabes por dónde arrancar a programar o no entiendes bien el código de React Native, **Antigravity será tu profesor particular**:

1. Abre el editor **Antigravity**.
2. Ve a **Archivo > Abrir carpeta...** (*File > Open Folder...*) y selecciona la carpeta del proyecto `soltapp-mobile`.
3. Abre el panel de chat con Antigravity.
4. **Copia y pega el prompt que te corresponde de la lista de abajo.**
5. Antigravity te responderá explicando qué archivos va a crear, qué hace cada función y cómo probarlo en tu celular.

---

## 📋 PARTE 4: Fichas y Prompts Listos para Cada Integrante

Copia el bloque de texto correspondiente a tu rol y pégalo directamente en tu chat con Antigravity:

---

### 👤 Integrante 1: Rutas Protegidas (Auth Guards) y Splash Inteligente
* **Rama Git:** `feature/auth-guards-splash`
* **Archivos a intervenir:** `src/screens/LoadingSplashScreen.tsx` y `app/_layout.tsx`.
* **Prompt para copiar y pegar en Antigravity:**
```text
Hola Antigravity. Estoy trabajando en el proyecto Soltapp Mobile (React Native con Expo SDK 57, Expo Router y Supabase).
Mi rol asignado es: Integrante 1 - Rutas Protegidas y Splash Inteligente.

Actualmente, la pantalla de carga (src/screens/LoadingSplashScreen.tsx) tiene un temporizador fijo que siempre redirige a '/login', incluso si el usuario ya inició sesión previamente. Además, necesitamos proteger las rutas de la app en app/_layout.tsx para que un usuario no autenticado no pueda acceder a pantallas privadas.

Por favor, ayúdame con lo siguiente paso a paso:
1. Explícame de forma sencilla cómo funciona la sesión persistente en Supabase y cómo podemos consultarla en LoadingSplashScreen.
2. Modifica LoadingSplashScreen.tsx para que consulte supabase.auth.getSession(). Si ya hay una sesión activa, debe navegar directamente a '/home'; si no hay sesión, recién ahí debe redirigir a '/login'.
3. Configura un Auth Guard básico en app/_layout.tsx que escuche el estado de autenticación y maneje las redirecciones seguras.
4. Explícame cada línea de código que modifiques para que yo entienda perfectamente cómo funciona y pueda explicarlo al docente.
```

---

### 👤 Integrante 2: Detalle de Producto & Navegación Fluida
* **Rama Git:** `feature/detalle-producto-navegacion`
* **Archivos a intervenir:** `src/screens/HomeScreen.tsx` y `src/screens/ProductDetailScreen.tsx`.
* **Prompt para copiar y pegar en Antigravity:**
```text
Hola Antigravity. Estoy trabajando en el proyecto Soltapp Mobile (React Native con Expo Router y Supabase).
Mi rol asignado es: Integrante 2 - Detalle de Producto y Conexión de Navegación.

Ya existe un componente base en src/screens/ProductDetailScreen.tsx, pero necesitamos que la navegación sea 100% fluida:
1. En src/screens/HomeScreen.tsx, cuando el usuario toca una tarjeta de producto en el Feed (tanto en 'Cerca de donde estás' como en 'Publicaciones recientes'), debe abrir la pantalla de detalle pasando el ID del producto.
2. En ProductDetailScreen.tsx, asegúrate de que se muestre la información completa del producto (foto grande, título, precio formateado, ubicación, descripción y datos del vendedor).
3. Asegúrate de que el botón 'Chatear con el vendedor' en la pantalla de detalle navegue a la ruta '/chat' enviando los parámetros correspondientes (nombre del producto, precio y nombre del vendedor).

Por favor, guíame paso a paso, muéstrame los cambios necesarios y explícame cómo se pasan los parámetros entre pantallas en Expo Router para que yo entienda todo el flujo.
```

---

### 👤 Integrante 3: Hardware - Cámara Física y Multimedia
* **Rama Git:** `feature/hardware-camara-multimedia`
* **Archivos a intervenir:** `src/components/UploadProductView.tsx` y `src/services/storageService.ts`.
* **Prompt para copiar y pegar en Antigravity:**
```text
Hola Antigravity. Estoy trabajando en el proyecto Soltapp Mobile (React Native Expo SDK 57 con expo-image-picker y Supabase Storage).
Mi rol asignado es: Integrante 3 - Módulo de Hardware: Cámara y Multimedia.

La materia exige acceso al sensor físico de la cámara y manejo de permisos nativos.
Por favor ayúdame a:
1. Verificar que expo-image-picker esté correctamente configurado para solicitar permisos de cámara y de galería al usuario (requestCameraPermissionsAsync y requestMediaLibraryPermissionsAsync).
2. Revisar src/components/UploadProductView.tsx para asegurar que el usuario tenga un botón claro para 'Tomar foto con la cámara' y otro para 'Elegir de la galería'.
3. Explicarme cómo funciona la subida de imágenes binarias hacia Supabase Storage en src/services/storageService.ts.
4. Explícame el código con comentarios claros para que entienda cómo Expo gestiona los permisos nativos de hardware en Android e iOS.
```

---

### 👤 Integrante 4: Hardware - Sensor GPS y Pantalla de Mapa
* **Rama Git:** `feature/hardware-gps-mapa`
* **Archivos a crear/intervenir:** `src/utils/geoUtils.ts` y `src/screens/MapScreen.tsx`.
* **Prompt para copiar y pegar en Antigravity:**
```text
Hola Antigravity. Estoy trabajando en el proyecto Soltapp Mobile (React Native Expo SDK 57).
Mi rol asignado es: Integrante 4 - Módulo de Hardware: Geolocalización (GPS) y Pantalla de Mapas.

Este es un requisito obligatorio de hardware exigido por la cátedra de Aplicaciones Móviles.
Por favor, ayúdame paso a paso a:
1. Instalar y configurar 'expo-location' para solicitar permisos de GPS al usuario y capturar la latitud y longitud actual del dispositivo móvil.
2. Crear un archivo de utilidades 'src/utils/geoUtils.ts' que incluya:
   - Una función para obtener la ubicación actual del usuario.
   - Una función matemática (fórmula de Haversine) para calcular la distancia en kilómetros entre las coordenadas del usuario y las coordenadas de un producto publicado.
3. Crear una pantalla o modal interactivo 'src/screens/MapScreen.tsx' que muestre un mapa con marcadores (pines) ubicando los productos cercanos.
4. Explicarme detalladamente cómo funciona la fórmula de distancia y cómo Expo interactúa con el sensor GPS para poder defenderlo ante el profesor.
```

---

### 👤 Integrante 5: Formulario de Publicación y Categorías
* **Rama Git:** `feature/pulido-formulario-publicacion`
* **Archivos a intervenir:** `src/components/UploadProductView.tsx` y `app/upload.tsx`.
* **Prompt para copiar y pegar en Antigravity:**
```text
Hola Antigravity. Estoy trabajando en el proyecto Soltapp Mobile (React Native Expo con Supabase).
Mi rol asignado es: Integrante 5 - Formulario de Publicación de Productos y Categorías.

Existe un componente base en src/components/UploadProductView.tsx que se abre desde el botón '+' de la barra de navegación.
Por favor, ayúdame a:
1. Revisar y pulir el formulario para que incluya todas las categorías oficiales de Soltapp (Autos, Motos, Motor, Moda, Inmobiliaria, Tecnología, Hogar, etc.).
2. Asegurar que los campos de título, precio, descripción y estado tengan controles limpios y validaciones visuales para que el usuario no envíe datos incompletos.
3. Garantizar que al presionar 'Publicar artículo', se muestre un indicador de carga (spinner), se guarde correctamente en Supabase y al finalizar regrese al Feed mostrando un mensaje de éxito.
4. Explícame el ciclo de vida del formulario y el manejo del estado (useState) en este componente.
```

---

### 👤 Integrante 6: Pestaña de Favoritos y Persistencia en Supabase
* **Rama Git:** `feature/pantalla-favoritos-supabase`
* **Archivos a intervenir:** `src/screens/HomeScreen.tsx`, `src/services/productService.ts` y nueva pantalla de Favoritos.
* **Prompt para copiar y pegar en Antigravity:**
```text
Hola Antigravity. Estoy trabajando en el proyecto Soltapp Mobile (React Native con Supabase).
Mi rol asignado es: Integrante 6 - Módulo de Favoritos y Persistencia en la Nube.

Actualmente, al tocar el corazón en las tarjetas del Feed cambia localmente, pero al presionar la pestaña 'Favoritos' en la barra inferior no se visualiza ninguna lista de productos guardados.
Por favor, ayúdame paso a paso a:
1. Diseñar la tabla o estructura de favoritos en Supabase (asociando user_id y product_id).
2. Agregar las funciones en src/services/productService.ts: 'toggleFavorite(productId)' y 'fetchUserFavorites()'.
3. Crear la vista o pantalla de Favoritos (src/screens/FavoritesScreen.tsx o integrada en el tab 'favorites' de HomeScreen) que muestre la grilla de productos que el usuario guardó, con opción de eliminarlos o ir a ver su detalle.
4. Explícame cómo se sincroniza el estado de favoritos entre la base de datos de Supabase y la interfaz de usuario.
```

---

### 👤 Integrante 7: QA & Testing Lead (Testing de Sistemas & Zod)
* **Rama Git:** `test/config-jest-validaciones-zod`
* **Archivos a crear:** `src/validations/productSchema.ts`, `__tests__/...` y `docs/MATRIZ_DE_CASOS_DE_PRUEBA.md`.
* **Prompt para copiar y pegar en Antigravity:**
```text
Hola Antigravity. Estoy trabajando en el proyecto Soltapp Mobile (React Native con TypeScript).
Mi rol asignado es: Integrante 7 - QA & Testing Lead para la asignatura Testing de Sistemas.

Debo cumplir con los requerimientos académicos de pruebas automatizadas y documentación de calidad.
Por favor, ayúdame paso a paso a:
1. Instalar y configurar 'zod' para crear esquemas de validación estricta (src/validations/productSchema.ts) que validen: título no vacío, precio numérico positivo, categoría válida y descripción adecuada.
2. Configurar el framework de pruebas Jest en el proyecto.
3. Escribir suites de pruebas unitarias en la carpeta '__tests__/':
   - Pruebas para los esquemas de validación Zod (casos válidos, casos límite y errores esperados).
   - Pruebas unitarias para funciones de cálculo de distancia o utilidades.
4. Crear el documento académico 'docs/MATRIZ_DE_CASOS_DE_PRUEBA.md' con una tabla formal de casos de prueba funcionales (ID, Caso de Prueba, Precondición, Pasos, Resultado Esperado, Resultado Obtenido y Estado).
5. Explícame cómo ejecutar 'npm test' y cómo interpretar los resultados de cobertura para presentarlo ante el profesor de Testing.
```
