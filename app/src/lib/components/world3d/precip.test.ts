import { describe, expect, it } from 'vitest';
import { BOX, COUNTS, FADE_MS, GROUPS, drawnOf, groupAlpha, lookOf, particleAt, stepLevel, wrapIn } from './precip.ts';

describe('precip.ts: the rain and the snow in 3D', () => {
  it('maps each sky to what falls: nothing fine or cloudy; a downpour denser, quicker, longer and stronger than rain; snow slow', () => {
    expect([lookOf('clear'), lookOf('cloudy')]).toEqual([null, null]);
    const rain = lookOf('rain')!, heavy = lookOf('heavy')!, snow = lookOf('snow')!;
    expect([rain.kind, heavy.kind, snow.kind]).toEqual(['rain', 'rain', 'snow']);
    const bad: string[] = [];
    for (const k of ['density', 'alpha', 'speed', 'len', 'tilt', 'rings'] as const) if (!(heavy[k] > rain[k])) bad.push(`heavy ${k} ${heavy[k]} ≤ rain ${rain[k]}`);
    // subtle: faint streaks, a modest count (NH's), flakes soft and slow
    if (!(rain.alpha <= 0.35 && heavy.alpha <= 0.4)) bad.push(`alpha ${rain.alpha} ${heavy.alpha}`);
    if (!(snow.speed < rain.speed / 10)) bad.push(`snow speed ${snow.speed}`);
    if (snow.rings !== 0) bad.push('snow rings');
    const n = (k: 'rain' | 'snow') => COUNTS[k].reduce((a, b) => a + b, 0);
    if (n('rain') > 1500 || n('snow') > 700) bad.push(`counts ${n('rain')} ${n('snow')}`);
    if (!(drawnOf(rain) >= 800 && drawnOf(rain) < drawnOf(heavy) && drawnOf(heavy) === n('rain'))) bad.push(`drawn ${drawnOf(rain)} ${drawnOf(heavy)}`);
    if (drawnOf(snow) < 400 || drawnOf(snow) > 700) bad.push(`snow drawn ${drawnOf(snow)}`);
    expect(bad).toEqual([]);
  });

  it('fades the smallest group in as a pinch goes in, the other two always whole', () => {
    const bad: string[] = [];
    let was = [0, 0, 0];
    for (let z = 1; z <= 3.2; z += 0.05) {
      const a = groupAlpha(z);
      if (a[0] !== 1 || a[1] !== 1 || a.some((v, i) => v < was[i] - 1e-9 || v < 0 || v > 1)) bad.push(`${z.toFixed(2)}: ${a}`);
      was = a;
    }
    expect([groupAlpha(1), groupAlpha(3.2)]).toEqual([[1, 1, 0], [1, 1, 1]]);
    expect(GROUPS.map((g) => g.scale)).toEqual([1, 1 / 1.8, 1 / 3]);
    expect(bad).toEqual([]);
  });

  it('wraps every particle inside its box round the view, anchored in the world as the box moves', () => {
    const bad: string[] = [];
    const S = BOX.rain;
    // GLSL's mod (never negative)
    if (wrapIn(-1, 0, 10) !== 9 || wrapIn(25, 10, 10) !== 15 || wrapIn(10, 10, 10) !== 10) bad.push('wrapIn');
    for (let i = 0; i < 200; i++) {
      const seed = [((i * 0.618) % 1), ((i * 0.414) % 1), ((i * 0.732) % 1)] as const;
      for (const [cx, cz, fall] of [[195, -400, 0], [195, -400, 12345.6], [-60, 2500, 777], [400, -1200, 3e5]] as const) {
        const p = particleAt(seed, S, [cx, cz], fall, 0.12);
        const inside = p[0] >= cx - S[0] / 2 && p[0] < cx + S[0] / 2 && p[1] >= 0 && p[1] < S[1] && p[2] >= cz - S[2] / 2 && p[2] < cz + S[2] / 2;
        if (!inside) bad.push(`${i} @${cx},${cz},${fall}: ${p.map((v) => v.toFixed(1))}`);
        // the box moved a little (a scroll): the particle stays where it was in the world unless it changed copies
        const q = particleAt(seed, S, [cx + 7, cz - 11], fall, 0.12);
        const same = Math.abs(q[0] - p[0]) < 1e-6 || Math.abs(Math.abs(q[0] - p[0]) - S[0]) < 1e-6;
        const sameZ = Math.abs(q[2] - p[2]) < 1e-6 || Math.abs(Math.abs(q[2] - p[2]) - S[2]) < 1e-6;
        if (!same || !sameZ || Math.abs(q[1] - p[1]) > 1e-6) bad.push(`${i} moved with the box: ${p} → ${q}`);
      }
      // falling: down (and along its slant) by what it fell, until it wraps to the top
      const a = particleAt(seed, S, [195, -400], 100, 0.12), b = particleAt(seed, S, [195, -400], 110, 0.12);
      if (a[1] - b[1] > 0 && Math.abs(a[1] - b[1] - 10) > 1e-6) bad.push(`${i} fell ${a[1] - b[1]}`);
    }
    expect(bad).toEqual([]);
  });

  it('fades in and out linearly over a minute', () => {
    expect([stepLevel(0, 1, FADE_MS / 2), stepLevel(0.5, 0, FADE_MS), stepLevel(0.9, 1, FADE_MS), stepLevel(1, 1, 16)]).toEqual([0.5, 0, 1, 1]);
  });
});
