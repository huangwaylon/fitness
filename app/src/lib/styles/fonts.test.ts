// fonts.css and its files are generated (scripts/font-subsets.ts): Zen Maru Gothic's kana, 常用 and the app's other
// kanji, a weight each. What a character renders in is read from the files themselves (their cmaps). If new copy (a
// catalog, or a name in any .ts / .svelte under src/) brings a kanji outside them, this fails: run `npm run fonts:subset`.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { jaStrings } from '#lib/english/i18n.ts';
import { FONT_DIR, PARTS, WEIGHTS, cmapOf, fontFile, fullCover, joyo, shippedCover, toRanges, wanted } from '../../../scripts/font-subsets.ts';

const css = readFileSync(join(import.meta.dirname, 'fonts.css'), 'utf8');
const I18N = join(import.meta.dirname, '..', 'i18n');

/** Every string of every catalog (src/lib/i18n/*.json, both languages; English Study's own, english/i18n.ts), its
 *  {placeholders} dropped: each distinct character once. */
const catalogChars = new Set<string>();
const strings = (v: unknown): string[] => (typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : []);
const catalogs = readdirSync(I18N).filter((f) => f.endsWith('.json'));
for (const f of catalogs) for (const s of strings(JSON.parse(readFileSync(join(I18N, f), 'utf8')))) for (const ch of s.replace(/\{\w+\}/g, '')) catalogChars.add(ch);
for (const s of Object.values(jaStrings())) for (const ch of s.replace(/\{\w+\}/g, '')) catalogChars.add(ch);
/** The whole font's characters (@fontsource's slices' cmaps). */
const full = (w: number): Set<number> => fullCover()[WEIGHTS.indexOf(w as (typeof WEIGHTS)[number])];
/** The source files' characters (wanted(): a walk of src/), read once for both weights. */
let used: Set<number> | null = null;

describe('Zen Maru Gothic, our subsets', () => {
  it('reads every catalog (a new one is in the check)', () => {
    expect(catalogs.length).toBeGreaterThan(30);
    expect(catalogChars.size).toBeGreaterThan(900);
  });
  it.each(WEIGHTS)('weight %i shows every character of every catalog the font has', (w) => {
    const has = shippedCover()[WEIGHTS.indexOf(w)], all = full(w);
    const missing = [...catalogChars].filter((ch) => ch.codePointAt(0)! > 0x20 && all.has(ch.codePointAt(0)!) && !has.has(ch.codePointAt(0)!));
    expect(missing.join('')).toBe('');
  });
  it.each(WEIGHTS)('weight %i shows every character the full font has that any source file uses (r2 N9)', (w) => {
    const has = shippedCover()[WEIGHTS.indexOf(w)], all = full(w);
    const missing = [...(used ??= wanted())].filter((cp) => cp > 0x20 && all.has(cp) && !has.has(cp));
    expect(String.fromCodePoint(...missing)).toBe('');
  });
  it('holds every 常用 kanji in joyo, both weights', () => {
    for (const w of WEIGHTS) {
      const has = cmapOf(join(FONT_DIR, fontFile(w, 'joyo')));
      expect([...joyo()].filter((cp) => !has.has(cp) && full(w).has(cp)), `${w}`).toEqual([]);
    }
  });
  it('fonts.css names the six files, each with its subset\'s characters (joyo by its blocks); ranges.json says the same', () => {
    const ranges = JSON.parse(readFileSync(join(FONT_DIR, 'ranges.json'), 'utf8')) as Record<string, string>;
    const faces = [...css.matchAll(/@font-face\s*{[^}]*}/g)].map((m) => m[0]);
    expect(faces).toHaveLength(WEIGHTS.length * PARTS.length);
    for (const w of WEIGHTS) {
      for (const part of PARTS) {
        const face = faces.find((f) => f.includes(`font-weight: ${w};`) && f.includes(`/${fontFile(w, part)})`));
        expect(face, fontFile(w, part)).toBeTruthy();
        const exact = toRanges(cmapOf(join(FONT_DIR, fontFile(w, part))));
        expect(ranges[part], part).toBe(exact);
        if (part !== 'joyo') expect(/unicode-range:\s*([^;]+);/.exec(face!)?.[1], fontFile(w, part)).toBe(exact);
      }
      // extra after joyo: of overlapping unicode-ranges the last rule is tried first (CSS Fonts)
      expect(faces.findIndex((f) => f.includes(fontFile(w, 'extra')))).toBeGreaterThan(faces.findIndex((f) => f.includes(fontFile(w, 'joyo'))));
    }
  });
  it('a few rules, not @fontsource\'s 160 slices', () => {
    expect(css.length).toBeLessThan(12_000);
  });
});
