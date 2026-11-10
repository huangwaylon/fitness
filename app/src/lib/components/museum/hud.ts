// The museum's HUD, pure (RoomChip.svelte, MuseumCard.svelte's dock, the NEW tags): the room chip's name (the room's
// doorway plaque's, word for word: one term a room), what's on show in that room of how many it holds, the finds of the
// last day (NEW: in this room, the hall all of them; which wings have one, for the hall's plaques), and which edge an
// exhibit's card docks to. In-world words, so spaced kana (plan.ts PLAQUE).
import { PLAQUE, wingOfRoom, type RoomId, type Wing } from './plan.ts';
import { BUG_IDS, FISH_IDS } from './species.ts';
import { SEA } from '../island/sea.ts';
import { SPOTS as FOSSIL_SPOTS, fossilsIn } from './fossils.ts';
import { ART_SPOTS, artIn } from './art.ts';

/** The hall's name on the chip (its own plaque is the museum's). */
export const HALL_NAME = 'はくぶつかん';
/** The chip's name for a room: its doorway plaque's (む し, さ か な, か せ き 2…). */
export const chipName = (room: RoomId): string => (room === 'hall' ? HALL_NAME : PLAQUE[room]);

/** What's on show, as MuseumRoom has it: its specimens (fish, bugs, sea creatures), its fossils, its artworks, each
 *  with its first find's time. */
interface Found { id: string; found: { at: number } }
export interface OnShow { specimens: readonly (Found & { kind: 'fish' | 'bug' | 'sea' })[]; fossils: readonly Found[]; artworks: readonly Found[] }

/** The room an exhibit is shown in (the sea creatures in the aquarium), or null (a fossil or artwork with no spot). */
export function roomOfFind(kind: 'fish' | 'bug' | 'sea' | 'fossil' | 'art', id: string): RoomId | null {
  if (kind === 'fish' || kind === 'sea') return 'fish';
  if (kind === 'bug') return 'bug';
  return (kind === 'fossil' ? FOSSIL_SPOTS.get(id)?.room : ART_SPOTS.get(id)?.room) ?? null;
}
/** Everything on show with its room. */
function placed(on: OnShow): { id: string; room: RoomId | null; at: number }[] {
  return [
    ...on.specimens.map((s) => ({ id: s.id, room: roomOfFind(s.kind, s.id), at: s.found.at })),
    ...on.fossils.map((f) => ({ id: f.id, room: roomOfFind('fossil', f.id), at: f.found.at })),
    ...on.artworks.map((a) => ({ id: a.id, room: roomOfFind('art', a.id), at: a.found.at }))
  ];
}

/** How many a room holds (the aquarium NH's 80 fish and 40 sea creatures, the garden 80 bugs, a fossil or gallery room
 *  its spots'). */
export function roomTotal(room: RoomId): number {
  if (room === 'fish') return FISH_IDS.length + Object.keys(SEA).length;
  if (room === 'bug') return BUG_IDS.length;
  const w = wingOfRoom(room);
  return w === 'fossil' ? fossilsIn(room).length : w === 'art' ? artIn(room).length : 0;
}
/** The chip's count: what's on show in this room of how many it holds (the hall: none). */
export function roomTally(room: RoomId, on: OnShow): { found: number; total: number } | null {
  if (room === 'hall') return null;
  return { found: placed(on).filter((p) => p.room === room).length, total: roomTotal(room) };
}

/** A find this new (ms) is NEW: its tag over it, the chip's 「あたらしい n」. */
export const NEW_MS = 86_400_000;
/** The finds of the last day (ids, each with its room) at `now`. */
export function freshFinds(on: OnShow, now: number): { id: string; room: RoomId }[] {
  return placed(on).filter((p): p is { id: string; room: RoomId; at: number } => !!p.room && now - p.at >= 0 && now - p.at < NEW_MS).map(({ id, room }) => ({ id, room }));
}
/** The chip's 「あたらしい n」: the room's new finds (the hall: the whole museum's). */
export const freshIn = (room: RoomId, fresh: readonly { room: RoomId }[]): number => (room === 'hall' ? fresh.length : fresh.filter((f) => f.room === room).length);
/** The wings with a new find (the hall's plaques get a dot). */
export const freshWings = (fresh: readonly { room: RoomId }[]): Set<Wing> => new Set(fresh.map((f) => wingOfRoom(f.room)));

/** The lower share of the screen an exhibit's card would cover: an exhibit drawn there gets its card at the top. */
export const DOCK_LOW = 0.45;
/** Which edge an exhibit's card docks to: the bottom (above the HUD row), unless the exhibit is drawn in the lower 45 %
 *  of the screen (its card would hide it), then the top (under the back pill). */
export const cardDock = (exhibitScreenY: number, viewportH: number): 'top' | 'bottom' =>
  viewportH > 0 && exhibitScreenY > viewportH * (1 - DOCK_LOW) ? 'top' : 'bottom';
