# deploy/

Producción usa **el mismo `docker-compose.yml` y el mismo `caddy/Caddyfile`** que el
desarrollo. No hay override de producción: lo único que cambia entre entornos es el `.env`
de la raíz.

| Archivo | Para qué |
|---|---|
| `env.prod.example` | Plantilla del `.env` de la raíz en el servidor (dominios, puertos 80/443, API solo en 127.0.0.1, CORS) |

```bash
cp deploy/env.prod.example .env && chmod 600 .env   # reemplazar <dominio>
docker compose up -d --build
```

Con `SITE_ADDRESS=<dominio>` y `API_ADDRESS=api.<dominio>`, Caddy pide los certificados a
Let's Encrypt y redirige HTTP → HTTPS. Con `localhost` (desarrollo) usa su CA local.

Los secretos van en `.env.postgres`, `.env.minio` y `RehniMarket-backend/.env`
(plantilla `RehniMarket-backend/.env.public.example`), nunca en Git.

Procedimiento completo (instalación, actualización y rollback): sección 5.2 del plan de
implantación (`docs/plan de implantacion - Rehnimarket/5) …`).
