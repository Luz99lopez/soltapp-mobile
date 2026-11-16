const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://mpfcbpvjinwfkkwpffey.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wZmNicHZqaW53Zmtrd3BmZmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3ODkzNTksImV4cCI6MjEwNTM2NTM1OX0.s8xPjB5dgSQMSf4LPkd-KtO06NGZ2CBwgK2mDBAki_s';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testUpload() {
  const filePath = 'C:/Users/nenri/OneDrive/Escritorio/soltapp-mobile/scripts/preview_candidates/Full-Face_Helmet_9274.jpg.jpg';
  const fileBuffer = fs.readFileSync(filePath);
  
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload('seed/test_helmet.jpg', fileBuffer, {
      contentType: 'image/jpeg',
      upsert: true
    });
    
  if (error) {
    console.error('Upload error:', error);
  } else {
    console.log('Upload success:', data);
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl('seed/test_helmet.jpg');
    console.log('Public URL:', urlData.publicUrl);
  }
}

testUpload();
