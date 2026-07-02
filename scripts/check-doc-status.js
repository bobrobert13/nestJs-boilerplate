#!/usr/bin/env node

/**
 * DocForge — Documentation Status Checker
 *
 * Runs the same checks as the CI workflow (locally, before pushing).
 * Invoke: npm run docs:check
 *
 * Checks:
 *   1. Status tags — every package README has `<!-- status: X -->` tag
 *   2. README presence — every package dir has README.md
 *   3. Root metadata — package.json has description, author, license
 *   4. Version sync — package.json version matches CHANGELOG.md and Swagger
 *   5. Missing governance — flags missing LICENSE, SECURITY.md, etc.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let errors = 0;
let warnings = 0;

// ── Check 1: Status Tags ──────────────────────────────────────────
console.log('\n═══ Check 1: Status Tags ═══');

const pkgDirs = fs.readdirSync(path.join(ROOT, 'packages'), { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

for (const pkg of pkgDirs) {
  const readmePath = path.join(ROOT, 'packages', pkg, 'README.md');

  if (!fs.existsSync(readmePath)) {
    console.log(`  MISSING: packages/${pkg}/README.md`);
    errors++;
    continue;
  }

  const content = fs.readFileSync(readmePath, 'utf-8');
  const hasStatus = /<!--.*status:/.test(content);

  if (!hasStatus) {
    console.log(`  MISSING: packages/${pkg}/README.md (no status tag)`);
    errors++;
  } else {
    console.log(`  OK: packages/${pkg}`);
  }
}

// ── Check 2: README Presence ──────────────────────────────────────
console.log('\n═══ Check 2: README Presence ═══');

for (const pkg of pkgDirs) {
  const readmePath = path.join(ROOT, 'packages', pkg, 'README.md');
  if (fs.existsSync(readmePath)) {
    console.log(`  OK: packages/${pkg}/README.md`);
  } else {
    console.log(`  MISSING: packages/${pkg}/README.md`);
    errors++;
  }
}

// ── Check 3: Root package.json Metadata ─────────────────────────
console.log('\n═══ Check 3: Root package.json Metadata ═══');

const pkgJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));

const metadataChecks = [
  { key: 'description', label: 'description' },
  { key: 'author', label: 'author' },
];

for (const { key, label } of metadataChecks) {
  if (!pkgJson[key] || pkgJson[key] === '') {
    console.log(`  MISSING: package.json ${label} is empty`);
    warnings++;
  } else {
    console.log(`  OK: ${label} = "${pkgJson[key]}"`);
  }
}

if (pkgJson.license === 'UNLICENSED' || !pkgJson.license) {
  console.log(`  WARNING: package.json license = "${pkgJson.license}" (should add a LICENSE file)`);
  warnings++;
} else {
  console.log(`  OK: license = "${pkgJson.license}"`);
}

// ── Check 4: Version Sync ────────────────────────────────────────
console.log('\n═══ Check 4: Version Sync ═══');

const pkgVersion = pkgJson.version;
console.log(`  package.json: ${pkgVersion}`);

// Changelog check
const changelogPath = path.join(ROOT, 'CHANGELOG.md');
if (fs.existsSync(changelogPath)) {
  const changelog = fs.readFileSync(changelogPath, 'utf-8');
  const changelogVersion = (changelog.match(/##\s+\[(\d+\.\d+\.\d+)\]/) || [])[1];

  if (changelogVersion) {
    console.log(`  CHANGELOG.md: ${changelogVersion}`);
    if (pkgVersion !== changelogVersion) {
      console.log(`  MISMATCH: package.json (${pkgVersion}) != CHANGELOG.md (${changelogVersion})`);
      errors++;
    } else {
      console.log(`  OK: versions match`);
    }
  } else {
    console.log(`  WARNING: No version found in CHANGELOG.md`);
    warnings++;
  }
}

// Swagger check (main.ts)
const mainTsPath = path.join(ROOT, 'apps', 'nominas', 'src', 'main.ts');
if (fs.existsSync(mainTsPath)) {
  const mainTs = fs.readFileSync(mainTsPath, 'utf-8');
  const swaggerVersion = (mainTs.match(/\.setVersion\('([^']+)'\)/) || [])[1];

  if (swaggerVersion) {
    console.log(`  Swagger (main.ts): ${swaggerVersion}`);
    // Swagger often uses '1.0' while package.json uses '0.0.1' — flag as warning
    if (swaggerVersion !== pkgVersion && swaggerVersion !== '1.0') {
      console.log(`  WARNING: Swagger version (${swaggerVersion}) differs from package.json (${pkgVersion})`);
      warnings++;
    }
  }
}

// ── Check 5: Governance Files ────────────────────────────────────
console.log('\n═══ Check 5: Governance Files ═══');

const governanceFiles = ['LICENSE', 'SECURITY.md', 'CODE_OF_CONDUCT.md', 'CONTRIBUTING.md'];
for (const file of governanceFiles) {
  const exists = fs.existsSync(path.join(ROOT, file));
  if (exists) {
    console.log(`  OK: ${file}`);
  } else {
    console.log(`  MISSING: ${file}`);
    warnings++;
  }
}

// ── Summary ──────────────────────────────────────────────────────
console.log('\n═══ SUMMARY ═══');
console.log(`  Errors:   ${errors}`);
console.log(`  Warnings: ${warnings}`);

if (errors > 0) {
  console.log('\n  RESULT: FAIL — fix errors before committing.\n');
  process.exit(1);
}

if (warnings > 0) {
  console.log('\n  RESULT: PASS with warnings — review before committing.\n');
  process.exit(0);
}

console.log('\n  RESULT: ALL CHECKS PASSED.\n');
process.exit(0);
