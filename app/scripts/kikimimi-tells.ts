// ききみみ: the answer-choice tells (src/lib/kikimimi/tells.ts, docs/curriculum.md "Choice tells"), for a writer: each level's
// shares, and with a group (L4, units) or a file name (bank4.ts, fd-order.yaml) the sets that carry a tell, the right
// choice marked *, each choice's length and the clip words it echoes. tells.test holds the levels to the limits.
//   npm run kikimimi:tells -- [L4 | units | <file>]
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { choiceSets } from '../src/lib/kikimimi/compile.ts';
import { contentWords, echoOf, tellReport, tellsOf } from '../src/lib/kikimimi/tells.ts';

const KIKI = join(import.meta.dirname, '../src/lib/kikimimi');
/** Where a bank item is written (its id quoted in a source file). */
function fileOf(id: string): string {
  for (const dir of [KIKI, join(KIKI, 'content')])
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts')))
      if (readFileSync(join(dir, f), 'utf8').includes(`'${id}'`)) return f;
  return '?';
}

const sets = choiceSets(), want = process.argv[2];
console.log(tellReport(sets).lines.join('\n'));
if (want) {
  const mine = sets.map((s) => ({ ...s, file: s.file ?? fileOf(s.id) })).filter((s) => s.group === want || s.file === want);
  let n = 0;
  for (const s of mine) {
    const t = tellsOf(s), flags = (['longBy', 'longest', 'echoLeast'] as const).filter((k) => t[k]);
    if (!flags.length) continue;
    n++;
    const heard = contentWords(s.en);
    console.log(`\n${s.file} ${s.id} (${s.type}) [${flags.join(' ')}]`);
    s.choices.forEach((c, i) => console.log(`  ${i === s.answer ? '*' : ' '} ${String(c.length).padStart(3)} e${echoOf(c, heard)} ${c}`));
  }
  console.log(`\n${n} of ${mine.length} sets carry a tell; ${want} alone:`);
  console.log(tellReport(mine.map((s) => ({ ...s, group: want.slice(0, 6) }))).lines.slice(1, 3).join('\n'));
}
