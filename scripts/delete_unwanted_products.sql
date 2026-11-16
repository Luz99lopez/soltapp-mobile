-- ==============================================================================
-- SOLTAPP: Eliminación definitiva de publicaciones y sus imágenes
-- Ejecutar en: Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Eliminar imágenes vinculadas a las publicaciones de la tabla product_images
DELETE FROM public.product_images
WHERE product_id IN (
  '762d4399-55f3-4b6c-b167-42cf0fbef783', -- caballo pensante
  '2cf38c5b-d51c-43e1-9a00-c229545a0b13'  -- naonken
);

-- 2. Eliminar cualquier orden huérfana vinculada si existiese
DELETE FROM public.orders
WHERE product_id IN (
  '762d4399-55f3-4b6c-b167-42cf0fbef783', 
  '2cf38c5b-d51c-43e1-9a00-c229545a0b13'
);

-- 3. Eliminar las publicaciones de la tabla products
DELETE FROM public.products
WHERE id IN (
  '762d4399-55f3-4b6c-b167-42cf0fbef783', -- caballo pensante
  '2cf38c5b-d51c-43e1-9a00-c229545a0b13'  -- naonken
);

-- 4. Verificación final: Debe retornar 0 registros
SELECT id, title, price, status 
FROM public.products 
WHERE id IN (
  '762d4399-55f3-4b6c-b167-42cf0fbef783', 
  '2cf38c5b-d51c-43e1-9a00-c229545a0b13'
);
