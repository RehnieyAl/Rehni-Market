# Pendientes de los entregables de implantación (semanas 1 a 7)

Autor: Yeinher Jose Algarin Cardozo, aprendiz ADSO, ficha 3171618. Corte: 2026-11-18.

Porcentajes = estimación sobre la rúbrica de Producto de cada semana. Comandos en bash; los de la
VM se corren tras `ssh rehni-prod` y `cd ~/Rehni-Market`, con `F=$(date -u +%F)`. Las evidencias
que se crean en la VM se traen con
`scp "rehni-prod:Rehni-Market/docs/evidencias/*-$(date -u +%F)*" docs/evidencias/`.

## Resumen

| Semana | Pendientes | Hoy | Con «Hoy» + «Esta semana» | Final (lunes 23) |
|---|---:|---:|---:|---:|
| 1 | 4 | 85 % | 95 % | 100 % |
| 2 | 5 | 91 % | 97 % | 100 % |
| 3 | 3 | 93 % | 100 % | 100 % |
| 4 | 11 | 60 % | 98 % | 100 % |
| 5 | 9 | 49 % | 87 % (98 % con C3) | 87 % (98 % con C3) |
| 6 | 23 | 44 % | 60 % | 76 % (88 % con C2) |
| 7 | 18 | 39 % | 53 % (63 % con C1) | 53 % (88 % con C1 y C4) |

| Grupo | Tareas | Horas |
|---|---|---:|
| Hoy (solo) | T1–T9 | 3,5 |
| Esta semana (solo) | S1–S4 | 4,5 |
| Lunes 23 (con otra persona) | L1–L2 | 2 |
| Validar con el instructor | I1 | 0,5 |
| Código (opcional) | C1–C4 | 2 a 9 |

## Hoy (puedo solo) · 3,5 h

- [ ] **T1 · Verificar requisitos en la VM** (15 min)
  - Cierra: S01 §1.7 (salida y «Resultado») y S02 §5 «Cronograma», fila «Verificar requisitos».
  - Falta: la salida del script en la VM.
  - Cómo:
    ```bash
    { echo "# verificar-requisitos.sh · VM de Azure · $(date -u '+%F %T UTC') · $(git describe --tags --always)"
      lsb_release -d; uname -m; nproc; free -m | sed -n 2p; df -h / | tail -1
      time PORTS="80 443" bash scripts/verificar-requisitos.sh; echo "código de salida: $?"
    } 2>&1 | tee "docs/evidencias/verificar-requisitos-azure-$F.txt"
    ```
    Si salen `NO CUMPLE` RAM (3,8 GiB) y disco (29 GB), se anota como excepción, con el swap de 2 GiB como mitigación.
  - Evidencia: `docs/evidencias/verificar-requisitos-azure-<fecha>.txt`.
  - Sube: S01 de 85 a 95 % (CE-2 de 45 a 55/60) y S02 +2.
  - Depende de: nada.

- [ ] **T2 · Prueba de humo contra producción** (15 min)
  - Cierra: S04 §5.2 «Evidencia» y §5.3 «Evidencia»; S05 §6.4 «Salida contra el servidor y contra la nube».
  - Falta: un humo en verde contra la URL (el único intento dio 5 pasan y 2 fallan).
  - Cómo:
    ```bash
    read -rp  "Correo del owner: " SMOKE_EMAIL
    read -rsp "Clave del owner: "  SMOKE_PASSWORD; echo
    export SMOKE_EMAIL SMOKE_PASSWORD BASE_URL=https://apirehnimarket.duckdns.org FRONTEND_URL=https://rehnimarket.duckdns.org
    bash scripts/smoke-test.sh 2>&1 | tee "docs/evidencias/smoke-produccion-$F.txt"
    echo "código de salida: ${PIPESTATUS[0]}" | tee -a "docs/evidencias/smoke-produccion-$F.txt"
    ```
  - Evidencia: `docs/evidencias/smoke-produccion-<fecha>.txt`. Borra el viejo `smoke-produccion-2026-11-16.txt`, que no está en Git.
  - Sube: **quita el tope de 60/100 de S04** (60 a 84 %) y S05 +3.
  - Depende de: que la cuenta del owner esté verificada.

- [ ] **T3 · Rollback cronometrado v1.0.1 → v1.0.0 → v1.0.1** (45 min, casi todo es compilación)
  - Cierra:
    - S04 §5.2 «Evidencia», bloque del rollback;
    - S02 §5 «Cronograma», las filas «checkout + compilación + up» y «Verificación»;
    - S07 §8.3, fila «Rollback» (duración y humo).
  - Falta: haber ejecutado el rollback y medido su tiempo.
  - Cómo, en la misma sesión de T2 (sin migraciones entre las dos versiones; agrega `ALGORITHM=HS256` si falta y hace un respaldo previo):
    ```bash
    R="docs/evidencias/rollback-v1.0.1-v1.0.0-$F.txt"
    { echo "# Rollback cronometrado · inicio $(date -u '+%F %T UTC')"
      echo "## migraciones entre v1.0.0 y v1.0.1 (vacío = ninguna):"
      git diff --stat v1.0.0 v1.0.1 -- RehniMarket-backend/alembic/versions
      echo "## ALGORITHM en .env:"
      grep -q '^ALGORITHM=' .env && echo "ya estaba" || { echo 'ALGORITHM=HS256' >> .env; echo "agregada ALGORITHM=HS256"; }
      echo "## respaldo previo:"; bash scripts/respaldar.sh 2>&1 | tail -2
    } 2>&1 | tee "$R"
    desplegar() {
      local v=$1 t0 t1 rc; t0=$(date +%s)
      git checkout -q "$v" && docker compose build -q backend && docker compose build -q frontend \
        && docker compose up -d --wait >/dev/null 2>&1; rc=$?; t1=$(date +%s)
      printf '%s | %-7s | up=%s | %4ss | salud=%s | alembic=%s | humo: %s\n' \
        "$(date -u '+%F %T UTC')" "$(git describe --tags)" "$rc" "$((t1-t0))" \
        "$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/health/database")" \
        "$(docker compose exec -T backend uv run alembic current 2>/dev/null | tail -1)" \
        "$(bash scripts/smoke-test.sh 2>&1 | tail -1)"
    }
    { echo "## fecha | versión | código de up | duración | /health | alembic | humo"
      desplegar v1.0.0
      desplegar v1.0.1
      echo "## estado final"; docker compose ps --format '{{.Name}}  {{.Status}}'
    } 2>&1 | tee -a "$R"
    unset SMOKE_PASSWORD
    ```
  - Evidencia: `docs/evidencias/rollback-v1.0.1-v1.0.0-<fecha>.txt`.
  - Sube: S04 de 84 a 91 % (rollback de 18 a 25/25), S02 +4. S07 no sube: su CE-5 sigue con tope de 30.
  - Depende de: T2 (usa `SMOKE_PASSWORD`).

- [ ] **T4 · Datos de Azure en el portal** (15 min)
  - Cierra: S04 §5.3 «Región» y «Límites del plan gratuito»; S04 §5.4, la nota «confirmar tamaño y región».
  - Falta: región y tamaño reales de la VM, crédito restante y vigencia de la suscripción.
  - Cómo:
    1. Portal de Azure → **Máquinas virtuales** → tu VM → **Información general**: anota «Ubicación» y «Tamaño».
    2. En el buscador del portal escribe **Education** → **Azure Education Hub** → **Información general**: anota el crédito restante y la fecha de vencimiento.
    3. Si la región no es East US, recalcula §5.4 con <https://prices.azure.com/api/retail/prices> para esa región.
  - Evidencia: `docs/evidencias/azure-vm-y-credito-<fecha>.png`, con la IP tapada.
  - Sube: S04 de 91 a 98 % (nube de 16 a 20/20, costos de 7 a 8/10).
  - Depende de: nada.

- [ ] **T5 · Evidencias de seguridad de la VM** (30 min)
  - Cierra:
    - S06 §7.1, permisos de `backups/`;
    - S06 §7.2, `sshd`, UFW y NSG, y la prueba «Desde otro equipo»;
    - S04 §5.2, permisos de la estructura.
  - Falta: las salidas de la VM y la prueba de puertos desde fuera.
  - Cómo, en la VM:
    ```bash
    chmod 700 ~/Rehni-Market/backups
    U=$(whoami); H=$(hostname)
    { echo "# Seguridad de la VM · $(date -u '+%F %T UTC')"
      echo "## usuario y grupos"; id
      echo "## permisos"; ls -ld ~/Rehni-Market ~/Rehni-Market/backups; ls -l ~/Rehni-Market/.env
      echo "## sudo"; sudo -l
      echo "## sshd"; sudo sshd -T | grep -E 'passwordauthentication|permitrootlogin|pubkeyauthentication'
      echo "## ufw"; sudo ufw status verbose
    } 2>&1 | sed "s/$U/<usuario-admin>/g; s/$H/<servidor>/g" | tee "docs/evidencias/seguridad-vm-$F.txt"
    ```
  - Cómo, desde tu equipo:
    ```bash
    F=$(date -u +%F)
    for p in 5432 5433 6432 8000 9000 9001; do nc -zv -w3 rehnimarket.duckdns.org $p; done 2>&1 \
      | sed -E 's/[0-9]{1,3}(\.[0-9]{1,3}){3}/<ip-servidor>/g' | tee "docs/evidencias/puertos-desde-fuera-$F.txt"
    ```
  - Cómo, en Azure: portal → **Máquinas virtuales** → tu VM → **Redes** → **Configuración de red** → «Reglas de puerto de entrada»: captura, tapando tu IP de origen.
  - Evidencia: `seguridad-vm-<fecha>.txt`, `puertos-desde-fuera-<fecha>.txt` y `nsg-entrada-<fecha>.png`.
  - Sube: S06 +11 (CE-1 usuarios de 8 a 12, SSH y firewall de 8 a 15).
  - Depende de: nada.

- [ ] **T6 · Escáner de secretos sobre el historial** (15 min)
  - Cierra: S06 §7.5, «Revisión del historial del repositorio».
  - Falta: pasar gitleaks por todo el historial.
  - Cómo, en tu equipo, desde la raíz del repositorio:
    ```bash
    docker run --rm -v "$PWD:/repo:ro" ghcr.io/gitleaks/gitleaks:v8.28.0 detect --source /repo --redact \
      2>&1 | tail -20 | tee "docs/evidencias/gitleaks-$(date -u +%F).txt"
    ```
    Si aparece un secreto real: rotarlo según la tabla de §7.5 y anotarlo.
  - Evidencia: `docs/evidencias/gitleaks-<fecha>.txt`.
  - Sube: S06 +2 (secretos de 8 a 10/10).
  - Depende de: nada.

- [ ] **T7 · Configuración de GitHub (sin código)** (30 min)
  - Cierra: S07 §8.1, las filas «Rama `main`», «Ambiente `produccion`» y «Etiquetas».
  - Falta: hacer obligatorio `auditoria`, exigir la rama al día, crear el ambiente y proteger las etiquetas.
  - Cómo:
    1. Repo → **Settings** → **Rules** → **Rulesets** → `CODEOWNER` → «Require status checks to pass» → **Add checks** → `auditoria`; marca «Require branches to be up to date before merging» → **Save changes**.
    2. **Rulesets** → **New ruleset** → **New tag ruleset** → nombre `versiones`, «Enforcement status: Active», «Target tags» → **Add target** → `v*`; marca «Restrict creations», «Restrict updates» y «Restrict deletions»; en «Bypass list» agrega «Repository admin» → **Create**.
    3. **Settings** → **Environments** → **New environment** → `produccion` → «Required reviewers»: tú; «Deployment branches and tags» → «Selected branches and tags» → **Add deployment branch or tag rule** → tipo «Tag», `v*` → **Save protection rules**.
    4. Guarda la evidencia:
       ```bash
       { gh api repos/RehnieyAl/Rehni-Market/rulesets; gh api repos/RehnieyAl/Rehni-Market/environments; } \
         > "docs/evidencias/github-reglas-$(date -u +%F).json"
       ```
  - Evidencia: `docs/evidencias/github-reglas-<fecha>.json`.
  - Sube: S07 +4 (secretos del pipeline de 3 a 7/10).
  - Depende de: nada.

- [ ] **T8 · Registro de un comprador en producción** (15 min)
  - Cierra: S05 §6.4, caso F-07. Además deja una cuenta de prueba que no es el owner, para las siguientes pruebas de humo.
  - Falta: probar el registro y la verificación por correo en producción.
  - Cómo: en <https://rehnimarket.duckdns.org> regístrate con un correo de prueba, verifica el código que llega y, en la VM:
    ```bash
    docker compose exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT r.name, u.verified FROM users u JOIN roles r ON r.id=u.role_id WHERE u.email='"'"'<correo-de-prueba>'"'"';"' \
      | tee "docs/evidencias/registro-comprador-$F.txt"
    ```
    Esperado: `user | t`. Reemplaza el correo por `<correo-de-prueba>` antes de subir el archivo.
  - Evidencia: `docs/evidencias/registro-comprador-<fecha>.txt`.
  - Sube: S05 +2.
  - Depende de: nada.

- [ ] **T9 · Vigencia de DuckDNS** (5 min)
  - Cierra: S03 §4.2, «Fecha de vencimiento».
  - Falta: la fuente del dato.
  - Cómo: la FAQ de <https://www.duckdns.org/faqs.jsp> (consultada el 18/11/2026) no menciona vencimiento. Revisa el panel de tu cuenta y anota lo que diga, con la fecha.
  - Evidencia: el enlace y la fecha en el campo.
  - Sube: S03 de 93 a 97 %.
  - Depende de: nada.

## Esta semana (puedo solo) · 4,5 h

- [ ] **S1 · Migración ejecutada en la VM** (1 h)
  - Cierra: S05 §2.8, los 5 pendientes (registro de la ventana, huellas, humo después del corte y decisión de rollback).
  - Falta: ejecutar el plan de migración en la base de la nube.
  - Cómo. Producción no tiene usuarios reales, así que se puede ejecutar sobre ella y al final quitar las 73 cuentas sintéticas con `rollback.sql`:
    1. Desde tu equipo, copia el CSV, que no está en Git:
       ```bash
       scp legacy-data/clientes_legado.csv rehni-prod:Rehni-Market/legacy-data/
       ```
    2. En la VM:
       ```bash
       E="docs/evidencias/migracion-ejecutada-$F.txt"
       { echo "# Migración ejecutada · inicio $(date -u '+%F %T UTC')"; sha256sum legacy-data/clientes_legado.csv; } | tee "$E"
       script -q -a "$E" -c "bash scripts/migracion/migrar.sh"
       ```
       En el menú, en este orden: 1 (respaldo previo), 2 (abrir ventana), 3, 4, 5 (debe dar `OK=10 FALLA=0`) y 7 (cerrar ventana). Anota la hora de inicio y fin de cada opción.
    3. Humo después del corte y huella final:
       ```bash
       bash scripts/smoke-test.sh 2>&1 | tee -a "$E"
       sha256sum legacy-data/clientes_legado.csv | tee -a "$E"
       ```
    4. Quita las cuentas sintéticas: `bash scripts/migracion/migrar.sh` → opción 6 → escribe `SI`.
  - Evidencia: `docs/evidencias/migracion-ejecutada-<fecha>.txt`.
  - Sube: **quita el tope de 20/45 de S05**; S05 de 52 a 87 % (CE-3 de 8 a 43/45).
  - Depende de: T2 (credenciales del humo) y T8.

- [ ] **S2 · Respaldo programado, cifrado y copia 2** (1,5 h, sin código del repo)
  - Cierra:
    - S06 §3: «Horario», «Cifrado», el log de una ejecución automática y la copia 2 de la regla 3-2-1;
    - S06 §7.5, «Llave `age`»;
    - S03 §4.6, «Respaldos».
  - Falta: el cron, el cifrado y una copia fuera de la VM.
  - Cómo:
    1. En tu equipo: `age-keygen -o rehni-respaldo.key`. Guarda la clave privada en tu gestor de contraseñas y copia la línea `public key: age1…`.
    2. En la VM:
       ```bash
       sudo apt install -y age
       crontab -e
       # agrega esta línea (una sola):
       0 2 * * * cd /home/rehnimarket/Rehni-Market && bash scripts/respaldar.sh >> backups/cron.log 2>&1 && for f in $(ls -1t backups/postgres/*.dump | head -1) $(ls -1t backups/minio/*.tar.gz | head -1); do age -r age1TU_LLAVE_PUBLICA -o "$f.age" "$f"; done
       ```
    3. Al día siguiente: `crontab -l; tail -5 backups/cron.log; ls -l backups/postgres/*.age`.
    4. Copia 2, desde tu equipo:
       ```bash
       scp "rehni-prod:Rehni-Market/backups/postgres/*.age" "rehni-prod:Rehni-Market/backups/minio/*.age" <disco-externo>/
       ```
  - Evidencia: `docs/evidencias/respaldo-cron-<fecha>.txt` (salida del paso 3 y de `ls` del disco externo).
  - Sube: S06 solo +3, porque CE-4 sigue con tope de 20/45 hasta L2. S03 de 97 a 100 %.
  - Depende de: nada. La copia 3 (Backblaze B2) queda como deuda.

- [ ] **S3 · Monitoreo externo con Uptime Kuma** (1,5 h, en tu equipo)
  - Cierra: S07 §8.5, todos los campos salvo «Versión».
  - Falta: monitores, canal de alertas y una alerta real.
  - Cómo:
    1. En tu equipo: `docker run -d --name uptime-kuma -p 3001:3001 -v uptime-kuma:/app/data louislam/uptime-kuma:1` y abre <http://localhost:3001>.
    2. **Add New Monitor**:
       - HTTP `https://apirehnimarket.duckdns.org/health/database`, cada 60 s, 2 reintentos.
       - HTTP(s) – Keyword `https://rehnimarket.duckdns.org/`, cada 60 s, 2 reintentos.
       - Push con «Heartbeat Interval» de 90 000 s (25 h).
    3. **Settings** → **Notifications** → **Setup Notification** → «Email (SMTP)» o «Telegram» → **Test** → asígnala a los tres monitores.
    4. Agrega al final de la línea de cron de S2: `&& curl -fsS "<url-push>"`. La URL es secreta: no va al repo.
    5. Alerta real: en una ventana avisada, `docker compose stop backend` en la VM; espera la alerta; `docker compose start backend`; espera la recuperación.
  - Evidencia: `docs/evidencias/monitoreo-alerta-<fecha>.png` (captura del evento: caída, alerta y recuperación).
  - Sube: S07 de 43 a 53 % (monitoreo de 3 a 13/15).
  - Depende de: S2 (latido del respaldo). La salud y la web no dependen de nada.

- [ ] **S4 · Costos: Render y horas de administración** (30 min)
  - Cierra: S04 §5.4, alternativa 2 y «Horas de administración al mes».
  - Falta: el precio del PostgreSQL de pago y del almacenamiento S3 en la alternativa 2, y tus horas reales.
  - Cómo:
    1. En <https://render.com/pricing>, anota el precio del plan de pago de Postgres. Render no ofrece almacenamiento S3: déjalo dicho en el campo.
    2. Suma las horas que dediques esta semana a parches, respaldos y despliegues.
  - Evidencia: la fuente y la fecha en el campo.
  - Sube: S04 de 98 a 100 %.
  - Depende de: nada.

## Lunes 23 (con otra persona) · 2 h

- [ ] **L1 · Cliente simulado: acuerdos** (30 min)
  - Cierra:
    - S01 §1.4 (concurrencia esperada) y §1.5 (crecimiento de datos);
    - S02 §3.2 (aceptación del RPO/RTO) y §5 «Roles» (contacto del cliente);
    - S06 §3, «RPO / RTO acordados».
  - Falta: datos que solo puede dar el cliente.
  - Cómo:
    1. En la sesión, pide: usuarios simultáneos en hora pico, pedidos y productos nuevos por mes, y aceptación de RPO 24 h y RTO 4 h.
    2. Anótalo en el acta de entrega.
    3. Repite k6 con la concurrencia acordada:
       ```bash
       k6 run -e K6_BASE_URL=http://127.0.0.1:8000 -e SUSTAINED_VUS=<concurrencia> tests/load/04-sustained.js
       ```
  - Quién: tú y el cliente simulado.
  - Evidencia: `docs/aceptacion/acta-de-entrega.md` y `docs/pruebas/evidencias/k6/<fecha>_04-sustained.txt`.
  - Sube: S01 de 95 a 100 % y S02 de 97 a 100 %.
  - Depende de: nada.

- [ ] **L2 · Restauración de desastre por un tercero** (1,5 h)
  - Cierra: S06 §3.4, los 8 campos, y además el plan §9.2 (runbooks) y §10.3 (simulacro).
  - Falta: que otra persona restaure siguiendo solo el procedimiento escrito.
  - Cómo:
    1. El tercero sigue S06 §3.3 en una base aparte o en una VM de prueba, con el respaldo más reciente de producción.
    2. Tú solo cronometras y anotas en `docs/aceptacion/registro-del-simulacro.md`: `TS`, inicio y fin, `sha256sum -c`, conteos por tabla y desviaciones.
  - Quién: compañero o instructor.
  - Evidencia: `docs/evidencias/restauracion-tercero-<fecha>.txt`.
  - Sube: **quita el tope de 20/45 de S06**; S06 de 60 a 76 %.
  - Depende de: S2 (un respaldo reciente).

## Validar con el instructor · 30 min

- [ ] **I1 · Decisiones de diseño**
  - Cierra: S04 §5.3 (Azure IaaS como nube) y la excepción de RAM y disco de S01 §1.7.
  - Cómo: muéstrale S04 §5.3 y S01 §1.7, y anota su respuesta en el campo.
  - Quién: el instructor.
  - Sube: confirma el 100 % de S04. Si no acepta Azure IaaS, hay que hacer un despliegue en un PaaS.

## Código (opcional, otro PR)

- [ ] **C1 · `scripts/desplegar.sh`** (2 h) — **vale la pena antes del 27**
  - Cierra: S07 §8.4, «En el servidor».
  - Qué hace: respaldo, `git checkout <versión>`, compilación, `up --wait`, salud, humo y rollback automático; escribe `despliegues.log`.
  - Evidencia: `despliegues.log` de un despliegue exitoso y de uno detenido a propósito (etiqueta inexistente).
  - Sube: S07 +10.

- [ ] **C3 · Validar variables obligatorias y `logging:`** (1 h) — **vale la pena antes del simulacro**
  - Cierra: S05 §6.1 (2 celdas «Si falta…») y §6.2 (rotación de logs).
  - Qué hace: `RuntimeError` en `app/Config.py` si falta `URL_DATABASE`, `SECRET_KEY` o `MINIO_*`; y `logging: json-file 10m × 3` en cada servicio del compose.
  - Sube: S05 +11.

- [ ] **C2 · Rol de BD sin DDL (#44)** (3 h) — **mejor como deuda**
  - Cierra: S06 §7.3, §7.4 (`DROP TABLE`) y §3 (rol de solo lectura para `pg_dump`).
  - Por qué esperar: cambia la base de producción y las cadenas de conexión antes del simulacro.
  - Sube: S06 +12.

- [ ] **C4 · `release.yml` con GHCR, secretos de despliegue y `GET /health/version`** (4 h) — **mejor como deuda**
  - Cierra: S07 §8.1, §8.2, §8.3 (run de liberación) y §8.5 («Versión»).
  - Por qué esperar: obliga a cambiar el compose a imágenes publicadas.
  - Sube: quita el tope de 30/60 de S07; S07 +25.

## Semanas 8 y 9 (plan, §9 y §10)

Los 22 pendientes del plan se cierran el lunes 23 con:
- el simulacro (L2);
- las pruebas de aceptación con el cliente simulado (casos, defectos y decisión);
- la sesión de capacitación (fecha y participantes);
- la ventana de mantenimiento acordada (L1);
- y además, en la VM, `sudo apt install unattended-upgrades` y el correo de soporte.
