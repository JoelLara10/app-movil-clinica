const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

const sourceFiles = walk(path.join(__dirname, '..', 'src'))
  .filter((file) => file.endsWith('.js'));

test('JWT is never placed in a URL query string', () => {
  for (const file of sourceFiles) {
    const source = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /[?&]token=/, file);
  }
});

test('JWT is only accessed through secureStorage', () => {
  for (const file of sourceFiles) {
    if (file.endsWith(path.sep + 'secureStorage.js')) continue;
    const source = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /AsyncStorage\.getItem\(['"]@ineo_token/, file);
  }
});

test('SecureStore usa una clave nativa válida', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'services', 'secureStorage.js'),
    'utf8',
  );
  const match = source.match(/const NATIVE_TOKEN_KEY = '([^']+)'/);
  assert.ok(match, 'Debe existir una clave separada para SecureStore');
  assert.match(match[1], /^[A-Za-z0-9._-]+$/);
  assert.doesNotMatch(match[1], /@/);
});
