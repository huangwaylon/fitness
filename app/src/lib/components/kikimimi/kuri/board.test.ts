// くりかえし チャレンジ's round on the phone (kuri/board.ts): what was heard against the sentence, word by word as shown
// (contractions and reductions either way, numbers as said), the content words' count, the Japanese shown.
import { describe, expect, it } from 'vitest';
import { bare, heardAgainst, jaOf } from './board.ts';

describe('くりかえし: what was heard', () => {
  it('lights each shown word heard in its place, a contraction as its two words', () => {
    const h = heardAgainst("I don't think the bus is coming.", 'i do not think the bus coming');
    expect(h.marks.map((m) => [m.w, m.got])).toEqual([['I', true], ["don't", true], ['think', true], ['the', true], ['bus', true], ['is', false], ['coming.', true]]);
    expect([h.hit, h.of]).toEqual([3, 3]); // (think, bus, coming: `is` is a function word)
  });

  it('counts the content words got, reductions and numbers either way', () => {
    expect(heardAgainst("I'm gonna grab 2 coffees.", 'I am going to grab two coffees')).toMatchObject({ hit: 4, of: 4 });
    const h = heardAgainst('The train leaves at seven thirty.', 'the plane leaves at 7:30');
    expect([h.hit, h.of]).toEqual([3, 4]);
    expect(h.marks.filter((m) => m.key && !m.got).map((m) => bare(m.w))).toEqual(['train']);
  });

  it('heard nothing: every word grey, none got', () => {
    const h = heardAgainst('Can you pass the salt, please?', '');
    expect(h.marks.every((m) => !m.got)).toBe(true);
    expect(h.hit).toBe(0);
    expect(h.of).toBeGreaterThan(0);
  });

  it('shows a reply’s own Japanese, not the reply’s after 「→」', () => {
    expect(jaOf({ type: 'reply', ja: 'おやつ もってくるって いってなかった？ →「あっ、まだ かばんの なか！」' })).toBe('おやつ もってくるって いってなかった？');
    expect(jaOf({ type: 'word', ja: '駅はどこ？' })).toBe('駅はどこ？');
  });
});
