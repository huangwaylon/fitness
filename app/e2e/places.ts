// 保存した場所's relay routes as the specs see them (places.spec.ts, hiking's layer): GET /places answered by page.route
// from invented places (no real list: the repo is public), with notes (for every key alike) and Google's details,
// `?since=` answered with a delta, GET /places/pics a place's photo tokens and their images. No network.
import type { Page } from './fixtures.ts';
import { readFileSync } from 'node:fs';
import { placesPayload, type Period, type Place, type PlaceCat, type PlaceDet } from '../src/lib/contract/places.ts';
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

/** Invented Google details for fixturePlaces (contract PlaceDet: kind, rating, hours, the description), each row's
 *  `det` in routePlaces' payload. サンプル山's hours only here; 仮想うどん店 under 5 reviews (no ★ on its row). */
const FIXTURE_FACETS: Record<string, PlaceDet> = {
  '101': { at: 0, hours: null, kind: 'ラーメン店', r: 4.6, rn: 120 },
  '102': { at: 0, hours: null, kind: 'ラーメン店・つけ麺店・中華そば専門店・テイクアウト専門店・持ち帰り可能な店', r: 4.1, rn: 40 },
  '103': { at: 0, hours: null, kind: 'うどん店', r: 4.4, rn: 3 },
  '104': { at: 0, hours: null, kind: 'カフェ・喫茶', r: 4.5, rn: 80, desc: '駅から近い、日当たりのよいテラス席のある静かなカフェ。' },
  '105': { at: 0, hours: null, kind: 'ベーカリー', r: 3.9, rn: 22 },
  '107': { at: 0, hours: null, kind: '寺院', r: 4.7, rn: 900, desc: '浅草の静かな寺。' },
  '108': { at: 0, hours: week(540, 1020), r: 4.2, rn: 4 },
  '109': { at: 0, hours: null, kind: '居酒屋', r: 4.0, rn: 15 }
};

/** まぼろし寺's full card (the specs' details card): its week 11:00–21:30, a website, a phone, a line, ★ 4.3 of 512,
 *  two photos. */
export const CARD_DET: PlaceDet = {
  at: NOW_S, hours: week(660, 1290), web: 'https://maboroshi-tera.example.jp', tel: '+81312345678',
  desc: '浅草の静かな寺。春には桜が見事で、参道には小さな茶屋が並ぶ。', r: 4.3, rn: 512, kind: '寺院', pn: 2
};
/** fixturePlaces with まぼろし寺's det `det` (CARD_DET; null: none). */
export const withCard = (det: PlaceDet | null = CARD_DET): Place[] => fixturePlaces().map((p) => (p.id === '107' ? { ...p, det } : p));

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
  /** POST /places/sync's count (older builds asked it; this one never does). */
  syncs: number;
  /** GET /places/pics's ids, in order. */
  pics: string[];
}

/** A photo token (contract picUrl: Google's lh3 path) for the specs' places. */
export const picToken = (id: string, i: number): string => `e2e${id}x${i}`.padEnd(40, 'Q');
const PIC_IMG = readFileSync(new URL('./fixtures/places/card-sheet.webp', import.meta.url));

/** GET /places (and POST /places/sync, counted) on `page`, each row's `det` its own (null: none) or FIXTURE_FACETS' (its hours the
 *  row's when the fixture has none; the payload's own `hours` null, `web` '', as the relay's): `syncedAt` the list's
 *  last pull (default 90 min before the pinned clock). GET /places/pics a row's `pn` tokens (picToken), their images
 *  a fixture webp (`pics: 'abort'`: refused, as offline); `holdPics` holds /places/pics's answer till it settles,
 *  `picsFail(n)` fails its n-th ask as offline would. */
export async function routePlaces(page: Page, rows: Place[] = fixturePlaces(), o: { syncedAt?: number; down?: boolean; pics?: 'abort'; holdPics?: Promise<void>; picsFail?: (n: number) => boolean } = {}): Promise<PlacesRoute> {
  const calls: PlacesRoute['calls'] = [];
  let down = !!o.down, ver = 5, more: Place[] = [];
  let syncedAt = o.syncedAt ?? NOW_S * 1000 - 90 * 60_000;
  const out = { syncs: 0, pics: [] as string[] } as PlacesRoute;
  const detOf = (p: Place): PlaceDet | null => (p.det !== undefined ? p.det : { ...(FIXTURE_FACETS[p.id] ?? { at: 0 }), hours: FIXTURE_FACETS[p.id]?.hours ?? p.hours });
  const bare = (rs: Place[]) => rs.map((p) => ({ ...p, hours: null, web: '', det: detOf(p) }));
  await page.route('https://lh3.googleusercontent.com/grass-cs/**', (r) =>
    o.pics === 'abort' ? r.abort('internetdisconnected') : r.fulfill({ status: 200, contentType: 'image/webp', headers: { 'Access-Control-Allow-Origin': '*' }, body: PIC_IMG }));
  await page.route(`${PLACES}**`, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    if (down) return route.abort('internetdisconnected');
    const u = new URL(req.url());
    if (u.pathname.endsWith('/pics')) {
      const n = out.pics.push(u.searchParams.get('id') ?? '') - 1;
      await o.holdPics;
      if (o.picsFail?.(n)) return route.abort('internetdisconnected');
      const p = [...rows, ...more].find((r) => r.id === u.searchParams.get('id'));
      const pics = Array.from({ length: (p && detOf(p)?.pn) || 0 }, (_, i) => picToken(p!.id, i));
      return route.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify({ ok: true, pics }) });
    }
    if (u.pathname.endsWith('/sync')) {
      out.syncs++;
      ((syncedAt = NOW_S * 1000), (ver += 1));
      return route.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: '{"ok":true}' });
    }
    calls.push({ search: u.search, auth: req.headers().authorization });
    const since = u.searchParams.get('since');
    const people = ['A', 'B'];
    const body = since
      ? placesPayload(bare(more), { ver: ver + (more.length ? 1 : 0), full: false, syncedAt, people })
      : placesPayload(bare(rows), { ver, full: true, syncedAt, people });
    if (since && more.length) ((ver += 1), (rows = [...rows, ...more]), (more = []));
    return route.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) });
  });
  return Object.assign(out, { calls, down: (on: boolean) => (down = on), add: (r: Place[]) => (more = r) });
}

/** A real finger in Chromium (CDP Input.dispatchTouchEvent: the browser's own touch, pointer and scroll handling, not
 *  events made in the page): down at (x, y), moved by each of `dys` px from there, lifted. The maps' sheets' pull
 *  (DragSheet `pull`) on a full scroller; WebKit has no such finger (the specs' synthetic touches stand in there). */
export async function finger(page: Page, x: number, y: number, dys: number[]) {
  const cdp = await page.context().newCDPSession(page);
  const at = (dy: number) => [{ x, y: y + dy, id: 1, radiusX: 4, radiusY: 4, force: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: at(0) });
  for (const dy of dys) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: at(dy) });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}
