import { describe, expect, it } from 'vitest';
import { gridPath, pullStraight, type Grid } from './gridPath.ts';

/** A grid from rows of text: '#' closed, anything else open (row j is z, column i is x). */
const grid = (...rows: string[]): Grid => ({ cols: rows[0].length, rows: rows.length, free: (i, j) => rows[j][i] !== '#' });
const steps = (cells: readonly (readonly [number, number])[]) =>
  cells.reduce((n, c, k) => (k ? n + (c[0] !== cells[k - 1][0] && c[1] !== cells[k - 1][1] ? Math.SQRT2 : 1) : 0), 0);

describe('gridPath: the rooms’ A* (tent, shop, museum)', () => {
  it('an open floor: the diagonal, the cells after the start up to the goal', () => {
    const { cells, reached } = gridPath(grid('....', '....', '....', '....'), [0, 0], [3, 3]);
    expect(reached).toBe(true);
    expect(cells).toEqual([[1, 1], [2, 2], [3, 3]]);
  });

  it('there already: no cells, reached', () => {
    expect(gridPath(grid('..', '..'), [1, 0], [1, 0])).toEqual({ cells: [], reached: true });
  });

  it('round a wall, never cutting a closed corner (the museum’s jambs, the tent’s pieces)', () => {
    const g = grid('.....', '.###.', '.....');
    const { cells, reached } = gridPath(g, [0, 1], [4, 1]);
    expect(reached).toBe(true);
    expect(cells.at(-1)).toEqual([4, 1]);
    expect(cells.every(([i, j]) => g.free(i, j))).toBe(true);
    for (let k = 1; k < cells.length; k++) {
      const [a, b] = [cells[k - 1], cells[k]];
      if (a[0] !== b[0] && a[1] !== b[1]) expect(g.free(b[0], a[1]) && g.free(a[0], b[1])).toBe(true);
    }
    // the shortest: up a row, along, down again (no diagonal past the wall's ends)
    expect(steps([[0, 1], ...cells])).toBeCloseTo(6, 5);
  });

  it('a diagonal gap between two closed cells is no way through', () => {
    const { reached } = gridPath(grid('.#', '#.'), [0, 0], [1, 1]);
    expect(reached).toBe(false);
  });

  it('a walled-off goal (the tent’s piece, the shop’s counter): the walk to the reachable cell nearest it', () => {
    const { cells, reached } = gridPath(grid('...#.', '...#.', '...#.'), [0, 0], [4, 1]);
    expect(reached).toBe(false);
    expect(cells.at(-1)).toEqual([2, 1]);
  });

  it('a closed goal cell is not reached; nowhere nearer than the start: no cells', () => {
    expect(gridPath(grid('.#'), [0, 0], [1, 0])).toEqual({ cells: [], reached: false });
  });

  it('the start’s own cell is never closed to it: one standing at a piece’s edge walks off', () => {
    const { cells, reached } = gridPath(grid('#..'), [0, 0], [2, 0]);
    expect(reached).toBe(true);
    expect(cells).toEqual([[1, 0], [2, 0]]);
  });

  it('a big room (the museum’s 12 × 25 tiles in half-tile cells): through each wall’s gap in turn', () => {
    const rows = Array.from({ length: 50 }, (_, j) => (j % 6 === 3 ? '#'.repeat(20) + '....' : '.'.repeat(24)));
    const { cells, reached } = gridPath(grid(...rows), [0, 0], [0, 49]);
    expect(reached).toBe(true);
    for (let j = 3; j < 50; j += 6) expect(cells.some(([i, cj]) => cj === j && i >= 20)).toBe(true);
  });
});

describe('pullStraight', () => {
  const pts: [number, number][] = [[1, 0], [2, 0], [2, 1], [2, 2], [3, 2]];
  it('everything in sight: straight to the last', () => {
    expect(pullStraight([0, 0], pts, () => true)).toEqual([[3, 2]]);
  });
  it('nothing in sight: every point', () => {
    expect(pullStraight([0, 0], pts, () => false)).toEqual(pts);
  });
  it('on to the farthest point in sight, then on from there', () => {
    // a wall along x = 1.5 from z = 0.5 up: from (0, 0) only z = 0 is in sight past it
    const sees = (a: readonly number[], b: readonly number[]) => !(Math.min(a[0], b[0]) < 1.5 && Math.max(a[0], b[0]) > 1.5 && Math.max(a[1], b[1]) > 0.5);
    expect(pullStraight([0, 0], pts, sees)).toEqual([[2, 0], [3, 2]]);
  });
  it('no points: none', () => {
    expect(pullStraight([0, 0], [], () => true)).toEqual([]);
  });
});
