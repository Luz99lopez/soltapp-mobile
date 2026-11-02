**Estado actual: el usuario informa que Google funciona en localhost:8081; chat preparado, pendiente de base de datos y prueba con dos cuentas reales.**

La verificación automatizada de OAuth del agente sigue siendo con proveedor interceptado. Los relatos de intentos anteriores de esta bitácora son históricos. El arranque actual usa [SOLTAPP_ESTABLE.md](SOLTAPP_ESTABLE.md) y la coordinación pendiente está en [COORDINACION_INTEGRANTE_2_CHAT.md](COORDINACION_INTEGRANTE_2_CHAT.md).

El cierre actual del chat, SQL único final, pasos del administrador y resultados actualizados (45 unitarias, 12 casos de chat en memoria) se encuentran en esa coordinación. Las referencias posteriores de esta bitácora a publicaciones Realtime opcionales/comentadas describen la versión anterior del SQL; el archivo final incorpora la publicación y conserva comentadas únicamente las pruebas de seguridad que requieren autorización.

Rama: `feature/modulo-detalle-producto`. No se hicieron commits, push, cambios de dependencias, configuraciones compartidas ni escrituras de prueba en Supabase.

**Login de producción local**

Se verificó por lectura de `/auth/v1/settings` que Google, Facebook y email están habilitados. La autorización de Google redirige al callback de Supabase `https://mpfcbpvjinwfkkwpffey.supabase.co/auth/v1/callback`. No se accedió a Google con credenciales ni se canjeó un código de una cuenta real en las pruebas.

Problemas del código anterior:

- La utilidad enviaba los despliegues web no locales a un dominio de autenticación distinto. El almacenamiento de sesiones del navegador está separado por origen, incluido el puerto.
- El login social web volvía directamente a Home, mientras existía otro callback con un timeout que navegaba a Home incluso sin sesión.
- Home podía intentar canjear un código que ya procesaba el cliente Supabase.
- El login por contraseña podía bloquear a un usuario válido si una consulta anónima a perfiles no devolvía su fila por RLS.

Cambios:

- Web retorna al mismo `window.location.origin`. Google/Facebook usan `/auth/callback`; móvil conserva `soltapp://home` y el procesamiento existente de `openAuthSessionAsync`.
- El callback espera la inicialización del cliente, requiere una sesión, valida el usuario mediante Auth y muestra errores/cancelación. No navega a Home sin sesión. No se cambió el tipo de flujo global de Supabase ni el manejo de recuperación de contraseña del grupo.
- Auth valida las credenciales por contraseña, sin consultar perfiles públicos antes.
- La pantalla inicial y el login limitan a 15 segundos las esperas de Auth. Si una sesión guardada no responde, se muestra una salida y un botón para restablecer el acceso de este navegador. Esta acción requiere pulsar el botón: elimina solo las claves Auth del proyecto en ese origen, conserva carrito/tratos y no modifica ni revoca sesiones en el servidor. El SDK no redirige por su cuenta después de un timeout al iniciar OAuth web.

Con un perfil nuevo, sin simular Supabase, la pantalla de login cargó en 430 ms y solicitó OAuth con el retorno correcto. Se abortó intencionalmente la navegación antes de contactar al proveedor, sin autenticación real. Esto no reproduce ni resuelve por sí solo el bloqueo reportado en la sesión habitual del usuario.

**Configuración que debe revisar el responsable**

No se pudo leer la lista privada de Redirect URLs con la clave pública. Un 302 hacia Google no prueba que Supabase permita el retorno final a 18762.

En Supabase → Authentication → URL Configuration → Redirect URLs, revisar y autorizar, si faltan:

```text
http://localhost:18762/auth/callback
http://localhost:8081/auth/callback
```

Conservar las URLs anteriores que use el grupo, incluyendo Home, confirmación de email y recuperación de contraseña. Si se utiliza `127.0.0.1`, una IP de red o un dominio, es otro origen y su callback exacto también debe estar autorizado. No es necesario cambiar globalmente Site URL para agregar este retorno local.

El callback registrado del proveedor Google sigue siendo el de Supabase, no la URL frontend anterior. Si Google muestra `redirect_uri_mismatch`, revisar ese callback en Google Cloud con el responsable.

Referencia oficial: [Redirect URLs de Supabase](https://supabase.com/docs/guides/auth/redirect-urls).

El build local corregido se sirve en `http://localhost:18762/login`. Hace falta que el usuario complete Google en Chrome y confirme acceso a Tú → Productos. No se afirma haber completado esa validación con una cuenta real ni haber verificado la allowlist privada.

Evidencia posterior del usuario (31/10): el navegador terminó en el origen `http://10.100.0.105:8081/` con un fragmento de autenticación y `ERR_CONNECTION_TIMED_OUT`. No se copió ni utilizó ese fragmento. El retorno llegó a una dirección inaccesible, mientras `http://localhost:18762/login` respondió 200. El código y la prueba de inicio OAuth solicitan `http://localhost:18762/auth/callback` cuando se inicia en 18762. Si el intento comenzó en ese origen y con la versión actual, el destino diferente es compatible con un fallback a Site URL por una Redirect URL no autorizada; también hay que descartar una pestaña/flujo OAuth iniciado con la versión anterior. No se puede afirmar el contenido de la configuración privada sin revisarla.

Los límites de espera del cliente no corrigen un retorno del proveedor hacia otro servidor. El responsable debe revisar Site URL y la allowlist, conservar los retornos del grupo y añadir el callback exacto de 18762 si falta. Después se debe iniciar un flujo NUEVO desde `http://localhost:18762/login`, sin reutilizar la pestaña de Google del intento anterior.

El usuario confirmó que no tiene acceso a esa configuración. No se considera resuelto el login real. Como alternativa de diagnóstico se sirve el mismo build de producción también en `http://localhost:8081/login`, el puerto que el usuario indicó que funcionaba anteriormente. Esto no agrega ninguna autorización en Supabase ni garantiza que `/auth/callback` esté permitido: la versión anterior solicitaba `/home`. No se usan la IP inaccesible ni fragmentos de sesión de capturas para trasladar credenciales.

Comprobación del servidor alternativo: `/login` y `/auth/callback` respondieron 200. Chrome headless con red externa bloqueada confirmó que el botón Google solicita `http://localhost:8081/auth/callback`. No se completó Google real ni se verificó la allowlist privada. En este paso solo cambió esta documentación y se inició otro servidor local del build existente; no se cambiaron fuentes ni dependencias.

**Corrección posterior del servidor local por el reporte de “Not Found”**

El listener anterior de 8081 era el proceso Node de `expo serve --port 8081` iniciado en este proyecto (PID 39408). La comprobación reprodujo `404 / Not Found` con `/login/`; `/` y `/login` sin barra final respondieron 200. No se reprodujo el mismo 404 en `/login` exacto. El export contiene `login.html` y el middleware estático de Expo no resuelve esa página con barra final.

Se reemplazó únicamente ese listener por `scripts/serve-web-local.cjs`. El script sirve el `dist` de esta carpeta mediante el middleware `send` que ya utiliza Expo, comprueba los archivos de entrada al arrancar y redirige las páginas existentes con barra final a su URL canónica. Conserva la query de OAuth y evita cachear respuestas locales de builds anteriores. Las rutas inexistentes siguen devolviendo 404. No se modificaron rutas de la aplicación, paquetes, configuración de Expo ni Supabase. El servidor de 18762 se conservó.

Arranque desde el proyecto (primero detener el servidor anterior de ese puerto si sigue abierto):

```powershell
npx expo export --platform web
node scripts/serve-web-local.cjs 8081
```

URL para el usuario: `http://localhost:8081/login`. El script informa un puerto ocupado y no detiene procesos automáticamente.

Comprobaciones posteriores al nuevo export:

- HTTP: `/`, `/login` y `/auth/callback` responden 200; `/login/` y `/auth/callback/` responden 307 a sus URLs sin barra final. La query se conserva (probada con un valor ficticio). Una ruta inexistente devuelve 404.
- Chrome headless: formulario y botón Google visibles entrando por `/`, `/login` y `/login/`, después de recargar y con ventanas de 390 × 844 y 1366 × 900. Sin errores JavaScript ni recursos locales fallidos en esas comprobaciones. Captura móvil inspeccionada visualmente. Toda la red externa estuvo bloqueada.
- El botón Google solicita `http://localhost:8081/auth/callback`. Los cinco casos existentes de OAuth con proveedor interceptado pasaron también en 8081. Esto no comprueba la allowlist ni un acceso real a Google.
- TypeScript pasó; 41 pruebas unitarias pasaron; `npx expo export --platform web` pasó con la advertencia preexistente del favicon ausente.

El formulario local quedó comprobado. El retorno OAuth de una cuenta real continúa pendiente de la prueba del usuario y de la revisión del responsable de Supabase si vuelve a la IP inaccesible.

Texto para enviar al responsable (no enviado por el agente):

> En el proyecto Soltapp `mpfcbpvjinwfkkwpffey`, revisar Authentication → URL Configuration. El login local solicita `http://localhost:18762/auth/callback`, pero el intento reportado terminó en `http://10.100.0.105:8081/`, que no responde. Agregar el callback exacto de 18762 a Redirect URLs si falta y guardar, conservando las URLs del grupo. Para el servidor alternativo en 8081, revisar también `http://localhost:8081/auth/callback`. Revisar el Site URL actual para explicar el fallback; no hace falta reemplazarlo globalmente para permitir un callback adicional. No se solicita modificar tablas, datos ni políticas RLS. El callback de Google hacia Supabase es diferente del retorno frontend y no debe reemplazarse por localhost.

**Verificación del chat existente**

El código versionado usaba AsyncStorage, mensajes de ejemplo, respuestas automáticas y una conversación fija de Alex en el servicio de tratos. No se encontró un servicio ni una migración de chat compartido.

Las lecturas GET con `limit=0` a `conversations`, `messages`, `chat_conversations`, `chat_messages` y `conversation_participants` devolvieron `404 / PGRST205` en el schema cache. El listado público OpenAPI devolvió 401: esto no prueba que no existan tablas privadas o con otros nombres. Si el integrante de chat ya tiene otro contrato, hay que coordinar la adaptación en lugar de crear una estructura paralela.

**Propuesta de base: NO EJECUTADA**

Archivo: [20261030_chat_persistence.sql](supabase/proposals/20261030_chat_persistence.sql). Está fuera de `supabase/migrations` para evitar aplicación automática. No usa `IF NOT EXISTS` para ocultar incompatibilidades con un esquema que ya exista.

Contrato propuesto:

- `chat_conversations`: producto, comprador y vendedor, con unicidad de esa terna.
- `chat_messages`: remitente, cuerpo, fecha del servidor y `client_id`. La unicidad `(conversation_id, sender_id, client_id)` hace idempotente el reintento de un envío.
- RLS de lectura para ambos participantes. El remitente debe ser el usuario autenticado. No hay permisos de cliente para cambiar participantes, editar fechas o borrar mensajes.
- `chat_get_or_create_conversation`: obtiene comprador de `auth.uid()` y vendedor de `products`; no recibe identidades elegidas por el cliente. Solo inicia nuevas conversaciones de publicaciones activas.
- `chat_send_message`: respeta RLS, valida el cuerpo y devuelve la misma fila al repetir el mismo envío. Reutilizar un identificador con otro texto produce un error. Un trigger privado serializa las inserciones y fija una fecha monotónica por conversación para no saltar filas de transacciones concurrentes al sincronizar por cursor.
- Realtime propuesto para las dos tablas; las instrucciones para agregar tablas a la publicación están comentadas y requieren revisión explícita.

Decisiones de compatibilidad que el grupo debe aprobar: la propuesta restringe el borrado físico de un producto con conversaciones para conservar la historia, y elimina sus conversaciones cuando se elimina una cuenta de Auth. La baja lógica de productos sigue siendo compatible. Revisar la retención requerida antes de aplicar.

**Cliente preparado**

- Servicio independiente `src/services/chatService.ts`, sin modificar las RPC ni servicios de compras del grupo.
- Abrir un chat no escribe. La conversación se crea mediante RPC al enviar el primer mensaje.
- El usuario y los participantes provienen de Auth/base. Los IDs comprador/vendedor de una URL no conceden permisos.
- Historial paginado y recuperación incremental de nuevas páginas tras un corte. Respuesta de envío, historial y eventos se fusionan por ID; los reintentos conservan `client_id`. No se muestra una burbuja como guardada antes de confirmarla.
- Suscripciones de mensajes y Buzón. Se relee al conectar para cubrir el intervalo entre snapshot y suscripción. Una sincronización por lectura cada 8 segundos y al volver a primer plano cubre reconexiones o Realtime aún no habilitado.
- Cambiar de cuenta limpia contexto, historial y borrador; las respuestas pendientes de la cuenta anterior se descartan.
- Buzón con conversaciones consultadas en Supabase. Las tarjetas y notificaciones de compras/ventas del grupo se conservan. La tarjeta fija de Alex se filtra de esta vista.
- Se eliminaron respuestas automáticas, reputación ficticia, indicador de escritura simulado y doble tilde que fingía lectura.
- Los mensajes antiguos de AsyncStorage no se borraron ni se importaron automáticamente, porque incluyen demostraciones y respuestas simuladas.

Cuando falta el backend, la pantalla lo informa y no permite enviar. No hay fallback de mensajes a almacenamiento local.

**Pruebas y límites**

- Unitarias: `scripts/verify-auth.cjs`, `scripts/verify-chat.cjs` y las pruebas anteriores de productos.
- `scripts/verify-auth-web.cjs`: Chrome y SDK reales con proveedor/backend interceptados. Retorno al mismo puerto, sesión persistida tras recarga, acceso a Mis productos, callback sin sesión y cancelación visibles. Incluye una renovación de sesión bloqueada y el restablecimiento local sin borrar tratos.
- `scripts/verify-chat-web.cjs`: sesiones de navegador simuladas y backend en memoria. Comprador/vendedor, Buzón, recuperación del historial en otro contexto, respuesta perdida y reintento, ausencia de respuestas automáticas, tercero sin acceso en la simulación y pantalla de backend no habilitado.
- La prueba unitaria de Realtime verifica filtros, entrega y limpieza del listener con callbacks simulados. El navegador verifica la sincronización de respaldo con WebSocket interceptado. No se afirma recepción Realtime desde el proyecto compartido.
- No se ejecutó la propuesta SQL ni una prueba de RLS en PostgreSQL. No se encontró una instalación local disponible de PostgreSQL/Docker para ejecutar esa revisión aislada. Las simulaciones no prueban RLS real.

Resultados de esta copia:

- `npx tsc --noEmit`: pasó.
- `npx expo export --platform web`: pasó; conserva la advertencia preexistente del favicon faltante.
- `node --test scripts/verify-auth.cjs scripts/verify-chat.cjs scripts/verify-products.cjs`: 41 pruebas pasaron.
- Chrome con OAuth interceptado: 5 casos pasaron, incluida la entrada por la pantalla inicial con Auth bloqueado, recuperación local, retorno y acceso a Mis productos.
- Chrome con chat/backend en memoria: 8 casos pasaron. Incluye 60 mensajes acumulados recuperados en varias páginas, historial anterior, respuesta perdida/reintento y limpieza de la vista al cerrar sesión.
- Google real del usuario: pendiente. El usuario informó que quedaba cargando antes del último ajuste de timeout y recuperación; no se da por resuelto sin confirmación posterior.
- Chat con dos cuentas/dispositivos reales, RLS en PostgreSQL y eventos del Realtime compartido: pendientes de coordinación y habilitación del contrato.

Comandos de navegador (requieren Chrome y Playwright ya disponibles; no instalan paquetes):

```powershell
node scripts/verify-auth-web.cjs
node scripts/verify-chat-web.cjs
```

Los dos scripts bloquean/interceptan la red externa. El segundo mantiene el supuesto servidor de chat en memoria; sus resultados no son una prueba contra Supabase compartido. Los resultados temporales se guardan en `node_modules/.cache/soltapp-auth-chat/`.

Antes de dar por terminado el chat, el responsable debe:

1. Confirmar si existe otro contrato de chat, revisar la propuesta con el integrante correspondiente y probarla en un entorno aislado.
2. Probar con usuarios A y B que se crea una sola conversación por terna y que C no puede leer, enviar ni modificar participantes, incluso llamando directamente a REST/RPC.
3. Verificar que no se puede suplantar al remitente, falsificar fecha/ID, cambiar participantes ni editar/borrar mensajes desde el cliente. Un reintento con el mismo `client_id` debe devolver una sola fila.
4. Verificar separación de otro producto y de otro comprador para el mismo producto; paginar más de 50 mensajes.
5. Autorizar/aplicar el contrato mediante el proceso del grupo. Activar la publicación Realtime si corresponde y comprobar el evento con dos cuentas/dispositivos reales.
6. Confirmar envío A→B y B→A, cerrar sesión y volver a entrar, probar cortes de red, respuesta perdida/reintento y el acceso denegado de C. No realizar estas escrituras de prueba en la base compartida sin la autorización correspondiente.

**Archivos de esta etapa**

Login: `src/utils/auth.ts`, `src/utils/authTimeout.ts`, `src/services/authCallbackService.ts`, `app/auth/callback.tsx`, `src/screens/LoginScreen.tsx`, `LoadingSplashScreen.tsx` y la eliminación del canje duplicado en `HomeScreen.tsx`.

Chat: `src/types/chat.types.ts`, `src/services/chatService.ts`, `src/utils/chatMessages.ts`, `src/hooks/useChatThread.ts`, `src/components/ChatInboxList.tsx`, `InboxView.tsx`, `ChatScreen.tsx`, la ruta `app/chat.tsx` y los parámetros de apertura en Home. Coordinación de base: propuesta SQL indicada arriba. Documentación y scripts de prueba acompañan estos cambios.
