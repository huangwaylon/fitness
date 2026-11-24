// The layout's distance fields and its ground's bands computed off the main thread (fields.ts computeFields, bands.ts
// buildBands and sdfBytes, the same code): posted the layout's codes, pieces and homes, it answers the fields' rasters,
// every band's arrays and the rasters' bytes for the ground's textures, their buffers transferred (fieldsPrime.ts). Given a cache key, it then keeps a copy for the
// next launch (fieldsCache.ts: the write here, off the main thread), and closes once it's written.
import { adoptFields, computeFields, fieldsOf, type RawFields } from './fields.ts';
import { buildBands, sdfBytes, type BandArrays, type SdfBytes } from './bands.ts';
import { Layout } from './model.ts';
import { fieldsWriter } from './fieldsCache.ts';

export interface Primed { raw: RawFields; bands: (BandArrays | null)[]; sdf: SdfBytes }

self.onmessage = async (e: MessageEvent<Pick<Layout, 'codes' | 'objects' | 'homes'> & { key?: string }>) => {
  const { codes, objects, homes, key } = e.data;
  const raw = computeFields({ codes, objects });
  const layout = new Layout(codes, objects, homes);
  // (the bands read the fields: these, not built twice; the open sea's rows behind the island: none, as the ground
  // builds none)
  adoptFields(layout, raw);
  const primed: Primed = { raw, bands: buildBands(layout), sdf: sdfBytes(fieldsOf(layout)) };
  // (a copy kept for the cache, ~10 MB of memcpy: the answer goes first, its write after, here)
  const kept = key ? structuredClone(primed) : null;
  const bufs = new Set<ArrayBuffer>();
  for (const a of [...raw.ch, ...(raw.sf ? [raw.sf.d, raw.sf.fx, raw.sf.fz, raw.sf.s, raw.sf.across] : [])]) bufs.add(a.buffer as ArrayBuffer);
  for (const b of primed.bands) if (b) for (const p of [b.top, b.walls, b.falls, b.water]) for (const a of Object.values(p)) bufs.add((a as Float32Array).buffer as ArrayBuffer);
  bufs.add(primed.sdf.a.buffer).add(primed.sdf.b.buffer);
  (self as unknown as Worker).postMessage(primed, [...bufs]);
  const write = key && kept ? await fieldsWriter() : null;
  if (write) await write(key!, kept!);
  self.close();
};
