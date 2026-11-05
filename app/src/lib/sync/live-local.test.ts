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

  it('passes a quiz op to everyone else here, the guest’s too (presence only: nothing with nobody there)', async () => {
    vi.stubGlobal('addEventListener', () => {});
    vi.stubGlobal('removeEventListener', () => {});
    const a = open('A');
    expect(a.live.send({ kind: 'quiz', g: 'k3x9a2', op: 'open', seed: 7, lv: 1, same: false })).toBe(false);
    const g = open('G'), b = open('B');
    await until(() => a.live.status().here.length === 2 && g.live.status().here.length === 2);
    expect(g.live.send({ kind: 'quiz', g: 'k3x9a2', op: 'join' })).toBe(true);
    expect(a.live.send({ kind: 'quiz', g: 'k3x9a2', op: 'go', at: 5 })).toBe(true);
    await until(() => a.heard.length === 1 && b.heard.length === 2 && g.heard.length === 1);
    expect(a.heard[0]).toMatchObject({ kind: 'quiz', op: 'join', who: 'G' });
    expect(b.heard.map((m) => [m.who, (m as { op?: string }).op])).toEqual([['G', 'join'], ['A', 'go']]);
    expect(g.heard[0]).toMatchObject({ kind: 'quiz', op: 'go', at: 5, who: 'A' });
  });
});
