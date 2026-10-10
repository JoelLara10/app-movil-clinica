const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getSafeClinicalError,
  validateClinicalHistory,
} = require('../src/utils/clinicalSecurity');

const validHistory = {
  motivo_consulta: 'Dolor ocular',
  sintomatologia: ['Dolor'],
  heredo: [],
  nopat: [],
  pat_alergias: 'Ninguna',
};

test('Joel HC-01: rechaza atención o expediente manipulados', () => {
  const result = validateClinicalHistory({
    id_atencion: '../1',
    Id_exp: 20,
    formData: validHistory,
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /atención|expediente/i);
});

test('Joel HC-02: limita y normaliza la historia clínica', () => {
  const oversized = validateClinicalHistory({
    id_atencion: 10,
    Id_exp: 20,
    formData: { ...validHistory, pat_alergias: 'x'.repeat(2001) },
  });
  assert.equal(oversized.ok, false);

  const valid = validateClinicalHistory({
    id_atencion: 10,
    Id_exp: 20,
    formData: { ...validHistory, motivo_consulta: '  Dolor ocular  ' },
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.data.motivo_consulta, 'Dolor ocular');
  assert.equal(valid.data.sintomatologia, 'Dolor');
});

test('Joel HC-03: oculta errores internos del servidor', () => {
  const message = getSafeClinicalError(
    { response: { status: 500, data: { error: 'MongoError: password=secret' } } },
    'No fue posible guardar la historia clínica.',
  );
  assert.equal(message, 'No fue posible guardar la historia clínica.');
  assert.doesNotMatch(message, /Mongo|secret/);
});
