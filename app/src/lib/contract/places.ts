// 行きたい場所 (saved places, docs/backend.md "Saved places"): the couple's shared Google Maps list, pulled into the
// relay's record (relay/src/places.ts) and categorised (rules, then Workers AI); Google's details of each (hours,
// website, phone, rating, a line about it, its photos' links) scraped daily on GitHub Actions (places-details.yml →
// admin places_details) into the record too. Shared by the relay (`GET /places`, `/places/pics`, `/places/status`)
// and the app.
// Pure. The list's contents are never in the repo: the relay is the only copy.

import { isNum, isRec } from './guards.ts';

/** The categories (top → subs): every place has a top (その他 when nothing fits), a sub only when one fits.
 *  @public (relay/src/places.ts, the app's filters) */
export const PLACE_CATS = {
  麺: ['ラーメン', 'つけ麺', 'うどん', 'そば'],
  '和食・寿司': ['寿司', '天ぷら', '定食', '割烹'],
  肉: ['焼肉', '焼き鳥', 'とんかつ'],
  世界の料理: ['中華', 'イタリアン', 'カレー', 'エスニック', 'バーガー'],
  '居酒屋・バー': ['居酒屋', 'バー', 'ビール', '日本酒'],
  カフェ: ['カフェ', '喫茶店'],
  甘いもの: ['パン', 'ケーキ', '和菓子', 'アイス'],
  見どころ: ['寺社', '美術館', '景色', '公園'],
  '自然・登山': ['山', '滝', '海', 'キャンプ'],
  温泉: ['温泉', '銭湯', 'サウナ'],
  買い物: ['雑貨', '本', '服', '市場', 'アウトドア'],
  泊まる: [],
  その他: []
} as const satisfies Record<string, readonly string[]>;
export type PlaceCat = keyof typeof PLACE_CATS;
export const PLACE_CAT_KEYS = Object.keys(PLACE_CATS) as PlaceCat[];
/** @public (relay/src/places.ts) */
export const isPlaceCat = (v: unknown): v is PlaceCat => typeof v === 'string' && Object.hasOwn(PLACE_CATS, v);
/** Whether `sub` is one of `cat`'s subs. */
export const isPlaceSub = (cat: PlaceCat, sub: unknown): sub is string => typeof sub === 'string' && (PLACE_CATS[cat] as readonly string[]).includes(sub);

/** A weekly opening period: day `d` (0 Sunday … 6 Saturday) opens at `o` and closes at `c`, minutes from that day's
 *  local midnight; `c` > 1440 runs past midnight (`{d:5, o:1080, c:1560}`: Friday 18:00 to Saturday 02:00). Open all
 *  week round the clock: one period `{d:0, o:0, c:10080}`. */
export interface Period {
  d: number;
  o: number;
  c: number;
}
/** @public (relay/src/places.ts) */
export const WEEK_MIN = 7 * 1440;
const isPeriod = (v: unknown): v is Period => isRec(v) && isNum(v.d) && isNum(v.o) && isNum(v.c) && v.d >= 0 && v.d <= 6 && v.o >= 0 && v.o < 1440 && v.c > v.o && v.c <= WEEK_MIN;

/** Google's details of a place (the daily scrape's: app/scripts/places-details.ts; docs/places.md "Details"), its
 *  `det` in the payload; null: never scraped. Optional keys are absent when Google showed none. Its photos aren't
 *  here (≤ 3 links, ~190 bytes each, would triple the payload): `GET /places/pics?id=` answers their tokens. @public (relay/src/places.ts) */
export interface PlaceDet {
  /** When it was scraped (epoch seconds). */
  at: number;
  /** Google's week (null: none shown: 営業時間は不明). */
  hours: Period[] | null;
  web?: string;
  tel?: string;
  /** A line about it (≤ DESC_MAX). */
  desc?: string;
  /** The rating (0–5) and its count. */
  r?: number;
  rn?: number;
  /** Google's kind (ラーメン屋, 仏教寺院…). */
  kind?: string;
  /** Google marks it 閉業, closed for good (absent: not marked). */
  shut?: true;
  /** How many photos /places/pics has (absent: none). */
  pn?: number;
}
/** @public (relay/src/places.ts) */
export const PICS_MAX = 3;
const DESC_MAX = 240, KIND_MAX = 100, WEB_MAX = 200;
const TEL = /^[+0-9 ()-]{5,20}$/;
/** A photo's token: Google's lh3 grass-cs path without the size suffix (picUrl puts both back). */
const PIC_TOKEN = /^[A-Za-z0-9_-]{20,400}$/;
const PIC_BASE = 'https://lh3.googleusercontent.com/grass-cs/';
/** @public (the relay's check of a scraped link) */
export const picTokenOf = (url: string): string | null => {
  const t = url.startsWith(PIC_BASE) ? url.slice(PIC_BASE.length) : url;
  return PIC_TOKEN.test(t) ? t : null;
};
/** A photo token's URL at a size (Google crops to it: `-k-no` no badge). */
export const picUrl = (token: string, w: number, h: number): string => `${PIC_BASE}${token}=w${w}-h${h}-k-no`;
/** `GET /places/pics?id=`'s answer, checked: the tokens (≤ PICS_MAX), or null. */
export const picsOf = (j: unknown): string[] | null =>
  isRec(j) && Array.isArray(j.pics) && j.pics.length <= PICS_MAX && j.pics.every((t) => typeof t === 'string' && PIC_TOKEN.test(t)) ? (j.pics as string[]) : null;

/** A det checked and copied field by field (the keys in one order: the relay compares the text), or null.
 *  @public (relay/src/places.ts) */
export function placeDetOf(v: unknown): PlaceDet | null {
  if (!isRec(v) || !isNum(v.at) || v.at < 0) return null;
  if (!(v.hours === null || (Array.isArray(v.hours) && v.hours.length <= 64 && v.hours.every(isPeriod)))) return null;
  const d: PlaceDet = { at: v.at, hours: v.hours === null ? null : v.hours.map((p: Period) => ({ d: p.d, o: p.o, c: p.c })) };
  if (typeof v.web === 'string' && v.web.startsWith('https://') && v.web.length <= WEB_MAX) d.web = v.web;
  if (typeof v.tel === 'string' && TEL.test(v.tel)) d.tel = v.tel;
  if (typeof v.desc === 'string' && v.desc.trim() && !v.desc.includes('<')) d.desc = v.desc.slice(0, DESC_MAX);
  if (isNum(v.r) && v.r >= 0 && v.r <= 5) d.r = v.r;
  if (Number.isInteger(v.rn) && (v.rn as number) >= 0) d.rn = v.rn as number;
  if (typeof v.kind === 'string' && v.kind.trim() && v.kind.length <= KIND_MAX) d.kind = v.kind;
  if (v.shut === true) d.shut = true;
  if (Number.isInteger(v.pn) && (v.pn as number) > 0 && (v.pn as number) <= PICS_MAX) d.pn = v.pn as number;
  return d;
}

/** One place as the app reads it (placeRows). */
export interface Place {
  /** Its key: the Maps cid (decimal), else `f:<ftid>`, else `k:<hash of name and coords>` (placeUrl reads it). */
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** The short address ('' none). */
  addr: string;
  cat: PlaceCat;
  /** One of the cat's subs, '' none. */
  sub: string;
  /** When it was put on the list (epoch seconds). */
  added: number;
  /** Always null now (the relay's OpenStreetMap hours, dropped 2026-11-24: the vendored details' instead); kept so older
   *  builds' check (placesPayloadOf) still takes the payload. */
  hours: Period[] | null;
  /** Its IANA time zone (the hours' and openAt's). */
  tz: string;
  /** Always '' now (as `hours`). */
  web: string;
  /** The note on the list ('' none). Members only: never in the guest's payload. */
  note?: string;
  /** Who put it on the list (an index into the payload's `people`, -1 unknown). Members only. */
  by?: number;
  /** Google's details (null: not scraped yet; absent: a relay before them). */
  det?: PlaceDet | null;
}

/** `GET /places`'s answer (Authorization: Bearer <key>, any of the three keys; `?since=<ver>` for a delta). Columnar:
 *  each `cols` array has `n` entries, row i across them is one place. The guest's has no `note`, `by` or `people`
 *  (the relay strips them: server-enforced). No ETag: a delta is the cheap read. */
export interface PlacesPayload {
  /** The format (PLACES_V). */
  v: number;
  /** The list's version: grows with every change the relay writes (a poll that changed nothing keeps it). */
  ver: number;
  /** true: the whole list (replace what you have); false: what changed since `?since` (merge: applyPlaces). */
  full: boolean;
  /** The last good fetch of the list (epoch ms; null: never). */
  syncedAt: number | null;
  n: number;
  cols: {
    id: string[];
    name: string[];
    /** Degrees, 6 decimals. */
    lat: number[];
    lng: number[];
    addr: string[];
    cat: PlaceCat[];
    sub: string[];
    added: number[];
    hours: (Period[] | null)[];
    tz: string[];
    web: string[];
    note?: string[];
    by?: number[];
    /** Google's details (older relays: absent; older builds ignore it). */
    det?: (PlaceDet | null)[];
  };
  /** Ids taken off the list since `?since` (a delta only; [] in a full payload). */
  gone: string[];
  /** The adders' display names (members only). */
  people?: string[];
}
/** @public (the app's cache key) */
export const PLACES_V = 1;

/** `GET /places/status`'s answer (the same keys), and `POST /places/sync`'s (older app builds: it fetches nothing).
 *  @public (relay/src/places.ts) */
export interface PlacesStatus {
  ok: true;
  count: number;
  ver: number;
  /** The last good pull (epoch ms), the last good whole pull, null never. */
  syncedAt: number | null;
  fullAt: number | null;
  /** The last failure's class (a fetch refused, a parse failure…) and when, while it's the latest outcome. */
  lastError?: { what: string; at: number };
}

const COLS = ['id', 'name', 'lat', 'lng', 'addr', 'cat', 'sub', 'added', 'hours', 'tz', 'web'] as const;
const isStrArr = (v: unknown, n: number): v is string[] => Array.isArray(v) && v.length === n && v.every((x) => typeof x === 'string');
const isNumArr = (v: unknown, n: number): v is number[] => Array.isArray(v) && v.length === n && v.every(isNum);

/** A `GET /places` body checked (every column the right length and type), or null. */
export function placesPayloadOf(j: unknown): PlacesPayload | null {
  if (!isRec(j) || j.v !== PLACES_V || !isNum(j.ver) || typeof j.full !== 'boolean' || !isNum(j.n) || !isRec(j.cols)) return null;
  if (!(j.syncedAt === null || isNum(j.syncedAt)) || !isStrArr(j.gone, (j.gone as unknown[] | undefined)?.length ?? -1)) return null;
  const c = j.cols, n = j.n;
  for (const k of ['id', 'name', 'addr', 'sub', 'tz', 'web'] as const) if (!isStrArr(c[k], n)) return null;
  for (const k of ['lat', 'lng', 'added'] as const) if (!isNumArr(c[k], n)) return null;
  if (!Array.isArray(c.cat) || c.cat.length !== n || !c.cat.every(isPlaceCat)) return null;
  if (!Array.isArray(c.hours) || c.hours.length !== n || !c.hours.every((h) => h === null || (Array.isArray(h) && h.every(isPeriod)))) return null;
  if (c.note !== undefined && !isStrArr(c.note, n)) return null;
  if (c.by !== undefined && !isNumArr(c.by, n)) return null;
  // (a det that fails its check is read as none: one odd field never costs the list)
  if (c.det !== undefined) {
    if (!Array.isArray(c.det) || c.det.length !== n) return null;
    c.det = c.det.map((d) => (d === null ? null : placeDetOf(d)));
  }
  if (j.people !== undefined && !isStrArr(j.people, (j.people as unknown[]).length)) return null;
  return j as unknown as PlacesPayload;
}

/** A payload's rows as objects (note and by only when the payload has them). */
export function placeRows(p: PlacesPayload): Place[] {
  const c = p.cols, out: Place[] = [];
  for (let i = 0; i < p.n; i++) {
    const r: Place = { id: c.id[i], name: c.name[i], lat: c.lat[i], lng: c.lng[i], addr: c.addr[i], cat: c.cat[i], sub: c.sub[i], added: c.added[i], hours: c.hours[i], tz: c.tz[i], web: c.web[i] };
    if (c.note) r.note = c.note[i];
    if (c.by) r.by = c.by[i];
    if (c.det) r.det = c.det[i];
    out.push(r);
  }
  return out;
}

/** The rows after a payload: a full one replaces, a delta's rows replace theirs (by id) and its `gone` drop out. Newest
 *  added first (the list's order). */
export function applyPlaces(prev: readonly Place[], p: PlacesPayload): Place[] {
  const next = placeRows(p);
  if (p.full) return next.sort(byAdded);
  const m = new Map(prev.map((r) => [r.id, r]));
  for (const id of p.gone) m.delete(id);
  for (const r of next) m.set(r.id, r);
  return [...m.values()].sort(byAdded);
}
const byAdded = (a: Place, b: Place) => b.added - a.added || (a.id < b.id ? -1 : 1);

/** The columnar payload of some rows (the relay's; `people` passed for a member's). */
export function placesPayload(rows: readonly Place[], o: { ver: number; full: boolean; syncedAt: number | null; gone?: string[]; people?: string[] }): PlacesPayload {
  const cols = Object.fromEntries(COLS.map((k) => [k, rows.map((r) => r[k])])) as PlacesPayload['cols'];
  if (o.people) {
    cols.note = rows.map((r) => r.note ?? '');
    cols.by = rows.map((r) => r.by ?? -1);
  }
  cols.det = rows.map((r) => r.det ?? null);
  return { v: PLACES_V, ver: o.ver, full: o.full, syncedAt: o.syncedAt, n: rows.length, cols, gone: o.gone ?? [], ...(o.people ? { people: o.people } : {}) };
}

/** A place's link to Google Maps: by cid (opens the place itself), else a search at its coordinates. */
export function placeUrl(p: Pick<Place, 'id' | 'name' | 'lat' | 'lng'>): string {
  if (/^\d+$/.test(p.id)) return `https://maps.google.com/?cid=${p.id}`;
  return `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;
}

/** The minute of the week (0 = Sunday 00:00) at `at` (epoch ms) in `tz` (the app's "closes at"). @public */
export function weekMinute(at: number, tz: string): number {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' });
  const parts = Object.fromEntries(f.formatToParts(new Date(at)).map((x) => [x.type, x.value]));
  const d = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
  return d * 1440 + Number(parts.hour) * 60 + Number(parts.minute);
}

/** Whether the place is open at `at` (epoch ms): null when its hours are unknown. A period past Saturday midnight
 *  wraps to Sunday. */
export function openAt(hours: readonly Period[] | null, tz: string, at: number): boolean | null {
  if (!hours) return null;
  const m = weekMinute(at, tz);
  return hours.some((p) => {
    const o = p.d * 1440 + p.o, c = p.d * 1440 + p.c;
    return (m >= o && m < c) || (c > WEEK_MIN && m < c - WEEK_MIN);
  });
}
