// ジム's acts outlive the page (gymActs.svelte.ts): an act goes out with no page attached and its answer is counted (so a
// 取り消す tapped after ボット closed is sent and resolves true: the page's undo says 取り消しました); a dead signal sends
// nothing (config.ts postAct).
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GymConfig } from '#lib/gym/config.ts';

const h = vi.hoisted(() => ({ sent: [] as unknown[], refreshed: 0, toasts: [] as string[] }));
vi.mock('#lib/gym/config.ts', async (orig) => ({
  ...(await orig<typeof import('#lib/gym/config.ts')>()),
  postAct: async (input: unknown) => (h.sent.push(input), { ok: true, changed: true, config: { ...cfg, intervalMin: 30 } })
}));
vi.mock('./summary.svelte.ts', () => ({ refresh: async () => void h.refreshed++ }));
vi.mock('#lib/ui-state/toast.svelte.ts', () => ({ toasts: { show: (t: string) => void h.toasts.push(t) } }));

const cfg = { v: 1, now: 0, rows: [], defaultDays: 4, paused: false, intervalMin: 15 } as unknown as GymConfig;

afterEach(() => vi.resetModules());

describe('gymActs', () => {
  it('sends with no page attached (ボット closed), counts the answer, takes its config, reads the dot again', async () => {
    const { acts, send, shownConfig } = await import('./gymActs.svelte.ts');
    acts.confirmed = cfg;
    const p = send({ a: 'interval', m: 30 }, false);
    expect(shownConfig()?.intervalMin).toBe(30);   // predicted at once
    expect(await p).toBe(true);                     // an undo after a close: done, not 取り消せませんでした
    expect([h.sent, acts.answered, acts.queue.length, acts.confirmed?.intervalMin, h.refreshed, h.toasts]).toEqual([[{ a: 'interval', m: 30 }], 1, 0, 30, 1, []]);
  });
  it('hands each answer to the attached page instead', async () => {
    const { acts, attach, send } = await import('./gymActs.svelte.ts');
    acts.confirmed = cfg;
    const heard: string[] = [];
    const off = attach((q) => void heard.push(q.input.a));
    await send({ a: 'pause' });
    off();
    await send({ a: 'resume' });
    expect(heard).toEqual(['pause']);
  });
});

describe('postAct', () => {
  it('sends nothing on a dead signal', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const { postAct } = await vi.importActual<typeof import('#lib/gym/config.ts')>('#lib/gym/config.ts');
    const ctl = new AbortController();
    ctl.abort();
    expect(await postAct({ a: 'pause' }, ctl.signal, 'https://x', 'k'.repeat(32))).toEqual({ ok: false, err: 'aborted', http: null });
    expect(fetch).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
