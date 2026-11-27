# Dependabot y actualizaciones de seguridad

## Configuración (`.github/dependabot.yml`)

| Ecosistema | Directorio | Destino | Agrupación | Etiquetas |
|---|---|---|---|---|
| `uv` (Python, `uv.lock`) | `/RehniMarket-backend` | `develop` | menores y parches en un PR; mayores uno por PR | `dependencies`, `backend` |
| `npm` (pnpm) | `/RehniMarket-frontend` | `develop` | igual | `dependencies`, `frontend` |
| `npm` (pnpm) | `/RehniMarket-mobile` | `develop` | igual | `dependencies`, `mobile` |
| `github-actions` | `/` | `develop` | todas en un PR | `dependencies`, `ci` |
| `docker` (Dockerfile) | `/RehniMarket-backend`, `/RehniMarket-frontend` | `develop` | menores y parches | `dependencies`, `ci` |

Semanal, lunes 07:00 (America/Bogota), máximo 5 PR abiertos por ecosistema (3 para Docker). El backend usa
`package-ecosystem: uv` porque el proyecto se gestiona con uv y `uv.lock` (Dependabot lo soporta de forma nativa;
`pip` no actualizaría ese lockfile). Las imágenes del `docker-compose.yml` (PostgreSQL, MinIO, PgBouncer) quedan
fuera a propósito: cambiarlas toca datos persistentes y se hace a mano, con respaldo verificado.

No hay auto-merge: el del repositorio está desactivado y Dependabot nunca fusiona. Un PR de Dependabot se fusiona en
`develop` solo con todos los checks obligatorios en verde (ruleset) y por decisión del propietario.

## Las actualizaciones de seguridad van a `main`

GitHub crea los PR de **seguridad** (los que nacen de una alerta) contra la rama predeterminada, `main`, y
**ignora `target-branch`** para ellos. Por eso no todas las actualizaciones llegan a `develop`.

Protección: el check obligatorio `rama-origen` falla en cualquier PR hacia `main` que no venga de `develop` o de
`hotfix/*`. Un PR de seguridad de Dependabot contra `main` **no se puede fusionar** directamente.

### Procedimiento normal (vulnerabilidad no crítica)

1. Abrir el PR de seguridad de Dependabot y leer el aviso (GHSA, versiones afectadas, cambios incompatibles).
2. **Cambiar la rama base del PR a `develop`** (botón *Edit* junto al título → base `develop`). Dependabot
   mantiene el PR y lo rebasa sobre `develop`.
3. Esperar el CI completo en el PR (ya contra `develop`) y fusionarlo si está en verde.
4. Abrir el PR `develop → main` (o incluirlo en el siguiente) → CI completo → merge.
5. El workflow «Deploy producción» respalda lo desplegado, publica el commit de `main` y verifica la salud. La
   corrección no queda en `main` sin desplegarse: el despliegue sale del mismo merge.

Si GitHub no permite cambiar la base (por ejemplo, conflicto), cerrar el PR y aplicar la misma versión en una rama
desde `develop` (`fix/seguridad-<paquete>`), con PR a `develop`.

### Procedimiento excepcional (vulnerabilidad crítica explotable)

Cuando no se puede esperar a que `develop` llegue a `main` (por ejemplo, porque `develop` tiene trabajo sin terminar):

1. Crear `hotfix/<cve-o-paquete>` **desde `main`** y aplicar solo la actualización de seguridad (la del PR de
   Dependabot, por cherry-pick).
2. PR `hotfix/... → main`: el CI completo es obligatorio igual que siempre (`rama-origen` admite `hotfix/*`).
3. Merge con autorización explícita del propietario → «Deploy producción» (también admite `hotfix/*`, con la
   aprobación del environment `produccion`, respaldo verificado y health checks).
4. **Inmediatamente después**, PR `main → develop` (o cherry-pick del mismo cambio a `develop`) para que la
   corrección no se pierda en la siguiente publicación.
5. Registrar en el PR el aviso de seguridad, el commit desplegado y el respaldo previo (aparece en el resumen del
   run de despliegue).

Nunca: fusionar sin CI, desactivar un check, añadir una excepción a `.github/auditoria-excepciones.txt` para ver el
CI en verde, ni habilitar auto-merge.
