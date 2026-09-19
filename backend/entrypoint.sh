#!/bin/sh
set -e

echo "=================================================="
echo " Starting Red Thread Backend"
echo " Environment: ${ENVIRONMENT:-local}"
echo "=================================================="

# 1. Esperar a que MongoDB esté disponible
echo "⏳ Esperando conexión con MongoDB..."
python - <<'EOF'
import os
import sys
import time
from urllib.parse import urlparse
from pymongo import MongoClient

mongo_url = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
max_retries = 30
retry_interval = 1

for attempt in range(1, max_retries + 1):
    try:
        client = MongoClient(mongo_url, serverSelectionTimeoutMS=2000)
        client.admin.command('ping')
        print(f"✅ Conexión establecida con MongoDB ({mongo_url})")
        sys.exit(0)
    except Exception as e:
        print(f"[{attempt}/{max_retries}] MongoDB aún no disponible ({e}). Reintentando en {retry_interval}s...")
        time.sleep(retry_interval)

print("❌ Error: Tiempo de espera agotado para conectar a MongoDB")
sys.exit(1)
EOF

# 2. Ejecutar seed automático según ambiente
# Local: corre si la colección está vacía
# DEV/QA: corre en cada despliegue para asegurar consistencia
# PROD: corre solo si no existen registros
echo "🚀 Verificando/ejecutando seed del sistema para ambiente '${ENVIRONMENT:-local}'..."
python -m src.core.seed --env="${ENVIRONMENT:-local}"

# 3. Iniciar el proceso principal
echo "🚀 Iniciando servidor backend..."
exec "$@"
