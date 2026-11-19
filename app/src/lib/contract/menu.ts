// The leaf menu's order, each person's own (`pref menuOrder`, docs/design.md "Island" Menu; 設定 → メニュー): the
// movable pills' ids in that person's order, or null for the default (元に戻す: a later build's default reaches them).
// ベル stays first and 設定 last, so they are not ids here. Pure, dependency-free (the relay imports it).

/**
 * Every movable pill's id ever shipped: append-only (a stored order may name a retired one; the phones drop it on
 * read). A new pill's id lands here, and on the relay, before the app that shows it (docs/ops/runbook.md §8).
 */
export const MENU_IDS = ['travel', 'wedding', 'hiking', 'english', 'bots'] as const;
export type MenuId = (typeof MENU_IDS)[number];

/** Whether the record takes this `menuOrder` value: null, or 1 … MENU_IDS.length known ids, each once. */
export const menuOrderOk = (v: unknown): v is MenuId[] | null =>
  v === null || (Array.isArray(v) && v.length >= 1 && v.length <= MENU_IDS.length
    && v.every((x) => (MENU_IDS as readonly unknown[]).includes(x)) && new Set(v).size === v.length);

/** Whether a phone reads a stored value (looser than menuOrderOk, so a row naming an id this build lacks still
 *  counts: its known ids are used): null, or up to 24 id-shaped strings. */
export const menuOrderRead = (v: unknown): v is string[] | null =>
  v === null || (Array.isArray(v) && v.length <= 24 && v.every((x) => typeof x === 'string' && /^[a-z][a-z0-9-]{0,23}$/.test(x)));
