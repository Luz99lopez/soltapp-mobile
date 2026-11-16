# Favoritos

La lista vive en Supabase y pertenece al usuario de **Supabase Auth**. El selector de usuarios simulados de `accountService` no cambia la sesión real ni permite leer favoritos de otras personas.

## Activar la base de datos

Ejecutar una sola vez `supabase/migrations/20261101_favorites.sql` en el SQL Editor del proyecto que usa `src/supabase.ts` (o la URL configurada en las variables de entorno).

La migración crea `public.favorites`, una clave única por usuario/producto, índices y políticas RLS para leer, agregar y quitar solamente los favoritos propios. Solo se pueden agregar productos activos que sean visibles para ese usuario. No modifica las políticas existentes de productos. Si ya existe una tabla con ese nombre, revisar su estructura antes de aplicar la migración; no eliminarla para resolver el error.

No se necesitan claves administrativas en la app. La aplicación usa su cliente Supabase habitual y la sesión autenticada.

## Comportamiento

- Menú inferior → Favoritos: listado con foto, título, precio, ubicación y botón para quitar.
- La búsqueda superior filtra por título o ubicación dentro de los favoritos.
- Los corazones de Inicio, detalle y Favoritos comparten el estado confirmado por la base.
- Al abrir Favoritos, volver a la app o deslizar para actualizar se consulta la lista de nuevo.
- Al cerrar sesión se vacía inmediatamente el estado local; las respuestas pendientes del usuario anterior se descartan.
- Sin sesión se solicita iniciar sesión. No hay favoritos simulados ni persistencia local alternativa.
- Los productos vendidos, pausados o no visibles se marcan como no disponibles, y se pueden quitar de la lista.
- Los productos borrados físicamente se eliminan de favoritos por la relación `ON DELETE CASCADE`.
- Un error de red conserva los corazones anteriores y ofrece un aviso/reintento.
- Se reemplazó el contador ficticio del detalle por “Guardar”/“Guardado”; no representa un total global de favoritos.

## Validación

Pruebas de estado, concurrencia y aislamiento (con repositorio simulado, sin escribir datos remotos):

```sh
node --test scripts/favorites.test.cjs
```

Comprobación manual después de aplicar el SQL:

1. Iniciar sesión con una cuenta real y guardar un producto desde Inicio.
2. Abrir el detalle: debe aparecer “Guardado”. Abrir Favoritos: debe aparecer el producto.
3. Recargar/cerrar y abrir la app: el producto debe seguir guardado.
4. Quitar desde Favoritos y comprobar que el corazón de Inicio y detalle se desmarca.
5. Iniciar sesión con una segunda cuenta real: no debe ver los favoritos de la primera.
6. Volver a la primera cuenta desde otro dispositivo: al actualizar, deben aparecer sus favoritos.
7. Cortar la conexión y probar un cambio: debe aparecer un error sin confirmar un guardado que no ocurrió.

Las pruebas locales no sustituyen la comprobación de RLS y persistencia en el proyecto Supabase real.
