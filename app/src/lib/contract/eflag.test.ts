// contract/eflag.ts: English Study's flags and their reviews, as the record takes them.
import { describe, expect, it } from 'vitest';
import { eflagDoneOf, eflagOf } from './eflag.ts';

const seen = { stem: 'How much does she ask for?', answer: '$100', line: 'a *hundred dollar* advance' };
const flag = { item: 'waitress', q: 1, kind: 'answer', note: '100じゃなくて？', t: 4.2, v: 'k3f9a1', seen };

describe('eflagOf', () => {
  it('takes a question’s flag and a clip’s, the note and the time optional', () => {
    expect(eflagOf(flag)).toEqual(flag);
    expect(eflagOf({ item: 'waitress', q: null, kind: 'other', v: 'abc', seen: null })).toEqual({ item: 'waitress', q: null, kind: 'other', v: 'abc', seen: null });
    const { note: _n, t: _t, ...bare } = flag;
    expect(eflagOf(bare)).toEqual(bare);
  });
  it('refuses anything else', () => {
    for (const bad of [{ ...flag, extra: 1 }, { ...flag, item: 'Waitress' }, { ...flag, item: 'a'.repeat(13) }, { ...flag, q: -1 }, { ...flag, q: 1.5 }, { ...flag, q: undefined },
      { ...flag, kind: 'wrong' }, { ...flag, note: '' }, { ...flag, note: ' x' }, { ...flag, note: 'a\u0007b' }, { ...flag, note: 'x'.repeat(201) }, { ...flag, t: -1 }, { ...flag, t: 1.25 },
      { ...flag, t: '4' }, { ...flag, v: '' }, { ...flag, v: 'ABC' }, { ...flag, seen: null }, { ...flag, q: null }, { ...flag, seen: { ...seen, stem: '' } },
      { ...flag, seen: { ...seen, more: 'x' } }, { ...flag, seen: 'x' }])
      expect(eflagOf(bad as Record<string, unknown>), JSON.stringify(bad)).toBeNull();
  });
});

describe('eflagDoneOf', () => {
  it('takes the review’s answer, its note optional; refuses anything else', () => {
    expect(eflagDoneOf({ flag: 'e123', outcome: 'fixed' })).toEqual({ flag: 'e123', outcome: 'fixed' });
    expect(eflagDoneOf({ flag: 'e123', outcome: 'kept', note: 'このままです' })).toEqual({ flag: 'e123', outcome: 'kept', note: 'このままです' });
    for (const bad of [{ flag: '', outcome: 'fixed' }, { flag: 'e1', outcome: 'done' }, { flag: 'e1', outcome: 'fixed', note: '' }, { flag: 'e1', outcome: 'fixed', x: 1 }])
      expect(eflagDoneOf(bad), JSON.stringify(bad)).toBeNull();
  });
});
