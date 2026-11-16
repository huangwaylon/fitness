// English Study's active time (active.ts): playing and visible counts; a question card only with input in the last
// 60 s, at most 90 s a question; hidden, paused-and-idle and a slept timer's gap never count.
import { describe, expect, it } from 'vitest';
import { newActive, sent, tick, touched } from './active.ts';

const play = { playing: true, visible: true, q: null };
const card = (q: number) => ({ playing: false, visible: true, q });

/** Ticks every second from `from` for `n` s. */
function run(a: ReturnType<typeof newActive>, from: number, n: number, now: Parameters<typeof tick>[2]) {
  for (let i = 0; i <= n; i++) a = tick(a, from + i * 1000, now);
  return a;
}

describe('the active clock', () => {
  it('counts the video playing while visible, never hidden', () => {
    let a = run(newActive(), 0, 30, play);
    expect(a.unsent).toBe(30_000);
    a = run(a, 31_000, 10, { ...play, visible: false });
    expect(a.unsent).toBe(30_000);
    // back: the hidden gap isn't counted, the next second is
    a = run(a, 60_000, 1, play);
    expect(a.unsent).toBe(31_000);
  });
  it('a question card counts only with input in the last 60 s', () => {
    let a = touched(newActive(), 0);
    a = run(a, 0, 80, card(0));
    expect(a.unsent).toBe(60_000);
    a = touched(a, 80_000);
    a = run(a, 81_000, 10, card(1));
    expect(a.unsent).toBe(71_000); // (from the last tick at 80 s)
  });
  it('at most 90 s a question, all visits together', () => {
    let a = newActive();
    for (let t = 0; t < 200_000; t += 1000) a = tick(touched(a, t), t, card(2));
    expect(a.perQ[2]).toBe(90_000);
    expect(a.unsent).toBe(90_000);
    // playing the segment on that card still counts
    a = run({ ...a, last: null }, 300_000, 5, { ...play, q: 2 });
    expect(a.unsent).toBe(95_000);
  });
  it('a timer held back (the phone asleep) adds 5 s at most', () => {
    const a = tick(tick(newActive(), 0, play), 120_000, play);
    expect(a.unsent).toBe(5000);
  });
  it('sent: what was counted goes, each question’s share stays', () => {
    const a = sent(run(touched(newActive(), 0), 0, 10, card(0)));
    expect([a.unsent, a.perQ[0]]).toEqual([0, 10_000]);
  });
});
