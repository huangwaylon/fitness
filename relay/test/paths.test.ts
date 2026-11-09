// relay.yml's path filter covers every app/ file the relay's code and tests import, however deep: a change to one of
// them runs the relay's checks (a file outside the filter once skipped them: random.ts, types.ts).
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');

/** The app/ files reached from relay/src and relay/test through relative imports. */
function appClosure(): string[] {
  const queue: string[] = [];
  const walk = (d: string) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (f.endsWith('.ts')) queue.push(p);
    }
  };
  walk(join(root, 'relay/src'));
  walk(join(root, 'relay/test'));
  const seen = new Set<string>();
  const app = new Set<string>();
  while (queue.length) {
    const f = queue.pop()!;
    if (seen.has(f)) continue;
    seen.add(f);
    for (const m of readFileSync(f, 'utf8').matchAll(/(?:from|import)\s*\(?\s*'(\.[^']+)'/g)) {
      const p = resolve(dirname(f), m[1]);
      if (!existsSync(p) || statSync(p).isDirectory()) continue;
      const rel = relative(root, p);
      if (rel.startsWith('app/')) app.add(rel);
      if (p.endsWith('.ts')) queue.push(p);
    }
  }
  return [...app].sort();
}

/** relay.yml's push paths. */
function filter(): string[] {
  const yml = readFileSync(join(root, '.github/workflows/relay.yml'), 'utf8');
  const line = /push:\s*\n\s*branches:.*\n\s*paths:\s*\[(.*)\]/.exec(yml)![1];
  return [...line.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

const covers = (pattern: string, file: string) =>
  pattern.endsWith('/**') ? file.startsWith(pattern.slice(0, -2)) : file === pattern;

describe("relay.yml's path filter", () => {
  it('covers every app/ file the relay imports, and names no file that is gone', () => {
    const paths = filter();
    const closure = appClosure();
    expect(closure.length).toBeGreaterThan(10);
    expect(closure.filter((f) => !paths.some((p) => covers(p, f)))).toEqual([]);
    expect(paths.filter((p) => !p.endsWith('/**') && !existsSync(join(root, p)))).toEqual([]);
    // the pull_request filter is the same list
    const yml = readFileSync(join(root, '.github/workflows/relay.yml'), 'utf8');
    expect(/pull_request:\s*\n\s*paths:\s*\[(.*)\]/.exec(yml)![1]).toBe(/push:\s*\n\s*branches:.*\n\s*paths:\s*\[(.*)\]/.exec(yml)![1]);
  });
});
