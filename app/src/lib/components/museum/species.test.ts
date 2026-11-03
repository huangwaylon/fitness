// What the museum shows and where (museum/species.ts): the ずかん's first finds, each fish in its tank, each bug in its
// place.
import { describe, expect, test } from 'vitest';
import { findKey, type FirstFind } from '#lib/model/finds.ts';
import { entries } from '../kiroku/zukan.ts';
import { BUG_IDS, FISH_IDS, habitatOf, onShow, tankOf } from './species.ts';

const found = (person: 'A' | 'B' | 'G'): FirstFind => ({ date: '2026-11-04', at: 1.8e12, person });

describe('on show', () => {
  test('exactly the fish and bugs anyone found (the guest’s too), each credited; nothing else (a fossil, a shell)', () => {
    const finds = new Map<string, FirstFind>([
      [findKey('fish', 'sea-bass'), found('A')], [findKey('fish', 'koi'), found('B')], [findKey('bug', 'tarantula'), found('G')],
      [findKey('fossil', 'ammonite'), found('A')], [findKey('shell', 'cowrie'), found('B')]
    ]);
    const s = onShow(finds);
    expect(s.map((x) => [x.id, x.kind, x.found.person]).sort()).toEqual([['koi', 'fish', 'B'], ['sea-bass', 'fish', 'A'], ['tarantula', 'bug', 'G']]);
    expect(onShow(new Map())).toEqual([]);
  });
  test('the ずかん’s fish and bugs, every one', () => {
    expect([...FISH_IDS].sort()).toEqual(entries('fish').map((e) => e.id).sort());
    expect([...BUG_IDS].sort()).toEqual(entries('bug').map((e) => e.id).sort());
  });
});

describe('the tanks (NH’s grouping)', () => {
  test('the sharks and the big sea fish in the great tank; the deep’s in the dark one; the river’s big fish in the river tank', () => {
    for (const id of ['whale-shark', 'great-white-shark', 'tuna', 'ray', 'sea-bass', 'ocean-sunfish']) expect(tankOf(id), id).toBe('sea');
    for (const id of ['oarfish', 'coelacanth', 'barreleye', 'football-fish']) expect(tankOf(id), id).toBe('deep');
    for (const id of ['arapaima', 'sturgeon', 'koi', 'catfish', 'soft-shelled-turtle']) expect(tankOf(id), id).toBe('river');
  });
  test('the little fish in the small tanks, each group in its two (the pond’s, the stream’s, the tropical, the reef’s)', () => {
    expect(tankOf('goldfish')).toBe('small-1');
    expect(tankOf('crucian-carp')).toBe('small-2');
    expect(tankOf('neon-tetra')).toMatch(/^small-[56]$/);
    expect(tankOf('clownfish')).toBe('small-7');
    // every fish has a tank, the small ones at most five to a tank
    const per = new Map<string, number>();
    for (const id of FISH_IDS) per.set(tankOf(id), (per.get(tankOf(id)) ?? 0) + 1);
    for (const [t, n] of per) if (t.startsWith('small')) expect(n, t).toBeLessThanOrEqual(5);
    expect([...per.keys()].sort()).toEqual(['deep', 'river', 'sea', 'small-1', 'small-2', 'small-3', 'small-4', 'small-5', 'small-6', 'small-7', 'small-8']);
  });
});

describe('the garden (how each bug lives)', () => {
  test('flyers on the paths, perchers on the trunks (the palm beetles on the palm), crawlers by their ground', () => {
    expect(habitatOf('common-butterfly')).toBe('fly');
    expect(habitatOf('darner-dragonfly')).toBe('dart');
    expect(habitatOf('firefly')).toBe('drift');
    expect(habitatOf('robust-cicada')).toBe('trunk');
    expect(habitatOf('golden-stag')).toBe('palm');
    expect(habitatOf('ladybug')).toBe('flower');
    expect(habitatOf('stinkbug')).toBe('flower');
    expect(habitatOf('grasshopper')).toBe('hop');
    expect(habitatOf('pondskater')).toBe('water');
    expect(habitatOf('snail')).toBe('leaf');
    expect(habitatOf('tarantula')).toBe('terrarium');
    expect(habitatOf('hermit-crab')).toBe('terrarium');
    expect(habitatOf('mole-cricket')).toBe('terrarium');
    expect(habitatOf('tiger-beetle')).toBe('ground');
    expect(habitatOf('bagworm')).toBe('dangle');
  });
});
