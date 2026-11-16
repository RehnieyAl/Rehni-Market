# Checklist de despliegue en Azure con DuckDNS — RehniMarket

Resumen operativo de `docs/plan-implantacion.md` §5.2 («Instalación inicial») y del manual técnico
§6.8, con DuckDNS como DNS. Producción **sin seeds**: los datos base salen de `scripts/datos-base.sh`
y el owner se crea con registro + `UPDATE` del rol en psql.

Nombres de producción: `rehnimarket.duckdns.org` (frontend) y `api.rehnimarket.duckdns.org` (API).
`<correo-owner>` es el correo del responsable. No dejar ningún `[PENDIENTE]` sin llenar en el acta.

## 0. Antes de empezar

- [ ] PR de `refactor/env-unico` integrado a `main` y los checks de `main` en verde.
- [ ] Versión a desplegar: la etiqueta `v1.0.0` **no existe** todavía (`git ls-remote --tags origin`
      solo muestra `sonar-antes`). Usar el commit de `main` y anotarlo:
      `[PENDIENTE: SHA de main desplegado]`.
- [ ] Datos de la VM anotados: `[PENDIENTE: IP pública]`, `[PENDIENTE: usuario administrador]`.

## 1. VM y red en Azure (manual técnico §6.8, pasos 1-4)

- [ ] Clave SSH: `ssh-keygen -t ed25519 -C "rehnimarket-azure" -f ~/.ssh/rehni_azure`.
- [ ] VM Ubuntu Server 24.04 LTS x64, `Standard_B2s` o superior, autenticación solo con clave,
      disco SSD estándar 64 GiB, **IP pública SKU estándar (estática)**: DuckDNS apunta a una IP fija.
- [ ] `~/.ssh/config` con `Host rehni-azure`; `ssh rehni-azure` entra y
      `sudo sshd -T | grep -E 'passwordauthentication|permitrootlogin'` muestra `no`.
- [ ] NSG: TCP 80 y 443 y UDP 443 desde cualquier origen; 22 solo desde la IP del administrador.
      **No** abrir 5433, 8000, 6432, 9000 ni 9001.

## 2. DuckDNS (dos nombres, un dominio)

- [ ] En <https://www.duckdns.org>, poner en el dominio `rehnimarket` la IP pública de la VM. DuckDNS
      resuelve también los nombres bajo él, así que `api.rehnimarket.duckdns.org` apunta a la misma IP
      sin crear otro dominio.
- [ ] Desde el equipo: `dig +short rehnimarket.duckdns.org` y `dig +short api.rehnimarket.duckdns.org` devuelven la IP de la VM.
- [ ] **No levantar Caddy hasta que los dos resuelvan**: Let's Encrypt limita los intentos fallidos.
- [ ] El token de DuckDNS no va al repositorio. Con IP estática no hace falta el cron de actualización;
      si la IP cambiara, actualizar en la web de DuckDNS.

## 3. Docker y repositorio (§5.2, pasos 1-4)

- [ ] `sudo apt update && sudo apt upgrade -y` y `sudo timedatectl set-timezone America/Bogota`.
- [ ] Docker Engine + Compose desde el repositorio oficial; `sudo usermod -aG docker $USER` y volver a entrar.
- [ ] `docker run hello-world` sin `sudo` y `docker compose version` ≥ 2.24.
- [ ] Clonar:
      ```bash
      sudo mkdir -p /opt/rehnimarket && sudo chown "$USER" /opt/rehnimarket
      git clone https://github.com/RehnieyAl/Rehni-Market.git /opt/rehnimarket && cd /opt/rehnimarket
      git checkout <SHA-de-main>
      PORTS="80 443" bash scripts/verificar-requisitos.sh   # todo CUMPLE, código 0
      ```

## 4. Configuración de producción (§5.2, paso 5): un solo paso

Toda la configuración es **un solo `.env`** en la raíz. Su plantilla de producción,
`deploy/env.prod.example`, ya trae `SITE_ADDRESS=rehnimarket.duckdns.org`,
`API_ADDRESS=api.rehnimarket.duckdns.org`, las URL y CORS de producción, `DOCS_ENABLED=false`,
`RATE_LIMIT_ENABLED=true`, `RUN_SEED=false`, las cuentas del seed vacías y CPU para 2 vCPU.

- [ ] Una de las dos:
      - **Desde la plantilla:** `cp deploy/env.prod.example .env && chmod 600 .env` y reemplazar
        cada `CAMBIAR_*`. Contraseñas y `SECRET_KEY` con `openssl rand -base64 24 | tr '+/' '-_'`;
        la de PostgreSQL va **igual** en `POSTGRES_PASSWORD`, `URL_DATABASE` y `URL_DATABASE_POOLED`.
        `GMAIL_APP_PASSWORD` la emite Google (Azure bloquea el puerto 25: 587, 465 o 2525).
      - **Ya preparado:** `scp .env rehni-azure:/opt/rehnimarket/.env` desde el equipo del
        administrador y, en la VM, `chmod 600 /opt/rehnimarket/.env`.
- [ ] `grep -n CAMBIAR .env` no muestra nada.
- [ ] `git status` no muestra el `.env`.

## 5. Levantar y verificar (§5.2, pasos 6-8)

- [ ] `docker compose up -d --build --wait` (el backend aplica `alembic upgrade head`).
- [ ] `docker compose ps`: cinco servicios `healthy`; solo `rehni-frontend` en `0.0.0.0`.
- [ ] `curl -fsS https://api.rehnimarket.duckdns.org/health/database` → `{"Base de datos":"OK"}`.
- [ ] `curl -fsS -o /dev/null -w "%{http_code}\n" https://rehnimarket.duckdns.org/` → `200`.
- [ ] `curl -I http://rehnimarket.duckdns.org` → `308` a HTTPS.
- [ ] Certificado de Let's Encrypt en los dos nombres (`docker compose logs frontend | grep -i "certificate obtained"`).
- [ ] Segmentación de redes, **antes de abrir a usuarios** (reinicia el backend una vez):
      `bash scripts/verificar-redes.sh | tee docs/evidencias/verificacion-redes-azure-<fecha>.txt` → `0 fallan`.
- [ ] Desde otro equipo: `nc -zv <IP pública> 5433` y `nc -zv <IP pública> 9001` **fallan**.

## 6. Datos base y owner, sin seeds (§5.2, paso 8.1)

- [ ] `bash scripts/datos-base.sh` → `roles: 4`, `catalog: 120`, `shipping_carriers: 4`
      (sin esto no hay roles y el registro falla).
- [ ] El responsable se registra en `https://rehnimarket.duckdns.org` con `<correo-owner>` y verifica el código del correo.
- [ ] Asignar el rol owner:
      ```bash
      docker compose exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
      ```
      ```sql
      UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'owner') WHERE email = '<correo-owner>';
      -- debe responder: UPDATE 1
      ```
- [ ] Cerrar sesión, volver a entrar: el panel de owner aparece (el rol se lee de la base en cada petición).

## 7. Prueba de humo y respaldo (§5.2, pasos 9-10)

- [ ] Registrar y verificar una cuenta de comprador de prueba (no la del owner).
- [ ] Prueba de humo:
      ```bash
      read -rs SMOKE_PASSWORD; export SMOKE_PASSWORD
      SMOKE_EMAIL=<correo-de-prueba> BASE_URL=https://api.rehnimarket.duckdns.org FRONTEND_URL=https://rehnimarket.duckdns.org \
        bash scripts/smoke-test.sh   # RESULTADO: 7 pasan, 0 fallan
      ```
- [ ] Primer respaldo: `bash scripts/respaldar.sh` → `=== FIN backup <TS> — OK ===`.

## 8. Evidencia para el plan y el acta

- [ ] `docker compose ps`, salida de `verificar-redes.sh` y de `smoke-test.sh` guardadas en `docs/evidencias/`.
- [ ] Llenar en el plan: §5.2 «Evidencia en el servidor», §7.2 (`ufw`/NSG y `nc` desde fuera) y
      tiempos reales de la ventana (`[PENDIENTE: medir en el servidor]`).
- [ ] Si falla algo: tabla «Si falla…» del manual técnico §6.8 (certificado, CPU, backend, registro, CORS, correo).
