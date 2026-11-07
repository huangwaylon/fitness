// ことば タイル (games/tile/): the deal from the tile files, the boards at each tier, the grading of a whole sentence and of
// a co-op half, the answers' bounds, the team's sentence, the row and its round trip through the files' parts, and a
// whole co-op game over two phones on the `play` wire (round/session.ts), each at their own tier.
import { beforeAll, describe, expect, it } from 'vitest';
import type { Who } from '../../../types.ts';
import { INDEX, listenOf, load, type Unit } from '../../pool.ts';
import type { ListenEntry, ListenPart } from '../../listen.ts';
import { RoundSession, WINDOWS } from '../../round/session.ts';
import { registry } from '../../round/registry.ts';
import { playIn, playOut, type PlayIn, type RoundOut } from '../../round/wire.ts';
import { EMPTY, cvOver, filesOf, listenOpts, tierAt, type ListenOpts } from '../listened.ts';
import {
  TILE_QS, boardOf, decoysFor, slotsOf, tileDeal, tileGame, tileOk, tileRecord, tileRounds, tileValid, unionOf, wrongMask, wrongWords, type TileCard
} from './def.ts';

const FILES = Object.keys(INDEX.listen).filter((u) => INDEX.listen[u][0] === 'tile');
const parts = (us: readonly string[]): ListenPart[] => us.map((u) => listenOf(u)!);
/** もり's files (as if listened). */
const MORI = ['s2-tile', 's2-tile-bank'];
beforeAll(() => load(...(FILES as Unit[])));

/** The right answer for a round's slots (`only`: those, the rest EMPTY): each slot's word's place on the board, a word
 *  twice in the sentence each its own tile. */
function answerFor(r: { tiles: readonly string[]; board: readonly string[] }, only?: readonly number[]): number[] {
  const used = new Set<number>();
  return r.tiles.map((w, j) => {
    if (only && !only.includes(j)) return EMPTY;
    const k = r.board.findIndex((b, x) => b === w && !used.has(x));
    used.add(k);
    return k;
  });
}

describe('ことば タイル: the deal', () => {
  it('deals the listened files at the lobby’s place only', () => {
    const listen: Record<string, ListenEntry> = { 's1-tile-a': ['tile', 2, 'listened'], 's2-tile': ['tile', 3, 'listened'], 's2-tile-bank': ['tile', 3, 'draft'], 's2-call-a': ['call', 3, 'listened'] };
    expect(filesOf('tile', 4, listen)).toEqual(['s2-tile']);
    expect(filesOf('tile', 3, listen)).toEqual(['s1-tile-a']);
    expect(filesOf('tile', 6, listen)).toEqual([]);
    expect(filesOf('tile', 4, INDEX.listen)).toEqual(['s2-tile', 's2-tile-bank']); // (this build: all listened)
  });

  it('is the same for a seed: 6 sentences from the files, the shortest first, another seed another deal', () => {
    const a = tileDeal(7, parts(MORI)), b = tileDeal(7, parts(MORI));
    expect(a.map((c) => c.tile.id)).toEqual(b.map((c) => c.tile.id));
    expect(a).toHaveLength(TILE_QS);
    expect(a.map((c) => c.tile.tiles.length)).toEqual([...a.map((c) => c.tile.tiles.length)].sort((x, y) => x - y));
    const deals = new Set(Array.from({ length: 10 }, (_, s) => tileDeal(s, parts(MORI)).map((c) => c.tile.id).join()));
    expect(deals.size).toBeGreaterThan(5);
    // a derived tile plays its bank item's clip, its row keyed by the tile
    const derived = parts(['s2-tile-bank'])[0].items[0] as Extract<ListenPart['items'][number], { kind: 'tile' }>;
    const [card] = tileDeal(0, [{ ...parts(['s2-tile-bank'])[0], items: [derived] }]);
    expect([card.id, card.tile.id, card.lv, card.voice]).toEqual([derived.clip, derived.id, 4, 'us']);
  });

  it('every file’s sentences fit the wire: 3-12 slots, a board of at most 16 tiles at any tier', () => {
    for (const p of parts(FILES)) for (const it of p.items) {
      if (it.kind !== 'tile') continue;
      expect(it.tiles.length).toBeGreaterThanOrEqual(3);
      expect(it.tiles.length).toBeLessThanOrEqual(12);
      for (const tier of [undefined, 'easy', 'hard'] as const) expect(boardOf(it as never, 1, tier).length).toBeLessThanOrEqual(16);
    }
  });
});

describe('ことば タイル: tiers and boards', () => {
  const t = { id: 'tile-x', tiles: ['You', "should've", 'told', 'him', 'the', 'truth'], decoys: ['them'] };
  it('easy one decoy, hard 3-4 of the sentence’s own sound swaps, never one of its words', () => {
    expect(decoysFor({ ...t, decoys: ['them', 'a'] }, 'easy')).toEqual(['them']);
    expect(decoysFor(t, undefined)).toEqual(['them']);
    const hard = decoysFor(t, 'hard');
    expect(hard.length).toBeGreaterThanOrEqual(3);
    expect(hard.length).toBeLessThanOrEqual(4);
    expect(hard[0]).toBe('them');
    expect(hard.filter((w) => t.tiles.map((x) => x.toLowerCase()).includes(w.toLowerCase()))).toEqual([]);
    expect(new Set(hard).size).toBe(hard.length);
  });

  it('a player’s tier is their ear against the deck’s place', () => {
    expect([0, 1, 2, 3].map((ear) => tierAt(ear, 4))).toEqual(['easy', 'easy', undefined, 'hard']);
    expect(tierAt(1, 3)).toBeUndefined();
  });

  it('a board is the words and decoys, the same for a seed, never the sentence in order', () => {
    for (let s = 0; s < 30; s++) {
      const b = boardOf({ ...t, tiles: ['I', 'did', 'it'] }, s, undefined);
      expect([...b].sort()).toEqual(['I', 'did', 'it', 'them'].sort());
      expect(b.filter((w) => w !== 'them').join(' ')).not.toBe('I did it');
      expect(boardOf({ ...t, tiles: ['I', 'did', 'it'] }, s, undefined)).toEqual(b);
    }
  });

  it('options carry the level, こたえる じかん and the ear', () => {
    const o: ListenOpts = { lv: 4, timer: 20, ear: 3 };
    expect(listenOpts.decode(listenOpts.encode(o))).toEqual(o);
    expect(listenOpts.decode([4])).toEqual({ lv: 4, timer: 30, ear: 1 });
    expect([listenOpts.decode([5, 0, 1]), listenOpts.decode([4, 0, 4]), listenOpts.decode([4, 9, 1])]).toEqual([null, null, null]);
  });
});

describe('ことば タイル: answers', () => {
  const r = { tiles: ['I', 'think', 'I', 'can'], board: ["can't", 'I', 'can', 'think', 'I'] };
  it('takes an index a slot (EMPTY one not filled), within the board, each tile once', () => {
    expect(tileValid(r, [1, 3, 4, 2])).toBe(true);
    expect(tileValid(r, [1, EMPTY, 4, EMPTY])).toBe(true);
    for (const bad of [2, [1, 3, 4], [1, 3, 4, 2, 0], [1, 3, 1, 2], [1, 3, 4, 5], [1, 3, 4, -1], [1, 3, 4, 2.5], [EMPTY, EMPTY, EMPTY, EMPTY], [1, 3, 4, 64]]) expect(tileValid(r, bad as never)).toBe(false);
  });

  it('grades a whole sentence right by its words (a word twice: either tile), the wrong slots as a mask', () => {
    expect(tileOk(r, [1, 3, 4, 2])).toBe(true);
    expect(tileOk(r, [4, 3, 1, 2])).toBe(true);
    expect(tileOk(r, [1, 3, 4, 0])).toBe(false);
    expect(wrongMask(r, [1, 3, 4, 0])).toBe(0b1000);
    expect(wrongMask(r, [3, 1, 4, 0])).toBe(0b1011);
    expect(wrongWords(r.tiles, 0b1011)).toEqual(['I', 'think', 'can']);
    expect(wrongWords(r.tiles, -1)).toEqual([]);
  });

  it('co-op: a half right is right (role 0 the 1st, 3rd…; role 1 the others), never a scattered part', () => {
    expect(slotsOf(5, 0)).toEqual([0, 2, 4]);
    expect(slotsOf(5, 1)).toEqual([1, 3]);
    expect(slotsOf(3, null)).toEqual([0, 1, 2]);
    expect(tileOk(r, [1, EMPTY, 4, EMPTY])).toBe(true);
    expect(tileOk(r, [EMPTY, 3, EMPTY, 2])).toBe(true);
    expect(tileOk(r, [1, 3, EMPTY, EMPTY])).toBe(false);
    expect(tileOk(r, [EMPTY, 3, EMPTY, 0])).toBe(false);
  });

  it('the team’s sentence is each slot from whoever filled it, on their own board', () => {
    const mine = { board: r.board, a: [1, EMPTY, 4, EMPTY] };
    const hers = { board: ['think', 'can', 'I', 'I'], a: [EMPTY, 0, EMPTY, 1] };
    expect(unionOf([mine, hers], 4)).toEqual(['I', 'think', 'I', 'can']);
    expect(unionOf([mine], 4)).toEqual(['I', null, 'I', null]);
  });
});

describe('ことば タイル: the row', () => {
  it('keeps each round I had (right, the wrong slots, replays) and reads back through the files’ parts', () => {
    const cards = tileDeal(3, parts(MORI)), o = { lv: 4 as const, ear: 2 };
    const rounds = tileRounds(cards, 3, o, () => 2000);
    const answers = rounds.map((r, i) => (i === 0 ? answerFor(r) : i === 1 ? answerFor(r).map((k, j) => (j === 0 ? r.board.findIndex((w) => !r.tiles.includes(w)) : k)) : i === 2 ? null : answerFor(r)));
    const had = rounds.map((_, i) => i !== 5);
    const row = tileRecord(rounds, answers, had, [0, 2, 0, 0, 0, 0], true);
    expect(row.map(([id, ok, pick, rp]) => [id, ok, pick, rp])).toEqual([
      [rounds[0].id, 1, 0, 0], [rounds[1].id, 0, 1, 2], [rounds[2].id, 0, -1, 0], [rounds[3].id, 1, 0, 0], [rounds[4].id, 1, 0, 0]
    ]);
    // left mid-way: only the answered ones
    expect(tileRecord(rounds, answers, had, [], false)).toHaveLength(4);
    // each row line's tile found in its file, its mask its wrong words
    const byId = new Map(parts(FILES).flatMap((p) => p.items).map((it) => [it.id, it]));
    for (const [id, , pick] of row) {
      const it = byId.get(id);
      expect(it?.kind).toBe('tile');
      expect(wrongWords((it as TileCard['tile']).tiles, pick)).toEqual(id === rounds[1].id ? [rounds[1].tiles[0]] : []);
    }
  });

  it('a deck’s cv is its files’', () => {
    expect(cvOver(['abc123'])).toBe('abc123');
    expect(cvOver(['abc123', 'def456'])).toMatch(/^[0-9a-f]{6}$/);
    expect(cvOver(['abc123', 'def456'])).not.toBe(cvOver(['abc123', 'def457']));
    expect([cvOver([]), cvOver(['abc123', undefined])]).toEqual([undefined, undefined]);
  });
});

// ---------- two phones ----------

const T0 = Date.UTC(2026, 10, 7, 3);
const src = { cards: (seed: number) => tileDeal(seed, parts(MORI)), playMs: () => 2000, cv: () => 'abc123' };

function pair() {
  let n = 0;
  const random = () => ((n = (n * 9301 + 49297) % 233280) / 233280);
  const make = (me: Who) => new RoundSession({ me, defs: registry([tileGame(src)]), random });
  const s = { A: make('A'), B: make('B') };
  type P = keyof typeof s;
  const deliver = (from: P, out: RoundOut[], now: number) => {
    for (const m of out) {
      const p = playOut(m);
      expect(p, `${m.op} goes out on play`).not.toBeNull();
      const to: P = from === 'A' ? 'B' : 'A';
      deliver(to, s[to].receive(playIn({ ...p!, v: 3, who: from, t: now } as PlayIn)!, now), now);
    }
  };
  s.A.presence(['B'], T0);
  s.B.presence(['A'], T0);
  return { s, act: (w: P, f: (x: RoundSession) => RoundOut[], now = T0) => deliver(w, f(s[w]), now) };
}

describe('ことば タイル: a co-op game over two phones', () => {
  it('each builds their half on their own board; the team has a sentence when both halves are right, the same on both phones', () => {
    const r = pair();
    // A (ear かわ) opens もり: easy for A; B (ear やま) joins: hard
    r.act('A', (x) => x.open({ gm: 'tile', o: listenOpts.encode({ lv: 4, timer: 30, ear: 1 }) }, T0));
    r.act('A', (x) => x.invite(T0));
    r.act('B', (x) => x.join(T0, undefined, 3));
    expect(r.s.B.view(T0)).toMatchObject({ phase: 'lobby', gm: 'tile', tiers: { A: 1, B: 3 }, o: listenOpts.encode({ lv: 4, timer: 30, ear: 3 }) });
    r.act('A', (x) => x.go(T0));
    const cards = src.cards(r.s.A.view(T0).seed);
    const ra = tileRounds(cards, r.s.A.view(T0).seed, { lv: 4, ear: 1 }, () => 2000), rb = tileRounds(cards, r.s.A.view(T0).seed, { lv: 4, ear: 3 }, () => 2000);
    expect(ra.map((x) => x.id)).toEqual(rb.map((x) => x.id));
    expect(rb[0].board.length).toBeGreaterThan(ra[0].board.length);
    let t = T0 + WINDOWS.countdown;
    for (let i = 0; i < TILE_QS; i++) {
      const at = t + WINDOWS.lead + 2000 + 10;
      const roles = r.s.A.view(at).roles;
      expect(roles).toEqual({ A: 0, B: 1 });
      const n = ra[i].tiles.length;
      // A's half always right; B's right but in round 2
      const b = answerFor(rb[i], slotsOf(n, 1));
      if (i === 2) b[1] = rb[i].board.findIndex((w, k) => w !== rb[i].tiles[1] && !b.includes(k));
      r.act('A', (x) => x.answer(answerFor(ra[i], slotsOf(n, 0)), 0, at), at);
      r.act('B', (x) => x.answer(b, i === 4 ? 1 : 0, at), at);
      expect(r.s.A.view(at).phase).toBe('reveal');
      r.act('A', (x) => x.next(at + 1), at + 1);
      t = at + 1;
    }
    const A = r.s.A.view(t + 1), B = r.s.B.view(t + 1);
    expect([A.phase, B.phase]).toEqual(['results', 'results']);
    expect(A.team).toEqual(B.team);
    expect(A.team).toMatchObject({ right: TILE_QS, all: TILE_QS - 1 });
    expect(A.scores).toEqual(B.scores);
    // each phone's row of its own half: B's round 2 wrong at its slot 1
    const rowB = tileRecord(rb, B.answers.map((a) => a?.a ?? null), B.had, [0, 0, 0, 0, 1, 0], true);
    expect(rowB.map(([, ok, pick, rp]) => [ok, pick, rp])).toEqual([[1, 0, 0], [1, 0, 0], [0, 2, 0], [1, 0, 0], [1, 0, 1], [1, 0, 0]]);
  });
});
