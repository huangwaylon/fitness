import { describe, expect, it } from 'vitest';
import { hitWorld } from './sceneTaps.ts';
import { BRIDGE, LAND, POND, RIVER, SPRING } from '#lib/world/world.ts';

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
  it('finds the stream, and the bridge over it is ground', () => {
    expect(hitWorld(RIVER[6][0], RIVER[6][1])).toEqual({ kind: 'river' });
    expect(hitWorld(372, 1000)).toEqual({ kind: 'river' });
    expect(hitWorld(120, 650)).toEqual({ kind: 'river' });
    expect(hitWorld(BRIDGE.x, (BRIDGE.z0 + BRIDGE.z1) / 2)).toEqual({ kind: 'grass' }); // a dust puff, as on a path
  });
});
