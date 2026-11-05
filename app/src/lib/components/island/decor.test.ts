import { describe, expect, it } from 'vitest';
import { DECOR_ART, DECOR_KINDS, decorH } from './decor.ts';
import { art } from '#lib/art.ts';
import { KIND_LIST, kindDef, footprintOf } from '#lib/layout/catalog.ts';
import ja from '#lib/i18n/ja.json';
import en from '#lib/i18n/en.json';
import { DECOR_ITEMS } from '#lib/contract/decor.ts';
import PLACES from './models.json';
import MODELS from '../world3d/assets.json';

describe('decorations: art and sizes (island/decor.ts)', () => {
  it('every kind has its four facings rendered, at one scale (the crop height varies with the depth it shows)', () => {
    // the old もようがえ's ten (their ops the record still reads) and the gym's twelve
    expect(DECOR_ITEMS.every((i) => DECOR_KINDS.includes(i))).toBe(true);
    expect(DECOR_KINDS.filter((k) => kindDef(k)?.group === 'gym')).toHaveLength(12);
    // facing 0 is art (the tray's icon); every facing a 3D model (the 3D island draws them), its box in models.json
    const bad: string[] = [];
    for (const k of DECOR_ART) if (!(k.endsWith('-0') ? art(k) : PLACES[k as keyof typeof PLACES]) || !(k in MODELS.keys)) bad.push(k);
    for (const i of DECOR_KINDS) {
      const d = kindDef(i)!, hs = ([0, 1, 2, 3] as const).map((f) => decorH(i, f));
      // (a long piece seen from its end at 30° up shows its length too: the crop that much taller)
      if (Math.max(...hs) - Math.min(...hs) >= Math.max(d.w, d.d) * 15 + 10 || hs[0] < 8 || hs[0] > 90) bad.push(`${i}: ${hs.join(' ')}`);
    }
    expect(bad).toEqual([]);
  });

  it('the gym (もようがえ\'s ジム): NH\'s fitness furniture with its names, a footprint on the grid, its icon and its model', () => {
    const gym = KIND_LIST.filter((d) => d.group === 'gym'), bad: string[] = [];
    const J = ja as Record<string, string>, E = en as Record<string, string>;
    for (const d of gym) {
      if (!d.ja || !d.en || J[`decor.item.${d.k}`] !== d.ja || E[`decor.item.${d.k}`]?.toLowerCase() !== d.en.toLowerCase()) bad.push(`${d.k}: names`);
      // a footprint of whole tiles that turns with the piece, its block box inside it
      const [w, h] = footprintOf(d, 1);
      if (!(d.w >= 1 && d.d >= 1 && d.turns && w === d.d && h === d.w && d.block && d.foot && d.foot[0] <= d.w * 30 && d.foot[1] <= d.d * 30 && d.on === 'land')) bad.push(`${d.k}: footprint`);
      if (!art(d.icon)) bad.push(`${d.k}: icon ${d.icon}`);
      const key = d.icon.startsWith('decor/') ? d.icon : `deco/${d.k}`;
      if (!(key in MODELS.keys)) bad.push(`${d.k}: model ${key}`);
    }
    expect(gym.map((d) => d.k)).toEqual(['pullup', 'weight-bench', 'exercise-bike', 'treadmill', 'punching-bag', 'exercise-ball', 'barbell', 'kettlebell', 'protein-shaker', 'water-cooler', 'digital-scale', 'climbing-wall', 'upright-locker']);
    expect(J['decor.tab.gym']).toBe('ジム');
    expect(bad).toEqual([]);
  });
});
