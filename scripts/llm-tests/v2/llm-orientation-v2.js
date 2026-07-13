const fs = require("fs");

const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..", "..");



function readSources(patterns) {

  const files = [];

  function walk(dir) {

    if (!fs.existsSync(dir)) return;

    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {

      const full = path.join(dir, e.name);

      if (e.isDirectory()) {

        if (["node_modules", "dist", ".git", "coverage"].includes(e.name)) continue;

        walk(full);

      } else {
        const rel = path.relative(ROOT, full).replace(/\\\\/g, "/");
        if (patterns.some((re) => re.test(full) || re.test(rel))) {
          files.push(full);
        }

    }

  }

  walk(ROOT);

  return files;

}



function readFile(file, max) {

  if (!max) max = 50000;

  try {

    const c = fs.readFileSync(file, "utf8");

    return c.length > max ? c.substring(0, max) + "...[truncated]" : c;

  } catch (e) { return ""; }

}

// 8 casos de test profundos: debugging, modificacion, onboarding, edge-cases

const TEST_CASES = [

  { id: "Q11", category: "debugging",

    question: "Si el sistema rechaza conexiones de MongoDB al arrancar (timeout 5s), que archivos debo tocar y que env vars revisar?",

    expected: ["database.service.ts", "MONGODB_URI", "serverSelectionTimeoutMS", "retry", "connectWithRetry", "maxRetries", "DatabaseService"],

    weight: 4 },

  { id: "Q12", category: "debugging",

    question: "Donde esta definido el guard que verifica JWT en cada request y como puedo marcar una ruta como publica?",

    expected: ["JwtAuthGuard", "Public", "isPublic", "jwt.strategy.ts", "passport-jwt", "@Public", "JwtStrategy"],

    weight: 5 },

  { id: "Q13", category: "modification",

    question: "Si quiero agregar un nuevo metodo de envio de email usando Resend, que interfaz y clase debo implementar?",

    expected: ["ResendService", "sendEmail", "EmailOptions", "RESEND_API_KEY", "ResendModule", "injectable"],

    weight: 4 },

  { id: "Q14", category: "onboarding",

    question: "Cual es el orden correcto para entender la arquitectura: App -> ?? -> ?? -> ??",

    expected: ["AppModule", "MongooseModule", "DatabaseModule", "Controllers", "Services", "Repository"],

    weight: 3 },

  { id: "Q15", category: "edge-case",

    question: "Que pasa si MONGODB_URI no esta definido? Como falla el sistema?",

    expected: ["fallback", "localhost", "27017", "warning", "MONGODB_URI", "default", "no crash"],

    weight: 4 },

  { id: "Q16", category: "modification",

    question: "Si quiero agregar un nuevo provider de AI (ej: Mistral), donde debo modificarlo?",

    expected: ["registerProvider", "ai.config.ts", "ai.service.ts", "chat", "providers", "AI_SERVICE"],

    weight: 3 },

  { id: "Q17", category: "debugging",

    question: "Donde esta la logica de retry de Inngest y como se activa?",

    expected: ["sendEvent", "sendEvents", "retries", "throw", "resend", "InngestService", "self-healing"],

    weight: 3 },

  { id: "Q18", category: "edge-case",

    question: "Que archivos debo crear/modificar si quiero agregar un nuevo endpoint en el modulo dynamic-schema?",

    expected: ["dynamic-schema.controller.ts", "dynamic-schema.service.ts", "@Post", "@ApiOperation", "@ApiTags"],

    weight: 4 },

];

function gatherContext(question) {

  const specs = readSources([/openspec[\\/]+specs[\\/]+.+\\.md$/]);

  const readmes = readSources([/packages[\\/]+[^\\/\\/]+[\\/]+README\\.md$/, /apps[\\/]+.+\\.md$/]);

  const contexts = readSources([/\\.llm-context\\.md$/]);

  const pkgSrc = readSources([/packages[\\/]+[^\\/]+[\\/]+src[\\/]+.+\\.ts$/]);

  const appSrc = readSources([/apps[\\/]+nominas[\\/]+src[\\/]+.+\\.ts$/]);

  let totalChars = 0;

  const sources = [];

  const files = [...specs, ...readmes, ...contexts, ...pkgSrc, ...appSrc];

  for (const f of files.slice(0, 80)) {

    const c = readFile(f, 10000);

    if (c) {

      totalChars += c.length;

      sources.push({ file: path.relative(ROOT, f), content: c, length: c.length });

    }

  }

  return { sources, totalChars };

}



function evaluateCase(testCase, ctx) {

  const allText = ctx.sources.map((s) => s.content).join("\\n");

  const lower = allText.toLowerCase();

  const foundExpected = [];

  const missingExpected = [];

  for (const exp of testCase.expected) {

    if (lower.includes(exp.toLowerCase())) {

      foundExpected.push(exp);

    } else {

      missingExpected.push(exp);

    }

  }

  const precision = (foundExpected.length / testCase.expected.length) * 100;

  return { found: foundExpected, missing: missingExpected, precision: Math.round(precision) };

}

function run() {

  console.log("============================================================");

  console.log("  LLM ORIENTATION TESTS V2 (8 casos profundos)");

  console.log("  Foco: debugging, modification, onboarding, edge-cases.");

  console.log("============================================================");

  console.log("");

  const results = [];

  let totalWeight = 0, totalWeightedScore = 0, totalCharsRead = 0, totalTimeMs = 0;

  const byCategory = {};

  for (const tc of TEST_CASES) {

    const start = Date.now();

    const ctx = gatherContext(tc.question);

    const t = Date.now() - start;

    const ev = evaluateCase(tc, ctx);

    totalCharsRead += ctx.totalChars;

    totalTimeMs += t;

    results.push({ id: tc.id, category: tc.category, question: tc.question, weight: tc.weight, precision: ev.precision, found: ev.found, missing: ev.missing, charsRead: ctx.totalChars, timeMs: t });

    totalWeight += tc.weight;

    totalWeightedScore += (ev.precision / 100) * tc.weight;

    if (!byCategory[tc.category]) byCategory[tc.category] = { correct: 0, total: 0, count: 0 };

    byCategory[tc.category].correct += (ev.precision / 100) * tc.weight;

    byCategory[tc.category].total += tc.weight;

    byCategory[tc.category].count++;

  }

  const weightedAvg = Math.round((totalWeightedScore / totalWeight) * 100);

  const simpleAvg = Math.round(results.reduce((s, r) => s + r.precision, 0) / results.length);

  console.log("# Resultados por caso:");

  for (const r of results) {

    const icon = r.precision >= 80 ? "OK" : (r.precision >= 50 ? "WARN" : "FAIL");

    console.log("  [" + r.id + "] [" + r.category + "] [" + icon + "] " + r.precision + "%");

    console.log("       Q: " + r.question);

    console.log("       Encontrado (" + r.found.length + "/" + (r.found.length + r.missing.length) + "): " + r.found.slice(0, 8).join(", "));

    if (r.missing.length > 0) console.log("       Faltante: " + r.missing.join(", "));

    console.log("");

  }

  console.log("# Resumen por Categoria:");

  for (const cat of Object.keys(byCategory)) {

    const c = byCategory[cat];

    const pct = Math.round((c.correct / c.total) * 100);

    console.log("  - " + cat + ": " + pct + "% (" + c.count + " casos, weight=" + c.total + ")");

  }

  console.log("");

  console.log("# Resumen global:");

  console.log("  - Total casos: " + results.length);

  console.log("  - Score promedio ponderado: " + weightedAvg + "%");

  console.log("  - Score promedio simple: " + simpleAvg + "%");

  console.log("  - Casos >=80%: " + results.filter((r) => r.precision >= 80).length + "/" + results.length);

  console.log("  - Casos <50%: " + results.filter((r) => r.precision < 50).length + "/" + results.length);

  console.log("");

  const inputTokens = Math.round(totalCharsRead / 4);

  const outputTokens = 1000 * results.length;

  const costGpt4 = (inputTokens / 1000000) * 5 + (outputTokens / 1000000) * 15;

  console.log("# Estimacion GPT-4o (8 runs):");

  console.log("  - Input tokens: " + inputTokens.toLocaleString());

  console.log("  - Output tokens: " + outputTokens.toLocaleString());

  console.log("  - Costo total: $" + costGpt4.toFixed(4));

  console.log("");

  console.log("# MEJORAS CRITICAS IDENTIFICADAS:");

  const allMissing = {};

  for (const r of results) {

    for (const m of r.missing) allMissing[m] = (allMissing[m] || 0) + 1;

  }

  const sortedMissing = Object.entries(allMissing).sort((a, b) => b[1] - a[1]).slice(0, 15);

  for (const [term, count] of sortedMissing) {

    if (count >= 1) console.log("  [" + count + "x] Falta documentar: " + term);

  }

  console.log("");

  const md = [];

  md.push("# LLM Orientation Tests V2 (Deep)");

  md.push("");

  md.push("> Self-evaluation V2: 8 casos cubriendo debugging, modification, onboarding y edge-cases.");

  md.push("");

  md.push("## Resumen");

  md.push("");

  md.push("| Metrica | Valor |");

  md.push("|---------|-------|");

  md.push("| Score promedio ponderado | **" + weightedAvg + "%** |");

  md.push("| Score promedio simple | " + simpleAvg + "% |");

  md.push("");

  md.push("## Score por Categoria");

  md.push("");

  for (const cat of Object.keys(byCategory)) {

    const c = byCategory[cat];

    const pct = Math.round((c.correct / c.total) * 100);

    md.push("- **" + cat + "**: " + pct + "% (" + c.count + " casos)");

  }

  md.push("");

  md.push("## Resultados Detallados");

  md.push("");

  md.push("| ID | Categoria | Precision | Faltantes Principales |");

  md.push("|----|-----------|-----------|------------------------|");

  for (const r of results) {

    const faltantes = r.missing.join(", ").substring(0, 80);

    md.push("| " + r.id + " | " + r.category + " | " + r.precision + "% | " + faltantes + " |");

  }

  md.push("");

  md.push("## Top Terminos Faltantes");

  md.push("");

  for (const [term, count] of sortedMissing) {

    if (count >= 1) md.push("- **" + term + "** (faltante en " + count + " preguntas)");

  }

  md.push("");

  md.push("_Generado: " + new Date().toISOString() + "_");

  fs.writeFileSync(path.join(ROOT, "docs", "LLM-TEST-RESULTS-V2.md"), md.join("\\n"), "utf8");

  console.log("[OK] Reporte guardado en docs/LLM-TEST-RESULTS-V2.md");

}



run();




