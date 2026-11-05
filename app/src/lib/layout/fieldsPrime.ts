// The layout's distance fields (fields.ts) primed in a worker (fields.worker.ts) while the 3D island's chunk (three.js
// and its scene) is still loading: on a phone they're a few hundred ms of the main thread before the island's first
// frame. The worker runs the very same computeFields, so its numbers are the main thread's, bit for bit (fields.test).
// Never needed: no worker (the tests, an old browser), an error or a slow one (past `timeoutMs`) and fieldsOf builds
// them on the main thread when first asked, as before.
import { adoptFields, hasFields, type RawFields } from './fields.ts';
import type { Layout } from './model.ts';

/** Resolves once `layout`'s fields are in (or the worker gave up); never rejects. */
export function primeFields(layout: Layout, timeoutMs = 4000): Promise<void> {
  if (hasFields(layout) || typeof Worker === 'undefined') return Promise.resolve();
  return new Promise((done) => {
    let w: Worker;
    try {
      w = new Worker(new URL('./fields.worker.ts', import.meta.url), { type: 'module' });
    } catch {
      return done();
    }
    const end = () => {
      clearTimeout(timer);
      w.terminate();
      done();
    };
    const timer = setTimeout(end, timeoutMs);
    w.onmessage = (e: MessageEvent<RawFields>) => {
      adoptFields(layout, e.data);
      end();
    };
    w.onerror = end;
    w.onmessageerror = end;
    try {
      w.postMessage({ codes: layout.codes, objects: layout.objects });
    } catch {
      end();
    }
  });
}
