// (mini-games off in this file, mini/flag.ts mocked: the RULES '1' fold, as an older game's on this build; '2': mini/online.test)
vi.mock('./mini/flag.ts', () => ({ MINIS: false }));
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { applyMove, folder, foldMoves } from './online.ts';
import { ID_LEN, INVITE_STALE_MS, RULES, heard, invited, newGameId, otherRules, seatsCode, seatsOf, type Heard, type Move } from './wire.ts';
import { GEN, familyOf, layoutKey } from './family.ts';
import { fnv1a, seeded } from '#lib/random.ts';
import { newGame, wordScore, type Game } from './game.ts';
import { decodeAccept, wordsOf } from './words.ts';
import { parseClient } from '#lib/contract/live-protocol.ts';
import everyday from './everyday.json';
import linesJson from './sentences.json';
import type { Line } from './sentences.ts';
import type { Who } from '#lib/types.ts';

const file = (f: string) => readFileSync(join(import.meta.dirname, f), 'utf8');
const words = wordsOf(file('words.txt'), everyday);
const lines = linesJson as unknown as Line[];
const ctx = { words, lines, name: (w: Who) => w };

/** Play a game as its phones would: each turn's player makes the move its screen offers. */
function playMoves(n = 400, id = 'game01'): Move[] {
  const moves: Move[] = [{ g: id, i: 0, a: 'start', s: 'A1B3', l: 'n', r: RULES, who: 'A' }];
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

/** The rules' hash (online: the rules' version below): the content, the generator, the lists, a game folded. */
function rulesHash(moves: readonly Move[]): string {
  const g0 = newGame([{ who: 'A', name: 'A', level: 1 }, { who: 'B', name: 'B', level: 2 }], 'x', 'normal');
  const lists = [file('words.txt'), file('accept.txt'), JSON.stringify(everyday), JSON.stringify(linesJson)].map((x) => fnv1a(x));
  const { v: _v, rules: _r, ...played } = foldMoves(moves, { ...ctx, words: wordsOf(file('words.txt'), everyday, decodeAccept(file('accept.txt'))) })!;
  return fnv1a(JSON.stringify([g0.content, GEN, lists, fnv1a(JSON.stringify(played))])).toString(36);
}

/** A's moves of game01: the start, then rolls. */
const m = (i: number, o: Partial<Move> = {}): Move => ({ g: 'game01', i, a: i ? 'roll' : 'start', ...(i ? {} : { s: 'A2B2', l: 'n' as const, r: RULES }), who: 'A', ...o });
/** Hear each in turn (`me` the phone's person), as a phone would. */
const hearAll = (ms: readonly Move[], me: Who, from: Heard = { log: [], held: [] }): Heard =>
  ms.reduce((st, x) => heard(st.log, st.held, x, me) ?? st, from);

describe('online: the moves folded', () => {
  it('every phone folds the same moves to the same game, to its end', () => {
    const moves = playMoves();
    const a = foldMoves(moves, ctx), b = foldMoves(JSON.parse(JSON.stringify(moves)), ctx);
    expect(a?.phase.k).toBe('end');
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a?.made.some((m) => m.kind === 'sentence' && m.text)).toBe(true);
  });
  it('kept up (folder): a log that grows folds only its new moves, to the same game; a move taken back or another game folds again', () => {
    const moves = playMoves(), fold = folder();
    const same = (got: Game | null, ms: readonly Move[]) => expect(JSON.stringify(got), `${ms.length}`).toBe(JSON.stringify(foldMoves(ms, ctx)));
    for (let n = 1; n <= moves.length; n++) {
      const g = fold(moves.slice(0, n), ctx);
      if (n % 25 === 0 || n === moves.length) same(g, moves.slice(0, n));
    }
    // (the same log again: the game kept, nothing folded)
    expect(fold([...moves], ctx)).toBe(fold(moves, ctx));
    same(fold(moves.slice(0, 10), ctx), moves.slice(0, 10));
    same(fold(playMoves(30, 'game02'), ctx), playMoves(30, 'game02'));
    // a gap: folded up to it, then on once it fills
    same(fold([...moves.slice(0, 5), ...moves.slice(6, 9)], ctx), moves.slice(0, 5));
    same(fold(moves.slice(0, 9), ctx), moves.slice(0, 9));
  });
  it('each move fits the wire (the relay’s parser takes it as sent)', () => {
    for (const { who: _w, ...m } of playMoves()) {
      const raw = JSON.stringify({ v: 3, kind: 'sg', ...m });
      expect(parseClient(raw), raw).toEqual({ v: 3, kind: 'sg', ...m });
    }
  });
  it('a move from someone whose turn it isn’t changes nothing (終了 from anyone at the table does)', () => {
    const start: Move = { g: 'game01', i: 0, a: 'start', s: 'A2B2', l: 'n', r: RULES, who: 'A' };
    const g = foldMoves([start], ctx)!;
    expect(applyMove(g, { g: 'game01', i: 1, a: 'roll', who: 'B' }, ctx)).toBe(g);
    expect(applyMove(g, { g: 'game01', i: 1, a: 'end', who: 'G' }, ctx)).toBe(g);
    expect(applyMove(g, { g: 'game01', i: 1, a: 'end', who: 'B' }, ctx)?.phase.k).toBe('end');
    expect(applyMove(g, { g: 'game01', i: 1, a: 'roll', who: 'A' }, ctx)?.n).toBe(1);
  });
  it('moves heard out of order wait for the gap; repeats change nothing', () => {
    let st = heard([], [], m(0), 'B')!;
    st = heard(st.log, st.held, m(2), 'B')!;
    expect([st.log.map((x) => x.i), st.why]).toEqual([[0], 'gap']);
    st = heard(st.log, st.held, m(1), 'B')!;
    expect(st.log.map((x) => x.i)).toEqual([0, 1, 2]);
    expect(heard(st.log, st.held, m(1), 'B')).toBeNull();
    expect(heard(st.log, st.held, { ...m(1), who: 'B' }, 'B')).toBeNull(); // (someone else's in its place: the first stands)
  });
  it('the board: a new game’s id is its layout seed (nothing more on the wire); an older 6–8 letter id plays the classic', () => {
    const id = newGameId('', seeded('id'));
    expect(id).toMatch(/^[a-z0-9]{10}$/);
    expect(id.length).toBe(ID_LEN);
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
    const start: Move = { g: 'game01', i: 0, a: 'start', s: 'A1B2', l: 'n', r: RULES, who: 'A' };
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

describe('online: two phones racing (S1), the same game on both', () => {
  // A plays its turn: moves 0–3 heard by both; then A's roll at 4 and B's 終了 at 4 go at once
  const base = [m(0), m(1), m(2), m(3)];
  const roll4 = m(4), end4 = m(4, { a: 'end', who: 'B' });
  it('an end racing the turn’s move at the same i: the end stands on every phone, whichever came first', () => {
    const onA = hearAll([roll4, end4], 'A', hearAll(base, 'A'));
    const onB = hearAll([end4, roll4], 'B', hearAll(base, 'B'));
    expect(onA.log).toEqual(onB.log);
    expect(onA.log.at(-1)).toEqual(end4);
    expect(heard(hearAll(base, 'A').log.concat(roll4), [], end4, 'A')?.why).toBe('clash');
    expect(foldMoves(onA.log, ctx)?.phase.k).toBe('end');
    // a later end (A's own after B's) or a move after it: nothing
    expect(heard(onA.log, onA.held, m(5, { a: 'end' }), 'A')).toBeNull();
    expect(heard(onA.log, onA.held, m(5), 'A')).toBeNull();
  });
  it('an end from a phone behind (it heard two moves) beats the moves after its i, in any order; the earliest end wins', () => {
    const late = m(2, { a: 'end', who: 'B' });
    const x = hearAll([...base, roll4, late], 'A'), y = hearAll([late, ...base, roll4], 'B');
    expect(x.log).toEqual([m(0), m(1), late]);
    expect(y.log).toEqual(x.log);
    // held past a gap too
    const z = hearAll([m(0), m(3), m(2, { a: 'end', who: 'B' }), m(1)], 'G');
    expect([z.log, z.held]).toEqual([[m(0), m(1), late], []]);
    // two ends: the earlier stands
    expect(hearAll([m(0), m(1), m(2), m(2, { a: 'end', who: 'B' }), m(1, { a: 'end', who: 'G' })], 'A').log).toEqual([m(0), m(1, { a: 'end', who: 'G' })]);
  });
  it('a move of mine sent where the room had another (it refused mine): the room’s takes its place, mine after it go', () => {
    const theirs = m(4, { a: 'fork', b: 1, who: 'A' });
    const mine = [m(4, { who: 'G' }), m(5, { who: 'G' })];
    const st = heard([...base, ...mine], [], theirs, 'G')!;
    expect([st.log, st.why]).toEqual([[...base, theirs], 'clash']);
    // someone else's in place: never replaced by a third
    expect(heard(st.log, [], m(4, { who: 'B' }), 'G')).toBeNull();
  });
  it('the fold: a start on another build’s rules (or before them) folds nothing, and asks for the update', () => {
    expect(foldMoves([m(0, { r: 'zz' }), m(1)], ctx)).toBeNull();
    const { r: _r, ...old } = m(0);
    expect(foldMoves([old], ctx)).toBeNull();
    expect([otherRules([m(0, { r: 'zz' })]), otherRules([old]), otherRules([m(0)]), otherRules([])]).toEqual([true, true, false, false]);
  });
});

describe('online: the rules’ version', () => {
  // What a fold makes of the moves on this build: the content (game.ts CONTENT: the classic board, the cards, the
  // pictures), the board generator's version, the word and line lists, and a whole game played (the save's version
  // `v` and the game's `rules` label aside: a shape, not a play). A change to any fails here until RULES (wire.ts) is bumped and this pin set to the
  // new hash: a phone on the old build then asks for the update rather than folding another game. (Re-pinned
  // 2026-11-18 without `v` for the save's v7: '1' folds as it did. '2', the mini-games' rules: mini/online.test.ts.)
  const PIN: Record<string, string> = { '1': 'tgoc8' };
  it('RULES moves with what a fold makes of the moves', () => {
    const hash = rulesHash(playMoves(400, 'abcdefghij'));
    expect(hash, `bump RULES in wire.ts and pin '${hash}' to it`).toBe(PIN[RULES]);
    expect(GEN).toBe(1);
  });
  it('an old game (RULES 1) folds as it did before the save’s v7: the pin before it, `v` put back', () => {
    const g0 = newGame([{ who: 'A', name: 'A', level: 1 }, { who: 'B', name: 'B', level: 2 }], 'x', 'normal');
    const lists = [file('words.txt'), file('accept.txt'), JSON.stringify(everyday), JSON.stringify(linesJson)].map((x) => fnv1a(x));
    const { rules: _r, ...g } = foldMoves(playMoves(400, 'abcdefghij'), { ...ctx, words: wordsOf(file('words.txt'), everyday, decodeAccept(file('accept.txt'))) })!;
    const played = fnv1a(JSON.stringify({ ...g, v: 6 }));
    expect(fnv1a(JSON.stringify([6, g0.content, GEN, lists, played])).toString(36)).toBe('kbdj53');
  });
});

describe('online: the invitation', () => {
  const start: Move = { g: 'game01', i: 0, a: 'start', s: 'A2G2', l: 'n', r: RULES, who: 'A' };
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
