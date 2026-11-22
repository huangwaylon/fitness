import { describe, expect, it } from 'vitest';
import { JOINTS, type Body } from './poses-kit.ts';
import { CABS, LAID, RIDE_USES, SLIDE, SPIN, hidesIn, motionOf, restOf, slideAt } from './poses-ride.ts';

const BODY: Body = { thigh: 1.6, shin: 1.4, hip: 3.4 };
const o = { phase: 0, speed: 0, body: BODY, seed: 0, seatH: 4.8, back: true, climb: 5 };
const TAU = Math.PI * 2;

describe('the rides\' poses and what their pieces do (poses-ride.ts)', () => {
  it('every ride over two reps: finite, the joints within a turn, the knees never bent backwards, the body near its spot', () => {
    const bad: string[] = [];
    for (const [u, d] of Object.entries(RIDE_USES)) for (let i = 0; i <= 120; i++) {
      const t = (i / 60) * d.ms + 11, p = d.pose(t, o);
      if ([p.y, p.sq, p.pitch, ...Object.values(p.j).flat()].some((n) => !Number.isFinite(n as number))) bad.push(`${u} ${t}: not finite`);
      for (const [j, v] of Object.entries(p.j)) {
        if (!JOINTS.includes(j as never) || v!.some((a) => Math.abs(a) > 3.2)) bad.push(`${u} ${t}: ${j} ${v}`);
        if ((j === 'Leg_2_L' || j === 'Leg_2_R') && v![0] < -0.01) bad.push(`${u} ${t}: ${j} backwards`);
      }
      if (p.y > 2 || p.y < -(BODY.thigh + BODY.shin)) bad.push(`${u}: lift ${p.y}`);
    }
    expect(bad).toEqual([]);
  });

  it('the slide goes up its back, along its top, down its trunk, off and back round to its foot, on the clock', () => {
    const ms = Object.values(SLIDE).reduce((a, b) => a + b, 0), at = (u: number) => slideAt(u);
    expect(at(0)).toMatchObject({ phase: 'climb', x: 0, y: 0, z: 0 });
    expect(at(SLIDE.climb + 10)).toMatchObject({ phase: 'scoot', y: 1 });
    const down = SLIDE.climb + SLIDE.scoot;
    expect(at(down + SLIDE.slide * 0.5).phase).toBe('slide');
    expect(at(down + SLIDE.slide * 0.8).y).toBeLessThan(at(down + SLIDE.slide * 0.2).y);
    expect(at(down + SLIDE.slide * 0.8).z).toBeGreaterThan(at(down + SLIDE.slide * 0.2).z);
    expect(at(ms - 300).phase).toBe('walk');
    // round to where it started: continuous over the loop's seam (the turn a whole one)
    const end = at(ms - 1), start = at(ms + 1);
    expect(Math.hypot(end.x - start.x, end.z - start.z, end.y - start.y)).toBeLessThan(0.02);
    expect(Math.abs(Math.cos(end.yaw - start.yaw) - 1)).toBeLessThan(1e-3);
  });

  it('the teacup and the carousel turn with the wall clock; let go of, rest at a look-alike turn; the train chugs in place', () => {
    for (const code of ['f1507', 'f12684']) {
      const s = SPIN[code] as { ms: number; n: number };
      expect(motionOf('ride', code, s.ms / 4)!.ry).toBeCloseTo(TAU / 4, 6);
      expect(motionOf('ride', code, 7 * s.ms + 100)!.ry).toBeCloseTo(motionOf('ride', code, 100)!.ry, 6);
      expect(motionOf('ride', code, 0)!.carry).toBe(true);
      expect(Math.abs(Math.sin((restOf(code, 1.3) * s.n) / 2))).toBeLessThan(1e-9);
    }
    const chug = [0, 100, 200, 300].map((t) => motionOf('ride', 'f12803', t)!);
    expect(chug.every((m) => m.ry === 0 && m.x === 0 && m.z === 0)).toBe(true);
    expect(new Set(chug.map((m) => m.y.toFixed(3))).size).toBeGreaterThan(1);
    // a ride with no spin of its own does nothing to its piece
    expect(motionOf('ride', 'f1', 0)).toBeNull();
  });

  it('the swivel chair swivels both ways and back, the massage chair shakes a little, a vehicle rumbles: their riders carried', () => {
    const sw = Array.from({ length: 64 }, (_, i) => motionOf('swivel', 'f13519', i * 100)!.ry);
    expect(Math.max(...sw)).toBeGreaterThan(0.4);
    expect(Math.min(...sw)).toBeLessThan(-0.4);
    const ms = Array.from({ length: 50 }, (_, i) => motionOf('massage', 'f12338', i * 7)!);
    expect(Math.max(...ms.map((m) => Math.hypot(m.x, m.z)))).toBeLessThan(0.1);
    expect(new Set(ms.map((m) => m.x.toFixed(4))).size).toBeGreaterThan(10);
    expect(motionOf('drive', 'f12606', 50)!.carry).toBe(true);
  });

  it('the surfboard lies down off its rack to be stood on; the tire toy squashes; a cart rocks along its push; the boarded and the closed cabs hide', () => {
    const surf = motionOf('balance', 'f7868', 0)!;
    expect(surf.rx).toBeCloseTo(Math.PI / 2, 6);
    expect(surf.y).toBe(LAID.f7868.lift);
    const sq = Array.from({ length: 30 }, (_, i) => motionOf('bounce', 'f2329', i * 60)!.sy);
    expect(Math.min(...sq)).toBeLessThan(0.92);
    expect(Math.max(...sq)).toBeLessThanOrEqual(1);
    expect(motionOf('bounce', 'f1598', 0)).toBeNull();
    // pushed facing −x (yaw −π/2): rocked along x only
    const c = motionOf('push', 'f1493', 112, -Math.PI / 2)!;
    expect(Math.abs(c.z)).toBeLessThan(1e-9);
    expect(Math.abs(c.x)).toBeGreaterThan(0.05);
    expect(hidesIn('board', 'f1441')).toBe(true);
    for (const code of CABS) expect(hidesIn('drive', code)).toBe(true);
    expect(hidesIn('drive', 'f12606')).toBe(false);
    expect(hidesIn('ride', 'f1507')).toBe(false);
  });
});
