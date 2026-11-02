// Diagnóstico reproducible. Usa Playwright ya disponible en el entorno y Chrome instalado.
// No instala paquetes. Intercepta TODA la red externa; Supabase usa fixtures, sin escrituras.
// node scripts/measure-products-web.cjs --label before-dev --url http://localhost:18761
// node scripts/measure-products-web.cjs --label before-prod --static-dir node_modules/.cache/soltapp-performance/production-before
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const arg = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
let label = arg('--label', 'measurement');
const outputDirectory = path.resolve('node_modules/.cache/soltapp-performance');
const latency = Number(arg('--latency', '200'));
const ownId = '33333333-3333-4333-8333-333333333333';
const otherId = '44444444-4444-4444-8444-444444444444';
const userId = '22222222-2222-4222-8222-222222222222';
const image = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect fill="#3BD7C2" width="80" height="80"/></svg>');
const user = { id: userId, aud: 'authenticated', role: 'authenticated', email: 'benchmark@example.invalid', created_at: '2026-01-01T00:00:00Z', user_metadata: { full_name: 'Cuenta de prueba' }, app_metadata: { provider: 'email' } };
const tokenPart = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const access_token = `${tokenPart({ alg: 'HS256', typ: 'JWT' })}.${tokenPart({ sub: userId, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })}.test-signature`;
const session = { access_token, refresh_token: 'local-fixture-only', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user };
const source = fs.readFileSync('src/supabase.ts', 'utf8');
const projectUrl = source.match(/SUPABASE_URL\s*=.*?\|\|\s*'([^']+)'/)[1];
const storageKey = `sb-${new URL(projectUrl).hostname.split('.')[0]}-auth-token`;
const product = (id, seller, title) => ({ id, seller_id: seller, category_id: 1, title, description: 'Descripción de prueba de rendimiento.', price: 12500, currency: 'ARS', condition: 'bueno', status: 'activo', location: 'Ubicación de prueba', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', category: { id: 1, name: 'Categoría de prueba', slug: 'prueba', level: 0 }, images: [{ id: 'image-' + id, product_id: id, position: 0, is_cover: true, image_url: image }], product_images: [{ id: 'image-' + id, product_id: id, position: 0, is_cover: true, image_url: image }], seller: { id: seller, full_name: seller === userId ? 'Cuenta de prueba' : 'Otra cuenta de prueba', avatar_url: null } });
const products = [product(ownId, userId, 'Producto propio de prueba'), product(otherId, '55555555-5555-4555-8555-555555555555', 'Producto ajeno de prueba')];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function staticServer(root) {
  return http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let target = path.resolve(root, '.' + pathname);
    if (!target.startsWith(path.resolve(root) + path.sep) && target !== path.resolve(root)) { response.writeHead(403).end(); return; }
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
    if (!fs.existsSync(target)) target += '.html';
    if (!fs.existsSync(target)) { response.writeHead(404).end(); return; }
    const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.ttf': 'font/ttf', '.png': 'image/png', '.svg': 'image/svg+xml' };
    response.setHeader('Content-Type', types[path.extname(target)] || 'application/octet-stream');
    fs.createReadStream(target).pipe(response);
  });
}

async function main() {
  fs.mkdirSync(outputDirectory, { recursive: true });
  let server;
  let baseUrl = arg('--url', 'http://localhost:18762');
  if (arg('--static-dir')) {
    server = staticServer(path.resolve(arg('--static-dir')));
    await new Promise(resolve => server.listen(18762, '127.0.0.1', resolve));
    baseUrl = 'http://127.0.0.1:18762';
  }
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const report = { label, browser: browser.version(), viewport: { width: 390, height: 844 }, fixtureLatencyMs: latency, requests: [], stages: [], consoleErrors: [], blockedWrites: [] };
  let stage = 'bootstrap';
  let pending = 0;
  let failReviews = false;
  let failProducts = false;
  try {
    const context = await browser.newContext({ viewport: report.viewport, reducedMotion: 'reduce' });
    await context.addInitScript(({ storageKey, session }) => {
      localStorage.setItem(storageKey, JSON.stringify(session));
      window.__soltappFixtureSession = session;
      window.__soltappCommits = [];
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
        supportsFiber: true, renderers: new Map(),
        inject(renderer) { this.renderers.set(1, renderer); return 1; },
        onCommitFiberRoot(_id, root) { window.__soltappCommits.push({ at: performance.now(), duration: root.current.actualDuration ?? null }); },
        onCommitFiberUnmount() {}, onPostCommitFiberRoot() {}, checkDCE() {},
      };
    }, { storageKey, session });
    await context.route('**/*', async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin === new URL(baseUrl).origin || ['data:', 'blob:'].includes(url.protocol)) return route.continue();
      if (!url.hostname.endsWith('.supabase.co')) return route.abort();
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
        report.blockedWrites.push({ stage, method: request.method(), path: url.pathname });
        return route.fulfill({ status: 405, body: 'Benchmark: escrituras prohibidas' });
      }
      const started = performance.now();
      const record = { stage, path: url.pathname, query: url.searchParams.get('id') || url.searchParams.get('seller_id') || '', start: started };
      report.requests.push(record);
      pending++;
      await sleep(latency);
      if ((failReviews && url.pathname.endsWith('/order_reviews')) || (failProducts && url.pathname.endsWith('/products'))) {
        try { await route.fulfill({ status: 404, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ code: 'PGRST205', message: 'Error simulado de lectura' }) }); }
        finally { record.durationMs = performance.now() - started; pending--; }
        return;
      }
      let body = [];
      if (url.pathname === '/auth/v1/user') body = user;
      else if (url.pathname.endsWith('/products')) {
        let found = products;
        if (url.searchParams.has('id')) found = found.filter(p => 'eq.' + p.id === url.searchParams.get('id'));
        if (url.searchParams.has('seller_id')) found = found.filter(p => 'eq.' + p.seller_id === url.searchParams.get('seller_id'));
        body = url.searchParams.has('id') ? found[0] || null : found;
      } else if (url.pathname.endsWith('/users')) body = { id: userId, full_name: 'Cuenta de prueba', username: 'prueba' };
      else if (url.pathname.endsWith('/order_reviews')) body = [{ id: 'review-1', reviewer_id: 'buyer-test', rating: 5, comment: 'Opinión de prueba', created_at: '2026-01-01T00:00:00Z' }];
      else if (url.pathname.endsWith('/categories')) body = [products[0].category];
      try {
        await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'content-range': '0-0/1' }, body: JSON.stringify(body) });
      } finally { record.durationMs = performance.now() - started; pending--; }
    });
    const page = await context.newPage();
    page.on('pageerror', error => report.consoleErrors.push(error.message));
    const cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');
    await cdp.send('Network.enable');
    const network = new Map();
    report.bundles = [];
    cdp.on('Network.requestWillBeSent', event => {
      if (/\.bundle(?:\?|$)|\/_expo\/.*\.js/.test(event.request.url)) network.set(event.requestId, { stage, url: event.request.url.replace(baseUrl, ''), start: event.timestamp });
    });
    cdp.on('Network.loadingFinished', event => {
      const request = network.get(event.requestId);
      if (request) report.bundles.push({ ...request, durationMs: (event.timestamp - request.start) * 1000, bytes: event.encodedDataLength });
    });
    const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
    const ready = expression => page.waitForFunction(expression, undefined, { timeout: 90000 });
    const has = text => `document.body.innerText.includes(${JSON.stringify(text)})`;
    const detailReady = `location.pathname === '/modal' && ${has('Descripción de prueba de rendimiento.')}`;
    const editReady = `location.pathname === '/edit-product' && document.querySelector('input[aria-label="Título"]')?.value === 'Producto propio de prueba'`;
    const listReady = `location.pathname === '/my-products' && ${has('Producto propio de prueba')}`;
    async function measure(name, action, condition, fullNavigation = false) {
      stage = name;
      const started = performance.now();
      const before = fullNavigation ? {} : await metrics();
      const commitIndex = fullNavigation ? 0 : await page.evaluate(() => window.__soltappCommits?.length || 0);
      await action();
      try { await ready(condition); }
      catch (error) {
        report.failedStage = { name, body: (await page.locator('body').innerText()).slice(0,1800) };
        await page.screenshot({ path: path.join(outputDirectory, label + '-failure.png') });
        throw error;
      }
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const readyMs = performance.now() - started;
      const refreshingAtReady = await page.evaluate(() => document.body.innerText.includes('Actualizando publicación...'));
      // Espera secundaria fuera de readyMs para contar opiniones/consultas posteriores.
      await sleep(40);
      for (let i = 0; pending && i < 100; i++) await sleep(20);
      const after = await metrics();
      const commits = await page.evaluate(index => (window.__soltappCommits || []).slice(index), commitIndex);
      const requests = report.requests.filter(r => r.stage === name);
      const entry = { name, readyMs: +readyMs.toFixed(1), settledMs: +(performance.now() - started).toFixed(1), refreshingAtReady, productsQueries: requests.filter(r => r.path.endsWith('/products')).length, authQueries: requests.filter(r => r.path === '/auth/v1/user').length, reviewQueries: requests.filter(r => r.path.endsWith('/order_reviews')).length, commits: commits.length, reactRenderMs: commits.some(c => c.duration !== null) ? +commits.reduce((sum, c) => sum + (c.duration || 0), 0).toFixed(1) : null, scriptMs: +((after.ScriptDuration - (before.ScriptDuration || 0)) * 1000).toFixed(1), layoutMs: +((after.LayoutDuration - (before.LayoutDuration || 0)) * 1000).toFixed(1) };
      report.stages.push(entry);
      console.log(JSON.stringify(entry));
    }
    await measure('my-products:first', () => page.goto(baseUrl + '/my-products', { waitUntil: 'domcontentloaded', timeout: 120000 }), listReady, true);
    await measure('my-products:same-user-event', () => page.evaluate(key => { const channel = new BroadcastChannel(key); channel.postMessage({ event: 'SIGNED_IN', session: window.__soltappFixtureSession }); setTimeout(() => channel.close(), 100); }, storageKey), listReady);
    await measure('detail:first', () => page.getByRole('button').filter({ hasText: 'Producto propio de prueba' }).click(), detailReady);
    await page.screenshot({ path: path.join(outputDirectory, label + '-detail.png') });
    await measure('edit:first', () => page.getByText('Editar', { exact: true }).click(), editReady);
    await page.screenshot({ path: path.join(outputDirectory, label + '-edit.png') });
    await measure('detail:back', () => page.goBack(), detailReady);
    await measure('edit:reopen', () => page.getByText('Editar', { exact: true }).click(), editReady);
    await measure('detail:back-again', () => page.goBack(), detailReady);
    await measure('my-products:reopen', () => page.goBack(), listReady);
    await measure('detail:reopen', () => page.getByRole('button').filter({ hasText: 'Producto propio de prueba' }).click(), detailReady);
    await measure('home:first', () => page.goto(baseUrl + '/home', { waitUntil: 'domcontentloaded', timeout: 120000 }), has('Producto ajeno de prueba'), true);
    await measure('detail:other', () => page.getByText('Producto ajeno de prueba', { exact: true }).first().click(), detailReady);
    if (args.includes('--verify')) {
      const screen = page.getByTestId('product-detail-screen');
      const previousPadding = await screen.evaluate(element => {
        const previous = element.style.paddingBottom;
        element.style.paddingBottom = '48px'; // reserva inferior Android, emulada en Chrome
        return previous;
      });
      try {
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
        const [root, actions, navigation, offer, buy] = await Promise.all([
          screen.boundingBox(), page.getByTestId('product-actions').boundingBox(), page.getByTestId('product-navigation').boundingBox(),
          page.getByText('Hacer oferta', { exact: true }).boundingBox(), page.getByText('Comprar', { exact: true }).boundingBox(),
        ]);
        assert.ok(root && actions && navigation && offer && buy, 'Botonera y navegación visibles');
        assert.ok(actions.y + actions.height <= navigation.y + 1, 'La navegación no debe cubrir las acciones');
        assert.ok(navigation.y + navigation.height <= root.y + root.height - 48 + 1, 'La navegación respeta el margen del sistema');
        for (const button of [offer, buy]) assert.ok(button.y >= actions.y && button.y + button.height <= navigation.y + 1, 'Texto completo de ambos botones visible');
        report.detailFooter = { simulatedAndroidInset: 48, actions, navigation, offer, buy };
        await page.screenshot({ path: path.join(outputDirectory, label + '-detail-safe-area.png') });
      } finally { await screen.evaluate((element, padding) => { element.style.paddingBottom = padding; }, previousPadding); }
    }
    const cartReady = `location.pathname === '/cart' && ${has('Confirmar trato en persona')}`;
    await measure('cart:first', () => page.getByText('Comprar', { exact: true }).click(), cartReady);
    await measure('detail:back-cart', () => page.goBack(), detailReady);
    await measure('cart:reopen', () => page.getByText('Comprar', { exact: true }).click(), cartReady);
    await measure('detail:back-cart-again', () => page.goBack(), detailReady);
    const chatReady = `location.pathname === '/chat' && ${has('Producto ajeno de prueba')}`;
    await measure('chat:first', () => page.getByText('Hacer oferta', { exact: true }).click(), chatReady);
    await measure('detail:back-chat', () => page.goBack(), detailReady);
    await measure('chat:reopen', () => page.getByText('Hacer oferta', { exact: true }).click(), chatReady);
    await measure('detail:back-chat-again', () => page.goBack(), detailReady);
    await measure('home:reopen', () => page.goBack(), `location.pathname === '/home' && ${has('Producto ajeno de prueba')}`);
    await measure('detail:direct', () => page.goto(baseUrl + '/modal?productId=' + ownId, { waitUntil: 'domcontentloaded', timeout: 120000 }), detailReady, true);
    if (args.includes('--verify')) {
      const event = report.stages.find(s => s.name === 'my-products:same-user-event');
      assert.equal(event.productsQueries, 0, 'Una sesión de la misma cuenta no debe recargar productos');
      const edit = report.stages.find(s => s.name === 'edit:reopen');
      assert.equal(edit.productsQueries, 1, 'Reabrir Editar debe leer el producto una sola vez');
      assert.equal(edit.authQueries, 1, 'Reabrir Editar debe validar el usuario una sola vez');
      assert.ok(report.stages.find(s => s.name === 'detail:back').refreshingAtReady, 'El detalle debe seguir visible mientras se actualiza');
      await page.getByText('Editar', { exact: true }).click();
      await ready(editReady);
      await page.getByLabel('Título', { exact: true }).fill('Borrador sin guardar');
      const requestsBeforeEvent = report.requests.length;
      await page.evaluate(key => { const channel = new BroadcastChannel(key); channel.postMessage({ event: 'TOKEN_REFRESHED', session: window.__soltappFixtureSession }); setTimeout(() => channel.close(), 100); }, storageKey);
      await sleep(latency * 3);
      assert.equal(await page.getByLabel('Título', { exact: true }).inputValue(), 'Borrador sin guardar', 'Renovar el token debe conservar el borrador');
      assert.equal(report.requests.slice(requestsBeforeEvent).filter(r => r.path.endsWith('/products')).length, 0);
      failReviews = true;
      await measure('detail:missing-reviews', () => page.goto(baseUrl + '/modal?productId=' + ownId, { waitUntil: 'domcontentloaded' }), `location.pathname === '/modal' && ${has('No se pudieron cargar las opiniones de compradores.')}`, true);
      assert.ok(await page.getByText('Producto propio de prueba', { exact: true }).isVisible());
      failProducts = true;
      await measure('edit:read-error', () => page.getByText('Editar', { exact: true }).click(), `location.pathname === '/edit-product' && [...document.querySelectorAll('[role="alert"]')].some(element => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden')`);
      assert.ok(await page.getByRole('alert').filter({ visible: true }).isVisible(), 'Una lectura fallida debe mostrar su error');
      report.regressionsPassed = true;
    }
    if (args.includes('--production')) {
      assert.ok(!report.bundles.some(bundle => /\.bundle(?:\?|$)/.test(bundle.url)), 'Producción no debe solicitar compilaciones de Metro');
      assert.equal(await page.getByText(/Bundling\.\.\./).count(), 0);
      report.productionNavigationVerified = true;
    }
    assertNoWrites(report);
  } finally {
    fs.writeFileSync(path.join(outputDirectory, label + '.json'), JSON.stringify(report, null, 2));
    await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
  }
}

function assertNoWrites(report) {
  if (report.blockedWrites.length) throw new Error('Se bloqueó una escritura inesperada durante el diagnóstico.');
  assert.deepEqual(report.consoleErrors, [], 'La navegación no debe producir errores JavaScript');
}

(async () => {
  const baseLabel = label;
  const repeats = Number(arg('--repeat', '1'));
  for (let index = 1; index <= repeats; index++) {
    label = repeats > 1 ? `${baseLabel}-${index}` : baseLabel;
    await main();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
