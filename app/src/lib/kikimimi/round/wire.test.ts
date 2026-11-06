// The game ops on the wire (round/wire.ts, link.ts): the `quiz` intent to the session's ops and back, unchanged both
// ways; the `play` intent heard and its shape out; what goes out by the wire mode (8c: `play`, the quiz family on
// `quiz` while the rollout is guarded).
import { describe, expect, it } from 'vitest';
import { QUIZ_LVS, type Relayed } from '../../contract/live-protocol.ts';
import { isLadder, timerIndex, versus } from '../seed.ts';
import { QUIZ_ON_PLAY, SEND_PLAY, WIRE, gameIn, playIn, playOut, quizIn, quizOut, toWire, type PlayIn, type QuizIn, type QuizOut, type RoundOut } from './wire.ts';
import { roundLink } from './link.ts';
import type { LiveStatus } from '../../sync/live.ts';

const relayed = <T extends object>(m: T) => ({ ...m, v: 3 as const, who: 'A' as const, t: 5 });
const bare = ({ v: _v, who: _who, t: _t, ...m }: Relayed) => m;

describe('round wire: quiz ↔ the session’s ops', () => {
  const quiz: QuizOut[] = [
    ...[0, 1, 2, 3, 0b1011, 0xffff_ffff, 0x1234_5670].flatMap((seed) => QUIZ_LVS.map((lv): QuizOut => ({ kind: 'quiz', g: 'abcd12', op: 'open', seed, lv, same: seed % 3 === 0 }))),
    { kind: 'quiz', g: 'abcd', op: 'join' },
    { kind: 'quiz', g: 'abcd', op: 'leave' },
    { kind: 'quiz', g: 'abcd', op: 'end' },
    { kind: 'quiz', g: 'abcd', op: 'go', at: 1_793_527_004_000 },
    { kind: 'quiz', g: 'abcd', op: 'a', i: 7, k: 3, rp: true, s: 1040 },
    { kind: 'quiz', g: 'abcd', op: 'a', i: 0, k: 0, rp: false, s: 0 },
    { kind: 'quiz', g: 'abcd', op: 'skip', i: 8, at: 12 }
  ];

  it('every quiz op comes back out as it went in', () => {
    for (const m of quiz) expect(quizOut(quizIn(relayed(m) as QuizIn))).toEqual(m);
  });

  it('a quiz open is the quiz or スピード はしご (the seed’s bit 1), its options [lv, こたえる じかん], its flags おなじへや and たいせん; the seed kept whole', () => {
    for (const m of quiz) {
      if (m.op !== 'open') continue;
      const r = quizIn(relayed(m) as QuizIn);
      expect(r).toEqual({ g: m.g, gm: isLadder(m.seed) ? 'ladder' : 'quiz', op: 'open', seed: m.seed, o: [m.lv, timerIndex(m.seed)], f: (m.same ? 1 : 0) | (versus(m.seed) ? 2 : 0), who: 'A', t: 5 });
    }
    expect(quizIn(relayed({ kind: 'quiz', g: 'abcd', op: 'a', i: 1, k: 2, rp: true, s: 100 }) as QuizIn)).toMatchObject({ gm: 'quiz', k: 2, rp: 1 });
  });

  it('what the quiz wire can’t carry stays off it: a lesson (a unit), tiles', () => {
    expect(quizOut({ g: 'abcd', gm: 'lesson', op: 'open', seed: 4, f: 0, o: [2, 0, 1, 0], u: 'tr-hotel' })).toBeNull();
    expect(quizOut({ g: 'abcd', gm: 'tile', op: 'open', seed: 4, f: 0, o: [] })).toBeNull();
    expect(quizOut({ g: 'abcd', gm: 'tile', op: 'a', i: 0, k: [1, 2], rp: 0, s: 0 })).toBeNull();
    // the open's seed carries its game's flags (a host's lobby's always does: GameDef.seedBits)
    expect(quizOut({ g: 'abcd', gm: 'ladder', op: 'open', seed: 0, f: 3, o: [4, 2] })).toEqual({ kind: 'quiz', g: 'abcd', op: 'open', seed: 0b1011, lv: 4, same: true });
    expect(quizOut({ g: 'abcd', gm: 'quiz', op: 'a', i: 2, k: 1, rp: 3, s: 200 })).toEqual({ kind: 'quiz', g: 'abcd', op: 'a', i: 2, k: 1, rp: true, s: 200 });
  });
});

describe('round wire: play', () => {
  const play: PlayIn[] = [
    relayed({ kind: 'play', g: 'abcd', gm: 'quiz', op: 'open', cv: 'a1b2c3', seed: 9, f: 3, o: [3, 1] }),
    relayed({ kind: 'play', g: 'abcd', gm: 'lesson', op: 'open', cv: 'a1b2c3', seed: 9, f: 0, o: [3, 1, 3, 2], u: 'tr-hotel' }),
    relayed({ kind: 'play', g: 'abcd', gm: 'quiz', op: 'join' }),
    relayed({ kind: 'play', g: 'abcd', gm: 'quiz', op: 'leave' }),
    relayed({ kind: 'play', g: 'abcd', gm: 'quiz', op: 'end' }),
    relayed({ kind: 'play', g: 'abcd', gm: 'quiz', op: 'go', at: 77, pl: 5 }),
    relayed({ kind: 'play', g: 'abcd', gm: 'tile', op: 'a', i: 31, k: [1, 2, 63], rp: 4, s: 9999 }),
    relayed({ kind: 'play', g: 'abcd', gm: 'quiz', op: 'skip', i: 32, at: 77 })
  ];

  it('a play op is heard as the session’s (its cv kept on the open; ev, reserved, isn’t one) and goes back out the same', () => {
    for (const m of play) expect(playOut(playIn(m)!)).toEqual(bare(m));
    expect(playIn(relayed({ kind: 'play', g: 'abcd', gm: 'quiz', op: 'ev', i: 0, e: 1 }))).toBeNull();
    expect(gameIn(play[0])).toMatchObject({ gm: 'quiz', op: 'open', cv: 'a1b2c3', o: [3, 1], who: 'A', t: 5 });
  });

  it('8c sends play (SEND_PLAY); by mode: quiz (8b, ?wire=quiz) always quiz, guarded the quiz family on quiz and the rest on play, play all on play; play only where it has what play needs (an open’s cv, a go’s players)', () => {
    expect(SEND_PLAY).toBe(true);
    expect(WIRE).toBe(QUIZ_ON_PLAY ? 'play' : 'guarded');
    const open: RoundOut = { g: 'abcd', gm: 'quiz', op: 'open', seed: 8, f: 0, o: [1, 0], cv: 'abcdef' };
    expect(toWire(open, 'quiz')).toMatchObject({ kind: 'quiz', op: 'open', lv: 1 });
    expect(toWire(open, 'guarded')).toMatchObject({ kind: 'quiz', op: 'open', lv: 1 });
    expect(toWire(open, 'play')).toMatchObject({ kind: 'play', cv: 'abcdef' });
    const { cv: _, ...bare } = open;
    expect(playOut(bare)).toBeNull();
    expect(toWire(bare, 'play')).toMatchObject({ kind: 'quiz' });
    expect(playOut({ g: 'abcd', gm: 'quiz', op: 'go', at: 1 })).toBeNull();
    expect(playOut({ g: 'abcd', gm: 'quiz', op: 'a', i: 0, k: 1, rp: 140, s: 0 })).toMatchObject({ rp: 99 });
    // a lesson: play when guarded (quiz can't carry it), its join with my tier
    const lesson: RoundOut = { g: 'abcd', gm: 'lesson', op: 'open', seed: 1, f: 0, o: [4, 0, 3, 1], u: 'tr-hotel', cv: 'abcdef' };
    expect(toWire(lesson, 'guarded')).toEqual({ kind: 'play', g: 'abcd', gm: 'lesson', op: 'open', seed: 1, f: 0, o: [4, 0, 3, 1], u: 'tr-hotel', cv: 'abcdef' });
    expect(toWire(lesson, 'quiz')).toBeNull();
    expect(toWire({ g: 'abcd', gm: 'lesson', op: 'join', tr: 2 }, 'guarded')).toEqual({ kind: 'play', g: 'abcd', gm: 'lesson', op: 'join', tr: 2 });
    expect(toWire({ g: 'abcd', gm: 'lesson', op: 'go', at: 9, pl: 3 }, 'guarded')).toEqual({ kind: 'play', g: 'abcd', gm: 'lesson', op: 'go', at: 9, pl: 3 });
    expect(toWire({ g: 'abcd', gm: 'quiz', op: 'join', tr: 2 }, 'guarded')).toEqual({ kind: 'quiz', g: 'abcd', op: 'join' });
    expect(playIn(relayed({ kind: 'play', g: 'abcd', gm: 'lesson', op: 'join', tr: 1 }))).toEqual({ g: 'abcd', gm: 'lesson', op: 'join', tr: 1, who: 'A', t: 5 });
  });

  it('the link hears both wires (an 8c phone’s play too) and sends by its mode', () => {
    const subs: ((m: Relayed) => void)[] = [];
    const out: unknown[] = [];
    const st: LiveStatus = { connected: true, me: 'B', peer: true, here: ['A'] };
    const link = roundLink({ send: (m) => out.push(m) > 0, on: (f) => (subs.push(f), () => {}), onStatus: (f) => (f(st), () => {}), serverNow: () => 5 }, 'quiz');
    const heard: unknown[] = [];
    link.on((m) => heard.push(m));
    for (const f of subs) {
      f(play[0]);
      f(relayed({ kind: 'quiz', g: 'abcd', op: 'join' }) as Relayed);
      f(relayed({ kind: 'walk', to: 'x' }) as Relayed);
      f(relayed({ kind: 'play', g: 'abcd', gm: 'quiz', op: 'ev', i: 0, e: 1 }) as Relayed);
    }
    expect(heard).toEqual([gameIn(play[0]), { g: 'abcd', gm: 'quiz', op: 'join', who: 'A', t: 5 }]);
    expect(link.send({ g: 'abcd', gm: 'quiz', op: 'join' })).toBe(true);
    expect(link.send({ g: 'abcd', gm: 'lesson', op: 'open', seed: 1, f: 0, o: [1, 0, 1, 0], u: 'x' })).toBe(false); // (off the quiz wire)
    expect(out).toEqual([{ kind: 'quiz', g: 'abcd', op: 'join' }]);
  });
});
