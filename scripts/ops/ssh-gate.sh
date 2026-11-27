#!/usr/bin/env bash
# Comando forzado de las llaves SSH de automatización (authorized_keys: command="ssh-gate.sh <rol>"). Cada llave
# solo puede pedir las órdenes de su rol, con argumentos validados, y nunca obtiene un shell. Se instala como
# root en /usr/local/lib/rehnimarket junto a los scripts que lanza (ver docs/devops/servidor-ssh.md).
#   rol deploy          deploy <sha40> <backup_id> <run_id>
#   rol backup          backup <run_id> | verify-backup <backup_id>
#   rol restore         list | restore-verify <backup_id> | restore <backup_id> <confirmacion> <run_id>
set -Eeuo pipefail

ROLE="${1:-}"
LIB_DIR="${LIB_DIR:-/usr/local/lib/rehnimarket}"
OPS_USER="${OPS_USER:-rehniops}"
LOG_DIR="${LOG_DIR:-/var/log/rehnimarket}"
# Servidor: los scripts corren como OPS_USER (dueño de /opt/rehnimarket, en el grupo docker) mediante una regla
# sudoers que solo permite estos archivos. En QA: RUNNER vacío ejecuta directamente.
RUNNER="${RUNNER-sudo -n -u ${OPS_USER} --}"

read -r -a ARGS <<< "${SSH_ORIGINAL_COMMAND:-}"
ACTION="${ARGS[0]:-}"

deny() {
  logger -t rehnimarket-ssh-gate "denegado rol=${ROLE} orden=${ACTION}: $1" 2>/dev/null || true
  echo "denegado: $1" >&2
  exit 126
}

valid_sha()    { [[ "${1:-}" =~ ^[0-9a-f]{40}$ ]]; }
valid_backup() { [[ "${1:-}" =~ ^[0-9]{8}T[0-9]{6}Z_[0-9a-f]{12}$ ]]; }
valid_run()    { [[ "${1:-}" =~ ^[0-9]{1,20}$ ]]; }

logger -t rehnimarket-ssh-gate "rol=${ROLE} orden=${ACTION} args=${#ARGS[@]}" 2>/dev/null || true

case "${ROLE}:${ACTION}" in
  deploy:deploy)
    [ "${#ARGS[@]}" -eq 4 ] && valid_sha "${ARGS[1]}" && valid_backup "${ARGS[2]}" && valid_run "${ARGS[3]}" \
      || deny "deploy <sha40> <backup_id> <run_id>"
    exec ${RUNNER} "${LIB_DIR}/deploy_rehnimarket.sh" "${ARGS[1]}" "${ARGS[2]}" "${ARGS[3]}"
    ;;
  backup:backup)
    [ "${#ARGS[@]}" -eq 2 ] && valid_run "${ARGS[1]}" || deny "backup <run_id>"
    exec ${RUNNER} env GITHUB_RUN_ID="${ARGS[1]}" "${LIB_DIR}/backup_rehnimarket.sh"
    ;;
  backup:verify-backup)
    [ "${#ARGS[@]}" -eq 2 ] && valid_backup "${ARGS[1]}" || deny "verify-backup <backup_id>"
    exec ${RUNNER} "${LIB_DIR}/restore_rehnimarket.sh" "${ARGS[1]}" --dry-run
    ;;
  restore:list)
    [ "${#ARGS[@]}" -eq 1 ] || deny "list"
    exec ${RUNNER} "${LIB_DIR}/restore_rehnimarket.sh" --list
    ;;
  restore:restore-verify)
    [ "${#ARGS[@]}" -eq 2 ] && valid_backup "${ARGS[1]}" || deny "restore-verify <backup_id>"
    exec ${RUNNER} "${LIB_DIR}/restore_rehnimarket.sh" "${ARGS[1]}" --verify-only
    ;;
  restore:restore)
    [ "${#ARGS[@]}" -eq 4 ] && valid_backup "${ARGS[1]}" && [ "${ARGS[2]}" = "${ARGS[1]}" ] && valid_run "${ARGS[3]}" \
      || deny "restore <backup_id> <confirmacion igual al id> <run_id>"
    exec ${RUNNER} env GITHUB_RUN_ID="${ARGS[3]}" "${LIB_DIR}/restore_rehnimarket.sh" "${ARGS[1]}" "--confirm=${ARGS[2]}"
    ;;
  *)
    deny "orden no permitida para el rol '${ROLE}'"
    ;;
esac
