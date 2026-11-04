import { describe, expect, it } from 'vitest';
import { TALLY_MAX_KEYS, TALLY_MAX_N, isTally, isTallyKey, mergeTally } from '#lib/contract/tally.ts';
import { isFind } from '#lib/contract/api.ts';
import { addDays } from '#lib/time/dates.ts';
import type { PersonId } from '#lib/types.ts';
import { addToTally, countOf, dayTallies, tallyTotals, type TallyRow } from './tally.ts';

const row = (at: number, person: PersonId, date: string, counts: Record<string, number>): TallyRow => ({ at, person, date, counts });

describe('a tally’s data (contract/tally.ts isTally: the Apps Script and the model)', () => {
  const ok = { date: '2026-11-01', counts: { 'fish:sea-bass': 3, 'item:froggy-chair': 1, 'recipe:mush-lamp': 1, 'fragment:star-fragment': 2 } };
  it('takes a day and its counts', () => {
    expect(isTally(ok)).toBe(true);
    expect(isTally(ok, '2026-11-01')).toBe(true);
    expect(isTally({ ...ok, date: '2026-11-02' }, '2026-11-01')).toBe(true); // a phone's clock a little ahead
  });
  it('refuses anything else', () => {
    for (const d of [
      {}, { date: '2026-11-01' }, { counts: ok.counts }, { ...ok, extra: 1 }, { ...ok, date: '2026-02-30' }, { ...ok, date: 20261101 },
      { ...ok, counts: [] }, { ...ok, counts: {} }, { ...ok, counts: { 'fish:Sea Bass': 1 } }, { ...ok, counts: { 'bells:sea-bass': 1 } },
      { ...ok, counts: { 'sea-bass': 1 } }, { ...ok, counts: { 'fish:sea-bass': 0 } }, { ...ok, counts: { 'fish:sea-bass': 1.5 } },
      { ...ok, counts: { 'fish:sea-bass': TALLY_MAX_N + 1 } }, { ...ok, counts: { 'fish:sea-bass': '3' } },
      { ...ok, counts: { [`fish:${'x'.repeat(49)}`]: 1 } },
      { ...ok, counts: Object.fromEntries(Array.from({ length: TALLY_MAX_KEYS + 1 }, (_, i) => [`item:x${i}`, 1])) }
    ]) expect(isTally(d as Record<string, unknown>), JSON.stringify(d).slice(0, 80)).toBe(false);
    expect(isTally({ ...ok, date: '2026-11-03' }, '2026-11-01')).toBe(false); // the future
  });
  it('stays under the event data limit at its caps', () => {
    const counts = Object.fromEntries(Array.from({ length: TALLY_MAX_KEYS }, (_, i) => [`item:${'x'.repeat(40)}${i}`.slice(0, 53), TALLY_MAX_N]));
    expect(isTally({ date: '2026-11-01', counts })).toBe(true);
    expect(JSON.stringify({ date: '2026-11-01', counts }).length).toBeLessThan(20_000);
  });
  it('takes the ids a find takes', () => {
    for (const id of ['sea-bass', 't-rex-skull', 'x'.repeat(48), 'Sea Bass', '7up', 'x'.repeat(49), 'a_b'])
      expect(isTallyKey(`fish:${id}`), id).toBe(isFind({ kind: 'fish', id }));
  });
});

describe('the counts (model/tally.ts)', () => {
  it('a later row of a person’s day replaces the earlier; days and people add up', () => {
    const rows = [
      row(1, 'A', '2026-11-01', { 'fish:sea-bass': 1 }),
      row(2, 'B', '2026-11-01', { 'fish:sea-bass': 2, 'item:froggy-chair': 1 }),
      row(3, 'A', '2026-11-01', { 'fish:sea-bass': 3, 'bug:moth': 1 }), // replaces A's row 1
      row(4, 'A', '2026-11-02', { 'fish:sea-bass': 1 })
    ];
    const t = tallyTotals(rows);
    expect(Object.fromEntries(t.all)).toEqual({ 'fish:sea-bass': 6, 'bug:moth': 1, 'item:froggy-chair': 1 });
    expect(Object.fromEntries(t.by.A)).toEqual({ 'fish:sea-bass': 4, 'bug:moth': 1 });
    expect(Object.fromEntries(t.by.B)).toEqual({ 'fish:sea-bass': 2, 'item:froggy-chair': 1 });
  });
  it('a day’s rows fold by each entry’s largest count, whatever the order (a cache holding a replaced row)', () => {
    const rows = [row(9, 'A', '2026-11-01', { 'fish:dab': 5 }), row(3, 'A', '2026-11-01', { 'fish:dab': 2 })];
    expect(dayTallies(rows)).toEqual([rows[0]]);
    expect(tallyTotals(rows).all.get('fish:dab')).toBe(5);
    // a lower row later (a second phone's, a queue that waited): never a count down, its new entry kept
    const later = [rows[0], row(12, 'A', '2026-11-01', { 'fish:dab': 1, 'bug:moth': 2 })];
    expect(dayTallies(later)).toEqual([row(12, 'A', '2026-11-01', { 'fish:dab': 5, 'bug:moth': 2 })]);
  });
  it('mergeTally: each entry’s larger count, within the key cap', () => {
    expect(mergeTally({ 'fish:dab': 3 }, { 'fish:dab': 1, 'bug:moth': 1 })).toEqual({ 'fish:dab': 3, 'bug:moth': 1 });
    const full = Object.fromEntries(Array.from({ length: TALLY_MAX_KEYS }, (_, i) => [`item:x${i}`, 1]));
    const m = mergeTally(full, { 'item:x0': 4, 'fish:dab': 1 });
    expect(Object.keys(m)).toHaveLength(TALLY_MAX_KEYS);
    expect(m['item:x0']).toBe(4);
    expect(isTally({ date: '2026-11-01', counts: m })).toBe(true);
  });
  it('a found entry counts at least 1 (finds from before tallies, a tally not synced yet), per person too', () => {
    const t = tallyTotals([row(1, 'A', '2026-11-01', { 'fish:dab': 4 })]);
    expect([countOf(t, 'fish:dab', true), countOf(t, 'fish:dab', true, 'B'), countOf(t, 'fish:dab', false, 'B')]).toEqual([4, 1, 0]);
    expect([countOf(t, 'bug:moth', true), countOf(t, 'bug:moth', false)]).toEqual([1, 0]);
  });
  it('is memoised per row list', () => {
    const rows = [row(1, 'A', '2026-11-01', { 'fish:dab': 1 })];
    expect(tallyTotals(rows)).toBe(tallyTotals(rows));
    expect(tallyTotals([...rows])).not.toBe(tallyTotals(rows));
  });
  it('the day’s tally grows by one and keeps within the caps', () => {
    let t = addToTally({}, 'fish:dab');
    t = addToTally(t, 'fish:dab', 2);
    expect(t).toEqual({ 'fish:dab': 3 });
    expect(addToTally({ 'fish:dab': TALLY_MAX_N }, 'fish:dab')).toEqual({ 'fish:dab': TALLY_MAX_N });
    const full = Object.fromEntries(Array.from({ length: TALLY_MAX_KEYS }, (_, i) => [`item:x${i}`, 1]));
    expect(addToTally(full, 'fish:dab')).toBe(full);
    expect(addToTally(full, 'item:x0')['item:x0']).toBe(2);
  });
  it('sums years of rows fast (two people, three years, the latest of several sends a day)', () => {
    const rows: TallyRow[] = [];
    let at = 0, date = '2026-11-01';
    for (let d = 0; d < 3 * 365; d++, date = addDays(date, 1))
      for (const p of ['A', 'B'] as const)
        for (let send = 1; send <= 2; send++)
          rows.push(row(++at, p, date, Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`fish:f${(d + i) % 80}`, send + (i % 3)]))));
    const t0 = performance.now();
    const t = tallyTotals(rows);
    const ms = performance.now() - t0;
    expect(t.all.size).toBe(80);
    expect([...t.all.values()].reduce((s, n) => s + n, 0)).toBe(2 * 3 * 365 * (10 * 2 + 10 * 3 + 10 * 4));
    expect(ms).toBeLessThan(50);
  });
});
