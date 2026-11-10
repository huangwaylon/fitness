// Saved room arrangements (docs/design.md "Saved arrangements", docs/backend.md#events `room_save`): a few slots a
// room, each the whole room as it stood when saved, any of us saving or calling one up in any room (as any of us
// arranges any room: contract/layout.ts scopeMayWrite). A slot set `{sc, n, at, name, pieces, wall, floor, size}` or
// emptied `{sc, n, at, rm: true}` (not final: a later save fills it again); the record keeps each slot's latest
// arrival (its slot `room_save|<sc>|<n>`), the model the last row of a slot in server order. Each piece `{i, x, z, f,
// on?, l?}`: its item, its tile (or, on another piece's top, its slot there) and facing, `on` the index of the piece it
// stands on (an earlier one, on the floor itself), `l` its light. Pure and dependency-free.
import { isInt, isMs, only } from './ops.ts';
import { cleanLine } from './text.ts';
import { ROOM_SIZES, TENT_MAX, type RoomSize } from './tent.ts';

/** The slots a room has (n 1…SAVE_SLOTS). @public (components/tent) */
export const SAVE_SLOTS = 3;
/** A slot's name, at most this many characters (one clean line). @public (components/tent) */
export const SAVE_NAME_CHARS = 20;

type Sc = 't' | 'u' | 'v';
type Facing = 0 | 1 | 2 | 3;
/** A piece as saved. @public (components/tent/steps.ts) */
export interface SavedPiece { i: string; x: number; z: number; f: Facing; on?: number; l?: 0 | 1 }
export type RoomSaveOp =
  | { sc: Sc; n: number; at: number; name: string; pieces: SavedPiece[]; wall: string | null; floor: string | null; size: RoomSize; rm?: undefined }
  | { sc: Sc; n: number; at: number; rm: true };

const SCOPES: readonly unknown[] = ['t', 'u', 'v'];
const PIECE = /^f\d{1,6}$/;
const WALL = /^w\d{1,6}$/;
const FLOOR = /^g\d{1,6}$/;
/** The room's tiles across and deep (contract/tent.ts's). */
const ROOM = 8;

/** A name as the record keeps it (one clean line, at most SAVE_NAME_CHARS). @public (relay/src/store.ts) */
export const saveName = (raw: unknown): string => cleanLine(raw, SAVE_NAME_CHARS);

function pieceOf(p: unknown, k: number): SavedPiece | null {
  if (typeof p !== 'object' || p === null || Array.isArray(p)) return null;
  const d = p as Record<string, unknown>;
  if (!only(d, ['i', 'x', 'z', 'f', 'on', 'l']) || typeof d.i !== 'string' || !PIECE.test(d.i)) return null;
  if (!isInt(d.x, 0, ROOM - 1) || !isInt(d.z, 0, ROOM - 1) || !isInt(d.f, 0, 3)) return null;
  // on an earlier piece (never itself or a later one: the order is the restore's)
  if (d.on !== undefined && !isInt(d.on, 0, k - 1)) return null;
  if (d.l !== undefined && d.l !== 0 && d.l !== 1) return null;
  return { i: d.i, x: d.x, z: d.z, f: d.f as Facing, ...(d.on !== undefined ? { on: d.on as number } : {}), ...(d.l !== undefined ? { l: d.l as 0 | 1 } : {}) };
}

/** A `room_save`'s data, its known keys only, each well-formed (at most TENT_MAX pieces, a piece on another only on one
 *  on the floor), or null. */
export function roomSaveOf(d: Record<string, unknown>): RoomSaveOp | null {
  if (!SCOPES.includes(d.sc) || !isInt(d.n, 1, SAVE_SLOTS) || !isMs(d.at)) return null;
  const head = { sc: d.sc as Sc, n: d.n, at: d.at };
  if (d.rm !== undefined) return d.rm === true && only(d, ['sc', 'n', 'at', 'rm']) ? { ...head, rm: true } : null;
  if (!only(d, ['sc', 'n', 'at', 'name', 'pieces', 'wall', 'floor', 'size'])) return null;
  if (typeof d.name !== 'string' || !d.name || saveName(d.name) !== d.name) return null;
  if (!Array.isArray(d.pieces) || d.pieces.length > TENT_MAX) return null;
  const pieces: SavedPiece[] = [];
  for (const [k, raw] of d.pieces.entries()) {
    const p = pieceOf(raw, k);
    if (!p || (p.on !== undefined && pieces[p.on].on !== undefined)) return null;
    pieces.push(p);
  }
  if (d.wall !== null && (typeof d.wall !== 'string' || !WALL.test(d.wall))) return null;
  if (d.floor !== null && (typeof d.floor !== 'string' || !FLOOR.test(d.floor))) return null;
  if (!ROOM_SIZES.includes(d.size as RoomSize)) return null;
  return { ...head, name: d.name, pieces, wall: d.wall as string | null, floor: d.floor as string | null, size: d.size as RoomSize };
}

/** A slot's record slot (contract/record.ts eventSlot). */
export const roomSaveSlot = (d: Record<string, unknown>): string | null => (SCOPES.includes(d.sc) && isInt(d.n, 1, SAVE_SLOTS) ? `room_save|${d.sc as string}|${d.n}` : null);
