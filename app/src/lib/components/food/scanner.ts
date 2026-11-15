// ごはん's barcode scanner, fetched only for itself (FoodScan.svelte and lib/scan: a chunk of their own, outside the
// けんこう sheet's): on the press of バーコードで探す (FoodSearch) with the decoder, else as the level opens (Food's Lazy).
import { warmDecoder } from '#lib/scan/load.ts';

export const scanner = () => import('./FoodScan.svelte');

/** The scanner's chunk and the decoder's fetched ahead (a press), nothing awaited, a failure left to the open. */
export function warmScanner(): void {
  void scanner().catch(() => {});
  warmDecoder();
}
