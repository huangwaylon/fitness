// The same island on both phones: a flower bed cell is the island's own (columns 0–1 A's bed, 2–3 B's), and a garden
// kept when each phone had its own bed on the left is turned round once.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SCENE, configureStorage, type KV } from '#lib/sync/storage.ts';
import { absoluteGarden, localCell, sharedCell, wateredOn } from './sceneDay.ts';

class Mem implements KV {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

describe('flower bed cells', () => {
  it('are the same on both phones: columns 0–1 A’s bed, 2–3 B’s', () => {
    expect(sharedCell('1-0')).toBe('A.1-0');
    expect(sharedCell('0-3')).toBe('B.0-1');
    expect(localCell('B.0-1')).toBe('0-3');
    for (const c of ['0-0', '0-1', '0-2', '0-3', '1-0', '1-1', '1-2', '1-3']) expect(localCell(sharedCell(c)!)).toBe(c);
    expect(localCell('C.0-1')).toBeNull();
  });
});

describe('absoluteGarden', () => {
  let kv: Mem;
  beforeEach(() => configureStorage({ local: (kv = new Mem()) }));
  afterEach(() => configureStorage({ local: null }));
  const keep = (g: unknown) => kv.setItem(SCENE.garden, JSON.stringify(g));

  it("on B's phone, its old own-bed-on-the-left cells move to B's bed (and A's to the left), once", () => {
    keep({ date: '2026-11-01', watered: ['0-0', '1-3'], hybrid: { cell: '1-1', flower: 'rose-blue' } });
    absoluteGarden('B');
    expect(wateredOn('2026-11-01')).toEqual(['0-2', '1-1']);
    expect(JSON.parse(kv.getItem(SCENE.garden)!).hybrid.cell).toBe('1-3');
    absoluteGarden('B'); // already the island's own
    expect(wateredOn('2026-11-01')).toEqual(['0-2', '1-1']);
  });
  it("on A's phone nothing moves", () => {
    keep({ date: '2026-11-01', watered: ['0-0', '1-3'], hybrid: null });
    absoluteGarden('A');
    expect(wateredOn('2026-11-01')).toEqual(['0-0', '1-3']);
  });
});
