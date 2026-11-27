#!/usr/bin/env bash
# Envoltorio con el nombre que pide el bootcamp (semana 2: scripts/respaldar.sh): ejecuta
# scripts/backup_rehnimarket.sh con los mismos argumentos y variables (BACKUP_DIR, --no-stop, ...).
exec bash "$(dirname "${BASH_SOURCE[0]}")/backup_rehnimarket.sh" "$@"
