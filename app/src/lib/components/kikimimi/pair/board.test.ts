// はつおん's pages, the pure part: a word alone as its own item (its clip), whose turn it is in あてっこ, and what the
// villager makes of a take (whisper's scores, else the transcript; nothing heard; a failed take).
import { describe, expect, it } from 'vitest';
import type { PairCard } from '#lib/kikimimi/games/pair/pairs.ts';
import { heardOf, mySay, wordItem } from './board.ts';

const card = {
  id: 'pr-rice', lv: 3, type: 'word', en: 'rice / lice', ja: 'ご飯 / シラミ', speaker: 'goldie', voice: 'us', choices: ['rice', 'lice'], answer: 0,
  lines: [{ who: 'goldie', cast: 'us-f2', en: 'rice', ja: 'ご飯' }, { who: 'goldie', cast: 'us-f2', en: 'lice', ja: 'シラミ' }],
  pair: { sound: 'l-r', words: [{ en: 'rice', ja: 'ご飯' }, { en: 'lice', ja: 'シラミ' }] }
} as unknown as PairCard;
const WORDS = ['rice', 'lice'];

describe('はつおん: the page’s helpers', () => {
  it('a word alone: its clip id, no lines', () => {
    expect(wordItem(card, 1)).toMatchObject({ id: 'pr-rice-2', en: 'lice', ja: 'シラミ', speaker: 'goldie' });
    expect(wordItem(card, 1).lines).toBeUndefined();
    expect('pair' in wordItem(card, 0)).toBe(false);
  });

  it('whose turn: solo always mine; あてっこ role i % 2', () => {
    const solo = { players: [{ who: 'A' }], vs: false, roles: {} } as never;
    expect(mySay(solo, 'A', 1)).toBe(true);
    const two = { players: [{ who: 'A' }, { who: 'B' }], vs: false, roles: { A: 0, B: 1 } } as never;
    expect([0, 1, 2].map((i) => mySay(two, 'A', i))).toEqual([true, false, true]);
    expect([0, 1, 2].map((i) => mySay(two, 'B', i))).toEqual([false, true, false]);
  });

  it('what was heard: the scores with a margin, else the transcript; unsure; nothing; a failure', () => {
    expect(heardOf({ text: '', cand: [-0.2, -5.4], ms: 1, be: 'whisper' }, WORDS)).toEqual({ k: 0 });
    expect(heardOf({ text: '', cand: [-6.2, -2.3], ms: 1, be: 'whisper' }, WORDS)).toEqual({ k: 1 });
    expect(heardOf({ text: '', cand: [-1.1, -1.3], ms: 1, be: 'whisper' }, WORDS)).toEqual({ k: -1 });
    expect(heardOf({ text: 'Lice.', ms: 1, be: 'relay' }, WORDS)).toEqual({ k: 1 });
    expect(heardOf({ text: 'Nice.', ms: 1, be: 'webkit' }, WORDS)).toEqual({ k: -1 });
    expect(heardOf({ miss: 'none', be: 'stub' }, WORDS)).toEqual({ none: true });
    expect(heardOf({ miss: 'capped', be: 'relay' }, WORDS)).toEqual({ miss: 'capped' });
  });
});
