const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function loadSecureStorage(platform, webStore = undefined) {
  const calls = [];
  const secureValues = new Map();
  const secureStore = {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device-only',
    async getItemAsync(key) {
      calls.push(['get', key]);
      return secureValues.get(key) ?? null;
    },
    async setItemAsync(key, value, options) {
      calls.push(['set', key, options]);
      secureValues.set(key, value);
    },
    async deleteItemAsync(key) {
      calls.push(['delete', key]);
      secureValues.delete(key);
    },
  };
  const asyncStorage = {
    async getItem() { return null; },
    async setItem() {},
    async removeItem() {},
    async getAllKeys() { return []; },
    async multiRemove() {},
  };
  const context = vm.createContext({
    console,
    ...(webStore ? { localStorage: webStore } : {}),
  });
  const mod = new vm.SourceTextModule(
    fs.readFileSync(path.join(__dirname, '../src/services/secureStorage.js'), 'utf8'),
    { context },
  );
  await mod.link(async (name) => {
    const exports = name === 'react-native'
      ? { Platform: { OS: platform } }
      : name === '@react-native-async-storage/async-storage'
        ? { default: asyncStorage }
        : name === 'expo-secure-store'
          ? secureStore
          : null;
    assert.ok(exports, `Unexpected dependency: ${name}`);
    return new vm.SyntheticModule(Object.keys(exports), function () {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
    }, { context });
  });
  await mod.evaluate();
  return { storage: mod.namespace, calls, secureValues };
}

test('native SecureStore usa una clave válida para guardar, leer y borrar el token', async () => {
  const { storage, calls, secureValues } = await loadSecureStorage('android');
  await storage.setToken('test-jwt');
  assert.equal(await storage.getToken(), 'test-jwt');
  await storage.removeToken();

  assert.deepEqual(calls.map((call) => call[1]), ['ineo_token', 'ineo_token', 'ineo_token']);
  assert.ok(calls.every((call) => /^[A-Za-z0-9._-]+$/.test(call[1])));
  assert.equal(secureValues.size, 0);
});

test('web conserva su clave existente en localStorage', async () => {
  const values = new Map();
  const localStorage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
    removeItem(key) { values.delete(key); },
  };
  const { storage, calls } = await loadSecureStorage('web', localStorage);
  await storage.setToken('test-jwt');
  assert.equal(await storage.getToken(), 'test-jwt');
  await storage.removeToken();
  assert.deepEqual(calls, []);
  assert.equal(values.size, 0);
});
