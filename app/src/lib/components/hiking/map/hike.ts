// Hike mode's arithmetic (docs/hiking.md "In-hike map"), pure: where on the route a fix is (walked vs ahead), how far
// off it, the off-route banner's hysteresis, and the strip's figures (歩いた · のこり · のぼり · 到着 ごろ). Navigation only:
// nothing here is recorded; the fixes stay on the phone.
import type { Prepared } from '#lib/hiking/track.ts';
import { pointAt } from '#lib/hiking/track.ts';
import type { Trail } from '#lib/hiking/types.ts';

type P = { lon: number; lat: number };
const M_LAT = 111_320;

/** The nearest point of segment i to `q` on a local flat projection (metres): its distance, fraction and point. */
function onSeg(pr: Prepared, i: number, q: P): { dist: number; f: number; lon: number; lat: number } {
  const [ax, ay] = pr.pts[i], [bx, by] = pr.pts[i + 1];
  const k = M_LAT * Math.cos((q.lat * Math.PI) / 180);
  const ux = (bx - ax) * k, uy = (by - ay) * M_LAT, wx = (q.lon - ax) * k, wy = (q.lat - ay) * M_LAT;
  const L = ux * ux + uy * uy;
  const f = L > 0 ? Math.max(0, Math.min(1, (wx * ux + wy * uy) / L)) : 0;
  const dx = wx - f * ux, dy = wy - f * uy;
  return { dist: Math.hypot(dx, dy), f, lon: ax + f * (bx - ax), lat: ay + f * (by - ay) };
}

export interface Match { d: number; dist: number; lon: number; lat: number }

const at = (pr: Prepared, i: number, s: ReturnType<typeof onSeg>): Match => ({ d: pr.d[i] + s.f * (pr.d[i + 1] - pr.d[i]), dist: s.dist, lon: s.lon, lat: s.lat });

/** The route's nearest point to `q` anywhere along it (the off-route distance and its line). */
export function nearest(pr: Prepared, q: P): Match {
  let best: Match | null = null;
  for (let i = 0; i < pr.pts.length - 1; i++) {
    const s = onSeg(pr, i, q);
    if (!best || s.dist < best.dist) best = at(pr, i, s);
  }
  return best ?? { d: 0, dist: Infinity, lon: pr.pts[0][0], lat: pr.pts[0][1] };
}

/** How the matcher looks: back and ahead of the last place (m), after how long a silence or how far a jump it searches
 *  the whole route first. */
const MATCH = { back: 150, ahead: 600, gapMs: 60_000, jumpM: 300 } as const;

/** Where along the route each fix is: a moving window around the last place (so an out-and-back's way down never
 *  snaps to the way up passing near it), the whole route searched first after a gap or a jump, then preferring the
 *  first candidate ahead of the last place (the way down, once the summit was passed). */
export class Matcher {
  last: { d: number; t: number; lon: number; lat: number } | null = null;
  private pr: Prepared;
  constructor(pr: Prepared) {
    this.pr = pr;
  }

  match(q: P & { t: number }): Match {
    const pr = this.pr, last = this.last;
    let m: Match | null = null;
    const far = !last || q.t - last.t > MATCH.gapMs || metres(last, q) > MATCH.jumpM;
    if (!far) m = this.window(q, last!.d);
    if (far || !m) m = this.whole(q, last?.d ?? null);
    else {
      // the window lost it (off-route far, or a short cut across): the whole route if it is clearly nearer there
      const g = nearest(pr, q);
      if (m.dist > 80 && g.dist < m.dist / 2) m = this.whole(q, last!.d);
    }
    this.last = { d: m.d, t: q.t, lon: q.lon, lat: q.lat };
    return m;
  }

  /** (the moving window: a step back costs a little, so a tie near a turnaround goes forward) */
  private window(q: P, d0: number): Match | null {
    const pr = this.pr;
    let best: Match | null = null, score = Infinity;
    for (let i = 0; i < pr.pts.length - 1; i++) {
      if (pr.d[i + 1] < d0 - MATCH.back || pr.d[i] > d0 + MATCH.ahead) continue;
      const c = at(pr, i, onSeg(pr, i, q));
      const s = c.dist + Math.max(0, d0 - c.d) * 0.2;
      if (s < score) ((score = s), (best = c));
    }
    return best;
  }

  /** The whole route: the candidates within 20 m of the nearest (each pass near the spot: out and back has two), the
   *  first at or ahead of the last place (minus a step), else the one nearest it; never placed: the first along. */
  private whole(q: P, d0: number | null): Match {
    const pr = this.pr;
    const segs = Array.from({ length: pr.pts.length - 1 }, (_, i) => at(pr, i, onSeg(pr, i, q)));
    const min = Math.min(...segs.map((s) => s.dist));
    // each pass's own nearest point: a run of near segments is one pass
    const passes: Match[] = [];
    let run: Match | null = null;
    for (const s of segs) {
      if (s.dist <= min + 20) run = !run || s.dist < run.dist ? s : run;
      else if (run) (passes.push(run), (run = null));
    }
    if (run) passes.push(run);
    if (d0 === null) return passes[0];
    return passes.find((p) => p.d >= d0 - 50) ?? passes.reduce((a, b) => (Math.abs(b.d - d0) < Math.abs(a.d - d0) ? b : a));
  }
}

/** Metres between two points (flat: short distances). */
function metres(a: P, b: P): number {
  const k = Math.cos((((a.lat + b.lat) / 2) * Math.PI) / 180);
  return Math.hypot((b.lon - a.lon) * k * M_LAT, (b.lat - a.lat) * M_LAT);
}

/** The off-route banner's rules (spec R4): off after ≥ 3 fixes AND ≥ 20 s beyond max(50 m, 2 × accuracy); back under
 *  30 m. A fix worse than 100 m counts neither way. */
export const OFF = { minM: 50, accK: 2, fixes: 3, ms: 20_000, backM: 30, worstAcc: 100 } as const;

export class OffRoute {
  off = false;
  private n = 0;
  private since: number | null = null;

  /** A fix's distance from the route: 'off' or 'back' when the state flips, else null. */
  update(dist: number, acc: number, t: number): 'off' | 'back' | null {
    if (acc > OFF.worstAcc) return null;
    if (this.off) {
      if (dist >= OFF.backM) return null;
      this.off = false;
      this.n = 0;
      this.since = null;
      return 'back';
    }
    if (dist <= Math.max(OFF.minM, OFF.accK * acc)) return ((this.n = 0), (this.since = null), null);
    this.n++;
    this.since ??= t;
    if (this.n >= OFF.fixes && t - this.since >= OFF.ms) return ((this.off = true), 'off');
    return null;
  }

  reset(): void {
    this.off = false;
    this.n = 0;
    this.since = null;
  }
}

/** The trail's standard time (minutes): a walked record's 標準タイム, else its time as written ('3 h 17 min',
 *  '~3 h 30 min'; a range '10 – 13 h' its longer end: the arrival never promised early); null when none reads. */
export function standardMin(t: Pick<Trail, 'time' | 'walked'>): number | null {
  if (t.walked?.standard) {
    const [h, m] = t.walked.standard.split(':').map(Number);
    if (Number.isFinite(h) && Number.isFinite(m)) return h * 60 + m;
  }
  const s = t.time ?? '';
  const range = s.match(/(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)\s*h/);
  if (range) return Math.round(+range[2] * 60);
  const h = s.match(/(\d+(?:\.\d+)?)\s*h/), m = s.match(/(\d+)\s*min/);
  if (!h && !m) return null;
  return Math.round((h ? +h[1] : 0) * 60 + (m ? +m[1] : 0));
}

/** Each point's cumulative effort along the route (hours of a DIN 33466 walker: 4 km/h on the flat, 300 m/h up, 500 m/h
 *  down): the standard time is spread over the route by it, so a climb left weighs more than a descent. */
export function effort(pr: Prepared): number[] {
  const e = [0];
  for (let i = 1; i < pr.pts.length; i++) {
    const dz = pr.pts[i][2] - pr.pts[i - 1][2];
    e.push(e[i - 1] + (pr.d[i] - pr.d[i - 1]) / 4000 + (dz > 0 ? dz / 300 : -dz / 500));
  }
  return e;
}

/** A value of a per-point series at distance D (linear between points). */
function along(pr: Prepared, s: number[], D: number): number {
  const x = Math.max(0, Math.min(pr.total, D));
  let i = 0;
  while (i < pr.d.length - 2 && pr.d[i + 1] < x) i++;
  const seg = pr.d[i + 1] - pr.d[i];
  return s[i] + (seg > 0 ? (x - pr.d[i]) / seg : 0) * (s[i + 1] - s[i]);
}

/** Climb left from D to the end (m): the smoothed elevations' rises. */
export function climbLeft(pr: Prepared, D: number): number {
  let up = 0, prev = pointAt(pr, D).ele;
  for (let i = 0; i < pr.pts.length; i++) {
    if (pr.d[i] <= D) continue;
    const z = pr.pts[i][2];
    if (z > prev) up += z - prev;
    prev = z;
  }
  return up;
}

export interface Strip {
  /** Walked along the route and left to its end (m). */
  walked: number;
  left: number;
  /** Climb left (m). */
  up: number;
  /** 山頂 while the summit is ahead (not at either end), else ゴール; its clock time (epoch ms), null without a standard time. */
  goal: 'summit' | 'goal';
  eta: number | null;
}

/** The strip at distance D along, now `now` (the standard time scaled by the effort left: R13, no pace adjustment yet). */
export function strip(pr: Prepared, D: number, std: number | null, now: number, e: number[] = effort(pr)): Strip {
  let top = 0;
  pr.pts.forEach((p, i) => p[2] > pr.pts[top][2] && (top = i));
  const summitD = pr.d[top];
  const summit = summitD > D + 30 && summitD > 150 && pr.total - summitD > 150;
  const target = summit ? summitD : pr.total;
  const total = e.at(-1)!;
  const eta = std === null || total <= 0 ? null : now + ((along(pr, e, target) - along(pr, e, D)) / total) * std * 60_000;
  return { walked: D, left: Math.max(0, pr.total - D), up: climbLeft(pr, D), goal: summit ? 'summit' : 'goal', eta };
}
