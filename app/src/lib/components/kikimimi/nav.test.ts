import { describe, expect, it } from 'vitest';
import { MAX_DEPTH, modeStack, pop, push, type Page } from './nav.ts';

describe('the one stack', () => {
  it('pushes over the hub and pops back to it', () => {
    let s: Page[] = [];
    s = push(s, { k: 'asobu' });
    s = push(s, { k: 'mode', m: 'quiz' });
    expect(s).toEqual([{ k: 'asobu' }, { k: 'mode', m: 'quiz' }]);
    s = pop(s);
    expect(s).toEqual([{ k: 'asobu' }]);
    s = pop(pop(s));
    expect(s).toEqual([]);
  });
  it('keeps a page already on top once', () => {
    expect(push([{ k: 'record' }], { k: 'record' })).toEqual([{ k: 'record' }]);
    expect(push([{ k: 'mode', m: 'quiz' }], { k: 'mode', m: 'tile' })).toHaveLength(2);
  });
  it('never grows past its depth', () => {
    let s: Page[] = [];
    for (const p of [{ k: 'asobu' }, { k: 'mode', m: 'quiz' }, { k: 'settings' }, { k: 'story' }, { k: 'record' }] as Page[]) s = push(s, p);
    expect(s).toHaveLength(MAX_DEPTH);
    expect(s.at(-1)).toEqual({ k: 'record' });
  });
  it('builds the deep link: a mode over あそぶ', () => {
    expect(pop(modeStack('ladder'))).toEqual([{ k: 'asobu' }]);
    expect(modeStack('ladder')).toEqual([{ k: 'asobu' }, { k: 'mode', m: 'ladder' }]);
  });
});
