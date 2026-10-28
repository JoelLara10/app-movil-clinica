# Monitoreo: paginación, caché y notificaciones de QA

## Comportamiento

- Pacientes, historial y alertas se solicitan por páginas de 10 registros.
- La búsqueda de pacientes admite nombre y expediente.
- El historial conserva una fecha de corte al cambiar de página para evitar saltos cuando llegan mediciones nuevas.
- La caché vive en memoria durante la sesión, muestra el último resultado al volver a entrar y lo actualiza en segundo plano. Se limpia al cerrar sesión. No funciona como expediente sin conexión.
- El ESP32 sigue enviando a la API por HTTPS. Firebase se utiliza para las notificaciones Android, no para recibir directamente los sensores.

## Configuración Android

Proyecto Firebase: `oftalcore-qa`. Paquete Android: `com.ineo.hospital`.
`google-services.json` contiene la configuración pública de la aplicación. La clave privada de la cuenta de servicio se carga exclusivamente en las credenciales FCM V1 de Expo y no se incluye en Git ni en el APK.

Para generar un APK de QA:

```sh
npx eas-cli build --platform android --profile preview
```

Es necesario instalar un APK nuevo después de agregar el módulo nativo de notificaciones. Expo Go no sustituye esta prueba.

## Activación y prueba pendiente

La API mantiene el envío desactivado por defecto. La activación de `MONITORING_PUSH_ENABLED=true` debe configurarse expresamente en el entorno QA después de revisar las credenciales y el despliegue. El proceso existente ejecuta una cola persistente de MongoDB, con reintentos y comprobación de recibos de Expo. No requiere Redis.

1. Instalar el APK nuevo en un Android físico, iniciar sesión con un usuario clínico de QA y activar las notificaciones en Monitoreo.
2. Conceder el permiso de Android, cerrar la app normalmente y generar una alerta sintética desde el ESP32.
3. Comprobar la recepción y que pulsar la notificación abra el paciente correcto después de autenticar. El texto externo no incluye nombre ni signos vitales.
4. Reconocer la alerta y comprobar su estado tanto en web como en móvil.
5. Cerrar sesión y comprobar que el dispositivo deje de recibir notificaciones de esa sesión.

Forzar la detención desde los ajustes de Android puede impedir la recepción hasta abrir de nuevo la aplicación. La entrega también depende de Internet, FCM, Expo y de que la API de QA esté ejecutándose; no se garantiza entrega inmediata con el servicio suspendido.

## Validación física del prototipo

La prueba por comando `prueba-caida` valida el recorrido de la alerta, pero no calibra el MPU. Falta registrar una prueba física controlada del sensor sobre una superficie acolchada, sin poner en riesgo a una persona, y comprobar el reenvío de una alerta pendiente después de perder Wi-Fi y reiniciar. No se debe presentar el prototipo como detector clínico validado.
