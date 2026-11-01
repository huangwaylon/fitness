import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import ja from '#lib/i18n/catalog.ja.json';
import en from '#lib/i18n/catalog.en.json';
import { isTallyKey } from '#lib/contract/tally.ts';
import {
  CLOTHING_CATEGORIES, FURNITURE_CATEGORIES, ITEMS, RECIPES, RECIPE_SEASONS, catalogArt, catalogName, pickPresent, recipesOn,
  type Present
} from './catalog.ts';
import { inPool, seasons, slug, withArticle } from '../../../../scripts/catalog.ts';
import { precachable } from '../../../service-worker/caches.ts';

const STATIC = join(import.meta.dirname, '..', '..', '..', '..', 'static');
const all: Present[] = [...ITEMS.map(({ id }) => ({ kind: 'item' as const, id })), ...RECIPES.map(({ id }) => ({ kind: 'recipe' as const, id }))];

/** A seeded uniform source (mulberry32), so a run's odds are stable. */
function rng(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const byId = new Map(ITEMS.map((i) => [i.id, i]));
const draw = (date: string, n: number, seed = 1, bunny = false) => {
  const r = rng(seed);
  return Array.from({ length: n }, () => pickPresent(date, r, bunny));
};

describe('the catalogue (scripts/catalog.ts)', () => {
  it('is close to NH’s shop stock: ~1,800 base items in every category, ~125 balloon recipes', () => {
    expect(ITEMS.length).toBeGreaterThan(1700);
    expect(RECIPES.length).toBeGreaterThan(120);
    for (const c of [...FURNITURE_CATEGORIES, ...CLOTHING_CATEGORIES]) expect(ITEMS.filter((i) => i.category === c).length, c).toBeGreaterThan(30);
    expect(new Set(ITEMS.map((i) => i.category))).toEqual(new Set([...FURNITURE_CATEGORIES, ...CLOTHING_CATEGORIES]));
    for (const s of Object.keys(RECIPE_SEASONS)) expect(RECIPES.some((r) => r.season === s), s).toBe(true);
  });
  it('has unique ids that a find and a tally accept', () => {
    for (const list of [ITEMS, RECIPES]) expect(new Set(list.map((e) => e.id)).size).toBe(list.length);
    expect(all.filter(({ kind, id }) => !isTallyKey(`${kind}:${id}`))).toEqual([]);
  });
  it('names every entry in both languages, and nothing else', () => {
    const keys = all.map(catalogName);
    expect(keys.filter((k) => !(ja as Record<string, string>)[k]?.trim() || !(en as Record<string, string>)[k]?.trim())).toEqual([]);
    expect(Object.keys(ja).sort()).toEqual([...keys].sort());
    expect(Object.keys(en).sort()).toEqual([...keys].sort());
    // English with its article for the catch line; Japanese as the game writes it
    expect(Object.values(en).filter((n) => !/^(a|an|some) /.test(n))).toEqual([]);
    expect([ja['item.name.froggy-chair'], en['item.name.froggy-chair']]).toEqual(['カエルのチェア', 'a froggy chair']);
    expect(ja['recipe.name.cherry-blossom-clock']).toBe('さくらクロック');
  });
  it('has an icon for every entry (~2 KB webp), and no stray file', () => {
    const sizes: number[] = [];
    for (const p of all) {
      const f = join(STATIC, catalogArt(p));
      expect(existsSync(f), f).toBe(true);
      sizes.push(statSync(f).size);
    }
    expect(Math.max(...sizes)).toBeLessThan(8_000);
    expect(sizes.reduce((s, n) => s + n, 0) / sizes.length).toBeLessThan(3_000);
    for (const [dir, list] of [['items', ITEMS], ['recipes', RECIPES]] as const)
      expect(readdirSync(join(STATIC, 'art/finds', dir)).sort()).toEqual(list.map((e) => `${e.id}.webp`).sort());
  });
  it('keeps the icons out of the service worker’s install (cached on first use, like the other finds)', () => {
    expect(all.filter((p) => precachable(catalogArt(p)))).toEqual([]);
  });
});

describe('the pool rules', () => {
  it('keeps what a balloon can’t hold out: crafted (DIY) items, special characters’, Nook Miles’, events’, variants', () => {
    // NH: the rocking chair, ukulele, pot and tiki torch are DIY; the lucky cat is Gulliver's; the lucky gold cat a DIY
    // too; the moai statue Gulliver's; the Bunny Day bed and spooky chair are recipes, not shop stock
    for (const id of ['rocking-chair', 'ukulele', 'pot', 'tiki-torch', 'lucky-cat', 'lucky-gold-cat', 'moai-statue', 'bunny-day-bed', 'spooky-chair'])
      expect(byId.has(id), id).toBe(false);
    // one entry per base item, never a colour
    expect(ITEMS.filter((i) => /\((white|red|blue|green|black|pink)\)|-(white|blue|green|pink)$/.test(i.id))).toEqual([]);
    // the shops' stock is in: a froggy chair, the pandas, the kotatsu (winter stock), the beach chair (summer stock)
    for (const id of ['froggy-chair', 'baby-panda', 'mama-panda', 'cute-bed', 'throne']) expect(byId.has(id), id).toBe(true);
    expect([byId.get('kotatsu')?.stock, byId.get('beach-chair')?.stock]).toEqual(['winter', 'summer']);
  });
  it('carries the seasonal recipes only in their windows', () => {
    const on = (date: string, bunny = false) => [...new Set(recipesOn(date, bunny).map((r) => r.season))].sort();
    expect(on('2026-04-05')).toEqual(['bamboo', 'cherry']);
    expect(on('2026-04-11')).toEqual(['bamboo']);
    expect(on('2026-07-01')).toEqual(['shells']);
    expect(on('2026-10-31')).toEqual(['acorns', 'halloween']);
    expect(on('2026-11-20')).toEqual(['acorns', 'maple', 'mushrooms']);
    expect(on('2026-12-20')).toEqual(['ornaments', 'snowflakes']);
    expect(on('2027-01-06')).toEqual(['ornaments', 'snowflakes']);
    expect(on('2027-01-07')).toEqual(['snowflakes']);
    expect(on('2026-03-17')).toEqual(['bamboo', 'shamrock']);
    expect(on('2026-05-25')).toEqual([]);
    expect(on('2026-05-25', true)).toEqual(['bunny']);
  });
  it('opens a season’s recipe at NH’s odds while it’s on, and none off season', () => {
    const inSeason = draw('2026-11-20', 4000);
    const share = (ps: Present[], f: (p: Present) => boolean) => ps.filter(f).length / ps.length;
    expect(share(inSeason, (p) => p.kind === 'recipe')).toBeCloseTo(15 / 70, 1);
    const seasons = new Set(recipesOn('2026-11-20').map((r) => r.id));
    expect(inSeason.filter((p) => p.kind === 'recipe' && !seasons.has(p.id))).toEqual([]);
    const off = draw('2026-05-25', 4000);
    expect(off.filter((p) => p.kind === 'recipe')).toEqual([]);
    // furniture : clothing = 2 : 1 off season
    const furniture = new Set<string>(FURNITURE_CATEGORIES);
    expect(share(off, (p) => furniture.has(byId.get(p.id)!.category))).toBeCloseTo(2 / 3, 1);
  });
  it('keeps the shops’ season stock in its season and favours clothing in its style’s season', () => {
    const summer = draw('2026-07-15', 6000), winter = draw('2027-01-15', 6000);
    const stock = (ps: Present[], s: string) => ps.filter((p) => p.kind === 'item' && byId.get(p.id)!.stock === s).length;
    expect([stock(summer, 'winter'), stock(winter, 'summer')]).toEqual([0, 0]);
    expect(stock(summer, 'summer')).toBeGreaterThan(0);
    expect(stock(winter, 'winter')).toBeGreaterThan(0);
    // summer-style clothing is likelier in July than in January (both all-year stock)
    const styled = (ps: Present[]) => ps.filter((p) => { const i = byId.get(p.id); return p.kind === 'item' && i?.style === 'summer' && !i.stock; }).length;
    expect(styled(summer)).toBeGreaterThan(styled(winter) * 1.4);
  });
  it('picks only catalogue entries, the same for the same seed, and spreads over the pool', () => {
    const ps = draw('2026-04-05', 3000, 7);
    const known = new Set(all.map((p) => `${p.kind}:${p.id}`));
    expect(ps.filter((p) => !known.has(`${p.kind}:${p.id}`))).toEqual([]);
    expect(draw('2026-04-05', 50, 7)).toEqual(ps.slice(0, 50));
    expect(new Set(ps.map((p) => p.id)).size).toBeGreaterThan(900);
  });
  it('names its art and its name key', () => {
    expect(catalogArt({ kind: 'item', id: 'froggy-chair' })).toBe('art/finds/items/froggy-chair.webp');
    expect(catalogArt({ kind: 'recipe', id: 'frozen-fence' })).toBe('art/finds/recipes/frozen-fence.webp');
    expect(catalogName({ kind: 'recipe', id: 'frozen-fence' })).toBe('recipe.name.frozen-fence');
  });
});

describe('the build’s rules (scripts/catalog.ts, on spreadsheet rows)', () => {
  const shop = { name: 'froggy chair', catalog: 'For sale', source: ["Nook's Cranny"], seasonEvent: null };
  it('takes the shops’ orderable stock, with or without the HHP office beside it', () => {
    expect(inPool(shop)).toBe(true);
    expect(inPool({ ...shop, source: ["Nook's Cranny", 'HHP Office'] })).toBe(true);
    expect(inPool({ name: 'aran-knit sweater', variations: [{ catalog: 'For sale', source: ['Able Sisters'], seasonEvent: 'Winter shopping' }] })).toBe(true);
  });
  it('leaves out what a balloon never holds', () => {
    for (const row of [
      { ...shop, catalog: 'Not for sale', source: ['Crafting'] }, // DIY
      { ...shop, catalog: 'Not for sale', source: ['Nook Miles Redemption'] },
      { ...shop, catalog: 'Not for sale', source: ['Gulliver'] }, // special characters
      { ...shop, source: ['Kicks', "Kicks' Co-op"] },
      { ...shop, source: ['Label'] },
      { ...shop, catalog: undefined, source: ['Nook Shopping Promotion'] },
      { ...shop, source: ['Nook Shopping Daily Selection', 'HHP Office'] },
      { ...shop, source: ["Nook's Cranny", 'Pavé'] }, // an event's character beside the shop
      { ...shop, seasonEvent: 'Halloween (ready days); Halloween' },
      { ...shop, seasonEvent: 'Toy Day (ready days phase 1); Toy Day (ready days phase 2); Toy Day; Toy Day (day after)' },
      { ...shop, sourceNotes: 'Scan the associated Sanrio amiibo card' }
    ]) expect(inPool(row as Parameters<typeof inPool>[0]), JSON.stringify(row)).toBe(false);
  });
  it('reads the shops’ season stock and clothing’s style season', () => {
    expect(seasons({ name: 'x', seasonalAvailability: 'Summer', variations: [{ seasonality: 'Spring' }] })).toEqual({ stock: 'summer', style: 'spring' });
    expect(seasons({ name: 'x', seasonEvent: 'Winter shopping' })).toEqual({ stock: 'winter', style: '' });
    expect(seasons({ name: 'x', seasonalAvailability: 'All Year', seasonality: 'All Year' })).toEqual({ stock: '', style: '' });
  });
  it('makes ids from English names, starting with a letter', () => {
    expect(['froggy chair', "Pavé's balloon-hem dress", 'Mr. Flamingo', '3D glasses', 'LCD TV (50 in.)', 'Kiki & Lala dress'].map(slug))
      .toEqual(['froggy-chair', 'paves-balloon-hem-dress', 'mr-flamingo', 'glasses-3d', 'lcd-tv-50-in', 'kiki-and-lala-dress']);
  });
  it('gives English names their article', () => {
    expect(['froggy chair', 'elephant slide', 'LCD TV', 'utility sink', 'ukulele case', 'cargo pants', 'pile of leaves', 'dress', 'cactus', 'knee braces']
      .map(withArticle)).toEqual(['a froggy chair', 'an elephant slide', 'an LCD TV', 'a utility sink', 'a ukulele case', 'some cargo pants',
      'a pile of leaves', 'a dress', 'a cactus', 'some knee braces']);
  });
});
