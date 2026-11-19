// The leaf menu's order, this phone's person's own (`pref menuOrder`, contract/menu.ts): read merged over the default
// (ui-state/menuOrder.ts), set at each drop in 設定 → メニュー, reset by 元に戻す (null: the default, a later build's
// too). `bots`: this phone shows ボット (components/bots botTabs). The model shows a send at once (week.svelte.ts).
import { week } from './week.svelte.ts';
import { UNDO_MS } from './actions.ts';
import type { SendResult } from './backend.ts';
import { menuDefaults, mergeMenuOrder } from '#lib/ui-state/menuOrder.ts';
import type { MenuId } from '#lib/contract/menu.ts';

/** The movable pills in my order (the default before the first paint). */
export function myMenuOrder(bots: boolean): MenuId[] {
  const me = week.model?.me;
  return mergeMenuOrder(menuDefaults(bots), me ? week.model?.state.prefs[me].menuOrder : undefined);
}

/** Keep `order` as mine; the default order is sent as null, so a later build's default still reaches me. */
export function setMenuOrder(order: readonly MenuId[], bots: boolean): SendResult {
  if (!week.model?.me) return { ok: false };
  return week.send('pref', { key: 'menuOrder', value: order.join() === menuDefaults(bots).join() ? null : [...order] });
}

/** 元に戻す: the default order at once, sent after the banner's 取り消す window. */
export const resetMenuOrder = (): SendResult => week.send('pref', { key: 'menuOrder', value: null }, { holdMs: UNDO_MS });
