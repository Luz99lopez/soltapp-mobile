**Soltapp: diagnóstico de navegación web — 30/10/2026**

Trabajo realizado en `feature/modulo-detalle-producto`. La referencia «antes» es la copia de trabajo al iniciar este diagnóstico, incluyendo el módulo implementado previamente; no es una comparación contra `main`.

La instalación recibida tiene **Expo 58.0.21 / Expo Router 58.0.28**, aunque la consigna menciona SDK 57. No se cambió ninguna versión, dependencia, configuración de Metro, esquema, política ni dato compartido. Se leyó la documentación versionada de SDK 57 y se contrastó el comportamiento con el Router instalado.

**Cómo se midió**

- Chrome headless 156.0.8078.48, autorizado por el usuario, con un contexto nuevo y viewport 390 × 844. Esto prueba un ancho móvil; no simula la CPU, la red ni el hardware de un celular físico.
- Tres recorridos de producción antes y tres después, con el mismo servidor estático local y los mismos datos simulados. Las tablas de producción usan medianas.
- Supabase interceptado en el navegador: 200 ms de demora por petición. Autenticación, productos e imágenes de prueba. Se bloquean las escrituras y el resto de la red externa. No se ejecutaron Guardar, Eliminar ni Confirmar compra contra la base compartida.
- `readyMs`: acción de navegación hasta contenido principal visible y dos cuadros del navegador. `settledMs`: además espera las consultas secundarias iniciadas. La imagen del artículo es una fixture local; no se está midiendo la descarga de fotos reales.
- `Network` mide descarga de chunks; los mensajes de Metro miden su empaquetado. Una petición `.bundle` incluye empaquetado, serialización y transferencia, por lo que su duración no es tiempo puro del compilador.
- React: `actualDuration` de las raíces mediante el hook de diagnóstico de DevTools, solo en el navegador de prueba. Está disponible en desarrollo. En producción normal no hay profiling de React; se informan `ScriptDuration` y `LayoutDuration` de Chrome, sin presentarlos como render React aislado.
- Red, scripting, render y layout pueden solaparse. Sus duraciones no deben sumarse como fases exclusivas.

Datos de cada recorrido, chunks y consultas: [performance-web-results.json](performance-web-results.json). Las capturas y archivos temporales quedan en `node_modules/.cache/soltapp-performance/`, excluido de Git.

**Producción local: navegación hasta contenido visible**

Milisegundos. «Reabrir detalle» significa abrirlo nuevamente desde Mis productos, después de haber vuelto al listado. Home se abre inicialmente mediante documento completo; las otras rutas se abren por navegación de la app. Mis productos es la entrada del recorrido e incluye el arranque compartido de la aplicación.

| Ruta | Primera antes | Primera después | Reabrir antes | Reabrir después |
| --- | ---: | ---: | ---: | ---: |
| Home | 691,1 | 684,7 | 53,9 | 45,5 |
| Mis productos | 1.275,3 | 1.260,4 | 54,6 | 44,0 |
| Detalle | 706,2 | 729,1 | 328,2 | 335,0 |
| Editar | 885,9 | 709,9 | 568,6 | 351,2 |
| Carrito | 629,1 | 645,0 | 334,0 | 332,1 |
| Chat | 400,5 | 408,3 | 105,3 | 95,5 |

Las diferencias pequeñas en Home, primera apertura de Detalle, Carrito y Chat no demuestran una mejora de rendimiento. La corrección comprobada en Editar elimina peticiones repetidas y ejecuta las dos lecturas independientes en paralelo.

| Caso específico | Antes | Después |
| --- | ---: | ---: |
| Detalle visible al volver de Editar | 296,8 ms | 71,6 ms |
| Detalle con consultas secundarias terminadas al volver | 499,7 ms | 489,9 ms |
| Evento de sesión de la misma cuenta en Mis productos | 506,0 ms; 1 consulta de productos | 25,0 ms; 0 consultas |
| Consultas iniciales de Mis productos | 2 productos + 2 usuario | 1 producto + 1 usuario |
| Consultas al reabrir Editar | 2 productos + 2 usuario | 1 producto + 1 usuario |

Al volver al detalle se mantiene el contenido ya cargado y se indica «Actualizando publicación…». Las acciones quedan deshabilitadas mientras se valida el producto. La mejora de 296,8 a 71,6 ms es de continuidad visual; no significa que los datos nuevos estén listos en 71,6 ms. Se sigue consultando al backend.

**Metro: exclusivo de desarrollo**

El mensaje «Bundling… app/edit-product.tsx» proviene de `expo-router/build/views/SuspenseFallback.js`: indica la carga de código de una ruta asíncrona, antes de que se ejecute la consulta de la pantalla. El Router instalado activa las rutas asíncronas web por defecto. Referencia: [documentación de rutas asíncronas de Expo](https://docs.expo.dev/router/web/async-routes/).

En producción se solicitaron chunks `.js` ya generados: **cero peticiones `.bundle` y cero compilaciones de Metro durante la navegación**. Por ejemplo, el chunk de Editar antes de los cambios se descargó en 32,4 ms en el servidor local; los 885,9 ms de apertura incluyen otras tareas y datos, no compilación.

Tiempos de empaquetado de la primera petición de cada chunk, observados en stdout de Metro:

| Ruta | Antes | Después | Nueva petición de chunk al reabrir por SPA |
| --- | ---: | ---: | --- |
| Home | 867 ms | 1.668 ms | No |
| Mis productos | 1.229 ms | 848 ms | No |
| Detalle | 755 ms | 836 ms | No |
| Editar | 646 ms | 1.446 ms | No |
| Carrito | 1.201 ms | 700 ms | No |
| Chat | 2.140 ms | 544 ms | No |

Estas dos corridas de desarrollo **no equivalen a una comparación con cachés frías idénticas**. Al iniciar la primera apareció `Unable to deserialize cloned data`, por lo que Metro reconstruyó su índice. Además se reinició el servidor de diagnóstico después de cambios de código. No se atribuyen las variaciones del compilador a una optimización del módulo.

Tiempos totales de desarrollo, incluyendo arranque/SSR/chunks/datos/render:

| Ruta | Primera antes | Primera después | Reabrir antes | Reabrir después |
| --- | ---: | ---: | ---: | ---: |
| Home | 5.779,5 ms | 6.179,4 ms | 98,2 ms | 76,1 ms |
| Mis productos | 36.381,3 ms | 15.790,7 ms | 54,9 ms | 101,0 ms |
| Detalle | 2.047,5 ms | 1.984,3 ms | 411,4 ms | 418,8 ms |
| Editar | 1.753,7 ms | 2.272,7 ms | 560,2 ms | 366,2 ms |
| Carrito | 2.033,6 ms | 1.513,8 ms | 377,8 ms | 476,6 ms |
| Chat | 2.662,9 ms | 1.000,5 ms | 193,2 ms | 144,3 ms |

La primera entrada incluye trabajo compartido: antes se observaron 5.984 ms de entry web, 6.227 ms del renderizador de servidor y 17.497 ms del chunk SSR de Mis productos. No es una espera de Supabase. Una recarga completa del navegador vuelve a crear el contexto y solicita el arranque compartido; reabrir una ruta por la navegación SPA no hizo eso.

Durante una corrida intermedia, después de cambios y Fast Refresh, Metro SSR también emitió `Requiring unknown module "858"`. Se descartó esa corrida para la verificación final y se reinició solo el servidor de diagnóstico. La corrida final de desarrollo pasó las verificaciones. No se modificó el framework ni se considera corregido ese problema de caché de desarrollo.

**Supabase real: consultas de solo lectura**

Se hicieron consultas anónimas contra los endpoints existentes, sin registrar contenido ni identificadores reales en el informe:

| Consulta | Muestras |
| --- | --- |
| Home, 7 publicaciones | 683,1 / 206,7 / 210,1 ms |
| Detalle | 239,1 / 209,9 / 204,7 ms |
| Opiniones | 235,6 ms; error de tabla no disponible |

`public.order_reviews` no está disponible en el schema cache de la base consultada. La app muestra el error de opiniones y conserva el artículo. No se crearon tablas ni se tocaron políticas. No se midió autenticación real ni escritura autenticada con las cuentas del grupo.

**Renderizado e imports**

El perfil de React en desarrollo no mostró un ciclo de render infinito durante los recorridos. Ejemplos de duración acumulada de render por navegación:

| Navegación | Antes | Después |
| --- | ---: | ---: |
| Primera apertura de Detalle | 223,1 ms | 189,0 ms |
| Primera apertura de Editar | 71,0 ms | 60,9 ms |
| Reabrir Editar | 23,7 ms | 32,3 ms |

La reducción de espera de Editar se explica principalmente por consultas y no por acelerar React. En producción, al reabrir Editar, el scripting de Chrome fue 20,7 → 19,2 ms, mientras que el contenido apareció en 568,6 → 351,2 ms.

El SVG `isotipo con fondo.svg` pesa 1.856.956 bytes y contiene dos veces el mismo PNG base64. En el detalle se reemplazó ese import por una imagen de 2.795 bytes, extraída y reducida a partir del recurso existente. No se alteró el SVG original ni sus consumidores ajenos al detalle.

- HTML estático de `/modal`: **1.907.381 → 50.720 bytes**, reducción del 97,3 %.
- Petición del chunk de detalle en desarrollo: **1.755.612 → 1.043.143 bytes** medidos por Chrome. No se equipara este tamaño con el tamaño fuente del SVG.
- El chunk compartido de producción sigue rondando 4,3 MB: Home y otras pantallas conservan sus imports. No se afirma haber reducido el peso global de la aplicación.
- Los imports de las cuatro pantallas del módulo apuntan directamente a `productService`; los tipos usan `import type`, evitando traer categorías, ubicación y otros servicios mediante el índice general.

**Cambios y verificación**

- Eventos de autenticación: la primera identidad observada fija la referencia. Renovaciones, recuperación inicial y refoco de la misma cuenta no recargan publicaciones. Cambiar de cuenta o cerrar sesión sí invalida los datos.
- Editar: usuario y producto se consultan en paralelo, con validación de propiedad antes de permitir guardar. La renovación de sesión conserva el borrador.
- Detalle: contenido conservado durante la actualización, acciones protegidas, errores visibles y progreso para opiniones/relacionados.
- Mis productos y Carrito: mensajes de carga de datos, además de sus indicadores.
- No se agregaron cachés de datos, precargas de rutas, cambios globales de Router ni cambios de dependencias.

Archivos de este diagnóstico: las cuatro pantallas `ProductDetailScreen`, `EditProductScreen`, `MyProductsScreen` y `CartScreen`; `src/utils/productAuthEvents.ts`; `assets/images/product-detail-mark.png`; `scripts/verify-products.cjs`; `scripts/measure-products-web.cjs`; este informe y el JSON de resultados.

Resultados:

- `npx tsc --noEmit`: pasó.
- `node --test scripts/verify-products.cjs`: 18 pruebas pasaron.
- `npx expo export --platform web`: pasó. Persiste la advertencia preexistente del favicon faltante.
- Tres recorridos de producción con verificaciones: pasaron, sin errores de página y sin escrituras.
- Un recorrido final de desarrollo con verificaciones: pasó, sin errores de página y sin escrituras.
- Se comprobaron navegación/reapertura de las seis rutas, conservación del borrador ante renovación de sesión y errores simulados de opiniones/lectura. No se probaron operaciones reales de guardado, eliminación ni compra.

**Cómo repetirlo**

Para revisar el build en Chrome sin Metro:

```powershell
npx expo export --platform web
npx expo serve --port 18762
```

Abrir `http://localhost:18762/home`. Este servidor usa el backend normal de la app; las operaciones de escritura deben reservarse para cuentas/publicaciones de prueba.

Para ejecutar las mediciones aisladas y las verificaciones, usando Chrome y Playwright que ya estaban disponibles en este equipo:

```powershell
node --test scripts/verify-products.cjs
node scripts/measure-products-web.cjs --label revision-prod --repeat 3 --static-dir dist --verify
```

El script inicia su servidor estático en 18762; detener antes cualquier otro servidor que use ese puerto. No instala paquetes ni añade Playwright a las dependencias de la app. En otro equipo, el arnés requiere disponer de Playwright y Chrome previamente.

Para medir desarrollo, usar otro puerto libre:

```powershell
npx expo start --port 18765
node scripts/measure-products-web.cjs --label revision-dev --url http://localhost:18765 --verify
```

Conviene comparar recorridos de producción para juzgar la experiencia final. Las cifras de este informe describen este equipo, fixtures y servidor local; no garantizan tiempos equivalentes en celulares físicos o redes móviles.
