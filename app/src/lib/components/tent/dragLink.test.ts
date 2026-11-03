import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Intent, Relayed } from '#lib/sync/live-protocol.ts';
import { DRAG_MS, DragLink, KEEP_MS, SILENT_MS } from './dragLink.ts';

const T0 = 1_793_000_000_000;
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
});
afterEach(() => vi.useRealTimers());

const link = () => {
  const sent: Intent[] = [];
  return { l: new DragLink((d) => (sent.push(d), true)), sent };
};
const heard = (m: object, t = T0) => ({ v: 2, kind: 'drag', who: 'B', t, ...m }) as unknown as Relayed;

describe('my drag, as the partner sees it', () => {
  it('goes at most ten a second, only when it moved, again while it rests, and ends after the drop', () => {
    const { l, sent } = link();
    l.hold({ id: 'd1', item: 'f4041', fresh: true, x: 0.4, z: 10, f: 0 });
    expect(sent).toEqual([{ kind: 'drag', id: 'd1', x: 0, z: 10, f: 0, it: 'f4041' }]);
    l.hold({ id: 'd1', item: 'f4041', fresh: true, x: 10, z: 10, f: 0 });
    l.hold({ id: 'd1', item: 'f4041', fresh: true, x: 20, z: 10, f: 0 });
    expect(sent).toHaveLength(1);
    vi.advanceTimersByTime(DRAG_MS);
    expect(sent.at(-1)).toMatchObject({ x: 20 });
    expect(sent).toHaveLength(2);
    // resting under the finger: said again every KEEP_MS (the partner's phone keeps it held)
    vi.advanceTimersByTime(KEEP_MS);
    expect(sent).toHaveLength(3);
    l.release();
    expect(sent.at(-1)).toMatchObject({ id: 'd1', end: true });
    vi.advanceTimersByTime(5000);
    expect(sent).toHaveLength(4);
    // a placed piece's update (a real id: TentEdit's newId, 12 characters) is about 60 bytes
    expect(JSON.stringify({ v: 2, kind: 'drag', id: 'dmhabc12xyz9', x: -35, z: -35, f: 3 }).length).toBeLessThanOrEqual(64);
  });
});

describe('the partner’s drag, here', () => {
  it('holds the piece where their finger has it, lets it go at the end, or when they fall silent', () => {
    const { l } = link();
    expect(l.heard(heard({ id: 'd1', x: -5, z: 3, f: 1, it: 'f4041' }))).toBe(true);
    expect(l.heldThere('d1')).toMatchObject({ item: 'f4041', x: -5, f: 1, since: T0 });
    // a later update needs no item
    l.heard(heard({ id: 'd1', x: 5, z: 3, f: 1 }, T0 + 100));
    expect(l.theirs()).toEqual([expect.objectContaining({ x: 5, since: T0 })]);
    expect(l.heard(heard({ id: 'd1', x: 5, z: 3, f: 1, end: true }))).toBe(true);
    expect(l.theirs()).toEqual([]);
    // an unknown piece without its item is nothing to show
    expect(l.heard(heard({ id: 'd9', x: 5, z: 3, f: 0 }))).toBe(false);
    // a placed one's item is the room's
    expect(l.heard(heard({ id: 'd9', x: 5, z: 3, f: 0 }), (id) => (id === 'd9' ? 'f4038' : undefined))).toBe(true);
    expect(l.heldThere('d9')?.item).toBe('f4038');
    l.heard(heard({ id: 'd9', x: 5, z: 3, f: 0, end: true }));
    l.heard(heard({ id: 'd2', x: 0, z: 0, f: 0, it: 'f1432' }));
    vi.advanceTimersByTime(SILENT_MS - 1);
    expect(l.expire()).toBe(false);
    vi.advanceTimersByTime(2);
    expect(l.expire()).toBe(true);
    expect(l.theirs()).toEqual([]);
    l.heard(heard({ id: 'd3', x: 0, z: 0, f: 0, it: 'f1432' }));
    expect(l.gone()).toBe(true);
  });
});
