import { describe, expect, it } from 'vitest';
import { finished, finishedStory, isNight, pickMenu, whimOf, type MenuIn, type Session } from './today.ts';
import { dayNum } from './progress.ts';

const BASE: MenuIn = { day: '2026-11-04', due: 14, recheck: null, next: null, lv: 3, whims: ['quiz', 'ladder', 'announce'], sessions: [] };
const quiz: Session = { p: false, ladder: false, lv: 3 };

describe('the daily menu', () => {
  it('three cards: おさらい capped at 8, today’s quiz at my place before units, a きまぐれ mode', () => {
    const m = pickMenu(BASE);
    expect(m.cards.map((c) => c.slot)).toEqual(['review', 'step', 'whim']);
    expect(m.cards[0].act).toEqual({ k: 'review', n: 8 });
    expect(m.cards[1].act).toEqual({ k: 'quiz', lv: 3 });
    expect(m.cards[2].act?.k).toBe('mode'); // (the quiz is card 2's already)
    expect(m.ok).toBe(false);
  });
  it('the same day gives the same menu; きまぐれ never repeats yesterday’s', () => {
    expect(pickMenu(BASE)).toEqual(pickMenu(BASE));
    for (let d = dayNum('2026-11-01'); d < dayNum('2026-12-31'); d++) expect(whimOf(d, BASE.whims, 'lesson')).not.toBe(whimOf(d - 1, BASE.whims, 'lesson'));
  });
  it('the 30-day recheck takes card 1; a unit’s next lesson is card 2', () => {
    const m = pickMenu({ ...BASE, recheck: 'tr-hotel', next: { unit: 'gl-clarify', lesson: 'bamen' } });
    expect(m.cards[0].act).toEqual({ k: 'recheck', unit: 'tr-hotel' });
    expect(m.cards[1].act).toEqual({ k: 'lesson', unit: 'gl-clarify', lesson: 'bamen' });
  });
  it('nothing due: card 1 is 「ぜんぶ おわり」, folded, and doesn’t make the day OK by itself', () => {
    const m = pickMenu({ ...BASE, due: 0 });
    expect(m.cards[0]).toMatchObject({ act: null, done: true });
    expect(m.ok).toBe(false);
    expect(m.all).toBe(false);
  });
  it('a session ticks the card it matches, else the first undone one; any one makes the day OK', () => {
    let m = pickMenu({ ...BASE, sessions: [quiz] });
    expect(m.cards.map((c) => c.done)).toEqual([false, true, false]);
    expect(m.ok).toBe(true);
    m = pickMenu({ ...BASE, sessions: [{ p: false, ladder: false, lv: 5 }] }); // アナウンス, no アナウンス card: the first undone
    const whim = m.cards[2].act;
    expect(m.cards.map((c) => c.done)).toEqual(whim?.k === 'mode' && whim.m === 'announce' ? [false, false, true] : [true, false, false]);
    m = pickMenu({ ...BASE, sessions: [{ p: true, ladder: false, lv: 2 }, quiz, { p: false, ladder: true, lv: 1 }] });
    expect(m.cards.every((c) => c.done)).toBe(true);
    expect(m.all).toBe(true);
  });
  it('a lesson of the current unit ticks card 2', () => {
    const m = pickMenu({ ...BASE, next: { unit: 'u1', lesson: 'deai' }, sessions: [{ p: false, ladder: false, lv: 3, u: 'u1' }] });
    expect(m.cards[1].done).toBe(true);
  });
  it('no other mode to pick: two cards', () => {
    expect(pickMenu({ ...BASE, whims: ['quiz'] }).cards.map((c) => c.slot)).toEqual(['review', 'step', 'whim']);
    expect(pickMenu({ ...BASE, whims: [] }).cards).toHaveLength(2);
  });
  it('at night きまぐれ is おやすみ ものがたり; a story heard ≥ 3 min ticks it, and nothing else does', () => {
    const night = { ...BASE, night: true };
    expect(pickMenu(night).cards[2].act).toEqual({ k: 'story' });
    expect(pickMenu(BASE).cards[2].act?.k).not.toBe('story');
    const story: Session = { p: false, ladder: false, lv: 4, story: true };
    expect(pickMenu({ ...night, sessions: [story] }).cards.map((c) => c.done)).toEqual([false, false, true]);
    // by day, a story ticks the first undone card (free play is never off the menu); a quiz never ticks the story card
    expect(pickMenu({ ...BASE, sessions: [story] }).cards.map((c) => c.done)).toEqual([true, false, false]);
    expect(pickMenu({ ...night, due: 0, sessions: [quiz, quiz] }).cards.map((c) => c.done)).toEqual([true, true, true]);
    expect(pickMenu({ ...night, due: 0, sessions: [quiz] }).cards[2].done).toBe(false);
  });
  it('きまぐれ picks しずえの ニュース only in the morning (05:00-11:00), else the next mode in turn', () => {
    const whims = ['tile', 'news', 'call'] as const, d = dayNum('2026-11-01');
    const day = [0, 1, 2].map((k) => d + k).find((x) => whimOf(x, whims, 'lesson') === 'news')!;
    expect([4, 5, 10, 11, 20].map((h) => whimOf(day, whims, 'lesson', h))).toEqual(['call', 'news', 'news', 'call', 'call']);
    expect(whimOf(day + 1, whims, 'lesson', 15)).toBe('call');
    expect(whimOf(day, ['news'], 'lesson', 15)).toBeNull();
    const on = ['2026-11-01', '2026-11-02', '2026-11-03'].find((x) => dayNum(x) === day)!;
    expect([8, 15].map((hour) => pickMenu({ ...BASE, day: on, whims, hour }).cards[2].act)).toEqual([{ k: 'mode', m: 'news' }, { k: 'mode', m: 'call' }]);
  });
  it('the night is 21:00-04:00; a story counts from 3 minutes', () => {
    expect([20, 21, 23, 0, 3, 4, 12].map(isNight)).toEqual([false, true, true, true, true, false, false]);
    expect([finishedStory(179_999), finishedStory(180_000)]).toEqual([false, true]);
  });
  it('a finished session has 4 answers', () => {
    expect(finished(3)).toBe(false);
    expect(finished(4)).toBe(true);
  });
});
