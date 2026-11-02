# Google en Expo Go — diagnóstico y resultado del 1–2 de noviembre de 2026

Rama: `feature/modulo-detalle-producto`. No se cambiaron dependencias, puertos,
credenciales, configuración de Google/Supabase ni datos de usuarios.

## Estado actual: login Google real confirmado en Android

Abrir el QR nuevo o `exp://192-168-0-11.sslip.io:8083` en Expo Go. Metro quedó
ejecutándose con ese nombre, en el mismo puerto 8083. La web de producción
continúa en `http://localhost:8081/login`, sin cambios en su sesión.

La captura del dashboard confirmó que **ya existe `exp://**`**. La primera
explicación de que faltaba autorizar el retorno era incompleta: Auth v2.197.0
rechaza las IPs LAN antes de evaluar esa regla. Se probó una alternativa con
la configuración existente: `192-168-0-11.sslip.io` resuelve exclusivamente a
`192.168.0.11`, y Auth **sí acepta**
`exp://192-168-0-11.sslip.io:8083/--/home`. No se modificó Supabase.

sslip.io es un servicio DNS público; la conexión HTTP sigue dirigida a la
computadora de la LAN. No es un túnel ni un despliegue. Se verificó resolución
DNS, HTTP 200 de Metro y de la web, y el manifiesto Android con `hostUri`,
`debuggerHost` y URL del bundle apuntando al nombre DNS. No se usó el nombre
`.local` del equipo porque en esta computadora resuelve también a tres
interfaces distintas de Wi-Fi.

La tarea `.vscode/tasks.json` ahora calcula `<IP-Wi-Fi-con-guiones>.sslip.io`,
valida que resuelva solo a esa IP y mantiene 8083. Rechaza otro proceso en ese
puerto en lugar de cambiarlo o cerrar servidores. El QR está en
`node_modules/.cache/soltapp-auth-chat/expo-go-lan-dns.png`.

**Comprobado el 2 de noviembre:** el usuario entró desde Expo Go y los registros
mostraron retorno coincidente, `browser_result: success`, método `implicit` y
`session_established: sesión confirmada=true` a los **5723 ms**. El retorno llegó
a los 5133 ms y el establecimiento de sesión empezó a los 5141 ms. Se trata de
un login Google real en Android, no del proveedor simulado de las pruebas web.
Evidencia sin tokens: `node_modules/.cache/soltapp-auth-chat/native-google-live-results.json`.
Después se retiraron el panel temporal y los mensajes de consola de Login;
se conservaron la validación de retorno, cancelación, timeout y reintento.
La alternativa DNS nativa no habilita automáticamente el callback web de ese
nombre; el login web comprobado con sesión guardada sigue siendo localhost:8081.

## Resultados comprobados

1. El cliente Android conectado a Metro se identificó como Expo Go
   (`host.exp.exponent`, Samsung SM-A245M). Su consola registró repetidamente
   `Cannot find native module 'ExpoCrypto'` y luego
   `Cannot read property 'ErrorBoundary' of undefined`. No había registros de
   `handleSocialLogin` antes de la corrección del import: el primer error ocurre
   al importar las rutas, antes de OAuth.
   El segundo error puede ser consecuencia de la importación fallida; no se
   comprobó su causa de forma independiente. El usuario confirmó que el cliente
   Android instalado es **Expo Go 58.0.5**, la versión compatible con SDK 58.
   El error observado no se atribuye a tener una versión anterior de Expo Go.
2. La instalación local contiene Expo **58.0.22**, Router **58.0.29**, React Native
   **0.88.1**, AuthSession **58.0.16**, Linking **58.0.15** y Crypto **58.0.7**.
   La API oficial de Expo indica Expo Go Android **58.0.5** para SDK 58.
   Después de retirar el import de Crypto, el dispositivo ejecutó el flujo nativo
   y dejó estos registros sanitizados reales:

   ```text
   environment: app nativa
   redirect_generated: soltapp://home
   authorize_ready: redirect_to=soltapp://home; coincide=true
   browser_waiting: Esperando openAuthSessionAsync
   ```

   La comparación de `Constants.executionEnvironment` contra `StoreClient` no
   identificó Expo Go. No se registró su valor exacto en ese intento. No hubo
   `browser_result` ni `session_start` observados. El usuario confirmó además
   que las capturas de Chrome partían de `192.168.0.11:8083`, no de localhost:8081,
   y que también había intentado iniciar Google desde Expo Go.

   Tras corregir la detección, el usuario abrió Expo Go y pulsó Google. Se
   observaron directamente estos nuevos registros del Android:

   ```text
   environment: Expo Go; Constants=bare
   redirect_generated: exp://192.168.0.11:8083/--/home
   authorize_ready: redirect_to=exp://192.168.0.11:8083/--/home; coincide=true
   browser_waiting: Esperando openAuthSessionAsync
   ```

   Esto confirma la corrección de detección y de URI en el dispositivo real,
   y el valor que el SDK envía en su URL de autorización. No hubo un retorno
   observado ni un inicio del intercambio de sesión. Se repitió la prueba
   de validación de Auth con exactamente esa URI y volvió a devolver la IP
   anterior. La creación de sesión no es la etapa observada del bloqueo.
3. Una prueba real de la selección de retorno de Supabase Auth devolvió:

   | Retorno solicitado | HTTP | Destino sin parámetros |
   | --- | --- | --- |
   | Sin `redirect_to` | 303 | `http://10.100.0.105:8081/` |
   | `exp://192.168.0.11:8083/--/home` | 303 | `http://10.100.0.105:8081/` |
   | `http://localhost:8081/auth/callback` | 303 | `http://localhost:8081/auth/callback` |
   | `soltapp://home` (retorno nativo observado) | 303 | `soltapp://home` |
   | `http://192.168.0.11:8081/auth/callback` | 303 | `http://10.100.0.105:8081/` |
   | `http://192.168.0.11:8083/auth/callback` (origen web usado) | 303 | `http://10.100.0.105:8081/` |
   | `exp://192-168-0-11.sslip.io:8083/--/home` | 303 | `exp://192-168-0-11.sslip.io:8083/--/home` |

   Se usó `GET /auth/v1/verify`, sin seguir la redirección, con un tipo de
   verificación deliberadamente no admitido y un valor ficticio sin relación
   con ninguna cuenta. Las respuestas confirmaron el rechazo del tipo de
   verificación. Ese camino falla antes de verificar usuarios, enviar correos o
   crear sesiones; no inicia Google. Usa `GetReferrer`, también utilizado por
   la autorización OAuth en el código de Supabase Auth.

   **La validación no acepta la URI exp de Expo Go ni el callback web LAN en
   8083; selecciona el destino anterior. Sí acepta el esquema soltapp y el
   callback web de localhost:8081.** Expo Go no registra el esquema personalizado
   de Soltapp, por lo que aceptar `soltapp://home` no permite volver a Expo Go.
   Esta prueba no es una captura del intento Google del
   celular ni una lectura administrativa de la lista de URLs autorizadas.
   La inferencia para OAuth es que, con esa misma URI y esa misma configuración,
   el navegador vuelve al destino anterior y no entrega el retorno esperado a
   `openAuthSessionAsync`. No se ha observado todavía un intercambio de sesión
   de Google en ese Android.

   Script reproducible, sin cuentas ni configuración administrativa:

   ```powershell
   node scripts/diagnose-auth-redirect.cjs exp://192.168.0.11:8083/--/home
   node scripts/diagnose-auth-redirect.cjs soltapp://home
   node scripts/diagnose-auth-redirect.cjs exp://192-168-0-11.sslip.io:8083/--/home
   ```

   Informes sanitizados: `node_modules/.cache/soltapp-auth-chat/native-redirect-probe.json`
   y `native-redirect-probe-soltapp.json`, `native-redirect-probe-dns.json` en la misma carpeta.

## Correcciones locales

- `auth.ts` detecta Expo Go mediante el módulo nativo (`isRunningInExpoGo`),
  en lugar de depender de la comparación de Constants que falló en el dispositivo.
  Construye el retorno exp/exps con el host real de `getExpoGoProjectConfig`
  o `Constants.expoConfig.hostUri`, conservando el puerto sin valores fijos.
  No usa APIs internas del SDK. Se comprobó localmente un caso que reproduce el
  retorno incorrecto observado, junto con los casos Go/standalone, HTTPS y host
  ausente. La última corrección quedó confirmada por el registro Android de arriba.
- Los builds nativos conservan `expo-linking.createURL(path, { scheme: 'soltapp' })`,
  equivalente a la llamada previa a `makeRedirectUri` para esos argumentos.
  Se comprobó la igualdad con el código real del SDK instalado. Así dejamos de
  cargar el PKCE de AuthSession y su import nativo de Crypto, que no se utilizaba
  para construir la URI. No se implementó un sustituto criptográfico.
- El bundle Android nuevo responde 200 y ya no incluye ese import de PKCE ni el
  `requireNativeModule('ExpoCrypto')` que fallaba. Esto confirma el cambio del
  bundle. Después se observó la ejecución nativa de `handleSocialLogin` descrita
  arriba. Posteriormente se confirmó el login real. No se comprobó por ello toda
  la navegación ni la funcionalidad de cada módulo del dispositivo.
- Se mantiene el OAuth nativo existente de Supabase y `openAuthSessionAsync`,
  con los dos intercambios ya soportados: código PKCE o pareja de tokens implicit.
  Se exige coincidencia exacta de esquema, host, puerto y ruta, y una sesión
  confirmada antes de declarar éxito. Query y fragmento se leen conjuntamente.
- Preparación y establecimiento de sesión tienen límite de 15 segundos;
  espera del navegador, 120 segundos. Cancelaciones, retornos incompletos,
  rechazos y errores de sesión muestran mensajes y liberan el indicador.
- Android no permite cerrar la pestaña de autenticación por código. Tras un
  timeout o cancelación manual, cerrar esa pestaña con **X** antes de reintentar.
  Se impide abrir un segundo navegador mientras el anterior sigue pendiente,
  y un retorno posterior de un intento cancelado no inicia otro intercambio.
- Los observadores propios se retiran al finalizar. El intercambio válido puede
  terminar si Expo Router ya abrió `/home` y desmontó Login por el deep link;
  no se actualiza el estado React de una pantalla desmontada.
- El bloque OAuth web conserva su retorno `/auth/callback` y su flujo. Se corrigió
  también la resolución de `@expo/cli` del servidor local: ahora se resuelve desde
  el paquete Expo, porque con la instalación actual la CLI está anidada.

## Prueba real aprobada en Android

1. El usuario abrió el QR de `exp://192-168-0-11.sslip.io:8083` en Expo Go.
2. Pulsó Google y completó el acceso con su propia cuenta.
3. El evento `link_received` coincidió con el retorno a los 5133 ms.
4. `openAuthSessionAsync` respondió `success` a los 5135 ms.
5. Supabase confirmó la sesión a los 5723 ms y el usuario informó que entró.

No se leyeron ni imprimieron tokens, códigos, correos, contraseñas ni IDs de
usuario para verificarlo. El panel y los logs temporales se retiraron después
de guardar la evidencia. El servicio conserva un observador opcional sanitizado
para pruebas locales; Login no lo activa.

Para Chrome de la computadora, iniciar Google desde **http://localhost:8081/login**.
Los intentos del usuario desde la web LAN en 8083 usan un callback distinto que
el servidor rechaza. No se cambió el retorno web para saltar entre orígenes.
El usuario confirmó también el fallo del login por LAN en 8081. Se comprobó
que `http://192.168.0.11:8081/login` devuelve HTTP 200 desde la computadora,
y que la validación de Auth rechaza su callback y elige la IP anterior.
Por tanto, conservar el puerto 8081 no convierte la IP LAN en el mismo origen
que localhost. La prueba HTTP desde la computadora no verifica el firewall o
el acceso de red del celular. En el celular, localhost designa al propio celular.

La causa del rechazo de las URIs con IP LAN quedó identificada en la validación
de Auth. La alternativa con nombre DNS permite probar Expo Go conservando la
lista existente. No se necesita agregar otra regla exp ni cambiar Site URL
para esta prueba. El frontend debe enviar una URI que el servidor acepte.

Actualización: el usuario ahora confirmó acceso al dashboard. El endpoint de
salud de su proyecto respondió `GoTrue v2.197.0` usando solamente la clave pública
ya existente de la aplicación, sin imprimirla. El código oficial de esa versión
(`internal/utilities/request.go`, líneas 100–126) acepta primero el mismo origen
que Site URL y luego rechaza las IPs no loopback antes de consultar URIAllowListMap.
Por ello, agregar una IP LAN a Redirect URLs no resuelve ese filtro. La captura
del dashboard confirmó la regla exp amplia y las URLs de localhost y Soltapp;
se conservaron las once entradas y Site URL. El retorno con nombre DNS fue
aceptado usando esa misma configuración. No se modificó nada en Supabase.
Fuente versionada: https://github.com/supabase/auth/blob/v2.197.0/internal/utilities/request.go

Expo documenta que Expo Go no es el entorno soportado para probar OAuth con
un esquema personalizado: `soltapp` en `app.json` no registra ese esquema en el
APK de Expo Go. Como prueba sin alterar el proyecto oficial, usar el login web
existente en `http://localhost:8081/login`, o email/contraseña en Expo Go si la
cuenta ya dispone de contraseña. La prueba nativa completa recomendada sería
un development build de una copia de trabajo aislada: usaría el retorno
`soltapp://home` que la validación actual sí acepta. Esa prueba requeriría
autorización del usuario para construir e instalar; no se generó ni instaló
ningún APK. No es necesario cambiar el Site URL compartido para probar el
callback web de localhost:8081 que ya fue aceptado.

Referencias oficiales:

- [Expo: OAuth y limitación de Expo Go](https://docs.expo.dev/guides/authentication/)
- [Supabase: redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Auth: selección del retorno](https://github.com/supabase/auth/blob/master/internal/utilities/request.go)
- [Auth: rechazo previo a verificar usuarios](https://github.com/supabase/auth/blob/master/internal/api/verify.go)
- [DNS sslip.io/nip.io](https://nip.io/)

## Verificación local

- `npx tsc --noEmit`: aprobado.
- `node --test scripts/verify-auth.cjs scripts/verify-native-oauth.cjs scripts/verify-chat.cjs scripts/verify-products.cjs`:
  **64 aprobadas**, 19 específicas del flujo nativo. SDK/navegador/sesiones se
  simulan; no son un login Google real ni pruebas de sesión en Android.
- `npx expo export --platform web`: aprobado. Permanece el aviso previo por
  `assets/images/favicon.png` ausente; no impidió exportar.
- `SOLTAPP_TEST_URL=http://localhost:8081 node scripts/verify-auth-web.cjs`:
  5 casos aprobados en Chrome, proveedor y backend simulados, cero solicitudes
  externas. Incluye OAuth web, Mis productos, rechazo, retorno vacío y timeout.
- `SOLTAPP_TEST_URL=http://localhost:8081 node scripts/verify-chat-web.cjs`:
  12 casos aprobados tras retirar el diagnóstico y ajustar las áreas seguras,
  con backend en memoria. No se validaron RLS ni Realtime de PostgreSQL real.
- `SOLTAPP_TEST_URL=http://localhost:8081 node scripts/verify-stable-web.cjs`:
  4 casos aprobados, incluidas rutas, callback, recursos y recuperación de errores.
- Servidor web `/login`: HTTP 200 en 8081, mismo PID 23232 durante la comprobación
  final. Metro `/status`: HTTP 200 en 8083, nuevo PID 33808 anunciado por nombre
  DNS. Se reemplazó solo el Metro propio anterior (21480), conservando sus logs
  en archivos `metro-native-oauth*-ip.log`. No se cerró el servidor web.
- OAuth Google completo en Android: **aprobado**, con retorno por nombre DNS y
  sesión confirmada en 5723 ms; corroborado por el usuario y el registro nativo.
- El usuario confirmó que `http://localhost:8081/login` entra directamente a
  Home porque ya tiene una sesión guardada. Esto comprueba la recuperación de
  esa sesión y el acceso web, no un nuevo recorrido de Google. Las capturas de
  fallo proporcionadas partían del origen LAN en 8083; las pruebas Chrome
  automatizadas siguen usando proveedor simulado.

Archivos modificados en esta tarea: `src/screens/LoginScreen.tsx`,
`src/utils/auth.ts`, `src/services/nativeOAuthService.ts`,
`scripts/verify-auth.cjs`, `scripts/verify-native-oauth.cjs`,
`scripts/diagnose-auth-redirect.cjs`, `scripts/serve-web-local.cjs`
y este documento. También se actualizó `.vscode/tasks.json` para anunciar el
nombre DNS al iniciar Metro. Los cambios locales anteriores se conservaron.
El ajuste posterior de área segura modificó solamente el import de
`SafeAreaView` en Home, Chat, Perfil y Perfil público.

Se retiraron `nativeSteps`, el panel, los logs y el callback `onStep` de Login
después de la prueba real. Se conservaron las validaciones y los estados de error.

## Ajuste visual posterior en Android

Después de entrar, el usuario informó que la barra del sistema tapaba la
navegación de la app y el campo del chat. Home, Perfil, Perfil público y Chat
usaban `SafeAreaView` de React Native, que en Android es un `View` sin insets.
Se cambió únicamente ese import al componente de `react-native-safe-area-context`
ya instalado. Expo Router provee el contexto; no se agregó otro proveedor ni
se modificaron las rutas o el servicio de chat. La barra absoluta queda dentro
del área útil del contenedor y el campo del chat respeta el margen inferior.
El usuario confirmó que el primer ajuste de área segura quedó bien. Después
informó el error nativo de rol al enviar, Enter sin envío y acciones del Detalle
tapadas por la navegación. Esos tres ajustes posteriores y sus pruebas están
documentados en `COORDINACION_INTEGRANTE_2_CHAT.md`, sección del 2 de noviembre.
El usuario confirmó luego en Android: «Los botones se ven y no aparece el error
rojo». Se registró esa comprobación sin extenderla a pruebas de backend o de
teclado que no fueron informadas por separado.
