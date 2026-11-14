import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BotDriver, BotReply, BotTone } from '#lib/bots/types.ts';

type S = { tone: BotTone; at?: number };

const h = vi.hoisted(() => ({ store: new Map<string, string>(), answer: null as null | (() => Promise<unknown>), calls: 0 }));
vi.mock('#lib/sync/storage.ts', () => ({
  getStoredMe: () => 'A',
  localKV: () => ({ getItem: (k: string) => h.store.get(k) ?? null, setItem: (k: string, v: string) => void h.store.set(k, v) })
}));
const driver: BotDriver<S> = {
  fetch: () => (h.calls++, h.answer!() as Promise<BotReply<S>>),
  parse: (x) => x as S,
  // late by the clock once past `at` (メニュー's verdictOf)
  verdict: (s, now) => (s.at !== undefined && now > s.at
    ? { tone: 'warn', w: 'late', word: '', sentence: '', needsLook: true }
    : { tone: s.tone, w: 'healthy', word: '', sentence: '', needsLook: false }),
  pollMs: () => 60_000
};
vi.mock('./registry.ts', () => ({ botMeta: (id: string) => ({ id, storageKey: `k.${id}`, driver: async () => driver }) }));

const settle = () => vi.advanceTimersByTimeAsync(0);

async function load() {
  vi.resetModules();
  const [{ useBot }, summary] = await Promise.all([import('./useBot.svelte.ts'), import('./summary.svelte.ts')]);
  return { useBot, summary };
}

beforeEach(() => {
  vi.useFakeTimers({ now: 1_800_000_000_000 });
  vi.stubGlobal('document', { hidden: false, addEventListener: () => {}, removeEventListener: () => {} });
  h.store.clear();
  h.calls = 0;
  h.answer = () => Promise.resolve({ ok: true, status: { tone: 'good' } });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useBot (a bot page’s status)', () => {
  it('reads on mount, then every poll; a good read sets the dot; a failed one keeps the status, its code, 更新中', async () => {
    const { useBot, summary } = await load();
    let bot!: ReturnType<typeof useBot<S>>;
    bot = useBot('gym', driver);
    const stop = bot.poll.start();
    await settle();
    expect([h.calls, bot.data, bot.fresh, bot.stale]).toEqual([1, { tone: 'good' }, true, false]);
    expect(summary.summaries.gym).toMatchObject({ tone: 'good', err: null });
    h.answer = () => Promise.resolve({ ok: false, err: 'http', http: 500 });
    await vi.advanceTimersByTimeAsync(60_000);
    expect([h.calls, bot.failed, bot.data]).toEqual([2, 'http 500', { tone: 'good' }]);
    expect(summary.summaries.gym).toMatchObject({ tone: 'good', stale: true, err: 'http' });
    stop();
    await vi.advanceTimersByTimeAsync(120_000);
    expect(h.calls).toBe(2);
  });

  it('the kept status at once (not fresh: 更新中 while the read is on its way)', async () => {
    h.store.set('k.kalori', JSON.stringify({ me: 'A', s: { tone: 'bad' } }));
    const { useBot } = await load();
    h.answer = () => new Promise(() => {});
    let bot!: ReturnType<typeof useBot<S>>;
    bot = useBot('kalori', driver);
    const stop = bot.poll.start();
    expect([bot.data, bot.fresh, bot.stale]).toEqual([{ tone: 'bad' }, false, true]);
    stop();
  });

  it('no first read when the bot was read well in the last 10 s (the menu’s read): that status, fresh', async () => {
    const { useBot, summary } = await load();
    await summary.refresh('its', 'focus');
    expect(h.calls).toBe(1);
    await vi.advanceTimersByTimeAsync(5_000);
    const onRead = vi.fn();
    let bot!: ReturnType<typeof useBot<S>>;
    bot = useBot('its', driver, { onRead });
    const stop = bot.poll.start();
    await settle();
    expect([h.calls, bot.fresh, bot.data, onRead.mock.calls.length]).toEqual([1, true, { tone: 'good' }, 1]);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(h.calls).toBe(2);
    stop();
    // older than 10 s: the page reads
    await vi.advanceTimersByTimeAsync(11_000);
    const stop2 = useBot('its', driver).poll.start();
    await settle();
    expect(h.calls).toBe(3);
    stop2();
  });
});

describe('the minute’s re-weighing (summary retone)', () => {
  it('a read verdict weighed again on the clock: late once past its time, no read', async () => {
    const { summary } = await load();
    h.answer = () => Promise.resolve({ ok: true, status: { tone: 'good', at: Date.now() + 90_000 } });
    await summary.refresh('kalori', 'focus');
    expect(summary.summaries.kalori).toMatchObject({ tone: 'good', needsLook: false });
    summary.retone(Date.now() + 100_000);
    expect(summary.summaries.kalori).toMatchObject({ tone: 'warn', w: 'late', needsLook: true });
    expect(h.calls).toBe(1);
  });
});
