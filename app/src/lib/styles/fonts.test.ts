// fonts.css is generated (scripts/font-subsets.ts) with only the Zen Maru Gothic slices the app uses. If new copy
// (a catalog, or a name in any .ts / .svelte under src/) brings a kanji outside them, this fails: run
// `npm run fonts:subset`.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import ja from '#lib/i18n/ja.json';
import en from '#lib/i18n/en.json';
import { PKG, covers, parseRanges, wanted } from '../../../scripts/font-subsets.ts';

const css = readFileSync(join(import.meta.dirname, 'fonts.css'), 'utf8');

function ranges(weight: number): [number, number][] {
  const out: [number, number][] = [];
  for (const m of css.matchAll(/@font-face\s*{[^}]*}/g)) {
    if (!m[0].includes(`font-weight: ${weight};`)) continue;
    const r = /unicode-range:\s*([^;]+);/.exec(m[0])?.[1] ?? '';
    for (const part of r.split(',')) {
      const [a, b] = part.trim().replace(/^U\+/i, '').split('-');
      out.push([parseInt(a, 16), parseInt(b ?? a, 16)]);
    }
  }
  return out;
}

describe('trimmed Zen Maru Gothic', () => {
  it.each([500, 700])('weight %i covers every catalog character', (w) => {
    const rs = ranges(w);
    const missing = new Set<string>();
    for (const text of [...Object.values(ja), ...Object.values(en)]) {
      for (const ch of text.replace(/\{\w+\}/g, '')) {
        const cp = ch.codePointAt(0)!;
        if (cp > 0x20 && !rs.some(([a, b]) => cp >= a && cp <= b)) missing.add(ch);
      }
    }
    expect([...missing].join('')).toBe('');
  });
  it.each([500, 700])('weight %i covers every character the full font has that any source file uses (r2 N9)', (w) => {
    const rs = ranges(w);
    const full = [...readFileSync(join(PKG, `${w}.css`), 'utf8').matchAll(/unicode-range:\s*([^;]+);/g)].flatMap((m) => parseRanges(m[1]));
    const missing = [...wanted()].filter((cp) => cp > 0x20 && covers(full, cp) && !covers(rs, cp));
    expect(String.fromCodePoint(...missing)).toBe('');
  });
  it('stays far below the full font CSS (250 rules)', () => {
    expect((css.match(/@font-face/g) ?? []).length).toBeLessThan(120);
  });
});
