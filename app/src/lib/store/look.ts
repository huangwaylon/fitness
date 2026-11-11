// A person's look and コーデ (docs/players.md "The look"; contract/look.ts): reading the look each person
// wears, and the actions of せってい → すがた. Each sends one `pref` of the sender's own (the guest's too): `look` when
// the level is left (the UI decides when), `savedLooks` (the whole list) at each コーデ edit. Results are synchronous;
// the model shows a send at once (week.svelte.ts).
import { week } from './week.svelte.ts';
import type { SendResult } from './backend.ts';
import type { Who } from '#lib/types.ts';
import {
  DEFAULT_LOOKS, isPlayerLook, LOOK_LIMITS, lookName, newLookId, playerOf, resolveLook, sameLook, usePartTable,
  type Look, type PlayerLook, type SavedLook
} from '#lib/contract/look.ts';
import PART_IDS from '#lib/contract/partIds.json' with { type: 'json' };

// the parts this app has (scripts/players3d-models.ts: an id ending in a digit by its line, the rest exactly): a look naming any other (a newer app's, one dropped) reads as
// いつもの's part, and this phone never sends one. (The relay keeps the form check only: a newer phone's part survives
// an older relay; each phone draws what it has.)
const exactIds = new Set(PART_IDS.exact), lineIds = PART_IDS.lines as Record<string, string>;
usePartTable({ has: (id) => exactIds.has(id) || (lineIds[id.slice(0, -1)] ?? '').includes(id.slice(-1)) });

/** けす's とりけす: the delete is shown at once and sent after this (the UI's banner carries the SendResult's undo). */
const DELETE_HOLD_MS = 5000;

/** Who holds this phone (`G`: the guest), or null before the first paint. */
const viewer = (): Who | null => week.model?.me ?? null;

/** The look `who` wears now (いつもの when unset; a part this app doesn't know reads as いつもの's). @public (the 3D
 *  player, the すがた level) */
export function lookOf(who: Who): Look {
  return resolveLook(week.model?.state.prefs[who], who);
}

/** This phone's own look (A's before the first paint). @public (the すがた level) */
export const myLook = (): Look => lookOf(viewer() ?? 'A');

/** This phone's own コーデ, newest first (いつもの not among them: it's always shown first, never stored). @public (the すがた level) */
export function mySavedLooks(): SavedLook[] {
  const me = viewer();
  return (me && week.model?.state.prefs[me].savedLooks) || [];
}

/**
 * Wear a player look (the すがた level's preview, sent as it's left). A member's own いつもの is sent as null (no
 * `look` pref: いつもの, which follows the code if it's ever retuned). `{ok:false}` for a look that isn't whole (a part
 * of the wrong slot, a one-piece with bottoms) or before the first paint. @public (the すがた level)
 */
export function wearLook(look: PlayerLook): SendResult {
  const me = viewer();
  if (!me || !isPlayerLook(look)) return { ok: false };
  if (me !== 'G' && sameLook(look, DEFAULT_LOOKS[me])) return wearUsual();
  return week.send('pref', { key: 'look', value: { kind: 'player', look } });
}

/** Back to いつもの (clears the `look` pref). @public (the すがた level) */
export const wearUsual = (): SendResult => week.send('pref', { key: 'look', value: null });

/** Wear the roster villager (すがた's むらびと tab, sent as the level is left): `villager` a roster id (also sends the
 *  `villager` pref first), or none for the one already picked. @public (the すがた level) */
export function wearVillager(villager?: string): SendResult {
  if (villager !== undefined) {
    const r = week.send('pref', { key: 'villager', value: villager });
    if (!r.ok) return r;
  }
  return week.send('pref', { key: 'look', value: { kind: 'villager' } });
}

/**
 * すがた's とりけす (the banner after leaving with a change): wear `look` again with `villager` as the villager pref, as
 * when the level opened (`villager` the roster id then). The villager pref first, if it isn't that; then the look (a villager look is the guest's いつもの,
 * no `look` pref). @public (the すがた level)
 */
export function restoreLook(look: Look, villager: string): SendResult {
  const me = viewer();
  if (!me) return { ok: false };
  if ((week.model?.state.prefs[me].villager ?? null) !== villager) {
    const r = week.send('pref', { key: 'villager', value: villager });
    if (!r.ok) return r;
  }
  if (look.kind === 'player') return wearLook(playerOf(look, me));
  return me === 'G' ? wearUsual() : wearVillager();
}

function sendSaved(list: SavedLook[], holdMs?: number): SendResult {
  return week.send('pref', { key: 'savedLooks', value: list }, holdMs ? { holdMs } : {});
}

/**
 * Save `look` as a new コーデ named `name` (trimmed, 1–12 characters), first in the list (newest first). `full`: at
 * LOOK_LIMITS.saved already (「いっぱいだよ」); `name`: an empty or too long name. `id`: the new コーデ's. @public (the すがた level)
 */
export function saveLook(name: string, look: PlayerLook): SendResult & { id?: string; why?: 'full' | 'name' | 'look' } {
  const n = lookName(name);
  if (n === null) return { ok: false, why: 'name' };
  if (!isPlayerLook(look)) return { ok: false, why: 'look' };
  const list = mySavedLooks();
  if (list.length >= LOOK_LIMITS.saved) return { ok: false, why: 'full' };
  let id = newLookId();
  while (list.some((s) => s.id === id)) id = newLookId();
  const r = sendSaved([{ id, name: n, look }, ...list]);
  return r.ok ? { ...r, id } : r;
}

/** うわがき: the コーデ `id` now holds `look` (its place and name kept). @public (the すがた level) */
export function overwriteLook(id: string, look: PlayerLook): SendResult {
  const list = mySavedLooks();
  if (!isPlayerLook(look) || !list.some((s) => s.id === id)) return { ok: false };
  return sendSaved(list.map((s) => (s.id === id ? { ...s, look } : s)));
}

/** なまえを かえる: the コーデ `id` named `name` (trimmed, 1–12 characters). @public (the すがた level) */
export function renameLook(id: string, name: string): SendResult {
  const n = lookName(name);
  const list = mySavedLooks();
  if (n === null || !list.some((s) => s.id === id)) return { ok: false };
  return sendSaved(list.map((s) => (s.id === id ? { ...s, name: n } : s)));
}

/** けす: the コーデ `id` removed, shown at once and sent after DELETE_HOLD_MS (the result's `undo` takes it back
 *  meanwhile: 「とりけす」). @public (the すがた level) */
export function deleteLook(id: string): SendResult {
  const list = mySavedLooks();
  if (!list.some((s) => s.id === id)) return { ok: false };
  return sendSaved(list.filter((s) => s.id !== id), DELETE_HOLD_MS);
}
