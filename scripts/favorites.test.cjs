const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Exercise the production store without loading React Native or making network calls.
const source = fs.readFileSync(path.join(__dirname, '../src/state/favoritesStore.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const storeModule = { exports: {} };
new Function('exports', 'require', 'module', compiled)(storeModule.exports, require, storeModule);
const { createFavoritesStore } = storeModule.exports;
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
};
function fixture(overrides = {}) {
  const calls = [];
  const repo = {
    list: async () => [],
    add: async (...args) => { calls.push(['add', ...args]); },
    remove: async (...args) => { calls.push(['remove', ...args]); },
    ...overrides,
  };
  const store = createFavoritesStore(repo);
  return { store, calls };
}
async function ready(store, user = 'user-a') {
  store.setUser(user);
  await store.refresh();
}

test('a guest cannot write favorites', async () => {
  const { store, calls } = fixture();
  store.setUser(null);
  await store.toggle('p1');
  assert.equal(calls.length, 0);
  assert.match(store.getSnapshot().actionError, /Iniciá sesión/);
});
test('add and remove are persisted under the authenticated user', async () => {
  const { store, calls } = fixture();
  await ready(store);
  await store.toggle('p1', { id: 'p1', title: 'Teléfono' });
  assert.equal(store.getSnapshot().entries[0].product.title, 'Teléfono');
  await store.toggle('p1');
  assert.deepEqual(store.getSnapshot().entries, []);
  assert.deepEqual(calls, [['add', 'user-a', 'p1'], ['remove', 'user-a', 'p1']]);
});
test('a new store reloads saved favorites from the repository', async () => {
  const saved = [{ productId: 'p1', product: null }];
  const { store } = fixture({ list: async () => saved });
  await ready(store);
  assert.deepEqual(store.getSnapshot().entries, saved);
  assert.equal(store.getSnapshot().loaded, true);
});
test('a failed write never changes the saved heart', async () => {
  const { store } = fixture({ add: async () => { throw new Error('offline'); } });
  await ready(store);
  await store.toggle('p1');
  assert.deepEqual(store.getSnapshot().entries, []);
  assert.deepEqual(store.getSnapshot().pending, []);
  assert.ok(store.getSnapshot().actionError);
});
test('a failed removal preserves the existing favorite', async () => {
  const { store } = fixture({ list: async () => [{ productId: 'p1', product: null }], remove: async () => { throw new Error('offline'); } });
  await ready(store);
  await store.toggle('p1');
  assert.equal(store.getSnapshot().entries.length, 1);
});
test('rapid taps on the same product send only one request', async () => {
  const wait = deferred();
  let count = 0;
  const { store } = fixture({ add: async () => { count++; await wait.promise; } });
  await ready(store);
  const first = store.toggle('p1');
  await store.toggle('p1');
  assert.equal(count, 1);
  wait.resolve();
  await first;
  assert.equal(store.getSnapshot().entries.length, 1);
});
test('changing users clears favorites immediately and ignores old writes', async () => {
  const wait = deferred();
  const { store } = fixture({ add: async () => wait.promise });
  await ready(store);
  const mutation = store.toggle('p1');
  store.setUser('user-b');
  assert.deepEqual(store.getSnapshot().entries, []);
  wait.resolve();
  await mutation;
  assert.deepEqual(store.getSnapshot().entries, []);
  assert.deepEqual(store.getSnapshot().pending, []);
});
test('signing out ignores an in-flight load from the previous user', async () => {
  const wait = deferred();
  const { store } = fixture({ list: async () => wait.promise });
  store.setUser('user-a');
  const load = store.refresh();
  store.setUser(null);
  wait.resolve([{ productId: 'private-product', product: null }]);
  await load;
  assert.equal(store.getSnapshot().userId, null);
  assert.deepEqual(store.getSnapshot().entries, []);
});
test('a stale refresh cannot undo a newer mutation', async () => {
  const wait = deferred();
  let reads = 0;
  const { store } = fixture({ list: async () => ++reads === 1 ? [] : wait.promise });
  await ready(store);
  const load = store.refresh();
  await store.toggle('p1');
  wait.resolve([]);
  await load;
  assert.equal(store.getSnapshot().entries[0].productId, 'p1');
  assert.equal(store.getSnapshot().loading, false);
});
test('failed initial load can be retried and blocks blind toggles', async () => {
  let fail = true;
  const { store, calls } = fixture({ list: async () => { if (fail) throw new Error('offline'); return []; } });
  await ready(store);
  assert.ok(store.getSnapshot().error);
  assert.equal(store.getSnapshot().loaded, false);
  await store.toggle('p1');
  assert.equal(calls.length, 0);
  fail = false;
  await store.refresh();
  assert.equal(store.getSnapshot().error, null);
  assert.equal(store.getSnapshot().loaded, true);
});
test('concurrent changes on distinct products both survive', async () => {
  const { store } = fixture();
  await ready(store);
  await Promise.all([store.toggle('p1'), store.toggle('p2')]);
  assert.deepEqual(store.getSnapshot().entries.map((entry) => entry.productId).sort(), ['p1', 'p2']);
});
