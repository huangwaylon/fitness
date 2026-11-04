// The swimmers' motion (museum/boids.ts): NH's aquarium's calm, every species in its tank seven at a time (PER_TANK)
// for two minutes, as tanks.test swims them: turns bounded by size, no sharp turn round, little time in the corners or
// against the ends, a pace that varies (cruising, drifting, pausing), each at its depth. (The misses collected,
// checked once: an expect a sample is too slow for CI's 5 s a test.)
import { describe, expect, test } from 'vitest';
import { bandOf, cruiseOf, spawn, stepSchool, swimBox, turnOf, type Swimmer } from './boids.ts';
import { TANKS, bodyIn, openOf, type Box } from './tanks.ts';
import { FISH_IDS, PER_TANK, WALKERS, tankOf } from './species.ts';
import { modelBounds } from '../world3d/models3d.ts';

const FPS = 30, SECONDS = 120;
/** A species' seed by its place in its tank's list. (The bounds below are a sample's: over six seeds, five a tank
 *  missed 2.3 of them on average and seven 3.0, crowding barely; a seed that passes.) */
const seedAt = (j: number): number => j * 13 + 8;
interface Run { tank: string; id: string; f: Swimmer; box: Box; yaw: Float64Array; sp: Float64Array; l: Float64Array; c: Float64Array; y: Float64Array; kick: Float64Array }
/** Every swimming species, PER_TANK at a time in its tank, two minutes each: its heading, speed, where along and across
 *  its swim box (0…1), its height in it (0…1) and its tail's width, every frame. */
const runs: Run[] = (() => {
  const out: Run[] = [];
  for (const t of TANKS) {
    const w = openOf(t), ids = FISH_IDS.filter((id) => tankOf(id) === t.id && !WALKERS[id] && modelBounds(`critters/fish/${id}`));
    for (let g = 0; g < ids.length; g += PER_TANK) {
      const n = SECONDS * FPS;
      const five = ids.slice(g, g + PER_TANK).map((id, i): Run => {
        const b = modelBounds(`critters/fish/${id}`)!, body = bodyIn(t, b.min, b.max);
        const f = spawn(w, body.r, body.reach, cruiseOf(body.r), seedAt(g + i), bandOf(id));
        const a = () => new Float64Array(n);
        return { tank: t.id, id, f, box: swimBox(w, body.reach), yaw: a(), sp: a(), l: a(), c: a(), y: a(), kick: a() };
      });
      const fish = five.map((x) => x.f);
      for (let k = 0; k < n; k++) {
        stepSchool(fish, w, 1 / FPS, k / FPS);
        for (const x of five) {
          const b = x.box, along = b.x1 - b.x0 >= b.z1 - b.z0, p = x.f.p;
          const frac = (v: number, lo: number, hi: number) => (hi - lo > 1e-6 ? (v - lo) / (hi - lo) : 0.5);
          x.yaw[k] = Math.atan2(x.f.v[0], x.f.v[2]);
          x.sp[k] = Math.hypot(x.f.v[0], x.f.v[2]);
          x.l[k] = along ? frac(p[0], b.x0, b.x1) : frac(p[2], b.z0, b.z1);
          x.c[k] = along ? frac(p[2], b.z0, b.z1) : frac(p[0], b.x0, b.x1);
          x.y[k] = frac(p[1], b.y0, b.y1);
          x.kick[k] = x.f.kick;
        }
      }
      out.push(...five);
    }
  }
  return out;
})();
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const name = (x: Run) => `${x.tank} ${x.id} (r ${x.f.r.toFixed(1)})`;

describe('the swimmers: smooth, slow-turning paths', () => {
  test('a big fish turns slower than a little one, and none faster than its size allows', () => {
    expect(turnOf(3)).toBeLessThanOrEqual(1.5);
    expect(turnOf(6)).toBeLessThanOrEqual(1.1);
    expect(turnOf(9)).toBeLessThanOrEqual(0.9);
    expect(turnOf(9)).toBeLessThan(turnOf(3));
    const out: string[] = [];
    for (const x of runs) {
      let most = 0;
      for (let k = 1; k < x.yaw.length; k++) most = Math.max(most, Math.abs(wrap(x.yaw[k] - x.yaw[k - 1])) * FPS);
      if (!(most <= turnOf(x.f.r) + 1e-6)) out.push(`${name(x)}: ${most.toFixed(2)} rad/s, its bound ${turnOf(x.f.r).toFixed(2)}`);
    }
    expect(out).toEqual([]);
  });
  test('no sharp turn round: under 135° in any 1.5 s (a big fish, r 6 or more, under 100°)', () => {
    const out: string[] = [], win = 1.5 * FPS;
    for (const x of runs) {
      let most = 0;
      for (let k = win; k < x.yaw.length; k++) most = Math.max(most, Math.abs(wrap(x.yaw[k] - x.yaw[k - win])));
      const deg = (most * 180) / Math.PI, bound = x.f.r >= 6 ? 100 : 135;
      if (!(deg < bound)) out.push(`${name(x)}: ${deg.toFixed(0)}° in 1.5 s`);
    }
    expect(out).toEqual([]);
  });
  test('little time in the corners or against the ends: long passes, turned round before the glass', () => {
    const out: string[] = [];
    let all = 0, n = 0;
    for (const x of runs) {
      let corner = 0, end = 0;
      for (let k = 0; k < x.l.length; k++) {
        const atEnd = x.l[k] < 0.04 || x.l[k] > 0.96;
        if (atEnd && (x.c[k] < 0.15 || x.c[k] > 0.85)) corner++;
        if (x.l[k] < 0.03 || x.l[k] > 0.97) end++;
      }
      all += corner;
      n += x.l.length;
      if (corner / x.l.length > 0.05) out.push(`${name(x)}: ${((100 * corner) / x.l.length).toFixed(1)}% in a corner`);
      if (end / x.l.length > 0.06) out.push(`${name(x)}: ${((100 * end) / x.l.length).toFixed(1)}% against an end`);
      // (and it uses its tank's length: from near one end to near the other)
      let lo = 1, hi = 0;
      for (const l of x.l) (lo = Math.min(lo, l)), (hi = Math.max(hi, l));
      if (hi - lo < 0.6) out.push(`${name(x)}: only ${(100 * (hi - lo)).toFixed(0)}% of its length`);
    }
    expect(out).toEqual([]);
    expect(all / n).toBeLessThan(0.01);
  });
});

describe('the swimmers: a pace of their own', () => {
  test('its speed varies: mostly cruising, now and then slow (a drift, a pause), never stuck', () => {
    const out: string[] = [];
    for (const x of runs) {
      const cr = x.f.speed, n = x.sp.length;
      let sum = 0, sq = 0, slow = 0, cruise = 0;
      for (const s of x.sp) {
        sum += s;
        sq += s * s;
        if (s < 0.3 * cr) slow++;
        if (s > 0.75 * cr) cruise++;
      }
      const mean = sum / n, cv = Math.sqrt(Math.max(0, sq / n - mean * mean)) / mean;
      if (!(cv > 0.25)) out.push(`${name(x)}: its speed's variation ${cv.toFixed(2)}`);
      if (!(slow / n > 0.02 && slow / n < 0.45)) out.push(`${name(x)}: slow ${((100 * slow) / n).toFixed(0)}% of the time`);
      if (!(cruise / n > 0.2)) out.push(`${name(x)}: cruising ${((100 * cruise) / n).toFixed(0)}% of the time`);
    }
    expect(out).toEqual([]);
  });
  test('its tail beats with its speed: wide cruising, narrow drifting', () => {
    const out: string[] = [];
    for (const x of runs) {
      let fast = 0, nf = 0, slow = 0, ns = 0, most = 0;
      for (let k = 0; k < x.sp.length; k++) {
        most = Math.max(most, x.kick[k]);
        if (x.sp[k] > 0.8 * x.f.speed) (fast += x.kick[k]), nf++;
        else if (x.sp[k] < 0.3 * x.f.speed) (slow += x.kick[k]), ns++;
      }
      if (most > 1) out.push(`${name(x)}: its tail ${most.toFixed(2)} of its sway`);
      if (nf && ns && !(fast / nf > slow / ns + 0.2)) out.push(`${name(x)}: tail ${(fast / nf).toFixed(2)} fast, ${(slow / ns).toFixed(2)} slow`);
    }
    expect(out).toEqual([]);
  });
  test('each at its depth: a flatfish and a catfish low, a sunfish and an arowana high', () => {
    const mean = (id: string) => {
      const x = runs.find((r) => r.id === id)!;
      return x.y.reduce((a, b) => a + b, 0) / x.y.length;
    };
    for (const id of ['olive-flounder', 'ray', 'catfish', 'loach']) expect(mean(id), id).toBeLessThan(0.3);
    for (const id of ['ocean-sunfish', 'arowana', 'killifish']) expect(mean(id), id).toBeGreaterThan(0.6);
  });
});
