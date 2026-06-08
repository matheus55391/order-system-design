#!/usr/bin/env bash
set -euo pipefail

CONTAINER="${MINIO_CONTAINER:-order-system-minio}"
MINIO_USER="${MINIO_ROOT_USER:-order_system}"
MINIO_PASS="${MINIO_ROOT_PASSWORD:-order_system}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ASSET="$ROOT_DIR/packages/database/seed-assets/default-product.webp"

if [[ ! -f "$ASSET" ]]; then
  echo "Imagem não encontrada: $ASSET"
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "Container MinIO não está rodando: $CONTAINER"
  echo "Execute: pnpm docker:up"
  exit 1
fi

echo "Configurando bucket products no MinIO ($CONTAINER)..."

docker exec "$CONTAINER" mc alias set local http://localhost:9000 "$MINIO_USER" "$MINIO_PASS"
docker exec "$CONTAINER" mc mb local/products --ignore-existing
docker exec "$CONTAINER" mc anonymous set download local/products

docker cp "$ASSET" "$CONTAINER:/tmp/default-product.webp"
docker exec "$CONTAINER" mc cp /tmp/default-product.webp local/products/default-product.webp
docker exec "$CONTAINER" rm -f /tmp/default-product.webp

echo "MinIO pronto: http://localhost:9000/products/default-product.webp"
