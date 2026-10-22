# Verificación QA: monitoreo de pacientes

Fecha: 22 de octubre de 2026 (America/Mexico_City).

## Alcance comprobado

Se usó exclusivamente el expediente sintético 205, identificado como SINTETICO MONITOREO PRUEBA QA QA-MON-20261021-aa4c91. No se modificaron expedientes existentes. La API probada fue https://ineo-pbl-entrega.onrender.com/api/v1.

La web y el paquete web de la app móvil se sirvieron localmente con la URL de la API QA real. Esto permitió probar los clientes contra el servicio desplegado sin cambiar la protección de acceso del preview Vercel. No constituye una prueba en un teléfono físico.

## Resultados

| Flujo | Resultado |
| --- | --- |
| Login QA con cuenta autorizada | Correcto, rol admin |
| Crear expediente y asociar dispositivo sintéticos | Correcto |
| Caída sin pulso ni SpO₂ | Persistida y visible en web |
| Repetir mismo event_id | Una sola alerta pendiente |
| Reconocimiento desde web | PATCH correcto; pendientes pasan a cero |
| Reintentar evento ya reconocido | No recrea alerta |
| Lectura normal | 76 lpm y 98 % SpO₂ guardados y mostrados |
| Pérdida de contacto | Pulso y SpO₂ pasan a null; no muestra valores antiguos |
| Nueva caída en móvil | Visible en detalle del expediente sintético |
| Reconocimiento desde móvil | PATCH 200; pendientes pasan a cero |
| Navegación móvil | Tarjeta de monitoreo en inicio y detalle correctos |
| Pruebas móviles | 39 aprobadas |
| expo-doctor | 21/21 aprobado en la integración QA |
| Paquete web QA | Compilación aprobada |

## Cambios y trazabilidad

- Integración móvil y compatibilidad de compilación: PR #24 a develop y PR #25 a qa, ambos fusionados tras CI aprobada.
- Acceso visible desde el inicio móvil: PR #26 a develop y PR #27 a QA, ambos fusionados tras CI aprobada. Commit QA final: 324f20f.
- APK QA solicitado en Expo: https://expo.dev/accounts/joeeel10/projects/ineo-hospital/builds/7ba88fc7-5f43-462c-9a5f-9493f3ec26af.
- main y producción no se modificaron.

## Evidencia visual

- [web-alerta-caida.png](./web-alerta-caida.png)
- [movil-monitoreo-detalle.png](./movil-monitoreo-detalle.png)
- [movil-caida-sin-contacto.png](./movil-caida-sin-contacto.png)
- [movil-alerta-reconocida.png](./movil-alerta-reconocida.png)

Pendiente fuera de estas pruebas: prueba física del APK y configuración del ESP32. No se implementaron notificaciones push con la app cerrada. El estado final de CI/compilación en la nube se debe comprobar en sus enlaces, no inferir del envío del trabajo.


