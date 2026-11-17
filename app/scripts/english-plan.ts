// English Study's shared plan (lib/english/plan.ts): writes plan-order.ts, the order the clips are offered in.
//   npm run english:plan            → the planned order kept, the clips added since placed after it (by ease, variety)
//   npm run english:plan -- --fresh → the whole order again from the clips (only while no one is part-way through it)
// A bank whose file has a `// A2 LATE:` line (its A2 review's verdict: little for a beginner) goes after the others.
// Prints the order: show, band, wpm, situations.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { CLIPS } from '../src/lib/english/clips/index.ts';
import { planOf } from '../src/lib/english/plan.ts';

const dir = new URL('../src/lib/english/clips/', import.meta.url);
const late = new Set(readdirSync(dir).filter((f) => f.endsWith('.ts')).flatMap((f) => {
  const src = readFileSync(new URL(f, dir), 'utf8');
  return /^\/\/ A2 LATE:/m.test(src) ? [...src.matchAll(/^\s*id: '([^']+)'/gm)].map((m) => m[1]) : [];
}));
const order = planOf(CLIPS, process.argv.includes('--fresh') ? [] : undefined, late);
writeFileSync(
  new URL('../src/lib/english/plan-order.ts', import.meta.url),
  `// English Study's plan as written (plan.ts; \`npm run english:plan\` rewrites it): the clips' ids in the order offered.
// A clip not here yet goes after these (plan.ts planOf). Generated: edit through the script.
export const PLANNED: readonly string[] = [
${order.map((c) => `  '${c.id}'`).join(',\n')}
];
`
);
for (const [i, c] of order.entries()) console.log(String(i + 1).padStart(3), c.id.padEnd(13), c.show.padEnd(20), c.band.padEnd(4), String(c.wpm).padStart(3), c.tags.join(' '));
