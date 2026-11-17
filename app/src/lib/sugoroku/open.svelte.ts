// 英語すごろく's always-loaded part (docs/sugoroku.md): its sheet, a lazySheet (its own chunk; the words and lines are
// chunks of their own), opened by the leaf menu's すごろく pill (island/HudMenu.svelte) and mounted by the HUD (island/Hud.svelte).
import { lazySheet } from '#lib/ui-state/lazySheet.svelte.ts';

/** `show('online')`: straight into the online game (an invitation's 参加). */
export const sugoroku = lazySheet<'online'>(() => import('./components/SugorokuSheet.svelte'));
