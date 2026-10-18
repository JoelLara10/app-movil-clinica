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

const { validateMedicationAdministration } = require('../src/utils/clinicalSecurity');

const validAdministration = [{
  nombre: 'Ceftriaxona',
  dosis: '1 g',
  frecuencia: 'Cada 24 horas',
  via: 'IV',
  fecha_aplicacion: '01/01/2025',
}];

test('Jaime MED-01: rechaza administración ligada a expediente inválido', () => {
  const result = validateMedicationAdministration({
    id_atencion: 10,
    Id_exp: 'abc',
    medications: validAdministration,
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /atención|expediente/i);
});

test('Jaime MED-02: exige datos completos y una fecha clínica válida', () => {
  const incomplete = validateMedicationAdministration({
    id_atencion: 10,
    Id_exp: 20,
    medications: [{ ...validAdministration[0], dosis: '' }],
  });
  assert.equal(incomplete.ok, false);

  const futureDate = validateMedicationAdministration({
    id_atencion: 10,
    Id_exp: 20,
    medications: [{ ...validAdministration[0], fecha_aplicacion: '31/12/2999' }],
  });
  assert.equal(futureDate.ok, false);
});

test('Jaime MED-03: oculta el detalle técnico ante demasiados intentos', () => {
  const message = getSafeClinicalError(
    { response: { status: 429, data: { error: 'rate key user:123' } } },
    'No fue posible guardar la administración.',
  );
  assert.equal(message, 'Se realizaron demasiados intentos. Espera un momento.');
  assert.doesNotMatch(message, /user:123|rate key/);
});

const { validateFluidBalance } = require('../src/utils/clinicalSecurity');

const validBalance = {
  ingresos_orales: '500',
  ingresos_iv: '250',
  egresos_orina: '400',
  egresos_drenajes: '50',
  observaciones: 'Paciente estable',
};

test('Jesús BAL-01: rechaza balance asociado a una atención manipulada', () => {
  const result = validateFluidBalance({
    id_atencion: -1,
    Id_exp: 20,
    formData: validBalance,
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /atención|expediente/i);
});

test('Jesús BAL-02: rechaza volúmenes negativos, no numéricos o extremos', () => {
  for (const invalidValue of ['-1', 'abc', '100001']) {
    const result = validateFluidBalance({
      id_atencion: 10,
      Id_exp: 20,
      formData: { ...validBalance, ingresos_orales: invalidValue },
    });
    assert.equal(result.ok, false);
  }

  const normalized = validateFluidBalance({
    id_atencion: 10,
    Id_exp: 20,
    formData: validBalance,
  });
  assert.equal(normalized.ok, true);
  assert.equal(normalized.data.ingresos_orales, 500);
});

test('Jesús BAL-03: un error 500 nunca revela detalles de base de datos', () => {
  const message = getSafeClinicalError(
    { response: { status: 500, data: { error: 'MongoServerError at mongodb://internal' } } },
    'No fue posible guardar el balance.',
  );
  assert.equal(message, 'No fue posible guardar el balance.');
  assert.doesNotMatch(message, /Mongo|mongodb/);
});


const { normalizeFluidBalanceRecord } = require('../src/utils/clinicalSecurity');

test('Jesús BAL-04: interpreta los campos planos devueltos por la API móvil', () => {
  const balance = normalizeFluidBalanceRecord({
    ingresos_orales: 750,
    ingresos_iv: 250,
    egresos_orina: 400,
    egresos_drenajes: 100,
    total_ingresos: 1000,
    total_egresos: 500,
    balance_neto: 500,
    observaciones: 'Paciente estable',
  });

  assert.deepEqual(balance, {
    ingresos_orales: 750,
    ingresos_iv: 250,
    egresos_orina: 400,
    egresos_drenajes: 100,
    total_ingresos: 1000,
    total_egresos: 500,
    balance_neto: 500,
    observaciones: 'Paciente estable',
  });
});

test('Jesús BAL-05: mantiene compatibilidad con balances anidados y calcula totales faltantes', () => {
  const balance = normalizeFluidBalanceRecord({
    balance: {
      ingresos_orales: '300',
      ingresos_iv: 200,
      egresos_orina: 100,
      egresos_drenajes: 50,
      observaciones: '  Vigilar  ',
    },
  });

  assert.equal(balance.total_ingresos, 500);
  assert.equal(balance.total_egresos, 150);
  assert.equal(balance.balance_neto, 350);
  assert.equal(balance.observaciones, 'Vigilar');
});
