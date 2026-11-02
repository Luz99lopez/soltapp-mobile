# Soltapp estable en Windows

Actualización del cierre de chat: [contrato SQL único, instrucciones del administrador y verificaciones finales](COORDINACION_INTEGRANTE_2_CHAT.md#entrega-final-y-resultados-locales). El chat añade clasificación de errores, estado sin conexión y pausa del canal al salir, conservando este sistema de arranque y el puerto 8081. Los resultados numéricos de la etapa inicial de este documento se conservan como registro histórico.

Trabajar en `feature/modulo-detalle-producto` desde este proyecto. No se modificaron versiones/dependencias, configuración compartida de Supabase, ni se hicieron commits/push/merge.

1. Ejecutar **INICIAR_SOLTAPP_ESTABLE.cmd**. Compila el export web de producción antes de abrir el navegador. La primera compilación puede tardar; los errores quedan visibles en la ventana.
2. Abrir `http://localhost:8081/login` y usar Google. Se mantiene el origen/puerto y `/auth/callback` actuales. El usuario informó que Google ya funciona; las verificaciones automatizadas del agente usan OAuth interceptado.
3. Navegar normalmente. No hay Metro escuchando en este puerto: los archivos JS ya están compilados. Las consultas a Supabase siguen necesitando conexión y tienen sus propios indicadores/errores.
4. Ejecutar **DETENER_SOLTAPP_ESTABLE.cmd** para detener ese servidor. Para aplicar cambios de código, detener y volver a iniciar. Un segundo inicio mientras está activo reutiliza el proceso y el build actuales.

Si 8081 está ocupado por un servidor no administrado por estos archivos, el inicio lo informa y **no lo cierra**. Detenerlo desde su terminal. No se mata por nombre `node.exe`, por puerto, ni se cierran árboles de procesos ajenos. El controlador usa un mutex del proyecto, PID, ruta absoluta del script, fecha de creación y estado de salud/instancia. Un estado viejo no autoriza a cerrar un PID reutilizado.

Los archivos de estado y logs están en `.soltapp-stable/` (ignorados por Git): `server.json`, `server.log`, `server-error.log`. No contienen tokens OAuth ni se registran URLs de solicitudes. No borran la sesión, el carrito o datos del navegador.

El servidor resuelve páginas estáticas, páginas dinámicas existentes del export como `/order/[id]`, recursos JS/CSS/imágenes/fuentes y `/auth/callback`; normaliza la barra final y conserva query/fragmento según las redirecciones del navegador. Un recurso inexistente devuelve 404, no un HTML presentado como JavaScript. No se cambia el origen de OAuth ni se transfieren sesiones entre puertos.

Si falla la descarga de JS o no se inicializa la aplicación, aparece “No pudimos cargar Soltapp”, con recarga y acceso al login. La protección no oculta los errores de las consultas: los muestran las pantallas del módulo. Los errores React conservan el ErrorBoundary de Expo Router.

## Verificación reproducible

Con el servidor estable iniciado, Chrome y Playwright ya disponibles en el entorno:

```powershell
npx tsc --noEmit
node --test scripts/verify-auth.cjs scripts/verify-chat.cjs scripts/verify-products.cjs
npx expo export --platform web
$env:SOLTAPP_TEST_URL = 'http://localhost:8081'
node scripts/verify-stable-web.cjs
node scripts/verify-auth-web.cjs
node scripts/verify-chat-web.cjs
node scripts/measure-products-web.cjs --url http://localhost:8081 --label stable-navigation --verify --production
```

La exportación manual reemplaza `dist`: preferir detener el servidor antes de reconstruir para no pedir archivos durante ese reemplazo. Todos los scripts de navegador interceptan la red externa; sus sesiones/datos son simulados y no escriben en el Supabase compartido. Las mediciones no representan un celular físico ni la latencia real de la base.

El chat, contrato SQL propuesto y matriz de pruebas reales están en [COORDINACION_INTEGRANTE_2_CHAT.md](COORDINACION_INTEGRANTE_2_CHAT.md). Sigue pendiente aplicar/revisar el backend y probar dos cuentas/dispositivos reales, RLS y Realtime con autorización.

## Resultados comprobados de esta integración

- `npx tsc --noEmit`: pasó.
- Pruebas unitarias Auth/Chat/Productos: **42 pasaron**.
- `npx expo export --platform web`: pasó. También se comprobó la exportación desde el archivo de inicio. Advertencia previa: falta el favicon configurado; no bloquea el export.
- Servidor/Chrome: **4 casos pasaron** (rutas y recursos, formulario, fragmento ficticio del callback, recuperación tras bloquear JS).
- OAuth interceptado: **5 casos pasaron**, incluido Mis productos y recuperación de Auth bloqueado. Google real: funcionamiento informado por el usuario, sin uso de sus credenciales por el agente.
- Chat con backend en memoria: **9 casos pasaron**, incluido Buzón, desconexión visible, historial, 60 mensajes acumulados, reintento idempotente, cambio de sesión y backend ausente. Ningún mensaje se escribió en Supabase.
- Navegación Home → Detalle → Comprar, Mis productos → Detalle → Editar, Chat y regreso: pasó, incluyendo errores visibles y borrador conservado al renovar sesión. **Cero solicitudes de `.bundle` de Metro, cero errores JavaScript y cero escrituras**. El Buzón se comprobó con el caso de chat anterior.
- Archivos Windows ejecutados realmente: inicio, segundo inicio reutilizando el mismo PID, detención, segunda detención sin efectos y nuevo inicio. Con el Metro previo ocupando 8081, el inicio rechazó la colisión y dejó su proceso intacto. Después se detuvo únicamente ese Metro de este proyecto, identificado por ruta y argumentos, para pasar al servidor administrado. La inspección final mostró un solo servidor Soltapp en 8081 y logs del servidor sin errores.

Muestra de navegación de producción en Chrome headless, ventana 390 × 844, datos interceptados con 200 ms artificiales por consulta. No son mediciones de red real ni un promedio estadístico:

| Pantalla | Primera apertura medida | Reapertura medida |
| --- | ---: | ---: |
| Home | 406 ms | 45 ms |
| Detalle | 621 ms | 311 ms |
| Mis productos | 784 ms | 33 ms |
| Editar | 606 ms | 297 ms |
| Comprar / carrito existente | 619 ms | 314 ms |
| Chat (navegación) | 382 ms | 85 ms |

Los scripts guardan reportes temporales en `node_modules/.cache/soltapp-auth-chat/` y `node_modules/.cache/soltapp-performance/stable-navigation.json`. Se corrigieron dos esperas de las pruebas: el borrador de TextInput no cuenta como mensaje guardado y un error de una pantalla oculta no cuenta como error visible de la pantalla actual.

## Archivos de esta etapa

Los cambios locales anteriores de Productos/Auth/Chat se conservaron; este listado identifica lo agregado o ajustado en esta integración.

| Grupo | Archivos |
| --- | --- |
| Inicio y detención | `INICIAR_SOLTAPP_ESTABLE.cmd`, `DETENER_SOLTAPP_ESTABLE.cmd`, `scripts/soltapp-estable.ps1` |
| Servidor de producción local | `scripts/serve-web-local.cjs`, `.gitignore` |
| Recuperación de carga web | `public/soltapp-load-guard.js`, `app/+html.tsx`, `app/_layout.tsx` |
| Chat: espera, reconexión y accesibilidad | `src/utils/chatRequest.ts`, `src/services/chatService.ts`, `src/hooks/useChatThread.ts`, `src/components/ChatInboxList.tsx`, `src/screens/ChatScreen.tsx` |
| Verificación | `scripts/verify-stable-web.cjs`, `scripts/verify-chat.cjs`, `scripts/verify-chat-web.cjs`, `scripts/measure-products-web.cjs` |
| Documentación | `SOLTAPP_ESTABLE.md`, `COORDINACION_INTEGRANTE_2_CHAT.md`, `LOGIN_Y_CHAT.md`, `README.md` |

Se revisó y conserva la propuesta previa `supabase/proposals/20261030_chat_persistence.sql`, **sin ejecutarla**. No se cambiaron `package.json`, lockfile, `app.json`, `metro.config.js` ni `src/supabase.ts`. No se usaron credenciales administrativas, ni se hicieron commit/push/merge.
