import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { applyMove, foldMoves, heard, seatsCode, seatsOf, type Move } from './online.ts';
import { wordScore, type Game } from './game.ts';
import { wordsOf } from './words.ts';
import { parseClient } from '#lib/contract/live-protocol.ts';
import everyday from './everyday.json';
import linesJson from './sentences.json';
import type { Line } from './sentences.ts';
import type { Who } from '#lib/types.ts';

const words = wordsOf(readFileSync(join(import.meta.dirname, 'words.txt'), 'utf8'), everyday);
const lines = linesJson as unknown as Line[];
const ctx = { words, lines, name: (w: Who) => w };

/** Play a game as its phones would: each turn's player makes the move its screen offers. */
function playMoves(n = 400): Move[] {
  const moves: Move[] = [{ g: 'game01', i: 0, a: 'start', s: 'A1B3', l: 'n', who: 'A' }];
  let g: Game | null = foldMoves(moves, ctx);
  const push = (m: Omit<Move, 'g' | 'i' | 'who'>) => {
    const who = g!.players[g!.turn].who!;
    const mv = { ...m, g: 'game01', i: moves.length, who } as Move;
    moves.push(mv);
    g = applyMove(g, mv, ctx);
  };
  for (let k = 0; k < n && g && g.phase.k !== 'end'; k++) {
    const ph: Game['phase'] = g.phase;
    if (ph.k === 'spin') push({ a: 'roll' });
    else if (ph.k === 'fork') push({ a: 'fork', b: 1 });
    else if (ph.k === 'word') {
      const w = words.from(g.players[g.turn].rack, (x) => wordScore(g!, x, false)?.total ?? 0).find((x) => wordScore(g!, x, false));
      push(w ? { a: 'word', w } : { a: 'swap' });
    } else if (ph.k === 'sentence') push({ a: 'sent', m: 1 });
    else if (ph.k === 'picture') push({ a: 'pic', m: 0 });
    else if (ph.k === 'event') push({ a: 'ev' });
    else if (ph.k === 'home') push({ a: 'home' });
  }
  return moves;
}

describe('online: the moves folded', () => {
  it('every phone folds the same moves to the same game, to its end', () => {
    const moves = playMoves();
    const a = foldMoves(moves, ctx), b = foldMoves(JSON.parse(JSON.stringify(moves)), ctx);
    expect(a?.phase.k).toBe('end');
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a?.made.some((m) => m.kind === 'sentence' && m.text)).toBe(true);
  });
  it('each move fits the wire (the relay’s parser takes it as sent)', () => {
    for (const { who: _w, ...m } of playMoves()) {
      const raw = JSON.stringify({ v: 3, kind: 'sg', ...m });
      expect(parseClient(raw), raw).toEqual({ v: 3, kind: 'sg', ...m });
    }
  });
  it('a move from someone whose turn it isn’t changes nothing (終了 from anyone at the table does)', () => {
    const start: Move = { g: 'game01', i: 0, a: 'start', s: 'A2B2', l: 'n', who: 'A' };
    const g = foldMoves([start], ctx)!;
    expect(applyMove(g, { g: 'game01', i: 1, a: 'roll', who: 'B' }, ctx)).toBe(g);
    expect(applyMove(g, { g: 'game01', i: 1, a: 'end', who: 'G' }, ctx)).toBe(g);
    expect(applyMove(g, { g: 'game01', i: 1, a: 'end', who: 'B' }, ctx)?.phase.k).toBe('end');
    expect(applyMove(g, { g: 'game01', i: 1, a: 'roll', who: 'A' }, ctx)?.n).toBe(1);
  });
  it('moves heard out of order wait for the gap; repeats are dropped', () => {
    const m = (i: number): Move => ({ g: 'game01', i, a: i ? 'roll' : 'start', ...(i ? {} : { s: 'A2B2', l: 'n' as const }), who: 'A' });
    let st = heard([], [], m(0));
    st = heard(st.log, st.held, m(2));
    expect(st.log.map((x) => x.i)).toEqual([0]);
    st = heard(st.log, st.held, m(1));
    expect(st.log.map((x) => x.i)).toEqual([0, 1, 2]);
    expect(heard(st.log, st.held, m(1)).log).toHaveLength(3);
  });
  it('seats: who and level, both ways', () => {
    expect(seatsOf('A1G3')).toEqual([{ who: 'A', level: 1 }, { who: 'G', level: 3 }]);
    expect(seatsCode(seatsOf('B2A1G3'))).toBe('B2A1G3');
  });
});
