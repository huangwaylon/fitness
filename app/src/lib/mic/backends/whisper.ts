// ききみみ's whisper (docs/kikimimi-mic.md §3.2, §3.6), the page half: whether the site serves the model, its download
// (only on a tap: the parts fetched, assembled and checked into the STT cache, with progress; lib/mic/models.ts), and
// a dedicated Worker running it (whisper.worker.ts), one request at a time, terminated when done. M3 makes it a
// Recogniser; the probe uses it as it is. The e2e's stub: with `localStorage['e2e.stt']` (a list of what it "hears")
// nothing is fetched and no worker runs: every take hears the list's first line.
import { asset } from '$app/paths';
import sttWorker from './whisper.worker.ts?worker&url';
import { STT_CACHE } from '../../../service-worker/caches.ts';
import { STT_ID, ensureStt, sttCached } from '../models.ts';
import type { Device, WIn, WOut } from './whisper.worker.ts';

export type { Device };

const root = (): string => new URL(asset('stt/' as Parameters<typeof asset>[0]), location.href).href;

function stub(): string | null {
  try {
    const list = JSON.parse(localStorage.getItem('e2e.stt') ?? 'null') as unknown;
    return Array.isArray(list) && list.length ? String(list[0]) : null;
  } catch {
    return null;
  }
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
  dispose(): void;
}

const LOAD_MS = 180_000, RUN_MS = 60_000;

export function openWhisper(): Whisper {
  const heard = stub();
  if (heard !== null) return { load: async () => ({ ok: true, ms: 1 }), run: async () => ({ ok: true, ms: 1, text: heard }), dispose() {} };
  const w = new Worker(sttWorker, { type: 'module' });
  let line: Promise<unknown> = Promise.resolve();
  const ask = (m: WIn, ms: number): Promise<WOut> => {
    const p = line.then(() => new Promise<WOut>((done) => {
      const end = (r: WOut) => (clearTimeout(t), (w.onmessage = w.onerror = null), done(r));
      const t = setTimeout(() => end({ ok: false, err: 'timeout' }), ms);
      w.onmessage = (e: MessageEvent<WOut>) => end(e.data);
      w.onerror = () => end({ ok: false, err: 'other' });
      w.postMessage(m, m.op === 'run' ? [m.pcm.buffer] : []);
    }));
    line = p;
    return p;
  };
  return { load: (device) => ask({ op: 'load', root: root(), device }, LOAD_MS), run: (pcm) => ask({ op: 'run', pcm }, RUN_MS), dispose: () => w.terminate() };
}
