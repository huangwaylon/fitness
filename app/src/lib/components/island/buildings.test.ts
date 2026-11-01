import { describe, expect, it } from 'vitest';
import ja from '#lib/i18n/ja.json';
import en from '#lib/i18n/en.json';
import { campLine, doorAt, partnerOnline } from './buildings.ts';
import { findPath, nav, reachable } from './nav.ts';
import { BUILDINGS, HOMES } from './world.ts';

const JA = ja as Record<string, string>, EN = en as Record<string, string>;

describe('the campsite', () => {
  it('is the one building left', () => {
    expect(BUILDINGS.map((b) => b.id)).toEqual(['campsite']);
  });

  it('its door is on the main ground, reachable from home, in front of the tent', () => {
    const g = nav(), b = BUILDINGS[0], d = doorAt(b.id);
    expect(reachable(g, d[0], d[1])).toBe(true);
    expect(findPath(g, [...HOMES.A], d)).not.toBeNull();
    expect(d[1]).toBeLessThan(b.z);
    expect(Math.abs(d[0] - b.x)).toBeLessThan(1);
  });

  it('its line is about today’s guest, in both languages, two lines at most', () => {
    expect(campLine(false)).toBe('world.door.campsite');
    expect(campLine(true)).toBe('world.door.campsite.guest');
    for (const k of [campLine(false), campLine(true)]) {
      expect(JA[k], k).toBeTruthy();
      expect(EN[k], k).toBeTruthy();
      expect(JA[k].split('\n').length).toBeLessThanOrEqual(2);
    }
    expect(JA['world.door.campsite.guest']).toContain('{name}');
    expect(EN['world.door.campsite.guest']).toContain('{name}');
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
