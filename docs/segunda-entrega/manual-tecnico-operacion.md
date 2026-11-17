# Manual completo técnico y de operación de OftalCore móvil

OftalCore móvil · Segunda entrega · 28 de noviembre de 2026
Manual ampliado y revisado el 16 de noviembre de 2026.

Lara Rodriguez Joel Alejandro  ·  IDGS 101  ·  Décimo cuatrimestre
Desarrollo móvil integral  ·  ITIC Roberto Vinicio Camacho Mendoza
Entrega del 28 de noviembre de 2026  ·  Ampliación documental del 16 de noviembre de 2026

## Propósito y organización

Este manual acompaña al manual de usuario y describe cómo reproducir, configurar, mantener y verificar la aplicación móvil completa. Incluye los servicios de backend, base de datos, nube e IoT en lo que afecta al cliente. Los contratos y parámetros proceden del código revisado; los resultados de ejecución se identifican con su fecha y plataforma.

Antes de intervenir un ambiente, identificar responsable, versión, alcance y procedimiento de recuperación. Los ejemplos no incluyen claves ni datos personales reales. Para la presentación académica se utiliza QA y el prototipo allí asociado. Esta ampliación no publica un APK nuevo ni cambia las credenciales del ESP32.

## Contenido

El índice se genera con los títulos de los capítulos.

## 1 Alcance versiones y responsables

Este manual permite instalar, configurar, compilar y operar el cliente móvil de OftalCore, y entender los contratos de la API, la persistencia y los proveedores que utiliza. Incluye la relación con la web y el ESP32; la administración completa del cliente web queda fuera del alcance de este manual móvil.

El código revisado del cliente corresponde a 837c86b; las ramas develop, qa y main se integraron el 8 de noviembre de 2026 mediante los PR 54, 55 y 56. Los APK de referencia son 1.0.0 build 8 de QA y producción. Esta ampliación documental se realiza el 16 de noviembre y no modifica el firmware ni el comportamiento del binario.

Desarrollo conserva código y lockfile; operación administra API, base de datos y secretos; QA registra resultados por ambiente. El responsable de liberación conserva commit, build EAS, checksum, configuración y manuales. Las capturas son del cliente Expo web conectado a QA y no sustituyen la aceptación del APK instalado.

| Elemento | Referencia |
| --- | --- |
| Repositorio móvil | https://github.com/JoelLara10/app-movil-clinica |
| API y web | https://github.com/JoelLara10/ineo-pbl-entrega |
| APK QA | 87df360f-9cfb-45eb-b84d-448fb50c68e3 |
| APK producción | 8fdabf17-684a-4b27-a3e9-ad0fdd9aa227 |

## 2 Arquitectura y flujo de información

El cliente utiliza React Native y Expo. Las pantallas se organizan por dominio y consumen servicios HTTP. AuthContext administra la sesión; PatientContext conserva expediente y atención; LanguageContext comparte español e inglés. La API Flask decide permisos y reglas de negocio y persiste información en MongoDB.

La web y la app pueden consultar la misma API de su ambiente. El ESP32 envía telemetría por HTTPS al backend y usa una credencial de dispositivo. El backend almacena lecturas y alertas; la app consulta páginas y reconoce alertas. Las notificaciones pasan por Expo Push y Firebase Cloud Messaging para Android.

La app implementa separación lógica de presentación, estado y acceso remoto; no se documenta como una arquitectura de microservicios. Los catálogos y registros clínicos se relacionan mediante identificadores, y la sesión es independiente del contexto de paciente.

Figura T1. Arquitectura del cliente y sus servicios. El ambiente del firmware debe coincidir con el de la app.

![Figura T1. Arquitectura del cliente y sus servicios. El ambiente del firmware debe coincidir con el de la app.](capturas-manuales/arquitectura.png)

## 3 Inventario del cliente y navegación

App.js compone los proveedores, la navegación y los listeners de notificación. src/navigation/MainNavigator.js define los stacks de administración, médico, enfermería, estudios y configuración y el menú lateral. Las rutas se registran según el rol; una tarjeta visible no reemplaza la autorización del endpoint.

Las pantallas activas se identifican por las rutas del navegador. Existen archivos heredados o auxiliares en el repositorio que no están montados en la navegación principal; su presencia no implica una función accesible desde el APK.

PatientContext debe contener Id_exp e id_atencion antes de abrir un formulario clínico. Una selección incorrecta puede relacionar información con otra atención; por ello los formularios y el servidor validan contexto y permisos.

| Ruta | Responsabilidad |
| --- | --- |
| src/screens/administrativo y admin | Expedientes, cuentas, censo, caja y camas |
| src/screens/medico | Historia, signos, notas, diagnóstico, receta, estudios y documentos |
| src/screens/enfermeria | Signos, notas, medicamentos, valoración, balance y cuidados |
| src/screens/estudios | Consulta, carga y edición de resultados |
| src/screens/config | Usuarios, catálogos, respaldo, automatización y perfil |
| src/screens/monitoring | Lista, detalle, historial y alertas |

## 4 Entorno de desarrollo reproducible

Usar Git, Node 22 y npm para el cliente. Android Studio y su SDK se requieren para herramientas locales; Expo EAS realiza la compilación remota con las credenciales del proyecto. El backend requiere su entorno Python y MongoDB, independientes del proceso móvil.

El cliente revisado usa JavaScript, React 19.2.3, React Native 0.86.3 y Expo 57.0.32. Las versiones exactas y las dependencias transitivas se reproducen mediante package-lock.json. No actualizar módulos nativos de manera aislada sin comprobar la matriz de Expo.

Antes de trabajar, revisar las instrucciones AGENTS.md del repositorio y comprobar la rama. Un entorno local no debe cargar variables ni datos de producción para una demostración.

1. Clonar el repositorio móvil y seleccionar la rama aprobada.

2. Instalar dependencias con npm ci.

3. Ejecutar pruebas, lint y Expo Doctor.

4. Arrancar QA y verificar la URL que utiliza el cliente.

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

## 5 Configuración por ambiente

app.config.js valida APP_ENV y define nombre, icono y extra.API_URL. Los ambientes permitidos son development, qa y production. QA y producción exigen HTTPS. Los valores EXPO_PUBLIC quedan incorporados en el cliente y deben considerarse públicos.

El perfil preview usa QA. production-apk hereda production y genera un APK de distribución interna. El nombre QA facilita distinguir ambientes, pero ambos APK conservan el identificador com.ineo.hospital y se reemplazan al instalarlos.

El proyecto Firebase se identifica como oftalcore-qa. Su nombre no determina a qué API envía datos la app: eso se define por APP_ENV y API_URL. Mantener los secretos del servidor separados por ambiente.

| Parámetro | Valor o uso |
| --- | --- |
| APP_ENV | development, qa o production |
| API QA | https://ineo-pbl-entrega.onrender.com/api/v1 |
| API producción | https://api-clinica-jx4m.onrender.com/api/v1 |
| EAS projectId | af5c4bd9-8c79-4271-8eea-6485e978d713 |
| Paquete Android | com.ineo.hospital |
| GOOGLE_SERVICES_JSON | Ruta del archivo de configuración Android |
| JWT y MongoDB | Secretos del backend; nunca variables públicas del cliente |

## 6 Exportación documental y control de caché de compilación

Para capturas y pruebas de interfaz puede exportarse el mismo cliente a web. Debe indicarse la plataforma en cada evidencia: una exportación web no acredita SecureStore nativo, notificaciones Android ni el selector y visor nativos de archivos.

Durante esta ampliación se detectó una exportación local que conservaba configuración de producción en caché. Se regeneró con variables QA explícitas y --clear y se comprobó la configuración incluida en el bundle antes de capturar el expediente sintético. No se cambiaron certificados ni controles de autenticación.

1. Definir las variables QA en el proceso de exportación.

2. Limpiar la caché de compilación y exportar a una carpeta de evidencia.

3. Servir la carpeta en 127.0.0.1 y abrirla con viewport móvil.

4. Confirmar APP_ENV y API_URL incluidos, iniciar sesión y filtrar el paciente sintético.

5. Cerrar la sesión y detener el servidor temporal al finalizar.

```powershell
$env:APP_ENV="qa"
$env:EXPO_PUBLIC_API_URL="https://ineo-pbl-entrega.onrender.com/api/v1"
npm run export:qa -- --clear --output-dir dist-manual
python -m http.server 8188 --bind 127.0.0.1 --directory dist-manual
```

## 7 Autenticación remota y ciclo de sesión

AuthContext envía username y password a POST /auth/login y valida que la respuesta contenga token y usuario con id, username y role. Una respuesta inválida no habilita los módulos autenticados. La sesión guardada se vuelve a comprobar con GET /auth/me al abrir la aplicación.

En Android e iOS el JWT se guarda mediante Expo SecureStore. En web se utiliza almacenamiento del navegador; esa modalidad no tiene la misma protección que el almacén nativo. El cliente Axios agrega Authorization Bearer y dispone de timeout general de 30000 ms.

El cierre llama POST /auth/logout, intenta retirar el registro push y limpia sesión y cachés locales incluso si falla la red. Un 401 limpia la sesión almacenada; las pantallas deben retornar a un flujo de acceso válido. No registrar JWT, contraseñas ni respuestas clínicas completas en diagnósticos.

| Caso | Comportamiento |
| --- | --- |
| Credenciales válidas | Token y usuario válidos permiten el dashboard |
| Credenciales incorrectas | Se conserva la pantalla de acceso y se informa el rechazo |
| Sesión almacenada inválida | Se elimina y se solicita iniciar sesión |
| 401 | Revisar expiración o revocación y autenticar de nuevo |
| 403 | Revisar el rol y la autorización del recurso |

## 8 Roles autorización y protección de datos

Las rutas móviles separan admin, administrativo, medico, enfermero o enfermeria y estudios. La navegación principal da acceso administrativo a admin y administrativo; médico a admin y medico; enfermería a admin y roles de enfermería; estudios a admin, medico y estudios; configuración a admin. Monitoreo está reservado a roles clínicos y admin.

La API es la autoridad final. Un usuario no debe acceder a otra atención modificando un identificador. La prueba de permisos debe verificar el endpoint y la relación del recurso con el usuario, además de la interfaz.

La app bloquea capturas nativas mediante expo-screen-capture y elimina consolas del bundle de producción. Las capturas de este manual se obtienen de la exportación web para documentar las vistas, sin modificar la protección nativa. Los datos del expediente documental 207 son sintéticos.

Mantener claves JWT diferentes por ambiente, mínimo privilegio en nube y respaldo restringido. Un conjunto de controles de aplicación no equivale a una certificación de seguridad o cumplimiento clínico.

## 9 Contratos administrativos

adminService y configurationService encapsulan peticiones y normalizan respuestas. Algunas consultas administrativas intentan rutas alternativas sólo ante 404 o 405, para compatibilidad con versiones de API. No deben utilizarse esos mecanismos para omitir errores de autenticación.

Id_exp identifica el expediente e id_atencion identifica la atención. En una misma cuenta de paciente se consultan cargos y documentos de la atención correspondiente. Antes de cualquier POST, PUT o DELETE se valida el contexto en el cliente y, de manera obligatoria, en el servidor.

| Operación | Método y ruta bajo /api/v1 |
| --- | --- |
| Opciones y búsqueda | GET /options; GET /patients/search?q=... |
| Grupos de pacientes | GET /gestion-pacientes?search=...&all=true y rutas compatibles |
| Expediente | GET /patients/{Id_exp}; POST /patients; PUT /patients/{Id_exp} |
| Censo y caja | GET /censo; GET /corte-caja |
| Cuenta | GET /cuenta-pacientes; GET /cuenta-pacientes/{id_atencion} |
| Cargos y pagos | POST /accounts/{id}/charges; POST /accounts/{id}/payments |
| Cierre | POST /accounts/{id}/close |
| Camas | GET y POST /beds; PUT y DELETE /beds/{id} |

## 10 Contratos médicos y de enfermería

Los formularios clínicos reciben el contexto de atención y expediente del navegador. Las funciones puras de src/utils/clinicalSecurity.js validan campos y producen mensajes controlados para errores de sesión, permiso, conflicto o datos inválidos.

El historial se consulta después del guardado cuando lo exige el proceso. La nota de enfermería usa id_nota para comprobar sincronización. No reintentar automáticamente un POST ante una respuesta incierta: consultar antes para evitar duplicados.

| Dominio | Método y ruta bajo /api/v1 |
| --- | --- |
| Panel y detalle | GET /medico; GET /paciente/{id_atencion}/{Id_exp} |
| Historia clínica | GET y POST /historia-clinica/{id_atencion}/{Id_exp} |
| Signos | GET y POST /appointments/{id}/vital-signs |
| Nota médica | GET y POST /appointments/{id}/medical-notes |
| Diagnóstico | GET y POST /appointments/{id}/diagnosis |
| Receta | GET y POST /appointments/{id}/prescriptions |
| Nota de enfermería | GET y POST /appointments/{id}/nursing-notes |
| Aplicación de medicamentos | GET y POST /appointments/{id}/medications |
| Valoración balance cuidados | GET y POST /appointments/{id}/nursing-assessment, fluid-balance y nursing-care |

## 11 Validaciones de formularios y errores de escritura

La validación compartida exige identificadores positivos de expediente y atención. En historia clínica, el motivo tiene entre 3 y 500 caracteres y los campos narrativos validados hasta 2000. La receta acepta entre 1 y 10 medicamentos y exige nombre, dosis, frecuencia y duración por renglón.

La nota de enfermería admite hasta 5000 caracteres y conserva el borrador cuando falla el envío. Las pantallas de balance y cuidados normalizan y validan valores antes del POST. Las validaciones del cliente mejoran el uso, pero no sustituyen los límites del servidor.

Los valores y unidades de signos se capturan según el formulario; no se documentan umbrales clínicos de decisión como si la app estuviera certificada. La temperatura del sensor MPU se presenta separada de una temperatura corporal.

| Respuesta | Acción de operación |
| --- | --- |
| 400 o 422 | Revisar campos, tipos, unidades y contexto |
| 401 | Iniciar sesión nuevamente |
| 403 | Confirmar autorización del usuario |
| 404 | Verificar identificador y versión de API |
| 409 | Actualizar y comprobar cambios concurrentes |
| 429 | Esperar y revisar frecuencia de solicitudes |
| Timeout o 5xx | Consultar persistencia antes de repetir una escritura |

## 12 Estudios archivos y documentos PDF

El módulo médico solicita estudios desde /exams/catalog y POST /exams/request. Estudios lista solicitudes, cuenta pendientes, carga resultados y permite consultar o editar según el rol y el estado. El archivo y sus observaciones deben quedar asociados a la solicitud correcta.

fileService centraliza descargas autenticadas y genera nombres seguros. En web usa un blob; en nativo guarda temporalmente el contenido y utiliza expo-sharing cuando está disponible. Los archivos temporales y los exportados deben tratarse como información sensible si contienen datos identificables.

Limitación de la implementación revisada: los PDF heredados pueden añadir un token como parámetro de consulta además del encabezado Bearer. Por ello no deben copiarse URLs de descarga ni conservarse en logs compartidos. Se propone migrar esos endpoints a Bearer exclusivamente o a enlaces de vida corta; esta ampliación documental no cambia ese contrato.

| Contrato | Uso |
| --- | --- |
| GET /exams/catalog?type=... | Catálogo LABORATORIO o GABINETE |
| POST /exams/request | Solicitud para una atención |
| GET /exams/patient/{id}?type=... | Estudios del paciente |
| GET /exams/counts | Indicadores |
| Resultados y /pdf/... | Consultar las rutas exactas en los servicios y en la API de la versión desplegada |

## 13 Persistencia relaciones y respaldos de datos

MongoDB conserva expedientes y atenciones; la app no se conecta directamente a la base de datos. La API obtiene las colecciones y serializa los documentos. La relación entre paciente, atención y registros se mantiene mediante identificadores de negocio y referencias.

Colecciones identificadas en los modelos incluyen pacientes, atencion, atencion_medicos, familiares, camas, cuenta_paciente, examenes, examenes_det y catalogo_examenes. Monitoreo agrega sus propias colecciones de dispositivos, lecturas, alertas y envío de avisos según el servicio de la versión desplegada.

No escribir directamente en MongoDB para corregir una pantalla sin un procedimiento de operación. Una intervención debe verificar integridad, índices, identificadores y respaldo. Git conserva código y documentos; no sustituye el respaldo de la base de datos.

| Entidad | Relación principal |
| --- | --- |
| Paciente | Id_exp; puede tener varias atenciones |
| Atención | id_atencion e Id_exp; área, estado y asignación |
| Registro clínico | Asociado a id_atencion y autor o fecha según dominio |
| Estudio | Solicitud, detalle y archivo de resultado |
| Dispositivo | Asociación con expediente y credencial propia |
| Alerta | Evento del dispositivo y estado de reconocimiento |

## 14 Caché paginación y actualización

CacheService utiliza memoria con TTL predeterminado de cinco minutos. Otras vistas fijan su propio TTL y claves. adminCache y EstudiosCache organizan cachés por dominio; deben limpiarse al cambiar o cerrar sesión.

monitoringCache conserva hasta 40 entradas durante 120 segundos, agrupa solicitudes simultáneas de una misma clave y usa una generación para descartar respuestas de una sesión anterior. Su clave incluye usuario, paciente, páginas, filtro y ancla de historial. No se escribe a disco.

Monitoreo solicita diez elementos por página y refresca cada diez segundos sólo cuando está activo. El detalle separa páginas de historial y alertas. En otras pantallas la paginación puede ser local después de solicitar todos los datos; no debe presentarse como paginación de servidor en todos los módulos.

Para diagnóstico, distinguir tiempo de arranque de Render, consulta del backend, transferencia y renderizado. Usar Actualizar o Recargar para comparar con caché. Una vista en caché no acredita una lectura nueva del dispositivo.

## 15 Monitoreo y contrato de telemetría

GET /monitoring/patients recibe page, page_size y q. El detalle GET /monitoring/patients/{id} recibe history_page, alerts_page e history_before para conservar una referencia del historial. PATCH /monitoring/alerts/{id}/acknowledge reconoce una alerta y obliga a renovar el dato mostrado.

El ESP32 utiliza POST /monitoring/data con la credencial del dispositivo y la estructura de telemetría validada por el backend. No utiliza el JWT de Alex. La asociación del identificador se hace en la web o en el formulario administrativo permitido por la versión de la interfaz.

La URL del firmware revisado apunta a QA. Instalar un APK de producción no cambia esa URL ni mueve la asociación del dispositivo. El expediente de IoT de referencia es OFTALCORE-000205; el expediente 207 se creó únicamente para documentar formularios generales.

1. Confirmar la API y el identificador configurados en el firmware.

2. Consultar la última recepción y verificar un HTTP 201 en el monitor serie.

3. Abrir el mismo ambiente en web y móvil.

4. Verificar la lectura y reconocer una alerta sintética una sola vez.

5. Registrar por separado una prueba física del algoritmo MPU y una alerta por comando.

Referencia visual: consultar la captura 40-detalle-monitoreo.png y su procedimiento en el manual de usuario.

## 16 Prototipo ESP32 alimentación y fallos de red

El firmware de referencia se ubica en firmware/WearableINEO_QA del repositorio de API y utiliza MAX30102 y MPU. La configuración revisada define SDA 8, SCL 9 y la URL HTTPS de QA. Las credenciales de WiFi y dispositivo se administran por su mecanismo privado y no se transcriben en el manual.

La detección del MPU tiene etapas de caída libre, impacto y confirmación. Su presencia en código no demuestra sensibilidad ni especificidad clínica. El comando prueba-caida crea un evento simulado y debe identificarse como tal en las evidencias.

Para trabajar sin computadora se requiere una alimentación adecuada para la placa y acceso a la misma red o a otra configurada. El punto de acceso de la laptop depende de que esté activo y comparta Internet. La conexión WiFi no acredita envío a la API.

No aplicar 9 V a un pin de 3.3 V o 5 V sin verificar el circuito y la especificación de la placa. Para una demostración, usar una alimentación USB regulada y comprobada. Este manual no sustituye el esquema eléctrico del fabricante.

| Etapa | Verificación |
| --- | --- |
| WiFi | Red de 2.4 GHz, contraseña y dirección IP |
| DNS | Resolución del host QA |
| Hora | Sincronización necesaria para validar HTTPS |
| HTTPS | Certificado validado y respuesta de la API |
| Credencial | Dispositivo asociado al expediente correcto |
| Sensores | Contacto estable en MAX30102 y estado del MPU |

## 17 Notificaciones Expo Push y Firebase

La app solicita permiso en Android, obtiene un token Expo del proyecto EAS y lo registra mediante PUT /monitoring/push-devices con la sesión actual. DELETE retira el registro. El listener comprueba la sesión y el destinatario antes de navegar al paciente.

Expo utiliza la credencial FCM cargada en EAS para Android. google-services.json es configuración del cliente; la clave privada de la cuenta de servicio no debe incluirse en Git ni en el APK. El backend debe tener envío habilitado, planificador o cola activos y conectividad con el proveedor.

El código considera cambios de sesión para no registrar o entregar eventos en un contexto anterior. La prueba de recepción requiere un dispositivo compatible, permiso, Internet y una alerta del mismo ambiente. Cerrar normalmente la app no es equivalente a Forzar detencion.

Las notificaciones previas de QA fueron comprobadas por el usuario en la etapa anterior. La exportación web y estas capturas no acreditan una nueva prueba push de Android ni habilitación de envío en producción.

1. Verificar configuración del proyecto Android y la credencial FCM en EAS.

2. Revisar MONITORING_PUSH_ENABLED y el procesador de avisos del backend.

3. Registrar el token desde el APK del ambiente correcto.

4. Enviar una alerta sintética, comprobar recepción y apertura autorizada.

5. Cerrar sesión y comprobar la baja del registro; conservar sólo metadatos de diagnóstico.

## 18 Compilación firma y verificación del APK

EAS administra el versionCode de forma remota. El perfil production usa autoIncrement; preview utiliza la versión remota correspondiente. Un cambio de URL o de módulos nativos requiere un APK nuevo; una actualización de manuales no modifica el binario existente.

Los APK de referencia QA y producción tienen appVersion 1.0.0 y versionCode 8. Usan la misma firma de proyecto y el mismo paquete, de modo que no se instalan como dos aplicaciones separadas. El nombre y el icono varían con APP_ENV.

Antes de distribuir, verificar estado FINISHED, perfil, commit, paquete, nombre, API incluida y SHA256. Guardar un manifiesto sin enlaces temporales de logs ni credenciales. Una compilación exitosa no sustituye los recorridos de aceptación en el teléfono.

| Comprobación Android SDK | Propósito |
| --- | --- |
| apksigner verify --print-certs archivo.apk | Validar firma e identificar el certificado público |
| aapt dump badging archivo.apk | Comprobar paquete, versión y nombre |
| assets/app.config en el APK | Comprobar extra.APP_ENV y extra.API_URL |

```powershell
npx eas-cli login
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform android --profile production-apk
npx eas-cli build:view 87df360f-9cfb-45eb-b84d-448fb50c68e3
Get-FileHash .\OftalCore-QA-IoT-1.0.0-build8.apk -Algorithm SHA256
```

## 19 Integración continua y estrategia de liberación

Trabajar en una rama desde develop, abrir PR y promover a qa y después a main. Los controles incluyen instalación reproducible, pruebas, lint, Expo Doctor, exportaciones, auditoría de dependencias, detector de secretos y CodeQL. No omitir un fallo de CI para completar una promoción.

La entrega anterior integró PR 54 a develop, PR 55 a qa y PR 56 a main con sus controles aprobados y comprobaciones posteriores de main correctas. El código de las tres ramas coincidió al cierre del 8 de noviembre. Las capturas y resultados históricos se conservan con su fecha.

La auditoría registrada entonces reportó cero vulnerabilidades y 55 pruebas aprobadas. Ese resultado es de la versión y fecha registradas; una dependencia nueva requiere repetir los controles. Para revertir, crear un PR de reversión y comprobar compatibilidad con datos y API; no reescribir el historial compartido.

1. Documentar alcance, riesgos y criterios de aceptación del cambio.

2. Ejecutar controles locales y revisar el PR con sus resultados CI.

3. Probar en QA con datos sintéticos y registrar la versión del APK.

4. Promover a main sólo con autorización y controles aprobados.

5. Verificar el ambiente después de la promoción y conservar la versión anterior.

```powershell
npm ci
npm test
npm run lint
npx expo-doctor
npm run export:qa
npm audit --audit-level=high
npm run security:policy
npm run security:review
```

## 20 API nube configuración y disponibilidad

Render ejecuta la API y administra sus variables de entorno. La configuración de referencia incluye MONGO_URI, MONGO_DB, SECRET_KEY, JWT_SECRET_KEY, API_PREFIX y orígenes CORS. Usar valores privados por ambiente y limitar CORS a los clientes que deben acceder; no permitir un origen sólo para evitar investigar un fallo.

La API debe enlazarse al puerto que asigne la plataforma y exponer /health para comprobar disponibilidad. Un 200 en ese endpoint no acredita todos los módulos, la base de datos ni el envío push. La observabilidad debe distinguir errores de autenticación, consulta y proveedores.

El backend de referencia contiene rutas y servicios por dominio. Las versiones Python y paquetes se toman del archivo de requisitos y runtime del repositorio del servidor, no del package.json móvil. El despliegue del backend se administra en su propio flujo.

Se observaron arranques fríos QA de alrededor de 42 segundos en verificaciones anteriores. El timeout general del cliente es de 30 segundos, por lo que el primer acceso puede requerir reintento después del arranque. No solucionar una demora desactivando HTTPS ni la validación de certificados.

## 21 Respaldos restauración y automatización

configurationService consulta /backup, /backup/collections y /backup/health. La creación usa POST /backup/create; restauración POST /backup/restore; descarga /backup/download/{filename}; eliminación DELETE /backup/{filename}; programación GET y PUT /backup/automation. Crear y restaurar tienen timeout específico de hasta diez minutos.

La política operativa debe definir frecuencia, retención, cifrado, responsables y ubicación de respaldo. Las opciones completa, incremental y diferencial requieren validar qué datos produce realmente la versión del servicio y cómo se restauran. Los formatos de consulta PDF o Excel no garantizan recuperación integral.

La restauración debe probarse primero en un entorno aislado. Para producción se necesita aprobación operativa, ventana, respaldo previo y plan de recuperación. No se ejecutó ninguna restauración de producción para estas capturas.

1. Inventariar los datos y verificar la salud del sistema.

2. Crear un respaldo autorizado y comprobar descarga, tamaño y hash.

3. Ensayar la restauración en QA aislado sin datos reales.

4. Comparar recuentos, relaciones y acceso a registros de prueba.

5. Verificar automatización por archivos y logs, no sólo por el interruptor de la interfaz.

6. Registrar resultado y controlar acceso a los archivos de respaldo.

Referencia visual: consultar la captura 36-respaldos.png y su procedimiento en el manual de usuario.

## 22 Plan de pruebas y aceptación por módulos

Las capturas muestran acceso y formularios del cliente conectado a QA; no demuestran por sí solas que una escritura fue persistida. Cada prueba de guardado necesita resultado visible y consulta posterior, y cada prueba nativa necesita dispositivo y versión.

Para esta documentación se creó el expediente sintético 207 con atención 926. El expediente IoT 205 conserva su función de prueba del prototipo. No se registraron tratamientos reales ni se restauraron respaldos para preparar los manuales.

En el censo se observó un mensaje de fallo de consulta durante la sesión documental. Se conserva la captura como ejemplo de recuperación y se registra el comportamiento; no se presenta como un caso funcional aprobado.

| Grupo | Casos de aceptación |
| --- | --- |
| Identidad y roles | Login válido e inválido; sesión expirada; acceso denegado; cierre y revocación |
| Administración | Alta, búsqueda, edición, cuenta, cargos sintéticos y documentos |
| Medicina | Historia, signos, nota, diagnóstico, receta y solicitud de estudios |
| Enfermería | Signos, nota, medicamentos, valoración, balance y cuidados |
| Estudios | Carga, consulta y edición de archivo sintético |
| Configuración | Catálogos y perfil; respaldo y restauración sólo en entorno autorizado |
| Monitoreo | Páginas, caché, lectura reciente, desconexión y reconocimiento |
| Android | Instalación, permisos, archivos, recepción y apertura push |

## 23 Diagnóstico de incidentes y soporte

Registrar versión, ambiente, dispositivo, Android, hora, pasos, estado HTTP y mensaje visible. Retirar credenciales y datos clínicos de las evidencias. Identificar si el fallo proviene del cliente, la red, Render, la API, MongoDB o el proveedor de avisos.

Una respuesta incierta tras guardar debe resolverse consultando el historial; no repetir la operación a ciegas. Un filtro vacío debe revisarse antes de concluir que se perdió información. Una lectura antigua no demuestra que el dispositivo esté enviando.

| Síntoma | Procedimiento |
| --- | --- |
| Error de conexión | Comprobar Internet, /health, arranque frío y URL incluida en el APK |
| Datos de otro ambiente | Revisar APP_ENV/API_URL; exportar con caché limpia o instalar el APK correcto |
| Paciente sin contexto | Volver al listado y elegir expediente y atención |
| Consulta de censo fallida | Recargar y revisar endpoint y logs del backend; registrar el error |
| PDF no descarga | Revisar sesión, ruta, permisos, respuesta y visor; no divulgar URL con token |
| ESP32 sin recepción | Revisar alimentación, WiFi, DNS, hora, HTTPS y credencial |
| Push ausente | Comprobar permiso, token, sesión, cola, habilitación y respuesta del proveedor |
| Restauración o corrupción | Detener escrituras según el plan de incidente y usar recuperación autorizada |

## 24 Inventario de evidencia y control documental

Las capturas-manuales corresponden a la sesiones documentales del 12 y 16 de noviembre de 2026. El manifiesto de capturas identifica ambiente, plataforma, uso del control auxiliar de menú y datos sintéticos. Los formularios no se presentan como escrituras verificadas sólo por estar abiertos. La incidencia de censo queda diferenciada de los recorridos de consulta disponibles.

| Archivo o carpeta | Contenido |
| --- | --- |
| 02 y 03 documentos Word | Manuales ampliados con portada institucional y paginación. |
| manual-usuario.md y manual-tecnico-operacion.md | Fuentes textuales para revisión y versionamiento. |
| capturas-manuales | Imágenes del cliente y manifiesto de captura. |
| version-entrega.json | Procedencia de los APK de la entrega anterior. |
| evidencias/integracion-git.json en paquete | Promociones PR 54, 55 y 56 y CI aprobado. |
| Registro de aceptación | Dispositivo, versión, ambiente, fecha, responsable y resultado por caso. |

Para reproducir una ampliación, verificar primero el commit de código y el ambiente. Conservar el hash de los manuales y el de los APK y no reemplazar una evidencia histórica por una afirmación nueva sin ejecutar la prueba. La autenticación y los permisos deben permanecer activos durante la documentación.

## Fuentes del proyecto

Repositorio móvil: https://github.com/JoelLara10/app-movil-clinica
Repositorio de API y web: https://github.com/JoelLara10/ineo-pbl-entrega
Código de cliente de referencia: 837c86b
Promoción a main: https://github.com/JoelLara10/app-movil-clinica/pull/56

Las versiones de paquetes se toman de package-lock.json; las rutas de navegación de MainNavigator.js; los contratos móviles de src/services y src/screens; las validaciones de clinicalSecurity.js; la configuración por ambiente de app.config.js y eas.json. El firmware y los servicios de servidor se consultaron en su repositorio para documentar su relación con la app.
