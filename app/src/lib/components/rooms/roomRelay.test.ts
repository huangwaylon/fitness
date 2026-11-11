import { describe, expect, it, vi } from 'vitest';
import { replayWalk } from './roomRelay.ts';

const eng = () => ({ put: vi.fn(), walk: vi.fn(() => 0) });

describe('a walk heard in a room', () => {
  it('plays on from where it is by now while under way', () => {
    const e = eng();
    replayWalk(e, { v: 3, t: 0, kind: 'tent', who: 'B', in: true, from: [0, 0], via: [[5, 0]], to: [5, 5], s: 1000, ms: 2000 }, 1500);
    expect(e.walk).toHaveBeenCalledWith('B', [[5, 0], [5, 5]], { from: [0, 0], ago: 500, ms: 2000 });
    expect(e.put).not.toHaveBeenCalled();
  });
  it("stands there once it's over, or with no walk to it", () => {
    const e = eng();
    replayWalk(e, { v: 3, t: 0, kind: 'tent', who: 'B', in: true, from: [0, 0], to: [5, 5], s: 1000, ms: 2000 }, 3000);
    replayWalk(e, { v: 3, t: 0, kind: 'tent', who: 'G', in: true, to: [1, 2] }, 3000);
    expect(e.put.mock.calls).toEqual([['B', [5, 5]], ['G', [1, 2]]]);
    expect(e.walk).not.toHaveBeenCalled();
  });
});
