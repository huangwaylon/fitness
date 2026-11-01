import { describe, expect, it } from 'vitest';
import { ROLL_DEFAULTS, project, radiusFor } from './roll.ts';
import { CAMS, PIVOT, SKY, TILT } from './world.ts';
import { SECTIONS, fitted, nearest, restFor, sectionFor, solveCam } from './sections.ts';
import { band, type CamView } from './tapWalk.ts';

function view(vh = 852, hudBottom = 135): CamView {
  const P = { ...ROLL_DEFAULTS, tilt: TILT, R: 0 };
  P.R = Math.round(radiusFor((PIVOT - SKY) * vh, P.tilt, P.curve));
  return { P, pivot: vh * PIVOT, vh, s: 1, hudBottom };
}
const syAt = (v: CamView, cam: number, z: number, lift = 0) => {
  const p = project(195, z, cam, v.P);
  return v.pivot + p.y * v.s - lift * p.scale * v.s;
};

describe('the sections', () => {
  it('are world.ts’s two stops, front to back', () => {
    expect(SECTIONS.map((s) => s.id)).toEqual(['mae', 'oku']);
    expect(SECTIONS.map((s) => s.z)).toEqual([CAMS.mae, CAMS.oku]);
  });

  it('fit the screen: the ends are the scroller’s', () => {
    expect(fitted(90, 600).map((s) => s.z)).toEqual([90, 600]);
    // a middle stop (were there one) stays strictly between
    const three = fitted(800, 850, [{ id: 'mae', z: 0 }, { id: 'oku', z: 900 }, { id: 'oku', z: 2000 }]);
    expect(three[1].z).toBeGreaterThan(800);
    expect(three[1].z).toBeLessThan(850);
  });

  it('a camera comes to rest on the nearest stop', () => {
    const secs = fitted(114, 470);
    expect(nearest(secs, 200).id).toBe('mae');
    expect(nearest(secs, 291).id).toBe('mae');
    expect(nearest(secs, 293).id).toBe('oku');
    expect(nearest(secs, 900).id).toBe('oku');
  });

  it('after a follow, the stop that keeps the walker in the band (nearest the camera), else the one framing it best', () => {
    const v = view(), secs = fitted(114, 470);
    const r = restFor(v, secs, 300, 214);
    const [top, bottom] = band(v);
    const sy = syAt(v, r.z, 214);
    expect(sy).toBeGreaterThanOrEqual(top);
    expect(sy).toBeLessThanOrEqual(bottom);
    // up by the campsite: the back
    expect(restFor(v, secs, 400, 960).id).toBe('oku');
    expect(sectionFor(v, secs, 0).id).toBe('mae');
    expect(sectionFor(v, secs, 960).id).toBe('oku');
  });

  it('solves the back stop: the campsite’s top lands on the line asked for, or the range ends', () => {
    const v = view();
    const top = (cam: number) => syAt(v, cam, 984, 80);
    const cam = solveCam(top, 151, 400, 900);
    expect(Math.abs(top(cam) - 151)).toBeLessThan(1);
    expect(solveCam(top, -1e9, 400, 900)).toBe(400);
    expect(solveCam(top, 1e9, 400, 900)).toBe(900);
  });
});
