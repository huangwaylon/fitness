import { beforeEach, describe, expect, it } from 'vitest';
import { configureStorage, DEVICE, localKV, type KV } from '#lib/sync/storage.ts';
import { autoNote, dismissNote, noteAuto } from './repNote.ts';

function memKV(): KV {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}

describe('いつもの’s own update said once (repNote)', () => {
  beforeEach(() => configureStorage({ local: memKV() }));

  it('said the day it was made, till tapped; the next day gone (and dropped at the next note)', () => {
    noteAuto('r1', '2026-11-20', '2026-11-20');
    noteAuto('r2', '2026-11-20', '2026-11-22');
    expect([autoNote('r1', '2026-11-20'), autoNote('r2', '2026-11-20'), autoNote('r3', '2026-11-20')]).toEqual(['2026-11-20', '2026-11-22', null]);
    dismissNote('r1', '2026-11-20');
    expect([autoNote('r1', '2026-11-20'), autoNote('r2', '2026-11-20'), autoNote('r2', '2026-11-21')]).toEqual([null, '2026-11-22', null]);
    noteAuto('r4', '2026-11-21', '2026-11-21');
    expect(JSON.parse(localKV()!.getItem(DEVICE.foodRepAuto)!)).toEqual({ r4: ['2026-11-21', '2026-11-21'] });
  });
  it('a broken note reads as none', () => {
    localKV()!.setItem(DEVICE.foodRepAuto, '[1]');
    expect(autoNote('r1', '2026-11-20')).toBeNull();
    localKV()!.setItem(DEVICE.foodRepAuto, '{"r1": "x"}');
    expect(autoNote('r1', '2026-11-20')).toBeNull();
  });
});
