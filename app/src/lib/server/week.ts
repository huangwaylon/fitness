// Load a person-week from the DB, score it, and build the privacy-filtered WeekView for the requester.
import { and, eq, gte, inArray, lt, lte, max, sql, isNull, isNotNull } from 'drizzle-orm';
import type {
  CheckinTick, DayMetrics, FruitKey, FruitView, HarvestView, JarView, LocalDate, PendingConfirmation, PersonId,
  PersonWeekView, PromiseView, Visit, WeekInput, WeekKey, WeekPayout, WeekScore, WeekView, Workout
} from '#lib/types.ts';
import { CALIBRATION_WEEKS, JOBS, MONEY, PEOPLE, RUNGS, STRENGTH } from '#lib/config/rules.ts';
import {
  addDays, checkPromise, deriveVisits, nextRung, nowInZone, payoutWeek, scoreWeek, targetsFor, weekDays, weekKeyOf
} from '#lib/scoring/index.ts';
import type { Db } from '#lib/server/db/index.ts';
import {
  checkin, cozyDay, dailyMetric, harvestConfirm, highFive, ledgerEntry, personPref, place, presenceEvent, rawPayload,
  transfer, visibilityPref, visitConfirmation, weekLock, weekPromise, workout, purseSpend
} from '#lib/server/db/schema.ts';
import { now } from '#lib/server/clock.ts';
import { isStrengthWorkout } from '#lib/server/presence.ts';

export const FRUITS: FruitKey[] = ['peach', 'coconut', 'apple', 'pear'];
export const partnerOf = (p: PersonId): PersonId => (p === 'A' ? 'B' : 'A');

// ---------- loading ----------

function toWorkout(r: typeof workout.$inferSelect): Workout {
  return {
    extId: r.extId, date: r.localDate, type: r.type, startAt: r.startAt, endAt: r.endAt,
    durationMin: r.durationMin, avgHr: r.avgHr, includesStrength: r.includesStrength ?? null
  };
}

/** Workouts and derived visits whose local date is within [from, to]. */
export function loadActivity(db: Db, person: PersonId, from: LocalDate, to: LocalDate): { workouts: Workout[]; visits: (Visit & { arriveEventId: number })[] } {
  const workouts = db.select().from(workout)
    .where(and(eq(workout.person, person), gte(workout.localDate, from), lte(workout.localDate, to)))
    .all().map(toWorkout);
  // Events are UTC ISO; widen by a day on each side and filter by derived local date.
  const fromIso = new Date(Date.parse(`${addDays(from, -1)}T00:00:00+09:00`)).toISOString();
  const toIso = new Date(Date.parse(`${addDays(to, 2)}T00:00:00+09:00`)).toISOString();
  const events = db.select().from(presenceEvent)
    .where(and(eq(presenceEvent.person, person), gte(presenceEvent.at, fromIso), lt(presenceEvent.at, toIso)))
    .orderBy(presenceEvent.at).all();
  const places = db.select().from(place).where(eq(place.person, person)).all();
  const ids = events.filter((e) => e.event === 'arrive').map((e) => e.id);
  const confirmations = new Map<number, boolean>(
    ids.length ? db.select().from(visitConfirmation).where(inArray(visitConfirmation.arriveEventId, ids)).all().map((c) => [c.arriveEventId, c.confirmed]) : []
  );
  const visits = deriveVisits(
    events.map((e) => ({ id: e.id, placeKey: e.placeKey, event: e.event, at: e.at })),
    places.map((p) => ({ key: p.key, autoStrength: p.autoStrength })),
    confirmations
  ).filter((v) => v.date >= from && v.date <= to);
  return { workouts, visits };
}

export function loadWeekInput(db: Db, person: PersonId, weekKey: WeekKey): WeekInput {
  const dates = weekDays(weekKey);
  const from = dates[0];
  const to = dates[6];
  const metricRows = db.select().from(dailyMetric)
    .where(and(eq(dailyMetric.person, person), gte(dailyMetric.localDate, from), lte(dailyMetric.localDate, to))).all();
  const days: DayMetrics[] = dates.map((date) => ({
    date,
    steps: metricRows.find((r) => r.localDate === date && r.metric === 'steps')?.value ?? null,
    exerciseMin: metricRows.find((r) => r.localDate === date && r.metric === 'exercise_min')?.value ?? null
  }));
  const { workouts, visits } = loadActivity(db, person, from, to);
  const checkins: CheckinTick[] = db.select().from(checkin)
    .where(and(eq(checkin.person, person), gte(checkin.localDate, from), lte(checkin.localDate, to))).all()
    .map((c) => ({ date: c.localDate, habitKey: c.habitKey }));
  const cozyDays = db.select().from(cozyDay)
    .where(and(eq(cozyDay.person, person), gte(cozyDay.localDate, from), lte(cozyDay.localDate, to))).all()
    .map((c) => c.localDate);
  return {
    person, weekKey, age: PEOPLE[person].age, targets: targetsFor(person, weekKey), days, workouts,
    visits: visits.map(({ arriveEventId: _id, ...v }) => v), checkins, cozyDays, calibration: CALIBRATION_WEEKS.includes(weekKey)
  };
}

export function scorePersonWeek(db: Db, person: PersonId, weekKey: WeekKey): WeekScore {
  return scoreWeek(loadWeekInput(db, person, weekKey));
}

export function computePayout(db: Db, weekKey: WeekKey): { a: WeekScore; b: WeekScore; payout: WeekPayout } {
  const a = scorePersonWeek(db, 'A', weekKey);
  const b = scorePersonWeek(db, 'B', weekKey);
  return { a, b, payout: payoutWeek(a, b) };
}

// ---------- time helpers ----------

/** Absolute instant of a JST wall-clock time (Tokyo has no DST). */
export function jstInstant(date: LocalDate, hour: number, minute: number): Date {
  return new Date(`${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+09:00`);
}
export const provisionalAt = (wk: WeekKey) => jstInstant(addDays(wk, 6), JOBS.provisional.hour, JOBS.provisional.minute);
export const finalAt = (wk: WeekKey) => jstInstant(addDays(wk, 9), JOBS.final.hour, JOBS.final.minute);

export function isLocked(db: Db, weekKey: WeekKey): boolean {
  return Boolean(db.select().from(weekLock).where(eq(weekLock.weekKey, weekKey)).get()?.lockedAt);
}

/** Harvest open: the latest week whose provisional settlement ran, until both tapped 「壺に入れる」. */
export function harvestWeekKey(db: Db, t: Date = now()): WeekKey | null {
  const cur = weekKeyOf(nowInZone(t).date);
  for (const wk of [cur, addDays(cur, -7)]) {
    if (t < provisionalAt(wk)) continue;
    const lock = db.select().from(weekLock).where(eq(weekLock.weekKey, wk)).get();
    if (!lock?.provisionalAt) continue;
    const n = db.select().from(harvestConfirm).where(eq(harvestConfirm.weekKey, wk)).all().length;
    return n < 2 ? wk : null;
  }
  return null;
}

/** Week a new promise applies to: next week once Sunday's harvest has started, else this week. */
export function promiseTargetWeek(t: Date = now()): WeekKey {
  const cur = weekKeyOf(nowInZone(t).date);
  return t >= provisionalAt(cur) ? addDays(cur, 7) : cur;
}

// ---------- ledger reads ----------

export function jarBalances(db: Db, beforeWeek?: WeekKey): { A: number; B: number; team: number; purse: number } {
  const rows = db.select({ bucket: ledgerEntry.bucket, layer: ledgerEntry.layer, yen: sql<number>`coalesce(sum(${ledgerEntry.amountYen}), 0)` })
    .from(ledgerEntry)
    .where(beforeWeek ? lt(ledgerEntry.weekKey, beforeWeek) : undefined)
    .groupBy(ledgerEntry.bucket, ledgerEntry.layer).all();
  const out = { A: 0, B: 0, team: 0, purse: 0 };
  for (const r of rows) {
    if (r.bucket === 'purse') out.purse += Number(r.yen);
    else if (r.layer) out[r.layer] += Number(r.yen);
  }
  return out;
}

/** Jar yen attributed to a calendar month (by the week's Sunday, i.e. harvest day). */
export function monthEarnings(db: Db, month: string): number {
  const rows = db.select({ weekKey: ledgerEntry.weekKey, yen: ledgerEntry.amountYen }).from(ledgerEntry)
    .where(and(eq(ledgerEntry.bucket, 'jar'), inArray(ledgerEntry.kind, ['earn', 'topup']))).all();
  return rows.filter((r) => r.weekKey && addDays(r.weekKey, 6).slice(0, 7) === month).reduce((s, r) => s + r.yen, 0);
}

export function prevMonth(date: LocalDate): string {
  const [y, m] = date.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}

// ---------- view building ----------

function fruitView(score: WeekScore, key: FruitKey, raw: boolean): FruitView {
  const c = score.categories[key];
  const v: FruitView = { milli: c.milli, maxMilli: c.maxMilli, pct: c.maxMilli > 0 ? Math.floor((c.milli * 100) / c.maxMilli) : 0 };
  if (raw) {
    v.actual = c.actual;
    v.target = c.target;
  }
  return v;
}

export function sharedRawMetrics(db: Db, person: PersonId): Set<string> {
  return new Set(db.select().from(visibilityPref).where(and(eq(visibilityPref.person, person), eq(visibilityPref.shareRaw, true))).all().map((r) => r.metric));
}

function promiseView(db: Db, person: PersonId, weekKey: WeekKey, today: LocalDate): PromiseView | null {
  const p = db.select().from(weekPromise).where(and(eq(weekPromise.person, person), eq(weekPromise.weekKey, weekKey))).get();
  if (!p) return null;
  const { workouts, visits } = loadActivity(db, person, addDays(weekKey, -1), addDays(weekKey, 7));
  const cozy = db.select().from(cozyDay).where(eq(cozyDay.person, person)).all().map((c) => c.localDate);
  const result = checkPromise({ daysMask: p.daysMask, kind: p.kind, note: p.note }, weekKey, workouts, visits, cozy, today);
  return { daysMask: p.daysMask, kind: p.kind, note: p.note, result, cheered: Boolean(p.cheeredAt) } satisfies PromiseView;
}

/** Build one person's card. `full` = the requester's own card; otherwise the privacy-filtered partner card. */
export function personView(db: Db, person: PersonId, weekKey: WeekKey, today: LocalDate, score: WeekScore, full: boolean): PersonWeekView {
  const shared = full ? null : sharedRawMetrics(db, person);
  const fruits = Object.fromEntries(FRUITS.map((k) => [k, fruitView(score, k, full || shared!.has(k))])) as Record<FruitKey, FruitView>;
  const pref = db.select().from(personPref).where(eq(personPref.person, person)).get();
  const lastSync = db.select({ at: max(rawPayload.receivedAt) }).from(rawPayload)
    .where(and(eq(rawPayload.person, person), inArray(rawPayload.source, ['hae', 'shortcut']), inArray(rawPayload.parseStatus, ['ok', 'partial']))).get()?.at ?? null;
  const month = today.slice(0, 7);
  const cozyRows = db.select().from(cozyDay).where(eq(cozyDay.person, person)).all();
  const view: PersonWeekView = {
    person,
    villagerName: pref?.villagerName ?? PEOPLE[person].villager,
    score: score.score,
    fruits,
    lastSyncAt: lastSync,
    promise: promiseView(db, person, weekKey, today),
    cozyDaysThisMonth: cozyRows.filter((c) => c.localDate.startsWith(month)).length,
    isCozyToday: cozyRows.some((c) => c.localDate === today),
    villager: pref?.villager ?? null,
    villagerSpecies: pref?.villagerSpecies ?? null,
    villagerColor: pref?.villagerColor ?? null
  };
  if (full) {
    const dates = weekDays(weekKey);
    const ticks = db.select().from(checkin)
      .where(and(eq(checkin.person, person), gte(checkin.localDate, addDays(dates[0], -2)), lte(checkin.localDate, dates[6]))).all();
    const ticksByDate: Record<LocalDate, string[]> = {};
    for (const t of ticks) (ticksByDate[t.localDate] ??= []).push(t.habitKey);
    view.habits = { keys: targetsFor(person, weekKey).habits, ticksByDate };
  }
  return view;
}

export function pendingConfirmations(db: Db, person: PersonId, today: LocalDate): PendingConfirmation[] {
  const cur = weekKeyOf(today);
  const out: PendingConfirmation[] = [];
  for (const wk of [addDays(cur, -7), cur]) {
    if (isLocked(db, wk)) continue;
    const { workouts, visits } = loadActivity(db, person, wk, addDays(wk, 6));
    const names = new Map(db.select().from(place).where(eq(place.person, person)).all().map((p) => [p.key, p.name]));
    for (const v of visits) {
      if (v.autoStrength || v.confirmed !== null || v.dwellMin < STRENGTH.minVisitMin) continue;
      const a = Date.parse(v.arriveAt);
      const l = Date.parse(v.leaveAt);
      if (workouts.some((w) => isStrengthWorkout(w) && Date.parse(w.startAt) < l && Date.parse(w.endAt) > a)) continue;
      out.push({ kind: 'visit', id: String(v.arriveEventId), date: v.date, label: names.get(v.placeKey) ?? v.placeKey });
    }
    for (const w of workouts) {
      if ((STRENGTH.askTypes as readonly string[]).includes(w.type) && w.includesStrength === null && w.durationMin >= STRENGTH.minWorkoutMin) {
        out.push({ kind: 'workout', id: w.extId, date: w.date, label: w.type });
      }
    }
  }
  return out.sort((x, y) => x.date.localeCompare(y.date));
}

function jarView(db: Db, today: LocalDate, estimate: WeekPayout): JarView {
  const bal = jarBalances(db);
  const totalYen = bal.A + bal.B + bal.team;
  const month = prevMonth(today);
  const amountYen = monthEarnings(db, month);
  const done = Boolean(db.select().from(transfer).where(eq(transfer.month, month)).get());
  return {
    totalYen,
    layers: { A: bal.A, B: bal.B, team: bal.team },
    purseYen: bal.purse,
    thisWeekEstimateYen: estimate.A.fruitYen + estimate.B.fruitYen + estimate.teamYen,
    nextRung: nextRung(totalYen),
    rungs: RUNGS.map((r) => ({ key: r.key, yen: r.yen, reached: totalYen >= r.yen })),
    transfer: amountYen > 0 || done ? { month, amountYen, done } : null,
    pendingSpends: db.select().from(purseSpend).where(and(isNull(purseSpend.approvedBy), isNull(purseSpend.ledgerEntryId))).all()
      .map((p) => ({ id: p.id, label: p.label, amountYen: p.amountYen, by: p.requestedBy })),
    weeks: db.select().from(weekLock).where(isNotNull(weekLock.provisionalAt)).all().length
  };
}

function harvestView(db: Db, wk: WeekKey, today: LocalDate): HarvestView {
  const { payout } = computePayout(db, wk);
  const before = jarBalances(db, wk);
  const upTo = jarBalances(db, addDays(wk, 1));
  const beforeTotal = before.A + before.B + before.team;
  const afterTotal = upTo.A + upTo.B + upTo.team;
  const promiseDay = today < addDays(wk, 6) ? today : addDays(wk, 6);
  const promiseResults = { A: null, B: null } as HarvestView['promiseResults'];
  for (const p of ['A', 'B'] as const) promiseResults[p] = promiseView(db, p, wk, promiseDay)?.result ?? null;
  return {
    weekKey: wk,
    payout,
    rungsReached: RUNGS.filter((r) => beforeTotal < r.yen && afterTotal >= r.yen).map((r) => r.key),
    promiseResults,
    confirmedBy: db.select().from(harvestConfirm).where(eq(harvestConfirm.weekKey, wk)).all().map((r) => r.person).sort()
  };
}

function juniperLine(v: Omit<WeekView, 'juniper'>, hour: number, dayOfMonth: number): WeekView['juniper'] {
  const me = v.people[v.me];
  const todayTicks = me.habits?.ticksByDate[v.today]?.length ?? 0;
  if (v.harvest && !v.harvest.confirmedBy.includes(v.me)) return { key: 'juniper.harvest_ready', params: { score: me.score } };
  if (v.harvest) return { key: 'juniper.harvest_waiting', params: { name: v.people[v.partner].villagerName } };
  if (dayOfMonth === MONEY.paydayDayOfMonth && v.jar.transfer && !v.jar.transfer.done) return { key: 'juniper.payday', params: { yen: v.jar.transfer.amountYen } };
  if (v.pending.length > 0) return { key: 'juniper.pending_confirm', params: { label: v.pending[0].label } };
  if (me.isCozyToday) return { key: 'juniper.cozy' };
  if (todayTicks > 0 && hour >= 17) return { key: 'juniper.checkin_done' };
  if (hour >= 18) return { key: 'juniper.evening' };
  if (hour < 11) return { key: 'juniper.morning', params: { name: me.villagerName } };
  if (v.jar.nextRung) return { key: 'juniper.next_rung', params: { rung: v.jar.nextRung.key, yen: v.jar.nextRung.remainingYen } };
  return { key: 'juniper.default', params: { score: me.score } };
}

export function getWeekView(db: Db, me: PersonId, t: Date = now()): WeekView {
  const z = nowInZone(t);
  const today = z.date;
  const weekKey = weekKeyOf(today);
  const partner = partnerOf(me);
  const { a, b, payout } = computePayout(db, weekKey);
  const scores: Record<PersonId, WeekScore> = { A: a, B: b };
  const people = {
    [me]: personView(db, me, weekKey, today, scores[me], true),
    [partner]: personView(db, partner, weekKey, today, scores[partner], false)
  } as Record<PersonId, PersonWeekView>;
  const hwk = harvestWeekKey(db, t);
  const startOfToday = jstInstant(today, 0, 0).toISOString();
  const base: Omit<WeekView, 'juniper'> = {
    me,
    partner,
    locale: db.select().from(personPref).where(eq(personPref.person, me)).get()?.locale ?? 'ja',
    weekKey,
    today,
    people,
    jar: jarView(db, today, payout),
    harvest: hwk ? harvestView(db, hwk, today) : null,
    pending: pendingConfirmations(db, me, today),
    highFivesToday: db.select().from(highFive).where(and(eq(highFive.from, partner), gte(highFive.at, startOfToday))).all().length,
    visibility: Object.fromEntries([...sharedRawMetrics(db, me)].map((m) => [m, true]))
  };
  return { ...base, juniper: juniperLine(base, z.hour, Number(today.slice(8, 10))) };
}
