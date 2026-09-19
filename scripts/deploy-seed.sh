#!/usr/bin/env bash
# ==============================================================================
# deploy-seed.sh — Script para ejecutar el seed según el ambiente de despliegue
#
# Uso:
#   ./scripts/deploy-seed.sh local     # Seed si la tabla está vacía
#   ./scripts/deploy-seed.sh dev       # Seed en cada despliegue para consistencia
#   ./scripts/deploy-seed.sh qa        # Seed en cada despliegue para consistencia
#   ./scripts/deploy-seed.sh prod      # Seed solo si no existen registros previos
#   ./scripts/deploy-seed.sh --force   # Forzar sincronización independientemente de registros
# ==============================================================================

set -euo pipefail

ENV="${1:-local}"
FORCE_FLAG=""

if [[ "$ENV" == "--force" ]]; then
    ENV="${2:-local}"
    FORCE_FLAG="--force"
elif [[ "${2:-}" == "--force" ]]; then
    FORCE_FLAG="--force"
fi

echo "=================================================="
echo " Red Thread — Seed de Sistema por Ambiente"
echo " Ambiente objetivo: $ENV"
if [[ -n "$FORCE_FLAG" ]]; then
    echo " Modo: FORZADO (--force activado)"
fi
echo "=================================================="

# Directorio base del backend
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

cd "$BACKEND_DIR"

# Determinar ejecutable de Python
if [[ -f "venv/bin/python" ]]; then
    PYTHON_CMD="venv/bin/python"
elif [[ -f "venv/Scripts/python.exe" ]]; then
    PYTHON_CMD="venv/Scripts/python.exe"
elif command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
else
    PYTHON_CMD="python"
fi

echo "Ejecutando seed con $PYTHON_CMD..."
$PYTHON_CMD -m src.core.seed --env="$ENV" $FORCE_FLAG

echo "✅ Seed de sistema finalizado para entorno $ENV."
