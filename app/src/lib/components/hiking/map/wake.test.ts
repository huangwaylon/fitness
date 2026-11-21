import { describe, expect, it } from 'vitest';
import { Wake } from './wake.ts';

function phone() {
  const locks: { released: boolean; fire(): void; release(): Promise<void>; addEventListener(t: 'release', cb: () => void): void }[] = [];
  let shown = true;
  const nav = {
    wakeLock: {
      request: async () => {
        let cb = () => {};
        const l = { released: false, fire: () => ((l.released = true), cb()), release: async () => l.fire(), addEventListener: (_: 'release', f: () => void) => (cb = f) };
        locks.push(l);
        return l;
      }
    }
  };
  const seen: boolean[] = [];
  const w = new Wake((x) => seen.push(x.on), nav, () => shown);
  return { w, locks, seen, hide: () => (shown = false), show: () => (shown = true) };
}
const tick = () => new Promise((r) => setTimeout(r, 0));

describe('画面をつけたままにする (the wake lock)', () => {
  it('on takes a lock, off lets it go', async () => {
    const p = phone();
    p.w.set(true);
    await tick();
    expect(p.locks.length).toBe(1);
    p.w.set(false);
    expect(p.locks[0].released).toBe(true);
    expect(p.w.on).toBe(false);
  });

  it('let go by the system while shown (Low Power Mode): the toggle reads off', async () => {
    const p = phone();
    p.w.set(true);
    await tick();
    p.locks[0].fire();
    expect(p.w.on).toBe(false);
    expect(p.seen.at(-1)).toBe(false);
  });

  it('let go as the page hides: still wanted, taken back when it shows', async () => {
    const p = phone();
    p.w.set(true);
    await tick();
    p.hide();
    p.locks[0].fire();
    expect(p.w.on).toBe(true);
    p.show();
    p.w.visible(true);
    await tick();
    expect(p.locks.length).toBe(2);
  });

  it('one lock at a time: a show while the ask is on its way asks no second; off and on again while asking keeps the one', async () => {
    const p = phone();
    p.w.set(true);
    p.w.visible(true);
    await tick();
    expect(p.locks.length).toBe(1);
    const q = phone();
    q.w.set(true);
    q.w.set(false);
    q.w.set(true);
    await tick();
    expect(q.locks.filter((l) => !l.released).length).toBe(1);
    expect(q.w.on).toBe(true);
    q.w.set(false);
    expect(q.locks.every((l) => l.released)).toBe(true);
  });

  it('no wake lock on the phone: off, unsupported', () => {
    const w = new Wake(() => {}, {}, () => true);
    w.set(true);
    expect([w.supported, w.on]).toEqual([false, false]);
  });
});
