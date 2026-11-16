# 02 – Matriz de hallazgos (paso 3 del taller, Guía N°08)

## Línea base

| Dato | Valor |
|---|---|
| Análisis | `main`, 2026-11-09 05:30 UTC, commit `f1b490b` (tag `sonar-antes`) |
| Triage previo | 139 `python:S930` marcados como **False Positive** (justificación en `01-escaneo-inicial.md`) |
| Bugs abiertos tras el triage | **56** (1 Blocker, 55 Major) · Reliability **E** |
| Vulnerabilidades | **12** · Security **D** |
| Code Smells | **188** · Maintainability **A** |
| Quality Gate | **FAILED**, por `new_security_rating = C` (umbral A) |

## Período de código nuevo

- Configuración: `previous_version`.
- El proyecto no define `sonar.projectVersion`, así que todos los análisis tienen la versión *"not provided"*. Por eso la referencia es el **primer análisis**, del 2026-11-05 17:58 UTC sobre el commit `ee03b91`.
- **Código nuevo = toda línea agregada o modificada después de ese primer análisis.** Las condiciones del Quality Gate se evalúan solo sobre ese código.
- Hoy solo hay **un** issue en código nuevo: la línea 24 de `.github/workflows/sonarqube.yml`, que se cambió en los PRs #23/#24 al pasar a `sonarqube-scan-action@v8.4.1`. Esa Vulnerabilidad Major baja el `new_security_rating` a C. Al corregirla, el Security rating del código nuevo vuelve a A y las otras cinco condiciones ya están en OK.
- Las correcciones de este taller también serán código nuevo, así que **no deben introducir issues nuevos**.

## Matriz

| N° | Tipo | Severidad | Regla | Archivo | Línea | Descripción | Estado inicial | Rama de corrección | Issue en SonarCloud |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Bug | Major | `pythonbugs:S2259` | `RehniMarket-backend/app/services/authentication/CertificateUpdateService.py` | 38 | Acceso al atributo `company.CompanyStatus` sobre un valor que puede ser `None`: el analizador no sabe que `api_error()` siempre lanza una excepción | Abierto | `fix/sonar-bugs` | [AaGs3VUW78yaOTTff0ep](https://sonarcloud.io/project/issues?id=RehnieyAl_Rehni-Market&branch=main&issues=AaGs3VUW78yaOTTff0ep&open=AaGs3VUW78yaOTTff0ep) |
| 2 | Bug | Major | `typescript:S9383` | `RehniMarket-frontend/src/features/public/auth/context/AuthProvider.tsx` | 73 | La promesa de `resolveSession()` se lanza en el `useEffect` sin `await`, `.catch` ni `void` explícito; si falla, el rechazo queda sin manejar | Abierto | `fix/sonar-bugs` | [AaGs3VWf78yaOTTff0hP](https://sonarcloud.io/project/issues?id=RehnieyAl_Rehni-Market&branch=main&issues=AaGs3VWf78yaOTTff0hP&open=AaGs3VWf78yaOTTff0hP) |
| 3 | Vulnerabilidad | Major | `githubactions:S7637` | `.github/workflows/sonarqube.yml` | 24 | La acción de terceros `SonarSource/sonarqube-scan-action@v8.4.1` está referenciada por un tag mutable y no por el SHA completo del commit (riesgo de cadena de suministro; el job maneja `SONAR_TOKEN`) | Abierto | `fix/sonar-vulnerabilidad` | [AaGtpeAOgOTilgf5ulx8](https://sonarcloud.io/project/issues?id=RehnieyAl_Rehni-Market&branch=main&issues=AaGtpeAOgOTilgf5ulx8&open=AaGtpeAOgOTilgf5ulx8) |
| 4 | Code Smell | Critical | `python:S6903` | `RehniMarket-backend/app/services/authentication/JWTService.py` | 16 y 30 | Uso de `datetime.utcnow()` (obsoleto desde Python 3.12, devuelve un datetime *naive*) para calcular el `exp` del access token y del refresh token | Abierto | `refactor/sonar-code-smells` | [AaGs3VUY78yaOTTff0eq](https://sonarcloud.io/project/issues?id=RehnieyAl_Rehni-Market&branch=main&issues=AaGs3VUY78yaOTTff0eq&open=AaGs3VUY78yaOTTff0eq) · [AaGs3VUY78yaOTTff0er](https://sonarcloud.io/project/issues?id=RehnieyAl_Rehni-Market&branch=main&issues=AaGs3VUY78yaOTTff0er&open=AaGs3VUY78yaOTTff0er) |
| 5 | Code Smell | Major | `typescript:S6853` | `RehniMarket-frontend/src/features/admin/components/dashboard/user/RechargeWalletModal.tsx` | 95 y 123 | Los `<label>` "Monto (RC)" y "Descripción (opcional)" no están asociados a su `<input>` (sin `htmlFor`/`id`): los lectores de pantalla no anuncian el campo y el clic en la etiqueta no enfoca el input | Abierto | `refactor/sonar-code-smells` | [AaGs3VXE78yaOTTff0ht](https://sonarcloud.io/project/issues?id=RehnieyAl_Rehni-Market&branch=main&issues=AaGs3VXE78yaOTTff0ht&open=AaGs3VXE78yaOTTff0ht) · [AaGs3VXE78yaOTTff0hu](https://sonarcloud.io/project/issues?id=RehnieyAl_Rehni-Market&branch=main&issues=AaGs3VXE78yaOTTff0hu&open=AaGs3VXE78yaOTTff0hu) |

Resultado: 2 Bugs, 1 Vulnerabilidad y 2 Code Smells (7 issues de SonarCloud en total). Ningún hallazgo es un `python:S930` y todos están en código propio del proyecto.

## Notas de evaluación

### Hallazgo descartado: Blocker `plsql:DeleteOrUpdateWithoutWhereCheck` (`scripts/migracion/transformar.sql:96`)

Es **intencional** y no es un riesgo real, así que no se usa en la matriz.

- El `UPDATE` sin `WHERE` actúa sobre `migracion.normalizados`. Esa tabla de *staging* se crea en las líneas 81-93 del mismo script (`DROP TABLE IF EXISTS` + `CREATE TABLE … AS SELECT`) y dentro de la misma transacción (`BEGIN` en la línea 16).
- El objetivo es calcular la columna `motivos` (motivos de rechazo) para **todas** las filas importadas, así que el `WHERE` faltante es justamente lo correcto.
- Nunca toca tablas de `public`. El esquema `migracion` es auxiliar y desechable (`DROP SCHEMA migracion CASCADE`).
- Poner un `WHERE true` solo para callar la regla empeoraría la legibilidad sin reducir ningún riesgo.

Ojo: este Blocker es lo único que mantiene Reliability en **E** en el código global. Esa nota **no** es condición del Quality Gate, que evalúa el código nuevo.

### Honestidad sobre los Bugs

- **N°1 (S2259):** en ejecución no se produce el `AttributeError`, porque `api_error()` siempre hace `raise HTTPException`. El defecto real es que la función no declara que nunca retorna (`-> NoReturn`). Por eso el analizador y cualquier lector suponen que la ejecución sigue con `company = None`. Es un contrato implícito que se corrige haciéndolo explícito.
- **N°2 (S9383):** hoy las llamadas internas de `resolveSession()` están protegidas (`getProfile().catch(() => null)`), pero la función no tiene `try/catch` propio. Si `clearTokens()` o un cambio futuro lanzara un error, el rechazo quedaría sin manejar y el estado de autenticación se quedaría en `"loading"`. Los 54 `S9383` del frontend y del mobile siguen el mismo patrón (*fire-and-forget* en `useEffect`). Este es el más relevante porque controla toda la sesión.
- Ninguno de los 56 Bugs abiertos produce hoy un fallo observable en la aplicación. Todos son defectos latentes de robustez o de contrato. No se introdujeron errores a propósito.

## Capturas a tomar ANTES de corregir

Para cada issue, abre el enlace de la matriz (rama `main`) y captura:

| N° | Captura |
|---|---|
| 1 | Panel del issue `S2259` con el código resaltado en la línea 38 y el flujo (*"Show N steps"*) que lleva de `company = user.company` al acceso; también la pestaña **"Why is this an issue?"** |
| 2 | Panel del issue `S9383` con la línea 73 (`resolveSession();`) resaltada y la severidad/tipo visibles |
| 3 | Panel del issue `S7637` en `sonarqube.yml:24` y, aparte, el **Quality Gate FAILED** en *Overview* → pestaña **New Code**, con la condición *Security Rating on New Code = C* |
| 4 | Lista de issues filtrada por archivo `JWTService.py` y regla `python:S6903`, con las 2 ocurrencias (líneas 16 y 30) |
| 5 | Lista de issues filtrada por archivo `RechargeWalletModal.tsx`, con las 2 ocurrencias de `S6853` (líneas 95 y 123) |
| — | Vista **Issues** filtrada por `python:S930` → Status *False Positive* (139), como evidencia del triage |
