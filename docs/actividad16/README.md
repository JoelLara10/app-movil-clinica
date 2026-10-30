# Actividad 16 de Desarrollo Móvil Integral

Caso aplicado: autenticación remota y control de acceso en la app móvil OftalCore. Modalidad c con API real de QA.

El archivo **Actividad 16 Autenticacion remota OftalCore.docx** contiene la portada del estudiante actualizada, análisis, justificación, diagrama, implementación, tres medidas de seguridad, capturas, resultados y conclusión. La portada original de Descargas se conserva sin modificaciones.

## Evidencia y alcance

- `evidencias/resultados-qa.json`: ocho comprobaciones reales de la API QA, con respuestas esperadas y obtenidas. No contiene contraseñas ni JWT.
- `evidencias/01-inicio-sin-sesion.png` a `04-sesion-cerrada.png`: cliente Expo web de este repositorio a 412 por 915 píxeles, conectado a QA. No equivalen a fotografías de Android nativo.
- `evidencias/pruebas-movil.txt`: 52 pruebas del móvil aprobadas después del cambio.
- `evidencias/pruebas-api-aisladas.txt`: 29 pruebas de autenticación y seguridad aprobadas con datos aislados.
- `evidencias/pruebas-autorizacion.txt`: prueba aislada de roles, incluyendo HTTP 403 y acceso permitido.
- `evidencias/flujo-autenticacion.png`: diagrama incluido en Word.

La app ya tenía login HTTPS, JWT, restauración remota, SecureStore nativo y autorización por roles. En esta actividad se agregó un mensaje de error accesible dentro del formulario para que el rechazo sea visible también en Expo web. El cambio está en la rama local `feature/actividad16-autenticacion`.

## Antes de entregar

Transcribir el análisis solicitado en la libreta e insertar su fotografía en el último apartado del Word. Las respuestas están incluidas y listas para transcribirse. El nombre, universidad, materia, grupo y cuatrimestre se tomaron de la portada proporcionada; no se inventó información del docente.

## Regeneración local

`generar_documento.py` usa la portada proporcionada en Descargas y las evidencias de esta carpeta. Requiere Python con python-docx y Pillow. El documento se verificó mediante exportación con Word y rasterización de sus ocho páginas; se preservaron los logos, el encabezado y el pie de la portada original.
