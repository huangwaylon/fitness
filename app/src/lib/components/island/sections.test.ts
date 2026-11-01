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
  it('are world.ts’s three stops, front to back', () => {
    expect(SECTIONS.map((s) => s.id)).toEqual(['mae', 'hiroba', 'oku']);
    expect(SECTIONS.map((s) => s.z)).toEqual([CAMS.mae, CAMS.hiroba, CAMS.oku]);
  });

  it('fit the screen: the ends are the scroller’s, the middle stays strictly between', () => {
    expect(fitted(90, 1500).map((s) => s.z)).toEqual([90, CAMS.hiroba, 1500]);
    const tight = fitted(800, 850);
    expect(tight[1].z).toBeGreaterThan(800);
    expect(tight[1].z).toBeLessThan(850);
  });

  it('a camera comes to rest on the nearest stop', () => {
    const secs = fitted(150, 1400);
    expect(nearest(secs, 400).id).toBe('mae');
    expect(nearest(secs, 600).id).toBe('hiroba');
    expect(nearest(secs, 1200).id).toBe('oku');
  });

  it('after a follow, the stop that keeps the walker in the band (nearest the camera), else the one framing it best', () => {
    const v = view(), secs = fitted(150, 1400);
    // walking into the plaza: the plaza's stop frames it
    expect(restFor(v, secs, 700, 900).id).toBe('hiroba');
    const r = restFor(v, secs, 300, 214);
    expect(r.id).toBe('mae');
    const [top, bottom] = band(v);
    const sy = syAt(v, r.z, 214);
    expect(sy).toBeGreaterThanOrEqual(top);
    expect(sy).toBeLessThanOrEqual(bottom);
    // up by the campsite: the back
    expect(restFor(v, secs, 1300, 1960).id).toBe('oku');
    expect(sectionFor(v, secs, 214).id).toBe('mae');
  });

  it('solves the back stop: the campsite’s top lands on the line asked for, or the range ends', () => {
    const v = view();
    const top = (cam: number) => syAt(v, cam, 1960, 70);
    const cam = solveCam(top, 151, 1380, 1600);
    expect(Math.abs(top(cam) - 151)).toBeLessThan(1);
    expect(solveCam(top, -1e9, 1380, 1600)).toBe(1380);
    expect(solveCam(top, 1e9, 1380, 1600)).toBe(1600);
  });
});
