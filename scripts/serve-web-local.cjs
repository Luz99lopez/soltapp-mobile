// Servidor del export web local. Usa el mismo middleware que Expo, sin instalar paquetes.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { createHash, randomUUID } = require('node:crypto');
const expoRequire = createRequire(require.resolve('expo/package.json'));
const send = createRequire(expoRequire.resolve('@expo/cli/package.json'))('send');

const dist = path.resolve(__dirname, '../dist');
const port = Number(process.argv[2] ?? 8081);
const projectRoot = path.resolve(__dirname, '..');
const statePath = path.join(projectRoot, '.soltapp-stable/server.json');
const managed = process.argv.includes('--managed');
const identity = { pid: process.pid, port, mode: 'production', projectHash: createHash('sha256').update(process.platform === 'win32' ? projectRoot.toLowerCase() : projectRoot).digest('hex'), instanceId: randomUUID(), startedAt: new Date().toISOString() };
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('Puerto inválido. Uso: node scripts/serve-web-local.cjs 8081');
}
for (const page of ['index.html', 'login.html', 'auth/callback.html']) {
  if (!fs.existsSync(path.join(dist, page))) {
    throw new Error('Falta el export de Soltapp. Ejecutá: npx expo export --platform web');
  }
}

// Reutilizar también los HTML de rutas dinámicas ya exportadas (p. ej. /order/[id]).
const dynamicPages = [];
function readDynamicPages(directory, prefix = '') {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || ['assets', '_expo'].includes(entry.name)) continue;
    const relative = prefix + '/' + entry.name;
    if (entry.isDirectory()) readDynamicPages(path.join(directory, entry.name), relative);
    else if (entry.name.endsWith('.html') && relative.includes('[')) {
      const route = relative.slice(0, -5);
      const pattern = route.split('/').map(part => /^\[\.\.\..+\]$/.test(part) ? '.+' : /^\[.+\]$/.test(part) ? '[^/]+' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('/');
      dynamicPages.push({ pattern: new RegExp('^' + pattern + '$'), file: relative });
    }
  }
}
readDynamicPages(dist);
function pageFile(pathname) {
  const html = path.resolve(dist, '.' + pathname + '.html');
  try { if (html.startsWith(dist + path.sep) && fs.statSync(html, { throwIfNoEntry: false })?.isFile()) return pathname + '.html'; } catch {}
  return dynamicPages.find(page => page.pattern.test(pathname))?.file;
}

const server = http.createServer((req, res) => {
  // Los exports sucesivos cambian los hashes de JS: evitar HTML/errores viejos en Chrome.
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    res.end();
    return;
  }

  let url;
  let pathname;
  try {
    url = new URL(req.url, 'http://localhost');
    pathname = decodeURIComponent(url.pathname);
    if (pathname.includes('\0')) throw new Error('Invalid path');
  } catch {
    res.writeHead(400);
    res.end('URL inválida');
    return;
  }

  if (pathname === '/__soltapp/status') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(identity));
    return;
  }

  // Expo exporta /login como login.html; su servidor no resuelve /login/.
  // Canonizar solo páginas existentes, conservando la query del retorno OAuth.
  if (pathname !== '/' && pathname.endsWith('/')) {
    const canonical = pathname.replace(/\/+$/, '');
    if (pageFile(canonical)) {
      res.writeHead(307, { Location: url.pathname.replace(/\/+$/, '') + url.search });
      res.end();
      return;
    }
  }

  send(req, pageFile(pathname) || url.pathname, { root: dist, index: 'index.html', extensions: ['html'], cacheControl: false })
    .on('error', error => {
      if (res.headersSent) { res.destroy(); return; }
      res.statusCode = error.status || 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(res.statusCode === 404 ? 'Ruta no encontrada en el build de Soltapp.' : 'No se pudo servir el build de Soltapp.');
    })
    .pipe(res);
});

server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? `El puerto ${port} está ocupado; no se detuvo ningún otro proceso.` : error.message);
  process.exitCode = 1;
});
server.listen(port, () => {
  if (managed) {
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, JSON.stringify(identity, null, 2));
  }
  console.log(`Soltapp producción local: http://localhost:${port}/login`);
  console.log(`Directorio: ${dist}`);
});
process.on('exit', () => {
  if (!managed) return;
  try { if (JSON.parse(fs.readFileSync(statePath, 'utf8')).instanceId === identity.instanceId) fs.unlinkSync(statePath); } catch {}
});
