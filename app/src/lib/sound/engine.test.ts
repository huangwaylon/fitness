// The Web Audio engine's lifecycle against a small fake AudioContext and <audio> (docs/design.md#engine-lifecycle): the decks' fades and
// pauses, the idle suspend, the listeners a wait leaves behind, and the ambience on pause. Fake timers throughout.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDLE_SUSPEND_MS } from './session.ts';
import type { MusicTrack } from './hourly.ts';

class FakeParam {
  value: number;
  constructor(v = 1) {
    this.value = v;
  }
  setValueAtTime(v: number) {
    this.value = v;
  }
  linearRampToValueAtTime(v: number) {
    this.value = v;
  }
  setTargetAtTime(v: number) {
    this.value = v;
  }
  cancelScheduledValues() {}
}

class FakeNode {
  gain = new FakeParam();
  frequency = new FakeParam(20000);
  Q = new FakeParam();
  type = '';
  connected = 0;
  connect<T>(n: T): T {
    this.connected++;
    return n;
  }
  disconnect() {
    this.connected = 0;
  }
}

class FakeSource extends FakeNode {
  buffer: unknown = null;
  loop = false;
  playbackRate = new FakeParam();
  onended: (() => void) | null = null;
  stopped: number | 'now' | null = null;
  start() {}
  stop(at?: number) {
    this.stopped = at ?? 'now';
  }
}

class FakeContext {
  static last: FakeContext;
  state: AudioContextState = 'running';
  currentTime = 0;
  sampleRate = 8000;
  destination = new FakeNode();
  suspends = 0;
  sources: FakeSource[] = [];
  #listeners: (() => void)[] = [];
  constructor() {
    FakeContext.last = this;
  }
  createGain() {
    return new FakeNode();
  }
  createBiquadFilter() {
    return new FakeNode();
  }
  createBufferSource() {
    const s = new FakeSource();
    this.sources.push(s);
    return s;
  }
  createBuffer(_c: number, n: number) {
    const data = new Float32Array(n);
    return { duration: n / this.sampleRate, getChannelData: () => data };
  }
  createMediaElementSource() {
    return new FakeNode();
  }
  async decodeAudioData() {
    return this.createBuffer(1, 8000);
  }
  addEventListener(_t: string, f: () => void) {
    this.#listeners.push(f);
  }
  async resume() {
    this.state = 'running';
    this.#listeners.forEach((f) => f());
  }
  async suspend() {
    this.suspends++;
    this.state = 'suspended';
  }
}

class FakeAudio {
  static all: FakeAudio[] = [];
  paused = true;
  src = '';
  loop = false;
  preload = '';
  readyState = 0;
  currentTime = 0;
  duration = 120;
  disableRemotePlayback = false;
  listeners = new Map<string, Set<() => void>>();
  constructor() {
    FakeAudio.all.push(this);
  }
  setAttribute() {}
  addEventListener(type: string, f: () => void, o?: { once?: boolean; signal?: AbortSignal }) {
    const set = this.listeners.get(type) ?? new Set();
    this.listeners.set(type, set);
    const g = o?.once ? () => (set.delete(g), f()) : f;
    set.add(g);
    o?.signal?.addEventListener('abort', () => set.delete(g));
  }
  fire(type: string) {
    for (const f of [...(this.listeners.get(type) ?? [])]) f();
  }
  count(type: string) {
    return this.listeners.get(type)?.size ?? 0;
  }
  play() {
    this.paused = false;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
  load() {}
}

const doc = { hidden: false, addEventListener() {}, removeEventListener() {} };

beforeEach(() => {
  vi.useFakeTimers();
  FakeAudio.all = [];
  doc.hidden = false;
  vi.stubGlobal('window', { AudioContext: FakeContext });
  vi.stubGlobal('document', doc);
  vi.stubGlobal('Audio', FakeAudio);
  vi.stubGlobal('navigator', {});
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, blob: async () => new Blob(['x']), arrayBuffer: async () => new ArrayBuffer(8) })));
  let n = 0;
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:${++n}`);
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const OPENING: MusicTrack = { file: 'music/opening.m4a', start: 0 };
const HOUR: MusicTrack = { file: 'music/hour-10.m4a', start: 0 };

/** An engine unlocked by a tap with ミュージック on (the context and the two decks). */
async function unlocked() {
  const { Engine } = await import('./engine.ts');
  const e = new Engine();
  e.unlock(true);
  await vi.advanceTimersByTimeAsync(0);
  for (const a of FakeAudio.all) a.readyState = 1; // the files' metadata is known at once
  return { e, ctx: FakeContext.last, decks: FakeAudio.all };
}

/** Settle a track change: the fetch, the seek and the fade-in's start. */
const settle = () => vi.advanceTimersByTimeAsync(1000);

describe('decks', () => {
  it('a fade-out’s delayed pause never stops the deck once it holds a track again (the same key after a quick off/on)', async () => {
    const { e, decks } = await unlocked();
    void e.setTrack('opening', OPENING, false);
    await settle();
    const deck = decks.find((d) => !d.paused)!;
    void e.setTrack('10', HOUR); // the opening fades out on its deck (pause ≈ 3 s later)
    await vi.advanceTimersByTimeAsync(500);
    void e.setTrack('opening', OPENING, false); // back within the fade: the flip puts it on the same deck
    await settle();
    expect(e.track).toBe('opening');
    await vi.advanceTimersByTimeAsync(5000);
    expect(deck.paused).toBe(false);
  });

  it('a faded-out deck is paused after its fade', async () => {
    const { e, decks } = await unlocked();
    void e.setTrack('opening', OPENING, false);
    await settle();
    const deck = decks.find((d) => !d.paused)!;
    e.stopMusic();
    await vi.advanceTimersByTimeAsync(1000);
    expect(deck.paused).toBe(true);
    expect(e.track).toBeNull();
  });

  it('waiting for a file’s metadata leaves no listener behind on the deck', async () => {
    const { e, decks } = await unlocked();
    for (const a of decks) a.readyState = 0;
    const done = e.setTrack('10', HOUR);
    await vi.advanceTimersByTimeAsync(0);
    const deck = decks.find((d) => d.count('loadedmetadata') > 0)!;
    expect(deck.count('error')).toBe(1);
    deck.fire('loadedmetadata');
    await done;
    expect([deck.count('loadedmetadata'), deck.count('error')]).toEqual([0, 0]);
  });
});

describe('the idle suspend', () => {
  it('a track held from outside (⏸ on the lock screen) lets the context sleep; the playing one never does', async () => {
    const { e, ctx } = await unlocked();
    void e.setTrack('10', HOUR);
    await settle();
    await vi.advanceTimersByTimeAsync(IDLE_SUSPEND_MS * 2);
    expect(ctx.suspends).toBe(0);
    e.holdMusic();
    await vi.advanceTimersByTimeAsync(IDLE_SUSPEND_MS + 500);
    expect(ctx.suspends).toBe(1);
    expect(e.track).toBe('10'); // kept: the next tap brings it back
    expect(e.needsUnlock(true)).toBe(true);
  });
});

describe('pause', () => {
  it('suspends at once and pauses both decks', async () => {
    const { e, ctx, decks } = await unlocked();
    void e.setTrack('10', HOUR);
    await settle();
    e.pause();
    expect(ctx.state).toBe('suspended');
    expect(decks.every((d) => d.paused)).toBe(true);
    expect(e.track).toBe('10'); // the place is kept for the way back
  });
});

describe('ambience', () => {
  it('pause() stops the layers at once (a suspended clock would freeze their fade); a failed decode is tried again', async () => {
    const { AUDIO } = await import('./manifest.ts');
    const ambient = AUDIO.ambient as Record<string, string>;
    ambient.waves = 'ambient/waves.m4a';
    try {
      const { e, ctx } = await unlocked();
      const fetches = vi.mocked(fetch);
      fetches.mockImplementationOnce(async () => ({ ok: false }) as Response); // offline
      await e.setAmbient([{ id: 'waves', gain: 0.5 }]);
      const n = ctx.sources.length;
      await e.setAmbient([{ id: 'waves', gain: 0.5 }]); // the next change tries the file again
      const layer = ctx.sources.slice(n).find((s) => s.loop)!;
      expect(layer).toBeDefined();
      e.pause();
      expect(layer.stopped).toBe('now');
      layer.onended?.();
    } finally {
      delete ambient.waves;
    }
  });
});
