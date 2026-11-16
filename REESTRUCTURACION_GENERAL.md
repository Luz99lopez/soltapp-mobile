# 🏛️ Documento General de Reestructuración y Estado del Proyecto
## Proyecto Integrador: Soltapp Mobile 📱🛒

**Asignaturas:** Desarrollo de Aplicaciones Móviles & Testing de Sistemas  
**Stack Tecnológico:** React Native (Expo SDK 57), Expo Router, TypeScript, Supabase Cloud (Auth, Database, Storage) & AsyncStorage  
**Repositorio GitHub:** [https://github.com/Luz99lopez/soltapp-mobile](https://github.com/Luz99lopez/soltapp-mobile)  
**Cantidad de Integrantes:** 7 personas  
**Estado:** Reestructurado y sincronizado con los últimos avances de la rama `main`.

---

## 1. Contexto y Diagnóstico del Proyecto

Al inicio del proyecto, una sola persona asumió gran parte del desarrollo inicial directamente sobre la rama `main`. Esto generó avances importantes, pero dejó al resto del equipo sin visibilidad sobre qué hacer, con temor a generar conflictos en el código y sin commits individuales necesarios para la evaluación académica.

### 📊 ¿Qué está construido actualmente en `main`?
Tras la última sincronización en el repositorio, la app ya cuenta con:
1. **Autenticación (Supabase Auth):** Registro, Login y Logout con persistencia de sesión.
2. **Feed Principal (Home):** Categorías con SVG oficiales, carrusel, buscador y feed conectado a Supabase (`fetchHomeProducts`).
3. **Buzón y Chat:** Bandeja de mensajes (`InboxView`) y sala de chat (`ChatScreen`).
4. **Perfil ("Tú"):** Vista de cuenta y edición de datos del usuario (`ProfileScreen`).
5. **Módulo de Subida Inicial (`UploadProductView.tsx`):** Formulario para publicar artículos con fotos (`expo-image-picker`) y persistencia en base de datos.
6. **Módulo de Detalle Inicial (`ProductDetailScreen.tsx`):** Ficha para ver la información del producto.

---

## 2. Los Requisitos Obligatorios de la Cátedra (Checklist Académico)

Para promocionar y aprobar ambas materias, la entrega final debe cumplir con esta matriz técnica:

| Requisito de Consigna | Estado en el Proyecto | Integrante Asignado |
| :--- | :--- | :--- |
| **Mínimo 6 Pantallas Funcionales** | ✅ Cumplido (Home, Login, Register, Chat, Perfil, Detalle, Subir, Mapa) | Todo el equipo |
| **Autenticación con Persistencia** | 🟡 En funcionamiento; falta pulir sesión en Splash y Auth Guards | **Integrante 1** |
| **Detalle de Producto y Venta** | 🟡 Pantalla base creada; falta pulir navegación y enlace desde Feed | **Integrante 2** |
| **Hardware 1: Cámara y Galería** | ✅ `expo-image-picker` y subida a Supabase Storage integrados | **Integrante 3** (Revisión y soporte) |
| **Hardware 2: GPS y Geolocalización** | 🔴 **Pendiente 100%:** `expo-location`, cálculo de km y mapa con pines | **Integrante 4** |
| **Publicación de Artículos (Alta)** | 🟡 Formulario base creado; falta validación y vincular GPS | **Integrante 5** |
| **Persistencia en Base de Datos & Favoritos** | 🟡 BD conectada; falta la pestaña de Favoritos en la nube | **Integrante 6** |
| **Testing Automatizado & Matriz QA** | 🔴 **Pendiente 100%:** Jest, validaciones con Zod y matriz formal | **Integrante 7** |

---

## 3. División de Tareas para los 7 Integrantes

Para que nadie se pise y todos tengan Pull Requests y commits registrados a su nombre, el trabajo se distribuye en módulos desacoplados:

### 👤 Integrante 1: Scrum Master & Auth Guards / Splash Inteligente
* **Objetivo:** Asegurar que si el usuario ya inició sesión, la pantalla de Splash (`LoadingSplashScreen.tsx`) lo dirija directo a `/home` sin pedir usuario y contraseña cada vez. Proteger las rutas privadas en `app/_layout.tsx`.
* **Rama asignada:** `feature/auth-guards-splash`

### 👤 Integrante 2: Detalle de Producto & Navegación Fluida
* **Objetivo:** Conectar el Feed principal para que al tocar cualquier producto se abra la pantalla de detalle (`ProductDetailScreen.tsx`). Pulir el botón de "Chatear con el vendedor" para que abra la sala de chat pasando los datos del vendedor real.
* **Rama asignada:** `feature/detalle-producto-navegacion`

### 👤 Integrante 3: Módulo de Hardware - Cámara y Optimización Multimedia
* **Objetivo:** Verificar la captura con cámara física y galería en dispositivos móviles, manejo de errores de permisos y compresión de imágenes antes de subirlas al bucket de Supabase.
* **Rama asignada:** `feature/hardware-camara-multimedia`

### 👤 Integrante 4: Módulo de Hardware - Sensor GPS y Pantalla de Mapa
* **Objetivo:** Cumplir el segundo requisito obligatorio de hardware: instalar `expo-location`, capturar las coordenadas GPS del dispositivo, crear la función matemática de distancia en km (`geoUtils.ts`) y maquetar la pantalla de Mapa con pines (`MapScreen.tsx`).
* **Rama asignada:** `feature/hardware-gps-mapa`

### 👤 Integrante 5: Pulido del Formulario de Publicación y Categorías
* **Objetivo:** Asegurar que el formulario de publicación (`UploadProductView.tsx`) soporte todas las categorías de Soltapp, vincule la ubicación obtenida por el GPS y ofrezca feedback visual de éxito al publicar.
* **Rama asignada:** `feature/pulido-formulario-publicacion`

### 👤 Integrante 6: Módulo Pestaña de Favoritos & Persistencia Cloud
* **Objetivo:** Implementar la pantalla de **Favoritos** en la barra inferior (`FavoritesScreen.tsx`). Conectar la tabla `favorites` en Supabase para que los productos marcados con el corazón persistan en la nube para cada usuario.
* **Rama asignada:** `feature/pantalla-favoritos-supabase`

### 👤 Integrante 7: QA & Testing Lead (Testing de Sistemas & Zod)
* **Objetivo:** Cumplir todos los requisitos de la materia **Testing de Sistemas**: configurar Jest, programar esquemas de validación estricta con Zod (`productSchema.ts`), escribir tests unitarios y redactar el documento académico `docs/MATRIZ_DE_CASOS_DE_PRUEBA.md`.
* **Rama asignada:** `test/config-jest-validaciones-zod`

---

## 4. Política de Trabajo en Git

1. **La rama `main` queda protegida:** Nadie sube código directamente a `main`.
2. **Cada integrante trabaja en su propia rama (`feature/...`).**
3. **Integración mediante Pull Requests (PR):** Cada aporte se revisa en GitHub antes de ser fusionado a `main`.
4. Para consultar el instructivo paso a paso de comandos de Git y los prompts de ayuda para Antigravity, consultar el archivo: **`GUIA_PASO_A_PASO_INTEGRANTES.md`**.

Login y persistencia de usuarios (A)BM con bdd - Pantalla de carga , Login , register ,BDD.
Chat y reputación - Chat, Buzon, Favoritos y Estrellas x usuario.
Productos (A)BM - Detalle de producto , publicación del producto | GPS y cámara.
Compra y ventas x unidad presencial | QR y GPS.
Compra y ventas x envio  | BARCODE.
Otros - Home , Menú , Barra de busqueda(filtros de busqueda) y otros.