// ききみみ's whisper (docs/kikimimi-mic.md §3.2, §3.6), the page half: whether the site serves the model, its download
// (only on a tap: the parts fetched, assembled and checked into the STT cache, with progress; lib/mic/models.ts), and
// a dedicated Worker running it (whisper.worker.ts), one request at a time, terminated when done or when a request
// times out. The probe drives it a device at a time; whisperRecogniser (stt.ts's whisper) loads WebGPU, else the WASM
// runtime, transcribes a take or scores はつおん's candidates. The e2e's stub: with `localStorage['e2e.stt']` (a list
// of what it "hears") nothing is fetched and no worker runs: every take hears the list's first line.
import { asset } from '$app/paths';
import sttWorker from './whisper.worker.ts?worker&url';
import { STT_CACHE } from '../../../service-worker/caches.ts';
import { STT_ID, ensureStt, sttCached } from '../models.ts';
import { stubScript } from '../pick.ts';
import type { Device, WIn, WOut } from './whisper.worker.ts';
import type { Capture, Recogniser } from '../stt.ts';

export type { Device };

const root = (): string => new URL(asset('stt/' as Parameters<typeof asset>[0]), location.href).href;

/** The tests' stub: what every take hears (its script's first line), else null. */
function stub(): string | null {
  const list = stubScript();
  return list ? String(list[0]) : null;
}

/** Whether the model can be had: the site serves this build's files (`/stt/manifest.json`), or they're all cached. */
export async function whisperServed(): Promise<boolean> {
  if (stub() !== null) return true;
  try {
    const res = await fetch(`${root()}manifest.json`, { cache: 'no-cache' });
    if (res.ok && ((await res.json()) as { id?: unknown }).id === STT_ID) return true;
  } catch {
    /* offline: the cache may have it all */
  }
  return sttCached(root(), await caches.open(STT_CACHE)).catch(() => false);
}

/** The model and the runtime into the STT cache (what's missing; `progress` in bytes); the bytes fetched. */
export async function downloadWhisper(progress?: (got: number, of: number) => void): Promise<number> {
  const cache = await caches.open(STT_CACHE);
  // the stub: one marker entry stands for the files (whisperCached, せってい's 削除)
  if (stub() !== null) return await cache.put(`${root()}e2e`, new Response('1')), progress?.(1, 1), 0;
  return ensureStt({ root: root(), cache, fetch: (u) => fetch(u), extra: [new URL(sttWorker, location.href).href], progress });
}

/** Whether the model and the runtime are all in the STT cache (せってい: downloaded, 削除 offered). */
export async function whisperCached(): Promise<boolean> {
  try {
    const cache = await caches.open(STT_CACHE);
    return stub() !== null ? (await cache.keys()).length > 0 : await sttCached(root(), cache);
  } catch {
    return false;
  }
}

/** せってい's 削除: the STT cache deleted (the model, the runtime, the worker's script). */
export const deleteWhisper = (): Promise<boolean> => caches.delete(STT_CACHE).catch(() => false);

export interface Whisper {
  /** The pipeline on `device` (the last one let go): its load ms. */
  load(device: Device): Promise<WOut>;
  /** 16 kHz mono PCM transcribed: the text and the ms. */
  run(pcm: Float32Array): Promise<WOut>;
  /** 16 kHz mono PCM, each candidate word's score (forced decoding): `cand` and the ms. */
  cand(pcm: Float32Array, words: readonly string[]): Promise<WOut>;
  dispose(): void;
}

const LOAD_MS = 180_000, RUN_MS = 60_000;

export function openWhisper(): Whisper {
  const heard = stub();
  if (heard !== null) {
    return { load: async () => ({ ok: true, ms: 1 }), run: async () => ({ ok: true, ms: 1, text: heard }), cand: async () => ({ ok: true, ms: 1, text: heard }), dispose() {} };
  }
  const w = new Worker(sttWorker, { type: 'module' });
  let line: Promise<unknown> = Promise.resolve(), dead = false;
  const ask = (m: WIn, ms: number): Promise<WOut> => {
    const p = line.then(() => new Promise<WOut>((done) => {
      if (dead) return done({ ok: false, err: 'other' });
      const end = (r: WOut) => (clearTimeout(t), (w.onmessage = w.onerror = null), done(r));
      // a late answer would be taken for the next request's: the worker goes
      const t = setTimeout(() => ((dead = true), w.terminate(), end({ ok: false, err: 'timeout' })), ms);
      w.onmessage = (e: MessageEvent<WOut>) => end(e.data);
      w.onerror = () => end({ ok: false, err: 'other' });
      w.postMessage(m, m.op === 'run' ? [m.pcm.buffer] : []);
    }));
    line = p;
    return p;
  };
  return {
    load: (device) => ask({ op: 'load', root: root(), device }, LOAD_MS),
    run: (pcm) => ask({ op: 'run', pcm }, RUN_MS),
    cand: (pcm, words) => ask({ op: 'cand', pcm, cand: [...words] }, RUN_MS),
    dispose: () => ((dead = true), w.terminate())
  };
}

/** stt.ts's whisper: ready() downloads the model if it's missing (on a tap, opted in) and loads it on WebGPU, else on
 *  the WASM runtime; a take's speech is transcribed, or with Hint.candidates each candidate scored (if that fails, the
 *  transcript instead: match.ts candidate reads either). A failed or timed-out request lets the Worker go (the next
 *  take loads it again); one WebGPU failure and this recogniser stays on WASM. dispose() terminates the Worker. */
export function whisperRecogniser(cap: Capture): Recogniser {
  // `opening`: the Worker still loading (disposed with the rest: a load can take a while and the model's memory)
  let w: Whisper | null = null, opening: Whisper | null = null, dev: Device | null = null, loading: Promise<boolean> | null = null, gpuBad = false, gone = false;
  const drop = () => (w?.dispose(), opening?.dispose(), (w = opening = null), (loading = null));
  const ready = (progress?: (got: number, of: number) => void): Promise<boolean> =>
    (loading ??= (async () => {
      // what's missing only: nothing once it's all cached, but this build's worker script after a deploy (offline next)
      await downloadWhisper(progress);
      const gpu = !gpuBad && typeof navigator !== 'undefined' && 'gpu' in navigator;
      for (const d of (gpu ? ['webgpu', 'wasm'] : ['wasm']) as Device[]) {
        if (gone) return false;
        const x = (opening = openWhisper());
        const ok = (await x.load(d)).ok;
        opening = null;
        if (gone) return x.dispose(), false;
        if (ok) return (w = x), (dev = d), true;
        x.dispose();
        if (d === 'webgpu') gpuBad = true;
      }
      return false;
    })().catch(() => false).then((ok) => (ok || (loading = null), ok)));
  return {
    be: 'whisper',
    ready,
    listen: (h = {}) => cap('whisper', h, async (got, signal) => {
      if (!(await ready()) || !w || signal.aborted) return { miss: signal.aborted ? 'aborted' : 'other', be: 'whisper' };
      const cands = h.candidates?.length ? h.candidates : null;
      let r = cands ? await w.cand(got.pcm.slice(), cands) : await w.run(got.pcm);
      // the candidates failed: the transcript instead
      if (cands && !r.ok && r.err !== 'timeout' && w) r = await w.run(got.pcm);
      if (!r.ok) {
        if (dev === 'webgpu') gpuBad = true;
        drop();
        return { miss: r.err, be: 'whisper' };
      }
      return { text: r.text ?? '', ...(r.cand ? { cand: r.cand } : {}), ms: r.ms, be: 'whisper' };
    }),
    dispose() {
      gone = true;
      drop();
    }
  };
}
