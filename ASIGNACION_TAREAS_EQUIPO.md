# 📋 Plan de Trabajo y Delegación por Módulos
## Proyecto Integrador: Soltapp Mobile 📱🛒

**Asignaturas:** Desarrollo de Aplicaciones Móviles & Testing de Sistemas  
**Stack Tecnológico:** React Native (Expo SDK 57), Expo Router, TypeScript, Supabase Cloud & AsyncStorage  
**Repositorio GitHub:** [https://github.com/Luz99lopez/soltapp-mobile](https://github.com/Luz99lopez/soltapp-mobile)  
**Cantidad de Integrantes:** 7 personas  
**Referencia de Diseño:** Catálogo de 18 Pantallas Oficiales de Figma  

---

## 1. Visión General de la Arquitectura

Para sincronizar la arquitectura definida por el equipo con las **18 pantallas diseñadas en Figma** y cumplir con la totalidad de los **Requisitos Mínimos exigidos por la Cátedra**, el proyecto se organiza en **7 módulos funcionales independientes**. 

Esta división permite que cada uno de los 7 integrantes trabaje sobre una o dos pantallas específicas en su propia rama (`feature/...`) **sin generar conflictos de código (merge conflicts) y sin bloquearse entre sí**.

---

## 2. Cuadro Resumen de Asignación de Tareas

| Módulo / Arquitectura | Responsable | Pantallas de Figma Involucradas | Requisito de Cátedra Cubierto | Entregable Técnico Concreto |
| :--- | :--- | :--- | :--- | :--- |
| **1. Usuarios y Sesión (ABM)** | **Integrante 1** | `1-Pantalla de carga`, `2-Login`, `3-Register`, `Perfil`, `Tú` | Autenticación de usuarios con persistencia | Modificación de perfil (M) en Supabase y sesión inteligente en Splash. |
| **2. Comunicación y Favoritos** | **Integrante 2** | `8-Chat`, `Buzón`, `Tú` (estrellas) y Tab Favoritos | Persistencia en base de datos + Redes | Pestaña de Favoritos conectada a Supabase y reputación con estrellas. |
| **3. Productos (Detalle y ABM)** | **Integrante 3** | `4-Home` y `6-Detalle del producto` | Catálogo / 6+ pantallas | Navegación Feed ➔ Detalle, edición/baja para el vendedor y botones de acción. |
| **4. Hardware (Cámara y GPS)** | **Integrante 4** | `7-Publicación de producto` (Fotos y Ubicación) | Hardware: Cámara + Sensor GPS | Integración de cámara nativa (`expo-image-picker`) y mapa de retiro (`expo-location`). |
| **5. Compra Presencial (QR y GPS)** | **Integrante 5** | `9-Carrito x u.` y `10-compra x u. presencial` | E-Commerce + Hardware QR + GPS | Pantalla de Checkout y Pantalla de Encuentro con Mapa interactivo y Código QR. |
| **6. Compra con Envío (Barcode)** | **Integrante 6** | `11-Envio unidad - comprador` | E-Commerce / Logística | Pantalla de seguimiento de pedido (*Pago ➔ Camino ➔ Entrega*) y Barcode. |
| **7. Testing & Calidad (QA)** | **Integrante 7** | Todas las pantallas (Validaciones) | Materia: Testing de Sistemas | Validaciones con Zod, tests unitarios en Jest y Matriz formal de Pruebas. |

---

## 3. Detalle Módulo por Módulo (Fichas de Trabajo)

---

### 👤 Módulo 1: Usuarios y Sesión (ABM)
* **Responsable:** Integrante 1
* **Pantallas de Figma:** `1-Pantalla de carga.png`, `2-Login.png`, `3-Register.png`, `Perfil.png` y `Tú.png`.
* **Estado actual:** El Alta (A) de usuarios ya está desarrollada con Supabase Auth.
* **Tareas a realizar:**
  1. **Modificación de Usuario (M):** Permitir que el usuario edite y guarde en Supabase su nombre, apellido, teléfono y ubicación desde la pantalla de `Perfil.png`.
  2. **Persistencia Inteligente:** En `LoadingSplashScreen.tsx`, verificar si existe una sesión activa (`supabase.auth.getSession()`). Si ya inició sesión antes, redirigir directo a `/home`; si no hay sesión, mostrar `/login`.
  3. **Cierre de Sesión:** Asegurar que el botón "Cerrar sesión" en el menú `Tú.png` limpie la sesión de Supabase de manera limpia.
* **Rama Git sugerida:** `feature/modulo-usuarios-sesion`

---

### 👤 Módulo 2: Comunicación, Buzón y Favoritos
* **Responsable:** Integrante 2
* **Pantallas de Figma:** `8-Chat.png`, `Buzón.png`, menú `Tú.png` (reputación) y Pestaña Favoritos.
* **Estado actual:** La sala de chat y la bandeja de mensajes tienen base visual en código.
* **Tareas a realizar:**
  1. **Pestaña de Favoritos:** Conectar el icono del corazón para que guarde en la tabla `favorites` de Supabase y liste los artículos guardados del usuario en la pestaña Favoritos de la barra inferior.
  2. **Reputación y Estrellas:** Mostrar el promedio de valoración en estrellas del vendedor en la cabecera del chat y en el perfil (ej. ★ 4.8).
  3. **Buzón:** Sincronizar el badge de mensajes no leídos en la barra inferior.
* **Rama Git sugerida:** `feature/modulo-chat-favoritos`

---

### 👤 Módulo 3: Productos - Detalle y Gestión (ABM)
* **Responsable:** Integrante 3
* **Pantallas de Figma:** `4-Home.png` y `6-Detalle del producto.png`.
* **Estado actual:** Maquetación base iniciada en `ProductDetailScreen.tsx`.
* **Tareas a realizar:**
  1. **Conexión Feed ➔ Detalle:** Al presionar cualquier tarjeta del Home, abrir la pantalla de detalle enviando el ID del producto.
  2. **Ficha Completa de Figma:** Mostrar la foto grande, título, precio formateado ($150.000), acordeones de información (Color, Estado, Marca) y opiniones de compradores.
  3. **Baja y Modificación (BM):** Si el usuario que visualiza el producto es el dueño/vendedor, mostrar botones para *Editar precio/descripción* o *Eliminar publicación*.
  4. **Botones de Acción:** El botón *"Hacer oferta"* abre el Chat; el botón *"Comprar"* redirige a la Pantalla 9 (Checkout).
* **Rama Git sugerida:** `feature/modulo-detalle-producto`

---

### 👤 Módulo 4: Hardware - Cámara Física y Sensor GPS
* **Responsable:** Integrante 4
* **Pantalla de Figma:** `7-Publicación de producto.png`.
* **Estado actual:** Formulario con subida de imágenes base (`expo-image-picker`).
* **Tareas a realizar:**
  1. **Cámara Física (Hardware 1):** Configurar el botón "Subir fotos" para que permita elegir entre *Tomar foto con la cámara física* o *Elegir de la galería*, solicitando los permisos nativos correspondientes.
  2. **Sensor GPS (Hardware 2):** En la sección *"Tus productos se verán en: Marca la localización"*, utilizar `expo-location` para capturar la latitud y longitud actual del celular y renderizar el componente de Mapa con el pin centrado en la zona.
* **Rama Git sugerida:** `feature/modulo-hardware-camara-gps`

---

### 👤 Módulo 5: Compra y Venta Presencial (Checkout + QR + Mapa)
* **Responsable:** Integrante 5
* **Pantallas de Figma:** `9-Carrito x u. - comprador.png` y `10-compra x u. presencial - comprador.png`.
* **Estado actual:** Pendiente de desarrollo.
* **Tareas a realizar:**
  1. **Pantalla 9 (Checkout / Carrito):** Maquetar la pantalla de compras con selector de método de entrega (*Entrega en persona / Envío a domicilio*) y método de pago (*Pago seguro / Efectivo*), subtotal, total y botón *"Confirmar trato en persona"*.
  2. **Pantalla 10 (Encuentro Presencial):** Maquetar la pantalla con:
     - Componente de **Mapa con el punto de encuentro acordado** (requisito GPS de cátedra).
     - **Código QR interactivo** y código de entrega textual (`P-9482`).
     - Botón de confirmación: *"Marcar como recibido"*.
* **Rama Git sugerida:** `feature/modulo-compra-presencial-qr`

---

### 👤 Módulo 6: Compra y Venta con Envío (Seguimiento y Barcode)
* **Responsable:** Integrante 6
* **Pantalla de Figma:** `11-Envio unidad - comprador.png`.
* **Estado actual:** Pendiente de desarrollo.
* **Tareas a realizar:**
  1. **Pantalla 11 (Seguimiento de Envío):** Maquetar la pantalla que se abre cuando el comprador elige la opción de envío:
     - Mensaje de confirmación: *"¡Pago seguro confirmado! El vendedor tiene 24h-48h para aceptar y enviar"*.
     - Barra de seguimiento de 3 estados visuales: `Pago Confirmado` ➔ `En camino` ➔ `Entregado`.
     - Ficha de localizador con código de barras / identificador (`SP-9482`).
     - Dirección de entrega y botón de acceso directo al Chat con el vendedor.
* **Rama Git sugerida:** `feature/modulo-envio-seguimiento`

---

### 👤 Módulo 7: Testing & Calidad (Materia Testing de Sistemas)
* **Responsable:** Integrante 7
* **Pantallas involucradas:** Transversal a toda la aplicación.
* **Estado actual:** Pendiente de desarrollo.
* **Tareas a realizar:**
  1. **Validaciones con Zod:** Crear esquemas de validación estricta para el alta de productos y compra (validar campos requeridos, precios no negativos, formatos de email).
  2. **Testing Automatizado con Jest:** Configurar Jest y React Native Testing Library; escribir suites de pruebas unitarias para validaciones y servicios.
  3. **Matriz de Casos de Prueba (QA):** Redactar la planilla formal de pruebas funcionales requerida para la entrega académica (ID de prueba, Precondición, Pasos, Resultado Esperado y Resultado Obtenido).
* **Rama Git sugerida:** `test/modulo-testing-validaciones`

---

## 4. Guía de Trabajo en Git

1. **Cada integrante trabaja en su rama asignada:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/nombre-de-su-modulo
   ```
2. **Prueba su pantalla en desarrollo:**
   ```bash
   npx expo start
   ```
3. **Sube sus cambios a GitHub y abre el Pull Request (PR):**
   ```bash
   git add .
   git commit -m "feat(modulo): descripcion de la pantalla implementada"
   git push origin feature/nombre-de-su-modulo
   ```
4. **Merge a `main`:** Una vez revisado el Pull Request en GitHub, se incorpora a la rama principal.
