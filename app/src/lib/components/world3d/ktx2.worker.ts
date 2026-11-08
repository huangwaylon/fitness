// Transcodes the island's KTX2 textures (docs/perf-plan.md C1, ktx2.ts) off the main thread: three's Basis transcoder
// (its JS bundled here, its wasm fetched from static/room/basis/ on the first message), each file's mip levels into
// the GPU format the page asked for. Only on a miss: a texture transcoded once is kept (texCache.ts).
import BASIS, { type Basis } from 'three/examples/jsm/libs/basis/basis_transcoder.js';
import { TRANSCODE, type Target, type Transcoded } from './ktx2Format.ts';

export type Ask = { id: number; wasm: string; buf: ArrayBuffer; target: Target };
export type Answer = { id: number; tex: Transcoded | null };

let ready: Promise<Basis> | null = null;
const init = (wasm: string) =>
  (ready ??= fetch(wasm)
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`basis: ${r.status}`))))
    .then((wasmBinary) => BASIS({ wasmBinary }))
    .then((m) => (m.initializeBasis(), m)));

function transcode(m: Basis, buf: ArrayBuffer, target: Target): Transcoded | null {
  const f = new m.KTX2File(new Uint8Array(buf));
  try {
    if (!f.isValid() || !f.startTranscoding()) return null;
    const alpha = f.getHasAlpha(), fmt = TRANSCODE[target][alpha ? 1 : 0], mips: Transcoded['mips'] = [];
    for (let l = 0; l < f.getLevels(); l++) {
      const info = f.getImageLevelInfo(l, 0, 0), data = new Uint8Array(f.getImageTranscodedSizeInBytes(l, 0, 0, fmt));
      if (!f.transcodeImage(data, l, 0, 0, fmt, 0, -1, -1)) return null;
      mips.push({ width: info.origWidth, height: info.origHeight, data });
    }
    return { width: f.getWidth(), height: f.getHeight(), alpha, target, mips };
  } finally {
    f.close();
    f.delete();
  }
}

self.onmessage = async ({ data: a }: MessageEvent<Ask>) => {
  let tex: Transcoded | null = null;
  try {
    tex = transcode(await init(a.wasm), a.buf, a.target);
  } catch {
    // (an answer either way: the page draws the model's own WebP)
  }
  (self as unknown as Worker).postMessage({ id: a.id, tex } satisfies Answer, tex ? tex.mips.map((x) => x.data.buffer as ArrayBuffer) : []);
};
