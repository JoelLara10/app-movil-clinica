# Segunda entrega de OftalCore móvil

Fecha de entrega académica 28 de noviembre de 2026. Corte de evidencia 7 de noviembre de 2026.

## Documentos

| Documento | Contenido |
| --- | --- |
| 01 Informe segunda entrega OftalCore.docx | Apartados A y B, requisitos, metodología, nube, seguridad, normas y evidencias. |
| 02 Manual de usuario OftalCore.docx | Instalación, acceso, módulos, monitoreo, notificaciones y soporte. |
| 03 Manual tecnico y operacion OftalCore.docx | Entorno, contratos, compilación, nube, mantenimiento y recuperación. |

Las versiones Markdown `informe.md`, `manual-usuario.md` y `manual-tecnico-operacion.md` permiten revisar cambios en GitHub. Los Word reutilizan la portada institucional del estudiante.

## Evidencia verificable

- `evidencias/pruebas-movil.txt` contiene 55 pruebas aprobadas en esta revisión.
- `evidencias/auditoria-npm.json` conserva la auditoría completa con cero vulnerabilidades reportadas.
- `evidencias/verificacion-remota.json` registra pruebas QA y disponibilidad pública.
- `evidencias/verificacion-produccion.json` registra autenticación y revocación reales contra producción.
- Las capturas 01 a 03 muestran repositorio, CI y promoción QA.
- Las capturas 04 a 06 corresponden al cliente móvil exportado a web conectado a la API de producción. No acreditan instalación nativa.
- La captura 07 muestra el almacenamiento y actualización de estos documentos en GitHub.
- `version-entrega.json` registra el código y build de aplicación. Los binarios se distribuyen mediante EAS y el paquete de entrega.

El APK de producción corresponde a la versión 1.0.0 compilación 8 y al código actualizado identificado en el manifiesto. Las actualizaciones documentales posteriores mantienen el código del cliente. La aceptación en teléfono requiere anotar dispositivo, Android, fecha, responsable y resultados. Las pruebas anteriores de QA y la simulación de caída no se presentan como una nueva validación física del MPU.

## Proveedores y protección de información

La app utiliza la API de OftalCore para identidad y datos. Expo Push y Firebase FCM proporcionan mensajería. Expo EAS genera el instalador y Render ejecuta la API. Las credenciales y datos personales reales no se incluyen en el paquete documental.
