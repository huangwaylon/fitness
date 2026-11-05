import { describe, expect, it } from 'vitest';
import { doorAt, partnerOnline } from './buildings.ts';
import { walkNav } from './nav.ts';
import { worldOf } from './layoutWorld.ts';
import { BUILDINGS, HOMES, setWorld } from './world.ts';
import { findPath, reachable } from '#lib/layout/nav.ts';
import { defaultLayout } from '#lib/layout/model.ts';

describe('the campsite', () => {
  it('is the one building left', () => {
    expect(BUILDINGS.map((b) => b.id)).toEqual(['campsite']);
  });

  it('on the layout, its door is on the main ground, reachable from home, in front of the tent', () => {
    setWorld(worldOf(defaultLayout()));
    try {
      const g = walkNav(), b = BUILDINGS.find((x) => x.id === 'campsite')!, d = doorAt(b.id);
      expect(reachable(g, d[0], d[1])).toBe(true);
      expect(findPath(g, [...HOMES.A], d)).not.toBeNull();
      expect(d[1]).toBeLessThan(b.z);
      expect(Math.abs(d[0] - b.x)).toBeLessThan(1);
    } finally {
      setWorld(null);
    }
  });
});

describe('the partner’s presence', () => {
  it('only while the partner is in the room, never in the demo', () => {
    expect(partnerOnline({ connected: true, peer: true }, false)).toBe(true);
    expect(partnerOnline({ connected: true, peer: false }, false)).toBe(false);
    expect(partnerOnline({ connected: false, peer: true }, false)).toBe(false);
    expect(partnerOnline({ connected: true, peer: true }, true)).toBe(false);
    expect(partnerOnline(null, false)).toBe(false);
  });
});
