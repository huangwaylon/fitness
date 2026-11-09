// The story player's chapter-to-chapter run (player.svelte.ts): a timed story goes on after the wait between chapters,
// and a pause in that wait (the phone locked: StoryFrame pauses on visibilitychange) doesn't leave it stuck.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('#lib/sound/sound.svelte.ts', () => ({ fadeVoice: () => {}, holdVoiceDuck: () => {}, playVoice: () => ({ stop() {} }) }));
vi.mock('../packs.ts', () => ({ prefetchClips: () => {}, voiceClip: async () => ({ duration: 1 }) }));
import { NEXT_CHAPTER_MS } from '#lib/kikimimi/bedtime.ts';
import { StoryPlayer } from './player.svelte.ts';

const ch = (n: number) => ({ chapter: n, segments: [{ who: 'n', clip: `c${n}a` }, { who: 'n', clip: `c${n}b` }] }) as never;

let now = 0;
/** The clock and the timers on by `ms`, 50 ms at a time. */
const step = async (ms: number) => {
  for (let t = 0; t < ms; t += 50) { now += 50; await vi.advanceTimersByTimeAsync(50); }
};
/** A 30-minute timer's player on chapter 1, run till the wait between chapters 1 and 2. */
async function toTheWait() {
  const finished: number[] = [];
  const p = new StoryPlayer(ch(1), 0, 30 as never, { finished: (c) => finished.push(c), place: () => {}, next: async (c) => ch(c + 1) }, () => now);
  p.play();
  for (let k = 0; k < 40 && !p.between; k++) await step(500);
  expect(p.between).toBe(true);
  return { p, finished };
}

beforeEach(() => { vi.useFakeTimers(); now = 0; });
afterEach(() => vi.useRealTimers());

describe('story player between chapters', () => {
  it('goes on into the next chapter after the wait, the wait not counted as listening', async () => {
    const { p, finished } = await toTheWait();
    const heard = p.heard;
    await step(NEXT_CHAPTER_MS);
    expect({ chapter: p.chapter.chapter, between: p.between, playing: p.playing, finished }).toEqual({ chapter: 2, between: false, playing: true, finished: [1] });
    expect(p.heard - heard).toBeLessThan(NEXT_CHAPTER_MS);
  });

  it('a pause in the wait, then ▶: on to the next chapter at once, time counted', async () => {
    const { p, finished } = await toTheWait();
    p.pause();
    expect({ between: p.between, playing: p.playing }).toEqual({ between: false, playing: false });
    now += 60_000;
    await step(NEXT_CHAPTER_MS); // (nothing goes on while paused)
    expect(p.chapter.chapter).toBe(1);
    p.play();
    const heard = p.heard;
    await step(500);
    expect({ chapter: p.chapter.chapter, seg: p.seg, between: p.between, counted: p.heard > heard, finished }).toEqual({ chapter: 2, seg: 0, between: false, counted: true, finished: [1] });
  });
});
