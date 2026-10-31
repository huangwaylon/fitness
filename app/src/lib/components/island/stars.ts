// Shooting stars and wishes (docs/design.md "Shooting stars"), after NH: on a clear night (NH: 7 pm – 4 am) a shower
// of shooting stars crosses the sky now and then; a tap while one streaks across is a wish, and each wish brings a star
// fragment to the beach the next morning. Pure: when the showers come, how many streaks each brings, where a streak may
// run (sky only, never over the UI), and the wishes' ledger (sceneDay.ts keeps it in localStorage per phone).
import { inHours } from './critters.ts';

/** NH's shooting-star hours (Tokyo clock). */
const STAR_HOURS = [19, 4] as const;
export const inStarHours = (hour: number): boolean => inHours(STAR_HOURS, hour);

/** Visible night time until the next shower: the first 30–90 s after the night sky shows, then every 3–8 minutes. */
export const nextShowerMs = (r: () => number, first = false): number => (first ? 30_000 + r() * 60_000 : 180_000 + r() * 300_000);

/** NH's meteor shower nights, now and then: 1 shower in BIG_ODDS is several stars in a row. */
export const BIG_ODDS = 6;
/** A shower's streaks, as ms from its start: usually 1–3 a second or three apart; 1 in BIG_ODDS, 5–8 in quick
 *  succession. */
export function showerPlan(r: () => number): number[] {
  const big = r() * BIG_ODDS < 1;
  const n = big ? 5 + Math.floor(r() * 4) : 1 + Math.floor(r() * 3);
  const out = [0];
  for (let i = 1; i < n; i++) out.push(Math.round(out[i - 1] + (big ? 900 + r() * 1300 : 1200 + r() * 2300)));
  return out;
}

/** A streak crosses in STREAK_MS; a tap until WISH_MS after it started is a wish on it (a finger's moment of grace). */
export const STREAK_MS = 900;
export const WISH_MS = 1300;

export interface Box { x0: number; x1: number; y0: number; y1: number }
/** A streak: where it starts (px), its heading (deg, clockwise from +x: NH's fall to the lower left) and length (px). */
export interface Streak { x: number; y: number; angle: number; len: number }

/** Whether the segment from (x, y), `len` px at `angle`, misses the box (Liang–Barsky clipping). */
function clearOf(s: Streak, b: Box): boolean {
  const dx = Math.cos((s.angle * Math.PI) / 180) * s.len, dy = Math.sin((s.angle * Math.PI) / 180) * s.len;
  let t0 = 0, t1 = 1;
  for (const [p, q] of [[-dx, s.x - b.x0], [dx, b.x1 - s.x], [-dy, s.y - b.y0], [dy, b.y1 - s.y]]) {
    if (p === 0) {
      if (q < 0) return true;
      continue;
    }
    const t = q / p;
    if (p < 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
    if (t0 > t1) return true;
  }
  return false;
}

/** Where a streak may run: inside the night sky `sky` (px), its whole path clear of every box in `avoid` (the ribbon,
 *  the jar, the sync chip: every control). 40 tries at random, each a little shorter and flatter than the last (a short
 *  sky beside a wide HUD leaves a narrow lane above or below it), else none. */
export function streakPath(sky: Box, avoid: readonly Box[], r: () => number): Streak | null {
  const w = sky.x1 - sky.x0, h = sky.y1 - sky.y0;
  const longest = Math.min(150, w * 0.42);
  for (let i = 0; i < 40; i++) {
    const k = i / 39;
    const len = longest * (1 - 0.4 * k);
    const angle = 146 + r() * (14 + 10 * k); // down to the left, steeper or shallower each time (flatter when cramped)
    const dx = Math.cos((angle * Math.PI) / 180) * len, dy = Math.sin((angle * Math.PI) / 180) * len;
    const s = { x: sky.x0 - dx + r() * (w + dx), y: sky.y0 + r() * Math.max(0, h - dy), angle, len };
    const inside = s.x + dx >= sky.x0 && s.y + dy <= sky.y1 && s.x <= sky.x1 && s.y >= sky.y0;
    if (inside && avoid.every((b) => clearOf(s, b))) return s;
  }
  return null;
}

// ---------- wishes → star fragments ----------

/** At most this many fragments wash up a morning (the front beach's room), however many wishes. */
export const MAX_FRAGMENTS = 8;
/** NH's beach is swept for the day at 5 am: a night's fragments are there from then on. */
const MORNING_HOUR = 5;

/** This phone's wishes: the morning (Tokyo date) they bring fragments to → how many wishes. */
export type Wishes = Record<string, number>;

/** The morning a wish brings its fragment: before dawn (5:00) that morning, after dusk the next (NH: the day after). */
export const fragmentDay = (wishDate: string, hour: number, next: (d: string) => string): string =>
  hour < MORNING_HOUR ? wishDate : next(wishDate);

/** One more wish for `day`'s morning; mornings before `today` are dropped (their fragments are gone with the day). */
export function addWish(w: Wishes, day: string, today: string): Wishes {
  const out: Wishes = {};
  for (const [d, n] of Object.entries(w)) if (d >= today) out[d] = n;
  out[day] = (out[day] ?? 0) + 1;
  return out;
}

/** How many fragments lie on the beach at (date, hour): one per wish meant for this morning, from 5:00, capped. */
export const fragmentsDue = (w: Wishes, date: string, hour: number): number =>
  hour < MORNING_HOUR ? 0 : Math.min(MAX_FRAGMENTS, w[date] ?? 0);
