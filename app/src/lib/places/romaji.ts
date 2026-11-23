// Other spellings of an area (docs/places.md "Areas"): a generic public gazetteer, so 渋谷, しぶや and Shibuya meet,
// as do シアトル and Seattle, and a city or country stands for the places in it (東京 → its 23 wards, its towns; Seattle
// → Redmond, Bellevue…). Independent of the list (public geography only): the 47 prefectures, Tokyo's wards and towns,
// the big cities and the tourist towns, and the countries and foreign cities travellers save. Romaji in Hepburn with
// long vowels marked (Jinbōchō), read with the marks dropped and m/n before b, m, p both ways (Jimbocho, Jinbocho);
// the long vowels typed out (Ryougoku) are the search key's own fold (text.ts). Pure.
import { placeKey } from './text.ts';

// Each line one place: its spellings, '|'-separated (the name first, its reading, then the romaji and the others);
// '>' then the places in it, ';'-separated. A prefecture's block is the prefecture's line, then its towns.
const TOKYO = `
千代田|ちよだ|Chiyoda > 神保町|神田神保町|じんぼうちょう|Jinbōchō; 秋葉原|あきはばら|Akihabara|Akiba; 丸の内|まるのうち|Marunouchi; 有楽町|ゆうらくちょう|Yūrakuchō; 大手町|おおてまち|Ōtemachi; 神田|かんだ|Kanda; 御茶ノ水|お茶の水|おちゃのみず|Ochanomizu; 九段下|くだんした|Kudanshita; 番町|ばんちょう|Banchō; 永田町|ながたちょう|Nagatachō; 東京駅|とうきょうえき|Tōkyō Station
中央|中央区|ちゅうおう|Chūō > 銀座|ぎんざ|Ginza; 築地|つきじ|Tsukiji; 日本橋|にほんばし|Nihonbashi; 人形町|にんぎょうちょう|Ningyōchō; 月島|つきしま|Tsukishima; 八重洲|やえす|Yaesu; 京橋|きょうばし|Kyōbashi; 勝どき|かちどき|Kachidoki; 晴海|はるみ|Harumi
港区|みなとく|Minato|Minato-ku > 六本木|ろっぽんぎ|Roppongi; 麻布|あざぶ|Azabu; 麻布十番|あざぶじゅうばん|Azabu-jūban; 赤坂|あかさか|Akasaka; 青山|あおやま|Aoyama; 表参道|おもてさんどう|Omotesandō; 新橋|しんばし|Shinbashi; 浜松町|はままつちょう|Hamamatsuchō; 虎ノ門|とらのもん|Toranomon; 白金|しろかね|Shirokane; 白金台|しろかねだい|Shirokanedai; 広尾|ひろお|Hiroo; 高輪|たかなわ|Takanawa; 三田|みた|Mita; 田町|たまち|Tamachi; お台場|台場|おだいば|Odaiba; 芝|しば|Shiba
新宿|しんじゅく|Shinjuku > 神楽坂|かぐらざか|Kagurazaka; 四谷|四ツ谷|よつや|Yotsuya; 新大久保|しんおおくぼ|Shin-Ōkubo; 大久保|おおくぼ|Ōkubo; 高田馬場|たかだのばば|Takadanobaba; 早稲田|わせだ|Waseda; 西新宿|にししんじゅく|Nishi-Shinjuku; 歌舞伎町|かぶきちょう|Kabukichō; 新宿御苑|しんじゅくぎょえん|Shinjuku Gyoen; 落合|おちあい|Ochiai
文京|ぶんきょう|Bunkyō > 本郷|ほんごう|Hongō; 湯島|ゆしま|Yushima; 根津|ねづ|Nezu; 千駄木|せんだぎ|Sendagi; 小石川|こいしかわ|Koishikawa; 後楽園|こうらくえん|Kōrakuen; 茗荷谷|みょうがだに|Myōgadani; 白山|はくさん|Hakusan; 目白台|めじろだい|Mejirodai
台東|たいとう|Taitō > 浅草|あさくさ|Asakusa; 蔵前|くらまえ|Kuramae; 上野|うえの|Ueno; 谷中|やなか|Yanaka; 御徒町|おかちまち|Okachimachi; 入谷|いりや|Iriya; 鶯谷|うぐいすだに|Uguisudani; 浅草橋|あさくさばし|Asakusabashi; 合羽橋|かっぱばし|Kappabashi; 根岸|ねぎし|Negishi
墨田|すみだ|Sumida > 両国|りょうごく|Ryōgoku; 押上|おしあげ|Oshiage; 錦糸町|きんしちょう|Kinshichō; 向島|むこうじま|Mukōjima; 本所|ほんじょ|Honjo; 曳舟|ひきふね|Hikifune; スカイツリー|Skytree
江東|こうとう|Kōtō > 清澄白河|きよすみしらかわ|Kiyosumi-shirakawa; 清澄|きよすみ|Kiyosumi; 白河|しらかわ|Shirakawa; 門前仲町|もんぜんなかちょう|Monzen-nakachō|Monnaka; 森下|もりした|Morishita; 豊洲|とよす|Toyosu; 木場|きば|Kiba; 深川|ふかがわ|Fukagawa; 亀戸|かめいど|Kameido; 有明|ありあけ|Ariake
品川|しながわ|Shinagawa > 五反田|ごたんだ|Gotanda; 大崎|おおさき|Ōsaki; 上大崎|かみおおさき|Kamiōsaki; 大井町|おおいまち|Ōimachi; 戸越銀座|とごしぎんざ|Togoshi-ginza; 天王洲|天王洲アイル|てんのうず|Tennōzu; 武蔵小山|むさしこやま|Musashi-koyama; 旗の台|はたのだい|Hatanodai
目黒|めぐろ|Meguro > 中目黒|なかめぐろ|Nakameguro|Nakame; 自由が丘|じゆうがおか|Jiyūgaoka; 祐天寺|ゆうてんじ|Yūtenji; 学芸大学|がくげいだいがく|Gakugei-daigaku; 都立大学|とりつだいがく|Toritsu-daigaku; 駒場|こまば|Komaba; 碑文谷|ひもんや|Himonya
大田|おおた|Ōta > 蒲田|かまた|Kamata; 羽田|はねだ|Haneda; 大森|おおもり|Ōmori; 田園調布|でんえんちょうふ|Den-en-chōfu; 池上|いけがみ|Ikegami
世田谷|せたがや|Setagaya > 下北沢|しもきたざわ|Shimokitazawa|Shimokita; 三軒茶屋|さんげんぢゃや|さんげんじゃや|Sangenjaya|Sancha; 二子玉川|ふたこたまがわ|Futako-tamagawa|Futakotamagawa|Nikotama; 経堂|きょうどう|Kyōdō; 豪徳寺|ごうとくじ|Gōtokuji; 松陰神社前|しょういんじんじゃまえ|Shōin-jinja-mae; 用賀|ようが|Yōga; 等々力|とどろき|Todoroki; 成城|せいじょう|Seijō; 桜新町|さくらしんまち|Sakura-shinmachi; 駒沢|こまざわ|Komazawa; 奥沢|おくさわ|Okusawa; 池尻|いけじり|Ikejiri; 千歳烏山|ちとせからすやま|Chitose-karasuyama
渋谷|しぶや|Shibuya > 恵比寿|えびす|Ebisu; 代官山|だいかんやま|Daikanyama; 原宿|はらじゅく|Harajuku; 神宮前|じんぐうまえ|Jingūmae; 代々木|よよぎ|Yoyogi; 代々木上原|よよぎうえはら|Yoyogi-uehara; 代々木公園|よよぎこうえん|Yoyogi-kōen; 富ヶ谷|とみがや|Tomigaya; 宇田川町|うだがわちょう|Udagawachō; 神泉|しんせん|Shinsen; 松濤|しょうとう|Shōtō; 幡ヶ谷|はたがや|Hatagaya; 笹塚|ささづか|Sasazuka; 初台|はつだい|Hatsudai; 広尾|ひろお|Hiroo; 道玄坂|どうげんざか|Dōgenzaka
中野|なかの|Nakano > 東中野|ひがしなかの|Higashi-Nakano; 中野坂上|なかのさかうえ|Nakano-sakaue; 新井薬師|あらいやくし|Arai-yakushi
杉並|すぎなみ|Suginami > 高円寺|こうえんじ|Kōenji; 阿佐ヶ谷|阿佐谷|あさがや|Asagaya; 荻窪|おぎくぼ|Ogikubo; 西荻窪|西荻|にしおぎくぼ|Nishi-Ogikubo|Nishiogi; 永福町|えいふくちょう|Eifukuchō; 久我山|くがやま|Kugayama
豊島|としま|Toshima > 池袋|いけぶくろ|Ikebukuro; 巣鴨|すがも|Sugamo; 目白|めじろ|Mejiro; 大塚|おおつか|Ōtsuka; 駒込|こまごめ|Komagome; 雑司が谷|ぞうしがや|Zōshigaya
北区|きたく|Kita|Kita-ku > 赤羽|あかばね|Akabane; 王子|おうじ|Ōji; 田端|たばた|Tabata; 十条|じゅうじょう|Jūjō
荒川|あらかわ|Arakawa > 日暮里|にっぽり|Nippori; 西日暮里|にしにっぽり|Nishi-Nippori; 町屋|まちや|Machiya; 三ノ輪|みのわ|Minowa
板橋|いたばし|Itabashi > 成増|なります|Narimasu
練馬|ねりま|Nerima > 石神井|しゃくじい|Shakujii; 大泉学園|おおいずみがくえん|Ōizumi-gakuen; 江古田|えこだ|Ekoda; 光が丘|ひかりがおか|Hikarigaoka
足立|あだち|Adachi > 北千住|きたせんじゅ|Kita-Senju; 千住|せんじゅ|Senju; 西新井|にしあらい|Nishiarai; 綾瀬|あやせ|Ayase
葛飾|かつしか|Katsushika > 柴又|しばまた|Shibamata; 亀有|かめあり|Kameari; 金町|かなまち|Kanamachi; 立石|たていし|Tateishi; 堀切|ほりきり|Horikiri
江戸川|えどがわ|Edogawa > 葛西|かさい|Kasai; 小岩|こいわ|Koiwa; 船堀|ふなぼり|Funabori; 西葛西|にしかさい|Nishi-Kasai
武蔵野|むさしの|Musashino > 吉祥寺|きちじょうじ|Kichijōji; 井の頭|いのかしら|Inokashira; 三鷹駅|みたかえき|Mitaka Station
三鷹|みたか|Mitaka
調布|ちょうふ|Chōfu > 深大寺|じんだいじ|Jindaiji
町田|まちだ|Machida
八王子|はちおうじ|Hachiōji > 高尾|たかお|Takao; 高尾山|たかおさん|Takaosan|Mt. Takao
立川|たちかわ|Tachikawa
国分寺|こくぶんじ|Kokubunji
国立|くにたち|Kunitachi
府中|ふちゅう|Fuchū
日野|ひの|Hino
昭島|あきしま|Akishima
小金井|こがねい|Koganei
西東京|にしとうきょう|Nishitōkyō
多摩|たま|Tama
狛江|こまえ|Komae
青梅|おうめ|Ōme > 御岳山|みたけさん|Mitakesan
あきる野|あきるの|Akiruno
奥多摩|おくたま|Okutama
檜原|ひのはら|Hinohara
大島|伊豆大島|おおしま|Ōshima|Izu Ōshima
八丈島|八丈|はちじょうじま|Hachijōjima|Hachijō
小笠原|おがさわら|Ogasawara
`;

// The other prefectures (in the code's order), each a block: the prefecture, then its towns.
const PREFS = `
北海道|ほっかいどう|Hokkaidō > 札幌|さっぽろ|Sapporo; 小樽|おたる|Otaru; 函館|はこだて|Hakodate; 旭川|あさひかわ|Asahikawa; 美瑛|びえい|Biei; 富良野|ふらの|Furano; ニセコ|にせこ|Niseko; 洞爺湖|とうやこ|Tōyako; 登別|のぼりべつ|Noboribetsu; 知床|しれとこ|Shiretoko; 釧路|くしろ|Kushiro; 帯広|おびひろ|Obihiro; 網走|あばしり|Abashiri; 阿寒|あかん|Akan; 稚内|わっかない|Wakkanai; 礼文|れぶん|Rebun; 利尻|りしり|Rishiri; 定山渓|じょうざんけい|Jōzankei
青森|あおもり|Aomori > 十和田|とわだ|Towada; 奥入瀬|おいらせ|Oirase; 弘前|ひろさき|Hirosaki; 八戸|はちのへ|Hachinohe; 酸ヶ湯|すかゆ|Sukayu
岩手|いわて|Iwate > 盛岡|もりおか|Morioka; 平泉|ひらいずみ|Hiraizumi; 花巻|はなまき|Hanamaki; 遠野|とおの|Tōno
宮城|みやぎ|Miyagi > 仙台|せんだい|Sendai; 松島|まつしま|Matsushima; 鳴子|なるこ|Naruko; 蔵王|ざおう|Zaō
秋田|あきた|Akita > 角館|かくのだて|Kakunodate; 田沢湖|たざわこ|Tazawako; 乳頭温泉|にゅうとうおんせん|Nyūtō Onsen; 男鹿|おが|Oga
山形|やまがた|Yamagata > 銀山温泉|ぎんざんおんせん|Ginzan Onsen; 山寺|やまでら|Yamadera; 米沢|よねざわ|Yonezawa; 鶴岡|つるおか|Tsuruoka; 酒田|さかた|Sakata; 尾花沢|おばなざわ|Obanazawa
福島|ふくしま|Fukushima > 会津|あいづ|Aizu; 会津若松|あいづわかまつ|Aizu-Wakamatsu; 大内宿|おおうちじゅく|Ōuchi-juku; 郡山|こおりやま|Kōriyama; いわき|Iwaki; 猪苗代|いなわしろ|Inawashiro; 喜多方|きたかた|Kitakata; 裏磐梯|うらばんだい|Urabandai
茨城|いばらき|Ibaraki > 水戸|みと|Mito; つくば|筑波|Tsukuba; 日立|ひたち|Hitachi; ひたちなか|Hitachinaka; 笠間|かさま|Kasama; 鉾田|ほこた|Hokota; 大洗|おおあらい|Ōarai; 袋田|ふくろだ|Fukuroda; 大子|だいご|Daigo; 土浦|つちうら|Tsuchiura; 牛久|うしく|Ushiku
栃木|とちぎ|Tochigi > 日光|にっこう|Nikkō; 鬼怒川|きぬがわ|Kinugawa; 那須|なす|Nasu; 那須塩原|なすしおばら|Nasushiobara; 塩原|しおばら|Shiobara; 宇都宮|うつのみや|Utsunomiya; 足利|あしかが|Ashikaga; 佐野|さの|Sano; 小山|おやま|Oyama; 益子|ましこ|Mashiko; 中禅寺湖|ちゅうぜんじこ|Chūzenjiko; 奥日光|おくにっこう|Okunikkō
群馬|ぐんま|Gunma > 草津|くさつ|Kusatsu; 伊香保|いかほ|Ikaho; 渋川|しぶかわ|Shibukawa; 前橋|まえばし|Maebashi; 高崎|たかさき|Takasaki; 水上|みなかみ|Minakami; 四万|しま|Shima Onsen; 富岡|とみおか|Tomioka; 尾瀬|おぜ|Oze
埼玉|さいたま|Saitama > 川越|かわごえ|Kawagoe; 秩父|ちちぶ|Chichibu; 長瀞|ながとろ|Nagatoro; 熊谷|くまがや|Kumagaya; 狭山|さやま|Sayama; 所沢|ところざわ|Tokorozawa; 飯能|はんのう|Hannō; 大宮|おおみや|Ōmiya; 浦和|うらわ|Urawa; 川口|かわぐち|Kawaguchi; 越谷|こしがや|Koshigaya; 草加|そうか|Sōka
千葉|ちば|Chiba > 船橋|ふなばし|Funabashi; 習志野|ならしの|Narashino; 佐倉|さくら|Sakura; 松戸|まつど|Matsudo; 柏|柏市|かしわ|Kashiwa; 流山|ながれやま|Nagareyama; 成田|なりた|Narita; 香取|佐原|かとり|Katori|Sawara; 勝浦|かつうら|Katsuura; いすみ|Isumi; 館山|たてやま|Tateyama; 南房総|みなみぼうそう|Minamibōsō; 鋸南|きょなん|Kyonan; 鋸山|のこぎりやま|Nokogiriyama; 富津|ふっつ|Futtsu; 木更津|きさらづ|Kisarazu; 長柄|ながら|Nagara; 東金|とうがね|Tōgane; 銚子|ちょうし|Chōshi; 鴨川|かもがわ|Kamogawa; 浦安|うらやす|Urayasu; 舞浜|まいはま|Maihama; 市川|いちかわ|Ichikawa; 幕張|まくはり|Makuhari; 九十九里|くじゅうくり|Kujūkuri; 一宮|いちのみや|Ichinomiya; 房総|ぼうそう|Bōsō
神奈川|かながわ|Kanagawa > 横浜|よこはま|Yokohama; みなとみらい|Minatomirai; 川崎|かわさき|Kawasaki; 鎌倉|かまくら|Kamakura; 北鎌倉|きたかまくら|Kita-Kamakura; 逗子|ずし|Zushi; 葉山|はやま|Hayama; 江の島|江ノ島|えのしま|Enoshima; 藤沢|ふじさわ|Fujisawa; 茅ヶ崎|ちがさき|Chigasaki; 横須賀|よこすか|Yokosuka; 三浦|みうら|Miura; 小田原|おだわら|Odawara; 箱根|はこね|Hakone; 強羅|ごうら|Gōra; 湯河原|ゆがわら|Yugawara; 真鶴|まなづる|Manazuru; 秦野|はだの|Hadano; 大山|おおやま|Ōyama; 丹沢|たんざわ|Tanzawa; 大和|やまと|Yamato; 松田|まつだ|Matsuda; 相模原|さがみはら|Sagamihara; 厚木|あつぎ|Atsugi; 平塚|ひらつか|Hiratsuka; 伊勢原|いせはら|Isehara
新潟|にいがた|Niigata > 佐渡|さど|Sado; 越後湯沢|湯沢|えちごゆざわ|Echigo-Yuzawa|Yuzawa; 妙高|みょうこう|Myōkō; 長岡|ながおか|Nagaoka; 村上|むらかみ|Murakami
富山|とやま|Toyama > 立山|たてやま|Tateyama; 黒部|くろべ|Kurobe; 五箇山|ごかやま|Gokayama; 高岡|たかおか|Takaoka; 氷見|ひみ|Himi
石川|いしかわ|Ishikawa > 金沢|かなざわ|Kanazawa; 加賀|かが|Kaga; 山中温泉|やまなかおんせん|Yamanaka Onsen; 和倉|わくら|Wakura; 輪島|わじま|Wajima; 能登|のと|Noto
福井|ふくい|Fukui > 敦賀|つるが|Tsuruga; 永平寺|えいへいじ|Eiheiji; 東尋坊|とうじんぼう|Tōjinbō; 勝山|かつやま|Katsuyama; 小浜|おばま|Obama
山梨|やまなし|Yamanashi > 河口湖|かわぐちこ|Kawaguchiko|Lake Kawaguchi; 富士河口湖|ふじかわぐちこ|Fujikawaguchiko; 富士吉田|ふじよしだ|Fujiyoshida; 山中湖|やまなかこ|Yamanakako|Lake Yamanaka; 忍野|忍野八海|おしの|Oshino; 北杜|ほくと|Hokuto; 甲府|こうふ|Kōfu; 大月|おおつき|Ōtsuki; 勝沼|かつぬま|Katsunuma; 身延|みのぶ|Minobu; 清里|きよさと|Kiyosato; 西湖|さいこ|Saiko; 本栖湖|もとすこ|Motosuko; 精進湖|しょうじこ|Shōjiko; 富士五湖|ふじごこ|Fuji Five Lakes
長野|ながの|Nagano > 軽井沢|かるいざわ|Karuizawa; 松本|まつもと|Matsumoto; 白馬|はくば|Hakuba; 安曇野|あづみの|Azumino; 上高地|かみこうち|Kamikōchi; 諏訪|すわ|Suwa; 小谷|おたり|Otari; 信濃|しなの|Shinano; 野沢温泉|のざわおんせん|Nozawa Onsen; 志賀高原|しがこうげん|Shiga Kōgen; 小布施|おぶせ|Obuse; 戸隠|とがくし|Togakushi; 木曽|きそ|Kiso; 妻籠|つまご|Tsumago; 奈良井|ならい|Narai; 蓼科|たてしな|Tateshina; 八ヶ岳|やつがたけ|Yatsugatake; 上田|うえだ|Ueda; 小諸|こもろ|Komoro; 地獄谷|じごくだに|Jigokudani; 湯田中|ゆだなか|Yudanaka; 大町|おおまち|Ōmachi; 乗鞍|のりくら|Norikura
岐阜|ぎふ|Gifu > 高山|飛騨高山|たかやま|Takayama; 白川郷|白川村|しらかわごう|Shirakawa-gō; 中津川|なかつがわ|Nakatsugawa; 馬籠|まごめ|Magome; 下呂|げろ|Gero; 郡上|郡上八幡|ぐじょう|Gujō; 奥飛騨|おくひだ|Okuhida; 新穂高|しんほたか|Shinhotaka; 関ケ原|せきがはら|Sekigahara
静岡|しずおか|Shizuoka > 熱海|あたみ|Atami; 伊東|いとう|Itō; 伊豆|いず|Izu; 東伊豆|ひがしいず|Higashi-Izu; 西伊豆|にしいず|Nishi-Izu; 南伊豆|みなみいず|Minami-Izu; 伊豆の国|いずのくに|Izunokuni; 伊豆高原|いずこうげん|Izu Kōgen; 下田|しもだ|Shimoda; 修善寺|しゅぜんじ|Shuzenji; 河津|かわづ|Kawazu; 熱川|あたがわ|Atagawa; 沼津|ぬまづ|Numazu; 三島|みしま|Mishima; 御殿場|ごてんば|Gotenba; 富士宮|ふじのみや|Fujinomiya; 富士|ふじ|Fuji; 浜松|はままつ|Hamamatsu; 浜名湖|はまなこ|Hamanako; 掛川|かけがわ|Kakegawa; 焼津|やいづ|Yaizu; 清水|しみず|Shimizu; 寸又峡|すまたきょう|Sumatakyō; 函南|かんなみ|Kannami
愛知|あいち|Aichi > 名古屋|なごや|Nagoya; 犬山|いぬやま|Inuyama; 常滑|とこなめ|Tokoname; 豊橋|とよはし|Toyohashi; 岡崎|おかざき|Okazaki; 瀬戸|せと|Seto; 豊田|とよた|Toyota
三重|みえ|Mie > 伊勢|いせ|Ise; 志摩|しま|Shima; 鳥羽|とば|Toba; 熊野|くまの|Kumano; 伊賀|いが|Iga; 四日市|よっかいち|Yokkaichi; 鈴鹿|すずか|Suzuka; 賢島|かしこじま|Kashikojima
滋賀|しが|Shiga > 大津|おおつ|Ōtsu; 彦根|ひこね|Hikone; 長浜|ながはま|Nagahama; 近江八幡|おうみはちまん|Ōmi-Hachiman; 琵琶湖|びわこ|Biwako|Lake Biwa; 信楽|しがらき|Shigaraki
京都|京都市|きょうと|Kyōto > 嵐山|あらしやま|Arashiyama; 嵯峨野|さがの|Sagano; 祇園|ぎおん|Gion; 左京|さきょう|Sakyō; 右京|うきょう|Ukyō; 東山|ひがしやま|Higashiyama; 中京|なかぎょう|Nakagyō; 下京|しもぎょう|Shimogyō; 上京|かみぎょう|Kamigyō; 伏見|ふしみ|Fushimi; 宇治|うじ|Uji; 天橋立|あまのはしだて|Amanohashidate; 宮津|みやづ|Miyazu; 伊根|いね|Ine; 大原|おおはら|Ōhara; 貴船|きぶね|Kibune; 鞍馬|くらま|Kurama; 舞鶴|まいづる|Maizuru; 亀岡|かめおか|Kameoka; 美山|みやま|Miyama; 河原町|かわらまち|Kawaramachi; 清水寺|きよみずでら|Kiyomizu-dera
大阪|大阪市|おおさか|Ōsaka > 梅田|うめだ|Umeda; 難波|なんば|Namba; 心斎橋|しんさいばし|Shinsaibashi; 道頓堀|どうとんぼり|Dōtonbori; 天王寺|てんのうじ|Tennōji; 新世界|しんせかい|Shinsekai; 北新地|きたしんち|Kitashinchi; 中崎町|なかざきちょう|Nakazakichō; 堺|さかい|Sakai; 箕面|みのお|Minoo; 枚方|ひらかた|Hirakata
兵庫|ひょうご|Hyōgo > 神戸|こうべ|Kōbe; 三宮|さんのみや|Sannomiya; 元町|もとまち|Motomachi; 北野|きたの|Kitano; 有馬|有馬温泉|ありま|Arima; 姫路|ひめじ|Himeji; 城崎|城崎温泉|きのさき|Kinosaki; 淡路|淡路島|あわじ|Awaji; 芦屋|あしや|Ashiya; 西宮|にしのみや|Nishinomiya; 豊岡|とよおか|Toyooka; 明石|あかし|Akashi
奈良|なら|Nara > 吉野|よしの|Yoshino; 天川|てんかわ|Tenkawa; 斑鳩|いかるが|Ikaruga; 明日香|あすか|Asuka; 橿原|かしはら|Kashihara; 十津川|とつかわ|Totsukawa; 宇陀|うだ|Uda; 生駒|いこま|Ikoma
和歌山|わかやま|Wakayama > 白浜|しらはま|Shirahama; 高野山|こうやさん|Kōyasan|Mt. Kōya; 高野|こうや|Kōya; 那智|那智勝浦|なち|Nachi; 熊野古道|くまのこどう|Kumano Kodō; 田辺|たなべ|Tanabe; 串本|くしもと|Kushimoto; 新宮|しんぐう|Shingū; 湯の峰|ゆのみね|Yunomine
鳥取|とっとり|Tottori > 倉吉|くらよし|Kurayoshi; 三朝|みささ|Misasa; 米子|よなご|Yonago; 境港|さかいみなと|Sakaiminato
島根|しまね|Shimane > 松江|まつえ|Matsue; 出雲|いずも|Izumo; 石見銀山|いわみぎんざん|Iwami Ginzan; 津和野|つわの|Tsuwano; 隠岐|おき|Oki; 玉造|たまつくり|Tamatsukuri
岡山|おかやま|Okayama > 倉敷|くらしき|Kurashiki; 直島|なおしま|Naoshima; 備前|びぜん|Bizen; 牛窓|うしまど|Ushimado; 湯原|ゆばら|Yubara
広島|ひろしま|Hiroshima > 尾道|おのみち|Onomichi; 宮島|厳島|みやじま|Miyajima|Itsukushima; 廿日市|はつかいち|Hatsukaichi; 呉|くれ|Kure; 鞆の浦|とものうら|Tomonoura; 福山|ふくやま|Fukuyama; 竹原|たけはら|Takehara; しまなみ海道|しまなみ|Shimanami Kaidō
山口|やまぐち|Yamaguchi > 下関|しものせき|Shimonoseki; 萩|はぎ|Hagi; 岩国|いわくに|Iwakuni; 角島|つのしま|Tsunoshima; 秋吉台|あきよしだい|Akiyoshidai
徳島|とくしま|Tokushima > 鳴門|なると|Naruto; 祖谷|いや|Iya; 大歩危|おおぼけ|Ōboke; 脇町|わきまち|Wakimachi
香川|かがわ|Kagawa > 高松|たかまつ|Takamatsu; 小豆島|しょうどしま|Shōdoshima; 琴平|金刀比羅|ことひら|Kotohira; 丸亀|まるがめ|Marugame; 観音寺|かんおんじ|Kan-onji
愛媛|えひめ|Ehime > 松山|まつやま|Matsuyama; 道後|道後温泉|どうご|Dōgo; 内子|うちこ|Uchiko; 今治|いまばり|Imabari; 宇和島|うわじま|Uwajima; 大洲|おおず|Ōzu
高知|こうち|Kōchi > 土佐清水|とさしみず|Tosashimizu; 四万十|しまんと|Shimanto; 室戸|むろと|Muroto; 足摺|あしずり|Ashizuri; 桂浜|かつらはま|Katsurahama; 仁淀川|によどがわ|Niyodogawa
福岡|ふくおか|Fukuoka > 博多|はかた|Hakata; 天神|てんじん|Tenjin; 太宰府|だざいふ|Dazaifu; 糸島|いとしま|Itoshima; 北九州|きたきゅうしゅう|Kitakyūshū; 門司|門司港|もじ|Moji; 小倉|こくら|Kokura; 柳川|やながわ|Yanagawa
佐賀|さが|Saga > 唐津|からつ|Karatsu; 有田|ありた|Arita; 伊万里|いまり|Imari; 嬉野|うれしの|Ureshino; 武雄|たけお|Takeo; 呼子|よぶこ|Yobuko
長崎|ながさき|Nagasaki > 五島|五島列島|ごとう|Gotō; 佐世保|させぼ|Sasebo; ハウステンボス|Huis Ten Bosch; 雲仙|うんぜん|Unzen; 島原|しまばら|Shimabara; 対馬|つしま|Tsushima; 壱岐|いき|Iki; 波佐見|はさみ|Hasami
熊本|くまもと|Kumamoto > 阿蘇|あそ|Aso; 南小国|みなみおぐに|Minamioguni; 黒川温泉|くろかわおんせん|Kurokawa Onsen; 天草|あまくさ|Amakusa; 人吉|ひとよし|Hitoyoshi; 小国|おぐに|Oguni; 高森|たかもり|Takamori; 南阿蘇|みなみあそ|Minami-Aso
大分|おおいた|Ōita > 別府|べっぷ|Beppu; 由布|ゆふ|Yufu; 湯布院|由布院|ゆふいん|Yufuin; 九重|くじゅう|Kujū; 竹田|たけた|Taketa; 臼杵|うすき|Usuki; 杵築|きつき|Kitsuki; 国東|くにさき|Kunisaki
宮崎|みやざき|Miyazaki > 高千穂|たかちほ|Takachiho; 日南|にちなん|Nichinan; 青島|あおしま|Aoshima; 都城|みやこのじょう|Miyakonojō; 綾|あや|Aya
鹿児島|かごしま|Kagoshima > 屋久島|やくしま|Yakushima; 奄美|奄美大島|あまみ|Amami; 龍郷|たつごう|Tatsugō; 指宿|いぶすき|Ibusuki; 霧島|きりしま|Kirishima; 桜島|さくらじま|Sakurajima; 知覧|ちらん|Chiran; 種子島|たねがしま|Tanegashima; 徳之島|とくのしま|Tokunoshima; 与論|よろん|Yoron; 瀬戸内|せとうち|Setouchi
沖縄|おきなわ|Okinawa > 那覇|なは|Naha; 恩納|おんな|Onna; 名護|なご|Nago; 本部|もとぶ|Motobu; 国頭|くにがみ|Kunigami; 大宜味|おおぎみ|Ōgimi; 今帰仁|なきじん|Nakijin; 南城|なんじょう|Nanjō; 読谷|よみたん|Yomitan; 北谷|ちゃたん|Chatan; 宜野湾|ぎのわん|Ginowan; 浦添|うらそえ|Urasoe; 糸満|いとまん|Itoman; 宮古島|宮古|みやこじま|Miyakojima|Miyako; 石垣|石垣島|いしがき|Ishigaki; 竹富|竹富島|たけとみ|Taketomi; 西表|西表島|いりおもて|Iriomote; 座間味|ざまみ|Zamami; 渡嘉敷|とかしき|Tokashiki; 久米島|くめじま|Kumejima; 波照間|はてるま|Hateruma; 伊江島|いえじま|Iejima; 瀬底|せそこ|Sesoko; 古宇利|古宇利島|こうり|Kōri
`;

// Abroad: each country, then its regions and cities (the Japanese spellings as a Japanese traveller writes them).
const WORLD = `
アメリカ|アメリカ合衆国|米国|United States|United States of America|USA|U.S.A.|America > ワシントン州|Washington|Washington State; ハワイ|Hawaii|Hawai'i; カリフォルニア|California; ロサンゼルス|ロス|Los Angeles|LA; サンフランシスコ|San Francisco|SF; ニューヨーク|New York|NYC; ラスベガス|Las Vegas; ポートランド|Portland; シカゴ|Chicago; ボストン|Boston; サンディエゴ|San Diego; アラスカ|Alaska
ワシントン州|Washington|Washington State > シアトル|Seattle; レドモンド|Redmond; ベルビュー|Bellevue; カークランド|Kirkland; ウッディンビル|Woodinville; イサクア|Issaquah; ボセル|Bothell; レントン|Renton; サマミッシュ|Sammamish; マーサーアイランド|Mercer Island; タコマ|Tacoma; エバレット|Everett; ノースベンド|North Bend; スノコルミー|Snoqualmie; レブンワース|Leavenworth; オリンピア|Olympia; ベインブリッジアイランド|Bainbridge Island; マウントレーニア|レーニア山|Mount Rainier; サンファン諸島|San Juan Islands
シアトル|Seattle > レドモンド|Redmond; ベルビュー|Bellevue; カークランド|Kirkland; ウッディンビル|Woodinville; イサクア|Issaquah; ボセル|Bothell; レントン|Renton; サマミッシュ|Sammamish; マーサーアイランド|Mercer Island; キャピトルヒル|Capitol Hill; バラード|Ballard; フリーモント|Fremont
ハワイ|Hawaii|Hawai'i > ホノルル|Honolulu; ワイキキ|Waikiki; オアフ|オアフ島|Oahu|O'ahu; マウイ|マウイ島|Maui; ハワイ島|Big Island; カウアイ|カウアイ島|Kauai; コナ|Kona; ヒロ|Hilo
カナダ|Canada > バンクーバー|Vancouver; ビクトリア|Victoria; トロント|Toronto; モントリオール|Montreal|Montréal; バンフ|Banff
メキシコ|Mexico|México > メキシコシティ|Mexico City|Ciudad de México|CDMX; オアハカ|Oaxaca|Oaxaca de Juárez; グアナフアト|Guanajuato; サンミゲルデアジェンデ|サン・ミゲル・デ・アジェンデ|San Miguel de Allende; カンクン|Cancún; トゥルム|Tulum; メリダ|Mérida
グアム|Guam > タモン|Tumon; ハガニア|Hagåtña|Hagatna
ベトナム|越南|Vietnam|Viet Nam > ハノイ|Hanoi|Hà Nội; ダナン|Da Nang|Đà Nẵng; ホイアン|Hoi An|Hội An; クアンナム|Quang Nam|Quảng Nam; ニンビン|Ninh Binh|Ninh Bình; ホーチミン|ホーチミン市|サイゴン|Ho Chi Minh City|Hồ Chí Minh|Saigon; フエ|Hue|Huế; ハロン湾|ハロン|Ha Long|Hạ Long|Halong Bay; サパ|Sapa|Sa Pa; ニャチャン|Nha Trang; フーコック|Phu Quoc|Phú Quốc; ダラット|Da Lat|Đà Lạt; ハイフォン|Hai Phong|Hải Phòng; クアンニン|Quang Ninh|Quảng Ninh
韓国|大韓民国|South Korea|Korea|Republic of Korea > ソウル|Seoul; 釜山|プサン|Busan|Pusan; 慶州|キョンジュ|Gyeongju; 慶尚北道|キョンサンブクト|Gyeongsangbuk-do|North Gyeongsang; 慶尚南道|キョンサンナムド|Gyeongsangnam-do|South Gyeongsang; 済州|済州島|チェジュ|Jeju; 仁川|インチョン|Incheon; 大邱|テグ|Daegu; 全州|チョンジュ|Jeonju; 江陵|カンヌン|Gangneung; 統営|トンヨン|Tongyeong; 明洞|ミョンドン|Myeongdong; 弘大|ホンデ|Hongdae; 江南|カンナム|Gangnam; 梨泰院|イテウォン|Itaewon; 京畿道|Gyeonggi-do; 江原道|Gangwon-do
慶尚北道|Gyeongsangbuk-do|North Gyeongsang > 慶州|キョンジュ|Gyeongju; 安東|アンドン|Andong; 浦項|ポハン|Pohang
慶尚南道|Gyeongsangnam-do|South Gyeongsang > 統営|トンヨン|Tongyeong; 巨済|コジェ|Geoje; 昌原|チャンウォン|Changwon; 晋州|チンジュ|Jinju
台湾|臺灣|Taiwan > 台北|臺北|タイペイ|Taipei|Taipei City; 新北|ニュータイペイ|New Taipei|New Taipei City; 台南|臺南|タイナン|Tainan; 台中|臺中|タイチュン|Taichung; 高雄|カオシュン|Kaohsiung; 九份|きゅうふん|Jiufen; 淡水|たんすい|Tamsui; 花蓮|かれん|Hualien; 宜蘭|ぎらん|Yilan; 墾丁|こんてい|Kenting; 嘉義|かぎ|Chiayi; 日月潭|にちげつたん|Sun Moon Lake; 阿里山|ありさん|Alishan; 新竹|しんちく|Hsinchu; 基隆|きーるん|Keelung; 十分|じゅうふん|Shifen
中国|中華人民共和国|China > 北京|ペキン|Beijing; 上海|シャンハイ|Shanghai; 成都|せいと|Chengdu; 西安|せいあん|Xi'an; 桂林|けいりん|Guilin; 広州|こうしゅう|Guangzhou; 深圳|しんせん|Shenzhen; 杭州|こうしゅう|Hangzhou; 蘇州|そしゅう|Suzhou; 大連|だいれん|Dalian
香港|ホンコン|Hong Kong > 九龍|クーロン|Kowloon; 尖沙咀|チムサーチョイ|Tsim Sha Tsui; 中環|セントラル; 旺角|モンコック|Mong Kok
マカオ|澳門|Macau|Macao
タイ|Thailand > バンコク|Bangkok|Krung Thep; プーケット|Phuket; チェンマイ|Chiang Mai; チェンライ|Chiang Rai; アユタヤ|Ayutthaya; クラビ|Krabi; サムイ|サムイ島|Koh Samui|Ko Samui; パタヤ|Pattaya; ホアヒン|Hua Hin; パンガン|Koh Phangan; ピピ島|Phi Phi
フィリピン|Philippines > セブ|セブ島|Cebu|Cebu City; マニラ|Manila; ボラカイ|Boracay; ボホール|Bohol; パラワン|Palawan; エルニド|El Nido; マクタン|Mactan; ラプラプ|Lapu-Lapu|Lapu Lapu; シアルガオ|Siargao; モアルボアル|Moalboal; オスロブ|Oslob
インドネシア|Indonesia > バリ|バリ島|Bali; ウブド|Ubud; スミニャック|Seminyak; クタ|Kuta; チャングー|Canggu; ジャカルタ|Jakarta|Daerah Khusus Ibukota Jakarta|DKI Jakarta; 西ジャワ|Jawa Barat|West Java; バンドン|Bandung; ボゴール|Bogor; ジョグジャカルタ|Yogyakarta|Jogja; ロンボク|Lombok; コモド|Komodo
マレーシア|Malaysia > クアラルンプール|Kuala Lumpur|Wilayah Persekutuan Kuala Lumpur|KL; マラッカ|Melaka|Malacca; ペナン|Penang|Pulau Pinang; ランカウイ|Langkawi; コタキナバル|Kota Kinabalu
シンガポール|Singapore
ラオス|Laos|Lao > ルアンパバーン|ルアンプラバン|Luang Prabang; ビエンチャン|Vientiane|Viangchan; バンビエン|Vang Vieng
カンボジア|Cambodia > シェムリアップ|Siem Reap; プノンペン|Phnom Penh
ミャンマー|Myanmar > ヤンゴン|Yangon; バガン|Bagan
インド|India > デリー|Delhi; ムンバイ|Mumbai; ジャイプール|Jaipur; アグラ|Agra; ゴア|Goa
スリランカ|Sri Lanka > コロンボ|Colombo; キャンディ|Kandy; シーギリヤ|Sigiriya; ゴール|Galle
ネパール|Nepal > カトマンズ|Kathmandu; ポカラ|Pokhara
モルディブ|Maldives > マレ|Malé|Male
オーストラリア|Australia > シドニー|Sydney; メルボルン|Melbourne; ケアンズ|Cairns; ゴールドコースト|Gold Coast; ブリスベン|Brisbane; パース|Perth; タスマニア|Tasmania; ウルル|Uluru
ニュージーランド|New Zealand|NZ|Aotearoa > オークランド|Auckland; クイーンズタウン|Queenstown; ウェリントン|Wellington; クライストチャーチ|Christchurch; ロトルア|Rotorua; テカポ|Tekapo|Lake Tekapo; ワナカ|Wānaka|Wanaka; ミルフォードサウンド|Milford Sound; マウントクック|Aoraki|Mount Cook; タウポ|Taupō|Taupo; ネルソン|Nelson; ダニーデン|Dunedin
ニューカレドニア|New Caledonia|Nouvelle-Calédonie > ヌメア|Nouméa|Noumea
フランス|France > パリ|Paris; ニース|Nice; カンヌ|Cannes; アンティーブ|Antibes; エズ|Èze|Eze; マルセイユ|Marseille; リヨン|Lyon; ボルドー|Bordeaux; ストラスブール|Strasbourg; モンサンミシェル|Mont-Saint-Michel; アヴィニョン|Avignon; プロヴァンス|Provence; コートダジュール|Côte d'Azur; シャモニー|Chamonix; アヌシー|Annecy; ヴェルサイユ|Versailles
モナコ|Monaco > モンテカルロ|Monte Carlo|Monte-Carlo
イタリア|Italy|Italia > ローマ|Rome|Roma; ベネチア|ヴェネツィア|Venice|Venezia; フィレンツェ|Florence|Firenze; ミラノ|Milan|Milano; ナポリ|Naples|Napoli; ピサ|Pisa; シエナ|Siena; ボローニャ|Bologna; アマルフィ|Amalfi; ポジターノ|Positano; カプリ|Capri; チンクエテッレ|Cinque Terre; シチリア|Sicily|Sicilia; トスカーナ|Tuscany|Toscana; ドロミテ|Dolomites|Dolomiti; コモ|Como; ヴェローナ|Verona; バチカン|Vatican
バチカン|Vatican|Vatican City
スペイン|Spain|España > バルセロナ|Barcelona; マドリード|マドリッド|Madrid; セビリア|Seville|Sevilla; グラナダ|Granada; マヨルカ|Mallorca|Majorca; パルマ|Palma; バレンシア|Valencia; サンセバスチャン|San Sebastián|Donostia; ビルバオ|Bilbao; トレド|Toledo
ポルトガル|Portugal > リスボン|Lisbon|Lisboa; ポルト|Porto
ドイツ|Germany|Deutschland > ミュンヘン|Munich|München; ベルリン|Berlin; フランクフルト|Frankfurt; ハンブルク|Hamburg; ケルン|Cologne|Köln; ローテンブルク|Rothenburg; ハイデルベルク|Heidelberg
オーストリア|Austria|Österreich > ウィーン|Vienna|Wien; ザルツブルク|Salzburg; ハルシュタット|Hallstatt; インスブルック|Innsbruck
スイス|Switzerland|Schweiz|Suisse > チューリッヒ|Zurich|Zürich; ジュネーブ|Geneva|Genève; ツェルマット|Zermatt; インターラーケン|Interlaken; グリンデルワルト|Grindelwald; ルツェルン|Lucerne|Luzern
オランダ|Netherlands|Holland|Nederland > アムステルダム|Amsterdam; ロッテルダム|Rotterdam; ユトレヒト|Utrecht
ベルギー|Belgium > ブリュッセル|Brussels|Bruxelles; ブルージュ|Bruges|Brugge; アントワープ|Antwerp
イギリス|英国|United Kingdom|UK|Britain|England > ロンドン|London; エディンバラ|Edinburgh; コッツウォルズ|Cotswolds; オックスフォード|Oxford; ケンブリッジ|Cambridge; バース|Bath; リバプール|Liverpool; マンチェスター|Manchester
アイルランド|Ireland > ダブリン|Dublin
フィンランド|Finland|Suomi > ヘルシンキ|Helsinki; ロヴァニエミ|Rovaniemi; トゥルク|Turku
エストニア|Estonia|Eesti > タリン|Tallinn
スウェーデン|Sweden > ストックホルム|Stockholm
ノルウェー|Norway > オスロ|Oslo; ベルゲン|Bergen; トロムソ|Tromsø|Tromso
デンマーク|Denmark > コペンハーゲン|Copenhagen|København
アイスランド|Iceland > レイキャビク|Reykjavík|Reykjavik
チェコ|Czechia|Czech Republic > プラハ|Prague|Praha; チェスキークルムロフ|Český Krumlov|Cesky Krumlov
ハンガリー|Hungary > ブダペスト|Budapest
クロアチア|Croatia > ドゥブロヴニク|Dubrovnik; スプリト|Split; ザグレブ|Zagreb
ギリシャ|Greece|Hellas > アテネ|Athens|Athina|Athína; サントリーニ|サントリーニ島|Santorini|Thira; イア|Oía|Oia; フィラ|Fira; ミコノス|Mykonos; クレタ|Crete
サントリーニ|サントリーニ島|Santorini|Thira > イア|Oía|Oia; フィラ|Fira
トルコ|Turkey|Türkiye > イスタンブール|Istanbul|İstanbul; ファティフ|Fatih; カッパドキア|Cappadocia; ギョレメ|Göreme|Goreme; パムッカレ|Pamukkale; アンタルヤ|Antalya
`;

interface Place {
  /** Its spellings, the name first. */
  names: string[];
  /** The places directly in it. */
  kids: Place[];
}

/** Hepburn's marks dropped (ō → o) and the foreign ones (ẵ → a, đ → d, ı → i, ø → o); kana untouched. */
const fold = (s: string): string =>
  /[À-ɏḀ-ỿ]/.test(s) ? s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/ı/g, 'i').replace(/ø/g, 'o').normalize('NFC') : s;

/** A spelling and, a Latin one, its marks dropped and (romaji) m and n before b, m, p written both ways (Jimbocho,
 *  Jinbocho). */
function variants(s: string, jp: boolean): string[] {
  if (!/[A-Za-zÀ-ɏḀ-ỿ]/.test(s)) return [s];
  const plain = fold(s);
  const out = new Set([s, plain]);
  if (jp && /[nm](?=[bmp])/i.test(plain)) {
    out.add(plain.replace(/n(?=[bmp])/g, 'm').replace(/N(?=[bmp])/g, 'M'));
    out.add(plain.replace(/m(?=[bp])/g, 'n').replace(/M(?=[bp])/g, 'N'));
  }
  return [...out];
}

const line = (s: string, jp = true): Place => ({ names: [...new Set(s.split('|').map((x) => x.trim()).filter(Boolean).flatMap((x) => variants(x, jp)))], kids: [] });

/** The places by their keys (a spelling two places share, 館山 and 立山's たてやま, keys both). */
const BY = new Map<string, Place[]>();
/** The places whose name (first spelling) a key is: a kanji name picks its own place among the ones sharing a reading. */
const OWN = new Map<string, Place[]>();
const add = (m: Map<string, Place[]>, k: string, p: Place) => {
  const l = m.get(k);
  if (!l) m.set(k, [p]);
  else if (!l.includes(p)) l.push(p);
};
/** One place per name within a block: a town under two parents (広尾 in 港区 and 渋谷), a region given its own line
 *  (ハワイ in アメリカ, then its towns). Blocks don't share one (豊島 the ward, 北区 Tokyo's and another city's). */
type Named = Map<string, Place>;

/** The place a line's part names, one per name in a block (its spellings joined). */
function place(s: string, named: Named, jp: boolean): Place {
  const p = line(s, jp);
  const first = key(p.names[0]);
  const had = named.get(first);
  if (!had) {
    named.set(first, p);
    return p;
  }
  for (const n of p.names) if (!had.names.includes(n)) had.names.push(n);
  return had;
}

/** A block's places (each line's head), each line's own under it, and each head under `parent`. */
function block(text: string, parent: Place | null, jp: boolean): Place[] {
  const tops: Place[] = [];
  const named: Named = new Map();
  for (const row of text.split('\n')) {
    if (!row.trim()) continue;
    const [head, kids = ''] = row.split('>');
    const p = place(head, named, jp);
    for (const k of kids.split(';')) {
      if (!k.trim()) continue;
      const kid = place(k, named, jp);
      if (kid !== p && !p.kids.includes(kid)) p.kids.push(kid);
    }
    if (parent && !parent.kids.includes(p)) parent.kids.push(p);
    tops.push(p);
  }
  return tops;
}

/** The key a spelling is looked up by: the search's own (text.ts placeKey) with Latin marks dropped, and a Japanese
 *  name's 都/府/県/市/区/町/村 dropped when two characters or more stay (渋谷区 → 渋谷, 港区 stays). */
function key(s: string): string {
  const k = placeKey(fold(s));
  return /^[^a-z0-9]{3,}$/.test(k) && /[都府県市区町村]$/.test(k) ? k.slice(0, -1) : k;
}

const PREF_SUFFIX = (name: string): string => (name === '北海道' ? '' : name === '東京' ? '都' : name === '京都' || name === '大阪' ? '府' : '県');

const JAPAN = line('日本|にほん|にっぽん|Japan|Nippon|Nihon');
const tokyo = line('東京|東京都|とうきょう|Tōkyō|Tokyo-to');
JAPAN.kids.push(tokyo);
block(TOKYO, tokyo, true);
for (const p of block(PREFS, JAPAN, true)) {
  const pref = p.names[0] + PREF_SUFFIX(p.names[0]);
  if (!p.names.includes(pref)) p.names.push(pref);
}
const ALL: Place[] = [JAPAN, ...block(WORLD, null, false)];

(function index(seen: Set<Place>, ps: readonly Place[]) {
  for (const p of ps) {
    if (seen.has(p)) continue;
    seen.add(p);
    for (const n of p.names) add(BY, key(n), p);
    add(OWN, key(p.names[0]), p);
    index(seen, p.kids);
  }
})(new Set(), ALL);

/** The places a name is: its own (a kanji name over a shared reading), else every place with that spelling. A name
 *  with a slash (Fatih/İstanbul) by each part. */
function find(name: string): Place[] {
  const k = key(name);
  if (!k) return [];
  const hit = OWN.get(k) ?? BY.get(k);
  if (hit) return hit;
  const parts = name.split(/\s*[/／,、]\s*/).filter(Boolean);
  return parts.length > 1 ? [...new Set(parts.flatMap(find))] : [];
}

/** Other spellings of an area, city or country (raw: 渋谷 → しぶや, Shibuya; Seattle → シアトル); [] for one it doesn't know. */
export function areaAliases(name: string): string[] {
  const k = placeKey(name);
  const out = new Set<string>();
  for (const p of find(name)) for (const n of p.names) if (placeKey(n) !== k) out.add(n);
  return [...out];
}

/** Every spelling of every place in an area, city or country, all the way down (東京 → the 23 wards and their towns,
 *  the Tama cities; Seattle → Redmond, Bellevue…; アメリカ → Washington, Seattle…); the area's own spellings not
 *  included (areaAliases). [] for one with nothing in it. */
export function areaGroup(name: string): string[] {
  const out = new Set<string>();
  const seen = new Set<Place>(find(name));
  const walk = (p: Place) => {
    for (const c of p.kids) {
      if (seen.has(c)) continue;
      seen.add(c);
      for (const n of c.names) out.add(n);
      walk(c);
    }
  };
  for (const p of find(name)) walk(p);
  return [...out];
}
