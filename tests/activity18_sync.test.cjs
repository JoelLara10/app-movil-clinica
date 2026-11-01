const test = require('node:test');
const assert = require('node:assert/strict');
const { validateNursingNote, nursingSyncError } = require('../src/utils/nursingNoteSync');

test('A18 rechaza campos vacíos, tipos inválidos y notas excesivas', () => {
  for (const value of ['', '  ', null, {}, 4, 'a'.repeat(5001)]) {
    assert.equal(validateNursingNote(value).ok, false);
  }
  assert.deepEqual(validateNursingNote('  Control de prueba  ').data, { nota_enfermeria: 'Control de prueba' });
  assert.equal(validateNursingNote('a'.repeat(5000)).ok, true);
});

test('A18 errores de red y HTTP no revelan respuestas sensibles', () => {
  assert.equal(nursingSyncError({}), 'connectionError');
  for (const [status, key] of [[400, 'invalid'], [401, 'unauthorized'], [403, 'forbidden'], [404, 'notFound'], [500, 'serverError']]) {
    assert.equal(nursingSyncError({ response: { status, data: { error: 'password=secret' } } }), key);
  }
});
