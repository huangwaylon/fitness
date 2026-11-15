// ごはん's barcode scan, the decoder (docs/food-data.md "Barcodes"): zxing-cpp's reader as WebAssembly (zxing-wasm,
// MIT; zxing-cpp Apache-2.0), imported only when the scanner opens (its own chunk, `scan.<hash>.js`, and the wasm
// beside it: vite.config.ts feature-names; the service worker keeps both once used, caches.ts carried). The wasm is
// ours, from the build's assets, never the package's default CDN. Retail codes only (EAN-13, EAN-8, UPC-A, UPC-E).
import { prepareZXingModule, purgeZXingModule, readBarcodes, type ReaderOptions } from 'zxing-wasm/reader';
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';
import type { Format } from './barcode.ts';

/** Where the wasm is: ours (given with every prepare: a purge forgets it, and the default is the CDN). */
const HERE = { locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? wasmUrl : prefix + path) };
prepareZXingModule({ overrides: HERE });

const OPTS: ReaderOptions = { formats: ['EAN13', 'EAN8', 'UPCA', 'UPCE'], tryHarder: true, tryRotate: false, tryInvert: false, maxNumberOfSymbols: 1 };
const FORMAT: Record<string, Format> = { EAN13: 'EAN-13', EAN8: 'EAN-8', UPCA: 'UPC-A', UPCE: 'UPC-E' };

/** The wasm fetched and compiled (the scanner's open, while the camera starts): a frame's first decode is then quick. */
export const warm = (): Promise<unknown> => prepareZXingModule({ overrides: HERE, fireImmediately: true });

/** The compiled decoder and its memory let go (the scanner closed: its heap, a few MB, is not kept for the session);
 *  the next open compiles it again from the cached wasm. */
export function release(): void {
  purgeZXingModule();
  prepareZXingModule({ overrides: HERE });
}

/** A frame's code, if one reads: its digits and format. */
export async function decode(img: ImageData): Promise<{ text: string; format?: Format } | null> {
  await warm();
  const [r] = await readBarcodes(img, OPTS);
  return r?.isValid && r.text ? { text: r.text, format: FORMAT[r.format] } : null;
}
