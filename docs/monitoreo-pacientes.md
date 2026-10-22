# Monitoreo de pacientes

Acceso para admin, médico y enfermería desde el menú. La app reutiliza la API autenticada configurada con API_URL y consulta cada 10 segundos únicamente mientras la pantalla está activa y la app está en primer plano. No hay notificaciones push en esta entrega.

La lista muestra lecturas recientes, conexión y alertas pendientes. En el detalle se muestran posibles caídas aun sin pulso/SpO₂; reconocer una alerta confirma su revisión, no sustituye la evaluación del paciente. La temperatura mostrada pertenece al sensor.

La configuración de dispositivo y el protocolo de QA están en [la guía del repositorio INEO](https://github.com/JoelLara10/ineo-pbl-entrega/blob/feature/monitoreo-pacientes/docs/monitoreo-pacientes-qa.md). El firmware no se modifica en esta entrega.

El proyecto actual utiliza React Navigation con Expo 57. Para exportación web requiere EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK=1 mientras se conserva esa arquitectura existente.
