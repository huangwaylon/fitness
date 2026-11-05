import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROSTER } from '#lib/villagers/roster.ts';
import { BANK as ITEMS, clipItems, type CastId } from './bank.ts';
import { CAST } from './bank4.ts';
import { CAST_IDS, SLOTS, castOf, numberWords, ordinalWords, sayNumbers, spokenText } from './speech.ts';

/** What's spoken, one per clip (a dialogue's lines each its own: bank.ts clipItems), as the audio script sees it. */
const BANK = ITEMS.flatMap(clipItems);

const CAST_JSON: Record<string, { accent: string; gender: string; source: string; description: string; seed: number; ref: { text: string; licence: string; origin: string; attribution?: string } }> =
  JSON.parse(readFileSync(join(import.meta.dirname, '../../../scripts/tts/cast.json'), 'utf8'));

describe('kikimimi cast', () => {
  it('cast.json describes exactly the 12 voices, US weighted, each with a reference transcript and its licence', () => {
    expect(CAST_IDS).toHaveLength(12);
    expect(Object.keys(CAST_JSON).sort()).toEqual([...CAST_IDS].sort());
    for (const id of CAST_IDS) {
      const c = CAST_JSON[id];
      expect(`${c.accent}-${c.gender}`, id).toBe(id.slice(0, 4));
      expect(['design', 'phonon', 'vctk'], id).toContain(c.source);
      expect(c.description.length, id).toBeGreaterThan(20);
      expect(Number.isInteger(c.seed), id).toBe(true);
      expect(c.ref.text, id).toMatch(/^[A-Z].*[.?!]$/);
      expect(c.ref.licence && c.ref.origin, id).toBeTruthy();
      if (c.source === 'vctk') expect(c.ref.attribution, id).toContain('10.7488/ds/2645');
    }
    const n = (a: string) => CAST_IDS.filter((id) => id.startsWith(a)).length;
    expect([n('us'), n('uk'), n('au')]).toEqual([6, 3, 3]);
    for (const a of ['us', 'uk', 'au'] as const) expect(SLOTS[a].f + SLOTS[a].m).toBe(n(a));
  });

  it('every item, levels 1-4, gets a cast voice of its accent and its speaker’s gender', () => {
    for (const it of BANK) {
      const c = castOf(it);
      expect(CAST_IDS, it.id).toContain(c);
      expect(c.slice(0, 2), it.id).toBe(it.voice);
      expect(c[3], it.id).toBe(ROSTER[it.speaker].gender);
      if (it.cast) expect(c, it.id).toBe(it.cast);
    }
  });

  it('a villager keeps one voice per accent, its CAST voice at its own accent', () => {
    const seen = new Map<string, CastId>();
    for (const it of BANK) {
      const k = `${it.speaker}/${it.voice}`, c = castOf(it);
      expect(seen.get(k) ?? c, it.id).toBe(c);
      seen.set(k, c);
      const home = CAST[it.speaker];
      if (home?.startsWith(it.voice)) expect(c, it.id).toBe(home);
    }
    // every speaker of levels 1-3 has a home voice too
    for (const it of BANK) expect(CAST[it.speaker], it.speaker).toBeDefined();
  });

  it('every voice speaks, and the load is spread (no voice over a fifth of the bank or under 5 lines)', () => {
    const n = new Map<CastId, number>();
    for (const it of BANK) n.set(castOf(it), (n.get(castOf(it)) ?? 0) + 1);
    expect([...n.keys()].sort()).toEqual([...CAST_IDS].sort());
    for (const [c, k] of n) {
      expect(k, c).toBeGreaterThanOrEqual(5);
      expect(k, c).toBeLessThanOrEqual(BANK.length / 5);
    }
    // US weighted: the US voices speak most of the bank
    const us = BANK.filter((it) => castOf(it).startsWith('us')).length;
    expect(us / BANK.length).toBeGreaterThan(0.5);
  });
});

describe('kikimimi spoken text', () => {
  it('writes whole numbers out as said', () => {
    expect(numberWords(0)).toBe('zero');
    expect(numberWords(13)).toBe('thirteen');
    expect(numberWords(40)).toBe('forty');
    expect(numberWords(47)).toBe('forty-seven');
    expect(numberWords(800)).toBe('eight hundred');
    expect(numberWords(115)).toBe('one hundred fifteen');
    expect(numberWords(115, 'uk')).toBe('one hundred and fifteen');
    expect(numberWords(1500)).toBe('fifteen hundred');
    expect(numberWords(4000)).toBe('four thousand');
    expect(numberWords(9900)).toBe('nine thousand nine hundred');
    expect(numberWords(12_500)).toBe('twelve thousand five hundred');
    expect(numberWords(115_000)).toBe('one hundred fifteen thousand');
    expect(numberWords(115_000, 'au')).toBe('one hundred and fifteen thousand');
    expect(numberWords(2005, 'uk')).toBe('two thousand and five');
    expect(numberWords(48_800)).toBe('forty-eight thousand eight hundred');
    expect(() => numberWords(1_000_000)).toThrow();
    expect(() => numberWords(1.5)).toThrow();
  });

  it('writes ordinals out', () => {
    expect(ordinalWords(1)).toBe('first');
    expect(ordinalWords(12)).toBe('twelfth');
    expect(ordinalWords(13)).toBe('thirteenth');
    expect(ordinalWords(20)).toBe('twentieth');
    expect(ordinalWords(23)).toBe('twenty-third');
    expect(ordinalWords(31)).toBe('thirty-first');
  });

  it('rewrites a line’s digits: prices, ordinals, clock times; leaves words alone; throws on what it can’t say', () => {
    expect(sayNumbers("That'll be 1,500 Bells, please.")).toBe("That'll be fifteen hundred Bells, please.");
    expect(sayNumbers('The fishing tourney is on the 31st.')).toBe('The fishing tourney is on the thirty-first.');
    expect(sayNumbers("It's a steal at 115,000 Bells!", 'au')).toBe("It's a steal at one hundred and fifteen thousand Bells!");
    expect(sayNumbers('Meet me at 2:15, not 7:05 or 3:00.')).toBe("Meet me at two fifteen, not seven oh five or three o'clock.");
    expect(sayNumbers('Let’s meet at two fifteen.')).toBe('Let’s meet at two fifteen.');
    expect(() => sayNumbers('It costs £8.49.')).toThrow(/tts/);
  });

  it('every item’s spoken text has no digit (§9: never digits for the engine), and `tts` wins', () => {
    for (const it of BANK) {
      const t = spokenText(it);
      expect(t, it.id).not.toMatch(/[0-9£$¥%]/);
      if (it.tts) expect(t, it.id).toBe(it.tts);
      if (!/\d/.test(it.en) && !it.tts) expect(t, it.id).toBe(it.en);
    }
  });
});
