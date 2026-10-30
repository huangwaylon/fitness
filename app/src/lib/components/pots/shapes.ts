// The menu editor's limits and clean-up (the model's own check, parseMenu, is looser: these keep a menu tidy on a phone).
import type { MenuItem } from '#lib/types.ts';

export type { MenuItem } from '#lib/types.ts';

/** Labels and prices a menu editor accepts (a label fits two lines of a 2-column button at 320; a price is a whole number). */
export const MENU_LIMITS = { label: 24, minBells: 1, maxBells: 9_999_999, items: 12 } as const;

/** A menu as the editor keeps it: trimmed labels, whole prices in range, at most MENU_LIMITS.items. */
export function cleanMenu(items: { id: string; label: string; bells: number | string }[]): MenuItem[] {
  return items
    .map((i) => ({ id: i.id, label: String(i.label).trim().slice(0, MENU_LIMITS.label), bells: Math.round(Number(String(i.bells).replace(/[^\d]/g, ''))) }))
    .filter((i) => i.label && Number.isFinite(i.bells) && i.bells >= MENU_LIMITS.minBells && i.bells <= MENU_LIMITS.maxBells)
    .slice(0, MENU_LIMITS.items);
}
