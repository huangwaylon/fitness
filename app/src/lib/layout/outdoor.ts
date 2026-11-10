// The island's outdoor catalogue (docs/island-layout.md "The outdoor catalogue"): the rooms' pieces NH lets one put
// outdoors and the gyroids (scripts/outdoor-catalog.ts: outdoor.json), each a kind `nh-<code>` of the layout's, drawn
// as its room piece's own model (tent/items.json, more.json: the same model, footprint, top, emitter and seat indoors
// and out). The table is fetched only when the island has one of them or an editor opens (loadOutdoor): an island
// without them loads nothing more. Till then a piece's kind is unknown (kindDef: nothing drawn, nothing in the way);
// loaded, its kinds join layout/catalog.ts's and the layout store rebuilds (store/layout.svelte.ts).
import { addKinds, type KindDef } from './catalog.ts';
import type { Layout } from './model.ts';
import type { PackRef } from '#lib/packStore.ts';

/** A seat's or a bed's shape in its model's frame (villager3d/seats3d.ts Shape: the room's, seats3d.json tent). */
type Seat = { k: 's'; y: number; x: number[]; z0: number; z1: number; back: number } | { k: 'l'; y: number; a: 'x' | 'z'; head: -1 | 1; s: [number, number]; c: number[]; py: number; sway?: 1 };

export interface OutdoorPiece {
  /** Its room code (NH's id: tent/items.json). */
  code: string;
  /** The editor's tab (layout/catalog.ts group). */
  t: KindDef['group'];
  ja: string;
  en: string;
  /** Its icon: NH's own (1: static/room/icons/<code>.webp), else the ずかん's id (static/art/finds/items). */
  i: 1 | string;
  /** The room's: footprint (tiles), height (model units), its model (a loose file's version, or its place in a room
   *  pack), lit at night, a light and its emitter, a surface's top, small (on a top), sat or lain on and its shape, a
   *  gyroid. */
  w: number;
  d: number;
  h: number;
  v?: string;
  pk?: PackRef;
  lit?: 1;
  lt?: 1;
  e?: [number, number, number];
  s?: 1;
  sy?: number;
  st?: [number, number, number, number];
  sl?: [number, number][];
  sm?: 1;
  u?: 's' | 'l';
  n?: number;
  gy?: 1;
  seat?: Seat;
}

/** A model unit (NH's: a tile is 10) in the island's units (world.ts DECOR_U: a tile is 30). */
const U = 3;
const PREFIX = 'nh-';
const BY_KIND = new Map<string, OutdoorPiece>();
let loading: Promise<void> | null = null;

/** Whether a kind is the outdoor catalogue's (`nh-<code>`). */
export const isOutdoor = (k: string): boolean => k.startsWith(PREFIX);
/** Whether the catalogue's table is in (its kinds known). */
export const outdoorReady = (): boolean => BY_KIND.size > 0;
/** A kind's piece, once the table is in. */
export const outdoorPiece = (k: string): OutdoorPiece | undefined => BY_KIND.get(k);
/** The island's model name for a piece (world3d/things.ts loads it from the rooms' files). */
export const outdoorModel = (p: OutdoorPiece): string => `nh/${p.code}`;
/** Whether a model name is a piece's (`nh/<code>`: world3d/outdoorModels.ts loads it). */
export const isRoomModel = (name: string): boolean => name.startsWith('nh/');
/** A piece by its room code (a model name's `nh/<code>`). */
export const outdoorByCode = (code: string): OutdoorPiece | undefined => BY_KIND.get(PREFIX + code);

/** A piece as a kind: on any land, in the way (its footprint less a margin), turned with its facing. */
export function kindOf(p: OutdoorPiece): KindDef {
  return {
    k: PREFIX + p.code, group: p.t, ja: p.ja, en: p.en, w: p.w, d: p.d, block: true, foot: [p.w * 30 - 8, p.d * 30 - 8], on: 'land',
    h: Math.round(p.h * U * 10) / 10, icon: p.i === 1 ? `room:${p.code}` : `finds/items/${p.i}`, turns: true, room: p.code
  };
}

/** The table in (once): its kinds into the catalogue. */
export function loadOutdoor(): Promise<void> {
  return (loading ??= import('./outdoor.json').then(
    (m) => {
      const pieces = (m.default as unknown as { pieces: Record<string, Omit<OutdoorPiece, 'code'>> }).pieces;
      for (const [code, p] of Object.entries(pieces)) BY_KIND.set(PREFIX + code, { code, ...p });
      addKinds([...BY_KIND.values()].map(kindOf));
    },
    (e: unknown) => {
      loading = null;
      throw e;
    }
  ));
}

/** Whether a layout has a piece of the catalogue's. */
export function wantsOutdoor(l: Layout): boolean {
  for (const o of l.objects.values()) if (isOutdoor(o.k)) return true;
  return false;
}

/** A piece's top (lib/surface.ts Top), when it's a surface. */
export function outdoorTop(k: string): { w: number; d: number; sy: number; st?: OutdoorPiece['st']; sl?: OutdoorPiece['sl'] } | null {
  const p = BY_KIND.get(k);
  return p?.s && p.sy !== undefined ? { w: p.w, d: p.d, sy: p.sy, ...(p.st ? { st: p.st } : {}), ...(p.sl ? { sl: p.sl } : {}) } : null;
}
/** Whether a piece is small (NH's miscellaneous, one tile): it may stand on a top. */
export const outdoorSmall = (k: string): boolean => {
  const p = BY_KIND.get(k);
  return !!p?.sm && p.w === 1 && p.d === 1;
};
/** A piece's seat shape (villager3d/seats3d.ts: the room's), or null. */
export const outdoorSeat = (k: string): Seat | null => BY_KIND.get(k)?.seat ?? null;
/** Where one gets on a piece's seats (layout/nav.ts SEAT_ON: each across, u, and how far in front, u), from its shape
 *  as villager3d/seats3d.ts anchorsOf has it (a seat's front edge and a step; a bed's side). */
export function outdoorSeatOn(k: string): { x: readonly number[]; front: number; lie?: true } | null {
  const s = outdoorSeat(k);
  if (!s) return null;
  if (s.k === 's') return { x: s.x.map((x) => x * U), front: (s.z1 + 6) * U };
  if (s.a === 'x') return { x: [((s.s[0] + s.s[1]) / 2) * U], front: 10 * U, lie: true };
  return { x: s.c.map((c) => (c + (c < 0 ? -1 : 1) * 2) * U), front: (s.s[1] + 6) * U, lie: true };
}
