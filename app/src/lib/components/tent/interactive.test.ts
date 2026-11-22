// The pieces that do something (tent/interactive.ts): the set is the union of the tables the room's tap reads, each in
// one sub-filter, every sub-filter with pieces.
import { describe, expect, it } from 'vitest';
import { DOES, INTERACTIVE, doesOf } from './interactive.ts';
import { ITEMS } from './items.ts';
import { GADGETS, INSTRUMENTS, SWITCHED, codesOf, type Family } from './toggles.ts';
import { MUSIC_PLAYERS } from './stereo.ts';
import { ACT_PIECES, STAND_PIECES } from '../world3d/heldProps.ts';
import seats3d from '../villager3d/seats3d.json' with { type: 'json' };
import seatsMore from './seats-more.json' with { type: 'json' };

describe('INTERACTIVE', () => {
  it('is every piece of the tables: stood at, one-offs, seats/beds/uses, the families, the music players, the lamps', () => {
    const families: Family[] = [...INSTRUMENTS, ...SWITCHED, ...GADGETS, 'closet', 'toy', 'dress', 'clock', 'bin'];
    const union = new Set([
      ...Object.keys(STAND_PIECES), ...Object.keys(ACT_PIECES), ...Object.keys(seats3d.tent), ...Object.keys(seatsMore.tent),
      ...families.flatMap(codesOf),
      ...Object.keys(ITEMS).filter((c) => ITEMS[c].u || ITEMS[c].lt || MUSIC_PLAYERS.has(ITEMS[c].cat ?? ''))
    ].filter((c) => ITEMS[c]));
    expect(new Set(INTERACTIVE.keys())).toEqual(union);
    expect(INTERACTIVE.size).toBeGreaterThan(800);
  });
  it('each in one sub-filter, every sub-filter with pieces', () => {
    const n = new Map<string, number>();
    for (const d of INTERACTIVE.values()) n.set(d, (n.get(d) ?? 0) + 1);
    for (const d of DOES) expect(n.get(d), d).toBeGreaterThan(0);
  });
  it('by what the tap does first', () => {
    expect(doesOf('f4038')).toBe('sit'); // the log stool
    expect(doesOf('f4041')).toBe('sit'); // the log bed
    expect(doesOf('f290')).toBe('use'); // the treadmill
    expect(doesOf('f292')).toBe('work'); // a stove: cooked at
    expect(doesOf('f937')).toBe('use'); // the dartboard: a one-off
    expect(doesOf(codesOf('keys')[0])).toBe('music');
    expect(doesOf('f1009')).toBe('switch'); // a screen
    expect(doesOf('f4037')).toBe('other'); // a clock
    expect(doesOf('f1816')).toBe('dress');
    expect([...INTERACTIVE].some(([c, d]) => d === 'ride' && /drive|board/.test(String((seats3d.tent as Record<string, { use?: string }>)[c]?.use)))).toBe(true);
    expect(doesOf('w1')).toBeNull();
  });
});
