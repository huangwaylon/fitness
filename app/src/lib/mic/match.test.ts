// The word error rate the mic probe computes on the phone (match.ts): contractions and reductions fold both ways,
// numbers read as words, fillers and punctuation out.
import { describe, expect, it } from 'vitest';
import { wer, words } from './match.ts';

describe('words', () => {
  it('folds contractions, reductions and numbers; drops punctuation and fillers', () => {
    expect(words("Hey, it's me. Um, I've got Tuesday at a quarter to five!")).toEqual(['hey', 'it', 'is', 'me', 'i', 'have', 'got', 'tuesday', 'at', 'a', 'quarter', 'to', 'five']);
    expect(words("I'm gonna, can't, won't — 45")).toEqual(['i', 'am', 'going', 'to', 'can', 'not', 'will', 'not', 'forty', 'five']);
    expect(words('We’re out of onions')).toEqual(['we', 'are', 'out', 'of', 'onions']);
  });
});

describe('wer', () => {
  it('is 0 for the same words however written, and counts substitutions, deletions and insertions', () => {
    expect(wer("I was going to make curry, but we're out of onions.", 'i was gonna make curry but we are out of onions')).toBe(0);
    expect(wer('feed my cat tomorrow', 'feed my hat tomorrow')).toBe(0.25);
    expect(wer('feed my cat tomorrow', 'feed cat tomorrow')).toBe(0.25);
    expect(wer('feed my cat', 'please feed my cat now')).toBeCloseTo(2 / 3);
    expect([wer('', ''), wer('', 'hello'), wer('hello there', '')]).toEqual([0, 1, 1]);
  });
});
