// Export N variants of every template and drill as JSON lines, using the exact code the
// app runs. Usage: node tools/export-variants.js [N] > variants.jsonl
const path = require('path');
for (const f of ['content.js', 'engine.js', 'templates-a.js', 'templates-b.js', 'drills.js']) require(path.join(__dirname, '..', 'js', f));
const FE = globalThis.FE;
const N = +(process.argv[2] || 300);
const out = process.stdout;
for (const t of [...FE.TEMPLATES, ...FE.DRILLS]) {
  for (let i = 0; i < N; i++) {
    const seed = (Math.imul(i + 1, 2654435761) ^ 0x9e3779b9) >>> 0;
    let v;
    try {
      v = FE.makeVariant(t, seed);
    } catch (e) {
      out.write(JSON.stringify({ tid: t.id, kind: t.kind || 'gen', error: e.message, seed }) + '\n');
      continue;
    }
    out.write(JSON.stringify({
      tid: t.id, kind: t.kind || 'gen', seed: v.seed, type: v.type, params: v.params, ans: v.ans,
      choices: v.choices.map((c) => ({ v: c.v, label: c.label })), correct: v.correct,
      tol: t.tol || null, sep: (v.sep) || null,
    }) + '\n');
  }
}
