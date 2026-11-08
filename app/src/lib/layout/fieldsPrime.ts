// The layout's distance fields (fields.ts) and its ground's chunks (mesh.ts) primed in a worker (fields.worker.ts)
// while the 3D island's chunk (three.js and its scene) is still loading: on a phone they're a few hundred ms of the
// main thread before the island's first frame. The worker runs the very same computeFields and chunkMesh, so its
// numbers are the main thread's, bit for bit (fields.test). Its answer is kept for the next launch (fieldsCache.ts:
// IndexedDB, by the layout and the build), which reads it back instead of starting the worker.
// One job a layout: whichever asks first (the launch, +layout.ts, or the 3D island's mount: in WebKit the mount often
// ran first) starts it, and every caller gets its promise; the mount waits for it before it builds the ground. The
// main thread builds them (fieldsOf, when first asked) only when the worker can't: none (the tests, an old browser),
// an error, or one stalled past `timeoutMs`.
import { adoptFields, fieldsOf, hasFields, type Fields } from './fields.ts';
import { adoptChunks } from './mesh.ts';
import { fieldsKey, readFields } from './fieldsCache.ts';
import type { Primed } from './fields.worker.ts';
import type { Layout } from './model.ts';

/** The worker, having answered, is ended after this at most (ms): it writes the cache and closes itself before. */
const SAVE_MS = 20_000;
/** The worker starts if the cache hasn't answered by then (ms). */
const CACHE_MS = 60;

/** The launch's prime: its layout's key and promise (kept once settled: a worker that failed isn't tried again). */
let job: { key: string; p: Promise<void> } | null = null;
/** The set adopted and where it came from (the launch's log: world3d/boot.ts). */
let from: { src: 'worker' | 'cache'; f: Fields } | null = null;

/** `primed` taken for `layout` (the chunks only with their fields: a late answer, its fields dropped, is dropped
 *  whole). True: taken. */
function adopt(layout: Layout, primed: Primed, src: 'worker' | 'cache'): boolean {
  if (hasFields(layout)) return false;
  adoptFields(layout, primed.raw);
  if (!hasFields(layout)) return false;
  adoptChunks(layout, primed.chunks);
  from = { src, f: fieldsOf(layout) };
  return true;
}

/** Resolves once `layout`'s fields are in (the cache's, or the worker's; or the worker gave up, and the main thread
 *  builds them); never rejects. A second call for the same layout gets the first's promise.
 *  `build`: the app's (the cache's key: another build's fields are made again). */
export function primeFields(layout: Layout, build: string, timeoutMs = 4000): Promise<void> {
  if (hasFields(layout) || typeof Worker === 'undefined') return Promise.resolve();
  const key = fieldsKey(layout, build);
  if (job?.key === key) return job.p;
  // the cache first (~30 ms in the iOS Simulator); the worker on a miss, or once the cache has taken CACHE_MS (both at
  // once from the start, they shared the cores: the cache's answer took twice as long)
  const p = new Promise<void>((done) => {
    let w: Worker | null = null, cacheOut = false, workerOut = false;
    const end = () => {
      clearTimeout(timer);
      clearTimeout(late);
      done();
    };
    const timer = setTimeout(() => (w?.terminate(), done()), timeoutMs);
    const late = setTimeout(() => start(), CACHE_MS);
    void readFields(key).then((kept) => {
      cacheOut = true;
      if (kept && adopt(layout, kept, 'cache')) return void (w?.terminate(), end());
      if (workerOut) end();
      else start();
    });
    const failed = () => {
      workerOut = true;
      w?.terminate();
      if (cacheOut) end();
    };
    function start() {
      clearTimeout(late);
      if (w || workerOut) return;
      try {
        w = new Worker(new URL('./fields.worker.ts', import.meta.url), { type: 'module' });
      } catch {
        return failed();
      }
      const worker = w;
      worker.onmessage = (e: MessageEvent<Primed>) => {
        workerOut = true;
        adopt(layout, e.data, 'worker');
        // (it closes itself once it has written them for the next launch; else at most SAVE_MS from now)
        setTimeout(() => worker.terminate(), SAVE_MS);
        end();
      };
      worker.onerror = failed;
      worker.onmessageerror = failed;
      try {
        worker.postMessage({ codes: layout.codes, objects: layout.objects, homes: layout.homes, key });
      } catch {
        failed();
      }
    }
  });
  job = { key, p };
  return p;
}

/** Where `layout`'s fields come from as the island mounts: a prime's (the worker's, the cache's) or the main thread's. */
export const fieldsFrom = (layout: Layout): 'worker' | 'cache' | 'main' => (from && hasFields(layout) && fieldsOf(layout) === from.f ? from.src : 'main');
