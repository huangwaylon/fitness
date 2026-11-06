import { describe, expect, it } from 'vitest';
import type { RosterId } from '#lib/villagers/roster.ts';
import type { Answer } from './progress.ts';
import { FRIEND_LEVELS, friendOrder, friendsOf, greetingOf, letterOf, levelOf, levelUps, nextReward, pointsFor, rewardsAt } from './friendship.ts';

const ans = (id: string, d: string, ok = true, rp = 0): Answer => ({ id, ok, pick: 0, rp, d, g: 'g', lv: 2, p: false });
const WHO: Record<string, RosterId[]> = { a: ['maple'], b: ['dom'], d: ['maple', 'dom', 'maple'] };
const who = (id: string) => WHO[id];

describe('なかよし', () => {
  it('+2 on the first listen, +1 after a replay, nothing for a miss; a dialogue counts each villager once', () => {
    expect([pointsFor({ ok: true, rp: 0 }), pointsFor({ ok: true, rp: 2 }), pointsFor({ ok: false, rp: 0 })]).toEqual([2, 1, 0]);
    const f = friendsOf([ans('a', '2026-11-01'), ans('a', '2026-11-02', true, 1), ans('b', '2026-11-02', false), ans('d', '2026-11-03'), ans('zz', '2026-11-04')], who);
    expect(f.get('maple')).toEqual({ points: 5, level: 0, heard: 3, last: '2026-11-03' });
    expect(f.get('dom')).toEqual({ points: 2, level: 0, heard: 2, last: '2026-11-03' });
    expect(f.size).toBe(2);
  });
  it('never drops: more answers, right or wrong, never lower the points', () => {
    const answers = Array.from({ length: 40 }, (_, k) => ans('a', '2026-11-01', k % 3 !== 0, k % 2));
    let was = 0;
    for (let n = 1; n <= answers.length; n++) {
      const p = friendsOf(answers.slice(0, n), who).get('maple')!.points;
      expect(p).toBeGreaterThanOrEqual(was);
      was = p;
    }
  });
  it('levels at 10 / 30 / 70 / 150 / 300, each with its reward', () => {
    expect(FRIEND_LEVELS).toEqual([10, 30, 70, 150, 300]);
    expect([0, 9, 10, 29, 30, 70, 149, 150, 300, 9999].map(levelOf)).toEqual([0, 0, 1, 1, 2, 3, 3, 4, 5, 5]);
    expect(rewardsAt(0)).toEqual([]);
    expect(rewardsAt(2)).toEqual(['greeting', 'letter']);
    expect(rewardsAt(5)).toHaveLength(5);
    expect([nextReward(0), nextReward(3), nextReward(5)]).toEqual(['greeting', 'frame', null]);
    // 5 first-listen rights: level 1
    expect(friendsOf(Array.from({ length: 5 }, () => ans('a', '2026-11-01')), who).get('maple')!.level).toBe(1);
  });
  it('a heart only at a level-up: above the level last shown, once', () => {
    const f = new Map<RosterId, { level: number }>([['maple', { level: 2 }], ['dom', { level: 1 }], ['bob', { level: 0 }]]);
    expect(levelUps(f, { dom: 1 })).toEqual([{ who: 'maple', from: 0, to: 2 }]);
    expect(levelUps(f, { maple: 2, dom: 1 })).toEqual([]);
  });
  it('the list: the closest first', () => {
    const f = friendsOf([ans('b', '2026-11-01'), ...Array.from({ length: 6 }, () => ans('a', '2026-11-01'))], who);
    expect(friendOrder(f)).toEqual(['maple', 'dom']);
  });
  it('the greeting and the letter, by personality, with the names filled in', () => {
    const g = greetingOf('jock', 'ウェイ', 'ちゃちゃまる');
    expect(g.en).toContain('ウェイ');
    expect(g.en).not.toContain('{');
    const l = letterOf(null, 'ウェイ', 'しずえ');
    expect(l.en).toMatch(/しずえ$/);
    expect(l.ja).toContain('ウェイさんへ');
  });
});
