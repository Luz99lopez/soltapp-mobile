// Prueba de UI con backend EN MEMORIA. No valida PostgreSQL/RLS real ni usa dos cuentas reales.
// Chrome/Playwright existentes, sin instalar dependencias. Toda la red externa está interceptada.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const base = process.env.SOLTAPP_TEST_URL || 'http://localhost:18762';
const buyerId = '11111111-1111-4111-8111-111111111111';
const sellerId = '22222222-2222-4222-8222-222222222222';
const outsiderId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const productId = '33333333-3333-4333-8333-333333333333';
const users = Object.fromEntries([[buyerId, 'Comprador de prueba'], [sellerId, 'Vendedor de prueba'], [outsiderId, 'Tercero de prueba']].map(([id, name]) => [id, { id, aud: 'authenticated', role: 'authenticated', email: id + '@example.invalid', created_at: '2026-01-01T00:00:00Z', user_metadata: { full_name: name }, app_metadata: {} }]));
const product = { id: productId, seller_id: sellerId, title: 'Artículo de prueba de chat', price: 12500, currency: 'ARS', status: 'activo', condition: 'bueno', created_at: '2026-01-01T00:00:00Z', category: null, images: [], product_images: [], seller: { id: sellerId, full_name: 'Vendedor de prueba' } };
const source = fs.readFileSync('src/supabase.ts', 'utf8');
const hostname = new URL(source.match(/SUPABASE_URL\s*=.*?\|\|\s*'([^']+)'/)[1]).hostname;
const storageKey = 'sb-' + hostname.split('.')[0] + '-auth-token';
const conversations = new Map();
const messages = new Map();
const sends = [];
const messageReads = new Map();
const conversationReads = new Map();
let loseResponse = false;
let schemaAvailable = true;
let failMessageReads = false;
let authMode = 'valid';
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const session = id => ({ user: users[id], access_token: `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: id, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })}.fake-signature`, refresh_token: 'fixture-only', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer' });
const participant = (row, id) => row && [row.buyer_id, row.seller_id].includes(id);
// El borrador en TextInput no es una burbuja guardada; tampoco contar vistas ocultas.
const message = (page, text) => page.getByText(text, { exact: true }).and(page.locator(':not(input):not(textarea)')).filter({ visible: true });

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const contexts = [];
  const result = { simulatedSessions: true, postgresRlsVerified: false, realtimeServerVerified: false, tests: [], storedMessageCount: 0 };
  try {
    async function open(id) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      contexts.push(context);
      await context.addInitScript(({ storageKey, value }) => localStorage.setItem(storageKey, JSON.stringify(value)), { storageKey, value: session(id) });
      await context.routeWebSocket('**/realtime/v1/websocket**', socket => socket.close());
      await context.route('**/*', async route => {
        const request = route.request();
        const u = new URL(request.url());
        if (u.origin === base || u.protocol === 'data:') return route.continue();
        if (!u.hostname.endsWith('.supabase.co')) return route.abort();
        let actor;
        try { actor = JSON.parse(Buffer.from((request.headers().authorization || '').split(' ')[1].split('.')[1], 'base64url').toString()).sub; } catch {}
        if (u.pathname.endsWith('/chat_messages')) messageReads.set(actor, (messageReads.get(actor) || 0) + 1);
        if (u.pathname.endsWith('/chat_conversations')) conversationReads.set(actor, (conversationReads.get(actor) || 0) + 1);
        const reply = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'content-range': '0-0/1' }, body: JSON.stringify(body) });
        if (u.pathname === '/auth/v1/user') {
          if (authMode === 'network') return route.abort('internetdisconnected');
          if (authMode === 'invalid') return reply({ code: 'bad_jwt', msg: 'Fixture invalid session' }, 401);
          return reply(users[actor] || { message: 'Sesión requerida' }, users[actor] ? 200 : 401);
        }
        if (u.pathname.startsWith('/rest/v1/chat_') || u.pathname.startsWith('/rest/v1/rpc/chat_')) {
          if (!schemaAvailable) return reply({ code: 'PGRST205', message: 'Chat no disponible en fixture' }, 404);
          if (!users[actor]) return reply({ code: '42501' }, 403);
        }
        if (u.pathname.endsWith('/rpc/chat_get_or_create_conversation')) {
          const input = request.postDataJSON();
          assert.equal(input.p_product_id, productId);
          if (actor === sellerId) return reply({ code: '42501' }, 403);
          const key = productId + ':' + actor + ':' + sellerId;
          if (!conversations.has(key)) conversations.set(key, { id: randomUUID(), product_id: productId, buyer_id: actor, seller_id: sellerId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
          return reply(conversations.get(key));
        }
        if (u.pathname.endsWith('/rpc/chat_send_message')) {
          const input = request.postDataJSON();
          const conversation = [...conversations.values()].find(c => c.id === input.p_conversation_id);
          if (!participant(conversation, actor)) return reply({ code: '42501' }, 403);
          sends.push({ actor, clientId: input.p_client_id, body: input.p_body });
          const key = conversation.id + ':' + actor + ':' + input.p_client_id;
          if (!messages.has(key)) {
            const now = new Date().toISOString();
            messages.set(key, { id: randomUUID(), conversation_id: conversation.id, sender_id: actor, client_id: input.p_client_id, body: input.p_body, created_at: now });
            conversation.updated_at = now;
          }
          if (loseResponse) { loseResponse = false; return route.abort('connectionreset'); }
          return reply(messages.get(key));
        }
        if (request.method() !== 'GET' && request.method() !== 'OPTIONS') throw new Error('Escritura inesperada interceptada: ' + u.pathname);
        if (u.pathname.endsWith('/products')) return reply(u.searchParams.has('id') ? product : [product]);
        if (u.pathname.endsWith('/chat_conversations')) {
          let rows = [...conversations.values()].filter(row => participant(row, actor));
          if (u.searchParams.has('id')) rows = rows.filter(row => 'eq.' + row.id === u.searchParams.get('id'));
          if (u.searchParams.has('product_id')) rows = rows.filter(row => 'eq.' + row.product_id === u.searchParams.get('product_id') && 'eq.' + row.buyer_id === u.searchParams.get('buyer_id'));
          const enriched = row => ({ ...row, product, last_messages: [...messages.values()].filter(m => m.conversation_id === row.id).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 1) });
          return reply(u.searchParams.has('id') || u.searchParams.has('product_id') ? (rows[0] ? enriched(rows[0]) : null) : rows.map(enriched));
        }
        if (u.pathname.endsWith('/chat_messages')) {
          if (failMessageReads) return route.abort('internetdisconnected');
          const id = (u.searchParams.get('conversation_id') || '').replace('eq.', '');
          const conversation = [...conversations.values()].find(c => c.id === id);
          let rows = participant(conversation, actor) ? [...messages.values()].filter(m => m.conversation_id === id) : [];
          const cursor = u.searchParams.get('or')?.match(/created_at\.(gt|lt)\.([^,]+),and\(created_at\.eq\.[^,]+,id\.(?:gt|lt)\.([^)]+)/);
          if (cursor) rows = rows.filter(row => {
            const order = row.created_at.localeCompare(cursor[2]) || row.id.localeCompare(cursor[3]);
            return cursor[1] === 'gt' ? order > 0 : order < 0;
          });
          const ascending = u.searchParams.get('order')?.startsWith('created_at.asc');
          rows.sort((a, b) => (ascending ? 1 : -1) * (a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id)));
          return reply(rows.slice(0, Number(u.searchParams.get('limit') || 50)));
        }
        if (u.pathname.endsWith('/users')) {
          const profile = id => ({ id, full_name: users[id]?.user_metadata.full_name || 'Participante' });
          return reply(u.searchParams.get('id')?.startsWith('in.') ? Object.keys(users).map(profile) : profile((u.searchParams.get('id') || '').replace('eq.', '') || actor));
        }
        return reply([]);
      });
      return { context, page: await context.newPage() };
    }
    async function send(page, text, method = 'button') {
      await page.waitForURL(url => url.pathname === '/chat');
      if (!await page.getByLabel('Mensaje', { exact: true }).isVisible()) await page.getByRole('button', { name: 'Chatea', exact: true }).click();
      await page.getByLabel('Mensaje', { exact: true }).fill(text);
      if (method === 'keyboard') await page.getByLabel('Mensaje', { exact: true }).press('Enter');
      else await page.getByRole('button', { name: 'Enviar mensaje', exact: true }).click();
    }
    const a = await open(buyerId);
    await a.page.goto(base + '/chat?productId=' + productId);
    await a.page.getByText('Todavía no hay mensajes. Podés iniciar la conversación.', { exact: true }).waitFor();
    assert.equal(conversations.size, 0);
    await a.page.getByRole('button', { name: 'Chatea', exact: true }).click();
    const composer = a.page.getByLabel('Mensaje', { exact: true });
    await composer.fill('Borrador');
    await composer.press('Shift+Enter');
    assert.equal(await composer.inputValue(), 'Borrador\n');
    await composer.dispatchEvent('keydown', { key: 'Enter', code: 'Enter', isComposing: true });
    assert.equal(sends.length, 0, 'Shift+Enter y composición IME no deben enviar');
    result.tests.push('Shift+Enter conserva el salto de línea y composición IME no envía');
    await send(a.page, 'Hola desde comprador', 'keyboard');
    await message(a.page, 'Hola desde comprador').waitFor();
    assert.equal(conversations.size, 1);
    assert.equal(sends.length, 1, 'Enter debe enviar una sola vez');
    await a.page.waitForTimeout(2200);
    assert.equal(messages.size, 1, 'No debe existir una respuesta automática');
    result.tests.push('Abrir no escribe; primer envío crea una conversación; sin respuestas automáticas');
    const b = await open(sellerId);
    await b.page.goto(base + '/home?tab=inbox');
    await b.page.getByText('Conversaciones', { exact: true }).waitFor();
    await b.page.getByRole('button').filter({ hasText: 'Hola desde comprador' }).filter({ visible: true }).click();
    await message(b.page, 'Hola desde comprador').waitFor();
    await send(b.page, 'Respuesta del vendedor');
    await message(b.page, 'Respuesta del vendedor').waitFor();
    await message(a.page, 'Respuesta del vendedor').waitFor({ timeout: 16000 });
    assert.equal(messages.size, 2);
    result.tests.push('Buzón del vendedor, respuesta y recepción en el comprador mediante sincronización');
    await b.page.getByRole('button', { name: 'Volver', exact: true }).click();
    await b.page.waitForURL(url => url.pathname === '/home');
    const readsAfterLeaving = messageReads.get(sellerId);
    await b.page.waitForTimeout(8500);
    assert.equal(messageReads.get(sellerId), readsAfterLeaving, 'No debe quedar el sondeo del chat abierto después de salir');
    await b.page.getByRole('button').filter({ hasText: 'Respuesta del vendedor' }).filter({ visible: true }).click();
    await b.page.waitForURL(url => url.pathname === '/chat');
    await message(b.page, 'Hola desde comprador').waitFor();
    result.tests.push('Salir del chat detiene lecturas de historial; volver conserva la conversación');
    failMessageReads = true;
    await a.page.evaluate(() => window.dispatchEvent(new Event('online')));
    await a.page.getByRole('alert').filter({ hasText: /Sin conexión|no respondió a tiempo/ }).waitFor({ timeout: 20000 });
    assert.equal(await message(a.page, 'Hola desde comprador').count(), 1);
    failMessageReads = false;
    await a.page.getByRole('button', { name: 'Actualizar conversación', exact: true }).click();
    await a.page.getByRole('alert').waitFor({ state: 'hidden' });
    assert.equal(await message(a.page, 'Respuesta del vendedor').count(), 1);
    result.tests.push('Desconexión visible conserva el historial; actualización recupera la conexión sin duplicados');
    const threadRow = [...conversations.values()][0];
    const backlogStart = Date.now();
    for (let index = 1; index <= 60; index++) {
      const clientId = 'backlog-' + index;
      messages.set(threadRow.id + ':' + sellerId + ':' + clientId, { id: randomUUID(), conversation_id: threadRow.id, sender_id: sellerId, client_id: clientId, body: 'Mensaje recuperado ' + index, created_at: new Date(backlogStart + index).toISOString() });
    }
    await message(a.page, 'Mensaje recuperado 60').waitFor({ timeout: 16000 });
    assert.equal(await a.page.getByText(/^Mensaje recuperado \d+$/).count(), 60);
    result.tests.push('Recuperación incremental de 60 mensajes con paginación y sin huecos');
    await a.context.close();
    const again = await open(buyerId);
    await again.page.goto(base + '/chat?productId=' + productId);
    await message(again.page, 'Mensaje recuperado 60').waitFor();
    await again.page.getByText('Cargar mensajes anteriores', { exact: true }).click();
    await message(again.page, 'Respuesta del vendedor').waitFor();
    assert.equal(await message(again.page, 'Hola desde comprador').count(), 1);
    result.tests.push('Otro contexto recupera el historial y carga mensajes anteriores a la primera página');
    loseResponse = true;
    await send(again.page, 'Reintento único');
    await again.page.getByRole('alert').waitFor();
    await again.page.getByRole('button', { name: 'Enviar mensaje', exact: true }).click();
    await again.page.getByLabel('Mensaje', { exact: true }).waitFor();
    await again.page.waitForFunction(() => document.querySelector('[aria-label="Mensaje"]').value === '');
    assert.equal([...messages.values()].filter(m => m.body === 'Reintento único').length, 1);
    assert.equal(sends.at(-1).clientId, sends.at(-2).clientId);
    assert.equal(await message(again.page, 'Reintento único').count(), 1);
    result.tests.push('Respuesta perdida y reintento conservan client_id; una sola fila y burbuja');
    await again.page.evaluate(key => {
      localStorage.removeItem(key);
      const channel = new BroadcastChannel(key);
      channel.postMessage({ event: 'SIGNED_OUT', session: null });
      setTimeout(() => channel.close(), 100);
    }, storageKey);
    await again.page.getByRole('alert').filter({ hasText: 'Iniciá sesión' }).waitFor();
    assert.equal(await message(again.page, 'Hola desde comprador').count(), 0);
    result.tests.push('Cerrar sesión limpia el historial visible y bloquea el envío');
    const c = await open(outsiderId);
    const id = [...conversations.values()][0].id;
    await c.page.goto(base + '/chat?conversationId=' + id);
    await c.page.getByRole('alert').waitFor();
    assert.equal(await message(c.page, 'Hola desde comprador').count(), 0);
    result.tests.push('Tercera sesión no ve historial privado en la simulación');
    for (const context of contexts) await context.close();
    schemaAvailable = false;
    const disabled = await open(buyerId);
    await disabled.page.goto(base + '/chat?productId=' + productId);
    await disabled.page.getByRole('alert').filter({ hasText: 'todavía no está habilitado' }).waitFor();
    assert.equal(await disabled.page.getByRole('button', { name: 'Iniciar sesión', exact: true }).count(), 0, 'Una tabla ausente no invalida la sesión');
    await disabled.page.getByText('Chatea', { exact: true }).click({ force: true });
    assert.equal(await disabled.page.getByLabel('Mensaje', { exact: true }).count(), 0);
    const unavailableReads = conversationReads.get(buyerId);
    await disabled.page.waitForTimeout(8500);
    assert.equal(conversationReads.get(buyerId), unavailableReads, 'Una tabla ausente no debe provocar sondeo repetitivo');
    const retryResponse = disabled.page.waitForResponse(response => new URL(response.url()).pathname.endsWith('/chat_conversations'));
    await disabled.page.getByRole('button', { name: 'Reintentar', exact: true }).click();
    await retryResponse;
    await disabled.page.getByRole('alert').filter({ hasText: 'todavía no está habilitado' }).waitFor();
    assert.ok(conversationReads.get(buyerId) > unavailableReads);
    result.tests.push('Sin tablas informa el bloqueo, no envía ni repite consultas; permite reintentar');
    await disabled.context.close();
    schemaAvailable = true;
    authMode = 'network';
    const disconnected = await open(buyerId);
    await disconnected.page.goto(base + '/chat?productId=' + productId);
    await disconnected.page.getByText('Sin conexión con el chat. Tu borrador se conserva.', { exact: true }).waitFor({ timeout: 20000 });
    assert.equal(await disconnected.page.getByRole('button', { name: 'Iniciar sesión', exact: true }).count(), 0);
    authMode = 'valid';
    await disconnected.page.evaluate(() => window.dispatchEvent(new Event('online')));
    await message(disconnected.page, 'Mensaje recuperado 60').waitFor({ timeout: 20000 });
    result.tests.push('Auth sin red muestra desconexión; reconectar recupera historial sin pedir otro login');
    await disconnected.context.close();
    authMode = 'invalid';
    const invalid = await open(buyerId);
    await invalid.page.goto(base + '/chat?productId=' + productId);
    await invalid.page.getByRole('alert').filter({ hasText: 'Iniciá sesión' }).waitFor();
    await invalid.page.getByRole('button', { name: 'Iniciar sesión', exact: true }).waitFor();
    assert.equal(await invalid.page.getByText('Sin conexión con el chat. Tu borrador se conserva.', { exact: true }).count(), 0);
    result.tests.push('JWT inválido pide autenticación y no informa tabla ausente ni desconexión');
    result.storedMessageCount = messages.size;
    fs.mkdirSync('node_modules/.cache/soltapp-auth-chat', { recursive: true });
    fs.writeFileSync('node_modules/.cache/soltapp-auth-chat/chat-browser-results.json', JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
