const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');
const clinical = require('../src/utils/clinicalSecurity');
const noteSync = require('../src/utils/nursingNoteSync');

function evaluate(file, deps = {}) {
  const module = { exports: {} };
  const code = babel.transformSync(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), {
    babelrc: false, configFile: false,
    plugins: [['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }], '@babel/plugin-transform-modules-commonjs'],
  }).code;
  vm.runInNewContext(code, { module, exports: module.exports, require(name) {
    assert.ok(deps[name], `Unexpected dependency ${name}`); return deps[name];
  } });
  return module.exports;
}
const validation = evaluate('utils/nursingValidation.js');
const feedback = evaluate('services/adminFeedback.js');
const fixtures = [
  ['EnfermeriaVitalSignsScreen.js', { ta: '120/80', fc: '72', temp: '36.5', spo2: '98.5' }],
  ['EnfermeriaAssessmentScreen.js', { estado_general: 'PRUEBA', dolor: '2', movilidad: 'PRUEBA', riesgo_caidas: 'PRUEBA', riesgo_upp: 'PRUEBA', observaciones: '' }],
  ['EnfermeriaMedicationsScreen.js', [{ id: 0, nombre: 'PRUEBA', dosis: 'PRUEBA', frecuencia: 'PRUEBA', via: 'PRUEBA', fecha_aplicacion: '13/11/2026' }]],
  ['EnfermeriaFluidBalanceScreen.js', { ingresos_orales: '200', ingresos_iv: '', egresos_orina: '100', egresos_drenajes: '', observaciones: 'PRUEBA' }],
  ['EnfermeriaCareScreen.js', { diagnostico_enfermeria: 'PRUEBA', objetivos: 'PRUEBA', intervenciones: 'PRUEBA', evaluacion: '', estado: 'EN_PROCESO', observaciones: '' }],
  ['EnfermeriaNoteScreen.js', { nota_enfermeria: 'REGISTRO SINTETICO DE PRUEBA' }],
];

function render(file, draft, api) {
  const states = [];
  const hooks = {
    useEffect() {}, useRef: current => ({ current }), useCallback: fn => fn,
    useState(initial) {
      let value = initial;
      const isForm = initial && typeof initial === 'object' && !Array.isArray(initial);
      const isMeds = Array.isArray(initial) && initial[0]?.nombre === '';
      if (draft && (isForm || isMeds)) value = draft;
      if (initial === true) value = false;
      const index = states.length; states.push(value);
      return [value, next => { states[index] = typeof next === 'function' ? next(states[index]) : next; }];
    },
  };
  const element = (type, props) => ({ type, props });
  const native = Object.fromEntries(['View', 'Text', 'ScrollView', 'TextInput', 'TouchableOpacity', 'ActivityIndicator', 'FlatList'].map(x => [x, x]));
  native.Alert = { alert() {} }; native.StyleSheet = { create: x => x };
  const moment = Object.assign(() => ({ format: () => 'date' }), { locale() {} });
  const Screen = evaluate('screens/enfermeria/' + file, {
    react: { __esModule: true, default: hooks, ...hooks },
    'react/jsx-runtime': { jsx: element, jsxs: element }, 'react-native': native,
    'expo-linear-gradient': { LinearGradient: 'Gradient' }, '@expo/vector-icons': { Ionicons: 'Icon' },
    '../../context/LanguageContext': { useLanguage: () => ({ lang: 'es', t: key => key }) },
    '../../services/api': { __esModule: true, default: api },
    '../../services/cacheService': { __esModule: true, default: { get: async () => null, set: async () => {} } },
    '../../components/Pagination': { __esModule: true, default: 'Pagination' },
    '../../utils/nursingValidation': validation, '../../services/adminFeedback': feedback,
    '../../utils/clinicalSecurity': clinical, '../../utils/nursingNoteSync': noteSync,
    moment: { __esModule: true, default: moment },
  }).default;
  const nodes = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(visit);
    nodes.push(node); visit(node.props?.children);
  }
  visit(Screen({ navigation: { goBack() {} }, route: { params: { id_atencion: 1, Id_exp: 1 } } }));
  const button = nodes.find(node => node.props?.onPress?.name === 'handleSubmit');
  assert.ok(button, file);
  return { states, submit: button.props.onPress };
}

for (const [file, draft] of fixtures) {
  test(`${file}: datos incompletos nunca envían un POST`, async () => {
    let calls = 0;
    const screen = render(file, null, { get: async () => ({ data: [] }), post: async () => { calls++; } });
    await screen.submit();
    assert.equal(calls, 0);
  });
  test(`${file}: conserva el borrador al fallar y bloquea envíos duplicados`, async () => {
    let calls = 0;
    let reject;
    const screen = render(file, draft, { get: async () => ({ data: [] }), post: () => {
      calls++; return new Promise((_resolve, fail) => { reject = fail; });
    } });
    const pending = screen.submit();
    await screen.submit();
    assert.equal(calls, 1);
    reject(Object.assign(new Error('private mongodb token password'), { response: { status: 503 } }));
    await pending;
    assert.ok(screen.states.includes(draft));
    assert.doesNotMatch(JSON.stringify(screen.states), /private mongodb|password/);
  });
}

test('validación estricta de signos y contexto; nunca trunca texto ni acepta infinito', () => {
  for (const fc of ['72abc', 'Infinity', '-1', true, '72.5']) assert.ok(validation.validateNursingInput('vitals', { fc }).error);
  assert.ok(validation.validateNursingInput('vitals', { spo2: 101 }).error);
  assert.equal(validation.validateNursingInput('vitals', { spo2: '98.5' }).data.spo2, 98.5);
  assert.ok(validation.nursingContextError(true, 1));
  assert.ok(validation.nursingContextError(undefined, 1));
  assert.equal(validation.nursingContextError('1', 1), '');
});
