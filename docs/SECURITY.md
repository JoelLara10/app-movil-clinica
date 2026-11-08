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

La auditoría final de esta entrega presenta 0 vulnerabilidades reportadas en
los niveles bajo, moderado, alto y crítico. Se actualizaron los parches
compatibles de Expo SDK 57 y se aprobaron las 55 pruebas del cliente y CI.
El registro actual se conserva en
`docs/segunda-entrega/evidencias/auditoria-npm.json`. La revisión anterior
se conserva como antecedente en `docs/security/dependabot-20261102.md`.

SecureStore protege el token nativo. En web, el token continúa en
almacenamiento web por la arquitectura actual; para producción web se recomienda
una cookie HttpOnly coordinada con el API.
