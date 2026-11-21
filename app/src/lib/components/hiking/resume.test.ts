import { describe, expect, it } from 'vitest';
import { DEVICE, type KV } from '#lib/sync/storage.ts';
import { RESUME_MS, clearHike, dropOldHike, readHike, writeHike } from './resume.ts';

const mem = (): KV & { m: Map<string, string> } => {
  const m = new Map<string, string>();
  return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};

describe('a hike under way, kept for a relaunch', () => {
  it('kept: the trail, the metres along its route, the way walked, when; no position', () => {
    const kv = mem();
    writeHike({ slug: 'kinpu-odarumi', d: 1312.6, dir: -1, t: 1000 }, kv);
    expect(JSON.parse(kv.m.get(DEVICE.hikeNow)!)).toEqual({ slug: 'kinpu-odarumi', d: 1313, dir: -1, t: 1000 });
    expect(readHike('kinpu-odarumi', 2000, kv)).toEqual({ slug: 'kinpu-odarumi', d: 1313, dir: -1, t: 1000 });
    // another trail's view: none (kept for its own)
    expect(readHike('akagi', 2000, kv)).toBeNull();
    expect(kv.m.has(DEVICE.hikeNow)).toBe(true);
    clearHike(kv);
    expect(readHike('kinpu-odarumi', 2000, kv)).toBeNull();
  });

  it('12 h without a fix: no hike under way, removed when read and at launch; a broken one removed', () => {
    const kv = mem();
    writeHike({ slug: 'a', d: 10, dir: 1, t: 0 }, kv);
    expect(readHike('a', RESUME_MS - 1, kv)).not.toBeNull();
    expect(readHike('a', RESUME_MS, kv)).toBeNull();
    expect(kv.m.has(DEVICE.hikeNow)).toBe(false);
    writeHike({ slug: 'a', d: 10, dir: 1, t: 0 }, kv);
    dropOldHike(RESUME_MS - 1, kv);
    expect(kv.m.has(DEVICE.hikeNow)).toBe(true);
    dropOldHike(RESUME_MS + 1, kv);
    expect(kv.m.has(DEVICE.hikeNow)).toBe(false);
    kv.setItem(DEVICE.hikeNow, JSON.stringify({ slug: 'a', d: 10, dir: 0, t: 0, lat: 35 }));
    expect(readHike('a', 1, kv)).toBeNull();
    expect(kv.m.has(DEVICE.hikeNow)).toBe(false);
  });
});
