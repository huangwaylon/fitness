// Differential-test harness (tests only; deleted with the server): replays one timeline of user actions into BOTH the
// old server (a fresh in-memory DB, the real settlement job at every Sunday 19:30 / Wednesday 04:00 instant) and a
// sheet-style Snapshot (rows stamped with the server time, append-only, higher-only metrics, unseen workouts only),
// then compares the server's getWeekView with the model's buildWeekView.
import type { LocalDate, PersonId, WeekView } from '#lib/types.ts';
import { addDays, nowInZone, weekKeyOf } from '#lib/scoring/index.ts';
import type { Db } from '#lib/server/db/index.ts';
import * as schema from '#lib/server/db/schema.ts';
import { setNow } from '#lib/server/clock.ts';
import { freshDb } from '#lib/server/test-utils.ts';
import { ingestWith } from '#lib/server/ingest/common.ts';
import { recordPresence } from '#lib/server/presence.ts';
import * as actions from '#lib/server/actions.ts';
import { runSettlement } from '#lib/server/jobs.ts';
import { getWeekView, harvestWeekKey } from '#lib/server/week.ts';
import { HttpError } from '#lib/server/http.ts';
import { emptyRows, type EventRow, type EventType, type Snapshot, type SnapshotRows } from '../snapshot.ts';
import { finalMs, firstWeek, provisionalMs } from '../state.ts';
import { buildWeekView } from '../week.ts';

export type Metric = { date: LocalDate; metric: 'steps' | 'exercise_min'; value: number };
export type WorkoutIn = { extId: string; date: LocalDate; type: string; startAt: string; endAt: string; durationMin: number; avgHr: number | null };

export type Step = { t: string } & (
  | { op: 'ingest'; person: PersonId; metrics?: Metric[]; workouts?: WorkoutIn[] }
  | { op: 'presence'; person: PersonId; place: string; event: 'arrive' | 'leave'; at?: string; ref?: string }
  | { op: 'checkin'; person: PersonId; date: LocalDate; habit: string; done: boolean }
  | { op: 'confirmVisit'; person: PersonId; ref: string; yes: boolean }
  | { op: 'confirmWorkout'; person: PersonId; extId: string; yes: boolean }
  | { op: 'spend'; person: PersonId; ref: string; label: string; amountYen: number }
  | { op: 'approve'; person: PersonId; ref: string }
  | { op: 'transfer'; person: PersonId; month: string }
  | { op: 'harvest'; person: PersonId; week?: string }
  | { op: 'highfive'; person: PersonId }
  | { op: 'pref'; person: PersonId; key: 'locale' | 'villagerName' | 'villager'; value: string }
  | { op: 'share'; person: PersonId; metric: string; on: boolean }
);

const iso = (t: string | number | Date) => new Date(t).toISOString();

export interface CheckResult { t: string; me: PersonId; server: WeekView; model: WeekView; lastSyncDiffers: boolean }

export class Harness {
  db: Db;
  rows: SnapshotRows = emptyRows();
  /** Server-side refusals seen while replaying (the model must ignore the same events on read). */
  refused: string[] = [];
  #lastMs = -Infinity;
  #metricMax = new Map<string, number>();
  #workoutIds = new Set<string>();
  #visitIds = new Map<string, string>(); // server arrive id → model visit id
  #visitRefs = new Map<string, { server: string; model: string }>();
  #spendIds = new Map<number, number>(); // server spend id → model spendId
  #spendRefs = new Map<string, { server: number; model: number }>();
  #seq = 0;
  #lastAppend: Record<PersonId, string | null> = { A: null, B: null };

  constructor() {
    this.db = freshDb();
  }

  /** Run the settlement job at every Sunday 19:30 / Wednesday 04:00 instant in (last, t], as the scheduler would. */
  advance(tMs: number): void {
    const instants: number[] = [];
    for (let wk = firstWeek(); provisionalMs(wk) <= tMs; wk = addDays(wk, 7)) {
      for (const i of [provisionalMs(wk), finalMs(wk)]) if (i > this.#lastMs && i <= tMs) instants.push(i);
    }
    for (const i of instants.sort((a, b) => a - b)) {
      setNow(new Date(i));
      runSettlement(this.db, new Date(i));
    }
    this.#lastMs = Math.max(this.#lastMs, tMs);
  }

  #event(t: string, person: PersonId, type: string, data: Record<string, unknown>): void {
    const row: EventRow = [iso(t), person, `e${++this.#seq}`, type as EventType, JSON.stringify(data)];
    this.rows.events.push(row);
  }

  #try(label: string, f: () => unknown): unknown {
    try {
      return f();
    } catch (e) {
      if (e instanceof HttpError || (e instanceof Error && e.name === 'ZodError')) {
        this.refused.push(`${label}: ${e instanceof HttpError ? e.code : 'invalid'}`);
        return null;
      }
      throw e;
    }
  }

  apply(step: Step): void {
    const tMs = Date.parse(step.t);
    this.advance(tMs);
    setNow(new Date(tMs));
    const at = iso(tMs);
    const db = this.db;
    switch (step.op) {
      case 'ingest': {
        const metrics = (step.metrics ?? []).map((m) => ({ localDate: m.date, metric: m.metric, value: m.value }));
        const workouts = step.workouts ?? [];
        const serverWorkouts = workouts.map(({ date, ...w }) => ({ ...w, localDate: date }));
        ingestWith(db, step.person, '{}', () => ({ metrics, workouts: serverWorkouts, skipped: 0 }));
        let appended = false;
        for (const m of step.metrics ?? []) {
          const k = `${step.person}|${m.date}|${m.metric}`;
          if (m.value > (this.#metricMax.get(k) ?? -Infinity)) {
            this.#metricMax.set(k, m.value);
            this.rows.metrics.push([at, step.person, m.date, m.metric, m.value]);
            appended = true;
          }
        }
        for (const w of workouts) {
          const k = `${step.person}|${w.extId}`;
          if (this.#workoutIds.has(k)) continue;
          this.#workoutIds.add(k);
          this.rows.workouts.push([at, step.person, w.extId, w.date, w.type, w.startAt, w.endAt, w.durationMin, w.avgHr]);
          appended = true;
        }
        if (appended) this.#lastAppend[step.person] = at;
        break;
      }
      case 'presence': {
        const eventAt = step.at ? iso(step.at) : at;
        const r = this.#try(`presence ${step.t}`, () => recordPresence(db, step.person, { place: step.place, event: step.event, at: step.at })) as
          | { id: number; duplicate: boolean } | null;
        this.rows.presence.push([at, step.person, step.place, step.event, eventAt]);
        if (r && !r.duplicate && step.event === 'arrive') {
          const model = `${step.place}@${eventAt}`;
          this.#visitIds.set(String(r.id), model);
          if (step.ref) this.#visitRefs.set(step.ref, { server: String(r.id), model });
        }
        break;
      }
      case 'checkin': {
        const input = { date: step.date, habitKey: step.habit, done: step.done };
        this.#try(`checkin ${step.t}`, () => actions.setCheckin(db, step.person, actions.schemas.checkin.parse(input)));
        this.#event(step.t, step.person, 'checkin', { date: step.date, habit: step.habit, done: step.done });
        break;
      }
      case 'confirmVisit': {
        const ids = this.#visitRefs.get(step.ref) ?? { server: '999999', model: 'unknown@visit' };
        this.#try(`confirmVisit ${step.t}`, () => actions.confirm(db, step.person, { kind: 'visit', id: ids.server, yes: step.yes }));
        this.#event(step.t, step.person, 'confirm', { kind: 'visit', id: ids.model, yes: step.yes });
        break;
      }
      case 'confirmWorkout':
        this.#try(`confirmWorkout ${step.t}`, () => actions.confirm(db, step.person, { kind: 'workout', id: step.extId, yes: step.yes }));
        this.#event(step.t, step.person, 'confirm', { kind: 'workout', id: step.extId, yes: step.yes });
        break;
      case 'spend': {
        const modelId = 1_000_000 + ++this.#seq;
        const r = this.#try(`spend ${step.t}`, () =>
          actions.spendPurse(db, step.person, actions.schemas.spend.parse({ label: step.label, amountYen: step.amountYen }))) as { id: number } | null;
        if (r) {
          this.#spendIds.set(r.id, modelId);
          this.#spendRefs.set(step.ref, { server: r.id, model: modelId });
        } else this.#spendRefs.set(step.ref, { server: 999999, model: modelId });
        this.#event(step.t, step.person, 'spend', { spendId: modelId, label: step.label, amountYen: step.amountYen });
        break;
      }
      case 'approve': {
        const ids = this.#spendRefs.get(step.ref) ?? { server: 999999, model: -1 };
        this.#try(`approve ${step.t}`, () => actions.approveSpend(db, step.person, ids.server));
        this.#event(step.t, step.person, 'approve', { spendId: ids.model });
        break;
      }
      case 'transfer':
        this.#try(`transfer ${step.t}`, () => actions.markTransfer(db, step.person, step.month));
        this.#event(step.t, step.person, 'transfer', { month: step.month });
        break;
      case 'harvest': {
        const week = step.week ?? harvestWeekKey(db, new Date(tMs)) ?? weekKeyOf(nowInZone(new Date(tMs)).date);
        const open = harvestWeekKey(db, new Date(tMs));
        if (open === week) this.#try(`harvest ${step.t}`, () => actions.confirmHarvest(db, step.person));
        else this.refused.push(`harvest ${step.t}: not open for ${week}`);
        this.#event(step.t, step.person, 'harvest', { week });
        break;
      }
      case 'highfive':
        actions.sendHighFive(db, step.person);
        this.#event(step.t, step.person, 'highfive', {});
        break;
      case 'pref':
        this.#try(`pref ${step.t}`, () => actions.setPrefs(db, step.person, actions.schemas.prefs.parse({ [step.key]: step.value })));
        this.#event(step.t, step.person, 'pref', { key: step.key, value: step.value });
        break;
      case 'share':
        this.#try(`share ${step.t}`, () => actions.setVisibility(db, step.person, actions.schemas.visibility.parse({ metric: step.metric, shareRaw: step.on })));
        this.#event(step.t, step.person, 'share', { metric: step.metric, on: step.on });
        break;
    }
  }

  snapshot(me: PersonId, t: string): Snapshot {
    return { me, now: iso(t), rows: this.rows };
  }

  /**
   * Both views at t. Server ids (visit arrive ids, purse spend ids) are mapped to the model's ids, and `lastSyncAt`
   * is compared separately: the server stamps every upload, the sheet only rows that changed something.
   */
  check(t: string, me: PersonId): CheckResult {
    const tMs = Date.parse(t);
    this.advance(tMs);
    setNow(new Date(tMs));
    const server = structuredClone(getWeekView(this.db, me, new Date(tMs)));
    for (const p of server.pending) if (p.kind === 'visit') p.id = this.#visitIds.get(p.id) ?? `unmapped:${p.id}`;
    for (const s of server.jar.pendingSpends) s.id = this.#spendIds.get(s.id) ?? -s.id;
    const model = buildWeekView(this.snapshot(me, t), me, tMs);
    let lastSyncDiffers = false;
    for (const p of ['A', 'B'] as PersonId[]) {
      if (server.people[p].lastSyncAt !== model.people[p].lastSyncAt) lastSyncDiffers = true;
      expectLastAppend(model.people[p].lastSyncAt, this.#lastAppend[p]);
      server.people[p].lastSyncAt = model.people[p].lastSyncAt;
    }
    return { t, me, server, model, lastSyncDiffers };
  }
}

function expectLastAppend(model: string | null, expected: string | null): void {
  if (model !== expected) throw new Error(`model lastSyncAt ${model} ≠ last appending upload ${expected}`);
}

// ---------- the real DB → Snapshot (read-only use of a copy) ----------

/** Convert the server's tables into sheet rows. Derived tables (ledger, locks) are dropped: the model recomputes them. */
export function dbToSnapshot(db: Db, me: PersonId, now: string): Snapshot {
  const rows = emptyRows();
  let seq = 0;
  const ev = (at: string, person: PersonId, type: string, data: Record<string, unknown>) =>
    rows.events.push([iso(at), person, `db${++seq}`, type as EventType, JSON.stringify(data)]);
  const EARLY = '2000-01-01T00:00:00.000Z';
  for (const m of db.select().from(schema.dailyMetric).all()) rows.metrics.push([iso(m.updatedAt), m.person, m.localDate, m.metric, m.value]);
  for (const w of db.select().from(schema.workout).all()) {
    rows.workouts.push([iso(w.updatedAt), w.person, w.extId, w.localDate, w.type, w.startAt, w.endAt, w.durationMin, w.avgHr]);
    if (w.includesStrength !== null) ev(w.updatedAt, w.person, 'confirm', { kind: 'workout', id: w.extId, yes: w.includesStrength });
  }
  const presence = db.select().from(schema.presenceEvent).all();
  const visitId = new Map<number, string>();
  for (const p of presence) {
    rows.presence.push([iso(p.at), p.person, p.placeKey, p.event, iso(p.at)]);
    visitId.set(p.id, `${p.placeKey}@${iso(p.at)}`);
  }
  const personOf = new Map(presence.map((p) => [p.id, p.person]));
  for (const c of db.select().from(schema.visitConfirmation).all()) {
    const person = personOf.get(c.arriveEventId);
    if (person) ev(c.answeredAt, person, 'confirm', { kind: 'visit', id: visitId.get(c.arriveEventId), yes: c.confirmed });
  }
  for (const c of db.select().from(schema.checkin).all()) ev(c.createdAt, c.person, 'checkin', { date: c.localDate, habit: c.habitKey, done: true });
  for (const v of db.select().from(schema.visibilityPref).all()) ev(EARLY, v.person, 'share', { metric: v.metric, on: v.shareRaw });
  for (const p of db.select().from(schema.personPref).all()) {
    for (const key of ['locale', 'villagerName', 'villager'] as const) if (p[key]) ev(EARLY, p.person, 'pref', { key, value: p[key] });
  }
  const ledger = new Map(db.select().from(schema.ledgerEntry).all().map((l) => [l.id, l]));
  for (const s of db.select().from(schema.purseSpend).all()) {
    ev(s.createdAt, s.requestedBy, 'spend', { spendId: s.id, label: s.label, amountYen: s.amountYen });
    const entry = s.ledgerEntryId ? ledger.get(s.ledgerEntryId) : undefined;
    if (s.approvedBy && s.approvedBy !== s.requestedBy && entry) ev(entry.createdAt, s.approvedBy, 'approve', { spendId: s.id });
  }
  for (const x of db.select().from(schema.transfer).all()) ev(x.doneAt, x.markedBy, 'transfer', { month: x.month });
  for (const h of db.select().from(schema.harvestConfirm).all()) ev(h.at, h.person, 'harvest', { week: h.weekKey });
  for (const h of db.select().from(schema.highFive).all()) ev(h.at, h.from, 'highfive', {});
  for (const tab of Object.values(rows) as [string][][]) tab.sort((a, b) => Date.parse(a[0]) - Date.parse(b[0]));
  return { me, now, rows };
}
