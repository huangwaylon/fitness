// The door's iris (doorTransition.ts) holds a 島 ⇄ テント navigation for its close; one started meanwhile (a back
// swipe, a second tap) waits for it, so the screen ends on the newer one: SvelteKit applies a navigation once its
// onNavigate callbacks resolve, without asking whether a newer one has started, and the held one, landing last,
// left `/` showing the tent.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Nav = { from: { url: URL } | null; to: { url: URL } | null; complete: Promise<void> };
let cb: ((n: Nav) => Promise<void> | void) | null = null;
vi.mock('$app/navigation', () => ({ onNavigate: (fn: typeof cb) => void (cb = fn) }));
vi.mock('$app/paths', () => ({ base: '', resolve: (p: string) => p }));

const nav = (from: string, to: string) => {
  let done!: () => void, fail!: (e: Error) => void;
  const complete = new Promise<void>((ok, no) => ((done = ok), (fail = no)));
  complete.catch(() => {});
  return { n: { from: { url: new URL(`http://x${from}`) }, to: { url: new URL(`http://x${to}`) }, complete }, done, fail };
};

beforeEach(() => {
  vi.useFakeTimers();
  const root = { dataset: {} as Record<string, string>, style: { setProperty() {} } };
  vi.stubGlobal('document', { documentElement: root });
  vi.stubGlobal('innerWidth', 390);
  vi.stubGlobal('innerHeight', 844);
  vi.stubGlobal('requestAnimationFrame', (f: () => void) => setTimeout(f, 16));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('the door transition', () => {
  it('a navigation started while the iris closes waits for the held one to land first', async () => {
    const { doorTransition } = await import('./doorTransition.ts');
    doorTransition();
    const order: string[] = [];
    const tent = nav('/', '/tent');
    void Promise.resolve(cb!(tent.n)).then(() => order.push('tent'));
    await vi.advanceTimersByTimeAsync(80);
    // back to the island 80 ms in (the island still the current page: no door of its own)
    const back = nav('/', '/');
    void Promise.resolve(cb!(back.n)).then(() => order.push('back'));
    await vi.advanceTimersByTimeAsync(0);
    expect(order).toEqual([]);
    await vi.advanceTimersByTimeAsync(200);
    expect(order).toEqual(['tent']);
    // the held one applied (then aborted by the newer one's token): the newer goes on
    tent.fail(new Error('navigation aborted'));
    await vi.advanceTimersByTimeAsync(0);
    expect(order).toEqual(['tent', 'back']);
  });
  it('a lone door navigation is held only for the close', async () => {
    const { doorTransition } = await import('./doorTransition.ts');
    doorTransition();
    let landed = false;
    void Promise.resolve(cb!(nav('/', '/tent').n)).then(() => (landed = true));
    await vi.advanceTimersByTimeAsync(259);
    expect(landed).toBe(false);
    await vi.advanceTimersByTimeAsync(2);
    expect(landed).toBe(true);
  });
});
