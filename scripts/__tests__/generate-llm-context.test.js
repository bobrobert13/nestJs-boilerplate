// Tests estructurales de scripts/generate-llm-context.js
// No usa fixtures en subdirectorios; valida el output del repo real.
// Ejecutar: node scripts/__tests__/generate-llm-context.test.js

const fs = require("fs");
const path = require("path");
const child = require("child_process");

const SCRIPT = "./scripts/generate-llm-context.js";

let pass = 0, fail = 0;

function test(name, fn) {
  try { fn(); console.log("OK  " + name); pass++; }
  catch (e) { console.error("FAIL " + name + ": " + e.message); fail++; }
}

function run(args) {
  return child.execFileSync("node", [SCRIPT].concat(args), { encoding: "utf8" });
}

// Test 1: ejecutar con --help o sin args produce output con resumen
test("ejecutar sin args genera resumen de conteo", function () {
  const out = run([]);
  if (out.indexOf("Total:") === -1) throw new Error("Sin Total en output: " + out);
  if (out.indexOf("Generados:") === -1) throw new Error("Sin Generados en output");
});

// Test 2: sidecars existen en packages/*/src
test("existen .llm-context.md en packages/*/src", function () {
  const matches = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) walk(p);
      else if (name.endsWith(".llm-context.md")) matches.push(p);
    }
  }
  walk("./packages");
  if (matches.length < 50) throw new Error("Esperaba >=50 sidecars, hay " + matches.length);
});

// Test 3: cada .llm-context.md tiene las secciones esperadas
test("sidecars tienen secciones estandar", function () {
  const examples = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) walk(p);
      else if (name.endsWith(".llm-context.md")) examples.push(p);
    }
  }
  walk("./packages");
  if (examples.length === 0) throw new Error("Sin sidecars");
  const sample = fs.readFileSync(examples[0], "utf8");
  if (sample.indexOf("Proposito") === -1) throw new Error("Sin seccion Proposito en " + examples[0]);
  if (sample.indexOf("Convenciones") === -1) throw new Error("Sin Convenciones en " + examples[0]);
});

// Test 4: ejecutar --force no rompe
test("--force ejecuta sin error", function () {
  const out = run(["--force"]);
  if (out.indexOf("Total:") === -1) throw new Error("Sin Total");
});

// Test 5: ejecutar con path especifico
test("ejecutar con path especifico", function () {
  const out = run(["packages/common/src/index.ts"]);
  if (out.indexOf("Total:") === -1) throw new Error("Sin Total");
});

console.log("\\n" + pass + " pass, " + fail + " fail");
process.exit(fail > 0 ? 1 : 0);
