// The round session over the quiz's GameDefs (round/session.ts, games/quiz/), on the `quiz` wire (round/wire.ts both
// ways): QuizSession's scenarios (docs/kikimimi.md "Sync"), ported in framework step 8b with parity checked call by
// call against QuizSession before it went; and what's new with it: a unit's lesson as a game of its own, an 8c phone's
// `play` heard.
import { describe, expect, it } from 'vitest';
import { points } from '../score.ts';
import { FAST_WINDOWS, WINDOWS } from './session.ts';
import type { RoundWindows } from './types.ts';
import { playIn, playOut, quizIn, quizOut, toWire, type QuizIn, type QuizOut, type RoundOut } from './wire.ts';
import { registry } from './registry.ts';
import { roundLink, wire } from './link.ts';
import type { QuizView } from '../games/quiz/view.ts';
import { QuizRounds, type QuizSettings } from '../games/quiz/session.ts';
import { quizGame, quizOpts, type QuizSource } from '../games/quiz/def.ts';
import { ladderGame } from '../games/ladder/def.ts';
import { lessonGame } from '../games/lesson/def.ts';
import { roundOf, type QuizRound } from '../games/quiz/kinds.ts';
import { isLadder, timerOf, versus, withLadder } from '../seed.ts';
import { ladderDeck } from '../ladder.ts';
import { LADDERS } from '../ladders.ts';
import type { Live, LiveStatus } from '../../sync/live.ts';
import type { QuizLv, Relayed, Who } from '../../contract/live-protocol.ts';
import { DIALOGUES } from '../dialogues.ts';
import { LINE_GAP, itemDur } from '../clips.ts';
import { clipIds } from '../bank.ts';

/** A test's deck: how many, each clip's length (ms), each right choice; or its rounds, when they carry more (a ladder's
 *  rungs). */
interface TestDeck {
  count: number;
  dur(i: number): number;
  answer(i: number): number;
  rounds?: readonly QuizRound[];
}
type TestDeckOf = (seed: number, lv: QuizLv) => TestDeck;

/** A quiz session as the scenarios drive it: on the `quiz` wire, its taps the quiz's. */
interface Sess {
  receive(m: QuizIn, now: number): QuizOut[];
  presence(here: readonly Who[] | null, now: number): QuizOut[];
  tick(now: number): QuizOut[];
  open(o: QuizSettings, now: number): QuizOut[];
  invite(now: number): QuizOut[];
  configure(o: Partial<QuizSettings>, now: number): QuizOut[];
  join(now: number, g?: string): QuizOut[];
  leave(now: number): QuizOut[];
  go(now: number): QuizOut[];
  answer(k: number, rp: boolean, now: number): QuizOut[];
  next(now: number): QuizOut[];
  ready(now: number): QuizOut[];
  close(now: number): void;
  view(now: number): QuizView;
}

/** A session wired to a Live (the UI's wiring). */
interface Wiring {
  act(f: (s: Sess, now: number) => QuizOut[] | void): void;
  tick(): void;
  stop(): void;
}

/** Every test game's content version (a `play` open's cv: the same on every test phone). */
const CV = 'a1b2c3';

/** A test deck as a quiz-family source: its rounds (a word round each, its right choice and length), or the rounds it
 *  carries; a lesson at tier t (its options' 4th) has each right choice moved on by t (its own choices, the same
 *  rounds). */
function sourceOf(deckOf: TestDeckOf): QuizSource {
  return {
    rounds: (gm, seed, enc) => {
      const o = quizOpts.decode(enc);
      if (!o) return [];
      const d = deckOf(seed, o.lv), t = gm === 'lesson' ? (enc[3] ?? 0) : 0;
      return d.rounds ?? Array.from({ length: d.count }, (_, i): QuizRound => ({ kind: 'quiz.word', id: `q${i}`, answer: t ? (d.answer(i) + t) % 3 : d.answer(i), play: d.dur(i) }));
    },
    cv: () => CV
  };
}

/** The quiz's GameDefs over a test deck. */
const defsOf = (deckOf: TestDeckOf) => {
  const src = sourceOf(deckOf);
  return registry([quizGame(src), ladderGame(src), lessonGame({ rounds: (seed, enc, u) => src.rounds('lesson', seed, enc, u), cv: () => CV })]);
};

/** A QuizRounds on the `quiz` wire (round/wire.ts both ways), as the scenarios drive a session. `raw`: the last call's
 *  ops before the wire. */
class OnQuizWire implements Sess {
  raw: RoundOut[] = [];
  constructor(readonly q: QuizRounds) {}
  #out(ms: RoundOut[]): QuizOut[] {
    this.raw = ms;
    return ms.map((m) => quizOut(m)).filter((m): m is QuizOut => !!m);
  }
  receive(m: QuizIn, now: number) {
    return this.#out(this.q.receive(quizIn(m), now));
  }
  presence(here: readonly Who[] | null, now: number) {
    return this.#out(this.q.presence(here, now));
  }
  tick(now: number) {
    return this.#out(this.q.tick(now));
  }
  open(o: QuizSettings, now: number) {
    return this.#out(this.q.open(o, now));
  }
  invite(now: number) {
    return this.#out(this.q.invite(now));
  }
  configure(o: Partial<QuizSettings>, now: number) {
    return this.#out(this.q.configure(o, now));
  }
  join(now: number, g?: string) {
    return this.#out(this.q.join(now, g));
  }
  leave(now: number) {
    return this.#out(this.q.leave(now));
  }
  go(now: number) {
    return this.#out(this.q.go(now));
  }
  answer(k: number, rp: boolean, now: number) {
    return this.#out(this.q.answer(k, rp, now));
  }
  next(now: number) {
    return this.#out(this.q.next(now));
  }
  ready(now: number) {
    return this.#out(this.q.ready(now));
  }
  close(now: number) {
    this.raw = [];
    this.q.close(now);
  }
  view(now: number) {
    return this.q.view(now);
  }
}

/** A session (the round session over the quiz's GameDefs on a test deck), on the `quiz` wire. */
const make = (o: { me: Who; deckOf: TestDeckOf; windows?: Partial<RoundWindows>; random?: () => number }): OnQuizWire =>
  new OnQuizWire(new QuizRounds({ me: o.me, defs: defsOf(o.deckOf), windows: o.windows, random: o.random }));

/** A session wired to a Live (link.ts, the UI's wiring). */
function wired(o: { me: Who; deckOf: TestDeckOf }, live: Pick<Live, 'send' | 'on' | 'onStatus' | 'serverNow'>, changed: () => void): { s: OnQuizWire; w: Wiring } {
  const s = make(o);
  const w = wire(s.q, roundLink(live), changed);
  return {
    s,
    w: {
      act: (f) =>
        w.act((_q, now) => {
          s.raw = [];
          f(s, now);
          return s.raw;
        }),
      tick: w.tick,
      stop: w.stop
    }
  };
}

/** 8 questions, each clip 2 s, question i's right choice i % 4. */
const DUR = 2000;
const deck: TestDeck = { count: 8, dur: () => DUR, answer: (i) => i % 4 };
/** A question's start to its answer window (the lead-in and the clip), and the default time limit (30 s). */
const OPEN = WINDOWS.lead + DUR;
const ANSWER = WINDOWS.answers[0];
const T0 = 1_793_527_000_000;

/** A fixed random: game ids and seeds the same each run. */
function seq(n: number) {
  let x = 0.123 + n * 0.1;
  return () => (x = (x * 9301 + 0.49297) % 1);
}

const ALL = ['A', 'B', 'G'] as const;

/** Three phones on one fake relay: each one's outputs go to the others here (unless dropped), in the order sent (one
 *  queue, as a socket's: a reply goes after what was already on its way). */
function room(whos: Who[] = ['A', 'B', 'G'], dk: TestDeck | TestDeckOf = deck) {
  let now = T0;
  const deckOf: TestDeckOf = typeof dk === 'function' ? dk : () => dk;
  const s = Object.fromEntries(whos.map((w, n) => [w, make({ me: w, deckOf, random: seq(n) })])) as Record<Who, OnQuizWire>;
  const here = new Set<Who>(whos);
  const sent: { from: Who; m: QuizOut }[] = [];
  const queue: { from: Who; m: QuizOut; to: Who }[] = [];
  let draining = false;
  /** Deliver `out` from `from` to everyone else here (drop: those who don't hear it). */
  const deliver = (from: Who, out: QuizOut[], drop: Who[] = []) => {
    for (const m of out) {
      sent.push({ from, m });
      for (const to of here) if (to !== from && !drop.includes(to)) queue.push({ from, m, to });
    }
    if (draining) return;
    draining = true;
    while (queue.length) {
      const x = queue.shift()!;
      if (here.has(x.to)) deliver(x.to, s[x.to].receive({ ...x.m, v: 3, who: x.from, t: now } as QuizIn, now));
    }
    draining = false;
  };
  const act = (w: Who, f: (x: Sess, now: number) => QuizOut[], drop: Who[] = []) => deliver(w, f(s[w], now), drop);
  /** Every phone here ticks (the host's beacon; a player following a つぎへ once the host has really gone). */
  const tick = (drop: Who[] = []) => {
    for (const w of whos) if (here.has(w)) deliver(w, s[w].tick(now), drop);
  };
  /** Everyone's status: a phone away hears nobody (its socket's down), and what it sends goes nowhere. */
  const presence = () => {
    for (const w of whos) {
      const out = s[w].presence(here.has(w) ? [...here].filter((x) => x !== w) : null, now);
      if (here.has(w)) deliver(w, out);
    }
  };
  presence();
  return {
    s, sent, here, act, deliver, presence, tick,
    get now() {
      return now;
    },
    set now(t: number) {
      now = t;
    },
    view: (w: Who) => s[w].view(now)
  };
}
type Room = ReturnType<typeof room>;

/** Open (A hosts, こたえる じかん `timer`) and invite, B and G join, A starts: returns question 0's start. */
function started(r: Room, joiners: Who[] = ['B', 'G'], timer?: 0 | 20 | 30 | 60): number {
  r.act('A', (x, n) => x.open({ lv: 1, timer }, n));
  if (joiners.length) r.act('A', (x, n) => x.invite(n));
  for (const w of joiners) r.act(w, (x, n) => x.join(n));
  r.act('A', (x, n) => x.go(n));
  return r.now + WINDOWS.countdown;
}

/** From question 0 (at s0) to question i: each one's reveal at its time limit, then the host's つぎへ. Returns its start. */
function onTo(r: Room, s0: number, i: number): number {
  let t = s0;
  for (let j = 0; j < i; j++) {
    r.now = t + OPEN + ANSWER;
    r.act('A', (x, n) => x.next(n));
    t = r.now;
  }
  return t;
}

describe('ききみみ session: the lobby', () => {
  it('a lobby is mine alone until みんなを さそう: then an open invites the others; さんか joins; the host sees who joined; level and おなじへや change by a new open', () => {
    const r = room();
    expect(r.view('B').phase).toBe('idle');
    r.act('A', (x, n) => x.open({ lv: 2, same: true }, n));
    expect(r.sent).toEqual([]); // nothing on the wire: no invite yet
    expect(r.view('A')).toMatchObject({ phase: 'lobby', amHost: true, local: true });
    expect(r.view('B')).toMatchObject({ phase: 'idle', invite: null });
    r.act('A', (x, n) => x.configure({ lv: 2 }, n));
    expect(r.sent).toEqual([]);
    r.act('A', (x, n) => x.invite(n));
    expect(r.s.A.invite(r.now)).toEqual([]); // once
    const open = r.sent[0].m as QuizOut & { op: 'open' };
    expect(open).toMatchObject({ kind: 'quiz', op: 'open', lv: 2, same: true });
    expect(open.g).toMatch(/^[a-z0-9]{6}$/);
    expect(open.seed).toBeGreaterThanOrEqual(0);
    expect(open.seed).toBeLessThan(2 ** 32);
    expect(r.view('A')).toMatchObject({ phase: 'lobby', amHost: true, local: false, g: open.g, players: [{ who: 'A' }], speaks: true, invite: null });
    expect(r.view('B')).toMatchObject({ phase: 'idle', invite: { g: open.g, host: 'A', lv: 2, same: true, started: false } });
    r.act('B', (x, n) => x.join(n));
    expect(r.view('B')).toMatchObject({ phase: 'lobby', amHost: false, speaks: false, invite: null });
    expect(r.view('A').players.map((p) => p.who)).toEqual(['A', 'B']);
    expect(r.view('G').players).toEqual([]); // not joined: no game of mine
    r.act('A', (x, n) => x.configure({ lv: 3, same: false }, n));
    expect(r.view('B')).toMatchObject({ lv: 3, same: false, speaks: true });
    expect(r.view('G').invite).toMatchObject({ lv: 3 });
    // only the host configures
    expect(r.s.B.configure({ lv: 1 }, r.now)).toEqual([]);
  });

  it('こたえる じかん: 30 s by default (the seed’s bits 2-3 zero); the host’s 20 / 60 / なし rides on those bits, sent as a new open, and every phone sees it; たいせん apart', () => {
    const r = room();
    r.act('A', (x, n) => x.open({ lv: 1 }, n));
    const seed = r.view('A').seed;
    expect(r.view('A').timer).toBe(30);
    expect((seed >>> 2) & 3).toBe(0);
    r.act('A', (x, n) => x.invite(n));
    r.act('B', (x, n) => x.join(n));
    expect(r.s.B.configure({ timer: 60 }, r.now)).toEqual([]); // the host's only
    r.act('A', (x, n) => x.configure({ timer: 60 }, n));
    const open = r.sent.at(-1)!.m as QuizOut & { op: 'open' };
    expect(open).toMatchObject({ op: 'open', lv: 1 });
    expect(open.seed).toBe(((seed & ~12) | (2 << 2)) >>> 0);
    expect(timerOf(open.seed)).toBe(60);
    for (const w of ['A', 'B'] as const) expect(r.view(w)).toMatchObject({ timer: 60, vs: false });
    // たいせん keeps the timer, the timer keeps たいせん
    r.act('A', (x, n) => x.configure({ vs: true }, n));
    for (const w of ['A', 'B'] as const) expect(r.view(w)).toMatchObject({ timer: 60, vs: true });
    r.act('A', (x, n) => x.configure({ timer: 0 }, n));
    for (const w of ['A', 'B'] as const) expect(r.view(w)).toMatchObject({ timer: 0, vs: true });
    expect((r.view('B').seed >>> 2) & 3).toBe(3);
    r.act('A', (x, n) => x.configure({ timer: 20 }, n));
    expect(r.view('B').timer).toBe(20);
    expect(r.view('B').seed >>> 4).toBe(seed >>> 4); // the rest of the seed untouched
    // open() takes it (the device's default)
    const s = make({ me: 'G', deckOf: () => deck, random: seq(5) });
    s.open({ lv: 1, timer: 0 }, T0);
    expect(s.view(T0)).toMatchObject({ timer: 0, vs: false });
  });

  it('the host leaving its lobby cancels it (end); a player leaving just goes', () => {
    const r = room();
    r.act('A', (x, n) => [...x.open({ lv: 1 }, n), ...x.invite(n)]);
    r.act('B', (x, n) => x.join(n));
    r.act('G', (x, n) => x.join(n));
    r.act('G', (x, n) => x.leave(n));
    expect(r.sent.at(-1)!.m).toMatchObject({ op: 'leave' });
    expect(r.view('A').players.map((p) => p.who)).toEqual(['A', 'B']);
    expect(r.view('G').invite).toBeNull(); // (left: its later messages ignored)
    r.act('A', (x, n) => x.leave(n));
    expect(r.sent.at(-1)!.m).toMatchObject({ op: 'end' });
    expect(r.view('B')).toMatchObject({ phase: 'idle', notice: 'cancelled', invite: null });
    r.s.B.close(r.now);
    expect(r.view('B').notice).toBeNull();
  });

  it('a stale open: dropped 10 min after it came, or once its host has been away 15 s (a moment away keeps it)', () => {
    const r = room();
    r.act('A', (x, n) => [...x.open({ lv: 1 }, n), ...x.invite(n)]);
    r.act('B', (x, n) => x.join(n));
    // A's phone gone a moment, then back: the lobby stays, and the host sends its open again
    r.here.delete('A');
    r.presence();
    r.now += 10_000;
    expect(r.view('B').phase).toBe('lobby');
    expect(r.view('G').invite).toBeNull(); // (the host isn't here: no banner)
    r.here.add('A');
    const n = r.sent.length;
    r.presence();
    // (B's join twice: for A back, and for its re-sent open, which is all a phone sees when the relay replaced A's
    // socket unseen; the second changes nothing)
    expect(r.sent.slice(n).map((x) => [x.from, x.m.op])).toEqual([['A', 'open'], ['B', 'join'], ['B', 'join']]);
    expect(r.view('G').invite).not.toBeNull();
    // gone for good
    r.here.delete('A');
    r.presence();
    r.now += WINDOWS.hostGrace;
    expect(r.view('B')).toMatchObject({ phase: 'idle', notice: 'host-left' });
    expect(r.view('G').invite).toBeNull();
    // never started: 10 minutes
    const q = room();
    q.act('A', (x, n) => [...x.open({ lv: 1 }, n), ...x.invite(n)]);
    q.act('B', (x, n) => x.join(n));
    q.now += WINDOWS.openTtl - 1;
    expect(q.view('B').phase).toBe('lobby');
    q.now += 1;
    expect(q.view('B')).toMatchObject({ phase: 'idle', notice: 'stale' });
    expect(q.view('G').invite).toBeNull();
    expect(q.view('A')).toMatchObject({ phase: 'idle', notice: 'stale' });
  });
});

describe('ききみみ session: the schedule', () => {
  it('go: a 3-2-1, then each question lead, play, answer (30 s), and a reveal that holds till the host’s つぎへ, the same on every phone', () => {
    const r = room();
    const s0 = started(r);
    expect(r.sent.at(-1)!.m).toEqual({ kind: 'quiz', g: expect.any(String), op: 'go', at: s0 });
    for (const w of ALL) expect(r.view(w)).toMatchObject({ phase: 'countdown', i: -1, from: T0, until: s0 });
    r.now = s0;
    expect(r.view('B')).toMatchObject({ phase: 'lead', i: 0, from: s0, until: s0 + 1500, playAt: s0 + 1500, playEnd: s0 + 3500, limit: s0 + 3500 + ANSWER, out: false });
    r.now = s0 + 1500;
    expect(r.view('G').phase).toBe('play');
    r.now = s0 + 3500;
    expect(r.view('A')).toMatchObject({ phase: 'answer', until: s0 + 3500 + ANSWER });
    r.now = s0 + 3500 + ANSWER;
    expect(r.view('A')).toMatchObject({ phase: 'reveal', from: s0 + 3500 + ANSWER, until: Infinity, canNext: true, canReady: false });
    expect(r.view('B')).toMatchObject({ phase: 'reveal', canNext: false, canReady: true });
    // untimed: ten minutes on, beacons and all, still the reveal (nobody's moved on by the clock)
    r.now += 600_000;
    r.tick();
    for (const w of ALL) expect(r.view(w)).toMatchObject({ phase: 'reveal', i: 0 });
    // つぎへ: the next question now, on every phone
    r.act('A', (x, n) => x.next(n));
    const s1 = r.now;
    for (const w of ALL) expect(r.view(w)).toMatchObject({ phase: 'lead', i: 1, from: s1 });
    const s7 = onTo(r, s1, 6);
    r.now = s7 + OPEN + ANSWER - 1;
    expect(r.view('B')).toMatchObject({ phase: 'answer', i: 7 });
    r.now += 1;
    expect(r.view('B')).toMatchObject({ phase: 'reveal', i: 7 });
    r.act('A', (x, n) => x.next(n));
    for (const w of ALL) expect(r.view(w)).toMatchObject({ phase: 'results', scores: { A: 0, B: 0, G: 0 } });
    // nothing to re-send once it's over
    r.here.delete('G');
    r.presence();
    r.here.add('G');
    const n = r.sent.length;
    r.presence();
    expect(r.sent.length).toBe(n);
    r.s.B.close(r.now);
    expect(r.view('B').phase).toBe('idle');
  });

  it('answers: in the answer window only, once; a ✓ for each, the choice only at the reveal; 100 a right answer, replayed or not (いっぱつ is a badge)', () => {
    const r = room();
    const s0 = started(r);
    r.now = s0 + 2000; // playing
    expect(r.s.B.answer(0, false, r.now)).toEqual([]);
    r.now = s0 + 4000;
    r.act('B', (x, n) => x.answer(0, false, n));
    expect(r.sent.at(-1)!.m).toMatchObject({ op: 'a', i: 0, k: 0, rp: false, s: 100 });
    expect(r.s.B.answer(1, false, r.now)).toEqual([]); // final
    const chips = r.view('A').players;
    expect(chips.find((p) => p.who === 'B')).toEqual({ who: 'B', here: true, answered: true, ready: false, score: 100 });
    expect(chips.find((p) => p.who === 'G')).toMatchObject({ answered: false });
    r.act('G', (x, n) => x.answer(0, true, n)); // right, replayed
    r.act('A', (x, n) => x.answer(2, false, n)); // wrong
    const v = r.view('G');
    expect(v.phase).toBe('reveal'); // everyone in: the reveal at once
    expect(v.players.map((p) => [p.who, p.pick, p.score])).toEqual([['A', { k: 2, ok: false }, 0], ['B', { k: 0, ok: true }, 100], ['G', { k: 0, ok: true }, 100]]);
    expect(v.answers[0]).toEqual({ k: 0, rp: true, t: r.now });
    expect(points(true)).toBe(100);
    expect(points(false)).toBe(0);
  });

  it('a choice out of range, or not a whole number, is no answer', () => {
    const r = room(['A']);
    const s0 = started(r, []);
    r.now = s0 + OPEN + 100;
    for (const k of [-1, 4, 1.5, NaN]) expect(r.s.A.answer(k, false, r.now)).toEqual([]);
    expect(r.view('A')).toMatchObject({ phase: 'answer', answers: [null, null, null, null, null, null, null, null] });
    r.act('A', (x, n) => x.answer(3, false, n));
    expect(r.view('A').phase).toBe('reveal');
    expect(r.view('A').answers[0]).toMatchObject({ k: 3, rp: false });
  });

  it('everyone answered: the reveal at once on every phone, nothing sent but the answers; it holds till the host’s つぎへ', () => {
    const r = room();
    const s0 = started(r);
    r.now = s0 + 5000;
    const n = r.sent.length;
    for (const w of ALL) r.act(w, (x, n) => x.answer(0, false, n));
    expect(r.sent.slice(n).map((x) => x.m.op)).toEqual(['a', 'a', 'a']);
    for (const w of ALL) expect(r.view(w)).toMatchObject({ phase: 'reveal', i: 0, from: s0 + 5000, until: Infinity });
    r.now += 60_000;
    expect(r.view('B')).toMatchObject({ phase: 'reveal', i: 0 });
    expect(r.s.B.next(r.now)).toEqual([]); // the host's (it's here)
    r.act('A', (x, n) => x.next(n));
    expect(r.sent.at(-1)!.m).toMatchObject({ op: 'skip', i: 1, at: r.now });
    for (const w of ALL) expect(r.view(w)).toMatchObject({ phase: 'lead', i: 1, from: r.now });
    expect(r.s.A.next(r.now)).toEqual([]); // つぎへ in a reveal only
  });

  it('the last question: everyone in, the reveal; the host’s つぎへ sends the end (i 8) and the results come on every phone', () => {
    const r = room();
    const s0 = started(r);
    const s7 = onTo(r, s0, 7);
    r.now = s7 + 4000;
    for (const w of ALL) r.act(w, (x, n) => x.answer(3, false, n));
    r.now += 30_000;
    expect(r.view('B').phase).toBe('reveal');
    r.act('A', (x, n) => x.next(n));
    expect(r.sent.at(-1)!.m).toMatchObject({ op: 'skip', i: 8, at: r.now });
    for (const w of ALL) expect(r.view(w)).toMatchObject({ phase: 'results', i: 8, scores: { A: 100, B: 100, G: 100 } });
  });

  it('solo: one player, the same game, my つぎへ after each reveal, nothing on the wire', () => {
    const r = room(['A']);
    const s0 = started(r, []);
    let t = s0;
    for (let i = 0; i < 8; i++) {
      r.now = t + OPEN + 1000;
      expect(r.view('A')).toMatchObject({ phase: 'answer', i });
      r.act('A', (x, n) => x.answer(i === 3 ? 0 : i % 4, i === 5, n));
      expect(r.view('A').phase).toBe('reveal');
      r.now += 120_000;
      expect(r.view('A')).toMatchObject({ phase: 'reveal', i, canNext: true });
      r.act('A', (x, n) => x.next(n));
      t = r.now;
    }
    expect(r.view('A')).toMatchObject({ phase: 'results', scores: { A: 700 }, players: [{ who: 'A', score: 700 }] });
    expect(r.sent).toEqual([]);
    expect(r.s.A.tick(r.now - 1)).toEqual([]);
  });

  it('こたえる じかん: 20, 30 or 60 s from the clip’s end; なし waits for everyone in it (solo: for me); the fast windows shorten the timed ones', () => {
    for (const [timer, ms] of [[20, 20_000], [30, 30_000], [60, 60_000]] as const) {
      const s = make({ me: 'A', deckOf: () => deck });
      s.open({ lv: 1, timer }, T0);
      s.go(T0);
      const s0 = T0 + WINDOWS.countdown;
      expect(s.view(s0 + OPEN)).toMatchObject({ phase: 'answer', timer, limit: s0 + OPEN + ms });
      expect(s.view(s0 + OPEN + ms - 1).phase).toBe('answer');
      expect(s.view(s0 + OPEN + ms).phase).toBe('reveal');
    }
    // なし, solo: the answer window till I answer
    const s = make({ me: 'A', deckOf: () => deck });
    s.open({ lv: 1, timer: 0 }, T0);
    s.go(T0);
    const late = T0 + WINDOWS.countdown + OPEN + 3_600_000;
    expect(s.view(late)).toMatchObject({ phase: 'answer', limit: Infinity, until: Infinity });
    s.answer(1, false, late);
    expect(s.view(late)).toMatchObject({ phase: 'reveal', i: 0 });
    // the fast windows (?kikimimi=fast): 8 s, none still none
    const f = make({ me: 'A', deckOf: () => deck, windows: FAST_WINDOWS });
    f.open({ lv: 1 }, T0);
    f.go(T0);
    const f0 = T0 + WINDOWS.countdown;
    expect(f.view(f0 + OPEN + FAST_WINDOWS.answers[0])).toMatchObject({ phase: 'reveal' });
    f.open({ lv: 1, timer: 0 }, T0);
    f.go(T0);
    expect(f.view(f0 + OPEN + 600_000)).toMatchObject({ phase: 'answer', limit: Infinity });
    // なし with three: everyone joined and here, however long
    const r = room();
    const r0 = started(r, ['B', 'G'], 0);
    r.now = r0 + OPEN + 600_000;
    r.act('A', (x, n) => x.answer(0, false, n));
    r.act('B', (x, n) => x.answer(0, false, n));
    for (const w of ALL) expect(r.view(w)).toMatchObject({ phase: 'answer', i: 0 });
    r.act('G', (x, n) => x.answer(1, false, n));
    for (const w of ALL) expect(r.view(w)).toMatchObject({ phase: 'reveal', i: 0, timer: 0 });
    // one of them away (a locked phone): not waited for
    r.act('A', (x, n) => x.next(n));
    r.here.delete('G');
    r.presence();
    r.now += OPEN + 1000;
    r.act('A', (x, n) => x.answer(1, false, n));
    r.act('B', (x, n) => x.answer(1, false, n));
    for (const w of ['A', 'B'] as const) expect(r.view(w)).toMatchObject({ phase: 'reveal', i: 1 });
  });

  it('よみおわった: a player’s tap in a reveal, sent as its skip to the question it’s in; the chips and the host’s つぎへ count it; the host can always go on', () => {
    const r = room();
    const s0 = started(r);
    r.now = s0 + 4000;
    for (const w of ALL) r.act(w, (x, n) => x.answer(0, false, n));
    expect(r.view('A')).toMatchObject({ phase: 'reveal', canNext: true, canReady: false, ready: { n: 0, of: 2 } });
    expect(r.s.A.ready(r.now)).toEqual([]); // the host's is つぎへ
    r.act('B', (x, n) => x.ready(n));
    expect(r.sent.at(-1)).toEqual({ from: 'B', m: { kind: 'quiz', g: expect.any(String), op: 'skip', i: 0, at: s0 } });
    expect(r.s.B.ready(r.now)).toEqual([]); // once
    expect(r.view('A').players.map((p) => [p.who, p.ready])).toEqual([['A', false], ['B', true], ['G', false]]);
    expect(r.view('A').ready).toEqual({ n: 1, of: 2 });
    expect(r.view('G')).toMatchObject({ canReady: true, ready: { n: 1, of: 1 } });
    expect(r.view('G').players.find((p) => p.who === 'B')!.ready).toBe(true);
    // a player's skip is never a position (the host is here): nobody moved
    for (const w of ALL) expect(r.view(w)).toMatchObject({ phase: 'reveal', i: 0 });
    // G not ready: the host goes on anyway
    r.act('A', (x, n) => x.next(n));
    for (const w of ALL) expect(r.view(w)).toMatchObject({ phase: 'lead', i: 1 });
    expect(r.view('A').players.every((p) => !p.ready)).toBe(true);
    // not in a reveal: nothing
    r.now += OPEN;
    expect(r.s.B.ready(r.now)).toEqual([]);
    // a player away doesn't count
    r.now += 1000;
    for (const w of ALL) r.act(w, (x, n) => x.answer(1, false, n));
    r.act('G', (x, n) => x.ready(n));
    r.here.delete('B');
    r.presence();
    expect(r.view('A').ready).toEqual({ n: 1, of: 1 });
  });
});

describe('ききみみ session: dialogues', () => {
  it('a dialogue’s sequence: its clip length is its lines’ and the gaps (clips.ts itemDur), and the schedule runs on it alike on every phone', () => {
    const d = DIALOGUES.find((it) => it.id === 'd4-train-cancelled')!;
    const clips = Object.fromEntries(clipIds(d).map((id, n) => [id, { dur: 1.5 + n }])); // 1.5, 2.5, 3.5, 4.5 s
    const seqMs = Math.round(itemDur(d, clips)! * 1000);
    expect(seqMs).toBe(12_000 + 3 * LINE_GAP * 1000);
    // question 1 the dialogue, the others 2 s
    const dd: TestDeck = { count: 8, dur: (i) => (i === 1 ? seqMs : DUR), answer: (i) => i % 4 };
    const r = room(['A', 'B'], dd);
    const s0 = started(r, ['B']);
    const s1 = onTo(r, s0, 1);
    for (const w of ['A', 'B'] as const) {
      expect(r.s[w].view(s1 + 1)).toMatchObject({ phase: 'lead', i: 1, playAt: s1 + WINDOWS.lead, playEnd: s1 + WINDOWS.lead + seqMs });
      expect(r.s[w].view(s1 + WINDOWS.lead + seqMs - 1).phase).toBe('play');
      expect(r.s[w].view(s1 + WINDOWS.lead + seqMs).phase).toBe('answer');
      expect(r.s[w].view(s1 + WINDOWS.lead + seqMs + ANSWER)).toMatchObject({ phase: 'reveal', i: 1 });
    }
  });
});

describe('ききみみ session: スピード はしご', () => {
  /** The ladder deck as the game builds it (decks.ts): its rungs (their kind `ladder.rung`: the climb, the reveals below
   *  the top moving on by themselves), each 2 s. */
  const ladderDeckOf = (seed: number): TestDeck => {
    if (!isLadder(seed)) return deck;
    const items = ladderDeck(seed, LADDERS);
    return { count: items.length, dur: () => DUR, answer: (i) => items[i].answer, rounds: items.map((it) => roundOf(it, DUR)) };
  };
  const ladderRoom = () => room(['A', 'B'], ladderDeckOf);

  it('the mode rides on the open’s seed (bit 1): a quiz lobby has it clear; the host flips it by a new open; the invite says so', () => {
    const r = ladderRoom();
    r.act('A', (x, n) => x.open({ lv: 3 }, n));
    const seed = r.view('A').seed;
    expect(isLadder(seed)).toBe(false);
    expect(r.view('A')).toMatchObject({ ladder: false, n: 8 });
    r.act('A', (x, n) => x.invite(n));
    r.act('A', (x, n) => x.configure({ ladder: true }, n));
    expect(r.sent.at(-1)!.m).toMatchObject({ op: 'open', seed: withLadder(seed, true), lv: 3 });
    expect(r.view('B').invite).toMatchObject({ ladder: true, lv: 3 });
    // たいせん keeps the mode, and the mode たいせん
    r.act('A', (x, n) => x.configure({ vs: true }, n));
    expect(r.view('A')).toMatchObject({ ladder: true, vs: true });
    r.act('A', (x, n) => x.configure({ ladder: false }, n));
    expect(r.view('A')).toMatchObject({ ladder: false, vs: true });
    // open() can start one in the mode (もういっかい keeps it)
    const s = make({ me: 'G', deckOf: ladderDeckOf, random: seq(5) });
    s.open({ lv: 1, ladder: true }, T0);
    expect(s.view(T0)).toMatchObject({ ladder: true, vs: false });
  });

  it('two players climb: the points are the rungs climbed in order on the first listen (a replay or a miss stops a ladder), the same on both phones', () => {
    const r = ladderRoom();
    r.act('A', (x, n) => x.open({ lv: 4, ladder: true }, n));
    r.act('A', (x, n) => x.invite(n));
    r.act('B', (x, n) => x.join(n));
    r.act('A', (x, n) => x.go(n));
    const items = ladderDeck(r.view('A').seed, LADDERS);
    expect(items).toHaveLength(8);
    // A: all right, a replay on rung 3 of ladder 2; B: a miss on rung 2 of ladder 1, then right
    const plan: Record<'A' | 'B', (i: number) => [boolean, boolean]> = {
      A: (i) => [true, i === 6],
      B: (i) => [i !== 1, false]
    };
    let t = r.now + WINDOWS.countdown;
    for (let i = 0; i < 8; i++) {
      r.now = t + WINDOWS.lead + DUR + 500;
      for (const w of ['A', 'B'] as const) {
        const [right, rp] = plan[w](i);
        r.act(w, (x, n) => x.answer(right ? items[i].answer : (items[i].answer + 1) % 3, rp, n));
      }
      // (the untimed reveal: the host's つぎへ)
      r.act('A', (x, n) => x.next(n));
      t = r.now;
    }
    // A: ladder 1 all 4, ladder 2 rungs 1-2 (the replay on 3 stops it); B: ladder 1 rung 1, ladder 2 all 4
    for (const w of ['A', 'B'] as const) expect(r.view(w)).toMatchObject({ phase: 'results', scores: { A: 600, B: 500 } });
  });

  it('a rung below the top moves on by itself 3 s after its reveal (nothing to read: the line is hidden), on both phones; the top rung’s reveal waits for つぎへ', () => {
    const r = ladderRoom();
    r.act('A', (x, n) => x.open({ lv: 4, ladder: true }, n));
    r.act('A', (x, n) => x.invite(n));
    r.act('B', (x, n) => x.join(n));
    r.act('A', (x, n) => x.go(n));
    const items = ladderDeck(r.view('A').seed, LADDERS);
    let t = r.now + WINDOWS.countdown;
    for (let i = 0; i < 4; i++) {
      r.now = t + WINDOWS.lead + DUR + 500;
      for (const w of ['A', 'B'] as const) r.act(w, (x, n) => x.answer(items[i].answer, false, n));
      const revealAt = r.now;
      for (const w of ['A', 'B'] as const) expect(r.view(w), `rung ${i + 1}`).toMatchObject({ phase: 'reveal', i });
      if (i < 3) {
        // no よみおわった to tap; the host may still go sooner
        expect(r.view('B').canReady).toBe(false);
        expect(r.view('A').canNext).toBe(true);
        for (const w of ['A', 'B'] as const) expect(r.view(w).until).toBe(revealAt + WINDOWS.auto);
        r.now = revealAt + WINDOWS.auto - 1;
        for (const w of ['A', 'B'] as const) expect(r.view(w).phase).toBe('reveal');
        r.now = revealAt + WINDOWS.auto;
        r.tick();
        for (const w of ['A', 'B'] as const) expect(r.view(w), `rung ${i + 2}`).toMatchObject({ phase: 'lead', i: i + 1 });
        t = r.now;
      } else {
        // the top: the line, the marks, time to read; untimed till the host's つぎへ
        expect(r.view('B').canReady).toBe(true);
        r.now = revealAt + 60_000;
        r.tick();
        for (const w of ['A', 'B'] as const) expect(r.view(w)).toMatchObject({ phase: 'reveal', i: 3, until: Infinity });
        r.act('A', (x, n) => x.next(n));
        for (const w of ['A', 'B'] as const) expect(r.view(w)).toMatchObject({ phase: 'lead', i: 4 });
      }
    }
  });

  it('a rung timed out moves on 3 s after its limit; with the host gone the lower rungs still move on by themselves', () => {
    const r = ladderRoom();
    r.act('A', (x, n) => x.open({ lv: 4, ladder: true }, n));
    r.act('A', (x, n) => x.invite(n));
    r.act('B', (x, n) => x.join(n));
    r.act('A', (x, n) => x.go(n));
    const q0 = r.now + WINDOWS.countdown;
    const limit = q0 + WINDOWS.lead + DUR + ANSWER;
    // nobody answers rung 1: its reveal at the limit, rung 2 three seconds on
    r.now = limit + 1;
    expect(r.view('B')).toMatchObject({ phase: 'reveal', i: 0, until: limit + WINDOWS.auto });
    // the host goes away for good
    r.here.delete('A');
    r.presence();
    r.now = limit + WINDOWS.auto + 1;
    expect(r.view('B')).toMatchObject({ phase: 'lead', i: 1 });
    r.now += WINDOWS.lead + DUR + 100;
    r.act('B', (x, n) => x.answer(0, false, n));
    const revealAt = r.now;
    expect(r.view('B').phase).toBe('reveal');
    r.now = revealAt + WINDOWS.auto + 1;
    expect(r.view('B')).toMatchObject({ phase: 'lead', i: 2 });
  });

  it('the quiz’s reveals never move on by themselves (no deck.auto)', () => {
    const r = room(['A', 'B']);
    const q0 = started(r, ['B']);
    r.now = q0 + OPEN + 100;
    for (const w of ['A', 'B'] as const) r.act(w, (x, n) => x.answer(0, false, n));
    r.now += 60_000;
    r.tick();
    expect(r.view('B')).toMatchObject({ phase: 'reveal', i: 0, until: Infinity });
  });
});

describe('ききみみ session: co-op and たいせん', () => {
  it('a new lobby is co-op (its seed even); the host’s たいせん flips the seed’s low bit, sent as a new open, and every phone sees it', () => {
    const r = room();
    r.act('A', (x, n) => x.open({ lv: 2 }, n));
    expect(r.view('A')).toMatchObject({ vs: false });
    expect(r.view('A').seed % 2).toBe(0);
    r.act('A', (x, n) => x.invite(n));
    r.act('B', (x, n) => x.join(n));
    const seed = r.view('A').seed;
    expect(r.s.B.configure({ vs: true }, r.now)).toEqual([]); // the host's only
    r.act('A', (x, n) => x.configure({ vs: true }, n));
    expect(r.sent.at(-1)!.m).toMatchObject({ op: 'open', seed: seed + 1, lv: 2 });
    expect(versus(seed + 1)).toBe(true);
    for (const w of ['A', 'B'] as const) expect(r.view(w)).toMatchObject({ vs: true, seed: seed + 1 });
    r.act('A', (x, n) => x.configure({ vs: false }, n));
    for (const w of ['A', 'B'] as const) expect(r.view(w)).toMatchObject({ vs: false, seed });
    // open() can start one in たいせん (もういっかい keeps the mode)
    const s = make({ me: 'G', deckOf: () => deck, random: seq(5) });
    s.open({ lv: 1, vs: true }, T0);
    expect(s.view(T0)).toMatchObject({ vs: true });
  });

  it('the team’s tally: a question counts when anyone got it right, そろって when everyone in it did; the reveal says how many got it, never who', () => {
    const r = room();
    const s0 = started(r);
    // question i's right choice is i % 4; B misses the odd ones, G misses 3 and 5, A misses 3: 3 is nobody's
    const wrong: Record<Who, number[]> = { A: [3], B: [1, 3, 5, 7], G: [3, 5] };
    let t = s0;
    for (let i = 0; i < 8; i++) {
      r.now = t + OPEN + 500;
      for (const w of ALL) r.act(w, (x, n) => x.answer(wrong[w].includes(i) ? (i + 1) % 4 : i % 4, false, n));
      const v = r.view('B');
      expect(v).toMatchObject({ phase: 'reveal', i, rightNow: 3 - ALL.filter((w) => wrong[w].includes(i)).length });
      expect(v.team.done).toBe(i + 1);
      r.now += 5000;
      r.act('A', (x, n) => x.next(n));
      t = r.now;
    }
    for (const w of ALL) expect(r.view(w)).toMatchObject({ phase: 'results', team: { right: 7, all: 4, done: 8 }, rightNow: 0 });
  });

  it('a player who joined mid-game doesn’t hold back そろって for the questions before', () => {
    const r = room(['A', 'B']);
    r.act('A', (x, n) => x.open({ lv: 1 }, n));
    r.act('A', (x, n) => x.invite(n));
    r.act('A', (x, n) => x.go(n));
    const s0 = r.now + WINDOWS.countdown;
    r.now = s0 + OPEN + 500;
    r.act('A', (x, n) => x.answer(0, false, n));
    r.act('B', (x, n) => x.join(n)); // in from question 1 (A alone was in: its reveal at once)
    r.now += 3000;
    r.act('A', (x, n) => x.next(n));
    r.now += OPEN + 500;
    r.act('A', (x, n) => x.answer(1, false, n));
    r.act('B', (x, n) => x.answer(1, false, n));
    for (const w of ['A', 'B'] as const) expect(r.view(w).team).toEqual({ right: 2, all: 2, done: 2 });
  });

  it('そろって is the same on every phone: a player in the game who lets a question time out holds it back on all of them', () => {
    const r = room(['A', 'B']);
    const s0 = started(r, ['B']);
    r.now = s0 + OPEN + 500;
    r.act('B', (x, n) => x.answer(0, false, n)); // right; A lets it time out
    r.now = s0 + OPEN + ANSWER + 100; // the reveal
    for (const w of ['A', 'B'] as const) expect(r.view(w)).toMatchObject({ phase: 'reveal', i: 0, team: { right: 1, all: 0, done: 1 } });
    // and the same when the one who timed out answered nothing before (B's phone knows A was in from the start)
    r.act('A', (x, n) => x.next(n));
    r.now += OPEN + 500;
    r.act('A', (x, n) => x.answer(1, false, n));
    r.act('B', (x, n) => x.answer(1, false, n));
    for (const w of ['A', 'B'] as const) expect(r.view(w).team).toEqual({ right: 2, all: 1, done: 2 });
  });

  it('a player who leaves keeps the answers they gave in the team’s tally', () => {
    const r = room();
    const s0 = started(r);
    r.now = s0 + OPEN + 500;
    r.act('A', (x, n) => x.answer(1, false, n)); // wrong
    r.act('G', (x, n) => x.answer(1, false, n)); // wrong
    r.act('B', (x, n) => x.answer(0, false, n)); // right: the team has question 0
    r.act('B', (x, n) => x.leave(n));
    r.now += 5000;
    r.act('A', (x, n) => x.next(n));
    for (const w of ['A', 'G'] as const) expect(r.view(w).team).toEqual({ right: 1, all: 0, done: 1 });
  });

  it('the team’s first listens (a co-op lesson’s tm): right by someone with no replay, the same on every phone', () => {
    const r = room(['A', 'B']);
    const s0 = started(r, ['B']);
    r.now = s0 + OPEN + 500;
    r.act('A', (x, n) => x.answer(0, true, n)); // right after a replay
    r.act('B', (x, n) => x.answer(1, false, n)); // wrong
    for (const w of ['A', 'B'] as const) expect(r.view(w)).toMatchObject({ team: { right: 1 }, teamFirst: 0 });
    r.now += 3000;
    r.act('A', (x, n) => x.next(n));
    r.now += OPEN + 500;
    r.act('A', (x, n) => x.answer(1, false, n)); // wrong
    r.act('B', (x, n) => x.answer(0, false, n)); // right, first listen: the team has it
    for (const w of ['A', 'B'] as const) expect(r.view(w)).toMatchObject({ team: { right: 2 }, teamFirst: 1 });
  });
});

describe('ききみみ session: lost and late messages', () => {
  it('a lost `a`: that phone’s reveal waits for the time limit (or the host’s つぎへ), and the next `a`’s running total puts the score right', () => {
    const r = room();
    const s0 = started(r);
    r.now = s0 + 4000;
    r.act('A', (x, n) => x.answer(0, false, n));
    r.act('G', (x, n) => x.answer(0, false, n));
    r.act('B', (x, n) => x.answer(0, false, n), ['G']); // G never hears B's
    expect(r.view('G').players.find((p) => p.who === 'B')).toMatchObject({ answered: false, score: 0 });
    expect(r.view('A').phase).toBe('reveal');
    expect(r.view('G')).toMatchObject({ phase: 'answer', until: s0 + OPEN + ANSWER });
    r.now = s0 + OPEN + ANSWER;
    expect(r.view('G').phase).toBe('reveal');
    // the host's つぎへ sooner brings G along whatever it waited for
    const q = room();
    const t0 = started(q);
    q.now = t0 + 4000;
    q.act('A', (x, n) => x.answer(0, false, n));
    q.act('G', (x, n) => x.answer(0, false, n));
    q.act('B', (x, n) => x.answer(0, false, n), ['G']);
    q.act('A', (x, n) => x.next(n));
    expect(q.view('G')).toMatchObject({ phase: 'lead', i: 1, from: q.now });
    q.now += OPEN + 500;
    q.act('B', (x, n) => x.answer(1, true, n));
    expect(q.view('G').players.find((p) => p.who === 'B')!.score).toBe(200);
  });

  it('a lost `skip` (the host’s つぎへ): that phone stays in its reveal till the host’s next beacon brings it to the question under way', () => {
    const r = room();
    const s0 = started(r);
    r.now = s0 + 4000;
    for (const w of ALL) r.act(w, (x, n) => x.answer(0, false, n));
    r.now += 2000;
    r.act('A', (x, n) => x.next(n), ['G']);
    const s1 = r.now;
    expect(r.view('B')).toMatchObject({ phase: 'lead', i: 1 });
    expect(r.view('G')).toMatchObject({ phase: 'reveal', i: 0 });
    r.now = s1 + 1000;
    r.tick(); // just sent: no beacon yet
    expect(r.view('G')).toMatchObject({ phase: 'reveal', i: 0 });
    r.now = s1 + WINDOWS.beacon;
    r.tick();
    expect(r.view('G')).toMatchObject({ phase: 'play', i: 1, from: s1 + WINDOWS.lead, out: false });
    expect(r.view('G').playAt).toBe(r.view('B').playAt);
  });

  it('a late go: the host’s times kept; its clip begun ≤ 5 s before, the question is played; later, sat out (untimed: never sat out)', () => {
    const r = room();
    r.act('A', (x, n) => [...x.open({ lv: 1 }, n), ...x.invite(n)]);
    r.act('B', (x, n) => x.join(n));
    r.act('G', (x, n) => x.join(n));
    const go = r.s.A.go(r.now)[0] as QuizIn & { op: 'go' };
    const s0 = go.at;
    // B hears it 3 s after question 0 began (its clip 1.5 s in): on the host's clock, played
    r.now = s0 + 3000;
    r.s.B.receive({ ...go, v: 3, who: 'A', t: r.now }, r.now);
    expect(r.view('B')).toMatchObject({ phase: 'play', i: 0, from: s0 + 1500, out: false });
    // G hears it 10 s after: question 0's clip is long over, sat out
    r.now = s0 + 10_000;
    r.s.G.receive({ ...go, v: 3, who: 'A', t: r.now }, r.now);
    expect(r.view('G')).toMatchObject({ phase: 'answer', i: 0, out: true });
    expect(r.s.G.answer(0, false, r.now)).toEqual([]);
    // the others answer: G's reveal doesn't wait for its own answer (it can't give one); theirs do (they can't know
    // its go came late), till the time limit
    r.act('A', (x, n) => x.answer(0, false, n));
    r.act('B', (x, n) => x.answer(0, false, n));
    expect(r.view('G')).toMatchObject({ phase: 'reveal', i: 0 });
    expect(r.view('A')).toMatchObject({ phase: 'answer', i: 0 });
    r.now = s0 + OPEN + ANSWER;
    r.act('A', (x, n) => x.next(n));
    expect(r.view('G')).toMatchObject({ phase: 'lead', i: 1, out: false });
    // こたえる じかん なし: no hurry, so a late phone isn't sat out (its 🔁 plays the clip)
    const q = room();
    q.act('A', (x, n) => [...x.open({ lv: 1, timer: 0 }, n), ...x.invite(n)]);
    q.act('G', (x, n) => x.join(n));
    const go2 = q.s.A.go(q.now)[0] as QuizIn & { op: 'go' };
    q.now = go2.at + 60_000;
    q.s.G.receive({ ...go2, v: 3, who: 'A', t: q.now }, q.now);
    expect(q.view('G')).toMatchObject({ phase: 'answer', i: 0, out: false });
    expect(q.s.G.answer(0, false, q.now)).toHaveLength(1);
  });

  it('a late skip: the host’s times kept; its clip begun ≤ 5 s before, played; later, sat out', () => {
    const r = room();
    const s0 = started(r);
    r.now = s0 + 4000;
    for (const w of ALL) r.act(w, (x, n) => x.answer(0, false, n));
    r.act('A', (x, n) => x.next(n), ['B', 'G']); // the skip lost to both
    const skip = r.sent.at(-1)!.m as QuizOut & { op: 'skip' };
    r.now = skip.at + 4000;
    r.s.B.receive({ ...skip, v: 3, who: 'A', t: r.now }, r.now);
    expect(r.view('B')).toMatchObject({ phase: 'answer', i: 1, playAt: skip.at + 1500, out: false });
    r.now = skip.at + 7000;
    r.s.G.receive({ ...skip, v: 3, who: 'A', t: r.now }, r.now);
    expect(r.view('G')).toMatchObject({ phase: 'answer', i: 1, playAt: skip.at + 1500, out: true });
  });

  it('the host gone mid-game (its leave): nobody moves on by themselves; any player’s つぎへ moves everyone left on, to the results', () => {
    const r = room();
    const s0 = started(r);
    r.now = s0 + 5000;
    r.act('A', (x, n) => x.leave(n));
    r.act('B', (x, n) => x.answer(0, false, n));
    const sent = r.sent.length;
    r.act('G', (x, n) => x.answer(0, true, n));
    expect(r.sent.slice(sent).map((x) => x.m.op)).toEqual(['a']);
    for (const w of ['B', 'G'] as const) expect(r.view(w)).toMatchObject({ phase: 'reveal', i: 0, until: Infinity, canNext: true, canReady: false });
    r.now += 60_000;
    r.tick();
    expect(r.view('G')).toMatchObject({ phase: 'reveal', i: 0 });
    // B's つぎへ: its skip, G follows
    r.act('B', (x, n) => x.next(n));
    expect(r.sent.at(-1)).toMatchObject({ from: 'B', m: { op: 'skip', i: 1, at: r.now } });
    for (const w of ['B', 'G'] as const) expect(r.view(w)).toMatchObject({ phase: 'lead', i: 1, from: r.now });
    let t = r.now;
    // nobody answers question 1: its time limit, then G's つぎへ
    r.now = t + OPEN + ANSWER;
    expect(r.view('B')).toMatchObject({ phase: 'reveal', i: 1 });
    r.act('G', (x, n) => x.next(n));
    t = r.now;
    for (let j = 2; j < 8; j++) {
      r.now = t + OPEN + 500;
      r.act('B', (x, n) => x.answer(j % 4, false, n));
      r.act('G', (x, n) => x.answer((j + 1) % 4, false, n));
      expect(r.view('G')).toMatchObject({ phase: 'reveal', i: j });
      r.act(j % 2 ? 'B' : 'G', (x, n) => x.next(n));
      t = r.now;
    }
    for (const w of ['B', 'G'] as const) expect(r.view(w)).toMatchObject({ phase: 'results', scores: { B: 700, G: 100 } });
  });

  it('the host’s phone away: not gone till the grace is over (よみおわった till then), then anyone’s つぎへ; a phone that sees it gone a moment later follows then', () => {
    const p = room();
    const u0 = started(p);
    p.now = u0 + 4000;
    p.here.delete('A');
    p.presence();
    p.act('B', (x, n) => x.answer(0, false, n));
    p.act('G', (x, n) => x.answer(0, false, n));
    p.now = u0 + 4000 + WINDOWS.hostGrace - 1;
    p.tick();
    expect(p.view('B')).toMatchObject({ phase: 'reveal', i: 0, canNext: false, canReady: true });
    expect(p.s.B.next(p.now)).toEqual([]);
    p.now += 1;
    p.tick();
    expect(p.view('B')).toMatchObject({ phase: 'reveal', i: 0, canNext: true, canReady: false });
    p.act('B', (x, n) => x.next(n));
    expect(p.view('G')).toMatchObject({ phase: 'lead', i: 1, from: p.now });
    // G hears of the host's going 5 s after B: B's つぎへ comes before G sees it gone, and G follows once it does
    const q = room();
    const t0 = started(q);
    q.now = t0 + 4000;
    for (const w of ALL) q.act(w, (x, n) => x.answer(0, false, n));
    q.here.delete('A');
    q.s.B.presence(['G'], q.now);
    q.now += 5000;
    q.s.G.presence(['B'], q.now);
    q.now = t0 + 4000 + WINDOWS.hostGrace;
    expect(q.view('B').canNext).toBe(true);
    expect(q.view('G').canNext).toBe(false);
    q.act('B', (x, n) => x.next(n));
    const s1 = q.now;
    expect(q.view('B')).toMatchObject({ phase: 'lead', i: 1 });
    expect(q.view('G')).toMatchObject({ phase: 'reveal', i: 0 });
    q.now += 5000;
    q.tick();
    expect(q.view('G')).toMatchObject({ i: 1, playAt: s1 + WINDOWS.lead });
  });

  it('the host gone during a reveal and back: the players moved on, its phone (still in that reveal) adopts their つぎへ, nobody goes back', () => {
    const r = room();
    const s0 = started(r);
    r.now = s0 + 4000;
    for (const w of ALL) r.act(w, (x, n) => x.answer(0, false, n));
    r.here.delete('A');
    r.presence();
    r.now += WINDOWS.hostGrace;
    r.tick();
    r.act('B', (x, n) => x.next(n));
    const s1 = r.now;
    for (const w of ['B', 'G'] as const) expect(r.view(w)).toMatchObject({ phase: 'lead', i: 1, from: s1 });
    expect(r.view('A')).toMatchObject({ phase: 'reveal', i: 0 }); // its phone asleep
    r.now = s1 + 10_000;
    r.here.add('A');
    const n = r.sent.length;
    r.presence();
    for (const w of ALL) expect(r.view(w)).toMatchObject({ i: 1, playAt: s1 + WINDOWS.lead });
    expect(r.sent.slice(n)).toContainEqual({ from: 'A', m: expect.objectContaining({ op: 'skip', i: 1, at: s1 }) });
    // and its clock again: its つぎへ moves everyone
    r.now += ANSWER;
    r.act('A', (x, n) => x.next(n));
    for (const w of ALL) expect(r.view(w)).toMatchObject({ phase: 'lead', i: 2, from: r.now });
  });

  it('a player’s leave mid-game: the others don’t wait for them', () => {
    const q = room();
    const t0 = started(q);
    q.now = t0 + 4000;
    q.act('A', (x, n) => x.answer(0, false, n));
    q.act('B', (x, n) => x.answer(0, false, n));
    expect(q.view('A').phase).toBe('answer');
    q.act('G', (x, n) => x.leave(n));
    expect(q.view('A').phase).toBe('reveal');
    expect(q.view('B').phase).toBe('reveal');
    expect(q.sent.at(-1)!.m).toMatchObject({ op: 'leave' });
    expect(q.view('B').players.map((p) => p.who)).toEqual(['A', 'B']);
  });

  it('a phone back from a lock rejoins: the host sends open, go and its position again, the others their join and their answer to the question under way', () => {
    const r = room();
    const s0 = started(r);
    // G locks at question 0; the others play on
    r.here.delete('G');
    r.presence();
    r.now = s0 + 4000;
    r.act('A', (x, n) => x.answer(0, false, n));
    r.act('B', (x, n) => x.answer(0, false, n));
    expect(r.view('A').phase).toBe('reveal'); // G away: not waited for
    r.act('A', (x, n) => x.next(n));
    const s1 = r.now;
    r.now = s1 + OPEN + 1000;
    r.act('A', (x, n) => x.answer(0, false, n));
    expect(r.view('G')).toMatchObject({ phase: 'answer', i: 0 }); // G's phone, asleep: still question 0
    r.now = s1 + 10_000;
    r.here.add('G');
    const n = r.sent.length;
    r.presence();
    const re = r.sent.slice(n).map((x) => [x.from, x.m.op]);
    expect(re.slice(0, 4)).toEqual([['A', 'open'], ['A', 'go'], ['A', 'skip'], ['A', 'a']]);
    expect(re).toContainEqual(['B', 'join']);
    expect(re).toContainEqual(['G', 'join']);
    expect(r.sent.slice(n)[2].m).toMatchObject({ i: 1, at: s1 });
    // G: question 1 began 10 s ago, its clip too: sat out; A answered (re-sent to it), B hasn't
    expect(r.view('G')).toMatchObject({ phase: 'answer', i: 1, out: true });
    expect(r.view('G').players.find((p) => p.who === 'A')!.answered).toBe(true);
    r.act('B', (x, n) => x.answer(1, false, n));
    expect(r.view('G')).toMatchObject({ phase: 'reveal', i: 1 }); // not waiting for itself
    // the others can't know G sits it out (a lock, not a join): theirs waits for its time limit, or つぎへ
    expect(r.view('A')).toMatchObject({ phase: 'answer', i: 1 });
    r.now = s1 + OPEN + ANSWER;
    r.act('A', (x, n) => x.next(n));
    for (const w of ALL) expect(r.view(w)).toMatchObject({ phase: 'lead', i: 2, out: false });
  });

  it('rejoin during an untimed reveal: back in the same reveal, my answer and よみおわった re-sent; or, the host gone on, its question shown with the others’ answers', () => {
    const r = room();
    const s0 = started(r);
    r.now = s0 + 4000;
    for (const w of ALL) r.act(w, (x, n) => x.answer(0, false, n));
    r.act('G', (x, n) => x.ready(n));
    r.act('B', (x, n) => x.ready(n));
    r.here.delete('B');
    r.presence();
    expect(r.view('A').ready).toEqual({ n: 1, of: 1 }); // B away: not counted
    r.now += 60_000;
    r.here.add('B');
    const n = r.sent.length;
    r.presence();
    expect(r.view('B')).toMatchObject({ phase: 'reveal', i: 0, canReady: true });
    expect(r.view('B').answers[0]).toMatchObject({ k: 0 });
    expect(r.sent.slice(n)).toContainEqual({ from: 'B', m: expect.objectContaining({ op: 'a', i: 0 }) });
    expect(r.sent.slice(n)).toContainEqual({ from: 'B', m: expect.objectContaining({ op: 'skip', i: 0, at: s0 }) });
    expect(r.view('A').ready).toEqual({ n: 2, of: 2 });
    r.act('A', (x, n) => x.next(n));
    // B locks in question 1's reveal; the host goes on to 2, A and G answer it; B back 10 s into it
    r.now += OPEN + 500;
    for (const w of ALL) r.act(w, (x, n) => x.answer(1, false, n));
    r.here.delete('B');
    r.presence();
    r.now += 20_000;
    r.act('A', (x, n) => x.next(n));
    const s2 = r.now;
    r.now += OPEN + 500;
    r.act('A', (x, n) => x.answer(2, false, n));
    r.act('G', (x, n) => x.answer(3, false, n));
    expect(r.view('A')).toMatchObject({ phase: 'reveal', i: 2 });
    expect(r.view('B')).toMatchObject({ phase: 'reveal', i: 1 });
    r.now = s2 + 10_000;
    r.here.add('B');
    r.presence();
    // sat out (its clip long begun), and in the others' reveal with their answers re-sent to it
    expect(r.view('B')).toMatchObject({ phase: 'reveal', i: 2, out: true, canReady: true });
    expect(r.view('B').players.map((p) => p.pick?.k)).toEqual([2, undefined, 3]);
    expect(r.view('B').had[2]).toBe(false);
  });

  it('a phone that comes later sees the game going and joins at its next question; the host’s end cancels it', () => {
    const r = room(['A', 'B']);
    const s0 = started(r, ['B']);
    const g = make({ me: 'G', deckOf: () => deck });
    r.now = s0 + 8000;
    // G opens the app: everyone's presence, the host's re-sends reach it
    g.presence(['A', 'B'], r.now);
    for (const x of r.s.A.presence(['B', 'G'], r.now)) g.receive({ ...x, v: 3, who: 'A', t: r.now } as QuizIn, r.now);
    expect(g.view(r.now)).toMatchObject({ phase: 'idle', invite: { host: 'A', started: true } });
    const join = g.join(r.now);
    expect(join).toEqual([{ kind: 'quiz', g: expect.any(String), op: 'join' }]);
    expect(g.view(r.now)).toMatchObject({ phase: 'answer', i: 0, out: true });
    // the host's つぎへ: question 1, G in it
    r.now += 1000;
    g.receive({ kind: 'quiz', g: join[0].g, op: 'skip', i: 1, at: r.now, v: 3, who: 'A', t: r.now }, r.now);
    expect(g.view(r.now)).toMatchObject({ phase: 'lead', i: 1, out: false });
    // the host cancels
    g.receive({ kind: 'quiz', g: join[0].g, op: 'end', v: 3, who: 'A', t: r.now }, r.now);
    expect(g.view(r.now)).toMatchObject({ phase: 'idle', notice: 'cancelled' });
  });

  it('ignores what isn’t the host’s (a go or end from a player; a player’s skip is its よみおわった, never a position), a game unknown, and my own echo', () => {
    const r = room();
    started(r);
    const g = (r.sent[0].m as { g: string }).g;
    const now = r.now;
    expect(r.s.B.receive({ kind: 'quiz', g, op: 'end', v: 3, who: 'G', t: now }, now)).toEqual([]);
    expect(r.s.B.receive({ kind: 'quiz', g, op: 'go', at: now, v: 3, who: 'G', t: now }, now)).toEqual([]);
    expect(r.s.B.receive({ kind: 'quiz', g, op: 'skip', i: 3, at: now, v: 3, who: 'G', t: now }, now)).toEqual([]);
    expect(r.s.B.receive({ kind: 'quiz', g: 'zzzz', op: 'a', i: 0, k: 0, rp: false, s: 100, v: 3, who: 'G', t: now }, now)).toEqual([]);
    expect(r.s.B.receive({ kind: 'quiz', g, op: 'end', v: 3, who: 'B', t: now }, now)).toEqual([]);
    expect(r.view('B').phase).toBe('countdown');
  });
});

describe('ききみみ session: the host is the clock', () => {
  it('the host beacons its position when it changes and every few seconds while a game runs, never in the lobby or once over', () => {
    const r = room(['A', 'B']);
    r.act('A', (x, n) => x.open({ lv: 1 }, n));
    r.act('A', (x, n) => x.invite(n));
    r.act('B', (x, n) => x.join(n));
    expect(r.s.A.tick(r.now)).toEqual([]); // the lobby
    r.act('A', (x, n) => x.go(n));
    const s0 = r.now + WINDOWS.countdown;
    expect(r.s.A.tick(r.now)).toEqual([]); // just sent (the go)
    r.now += WINDOWS.beacon;
    expect(r.s.A.tick(r.now)).toEqual([{ kind: 'quiz', g: expect.any(String), op: 'skip', i: 0, at: s0 }]);
    expect(r.s.B.tick(r.now)).toEqual([]); // a player never beacons
    // an untimed reveal: the same position every few seconds
    r.now = s0 + OPEN + ANSWER + 100;
    expect(r.s.A.tick(r.now)).toMatchObject([{ op: 'skip', i: 0, at: s0 }]);
    expect(r.s.A.tick(r.now + 100)).toEqual([]);
    // つぎへ: sent at once, then the beacon's rhythm
    r.act('A', (x, n) => x.next(n));
    expect(r.sent.at(-1)!.m).toMatchObject({ op: 'skip', i: 1, at: r.now });
    expect(r.s.A.tick(r.now + 100)).toEqual([]);
    expect(r.s.A.tick(r.now + WINDOWS.beacon)).toMatchObject([{ op: 'skip', i: 1 }]);
    onTo(r, r.now, 7);
    expect(r.view('A').phase).toBe('results');
    expect(r.s.A.tick(r.now + WINDOWS.beacon)).toEqual([]); // over
  });

  it('back from a lock: the host’s position is adopted, the question it’s in shown (its clip long begun: sat out), never an old one', () => {
    const r = room();
    const s0 = started(r);
    r.here.delete('G');
    r.presence();
    // A and B answer quickly and go on: G's phone, asleep, is still in question 0
    let t = s0;
    for (let i = 0; i < 4; i++) {
      r.now = t + 5000;
      r.act('A', (x, n) => x.answer(0, false, n));
      r.act('B', (x, n) => x.answer(0, false, n));
      r.now += 3000;
      r.act('A', (x, n) => x.next(n));
      t = r.now;
    }
    r.now = t + 10_000; // question 4 began 10 s ago
    expect(r.view('A')).toMatchObject({ i: 4 });
    expect(r.view('G')).toMatchObject({ i: 0 });
    r.here.add('G');
    r.presence();
    expect(r.view('G')).toMatchObject({ i: 4, out: true, from: r.view('A').from });
    expect(r.s.G.answer(0, false, r.now)).toEqual([]);
    // (A and B answer, but G, back and here, can't: its time limit, then つぎへ)
    r.act('A', (x, n) => x.answer(0, false, n));
    r.act('B', (x, n) => x.answer(0, false, n));
    expect(r.view('A').phase).toBe('answer');
    r.now = t + OPEN + ANSWER;
    r.act('A', (x, n) => x.next(n));
    expect(r.view('G')).toMatchObject({ phase: 'lead', i: 5, out: false });
  });

  it('`had`: the questions I was in (answered, or in the game as its clip began): none before a mid-game join, none slept through, the ones answered before a lock kept', () => {
    const r = room(['A', 'B', 'G']);
    r.act('A', (x, n) => x.open({ lv: 1 }, n));
    r.act('A', (x, n) => x.invite(n));
    r.act('B', (x, n) => x.join(n));
    r.act('A', (x, n) => x.go(n));
    const s0 = r.now + WINDOWS.countdown;
    // G joins as question 0's clip has begun: in from question 1
    r.now = s0 + OPEN + 500;
    r.act('G', (x, n) => x.join(n));
    expect(r.view('G').had).toEqual([false, true, true, true, true, true, true, true]);
    // B answers question 0, lets question 1 time out, then sleeps through 2-3 (A plays on with G)
    r.act('A', (x, n) => x.answer(0, false, n));
    r.act('B', (x, n) => x.answer(0, false, n));
    r.act('A', (x, n) => x.next(n));
    const s1 = r.now;
    r.now = s1 + OPEN + 500;
    r.act('A', (x, n) => x.answer(1, false, n));
    r.act('G', (x, n) => x.answer(1, false, n));
    r.now = s1 + OPEN + ANSWER + 1000; // question 1's reveal; B's phone locks
    r.here.delete('B');
    r.presence();
    r.act('A', (x, n) => x.next(n));
    let t = r.now;
    for (let i = 2; i < 4; i++) {
      r.now = t + 5000;
      r.act('A', (x, n) => x.answer(0, false, n));
      r.act('G', (x, n) => x.answer(0, false, n));
      r.act('A', (x, n) => x.next(n));
      t = r.now;
    }
    r.now = t + 10_000; // question 4's clip long begun
    r.here.add('B');
    r.presence();
    expect(r.view('B')).toMatchObject({ i: 4, out: true });
    expect(r.view('B').had.slice(0, 5)).toEqual([true, false, false, false, false]);
    expect(r.view('B').had.slice(5)).toEqual([true, true, true]);
  });

  it('the host locked: the players stay in its reveal (no racing ahead), and its clock again when it’s back', () => {
    const r = room();
    const s0 = started(r);
    r.now = s0 + 1000;
    r.here.delete('A');
    r.presence();
    r.now = s0 + 4000;
    r.act('B', (x, n) => x.answer(0, false, n));
    r.act('G', (x, n) => x.answer(0, false, n));
    expect(r.view('B')).toMatchObject({ phase: 'reveal', i: 0 });
    r.now = s0 + 12_000;
    r.tick();
    expect(r.view('B')).toMatchObject({ phase: 'reveal', i: 0, canNext: false });
    // back within the grace: its position, then its つぎへ
    r.here.add('A');
    r.presence();
    for (const w of ALL) expect(r.view(w)).toMatchObject({ i: 0 });
    r.now = s0 + OPEN + ANSWER;
    r.act('A', (x, n) => x.next(n));
    for (const w of ALL) expect(r.view(w)).toMatchObject({ i: 1, phase: 'lead', from: r.now });
  });

  it('my own phone’s short disconnect isn’t the host gone: no early reveal, no つぎへ of mine', () => {
    const r = room();
    const s0 = started(r);
    r.now = s0 + 4000;
    r.act('B', (x, n) => x.answer(0, false, n));
    r.now = s0 + 5000;
    expect(r.s.B.presence(null, r.now)).toEqual([]); // B's socket down: who's here unknown, not gone
    expect(r.view('B')).toMatchObject({ phase: 'answer', i: 0 });
    r.now = s0 + OPEN + ANSWER;
    r.s.B.tick(r.now);
    expect(r.view('B')).toMatchObject({ phase: 'reveal', i: 0, canNext: false }); // the time limit
    r.now += WINDOWS.hostGrace + 1000;
    expect(r.view('B')).toMatchObject({ phase: 'reveal', i: 0, canNext: false });
    // back: B's join again, and its answer (the others may have missed what it sent)
    expect(r.s.B.presence(['A', 'G'], r.now)).toEqual([{ kind: 'quiz', g: expect.any(String), op: 'join' }, expect.objectContaining({ op: 'a', i: 0, k: 0 })]);
  });

  it('the host’s socket replaced in the room unseen (no presence off and on for the others): its re-sent go brings the answers it missed', () => {
    // an untimed game (なし): the reveal waits for every answer, so a host that missed one waited for ever
    const r = room(['A', 'B', 'G']);
    const s0 = started(r, ['B', 'G'], 0);
    r.now = s0 + OPEN + 1000;
    r.act('A', (x, n) => x.answer(0, false, n));
    // A's socket dies quietly; B and G answer into it (A hears nothing), and their presence never changes
    expect(r.s.A.presence(null, r.now)).toEqual([]);
    r.act('B', (x, n) => x.answer(1, false, n), ['A']);
    r.act('G', (x, n) => x.answer(0, false, n), ['A']);
    expect(r.view('B')).toMatchObject({ phase: 'reveal', i: 0 });
    expect(r.view('A')).toMatchObject({ phase: 'answer', i: 0 });
    // A's new socket replaces the old one: only A sees everyone back, and re-sends its open, go and position
    r.now += 2000;
    r.deliver('A', r.s.A.presence(['B', 'G'], r.now));
    expect(r.view('A')).toMatchObject({ phase: 'reveal', i: 0 });
    expect(r.view('A').players.map((p) => p.answered)).toEqual([true, true, true]);
    // and the re-sends settle (nothing goes round and round)
    const n = r.sent.length;
    r.deliver('A', r.s.A.presence(['B', 'G'], r.now));
    expect(r.sent.length).toBe(n);
  });

  it('a lobby’s host back with its socket replaced: a join it missed comes again with its re-sent open', () => {
    const r = room(['A', 'B']);
    r.act('A', (x, n) => x.open({ lv: 1 }, n));
    r.act('A', (x, n) => x.invite(n));
    r.s.A.presence(null, r.now);
    r.act('B', (x, n) => x.join(n), ['A']);
    expect(r.view('A').players.map((p) => p.who)).toEqual(['A']);
    r.deliver('A', r.s.A.presence(['B'], r.now));
    expect(r.view('A').players.map((p) => p.who)).toEqual(['A', 'B']);
  });

  it('the host’s つぎへ on the last question ends the game on every phone', () => {
    const q = room(['A', 'B']);
    const t0 = started(q, ['B']);
    const t7 = onTo(q, t0, 7);
    q.now = t7 + OPEN + ANSWER + 5000; // the last reveal
    q.act('A', (x, n) => x.next(n));
    expect(q.sent.at(-1)!.m).toMatchObject({ op: 'skip', i: 8, at: q.now });
    expect(q.view('A').phase).toBe('results');
    expect(q.view('B').phase).toBe('results');
  });
});

describe('ききみみ session: the wiring', () => {
  it('the link and the wiring: game intents and who’s here in, the outputs sent, the clock the relay’s', () => {
    const subs: ((m: Relayed) => void)[] = [];
    const statusSubs: ((s: LiveStatus) => void)[] = [];
    const out: unknown[] = [];
    let st: LiveStatus = { connected: true, me: 'B', peer: true, here: ['A'] };
    const live = {
      send: (m: unknown) => out.push(m) > 0,
      on: (f: (m: Relayed) => void) => (subs.push(f), () => {}),
      onStatus: (f: (s: LiveStatus) => void) => (statusSubs.push(f), f(st), () => {}),
      serverNow: () => T0
    };
    let changed = 0;
    const { s, w } = wired({ me: 'B', deckOf: () => deck }, live as never, () => changed++);
    expect(changed).toBe(1);
    for (const f of subs) f({ kind: 'walk', to: 'x', v: 3, who: 'A', t: T0 });
    expect(changed).toBe(1); // not a game's
    for (const f of subs) f({ kind: 'quiz', g: 'abcd', op: 'open', seed: 1, lv: 1, same: false, v: 3, who: 'A', t: T0 });
    expect(s.view(T0).invite).toMatchObject({ g: 'abcd' });
    w.act((x, now) => x.join(now));
    expect(out).toEqual([{ kind: 'quiz', g: 'abcd', op: 'join' }]);
    // A's phone back: B sends its join again
    st = { ...st, here: [] };
    for (const f of statusSubs) f(st);
    st = { ...st, here: ['A'] };
    for (const f of statusSubs) f(st);
    expect(out).toHaveLength(2);
    // my own socket down a moment: who's here unknown (nothing), then everyone back to me: my join again
    st = { ...st, connected: false };
    for (const f of statusSubs) f(st);
    expect(out).toHaveLength(2);
    st = { ...st, connected: true };
    for (const f of statusSubs) f(st);
    expect(out).toHaveLength(3);
    // the host's beacon goes out through tick (a player's: nothing)
    w.tick();
    expect(out).toHaveLength(3);
    w.stop();
  });

  it('いっぱつ is a badge: 100 a right answer, おなじへや too (where only the host’s phone can replay), for everyone alike', () => {
    const r = room(['A', 'B']);
    r.act('A', (x, n) => x.open({ lv: 1, same: true }, n));
    r.act('A', (x, n) => x.invite(n));
    r.act('B', (x, n) => x.join(n));
    r.act('A', (x, n) => x.go(n));
    r.now += WINDOWS.countdown + 4000;
    r.act('A', (x, n) => x.answer(0, false, n));
    r.act('B', (x, n) => x.answer(0, false, n));
    expect(r.sent.at(-2)!.m).toMatchObject({ op: 'a', s: 100 });
    expect(r.view('A').scores).toEqual({ A: 100, B: 100 });
    expect(r.view('B').scores).toEqual({ A: 100, B: 100 });
  });
});

const six: TestDeck = { count: 6, dur: () => 2000, answer: (i) => i % 3 };

describe('ききみみ session: a unit’s lesson', () => {
  it('dealt into my lobby kept alone: the game `lesson` (its unit, lesson and tier in its options), the lobby’s seed, level and timer kept; nothing on the wire; back to the quiz the same', () => {
    const s = new QuizRounds({ me: 'A', defs: defsOf(() => six), random: () => 0.5 });
    s.open({ lv: 2, timer: 60 }, T0);
    const seed = s.view(T0).seed;
    expect(s.lesson({ u: 'tr-hotel', lesson: 'check', tier: 'easy' }, T0)).toEqual([]);
    expect(s.view(T0)).toMatchObject({ phase: 'lobby', gm: 'lesson', u: 'tr-hotel', o: [2, 2, 3, 1], seed, lv: 2, timer: 60, ladder: false, n: 6 });
    expect(s.unlesson(T0)).toEqual([]);
    expect(s.view(T0)).toMatchObject({ gm: 'quiz', o: [2, 2], seed, lv: 2, timer: 60 });
    expect(s.view(T0).u).toBeUndefined();
    // a lesson plays as any game: its 6 questions, on its lobby's timer
    s.lesson({ u: 'tr-hotel', lesson: 'deai' }, T0);
    expect(s.view(T0).o).toEqual([2, 2, 1, 0]);
    s.go(T0);
    const q0 = T0 + WINDOWS.countdown;
    expect(s.view(q0 + WINDOWS.lead + 2000)).toMatchObject({ phase: 'answer', i: 0, n: 6, limit: q0 + WINDOWS.lead + 2000 + 60_000 });
    // (only my own lobby, before it starts)
    expect(s.unlesson(q0)).toEqual([]);
  });
});

describe('ききみみ session: an 8c phone’s play', () => {
  it('a play open is an invite like a quiz one (its game, options and flags); joined, my ops go out on the quiz wire', () => {
    const s = new QuizRounds({ me: 'B', defs: defsOf(() => six) });
    s.presence(['A'], T0);
    const open = playIn({ kind: 'play', g: 'abcd', gm: 'quiz', op: 'open', cv: CV, seed: 40, f: 2, o: [3, 1], v: 3, who: 'A', t: T0 })!;
    s.receive(open, T0);
    expect(s.view(T0).invite).toEqual({ g: 'abcd', host: 'A', gm: 'quiz', lv: 3, ladder: false, same: false, started: false });
    expect(s.join(T0).map((m) => toWire(m, 'quiz'))).toEqual([{ kind: 'quiz', g: 'abcd', op: 'join' }]);
    expect(s.view(T0)).toMatchObject({ phase: 'lobby', gm: 'quiz', lv: 3, timer: 20, vs: true, n: 6 });
    // a game this build doesn't know: an update offered, the game I'm in kept
    s.receive(playIn({ kind: 'play', g: 'efgh', gm: 'tile', op: 'open', cv: CV, seed: 40, f: 0, o: [], v: 3, who: 'G', t: T0 })!, T0);
    expect(s.view(T0).g).toBe('abcd');
  });
});

/** Two or three round sessions on the `play` wire (playOut → playIn), each one's ops to the others. */
function playRoom(whos: Who[], deckOf: TestDeckOf = () => six) {
  let now = T0;
  const s = Object.fromEntries(whos.map((w, n) => [w, new QuizRounds({ me: w, defs: defsOf(deckOf), random: seq(n) })])) as Record<Who, QuizRounds>;
  const sent: { from: Who; m: NonNullable<ReturnType<typeof playOut>> }[] = [];
  const deliver = (from: Who, out: RoundOut[]) => {
    for (const m of out) {
      const w = playOut(m);
      if (!w) continue;
      sent.push({ from, m: w });
      for (const to of whos) if (to !== from) deliver(to, s[to].receive(playIn({ ...w, v: 3, who: from, t: now } as Parameters<typeof playIn>[0])!, now));
    }
  };
  for (const w of whos) s[w].presence(whos.filter((x) => x !== w), now);
  return {
    s, sent,
    act: (w: Who, f: (x: QuizRounds, now: number) => RoundOut[]) => deliver(w, f(s[w], now)),
    get now() {
      return now;
    },
    set now(t: number) {
      now = t;
    },
    view: (w: Who) => s[w].view(now)
  };
}

describe('ききみみ session: 8c, the content version', () => {
  const lessonOpen = (cv: string) => playIn({ kind: 'play', g: 'abcd', gm: 'lesson', op: 'open', cv, seed: 40, f: 0, o: [4, 0, 3, 0], u: 'tr-hotel', v: 3, who: 'A', t: T0 })!;

  it('my open carries my cv (play needs one); a quiz open (no cv) is never blocked', () => {
    const r = playRoom(['A', 'B']);
    r.act('A', (x, n) => x.open({ lv: 2 }, n));
    r.act('A', (x, n) => x.invite(n));
    expect(r.sent.at(-1)!.m).toMatchObject({ kind: 'play', gm: 'quiz', op: 'open', cv: CV, o: [2, 0] });
    expect(r.view('B').invite).toMatchObject({ g: r.view('A').g, gm: 'quiz' });
    expect(r.view('B').invite!.blocked).toBeUndefined();
    const q = new QuizRounds({ me: 'B', defs: defsOf(() => six) });
    q.presence(['A'], T0);
    q.receive(quizIn({ kind: 'quiz', g: 'wxyz', op: 'open', seed: 8, lv: 1, same: false, v: 3, who: 'A', t: T0 }), T0);
    expect(q.view(T0).invite).toMatchObject({ g: 'wxyz', gm: 'quiz' });
    expect(q.view(T0).invite!.blocked).toBeUndefined();
  });

  it('a heard open whose cv isn’t mine: an invite blocked (「アプリを こうしんしてね」), さんか refused; the host’s open with my cv lifts it', () => {
    const s = new QuizRounds({ me: 'B', defs: defsOf(() => six) });
    s.presence(['A'], T0);
    s.receive(lessonOpen('ffffff'), T0);
    expect(s.view(T0)).toMatchObject({ phase: 'idle', g: null, invite: { g: 'abcd', host: 'A', gm: 'lesson', u: 'tr-hotel', blocked: 'update', started: false } });
    expect(s.view(T0).invite!.lesson).toBeUndefined();
    expect(s.join(T0)).toEqual([]);
    expect(s.join(T0, 'abcd')).toEqual([]);
    expect(s.view(T0).phase).toBe('idle');
    // started: still an update offered, and gone when its host ends it
    s.receive(playIn({ kind: 'play', g: 'abcd', gm: 'lesson', op: 'go', at: T0 + 4000, pl: 1, v: 3, who: 'A', t: T0 })!, T0);
    expect(s.view(T0).invite).toMatchObject({ blocked: 'update', started: true });
    s.receive(playIn({ kind: 'play', g: 'abcd', gm: 'lesson', op: 'leave', v: 3, who: 'A', t: T0 })!, T0);
    expect(s.view(T0).invite).toBeNull();
    // the same content: offered and joined
    s.receive({ ...lessonOpen(CV), g: 'efgh' }, T0);
    expect(s.view(T0).invite).toMatchObject({ g: 'efgh', gm: 'lesson', u: 'tr-hotel', lesson: 'check' });
    expect(s.view(T0).invite!.blocked).toBeUndefined();
    expect(s.join(T0)).toEqual([{ g: 'efgh', gm: 'lesson', op: 'join' }]);
    // an unknown game on play: an update too
    const t = new QuizRounds({ me: 'B', defs: defsOf(() => six) });
    t.presence(['G'], T0);
    t.receive(playIn({ kind: 'play', g: 'tile', gm: 'tile', op: 'open', cv: CV, seed: 1, f: 0, o: [], v: 3, who: 'G', t: T0 })!, T0);
    expect(t.view(T0).invite).toMatchObject({ gm: 'tile', blocked: 'update' });
  });

  it('a lobby I’m in turned into content I haven’t: left for the update offered; its host gone, the offer goes', () => {
    const r = playRoom(['A', 'B']);
    r.act('A', (x, n) => x.open({ lv: 4 }, n));
    r.act('A', (x, n) => x.invite(n));
    r.act('B', (x, n) => x.join(n));
    const g = r.view('A').g!;
    expect(r.view('B')).toMatchObject({ phase: 'lobby', g });
    r.s.B.receive(playIn({ kind: 'play', g, gm: 'lesson', op: 'open', cv: '000000', seed: 40, f: 0, o: [4, 0, 3, 0], u: 'tr-new', v: 3, who: 'A', t: T0 })!, T0);
    expect(r.view('B')).toMatchObject({ phase: 'idle', g: null, notice: null, invite: { g, blocked: 'update', u: 'tr-new' } });
    r.s.B.presence([], T0 + 1000);
    r.now = T0 + 1000 + WINDOWS.hostGrace;
    expect(r.view('B').invite).toBeNull();
  });
});

describe('ききみみ session: 8c, roles from `pl`', () => {
  it('go carries the players at the start; every phone has the same roles from it (a late joiner: their place among those and them)', () => {
    const r = playRoom(['A', 'B', 'G']);
    r.act('A', (x, n) => x.open({ lv: 1 }, n));
    r.act('A', (x, n) => x.invite(n));
    r.act('G', (x, n) => x.join(n));
    expect(r.view('A').roles).toEqual({});
    r.act('A', (x, n) => x.go(n));
    expect(r.sent.at(-1)!.m).toMatchObject({ op: 'go', pl: 5 });
    for (const w of ['A', 'G'] as const) expect(r.view(w).roles).toEqual({ A: 0, G: 1 });
    r.act('B', (x, n) => x.join(n, r.view('A').g!));
    for (const w of ['A', 'B', 'G'] as const) expect(r.view(w).roles).toEqual({ A: 0, B: 1, G: 1 });
  });
});

describe('ききみみ session: 8c, a co-op lesson', () => {
  it('each player at their own tier (the host’s in the options, a player’s on their join): their own choices over the same rounds, graded so on every phone; the team’s first listens the same on both', () => {
    const r = playRoom(['A', 'B']);
    r.act('A', (x, n) => x.open({ lv: 4 }, n));
    r.act('A', (x, n) => x.invite(n));
    r.act('B', (x, n) => x.join(n, undefined, 2));
    expect(r.sent.at(-1)!.m).toEqual({ kind: 'play', g: r.view('A').g, gm: 'quiz', op: 'join' }); // (a quiz has no tiers)
    r.act('A', (x, n) => x.lesson({ u: 'tr-hotel', lesson: 'check', tier: 'easy' }, n));
    expect(r.sent.at(-1)!.m).toMatchObject({ gm: 'lesson', op: 'open', u: 'tr-hotel', o: [4, 0, 3, 1], cv: CV });
    expect(r.view('B')).toMatchObject({ phase: 'lobby', gm: 'lesson', o: [4, 0, 3, 1] });
    // B's tier for the lesson: its join again
    r.act('B', (x, n) => x.tier(2, n));
    expect(r.sent.at(-1)!.m).toMatchObject({ gm: 'lesson', op: 'join', tr: 2 });
    expect(r.s.B.tier(2, r.now)).toEqual([]);
    expect(r.view('B').o).toEqual([4, 0, 3, 2]);
    expect(r.view('A').o).toEqual([4, 0, 3, 1]);
    r.act('A', (x, n) => x.go(n));
    let t = T0 + WINDOWS.countdown;
    // A (easy: question i's right choice (i % 3 + 1) % 3) all right; B (hard: (i % 3 + 2) % 3) right only on 0 and 1
    for (let i = 0; i < 6; i++) {
      r.now = t + WINDOWS.lead + 2000 + 100;
      r.act('A', (x, n) => x.answer(((i % 3) + 1) % 3, false, n));
      r.act('B', (x, n) => x.answer(i < 2 ? ((i % 3) + 2) % 3 : ((i % 3) + 1) % 3, false, n));
      expect(r.view('A').players.map((p) => [p.who, p.pick?.ok])).toEqual([['A', true], ['B', i < 2]]);
      expect(r.view('B').players.map((p) => [p.who, p.pick?.ok])).toEqual([['A', true], ['B', i < 2]]);
      r.now += 1000;
      r.act('A', (x, n) => x.next(n));
      t = r.now;
    }
    for (const w of ['A', 'B'] as const) expect(r.view(w)).toMatchObject({ phase: 'results', teamFirst: 6, team: { right: 6, all: 2, done: 6 }, scores: { A: 600, B: 200 } });
  });
});
