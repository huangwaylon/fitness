// ボット's always-loaded part (docs/design.md "Bots"): its sheet (a lazySheet: the two pages and their strings come
// with its chunk), the tabs this phone has, and the attention dots. 保養所 (ItsPage) for a member with ITS_URL set, not in
// demo mode (no fixture); ジム (GymPage) for a member with GYM_URL set; the guest has neither, so no ボット in the menu.
// A dot (the menu's pill, a tab) while that bot needs a person: ITS 要対応 (a hold to finish by mail), 不調 or 遅れ
// (its/view.ts needsAttention); the gym bot 不調, 要対応 or 遅れ (gym/status.ts needsAttention). Read once as the menu
// unfolds (ITS) or the sheet opens (the tab not shown), at most once a minute, and from each page's own reads; never
// polled: the pages poll while shown.
import { lazySheet } from '#lib/ui-state/lazySheet.svelte.ts';
import { week } from '#lib/store/week.svelte.ts';

export type BotTab = 'its' | 'gym';

export const botsSheet = lazySheet(() => import('./BotsSheet.svelte'));

// (the URLs as lib/its/client.ts and lib/gym/status.ts read them: empty hides that bot; read here so the island's
// chunk carries neither client)
const env = (import.meta.env ?? {}) as Record<string, string | undefined>;
const ITS_ON = env.VITE_ITS_URL !== '';
const GYM_ON = env.VITE_GYM_URL !== '';

/** The tabs this phone has, left to right (none: the guest, or no bot configured). */
export function botTabs(): BotTab[] {
  if (week.guest) return [];
  return [...(ITS_ON && !week.demo ? ['its' as const] : []), ...(GYM_ON ? ['gym' as const] : [])];
}

/** The bots needing a person, as last read. */
export const botsBadge = $state({ its: false, gym: false });

const FRESH_MS = 60_000;
const readAt: Record<BotTab, number> = { its: -Infinity, gym: -Infinity };

/** That bot's dot, read again unless read in the last minute (members only: botTabs). */
export function readBadge(k: BotTab): void {
  if (!botTabs().includes(k) || performance.now() - readAt[k] < FRESH_MS) return;
  readAt[k] = performance.now();
  void import('./badge.ts')
    .then((m) => m.attention(k))
    .then((v) => void (v !== null && (botsBadge[k] = v)), () => {});
}

/** A page just read its bot itself (its dot follows what it shows). */
export function setBadge(k: BotTab, v: boolean): void {
  readAt[k] = performance.now();
  botsBadge[k] = v;
}
