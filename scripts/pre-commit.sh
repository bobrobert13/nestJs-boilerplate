#!/usr/bin/env bash
# scripts/pre-commit.sh
# Hook pre-commit para verificar coverage JSDoc antes de commit.
#
# Install: cp scripts/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

set -e

echo "[pre-commit] Verificando cobertura JSDoc..."

if ! node scripts/audit-docs.js --json > /tmp/audit-result.json 2>/dev/null; then
  echo "[pre-commit] ERROR: fallo audit-docs.js"
  exit 1
fi

COVERAGE=$(node -e "const d = require('/tmp/audit-result.json'); console.log(d.globalMethodCoverage)")
THRESHOLD=80

if [ "$COVERAGE" -lt "$THRESHOLD" ]; then
  echo "[pre-commit] Coverage JSDoc: ${COVERAGE}% (threshold: ${THRESHOLD}%)"
  echo "[pre-commit] OK (permitiendo commit durante periodo de transicion)"
  echo "[pre-commit] Para fallar el commit, cambiar a modo estricto en CI (--strict)"
  exit 0
fi

echo "[pre-commit] Coverage JSDoc: ${COVERAGE}% OK"