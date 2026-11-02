# Actividad 18 Sincronización de notas de enfermería

Entidad: notas por atención. La pantalla consulta con GET, registra con POST y vuelve a consultar para confirmar el id_nota devuelto por el servidor.

## Servicio remoto
QA: https://ineo-pbl-entrega.onrender.com/api/v1
- POST /auth/login
- GET /auth/me
- GET /appointments/{id_atencion}/nursing-notes
- POST /appointments/{id_atencion}/nursing-notes

JSON de escritura: {"nota_enfermeria":"Texto de la nota"}. Respuesta: HTTP 201 con id_nota. Lectura: HTTP 200 con arreglo de notas. Autorizados: admin, medico y enfermero (enfermeria se normaliza en el servidor).

## Cambios
- Consulta directa al entrar y al actualizar; no se almacenan estas notas en caché persistente.
- Indicador de última consulta y aviso de registros posiblemente desactualizados al fallar.
- Validación de texto requerido y máximo 5000 caracteres; borrador conservado en errores.
- Bloqueo de doble envío; verificación por id_nota después del POST.
- Mensajes seguros en español e inglés, sin mostrar respuestas internas.
- No hay reenvío automático de POST. Ante respuesta incierta se indica consultar antes de reenviar.

## Verificación
npm ci
npm test
npm run lint
npm run export:qa

Resultados locales: 55 pruebas móviles; 187 pruebas web; 59 pruebas API aprobadas y una omitida por enlaces simbólicos de Windows. Compilaciones Expo web y React web correctas. Los registros de ejecución se incluyen en esta carpeta.

## Alcance de evidencia
La nube QA respondió 200 en /health y 401 en la consulta sin token. El flujo autenticado completo se demostró con la pantalla real de Expo web y la API Flask del repositorio en localhost, con MongoMock y datos sintéticos; no constituye ejecución Android/iOS ni una escritura acreditada en QA. La autenticación y autorización son reales en el servidor; únicamente la persistencia MongoDB se sustituye por MongoMock en la demostración.

La API incluye --activity18 en ci/demo_api.py para preparar datos desechables. El arnés preview-app.js permite montar la pantalla real con la atención sintética 1 y login real, sin depender de agregaciones del listado que MongoMock no soporta. No se usa en la entrada normal de producción.

Los cambios se entregan en feature/actividad18-sincronizacion para revisión hacia qa. No se ha fusionado ni desplegado automáticamente.
