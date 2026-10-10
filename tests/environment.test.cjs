const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveApiUrl } = require('../app.config.js');

function withApiUrl(value, callback) {
  const previous = process.env.EXPO_PUBLIC_API_URL;
  if (value === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = value;
  try {
    callback();
  } finally {
    if (previous === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = previous;
  }
}

test('production requires HTTPS', () => {
  withApiUrl('http://example.com/api/v1', () => {
    assert.throws(() => resolveApiUrl('production'), /HTTPS/);
  });
});

test('qa requires an explicit API URL', () => {
  withApiUrl(undefined, () => {
    assert.throws(() => resolveApiUrl('qa'), /obligatorio/);
  });
});

test('development accepts an emulator HTTP endpoint', () => {
  withApiUrl('http://10.0.2.2:5001/api/v1/', () => {
    assert.equal(resolveApiUrl('development'), 'http://10.0.2.2:5001/api/v1');
  });
});
