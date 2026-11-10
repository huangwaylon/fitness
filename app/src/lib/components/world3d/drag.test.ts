// The first drag's pixel-ratio swaps, logged once a load (drag.ts, the log's perf.drag).
import { describe, expect, it, vi } from 'vitest';
const logged = vi.hoisted(() => [] as [string, unknown][]);
vi.mock('#lib/sync/log.ts', () => ({ log: (e: string, d: unknown) => void logged.push([e, d]) }));
import { watchDrag } from './drag.ts';

describe('perf.drag', () => {
  it('the swap down and back, each its own ms and its first frame, once a load', () => {
    const src = { stats: () => ({ cpu: [6.04, 9] as [number, number], dpr: 2, shadowSize: 2048 }) };
    const on = watchDrag(src, 1.5);
    // (a swap back with none down first: nothing)
    on(false, 1, 2);
    on(true, 3.14, 41.26);
    on(false, 2.5, 30);
    expect(logged).toEqual([['perf.drag', { onSet: 3.1, onFrame: 41.3, offSet: 2.5, offFrame: 30, cpu: 6, dpr: 2, move: 1.5, sm: 2048 }]]);
    const again = watchDrag(src, 1.5);
    again(true, 1, 1);
    again(false, 1, 1);
    expect(logged).toHaveLength(1);
  });
});
