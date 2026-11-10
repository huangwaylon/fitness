import { describe, expect, it } from 'vitest';
import { hostLine, revealMemo } from './listenView.ts';

describe('revealMemo', () => {
  it('keeps the current game’s rounds only (an earlier game’s let go)', () => {
    const m = revealMemo<number>();
    for (let i = 0; i < 5; i++) m.keep('a', i, i * 10);
    expect([m.at('a', 3), m.at('a', 9), m.at('b', 3), m.at(null, 3)]).toEqual([30, null, null, null]);
    m.keep('b', 0, 1);
    expect([m.at('a', 3), m.at('b', 0)]).toEqual([null, 1]);
  });
});

describe('hostLine', () => {
  it('all of them, half or more, fewer', () => {
    expect([hostLine('kiki.x.host', 8, 8), hostLine('kiki.x.host', 4, 8), hostLine('kiki.x.host', 3, 8), hostLine('kiki.x.host', 0, 0)]).toEqual(['kiki.x.host.all', 'kiki.x.host.some', 'kiki.x.host.few', 'kiki.x.host.some']);
  });
});
