// Every villager render's head box (scripts/heads.ts) is there and sane, so a hat, glasses or a swollen eye always has a place.
import { describe, expect, it } from 'vitest';
import heads from './heads.json';
import { ROSTER_IDS } from './roster.ts';
import { artKeys } from '../art.ts';
import { swollenEye, type HeadBox } from './heads.ts';
import { LOOKS_RIGHT } from './facing.ts';
import type { RosterId } from './roster.ts';

const table = heads as unknown as Record<string, HeadBox>;

describe('head boxes', () => {
  it('one per villager render, nothing stray', () => {
    const renders = artKeys().filter((k) => k.startsWith('villagers/') && !k.endsWith('-icon')).map((k) => k.slice(10)).sort();
    expect(Object.keys(table).sort()).toEqual(renders);
    for (const id of ROSTER_IDS) expect(table[id], id).toBeDefined();
  });
  it('inside the figure: the hat above the eyes, both in its top half, the face most of its width', () => {
    for (const [id, [cx, hatY, eyeY, faceW]] of Object.entries(table)) {
      expect(cx, id).toBeGreaterThan(0.2);
      expect(cx, id).toBeLessThan(0.8);
      expect(hatY, id).toBeLessThan(eyeY);
      expect(eyeY, id).toBeLessThan(0.55);
      expect(faceW, id).toBeGreaterThan(0.3);
      expect(faceW, id).toBeLessThanOrEqual(1);
    }
  });
  it('the eyes on the face: the left one (or a profile\'s only one) and the right, a level pair across the head', () => {
    for (const [id, [cx, , eyeY, faceW, lx, ly, rx]] of Object.entries(table)) {
      expect(ly, id).toBeGreaterThan(0);
      expect(ly, id).toBeLessThan(0.6);
      expect(Math.abs(ly - eyeY), id).toBeLessThan(0.3);
      expect(Math.abs(lx - cx), id).toBeLessThanOrEqual(faceW * 0.6);
      if (rx === null) continue;
      expect(rx - lx, id).toBeGreaterThanOrEqual(0.08);
      expect(Math.abs(rx - cx), id).toBeLessThanOrEqual(faceW * 0.6);
    }
  });
});

describe('the swollen eye', () => {
  const at = (id: string) => swollenEye(table[id], LOOKS_RIGHT.has(id as RosterId));
  it('on the left eye as drawn, the right one on a render drawn looking right, a profile\'s only eye', () => {
    expect(at('anchovy').x).toBe(table.anchovy[4]);
    for (const id of ['goldie', 'bunnie', 'judy']) expect(at(id).x, id).toBe(table[id][6]);
    expect(table.tank[6]).toBeNull();
    expect(at('tank').x).toBe(table.tank[4]);
    expect(at('orville').x).toBe(table.orville[4]); // drawn looking right, one eye showing
    for (const id of Object.keys(table)) expect(at(id).y, id).toBe(table[id][5]);
  });
  it('about half the eyes\' spacing wide (a profile: a fifth of the face), 10–26% of the figure', () => {
    const box: HeadBox = [0.5, 0.1, 0.3, 0.9, 0.3, 0.3, 0.7];
    expect(swollenEye(box, false)).toMatchObject({ x: 0.3, y: 0.3 });
    expect(swollenEye(box, false).w).toBeCloseTo(0.22);
    expect(swollenEye(box, true).x).toBe(0.7);
    expect(swollenEye([0.5, 0.1, 0.3, 0.9, 0.6, 0.2, null], true)).toMatchObject({ x: 0.6, y: 0.2 });
    expect(swollenEye([0.5, 0.1, 0.3, 0.9, 0.6, 0.2, null], true).w).toBeCloseTo(0.18);
    expect(swollenEye([0.5, 0.1, 0.3, 0.9, 0.1, 0.3, 0.95], false).w).toBe(0.26);
    expect(swollenEye([0.5, 0.1, 0.3, 0.9, 0.45, 0.3, 0.55], false).w).toBe(0.1);
    for (const id of Object.keys(table)) {
      expect(at(id).w, id).toBeGreaterThanOrEqual(0.1);
      expect(at(id).w, id).toBeLessThanOrEqual(0.26);
    }
  });
  it('where the art has its eyes: tall ears, wide heads, specials, glasses, masks and profiles (checked by eye)', () => {
    // [x, y] of the eye the lump covers, as read off the renders
    const EYE: Record<string, [number, number]> = {
      anchovy: [0.17, 0.27], goldie: [0.67, 0.19], dotty: [0.28, 0.38], ankha: [0.235, 0.4], raymond: [0.27, 0.43],
      tank: [0.71, 0.385], 'tom-nook': [0.22, 0.31], 'kk-slider': [0.34, 0.29], wisp: [0.4, 0.35], blathers: [0.29, 0.27],
      hamlet: [0.3, 0.36], tucker: [0.36, 0.22], 'agent-s': [0.19, 0.415], 'daisy-mae': [0.125, 0.535], bunnie: [0.68, 0.41]
    };
    for (const [id, [x, y]] of Object.entries(EYE)) {
      const e = at(id);
      expect(Math.abs(e.x - x), id).toBeLessThan(0.05);
      expect(Math.abs(e.y - y), id).toBeLessThan(0.05);
    }
  });
});
