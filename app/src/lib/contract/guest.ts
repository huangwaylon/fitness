// The guest (docs/design.md "The guest", docs/backend.md#the-guest): a third key, KEY_C, for a visitor who does
// everything on the island a member does (2026-11-06: the island is everyone's alike: the もようがえ and the layout,
// the decorations, the shop, the museum, the homes, the board, the flowers and the stars, English Study), sees the members'
// activity and ベル, but never earns or spends ベル, sets none of the members' goals, never writes their own records (the
// wedding board, a trip's notes) and never sees their bodies (weight, body fat, BMI, lean mass and their goals). These
// are the record's rules for that key, shared by the record (relay/src/store.ts: what it accepts from the guest and
// what its snapshot leaves out) and the demo (`?demo&as=G` shows what the guest's phone would get). Pure.
import { isActivityMetric, isPersonId, PROFILE_PREF_KEYS, type EventRow, type SnapshotRows } from './api.ts';
import { isRec } from './guards.ts';
import type { Who } from '../types.ts';
import { goalKeysOf } from './goals.ts';
import { listenSeen, listenSummaryJson } from './listen.ts';

/** The guest's own prefs: cosmetic (its look and コーデ too: contract/look.ts), its meal log's daily goals (kcal and the nutrients; never another goal, never
 *  another person's) and the island's weather and look (`weatherMode`, `seasonLook`: one each for the island, whoever
 *  set it last). Its profile is locked, as everyone's (relay/src/store.ts `profile locked`). */
const GUEST_PREF_KEYS: readonly unknown[] = ['locale', 'villagerName', 'villager', 'look', 'savedLooks', 'weatherMode', 'seasonLook', ...goalKeysOf('food')];

type Rec = Record<string, unknown>;

/**
 * Whether the guest may write this event: everything on the island a member may (the record's own rules then apply to
 * it as to anyone: a `decor` op's scope, contract/layout.ts scopeMayWrite; a board note's author, a meal's owner, a
 * pocket's catches): its catches (`find`, `tally`, `tally_back`) and its part of the island's day (`island`), any
 * `decor` op (the island's decorations and its layout, every home's room, its own home's look), the `board`, its
 * meals (`food`, `food_repeat`, `food_recipe`, `food_custom`), the shop (`sell`, `buy`, `buy_starts`: its own pocket and かいがら), 英語すごろく's rewards (`sg_reward`: it plays too), the field (`farm`: its own plants),
 * its English Study clips (`listen`), a flag on English Study's content (`eflag`; its review's `eflag_done` is the
 * members'), a trip's packing list (`pack`: adding, and changing only what it added,
 * contract/pack.ts; its own `pack_chk` and `pack_reset`) and its own cosmetic `pref`, meal-log goal or the
 * island's weather and look (no `person`). Never the economy (a ベル buy `spend`, a `spend_void`, a `harvest`), a goal of the
 * members' (or any `person`), a trip's notes (`trip_note`) or the wedding board (`wtask`, `wdone`, `wconf`, `wnote`):
 * the members' real-world records, read by all three; nor the tree popup's daily checks (`check`: the guest has no tree):
 * the record answers `forbidden`.
 * @public (relay/src/store.ts)
 */
export function guestMayWrite(type: string, d: Rec): boolean {
  switch (type) {
    case 'find':
    case 'tally':
    case 'tally_back':
    case 'island':
    case 'decor':
    case 'board':
    case 'food':
    case 'food_repeat':
    case 'food_recipe':
    case 'food_custom':
    case 'sell':
    case 'buy':
    case 'buy_starts':
    case 'sg_reward':
    case 'farm':
    case 'listen':
    case 'pack':
    case 'pack_chk':
    case 'pack_reset':
    case 'room_save':
    case 'eflag':
      return true;
    case 'pref':
      return d.person === undefined && GUEST_PREF_KEYS.includes(d.key);
    default:
      return false;
  }
}

/** The からだ goals (`pref goalWeight`, `goalBodyFat`, `goalBmi`, `goalLean`: contract/goals.ts group `body`): never
 *  sent to the guest. */
const BODY_GOAL_KEYS: readonly unknown[] = goalKeysOf('body');

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
 * Whether a profile `pref` row (sex, birth date: contract/profile.ts) reaches a viewer: everyone sees every person's
 * (the user, 2026-11-16: 設定 → プロフィール the same on all three phones), a member's (its subject `person`, else its
 * sender, A or B) and the guest's (its own, sent by it). A row naming anyone else: no one. Any other row: yes.
 */
function profileSeen(r: EventRow, d: Rec): boolean {
  if (!PROFILE_PREF_KEYS.includes(d.key as string)) return true;
  const subject = d.person === undefined ? r[1] : d.person;
  return isPersonId(subject) || (subject === 'G' && r[1] === 'G');
}

/** Whether an event row reaches the guest: all but the からだ goals; everyone's profile and every meal do. */
function guestSeesEvent(r: EventRow): boolean {
  const d = prefData(r);
  return d === null || (d !== false && !BODY_GOAL_KEYS.includes(d.key) && profileSeen(r, d));
}

/**
 * The rows the guest's phone gets: the activity metrics (steps, Move, Exercise, Stand: the trees, today's ベル, きろく)
 * and every event but the からだ goals (everyone's profile included), the members' English
 * Study rows as their summaries (listenFor, as a member gets the other's). Never a からだ row: weight, body fat, BMI, lean mass.
 */
export function guestRows(rows: SnapshotRows): SnapshotRows {
  const events: EventRow[] = [];
  for (const r of rows.events) {
    const out = guestSeesEvent(r) ? listenFor('G', r) : null;
    if (out) events.push(out);
  }
  return { metrics: rows.metrics.filter((r) => isActivityMetric(r[3])), events };
}

/**
 * A `listen` row (English Study's, contract/listen.ts) as `me` gets it: its owner's whole; anyone else's summary only
 * (`{d, g, n, ms, gm, f?}`: a clip studied, never the clip, the level or the answers), the guest's and the members'
 * alike; null for a row that isn't one. Any other row as it is.
 */
function listenFor(me: Who, r: EventRow): EventRow | null {
  if (r[3] !== 'listen') return r;
  if (listenSeen(me, r[1]) === 'all') return r;
  const summary = listenSummaryJson(r[4]);
  return summary === null ? null : [r[0], r[1], r[2], r[3], summary];
}

/**
 * The rows `me`'s phone gets (every `snapshot` and delta, relay/src/store.ts): the guest's, guestRows; a member's,
 * everything, the others' English Study rows (the partner's and the guest's)
 * as their summaries (listenFor). @public (relay/src/store.ts)
 */
export function rowsFor(me: Who, rows: SnapshotRows): SnapshotRows {
  if (me === 'G') return guestRows(rows);
  let changed = false;
  const events: EventRow[] = [];
  for (const r of rows.events) {
    const d = prefData(r);
    const out = d === null || d === false || profileSeen(r, d) ? listenFor(me, r) : null;
    if (out !== r) changed = true;
    if (out) events.push(out);
  }
  return changed ? { metrics: rows.metrics, events } : rows;
}
