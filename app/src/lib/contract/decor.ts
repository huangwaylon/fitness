// The island's decorations (docs/design.md "Decorating", docs/backend.md#events `decor`, docs/decisions.md "Decor is a
// last-writer-wins map"): what either of us put on the island, kept for good (not day-scoped). Each change is one op:
// an item set at a spot (`{id, at, item, x, z, f, p}`: placed or moved, the whole state of the item) or taken away
// (`{id, at, rm: true}`, final: an id never comes back). The layout is a merge of the ops by id: a removal beats
// everything, else the latest `at` (then G over B over A). The merge is commutative, so the relay, the record and either phone
// reach the same layout whatever order the ops arrive in; the record keeps only each id's latest op. Shared by the
// record (relay/src/store.ts), the model, the relay protocol and the island; pure and dependency-free.

/** The ten items (island/decor.ts has their art and footprints). @public (the island) */
export const DECOR_ITEMS = [
  'stone-lantern', 'birdbath', 'garden-wagon', 'iron-table', 'iron-chair', 'brick-well', 'tanuki', 'monstera', 'signpost', 'wheelbarrow'
] as const;
type DecorItemId = (typeof DECOR_ITEMS)[number];
/** At most this many on the island (the projector's budget; both of us share it). */
export const DECOR_MAX = 30;
/** Where an item may stand (world units: the island's lower tier, island/world.ts LAND and the cliff's foot). */
const DECOR_X = [-40, 430] as const;
const DECOR_Z = [-30, 1040] as const;
/** Facings: 0 toward the camera, 1 to the right, 2 away, 3 to the left (a quarter turn each). */
type Facing = 0 | 1 | 2 | 3;

/** Who set it (the guest's tent pieces too): the merge's tie-break is a fixed order, A < B < G. */
type Who = 'A' | 'B' | 'G';
/** An item set at a spot (placed or moved) or removed. `p`: when it was first placed (the cap keeps the oldest). */
export type DecorOp =
  | { id: string; at: number; item: DecorItemId; x: number; z: number; f: Facing; p: number; rm?: undefined }
  | { id: string; at: number; rm: true };
export type DecorEntry = DecorOp & { who: Who };
/** A placed item as the island shows it. */
export interface Placed {
  id: string;
  item: DecorItemId;
  x: number;
  z: number;
  f: Facing;
  p: number;
  at: number;
  who: Who;
}

const ID = /^d[0-9a-z]{6,24}$/;
const isInt = (n: unknown, lo: number, hi: number): n is number => Number.isInteger(n) && (n as number) >= lo && (n as number) <= hi;
/** A time in ms since the epoch (2001 … 5138). */
const isMs = (n: unknown): n is number => isInt(n, 1e12, 1e14);
const isDecorItem = (v: unknown): v is DecorItemId => (DECOR_ITEMS as readonly unknown[]).includes(v);

/** A `decor` op's data, its known keys only, each well-formed, or null. */
export function decorOpOf(d: Record<string, unknown>): DecorOp | null {
  if (typeof d.id !== 'string' || !ID.test(d.id) || !isMs(d.at)) return null;
  const keys = Object.keys(d);
  if (d.rm !== undefined) {
    if (d.rm !== true || keys.some((k) => k !== 'id' && k !== 'at' && k !== 'rm')) return null;
    return { id: d.id, at: d.at, rm: true };
  }
  if (keys.some((k) => !['id', 'at', 'item', 'x', 'z', 'f', 'p'].includes(k))) return null;
  if (!isDecorItem(d.item) || !isInt(d.x, DECOR_X[0], DECOR_X[1]) || !isInt(d.z, DECOR_Z[0], DECOR_Z[1]) || !isInt(d.f, 0, 3) || !isMs(d.p) || d.p > d.at) return null;
  return { id: d.id, at: d.at, item: d.item, x: d.x, z: d.z, f: d.f as Facing, p: d.p };
}

/** Whether entry `a` beats `b` (the same id): a removal beats a set; else the later `at`, then G over B over A. */
export function beats(a: DecorEntry, b: DecorEntry): boolean {
  if (!!a.rm !== !!b.rm) return !!a.rm;
  if (a.at !== b.at) return a.at > b.at;
  return a.who > b.who;
}

/** Merge an entry into the map (id → its winning entry): true when it changed it. */
export function mergeDecor(m: Map<string, DecorEntry>, e: DecorEntry): boolean {
  const was = m.get(e.id);
  if (was && (was === e || !beats(e, was))) return false;
  m.set(e.id, e);
  return true;
}

/** The layout: every item set and not removed, the oldest DECOR_MAX by when they were first placed (then by id). */
export function decorLayout(entries: Iterable<DecorEntry>): Placed[] {
  const out: Placed[] = [];
  for (const e of entries) if (!e.rm) out.push({ id: e.id, item: e.item, x: e.x, z: e.z, f: e.f, p: e.p, at: e.at, who: e.who });
  out.sort((a, b) => a.p - b.p || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return out.slice(0, DECOR_MAX);
}

/** What the record does with a new op, given the rows it holds (each id's latest, with who sent it): `stale` (an op that
 *  beats it is there: acknowledged, nothing appended), `full` (a new item past the cap: refused), or `append` (and the
 *  rows of the same id it replaces are deleted). */
export function decorAccept(held: readonly DecorEntry[], e: DecorEntry): 'append' | 'stale' | 'full' {
  const same = held.filter((h) => h.id === e.id);
  if (same.some((h) => !beats(e, h))) return 'stale';
  if (!e.rm && !same.length) {
    const m = new Map<string, DecorEntry>();
    for (const h of held) mergeDecor(m, h);
    let n = 0;
    for (const h of m.values()) if (!h.rm) n++;
    if (n >= DECOR_MAX) return 'full';
  }
  return 'append';
}
