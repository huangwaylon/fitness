// The layout's distance fields and its ground's chunks computed off the main thread (fields.ts computeFields and
// mesh.ts chunkMesh, the same code): posted the layout's codes, pieces and homes, it answers the fields' rasters and
// every chunk's arrays, their buffers transferred (fieldsPrime.ts). Given a cache key, it then keeps a copy for the
// next launch (fieldsCache.ts: the write here, off the main thread), and closes once it's written.
import { adoptFields, computeFields, type RawFields } from './fields.ts';
import { CHUNK_COUNT, chunkMesh, type ChunkMesh } from './mesh.ts';
import { Layout } from './model.ts';
import { fieldsWriter } from './fieldsCache.ts';

export interface Primed { raw: RawFields; chunks: ChunkMesh[] }

self.onmessage = async (e: MessageEvent<Pick<Layout, 'codes' | 'objects' | 'homes'> & { key?: string }>) => {
  const { codes, objects, homes, key } = e.data;
  const raw = computeFields({ codes, objects });
  const layout = new Layout(codes, objects, homes);
  // (the chunks read the fields: these, not built twice)
  adoptFields(layout, raw);
  const chunks = Array.from({ length: CHUNK_COUNT }, (_, i) => chunkMesh(layout, i));
  const primed: Primed = { raw, chunks };
  // (a copy kept for the cache, ~10 MB of memcpy: the answer goes first, its write after, here)
  const kept = key ? structuredClone(primed) : null;
  const bufs = new Set<ArrayBuffer>();
  for (const a of [...raw.ch, ...(raw.sf ? [raw.sf.d, raw.sf.fx, raw.sf.fz, raw.sf.s, raw.sf.across] : [])]) bufs.add(a.buffer as ArrayBuffer);
  for (const c of chunks) for (const p of [c.top, c.walls, c.falls, c.water]) for (const a of Object.values(p)) bufs.add((a as Float32Array).buffer as ArrayBuffer);
  (self as unknown as Worker).postMessage(primed, [...bufs]);
  const write = key && kept ? await fieldsWriter() : null;
  if (write) await write(key!, kept!);
  self.close();
};
