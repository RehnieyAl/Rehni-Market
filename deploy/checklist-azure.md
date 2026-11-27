# Checklist de despliegue en Azure con DuckDNS — RehniMarket

Resumen operativo de [`docs/implantacion/entregable-s04-procedimiento-despliegue.md`](../docs/implantacion/entregable-s04-procedimiento-despliegue.md) §5.2 («Instalación inicial») y del manual técnico
§6.8, con DuckDNS como DNS. Producción **sin datos de demo** (`RUN_SEED=false`): el backend no siembra nada al arrancar; los datos base y el
owner se crean a mano con el menú `scripts/database/inicializar.sh`
([`docs/base-datos/inicializacion.md`](../docs/base-datos/inicializacion.md)).

Nombres de producción: `rehnimarket.duckdns.org` (frontend) y `apirehnimarket.duckdns.org` (API).
`<correo-owner>` es el correo del responsable. No dejar ningún `[PENDIENTE]` sin llenar en el acta.

## 0. Antes de empezar

- [ ] PR de `refactor/env-unico` integrado a `main` y los checks de `main` en verde.
- [ ] Versión a desplegar: la última etiqueta publicada (`git ls-remote --tags origin`; hoy
      `v1.0.1`, release del 17/11/2026).
- [ ] Datos de la VM anotados: `[PENDIENTE: IP pública]`, `[PENDIENTE: usuario administrador]`.

## 1. VM y red en Azure (manual técnico §6.8, pasos 1-4)

- [ ] Clave SSH: `ssh-keygen -t ed25519 -C "rehnimarket-azure" -f ~/.ssh/rehni_azure`.
- [ ] VM Ubuntu Server 24.04 LTS x64, `Standard_B2s` o superior, autenticación solo con clave,
      disco SSD estándar 64 GiB, **IP pública SKU estándar (estática)**: DuckDNS apunta a una IP fija.
- [ ] `~/.ssh/config` con `Host rehni-prod`; `ssh rehni-prod` entra y
      `sudo sshd -T | grep -E 'passwordauthentication|permitrootlogin'` muestra `no`.
- [ ] NSG: TCP 80 y 443 y UDP 443 desde cualquier origen; 22 solo desde la IP del administrador.
      **No** abrir 5433, 8000, 6432, 9000 ni 9001.

## 2. DuckDNS (dos registros)

- [ ] En <https://www.duckdns.org>, poner la IP pública de la VM en los dos dominios: `rehnimarket`
      (web) y `apirehnimarket` (API).
- [ ] Desde el equipo: `dig +short rehnimarket.duckdns.org` y `dig +short apirehnimarket.duckdns.org` devuelven la IP de la VM.
- [ ] **No levantar Caddy hasta que los dos resuelvan**: Let's Encrypt limita los intentos fallidos.
- [ ] El token de DuckDNS no va al repositorio. Con IP estática no hace falta el cron de actualización;
      si la IP cambiara, actualizar en la web de DuckDNS.

## 3. Docker y repositorio (§5.2, pasos 1-4)

- [ ] `sudo apt update && sudo apt upgrade -y` y `sudo timedatectl set-timezone America/Bogota`.
- [ ] Docker Engine + Compose desde el repositorio oficial; `sudo usermod -aG docker $USER` y volver a entrar.
- [ ] `docker run hello-world` sin `sudo` y `docker compose version` ≥ 2.24.
- [ ] Clonar:
      ```bash
      sudo install -d -o rehnimarket -g rehnimarket -m 750 /opt/rehnimarket
      git clone https://github.com/RehnieyAl/Rehni-Market.git /opt/rehnimarket && cd /opt/rehnimarket
      git checkout v1.0.1
      PORTS="80 443" bash scripts/verificar-requisitos.sh   # todo CUMPLE, código 0
      ```

## 4. Configuración de producción (§5.2, paso 5): un solo paso

Toda la configuración es **un solo `.env`** en la raíz. Su plantilla de producción,
`deploy/env.prod.example`, ya trae `SITE_ADDRESS=rehnimarket.duckdns.org`,
`API_ADDRESS=apirehnimarket.duckdns.org`, las URL y CORS de producción, `DOCS_ENABLED=false`,
`RATE_LIMIT_ENABLED=true`, `RUN_SEED=false`, las cuentas del seed vacías y CPU para 2 vCPU.

- [ ] Una de las dos:
      - **Desde la plantilla:** `cp deploy/env.prod.example .env && chmod 600 .env` y reemplazar
        cada `CAMBIAR_*`. Contraseñas y `SECRET_KEY` con `openssl rand -base64 24 | tr '+/' '-_'`;
        la de PostgreSQL va **igual** en `POSTGRES_PASSWORD`, `URL_DATABASE` y `URL_DATABASE_POOLED`.
        `GMAIL_APP_PASSWORD` la emite Google (Azure bloquea el puerto 25: 587, 465 o 2525).
      - **Ya preparado:** `scp .env.produccion rehni-prod:/opt/rehnimarket/.env` desde el equipo del
        administrador y, en la VM, `chmod 600 /opt/rehnimarket/.env`.
- [ ] `grep -nE '^[A-Z_]+=.*CAMBIAR' .env` no muestra nada.
- [ ] `git status` no muestra el `.env`.

## 5. Levantar y verificar (§5.2, pasos 6-8)

- [ ] `docker compose up -d --build --wait` (el backend aplica `alembic upgrade head`).
- [ ] `docker compose ps`: cinco servicios `healthy`; solo `rehni-frontend` en `0.0.0.0`.
- [ ] `curl -fsS https://apirehnimarket.duckdns.org/health/database` → `{"Base de datos":"OK"}`.
- [ ] `curl -fsS -o /dev/null -w "%{http_code}\n" https://rehnimarket.duckdns.org/` → `200`.
- [ ] `curl -I http://rehnimarket.duckdns.org` → `308` a HTTPS.
- [ ] Certificado de Let's Encrypt en los dos nombres (`docker compose logs frontend | grep -i "certificate obtained"`).
- [ ] Segmentación de redes, **antes de abrir a usuarios** (reinicia el backend una vez):
      `bash scripts/verificar-redes.sh | tee docs/evidencias/verificacion-redes-azure-<fecha>.txt` → `0 fallan`.
- [ ] Desde otro equipo: `nc -zv <IP pública> 5433` y `nc -zv <IP pública> 9001` **fallan**.

## 6. Datos base y owner, sin datos de demo (§5.2, paso 8.1)

- [ ] Datos base: menú `bash scripts/database/inicializar.sh`, opción 1, y luego `bash scripts/datos-base.sh`; comprobar con `docker compose exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT (SELECT count(*) FROM roles), (SELECT count(*) FROM catalog), (SELECT count(*) FROM shipping_carriers);"'` → `4|120|4`.
- [ ] Crear el owner: `ssh -t rehni-prod bash /opt/rehnimarket/scripts/database/inicializar.sh`, opción 2 → `Owner creado, activo y verificado.`; opción 3 para comprobar.
- [ ] Comprobar con la consulta de `OWNER.md` §4 (una fila, `is_owner = t`) e iniciar sesión en la web: **Panel Propietario**.

## 7. Prueba de humo y respaldo (§5.2, pasos 9-10)

- [ ] Registrar y verificar una cuenta de comprador de prueba (no la del owner).
- [ ] Prueba de humo:
      ```bash
      read -rs SMOKE_PASSWORD; export SMOKE_PASSWORD
      SMOKE_EMAIL=<correo-de-prueba> BASE_URL=https://apirehnimarket.duckdns.org FRONTEND_URL=https://rehnimarket.duckdns.org \
        bash scripts/smoke-test.sh   # RESULTADO: 7 pasan, 0 fallan
      ```
- [ ] Primer respaldo: `sudo rehnimarket backup` → `BACKUP_ID=<ID>`; comprobar con `sudo rehnimarket backup verify <ID>`.

## 8. Evidencia para el plan y el acta

- [ ] `docker compose ps`, salida de `verificar-redes.sh` y de `smoke-test.sh` guardadas en `docs/evidencias/`.
- [ ] Llenar en `docs/implantacion/`: entregable S04 §5.2 «Evidencia», S06 §7.2 (`ufw`/NSG y `nc`
      desde fuera) y S02 §5 «Cronograma de la ventana».
- [ ] Si falla algo: tabla «Si falla…» del manual técnico §6.8 (certificado, CPU, backend, registro, CORS, correo).
