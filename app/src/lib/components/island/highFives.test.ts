import { describe, expect, it } from 'vitest';
import { heardHighFive } from './highFives.ts';
import { SCENE, type KV } from '#lib/sync/storage.ts';
import { dayStart, tokyoDay } from '#lib/sync/live-protocol.ts';

const kv = (): KV & { m: Map<string, string> } => {
  const m = new Map<string, string>();
  return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};

describe('the partner’s high-fives heard today', () => {
  it('once each (a resend, the held copy: no news), per person’s phone, a new Tokyo day starting empty', () => {
    const s = kv(), d = tokyoDay(Date.UTC(2026, 10, 2, 3)), t = dayStart(d) + 3600_000;
    expect(heardHighFive('A', t, s)).toBe(true);
    expect(heardHighFive('A', t, s)).toBe(false);
    expect(heardHighFive('A', t + 1, s)).toBe(true);
    expect(heardHighFive('B', t, s)).toBe(true); // the demo's other tab
    expect(JSON.parse(s.m.get(SCENE.highFivesGot('A'))!)).toEqual({ day: d, ats: [t, t + 1] });
    expect(heardHighFive('A', dayStart(d + 1) + 5, s)).toBe(true);
    expect(JSON.parse(s.m.get(SCENE.highFivesGot('A'))!)).toEqual({ day: d + 1, ats: [dayStart(d + 1) + 5] });
    s.m.set(SCENE.highFivesGot('A'), 'junk');
    expect(heardHighFive('A', t, s)).toBe(true);
  });
});
