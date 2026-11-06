// りょこう's always-loaded part (docs/design.md §Trips): its sheet, a lazySheet (the chunk with the guides, their strings
// and the sheet); the menu's pill shows it, the HUD mounts it.
import { lazySheet } from '#lib/ui-state/lazySheet.svelte.ts';

export const trips = lazySheet(() => import('./TravelSheet.svelte'));
