#!/usr/bin/env bash
# Exporta los diagramas Mermaid (docs/Manuales/diagramas/*.mmd) a PNG en
# docs/Manuales/diagramas/png/ con @mermaid-js/mermaid-cli por npx (sin instalación global):
# fondo blanco y escala 3 (-s 3). Primero se exporta a SVG para leer el tamaño natural del
# diagrama y se pasa como --size: sin él, mermaid-cli recorta el lienzo a 800 px (los
# diagramas grandes quedan ilegibles) o estira los pequeños.
# Uso: bash docs/Manuales/scripts/exportar_diagramas.sh [nombre ...]   (sin argumentos: todos)
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../diagramas" && pwd)"
CONFIG="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/mermaid-config.json"
MMDC=(npx -y -p @mermaid-js/mermaid-cli@12.2.0 mmdc)
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$DIR/png"

if [ "$#" -gt 0 ]; then
  nombres=("$@")
else
  nombres=()
  for f in "$DIR"/*.mmd; do nombres+=("$(basename "$f" .mmd)"); done
fi

for n in "${nombres[@]}"; do
  "${MMDC[@]}" -i "$DIR/$n.mmd" -o "$TMP/$n.svg" -c "$CONFIG" -b white --size 4000 -q
  tam=$(grep -oE 'viewBox="[^"]*"' "$TMP/$n.svg" | head -1 | awk '{w=$3+0; h=$4; gsub(/"/,"",h); h=h+0; m=(w>h?w:h); printf "%d", m+2}')
  [ "$tam" -gt 4000 ] && tam=4000
  echo "→ $n (${tam} px)"
  "${MMDC[@]}" -i "$DIR/$n.mmd" -o "$DIR/png/$n.png" -c "$CONFIG" -b white -s 3 --size "$tam" -q
done
