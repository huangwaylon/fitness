// The special characters' roles (visitorRoles.ts): the same on every phone, each a model and its copy.
import { describe, expect, it } from 'vitest';
import { CAST, COLOURS, LUCKS, ROLES, SPECIALS, fortuneOf, giftOf, npcIcon } from './visitorRoles.ts';
import { has3d } from '../components/villager3d/manifest.ts';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import jaMain from '#lib/i18n/ja.json';
import enMain from '#lib/i18n/en.json';
import jaVisitors from '#lib/i18n/visitors.ja.json';
import enVisitors from '#lib/i18n/visitors.en.json';

// (the visitors' lines: their own catalog, i18n/visitors.ts)
const ja: Record<string, string> = { ...jaMain, ...jaVisitors }, en: Record<string, string> = { ...enMain, ...enVisitors };

const J = ja as Record<string, string>, E = en as Record<string, string>;

describe('visitor roles', () => {
  it('every special character is NH’s model, with its name, introduction and lines in both languages, and its role’s lines', () => {
    for (const id of [...SPECIALS, 'pave'] as const) {
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
  it('the cast: every special character once, NH’s icon for each', () => {
    const ids = CAST.map(([id]) => id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(existsSync(join(import.meta.dirname, '../../../static/room/npc', `${npcIcon(id)}.webp`)), id).toBe(true);
  });
});
