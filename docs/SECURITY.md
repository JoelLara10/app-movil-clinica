# Seguridad aplicada

- JWT en Keychain/Keystore mediante Expo SecureStore en Android e iOS.
- Cierre de sesión remoto para revocar el JWT y limpieza local garantizada.
- Sesión revalidada con `/auth/me` al abrir la aplicación.
- Descargas autenticadas mediante encabezado Bearer; el JWT no aparece en URLs.
- Cachés clínicas y administrativas sólo en memoria.
- Limpieza de cachés al cerrar sesión o recibir un 401.
- Capturas y grabación de pantalla bloqueadas durante el uso.
- Consolas eliminadas del bundle de producción.
- URL del API separada para desarrollo, QA y producción.
- QA y producción exigen HTTPS.
- CI valida pruebas, Expo Doctor, exportación y vulnerabilidades críticas.

## Riesgos externos pendientes

`npm audit` todavía reporta vulnerabilidades altas/moderadas en herramientas
internas de Expo/Metro. Se instaló la versión compatible más reciente de Expo
SDK 57 y `expo-doctor` pasa 21/21 verificaciones. NPM propone bajar a Expo 44,
lo cual rompería la compatibilidad actual y no debe aplicarse. Deben corregirse
cuando Expo publique dependencias actualizadas.

SecureStore protege el token nativo. En web, el token continúa en
almacenamiento web por la arquitectura actual; para producción web se recomienda
una cookie HttpOnly coordinada con el API.
