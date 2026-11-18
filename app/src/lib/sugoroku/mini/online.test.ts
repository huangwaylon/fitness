// Mini-games online (docs/sugoroku.md "みんなで！", "Online"), with them on (this file only: mini/flag.ts mocked): the
// rules' version, a whole game's moves folded, and phones racing through a room (the relay's rule: the first of each
// `i`) in any order of delivery, a race lost sent again at the next slot (wire.ts Outbox), a close racing the plays, an
// end racing a mini-game, a phone dropping and coming back: every phone the room's log and the same game.
import { describe, expect, it, vi } from 'vitest';
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

vi.mock('./flag.ts', () => ({ MINIS: true }));

const file = (f: string) => readFileSync(join(import.meta.dirname, '..', f), 'utf8');
const words = wordsOf(file('words.txt'), everyday, decodeAccept(file('accept.txt')));
const ctx = { words, lines: linesJson as unknown as Line[], name: (w: Who) => w };
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
    else if (ph.k === 'event') push({ a: 'ev' });
    else if (ph.k === 'home') push({ a: 'home' });
    else if (ph.k === 'mini' && !ph.on) push({ a: 'mg', b: (k % 2) as 0 | 1, s: k % 3 ? 'ABG' : 'AB' });
    else if (ph.k === 'mini') {
      for (const who of ['A', 'B', 'G'] as const) for (const p of playsOf(g, who, r)) if (g.phase.k === 'mini') push(p, who);
      if (g.phase.k === 'mini') push({ a: 'mc' }, 'G');
    }
  }
  return moves;
}

describe('online with mini-games on: the rules', () => {
  it('new games carry RULES 2 (GEN 2 boards); this build folds 1 and 2 (an old game plays on as it was), nothing else', () => {
    expect([RULES, GEN]).toEqual(['2', 2]);
    expect([playsRules('1'), playsRules('2'), playsRules('3'), playsRules(undefined)]).toEqual([true, true, false, false]);
    const start = (r: string) => ({ g: 'abcdefghij', i: 0, a: 'start', s: 'A2B2', l: 'n', r, who: 'A' }) as Move;
    expect(foldMoves([start('2')], ctx)?.layout).toBe(layoutKey('abcdefghij', 2));
    expect(foldMoves([start('1')], ctx)?.layout).toBe(layoutKey('abcdefghij', 1));
    expect([otherRules([start('1')]), otherRules([start('2')]), otherRules([start('3')])]).toEqual([false, false, true]);
    expect(foldMoves([start('3')], ctx)).toBeNull();
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
  it('RULES 2 moves with what a fold makes of the moves', () => {
    // (online.test's pin for '1'; this one for the mini-games' rules)
    const PIN: Record<string, string> = { '2': 'wm0khk' };
    const g0 = newGame([{ who: 'A', name: 'A', level: 1 }, { who: 'B', name: 'B', level: 2 }], 'x', 'normal');
    const lists = [file('words.txt'), file('accept.txt'), JSON.stringify(everyday), JSON.stringify(linesJson)].map((x) => fnv1a(x));
    const { v: _v, ...played } = foldMoves(playMoves('abcdefghij'), ctx)!;
    const hash = fnv1a(JSON.stringify([g0.content, GEN, lists, fnv1a(JSON.stringify(played))])).toString(36);
    expect(hash, `bump RULES in wire.ts and pin '${hash}' to it`).toBe(PIN[RULES]);
  });
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
 *  from `seed` on whose first pick `id` is played (any: the first pick). */
const opens = new Map<string, { gid: string; base: Move[] }>();
function table(seed: string, id?: string): { phones: Phone[]; room: Room; at: number } {
  for (let k = 0; ; k++) {
    const gid = `${seed}x${k}`.padEnd(10, '0').slice(0, 12);
    const { base } = opens.get(gid) ?? opens.set(gid, { gid, base: ((all) => all.slice(0, all.findIndex((m) => m.a === 'mg') + 1))(playMoves(gid)) }).get(gid)!;
    const at = base.length - 1;
    if (at < 0 || (id && miniOn(foldMoves(base, ctx)!)?.id !== id)) continue;
    const phones = (['A', 'B', 'G'] as const).map((w) => Object.assign(new Phone(w, gid), { log: [...base] }));
    const room = new Room(phones);
    room.moves = [...base];
    return { phones, room, at };
  }
}
const MINI_GAMES = ['market', 'spell', 'together', 'sort'] as const;

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
      const { phones, room, at } = table(`r${k % 5}`, MINI_GAMES[k % 4]);
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
      const { phones, room } = table(`c${k % 5}`, MINI_GAMES[k % 4]);
      const r = seeded(`close${k}`);
      const g0 = foldMoves(room.moves, ctx)!;
      for (const p of phones) for (const m of playsOf(g0, p.me, r)) p.play(m);
      phones[k % 3].play({ a: 'mc' });
      phones[(k + 1) % 3].play({ a: 'mc' });
      settle(phones, room, r);
      const log = room.log(), close = log.findIndex((m, i) => i > 0 && m.a === 'mc');
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
