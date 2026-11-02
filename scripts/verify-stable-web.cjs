// Servidor y Chrome aislado. No usa cuentas ni permite solicitudes a Supabase.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.SOLTAPP_TEST_URL || 'http://localhost:8081';
async function main() {
  const result = { base, tests: [], externalNetworkBlocked: true, realOAuthVerified: false };
  const health = await (await fetch(base + '/__soltapp/status')).json();
  assert.equal(health.mode, 'production');
  for (const route of ['/', '/login', '/auth/callback', '/home', '/modal', '/my-products', '/edit-product', '/cart', '/chat', '/order/11111111-1111-4111-8111-111111111111']) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get('content-type'), /text\/html/);
  }
  const slash = await fetch(base + '/auth/callback/?code=fixture-only', { redirect: 'manual' });
  assert.equal(slash.status, 307);
  assert.equal(slash.headers.get('location'), '/auth/callback?code=fixture-only');
  const missingAsset = await fetch(base + '/_expo/static/js/missing-fixture.js');
  assert.equal(missingAsset.status, 404);
  assert.ok(!(await missingAsset.text()).includes('<html'));
  result.tests.push('Rutas estáticas, ruta existente de compras dinámica, callback y 404 de recursos');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    let blockBundle = false;
    const localFailures = [];
    const pageErrors = [];
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin !== base) return route.abort();
      if (blockBundle && /\/_expo\/.*entry-.*\.js$/.test(url.pathname)) return route.abort();
      return route.continue();
    });
    const page = await context.newPage();
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('response', response => { const url = new URL(response.url()); if (url.origin === base && response.status() >= 400) localFailures.push(url.pathname); });
    for (const route of ['/', '/login', '/login/']) {
      await page.goto(base + route);
      await page.getByText('Logueate para continuar', { exact: true }).waitFor({ state: 'visible' });
      await page.getByText('Ingresá con google', { exact: true }).waitFor({ state: 'visible' });
      await page.waitForTimeout(300);
      assert.equal(new URL(page.url()).pathname, '/login');
      assert.equal(await page.locator('#soltapp-load-error').count(), 0);
    }
    assert.deepEqual(pageErrors, []);
    assert.deepEqual(localFailures, []);
    assert.ok(!await page.getByText(/Bundling\.\.\./).count());
    await page.reload();
    await page.getByText('Ingresá con google', { exact: true }).waitFor();
    result.tests.push('Login visible desde raíz, sin/con barra final y recarga; sin Metro ni recursos fallidos');
    await page.goto(base + '/auth/callback/#error=access_denied');
    await page.getByRole('alert').filter({ hasText: 'cancelado' }).waitFor();
    assert.equal(new URL(page.url()).pathname, '/auth/callback');
    assert.equal(new URL(page.url()).hash, '#error=access_denied');
    result.tests.push('Redirección con barra final conserva el fragmento OAuth ficticio y muestra cancelación');
    await page.goto(base + '/login');
    await page.getByText('Ingresá con google', { exact: true }).waitFor();
    blockBundle = true;
    await page.reload();
    await page.getByText('No pudimos cargar Soltapp', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Volver a cargar', exact: true }).waitFor();
    blockBundle = false;
    await page.getByRole('button', { name: 'Volver a cargar', exact: true }).click();
    await page.getByText('Ingresá con google', { exact: true }).waitFor();
    assert.equal(await page.locator('#soltapp-load-error').count(), 0);
    result.tests.push('Fallo real de descarga JS muestra recuperación; reintentar restaura el formulario');
    fs.mkdirSync('node_modules/.cache/soltapp-auth-chat', { recursive: true });
    fs.writeFileSync('node_modules/.cache/soltapp-auth-chat/stable-web-results.json', JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
