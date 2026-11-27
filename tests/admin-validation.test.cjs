const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function load(file, dependencies = {}) {
  const context = vm.createContext({ console });
  const module = new vm.SourceTextModule(fs.readFileSync(path.join(__dirname, '../src/services', file), 'utf8'), { context });
  await module.link(async (name) => {
    const exports = dependencies[name];
    assert.ok(exports, `Unexpected import: ${name}`);
    return new vm.SyntheticModule(Object.keys(exports), function () {
      Object.entries(exports).forEach(([key, value]) => this.setExport(key, value));
    }, { context });
  });
  await module.evaluate();
  return module.namespace;
}

test('cantidades vacías, cero, fraccionarias y no finitas nunca se convierten en un cargo de una unidad', async () => {
  const { chargeQuantity } = await load('adminFeedback.js');
  for (const value of ['', ' ', 0, '0', -1, '1.5', 'abc', Infinity, NaN, true, null, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(chargeQuantity(value), null, String(value));
  }
  assert.equal(chargeQuantity('2'), 2);
  assert.equal(chargeQuantity(1), 1);
});

test('el formulario exige los cuatro datos y una fecha real no futura', async () => {
  const { patientValidationMessage } = await load('adminFeedback.js');
  const valid = { curp: 'QA-SINTETICO', papell: 'PRUEBA', nom_pac: 'SINTETICO', fecnac: '2000-02-29' };
  assert.equal(patientValidationMessage(valid), '');
  for (const key of Object.keys(valid)) assert.ok(patientValidationMessage({ ...valid, [key]: '  ' }));
  for (const fecnac of ['2025-02-29', '2000-02-30', '2000-13-01', '2999-01-01', 'texto']) {
    assert.ok(patientValidationMessage({ ...valid, fecnac }));
  }
});

test('los errores de red, timeout, servidor y sesión no filtran detalles sensibles', async () => {
  const { adminErrorMessage } = await load('adminFeedback.js');
  assert.match(adminErrorMessage({ message: 'secret mongodb URI' }), /conexión/);
  assert.match(adminErrorMessage({ code: 'ECONNABORTED' }), /tardó demasiado/);
  assert.match(adminErrorMessage({ response: { status: 401 } }), /sesión/);
  assert.match(adminErrorMessage({ response: { status: 403 } }), /permiso/);
  assert.match(adminErrorMessage({ response: { status: 404 } }), /encontró/);
  for (const status of [400, 500, 503]) {
    const message = adminErrorMessage({ response: { status, data: { error: 'Traceback: secret password token mongodb' } } });
    assert.doesNotMatch(message, /Traceback|password|token|mongodb|secret/i);
  }
  assert.equal(adminErrorMessage({ response: { status: 400, data: { error: 'La cama seleccionada ya está ocupada.' } } }), 'La cama seleccionada ya está ocupada.');
});

test('la edición consulta el detalle administrativo que incluye paciente, atención y familiar', async () => {
  const calls = [];
  const expected = { rawPatient: { curp: 'QA-SINTETICO' }, activeAppointment: { id_cama: null }, family: {} };
  const { default: service } = await load('adminService.js', {
    './api': { default: { get: async (route) => { calls.push(route); return { data: expected }; } } },
    './fileService': { downloadAuthenticatedFile: async () => {} },
  });
  assert.equal(await service.getPatient(208), expected);
  assert.deepEqual(calls, ['/gestion-pacientes/208']);
});
