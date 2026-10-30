import { describe, expect, it } from 'vitest';
import { hitStage, inRRect } from './sceneTaps.ts';
import { BED_ROWS, BED_X, HEDGE_BASE, HEDGE_X, PLATEAU } from './scene.ts';

describe('hitStage', () => {
  it('finds each hedge bush by its tile', () => {
    HEDGE_X.forEach((x, i) => expect(hitStage(x + 10, HEDGE_BASE - 20)).toEqual({ kind: 'bush', i }));
  });
  it('finds the flowers, the front row first where the rows overlap', () => {
    expect(hitStage(BED_X.left[0], BED_ROWS[0] - 20)).toEqual({ kind: 'flower', row: 0, col: 0 });
    expect(hitStage(BED_X.right[1], BED_ROWS[1] - 2)).toEqual({ kind: 'flower', row: 1, col: 3 });
    expect(hitStage(BED_X.left[1], BED_ROWS[0])).toEqual({ kind: 'flower', row: 1, col: 1 });
  });
  it('falls back to grass, sand and sea', () => {
    expect(hitStage(195, 230)).toEqual({ kind: 'grass' });
    expect(hitStage(195, 340)).toEqual({ kind: 'sand' });
    expect(hitStage(10, 200)).toEqual({ kind: 'sea' });
    expect(hitStage(400, 200)).toEqual({ kind: 'sea' });
    expect(hitStage(195, 8)).toEqual({ kind: 'sea' });
  });
});

describe('inRRect', () => {
  it('cuts the rounded corners', () => {
    expect(inRRect(PLATEAU, PLATEAU.x0 + 2, PLATEAU.y0 + 2)).toBe(false);
    expect(inRRect(PLATEAU, PLATEAU.x0 + 2, (PLATEAU.y0 + PLATEAU.y1) / 2)).toBe(true);
    expect(inRRect(PLATEAU, PLATEAU.x1 - 2, PLATEAU.y1 - 2)).toBe(false);
  });
});
