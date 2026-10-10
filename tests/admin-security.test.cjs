// Run: node --experimental-vm-modules --test tests/admin-security.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function loadModule(file, dependencies, globals = {}) {
  const context = vm.createContext({ console, ...globals });
  const module = new vm.SourceTextModule(
    fs.readFileSync(path.join(__dirname, '../src/services', file), 'utf8'),
    { context },
  );
  await module.link(async (name) => {
    const exports = dependencies[name];
    assert.ok(exports, `Unexpected dependency: ${name}`);
    return new vm.SyntheticModule(Object.keys(exports), function () {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
    }, { context });
  });
  await module.evaluate();
  return module.namespace;
}

function fakeStorage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    values,
    async getItem(key) { return values.get(key) || null; },
    async setItem(key, value) { values.set(key, value); },
    async getAllKeys() { return [...values.keys()]; },
    async multiRemove(keys) { keys.forEach((key) => values.delete(key)); },
  };
}

test('ADM-01: no persiste ni devuelve datos clinicos del cache', async () => {
  const storage = fakeStorage({ '@ineo_token': 'test-session' });
  const cache = await loadModule('adminCache.js', {
    '@react-native-async-storage/async-storage': { default: storage },
  });
  const result = await cache.setAdminCache('patients', { name: 'Paciente de prueba' });
  assert.equal(typeof result.timestamp, 'number');
  assert.equal(await cache.getAdminCache('patients', 60000), null);
  assert.equal(storage.values.size, 1);
});

test('ADM-01: elimina cache legado y conserva la sesion y otros datos', async () => {
  const storage = fakeStorage({
    '@ineo_admin_cache:patients': JSON.stringify({ data: { name: 'Prueba' }, timestamp: Date.now() }),
    '@ineo_token': 'test-session',
    'language': 'es',
  });
  const cache = await loadModule('adminCache.js', {
    '@react-native-async-storage/async-storage': { default: storage },
  });
  assert.equal(await cache.getAdminCache('patients', 60000), null);
  assert.equal(storage.values.has('@ineo_admin_cache:patients'), false);
  assert.equal(storage.values.get('@ineo_token'), 'test-session');
  assert.equal(storage.values.get('language'), 'es');
});

async function downloader(platform) {
  const requests = [];
  const files = [];
  const api = { async get(url) { requests.push(url); return { data: {} }; } };
  const service = await loadModule('adminService.js', {
    './api': { default: api, API_URL: 'https://api.example.test/api/v1' },
    '@react-native-async-storage/async-storage': { default: fakeStorage() },
    'react-native': { Platform: { OS: platform } },
    'expo-file-system/legacy': {
      cacheDirectory: 'file:///cache/',
      async downloadAsync(url, target) { files.push({ url, target }); return { status: 200, uri: target }; },
    },
    'expo-sharing': { async isAvailableAsync() { return true; }, async shareAsync() {} },
  }, {
    URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} },
    window: { document: { createElement() { return { click() {} }; } } },
  });
  return { service: service.default, requests, files };
}

test('ADM-02: rechaza URL externas y rutas alteradas antes de descargar', async () => {
  for (const platform of ['web', 'android']) {
    const { service, requests, files } = await downloader(platform);
    for (const endpoint of ['https://external.example.test/file', '//external.example.test/file', '/pdf/contract/1/2?token=x', '/pdf/contract/../2', '/pdf/contract/%2e%2e/2', '/auth/me', '/pdf/contract/0/2', {}, null]) {
      await assert.rejects(() => service.downloadDocument({ endpoint }), { message: /no es válida/ });
    }
    assert.equal(requests.length + files.length, 0);
  }
});

test('ADM-03: rechaza traversal y nombres invalidos antes de descargar', async () => {
  for (const platform of ['web', 'android']) {
    const { service, requests, files } = await downloader(platform);
    for (const filename of ['../../session.pdf', 'folder/file.pdf', 'file\\test.pdf', 'test.txt', {}]) {
      await assert.rejects(() => service.downloadDocument({ endpoint: '/pdf/contract/1/2', filename }), { message: /no es válido/ });
    }
    assert.equal(requests.length + files.length, 0);
  }
});

test('Regresion: conserva los cinco documentos validos en web y movil', async () => {
  for (const platform of ['web', 'android']) {
    const { service, requests, files } = await downloader(platform);
    for (const key of ['initial-sheet', 'front-sheet', 'contract', 'consent', 'identification-sheet']) {
      for (const prefix of ['', '/api/v1']) {
        await service.downloadDocument({ endpoint: `${prefix}/pdf/${key}/1/2`, filename: 'documento_2.pdf' });
      }
    }
    assert.equal(requests.length + files.length, 10);
    files.forEach((file) => assert.equal(file.target, 'file:///cache/documento_2.pdf'));
  }
});
