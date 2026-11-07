const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');

// Expo SDK 57's patch uses JSON Schema for installed plugin validation.
const expoRequire = createRequire(require.resolve('expo/package.json'));
const cliRoot = path.dirname(expoRequire.resolve('@expo/cli/package.json'));
const cliRequire = createRequire(path.join(cliRoot, 'package.json'));
const { validate, ValidationError } = cliRequire('@expo/schema-utils');
const { PluginSchema, DevToolsPluginOutputSchema } = require(path.join(cliRoot, 'build/src/start/server/devtools/DevToolsPlugin.schema.js'));

test('Expo CLI validates plugin metadata and rejects malformed output with the installed validator', () => {
  const plugin = { packageName: 'test-plugin', packageRoot: '/fixture', cliExtensions: {
    description: 'Synthetic compatibility test', entryPoint: './index.js', commands: [{
      name: 'inspect', title: 'Inspect', environments: ['cli', 'mcp'],
      parameters: [{ name: 'count', type: 'number' }, { name: 'confirm', type: 'confirm' }, { name: 'label', type: 'text' }],
    }],
  } };
  assert.doesNotThrow(() => validate(PluginSchema, plugin));
  assert.throws(() => validate(PluginSchema, { packageName: 'missing-root' }), ValidationError);
  const malformed = structuredClone(plugin);
  malformed.cliExtensions.commands[0].parameters[0].type = 'unsupported';
  assert.throws(() => validate(PluginSchema, malformed), ValidationError);
  assert.doesNotThrow(() => validate(DevToolsPluginOutputSchema, [{ type: 'text', text: 'ok', level: 'info' }]));
  assert.throws(() => validate(DevToolsPluginOutputSchema, [{ type: 'image', url: 'invalid' }]), ValidationError);
  assert.throws(() => validate(DevToolsPluginOutputSchema, [{ type: 'text', text: 'invalid', level: 'unknown' }]), ValidationError);
});
