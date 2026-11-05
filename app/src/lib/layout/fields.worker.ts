// The layout's distance fields computed off the main thread (fields.ts computeFields, the same code): posted the
// layout's codes and objects, it answers the rasters, their buffers transferred.
import { computeFields } from './fields.ts';
import type { Layout } from './model.ts';

self.onmessage = (e: MessageEvent<Pick<Layout, 'codes' | 'objects'>>) => {
  const raw = computeFields(e.data);
  const bufs = [...raw.ch, ...(raw.sf ? [raw.sf.d, raw.sf.fx, raw.sf.fz, raw.sf.s, raw.sf.across] : [])].map((a) => a.buffer as ArrayBuffer);
  (self as unknown as Worker).postMessage(raw, bufs);
};
