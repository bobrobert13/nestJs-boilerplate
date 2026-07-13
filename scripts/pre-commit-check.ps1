# scripts/pre-commit-check.ps1
# Hook pre-commit para PowerShell en Windows.

$ErrorActionPreference = "Stop"

Write-Host "[pre-commit] Verificando cobertura JSDoc..." -ForegroundColor Cyan

try {
  $result = node scripts/audit-docs.js --json 2>$null | ConvertFrom-Json
  $coverage = $result.globalMethodCoverage
  Write-Host "[pre-commit] Coverage JSDoc: $coverage%"
  Write-Host "[pre-commit] OK (modo permisivo activo durante transicion)"
  exit 0
} catch {
  Write-Host "[pre-commit] ERROR: fallo audit-docs.js" -ForegroundColor Red
  exit 1
}