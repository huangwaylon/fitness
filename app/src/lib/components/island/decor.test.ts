import { describe, expect, it } from 'vitest';
import { DECOR_ART, DECOR_ITEMS, decorH } from './decor.ts';
import { art } from '#lib/art.ts';
import PLACES from './models.json';
import MODELS from '../world3d/assets.json';

describe('decorations: art and sizes (island/decor.ts)', () => {
  it('every item has its four facings rendered, at one scale (the crop height varies a little with the depth it shows)', () => {
    expect(DECOR_ITEMS).toHaveLength(10);
    // facing 0 is art (the tray's icon); every facing a 3D model (the 3D island draws them), its box in models.json
    for (const k of DECOR_ART) expect(k.endsWith('-0') ? art(k) : PLACES[k as keyof typeof PLACES], k).toBeTruthy();
    for (const k of DECOR_ART) expect(k in MODELS.keys, k).toBe(true);
    for (const i of DECOR_ITEMS) {
      const hs = ([0, 1, 2, 3] as const).map((f) => decorH(i, f));
      expect(Math.max(...hs) - Math.min(...hs), i).toBeLessThan(10); // the crop's height: a deep side seen from 30° up stands a little taller
      expect(hs[0], i).toBeGreaterThan(18);
      expect(hs[0], i).toBeLessThan(75);
    }
  });
});
