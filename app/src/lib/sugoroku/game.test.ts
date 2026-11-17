import { describe, expect, it } from 'vitest';
import { seeded } from '#lib/random.ts';
import { friendly, newBag, refill, scoreOf, spellable, without, RACK } from './tiles.ts';
import { BOARD, GOAL, cellOf, COLS } from './board.ts';
import { CARDS } from './cards.ts';
import { eventDone, finish, homeDone, isGame, newGame, playWord, ranking, sentenceDone, spin, swap, wordScore, type Game } from './game.ts';
import { wordsOf } from './words.ts';
import { inOrder, pickSentence, sentenceOf, tilesOf } from './sentences.ts';
import everyday from './everyday.json';
import lines from './sentences.json';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const seats = [{ who: 'A' as const, villager: null, name: 'ウェイ' }, { who: 'B' as const, villager: null, name: 'うめ' }];

describe('tiles', () => {
  it('rare letters beat length', () => {
    const o = { lucky: [], mult: 1, common: false };
    expect(scoreOf('zoo', o).total).toBe(scoreOf('orange', o).total); // 3 letters with a Z = 6 with none
    expect(scoreOf('box', { ...o, mult: 2 }).total).toBe(16);
    expect(scoreOf('tent', { lucky: ['t'], mult: 1, common: true })).toMatchObject({ letters: 4, lucky: 4, common: 2, total: 10 });
    expect(scoreOf('at', o).total).toBe(3);
    expect(scoreOf('box', { ...o, hinted: true }).total).toBe(4);
  });
  it('racks are friendly almost always and keep the tile count', () => {
    let bad = 0;
    for (let s = 0; s < 300; s++) {
      const r = seeded(`t${s}`);
      const bag = newBag(r);
      const { rack, bag: left } = refill([], bag, r);
      expect(rack).toHaveLength(RACK);
      expect(left.length + rack.length).toBe(bag.length);
      if (!friendly(rack)) bad++;
    }
    expect(bad).toBeLessThan(15);
  });
  it('spells from the rack once each', () => {
    expect(spellable('zoo', ['z', 'o', 'o'])).toBe(true);
    expect(spellable('zoo', ['z', 'o'])).toBe(false);
    expect(without(['a', 'b', 'a'], 'ab')).toEqual(['a']);
  });
});

describe('board', () => {
  it('runs from home to the goal, cells unique', () => {
    expect(BOARD[0].kind).toBe('start');
    expect(BOARD[GOAL].kind).toBe('goal');
    const cells = new Set(BOARD.map((_, i) => `${cellOf(i).row},${cellOf(i).col}`));
    expect(cells.size).toBe(BOARD.length);
    expect(cellOf(COLS)).toEqual({ row: 1, col: COLS - 1 });
  });
  it('cards: short A1 English, Japanese, an effect', () => {
    for (const c of CARDS) {
      expect(c.en.replace(/\*/g, '').split(/\s+/).length).toBeLessThanOrEqual(9);
      expect(c.ja).toMatch(/[ぁ-ん]/);
      expect(c.move === undefined || c.move >= -2).toBe(true);
      expect(c.stars === undefined || c.stars > 0).toBe(true);
    }
  });
});

/** Play a whole game: each word space plays the rack's best word. */
function playOut(seed: string, n = 2): Game {
  const words = wordsOf(readFileSync(join(import.meta.dirname, 'words.txt'), 'utf8'), everyday);
  let g = newGame([...seats, ...seats].slice(0, n), seed);
  for (let i = 0; i < 400 && g.phase.k !== 'end'; i++) {
    const k = g.phase.k;
    if (k === 'spin') g = spin(g);
    else if (k === 'word') {
      const w = words.from(g.players[g.turn].rack, (x) => wordScore(g, x, false)?.total ?? 0)[0];
      g = w ? playWord(g, w, { common: !!words.ja(w), ja: words.ja(w), hinted: false }) : swap(g);
    } else if (k === 'sentence') g = sentenceDone(g, 0, 'I like it.', '好き');
    else if (k === 'event') g = eventDone(g);
    else if (k === 'home') g = homeDone(g);
  }
  return g;
}

describe('game', () => {
  it('plays to the end, everyone home, the same every time', () => {
    for (const n of [2, 3, 4]) {
      const g = playOut(`g${n}`, n);
      expect(g.phase.k).toBe('end');
      expect(g.players.some((p) => p.home !== null)).toBe(true);
      expect(JSON.stringify(playOut(`g${n}`, n))).toBe(JSON.stringify(g));
      expect(isGame(JSON.parse(JSON.stringify(g)))).toBe(true);
      expect(ranking(g)).toHaveLength(n);
    }
  });
  it('rounds stay short (10–20 min: about 8–14 rounds)', () => {
    const rounds = Array.from({ length: 40 }, (_, i) => playOut(`r${i}`).round);
    const mean = rounds.reduce((a, b) => a + b, 0) / rounds.length;
    expect(mean).toBeGreaterThan(5);
    expect(mean).toBeLessThan(14);
  });
  it('a word that cannot be spelt scores nothing', () => {
    let g = newGame(seats, 'w');
    g = { ...g, phase: { k: 'word', mult: 1, spun: 1 } };
    expect(wordScore(g, 'qqq', false)).toBeNull();
    expect(playWord(g, 'qqq', { common: false, ja: '', hinted: false })).toBe(g);
  });
  it('finish ends at once', () => expect(finish(newGame(seats, 'f')).phase.k).toBe('end'));
});

describe('words and sentences', () => {
  it('the everyday list is in shape', () => {
    for (const [w, ja] of Object.entries(everyday)) {
      expect(w).toMatch(/^[a-z]{2,8}$/);
      expect(ja.length).toBeLessThanOrEqual(12);
    }
  });
  it('a sentence: tiles shuffled, order judged by the words', () => {
    const s = sentenceOf(['I’ll grab a coffee.', 'コーヒーを買ってくる']);
    expect(s.words).toEqual(['I’ll', 'grab', 'a', 'coffee.']);
    expect(tilesOf(s, 'x').map((t) => t.w).join(' ')).not.toBe(s.en);
    expect(inOrder(s, s.words)).toBe(true);
    expect(pickSentence([['I’ll grab a coffee.', 'x']], 'x', 0, new Set([s.en]))).toBeNull();
  });
  it('the lines: 3–6 words, Japanese, no names', () => {
    expect(lines.length).toBeGreaterThan(500);
    for (const [en, ja] of lines) {
      expect(en.split(' ').length).toBeGreaterThanOrEqual(3);
      expect(en.split(' ').length).toBeLessThanOrEqual(6);
      expect(ja).toMatch(/[ぁ-んァ-ン一-龯]/);
    }
  });
});
