// The leaf menu's movable pills in a person's order and which they hid (`pref menuOrder`, `pref menuHidden`:
// contract/menu.ts; docs/design.md "Island" Menu): the saved order merged over this phone's default one. Pure.
import type { MenuId } from '#lib/contract/menu.ts';

/** Each movable pill's name (its i18n key). */
export const MENU_LABEL: Record<MenuId, string> = { bells: 'island.bellsRow', travel: 'panel.travel', wedding: 'panel.wedding', hiking: 'panel.hiking', places: 'panel.places', english: 'panel.english', bots: 'panel.bots', todo: 'panel.todo' };

/** The pills above 設定 by default (MENU_IDS is append-only: 地図 goes after 登山 here). */
const DEFAULT_ORDER: readonly MenuId[] = ['travel', 'wedding', 'hiking', 'places', 'english', 'bots', 'todo'];

/** The default order of the pills above 設定 (last, fixed): ベル first, then DEFAULT_ORDER; ボット only on a phone with a
 *  bot. A saved order without ベル (one from before it moved) gets it first (mergeMenuOrder: no default before it). */
export const menuDefaults = (bots: boolean): MenuId[] => ['bells', ...DEFAULT_ORDER.filter((id) => bots || id !== 'bots')];

/**
 * `saved` over `defaults`: the saved ids this phone shows, in the saved order (an unknown, retired or hidden one
 * dropped, a repeat kept once), then each default id the saved order lacks (a pill newer than it) put back where it
 * goes by default: right after the nearest default id before it, or first if none.
 */
export function mergeMenuOrder(defaults: readonly MenuId[], saved: readonly string[] | null | undefined): MenuId[] {
  if (!saved) return [...defaults];
  const out = [...new Set(saved)].filter((id): id is MenuId => (defaults as readonly string[]).includes(id));
  defaults.forEach((id, i) => {
    if (out.includes(id)) return;
    const before = defaults.slice(0, i).findLast((d) => out.includes(d));
    out.splice(before === undefined ? 0 : out.indexOf(before) + 1, 0, id);
  });
  return out;
}

/** The saved hidden ids this phone shows (an unknown, retired or absent one ignored: a pill newer than the list shows).
 *  設定 (not an id) and ベル (the wallet) are never among them. */
export const shownHidden = (defaults: readonly MenuId[], saved: readonly string[] | null | undefined): Set<MenuId> =>
  new Set(defaults.filter((id) => id !== 'bells' && saved?.includes(id)));

/** `list` with the item at `from` moved to `to` (both clamped to the list). */
export function moved<T>(list: readonly T[], from: number, to: number): T[] {
  const out = [...list];
  const [x] = out.splice(from, 1);
  out.splice(Math.max(0, Math.min(out.length, to)), 0, x);
  return out;
}
