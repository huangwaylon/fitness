// English Study's always-loaded part (docs/english.md): its sheet, a lazySheet (the chunk with the clips, the lesson
// and the player), opened by the leaf menu's 英語 pill (island/HudMenu.svelte) and mounted by the HUD (island/Hud.svelte).
import { lazySheet } from '#lib/ui-state/lazySheet.svelte.ts';

/** `show('sugoroku')`: on すごろく's tab, straight into the online game (an invitation's 参加); `show('game')`: on the
 *  tab (back from the board's own screen). */
export const english = lazySheet<'sugoroku' | 'game'>(() => import('./components/EnglishSheet.svelte'));
