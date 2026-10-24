# Monitoreo de pacientes

Acceso para admin, médico y enfermería desde el menú. La app reutiliza la API autenticada configurada con API_URL y consulta cada 10 segundos únicamente mientras la pantalla está activa y la app está en primer plano. No hay notificaciones push en esta entrega.

La lista muestra lecturas recientes, conexión y alertas pendientes. En el detalle se muestran posibles caídas aun sin pulso/SpO₂; reconocer una alerta confirma su revisión, no sustituye la evaluación del paciente. La temperatura mostrada pertenece al sensor.

La configuración de dispositivo y el protocolo de QA están en [la guía del repositorio OftalCore](https://github.com/JoelLara10/ineo-pbl-entrega/blob/feature/monitoreo-pacientes/docs/monitoreo-pacientes-qa.md). El firmware no se modifica en esta entrega.

El proyecto actual utiliza React Navigation con Expo 57. Para exportación web requiere EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK=1 mientras se conserva esa arquitectura existente.

## Probar la rama QA

- `npm ci` y `npm test`.
- `npm run start:qa` abre Expo apuntando explícitamente a la API QA; agregar `-- --web` permite probar la interfaz web local.
- `npm run export:qa` genera `dist-qa` con la misma configuración.
- `node scripts/expo-qa.cjs export --platform android --output-dir dist-qa-android` valida el paquete Android.
- El perfil EAS `preview` incorpora la opción de compatibilidad de React Navigation requerida por Expo 57. La opción también se aplica a CI. No se cambiaron los perfiles ni URLs de producción.
- Para recibir el módulo en una aplicación instalada hay que generar e instalar un build nuevo del perfil `preview`; actualizar Git no modifica un APK ya instalado.

## Componentes que se utilizarán

- API y web clínicas del repositorio `ineo-pbl-entrega`.
- App móvil clínica de este repositorio `app-movil-clinica`.
- Prototipo ESP32 y sus sensores como fuente de mediciones y posibles caídas.

Flujo: ESP32 → API OftalCore → web OftalCore y app móvil OftalCore. Las aplicaciones del examen y el reloj simulado fueron referencias de implementación; no se requieren como aplicaciones separadas. La configuración del firmware queda como siguiente etapa.

La evidencia de la prueba está en [Resultados QA del monitoreo](./evidence/monitoreo-20261022/RESULTADOS-QA.md).
