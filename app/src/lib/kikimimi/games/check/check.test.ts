// みみ チェック (games/check/): the adaptive walk (up after 2 right, down after 1 wrong, stop after two reversals), the
// placed stage and the per-skill profile, the next item's pick, and the round session dealing it round by round
// (GameDef.next at go and at each reveal, solo, nothing sent).
import { describe, expect, it } from 'vitest';
import { RoundSession, WINDOWS } from '../../round/session.ts';
import { registry } from '../../round/registry.ts';
import { quizOpts } from '../quiz/def.ts';
import type { QuizRound } from '../quiz/kinds.ts';
import {
  BANDS, CHECK_MAX, CHECK_MIN, CHECK_SEQ, CHECK_SKILLS, START_BAND, checkGame, checkNext, checkRow, lastPlacement, placedBand, placementOf, profileCode, profileOf, walkOf,
  type CheckItem
} from './def.ts';
import { checkPool, skillOfEntry } from './source.ts';
import { listenOf } from '../../../contract/listen.ts';

/** A listener who gets every item at or below `band` and misses every one above. */
const listener = (band: number) => (oks: boolean[]): boolean => walkOf(oks).band <= band;
/** A whole check by such a listener: its answers. */
function run(band: number): boolean[] {
  const oks: boolean[] = [], ok = listener(band);
  while (!walkOf(oks).stop) oks.push(ok(oks));
  return oks;
}

describe('the walk', () => {
  it('starts at かわ, goes up after 2 right in a row and down after 1 wrong', () => {
    expect(BANDS[START_BAND]).toBe(3);
    expect(walkOf([]).band).toBe(START_BAND);
    expect(walkOf([true]).band).toBe(START_BAND);
    expect(walkOf([true, true]).band).toBe(START_BAND + 1);
    expect(walkOf([false]).band).toBe(START_BAND - 1);
    // a right after a wrong starts the count again
    expect(walkOf([true, false, true]).band).toBe(START_BAND - 1);
    expect(walkOf([true, false, true, true]).band).toBe(START_BAND);
    // the bands each answer was at
    expect(walkOf([true, true, false, true]).at).toEqual([2, 2, 3, 2]);
  });

  it('stays in the ladder: no lower than はまべ 1, no higher than ほし', () => {
    expect(walkOf([false, false, false, false]).band).toBe(0);
    expect(walkOf(Array(12).fill(true)).band).toBe(BANDS.length - 1);
  });

  it('counts a reversal where it turns, and stops after two (at least CHECK_MIN items) or at CHECK_MAX', () => {
    const w = walkOf([true, true, false, true, true]);
    expect(w.reversals).toEqual([3, 2]);
    expect(w.stop).toBe(false); // (two reversals, but only 5 items)
    const oks = [true, true, false, true, true, false, true, true];
    expect(walkOf(oks).stop).toBe(true);
    expect(walkOf(Array(CHECK_MAX - 1).fill(true)).stop).toBe(false);
    expect(walkOf(Array(CHECK_MAX).fill(true)).stop).toBe(true);
    // every check ends between the bounds
    for (let b = 0; b < BANDS.length; b++) {
      const n = run(b).length;
      expect(n).toBeGreaterThanOrEqual(CHECK_MIN);
      expect(n).toBeLessThanOrEqual(CHECK_MAX);
    }
  });
});

describe('the placed stage', () => {
  it('is the reversals’ mean rounded down; none: where the walk got to', () => {
    expect(placedBand([true, true, false, true, true, false, true, true])).toBe(2); // turned at もり, かわ, もり → かわ
    expect(placedBand(Array(12).fill(true))).toBe(BANDS.length - 1);
    expect(placedBand(Array(8).fill(false))).toBe(0);
  });

  it('finds each listener’s band, or a step under it (never above)', () => {
    for (let b = 0; b < BANDS.length; b++) {
      const got = placedBand(run(b));
      expect(got).toBeLessThanOrEqual(b);
      expect(got).toBeGreaterThanOrEqual(b - 1);
    }
  });

  it('maps a band to its stage: はまべ 1 · 2, かわ, もり, やま, ほし', () => {
    const at = (band: number) => placementOf(run(band).map((ok, k) => ({ lv: BANDS[walkOf(run(band).slice(0, k)).band], skill: CHECK_SEQ[k], ok })));
    expect(at(BANDS.length - 1)).toMatchObject({ lv: 7, place: 'hoshi' });
    expect(at(0)).toMatchObject({ lv: 1, place: 'hama' });
    expect(placementOf([{ lv: 3, skill: 'num', ok: true }, { lv: 3, skill: 'reduce', ok: true }, { lv: 4, skill: 'reply', ok: false }, { lv: 3, skill: 'pair', ok: true },
      { lv: 3, skill: 'gist', ok: true }, { lv: 4, skill: 'num', ok: false }, { lv: 3, skill: 'reply', ok: true }, { lv: 3, skill: 'pair', ok: true }]).place).toBe('kawa');
  });
});

describe('the profile', () => {
  const answers = [
    { lv: 3, skill: 'num' as const, ok: true }, { lv: 3, skill: 'reduce' as const, ok: false }, { lv: 2, skill: 'reply' as const, ok: true },
    { lv: 2, skill: 'pair' as const, ok: true }, { lv: 3, skill: 'num' as const, ok: true }, { lv: 4, skill: 'num' as const, ok: true }
  ];
  it('gives each skill a band (a miss a band lower), the strongest and the weakest', () => {
    const p = placementOf(answers);
    expect(p.skills).toEqual({ num: 2, reduce: 1, reply: 1, pair: 1, gist: null });
    expect(p.strong).toBe('num');
    expect(p.weak).toBe('reduce'); // (a band like へんじ's and にた おと's, fewer right)
  });
  it('names none when every skill is the same', () => {
    expect(placementOf([{ lv: 3, skill: 'num', ok: true }, { lv: 3, skill: 'pair', ok: true }])).toMatchObject({ strong: null, weak: null });
  });
  it('rides the row’s u as a digit a skill, and comes back', () => {
    const p = placementOf(answers);
    expect(profileCode(p.skills)).toBe('2111x');
    expect(profileOf('2111x')).toEqual(p.skills);
    expect(profileOf('21')).toBeNull();
    expect(checkRow(p)).toEqual({ gm: 'check', u: '2111x', lv: p.lv });
  });
  it('is a row the relay keeps as it is (contract/listen.ts: no relay change)', () => {
    const row = { d: '2026-11-07', g: 'abcd1234', n: 1, ms: 150_000, r: [['p3-001', 1, 0, 0] as const], ...checkRow(placementOf(answers)) };
    expect(listenOf(row)).toEqual(row);
  });
  it('is the latest check row’s', () => {
    const games = [
      { gm: 'check', u: '22222', lv: 3, at: 1 }, { lv: 4, at: 5 }, { gm: 'check', u: '33333', lv: 4, at: 3 }, { gm: 'taikai', u: 'gold', lv: 4, at: 9 }
    ];
    expect(lastPlacement(games)).toEqual({ lv: 4, skills: { num: 3, reduce: 3, reply: 3, pair: 3, gist: 3 } });
    expect(lastPlacement([])).toBeNull();
  });
});

describe('the next item', () => {
  const pool: CheckItem[] = BANDS.flatMap((lv, b) => CHECK_SKILLS.flatMap((skill, s) => [0, 1, 2].map((k) => ({ n: b * 100 + s * 10 + k, lv, skill }))));
  it('is at the walk’s band and of the turn’s skill, never one already heard', () => {
    const first = checkNext(7, [], pool)!;
    expect(pool.find((x) => x.n === first)).toMatchObject({ lv: 3, skill: CHECK_SEQ[0] });
    const done = [{ n: first, ok: true }];
    const second = checkNext(7, done, pool)!;
    expect(pool.find((x) => x.n === second)).toMatchObject({ lv: 3, skill: CHECK_SEQ[1] });
    const third = checkNext(7, [...done, { n: second, ok: true }], pool)!;
    expect(pool.find((x) => x.n === third)).toMatchObject({ lv: 4, skill: CHECK_SEQ[2] });
    // the same answers, the same pick
    expect(checkNext(7, done, pool)).toBe(second);
  });
  it('borrows the nearest band’s (the lower first) when its own has none or isn’t loaded, and ends with the walk', () => {
    const noReply = pool.filter((x) => !(x.lv === 3 && x.skill === 'reply'));
    const two = [{ n: 1, ok: true }, { n: 2, ok: false }]; // (back down at はまべ 2 for the third: へんじ)
    expect(pool.find((x) => x.n === checkNext(1, [{ n: -1, ok: false }, { n: -2, ok: false }], noReply)!)!.lv).toBe(1);
    expect(noReply.find((x) => x.n === checkNext(1, two, noReply.filter((x) => x.lv !== 2))!)!.lv).toBe(1);
    expect(pool.find((x) => x.n === checkNext(1, [], pool, (lv) => lv !== 3)!)!.lv).toBe(2);
    expect(checkNext(1, Array.from({ length: CHECK_MAX }, (_, k) => ({ n: k, ok: true })), pool)).toBeNull();
  });
});

describe('the build’s pool', () => {
  it('has every skill at every band (or one next to it), and no アナウンス item', () => {
    const pool = checkPool();
    expect(pool.some((x) => x.lv === 5)).toBe(false);
    for (const skill of CHECK_SKILLS)
      for (let b = 0; b < BANDS.length; b++) expect(pool.some((x) => x.skill === skill && Math.abs(BANDS.indexOf(x.lv) - b) <= 1), `${skill} near ${BANDS[b]}`).toBe(true);
  });
  it('samples one skill per item', () => {
    expect(skillOfEntry({ lv: 3, type: 'num', tags: { pragmatic: 'literal', features: ['teen-ty'] } })).toBe('num');
    expect(skillOfEntry({ lv: 2, type: 'pic', tags: { pragmatic: 'literal', features: [] } })).toBe('gist');
    expect(skillOfEntry({ lv: 4, type: 'reply', tags: { pragmatic: 'literal', features: ['gonna'] } })).toBe('reduce');
    expect(skillOfEntry({ lv: 1, type: 'word', tags: { pragmatic: 'literal', features: ['l-r'] } })).toBe('pair');
    expect(skillOfEntry({ lv: 4, type: 'mean', tags: { pragmatic: 'indirect', features: [] } })).toBe('reply');
  });
});

describe('the session deals it round by round', () => {
  // a test's content: each band's items, every one's right choice 0, 2 s clips
  const pool: CheckItem[] = BANDS.flatMap((lv, b) => CHECK_SKILLS.flatMap((skill, s) => [0, 1, 2].map((k) => ({ n: b * 100 + s * 10 + k, lv, skill }))));
  const round = (n: number): QuizRound => ({ kind: 'quiz.word', id: `i${n}`, answer: 0, play: 2000 });
  const defs = registry([checkGame({
    rounds: (_seed, ids) => ids.map(round),
    next: (seed, done) => checkNext(seed, done.map((d) => ({ n: Number(d.id.slice(1)), ok: d.ok })), pool)
  })]);

  it('asks for the first at go and the next at each reveal; a listener at もり is placed at かわ or もり; nothing is sent', () => {
    const s = new RoundSession({ me: 'A', defs, random: () => 0.5 });
    let now = 1000;
    expect(s.open({ gm: 'check', o: quizOpts.encode({ lv: 3, timer: 30 }) }, now)).toEqual([]);
    expect(s.go(now)).toEqual([]);
    expect(s.view(now).n).toBe(1);
    const oks: boolean[] = [], ok = listener(3);
    for (let i = 0; i < CHECK_MAX + 2; i++) {
      let v = s.view(now);
      if (v.phase === 'results') break;
      while (v.phase !== 'answer') {
        now = Math.min(v.until, now + 500);
        v = s.view(now);
      }
      const right = ok(oks);
      oks.push(right);
      expect(s.answer(right ? 0 : 1, 0, now)).toEqual([]);
      v = s.view(now);
      expect(v.phase).toBe('reveal');
      expect(v.n).toBe(walkOf(oks).stop ? oks.length : oks.length + 1);
      expect(s.next(now)).toEqual([]);
    }
    const v = s.view(now);
    expect(v.phase).toBe('results');
    expect(v.n).toBe(oks.length);
    expect(walkOf(oks).stop).toBe(true);
    // each item at the band the walk was at
    expect(v.ids.map((n) => BANDS[Math.floor(n / 100)])).toEqual(walkOf(oks).at.map((b) => BANDS[b]));
    expect([2, 3]).toContain(placedBand(oks));
  });

  it('times a round out as a miss', () => {
    const s = new RoundSession({ me: 'A', defs, windows: WINDOWS, random: () => 0.5 });
    let now = 0;
    s.open({ gm: 'check', o: quizOpts.encode({ lv: 3, timer: 30 }) }, now);
    s.go(now);
    let v = s.view(now);
    while (v.phase !== 'reveal') {
      now = v.until;
      v = s.view(now);
    }
    expect(v.n).toBe(2);
    expect(Math.floor(v.ids[1] / 100)).toBe(START_BAND - 1);
  });
});
