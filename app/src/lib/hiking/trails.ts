// トレイル's twelve trails (docs/hiking.md "Data"): eight in Washington State, four in Japan. The first ten from the
// hiking-trails app (its trails.js, English, and i18n.js's Japanese: the user's own write-ups), their stats AllTrails'
// (length, gain, difficulty, time; km and m its miles and feet converted once, the gain the DEM figure on purpose:
// types.ts); the last two walked and recorded on YAMAP (`walked`: the activities' own figures). The tracks are files of
// their own by slug (static/hiking/tracks/, load.ts), the photos static/hiking/photos/<slug>.webp (AllTrails users'
// photos, 1080 × 720: a card's width at 3×; the YAMAP two have none).
import type { Trail } from './types.ts';

const NWFP = { en: 'NW Forest Pass', ja: 'ノースウエスト・フォレストパス' };

export const TRAILS: readonly Trail[] = [
  {
    slug: 'lake-22',
    name: { en: 'Lake 22 Trail', ja: 'レイク22 トレイル' },
    area: { en: 'Granite Falls, WA', ja: 'グラニットフォールズ（ワシントン州）' },
    lengthKm: 9.8, gainM: 444, diff: 'moderate', route: 'out', time: '3 h 17 min', season: 'Apr – Nov', dogs: 'leashed',
    permit: { en: 'NW Forest Pass or day-use fee (Recreation.gov app)', ja: 'ノースウエスト・フォレストパス、または日帰り利用料（Recreation.gov アプリ）' },
    center: { lat: 48.07, lon: -121.7555 },
    tiles: 'us',
    summary: {
      en: 'A beautiful hike to an alpine lake through old-growth forest, ending with stunning views of Mount Pilchuck rising behind a turquoise lake.',
      ja: '原生林を抜けて高山湖へと至る美しいコース。ターコイズブルーの湖の奥にそびえるピルチャック山の絶景がフィナーレを飾ります。'
    },
    description: {
      en: 'Lake Twenty-Two Trail climbs through lush old-growth rainforest off the Mountain Loop Highway east of Granite Falls. The path starts gently on a dirt staircase, with Twenty-Two Creek flowing alongside. A bridge crosses the creek about a mile in beside a pretty waterfall. From there the trail steepens, with rocks and creek crossings, then gentle switchbacks lead to a long talus slope beneath the wall of Lake Twenty-Two. The trail flattens near the lake outlet stream, arriving at a turquoise lake with the steep wall of Mount Pilchuck looming behind. A short loop circles the lake.',
      ja: 'レイク・トゥエンティトゥー・トレイルは、グラニットフォールズの東、マウンテンループ・ハイウェイ沿いから、苔むした原生の温帯雨林の中を登っていきます。序盤は土の階段状のゆるやかな道で、傍らをトゥエンティトゥー・クリークが流れます。約1.6km地点で、美しい滝のそばの橋が沢を渡ります。ここから道は険しくなり、岩場や渡渉が増え、ゆるやかなつづら折りを経て、レイク・トゥエンティトゥーの岩壁の下に広がる長いガレ場へと出ます。湖の流出口あたりで道は平坦になり、ターコイズブルーの湖に到着。背後にはピルチャック山の切り立った壁がそびえます。湖を一周する短い周回路もあります。'
    },
    tips: [
      { en: 'Rocky trail — sturdy hiking boots are necessary.', ja: '岩の多い道です。しっかりした登山靴が必須です。' },
      { en: 'Waterproof boots recommended for creek crossings.', ja: '渡渉があるため、防水の登山靴がおすすめです。' },
      { en: 'Not the best fit for young kids due to rocks and water.', ja: '岩場と渡渉があるため、小さなお子さま連れには不向きです。' },
      { en: 'Very popular — arrive early, parking fills fast on weekends.', ja: '非常に人気のコース。早めの到着を。週末は駐車場がすぐ満車になります。' }
    ]
  },
  {
    slug: 'snow-lake',
    name: { en: 'Snow Lake Trail', ja: 'スノーレイク・トレイル' },
    area: { en: 'Snoqualmie Pass, WA', ja: 'スノコルミーパス（ワシントン州）' },
    lengthKm: 10.8, gainM: 514, diff: 'moderate', route: 'out', time: '3 h 40 min', season: 'Jul – Oct', dogs: 'leashed',
    permit: { en: 'NW Forest Pass or day-use fee (Recreation.gov app)', ja: 'ノースウエスト・フォレストパス、または日帰り利用料（Recreation.gov アプリ）' },
    center: { lat: 47.457, lon: -121.4355 },
    tiles: 'us',
    summary: {
      en: 'One of the most popular hikes in the Alpine Lakes Wilderness, climbing past waterfalls to a large lake beneath Chair Peak.',
      ja: 'アルパイン・レイクス・ウィルダネスでも屈指の人気コース。いくつもの滝を越え、チェア・ピークの足元に広がる大きな湖を目指します。'
    },
    description: {
      en: "Starting at the Alpental Ski Area, this trail climbs alongside the South Fork Snoqualmie River with Snoqualmie Mountain on your right. You'll pass numerous waterfalls and follow steep switchbacks up to Snow Lake. Just before the 2-mile mark you reach the Source Lake Overlook junction; turn north to continue to the lake. At the top you'll have incredible views of Snow Lake with Chair Peak in the background. It's also a popular entrance into the larger Alpine Lakes Wilderness and a great base for overnight trips.",
      ja: 'アルペンタル・スキー場からスタートし、右手にスノコルミー山を望みながらサウスフォーク・スノコルミー川沿いを登ります。いくつもの滝を通り過ぎ、急なつづら折りを越えてスノーレイクへ。約3.2km地点でソースレイク展望コースの分岐に出たら、北へ進んで湖へ向かいます。頂上ではチェア・ピークを背にしたスノーレイクの絶景が広がります。より広大なアルパイン・レイクス・ウィルダネスへの人気の入口でもあり、泊まりがけの山行の拠点にも最適です。'
    },
    tips: [
      { en: 'Winter brings avalanche terrain — come prepared.', ja: '冬は雪崩地形になります。万全の備えを。' },
      { en: 'Snowshoes or microspikes recommended depending on season.', ja: '季節に応じてスノーシューまたはチェーンスパイクがおすすめです。' },
      { en: 'Trail can be hard to follow in winter — record your hike.', ja: '冬は道が分かりにくくなります。GPSで軌跡を記録しましょう。' },
      { en: 'Get an early start; this is a very busy trailhead.', ja: '早めの出発を。非常に混雑する登山口です。' }
    ]
  },
  {
    slug: 'lake-valhalla',
    name: { en: 'Lake Valhalla Trail', ja: 'レイク・ヴァルハラ・トレイル' },
    area: { en: 'Leavenworth, WA', ja: 'レブンワース（ワシントン州）' },
    lengthKm: 10.3, gainM: 418, diff: 'moderate', route: 'out', time: '3 h 16 min', season: 'May – Oct', dogs: 'leashed',
    permit: { en: 'NW Forest Pass or parking fee', ja: 'ノースウエスト・フォレストパス、または駐車料金' },
    center: { lat: 47.7989, lon: -121.0906 },
    tiles: 'us',
    summary: {
      en: 'A rewarding hike to a beautiful alpine lake — steep at first, then gradual. Bring a swimsuit and a lunch.',
      ja: '美しい高山湖へと至る、登りごたえのあるコース。序盤は急ですが次第にゆるやかに。水着とお弁当を持って出かけましょう。'
    },
    description: {
      en: 'This trail takes you to a beautiful alpine lake near Stevens Pass. The trail is steep in the beginning but becomes more gradual as you get closer to the lake. Bring your swimsuit and a lunch and spend the afternoon taking in the scenery and enjoying the water. A great moderate day hike popular with backpackers, anglers, and day hikers alike.',
      ja: 'スティーブンスパス近くの美しい高山湖へと続くコースです。序盤は急登ですが、湖に近づくにつれてゆるやかになります。水着とお弁当を持って、午後はのんびりと景色を眺めたり水遊びを楽しんだり。バックパッカーや釣り人、日帰りハイカーにも人気の、ほどよい歩きごたえの一日コースです。'
    },
    tips: [
      { en: 'Mosquitoes can be bad in early summer — bring bug spray.', ja: '初夏は蚊が多いことで知られています。虫除けを持参しましょう。' },
      { en: 'Bring a swimsuit; the lake is great for a dip.', ja: '水着をお忘れなく。湖は水浴びに最適です。' },
      { en: 'NW Forest Pass required at the trailhead.', ja: '登山口ではノースウエスト・フォレストパスが必要です。' }
    ]
  },
  {
    slug: 'talapus-lake',
    name: { en: 'Talapus Lake Trail', ja: 'タラパスレイク・トレイル' },
    area: { en: 'Snoqualmie Pass, WA', ja: 'スノコルミーパス（ワシントン州）' },
    lengthKm: 5.6, gainM: 200, diff: 'moderate', route: 'out', time: '1 h 42 min', season: 'May – Oct', dogs: 'leashed',
    permit: NWFP,
    center: { lat: 47.4074, lon: -121.5166 },
    tiles: 'us',
    summary: {
      en: 'A quiet, scenic forest hike to a peaceful lake — short enough for an easy afternoon, gorgeous in fall.',
      ja: '静かで景色のよい森を抜けて、穏やかな湖へ。気軽な午後の散策にちょうどよく、秋は紅葉が見事です。'
    },
    description: {
      en: 'A well-maintained, family-friendly trail to a serene lake. The access road is rough but the trail itself is in good shape. It can get crowded, but arriving early helps you beat the crowds. Go in the fall for beautiful colors and photos. The lake is a great spot to stop for lunch before heading back the way you came.',
      ja: 'よく整備された、家族連れにもやさしい湖へのコースです。アクセス路は荒れていますが、登山道自体は良好な状態です。混雑することもありますが、早めに到着すれば人混みを避けられます。秋には美しい紅葉と写真映えする景色が楽しめます。湖は、来た道を戻る前のランチ休憩に最適なスポットです。'
    },
    tips: [
      { en: 'The access road is rough — drive carefully.', ja: 'アクセス路は荒れています。運転にご注意を。' },
      { en: 'Arrive early to beat the crowds.', ja: '早めの到着で混雑を避けましょう。' },
      { en: 'Stunning fall colors — best in autumn.', ja: '紅葉が見事です。秋が一番の見頃です。' }
    ]
  },
  {
    slug: 'mount-pilchuck',
    name: { en: 'Mount Pilchuck Trail', ja: 'マウント・ピルチャック・トレイル' },
    area: { en: 'Granite Falls, WA', ja: 'グラニットフォールズ（ワシントン州）' },
    lengthKm: 8.7, gainM: 653, diff: 'hard', route: 'out', time: '~3 h 30 min', season: 'Jun – Oct', dogs: 'leashed',
    permit: { en: 'NW Forest Pass (Mount Pilchuck State Park)', ja: 'ノースウエスト・フォレストパス（マウント・ピルチャック州立公園）' },
    center: { lat: 48.0638, lon: -121.8071 },
    tiles: 'us',
    summary: {
      en: 'A challenging climb to a restored fire lookout tower with panoramic views of Baker, Rainier, Puget Sound, and the Olympics.',
      ja: '復元された防火監視塔へと登る歩きごたえのあるコース。ベーカー山、レーニア山、ピュージェット湾、オリンピック山脈の大パノラマが待っています。'
    },
    description: {
      en: "Mount Pilchuck Trail climbs to an old fire lookout tower offering panoramic summit views. There's a fantastic change in scenery as you ascend — lush old-growth forest at the bottom giving way to arid, rocky overlooks toward the top. The terrain can be rough and requires a good sense of balance to navigate the rocky pathway. From the lookout, enjoy great views of Mount Baker, Mount Rainier, Puget Sound, and the Olympics.",
      ja: 'マウント・ピルチャック・トレイルは、山頂の古い防火監視塔へと登り、360度のパノラマを楽しめるコースです。登るにつれて景色が劇的に移り変わり、麓の鬱蒼とした原生林から、山頂付近の乾いた岩稜の展望へと変化します。地形は険しく、岩場の道を進むにはバランス感覚が求められます。監視塔からはベーカー山、レーニア山、ピュージェット湾、オリンピック山脈の素晴らしい眺めが広がります。'
    },
    tips: [
      { en: 'Rocky terrain near the top — good balance required.', ja: '山頂付近は岩場です。良好なバランス感覚が必要です。' },
      { en: 'The final road to the trailhead is rough with potholes.', ja: '登山口へ続く終盤の道は穴だらけで荒れています。' },
      { en: 'Expect mud and snow as late as mid-summer — dress accordingly.', ja: '真夏でも泥や残雪があります。それに備えた服装を。' },
      { en: 'One of the busiest trails in the area — arrive early.', ja: '周辺でも屈指の人気コース。早めの到着を。' }
    ]
  },
  {
    slug: 'bridal-veil',
    name: { en: 'Bridal Veil Falls & Lake Serene', ja: 'ブライダルベール滝 & レイク・セリーン' },
    area: { en: 'Gold Bar, WA', ja: 'ゴールドバー（ワシントン州）' },
    lengthKm: 12.9, gainM: 828, diff: 'hard', route: 'out', time: '5 h 10 min', season: 'Apr – Sep', dogs: 'leashed',
    permit: NWFP,
    center: { lat: 47.7967, lon: -121.568 },
    tiles: 'us',
    summary: {
      en: 'What it lacks in length it makes up for in elevation gain — a steep climb to a stunning blue lake ringed by high ridges, with a worthy waterfall side trip.',
      ja: '距離は短くとも標高差はたっぷり。高い稜線に囲まれた、息をのむほど青い湖への急登です。寄り道する価値のある滝もあります。'
    },
    description: {
      en: "Lake Serene is an alpine lake nestled in the Cascades, accessed off Mount Index Road near Stevens Pass. The first mile and a half is a well-manicured, slightly inclined path; partway you can detour a half-mile to Bridal Veil Falls — well worth the side trip. Back on the main trail, the final two miles to the lake climb hard through long wooden steps, rocky passages, and switchbacks, with a very steep grade about 1.4 miles in. At the top you're rewarded with a stunning blue lake surrounded by high ridges. Cross the log bridge to reach 'Lunch Rock,' a large smooth slab where people relax and jump in.",
      ja: 'レイク・セリーンは、カスケード山脈の懐に抱かれた高山湖で、スティーブンスパス近くのマウント・インデックス・ロードからアクセスします。最初の約2.4kmは、よく整備されたゆるやかな登り。途中で約800mの寄り道をすれば、ブライダルベール滝へ。立ち寄る価値は十分にあります。本道に戻ると、湖までの最後の約3.2kmは、長い木の階段や岩場、つづら折りを越える急登が続き、約2.2km地点には非常に急な勾配があります。登りきると、高い稜線に囲まれた、息をのむほど青い湖がご褒美に。丸太橋を渡れば「ランチロック」と呼ばれる大きな一枚岩があり、人々がくつろいだり、湖に飛び込んだりしています。'
    },
    tips: [
      { en: 'Get an early start — the trailhead parking fills fast.', ja: '早めの出発を。登山口の駐車場はすぐ満車になります。' },
      { en: 'The side trip to Bridal Veil Falls is worth the extra mile.', ja: 'ブライダルベール滝への寄り道は、その一歩の価値あり。' },
      { en: 'Crampons and ice axes recommended in winter.', ja: '冬はアイゼンとピッケルがおすすめです。' },
      { en: 'NW Forest Pass required.', ja: 'ノースウエスト・フォレストパスが必要です。' }
    ]
  },
  {
    slug: 'skyline-loop',
    name: { en: 'Skyline Loop', ja: 'スカイライン・ループ' },
    area: { en: 'Paradise, Mt. Rainier NP', ja: 'パラダイス（レーニア山国立公園）' },
    lengthKm: 9.2, gainM: 543, diff: 'hard', route: 'loop', time: '~3 h 30 min', season: 'Jun – Sep', dogs: 'no',
    permit: { en: 'Mount Rainier NP entrance fee', ja: 'レーニア山国立公園の入園料' },
    center: { lat: 46.7962, lon: -121.7268 },
    tiles: 'us',
    summary: {
      en: "The most popular route out of Paradise on Mount Rainier's south side — lush meadows, glacier views, rivers, waterfalls, and Panorama Point.",
      ja: 'レーニア山南面のパラダイスを起点とする一番人気のコース。お花畑、氷河の眺め、川、滝、そしてパノラマ・ポイント。'
    },
    description: {
      en: "The Skyline Trail is the classic loop out of Paradise on the southern side of Mount Rainier, with something for everyone: wildflower meadows, glacier views, rivers, and waterfalls. The loop can be done in either direction, though many choose clockwise. If you don't want the full loop, many hikers turn around at Panorama Point — the summit push has steep sections with loose rock and some scrambling. On the western side, an optional Glacier Vista offshoot overlooks the Nisqually Glacier. You'll start at the Jackson Visitor Center (restrooms, food, exhibits).",
      ja: 'スカイライン・トレイルは、レーニア山の南側、パラダイスを起点とする定番の周回コースで、高山植物のお花畑、氷河の眺め、川、滝と、見どころが満載です。ループはどちら回りでも歩けますが、多くの人は時計回りを選びます。全周しない場合は、パノラマ・ポイントで折り返すハイカーも多くいます。山頂への登りには、浮き石のある急斜面や、軽い岩登りの区間があります。西側には、ニスクォリー氷河を見下ろすグレイシャー・ビスタへの寄り道も。出発は、トイレ・売店・展示のあるジャクソン・ビジターセンターから。'
    },
    tips: [
      { en: 'Dogs are not allowed — this is a National Park trail.', ja: '犬は同伴できません。国立公園内のコースです。' },
      { en: 'Oct–May the route requires spikes, snowshoes, and poles.', ja: '10月～5月は、スパイク・スノーシュー・ストックが必要です。' },
      { en: "Don't attempt in winter without snow/ice experience.", ja: '雪氷の経験がなければ、冬の挑戦は避けましょう。' },
      { en: 'Steep loose rock near Panorama Point — some scrambling.', ja: 'パノラマ・ポイント付近は急な浮き石。軽い岩登りがあります。' }
    ]
  },
  {
    slug: 'enchantments',
    name: { en: 'The Enchantments Traverse', ja: 'エンチャントメント・トラバース' },
    area: { en: 'Leavenworth, WA', ja: 'レブンワース（ワシントン州）' },
    lengthKm: 30.7, gainM: 1477, diff: 'veryhard', route: 'p2p', time: '10 – 13 h', season: 'Jul – Oct', dogs: 'no',
    permit: { en: 'Overnight permit required (lottery)', ja: '宿泊許可証が必要（抽選制）' },
    center: { lat: 47.511, lon: -120.7755 },
    tiles: 'us',
    summary: {
      en: 'A bucket-list traverse through soft tundra meadows, glacial lakes, and impossible granite — one of the great alpine adventures of the Pacific Northwest.',
      ja: 'やわらかなツンドラの草原、氷河湖、非現実的な花崗岩の地形をめぐる、人生で一度は歩きたい縦走路。太平洋岸北西部を代表する高山の大冒険です。'
    },
    description: {
      en: 'This epic trip through the Alpine Lakes Wilderness wanders past tundra meadows, glacial-cirque lakes, trickling streams, and granite rock formations that look like another world. Usually done as an overnight, though fit hikers can do it in a long day. Starting from the Stuart Lake Trailhead, head south to Colchuk Lake with views of Dragontail and Colchuk Peaks, then tackle the brutal ascent up Aasgard Pass. The trail passes scree, alpine meadows, and countless lakes — mountain goats are common. Descend through the Lower Enchantments past Tranquil, Inspiration, and Perfection Lakes, then down past Snow Creek Falls to Snow Lakes and out to Icicle Creek Road.',
      ja: 'アルパイン・レイクス・ウィルダネスを貫くこの壮大な旅は、ツンドラの草原、氷河圏谷の湖、せせらぎ、そして別世界のような花崗岩の岩峰群をめぐります。通常は一泊で歩きますが、健脚なら長い日帰りも可能です。スチュアートレイク登山口を起点に南へ進み、ドラゴンテール峰とコルチャック峰を望むコルチャック湖へ。続くアースガルド峠への登りは、このコース屈指の難所です。道はガレ場や高山の草原、無数の氷河湖の脇を抜けていきます。マウンテンゴートがよく見られる一帯です。ロウアー・エンチャントメントへ下る道では、トランクィル湖、インスピレーション湖、パーフェクション湖と、名前のとおりの湖が次々と現れます。やがてスノークリーク滝を経てスノーレイクへ下り、アイシクルクリーク・ロードへと抜けます。'
    },
    tips: [
      { en: 'Overnight permits are required (competitive lottery).', ja: '宿泊には許可証が必要です（競争率の高い抽選制）。' },
      { en: 'Some sections require off-trail navigation — bring offline maps.', ja: '一部に道のない区間があります。オフライン地図を持参しましょう。' },
      { en: 'Significant elevation loss on the descent — hard on the knees.', ja: '下りの標高差が大きく、膝に堪えます。' },
      { en: 'Only for experienced adventurers. Two cars or a shuttle needed.', ja: '経験者向けのコースです。車2台か、シャトルの手配が必要です。' }
    ]
  },
  {
    slug: 'fuji-yoshida',
    name: { en: 'Mt. Fuji: Yoshida Trail (5th Station)', ja: '富士山 吉田ルート（五合目）' },
    area: { en: 'Fujiyoshida, Yamanashi', ja: '富士吉田市（山梨県）' },
    // the GPX is the full round trip (up one trail, down the other): the length and route are its, the gain one climb's
    lengthKm: 16.7, gainM: 1433, diff: 'hard', route: 'loop', time: '8 – 10 h', season: 'Jul – Sep', dogs: 'no',
    permit: {
      en: 'Climbing season only · Yoshida Trail reservation + ¥2,000 entry fee (2024–)',
      ja: '登山シーズン限定 ／ 吉田ルートは事前予約＋通行料2,000円が必要（2024年〜）'
    },
    center: { lat: 35.38, lon: 138.7403 },
    tiles: 'jp',
    summary: {
      en: 'The most popular route up Mt. Fuji — a relentless switchback climb from the Subaru Line 5th Station up through volcanic cinder and a line of mountain huts to the 3,710 m crater rim (the classic sunrise / goraikō spot), then back down the dedicated descending trail to the 5th Station.',
      ja: '富士登山で最も人気のルート。富士スバルライン五合目から、火山礫の斜面と山小屋の連なりを縫って、ご来光の名所として知られる標高約3,710mの噴火口縁まで一気に登り、専用の下山道で五合目へ戻ります。'
    },
    description: {
      en: "This is the busiest of Mt. Fuji's four routes and the one most first-timers choose. From the Subaru Line 5th Station (≈2,300 m) the trail climbs steadily through cinder slopes and dwarf pine, passing red torii gates, small shrines, and a near-continuous string of mountain huts. Above the 6th Station the ascending and descending trails split, so this is a loop: you climb the up-route to the Yoshida-side crater rim near Kusushi Shrine (≈3,710 m) — many add the 30–60 min crater walk (ohachi-meguri) out to the true summit, Kengamine (3,776 m) — then return on the separate descending switchbacks, rejoining the shared path at the 6th Station back down to the 5th. Many climbers break the ascent with an overnight hut stay to acclimatize and reach the rim for dawn.",
      ja: '富士山の四大ルートの中で最も賑わい、初めての富士登山に選ばれることの多い道です。スバルライン五合目（標高約2,300m）から、ハイマツと火山礫の斜面を、赤い鳥居や小さな祠、ほぼ切れ目なく続く山小屋を見ながらジグザグに登ります。六合目から上は登りと下りの道が分かれた周回ルートで、登山道を登って吉田口頂上の久須志神社付近（標高約3,710m）へ。最高地点の剣ヶ峰（3,776m）へはお鉢巡りで30〜60分ほど。その後はつづら折りの下山専用道を下り、六合目で往路に合流して五合目へ戻ります。多くの登山者は山小屋に一泊して高度に体を慣らし、明け方に頂上を目指します。'
    },
    tips: [
      {
        en: 'Climbing season only — roughly early July to early September. Off-season the route is snowbound, hut-less, and genuinely dangerous.',
        ja: '登山シーズン（おおむね7月上旬〜9月上旬）限定。シーズン外は積雪があり山小屋も閉まる、本当に危険な道です。'
      },
      {
        en: 'Since 2024 the Yoshida Trail requires an advance reservation and a ¥2,000 entry fee (daily cap ~4,000; the 5th-Station gate is closed roughly 2 pm–3 am except for hut guests).',
        ja: '2024年から吉田ルートは事前予約と通行料2,000円が必要です（1日の上限約4,000人。五合目ゲートは宿泊者を除きおおむね14時〜翌3時は閉鎖）。'
      },
      {
        en: 'Altitude reaches ~3,710 m — climb slowly and watch for altitude sickness. An overnight hut stay helps you acclimatize.',
        ja: '標高は約3,710mまで。ゆっくり登り、高山病に注意を。山小屋に一泊すると高度に慣らせます。'
      },
      {
        en: 'Even in summer the summit can be near freezing with high wind. Bring warm layers, rain gear, a headlamp, and cash for huts and toilets.',
        ja: '夏でも山頂は氷点下近く、強風になることも。防寒着・雨具・ヘッドランプ、山小屋やトイレ用の現金を忘れずに。'
      }
    ]
  },
  {
    slug: 'kinpu-odarumi',
    name: { en: 'Mount Kinpu (Odarumi Pass)', ja: '金峰山（大弛峠）' },
    area: { en: 'Odarumi Pass, Yamanashi', ja: '大弛峠（山梨県）' },
    lengthKm: 8.4, gainM: 510, diff: 'moderate', route: 'out', time: '3 h 15 min', season: 'Jun – Oct', dogs: 'leashed',
    permit: { en: 'No permit — free; parking at Odarumi Pass (大弛峠)', ja: '許可証不要・無料 ／ 大弛峠に駐車場あり' },
    center: { lat: 35.8733, lon: 138.6443 },
    tiles: 'jp',
    summary: {
      en: 'The gentlest way to the granite crown of Mt. Kinpu (2,599 m) — a high alpine ridge walk from Odarumi Pass, the highest road pass in Japan, over Asahidake to the iconic Gojō-iwa rock pillar with huge Mt. Fuji and Southern Alps views.',
      ja: '日本一標高の高い車道峠・大弛峠から、朝日岳を越えて金峰山（2,599m）の花崗岩の頂と象徴的な五丈岩へと至る、金峰山で最も登りやすいルート。富士山や南アルプスの大展望が広がります。'
    },
    description: {
      en: "This is the easiest of the routes up Mt. Kinpu, one of Japan's '100 Famous Mountains.' It begins high — at Odarumi Pass (大弛峠, ≈2,360 m), the highest pass in Japan reachable by car — so most of the climbing is already behind you. The trail works through subalpine forest of moss and dwarf pine over the shoulder of Asahidake (朝日岳, 2,579 m), dips into a saddle, then rises onto a boulder-strewn alpine ridge to the summit. There the giant granite tower of Gojō-iwa (五丈岩) stands against sweeping views of Mt. Fuji, Yatsugatake, and the Southern and Central Alps. Return the way you came.",
      ja: '金峰山は日本百名山のひとつ。この大弛峠ルートは、その中でも最も登りやすい道です。出発点の大弛峠（おおだるみとうげ、標高約2,360m）は車で行ける峠としては日本一高く、登りの大半をすでに終えた状態からスタートします。苔と針葉樹の亜高山帯の森を抜けて朝日岳（2,579m）の肩を越え、いったん鞍部へ下ったのち、岩の積み重なる高山的な稜線を登って山頂へ。頂上には遠くからも見える巨大な花崗岩の塔「五丈岩（ごじょういわ）」がそびえ、富士山、八ヶ岳、南・中央アルプスまで大展望が広がります。下りは往路を戻ります。'
    },
    tips: [
      {
        en: 'Starts high at Odarumi Pass (≈2,360 m) — the most approachable way up Kinpu — but the air is thin and the weather turns fast.',
        ja: '標高約2,360mの大弛峠からのスタートで、金峰山で最も手軽なルート。とはいえ空気は薄く、天候の急変に注意を。'
      },
      { en: 'The road over Odarumi Pass closes in winter; the hiking season is realistically June to October.', ja: '大弛峠を越える林道は冬季通行止め。登山適期はおおむね6〜10月です。' },
      { en: 'Boulder-hopping on the upper ridge near the summit — sturdy boots and careful footing required.', ja: '山頂付近の稜線は花崗岩の岩場。しっかりした登山靴と確実な足運びを。' },
      { en: 'Gojō-iwa is a sacred rock pillar — enjoy the views, but think twice about scrambling up it.', ja: '五丈岩は信仰の対象の岩塔。眺めて楽しみ、よじ登るのは控えめに。' }
    ],
    // a YAMAP plan (a 瑞牆山・金峰山 round trip: its own figures, shown in its card); its link, party and planner are the
    // `hiking` trip note's (docs/hiking.md "Private values")
    plan: {
      url: '{p:kinpuPlanUrl}',
      dateISO: '2026-06-27',
      party: '{p:kinpuParty}',
      distKm: 7.9,
      gainM: 557,
      pace: 90,
      paceLabel: { en: 'Relaxed', ja: 'ややゆっくり' },
      constant: 15,
      by: '{p:kinpuPlanner}',
      // 行動時間 7:00 → 13:22, the 2 h on the summit included
      totalTime: '6:22',
      sunrise: '4:30',
      sunset: '19:06',
      itinerary: [
        { time: '7:00', type: 'start', name: { en: 'Odarumi Pass (start)', ja: '大弛峠駐車場' } },
        { time: '7:39', type: 'pass', name: { en: 'Asahi Pass', ja: '朝日峠' } },
        { time: '8:18', type: 'peak', name: { en: 'Asahidake', ja: '朝日岳' } },
        { time: '8:46', type: 'junction', name: { en: 'Junction', ja: '分岐' } },
        { time: '8:52', type: 'junction', name: { en: 'Junction', ja: '分岐' } },
        { time: '9:20', depart: '11:20', type: 'peak', name: { en: 'Mt. Kinpu (summit)', ja: '金峰山（甲州御岳山）' } },
        { time: '11:42', type: 'junction', name: { en: 'Junction', ja: '分岐' } },
        { time: '11:48', type: 'junction', name: { en: 'Junction', ja: '分岐' } },
        { time: '12:21', type: 'peak', name: { en: 'Asahidake', ja: '朝日岳' } },
        { time: '12:49', type: 'pass', name: { en: 'Asahi Pass', ja: '朝日峠' } },
        { time: '13:22', type: 'goal', name: { en: 'Odarumi Pass', ja: '大弛峠' } }
      ]
    }
  },
  // walked and recorded on YAMAP (2026): the figures are the activities' own (距離, のぼり, タイム with its rests), the
  // write-ups ours; no photos came with them
  {
    slug: 'utsukushigahara',
    name: { en: 'Utsukushigahara: Ōgahana, Ōgatō & Mt. Ushibuse', ja: '美ヶ原（王ヶ鼻・王ヶ頭・牛伏山）' },
    area: { en: 'Utsukushigahara Plateau, Nagano', ja: '美ヶ原高原（長野県）' },
    lengthKm: 13.3, gainM: 372, diff: 'moderate', route: 'out', time: '6 h 1 min', season: 'May – Oct', dogs: 'leashed',
    permit: {
      en: 'No permit, free · parking at the Nature Conservation Center, or the bus from Matsumoto Station (reserve ahead)',
      ja: '許可証不要・無料 ／ 美ヶ原自然保護センターに駐車場、松本駅からバスも（予約制）'
    },
    center: { lat: 36.2285, lon: 138.118 },
    tiles: 'jp',
    summary: {
      en: 'A long, gentle walk across the 2,000 m Utsukushigahara Plateau, one of the 100 Famous Mountains: out to the stone Buddhas of Ōgahana and the high point Ōgatō (2,034 m), over the cattle pastures past Utsukushi-no-Tō to Mt. Ushibuse and the roadside station, and back, with the Northern Alps across the sky.',
      ja: '日本百名山・美ヶ原の標高約2,000mの高原を端から端まで歩く往復コース。石仏の並ぶ王ヶ鼻、最高地点の王ヶ頭（2,034m）から牧場を抜けて美しの塔、牛伏山、道の駅 美ヶ原高原へ。北アルプスを望む天空の散歩道です。'
    },
    description: {
      en: "Utsukushigahara is a broad lava plateau at the north-west end of Yatsugatake-Chūshin Kōgen Quasi-National Park. From the Utsukushigahara Nature Conservation Center the walk first heads west to Ōgahana (2,008 m), a rocky cape with a small shrine and a row of stone Buddhas looking down on the Matsumoto basin and across to the Northern Alps. It turns back past the radio towers to Ōgatō (2,034 m), the plateau's high point beside the Ōgatō Hotel, then follows the wide pasture track east, past the cattle's salt lick at Shiokureba and the stone tower Utsukushi-no-Tō, to the Yamamoto-goya huts. A short climb tops out on Mt. Ushibuse (1,990 m) before the path drops to the roadside station and the open-air art museum at Utsukushigahara Kōgen. The way back is the same. The climbs are short; the distance and the sun are the work.",
      ja: '美ヶ原は八ヶ岳中信高原国定公園の北西部にある、広い溶岩台地の高原です。美ヶ原自然保護センターから、まず西へ王ヶ鼻（2,008m）へ。小さな祠と石仏の並ぶ岩の岬で、眼下に松本平、その向こうに北アルプスが広がります。電波塔の脇を戻って、王ヶ頭ホテルの建つ最高地点・王ヶ頭（2,034m）へ。ここから牧場の中の広い道を東へ進み、牛の塩なめ場だった塩くれ場、石造りの美しの塔を経て山本小屋へ。短く登れば牛伏山（1,990m）の頂で、道の駅 美ヶ原高原と美ヶ原高原美術館へ下ります。帰りは往路を戻ります。登り下りは小さく、距離と日差しが歩きごたえです。'
    },
    tips: [
      { en: 'Around 2,000 m the wind is cold even in summer and fog rolls in fast: bring warm layers and rain gear.', ja: '標高は約2,000m。夏でも風は冷たく、霧も出やすいので、防寒着と雨具を忘れずに。' },
      { en: 'Almost no shade on the plateau: a hat, sunscreen and plenty of water.', ja: '高原には日陰がほとんどありません。帽子と日焼け止め、水は多めに。' },
      { en: 'Wide open with nowhere to shelter: watch for thunderstorms on summer afternoons.', ja: '広く開けていて逃げ場がありません。夏の午後は雷に注意を。' },
      { en: 'The path crosses cattle pastures: close each gate behind you and give the cows room.', ja: '放牧地の中を歩きます。牧柵の扉は通ったら閉め、牛には近づきすぎないように。' }
    ],
    walked: { dateISO: '2026-08-09', downM: 373, standard: '4:48', constant: 15 },
    photo: false
  },
  {
    slug: 'akagi-kurobi',
    name: { en: 'Mt. Kurobi & Mt. Komagatake (Akagi)', ja: '黒檜山・駒ヶ岳（赤城山）' },
    area: { en: 'Lake Ōnuma, Gunma', ja: '赤城大沼（群馬県）' },
    lengthKm: 5.3, gainM: 568, diff: 'moderate', route: 'loop', time: '5 h 1 min', season: 'Apr – Nov', dogs: 'leashed',
    permit: {
      en: 'No permit, free · Onoko parking by Lake Ōnuma (free, ~100 cars, toilets open in winter)',
      ja: '許可証不要・無料 ／ 大沼湖畔のおのこ駐車場（無料・約100台、冬も使えるトイレあり）'
    },
    center: { lat: 36.5545, lon: 139.189 },
    tiles: 'jp',
    summary: {
      en: "A loop over Akagi's highest peak, Mt. Kurobi (1,828 m), and Mt. Komagatake from Lake Ōnuma: a steep, rocky climb, the view from just past the summit over the lake to the mountains of Tanigawa and Nikkō, then the ridge to Komagatake and long stairs back down to the shore.",
      ja: '赤城大沼から、赤城山の最高峰・黒檜山（1,828m）と駒ヶ岳をめぐる周回コース。岩がちな急登を登りきると、山頂の先の展望地から大沼と谷川岳・日光の山々を一望。稜線を駒ヶ岳へ歩き、長い階段で湖畔へ下ります。'
    },
    description: {
      en: "Mt. Akagi, one of the 100 Famous Mountains, is a broad old volcano whose crater holds Lake Ōnuma; Mt. Kurobi on the lake's north-east rim is its highest peak. From Onoko parking the loop follows the shore past Akagi Shrine, on its little island in the lake, to the Kurobi trailhead. The climb is steep from the start, over rocks and roots with the lake showing through the trees, and reaches the summit in about an hour and a half. A few minutes further on, the viewpoint looks out over the Tanigawa range, Nikkō and, on a clear day, Mt. Fuji. The trail then follows the ridge south, down to a saddle and up to Mt. Komagatake (1,685 m), and descends west on long runs of metal stairs to the Komagatake trailhead, a short walk from the parking.",
      ja: '日本百名山の赤城山は、火口に大沼を抱く大きな古い火山で、湖の北東にそびえる黒檜山がその最高峰です。おのこ駐車場から湖畔を歩き、大沼の小島に建つ赤城神社を経て黒檜山登山口へ。登りは初めから急で、岩と木の根の道を木々の間に湖を見ながら登り、1時間半ほどで山頂に着きます。数分先の展望地からは谷川連峰や日光の山々、晴れた日には富士山まで見渡せます。続いて稜線を南へ、鞍部へ下って駒ヶ岳（1,685m）へ登り返し、西へ長い鉄の階段を下って駒ヶ岳登山口へ。駐車場はすぐそこです。'
    },
    tips: [
      { en: 'The climb to Kurobi is steep rock and roots, easier going up than down: walk the loop this way round.', ja: '黒檜山への登りは岩と木の根の急登。下るより登るほうが歩きやすいので、この向きで一周するのがおすすめです。' },
      { en: 'The descent from Komagatake is long metal stairs and slippery earth: poles help.', ja: '駒ヶ岳からの下りは長い鉄の階段と滑りやすい土の道。ストックがあると安心です。' },
      { en: "Don't turn back at the summit marker: the best view is from the viewpoint a few minutes beyond.", ja: '山頂標識で引き返さず、数分先の展望地へ。一番の眺めはそこにあります。' },
      { en: 'Snow and ice from late autumn: bring microspikes outside summer.', ja: '晩秋からは積雪や凍結があります。夏以外はチェーンスパイクを持参しましょう。' }
    ],
    walked: { dateISO: '2026-11-07', downM: 569, standard: '3:37', constant: 13 },
    photo: false
  }
];

/** A trail by its slug (null: none). */
export const trailOf = (slug: string | null | undefined): Trail | null => TRAILS.find((t) => t.slug === slug) ?? null;

/** The GPX waypoints' names in Japanese (the tracks carry the English). */
export const WPT_JA: Record<string, string> = {
  Bridge: '橋',
  Waterfall: '滝',
  Vista: '展望',
  'Optional side trip to Source Lake Overlook Trail': 'ソースレイク展望コースへの寄り道（任意）',
  'Snow Lake Viewpoint': 'スノーレイク展望地',
  'End of Snow Trail': 'スノートレイル終点',
  // the YAMAP activities' summits (scripts/hiking-tracks.ts --yamap: their landmarks' English names)
  'Mt. Ogahana': '王ヶ鼻',
  'Mt. Utsukushigahara (Ogato)': '美ヶ原（王ヶ頭）',
  'Mt. Ushibuse': '牛伏山',
  'Mt. Kurobi (Mt. Akagi)': '黒檜山（赤城山）',
  'Mt. Komagatake': '駒ヶ岳'
};

/** A trail's slug from the hiking app's link (`https://huangwaylon.github.io/hiking-trails/#/trail/lake-22`, the
 *  Seattle guide's `hike.gpx`), if it is one of ours; else null (travel/DayCard.svelte: openTrail). */
export function hikeSlugOf(url: string | undefined | null): string | null {
  const slug = /#\/trail\/([a-z0-9-]+)/.exec(url ?? '')?.[1];
  return slug && trailOf(slug) ? slug : null;
}
