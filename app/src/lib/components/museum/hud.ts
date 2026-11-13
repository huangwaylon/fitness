// The museum's HUD and wayfinding, pure (RoomChip.svelte, MuseumCard.svelte's dock, the NEW tags, the doorways' taps
// and plaques): the room chip's name (the room's doorway plaque's, word for word: one term a room), what's on show in
// that room of how many it holds, the finds of the last day drawn now and not yet looked at (NEW: in this room, the hall
// all of them; which wings have one, for the hall's plaques; a tank of many one tag), which edge an exhibit's card docks
// to, where a plaque stands in the room view, and the screen geometry of a doorway's tap. In-world words, so spaced
// kana (plan.ts PLAQUE).
import { PLAQUE, PLAQUE_H, wingOfRoom, type Opening, type RoomId, type Wing } from './plan.ts';
import { BUG_IDS, FISH_IDS, onDisplay, type Specimen } from './species.ts';
import { bugsOnDisplay } from './bugShow.ts';
import { plaqueOf } from './camera.ts';
import { SEA } from '#lib/world/sea.ts';
import { SPOTS as FOSSIL_SPOTS, fossilsIn, setOf, type SetId } from './fossils.ts';
import { ART_SPOTS, artIn } from './art.ts';

/** The hall's name on the chip (its own plaque is the museum's). */
export const HALL_NAME = 'はくぶつかん';
/** The chip's name for a room: its doorway plaque's (む し, さ か な, か せ き 2…). */
export const chipName = (room: RoomId): string => (room === 'hall' ? HALL_NAME : PLAQUE[room]);

/** What's on show, as MuseumRoom has it: its specimens (fish, bugs, sea creatures), its fossils, its artworks, each
 *  with its first find's time. */
interface Found { id: string; found: { at: number } }
export interface OnShow { specimens: readonly (Found & Pick<Specimen, 'kind' | 'tank'>)[]; fossils: readonly Found[]; artworks: readonly Found[] }

/** The room an exhibit is shown in (the sea creatures in the aquarium), or null (a fossil or artwork with no spot). */
export function roomOfFind(kind: 'fish' | 'bug' | 'sea' | 'fossil' | 'art', id: string): RoomId | null {
  if (kind === 'fish' || kind === 'sea') return 'fish';
  if (kind === 'bug') return 'bug';
  return (kind === 'fossil' ? FOSSIL_SPOTS.get(id)?.room : ART_SPOTS.get(id)?.room) ?? null;
}
/** Everything on show with its room. */
function placed(on: OnShow): { id: string; room: RoomId | null; at: number; tank?: string; set?: SetId }[] {
  return [
    ...on.specimens.map((s) => ({ id: s.id, room: roomOfFind(s.kind, s.id), at: s.found.at, ...(s.kind === 'bug' ? {} : { tank: s.tank }) })),
    ...on.fossils.map((f) => {
      const set = setOf(f.id);
      return { id: f.id, room: roomOfFind('fossil', f.id), at: f.found.at, ...(set ? { set } : {}) };
    }),
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

/** A find this new (ms) is NEW: its tag over it, the chip's 「あたらしい n」 (and Blathers' news). */
export const NEW_MS = 86_400_000;
/** A new find: its room, its first find's time, its tank (a fish's, a sea creature's), its skeleton (a fossil piece's). */
interface Fresh { id: string; room: RoomId; at: number; tank?: string; set?: SetId }
/** What one NEW stands for: a skeleton's new pieces are one (`set:<set>`, as NH's one card a skeleton), else the find. */
export const unitOf = (f: { id: string; set?: SetId }): string => (f.set ? `set:${f.set}` : f.id);
/** What's drawn in the hour (species.ts hourOf's): the aquarium's fish and the garden's bugs the hour's pick (species.ts
 *  onDisplay, bugShow.ts bugsOnDisplay); the sea creatures, the fossils and the art always. */
export function drawnIn(on: OnShow, hour: number): Set<string> {
  // (the picks read the specimens' ids, kinds and tanks only)
  const list = on.specimens as unknown as readonly Specimen[];
  return new Set([
    ...[...onDisplay(list, hour).values()].flat().map((s) => s.id),
    ...bugsOnDisplay(list, hour).map((b) => b.sp.id),
    ...on.specimens.filter((s) => s.kind === 'sea').map((s) => s.id),
    ...on.fossils.map((f) => f.id),
    ...on.artworks.map((a) => a.id)
  ]);
}
/** The finds of the last day at `now` (one stamped a little ahead of the clock too), each with its room: only those
 *  drawn now (`hour`: drawnIn's; an off-season fish isn't), and none already looked at on this phone (`seen`: its card
 *  opened, by id: a first find comes once). */
export function freshFinds(on: OnShow, now: number, o: { hour?: number; seen?: Readonly<Record<string, number>> } = {}): Fresh[] {
  const drawn = o.hour === undefined ? null : drawnIn(on, o.hour);
  return placed(on).filter((p): p is Fresh => !!p.room && now - p.at < NEW_MS && (!drawn || drawn.has(p.id)) && !o.seen?.[p.id]);
}
/** More new than this in one tank: one tag on the tank, 「NEW ×n」. */
export const TAG_MAX = 3;
/** The NEW tags: one over each new find (its tank's too: the tag kept over the glass), one over a skeleton's new pieces
 *  (`set:<set>`, its pieces), but one for a whole tank with more than TAG_MAX (`case:<tank>`, its finds). */
export function tagsOf(fresh: readonly Fresh[]): { key: string; room: RoomId; ids: string[]; tank?: string }[] {
  const byTank = new Map<string, Fresh[]>();
  for (const f of fresh) if (f.tank) byTank.set(f.tank, [...(byTank.get(f.tank) ?? []), f]);
  const out: { key: string; room: RoomId; ids: string[]; tank?: string }[] = [];
  for (const [tank, fs] of byTank) if (fs.length > TAG_MAX) out.push({ key: `case:${tank}`, room: fs[0].room, ids: fs.map((f) => f.id), tank });
  const bySet = new Map<string, { key: string; room: RoomId; ids: string[] }>();
  for (const f of fresh) {
    if (f.tank && byTank.get(f.tank)!.length > TAG_MAX) continue;
    const key = unitOf(f), had = bySet.get(key);
    if (had) had.ids.push(f.id);
    else {
      const t = { key, room: f.room, ids: [f.id], ...(f.tank ? { tank: f.tank } : {}) };
      if (f.set) bySet.set(key, t);
      out.push(t);
    }
  }
  return out;
}
/** The chip's 「あたらしい n」: the room's new finds, a skeleton's pieces one, as the tags (the hall: the whole museum's). */
export const freshIn = (room: RoomId, fresh: readonly { id: string; room: RoomId; set?: SetId }[]): number =>
  new Set(fresh.filter((f) => room === 'hall' || f.room === room).map(unitOf)).size;
/** The wings with a new find (the hall's plaques get a dot). */
export const freshWings = (fresh: readonly { room: RoomId }[]): Set<Wing> => new Set(fresh.map((f) => wingOfRoom(f.room)));

/** The lower share of the screen an exhibit's card would cover: an exhibit drawn there gets its card at the top. */
export const DOCK_LOW = 0.45;
/** Which edge an exhibit's card docks to: the bottom (above the HUD row), unless the exhibit is drawn in the lower 45 %
 *  of the screen (its card would hide it), then the top (under the back pill). */
export const cardDock = (exhibitScreenY: number, viewportH: number): 'top' | 'bottom' =>
  viewportH > 0 && exhibitScreenY > viewportH * (1 - DOCK_LOW) ? 'top' : 'bottom';

/** The doorway's dip (ms): the room changes inside it this long after it starts (engine.ts), the screen's fade to its
 *  colour a little quicker (MuseumRoom's), so it's dark before the cut, whatever frame the fade starts on. */
export const DIP_MS = 150, DIP_FADE_MS = 120;

/** A plaque's middle at a cut wall's foot (engine.ts: over its 5-high kick, the doorway's card cut to it). */
export const PLAQUE_FOOT_Y = 5 + 3 + PLAQUE_H / 2;
/** Where a doorway's plaque stands in the room view (camera.ts plaqueOf's; one on a front wall, which the room view cuts
 *  away, at its foot). */
export function plaqueInView(o: Opening, side: 'room' | 'next'): { x: number; y: number; z: number; yaw: number } {
  const p = plaqueOf(o, side);
  return o.axis === 'z' && p.z < o.at ? { ...p, y: PLAQUE_FOOT_Y } : p;
}

/** A point on the screen (client px). */
export type Px = [number, number];
/** Whether (x, y) is inside the polygon `q` (its corners in order; even-odd). */
export function inPoly(q: readonly Px[], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = q.length - 1; i < q.length; j = i++) {
    const [xi, yi] = q[i], [xj, yj] = q[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
/** (x, y)'s distance to the segment a–b (px). */
export function segDist(x: number, y: number, a: Px, b: Px): number {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy;
  const k = l ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l)) : 0;
  return Math.hypot(x - a[0] - k * dx, y - a[1] - k * dy);
}
/** A quad as tapped: itself, or where it's under `min` px across or tall, its box grown to that about its middle. */
export function fingerQuad(q: readonly Px[], min: number): Px[] {
  const xs = q.map((p) => p[0]), ys = q.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  if (x1 - x0 >= min && y1 - y0 >= min) return [...q];
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, hw = Math.max(min, x1 - x0) / 2, hh = Math.max(min, y1 - y0) / 2;
  return [[mx - hw, my - hh], [mx + hw, my - hh], [mx + hw, my + hh], [mx - hw, my + hh]];
}
