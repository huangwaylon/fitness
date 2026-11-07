// The mic session's rules (lib/mic/session.ts) against fakes: one take at a time, every way a take ends releases the
// mic and puts the audio session back, and only stop() or the VAD's end keeps the speech.
import { describe, expect, it, vi } from 'vitest';
import type { Mic } from './capture.ts';
import type { VadState } from './vad.ts';

vi.mock('#lib/sound/sound.svelte.ts', () => ({ audioCtx: () => null, micSession: () => {} }));
const { MAX_S, WAIT_S, takes } = await import('./session.ts');

function rig(o: { refuse?: boolean; gate?: Promise<void> } = {}) {
  const log: string[] = [];
  const listeners = new Map<string, () => void>();
  const timers: { f: () => void; ms: number; off: boolean }[] = [];
  let hidden = false;
  const mics: { frame: (v: VadState) => void; state: VadState; stopped: number; full: boolean }[] = [];
  const take = takes({
    ctx: () => ({}) as AudioContext,
    session: (on) => log.push(on ? 'session on' : 'session off'),
    async open(_ctx, op) {
      await o.gate;
      if (o.refuse) throw new DOMException('no', 'NotAllowedError');
      const state: VadState = { db: -100, speaking: false, heard: false, done: false, from: -1, to: -1 };
      const m = { frame: op.frame, state, stopped: 0, full: false };
      mics.push(m);
      log.push(`open ${op.maxS}`);
      const mic: Mic = { vad: state, get full() { return m.full; }, stop: () => (m.stopped++, state.heard ? new Float32Array(16_000) : null) };
      return mic;
    },
    on(type, f) {
      listeners.set(type, f);
      return () => listeners.delete(type);
    },
    hidden: () => hidden,
    timer(f, ms) {
      const t = { f, ms, off: false };
      timers.push(t);
      return () => (t.off = true);
    }
  });
  const fire = (ms: number) => timers.filter((t) => t.ms === ms && !t.off).forEach((t) => t.f());
  const speak = (m = mics.at(-1)!) => (Object.assign(m.state, { heard: true, speaking: true }), m.frame(m.state));
  return { take, log, listeners, mics, fire, speak, hide: () => ((hidden = true), listeners.get('visibilitychange')?.()) };
}

describe('a take', () => {
  it('stop(): the speech kept, the mic released, the session back, the listeners gone', async () => {
    const r = rig(), t = await r.take();
    r.speak();
    t.stop();
    expect(await t.done).toMatchObject({ s: 1 });
    expect(r.mics[0].stopped).toBe(1);
    expect(r.log).toEqual(['session on', `open ${MAX_S}`, 'session off']);
    expect(r.listeners.size).toBe(0);
  });
  it('the VAD done after speech ends it with the speech', async () => {
    const r = rig(), t = await r.take();
    r.speak();
    r.mics[0].state.done = true;
    r.mics[0].frame(r.mics[0].state);
    expect(await t.done).not.toBeNull();
  });
  it('cancel(), the app hidden and pagehide end it with nothing', async () => {
    for (const how of ['cancel', 'hide', 'pagehide'] as const) {
      const r = rig(), t = await r.take();
      r.speak();
      if (how === 'cancel') t.cancel();
      else if (how === 'hide') r.hide();
      else r.listeners.get('pagehide')!();
      expect(await t.done).toBeNull();
      expect(r.mics[0].stopped).toBe(1);
      expect(r.log.at(-1)).toBe('session off');
    }
  });
  it('the cap ends it (kept); no speech within WAIT_S ends it empty', async () => {
    const a = rig(), ta = await a.take({ maxS: 5 });
    a.speak();
    a.fire(WAIT_S * 1000);
    a.fire(5000);
    expect(await ta.done).not.toBeNull();
    const b = rig(), tb = await b.take();
    b.fire(WAIT_S * 1000);
    expect(await tb.done).toBeNull();
    expect(b.mics[0].stopped).toBe(1);
  });
  it('the buffer full ends it at the next frame', async () => {
    const r = rig(), t = await r.take();
    r.mics[0].full = true;
    r.speak();
    expect(await t.done).not.toBeNull();
  });
  it('a new take ends the one before (one mic at a time)', async () => {
    const r = rig(), first = await r.take();
    await r.take();
    expect(await first.done).toBeNull();
    expect(r.mics[0].stopped).toBe(1);
    expect(r.mics[1].stopped).toBe(0);
  });
  it('ending twice is once', async () => {
    const r = rig(), t = await r.take();
    t.cancel();
    t.stop();
    await t.done;
    expect(r.mics[0].stopped).toBe(1);
    expect(r.log.filter((l) => l === 'session off')).toHaveLength(1);
  });
  it('refused: rejects with the error, the session back', async () => {
    const r = rig({ refuse: true });
    await expect(r.take()).rejects.toMatchObject({ name: 'NotAllowedError' });
    expect(r.log).toEqual(['session on', 'session off']);
    expect(r.listeners.size).toBe(0);
  });
  it('hidden while the permission is asked: the mic let go as soon as it opens', async () => {
    let open!: () => void;
    const r = rig({ gate: new Promise((g) => (open = g)) }), pending = r.take();
    r.hide();
    open();
    const t = await pending;
    expect(await t.done).toBeNull();
    expect(r.mics[0].stopped).toBe(1);
    expect(r.log).toEqual(['session on', 'session off', `open ${MAX_S}`]);
  });
  it('hidden: never opens', async () => {
    const r = rig();
    r.hide();
    await expect(r.take()).rejects.toMatchObject({ name: 'NotSupportedError' });
    expect(r.log).toEqual([]);
  });
});
