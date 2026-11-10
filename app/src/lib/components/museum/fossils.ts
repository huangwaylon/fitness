// The fossil wing's exhibits (docs/design.md "The museum"), pure: NH's 73 fossils (island/fossilIds.ts) as NH's own
// models (FtrFossil*: scripts/world3d-models.ts --museum, one pack a skeleton and one for the standalone ones), each
// shown once anyone has found it (the ずかん's first finds: NH's donation), in NH's three rooms' order:
//   the front row     NH's room 1, early life: the standalone ones on stands along the front wall
//   six rows          NH's room 2, the dinosaurs (and room 2's standalone finds), then room 3, the mammals and the
//                     australopith, each row in two halves either side of a middle aisle
// A skeleton's pieces stand in a row along +x on its platform, NH's way: each piece is a 2 × 2 base with its bones, and
// the pieces in their order join into the whole animal (the skull at −x; a pterosaur's wings either side of its body).
// A piece not found yet leaves its place empty; once every piece is in, the skeleton is complete (its card says so).
import { FOSSIL_SETS, STANDALONE } from '../island/fossilIds.ts';
import { findKey, type FirstFind } from '#lib/model/finds.ts';
import { FOSSIL_WING, type Rect } from './plan.ts';

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
/** A piece's base: 2 × 2 tiles (model units: NH's own bounds, a little under 20 deep). */
export const PIECE_W = 20;
const PIECE_D = 18.4;
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

// ---- where everything stands (the fossils' room: plan.ts FOSSIL_WING, its passage at its front right) ----

const X0 = FOSSIL_WING.x0 + 4, X1 = FOSSIL_WING.x1 - 4;
/** The middle aisle (x) between each row's halves, its half width. */
const AISLE_X = (X0 + X1) / 2, AISLE_HALF = 12;
/** The rows' depths (z of each row's middle), front to back. */
const ROW_Z = [-150, -190, -230, -270, -310, -350] as const;
/** The front row's (NH's room 1) depth. */
const FRONT_Z = -114;
const GAP = 12;
type Slot = SetId | Standalone;
/** Each row's halves, [the left half (−x), the right half (+x, by the passage)], each a run of skeletons and stands. */
const HALVES: readonly (readonly [readonly Slot[], readonly Slot[]])[] = [
  [['diplo'], ['t-rex', 'tricera']],
  [['brachio', 'pachy'], ['stego', 'ankylo']],
  [['iguanodon', 'parasaur'], ['spino', 'plesio']],
  [['dimetrodon', 'ophthalmo'], ['ptera', 'quetzal']],
  [['dinosaur-track', 'coprolite', 'juramaia', 'archaeopteryx'], ['archelon', 'deinony']],
  [['megacero', 'megalo'], ['mammoth', 'sabertooth', 'australopith']]
];
/** The front row (NH's room 1), from the passage leftward. */
const FRONT: readonly Standalone[] = ['trilobite', 'ammonite', 'anomalocaris', 'myllokunmingia', 'shark-tooth-pattern', 'amber', 'eusthenopteron', 'acanthostega', 'dunkleosteus'];

/** How wide a slot stands along its row. */
const widthOf = (s: Slot): number => (s in ROW ? ROW[s as SetId].length * PIECE_W : ON_BASE.has(s) ? PIECE_W : STAND_W);

/** Where a fossil stands: its middle (x, z) on the floor, on a stand (`stand`: its top's height) or on its own base. */
export interface Spot { x: number; z: number; stand: number }
/** Every fossil's place (a piece's own, in its skeleton's row), made once. */
export const SPOTS: ReadonlyMap<string, Spot> = (() => {
  const out = new Map<string, Spot>();
  const lay = (slots: readonly Slot[], z: number, from: number, dir: 1 | -1) => {
    let x = from;
    for (const s of dir > 0 ? slots : [...slots].reverse()) {
      const w = widthOf(s), x0 = dir > 0 ? x : x - w;
      if (s in ROW) ROW[s as SetId].forEach((id, k) => out.set(id, { x: x0 + (k + 0.5) * PIECE_W, z, stand: 0 }));
      else out.set(s, { x: x0 + w / 2, z, stand: ON_BASE.has(s) ? 0 : STAND_H });
      x = dir > 0 ? x + w + GAP : x - w - GAP;
    }
  };
  HALVES.forEach(([left, right], r) => {
    lay(left, ROW_Z[r], AISLE_X - AISLE_HALF, -1);
    lay(right, ROW_Z[r], AISLE_X + AISLE_HALF, 1);
  });
  // (the front row from the passage's side wall leftward, a stand's width apart)
  let x = -70;
  for (const id of FRONT) {
    const w = widthOf(id);
    out.set(id, { x: x - w / 2, z: FRONT_Z, stand: ON_BASE.has(id) ? 0 : STAND_H });
    x -= w + 12;
  }
  return out;
})();
/** The floor a fossil takes (its base's or its stand's: the walk keeps off it). */
export function footOf(id: string): Rect {
  const s = SPOTS.get(id)!;
  const [hw, hd] = s.stand ? [STAND_W / 2, STAND_W / 2] : [PIECE_W / 2, PIECE_D / 2];
  return { x0: s.x - hw, x1: s.x + hw, z0: s.z - hd, z1: s.z + hd };
}

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
