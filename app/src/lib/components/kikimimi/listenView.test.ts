import { describe, expect, it } from 'vitest';
import { revealMemo } from './listenView.ts';

describe('revealMemo', () => {
  it('keeps the current game’s rounds only (an earlier game’s let go)', () => {
    const m = revealMemo<number>();
    for (let i = 0; i < 5; i++) m.keep('a', i, i * 10);
    expect([m.at('a', 3), m.at('a', 9), m.at('b', 3), m.at(null, 3)]).toEqual([30, null, null, null]);
    m.keep('b', 0, 1);
    expect([m.at('a', 3), m.at('b', 0)]).toEqual([null, 1]);
  });
});
