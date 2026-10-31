# Revisión automática de OftalCore Mobile

Adaptación de los controles del repositorio PBL al proyecto Expo/React Native.

| Control | Cuándo se ejecuta | Resultado |
| --- | --- | --- |
| Mobile CI | PR y push a develop, qa o main | Pruebas, Expo Doctor y exportaciones web producción/QA y Android QA |
| Mobile Code and Security Review | PR y push; horario semanal preparado | Auditoría completa npm, secretos, Oxlint, pruebas móviles y política de rechazo |
| Mobile CodeQL security analysis | PR y push; horario semanal preparado | Análisis JavaScript/TypeScript con consultas security-extended, visible en Security / Code scanning |
| Dependabot | Revisión semanal preparada | PRs de npm, herramientas Python y GitHub Actions hacia develop; sin auto-merge |

Las revisiones de PR/push se activan al integrar los workflows. GitHub solo ejecuta
`schedule` y descubre `dependabot.yml` desde la rama predeterminada. Mientras
`main` no contenga esta configuración, las revisiones semanales y Dependabot
están preparadas, pero no activas. No se cambia la rama predeterminada ni se
promueve a main como parte de esta entrega. El horario de Actions revisa develop
y qa por separado cuando se active. Las horas cron están en UTC.

## Política de aceptación

- La auditoría incluye dependencias de ejecución y de desarrollo. Alta o crítica
  produce FAIL; las severidades inferiores permanecen visibles en el informe.
- Un escáner que no arranca, falla o devuelve un informe incompleto produce FAIL.
- Los errores de sintaxis, referencias no definidas, claves duplicadas, código
  inalcanzable y comparaciones redundantes bloquean Oxlint. Advertencias de estilo
  o variables sin uso se conservan sin impedir la revisión inicial.
- Detect-secrets revisa los archivos versionados, también pruebas y configuración.
  El catálogo revisado identifica archivo, detector y hash exactos. No exime
  directorios ni permite automáticamente futuros valores. La configuración pública
  de cliente Firebase y los textos de traducción no son claves de servidor.
- Los informes de secretos conservan ubicación y detector, sin valores ni extractos
  de código. Los artefactos incluyen SHA, fecha UTC, resumen JSON/Markdown y JUnit,
  y se conservan 14 días, también cuando un control falla.
- Las pruebas de la política demuestran rechazo de secretos nuevos, catálogos
  inválidos, dependencias altas/críticas y escáneres rotos.
- Ningún workflow despliega, fusiona PRs ni recibe credenciales de producción.

Un check rojo no equivale a una regla de protección de ramas. Para exigirlos al
fusionar, un administrador debe seleccionar los checks en las reglas de GitHub.
Esta entrega no modifica permisos ni las protecciones existentes. CodeQL publica
hallazgos; el éxito de su ejecución no significa ausencia de alertas. Revisar la
pestaña Security antes de aceptar cambios.

## Ejecutar localmente

Requisitos: Node 22, Python 3.12 o superior y Git.

```sh
npm ci
python -m pip install -r ci/requirements-security.txt
npm run security:policy
npm run security:review
```

Los reportes locales quedan en `reports/security/local/` (no versionados).
Las  comprobaciones no requieren cuentas QA ni datos de pacientes. No se deben
agregar tokens, contraseñas ni cuentas reales a pruebas o excepciones.

## Compatibilidad y remediación inicial

Se conserva Expo SDK 57, React Navigation, las URLs API y los identificadores de la
app. Se fijan follow-redirects 1.16.2 y node-forge 1.4.2. Zod 4.6.7 se limita al
consumidor `@expo/cli`, cuya versión instalada utilizaba Zod 3 sin parche compatible
para la alerta publicada. Una prueba ejercita los dos módulos consumidores de
Zod del CLI (metadatos de plugins y esquema MCP), además de Expo Doctor y las
exportaciones. Revisar estos overrides al actualizar Expo; no sustituirlos por
`npm audit fix --force`.

Se corrigen dos expresiones redundantes, dos claves de traducción duplicadas
(conservando el valor que ya prevalecía), una importación faltante de AuthNavigator
y el alcance de la clave de caché usada en el manejo de errores del historial de
diagnósticos. Las actualizaciones major de npm requieren revisión coordinada con
Expo; Dependabot no las fusiona ni propone como actualizaciones semanales normales.

## Jenkins opcional

`ci/Jenkinsfile.security` reutiliza el mismo ejecutor y publica JUnit/artefactos.
Requiere un agente Linux con Node 22, Python 3.12 y venv. No crea ni configura un
servidor o job Jenkins; GitHub Actions funciona independientemente.

Referencias: [Dependabot](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference),
[CodeQL](https://docs.github.com/en/code-security/code-scanning),
[Expo](https://docs.expo.dev/),
[Oxlint](https://oxc.rs/docs/guide/usage/linter/cli.html).
