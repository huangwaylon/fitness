// The copy's two zones (docs/design.md "Copy"). The WORLD (the island and its rooms: villagers' and NPCs' lines, bubbles,
// signs, in-world notices, the HUD, the leaf menu's pills) is kids-style spaced kana under `word-break: keep-all`: a
// line breaks only at the copy's spaces or after 、。！, so a run with no break opportunity is one unbreakable word and
// a long one overflows a 320px screen or a narrow card. Everything opened from the world (sheets, panels, dialogs,
// forms) is normal Japanese with kanji under `word-break: normal` (theme.css): it breaks between any two Japanese
// characters, so only a run of Latin letters or digits can't break there.
import { describe, expect, it } from 'vitest';
import jaMain from './ja.json';
import jaTab from './kenkou.ja.json';
import jaFood from './food.ja.json';
import jaKiki from './kikimimi.ja.json';
import jaTravel from './travel.ja.json';
import jaWed from './wedding.ja.json';
import jaNames from './catch.ja.json';

const ja: Record<string, string> = { ...jaMain, ...jaTab, ...jaFood, ...jaNames, ...jaKiki, ...jaTravel, ...jaWed };

/** The world's keys: shown on the island or in a room (a line, a bubble, a sign, a notice, the HUD, a menu pill), or
 *  an official name (NH's names, as the game writes them). Every other key is a sheet's. */
const WORLD: RegExp[] = [
  // lines: しずえ, the visitors, the curator, the twins, ハニワくん, the snowman, notes in bottles
  /^host\./, /^chat\./, /^visitor\./, /^museum\.curator/, /^shop\.say\./, /^tent\.hha\./, /^tent\.theme\./, /^tent\.colour\./,
  /^world\./, /^beach\./, /^critter\./, /^shake\./, /^present\./, /^zodiac\./, /^harvest\.(hello|doneHost)$/,
  /^kiki\.(invite|join|host)/, /^guest\.(arrived|welcome)$/, /^zukan\.added$/, /^island\.(highfive|balloon|no3d|me$)/,
  // the HUD, its menu's pills, the island's own controls and plates
  /^island\.(health|food|bells|menu|settings)/, /^panel\.(travel|hiking|wedding|kikimimi)/, /^zukan\.title$/, /^wallet\.title$/,
  /^say\./, /^room\./, /^tree\./, /^preview\.chip/, /^sound\.tapToHear$/, /^sync\./, /^board\.(name|open|new|empty)$/,
  // the rooms' signs and HUD
  /^museum\.(title|room)$/, /^shop\.(title|sign|out|wallet|counter|twins)$/, /^tent\.(title|room|back|whose|failed|lights|resetView|edit)$/,
  // official names
  /\.name\./, /^fossil\.set\./, /^decor\.item\./
];
const isWorld = (k: string): boolean => WORLD.some((r) => r.test(k));

/** The longest stretch of a string with no break opportunity under keep-all, in characters ({n} counts as one). */
function longestRun(s: string): number {
  const runs = s.replace(/\{[^}]+\}/g, 'X').split(/[\s、。！？!?）)」』・〜~/]|(?<=[（(「『])/);
  return Math.max(...runs.map((r) => [...r].length));
}

/** The longest run of Latin letters and digits (the only thing `word-break: normal` won't break), in characters. */
const longestLatin = (s: string): number => Math.max(0, ...(s.replace(/\{[^}]+\}/g, ' ').match(/[A-Za-z0-9]+/g) ?? []).map((r) => r.length));

describe('ja copy: the world (keep-all)', () => {
  it('has no unbreakable run longer than 12 characters (≈ 290px at the 24px title size)', () => {
    const long = Object.entries(ja).filter(([k, v]) => isWorld(k) && longestRun(v) > 12).map(([k, v]) => `${k}: ${v}`);
    expect(long).toEqual([]);
  });
});

describe('ja copy: the sheets (word-break: normal)', () => {
  it('has no Latin or digit run longer than 16 characters', () => {
    const long = Object.entries(ja).filter(([k, v]) => !isWorld(k) && longestLatin(v) > 16).map(([k, v]) => `${k}: ${v}`);
    expect(long).toEqual([]);
  });
});

describe('catalog text', () => {
  it('has no broken characters (U+FFFD) in either language', async () => {
    const en = { ...(await import('./en.json')).default, ...(await import('./catch.en.json')).default, ...(await import('./food.en.json')).default } as Record<string, string>;
    const bad = [...Object.entries(ja), ...Object.entries(en)].filter(([, v]) => v.includes('\uFFFD')).map(([k]) => k);
    expect(bad).toEqual([]);
  });
});
