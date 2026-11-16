// English Study's always-loaded part (docs/english.md): its sheet, a lazySheet (the chunk with the clips, the lesson
// and the player), opened by the leaf menu's 英語 pill (island/HudMenu.svelte) and mounted by the HUD (island/Hud.svelte).
import { lazySheet } from '#lib/ui-state/lazySheet.svelte.ts';
import { hooksOn } from '#lib/ui-state/preview.ts';

export const english = lazySheet(() => import('./components/EnglishSheet.svelte'));

// the specs' and the console's way in (the demo's hooks)
if (typeof location !== 'undefined' && hooksOn(new URLSearchParams(location.search))) (window as unknown as { __english?: unknown }).__english = { open: () => english.show() };
