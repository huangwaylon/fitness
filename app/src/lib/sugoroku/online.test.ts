import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ID_LEN, INVITE_STALE_MS, applyMove, foldMoves, heard, invited, layoutOfId, newGameId, seatsCode, seatsOf, type Move } from './online.ts';
import { familyOf, layoutKey } from './layout.ts';
import { seeded } from '#lib/random.ts';
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
function playMoves(n = 400, id = 'game01'): Move[] {
  const moves: Move[] = [{ g: id, i: 0, a: 'start', s: 'A1B3', l: 'n', who: 'A' }];
  let g: Game | null = foldMoves(moves, ctx);
  const push = (m: Omit<Move, 'g' | 'i' | 'who'>) => {
    const who = g!.players[g!.turn].who!;
    const mv = { ...m, g: id, i: moves.length, who } as Move;
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
    else if (ph.k === 'picture') push({ a: 'pic', m: 0, ...(k % 2 ? { y: 2 as const } : {}) });
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
  it('the board: a new game’s id is its layout seed (nothing more on the wire); an older 6–8 letter id plays the classic', () => {
    const id = newGameId('', seeded('id'));
    expect(id).toMatch(/^[a-z0-9]{10}$/);
    expect(id.length).toBe(ID_LEN);
    expect(layoutOfId(id)).toBe(layoutKey(id));
    expect(layoutOfId('game01')).toBeUndefined();
    expect(layoutOfId('ab12cd34')).toBeUndefined();
    const moves = playMoves(400, id), a = foldMoves(moves, ctx);
    expect(a?.layout).toBe(layoutKey(id));
    expect(a?.phase.k).toBe('end');
    expect(JSON.stringify(foldMoves(JSON.parse(JSON.stringify(moves)), ctx))).toBe(JSON.stringify(a));
    expect(foldMoves(playMoves(5), ctx)?.layout).toBeUndefined();
    const { who: _w, ...start } = moves[0];
    expect(parseClient(JSON.stringify({ v: 3, kind: 'sg', ...start }))).toEqual({ v: 3, kind: 'sg', ...start });
    // the next game's board another family
    for (let k = 0; k < 10; k++) expect(familyOf(newGameId(id, seeded(`n${k}`)))).not.toBe(familyOf(id));
  });
  it('a 絵 with a spoken sentence: its stars (`y`) on every phone, the words never on the wire', () => {
    const start: Move = { g: 'game01', i: 0, a: 'start', s: 'A1B2', l: 'n', who: 'A' };
    const g0 = foldMoves([start], ctx)!;
    const g = { ...g0, phase: { k: 'picture' as const, item: 0, spun: 1, r: 0 } };
    const pic = (y?: 1 | 2 | 3) => applyMove(g, { g: 'game01', i: 1, a: 'pic', m: 1, ...(y ? { y } : {}), who: 'A' }, ctx)!;
    expect(pic().players[0].stars).toBe(3);
    expect(pic(2).players[0].stars).toBe(5);
    expect(pic(3).made.at(-1)?.stars).toBe(6);
  });
  it('seats: who and level, both ways', () => {
    expect(seatsOf('A1G3')).toEqual([{ who: 'A', level: 1 }, { who: 'G', level: 3 }]);
    expect(seatsCode(seatsOf('B2A1G3'))).toBe('B2A1G3');
  });
});

describe('online: the invitation', () => {
  const start: Move = { g: 'game01', i: 0, a: 'start', s: 'A2G2', l: 'n', who: 'A' };
  const base = { log: [start], me: 'G' as Who | null, at: 1_000_000, now: 1_000_000 + 60_000, answered: [] as string[], over: false };
  it('a game someone else started with me seated, fresh: invited (the guest too)', () => {
    expect(invited(base)).toBe(true);
    expect(invited({ ...base, now: base.at + INVITE_STALE_MS })).toBe(true);
  });
  it('not my own start, not a phone not seated or with no one on it', () => {
    expect(invited({ ...base, me: 'A' })).toBe(false);
    expect(invited({ ...base, me: 'B' })).toBe(false);
    expect(invited({ ...base, me: null })).toBe(false);
  });
  it('not a game answered here (参加 or ✕), not one over, not one gone stale', () => {
    expect(invited({ ...base, answered: ['x', 'game01'] })).toBe(false);
    expect(invited({ ...base, over: true })).toBe(false);
    expect(invited({ ...base, log: [start, { g: 'game01', i: 1, a: 'end', who: 'G' }] })).toBe(false);
    expect(invited({ ...base, now: base.at + INVITE_STALE_MS + 1 })).toBe(false);
  });
  it('nothing held, or moves without their start: none', () => {
    expect(invited({ ...base, log: [] })).toBe(false);
    expect(invited({ ...base, log: [{ g: 'game01', i: 0, a: 'roll', who: 'A' }] })).toBe(false);
  });
});
