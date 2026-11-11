// 結婚式's always-loaded part (docs/wedding.md): the board's sheet, a lazySheet (the board comes with its chunk,
// WeddingSheet.svelte); the menu's pill shows it, the HUD mounts it.
import { lazySheet } from '#lib/ui-state/lazySheet.svelte.ts';

export const weddingSheet = lazySheet(() => import('./WeddingSheet.svelte'));
