// English Study's flags on the phone (flags.ts): what a flag sends (the record takes it as it is), and 報告した内容's
// list with the reviews folded in, newest first.
import { describe, expect, it } from 'vitest';
import type { EventRow } from '#lib/contract/api.ts';
import { eflagOf } from '#lib/contract/eflag.ts';
import { CLIPS } from './clips/index.ts';
import { flagData, flagsOf } from './flags.ts';
import { questionHash } from './hash.ts';

const clip = CLIPS[0];

describe('flagData', () => {
  it('a question’s flag: what was shown, its version, the time to 0.1 s, the note cleaned; the record takes it', () => {
    const f = flagData(clip, clip.questions[1], 'answer', '  100ドル\nじゃない？ ', 4.234);
    expect(f).toMatchObject({ item: clip.id, q: 1, kind: 'answer', note: '100ドル じゃない？', t: 4.2, v: questionHash(clip.questions[1]) });
    expect(f.seen).toEqual({ stem: clip.questions[1].stem, answer: clip.questions[1].choices![clip.questions[1].a!], line: clip.questions[1].line });
    expect(eflagOf(f as unknown as Record<string, unknown>)).toEqual(f);
  });
  it('a clip’s flag, no note, no player yet', () => {
    const f = flagData(clip, null, 'other', '   ', null);
    expect(f).toEqual({ item: clip.id, q: null, kind: 'other', v: expect.any(String), seen: null });
    expect(eflagOf(f as unknown as Record<string, unknown>)).toEqual(f);
  });
  it('a dictation’s answer is its words', () => {
    const i = clip.questions.findIndex((x) => x.answer);
    expect(flagData(clip, clip.questions[i], 'heard', '', 1).seen?.answer).toBe(clip.questions[i].answer);
  });
});

describe('flagsOf', () => {
  it('newest first, each with its review; junk skipped', () => {
    const f1 = flagData(clip, clip.questions[0], 'answer', '', 1), f2 = flagData(clip, null, 'timing', 'ずれてる', null);
    const rows: EventRow[] = [
      ['2026-11-16T01:00:00.000Z', 'A', 'f1', 'eflag', JSON.stringify(f1)],
      ['2026-11-16T02:00:00.000Z', 'G', 'f2', 'eflag', JSON.stringify(f2)],
      ['2026-11-16T03:00:00.000Z', 'A', 'd1', 'eflag_done', JSON.stringify({ flag: 'f1', outcome: 'fixed', note: '直しました' })],
      ['2026-11-16T04:00:00.000Z', 'A', 'x', 'eflag', '{'],
      ['2026-11-16T04:00:00.000Z', 'A', 'y', 'eflag', JSON.stringify({ item: 'x' })]
    ];
    expect(flagsOf(rows).map((x) => [x.id, x.who, x.done])).toEqual([['f2', 'G', null], ['f1', 'A', { outcome: 'fixed', note: '直しました' }]]);
  });
});
