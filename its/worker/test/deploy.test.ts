// scripts/deploy.sh refuses a dirty tree: its `git status --porcelain --` paths cover every file the Worker bundles
// (src/index.ts's relative imports, followed), so an uncommitted change never deploys under a clean `sha`.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '..');

/** Every file reached from `entry` by relative imports (type-only too: checking more is harmless). */
function bundled(entry: string): string[] {
  const seen = new Set<string>();
  const todo = [entry];
  while (todo.length) {
    const f = todo.pop()!;
    if (seen.has(f)) continue;
    seen.add(f);
    for (const m of readFileSync(f, 'utf8').matchAll(/(?:from|import)\s*\(?\s*['"](\.[^'"]+)['"]/g)) {
      const p = resolve(dirname(f), m[1]);
      const hit = [p, `${p}.ts`, `${p}/index.ts`].find((x) => existsSync(x) && !x.endsWith('/'));
      expect(hit, `${relative(ROOT, f)} imports ${m[1]}`).toBeDefined();
      todo.push(hit!);
    }
  }
  return [...seen];
}

describe('deploy.sh’s clean-tree check', () => {
  it('covers every file the Worker bundles', () => {
    const line = readFileSync(resolve(ROOT, 'scripts/deploy.sh'), 'utf8').match(/git status --porcelain -- ([^)]+)\)/);
    expect(line).not.toBeNull();
    const paths = line![1].trim().split(/\s+/).map((p) => resolve(ROOT, p));
    const files = bundled(resolve(ROOT, 'src/index.ts'));
    expect(files.length).toBeGreaterThan(5);
    expect(files.filter((f) => !paths.some((p) => f === p || f.startsWith(`${p}/`))).map((f) => relative(ROOT, f))).toEqual([]);
  });
});
