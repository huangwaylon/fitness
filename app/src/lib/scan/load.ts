// ごはん's barcode scan, the decoder's chunk (decode.ts: zxing-wasm and its wasm, ~1 MB raw, ~400 KB on the wire) fetched
// only for the scanner: on the press of バーコードで探す (FoodSearch), else as the scanner opens. Kept once fetched (the
// service worker keeps the files too: caches.ts carried); a failed fetch (offline before first use) is tried again
// next time.
import { once } from '#lib/once.ts';

export const decoder: () => Promise<typeof import('./decode.ts')> = once(() => import('./decode.ts'));
/** The decoder's chunk and wasm fetched and compiled ahead (a press), nothing awaited, a failure left to the open. */
export const warmDecoder = (): void => void decoder().then((m) => m.warm()).catch(() => {});
