import { describe, expect, it } from 'vitest';
import { DECOR_ART, DECOR_KINDS, decorH } from './decor.ts';
import { art } from '#lib/art.ts';
import { KIND_LIST, kindDef, footprintOf } from '#lib/layout/catalog.ts';
import ja from '#lib/i18n/ja.json';
import en from '#lib/i18n/en.json';
import { DECOR_ITEMS } from '#lib/contract/decor.ts';
import PLACES from './models.json';
import MODELS from '../world3d/assets.json';
import { keyModel, modelBounds } from '../world3d/models3d.ts';
import { LAMP } from '../world3d/things.ts';

describe('decorations: art and sizes (island/decor.ts)', () => {
  it('every kind has its four facings rendered, at one scale (the crop height varies with the depth it shows)', () => {
    // the old もようがえ's ten (their ops the record still reads) and the gym's twelve
    expect(DECOR_ITEMS.every((i) => DECOR_KINDS.includes(i))).toBe(true);
    expect(DECOR_KINDS.filter((k) => kindDef(k)?.group === 'gym')).toHaveLength(17);
    // facing 0 is art (the tray's icon); every facing a 3D model (the 3D island draws them), its box in models.json
    const bad: string[] = [];
    for (const k of DECOR_ART) if (!(k.endsWith('-0') ? art(k) : PLACES[k as keyof typeof PLACES]) || !(k in MODELS.keys)) bad.push(k);
    // (a pack's kinds have no renders: its facing 0's model key, turned by its facing; its look's box the model's)
    for (const i of DECOR_KINDS) if (!(`decor/${i}-0` in MODELS.keys)) bad.push(`${i}-0`);
    for (const i of DECOR_KINDS) {
      const d = kindDef(i)!, hs = ([0, 1, 2, 3] as const).map((f) => decorH(i, f));
      // (a long piece seen from its end at 30° up shows its length too: the crop that much taller)
      if (Math.max(...hs) - Math.min(...hs) >= Math.max(d.w, d.d) * 15 + 10 || hs[0] < (art(`decor/${i}-0`) ? 8 : 1) || hs[0] > 90) bad.push(`${i}: ${hs.join(' ')}`);
    }
    expect(bad).toEqual([]);
  });

  it('the gym, the camp goods and the food (もようがえ\'s ジム, キャンプ, 食べ物): NH\'s furniture with its names, a footprint on the grid, its icon, its model, a lit one its emitter', () => {
    const groups = ['camp', 'food', 'gym'] as const;
    const list = KIND_LIST.filter((d) => (groups as readonly string[]).includes(d.group)), bad: string[] = [];
    const J = ja as Record<string, string>, E = en as Record<string, string>;
    for (const d of list) {
      const key = keyModel(`decor/${d.k}-0`) ? `decor/${d.k}-0` : `deco/${d.k}`, a = keyModel(key), m = a && modelBounds(a.m);
      if (!m) {
        bad.push(`${d.k}: model ${key}`);
        continue;
      }
      // its names (a pack's kind's are the editor's alone: Decor.svelte's label falls back to them), an older decoration's
      // in the world's copy too (decor.item)
      if (!d.ja || !d.en) bad.push(`${d.k}: names`);
      if (key.startsWith('decor/') && !m.pack && d.k !== 'picnic-set' && (!J[`decor.item.${d.k}`] || E[`decor.item.${d.k}`]?.toLowerCase() !== d.en.toLowerCase())) bad.push(`${d.k}: decor.item`);
      // a footprint of whole tiles (one that turns with the piece, its block box inside it) the model fits
      const [w, h] = footprintOf(d, 1);
      if (!(d.w >= 1 && d.d >= 1 && d.block && d.foot && d.foot[0] <= d.w * 30 && d.foot[1] <= d.d * 30 && d.on === 'land')) bad.push(`${d.k}: footprint`);
      if (d.turns && !(w === d.d && h === d.w)) bad.push(`${d.k}: turns`);
      if (key.startsWith('decor/') && (m.max[0] - m.min[0]) * a.s > d.w * 30 + 12) bad.push(`${d.k}: wider than its ${d.w} tiles`);
      if (!art(d.icon)) bad.push(`${d.k}: icon ${d.icon}`);
      // a pack's lit at night: its light where it glows (an emitter inside its model), never popped (lights.ts fades)
      if (m.lit && m.pack) {
        const L = LAMP[a.m];
        if (!L?.e) bad.push(`${d.k}: no emitter`);
        else if (L.e.some((v, i) => v < m.min[i] - 0.5 || v > m.max[i] + 0.5)) bad.push(`${d.k}: emitter ${L.e} off its model`);
      }
    }
    expect(KIND_LIST.filter((d) => d.group === 'gym').map((d) => d.k)).toEqual([
      'pullup', 'weight-bench', 'exercise-bike', 'treadmill', 'punching-bag', 'exercise-ball', 'barbell', 'kettlebell', 'protein-shaker', 'water-cooler', 'digital-scale', 'climbing-wall', 'upright-locker',
      'yoga-mat', 'nook-yoga-mat', 'speed-bag', 'massage-chair', 'dumbbell'
    ]);
    expect(list.filter((d) => d.group === 'camp').length).toBeGreaterThanOrEqual(27);
    expect(list.filter((d) => d.group === 'food').length).toBeGreaterThanOrEqual(15);
    for (const g of groups) expect(J[`decor.tab.${g}`], g).toBeTruthy();
    expect(J['decor.tab.gym']).toBe('ジム');
    expect(bad).toEqual([]);
  });
});
