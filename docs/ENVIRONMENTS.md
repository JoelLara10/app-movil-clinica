# Ambientes de INEO Mobile

## Flujo de ramas

- `develop`: integración diaria mediante pull request.
- `qa`: versión candidata para SIT, UAT y compilaciones internas de EAS.
- `main`: código aprobado para publicación en tiendas.

Flujo: rama de trabajo → `develop` → `qa` → `main`.

## Configuración

La URL del API no es un secreto, pero debe asignarse por ambiente. Las
credenciales, JWT y llaves privadas nunca deben usar variables
`EXPO_PUBLIC_*`, porque quedan incluidas en la aplicación compilada.

| Ambiente | APP_ENV | EXPO_PUBLIC_API_URL |
|---|---|---|
| Desarrollo | `development` | API local, por ejemplo `http://10.0.2.2:5001/api/v1` |
| QA | `qa` | `https://ineo-pbl-entrega.onrender.com/api/v1` (QA) |
| Producción | `production` | `https://api-clinica-jx4m.onrender.com/api/v1` |

Antes de compilar QA:

```bash
eas build --profile preview --platform android
```

No se debe fusionar `qa` hacia `main` hasta aprobar SIT, UAT, inicio y
cierre de sesión, permisos por rol, descarga de documentos y pruebas contra el
API del ambiente correspondiente.
