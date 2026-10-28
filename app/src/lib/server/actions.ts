// Business rules behind the /api/* endpoints (routes only parse + delegate here). All throw HttpError on refusal.
import { and, eq, isNull, like } from 'drizzle-orm';
import { z } from 'zod';
import type { LocalDate, PersonId } from '#lib/types.ts';
import { COZY, MONEY } from '#lib/config/rules.ts';
import { addDays, nowInZone, targetsFor, weekKeyOf } from '#lib/scoring/index.ts';
import type { Db } from '#lib/server/db/index.ts';
import {
  checkin, cozyDay, harvestConfirm, highFive, ledgerEntry, personPref, presenceEvent, purseSpend, pushSubscription,
  transfer, visibilityPref, visitConfirmation, weekPromise, workout
} from '#lib/server/db/schema.ts';
import { HttpError } from '#lib/server/http.ts';
import { now } from '#lib/server/clock.ts';
import { purseBalance } from '#lib/server/ledger.ts';
import { harvestWeekKey, isLocked, monthEarnings, partnerOf, promiseTargetWeek } from '#lib/server/week.ts';

// ---------- schemas ----------
const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const schemas = {
  pair: z.object({ code: z.string().regex(/^\d{6}$/), label: z.string().max(60).optional() }),
  presence: z.object({ place: z.string().min(1).max(40), event: z.enum(['arrive', 'leave']), at: z.string().max(40).optional(), token: z.string().optional() }),
  checkin: z.object({ date: localDate, habitKey: z.string().min(1).max(40), done: z.boolean() }),
  cozy: z.object({ date: localDate, on: z.boolean() }),
  promise: z.object({ daysMask: z.number().int().min(1).max(127), kind: z.enum(['gym', 'pt', 'walk', 'any']), note: z.string().max(140).nullish() }),
  empty: z.object({}).loose(),
  blocker: z.object({ text: z.string().trim().min(1).max(280) }),
  confirm: z.object({ kind: z.enum(['visit', 'workout']), id: z.string().min(1).max(100), yes: z.boolean() }),
  spend: z.object({ label: z.string().trim().min(1).max(60), amountYen: z.number().int().positive().max(1_000_000) }),
  approve: z.object({ id: z.number().int().positive() }),
  transfer: z.object({ month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/) }),
  subscribe: z.object({ endpoint: z.url().max(1000).refine((u) => u.startsWith('https://'), 'https only'), keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }) }),
  prefs: z.object({
    locale: z.enum(['ja', 'en']).optional(),
    villagerName: z.string().trim().min(1).max(20).optional(),
    villagerSpecies: z.string().max(20).optional(),
    villagerColor: z.string().max(20).optional()
  }),
  visibility: z.object({ metric: z.enum(['peach', 'coconut', 'apple', 'pear']), shareRaw: z.boolean() })
};

const today = () => nowInZone(now()).date;

function assertUnlocked(db: Db, date: LocalDate) {
  if (isLocked(db, weekKeyOf(date))) throw new HttpError(409, 'week_locked');
}

// ---------- check-in ----------
/** Own habits only; today, yesterday or the day before (48 h fill-in); not in a locked week. */
export function setCheckin(db: Db, person: PersonId, input: z.infer<typeof schemas.checkin>): { date: LocalDate; ticks: string[] } {
  const t = today();
  if (input.date > t || input.date < addDays(t, -2)) throw new HttpError(422, 'date_out_of_range');
  assertUnlocked(db, input.date);
  if (!targetsFor(person, weekKeyOf(input.date)).habits.includes(input.habitKey)) throw new HttpError(422, 'unknown_habit');
  if (input.done) db.insert(checkin).values({ person, localDate: input.date, habitKey: input.habitKey }).onConflictDoNothing().run();
  else db.delete(checkin).where(and(eq(checkin.person, person), eq(checkin.localDate, input.date), eq(checkin.habitKey, input.habitKey))).run();
  const ticks = db.select().from(checkin).where(and(eq(checkin.person, person), eq(checkin.localDate, input.date))).all().map((r) => r.habitKey);
  return { date: input.date, ticks };
}

// ---------- cozy day ----------
export function setCozyDay(db: Db, person: PersonId, input: z.infer<typeof schemas.cozy>): { date: LocalDate; on: boolean; usedThisMonth: number } {
  const t = today();
  if (input.date < addDays(t, -2) || input.date > addDays(t, 30)) throw new HttpError(422, 'date_out_of_range');
  assertUnlocked(db, input.date);
  const month = input.date.slice(0, 7);
  const count = () => db.select().from(cozyDay).where(and(eq(cozyDay.person, person), like(cozyDay.localDate, `${month}-%`))).all().length;
  if (input.on) {
    const exists = db.select().from(cozyDay).where(and(eq(cozyDay.person, person), eq(cozyDay.localDate, input.date))).get();
    if (!exists) {
      if (count() >= COZY.maxPerMonth) throw new HttpError(409, 'cozy_month_cap', { max: COZY.maxPerMonth });
      db.insert(cozyDay).values({ person, localDate: input.date }).onConflictDoNothing().run();
    }
  } else {
    db.delete(cozyDay).where(and(eq(cozyDay.person, person), eq(cozyDay.localDate, input.date))).run();
  }
  return { date: input.date, on: input.on, usedThisMonth: count() };
}

// ---------- promise ----------
export function setPromise(db: Db, person: PersonId, input: z.infer<typeof schemas.promise>): { weekKey: string } {
  const weekKey = promiseTargetWeek(now());
  if (isLocked(db, weekKey)) throw new HttpError(409, 'week_locked');
  const values = { daysMask: input.daysMask, kind: input.kind, note: input.note ?? null, cheeredAt: null, blocker: null };
  db.insert(weekPromise).values({ person, weekKey, ...values })
    .onConflictDoUpdate({ target: [weekPromise.person, weekPromise.weekKey], set: values }).run();
  return { weekKey };
}

export function cheerPromise(db: Db, person: PersonId): { weekKey: string } {
  const partner = partnerOf(person);
  for (const weekKey of [promiseTargetWeek(now()), weekKeyOf(today())]) {
    const r = db.update(weekPromise).set({ cheeredAt: now().toISOString() })
      .where(and(eq(weekPromise.person, partner), eq(weekPromise.weekKey, weekKey))).run();
    if (r.changes === 1) return { weekKey };
  }
  throw new HttpError(404, 'no_promise');
}

/** "What got in the way?" — only the promiser, for the week being harvested (else this week). */
export function setBlocker(db: Db, person: PersonId, text: string): { weekKey: string } {
  const weekKey = harvestWeekKey(db, now()) ?? weekKeyOf(today());
  const r = db.update(weekPromise).set({ blocker: text })
    .where(and(eq(weekPromise.person, person), eq(weekPromise.weekKey, weekKey))).run();
  if (r.changes !== 1) throw new HttpError(404, 'no_promise');
  return { weekKey };
}

// ---------- confirmations ----------
export function confirm(db: Db, person: PersonId, input: z.infer<typeof schemas.confirm>): { ok: true } {
  if (input.kind === 'visit') {
    const id = Number(input.id);
    const ev = Number.isInteger(id) ? db.select().from(presenceEvent).where(eq(presenceEvent.id, id)).get() : undefined;
    if (!ev || ev.person !== person || ev.event !== 'arrive') throw new HttpError(404, 'not_found');
    assertUnlocked(db, nowInZone(new Date(ev.at)).date);
    db.insert(visitConfirmation).values({ arriveEventId: id, confirmed: input.yes, answeredAt: now().toISOString() })
      .onConflictDoUpdate({ target: visitConfirmation.arriveEventId, set: { confirmed: input.yes, answeredAt: now().toISOString() } }).run();
  } else {
    const w = db.select().from(workout).where(and(eq(workout.person, person), eq(workout.extId, input.id))).get();
    if (!w) throw new HttpError(404, 'not_found');
    assertUnlocked(db, w.localDate);
    db.update(workout).set({ includesStrength: input.yes }).where(and(eq(workout.person, person), eq(workout.extId, input.id))).run();
  }
  return { ok: true };
}

// ---------- harvest ----------
export function confirmHarvest(db: Db, person: PersonId): { weekKey: string; confirmedBy: PersonId[]; closed: boolean } {
  const weekKey = harvestWeekKey(db, now());
  if (!weekKey) throw new HttpError(409, 'no_harvest');
  db.insert(harvestConfirm).values({ weekKey, person }).onConflictDoNothing().run();
  const confirmedBy = db.select().from(harvestConfirm).where(eq(harvestConfirm.weekKey, weekKey)).all().map((r) => r.person).sort();
  return { weekKey, confirmedBy, closed: confirmedBy.length === 2 };
}

// ---------- purse ----------
function writeSpend(db: Db, spendId: number, person: PersonId, label: string, amountYen: number): number {
  const row = db.insert(ledgerEntry).values({
    bucket: 'purse', layer: null, person, amountYen: -amountYen, kind: 'spend', weekKey: null, idemKey: `spend:purse:${spendId}`, memo: label
  }).onConflictDoNothing({ target: ledgerEntry.idemKey }).returning({ id: ledgerEntry.id }).get();
  if (!row) throw new HttpError(409, 'already_spent');
  return row.id;
}

/** Spend from the purse. Balance can't go below 0. ≥ ¥5,000 needs the partner's OK (→ pending). */
export function spendPurse(db: Db, person: PersonId, input: z.infer<typeof schemas.spend>): { id: number; status: 'spent' | 'pending' } {
  return db.transaction((tx) => {
    const t = tx as unknown as Db;
    if (purseBalance(t) < input.amountYen) throw new HttpError(409, 'insufficient_purse');
    const s = t.insert(purseSpend).values({ label: input.label, amountYen: input.amountYen, requestedBy: person }).returning().get();
    if (input.amountYen >= MONEY.purseNeedsBothAtYen) return { id: s.id, status: 'pending' as const };
    const entryId = writeSpend(t, s.id, person, input.label, input.amountYen);
    t.update(purseSpend).set({ approvedBy: person, ledgerEntryId: entryId }).where(eq(purseSpend.id, s.id)).run();
    return { id: s.id, status: 'spent' as const };
  });
}

export function approveSpend(db: Db, person: PersonId, id: number): { id: number; status: 'spent' } {
  return db.transaction((tx) => {
    const t = tx as unknown as Db;
    const s = t.select().from(purseSpend).where(eq(purseSpend.id, id)).get();
    if (!s) throw new HttpError(404, 'not_found');
    if (s.ledgerEntryId) throw new HttpError(409, 'already_spent');
    if (s.requestedBy === person) throw new HttpError(403, 'partner_must_approve');
    if (purseBalance(t) < s.amountYen) throw new HttpError(409, 'insufficient_purse');
    const entryId = writeSpend(t, s.id, s.requestedBy, s.label, s.amountYen);
    t.update(purseSpend).set({ approvedBy: person, ledgerEntryId: entryId }).where(and(eq(purseSpend.id, id), isNull(purseSpend.ledgerEntryId))).run();
    return { id, status: 'spent' as const };
  });
}

// ---------- transfer, push, social, prefs ----------
export function markTransfer(db: Db, person: PersonId, month: string): { month: string; amountYen: number } {
  if (month >= today().slice(0, 7)) throw new HttpError(422, 'month_not_finished');
  const amountYen = monthEarnings(db, month);
  db.insert(transfer).values({ month, amountYen, markedBy: person }).onConflictDoNothing().run();
  const row = db.select().from(transfer).where(eq(transfer.month, month)).get()!;
  return { month, amountYen: row.amountYen };
}

export function subscribePush(db: Db, person: PersonId, deviceId: number, input: z.infer<typeof schemas.subscribe>): { ok: true } {
  const keysJson = JSON.stringify(input.keys);
  db.insert(pushSubscription).values({ person, deviceId, endpoint: input.endpoint, keysJson })
    .onConflictDoUpdate({ target: pushSubscription.endpoint, set: { person, deviceId, keysJson } }).run();
  return { ok: true };
}

export function sendHighFive(db: Db, person: PersonId): { ok: true } {
  db.insert(highFive).values({ from: person, at: now().toISOString() }).run();
  return { ok: true };
}

export function setPrefs(db: Db, person: PersonId, input: z.infer<typeof schemas.prefs>): { ok: true } {
  const set = Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined));
  db.insert(personPref).values({ person, ...set })
    .onConflictDoUpdate({ target: personPref.person, set: Object.keys(set).length ? set : { person } }).run();
  return { ok: true };
}

export function setVisibility(db: Db, person: PersonId, input: z.infer<typeof schemas.visibility>): { ok: true } {
  db.insert(visibilityPref).values({ person, metric: input.metric, shareRaw: input.shareRaw })
    .onConflictDoUpdate({ target: [visibilityPref.person, visibilityPref.metric], set: { shareRaw: input.shareRaw } }).run();
  return { ok: true };
}
