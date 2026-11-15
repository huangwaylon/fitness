// scripts/food-data.ts runs on node alone (kalori-scrape.yml's update-merge: no npm, only app/scripts and lib/food
// checked out): its import closure is node: modules and relative files within those two folders. In lib/food, so
// update-build's own test run (src/lib/food) has it too.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const APP = resolve(import.meta.dirname, '../../..');
const FOOD = import.meta.dirname;
const fileOf = (p: string): string => [p, `${p}.ts`, join(p, 'index.ts')].find((c) => existsSync(c) && statSync(c).isFile()) ?? p;

describe('scripts/food-data.ts runs with node alone', () => {
  it('imports only node: modules and relative files within app/scripts and lib/food', () => {
    const seen = new Set<string>();
    const bad: string[] = [];
    const todo = [join(APP, 'scripts/food-data.ts')];
    while (todo.length) {
      const f = todo.pop()!;
      if (seen.has(f)) continue;
      seen.add(f);
      for (const [, spec] of readFileSync(f, 'utf8').matchAll(/(?<![\w'".-])(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)) {
        if (spec.startsWith('node:')) continue;
        const target = spec.startsWith('.') ? fileOf(resolve(dirname(f), spec)) : '';
        if (!target || !(target.startsWith(join(APP, 'scripts/')) || target.startsWith(`${FOOD}/`))) bad.push(`${relative(APP, f)}: ${spec}`);
        else todo.push(target);
      }
    }
    expect(seen.size).toBeGreaterThan(3); // the scan followed db.ts, search.ts, jan.ts
    expect(bad).toEqual([]);
  });
});
