-- Migration: 20261102_delete_unwanted_products.sql
-- Description: Eliminar publicaciones no deseadas (caballo pensante y naonken)

DELETE FROM public.product_images
WHERE product_id IN (
  '762d4399-55f3-4b6c-b167-42cf0fbef783', -- caballo pensante
  '2cf38c5b-d51c-43e1-9a00-c229545a0b13'  -- naonken
);

DELETE FROM public.orders
WHERE product_id IN (
  '762d4399-55f3-4b6c-b167-42cf0fbef783', 
  '2cf38c5b-d51c-43e1-9a00-c229545a0b13'
);

DELETE FROM public.products
WHERE id IN (
  '762d4399-55f3-4b6c-b167-42cf0fbef783', -- caballo pensante
  '2cf38c5b-d51c-43e1-9a00-c229545a0b13'  -- naonken
);
