# Tasks: audit-agents-md-references

## Group 1 — Critical: Remove phantom @common/inngest

### 1.1 §3 — Spec directory listing
- [ ] Remove `inngest/spec.md` from the directory tree
- [ ] Add `common/`, `documentation/`, `dynamic-schema/`

### 1.2 §4 — Package matrix
- [ ] Remove `@common/inngest` row from the matrix table
- [ ] Remove `@common/inngest` from the dependency diagram (mermaid)
- [ ] Remove `@common/inngest` notes section

### 1.3 §6 — tsconfig paths
- [ ] Remove `"@common/inngest"` line from the tsconfig paths JSON

### 1.4 §12 — Status dashboard
- [ ] Remove `@common/inngest` from Documentation table

### 1.5 §13 — Cross-Reference Matrix
- [ ] Remove `inngest` row from the matrix

## Group 2 — Critical: Remove phantom auth module references

### 2.1 §11 — Key Files
- [ ] Remove `apps/nominas/src/modules/auth/src/two-factor/README.md` row

### 2.2 §13 — Cross-Reference Matrix
- [ ] Remove `apps/nominas/src/modules/auth/README.md` row (Auth apps)

## Group 3 — Critical: Fix broken link in §4

### 3.1 §4 — Broken link
- [ ] Remove `[packages/inngest/README.md]` link from the matrix

## Group 4 — High: Add undocumented modules

### 4.1 §4 — Notes section
- [ ] Add `scraper` module notes (Ubicación: `apps/nominas/src/modules/scraper/`)
- [ ] Add `health` module notes (Ubicación: `apps/nominas/src/modules/health/`)

### 4.2 §12 — Documentation table
- [ ] Add `scraper` row
- [ ] Add `health` row

### 4.3 §13 — Cross-Reference Matrix
- [ ] Add `scraper` row (Spec: —, README: exists, Código Fuente: `apps/nominas/src/modules/scraper/`)
- [ ] Add `health` row (Spec: —, README: —, Código Fuente: `apps/nominas/src/modules/health/`)
- [ ] Add `usuarios` row (Spec: —, README: exists, Código Fuente: `apps/nominas/src/modules/usuarios/`)

## Group 5 — Medium: Fix anchor and formatting

### 5.1 §1 — Git hooks anchor
- [ ] Change `#issues-conocidos` to `#12-project-status-dashboard` or `#7-despliegue`

### 5.2 §9 — Clean blank lines
- [ ] Remove extraneous blank lines after CHANGELOG section removal

### 5.3 §6 — Inngest env var markers
- [ ] Change `⚠️ INNGEST_EVENT_KEY` to `✓ INNGEST_EVENT_KEY` with note
- [ ] Change `⚠️ INNGEST_SIGNING_KEY` to `✓ INNGEST_SIGNING_KEY` with note
- [ ] Add note: "Logs a warning if not set, but does not prevent startup"

## Group 6 — Low: Clarify change status

### 6.1 §12 — dynamic-schema-complete-pipeline
- [ ] Verify if it should be in the active changes table or needs its state.yaml fixed
