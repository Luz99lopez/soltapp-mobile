/**
 * Script para limpiar o migrar imágenes Base64 / Blobs en Supabase
 * Ejecutar con: node scripts/cleanup_base64_and_blobs.js
 */
const { createClient } = require('@supabase/supabase-js');
const { decode } = require('base64-arraybuffer');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mpfcbpvjinwfkkwpffey.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wZmNicHZqaW53Zmtrd3BmZmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3ODkzNTksImV4cCI6MjEwNTM2NTM1OX0.s8xPjB5dgSQMSf4LPkd-KtO06NGZ2CBwgK2mDBAki_s';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  console.log('--- Verificando imágenes en public.product_images ---');
  const { data: images, error } = await supabase.from('product_images').select('*');

  if (error) {
    console.error('Error al consultar product_images:', error);
    return;
  }

  console.log(`Total de imágenes encontradas: ${images?.length || 0}`);

  for (const img of (images || [])) {
    if (img.image_url.startsWith('data:image/')) {
      console.log(`[Base64 encontrado] Imagen ID ${img.id} en producto ${img.product_id}`);
      try {
        const matches = img.image_url.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const contentType = matches[1];
          const base64Data = matches[2];
          const ext = contentType.split('/')[1] === 'jpeg' ? 'jpg' : (contentType.split('/')[1] || 'jpg');
          const arrayBuffer = decode(base64Data);

          const fileName = `products/${img.product_id}/${Date.now()}_${img.position || 0}.${ext}`;

          const { error: upErr } = await supabase.storage
            .from('product-images')
            .upload(fileName, arrayBuffer, { contentType, upsert: false });

          if (!upErr) {
            const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
            console.log(` -> Subido a Storage con éxito: ${publicUrl}`);
            await supabase.from('product_images').update({ image_url: publicUrl }).eq('id', img.id);
          } else {
            console.warn(` -> No se pudo subir por permisos RLS (ejecutar SQL con service_role en Dashboard):`, upErr.message);
          }
        }
      } catch (e) {
        console.error('Error migrando imagen:', e);
      }
    } else if (img.image_url.startsWith('blob:')) {
      console.log(`[Blob local caducado encontrado] Imagen ID ${img.id} en producto ${img.product_id}`);
    } else {
      console.log(`[URL válida] Imagen ID ${img.id}: ${img.image_url.slice(0, 70)}...`);
    }
  }

  console.log('--- Proceso finalizado ---');
}

run();
