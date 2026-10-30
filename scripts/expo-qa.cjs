// Explicit QA entry point; production defaults remain in app.config.js.
const { spawnSync } = require('node:child_process');
const { resolveApiUrl } = require('../app.config.js');
const env = {
  ...process.env,
  APP_ENV: 'qa',
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL || 'https://ineo-pbl-entrega.onrender.com/api/v1',
  EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK: '1',
};
const previous = process.env.EXPO_PUBLIC_API_URL;
process.env.EXPO_PUBLIC_API_URL = env.EXPO_PUBLIC_API_URL;
try { resolveApiUrl('qa'); }
finally {
  if (previous === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = previous;
}
const args = process.argv.slice(2);
const result = spawnSync(process.execPath, [require.resolve('expo/bin/cli'), ...(args.length ? args : ['start'])], {
  env, stdio: 'inherit',
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
