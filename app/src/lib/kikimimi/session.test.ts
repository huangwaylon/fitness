import { describe, expect, it } from 'vitest';
import { FAST_WINDOWS, QuizSession, WINDOWS, points, quizLink, wireQuiz, type QuizDeck, type QuizIn, type QuizOut } from './session.ts';
import type { LiveStatus } from '../sync/live.ts';
import type { Relayed, Who } from '../contract/live-protocol.ts';

/** 8 questions, each clip 2 s, question i's right choice i % 4. */
const DUR = 2000;
const deck: QuizDeck = { count: 8, dur: () => DUR, answer: (i) => i % 4 };
const FULL = WINDOWS.lead + DUR + WINDOWS.answer + WINDOWS.reveal; // 26.5 s
const T0 = 1_793_527_000_000;

/** Three phones on one fake relay: each one's outputs go to the others here (unless dropped). */
function room(whos: Who[] = ['A', 'B', 'G']) {
  let now = T0;
  const s = Object.fromEntries(whos.map((w, n) => [w, new QuizSession({ me: w, deckOf: () => deck, random: seq(n) })])) as Record<Who, QuizSession>;
  const here = new Set<Who>(whos);
  const sent: { from: Who; m: QuizOut }[] = [];
  /** Deliver `out` from `from` to everyone else here (drop: those who don't hear it). */
  const deliver = (from: Who, out: QuizOut[], drop: Who[] = []) => {
    for (const m of out) {
      sent.push({ from, m });
      for (const w of here) if (w !== from && !drop.includes(w)) deliver(w, s[w].receive({ ...m, v: 3, who: from, t: now } as QuizIn, now));
    }
  };
  const act = (w: Who, f: (x: QuizSession, now: number) => QuizOut[], drop: Who[] = []) => deliver(w, f(s[w], now), drop);
  /** Everyone's status: a phone away hears nobody (its socket's down), and what it sends goes nowhere. */
  const presence = () => {
    for (const w of whos) {
      const out = s[w].presence(here.has(w) ? [...here].filter((x) => x !== w) : [], now);
      if (here.has(w)) deliver(w, out);
    }
  };
  presence();
  return {
    s, sent, here, act, deliver, presence,
    get now() {
      return now;
    },
    set now(t: number) {
      now = t;
    },
    view: (w: Who) => s[w].view(now)
  };
}

/** A fixed random: game ids and seeds the same each run. */
function seq(n: number) {
  let x = 0.123 + n * 0.1;
  return () => (x = (x * 9301 + 0.49297) % 1);
}

/** Open (A hosts), B and G join, A starts: returns question 0's start. */
function started(r: ReturnType<typeof room>, joiners: Who[] = ['B', 'G']): number {
  r.act('A', (x, n) => x.open({ lv: 1 }, n));
  for (const w of joiners) r.act(w, (x, n) => x.join(n));
  r.act('A', (x, n) => x.go(n));
  return r.now + WINDOWS.countdown;
}

describe('ききみみ session: the lobby', () => {
  it('an open is an invite to the others; さんか joins; the host sees who joined; level and おなじへや change by a new open', () => {
    const r = room();
    expect(r.view('B').phase).toBe('idle');
    r.act('A', (x, n) => x.open({ lv: 2, same: true }, n));
    const open = r.sent[0].m as QuizOut & { op: 'open' };
    expect(open).toMatchObject({ kind: 'quiz', op: 'open', lv: 2, same: true });
    expect(open.g).toMatch(/^[a-z0-9]{6}$/);
    expect(open.seed).toBeGreaterThanOrEqual(0);
    expect(open.seed).toBeLessThan(2 ** 32);
    expect(r.view('A')).toMatchObject({ phase: 'lobby', amHost: true, g: open.g, players: [{ who: 'A' }], speaks: true, invite: null });
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

  it('the host leaving its lobby cancels it (end); a player leaving just goes', () => {
    const r = room();
    r.act('A', (x, n) => x.open({ lv: 1 }, n));
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
    r.act('A', (x, n) => x.open({ lv: 1 }, n));
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
    expect(r.sent.slice(n).map((x) => [x.from, x.m.op])).toEqual([['A', 'open'], ['B', 'join']]);
    expect(r.view('G').invite).not.toBeNull();
    // gone for good
    r.here.delete('A');
    r.presence();
    r.now += WINDOWS.hostGrace;
    expect(r.view('B')).toMatchObject({ phase: 'idle', notice: 'host-left' });
    expect(r.view('G').invite).toBeNull();
    // never started: 10 minutes
    const q = room();
    q.act('A', (x, n) => x.open({ lv: 1 }, n));
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
  it('go: a 3-2-1, then each question lead, play, answer, reveal on the computed schedule, the same on every phone', () => {
    const r = room();
    const s0 = started(r);
    expect(r.sent.at(-1)!.m).toEqual({ kind: 'quiz', g: expect.any(String), op: 'go', at: s0 });
    for (const w of ['A', 'B', 'G'] as const) expect(r.view(w)).toMatchObject({ phase: 'countdown', i: -1, from: T0, until: s0 });
    r.now = s0;
    expect(r.view('B')).toMatchObject({ phase: 'lead', i: 0, from: s0, until: s0 + 1500, playAt: s0 + 1500, playEnd: s0 + 3500, limit: s0 + 18_500, out: false });
    r.now = s0 + 1500;
    expect(r.view('G').phase).toBe('play');
    r.now = s0 + 3500;
    expect(r.view('A')).toMatchObject({ phase: 'answer', until: s0 + 18_500 });
    r.now = s0 + 18_500;
    expect(r.view('A')).toMatchObject({ phase: 'reveal', until: s0 + FULL, canNext: true });
    expect(r.view('B').canNext).toBe(false);
    r.now = s0 + FULL;
    expect(r.view('B')).toMatchObject({ phase: 'lead', i: 1 });
    r.now = s0 + 8 * FULL - 1;
    expect(r.view('B')).toMatchObject({ phase: 'reveal', i: 7 });
    r.now = s0 + 8 * FULL;
    for (const w of ['A', 'B', 'G'] as const) expect(r.view(w)).toMatchObject({ phase: 'results', scores: { A: 0, B: 0, G: 0 } });
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

  it('answers: in the answer window only, once; a ✓ for each, the choice only at the reveal; scored 100 + 30 without a replay', () => {
    const r = room();
    const s0 = started(r);
    r.now = s0 + 2000; // playing
    expect(r.s.B.answer(0, false, r.now)).toEqual([]);
    r.now = s0 + 4000;
    r.act('B', (x, n) => x.answer(0, false, n));
    expect(r.sent.at(-1)!.m).toMatchObject({ op: 'a', i: 0, k: 0, rp: false, s: 130 });
    expect(r.s.B.answer(1, false, r.now)).toEqual([]); // final
    const chips = r.view('A').players;
    expect(chips.find((p) => p.who === 'B')).toEqual({ who: 'B', here: true, answered: true, score: 130 });
    expect(chips.find((p) => p.who === 'G')).toMatchObject({ answered: false });
    r.act('G', (x, n) => x.answer(0, true, n)); // right, replayed
    r.act('A', (x, n) => x.answer(2, false, n)); // wrong
    const v = r.view('G');
    expect(v.phase).toBe('reveal'); // everyone in: the reveal at once
    expect(v.players.map((p) => [p.who, p.pick, p.score])).toEqual([['A', { k: 2, ok: false }, 0], ['B', { k: 0, ok: true }, 130], ['G', { k: 0, ok: true }, 100]]);
    expect(v.answers[0]).toEqual({ k: 0, rp: true, t: r.now });
    expect(points(true, false)).toBe(130);
    expect(points(true, true)).toBe(100);
    expect(points(false, false)).toBe(0);
  });

  it('everyone answered: the reveal now, and the host skips the next question to its end (8 s on); つぎへ sooner', () => {
    const r = room();
    const s0 = started(r);
    r.now = s0 + 5000;
    for (const w of ['A', 'B', 'G'] as const) r.act(w, (x, n) => x.answer(0, false, n));
    const skip = r.sent.at(-1)!;
    expect(skip).toMatchObject({ from: 'A', m: { op: 'skip', i: 1, at: s0 + 5000 + 8000 } });
    for (const w of ['A', 'B', 'G'] as const) expect(r.view(w)).toMatchObject({ phase: 'reveal', i: 0, from: s0 + 5000, until: s0 + 13_000 });
    r.now = s0 + 13_000;
    expect(r.view('B')).toMatchObject({ phase: 'lead', i: 1 });
    // question 1: the host's つぎへ in its reveal (B away from the phone: the time limit)
    r.now = s0 + 13_000 + 1500 + DUR + WINDOWS.answer + 1000;
    expect(r.view('B')).toMatchObject({ phase: 'reveal', i: 1 });
    expect(r.s.B.next(r.now)).toEqual([]); // the host's only
    r.act('A', (x, n) => x.next(n));
    expect(r.sent.at(-1)!.m).toMatchObject({ op: 'skip', i: 2, at: r.now });
    for (const w of ['A', 'B', 'G'] as const) expect(r.view(w)).toMatchObject({ phase: 'lead', i: 2, from: r.now });
  });

  it('the last question: everyone in, the results after its reveal; the host’s つぎへ, its results at once', () => {
    const r = room();
    const s0 = started(r);
    const s7 = s0 + 7 * FULL;
    r.now = s7 + 4000;
    for (const w of ['A', 'B', 'G'] as const) r.act(w, (x, n) => x.answer(3, false, n));
    expect(r.sent.at(-1)!.m.op).toBe('a'); // no skip past the end
    r.now = s7 + 4000 + WINDOWS.reveal;
    for (const w of ['A', 'B', 'G'] as const) expect(r.view(w)).toMatchObject({ phase: 'results', scores: { A: 130, B: 130, G: 130 } });
    const q = room(['A', 'B']);
    const t0 = started(q, ['B']);
    q.now = t0 + 7 * FULL + 19_000; // the reveal
    q.act('A', (x, n) => x.next(n));
    expect(q.view('A').phase).toBe('results');
    expect(q.view('B').phase).toBe('reveal');
  });

  it('solo: one player, the same game', () => {
    const r = room(['A']);
    const s0 = started(r, []);
    let t = s0;
    for (let i = 0; i < 8; i++) {
      r.now = t + 1500 + DUR + 1000;
      expect(r.view('A')).toMatchObject({ phase: 'answer', i });
      r.act('A', (x, n) => x.answer(i % 4, i === 3, n));
      expect(r.view('A').phase).toBe('reveal');
      t = r.now + WINDOWS.reveal;
    }
    r.now = t;
    expect(r.view('A')).toMatchObject({ phase: 'results', scores: { A: 7 * 130 + 100 }, players: [{ who: 'A', score: 1010 }] });
    expect(r.sent.filter((x) => x.m.op === 'skip').map((x) => (x.m as { i: number }).i)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('the fast windows (?kikimimi=fast) shorten the answer and the reveal', () => {
    const s = new QuizSession({ me: 'A', deckOf: () => deck, windows: FAST_WINDOWS });
    s.open({ lv: 1 }, T0);
    s.go(T0);
    const s0 = T0 + WINDOWS.countdown;
    expect(s.view(s0 + 1500 + DUR + FAST_WINDOWS.answer)).toMatchObject({ phase: 'reveal' });
    expect(s.view(s0 + 1500 + DUR + FAST_WINDOWS.answer + FAST_WINDOWS.reveal)).toMatchObject({ phase: 'lead', i: 1 });
  });
});

describe('ききみみ session: lost and late messages', () => {
  it('a lost `a`: the reveal waits for the time limit there, and the next `a`’s running total puts the score right', () => {
    const r = room();
    const s0 = started(r);
    r.now = s0 + 4000;
    r.act('A', (x, n) => x.answer(0, false, n));
    r.act('G', (x, n) => x.answer(0, false, n));
    r.act('B', (x, n) => x.answer(0, false, n), ['G']); // G never hears B's
    expect(r.view('G').players.find((p) => p.who === 'B')).toMatchObject({ answered: false, score: 0 });
    // the host's skip still reaches G: its reveal now, to the skip
    expect(r.view('G')).toMatchObject({ phase: 'reveal', from: s0 + 4000, until: s0 + 12_000 });
    // without the skip (A's phone gone), G's reveal would wait for the time limit
    const q = room();
    const t0 = started(q);
    q.here.delete('A');
    q.presence();
    q.now = t0 + 4000;
    q.act('G', (x, n) => x.answer(0, false, n));
    q.act('B', (x, n) => x.answer(0, false, n), ['G']);
    expect(q.view('G')).toMatchObject({ phase: 'answer', until: t0 + 3500 + WINDOWS.answer });
    expect(q.view('B').phase).toBe('reveal');
    r.now = s0 + 12_000;
    expect(r.view('G').phase).toBe('lead');
    r.now = s0 + 12_000 + 4000;
    r.act('B', (x, n) => x.answer(1, true, n));
    expect(r.view('G').players.find((p) => p.who === 'B')!.score).toBe(230);
  });

  it('a lost `skip`: that phone falls back on the full schedule, and the next skip brings it back', () => {
    const r = room();
    const s0 = started(r);
    r.now = s0 + 4000;
    r.act('B', (x, n) => x.answer(0, false, n));
    r.act('G', (x, n) => x.answer(0, false, n));
    r.act('A', (x, n) => x.answer(0, false, n), ['G']); // the a and the skip lost to G
    expect(r.view('B')).toMatchObject({ phase: 'reveal', until: s0 + 12_000 });
    expect(r.view('G')).toMatchObject({ phase: 'answer', until: s0 + 3500 + WINDOWS.answer });
    r.now = s0 + 12_000;
    expect(r.view('B')).toMatchObject({ phase: 'lead', i: 1 });
    expect(r.view('G')).toMatchObject({ phase: 'answer', i: 0 });
    r.now = s0 + FULL;
    expect(r.view('G')).toMatchObject({ phase: 'lead', i: 1 }); // the full length
    // the host's つぎへ at question 1: G's question 2 starts with the others'
    r.now = s0 + 12_000 + 1500 + DUR + WINDOWS.answer + 100;
    r.act('A', (x, n) => x.next(n));
    expect(r.view('G')).toMatchObject({ phase: 'lead', i: 2, from: r.now });
    expect(r.view('B')).toMatchObject({ phase: 'lead', i: 2, from: r.now });
  });

  it('a late go: ≤ 5 s late plays at once (from when it came, no 3-2-1); later, the question under way is sat out', () => {
    const r = room();
    r.act('A', (x, n) => x.open({ lv: 1 }, n));
    r.act('B', (x, n) => x.join(n));
    r.act('G', (x, n) => x.join(n));
    const go = r.s.A.go(r.now)[0] as QuizIn & { op: 'go' };
    const s0 = go.at;
    // B hears it 3 s after question 0 began: question 0 starts for B as it hears it
    r.now = s0 + 3000;
    r.s.B.receive({ ...go, v: 3, who: 'A', t: r.now }, r.now);
    expect(r.view('B')).toMatchObject({ phase: 'lead', i: 0, from: s0 + 3000, out: false });
    // G hears it 10 s after: question 0's clip is long over, sat out; question 1 on the schedule
    r.now = s0 + 10_000;
    r.s.G.receive({ ...go, v: 3, who: 'A', t: r.now }, r.now);
    expect(r.view('G')).toMatchObject({ phase: 'answer', i: 0, out: true });
    expect(r.s.G.answer(0, false, r.now)).toEqual([]);
    r.now = s0 + FULL;
    expect(r.view('G')).toMatchObject({ phase: 'lead', i: 1, out: false });
    // a sat-out player doesn't answer, so the early reveal waits for the time limit: B didn't either
    expect(r.view('B').i).toBe(0);
  });

  it('a late skip: ≤ 5 s late starts at once, later on the schedule (the question under way sat out)', () => {
    const r = room();
    const s0 = started(r);
    r.now = s0 + 4000;
    r.act('B', (x, n) => x.answer(0, false, n));
    r.act('G', (x, n) => x.answer(0, false, n));
    r.act('A', (x, n) => x.answer(0, false, n), ['B', 'G']); // the skip (at s0 + 12 s) lost to both
    const skip = r.sent.at(-1)!.m as QuizOut & { op: 'skip' };
    r.now = skip.at + 4000;
    r.s.B.receive({ ...skip, v: 3, who: 'A', t: r.now }, r.now);
    expect(r.view('B')).toMatchObject({ phase: 'lead', i: 1, from: skip.at + 4000, out: false });
    r.now = skip.at + 6000;
    r.s.G.receive({ ...skip, v: 3, who: 'A', t: r.now }, r.now);
    expect(r.view('G')).toMatchObject({ phase: 'answer', i: 1, out: true });
  });

  it('the host gone mid-game: the game goes on, on the schedule, to the results', () => {
    const r = room();
    const s0 = started(r);
    r.now = s0 + 5000;
    r.here.delete('A');
    r.presence();
    r.act('B', (x, n) => x.answer(0, false, n));
    r.act('G', (x, n) => x.answer(0, true, n));
    expect(r.view('B')).toMatchObject({ phase: 'reveal', i: 0, until: s0 + FULL }); // early reveal here, no skip
    r.now = s0 + FULL;
    expect(r.view('G')).toMatchObject({ phase: 'lead', i: 1 });
    r.now = s0 + 8 * FULL;
    expect(r.view('B')).toMatchObject({ phase: 'results', scores: { B: 130, G: 100 } });
    // a player's leave mid-game: the others don't wait for them
    const q = room();
    const t0 = started(q);
    q.now = t0 + 4000;
    q.act('A', (x, n) => x.answer(0, false, n));
    q.act('B', (x, n) => x.answer(0, false, n));
    expect(q.view('A').phase).toBe('answer');
    q.act('G', (x, n) => x.leave(n));
    expect(q.view('A').phase).toBe('reveal');
    expect(q.sent.at(-1)!.m).toMatchObject({ op: 'skip', i: 1 });
    expect(q.view('B').players.map((p) => p.who)).toEqual(['A', 'B']);
  });

  it('a phone back from a lock rejoins: the host sends open, go and the last skip again; the others their join', () => {
    const r = room();
    const s0 = started(r);
    // G locks at question 0; the others play on (question 0 cut short, question 1 skipped to by つぎへ)
    r.here.delete('G');
    r.presence();
    r.now = s0 + 4000;
    r.act('A', (x, n) => x.answer(0, false, n));
    r.act('B', (x, n) => x.answer(0, false, n));
    expect(r.view('A').phase).toBe('reveal'); // G away: not waited for
    r.now = s0 + 12_000 + 1500 + DUR + WINDOWS.answer + 500;
    r.act('A', (x, n) => x.next(n));
    const s2 = r.now;
    expect(r.view('G')).toMatchObject({ phase: 'answer', i: 1 }); // G's phone: the full-length schedule's question 1
    r.now = s2 + 10_000;
    r.here.add('G');
    const n = r.sent.length;
    r.presence();
    expect(r.sent.slice(n).map((x) => [x.from, x.m.op])).toEqual([['A', 'open'], ['A', 'go'], ['A', 'skip'], ['B', 'join'], ['G', 'join']]);
    expect(r.sent.slice(n)[2].m).toMatchObject({ i: 2, at: s2 });
    // G: question 2 began 10 s ago, its clip too: sat out, then on with the others
    expect(r.view('G')).toMatchObject({ phase: 'answer', i: 2, out: true });
    r.now = s2 + FULL;
    expect(r.view('G')).toMatchObject({ phase: 'lead', i: 3, out: false });
    expect(r.view('A')).toMatchObject({ phase: 'lead', i: 3 });
    // the re-sends changed nothing for A and B
    expect(r.view('B')).toMatchObject({ phase: 'lead', i: 3, from: s2 + FULL });
  });

  it('a phone that comes later sees the game going and joins at its next question; the host’s end cancels it', () => {
    const r = room(['A', 'B']);
    const s0 = started(r, ['B']);
    const g = new QuizSession({ me: 'G', deckOf: () => deck });
    r.now = s0 + 8000;
    // G opens the app: everyone's presence, the host's re-sends reach it
    g.presence(['A', 'B'], r.now);
    for (const x of r.s.A.presence(['B', 'G'], r.now)) g.receive({ ...x, v: 3, who: 'A', t: r.now } as QuizIn, r.now);
    expect(g.view(r.now)).toMatchObject({ phase: 'idle', invite: { host: 'A', started: true } });
    const join = g.join(r.now);
    expect(join).toEqual([{ kind: 'quiz', g: expect.any(String), op: 'join' }]);
    expect(g.view(r.now)).toMatchObject({ phase: 'answer', i: 0, out: true });
    expect(g.view(s0 + FULL)).toMatchObject({ phase: 'lead', i: 1, out: false });
    // the host cancels
    g.receive({ kind: 'quiz', g: join[0].g, op: 'end', v: 3, who: 'A', t: r.now }, r.now);
    expect(g.view(r.now)).toMatchObject({ phase: 'idle', notice: 'cancelled' });
  });

  it('ignores what isn’t the host’s (a go, skip or end from a player), a game unknown, and my own echo', () => {
    const r = room();
    started(r);
    const g = (r.sent[0].m as { g: string }).g;
    const now = r.now;
    expect(r.s.B.receive({ kind: 'quiz', g, op: 'end', v: 3, who: 'G', t: now }, now)).toEqual([]);
    expect(r.s.B.receive({ kind: 'quiz', g, op: 'skip', i: 3, at: now, v: 3, who: 'G', t: now }, now)).toEqual([]);
    expect(r.s.B.receive({ kind: 'quiz', g: 'zzzz', op: 'a', i: 0, k: 0, rp: false, s: 130, v: 3, who: 'G', t: now }, now)).toEqual([]);
    expect(r.s.B.receive({ kind: 'quiz', g, op: 'end', v: 3, who: 'B', t: now }, now)).toEqual([]);
    expect(r.view('B').phase).toBe('countdown');
  });
});

describe('ききみみ session: the wiring', () => {
  it('quizLink and wireQuiz: quiz intents and who’s here in, the outputs sent, the clock the relay’s', () => {
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
    const s = new QuizSession({ me: 'B', deckOf: () => deck });
    let changed = 0;
    const w = wireQuiz(s, quizLink(live as never), () => changed++);
    expect(changed).toBe(1);
    for (const f of subs) f({ kind: 'walk', to: 'x', v: 3, who: 'A', t: T0 });
    expect(changed).toBe(1); // not a quiz
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
    w.stop();
  });
});
