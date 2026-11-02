import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from '../supabase';

type Provider = 'google' | 'facebook';
type Failure = 'prepare' | 'browser' | 'cancelled' | 'busy' | 'timeout' | 'redirect' | 'credentials' | 'provider' | 'session';
export type NativeOAuthStep = { stage: string; elapsedMs: number; detail: string };

export class NativeOAuthError extends Error {
  constructor(public readonly reason: Failure, message: string) {
    super(message);
    this.name = 'NativeOAuthError';
  }
}

// Android's WebBrowser polyfill cannot be dismissed programmatically. Keep its promise
// until Chrome closes, even if our UI timeout/cancellation has already completed.
let pendingBrowser: Promise<WebBrowser.WebBrowserAuthSessionResult> | null = null;

/** Never return query, fragment, userinfo or an unrecognized path to a log/UI. */
export function safeOAuthLocation(value: string): string {
  try {
    const url = new URL(value);
    if (!['http:', 'https:', 'exp:', 'exps:', 'soltapp:'].includes(url.protocol)) return '[URI no reconocida]';
    const path = ['/', '', '/home', '/--/home', '/auth/callback', '/callback', '/auth/v1/authorize', '/auth/v1/callback'].includes(url.pathname)
      ? url.pathname : '/[ruta omitida]';
    return `${url.protocol}//${url.host}${path}`;
  } catch { return '[URI inválida]'; }
}

function sameDestination(actual: string, expected: string) {
  try {
    const a = new URL(actual), b = new URL(expected);
    return !a.username && !a.password && a.protocol === b.protocol && a.host === b.host && a.pathname === b.pathname;
  } catch { return false; }
}

function callbackParams(value: string) {
  const url = new URL(value);
  const params = new URLSearchParams(url.search);
  new URLSearchParams(url.hash.replace(/^#/, '')).forEach((v, k) => params.set(k, v));
  return params;
}

export async function runNativeOAuth(provider: Provider, redirectTo: string, options: {
  signal: AbortSignal;
  onStep?: (step: NativeOAuthStep) => void;
  requestTimeoutMs?: number;
  browserTimeoutMs?: number;
}) {
  const started = Date.now();
  const report = (stage: string, detail: string) => options.onStep?.({ stage, detail, elapsedMs: Date.now() - started });
  const cancelled = () => new NativeOAuthError('cancelled', 'Inicio de sesión cancelado. Si el navegador sigue abierto, cerrá su pestaña con X y volvé a intentar.');
  const assertActive = () => { if (options.signal.aborted) throw cancelled(); };
  const requestMs = options.requestTimeoutMs ?? 15000;
  const browserMs = options.browserTimeoutMs ?? 120000;

  async function wait<T>(operation: () => Promise<T>, milliseconds: number, stage: 'prepare' | 'browser' | 'session'): Promise<T> {
    assertActive();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let abort: () => void = () => {};
    const deadline = Date.now() + milliseconds;
    const timeout = () => new NativeOAuthError('timeout', stage === 'browser'
      ? 'Google no regresó a Soltapp a tiempo. Cerrá la pestaña del navegador con X, volvé a la app y reintentá. Revisá el destino de retorno del navegador.'
      : stage === 'session' ? 'Supabase no terminó de establecer la sesión a tiempo. Revisá la conexión y volvé a intentar.'
        : 'No se pudo preparar el inicio de sesión a tiempo. Revisá la conexión y volvé a intentar.');
    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(() => reject(timeout()), milliseconds);
          abort = () => reject(cancelled());
          options.signal.addEventListener('abort', abort, { once: true });
          if (options.signal.aborted) abort();
        }),
      ]);
      assertActive();
      // Android may suspend JS timers while Chrome is in the foreground.
      if (Date.now() > deadline) throw timeout();
      return result;
    } catch (error) {
      if (error instanceof NativeOAuthError) throw error;
      throw new NativeOAuthError(stage, stage === 'session'
        ? 'Supabase rechazó o no pudo establecer la sesión. Volvé a intentar.'
        : stage === 'browser' ? 'No se pudo abrir o completar el navegador. Cerrá la pestaña de Google y reintentá.'
          : 'No se pudo preparar el acceso a Google. Revisá la conexión y reintentá.');
    } finally {
      if (timer) clearTimeout(timer);
      options.signal.removeEventListener('abort', abort);
    }
  }

  try {
    assertActive();
    if (pendingBrowser) throw new NativeOAuthError('busy', 'El intento anterior sigue abierto en el navegador. Cerrá esa pestaña con X, volvé a Soltapp y reintentá.');
    report('redirect_generated', safeOAuthLocation(redirectTo));
    report('authorize_start', provider);
    const { data, error } = await wait(() => supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
    }), requestMs, 'prepare');
    if (error || !data.url) throw new NativeOAuthError('prepare', 'Supabase no entregó una URL de autorización. Volvé a intentar.');

    const authorize = new URL(data.url);
    const requested = authorize.searchParams.get('redirect_to');
    report('authorize_ready', `redirect_to=${requested ? safeOAuthLocation(requested) : '[ausente]'}; coincide=${requested === redirectTo}`);
    if (requested !== redirectTo) throw new NativeOAuthError('redirect', 'La solicitud OAuth no contiene el retorno esperado para este dispositivo.');

    let listener: ReturnType<typeof Linking.addEventListener> | undefined;
    let result: WebBrowser.WebBrowserAuthSessionResult;
    try {
      const invalidReturn = new Promise<never>((_resolve, reject) => {
        listener = Linking.addEventListener('url', ({ url }) => {
          const matches = sameDestination(url, redirectTo);
          report('link_received', `${safeOAuthLocation(url)}; coincide=${matches}`);
          if (!matches) reject(new NativeOAuthError('redirect', 'El enlace recibido no coincide con el retorno de este dispositivo. Cerrá la pestaña de Google y reintentá.'));
        });
      });
      report('browser_waiting', 'Esperando openAuthSessionAsync');
      result = await wait(() => {
        pendingBrowser = Promise.resolve().then(() => WebBrowser.openAuthSessionAsync(data.url!, redirectTo)).then(
          value => { pendingBrowser = null; return value; },
          reason => { pendingBrowser = null; throw reason; },
        );
        return Promise.race([pendingBrowser, invalidReturn]);
      }, browserMs, 'browser');
    } finally {
      listener?.remove();
      if (pendingBrowser && Platform.OS === 'ios') {
        // iOS supports dismissal; Android requires the user to close Chrome's tab.
        try { WebBrowser.dismissAuthSession(); } catch { /* Remains guarded until settled. */ }
      }
    }

    const resultType = ['success', 'cancel', 'dismiss', 'opened', 'locked'].includes(result.type) ? result.type : 'otro';
    report('browser_result', resultType);
    if (result.type !== 'success') throw cancelled();
    report('return_received', safeOAuthLocation(result.url));
    if (!sameDestination(result.url, redirectTo)) throw new NativeOAuthError('redirect', 'Google volvió a un destino distinto al de Expo Go. No se intentó establecer una sesión.');
    const params = callbackParams(result.url);
    if (params.has('error') || params.has('error_code') || params.has('error_description')) {
      throw new NativeOAuthError('provider', 'El proveedor rechazó o canceló el acceso. Volvé a intentar; si persiste, revisá las URLs de retorno autorizadas con el responsable de Supabase.');
    }
    const code = params.get('code');
    const accessToken = params.get('access_token'), refreshToken = params.get('refresh_token');
    const method = code ? 'PKCE' : accessToken && refreshToken ? 'implicit' : 'ausentes';
    report('return_credentials', method);
    if (method === 'ausentes') throw new NativeOAuthError('credentials', 'El retorno no contiene las credenciales necesarias para iniciar sesión. Volvé a intentar.');
    report('session_start', method);
    const established = await wait(() => code
      ? supabase.auth.exchangeCodeForSession(code)
      : supabase.auth.setSession({ access_token: accessToken!, refresh_token: refreshToken! }), requestMs, 'session');
    if (established.error || !established.data.session?.user?.id) {
      throw new NativeOAuthError('session', 'Supabase no confirmó una sesión válida. Volvé a intentar.');
    }
    report('session_established', 'sesión confirmada=true');
    return established.data.session;
  } catch (reason) {
    const failure = reason instanceof NativeOAuthError ? reason : new NativeOAuthError('prepare', 'No se pudo completar el acceso. Volvé a intentar.');
    report('failed', failure.reason);
    throw failure;
  }
}
