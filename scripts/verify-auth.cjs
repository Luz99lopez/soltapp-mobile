const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, dependencies = {}, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext('(function(require,module,exports){' + code + '\n})', { URL, URLSearchParams, ...globals })(name => {
    if (!(name in dependencies)) throw new Error('Dependencia sin simular: ' + name);
    return dependencies[name];
  }, module, module.exports);
  return module.exports;
}

function authUtils(origin, platform = 'web') {
  return load('src/utils/auth.ts', {
    'react-native': { Platform: { OS: platform } },
    'expo-linking': { createURL: (path, { scheme }) => `${scheme}://${path}` },
    'expo': { isRunningInExpoGo: () => false }, 'expo-constants': {},
  }, origin ? { window: { location: { origin } } } : {});
}

test('web conserva dominio, puerto y ruta del origen que inicia OAuth', () => {
  for (const origin of ['http://localhost:18762', 'http://localhost:8081', 'http://127.0.0.1:18762', 'https://soltapp.example']) {
    assert.equal(authUtils(origin).getAuthRedirectUri('auth/callback'), origin + '/auth/callback');
    assert.equal(authUtils(origin).getAuthRedirectUri('reset-password'), origin + '/reset-password');
  }
});

test('conserva el esquema y retorno móvil existentes', () => {
  assert.equal(authUtils(null, 'ios').getAuthRedirectUri('home'), 'soltapp://home');
});

test('errores OAuth se leen tanto de query como de fragmento sin mostrar tokens', () => {
  const { getAuthCallbackError } = authUtils('http://localhost:18762');
  for (const separator of ['?', '#']) {
    const message = getAuthCallbackError('http://localhost:18762/auth/callback' + separator + 'error=access_denied&access_token=SECRET&error_description=SECRET');
    assert.match(message, /cancelado/);
    assert.ok(!message.includes('SECRET'));
  }
  assert.equal(getAuthCallbackError('http://localhost:18762/auth/callback'), null);
});

function callback(auth) {
  return load('src/services/authCallbackService.ts', { '../supabase': { supabase: { auth } }, '../utils/auth': authUtils('http://localhost:18762') }).completeWebAuthCallback;
}

test('no declara login exitoso sin sesión ni consulta perfiles públicos', async () => {
  const complete = callback({ getSession: async () => ({ data: { session: null } }) });
  await assert.rejects(complete('http://localhost:18762/auth/callback'), /No se recibió una sesión/);
});

test('verifica al usuario de la sesión y evita un segundo intercambio del código', async () => {
  let validations = 0;
  const session = { user: { id: 'real-user-fixture' } };
  const complete = callback({
    getSession: async () => ({ data: { session } }),
    getUser: async () => { validations++; return { data: { user: session.user } }; },
    exchangeCodeForSession() { throw new Error('No se debe canjear el código dos veces'); },
  });
  assert.equal(await complete('http://localhost:18762/auth/callback?code=fixture'), session);
  assert.equal(validations, 1);
});

test('no acepta una sesión que Auth no puede validar', async () => {
  await assert.rejects(callback({ getSession: async () => ({ data: { session: {} } }), getUser: async () => ({ data: { user: null }, error: new Error('expired') }) })('http://localhost:18762/auth/callback'), /validar la sesión/);
});

test('un rechazo OAuth no se convierte en éxito por una sesión previa', async () => {
  await assert.rejects(callback({ getSession() { throw new Error('No debe llegar a una sesión anterior'); } })('http://localhost:18762/auth/callback#error=access_denied'), /cancelado/);
});

test('una espera de Auth tiene timeout y una respuesta normal conserva su resultado', async () => {
  const { withAuthTimeout } = load('src/utils/authTimeout.ts', {}, { setTimeout, clearTimeout });
  assert.equal(await withAuthTimeout(Promise.resolve('ok'), 50), 'ok');
  await assert.rejects(withAuthTimeout(new Promise(() => {}), 5), { name: 'AuthTimeoutError' });
});

test('restablecer acceso elimina solo las claves Auth del proyecto en el origen actual', () => {
  const saved = new Map([['sb-project-auth-token', 'session'], ['sb-project-auth-token-code-verifier', 'verifier'], ['@soltapp_meetup_orders', 'orders'], ['sb-other-auth-token', 'other-session']]);
  let redirect;
  const { resetWebAuthAccess } = load('src/utils/auth.ts', { 'react-native': { Platform: { OS: 'web' } }, 'expo-linking': {}, 'expo': {}, 'expo-constants': {} }, {
    window: { location: { origin: 'http://localhost:18762', replace: value => { redirect = value; } }, localStorage: { get length() { return saved.size; }, key: index => [...saved.keys()][index], removeItem: key => saved.delete(key) } },
  });
  resetWebAuthAccess('https://project.supabase.co');
  assert.equal(saved.has('sb-project-auth-token'), false);
  assert.equal(saved.get('@soltapp_meetup_orders'), 'orders');
  assert.equal(saved.get('sb-other-auth-token'), 'other-session');
  assert.equal(redirect, 'http://localhost:18762/login');
});
