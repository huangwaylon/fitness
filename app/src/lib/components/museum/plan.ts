// The museum's plan (docs/design.md "The museum"), pure: NH's museum on one floor, in model units (a tile is 10, a
// villager 16 tall: the tent's room's scale, tent/grid.ts), +z toward the camera (the front door). Only the room one is
// in is drawn, so the rooms need only not overlap and meet at their doorways; each is a "portrait room" (12 tiles
// across, the screen's way, deep the other: the camera shows one whole across, camera.ts):
//   hall      12 × 16 round the middle, its front door at +z, an arch in each side wall and two in its back wall
//   bug       through the left arch, 12 × 20: the garden under glass
//   fish      through the right arch, 12 × 20: the aquarium's tanks, the sea creatures' among them
//   F1 F2 F3  the fossils, NH's loop: F1 12 × 22 (the standalone fossils, the small skeletons) through the back-left
//             arch, F3 12 × 22 (the rest of the skeletons) through the back-right, F2 12 × 25 (the big skeletons round
//             the T. rex) behind both, its two doorways in its front wall (each a way back, toward F1 and F3): hall >
//             F1 > F2 > F3 > hall
//   G1 G2     through the bug garden's left (far) wall, each its own doorway, 12 × 20 each: the paintings and the
//             statues (G2 in front of G1, entered by a bay of its panels: two rooms 20 deep can't both meet the
//             garden's wall in their front bands)
// No doorway on in a room's front wall (the screen's foot, under the HUD): each room's ways on are in its side or back
// walls; any room two doorways from the hall at most (plan.test).
// Its rooms (one rect each), its walls (made from the rooms: each side's room, for its look),
// its doorways, its carpets, where one may walk (the floors less the walls and what stands on them) and the walk itself
// (a grid of half-tile cells, A* with its corners pulled straight), read by the engine (engine.ts) and the screen
// (MuseumRoom.svelte), tested on their own (plan.test.ts). Named spots and visitors' places: spots.ts.

export type Pt = readonly [number, number];
export interface Rect { x0: number; x1: number; z0: number; z1: number }
/** A wing: what's shown (its exhibits, its finds, its music: sound/places.ts), in a room or a few (the sea creatures
 *  the aquarium's: a find's kind, not a wing). */
export type Wing = 'hall' | 'bug' | 'fish' | 'fossil' | 'art';
/** A room: what's drawn at a time (the one my villager is in). */
export type RoomId = 'hall' | 'bug' | 'fish' | 'F1' | 'F2' | 'F3' | 'G1' | 'G2';

export const TILE = 10;
export const HALL: Rect = { x0: -60, x1: 60, z0: -50, z1: 110 };
export const BUG_WING: Rect = { x0: -180, x1: -60, z0: -50, z1: 150 };
export const FISH_WING: Rect = { x0: 60, x1: 180, z0: -50, z1: 150 };
export const F1: Rect = { x0: -120, x1: 0, z0: -270, z1: -50 };
export const F2: Rect = { x0: -60, x1: 60, z0: -520, z1: -270 };
export const F3: Rect = { x0: 0, x1: 120, z0: -270, z1: -50 };
export const G1: Rect = { x0: -300, x1: -180, z0: -170, z1: 30 };
export const G2: Rect = { x0: -300, x1: -180, z0: 30, z1: 230 };
/** Every room's floor (no two overlap). */
export const ROOMS: readonly { id: RoomId; wing: Wing; r: Rect }[] = [
  { id: 'hall', wing: 'hall', r: HALL }, { id: 'bug', wing: 'bug', r: BUG_WING }, { id: 'fish', wing: 'fish', r: FISH_WING },
  { id: 'F1', wing: 'fossil', r: F1 }, { id: 'F2', wing: 'fossil', r: F2 }, { id: 'F3', wing: 'fossil', r: F3 },
  { id: 'G1', wing: 'art', r: G1 }, { id: 'G2', wing: 'art', r: G2 }
];
export const ROOM_IDS: readonly RoomId[] = ['hall', 'bug', 'fish', 'F1', 'F2', 'F3', 'G1', 'G2'];
/** A room's wing (its music, its chip's name). */
export const wingOfRoom = (id: RoomId): Wing => ROOMS.find((r) => r.id === id)!.wing;
/** A room's rects, and the box round them. */
export const rectsOf = (id: RoomId): Rect[] => ROOMS.filter((r) => r.id === id).map((r) => r.r);
export function boundsOf(id: RoomId): Rect {
  const rs = rectsOf(id);
  return { x0: Math.min(...rs.map((r) => r.x0)), x1: Math.max(...rs.map((r) => r.x1)), z0: Math.min(...rs.map((r) => r.z0)), z1: Math.max(...rs.map((r) => r.z1)) };
}
/** The openings in the hall's side walls (z), to the bug wing and the aquarium. */
export const OPENING = { z0: -5, z1: 25 } as const;
/** The openings in the hall's back wall (x, either side of the middle), to the fossils' F1 (−) and F3 (+). */
export const BACK_OPENING = { x0: 30, x1: 54 } as const;
/** A doorway between two rooms: the wall it's in (x = `at` for 'x', z = `at` for 'z'), its span along the wall, the
 *  room it's counted to (`room`, the side one comes from: the hall's, then each room's on along the line), the room
 *  beyond (`next`). */
export interface Opening { axis: 'x' | 'z'; at: number; from: number; to: number; room: RoomId; next: RoomId }
const door = (axis: 'x' | 'z', at: number, from: number, to: number, room: RoomId, next: RoomId): Opening => ({ axis, at, from, to, room, next });
export const OPENINGS: readonly Opening[] = [
  door('x', HALL.x0, OPENING.z0, OPENING.z1, 'hall', 'bug'),
  door('x', HALL.x1, OPENING.z0, OPENING.z1, 'hall', 'fish'),
  door('z', HALL.z0, -BACK_OPENING.x1, -BACK_OPENING.x0, 'hall', 'F1'),
  door('z', HALL.z0, BACK_OPENING.x0, BACK_OPENING.x1, 'hall', 'F3'),
  // (the loop's far side: F2 behind F1 and F3, by their back walls; each its way back in F2's front wall)
  door('z', F1.z0, -28, -4, 'F1', 'F2'),
  door('z', F3.z0, 4, 28, 'F3', 'F2'),
  // (the gallery off the bug garden's far wall: G1 by its front band at the garden's stone path, G2 by a bay of its panels)
  door('x', BUG_WING.x0, G1.z0 + 155, G1.z0 + 185, 'bug', 'G1'),
  door('x', BUG_WING.x0, G2.z0 + 68, G2.z0 + 92, 'bug', 'G2')
];
/** The front door's half width (its gap in the hall's front wall) and its height. */
export const DOOR_HALF = 12, DOOR_H = 32;
/** Where one comes in (just inside the front door) and the doormat's tap area (a tap there goes back out). */
export const ENTRANCE: Pt = [0, HALL.z1 - 14];
export const DOORMAT: Rect = { x0: -DOOR_HALF, x1: DOOR_HALF, z0: HALL.z1 - 10, z1: HALL.z1 };
/** Blathers' reception desk at the back of the hall (its green top's extents and its height: engine.ts builds it, the
 *  walk keeps off it; the curator stands behind it, curator.ts AT, clear of it in every pose: curator.test). */
export const DESK: Rect & { h: number } = { x0: -22, x1: 22, z0: -32, z1: -20, h: 8.6 };
/** The hall's plants ([model, x, z, scale]: a pair in the front corners, a pair by the side walls between the
 *  benches and the door, a pair by the side arches' back jambs). */
export const HALL_PLANTS: readonly [string, number, number, number][] = [
  ['heliconia', -52, HALL.z1 - 8, 1.6], ['anthurium', 52, HALL.z1 - 8, 2.4], ['anthurium', -53, 76, 2.2], ['heliconia', 53, 76, 1.6],
  ['anthurium', -53, -18, 2.2], ['heliconia', 53, -18, 1.6]
];
/** The walls' heights: the hall's grand, the wings' a little lower. */
export const HALL_H = 64;
export const WING_H = 52;
/** A doorway's top (its lintel's foot): the hall's arches to the wings' height, those between two wings lower. */
export const doorTop = (o: Opening): number => (o.room === 'hall' ? WING_H : 40);
/** The plaque over each doorway, the room beyond's name in spaced kana (the island's world copy: no kanji). */
export const PLAQUE: Readonly<Record<Exclude<RoomId, 'hall'>, string>> = {
  bug: 'む し', fish: 'さ か な', F1: 'か せ き', F2: 'か せ き 2', F3: 'か せ き 3', G1: 'び じゅ つ', G2: 'び じゅ つ 2'
};

/** A wall's thickness; the hall's walls' top (its cornice's foot: the hall's height and its moulding). */
export const WALL_T = 3;
export const CORNICE = HALL_H + 2.45;
/** A doorway's plaque's board (model units), and how far a side wall's flag stands off its wall at least (a hand's
 *  breadth: further where the room view needs it, camera.ts plaqueOf). */
export const PLAQUE_W = 30, PLAQUE_H = 8;
export const FLAG_OFF = 2.5;
/** Where a doorway's plaque hangs, read from `side` (its own room's, naming the room beyond; or the room beyond's, on
 *  the way back, naming the room behind): its middle and its turn (three's yaw; a board facing +z, two faces back to
 *  back). Over its arch in a back or front wall (the hall's back arches just under the cornice); in a side wall a flag
 *  sign standing straight out toward the camera at the doorway's front jamb, so a back arch's plaque and a side arch's
 *  never stack on the screen. */
export function plaqueAt(o: Opening, side: 'room' | 'next' = 'room', off = FLAG_OFF): { x: number; y: number; z: number; yaw: number } {
  const mid = (o.from + o.to) / 2, wallTop = o.room === 'hall' ? CORNICE : WING_H, top = doorTop(o);
  const k = (o.axis === 'x' ? roomIdAt(o.at + 5, mid) : roomIdAt(mid, o.at + 5)) === o.room ? 1 : -1, s = side === 'room' ? k : -k;
  if (o.axis === 'z') {
    const y = o.room === 'hall' ? wallTop - PLAQUE_H / 2 - 1 : (top + wallTop) / 2;
    return { x: mid, y, z: o.at + s * (WALL_T / 2 + 0.2), yaw: s > 0 ? 0 : Math.PI };
  }
  return { x: o.at + s * (WALL_T / 2 + off + PLAQUE_W / 2), y: (top + wallTop) / 2, z: o.to - 5, yaw: 0 };
}

/** The carpets: each room's strips (meeting square, edge to edge, none overlapping, flush to the doorways they lead
 *  to; the engine lays a room's as one seamless mesh). The hall's: one runner from the front door to the desk (the
 *  arches read by their plaques and cards, no cross of spurs to them). */
export const CARPETS: readonly { room: RoomId; rects: readonly Rect[] }[] = [
  { room: 'hall', rects: [
    { x0: -12, x1: 12, z0: DESK.z1, z1: HALL.z1 }
  ] },
  // F1: up the middle from the hall's arch to the hero's plinth
  { room: 'F1', rects: [{ x0: -54, x1: -30, z0: -194, z1: F1.z1 }] },
  // F2: across its front band from F1's door to F3's, and up the middle to the T. rex's island (its own green rug: ISLAND_RUG)
  { room: 'F2', rects: [{ x0: -28, x1: 28, z0: F2.z1 - 24, z1: F2.z1 }, { x0: -12, x1: 12, z0: -340, z1: F2.z1 - 24 }] },
  // the gallery: a mat in from each one's door
  { room: 'G1', rects: [{ x0: BUG_WING.x0 - 18, x1: BUG_WING.x0, z0: G1.z0 + 155, z1: G1.z0 + 185 }] },
  { room: 'G2', rects: [{ x0: BUG_WING.x0 - 18, x1: BUG_WING.x0, z0: G2.z0 + 68, z1: G2.z0 + 92 }] }
];

/** The green rug under the T. rex's island in the middle of F2. */
export const ISLAND_RUG: Rect = { x0: -38, x1: 38, z0: -370, z1: -340 };

/** A wall: from a to b (x, z) and its height (each side looks as the room it faces: roomBeside). */
export interface Wall { a: Pt; b: Pt; h: number }
/** The front door's gap (a gap in a wall, no room beyond). */
const FRONT_DOOR = { axis: 'z' as const, at: HALL.z1, from: -DOOR_HALF, to: DOOR_HALF };
/** The room whose rect's inside holds (x, z) (not its edge). */
function roomInside(x: number, z: number): RoomId | null {
  for (const { id, r } of ROOMS) if (x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1) return id;
  return null;
}
/** Every wall, made from the rooms: along each rect's edge, a slab wherever its two sides are different rooms (or a room
 *  and the outside), less the doorways; split where another wall meets it (a joint: wallEnds); by the hall the hall's
 *  height. */
export const WALLS: readonly Wall[] = (() => {
  type Seg = { axis: 'x' | 'z'; at: number; s0: number; s1: number; h: number };
  const gaps = [...OPENINGS, FRONT_DOOR];
  const lines = new Map<string, { axis: 'x' | 'z'; at: number; cuts: Set<number> }>();
  const line = (axis: 'x' | 'z', at: number) => lines.get(`${axis}${at}`) ?? lines.set(`${axis}${at}`, { axis, at, cuts: new Set() }).get(`${axis}${at}`)!;
  // (every rect's corner cuts each line through it, and each doorway's ends: the pieces joined again below)
  for (const { r } of ROOMS) {
    for (const x of [r.x0, r.x1]) for (const z of [r.z0, r.z1]) (line('x', x).cuts.add(z), line('z', z).cuts.add(x));
  }
  for (const l of lines.values()) {
    for (const g of gaps) if (g.axis === l.axis && g.at === l.at) (l.cuts.add(g.from), l.cuts.add(g.to));
  }
  const raw: Seg[] = [];
  for (const l of lines.values()) {
    const cuts = [...l.cuts].sort((a, b) => a - b);
    for (let k = 0; k + 1 < cuts.length; k++) {
      const s0 = cuts[k], s1 = cuts[k + 1], m = (s0 + s1) / 2;
      const [a, b] = l.axis === 'x' ? [roomInside(l.at - 1, m), roomInside(l.at + 1, m)] : [roomInside(m, l.at - 1), roomInside(m, l.at + 1)];
      if (a === b || gaps.some((g) => g.axis === l.axis && g.at === l.at && m > g.from && m < g.to)) continue;
      raw.push({ axis: l.axis, at: l.at, s0, s1, h: a === 'hall' || b === 'hall' ? HALL_H : WING_H });
    }
  }
  // joined again along its line where no other wall meets the joint and the heights agree
  const ends = (s: Seg): [Pt, Pt] => (s.axis === 'x' ? [[s.at, s.s0], [s.at, s.s1]] : [[s.s0, s.at], [s.s1, s.at]]);
  const met = (p: Pt, self: Seg) => raw.some((o) => o.axis !== self.axis && ends(o).some((q) => q[0] === p[0] && q[1] === p[1]));
  const out: Seg[] = [];
  for (const s of [...raw].sort((p, q) => (p.axis === q.axis ? p.at - q.at || p.s0 - q.s0 : p.axis < q.axis ? -1 : 1))) {
    const last = out.at(-1);
    if (last && last.axis === s.axis && last.at === s.at && last.s1 === s.s0 && last.h === s.h && !met(ends(s)[0], s)) last.s1 = s.s1;
    else out.push({ ...s });
  }
  return out.map((s) => ({ a: ends(s)[0], b: ends(s)[1], h: s.h }));
})();
/** How each end of a wall's slab meets the others (its thickness's square at a joint drawn by one slab only, so no two
 *  slabs' faces ever share a plane): +1 it runs on over the joint's square (the joint's tallest, one running on in its
 *  own line before a corner's, then the first), −1 it stops at the slab that does, 0 a free end (a door's, an
 *  opening's: the wall stops at its point). */
export function wallEnds(walls: readonly Wall[], i: number): [number, number] {
  const at = (p: Pt) => walls.map((w, k) => ({ w, k })).filter(({ w }) => same(w.a, p) || same(w.b, p));
  const dir = (w: Wall, p: Pt) => (same(w.a, p) ? [w.b[0] - w.a[0], w.b[1] - w.a[1]] : [w.a[0] - w.b[0], w.a[1] - w.b[1]]);
  const end = (p: Pt): number => {
    const here = at(p);
    if (here.length < 2) return 0;
    // (in its own line: another wall at the joint runs on the other way)
    const through = (w: Wall) => here.some(({ w: o }) => o !== w && cross(dir(w, p), dir(o, p)) === 0);
    const owner = [...here].sort((x, y) => y.w.h - x.w.h || +through(y.w) - +through(x.w) || x.k - y.k)[0];
    return owner.k === i ? 1 : -1;
  };
  return [end(walls[i].a), end(walls[i].b)];
}
const same = (p: Pt, q: Pt) => p[0] === q[0] && p[1] === q[1];
const cross = (u: number[], v: number[]) => u[0] * v[1] - u[1] * v[0];

export const inRect = (r: Rect, x: number, z: number, pad = 0): boolean => x >= r.x0 + pad && x <= r.x1 - pad && z >= r.z0 + pad && z <= r.z1 - pad;
/** The room a point is in (null: outside, or in a wall). */
export function roomIdAt(x: number, z: number): RoomId | null {
  for (const { id, r } of ROOMS) if (inRect(r, x, z)) return id;
  return null;
}
/** Whether (x, z) is in a doorway: within its span, `band` either side of its wall's line. */
export const inOpening = (o: Opening, x: number, z: number, band: number): boolean => {
  const [along, across] = o.axis === 'x' ? [z, x] : [x, z];
  return along >= o.from && along <= o.to && Math.abs(across - o.at) <= band;
};
/** The room a point belongs to (a doorway, and a little past it, the room it's counted to; a wall or outside, null). */
export function roomOf(x: number, z: number): RoomId | null {
  for (const o of OPENINGS) if (inOpening(o, x, z, 4)) return o.room;
  return roomIdAt(x, z);
}
/** The room a player is in, sticky at the doorways (the room drawn): another room only once (x, z) is `band` past the
 *  doorway's line, so standing in the doorway (or walking along its wall) keeps the room one came from. A point `band`
 *  off in a wall or outside doesn't count. */
export function roomHeld(prev: RoomId, x: number, z: number, band = 10): RoomId {
  const seen = [roomOf(x, z), roomOf(x - band, z), roomOf(x + band, z), roomOf(x, z - band), roomOf(x, z + band)].filter((r): r is RoomId => !!r);
  return seen.length && seen.every((r) => r === seen[0]) ? seen[0] : prev;
}

/** The rooms near (x, z): the one it's in and both sides of any doorway within `reach` (a room's exhibits built only
 *  once woken, their models fetched as my villager comes up to it: exhibits.ts LAZY). */
export function nearRooms(x: number, z: number, reach = 70): RoomId[] {
  const out = new Set<RoomId>();
  const r = roomIdAt(x, z);
  if (r) out.add(r);
  for (const o of OPENINGS) {
    const m = (o.from + o.to) / 2, [ox, oz] = o.axis === 'x' ? [o.at, m] : [m, o.at];
    if (Math.hypot(x - ox, z - oz) < reach) (out.add(o.room), out.add(o.next));
  }
  return [...out];
}

// ---- the walk ------------------------------------------------------------------------------------------------------

/** A walk cell's side (model units). */
export const CELL = 5;
/** How far a walker keeps from a wall or a thing (its body's half width). */
const BODY = 6;
/** The grid's bounds: round every room. */
const X0 = Math.min(...ROOMS.map(({ r }) => r.x0)), Z0 = Math.min(...ROOMS.map(({ r }) => r.z0));
const COLS = (Math.max(...ROOMS.map(({ r }) => r.x1)) - X0) / CELL, ROWS = (Math.max(...ROOMS.map(({ r }) => r.z1)) - Z0) / CELL;

export interface Nav {
  readonly open: Uint8Array;
  readonly cols: number;
  readonly rows: number;
}
const cellMid = (i: number, j: number): Pt => [X0 + (i + 0.5) * CELL, Z0 + (j + 0.5) * CELL];
const cellOf = (x: number, z: number): [number, number] => [Math.floor((x - X0) / CELL), Math.floor((z - Z0) / CELL)];

/** How far (x, z) is from a wall's line (its segment). */
export function wallDistance(wl: Wall, x: number, z: number): number {
  const dx = wl.b[0] - wl.a[0], dz = wl.b[1] - wl.a[1], l2 = dx * dx + dz * dz;
  const t = Math.max(0, Math.min(1, ((x - wl.a[0]) * dx + (z - wl.a[1]) * dz) / l2));
  return Math.hypot(x - wl.a[0] - dx * t, z - wl.a[1] - dz * t);
}
/** The front door, shut to the walk (a tap on the doormat goes out). */
const DOOR: Wall = { a: [-DOOR_HALF, HALL.z1], b: [DOOR_HALF, HALL.z1], h: 0 };
/** The floors' cells a body clear of every wall (the rooms' and the doorways' through their walls), made once. */
let floorCells: Uint8Array | null = null;
function floorsOpen(): Uint8Array {
  if (floorCells) return floorCells;
  const open = new Uint8Array(COLS * ROWS);
  for (let j = 0; j < ROWS; j++)
    for (let i = 0; i < COLS; i++) {
      const [x, z] = cellMid(i, j);
      const onFloor = !!roomIdAt(x, z) || OPENINGS.some((o) => inOpening(o, x, z, 10));
      open[j * COLS + i] = onFloor && [...WALLS, DOOR].every((wl) => wallDistance(wl, x, z) > BODY) ? 1 : 0;
    }
  return (floorCells = open);
}

/** The walk grid: the floors and the openings, a body clear of the walls, less what stands there (each a rect, padded
 *  by a body). */
export function navOf(blocks: readonly Rect[] = []): Nav {
  const open = floorsOpen().slice();
  // (each block over its own cells only, its padded rect tested as a cell's middle: a dozen rebuilds at the way in)
  for (const b of blocks) {
    const x0 = b.x0 - BODY, x1 = b.x1 + BODY, z0 = b.z0 - BODY, z1 = b.z1 + BODY;
    const [i0, j0] = cellOf(x0, z0), [i1, j1] = cellOf(x1, z1);
    for (let j = Math.max(0, j0); j <= Math.min(ROWS - 1, j1); j++)
      for (let i = Math.max(0, i0); i <= Math.min(COLS - 1, i1); i++) {
        const x = X0 + (i + 0.5) * CELL, z = Z0 + (j + 0.5) * CELL;
        if (x >= x0 && x <= x1 && z >= z0 && z <= z1) open[j * COLS + i] = 0;
      }
  }
  return { open, cols: COLS, rows: ROWS };
}

export const walkable = (g: Nav, x: number, z: number): boolean => {
  const [i, j] = cellOf(x, z);
  return i >= 0 && j >= 0 && i < g.cols && j < g.rows && g.open[j * g.cols + i] === 1;
};

/** The walkable point nearest (x, z) (itself when it is one). */
export function nearestOpen(g: Nav, x: number, z: number): Pt | null {
  if (walkable(g, x, z)) return [x, z];
  const [ci, cj] = cellOf(x, z);
  let best: Pt | null = null, bd = Infinity;
  for (let r = 1; r < 40 && !best; r++)
    for (let j = cj - r; j <= cj + r; j++)
      for (let i = ci - r; i <= ci + r; i++) {
        if (Math.max(Math.abs(i - ci), Math.abs(j - cj)) !== r || i < 0 || j < 0 || i >= g.cols || j >= g.rows || !g.open[j * g.cols + i]) continue;
        const m = cellMid(i, j), d = Math.hypot(m[0] - x, m[1] - z);
        if (d < bd) (bd = d), (best = m);
      }
  return best;
}

/** Whether a straight walk from a to b keeps to open cells: every cell the segment passes through, a corner's both
 *  neighbours (a grid walk, not samples: a sample a quarter cell apart could step over a jamb's corner). */
function clear(g: Nav, a: Pt, b: Pt): boolean {
  let [i, j] = cellOf(a[0], a[1]);
  const [ei, ej] = cellOf(b[0], b[1]);
  const dx = b[0] - a[0], dz = b[1] - a[1], si = Math.sign(dx), sj = Math.sign(dz);
  const open = (ci: number, cj: number) => ci >= 0 && cj >= 0 && ci < g.cols && cj < g.rows && g.open[cj * g.cols + ci] === 1;
  // (the segment's parameter at its next vertical and horizontal cell edge, and the step between them)
  const edge = (p: number, d: number, k: number, o: number) => (d === 0 ? Infinity : ((o + (k + (d > 0 ? 1 : 0)) * CELL) - p) / d);
  let tx = edge(a[0], dx, i, X0), tz = edge(a[1], dz, j, Z0);
  const sx = dx === 0 ? Infinity : CELL / Math.abs(dx), sz = dz === 0 ? Infinity : CELL / Math.abs(dz);
  if (!open(i, j)) return false;
  for (let n = 0; (i !== ei || j !== ej) && n < 4 * (g.cols + g.rows); n++) {
    if (Math.abs(tx - tz) < 1e-9) {
      // (through a corner: both cells beside it as well as the one across)
      if (!open(i + si, j) || !open(i, j + sj)) return false;
      i += si, j += sj, tx += sx, tz += sz;
    } else if (tx < tz) (i += si), (tx += sx);
    else (j += sj), (tz += sz);
    if (!open(i, j)) return false;
  }
  return true;
}
/** A walk from `from` to `to` (snapped to the nearest open point): its points after `from`, its corners pulled
 *  straight; [] when there's none (or nowhere to go). */
export function walkPath(g: Nav, from: Pt, to: Pt): Pt[] {
  const end = nearestOpen(g, to[0], to[1]), start = nearestOpen(g, from[0], from[1]);
  if (!end || !start) return [];
  if (Math.hypot(end[0] - from[0], end[1] - from[1]) < 0.5) return [];
  if (clear(g, start, end)) return [...(start[0] !== from[0] || start[1] !== from[1] ? [start] : []), end];
  const [si, sj] = cellOf(start[0], start[1]), [ei, ej] = cellOf(end[0], end[1]);
  const N = g.cols * g.rows, s = sj * g.cols + si, e = ej * g.cols + ei;
  const gs = new Float32Array(N).fill(Infinity), came = new Int32Array(N).fill(-1), done = new Uint8Array(N);
  const heap: [number, number][] = [];
  const push = (k: number, f: number) => {
    heap.push([f, k]);
    let c = heap.length - 1;
    while (c > 0) {
      const p = (c - 1) >> 1;
      if (heap[p][0] <= heap[c][0]) break;
      [heap[p], heap[c]] = [heap[c], heap[p]];
      c = p;
    }
  };
  const pop = (): number => {
    const top = heap[0], last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let c = 0;
      for (;;) {
        const l = c * 2 + 1, r = l + 1;
        let m = c;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === c) break;
        [heap[m], heap[c]] = [heap[c], heap[m]];
        c = m;
      }
    }
    return top[1];
  };
  const h = (k: number) => Math.hypot((k % g.cols) - ei, Math.floor(k / g.cols) - ej);
  gs[s] = 0;
  push(s, h(s));
  while (heap.length) {
    const k = pop();
    if (done[k]) continue;
    done[k] = 1;
    if (k === e) break;
    const i = k % g.cols, j = Math.floor(k / g.cols);
    for (let dj = -1; dj <= 1; dj++)
      for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ni = i + di, nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= g.cols || nj >= g.rows) continue;
        const nk = nj * g.cols + ni;
        // (no cutting a corner past a closed cell)
        if (!g.open[nk] || (di && dj && (!g.open[j * g.cols + ni] || !g.open[nj * g.cols + i]))) continue;
        const ng = gs[k] + (di && dj ? Math.SQRT2 : 1);
        if (ng < gs[nk]) {
          gs[nk] = ng;
          came[nk] = k;
          push(nk, ng + h(nk));
        }
      }
  }
  if (!done[e]) return [];
  const cells: Pt[] = [];
  for (let k = e; k !== -1 && k !== s; k = came[k]) cells.push(cellMid(k % g.cols, Math.floor(k / g.cols)));
  cells.reverse();
  cells[cells.length - 1] = end;
  // the corners pulled straight: from each point, on to the farthest one in plain sight
  const out: Pt[] = [];
  let at: Pt = start;
  let i = 0;
  if (start[0] !== from[0] || start[1] !== from[1]) out.push(start);
  while (i < cells.length) {
    let far = i;
    for (let k = cells.length - 1; k > i; k--) if (clear(g, at, cells[k])) { far = k; break; }
    out.push(cells[far]);
    at = cells[far];
    i = far + 1;
  }
  return out;
}
