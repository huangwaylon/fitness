import { describe, expect, it } from 'vitest';
import { newGame, type Game } from '../game.ts';
import { highlightOf, pairsOf } from './results.ts';

const base = newGame([{ who: 'A', name: 'A', level: 2 }, { who: 'B', name: 'B', level: 2 }], 'results');
const made = (m: Game['made']): Game => ({ ...base, made: m });
const w = (p: number, text: string, ja = '') => ({ p, kind: 'word' as const, text, ja, stars: 3 });

describe('results', () => {
  it("each one's good thing: a long word first, then pictures, lines, any word, a thank-you", () => {
    const g = made([w(0, 'cat'), w(0, 'garden'), { p: 1, kind: 'picture', text: 'apple', ja: 'りんご', stars: 5 }]);
    expect(highlightOf(g, 0)).toContain('garden');
    expect(highlightOf(g, 1)).toContain('1');
    expect(highlightOf(made([w(0, 'cat')]), 0)).toContain('cat');
    expect(highlightOf(made([]), 1)).not.toBe('');
  });
  it('ふりかえり: newest first, only with Japanese, each English and Japanese once, five at most', () => {
    const g = made([w(0, 'a1', 'x'), w(0, 'dog', 'いぬ'), w(1, 'cat', 'ねこ'), w(1, 'dog', 'いぬ'), w(0, 'kitty', 'ねこ'), w(0, 'run'),
      ...['b', 'c', 'd', 'e', 'f'].map((t) => w(1, t, t.toUpperCase()))]);
    const p = pairsOf(g);
    expect(p).toHaveLength(5);
    expect(p[0]).toEqual({ en: 'f', ja: 'F' });
    expect(pairsOf(made([w(0, 'dog', 'いぬ'), w(1, 'cat', 'ねこ'), w(1, 'dog', 'いぬ'), w(0, 'kitty', 'ねこ')]))).toEqual([{ en: 'kitty', ja: 'ねこ' }, { en: 'dog', ja: 'いぬ' }]);
  });
});
