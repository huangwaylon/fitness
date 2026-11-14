import { describe, expect, it } from 'vitest';
import { shown, staleAt, worst, type BotTone } from './types.ts';

const m = (tone: BotTone, needsLook = false) => ({ tone, needsLook });

describe('worst (the menu’s ボット)', () => {
  it('ranks bad > warn > unknown > busy > good > idle; needs a look when any does', () => {
    expect(worst([])).toBeNull();
    expect(worst([m('good'), m('bad'), m('warn')])).toEqual(m('bad'));
    expect(worst([m('idle'), m('warn', true), m('good')])).toEqual(m('warn', true));
    expect(worst([m('good'), m('unknown'), m('busy')])).toEqual(m('unknown'));
    expect(worst([m('good'), m('busy')])).toEqual(m('busy'));
    expect(worst([m('idle'), m('good')])).toEqual(m('good'));
    expect(worst([m('idle', true), m('good')])).toEqual(m('good', true));
  });
});

describe('shown (a dot as drawn)', () => {
  it('draws busy as good, raises a good or idle bot needing a look to warn 要対応, keeps warn and bad', () => {
    expect(shown({ tone: 'busy', needsLook: false, w: 'starting' })).toEqual({ tone: 'good', look: false, w: 'starting' });
    expect(shown({ tone: 'good', needsLook: true, w: 'healthy' })).toEqual({ tone: 'warn', look: true, w: 'needsYou' });
    expect(shown({ tone: 'idle', needsLook: true, w: 'stopped' })).toEqual({ tone: 'warn', look: true, w: 'needsYou' });
    expect(shown({ tone: 'warn', needsLook: true, w: 'late' })).toEqual({ tone: 'warn', look: true, w: 'late' });
    expect(shown({ tone: 'warn', needsLook: false, w: 'trouble' })).toEqual({ tone: 'warn', look: false, w: 'trouble' });
    expect(shown({ tone: 'bad', needsLook: true, w: 'broken' })).toEqual({ tone: 'bad', look: true, w: 'broken' });
    expect(shown({ tone: 'unknown', needsLook: false })).toEqual({ tone: 'unknown', look: false, w: 'unknown' });
  });
});

describe('staleAt', () => {
  it('stale once older than 3 polls; never read is stale', () => {
    expect(staleAt(null, 60_000, 0)).toBe(true);
    expect(staleAt(0, 60_000, 180_000)).toBe(false);
    expect(staleAt(0, 60_000, 180_001)).toBe(true);
    expect(staleAt(0, 15_000, 45_001)).toBe(true);
  });
});
