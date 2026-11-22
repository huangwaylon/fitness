// 保存した場所's relay routes as the specs see them (places.spec.ts, hiking's layer): GET /places answered by page.route
// from invented places (no real list: the repo is public), the member's with notes, the guest's without (as the relay
// strips them), `?since=` answered with a delta. No network.
import type { Page } from './fixtures.ts';
import { placesPayload, type Period, type Place, type PlaceCat } from '../src/lib/contract/places.ts';
import { RELAY } from './relay.ts';

const PLACES = `${RELAY}/places`;
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization', 'Access-Control-Allow-Methods': 'GET' };
const NOW_S = Date.parse('2026-11-04T12:00:00+09:00') / 1000;
const DAY_S = 86_400;
const week = (o: number, c: number, days = [0, 1, 2, 3, 4, 5, 6]): Period[] => days.map((d) => ({ d, o, c }));

/** Invented places about an invented spot in Tokyo (the names made up, the addresses a ward and a made-up block). */
export function fixturePlaces(): Place[] {
  const at = (id: string, name: string, cat: PlaceCat, sub: string, dLat: number, dLng: number, o: Partial<Place> = {}): Place => ({
    id, name, cat, sub, lat: 35.66 + dLat, lng: 139.7 + dLng, addr: '東京都渋谷区神南1-1-1', added: NOW_S - 40 * DAY_S, hours: null, tz: 'Asia/Tokyo', web: '', note: '', by: 0, ...o
  });
  return [
    at('101', 'テスト麺屋 いちばん', '麺', 'ラーメン', 0.001, 0.001, { hours: week(660, 1290), note: '味玉を追加する' }),
    at('102', 'かりそめ中華そば', '麺', 'ラーメン', 0.004, -0.002, { hours: week(1080, 1560, [5, 6]) }),
    at('103', '仮想うどん店', '麺', 'うどん', -0.003, 0.003, { hours: [...week(660, 900, [1, 2, 3, 4, 5, 6])] }),
    at('104', 'ためしカフェ', 'カフェ', 'カフェ', 0.002, 0.002, { hours: week(480, 750), added: NOW_S - DAY_S }),
    at('105', '見本ベーカリー', '甘いもの', 'パン', -0.001, -0.001, { hours: week(420, 1080, [0, 6]), note: 'クロワッサン' }),
    at('106', '例題の湯', '温泉', '銭湯', 0.03, 0.03, { addr: '東京都杉並区高円寺南1-1', hours: week(900, 1440, [0, 1, 2, 4, 5, 6]) }),
    at('107', 'まぼろし寺', '見どころ', '寺社', 0.05, -0.04, { addr: '東京都台東区浅草1-1' }),
    at('108', 'サンプル山', '自然・登山', '山', -0.03, -0.45, { addr: '東京都八王子市高尾町1' }),
    at('109', 'おためし酒場', '居酒屋・バー', '居酒屋', 0.0015, -0.0015, { hours: week(1020, 1380) }),
    at('110', 'ダミー書店', '買い物', '本', 0.0025, 0.0005, { hours: week(600, 1260) })
  ];
}

/** `n` invented places spread over Tokyo (the perf check's). */
export function manyPlaces(n: number): Place[] {
  const cats: [PlaceCat, string][] = [['麺', 'ラーメン'], ['カフェ', 'カフェ'], ['甘いもの', 'パン'], ['見どころ', '寺社'], ['居酒屋・バー', '居酒屋'], ['肉', '焼肉']];
  return Array.from({ length: n }, (_, i) => {
    const [cat, sub] = cats[i % cats.length];
    return {
      id: String(10_000 + i), name: `テスト${i}番 ${sub}`, cat, sub, lat: 35.5 + ((i * 37) % 400) / 1000, lng: 139.4 + ((i * 53) % 600) / 1000,
      addr: `東京都${['渋谷区', '新宿区', '港区', '目黒区'][i % 4]}テスト${i % 9}-1`, added: NOW_S - (i % 400) * DAY_S, hours: i % 3 ? week(600, 1260) : null,
      tz: 'Asia/Tokyo', web: '', note: i % 5 ? '' : 'メモ', by: 0
    };
  });
}

export interface PlacesRoute {
  /** The requests, their URL's search and Authorization. */
  calls: { search: string; auth: string | undefined }[];
  /** The relay out of reach (true) or back. */
  down(on: boolean): void;
  /** Rows the next `?since=` delta brings. */
  add(rows: Place[]): void;
  /** POST /places/sync's count (each then a fresh syncedAt, at the pinned clock's now). */
  syncs: number;
}

/** GET /places (and POST /places/sync) on `page`: `guest` strips the notes; `syncedAt` the relay's last good fetch
 *  (default 90 min before the pinned clock: no sync asked). */
export async function routePlaces(page: Page, rows: Place[] = fixturePlaces(), o: { guest?: boolean; syncedAt?: number; down?: boolean } = {}): Promise<PlacesRoute> {
  const calls: PlacesRoute['calls'] = [];
  let down = !!o.down, ver = 5, more: Place[] = [];
  let syncedAt = o.syncedAt ?? NOW_S * 1000 - 90 * 60_000;
  const out = { syncs: 0 } as PlacesRoute;
  const strip = (r: Place[]) => (o.guest ? r.map(({ note: _n, by: _b, ...x }) => x) : r);
  await page.route(`${PLACES}**`, (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    if (down) return route.abort('internetdisconnected');
    const u = new URL(req.url());
    if (u.pathname.endsWith('/sync')) {
      out.syncs++;
      ((syncedAt = NOW_S * 1000), (ver += 1));
      return route.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: '{"ok":true}' });
    }
    calls.push({ search: u.search, auth: req.headers().authorization });
    const since = u.searchParams.get('since');
    const people = o.guest ? undefined : ['A', 'B'];
    const body = since
      ? placesPayload(strip(more), { ver: ver + (more.length ? 1 : 0), full: false, syncedAt, people })
      : placesPayload(strip(rows), { ver, full: true, syncedAt, people });
    if (since && more.length) ((ver += 1), (rows = [...rows, ...more]), (more = []));
    return route.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) });
  });
  return Object.assign(out, { calls, down: (on: boolean) => (down = on), add: (r: Place[]) => (more = r) });
}
