import { Platform } from 'react-native';
import { createURL } from 'expo-linking';
import Constants from 'expo-constants';
import { getExpoGoProjectConfig, isRunningInExpoGo } from 'expo';

/**
 * Obtiene dinámicamente la URL de redirección (callback) adecuada según el entorno:
 * - Web: mismo origen y puerto que inició el login (la sesión es por origen).
 * - Aplicación Móvil Nativa (soltapp://home o soltapp://auth/callback)
 * - Entorno de desarrollo Expo Go
 */
export function getAuthRedirectUri(path: string = 'home'): string {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/${path.replace(/^\/+/, '')}`;
    }
  }

  // El cliente observado informa Constants como app nativa aun dentro de Expo Go.
  // Detectar el módulo ExpoGo y conservar el host/puerto reales del proyecto.
  if (Platform.OS !== 'web' && isRunningInExpoGo()) {
    const host = getExpoGoProjectConfig()?.debuggerHost || Constants.expoConfig?.hostUri;
    if (!host) throw new Error('No se pudo determinar el servidor de Expo Go. Volvé a abrir el proyecto desde su QR.');
    const server = new URL(host.includes('://') ? host : `http://${host}`);
    if (!['http:', 'https:'].includes(server.protocol) || server.username || server.password) {
      throw new Error('El servidor de Expo Go no tiene una dirección válida. Volvé a abrir el proyecto desde su QR.');
    }
    return `${server.protocol === 'https:' ? 'exps' : 'exp'}://${server.host}/--/${path.replace(/^\/+/, '')}`;
  }

  // Equivale a makeRedirectUri({ scheme, path }) en los builds nativos. Usar Linking
  // evita importar PKCE/expo-crypto para una operación que solo construye una URI.
  return createURL(path, {
    scheme: 'soltapp',
  });
}

/** No expone tokens ni códigos OAuth en mensajes o logs. */
export function getAuthCallbackError(url: string): string | null {
  const parsed = new URL(url);
  const query = parsed.searchParams;
  const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ''));
  const code = query.get('error_code') || fragment.get('error_code') || query.get('error') || fragment.get('error');
  if (!code && !query.get('error_description') && !fragment.get('error_description')) return null;
  if (code === 'access_denied') return 'El inicio de sesión fue cancelado o rechazado por el proveedor.';
  return 'El proveedor no pudo completar el inicio de sesión. Volvé a intentarlo; si persiste, revisá las URLs de retorno autorizadas en Supabase.';
}

/** Acción explícita del usuario: elimina solo la sesión de este proyecto en este origen. */
export function resetWebAuthAccess(projectUrl: string) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const prefix = `sb-${new URL(projectUrl).hostname.split('.')[0]}-auth-token`;
  const keys = Array.from({ length: window.localStorage.length }, (_, index) => window.localStorage.key(index));
  keys.forEach(key => { if (key === prefix || key?.startsWith(prefix + '-')) window.localStorage.removeItem(key); });
  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(prefix) : null;
  channel?.postMessage({ event: 'SIGNED_OUT', session: null });
  channel?.close();
  window.location.replace(`${window.location.origin}/login`);
}
