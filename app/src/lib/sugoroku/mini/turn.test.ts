// A みんなで！ stone's turn on the Game (turn.ts, game.ts), passed round: the landing's options, the pick dealt to the
// seats present, the plays, the close's stars and the stone played; whole games on GEN 2 boards; the save's version.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Who } from '#lib/types.ts';
import { decodeAccept, wordsOf } from '../words.ts';
import everyday from '../everyday.json';
import linesJson from '../sentences.json';
import type { Line } from '../sentences.ts';
import { PICTURES } from '../pictures.ts';
import { layoutKey } from '../family.ts';
import { boardFor, choose, eventDone, homeDone, isGame, newGame, next, pictureDone, playWord, revive, sentenceDone, spin, swap, teamStars, wordScore, type Game, type Level } from '../game.ts';
import { closeMini, miniOn, openMini, playMini } from './turn.ts';
import { sortStream, binOf } from './sort.ts';
import type { Ctx } from './types.ts';
import { OFFERED } from './offer.ts';
import { loadMiniData } from './data.ts';

const file = (f: string) => readFileSync(join(import.meta.dirname, '..', f), 'utf8');
const ctx: Ctx = { words: wordsOf(file('words.txt'), everyday, decodeAccept(file('accept.txt'))), lines: linesJson as unknown as Line[], mini: await loadMiniData() };
const seat = (who: Who, level: Level) => ({ who, name: who, level });

/** A game walked until its lander stands on a みんなで！ stone (its options up), on a GEN 2 board. */
function toMini(seed: string, levels: Level[] = [1, 2, 3]): Game {
  // (the first of the seed's games where someone lands on one: `${seed}`, `${seed}.1`...)
  for (let k = 0; ; k++) {
    const sd = k ? `${seed}.${k}` : seed;
    let g = newGame(levels.map((l, i) => seat((['A', 'B', 'G'] as const)[i], l)), sd, 'normal', layoutKey(sd, 2));
    for (let i = 0; i < 600 && g.phase.k !== 'mini' && g.phase.k !== 'end'; i++) g = step(g);
    if (g.phase.k === 'mini') return g;
  }
}
/** One step of a whole game: the rack's best word, the fork by the turn, a mini-game its plays then its close. */
function step(g: Game): Game {
  const k = g.phase.k;
  if (k === 'spin') return spin(g);
  if (k === 'fork') return choose(g, (g.turn % 2) as 0 | 1);
  if (k === 'word') {
    const w = ctx.words.from(g.players[g.turn].rack, (x) => wordScore(g, x, false)?.total ?? 0).find((x) => wordScore(g, x, false));
    return w ? playWord(g, w, { everyday: !!ctx.words.ja(w), ja: ctx.words.ja(w), hinted: false }) : swap(g);
  }
  if (k === 'sentence') return sentenceDone(g, { misses: 0, unseen: false, text: 'I like it.', ja: '好き' });
  if (k === 'picture') return pictureDone(g, 0);
  if (k === 'event') return eventDone(g);
  if (k === 'home') return homeDone(g);
  if (k === 'mini') {
    const on = miniOn(g);
    if (!on) return openMini(g, (g.n % 2) as 0 | 1, null, ctx, 1_000);
    // everyone sends a count (なかま分け) or the right plays; then the clock's close
    if (on.id === 'sort') return on.here.reduce((x, w) => playMini(x, w, { n: 5 }, ctx), g);
    if (on.id === 'market') return closeMini(playMini(g, on.here[0], { w: ctx.words.from(on.s.rack, () => 0)[0] }, ctx));
    if (on.id === 'spell') return closeMini(playMini(g, on.s.rounds[0].giver, { w: PICTURES[on.s.rounds[0].item].w }, ctx));
    return closeMini(g);
  }
  return g;
}

describe('a みんなで！ stone, passed round', () => {
  it('a landing on one: the lander’s two options; a GEN 1 board never has one', () => {
    const g = toMini('mini1');
    expect(g.phase.k).toBe('mini');
    const b = boardFor(g), me = g.players[g.turn];
    expect(b.spaces[me.pos].mini).toBe(true);
    if (g.phase.k !== 'mini') return;
    expect(g.phase.opts[0]).not.toBe(g.phase.opts[1]);
    expect(miniOn(g)).toBeNull();
    // (a GEN 1 game never stops for one)
    let old = newGame([seat('A', 2), seat('B', 2)], 'mini1', 'normal', layoutKey('mini1', 1));
    for (let i = 0; i < 800 && old.phase.k !== 'end'; i++) {
      old = step(old);
      expect(old.phase.k).not.toBe('mini');
    }
    // the save: this phase kept and read back
    expect(isGame(JSON.parse(JSON.stringify(g)))).toBe(true);
    expect(isGame({ ...g, phase: { ...g.phase, opts: ['market', 'dance'] } })).toBe(false);
  });
  it('the pick deals the seats present (the lander always); one absent at the open only watches; nothing before the pick', () => {
    const g = toMini('mini2');
    const lander = g.players[g.turn].who, other = g.players.find((p) => p.who !== lander)!.who;
    expect(playMini(g, lander, { n: 3 }, ctx)).toBe(g);
    expect(closeMini(g)).toBe(g);
    const open = openMini(g, 0, [other], ctx);
    const on = miniOn(open)!;
    expect(on.here.sort()).toEqual([lander, other].sort());
    expect(open.n).toBe(g.n + 1);
    const away = g.players.find((p) => p.who !== lander && p.who !== other)!.who;
    expect(playMini(open, away, { n: 3, w: 'cat', k: 0 }, ctx)).toBe(open);
    // the pick once: a second is nothing
    expect(openMini(open, 1, null, ctx)).toBe(open);
    // passed round: everyone, its opening time kept
    expect(miniOn(openMini(g, 1, null, ctx, 123))).toMatchObject({ here: g.players.map((p) => p.who), at: 123 });
  });
  it('the close: each seat’s stars, the stone played (a ことば from then on), the lander’s turn over; plays after it nothing', () => {
    let g = toMini('mini3');
    const pos = g.players[g.turn].pos, turn = g.turn, before = teamStars(g);
    // a sort, whichever the options (dealt so: its counts)
    g = { ...g, phase: { k: 'mini', spun: 1, opts: ['sort', 'market'] } };
    let o = openMini(g, 0, null, ctx);
    const on = miniOn(o)!;
    expect(on.id).toBe('sort');
    if (on.id !== 'sort') return;
    // each seat sorts its stream right; the first two counts in, then the clock's close (the third never sent)
    const right = (w: Who) => sortStream(on.s, w).filter((i) => binOf(on.s.pairs[w]!, i) >= 0).length;
    expect(right('A')).toBe(40);
    o = playMini(playMini(o, 'A', { n: 8 }, ctx), 'B', { n: 10 }, ctx);
    const closed = closeMini(o);
    expect(closed.players.map((p) => p.stars - g.players.find((x) => x.who === p.who)!.stars)).toEqual([4, 4, 0]);
    expect(teamStars(closed) - before).toBe(8);
    expect(closed.minis).toEqual([{ stone: pos, id: 'sort', stars: { A: 4, B: 4 } }]);
    expect([closed.turn, closed.round, closed.phase.k]).toEqual([next(o).turn, next(o).round, next(o).phase.k]);
    expect(closed.phase.k).not.toBe('mini');
    expect(playMini(closed, 'G', { n: 9 }, ctx)).toBe(closed);
    expect(closeMini(closed)).toBe(closed);
    // its game's own end closes it at once: every count in
    const all = playMini(o, 'G', { n: 12 }, ctx);
    expect([all.phase.k, all.minis?.[0].stars]).toEqual(['spin', { A: 4, B: 4, G: 4 }]);
    // the stone again: a ことば
    const from = boardFor(closed).spaces.findIndex((s) => s.next.length === 1 && s.next[0] === pos);
    const back = { ...closed, turn, phase: { k: 'spin' as const }, players: closed.players.map((p, i) => (i === turn ? { ...p, pos: from } : p)) };
    const walked = landOn(back, pos);
    expect(walked?.phase).toMatchObject({ k: 'word', mult: 1 });
    // (not played: its options)
    expect(landOn({ ...back, minis: [] }, pos)?.phase.k).toBe('mini');
  });
  it('whole games on GEN 2 boards every mini-game picked and closed, each stone once, the same game from the same seeds; saves mid-way read back', () => {
    const seen = new Set<string>();
    for (let k = 0; k < 24; k++) {
      let g = newGame([seat('A', 1), seat('B', 3), seat('G', 2)], `w${k}`, 'normal', layoutKey(`w${k}`, 2));
      let saved = 0;
      for (let i = 0; i < 900 && g.phase.k !== 'end'; i++) {
        g = step(g);
        if (g.phase.k === 'mini' && miniOn(g) && saved++ < 2) expect(revive(JSON.parse(JSON.stringify(g))), `w${k}`).toEqual(g);
      }
      expect(g.phase.k, `w${k}`).toBe('end');
      const stones = (g.minis ?? []).map((m) => m.stone);
      expect(new Set(stones).size).toBe(stones.length);
      for (const s of stones) expect(boardFor(g).spaces[s].mini).toBe(true);
      for (const m of g.minis ?? []) seen.add(m.id);
      for (const p of g.players) expect(p.stars).toBeGreaterThanOrEqual(0);
      if (k < 3) {
        let again = newGame([seat('A', 1), seat('B', 3), seat('G', 2)], `w${k}`, 'normal', layoutKey(`w${k}`, 2));
        for (let i = 0; i < 900 && again.phase.k !== 'end'; i++) again = step(again);
        expect(JSON.stringify(again)).toBe(JSON.stringify(g));
      }
    }
    expect([...seen].sort()).toEqual([...OFFERED].sort());
  });
});

describe('the save’s version', () => {
  it('a save from before mini-games (v6) reads as this build’s, the game as it was; another version none', () => {
    let g = newGame([seat('A', 2), seat('B', 2)], 'v6', 'normal', layoutKey('v6', 1));
    for (let i = 0; i < 30; i++) g = step(g);
    const v6 = JSON.parse(JSON.stringify({ ...g, v: 6 }));
    expect(revive(v6)).toEqual(g);
    expect(revive({ ...v6, v: 5 })).toBeNull();
    expect(revive({ ...v6, v: 8 })).toBeNull();
    // a classic one from before layouts (one fork's `branch`) too
    const classic = newGame([seat('A', 2), seat('B', 2)], 'old');
    const { ways: _w, ...p0 } = classic.players[0];
    expect(revive(JSON.parse(JSON.stringify({ ...classic, v: 6, players: [{ ...p0, branch: null }, classic.players[1]] })))?.players[0].ways).toEqual({});
  });
});

/** The lander walked one step onto stone `to` (the next spin's walk, its die aside): what it lands as. */
function landOn(g: Game, to: number): Game | null {
  for (let s = 0; s < 40; s++) {
    const x = spin({ ...g, n: s });
    if (x.players[g.turn].pos === to) return x;
  }
  return null;
}
