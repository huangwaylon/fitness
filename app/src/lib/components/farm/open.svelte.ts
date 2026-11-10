// 畑's sheet (docs/farming.md "Playing"): a lazySheet, opened by the farm menu's はたけ pill (island/FarmMenu.svelte).
import { lazySheet } from '#lib/ui-state/lazySheet.svelte.ts';

export const farmSheet = lazySheet(() => import('./FarmSheet.svelte'));
