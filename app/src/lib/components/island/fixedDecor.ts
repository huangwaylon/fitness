// The fixed decor through the year (docs/design.md "Decor"): what stands in each of world.ts DECOR_SLOTS today, and
// which scenery takes a seasonal look in its place (a lantern a seasonal lamp, the stairs' lanterns the kadomatsu,
// the flat rock a pond stone). A seasonal piece only ever takes a spot of its own or swaps with what stands there: the
// island never gains a spot. Pure: the date (Tokyo), the hour and the island's seed, so both phones show the same.
import { DECOR_SLOTS, DECOR_U, type DecorSlot } from './world.ts';
import { dayWeather } from './weather.ts';
import { eventAt, eggTime } from './events.ts';
import { addDays } from '#lib/time/dates.ts';
import PLACES from './models.json';

const MU = PLACES as unknown as Record<string, { mu: [number, number] }>;
/** A render's drawn height (u): its model units at DECOR_U (one family: the decorations' scale). */
export const decorHeight = (key: string): number => Math.round((MU[key]?.mu[1] ?? 10) * DECOR_U * 10) / 10;

export interface Piece {
  /** Its spot's id (world.ts DECOR_SLOTS) or `arch` (centre stage's arch spot on Bunny Day). */
  id: string;
  key: string;
  x: number;
  z: number;
  h: number;
  /** A lamp: where its light hangs (a share of its height); it lights at dusk. */
  glow?: number;
  /** Not a walk obstacle (an arch one walks through). */
  open?: boolean;
}

/** month × 100 + day: Apr 1 is 401. */
const mdOf = (date: string) => Number(date.slice(5, 7)) * 100 + Number(date.slice(8, 10));
/** Whether md is in [a, b] (a range may wrap the new year: Dec 15 – Jan 6 is 1215…106). */
const within = (md: number, a: number, b: number) => (a <= b ? md >= a && md <= b : md >= a || md <= b);

/** NH's windows (northern hemisphere): the blossom days, the foliage, the summer, the new year's pieces. */
export const WINDOWS = {
  blossom: [401, 410], foliage: [1016, 1210], summer: [601, 915], illumi: [1215, 106], kadomatsu: [1226, 107],
  bambooShoot: [225, 521], nuts: [901, 1210], mushroom: [1101, 1130], winter: [1211, 224]
} as const satisfies Record<string, readonly [number, number]>;
const on = (md: number, w: keyof typeof WINDOWS) => within(md, WINDOWS[w][0], WINDOWS[w][1]);

/** Where the light hangs on the seasonal lamps (a share of their height). */
export const LAMP_GLOW: Record<string, number> = { 'deco/bamboo-shoot-lamp': 0.5, 'deco/mushroom-lamp': 0.86, 'deco/nut-lamp': 0.62 };

/** The keys built at run time: the snowboy's stages, the shishi-odoshi tipped (Scenery: `<key>-tip`). */
export const FIXED_ART: readonly string[] = [0, 1, 2, 3].map((n) => `deco/snowboy-${n}`).concat('deco/shishiodoshi-tip');

/** The sandcastle stands on summer days from 05:00 until the tide takes it at 18:00. */
export const CASTLE_HOURS = [5, 18] as const;

/** The snowboy's melting stage today (0 built … 3 a puddle), or null: built on a snow day, a stage a day after. */
export function snowboyStage(date: string, seed?: string): number | null {
  if (!on(mdOf(date), 'winter') && !on(mdOf(addDays(date, -3)), 'winter')) return null;
  for (let d = 0; d <= 3; d++) {
    const p = dayWeather(addDays(date, -d), seed).pattern;
    if (p === 'snow' || p === 'heavy-snow') return d;
  }
  return null;
}

/** A slot's piece today (or null: empty in this season). */
function lookOf(slot: DecorSlot, date: string, hour: number, seed?: string): string | null {
  const md = mdOf(date);
  switch (slot.id) {
    case 'beach-chair': return on(md, 'summer') ? 'deco/beach-chair' : null;
    case 'sandcastle': return on(md, 'summer') && hour >= CASTLE_HOURS[0] && hour < CASTLE_HOURS[1] ? 'deco/sandcastle' : null;
    case 'snowboy': {
      const st = snowboyStage(date, seed);
      return st === null ? null : `deco/snowboy-${st}`;
    }
    case 'hammock': return on(md, 'illumi') ? 'deco/illumi-tree' : slot.key ?? null;
    case 'bench-pond': return on(md, 'blossom') ? 'deco/picnic-set' : slot.key ?? null;
    default: return slot.key ?? null;
  }
}

/** What stands in the decor's spots today (empty spots left out), and Bunny Day's egg arch on the arch's spot. */
export function piecesOn(date: string, hour: number, seed?: string, arch?: readonly [number, number]): Piece[] {
  const out: Piece[] = [];
  for (const s of DECOR_SLOTS) {
    const key = lookOf(s, date, hour, seed);
    if (key) out.push({ id: s.id, key, x: s.x, z: s.z, h: decorHeight(key), glow: key === 'deco/illumi-tree' ? 0.5 : undefined });
  }
  if (arch && eggTime(eventAt(date, hour))) out.push({ id: 'arch', key: 'deco/egg-arch', x: arch[0], z: arch[1], h: decorHeight('deco/egg-arch'), open: true });
  return out;
}

/** The scenery that takes a seasonal look today: its id → the look (and its height). */
export function swapsOn(date: string): Record<string, { key: string; h: number }> {
  const md = mdOf(date), out: Record<string, { key: string; h: number }> = {};
  const put = (id: string, key: string) => (out[id] = { key, h: decorHeight(key) });
  if (on(md, 'blossom')) put('rock-m1', 'deco/pond-stone-sakura');
  else if (on(md, 'foliage')) put('rock-m1', 'deco/pond-stone-maple');
  if (on(md, 'mushroom')) put('lantern-1', 'deco/mushroom-lamp');
  else if (on(md, 'nuts')) put('lantern-1', 'deco/nut-lamp');
  if (on(md, 'bambooShoot')) put('lantern-2', 'deco/bamboo-shoot-lamp');
  if (on(md, 'kadomatsu')) for (const id of ['lantern-3', 'lantern-4']) put(id, 'deco/kadomatsu');
  return out;
}
