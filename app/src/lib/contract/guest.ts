// The guest (docs/design.md "The guest", docs/backend.md#the-guest): a third key, KEY_C, who plays the same app as the
// members (the user, 2026-11-24). One rule applies to that key alone, kept by the record (relay/src/store.ts: what it
// accepts from the guest and what its snapshot leaves out) and the demo (`?demo&as=G`): it never sees the members'
// bodies (weight, body fat, BMI, lean mass, the InBody sheets and the からだ goals), nor writes a からだ goal; and the
// couple's shared money (every `fin_*` type, contract/finance.ts: 2026-11-28) is never the guest's to read or write at
// all (the relay's gate refuses it before the record parses: relay/src/storeRoute.ts finGate). Every other rule is
// everyone's alike (its ベル: a wallet that earns none, having no Health data: model/bells.ts). Pure.
import { GOAL_FROM_KEY, isActivityMetric, isPersonId, PROFILE_PREF_KEYS, type EventRow, type SnapshotRows } from './api.ts';
import { isRec } from './guards.ts';
import type { Who } from '../types.ts';
import { goalKeysOf } from './goals.ts';
import { listenSeen, listenSummaryJson } from './listen.ts';

type Rec = Record<string, unknown>;

/** The からだ goals (`pref goalWeight`, `goalBodyFat`, `goalBmi`, `goalLean`, …: contract/goals.ts group `body`) and the
 *  weight goal's start (`goalWeightFrom`): body data, never the guest's to read or write. */
const BODY_GOAL_KEYS: readonly unknown[] = [...goalKeysOf('body'), GOAL_FROM_KEY];

/** Whether an event type is the members' alone (never read or written by the guest): the shared money's, every type
 *  named `fin_*` (by its prefix, so a type added later is covered before anyone lists it: guest.test.ts enumerates
 *  EVENT_TYPES). @public (relay/src/store.ts) */
export const membersOnly = (type: unknown): boolean => typeof type === 'string' && type.startsWith('fin_');

/**
 * Whether the guest may write this event: anything a member may (the record's own rules then apply to it as to anyone)
 * but a からだ goal and the shared money: the record answers `forbidden`. @public (relay/src/store.ts)
 */
export const guestMayWrite = (type: string, d: Rec): boolean => !membersOnly(type) && !(type === 'pref' && BODY_GOAL_KEYS.includes(d.key));

/** A `pref` row's data: null for any other row, false for an unreadable one. */
function prefData(r: EventRow): Rec | null | false {
  if (r[3] !== 'pref') return null;
  try {
    const d: unknown = JSON.parse(r[4] || '{}');
    return isRec(d) && d;
  } catch {
    return false;
  }
}

/**
 * Whether a profile `pref` row (sex, birth date: contract/profile.ts) reaches anyone: a member's (its subject `person`,
 * else its sender, A or B) and the guest's (its own, sent by it) reach all three phones; a row naming anyone else, no
 * one. Any other row: yes.
 */
function profileSeen(r: EventRow, d: Rec): boolean {
  if (!PROFILE_PREF_KEYS.includes(d.key as string)) return true;
  const subject = d.person === undefined ? r[1] : d.person;
  return isPersonId(subject) || (subject === 'G' && r[1] === 'G');
}

/** Whether an event row is body data: an InBody sheet (`inbody`, contract/bodyEst.ts) or a からだ goal. */
const bodyEvent = (r: EventRow, d: Rec | null | false): boolean => r[3] === 'inbody' || (!!d && BODY_GOAL_KEYS.includes(d.key));

/**
 * A `listen` row (English Study's, contract/listen.ts) as `me` gets it: its owner's whole; anyone else's summary only
 * (`{d, g, n, ms, gm, f?}`: a clip studied, never the clip, the level or the answers), for all three alike; null for a
 * row that isn't one. Any other row as it is.
 */
function listenFor(me: Who, r: EventRow): EventRow | null {
  if (r[3] !== 'listen') return r;
  if (listenSeen(me, r[1]) === 'all') return r;
  const summary = listenSummaryJson(r[4]);
  return summary === null ? null : [r[0], r[1], r[2], r[3], summary];
}

/**
 * The rows `me`'s phone gets (every `snapshot` and delta, relay/src/store.ts): everything, the others' English Study rows
 * as their summaries (listenFor); the guest's without the body data (only the activity metrics: steps, Move, Exercise,
 * Stand; no InBody sheet, no からだ goal) and without the shared money (membersOnly). @public (relay/src/store.ts)
 */
export function rowsFor(me: Who, rows: SnapshotRows): SnapshotRows {
  const guest = me === 'G';
  let changed = guest;
  const events: EventRow[] = [];
  for (const r of rows.events) {
    const d = prefData(r);
    const out = (d === null || d === false || profileSeen(r, d)) && !(guest && (bodyEvent(r, d) || membersOnly(r[3]))) ? listenFor(me, r) : null;
    if (out !== r) changed = true;
    if (out) events.push(out);
  }
  if (!changed) return rows;
  return { metrics: guest ? rows.metrics.filter((r) => isActivityMetric(r[3])) : rows.metrics, events };
}
