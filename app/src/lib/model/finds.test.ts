import { describe, expect, it } from 'vitest';
import { reduce } from './state.ts';
import { findKey, findsView } from './finds.ts';
import { walletAt, weekBells } from './bells.ts';
import type { EventRow, MetricRow } from '#lib/contract/api.ts';

const ev = (at: string, person: 'A' | 'B', id: string, data: unknown): EventRow => [at, person, id, 'find', JSON.stringify(data)];
const METRICS: MetricRow[] = [
  ['2026-10-26T10:00:00.000Z', 'A', '2026-10-26', 'steps', 9000],
  ['2026-10-26T10:00:00.000Z', 'B', '2026-10-26', 'exercise_min', 70]
];

describe('findsView: the shared ずかん', () => {
  it('keeps the first find of each kind:id across both people, with its Tokyo date and finder', () => {
    const s = reduce({
      metrics: [],
      events: [
        ev('2026-10-27T14:00:00.000Z', 'B', 'e1', { kind: 'fish', id: 'sea-bass' }), // 23:00 Tokyo, the 27th
        ev('2026-10-27T16:00:00.000Z', 'A', 'e2', { kind: 'fish', id: 'sea-bass' }), // 01:00 Tokyo, the 28th: later
        ev('2026-10-28T03:00:00.000Z', 'A', 'e3', { kind: 'fossil', id: 'amber' }),
        ev('2026-10-29T03:00:00.000Z', 'A', 'e4', { kind: 'shell', id: 'cowrie' })
      ]
    });
    const v = findsView(s);
    expect(v.size).toBe(3);
    expect(v.get(findKey('fish', 'sea-bass'))).toMatchObject({ date: '2026-10-27', person: 'B' });
    expect(v.get(findKey('fossil', 'amber'))).toMatchObject({ date: '2026-10-28', person: 'A' });
    expect(findsView(s, Date.parse('2026-10-28T12:00:00Z')).has(findKey('shell', 'cowrie'))).toBe(false);
    expect(findsView(s)).toBe(v); // memoised per state
  });
  it('ignores a bad kind or id (the model reads only valid finds)', () => {
    const s = reduce({
      metrics: [],
      events: [
        ev('2026-10-27T03:00:00.000Z', 'A', 'b1', { kind: 'bells', id: 'sea-bass' }),
        ev('2026-10-27T03:00:00.000Z', 'A', 'b2', { kind: 'fish', id: 'Sea Bass' }),
        ev('2026-10-27T03:00:00.000Z', 'A', 'b3', { kind: 'fish' }),
        ev('2026-10-27T03:00:00.000Z', 'A', 'b4', { kind: 'bug', id: 'x'.repeat(49) })
      ]
    });
    expect(findsView(s).size).toBe(0);
  });
  it('a find never changes ベル: earnings and the wallet are the same with or without finds', () => {
    const finds = Array.from({ length: 40 }, (_, i) => ev(`2026-10-27T0${i % 10}:00:00.000Z`, i % 2 ? 'A' : 'B', `f${i}`, { kind: 'bug', id: `bug-${i}` }));
    const now = Date.parse('2026-10-31T12:00:00Z');
    const plain = reduce({ metrics: METRICS, events: [] }), found = reduce({ metrics: METRICS, events: finds });
    expect(found.finds).toHaveLength(40);
    expect(weekBells(found, '2026-10-26', now)).toEqual(weekBells(plain, '2026-10-26', now));
    expect(walletAt(found, now).wallet).toEqual(walletAt(plain, now).wallet);
  });
});
