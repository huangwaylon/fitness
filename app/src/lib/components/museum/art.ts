// The art gallery's exhibits (docs/design.md "The museum"), pure: NH's 43 genuine artworks (30 paintings, 13
// statues; never a forgery) as NH's own models (FtrArt*, FtrSculpture*: scripts/world3d-models.ts --museum, a few packs),
// each shown once anyone has had it (a find of kind `item`, its id one of these: a balloon's present holds one now and
// then, island/catalog.ts pickPresent). Paintings hang on the gallery's walls and its panels, facing the room; the
// statues stand on plinths between, roped off; the wild painting's two halves stand side by side, as a folding screen.
import { findKey, type FirstFind } from '#lib/model/finds.ts';
import { G1, G2, type Rect, type RoomId } from './plan.ts';
import M from './models.json' with { type: 'json' };

import { ART, artwork, type Artwork } from './artIds.ts';

/** The pack an artwork's model is in (models.json `pack`): the paintings in two, the statues in two (each under
 *  ~400 KB), fetched whole and only once one of theirs is on show. */
export function artPack(id: string): string {
  const a = artwork(id)!, flat = a.kind === 'painting' || a.kind === 'screen';
  const mine = ART.filter((x) => (x.kind === 'painting' || x.kind === 'screen') === flat);
  return `art-${flat ? 'paintings' : 'statues'}-${mine.indexOf(a) < mine.length / 2 ? 1 : 2}`;
}

/** One artwork on show: its first find (whoever opened the present). */
export interface ArtOnShow { id: string; art: Artwork; found: FirstFind }
/** Every genuine artwork in the first finds (anyone's), in the game's order. */
export function artOnShow(finds: ReadonlyMap<string, FirstFind>): ArtOnShow[] {
  const out: ArtOnShow[] = [];
  for (const a of ART) {
    const f = finds.get(findKey('item', a.id));
    if (f) out.push({ id: a.id, art: a, found: f });
  }
  return out;
}

// ---- where each hangs or stands (the gallery's two rooms: plan.ts G1, G2, each off the bug garden's far wall) ----
// Each room NH's way for a portrait screen: its paintings only on faces toward +z (the camera looks along −z), on its
// back wall (the tallest there, the room's hero: G1 the wild painting's screen between the two hanging scrolls, G2 the
// solemn painting) and on three rows of low panels across it, each row a panel from either side wall with a 3-tile
// aisle between them, so the hero shows from the door up the middle; the statues on plinths in the front band, never
// behind a panel; the bench there too, by the door.

const MODELS = M.models as Record<string, { min: number[]; max: number[] } | undefined>;
/** Paintings drawn over NH's size (NH's gallery hangs them big: the back walls' heroes bigger), their middles at a
 *  villager's eye and a half on the back walls, at the panels' middle on them. */
const WALL_S = 1.8, PANEL_S = 1.6;
const HANG_Y = 22;
/** The panels' height and thickness (low: a villager's head and a half, the aisles behind them seen over them); their
 *  rows' depths (their middle lines, from a room's back wall); their spans (x from its left wall). */
export const PANEL_H = 30, PANEL_T = 3;
const PANEL_Y = PANEL_H / 2 + 0.5;
const ROW_Z = [32, 65, 98] as const;
const FACE = 1.5 + 0.3;
const SPANS: readonly [number, number][] = [[FACE, FACE + 44], [120 - FACE - 44, 120 - FACE]];
const ROOM_RECT: Readonly<Record<'G1' | 'G2', Rect>> = { G1, G2 };
/** The panels' floor (the walk keeps off them, with or without paintings), each its room's. */
export const PANELS: readonly (Rect & { room: RoomId })[] = (['G1', 'G2'] as const).flatMap((room) =>
  ROW_Z.flatMap((z) => SPANS.map(([a, b]) => ({ room, x0: ROOM_RECT[room].x0 + a, x1: ROOM_RECT[room].x0 + b, z0: ROOM_RECT[room].z0 + z - PANEL_T / 2, z1: ROOM_RECT[room].z0 + z + PANEL_T / 2 })))
);
/** The screens' place (in front of G1's back wall's middle). */
const SCREEN: readonly [number, number] = [(G1.x0 + G1.x1) / 2, G1.z0 + 8];

/** Where an artwork is shown: its room, its middle (x, z) and its height (`y`: a painting's middle, else its foot on its
 *  plinth), its turn (three's yaw: 0 faces +z), its scale, its plinth's side and height (0: none). */
export interface ArtSpot { room: RoomId; x: number; y: number; z: number; yaw: number; s: number; plinth: number; plinthH: number }
/** Each run of paintings along a face toward +z (x from its room's left wall): the back walls' and each panel's (each
 *  row's left panel, then its right). */
const RUNS: readonly { room: 'G1' | 'G2'; ids: readonly string[]; z: number; from: number; to: number; s: number; y: number }[] = [
  { room: 'G1', ids: ['graceful-painting'], z: FACE, from: 2, to: 28, s: WALL_S, y: HANG_Y },
  { room: 'G1', ids: ['detailed-painting'], z: FACE, from: 92, to: 118, s: WALL_S, y: HANG_Y },
  { room: 'G2', ids: ['nice-painting'], z: FACE, from: 2, to: 40, s: WALL_S, y: HANG_Y },
  { room: 'G2', ids: ['solemn-painting'], z: FACE, from: 40, to: 80, s: WALL_S, y: HANG_Y },
  { room: 'G2', ids: ['basic-painting', 'quaint-painting'], z: FACE, from: 80, to: 118, s: WALL_S, y: HANG_Y },
  ...(
    [
      ['G1', [['calm-painting'], ['moving-painting']], [['scenic-painting', 'famous-painting'], ['proper-painting', 'glowing-painting']], [['twinkling-painting', 'sinking-painting'], ['flowery-painting', 'dynamic-painting', 'jolly-painting']]],
      ['G2', [['amazing-painting'], ['warm-painting']], [['worthy-painting', 'scary-painting'], ['mysterious-painting', 'moody-painting']], [['common-painting', 'perfect-painting'], ['academic-painting', 'wistful-painting', 'serene-painting']]]
    ] as const
  ).flatMap(([room, ...rows]) => rows.flatMap((row, r) => row.map((ids, k) => ({ room, ids, z: ROW_Z[r] + PANEL_T / 2 + 0.3, from: SPANS[k][0], to: SPANS[k][1], s: PANEL_S, y: PANEL_Y }))))
];
/** The statues, each room's: [id, its place in the front band ('L' by the left wall, 'l' next in from it, 'm' right of
 *  the middle, clear of the hero's line from the door; 'r', 'R' the right side's), its depth (from the back wall: two
 *  rows, a walk between them and in front)]. */
const STATUES: readonly [string, 'G1' | 'G2', 'L' | 'l' | 'm' | 'r' | 'R', number][] = [
  ['warrior-statue', 'G1', 'L', 132], ['mystic-statue', 'G1', 'l', 132], ['ancient-statue', 'G1', 'r', 132], ['beautiful-statue', 'G1', 'R', 132],
  ['familiar-statue', 'G1', 'L', 170], ['informative-statue', 'G1', 'l', 170], ['gallant-statue', 'G1', 'm', 170],
  ['great-statue', 'G2', 'L', 132], ['valiant-statue', 'G2', 'l', 132], ['robust-statue', 'G2', 'r', 132], ['motherly-statue', 'G2', 'R', 132],
  ['rock-head-statue', 'G2', 'r', 170], ['tremendous-statue', 'G2', 'R', 170]
];
/** A statue's scale: NH's size or up to 1.5, a villager's height and a half at most. */
const scaleOf = (w: number, h: number, d: number) => Math.max(1, Math.min(1.5, 24 / h, 20 / Math.max(w, d)));
const size = (id: string): [number, number, number] => {
  const b = MODELS[id];
  return b ? [b.max[0] - b.min[0], b.max[1] - Math.max(0, b.min[1]), b.max[2] - b.min[2]] : [8, 8, 8];
};
export const ART_SPOTS: ReadonlyMap<string, ArtSpot> = (() => {
  const out = new Map<string, ArtSpot>();
  for (const w of RUNS) {
    // spread along the face: equal gaps between the paintings and at the ends
    const r = ROOM_RECT[w.room], widths = w.ids.map((id) => size(id)[0] * w.s), gap = (w.to - w.from - widths.reduce((a, b) => a + b, 0)) / (w.ids.length + 1);
    let u = w.from + gap;
    w.ids.forEach((id, k) => {
      out.set(id, { room: w.room, x: r.x0 + u + widths[k] / 2, y: w.y, z: r.z0 + w.z, yaw: 0, s: w.s, plinth: 0, plinthH: 0 });
      u += widths[k] + gap;
    });
  }
  const plinthW = (id: string) => ((([w, h, d]) => Math.max(w, d) * scaleOf(w, h, d))(size(id))) + 4;
  for (const [id, room, at, v] of STATUES) {
    const r = ROOM_RECT[room], [w, h, d] = size(id), bust = artwork(id)?.kind === 'bust', plinth = plinthW(id);
    // (by a wall; next in: past its neighbour by the wall, a step between)
    const wall = (side: 'L' | 'R') => FACE + 2 + plinthW(STATUES.find((q) => q[1] === room && q[2] === side && q[3] === v)![0]);
    const u = at === 'L' ? FACE + 2 + plinth / 2 : at === 'R' ? 120 - FACE - 2 - plinth / 2 : at === 'l' ? wall('L') + 4 + plinth / 2 : at === 'r' ? 120 - wall('R') - 4 - plinth / 2 : 62;
    out.set(id, { room, x: r.x0 + u, y: bust ? 12 : 4, z: r.z0 + v, yaw: 0, s: scaleOf(w, h, d), plinth, plinthH: bust ? 12 : 4 });
  }
  // the wild painting's halves side by side (the left half at −x), on a low dais
  for (const [id, k] of [['wild-painting-left-half', -1], ['wild-painting-right-half', 1]] as const) {
    const w = size(id)[0] * WALL_S;
    out.set(id, { room: 'G1', x: SCREEN[0] + (k * w) / 2, y: 1, z: SCREEN[1], yaw: 0, s: WALL_S, plinth: 0, plinthH: 0 });
  }
  return out;
})();
/** The screens' dais (both halves on it). */
export const DAIS: Rect & { h: number } = { x0: SCREEN[0] - 32, x1: SCREEN[0] + 32, z0: SCREEN[1] - 6, z1: SCREEN[1] + 6, h: 1 };
/** The floor an artwork's plinth takes (null: one on a wall or the dais). */
export function plinthOf(id: string): Rect | null {
  const sp = ART_SPOTS.get(id);
  if (!sp?.plinth) return null;
  const h = sp.plinth / 2;
  return { x0: sp.x - h, x1: sp.x + h, z0: sp.z - h, z1: sp.z + h };
}
/** The artworks in a room. */
export const artIn = (room: RoomId): string[] => [...ART_SPOTS].filter(([, s]) => s.room === room).map(([id]) => id);
