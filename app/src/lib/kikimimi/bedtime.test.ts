// kikimimi/bedtime.ts: おやすみ ものがたり's timeline, the sleep timer's fade, the chapters' unlocking, つづき and the
// morning-after prediction (docs/kikimimi-ux.md §6.8).
import { describe, expect, it } from 'vitest';
import {
  FADE_MS, fadeCurve, fadeGain, finish, finishesOnTimer, gapAfter, guess, keepPlace, later, morningCard, nextOf, pickSerial, revealOf, timeline, timerLeft, unlocked,
  type StoryProgress
} from './bedtime.ts';

const SERIALS = [{ unit: 'st-cafe', chapters: 5 }, { unit: 'st-johnny', chapters: 5 }];

describe('the timeline', () => {
  it('plays the segments in turn with a breath between one voice’s lines and a longer gap at a change of speaker', () => {
    expect(gapAfter('narrator', 'narrator')).toBeLessThan(gapAfter('narrator', 'dom'));
    expect(gapAfter('dom', undefined)).toBe(0);
    const tl = timeline([{ who: 'narrator', dur: 5 }, { who: 'narrator', dur: 4 }, { who: 'dom', dur: 2 }]);
    expect(tl.starts).toEqual([0, 5.6, 10.5]);
    expect(tl.total).toBeCloseTo(12.5);
  });
  it('a timer run out in the last third finishes the chapter; earlier it doesn’t', () => {
    expect(finishesOnTimer(199, 300)).toBe(false);
    expect(finishesOnTimer(200, 300)).toBe(true);
    expect(finishesOnTimer(0, 0)).toBe(false);
  });
});

describe('the sleep timer', () => {
  it('counts listening time; ぜんぶ has none', () => {
    expect(timerLeft(10, 0)).toBe(600_000);
    expect(timerLeft(20, 61_000)).toBe(1_139_000);
    expect(timerLeft(30, 9_999_999)).toBe(0);
    expect(timerLeft(0, 5_000)).toBeNull();
  });
  it('the voice stays full until the last 20 s, then fades on an equal-power curve to silence', () => {
    expect(fadeGain(60_000)).toBe(1);
    expect(fadeGain(FADE_MS)).toBe(1);
    expect(fadeGain(FADE_MS / 2)).toBeCloseTo(Math.SQRT1_2);
    expect(fadeGain(0)).toBe(0);
    // decreasing all the way down
    const g = [20_000, 15_000, 10_000, 5_000, 1_000, 0].map(fadeGain);
    expect(g).toEqual([...g].sort((a, b) => b - a));
  });
  it('the fade’s schedule from now to the end: the curve from where it is, ending silent at the timer’s end', () => {
    const c = fadeCurve(FADE_MS, 4);
    expect(c.map((p) => p.t)).toEqual([0, 5, 10, 15, 20]);
    expect(c[0].gain).toBe(1);
    expect(c.at(-1)!.gain).toBe(0);
    // resumed part-way (a pause in the fade): it starts at the level it had, over what's left
    const half = fadeCurve(8_000, 2);
    expect(half.map((p) => p.t)).toEqual([0, 4, 8]);
    expect(half[0].gain).toBeCloseTo(fadeGain(8_000), 3);
    expect(fadeCurve(0)).toEqual([{ t: 0, gain: 0 }]);
    expect(fadeCurve(90_000, 1)[0]).toEqual({ t: 0, gain: 1 }); // (clamped to the fade's own length)
  });
});

describe('the chapters', () => {
  it('the first is open; each next one opens as the one before is finished', () => {
    expect(unlocked(undefined, 1)).toBe(true);
    expect(unlocked(undefined, 2)).toBe(false);
    const p = finish(undefined, 1, '2026-11-06', 1);
    expect([1, 2, 3].map((ch) => unlocked(p, ch))).toEqual([true, true, false]);
    expect(unlocked({ done: { 3: '2026-11-01' } }, 3)).toBe(true); // finished before stays open
  });
  it('つづき: a chapter left part-way picks up at its segment; else the first not finished; all finished, the first again', () => {
    expect(nextOf(undefined, 5)).toEqual({ ch: 1, seg: 0 });
    let p = keepPlace(undefined, 1, 12, 5);
    expect(nextOf(p, 5)).toEqual({ ch: 1, seg: 12 });
    p = finish(p, 1, '2026-11-06', 6);
    expect(p.at).toBeUndefined();
    expect(p.last).toBe(6);
    expect(nextOf(p, 5)).toEqual({ ch: 2, seg: 0 });
    const all = { done: { 1: 'a', 2: 'a', 3: 'a', 4: 'a', 5: 'a' } };
    expect(nextOf(all, 5)).toEqual({ ch: 1, seg: 0 });
    // finishing keeps the first day it was finished, and a place in another chapter
    const q = finish({ done: { 2: '2026-11-01' }, at: { ch: 3, seg: 4 } }, 2, '2026-11-06', 7);
    expect(q).toEqual({ done: { 2: '2026-11-01' }, at: { ch: 3, seg: 4 }, last: 7 });
  });
  it('the night opens on the serial last played that has a chapter left, else the first with one', () => {
    expect(pickSerial({}, SERIALS)).toBe('st-cafe');
    const p: StoryProgress = { 'st-johnny': { done: { 1: 'a' }, last: 9 }, 'st-cafe': { done: { 1: 'a' }, last: 3 } };
    expect(pickSerial(p, SERIALS)).toBe('st-johnny');
    p['st-johnny'].done = { 1: 'a', 2: 'a', 3: 'a', 4: 'a', 5: 'a' };
    expect(pickSerial(p, SERIALS)).toBe('st-cafe');
    expect(pickSerial({}, [])).toBeNull();
  });
});

describe('the morning-after prediction', () => {
  const TODAY = '2026-11-07';
  it('offered the day after a chapter is finished, until the next one is begun, guessed or set aside for the day', () => {
    const p: StoryProgress = { 'st-johnny': { done: { 1: '2026-11-06' } } };
    expect(morningCard(p, SERIALS, TODAY)).toEqual({ unit: 'st-johnny', ch: 1 });
    expect(morningCard(p, SERIALS, '2026-11-06')).toBeNull(); // the same night: not yet
    expect(morningCard({ 'st-johnny': { ...p['st-johnny'], at: { ch: 2, seg: 3 } } }, SERIALS, TODAY)).toBeNull();
    expect(morningCard({ 'st-johnny': { done: { 1: '2026-11-05', 2: '2026-11-06' } } }, SERIALS, TODAY)).toEqual({ unit: 'st-johnny', ch: 2 });
    expect(morningCard({ 'st-johnny': { done: { 5: '2026-11-06' } } }, SERIALS, TODAY)).toBeNull(); // the last chapter: no next
    const g = guess(p['st-johnny'], 1, 2, 0);
    expect(g.guess).toEqual({ ch: 1, pick: 2, right: false });
    expect(morningCard({ 'st-johnny': g }, SERIALS, TODAY)).toBeNull();
    const l = later(p['st-johnny'], 1, TODAY);
    expect(morningCard({ 'st-johnny': l }, SERIALS, TODAY)).toBeNull();
    expect(morningCard({ 'st-johnny': l }, SERIALS, '2026-11-08')).toEqual({ unit: 'st-johnny', ch: 1 }); // あとで: today only
  });
  it('the most recently finished serial’s chapter first', () => {
    const p: StoryProgress = { 'st-cafe': { done: { 2: '2026-11-04' } }, 'st-johnny': { done: { 1: '2026-11-06' } } };
    expect(morningCard(p, SERIALS, TODAY)).toEqual({ unit: 'st-johnny', ch: 1 });
  });
  it('revealed when the next chapter is finished: the guess about it, right or not', () => {
    const p = guess({ done: { 1: '2026-11-06' } }, 1, 0, 0);
    expect(revealOf(p, 2)).toEqual({ pick: 0, right: true });
    expect(revealOf(p, 3)).toBeNull();
    expect(revealOf(undefined, 2)).toBeNull();
  });
});
