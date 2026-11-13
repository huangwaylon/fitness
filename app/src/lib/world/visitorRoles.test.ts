// The special characters' roles (visitorRoles.ts): the same on every phone, each guest a model and its copy.
import { describe, expect, it } from 'vitest';
import { CAST, COLOURS, GUESTS, LUCKS, ROLES, fortuneOf, giftOf, guestHere, guestOn } from './visitorRoles.ts';
import { addDays } from '#lib/time/dates.ts';
import { has3d } from '../components/villager3d/manifest.ts';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import ja from '#lib/i18n/ja.json';
import en from '#lib/i18n/en.json';

const J = ja as Record<string, string>, E = en as Record<string, string>;

describe('visitor roles', () => {
  it('every guest is NH’s model, with its name, introduction and lines in both languages, and its role’s lines', () => {
    for (const id of [...GUESTS, 'pave'] as const) {
      expect(has3d(id), id).toBe(true);
      const keys = [`visitor.${id}`, `chat.sp.${id}.intro`, ...[0, 1, 2, 3].map((i) => `chat.sp.${id}.${i}`)];
      const role = ROLES[id];
      if (role.kind === 'shop') keys.push(`chat.sp.${id}.offer`);
      if (role.kind === 'gift') keys.push(`chat.sp.${id}.gift`, `chat.sp.${id}.given`);
      if (role.kind === 'fish') keys.push(`chat.sp.${id}.ask`, `chat.sp.${id}.thanks`, `chat.sp.${id}.given`);
      if (role.kind === 'cheer') keys.push(`chat.sp.${id}.cheer`);
      for (const k of keys) {
        expect(J[k], k).toBeTruthy();
        expect(E[k], k).toBeTruthy();
      }
    }
  });
  it('Katrina’s reading: each person’s own, the same all day on every phone', () => {
    const a = fortuneOf('2026-11-15', 'A'), b = fortuneOf('2026-11-15', 'B');
    expect(fortuneOf('2026-11-15', 'A')).toEqual(a);
    const days = Array.from({ length: 60 }, (_, i) => fortuneOf(`2026-12-${String((i % 28) + 1).padStart(2, '0')}`, String(i)));
    expect(new Set(days.map((f) => f.luck)).size).toBeGreaterThan(2);
    for (const f of [a, b, ...days]) {
      expect(f.luck).toBeGreaterThanOrEqual(0);
      expect(f.luck).toBeLessThan(LUCKS);
      expect(f.colour).toBeLessThan(COLOURS);
    }
  });
  it('a giver’s piece: the same on every phone, never one the island had, none when it has them all', () => {
    const pool = ['a', 'b', 'c', 'd'];
    const g = giftOf('pete', '2026-11-15', pool, new Set());
    expect(giftOf('pete', '2026-11-15', pool, new Set())).toBe(g);
    expect(giftOf('pete', '2026-11-15', pool, new Set(['a', 'b', 'c']))).toBe('d');
    expect(giftOf('pete', '2026-11-15', pool, new Set(pool))).toBeNull();
  });
  it('the hours: 06–22 every day (Sundays too, beside Daisy Mae), the beach by day, till 18 on a Saturday (K.K.’s show)', () => {
    expect(guestHere('gracie', 5, 3)).toBe(false);
    expect(guestHere('gracie', 6, 3)).toBe(true);
    expect(guestHere('gracie', 7, 0)).toBe(true);
    expect(guestHere('gracie', 21, 0)).toBe(true);
    expect(guestHere('gracie', 22, 0)).toBe(false);
    expect(guestHere('gracie', 17, 6)).toBe(true);
    expect(guestHere('gracie', 18, 6)).toBe(false);
    expect(guestHere('wendell', 17, 2)).toBe(true);
    expect(guestHere('wendell', 18, 2)).toBe(false);
  });
  it('one guest every day: each once in a cycle before any comes again, never two days running, the same on both phones', () => {
    const n = GUESTS.length, days = Array.from({ length: n * 12 }, (_, i) => addDays('2026-01-05', i));
    const seq = days.map((d) => guestOn(d));
    for (let c = 0; c < 12; c++) expect([...seq.slice(c * n, (c + 1) * n)].sort(), `cycle ${c}`).toEqual([...GUESTS].sort());
    for (let i = 1; i < seq.length; i++) expect(seq[i], days[i]).not.toBe(seq[i - 1]);
    // the same on every phone (a pure function of the date and the island's seed), another seed another order
    expect(days.map((d) => guestOn(d))).toEqual(seq);
    expect(days.map((d) => guestOn(d, 'another-island'))).not.toEqual(seq);
    // before the cycles' start too (a past date)
    expect(GUESTS).toContain(guestOn('2025-12-31'));
  });
  it('the cast: every special character once, NH’s icon for each', () => {
    const ids = CAST.map(([id]) => id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(existsSync(join(import.meta.dirname, '../../../static/room/npc', `${id}.webp`)), id).toBe(true);
  });
});
