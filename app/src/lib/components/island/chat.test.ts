import { describe, expect, it } from 'vitest';
import { LINES, chatLine, moodOf, type Mood } from './chat.ts';
import { PERSONALITIES } from '#lib/villagers/species.ts';
import { mulberry32 } from '#lib/random.ts';
import ja from '#lib/i18n/ja.json';
import en from '#lib/i18n/en.json';

const cat = [ja, en] as Record<string, string>[];
const ctx = { hour: 14, met: 2, asleep: false };

describe('villager chats', () => {
  it('every NH personality (and the specials) has a varied pool of at least 10 lines, in both languages', () => {
    const moods = [...Object.keys(PERSONALITIES), 'special'] as Mood[];
    expect(moods).toHaveLength(9);
    for (const m of moods) {
      expect(LINES[m], m).toBeGreaterThanOrEqual(10);
      for (let i = 0; i < LINES[m]; i++) for (const c of cat) expect(c[`chat.${m}.${i}`], `${m} ${i}`).toBeTruthy();
      expect(cat[0][`chat.${m}.${LINES[m]}`]).toBeUndefined(); // the count matches the catalog
    }
  });
  it('mostly the personality’s own lines, about 3 in 10 about the day; every key exists', () => {
    const r = mulberry32(5);
    let day = 0;
    for (let i = 0; i < 3000; i++) {
      const l = chatLine('jock', ctx, r);
      for (const c of cat) expect(c[l.key], l.key).toBeTruthy();
      if (l.key.startsWith('chat.day.')) day++;
      else expect(l.key).toMatch(/^chat\.jock\.\d+$/);
    }
    expect(day / 3000).toBeGreaterThan(0.25);
    expect(day / 3000).toBeLessThan(0.35);
  });
  it('asks about the day by the hour and the goals; sleepy when woken; never the same line twice in a row', () => {
    const day = (c: typeof ctx) => new Set(Array.from({ length: 400 }, (_, i) => chatLine('normal', c, mulberry32(i)).key));
    expect(day({ hour: 8, met: 0, asleep: false })).toContain('chat.day.morning.0');
    expect(day({ hour: 21, met: 4, asleep: false })).toContain('chat.day.allMet');
    expect(day({ hour: 21, met: 4, asleep: false })).not.toContain('chat.day.morning.0');
    const some = Array.from({ length: 400 }, (_, i) => chatLine('normal', { hour: 15, met: 3, asleep: false }, mulberry32(i))).find((l) => l.key === 'chat.day.someMet');
    expect(some?.params).toEqual({ n: 3 });
    expect(chatLine('peppy', { ...ctx, asleep: true }, () => 0.5).key).toMatch(/^chat\.asleep\./);
    let last: string | undefined;
    const r = mulberry32(9);
    for (let i = 0; i < 500; i++) {
      const k = chatLine('lazy', ctx, r, last).key;
      expect(k).not.toBe(last);
      last = k;
    }
  });
  it('a roster entry’s mood: its personality; special characters their own', () => {
    expect(moodOf({ special: false, personality: 'cranky' })).toBe('cranky');
    expect(moodOf({ special: true, personality: null })).toBe('special');
    expect(moodOf(undefined)).toBe('normal');
  });
});
