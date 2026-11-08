# Manual técnico y de operación de OftalCore móvil

OftalCore móvil · Segunda entrega · 28 de noviembre de 2026
Preparado el 7 de noviembre y actualizado el 8 de noviembre de 2026.

Lara Rodriguez Joel Alejandro  ·  IDGS 101  ·  Décimo cuatrimestre
Desarrollo móvil integral  ·  ITIC Roberto Vinicio Camacho Mendoza
Entrega del 28 de noviembre de 2026  ·  Corte de evidencia del 7 de noviembre de 2026

## 1 Arquitectura y responsabilidades de operación

El cliente está implementado en JavaScript con React Native 0.86.3, React 19.2.3 y Expo SDK 57.0.32. Se conecta a una API Flask con MongoDB. La entrada App.js compone proveedores de sesión, paciente e idioma y selecciona la navegación según la autenticación. El backend valida reglas y permisos independientemente de la interfaz.

| Ruta o archivo | Responsabilidad |
| --- | --- |
| src/screens y src/components | Interfaz por módulos y piezas reutilizables. |
| src/context | Estado compartido de autenticación, paciente e idioma. |
| src/services/api.js | Cliente Axios con URL del ambiente, timeout de 30000 ms y autenticación en cabeceras. |
| src/services/secureStorage.js | Token nativo, sesión y limpieza de almacenamiento o cachés. |
| monitoringService y monitoringCache | Consultas paginadas y caché temporal por sesión. |
| monitoringNotifications y App.js | Registro de notificaciones, permisos y validación al abrir un evento. |
| src/utils y src/i18n | Validaciones y textos español e inglés. |
| tests y .github/workflows | Pruebas, exportaciones y controles CI. |

Desarrollo mantiene cliente y dependencias. Operación administra API, base de datos y credenciales. QA registra pruebas por ambiente. El responsable de la versión conserva commit, APK, checksum y documentación y valida las condiciones antes de liberar un cambio.

## 2 Preparación del entorno y configuración

Usar Git, Node 22 y npm. El lockfile conserva las versiones exactas. Instalar con npm ci y comprobar la matriz de Expo antes de actualizar dependencias nativas. El backend dispone de sus propios requisitos de Python y configuración de base de datos.

```powershell
git clone https://github.com/JoelLara10/app-movil-clinica.git
cd app-movil-clinica
git switch qa
node --version
npm --version
npm ci
npm test
npm run lint
npm run start:qa
```

| Parámetro | Configuración |
| --- | --- |
| APP_ENV | development, qa o production. Cambia nombre, icono y selección del ambiente. |
| EXPO_PUBLIC_API_URL en QA | https://ineo-pbl-entrega.onrender.com/api/v1 |
| EXPO_PUBLIC_API_URL en producción | https://api-clinica-jx4m.onrender.com/api/v1 |
| Identidad de app | Slug ineo-hospital, paquete Android com.ineo.hospital y proyecto EAS af5c4bd9-8c79-4271-8eea-6485e978d713. |
| SDK y navegación | EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK=1 se usa en CI y QA según la arquitectura del proyecto. |
| Firebase | google-services.json identifica la aplicación Android. GOOGLE_SERVICES_JSON puede indicar el archivo del ambiente. |

Las variables EXPO_PUBLIC quedan incluidas en el cliente. Reservarlas para valores públicos. Las claves JWT, la conexión de base de datos y la clave privada de FCM se administran en servidor o EAS según su función. Mantenerlas fuera de Git y de los manuales.

## 3 Contratos de API y seguridad

| Operación | Método y ruta | Comportamiento esperado |
| --- | --- | --- |
| Inicio de sesión | POST /auth/login | Credenciales válidas devuelven token y usuario. El cliente valida la estructura. |
| Revalidación y cierre | GET /auth/me / POST /auth/logout | Consulta de sesión y revocación. Un token inválido obtiene 401. |
| Lista de monitoreo | GET /monitoring/patients | Usa page, page_size y q. Solicita diez registros por página. |
| Detalle de monitoreo | GET /monitoring/patients/{id} | history_page, alerts_page y history_before para la instantánea de historial. |
| Reconocimiento | PATCH /monitoring/alerts/{id}/acknowledge | Usuario clínico autorizado reconoce la alerta e invalida la caché. |
| Registro push | PUT o DELETE /monitoring/push-devices | Asocia o retira token de notificación con la sesión actual. |
| Nota de enfermería | GET o POST /appointments/{id}/nursing-notes | POST usa nota_enfermeria y devuelve 201 con id_nota. GET permite confirmar su persistencia. |
| Telemetría ESP32 | POST /monitoring/data | Usa la credencial del dispositivo y el esquema de telemetría del backend. |

Las rutas se anexan al prefijo /api/v1 del ambiente. La app agrega Bearer a las peticiones de sesión. La API permite monitoreo a roles clínicos y reserva la asociación de dispositivos al administrador. Los detalles y límites se verifican en las rutas del backend de la versión desplegada.

La caché mantiene un máximo de 40 entradas durante 120 segundos. Las claves incluyen usuario y consulta. El cambio de sesión invalida respuestas en vuelo. La consulta se actualiza cada diez segundos en una pantalla activa. Para notas se evita el reenvío automático de POST y se verifica el resultado mediante consulta.

## 4 Compilación y liberación Android

1. Elegir el commit aprobado y comprobar que los archivos de configuración y el lockfile correspondan a esa versión.

2. Ejecutar pruebas, diagnóstico de Expo y controles de seguridad. Revisar su resultado sin omitir fallos.

3. Iniciar sesión en EAS con una cuenta autorizada. Confirmar proyecto, perfil y uso de las credenciales existentes.

4. Generar el APK QA o producción con el perfil correcto. Conservar el ID y esperar el estado FINISHED.

5. Descargar el artefacto, calcular SHA256 y registrar commit, ambiente, appVersion y versionCode.

6. Instalar y ejecutar la matriz de aceptación en el dispositivo. Liberar conforme al resultado y conservar el instalador anterior.

```powershell
npx eas-cli login
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform android --profile production-apk
npx eas-cli build:view 8fdabf17-684a-4b27-a3e9-ad0fdd9aa227
Get-FileHash .\OftalCore-produccion.apk -Algorithm SHA256
```

| Perfil | Resultado |
| --- | --- |
| preview | Distribución interna y APP_ENV=qa. La configuración incluye la URL QA. |
| production-apk | Hereda production y genera APK para distribución interna. Usa APP_ENV=production y la URL de producción. |
| production | Perfil de publicación con incremento remoto de versionCode. La publicación en tienda requiere su procedimiento adicional. |

La compilación de esta entrega usa versión 1.0.0 y versionCode 8 administrado por EAS. La firma remota reutiliza las credenciales del proyecto. Un cambio de URL o módulos nativos exige construir e instalar un nuevo APK. Los cambios de documentación no alteran el comportamiento del binario ya generado.

## 5 Nube notificaciones y observabilidad

Render ejecuta la API y almacena sus variables. Expo EAS compila. Expo Push comunica los avisos a Firebase FCM para Android. MongoDB conserva registros de aplicación y cola de notificaciones. GitHub almacena código, documentación y resultados CI. La consola Firebase y las credenciales EAS se administran con acceso autorizado.

### Operación del envío push

La app solicita permiso y obtiene un token Expo ligado al proyecto EAS. Lo registra en /monitoring/push-devices con la sesión actual. El backend usa la cola y comprueba tickets o receipts del proveedor. La salida de la sesión retira el registro asociado. Verificar MONITORING_PUSH_ENABLED y la ejecución del planificador en el servicio del ambiente antes de probar la entrega.

La credencial privada de FCM se carga en EAS y nunca se incluye en Git ni en el APK. El archivo google-services.json es configuración pública de la app. El proyecto Firebase configurado se identifica como oftalcore-qa. El nombre técnico por sí solo no acredita que un backend de producción tenga habilitado su envío.

| Señal | Dónde revisar y cómo actuar |
| --- | --- |
| Disponibilidad API | Consultar /health. Un 200 acredita ese endpoint. Si falla, revisar logs y arranque del servicio. |
| Errores de acceso | Distinguir 401 de 403. Revisar sesión o rol y conservar solo metadatos de la incidencia. |
| Build y CI | Consultar EAS y GitHub Actions. Revisar el primer paso que falla y corregirlo mediante PR. |
| Monitoreo sin datos | Verificar filtro, ambiente, asociación del dispositivo y última recepción. |
| Notificación ausente | Revisar permiso, token vigente, sesión, envío del backend, cola y respuesta del proveedor. |

El arranque frío observado de QA demoró aproximadamente 41 segundos. Diferenciar ese comportamiento de una consulta con servicio activo. Evitar registrar nombres clínicos, contraseñas, JWT o claves en logs de diagnóstico o capturas.

## 6 Mantenimiento respaldo y recuperación

### Actualizaciones y dependencias

Crear una rama desde develop, describir el cambio y abrir un PR. Mantener el lockfile y revisar actualizaciones coordinadas con Expo. El bot propone cambios que deben pasar CI antes de integrarse. La auditoría final no reporta vulnerabilidades tras actualizar los parches compatibles de Expo SDK 57. Las 55 pruebas y los controles de CI están aprobados.

### Respaldo de información y código

Git conserva historial del código y documentación, pero no sustituye el respaldo de MongoDB. El responsable de operación debe definir frecuencia, retención, cifrado y control de acceso a respaldos de datos. Antes de un cambio de datos, verificar la copia del ambiente y ensayar la restauración en un entorno aislado. Esta entrega no ejecuta una restauración de producción.

### Procedimiento de incidente

1. Registrar ambiente, versión, fecha, síntoma y pasos. Retirar información personal de los archivos de diagnóstico.

2. Identificar si el fallo corresponde al cliente, conectividad, API, base de datos o proveedor de notificaciones.

3. Si existe regresión del cliente, conservar la versión afectada y revisar el commit anterior aprobado.

4. Preparar reversión mediante PR y comprobar compatibilidad con API y datos. Generar un nuevo build cuando corresponda.

5. Verificar recuperación con el caso que fallaba y registrar causa, corrección y evidencia.

### Control de acceso y baja de sesión

Aplicar mínimo privilegio en cuentas de nube y revisión de miembros del proyecto. Ante exposición de una credencial, el responsable revoca y reemplaza la credencial afectada, revisa logs y elimina su uso activo. Los valores privados se comunican por un canal autorizado y no se añaden a incidencias públicas.

## 7 Evidencias pruebas y aceptación

```powershell
npm ci
npm test
npm run lint
npm audit --audit-level=high
$env:EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK="1"
npx expo-doctor
npm run export:qa
npm run security:policy
npm run security:review
```

security:review requiere instalar previamente el escáner de secretos indicado en ci/requirements-security.txt dentro de un entorno de Python. CI prepara ese entorno y conserva informes. El análisis CodeQL se ejecuta mediante su workflow. Una comprobación no disponible se considera un bloqueo y no un resultado aprobado.

| Evidencia | Contenido y alcance |
| --- | --- |
| pruebas-movil.txt | Ejecución actual de 55 pruebas del cliente. |
| auditoria-npm.json | Resultados de dependencias sin omitir los avisos bajos. |
| verificacion-remota.json | Disponibilidad, acceso y revocación QA y comprobaciones públicas de producción. |
| verificacion-produccion.json | Acceso autorizado, sesión, catálogo, filtro y revocación en producción, sin guardar respuestas clínicas ni credenciales. |
| Capturas de GitHub | Estructura del repositorio, CI aprobado, promoción y actualización de documentación. |
| Capturas de interfaz | Cliente exportado a web conectado a producción. Identificadas como modalidad web. |

La documentación se preparó el 7 de noviembre para la entrega del 28. Antes del cierre final deben añadirse los resultados de UAT en el APK 8 instalado. El registro debe incluir dispositivo, Android, fecha, responsable y resultado por caso, con distinción entre alerta simulada y caída física del MPU.

Repositorio  https://github.com/JoelLara10/app-movil-clinica
Compilación de producción  https://expo.dev/accounts/joeeel10/projects/ineo-hospital/builds/8fdabf17-684a-4b27-a3e9-ad0fdd9aa227
