// 保存した場所's always-loaded part (docs/places.md "Entry"): its sheet, a lazySheet (the chunk with the search, the
// map's light component and the sheet). The leaf menu's 地図 pill opens it.
import { lazySheet } from '#lib/ui-state/lazySheet.svelte.ts';

export const placesSheet = lazySheet(() => import('./PlacesSheet.svelte'));
