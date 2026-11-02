import { describe, expect, test } from 'vitest';
import { LAYOUT_MAX, layoutAccept, layoutOpOf, mergeLayout, scopeMayWrite, type LayoutEntry } from './layout.ts';
import { guestMayWrite } from './guest.ts';
import { tentAccept, tentOpOf, type TentEntry } from './tent.ts';
import { parseClient, scopeMaySend } from '../sync/live-protocol.ts';
import { validEventData, eventSlot } from '../model/record.ts';

const T0 = 1_800_000_000_000;

describe('layout ops (contract/layout.ts)', () => {
  test('parse: each scope, its known keys only', () => {
    expect(layoutOpOf({ sc: 'o', id: 'goal-A', at: T0, k: 'goal-tree', x: 3, z: 10, f: 0, s: 'a' })).toEqual({ sc: 'o', id: 'goal-A', at: T0, k: 'goal-tree', x: 3, z: 10, f: 0, s: 'a' });
    expect(layoutOpOf({ sc: 'o', id: 'fl:52:180', at: T0, rm: true })).toEqual({ sc: 'o', id: 'fl:52:180', at: T0, rm: true });
    expect(layoutOpOf({ sc: 'c', id: 'c2x5', at: T0, g: '4'.repeat(64) })).not.toBeNull();
    expect(layoutOpOf({ sc: 'r', id: 'reset', at: T0 })).not.toBeNull();
    expect(layoutOpOf({ sc: 'h', id: 'hB', at: T0, m: 'house', w: 'NAStucco.A', r: 'NATile.A', d: 'Simple.R.A' })).not.toBeNull();
    for (const bad of [
      { sc: 'o', id: 'x', at: T0, k: 'oak', x: 64, z: 0, f: 0 },
      { sc: 'o', id: 'x', at: T0, k: 'oak', x: 0, z: 0, f: 4 },
      { sc: 'o', id: 'x', at: T0, k: 'Oak', x: 0, z: 0, f: 0 },
      { sc: 'o', id: 'x', at: T0, k: 'oak', x: 0, z: 0, f: 0, extra: 1 },
      { sc: 'o', id: 'x', at: T0, rm: false },
      { sc: 'c', id: 'c8x0', at: T0, g: '4'.repeat(64) },
      { sc: 'c', id: 'c0x0', at: T0, g: '4'.repeat(63) },
      { sc: 'r', id: 'other', at: T0 },
      { sc: 'h', id: 'hC', at: T0, m: 'house' },
      { sc: 'h', id: 'hA', at: T0, m: 'house', w: 'bad part!' },
      { sc: 'o', id: 'x', at: 5, k: 'oak', x: 0, z: 0, f: 0 }
    ])
      expect(layoutOpOf(bad), JSON.stringify(bad)).toBeNull();
  });

  test('who may write what (the record and the room alike)', () => {
    const cases: [Record<string, unknown>, string][] = [
      [{}, 'AB'], [{ sc: 'o' }, 'AB'], [{ sc: 'c' }, 'AB'], [{ sc: 'r' }, 'AB'],
      [{ sc: 'h', id: 'hA' }, 'A'], [{ sc: 'h', id: 'hB' }, 'B'], [{ sc: 'h', id: 'hG' }, 'ABG'],
      [{ sc: 't' }, 'ABG'], [{ sc: 'u' }, 'B'], [{ sc: 'v' }, 'G'], [{ sc: 'q' }, '']
    ];
    for (const [d, may] of cases)
      for (const who of ['A', 'B', 'G'] as const) {
        expect(scopeMayWrite(who, d), `${who} ${JSON.stringify(d)}`).toBe(may.includes(who));
        expect(scopeMaySend(who, d.sc as string | undefined, (d.id as string) ?? 'x'), `send ${who} ${JSON.stringify(d)}`).toBe(may.includes(who));
      }
    expect(guestMayWrite('decor', { sc: 'o', id: 'x' })).toBe(false);
    expect(guestMayWrite('decor', { sc: 'v', id: 'x' })).toBe(true);
    expect(guestMayWrite('decor', { sc: 'h', id: 'hG' })).toBe(true);
    expect(guestMayWrite('decor', { sc: 'h', id: 'hA' })).toBe(false);
  });

  test('the merge: later wins, then a removal, then G over B over A', () => {
    const m = new Map<string, LayoutEntry>();
    const set = (who: 'A' | 'B' | 'G', at: number, x: number) => ({ sc: 'o', id: 'oak', at, k: 'oak', x, z: 0, f: 0, who }) as LayoutEntry;
    expect(mergeLayout(m, set('A', T0, 1))).toBe(true);
    expect(mergeLayout(m, set('A', T0 - 1, 2))).toBe(false);
    expect(mergeLayout(m, set('B', T0, 3))).toBe(true);
    expect(mergeLayout(m, set('A', T0, 4))).toBe(false);
    expect(mergeLayout(m, { sc: 'o', id: 'oak', at: T0, rm: true, who: 'A' })).toBe(true);
    expect(mergeLayout(m, set('A', T0 + 1, 5))).toBe(true);
    expect((m.get('o|oak') as { x: number }).x).toBe(5);
  });

  test('the record: stale, void by a reset, or past the cap', () => {
    const held: LayoutEntry[] = [{ sc: 'r', id: 'reset', at: T0, who: 'A' }];
    expect(layoutAccept(held, { sc: 'o', id: 'a', at: T0 - 1, k: 'oak', x: 0, z: 0, f: 0, who: 'A' })).toBe('stale');
    expect(layoutAccept(held, { sc: 'o', id: 'a', at: T0 + 1, k: 'oak', x: 0, z: 0, f: 0, who: 'A' })).toBe('append');
    const full: LayoutEntry[] = Array.from({ length: LAYOUT_MAX }, (_, i) => ({ sc: 'o', id: `o${i}`, at: T0 + i, k: 'oak', x: 0, z: 0, f: 0, who: 'A' }) as LayoutEntry);
    expect(layoutAccept(full, { sc: 'o', id: 'new', at: T0 + 9e6, k: 'oak', x: 0, z: 0, f: 0, who: 'A' })).toBe('full');
    expect(layoutAccept(full, { sc: 'o', id: 'o3', at: T0 + 9e6, k: 'oak', x: 1, z: 0, f: 0, who: 'A' })).toBe('append');
  });

  test('a home’s room is its own: its own ids, its own cap', () => {
    const piece = (sc: string, id: string) => tentOpOf({ sc, id, at: T0, item: 'f1', x: 0, z: 0, f: 0, p: T0 })!;
    const held = Array.from({ length: 40 }, (_, i) => ({ ...piece('t', `dpiece${String(i).padStart(3, '0')}`), who: 'A' }) as TentEntry);
    expect(tentAccept(held, { ...piece('t', 'dpiecenew'), who: 'A' } as TentEntry)).toBe('full');
    expect(tentAccept(held, { ...piece('u', 'dpiecenew'), who: 'B' } as TentEntry)).toBe('append');
  });

  test('the record keeps one row per scope and id', () => {
    expect(validEventData('decor', { sc: 'o', id: 'goal-A', at: T0, k: 'goal-tree', x: 3, z: 10, f: 0, s: 'a' }, T0)).toBe(true);
    expect(validEventData('decor', { sc: 'u', id: 'dpiece123', at: T0, item: 'f1', x: 0, z: 0, f: 0, p: T0 }, T0)).toBe(true);
    expect(eventSlot('decor', 'A', 'A', { sc: 'o', id: 'goal-A' }, T0)).toBe('decor|o|goal-A');
    expect(eventSlot('decor', 'A', 'A', { sc: 't', id: 'dx' }, T0)).toBe('decor|t|dx');
    expect(eventSlot('decor', 'A', 'A', { id: 'dx' }, T0)).toBe('decor||dx');
  });
});

describe('layout intents on the wire (sync/live-protocol.ts)', () => {
  const parse = (m: object) => parseClient(JSON.stringify({ v: 3, ...m }));
  test('an outdoor op, a chunk, a reset, a home look, a room of うめ’s', () => {
    expect(parse({ kind: 'decor', sc: 'o', id: 'goal-A', at: T0, k: 'goal-tree', x: 3, z: 10, f: 1, s: 'a' })).toMatchObject({ kind: 'decor', sc: 'o', id: 'goal-A', x: 3 });
    expect(parse({ kind: 'decor', sc: 'c', id: 'c0x0', at: T0, g: '4'.repeat(64) })).toMatchObject({ sc: 'c' });
    expect(parse({ kind: 'decor', sc: 'r', id: 'reset', at: T0 })).toMatchObject({ sc: 'r' });
    expect(parse({ kind: 'decor', sc: 'h', id: 'hB', at: T0, m: 'house', w: 'NAStucco.A' })).toMatchObject({ sc: 'h', w: 'NAStucco.A' });
    expect(parse({ kind: 'decor', sc: 'u', id: 'dpiece123', at: T0, item: 'f1', x: 0, z: 0, f: 0, p: T0 })).toMatchObject({ sc: 'u' });
    expect(parse({ kind: 'drag', sc: 'o', id: 'goal-A', x: 100, z: 300, f: 0 })).toMatchObject({ sc: 'o', x: 100 });
    expect(parse({ kind: 'decor', sc: 'o', id: 'goal-A', at: T0, k: 'goal-tree', x: 99, z: 10, f: 1 })).toBeNull();
    expect(parse({ kind: 'decor', sc: 'c', id: 'c0x0', at: T0, g: 'nope' })).toBeNull();
  });
});
