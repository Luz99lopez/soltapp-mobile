// Prueba de la selección de redirect de Auth sin iniciar Google ni crear sesiones.
// GET /verify con un tipo deliberadamente NO admitido: Supabase rechaza antes de
// buscar/verificar usuarios o emitir tokens. No seguir el Location de la respuesta.
// Referencia: supabase/auth internal/api/verify.go (Verify, verifyTokenHash) y
// internal/utilities/request.go (GetReferrer), también usado por OAuth.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
require('@expo/env').load(root, { silent: true });
const source = fs.readFileSync(path.join(root, 'src/supabase.ts'), 'utf8');
const base = process.env.EXPO_PUBLIC_SUPABASE_URL || source.match(/SUPABASE_URL\s*=.*?\|\|\s*'([^']+)'/)[1];
const native = process.argv[2];
if (!native || !(/^exps?:\/\/[^?#]+\/--\/home$/.test(native) || native === 'soltapp://home')) throw new Error('Indicar solo la URI nativa de home, sin query ni fragmento.');

function location(value) {
  if (!value) return null;
  const url = new URL(value);
  const safePath = ['', '/', '/home', '/--/home', '/auth/callback'].includes(url.pathname) ? url.pathname : '/[ruta omitida]';
  return url.protocol + '//' + url.host + safePath;
}

(async () => {
  const results = [];
  for (const target of [null, native, 'http://localhost:8081/auth/callback', 'http://192.168.0.11:8081/auth/callback', 'http://192.168.0.11:8083/auth/callback']) {
    const url = new URL('/auth/v1/verify', base);
    url.searchParams.set('type', 'soltapp_diagnostic_invalid_type');
    url.searchParams.set('token', 'not-a-real-verification-token');
    if (target) url.searchParams.set('redirect_to', target);
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
    const raw = response.headers.get('location');
    const returned = raw ? new URL(raw) : null;
    const params = returned ? new URLSearchParams(returned.hash.slice(1)) : new URLSearchParams();
    if (params.has('access_token') || params.has('refresh_token') || returned?.searchParams.has('code')) {
      throw new Error('Respuesta inesperada: prueba detenida sin registrar credenciales.');
    }
    const unsupportedTypeRejected = (params.get('error_description') || '').toLowerCase().includes('verification type');
    results.push({ requested: target ? location(target) : '[sin redirect_to]', status: response.status,
      returned: location(raw), unsupportedTypeRejected,
      interpreted: unsupportedTypeRejected && [302, 303].includes(response.status) });
    await response.body?.cancel();
  }
  const report = { testedAt: new Date().toISOString(), method: 'invalid verification type; redirect manual; no credentials or user identifiers',
    actualGoogleLoginTested: false, results };
  const directory = path.join(root, 'node_modules/.cache/soltapp-auth-chat');
  fs.mkdirSync(directory, { recursive: true });
  const suffix = native === 'soltapp://home' ? '-soltapp' : new URL(native).hostname.endsWith('.sslip.io') ? '-dns' : '';
  fs.writeFileSync(path.join(directory, `native-redirect-probe${suffix}.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})().catch(() => { console.error('No se completó la prueba de redirect. No se imprimieron respuestas ni credenciales.'); process.exitCode = 1; });
