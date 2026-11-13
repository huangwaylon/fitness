// The facilities the ITS booker can be offered (ボット → 保養所, docs/design.md "Bots"): the four rosters
// (直営 · 通年 · 夏季 · 冬季, its/SITE.md §1) as the runner's config.py SKIP_HOTELS comments record them, under the
// site's own spelling where it was seen (`verified`: the exact string service_group_select returned; the rest are the
// roster pages' and may not match what the site offers). The single source of the roster (the runner keeps a pointer).
// `region`, by location, retag here: 関東 = 東京・神奈川・千葉・埼玉・群馬・栃木・茨城 (箱根, 那須, 日光 too); 近郊 = by
// train from Tokyo outside 関東 (熱海・伊東・伊豆・河口湖/富士・軽井沢・越後湯沢・浜名湖); 遠方 = the rest (いわき, 蓼科
// and 斑尾 too).
// `cutoff`: the last day an application is taken, days before the stay (D4 or D10). The page merges in the names the
// runner has seen (view.ts hotelRows); what is searched is the settings', not this file's.

type HotelKind = 'direct' | 'year' | 'summer' | 'winter' | 'both';
export type Region = 'kanto' | 'near' | 'far';

/** Applications close 4 or 10 days before the stay (the roster's two cutoffs). */
export const D4 = 4;
export const D10 = 10;
type Cutoff = typeof D4 | typeof D10;
/** The 夏季 and 冬季 rosters' stays, per fiscal year (April to March), from each facility's page (its/SITE.md §1, read
 *  2026-11-13): YYYY-MM-DD, both ends taken. A 夏季・冬季 facility takes neither in the gap between (FY2026: 10-01 …
 *  12-18). Read the pages again each fiscal year and add its row; a year without one is unknown (the page then calls
 *  no facility out of season). The runner doesn't use it (the site simply doesn't offer one out of season). */
export const SEASONS: Readonly<Record<number, { summer: readonly [string, string]; winter: readonly [string, string] }>> = {
  2026: { summer: ['2026-07-01', '2026-09-30'], winter: ['2026-12-19', '2027-03-31'] }
};
/** The fiscal year a stay is in: April to March (2027-03-31 is FY2026). */
export const fiscalYear = (date: string): number => Number(date.slice(0, 4)) - (Number(date.slice(5, 7)) < 4 ? 1 : 0);

/** A facility's 利用不可日 in a fiscal year (its/SITE.md §1; "may change": read again each fiscal year): weekdays
 *  (0 = 日) and dates (YYYY-MM-DD). */
interface Closed { weekdays?: readonly number[]; dates?: readonly string[] }
/** The dates from `from` to `to`, both taken. */
function span(from: string, to: string): string[] {
  const out: string[] = [];
  for (let ms = Date.parse(from); ms <= Date.parse(to); ms += 86_400_000) out.push(new Date(ms).toISOString().slice(0, 10));
  return out;
}

export interface RosterHotel {
  name: string;
  region: Region;
  /** Where it is (箱根, 熱海, 軽井沢 …; the prefecture where no finer place is known): the list's small line, its order. */
  area: string;
  /** 直営, 通年, 夏季, 冬季, or 夏季・冬季; null: on no roster (kept so a re-contract can't book it unseen). */
  kind: HotelKind | null;
  cutoff: Cutoff | null;
  verified: boolean;
  /** 利用不可日 by fiscal year (none: open every day its season allows). */
  closed?: Readonly<Record<number, Closed>>;
}

type Row = [name: string, region: Region, kind: HotelKind | null, cutoff: Cutoff | null, verified: boolean, area: string];
const ROWS: Row[] = [
  ['トスラブ箱根ビオーレ', 'kanto', 'direct', D4, true, '箱根'],                 // 神奈川・箱根
  ['トスラブ箱根和奏林', 'kanto', 'direct', D4, true, '箱根'],                   // 神奈川・箱根
  ['トスラブ館山ルアーナ', 'kanto', 'direct', D4, true, '館山'],                 // 千葉・館山
  ['NAGU 勝浦', 'kanto', 'both', D4, true, '勝浦'],                              // 千葉・勝浦
  ['鎌倉パークホテル', 'kanto', 'summer', D4, false, '鎌倉'],                    // 神奈川・鎌倉
  ['ブルーベリーヒル勝浦', 'kanto', 'year', D4, true, '勝浦'],                   // 千葉・勝浦
  ['日光千姫物語', 'kanto', 'year', D4, false, '日光'],                          // 栃木・日光
  ['ホテルハーヴェスト那須', 'kanto', 'year', D10, true, '那須'],                // 栃木・那須
  ['ラビスタ横須賀観音崎テラス', 'kanto', 'year', D10, true, '横須賀'],            // 神奈川・横須賀
  ['ホテルハーヴェスト鬼怒川', 'kanto', 'year', D10, false, '鬼怒川'],             // 栃木・鬼怒川
  ['リソルの森', 'kanto', 'year', D10, true, '長柄'],                            // 千葉・長柄
  ['草津温泉　ホテルヴィレッジ', 'kanto', 'year', D10, true, '草津'],            // 群馬・草津
  ['伊香保温泉 ホテル天坊', 'kanto', 'year', D10, false, '伊香保'],                // 群馬・伊香保
  ['ホテルオークラ東京ベイ', 'kanto', 'year', D10, true, '舞浜'],                // 千葉・舞浜
  ['フルーツパーク富士屋ホテル', 'near', 'summer', D4, true, '山梨市'],            // 山梨・山梨市
  ['プレジャーリゾート伊豆赤沢温泉', 'near', 'summer', D4, false, '伊豆高原'],       // 静岡・伊豆高原
  ['軽井沢マリオットホテル', 'near', 'summer', D4, false, '軽井沢'],               // 長野・軽井沢
  ['グランドメルキュール伊勢志摩', 'far', 'summer', D4, true, '志摩'],           // 三重・志摩
  ['スパリゾートハワイアンズ モノリスタワー', 'far', 'summer', D4, false, 'いわき'], // 福島・いわき
  ['定山渓 ゆらく草庵', 'far', 'summer', D4, true, '定山渓'],                      // 北海道・札幌
  ['高山グリーンホテル', 'far', 'summer', D4, false, '高山'],                    // 岐阜・高山
  ['アオアヲナルトリゾート', 'far', 'summer', D4, true, '鳴門'],                 // 徳島・鳴門
  ['蓼科東急ホテル', 'far', 'both', D4, true, '蓼科'],                           // 長野・茅野
  ['NASPAニューオータニ', 'near', 'both', D4, true, '越後湯沢'],                     // 新潟・越後湯沢 (上越新幹線)
  ['ホテル日航アリビラ', 'far', 'both', D4, true, '読谷'],                       // 沖縄・読谷
  ['ラビスタ函館ベイANNEX', 'far', 'winter', D4, false, '函館'],                 // 北海道・函館
  ['熱海後楽園ホテル', 'near', 'year', D4, false, '熱海'],                       // 静岡・熱海
  ['ラビスタ熱海テラス', 'near', 'year', D10, false, '熱海'],                    // 静岡・熱海
  ['ラビスタ富士河口湖', 'near', 'year', D10, true, '河口湖'],                     // 山梨・河口湖
  ['ホテルハーヴェスト旧軽井沢', 'near', 'year', D10, true, '軽井沢'],             // 長野・軽井沢
  ['ホテルハーヴェスト斑尾', 'far', 'year', D10, true, '斑尾'],                  // 長野・飯山
  ['ホテルハーヴェスト伊東', 'near', 'year', D10, true, '伊東'],                 // 静岡・伊東
  ['ホテルハーヴェスト浜名湖', 'near', 'year', D10, false, '浜名湖'],              // 静岡・浜松 (東海道新幹線)
  ['鳴子温泉　湯元　吉祥', 'far', 'year', D10, true, '鳴子'],                    // 宮城・鳴子
  ['和倉温泉 あえの風', 'far', 'year', D10, false, '和倉'],                      // 石川・七尾
  ['ホテル琵琶レイクオーツカ', 'far', 'year', D10, false, '大津'],               // 滋賀・大津
  ['ホテル日航プリンセス京都', 'far', 'year', D10, true, '京都'],                // 京都
  ['ホテルハーヴェスト京都鷹峯', 'far', 'year', D10, false, '京都'],             // 京都
  ['ホテルハーヴェスト有馬六彩', 'far', 'year', D10, false, '有馬'],             // 兵庫・有馬
  ['ホテルハーヴェスト南紀田辺', 'far', 'year', D10, true, '田辺'],              // 和歌山・田辺
  ['ゆふいん山水館', 'far', 'year', D10, false, '由布院'],                         // 大分・由布院
  ['ホテルハーヴェスト　スキージャム勝山', 'far', null, null, false, '勝山']     // 福井・勝山
];

/** 利用不可日, FY2026 (its/SITE.md §1, each facility's page read 2026-11-13). */
const CLOSED: Record<string, Record<number, Closed>> = {
  'NAGU 勝浦': { 2026: { weekdays: [2, 3], dates: ['2026-12-31', ...span('2027-01-01', '2027-01-03')] } },
  'ラビスタ函館ベイANNEX': { 2026: { dates: ['2026-12-31', '2027-01-01', '2027-02-24', '2027-02-25'] } },
  'NASPAニューオータニ': { 2026: { dates: [...span('2026-07-24', '2026-07-26'), ...span('2026-12-30', '2027-01-02')] } },
  '蓼科東急ホテル': { 2026: { dates: [...span('2027-01-25', '2027-01-29'), ...span('2027-02-15', '2027-02-18'), ...span('2027-03-08', '2027-03-12')] } },
  'ホテル日航アリビラ': { 2026: { dates: span('2026-12-30', '2027-01-03') } }
};

/** In the roster's order (a group at a time: 関東, 近郊, 遠方), D−4 before D−10 within each roster. */
export const ROSTER: readonly RosterHotel[] = ROWS.map(([name, region, kind, cutoff, verified, area]) =>
  ({ name, region, area, kind, cutoff, verified, ...(CLOSED[name] ? { closed: CLOSED[name] } : {}) }));
