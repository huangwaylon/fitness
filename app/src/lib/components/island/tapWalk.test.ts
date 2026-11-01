import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nav, walkable } from './nav.ts';
import { ROLL_DEFAULTS, project, radiusFor } from './roll.ts';
import { BRIDGES, BUILDINGS, CAMS, HOMES, PIVOT, POND, SKY, TILT, surfaceAt, type Pt } from './world.ts';
import { BAND_BOTTOM, BAND_TOP, Follow, LERP, SNAP_BACK_MS, band, followStep, followTarget, inBand, isFar, needsFollow, planTap, stepCue, type CamView } from './tapWalk.ts';
import { CUES } from '#lib/sound/cues.ts';
import { SPEED } from './walkGraph.ts';

const RUN = SPEED.run;

const g = nav();
/** The 390 × 844 screen the camera fits (camera.svelte.ts World.fit), with a 100px HUD. */
function view(vh = 844, hudBottom = 100): CamView {
  const P = { ...ROLL_DEFAULTS, tilt: TILT, R: 0 };
  P.R = Math.round(radiusFor((PIVOT - SKY) * vh, P.tilt, P.curve));
  return { P, pivot: vh * PIVOT, vh, s: 1, hudBottom };
}
/** Where world z is on screen (px from the top) for a camera at camZ. */
const syAt = (v: CamView, camZ: number, z: number) => v.pivot + project(195, z, camZ, v.P).y * v.s;

describe('planning a tap', () => {
  it('walks straight to open lawn at the run (200 u/s)', () => {
    const p = planTap(g, [...HOMES.A], 160, 330)!;
    expect(p.snap.kind).toBe('here');
    expect(p.pts).toEqual([[160, 330]]);
    expect(p.ms).toBe(Math.round((p.len / RUN) * 1000));
  });

  it('crosses to the plaza over a bridge, the ring at the snapped spot', () => {
    const p = planTap(g, [...HOMES.A], 195, 900)!;
    expect(p.to).toEqual([195, 900]);
    let at: Pt = [...HOMES.A], over = false;
    for (const q of p.pts) {
      if ((at[1] - 640) * (q[1] - 640) < 0) {
        const x = at[0] + ((q[0] - at[0]) * (640 - at[1])) / (q[1] - at[1]);
        over = BRIDGES.some((b) => Math.abs(x - b.x) <= b.w / 2);
        expect(over).toBe(true);
      }
      at = q;
    }
    expect(over).toBe(true);
  });

  it('a tap on the pond walks to its bank and faces the water; a building’s footprint to its door', () => {
    const p = planTap(g, [...HOMES.A], POND.x, POND.z)!;
    expect(p.snap.kind).toBe('bank');
    expect(walkable(g, p.to[0], p.to[1])).toBe(true);
    const rs = BUILDINGS.find((b) => b.id === 'rs')!;
    const d = planTap(g, [...HOMES.A], rs.x, rs.z + 20)!;
    expect(d.snap).toMatchObject({ kind: 'door', building: 'rs' });
    expect(d.to).toEqual(g.named['door-rs']);
  });

  it('a tap where my villager already stands goes nowhere; a door does (it opens the building)', () => {
    expect(planTap(g, [...HOMES.A], HOMES.A[0], HOMES.A[1])).toBeNull();
    const door = g.named['door-cranny'];
    expect(planTap(g, door, 100, 1360)).toMatchObject({ snap: { kind: 'door', building: 'cranny' } });
  });
});

describe('the camera follow', () => {
  const v = view();

  it('the band is [HUD bottom + 80, vh − 90], and never inverts on a tiny screen', () => {
    expect(band(v)).toEqual([100 + BAND_TOP, 844 - BAND_BOTTOM]);
    const [a, b] = band(view(300, 200));
    expect(a).toBe(b);
  });

  it('knows what is in the band for a camera', () => {
    const cam = CAMS.mae;
    expect(inBand(v, cam, cam)).toBe(true); // the pivot line
    expect(inBand(v, cam, cam + 1500)).toBe(false); // past the horizon
    expect(inBand(v, cam, cam - 400)).toBe(false); // under the screen's foot
  });

  it('a walk inside the band leaves the camera alone; one out of it, or a far tap, needs it', () => {
    expect(needsFollow(v, CAMS.mae, HOMES.A[1], 300)).toBe(false);
    expect(needsFollow(v, CAMS.mae, HOMES.A[1], 1300)).toBe(true);
    expect(needsFollow(v, CAMS.mae, HOMES.A[1], 300, (40 * Math.PI) / 180)).toBe(true);
    expect(isFar((30 * Math.PI) / 180)).toBe(false);
    expect(isFar((36 * Math.PI) / 180)).toBe(true);
  });

  it('the target keeps the walker in the band and leans toward the destination as far as that allows', () => {
    const [top, bottom] = band(v);
    for (const [walker, dest] of [[214, 1300], [900, 200], [600, 640], [1400, 1500]] as const) {
      const cam = followTarget(v, walker, dest, -1e9, 1e9);
      const sy = syAt(v, cam, walker);
      expect(sy, `${walker} → ${dest}`).toBeGreaterThanOrEqual(top - 0.5);
      expect(sy).toBeLessThanOrEqual(bottom + 0.5);
    }
    // both fit: the destination sits in the band's middle
    const cam = followTarget(v, 600, 640, -1e9, 1e9);
    expect(syAt(v, cam, 640)).toBeCloseTo((top + bottom) / 2, 0);
    // a destination far ahead: the walker at the band's foot (as far ahead as the camera may go)
    const ahead = followTarget(v, 214, 1500, -1e9, 1e9);
    expect(syAt(v, ahead, 214)).toBeCloseTo(bottom, 0);
    // clamped to the scroller's range
    expect(followTarget(v, 214, 1500, 100, 300)).toBe(300);
  });

  it('eases 12% a frame and lands exactly', () => {
    expect(followStep(100, 200)).toBeCloseTo(100 + 100 * LERP);
    let c = 0;
    for (let i = 0; i < 200; i++) c = followStep(c, 500);
    expect(c).toBe(500);
  });
});

describe('Follow (the lifecycle)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function rig(cam0 = CAMS.mae) {
    const st = { cam: cam0 as number, snap: true, kicks: 0, moves: 0 };
    const f = new Follow({
      cam: () => st.cam, range: () => [CAMS.mae - 60, CAMS.oku], view: () => view(),
      moveTo: (z) => ((st.cam = z), st.moves++), snap: (on) => (st.snap = on), kick: () => st.kicks++
    });
    return { f, st };
  }

  it('does nothing for a walk in view', () => {
    const { f, st } = rig();
    expect(f.start(214, 300)).toBe(false);
    expect(f.active).toBe(false);
    expect(st.snap).toBe(true);
  });

  it('follows a run up the island with snapping off, and gives the camera back 300 ms after arrival', () => {
    const { f, st } = rig();
    expect(f.start(214, 900)).toBe(true);
    expect(st.snap).toBe(false);
    expect(st.kicks).toBe(1);
    let z = 214;
    for (let i = 0; i < 240; i++) {
      z = Math.min(900, z + RUN / 60);
      expect(f.step(z, z < 900)).toBe(z < 900);
    }
    expect(st.cam).toBeGreaterThan(CAMS.mae + 200);
    expect(f.active).toBe(false);
    expect(st.snap).toBe(false);
    vi.advanceTimersByTime(SNAP_BACK_MS);
    expect(st.snap).toBe(true);
  });

  it('a touch stops it at once (the camera is the user’s)', () => {
    const { f, st } = rig();
    f.start(214, 1300);
    f.step(220, true);
    const moves = st.moves;
    f.stop();
    expect(f.step(240, true)).toBe(false);
    expect(st.moves).toBe(moves);
    vi.advanceTimersByTime(SNAP_BACK_MS);
    expect(st.snap).toBe(true);
  });

  it('a far tap eases the camera even when the band would not ask', () => {
    const { f } = rig();
    expect(f.start(214, 300, (50 * Math.PI) / 180)).toBe(true);
  });
});

describe('footsteps by the ground', () => {
  it('pick grass, sand, brick, wood and stone from the plan, snow in winter, a splash in the rain, nothing in water', () => {
    const at = (x: number, z: number, winter = false, rain = false) => stepCue(surfaceAt(x, z), winter, rain);
    expect(at(150, 400)).toBe('footstep-grass');
    expect(at(150, 50)).toBe('footstep-sand');
    expect(at(195, 1100 + 80)).toBe('footstep-brick');
    expect(at(296, 640)).toBe('footstep-wood');
    expect(at(195, 640)).toBe('footstep-stone');
    expect(at(195, 900)).toBe('footstep-stone');
    expect(at(150, 400, true)).toBe('footstep-snow');
    expect(at(195, 900, true)).toBe('footstep-stone');
    expect(at(150, 400, false, true)).toBe('footstep-splash');
    expect(at(296, 640, false, true)).toBe('footstep-wood');
    expect(at(POND.x, POND.z)).toBeNull();
    for (const c of ['footstep-wood', 'footstep-stone', 'footstep-brick'] as const) expect(CUES[c]).toBeDefined();
  });
});
