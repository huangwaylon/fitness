// The leaf menu's movable pills in a person's order (`pref menuOrder`, contract/menu.ts; docs/design.md "Island"
// Menu): the saved order merged over this phone's default one. Pure.
import type { MenuId } from '#lib/contract/menu.ts';

/** The default order of the pills between ベル (first) and 設定 (last); ボット only on a phone with a bot. */
export const menuDefaults = (bots: boolean): MenuId[] => ['travel', 'wedding', 'hiking', 'english', ...(bots ? (['bots'] as const) : [])];

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

/** `list` with the item at `from` moved to `to` (both clamped to the list). */
export function moved<T>(list: readonly T[], from: number, to: number): T[] {
  const out = [...list];
  const [x] = out.splice(from, 1);
  out.splice(Math.max(0, Math.min(out.length, to)), 0, x);
  return out;
}
