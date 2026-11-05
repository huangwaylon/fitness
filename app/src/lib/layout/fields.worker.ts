// The layout's distance fields and its ground's chunks computed off the main thread (fields.ts computeFields and
// mesh.ts chunkMesh, the same code): posted the layout's codes, pieces and homes, it answers the fields' rasters and
// every chunk's arrays, their buffers transferred (fieldsPrime.ts).
import { adoptFields, computeFields, type RawFields } from './fields.ts';
import { CHUNK_COUNT, chunkMesh, type ChunkMesh } from './mesh.ts';
import { Layout } from './model.ts';

export interface Primed { raw: RawFields; chunks: ChunkMesh[] }

self.onmessage = (e: MessageEvent<Pick<Layout, 'codes' | 'objects' | 'homes'>>) => {
  const { codes, objects, homes } = e.data;
  const raw = computeFields({ codes, objects });
  const layout = new Layout(codes, objects, homes);
  // (the chunks read the fields: these, not built twice)
  adoptFields(layout, raw);
  const chunks = Array.from({ length: CHUNK_COUNT }, (_, i) => chunkMesh(layout, i));
  const bufs = new Set<ArrayBuffer>();
  for (const a of [...raw.ch, ...(raw.sf ? [raw.sf.d, raw.sf.fx, raw.sf.fz, raw.sf.s, raw.sf.across] : [])]) bufs.add(a.buffer as ArrayBuffer);
  for (const c of chunks) for (const p of [c.top, c.walls, c.falls, c.water]) for (const a of Object.values(p)) bufs.add((a as Float32Array).buffer as ArrayBuffer);
  (self as unknown as Worker).postMessage({ raw, chunks } satisfies Primed, [...bufs]);
};
