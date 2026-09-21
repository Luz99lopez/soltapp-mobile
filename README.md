# Soltapp Mobile 📱🛒

**Soltapp Mobile** es una aplicación móvil de compra y venta de productos de segunda mano y nuevos con enfoque en cercanía y comercio local (marketplace estilo Wallapop / Mercado Libre). Desarrollada con **React Native**, **Expo SDK 57**, **Expo Router** y backend en **Supabase**.

---

## 🚀 Características Principales

- **Autenticación y Sesiones:**
  - Inicio de sesión con correo y contraseña.
  - Registro de usuarios con validaciones de formulario.
  - Integración con Supabase Auth y persistencia de sesión multiplataforma (móvil y web).
- **Pantalla de Inicio (Feed Principal):**
  - Barra de búsqueda superior tipo píldora.
  - Carrusel horizontal interactivo de categorías con iconos vectoriales SVG oficiales (Autos, Motos, Motor, Moda, Inmobiliaria, etc.).
  - Modal desplegable ("Ver todo") con catálogo completo de categorías.
  - Listado de productos cercanos y recién publicados con precios, ubicación y botón de favoritos.
- **Bandeja de Entrada (Buzón):**
  - Accesible directamente desde la barra de navegación inferior.
  - Selector tipo píldora entre **Mensajes (con contador de no leídos)** y **Notificaciones**.
  - Tarjetas de conversación con miniatura, remitente, fecha y nombre del producto.
- **Servicio de Chat:**
  - Conversación en tiempo real con el vendedor.
  - Encabezado con miniatura del producto, precio y título.
  - Ficha del vendedor con foto de perfil, reputación en estrellas (`★ 4,8`) y tiempo de respuesta promedio.
  - Burbujas de chat personalizadas: color turquesa `#B4F4EB` para los mensajes enviados, con hora y doble tilde de lectura (`✓✓`).
  - Botón de acción `Chatea` y barra de escritura interactiva con simulación de respuesta automática.
  - Persistencia de mensajes en almacenamiento local (`AsyncStorage`).
- **Perfil de Usuario ("Tú"):**
  - Vista resumen con foto/avatar, valoración y antigüedad en la plataforma.
  - Accesos directos a catálogo de productos publicados, compras, ventas, billetera y ajustes.
  - Pantalla completa de edición de perfil (nombre, apellido, ubicación/código postal) y datos de cuenta.

---

## 🛠️ Tecnologías y Librerías

- **Framework:** [React Native](https://reactnative.dev/) (`0.86.3`)
- **Plataforma:** [Expo](https://expo.dev/) (`~57.0.24`)
- **Navegación:** [Expo Router](https://docs.expo.dev/router/introduction/) (`~57.0.22`) con rutas basadas en archivos
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/) (`~6.0.3`)
- **Backend / Base de datos:** [Supabase](https://supabase.com/) (`@supabase/supabase-js ^2.116.0`)
- **Gráficos e Iconografía:** `react-native-svg` (`15.15.4`) y `react-native-svg-transformer` para importar archivos `.svg` como componentes React nativos.
- **Iconos Complementarios:** `@expo/vector-icons` (Ionicons, Feather)
- **Almacenamiento Local:** `@react-native-async-storage/async-storage`

---

## 📁 Estructura del Proyecto

```text
soltapp-mobile/
├── app/                        # Rutas y navegación de Expo Router
│   ├── _layout.tsx             # Stack de navegación global
│   ├── index.tsx               # Punto de entrada / Splash inicial
│   ├── home.tsx                # Ruta de la pantalla principal
│   ├── login.tsx               # Ruta de inicio de sesión
│   ├── register.tsx            # Ruta de registro
│   ├── profile.tsx             # Ruta de perfil completo
│   ├── chat.tsx                # Ruta del servicio de chat
│   └── modal.tsx               # Modal secundario
├── assets/
│   ├── fonts/                  # Fuentes tipográficas
│   ├── images/                 # Imágenes estáticas
│   └── svgs/                   # Iconos vectoriales oficiales de Soltapp
├── components/                 # Componentes genéricos de UI
├── constants/                  # Constantes y paleta de colores
├── src/
│   ├── components/             # Componentes modulares de la app
│   │   ├── CategoriesMenuModal.tsx # Modal deslizable de categorías
│   │   └── InboxView.tsx           # Bandeja de entrada (Buzón)
│   ├── screens/                # Pantallas principales
│   │   ├── HomeScreen.tsx          # Feed, Menú Tú y navegación tab
│   │   ├── LoadingSplashScreen.tsx # Pantalla animada de carga
│   │   ├── LoginScreen.tsx         # Pantalla de inicio de sesión
│   │   ├── RegisterScreen.tsx      # Pantalla de registro de usuario
│   │   ├── ProfileScreen.tsx       # Pantalla de perfil y ajustes
│   │   └── ChatScreen.tsx          # Pantalla de conversación de chat
│   └── supabase.ts             # Cliente y configuración de Supabase
├── app.json                    # Configuración de Expo
├── metro.config.js             # Configuración de empaquetador Metro y SVG transformer
├── package.json                # Dependencias y scripts
├── tsconfig.json               # Configuración de TypeScript
├── MANUAL_DE_USUARIO.md        # Manual de usuario final
└── README.md                   # Esta documentación
```

---

## ⚙️ Instalación y Puesta en Marcha

### Prerrequisitos
- [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
- Gestor de paquetes `npm`
- Aplicación móvil **Expo Go** en tu dispositivo físico (iOS o Android) o un emulador/simulador configurado.

### 1. Clonar o abrir el proyecto
Abre una terminal en la raíz del proyecto:
```bash
cd "C:\Users\ayala\OneDrive\Escritorio\soltapp-mobile"
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Copia el archivo de ejemplo y coloca tus credenciales:
```bash
copy .env.example .env
```
Edita `.env` con las variables de Supabase:
```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### 4. Iniciar el servidor de desarrollo
```bash
# Iniciar Metro Bundler
npm start

# O iniciar directamente para una plataforma específica:
npm run android   # Emulador Android
npm run ios       # Simulador iOS
npm run web       # Versión web en navegador
```

Escanea el código QR que aparece en la terminal con la cámara (iOS) o la app Expo Go (Android) para abrir la app.

---

## 📖 Manual de Usuario

Para conocer en detalle cómo navegar y operar cada funcionalidad de la aplicación (búsqueda, publicaciones, favoritos, bandeja de entrada, chat y gestión de perfil), consulta el **[Manual de Usuario](MANUAL_DE_USUARIO.md)**.

---

## 👥 Equipo y Licencia
Desarrollado para el ecosistema **Soltapp**.  
Distribuido bajo licencia MIT (ver archivo [LICENSE](LICENSE)).
