const test = require('node:test');
const assert = require('node:assert/strict');
const { validateService, safeServiceError } = require('../src/utils/serviceValidation');
const valid = { serv_cve: ' a15-demo ', serv_desc: ' Consulta de prueba ', serv_costo: '500', tipo: '1', iva: '16' };

test('A15 formulario válido normaliza el JSON y admite costo cero', () => {
  const result = validateService(valid);
  assert.equal(result.ok, true);
  assert.equal(result.data.serv_cve, 'A15-DEMO');
  assert.equal(result.data.serv_costo, 500);
  assert.equal(validateService({ ...valid, serv_costo: '0' }).ok, true);
});
test('A15 formulario incompleto no produce datos para POST', () => {
  for (const field of ['serv_cve', 'serv_desc', 'serv_costo']) {
    const result = validateService({ ...valid, [field]: ' ' });
    assert.equal(result.ok, false);
    assert.equal(result.data, undefined);
  }
});
test('A15 rechaza números negativos, infinitos y tipo inválido', () => {
  for (const cost of ['-1', 'NaN', 'Infinity', 'abc']) {
    assert.equal(validateService({ ...valid, serv_costo: cost }).ok, false);
  }
  assert.equal(validateService({ ...valid, tipo: 6 }).ok, false);
  assert.equal(validateService({ ...valid, iva: 101 }).ok, false);
});
test('A15 errores de conexión, autorización y servidor son seguros', () => {
  assert.match(safeServiceError({}), /conexión/);
  assert.match(safeServiceError({ response: { status: 401 } }), /sesión/);
  assert.match(safeServiceError({ response: { status: 403 } }), /permiso/);
  assert.equal(safeServiceError({ response: { status: 500, data: { error: 'password=secret MongoError' } } }), 'No fue posible completar la operación.');
});

test('A15 conexión rechazada produce un mensaje seguro con Axios real', async () => {
  const http = require('node:http');
  const axios = require('axios');
  const server = http.createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  await assert.rejects(axios.get(`http://127.0.0.1:${port}`, { timeout: 2000, proxy: false }), (error) => {
    assert.equal(error.code, 'ECONNREFUSED');
    assert.match(safeServiceError(error), /No hay conexión/);
    return true;
  });
});

test('A15 una respuesta HTTP 500 real no revela detalles internos', async () => {
  const http = require('node:http');
  const axios = require('axios');
  const server = http.createServer((_request, response) => {
    response.writeHead(500, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: 'MongoError password=secret' }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    await assert.rejects(axios.get(`http://127.0.0.1:${server.address().port}`, { proxy: false }), (error) => {
      assert.equal(error.response.status, 500);
      assert.doesNotMatch(safeServiceError(error), /Mongo|secret/);
      return true;
    });
  } finally { await new Promise((resolve) => server.close(resolve)); }
});
