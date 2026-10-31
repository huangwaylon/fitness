// Golden test: the WeekView of the ベル economy on a 10-week timeline of real-shaped rows, so any change to
// what the island, the wallet or the harvest show is a reviewed diff.
//
// The rows are real-shaped (both people, every row stamped with its server `at`); they include Move goals, late
// Health syncs (one before a lock, one after), a double-counted day corrected by a lower re-sync (A, 12-03: latest
// wins), a lower re-sync after a lock (A, 11-29: the locked week stays put), ふたりでぜんぶ days (11-05, 12-16, 12-20),
// wallet buys, a void, a void by someone else (ignored), buys at a wrong price or of an unknown item (ignored) and a buy
// beyond the wallet (ignored).
// - fixtures/timeline-rows.json: the sheet rows (both people, every row stamped with its server `at`). The view at
//   instant t is built from the rows with `at <= t`.
// - fixtures/timeline-views.json: the full WeekView for A and B at 50 key instants (Sunday 19:29/19:31, Monday 00:01,
//   Wednesday 03:59/04:01 JST, every week): readable diffs when something changes.
// - fixtures/timeline-digests.json: a sha256 (16 hex) of the canonical JSON of the WeekView for A and B at every
//   checkpoint (every 3 h + the key instants, 660 instants): catches a change anywhere else.
//
// If a change to the rules is intended, regenerate the goldens and review the diff of timeline-views.json:
// `GOLDEN_UPDATE=1 npx vitest run src/lib/model/golden.test.ts` (keeps the same instants).
import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import type { PersonId, WeekView } from '#lib/types.ts';
import { buildWeekView } from './week.ts';
import { bellsLedger, weekBells } from './bells.ts';
import { provisionalMs, reduce } from './state.ts';
import type { SnapshotRows } from '#lib/contract/api.ts';
import rowsJson from './fixtures/timeline-rows.json' with { type: 'json' };
import viewsJson from './fixtures/timeline-views.json' with { type: 'json' };
import digestsJson from './fixtures/timeline-digests.json' with { type: 'json' };

const ROWS = rowsJson as unknown as SnapshotRows;
const VIEWS = viewsJson as unknown as Record<string, Record<PersonId, WeekView>>;
const DIGESTS = digestsJson as Record<string, Record<PersonId, string>>;
const PEOPLE: PersonId[] = ['A', 'B'];
const END = Date.parse('2027-01-12T15:00:00Z');

/** JSON with object keys sorted (arrays keep their order), so the digest doesn't depend on key order. */
const canon = (v: unknown): string =>
  JSON.stringify(v, (_k, x) =>
    x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1))) : x);
const digest = (v: unknown) => createHash('sha256').update(canon(v)).digest('hex').slice(0, 16);

/** The sheet as it stood at t: rows the script had stamped by then. */
const AT = new Map<readonly unknown[], number>(Object.values(ROWS).flatMap((tab: (readonly unknown[])[]) => tab.map((r) => [r, Date.parse(String(r[0]))] as const)));
function rowsAt(tMs: number): SnapshotRows {
  const upTo = <T extends readonly unknown[]>(tab: T[]) => tab.filter((r) => AT.get(r)! <= tMs);
  return { metrics: upTo(ROWS.metrics), events: upTo(ROWS.events) };
}

/** Both people's views at t, from one reduce of the rows (the State is shared, as in the app). */
const views = (t: string): Record<PersonId, WeekView> => {
  const tMs = Date.parse(t);
  const s = reduce(rowsAt(tMs));
  return { A: buildWeekView(s, 'A', tMs), B: buildWeekView(s, 'B', tMs) };
};

if (process.env.GOLDEN_UPDATE) {
  const dir = new URL('./fixtures/', import.meta.url);
  const regen = <T>(keys: string[], f: (v: WeekView) => T) =>
    Object.fromEntries(keys.map((t) => { const v = views(t); return [t, { A: f(v.A), B: f(v.B) }]; }));
  const newViews = regen(Object.keys(VIEWS), (v) => v);
  const newDigests = regen(Object.keys(DIGESTS), digest);
  writeFileSync(new URL('timeline-views.json', dir), JSON.stringify(newViews));
  writeFileSync(new URL('timeline-digests.json', dir), JSON.stringify(newDigests));
  Object.assign(VIEWS, JSON.parse(JSON.stringify(newViews)));
  Object.assign(DIGESTS, newDigests);
}

describe('golden: the WeekView on a 10-week timeline', () => {
  it('the fixtures exercise the interesting paths', () => {
    const all = Object.values(VIEWS).flatMap((v) => PEOPLE.map((p) => v[p]));
    expect(Object.keys(DIGESTS).length).toBe(660);
    expect(Object.keys(VIEWS).length).toBe(50);
    // Harvest recaps with and without ふたりでぜんぶ days.
    expect(all.some((v) => v.harvest && v.harvest.togetherDays === 2 && v.harvest.bells.together === 4)).toBe(true);
    expect(all.some((v) => v.harvest && v.harvest.togetherDays === 0 && v.harvest.totalBells > 0)).toBe(true);
    // Four fruits only, everywhere; at most 4 ベル a person a day.
    expect(all.every((v) => PEOPLE.every((p) => Object.keys(v.people[p].rings).join() === 'pear,peach,cherry,apple'))).toBe(true);
    expect(all.every((v) => PEOPLE.every((p) => v.people[p].today.bells >= 0 && v.people[p].today.bells <= 4))).toBe(true);
    // Today's ふたりでぜんぶ, met (Sunday 12-20 19:29) and not.
    expect(all.some((v) => v.together.met && v.together.left === 0 && v.wallet.today === 10)).toBe(true);
    expect(all.some((v) => !v.together.met && v.together.left > 0)).toBe(true);
    // Move and Stand earn, and the Move goal changes (g1–g3).
    expect(all.some((v) => v.people.A.rings.pear.met && v.people.B.rings.cherry.met)).toBe(true);
    expect(new Set(all.map((v) => v.people.A.moveGoal))).toEqual(new Set([600, 500]));
    expect(new Set(all.map((v) => v.people.B.moveGoal))).toEqual(new Set([400, 300]));
    const end = bellsLedger(reduce(ROWS), END);
    // bs-wrong (5 ベル), bs-trip (no such reward) and bs-b23 (a 外食 beyond the wallet: 13 left) are ignored; B's void
    // of A's dinner too.
    expect(end.spends.map((x) => [x.spendId, x.voided]).reverse()).toEqual([
      ['bs-early', false], ['bs-snack', true], ['bs-dinner', false], ['bs-snack-2', false],
      ...['b10', 'b11', 'b12', 'b13', 'b14', 'b15', 'b16', 'b17', 'b18', 'b19', 'b20', 'b21', 'b22'].map((id) => [`bs-${id}`, false])
    ]);
    expect(buildWeekView(reduce(ROWS), 'A', END).wallet.balance).toBe(13);
  });

  it('matches the full WeekView at every key instant, for both people', () => {
    for (const [t, byPerson] of Object.entries(VIEWS)) {
      const v = views(t);
      for (const me of PEOPLE) expect(v[me], `${t} ${me}`).toStrictEqual(byPerson[me]);
    }
  });

  it('matches the WeekView digest at every checkpoint, for both people', () => {
    const mismatches: string[] = [];
    for (const [t, byPerson] of Object.entries(DIGESTS)) {
      const v = views(t);
      for (const me of PEOPLE) if (digest(v[me]) !== byPerson[me]) mismatches.push(`${t} ${me}`);
    }
    expect(mismatches.slice(0, 10), `${mismatches.length} views differ`).toEqual([]);
  }, 120_000);

  it('the island, the wallet and きろく agree at every key instant', () => {
    for (const t of Object.keys(VIEWS)) {
      const tMs = Date.parse(t);
      const s = reduce(rowsAt(tMs));
      const l = bellsLedger(s, tMs);
      const earned = l.days.reduce((n, d) => n + d.bells, 0);
      expect(l.earned, t).toBe(earned);
      for (const me of PEOPLE) {
        const v = buildWeekView(s, me, tMs);
        expect(v.wallet.balance, t).toBe(l.earned - l.spends.reduce((n, x) => (x.voided ? n : n + x.bells), 0));
        const h = v.harvest;
        if (h) expect(h.totalBells, `${t} harvest`).toBe(l.days.filter((d) => d.weekKey === h.weekKey).reduce((n, d) => n + d.bells, 0));
      }
    }
  });

  it('a late sync before the lock raises a week; after the lock the week is fixed', () => {
    const week = '2026-11-16';
    const t = Date.parse('2026-11-24T19:01:00.000Z'); // Wednesday 04:01 JST
    const atHarvest = weekBells(reduce(rowsAt(provisionalMs(week) + 60_000)), week, provisionalMs(week) + 60_000);
    const atLock = weekBells(reduce(rowsAt(t)), week, t);
    const daily = (w: typeof atLock) => w.B.days.reduce((n, d) => n + d.bells, 0);
    expect(daily(atLock)).toBeGreaterThan(daily(atHarvest));
    expect(weekBells(reduce(ROWS), week, END)).toEqual(atLock);
  });

  it('latest wins: a lower re-sync replaces a double-counted day while its week is open; after the lock it changes nothing', () => {
    const inflated = Date.parse('2026-12-04T00:00:00.000Z');
    expect(weekBells(reduce(rowsAt(inflated)), '2026-11-30', inflated).A.days[3].steps).toBe(16608);
    expect(weekBells(reduce(ROWS), '2026-11-30', END).A.days[3].steps).toBe(8400);
    // 11-29's 25,000 (a late sync before its lock) stays in the locked week though a later sync says 7,180
    expect(weekBells(reduce(ROWS), '2026-11-23', END).A.days[6].steps).toBe(25000);
  });
});

