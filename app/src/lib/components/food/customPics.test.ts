// マイ食品's own pictures (customPics.svelte.ts): imgOf finds a live custom food's as a whole-file cell, a photo told
// from an illustration (`ig`), one removed or a food deleted back to none (its tile).
import { describe, expect, it } from 'vitest';
import { imgOf } from '#lib/food/images.ts';
import { isOwnPhoto, OWN_PX, setCustomPics } from './customPics.svelte.ts';

const A = '0123456789abcdef0123456789abcdef', B = 'fedcba9876543210fedcba9876543210';

describe('custom foods\' pictures', () => {
  it('a live custom food\'s picture is imgOf\'s, the whole file (its photo or an illustration); none: the tile', () => {
    setCustomPics([{ id: 'mone0001', img: A }, { id: 'mtwo0002', img: B, ig: true }, { id: 'mnone001' }]);
    expect(imgOf(null, 'custom:mone0001', 48)).toEqual({ url: expect.stringMatching(new RegExp(`/img/${A}$`)), x: 0, y: 0, size: OWN_PX });
    expect(imgOf(null, 'custom:mtwo0002', 384)?.url).toMatch(new RegExp(`/img/${B}$`));
    expect(imgOf(null, 'custom:mnone001', 48)).toBeNull();
    expect([isOwnPhoto('custom:mone0001'), isOwnPhoto('custom:mtwo0002'), isOwnPhoto('custom:mnone001')]).toEqual([true, false, false]);
    setCustomPics([{ id: 'mtwo0002', img: B, ig: true }]);
    expect(imgOf(null, 'custom:mone0001', 48)).toBeNull();
  });
});
