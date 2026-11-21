// A lesson's rules (lesson.ts) over a made-up clip (fixture.ts): the miss → replay → second try → 「答えはこれ」 flow,
// the dictation's words, the row's answers.
import { describe, expect, it } from 'vitest';
import { fixture as clip } from './fixture.ts';
import { againOf, answersOf, blank, dictate, heard, pick, reveal, review, settled, stepped } from './lesson.ts';
import { listenOf } from '#lib/contract/listen.ts';

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

describe('まとめ and the row', () => {
  it('the scenes to hear again: anything not ◎ (unanswered too); the answers as a listen row takes them', () => {
    const st = clip.questions.map(() => blank());
    st[0] = pick(q, blank(), 1).st;
    st[1] = pick(clip.questions[1], pick(clip.questions[1], blank(), 0).st, 1).st;
    expect(againOf(clip.questions, st)).toEqual(clip.questions.map((_, i) => i).filter((i) => i !== 0));
    const r = answersOf(clip.questions, st);
    expect(r).toEqual([[clip.questions[0].id, 1, 1, 0], [clip.questions[1].id, 0, 1, 1]]);
    expect(listenOf({ d: '2026-11-16', g: 'tvabcd12', gm: 'tv', u: clip.id, lv: 7, n: 1, ms: 1000, f: 1, r })).not.toBeNull();
  });
});

describe('ふりかえり', () => {
  it('steps the scenes to hear again with picks of its own; past either end back at まとめ; the play’s states untouched', () => {
    const st = clip.questions.map(() => blank());
    st[0] = pick(q, blank(), 1).st;
    const again = againOf(clip.questions, st);
    let rv = review(again);
    expect([rv.of, rv.at, rv.st.every((x) => !x.r)]).toEqual([again, 0, true]);
    expect(stepped(rv, -1)).toBeNull();
    const q1 = clip.questions[again[0]];
    rv = settled(rv, pick(q1, rv.st[0], q1.a ?? 0).st);
    expect(rv.st[0].r).toEqual({ k: 'first' });
    for (let i = 1; i < again.length; i++) rv = stepped(rv, 1)!;
    expect(rv.at).toBe(again.length - 1);
    expect(stepped(rv, 1)).toBeNull();
    // まとめ's list and the row's answers as they were
    expect(againOf(clip.questions, st)).toEqual(again);
    expect(answersOf(clip.questions, st)).toEqual([[q.id, 1, 1, 0]]);
  });
});
