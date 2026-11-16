# 📋 Plan de Trabajo, Delegación de Tareas y Arquitectura
## Proyecto Integrador: Soltapp Mobile 📱🛒

**Asignaturas:** Desarrollo de Aplicaciones Móviles & Testing de Sistemas  
**Stack Tecnológico:** React Native (Expo SDK 57), Expo Router, TypeScript, Supabase Cloud (Auth, Database, Storage) & AsyncStorage  
**Repositorio Oficial en GitHub:** [https://github.com/Luz99lopez/soltapp-mobile](https://github.com/Luz99lopez/soltapp-mobile)  
**Cantidad de Integrantes:** 7 personas  
**Referencia de Diseño:** Catálogo de 18 Pantallas Oficiales de Figma  

---

## 1. Visión General y Cumplimiento de la Cátedra

El proyecto cuenta con bases sólidas implementadas en el repositorio. Para garantizar que **todos los integrantes participen de manera equitativa**, tengan **commits individuales para su evaluación académica** y no se generen bloqueos ni conflictos en Git, el trabajo se organiza en **7 módulos desacoplados**.

Esta distribución cubre el 100% de los **Requisitos Mínimos exigidos por el docente**:

| Requisito de la Cátedra | Módulo Asignado | Cobertura en la App |
| :--- | :--- | :--- |
| **Al menos 6 pantallas diferentes** | Todos los integrantes | La app cuenta con **18 pantallas diseñadas en Figma** y más de 8 pantallas funcionales en código. |
| **Autenticación de usuarios** | **Integrante 1** | Flujo completo de Login, Registro, Logout y sesión persistente en Supabase Auth. |
| **Persistencia de datos en base de datos** | **Integrantes 1, 2 y 3** | Tablas de `users`, `products` y `favorites` en Supabase Cloud. |
| **Uso de la CÁMARA del dispositivo (Hardware)** | **Integrante 4** | Captura de fotos en vivo con la cámara física (`expo-image-picker`) y subida a Supabase Storage. |
| **Uso del GPS o geolocalización (Hardware)** | **Integrantes 4 y 5** | Sensor GPS (`expo-location`), cálculo de distancias en km y mapas interactivos con pines. |
| **Módulo de E-Commerce (Catálogo, Checkout, Pagos)** | **Integrantes 3, 5 y 6** | Ficha de producto, Checkout con métodos de entrega y pago, compra presencial con QR y seguimiento de envío. |
| **Hardware opcional / Valor agregado (QR / Barcode)** | **Integrantes 5 y 6** | Generador de código QR para entrega presencial y localizador con código de seguimiento. |
| **Testing Automatizado & Matriz de Calidad** | **Integrante 7** | Configuración de Jest, validaciones con Zod y matriz formal de casos de prueba para Testing de Sistemas. |

---

## 2. Las 18 Pantallas Oficiales de Figma

El diseño completo de la aplicación se estructura en las siguientes 18 pantallas:

1. **`1-Pantalla de carga`**: Splash animado con isotipo oficial.
2. **`2-Login`**: Inicio de sesión con correo, contraseña y accesos sociales.
3. **`3-Register`**: Formulario de registro con validaciones.
4. **`4-Home`**: Feed principal con carrusel de categorías SVG, buscador y productos.
5. **`5-Menú`**: Modal desplegable con el catálogo completo de categorías.
6. **`6-Detalle del producto`**: Ficha completa del artículo, fotos, valoraciones y botones de acción.
7. **`7-Publicación de producto`**: Formulario de alta con fotos, categorías, opciones de peso y mapa de ubicación.
8. **`8-Chat`**: Sala de conversación en tiempo real con el vendedor.
9. **`9-Carrito x u. - comprador`**: Pantalla de Checkout con selección de método de entrega y pago.
10. **`10-compra x u. presencial`**: Confirmación presencial con Mapa de punto de encuentro y Código QR.
11. **`11-Envio unidad - comprador`**: Seguimiento de envío (*Pago confirmado ➔ En camino ➔ Entregado*) y localizador.
12. **`12-Carrito x lote`**: Variante de checkout para compras múltiples.
13. **`13-Compra x lote`**: Confirmación de compra por lote.
14. **`14-Envio x lote`**: Gestión de envíos por lote para el vendedor.
15. **`15-Compra x lote presencial`**: Punto de encuentro para operaciones en lote.
16. **`Buzón`**: Bandeja de entrada con pestañas de Mensajes y Notificaciones.
17. **`Perfil`**: Edición de datos personales (nombre, apellido y localidad).
18. **`Tú`**: Menú lateral de usuario con reputación, estrellas y accesos directos.

---

## 3. Cuadro Resumen de Asignación (1 Módulo = 1 Integrante)

| Módulo / Arquitectura | Responsable | Pantallas de Figma Involucradas | Requisito de Cátedra | Entregable Técnico Concreto |
| :--- | :--- | :--- | :--- | :--- |
| **1. Usuarios y Sesión (ABM)** | **Integrante 1** | `1-Pantalla de carga`, `2-Login`, `3-Register`, `Perfil`, `Tú` | Autenticación con persistencia | Edición de perfil (M) en Supabase y sesión inteligente en Splash. |
| **2. Comunicación y Favoritos** | **Integrante 2** | `8-Chat`, `Buzón`, `Tú` (estrellas) y Tab Favoritos | Persistencia en base de datos | Pestaña de Favoritos conectada a Supabase y reputación con estrellas. |
| **3. Productos (Detalle y ABM)** | **Integrante 3** | `4-Home` y `6-Detalle del producto` | Catálogo / 6+ pantallas | Navegación Feed ➔ Detalle, edición/baja para vendedor y botones de acción. |
| **4. Hardware (Cámara y GPS)** | **Integrante 4** | `7-Publicación de producto` (Fotos y Ubicación) | Hardware: Cámara + Sensor GPS | Cámara nativa (`expo-image-picker`) y mapa de retiro (`expo-location`). |
| **5. Compra Presencial (QR y GPS)** | **Integrante 5** | `9-Carrito x u.` y `10-compra x u. presencial` | E-Commerce + Hardware QR + GPS | Checkout y Punto de Encuentro con Mapa interactivo y Código QR. |
| **6. Compra con Envío (Barcode)** | **Integrante 6** | `11-Envio unidad - comprador` | E-Commerce / Logística | Pantalla de seguimiento (*Pago ➔ Camino ➔ Entrega*) y código de localizador. |
| **7. Testing & Calidad (QA)** | **Integrante 7** | Transversal a toda la app | Materia: Testing de Sistemas | Validaciones con Zod, tests unitarios en Jest y Matriz formal de Pruebas. |

---

## 4. Fichas Detalladas por Integrante

---

### 👤 Integrante 1: Módulo Usuarios y Sesión (ABM)
* **Pantallas de Figma:** `1-Pantalla de carga.png`, `2-Login.png`, `3-Register.png`, `Perfil.png` y `Tú.png`.
* **Estado actual:** El Alta (A) de usuarios se encuentra conectada a Supabase Auth.
* **Tareas a realizar:**
  1. **Modificación de Usuario (M):** Permitir que el usuario edite y guarde sus datos personales (nombre, apellido, ubicación) en Supabase desde `ProfileScreen.tsx`.
  2. **Persistencia Inteligente en Splash:** Modificar `LoadingSplashScreen.tsx` para que consulte `supabase.auth.getSession()`. Si ya existe una sesión guardada, navegar directo a `/home`; si no hay sesión, recién ahí redirigir a `/login`.
  3. **Cierre de Sesión Limpio:** Verificar que la opción "Cerrar sesión" en el menú `Tú.png` limpie la sesión en Supabase y devuelva al usuario al login.
* **Rama Git sugerida:** `feature/modulo-usuarios-sesion`

---

### 👤 Integrante 2: Módulo Comunicación, Buzón y Favoritos
* **Pantallas de Figma:** `8-Chat.png`, `Buzón.png`, menú `Tú.png` (reputación) y Pestaña Favoritos.
* **Estado actual:** El chat y la bandeja de entrada cuentan con maquetación base.
* **Tareas a realizar:**
  1. **Pestaña de Favoritos:** Conectar el botón del corazón con la tabla `favorites` de Supabase para que los productos guardados persistan en la nube y se muestren en la pestaña Favoritos de la barra inferior.
  2. **Reputación y Estrellas:** Visualizar la valoración en estrellas del vendedor en la cabecera del chat y en la ficha de usuario (ej. ★ 4.8).
  3. **Buzón:** Mantener sincronizada la cantidad de mensajes no leídos en el badge rojo del footer.
* **Rama Git sugerida:** `feature/modulo-chat-favoritos`

---

### 👤 Integrante 3: Módulo Productos - Detalle y Gestión (ABM)
* **Pantallas de Figma:** `4-Home.png` y `6-Detalle del producto.png`.
* **Estado actual:** Ficha base creada en `ProductDetailScreen.tsx`.
* **Tareas a realizar:**
  1. **Conexión Feed ➔ Detalle:** Asegurar que al presionar cualquier tarjeta del Home se abra la pantalla de detalle enviando el ID del producto correspondiente.
  2. **Ficha Completa de Figma:** Mostrar la foto principal en grande, título, precio formateado ($150.000), acordeones de información (Color, Estado, Marca) y opiniones de compradores.
  3. **Baja y Modificación (BM):** Si el usuario logueado es el dueño de la publicación, habilitar opciones para *Editar* o *Eliminar* el producto.
  4. **Botones de Acción:** El botón *"Hacer oferta"* abre el chat con ese artículo; el botón *"Comprar"* redirige a la Pantalla 9 (Checkout).
* **Rama Git sugerida:** `feature/modulo-detalle-producto`

---

### 👤 Integrante 4: Módulo Hardware - Cámara Física y Sensor GPS
* **Pantalla de Figma:** `7-Publicación de producto.png`.
* **Estado actual:** Formulario con selector de imágenes básico.
* **Tareas a realizar:**
  1. **Cámara Física (Hardware 1):** Hacer que el botón "Subir fotos" permita abrir la **cámara física del celular** o la galería usando `expo-image-picker`, gestionando los permisos nativos correspondientes.
  2. **Sensor GPS (Hardware 2):** En la sección *"Tus productos se verán en: Marca la localización"*, utilizar `expo-location` para capturar la latitud y longitud actual del dispositivo y renderizar el componente de Mapa con el pin centrado.
* **Rama Git sugerida:** `feature/modulo-hardware-camara-gps`

---

### 👤 Integrante 5: Módulo Compra Presencial (Checkout + QR + Mapa)
* **Pantallas de Figma:** `9-Carrito x u. - comprador.png` y `10-compra x u. presencial - comprador.png`.
* **Estado actual:** Pendiente de desarrollo.
* **Tareas a realizar:**
  1. **Pantalla 9 (Checkout):** Maquetar la vista de compra con selector de entrega (*Entrega en persona / Envío*), método de pago (*Pago seguro / Efectivo*), cálculo de total y botón *"Confirmar trato en persona"*.
  2. **Pantalla 10 (Encuentro Presencial):** Maquetar la vista con:
     - Componente de **Mapa con el punto de encuentro acordado** (requisito GPS de cátedra).
     - **Código QR interactivo** y código de entrega textual (`P-9482`).
     - Botón de confirmación: *"Marcar como recibido"*.
* **Rama Git sugerida:** `feature/modulo-compra-presencial-qr`

---

### 👤 Integrante 6: Módulo Compra con Envío (Seguimiento y Barcode)
* **Pantalla de Figma:** `11-Envio unidad - comprador.png`.
* **Estado actual:** Pendiente de desarrollo.
* **Tareas a realizar:**
  1. **Pantalla 11 (Seguimiento de Envío):** Maquetar la vista de pedido en camino con:
     - Mensaje de confirmación: *"¡Pago seguro confirmado! El vendedor tiene 24h-48h para aceptar y enviar"*.
     - Barra de seguimiento de 3 estados: `Pago Confirmado` ➔ `En camino` ➔ `Entregado`.
     - Ficha de localizador con código de seguimiento (`SP-9482`).
     - Dirección de entrega y botón de acceso directo al Chat.
* **Rama Git sugerida:** `feature/modulo-envio-seguimiento`

---

### 👤 Integrante 7: Módulo QA & Testing de Sistemas
* **Pantallas involucradas:** Transversal a toda la aplicación.
* **Estado actual:** Pendiente de desarrollo.
* **Tareas a realizar:**
  1. **Validaciones con Zod:** Crear esquemas de validación estricta para formularios (título no vacío, precio positivo, categorías válidas).
  2. **Testing Automatizado:** Configurar Jest y React Native Testing Library; escribir suites de tests unitarios para validaciones y servicios.
  3. **Matriz de Casos de Prueba (QA):** Redactar la planilla formal de pruebas funcionales para la entrega de Testing de Sistemas (ID, Caso, Precondición, Pasos, Resultado Esperado y Obtenido).
* **Rama Git sugerida:** `test/modulo-testing-validaciones`

---

## 5. Metodología de Trabajo en Git

1. **La rama `main` queda protegida:** Nadie realiza commits directos sobre `main`.
2. **Cada integrante trabaja en su propia rama:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/nombre-de-su-modulo
   ```
3. **Probar la app en local con Expo:**
   ```bash
   npx expo start
   ```
4. **Subir los cambios a GitHub:**
   ```bash
   git add .
   git commit -m "feat(modulo): descripcion de la pantalla implementada"
   git push origin feature/nombre-de-su-modulo
   ```
5. **Crear el Pull Request (PR) en GitHub:**
   - Entrar al repositorio: `https://github.com/Luz99lopez/soltapp-mobile`
   - Presionar **"Compare & pull request"**.
   - Tras la revisión, se fusiona a `main`.

---

## 6. Prompts Asistidos para Trabajar con Antigravity

Cada integrante puede abrir **Antigravity**, abrir la carpeta del proyecto y copiar y pegar su prompt correspondiente para ser guiado paso a paso:

### Prompt Integrante 1 (Usuarios y Sesión):
```text
Hola Antigravity. Soy el Integrante 1 de Soltapp Mobile.
Mi tarea es: Módulo de Usuarios y Sesión (ABM).
Debo:
1. Asegurar que en src/screens/LoadingSplashScreen.tsx se consulte supabase.auth.getSession() para que si ya hay sesión activa vaya directo a /home y no pida login cada vez.
2. Permitir que desde src/screens/ProfileScreen.tsx el usuario pueda editar su nombre, apellido y localidad y guardarlos en Supabase.
3. Verificar que el cierre de sesión funcione correctamente.
Por favor, guíame paso a paso y explícame cada línea de código.
```

### Prompt Integrante 2 (Comunicación y Favoritos):
```text
Hola Antigravity. Soy el Integrante 2 de Soltapp Mobile.
Mi tarea es: Módulo de Comunicación, Buzón y Favoritos.
Debo:
1. Conectar la pestaña de Favoritos en la barra inferior con Supabase (tabla favorites) para listar los artículos guardados del usuario logueado.
2. Mostrar la calificación con estrellas del vendedor en la cabecera del chat.
Por favor, guíame paso a paso con los componentes y servicios necesarios.
```

### Prompt Integrante 3 (Productos - Detalle y Gestión):
```text
Hola Antigravity. Soy el Integrante 3 de Soltapp Mobile.
Mi tarea es: Módulo Productos - Detalle y Gestión (ABM).
Debo:
1. Conectar las tarjetas del Feed de HomeScreen.tsx para que al tocarlas abran la pantalla de detalle (ProductDetailScreen.tsx) con el ID del producto.
2. Pulir la ficha de detalle según el Figma 6-Detalle del producto (foto grande, precio, descripción, vendedor).
3. Conectar el botón 'Hacer oferta' al Chat y el botón 'Comprar' a la pantalla de Checkout.
Por favor, guíame paso a paso en la implementación.
```

### Prompt Integrante 4 (Hardware - Cámara y Sensor GPS):
```text
Hola Antigravity. Soy el Integrante 4 de Soltapp Mobile.
Mi tarea es: Módulo Hardware - Cámara Física y Sensor GPS (Requisitos de cátedra).
Debo:
1. En src/components/UploadProductView.tsx, configurar expo-image-picker para permitir tomar fotos en vivo con la cámara física del celular solicitando permisos nativos.
2. Usar expo-location para capturar la ubicación GPS del celular y renderizar el componente de Mapa con el pin centrado en la zona de retiro.
Por favor, muéstrame cómo implementarlo y explícame el manejo de hardware en Expo.
```

### Prompt Integrante 5 (Compra Presencial - Checkout, QR y Mapa):
```text
Hola Antigravity. Soy el Integrante 5 de Soltapp Mobile.
Mi tarea es: Módulo Compra Presencial (Pantallas 9 y 10 de Figma).
Debo:
1. Crear la pantalla de Checkout (src/screens/CheckoutScreen.tsx) según 9-Carrito x u. con método de entrega y pago.
2. Crear la pantalla de Encuentro Presencial (src/screens/PresencialMeetingScreen.tsx) según 10-compra x u. presencial con Mapa de punto de encuentro, Código QR interactivo y botón de confirmación de entrega.
Por favor, ayúdame a crearlas paso a paso.
```

### Prompt Integrante 6 (Compra con Envío - Seguimiento y Barcode):
```text
Hola Antigravity. Soy el Integrante 6 de Soltapp Mobile.
Mi tarea es: Módulo Compra con Envío (Pantalla 11 de Figma).
Debo:
1. Crear la pantalla de seguimiento de envío (src/screens/ShippingTrackingScreen.tsx) según 11-Envio unidad con la barra de 3 estados (Pago Confirmado -> En camino -> Entregado).
2. Mostrar la dirección de entrega y el código localizador (SP-9482).
Por favor, guíame para maquetarla e integrarla al flujo de compras.
```

### Prompt Integrante 7 (Testing & Calidad QA):
```text
Hola Antigravity. Soy el Integrante 7 de Soltapp Mobile.
Mi tarea es: Módulo QA & Testing de Sistemas.
Debo:
1. Configurar Zod para validar los formularios de alta de producto y compra.
2. Configurar Jest y React Native Testing Library y escribir suites de tests unitarios.
3. Crear el documento docs/MATRIZ_DE_CASOS_DE_PRUEBA.md con la planilla formal de casos de prueba para entregar al profesor.
Por favor, ayúdame a configurar el entorno de pruebas y redactar la matriz.
```
