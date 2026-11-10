// The garden's kinds (docs/island-layout.md "Fences and the garden"), pure: NH's fences, crops, garden flowers and
// vines, their names (NH's official ones, the editor's kanji), the NH model folder each is converted from
// (scripts/world3d-assets.ts GARDEN), how a fence joins its neighbours and how far a crop has grown. Their models are
// lazy (world3d/garden.ts): an island with none never loads them.
import { dayNum, localDateAt } from '#lib/contract/tokyo.ts';
import type { Layout, Obj } from './model.ts';

/** NH's fences: [id (kind `fence-<id>`), its name, NH's English name, its model folder, its icon (NH's item)]. Every
 *  fence item of NH 2.0 (30). Not here: FenceIkegakiSnow (the hedge's winter look: `snow`), FenceShareTexture (a
 *  texture, no model), FenceGardenPegRope (no item: a rope hung below its posts' origin, with no T or cross piece). */
export const FENCES: readonly (readonly [id: string, ja: string, en: string, model: string, icon: string])[] = [
  ['bamboo-lattice', '竹垣', 'Bamboo lattice fence', 'FenceBamboo', 'ItemFenceBamboo'],
  ['bamboo-slats', 'すだれの柵', 'Bamboo-slats fence', 'FenceSandProtection', 'ItemFenceSandProtection'],
  ['barbed-wire', '有刺鉄線', 'Barbed-wire fence', 'FenceBarbedWire', 'ItemFenceBarbedWire'],
  ['block', 'ブロック塀', 'Block fence', 'FenceConcreteBlock', 'ItemFenceConcreteBlock'],
  ['brick', 'レンガの壁', 'Brick fence', 'FenceWallRenga', 'ItemFenceWallRenga'],
  ['bunny-day', 'イースターな柵', 'Bunny Day fence', 'FenceEasterEgg', 'ItemFenceEgg'],
  ['corral', '横板の柵', 'Corral fence', 'FenceHorizontalWood', 'ItemFenceHorizontalWood'],
  ['corrugated-iron', 'トタンの柵', 'Corrugated iron fence', 'FenceCorrugatedIron', 'ItemFenceCorrugatedIron_Remake_0_0'],
  ['country', '丸太の柵', 'Country fence', 'FenceLog', 'ItemFenceLog'],
  ['frozen', '氷の柵', 'Frozen fence', 'FenceIce', 'ItemFenceIce_Remake_0_0'],
  ['green-bamboo', '青竹の柵', 'Green bamboo fence', 'FenceCrossedBamboo', 'ItemFenceCrossedBamboo'],
  ['hedge', '生け垣（フェンス）', 'Hedge', 'FenceIkegaki', 'ItemFenceIkegaki'],
  ['imperial', 'オリエンタルな柵', 'Imperial fence', 'FenceChinese', 'ItemFenceChinese'],
  ['iron', '鉄の柵', 'Iron fence', 'FenceSteel', 'ItemFenceSteel_Remake_0_0'],
  ['iron-and-stone', '洋風の柵', 'Iron-and-stone fence', 'FenceIronAndStone', 'ItemFenceIronAndStone'],
  ['large-lattice', '大きなラティス', 'Large lattice fence', 'FenceLatticeBig', 'ItemFenceLatticeBig_Remake_0_0'],
  ['lattice', 'ラティス', 'Lattice fence', 'FenceLattice', 'ItemFenceLatiiceNatural_Remake_0_0'],
  ['log', '横向きの丸太の柵', 'Log fence', 'FenceHorizontalLog', 'ItemFenceHorizontalLog'],
  ['log-wall', '丸太壁の柵', 'Log-wall fence', 'FenceLogWall', 'ItemFenceLogWall'],
  ['mermaid', 'マーメイドな柵', 'Mermaid fence', 'FenceMermaid', 'ItemFenceMermaid'],
  ['park', '公園の柵', 'Park fence', 'FencePark', 'ItemFencePark_Remake_0_0'],
  ['rope', 'ペグとロープ', 'Rope fence', 'FencePegRope', 'ItemFencePegRope'],
  ['simple-wooden', '素朴な木製の柵', 'Simple wooden fence', 'FenceWoodWhite', 'ItemFenceNatural_Remake_0_0'],
  ['spiky', 'トゲトゲの柵', 'Spiky fence', 'FenceSharply', 'ItemFenceSharply'],
  ['spooky', 'ハロウィンな柵', 'Spooky fence', 'FenceHalloween', 'ItemFenceHalloween'],
  ['stone', '石壁', 'Stone fence', 'FenceStone', 'ItemFenceStone'],
  ['straw', 'わら干しの柵', 'Straw fence', 'FenceDriedStraw', 'ItemFenceDriedStraw'],
  ['vertical-board', '縦板の柵', 'Vertical-board fence', 'FenceVerticalWood', 'ItemFenceVerticalWood_Remake_0_0'],
  ['wedding', 'ウェディングな柵', 'Wedding fence', 'FenceJuneBride', 'ItemFenceJuneBride_Remake_0_0'],
  ['zen', '和風の柵', 'Zen fence', 'FenceJapanese', 'ItemFenceJapanese_Remake_0_0']
];
/** The fence with a winter look of its own (NH's snowy hedge). */
export const FENCE_SNOW: Readonly<Record<string, string>> = { hedge: 'FenceIkegakiSnow' };

export const isFence = (k: string): boolean => k.startsWith('fence-');

// ---- joining ------------------------------------------------------------------------------------------------------

/** NH's fence pieces (a fence folder's `<Fence>_<A…I>.dae`) as the models name them: `a` alone, `b` an end, `c` a
 *  straight, `d` a corner, `g` a T, `h` a cross. (NH's `i`, `e` and `f`, a lone piece with a stub and two corners with a
 *  capped arm, have no neighbourhood of their own on a grid of four neighbours: not used.) */
export type FencePart = 'a' | 'b' | 'c' | 'd' | 'g' | 'h';
export const FENCE_PARTS: readonly FencePart[] = ['a', 'b', 'c', 'd', 'g', 'h'];

/** The four neighbours, in turn order (a quarter turn takes each to the next): east (+x), north (+z, away from the
 *  camera), west, south. */
const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]] as const;

/** Which neighbours a piece joins (bits E 1, N 2, W 4, S 8) → its piece and its quarter turns (three's yaw k·π/2: a
 *  turn takes the model's +x, east, to north). The models at no turn: `a` across (E–W, no arm), `b` its arm west, `c`
 *  east and west, `d` east and north, `g` east, west and south, `h` all four. */
export function fencePiece(mask: number, f = 0): { part: FencePart; turns: number } {
  const arms = [0, 1, 2, 3].filter((d) => mask & (1 << d));
  switch (arms.length) {
    case 0:
      return { part: 'a', turns: f % 2 };
    case 1:
      return { part: 'b', turns: (arms[0] + 2) % 4 };
    case 2:
      if ((arms[1] - arms[0]) % 2 === 0) return { part: 'c', turns: arms[0] % 2 };
      return { part: 'd', turns: arms[1] - arms[0] === 1 ? arms[0] : 3 };
    case 3: {
      const missing = [0, 1, 2, 3].find((d) => !(mask & (1 << d)))!;
      return { part: 'g', turns: (missing + 3) % 4 };
    }
    default:
      return { part: 'h', turns: 0 };
  }
}

/** Each layout's fences by tile (`c,r` → the object), built once a layout. */
const byTile = new WeakMap<Layout, Map<string, Obj>>();
function fencesOf(layout: Layout): Map<string, Obj> {
  let m = byTile.get(layout);
  if (!m) {
    m = new Map();
    for (const o of layout.objects.values()) if (isFence(o.k)) m.set(`${o.x},${o.z}`, o);
    byTile.set(layout, m);
  }
  return m;
}

/** A fence's neighbours it joins (NH's way: a fence of the same kind on the tile beside it, east, north, west or south,
 *  on the same tier; never across a cliff, never another kind, never a diagonal): the mask fencePiece takes. */
export function fenceMask(layout: Layout, o: Obj): number {
  const all = fencesOf(layout), tier = layout.tier(o.x, o.z);
  let mask = 0;
  DIRS.forEach(([dx, dz], d) => {
    const n = all.get(`${o.x + dx},${o.z + dz}`);
    if (n && n.k === o.k && layout.tier(n.x, n.z) === tier) mask |= 1 << d;
  });
  return mask;
}

/** A fence's piece and turn on its layout. */
export const fenceJoin = (layout: Layout, o: Obj): { part: FencePart; turns: number } => fencePiece(fenceMask(layout, o), o.f);

// ---- crops --------------------------------------------------------------------------------------------------------

/** NH's crops: [id (kind `crop-<id>`), its name, NH's English name, its model folder (`PltVgt<…>`), its icon (NH's
 *  gardening icon of the ripe plant)], each with NH's growth stages (0–2, then ripe, Lv1–3: the plant fills out). The pumpkin's colour is
 *  its variant (NH's four: the ripe pumpkins' gradient rows). */
export const CROPS: readonly (readonly [id: string, ja: string, en: string, model: string, icon: string])[] = [
  ['tomato', 'トマト', 'Tomato', 'Tomato', 'PltTomato3'],
  ['wheat', 'コムギ', 'Wheat', 'Wheat', 'PltWheat3'],
  ['sugarcane', 'サトウキビ', 'Sugarcane', 'Sugarcane', 'PltSugarCane3'],
  ['potato', 'ジャガイモ', 'Potato', 'Potato', 'PltPotato3'],
  ['carrot', 'ニンジン', 'Carrot', 'Carrot', 'PltCarrot3'],
  ['pumpkin', 'カボチャ', 'Pumpkin', 'Pumpkin', 'PltSquashOrange3']
];
export const PUMPKINS = ['orange', 'yellow', 'green', 'white'] as const;
/** The stages drawn: NH's 0, 1, 2 and the ripe plant's Lv1, Lv2, Lv3 (stage 3, 4, 5). */
export const CROP_STAGES = 6;

export const isCrop = (k: string): boolean => k.startsWith('crop-');

/** When a piece was put down (ms), from its id (layout/model.ts newObjId: `o` + the time, base 36, + 3 random), or
 *  null for one that isn't the editor's (the default's). */
export function plantedAt(id: string): number | null {
  if (!/^o[0-9a-z]{4,}$/.test(id)) return null;
  const t = parseInt(id.slice(1, -3), 36);
  return Number.isFinite(t) && t > 0 ? t : null;
}

/** A crop's stage on a day (Tokyo's `YYYY-MM-DD`): planted that day a sprout (0), a stage each day after, ripe on the
 *  third (3) and fuller on the fourth and fifth (4, 5). No watering needed (NH's crops grow unwatered too); every phone
 *  agrees (the date and the piece's own id). One that isn't the editor's, or with no day given, is grown. */
export function cropStage(id: string, date?: string): number {
  const at = plantedAt(id);
  if (at === null || !date) return CROP_STAGES - 1;
  return Math.max(0, Math.min(CROP_STAGES - 1, dayNum(date) - dayNum(localDateAt(at))));
}

// ---- the garden's flowers -----------------------------------------------------------------------------------------

/** NH's flowers and plants the wild clumps don't grow: [kind, its name, NH's English name, its model folder and .dae,
 *  its icon]. Always as placed (no season, no watering: NH's gold rose is itself a hybrid, and these give none). */
export const PLANTS: readonly (readonly [k: string, ja: string, en: string, model: string, dae: string, icon: string])[] = [
  ['gold-roses', '金のバラ', 'Gold roses', 'PltFlwRoseGold', 'PltFlwRoseGold2', 'PltRoseGold3'],
  ['lily-of-the-valley', 'スズラン', 'Lily of the valley', 'PltFlwLily', 'PltFlwLily', 'PltSuzuran2'],
  ['vine', 'ツル', 'Vine', 'PltVine', 'PltVineA', 'PltVine']
];
/** A vine's three looks (NH's PltVineA, B, C: its variant). */
export const VINES = ['a', 'b', 'c'] as const;

/** The editor's icons of the garden's kinds, NH's own (`Layout_<name>`: a fence's item icon, a plant's gardening
 *  icon), in the order of their sheet (static/room/editor/garden-icons.webp: scripts/garden-icons.ts, ICON_PX a cell,
 *  ICON_COLS across); a kind's catalog icon is `garden:<name>`. */
export const GARDEN_ICONS: readonly string[] = [...FENCES.map((f) => `FtrIcon_${f[4]}`), ...CROPS.map((c) => `GardeningIcon_${c[4]}`), ...PLANTS.map((p) => `GardeningIcon_${p[5]}`)];
export const ICON_PX = 64, ICON_COLS = 8;

/** Drawn from the garden's lazy models (world3d/garden.ts): the fences, the crops, the garden flowers. */
export const isGarden = (k: string): boolean => isFence(k) || isCrop(k) || PLANTS.some((p) => p[0] === k);
