// Every `var(--x)` with no fallback names a custom property that something in src/ defines: a declaration
// (`--x: …` in tokens.css, a <style>, a style="" or a style string in script), `style:--x`, `setProperty('--x')` or
// `@property --x`. An undefined one makes the whole declaration invalid at computed time: `animation: shift 150ms
// var(--ease)` draws no animation at all (review 11/13 B1), a mask or z-index silently drops (B2).
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { expect, it } from 'vitest';

const SRC = join(import.meta.dirname, '../..');

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return files(p);
    return /\.(css|svelte|ts|js)$/.test(e.name) && !/\.test\.ts$/.test(e.name) ? [p] : [];
  });
}

it('every var(--x) without a fallback is defined somewhere in src/', () => {
  const defined = new Set<string>();
  const uses: { at: string; name: string }[] = [];
  for (const f of files(SRC)) {
    const s = readFileSync(f, 'utf8');
    for (const m of s.matchAll(/(--[\w-]+)['"`]?\s*:/g)) defined.add(m[1]);
    for (const m of s.matchAll(/(?:setProperty\(\s*|style:|@property\s+)['"`]?(--[\w-]+)/g)) defined.add(m[1]);
    for (const m of s.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)) {
      uses.push({ at: `${relative(SRC, f)}:${s.slice(0, m.index).split('\n').length}`, name: m[1] });
    }
  }
  expect(uses.length).toBeGreaterThan(1000);
  expect(uses.filter((u) => !defined.has(u.name)).map((u) => `${u.at} ${u.name}`)).toEqual([]);
});
