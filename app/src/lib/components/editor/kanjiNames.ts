// The editor's kanji names for the kinds whose catalogue name is a kana spelling of a kanji word (layout/labels.ts
// labelOf; the user, 2026-11-25): いしどうろう → 石灯籠. Imported by the editor only, for its side effect (the table
// added), so the island's first load never carries it. One spelling a term (道標, 丸太, 貝殻, 氷, 広場 …);
// katakana and words written in kana stay as they are (ランタン, やかん, かかし, はにわ), and so does a word whose kanji
// is outside the app's font subsets (styles/fonts.test.ts: 狸, 杭, 錨 …).
import { addLabels } from '#lib/layout/labels.ts';

/** `kind|label`, `;` between: only the kinds whose `ja` has a kanji word spelled in kana. */
const ROWS = [
  // the island's own (layout/catalog.ts)
  'log-stool|丸太のイス;log-bench|丸太のベンチ;shishiodoshi|鹿威し;firewood|薪;stone-lantern|石灯籠;brick-well|レンガの井戸;tanuki|タヌキの置物;signpost|道標',
  'wheelbarrow|一輪車;angled-signpost|斜めの道標;destinations-signpost|世界の道標;pullup|懸垂スタンド;digital-scale|体重計;small-campfire|焚き火',
  'leaf-campfire|落ち葉の焚き火;clothesline-pole|物干しざお;sandcastle|砂のお城（夏）;snowboy|雪だるま（冬）',
  // the outdoor catalogue's (layout/outdoor.json: nh-<code>)
  'nh-f13313|アール型の街灯;nh-f13312|丸い街灯;nh-f12693|旗付きの街灯;nh-f6831|お花見の提灯;nh-f3984|貝殻のランプ;nh-f7148|浮き輪;nh-f14882|遺跡の腰掛け',
  'nh-f13746|積まれた袋;nh-f3398|石のスツール;nh-f14193|ツルの腰掛け;nh-f10742|竹のスツール;nh-f3503|氷のイス;nh-f3979|貝殻のスツール;nh-f13512|レトロな停留所',
  'nh-f12361|和風なベンチ;nh-f710|竹のベンチ;nh-f5972|ワイルドな丸太のベンチ;nh-f12688|広場のベンチ;nh-f3397|石のテーブル;nh-f3505|氷のカウンター;nh-f3497|氷のテーブル',
  'nh-f4043|丸太のラウンドテーブル;nh-f3980|貝殻のテーブル;nh-f13294|パラソル付きビーチベッド;nh-f3675|干し草のベッド;nh-f1493|乳母車;nh-f3502|氷のベッド',
  'nh-f4035|丸太のガーデンベッド;nh-f3983|貝殻のベッド;nh-f1157|石窯;nh-f14554|柚子風呂;nh-f4008|五右衛門風呂;nh-f1111|露天風呂;nh-f14572|物置;nh-f14831|木製の物置',
  'nh-f922|積まれたボトルクレート;nh-f7142|素朴なDIY作業台;nh-f1234|仮設トイレ;nh-f1131|室外機;nh-f4393|洗濯桶;nh-f3406|養蜂箱;nh-f14017|洞窟',
  'nh-f13623|山;nh-f14209|ヒカリゴケの岩;nh-f14212|ヒカリゴケの泉;nh-f13369|ミルク缶;nh-f3692|素朴な木製看板;nh-f3415|アリ塚;nh-f343|松明;nh-f13370|麦畑',
  'nh-f7379|風力発電機;nh-f13472|風車;nh-f13304|唐箕;nh-f14480|金塊のトロッコ;nh-f3808|キノコの原木;nh-f14338|月見団子;nh-f2319|水飲み場;nh-f8031|噴水',
  'nh-f1314|手洗い場;nh-f338|芝刈り機;nh-f12686|公園の噴水;nh-f2754|シンプルな井戸;nh-f3982|貝殻の噴水;nh-f3580|盆栽棚;nh-f14549|朽ち果てた木;nh-f967|花壇',
  'nh-f14192|大きなツル;nh-f12607|温室棚;nh-f3802|松の盆栽;nh-f13301|松;nh-f13577|ポット苗セット;nh-f13676|丸いトピアリー;nh-f13678|三角トピアリー',
  'nh-f6030|桜の盆栽;nh-f6032|桜の花びらの山;nh-f4269|緑の落ち葉;nh-f1023|落ち葉;nh-f4271|赤い落ち葉;nh-f4270|黄色の落ち葉;nh-f1016|鯉のぼり;nh-f1004|門松',
  'nh-f1110|餅つきセット;nh-f12208|苔むした庭石;nh-f688|五重塔;nh-f7393|石の水受け;nh-f730|高い庭石;nh-f5979|流しそうめん;nh-f7409|石の水受け（桜）',
  'nh-f7408|石の水受け（紅葉）;nh-f333|巣箱;nh-f1799|犬小屋;nh-f335|オスのフラミンゴ;nh-f336|メスのフラミンゴ;nh-f12921|ロデオ風スプリング遊具;nh-f1116|砂場',
  'nh-f4379|スプリング遊具;nh-f2329|タイヤの遊具;nh-f1199|三輪車;nh-f13188|ボール入れ;nh-f12344|野球セット;nh-f7654|電動キックボード;nh-f13578|鳥の浮き輪',
  'nh-f3345|ビーチの監視台;nh-f1141|スキー板;nh-f13161|木製のフィールド看板;nh-f4412|綿あめの屋台;nh-f1802|自販機;nh-f971|お菓子の自販機;nh-f3617|屋台',
  'nh-f13773|カーニバルな屋台;nh-f12685|広場のエア遊具;nh-f12691|広場のバルーンワゴン;nh-f12692|広場の時計;nh-f12683|広場の観覧車;nh-f12690|広場のゲーム屋台',
  'nh-f12684|広場のメリーゴーランド;nh-f1507|広場のコーヒーカップ;nh-f12803|広場の汽車;nh-f1243|花輪;nh-f1866|メニュー黒板;nh-f13207|電光掲示板',
  'nh-f12699|電飾スタンド看板;nh-f12880|スタンド看板;nh-f5150|貝殻のスピーカー;nh-f4075|ドラ;nh-f4070|手回しオルガン;nh-f13336|建設工事の足場;nh-f9568|工事中看板',
  'nh-f4196|歩行者信号機;nh-f963|消火栓;nh-f2553|鉄骨;nh-f12604|削岩機;nh-f13622|高級車;nh-f13621|軽自動車;nh-f1567|ドラム缶;nh-f3595|公園の時計;nh-f1185|電話ボックス',
  'nh-f12343|脚立;nh-f1189|積まれたタイヤ;nh-f9619|電柱;nh-f3556|竹の車止め;nh-f4140|レトロな給油機;nh-f13211|カゴ台車;nh-f7789|物干しスタンド;nh-f13709|スプレー缶',
  'nh-f13214|スチールのゴミ箱;nh-f1823|ゴミ袋;nh-f13582|お城の塔;nh-f13590|お城の壁;nh-f13302|飾り柱;nh-f5931|鉄格子;nh-f13524|中世の街並み;nh-f14887|遺跡の折れた柱',
  'nh-f13662|遺跡の飾り柱;nh-f13269|西部の街並み;nh-f3498|氷のパーテーション;nh-f3500|氷の柱;nh-f3978|貝殻のスクリーン;nh-f13543|2021年のアーチ',
  'nh-f14590|2022年のアーチ;nh-f14108|東屋;nh-f13581|お城の門;nh-f13765|素朴なパーティーライト;nh-f14018|遺跡のアーチ;nh-f13631|鳥居;nh-f3499|氷のアーチ',
  'nh-f12689|広場のアーチ;nh-f3977|貝殻のアーチ;nh-f6081|木の実のアーチ;nh-f7238|イカリのオブジェ;nh-f1266|樽;nh-f13367|ウサギのガーデンオブジェ;nh-f522|骸骨',
  'nh-f3581|干物;nh-f1624|ノームの置物;nh-f2335|灯台;nh-f7262|一斗缶;nh-f3078|観光望遠鏡;nh-f665|消波ブロック;nh-f14488|金のウサギのガーデンオブジェ',
  'nh-f13268|幌馬車;nh-f13362|剣;nh-f14213|ヒカリゴケの石像;nh-f8150|南極点;nh-f693|自由の女神;nh-f7795|石獅子;nh-f700|ピサの斜塔;nh-f3446|洋風の墓石',
  'nh-f7317|和風の墓石;nh-f1439|隕石;nh-f5676|有人宇宙船;nh-f1447|空飛ぶ円盤;nh-f1440|着陸船;nh-f1442|月面移動車;nh-f1054|月;nh-f1443|人工衛星;nh-f1186|望遠鏡',
  'nh-f4722|怪獣;nh-f14266|空中のレンガブロック;nh-f13831|キノコ地形L;nh-f13823|土管;nh-f13829|甲羅;nh-f13832|キノコ地形S;nh-f12255|けろけろけろっぴな橋',
  'nh-f12249|けろけろけろっぴな廊下;nh-f12254|けろけろけろっぴな明かり;nh-f13776|カーニバルな紙吹雪マシン;nh-f3966|大きなクリスマスツリー;nh-f14594|特大オーナメント',
  'nh-f4131|雪のイルミネーション;nh-f743|氷のミニ雪だるま;nh-f3501|氷のアート;nh-f3504|氷のツリー;nh-f5337|3段雪だるま;nh-f4087|ハロウィンな馬車;nh-f6080|大きな木の実のツリー'
].join(';');
addLabels(Object.fromEntries(ROWS.split(';').map((r) => r.split('|'))));


