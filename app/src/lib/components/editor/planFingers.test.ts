import { describe, expect, test } from 'vitest';
import { planFingers, type FingerTool } from './planFingers.ts';
import type { View } from './plan.ts';

/** A tool that takes drags starting left of x = 100, its calls logged. */
function rig() {
  const log: string[] = [];
  let view: View = { s: 1, ox: 0, oy: 0 };
  const t: FingerTool = {
    local: (x, y) => [x, y],
    view: () => view,
    setView: (v) => void (view = v),
    tap: (x, y) => void log.push(`tap ${x},${y}`),
    grab: (x, y) => (log.push(`grab ${x},${y}`), x < 100),
    drag: (x, y) => void log.push(`drag ${x},${y}`),
    release: (done) => void log.push(`release ${done}`)
  };
  let ms = 1;
  const p = (id: number, x: number, y: number, isPrimary = id === 1) => ({ pointerId: id, clientX: x, clientY: y, timeStamp: (ms += 16), isPrimary });
  return { f: planFingers(t), log, p, view: () => view };
}

describe("the plan's fingers", () => {
  test('a tap acts where it lifts; no drag, no pan', () => {
    const { f, log, p, view } = rig();
    f.down(p(1, 50, 60));
    f.move(p(1, 53, 62));
    f.up(p(1, 53, 62));
    expect(log).toEqual(['tap 53,62']);
    expect(view()).toEqual({ s: 1, ox: 0, oy: 0 });
  });
  test("a drag the tool takes is the tool's, from where it went down, lifted done", () => {
    const { f, log, p, view } = rig();
    f.down(p(1, 50, 60));
    f.move(p(1, 70, 60));
    f.move(p(1, 90, 80));
    f.up(p(1, 90, 80));
    expect(log).toEqual(['grab 50,60', 'drag 70,60', 'drag 90,80', 'release true']);
    expect(view().ox).toBe(0);
  });
  test('a drag the tool leaves pans the view by the finger', () => {
    const { f, log, p, view } = rig();
    f.down(p(1, 150, 60));
    f.move(p(1, 170, 60));
    f.move(p(1, 180, 50));
    f.up(p(1, 180, 50));
    expect(log).toEqual(['grab 150,60']);
    expect(view()).toEqual({ s: 1, ox: 30, oy: -10 });
  });
  test("a second finger cancels the tool's drag and pinches the zoom about the middle; the finger left pans", () => {
    const { f, log, p, view } = rig();
    f.down(p(1, 50, 100));
    f.move(p(1, 70, 100));
    f.down(p(2, 170, 100));
    f.move(p(2, 270, 100));
    expect(log).toEqual(['grab 50,100', 'drag 70,100', 'release false']);
    // spread 100 → 200: twice the scale, the middle (120 → 170) moved 50
    expect(view().s).toBeCloseTo(2);
    f.up(p(2, 270, 100));
    const ox = view().ox;
    f.move(p(1, 80, 100));
    expect(view().ox).toBeCloseTo(ox + 10);
    f.up(p(1, 80, 100));
    expect(log.at(-1)).toBe('release false');
  });
  test("a cancelled finger undoes the tool's drag", () => {
    const { f, log, p } = rig();
    f.down(p(1, 50, 60));
    f.move(p(1, 80, 60));
    f.cancel(p(1, 80, 60));
    expect(log).toEqual(['grab 50,60', 'drag 80,60', 'release false']);
  });
});
