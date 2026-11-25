// The leaf menu's retired per-person order and hidden pills (`pref menuOrder`, `pref menuHidden`): the menu is one fixed
// grid for everyone since 2026-11-25 (ui-state/menuGrid.ts) and nothing reads them. The record still takes them (an
// older build may send one; refusing it would show that phone an error) and keeps one row per person each (their slot:
// record.ts), so the old rows stay harmless. Pure, dependency-free (the relay imports it).

/** Every id an older build's order may name (frozen: no new ones). */
const MENU_IDS: readonly unknown[] = ['travel', 'wedding', 'hiking', 'english', 'bots', 'bells', 'todo', 'places'];

/** The ids a person may hide: all but ベル. */
const HIDEABLE = MENU_IDS.filter((id) => id !== 'bells');

const idsOk = (ids: readonly unknown[], v: unknown): boolean =>
  v === null || (Array.isArray(v) && v.length >= 1 && v.length <= ids.length && v.every((x) => ids.includes(x)) && new Set(v).size === v.length);

/** Whether the record takes this `menuOrder` value: null, or 1 … MENU_IDS.length known ids, each once (設定 is not an
 *  id: never moved). */
export const menuIdsOk = (v: unknown): v is string[] | null => idsOk(MENU_IDS, v);

/** Whether the record takes this `menuHidden` value: as menuIdsOk, less ベル (never hidden). */
export const menuHiddenOk = (v: unknown): v is string[] | null => idsOk(HIDEABLE, v);

/** Whether a stored value keeps its slot (record.ts prefTaken; looser than menuIdsOk): null, or up to 24 id-shaped
 *  strings. */
export const menuIdsRead = (v: unknown): v is string[] | null =>
  v === null || (Array.isArray(v) && v.length <= 24 && v.every((x) => typeof x === 'string' && /^[a-z][a-z0-9-]{0,23}$/.test(x)));

