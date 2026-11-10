// The ずかん's catalog (kiroku/zukan.ts): every entry of every kind has its official icon on disk and its name in both
// languages, the counts are NH's, and the fossil page groups each dinosaur's pieces under its name.
import { describe, expect, it } from 'vitest';
import { art } from '#lib/art.ts';
import jaCatch from '#lib/i18n/catch.ja.json';
import enCatch from '#lib/i18n/catch.en.json';
import jaCatalog from '#lib/i18n/catalog.ja.json';
import enCatalog from '#lib/i18n/catalog.en.json';
import jaMain from '#lib/i18n/ja.json';
import enMain from '#lib/i18n/en.json';
import { ITEMS, RECIPES } from '../island/catalog.ts';
import { FOSSILS } from '../island/beach.ts';
import { ZUKAN_KINDS, KIND_ART, entries, groups } from './zukan.ts';

const names = [{ ...jaMain, ...jaCatch, ...jaCatalog }, { ...enMain, ...enCatch, ...enCatalog }] as Record<string, string>[];

describe('the ずかん', () => {
  it('has every kind’s entries with an icon and a name in both languages', () => {
    for (const kind of ZUKAN_KINDS) {
      expect(art(KIND_ART[kind]), kind).toBeTruthy();
      for (const c of names) expect(c[`zukan.kind.${kind}`], kind).toBeTruthy();
      for (const e of entries(kind)) {
        expect(art(e.art), `${kind} ${e.id} icon`).toBeTruthy();
        for (const c of names) expect(c[e.name], `${kind} ${e.id} name`).toBeTruthy();
      }
    }
  });
  it('counts NH’s catalogue: 80 fish (34 sea, 46 pond), all 80 bugs, 40 sea creatures, 73 fossils, 9 shells (the pearl from diving)', () => {
    expect(entries('fish')).toHaveLength(80);
    // in NH's critterpedia order: the freshwater fish first
    expect(entries('fish').slice(0, 3).map((e) => e.id)).toEqual(['bitterling', 'pale-chub', 'crucian-carp']);
    expect(entries('fish').at(-1)!.id).toBe('coelacanth');
    expect(entries('bug')).toHaveLength(80);
    expect(entries('fossil')).toHaveLength(73);
    expect(entries('sea')).toHaveLength(40);
    expect(entries('shell')).toHaveLength(9);
    expect(entries('shell').at(-1)!.id).toBe('pearl');
  });
  it('lays the fossils out as NH’s museum: the standalone ones, then each dinosaur’s pieces under its name', () => {
    const g = groups('fossil');
    expect(g[0].name).toBeNull();
    expect(g[0].entries).toHaveLength(14);
    expect(g.slice(1)).toHaveLength(21);
    for (const s of g.slice(1)) for (const c of names) expect(c[s.name!], s.name!).toBeTruthy();
    expect(g.find((s) => s.name === 'fossil.set.t-rex')!.entries.map((e) => e.id)).toEqual(['t-rex-skull', 't-rex-torso', 't-rex-tail']);
    expect(g.flatMap((s) => s.entries.map((e) => e.id)).sort()).toEqual([...FOSSILS].sort());
    // any other kind is one run
    expect(groups('bug')).toEqual([{ name: null, entries: entries('bug') }]);
  });
  it('has a balloon’s presents: the catalogue by NH’s categories, the recipes by their season, every entry once', () => {
    expect(entries('item')).toHaveLength(ITEMS.length);
    expect(entries('recipe')).toHaveLength(RECIPES.length);
    for (const kind of ['item', 'recipe'] as const) {
      const g = groups(kind);
      expect(g.every((r) => r.name && r.entries.length > 0)).toBe(true);
      for (const r of g) for (const c of names) expect(c[r.name!], r.name!).toBeTruthy();
      expect(g.flatMap((r) => r.entries.map((e) => e.id)).sort()).toEqual(entries(kind).map((e) => e.id).sort());
    }
    expect(groups('item').map((r) => r.name)[0]).toBe('zukan.cat.housewares');
    expect(entries('item').find((e) => e.id === 'froggy-chair')).toEqual({ id: 'froggy-chair', art: 'finds/items/froggy-chair', name: 'item.name.froggy-chair' });
  });
});
