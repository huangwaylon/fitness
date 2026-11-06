import { describe, expect, it } from 'vitest';
import { MAX_DEPTH, inviteStack, taikaiStack, modeStack, pop, push, type Page } from './nav.ts';

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
    expect(push([{ k: 'unit', id: 'a' }], { k: 'unit', id: 'b' })).toHaveLength(2);
  });
  it('never grows past its depth', () => {
    let s: Page[] = [];
    for (const p of [{ k: 'asobu' }, { k: 'path' }, { k: 'unit', id: 'u' }, { k: 'zukan', unit: 'u' }, { k: 'zukan', unit: null }] as Page[]) s = push(s, p);
    expect(s).toHaveLength(MAX_DEPTH);
    expect(s.at(-1)).toEqual({ k: 'zukan', unit: null });
  });
  it('builds the deep links: the invite lands on みんなで, a mode over あそぶ, the たいかい banner on its lobby', () => {
    expect(inviteStack()).toEqual([{ k: 'lobby' }]);
    expect(taikaiStack()).toEqual([{ k: 'taikai' }]);
    expect(pop(inviteStack())).toEqual([]);
    expect(modeStack('ladder')).toEqual([{ k: 'asobu' }, { k: 'mode', m: 'ladder' }]);
  });
});
