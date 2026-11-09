// The Happy Home Academy's rating of the tent (docs/design.md "The tent": NH's ハニワくん, gently): a points total
// and a bronze, silver or gold ハニワ, worked out from the shared room alone (its pieces, wallpaper, floor and lights),
// so both phones give the same score for the same room. Pure: the numbers come from hha.json (scripts/room-models.ts:
// the spreadsheet's HHA base points, series, catalogue colours, themes and HHA category), loaded only for a rating.
//   rate(room, table)     the rating: { total, badge, parts, note, next }
//   loadHha()             hha.json (once)
import type { TentPiece } from '#lib/contract/tent.ts';
import { DEFAULT_FLOOR, DEFAULT_WALL, ITEMS, footprint } from './items.ts';
import { DOOR_TILES } from './grid.ts';

/** An item's (a piece's, a wallpaper's, a floor's) HHA numbers. */
interface HhaMeta {
  /** NH's base points. */
  p: number;
  /** Its series (log, rattan…). */
  s?: string;
  /** Its catalogue colours (two). */
  c?: string[];
  /** Its themes (NH's concepts: living room, café…). */
  t?: string[];
  /** Its HHA category (Lighting, Clock…). */
  k?: string;
}
export type HhaTable = Readonly<Record<string, HhaMeta>>;

export interface HhaRoom {
  pieces: readonly Pick<TentPiece, 'id' | 'item' | 'on' | 'l'>[];
  wall: string | null;
  floor: string | null;
  lights: boolean;
  /** Its size (tiles a side; none: the largest, 8). */
  size?: number;
}

/** What the rating counts, in the letter's order. */
type HhaPart = 'base' | 'series' | 'theme' | 'colour' | 'light' | 'space' | 'variety';
export type HhaBadge = 'gold' | 'silver' | 'bronze' | null;
/** The letter's one remark: what stood out most (its series, theme or colour named), or what would help. */
type HhaNote =
  | { k: 'series'; v: string }
  | { k: 'theme'; v: string }
  | { k: 'colour'; v: string }
  | { k: 'light' | 'space' | 'variety' | 'empty' | 'sparse' | 'crowded' | 'dark' };

export interface HhaRating {
  total: number;
  badge: HhaBadge;
  parts: { k: HhaPart; pts: number }[];
  note: HhaNote;
  /** Points to the next ハニワ (null at gold). */
  next: number | null;
}

/** The ハニワ's thresholds (a cosy room of starter things earns bronze; a whole room in one series, lit, silver;
 *  gold wants a theme, a colour and the room's space too). */
export const BADGES: readonly [Exclude<HhaBadge, null>, number][] = [['gold', 10000], ['silver', 6000], ['bronze', 3000]];

/** A series counts from this many pieces (wallpaper and floor included); each then earns SERIES_PER, and a room
 *  this full of one series (SERIES_FULL) the whole-set bonus. */
const SERIES_MIN = 3, SERIES_PER = 120, SERIES_FULL = 6, SERIES_SET = 600;
/** A theme or a colour counts when this many pieces and at least half the room share it. */
const SHARE_MIN = 4, THEME_PER = 80, COLOUR_PER = 60;
/** Lights on: the first, then each more (up to LIGHT_MAX of them). */
const LIGHT_FIRST = 250, LIGHT_MORE = 100, LIGHT_MAX = 4;
/** The floor used (furniture, not rugs, over the tiles but the doorway's): the sweet band and the edges. */
const FILL_LO = 0.3, FILL_HI = 0.65, FILL_EDGE = 0.15, SPACE_BEST = 700, SPACE_OK = 300;
/** Something on a table, and something on a wall: each kind of use, once. */
const SPACE_USE = 200;
/** Each kind of thing (a seat, a bed, a table, a rug, a wall thing, a light, and each HHA category). */
const VARIETY_PER = 60, VARIETY_MAX = 600;

/** The floor's tiles but the doorway's (a room of n tiles a side: its size). */
const usable = (n: number) => n * n - DOOR_TILES.length;

/** Most-shared key among the pieces: [key, how many pieces], the first in sorted order on a tie. */
function top(keys: (readonly string[])[]): [string, number] | null {
  const n = new Map<string, number>();
  for (const ks of keys) for (const k of new Set(ks)) n.set(k, (n.get(k) ?? 0) + 1);
  let best: [string, number] | null = null;
  for (const [k, c] of [...n].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) if (!best || c > best[1]) best = [k, c];
  return best;
}

/** The room's rating (the same room, the same rating, on every phone). */
export function rate(room: HhaRoom, table: HhaTable): HhaRating {
  const meta = (code: string): HhaMeta => table[code] ?? { p: 0 };
  const wall = room.wall ?? DEFAULT_WALL, floor = room.floor ?? DEFAULT_FLOOR;
  const ids = new Set(room.pieces.map((p) => p.id));
  const pieces = room.pieces.filter((p) => ITEMS[p.item]);
  const n = pieces.length;

  // the things themselves: NH's points, a second of the same thing half, a third and on nothing
  const seen = new Map<string, number>();
  let base = meta(wall).p + meta(floor).p;
  for (const p of pieces) {
    const k = seen.get(p.item) ?? 0;
    seen.set(p.item, k + 1);
    base += k === 0 ? meta(p.item).p : k === 1 ? Math.round(meta(p.item).p / 2) : 0;
  }

  // a series: the pieces, the wallpaper and the floor of one (log, rattan…)
  const surfaces = [wall, floor].map(meta);
  const ser = top([...pieces.map((p) => (meta(p.item).s ? [meta(p.item).s!] : [])), ...surfaces.map((m) => (m.s ? [m.s] : []))]);
  const series = ser && ser[1] >= SERIES_MIN ? ser[1] * SERIES_PER + (ser[1] >= SERIES_FULL ? SERIES_SET : 0) : 0;

  // a theme and a colour the room shares (the pieces': a wallpaper's colours aren't counted twice over)
  const shared = (c: number) => n > 0 && c >= SHARE_MIN && c * 2 >= n;
  const th = top(pieces.map((p) => meta(p.item).t ?? []));
  const theme = th && shared(th[1]) ? th[1] * THEME_PER : 0;
  const co = top(pieces.map((p) => (meta(p.item).c ?? []).filter((c) => c !== 'Colorful')));
  const colour = co && shared(co[1]) ? co[1] * COLOUR_PER : 0;

  // the lights that are on (the lamps the room's switch leaves lit)
  const lit = pieces.filter((p) => (ITEMS[p.item].lt || meta(p.item).k === 'Lighting') && p.l !== 0).length;
  const light = lit ? LIGHT_FIRST + LIGHT_MORE * (Math.min(lit, LIGHT_MAX) - 1) : 0;

  // the room's space: the floor neither bare nor crowded, and the tables and walls used
  const onFloor = pieces.filter((p) => !ITEMS[p.item].rug && !ITEMS[p.item].wl && !(p.on && ids.has(p.on)));
  const fill = onFloor.reduce((s, p) => s + footprint(p.item, 0).reduce((a, b) => a * b, 1), 0) / usable(room.size ?? 8);
  const onTables = pieces.some((p) => p.on && ids.has(p.on)), onWalls = pieces.some((p) => ITEMS[p.item].wl);
  const space = (fill >= FILL_LO && fill <= FILL_HI ? SPACE_BEST : fill >= FILL_LO - FILL_EDGE && fill <= FILL_HI + FILL_EDGE ? SPACE_OK : 0)
    + (onTables ? SPACE_USE : 0) + (onWalls ? SPACE_USE : 0);

  // variety: each kind of thing
  const kinds = new Set<string>();
  for (const p of pieces) {
    const m = ITEMS[p.item];
    if (m.u) kinds.add(`u${m.u}`);
    if (m.s) kinds.add('table');
    if (m.rug) kinds.add('rug');
    if (m.wl) kinds.add('wall');
    if (m.lt) kinds.add('light');
    const k = meta(p.item).k;
    if (k && k !== 'Lighting') kinds.add(k);
  }
  const variety = Math.min(VARIETY_MAX, kinds.size * VARIETY_PER);

  const parts: HhaRating['parts'] = [
    { k: 'base', pts: base }, { k: 'series', pts: series }, { k: 'theme', pts: theme }, { k: 'colour', pts: colour },
    { k: 'light', pts: light }, { k: 'space', pts: space }, { k: 'variety', pts: variety }
  ];
  const total = parts.reduce((s, p) => s + p.pts, 0);
  const badge = BADGES.find(([, at]) => total >= at)?.[0] ?? null;
  const up = [...BADGES].reverse().find(([, at]) => total < at);

  // the remark: what would help most, or the best of what's there
  let note: HhaNote;
  if (n === 0) note = { k: 'empty' };
  else if (fill > FILL_HI + FILL_EDGE) note = { k: 'crowded' };
  else if (!lit && !room.lights) note = { k: 'dark' };
  else if (n < SHARE_MIN || fill < FILL_LO - FILL_EDGE) note = { k: 'sparse' };
  else {
    const named: [number, HhaNote][] = [
      [series, { k: 'series', v: ser?.[0] ?? '' }], [theme, { k: 'theme', v: th?.[0] ?? '' }], [colour, { k: 'colour', v: co?.[0] ?? '' }],
      [light, { k: 'light' }], [space, { k: 'space' }], [variety, { k: 'variety' }]
    ];
    note = named.reduce((a, b) => (b[0] > a[0] ? b : a))[1];
  }
  return { total, badge, parts, note, next: up ? up[1] - total : null };
}

let table: Promise<HhaTable> | null = null;
/** hha.json (its own chunk: only a rating needs it). */
export function loadHha(): Promise<HhaTable> {
  return (table ??= import('./hha.json').then((m) => m.default as HhaTable, (e: unknown) => {
    table = null;
    throw e;
  }));
}

