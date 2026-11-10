// The art gallery's exhibits (docs/design.md "The museum"), pure: NH's 43 genuine artworks (30 paintings, 13
// statues; never a forgery) as NH's own models (FtrArt*, FtrSculpture*: scripts/world3d-models.ts --museum, a few packs),
// each shown once anyone has had it (a find of kind `item`, its id one of these: a balloon's present holds one now and
// then, island/catalog.ts pickPresent). Paintings hang on the gallery's walls and its panels, facing the room; the
// statues stand on plinths between, roped off; the wild painting's two halves stand side by side, as a folding screen.
import { findKey, type FirstFind } from '#lib/model/finds.ts';
import { ART_WING, type Rect } from './plan.ts';
import M from './models.json' with { type: 'json' };

import { ART, artwork, type Artwork } from './artIds.ts';
export { ART, ART_IDS, isArt } from './artIds.ts';

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

// ---- where each hangs or stands (the gallery: plan.ts ART_WING, its passage at its front left) ----

const MODELS = M.models as Record<string, { min: number[]; max: number[] } | undefined>;
/** Paintings drawn this much over NH's size (NH's gallery hangs them big), their middles at a villager's eye and a half. */
const PAINTING_S = 1.8;
const HANG_Y = 22;
/** The panels (free-standing walls, their paintings on the side toward the room's front): their rows (z of their
 *  middle line), their x spans, height and thickness. */
export const PANEL_Z = [-215, -285] as const;
export const PANEL_X: readonly (readonly [number, number])[] = [[18, 128], [172, 282]];
export const PANEL_H = 34, PANEL_T = 3;
/** The statues' rows (z), the screens' place (in front of the back wall's middle). */
const STATUE_Z = [-128, -172] as const;
const SCREEN: readonly [number, number] = [150, -362];
/** A wall's face (half the wall's thickness, plan.ts) and a painting's gap to it. */
const FACE = 1.5 + 0.3;

/** Where an artwork is shown: its middle (x, z) and its height (`y`: a painting's middle, else its foot on its plinth),
 *  its turn (three's yaw: 0 faces +z), its scale, its plinth's side and height (0: none). */
export interface ArtSpot { x: number; y: number; z: number; yaw: number; s: number; plinth: number; plinthH: number }
/** Each painting's wall, in order along it: the back wall's two halves either side of the screens, the divider and the
 *  far wall (three each, side on), each panel's front. */
const WALLS: readonly { ids: readonly string[]; at: (u: number) => [number, number]; yaw: number; from: number; to: number }[] = [
  { ids: ['amazing-painting', 'calm-painting', 'moving-painting'], at: (u) => [u, ART_WING.z0 + FACE], yaw: 0, from: 6, to: 124 },
  { ids: ['warm-painting', 'worthy-painting', 'solemn-painting'], at: (u) => [u, ART_WING.z0 + FACE], yaw: 0, from: 176, to: 294 },
  { ids: ['scenic-painting', 'mysterious-painting', 'proper-painting'], at: (u) => [ART_WING.x0 + FACE, u], yaw: Math.PI / 2, from: -340, to: -120 },
  { ids: ['basic-painting', 'nice-painting', 'detailed-painting'], at: (u) => [ART_WING.x1 - FACE, u], yaw: -Math.PI / 2, from: -340, to: -120 },
  ...PANEL_Z.flatMap((z, r) => PANEL_X.map(([from, to], k) => ({
    ids: [
      [['famous-painting', 'wistful-painting', 'twinkling-painting', 'flowery-painting'], ['dynamic-painting', 'academic-painting', 'glowing-painting', 'perfect-painting']],
      [['common-painting', 'moody-painting', 'quaint-painting', 'sinking-painting'], ['graceful-painting', 'scary-painting', 'jolly-painting', 'serene-painting']]
    ][r][k],
    at: (u: number): [number, number] => [u, z + PANEL_T / 2 + 0.3], yaw: 0, from, to
  })))
];
/** The statues, each row's from left to right ([id, x]): the gallant statue in the middle of the front row. */
const STATUES: readonly (readonly [string, number])[][] = [
  [['informative-statue', 84], ['mystic-statue', 117], ['gallant-statue', 150], ['ancient-statue', 183], ['beautiful-statue', 216], ['familiar-statue', 252], ['warrior-statue', 284]],
  [['great-statue', 30], ['valiant-statue', 66], ['rock-head-statue', 102], ['motherly-statue', 198], ['tremendous-statue', 234], ['robust-statue', 270]]
];
const size = (id: string): [number, number, number] => {
  const b = MODELS[id];
  return b ? [b.max[0] - b.min[0], b.max[1] - Math.max(0, b.min[1]), b.max[2] - b.min[2]] : [8, 8, 8];
};
export const ART_SPOTS: ReadonlyMap<string, ArtSpot> = (() => {
  const out = new Map<string, ArtSpot>();
  for (const w of WALLS) {
    // spread along the wall: equal gaps between the paintings and at the ends
    const widths = w.ids.map((id) => size(id)[0] * PAINTING_S), gap = (w.to - w.from - widths.reduce((a, b) => a + b, 0)) / (w.ids.length + 1);
    let u = w.from + gap;
    w.ids.forEach((id, k) => {
      const [x, z] = w.at(u + widths[k] / 2);
      out.set(id, { x, y: HANG_Y, z, yaw: w.yaw, s: PAINTING_S, plinth: 0, plinthH: 0 });
      u += widths[k] + gap;
    });
  }
  STATUES.forEach((row, r) => {
    for (const [id, x] of row) {
      const [w, h, d] = size(id), bust = artwork(id)?.kind === 'bust', s = Math.max(1, Math.min(1.5, 24 / h));
      const plinthH = bust ? 12 : 4;
      out.set(id, { x, y: plinthH, z: STATUE_Z[r], yaw: 0, s, plinth: Math.max(w, d) * s + 4, plinthH });
    }
  });
  // the wild painting's halves side by side (the left half at −x), on a low dais
  for (const [id, k] of [['wild-painting-left-half', -1], ['wild-painting-right-half', 1]] as const) {
    const w = size(id)[0] * PAINTING_S;
    out.set(id, { x: SCREEN[0] + (k * w) / 2, y: 1, z: SCREEN[1], yaw: 0, s: PAINTING_S, plinth: 0, plinthH: 0 });
  }
  return out;
})();
/** The screens' dais (both halves on it). */
export const DAIS: Rect & { h: number } = { x0: SCREEN[0] - 28, x1: SCREEN[0] + 28, z0: SCREEN[1] - 6, z1: SCREEN[1] + 6, h: 1 };
/** The floor an artwork's plinth takes (null: one on a wall or the dais). */
export function plinthOf(id: string): Rect | null {
  const sp = ART_SPOTS.get(id);
  if (!sp?.plinth) return null;
  const h = sp.plinth / 2;
  return { x0: sp.x - h, x1: sp.x + h, z0: sp.z - h, z1: sp.z + h };
}
