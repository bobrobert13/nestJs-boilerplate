#!/usr/bin/env bash
# =============================================================================
# Docker Test Script for NestJS Boilerplate Service
# =============================================================================
# Builds the image via docker-compose, brings up Mongo + app, runs the health
# check against the exposed /api/health endpoint, and cleans up afterwards.
#
# Usage:
#   ./docker-test.sh              # Build + up, wait for health, wait 60s, down
#   ./docker-test.sh keep         # Same, but keep containers running (Ctrl+C)
#   ./docker-test.sh --keep       # Same as above
#   ./docker-test.sh -k           # Same as above
#
# Environment overrides:
#   APP_PORT        Host port mapped to the service (default: 3000)
#   COMPOSE_FILE    Compose file to use         (default: docker-compose.yml)
#   HEALTH_TIMEOUT  Max seconds to wait for health (default: 90)
# =============================================================================

set -euo pipefail

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
IMAGE_NAME="boilerplate-service:test"
SERVICE_NAME="boilerplate-service"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
COMPOSE_OVERRIDE="${COMPOSE_OVERRIDE:-docker-compose.test.yml}"
APP_PORT="${APP_PORT:-3000}"
HEALTH_URL="http://localhost:${APP_PORT}/api/health"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-90}"
KEEP_WAIT=60

# -----------------------------------------------------------------------------
# Port detection — auto-bump if the default is already allocated on the host
# (e.g. another stack running). Checks docker container port allocations, then
# falls back to a /dev/tcp probe.
# -----------------------------------------------------------------------------
port_in_use() {
  local port="$1"
  # 1. Any docker container already publishing this port?
  if docker ps --format '{{.Ports}}' 2>/dev/null | tr ',' '\n' | grep -qE "0\.0\.0\.0:${port}->|:${port}->"; then
    return 0
  fi
  # 2. TCP bind test as last resort
  if command -v bash >/dev/null 2>&1 && (exec 3<>"/dev/tcp/127.0.0.1/${port}") 2>/dev/null; then
    exec 3<&- 3>&-
    return 0
  fi
  return 1
}

find_free_port() {
  local start="$1"
  local max=20
  local p="$start"
  for ((i=0; i<max; i++)); do
    if ! port_in_use "$p"; then
      echo "$p"
      return 0
    fi
    p=$((p + 1))
  done
  echo "$start"   # give up; let docker report the conflict
  return 1
}

# -----------------------------------------------------------------------------
# Argument parsing
# -----------------------------------------------------------------------------
KEEP_RUNNING="false"
case "${1:-}" in
  keep|--keep|-k) KEEP_RUNNING="true" ;;
  -h|--help)
    sed -n '2,18p' "$0"
    exit 0
    ;;
  "")
    : # default
    ;;
  *)
    echo "Unknown option: $1" >&2
    echo "Run '$0 --help' for usage." >&2
    exit 2
    ;;
esac

# -----------------------------------------------------------------------------
# Pretty logging
# -----------------------------------------------------------------------------
log()  { printf '%s\n' "$*"; }
info() { log "🔧 $*"; }
ok()   { log "✅ $*"; }
warn() { log "⚠️  $*"; }
fail() { log "❌ $*"; }

# -----------------------------------------------------------------------------
# Pre-flight checks (fail fast with a clear message instead of mid-run)
# -----------------------------------------------------------------------------
preflight() {
  command -v docker >/dev/null 2>&1 || { fail "docker not found in PATH"; exit 1; }

  if ! docker info >/dev/null 2>&1; then
    fail "Docker daemon not reachable. Is Docker Desktop running?"
    exit 1
  fi

  if docker compose version >/dev/null 2>&1; then
    COMPOSE=(docker compose)
  elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE=(docker-compose)
  else
    fail "Neither 'docker compose' (v2) nor 'docker-compose' (v1) is available."
    exit 1
  fi

  [[ -f "$COMPOSE_FILE" ]] || { fail "Compose file not found: $COMPOSE_FILE"; exit 1; }
  [[ -f Dockerfile ]]      || { fail "Dockerfile not found in $(pwd)"; exit 1; }

  COMPOSE_FILES=(-f "$COMPOSE_FILE")
  if [[ -f "$COMPOSE_OVERRIDE" ]]; then
    COMPOSE_FILES+=(-f "$COMPOSE_OVERRIDE")
    info "Override file    : $COMPOSE_OVERRIDE"
  fi

  # Optional but used for nicer output
  command -v curl >/dev/null 2>&1 || warn "curl not found — health checks will skip body pretty-print"
}

# -----------------------------------------------------------------------------
# Cleanup — removes only what this script started
# -----------------------------------------------------------------------------
cleanup() {
  log ""
  info "Cleaning up..."
  # -v removes anonymous volumes (keeps the replica-set state from poisoning
  # the next test run, which would otherwise keep a stale `localhost:27017`
  # host entry from a previous failed initiate)
  "${COMPOSE[@]}" "${COMPOSE_FILES[@]}" -p "$COMPOSE_PROJECT_NAME" down --remove-orphans -v >/dev/null 2>&1 || true

  log ""
  ok "Docker test completed!"
  log ""
  log "📝 To run manually:"
  log "   ${COMPOSE[*]} ${COMPOSE_FILES[*]} up -d"
  log "   ${COMPOSE[*]} ${COMPOSE_FILES[*]} down"
  log ""
  log "📝 Or build + run the image alone:"
  log "   docker build -t $IMAGE_NAME ."
  log "   docker run -d --name boilerplate-service -p ${APP_PORT}:3000 --env-file .env $IMAGE_NAME"
  log ""
}

# -----------------------------------------------------------------------------
# Replica set init — docker-compose.yml starts mongod with --replSet rs0 but
# never runs rs.initiate(). Do it ourselves after the container is up.
#
# IMPORTANT: the RS member host MUST be the compose service name (default
# `mongodb`), not `localhost`. The client receives the RS config and tries to
# reach each member as listed — `localhost` would resolve to the client's own
# loopback where there is no Mongo, and the connection would fail with
# ECONNREFUSED 127.0.0.1:27017.
# -----------------------------------------------------------------------------
init_replica_set() {
  local container="$1"
  local rs_host="${2:-mongodb}"
  local rs_port="${3:-27017}"
  local attempts=0
  local max=30
  info "Initializing MongoDB replica set (rs0) inside $container (host=${rs_host}:${rs_port})..."

  # First, wait until mongod answers ping (so the connection is ready)
  while (( attempts < max )); do
    if docker exec "$container" mongosh --quiet --eval 'db.adminCommand({ping:1}).ok' 2>/dev/null | grep -q '^1$'; then
      break
    fi
    sleep 1
    attempts=$((attempts + 1))
  done
  if (( attempts >= max )); then
    fail "Mongo did not respond to ping within ${max}s"
    return 1
  fi

  # Now attempt initiate; tolerate "already initialized" responses
  local out
  out="$(docker exec "$container" mongosh --quiet --eval \
    "try { const r = rs.initiate({_id:\"rs0\",members:[{_id:0,host:\"${rs_host}:${rs_port}\"}]}); print(JSON.stringify(r)); } catch(e) { print(\"ERR:\"+e.message); }" \
    2>&1 || true)"

  if echo "$out" | grep -q '"ok"[[:space:]]*:[[:space:]]*1'; then
    ok "Replica set rs0 initialized"
    return 0
  fi
  if echo "$out" | grep -qE 'already initialized|already initiated|already exists'; then
    ok "Replica set rs0 was already initialized"
    return 0
  fi

  fail "Could not initialize replica set. Output: $out"
  return 1
}

# -----------------------------------------------------------------------------
# Health check with polling (no fixed sleep before first attempt)
# -----------------------------------------------------------------------------
wait_for_health() {
  local elapsed=0
  local attempt=0
  local step=2

  if ! command -v curl >/dev/null 2>&1; then
    warn "curl unavailable — skipping active health probe"
    sleep 5
    return 0
  fi

  log "🏥 Health check: $HEALTH_URL (timeout ${HEALTH_TIMEOUT}s)"
  while (( elapsed < HEALTH_TIMEOUT )); do
    attempt=$((attempt + 1))
    if curl -fsS --max-time 3 "$HEALTH_URL" >/dev/null 2>&1; then
      ok "Health check passed after ${elapsed}s (attempt ${attempt})"
      if command -v jq >/dev/null 2>&1; then
        curl -fsS --max-time 3 "$HEALTH_URL" | jq . 2>/dev/null || true
      else
        curl -fsS --max-time 3 "$HEALTH_URL" || true
      fi
      return 0
    fi
    printf '   ⏸️  attempt %d (%ss elapsed)\r' "$attempt" "$elapsed"
    sleep "$step"
    elapsed=$((elapsed + step))
  done
  return 1
}

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------
preflight
trap cleanup EXIT
trap 'exit 130' INT TERM

info "Compose command : ${COMPOSE[*]}"
info "Compose file    : $COMPOSE_FILE"

# Auto-pick free ports so the test stack does not collide with a running one
ORIGINAL_APP_PORT="$APP_PORT"
APP_PORT="$(find_free_port "$APP_PORT")"
[[ "$APP_PORT" != "$ORIGINAL_APP_PORT" ]] && \
  warn "Port $ORIGINAL_APP_PORT already in use — using $APP_PORT instead" && \
  export APP_PORT

ORIGINAL_MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_PORT="$(find_free_port "$ORIGINAL_MONGO_PORT")"
[[ "$MONGO_PORT" != "$ORIGINAL_MONGO_PORT" ]] && \
  warn "Port $ORIGINAL_MONGO_PORT already in use — using $MONGO_PORT instead" && \
  export MONGO_PORT

HEALTH_URL="http://localhost:${APP_PORT}/api/health"
info "App port (host) : $APP_PORT"
info "Mongo port      : $MONGO_PORT"

# Use a project name scoped to this test to avoid colliding with other stacks
export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-boilerplate_test}"

log ""
info "Building image and starting stack (this may take a few minutes on first run)..."
"${COMPOSE[@]}" "${COMPOSE_FILES[@]}" -p "$COMPOSE_PROJECT_NAME" build --pull=false

log ""
info "Starting Mongo + service..."
"${COMPOSE[@]}" "${COMPOSE_FILES[@]}" -p "$COMPOSE_PROJECT_NAME" up -d mongodb

# Replica set bootstrapping is a known gap in docker-compose.yml — patch it here.
if ! init_replica_set "boilerplate-mongodb"; then
  "${COMPOSE[@]}" "${COMPOSE_FILES[@]}" -p "$COMPOSE_PROJECT_NAME" logs --no-color --tail=80 mongodb
  exit 1
fi

# Now bring up the service (depends_on mongodb: service_healthy will now pass)
"${COMPOSE[@]}" "${COMPOSE_FILES[@]}" -p "$COMPOSE_PROJECT_NAME" up -d "$SERVICE_NAME"

log ""
info "Streaming first 8s of service logs..."
timeout 8 "${COMPOSE[@]}" "${COMPOSE_FILES[@]}" -p "$COMPOSE_PROJECT_NAME" logs --no-color --tail=80 "$SERVICE_NAME" || true

log ""
if ! wait_for_health; then
  fail "Health check did not pass within ${HEALTH_TIMEOUT}s"
  log ""
  info "Last 80 lines of service logs:"
  "${COMPOSE[@]}" "${COMPOSE_FILES[@]}" -p "$COMPOSE_PROJECT_NAME" logs --no-color --tail=80 "$SERVICE_NAME" || true
  exit 1
fi

log ""
log "📋 ============================================"
log "📋 Stack is up. Useful commands (other terminal):"
log "📋 ============================================"
log "   ${COMPOSE[*]} ${COMPOSE_FILES[*]} -p $COMPOSE_PROJECT_NAME logs -f $SERVICE_NAME"
log "   ${COMPOSE[*]} ${COMPOSE_FILES[*]} -p $COMPOSE_PROJECT_NAME exec $SERVICE_NAME sh"
log "   curl http://localhost:${APP_PORT}/api/health"
log "   curl http://localhost:${APP_PORT}/api          # Swagger UI"
log "   curl http://localhost:${APP_PORT}/api/usuarios # JWT-protected example"
log ""

if [[ "$KEEP_RUNNING" == "true" ]]; then
  info "Keeping containers running (Ctrl+C to trigger cleanup)..."
  "${COMPOSE[@]}" "${COMPOSE_FILES[@]}" -p "$COMPOSE_PROJECT_NAME" logs -f "$SERVICE_NAME"
  exit 0
fi

info "Waiting ${KEEP_WAIT}s before cleanup (Ctrl+C to keep stack)..."
for ((i=KEEP_WAIT; i>0; i--)); do
  printf '\r⏱️  Cleanup in %3d seconds... (Ctrl+C to keep containers) ' "$i"
  sleep 1
done
log ""
log ""

# cleanup runs via EXIT trap
