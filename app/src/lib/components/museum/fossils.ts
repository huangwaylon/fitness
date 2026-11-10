// The fossil rooms' exhibits (docs/design.md "The museum"), pure: NH's 73 fossils (island/fossilIds.ts) as NH's own
// models (FtrFossil*: scripts/world3d-models.ts --museum, one pack a skeleton and one for the standalone ones), each
// shown once anyone has found it (the ずかん's first finds: NH's donation), in three rooms (below: PLACES).
// A skeleton's pieces stand in a row along +x on its platform, NH's way: each piece is a 2 × 2 base with its bones, and
// the pieces in their order join into the whole animal (the skull at −x; a pterosaur's wings either side of its body).
// A piece not found yet leaves its place empty; once every piece is in, the skeleton is complete (its card says so).
import { FOSSIL_SETS, STANDALONE } from '../island/fossilIds.ts';
import { findKey, type FirstFind } from '#lib/model/finds.ts';
import { F1, F2, F3, type Rect, type RoomId } from './plan.ts';

export type SetId = keyof typeof FOSSIL_SETS;
type Standalone = (typeof STANDALONE)[number];

/** Each fossil's NH model folder (the converter's; the pack member is the fossil's id). */
export const FOSSIL_MODEL: Readonly<Record<string, string>> = {
  amber: 'FtrFossilAmber', ammonite: 'FtrFossilAmmonoidea', trilobite: 'FtrFossilTrilobite', 'dinosaur-track': 'FtrFossilIchnology',
  'shark-tooth-pattern': 'FtrFossilShark', coprolite: 'FtrFossilCoprolite', myllokunmingia: 'FtrFossilFirstFish', juramaia: 'FtrFossilFirstMammal',
  anomalocaris: 'FtrFossilAnomalocaris', archaeopteryx: 'FtrFossilArchaeopteryx', dunkleosteus: 'FtrFossilDunkleosteus',
  eusthenopteron: 'FtrFossilFirstAmphibian', acanthostega: 'FtrFossilFirstFourLegs', australopith: 'FtrFossilAustralopithecus',
  't-rex-skull': 'FtrFossilTRexA', 't-rex-torso': 'FtrFossilTRexB', 't-rex-tail': 'FtrFossilTRexC',
  'tricera-skull': 'FtrFossilTriceratopsA', 'tricera-torso': 'FtrFossilTriceratopsB', 'tricera-tail': 'FtrFossilTriceratopsC',
  'stego-skull': 'FtrFossilStegosaurusA', 'stego-torso': 'FtrFossilStegosaurusB', 'stego-tail': 'FtrFossilStegosaurusC',
  'brachio-skull': 'FtrFossilBrachiosaurusA', 'brachio-chest': 'FtrFossilBrachiosaurusB', 'brachio-pelvis': 'FtrFossilBrachiosaurusC', 'brachio-tail': 'FtrFossilBrachiosaurusD',
  'mammoth-skull': 'FtrFossilMammothA', 'mammoth-torso': 'FtrFossilMammothB',
  'sabertooth-skull': 'FtrFossilSmilodonA', 'sabertooth-tail': 'FtrFossilSmilodonB',
  'dimetrodon-skull': 'FtrFossilDimetrodonA', 'dimetrodon-torso': 'FtrFossilDimetrodonB',
  'ankylo-skull': 'FtrFossilAnkylosaurusA', 'ankylo-torso': 'FtrFossilAnkylosaurusB', 'ankylo-tail': 'FtrFossilAnkylosaurusC',
  'plesio-skull': 'FtrFossilElasmosaurusA', 'plesio-torso': 'FtrFossilElasmosaurusB', 'plesio-tail': 'FtrFossilElasmosaurusC',
  'spino-skull': 'FtrFossilSpinosaurusA', 'spino-torso': 'FtrFossilSpinosaurusB', 'spino-tail': 'FtrFossilSpinosaurusC',
  'iguanodon-skull': 'FtrFossilIguanodonA', 'iguanodon-torso': 'FtrFossilIguanodonB', 'iguanodon-tail': 'FtrFossilIguanodonC',
  'pachy-skull': 'FtrFossilPachycephalosaurusA', 'pachy-tail': 'FtrFossilPachycephalosaurusB',
  'diplo-skull': 'FtrFossilDiplodocusA', 'diplo-neck': 'FtrFossilDiplodocusB', 'diplo-chest': 'FtrFossilDiplodocusC',
  'diplo-pelvis': 'FtrFossilDiplodocusD', 'diplo-tail': 'FtrFossilDiplodocusE', 'diplo-tail-tip': 'FtrFossilDiplodocusF',
  'ptera-body': 'FtrFossilPteranodonA', 'right-ptera-wing': 'FtrFossilPteranodonB', 'left-ptera-wing': 'FtrFossilPteranodonC',
  'megacero-skull': 'FtrFossilBrontotheriumA', 'megacero-torso': 'FtrFossilBrontotheriumB', 'megacero-tail': 'FtrFossilBrontotheriumC',
  'parasaur-skull': 'FtrFossilParasaurolophusA', 'parasaur-torso': 'FtrFossilParasaurolophusB', 'parasaur-tail': 'FtrFossilParasaurolophusC',
  'ophthalmo-skull': 'FtrFossilOphthalmosaurusA', 'ophthalmo-torso': 'FtrFossilOphthalmosaurusB',
  'archelon-skull': 'FtrFossilArchelonA', 'archelon-tail': 'FtrFossilArchelonB',
  'deinony-torso': 'FtrFossilDeinonychusA', 'deinony-tail': 'FtrFossilDeinonychusB',
  'right-megalo-side': 'FtrFossilMegalocerosA', 'left-megalo-side': 'FtrFossilMegalocerosB',
  'quetzal-torso': 'FtrFossilQuetzalcoatlusA', 'right-quetzal-wing': 'FtrFossilQuetzalcoatlusB', 'left-quetzal-wing': 'FtrFossilQuetzalcoatlusC'
};

/** A skeleton's pieces as they stand in a row along +x (NH's models join in this order): the game's order, but for the
 *  pterosaurs (left wing, body, right wing) and the megaloceros (its right side at −x). */
export const ROW: Readonly<Record<SetId, readonly string[]>> = {
  ...FOSSIL_SETS,
  ptera: ['left-ptera-wing', 'ptera-body', 'right-ptera-wing'],
  quetzal: ['left-quetzal-wing', 'quetzal-torso', 'right-quetzal-wing'],
  megalo: ['right-megalo-side', 'left-megalo-side']
};
/** A skeleton's pieces drawn this much under NH's size (two big skeletons a row, 2-tile aisles, in a 12-wide room). */
export const SET_S = 0.85;
/** A piece's base: NH's 2 × 2 tiles (its own bounds, a little under 20 deep), as drawn. */
const BASE_W = 20, BASE_D = 18.4;
export const PIECE_W = BASE_W * SET_S;
const PIECE_D = BASE_D * SET_S;
/** A standalone fossil's stand (its top's side and height); the dunkleosteus stands on its own 2 × 2 base. */
const STAND_W = 11;
const STAND_H = 7;
const ON_BASE: ReadonlySet<string> = new Set(['dunkleosteus']);

/** The pack a fossil's model is in (scripts/world3d-models.ts, models.json `pack`): a skeleton's own, or the
 *  standalone ones'. Fetched whole, and only once one of its fossils is on show. */
export const packOf = (id: string): string => {
  for (const [set, ids] of Object.entries(FOSSIL_SETS)) if ((ids as readonly string[]).includes(id)) return `fossil-${set}`;
  return 'fossils';
};

// ---- where everything stands (the fossil rooms: plan.ts F1, F2, F3, a loop from the hall's back-left arch) ----
//   F1   NH's room 1, early life: its hero (the dunkleosteus, bigger, on a plinth on the back wall at the head of the
//        runner from the hall's arch), the cases in short rows on the left and a column on the right, two small skeletons
//   F2   the big skeletons: the diplodocus along the back wall, two rows of a skeleton by either side wall (the gap
//        between them by turns), the T. rex alone on its green rug in the middle (the room's hero), the front band
//        clear for its two doorways
//   F3   the rest: a column turned along the left wall (its way in too), a column of them in front of it, two turned
//        on the right wall, the aisle between them from the bug garden's door to the front
// A skeleton faces +z (the camera looks along −z: its side profile) or, turned, into the room from a side wall; rows 5
// tiles apart in F2 (a tall neck clear of the row behind), 2 tiles between any two in all (fossils.test).

type Slot = SetId | Standalone;
/** The hero (F1's): drawn HERO_S on a plinth PLINTH_W across and PLINTH_H high. */
const HERO = 'dunkleosteus', HERO_S = 1.3;
const PLINTH_W = 32, PLINTH_H = 3;
/** Where each stands: its room, its middle (u across from its room's left wall, v forward from its back wall: F3's main
 *  rect's, its way in at v < 0), and a skeleton turned along z (+1 by the left wall, its skull toward the front; −1 by
 *  the right wall, its skull toward the back). */
interface Place { room: RoomId; slot: Slot; u: number; v: number; turn?: 1 | -1 }
const PLACES: readonly Place[] = [
  // F1: the hero over the runner (u 66..90), the cases in short staggered rows of two on the left, a column on the
  // right, the two small skeletons
  { room: 'F1', slot: HERO, u: 78, v: 20 },
  { room: 'F1', slot: 'ophthalmo', u: 24, v: 14 },
  { room: 'F1', slot: 'shark-tooth-pattern', u: 12, v: 52 }, { room: 'F1', slot: 'coprolite', u: 46, v: 52 },
  { room: 'F1', slot: 'archelon', u: 22, v: 86 }, { room: 'F1', slot: 'archaeopteryx', u: 56, v: 86 },
  { room: 'F1', slot: 'eusthenopteron', u: 20, v: 120 }, { room: 'F1', slot: 'acanthostega', u: 54, v: 120 },
  { room: 'F1', slot: 'dinosaur-track', u: 12, v: 170 }, { room: 'F1', slot: 'juramaia', u: 36, v: 170 }, { room: 'F1', slot: 'ammonite', u: 60, v: 170 },
  { room: 'F1', slot: 'anomalocaris', u: 108, v: 40 }, { room: 'F1', slot: 'myllokunmingia', u: 108, v: 70 },
  { room: 'F1', slot: 'amber', u: 108, v: 100 }, { room: 'F1', slot: 'australopith', u: 108, v: 130 }, { room: 'F1', slot: 'trilobite', u: 108, v: 160 },
  // F2: the back wall, a row of two, another the other way, the T. rex
  { room: 'F2', slot: 'diplo', u: 60, v: 12 },
  { room: 'F2', slot: 'stego', u: 30, v: 62 }, { room: 'F2', slot: 'megalo', u: 99, v: 62 },
  { room: 'F2', slot: 'deinony', u: 21, v: 112 }, { room: 'F2', slot: 'tricera', u: 90, v: 112 },
  { room: 'F2', slot: 't-rex', u: 60, v: 165 },
  // F3: its way in (a skeleton across its back, one turned by its wall), the brachiosaurus at the back, a column of
  // skeletons turned along the left wall, a row of them before it, two turned on the right wall; the aisle between
  // runs from the bug garden's door to the front
  { room: 'F3', slot: 'spino', u: 30, v: -88 }, { room: 'F3', slot: 'ankylo', u: 12, v: -38, turn: 1 },
  { room: 'F3', slot: 'brachio', u: 82, v: 12 },
  { room: 'F3', slot: 'iguanodon', u: 12, v: 30, turn: 1 }, { room: 'F3', slot: 'parasaur', u: 12, v: 110, turn: 1 }, { room: 'F3', slot: 'megacero', u: 12, v: 190, turn: 1 },
  { room: 'F3', slot: 'pachy', u: 45, v: 60 }, { room: 'F3', slot: 'plesio', u: 53.5, v: 100 }, { room: 'F3', slot: 'dimetrodon', u: 45, v: 140 },
  { room: 'F3', slot: 'ptera', u: 53.5, v: 180 }, { room: 'F3', slot: 'mammoth', u: 45, v: 220 },
  { room: 'F3', slot: 'quetzal', u: 108, v: 116, turn: -1 }, { room: 'F3', slot: 'sabertooth', u: 108, v: 200, turn: -1 }
];
const ORIGIN: Readonly<Record<string, Rect>> = { F1, F2, F3 };
const isStand = (s: Slot) => !(s in ROW) && !ON_BASE.has(s);

/** Where a fossil stands: its room, its middle (x, z) on the floor, its turn (three's yaw), on a stand (`stand`: its
 *  top's height, `w` its side) or on its own base, and its scale where it's set (the hero's). */
export interface Spot { room: RoomId; x: number; z: number; yaw: number; stand: number; w: number; s?: number }
/** Every fossil's place (a piece's own, in its skeleton's row), made once. */
export const SPOTS: ReadonlyMap<string, Spot> = (() => {
  const out = new Map<string, Spot>();
  for (const { room, slot, u, v, turn } of PLACES) {
    const r = ORIGIN[room], x = r.x0 + u, z = r.z0 + v;
    if (slot in ROW) {
      const ids = ROW[slot as SetId], l = ids.length * PIECE_W;
      ids.forEach((id, n) => {
        const d = (n + 0.5) * PIECE_W - l / 2;
        out.set(id, turn ? { room, x, z: z - turn * d, yaw: (turn * Math.PI) / 2, stand: 0, w: 0 } : { room, x: x + d, z, yaw: 0, stand: 0, w: 0 });
      });
    } else if (slot === HERO) out.set(slot, { room, x, z, yaw: 0, stand: PLINTH_H, w: PLINTH_W, s: HERO_S });
    else out.set(slot, { room, x, z, yaw: 0, stand: isStand(slot) ? STAND_H : 0, w: isStand(slot) ? STAND_W : 0 });
  }
  return out;
})();
/** The floor a fossil takes (its base's or its stand's: the walk keeps off it). */
export function footOf(id: string): Rect {
  const s = SPOTS.get(id)!;
  const [hw, hd] = s.w ? [s.w / 2, s.w / 2] : ON_BASE.has(id) ? [BASE_W / 2, BASE_D / 2] : s.yaw ? [PIECE_D / 2, PIECE_W / 2] : [PIECE_W / 2, PIECE_D / 2];
  return { x0: s.x - hw, x1: s.x + hw, z0: s.z - hd, z1: s.z + hd };
}
/** The fossils standing in a room. */
export const fossilsIn = (room: RoomId): string[] => [...SPOTS].filter(([, s]) => s.room === room).map(([id]) => id);

// ---- what's on show ----

/** One fossil on show: its id, its skeleton (null: a standalone one), its first find. */
export interface FossilOnShow { id: string; set: SetId | null; found: FirstFind }
/** A skeleton on show: its pieces found (in its row's order), whether it's complete. */
export interface Skeleton { set: SetId; pieces: string[]; complete: boolean }

/** Every fossil in the first finds (anyone's), in the game's order. */
export function fossilsOnShow(finds: ReadonlyMap<string, FirstFind>): FossilOnShow[] {
  const out: FossilOnShow[] = [];
  for (const id of STANDALONE) {
    const f = finds.get(findKey('fossil', id));
    if (f) out.push({ id, set: null, found: f });
  }
  for (const [set, ids] of Object.entries(FOSSIL_SETS) as [SetId, readonly string[]][])
    for (const id of ids) {
      const f = finds.get(findKey('fossil', id));
      if (f) out.push({ id, set, found: f });
    }
  return out;
}
/** The skeletons with any piece on show: their pieces in row order, complete when every piece is in. */
export function skeletons(shown: readonly FossilOnShow[]): Skeleton[] {
  const have = new Set(shown.map((f) => f.id));
  const out: Skeleton[] = [];
  for (const set of Object.keys(ROW) as SetId[]) {
    const pieces = ROW[set].filter((id) => have.has(id));
    if (pieces.length) out.push({ set, pieces, complete: pieces.length === ROW[set].length });
  }
  return out;
}
/** The skeleton a piece belongs to (null: a standalone fossil). */
export const setOf = (id: string): SetId | null => (Object.keys(ROW) as SetId[]).find((s) => ROW[s].includes(id)) ?? null;
