// A plant's model on the island (island/farm.ts plantModel): its stage, its yield once ripe, a ripe pumpkin's colour
// seeded by its plot and ripe day (pumpkinColour: the same on both phones, anew each regrow cycle).
import { describe, expect, it } from 'vitest';
import { addDays } from '#lib/contract/tokyo.ts';
import type { Plot, Watered } from '#lib/contract/farm.ts';
import { plantModel, pumpkinColour } from './farm.ts';

const P = 'fd:field-A.3.1', FROM = '2026-11-07';
const none: Watered = () => false;
const pumpkin: Plot = { who: 'A', c: 'pumpkin', from: FROM };

describe('pumpkinColour', () => {
  it('the same plot and ripe day give the same colour; the model carries it', () => {
    expect(pumpkinColour(P, FROM)).toBe(pumpkinColour(P, FROM));
    expect(plantModel(P, pumpkin, FROM, none)).toBe(`garden/crop-pumpkin-${pumpkinColour(P, FROM)}-3`);
    expect(plantModel(P, pumpkin, FROM, (_p, d) => d === '2026-11-06')).toBe(`garden/crop-pumpkin-${pumpkinColour(P, FROM)}-5`);
    expect(plantModel(P, pumpkin, FROM, (_p, d) => d === '2026-11-05')).toBe(`garden/crop-pumpkin-${pumpkinColour(P, FROM)}-3`);
  });

  it('orange, yellow, white and green 8:5:4:3 over 2,000 plots and ripe days, each within 5 points', () => {
    const n = { orange: 0, yellow: 0, white: 0, green: 0 };
    for (let k = 0; k < 2000; k++) n[pumpkinColour(`fd:field-${'AB'[k % 2]}.${k % 10}.${Math.floor(k / 10) % 4}`, addDays('2026-11-01', Math.floor(k / 80)))]++;
    const want = { orange: 0.4, yellow: 0.25, white: 0.2, green: 0.15 };
    for (const c of Object.keys(want) as (keyof typeof want)[]) expect(Math.abs(n[c] / 2000 - want[c])).toBeLessThan(0.05);
  });

  it('stage 0 on the plant day, 2 growing back, other crops unchanged', () => {
    expect(plantModel(P, pumpkin, '2026-11-06', none)).toBe('garden/crop-pumpkin-0');
    expect(plantModel(P, { ...pumpkin, r: true }, '2026-11-06', none)).toBe('garden/crop-pumpkin-2');
    expect(plantModel(P, { ...pumpkin, c: 'tomato' }, FROM, none)).toBe('garden/crop-tomato-3');
  });
});
