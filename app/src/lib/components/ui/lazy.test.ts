// Every lazily loaded part of a sheet goes through <Lazy> (ui/Lazy.svelte): a bare `{#await}` of a chunk skips reload.ts's
// stale-build recovery and, with no {:catch}, leaves its slot blank for good when the chunk fails (after a deploy, offline):
// an `{#await import()}`, a loader's promise (`{#await loadPanel()}`), one kept in a map, all alike.
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

/** The `{#await}` blocks of a file with no `{:catch}` of their own (nested blocks skipped over), by line. */
function uncaught(src: string): number[] {
  const out: number[] = [];
  const tags = [...src.matchAll(/\{(#await|:catch|\/await)\b/g)];
  const open: { line: number; caught: boolean }[] = [];
  for (const m of tags) {
    if (m[1] === '#await') open.push({ line: src.slice(0, m.index).split('\n').length, caught: false });
    else if (m[1] === ':catch' && open.length) open[open.length - 1].caught = true;
    else if (m[1] === '/await') {
      const b = open.pop();
      if (b && !b.caught) out.push(b.line);
    }
  }
  return out;
}

describe('lazy chunks', () => {
  it('finds an {#await} without its own {:catch}, however its promise is made', () => {
    expect(uncaught('{#await import("./X.svelte") then m}<m.default />{/await}')).toEqual([1]);
    expect(uncaught('a\n{#await loadPanel() then { default: P }}<P />{/await}')).toEqual([2]);
    expect(uncaught('{#await view then { default: V }}\n{#await x}{:then}{:catch}{/await}\n{/await}')).toEqual([1]);
    expect(uncaught('{#await p then v}{v}{:catch e}{e}{/await}')).toEqual([]);
  });
  it('no {#await} without a {:catch} outside Lazy.svelte: every chunk is a <Lazy>', () => {
    const bad = [...svelteFiles(join(SRC, 'lib')), ...svelteFiles(join(SRC, 'routes'))]
      .filter((f) => !f.endsWith('/ui/Lazy.svelte'))
      .flatMap((f) => uncaught(readFileSync(f, 'utf8')).map((line) => `${relative(SRC, f)}:${line}`));
    expect(bad).toEqual([]);
  });
});
