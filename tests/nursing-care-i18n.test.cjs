const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const screen = fs.readFileSync(
  path.join(root, 'src', 'screens', 'enfermeria', 'EnfermeriaCareScreen.js'),
  'utf8',
);

const requiredKeys = [
  'nursingDiagnosis',
  'objectives',
  'interventions',
  'evaluation',
  'nursingDiagnosisPlaceholder',
  'objectivesPlaceholder',
  'interventionsPlaceholder',
  'evaluationPlaceholder',
  'observationsPlaceholder',
];

for (const language of ['es', 'en']) {
  test(`Cuidados de Enfermería contiene todas las traducciones en ${language}`, () => {
    const dictionary = fs.readFileSync(
      path.join(root, 'src', 'i18n', `${language}.js`),
      'utf8',
    );

    for (const key of requiredKeys) {
      assert.match(
        dictionary,
        new RegExp(`\\n\\s+${key}:\\s*['\"]`),
        `Falta la traducción enfermeria.${key} en ${language}`,
      );
    }
  });
}

test('la vista traduce los estados y no muestra sus códigos internos', () => {
  assert.match(screen, /getEstadoLabel\(estado\)/);
  assert.doesNotMatch(screen, /\{getEstadoEmoji\(estado\)\}\s*\{estado\}/);
});
