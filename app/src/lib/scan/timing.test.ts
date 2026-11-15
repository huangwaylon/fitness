import { describe, expect, it } from 'vitest';
import { ScanTiming } from './timing.ts';

describe('ScanTiming: one scanner session as perf.scan', () => {
  it('open → first frame (the first start), → read (from the last start); decode and grab p50 and max', () => {
    let t = 0;
    const s = new ScanTiming(() => t);
    s.open();
    t = 400;
    s.frame();
    for (const [g, d] of [[1, 2], [2, 9.04], [1.5, 3]]) s.frameRead(g, d);
    t = 1000;
    s.open();
    t = 1500;
    s.frame();
    t = 2200;
    s.read();
    expect(s.fields()).toEqual({ frame: 400, read: 1200, dec50: 3, decMax: 9, grab: 1.5, n: 3, end: 'read' });
  });
  it('no camera, no frames: n 0 and how it ended only', () => {
    const s = new ScanTiming(() => 0);
    s.end = 'typed';
    expect(s.fields()).toEqual({ n: 0, end: 'typed' });
  });
});
