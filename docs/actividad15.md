# Actividad 15: módulo móvil conectado a la nube

Fecha de verificación: 24 de octubre de 2026.

## Alcance

Se reutiliza la aplicación React Native/Expo existente. Módulo:
**Configuración > Servicios**, conectado al backend Flask/MongoDB de OftalCore.
No se creó otra aplicación ni un backend nuevo.

API QA: `https://ineo-pbl-entrega.onrender.com/api/v1`.

| Método | Ruta | Requisito |
| --- | --- | --- |
| POST | `/auth/login` | Cuenta de prueba activa |
| GET | `/auth/me` | Bearer JWT |
| GET | `/catalog/services` | Bearer JWT |
| POST | `/catalog/services` | Bearer JWT y rol admin |
| POST | `/auth/logout` | Bearer JWT |

## Ejecución

```powershell
npm ci
$env:APP_ENV='qa'
$env:EXPO_PUBLIC_API_URL='https://ineo-pbl-entrega.onrender.com/api/v1'
npm run android
```

Se requiere cliente Expo compatible con SDK 57 o la compilación preview
configurada en `eas.json`. Para pruebas del cliente web del mismo proyecto:
`npm run web`. No confundir con el frontend web del repositorio de integración.

## Cambios

- Validador compartido de campos, costo finito no negativo, IVA y tipo.
- Estados visibles de carga/guardado y bloqueo inmediato de doble envío.
- Etiquetas accesibles y mensajes que no exponen errores internos.
- Backend: JSON inválido y campos numéricos rechazados antes de persistir;
  costo cero permitido. Ese cambio se integra también en el repositorio del backend.

## Pruebas ejecutadas

- `npm test`: 47 aprobadas, incluidas conexión rechazada con Axios y HTTP 500.
- Backend: 42 aprobadas al ejecutar `test_activity15_services.py`,
  `test_auth.py` y `test_security_hardening.py`, con mongomock aislado.
- `npx expo export --platform android`: correcta.
- API QA: login 200, `/auth/me` 200, catálogo 200, POST incompleto 400,
  credenciales incorrectas 401, GET sin JWT y con JWT inválido 401.
- Interfaz Expo web contra QA: formulario vacío rechazado, servicio
  `A15-EVIDENCIA-2410` guardado y recuperado por GET (id_serv 4).

Las capturas entregadas son del cliente **Expo web**, incluyendo una vista
responsive de 412 píxeles. La ejecución funcional nativa Android/iOS sigue
pendiente: falló la descarga de Expo Go. Una exportación Android no acredita
por sí sola la ejecución en un dispositivo.

## Seguridad

Se reutilizan HTTPS obligatorio para QA/producción, JWT por encabezado,
SecureStore nativo, validación remota de sesión y autorización del servidor.
La versión web usa almacenamiento web; no equivale a SecureStore nativo.
No incluir credenciales ni tokens en el repositorio o en las capturas.

Los documentos individuales describen el mismo trabajo de equipo con enfoque
en integración móvil (Joel), API (Zahid), interfaz (Jaime) y trazabilidad
(Jesús); no atribuyen ejecuciones personales que no fueron comprobadas.

## Publicación

Flujo de esta entrega: `feature/actividad15-servicios-remotos` → `develop` → `qa`, mediante pull requests y comprobaciones de CI. `main` queda fuera del alcance.

Evidencias compartidas: `evidence/actividad15/` y `docs/actividad15/` en el repositorio de integración OftalCore.
