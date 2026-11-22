// けんこう's phone choices: 体重's 傾向線 on by default, kept per phone.
import { beforeEach, describe, expect, it } from 'vitest';
import { configureStorage, DEVICE, type KV } from '#lib/sync/storage.ts';
import { setWeightLine, weightLineOn } from './prefs.ts';

class Mem implements KV {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}
let kv: Mem;
beforeEach(() => configureStorage({ local: (kv = new Mem()) }));

describe('体重’s 傾向線', () => {
  it('on by default; off and on again kept on this phone (island.health.weightLine)', () => {
    expect(weightLineOn()).toBe(true);
    setWeightLine(false);
    expect([weightLineOn(), kv.getItem(DEVICE.weightLine), DEVICE.weightLine]).toEqual([false, 'false', 'island.health.weightLine']);
    setWeightLine(true);
    expect(weightLineOn()).toBe(true);
    kv.setItem(DEVICE.weightLine, '{bad');
    expect(weightLineOn()).toBe(true);
  });
});
