# deploy/

Producción usa **el mismo `docker-compose.yml` y el mismo `caddy/Caddyfile`** que el
desarrollo, y el mismo `.env` único: solo cambian los valores. `env.prod.example` es su
plantilla de producción (mismas variables que `.env.example`, con `rehnimarket.duckdns.org`,
`DOCS_ENABLED=false` y `RUN_SEED=false`).

| Archivo | Para qué |
|---|---|
| `env.prod.example` | Plantilla del `.env` único en el servidor. Reemplazar cada `CAMBIAR_*` antes de levantar |

```bash
cp deploy/env.prod.example .env && chmod 600 .env   # reemplazar cada CAMBIAR_*
docker compose up -d --build --wait
```

Con `SITE_ADDRESS=<dominio>` y `API_ADDRESS=api.<dominio>`, Caddy pide los certificados a
Let's Encrypt y redirige HTTP → HTTPS. Con `localhost` (desarrollo) usa su CA local.

El `.env` es el único archivo de configuración y lleva todos los secretos: `chmod 600`, nunca
en Git.

| Otro archivo | Para qué |
|---|---|
| `checklist-azure.md` | Lista de verificación del despliegue en la VM de Azure |

Procedimiento vigente (instalación, actualización y rollback): sección 5.2 del plan de
implantación (`docs/plan-implantacion.md`).
