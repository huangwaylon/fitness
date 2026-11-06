// The round session over the quiz's GameDefs (round/session.ts, games/quiz/), on the `quiz` wire: session.test's
// scenarios, ported (round/session.scenarios.ts); and what's new with it: a unit's lesson as a game of its own, an 8c
// phone's `play` heard.
import { describe, expect, it } from 'vitest';
import { QuizRounds } from '../games/quiz/session.ts';
import { defsOf, roundMaker, scenarios, type TestDeck } from './session.scenarios.ts';
import { WINDOWS } from './session.ts';
import { playIn, toWire } from './wire.ts';

scenarios(roundMaker);

const T0 = 1_793_527_000_000;
const deck: TestDeck = { count: 6, dur: () => 2000, answer: (i) => i % 3 };

describe('ききみみ session: a unit’s lesson', () => {
  it('dealt into my lobby kept alone: the game `lesson` (its unit, lesson and tier in its options), the lobby’s seed, level and timer kept; nothing on the wire; back to the quiz the same', () => {
    const s = new QuizRounds({ me: 'A', defs: defsOf(() => deck), random: () => 0.5 });
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
    const s = new QuizRounds({ me: 'B', defs: defsOf(() => deck) });
    s.presence(['A'], T0);
    const open = playIn({ kind: 'play', g: 'abcd', gm: 'quiz', op: 'open', cv: 'a1b2c3', seed: 40, f: 2, o: [3, 1], v: 3, who: 'A', t: T0 })!;
    s.receive(open, T0);
    expect(s.view(T0).invite).toEqual({ g: 'abcd', host: 'A', lv: 3, ladder: false, same: false, started: false });
    expect(s.join(T0).map((m) => toWire(m))).toEqual([{ kind: 'quiz', g: 'abcd', op: 'join' }]);
    expect(s.view(T0)).toMatchObject({ phase: 'lobby', gm: 'quiz', lv: 3, timer: 20, vs: true, n: 6 });
    // a game this build doesn't know isn't offered
    s.receive(playIn({ kind: 'play', g: 'efgh', gm: 'tile', op: 'open', cv: 'a1b2c3', seed: 40, f: 0, o: [], v: 3, who: 'A', t: T0 })!, T0);
    expect(s.view(T0).g).toBe('abcd');
  });
});
