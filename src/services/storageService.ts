import { Platform } from 'react-native';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../supabase';

export const PRODUCT_IMAGES_BUCKET = 'product-images';

/**
 * Convierte un URI local (file://, content://, blob: o data:) a un payload binario (ArrayBuffer o Blob)
 * garantizando compatibilidad total tanto en Web como en React Native nativo (iOS / Android / Expo Go).
 */
async function uriToUploadPayload(
  uri: string
): Promise<{ payload: Blob | ArrayBuffer; contentType: string; extension: string }> {
  // 1. Si es un Data URI en Base64
  if (uri.startsWith('data:')) {
    const matches = uri.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const contentType = matches[1];
      const base64Data = matches[2];
      const subtype = contentType.split('/')[1] || 'jpeg';
      const extension = subtype === 'jpeg' ? 'jpg' : subtype;
      const arrayBuffer = decode(base64Data);
      return { payload: arrayBuffer, contentType, extension };
    }
  }

  // 2. Si es un URI local (file://, content:// o blob:)
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const contentType = blob.type || 'image/jpeg';
    const subtype = contentType.split('/')[1] || 'jpeg';
    const extension = subtype === 'jpeg' ? 'jpg' : subtype.split('+')[0];

    // En Web podemos enviar el Blob directamente
    if (Platform.OS === 'web') {
      return { payload: blob, contentType, extension };
    }

    // En React Native móvil, convertir el blob a ArrayBuffer usando FileReader para máxima fiabilidad
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Si devuelve base64 Data URL
          const base64Part = reader.result.split(',')[1];
          if (base64Part) {
            resolve({
              payload: decode(base64Part),
              contentType,
              extension,
            });
            return;
          }
        } else if (reader.result instanceof ArrayBuffer) {
          resolve({
            payload: reader.result,
            contentType,
            extension,
          });
          return;
        }
        // Fallback al blob original
        resolve({ payload: blob, contentType, extension });
      };
      reader.onerror = (error) => {
        console.warn('[uriToUploadPayload] FileReader error, fallback to blob:', error);
        resolve({ payload: blob, contentType, extension });
      };
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('[uriToUploadPayload] Error procesando URI:', err);
    throw new Error(`No se pudo leer la imagen seleccionada: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Servicio para la gestión de archivos e imágenes en Supabase Storage
 */
export const storageService = {
  /**
   * Sube una imagen individual a Supabase Storage y retorna su URL pública accesible
   * @param uri URI local (file://, blob:, data:) o URL remota
   * @param folder Carpeta dentro del bucket (por defecto 'products')
   */
  async uploadProductImage(uri: string, folder: string = 'products'): Promise<string> {
    if (!uri) {
      throw new Error('URI de imagen no proporcionado');
    }

    // Si ya es una URL remota de Supabase Storage o CDN externo pública, no la volvemos a subir
    if (
      (uri.startsWith('https://') || uri.startsWith('http://')) &&
      !uri.startsWith('http://localhost') &&
      !uri.includes('127.0.0.1') &&
      !uri.startsWith('blob:')
    ) {
      return uri;
    }

    const { payload, contentType, extension } = await uriToUploadPayload(uri);

    // Identificador único: timestamp + hash aleatorio
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const fileName = `${folder}/${uniqueId}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(fileName, payload, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error(`[storageService.uploadProductImage] Error al subir ${fileName}:`, uploadError);
      throw new Error(`Error al subir imagen a Supabase Storage: ${uploadError.message}`);
    }

    // Obtener la URL pública del archivo subido
    const {
      data: { publicUrl },
    } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(fileName);

    if (!publicUrl) {
      throw new Error('No se pudo generar la URL pública de la imagen en Supabase Storage.');
    }

    return publicUrl;
  },

  /**
   * Sube múltiples imágenes secuencialmente o en paralelo y retorna sus URLs públicas
   * @param uris Lista de URIs locales de imágenes
   * @param folder Carpeta dentro del bucket
   */
  async uploadMultipleProductImages(uris: string[], folder: string = 'products'): Promise<string[]> {
    if (!uris || uris.length === 0) return [];

    const uploadPromises = uris.map((uri) => this.uploadProductImage(uri, folder));
    return Promise.all(uploadPromises);
  },
};
