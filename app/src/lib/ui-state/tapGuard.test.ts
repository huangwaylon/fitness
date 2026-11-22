// tapGuard: a carried-over tap on a button just come up is turned away, by its pointerdown, else by the click's time.
import { describe, expect, it } from 'vitest';
import { tapGuard } from './tapGuard.ts';

describe('tapGuard', () => {
  it('turns away a click within the window, takes one after', () => {
    const g = tapGuard(600);
    g.arm(1000);
    expect(g.ok(1100)).toBe(false);
    expect(g.ok(1599)).toBe(false);
    expect(g.ok(1600)).toBe(true);
  });
  it('times a touch by its pointerdown: a carried tap released late is still turned away', () => {
    const g = tapGuard(600);
    g.arm(1000);
    g.down(1200);
    expect(g.ok(1700)).toBe(false);
    // the next touch, begun after the window
    g.down(1700);
    expect(g.ok(1750)).toBe(true);
  });
  it('without a pointerdown (VoiceOver, a keyboard): the click’s own time', () => {
    const g = tapGuard(600);
    g.arm(0);
    expect(g.ok(300)).toBe(false);
    expect(g.ok(900)).toBe(true);
  });
  it('a cancelled or stale pointerdown isn’t the click’s', () => {
    const g = tapGuard(600);
    g.arm(0);
    g.down(100);
    g.down(null);
    expect(g.ok(700)).toBe(true);
    g.arm(10_000);
    g.down(10_100);
    expect(g.ok(12_000)).toBe(true);
  });
  it('arming again starts the window again (back from ふりかえり)', () => {
    const g = tapGuard(600);
    g.arm(0);
    expect(g.ok(5000)).toBe(true);
    g.arm(5000);
    expect(g.ok(5100)).toBe(false);
  });
  it('unarmed: every click acts', () => {
    expect(tapGuard().ok(0)).toBe(true);
  });
});
