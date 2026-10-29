// Differential test: the compute-on-read model must reproduce the old server's WeekView (incl. the earn + top-up
// ledger, purse, harvest, pending questions and privacy filtering) at every checkpoint of a 10-week timeline, and on
// a copy of the real database. When the server is deleted, freeze these timelines' views as golden files.
//
// Intentional differences (normalised by the harness, not bugs):
// - lastSyncAt: the server stamps every upload; the snapshot has no `uploads` tab, so the model uses the newest
//   metrics/workouts row. An upload that changed nothing (same or lower values) doesn't move it.
// - Ids: a pending visit's id is `<place>@<arrive ISO>` (not the SQLite arrive-event id), and a purse spend's id is
//   the client's `spendId` (any string/number), not an autoincrement.
// - Workouts: the sheet keeps the first row per id (the server overwrote fields on re-send).
// - Live numbers include rows stamped after the phone's `now` (clock skew); settlement cutoffs use `now`.
// - No push: nothing push-related is in the WeekView, so nothing is dropped from it.
import { afterAll, describe, expect, it } from 'vitest';
import { copyFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { PersonId } from '#lib/types.ts';
import { openDb, setDb } from '#lib/server/db/index.ts';
import { setNow } from '#lib/server/clock.ts';
import { runSettlement } from '#lib/server/jobs.ts';
import { getWeekView } from '#lib/server/week.ts';
import { workoutLabel as serverLabel } from '#lib/server/ingest/workout-names.ts';
import { buildWeekView, paidAt, settledWeeks } from './week.ts';
import { finalMs, firstWeek, provisionalMs, reduce } from './state.ts';
import { WORKOUT_TYPES, workoutLabel } from './labels.ts';
import { addDays } from '#lib/scoring/index.ts';
import { Harness, dbToSnapshot } from './testing/oracle.ts';
import { checkpoints, timeline } from './testing/fixtures.ts';

afterAll(() => setNow(null));

describe('differential: model vs server on a 10-week timeline', () => {
  it('produces identical WeekViews at every checkpoint, for both people', () => {
    const h = new Harness();
    const steps = timeline();
    const checks = checkpoints(3);
    let i = 0;
    let compared = 0;
    let lastSyncDiffs = 0;
    const seen = { harvest: 0, topups: 0, pendingSpends: 0, pending: 0, transfer: 0, payday: 0, partnerRaw: 0 };
    const mismatches: string[] = [];
    for (const t of checks) {
      while (i < steps.length && Date.parse(steps[i].t) <= Date.parse(t)) h.apply(steps[i++]);
      for (const me of ['A', 'B'] as PersonId[]) {
        const r = h.check(t, me);
        compared++;
        if (r.lastSyncDiffers) lastSyncDiffs++;
        try {
          expect(r.model).toStrictEqual(r.server);
        } catch (e) {
          mismatches.push(`${t} ${me}: ${(e as Error).message.slice(0, 1500)}`);
          if (mismatches.length > 3) break;
        }
        if (r.server.harvest) seen.harvest++;
        if (r.server.jar.pendingSpends.length) seen.pendingSpends++;
        if (r.server.pending.length) seen.pending++;
        if (r.server.jar.transfer) seen.transfer++;
        if (r.server.juniper.key === 'juniper.payday') seen.payday++;
        if (Object.values(r.server.people[r.server.partner].fruits).some((f) => f.actual !== undefined)) seen.partnerRaw++;
      }
      if (mismatches.length > 3) break;
    }
    expect(mismatches).toEqual([]);
    const topups = h.db.$client.prepare("select count(*) n from ledger_entry where kind = 'topup'").get() as { n: number };
    const spends = h.db.$client.prepare("select count(*) n from ledger_entry where kind = 'spend'").get() as { n: number };
    seen.topups = topups.n;
    console.info(`[differential] ${compared} views compared over ${checks.length} checkpoints, ${steps.length} steps, ` +
      `${h.refused.length} server refusals, ${lastSyncDiffs} views with a lastSyncAt difference (by design), ` +
      `${spends.n} purse spends, coverage ${JSON.stringify(seen)}`);
    // The fixture must actually exercise the interesting paths.
    expect(seen.topups).toBeGreaterThan(0);
    expect(spends.n).toBeGreaterThan(1);
    for (const k of ['harvest', 'pendingSpends', 'pending', 'transfer', 'payday', 'partnerRaw'] as const) expect(seen[k]).toBeGreaterThan(0);
    expect(h.refused.length).toBeGreaterThan(10);
    setDb(null);
  }, 120_000);

  it('the jar keeps the max when late data lowers a week (no claw-back)', () => {
    const h = new Harness();
    const wk = '2026-11-16';
    const t = finalMs(wk) + 60_000;
    for (const s of timeline()) if (Date.parse(s.t) <= t) h.apply(s);
    const r = h.check(new Date(t).toISOString(), 'A');
    expect(r.model.jar).toStrictEqual(r.server.jar);
    const w = settledWeeks(reduce(h.rows), t).find((x) => x.weekKey === wk)!;
    expect(w.final!.B).toBeLessThan(w.provisional.B);
    expect(paidAt(w, t).B).toBe(w.provisional.B);
    const paidB = h.db.$client.prepare("select sum(amount_yen) s from ledger_entry where week_key = ? and bucket = 'jar' and layer = 'B'").get(wk) as { s: number };
    expect(paidB.s).toBe(w.provisional.B);
    setDb(null);
  }, 30_000);
});

describe('labels', () => {
  it('match the server workout labels', () => {
    for (const ty of [...WORKOUT_TYPES, 'Unknown Thing']) for (const l of ['ja', 'en'] as const) expect(workoutLabel(ty, l)).toBe(serverLabel(ty, l));
  });
});

const REAL = resolve('data/island.db');

describe.skipIf(!existsSync(REAL))('differential: the real database (a temporary copy)', () => {
  it('matches the server at several times, before and after settlement', () => {
    const dir = mkdtempSync(join(tmpdir(), 'island-diff-'));
    try {
      for (const ext of ['', '-wal', '-shm']) if (existsSync(REAL + ext)) copyFileSync(REAL + ext, join(dir, 'island.db' + ext));
      const db = openDb(join(dir, 'island.db'));
      const lastUpload = (db.$client.prepare("select max(received_at) t from raw_payload where parse_status != 'error'").get() as { t: string | null }).t;
      const base = lastUpload ? Date.parse(lastUpload) : Date.now();
      const times = [base + 60_000, base + 6 * 3600_000];
      const wk = firstWeek();
      // Settle the copy like the scheduler would, then compare after the harvest opens and after the lock.
      const later = [provisionalMs(wk) + 60_000, finalMs(wk) + 60_000, provisionalMs(addDays(wk, 7)) + 60_000].filter((t) => t > base);
      let compared = 0;
      let lastSyncDiffs = 0;
      for (const t of [...times, ...later]) {
        for (let w = wk; provisionalMs(w) <= t; w = addDays(w, 7)) {
          for (const i of [provisionalMs(w), finalMs(w)]) if (i <= t) { setNow(new Date(i)); runSettlement(db, new Date(i)); }
        }
        setNow(new Date(t));
        for (const me of ['A', 'B'] as PersonId[]) {
          const server = structuredClone(getWeekView(db, me, new Date(t)));
          const model = buildWeekView(dbToSnapshot(db, me, new Date(t).toISOString()), me, t);
          for (const p of ['A', 'B'] as PersonId[]) {
            if (server.people[p].lastSyncAt !== model.people[p].lastSyncAt) lastSyncDiffs++;
            server.people[p].lastSyncAt = model.people[p].lastSyncAt;
          }
          expect(model).toStrictEqual(server);
          compared++;
        }
      }
      console.info(`[differential] real DB: ${compared} views identical (${lastSyncDiffs} lastSyncAt differences, by design)`);
      db.$client.close();
    } finally {
      setDb(null);
      setNow(null);
      rmSync(dir, { recursive: true, force: true });
    }
  }, 30_000);
});
