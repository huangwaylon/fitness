import { describe, expect, it } from 'vitest';
import { points } from './score.ts';
import { FAST_WINDOWS, QuizSession, WINDOWS, quizLink, versus, wireQuiz, type QuizDeck, type QuizIn, type QuizOut } from './session.ts';
import type { LiveStatus } from '../sync/live.ts';
import type { Relayed, Who } from '../contract/live-protocol.ts';
import { DIALOGUES } from './dialogues.ts';
import { LINE_GAP, itemDur } from './clips.ts';
import { clipIds } from './bank.ts';

/** 8 questions, each clip 2 s, question i's right choice i % 4. */
const DUR = 2000;
const deck: QuizDeck = { count: 8, dur: () => DUR, answer: (i) => i % 4 };
const FULL = WINDOWS.lead + DUR + WINDOWS.answer + WINDOWS.reveal; // 26.5 s
const T0 = 1_793_527_000_000;

/** Three phones on one fake relay: each one's outputs go to the others here (unless dropped). */
function room(whos: Who[] = ['A', 'B', 'G'], dk: QuizDeck = deck) {
  let now = T0;
  const s = Object.fromEntries(whos.map((w, n) => [w, new QuizSession({ me: w, deckOf: () => dk, random: seq(n) })])) as Record<Who, QuizSession>;
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
  /** Every phone here ticks (the host's beacon; a player's moving on once the host has really gone). */
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

/** A fixed random: game ids and seeds the same each run. */
function seq(n: number) {
  let x = 0.123 + n * 0.1;
  return () => (x = (x * 9301 + 0.49297) % 1);
}

/** Open (A hosts) and invite, B and G join, A starts: returns question 0's start. */
function started(r: ReturnType<typeof room>, joiners: Who[] = ['B', 'G']): number {
  r.act('A', (x, n) => x.open({ lv: 1 }, n));
  if (joiners.length) r.act('A', (x, n) => x.invite(n));
  for (const w of joiners) r.act(w, (x, n) => x.join(n));
  r.act('A', (x, n) => x.go(n));
  return r.now + WINDOWS.countdown;
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

  it('the last question: everyone in, the host sends the end (its reveal’s end) and the results come on every phone', () => {
    const r = room();
    const s0 = started(r);
    const s7 = s0 + 7 * FULL;
    r.now = s7 + 4000;
    for (const w of ['A', 'B', 'G'] as const) r.act(w, (x, n) => x.answer(3, false, n));
    expect(r.sent.at(-1)!.m).toMatchObject({ op: 'skip', i: 8, at: s7 + 4000 + WINDOWS.reveal }); // the end
    r.now = s7 + 4000 + WINDOWS.reveal - 1;
    expect(r.view('B').phase).toBe('reveal');
    r.now += 1;
    for (const w of ['A', 'B', 'G'] as const) expect(r.view(w)).toMatchObject({ phase: 'results', i: 8, scores: { A: 130, B: 130, G: 130 } });
  });

  it('solo: one player, the same game, nothing on the wire', () => {
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
    expect(r.sent).toEqual([]);
    expect(r.s.A.tick(r.now - 1)).toEqual([]);
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

describe('ききみみ session: dialogues', () => {
  it('a dialogue’s sequence: its clip length is its lines’ and the gaps (clips.ts itemDur), and the schedule runs on it alike on every phone', () => {
    const d = DIALOGUES.find((it) => it.id === 'd4-train-cancelled')!;
    const clips = Object.fromEntries(clipIds(d).map((id, n) => [id, { dur: 1.5 + n }])); // 1.5, 2.5, 3.5, 4.5 s
    const seqMs = Math.round(itemDur(d, clips)! * 1000);
    expect(seqMs).toBe(12_000 + 3 * LINE_GAP * 1000);
    // question 1 the dialogue, the others 2 s
    const dd: QuizDeck = { count: 8, dur: (i) => (i === 1 ? seqMs : DUR), answer: (i) => i % 4 };
    const r = room(['A', 'B'], dd);
    const s0 = started(r, ['B']);
    const s1 = s0 + FULL;
    for (const w of ['A', 'B'] as const) {
      expect(r.s[w].view(s1 + 1)).toMatchObject({ phase: 'lead', i: 1, playAt: s1 + WINDOWS.lead, playEnd: s1 + WINDOWS.lead + seqMs });
      expect(r.s[w].view(s1 + WINDOWS.lead + seqMs - 1).phase).toBe('play');
      expect(r.s[w].view(s1 + WINDOWS.lead + seqMs).phase).toBe('answer');
      expect(r.s[w].view(s1 + WINDOWS.lead + seqMs + WINDOWS.answer + WINDOWS.reveal)).toMatchObject({ phase: 'lead', i: 2 });
    }
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
    const s = new QuizSession({ me: 'G', deckOf: () => deck, random: seq(5) });
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
      r.now = t + 1500 + DUR + 500;
      for (const w of ['A', 'B', 'G'] as const) r.act(w, (x, n) => x.answer(wrong[w].includes(i) ? (i + 1) % 4 : i % 4, false, n));
      const v = r.view('B');
      expect(v).toMatchObject({ phase: 'reveal', i, rightNow: 3 - (['A', 'B', 'G'] as const).filter((w) => wrong[w].includes(i)).length });
      expect(v.team.done).toBe(i + 1);
      t = r.now + WINDOWS.reveal;
    }
    r.now = t;
    for (const w of ['A', 'B', 'G'] as const) expect(r.view(w)).toMatchObject({ phase: 'results', team: { right: 7, all: 4, done: 8 }, rightNow: 0 });
  });

  it('a player who joined mid-game doesn’t hold back そろって for the questions before', () => {
    const r = room(['A', 'B']);
    r.act('A', (x, n) => x.open({ lv: 1 }, n));
    r.act('A', (x, n) => x.invite(n));
    r.act('A', (x, n) => x.go(n));
    const s0 = r.now + WINDOWS.countdown;
    r.now = s0 + 1500 + DUR + 500;
    r.act('A', (x, n) => x.answer(0, false, n));
    r.act('B', (x, n) => x.join(n)); // in from question 1 (A alone was in: its reveal at once, 8 s)
    r.now += WINDOWS.reveal + 1500 + DUR + 500;
    r.act('A', (x, n) => x.answer(1, false, n));
    r.act('B', (x, n) => x.answer(1, false, n));
    for (const w of ['A', 'B'] as const) expect(r.view(w).team).toEqual({ right: 2, all: 2, done: 2 });
  });

  it('そろって is the same on every phone: a player in the game who lets a question time out holds it back on all of them', () => {
    const r = room(['A', 'B']);
    const s0 = started(r, ['B']);
    r.now = s0 + 1500 + DUR + 500;
    r.act('B', (x, n) => x.answer(0, false, n)); // right; A lets it time out
    r.now = s0 + 1500 + DUR + WINDOWS.answer + 100; // the reveal
    for (const w of ['A', 'B'] as const) expect(r.view(w)).toMatchObject({ phase: 'reveal', i: 0, team: { right: 1, all: 0, done: 1 } });
    // and the same when the one who timed out answered nothing before (B's phone knows A was in from the start)
    r.now = s0 + FULL + 1500 + DUR + 500;
    r.act('A', (x, n) => x.answer(1, false, n));
    r.act('B', (x, n) => x.answer(1, false, n));
    for (const w of ['A', 'B'] as const) expect(r.view(w).team).toEqual({ right: 2, all: 1, done: 2 });
  });

  it('a player who leaves keeps the answers they gave in the team’s tally', () => {
    const r = room();
    const s0 = started(r);
    r.now = s0 + 1500 + DUR + 500;
    r.act('A', (x, n) => x.answer(1, false, n)); // wrong
    r.act('G', (x, n) => x.answer(1, false, n)); // wrong
    r.act('B', (x, n) => x.answer(0, false, n)); // right: the team has question 0
    r.act('B', (x, n) => x.leave(n));
    r.now += WINDOWS.reveal + 1;
    for (const w of ['A', 'G'] as const) expect(r.view(w).team).toEqual({ right: 1, all: 0, done: 1 });
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

  it('a lost `skip`: till the host’s next beacon that phone has the full schedule, and the next skip brings it back', () => {
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

  it('a late go: the host’s times kept; its clip begun ≤ 5 s before, the question is played; later, sat out', () => {
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
    // G hears it 10 s after: question 0's clip is long over, sat out; question 1 on the schedule
    r.now = s0 + 10_000;
    r.s.G.receive({ ...go, v: 3, who: 'A', t: r.now }, r.now);
    expect(r.view('G')).toMatchObject({ phase: 'answer', i: 0, out: true });
    expect(r.s.G.answer(0, false, r.now)).toEqual([]);
    r.now = s0 + FULL;
    expect(r.view('G')).toMatchObject({ phase: 'lead', i: 1, out: false });
    // every phone on the host's clock
    expect(r.view('B')).toMatchObject({ phase: 'lead', i: 1, from: s0 + FULL });
    expect(r.view('A')).toMatchObject({ phase: 'lead', i: 1, from: s0 + FULL });
  });

  it('a late skip: the host’s times kept; its clip begun ≤ 5 s before, played; later, sat out', () => {
    const r = room();
    const s0 = started(r);
    r.now = s0 + 4000;
    r.act('B', (x, n) => x.answer(0, false, n));
    r.act('G', (x, n) => x.answer(0, false, n));
    r.act('A', (x, n) => x.answer(0, false, n), ['B', 'G']); // the skip (at s0 + 12 s) lost to both
    const skip = r.sent.at(-1)!.m as QuizOut & { op: 'skip' };
    r.now = skip.at + 4000;
    r.s.B.receive({ ...skip, v: 3, who: 'A', t: r.now }, r.now);
    expect(r.view('B')).toMatchObject({ phase: 'answer', i: 1, playAt: skip.at + 1500, out: false });
    r.now = skip.at + 7000;
    r.s.G.receive({ ...skip, v: 3, who: 'A', t: r.now }, r.now);
    expect(r.view('G')).toMatchObject({ phase: 'answer', i: 1, playAt: skip.at + 1500, out: true });
  });

  it('the host gone mid-game (its leave, or away past the grace): each phone moves on when everyone left has answered', () => {
    const r = room();
    const s0 = started(r);
    r.now = s0 + 5000;
    r.act('A', (x, n) => x.leave(n));
    r.act('B', (x, n) => x.answer(0, false, n));
    const sent = r.sent.length;
    r.act('G', (x, n) => x.answer(0, true, n));
    // the early reveal here, and (no skip will come) the next question at its end on each phone, nothing sent but the answer
    expect(r.view('B')).toMatchObject({ phase: 'reveal', i: 0, until: s0 + 5000 + WINDOWS.reveal });
    expect(r.view('G')).toMatchObject({ phase: 'reveal', i: 0, until: s0 + 5000 + WINDOWS.reveal });
    expect(r.sent.slice(sent).map((x) => x.m.op)).toEqual(['a']);
    r.now = s0 + 5000 + WINDOWS.reveal;
    expect(r.view('G')).toMatchObject({ phase: 'lead', i: 1 });
    // nobody answers question 1: its full length
    r.now = s0 + 5000 + WINDOWS.reveal + FULL;
    expect(r.view('B')).toMatchObject({ phase: 'lead', i: 2 });
    // the last question, everyone left in: the results after its reveal, each phone by itself
    r.now = s0 + 5000 + WINDOWS.reveal + 6 * FULL + 4000;
    expect(r.view('B')).toMatchObject({ phase: 'answer', i: 7 });
    r.act('B', (x, n) => x.answer(3, false, n));
    r.act('G', (x, n) => x.answer(0, false, n));
    r.now += WINDOWS.reveal;
    expect(r.view('B')).toMatchObject({ phase: 'results', scores: { B: 260, G: 100 } });
    expect(r.view('G')).toMatchObject({ phase: 'results' });
    // the host's phone away: not gone till the grace is over (a lock, a tunnel), then the same
    const p = room();
    const u0 = started(p);
    p.now = u0 + 4000;
    p.here.delete('A');
    p.presence();
    p.act('B', (x, n) => x.answer(0, false, n));
    p.act('G', (x, n) => x.answer(0, false, n));
    p.now = u0 + 4000 + WINDOWS.hostGrace - 1;
    p.tick();
    expect(p.view('B')).toMatchObject({ phase: 'reveal', i: 0 });
    p.now += 1;
    p.tick();
    expect(p.view('B')).toMatchObject({ phase: 'lead', i: 1, from: p.now });
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

describe('ききみみ session: the host is the clock', () => {
  it('one lost skip: the host’s beacon brings that phone back to the question under way (not 15 s behind for the rest)', () => {
    const r = room();
    const s0 = started(r);
    r.now = s0 + 4000;
    r.act('B', (x, n) => x.answer(0, false, n));
    r.act('G', (x, n) => x.answer(0, false, n));
    r.act('A', (x, n) => x.answer(0, false, n), ['G']); // the skip to question 1 (at s0 + 12 s) lost to G
    r.now = s0 + 12_000 + 1000; // the others in question 1's lead-in; G still in question 0
    expect(r.view('G')).toMatchObject({ i: 0 });
    r.tick();
    expect(r.view('G')).toMatchObject({ phase: 'lead', i: 1, from: s0 + 12_000, out: false });
    expect(r.view('G').from).toBe(r.view('B').from);
    // a beacon that changes nothing changes nothing
    const before = r.view('B');
    r.now += WINDOWS.beacon;
    r.tick();
    expect(r.view('B')).toMatchObject({ i: 1, playAt: before.playAt });
  });

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
    r.now = s0 + FULL; // question 1 on the schedule: a new position, sent at once
    expect(r.s.A.tick(r.now)).toMatchObject([{ op: 'skip', i: 1, at: s0 + FULL }]);
    expect(r.s.A.tick(r.now + 100)).toEqual([]);
    r.now = s0 + 8 * FULL;
    expect(r.s.A.tick(r.now)).toEqual([]); // over
  });

  it('back from a lock: the host’s position is adopted, the question it’s in shown (its clip long begun: sat out), never an old one', () => {
    const r = room();
    const s0 = started(r);
    r.here.delete('G');
    r.presence();
    // A and B answer quickly: questions 0-3 cut short (13 s each); G's phone, asleep, has the full schedule
    let t = s0;
    for (let i = 0; i < 4; i++) {
      r.now = t + 5000;
      r.act('A', (x, n) => x.answer(0, false, n));
      r.act('B', (x, n) => x.answer(0, false, n));
      t = r.now + WINDOWS.reveal;
    }
    expect(r.view('A')).toMatchObject({ i: 3, phase: 'reveal' });
    r.now = t + 10_000; // question 4 began 10 s ago
    expect(r.view('A')).toMatchObject({ i: 4 });
    r.here.add('G');
    r.presence();
    expect(r.view('G')).toMatchObject({ i: 4, out: true, from: r.view('A').from });
    expect(r.s.G.answer(0, false, r.now)).toEqual([]);
    r.now = t + FULL;
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
    r.now = s0 + 1500 + DUR + 500;
    r.act('G', (x, n) => x.join(n));
    expect(r.view('G').had).toEqual([false, true, true, true, true, true, true, true]);
    // B answers question 0, lets question 1 time out, then sleeps through 2-3 (A plays on alone, fast)
    r.act('A', (x, n) => x.answer(0, false, n));
    r.act('B', (x, n) => x.answer(0, false, n));
    r.now = s0 + FULL + 1500 + DUR + 500;
    r.act('A', (x, n) => x.answer(1, false, n));
    r.act('G', (x, n) => x.answer(1, false, n));
    r.now = s0 + 2 * FULL - 1000; // question 1's reveal; B's phone locks
    r.here.delete('B');
    r.presence();
    let t = s0 + 2 * FULL;
    for (let i = 2; i < 4; i++) {
      r.now = t + 5000;
      r.act('A', (x, n) => x.answer(0, false, n));
      r.act('G', (x, n) => x.answer(0, false, n));
      t = r.now + WINDOWS.reveal;
    }
    r.now = t + 10_000; // question 4's clip long begun
    r.here.add('B');
    r.presence();
    expect(r.view('B')).toMatchObject({ i: 4, out: true });
    expect(r.view('B').had.slice(0, 5)).toEqual([true, false, false, false, false]);
    expect(r.view('B').had.slice(5)).toEqual([true, true, true]);
  });

  it('the host locked: the players wait for it (no racing ahead) and adopt its clock when it’s back; gone past the grace, they move on and go back to its position when it returns', () => {
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
    expect(r.view('B')).toMatchObject({ phase: 'reveal', i: 0 }); // not on to question 1 without the host
    // the host away past the grace: each phone moves on (nothing sent)
    r.now = s0 + 1000 + WINDOWS.hostGrace;
    const n = r.sent.length;
    r.tick();
    expect(r.sent.length).toBe(n);
    expect(r.view('B')).toMatchObject({ phase: 'lead', i: 1, from: r.now });
    expect(r.view('G')).toMatchObject({ phase: 'lead', i: 1, from: r.now });
    // the host back (its phone kept the full schedule: still question 0): everyone on its clock again
    r.now = s0 + 20_000;
    r.here.add('A');
    r.presence();
    for (const w of ['A', 'B', 'G'] as const) expect(r.view(w)).toMatchObject({ i: 0, phase: 'reveal' });
    r.now = s0 + FULL;
    for (const w of ['A', 'B', 'G'] as const) expect(r.view(w)).toMatchObject({ i: 1, phase: 'lead', from: s0 + FULL });
  });

  it('my own phone’s short disconnect isn’t the host gone: no early reveal, no moving on', () => {
    const r = room();
    const s0 = started(r);
    r.now = s0 + 4000;
    r.act('B', (x, n) => x.answer(0, false, n));
    r.now = s0 + 5000;
    expect(r.s.B.presence(null, r.now)).toEqual([]); // B's socket down: who's here unknown, not gone
    expect(r.view('B')).toMatchObject({ phase: 'answer', i: 0 });
    r.now = s0 + 5000 + WINDOWS.hostGrace + 1000;
    r.s.B.tick(r.now);
    expect(r.view('B')).toMatchObject({ phase: 'reveal', i: 0 }); // the time limit, on the host's schedule
    r.now = s0 + FULL;
    expect(r.view('B')).toMatchObject({ phase: 'lead', i: 1, from: s0 + FULL });
    // back: B's join again (the others may have missed what it sent)
    expect(r.s.B.presence(['A', 'G'], r.now)).toEqual([{ kind: 'quiz', g: expect.any(String), op: 'join' }]);
  });

  it('the host’s つぎへ on the last question ends the game on every phone; everyone in, the end broadcast too', () => {
    const q = room(['A', 'B']);
    const t0 = started(q, ['B']);
    q.now = t0 + 7 * FULL + 19_000; // the last reveal
    q.act('A', (x, n) => x.next(n));
    expect(q.sent.at(-1)!.m).toMatchObject({ op: 'skip', i: 8, at: q.now });
    expect(q.view('A').phase).toBe('results');
    expect(q.view('B').phase).toBe('results');
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

  it('おなじへや: no first-listen bonus (only the host’s phone can replay), for everyone alike', () => {
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
