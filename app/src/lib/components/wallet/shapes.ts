// The menu editor's limits and clean-up (the model's own check, parseMenu, is looser: these keep a menu tidy on a phone).
import type { MenuSection, WalletItem } from '#lib/types.ts';

/** Labels and prices the editor accepts (a label fits two lines of a 2-column tile at 320; a price is a whole number). */
export const MENU_LIMITS = { label: 24, minBells: 1, maxBells: 9_999_999, items: 12 } as const;

/** One section as the editor keeps it: trimmed labels, whole prices in range, at most MENU_LIMITS.items. */
export function cleanMenu(section: MenuSection, items: { id: string; label: string; bells: number | string }[]): WalletItem[] {
  return items
    .map((i) => ({ id: i.id, section, label: String(i.label).trim().slice(0, MENU_LIMITS.label), bells: Math.round(Number(String(i.bells).replace(/[^\d]/g, ''))) }))
    .filter((i) => i.label && Number.isFinite(i.bells) && i.bells >= MENU_LIMITS.minBells && i.bells <= MENU_LIMITS.maxBells)
    .slice(0, MENU_LIMITS.items);
}
