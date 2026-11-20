// The leaf menu, this phone's person's own (`pref menuOrder`, `pref menuHidden`: contract/menu.ts), edited in the menu
// itself (a long press: HudMenu): the order read merged over the default (ui-state/menuOrder.ts), set at each drop;
// the hidden pills set at each ⊖ / ⊕; 元に戻す resets both (null: the default, a later build's too, every pill shown).
// `bots`: this phone shows ボット (components/bots botTabs). The model shows a send at once (week.svelte.ts).
import { week } from './week.svelte.ts';
import { UNDO_MS } from './actions.ts';
import type { SendResult } from './backend.ts';
import { menuDefaults, mergeMenuOrder, shownHidden } from '#lib/ui-state/menuOrder.ts';
import type { MenuId } from '#lib/contract/menu.ts';

const myPrefs = () => ((me) => (me ? week.model?.state.prefs[me] : undefined))(week.model?.me);

/** The movable pills in my order, hidden ones too (the default before the first paint). */
export const myMenuOrder = (bots: boolean): MenuId[] => mergeMenuOrder(menuDefaults(bots), myPrefs()?.menuOrder);

/** The pills I hid, of those this phone shows. */
export const myMenuHidden = (bots: boolean): Set<MenuId> => shownHidden(menuDefaults(bots), myPrefs()?.menuHidden);

/** Keep `order` as mine; the default order is sent as null, so a later build's default still reaches me. */
export function setMenuOrder(order: readonly MenuId[], bots: boolean): SendResult {
  if (!week.model?.me) return { ok: false };
  return week.send('pref', { key: 'menuOrder', value: order.join() === menuDefaults(bots).join() ? null : [...order] });
}

/** Hide or show one pill (the others I hid stay so, one this phone lacks too); none hidden is sent as null. */
export function setMenuHidden(id: MenuId, hide: boolean): SendResult {
  if (!week.model?.me) return { ok: false };
  const was = (myPrefs()?.menuHidden ?? []).filter((x) => x !== id);
  const next = hide ? [...was, id] : was;
  return week.send('pref', { key: 'menuHidden', value: next.length ? next : null });
}

/** 元に戻す: the default order and every pill shown at once, sent after the banner's 取り消す window (one 取り消す for
 *  both). */
export function resetMenu(): SendResult {
  if (!week.model?.me) return { ok: false };
  const sent = (['menuOrder', 'menuHidden'] as const).filter((key) => myPrefs()?.[key]).map((key) => week.send('pref', { key, value: null }, { holdMs: UNDO_MS }));
  if (!sent.length || !sent.every((r) => r.ok)) return { ok: false };
  return {
    ok: true,
    undo: () => sent.map((r) => r.undo?.() ?? false).every(Boolean),
    hold: (ms) => Math.min(...sent.map((r) => r.hold?.(ms) ?? 0))
  };
}
