// The ずかん's catalog (kiroku/zukan.ts): every entry of every kind has its official icon on disk and its name in both
// languages, the counts are NH's, and the fossil page groups each dinosaur's pieces under its name.
import { describe, expect, it } from 'vitest';
import { artKeys } from '#lib/art.ts';
import ja from '#lib/i18n/catch.ja.json';
import en from '#lib/i18n/catch.en.json';
import { FOSSILS } from '../island/beach.ts';
import { ZUKAN_KINDS, KIND_ART, entries, groups } from './zukan.ts';

const art = new Set(artKeys());
const names = [ja, en] as Record<string, string>[];

describe('the ずかん', () => {
  it('has every kind’s entries with an icon and a name in both languages', () => {
    for (const kind of ZUKAN_KINDS) {
      expect(art.has(KIND_ART[kind]), kind).toBe(true);
      for (const e of entries(kind)) {
        expect(art.has(e.art), `${kind} ${e.id} icon`).toBe(true);
        for (const c of names) expect(c[e.name], `${kind} ${e.id} name`).toBeTruthy();
      }
    }
  });
  it('counts NH’s catalogue: 33 sea fish, 67 bugs, 73 fossils, 8 shells', () => {
    expect(entries('fish')).toHaveLength(33);
    expect(entries('bug')).toHaveLength(67);
    expect(entries('fossil')).toHaveLength(73);
    expect(entries('shell')).toHaveLength(8);
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
});
