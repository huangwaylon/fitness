// fonts.css is generated (scripts/font-subsets.ts) with only the Zen Maru Gothic slices the app uses. If new copy
// (a catalog, or a name in any .ts / .svelte under src/) brings a kanji outside them, this fails: run
// `npm run fonts:subset`.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import jaMain from '#lib/i18n/ja.json';
import enMain from '#lib/i18n/en.json';
import jaTab from '#lib/i18n/kenkou.ja.json';
import enTab from '#lib/i18n/kenkou.en.json';
import jaSheets from '#lib/i18n/sheets.ja.json';
import enSheets from '#lib/i18n/sheets.en.json';
import jaFood from '#lib/i18n/food.ja.json';
import enFood from '#lib/i18n/food.en.json';
import jaKiki from '#lib/i18n/kikimimi.ja.json';
import enKiki from '#lib/i18n/kikimimi.en.json';
import jaTravel from '#lib/i18n/travel.ja.json';
import enTravel from '#lib/i18n/travel.en.json';
import jaWed from '#lib/i18n/wedding.ja.json';
import enWed from '#lib/i18n/wedding.en.json';
import jaNames from '#lib/i18n/catch.ja.json';
import enNames from '#lib/i18n/catch.en.json';
import jaCatalog from '#lib/i18n/catalog.ja.json';
import enCatalog from '#lib/i18n/catalog.en.json';
import jaGym from '#lib/i18n/gym.ja.json';
import enGym from '#lib/i18n/gym.en.json';
import jaIts from '#lib/i18n/its.ja.json';
import enIts from '#lib/i18n/its.en.json';
import jaKalori from '#lib/i18n/kalori.ja.json';
import enKalori from '#lib/i18n/kalori.en.json';
import jaBots from '#lib/i18n/bots.ja.json';
import enBots from '#lib/i18n/bots.en.json';

/** Each ききみみ game's own strings (i18n/kiki-<game>.*.json: `kiki.<game>.*`, merged in with its lane by addCatalog). */
const KIKI_GAMES = {
  ja: import.meta.glob<Record<string, string>>('../i18n/kiki-*.ja.json', { eager: true, import: 'default' }),
  en: import.meta.glob<Record<string, string>>('../i18n/kiki-*.en.json', { eager: true, import: 'default' })
};
const ja = { ...jaMain, ...jaTab, ...jaSheets, ...jaFood, ...jaNames, ...jaCatalog, ...jaKiki, ...(Object.assign({}, ...Object.values(KIKI_GAMES.ja)) as Record<string, string>), ...jaTravel, ...jaWed, ...jaGym, ...jaIts, ...jaKalori, ...jaBots };
const en = { ...enMain, ...enTab, ...enSheets, ...enFood, ...enNames, ...enCatalog, ...enKiki, ...(Object.assign({}, ...Object.values(KIKI_GAMES.en)) as Record<string, string>), ...enTravel, ...enWed, ...enGym, ...enIts, ...enKalori, ...enBots };
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

/** Every distinct character of the catalogs (their {placeholders} dropped), once for both weights. */
const catalogChars = new Set<string>();
for (const text of [...Object.values(ja), ...Object.values(en)]) for (const ch of text.replace(/\{\w+\}/g, '')) catalogChars.add(ch);
/** The source files' characters (scripts/font-subsets.ts wanted(): a walk of src/), read once for both weights. */
let used: Set<number> | null = null;

describe('trimmed Zen Maru Gothic', () => {
  it.each([500, 700])('weight %i covers every catalog character', (w) => {
    const rs = ranges(w);
    const missing = new Set<string>();
    for (const ch of catalogChars) {
      const cp = ch.codePointAt(0)!;
      if (cp > 0x20 && !rs.some(([a, b]) => cp >= a && cp <= b)) missing.add(ch);
    }
    expect([...missing].join('')).toBe('');
  });
  it.each([500, 700])('weight %i covers every character the full font has that any source file uses (r2 N9)', (w) => {
    const rs = ranges(w);
    const full = [...readFileSync(join(PKG, `${w}.css`), 'utf8').matchAll(/unicode-range:\s*([^;]+);/g)].flatMap((m) => parseRanges(m[1]));
    const missing = [...(used ??= wanted())].filter((cp) => cp > 0x20 && covers(full, cp) && !covers(rs, cp));
    expect(String.fromCodePoint(...missing)).toBe('');
  });
  it('stays far below the full font CSS (250 rules)', () => {
    expect((css.match(/@font-face/g) ?? []).length).toBeLessThan(160); // (158 with 保養所ボット's facility names, 2026-11-13; 150 with the sheets' kanji, 2026-11-07: 148 before; 146 with the trip guides' kanji, 2026-11-06; each rule's file loads only when a glyph in it shows)
  });
});
