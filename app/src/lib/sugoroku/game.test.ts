import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { seeded } from '#lib/random.ts';
import { newBag, refill, scoreOf, spellable, without, RACK } from './tiles.ts';
import seedsJson from './seeds.json';
import { CLASSIC, pathOf, stepFrom, toGoal } from './board.ts';
import { layoutKey } from './layout.ts';
import { CARDS } from './cards.ts';
import { boardFor, revive, choose, eventDone, finish, rollMode, rewardOf, REWARD, REWARD_GOAL, giveLetter, tilesFor, FORCED_BONUS, POCKET, pictureDone, tried, homeDone, isGame, LEVEL, MAX_ROUNDS, newGame, playWord, teamGoal, teamStars, sentenceAsWord, sentenceDone, sentenceStars, spin, swap,
  wordScore, type Game, type Level } from './game.ts';
import { decodeAccept, wordsOf } from './words.ts';
import { inOrder, pickSentence, sentenceOf, tilesOf, type Line } from './sentences.ts';
import { notInTrimmedFont } from '../../../scripts/font-subsets.ts';
import everyday from './everyday.json';
import linesJson from './sentences.json';
import { s } from './i18n.ts';
import { PICTURES, choicesFor, lettersFor, pictureSrc } from './pictures.ts';
import { QUIZ_STARS, isQuiz, keyOf, quizOf } from './quiz.ts';
import { firstSeat } from './wire.ts';

const lines = linesJson as unknown as Line[];
const BOARD = CLASSIC.spaces, FORK = CLASSIC.forks[0], GOAL = CLASSIC.goal;
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
  it('every rack holds a common word of 5–8 letters (and keeps the tile count), kept tiles or not', () => {
    const long = (seedsJson as { w: string[] }).w;
    for (let i = 0; i < 300; i++) {
      const r = seeded(`t${i}`);
      const bag = newBag(r);
      const keep = i % 3 ? [] : ['q', 'x', 'z'].slice(0, i % 4).filter((l) => bag.includes(l));
      const { rack, bag: left } = refill(keep, bag, r);
      expect(rack).toHaveLength(RACK);
      if (!keep.length) expect(left.length + rack.length).toBe(bag.length);
      expect(long.some((w) => spellable(w, rack)), rack.join('')).toBe(true);
    }
  });
  it('spells from the rack once each', () => {
    expect(spellable('zoo', ['z', 'o', 'o'])).toBe(true);
    expect(spellable('zoo', ['z', 'o'])).toBe(false);
    expect(without(['a', 'b', 'a'], 'ab')).toEqual(['a']);
  });
});

describe('board', () => {
  it('the classic: one route with one fork, both ways reaching the goal', () => {
    expect(BOARD[0].kind).toBe('start');
    expect(BOARD[GOAL].kind).toBe('goal');
    expect(BOARD.filter((b) => b.next.length > 1)).toHaveLength(1);
    expect(stepFrom(CLASSIC, FORK, {})).toBeNull();
    const short = toGoal(CLASSIC, 0, { [FORK]: 0 }), long = toGoal(CLASSIC, 0, { [FORK]: 1 });
    expect(short).toBeLessThan(long);
    expect(toGoal(CLASSIC, 0, {})).toBe(short);
    expect(short).toBeGreaterThanOrEqual(36);
    expect(long).toBeLessThanOrEqual(45);
    expect(pathOf(CLASSIC, FORK, BOARD[FORK].next[1], { [FORK]: 1 })).toEqual([BOARD[FORK].next[1]]);
    for (const sp of BOARD) expect(sp.x >= 20 && sp.x <= 340 && sp.y >= 20 && sp.y <= 680).toBe(true);
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
function playOut(seed: string, levels: Level[] = [2, 2], length: 'short' | 'normal' | 'long' = 'normal', layout?: string): Game {
  let g = newGame(levels.map((l, i) => seat((['A', 'B', 'G', 'A'] as const)[i], l)), seed, length, layout);
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
      expect(teamStars(g)).toBe(g.players.reduce((n, p) => n + p.stars, 0));
      expect(teamGoal(g)).toBeGreaterThan(0);
    }
  });
  it('a long route: about 11 rounds, the fork taken', () => {
    const rounds = Array.from({ length: 40 }, (_, i) => playOut(`r${i}`).round);
    const mean = rounds.reduce((a, b) => a + b, 0) / rounds.length;
    expect(mean).toBeGreaterThan(9);
    expect(mean).toBeLessThanOrEqual(14);
    expect(playOut('fork').players.every((p) => p.ways[FORK] !== undefined || p.pos <= FORK)).toBe(true);
  });
  it('a generated board plays the same: about 11 rounds, every fork asked and taken, the same game from the same seeds', () => {
    const rounds: number[] = [];
    for (let i = 0; i < 30; i++) {
      // (GEN 1's: a GEN 2 board's みんなで！ plays its mini-game, mini/turn.test's whole games)
      const layout = layoutKey(`lay${i}`, 1), g = playOut(`r${i}`, [2, 2], 'normal', layout), b = boardFor(g);
      expect(g.layout).toBe(layout);
      expect(g.phase.k).toBe('end');
      rounds.push(g.round);
      // (each fork passed has its way; none on a fork not passed)
      for (const p of g.players) for (const f of Object.keys(p.ways).map(Number)) expect(b.forks).toContain(f);
      if (i < 3) expect(JSON.stringify(playOut(`r${i}`, [2, 2], 'normal', layout))).toBe(JSON.stringify(g));
    }
    const mean = rounds.reduce((a, b) => a + b, 0) / rounds.length;
    expect(mean).toBeGreaterThan(9);
    expect(mean).toBeLessThanOrEqual(14);
  });
  it('the letter stones are on the game\'s own board\'s ことば stones', () => {
    const g = newGame(seats, 'lt', 'normal', layoutKey('lt')), b = boardFor(g);
    for (const i of Object.keys(g.letters).map(Number)) expect(['word', 'double']).toContain(b.spaces[i].kind);
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
  it('saves: this build’s only; a generated board’s key kept, one from another generator reads as none', () => {
    const g = playOut('save');
    expect(isGame(JSON.parse(JSON.stringify(g)))).toBe(true);
    const lg = playOut('save', [2, 2], 'normal', layoutKey('save'));
    expect(isGame(JSON.parse(JSON.stringify(lg)))).toBe(true);
    expect(isGame({ ...lg, layout: '0:save' })).toBe(false);
    expect(isGame({ ...lg, layout: 7 })).toBe(false);
    expect(isGame({ ...g, players: g.players.map((p) => ({ ...p, ways: { 3: 1 } })) })).toBe(false);
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
  it('lengths: みじかい by round 7, ながい till everyone’s home (20 at most)', () => {
    for (let i = 0; i < 10; i++) {
      expect(playOut(`L${i}`, [2, 2], 'short').round).toBeLessThanOrEqual(7);
      const long = playOut(`L${i}`, [2, 2], 'long');
      expect(long.round).toBeLessThanOrEqual(20);
      expect(long.players.every((p) => p.home !== null) || long.round === 20).toBe(true);
    }
  });
  it('a save from before layouts (the classic board, a player’s `branch`) still loads, its fork’s way kept', () => {
    const g = playOut('old');
    const old = { ...JSON.parse(JSON.stringify(g)), players: g.players.map(({ ways, ...p }, i) => ({ ...p, branch: i ? null : (ways[FORK] ?? 1) })) };
    delete old.layout;
    const back = revive(old)!;
    expect(back).not.toBeNull();
    expect(boardFor(back)).toBe(CLASSIC);
    expect(back.players[0].ways).toEqual({ [FORK]: g.players[0].ways[FORK] ?? 1 });
    expect(back.players[1].ways).toEqual({});
    expect(revive({ ...old, v: 1 })).toBeNull();
  });
  it('a corrupt save reads as none', () => {
    const g = playOut('bad');
    expect(isGame({ ...g, turn: 9 })).toBe(false);
    expect(isGame({ ...g, players: g.players.map((p) => ({ ...p, level: 9 as Level })) })).toBe(false);
  });
  it('the table stays together: the one well ahead rolls low, the one well behind high; the gap at the end stays small', () => {
    const at = (posA: number, posB: number) => ({ ...newGame(seats, 'gap'), players: newGame(seats, 'gap').players.map((p, i) => ({ ...p, pos: i ? posB : posA, ways: { [FORK]: 0 } })) });
    expect(rollMode({ ...at(20, 2), turn: 0 })).toBe('slow');
    expect(rollMode({ ...at(20, 2), turn: 1 })).toBe('fast');
    expect(rollMode({ ...at(5, 3), turn: 0 })).toBe('even');
    let worst = 0, sum = 0;
    for (let i = 0; i < 60; i++) {
      const g = playOut(`spread${i}`, [2, 2]);
      const gap = Math.abs(toGoal(CLASSIC, g.players[0].pos, g.players[0].ways) - toGoal(CLASSIC, g.players[1].pos, g.players[1].ways));
      worst = Math.max(worst, gap);
      sum += gap;
    }
    expect(sum / 60).toBeLessThan(7);
    expect(worst).toBeLessThan(18);
  });
  it('letters: a letter stone walked over goes to the pocket (POCKET at most); pocket tiles add to a word', () => {
    let g = newGame(seats, 'pocket');
    g = { ...g, letters: { 1: 'z' }, players: g.players.map((p) => ({ ...p, pos: 0 })) };
    const after = spin(g);
    expect(after.players[0].pocket).toEqual(['z']);
    expect(after.letters[1]).toBeUndefined();
    const full = { ...g, players: g.players.map((p, i) => (i ? p : { ...p, pocket: ['a', 'b', 'c'] })) };
    expect(spin(full).players[0].pocket).toHaveLength(POCKET);
    const p = { rack: ['o', 'o'], pocket: ['z'], forced: null };
    expect(tilesFor(p, 'zoo')).toEqual({ rack: ['o', 'o'], pocket: ['z'], forced: false });
    expect(tilesFor(p, 'zzz')).toBeNull();
  });
  it('a sent letter: from my pocket at my turn’s start, theirs must be in their next word (+3), a swap clears it', () => {
    let g = newGame(seats, 'gift');
    g = { ...g, players: g.players.map((p, i) => (i ? { ...p, rack: ['o', 'o', 't', 'a', 'e', 'r', 's', 'n'] } : { ...p, pocket: ['z'] })) };
    g = giveLetter(g, 'z', 'B');
    expect(g.players[0].pocket).toEqual([]);
    expect(g.players[1].forced).toBe('z');
    expect(giveLetter(g, 'z', 'B')).toBe(g); // (nothing left to send)
    const turn = { ...g, turn: 1, phase: { k: 'word' as const, mult: 1, spun: 1 } };
    expect(wordScore(turn, 'toast', false)).toBeNull(); // leaves the z out
    const sc = wordScore(turn, 'zoo', false)!;
    expect(sc.forced).toBe(FORCED_BONUS);
    const played = playWord(turn, 'zoo', { everyday: false, ja: '', hinted: false });
    expect(played.players[1].forced).toBeNull();
    expect(swap(turn).players[1].forced).toBeNull();
  });
  it('かいがら: a game played (someone home, or 3 rounds) pays everyone REWARD, the team goal REWARD_GOAL more', () => {
    const g = newGame(seats, 'rw');
    expect(rewardOf(g)).toBe(0);
    expect(rewardOf({ ...g, round: 3 })).toBe(REWARD);
    const rich = { ...g, round: 3, players: g.players.map((p) => ({ ...p, stars: 999 })) };
    expect(rewardOf(rich)).toBe(REWARD + REWARD_GOAL);
    expect(rewardOf(playOut('rw-end'))).toBeGreaterThanOrEqual(REWARD);
  });
  it('a card’s move walks on and plays the stone it lands on (an イベント there as ことば), letters picked up on the way', () => {
    const moveCard = CARDS.findIndex((c) => c.move === 3);
    let g = newGame(seats, 'mv');
    const start = 1;
    const target = pathOf(CLASSIC, start, BOARD.length - 1, { [FORK]: 0 }).slice(0, 3);
    g = { ...g, letters: { [target[0]]: 'k' }, players: g.players.map((p, i) => (i ? p : { ...p, pos: start, ways: { [FORK]: 0 } })), phase: { k: 'event', card: moveCard, spun: 1 } };
    const after = eventDone(g);
    expect(after.turn).toBe(0); // still my turn: the landing plays
    expect(after.players[0].pos).toBe(target[2]);
    expect(after.players[0].pocket).toContain('k');
    expect(['word', 'sentence', 'picture', 'home', 'fork']).toContain(after.phase.k);
  });
  it('finish ends at once', () => expect(finish(newGame(seats, 'f')).phase.k).toBe('end'));
  it('RULES 5: no card only gives stars; those ask about their key word, 3 / 2 / 1 by the tries, no gift; an older game’s as before', () => {
    // (every card a quiz, a move or another roll: none a free tap)
    for (const c of CARDS) expect(!!c.kw || !!c.move || !!c.again, c.en).toBe(true);
    for (const c of CARDS.filter((x) => x.kw)) expect([keyOf(c).length > 1, notInTrimmedFont(c.kw!)]).toEqual([true, []]);
    const gift = CARDS.findIndex((c) => c.gift === 3), cat = CARDS.findIndex((c) => c.en.includes('*cat*'));
    const at = (card: number, rules?: string): Game => {
      const g = newGame(seats, 'qz', 'normal', undefined, rules);
      return { ...g, players: g.players.map((p) => ({ ...p, stars: 10 })), phase: { k: 'event', card, spun: 1 } };
    };
    for (const [m, want] of [[0, 3], [1, 2], [2, 1], [5, 1]] as const) {
      const after = eventDone(tried(at(gift, '5'), { misses: Math.min(m, 2) }), m);
      expect(after.players.map((p) => p.stars)).toEqual([10 + want, 10]);
      expect(after.made.at(-1)).toMatchObject({ kind: 'word', text: 'birthday', ja: '誕生日', stars: want });
      expect(after.phase.k).toBe('spin');
    }
    // the misses kept in the save (a resumed turn as it was); not on an older game's card
    expect(tried(at(cat, '5'), { misses: 1 }).phase).toMatchObject({ misses: 1 });
    expect(tried(at(cat, '4'), { misses: 1 })).toEqual(at(cat, '4'));
    expect(eventDone(at(gift, '4'), 2).players.map((p) => p.stars)).toEqual([13, 7]);
    expect(eventDone(at(cat), 2).players.map((p) => p.stars)).toEqual([12, 10]);
    expect([isQuiz('5', cat), isQuiz('4', cat), isQuiz('5', CARDS.findIndex((c) => c.move))]).toEqual([true, false, false]);
  });
  it('the quiz: the key word’s Japanese from 3 (やさしい) or 4, むずかしい the gap’s English from 4 of another part of speech; the same for the same seed', () => {
    for (const [card, c] of CARDS.entries()) {
      if (!c.kw) continue;
      for (const level of [1, 2, 3] as const) for (const seed of ['a:1', 'b:7', 'c:30']) {
        const q = quizOf(card, level, seed);
        expect(q).toEqual(quizOf(card, level, seed));
        expect(new Set(q.choices).size).toBe(q.choices.length);
        expect(q.choices.length).toBe(level === 1 ? 3 : 4);
        if (level < 3) expect([q.kind, q.choices[q.answer], q.en]).toEqual(['meaning', c.kw, c.qen ?? c.en]);
        else {
          expect([q.kind, q.choices[q.answer], q.en.includes('___'), q.en.includes('*')]).toEqual(['cloze', keyOf(c), true, false]);
          for (const w of q.choices) if (w !== keyOf(c)) expect(CARDS.find((x) => x.kw && keyOf(x) === w)!.pos).not.toBe(c.pos);
        }
      }
    }
    expect(QUIZ_STARS).toEqual([3, 2, 1]);
  });
  it('who goes first: drawn from the seed (every seat over the seeds), the table’s order kept round from there; pinned: the one asked', () => {
    const abc = ['A', 'B', 'G'];
    const firsts = new Set(Array.from({ length: 60 }, (_, k) => firstSeat(abc, `id${k}`)[0]));
    expect([...firsts].sort()).toEqual(abc);
    for (let k = 0; k < 20; k++) {
      const s = firstSeat(abc, `id${k}`);
      expect(s).toEqual(firstSeat(abc, `id${k}`));
      expect(`${s.join('')}${s.join('')}`).toContain('ABG');
    }
    expect([firstSeat(abc, 'x', '0'), firstSeat(abc, 'x', '2'), firstSeat(['A', 'B'], 'x', '7')]).toEqual([abc, ['G', 'A', 'B'], ['B', 'A']]);
  });
});

describe('words and sentences', () => {
  it('any real, used word is accepted (mingle, cats…), not Scrabble-only ones; the hints only from the common list', () => {
    const accept = decodeAccept(readFileSync(join(import.meta.dirname, 'accept.txt'), 'utf8'));
    const all = wordsOf(readFileSync(join(import.meta.dirname, 'words.txt'), 'utf8'), everyday, accept);
    for (const w of ['mingle', 'mingled', 'cats', 'zoo', 'box', 'jam', 'quiz']) expect(all.has(w), w).toBe(true);
    for (const w of ['xqzt', 'mingl']) expect(all.has(w), w).toBe(false);
    expect(accept.size).toBeGreaterThan(40_000);
    for (const w of ["zax", "qat", "aa", "xu"]) expect(all.has(w), w).toBe(false);
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
  it('a picture spelt, and a sentence said about it: its stars plus the sentence’s (at most 3)', () => {
    let g = newGame(seats, 'pic-said');
    g = { ...g, phase: { k: 'picture', item: 0, spun: 1, r: 0 } };
    const done = (misses: number, said?: number) => {
      const x = said === undefined ? pictureDone(g, misses) : pictureDone(g, misses, said);
      return { stars: x.players[0].stars, made: x.made.at(-1)!.stars };
    };
    expect(done(0)).toEqual({ stars: 5, made: 5 });
    expect(done(0, 2)).toEqual({ stars: 7, made: 7 });
    expect(done(1, 3)).toEqual({ stars: 6, made: 6 });
    expect(done(2, 9)).toEqual({ stars: 5, made: 5 });
    expect(done(0, -1)).toEqual({ stars: 5, made: 5 });
  });
  it('the pictures: art on disk, Japanese in the font, three spellings, the letters to spell with', () => {
    expect(PICTURES.length).toBeGreaterThanOrEqual(300);
    expect(new Set(PICTURES.map((p) => p.w)).size).toBe(PICTURES.length);
    for (const p of PICTURES) {
      expect(pictureSrc(p)).toMatch(/^https:\/\/fonts\.gstatic\.com\/s\/e\/notoemoji\/latest\/[0-9a-f_]+\/emoji\.svg$/);
      expect(p.w).toMatch(/^[a-z]{3,12}$/);
      expect(notInTrimmedFont(p.ja)).toEqual([]);
      const c = choicesFor(p, seeded(p.w));
      expect(new Set(c).size).toBe(3);
      expect(c).toContain(p.w);
      expect(lettersFor(p, 2, seeded(p.w)).sort().join('')).toBe([...p.w].sort().join(''));
      expect(lettersFor(p, 3, seeded(p.w))).toHaveLength(p.w.length + 2);
      // never there to read: the word in a row, nor at ふつう what's left once its first letter is given (egg's gg aside)
      for (let k = 0; k < 6; k++) {
        const two = lettersFor(p, 2, seeded(`${p.w}${k}`)), rest = [...two];
        rest.splice(rest.indexOf(p.w[0]), 1);
        expect(two.join('')).not.toBe(p.w);
        if (new Set(p.w.slice(1)).size > 1) expect(rest.join(''), p.w).not.toBe(p.w.slice(1));
        expect(lettersFor(p, 3, seeded(`${p.w}${k}`)).join(''), p.w).not.toContain(p.w);
      }
    }
  });
  it('the copy is in the font', () => {
    const src = readFileSync(join(import.meta.dirname, 'i18n.ts'), 'utf8');
    expect(notInTrimmedFont(src.match(/ja: '[^']*'/g)!.join(''))).toEqual([]);
    expect(s('title')).toBe('英語すごろく');
  });
});
