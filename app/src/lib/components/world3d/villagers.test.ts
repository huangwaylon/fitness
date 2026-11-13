// A director's motion as the 3D villager's moment (villagers.ts momentOf): busy for its own action's length, not a flat
// 1.8 s (that held a hop's island at the full rate a second past its pose).
import { describe, expect, test } from 'vitest';
import { momentOf } from './villagers.ts';
import { ACTION_MS } from '../villager3d/poses.ts';

describe('momentOf', () => {
  test('busy for the action it plays', () => {
    expect(momentOf('hop', false)).toEqual({ a: 'hop', ms: ACTION_MS.hop, small: false });
    expect(momentOf('twirl', false)?.ms).toBe(ACTION_MS.hop);
    expect(momentOf('twitch', false)).toEqual({ a: 'twitch', ms: ACTION_MS.twitch, small: false });
    expect(momentOf('surprise', false)?.ms).toBe(ACTION_MS.surprise);
  });
  test('a stung surprise is the sting, never small', () => {
    expect(momentOf('surprise', true)).toEqual({ a: 'sting', ms: ACTION_MS.sting, small: false });
    expect(momentOf('nod', true)?.small).toBe(false);
  });
  test('the small ones in place, and no moment', () => {
    expect(momentOf('bow', false)).toEqual({ a: 'wave', ms: ACTION_MS.wave, small: true });
    expect(momentOf(null, false)).toBeNull();
  });
});
