// Tests para scripts/audit-docs.js
// Valida la estructura del output contra el repo real (no usa fixtures).
// Ejecutar: node scripts/__tests__/audit-docs.test.js

const child = require("child_process");
const SCRIPT = "./scripts/audit-docs.js";

let pass = 0, fail = 0;

function test(name, fn) {
  try {
    fn();
    console.log("OK  " + name);
    pass++;
  } catch (e) {
    console.error("FAIL " + name + ": " + e.message);
    fail++;
  }
}

function run(args) {
  return child.execFileSync("node", [SCRIPT].concat(args), { encoding: "utf8" });
}

function runExit(args) {
  try {
    child.execFileSync("node", [SCRIPT].concat(args), { encoding: "utf8" });
    return 0;
  } catch (e) {
    return e.status;
  }
}

// Test 1: --json produce JSON valido con la estructura correcta
test("--json produce JSON valido con estructura correcta", function () {
  const out = run(["--json"]);
  const data = JSON.parse(out);
  if (typeof data.globalMethodCoverage !== "number") throw new Error("Falta globalMethodCoverage");
  if (typeof data.globalFileCoverage !== "number") throw new Error("Falta globalFileCoverage");
  if (data.threshold !== 80) throw new Error("Threshold esperaba 80, got " + data.threshold);
  if (typeof data.passed !== "boolean") throw new Error("Falta passed");
  if (!Array.isArray(data.packages)) throw new Error("packages no es array");
});

// Test 2: --strict retorna exit 1 cuando coverage <80%
test("--strict retorna exit 1 cuando coverage <80%", function () {
  const code = runExit(["--strict"]);
  if (code !== 1) throw new Error("Expected exit 1, got " + code);
});

// Test 3: SIN --strict retorna exit 0
test("sin --strict retorna exit 0", function () {
  const code = runExit([]);
  if (code !== 0) throw new Error("Expected exit 0, got " + code);
});

// Test 4: incluye todos los packages del repo
test("detecta packages principales del repo", function () {
  const data = JSON.parse(run(["--json"]));
  const names = data.packages.map(function (p) { return p.name; });
  const expected = ["ai", "auth", "common", "database", "documents", "http", "inngest", "playwright", "resend", "serve-static"];
  for (const n of expected) {
    if (names.indexOf(n) === -1) throw new Error("No detecto " + n);
  }
});

// Test 5: cada package tiene shape correcto
test("cada package tiene name/fileCoverage/methodCoverage/files/methods", function () {
  const data = JSON.parse(run(["--json"]));
  for (const p of data.packages) {
    if (typeof p.name !== "string") throw new Error("Falta name en " + JSON.stringify(p));
    if (typeof p.fileCoverage !== "number") throw new Error("Falta fileCoverage en " + p.name);
    if (typeof p.methodCoverage !== "number") throw new Error("Falta methodCoverage en " + p.name);
    if (typeof p.files !== "number") throw new Error("Falta files en " + p.name);
    if (typeof p.methods !== "number") throw new Error("Falta methods en " + p.name);
  }
});

// Test 6: output markdown contiene secciones esperadas
test("output markdown contiene secciones esperadas", function () {
  const out = run([]);
  if (out.indexOf("Documentation Coverage Report") === -1) throw new Error("Falta titulo");
  if (out.indexOf("Global Method Coverage") === -1) throw new Error("Falta global");
  if (out.indexOf("Threshold") === -1) throw new Error("Falta threshold");
  if (out.indexOf("Por Paquete") === -1) throw new Error("Falta seccion paquetes");
});

// Test 7: --write crea/actualiza docs/COVERAGE.md
test("--write crea docs/COVERAGE.md", function () {
  run(["--write"]);
  const fs = require("fs");
  if (!fs.existsSync("./docs/COVERAGE.md")) throw new Error("No creo docs/COVERAGE.md");
});

// Test 8: pasa=false al inicio (todos en 0%)
test("pasa=false cuando coverage global <80%", function () {
  const data = JSON.parse(run(["--json"]));
  if (data.passed) throw new Error("Esperaba passed=false (coverage 0%)");
});

console.log("\\n" + pass + " pass, " + fail + " fail");
process.exit(fail > 0 ? 1 : 0);
