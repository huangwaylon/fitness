// What changed between two layouts (docs/island-layout.md "API for the 3D scene"), pure: the terrain chunks to
// rebuild (a paint stroke touches one or two) and the objects to add, move (or turn, or restyle) and remove, so the
// scene changes only those. A home whose style changed counts as moved (its model and footprint follow the style).
import { CHUNKS_X, CHUNKS_Z, chunkString } from './grid.ts';
import { WHO_OF_HOME } from './homes.ts';
import type { Layout, Obj } from './model.ts';

export interface LayoutDiff {
  chunks: number[];
  objects: { add: Obj[]; move: Obj[]; remove: string[] };
  /** The homes whose look changed. */
  homes: ('A' | 'B' | 'G')[];
}

const sameStyle = (a: Layout, b: Layout, who: 'A' | 'B' | 'G') => {
  const x = a.homes[who], y = b.homes[who];
  return x.m === y.m && x.w === y.w && x.r === y.r && x.d === y.d;
};

export function diffLayouts(a: Layout, b: Layout): LayoutDiff {
  const chunks: number[] = [];
  if (a.codes !== b.codes)
    for (let i = 0; i < CHUNKS_X * CHUNKS_Z; i++) if (chunkString(a.codes, i) !== chunkString(b.codes, i)) chunks.push(i);
  const homes = (['A', 'B', 'G'] as const).filter((w) => !sameStyle(a, b, w));
  const add: Obj[] = [], move: Obj[] = [], remove: string[] = [];
  for (const o of b.objects.values()) {
    const was = a.objects.get(o.id);
    if (!was) add.push(o);
    else if (was !== o && (was.k !== o.k || was.x !== o.x || was.z !== o.z || was.f !== o.f || was.s !== o.s || was.n?.[0] !== o.n?.[0] || was.n?.[1] !== o.n?.[1])) move.push(o);
    else if (o.k === 'home' && homes.includes(WHO_OF_HOME[o.id])) move.push(o);
  }
  for (const id of a.objects.keys()) if (!b.objects.has(id)) remove.push(id);
  return { chunks, objects: { add, move, remove }, homes };
}
