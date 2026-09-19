import { Platform } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';

/**
 * Obtiene dinámicamente la URL de redirección (callback) adecuada según el entorno:
 * - Producción Web / Dominio Personalizado (auth.soltapp.com.ar o EXPO_PUBLIC_AUTH_DOMAIN)
 * - Desarrollo Web (localhost:8081)
 * - Aplicación Móvil Nativa (soltapp://auth/callback)
 * - Entorno de desarrollo Expo Go (exp://.../--/auth/callback)
 */
export function getAuthRedirectUri(): string {
  // Dominio personalizado configurable por variable de entorno o fallback
  const customDomain = process.env.EXPO_PUBLIC_AUTH_DOMAIN || 'auth.soltapp.com.ar';

  if (Platform.OS === 'web') {
    // Si estamos en un navegador en producción o dominio personalizado
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return `https://${customDomain}/auth/callback`;
    }
    
    // Desarrollo local Web (localhost)
    if (typeof window !== 'undefined' && window.location.origin) {
      return `${window.location.origin}/auth/callback`;
    }
  }

  // Entorno Móvil (Expo Go / Standalone con scheme 'soltapp')
  return makeRedirectUri({
    scheme: 'soltapp',
    path: 'auth/callback',
  });
}
