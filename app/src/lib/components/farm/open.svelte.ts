// 畑's sheet (docs/farming.md "Playing"): a lazySheet, opened by the はたけ pill (island/FarmButton.svelte).
import { lazySheet } from '#lib/ui-state/lazySheet.svelte.ts';

export const farmSheet = lazySheet(() => import('./FarmSheet.svelte'));
