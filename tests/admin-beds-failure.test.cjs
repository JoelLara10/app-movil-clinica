const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');

function evaluate(file, dependencies = {}) {
  const code = babel.transformSync(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), {
    babelrc: false, configFile: false,
    plugins: [['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }], '@babel/plugin-transform-modules-commonjs'],
  }).code;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: (name) => {
    assert.ok(dependencies[name], `Unexpected import: ${name}`);
    return dependencies[name];
  } });
  return module.exports;
}

const bed = { id: '1', id_cama: 1, number: 'QA-1', area: 'Consulta', status: 'LIBRE' };
const form = { number: 'QA-2', area: 'Consulta', roomType: '', floor: '', section: '', status: 'LIBRE' };
const failure = Object.assign(new Error('technical detail'), { response: { status: 503 } });

function render(editingId, service) {
  const values = [];
  const alerts = [];
  const overrides = { 0: [bed], 3: editingId, 4: form, 5: false };
  const hooks = {
    useEffect: () => {}, useMemo: (fn) => fn(),
    useState: (initial) => {
      const index = values.length;
      values.push(Object.hasOwn(overrides, index) ? overrides[index] : initial);
      return [values[index], (next) => { values[index] = typeof next === 'function' ? next(values[index]) : next; }];
    },
  };
  const element = (type, props) => ({ type, props });
  const native = Object.fromEntries(['ActivityIndicator', 'RefreshControl', 'ScrollView', 'Text', 'TextInput', 'TouchableOpacity', 'View'].map(name => [name, name]));
  native.StyleSheet = { create: value => value };
  native.Alert = { alert: (...args) => alerts.push(args) };
  const Screen = evaluate('screens/admin/CamasScreen.js', {
    react: { __esModule: true, default: hooks, ...hooks },
    'react/jsx-runtime': { jsx: element, jsxs: element },
    'react-native': native,
    'expo-linear-gradient': { LinearGradient: 'LinearGradient' },
    '@expo/vector-icons': { Ionicons: 'Ionicons' },
    '../../services/adminService': { __esModule: true, default: service },
    '../../services/adminFeedback': evaluate('services/adminFeedback.js'),
  }).default;
  const nodes = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(visit);
    nodes.push(node);
    visit(node.props?.children);
  }
  visit(Screen({ navigation: { goBack() {} } }));
  return { values, alerts, nodes };
}

test('Camas: una creación rechazada no agrega registros ficticios ni borra el formulario', async () => {
  const screen = render(null, { createBed: async () => { throw failure; } });
  const save = screen.nodes.find(node => node.props?.onPress?.name === 'handleSave');
  await save.props.onPress();
  assert.deepEqual(screen.values[0], [bed]);
  assert.equal(screen.values[4], form);
  assert.match(screen.values[7], /no está disponible/);
  assert.equal(screen.values[8], false);
  assert.equal(screen.alerts.length, 0);
});

test('Camas: una actualización rechazada conserva la cama original y la edición pendiente', async () => {
  const screen = render('1', { updateBed: async () => { throw failure; } });
  await screen.nodes.find(node => node.props?.onPress?.name === 'handleSave').props.onPress();
  assert.deepEqual(screen.values[0], [bed]);
  assert.equal(screen.values[3], '1');
  assert.equal(screen.values[4], form);
  assert.equal(screen.alerts.length, 0);
});

test('Camas: una eliminación rechazada conserva el registro visible', async () => {
  const screen = render(null, { deleteBed: async () => { throw failure; } });
  screen.nodes.find(node => node.props?.onDelete).props.onDelete();
  await screen.alerts[0][2].find(button => button.text === 'Eliminar').onPress();
  assert.deepEqual(screen.values[0], [bed]);
  assert.match(screen.values[7], /no está disponible/);
});

test('Camas: solo la creación confirmada por el servidor actualiza la lista y limpia el formulario', async () => {
  const screen = render(null, { createBed: async () => ({ id_cama: 2, numero: 'QA-2', area: 'Consulta', ocupada: 0 }) });
  await screen.nodes.find(node => node.props?.onPress?.name === 'handleSave').props.onPress();
  assert.equal(screen.values[0].length, 2);
  assert.equal(screen.values[0][0].id_cama, 2);
  assert.equal(screen.values[4].number, '');
  assert.match(screen.alerts[0][0], /registrada/);
});

test('Censo: tres filtros independientes no se concatenan en una búsqueda remota imposible', async () => {
  const values = [];
  const calls = [];
  const hooks = {
    useEffect: () => {}, useRef: value => ({ current: value }), useCallback: fn => fn,
    useState: initial => {
      const index = values.length;
      values.push(index === 0 ? { consulta: 'QA SINTETICO', preparacion: 'QA SINTETICO', recuperacion: 'QA SINTETICO' } : initial);
      return [values[index], next => { values[index] = typeof next === 'function' ? next(values[index]) : next; }];
    },
  };
  const element = (type, props) => ({ type, props });
  const native = Object.fromEntries(['ActivityIndicator', 'RefreshControl', 'ScrollView', 'Text', 'TextInput', 'TouchableOpacity', 'View'].map(name => [name, name]));
  native.StyleSheet = { create: value => value };
  const Screen = evaluate('screens/administrativo/CensoScreen.js', {
    react: { __esModule: true, default: hooks, ...hooks },
    'react/jsx-runtime': { jsx: element, jsxs: element },
    'react-native': native,
    'expo-linear-gradient': { LinearGradient: 'LinearGradient' },
    '@expo/vector-icons': { Ionicons: 'Ionicons' },
    '@react-navigation/native': { useFocusEffect: callback => callback() },
    '../../components/Pagination': { __esModule: true, default: 'Pagination' },
    '../../context/LanguageContext': { useLanguage: () => ({ t: key => key }) },
    '../../services/adminCache': { getAdminCache: async () => null, setAdminCache: async () => ({ timestamp: 1 }) },
    '../../services/adminService': { __esModule: true, default: { getCensus: async search => {
      calls.push(search); return { sections: [], summary: { activos: 0, areas: 3, avisos: 0 } };
    } } },
    '../../services/adminFeedback': evaluate('services/adminFeedback.js'),
  }).default;
  Screen({ navigation: { goBack() {}, navigate() {} } });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(calls, ['']);
});
