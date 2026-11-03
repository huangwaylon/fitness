// Fireworks (docs/design.md "Fireworks"), after NH: the Fireworks Show every Sunday in August from 7 pm to midnight, and
// the New Year's countdown (Dec 31, 11 pm, sparser, then a volley at midnight and the show until 1 am); plus our own
// small celebration, a short volley the evening both of us meet all four goals (once a day per phone). Bursts open in
// the sky over the sea behind the island, never over the UI; a tap in the sky during a show sends one more where it
// was tapped. NH's shapes: round peonies and rings, hearts, stars, a gold willow, and now and then a pixel pattern
// like the custom-design fireworks Isabelle launches. Pure: the schedule, the shapes and where a burst may open.
import { hits, type Box } from './geom.ts';
import { pickOne, weighted } from '#lib/random.ts';

export type Show = 'show' | 'countdown';

/** The show on at this Tokyo moment: NH's August Sundays 19:00–24:00, and New Year's (Dec 31 from 23:00 the
 *  countdown, sparser; Jan 1 00:00–01:00 the show). */
export function showAt(month: number, day: number, weekday: number, hour: number): Show | null {
  if (month === 8 && weekday === 0 && hour >= 19) return 'show';
  if (month === 12 && day === 31 && hour === 23) return 'countdown';
  if (month === 1 && day === 1 && hour === 0) return 'show';
  return null;
}
/** The first minute of the year: a volley (VOLLEY bursts) as the clock strikes midnight. */
export const isMidnight = (month: number, day: number, hour: number, minute: number): boolean =>
  month === 1 && day === 1 && hour === 0 && minute === 0;

/** Ms until the next burst of a show: NH's show keeps them coming (every 2–4.5 s), the countdown every 6–10 s. */
export const nextBurstMs = (show: Show, r: () => number): number => (show === 'show' ? 2000 + r() * 2500 : 6000 + r() * 4000);
/** Now and then two go up at once during the show. */
export const PAIR_ODDS = 5;

/** A volley's bursts (ms from its start): the celebration's 3–5, midnight's 8, quick, overlapping a little. */
export function volley(r: () => number, n = 3 + Math.floor(r() * 3)): number[] {
  const out = [0];
  for (let i = 1; i < n; i++) out.push(Math.round(out[i - 1] + 550 + r() * 650));
  return out;
}

/** Our celebration: both of us met all four goals today and this phone hasn't shown it yet today: at once from 18:00,
 *  else at 18:00 (while the app is open). */
export const CELEBRATE_HOUR = 18;
export const celebrationDue = (allMet: boolean, shownOn: string | null, date: string, hour: number): boolean =>
  allMet && shownOn !== date && hour >= CELEBRATE_HOUR;

// ---------- shapes ----------

export type Shape = 'peony' | 'ring' | 'heart' | 'star' | 'willow' | 'pattern';
/** One spark: where it ends up from the burst's centre (px, for a burst of radius 1) and its colour. */
export interface Spark { x: number; y: number; c: string }
export interface Burst { shape: Shape; sparks: Spark[] }

/** NH's firework colours. */
const COLOURS = ['#FF6FA8', '#FFD84D', '#6FCFF6', '#8EE36B', '#C69CFF', '#FF8A4C', '#FFF6E0'] as const;
const GOLD = '#FFC94A';
const SHAPES: readonly (readonly [Shape, number])[] = [['peony', 4], ['ring', 2], ['willow', 2], ['heart', 1], ['star', 1], ['pattern', 1]];

/** Little pixel designs (ours, after NH's custom-design fireworks): NH's leaf, a smile, an apple. 8 × 8, '#' = a spark. */
const PATTERNS: readonly (readonly string[])[] = [
  ['....##..', '...###..', '..####..', '.#####..', '.####...', '.###....', '#.......', '........'],
  ['..####..', '.#....#.', '#.#..#.#', '#......#', '#.#..#.#', '#..##..#', '.#....#.', '..####..'],
  ['....#...', '...#....', '.##.##..', '#######.', '#######.', '#######.', '.#####..', '..#.#...']
];

const ring = (n: number, rad: number, c: string, phase = 0): Spark[] =>
  Array.from({ length: n }, (_, i) => {
    const a = phase + (i / n) * Math.PI * 2;
    return { x: Math.cos(a) * rad, y: Math.sin(a) * rad, c };
  });

/** A burst for the next shell (unit radius: the caller scales it to the room it has). */
export function burstPlan(r: () => number, shape: Shape = weighted(SHAPES, r)): Burst {
  const c1 = pickOne(COLOURS, r);
  let c2 = pickOne(COLOURS, r);
  if (c2 === c1) c2 = COLOURS[(COLOURS.indexOf(c1) + 3) % COLOURS.length];
  switch (shape) {
    case 'peony':
      return { shape, sparks: [...ring(22, 1, c1, r()), ...ring(9, 0.5, c2, r())].map((s) => ({ ...s, x: s.x * (0.9 + r() * 0.1), y: s.y * (0.9 + r() * 0.1) })) };
    case 'ring':
      return { shape, sparks: ring(20, 1, c1, r()) };
    case 'willow':
      return { shape, sparks: ring(16, 0.85, GOLD, r()) };
    case 'heart':
      return {
        shape,
        sparks: Array.from({ length: 22 }, (_, i) => {
          const t = (i / 22) * Math.PI * 2;
          return { x: (16 * Math.sin(t) ** 3) / 17, y: -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17, c: '#FF6FA8' };
        })
      };
    case 'star':
      return {
        shape,
        sparks: Array.from({ length: 20 }, (_, i) => {
          // along the five points' outline: alternate tips (1) and notches (0.42), 2 sparks to an edge
          const k = i / 2, tip = Math.floor(k), f = k - tip;
          const a0 = -Math.PI / 2 + (tip * Math.PI) / 5, a1 = a0 + Math.PI / 5;
          const r0 = tip % 2 ? 0.42 : 1, r1 = tip % 2 ? 1 : 0.42;
          return { x: Math.cos(a0) * r0 * (1 - f) + Math.cos(a1) * r1 * f, y: Math.sin(a0) * r0 * (1 - f) + Math.sin(a1) * r1 * f, c: c1 };
        })
      };
    case 'pattern': {
      const p = pickOne(PATTERNS, r);
      const sparks: Spark[] = [];
      p.forEach((row, y) => [...row].forEach((ch, x) => ch === '#' && sparks.push({ x: (x - 3.5) / 3.8, y: (y - 3.5) / 3.8, c: c1 })));
      return { shape, sparks };
    }
  }
}

// ---------- where a burst may open ----------


/** A burst's room at its biggest and smallest (px radius). */
export const MAX_R = 58;
export const MIN_R = 18;
/** How far its sparks drift down below its circle as they fade (px; the willow's droop reaches further, faded). */
const FALL = 12;

/** Where a burst may open in `sky` (px: the night sky and the open sea above the island), clear of every box in
 *  `avoid` (the jar, the health button, the sync chip: every control): its whole circle inside and off the UI. A size between
 *  MIN_R and MAX_R at random, anywhere it fits at random, smaller when it must; `at` (a tap) tries only there. Null when
 *  there's no room. */
export function burstSpot(sky: Box, avoid: readonly Box[], r: () => number, at?: { x: number; y: number }): { x: number; y: number; rad: number } | null {
  for (let rad = MIN_R + r() * (MAX_R - MIN_R); rad >= MIN_R - 0.01; rad = rad > MIN_R ? Math.max(MIN_R, rad * 0.85) : 0) {
    const fits = (x: number, y: number) => {
      const b = { x0: x - rad, x1: x + rad, y0: y - rad, y1: y + rad + FALL };
      return b.x0 >= sky.x0 && b.x1 <= sky.x1 && b.y0 >= sky.y0 && b.y1 <= sky.y1 && !avoid.some((a) => hits(a, b));
    };
    if (at) {
      if (fits(at.x, at.y)) return { ...at, rad };
      continue;
    }
    // every spot on a 6 px grid where it fits, one of them at random (a few hundred box tests, every few seconds)
    const ok: [number, number][] = [];
    for (let x = sky.x0 + rad; x <= sky.x1 - rad; x += 6) for (let y = sky.y0 + rad; y <= sky.y1 - rad - FALL; y += 6) if (fits(x, y)) ok.push([x, y]);
    if (ok.length) {
      const [x, y] = pickOne(ok, r);
      return { x, y, rad };
    }
  }
  return null;
}
