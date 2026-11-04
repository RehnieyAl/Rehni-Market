#!/usr/bin/env bash
# Verifica que el servidor actual cumple los requisitos mínimos de un software.
#
# Uso:
#   bash verificar-requisitos.sh
#   MIN_RAM_MB=4096 bash verificar-requisitos.sh      # cambiar un umbral
#   OS_ID=cachyos MIN_OS_VERSION=rolling bash verificar-requisitos.sh   # equipo de desarrollo
#   PORTS="80 443" bash verificar-requisitos.sh       # servidor con FRONTEND_PORT=80
#
# Umbrales por defecto: matriz 1.5 de la ficha técnica de RehniMarket
# (docs/plan de implantacion - Rehnimarket/1) Ficha tecnica ...). SO de producción:
# Ubuntu Server 24.04 LTS. Puertos: los que publica docker-compose.yml (8080 y 8000).
# Sale con código 0 si todo cumple y 1 si algún requisito falla.

set -u

MIN_CPUS="${MIN_CPUS:-2}"
MIN_RAM_MB="${MIN_RAM_MB:-4096}"
MIN_DISK_GB="${MIN_DISK_GB:-30}"
DISK_PATH="${DISK_PATH:-/}"
OS_ID="${OS_ID:-ubuntu}"
MIN_OS_VERSION="${MIN_OS_VERSION:-24.04}"     # CachyOS (rolling, sin VERSION_ID): MIN_OS_VERSION=rolling
ARCHS="${ARCHS:-x86_64 aarch64}"
MIN_DOCKER_VERSION="${MIN_DOCKER_VERSION:-24.0}"
PORTS="${PORTS:-8080 8000}"   # + 8443 con docker-compose.tls-local.yml

fallos=0

resultado() { # $1 requisito, $2 esperado, $3 encontrado, $4 0=cumple
  local estado="CUMPLE"
  if [ "$4" -ne 0 ]; then estado="NO CUMPLE"; fallos=$((fallos + 1)); fi
  printf "%-18s %-22s %-22s %s\n" "$1" "$2" "$3" "$estado"
}

# version_ge A B -> verdadero si A >= B (compara versiones tipo 24.04 o 27.3.1)
version_ge() { [ "$(printf '%s\n%s\n' "$2" "$1" | sort -V | head -n1)" = "$2" ]; }

printf "%-18s %-22s %-22s %s\n" "REQUISITO" "ESPERADO" "ENCONTRADO" "ESTADO"
printf '%.0s-' {1..72}; echo

cpus=$(nproc)
[ "$cpus" -ge "$MIN_CPUS" ]; resultado "Procesadores" ">= $MIN_CPUS" "$cpus" $?

# RAM instalada: `lsmem` (bloques de memoria en /sys, sin root). MemTotal de /proc/meminfo
# descuenta lo que reservan firmware y kernel: una VM de 4096 MB muestra ~3915 MB y no
# pasaría el mínimo de 4 GB. Si lsmem no está disponible, se usa MemTotal.
ram_mb=$(LC_ALL=C lsmem -b --summary=only 2>/dev/null | awk '/^Total online memory:/ {print int($4 / 1048576)}')
ram_src="lsmem"
if [ -z "$ram_mb" ]; then
  ram_mb=$(awk '/MemTotal/ {print int($2 / 1024)}' /proc/meminfo)
  ram_src="MemTotal"
fi
[ "$ram_mb" -ge "$MIN_RAM_MB" ]; resultado "RAM (MB, $ram_src)" ">= $MIN_RAM_MB" "$ram_mb" $?

disk_gb=$(df -BG --output=avail "$DISK_PATH" | tail -n1 | tr -dc '0-9')
[ "$disk_gb" -ge "$MIN_DISK_GB" ]; resultado "Disco libre (GB)" ">= $MIN_DISK_GB en $DISK_PATH" "$disk_gb" $?

arch=$(uname -m)
[[ " $ARCHS " == *" $arch "* ]]; resultado "Arquitectura" "$ARCHS" "$arch" $?

# shellcheck disable=SC1091
os_id=$(. /etc/os-release && echo "$ID")
os_version=$(. /etc/os-release && echo "${VERSION_ID:-${BUILD_ID:-}}")
[ "$os_id" = "$OS_ID" ] && version_ge "$os_version" "$MIN_OS_VERSION"
resultado "Sistema operativo" "$OS_ID >= $MIN_OS_VERSION" "$os_id $os_version" $?

if command -v docker >/dev/null 2>&1; then
  docker_version=$(docker version --format '{{.Server.Version}}' 2>/dev/null \
    || docker --version | grep -oE '[0-9]+\.[0-9]+(\.[0-9]+)?' | head -n1)
  version_ge "$docker_version" "$MIN_DOCKER_VERSION"
  resultado "Docker" ">= $MIN_DOCKER_VERSION" "$docker_version" $?
else
  resultado "Docker" ">= $MIN_DOCKER_VERSION" "no instalado" 1
fi

# Puertos publicados por los contenedores de RehniMarket en marcha: no son un conflicto.
rehni_ports=$(docker ps --filter name=rehni- --format '{{.Ports}}' 2>/dev/null)

for port in $PORTS; do
  # Puertos TCP en estado LISTEN (0A), leídos de /proc para no depender de `ss`
  port_hex=$(printf '%04X' "$port")
  if awk 'FNR > 1 && $4 == "0A" {split($2, a, ":"); print a[2]}' /proc/net/tcp /proc/net/tcp6 2>/dev/null \
      | grep -qx "$port_hex"; then
    if grep -q ":${port}->" <<<"$rehni_ports"; then
      resultado "Puerto $port" "libre" "RehniMarket" 0
    else
      resultado "Puerto $port" "libre" "en uso" 1
    fi
  else
    resultado "Puerto $port" "libre" "libre" 0
  fi
done

echo
if [ "$fallos" -eq 0 ]; then
  echo "RESULTADO: el servidor cumple todos los requisitos mínimos."
else
  echo "RESULTADO: $fallos requisito(s) no se cumplen."
fi
[ "$fallos" -eq 0 ]