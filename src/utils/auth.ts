import { Platform } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';

/**
 * Obtiene dinámicamente la URL de redirección (callback) adecuada según el entorno:
 * - Producción Web / Dominio Personalizado (auth.soltapp.com.ar o EXPO_PUBLIC_AUTH_DOMAIN)
 * - Desarrollo Web (localhost:8081)
 * - Aplicación Móvil Nativa (soltapp://home o soltapp://auth/callback)
 * - Entorno de desarrollo Expo Go
 */
export function getAuthRedirectUri(path: string = 'home'): string {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
      const isLocalIp = /^10\./.test(hostname) || /^192\.168\./.test(hostname) || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) || hostname.endsWith('.local');

      // Si estamos en entorno de desarrollo local (localhost o IP de red local)
      if (isLocalhost || isLocalIp) {
        return `${window.location.origin}/${path}`;
      }

      // En producción web o dominio personalizado
      const customDomain = process.env.EXPO_PUBLIC_AUTH_DOMAIN || 'auth.soltapp.com.ar';
      return `https://${customDomain}/${path}`;
    }
  }

  // Entorno Móvil (Expo Go / Standalone con scheme 'soltapp')
  return makeRedirectUri({
    scheme: 'soltapp',
    path,
  });
}
