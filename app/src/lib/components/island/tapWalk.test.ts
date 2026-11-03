import { describe, expect, it } from 'vitest';
import { nav, walkable } from './nav.ts';
import { CAMPSITE, CLIFF, HOMES, POND, surfaceAt } from './world.ts';
import { planTap, stepCue } from './tapWalk.ts';
import { CUES } from '#lib/sound/cues.ts';
import { SPEED } from './walkGraph.ts';

const RUN = SPEED.run;

const g = nav();
describe('planning a tap', () => {
  it('walks straight to open lawn at the run (200 u/s)', () => {
    const p = planTap(g, [...HOMES.A], 160, 330)!;
    expect(p.snap.kind).toBe('here');
    expect(p.pts).toEqual([[160, 330]]);
    expect(p.ms).toBe(Math.round((p.len / RUN) * 1000));
  });

  it('runs up to the campsite’s clearing, the ring at the tapped spot', () => {
    const p = planTap(g, [...HOMES.A], 196, 900)!;
    expect(p.to).toEqual([196, 900]);
    expect(p.pts.at(-1)).toEqual([196, 900]);
    expect(p.ms).toBe(Math.round((p.len / RUN) * 1000));
  });

  it('a tap on the pond walks to its bank and faces the water; a building’s footprint to its door', () => {
    const p = planTap(g, [...HOMES.A], POND.x, POND.z)!;
    expect(p.snap.kind).toBe('bank');
    expect(walkable(g, p.to[0], p.to[1])).toBe(true);
    const d = planTap(g, [...HOMES.A], CAMPSITE.x, CAMPSITE.z + 20)!;
    expect(d.snap).toMatchObject({ kind: 'door', building: 'campsite' });
    expect(d.to).toEqual(g.named['door-campsite']);
  });

  it('a tap where my villager already stands goes nowhere; a door does (it opens the building)', () => {
    expect(planTap(g, [...HOMES.A], HOMES.A[0], HOMES.A[1])).toBeNull();
    const door = g.named['door-campsite'];
    expect(planTap(g, door, CAMPSITE.x + 10, CAMPSITE.z + 20)).toMatchObject({ snap: { kind: 'door', building: 'campsite' } });
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
