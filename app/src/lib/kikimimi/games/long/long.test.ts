// まるごと 聞く (games/long/): the deal from the long files (a piece by its place, its questions in order, the piece's lines
// on the first), the options' round trip, the piece of the day and its recycling, the tiers' choices, the rounds' play
// and grading, and the dictation: its lines near my misses, its tiles and its row.
import { beforeAll, describe, expect, it } from 'vitest';
import { INDEX, listenOf, load, type Unit } from '../../pool.ts';
import { longDictId, type ListenPart } from '../../listen.ts';
import { DICT_MAX, LONG, dictBoard, dictFor, dictRow, dictWords, heardOf, longDeal, longOpts, longRounds, longTier, pieceFor, piecesAt, shownOf, speakersOf } from './def.ts';

// (the shipped pieces: a draft file is unvoiced, and the games show listened files only)
const FILES = Object.keys(INDEX.listen).filter((u) => INDEX.listen[u][0] === 'long' && INDEX.listen[u][2] !== 'draft');
// (ほし's: the five real pieces and five generated ones; the other places' are generated, overlaps optional at はまべ)
const parts = (): ListenPart[] => FILES.filter((u) => u.startsWith('s4-')).map((u) => listenOf(u)!);
beforeAll(() => load(...(FILES as Unit[])));

describe('まるごと 聞く: the deal', () => {
  it('ten pieces at ほし, by id; a piece its 4-5 questions in order, the gist first, the piece on the first only', () => {
    const all = piecesAt(parts());
    expect(all).toHaveLength(10);
    expect(all.map((p) => p.id)).toEqual([...all.map((p) => p.id)].sort());
    all.forEach((p, piece) => {
      const cs = longDeal(parts(), { piece });
      expect(cs.length).toBeGreaterThanOrEqual(4);
      expect(cs.length).toBeLessThanOrEqual(5);
      expect(cs.map((c) => c.id)).toEqual(cs.map((_, k) => `${p.id}-q${k + 1}`));
      expect(cs[0].long.q).toBe('gist');
      expect(cs[0].lines).toHaveLength(p.lines.length);
      expect(cs.slice(1).every((c) => !c.lines)).toBe(true);
      expect(cs.every((c) => c.quietReveal && c.long.of === p.id && c.lv === 7)).toBe(true);
    });
    // (no piece at that place: the first)
    expect(longDeal(parts(), { piece: 63 }).map((c) => c.id)).toEqual(longDeal(parts(), { piece: 0 }).map((c) => c.id));
    expect(longDeal([], { piece: 0 })).toEqual([]);
  });

  it('a real piece is played end to end with its speakers named; a generated one keeps its gaps and villagers', () => {
    for (const p of piecesAt(parts())) {
      const c = longDeal(parts(), { piece: piecesAt(parts()).indexOf(p) })[0];
      expect(c.long.real).toBe(p.source === 'real');
      if (p.source === 'real') {
        expect(c.long.credit?.licence).toBeTruthy();
        expect(c.lines!.every((l) => (l as { at?: number }).at === 0)).toBe(true);
        expect(speakersOf(p).every((s) => s.name && !s.villager)).toBe(true);
      } else {
        expect(c.long.credit).toBeUndefined();
        expect(c.lines!.some((l) => ((l as { at?: number }).at ?? 0) < 0)).toBe(true);
        expect(speakersOf(p).every((s) => s.villager && !s.name)).toBe(true);
      }
    }
  });

  it('the options round trip: a listening game’s and the piece', () => {
    const o = { lv: 7 as const, timer: 30 as const, ear: 2, piece: 4 };
    expect(longOpts.decode(longOpts.encode(o))).toEqual(o);
    expect(longOpts.decode([...longOpts.encode(o).slice(0, 3), 64])).toBeNull();
  });
});

describe('まるごと 聞く: the piece of the day', () => {
  const ids = ['a', 'b', 'c'];
  it('the first not heard; then one missed a week ago or more, the longest ago first; else the least recently heard', () => {
    expect(pieceFor(ids, new Map(), 100)).toBe(0);
    expect(pieceFor(ids, new Map([['a', { last: 99, right: 5, of: 5 }]]), 100)).toBe(1);
    const all = (b: number) => new Map([['a', { last: 90, right: 5, of: 5 }], ['b', { last: b, right: 2, of: 5 }], ['c', { last: 80, right: 5, of: 5 }]]);
    expect(pieceFor(ids, all(85), 100)).toBe(1); // b missed 15 days ago: heard again
    expect(pieceFor(ids, all(95), 100)).toBe(2); // b missed 5 days ago: not yet, c the least recent
    expect(pieceFor([], new Map(), 100)).toBe(0);
  });

  it('heard from my answers: a question row’s piece, only its last day counted', () => {
    const h = heardOf([
      { id: 'lg-x-q1', ok: false, day: 10 }, { id: 'lg-x-q2', ok: false, day: 10 },
      { id: 'lg-x-q1', ok: true, day: 20 }, { id: 'lg-x-q2', ok: false, day: 20 }, { id: 'lg-x-k3', ok: true, day: 20 }, { id: 'p1-cake', ok: true, day: 20 }
    ]);
    expect([...h]).toEqual([['lg-x', { last: 20, right: 1, of: 2 }]]);
  });
});

describe('まるごと 聞く: rounds', () => {
  it('the listening games’ tiers (ほし as やま); easy: the answer and the first wrong one; else all three', () => {
    expect([0, 1, 2, 3].map((ear) => longTier({ lv: 7, ear }))).toEqual(['easy', 'easy', 'easy', undefined]);
    expect([0, 1, 2, 3].map((ear) => longTier({ lv: 4, ear }))).toEqual(['easy', 'easy', undefined, 'hard']);
    // (はまべ picked, ほし's pieces: everyone easy; ほし picked, もり's: everyone hard)
    expect([longTier({ lv: 1, ear: 3 }, 7), longTier({ lv: 7, ear: 0 }, 4)]).toEqual(['easy', 'hard']);
    expect(shownOf({ choices: ['x', 'y', 'z'], answer: 2 }, 'easy')).toEqual([0, 2]);
    expect(shownOf({ choices: ['x', 'y', 'z'], answer: 0 }, 'easy')).toEqual([0, 1]);
    expect(shownOf({ choices: ['x', 'y', 'z'], answer: 1 }, undefined)).toEqual([0, 1, 2]);
  });

  it('the piece plays before the first question only; a shown choice is valid, the answer right', () => {
    const cs = longDeal(parts(), { piece: 0 });
    const rs = longRounds(cs, { lv: 7, ear: 3 }, () => 150_000);
    expect(rs.map((r) => r.play)).toEqual([150_000, ...cs.slice(1).map(() => 0)]);
    const w = { lead: 1000 } as Parameters<typeof LONG.timing>[2];
    expect(LONG.timing(rs[0], 30_000, w)).toMatchObject({ lead: 1000, play: 150_000 });
    expect(LONG.timing(rs[1], 30_000, w)).toMatchObject({ lead: 0, play: 0 });
    const easy = longRounds(cs, { lv: 7, ear: 0 }, () => 1)[0];
    const hidden = [0, 1, 2].find((k) => !easy.shown.includes(k))!;
    expect(LONG.valid(easy, hidden)).toBe(false);
    expect(LONG.valid(easy, easy.answer)).toBe(true);
    expect(LONG.ok(easy, easy.answer)).toBe(true);
    expect(LONG.valid(easy, 'x' as never)).toBe(false);
  });
});

describe('まるごと 聞く: the dictation', () => {
  const dict = [{ line: 3, words: 'Let me see', feature: 'lemme' }, { line: 20, words: 'turn it over', feature: 'linking' }, { line: 40, words: 'have them', feature: 'weak-form' }] as const;
  const card = (line: number, answer = 0) => ({ answer, long: { line, dict } }) as unknown as Parameters<typeof dictFor>[0][number];

  it('near my misses, each line once, at most DICT_MAX; none missed: the one nearest the last question', () => {
    const cs = [card(2), card(18), card(39), card(41)];
    expect(dictFor(cs, [1, 0, 1, 1]).map((d) => d.line)).toEqual([3, 40]);
    expect(dictFor(cs, [0, 0, 0, 0]).map((d) => d.line)).toEqual([40]);
    expect(dictFor(cs, [null, null, null, null])).toHaveLength(DICT_MAX);
    expect(dictFor([card(39), card(41)], [1, 1]).map((d) => d.line)).toEqual([40, 20]);
  });

  it('its tiles: the words and near-sound decoys (easy one, else up to three), never in order; the same for a piece and line', () => {
    for (const p of piecesAt(parts())) for (const d of p.dict) {
      const words = dictWords(d);
      for (const tier of ['easy', undefined] as const) {
        const b = dictBoard(p.id, d, tier);
        expect(dictBoard(p.id, d, tier)).toEqual(b);
        expect([...b].sort()).toEqual(expect.arrayContaining([...words].sort()));
        expect(b.length - words.length).toBeLessThanOrEqual(tier === 'easy' ? 1 : 3);
        if (words.length > 1) expect(b.filter((w) => words.includes(w)).join(' ')).not.toBe(words.join(' '));
      }
    }
  });

  it('its row: the line’s id, right when every word is, the wrong words a mask, the replays capped', () => {
    expect(dictRow('lg-x', dict[0], [true, true, true], 2)).toEqual([longDictId('lg-x', 3), 1, 0, 2]);
    expect(dictRow('lg-x', dict[0], [true, false, false], 120)).toEqual(['lg-x-k4', 0, 0b110, 99]);
  });
});
