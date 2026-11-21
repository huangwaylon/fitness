// Hike mode's arithmetic (docs/hiking.md "In-hike map"), pure: where on the route a fix is (walked vs ahead), how far
// off it, the off-route banner's hysteresis, and the strip's figures (歩いた · のこり · のぼり · 到着 ごろ). Navigation only:
// nothing here is recorded; the fixes stay on the phone.
import type { Prepared } from '#lib/hiking/track.ts';
import { pointAt } from '#lib/hiking/track.ts';
import type { Trail } from '#lib/hiking/types.ts';
import { M_LAT, flatM, mLon } from '#lib/hiking/flat.ts';

type P = { lon: number; lat: number };

/** The nearest point of segment i to `q` on a local flat projection (metres): its distance, fraction and point. */
function onSeg(pr: Prepared, i: number, q: P): { dist: number; f: number; lon: number; lat: number } {
  const [ax, ay] = pr.pts[i], [bx, by] = pr.pts[i + 1];
  const k = mLon(q.lat);
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
 *  the whole route first; how far a walker goes in a silence (m/s: `pace` a hiker's on a mountain, `fast` the most
 *  anyone walks, plus `spare` m); how far along the route the direction of travel is read over (m), and a step along it
 *  faster than `spike` m/s (a GPS spike, a snap to the next switchback) no say in it; passes within `twinM` of the fix
 *  (a crossing, an out-and-back's two legs) make a whole-route match unsure till the window has followed `sureM`. */
const MATCH = { back: 150, ahead: 600, gapMs: 60_000, jumpM: 300, pace: 3 / 3.6, fast: 6 / 3.6, spare: 200, dirM: 30, spike: 12 / 3.6, twinM: 20, sureM: 50 } as const;

/** Where a hike is when resumed (a relaunch: components/hiking/resume.ts): a distance along the route and a direction, no
 *  position. */
export interface Resumed { d: number; dir: 1 | -1; t: number }

/** A resumed place still worth searching from at `now`: only while the time since it is within the remaining route's
 *  standard time (3 h without one); else null (a hike left unended: the next one starts from the first pass along). */
export function resumable(pr: Prepared, r: Resumed, std: number | null, now: number, e: number[] = effort(pr)): Resumed | null {
  const total = e.at(-1)!;
  const left = std !== null && total > 0 ? ((total - along(pr, e, r.d)) / total) * std * 60_000 : 3 * 3_600_000;
  return now - r.t <= left ? r : null;
}

/** Where along the route each fix is: a moving window around the last place (so an out-and-back's way down never
 *  snaps to the way up passing near it), the whole route searched first after a gap or a jump (the pass a walker could
 *  have reached since, nearest where their pace puts them in their direction of travel). Only accurate fixes on the
 *  route move it (`fix`); the direction of travel is the sign of the last 30 m along the route, turned only by two
 *  fixes in a row 30 m the other way. */
export class Matcher {
  /** The place last matched (null: none yet). */
  at: Match | null = null;
  /** The direction of travel along the route: 1 forward, -1 walking it backward. */
  dir: 1 | -1 = 1;
  last: { d: number; t: number; lon: number; lat: number } | null = null;
  private pr: Prepared;
  /** (where the last 30 m of progress began; the last step that counted for it; fixes in a row the other way) */
  private from: number | null = null;
  private step: { d: number; t: number } | null = null;
  private turns = 0;
  /** (an unsure match's place: null when sure) */
  private twin: number | null = null;
  constructor(pr: Prepared, resumed?: Resumed | null) {
    this.pr = pr;
    // a resumed place has no position: the next fix searches the whole route from it (NaN: never a "short" jump)
    if (resumed) ((this.last = { d: resumed.d, t: resumed.t, lon: NaN, lat: NaN }), (this.dir = resumed.dir));
  }

  /** False after a whole-route search from a last place with two passes near the fix (which one is a guess: the card gives no way), till
   *  the window has followed it 50 m or a search finds one pass. */
  get sure(): boolean {
    return this.twin === null;
  }

  /** A fix from the watch: placed only when its accuracy is 100 m or better (OFF.worstAcc: a cell fix can sit on the
   *  summit) and it is on the route (within max(50 m, 2 × accuracy)), or nothing is placed yet and it is within 1 km;
   *  `g` the route's nearest point (the off-route distance and its line). */
  fix(q: P & { t: number; acc: number }): { at: Match | null; g: Match } {
    const g = nearest(this.pr, q);
    if (q.acc <= OFF.worstAcc && g.dist <= (this.at ? Math.max(OFF.minM, OFF.accK * q.acc) : OFF.farM)) this.at = this.match(q, g);
    return { at: this.at, g };
  }

  /** (`g`: the route's nearest point to `q`, when already found) */
  match(q: P & { t: number }, g: Match = nearest(this.pr, q)): Match {
    const last = this.last;
    let m: Match | null = null;
    const far = !last || q.t - last.t > MATCH.gapMs || !(flatM(last.lon, last.lat, q.lon, q.lat) <= MATCH.jumpM);
    if (!far) m = this.window(q, last!.d);
    // the window lost it (off-route far, or a short cut across): the whole route if it is clearly nearer there (unsure:
    // as soon as another pass is 20 m nearer)
    const lost = !m || (this.twin === null ? m.dist > 80 && g.dist < m.dist / 2 : m.dist - g.dist > MATCH.twinM);
    if (far || lost) {
      m = this.whole(q, last ? { d: last.d, ms: q.t - last.t } : null);
      // a new place: the direction read from it
      ((this.from = null), (this.step = null), (this.turns = 0));
    } else if (this.twin !== null && Math.abs(m!.d - this.twin) >= MATCH.sureM) this.twin = null;
    this.last = { d: m!.d, t: q.t, lon: q.lon, lat: q.lat };
    this.travel(m!.d, q.t);
    return m!;
  }

  /** The direction of travel: turned by two fixes in a row 30 m along the route the other way; a step faster than
   *  anyone walks since the last that counted (a GPS spike, a snap to the next switchback) counts for nothing. */
  private travel(d: number, t: number): void {
    const st = this.step;
    if (st && Math.abs(d - st.d) > MATCH.spike * Math.max(1, (t - st.t) / 1000)) return;
    this.step = { d, t };
    if (this.from === null) return void (this.from = d);
    const s = d - this.from;
    if (Math.abs(s) < MATCH.dirM) return void (this.turns = 0);
    if (Math.sign(s) !== this.dir && ++this.turns < 2) return;
    ((this.dir = s > 0 ? 1 : -1), (this.from = d), (this.turns = 0));
  }

  /** (the moving window: a step back costs a little, so a tie near a turnaround goes forward; a step ahead a tenth of
   *  that, so on legs that overlap (out and back within 300 m of the top) the nearer pass along wins a tie) */
  private window(q: P, d0: number): Match | null {
    const pr = this.pr;
    let best: Match | null = null, score = Infinity;
    for (let i = 0; i < pr.pts.length - 1; i++) {
      if (pr.d[i + 1] < d0 - MATCH.back || pr.d[i] > d0 + MATCH.ahead) continue;
      const c = at(pr, i, onSeg(pr, i, q));
      const s = c.dist + Math.max(0, d0 - c.d) * 0.2 + Math.max(0, c.d - d0) * 0.02;
      if (s < score) ((score = s), (best = c));
    }
    return best;
  }

  /** The whole route: the candidates within 20 m of the nearest (each pass near the spot: out and back has two); from
   *  a last place `ms` ago, the one nearest where 3 km/h in the direction of travel puts them, each metre beyond what a
   *  walker could have reached (6 km/h + 200 m, either way) counted twice, and the match unsure when there were two or
   *  more; never placed: the first along (the hike's start). */
  private whole(q: P, from: { d: number; ms: number } | null): Match {
    const pr = this.pr;
    const segs = Array.from({ length: pr.pts.length - 1 }, (_, i) => at(pr, i, onSeg(pr, i, q)));
    const min = Math.min(...segs.map((s) => s.dist));
    // each pass's own nearest point: a run of near segments is one pass
    const passes: Match[] = [];
    let run: Match | null = null;
    for (const s of segs) {
      if (s.dist <= min + MATCH.twinM) run = !run || s.dist < run.dist ? s : run;
      else if (run) (passes.push(run), (run = null));
    }
    if (run) passes.push(run);
    this.twin = null;
    if (!from) return passes[0];
    const s = Math.max(0, from.ms) / 1000, reach = s * MATCH.fast + MATCH.spare, aim = from.d + this.dir * s * MATCH.pace;
    const cost = (p: Match) => Math.abs(p.d - aim) + Math.max(0, Math.abs(p.d - from.d) - reach);
    const m = passes.reduce((a, b) => (cost(b) < cost(a) ? b : a));
    if (passes.length > 1) this.twin = m.d;
    return m;
  }
}

/** The off-route banner's rules (spec R4): off after ≥ 3 fixes AND ≥ 20 s beyond max(50 m, 2 × accuracy); back under
 *  30 m. A fix worse than 100 m counts neither way. Over `farM` from the route before ever on it: no place on it yet,
 *  and an approach (live.svelte.ts: a neutral note, not the alert). */
export const OFF = { minM: 50, accK: 2, fixes: 3, ms: 20_000, backM: 30, worstAcc: 100, farM: 1000 } as const;

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

/** Climb left from D to the end (m): every rise of the track's elevations as they are (not smoothed). */
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
