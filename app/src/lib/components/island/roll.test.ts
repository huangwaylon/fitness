import { describe, expect, it } from 'vitest';
import { ROLL_DEFAULTS, band, quadMatrix, camAt, horizonAhead, horizonUp, project, radiusFor, scrollFor, sinkBelow, zIndexAt, type RollParams } from './roll.ts';

const P: RollParams = { ...ROLL_DEFAULTS, R: 700, tilt: 64 };
const RAD = Math.PI / 180;

describe('project(): the cylinder', () => {
  it('the camera’s foot is the pivot: no offset, scale 1, ground unsquashed, fully opaque', () => {
    const a = project(P.cx, 500, 500, P);
    expect(a.x).toBeCloseTo(0);
    expect(a.y).toBeCloseTo(0);
    expect(a.scale).toBeCloseTo(1);
    expect(a.ground).toBeCloseTo(1);
    expect(a.depth).toBeCloseTo(0);
    expect(a.fade).toBe(1);
    expect(a.visible).toBe(true);
  });

  it('follows θ = (z − camZ)/R: up = R·sin θ − R(1 − cos θ)·cot(tilt)', () => {
    const z = 300, th = z / P.R, phi = P.tilt * RAD;
    const a = project(P.cx, z, 0, P);
    expect(a.theta).toBeCloseTo(th);
    expect(-a.y).toBeCloseTo(P.R * Math.sin(th) - P.R * (1 - Math.cos(th)) / Math.tan(phi));
    expect(a.ground).toBeCloseTo(Math.cos(th) - Math.sin(th) / Math.tan(phi));
  });

  it('looking straight down the ground foreshortens by cos θ', () => {
    const top = { ...P, tilt: 90 };
    for (const z of [100, 300, 600]) expect(project(top.cx, z, 0, top).ground).toBeCloseTo(Math.cos(z / top.R));
  });

  it('further is higher on screen, smaller, deeper and more squashed, up to the horizon', () => {
    let prev = project(P.cx, 0, 0, P);
    for (let z = 20; z < horizonAhead(P); z += 20) {
      const a = project(P.cx + 100, z, 0, P);
      expect(a.y).toBeLessThan(prev.y);
      expect(a.scale).toBeLessThan(prev.scale + 1e-9);
      expect(a.depth).toBeGreaterThan(prev.depth);
      expect(a.ground).toBeLessThan(prev.ground + 1e-9);
      prev = a;
    }
  });

  it('the horizon: where the ground turns edge-on, at θ = tilt, R·tan(tilt/2) above the pivot, whatever the camera', () => {
    for (const cam of [0, 400, 1234]) {
      const h = project(P.cx, cam + horizonAhead(P), cam, P);
      expect(h.theta).toBeCloseTo(P.tilt * RAD);
      expect(h.ground).toBeCloseTo(0);
      expect(-h.y).toBeCloseTo(horizonUp(P));
      expect(-h.y).toBeCloseTo(P.R * Math.tan((P.tilt * RAD) / 2));
    }
    // nothing on the ground is ever drawn above it
    for (let z = -400; z < 2000; z += 25) expect(-project(P.cx, z, 0, P).y).toBeLessThanOrEqual(horizonUp(P) + 1e-9);
  });

  it('x shrinks toward the centre line with the perspective scale; orthographic keeps it', () => {
    const near = project(P.cx + 100, 0, 0, P), far = project(P.cx + 100, 600, 0, P);
    expect(near.x).toBeCloseTo(100);
    expect(far.x).toBeCloseTo(100 * far.scale);
    expect(far.scale).toBeLessThan(0.85);
    expect(project(P.cx + 100, 600, 0, { ...P, persp: Infinity }).x).toBeCloseTo(100);
  });

  it('fades between fadeStart and fadeEnd, still visible a little past the horizon, gone well past it or under the camera', () => {
    const at = (deg: number) => project(P.cx, (deg * RAD) * P.R, 0, P);
    expect(at(P.fadeStart - 1).fade).toBe(1);
    expect(at((P.fadeStart + P.fadeEnd) / 2).fade).toBeCloseTo(0.5);
    expect(at(P.fadeEnd + 1).fade).toBe(0);
    expect(at(P.tilt + 10).visible).toBe(true);
    expect(at(P.tilt + 30).visible).toBe(false);
    expect(at(-85).visible).toBe(false);
    expect(at(-40).visible).toBe(true);
  });

  it('a sprite sinks behind the horizon only once its feet pass it', () => {
    expect(sinkBelow(project(P.cx, 300, 0, P), P)).toBe(0);
    expect(sinkBelow(project(P.cx, horizonAhead(P) - 1, 0, P), P)).toBe(0);
    const past = project(P.cx, horizonAhead(P) + 120, 0, P);
    expect(sinkBelow(past, P)).toBeGreaterThan(5);
    expect(sinkBelow(past, P)).toBeCloseTo((past.y + horizonUp(P)) / past.scale);
  });
});

describe('the parabola (for the comparison)', () => {
  const Q: RollParams = { ...P, curve: 'parabola' };
  it('matches the cylinder near the camera and drops by d²/2R', () => {
    const c = project(Q.cx, 60, 0, P), q = project(Q.cx, 60, 0, Q);
    expect(q.y).toBeCloseTo(c.y, 0);
    const phi = Q.tilt * RAD;
    expect(-project(Q.cx, 300, 0, Q).y).toBeCloseTo(300 - (300 * 300) / (2 * Q.R) / Math.tan(phi));
  });
  it('its horizon is at d = R·tan(tilt), R·tan(tilt)/2 up; radiusFor gives either curve the same horizon', () => {
    const h = project(Q.cx, horizonAhead(Q), 0, Q);
    expect(h.ground).toBeCloseTo(0);
    expect(-h.y).toBeCloseTo(horizonUp(Q));
    for (const curve of ['cylinder', 'parabola'] as const) {
      const R = radiusFor(450, 64, curve);
      expect(horizonUp({ ...P, curve, R })).toBeCloseTo(450);
    }
  });
});

describe('band(): the ground cut into strips', () => {
  it('a band spans its projected edges; bands tile with no gap and no overlap', () => {
    const cam = 200, n = 30, depth = 60;
    let prevTop: number | null = null;
    for (let i = 0; i < n; i++) {
      const b = band(i * depth, (i + 1) * depth, cam, P);
      if (!b.visible) continue;
      if (prevTop !== null) expect(b.y).toBeCloseTo(prevTop);
      expect(b.scaleY).toBeCloseTo(b.span / depth);
      prevTop = b.y - b.span;
    }
    expect(prevTop!).toBeCloseTo(-horizonUp(P));
  });
  it('squashes harder toward the horizon; a band past it is not drawn', () => {
    const a = band(200, 260, 200, P), b = band(600, 660, 200, P);
    expect(b.scaleY).toBeLessThan(a.scaleY);
    expect(band(200 + horizonAhead(P) + 1, 200 + horizonAhead(P) + 61, 200, P).visible).toBe(false);
  });
});

describe('the camera and the draw order', () => {
  it('scroll top is the back, scroll bottom the front; scrollFor is camAt’s inverse', () => {
    expect(camAt(0, 300, 1700, 1)).toBe(1700);
    expect(camAt(1400, 300, 1700, 1)).toBe(300);
    expect(camAt(scrollFor(900, 1700, 0.82), 300, 1700, 0.82)).toBeCloseTo(900);
  });
  it('z-index follows the projected depth at the feet (further = lower), ties by x', () => {
    const zs = [100, 340, 341, 800, 1500];
    for (let i = 1; i < zs.length; i++) {
      expect(project(P.cx, zs[i], 300, P).depth).toBeGreaterThan(project(P.cx, zs[i - 1], 300, P).depth);
      expect(zIndexAt(zs[i], 195, 2600)).toBeLessThan(zIndexAt(zs[i - 1], 195, 2600));
    }
    expect(zIndexAt(500, 100, 2600)).toBeLessThan(zIndexAt(500, 101, 2600));
    expect(zIndexAt(500, 400, 2600)).toBeLessThan(zIndexAt(499.75, -100, 2600));
  });
});

describe('quadMatrix(): a band as a trapezoid', () => {
  const apply = (m: number[], x: number, y: number) => {
    const w = m[3] * x + m[7] * y + m[15];
    return [(m[0] * x + m[4] * y + m[12]) / w, (m[1] * x + m[5] * y + m[13]) / w];
  };
  it('takes the box’s corners onto the quad’s', () => {
    const q = [40, 10, 160, 10, 190, 60, 10, 60];
    const m = quadMatrix(200, 50, q);
    for (const [i, [x, y]] of [[0, 0], [200, 0], [200, 50], [0, 50]].entries()) {
      const [px, py] = apply(m, x, y);
      expect(px).toBeCloseTo(q[i * 2]);
      expect(py).toBeCloseTo(q[i * 2 + 1]);
    }
  });
  it('a rectangle is a plain scale and translate', () => {
    expect(quadMatrix(100, 20, [5, 7, 205, 7, 205, 47, 5, 47]).map((v) => v + 0)).toEqual([2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 5, 7, 0, 1]);
  });
});
