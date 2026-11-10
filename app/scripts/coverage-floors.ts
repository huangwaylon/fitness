// The unit tests' per-file line coverage floors (docs/ops/testing.md "CI"): every file under the record's and the
// sync's code (contract/, sync/) and store/actions.ts at FLOOR % or more, but the ones listed below, each at its own
// floor (a ratchet: raise it as tests come, never lower it). Reads vitest's coverage/coverage-summary.json.
//
//   npm run coverage      vitest with coverage, then this: red on a file under its floor; a floor 5 points under its
//                         file's coverage is named, to raise
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const FLOOR = 85;
const SCOPE = /^src\/lib\/(contract|sync)\/[^/]+\.ts$|^src\/lib\/store\/actions\.ts$/;
/** below FLOOR today (2026-11-10): their own floors, the next to test */
export const RATCHET: Record<string, number> = {
  'src/lib/sync/live-local.ts': 77,
  'src/lib/contract/ticket.ts': 80,
  'src/lib/store/actions.ts': 79
};

type Summary = Record<string, { lines: { pct: number; total: number } }>;
/** the files under their floor, and the floors to raise */
export function floors(summary: Summary): { under: string[]; raise: string[] } {
  const under: string[] = [], raise: string[] = [];
  for (const [abs, v] of Object.entries(summary)) {
    const f = abs.replace(/^.*?\/app\//, '');
    if (!SCOPE.test(f)) continue;
    const floor = RATCHET[f] ?? FLOOR, pct = v.lines.total ? v.lines.pct : 100;
    if (pct < floor) under.push(`${f}: ${pct.toFixed(1)} % of lines, under its floor ${floor} %`);
    else if (f in RATCHET && pct >= floor + 5) raise.push(`${f}: ${pct.toFixed(1)} %, its floor ${floor} %: raise it (scripts/coverage-floors.ts RATCHET)`);
  }
  return { under, raise };
}

if (import.meta.main) {
  const { under, raise } = floors(JSON.parse(readFileSync(join(import.meta.dirname, '..', 'coverage', 'coverage-summary.json'), 'utf8')) as Summary);
  for (const l of raise) console.log(`raise: ${l}`);
  for (const l of under) console.error(`::error title=Coverage floor::${l}`);
  console.log(under.length ? `coverage: ${under.length} file(s) under their floor` : `coverage: every file at its floor (${FLOOR} %, or its ratchet's)`);
  process.exit(under.length ? 1 : 0);
}
