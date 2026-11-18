import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { seeded } from '#lib/random.ts';
import { friendly, newBag, refill, scoreOf, spellable, without, RACK } from './tiles.ts';
import { BOARD, FORK, GOAL, pathOf, stepFrom, toGoal } from './board.ts';
import { CARDS } from './cards.ts';
import { choose, eventDone, finish, pictureDone, tried, homeDone, isGame, LEVEL, MAX_ROUNDS, newGame, playWord, ranking, sentenceAsWord, sentenceDone, sentenceStars, spin, swap,
  wordScore, type Game, type Level } from './game.ts';
import { decodeAccept, wordsOf } from './words.ts';
import { inOrder, pickSentence, sentenceOf, tilesOf, type Line } from './sentences.ts';
import { notInTrimmedFont } from '../../../scripts/font-subsets.ts';
import everyday from './everyday.json';
import linesJson from './sentences.json';
import { s } from './i18n.ts';
import { art } from '#lib/art.ts';
import { PICTURES, choicesFor, lettersFor } from './pictures.ts';

const lines = linesJson as unknown as Line[];
const seat = (who: 'A' | 'B' | 'G', level: Level = 2) => ({ who, name: who, level });
const seats = [seat('A'), seat('B')];
const words = wordsOf(readFileSync(join(import.meta.dirname, 'words.txt'), 'utf8'), everyday);

describe('tiles', () => {
  it('rare letters, not length, win', () => {
    const o = { lucky: [], mult: 1, everyday: 0 };
    expect(scoreOf('zoo', o).total).toBe(scoreOf('orange', o).total); // 3 letters with a Z = 6 with none
    expect(scoreOf('box', { ...o, mult: 2 }).total).toBe(16);
    expect(scoreOf('tent', { lucky: ['t'], mult: 1, everyday: 2 })).toMatchObject({ letters: 4, lucky: 4, everyday: 2, total: 10 });
    expect(scoreOf('at', o).total).toBe(3);
    expect(scoreOf('box', { ...o, half: true }).total).toBe(4);
  });
  it('racks are friendly almost always and keep the tile count', () => {
    let bad = 0;
    for (let i = 0; i < 300; i++) {
      const r = seeded(`t${i}`);
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
  it('one route with one fork, both ways reaching the goal', () => {
    expect(BOARD[0].kind).toBe('start');
    expect(BOARD[GOAL].kind).toBe('goal');
    expect(BOARD.filter((b) => b.next.length > 1)).toHaveLength(1);
    expect(stepFrom(FORK, null)).toBeNull();
    const short = toGoal(0, 0), long = toGoal(0, 1);
    expect(short).toBeLessThan(long);
    expect(short).toBeGreaterThanOrEqual(18);
    expect(long).toBeLessThanOrEqual(26);
    expect(pathOf(FORK, BOARD[FORK].next[1], 1)).toEqual([BOARD[FORK].next[1]]);
    for (const sp of BOARD) expect(sp.x >= 20 && sp.x <= 340 && sp.y >= 20 && sp.y <= 400).toBe(true);
  });
  it('cards: short A1 English, Japanese in the font, good only', () => {
    for (const c of CARDS) {
      expect(c.en.replace(/\*/g, '').split(/\s+/).length).toBeLessThanOrEqual(9);
      expect(notInTrimmedFont(c.ja)).toEqual([]);
      expect((c.move ?? 0) >= 0 && (c.stars ?? 0) >= 0).toBe(true);
    }
  });
});

/** Play a whole game: each word space plays the rack's best word, the fork alternates. */
function playOut(seed: string, levels: Level[] = [2, 2], length: 'short' | 'normal' | 'long' = 'normal'): Game {
  let g = newGame(levels.map((l, i) => seat((['A', 'B', 'G', 'A'] as const)[i], l)), seed, length);
  for (let i = 0; i < 600 && g.phase.k !== 'end'; i++) {
    const k = g.phase.k;
    if (k === 'spin') g = spin(g);
    else if (k === 'fork') g = choose(g, (g.turn % 2) as 0 | 1);
    else if (k === 'word') {
      const w = words.from(g.players[g.turn].rack, (x) => wordScore(g, x, false)?.total ?? 0).find((x) => wordScore(g, x, false));
      g = w ? playWord(g, w, { everyday: !!words.ja(w), ja: words.ja(w), hinted: false }) : swap(g);
    } else if (k === 'sentence') g = sentenceDone(g, { misses: 0, unseen: false, text: 'I like it.', ja: '好き' });
    else if (k === 'picture') g = pictureDone(g, 0);
    else if (k === 'event') g = eventDone(g);
    else if (k === 'home') g = homeDone(g);
  }
  return g;
}

describe('game', () => {
  it('plays to the end, the same every time, for 2–4 seats', () => {
    for (const lv of [[1, 3], [2, 2, 1], [3, 2, 1, 2]] as Level[][]) {
      const g = playOut(`g${lv.length}`, lv);
      expect(g.phase.k).toBe('end');
      expect(g.round).toBeLessThanOrEqual(MAX_ROUNDS[lv.length]);
      expect(JSON.stringify(playOut(`g${lv.length}`, lv))).toBe(JSON.stringify(g));
      expect(ranking(g)).toHaveLength(lv.length);
    }
  });
  it('rounds stay 10–20 minutes (≈ 5–10 rounds), the fork taken', () => {
    const rounds = Array.from({ length: 40 }, (_, i) => playOut(`r${i}`).round);
    const mean = rounds.reduce((a, b) => a + b, 0) / rounds.length;
    expect(mean).toBeGreaterThan(5);
    expect(mean).toBeLessThanOrEqual(10);
    expect(playOut('fork').players.every((p) => p.branch !== null || p.pos <= FORK)).toBe(true);
  });
  it('levels: the shortest word and the everyday bonus; the table stays close', () => {
    const at = (level: Level) => ({ ...newGame([seat('A', level), seat('B')], 'w'), phase: { k: 'word' as const, mult: 1, spun: 1 } });
    const g1 = at(1), g3 = at(3);
    const three = g1.players[0].rack.slice(0, 3).join('');
    expect(wordScore(g3, three, false)).toBeNull();
    expect(wordScore(g1, three.slice(0, 2), false)).toBeNull();
    expect(LEVEL[1].everyday).toBeGreaterThan(LEVEL[3].everyday);
    expect(wordScore(g1, three, true, true)?.half).toBe(false); // やさしい's ヒント: in full
    const sums = { 1: 0, 3: 0 };
    for (let i = 0; i < 30; i++) {
      const g = playOut(`lv${i}`, [1, 3]);
      sums[1] += g.players[0].stars;
      sums[3] += g.players[1].stars;
    }
    expect(sums[1] / sums[3]).toBeGreaterThan(0.6);
  });
  it('a word that cannot be spelt scores nothing', () => {
    const g = { ...newGame(seats, 'w'), phase: { k: 'word' as const, mult: 1, spun: 1 } };
    expect(wordScore(g, 'qqq', false)).toBeNull();
    expect(playWord(g, 'qqq', { everyday: false, ja: '', hinted: false })).toBe(g);
  });
  it('sentences: stars by misses, +2 unseen, a missing line plays as a word', () => {
    expect([sentenceStars(0, false), sentenceStars(1, true), sentenceStars(2, true)]).toEqual([6, 6, 2]);
    const g = { ...newGame(seats, 's'), phase: { k: 'sentence' as const, spun: 2, r: 0.5 } };
    expect(sentenceAsWord(g).phase.k).toBe('word');
  });
  it('saves: this build’s only', () => {
    const g = playOut('save');
    expect(isGame(JSON.parse(JSON.stringify(g)))).toBe(true);
    expect(isGame({ ...g, v: 1 })).toBe(false);
    expect(isGame({ ...g, content: 'x' })).toBe(false);
    expect(isGame({ ...g, phase: { k: 'event', card: 999, spun: 1 } })).toBe(false);
  });
  it('a turn’s tries are kept in the save (a reopened sheet resumes them), only on an English turn', () => {
    const g = { ...newGame(seats, 'tr'), phase: { k: 'sentence' as const, spun: 1, r: 0 } };
    expect(tried(g, { misses: 1, peeked: true }).phase).toMatchObject({ misses: 1, peeked: true, r: 0 });
    const spinning = newGame(seats, 'tr');
    expect(tried(spinning, { misses: 1 })).toBe(spinning);
    expect(isGame(JSON.parse(JSON.stringify(tried(g, { misses: 2 }))))).toBe(true);
  });
  it('lengths: みじかい by round 5, ながい till everyone’s home (12 at most)', () => {
    for (let i = 0; i < 10; i++) {
      expect(playOut(`L${i}`, [2, 2], 'short').round).toBeLessThanOrEqual(5);
      const long = playOut(`L${i}`, [2, 2], 'long');
      expect(long.round).toBeLessThanOrEqual(12);
      expect(long.players.every((p) => p.home !== null) || long.round === 12).toBe(true);
    }
  });
  it('a corrupt save reads as none', () => {
    const g = playOut('bad');
    expect(isGame({ ...g, turn: 9 })).toBe(false);
    expect(isGame({ ...g, players: g.players.map((p) => ({ ...p, level: 9 as Level })) })).toBe(false);
  });
  it('finish ends at once', () => expect(finish(newGame(seats, 'f')).phase.k).toBe('end'));
});

describe('words and sentences', () => {
  it('any real word is accepted (mingle, cats…), the hints only from the familiar list; nothing blocked', () => {
    const accept = decodeAccept(readFileSync(join(import.meta.dirname, 'accept.txt'), 'utf8'));
    const all = wordsOf(readFileSync(join(import.meta.dirname, 'words.txt'), 'utf8'), everyday, accept);
    for (const w of ['mingle', 'mingled', 'cats', 'zoo', 'box', 'jam', 'quiz']) expect(all.has(w), w).toBe(true);
    for (const w of ['sex', 'xqzt', 'mingl']) expect(all.has(w), w).toBe(false);
    expect(accept.size).toBeGreaterThan(70_000);
    expect(all.from(['m', 'i', 'n', 'g', 'l', 'e', 'x'], () => 0).every((w) => !accept.has(w) || words.has(w))).toBe(true);
  });
  it('the everyday list is in shape and in the font', () => {
    for (const [w, ja] of Object.entries(everyday)) {
      expect(w).toMatch(/^[a-z]{2,8}$/);
      expect(ja.length).toBeLessThanOrEqual(12);
    }
    expect(notInTrimmedFont(Object.values(everyday).join(''))).toEqual([]);
  });
  it('a sentence: tiles shuffled, order judged by the words, a level’s line first', () => {
    const s0 = sentenceOf(['I’ll grab a coffee.', 'コーヒーを買ってくる', 2]);
    expect(s0.words).toEqual(['I’ll', 'grab', 'a', 'coffee.']);
    expect(tilesOf(s0, 'x').map((t) => t.w).join(' ')).not.toBe(s0.en);
    expect(inOrder(s0, s0.words)).toBe(true);
    const ls: Line[] = [['A b c.', 'x', 1], ['D e f.', 'y', 3]];
    expect(pickSentence(ls, 3, 0, new Set())?.en).toBe('D e f.');
    expect(pickSentence(ls, 3, 0, new Set(['D e f.']))?.en).toBe('A b c.');
    expect(pickSentence(ls, 1, 0, new Set(['A b c.', 'D e f.']))).toBeNull();
  });
  it('the lines: 3–6 words, Japanese in the font, every level stocked', () => {
    for (const [en, ja, lv] of lines) {
      expect(en.split(' ').length).toBeGreaterThanOrEqual(3);
      expect(en.split(' ').length).toBeLessThanOrEqual(6);
      expect([1, 2, 3]).toContain(lv);
      expect(ja).toMatch(/[ぁ-んァ-ン一-龯]/);
    }
    for (const lv of [1, 2, 3]) expect(lines.filter((l) => l[2] === lv).length).toBeGreaterThan(40);
    expect(notInTrimmedFont(lines.map((l) => l[1]).join(''))).toEqual([]);
  });
  it('the pictures: art on disk, Japanese in the font, three spellings, the letters to spell with', () => {
    expect(PICTURES.length).toBeGreaterThanOrEqual(30);
    for (const p of PICTURES) {
      expect(art(p.key), p.key).not.toBeNull();
      expect(p.w).toMatch(/^[a-z]{3,8}$/);
      expect(notInTrimmedFont(p.ja)).toEqual([]);
      const c = choicesFor(p, seeded(p.w));
      expect(new Set(c).size).toBe(3);
      expect(c).toContain(p.w);
      expect(lettersFor(p, 2, seeded(p.w)).sort().join('')).toBe([...p.w].sort().join(''));
      expect(lettersFor(p, 3, seeded(p.w))).toHaveLength(p.w.length + 2);
    }
  });
  it('the copy is in the font', () => {
    const src = readFileSync(join(import.meta.dirname, 'i18n.ts'), 'utf8');
    expect(notInTrimmedFont(src.match(/ja: '[^']*'/g)!.join(''))).toEqual([]);
    expect(s('title')).toBe('英語すごろく');
  });
});
