// A lesson's rules (lesson.ts) and every clip's content (clips/): the miss → replay → second try → 「答えはこれ」 flow,
// the dictation's words, the row's answers; each clip well-formed for the sheet and the record.
import { describe, expect, it } from 'vitest';
import { CLIPS } from './clips/index.ts';
import { againOf, answersOf, blank, dictate, draw, heard, pick, reveal } from './lesson.ts';
import { listenOf } from '#lib/contract/listen.ts';
import { cleanLine } from '#lib/contract/text.ts';

const clip = CLIPS[0];
const q = clip.questions[0]; // a: 1

describe('a choice', () => {
  it('right first: ◎; a miss replays and keeps the choices; right then: ○', () => {
    expect(pick(q, blank(), 1).st.r).toEqual({ k: 'first' });
    const miss = pick(q, blank(), 0);
    expect([miss.replay, miss.st.r, miss.st.miss]).toEqual([true, null, 1]);
    expect(pick(q, miss.st, 1).st.r).toEqual({ k: 'second' });
  });
  it('a second miss, or 答えを見る, shows the answer; a settled question takes no pick', () => {
    const two = pick(q, pick(q, blank(), 0).st, 2);
    expect([two.replay, two.st.r]).toEqual([false, { k: 'shown' }]);
    expect(reveal(pick(q, blank(), 0).st).r).toEqual({ k: 'shown' });
    expect(pick(q, two.st, 1).st).toBe(two.st);
  });
});

describe('a dictation', () => {
  const d = clip.questions.find((x) => x.answer)!;
  it('counts the words heard, case, curly quotes and punctuation aside; answered again, the latest counts', () => {
    const st = dictate(d, blank(), 'I’m doing BETTER.');
    expect(heard(st.r as never)).toEqual({ hit: 3, of: 3 });
    expect(heard(dictate(d, st, 'im doing').r as never)).toEqual({ hit: 1, of: 3 });
  });
});

describe('draw', () => {
  it('today: every question, in order (the banks will draw from here)', () => {
    expect(draw(clip, [])).toEqual(clip.questions);
  });
});

describe('まとめ and the row', () => {
  it('the scenes to hear again: anything not ◎ (unanswered too); the answers as a listen row takes them', () => {
    const st = clip.questions.map(() => blank());
    st[0] = pick(q, blank(), 1).st;
    st[1] = pick(clip.questions[1], pick(clip.questions[1], blank(), 0).st, 1).st;
    expect(againOf(clip.questions, st)).toEqual(clip.questions.map((_, i) => i).filter((i) => i !== 0));
    const r = answersOf(clip, clip.questions, st);
    expect(r).toEqual([[`${clip.id}-q1`, 1, 1, 0], [`${clip.id}-q2`, 0, 1, 1]]);
    expect(listenOf({ d: '2026-11-16', g: 'tvabcd12', gm: 'tv', u: clip.id, lv: 7, n: 1, ms: 1000, f: 1, r })).not.toBeNull();
  });
});

describe('the clips', () => {
  it('ids unique and short, the order a plain list', () => {
    expect(CLIPS.length).toBeGreaterThan(0);
    expect(new Set(CLIPS.map((c) => c.id)).size).toBe(CLIPS.length);
    for (const c of CLIPS) expect(c.id, c.id).toMatch(/^[a-z0-9][a-z0-9-]{0,11}$/);
  });
  for (const c of CLIPS)
    it(`${c.id}: a YouTube id, 6–12 questions in the clip, choices with one answer, ≤ 1 dictation, every note`, () => {
      expect(c.video).toMatch(/^[\w-]{11}$/);
      expect(['slow', 'mid', 'fast']).toContain(c.band);
      expect(c.questions.length).toBeGreaterThanOrEqual(6);
      expect(c.questions.length).toBeLessThanOrEqual(12);
      expect(c.questions.filter((x) => x.answer !== undefined).length).toBeLessThanOrEqual(1);
      for (const [i, x] of c.questions.entries()) {
        const at = `${c.id} q${i + 1}`;
        expect(x.seg[0], at).toBeGreaterThanOrEqual(0);
        expect(x.seg[1], at).toBeGreaterThan(x.seg[0]);
        expect(x.seg[1], at).toBeLessThanOrEqual(c.dur);
        if (x.choices) {
          expect(x.answer, at).toBeUndefined();
          expect(x.choices.length, at).toBeGreaterThanOrEqual(2);
          expect(new Set(x.choices).size, at).toBe(x.choices.length);
          expect(x.a !== undefined && x.a >= 0 && x.a < x.choices.length, at).toBe(true);
        } else expect(x.answer, at).toMatch(/^[a-z' ]+$/);
        for (const k of ['stem', 'cue', 'line', 'said', 'mean', 'trap', 'use'] as const) expect(x[k].trim().length, `${at} ${k}`).toBeGreaterThan(0);
        // what a flag quotes is clean enough for the record (contract/eflag.ts)
        for (const t of [x.stem, x.line]) expect(cleanLine(t, 400), at).toBe(t);
        // never say incorrect (docs/english.md "The page")
        for (const k of ['cue', 'said', 'mean', 'trap'] as const) expect(x[k], `${at} ${k}`).not.toMatch(/不正解|誤り|間違い|ざんねん|×/);
      }
    });
});
