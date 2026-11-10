// The fossil rooms' exhibits (docs/design.md "The museum"), pure: NH's 73 fossils (island/fossilIds.ts) as NH's own
// models (FtrFossil*: scripts/world3d-models.ts --museum, one pack a skeleton and one for the standalone ones), each
// shown once anyone has found it (the ずかん's first finds: NH's donation), in three rooms in a line (below: FOSSIL_ROWS).
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
export const STAND_W = 11;
const STAND_H = 7;
const ON_BASE: ReadonlySet<string> = new Set(['dunkleosteus']);

/** The pack a fossil's model is in (scripts/world3d-models.ts, models.json `pack`): a skeleton's own, or the
 *  standalone ones'. Fetched whole, and only once one of its fossils is on show. */
export const packOf = (id: string): string => {
  for (const [set, ids] of Object.entries(FOSSIL_SETS)) if ((ids as readonly string[]).includes(id)) return `fossil-${set}`;
  return 'fossils';
};

// ---- where everything stands (the fossil rooms: plan.ts F1, F2, F3, in a line from the hall's back-left arch) ----
//   F1   NH's room 1, early life: seven standalone ones in a row of cases on the back wall, three islands in front
//   F2   the big skeletons: the diplodocus along the back wall, the T. rex alone on a carpeted island in the middle
//        (the room's hero, framed from F1's door), two islands of two either side of it, front and back
//   F3   the rest: a small skeleton either side of the door in the back wall, five islands down the middle
// Every row's exhibits face +z (the camera looks along −z: a skeleton's side profile, a stand's front); islands leave
// side aisles of 2 tiles, rows 2 tiles apart, a 3-tile band clear inside each doorway.

/** A run's slots a little apart: a skeleton from anything (or the wall), a stand from a stand. */
const GAP = 10, STAND_GAP = 5;
type Slot = SetId | Standalone;
/** A row: its room, its depth (z of its middle, from the room's back wall), its slots (left to right) and where it
 *  stands across the room (in the middle, or against a side wall with its aisle on the other side). */
interface Row { room: RoomId; z: number; slots: readonly Slot[]; at?: 'mid' | 'left' | 'right' }
const BACK_Z = 12;
const FOSSIL_ROWS: readonly Row[] = [
  { room: 'F1', z: BACK_Z, slots: ['trilobite', 'ammonite', 'anomalocaris', 'myllokunmingia', 'amber', 'shark-tooth-pattern', 'coprolite'] },
  { room: 'F1', z: 48, slots: ['eusthenopteron', 'acanthostega', 'dinosaur-track', 'juramaia', 'archaeopteryx'] },
  { room: 'F1', z: 84, slots: ['dunkleosteus', 'ophthalmo'] },
  { room: 'F1', z: 122, slots: ['australopith', 'archelon'] },
  { room: 'F2', z: BACK_Z, slots: ['diplo', 'deinony'] },
  { room: 'F2', z: 48, slots: ['brachio', 'megalo'] },
  { room: 'F2', z: 84, slots: ['tricera', 'stego'] },
  { room: 'F2', z: 130, slots: ['t-rex'] },
  { room: 'F2', z: 176, slots: ['ankylo', 'spino'] },
  { room: 'F2', z: 212, slots: ['iguanodon', 'parasaur'] },
  { room: 'F3', z: BACK_Z, slots: ['pachy'], at: 'left' },
  { room: 'F3', z: BACK_Z, slots: ['dimetrodon'], at: 'right' },
  { room: 'F3', z: 48, slots: ['ptera'] },
  { room: 'F3', z: 84, slots: ['plesio'] },
  { room: 'F3', z: 120, slots: ['megacero'] },
  { room: 'F3', z: 156, slots: ['quetzal'] },
  { room: 'F3', z: 192, slots: ['mammoth', 'sabertooth'] }
];
/** A row's island's margin to a side wall it stands against. */
const WALL_M = 4;
const ROOM_RECT: Readonly<Record<string, Rect>> = { F1, F2, F3 };

/** How wide a slot stands along its row. */
const widthOf = (s: Slot): number => (s in ROW ? ROW[s as SetId].length * PIECE_W : ON_BASE.has(s) ? BASE_W : STAND_W);
const isStand = (s: Slot) => !(s in ROW) && !ON_BASE.has(s);

/** Where a fossil stands: its room, its middle (x, z) on the floor, on a stand (`stand`: its top's height) or on its
 *  own base. */
export interface Spot { room: RoomId; x: number; z: number; stand: number }
/** Every fossil's place (a piece's own, in its skeleton's row), made once. */
export const SPOTS: ReadonlyMap<string, Spot> = (() => {
  const out = new Map<string, Spot>();
  for (const row of FOSSIL_ROWS) {
    const r = ROOM_RECT[row.room], z = r.z0 + row.z;
    const gaps = row.slots.slice(1).map((s, k) => (isStand(s) && isStand(row.slots[k]) ? STAND_GAP : GAP));
    const w = row.slots.reduce((a, s) => a + widthOf(s), 0) + gaps.reduce((a, g) => a + g, 0);
    let x = row.at === 'left' ? r.x0 + WALL_M : row.at === 'right' ? r.x1 - WALL_M - w : (r.x0 + r.x1) / 2 - w / 2;
    row.slots.forEach((s, k) => {
      if (s in ROW) ROW[s as SetId].forEach((id, n) => out.set(id, { room: row.room, x: x + (n + 0.5) * PIECE_W, z, stand: 0 }));
      else out.set(s, { room: row.room, x: x + widthOf(s) / 2, z, stand: ON_BASE.has(s) ? 0 : STAND_H });
      x += widthOf(s) + (gaps[k] ?? 0);
    });
  }
  return out;
})();
/** The floor a fossil takes (its base's or its stand's: the walk keeps off it). */
export function footOf(id: string): Rect {
  const s = SPOTS.get(id)!;
  const [hw, hd] = s.stand ? [STAND_W / 2, STAND_W / 2] : ON_BASE.has(id) ? [BASE_W / 2, BASE_D / 2] : [PIECE_W / 2, PIECE_D / 2];
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
