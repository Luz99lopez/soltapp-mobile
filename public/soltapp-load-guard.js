// Se ejecuta antes del bundle: permite recuperar la pantalla si falla un recurso JS.
(function () {
  var ready = false;
  var failed = false;
  var timer = setTimeout(function () { if (!ready) showFailure(); }, 20000);
  window.addEventListener('soltapp:ready', function () { ready = true; clearTimeout(timer); });
  window.addEventListener('error', function (event) {
    if (event.target && event.target.tagName === 'SCRIPT') showFailure();
  }, true);
  function showFailure() {
    if (failed) return;
    if (!document.body) { document.addEventListener('DOMContentLoaded', showFailure, { once: true }); return; }
    failed = true;
    clearTimeout(timer);
    var panel = document.createElement('div');
    panel.id = 'soltapp-load-error';
    panel.setAttribute('role', 'alert');
    panel.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:white;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;font:16px system-ui;color:#1f2937;gap:18px';
    var title = document.createElement('h2');
    title.textContent = 'No pudimos cargar Soltapp';
    var text = document.createElement('p');
    text.textContent = 'Revisá tu conexión y volvé a intentarlo. Si sigue fallando, cerrá e iniciá Soltapp nuevamente.';
    var retry = document.createElement('button');
    retry.textContent = 'Volver a cargar';
    retry.style.cssText = 'background:#0d9488;color:white;border:0;border-radius:10px;padding:14px 24px;font:inherit;cursor:pointer';
    retry.onclick = function () { window.location.reload(); };
    var login = document.createElement('a');
    login.textContent = 'Ir al inicio de sesión';
    login.href = '/login';
    panel.append(title, text, retry, login);
    document.body.appendChild(panel);
  }
})();
