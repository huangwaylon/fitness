import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { walkNav } from '#lib/world/nav.ts';
import { worldOf } from '#lib/world/layoutWorld.ts';
import { CAMPSITE, CLIFF, HOMES, POND, setWorld, surfaceAt } from '#lib/world/world.ts';
import { planTap, standAt, stepCue } from './tapWalk.ts';
import { CUES } from '#lib/sound/cues.ts';
import { SPEED } from '#lib/world/speed.ts';
import { walkable } from '#lib/layout/nav.ts';
import { defaultLayout } from '#lib/layout/model.ts';

const RUN = SPEED.run;

describe('planning a tap (the island on its layout)', () => {
  beforeAll(() => setWorld(worldOf(defaultLayout())));
  afterAll(() => setWorld(null));
  /** Open lawn a straight run from home: walkable, and nothing between. */
  const lawn = (): [number, number] => {
    const g = walkNav(), [hx, hz] = HOMES.A;
    for (let d = 60; d < 300; d += 10)
      for (const [dx, dz] of [[0, d], [d, 0], [-d, 0], [0, -d]] as const) {
        const p: [number, number] = [hx + dx, hz + dz], plan = planTap(g, [...HOMES.A], p[0], p[1]);
        if (walkable(g, p[0], p[1]) && plan?.pts.length === 1) return p;
      }
    throw new Error('no open lawn near home');
  };

  it('walks straight to open lawn at the run (300 u/s)', () => {
    const [x, z] = lawn(), p = planTap(walkNav(), [...HOMES.A], x, z)!;
    expect(p.snap.kind).toBe('here');
    expect(p.pts).toEqual([[x, z]]);
    expect(p.ms).toBe(Math.round((p.len / RUN) * 1000));
  });

  it('a tap on the pond walks to its bank and faces the water; a building’s footprint to its door', () => {
    const g = walkNav();
    const p = planTap(g, [...HOMES.A], POND.x, POND.z)!;
    expect(p.snap.kind).toBe('bank');
    expect(walkable(g, p.to[0], p.to[1])).toBe(true);
    const d = planTap(g, [...HOMES.A], CAMPSITE.x, CAMPSITE.z + 20)!;
    expect(d.snap).toMatchObject({ kind: 'door' });
    expect(standAt(g, CAMPSITE.x, CAMPSITE.z + 20)).toEqual(d.to);
  });

  it('a tap where my villager already stands goes nowhere; a door does (it opens the building)', () => {
    const g = walkNav(), home = standAt(g, HOMES.A[0], HOMES.A[1])!;
    expect(planTap(g, home, home[0], home[1])).toBeNull();
    const door = planTap(g, [...HOMES.A], CAMPSITE.x, CAMPSITE.z + 20)!.to;
    expect(planTap(g, door, CAMPSITE.x + 10, CAMPSITE.z + 20)).toMatchObject({ snap: { kind: 'door' } });
  });
});

describe('footsteps by the ground', () => {
  it('pick grass, sand and the stairs’ stone from the plan, snow in winter, a splash in the rain, nothing in water', () => {
    const at = (x: number, z: number, winter = false, rain = false) => stepCue(surfaceAt(x, z), winter, rain);
    const stair = (CLIFF.stair[0] + CLIFF.stair[1]) / 2, mid = (CLIFF.z0 + CLIFF.z1) / 2;
    expect(at(150, 400)).toBe('footstep-grass');
    expect(at(150, 50)).toBe('footstep-sand');
    expect(at(stair, mid)).toBe('footstep-stone');
    expect(at(150, 400, true)).toBe('footstep-snow');
    expect(at(stair, mid, true)).toBe('footstep-stone');
    expect(at(150, 400, false, true)).toBe('footstep-splash');
    expect(at(POND.x, POND.z)).toBeNull();
    expect(CUES['footstep-stone']).toBeDefined();
  });
});
