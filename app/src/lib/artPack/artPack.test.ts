// The ずかん's packed icons (scripts/art-packs.ts, artPack.ts): what's packed (the catalogue's clothing by tab, the
// recipes, the artworks; never the furniture nor a key the code names), the packs as the index says (each key's bytes
// where it points, a closet tab in one pack), and the phone's side: a packed key an object URL cut from its pack (the
// index and the pack each fetched once), a loose one its file's URL, offline null and asked again after.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CLOTHING_CATEGORIES, FURNITURE_CATEGORIES, ITEMS, RECIPES } from '#lib/components/island/catalog.ts';
import { KIND_LIST } from '#lib/layout/catalog.ts';
import OUTDOOR from '#lib/layout/outdoor.json' with { type: 'json' };
import ROOM from '#lib/components/tent/items.json' with { type: 'json' };
import PARTS from '#lib/components/player3d/parts.json' with { type: 'json' };
import { CLOTHING_CATEGORIES as SCRIPT_CLOTHING, packedArt, pinned } from '../../../scripts/art-packs.ts';
import BUNDLED from './packs.json' with { type: 'json' };
import { readIndex } from './artPack.ts';

const PACKS = join(import.meta.dirname, '../../../static/art/finds/pack');
const STATIC_ART = join(import.meta.dirname, '../../../static/art');
const RAW = JSON.parse(readFileSync(join(PACKS, `index.${BUNDLED.index}.json`), 'utf8')) as Record<string, [number, string]>;
const INDEX = readIndex(RAW);
const FILES = packedArt();
const loose = (key: string) => existsSync(join(STATIC_ART, `${key}.webp`));

describe('what’s packed', () => {
  it('the clothing, recipes and artworks, by ずかん tab; never the furniture (the shop, the tree gifts, the tent) nor a key the code names', () => {
    expect(SCRIPT_CLOTHING).toEqual(CLOTHING_CATEGORIES);
    const pins = pinned();
    expect(pins.size).toBeGreaterThan(15);
    for (const it of ITEMS) {
      const key = `finds/items/${it.id}`;
      const furniture = (FURNITURE_CATEGORIES as readonly string[]).includes(it.category);
      expect(INDEX.has(key), key).toBe(!furniture && !pins.has(key));
      expect(loose(key), key).toBe(!INDEX.has(key));
    }
    for (const r of RECIPES) expect(INDEX.has(`finds/recipes/${r.id}`) || pins.has(`finds/recipes/${r.id}`)).toBe(true);
    for (const g of ['recipes', 'art']) expect(existsSync(join(STATIC_ART, 'finds', g)) ? readdirSync(join(STATIC_ART, 'finds', g)) : [], g).toEqual([]);
    expect([...INDEX.keys()].filter((k) => k.startsWith('finds/art/')).length).toBe(43);
    for (const k of pins) expect(loose(k), k).toBe(true);
    // the editors' icons (artUrl, sync) and the tent's (items.ts iconUrl): all loose
    const editor = [...KIND_LIST.map((k) => k.icon), ...Object.values(OUTDOOR.pieces as Record<string, { i?: string | number }>).map((p) => (typeof p.i === 'string' ? `finds/items/${p.i}` : null))];
    const tent = Object.values(ROOM.items as Record<string, { cat?: string; icon?: number }>).map((m) => (m.cat && !m.icon ? `finds/items/${m.cat}` : null));
    expect([...editor, ...tent].filter((k) => k && INDEX.has(k))).toEqual([]);
  });

  it('each pack ~200 KB at most, named <tab>[-k].<hash>, its keys’ bytes where the index says', () => {
    const paks = readdirSync(PACKS).filter((f) => f.endsWith('.pak'));
    expect(paks.sort()).toEqual(Object.keys(RAW).map((s) => `${s}.pak`).sort());
    expect(readdirSync(PACKS).sort()).toEqual([...paks, `index.${BUNDLED.index}.json`].sort());
    for (const f of paks) {
      expect(f).toMatch(new RegExp(`^(${[...CLOTHING_CATEGORIES, 'recipes', 'art'].join('|')})(-\\d)?\\.[0-9a-f]{8}\\.pak$`));
      const b = readFileSync(join(PACKS, f));
      expect(b.length, f).toBeLessThan(210_000);
      for (const [key, [stem, at, n]] of INDEX) if (`${stem}.pak` === f) expect(Buffer.compare(b.subarray(at, at + n), FILES.get(key)!), key).toBe(0);
    }
    expect(INDEX.size).toBe(FILES.size);
  });

  it('a closet tab’s icons in one pack (its tab’s first), so a closet tab costs one', () => {
    const tabs = new Map<string, Set<string>>();
    for (const it of Object.values(PARTS.items as Record<string, { slot: string; onepiece?: boolean; icon: string | null }>)) {
      const at = it.icon && INDEX.get(`finds/items/${it.icon}`);
      if (!at) continue;
      const tab = it.onepiece ? 'onepiece' : it.slot;
      tabs.set(tab, (tabs.get(tab) ?? new Set()).add(at[0]));
    }
    expect(tabs.size).toBeGreaterThan(5);
    for (const [tab, stems] of tabs) expect([tab, stems.size, [...stems][0]]).toEqual([tab, 1, expect.stringMatching(/^[a-z]+\.[0-9a-f]{8}$/)]);
  });
});

describe('on the phone (artSrc)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });
  const PACK = 'tops.11111111';
  const bytes = Uint8Array.from({ length: 40 }, (_, i) => i);
  function net() {
    const asked: string[] = [];
    let down = false;
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      asked.push(url);
      if (down) throw new TypeError('offline');
      if (url.endsWith(`/index.${BUNDLED.index}.json`)) return Response.json({ [PACK]: [10, 'items/pocket-tee-x:10,items/aran-knit-sweater:20'] });
      if (url.endsWith(`/${PACK}.pak`)) return new Response(bytes);
      return new Response(null, { status: 404 });
    }));
    const blobs: Blob[] = [];
    vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL: (b: Blob) => `blob:${blobs.push(b)}`, revokeObjectURL: () => {} }));
    return { asked, blobs, off: (v: boolean) => (down = v) };
  }

  it('a packed key’s object URL cut from its pack, the index and the pack fetched once; a loose key its file', async () => {
    const n = net();
    const { artSrc, artSrcNow, artPacked } = await import('./artPack.ts');
    expect(artPacked('finds/items/aran-knit-sweater')).toBeUndefined();
    expect(artSrcNow('finds/items/aran-knit-sweater')).toBeUndefined();
    expect(artSrcNow('villagers/raymond')).toMatch(/\/art\/villagers\/raymond\.webp$/);
    const [a, b, c] = await Promise.all([artSrc('finds/items/aran-knit-sweater'), artSrc('finds/items/aran-knit-sweater'), artSrc('finds/items/fan')]);
    expect([a, b]).toEqual(['blob:1', 'blob:1']);
    expect(c).toMatch(/\/art\/finds\/items\/fan\.webp$/);
    expect(new Uint8Array(await n.blobs[0].arrayBuffer())).toEqual(bytes.slice(20, 40));
    expect(n.blobs[0].type).toBe('image/webp');
    expect(artSrcNow('finds/items/aran-knit-sweater')).toBe('blob:1');
    expect(n.asked.map((u) => u.slice(u.lastIndexOf('/') + 1))).toEqual([`index.${BUNDLED.index}.json`, `${PACK}.pak`]);
  });

  it('offline: null, and asked again once back', async () => {
    const n = net();
    n.off(true);
    const { artSrc } = await import('./artPack.ts');
    expect(await artSrc('finds/items/aran-knit-sweater')).toBeNull();
    n.off(false);
    expect(await artSrc('finds/items/aran-knit-sweater')).toBe('blob:1');
  });
});
