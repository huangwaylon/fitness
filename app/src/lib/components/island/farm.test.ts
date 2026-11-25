// A plant's model on the island (island/farm.ts plantModel): its stage, its yield once ripe, a ripe pumpkin's colour
// seeded by its plot and ripe time (pumpkinColour: the same on every phone, anew each regrow); the scene's plots.
import { describe, expect, it } from 'vitest';
import { FARM, type Plot } from '#lib/contract/farm.ts';
import { farmScene, plantModel, pumpkinColour, withLive } from './farm.ts';
import { layoutPlots } from '#lib/layout/field.ts';

const P = 'fd:field-1.3.1', NOW = Date.UTC(2026, 10, 7, 3), H = 3600_000;
const dry = () => false;
const pumpkin: Plot = { c: 'pumpkin', t: NOW };

describe('plantModel', () => {
  it('a ripe pumpkin in its colour, at its yield (watered, or a wet day)', () => {
    expect(pumpkinColour(P, NOW)).toBe(pumpkinColour(P, NOW));
    expect(plantModel(P, pumpkin, NOW, dry)).toBe(`garden/crop-pumpkin-${pumpkinColour(P, NOW)}-3`);
    expect(plantModel(P, { ...pumpkin, w: true }, NOW, dry)).toBe(`garden/crop-pumpkin-${pumpkinColour(P, NOW)}-5`);
    expect(plantModel(P, pumpkin, NOW, (d) => d === '2026-11-07')).toBe(`garden/crop-pumpkin-${pumpkinColour(P, NOW)}-5`);
  });

  it('orange, yellow, white and green 8:5:4:3 over 2,000 plots and ripe times, each within 5 points', () => {
    const n = { orange: 0, yellow: 0, white: 0, green: 0 };
    for (let k = 0; k < 2000; k++) n[pumpkinColour(`fd:field-${k % 2}.${k % 10}.${Math.floor(k / 10) % 4}`, NOW + Math.floor(k / 80) * FARM.growMs)]++;
    const want = { orange: 0.4, yellow: 0.25, white: 0.2, green: 0.15 };
    for (const c of Object.keys(want) as (keyof typeof want)[]) expect(Math.abs(n[c] / 2000 - want[c])).toBeLessThan(0.05);
  });

  it('stages 0, 1, 2 through a first growth’s thirds, 2 growing back', () => {
    const t = NOW + FARM.growMs;
    expect(plantModel(P, { c: 'tomato', t }, NOW, dry)).toBe('garden/crop-tomato-0');
    expect(plantModel(P, { c: 'tomato', t }, NOW + 2 * H, dry)).toBe('garden/crop-tomato-1');
    expect(plantModel(P, { c: 'tomato', t }, NOW + 4 * H, dry)).toBe('garden/crop-tomato-2');
    expect(plantModel(P, { c: 'tomato', t, r: true }, NOW, dry)).toBe('garden/crop-tomato-2');
    expect(plantModel(P, { c: 'pumpkin', t, r: true }, NOW, dry)).toBe('garden/crop-pumpkin-2');
  });
});

describe('farmScene', () => {
  const objects = new Map([['field-1', { id: 'field-1', k: 'field', x: 0, z: 0, f: 0, s: 'f-3x1' }]]);
  const layout = { objects } as unknown as Parameters<typeof layoutPlots>[0];
  const [a, b, c] = layoutPlots(layout);
  const farm = { plots: new Map<string, Plot>([[a.p, { c: 'tomato', t: NOW + 5 * H, w: true }], [b.p, { c: 'carrot', t: NOW + H, r: true }]]), net: {} };

  it('every empty plot carries the faint ＋ while I hold starts; a planted one, none', () => {
    const { plots } = farmScene(layout, farm, NOW, dry, true);
    expect(plots.get(a.p)).toEqual({ m: 'garden/crop-tomato-0', wet: true });
    expect(plots.get(b.p)).toEqual({ m: 'garden/crop-carrot-2' });
    expect(plots.get(c.p)).toEqual({ hint: 'proc/plot-plus' });
    expect(farmScene(layout, farm, NOW, dry).plots.get(c.p)).toBeUndefined();
  });

  it('a wet day wets every plot; next: the earliest stage change', () => {
    const { plots, next, sig } = farmScene(layout, farm, NOW, () => true);
    expect([...plots.values()].every((l) => l.wet)).toBe(true);
    expect(next).toBe(NOW + H);
    expect(farmScene(layout, farm, NOW + H, dry).sig).not.toBe(sig);
    expect(farmScene(layout, { plots: new Map(), net: {} }, NOW, dry).next).toBeNull();
  });
});

describe('withLive', () => {
  const grow: Plot = { c: 'tomato', t: NOW + 5 * H }, farm = { plots: new Map<string, Plot>([['a', grow], ['b', { ...grow, w: true }], ['c', { c: 'carrot', t: NOW - 1 }], ['d', { c: 'wheat', t: NOW + H, r: true }]]), net: {} };

  it('the partner’s watering heard live wets a growing, unwatered plant of that growth; the field itself when none applies', () => {
    const f = withLive(farm, new Map([['a', NOW - H], ['b', NOW - H], ['c', NOW - H], ['gone', NOW]]), NOW);
    expect(f.plots.get('a')).toEqual({ ...grow, w: true });
    expect(f.plots.get('b')).toBe(farm.plots.get('b'));
    expect(f.plots.get('c')).toEqual({ c: 'carrot', t: NOW - 1 });
    expect(f.net).toBe(farm.net);
    expect(farm.plots.get('a')!.w).toBeUndefined();
    // nothing to add (watered already, ripe, empty, or no news): the very same field, so the scene's memo holds
    expect(withLive(farm, new Map([['b', NOW], ['c', NOW]]), NOW)).toBe(farm);
    expect(withLive(farm, new Map(), NOW)).toBe(farm);
  });

  it('a watering before this growth began (before the harvest it grows back from) is the old plant’s', () => {
    expect(withLive(farm, new Map([['d', NOW - 6 * H]]), NOW)).toBe(farm);
    expect(withLive(farm, new Map([['d', NOW - 4 * H]]), NOW).plots.get('d')?.w).toBe(true);
  });
});
