// 保存した場所's chrome strings and formats (docs/places.md): pairs beside the data like トレイル's (its own chunk, not
// the island's catalogs), normal Japanese with kanji as every sheet. The hours line and the sync's age said here.
import type { Locale } from '#lib/i18n/index.ts';
import type { HoursNow } from './hours.ts';
import { hm } from './hours.ts';
import type { Sort } from './search.ts';

type L = { ja: string; en: string };

export const S = {
  title: { ja: '保存した場所', en: 'Saved places' },
  search: { ja: '店名・エリア・ジャンル・メモで検索', en: 'Search names, areas, kinds, notes' },
  loading: { ja: '読み込み中…', en: 'Loading…' },
  mapOffline: { ja: '地図はオフラインです（場所のみ表示）', en: 'Map offline (places only)' },
  offline: { ja: 'オフライン', en: 'Offline' },
  firstOffline: { ja: 'オフラインのため読み込めませんでした', en: "Couldn't load: you're offline" },
  failed: { ja: '読み込めませんでした', en: "Couldn't load" },
  none: { ja: '見つかりませんでした', en: 'Nothing found' },
  inView: { ja: 'この範囲', en: 'In view' },
  noneInView: { ja: 'この範囲に保存した場所はありません', en: 'No saved places in this area' },
  showAll: { ja: '全体を見る', en: 'Show all' },
  whole: { ja: '全体', en: 'all' },
  clearAll: { ja: '条件を全部外す', en: 'Clear all' },
  clearText: { ja: '入力を消去', en: 'Clear text' },
  /** The location refused: the maps' note (map/strings.ts MS.refused), then this line. */
  pickHint: { ja: '地図を長押しで地点を選べます', en: 'Long-press the map to pick a spot' },
  empty: { ja: '保存した場所はまだありません', en: 'No saved places yet' },
  searchNear: { ja: 'この周辺で探す', en: 'Search around it' },
  sort: { ja: '並べ替え', en: 'Sort' },
  filters: { ja: '並べ替えと絞り込み', en: 'Sort and filter' },
  removeChip: { ja: 'を外す', en: ': remove' },
  map: { ja: '保存した場所の地図', en: 'Map of saved places' },
  list: { ja: '検索結果', en: 'Results' },
  locate: { ja: '現在地', en: 'My location' },
  sheetToggle: { ja: 'シートを広げる・たたむ', en: 'Expand or collapse the sheet' },
  isNew: { ja: 'NEW', en: 'NEW' },
  more: { ja: 'その他の操作', en: 'More' },
  route: { ja: '経路', en: 'Directions' },
  gmaps: { ja: 'Googleマップ', en: 'Google Maps' },
  copy: { ja: 'コピー', en: 'Copy' },
  copied: { ja: '住所をコピーしました', en: 'Address copied' },
  web: { ja: 'ウェブサイト', en: 'Website' },
  tel: { ja: '電話', en: 'Call' },
  photos: { ja: '写真：Googleマップ', en: 'Photos: Google Maps' },
  noteHint: { ja: 'メモはGoogleマップで編集', en: 'Edit notes in Google Maps' },
  added: { ja: '保存日', en: 'Saved' },
  week: { ja: '営業時間', en: 'Hours' },
  dayOff: { ja: '定休日', en: 'Closed' },
  layer: { ja: '保存した場所', en: 'Saved places' },
  close: { ja: '閉じる', en: 'Close' }
} as const satisfies Record<string, L>;

export const SORT_LABEL: Record<Sort, L> = {
  near: { ja: '近い順', en: 'Nearest' },
  new: { ja: '保存が新しい順', en: 'Newest saved' },
  rate: { ja: '評価順', en: 'Top rated' }
};

/** 絞り込み (PlacesFilter) and the search's own lines (PlacesView): `{n}` a count, `{w}` a word, `{c}` a chip. */
export const SF = {
  title: { ja: '絞り込み', en: 'Filter' },
  sort: { ja: '並び順', en: 'Sort' },
  hours: { ja: '営業', en: 'Hours' },
  any: { ja: '指定なし', en: 'Any' },
  open: { ja: '営業中', en: 'Open now' },
  today: { ja: '今日営業', en: 'Open today' },
  when: { ja: '日時を指定', en: 'Pick a time' },
  day: { ja: '曜日', en: 'Day' },
  todayDay: { ja: '今日', en: 'Today' },
  hour: { ja: '時刻', en: 'Time' },
  allDay: { ja: '終日', en: 'Any time' },
  rate: { ja: '評価', en: 'Rating' },
  dist: { ja: '距離', en: 'Distance' },
  saved: { ja: '保存日', en: 'Saved within' },
  memo: { ja: 'メモあり', en: 'Has a note' },
  genre: { ja: 'ジャンル', en: 'Category' },
  show: { ja: '{n}件を表示', en: 'Show {n}' },
  examples: { ja: '入力の例', en: 'Try' },
  ignored: { ja: '“{w}”は無視しました', en: 'Ignored “{w}”' },
  /** An area's outdoors none: widened (search.ts WIDE_M). */
  wide: { ja: '周辺にないので{km} km以内', en: 'None in the area: within {km} km' },
  drop: { ja: '{c}を外す', en: 'Remove {c}' },
  and: { ja: '{a}と{b}', en: '{a} and {b}' },
  textOnly: { ja: 'キーワードだけで探す', en: 'Search the words only' },
  note: { ja: 'メモ：', en: 'Note: ' },
  desc: { ja: '説明：', en: 'About: ' },
  rating: { ja: '評価{r}、{n}件', en: 'Rated {r}, {n} reviews' }
} as const satisfies Record<string, L>;

const WD_JA = '日月火水木金土', WD_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const weekday = (d: number, L: Locale): string => (L === 'ja' ? `${WD_JA[d]}曜` : WD_EN[d]);

/** The hours line and its tone (leaf open, coral closing soon, soft otherwise). */
export function hoursLine(h: HoursNow, L: Locale): { text: string; tone: 'open' | 'soon' | 'closed' | 'unknown' } {
  const ja = L === 'ja';
  switch (h.k) {
    case 'unknown': return { text: ja ? '営業時間は不明' : 'Hours unknown', tone: 'unknown' };
    case 'always': return { text: ja ? '24時間営業' : 'Open 24 hours', tone: 'open' };
    case 'open': return h.soon
      ? { text: ja ? `まもなく閉店 · ${hm(h.until)}まで` : `Closing soon · until ${hm(h.until)}`, tone: 'soon' }
      : { text: ja ? `営業中 · ${hm(h.until)}まで` : `Open · until ${hm(h.until)}`, tone: 'open' };
    case 'closed': {
      const when = h.inDays === 0 ? '' : h.inDays === 1 ? (ja ? '明日 ' : 'tomorrow ') : `${weekday(h.day, L)} `;
      const head = h.off ? (ja ? '本日定休' : 'Closed today') : ja ? '営業時間外' : 'Closed';
      return { text: ja ? `${head} · ${when}${hm(h.from)}から` : `${head} · opens ${when}${hm(h.from)}`, tone: 'closed' };
    }
  }
}

/** Google's rating on the card's sub line: 「★ 4.3 · 532,794件」 (one decimal, the count grouped). */
export function ratingText(r: number, rn: number, L: Locale): string {
  const n = rn.toLocaleString(L === 'ja' ? 'ja-JP' : 'en-US');
  return L === 'ja' ? `★ ${r.toFixed(1)} · ${n}件` : `★ ${r.toFixed(1)} · ${n} reviews`;
}

/** ⋯'s call item with the number: 「電話 03-1234-5678」 (+81 nationalised, Japan's list; other country codes kept). */
export function telLabel(tel: string, L: Locale): string {
  const n = tel.replace(/^\+81[ -]?/, '0');
  return L === 'ja' ? `電話 ${n}` : `Call ${n}`;
}

/** The photo viewer's accessible name: 「まぼろし寺の写真」. */
export function photosOf(name: string, L: Locale): string {
  return L === 'ja' ? `${name}の写真` : `Photos of ${name}`;
}

/** A photo cell's accessible name: 「まぼろし寺の写真 1/10」 (each cell its own, never the place's name ten times). */
export function photoOf(name: string, i: number, n: number, L: Locale): string {
  return L === 'ja' ? `${name}の写真 ${i + 1}/${n}` : `${name}, photo ${i + 1} of ${n}`;
}

/** The sync's age: 'たった今', '5分前', '2時間前', '2日前'. */
export function ago(ms: number, now: number, L: Locale): string {
  const m = Math.max(0, Math.floor((now - ms) / 60_000));
  if (m < 1) return L === 'ja' ? 'たった今' : 'just now';
  if (m < 60) return L === 'ja' ? `${m}分前` : `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return L === 'ja' ? `${h}時間前` : `${h} h ago`;
  const d = Math.floor(h / 24);
  return L === 'ja' ? `${d}日前` : `${d} day${d > 1 ? 's' : ''} ago`;
}
