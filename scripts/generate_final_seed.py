import json
import re
import csv
from io import StringIO

# 1. Load verified URLs
from verify_52_final import urls as verified_urls

# 2. Load existing SQL to extract product rows and image IDs
sql_path = 'C:/Users/nenri/OneDrive/Escritorio/soltapp-mobile/scripts/reset_and_seed_50_products.sql'
with open(sql_path, encoding='utf-8', errors='ignore') as f:
    sql = f.read()

# Extract products
prod_block = re.search(r'INSERT INTO public\.products \([\s\S]*?\) VALUES\s*([\s\S]*?);', sql).group(1)
prod_lines = [l.strip() for l in prod_block.strip().split('\n') if l.strip().startswith('(')]

products = []
for idx, line in enumerate(prod_lines, 1):
    cleaned = line.rstrip(',;')
    if cleaned.startswith('(') and cleaned.endswith(')'):
        cleaned = cleaned[1:-1]
    reader = csv.reader(StringIO(cleaned), quotechar="'", skipinitialspace=True)
    items = list(reader)[0]
    
    # Ensure exactly 12 items
    if len(items) == 11:
        # duplicate created_at as updated_at
        items.append(items[-1])
    elif len(items) != 12:
        raise ValueError(f"Product {idx} has {len(items)} columns!")
    products.append(items)

print(f"Processed {len(products)} products, all have 12 columns.")

# Extract existing image IDs and timestamps
img_block = re.search(r'INSERT INTO public\.product_images \([\s\S]*?\) VALUES\s*([\s\S]*?);', sql).group(1)
img_lines = [l.strip() for l in img_block.strip().split('\n') if l.strip().startswith('(')]

images = []
for idx, line in enumerate(img_lines, 1):
    cleaned = line.rstrip(',;')
    if cleaned.startswith('(') and cleaned.endswith(')'):
        cleaned = cleaned[1:-1]
    reader = csv.reader(StringIO(cleaned), quotechar="'", skipinitialspace=True)
    items = list(reader)[0]
    img_id = items[0]
    prod_id = products[idx - 1][0]
    new_url = verified_urls[idx]
    pos = 0
    is_cover = 'true'
    # grab timestamp from product
    created_at = products[idx - 1][10]
    images.append([img_id, prod_id, new_url, pos, is_cover, created_at])

print(f"Processed {len(images)} images, all matched to 52 products.")

# 3. Build the final SQL script
sql_output = """-- ==============================================================================
-- SOLTAPP: Reseteo y Carga Masiva de 52 Publicaciones Multi-Categoría y Multi-Usuario
-- Con fotos 100% reales de Marketplace / MercadoLibre (Verificadas HTTP 200)
-- Ejecutar en: Supabase Dashboard -> SQL Editor (Rol Postgres / Superusuario)
-- ==============================================================================

BEGIN;

-- 1. Limpieza segura y en cascada de productos y tablas vinculadas
DO $$ 
BEGIN
  -- Desactivar triggers o borrar tablas dependientes en orden
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_messages') THEN
    EXECUTE 'DELETE FROM public.chat_messages';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_conversations') THEN
    EXECUTE 'DELETE FROM public.chat_conversations';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_reviews') THEN
    EXECUTE 'DELETE FROM public.order_reviews';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
    EXECUTE 'DELETE FROM public.reviews';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
    EXECUTE 'DELETE FROM public.order_items';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    EXECUTE 'DELETE FROM public.orders';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'favorites') THEN
    EXECUTE 'DELETE FROM public.favorites';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_images') THEN
    EXECUTE 'DELETE FROM public.product_images';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    EXECUTE 'TRUNCATE TABLE public.products CASCADE';
  END IF;
END $$;

-- 2. Inserción de 52 Publicaciones distribuidas entre usuarios y categorías
INSERT INTO public.products (
  id,
  seller_id,
  category_id,
  title,
  description,
  price,
  currency,
  condition,
  status,
  location,
  created_at,
  updated_at
) VALUES
"""

prod_row_strings = []
for p in products:
    # Escape single quotes in strings
    escaped = []
    for i, col in enumerate(p):
        if i in (2, 5): # category_id, price (numeric)
            escaped.append(str(col))
        else:
            safe_text = col.replace("'", "''")
            escaped.append(f"'{safe_text}'")
    prod_row_strings.append("  (" + ", ".join(escaped) + ")")

sql_output += ",\n".join(prod_row_strings) + ";\n\n"

sql_output += """-- 3. Inserción de Imágenes Reales Estilo Marketplace (1 imagen principal por producto)
INSERT INTO public.product_images (
  id,
  product_id,
  image_url,
  position,
  is_cover,
  created_at
) VALUES
"""

img_row_strings = []
for im in images:
    img_id, prod_id, url, pos, is_cov, c_at = im
    url_safe = url.replace("'", "''")
    row_str = f"  ('{img_id}', '{prod_id}', '{url_safe}', {pos}, {is_cov}, '{c_at}')"
    img_row_strings.append(row_str)

sql_output += ",\n".join(img_row_strings) + ";\n\n"

sql_output += """COMMIT;

-- 4. Verificación de Carga
SELECT 
  COUNT(*) AS total_productos_cargados,
  COUNT(DISTINCT seller_id) AS vendedores_distintos,
  COUNT(DISTINCT category_id) AS categorias_distintas,
  COUNT(DISTINCT location) AS ubicaciones_distintas
FROM public.products
WHERE status = 'activo';

SELECT 
  COUNT(*) AS total_imagenes_cargadas,
  COUNT(DISTINCT product_id) AS productos_con_imagen
FROM public.product_images;
"""

out_file1 = 'C:/Users/nenri/OneDrive/Escritorio/soltapp-mobile/scripts/reset_and_seed_50_products.sql'
out_file2 = 'C:/Users/nenri/OneDrive/Escritorio/soltapp-mobile/supabase/migrations/20261116_reset_and_seed_50_products.sql'

with open(out_file1, 'w', encoding='utf-8') as f:
    f.write(sql_output)

with open(out_file2, 'w', encoding='utf-8') as f:
    f.write(sql_output)

print("SQL files written successfully!")
