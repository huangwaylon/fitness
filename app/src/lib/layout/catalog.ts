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
  /** A pack's (scripts/world3d-assets.ts PACKS): a decoration (island/decor.ts) drawn as its model `decor/<k>`, its
   *  icon the ずかん's or NH's own. */
  packed?: true;
}

const k = (def: KindDef): KindDef => def;
/** A pack's kinds (scripts/world3d-assets.ts PACKS: the camp goods, the food, the gym's newer pieces), packed for the
 *  first load's bytes: `kind|ja|en|wd|footW,footD,h|icon`, each on any land, blocking, turned with its facing; its
 *  icon the ずかん's (`finds/items/<icon>`), else NH's own (`items/<kind>`). */
const packed = (group: Group, rows: string): KindDef[] =>
  rows.split(';').map((r) => {
    const [kk, ja, en, wd, f, icon] = r.split('|'), [fw, fd, h] = f.split(',').map(Number);
    return { k: kk, group, ja, en, w: +wd[0], d: +wd[1], block: true, foot: [fw, fd] as const, on: 'land' as const, h, icon: icon ? `finds/items/${icon}` : `items/${kk}`, turns: true, packed: true };
  });
const PACKED_CAMP = packed('camp', [
  'small-campfire|たき火|Campfire|11|18,16,16|',
  'fire-pit|ファイヤーピット|Fire pit|22|35,35,21|fire-pit',
  'lantern|ランタン|Lantern|11|16,16,29|',
  'camping-cot|キャンプベッド|Camping cot|21|46,22,18|',
  'sleeping-bag|シュラフ|Sleeping bag|21|48,22,8|sleeping-bag',
  'kids-tent|キッズテント|Kids\' tent|22|47,48,59|',
  'cooler-box|クーラーボックス|Cooler box|11|21,17,17|cooler-box',
  'barbecue|バーベキューグリル|Barbecue|11|18,25,38|barbecue',
  'camp-stove|コッフェル|Camp stove|11|15,10,20|camp-stove',
  'folding-chair|折りたたみアウトドアチェア|Outdoor folding chair|11|25,20,31|outdoor-folding-chair',
  'folding-table|折りたたみアウトドアテーブル|Outdoor folding table|11|22,21,22|outdoor-folding-table',
  'outdoor-bench|アウトドアベンチ|Outdoor bench|21|43,16,13|outdoor-bench',
  'outdoor-table|アウトドアテーブル|Outdoor table|21|46,23,22|outdoor-table',
  'directors-chair|ディレクターズチェア|Director\'s chair|11|20,19,32|directors-chair',
  'utility-wagon|キャリーワゴン|Utility wagon|11|26,17,32|utility-wagon',
  'water-jug|ウォータージャグ|Handy water cooler|11|15,18,21|handy-water-cooler',
  'simple-kettle|ケトル|Simple kettle|11|14,12,20|simple-kettle',
  'portable-radio|携帯ラジオ|Portable radio|11|12,8,11|',
  'angled-signpost|ナナメのみちしるべ|Angled signpost|11|20,20,32|',
  'destinations-signpost|せかいのみちしるべ|Destinations signpost|22|33,28,71|',
  // (the second file's, decor/camp2: NH's camp kitchen, its table's burner and sink, and the site's power, water,
  // washing line, fires and pots)
  'outdoor-kitchen|アウトドアキッチン|Outdoor kitchen|21|50,23,37|outdoor-kitchen',
  'outdoor-generator|アウトドア発電機|Outdoor generator|11|20,18,19|outdoor-generator',
  'plastic-canister|ポリタンク|Plastic canister|11|16,8,20|plastic-canister',
  'clothesline|物干しロープ|Clothesline|21|51,8,45|',
  'clothesline-pole|物干しざお|Clothesline pole|21|50,12,47|clothesline-pole',
  'leaf-campfire|落ち葉のたき火|Leaf campfire|11|25,25,16|',
  'oil-barrel-bathtub|ドラム缶風呂|Oil-barrel bathtub|11|22,22,47|',
  'smoker|燻製マシン|Smoker|11|21,18,37|smoker',
  'lawn-chair|ビニールチェア|Lawn chair|11|21,19,30|lawn-chair',
  'kettle|やかん|Kettle|11|13,17,21|kettle',
  'espresso-maker|エスプレッソメーカー|Stovetop espresso maker|11|14,8,17|stovetop-espresso-maker',
  'wooden-bucket|木製のバケツ|Wooden bucket|11|16,15,23|',
  'tin-bucket|ブリキのバケツ|Tin bucket|11|16,17,16|tin-bucket',
].join(';'));
const PACKED_FOOD = packed('food', [
  'picnic-basket|ピクニックバスケット|Picnic basket|11|20,20,20|picnic-basket',
  'picnic-set|お花見セット|Outdoor picnic set|22|37,37,18|',
  'fruit-basket|フルーツバスケット|Fruit basket|11|24,18,15|',
  'bread|パン|Bread|11|20,20,15|',
  'sandwich-set|ミックスサンドセット|Diced-salad sandwich set|11|22,17,15|diced-salad-sandwich-set',
  'campfire-cookware|飯ごう|Campfire cookware|11|23,21,22|campfire-cookware',
  'stewpot|鍋|Stewpot|11|21,17,24|stewpot',
  'frying-pan|フライパン|Frying pan|11|19,19,4|',
  'seafood-ajillo|シーフードのアヒージョ|Seafood ajillo|11|19,19,4|',
  'grilled-sea-bass|スズキの香草焼き|Grilled sea bass with herbs|11|22,15,6|',
  'western-meal|洋風定食|Western-style meal|11|23,16,5|western-style-meal',
  'japanese-meal|和風定食|Japanese-style meal|11|23,16,5|japanese-style-meal',
  'bottled-beverage|ペットボトル飲料|Bottled beverage|11|8,8,22|bottled-beverage',
  'coconut-juice|ココナッツジュース|Coconut juice|11|10,10,18|',
  'cookies|クッキー|Cookies|11|19,19,4|',
].join(';'));
const PACKED_GYM = packed('gym', [
  'yoga-mat|ヨガマット|Yoga mat|21|47,22,4|yoga-mat',
  'nook-yoga-mat|たぬき開発ヨガマット|Nook Inc. yoga mat|21|47,22,4|',
  'speed-bag|スピードバッグ|Speed bag|11|24,22,54|speed-bag',
  'massage-chair|マッサージチェア|Plush massage chair|11|24,21,43|plush-massage-chair',
  'dumbbell|ダンベル|Dumbbell|11|13,8,7|',
].join(';'));
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
  ...PACKED_CAMP,
  // the food (たべもの: NH's dishes and drinks, the food pack's; to look at, a tap jiggles one; the cookware's fire lit)
  ...PACKED_FOOD,
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
  ...PACKED_GYM,
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
