# OftalCore móvil

Aplicación móvil para gestión de una clínica oftalmológica. React Native y Expo consumen la API de OftalCore para autenticación, atención por roles, registros, estudios y monitoreo de pacientes.

## Documentación de la segunda entrega

La entrega académica corresponde al 28 de noviembre de 2026. Los documentos se prepararon y verificaron inicialmente el 7 de noviembre.

- [Informe y requisitos](docs/segunda-entrega/informe.md)
- [Manual de usuario](docs/segunda-entrega/manual-usuario.md)
- [Manual técnico y de operación](docs/segunda-entrega/manual-tecnico-operacion.md)
- [Índice de archivos y evidencias](docs/segunda-entrega/README.md)
- [Ambientes y flujo de ramas](docs/ENVIRONMENTS.md)
- [Revisión de dependencias](docs/security/dependabot-20261102.md)

Los documentos Word editables se encuentran en `docs/segunda-entrega`. La documentación identifica las pruebas remotas, las capturas del cliente exportado a web y los recorridos que requieren aceptación en el APK instalado.

## Desarrollo y validación

Usar Node 22 y el lockfile del proyecto.

```powershell
npm ci
npm test
npm run lint
npm run start:qa
```

Los workflows de GitHub Actions validan pruebas, Expo Doctor, exportaciones y seguridad. `npm run security:review` requiere las herramientas Python de `ci/requirements-security.txt`.

## Compilación Android

```powershell
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform android --profile production-apk
```

`preview` utiliza la API QA. `production-apk` utiliza la API de producción. Los perfiles se definen en `eas.json` y la app valida HTTPS para ambos ambientes.

## Código y servicios

- [Repositorio móvil](https://github.com/JoelLara10/app-movil-clinica)
- [API y cliente web](https://github.com/JoelLara10/ineo-pbl-entrega)
- [Compilación de producción 7](https://expo.dev/accounts/joeeel10/projects/ineo-hospital/builds/541abb20-ce01-4823-9418-672a6d05cd11)

El flujo de integración usa ramas de trabajo, `develop`, `qa` y `main`. Los secretos de API, firma y FCM se administran fuera del repositorio. Las evidencias deben usar información sintética o agregada.
