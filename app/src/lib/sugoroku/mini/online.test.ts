// Mini-games online (docs/sugoroku.md "みんなで！", "Online"): the
// rules' version, a whole game's moves folded, and phones racing through a room (the relay's rule: the first of each
// `i`) in any order of delivery, a race lost sent again at the next slot (wire.ts Outbox), a close racing the plays, an
// end racing a mini-game, a phone dropping and coming back: every phone the room's log and the same game.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fnv1a, seeded } from '#lib/random.ts';
import type { Who } from '#lib/types.ts';
import { parseClient } from '#lib/contract/live-protocol.ts';
import { decodeAccept, wordsOf } from '../words.ts';
import everyday from '../everyday.json';
import linesJson from '../sentences.json';
import type { Line } from '../sentences.ts';
import { PICTURES } from '../pictures.ts';
import { GEN, layoutKey } from '../family.ts';
import { newGame, wordScore, type Game } from '../game.ts';
import { applyMove, foldMoves } from '../online.ts';
import { OUTBOX, RULES, answered, beaten, heard, miniOpenedAt, otherRules, playsRules, queued, sameMove, toSend, type Move, type Outbox } from '../wire.ts';
import { miniOn } from './turn.ts';
import { MINIS, MINI_IDS, type MiniId } from './registry.ts';
import { forceMini } from './offer.ts';
import { chainCheck, chainTurn, letterOf } from './chain.ts';
import { requestCode, rightSlots } from './shopping.ts';
import { loadMiniData } from './data.ts';

// (a table for a later wave's game: every landing offers it, this file's switch, so one is found at the first stone)
const hook = vi.hoisted(() => ({ force: null as MiniId | null }));
vi.mock('./offer.ts', async (load) => {
  const o = await load<typeof import('./offer.ts')>();
  return { ...o, offer: (played: MiniId[], r: () => number): [MiniId, MiniId] => (hook.force ? [hook.force, hook.force] : o.offer(played, r)) };
});
afterEach(() => void ((hook.force = null), forceMini(null)));

const file = (f: string) => readFileSync(join(import.meta.dirname, '..', f), 'utf8');
const words = wordsOf(file('words.txt'), everyday, decodeAccept(file('accept.txt')));
const ctx = { words, lines: linesJson as unknown as Line[], mini: await loadMiniData(), name: (w: Who) => w };
const G = 'minigame01';
type Body = Omit<Move, 'g' | 'i' | 'who'>;

/** A mini-game's plays a seat would make (right ones mostly), for the game as it is. */
function playsOf(g: Game, who: Who, r: () => number): Body[] {
  const on = miniOn(g);
  if (!on || !on.here.includes(who)) return [];
  switch (on.id) {
    case 'market': {
      const ws = words.from(on.s.rack, () => 0).filter((w) => w.length >= 4);
      return Array.from({ length: 4 }, () => ({ a: 'mp', w: ws[Math.floor(r() * Math.min(12, ws.length))] }));
    }
    case 'sort':
    case 'numbers':
      return [{ a: 'mp', n: Math.floor(r() * 12) }];
    case 'spell': {
      const out: Body[] = [];
      for (const round of on.s.rounds) {
        if (round.giver === who) out.push({ a: 'mp', w: PICTURES[round.item].w });
        else out.push({ a: 'mp', k: Math.floor(r() * (round.grids[who]?.length ?? 4)) });
      }
      return out;
    }
    case 'together': {
      const line = on.s.lines[on.s.l];
      return line ? line.owner.map((o, k) => (o === who ? k : -1)).filter((k) => k >= 0).map((k) => ({ a: 'mp', k })) : [];
    }
    case 'reply': {
      // (each replier's cards in order, the fitting one somewhere; anyone: the timer's next)
      const s = on.s, round = s.rounds[s.r];
      return round ? [...(round.hands[who] ?? []).map((_, k): Body => ({ a: 'mp', k })), { a: 'mp', op: 'next', k: s.stage % 64 }] : [];
    }
    case 'shopping': {
      // (the お客さん: a request, right; the shop: the list's things in, a pay; anyone: the timers' next)
      const s = on.s, round = s.rounds[s.r];
      if (!round) return [];
      const out: Body[] = [{ a: 'mp', op: 'next', k: s.stage % 64 }];
      if (who === round.asker) out.unshift({ a: 'mp', op: requestCode(1, rightSlots(round)) });
      if (who !== round.asker || s.seats.length === 1) for (const l of round.lines) for (let n = 0; n < l.n; n++) out.unshift({ a: 'mp', k: round.shelf.indexOf(PICTURES.findIndex((p) => p.w === l.w)) });
      if (who !== round.asker) out.push({ a: 'mp', op: 'pay' });
      return out;
    }
    case 'chain': {
      // (whose turn: a word; anyone: the timers' skips for the next stages, a pass)
      const s = on.s, w = chainTurn(s) === who ? words.starting!(letterOf(s)).find((x) => !chainCheck(s, who, x, ctx)) : undefined;
      const out: Body[] = w ? [{ a: 'mp', w }] : [];
      return [...out, { a: 'mp', op: 'next', k: s.stage % 64 }, { a: 'mp', op: 'pass' }, { a: 'mp', op: 'next', k: (s.stage + 1) % 64 }];
    }
  }
}

/** A whole online game as its phones would play it: the turn's moves from whose turn it is; a mini-game picked by
 *  the lander, every seat's plays in turn, then a close. */
function playMoves(id = G, n = 900): Move[] {
  const moves: Move[] = [{ g: id, i: 0, a: 'start', s: 'A1B2G3', l: 'n', r: RULES, who: 'A' }];
  let g: Game | null = foldMoves(moves, ctx);
  const push = (m: Body, who: Who = g!.players[g!.turn].who) => {
    const mv = { ...m, g: id, i: moves.length, who } as Move;
    moves.push(mv);
    g = applyMove(g, mv, ctx);
  };
  const r = seeded(id);
  for (let k = 0; k < n && g && g.phase.k !== 'end'; k++) {
    const ph: Game['phase'] = g.phase;
    if (ph.k === 'spin') push({ a: 'roll' });
    else if (ph.k === 'fork') push({ a: 'fork', b: 1 });
    else if (ph.k === 'word') {
      const w = words.from(g.players[g.turn].rack, (x) => wordScore(g!, x, false)?.total ?? 0).find((x) => wordScore(g!, x, false));
      push(w ? { a: 'word', w } : { a: 'swap' });
    } else if (ph.k === 'sentence') push({ a: 'sent', m: 1 });
    else if (ph.k === 'picture') push({ a: 'pic', m: 0 });
    else if (ph.k === 'event') {
      // (the quiz: a miss kept, then the card with its misses)
      if (k % 3) push({ a: 'try', m: 1 });
      push({ a: 'ev', ...(k % 3 ? { m: k % 3 } : {}) });
    } else if (ph.k === 'home') push({ a: 'home' });
    else if (ph.k === 'mini' && !ph.on) push({ a: 'mg', b: (k % 2) as 0 | 1, s: k % 3 ? 'ABG' : 'AB' });
    else if (ph.k === 'mini') {
      for (const who of ['A', 'B', 'G'] as const) for (const p of playsOf(g, who, r)) if (g.phase.k === 'mini') push(p, who);
      if (g.phase.k === 'mini') push({ a: 'mc' }, 'G');
    }
  }
  return moves;
}

describe('online: the rules', () => {
  it('new games carry RULES 6 (GEN 2 boards: the id the layout seed); this build folds only those (an older start asks for the update)', () => {
    expect([RULES, GEN]).toEqual(['6', 2]);
    expect(['1', '2', '3', '4', '5', '6', '7', undefined].map(playsRules)).toEqual([false, false, false, false, false, true, false, false]);
    const start = (r: string, g = 'abcdefghij') => ({ g, i: 0, a: 'start', s: 'A2B2', l: 'n', r, who: 'A' }) as Move;
    expect(foldMoves([start('6')], ctx)).toMatchObject({ layout: layoutKey('abcdefghij'), rules: '6' });
    for (const r of ['1', '5', '7']) expect([otherRules([start(r)]), foldMoves([start(r)], ctx)]).toEqual([true, null]);
    expect(otherRules([start('6')])).toBe(false);
    // (an id from before layouts, 6–8 letters: none)
    expect(foldMoves([start('5', 'game01')], ctx)).toBeNull();
  });
  it('a whole game: mini-games picked, played from every seat, closed; the same on every phone; every move fits the wire', () => {
    const moves = playMoves();
    const a = foldMoves(moves, ctx), b = foldMoves(JSON.parse(JSON.stringify(moves)), ctx);
    expect(a?.phase.k).toBe('end');
    expect(a?.minis?.length).toBeGreaterThan(0);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    for (const { who: _w, ...m } of moves) {
      const raw = JSON.stringify({ v: 3, kind: 'sg', ...m });
      expect(parseClient(raw), raw).toEqual({ v: 3, kind: 'sg', ...m });
      expect(raw.length).toBeLessThan(256);
    }
    expect(moves.some((m) => m.a === 'mp' && m.who !== moves[m.i - 1]?.who)).toBe(true);
  });
  it('a mini-game’s moves from someone not at the table, the pick from someone whose turn it isn’t: nothing', () => {
    const moves = playMoves();
    const at = moves.findIndex((m) => m.a === 'mg');
    const before = foldMoves(moves.slice(0, at), ctx)!;
    const lander = before.players[before.turn].who, other = before.players.find((p) => p.who !== lander)!.who;
    expect(applyMove(before, { ...moves[at], who: other }, ctx)).toBe(before);
    const open = applyMove(before, moves[at], ctx)!;
    // (game01's table is A B G: someone else's phone, never)
    const two = foldMoves([{ g: 'abcdefghij', i: 0, a: 'start', s: 'A2B2', l: 'n', r: RULES, who: 'A' }], ctx)!;
    expect(applyMove({ ...two, phase: open.phase }, { g: 'abcdefghij', i: 1, a: 'mp', n: 3, who: 'G' }, ctx)).toMatchObject({ phase: open.phase });
    expect(applyMove({ ...two, phase: open.phase }, { g: 'abcdefghij', i: 1, a: 'mc', who: 'G' }, ctx)?.phase).toBe(open.phase);
  });
  it('the mini-game’s clock from its pick’s stamp (the room’s `t`), never in the fold or what makes two moves the same', () => {
    const log: Move[] = [{ g: G, i: 0, a: 'start', s: 'A2B2', l: 'n', r: RULES, who: 'A', t: 1 }, { g: G, i: 1, a: 'mg', b: 0, who: 'A', t: 5000 }, { g: G, i: 2, a: 'mp', n: 1, who: 'B', t: 6000 }];
    expect(miniOpenedAt(log)).toBe(5000);
    expect(sameMove(log[1], { ...log[1], t: 9 })).toBe(true);
    expect(JSON.stringify(foldMoves(log, ctx))).toBe(JSON.stringify(foldMoves(log.map(({ t: _t, ...m }) => m), ctx)));
  });
  // (what a fold makes of the moves, over five games playing all eight mini-games, `v`, the game's `rules` label and
  // the results' `lastMini` aside; a deal copies its exchange's text into the state, so an edit to data/*.json that a pinned game deals
  // re-pins without a RULES bump. Re-pinned 2026-11-20 without a RULES bump, twice: the save's CONTENT lost the classic
  // board, then the cards' unread stars / gift; the fold otherwise the same: '10radj7' with the old CONTENT put back)
  const PIN: Record<string, readonly [string, string]> = { '6': ['436jlh', 'minigame00 minigame08 minigame21 minigame28 minigame35'] };
  const hashOf = (ids: string) => {
    const g0 = newGame([{ who: 'A', name: 'A', level: 1 }, { who: 'B', name: 'B', level: 2 }], 'x', 'normal');
    const lists = [file('words.txt'), file('accept.txt'), JSON.stringify(everyday), JSON.stringify(linesJson)].map((x) => fnv1a(x));
    const played = ids.split(' ').map((id) => {
      const { v: _v, rules: _r, lastMini: _l, ...g } = foldMoves(playMoves(id), ctx)!;
      return fnv1a(JSON.stringify(g));
    });
    return fnv1a(JSON.stringify([g0.content, GEN, lists, played.length > 1 ? played : played[0]])).toString(36);
  };
  it('RULES moves with what a fold makes of the moves', () => {
    const hash = hashOf(PIN[RULES][1]);
    expect(hash, `bump RULES in wire.ts and pin '${hash}' to it`).toBe(PIN[RULES][0]);
    expect(new Set(PIN[RULES][1].split(' ').flatMap((id) => foldMoves(playMoves(id), ctx)!.minis!.map((m) => m.id)))).toEqual(new Set(MINI_IDS));
  });
});

describe('every mini-game plays to its end', () => {
  // (2026-11-19: なかま分け online, a game's second mini-game, closed as it opened with nothing played: the sheet's
  // clock, mini/clock.ts openedAt. Here every game, first and second in a game, passed round and online, 2 and 3 seats:
  // dealt, each seat's plays counted, closed with stars)
  /** A game to its `nth` mini-game (each landing offers `id`), picked; `local` passed round (no seats sent). */
  function upTo(id: MiniId, seats: string, nth: number, local: boolean, gid: string): { moves: Move[]; g: Game } {
    // (the first two landings, whatever stone: offer.ts's test hook)
    forceMini(`${id},${id}`);
    const moves: Move[] = [{ g: gid, i: 0, a: 'start', s: seats, l: 'l', r: RULES, who: seats[0] as Who }];
    let g = foldMoves(moves, ctx)!;
    const push = (m: Body, who: Who = g.players[g.turn].who) => {
      const mv = { ...m, g: gid, i: moves.length, who } as Move;
      expect(parseClient(JSON.stringify({ v: 3, kind: 'sg', ...m, g: gid, i: mv.i })), JSON.stringify(m)).not.toBeNull();
      moves.push(mv);
      g = applyMove(g, mv, ctx)!;
    };
    for (let k = 0; k < 900 && g.phase.k !== 'end'; k++) {
      const ph: Game['phase'] = g.phase;
      if (ph.k === 'mini' && !ph.on && (g.minis?.length ?? 0) === nth) {
        push(local ? { a: 'mg', b: 0 } : { a: 'mg', b: 0, s: seats.replace(/\d/g, '') });
        return { moves, g };
      }
      if (ph.k === 'spin') push({ a: 'roll' });
      else if (ph.k === 'fork') push({ a: 'fork', b: 0 });
      else if (ph.k === 'word') push({ a: 'swap' });
      else if (ph.k === 'sentence') push({ a: 'sent', m: 2 });
      else if (ph.k === 'picture') push({ a: 'pic', m: 2 });
      else if (ph.k === 'event') push({ a: 'ev' });
      else if (ph.k === 'home') push({ a: 'home' });
      else if (ph.k === 'mini' && !ph.on) push({ a: 'mg', b: 0 });
      else if (ph.k === 'mini') push({ a: 'mc' });
    }
    throw new Error(`no mini-game ${nth} in ${gid}`);
  }
  for (const id of MINI_IDS) for (const seats of ['A2B2', 'A1B2G3']) for (const local of [true, false]) {
    it(`${id}: ${seats.length / 2} seats ${local ? 'passed round' : 'online'}, first and second in a game`, () => {
      for (const nth of [0, 1]) {
        const { moves, g: open } = upTo(id, seats, nth, local, `playable${nth}${seats.length}`);
        const on = miniOn(open)!;
        expect([on.id, on.here.join('')]).toEqual([id, seats.replace(/\d/g, '')]);
        let g = open;
        const counted = new Set<Who>(), r = seeded(`${id}${seats}${nth}`);
        const play = (p: Body, who: Who): boolean => {
          if (g.phase.k !== 'mini') return false;
          const mv = { ...p, g: moves[0].g, i: moves.length, who } as Move, next = applyMove(g, mv, ctx)!;
          moves.push(mv);
          const took = next !== g;
          g = next;
          return took;
        };
        // every seat's plays (the seats in turn, the order turning), a timer's `next` only when none took; till the game
        // ends itself or the clock would: then the close
        for (let round = 0; round < 24 && g.phase.k === 'mini'; round++) {
          let took = false;
          const order = round % 2 ? [...on.here].reverse() : on.here;
          // (おつかい's hand-over last: every shop seat's basket in first)
          const plays = order.map((who) => [who, playsOf(g, who, r).filter((x) => x.op !== 'next' && x.op !== 'pass')] as const);
          for (const [who, ps] of plays) for (const p of ps) if (p.op !== 'pay' && play(p, who)) (took = true), counted.add(who);
          for (const [who, ps] of plays) for (const p of ps) if (p.op === 'pay' && play(p, who)) (took = true), counted.add(who);
          if (!took) for (const p of playsOf(g, on.here[0], r).filter((x) => x.op === 'next').slice(0, 1)) play(p, on.here[0]);
        }
        if (g.phase.k === 'mini') g = applyMove(g, { a: 'mc', g: moves[0].g, i: moves.length, who: 'A' }, ctx)!;
        expect([...counted].sort(), `${id} ${nth}: every seat played`).toEqual([...on.here].sort());
        expect(g.minis?.length).toBe(nth + 1);
        expect(Object.values(g.minis!.at(-1)!.stars).reduce((a, b) => a + (b ?? 0), 0), `${id} ${nth}: stars`).toBeGreaterThan(0);
        // (every phone folds the same)
        expect(JSON.stringify(foldMoves(JSON.parse(JSON.stringify(moves)), ctx))).toBe(JSON.stringify(foldMoves(moves, ctx)));
      }
    });
  }
});

// ---- phones and a room ----

/** The room (relay/src/room.ts sgTakes): a game's moves in order, the first of each `i`, an end at most at the next,
 *  nothing at or past its end, nothing from someone not seated; each taken move to the other phones, an ack to its sender. */
let refusals = 0;
class Room {
  moves: Move[] = [];
  end: Move | null = null;
  constructor(private readonly phones: Phone[]) {}
  take(m: Move): boolean {
    if (m.a === 'start') return false;
    if (m.i < 1 || (this.end && m.i >= this.end.i) || !(this.moves[0]?.s ?? '').includes(m.who)) return false;
    if (m.a === 'end' ? m.i > this.moves.length : m.i !== this.moves.length) return false;
    if (m.a === 'end') this.end = m;
    else this.moves.push(m);
    return true;
  }
  hear(from: Phone, m: Move): void {
    const ok = this.take(m);
    if (ok) for (const p of this.phones) if (p !== from) p.down.push({ k: 'move', m });
    from.down.push({ k: 'ack', m, ok });
    if (!ok) refusals++;
  }
  /** What a phone that opens now hears: the moves to the end, and the end. */
  log(): Move[] {
    return this.end ? [...this.moves.slice(0, this.end.i), this.end] : [...this.moves];
  }
}

/** A phone (online.svelte.ts's sync, the pure parts): its log and held moves, its outbox of mini-game moves, its links. */
class Phone {
  log: Move[] = [];
  held: Move[] = [];
  outbox: Outbox = OUTBOX;
  up: Move[] = [];
  down: ({ k: 'move'; m: Move } | { k: 'ack'; m: Move; ok: boolean })[] = [];
  /** The mini-game moves it made, in order. */
  made: Body[] = [];
  constructor(readonly me: Who, readonly g: string) {}
  /** A mini-game move: queued, sent when it may. */
  play(m: Body): void {
    this.made.push(m);
    this.outbox = queued(this.outbox, m);
    this.pump();
  }
  /** A turn's move (an end): at the log's end at once, as today. */
  now(m: Body): void {
    this.put({ ...m, g: this.g, i: this.log.length, who: this.me } as Move);
  }
  put(m: Move): void {
    const h = heard(this.log, [], m, this.me);
    if (!h) return;
    this.log = h.log;
    this.up.push(m);
  }
  pump(): void {
    const x = toSend(this.outbox, this.log, this.held);
    if (!x) return;
    this.outbox = x.o;
    this.put({ ...x.o.q[0].m, g: this.g, i: x.i, who: this.me } as Move);
  }
  hearOne(e: Phone['down'][number]): void {
    if (e.k === 'move') {
      if (e.m.who !== this.me && this.outbox.q[0]?.at === e.m.i) this.outbox = beaten(this.outbox, e.m.i);
      const h = heard(this.log, this.held, e.m, this.me);
      if (h) (this.log = h.log), (this.held = h.held);
    } else {
      // (refused: out of my log if it's still there, as online.svelte.ts unsend)
      if (!e.ok && this.log[e.m.i] && sameMove(this.log[e.m.i], e.m)) this.log = this.log.slice(0, e.m.i);
      if (e.m.a === 'mp' || e.m.a === 'mc') this.outbox = answered(this.outbox, e.m.i, e.ok);
    }
    this.pump();
  }
}

/** A table at a mini-game's open (its log so far the same on every phone and in the room), the room: the first game
 *  from `seed` with a pick of `id` (a game's first pick is a ★ one: the others at a later stone; none given: the first).
 *  One not a first pick: every landing offers it (`hook`, till the test's end: the phones fold the same). */
const opens = new Map<string, { id: MiniId; base: Move[] }[]>();
function table(seed: string, id?: MiniId): { phones: Phone[]; room: Room; at: number } {
  hook.force = id && !MINIS[id].star ? id : null;
  for (let k = 0; k < 200; k++) {
    const gid = `${seed}x${k}`.padEnd(10, '0').slice(0, 12);
    const picks = opens.get(`${gid}${hook.force}`) ?? opens.set(`${gid}${hook.force}`, ((all) => {
      // (folded once along the log: each pick's game as it opens)
      let g: Game | null = null;
      return all.flatMap((m, i) => {
        g = i === 0 ? foldMoves([m], ctx) : applyMove(g, m, ctx);
        return m.a === 'mg' ? [{ id: miniOn(g!)!.id, base: all.slice(0, i + 1) }] : [];
      });
    })(playMoves(gid))).get(`${gid}${hook.force}`)!;
    const hit = picks.find((p) => !id || p.id === id);
    if (!hit) continue;
    const base = hit.base, at = base.length - 1;
    const phones = (['A', 'B', 'G'] as const).map((w) => Object.assign(new Phone(w, gid), { log: [...base] }));
    const room = new Room(phones);
    room.moves = [...base];
    return { phones, room, at };
  }
  throw new Error(`no game picks ${id}`);
}
const MINI_GAMES = MINI_IDS;

/** The network: each step one link (a phone's up or down, in order) delivers its next; `r` picks which. */
function settle(phones: Phone[], room: Room, r: () => number, steps = 20_000, between?: (k: number) => void): void {
  for (let k = 0; k < steps; k++) {
    between?.(k);
    const links = phones.flatMap((p) => [...(p.up.length ? [() => room.hear(p, p.up.shift()!)] : []), ...(p.down.length ? [() => p.hearOne(p.down.shift()!)] : [])]);
    if (!links.length) return;
    links[Math.floor(r() * links.length)]();
  }
  throw new Error('the network never settled');
}

describe('online mini-games: phones racing through the room', () => {
  it('any order of delivery: every phone ends with the room’s log and the same game; every play in it once, in its order', () => {
    for (let k = 0; k < 60; k++) {
      const { phones, room, at } = table(`r${k % 5}`, MINI_GAMES[k % MINI_GAMES.length]);
      const g0 = foldMoves(room.moves, ctx)!;
      const r = seeded(`race${k}`);
      const plays = new Map(phones.map((p) => [p.me, playsOf(g0, p.me, r)]));
      // every phone's plays, at once or as the network goes; then each its close
      for (const p of phones) for (const m of plays.get(p.me)!.slice(0, 1)) p.play(m);
      settle(phones, room, r, 20_000, (n) => {
        if (n % 3) return;
        const p = phones[Math.floor(r() * 3)], left = plays.get(p.me)!;
        if (left.length > 1) p.play(left.splice(1, 1)[0]);
        else if (left.length === 1 && r() < 0.2) (left.pop(), p.play({ a: 'mc' }));
      });
      for (const p of phones) expect(p.log, `${k} ${p.me}`).toEqual(room.log());
      const games = phones.map((p) => JSON.stringify(foldMoves(p.log, ctx)));
      expect(new Set(games).size, `${k}`).toBe(1);
      // each phone's moves in the room's log once each, in the order made (a race lost, sent again: never twice)
      for (const p of phones) {
        const mine = room.moves.slice(at + 1).filter((m) => m.who === p.me).map(({ g: _g, i: _i, who: _w, t: _t, ...m }) => m);
        expect(mine, `${k} ${p.me}`).toEqual(p.made);
        expect(p.outbox.q, `${k} ${p.me}`).toEqual([]);
      }
    }
    // (the races were run: hundreds of moves refused and sent again)
    expect(refusals).toBeGreaterThan(100);
  });
  it('a race lost: sent again at the next slot (heard first or refused first), never two of mine in flight', () => {
    const { phones: [a, b], room } = table('s', 'sort');
    const n = room.moves.length;
    a.play({ a: 'mp', n: 3 });
    a.play({ a: 'mp', n: 4 });
    b.play({ a: 'mp', n: 5 });
    expect([a.up.length, b.up.length]).toEqual([1, 1]);
    // B's reaches the room first: A's refused
    room.hear(b, b.up.shift()!);
    room.hear(a, a.up.shift()!);
    expect(room.moves.length).toBe(n + 1);
    // A hears B's (the winner) before its refusal: sent again at once, at n + 1
    a.hearOne(a.down.shift()!);
    expect(a.up.map((m) => [m.i, m.n])).toEqual([[n + 1, 3]]);
    a.hearOne(a.down.shift()!); // (the old refusal: nothing more)
    expect(a.up).toHaveLength(1);
    room.hear(a, a.up.shift()!);
    a.hearOne(a.down.shift()!); // taken: the next goes
    expect(a.up.map((m) => [m.i, m.n])).toEqual([[n + 2, 4]]);
    // refused before the winner is heard: it waits for the winner, then goes
    const { phones: [c, d], room: room2 } = table('t', 'sort');
    const n2 = room2.moves.length;
    d.play({ a: 'mp', n: 1 });
    c.play({ a: 'mp', n: 2 });
    room2.hear(d, d.up.shift()!);
    room2.hear(c, c.up.shift()!);
    const [win, refusal] = c.down.splice(0);
    c.hearOne(refusal);
    expect([c.up.length, c.log.length]).toEqual([0, n2]);
    c.hearOne(win);
    expect(c.up.map((m) => [m.i, m.n])).toEqual([[n2 + 1, 2]]);
  });
  it('the close racing the plays: the first close stands everywhere, plays after it count for nothing, a second close nothing', () => {
    for (let k = 0; k < 30; k++) {
      const { phones, room, at } = table(`c${k % 5}`, MINI_GAMES[k % MINI_GAMES.length]);
      const r = seeded(`close${k}`);
      const g0 = foldMoves(room.moves, ctx)!;
      for (const p of phones) for (const m of playsOf(g0, p.me, r)) p.play(m);
      phones[k % 3].play({ a: 'mc' });
      phones[(k + 1) % 3].play({ a: 'mc' });
      settle(phones, room, r);
      const log = room.log(), close = log.findIndex((m, i) => i > at && m.a === 'mc');
      const g = foldMoves(log, ctx)!, closedAt = foldMoves(log.slice(0, close + 1), ctx)!;
      // (it closed by the first mc, or before it by the game's own end: either way the same from there)
      expect(g.minis, `${k}`).toEqual(closedAt.minis);
      expect(g.players.map((p) => p.stars)).toEqual(closedAt.players.map((p) => p.stars));
      for (const p of phones) expect(JSON.stringify(foldMoves(p.log, ctx))).toBe(JSON.stringify(g));
    }
  });
  it('an end racing a mini-game: the end stands at its place on every phone, the plays after it nothing', () => {
    const { phones: [a, b, c], room } = table('e', 'market');
    const r = seeded('end');
    const g0 = foldMoves(room.moves, ctx)!;
    for (const m of playsOf(g0, 'A', r)) a.play(m);
    c.now({ a: 'end' });
    for (const m of playsOf(g0, 'B', r)) b.play(m);
    settle([a, b, c], room, r);
    expect(room.end).not.toBeNull();
    for (const p of [a, b, c]) {
      expect(p.log).toEqual(room.log());
      expect(foldMoves(p.log, ctx)?.phase.k).toBe('end');
      expect(p.up).toEqual([]);
    }
  });
  it('a phone dropping mid-game: the others play on and close it; back after the close, it folds the same game, its plays sent before the drop standing', () => {
    const { phones: [a, b, c], room, at } = table('d', 'market');
    const r = seeded('drop');
    const g0 = foldMoves(room.moves, ctx)!;
    const cPlays = playsOf(g0, 'G', r);
    if (!cPlays.length) return;
    c.play(cPlays[0]);
    room.hear(c, c.up.shift()!);
    // C gone: its link cut (what the room had for it lost), its other plays never sent
    const live = [a, b];
    for (const p of live) for (const m of playsOf(g0, p.me, r)) p.play(m);
    settle(live, room, r, 20_000, (n) => void (n === 0 && c.down.splice(0)));
    c.down.splice(0);
    a.play({ a: 'mc' });
    settle(live, room, r);
    const g = foldMoves(room.log(), ctx)!;
    expect(miniOn(g)).toBeNull();
    expect(room.moves.slice(at + 1).some((m) => m.who === 'G')).toBe(true);
    // C back (a reload: the room's replay heard in order over what it held)
    for (const m of room.log().slice(c.log.length - 1)) c.hearOne({ k: 'move', m });
    expect(c.log).toEqual(room.log());
    expect(JSON.stringify(foldMoves(c.log, ctx))).toBe(JSON.stringify(g));
    for (const p of live) expect(p.log).toEqual(room.log());
  });
});
