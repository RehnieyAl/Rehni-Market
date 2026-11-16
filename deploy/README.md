# deploy/

Producción usa **el mismo `docker-compose.yml`, el mismo `caddy/Caddyfile` y la misma
plantilla `.env.example`** que el desarrollo. No hay override ni plantilla de producción
aparte: en el servidor se copia la plantilla y se cambia cada variable que tiene debajo una
línea `# producción: …`.

```bash
cp .env.example .env && chmod 600 .env   # aplicar las líneas «producción»
docker compose up -d --build --wait
```

Con `SITE_ADDRESS=<dominio>` y `API_ADDRESS=api.<dominio>`, Caddy pide los certificados a
Let's Encrypt y redirige HTTP → HTTPS. Con `localhost` (desarrollo) usa su CA local.

El `.env` es el único archivo de configuración y lleva todos los secretos: `chmod 600`, nunca
en Git.

| Archivo | Para qué |
|---|---|
| `guia-oracle-cloud-a1.html` | Guía anterior de despliegue en Oracle Cloud (histórica: describe la configuración en varios `.env`) |

Procedimiento vigente (instalación, actualización y rollback): sección 5.2 del plan de
implantación (`docs/plan-implantacion.md`).
