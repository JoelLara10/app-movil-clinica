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

const { validatePrescription } = require('../src/utils/clinicalSecurity');

const validPrescription = [{
  medicamento: 'Paracetamol',
  dosis: '500 mg',
  frecuencia: 'Cada 8 horas',
  duracion: '3 días',
  indicaciones: 'Después de alimentos',
}];

test('Zahid RX-01: rechaza una receta sin contexto clínico válido', () => {
  const result = validatePrescription({
    id_atencion: 0,
    Id_exp: 20,
    medications: validPrescription,
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /atención|expediente/i);
});

test('Zahid RX-02: rechaza recetas incompletas o con más de 10 medicamentos', () => {
  const incomplete = validatePrescription({
    id_atencion: 10,
    Id_exp: 20,
    medications: [{ medicamento: 'Paracetamol', dosis: '', frecuencia: '', duracion: '' }],
  });
  assert.equal(incomplete.ok, false);

  const excessive = validatePrescription({
    id_atencion: 10,
    Id_exp: 20,
    medications: Array.from({ length: 11 }, () => validPrescription[0]),
  });
  assert.equal(excessive.ok, false);
});

test('Zahid RX-03: devuelve mensajes seguros para falta de autorización', () => {
  const message = getSafeClinicalError(
    { response: { status: 403, data: { error: 'role_required stack trace' } } },
    'No fue posible guardar la receta.',
  );
  assert.equal(message, 'No tienes permiso para realizar esta operación.');
  assert.doesNotMatch(message, /stack|role_required/);
});
