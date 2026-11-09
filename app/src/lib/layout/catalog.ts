// What may stand on the island (docs/island-layout.md "The layout is data"), pure: each object kind's footprint in
// tiles (w across × d deep, facing the camera; turned a quarter it is d × w), whether it blocks a walk, where it may
// stand, its drawn height (u: the 2D sprites' and the 3D models' size), its palette icon (an art key) and its names.
// The editor's palette, the validation, the nav and the 3D placement (world3d/objects.ts) all read this one table.

type Group = 'tree' | 'bush' | 'flower' | 'rock' | 'light' | 'furniture' | 'camp' | 'food' | 'gym' | 'season' | 'structure' | 'building' | 'home' | 'spot' | 'visitor';
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
  /** One on the island at most, but it may be taken away: placing another moves the one there (the visitors' spots). */
  one?: boolean;
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
  k({ k: 'oak', group: 'tree', ja: '木', en: 'Hardwood', w: 1, d: 1, block: true, foot: TREE_FOOT, on: 'grass', h: 112, icon: 'trees/oak-summer' }),
  k({ k: 'cedar', group: 'tree', ja: '針葉樹', en: 'Cedar', w: 1, d: 1, block: true, foot: TREE_FOOT, on: 'grass', h: 140, icon: 'trees/cedar' }),
  k({ k: 'palm', group: 'tree', ja: 'ヤシの木', en: 'Palm', w: 1, d: 1, block: true, foot: [16, 10], on: 'land', h: 96, icon: 'trees/palm' }),
  k({ k: 'bamboo', group: 'tree', ja: '竹', en: 'Bamboo', w: 1, d: 1, block: true, foot: [14, 8], on: 'grass', h: 70, icon: 'trees/bamboo' }),
  k({ k: 'goal-tree', group: 'tree', ja: '目標の木', en: 'Goal tree', w: 1, d: 1, block: true, foot: [26, 12], on: 'grass', h: 120, icon: 'trees/oak-summer', variants: ['a', 'b'], fixed: true }),
  // bushes: NH's bushes (a month's pair takes turns: month-a, month-b), the hedge along the stream
  k({
    k: 'bush', group: 'bush', ja: '低木', en: 'Bush', w: 1, d: 1, block: true, foot: [32, 14], on: 'grass', h: 34, icon: 'bushes/holly',
    variants: ['holly', 'month-a', 'month-b', 'white-plumeria', 'pink-plumeria', 'white-azalea', 'pink-azalea', 'red-hibiscus', 'orange-tea-olive']
  }),
  k({ k: 'hedge', group: 'bush', ja: '生け垣', en: 'Hedge bush', w: 1, d: 1, block: true, foot: [36, 14], on: 'grass', h: 40, icon: 'bushes/holly', variants: ['month-a', 'month-b'] }),
  // wild flowers: `c<n>` the scatter's clump n (its kind the season's), else a flower of its own
  k({ k: 'flower', group: 'flower', ja: '花', en: 'Flower', w: 1, d: 1, block: false, on: 'grass', h: 16, icon: 'flowers/red-tulips', variants: ['c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'c11', 'c12', 'c13', 'c14', 'c15', 'c16', 'c17'] }),
  // rocks: the one a shovel hits, the flat rock by the pond, a garden rock
  k({ k: 'rock', group: 'rock', ja: '岩', en: 'Rock', w: 1, d: 1, block: true, foot: [24, 10], on: 'land', h: 26, icon: 'deco/garden-rock', fixed: true }),
  k({ k: 'flat-rock', group: 'rock', ja: '平たい岩', en: 'Flat rock', w: 2, d: 1, block: true, foot: [52, 18], on: 'land', h: 12, icon: 'deco/flat-rock', turns: true }),
  k({ k: 'garden-rock', group: 'rock', ja: '庭石', en: 'Garden rock', w: 1, d: 1, block: true, foot: [20, 10], on: 'land', h: 20, icon: 'deco/garden-rock' }),
  // lights
  k({ k: 'streetlamp', group: 'light', ja: '街灯', en: 'Streetlamp', w: 1, d: 1, block: true, foot: [10, 8], on: 'land', h: 46, icon: 'deco/streetlamp' }),
  k({ k: 'garden-lantern', group: 'light', ja: 'ガーデンランタン', en: 'Garden lantern', w: 1, d: 1, block: true, foot: [12, 8], on: 'land', h: 24, icon: 'deco/garden-lantern', variants: ['plain', 'white'] }),
  // NH's outdoor furniture (the fixed decor's pieces, at one scale)
  k({ k: 'campsite-sign', group: 'camp', ja: 'キャンプサイトの看板', en: 'Campsite sign', w: 1, d: 1, block: true, foot: [16, 8], on: 'land', h: 30, icon: 'deco/campsite-sign' }),
  k({ k: 'campfire', group: 'camp', ja: 'キャンプファイア', en: 'Bonfire', w: 1, d: 1, block: true, foot: [22, 12], on: 'land', h: 47, icon: 'deco/campfire' }),
  k({ k: 'log-stool', group: 'camp', ja: 'まるたのイス', en: 'Log stool', w: 1, d: 1, block: true, foot: [12, 8], on: 'land', h: 19, icon: 'deco/log-stool' }),
  k({ k: 'park-bench', group: 'furniture', ja: 'ベンチ', en: 'Park bench', w: 2, d: 1, block: true, foot: [52, 14], on: 'land', h: 30, icon: 'deco/park-bench', turns: true }),
  k({ k: 'log-bench', group: 'camp', ja: 'まるたのベンチ', en: 'Log bench', w: 2, d: 1, block: true, foot: [56, 16], on: 'land', h: 24, icon: 'deco/log-bench', turns: true }),
  k({ k: 'hammock', group: 'camp', ja: 'ハンモック', en: 'Hammock', w: 2, d: 1, block: true, foot: [56, 16], on: 'land', h: 36, icon: 'deco/hammock', turns: true }),
  k({ k: 'rod-stand', group: 'camp', ja: 'ロッドスタンド', en: 'Rod stand', w: 1, d: 1, block: true, foot: [22, 10], on: 'land', h: 30, icon: 'deco/rod-stand' }),
  k({ k: 'pump', group: 'furniture', ja: 'ポンプ', en: 'Pump', w: 1, d: 1, block: true, foot: [24, 14], on: 'land', h: 34, icon: 'deco/pump' }),
  k({ k: 'shishiodoshi', group: 'furniture', ja: 'ししおどし', en: 'Shishi-odoshi', w: 1, d: 1, block: true, foot: [26, 18], on: 'land', h: 28, icon: 'deco/shishiodoshi', turns: true }),
  k({ k: 'firewood', group: 'camp', ja: 'まき', en: 'Firewood', w: 1, d: 1, block: true, foot: [18, 12], on: 'land', h: 18, icon: 'deco/firewood' }),
  k({ k: 'tape-deck', group: 'furniture', ja: 'ラジカセ', en: 'Tape deck', w: 1, d: 1, block: true, foot: [34, 20], on: 'land', h: 40, icon: 'deco/tape-deck', fixed: true }),
  // K.K. Slider's spot (とたけけ: island/KKSlider.svelte, docs/design.md "K.K. Slider"): his stool, with him on it with
  // his guitar every day, one on the island, never deleted; moved and turned (he faces its way); listeners stand on the
  // tile in front of it, which stays clear and reachable (`front`). Its height is his, seated.
  k({ k: 'kk-stool', group: 'furniture', ja: 'とたけけ', en: 'K.K. Slider', w: 1, d: 1, block: true, foot: [24, 16], on: 'land', h: 75, icon: 'villagers/kk-slider-icon', turns: true, fixed: true, front: true }),
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
  // the camp goods (キャンプ: NH's outdoor furniture for a campsite, its names; the camp pack's models, scripts/world3d-assets.ts
  // PACKS, their icons the ずかん's): sat on (the chairs, the bench), lain on (the cot, the sleeping bag), lit at night
  // (the campfire, the fire pit, the lantern: world3d/things.ts LAMP); the rest to look at
  k({ k: 'small-campfire', group: 'camp', ja: 'たき火', en: 'Campfire', w: 1, d: 1, block: true, foot: [18, 16], on: 'land', h: 16, icon: 'items/small-campfire', turns: true }),
  k({ k: 'fire-pit', group: 'camp', ja: 'ファイヤーピット', en: 'Fire pit', w: 2, d: 2, block: true, foot: [35, 35], on: 'land', h: 21, icon: 'finds/items/fire-pit', turns: true }),
  k({ k: 'lantern', group: 'camp', ja: 'ランタン', en: 'Lantern', w: 1, d: 1, block: true, foot: [16, 16], on: 'land', h: 29, icon: 'items/lantern', turns: true }),
  k({ k: 'camping-cot', group: 'camp', ja: 'キャンプベッド', en: 'Camping cot', w: 2, d: 1, block: true, foot: [46, 22], on: 'land', h: 18, icon: 'items/camping-cot', turns: true }),
  k({ k: 'sleeping-bag', group: 'camp', ja: 'シュラフ', en: 'Sleeping bag', w: 2, d: 1, block: true, foot: [48, 22], on: 'land', h: 8, icon: 'finds/items/sleeping-bag', turns: true }),
  k({ k: 'kids-tent', group: 'camp', ja: 'キッズテント', en: "Kids' tent", w: 2, d: 2, block: true, foot: [47, 48], on: 'land', h: 59, icon: 'items/kids-tent', turns: true }),
  k({ k: 'cooler-box', group: 'camp', ja: 'クーラーボックス', en: 'Cooler box', w: 1, d: 1, block: true, foot: [21, 17], on: 'land', h: 17, icon: 'finds/items/cooler-box', turns: true }),
  k({ k: 'barbecue', group: 'camp', ja: 'バーベキューグリル', en: 'Barbecue', w: 1, d: 1, block: true, foot: [18, 25], on: 'land', h: 38, icon: 'finds/items/barbecue', turns: true }),
  k({ k: 'camp-stove', group: 'camp', ja: 'コッフェル', en: 'Camp stove', w: 1, d: 1, block: true, foot: [15, 10], on: 'land', h: 20, icon: 'finds/items/camp-stove', turns: true }),
  k({ k: 'folding-chair', group: 'camp', ja: '折りたたみアウトドアチェア', en: 'Outdoor folding chair', w: 1, d: 1, block: true, foot: [25, 20], on: 'land', h: 31, icon: 'finds/items/outdoor-folding-chair', turns: true }),
  k({ k: 'folding-table', group: 'camp', ja: '折りたたみアウトドアテーブル', en: 'Outdoor folding table', w: 1, d: 1, block: true, foot: [22, 21], on: 'land', h: 22, icon: 'finds/items/outdoor-folding-table', turns: true }),
  k({ k: 'outdoor-bench', group: 'camp', ja: 'アウトドアベンチ', en: 'Outdoor bench', w: 2, d: 1, block: true, foot: [43, 16], on: 'land', h: 13, icon: 'finds/items/outdoor-bench', turns: true }),
  k({ k: 'outdoor-table', group: 'camp', ja: 'アウトドアテーブル', en: 'Outdoor table', w: 2, d: 1, block: true, foot: [46, 23], on: 'land', h: 22, icon: 'finds/items/outdoor-table', turns: true }),
  k({ k: 'directors-chair', group: 'camp', ja: 'ディレクターズチェア', en: "Director's chair", w: 1, d: 1, block: true, foot: [20, 19], on: 'land', h: 32, icon: 'finds/items/directors-chair', turns: true }),
  k({ k: 'utility-wagon', group: 'camp', ja: 'キャリーワゴン', en: 'Utility wagon', w: 1, d: 1, block: true, foot: [26, 17], on: 'land', h: 32, icon: 'finds/items/utility-wagon', turns: true }),
  k({ k: 'water-jug', group: 'camp', ja: 'ウォータージャグ', en: 'Handy water cooler', w: 1, d: 1, block: true, foot: [15, 18], on: 'land', h: 21, icon: 'finds/items/handy-water-cooler', turns: true }),
  k({ k: 'simple-kettle', group: 'camp', ja: 'ケトル', en: 'Simple kettle', w: 1, d: 1, block: true, foot: [14, 12], on: 'land', h: 20, icon: 'finds/items/simple-kettle', turns: true }),
  k({ k: 'portable-radio', group: 'camp', ja: '携帯ラジオ', en: 'Portable radio', w: 1, d: 1, block: true, foot: [12, 8], on: 'land', h: 11, icon: 'items/portable-radio', turns: true }),
  k({ k: 'angled-signpost', group: 'camp', ja: 'ナナメのみちしるべ', en: 'Angled signpost', w: 1, d: 1, block: true, foot: [20, 20], on: 'land', h: 32, icon: 'items/angled-signpost', turns: true }),
  k({ k: 'destinations-signpost', group: 'camp', ja: 'せかいのみちしるべ', en: 'Destinations signpost', w: 2, d: 2, block: true, foot: [33, 28], on: 'land', h: 71, icon: 'items/destinations-signpost', turns: true }),
  // the food (たべもの: NH's dishes and drinks, the food pack's; to look at, a tap jiggles one; the cookware's fire lit)
  k({ k: 'picnic-basket', group: 'food', ja: 'ピクニックバスケット', en: 'Picnic basket', w: 1, d: 1, block: true, foot: [20, 20], on: 'land', h: 20, icon: 'finds/items/picnic-basket', turns: true }),
  k({ k: 'picnic-set', group: 'food', ja: 'お花見セット', en: 'Outdoor picnic set', w: 2, d: 2, block: true, foot: [37, 37], on: 'land', h: 18, icon: 'items/picnic-set', turns: true }),
  k({ k: 'fruit-basket', group: 'food', ja: 'フルーツバスケット', en: 'Fruit basket', w: 1, d: 1, block: true, foot: [24, 18], on: 'land', h: 15, icon: 'items/fruit-basket', turns: true }),
  k({ k: 'bread', group: 'food', ja: 'パン', en: 'Bread', w: 1, d: 1, block: true, foot: [20, 20], on: 'land', h: 15, icon: 'items/bread', turns: true }),
  k({ k: 'sandwich-set', group: 'food', ja: 'ミックスサンドセット', en: 'Diced-salad sandwich set', w: 1, d: 1, block: true, foot: [22, 17], on: 'land', h: 15, icon: 'finds/items/diced-salad-sandwich-set', turns: true }),
  k({ k: 'campfire-cookware', group: 'food', ja: '飯ごう', en: 'Campfire cookware', w: 1, d: 1, block: true, foot: [23, 21], on: 'land', h: 22, icon: 'finds/items/campfire-cookware', turns: true }),
  k({ k: 'stewpot', group: 'food', ja: '鍋', en: 'Stewpot', w: 1, d: 1, block: true, foot: [21, 17], on: 'land', h: 24, icon: 'finds/items/stewpot', turns: true }),
  k({ k: 'frying-pan', group: 'food', ja: 'フライパン', en: 'Frying pan', w: 1, d: 1, block: true, foot: [19, 19], on: 'land', h: 4, icon: 'items/frying-pan', turns: true }),
  k({ k: 'seafood-ajillo', group: 'food', ja: 'シーフードのアヒージョ', en: 'Seafood ajillo', w: 1, d: 1, block: true, foot: [19, 19], on: 'land', h: 4, icon: 'items/seafood-ajillo', turns: true }),
  k({ k: 'grilled-sea-bass', group: 'food', ja: 'スズキの香草焼き', en: 'Grilled sea bass with herbs', w: 1, d: 1, block: true, foot: [22, 15], on: 'land', h: 6, icon: 'items/grilled-sea-bass', turns: true }),
  k({ k: 'western-meal', group: 'food', ja: '洋風定食', en: 'Western-style meal', w: 1, d: 1, block: true, foot: [23, 16], on: 'land', h: 5, icon: 'finds/items/western-style-meal', turns: true }),
  k({ k: 'japanese-meal', group: 'food', ja: '和風定食', en: 'Japanese-style meal', w: 1, d: 1, block: true, foot: [23, 16], on: 'land', h: 5, icon: 'finds/items/japanese-style-meal', turns: true }),
  k({ k: 'bottled-beverage', group: 'food', ja: 'ペットボトル飲料', en: 'Bottled beverage', w: 1, d: 1, block: true, foot: [8, 8], on: 'land', h: 22, icon: 'finds/items/bottled-beverage', turns: true }),
  k({ k: 'coconut-juice', group: 'food', ja: 'ココナッツジュース', en: 'Coconut juice', w: 1, d: 1, block: true, foot: [10, 10], on: 'land', h: 18, icon: 'items/coconut-juice', turns: true }),
  k({ k: 'cookies', group: 'food', ja: 'クッキー', en: 'Cookies', w: 1, d: 1, block: true, foot: [19, 19], on: 'land', h: 4, icon: 'items/cookies', turns: true }),
  // the gym (ジム: NH's fitness furniture, its official names; the decorations' models and icons, `decor/<kind>-0`). A tap
  // on the ones NH lets one use walks my villager up to it and on (layout/nav.ts SEAT_ON's `use`: island/sitting.ts):
  // the weight bench's presses, the bike's pedalling, the treadmill's run, the punching bag's punches, the exercise
  // ball's bounce, the pull-up bar's reps (the default island's own stand, `deco/pullup`, is one of them); the gym pack's
  // (scripts/world3d-assets.ts PACKS) yoga mats lain on, massage chair sat on, speed bag punched; the rest to look at
  k({ k: 'pullup', group: 'gym', ja: 'けんすいスタンド', en: 'Pull-up-bar stand', w: 1, d: 1, block: true, foot: [28, 12], on: 'land', h: 44, icon: 'deco/pullup', turns: true }),
  k({ k: 'weight-bench', group: 'gym', ja: 'プレスベンチ', en: 'Weight bench', w: 2, d: 1, block: true, foot: [56, 28], on: 'land', h: 52, icon: 'decor/weight-bench-0', turns: true }),
  k({ k: 'exercise-bike', group: 'gym', ja: 'エクササイズバイク', en: 'Exercise bike', w: 1, d: 1, block: true, foot: [28, 16], on: 'land', h: 37, icon: 'decor/exercise-bike-0', turns: true }),
  k({ k: 'treadmill', group: 'gym', ja: 'ランニングマシン', en: 'Treadmill', w: 2, d: 1, block: true, foot: [50, 28], on: 'land', h: 34, icon: 'decor/treadmill-0', turns: true }),
  k({ k: 'punching-bag', group: 'gym', ja: 'サンドバッグ', en: 'Punching bag', w: 1, d: 1, block: true, foot: [28, 24], on: 'land', h: 58, icon: 'decor/punching-bag-0', turns: true }),
  k({ k: 'exercise-ball', group: 'gym', ja: 'バランスボール', en: 'Exercise ball', w: 1, d: 1, block: true, foot: [22, 22], on: 'land', h: 23, icon: 'decor/exercise-ball-0', turns: true }),
  k({ k: 'barbell', group: 'gym', ja: 'バーベル', en: 'Barbell', w: 2, d: 1, block: true, foot: [56, 20], on: 'land', h: 21, icon: 'decor/barbell-0', turns: true }),
  k({ k: 'kettlebell', group: 'gym', ja: 'ケトルベル', en: 'Kettlebell', w: 1, d: 1, block: true, foot: [14, 12], on: 'land', h: 17, icon: 'decor/kettlebell-0', turns: true }),
  k({ k: 'protein-shaker', group: 'gym', ja: 'プロテインシェイカー', en: 'Protein shaker bottle', w: 1, d: 1, block: true, foot: [16, 16], on: 'land', h: 17, icon: 'decor/protein-shaker-0', turns: true }),
  k({ k: 'water-cooler', group: 'gym', ja: 'ウォーターサーバー', en: 'Water cooler', w: 1, d: 1, block: true, foot: [16, 18], on: 'land', h: 51, icon: 'decor/water-cooler-0', turns: true }),
  k({ k: 'digital-scale', group: 'gym', ja: 'たいじゅうそくていき', en: 'Digital scale', w: 1, d: 1, block: true, foot: [18, 16], on: 'land', h: 4, icon: 'decor/digital-scale-0', turns: true }),
  k({ k: 'climbing-wall', group: 'gym', ja: 'クライミングウォール', en: 'Climbing wall', w: 2, d: 1, block: true, foot: [60, 12], on: 'land', h: 90, icon: 'decor/climbing-wall-0', turns: true }),
  k({ k: 'upright-locker', group: 'gym', ja: 'ロッカー', en: 'Upright locker', w: 1, d: 1, block: true, foot: [24, 22], on: 'land', h: 56, icon: 'decor/upright-locker-0', turns: true }),
  k({ k: 'yoga-mat', group: 'gym', ja: 'ヨガマット', en: 'Yoga mat', w: 2, d: 1, block: true, foot: [47, 22], on: 'land', h: 4, icon: 'finds/items/yoga-mat', turns: true }),
  k({ k: 'nook-yoga-mat', group: 'gym', ja: 'たぬき開発ヨガマット', en: 'Nook Inc. yoga mat', w: 2, d: 1, block: true, foot: [47, 22], on: 'land', h: 4, icon: 'items/nook-yoga-mat', turns: true }),
  k({ k: 'speed-bag', group: 'gym', ja: 'スピードバッグ', en: 'Speed bag', w: 1, d: 1, block: true, foot: [24, 22], on: 'land', h: 54, icon: 'finds/items/speed-bag', turns: true }),
  k({ k: 'massage-chair', group: 'gym', ja: 'マッサージチェア', en: 'Plush massage chair', w: 1, d: 1, block: true, foot: [24, 21], on: 'land', h: 43, icon: 'finds/items/plush-massage-chair', turns: true }),
  k({ k: 'dumbbell', group: 'gym', ja: 'ダンベル', en: 'Dumbbell', w: 1, d: 1, block: true, foot: [13, 8], on: 'land', h: 7, icon: 'items/dumbbell', turns: true }),
  // NH's bulletin board (けいじばん): one on the island, used from the tile in front of it
  k({ k: 'board', group: 'furniture', ja: '掲示板', en: 'Bulletin board', w: 2, d: 1, block: true, foot: [54, 14], on: 'land', h: 44, icon: 'deco/bulletin-board', turns: true, fixed: true, front: true }),
  // the seasonal spots (fixedDecor.ts: the season's piece stands there in its weeks)
  k({ k: 'beach-chair', group: 'season', ja: 'ビーチチェア（夏）', en: 'Beach chair (summer)', w: 2, d: 1, block: true, foot: [56, 22], on: 'land', h: 30, icon: 'deco/beach-chair', turns: true, fixed: true }),
  k({ k: 'sandcastle', group: 'season', ja: 'すなのおしろ（夏）', en: 'Sandcastle (summer)', w: 1, d: 1, block: true, foot: [26, 18], on: 'land', h: 30, icon: 'deco/sandcastle', fixed: true }),
  k({ k: 'snowboy', group: 'season', ja: 'ゆきだるま（冬）', en: 'Snowboy (winter)', w: 1, d: 1, block: true, foot: [30, 20], on: 'land', h: 40, icon: 'deco/snowboy-0', fixed: true }),
  // structures that join terrain: a bridge over water (its deck walkable), stairs up a cliff (f 0: rising away)
  k({ k: 'bridge', group: 'structure', ja: '橋', en: 'Bridge', w: 1, d: 3, block: false, on: 'span', h: 12, icon: 'bridges/stone-front', turns: true, variants: ['stone', 'wood', 'log', 'brick', 'red', 'iron', 'japanese', 'suspension'] }),
  // a pond to put down (the old 3D island's: its water rippling, lily pads and a lily on it, stones round its edge), on
  // the grass; its water a fresh water like the painted pond's (fish come, a line goes in); the painted pond stays too
  k({ k: 'pond', group: 'structure', ja: '池', en: 'Pond', w: 3, d: 2, block: true, foot: [86, 54], on: 'grass', h: 4, icon: 'deco/pond-stone-sakura', turns: true }),
  // NH's incline: 2 tiles across, 4 up the flight (NH's own: scripts/home-models.ts --structures)
  k({ k: 'stairs', group: 'structure', ja: '坂', en: 'Stairs', w: 2, d: 4, block: false, on: 'cliff', h: 40, icon: '', turns: true, variants: ['stone', 'brick', 'iron', 'wood', 'log', 'natural'] }),
  // the island's public buildings, one of each (NH's: 7 × 4 tiles, the door the middle of the front edge, model.ts doorOf;
  // a tap walks up to it and goes in): the museum (はくぶつかん: the ずかん's finds swim and fly in it, routes/museum) and
  // the shop (タヌキ商店, NH's Nook's Cranny: the catches sold for かいがら, furniture bought, routes/shop).
  k({ k: 'museum', group: 'building', ja: '博物館', en: 'Museum', w: 7, d: 4, block: true, on: 'land', h: 117, icon: 'villagers/blathers-icon', turns: true, fixed: true, door: true }),
  k({ k: 'shop', group: 'building', ja: 'タヌキ商店', en: "Nook's Cranny", w: 7, d: 4, block: true, on: 'land', h: 118, icon: 'host/timmy-tommy', turns: true, fixed: true, door: true }),
  // the homes (their footprint is their style's: layout/homes.ts)
  k({ k: 'home', group: 'home', ja: '家', en: 'Home', w: 3, d: 2, block: true, on: 'land', h: 80, icon: 'deco/campsite', fixed: true, turns: true, hidden: true }),
  // the visitors' spots (docs/design.md "Visitors"): where the visitors stand, NH's plaza (spots.ts stageOf), and where
  // Gulliver lies washed up (spots.ts washedUp), the members' choice in the もようがえ; a mark on the ground only in it,
  // nothing in play. Without one (or where it can't be used now) the island's own spot, derived from the layout.
  k({ k: 'plaza', group: 'visitor', ja: 'お客さんの場所', en: "Visitors' spot", w: 1, d: 1, block: false, on: 'land', h: 0, icon: 'deco/campsite-sign', one: true }),
  k({ k: 'beach-spot', group: 'visitor', ja: 'ジョニーの場所', en: "Gulliver's spot", w: 1, d: 1, block: false, on: 'land', h: 0, icon: 'villagers/gulliver-icon', one: true }),
  // named spots: where a villager stands at home, nothing drawn ('stage': the old fixed visitors' spot, kept so the
  // layouts fold as they did; the visitors' stage is derived now, spots.ts stageOf)
  k({ k: 'spot', group: 'spot', ja: '場所', en: 'Spot', w: 1, d: 1, block: false, on: 'land', h: 0, icon: '', variants: ['villager-a', 'villager-b', 'stage'], fixed: true, hidden: true })
];

const KINDS: Readonly<Record<string, KindDef>> = Object.fromEntries(KIND_LIST.map((d) => [d.k, d]));
export const kindDef = (k: string): KindDef | undefined => KINDS[k];
/** Whether one goes into it at its door: a home, or a building of the island's (the museum, the shop). */
/** A visitors' spot (a mark, never drawn in play, standing on nothing: nothing's ground is taken by it). */
export const isMarker = (k: string): boolean => KINDS[k]?.group === 'visitor';
export const goesIn = (k: string): boolean => k === 'home' || !!KINDS[k]?.door;

/** A kind's footprint (tiles) in a facing: [across, deep]. */
export function footprintOf(def: Pick<KindDef, 'w' | 'd' | 'turns'>, f: number): [number, number] {
  return def.turns && f % 2 ? [def.d, def.w] : [def.w, def.d];
}
