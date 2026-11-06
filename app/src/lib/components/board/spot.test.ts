// The board's art height is the one layout/hides.ts covers the ground behind it by (clear.ts tapCovered's rows).
import { describe, expect, it } from 'vitest';
import { FRONT_ART_H, frontRows } from '#lib/layout/hides.ts';
import { BOARD_H } from './spot.ts';

describe("the board's art", () => {
  it('stands as tall as hides.ts takes it (three rows behind it kept clear)', () => {
    expect(Math.round(BOARD_H)).toBe(FRONT_ART_H.board);
    expect(frontRows('board')).toBe(3);
  });
});
