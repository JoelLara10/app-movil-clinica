const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');

function dashboard(api, previous = []) {
  const values = [];
  let focus;
  const hooks = {
    useEffect() {}, useCallback: fn => fn,
    useState(initial) {
      const index = values.length;
      values.push(index < previous.length ? previous[index] : initial);
      return [values[index], next => { values[index] = next; }];
    },
  };
  const element = (type, props) => ({ type, props });
  const native = Object.fromEntries(['View', 'Text', 'ScrollView', 'TouchableOpacity', 'RefreshControl'].map(x => [x, x]));
  native.StyleSheet = { create: x => x };
  native.Platform = { OS: 'android' };
  native.useWindowDimensions = () => ({ width: 400 });
  const moment = Object.assign(() => ({ format: () => 'date' }), { locale() {} });
  const deps = {
    react: { __esModule: true, default: hooks, ...hooks },
    'react/jsx-runtime': { jsx: element, jsxs: element },
    'react-native': native,
    '@react-navigation/native': { useFocusEffect: fn => { focus = fn; } },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: 0 }) },
    '../../context/AuthContext': { useAuth: () => ({ user: { role: 'admin' }, logout() {} }) },
    '../../context/LanguageContext': { useLanguage: () => ({ lang: 'es', t: x => x }) },
    'expo-linear-gradient': { LinearGradient: 'Gradient' },
    '@expo/vector-icons': { Ionicons: 'Icon' },
    '../../services/api': { __esModule: true, default: api },
    moment: { __esModule: true, default: moment },
    'moment/locale/es': {}, 'moment/locale/en-gb': {},
  };
  const code = babel.transformSync(fs.readFileSync(path.join(__dirname, '../src/screens/dashboard/DashboardScreen.js'), 'utf8'), {
    babelrc: false, configFile: false,
    plugins: [['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }], '@babel/plugin-transform-modules-commonjs'],
  }).code;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require(name) {
    assert.ok(deps[name], name); return deps[name];
  } });
  module.exports.default({ navigation: { navigate() {} } });
  return { values, async refresh() { focus(); await new Promise(resolve => setImmediate(resolve)); } };
}

const stats = { active_patients: { total: 927 }, bed_occupancy: { occupied: 46 } };
test('dashboard móvil carga cifras reales al enfocar y conserva datos al fallar la red', async () => {
  let failing = false;
  const screen = dashboard({ get: async route => {
    if (failing) throw new Error('private secret');
    return { data: route.includes('analytics') ? stats : { total: 12 } };
  } });
  assert.equal(screen.values[0], null);
  await screen.refresh();
  assert.equal(screen.values[0], stats);
  assert.equal(screen.values[1].total, 12);
  assert.equal(screen.values[2], false);
  failing = true;
  await screen.refresh();
  assert.equal(screen.values[0], stats);
  assert.equal(screen.values[1].total, 12);
  assert.equal(screen.values[2], true);
});

test('dashboard móvil distingue datos desconocidos de ceros confirmados y recupera la consulta', async () => {
  let valid = false;
  const screen = dashboard({ get: async route => ({ data: valid ?
    (route.includes('analytics') ? { active_patients: { total: 0 }, bed_occupancy: { occupied: 0 } } : { total: 0 }) : {} }) });
  await screen.refresh();
  assert.equal(screen.values[0], null);
  assert.equal(screen.values[1], null);
  assert.equal(screen.values[2], true);
  valid = true;
  await screen.refresh();
  assert.equal(screen.values[0].active_patients.total, 0);
  assert.equal(screen.values[0].bed_occupancy.occupied, 0);
  assert.equal(screen.values[2], false);
});
