// Golden test: the WeekView of the ベル economy (ADR 0019) on a 10-week timeline of real-shaped rows, so any change to
// what the island, the wallet or the harvest show is a reviewed diff.
//
// History: the fixtures were first frozen from the old Mac server (ADR 0015) and pinned the yen engine. On 2026-10-30
// the yen engine was removed (ADR 0019 §6) and the views were regenerated from the model: the diff only dropped the
// old fields (score, jar, fruit milli/pct, harvest payout/rungs), added harvest.badges and the pots' today/week flow.
// ベル spends, voids and a menu edit were appended to the rows (ids b1–b9) so the pots are exercised too. ADR 0021
// (2026-10-30): a move_kcal and a stand_min row were added next to every steps row (6% of the steps in kcal, steps / 45
// stand minutes, so they only go up like the steps), plus Move goals (g1–g3) and late Move/Stand fixes (g4, g5). The
// rows of past designs (checkin, confirm, share, approve, transfer, yen spends, presence leave) were then deleted, as
// `cleanupLegacyData` does to the sheet: every view and digest stayed the same. ADR 0022 (one wallet): the b1–b9 buys
// lost their pot (the trip ones now buy a special meal and a room upgrade) and the menu edit became a `menu` pref.
// - fixtures/timeline-rows.json: the sheet rows (both people, every row stamped with its server `at`). The view at
//   instant t is built from the rows with `at <= t`.
// - fixtures/timeline-views.json: the full WeekView for A and B at 50 key instants (Sunday 19:29/19:31, Monday 00:01,
//   Wednesday 03:59/04:01 JST, every week): readable diffs when something changes.
// - fixtures/timeline-digests.json: a sha256 (16 hex) of the canonical JSON of the WeekView for A and B at every
//   checkpoint (every 3 h + the key instants, 660 instants): catches a change anywhere else.
// - fixtures/server-facts.json: the old server's workout labels and a week that late data lowered before its lock.
//
// If a change to the rules is intended, regenerate the goldens and review the diff of timeline-views.json:
// `GOLDEN_UPDATE=1 npx vitest run src/lib/model/golden.test.ts` (keeps the same instants).
import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import type { PersonId, WeekView } from '#lib/types.ts';
import { DEFAULT_MENU } from '#lib/config/rules.ts';
import { buildWeekView } from './week.ts';
import { bellsLedger, weekBells } from './bells.ts';
import { provisionalMs, reduce } from './state.ts';
import { WORKOUT_TYPES, workoutLabel } from '#lib/contract/labels.ts';
import type { SnapshotRows } from '#lib/contract/api.ts';
import rowsJson from './fixtures/timeline-rows.json' with { type: 'json' };
import viewsJson from './fixtures/timeline-views.json' with { type: 'json' };
import digestsJson from './fixtures/timeline-digests.json' with { type: 'json' };
import facts from './fixtures/server-facts.json' with { type: 'json' };

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
  return { metrics: upTo(ROWS.metrics), workouts: upTo(ROWS.workouts), presence: upTo(ROWS.presence), events: upTo(ROWS.events) };
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
    // Badges but never all five for both (the ふたりボーナス is covered by bells.test.ts).
    expect(all.some((v) => v.harvest && v.harvest.bonus.A > 0 && v.harvest.bonus.B > 0)).toBe(true);
    expect(all.some((v) => v.harvest?.bonus.A === 0 && v.harvest.bonus.B === 0)).toBe(true);
    // ADR 0021: Move and Stand earn (rows derived from the steps, appended g1–g5: two Move goals and late Move/Stand fixes),
    // old check-in and confirm rows are ignored, and nothing is ever asked.
    expect(all.some((v) => v.people.A.rings.pear.todayBells > 0 && v.people.B.rings.cherry.todayBells > 0)).toBe(true);
    expect(all.some((v) => v.harvest?.ringBadges.A.cherry || v.harvest?.ringBadges.B.cherry)).toBe(true);
    expect(new Set(all.map((v) => v.people.A.moveGoal))).toEqual(new Set([600, 500]));
    expect(new Set(all.map((v) => v.people.B.moveGoal))).toEqual(new Set([400, 300]));
    expect(all.some((v) => v.wallet.spent > 0)).toBe(true);
    expect(all.some((v) => v.menu.some((x) => x.id === 'taiyaki'))).toBe(true);
    const end = bellsLedger(reduce(ROWS), END);
    expect(end.spends.map((x) => [x.spendId, x.voided])).toEqual([['bs-taiyaki', false], ['bs-daytrip', false], ['bs-ice', false], ['bs-cafe', true], ['bs-early', false]]); // bs-upgrade (160,000) is refused
    expect(DEFAULT_MENU.some((x) => x.id === 'taiyaki')).toBe(false);
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
      const earned = l.days.reduce((n, d) => n + d.bells, 0) + l.bonuses.reduce((n, b) => n + b.bells, 0);
      expect(l.earned, t).toBe(earned);
      for (const me of PEOPLE) {
        const v = buildWeekView(s, me, tMs);
        expect(v.wallet, t).toMatchObject(l.wallet);
        expect(v.wallet.earned).toBe(l.earned);
        const h = v.harvest;
        if (h && provisionalMs(h.weekKey) <= tMs) expect(h.ringBadges, `${t} badges`).toEqual(l.bonuses.find((b) => b.weekKey === h.weekKey)!.ringBadges);
      }
    }
  });

  it('late data before the lock lowers a week; after the lock the week is fixed', () => {
    const { week, at } = facts.lateLower;
    const t = Date.parse(at);
    const atHarvest = weekBells(reduce(rowsAt(provisionalMs(week) + 60_000)), week, provisionalMs(week) + 60_000);
    const atLock = weekBells(reduce(rowsAt(t)), week, t);
    expect(atLock.B.daily).toBeLessThan(atHarvest.B.daily);
    expect(weekBells(reduce(ROWS), week, END)).toEqual(atLock);
  });
});

describe('labels', () => {
  it('match the server workout labels', () => {
    const labels = facts.labels as Record<string, { ja: string; en: string }>;
    for (const ty of [...WORKOUT_TYPES, 'Unknown Thing']) for (const l of ['ja', 'en'] as const) expect(workoutLabel(ty, l)).toBe(labels[ty][l]);
  });
});
