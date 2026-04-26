#!/bin/bash

# Docker Test Script for NestJS Boilerplate Service
# This script builds, tests, and cleans up Docker containers
#
# Usage:
#   ./docker-test.sh              # Run test with 60s wait before cleanup
#   ./docker-test.sh keep         # Keep container running until Ctrl+C
#   ./docker-test.sh --keep       # Same as above
#
# Options:
#   keep, --keep, -k    Keep container running and show live logs

set -e

IMAGE_NAME="boilerplate-service:test"
CONTAINER_NAME="boilerplate-test"
PORT=3001

# Parse arguments
KEEP_RUNNING="false"
case "${1:-}" in
  keep|--keep|-k)
    KEEP_RUNNING="true"
    ;;
esac

# Cleanup function
cleanup() {
  echo ""
  echo "🧹 Cleaning up..."
  echo "⏹️  Stopping container..."
  docker stop $CONTAINER_NAME 2>/dev/null || true

  echo "🗑️  Removing container..."
  docker rm $CONTAINER_NAME 2>/dev/null || true

  echo "🗑️  Removing image..."
  docker rmi $IMAGE_NAME 2>/dev/null || true

  echo ""
  echo "✅ Docker test completed!"
  echo ""
  echo "📝 To build and run manually:"
  echo "   docker build -t $IMAGE_NAME ."
  echo "   docker run -d --name boilerplate-service -p 3000:3000 --env-file .env $IMAGE_NAME"
  echo ""
  echo "📝 Or use docker-compose:"
  echo "   docker-compose up -d"
  echo ""
}

echo "🔨 Building Docker image..."
docker build -t $IMAGE_NAME .

echo "🧪 Running test container..."
docker run -d \
  --name $CONTAINER_NAME \
  -p ${PORT}:3000 \
  -e NODE_ENV=test \
  -e MONGODB_URI=mongodb://localhost:27017/boilerplate_db_test \
  -e PLAYWRIGHT_HEADLESS=true \
  $IMAGE_NAME

echo "⏳ Waiting for container to start (10 seconds)..."
sleep 10

echo "🔍 Checking container logs..."
docker logs $CONTAINER_NAME

echo "🏥 Running health check..."
MAX_RETRIES=10
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -f http://localhost:${PORT}/api/usuarios > /dev/null 2>&1; then
    echo "✅ Health check passed!"
    curl -s http://localhost:${PORT}/api/usuarios | jq .
    break
  fi

  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "⏸️  Health check attempt $RETRY_COUNT/$MAX_RETRIES failed, retrying in 3 seconds..."
  sleep 3
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "❌ Health check failed after $MAX_RETRIES attempts"
  cleanup
  exit 1
fi

echo ""
echo "📋 =========================================="
echo "📋 CONTAINER RUNNING - Press Ctrl+C to stop"
echo "📋 =========================================="
echo ""
echo "💡 Useful commands (in another terminal):"
echo "   docker logs -f $CONTAINER_NAME"
echo "   docker exec -it $CONTAINER_NAME sh"
echo "   curl http://localhost:${PORT}/api/usuarios"
echo ""

if [ "$KEEP_RUNNING" = "true" ]; then
  echo "📊 Showing live logs (Ctrl+C to stop and cleanup)..."
  echo ""
  trap cleanup EXIT
  docker logs -f $CONTAINER_NAME
else
  echo "⏸️  Waiting 60 seconds before cleanup (or press Ctrl+C to stop now)..."
  echo ""

  for i in {60..1}; do
    printf "\r⏱️  Cleanup in %3d seconds... (Ctrl+C to keep container) " $i
    sleep 1
  done
  echo ""
  echo ""

  cleanup
fi