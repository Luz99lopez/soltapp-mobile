# Coordinación con Integrante 2 — chat de Soltapp

Estado: **cliente integrado; backend y validación entre cuentas reales pendientes**. No se ejecutó SQL ni se escribieron mensajes de prueba en el Supabase compartido. El usuario confirmó que Google ya funciona en `localhost:8081`; se conserva ese origen y el callback existente.

## Infraestructura revisada

Se reutilizan `app/chat.tsx`, `src/screens/ChatScreen.tsx` y el Buzón de `src/components/InboxView.tsx`. Los tratos, compras, encuentros y notificaciones conservan sus servicios y rutas. El nuevo servicio es `src/services/chatService.ts`, con `useChatThread` y `ChatInboxList` para la sincronización. No se creó una segunda pantalla de chat.

En la nueva lectura GET anónima, con `limit=0`, `chat_conversations`, `chat_messages`, `conversations`, `messages` y `conversation_participants` devolvieron 404 / PGRST205. Las migraciones versionadas solo tienen el flujo de encuentros; la propuesta de chat está separada. Esto no descarta tablas privadas o con otros nombres. **Primero el Integrante 2 debe confirmar el contrato de su módulo**. Si existe otro, adaptar este servicio antes de crear tablas nuevas.

## SQL único definitivo para revisión, no aplicado

[SQL único](supabase/proposals/20261030_chat_persistence.sql), contrato v1 revisado el 31/10/2026. Reutiliza y reemplaza el contenido de la propuesta anterior en el mismo archivo. Está fuera de `supabase/migrations` para impedir su aplicación automática. No hay que ejecutar otra migración de chat.

| Contrato frontend | Propósito |
| --- | --- |
| `chat_conversations` | ID, producto, comprador, vendedor, fechas; terna única |
| `chat_messages` | ID servidor, conversación, remitente, texto, `client_id`, fecha servidor |
| `chat_get_or_create_conversation(p_product_id)` | Deriva comprador de Auth y vendedor del producto; no admite identidades elegidas por el cliente |
| `chat_send_message(p_conversation_id, p_client_id, p_body)` | Confirma el mensaje guardado; reintentos idempotentes |
| Publicación Realtime de ambas tablas | Eventos de mensajes y actualización del Buzón |

El responsable debe revisar tipos y nombres de `products`, estado `activo`, claves a Auth, lectura de perfiles/productos bajo sus políticas, índices, restricciones únicas y funciones. La propuesta limita lectura a participantes y exige que el remitente sea `auth.uid()`. Los participantes no pueden editar/borrar filas ni elegir fechas/IDs del servidor. Revisar las funciones `SECURITY DEFINER` y su `search_path` antes de aplicar. Las pruebas simuladas **no validan RLS real**.

Revisar especialmente retención: borrar físicamente un producto con chat está restringido; eliminar una cuenta de Auth elimina sus conversaciones. Aprobar o adaptar esta decisión. El borrado lógico de productos es compatible.

El SQL final incorpora ambas tablas a `supabase_realtime` sin duplicar miembros ni cambiar otras tablas. Exige que la publicación de Supabase ya exista y recarga el schema cache de PostgREST al confirmar. No hace falta desactivar RLS. El cliente usa sondeo de respaldo cada ocho segundos sin Realtime y aproximadamente cada 32 segundos cuando el canal está conectado; recupera al reconectar/volver al chat. Al salir de la pantalla se retiran su sondeo y suscripción, conservando el cursor para recuperar mensajes perdidos al volver.

## Administrador: pasos exactos

1. Coordinar con el Integrante 2 y abrir SQL Editor del proyecto Soltapp. Usar primero un entorno de prueba autorizado. Confirmar el contrato antes de crear nada. Estas consultas solo leen metadatos:

```sql
select to_regclass('public.chat_conversations') as conversations,
       to_regclass('public.chat_messages') as messages;
select table_schema, table_name from information_schema.tables
where table_schema = 'public'
  and (table_name ilike '%chat%' or table_name ilike '%message%' or table_name ilike '%convers%');
select column_name, data_type from information_schema.columns
where table_schema = 'public' and table_name = 'products'
  and column_name in ('id', 'seller_id', 'status');
select pubname from pg_publication where pubname = 'supabase_realtime';
```

2. Si existen tablas equivalentes, detenerse y confirmar su contrato con el Integrante 2: no borrar ni crear estructuras paralelas. Si los nombres ya existen pero la API devuelve PGRST205, revisar exposición del esquema `public` en Data API y recargar su schema cache; no asumir que falta físicamente una tabla. El preflight del SQL impide sobrescribir tablas existentes.
3. Confirmar que producto y vendedor son UUID, que `products.seller_id` coincide con `auth.users.id`, que `status = 'activo'` representa una publicación disponible, y aprobar la retención indicada arriba. Los perfiles/productos conservan sus RLS actuales; el nombre del participante puede mostrarse como Comprador/Vendedor si su perfil no es legible. Confirmar `supabase_realtime` antes de continuar.
4. Revisar y ejecutar **una vez** `supabase/proposals/20261030_chat_persistence.sql`. Tablas, índices, restricciones, RLS, funciones, triggers y publicación se aplican en una transacción. Si falla, no desactivar permisos para forzarlo: revisar el error y ejecutar `ROLLBACK` si el editor conserva la transacción abierta. No repetir el archivo sobre un contrato ya existente.
5. Revisar los SELECT de solo lectura al final: dos tablas con RLS `true`, tres políticas, ambas tablas publicadas y flags de permisos `false / true / false / false`. `anon` y `authenticated` deben ser roles sin superusuario ni bypass de RLS. Esperar a la recarga de PostgREST y probar `Reintentar` en el chat con una sesión real. Las firmas RPC deben tener exactamente los argumentos de la tabla de contrato anterior. No tocar Google Login ni las políticas del resto del proyecto.
6. Con autorización de pruebas, copiar **solo** el bloque comentado `PRUEBA DE SEGURIDAD PREPARADA` del mismo SQL. Sustituir los UUID de A comprador, B vendedor, C tercero y un producto activo de B, todos de prueba. Ejecutarlo sin los delimitadores `/* */`. Verifica idempotencia, suplantación, fecha/participantes inmutables, lectura/respuesta de participantes, denegación a C y a `anon`. Finaliza con `ROLLBACK`; cualquier excepción `FAIL` invalida el resultado. No se ejecutó por el agente ni equivale a una prueba de Realtime o entre dispositivos.
7. Aprobar la prueba entre cuentas/dispositivos reales de la matriz siguiente. Registrar resultado y entorno. Solo entonces declarar habilitado el chat persistente; después de validar en prueba, el responsable puede aplicar el mismo archivo aprobado al proyecto compartido bajo el procedimiento del grupo.

## Bloqueo concreto confirmado

La verificación GET de solo lectura de **las dos tablas del contrato** devuelve 404 / PGRST205 en la API actual. Es un bloqueo del contrato expuesto por Supabase; no acredita por sí solo que la tabla física no exista. La consulta desde producto usa `chat_conversations` sin un join ambiguo, después de validar Auth. Realtime no interviene en esa lectura inicial, y una RLS que filtra filas puede devolver una lista vacía sin error: no debe confundirse con PGRST205.

El frontend ahora distingue: tabla no disponible (`PGRST205/42P01`), RPC ausente (`PGRST202/42883`), relación/columna/firma incorrecta, permisos (`42501`), sesión/JWT inválido y red. Una falla de red de `getUser` no pide iniciar sesión como si la cuenta fuera inválida. Los errores conservan código y operación para diagnóstico sin mostrar tokens ni mensajes crudos del servidor.

Referencias para la revisión: [códigos de PostgREST](https://docs.postgrest.org/en/stable/references/errors.html), [RLS de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security) y [Postgres Changes de Realtime](https://supabase.com/docs/guides/realtime/postgres-changes).

## Comportamiento del cliente

- Abrir/leer no crea filas. El primer envío crea o recupera la terna canónica mediante RPC.
- No hay mensajes de ejemplo, respuestas automáticas ni fallback de mensajes en AsyncStorage.
- Historial paginado y recuperación de acumulados tras desconexión. Fusión por ID del servidor.
- `client_id` estable al reintentar el mismo envío tras un error, mientras se conserva ese intento en pantalla. No se confunde una respuesta perdida con un mensaje no guardado. Una recarga pierde el borrador/identificador pendiente: revisar el historial antes de reenviar manualmente.
- Solo se muestra “Guardado” después de confirmación. No se simulan lectura ni presencia de la otra persona.
- Cambiar de cuenta limpia contexto, historial y borrador; descarta respuestas tardías de la cuenta anterior.
- Consultas con límite de espera y error visible. Se reintentan fallos transitorios al reconectar; un esquema ausente o permisos insuficientes se informan y requieren revisión.

## Prueba real preparada — requiere autorización de escrituras

**No ejecutada.** Hacer primero en un entorno de prueba con el contrato revisado. No usar service role en el cliente ni compartir tokens/contraseñas. Registrar aquí resultados sin datos personales.

| Paso manual autorizado | Resultado esperado | Estado |
| --- | --- | --- |
| Cuenta B tiene un producto activo; cuenta A inicia sesión y abre Hacer oferta, en otro navegador/dispositivo | Identidad correcta; abrir no crea mensajes | Pendiente |
| A envía un texto identificable; B abre Buzón y responde; A recibe la respuesta | Misma conversación, filas persistidas y remitentes correctos | Pendiente |
| A y B cierran sesión, vuelven a entrar y abren el chat; repetir en otro dispositivo | Ambos recuperan todo el historial, sin importación local | Pendiente |
| Repetir con otro producto entre A y B | Conversación independiente | Pendiente |
| Cortar red después de enviar, restaurar y reintentar sin editar el texto | Un solo mensaje confirmado para ese `client_id` | Pendiente |
| Desconectar al receptor; enviar varios mensajes; reconectar | Recupera todos, ordenados y sin duplicados | Pendiente |
| Con Realtime autorizado, recibir sin esperar el sondeo; repetir sin Realtime | Eventos reales en el primer caso, sondeo de respaldo en el segundo | Pendiente |
| Usuario sin sesión o tercero intenta leer/enviar a una conversación ajena | RLS rechaza lectura/escritura, aun cambiando IDs en la URL/solicitud | Pendiente |
| Intentar falsificar remitente, participantes, fecha y repetir nonce con otro texto | Restricciones/RLS/RPC rechazan los cambios | Pendiente |
| Revisar Compras, encuentros y notificaciones con el Integrante 2 | Flujos previos conservados | Pendiente |

Para escenarios de un tercero o varios compradores hace falta una tercera cuenta de prueba autorizada. El frontend no sustituye esta prueba de seguridad de la base.

Pruebas locales sin escrituras compartidas:

```powershell
node --test scripts/verify-auth.cjs scripts/verify-chat.cjs scripts/verify-products.cjs
$env:SOLTAPP_TEST_URL = 'http://localhost:8081'
node scripts/verify-chat-web.cjs
```

La segunda usa cuentas simuladas y un backend en memoria, con toda la red externa interceptada. No da por habilitado el chat real.

## Entrega final y resultados locales

Frontend integrado en las pantallas existentes. Los cambios de este cierre están en:

- `src/services/chatService.ts`: errores separados por código/operación, validación de Auth sin confundir red con sesión inválida y estado de la suscripción del Buzón.
- `src/utils/chatRequest.ts`: clasificación de errores y cancelación de peticiones PostgREST al agotar la espera. Un envío abortado puede haber llegado al servidor: se conserva el identificador de reintento.
- `src/hooks/useChatThread.ts`: estado sin conexión, autenticación necesaria, pausa del canal/sondeo fuera de foco y cursor conservado para recuperar el intervalo perdido. Usa el hook de foco del Expo Router instalado.
- `src/components/ChatInboxList.tsx`: recuperación de red, agrupación de refrescos mientras hay una lectura en curso, sondeo reducido con Realtime y conservación del fin de paginación al refrescar la primera página.
- `src/screens/ChatScreen.tsx`: estados visibles de desconexión/envío y acceso al login únicamente si el error es de autenticación; botón Atrás accesible. El borrador y los mensajes guardados se conservan durante errores de conexión.
- `src/types/chat.types.ts`: referencia al contrato final v1.
- `scripts/verify-chat.cjs` y `scripts/verify-chat-web.cjs`: regresiones de códigos, cancelación, permisos del contrato simulado, reintentos, navegación, desconexión y cierre del sondeo.
- El SQL único y esta documentación. Se conservaron los cambios anteriores, Google Login, arranque estable en 8081, módulos de Productos, Perfil, compras y encuentros.

Comprobaciones ejecutadas:

| Verificación | Resultado y alcance |
| --- | --- |
| `npx tsc --noEmit` | Pasó |
| Auth/Chat/Productos, Node test runner | 45 pruebas pasaron |
| `npx expo export --platform web` y arranque estable | Pasaron; favicon ausente es una advertencia previa |
| Export Android | Bundle generado; no es un APK ni una prueba en emulador/dispositivo |
| Chrome, servidor estable | 4 casos pasaron |
| Chrome, OAuth interceptado | 5 casos pasaron; no se volvió a iniciar Google con una cuenta real |
| Chrome, chat con backend en memoria | 12 casos pasaron, incluidas salida sin sondeo residual, reintento explícito sin tablas, Auth sin red y JWT inválido |
| Navegación de producción | Home, Detalle, Mis productos, Editar, Comprar/carrito y Chat pasaron sin errores JS ni solicitudes de bundles de Metro; Buzón se verificó con el chat |
| Supabase compartido | Solo GET con `limit=0` a las dos tablas del contrato: 404/PGRST205; sin datos personales ni escrituras |
| SQL/RLS y Realtime reales | Preparados y revisados estáticamente; no ejecutados ni validados en PostgreSQL por el agente |
| Dos cuentas/dispositivos reales y tercero | Pendiente: habilitación del contrato y autorización de la prueba por el responsable |

El reporte de chat usa 63 mensajes **solo en memoria**. Sus resultados no prueban RLS ni Realtime del proyecto compartido. La única intervención externa pendiente es que el responsable habilite y valide el contrato de Supabase con este SQL/instrucciones; no hay una segunda arquitectura o servicio a incorporar. Hasta aprobar la matriz real anterior, no se declara “chat persistente funcionando”.

## Ajustes de UI Android — 2 de noviembre de 2026

- El usuario confirmó el login Google real en Expo Go y el ajuste inicial de
  área segura de Home/Perfil/Chat. Después informó un error rojo al enviar.
- La causa localizada fue `accessibilityRole="status"`: ese valor no existe en
  el enum Android `AccessibilityRole`, aunque `status` sí existe en el enum
  ARIA de la prop `role`. Se cambió a `role="status"` con
  `accessibilityLiveRegion="polite"` en Chat, Buzón y estados de carga del módulo
  Productos/Compra. El resto de los roles y las operaciones se conservaron.
- El campo conserva multiline y usa la acción nativa `send`/`submit` con
  `onSubmitEditing`. El teclado y el botón llaman al mismo handler existente,
  con las mismas condiciones de habilitación y el bloqueo de envíos duplicados
  del hook. Web admite Enter para enviar y Shift+Enter para salto de línea;
  Enter durante composición IME no envía. Los errores conservan el borrador.
- En Detalle, las acciones se colocaron fuera del ScrollView, en el flujo
  encima de la navegación. Se retiró la posición absoluta `bottom: 58` que
  ignoraba el margen seguro, y el espaciador de 80px que ya no hace falta.
- No se cambiaron servicios, tablas, RLS, Realtime, RPC, datos compartidos,
  dependencias, autenticación, rutas o lógica de compras/encuentros.

Validación: TypeScript y export web aprobados; 65 pruebas Node aprobadas,
incluida una comprobación de roles contra los enums Android del RN instalado.
Chrome aprobó 13 casos de chat con backend en memoria, incluyendo Enter único,
Shift+Enter y composición IME. La navegación de producción y la geometría de
Detalle pasaron: con 48px de margen Android emulado, acciones terminan en y=740
y navegación empieza en y=740, completamente por encima del margen.
Captura e informe en `node_modules/.cache/soltapp-performance/android-ui-fixes*`.
Confirmación posterior del usuario en Android: «Los botones se ven y no aparece
el error rojo». Quedaron corroborados en el dispositivo la visibilidad de las
acciones y la ausencia del error de accesibilidad. Esa confirmación no es una
prueba de RLS/Realtime ni de persistencia entre dos cuentas; tampoco se registró
por separado el resultado de la tecla Enviar/Enter nativa.
