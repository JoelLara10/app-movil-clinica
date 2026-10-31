const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');

// Exercise both CLI modules that consume the scoped Zod security override.
const expoRequire = createRequire(require.resolve('expo/package.json'));
const cliRoot = path.dirname(expoRequire.resolve('@expo/cli/package.json'));
const { PluginSchema, DevToolsPluginOutputSchema } = require(path.join(cliRoot, 'build/src/start/server/DevToolsPlugin.schema.js'));
const { createMCPDevToolsExtensionSchema } = require(path.join(cliRoot, 'build/src/start/server/createMCPDevToolsExtensionSchema.js'));

test('Expo CLI validates plugin metadata and rejects malformed output with the patched dependency', () => {
  const plugin = PluginSchema.parse({ packageName: 'test-plugin', packageRoot: '/fixture', cliExtensions: {
    description: 'Synthetic compatibility test', entryPoint: './index.js', commands: [{
      name: 'inspect', title: 'Inspect', environments: ['cli', 'mcp'],
      parameters: [{ name: 'count', type: 'number' }, { name: 'confirm', type: 'confirm' }, { name: 'label', type: 'text' }],
    }],
  } });
  const schema = createMCPDevToolsExtensionSchema(plugin);
  assert.equal(schema.safeParse({ command: 'inspect', count: 2, confirm: true, label: 'test' }).success, true);
  assert.equal(schema.safeParse({ command: 'inspect', count: 'invalid' }).success, false);
  assert.equal(schema.safeParse({ command: 'inspect', unknown: 'invalid' }).success, false);
  assert.equal(DevToolsPluginOutputSchema.safeParse([{ type: 'text', text: 'ok', level: 'info' }]).success, true);
  assert.equal(DevToolsPluginOutputSchema.safeParse([{ type: 'image', url: 'invalid' }]).success, false);
});
