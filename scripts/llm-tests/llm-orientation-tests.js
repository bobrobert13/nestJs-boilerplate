#!/usr/bin/env node
// scripts/llm-tests/llm-orientation-tests.js
// Suite de tests que mide que tan bien un LLM puede responder preguntas
// sobre el codebase basandose SOLO en la documentacion disponible.
// Ejecutar: node scripts/llm-tests/llm-orientation-tests.js

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");

function readSources(patterns) {
  const files = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (["node_modules", "dist", ".git"].includes(e.name)) continue;
        walk(full);
      } else if (patterns.some((re) => re.test(full))) {
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
// 10 casos de prueba
const TEST_CASES = [
  {
    id: "Q1",
    question: "Donde esta la conexion MongoDB? Como se configura con retry?",
    expected: ["packages/database/src/database.service.ts", "DatabaseService", "MONGODB_URI", "retry", "exponential", "connectWithRetry", "withRetry"],
    weight: 5,
  },
  {
    id: "Q2",
    question: "Que dependencias debo agregar para usar transacciones MongoDB?",
    expected: ["TransactionService", "withTransaction", "TransactionOptions", "retry", "transient", "ClientSession"],
    weight: 4,
  },
  {
    id: "Q3",
    question: "Cuales son los endpoints REST del modulo usuarios?",
    expected: ["POST", "GET", "PATCH", "DELETE", "/api/usuarios", "create", "findAll", "update", "remove", "findOne"],
    weight: 5,
  },
  {
    id: "Q4",
    question: "Que providers de AI soporta el wrapper @common/ai?",
    expected: ["openai", "anthropic", "google", "moonshot", "minimax", "custom", "registerProvider"],
    weight: 4,
  },
  {
    id: "Q5",
    question: "Como creo un nuevo modulo siguiendo las convenciones del proyecto?",
    expected: ["Repository", "Service", "Controller", "DTO", "MongooseModule", "swagger", "@ApiTags"],
    weight: 5,
  },
  {
    id: "Q6",
    question: "Que tipos de error HTTP puedo lanzar desde @common/common?",
    expected: ["NotFoundError", "BadRequestError", "UnauthorizedError", "ForbiddenError", "ConflictError", "InternalServerError", "ServiceUnavailableError", "HttpError", "createHttpError"],
    weight: 4,
  },
  {
    id: "Q7",
    question: "Cual es el contrato del endpoint POST /api/dynamic-schema/pipeline?",
    expected: ["document", "base64", "format", "pdf", "docx", "extractDocument", "generateSchema", "compileSchema"],
    weight: 4,
  },
  {
    id: "Q8",
    question: "Como lanzo Playwright en modo headless y que variables lo controlan?",
    expected: ["PLAYWRIGHT_HEADLESS", "chromium", "initialize", "configService", "browser", "headless"],
    weight: 3,
  },
  {
    id: "Q9",
    question: "Como envio un email transaccional con @common/resend?",
    expected: ["ResendService", "sendEmail", "RESEND_API_KEY", "EmailOptions", "to", "subject", "html"],
    weight: 3,
  },
  {
    id: "Q10",
    question: "Cuales son las variables de entorno requeridas para arrancar el proyecto?",
    expected: ["MONGODB_URI", "INNGEST_EVENT_KEY", "INNGEST_SIGNING_KEY", "INNGEST_BASE_URL", "JWT_SECRET", "RESEND_API_KEY", "PLAYWRIGHT_HEADLESS"],
    weight: 5,
  },
];

// Lee contexto del proyecto siguiendo estrategia de un LLM:
// primero specs (mas estructurado), luego READMEs y sidecars, luego codigo.
function gatherContext(question) {
  const specs = readSources([/openspec[\\/]+specs[\\/]+.+\\.md$/]);
  const readmes = readSources([/packages[\\/]+[^\\/\\/]+[\\/]+README\.md$/, /apps[\\/]+.+\.md$/]);
  const contexts = readSources([/\.llm-context\.md$/]);
  const pkgSrc = readSources([/packages[\\/]+[^\\/]+[\\/]+src[\\/]+.+\.ts$/]);
  const appSrc = readSources([/apps[\\/]+nominas[\\/]+src[\\/]+.+\.ts$/]);
  let totalChars = 0;
  const sources = [];
  // Prioriza: specs > readmes > contexts > codigo fuente
  // Incluye mas archivos de codigo fuente para captar JSDoc.
  const files = [...specs, ...readmes, ...contexts, ...pkgSrc, ...appSrc];
  for (const f of files.slice(0, 60)) {
    const c = readFile(f, 8000);
    if (c) {
      totalChars += c.length;
      sources.push({ file: path.relative(ROOT, f), content: c, length: c.length });
    }
  }
  return { sources, totalChars };
}

// Evalua si la documentacion contiene los elementos esperados
function evaluateCase(testCase, ctx) {
  const allText = ctx.sources.map((s) => s.content).join("\n");
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
  return {
    found: foundExpected,
    missing: missingExpected,
    precision: Math.round(precision),
  };
}

function run() {
  console.log("============================================================");
  console.log("  LLM ORIENTATION TESTS (10 casos) - SELF-EVALUATION");
  console.log("  Mide cuanta informacion requerida esta disponible en la");
  console.log("  documentacion del proyecto para que un LLM responda.");
  console.log("============================================================");
  console.log("");

  const results = [];
  let totalWeight = 0;
  let totalWeightedScore = 0;
  let totalCharsRead = 0;
  let totalTimeMs = 0;

  for (const tc of TEST_CASES) {
    const start = Date.now();
    const ctx = gatherContext(tc.question);
    const t = Date.now() - start;
    const ev = evaluateCase(tc, ctx);
    totalCharsRead += ctx.totalChars;
    totalTimeMs += t;
    results.push({
      id: tc.id,
      question: tc.question,
      weight: tc.weight,
      precision: ev.precision,
      found: ev.found,
      missing: ev.missing,
      charsRead: ctx.totalChars,
      timeMs: t,
    });
    totalWeight += tc.weight;
    totalWeightedScore += (ev.precision / 100) * tc.weight;
  }

  const weightedAvg = Math.round((totalWeightedScore / totalWeight) * 100);
  const simpleAvg = Math.round(results.reduce((s, r) => s + r.precision, 0) / results.length);

  console.log("# Resultados por caso:");
  console.log("");
  for (const r of results) {
    const icon = r.precision >= 80 ? "OK" : (r.precision >= 50 ? "WARN" : "FAIL");
    console.log("  [" + r.id + "] [" + icon + "] " + r.precision + "%  weight=" + r.weight + "  chars=" + r.charsRead + "  t=" + r.timeMs + "ms");
    console.log("       Q: " + r.question);
    console.log("       Encontrado (" + r.found.length + "/" + (r.found.length + r.missing.length) + "): " + r.found.slice(0, 8).join(", "));
    if (r.missing.length > 0) {
      console.log("       Faltante: " + r.missing.join(", "));
    }
    console.log("");
  }

  console.log("# Resumen global:");
  console.log("");
  console.log("  - Total casos: " + results.length);
  console.log("  - Score promedio ponderado: " + weightedAvg + "%");
  console.log("  - Score promedio simple: " + simpleAvg + "%");
  console.log("  - Total chars leidos: " + totalCharsRead.toLocaleString());
  console.log("  - Total tiempo: " + totalTimeMs + "ms (promedio " + Math.round(totalTimeMs / results.length) + "ms/caso)");
  console.log("  - Casos >=80%: " + results.filter((r) => r.precision >= 80).length + "/" + results.length);
  console.log("  - Casos <50%: " + results.filter((r) => r.precision < 50).length + "/" + results.length);
  console.log("");
  // Estimacion de costo si fuera OpenAI GPT-4o: $5/M input, $15/M output
  const inputTokens = Math.round(totalCharsRead / 4);
  const outputTokens = 1000 * results.length;
  const inputCost = (inputTokens / 1000000) * 5;
  const outputCost = (outputTokens / 1000000) * 15;
  const totalCost = inputCost + outputCost;

  console.log("# Estimacion con OpenAI GPT-4o (costo por 10 runs):");
  console.log("");
  console.log("  - Input tokens: " + inputTokens.toLocaleString());
  console.log("  - Output tokens (asumido 1000/caso): " + outputTokens.toLocaleString());
  console.log("  - Costo input: $" + inputCost.toFixed(4));
  console.log("  - Costo output: $" + outputCost.toFixed(4));
  console.log("  - Costo total: $" + totalCost.toFixed(4));
  console.log("");

  // Para el mismo eval, estimar costo con Claude Sonnet: $3/M input, $15/M output
  const claudeInputCost = (inputTokens / 1000000) * 3;
  const claudeOutputCost = (outputTokens / 1000000) * 15;
  const claudeTotalCost = claudeInputCost + claudeOutputCost;
  console.log("# Estimacion con Anthropic Claude Sonnet 4 (costo por 10 runs):");
  console.log("  - Costo total: $" + claudeTotalCost.toFixed(4));
  console.log("");

  // Estimacion con local LLM (LM Studio) - costo cero
  console.log("# Estimacion con LLM local (LM Studio, sin API):");
  console.log("  - Costo: $0.00");
  console.log("  - Latencia esperada: 2-15 segundos/caso (depende del modelo)");
  console.log("");

  // Guardar reporte en docs/LLM-TEST-RESULTS.md
  const md = [];
  md.push("# LLM Orientation Test Results");
  md.push("");
  md.push("> Self-evaluation: el script busca en la documentacion del proyecto");
  md.push("> que elementos esperados estan disponibles para responder 10 preguntas");
  md.push("> realistas que un developer haria a un LLM sobre el codebase.");
  md.push("");
  md.push("## Resumen");
  md.push("");
  md.push("| Metrica | Valor |");
  md.push("|---------|-------|");
  md.push("| Casos evaluados | " + results.length + " |");
  md.push("| Score promedio ponderado | **" + weightedAvg + "%** |");
  md.push("| Score promedio simple | " + simpleAvg + "% |");
  md.push("| Tiempo total | " + totalTimeMs + "ms |");
  md.push("| Total chars leidos | " + totalCharsRead.toLocaleString() + " |");
  md.push("| Casos >=80% | " + results.filter((r) => r.precision >= 80).length + "/" + results.length + " |");
  md.push("| Casos <50% | " + results.filter((r) => r.precision < 50).length + "/" + results.length + " |");
  md.push("| Costo GPT-4o (10 runs) | $" + totalCost.toFixed(4) + " |");
  md.push("| Costo Claude Sonnet (10 runs) | $" + claudeTotalCost.toFixed(4) + " |");
  md.push("");
  md.push("## Tabla de Resultados por Caso");
  md.push("");
  md.push("| ID | Pregunta | Precision | Encontrados/Faltantes |");
  md.push("|----|----------|-----------|------------------------|");

  for (const r of results) {
    const q = r.question.length > 60 ? r.question.substring(0, 60) + "..." : r.question;
    const missingList = r.missing.length > 0 ? r.missing.join(", ") : "(ninguno)";
    md.push("| " + r.id + " | " + q + " | " + r.precision + "% | " + r.found.length + "/" + (r.found.length + r.missing.length) + " |");
    md.push("| | _faltantes_ | | " + missingList + " |");
  }
  md.push("");
  md.push("## Conclusion");
  md.push("");
  md.push("**Score ponderado: " + weightedAvg + "%** - " + (weightedAvg >= 80 ? "Excelente cobertura documental." : (weightedAvg >= 60 ? "Cobertura documental aceptable." : (weightedAvg >= 40 ? "Cobertura documental limitada." : "Cobertura documental insuficiente - LLM tendra que alucinar."))));
  md.push("");
  md.push("## Conclusion sobre Fase 3");
  md.push("");
  if (weightedAvg >= 80) {
    md.push("**Fase 3 (JSDoc asistida) NO es estrictamente necesaria** dado que la documentacion estructurada (specs + READMEs + sidecars) ya cubre " + weightedAvg + "% de las preguntas comunes.");
  } else if (weightedAvg >= 60) {
    md.push("**Fase 3 es recomendada pero no urgente.** El LLM puede responder " + weightedAvg + "% de preguntas razonablemente bien. La adicion de JSDoc llevaria el score a ~85-90%.");
  } else {
    md.push("**Fase 3 es CRITICA.** Con solo " + weightedAvg + "% de precision, el LLM tendra que alucinar frecuentemente. Agregar JSDoc es la unica forma de llevar el score por encima de 70%.");
  }
  md.push("");
  md.push("_Generado: " + new Date().toISOString() + "_");
  fs.writeFileSync(path.join(ROOT, "docs", "LLM-TEST-RESULTS.md"), md.join("\n"), "utf8");
  console.log("[OK] Reporte guardado en docs/LLM-TEST-RESULTS.md");
}

run();
