// One function per user action. Each records an event through the store's backend (live: the write queue,
// lib/sync/queue.ts; demo: kept in memory, demo/backend.ts) and the store recomputes the view with it at once through
// the model, so a tap moves the wallet and きろく the same way everywhere. Results are synchronous.
import { week } from './week.svelte.ts';
import type { SendResult } from './backend.ts';
import { toasts } from '#lib/ui-state/toast.svelte.ts';
import { newId } from '#lib/sync/queue.ts';
import { setLocale, t, type Locale } from '#lib/i18n/index.ts';
import { parseMenu } from '#lib/model/state.ts';
import type { PersonId, WalletItem } from '#lib/types.ts';
import { isWeightKg, roundKg } from '#lib/contract/api.ts';
import { MOVE_GOAL } from '#lib/config/rules.ts';

/** 買う！ and its とりけす wait this long before they are sent, with もとに戻す on the banner. */
const UNDO_MS = 5000;

/**
 * The banner for an action held UNDO_MS: it names what was done and carries もとに戻す; hovering, touching
 * or focusing it holds both the banner and the send. A refused action shows nothing here.
 */
export function undoBanner(text: string, r: SendResult, opts: { reaction?: string } = {}): void {
  if (!r.ok) return;
  const undo = r.undo;
  toasts.show(text, UNDO_MS, {
    reaction: opts.reaction ?? 'pleased',
    hold: r.hold,
    ...(undo ? { action: { label: t('common.undo'), run: () => undo() } } : {})
  });
}

/** `highFivesToday` counts the partner's high-fives to me, so sending one changes nothing in my view. */
export function highFive() {
  return week.send('highfive', {});
}

export function confirmHarvest(): SendResult {
  const wk = week.view?.harvest?.weekKey;
  if (!wk) return { ok: false };
  return week.send('harvest', { week: wk });
}

// ---- The wallet: buy from the shared menu, undo, edit the menu. No approvals.

/**
 * Buy a menu item from the wallet at its current price (an escalating food treat's price this week, `MenuItemView.price`):
 * shown at once, sent after the UNDO_MS banner. `{ok:false}` when the item is unknown or the wallet can't cover it (the
 * model would ignore the buy anyway). `bells`: what was charged.
 */
export function buy(itemId: string): SendResult & { bells?: number } {
  const v = week.view;
  const item = v?.menu.find((x) => x.id === itemId);
  if (!v || !item || v.wallet.balance < item.price) return { ok: false };
  const r = week.send('spend', { spendId: newId(), item: item.id, label: item.label, bells: item.price }, { holdMs: UNDO_MS });
  return { ...r, bells: item.price };
}

/** Take a buy back (the buyer only; the model ignores anyone else's `spend_void`). */
export function undoSpend(spendId: string): SendResult {
  return week.send('spend_void', { spendId }, { holdMs: UNDO_MS });
}

/** Replace the shared menu, one list (either of us; the latest edit wins). `{ok:false}` if the list is invalid. */
export function saveMenu(items: WalletItem[]): SendResult {
  const clean = parseMenu(items.map((x) => ({ id: x.id, label: x.label, bells: Math.round(x.bells) })));
  if (!clean) return { ok: false };
  return week.send('pref', { key: 'menu', value: JSON.stringify(clean) });
}

/** A fresh id for a new menu item. */
export const newMenuItemId = (): string => newId().replace(/[^\w-]/g, '').slice(0, 24);

// ---- The goals, in きろく's 目標 card: either person sets either person's (`person`). Health data itself is never
// entered here: Apple Health is the source of truth.

/** A goal weight in kg (one decimal), or null to clear it. Both of us see it; it never earns. */
export function setGoalWeight(person: PersonId, kg: number | null): SendResult {
  if (kg === null) return week.send('pref', { person, key: 'goalWeight', value: null });
  const value = roundKg(kg);
  if (!isWeightKg(value)) return { ok: false };
  return week.send('pref', { person, key: 'goalWeight', value });
}

/**
 * A daily Move goal in kcal: an integer within MOVE_GOAL (100–2,000), rounded. It applies from today
 * on, never to earlier days. `{ok:false}` for a value outside the bounds.
 */
export function setMoveGoal(person: PersonId, kcal: number): SendResult {
  const value = Math.round(kcal);
  if (!Number.isFinite(value) || value < MOVE_GOAL.min || value > MOVE_GOAL.max) return { ok: false };
  return week.send('pref', { person, key: 'moveGoal', value });
}

export function setLanguage(locale: Locale) {
  setLocale(locale);
  return week.send('pref', { key: 'locale', value: locale });
}

/** A villager name as typed in 村人 (the field holds VILLAGER_NAME_CHARS; the model accepts up to LIMITS'). */
const VILLAGER_NAME_CHARS = 12;

export function setVillagerName(name: string): SendResult {
  const villagerName = name.trim().slice(0, VILLAGER_NAME_CHARS);
  if (!villagerName) return { ok: false };
  return week.send('pref', { key: 'villagerName', value: villagerName });
}

/** Villager from the roster (しまフォン → 村人), e.g. 'goldie' (lib/villagers/roster.ts). */
export function setVillager(villager: string) {
  return week.send('pref', { key: 'villager', value: villager });
}
