// No moment shakes (the user, 2026-11-25: "my character and some visitors violently and rapidly shake side to side"):
// the wiggle twisted the body 0.45 rad at 5 Hz and the laugh shook at 9 Hz with an 18 Hz bob, a buzz at the island's
// 30 fps that a tall body (a player, Gracie) turned into its head flung 24 u side to side. Each moment is a function of
// its own time (not of the frames: a dt spike can't overshoot it), so it's sampled here at 1 ms and on the island's
// frames (30 fps, 12 fps, and a run of 100 ms spikes) for its quickest turn back and its sideways swing.
import { describe, expect, it } from 'vitest';
import { ACTION_MS, SHAKE_MS, action, type Action } from './poses.ts';
import { turn } from '#lib/math.ts';

/** Every scalar of a moment's pose at `u` (its joints' angles, scaled by its envelope; its lift), by name. */
function channels(a: Action, u: number): Map<string, number> {
  const { p, w } = action(a, u), out = new Map<string, number>();
  for (const [j, v] of Object.entries(p.j)) v?.forEach((x, i) => out.set(`${j}.${'xyz'[i]}`, x * w));
  out.set('y', p.y * w);
  return out;
}

/** How often a moment turns back (the most of any channel): its extremes, each kept only where the swing from the last
 *  kept one is over `min`, and the shortest time between two of them (ms). */
function turns(a: Action, times: readonly number[], min = 0.03): { n: number; ms: number; ch: string } {
  const series = new Map<string, [number, number][]>();
  for (const u of times) for (const [k, v] of channels(a, u)) (series.get(k) ?? series.set(k, []).get(k)!).push([u, v]);
  let best = { n: 0, ms: Infinity, ch: '' };
  for (const [ch, s] of series) {
    const ext: [number, number][] = [s[0]];
    let dir = 0;
    for (let i = 1; i < s.length; i++) {
      const d = Math.sign(s[i][1] - s[i - 1][1]);
      if (d && dir && d !== dir && Math.abs(s[i - 1][1] - ext[ext.length - 1][1]) > min) ext.push(s[i - 1]);
      if (d) dir = d;
    }
    const n = ext.length - 1;
    if (n > best.n) best = { n, ms: Math.min(...ext.slice(2).map((e, i) => e[0] - ext[i + 1][0])), ch };
  }
  return best;
}

const ACTIONS = Object.keys(ACTION_MS) as Action[];
const every = (T: number, step: number) => Array.from({ length: Math.floor(T / step) + 1 }, (_, i) => i * step);

/** The most turns back a moment of `ms` may make: one each half SHAKE_MS (ten frames a cycle at 30 fps), and its way in
 *  and out. */
const most = (ms: number) => ms / (SHAKE_MS / 2) + 2;

describe('the moments never shake (poses.ts SHAKE_MS)', () => {
  it('no moment turns back oftener than each half SHAKE_MS', () => {
    for (const a of ACTIONS) {
      const q = turns(a, every(ACTION_MS[a], 1));
      expect(q.n, `${a} ${q.ch}`).toBeLessThanOrEqual(most(ACTION_MS[a]));
    }
  });

  it('nor on the island\'s frames (30 fps, the ambient 12 fps, a run with 100 ms spikes): a wiggle, a laugh', () => {
    const spikes = [0, 16, 33, 133, 150, 250, 266, 283, 383, 400, 500, 533, 633, 650, 750, 800, 900];
    for (const a of ['wiggle', 'laugh'] as const)
      for (const times of [every(ACTION_MS[a], 1000 / 30), every(ACTION_MS[a], 1000 / 12), spikes.filter((u) => u <= ACTION_MS[a])]) {
        const q = turns(a, times);
        expect(q.n, `${a} ${q.ch} ${times.length}`).toBeLessThanOrEqual(most(ACTION_MS[a]));
      }
  });

  it('the wiggle rocks the body gently (as the 2D sprite\'s ±7°), not a twist', () => {
    let twist = 0, roll = 0;
    for (const u of every(ACTION_MS.wiggle, 1)) {
      const c = channels('wiggle', u);
      twist = Math.max(twist, Math.abs((c.get('Spine_1.y') ?? 0) + (c.get('Spine_2.y') ?? 0)));
      roll = Math.max(roll, Math.abs((c.get('Spine_1.z') ?? 0) + (c.get('Spine_2.z') ?? 0)));
    }
    expect(twist).toBeLessThan(0.12);
    expect(roll).toBeLessThan(0.2);
  });

  it('a turn to a heading never overshoots it, however long the frame (a tab back, the idle throttle)', () => {
    for (const dt of [16, 33, 83, 100, 250, 1000, 5000]) {
      let y = 0;
      const seen: number[] = [];
      for (let i = 0; i < 20; i++) seen.push((y = turn(y, 1.1, dt, 14)));
      expect(Math.max(...seen), `dt ${dt}`).toBeLessThanOrEqual(1.1 + 1e-9);
      for (let i = 1; i < seen.length; i++) expect(seen[i]).toBeGreaterThanOrEqual(seen[i - 1]);
    }
  });
});
