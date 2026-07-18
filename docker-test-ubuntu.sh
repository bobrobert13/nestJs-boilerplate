#!/usr/bin/env bash
# =============================================================================
# Docker Test Script for NestJS Boilerplate — Ubuntu flavour
# =============================================================================
# Thin wrapper around docker-test.sh that:
#   1. Confirms we are running on Ubuntu (fails fast otherwise).
#   2. Ensures docker + the compose plugin are installed (apt install if not).
#   3. Ensures the user can talk to the docker daemon (sudo / docker group).
#   4. Executes docker-test.sh with all arguments forwarded.
#
# Same philosophy as the cross-platform script: build, up, health-check,
# wait, tear down. The differences live entirely in the bootstrap section.
#
# Usage:
#   ./docker-test-ubuntu.sh              # Run full test cycle
#   ./docker-test-ubuntu.sh keep         # Keep containers up (Ctrl+C)
#   ./docker-test-ubuntu.sh --keep       # Same
#
# Environment overrides (forwarded to docker-test.sh):
#   APP_PORT, MONGO_PORT, COMPOSE_FILE, COMPOSE_OVERRIDE, HEALTH_TIMEOUT
# =============================================================================

set -euo pipefail

# -----------------------------------------------------------------------------
# Locate docker-test.sh (same directory preferred, then PATH)
# -----------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_SCRIPT="${TARGET_SCRIPT:-}"
if [[ -z "${TARGET_SCRIPT}" ]]; then
  if [[ -x "${SCRIPT_DIR}/docker-test.sh" ]]; then
    TARGET_SCRIPT="${SCRIPT_DIR}/docker-test.sh"
  elif command -v docker-test.sh >/dev/null 2>&1; then
    TARGET_SCRIPT="$(command -v docker-test.sh)"
  else
    echo "❌ docker-test.sh not found next to this script and not in PATH." >&2
    echo "   Clone the repo or copy docker-test.sh next to this file." >&2
    exit 1
  fi
fi

# -----------------------------------------------------------------------------
# Pretty helpers
# -----------------------------------------------------------------------------
log()  { printf '%s\n' "$*"; }
info() { log "🔧 $*"; }
ok()   { log "✅ $*"; }
warn() { log "⚠️  $*"; }
fail() { log "❌ $*"; }

# -----------------------------------------------------------------------------
# 1. OS check — Ubuntu only
# -----------------------------------------------------------------------------
if [[ ! -f /etc/os-release ]]; then
  fail "/etc/os-release not found — this wrapper assumes Ubuntu."
  exit 1
fi
# shellcheck source=/dev/null
. /etc/os-release
if [[ "${ID:-}" != "ubuntu" ]]; then
  fail "This wrapper targets Ubuntu. Detected: ${PRETTY_NAME:-unknown}"
  log "   Use docker-test.sh directly on other distros."
  exit 1
fi
info "OS detected    : ${PRETTY_NAME} (${VERSION:-n/a})"

# -----------------------------------------------------------------------------
# 2. Privilege escalation — prefer sudo if not running as root
# -----------------------------------------------------------------------------
SUDO=""
if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  if command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
    info "Not root — will use sudo for privileged operations"
  else
    fail "Script needs root privileges (or sudo) to install packages."
    exit 1
  fi
fi

# -----------------------------------------------------------------------------
# 3. Install docker + compose plugin if missing
# -----------------------------------------------------------------------------
ensure_apt_updated() {
  local stamp=/var/lib/apt/periodic/update-success-stamp
  if [[ ! -f "$stamp" ]] || (( $(($(date +%s) - $(stat -c %Y "$stamp"))) > 3600 )); then
    info "Refreshing apt cache..."
    $SUDO apt-get update -qq
  fi
}

install_docker() {
  info "Installing docker.io + docker-compose-plugin via apt..."
  ensure_apt_updated
  $SUDO apt-get install -y -qq docker.io docker-compose-plugin
}

ensure_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    warn "docker not found — installing"
    install_docker
  fi

  # Compose v2 is the standard; v1 (docker-compose binary) is deprecated.
  if ! docker compose version >/dev/null 2>&1; then
    if command -v docker-compose >/dev/null 2>&1; then
      warn "Only legacy docker-compose (v1) is present — will be used as fallback"
    else
      warn "docker compose plugin not found — installing"
      $SUDO apt-get install -y -qq docker-compose-plugin
    fi
  fi

  ok "docker          : $(docker --version)"
  if docker compose version >/dev/null 2>&1; then
    ok "docker compose  : $(docker compose version --short 2>/dev/null || echo present)"
  else
    ok "docker-compose  : $(docker-compose --version 2>/dev/null || echo present)"
  fi
}

# -----------------------------------------------------------------------------
# 4. Docker daemon reachability
# -----------------------------------------------------------------------------
ensure_docker_running() {
  if docker info >/dev/null 2>&1; then
    ok "Docker daemon is reachable"
    return 0
  fi

  # Common causes: service not running, or user lacks socket perms
  if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet docker 2>/dev/null; then
    fail "Docker service is active but the daemon is unreachable."
    log "   Check 'docker info' output above."
    exit 1
  fi

  warn "Docker daemon is not reachable — attempting to start it"
  if command -v systemctl >/dev/null 2>&1; then
    $SUDO systemctl enable --now docker
  elif command -v service >/dev/null 2>&1; then
    $SUDO service docker start
  else
    fail "Cannot start docker: neither systemctl nor service is available."
    exit 1
  fi

  # Give it a moment to come up
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    if docker info >/dev/null 2>&1; then
      ok "Docker daemon started"
      break
    fi
    sleep 1
  done

  if ! docker info >/dev/null 2>&1; then
    fail "Docker daemon did not become reachable in time."
    exit 1
  fi

  # If we had to use sudo to start the daemon, the calling user may still
  # lack socket permissions. Offer to add them to the docker group.
  if [[ -n "${SUDO}" ]]; then
    local user
    user="$(id -un)"
    if ! groups "$user" 2>/dev/null | tr ' ' '\n' | grep -qx docker; then
      warn "User '$user' is not in the 'docker' group; subsequent commands need sudo."
      log "   Fix once with:  ${SUDO} usermod -aG docker $user   (then re-login)"
    fi
  fi
}

# -----------------------------------------------------------------------------
# Bootstrap
# -----------------------------------------------------------------------------
ensure_docker
ensure_docker_running

log ""
ok "Ubuntu bootstrap complete — handing off to docker-test.sh"
log ""

# -----------------------------------------------------------------------------
# Hand off — keep env vars and arguments intact
# -----------------------------------------------------------------------------
exec "${SUDO:+$SUDO}" "${TARGET_SCRIPT}" "$@"
