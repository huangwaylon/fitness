// Every villager render's head box (scripts/heads.ts) is there and sane, so a hat or glasses always has a place.
import { describe, expect, it } from 'vitest';
import heads from './heads.json';
import { ROSTER_IDS } from './roster.ts';
import { artKeys } from '../art.ts';

const table = heads as unknown as Record<string, [number, number, number, number]>;

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
});
