const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getSafeClinicalError,
  validateNursingCare,
} = require('../src/utils/clinicalSecurity');

const validForm = {
  diagnostico_enfermeria: ' Riesgo de caída ',
  objetivos: 'Evitar incidentes',
  intervenciones: 'Mantener barandales elevados',
  evaluacion: 'Paciente estable',
  estado: 'EN_PROCESO',
  observaciones: '',
};

test('A12-01 normaliza un registro remoto válido', () => {
  const result = validateNursingCare({
    id_atencion: 10,
    Id_exp: 20,
    formData: validForm,
  });
  assert.equal(result.ok, true);
  assert.equal(result.data.diagnostico_enfermeria, 'Riesgo de caída');
});

test('A12-02 rechaza campos obligatorios vacíos', () => {
  const result = validateNursingCare({
    id_atencion: 10,
    Id_exp: 20,
    formData: { ...validForm, objetivos: ' ' },
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /objetivos/i);
});

test('A12-03 rechaza contexto manipulado y estados no autorizados', () => {
  assert.equal(validateNursingCare({
    id_atencion: '../10', Id_exp: 20, formData: validForm,
  }).ok, false);
  assert.equal(validateNursingCare({
    id_atencion: 10,
    Id_exp: 20,
    formData: { ...validForm, estado: 'BORRADO' },
  }).ok, false);
});

test('A12-04 limita textos clínicos a 1000 caracteres', () => {
  const result = validateNursingCare({
    id_atencion: 10,
    Id_exp: 20,
    formData: { ...validForm, observaciones: 'x'.repeat(1001) },
  });
  assert.equal(result.ok, false);
});

test('A12-05 no expone mensajes internos de la API', () => {
  const message = getSafeClinicalError(
    { response: { status: 500, data: { error: 'MongoError password=secret' } } },
    'No fue posible registrar el cuidado.',
  );
  assert.equal(message, 'No fue posible registrar el cuidado.');
  assert.doesNotMatch(message, /Mongo|secret/);
});
