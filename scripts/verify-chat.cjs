// Contrato de cliente con Supabase simulado. NO verifica RLS en PostgreSQL ni escribe en Supabase.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext('(function(require,module,exports){' + code + '\n})', { setTimeout, clearTimeout, AbortController })(name => {
    if (!(name in dependencies)) throw new Error('Dependencia sin simular: ' + name);
    return dependencies[name];
  }, module, module.exports);
  return module.exports;
}
const buyer = '11111111-1111-4111-8111-111111111111';
const seller = '22222222-2222-4222-8222-222222222222';
const outsider = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const productId = '33333333-3333-4333-8333-333333333333';
const conversationId = '44444444-4444-4444-8444-444444444444';
const conversation = { id: conversationId, product_id: productId, buyer_id: buyer, seller_id: seller };
const product = { id: productId, seller_id: seller, title: 'Fixture', status: 'activo', seller: { full_name: 'Vendedor de prueba' } };
function setup(userId = buyer, responses = [], rpc, authError) {
  const calls = [];
  const channel = { on(type, config, callback) { calls.push({ type, config, callback }); return channel; }, subscribe(callback) { channel.status = callback; return channel; } };
  const supabase = {
    auth: { getUser: async () => ({ data: { user: userId ? { id: userId } : null }, error: authError }) },
    from(table) {
      assert.ok(responses.length, 'Consulta inesperada: ' + table);
      const response = responses.shift();
      const query = { select() { return query; }, eq(key, value) { calls.push({ table, key, value }); return query; }, order() { return query; }, limit() { return query; }, or(value) { calls.push({ table, or: value }); return query; }, maybeSingle() { return Promise.resolve(response); }, then(resolve, reject) { return Promise.resolve(response).then(resolve, reject); } };
      return query;
    },
    rpc: async (name, payload) => { calls.push({ rpc: name, payload }); return rpc(name, payload); },
    channel: () => channel,
    removeChannel: async value => { calls.push({ removed: value === channel }); },
  };
  const service = load('src/services/chatService.ts', { '../supabase': { supabase }, './productService': { productService: { getProductById: async () => product } }, '../utils/chatRequest': load('src/utils/chatRequest.ts') }).chatService;
  return { service, calls, channel };
}

test('el chat exige un usuario autenticado real', async () => {
  await assert.rejects(setup(null).service.openContext({ productId }), /Iniciá sesión/);
});

test('una petición bloqueada termina con error recuperable y no se considera guardada', async () => {
  const { withChatTimeout, isRetryableChatError } = load('src/utils/chatRequest.ts');
  await assert.rejects(withChatTimeout(new Promise(() => {}), 5), error => error.name === 'ChatTimeoutError' && isRetryableChatError(error));
  assert.equal(await withChatTimeout(Promise.resolve('confirmado'), 50), 'confirmado');
  assert.equal(isRetryableChatError({ name: 'ChatBackendUnavailableError' }), false);
  assert.equal(isRetryableChatError({ name: 'ChatPermissionError' }), false);
  let aborted = false;
  const pending = new Promise(() => {});
  pending.abortSignal = signal => { signal.addEventListener('abort', () => { aborted = true; }); return pending; };
  await assert.rejects(withChatTimeout(pending, 5), error => error.name === 'ChatTimeoutError');
  assert.equal(aborted, true, 'Una consulta PostgREST bloqueada debe cancelar la petición local');
});
test('abrir un producto lee la identidad completa sin crear conversaciones ni mensajes', async () => {
  const { service, calls } = setup(buyer, [{ data: null }]);
  const context = await service.openContext({ productId });
  assert.equal(context.conversation, null);
  assert.ok(calls.some(c => c.key === 'buyer_id' && c.value === buyer));
  assert.ok(calls.some(c => c.key === 'seller_id' && c.value === seller));
  assert.ok(calls.every(c => !c.rpc));
});
test('el propietario debe responder desde una conversación existente', async () => {
  await assert.rejects(setup(seller).service.openContext({ productId }), /Buzón/);
});
test('una tabla ausente informa que el chat no está habilitado, sin fallback local', async () => {
  const { service } = setup(buyer, [{ data: null, error: { code: 'PGRST205' } }]);
  await assert.rejects(service.openContext({ productId }), /no está habilitado/);
});

test('una falla de red de Auth no se confunde con sesión inválida ni tabla ausente', async () => {
  const { service, calls } = setup(null, [], undefined, { name: 'AuthRetryableFetchError', status: 0 });
  await assert.rejects(service.openContext({ productId }), error => error.name === 'ChatNetworkError' && /Sin conexión/.test(error.message));
  assert.equal(calls.length, 0);
  await assert.rejects(setup(null, [], undefined, { status: 401 }).service.openContext({ productId }), error => error.name === 'ChatAuthError');
});

test('errores distinguen tabla, función, contrato, permiso y JWT sin filtrar detalles privados', async () => {
  const { chatFailure, isRetryableChatError } = load('src/utils/chatRequest.ts');
  for (const [code, name] of [['PGRST205', 'ChatTableUnavailableError'], ['PGRST202', 'ChatRpcUnavailableError'], ['PGRST200', 'ChatContractError'], ['PGRST204', 'ChatContractError'], ['42501', 'ChatPermissionError'], ['PGRST301', 'ChatAuthError']]) {
    const error = chatFailure({ code, message: 'PRIVATE_TOKEN' }, 'chat_conversations');
    assert.equal(error.name, name); assert.equal(error.code, code); assert.equal(error.source, 'chat_conversations');
    assert.equal(isRetryableChatError(error), false); assert.ok(!error.message.includes('PRIVATE_TOKEN'));
  }
  const { service } = setup(buyer, [{ data: null, error: { code: 'PGRST205' } }]);
  await assert.rejects(service.openContext({ productId }), error => error.name === 'ChatTableUnavailableError' && error.source === 'chat_conversations');
});
test('un tercero no puede abrir una conversación aunque la respuesta simulada la incluya', async () => {
  await assert.rejects(setup(outsider, [{ data: conversation }]).service.openContext({ conversationId }), /sin permiso/);
});
test('un tercero no llega a ejecutar la RPC de envío', async () => {
  const { service, calls } = setup(outsider, [{ data: conversation }]);
  await assert.rejects(service.sendMessage({ productId, conversationId, body: 'No autorizado', clientId: 'retry-12345' }), /sin permiso/);
  assert.ok(calls.every(c => !c.rpc));
});
test('rechaza cuerpo vacío e identificadores de conversación inválidos', async () => {
  await assert.rejects(setup().service.sendMessage({ productId, body: ' ', clientId: 'retry-12345' }), /hasta 4000/);
  await assert.rejects(setup().service.getMessages('incorrecto'), /inválido/);
});
test('enviar deriva la conversación del servidor y conserva el nonce en un reintento', async () => {
  const persisted = new Map();
  const message = { id: '55555555-5555-4555-8555-555555555555', conversation_id: conversationId, sender_id: buyer, body: 'Hola', created_at: '2026-10-30T00:00:00+00:00' };
  const { service, calls } = setup(buyer, [], (name, payload) => {
    if (name === 'chat_get_or_create_conversation') return { data: conversation };
    if (!persisted.has(payload.p_client_id)) persisted.set(payload.p_client_id, { ...message, client_id: payload.p_client_id });
    return { data: persisted.get(payload.p_client_id) };
  });
  const input = { productId, body: 'Hola', clientId: 'retry-12345' };
  const first = await service.sendMessage(input);
  const second = await service.sendMessage(input);
  assert.equal(first.message.id, second.message.id);
  assert.equal(persisted.size, 1);
  assert.ok(calls.filter(c => c.rpc === 'chat_send_message').every(c => c.payload.p_client_id === input.clientId));
});
test('un fallo de RPC se comunica y no se considera un envío guardado', async () => {
  const { service } = setup(buyer, [{ data: conversation }], () => ({ data: null, error: { code: 'PGRST202' } }));
  await assert.rejects(service.sendMessage({ productId, conversationId, body: 'Hola', clientId: 'retry-12345' }), error => error.name === 'ChatRpcUnavailableError' && error.source === 'chat_send_message');
});
test('historial y Realtime repetidos se deduplican por id y se ordenan', () => {
  const { mergeChatMessages } = load('src/utils/chatMessages.ts');
  const a = { id: 'a', created_at: '2026-10-30T10:00:00+00:00' };
  const b = { id: 'b', created_at: '2026-10-30T11:00:00+00:00' };
  const result = mergeChatMessages([b], [a, b]);
  assert.equal(result.map(row => row.id).join(','), 'a,b');
});
test('Realtime filtra la conversación y se elimina al cerrar la vista', () => {
  let received = 0;
  const { service, calls, channel } = setup();
  const cleanup = service.subscribeMessages(conversationId, () => received++, () => {});
  const listener = calls.find(call => call.type === 'postgres_changes');
  assert.equal(listener.config.filter, 'conversation_id=eq.' + conversationId);
  listener.callback({ new: { id: 'x', conversation_id: productId } });
  listener.callback({ new: { id: 'y', conversation_id: conversationId } });
  assert.equal(received, 1);
  assert.equal(typeof channel.status, 'function');
  cleanup();
  assert.ok(calls.some(call => call.removed));
});

test('Buzón suscribe solo comprador/vendedor y retira el canal al cerrar', () => {
  const { service, calls, channel } = setup();
  let status;
  const cleanup = service.subscribeInbox(buyer, () => {}, value => { status = value; });
  const filters = calls.filter(call => call.type === 'postgres_changes').map(call => call.config.filter);
  assert.equal(filters.join('|'), `buyer_id=eq.${buyer}|seller_id=eq.${buyer}`);
  channel.status('SUBSCRIBED'); assert.equal(status, 'SUBSCRIBED');
  cleanup(); assert.ok(calls.some(call => call.removed));
});
test('el orden conserva microsegundos incluso si REST y Realtime representan UTC distinto', () => {
  const { mergeChatMessages } = load('src/utils/chatMessages.ts');
  const result = mergeChatMessages([], [{ id: 'a', created_at: '2026-10-30T10:00:00.123999Z' }, { id: 'z', created_at: '2026-10-30T10:00:00.123001+00:00' }]);
  assert.equal(result.map(row => row.id).join(','), 'z,a');
});
test('la paginación de historial conserva fecha e id y rechaza cursores alterados', async () => {
  const { service, calls } = setup(buyer, [{ data: [] }]);
  await service.getMessages(conversationId, { created_at: '2026-10-30T10:00:00.123456+00:00', id: productId });
  assert.ok(calls.some(call => call.or?.includes('id.lt.' + productId)));
  await assert.rejects(setup(buyer, [{ data: [] }]).service.getMessages(conversationId, { created_at: 'x),id.gt.0', id: productId }), /Fecha/);
});
test('recupera mensajes posteriores con orden ascendente sin saltar fechas iguales', async () => {
  const { service, calls } = setup(buyer, [{ data: [] }]);
  await service.getNewMessages(conversationId, { created_at: '2026-10-30T10:00:00.123456+00:00', id: productId });
  assert.ok(calls.some(call => call.or?.includes('id.gt.' + productId)));
});
