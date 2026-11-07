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

La auditoría registrada el 7 de noviembre de 2026 presenta 0 resultados
moderados, altos o críticos. Conserva 7 resultados bajos derivados de un único
aviso de `deepmerge` en herramientas de configuración de Expo. La corrección
propuesta por npm requiere migrar el SDK, por lo que debe probarse de forma
coordinada con la matriz nativa y un APK nuevo. Los registros se conservan en
`docs/segunda-entrega/evidencias/auditoria-npm.json` y la explicación de la
remediación previa en `docs/security/dependabot-20261102.md`.

SecureStore protege el token nativo. En web, el token continúa en
almacenamiento web por la arquitectura actual; para producción web se recomienda
una cookie HttpOnly coordinada con el API.
