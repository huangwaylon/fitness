// English Study's shared plan (lib/english/plan.ts): writes plan-order.ts, the order the clips are offered in.
//   npm run english:plan            → the planned order kept, the clips added since placed after it (by ease, variety)
//   npm run english:plan -- --fresh → the whole order again from the clips (only while no one is part-way through it)
// Prints the order: show, band, wpm, situations.
import { writeFileSync } from 'node:fs';
import { CLIPS } from '../src/lib/english/clips/index.ts';
import { showOf } from '../src/lib/english/catalog.ts';
import { planOf } from '../src/lib/english/plan.ts';

const order = process.argv.includes('--fresh') ? planOf(CLIPS, []) : planOf(CLIPS);
writeFileSync(
  new URL('../src/lib/english/plan-order.ts', import.meta.url),
  `// English Study's plan as written (plan.ts; \`npm run english:plan\` rewrites it): the clips' ids in the order offered.
// A clip not here yet goes after these (plan.ts planOf). Generated: edit through the script.
export const PLANNED: readonly string[] = [
${order.map((c) => `  '${c.id}'`).join(',\n')}
];
`
);
for (const [i, c] of order.entries()) console.log(String(i + 1).padStart(3), c.id.padEnd(13), showOf(c.credit).padEnd(10), c.band.padEnd(4), String(c.wpm).padStart(3), c.tags.join(' '));
