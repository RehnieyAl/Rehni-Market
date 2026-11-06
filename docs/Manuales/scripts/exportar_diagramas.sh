#!/usr/bin/env bash
# Exporta los diagramas Mermaid (docs/Manuales/diagramas/*.mmd) a PNG en
# docs/Manuales/diagramas/png/ con @mermaid-js/mermaid-cli por npx (sin instalación global).
# Uso: bash docs/Manuales/scripts/exportar_diagramas.sh [nombre ...]   (sin argumentos: todos)
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../diagramas" && pwd)"
CONFIG="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/mermaid-config.json"
mkdir -p "$DIR/png"

if [ "$#" -gt 0 ]; then
  nombres=("$@")
else
  nombres=()
  for f in "$DIR"/*.mmd; do nombres+=("$(basename "$f" .mmd)"); done
fi

for n in "${nombres[@]}"; do
  echo "→ $n"
  npx -y -p @mermaid-js/mermaid-cli@12.2.0 mmdc \
    -i "$DIR/$n.mmd" -o "$DIR/png/$n.png" \
    -c "$CONFIG" -b white -s 3 -q
done
