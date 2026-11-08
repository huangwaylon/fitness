// Every lazily loaded part of a sheet goes through <Lazy> (ui/Lazy.svelte): a bare `{#await import()}` skips reload.ts's
// stale-build recovery and, with no {:catch}, leaves its slot blank for good when the chunk fails (after a deploy, offline).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(import.meta.dirname, '../../..');
function svelteFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? svelteFiles(p) : n.endsWith('.svelte') ? [p] : [];
  });
}

describe('lazy chunks', () => {
  it('no bare {#await import()}: every one is a <Lazy>', () => {
    const bad = [...svelteFiles(join(SRC, 'lib')), ...svelteFiles(join(SRC, 'routes'))]
      .filter((f) => /\{#await\s+import\(/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(SRC, f));
    expect(bad).toEqual([]);
  });
});
