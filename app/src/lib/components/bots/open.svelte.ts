// ボット's always-loaded part (docs/design.md "Bots"): its sheet (a lazySheet: the pages and their strings come
// with its chunk) and the tabs this phone has (registry.ts: who has which bot). The dots are summary.svelte.ts's. A
// notification's tap opens it on 保養所 (openIts, listenOpen).
import { lazySheet } from '#lib/ui-state/lazySheet.svelte.ts';
import { week } from '#lib/store/week.svelte.ts';
import { BOTS, type BotId } from './registry.ts';

/** `show(tab)`: open on that tab (a notification's tap: 保養所). */
export const botsSheet = lazySheet<BotId>(() => import('./BotsSheet.svelte'));

/** The tabs this phone has, left to right (none: the guest, demo mode, or no bot configured). */
export const botTabs = (): BotId[] => (week.guest || week.demo ? [] : BOTS.filter((b) => b.on).map((b) => b.id));

/** ボット's chunk (its pages with it), fetched ahead (the menu pill's touch-down; the guest has none). */
export const prefetchBots = (): Promise<unknown> => (botTabs().length ? botsSheet.prefetch() : Promise.resolve());

/** A notification's tap (the service worker: service-worker/notify.ts): ボット opened on 保養所, for a phone that has it. */
export function openIts(): void {
  if (botTabs().includes('its')) botsSheet.show('its');
}

/** The service worker's word that a notification was tapped while the app was open ({k: 'open', to: 'its'}); the
 *  listener's removal. (A tap that opens the app comes as `?open=its`: Hud reads it once after boot.) */
export function listenOpen(): () => void {
  const sw = typeof navigator === 'undefined' ? undefined : navigator.serviceWorker;
  const on = (e: MessageEvent) => {
    const d = e.data as { k?: unknown; to?: unknown } | null;
    if (d?.k === 'open' && d.to === 'its') openIts();
  };
  sw?.addEventListener('message', on);
  return () => sw?.removeEventListener('message', on);
}
