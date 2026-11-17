import { describe, expect, it } from 'vitest';
import { CLIPS } from './clips/index.ts';
import { metaOf } from './catalog.ts';
import { COLLECTIONS, MIN_CLIPS, SITUATIONS, clipsOf, shownOf } from './collections.ts';

const LIB = CLIPS.map(metaOf);

describe('collections', () => {
  it('each names clips that exist and situations that are', () => {
    expect(new Set(COLLECTIONS.map((c) => c.id)).size).toBe(COLLECTIONS.length);
    for (const c of COLLECTIONS) {
      for (const id of c.clips ?? []) expect(CLIPS.some((x) => x.id === id), `${c.id}: ${id}`).toBe(true);
      for (const t of c.tags) expect(SITUATIONS, c.id).toContain(t);
    }
  });

  it('every situation in exactly one (no group shown twice), every clip’s situations known', () => {
    for (const t of SITUATIONS) expect(COLLECTIONS.filter((c) => c.tags.includes(t)).length, t).toBe(1);
    for (const c of CLIPS) for (const t of c.tags) expect(SITUATIONS, c.id).toContain(t);
  });

  it('holds the clips with its situations or its ids, in the library’s order; shows only with enough', () => {
    const work = COLLECTIONS.find((c) => c.id === 'work')!;
    expect(clipsOf(work, LIB).map((m) => m.id)).toEqual(LIB.filter((m) => m.tags.includes('職場')).map((m) => m.id));
    const ask = clipsOf(COLLECTIONS.find((c) => c.id === 'ask')!, LIB).map((m) => m.id);
    expect(ask).toContain('twodates');
    expect(ask).toEqual(LIB.map((m) => m.id).filter((id) => ask.includes(id)));
    for (const { clips } of shownOf(LIB)) expect(clips.length).toBeGreaterThanOrEqual(MIN_CLIPS);
    expect(shownOf(LIB.slice(0, 1))).toEqual([]);
  });
});
