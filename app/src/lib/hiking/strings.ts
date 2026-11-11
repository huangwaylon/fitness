// トレイル's chrome strings and formats (docs/hiking.md): pairs beside the data like the guides' text (its own chunk, not
// the island's catalogs), in normal Japanese with kanji like every sheet, shown in the reader's locale. Distances and heights follow the phone's km / mi
// switch (travel/units.ts); times, seasons and dates the locale.
import type { Locale } from '#lib/i18n/index.ts';
import type { Diff, Dogs, L, Route } from './types.ts';

export const S = {
  title: { ja: '梅ちゃんのトレイル', en: "Ume-chan's Trails" },
  all: { ja: 'すべて', en: 'All' },
  sortDist: { ja: '距離順', en: 'By distance' },
  sortGain: { ja: '標高差順', en: 'By gain' },
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
  attribUsgs: { ja: '地図 © USGS National Map', en: 'Map © USGS National Map' },
  attribGsi: { ja: '出典：国土地理院（地理院タイル）', en: 'Source: GSI Japan (地理院タイル)' },
  mapAria: { ja: 'コース地図', en: 'Trail map' },
  sheetToggle: { ja: 'コース詳細を開く・閉じる', en: 'Expand or collapse trail details' },
  zoomIn: { ja: '拡大', en: 'Zoom in' },
  zoomOut: { ja: '縮小', en: 'Zoom out' },
  locate: { ja: '現在地', en: 'My location' },
  locDenied: { ja: '位置情報がオフです。設定 → プライバシーとセキュリティ → 位置情報サービス → Safari で許可してください。', en: 'Location is off. Allow it in Settings → Privacy & Security → Location Services → Safari.' },
  trackFailed: { ja: 'このコースの地図データを読み込めませんでした。', en: "Couldn't load this trail's map data." },
  mapFailed: { ja: '地図を読み込めませんでした', en: "The map didn't load" },
  mapOffline: { ja: '地図はオフラインです（コースのみ表示）', en: 'Map offline: the trail only' },
  retry: { ja: 'もう一度', en: 'Try again' },
  locked: { ja: 'オンラインで開くと表示されます', en: 'Shows when opened online' }
} satisfies Record<string, Required<L>>;

export const DIFF: Record<Diff, Required<L>> = {
  moderate: { ja: '中級', en: 'Moderate' },
  hard: { ja: '上級', en: 'Hard' },
  veryhard: { ja: '最上級', en: 'Very hard' }
};
export const ROUTE: Record<Route, Required<L>> = { out: { ja: '往復', en: 'Out & back' }, loop: { ja: '周回', en: 'Loop' }, p2p: { ja: '縦走', en: 'Point to point' } };
export const DOGS: Record<Dogs, Required<L>> = { leashed: { ja: 'リード必須', en: 'Leashed' }, no: { ja: '不可', en: 'Not allowed' } };

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 'Apr – Nov' → '4月～11月' (ja); as written in English. */
export function fmtSeason(s: string, l: Locale): string {
  if (l !== 'ja') return s;
  return s.replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g, (m) => `${MON.indexOf(m) + 1}月`).replace(/\s*[–-]\s*/g, '～');
}

/** '3 h 17 min' → '3時間17分' (ja), '3h 17m' (en); '~3 h 30 min' → '約3時間30分'; '10 – 13 h' → '10～13時間' / '10–13h'. */
export function fmtTime(s: string, l: Locale): string {
  if (l !== 'ja') return s.replace(/\s*–\s*/g, '–').replace(/\s*h\b/g, 'h').replace(/\s*min\b/g, 'm');
  return s.replace(/~/g, '約').replace(/(\d+)\s*min/g, '$1分').replace(/(\d+)\s*h/g, '$1時間').replace(/\s*[–-]\s*/g, '～').replace(/ /g, '');
}

/** Minutes → '2時間' / '39分' (ja), '2 h' / '39 min' (en). */
export function fmtDur(min: number, l: Locale): string {
  const h = Math.floor(min / 60), m = min % 60;
  if (l === 'ja') return (h ? `${h}時間` : '') + (m ? `${m}分` : '') || '0分';
  return [h ? `${h} h` : '', m ? `${m} min` : ''].filter(Boolean).join(' ') || '0 min';
}

/** '2026-06-27' → '2026年6月27日(土)' (ja), 'Sat, Jun 27, 2026' (en): the date's own weekday (no time zone). */
export function fmtPlanDate(iso: string, l: Locale): string {
  const [y, m, d] = iso.split('-').map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  if (l === 'ja') return `${y}年${m}月${d}日(${'日月火水木金土'[wd]})`; // (formatDate's weekday, half-width)
  return `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][wd]}, ${MON[m - 1]} ${d}, ${y}`;
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
