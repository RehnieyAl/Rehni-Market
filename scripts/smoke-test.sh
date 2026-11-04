#!/usr/bin/env bash
# Envoltorio con el nombre que pide el bootcamp (semana 4: scripts/smoke-test.sh).
# No tiene lógica propia: ejecuta scripts/acceptance_smoke.sh con los mismos
# argumentos y variables de entorno (API=http://localhost:8000, PGC=rehni-postgres).
# Ojo: registra un comprador de prueba y lee su código de verificación con
# `docker exec` en el contenedor de PostgreSQL, así que se ejecuta en el servidor.
# Ver la sección 5 del plan de implantación.
exec bash "$(dirname "${BASH_SOURCE[0]}")/acceptance_smoke.sh" "$@"
