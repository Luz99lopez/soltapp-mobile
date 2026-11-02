// Contratos nativos aislados: no abre Google, no usa cuentas ni escribe en Supabase.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, dependencies) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext('(function(require,module,exports){' + code + '\n})', { URL, URLSearchParams, Date, setTimeout, clearTimeout, __DEV__: true })(name => {
    if (!(name in dependencies)) throw new Error('Dependencia sin simular: ' + name);
    return dependencies[name];
  }, module, module.exports);
  return module.exports;
}

const redirect = 'exp://192.168.0.11:8083/--/home';
const secret = 'FIXTURE_SECRET_NEVER_LOG';
const session = { user: { id: 'fixture-user' } };
const implicit = redirect + '#access_token=' + secret + '&refresh_token=' + secret;
const ok = { data: { session }, error: null };
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

function fixture(overrides = {}) {
  const steps = [], calls = [], listeners = new Set();
  let activeListeners = 0;
  const auth = {
    signInWithOAuth: async input => {
      calls.push(['authorize', input]);
      return { data: { url: 'https://project.supabase.co/auth/v1/authorize?redirect_to=' + encodeURIComponent(input.options.redirectTo) }, error: null };
    },
    setSession: async input => { calls.push(['session', input]); return ok; },
    exchangeCodeForSession: async input => { calls.push(['exchange', input]); return ok; },
    ...overrides.auth,
  };
  const browser = { openAuthSessionAsync: async (...args) => { calls.push(['browser', args]); return { type: 'success', url: implicit }; }, ...overrides.browser };
  const service = load('src/services/nativeOAuthService.ts', {
    '../supabase': { supabase: { auth } },
    'react-native': { Platform: { OS: overrides.platform || 'android' } },
    'expo-web-browser': browser,
    'expo-linking': { addEventListener: (_event, callback) => {
      listeners.add(callback); activeListeners++;
      return { remove() { listeners.delete(callback); activeListeners--; } };
    } },
  });
  const run = (options = {}) => service.runNativeOAuth('google', redirect, {
    signal: new AbortController().signal, onStep: step => steps.push(step), requestTimeoutMs: 1000, browserTimeoutMs: 1000, ...options,
  });
  return { ...service, run, steps, calls, emit: url => listeners.forEach(fn => fn({ url })), listeners: () => activeListeners };
}

test('SDK instalado genera exp en Expo Go y soltapp en un build nativo (entorno simulado, implementación real)', () => {
  const platform = { OS: 'android', select: values => values.android };
  for (const [environment, expected] of [['storeClient', redirect], ['standalone', 'soltapp://home'], ['bare', redirect]]) {
    const inGo = environment !== 'standalone';
    const constants = { executionEnvironment: environment, expoConfig: { scheme: 'soltapp', ...(inGo ? { hostUri: '192.168.0.11:8083' } : {}) }, expoGoConfig: inGo ? { developer: {} } : null };
    const constantsModule = { __esModule: true, default: constants, ExecutionEnvironment: { StoreClient: 'storeClient', Standalone: 'standalone', Bare: 'bare' } };
    const schemes = load('node_modules/expo-linking/src/Schemes.ts', { 'expo-constants': constantsModule, 'expo-modules-core': { Platform: platform } });
    const linking = load('node_modules/expo-linking/src/createURL.ts', {
      'expo-constants': constantsModule, 'expo/internal/bundle-origin': { getBundleOrigin: () => 'http://192.168.0.11:8083' },
      './Schemes': schemes, './validateURL': { validateURL() {} },
    });
    const authSession = load('node_modules/expo-auth-session/src/AuthSession.ts', {
      'expo-constants': constantsModule, 'expo-linking': linking, 'expo-modules-core': { Platform: platform }, 'expo-web-browser': {},
      './AuthRequest': {}, './Discovery': {}, './SessionUrlProvider': { __esModule: true, default: {} },
    });
    const auth = load('src/utils/auth.ts', { 'react-native': { Platform: platform }, 'expo-linking': linking,
      'expo-constants': constantsModule, 'expo': { isRunningInExpoGo: () => inGo, getExpoGoProjectConfig: () => inGo ? { debuggerHost: '192.168.0.11:8083' } : null },
    });
    assert.equal(auth.getAuthRedirectUri('home'), expected);
    const previous = authSession.makeRedirectUri({ scheme: 'soltapp', path: 'home' });
    if (environment === 'bare') assert.equal(previous, 'soltapp://home'); // reproduce el retorno observado en Android
    else assert.equal(auth.getAuthRedirectUri('home'), previous);
  }
});

test('Expo Go conserva host dinámico, HTTPS y rutas; no inventa localhost si falta el host', () => {
  for (const [host, expected] of [
    ['192.168.0.11:8083', 'exp://192.168.0.11:8083/--/reset-password'],
    ['192-168-0-11.sslip.io:8083', 'exp://192-168-0-11.sslip.io:8083/--/reset-password'],
    ['https://preview.example.invalid', 'exps://preview.example.invalid/--/reset-password'],
  ]) {
    const auth = load('src/utils/auth.ts', { 'react-native': { Platform: { OS: 'android' } }, 'expo-linking': {},
      'expo-constants': {}, 'expo': { isRunningInExpoGo: () => true, getExpoGoProjectConfig: () => ({ debuggerHost: host }) },
    });
    assert.equal(auth.getAuthRedirectUri('reset-password'), expected);
  }
  const auth = load('src/utils/auth.ts', { 'react-native': { Platform: { OS: 'android' } }, 'expo-linking': {},
    'expo-constants': { default: {} }, 'expo': { isRunningInExpoGo: () => true, getExpoGoProjectConfig: () => null },
  });
  assert.throws(() => auth.getAuthRedirectUri('home'), /No se pudo determinar/);
});

test('implicit conserva redirectTo y solo declara éxito después de confirmar sesión', async () => {
  for (const diagnostics of [true, false]) {
    const f = fixture();
    assert.equal(await f.run(diagnostics ? {} : { onStep: undefined }), session);
    assert.equal(f.calls[0][1].options.redirectTo, redirect);
    assert.equal(f.calls[1][1][1], redirect);
    assert.equal(f.calls.filter(c => c[0] === 'session').length, 1);
    if (diagnostics) assert.equal(f.steps.at(-1).stage, 'session_established');
    else assert.equal(f.steps.length, 0);
    assert.equal(f.listeners(), 0);
    assert.ok(!JSON.stringify(f.steps).includes(secret));
  }
});

test('PKCE en query se conserva aunque exista fragmento, sin registrar el código', async () => {
  const f = fixture({ browser: { openAuthSessionAsync: async () => ({ type: 'success', url: redirect + '?code=' + secret + '#other=value' }) } });
  await f.run();
  assert.equal(f.calls.filter(c => c[0] === 'exchange').length, 1);
  assert.equal(f.calls.filter(c => c[0] === 'session').length, 0);
  assert.ok(!JSON.stringify(f.steps).includes(secret));
});

for (const type of ['cancel', 'dismiss', 'locked']) {
  test(`resultado ${type} da error visible, no éxito ni intercambio de sesión`, async () => {
    const f = fixture({ browser: { openAuthSessionAsync: async () => ({ type }) } });
    await assert.rejects(f.run(), { reason: 'cancelled' });
    assert.equal(f.calls.filter(c => ['session', 'exchange'].includes(c[0])).length, 0);
    assert.equal(f.listeners(), 0);
    assert.ok(f.steps.some(s => s.stage === 'browser_result' && s.detail === type));
  });
}

for (const [name, url, reason] of [
  ['Site URL anterior', 'http://10.100.0.105:8081/#access_token=' + secret, 'redirect'],
  ['ruta con prefijo parecido', redirect + '-otra#access_token=' + secret, 'redirect'],
  ['sin credenciales', redirect, 'credentials'],
  ['token incompleto', redirect + '#access_token=' + secret, 'credentials'],
  ['rechazo OAuth', implicit + '&error=access_denied&error_description=' + secret, 'provider'],
]) {
  test(`${name} no se confunde con un login exitoso`, async () => {
    const f = fixture({ browser: { openAuthSessionAsync: async () => ({ type: 'success', url }) } });
    await assert.rejects(f.run(), { reason });
    assert.ok(!JSON.stringify(f.steps).includes(secret));
    assert.equal(f.calls.filter(c => ['session', 'exchange'].includes(c[0])).length, 0);
    assert.equal(f.listeners(), 0);
  });
}

test('error de SDK que incluye secretos no pasa a logs ni a la UI', async () => {
  for (const result of [{ data: { session: null }, error: new Error(secret) }, { data: { session: null }, error: null }]) {
    const f = fixture({ auth: { setSession: async () => result } });
    await assert.rejects(f.run(), error => error.reason === 'session' && !error.message.includes(secret));
    assert.ok(!JSON.stringify(f.steps).includes(secret));
  }
});

test('URL de authorize ausente o con redirect_to incorrecto impide abrir el navegador', async () => {
  for (const url of [null, 'https://project.supabase.co/auth/v1/authorize?redirect_to=http://10.100.0.105:8081']) {
    const f = fixture({ auth: { signInWithOAuth: async () => ({ data: { url }, error: null }) } });
    await assert.rejects(f.run());
    assert.equal(f.calls.length, 0);
  }
});

test('timeout de preparación y sesión son acotados y no imprimen errores crudos', async () => {
  for (const method of ['signInWithOAuth', 'setSession']) {
    const f = fixture({ auth: { [method]: () => new Promise(() => {}) } });
    await assert.rejects(f.run({ requestTimeoutMs: 5 }), { reason: 'timeout' });
    assert.equal(f.listeners(), 0);
  }
});

test('timeout de navegador ignora retorno tardío y evita sesiones o navegadores duplicados', async () => {
  let release;
  let opens = 0;
  const f = fixture({ browser: { openAuthSessionAsync: () => { opens++; return new Promise(resolve => { release = resolve; }); } } });
  await assert.rejects(f.run({ browserTimeoutMs: 5 }), { reason: 'timeout' });
  assert.equal(f.listeners(), 0);
  await assert.rejects(f.run(), { reason: 'busy' });
  release({ type: 'success', url: implicit });
  await tick();
  assert.equal(opens, 1);
  assert.equal(f.calls.filter(c => c[0] === 'session').length, 0);
});

test('cancelación libera el observador propio; cerrar Chrome permite un nuevo intento', async () => {
  let release;
  const f = fixture({ browser: { openAuthSessionAsync: () => new Promise(resolve => { release = resolve; }) } });
  const controller = new AbortController();
  const pending = f.run({ signal: controller.signal });
  await tick();
  controller.abort();
  await assert.rejects(pending, { reason: 'cancelled' });
  assert.equal(f.listeners(), 0);
  release({ type: 'dismiss' });
  await tick();
  const retry = f.run();
  await tick();
  release({ type: 'success', url: implicit });
  assert.equal(await retry, session);
});

test('enlace inesperado se registra sin secretos y no establece sesión', async () => {
  let release;
  const f = fixture({ browser: { openAuthSessionAsync: () => new Promise(resolve => { release = resolve; }) } });
  const pending = f.run();
  await tick();
  f.emit('soltapp://home#access_token=' + secret);
  await assert.rejects(pending, { reason: 'redirect' });
  release({ type: 'dismiss' });
  assert.ok(f.steps.some(s => s.stage === 'link_received' && s.detail.includes('coincide=false')));
  assert.ok(!JSON.stringify(f.steps).includes(secret));
  assert.equal(f.listeners(), 0);
});

test('ubicaciones sanitizadas omiten tokens, códigos, userinfo y rutas desconocidas', () => {
  const f = fixture();
  for (const value of [
    `https://user:${secret}@example.invalid/auth/callback?code=${secret}#refresh_token=${secret}`,
    `https://example.invalid/${secret}`, 'not a URL ' + secret, 'javascript:' + secret,
  ]) assert.ok(!f.safeOAuthLocation(value).includes(secret));
  assert.equal(f.safeOAuthLocation(implicit), redirect);
});
