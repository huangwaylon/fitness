// トレイル's chrome strings and formats (docs/hiking.md): pairs beside the data like the guides' text (its own chunk, not
// the island's catalogs), in normal Japanese with kanji like every sheet, shown in the reader's locale. Distances and heights follow the phone's km / mi
// switch (travel/units.ts); times, seasons and dates the locale.
import type { Locale } from '#lib/i18n/index.ts';
import type { Diff, Dogs, L, Route } from './types.ts';

export const S = {
  title: { ja: '梅ちゃんのトレイル', en: "Ume-chan's Trails" },
  all: { ja: 'すべて', en: 'All' },
  /** The sort chip's sheet and its picks (list.ts SORTS). */
  sort: { ja: '並べ替え', en: 'Sort' },
  sortAuto: { ja: 'おすすめ順', en: 'Suggested' },
  sortDist: { ja: '距離が短い順', en: 'Shortest' },
  sortGain: { ja: '標高差が小さい順', en: 'Least gain' },
  sortTime: { ja: '時間が短い順', en: 'Quickest' },
  regionJp: { ja: '日本', en: 'Japan' },
  regionUs: { ja: 'ワシントン州', en: 'Washington' },
  /** The list's sections (list.ts STATUSES). */
  secPlanned: { ja: '予定', en: 'Planned' },
  secWant: { ja: '行きたい', en: 'Want to go' },
  secWalked: { ja: '歩いた', en: 'Hiked' },
  none: { ja: '条件に合うコースはありません', en: 'No trails match' },
  statDist: { ja: '距離', en: 'Distance' },
  statGain: { ja: '標高差', en: 'Gain' },
  statTime: { ja: '時間', en: 'Time' },
  statDiff: { ja: '難易度', en: 'Level' },
  filterBar: { ja: 'コースの絞り込みと並べ替え', en: 'Filter and sort trails' },
  elevation: { ja: '標高グラフ', en: 'Elevation' },
  scrub: { ja: 'ドラッグでコース上の標高を確認', en: 'Drag to inspect elevation along the trail' },
  secOverview: { ja: '概要', en: 'Overview' },
  secHike: { ja: 'コース紹介', en: 'The hike' },
  secTips: { ja: 'ヒント・注意点', en: 'Tips & need-to-know' },
  secDetails: { ja: '詳細情報', en: 'Details' },
  secPlan: { ja: '山行予定', en: 'Planned hike' },
  secPlanPast: { ja: '山行日', en: 'Hiked on' },
  /** A past hike's own distance and gain (not the trail's). */
  planActual: { ja: '実際', en: 'Actual' },
  planBy: { ja: '計画者', en: 'Planned by' },
  planCourse: { ja: 'コース定数', en: 'Course rating' },
  planYamap: { ja: 'YAMAPで見る', en: 'View on YAMAP' },
  planYamapAria: { ja: 'YAMAPで見る（新しいタブで開く）', en: 'View on YAMAP (opens in a new tab)' },
  secSchedule: { ja: 'コースタイム', en: 'Schedule' },
  schedRise: { ja: '日の出', en: 'Sunrise' },
  schedSet: { ja: '日の入り', en: 'Sunset' },
  schedTotal: { ja: '行動時間', en: 'Total time' },
  factRoute: { ja: 'ルートタイプ', en: 'Route type' },
  factSeason: { ja: 'ベストシーズン', en: 'Best season' },
  factDogs: { ja: '犬', en: 'Dogs' },
  factPermit: { ja: '許可証', en: 'Permit' },
  factLocation: { ja: '場所', en: 'Location' },
  factWalked: { ja: '山行日', en: 'Hiked on' },
  factUpDown: { ja: 'のぼり／くだり', en: 'Up / down' },
  factStandard: { ja: '標準タイム', en: 'Standard time' },
  attribTrail: { ja: 'コース情報・写真：AllTrails', en: 'Trail info & photo via AllTrails.' },
  attribYamap: { ja: '軌跡・記録：YAMAP', en: 'Track & record via YAMAP.' },
  attribPlan: { ja: 'コース・計画：YAMAP', en: 'Course & plan via YAMAP.' },
  attribPhoto: { ja: '写真：', en: 'Photo: ' },
  attribPhotoOpen: { ja: '（', en: ' (' },
  /** After the photo's licence: where it's from and that the card shows it cut down (CC BY / BY-SA's "indicate changes"). */
  attribPhotoVia: { ja: '、Wikimedia Commons、トリミング・縮小）', en: ', via Wikimedia Commons, cropped and resized)' },
  attribUsgs: { ja: '地図 © USGS National Map', en: 'Map © USGS National Map' },
  attribGsi: { ja: '出典：国土地理院（地理院タイル）', en: 'Source: GSI Japan (地理院タイル)' },
  mapAria: { ja: 'コース地図', en: 'Trail map' },
  sheetToggle: { ja: 'コース詳細を開く・閉じる', en: 'Expand or collapse trail details' },
  zoomIn: { ja: '拡大', en: 'Zoom in' },
  zoomOut: { ja: '縮小', en: 'Zoom out' },
  locate: { ja: '現在地', en: 'My location' },
  locDenied: { ja: '位置情報がオフです。設定で許可してください', en: 'Location is off. Allow it in Settings' },
  /** The in-hike map (docs/hiking.md "In-hike map"): the location disc's modes and toasts, the compass, hike mode. */
  camFollow: { ja: '追従中', en: 'Following' },
  camHeading: { ja: '進行方向', en: 'Heading up' },
  camOff: { ja: '現在地オフ', en: 'Location off' },
  north: { ja: '北を上に', en: 'North up' },
  /** (a refusal sticks until Safari restarts: where to turn it back on) */
  compassDenied: { ja: '方位を使うため、コンパスへのアクセスを許可してください（設定 → アプリ → Safari → モーションと画面の向きのアクセス）', en: 'To use your heading, allow access to the compass (Settings → Apps → Safari → Motion & Orientation Access)' },
  compassCalib: { ja: '方位が不正確です。スマホを8の字に動かしてください', en: 'Heading is inaccurate. Move your phone in a figure 8' },
  hikeStart: { ja: '歩きはじめる', en: 'Start hiking' },
  hikeEnd: { ja: '終了', en: 'End' },
  hikeWalked: { ja: '歩いた', en: 'Walked' },
  hikeLeft: { ja: 'のこり', en: 'Left' },
  hikeUp: { ja: 'のぼり', en: 'Climb' },
  /** 到着's label: {goal}到着 ({goal}: 山頂 while the summit is ahead, else ゴール); its value {time}ごろ. */
  hikeSummit: { ja: '山頂', en: 'Summit' },
  hikeGoal: { ja: 'ゴール', en: 'Finish' },
  hikeArrive: { ja: '{goal}到着', en: '{goal} at' },
  hikeAbout: { ja: 'ごろ', en: '' },
  wake: { ja: '画面をつけたままにする', en: 'Keep the screen on' },
  wakeNote: { ja: '電池の減りが早くなります', en: 'Uses more battery' },
  here: { ja: '現在地', en: 'You' },
  offRoute: { ja: 'ルートから{n}m外れています', en: '{n} m off the route' },
  backOnRoute: { ja: 'ルートに戻りました', en: 'Back on the route' },
  fork: { ja: '分岐', en: 'Junction' },
  forkIn: { ja: '分岐まで{n}m', en: 'Junction in {n} m' },
  forkDir: { ja: 'ルートは{dir}', en: 'The route goes {dir}' },
  dirRight: { ja: '右', en: 'right' },
  dirLeft: { ja: '左', en: 'left' },
  dirStraight: { ja: 'まっすぐ', en: 'straight on' },
  thisRoute: { ja: 'このルート', en: 'This route' },
  refRoutes: { ja: '参考ルート', en: 'Other trails' },
  /** The trail's credits while its reference trails are loaded (ODbL: static/hiking/net/LICENSE). */
  attribOsm: { ja: '参考ルート：© OpenStreetMap contributors', en: 'Other trails: © OpenStreetMap contributors' },
  trackFailed: { ja: 'このコースの地図データを読み込めませんでした。', en: "Couldn't load this trail's map data." },
  locked: { ja: 'オンラインで開くと表示されます', en: 'Shows when opened online' },
  /** A registered hike (user.ts; the form HikeForm.svelte): ＋'s sheet, the form, its errors, a hike's card. */
  add: { ja: 'コースを追加', en: 'Add a trail' },
  edit: { ja: 'コースを編集', en: 'Edit trail' },
  srcYamap: { ja: 'YAMAPのリンクから', en: 'From a YAMAP link' },
  srcGpx: { ja: 'GPXファイルから', en: 'From a GPX file' },
  srcManual: { ja: '手で入力', en: 'Enter by hand' },
  fUrl: { ja: 'YAMAPのリンク', en: 'YAMAP link' },
  urlHint: { ja: '活動日記かモデルコースの共有リンクを貼り付けます', en: "Paste an activity's or a model course's share link" },
  load: { ja: '読み込む', en: 'Load' },
  loading: { ja: '読み込み中…', en: 'Loading…' },
  fFile: { ja: 'GPXファイル', en: 'GPX file' },
  pickFile: { ja: 'ファイルを選ぶ', en: 'Choose a file' },
  fName: { ja: 'コース名', en: 'Name' },
  nameCheck: { ja: '人の名前が入っていないか確認してください', en: "Check that it holds no one's name" },
  fArea: { ja: 'エリア', en: 'Area' },
  fDate: { ja: '日付', en: 'Date' },
  fStatus: { ja: '状況', en: 'Status' },
  fNotes: { ja: 'メモ', en: 'Notes' },
  fHours: { ja: '時間', en: 'h' },
  fMins: { ja: '分', en: 'min' },
  required: { ja: '必須', en: 'Required' },
  clear: { ja: 'クリア', en: 'Clear' },
  needName: { ja: 'コース名を入力してください', en: 'Enter a name' },
  save: { ja: '保存', en: 'Save' },
  remove: { ja: '削除', en: 'Delete' },
  editBtn: { ja: '編集', en: 'Edit' },
  removeAsk: { ja: 'このコースを削除しますか？', en: 'Delete this trail?' },
  removed: { ja: 'コースを削除しました', en: 'Trail deleted' },
  dupe: { ja: 'このコースは登録済みです', en: 'This trail is already saved' },
  errBadLink: { ja: 'YAMAPの活動日記かモデルコースのリンクを貼ってください', en: 'Paste a YAMAP activity or model course link' },
  errNotFound: { ja: '見つかりませんでした（非公開の活動日記は読み込めません）', en: "Not found (a private activity can't be read)" },
  errOffline: { ja: 'オフラインです', en: "You're offline" },
  errCapped: { ja: '今日の読み込みの上限に達しました。明日もう一度お試しください', en: "Today's imports are used up. Try again tomorrow" },
  errTimeout: { ja: 'YAMAPから応答がありませんでした。もう一度お試しください', en: "YAMAP didn't answer. Try again" },
  errUpstream: { ja: 'YAMAPから読み込めませんでした。もう一度お試しください', en: "Couldn't read it from YAMAP. Try again" },
  errTooLarge: { ja: '軌跡が大きすぎて読み込めませんでした', en: 'The track is too large to read' },
  errOther: { ja: '読み込めませんでした。もう一度お試しください', en: "Couldn't load it. Try again" },
  errGpx: { ja: 'GPXファイルを読み込めませんでした（軌跡が見つかりません）', en: "Couldn't read the GPX file (no track in it)" },
  useGpx: { ja: 'GPXファイルから追加', en: 'Add from a GPX file' },
  secRecord: { ja: '記録', en: 'Your hike' }
} satisfies Record<string, Required<L>>;

export const DIFF: Record<Diff, Required<L>> = {
  easy: { ja: '初級', en: 'Easy' },
  moderate: { ja: '中級', en: 'Moderate' },
  hard: { ja: '上級', en: 'Hard' },
  veryhard: { ja: '最上級', en: 'Very hard' }
};
export const ROUTE: Record<Route, Required<L>> = { out: { ja: '往復', en: 'Out & back' }, loop: { ja: '周回', en: 'Loop' }, p2p: { ja: '縦走', en: 'Point to point' } };
export const DOGS: Record<Dogs, Required<L>> = { leashed: { ja: 'リード必須', en: 'Leashed' }, no: { ja: '不可', en: 'Not allowed' } };

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 'Apr – Nov' → '4月〜11月' (ja); as written in English. */
export function fmtSeason(s: string, l: Locale): string {
  if (l !== 'ja') return s;
  return s.replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g, (m) => `${MON.indexOf(m) + 1}月`).replace(/\s*[–-]\s*/g, '〜');
}

/** A trail's time, one precision on every card: a single time is an estimate to 5 min (約): '3 h 17 min' → '約3時間15分'
 *  (ja), '~3h 15m' (en); '6 h 1 min' → '約6時間'; a range as written: '10 – 13 h' → '10〜13時間' / '10–13h'. */
export function fmtTime(s: string, l: Locale): string {
  const one = s.match(/^~?\s*(?:(\d+)\s*h)?\s*(?:(\d+)\s*min)?$/);
  if (one && (one[1] || one[2])) {
    const all = Math.round(((+(one[1] ?? 0)) * 60 + +(one[2] ?? 0)) / 5) * 5, h = Math.floor(all / 60), m = all % 60;
    return l === 'ja' ? `約${h ? `${h}時間` : ''}${m ? `${m}分` : ''}` : `~${[h ? `${h}h` : '', m ? `${m}m` : ''].filter(Boolean).join(' ')}`;
  }
  if (l !== 'ja') return s.replace(/\s*–\s*/g, '–').replace(/\s*h\b/g, 'h').replace(/\s*min\b/g, 'm');
  return s.replace(/~/g, '約').replace(/(\d+)\s*min/g, '$1分').replace(/(\d+)\s*h/g, '$1時間').replace(/\s*[–-]\s*/g, '〜').replace(/ /g, '');
}

/** Minutes → '2時間' / '39分' (ja), '2 h' / '39 min' (en). */
export function fmtDur(min: number, l: Locale): string {
  const h = Math.floor(min / 60), m = min % 60;
  if (l === 'ja') return (h ? `${h}時間` : '') + (m ? `${m}分` : '') || '0分';
  return [h ? `${h} h` : '', m ? `${m} min` : ''].filter(Boolean).join(' ') || '0 min';
}

/** 'h:mm' → minutes after midnight. */
const hm = (s: string): number => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};
/** Minutes from a to b, wrapping past midnight. */
export const span = (a: string, b: string): number => (hm(b) - hm(a) + 1440) % 1440;

/** A party's size with its unit: '7人', '7 hikers'. */
export const fmtParty = (n: string, l: Locale): string => (l === 'ja' ? `${n}人` : `${n} hikers`);
