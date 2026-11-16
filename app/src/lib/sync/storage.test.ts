import { describe, expect, it } from 'vitest';
import { clearRetired, DEVICE, type KV } from './storage.ts';

class Mem implements KV {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

describe('clearRetired', () => {
  it("removes ききみみ's and its mic's old keys, and nothing else", () => {
    const kv = new Mem();
    for (const k of ['island.kikimimiGames', 'island.kikiWeekGoal', 'island.kikiOnboarded', 'island.kikiLandmarks', 'island.kikiSame', 'island.mic'])
      kv.setItem(k, '1');
    kv.setItem(DEVICE.englishLesson, '{}');
    kv.setItem(DEVICE.sound, '{}');
    clearRetired(kv);
    expect([...kv.m.keys()].sort()).toEqual([DEVICE.englishLesson, DEVICE.sound].sort());
    clearRetired(kv);
    expect(kv.m.size).toBe(2);
  });
  it('a phone without storage: nothing happens', () => {
    expect(() => clearRetired(null)).not.toThrow();
  });
});
