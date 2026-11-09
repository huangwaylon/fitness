// 音の へんしん's phrases (content/henshin.ts, docs/curriculum.md "Connected speech"): the phenomena in order and covered,
// many voices each, each phrase a fair `word` item (its focus in the sentence, the wrong chunks not, a full form to
// type, tiles to tap), the choice tells near chance, and every voiced phrase's reduction heard by whisper
// (scripts/kikimimi-reduce.ts → reduce.json, at its clips' hashes). The bank-wide rules (help, notes, near-duplicates,
// marks) are bank.test's, near-dupes.test's and staging.test's.
import { describe, expect, it } from 'vitest';
import { ROSTER } from '#lib/villagers/roster.ts';
import { HENSHIN_LV, takeIds } from '../bank.ts';
import { PHENOMENA, phenomenonOf } from '../henshin.ts';
import { BANK } from '../source.ts';
import { carefulText, spokenText } from '../speech.ts';
import { DRILL_LIMITS, allWords, overLimits, statsOfTells, tellsOf } from '../tells.ts';
import { decoysFor } from '../games/henshin/def.ts';
import { matchTyped } from '../games/henshin/match.ts';
import clipsJson from '../clips.json';
import reduceJson from '../reduce.json';
import { ITEMS } from './henshin.ts';
import { WAITING } from './index.ts';

const CLIPS: Readonly<Record<string, { hash: string }>> = clipsJson;
const REDUCE: Readonly<Record<string, readonly [string, string, number, number, string, string]>> = reduceJson as never;

describe('音の へんしん: the phrases', () => {
  it('15 phenomena in the order taught, 12 phrases each, ids hs-<phenomenon>-<slug>, all level 8 and waiting for their voices', () => {
    expect(PHENOMENA).toHaveLength(15);
    for (const ph of PHENOMENA) {
      const mine = ITEMS.filter((it) => phenomenonOf(it) === ph);
      expect(mine.length, ph).toBe(12);
      for (const it of mine) expect(it.id).toMatch(new RegExp(`^hs-${ph}-[a-z0-9]+(-[a-z0-9]+)*$`));
    }
    expect(ITEMS.map((it) => phenomenonOf(it))).toEqual(PHENOMENA.flatMap((ph) => new Array(12).fill(ph)));
    for (const it of ITEMS) {
      expect(it.lv, it.id).toBe(HENSHIN_LV);
      expect(it.type, it.id).toBe('word');
      expect(WAITING.has(it.id), it.id).toBe(true);
    }
  });

  it('many talkers: each phenomenon in 12 US voices, women and men', () => {
    for (const ph of PHENOMENA) {
      const mine = ITEMS.filter((it) => phenomenonOf(it) === ph);
      expect(new Set(mine.map((it) => it.cast)).size, ph).toBe(12);
      expect(new Set(mine.map((it) => ROSTER[it.speaker].gender)).size, ph).toBe(2);
      for (const it of mine) expect(it.cast!.startsWith('us-'), it.id).toBe(true);
    }
  });

  it('each a fair item: what changes as said and in full, a careful take unlike the natural one, a few words to type, tiles to tap', () => {
    for (const it of ITEMS) {
      expect(it.choices).toHaveLength(3);
      expect(it.choices[it.answer], it.id).toBe(it.focus);
      expect(it.hs!.red.trim().length, it.id).toBeGreaterThan(0);
      expect(it.hs!.full !== undefined, `${it.id}: a full form only for a contraction`).toBe(phenomenonOf(it) === 'contraction');
      expect(carefulText(it), it.id).not.toBe(spokenText(it));
      const words = it.focus!.split(/\s+/);
      expect(words.length, it.id).toBeLessThanOrEqual(5);
      // typing the full form, or what was said, is right
      expect(matchTyped(it.hs!.full ?? it.focus!, words).every(Boolean), it.id).toBe(true);
      for (const tier of ['easy', undefined, 'hard'] as const) expect(decoysFor(it, tier).length, `${it.id} ${tier}`).toBeGreaterThan(0);
      expect(takeIds(it), it.id).toEqual([it.id, `${it.id}-c`, `${it.id}-f`]);
    }
  });

  it('the choice tells near chance (curriculum.md "Choice tells"), weighed against what is said', () => {
    const s = statsOfTells(ITEMS.map((it) => tellsOf({ choices: it.choices, answer: it.answer, en: it.tts ?? it.en }, allWords)));
    console.log(`音の へんしん tells: ${JSON.stringify(s)}`);
    expect(overLimits(s, DRILL_LIMITS)).toEqual([]);
  });

  it('every voiced phrase heard as said (a spelling whisper writes: gonna, lemme…), its careful take in full (whisper: reduce.json at its clips’ hashes)', () => {
    const voiced = BANK.filter((it) => it.lv === HENSHIN_LV);
    for (const it of voiced) {
      const r = REDUCE[it.id];
      expect(r, `${it.id}: npm run kikimimi:reduce`).toBeDefined();
      expect([r[0], r[1]], `${it.id}: checked at other clips (npm run kikimimi:reduce)`).toEqual([CLIPS[it.id].hash, CLIPS[`${it.id}-c`].hash]);
      expect(r[2], `${it.id}: heard "${r[4]}", the careful take "${r[5]}"`).toBe(1);
    }
  });
});
