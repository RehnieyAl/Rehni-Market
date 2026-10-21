#!/usr/bin/env bash
# Menú para ejecutar la migración de clientes (plan de implantación, sección 2).
#
# Uso (desde cualquier carpeta):
#   bash scripts/migracion/migrar.sh
#
# Variables opcionales: PG_CONTAINER (por defecto rehni-postgres) y CSV
# (por defecto legacy-data/clientes_legado.csv).
# El estado entre opciones (TS del respaldo, SHA del CSV y resultado de la
# validación) se guarda en backups/migracion_estado.env, fuera de Git.

set -u

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO" || exit 1

PG="${PG_CONTAINER:-rehni-postgres}"
CSV="${CSV:-legacy-data/clientes_legado.csv}"
ESTADO="${MIGRACION_ESTADO:-backups/migracion_estado.env}"

TS=""; SHA=""; VALIDACION=""
mkdir -p backups
[ -f "$ESTADO" ] && . "$ESTADO"

guardar_estado() {
  printf 'TS=%s\nSHA=%s\nVALIDACION=%s\n' "$TS" "$SHA" "$VALIDACION" > "$ESTADO"
}

# psql dentro del contenedor con sus propias variables de entorno (sin credenciales aquí).
psql_pg() {
  docker exec "$PG" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 "$@"' psql "$@"
}

id_aplicada() {
  psql_pg -Atc "SELECT id_ejecucion FROM migracion.ejecuciones WHERE estado = 'APLICADA'" 2>/dev/null
}

confirmar() { # $1 mensaje
  local r
  read -r -p "$1 Escriba SI para continuar: " r
  [ "$r" = "SI" ]
}

requiere_pg() {
  docker exec "$PG" pg_isready >/dev/null 2>&1 || { echo "ERROR: el contenedor $PG no está en marcha."; return 1; }
}

opcion_respaldo() {
  bash scripts/backup_rehnimarket.sh || { echo "ERROR: el respaldo falló. No continúe."; return 1; }
  TS=$(ls -1t backups/postgres/rehni_market_postgres_*.dump | head -1 | sed -E 's/.*postgres_(.*)\.dump$/\1/')
  (cd backups/postgres && sha256sum -c "rehni_market_postgres_${TS}.dump.sha256") || { echo "ERROR: SHA-256 del respaldo"; return 1; }
  VALIDACION=""; guardar_estado
  echo "Respaldo previo: TS=$TS"
}

opcion_ventana() {
  [ -n "$TS" ] || { echo "ERROR: primero ejecute la opción 1 (respaldo previo)."; return 1; }
  [ -f "$CSV" ] || { echo "ERROR: no existe $CSV"; return 1; }
  docker compose stop frontend backend
  SHA=$(sha256sum "$CSV" | cut -d' ' -f1)
  docker exec "$PG" mkdir -p /tmp/migracion &&
  docker cp "$CSV" "$PG":/tmp/migracion/clientes_legado.csv &&
  docker cp scripts/migracion/. "$PG":/tmp/migracion/ || { echo "ERROR: copia al contenedor"; return 1; }
  guardar_estado
  echo "Aplicación detenida. SHA del CSV: $SHA"
}

opcion_carga() {
  requiere_pg || return 1
  psql_pg -f /tmp/migracion/carga-staging.sql
}

opcion_transformar() {
  requiere_pg || return 1
  [ -n "$SHA" ] || { echo "ERROR: primero ejecute la opción 2 (ventana y copia)."; return 1; }
  psql_pg -v archivo_sha256="$SHA" -f /tmp/migracion/transformar.sql || return 1
  VALIDACION=""; guardar_estado
  echo "id_ejecucion aplicada: $(id_aplicada)"
}

opcion_validar() {
  requiere_pg || return 1
  local id salida rc oks fallas csv_ok
  id=$(id_aplicada)
  [ -n "$id" ] || { echo "ERROR: no hay ninguna ejecución APLICADA."; return 1; }
  salida="backups/validar_migracion_${TS:-sin_ts}.txt"
  psql_pg -v id_ejecucion="$id" -f /tmp/migracion/validar.sql > "$salida" 2>&1
  rc=$?
  cat "$salida"
  oks=$(grep -cE '\|\s*OK\s*\|' "$salida")
  fallas=$(grep -cE '\|\s*FALLA\s*\|' "$salida")
  csv_ok=FALLA
  [ -n "$SHA" ] && [ "$(sha256sum "$CSV" | cut -d' ' -f1)" = "$SHA" ] && csv_ok=OK
  echo
  echo "psql exit=$rc  OK=$oks  FALLA=$fallas  CSV sin cambios: $csv_ok  (salida en $salida)"
  if [ "$rc" -eq 0 ] && [ "$oks" -eq 10 ] && [ "$fallas" -eq 0 ] && [ "$csv_ok" = OK ]; then
    VALIDACION=OK; echo "VALIDACIÓN CORRECTA: puede cerrar la ventana (opción 7)."
  else
    VALIDACION=FALLA; echo "VALIDACIÓN FALLIDA: ejecute el rollback (opción 6)."
  fi
  guardar_estado
}

opcion_rollback() {
  requiere_pg || return 1
  local id
  id=$(id_aplicada)
  [ -n "$id" ] || { echo "ERROR: no hay ninguna ejecución APLICADA."; return 1; }
  confirmar "Se borrarán de users los usuarios de la ejecución $id." || { echo "Cancelado."; return 1; }
  if psql_pg -v id_ejecucion="$id" -f /tmp/migracion/rollback.sql; then
    VALIDACION=""; guardar_estado
    echo "Rollback aplicado. La aplicación sigue cerrada."
  else
    echo "ERROR: el rollback abortó sin borrar nada. Use la opción 8 (restaurar respaldo $TS)."
    return 1
  fi
}

opcion_cerrar() {
  requiere_pg || return 1
  [ "$VALIDACION" = OK ] || { echo "ERROR: la última validación no es correcta (opción 5)."; return 1; }
  local id reporte
  id=$(id_aplicada)
  reporte="backups/rechazos_migracion_${TS:-sin_ts}.csv"
  psql_pg -c "\\copy (SELECT fila, codigo, motivo_principal, array_to_string(motivos, ',') AS motivos
             FROM migracion.rechazos WHERE id_ejecucion = $id ORDER BY fila)
             TO STDOUT WITH (FORMAT csv, HEADER)" > "$reporte" || return 1
  echo "Reporte de rechazos: $reporte ($(($(wc -l < "$reporte") - 1)) rechazos)"
  docker compose start backend frontend
  docker exec "$PG" rm -rf /tmp/migracion
  echo "Aplicación reabierta y copia del CSV eliminada del contenedor."
}

opcion_restaurar() {
  [ -n "$TS" ] || { echo "ERROR: no hay respaldo previo registrado (opción 1)."; return 1; }
  confirmar "Se restaurará el respaldo $TS y se perderán los cambios posteriores." || { echo "Cancelado."; return 1; }
  bash scripts/restore_rehnimarket.sh "$TS" --verify-only || { echo "ERROR: la verificación del respaldo falló."; return 1; }
  bash scripts/restore_rehnimarket.sh "$TS"
}

opcion_estado() {
  echo "Respaldo previo (TS): ${TS:-—}"
  echo "SHA del CSV:          ${SHA:-—}"
  echo "Última validación:    ${VALIDACION:-—}"
  requiere_pg || return 0
  psql_pg -Atc "SELECT 'users: ' || count(*) FROM users"
  psql_pg -c "SELECT id_ejecucion, estado, filas_origen, users_antes, inicio, fin, fin_rollback
              FROM migracion.ejecuciones ORDER BY id_ejecucion" 2>/dev/null \
    || echo "Esquema migracion: no existe todavía."
}

while :; do
  cat <<'MENU'

===== Migración de clientes — RehniMarket =====
 1) Respaldo previo (backup_rehnimarket.sh)
 2) Abrir ventana: detener la aplicación y copiar CSV y scripts
 3) carga-staging.sql
 4) transformar.sql
 5) validar.sql
 6) rollback.sql (solo si la validación falló)
 7) Cerrar ventana: reporte de rechazos y reabrir la aplicación
 8) Restaurar el respaldo previo (contingencia)
 9) Ver estado
 0) Salir
MENU
  read -r -p "Opción: " op || break
  case "$op" in
    1) opcion_respaldo ;;
    2) opcion_ventana ;;
    3) opcion_carga ;;
    4) opcion_transformar ;;
    5) opcion_validar ;;
    6) opcion_rollback ;;
    7) opcion_cerrar ;;
    8) opcion_restaurar ;;
    9) opcion_estado ;;
    0) break ;;
    *) echo "Opción no válida." ;;
  esac
done
