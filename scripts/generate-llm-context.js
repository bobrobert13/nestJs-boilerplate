#!/usr/bin/env node
/*
 * scripts/generate-llm-context.js
 *
 * Para cada archivo en packages slash src y apps slash src
 * genera un archivo .llm-context.md adyacente con metadata
 * util para agentes IA (proposito, DI, errores, convenciones).
 *
 * Uso:
 *   node scripts/generate-llm-context.js              # procesa todo
 *   node scripts/generate-llm-context.js --force     # regenera aunque sea mas nuevo
 *   node scripts/generate-llm-context.js path/to.ts  # solo un archivo
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SCAN_PATHS = ["packages", "apps"];
const IGNORE = ["node_modules", "dist", "__tests__", "__mocks__", "test", "coverage", ".spec.ts"];

function findTsFiles(dir, acc) {
  if (!acc) acc = [];
  if (!fs.existsSync(dir)) return acc;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (IGNORE.some((ig) => e.name === ig || e.name.includes(ig))) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) findTsFiles(full, acc);
    else if (e.isFile() && e.name.endsWith(".ts") && !e.name.endsWith(".d.ts")) acc.push(full);
  }
  return acc;
}

function extractMetadata(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const lines = source.split("\n");
  const meta = { purpose: null, deps: [], throws: [], returns: [], className: null };

  for (let i = 0; i < Math.min(lines.length, 200); i++) {
    const ln = lines[i];

    // Primer comentario de bloque como proposito
    if (!meta.purpose && new RegExp("^\\\\s*\\\\/\\\\*\\\\*").test(ln)) {
      const block = [];
      for (let j = i; j < Math.min(i + 10, lines.length); j++) {
        block.push(lines[j]);
        if (new RegExp("\\\\*\\\\/").test(lines[j])) break;
      }
      const text = block.join(" ");
      const clean = text.split(" ").filter((s) => s.length > 0).join(" ").trim();
      if (clean.length > 20) meta.purpose = clean.substring(0, 280);
    }

    // Nombre de clase exportada
    const cls = ln.match(/^export\\s+(?:abstract\\s+)?class\\s+(\\w+)/);
    if (cls) meta.className = cls[1];

    // Dependencias via constructor
    const ctor = ln.match(/constructor\\s*\\(([^)]*)\\)/);
    if (ctor) {
      const params = ctor[1].split(",").map((p) => p.trim()).filter(Boolean);
      for (const p of params) {
        const parts = p.split(/[:\\s]+/);
        const name = parts[0].replace(/^(private|readonly|public|protected)/, "").trim();
        const type = parts.slice(1).join(":").trim();
        if (name && type) meta.deps.push({ name, type });
      }
    }

    // Errores lanzados
    const t = ln.match(/throw\\s+new\\s+(\\w+)/);
    if (t && meta.throws.indexOf(t[1]) === -1) meta.throws.push(t[1]);
  }
  return meta;
}

function generateContext(filePath) {
  const meta = extractMetadata(filePath);
  const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
  const md = [];
  md.push("<!-- Auto-generado por scripts/generate-llm-context.js -->");
  md.push("<!-- Editar el archivo fuente y regenerar con: npm run docs:context -->", "");
  md.push("# " + rel, "");
  md.push("## Proposito", "");
  md.push(meta.purpose || "(Sin descripcion JSDoc. Agregar /** ... */ en el archivo fuente.)", "");
  if (meta.className) {
    md.push("## Clase principal", "");
    md.push("- **" + meta.className + "**", "");
  }
  if (meta.deps.length > 0) {
    md.push("## Dependencias inyectadas (DI)", "");
    for (const d of meta.deps) {
      md.push("- " + d.name + ": " + d.type);
    }
    md.push("");
  }
  if (meta.throws.length > 0) {
    md.push("## Errores tipicos lanzados", "");
    for (const t of meta.throws) md.push("- " + t);
    md.push("");
  }
  md.push("## Convenciones del archivo", "");
  md.push("- Sigue Repository Pattern (cuando aplica)");
  md.push("- Errores via HttpError (@common/common) o excepciones NestJS", "");
  md.push("---");
  md.push("_Generado: " + new Date().toISOString() + "_");
  return md.join("\n");
}
function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const target = args.find((a) => !a.startsWith("--"));
  let files = [];
  if (target) {
    files = [path.resolve(ROOT, target)];
  } else {
    for (const p of SCAN_PATHS) {
      const found = findTsFiles(path.join(ROOT, p));
      for (const f of found) files.push(f);
    }
  }
  let created = 0, skipped = 0;
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const ctxPath = f.replace(/\.ts$/, ".llm-context.md");
    if (!force && fs.existsSync(ctxPath)) {
      const srcStat = fs.statSync(f);
      const ctxStat = fs.statSync(ctxPath);
      if (ctxStat.mtimeMs >= srcStat.mtimeMs) { skipped++; continue; }
    }
    const content = generateContext(f);
    fs.writeFileSync(ctxPath, content, "utf8");
    created++;
  }
  console.log("Generados: " + created + " | Saltados: " + skipped + " | Total: " + files.length);
}

main();
