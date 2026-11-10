// The museum's named spots and its visitors' places (docs/design.md "The museum"), pure, from the plan and the exhibits'
// layouts: where a test puts my villager (e2e: __museum.spot(name), not coordinates, so a re-layout moves no spec) and
// where the island's visiting villagers linger (visitors.ts: in front of each room's hero and display faces, on the
// benches, in pairs to chat), every one on open floor with everything on show, clear of the doorways' bands and the
// carpets' runs, facing what it looks at.
import { benchRect, benchSeats, BENCHES } from './seats.ts';
import { ART_SPOTS, DAIS, PANELS, plinthOf } from './art.ts';
import { SPOTS as FOSSIL_SPOTS, footOf } from './fossils.ts';
import { FISH_PLANTS, TANKS, type Box } from './tanks.ts';
import { SEA_TANKS } from './seaTanks.ts';
import { CASE, CASES, OAKS, PALM, POND, PROPS, SOLIDS } from './bugLife.ts';
import { DESK, DOORMAT, ENTRANCE, HALL, HALL_PLANTS, OPENINGS, ROOM_IDS, rectsOf, wingOfRoom, type Pt, type Rect, type RoomId } from './plan.ts';
import type { LingerPoint as VisitorPoint, VisitorRoom } from './visitors.ts';

const flat = (b: Box): Rect => ({ x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 });
/** Everything that stands on the floor with every exhibit on show (the walk keeps off it: engine.ts's and each
 *  exhibit's blocks). */
export function allBlocks(): Rect[] {
  return [
    { x0: DESK.x0 - 1, x1: DESK.x1 + 1, z0: DESK.z0, z1: DESK.z1 }, { x0: DESK.x0 - 2, x1: DESK.x1 + 2, z0: HALL.z0, z1: DESK.z0 },
    ...TANKS.map((t) => flat(t.box)), ...SEA_TANKS.map((t) => flat(t.box)),
    ...HALL_PLANTS.map(([, x, z]) => ({ x0: x - 4, x1: x + 4, z0: z - 4, z1: z + 4 })),
    ...BENCHES.map((b) => benchRect(b)), ...FISH_PLANTS.map(([, x, z]) => ({ x0: x - 5, x1: x + 5, z0: z - 5, z1: z + 5 })),
    ...CASES.map(([x, z]) => ({ x0: x - CASE.w / 2, x1: x + CASE.w / 2, z0: z - CASE.d / 2, z1: z + CASE.d / 2 })), POND,
    ...OAKS.map(([x, z]) => ({ x0: x - 5, x1: x + 5, z0: z - 5, z1: z + 5 })), { x0: PALM[0] - 4, x1: PALM[0] + 4, z0: PALM[1] - 4, z1: PALM[1] + 4 },
    ...SOLIDS.filter((s) => PROPS.some(([n]) => n === s.what)).map(({ x0, x1, z0, z1 }) => ({ x0, x1, z0, z1 })),
    ...[...FOSSIL_SPOTS.keys()].map(footOf),
    ...PANELS, DAIS, ...[...ART_SPOTS.keys()].flatMap((id) => plinthOf(id) ?? [])
  ];
}

/** Three's yaw facing from (x, z) toward (tx, tz) (0 faces +z). */
export const faceYaw = (x: number, z: number, tx: number, tz: number): number => Math.atan2(tx - x, tz - z);

/** A visitor's place: its room, where it stands (or sits), its turn, what it looks at, what it does there. */
export interface LingerPoint { room: RoomId; x: number; z: number; faceYaw: number; exhibitId?: string; kind: 'look' | 'sit' | 'chat' }
const look = (room: RoomId, x: number, z: number, t: Pt, exhibitId?: string): LingerPoint => ({ room, x, z, faceYaw: faceYaw(x, z, t[0], t[1]), exhibitId, kind: 'look' });
const chat = (room: RoomId, a: Pt, b: Pt): LingerPoint[] => [
  { room, x: a[0], z: a[1], faceYaw: faceYaw(a[0], a[1], b[0], b[1]), kind: 'chat' },
  { room, x: b[0], z: b[1], faceYaw: faceYaw(b[0], b[1], a[0], a[1]), kind: 'chat' }
];
const fossil = (id: string): Pt => [FOSSIL_SPOTS.get(id)!.x, FOSSIL_SPOTS.get(id)!.z];
const art = (id: string): Pt => [ART_SPOTS.get(id)!.x, ART_SPOTS.get(id)!.z];
const mid = (b: Box): Pt => [(b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2];
const tank = (id: string) => TANKS.find((t) => t.id === id)!.box;
const seaTank = (id: string) => SEA_TANKS.find((t) => t.id === id)!.box;

/** The visitors' places, 4-8 a room. */
export const LINGER: readonly LingerPoint[] = [
  // the hall: Blathers' desk from either side of the runner, two pairs by the side walls
  look('hall', -28, -8, [0, -26]), look('hall', 28, -8, [0, -26]),
  ...chat('hall', [-30, 52], [-18, 52]),
  // the garden: the oaks, the pond, the flower bed, the cases; a pair by the path
  look('bug', -120, -26, OAKS[0]), look('bug', -128, 82, [(POND.x0 + POND.x1) / 2, (POND.z0 + POND.z1) / 2]),
  look('bug', -98, 34, [-88, 62]), look('bug', -165, 0, CASES[0]),
  ...chat('bug', [-150, 30], [-138, 30]),
  // every bench's seats (the hall's, the aquarium's, the gallery's, the big skeletons'), facing as the bench does
  ...BENCHES.flatMap((b) => benchSeats(b.id).map((s): LingerPoint => ({ room: b.room, x: s.at[0], z: s.at[1], faceYaw: b.yaw, exhibitId: b.id, kind: 'sit' }))),
  // the aquarium: the great tank from beside its benches, the deep tank, the reef and the pool
  look('fish', 128, 2, mid(tank('sea')), 'tank:sea'), look('fish', 112, 66, mid(tank('deep')), 'tank:deep'),
  look('fish', 220, 70, mid(seaTank('reef')), 'tank:reef'), look('fish', 188, 96, mid(seaTank('pool')), 'tank:pool'),
  // the fossils: each room's hero and rows; a pair in each front band
  look('F1', -80, -202, fossil('ammonite'), 'ammonite'), look('F1', -42, -202, fossil('shark-tooth-pattern'), 'shark-tooth-pattern'),
  look('F1', -60, -164, fossil('dunkleosteus'), 'dunkleosteus'), ...chat('F1', [-92, -76], [-80, -76]),
  look('F2', -215, -144, fossil('t-rex-skull'), 't-rex-skull'), look('F2', -185, -144, fossil('t-rex-tail'), 't-rex-tail'),
  look('F2', -200, -272, fossil('diplo-chest'), 'diplo-chest'), ...chat('F2', [-150, -66], [-138, -66]),
  look('F3', -262, 14, fossil('ptera-body'), 'ptera-body'), look('F3', -222, 52, fossil('plesio-torso'), 'plesio-torso'),
  look('F3', -262, 86, fossil('megacero-torso'), 'megacero-torso'), ...chat('F3', [-290, 124], [-278, 124]),
  // the gallery: the screen (G1) and the solemn painting (G2) from the back bay, the rows from the bays, a pair in front
  look('G1', 60, -222, art('wild-painting-left-half'), 'wild-painting-left-half'), look('G1', 30, -180, art('calm-painting'), 'calm-painting'),
  look('G1', 80, -132, art('moving-painting'), 'moving-painting'), ...chat('G1', [96, -60], [108, -60]),
  look('G2', 180, -222, art('solemn-painting'), 'solemn-painting'), look('G2', 150, -180, art('amazing-painting'), 'amazing-painting'),
  look('G2', 196, -132, art('warm-painting'), 'warm-painting'), ...chat('G2', [194, -78], [206, -78])
];

/** Named spots (x, z) on open floor: 'entrance', 'desk' (before Blathers), 'room:<id>' (a room's middle), 'in:<id>' (just
 *  inside a room from the doorway one comes in by), 'bench:<id>:<n>' (a seat's step), 'tank:<id>' (before a tank's
 *  glass), 'fossil:<id>', 'art:<id>' (before it). */
export const SPOTS: ReadonlyMap<string, Pt> = (() => {
  const out = new Map<string, Pt>([['entrance', ENTRANCE], ['desk', [0, -12]]]);
  const rooms: Record<RoomId, Pt> = { hall: [0, 30], bug: [-120, 60], fish: [130, 60], F1: [-60, -130], F2: [-200, -146], F3: [-240, 50], G1: [60, -132], G2: [180, -132] };
  for (const [id, p] of Object.entries(rooms)) out.set(`room:${id}`, p);
  for (const o of OPENINGS) {
    const m = (o.from + o.to) / 2;
    // (the side of the wall the room beyond lies on: its rect's middle's)
    const sign = Math.sign((o.axis === 'x' ? rooms[o.next][0] : rooms[o.next][1]) - o.at);
    out.set(`in:${o.next}`, o.axis === 'x' ? [o.at + sign * 15, m] : [m, o.at + sign * 15]);
  }
  for (const b of BENCHES) for (const s of benchSeats(b.id)) out.set(`bench:${b.id}:${s.n}`, s.at);
  for (const t of TANKS) {
    const b = t.box;
    out.set(`tank:${t.id}`, t.id === 'deep' ? [b.x1 + 12, (b.z0 + b.z1) / 2] : t.id === 'river' ? [(b.x0 + b.x1) / 2, b.z0 - 12] : [(b.x0 + b.x1) / 2 - 20, b.z1 + 8]);
  }
  for (const t of SEA_TANKS) out.set(`tank:${t.id}`, t.id === 'reef' ? [(t.box.x0 + t.box.x1) / 2, t.box.z1 + 12] : [t.box.x0 - 12, (t.box.z0 + t.box.z1) / 2]);
  for (const id of FOSSIL_SPOTS.keys()) {
    const r = footOf(id);
    // (from in front, or from behind for a row by the front wall)
    const room = rectsOf(FOSSIL_SPOTS.get(id)!.room)[0];
    out.set(`fossil:${id}`, [(r.x0 + r.x1) / 2, r.z1 + 15 < room.z1 ? r.z1 + 9 : r.z0 - 9]);
  }
  const stands = [...PANELS, DAIS, ...[...ART_SPOTS.keys()].flatMap((id) => plinthOf(id) ?? [])];
  for (const [id, s] of ART_SPOTS) {
    const foot = plinthOf(id);
    // (a painting's from in front, along its row a little if a statue stands there)
    const free = (x: number, z: number) => !stands.some((r) => x > r.x0 - 9 && x < r.x1 + 9 && z > r.z0 - 9 && z < r.z1 + 9);
    const r = rectsOf(s.room)[0], dx = [0, 10, -10, 20, -20, 30, -30, 40, -40].find((d) => s.x + d > r.x0 + 8 && s.x + d < r.x1 - 8 && free(s.x + d, s.z + 12)) ?? 0;
    // (a statue's from beside it, toward the room's middle: the next row's panel stands close in front)
    const inward = s.x < (r.x0 + r.x1) / 2 ? 1 : -1;
    out.set(`art:${id}`, foot ? [s.x + inward * ((foot.x1 - foot.x0) / 2 + 10), s.z - 4] : [s.x + dx, s.z + 12]);
  }
  return out;
})();
/** A named spot (throws on a name not in SPOTS: a spec's typo). */
export function spot(name: string): Pt {
  const p = SPOTS.get(name);
  if (!p) throw new Error(`no museum spot ${name}`);
  return p;
}

/** The visitors' rooms (visitors.ts): each its wing's kind (the lines'), its way in (`in:<id>`, the hall's just inside
 *  the front door) and its doorways' boxes (a wall's thickness either side of its line). */
export const VISITOR_ROOMS: readonly VisitorRoom[] = ROOM_IDS.map((id) => ({
  id,
  kind: wingOfRoom(id),
  door: id === 'hall' ? [ENTRANCE[0], ENTRANCE[1] - 6] : spot(`in:${id}`),
  doorways: [
    ...OPENINGS.filter((o) => o.room === id || o.next === id).map((o): Rect =>
      o.axis === 'x' ? { x0: o.at - 5, x1: o.at + 5, z0: o.from, z1: o.to } : { x0: o.from, x1: o.to, z0: o.at - 5, z1: o.at + 5 }),
    ...(id === 'hall' ? [DOORMAT] : [])
  ]
}));
/** LINGER as visitors.ts takes it: an id each (a seat's `<bench>:<n>`, what a player sitting there blocks), a chat
 *  point's pair (LINGER lists a pair's halves one after the other), a seat's step (where one stands by it). */
export const VISITOR_POINTS: readonly VisitorPoint[] = (() => {
  const ids = LINGER.map((l, i) => {
    if (l.kind !== 'sit') return `${l.room}.${i}`;
    const n = benchSeats(l.exhibitId!).findIndex((s) => s.at[0] === l.x && s.at[1] === l.z);
    return `${l.exhibitId}:${n}`;
  });
  return LINGER.map((l, i): VisitorPoint => {
    const p: VisitorPoint = { ...l, id: ids[i] };
    if (l.kind === 'chat') {
      // (the first of a pair: the next one, else the one before)
      const first = LINGER.slice(0, i).filter((q) => q.kind === 'chat').length % 2 === 0;
      p.pair = ids[first ? i + 1 : i - 1];
    }
    if (l.kind === 'sit') p.from = benchSeats(l.exhibitId!)[Number(ids[i].split(':')[1])].from;
    return p;
  });
})();
