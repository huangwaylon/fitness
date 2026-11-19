// A data id is never a global class: Visitor once rendered `class="visitor {id}"`, so Chip's day gave the beaver's node
// theme.css's `.chip` (a 32 px cream pill by him all day) and Toast's `:root:has(.island .chip)` (the banner as low as
// for the sync chip). Visitor and guest ids go in data-visitor (Chip's is one of the global classes); the ids still
// rendered as classes (bugs: Critters, TreeShakes) must not meet one.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { BUGS } from '#lib/world/critters.ts';

const SRC = join(import.meta.dirname, '../..');

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return files(p);
    return /\.(css|svelte)$/.test(e.name) ? [p] : [];
  });
}

/** Every class a stylesheet reaches page-wide: all of styles/*.css, and what a component's :global(…) names. */
function globalClasses(): Set<string> {
  const out = new Set<string>();
  const add = (css: string) => { for (const m of css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) out.add(m[1]); };
  for (const f of files(SRC)) {
    const s = readFileSync(f, 'utf8');
    if (f.endsWith('.css')) add(s.replace(/url\([^)]*\)/g, '').replace(/\d*\.\d+/g, ''));
    else for (const m of s.matchAll(/:global\(((?:[^()]|\((?:[^()]|\([^()]*\))*\))*)\)/g)) add(m[1].replace(/\d*\.\d+/g, ''));
  }
  return out;
}

it('no bug id is a global class', () => {
  const globals = globalClasses();
  expect(globals.has('sticker')).toBe(true);
  expect(Object.keys(BUGS).filter((id) => globals.has(id))).toEqual([]);
});

it('visitor and guest ids stay out of class= (chip is a global class)', () => {
  const s = readFileSync(join(SRC, 'lib/components/island/Visitor.svelte'), 'utf8');
  expect(s).toMatch(/class="visitor"/);
  expect(s).not.toMatch(/class="[^"]*\{(shown|id)\}/);
});
