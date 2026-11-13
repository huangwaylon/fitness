// The facilities the ITS booker can be offered (設定's 保養所ボット page, docs/design.md "Settings"): the four rosters
// (直営 · 通年 · 夏季 · 冬季, its/SITE.md §1) as the runner's config.py SKIP_HOTELS comments record them, under the
// site's own spelling where it was seen (`verified`: the exact string service_group_select returned; the rest are the
// roster pages' and may not match what the site offers). The single source of the roster (the runner keeps a pointer).
// `region` (the user, 2026-11-13), by location, retag here: 関東 = 東京・神奈川・千葉・埼玉・群馬・栃木・茨城 (箱根, 那須,
// 日光 too); 近郊 = by train from Tokyo outside 関東 (熱海・伊東・伊豆・河口湖/富士・軽井沢・越後湯沢・浜名湖); 遠方 = the
// rest (いわき, 蓼科 and 斑尾 too: the user's moves, 2026-11-13).
// `cutoff`: the last day an application is taken, days before the stay (D4 or D10). The page merges in the names the
// runner has seen (view.ts hotelRows); what is searched is the settings', not this file's.

type HotelKind = 'direct' | 'year' | 'summer' | 'winter' | 'both';
export type Region = 'kanto' | 'near' | 'far';

/** Applications close 4 or 10 days before the stay (the roster's two cutoffs). */
export const D4 = 4;
export const D10 = 10;
type Cutoff = typeof D4 | typeof D10;
/** The summer roster's last stay, MM-DD (夏季 facilities are offered up to it: its/SITE.md §1, the boundary inferred). */
export const SUMMER_LAST = '09-30';
/** The winter roster's window, MM-DD, across the new year (冬季 facilities are offered from WINTER_FIRST to WINTER_LAST;
 *  unmeasured, its/runner/config.py: a guess at the ski season). A 夏季・冬季 facility takes neither in the gap between
 *  (10-01 to 11-30). */
export const WINTER_FIRST = '12-01';
export const WINTER_LAST = '03-31';

export interface RosterHotel {
  name: string;
  region: Region;
  /** 直営, 通年, 夏季, 冬季, or 夏季・冬季; null: on no roster (kept so a re-contract can't book it unseen). */
  kind: HotelKind | null;
  cutoff: Cutoff | null;
  verified: boolean;
}

type Row = [name: string, region: Region, kind: HotelKind | null, cutoff: Cutoff | null, verified: boolean];
const ROWS: Row[] = [
  ['トスラブ箱根ビオーレ', 'kanto', 'direct', D4, true],                 // 神奈川・箱根
  ['トスラブ箱根和奏林', 'kanto', 'direct', D4, true],                   // 神奈川・箱根
  ['トスラブ館山ルアーナ', 'kanto', 'direct', D4, true],                 // 千葉・館山
  ['NAGU 勝浦', 'kanto', 'both', D4, true],                              // 千葉・勝浦
  ['鎌倉パークホテル', 'kanto', 'summer', D4, false],                    // 神奈川・鎌倉
  ['ブルーベリーヒル勝浦', 'kanto', 'year', D4, true],                   // 千葉・勝浦
  ['日光千姫物語', 'kanto', 'year', D4, false],                          // 栃木・日光
  ['ホテルハーヴェスト那須', 'kanto', 'year', D10, true],                // 栃木・那須
  ['ラビスタ横須賀観音崎テラス', 'kanto', 'year', D10, true],            // 神奈川・横須賀
  ['ホテルハーヴェスト鬼怒川', 'kanto', 'year', D10, false],             // 栃木・鬼怒川
  ['リソルの森', 'kanto', 'year', D10, true],                            // 千葉・長柄
  ['草津温泉　ホテルヴィレッジ', 'kanto', 'year', D10, true],            // 群馬・草津
  ['伊香保温泉 ホテル天坊', 'kanto', 'year', D10, false],                // 群馬・伊香保
  ['ホテルオークラ東京ベイ', 'kanto', 'year', D10, true],                // 千葉・舞浜
  ['フルーツパーク富士屋ホテル', 'near', 'summer', D4, true],            // 山梨・山梨市
  ['プレジャーリゾート伊豆赤沢温泉', 'near', 'summer', D4, false],       // 静岡・伊豆高原
  ['軽井沢マリオットホテル', 'near', 'summer', D4, false],               // 長野・軽井沢
  ['グランドメルキュール伊勢志摩', 'far', 'summer', D4, true],           // 三重・志摩
  ['スパリゾートハワイアンズ モノリスタワー', 'far', 'summer', D4, false], // 福島・いわき
  ['定山渓 ゆらく草庵', 'far', 'summer', D4, true],                      // 北海道・札幌
  ['高山グリーンホテル', 'far', 'summer', D4, false],                    // 岐阜・高山
  ['アオアヲナルトリゾート', 'far', 'summer', D4, true],                 // 徳島・鳴門
  ['蓼科東急ホテル', 'far', 'both', D4, true],                           // 長野・茅野
  ['NASPAニューオータニ', 'near', 'both', D4, true],                     // 新潟・越後湯沢 (上越新幹線)
  ['ホテル日航アリビラ', 'far', 'both', D4, true],                       // 沖縄・読谷
  ['ラビスタ函館ベイANNEX', 'far', 'winter', D4, false],                 // 北海道・函館
  ['熱海後楽園ホテル', 'near', 'year', D4, false],                       // 静岡・熱海
  ['ラビスタ熱海テラス', 'near', 'year', D10, false],                    // 静岡・熱海
  ['ラビスタ富士河口湖', 'near', 'year', D10, true],                     // 山梨・河口湖
  ['ホテルハーヴェスト旧軽井沢', 'near', 'year', D10, true],             // 長野・軽井沢
  ['ホテルハーヴェスト斑尾', 'far', 'year', D10, true],                  // 長野・飯山
  ['ホテルハーヴェスト伊東', 'near', 'year', D10, true],                 // 静岡・伊東
  ['ホテルハーヴェスト浜名湖', 'near', 'year', D10, false],              // 静岡・浜松 (東海道新幹線)
  ['鳴子温泉　湯元　吉祥', 'far', 'year', D10, true],                    // 宮城・鳴子
  ['和倉温泉 あえの風', 'far', 'year', D10, false],                      // 石川・七尾
  ['ホテル琵琶レイクオーツカ', 'far', 'year', D10, false],               // 滋賀・大津
  ['ホテル日航プリンセス京都', 'far', 'year', D10, true],                // 京都
  ['ホテルハーヴェスト京都鷹峯', 'far', 'year', D10, false],             // 京都
  ['ホテルハーヴェスト有馬六彩', 'far', 'year', D10, false],             // 兵庫・有馬
  ['ホテルハーヴェスト南紀田辺', 'far', 'year', D10, true],              // 和歌山・田辺
  ['ゆふいん山水館', 'far', 'year', D10, false],                         // 大分・由布院
  ['ホテルハーヴェスト　スキージャム勝山', 'far', null, null, false]     // 福井・勝山
];

/** In the order the page lists them (a group at a time: 関東, 近郊, 遠方), D−4 before D−10 within each roster. */
export const ROSTER: readonly RosterHotel[] = ROWS.map(([name, region, kind, cutoff, verified]) => ({ name, region, kind, cutoff, verified }));
