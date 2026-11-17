// フレーズ's deck (catalog.ts deckOf, shardsOf; docs/english.md "フレーズ"): which questions make a card, one per
// English phrase, split into SHARDS stable files that each mix the whole library.
import { describe, expect, it } from 'vitest';
import { deckOf, inDeck, shardOf, shardsOf, SHARDS, type PhraseEntry } from './catalog.ts';
import { keyWordsOf, markedIn, wordsOf } from './phrases.ts';
import { CLIPS } from './clips/index.ts';
import { planOf } from './plan.ts';
import type { Clip, Question } from './types.ts';

const q = (o: Partial<Question> = {}): Question => ({
  id: 'q1', skill: 'phrase', level: 'B1', point: 'p', seg: [10, 14], stem: 'S?', choices: ['a', 'b', 'c'], a: 0, cue: 'c',
  said: 's', mean: 'm', trap: 't', line: 'Can I *use your bathroom*?', use: 'Can I use your phone?（電話を借りてもいい？）', ...o
});
const clip = (id: string, questions: Question[]): Clip =>
  ({ id, video: 'v', title: 'T', dur: 120, wpm: 150, band: 'slow', tags: [], show: 'Friends', credit: 'c', questions }) as Clip;

describe('the key words', () => {
  it('a line’s starred words, lower case, punctuation dropped, never a / an / the', () => {
    expect([...keyWordsOf('Hey, *Can’t* stop — *the Wi-Fi, man!* ok')]).toEqual(['can’t'.replace('’', ''), 'wifi', 'man']);
    expect(wordsOf('I can’t, OK?')).toEqual(['i', 'cant', 'ok']);
  });
  it('a phrase shares one when one of its words is one (a whole word, never a part)', () => {
    expect(inDeck(q({ use: 'Your turn.（あなたの番）' }))).toBe(true);
    expect(inDeck(q({ use: 'Bathrooms are there.（トイレはあそこ）' }))).toBe(false);
    expect(inDeck(q({ line: 'Can I use *the* bathroom?', use: 'The end.（おしまい）' }))).toBe(false);
  });
  it('underlined in the phrase: the shared words, a run of them as one', () => {
    expect(markedIn('Can I use your phone?', keyWordsOf(q().line!))).toEqual([{ t: 'Can I ', key: false }, { t: 'use your', key: true }, { t: ' phone?', key: false }]);
    expect(markedIn('Nothing here.', new Set(['x']))).toEqual([{ t: 'Nothing here.', key: false }]);
  });
});

describe('a card', () => {
  it('a live B1 phrase with its Japanese, ≤ 8 words, a segment ≤ 15 s, no character named', () => {
    expect(inDeck(q())).toBe(true);
    expect(inDeck(q({ retired: true }))).toBe(false);
    expect(inDeck(q({ level: 'B2' }))).toBe(false);
    expect(inDeck(q({ use: 'Can I use your phone?' }))).toBe(false); // no （…）: 意味を見る would show nothing
    expect(inDeck(q({ use: 'Can I use your phone for a minute, please, today?（ちょっと電話を借りてもいい？）' }))).toBe(false);
    expect(inDeck(q({ seg: [10, 26] }))).toBe(false);
    expect(inDeck(q({ use: 'Rachel, can I use your phone?（レイチェル、電話を借りていい？）' }))).toBe(false);
    expect(inDeck(q({ use: 'Ken, can I use your phone?（ケン、電話を借りていい？）' }))).toBe(true);
    expect(inDeck(q({ line: undefined }))).toBe(false);
  });
  it('not a gist, a joke, a voice or a guess', () => {
    for (const skill of ['gist', 'humor', 'who', 'predict'] as const) expect(inDeck(q({ skill }))).toBe(false);
    for (const skill of ['detail', 'marker', 'infer', 'pragma'] as const) expect(inDeck(q({ skill }))).toBe(true);
  });
  it('one per English phrase (any case or punctuation), the first in the clips’ order kept', () => {
    const deck = deckOf([clip('a', [q(), q({ id: 'q2', use: 'can I use your phone（電話いい？）' })]), clip('b', [q()])]);
    expect(deck).toEqual([['a', 'q1', 10, 14, q().use, q().line]]);
  });
});

describe('the files', () => {
  const deck = deckOf(planOf(CLIPS));
  const shards = shardsOf(deck);
  it(`${SHARDS} of them, each card in exactly one, by fnv(clip/qid) (stable as cards come and go)`, () => {
    expect(shards).toHaveLength(SHARDS);
    expect(shards.flat().toSorted()).toEqual(deck.toSorted());
    for (const [n, s] of shards.entries()) for (const e of s) expect(shardOf(e[0], e[1])).toBe(n);
    const gone = deck[0][0], kept = deck.at(-1)![0];
    const fewer = shardsOf(deck.filter((e) => e[0] !== gone));
    expect(fewer.map((s) => s.filter((e: PhraseEntry) => e[0] === kept))).toEqual(shards.map((s) => s.filter((e) => e[0] === kept)));
  });
  it('even, and each mixes the whole library', () => {
    expect(deck.length).toBeGreaterThan(1500);
    const mean = deck.length / SHARDS;
    for (const s of shards) {
      expect(Math.abs(s.length - mean)).toBeLessThan(mean * 0.2);
      expect(new Set(s.map((e) => e[0])).size).toBeGreaterThan(CLIPS.length / 3);
    }
  });
});
