// What the museum shows and where (museum/species.ts): the ずかん's first finds, each fish in its tank, each bug in its
// place.
import { describe, expect, test } from 'vitest';
import { findKey, findsView, type FirstFind } from '#lib/model/finds.ts';
import { reduce } from '#lib/model/state.ts';
import type { EventRow } from '#lib/contract/api.ts';
import { entries } from '../kiroku/zukan.ts';
import { BUG_IDS, FISH_IDS, PER_TANK, habitatOf, hourOf, onDisplay, onShow, tankOf, type Specimen } from './species.ts';
import { TANKS } from './tanks.ts';

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
  test('the ずかん’s, never the pocket’s: everything caught sold, the museum the same', () => {
    const ev = (hm: string, type: string, data: object, id: string): EventRow => [`2026-11-04T${hm}:00+09:00`, 'A', id, type as EventRow[3], JSON.stringify(data)];
    const caught = [
      ev('09:00', 'find', { kind: 'fish', id: 'koi' }, 'e1'), ev('09:01', 'find', { kind: 'bug', id: 'tarantula' }, 'e2'),
      ev('09:02', 'tally', { date: '2026-11-04', counts: { 'fish:koi': 3, 'bug:tarantula': 1 } }, 'e3')
    ];
    const sold = [...caught, ev('10:00', 'sell', { species: 'fish:koi', n: 3, v: 120 }, 'e4'), ev('10:01', 'sell', { species: 'bug:tarantula', n: 1, v: 80 }, 'e5')];
    const shown = (events: EventRow[]) => onShow(findsView(reduce({ metrics: [], events }, null))).map((x) => x.id);
    expect(shown(caught)).toEqual(['koi', 'tarantula']);
    expect(shown(sold)).toEqual(shown(caught));
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
  test('the little ones by their water: the pond’s and the stream’s in the river tank, the tropical and the reef’s in the sea’s; every tank one that stands', () => {
    for (const id of ['goldfish', 'neon-tetra', 'crucian-carp', 'tadpole', 'frog', 'crawfish', 'mitten-crab', 'piranha']) expect(tankOf(id), id).toBe('river');
    for (const id of ['clownfish', 'sea-horse', 'anchovy', 'horse-mackerel']) expect(tankOf(id), id).toBe('sea');
    expect([...new Set(FISH_IDS.map(tankOf))].sort()).toEqual(TANKS.map((t) => t.id).sort());
  });
});

describe('the hour’s pick (onDisplay)', () => {
  const all = onShow(new Map(FISH_IDS.map((id) => [findKey('fish', id), found('A')])));
  const at = (iso: string) => hourOf(Date.parse(iso));
  const ids = (m: Map<string, Specimen[]>) => [...m.entries()].map(([t, l]) => [t, l.map((s) => s.id)] as const);
  test('five at most a tank, only its own and only what was caught, none twice in the aquarium', () => {
    const caught = all.filter((s, i) => i % 3 === 0);
    for (let h = 0; h < 48; h++) {
      const pick = onDisplay(caught, at('2026-11-04T00:00+09:00') + h);
      const seen = new Set<string>();
      for (const [tank, list] of pick) {
        expect(list.length).toBeLessThanOrEqual(PER_TANK);
        expect(list.length).toBe(Math.min(PER_TANK, caught.filter((s) => s.tank === tank).length));
        for (const s of list) {
          expect(s.tank).toBe(tank);
          expect(caught).toContain(s);
          expect(seen.has(s.id), s.id).toBe(false);
          seen.add(s.id);
        }
      }
    }
  });
  test('the same on every phone (by the Tokyo hour, whatever order the finds come in); a new pick the next hour', () => {
    const h = at('2026-11-04T12:30+09:00');
    expect(ids(onDisplay(all, h))).toEqual(ids(onDisplay([...all].reverse(), h)));
    expect(ids(onDisplay(all, at('2026-11-04T12:00+09:00')))).toEqual(ids(onDisplay(all, at('2026-11-04T12:59+09:00'))));
    // (03:00 UTC is 12:00 in Tokyo)
    expect(at('2026-11-04T03:10Z')).toBe(at('2026-11-04T12:10+09:00'));
    const next = onDisplay(all, h + 1), now = onDisplay(all, h);
    for (const t of ['sea', 'river'] as const) expect(next.get(t)!.map((s) => s.id), t).not.toEqual(now.get(t)!.map((s) => s.id));
    // over a day every sea fish caught swims now and then
    const swum = new Set<string>();
    for (let k = 0; k < 24 * 7; k++) for (const s of onDisplay(all, h + k).get('sea')!) swum.add(s.id);
    expect(swum.size).toBe(all.filter((s) => s.tank === 'sea').length);
  });
  test('a tank with none of its own caught stays empty; nothing caught, nothing swims', () => {
    const one = all.filter((s) => s.id === 'koi');
    const pick = onDisplay(one, at('2026-11-04T12:00+09:00'));
    expect(ids(pick)).toEqual([['sea', []], ['deep', []], ['river', ['koi']]]);
    expect([...onDisplay([], 0).values()].flat()).toEqual([]);
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
