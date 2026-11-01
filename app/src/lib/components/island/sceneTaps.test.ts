import { describe, expect, it } from 'vitest';
import { hitWorld } from './sceneTaps.ts';
import { BRIDGES, LAND, POND, SPRING } from './world.ts';

describe('hitWorld', () => {
  it('finds the sea in front of the shoreline and past the side beaches', () => {
    expect(hitWorld(195, -40)).toEqual({ kind: 'sea' });
    expect(hitWorld(LAND.x0 - 30, 400)).toEqual({ kind: 'sea' });
    expect(hitWorld(LAND.x1 + 30, 1200)).toEqual({ kind: 'sea' });
  });
  it('finds the front beach’s sand and the lawn (paths and the plaza count as grass)', () => {
    expect(hitWorld(195, 50)).toEqual({ kind: 'sand' });
    expect(hitWorld(250, 300)).toEqual({ kind: 'grass' });
    expect(hitWorld(195, 300)).toEqual({ kind: 'grass' }); // the dirt path
    expect(hitWorld(195, 900)).toEqual({ kind: 'grass' }); // the plaza
  });
  it('finds the pond’s water (not its bank) and the spring', () => {
    expect(hitWorld(POND.x, POND.z)).toEqual({ kind: 'pond' });
    expect(hitWorld(POND.x + POND.rx * 0.9, POND.z)).toEqual({ kind: 'pond' });
    expect(hitWorld(POND.x + POND.rx + 3, POND.z).kind).not.toBe('pond');
    expect(hitWorld(SPRING.x, SPRING.z)).toEqual({ kind: 'pond' });
  });
  it('finds the river, but a bridge is dry ground', () => {
    expect(hitWorld(120, 648)).toEqual({ kind: 'river' });
    expect(hitWorld(372, 1000)).toEqual({ kind: 'river' });
    for (const b of BRIDGES) expect(hitWorld(b.x, (b.z0 + b.z1) / 2)).toEqual({ kind: 'grass' });
  });
});
