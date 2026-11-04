// The guest in the model (docs/design.md "The guest"): its finds, tallies and cosmetic prefs are its own (`G`), the
// first find of each entry goes to whoever found it first (by `at`, a tie to A, then B, then G), the counts add up per
// person, and nothing of the guest's touches the economy; the guest's view is the members' as either would see it.
import { describe, expect, it } from 'vitest';
import { reduce } from './state.ts';
import { findsView } from './finds.ts';
import { countOf, tallyTotals } from './tally.ts';
import { buildWeekView } from './week.ts';
import { weekBells } from './bells.ts';
import { guestRows } from '#lib/contract/guest.ts';
import type { EventRow, MetricRow, SnapshotRows } from '#lib/contract/api.ts';
import type { Who } from '#lib/types.ts';

const WK = '2026-11-09';
const at = (date: string, hm = '12:00') => new Date(`${date}T${hm}:00+09:00`).toISOString();
let n = 0;
const ev = (when: string, person: Who, type: string, data: object): EventRow => [when, person, `e${++n}`, type as EventRow[3], JSON.stringify(data)];

describe('the guest’s rows', () => {
  const rows: SnapshotRows = {
    metrics: [
      [at(WK, '08:00'), 'A', WK, 'steps', 9000], [at(WK, '08:00'), 'A', WK, 'weight', 68.4],
      [at(WK, '08:00'), 'G' as 'A', WK, 'steps', 30000] // never: the guest has no health
    ],
    events: [
      ev(at(WK, '09:00'), 'B', 'find', { kind: 'fish', id: 'koi' }),
      ev(at(WK, '09:30'), 'G', 'find', { kind: 'fish', id: 'koi' }), // second: B's stays the first
      ev(at(WK, '10:00'), 'G', 'find', { kind: 'bug', id: 'common-butterfly' }),
      ev(at(WK, '10:01'), 'G', 'tally', { date: WK, counts: { 'bug:common-butterfly': 3, 'fish:koi': 1 } }),
      ev(at(WK, '10:02'), 'A', 'tally', { date: WK, counts: { 'bug:common-butterfly': 2 } }),
      ev(at(WK, '10:03'), 'B', 'tally', { date: WK, counts: { 'fish:koi': 4 } }),
      ev(at(WK, '11:00'), 'G', 'pref', { key: 'villager', value: 'judy' }),
      ev(at(WK, '11:00'), 'G', 'pref', { key: 'villagerName', value: 'ゆき' }),
      ev(at(WK, '11:01'), 'G', 'pref', { key: 'goalWeight', value: 50 }),
      ev(at(WK, '11:01'), 'G', 'pref', { key: 'goalBodyFat', value: 20 }),
      ev(at(WK, '11:02'), 'G', 'pref', { key: 'moveGoal', value: 300 }),
      ev(at(WK, '11:03'), 'G', 'spend', { spendId: 'x', item: 'snack', bells: 40 }),
      ev(at(WK, '11:04'), 'G', 'harvest', { week: WK }),
      ev(at(WK, '11:05'), 'G', 'decor', { sc: 't', id: 'dg1abc23', at: Date.parse(at(WK, '11:05')), item: 'f1234', x: 2, z: 3, f: 0, p: Date.parse(at(WK, '11:05')) })
    ]
  };
  const s = reduce(rows);

  it('credits the guest with its finds and tallies; the first find is the earliest’s', () => {
    const f = findsView(s);
    expect(f.get('fish:koi')?.person).toBe('B');
    expect(f.get('bug:common-butterfly')?.person).toBe('G');
    const t = tallyTotals(s.tallies);
    expect(countOf(t, 'bug:common-butterfly', true, 'G')).toBe(3);
    expect(countOf(t, 'bug:common-butterfly', true, 'A')).toBe(2);
    expect(countOf(t, 'bug:common-butterfly', true)).toBe(5);
    expect(countOf(t, 'fish:koi', true)).toBe((t.by.A.get('fish:koi') ?? 0) + (t.by.B.get('fish:koi') ?? 0) + (t.by.G.get('fish:koi') ?? 0));
    expect(s.tent.map((e) => e.who)).toEqual(['G']);
  });

  it('a tie in `at` goes to A, then B, then the guest', () => {
    const t = at(WK, '09:00');
    const tie = reduce({ metrics: [], events: [ev(t, 'G', 'find', { kind: 'sea', id: 'octopus' }), ev(t, 'B', 'find', { kind: 'sea', id: 'octopus' })] });
    expect(findsView(tie).get('sea:octopus')?.person).toBe('B');
  });

  it('keeps only the guest’s look and name; its goals, buys, harvests and health are nothing', () => {
    expect(s.prefs.G).toEqual({ villager: 'judy', villagerName: 'ゆき' });
    expect(s.bellSpends).toEqual([]);
    expect(s.harvests).toEqual([]);
    expect([s.dailyGoals.A.move, s.dailyGoals.B.move]).toEqual([[], []]);
    expect(Object.keys(s.metrics)).toEqual(['A', 'B']);
    expect(weekBells(s, WK, Date.parse(at(WK, '23:00'))).A.days.find((d) => d.date === WK)?.steps).toBe(9000);
  });

  it('the guest’s view: the members’ as A’s, its own language and name, viewer G', () => {
    const now = Date.parse(at(WK, '23:00'));
    const g = buildWeekView(s, 'G', now);
    const a = buildWeekView(s, 'A', now);
    expect(g.viewer).toBe('G');
    expect(g.guest).toEqual({ villagerName: 'ゆき', villager: 'judy' });
    expect({ ...g, viewer: 'A', host: a.host }).toEqual(a);
    expect(a.guest.villagerName).toBe('ゆき'); // the members draw it so too
    expect(buildWeekView(reduce({ metrics: [], events: [] }), 'A', now).guest).toEqual({ villagerName: 'おきゃくさん', villager: null });
  });
});

describe('guestRows (the record’s filter, contract/guest.ts)', () => {
  const metrics: MetricRow[] = (['steps', 'exercise_min', 'move_kcal', 'stand_min', 'weight', 'body_fat_pct', 'bmi', 'lean_kg'] as const)
    .map((m, i) => [at(WK), 'A', WK, m, 10 + i]);
  const events = [
    ev(at(WK), 'A', 'pref', { key: 'goalWeight', value: 65 }),
    ev(at(WK), 'B', 'pref', { key: 'goalBodyFat', value: 22.5, person: 'A' }),
    ev(at(WK), 'A', 'pref', { key: 'moveGoal', value: 650 }),
    ev(at(WK), 'B', 'spend', { spendId: 's', item: 'snack', bells: 40 }),
    ev(at(WK), 'B', 'find', { kind: 'fish', id: 'koi' })
  ];
  it('keeps the activity and every event but the からだ goals (weight, body fat); never a からだ row', () => {
    const g = guestRows({ metrics, events });
    expect(g.metrics.map((r) => r[3])).toEqual(['steps', 'exercise_min', 'move_kcal', 'stand_min']);
    expect(g.events).toEqual(events.slice(2));
    const s = reduce(g);
    expect([...s.weights.A.values()]).toEqual([]);
    expect([...s.body.A.body_fat_pct.values(), ...s.body.A.bmi.values(), ...s.body.A.lean_kg.values()]).toEqual([]);
    expect(s.prefs.A.goalWeight).toBeUndefined();
    expect(s.prefs.A.goalBodyFat).toBeUndefined();
    expect(JSON.stringify(g)).not.toContain('goalBodyFat');
  });
});
