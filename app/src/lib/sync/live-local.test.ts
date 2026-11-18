import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLocalLive } from './live-local.ts';
import type { Live } from './live.ts';
import type { Relayed, Who } from '../contract/live-protocol.ts';

/** Until `ok()` holds (the BroadcastChannel's messages are a task apart). */
async function until(ok: () => boolean): Promise<void> {
  for (let n = 0; n < 200 && !ok(); n++) await new Promise((r) => setTimeout(r, 5));
  expect(ok()).toBe(true);
}

describe('the demo relay (two tabs and the guest’s over a BroadcastChannel)', () => {
  const lives: Live[] = [];
  afterEach(() => {
    for (const l of lives.splice(0)) l.stop();
    vi.unstubAllGlobals();
  });
  const open = (who: Who): { live: Live; heard: Relayed[] } => {
    const live = createLocalLive(who, 'test-demo-relay-quiz');
    const heard: Relayed[] = [];
    live.on((m) => void heard.push(m));
    live.start();
    lives.push(live);
    return { live, heard };
  };

  it('passes a phrase to everyone else here, the guest’s too (presence only: nothing with nobody there)', async () => {
    vi.stubGlobal('addEventListener', () => {});
    vi.stubGlobal('removeEventListener', () => {});
    const a = open('A');
    expect(a.live.send({ kind: 'say', text: 'hi' })).toBe(false);
    const g = open('G'), b = open('B');
    await until(() => a.live.status().here.length === 2 && g.live.status().here.length === 2);
    expect(g.live.send({ kind: 'say', text: 'yo' })).toBe(true);
    expect(a.live.send({ kind: 'say', text: 'go' })).toBe(true);
    await until(() => a.heard.length === 1 && b.heard.length === 2 && g.heard.length === 1);
    expect(a.heard[0]).toMatchObject({ kind: 'say', text: 'yo', who: 'G' });
    expect(b.heard.map((m) => [m.who, (m as { text?: string }).text])).toEqual([['G', 'yo'], ['A', 'go']]);
    expect(g.heard[0]).toMatchObject({ kind: 'say', text: 'go', who: 'A' });
  });

  it('a music stage set from a clock more than MUSIC_SKEW_MS off is taken at the relay’s clock, as the relay does', async () => {
    vi.stubGlobal('addEventListener', () => {});
    vi.stubGlobal('removeEventListener', () => {});
    const a = open('A'), b = open('B');
    await until(() => a.live.status().here.length === 1 && b.live.status().here.length === 1);
    const t0 = Date.now(), late = t0 - 60_000;
    expect(a.live.send({ kind: 'music', src: 'isl', at: late, song: 'kk-march', ms: 180_000 })).toBe(true);
    await until(() => b.heard.some((m) => m.kind === 'music'));
    const m = b.heard.find((x) => x.kind === 'music') as Relayed & { at: number };
    expect(m.at).toBeGreaterThanOrEqual(t0);
    expect(m.at).toBeLessThan(t0 + 5_000);
  });

  it('すごろく: the first move at a game’s index is the room’s, a later one refused; each answered once the other tabs heard it', async () => {
    vi.stubGlobal('addEventListener', () => {});
    vi.stubGlobal('removeEventListener', () => {});
    const a = open('A'), b = open('B');
    await until(() => a.live.status().here.length === 1 && b.live.status().here.length === 1);
    const acks: string[] = [];
    for (const [w, l] of [['A', a], ['B', b]] as const) l.live.onAck!((i, ok) => void acks.push(`${w}${(i as { i: number }).i}${ok ? '+' : '-'}`));
    const g = 'sgrace0001';
    a.live.send({ kind: 'sg', g, i: 1, a: 'mp', n: 3 });
    // (the same index from B: the room's is A's, kept already)
    b.live.send({ kind: 'sg', g, i: 1, a: 'mp', n: 4 });
    a.live.send({ kind: 'sg', g, i: 2, a: 'mp', n: 5 });
    await until(() => acks.length === 3);
    expect(acks.sort()).toEqual(['A1+', 'A2+', 'B1-']);
    expect(b.heard.filter((m) => m.kind === 'sg').map((m) => [(m as { i: number }).i, (m as { n?: number }).n])).toEqual([[1, 3], [2, 5]]);
    expect(a.heard.filter((m) => m.kind === 'sg')).toEqual([]);
    // alone, a move is answered at once
    b.live.stop();
    const solo: boolean[] = [];
    a.live.onAck!((_i, ok) => void solo.push(ok));
    await until(() => a.live.status().here.length === 0);
    a.live.send({ kind: 'sg', g, i: 3, a: 'mc' });
    await until(() => solo.length === 1);
    expect(solo).toEqual([true]);
  });
});
