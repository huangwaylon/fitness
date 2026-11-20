// The leaf menu, each person's own (docs/design.md "Island" Menu; edited in the menu itself, by a long press): its
// order (`pref menuOrder`: the movable pills' ids in that person's order, or null for the default, so a later build's
// default reaches them) and the pills hidden (`pref menuHidden`: ids, or null for none, so a later pill shows).
// ベル moves (`bells`, first by default) but is never hidden: the wallet, the coins land on it. 設定 stays last, never
// hidden, so it is not an id here. Pure, dependency-free (the relay imports it).

/**
 * Every movable pill's id ever shipped: append-only (a stored order may name a retired one; the phones drop it on
 * read). A new pill's id lands here, and on the relay, before the app that shows it (docs/ops/runbook.md §8).
 */
export const MENU_IDS = ['travel', 'wedding', 'hiking', 'english', 'bots', 'bells'] as const;
export type MenuId = (typeof MENU_IDS)[number];

/** The ids a person may hide: all but ベル. */
const HIDEABLE: readonly unknown[] = MENU_IDS.filter((id) => id !== 'bells');

const idsOk = (ids: readonly unknown[], v: unknown): boolean =>
  v === null || (Array.isArray(v) && v.length >= 1 && v.length <= ids.length && v.every((x) => ids.includes(x)) && new Set(v).size === v.length);

/** Whether the record takes this `menuOrder` value: null, or 1 … MENU_IDS.length known ids, each once (設定 is not an
 *  id: never moved). */
export const menuIdsOk = (v: unknown): v is MenuId[] | null => idsOk(MENU_IDS, v);

/** Whether the record takes this `menuHidden` value: as menuIdsOk, less ベル (never hidden). */
export const menuHiddenOk = (v: unknown): v is MenuId[] | null => idsOk(HIDEABLE, v);

/** Whether a phone reads a stored value (looser than menuIdsOk, so a row naming an id this build lacks still
 *  counts: its known ids are used): null, or up to 24 id-shaped strings. */
export const menuIdsRead = (v: unknown): v is string[] | null =>
  v === null || (Array.isArray(v) && v.length <= 24 && v.every((x) => typeof x === 'string' && /^[a-z][a-z0-9-]{0,23}$/.test(x)));

