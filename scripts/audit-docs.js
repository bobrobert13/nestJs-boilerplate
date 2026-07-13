const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const THRESHOLD = 80;
const SCAN_PATHS = ["packages", "apps"];
const IGNORE = ["node_modules", "dist", "__tests__", "__mocks__", "test", "coverage"];

function findTsFiles(dir, acc) {
  if (!acc) acc = [];
  if (!fs.existsSync(dir)) return acc;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (IGNORE.some(function (ig) { return e.name === ig || e.name.startsWith(ig + "."); })) continue;
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
  const reExpFn = new RegExp("^export\\s+(?:async\\s+)?function\\s+(\\w+)");
  const reExpIface = new RegExp("^export\\s+interface\\s+(\\w+)");
  const reJSDoc = new RegExp("^\\s*/\\*\\*");
  const reCls = new RegExp("^(?:export\\s+)?(?:abstract\\s+)?class\\s+(\\w+)");
  const reMethod = new RegExp("^\\s*(?:public\\s+)?(?:async\\s+)?(\\w+)\\s*(?:<[^>]*>)?\\s*\\(");
  let inCls = false; let depth = 0;
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    const cls = ln.match(reCls);
    if (cls) { inCls = true; depth = 0; }
    if (inCls) {
      const opens = (ln.match(/\{/g) || []).length;
      const closes = (ln.match(/\}/g) || []).length;
      depth += opens - closes;
      if (depth <= 0 && closes > 0) { inCls = false; depth = 0; continue; }
    }
    if (inCls) {
      const m = ln.match(reMethod);
      if (m && ln.indexOf("private") === -1 && ln.indexOf("protected") === -1) {
        const prev = lines[i - 1] || ""; const prev2 = lines[i - 2] || ""; const prev3 = lines[i - 3] || "";
        const prev4 = lines[i - 4] || ""; const prev5 = lines[i - 5] || ""; const prev6 = lines[i - 6] || ""; const block = [prev6, prev5, prev4, prev3, prev2, prev, prev3, prev2, prev].join("\n"); const hasJSDoc = /\/\*\*[\s\S]*\*\//.test(block) || ln.indexOf("/**") !== -1;
        classMethods.push({ name: m[1], line: i + 1, hasJSDoc: hasJSDoc });
      }
    }
    const fnMatch = ln.match(reExpFn);
    if (fnMatch) { functions.push({ name: fnMatch[1], line: i + 1, hasJSDoc: reJSDoc.test(lines[i - 1] || "") }); }
    const ifcMatch = ln.match(reExpIface);
    if (ifcMatch) { interfaces.push({ name: ifcMatch[1], line: i + 1, hasJSDoc: reJSDoc.test(lines[i - 1] || "") }); }
  }
  const all = classMethods.concat(functions).concat(interfaces);
  const documented = all.filter(function (e) { return e.hasJSDoc; }).length;
  const total = all.length;
  return { file: filePath, total: total, documented: documented, coverage: total === 0 ? 100 : Math.round((documented / total) * 100), gaps: all.filter(function (e) { return !e.hasJSDoc; }) };
}

function getPackage(relPath) {
  const norm = relPath.split(path.sep).join("/");
  const m = norm.match(new RegExp("^(packages|apps)/([^/]+)"));
  return m ? m[2] : "root";
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.indexOf("--json") !== -1;
  const writeMode = args.indexOf("--write") !== -1;
  const strictMode = args.indexOf("--strict") !== -1;
  const files = SCAN_PATHS.flatMap(function (p) { return findTsFiles(path.join(ROOT, p)); });
  const results = files.map(analyzeFile).filter(function (r) { return r.total > 0; });
  const byPkg = {};
  let grandTotal = 0, grandDocumented = 0, grandFiles = 0, grandFilesWith = 0;
  for (const r of results) {
    const rel = path.relative(ROOT, r.file);
    const pkg = getPackage(rel);
    if (!byPkg[pkg]) byPkg[pkg] = { total: 0, documented: 0, files: 0, filesWithJSDoc: 0, gaps: [] };
    byPkg[pkg].total += r.total;
    byPkg[pkg].documented += r.documented;
    byPkg[pkg].files += 1;
    if (r.documented > 0) byPkg[pkg].filesWithJSDoc += 1;
    if (r.gaps.length > 0) byPkg[pkg].gaps.push({ file: rel, missing: r.gaps.map(function (g) { return g.name; }) });
    grandTotal += r.total;
    grandDocumented += r.documented;
    grandFiles += 1;
    if (r.documented > 0) grandFilesWith += 1;
  }
  const globalMethodCoverage = grandTotal === 0 ? 100 : Math.round((grandDocumented / grandTotal) * 100);
  const globalFileCoverage = grandFiles === 0 ? 100 : Math.round((grandFilesWith / grandFiles) * 100);

  const summary = {
    globalFileCoverage: globalFileCoverage,
    globalMethodCoverage: globalMethodCoverage,
    threshold: THRESHOLD,
    passed: globalMethodCoverage >= THRESHOLD,
    packages: Object.entries(byPkg).map(function ([name, v]) {
      return { name: name, fileCoverage: v.files === 0 ? 100 : Math.round((v.filesWithJSDoc / v.files) * 100), methodCoverage: v.total === 0 ? 100 : Math.round((v.documented / v.total) * 100), files: v.files, methods: v.total, gapsCount: v.gaps.length };
    }).sort(function (a, b) { return b.methodCoverage - a.methodCoverage; }),
  };
  if (jsonMode) { console.log(JSON.stringify(summary, null, 2)); process.exit(strictMode && !summary.passed ? 1 : 0); }

  const md = [];
  md.push("# Documentation Coverage Report", "");
  md.push("> Auto-generado por scripts/audit-docs.js. NO editar manualmente.", "");
  md.push("**Global Method Coverage:** " + summary.globalMethodCoverage + "%");
  md.push("**Global File Coverage:** " + summary.globalFileCoverage + "%");
  md.push("**Threshold:** " + summary.threshold + "%");
  md.push("**Status:** " + (summary.passed ? "PASS" : "FAIL"), "");
  md.push("## Por Paquete", "");
  md.push("| Package | File Cov | Method Cov | Files | Metodos | Gap Files |");
  md.push("|---------|----------|------------|-------|---------|-----------|");
  for (const p of summary.packages) {
    const fc = p.fileCoverage >= 80 ? "OK" : (p.fileCoverage >= 50 ? "WARN" : "FAIL");
    const mc = p.methodCoverage >= 80 ? "OK" : (p.methodCoverage >= 50 ? "WARN" : "FAIL");
    md.push("| `" + p.name + "` | " + fc + " " + p.fileCoverage + "% | " + mc + " " + p.methodCoverage + "% | " + p.files + " | " + p.methods + " | " + p.gapsCount + " |");
  }
  md.push("", "## Resumen Ejecutivo", "");
  md.push("- Total archivos: " + grandFiles);
  md.push("- Total exports publicos: " + grandTotal);
  md.push("- Con JSDoc: " + grandDocumented);
  md.push("- Sin JSDoc: " + (grandTotal - grandDocumented), "", "---");
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