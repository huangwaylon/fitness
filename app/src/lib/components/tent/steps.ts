// A room's changes as steps (docs/design.md "Whose room", "Saved arrangements"): what a change takes away, moves back,
// puts down anew and sets (the wallpaper, the floor, the size), planned against the room as it stands into the room's
// ops (contract/tent.ts) and the step that undoes it. The clear, a saved arrangement called up and every undo are
// steps; a removal is final in the record (a removed piece's id never comes back), so what a step puts back is a new
// piece where the old one stood: the same item, tile, facing, layer (on another piece's top: on that piece's new self),
// light and order (its `p`). Pure.
import { TENT_FLOOR, TENT_MAX, TENT_SIZE, TENT_WALL, type RoomSize, type TentOp, type TentPiece } from '#lib/contract/tent.ts';
import type { RoomSaveOp, SavedPiece } from '#lib/contract/roomSave.ts';

type Sc = TentOp['sc'];
/** A piece as it stood (its id: the one it had, for the `on` of the pieces put back with it). */
export type Snap = Pick<TentPiece, 'id' | 'item' | 'x' | 'z' | 'f' | 'p' | 'on' | 'l'>;
export interface Step {
  /** Pieces taken away (with whatever stands on them). */
  rm?: readonly string[];
  /** Pieces still standing set back where they were (a move undone). */
  set?: readonly Snap[];
  /** Pieces put down anew, each a new id (`on`: one of these, by its old id, or a piece standing). */
  add?: readonly Snap[];
  /** The wallpaper, the floor (a code: null is the room's own, set as the default's code) and the size. */
  wall?: string | null;
  floor?: string | null;
  size?: RoomSize;
}
/** The room as it stands (store/tent.svelte.ts). */
export interface RoomNow { pieces: readonly TentPiece[]; wall: string | null; floor: string | null; size: RoomSize }
export interface Ctx {
  sc: Sc;
  /** An op's time (the store's clock: after the op it changes). */
  at: (after?: number) => number;
  newId: () => string;
  /** The room's own wallpaper and floor (items.ts DEFAULT_WALL, DEFAULT_FLOOR). */
  defaults: { wall: string; floor: string };
}

const snapOf = (p: TentPiece): Snap => ({ id: p.id, item: p.item, x: p.x, z: p.z, f: p.f, p: p.p, ...(p.on ? { on: p.on } : {}), ...(p.l !== undefined ? { l: p.l } : {}) });
const isEmpty = (s: Step): boolean => !s.rm?.length && !s.set?.length && !s.add?.length && s.wall === undefined && s.floor === undefined && s.size === undefined;

/**
 * A step's ops against the room, removals first (the record's cap counts as it goes), and the step that undoes it; null
 * when it does nothing, or would leave more than TENT_MAX pieces (refused whole: the record would refuse the group).
 */
export function plan(now: RoomNow, step: Step, ctx: Ctx): { ops: TentOp[]; undo: Step } | null {
  const byId = new Map(now.pieces.map((p) => [p.id, p]));
  const ops: TentOp[] = [];
  // taken away: each named piece standing, and what stands on it
  const gone = new Set((step.rm ?? []).filter((id) => byId.has(id)));
  for (const p of now.pieces) if (p.on && gone.has(p.on)) gone.add(p.id);
  const removed = now.pieces.filter((p) => gone.has(p.id));
  for (const p of removed) ops.push({ sc: ctx.sc, id: p.id, at: ctx.at(p.at), rm: true });
  // set back: each still standing (and not just taken away)
  const before: Snap[] = [];
  for (const s of step.set ?? []) {
    const p = byId.get(s.id);
    if (!p || gone.has(s.id)) continue;
    before.push(snapOf(p));
    ops.push(setOp(ctx.sc, s.id, s, ctx.at(p.at), p.p));
  }
  // put down anew: what stands on another after it (its surface's new id, or a piece standing)
  const fresh = new Map<string, string>();
  const adds = [...(step.add ?? [])].sort((a, b) => Number(!!a.on) - Number(!!b.on));
  for (const s of adds) {
    const on = s.on ? (fresh.get(s.on) ?? (byId.has(s.on) && !gone.has(s.on) ? s.on : null)) : undefined;
    if (on === null) continue; // its surface isn't there: nothing to stand on
    const id = ctx.newId();
    fresh.set(s.id, id);
    const at = ctx.at();
    ops.push(setOp(ctx.sc, id, { ...s, ...(on ? { on } : { on: undefined }) }, at, Math.min(s.p, at)));
  }
  if (now.pieces.length - removed.length + fresh.size > TENT_MAX) return null;
  // the surfaces and the size
  const undo: Step = { rm: [...fresh.values()], add: removed.map(snapOf), set: before };
  const surface = (kind: 'wall' | 'floor', id: string, code: string | null | undefined) => {
    if (code === undefined) return;
    const was = now[kind], want = code ?? ctx.defaults[kind];
    if ((was ?? ctx.defaults[kind]) === want) return;
    const at = ctx.at();
    ops.push({ sc: ctx.sc, id, at, item: want, x: 0, z: 0, f: 0, p: at });
    undo[kind] = was ?? ctx.defaults[kind];
  };
  surface('wall', TENT_WALL, step.wall);
  surface('floor', TENT_FLOOR, step.floor);
  if (step.size !== undefined && step.size !== now.size) {
    const at = ctx.at();
    ops.push({ sc: ctx.sc, id: TENT_SIZE, at, item: `s${step.size}`, x: 0, z: 0, f: 0, p: at });
    undo.size = now.size;
  }
  return ops.length ? { ops, undo: isEmpty(undo) ? {} : undo } : null;
}

function setOp(sc: Sc, id: string, s: Omit<Snap, 'id' | 'p'>, at: number, p: number): TentOp {
  return { sc, id, at, item: s.item, x: s.x, z: s.z, f: s.f, p, ...(s.on ? { on: s.on } : {}), ...(s.l !== undefined ? { l: s.l } : {}) };
}

/** 全部片付ける: every piece taken away (the wallpaper, the floor and the size stay: nothing is "put away" of them). */
export const clearStep = (now: RoomNow): Step => ({ rm: now.pieces.map((p) => p.id) });

/** The room as a saved arrangement's pieces: each piece in placing order, one on another's top by that one's index. */
export function savedPieces(now: RoomNow): SavedPiece[] {
  const floor = now.pieces.filter((p) => !p.on), tops = now.pieces.filter((p) => p.on && floor.some((q) => q.id === p.on));
  const order = [...floor, ...tops];
  const at = new Map(order.map((p, k) => [p.id, k]));
  return order.map((p) => ({ i: p.item, x: p.x, z: p.z, f: p.f, ...(p.on ? { on: at.get(p.on)! } : {}), ...(p.l !== undefined ? { l: p.l } : {}) }));
}

/**
 * A saved arrangement called up: the room's pieces taken away and the saved ones put down, the wallpaper, floor and size
 * set. A piece is there to put down if anyone could put it there now (`has`: the caller's rule: it stands in the room,
 * it's in my tray, or the room's owner has it); one that isn't is left out (and what stands on it): `missing` lists
 * them, by item.
 */
export function restoreStep(now: RoomNow, save: Extract<RoomSaveOp, { name: string }>, has: (item: string) => boolean): { step: Step; missing: string[] } {
  const missing: string[] = [];
  const out = new Set<number>();
  save.pieces.forEach((p, k) => {
    if (!has(p.i) || (p.on !== undefined && out.has(p.on))) {
      out.add(k);
      missing.push(p.i);
    }
  });
  const add: Snap[] = [];
  save.pieces.forEach((p, k) => {
    if (out.has(k)) return;
    add.push({ id: `s${k}`, item: p.i, x: p.x, z: p.z, f: p.f, p: save.at + k, ...(p.on !== undefined ? { on: `s${p.on}` } : {}), ...(p.l !== undefined ? { l: p.l } : {}) });
  });
  return { step: { rm: now.pieces.map((p) => p.id), add, wall: save.wall, floor: save.floor, size: save.size }, missing };
}
