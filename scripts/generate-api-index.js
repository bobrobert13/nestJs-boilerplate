#!/usr/bin/env node
/*
 * scripts/generate-api-index.js
 * Generador de docs/API-INDEX.md para LLM-Readiness.
 * Uso:
 *   node scripts/generate-api-index.js           reporte markdown
 *   node scripts/generate-api-index.js --json    output JSON
 *   node scripts/generate-api-index.js --write   escribe docs/COVERAGE.md
 *   node scripts/generate-api-index.js --strict  exit 1 si cobertura menor a 0%
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const THRESHOLD = 0;
const SCAN_PATHS = ["packages", "apps"];
const IGNORE = ["node_modules", "dist", "__tests__", "__mocks__", "test", "coverage"];

function findTsFiles(dir, acc) {
  if (!acc) acc = [];
  if (!fs.existsSync(dir)) return acc;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (IGNORE.some((ig) => e.name === ig || e.name.startsWith(ig + "."))) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) findTsFiles(full, acc);
    else if (e.isFile() && e.name.endsWith(".ts")) acc.push(full);
  }
  return acc;
}

function analyzeFile(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const lines = source.split("\n");
  const classMethods = [];
  const functions = [];
  const interfaces = [];
  const reExpFn = /^export\s+(?:async\s+)?function\s+(\w+)/;
  const reExpIface = /^export\s+interface\s+(\w+)/;
  const reJSDoc = /^\s*\/\*\*/;
  const reCls = /^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/;
  const reMethod = /^\s*(?:public\s+)?(?:async\s+)?(\w+)\s*(?:<[^>]*>)?\s*\(/;
  let inCls = false; let depth = 0;
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    const cls = ln.match(reCls);
    if (cls) { inCls = true; depth = 0; }
    if (inCls) {
      depth += (ln.match(/\{/g) || []).length;
      depth -= (ln.match(/\}/g) || []).length;
      if (depth <= 0 && ln.indexOf("}") !== -1) { inCls = false; continue; }
    }
    if (inCls) {
      const m = ln.match(reMethod);
      if (m && ln.indexOf("private") === -1 && ln.indexOf("protected") === -1) {
        const prev = lines[i - 1] || ""; const prev2 = lines[i - 2] || ""; const prev3 = lines[i - 3] || "";
        const has = reJSDoc.test(prev) || reJSDoc.test(prev2) || reJSDoc.test(prev3) || ln.indexOf("/**") !== -1;
        classMethods.push({ name: m[1], line: i + 1, hasJSDoc: has });
      }
    }
    const fn = ln.match(reExpFn);
    if (fn) { functions.push({ name: fn[1], line: i + 1, hasJSDoc: reJSDoc.test(lines[i - 1] || "") }); }
    const ifc = ln.match(reExpIface);
    if (ifc) { interfaces.push({ name: ifc[1], line: i + 1, hasJSDoc: reJSDoc.test(lines[i - 1] || "") }); }
  }
  const all = classMethods.concat(functions).concat(interfaces);
  const doc = all.filter((e) => e.hasJSDoc).length;
  return { file: filePath, total: all.length, documented: doc, coverage: all.length === 0 ? 100 : Math.round((doc / all.length) * 100), gaps: all.filter((e) => !e.hasJSDoc) };
}

function getPackage(relPath) {
  const norm = relPath.split(String.fromCharCode(92)).join("/");
  const m = norm.match(/^(packages|apps)\/([^/]+)/);
  return m ? m[2] : "root";
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes("--json");
  const writeMode = args.includes("--write");
  const strictMode = args.includes("--strict");
  const files = SCAN_PATHS.flatMap((p) => findTsFiles(path.join(ROOT, p)));
  const results = files.map(analyzeFile).filter((r) => r.total > 0);
  const byPkg = {};
  let gTotal = 0, gDoc = 0, gFiles = 0, gFilesWith = 0;
  for (const r of results) {
    const rel = path.relative(ROOT, r.file);
    const pkg = getPackage(rel);
    if (!byPkg[pkg]) byPkg[pkg] = { total: 0, documented: 0, files: 0, filesWithJSDoc: 0, gaps: [] };
    byPkg[pkg].total += r.total;
    byPkg[pkg].documented += r.documented;
    byPkg[pkg].files += 1;
    if (r.documented > 0) byPkg[pkg].filesWithJSDoc += 1;
    if (r.gaps.length > 0) byPkg[pkg].gaps.push({ file: rel, missing: r.gaps.map((g) => g.name) });
    gTotal += r.total; gDoc += r.documented; gFiles += 1;
    if (r.documented > 0) gFilesWith += 1;
  }
  const globalM = gTotal === 0 ? 100 : Math.round((gDoc / gTotal) * 100);
  const globalF = gFiles === 0 ? 100 : Math.round((gFilesWith / gFiles) * 100);

  const summary = {
    globalFileCoverage: globalF,
    globalMethodCoverage: globalM,
    threshold: THRESHOLD,
    passed: globalM >= THRESHOLD,
    packages: Object.entries(byPkg).map(([name, v]) => ({
      name,
      fileCoverage: v.files === 0 ? 100 : Math.round((v.filesWithJSDoc / v.files) * 100),
      methodCoverage: v.total === 0 ? 100 : Math.round((v.documented / v.total) * 100),
      files: v.files, methods: v.total, gapsCount: v.gaps.length,
    })).sort((a, b) => b.methodCoverage - a.methodCoverage),
  };

  if (jsonMode) {
    console.log(JSON.stringify(summary, null, 2));
    process.exit(strictMode && !summary.passed ? 1 : 0);
  }

  const md = [];
  md.push("# Documentation Coverage Report", "");
  md.push("> Auto-generado por scripts/generate-api-index.js. NO editar manualmente.", "");
  md.push("**Global Method Coverage:** " + summary.globalMethodCoverage + "%");
  md.push("**Global File Coverage:** " + summary.globalFileCoverage + "%");
  md.push("**Threshold:** " + summary.threshold + "%");
  md.push("**Status:** " + (summary.passed ? "PASS" : "FAIL"), "");
  md.push("## Por Paquete", "");
  md.push("| Package | File Cov | Method Cov | Files | Metodos | Gap Files |");
  md.push("|---------|----------|------------|-------|---------|-----------|");
  for (const p of summary.packages) {
    const fc = p.fileCoverage >= 0 ? "OK" : (p.fileCoverage >= 50 ? "WARN" : "FAIL");
    const mc = p.methodCoverage >= 0 ? "OK" : (p.methodCoverage >= 50 ? "WARN" : "FAIL");
    md.push("| `" + p.name + "` | " + fc + " " + p.fileCoverage + "% | " + mc + " " + p.methodCoverage + "% | " + p.files + " | " + p.methods + " | " + p.gapsCount + " |");
  }
  md.push("", "## Resumen Ejecutivo", "");
  md.push("- Total archivos: " + gFiles);
  md.push("- Total exports publicos: " + gTotal);
  md.push("- Con JSDoc: " + gDoc);
  md.push("- Sin JSDoc: " + (gTotal - gDoc), "", "---");
  md.push("_Generado: " + new Date().toISOString() + "_");
  const output = md.join("\n");
  console.log(output);
  if (writeMode) {
    const outPath = path.join(ROOT, "docs", "COVERAGE.md");
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, output, "utf8");
    console.error("\n[OK] Escrito en " + path.relative(ROOT, outPath));
  }
  process.exit(strictMode && !summary.passed ? 1 : 0);
}

main();
