#!/usr/bin/env bash
# Envoltorio con el nombre que pide el bootcamp (semana 2: scripts/respaldar.sh).
# No tiene lógica propia: ejecuta scripts/backup_rehnimarket.sh con los mismos
# argumentos y variables de entorno (BACKUP_DIR, KEEP_DAILY, --no-stop, ...).
# Ver la sección 3 del plan de implantación.
exec bash "$(dirname "${BASH_SOURCE[0]}")/backup_rehnimarket.sh" "$@"
