import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BotDriver, BotReply, BotTone } from '#lib/bots/types.ts';

type S = { tone: BotTone; look?: boolean };

const h = vi.hoisted(() => ({
  store: new Map<string, string>(),
  me: 'A' as string | null,
  answers: {} as Record<string, () => Promise<unknown>>,
  calls: { gym: 0, its: 0, kalori: 0 } as Record<string, number>
}));

vi.mock('#lib/sync/storage.ts', () => ({
  getStoredMe: () => h.me,
  localKV: () => ({ getItem: (k: string) => h.store.get(k) ?? null, setItem: (k: string, v: string) => void h.store.set(k, v) })
}));
const driverOf = (id: string): BotDriver<S> => ({
  fetch: () => (h.calls[id]++, h.answers[id]() as Promise<BotReply<S>>),
  parse: (x) => x as S,
  verdict: (s) => ({ tone: s.tone, w: s.tone === 'bad' ? 'failing' : 'healthy', word: '', sentence: '', needsLook: !!s.look }),
  pollMs: () => 60_000
});
vi.mock('./registry.ts', () => ({ botMeta: (id: string) => ({ id, storageKey: `k.${id}`, driver: async () => driverOf(id) }) }));

const ok = (s: S) => () => Promise.resolve({ ok: true, status: s });
const settle = () => vi.advanceTimersByTimeAsync(0);

async function load() {
  vi.resetModules();
  return import('./summary.svelte.ts');
}

beforeEach(() => {
  vi.useFakeTimers({ now: 1_800_000_000_000 });
  h.store.clear();
  h.me = 'A';
  for (const id of ['gym', 'its', 'kalori']) (h.calls[id] = 0), (h.answers[id] = ok({ tone: 'good' }));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('the dots’ reads (summary.svelte.ts)', () => {
  it('a background read at most once a minute; a focus read any time; one read a bot at a time', async () => {
    const m = await load();
    await m.refresh('gym', 'bg');
    expect(m.summaries.gym).toMatchObject({ tone: 'good', stale: false, err: null });
    await vi.advanceTimersByTimeAsync(30_000);
    await m.refresh('gym', 'bg');
    expect(h.calls.gym).toBe(1);
    await vi.advanceTimersByTimeAsync(31_000);
    await m.refresh('gym', 'bg');
    expect(h.calls.gym).toBe(2);
    await m.refresh('gym', 'focus');
    expect(h.calls.gym).toBe(3);
    let done!: (v: unknown) => void;
    h.answers.its = () => new Promise((r) => (done = r));
    const first = m.refresh('its', 'focus');
    await settle();
    void m.refresh('its', 'focus');
    await settle();
    expect(h.calls.its).toBe(1);
    done({ ok: true, status: { tone: 'warn', look: true } });
    await first;
    expect(m.summaries.its).toMatchObject({ tone: 'warn', needsLook: true });
  });

  it('none while hidden; offline marks the dot stale, keeping its tone', async () => {
    const m = await load();
    await m.refresh('gym', 'focus');
    vi.stubGlobal('document', { hidden: true });
    await m.refresh('kalori', 'focus');
    expect(h.calls.kalori).toBe(0);
    vi.stubGlobal('document', { hidden: false });
    vi.stubGlobal('navigator', { onLine: false });
    await m.refresh('gym', 'focus');
    expect(h.calls.gym).toBe(1);
    expect(m.summaries.gym).toMatchObject({ tone: 'good', stale: true });
  });

  it('a failed read keeps the last tone (stale, its code); no key: unknown', async () => {
    const m = await load();
    h.answers.its = ok({ tone: 'bad', look: true });
    await m.refresh('its', 'focus');
    h.answers.its = () => Promise.resolve({ ok: false, err: 'http', http: 502 });
    await m.refresh('its', 'focus');
    expect(m.summaries.its).toMatchObject({ tone: 'bad', needsLook: true, stale: true, err: 'http' });
    h.answers.its = () => Promise.resolve({ ok: false, err: 'no_key', http: null });
    await m.refresh('its', 'focus');
    expect(m.summaries.its).toMatchObject({ tone: 'unknown', needsLook: false, updatedAt: null });
  });

  it('the shown page’s read lets a background one go, and none starts while it runs', async () => {
    const m = await load();
    let signal: AbortSignal | undefined;
    h.answers.kalori = () => new Promise(() => {});
    const d = driverOf('kalori');
    d.fetch = (s) => ((signal = s), h.calls.kalori++, new Promise(() => {}));
    m.accept('kalori', { tone: 'good' }, d as BotDriver<unknown>);
    await vi.advanceTimersByTimeAsync(61_000);
    void m.refresh('kalori', 'bg');
    await settle();
    expect(signal?.aborted).toBe(false);
    m.pageRead('kalori', true);
    expect(signal?.aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(61_000);
    await m.refresh('kalori', 'bg');
    expect(h.calls.kalori).toBe(1);
    m.pageRead('kalori', false);
  });

  it('watch: the other tabs read now, then every 5 min while open, a dot older than 3 polls marked stale; nothing once stopped', async () => {
    const m = await load();
    const stop = m.watch(['its', 'kalori']);
    await settle();
    expect([h.calls.gym, h.calls.its, h.calls.kalori]).toEqual([0, 1, 1]);
    h.answers.its = () => Promise.resolve({ ok: false, err: 'offline', http: null });
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect([h.calls.its, h.calls.kalori]).toEqual([2, 2]);
    expect(m.summaries.its).toMatchObject({ tone: 'good', stale: true });
    stop();
    await vi.advanceTimersByTimeAsync(20 * 60_000);
    expect([h.calls.its, h.calls.kalori]).toEqual([2, 2]);
  });

  it('worstOf: the menu’s ボット over the bots asked', async () => {
    const m = await load();
    h.answers.gym = ok({ tone: 'bad', look: true });
    h.answers.kalori = ok({ tone: 'warn' });
    await Promise.all([m.refresh('gym', 'focus'), m.refresh('kalori', 'focus')]);
    expect(m.worstOf(['gym', 'kalori'])).toEqual({ tone: 'bad', needsLook: true });
    expect(m.worstOf(['kalori'])).toEqual({ tone: 'warn', needsLook: false });
    expect(m.worstOf([])).toBeNull();
  });
});

describe('the dots across a reload (lastKnown.ts)', () => {
  it('a read’s dot is kept with its status and back after a reload, stale once older than 3 polls', async () => {
    let m = await load();
    h.answers.gym = ok({ tone: 'bad', look: true });
    await m.refresh('gym', 'focus');
    expect(JSON.parse(h.store.get('k.gym')!)).toMatchObject({ me: 'A', s: { tone: 'bad' }, at: Date.now(), sum: { tone: 'bad', w: 'failing', needsLook: true, ms: 60_000 } });
    m = await load();
    expect(m.summaries.gym).toMatchObject({ tone: 'bad', w: 'failing', needsLook: true, stale: false });
    await vi.advanceTimersByTimeAsync(181_000);
    m = await load();
    expect(m.summaries.gym).toMatchObject({ tone: 'bad', stale: true });
  });

  it('an entry from before `at`/`sum` still gives its status, its dot unknown; another member’s gives neither', async () => {
    h.store.set('k.its', JSON.stringify({ me: 'A', s: { tone: 'warn' } }));
    const lk = await import('./lastKnown.ts');
    expect(lk.recall('its', (x) => x)).toEqual({ tone: 'warn' });
    expect(lk.recallSum('its')).toBeNull();
    let m = await load();
    expect(m.summaries.its.tone).toBe('unknown');
    h.store.set('k.its', JSON.stringify({ me: 'B', s: { tone: 'warn' }, at: Date.now(), sum: { tone: 'warn', w: 'late', needsLook: true, ms: 60_000 } }));
    m = await load();
    expect(m.summaries.its.tone).toBe('unknown');
    expect((await import('./lastKnown.ts')).recall('its', (x) => x)).toBeNull();
  });

  it('another member on this phone: the dots cleared, read afresh', async () => {
    const m = await load();
    h.answers.gym = ok({ tone: 'bad', look: true });
    await m.refresh('gym', 'focus');
    h.me = 'B';
    h.answers.kalori = () => new Promise(() => {});
    void m.refresh('kalori', 'focus');
    expect(m.summaries.gym.tone).toBe('unknown');
  });
});
