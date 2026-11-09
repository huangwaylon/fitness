import { afterEach, describe, expect, it, vi } from 'vitest';

const show = vi.fn();
vi.mock('./toast.svelte.ts', () => ({ toasts: { show } }));
// (reload.ts's lazy without its reload: a failed import forgotten, as there)
vi.mock('./reload.ts', () => ({
  safeReload: () => false,
  lazy: <T>(load: () => Promise<T>) => {
    let p: Promise<T> | null = null;
    return () => (p ??= load().catch((e: unknown) => ((p = null), Promise.reject(e))));
  }
}));
const { lazySheet } = await import('./lazySheet.svelte.ts');

const Sheet = (() => {}) as unknown as import('svelte').Component<{ open: boolean }, object, 'open'>;
const phone = (onLine: boolean, controller: object | null = null) => vi.stubGlobal('navigator', { onLine, serviceWorker: { controller } });
const settle = () => new Promise((r) => setTimeout(r, 0));

afterEach(() => {
  vi.unstubAllGlobals();
  show.mockReset();
});

describe('lazySheet', () => {
  it('offline with no worker: says so at once without asking for the chunk (WebKit would keep its failed preloads), then opens back online', async () => {
    const load = vi.fn(async () => ({ default: Sheet }));
    const s = lazySheet(load);
    phone(false);
    s.show();
    await settle();
    expect(load).not.toHaveBeenCalled();
    expect(show).toHaveBeenCalledTimes(1);
    expect(s.open).toBe(false);
    phone(true);
    show.mock.calls[0][2].action.run(); // もういちど
    await settle();
    expect([load.mock.calls.length, s.open, s.Sheet]).toEqual([1, true, Sheet]);
  });

  it('offline with a worker in control: asks for the chunk (its cache serves it)', async () => {
    const load = vi.fn(async () => ({ default: Sheet }));
    const s = lazySheet(load);
    phone(false, {});
    s.show();
    await settle();
    expect([load.mock.calls.length, s.open]).toEqual([1, true]);
    expect(show).not.toHaveBeenCalled();
  });

  it('once loaded, opens offline too', async () => {
    const s = lazySheet(async () => ({ default: Sheet }));
    phone(true);
    s.show();
    await settle();
    s.open = false;
    phone(false);
    s.show();
    await settle();
    expect(s.open).toBe(true);
    expect(show).not.toHaveBeenCalled();
  });

  it('show(arg): the ask kept, a new one each time (an ask while open moves it); a bare show leaves it', async () => {
    const s = lazySheet<string>(async () => ({ default: Sheet }));
    phone(true);
    s.show('lake-22');
    const first = s.ask;
    s.show('lake-22');
    s.show();
    await settle();
    expect([first?.arg, s.ask?.arg, s.ask !== first, s.open]).toEqual(['lake-22', 'lake-22', true, true]);
  });
});
