-- ==============================================================================
-- Script SQL para Limpieza y Reseteo de Publicaciones / Imágenes en Supabase
-- Ejecutar en: Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- OPICIÓN A: Eliminar únicamente imágenes inválidas (blobs temporales o base64 residuales)
DELETE FROM public.product_images
WHERE image_url LIKE 'blob:%' 
   OR image_url LIKE 'data:%';

-- OPICIÓN B: Truncar y limpiar por completo las publicaciones de prueba (Recomendado para empezar limpio)
TRUNCATE TABLE public.product_images, public.products CASCADE;

-- OPCIÓN C (Opcional): Insertar publicaciones mock con imágenes públicas reales alojadas en Storage o Unsplash
-- INSERT INTO public.products (id, seller_id, category_id, title, description, price, currency, condition, status, location)
-- VALUES ('7d071021-0a39-4d5d-a747-38a964bec972', 'ae23de33-f64e-4304-9fbe-eb536dc3cf3e', 6, 'iPhone 13 128GB Azul', 'Excelente estado con batería al 90%', 650000, 'ARS', 'como_nuevo', 'activo', 'Pilar');
-- 
-- INSERT INTO public.product_images (product_id, image_url, position, is_cover)
-- VALUES ('7d071021-0a39-4d5d-a747-38a964bec972', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab', 0, true);
