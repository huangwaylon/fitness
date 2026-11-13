// The facilities the ITS booker can be offered (設定's 保養所ボット page, docs/design.md "Settings"): the four rosters
// (直営 · 通年 · 夏季 · 冬季, its/SITE.md §1) as the runner's config.py SKIP_HOTELS comments record them, under the
// site's own spelling where it was seen (`verified`: the exact string service_group_select returned; the rest are the
// roster pages' and may not match what the site offers). 関東 = 東京/神奈川/千葉/埼玉/群馬/栃木/茨城, by location.
// `cutoff`: the last day an application is taken, days before the stay (D−4 or D−10). The page merges in the names the
// runner has seen (view.ts hotelRows); skipping and priority are the settings', not this file's.

type HotelKind = 'direct' | 'year' | 'summer' | 'winter' | 'both';

export interface RosterHotel {
  name: string;
  region: 'kanto' | 'other';
  /** 直営, 通年, 夏季, 冬季, or 夏季・冬季; null: on no roster (kept so a re-contract can't book it unseen). */
  kind: HotelKind | null;
  cutoff: 4 | 10 | null;
  verified: boolean;
}

type Row = [name: string, kanto: boolean, kind: HotelKind | null, cutoff: 4 | 10 | null, verified: boolean];
const ROWS: Row[] = [
  ['トスラブ箱根ビオーレ', true, 'direct', 4, true],
  ['トスラブ箱根和奏林', true, 'direct', 4, true],
  ['トスラブ館山ルアーナ', true, 'direct', 4, true],
  ['NAGU 勝浦', true, 'both', 4, true],
  ['鎌倉パークホテル', true, 'summer', 4, false],
  ['ブルーベリーヒル勝浦', true, 'year', 4, true],
  ['日光千姫物語', true, 'year', 4, false],
  ['ホテルハーヴェスト那須', true, 'year', 10, true],
  ['ラビスタ横須賀観音崎テラス', true, 'year', 10, true],
  ['ホテルハーヴェスト鬼怒川', true, 'year', 10, false],
  ['リソルの森', true, 'year', 10, true],
  ['草津温泉　ホテルヴィレッジ', true, 'year', 10, true],
  ['伊香保温泉 ホテル天坊', true, 'year', 10, false],
  ['ホテルオークラ東京ベイ', true, 'year', 10, true],
  ['フルーツパーク富士屋ホテル', false, 'summer', 4, true],
  ['プレジャーリゾート伊豆赤沢温泉', false, 'summer', 4, false],
  ['軽井沢マリオットホテル', false, 'summer', 4, false],
  ['グランドメルキュール伊勢志摩', false, 'summer', 4, true],
  ['スパリゾートハワイアンズ モノリスタワー', false, 'summer', 4, false],
  ['定山渓 ゆらく草庵', false, 'summer', 4, true],
  ['高山グリーンホテル', false, 'summer', 4, false],
  ['アオアヲナルトリゾート', false, 'summer', 4, true],
  ['蓼科東急ホテル', false, 'both', 4, true],
  ['NASPAニューオータニ', false, 'both', 4, true],
  ['ホテル日航アリビラ', false, 'both', 4, true],
  ['ラビスタ函館ベイANNEX', false, 'winter', 4, false],
  ['熱海後楽園ホテル', false, 'year', 4, false],
  ['ラビスタ熱海テラス', false, 'year', 10, false],
  ['ラビスタ富士河口湖', false, 'year', 10, true],
  ['ホテルハーヴェスト旧軽井沢', false, 'year', 10, true],
  ['ホテルハーヴェスト斑尾', false, 'year', 10, true],
  ['ホテルハーヴェスト伊東', false, 'year', 10, true],
  ['ホテルハーヴェスト浜名湖', false, 'year', 10, false],
  ['鳴子温泉　湯元　吉祥', false, 'year', 10, true],
  ['和倉温泉 あえの風', false, 'year', 10, false],
  ['ホテル琵琶レイクオーツカ', false, 'year', 10, false],
  ['ホテル日航プリンセス京都', false, 'year', 10, true],
  ['ホテルハーヴェスト京都鷹峯', false, 'year', 10, false],
  ['ホテルハーヴェスト有馬六彩', false, 'year', 10, false],
  ['ホテルハーヴェスト南紀田辺', false, 'year', 10, true],
  ['ゆふいん山水館', false, 'year', 10, false],
  ['ホテルハーヴェスト　スキージャム勝山', false, null, null, false]
];

/** 関東 first, then the rest; within each, D−4 before D−10 (the nearer stays). */
export const ROSTER: readonly RosterHotel[] = ROWS.map(([name, kanto, kind, cutoff, verified]) => ({ name, region: kanto ? 'kanto' : 'other', kind, cutoff, verified }));
