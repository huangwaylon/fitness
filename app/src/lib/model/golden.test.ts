// Golden test: the compute-on-read model must keep reproducing what the old Mac server returned (WeekView incl. the
// earn + top-up ledger, purse, harvest and pending questions) on a 10-week timeline.
//
// The fixtures were frozen from the differential harness (server vs model, all views identical) before the server
// was deleted (ADR 0015):
// - fixtures/timeline-rows.json: the sheet rows of the timeline (both people, every row stamped with its server `at`).
//   The view at instant t is built from the rows with `at <= t`.
// - fixtures/timeline-views.json: the server's full WeekView for A and B at 50 key instants (Sunday 19:29/19:31,
//   Monday 00:01, Wednesday 03:59/04:01 JST, every week): readable diffs when something changes.
// - fixtures/timeline-digests.json: a sha256 (16 hex) of the canonical JSON of the server's WeekView for A and B at
//   every checkpoint (every 3 h + the key instants, 660 instants): catches a change anywhere else.
// - fixtures/server-facts.json: the server's workout labels, the no-claw-back week, and ledger counts.
//
// Intentional model/server differences were already normalised in the goldens: lastSyncAt is the newest appending
// metrics/workouts row; a pending visit's id is `<place>@<arrive ISO>`; a purse spend's id is the client's spendId.
//
// Regenerated from the model on 2026-10-29 for two user decisions, each checked to be the only difference first:
// (1) no privacy: the partner card now carries raw actual/target for every fruit and their eating check-ins
// (`habits`), and WeekView.visibility is gone (old `share` rows are ignored); (2) the default names are
// ウェイ (A) and うめ (B) instead of Bean / Mochi. Round 8 renamed WeekView.juniper → host and its keys juniper.* →
// host.* (regenerated after checking every view and digest matched with the old name restored). Everything else is
// still the frozen server's output.
//
// If a change to the rules is intended, regenerate the goldens from the model and review the diff of
// timeline-views.json (see git history for the original harness, commit bc39eba).
import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import type { PersonId, WeekView } from '#lib/types.ts';
import { buildWeekView, paidAt, settledWeeks } from './week.ts';
import { reduce } from './state.ts';
import { WORKOUT_TYPES, workoutLabel } from './labels.ts';
import type { SnapshotRows } from '#lib/ingest/sheet-api.ts';
import rowsJson from './fixtures/timeline-rows.json' with { type: 'json' };
import viewsJson from './fixtures/timeline-views.json' with { type: 'json' };
import digestsJson from './fixtures/timeline-digests.json' with { type: 'json' };
import facts from './fixtures/server-facts.json' with { type: 'json' };

const ROWS = rowsJson as unknown as SnapshotRows;
const VIEWS = viewsJson as unknown as Record<string, Record<PersonId, WeekView>>;
const DIGESTS = digestsJson as Record<string, Record<PersonId, string>>;
const PEOPLE: PersonId[] = ['A', 'B'];

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

describe('golden: model vs the frozen server views on a 10-week timeline', () => {
  it('the fixtures exercise the interesting paths', () => {
    const all = Object.values(VIEWS).flatMap((v) => PEOPLE.map((p) => v[p]));
    expect(Object.keys(DIGESTS).length).toBe(660);
    expect(Object.keys(VIEWS).length).toBe(50);
    expect(all.some((v) => v.harvest)).toBe(true);
    expect(all.some((v) => v.jar.pendingSpends.length)).toBe(true);
    expect(all.some((v) => v.pending.length)).toBe(true);
    expect(all.some((v) => v.jar.transfer)).toBe(true);
    expect(facts.ledger.topups).toBeGreaterThan(0);
    expect(facts.ledger.spends).toBeGreaterThan(1);
  });

  it('matches the full server WeekView at every key instant, for both people', () => {
    for (const [t, byPerson] of Object.entries(VIEWS)) {
      const v = views(t);
      for (const me of PEOPLE) expect(v[me], `${t} ${me}`).toStrictEqual(byPerson[me]);
    }
  });

  it('matches the server WeekView digest at every checkpoint, for both people', () => {
    const mismatches: string[] = [];
    for (const [t, byPerson] of Object.entries(DIGESTS)) {
      const v = views(t);
      for (const me of PEOPLE) if (digest(v[me]) !== byPerson[me]) mismatches.push(`${t} ${me}`);
    }
    expect(mismatches.slice(0, 10), `${mismatches.length} views differ`).toEqual([]);
  }, 120_000);

  it('the jar keeps the max when late data lowers a week (no claw-back)', () => {
    const { week, at, paidB } = facts.clawback;
    const t = Date.parse(at);
    const w = settledWeeks(reduce(rowsAt(t)), t).find((x) => x.weekKey === week)!;
    expect(w.final!.B).toBeLessThan(w.provisional.B);
    expect(paidAt(w, t).B).toBe(w.provisional.B);
    expect(paidAt(w, t).B).toBe(paidB);
  });
});

describe('labels', () => {
  it('match the server workout labels', () => {
    const labels = facts.labels as Record<string, { ja: string; en: string }>;
    for (const ty of [...WORKOUT_TYPES, 'Unknown Thing']) for (const l of ['ja', 'en'] as const) expect(workoutLabel(ty, l)).toBe(labels[ty][l]);
  });
});
