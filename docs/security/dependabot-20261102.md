# Revisión de Dependabot y dependencias — 2 de noviembre de 2026

El PR #47 mezcla actualizaciones de JavaScript con cambios de la matriz nativa de Expo 57. Su instalación reproducible falla porque falta react-native-worklets@0.10.4 en el lockfile. No se debe integrar tal como está.

Esta corrección actualiza Drawer, Stack, Axios y React Native Web; conserva React 19.2.3, React Native 0.86.3 y las versiones nativas coordinadas con Expo. Se regenera package-lock.json y se restringen las actualizaciones automáticas menores de React y React Native. Las migraciones de SDK se revisan juntas; los avisos de seguridad siguen visibles.

Se incorpora el cambio del PR #46: upload-artifact v7 en runners hospedados de GitHub. No se modifican permisos ni umbrales de seguridad.

Overrides de herramientas: glob 14.0.3 y minimatch 11.0.4 corrigen GHSA-3g3m-2fjr-6pw4 y GHSA-g3hv-75wg-m249. Por cruzar versiones mayores de herramientas transitivas, se validan Expo Doctor y exportaciones web y Android.

## Riesgo residual explícito

La auditoría pasa de 12 resultados moderados y 2 bajos a **0 moderados, 0 altos y 0 críticos**, con **7 resultados bajos** que proceden de un único aviso: deepmerge (GHSA-gcqx-w48m-w2h4) en la cadena de herramientas de configuración de Expo. El registro no ofrece una versión 4.x corregida (la última es 4.3.1). npm propone migrar a Expo 58; esa migración requiere actualizar la matriz nativa y probar un APK nuevo. No se fuerza una versión antigua ni se oculta el aviso.

Hasta actualizar el SDK, ejecutar builds con configuración y plugins de confianza; no aceptar configuración Expo de fuentes no confiables. Esta revisión no sustituye pruebas físicas del APK ni garantiza ausencia total de vulnerabilidades.

## Validación

Instalación mediante npm ci, pruebas del proyecto, lint, expo install --check y expo-doctor; exportaciones de QA web/Android y producción web en CI. El PR conserva las comprobaciones de secretos y CodeQL. Los informes completos de las puertas de seguridad quedan en los artefactos de GitHub Actions.
