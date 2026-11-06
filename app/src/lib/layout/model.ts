// The island's layout (docs/island-layout.md "The layout is data"), pure: the terrain (one kind and one tier per tile),
// the objects (each a kind on a tile, turned, with a variant) and the homes' looks. The layout a phone shows is the
// default (default.json, `npm run layout:default` from world.ts) with the record's ops merged over it (layoutOf); the
// editor's save is the ops that turn one layout into another (opsBetween).
import DEFAULT from './default.json' with { type: 'json' };
import { CHUNKS_X, CHUNKS_Z, GRID, SEA, TILE, chunkId, chunkIndex, chunkString, idx, kindOf, onGrid, tierOf, tileX, tileZ, writeChunk, type Kind, type Tile } from './grid.ts';
import { footprintOf, kindDef } from './catalog.ts';
import { DEFAULT_HOMES, WHO_OF_HOME, homeFoot, type HomeStyle, type Who } from './homes.ts';
import { isVoid, mergeLayout, resetAt, type LayoutEntry, type LayoutOp } from '#lib/contract/layout.ts';

type Facing = 0 | 1 | 2 | 3;
export interface Obj {
  id: string;
  k: string;
  /** Its footprint's lowest column and row. */
  x: number;
  z: number;
  f: Facing;
  s?: string;
  /** The default's own offset from its footprint's middle (u): today's island exactly, until someone moves it. */
  n?: readonly [number, number];
}

export class Layout {
  /** Each tile's code (grid.ts), row by row. */
  readonly codes: Uint8Array;
  readonly objects: ReadonlyMap<string, Obj>;
  readonly homes: Readonly<Record<Who, HomeStyle>>;
  constructor(codes: Uint8Array, objects: ReadonlyMap<string, Obj>, homes: Readonly<Record<Who, HomeStyle>>) {
    this.codes = codes;
    this.objects = objects;
    this.homes = homes;
  }
  /** The tile at (c, r): off the grid, the sea. */
  tile(c: number, r: number): Tile {
    const code = onGrid(c, r) ? this.codes[idx(c, r)] : SEA;
    return { kind: kindOf(code), tier: tierOf(code) };
  }
  code(c: number, r: number): number {
    return onGrid(c, r) ? this.codes[idx(c, r)] : SEA;
  }
  kind(c: number, r: number): Kind {
    return kindOf(this.code(c, r));
  }
  tier(c: number, r: number): number {
    return tierOf(this.code(c, r));
  }
}

// ---- the default ----------------------------------------------------------------------------------------------------

interface DefaultJson {
  tiles: string[];
  objects: { id: string; k: string; x: number; z: number; f: number; s?: string; n?: [number, number] }[];
}
let base: Layout | null = null;
/** The default layout (today's island on the grid). */
export function defaultLayout(): Layout {
  if (base) return base;
  const d = DEFAULT as DefaultJson;
  const codes = new Uint8Array(GRID.cols * GRID.rows);
  d.tiles.forEach((row, r) => {
    for (let c = 0; c < GRID.cols; c++) codes[idx(c, r)] = parseInt(row[c] ?? '0', 36) || 0;
  });
  const objects = new Map<string, Obj>();
  for (const o of d.objects) objects.set(o.id, { id: o.id, k: o.k, x: o.x, z: o.z, f: (o.f & 3) as Facing, ...(o.s ? { s: o.s } : {}), ...(o.n ? { n: o.n } : {}) });
  base = new Layout(codes, objects, { ...DEFAULT_HOMES });
  return base;
}

// ---- the record's ops over it ---------------------------------------------------------------------------------------

/** The merged map's winning entries (contract/layout.ts mergeLayout) from any order of entries. */
function mergeEntries(entries: Iterable<LayoutEntry>): Map<string, LayoutEntry> {
  const m = new Map<string, LayoutEntry>();
  for (const e of entries) mergeLayout(m, e);
  return m;
}

/** The layout: the default with the record's ops merged over it (a reset voids every object and chunk op before it). */
export function layoutOf(entries: Iterable<LayoutEntry> | Map<string, LayoutEntry>, from: Layout = defaultLayout()): Layout {
  const m = entries instanceof Map ? entries : mergeEntries(entries);
  const reset = resetAt(m);
  const codes = from.codes.slice();
  const objects = new Map(from.objects);
  const homes = { ...from.homes };
  for (const e of m.values()) {
    if (isVoid(e, reset)) continue;
    if (e.sc === 'c') {
      const i = chunkIndex(e.id);
      if (i !== null) writeChunk(codes, i, e.g);
    } else if (e.sc === 'o') {
      if (e.rm) objects.delete(e.id);
      // (a home's facing is its owner's look's, never an outdoor op's: the default's until its owner turns it)
      else objects.set(e.id, { id: e.id, k: e.k, x: e.x, z: e.z, f: WHO_OF_HOME[e.id] ? (from.objects.get(e.id)?.f ?? 0) : e.f, ...(e.s ? { s: e.s } : {}) });
    } else if (e.sc === 'h') {
      const who = e.id.slice(1) as Who;
      homes[who] = { m: e.m, ...(e.w ? { w: e.w } : {}), ...(e.r ? { r: e.r } : {}), ...(e.d ? { d: e.d } : {}), ...(e.f !== undefined ? { f: e.f } : {}) };
    }
  }
  // a home turns with its owner's look (its facing is the owner's, its spot the members')
  for (const who of ['A', 'B', 'G'] as const) {
    const id = `home-${who}`, o = objects.get(id), f = homes[who].f;
    if (o && f !== undefined && o.f !== f) objects.set(id, { ...o, f });
  }
  return new Layout(codes, objects, homes);
}

// ---- an object's place ----------------------------------------------------------------------------------------------

/** An object's footprint in tiles (across × deep, turned): a home's is its style's. */
export function footOf(layout: Layout, o: Pick<Obj, 'id' | 'k' | 'f'>): [number, number] {
  if (o.k === 'home') {
    const [w, d] = homeFoot(layout.homes[WHO_OF_HOME[o.id] ?? 'A']);
    return o.f % 2 ? [d, w] : [w, d];
  }
  const def = kindDef(o.k);
  return def ? footprintOf(def, o.f) : [1, 1];
}

/** An object's footprint's back-left tile: its own (x, z); but a home's (x, z) is its door's tile (the front row's
 *  middle, the left of two), so a new style's footprint grows round its door and the door stays where it was. */
export function originOf(layout: Layout, o: Pick<Obj, 'id' | 'k' | 'x' | 'z' | 'f'>): [number, number] {
  if (o.k !== 'home') return [o.x, o.z];
  const [w, d] = footOf(layout, o);
  switch (o.f) {
    case 0: return [o.x - Math.floor((w - 1) / 2), o.z];
    case 2: return [o.x - Math.floor((w - 1) / 2), o.z - d + 1];
    case 1: return [o.x - w + 1, o.z - Math.floor((d - 1) / 2)];
    default: return [o.x, o.z - Math.floor((d - 1) / 2)];
  }
}

/** Where an object stands (u): its footprint's middle, plus the default's own offset. */
export function objMid(layout: Layout, o: Obj): [number, number] {
  const [w, d] = footOf(layout, o), [x0, z0] = originOf(layout, o);
  return [tileX(x0) + (w * TILE) / 2 + (o.n?.[0] ?? 0), tileZ(z0) + (d * TILE) / 2 + (o.n?.[1] ?? 0)];
}

/** The tiles an object covers. */
export function objTiles(layout: Layout, o: Obj): [number, number][] {
  const [w, d] = footOf(layout, o), [x0, z0] = originOf(layout, o);
  const out: [number, number][] = [];
  for (let j = 0; j < d; j++) for (let i = 0; i < w; i++) out.push([x0 + i, z0 + j]);
  return out;
}

/** Its facing's unit vector in world x, z (0 toward the camera: −z; then a quarter turn at a time, counter-clockwise
 *  seen from above: 1 faces +x, 2 away, 3 −x). */
export const facingVec = (f: number): [number, number] => [[0, -1], [1, 0], [0, 1], [-1, 0]][f & 3] as [number, number];

/** A home's door (or a bulletin board's front): the middle of its front edge (u), and the tiles just outside it that
 *  must stay clear. */
export function doorOf(layout: Layout, o: Obj): { at: [number, number]; tiles: [number, number][] } {
  const [w, d] = footOf(layout, o), [ox, oz] = originOf(layout, o);
  const [mx, mz] = objMid(layout, o);
  const [fx, fz] = facingVec(o.f);
  const at: [number, number] = [mx + (fx * w * TILE) / 2, mz + (fz * d * TILE) / 2];
  // the front edge's middle tile (two for an even edge), one tile out
  const tiles: [number, number][] = [];
  if (fz !== 0) {
    const r = fz < 0 ? oz - 1 : oz + d;
    const c0 = ox + Math.floor((w - 1) / 2), c1 = ox + Math.floor(w / 2);
    for (let c = c0; c <= c1; c++) tiles.push([c, r]);
  } else {
    const c = fx < 0 ? ox - 1 : ox + w;
    const r0 = oz + Math.floor((d - 1) / 2), r1 = oz + Math.floor(d / 2);
    for (let r = r0; r <= r1; r++) tiles.push([c, r]);
  }
  return { at, tiles };
}

// ---- from one layout to another (the editor's save, an import) ------------------------------------------------------

/** The ops that turn layout `a` into `b`, at `at` (each its own time, so a burst keeps its order): the chunks that
 *  differ, the objects added, moved or turned, and removed, the homes' looks that changed (only `mine` when given). */
export function opsBetween(a: Layout, b: Layout, at: number): LayoutOp[] {
  const out: LayoutOp[] = [];
  let t = at;
  for (let i = 0; i < CHUNKS_X * CHUNKS_Z; i++) {
    const g = chunkString(b.codes, i);
    if (g !== chunkString(a.codes, i)) out.push({ sc: 'c', id: chunkId(i % CHUNKS_X, Math.floor(i / CHUNKS_X)), at: t++, g });
  }
  for (const o of b.objects.values()) {
    const was = a.objects.get(o.id);
    if (was && was.k === o.k && was.x === o.x && was.z === o.z && was.f === o.f && was.s === o.s && !!was.n === !!o.n) continue;
    out.push({ sc: 'o', id: o.id, at: t++, k: o.k, x: o.x, z: o.z, f: o.f, ...(o.s ? { s: o.s } : {}) });
  }
  for (const id of a.objects.keys()) if (!b.objects.has(id)) out.push({ sc: 'o', id, at: t++, rm: true });
  for (const who of ['A', 'B', 'G'] as const) {
    const x = a.homes[who], y = b.homes[who];
    if (x.m === y.m && x.w === y.w && x.r === y.r && x.d === y.d && x.f === y.f) continue;
    out.push({ sc: 'h', id: `h${who}`, at: t++, m: y.m, ...(y.w ? { w: y.w } : {}), ...(y.r ? { r: y.r } : {}), ...(y.d ? { d: y.d } : {}), ...(y.f !== undefined ? { f: y.f } : {}) });
  }
  return out;
}

/** A layout with these changes (the editor's working copy): tiles painted, objects set or removed. */
export function withChanges(l: Layout, ch: { tiles?: Iterable<[number, number, number]>; set?: Iterable<Obj>; remove?: Iterable<string>; homes?: Partial<Record<Who, HomeStyle>> }): Layout {
  const codes = ch.tiles ? l.codes.slice() : l.codes;
  for (const [c, r, code] of ch.tiles ?? []) if (onGrid(c, r)) codes[idx(c, r)] = code;
  const objects = ch.set || ch.remove ? new Map(l.objects) : l.objects as Map<string, Obj>;
  for (const id of ch.remove ?? []) objects.delete(id);
  for (const o of ch.set ?? []) objects.set(o.id, o);
  const homes = ch.homes ? { ...l.homes, ...ch.homes } : l.homes;
  if (ch.homes)
    for (const who of Object.keys(ch.homes) as Who[]) {
      const id = `home-${who}`, o = objects.get(id), f = homes[who].f;
      if (o && f !== undefined && o.f !== f) {
        if (objects === l.objects) return withChanges(l, { ...ch, set: [...(ch.set ?? []), { ...o, f }] });
        objects.set(id, { ...o, f });
      }
    }
  return new Layout(codes, objects, homes);
}

// ---- JSON (the editor's export and import) ------------------------------------------------------------------------

export interface LayoutJson {
  v: 1;
  tiles: string[];
  objects: Obj[];
  homes: Record<Who, HomeStyle>;
}
export function toJson(l: Layout): LayoutJson {
  const tiles: string[] = [];
  for (let r = 0; r < GRID.rows; r++) {
    let s = '';
    for (let c = 0; c < GRID.cols; c++) s += l.codes[idx(c, r)].toString(36);
    tiles.push(s);
  }
  return { v: 1, tiles, objects: [...l.objects.values()].map((o) => ({ ...o })), homes: { ...l.homes } };
}
/** A layout from its JSON, or null when it isn't one (each part checked: the record would refuse a bad op anyway). */
export function fromJson(j: unknown): Layout | null {
  if (typeof j !== 'object' || j === null) return null;
  const o = j as Partial<LayoutJson>;
  // (an older export's grid had fewer rows: the rest is the sea behind it)
  if (o.v !== 1 || !Array.isArray(o.tiles) || o.tiles.length > GRID.rows || o.tiles.length < 1 || !Array.isArray(o.objects)) return null;
  const codes = new Uint8Array(GRID.cols * GRID.rows);
  for (let r = 0; r < o.tiles.length; r++) {
    const row = o.tiles[r];
    if (typeof row !== 'string' || row.length !== GRID.cols || !/^[0-9a-z]+$/.test(row)) return null;
    for (let c = 0; c < GRID.cols; c++) codes[idx(c, r)] = parseInt(row[c], 36) % 36;
  }
  const objects = new Map<string, Obj>();
  const ID = /^[A-Za-z0-9][A-Za-z0-9:._-]{0,31}$/;
  for (const x of o.objects) {
    if (!x || typeof x.id !== 'string' || !ID.test(x.id) || typeof x.k !== 'string' || !kindDef(x.k)) return null;
    if (![x.x, x.z, x.f].every((n) => Number.isInteger(n) && n >= 0 && n < 128) || x.f > 3) return null;
    objects.set(x.id, { id: x.id, k: x.k, x: x.x, z: x.z, f: x.f as Facing, ...(typeof x.s === 'string' && x.s ? { s: x.s } : {}), ...(Array.isArray(x.n) && x.n.length === 2 ? { n: [Number(x.n[0]) || 0, Number(x.n[1]) || 0] as const } : {}) });
  }
  const homes = { ...DEFAULT_HOMES };
  for (const who of ['A', 'B', 'G'] as const) {
    const h = o.homes?.[who];
    if (h && typeof h.m === 'string') homes[who] = { m: h.m, ...(h.w ? { w: String(h.w) } : {}), ...(h.r ? { r: String(h.r) } : {}), ...(h.d ? { d: String(h.d) } : {}) };
  }
  return new Layout(codes, objects, homes);
}

/** @public (the editor) A new object's id: `o` and its time and a little randomness, base 36. */
export const newObjId = (at: number): string => `o${at.toString(36)}${Math.floor(Math.random() * 36 ** 3).toString(36).padStart(3, '0')}`;


/** The 3D camera's middle across the island (u: its x at the default zoom, x-centred, the user's rule): its land box's
 *  middle (the default island's 195), so it follows an edge moved in or out (the editor's しまの おおきさ: a lopsided
 *  pull stays centred). */
export const MID_X = 195;
export const midXOf = (land: { x0: number; x1: number }): number => (land.x1 > land.x0 ? (land.x0 + land.x1) / 2 : MID_X);
/** Zoomed in past the default, the 3D camera may pan sideways over the land and this much sea (u) either side of it
 *  (world3d/engine.ts; island/coast.ts's view of the shore). */
export const SEA_X = 24;

/** The island's extent (u), for the 3D camera and the ground (docs/island-layout.md "API for the 3D scene"): the
 *  grid's, the land's box, the front shoreline's z at the island's middle, and ウェイ's home's door (the camera's far
 *  stop, the campsite, as today). Read from the layout, never a constant: the island may grow. */
export function extentOf(layout: Layout): {
  grid: { x0: number; x1: number; z0: number; z1: number };
  land: { x0: number; x1: number; z0: number; z1: number };
  shore: number;
  home: [number, number];
} {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (let r = 0; r < GRID.rows; r++)
    for (let c = 0; c < GRID.cols; c++)
      if (kindOf(layout.codes[idx(c, r)]) !== 'sea') {
        x0 = Math.min(x0, tileX(c)); x1 = Math.max(x1, tileX(c + 1));
        z0 = Math.min(z0, tileZ(r)); z1 = Math.max(z1, tileZ(r + 1));
      }
  const mid = Math.floor(GRID.cols / 2);
  let shore = z0;
  for (let r = 0; r < GRID.rows; r++)
    if (kindOf(layout.codes[idx(mid, r)]) !== 'sea') {
      shore = tileZ(r);
      break;
    }
  const a = layout.objects.get('home-A');
  return {
    grid: { x0: GRID.x0, x1: tileX(GRID.cols), z0: GRID.z0, z1: tileZ(GRID.rows) },
    land: x0 < x1 ? { x0, x1, z0, z1 } : { x0: 0, x1: 0, z0: 0, z1: 0 },
    shore,
    home: a ? doorOf(layout, a).at : [GRID.x0 + (GRID.cols * TILE) / 2, z1]
  };
}
