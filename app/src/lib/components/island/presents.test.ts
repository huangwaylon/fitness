import { describe, expect, it } from 'vitest';
import { PRESENTS, pickPresent, presentArt, presentLine, type PresentId } from './presents.ts';
import { mulberry32 } from '#lib/random.ts';
import { artKeys } from '#lib/art.ts';
import ja from '#lib/i18n/ja.json';
import en from '#lib/i18n/en.json';
import jaNames from '#lib/i18n/catch.ja.json';
import enNames from '#lib/i18n/catch.en.json';

const ids = Object.keys(PRESENTS) as PresentId[];
const draws = (date: string, n = 2000, seed = 7) => {
  const r = mulberry32(seed), out = new Map<PresentId, number>();
  for (let i = 0; i < n; i++) {
    const id = pickPresent(date, r);
    out.set(id, (out.get(id) ?? 0) + 1);
  }
  return out;
};

describe("a balloon's present", () => {
  it('holds one of NH’s items or seasonal recipes, each with its official icon and its name in both languages', () => {
    expect(ids.length).toBeGreaterThanOrEqual(30);
    expect(ids.length).toBeLessThanOrEqual(60);
    const keys = new Set(artKeys());
    for (const id of ids) {
      expect(keys.has(presentArt(id)), id).toBe(true);
      const { key, name } = presentLine(id);
      expect((jaNames as Record<string, string>)[name], id).toBeTruthy();
      expect((enNames as Record<string, string>)[name], id).toBeTruthy();
      expect((ja as Record<string, string>)[key]).toContain('{name}');
      expect((en as Record<string, string>)[key]).toContain('{name}');
    }
    expect((ja as Record<string, string>)['present.got']).toBe('{name}を てにいれた！');
  });
  it('the same seed opens the same present; never ベル (nothing in the pool is money)', () => {
    expect(pickPresent('2026-11-04', mulberry32(3))).toBe(pickPresent('2026-11-04', mulberry32(3)));
    for (const id of ids) expect(id).not.toMatch(/bell|money/);
  });
  it('a seasonal recipe only in its NH window, about half the presents then; furniture likelier in its season', () => {
    const recipes = (d: Map<PresentId, number>) => [...d].filter(([id]) => PRESENTS[id].kind === 'recipe');
    // July: no recipe window (none of NH's balloon recipe series)
    expect(recipes(draws('2026-07-15'))).toEqual([]);
    // Nov 20: the maple leaves, the mushrooms and the tree's bounty all at once
    const nov = draws('2026-11-20');
    const got = new Set(recipes(nov).map(([id]) => id));
    for (const id of ['maple-leaf-umbrella', 'mush-lamp', 'leaf-campfire'] as PresentId[]) expect(got.has(id), id).toBe(true);
    const share = recipes(nov).reduce((s, [, n]) => s + n, 0) / 2000;
    expect(share).toBeGreaterThan(0.4), expect(share).toBeLessThan(0.6);
    expect(got.has('cherry-blossom-clock')).toBe(false);
    // the ornaments across New Year (a window that wraps)
    expect(recipes(draws('2027-01-03')).some(([id]) => id === 'festive-tree')).toBe(true);
    // a kotatsu in winter, rarely in summer
    expect(draws('2027-01-20').get('kotatsu') ?? 0).toBeGreaterThan((draws('2026-07-20').get('kotatsu') ?? 0) * 1.5);
  });
  it('a recipe shows NH’s DIY card and reads as a recipe', () => {
    expect(presentArt('mush-lamp')).toBe('presents/diy-recipe');
    expect(presentLine('mush-lamp').key).toBe('present.gotRecipe');
    expect(presentArt('kotatsu')).toBe('presents/kotatsu');
    expect(presentLine('kotatsu')).toEqual({ key: 'present.got', name: 'present.name.kotatsu' });
  });
});
