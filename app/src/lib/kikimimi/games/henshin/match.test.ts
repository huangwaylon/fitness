// 音の へんしん's dictation matching (match.ts): forgiving on case, punctuation, contractions both ways and reduced
// spellings, never on a near spelling.
import { describe, expect, it } from 'vitest';
import { matchTyped, wordsOf } from './match.ts';

const all = (typed: string, target: string[]) => matchTyped(typed, target).every(Boolean);

describe('音の へんしん: the dictation matched', () => {
  it('case and punctuation aside', () => {
    expect(all('i\'M GOING TO!', ["I'm", 'going', 'to'])).toBe(true);
    expect(all('  Going   to. ', ['going', 'to'])).toBe(true);
    expect(wordsOf('Tell ’em, OK?')).toEqual(['tell', "'em", 'ok']);
  });

  it('a contraction as good as its long form, either way', () => {
    expect(all('I am going to', ["I'm", 'going', 'to'])).toBe(true);
    expect(all("I'll", ['I', 'will'])).toBe(true);
    expect(all('it has', ["It's"])).toBe(true);
    expect(all('it is', ["It's"])).toBe(true);
    expect(all('would have', ["would've"])).toBe(true);
    expect(all('do not know', ["don't", 'know'])).toBe(true);
    expect(all('cannot', ["can't"])).toBe(true);
  });

  it('the apostrophe optional where no other word is spelled so', () => {
    expect(all('dont know', ["don't", 'know'])).toBe(true);
    expect(all('im going to', ["I'm", 'going', 'to'])).toBe(true);
    // were / we're, its / it's, well / we'll are words of their own
    expect(all('were', ["we're"])).toBe(false);
    expect(all('well', ["We'll"])).toBe(false);
  });

  it('a reduced spelling as good as what it stands for', () => {
    expect(all('gonna', ['going', 'to'])).toBe(true);
    expect(all("I'm gonna", ["I'm", 'going', 'to'])).toBe(true);
    expect(all('whaddaya', ['What', 'do', 'you'])).toBe(true);
    expect(all('whaddaya', ['What', 'are', 'you'])).toBe(true);
    expect(all('wanna', ['want', 'a'])).toBe(true);
    expect(all('dunno', ["don't", 'know'])).toBe(true);
    expect(all('lemme', ['Let', 'me'])).toBe(true);
    expect(all("tell 'im", ['Tell', 'him'])).toBe(true);
    expect(all('didja', ['Did', 'you'])).toBe(true);
  });

  it('never a near spelling, nor another reduction', () => {
    expect(all('gotta', ['going', 'to'])).toBe(false);
    expect(all("let's", ['Let', 'me'])).toBe(false);
    expect(all('thing about it', ['think', 'about', 'it'])).toBe(false);
    expect(all('than', ['then'])).toBe(false);
    expect(all("can't", ['can'])).toBe(false);
  });

  it('each word right or not; one stray word allowed, more not', () => {
    expect(matchTyped('what did you', ['What', 'do', 'you'])).toEqual([true, false, true]);
    expect(matchTyped('I have', ["I've", 'got', 'to'])).toEqual([true, false, false]);
    expect(matchTyped('I have got', ["I've", 'got', 'to'])).toEqual([true, true, false]);
    expect(all('um going to', ['going', 'to'])).toBe(true);
    expect(all('going going to to the', ['going', 'to'])).toBe(false);
    expect(all('', ['going', 'to'])).toBe(false);
  });
});
