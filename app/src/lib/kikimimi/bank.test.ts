import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROSTER } from '#lib/villagers/roster.ts';
import { villagerArt } from '#lib/art.ts';
import { BANK, PIC_JA, type ItemType, type Level } from './bank.ts';
import { CLIPS } from './clips.ts';

const STATIC = join(import.meta.dirname, '../../../static');
const words = (s: string) => s.toLowerCase().match(/[a-z0-9',]+/g) ?? [];
const has = (en: string, phrase: string) => ` ${words(en).join(' ')} `.includes(` ${words(phrase).join(' ')} `);

describe('kikimimi bank', () => {
  it('has unique, file-safe ids', () => {
    const ids = BANK.map((it) => it.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('has at least 40 items per level, enough of each type for a game', () => {
    for (const lv of [1, 2, 3] as Level[]) {
      const items = BANK.filter((it) => it.lv === lv);
      expect(items.length, `level ${lv}`).toBeGreaterThanOrEqual(40);
      const n = (t: ItemType) => items.filter((it) => it.type === t).length;
      expect(n('pic') && n('word') && n('num')).toBeGreaterThanOrEqual(6);
      expect(n('reply') === 0).toBe(lv === 1); // reply is levels 2 and 3 only
    }
  });

  it("every speaker is a roster villager with art, never the host (しずえ)", () => {
    for (const it of BANK) {
      expect(ROSTER[it.speaker], it.id).toBeDefined();
      expect(villagerArt(it.speaker, true), it.id).not.toBeNull();
      expect(it.speaker).not.toBe('isabelle');
    }
  });

  it('accents: level 1 US only, level 2 adds UK, level 3 adds AU (and uses all three)', () => {
    const allowed = { 1: ['us'], 2: ['us', 'uk'], 3: ['us', 'uk', 'au'] };
    for (const it of BANK) expect(allowed[it.lv], it.id).toContain(it.voice);
    for (const lv of [1, 2, 3] as Level[]) expect(new Set(BANK.filter((it) => it.lv === lv).map((it) => it.voice)).size).toBe(lv);
  });

  it('answers are in range, choices distinct, counts per type', () => {
    const count: Record<ItemType, number> = { pic: 4, word: 3, num: 3, reply: 3 };
    for (const it of BANK) {
      expect(it.choices.length, it.id).toBe(count[it.type]);
      expect(new Set(it.choices).size, it.id).toBe(it.choices.length);
      expect(it.answer, it.id).toBeGreaterThanOrEqual(0);
      expect(it.answer, it.id).toBeLessThan(it.choices.length);
      expect(it.en.trim(), it.id).toBe(it.en);
      expect(it.ja.length, it.id).toBeGreaterThan(0);
    }
  });

  it('a word item: its answer word and its focus are in the sentence, the other choices are not', () => {
    for (const it of BANK.filter((it) => it.type === 'word')) {
      expect(it.focus, it.id).toBeDefined();
      expect(has(it.en, it.focus!), it.id).toBe(true);
      expect(has(it.en, it.choices[it.answer]), it.id).toBe(true);
      expect(words(it.focus!)).toEqual(words(it.choices[it.answer]));
      for (const [i, c] of it.choices.entries()) if (i !== it.answer) expect(has(it.en, c), `${it.id}: ${c}`).toBe(false);
    }
  });

  it("every focus is in its sentence; pic and num say what to listen for", () => {
    for (const it of BANK) {
      if (it.focus) expect(it.en, it.id).toContain(it.focus);
      if (it.type === 'pic' || it.type === 'num') expect(it.ask, it.id).toBeTruthy();
    }
  });

  it('pic choices are existing art with a Japanese label', () => {
    for (const it of BANK.filter((it) => it.type === 'pic'))
      for (const key of it.choices) {
        expect(existsSync(join(STATIC, 'art', `${key}.webp`)), `${it.id}: ${key}`).toBe(true);
        expect(PIC_JA[key], `${it.id}: ${key}`).toBeTruthy();
      }
    const used = new Set(BANK.filter((it) => it.type === 'pic').flatMap((it) => it.choices));
    expect(Object.keys(PIC_JA).filter((k) => !used.has(k))).toEqual([]);
  });

  it('every item has its clip (and levels 1 and 2 a slow one) on disk and in clips.json', () => {
    for (const it of BANK) {
      const c = CLIPS[it.id];
      expect(c, it.id).toBeDefined();
      expect(c.dur, it.id).toBeGreaterThan(0.5);
      expect(c.dur, it.id).toBeLessThan(8);
      expect(c.hash).toMatch(/^[0-9a-f]{8}$/);
      expect(existsSync(join(STATIC, 'audio/kikimimi', `${it.id}.m4a`)), it.id).toBe(true);
      const slow = it.lv !== 3;
      expect(Boolean(c.slow), it.id).toBe(slow);
      expect(existsSync(join(STATIC, 'audio/kikimimi', `${it.id}-slow.m4a`)), it.id).toBe(slow);
    }
    expect(Object.keys(CLIPS).sort()).toEqual(BANK.map((it) => it.id).sort());
  });

  it('ships no other files, and the clips stay small (each under 60 KB, all under 6 MB)', () => {
    const dir = join(STATIC, 'audio/kikimimi');
    const want = new Set(BANK.flatMap((it) => [`${it.id}.m4a`, ...(it.lv !== 3 ? [`${it.id}-slow.m4a`] : [])]));
    const files = readdirSync(dir);
    expect(files.filter((f) => !want.has(f))).toEqual([]);
    const sizes = files.map((f) => statSync(join(dir, f)).size);
    for (const s of sizes) expect(s).toBeLessThan(60 * 1024);
    expect(sizes.reduce((a, b) => a + b, 0)).toBeLessThan(6 * 1024 * 1024);
  });
});
