// Chrome aislado; TODO Supabase/proveedor se intercepta. No usa cuentas ni escribe en la base.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.SOLTAPP_TEST_URL || 'http://localhost:18762';
const user = { id: '22222222-2222-4222-8222-222222222222', aud: 'authenticated', role: 'authenticated', email: 'fixture@example.invalid', created_at: '2026-01-01T00:00:00Z', app_metadata: {}, user_metadata: { full_name: 'Usuario de prueba OAuth' } };
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })}.fake-signature`;
const product = { id: '33333333-3333-4333-8333-333333333333', seller_id: user.id, title: 'Publicación de prueba OAuth', price: 12500, currency: 'ARS', status: 'activo', condition: 'bueno', created_at: '2026-01-01T00:00:00Z', images: [], category: null, seller: null };

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const result = { mockProvider: true, tests: [], externalRequestsSent: 0, callbackTarget: null };
  try {
    const newContext = async (stallRefresh = false) => {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      if (stallRefresh) {
        const source = fs.readFileSync('src/supabase.ts', 'utf8');
        const project = new URL(source.match(/SUPABASE_URL\s*=.*?\|\|\s*'([^']+)'/)[1]).hostname.split('.')[0];
        const expired = { user, access_token: token, refresh_token: 'expired-fixture', expires_at: Math.floor(Date.now() / 1000) - 120, expires_in: 0, token_type: 'bearer' };
        await context.addInitScript(({ key, value }) => {
          if (localStorage.getItem('@auth-test-initialized')) return;
          localStorage.setItem('@auth-test-initialized', 'true');
          localStorage.setItem(key, JSON.stringify(value));
          localStorage.setItem('@soltapp_meetup_orders', '[{"id":"fixture-order"}]');
        }, { key: 'sb-' + project + '-auth-token', value: expired });
      }
      await context.route('**/*', async route => {
        const u = new URL(route.request().url());
        if (u.origin === base || u.protocol === 'data:') return route.continue();
        if (!u.hostname.endsWith('.supabase.co')) return route.abort();
        if (stallRefresh && u.pathname === '/auth/v1/token') {
          await new Promise(resolve => setTimeout(resolve, 20000));
          try { await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ code: 'refresh_token_not_found', msg: 'Fixture refresh failed' }) }); } catch {}
          return;
        }
        if (u.pathname.endsWith('/authorize')) {
          result.callbackTarget = u.searchParams.get('redirect_to');
          assert.equal(result.callbackTarget, base + '/auth/callback');
          const hash = new URLSearchParams({ access_token: token, refresh_token: 'fake-refresh-token', expires_in: '3600', token_type: 'bearer', type: 'oauth' });
          return route.fulfill({ status: 302, headers: { location: result.callbackTarget + '#' + hash } });
        }
        let body = [];
        if (u.pathname === '/auth/v1/user') body = user;
        else if (u.pathname.endsWith('/products')) body = [product];
        else if (u.pathname.endsWith('/users')) body = { id: user.id, full_name: 'Usuario de prueba OAuth' };
        return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'content-range': '0-0/1' }, body: JSON.stringify(body) });
      });
      return context;
    };
    const context = await newContext();
    const page = await context.newPage();
    await page.goto(base + '/login');
    await page.getByText('Ingresá con google', { exact: true }).click();
    await page.waitForURL('**/home', { timeout: 30000 });
    result.tests.push('OAuth simulado retorna al callback del mismo puerto y valida la sesión');
    await page.getByText('Tú', { exact: true }).click();
    await page.getByText('Productos', { exact: true }).click();
    await page.getByText(product.title, { exact: true }).waitFor();
    await page.reload();
    await page.getByText(product.title, { exact: true }).waitFor();
    result.tests.push('Mis productos accesible después del retorno y después de recargar');
    await context.close();
    const empty = await newContext();
    const emptyPage = await empty.newPage();
    await emptyPage.goto(base + '/auth/callback');
    await emptyPage.getByRole('alert').waitFor();
    await emptyPage.waitForTimeout(2200);
    assert.equal(new URL(emptyPage.url()).pathname, '/auth/callback');
    result.tests.push('Sin sesión muestra error y no redirige a Home');
    const deniedPage = await empty.newPage();
    await deniedPage.goto(base + '/auth/callback#error=access_denied&error_description=cancelled');
    await deniedPage.getByRole('alert').filter({ hasText: 'cancelado' }).waitFor();
    result.tests.push('Cancelación del proveedor visible en pantalla');
    await empty.close();
    const stalled = await newContext(true);
    const stalledPage = await stalled.newPage();
    await stalledPage.goto(base + '/');
    await stalledPage.getByRole('alert').filter({ hasText: 'no respondió a tiempo' }).waitFor({ timeout: 25000 });
    await stalledPage.getByRole('button', { name: 'Restablecer acceso en este navegador', exact: true }).click();
    await stalledPage.getByText('Ingresá con google', { exact: true }).waitFor();
    assert.equal(await stalledPage.evaluate(() => localStorage.getItem('@soltapp_meetup_orders')), '[{"id":"fixture-order"}]');
    result.tests.push('La pantalla inicial abandona la espera de Auth y permite restablecer solo la sesión local');
    await stalled.close();
    console.log(JSON.stringify(result, null, 2));
    fs.mkdirSync('node_modules/.cache/soltapp-auth-chat', { recursive: true });
    fs.writeFileSync('node_modules/.cache/soltapp-auth-chat/auth-browser-results.json', JSON.stringify(result, null, 2));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
