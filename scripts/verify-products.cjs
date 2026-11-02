// Pruebas locales con Supabase simulado. No abren conexiones ni modifican datos reales.
// Ejecutar: node --test scripts/verify-products.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  const requireMock = name => {
    if (!(name in dependencies)) throw new Error(`Dependencia sin simular: ${name}`);
    return dependencies[name];
  };
  vm.runInNewContext('(function(require,module,exports){' + code + '\n})', { console })(requireMock, module, module.exports);
  return module.exports;
}

function database(user, responses = [], rpcResponse = {}) {
  const calls = [];
  const supabase = {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    from(table) {
      assert.ok(responses.length, `Consulta inesperada: ${table}`);
      const response = responses.shift();
      const call = { table, operation: 'select', filters: [] };
      calls.push(call);
      const query = {
        select() { return query; },
        update(payload) { call.operation = 'update'; call.payload = payload; return query; },
        delete() { call.operation = 'delete'; return query; },
        insert(payload) { call.operation = 'insert'; call.payload = payload; return query; },
        eq(...args) { call.filters.push(['eq', ...args]); return query; },
        neq(...args) { call.filters.push(['neq', ...args]); return query; },
        in(...args) { call.filters.push(['in', ...args]); return query; },
        order() { return query; }, range() { return query; }, limit() { return query; },
        single() { return Promise.resolve(response); },
        maybeSingle() { return Promise.resolve(response); },
        then(resolve, reject) { return Promise.resolve(response).then(resolve, reject); },
      };
      return query;
    },
    async rpc(name, payload) { calls.push({ operation: 'rpc', name, payload }); return rpcResponse; },
  };
  return { supabase, calls };
}

const productService = db => load('src/services/productService.ts', {
  '../supabase': db,
  './storageService': { storageService: {} },
}).productService;

const buyerId = '11111111-1111-4111-8111-111111111111';
const sellerId = '22222222-2222-4222-8222-222222222222';
const productId = '33333333-3333-4333-8333-333333333333';

test('sesión inicial, renovación y refoco de la misma cuenta no recargan productos', () => {
  const { createProductUserChangeListener } = load('src/utils/productAuthEvents.ts');
  let reloads = 0;
  const listener = createProductUserChangeListener(() => reloads++);
  listener('INITIAL_SESSION', { user: { id: sellerId } });
  listener('TOKEN_REFRESHED', { user: { id: sellerId } });
  listener('SIGNED_IN', { user: { id: sellerId } });
  assert.equal(reloads, 0);
});

test('cambiar de cuenta o cerrar sesión sí invalida publicaciones', () => {
  const { createProductUserChangeListener } = load('src/utils/productAuthEvents.ts');
  let reloads = 0;
  const listener = createProductUserChangeListener(() => reloads++);
  listener('INITIAL_SESSION', { user: { id: sellerId } });
  listener('SIGNED_IN', { user: { id: buyerId } });
  listener('SIGNED_OUT', null);
  listener('SIGNED_OUT', null);
  assert.equal(reloads, 2);
});

test('iniciar sesión después de una sesión inicial vacía recarga publicaciones', () => {
  const { createProductUserChangeListener } = load('src/utils/productAuthEvents.ts');
  let reloads = 0;
  const listener = createProductUserChangeListener(() => reloads++);
  listener('INITIAL_SESSION', null);
  listener('SIGNED_IN', { user: { id: sellerId } });
  assert.equal(reloads, 1);
});

test('recuperar la sesión con SIGNED_IN antes de INITIAL_SESSION no duplica la carga inicial', () => {
  const { createProductUserChangeListener } = load('src/utils/productAuthEvents.ts');
  let reloads = 0;
  const listener = createProductUserChangeListener(() => reloads++);
  listener('SIGNED_IN', { user: { id: sellerId } });
  listener('INITIAL_SESSION', { user: { id: sellerId } });
  assert.equal(reloads, 0);
});

test('un cierre de sesión como primer evento invalida cualquier lectura en curso', () => {
  const { createProductUserChangeListener } = load('src/utils/productAuthEvents.ts');
  let reloads = 0;
  const listener = createProductUserChangeListener(() => reloads++);
  listener('SIGNED_OUT', null);
  assert.equal(reloads, 1);
});

test('precio argentino: miles, centavos y entradas inválidas', () => {
  const { formatProductPrice, parseProductPrice } = load('src/utils/productPresentation.ts');
  assert.equal(formatProductPrice(12500.5), '$ 12.500,5');
  assert.equal(formatProductPrice(12500, 'USD'), 'USD 12.500');
  assert.equal(parseProductPrice('12.500,50'), 12500.5);
  assert.equal(parseProductPrice('12500,50'), 12500.5);
  for (const input of ['', '-10', '1.23', '12,123', 'abc', 'Infinity']) assert.ok(Number.isNaN(parseProductPrice(input)));
});

test('Mis productos exige sesión y no consulta un vendedor simulado', async () => {
  const db = database(null);
  await assert.rejects(productService(db).getMyProducts(), /Iniciá sesión/);
  assert.equal(db.calls.length, 0);
});

test('Mis productos filtra por propietario real y excluye bajas lógicas', async () => {
  const db = database({ id: sellerId }, [{ data: [{ id: productId, images: [{ position: 1, is_cover: true, image_url: 'cover.jpg' }] }], count: 1, error: null }]);
  const items = await productService(db).getMyProducts();
  assert.ok(db.calls[0].filters.some(f => f[0] === 'eq' && f[1] === 'seller_id' && f[2] === sellerId));
  const statuses = db.calls[0].filters.find(f => f[0] === 'in' && f[1] === 'status')[2];
  assert.equal(statuses.join(','), 'activo,pausado,vendido');
  assert.equal(items[0].cover_image, 'cover.jpg');
});

test('editar un producto ajeno se rechaza antes de escribir', async () => {
  const db = database({ id: buyerId }, [{ data: { id: productId, seller_id: sellerId } }]);
  await assert.rejects(productService(db).updateProduct(productId, { title: 'Cambio' }), /autorización/);
  assert.ok(db.calls.every(c => c.operation === 'select'));
});

test('editar con precio inválido se rechaza antes de escribir', async () => {
  const db = database({ id: sellerId }, [{ data: { id: productId, seller_id: sellerId } }]);
  await assert.rejects(productService(db).updateProduct(productId, { price: -1 }), /mayor a cero/);
  assert.ok(db.calls.every(c => c.operation === 'select'));
});

test('eliminar usa baja lógica, verifica propietario y no borra imágenes', async () => {
  const db = database({ id: sellerId }, [
    { data: { id: productId, seller_id: sellerId } },
    { data: { id: productId }, error: null },
  ]);
  await productService(db).deleteProduct(productId);
  const update = db.calls.find(c => c.operation === 'update');
  assert.equal(update.payload.status, 'eliminado');
  assert.ok(update.filters.some(f => f[1] === 'seller_id' && f[2] === sellerId));
  assert.ok(db.calls.every(c => c.operation !== 'delete' && c.table !== 'product_images'));
  assert.equal(db.calls.length, 2); // No relee el producto después de ocultarlo.
});

test('eliminar una publicación ajena se rechaza antes de escribir', async () => {
  const db = database({ id: buyerId }, [{ data: { id: productId, seller_id: sellerId } }]);
  await assert.rejects(productService(db).deleteProduct(productId), /autorización/);
  assert.ok(db.calls.every(c => c.operation === 'select'));
});

test('una actualización sin filas afectadas informa el error de permisos/estado', async () => {
  const db = database({ id: sellerId }, [
    { data: { id: productId, seller_id: sellerId } }, { data: null, error: null },
  ]);
  await assert.rejects(productService(db).updateProduct(productId, { title: 'Cambio' }), /permisos/);
});

test('las opiniones se consultan para el vendedor y se informa una tabla no disponible', async () => {
  const db = database({ id: buyerId }, [{ data: null, error: { message: 'No existe order_reviews' } }]);
  await assert.rejects(productService(db).getSellerReviews(sellerId), /opiniones/);
  assert.equal(db.calls[0].table, 'order_reviews');
  assert.ok(db.calls[0].filters.some(f => f[1] === 'reviewed_user_id' && f[2] === sellerId));
});

function orderService(db) {
  return load('src/services/meetupOrderService.ts', {
    '../supabase': db,
    'react-native': { Platform: { OS: 'test' } },
    '@react-native-async-storage/async-storage': {},
    './accountService': { accountService: { getCurrentUser() { throw new Error('No usar cuentas simuladas en compra real'); } } },
  }).meetupOrderService;
}

test('comprar exige autenticación real', async () => {
  const db = database(null);
  await assert.rejects(orderService(db).createMeetupOrder(productId, sellerId, {}, { requireRemote: true }), /Iniciá sesión/);
  assert.equal(db.calls.length, 0);
});

test('no se puede comprar la publicación propia', async () => {
  const db = database({ id: sellerId }, [{ data: { id: productId, seller_id: sellerId, status: 'activo' } }]);
  await assert.rejects(orderService(db).createMeetupOrder(productId, sellerId, {}, { requireRemote: true }), /propia publicación/);
  assert.ok(db.calls.every(c => c.operation !== 'rpc'));
});

test('no se puede comprar un producto pausado', async () => {
  const db = database({ id: buyerId }, [{ data: { id: productId, seller_id: sellerId, status: 'pausado' } }]);
  await assert.rejects(orderService(db).createMeetupOrder(productId, sellerId, {}, { requireRemote: true }), /no está disponible/);
});

test('un error de la RPC no crea una compra demo ni notificaciones', async () => {
  const db = database({ id: buyerId, user_metadata: {} }, [{ data: { id: productId, seller_id: sellerId, status: 'activo' } }], { data: null, error: { message: 'RPC no disponible' } });
  const service = orderService(db);
  service.saveLocalOrder = () => { throw new Error('No debe guardar una demo'); };
  service.sendOrderNotification = () => { throw new Error('No debe notificar'); };
  await assert.rejects(service.createMeetupOrder(productId, sellerId, {}, { requireRemote: true }), /RPC no disponible/);
  assert.equal(db.calls.find(c => c.operation === 'rpc').payload.p_product_id, productId);
});
