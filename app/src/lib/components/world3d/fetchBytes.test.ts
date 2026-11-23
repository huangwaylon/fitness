import { afterEach, describe, expect, it, vi } from 'vitest';
import { ANSWER_MS, fetchBytes } from './fetchBytes.ts';

describe("a model's or texture's file (fetchBytes)", () => {
  afterEach(() => (vi.unstubAllGlobals(), vi.useRealTimers()));

  it('gives up a request with no answer in ANSWER_MS (lie-fi), its fetch aborted', async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    vi.stubGlobal('fetch', (_: string, o: RequestInit) => new Promise((_ok, no) => ((signal = o.signal!), signal.addEventListener('abort', () => no(signal!.reason)))));
    const p = fetchBytes('room/world3d/a.glb');
    const said = expect(p).rejects.toThrow(/no answer/);
    vi.advanceTimersByTime(ANSWER_MS - 1);
    expect(signal?.aborted).toBe(false);
    vi.advanceTimersByTime(1);
    await said;
    expect(signal?.aborted).toBe(true);
  });

  it('reads an answer begun in time however long its body takes, and rejects a failed one', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', async () => ({ ok: true, arrayBuffer: () => new Promise((ok) => setTimeout(() => ok(new ArrayBuffer(3)), ANSWER_MS * 3)) }));
    const p = fetchBytes('room/world3d/a.glb');
    await vi.advanceTimersByTimeAsync(ANSWER_MS * 3);
    expect((await p).byteLength).toBe(3);
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 404 }));
    await expect(fetchBytes('room/world3d/b.glb')).rejects.toThrow(/404/);
    expect(vi.getTimerCount()).toBe(0);
  });
});
