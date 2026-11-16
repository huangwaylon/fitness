// The packed art manifest (vite.config.ts slimArtManifest) unpacks to exactly the file's keys and sizes.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { art, artKeys, FOOD_CAT } from './art.ts';

const raw = JSON.parse(readFileSync(new URL('../../static/art/manifest.json', import.meta.url), 'utf8')) as { files: Record<string, { path: string; w: number; h: number }> };

describe('the art manifest as bundled', () => {
  it('every key with its file and size, nothing more', () => {
    expect(artKeys().sort()).toEqual(Object.keys(raw.files).sort());
    for (const [k, { path, w, h }] of Object.entries(raw.files)) expect(art(k), k).toMatchObject({ path, w, h });
    // a key sharing another's picture (scripts/art-dedupe.ts): the six crop starts are NH's one seedling
    expect(art('finds/wheat-start')?.path).toBe('finds/carrot-start.webp');
  });
});

describe('ごはん’s category tiles', () => {
  it('every category of the food data (docs/food-data.md) has a tile, its word short enough for a 40 px one', () => {
    const doc = readFileSync(new URL('../../../docs/food-data.md', import.meta.url), 'utf8');
    const cats = doc.match(/\| `cat` \| one of ([^|]+)\|/)![1].trim().split(/\s+/);
    expect(cats.length).toBeGreaterThan(20);
    for (const c of [...cats, 'レシピ']) expect(FOOD_CAT[c]?.word.length, c).toBeLessThanOrEqual(4);
  });
});
