// A realistic-size saved-places list for the flow specs (maps-flows.spec.ts), invented: 3,400 places shaped like the
// real list's aggregates (counted 2026-11-23, no row copied): ~73% in Japan, the rest abroad in their own zones (Etc/GMT
// ones too), the hours known for few (overnight runs, a 24-hour one), no website, ~a third named in Latin letters, a few names with
// emoji, long names (to ~100 characters), no address on ~4%, notes on ~3%, a few saved within 3 days, a few at one spot.
// Seeded: the same list every run.
import type { Period, Place, PlaceCat } from '../src/lib/contract/places.ts';
import { PLACE_CATS, PLACE_CAT_KEYS } from '../src/lib/contract/places.ts';

const NOW_S = Date.parse('2026-11-04T12:00:00+09:00') / 1000;
const DAY_S = 86_400;

/** Where the invented places cluster: a centre, a spread (degrees), its zone, how its addresses read, its share. */
const SPOTS: { at: [number, number]; r: number; tz: string; addr: (i: number) => string; w: number }[] = [
  { at: [139.70, 35.66], r: 0.12, tz: 'Asia/Tokyo', addr: (i) => `東京都${['渋谷区', '新宿区', '港区', '目黒区', '台東区'][i % 5]}仮町${i % 9}-${i % 7}`, w: 40 },
  { at: [135.50, 34.69], r: 0.2, tz: 'Asia/Tokyo', addr: (i) => `大阪府大阪市${['北区', '中央区', '浪速区'][i % 3]}仮町${i % 5}-1`, w: 8 },
  { at: [139.10, 35.23], r: 0.15, tz: 'Asia/Tokyo', addr: (i) => `神奈川県足柄下郡箱根町仮${i % 6}`, w: 6 },
  { at: [127.80, 26.40], r: 0.4, tz: 'Asia/Tokyo', addr: (i) => `沖縄県国頭郡本部町仮${i % 8}`, w: 6 },
  { at: [141.35, 43.06], r: 0.3, tz: 'Asia/Tokyo', addr: (i) => `Kita ${i % 9} Jonishi, Kita Ward, Sapporo, Hokkaido 060-000${i % 9}`, w: 6 },
  { at: [138.0, 36.2], r: 1.2, tz: 'Asia/Tokyo', addr: (i) => `長野県松本市仮${i % 9}`, w: 7 },
  { at: [-122.33, 47.61], r: 0.08, tz: 'America/Los_Angeles', addr: (i) => `${100 + i} Pine St, Seattle, WA 98101, アメリカ合衆国`, w: 5 },
  { at: [2.35, 48.86], r: 0.05, tz: 'Europe/Paris', addr: (i) => `${i % 40} Rue Invente, 7500${i % 9} Paris, フランス`, w: 5 },
  { at: [100.52, 13.74], r: 0.08, tz: 'Asia/Bangkok', addr: () => 'Soi Test, Khlong Toei, Bangkok 10110 タイ', w: 3 },
  { at: [105.85, 21.03], r: 0.05, tz: 'Etc/GMT-7', addr: () => 'Phố Thử, Hoàn Kiếm, Hà Nội, ベトナム', w: 5 },
  { at: [121.53, 25.04], r: 0.05, tz: 'Asia/Taipei', addr: () => '台北市大安區試驗路1號', w: 2 },
  { at: [174.76, -36.85], r: 0.3, tz: 'Pacific/Auckland', addr: () => '1 Test Road, Auckland 1010, ニュージーランド', w: 2 },
  { at: [-157.85, 21.30], r: 0.1, tz: 'Pacific/Honolulu', addr: () => 'Test Ave, Honolulu, HI 96815, アメリカ合衆国', w: 1 },
  { at: [23.73, 37.98], r: 0.05, tz: 'Europe/Athens', addr: () => 'Odos Test 1, Athina 105 58, ギリシャ', w: 1 }
];

const JA = ['仮の', 'ためし', 'まぼろし', '見本', '例題', 'さんぷる', 'おためし', '空想', 'なぞの', '試作'];
const EN = ['Mock', 'Sample', 'Dummy', 'Fixture', 'Placeholder', 'Example', 'Test', 'Stub'];
const EMOJI = ['🍜', '☕️', '🏔️', '🍣', '🌸'];
const week = (o: number, c: number, days = [0, 1, 2, 3, 4, 5, 6]): Period[] => days.map((d) => ({ d, o, c }));

/** A seeded random (mulberry32). */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `n` invented places (default 3,400). */
export function bigPlaces(n = 3400, seed = 7): Place[] {
  const r = rng(seed);
  const total = SPOTS.reduce((s, x) => s + x.w, 0);
  const out: Place[] = [];
  for (let i = 0; i < n; i++) {
    let w = r() * total, s = SPOTS[0];
    for (const x of SPOTS) if ((w -= x.w) < 0) { s = x; break; }
    const cat: PlaceCat = PLACE_CAT_KEYS[Math.floor(r() * PLACE_CAT_KEYS.length)];
    const subs = PLACE_CATS[cat] as readonly string[];
    const sub = subs.length && r() < 0.6 ? subs[Math.floor(r() * subs.length)] : '';
    const latin = s.tz !== 'Asia/Tokyo' ? r() < 0.8 : r() < 0.2;
    let name = latin ? `${EN[i % EN.length]} ${['Cafe', 'Bistro', 'Diner', 'Point', 'Market', 'Hall'][i % 6]} ${i}` : `${JA[i % JA.length]}${sub || cat}${i}号`;
    if (i % 97 === 0) name = `${name} ${'とても長い名前の'.repeat(10)}本店`;
    if (i % 101 === 3) name = `${EMOJI[i % EMOJI.length]} ${name}`;
    const h = r();
    const hours = h < 0.06 ? week(660, 1290) : h < 0.075 ? week(1080, 1620, [1, 2, 3, 4, 5, 6]) : h < 0.08 ? [{ d: 0, o: 0, c: 10_080 }] : h < 0.09 ? week(1200, 1680, [5, 6]) : null;
    const same = i % 853 === 5 && out.length;
    out.push({
      id: i % 227 === 11 ? `k:${(i * 2654435761 >>> 0).toString(16)}` : String(9_000_000 + i * 13),
      name, cat, sub,
      lat: same ? out[out.length - 1].lat : +(s.at[1] + (r() - 0.5) * 2 * s.r).toFixed(6),
      lng: same ? out[out.length - 1].lng : +(s.at[0] + (r() - 0.5) * 2 * s.r).toFixed(6),
      addr: r() < 0.04 ? '' : s.addr(i),
      added: NOW_S - (i % 50 === 0 ? Math.floor(r() * 2 * DAY_S) : Math.floor(r() * 900 * DAY_S)),
      hours, tz: s.tz, web: '', note: r() < 0.03 ? 'メモの例：二階の窓際' : '', by: i % 8 ? 2 : 1
    });
  }
  return out;
}
