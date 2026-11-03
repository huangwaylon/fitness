// What may stand on the island (docs/island-layout.md "The layout is data"), pure: each object kind's footprint in
// tiles (w across × d deep, facing the camera; turned a quarter it is d × w), whether it blocks a walk, where it may
// stand, its drawn height (u: the 2D sprites' and the 3D models' size), its palette icon (an art key) and its names.
// The editor's palette, the validation, the nav and the 3D placement (world3d/objects.ts) all read this one table.

type Group = 'tree' | 'bush' | 'flower' | 'rock' | 'light' | 'furniture' | 'season' | 'structure' | 'building' | 'home' | 'spot';
/** Where a kind may stand: any land tile (`land`), on grass only (`grass`: a tree, a flower), over water with land at
 *  both ends (`span`: a bridge), in front of a cliff one tier up (`cliff`: stairs). */
type On = 'land' | 'grass' | 'span' | 'cliff';

export interface KindDef {
  k: string;
  group: Group;
  ja: string;
  en: string;
  /** Footprint (tiles) facing the camera. */
  w: number;
  d: number;
  /** A walk obstacle (its block box, else its footprint). */
  block: boolean;
  /** The part of its footprint that blocks (u, centred): a trunk is narrower than its tile. */
  foot?: readonly [number, number];
  on: On;
  /** Drawn height (u). */
  h: number;
  /** The palette's icon (static/art key). */
  icon: string;
  /** Its variants (`s`): a bush's species, a lantern's colour, a goal tree's owner. The first is the default. */
  variants?: readonly string[];
  /** The facing turns its footprint (a bench); else it is a look only (odd: drawn mirrored). */
  turns?: boolean;
  /** One per variant on the island, never deleted (the goal trees, the homes, the named spots); moved freely. */
  fixed?: boolean;
  /** Not on the palette (only the default places it). */
  hidden?: boolean;
  /** A villager stands in front of it to use it (NH's bulletin board): the tile(s) before its front must stay clear and
   *  reachable, as a home's door's (validate.ts), and nav.ts names the spot (`front-<id>`). */
  front?: boolean;
  /** A building one goes into at the middle of its front edge (the museum): its door's tile(s) must stay clear and
   *  reachable, as a home's (validate.ts), and nav.ts walks up to it (`door-<id>`; a tap on it snaps to its door). */
  door?: boolean;
}

const k = (def: KindDef): KindDef => def;
const TREE_FOOT = [24, 12] as const;

export const KIND_LIST: readonly KindDef[] = [
  // trees: one tile each, their trunk blocks
  k({ k: 'oak', group: 'tree', ja: 'き', en: 'Hardwood', w: 1, d: 1, block: true, foot: TREE_FOOT, on: 'grass', h: 112, icon: 'trees/oak-summer' }),
  k({ k: 'cedar', group: 'tree', ja: 'しんようじゅ', en: 'Cedar', w: 1, d: 1, block: true, foot: TREE_FOOT, on: 'grass', h: 140, icon: 'trees/cedar' }),
  k({ k: 'palm', group: 'tree', ja: 'ヤシのき', en: 'Palm', w: 1, d: 1, block: true, foot: [16, 10], on: 'land', h: 96, icon: 'trees/palm' }),
  k({ k: 'bamboo', group: 'tree', ja: 'たけ', en: 'Bamboo', w: 1, d: 1, block: true, foot: [14, 8], on: 'grass', h: 70, icon: 'trees/bamboo' }),
  k({ k: 'goal-tree', group: 'tree', ja: 'もくひょうのき', en: 'Goal tree', w: 1, d: 1, block: true, foot: [26, 12], on: 'grass', h: 120, icon: 'trees/oak-summer', variants: ['a', 'b'], fixed: true }),
  // bushes: NH's bushes (a month's pair takes turns: month-a, month-b), the hedge along the stream
  k({
    k: 'bush', group: 'bush', ja: 'かんぼく', en: 'Bush', w: 1, d: 1, block: true, foot: [32, 14], on: 'grass', h: 34, icon: 'bushes/holly',
    variants: ['holly', 'month-a', 'month-b', 'white-plumeria', 'pink-plumeria', 'white-azalea', 'pink-azalea', 'red-hibiscus', 'orange-tea-olive']
  }),
  k({ k: 'hedge', group: 'bush', ja: 'いけがき', en: 'Hedge bush', w: 1, d: 1, block: true, foot: [36, 14], on: 'grass', h: 40, icon: 'bushes/holly', variants: ['month-a', 'month-b'] }),
  // wild flowers: `c<n>` the scatter's clump n (its kind the season's), else a flower of its own
  k({ k: 'flower', group: 'flower', ja: 'はな', en: 'Flower', w: 1, d: 1, block: false, on: 'grass', h: 16, icon: 'flowers/red-tulips', variants: ['c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'c11', 'c12', 'c13', 'c14', 'c15', 'c16', 'c17'] }),
  // rocks: the one a shovel hits, the flat rock by the pond, a garden rock
  k({ k: 'rock', group: 'rock', ja: 'いわ', en: 'Rock', w: 1, d: 1, block: true, foot: [24, 10], on: 'land', h: 26, icon: 'deco/garden-rock', fixed: true }),
  k({ k: 'flat-rock', group: 'rock', ja: 'ひらたいいわ', en: 'Flat rock', w: 2, d: 1, block: true, foot: [52, 18], on: 'land', h: 12, icon: 'deco/flat-rock', turns: true }),
  k({ k: 'garden-rock', group: 'rock', ja: 'にわいし', en: 'Garden rock', w: 1, d: 1, block: true, foot: [20, 10], on: 'land', h: 20, icon: 'deco/garden-rock' }),
  // lights
  k({ k: 'streetlamp', group: 'light', ja: 'がいとう', en: 'Streetlamp', w: 1, d: 1, block: true, foot: [10, 8], on: 'land', h: 46, icon: 'deco/streetlamp' }),
  k({ k: 'garden-lantern', group: 'light', ja: 'ガーデンランタン', en: 'Garden lantern', w: 1, d: 1, block: true, foot: [12, 8], on: 'land', h: 24, icon: 'deco/garden-lantern', variants: ['plain', 'white'] }),
  // NH's outdoor furniture (the fixed decor's pieces, at one scale)
  k({ k: 'campsite-sign', group: 'furniture', ja: 'キャンプサイトのかんばん', en: 'Campsite sign', w: 1, d: 1, block: true, foot: [16, 8], on: 'land', h: 30, icon: 'deco/campsite-sign' }),
  k({ k: 'campfire', group: 'furniture', ja: 'たきび', en: 'Campfire', w: 1, d: 1, block: true, foot: [22, 12], on: 'land', h: 47, icon: 'deco/campfire' }),
  k({ k: 'log-stool', group: 'furniture', ja: 'まるたのイス', en: 'Log stool', w: 1, d: 1, block: true, foot: [12, 8], on: 'land', h: 19, icon: 'deco/log-stool' }),
  k({ k: 'park-bench', group: 'furniture', ja: 'ベンチ', en: 'Park bench', w: 2, d: 1, block: true, foot: [52, 14], on: 'land', h: 30, icon: 'deco/park-bench', turns: true }),
  k({ k: 'log-bench', group: 'furniture', ja: 'まるたのベンチ', en: 'Log bench', w: 2, d: 1, block: true, foot: [56, 16], on: 'land', h: 24, icon: 'deco/log-bench', turns: true }),
  k({ k: 'hammock', group: 'furniture', ja: 'ハンモック', en: 'Hammock', w: 2, d: 1, block: true, foot: [56, 16], on: 'land', h: 36, icon: 'deco/hammock', turns: true }),
  k({ k: 'rod-stand', group: 'furniture', ja: 'つりざおスタンド', en: 'Rod stand', w: 1, d: 1, block: true, foot: [22, 10], on: 'land', h: 30, icon: 'deco/rod-stand' }),
  k({ k: 'pump', group: 'furniture', ja: 'ポンプ', en: 'Pump', w: 1, d: 1, block: true, foot: [24, 14], on: 'land', h: 34, icon: 'deco/pump' }),
  k({ k: 'shishiodoshi', group: 'furniture', ja: 'ししおどし', en: 'Shishi-odoshi', w: 1, d: 1, block: true, foot: [26, 18], on: 'land', h: 28, icon: 'deco/shishiodoshi', turns: true }),
  k({ k: 'pullup', group: 'furniture', ja: 'てつぼう', en: 'Pull-up bar', w: 1, d: 1, block: true, foot: [28, 12], on: 'land', h: 44, icon: 'deco/pullup', turns: true }),
  k({ k: 'firewood', group: 'furniture', ja: 'まき', en: 'Firewood', w: 1, d: 1, block: true, foot: [18, 12], on: 'land', h: 18, icon: 'deco/firewood' }),
  k({ k: 'tape-deck', group: 'furniture', ja: 'ラジカセ', en: 'Tape deck', w: 1, d: 1, block: true, foot: [34, 20], on: 'land', h: 40, icon: 'deco/tape-deck', fixed: true }),
  // the decorations NH's outdoor furniture the phones put down (island/decor.ts's ten), on the layout's tiles now
  k({ k: 'stone-lantern', group: 'furniture', ja: 'いしどうろう', en: 'Stone lantern', w: 1, d: 1, block: true, foot: [24, 20], on: 'land', h: 40, icon: 'decor/stone-lantern-0', turns: true }),
  k({ k: 'birdbath', group: 'furniture', ja: 'バードバス', en: 'Birdbath', w: 1, d: 1, block: true, foot: [24, 20], on: 'land', h: 30, icon: 'decor/birdbath-0', turns: true }),
  k({ k: 'garden-wagon', group: 'furniture', ja: 'ガーデンワゴン', en: 'Garden wagon', w: 2, d: 1, block: true, foot: [58, 22], on: 'land', h: 36, icon: 'decor/garden-wagon-0', turns: true }),
  k({ k: 'iron-table', group: 'furniture', ja: 'アイアンガーデンテーブル', en: 'Iron garden table', w: 1, d: 1, block: true, foot: [24, 20], on: 'land', h: 24, icon: 'decor/iron-table-0', turns: true }),
  k({ k: 'iron-chair', group: 'furniture', ja: 'アイアンガーデンチェア', en: 'Iron garden chair', w: 1, d: 1, block: true, foot: [22, 20], on: 'land', h: 28, icon: 'decor/iron-chair-0', turns: true }),
  k({ k: 'brick-well', group: 'furniture', ja: 'レンガのいど', en: 'Brick well', w: 2, d: 2, block: true, foot: [48, 44], on: 'land', h: 48, icon: 'decor/brick-well-0', turns: true }),
  k({ k: 'tanuki', group: 'furniture', ja: 'たぬきのおきもの', en: 'Tanuki statue', w: 1, d: 1, block: true, foot: [22, 20], on: 'land', h: 36, icon: 'decor/tanuki-0', turns: true }),
  k({ k: 'monstera', group: 'furniture', ja: 'モンステラ', en: 'Monstera', w: 1, d: 1, block: true, foot: [22, 20], on: 'land', h: 40, icon: 'decor/monstera-0', turns: true }),
  k({ k: 'signpost', group: 'furniture', ja: 'みちしるべ', en: 'Signpost', w: 1, d: 1, block: true, foot: [18, 14], on: 'land', h: 42, icon: 'decor/signpost-0', turns: true }),
  k({ k: 'wheelbarrow', group: 'furniture', ja: 'いちりんしゃ', en: 'Wheelbarrow', w: 2, d: 1, block: true, foot: [40, 22], on: 'land', h: 26, icon: 'decor/wheelbarrow-0', turns: true }),
  // NH's bulletin board (けいじばん): one on the island, used from the tile in front of it
  k({ k: 'board', group: 'furniture', ja: 'けいじばん', en: 'Bulletin board', w: 2, d: 1, block: true, foot: [54, 14], on: 'land', h: 44, icon: 'deco/bulletin-board', turns: true, fixed: true, front: true }),
  // the seasonal spots (fixedDecor.ts: the season's piece stands there in its weeks)
  k({ k: 'beach-chair', group: 'season', ja: 'ビーチチェア（なつ）', en: 'Beach chair (summer)', w: 2, d: 1, block: true, foot: [56, 22], on: 'land', h: 30, icon: 'deco/beach-chair', turns: true, fixed: true }),
  k({ k: 'sandcastle', group: 'season', ja: 'すなのおしろ（なつ）', en: 'Sandcastle (summer)', w: 1, d: 1, block: true, foot: [26, 18], on: 'land', h: 30, icon: 'deco/sandcastle', fixed: true }),
  k({ k: 'snowboy', group: 'season', ja: 'ゆきだるま（ふゆ）', en: 'Snowboy (winter)', w: 1, d: 1, block: true, foot: [30, 20], on: 'land', h: 40, icon: 'deco/snowboy-0', fixed: true }),
  // structures that join terrain: a bridge over water (its deck walkable), stairs up a cliff (f 0: rising away)
  k({ k: 'bridge', group: 'structure', ja: 'はし', en: 'Bridge', w: 1, d: 3, block: false, on: 'span', h: 12, icon: 'bridges/stone-front', turns: true, variants: ['stone', 'wood', 'log', 'brick', 'red', 'iron', 'japanese', 'suspension'] }),
  // a pond to put down (the old 3D island's: its water rippling, lily pads and a lily on it, stones round its edge), on
  // the grass; its water a fresh water like the painted pond's (fish come, a line goes in); the painted pond stays too
  k({ k: 'pond', group: 'structure', ja: 'いけ', en: 'Pond', w: 3, d: 2, block: true, foot: [86, 54], on: 'grass', h: 4, icon: 'deco/pond-stone-sakura', turns: true }),
  // NH's incline: 2 tiles across, 4 up the flight (NH's own: scripts/home-models.ts --structures)
  k({ k: 'stairs', group: 'structure', ja: 'さか', en: 'Stairs', w: 2, d: 4, block: false, on: 'cliff', h: 40, icon: '', turns: true, variants: ['stone', 'brick', 'iron', 'wood', 'log', 'natural'] }),
  // the island's public buildings, one of each (NH's: 7 × 4 tiles, the door the middle of the front edge, model.ts doorOf;
  // a tap walks up to it and goes in): the museum (はくぶつかん: the ずかん's finds swim and fly in it, routes/museum) and
  // the shop (タヌキ商店, NH's Nook's Cranny: the catches sold for かいがら, furniture bought, routes/shop).
  k({ k: 'museum', group: 'building', ja: 'はくぶつかん', en: 'Museum', w: 7, d: 4, block: true, on: 'land', h: 117, icon: 'villagers/blathers-icon', turns: true, fixed: true, door: true }),
  k({ k: 'shop', group: 'building', ja: 'タヌキ商店', en: "Nook's Cranny", w: 7, d: 4, block: true, on: 'land', h: 118, icon: 'host/timmy-tommy', turns: true, fixed: true, door: true }),
  // the homes (their footprint is their style's: layout/homes.ts)
  k({ k: 'home', group: 'home', ja: 'いえ', en: 'Home', w: 3, d: 2, block: true, on: 'land', h: 80, icon: 'deco/campsite', fixed: true, turns: true, hidden: true }),
  // named spots: where a villager stands at home, centre stage (visitors), nothing drawn
  k({ k: 'spot', group: 'spot', ja: 'ばしょ', en: 'Spot', w: 1, d: 1, block: false, on: 'land', h: 0, icon: '', variants: ['villager-a', 'villager-b', 'stage'], fixed: true, hidden: true })
];

const KINDS: Readonly<Record<string, KindDef>> = Object.fromEntries(KIND_LIST.map((d) => [d.k, d]));
export const kindDef = (k: string): KindDef | undefined => KINDS[k];
/** Whether one goes into it at its door: a home, or a building of the island's (the museum, the shop). */
export const goesIn = (k: string): boolean => k === 'home' || !!KINDS[k]?.door;

/** A kind's footprint (tiles) in a facing: [across, deep]. */
export function footprintOf(def: Pick<KindDef, 'w' | 'd' | 'turns'>, f: number): [number, number] {
  return def.turns && f % 2 ? [def.d, def.w] : [def.w, def.d];
}
