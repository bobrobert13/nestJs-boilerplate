// Bulk-add minimal JSDoc stubs to public methods. Inserts IMMEDIATELY
// above the first decorator of each public method.
//
// Strategy: find each `export class Foo {` and the matching `}`. Then walk
// methods inside that range only.
const fs = require('node:fs');
const path = require('node:path');

const targets = process.argv.slice(2);
let totalAdded = 0;

function findClassRanges(lines) {
  // Returns array of [start, end] line indexes (inclusive) for each
  // `export class` body.
  const ranges = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*(export\s+)?(abstract\s+)?class\s+\w+/.test(lines[i])) {
      // Find matching close brace
      let depth = 0;
      let j = i;
      let seenOpen = false;
      for (; j < lines.length; j++) {
        for (const ch of lines[j]) {
          if (ch === '{') { depth++; seenOpen = true; }
          else if (ch === '}') depth--;
        }
        if (seenOpen && depth === 0) break;
      }
      ranges.push([i, j]);
    }
  }
  return ranges;
}

for (const file of targets) {
  if (!fs.existsSync(file)) { console.error('Missing:', file); continue; }
  const orig = fs.readFileSync(file, 'utf8');
  const lines = orig.split(/\r?\n/);
  const out = [...lines];
  const ranges = findClassRanges(lines);
  let added = 0;

  for (const [start, end] of ranges) {
    for (let i = end - 1; i > start; i--) {
      const line = lines[i];
      const m = line.match(/^(\s*)(?:async\s+)?([a-zA-Z_]\w*)\s*\(/);
      if (!m) continue;
      if (m[2] === 'constructor') continue;
      if (['describe','it','test','beforeEach','afterEach','beforeAll','afterAll'].includes(m[2])) continue;
      if (/^\s*private\b/.test(line)) continue;
      if (/^\s*protected\b/.test(line)) continue;

      // Find the topmost decorator line above this method, then insert
      // JSDoc immediately above it. Track brace depth so multi-line
      // decorator arguments (e.g. `@ApiOperation({ ... })`) are treated
      // as one decorator block.
      let cursor = i - 1;
      // Skip blank lines and look for the line that contains "@"
      // (the topmost decorator on this method).
      let firstDecLine = -1;
      let depth = 0;
      while (cursor > start) {
        const l = lines[cursor];
        if (l.trim() === '') { cursor--; continue; }
        // Count braces on the line, walking backwards conceptually
        for (const ch of l) {
          if (ch === '}') depth++;
          else if (ch === '{') depth--;
        }
        if (depth > 0) { cursor--; continue; }
        if (/^\s*\/\*\*?/.test(l)) {
          firstDecLine = -2; // JSDoc already present
          break;
        }
        if (/^\s*@\w+/.test(l)) {
          firstDecLine = cursor;
          cursor--;
          // continue walking up to find the topmost decorator
          depth = 0;
          continue;
        }
        break;
      }
      if (firstDecLine > 0) {
        const l = lines[firstDecLine];
        const indent = (l.match(/^(\s*)/) || [, ''])[1];
        const stub = `${indent}/** ${m[2]} (see class JSDoc for context). */`;
        out.splice(firstDecLine, 0, stub);
        added++;
      }
    }
  }
  if (added > 0) {
    fs.writeFileSync(file, out.join('\n'), 'utf8');
    console.log(`+${added} ${path.relative(process.cwd(), file)}`);
    totalAdded += added;
  } else {
    console.log(`=0 ${path.relative(process.cwd(), file)}`);
  }
}
console.log(`Total stubs added: ${totalAdded}`);
